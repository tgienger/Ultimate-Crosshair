/* */ 
(function(process) {
  var assert = require("assert");
  var crypto = require("crypto");
  var fs = require("graceful-fs");
  var path = require("path");
  var url = require("url");
  var chownr = require("chownr");
  var dezalgo = require("dezalgo");
  var hostedFromURL = require("hosted-git-info").fromUrl;
  var inflight = require("inflight");
  var log = require("npmlog");
  var mkdir = require("mkdirp");
  var normalizeGitUrl = require("normalize-git-url");
  var npa = require("npm-package-arg");
  var realizePackageSpecifier = require("realize-package-specifier");
  var addLocal = require("./add-local");
  var correctMkdir = require("../utils/correct-mkdir");
  var git = require("../utils/git");
  var npm = require("../npm");
  var rm = require("../utils/gently-rm");
  var remotes = path.resolve(npm.config.get('cache'), '_git-remotes');
  var templates = path.join(remotes, '_templates');
  var VALID_VARIABLES = ['GIT_ASKPASS', 'GIT_PROXY_COMMAND', 'GIT_SSH', 'GIT_SSH_COMMAND', 'GIT_SSL_CAINFO', 'GIT_SSL_NO_VERIFY'];
  module.exports = addRemoteGit;
  function addRemoteGit(uri, _cb) {
    assert(typeof uri === 'string', 'must have git URL');
    assert(typeof _cb === 'function', 'must have callback');
    var cb = dezalgo(_cb);
    log.verbose('addRemoteGit', 'caching', uri);
    var parsed = hostedFromURL(uri);
    if (parsed) {
      var from;
      if (parsed.type === 'github' && parsed.default === 'shortcut') {
        from = parsed.path();
      } else {
        from = parsed.toString();
      }
      log.verbose('addRemoteGit', from, 'is a repository hosted by', parsed.type);
      if (parsed.default !== 'shortcut') {
        return tryClone(from, parsed.toString(), false, cb);
      }
      tryGitProto(from, parsed, cb);
    } else {
      parsed = npa(uri);
      if (parsed.type !== 'git') {
        return cb(new Error(uri + 'is not a Git or GitHub URL'));
      }
      tryClone(parsed.rawSpec, uri, false, cb);
    }
  }
  function tryGitProto(from, hostedInfo, cb) {
    var gitURL = hostedInfo.git();
    if (!gitURL)
      return trySSH(from, hostedInfo, cb);
    log.silly('tryGitProto', 'attempting to clone', gitURL);
    tryClone(from, gitURL, true, function(er) {
      if (er)
        return tryHTTPS(from, hostedInfo, cb);
      cb.apply(this, arguments);
    });
  }
  function tryHTTPS(from, hostedInfo, cb) {
    var httpsURL = hostedInfo.https();
    if (!httpsURL) {
      return cb(new Error(from + ' can not be cloned via Git, SSH, or HTTPS'));
    }
    log.silly('tryHTTPS', 'attempting to clone', httpsURL);
    tryClone(from, httpsURL, true, function(er) {
      if (er)
        return trySSH(from, hostedInfo, cb);
      cb.apply(this, arguments);
    });
  }
  function trySSH(from, hostedInfo, cb) {
    var sshURL = hostedInfo.ssh();
    if (!sshURL)
      return tryHTTPS(from, hostedInfo, cb);
    log.silly('trySSH', 'attempting to clone', sshURL);
    tryClone(from, sshURL, false, cb);
  }
  function tryClone(from, combinedURL, silent, cb) {
    log.silly('tryClone', 'cloning', from, 'via', combinedURL);
    var normalized = normalizeGitUrl(combinedURL);
    var cloneURL = normalized.url;
    var treeish = normalized.branch;
    var repoID = cloneURL.replace(/[^a-zA-Z0-9]+/g, '-') + '-' + crypto.createHash('sha1').update(combinedURL).digest('hex').slice(0, 8);
    var cachedRemote = path.join(remotes, repoID);
    cb = inflight(repoID, cb);
    if (!cb) {
      return log.verbose('tryClone', repoID, 'already in flight; waiting');
    }
    log.verbose('tryClone', repoID, 'not in flight; caching');
    getGitDir(function(er) {
      if (er)
        return cb(er);
      fs.stat(cachedRemote, function(er, s) {
        if (er)
          return mirrorRemote(from, cloneURL, treeish, cachedRemote, silent, finish);
        if (!s.isDirectory())
          return resetRemote(from, cloneURL, treeish, cachedRemote, finish);
        validateExistingRemote(from, cloneURL, treeish, cachedRemote, finish);
      });
      function finish(er, data) {
        if (er)
          return cb(er, data);
        addModeRecursive(cachedRemote, npm.modes.file, function(er) {
          return cb(er, data);
        });
      }
    });
  }
  function resetRemote(from, cloneURL, treeish, cachedRemote, cb) {
    log.info('resetRemote', 'resetting', cachedRemote, 'for', from);
    rm(cachedRemote, function(er) {
      if (er)
        return cb(er);
      mirrorRemote(from, cloneURL, treeish, cachedRemote, false, cb);
    });
  }
  function validateExistingRemote(from, cloneURL, treeish, cachedRemote, cb) {
    git.whichAndExec(['config', '--get', 'remote.origin.url'], {
      cwd: cachedRemote,
      env: gitEnv()
    }, function(er, stdout, stderr) {
      var originURL;
      if (stdout) {
        originURL = stdout.trim();
        log.silly('validateExistingRemote', from, 'remote.origin.url:', originURL);
      }
      if (stderr)
        stderr = stderr.trim();
      if (stderr || er) {
        log.warn('addRemoteGit', from, 'resetting remote', cachedRemote, 'because of error:', stderr || er);
        return resetRemote(from, cloneURL, treeish, cachedRemote, cb);
      } else if (cloneURL !== originURL) {
        log.warn('addRemoteGit', from, 'pre-existing cached repo', cachedRemote, 'points to', originURL, 'and not', cloneURL);
        return resetRemote(from, cloneURL, treeish, cachedRemote, cb);
      }
      log.verbose('validateExistingRemote', from, 'is updating existing cached remote', cachedRemote);
      updateRemote(from, cloneURL, treeish, cachedRemote, cb);
    });
  }
  function mirrorRemote(from, cloneURL, treeish, cachedRemote, silent, cb) {
    mkdir(cachedRemote, function(er) {
      if (er)
        return cb(er);
      var args = ['clone', '--template=' + templates, '--mirror', cloneURL, cachedRemote];
      git.whichAndExec(['clone', '--template=' + templates, '--mirror', cloneURL, cachedRemote], {
        cwd: cachedRemote,
        env: gitEnv()
      }, function(er, stdout, stderr) {
        if (er) {
          var combined = (stdout + '\n' + stderr).trim();
          var command = 'git ' + args.join(' ') + ':';
          if (silent) {
            log.verbose(command, combined);
          } else {
            log.error(command, combined);
          }
          return cb(er);
        }
        log.verbose('mirrorRemote', from, 'git clone ' + cloneURL, stdout.trim());
        setPermissions(from, cloneURL, treeish, cachedRemote, cb);
      });
    });
  }
  function setPermissions(from, cloneURL, treeish, cachedRemote, cb) {
    if (process.platform === 'win32') {
      log.verbose('setPermissions', from, 'skipping chownr on Windows');
      resolveHead(from, cloneURL, treeish, cachedRemote, cb);
    } else {
      getGitDir(function(er, cs) {
        if (er) {
          log.error('setPermissions', from, 'could not get cache stat');
          return cb(er);
        }
        chownr(cachedRemote, cs.uid, cs.gid, function(er) {
          if (er) {
            log.error('setPermissions', 'Failed to change git repository ownership under npm cache for', cachedRemote);
            return cb(er);
          }
          log.verbose('setPermissions', from, 'set permissions on', cachedRemote);
          resolveHead(from, cloneURL, treeish, cachedRemote, cb);
        });
      });
    }
  }
  function updateRemote(from, cloneURL, treeish, cachedRemote, cb) {
    git.whichAndExec(['fetch', '-a', 'origin'], {
      cwd: cachedRemote,
      env: gitEnv()
    }, function(er, stdout, stderr) {
      if (er) {
        var combined = (stdout + '\n' + stderr).trim();
        log.error('git fetch -a origin (' + cloneURL + ')', combined);
        return cb(er);
      }
      log.verbose('updateRemote', 'git fetch -a origin (' + cloneURL + ')', stdout.trim());
      setPermissions(from, cloneURL, treeish, cachedRemote, cb);
    });
  }
  function resolveHead(from, cloneURL, treeish, cachedRemote, cb) {
    log.verbose('resolveHead', from, 'original treeish:', treeish);
    var args = ['rev-list', '-n1', treeish];
    git.whichAndExec(args, {
      cwd: cachedRemote,
      env: gitEnv()
    }, function(er, stdout, stderr) {
      if (er) {
        log.error('git ' + args.join(' ') + ':', stderr);
        return cb(er);
      }
      var resolvedTreeish = stdout.trim();
      log.silly('resolveHead', from, 'resolved treeish:', resolvedTreeish);
      var resolvedURL = getResolved(cloneURL, resolvedTreeish);
      if (!resolvedURL) {
        return cb(new Error('unable to clone ' + from + ' because git clone string ' + cloneURL + ' is in a form npm can\'t handle'));
      }
      log.verbose('resolveHead', from, 'resolved Git URL:', resolvedURL);
      var tmpdir = path.join(npm.tmp, 'git-cache-' + crypto.pseudoRandomBytes(6).toString('hex'), resolvedTreeish);
      log.silly('resolveHead', 'Git working directory:', tmpdir);
      mkdir(tmpdir, function(er) {
        if (er)
          return cb(er);
        cloneResolved(from, resolvedURL, resolvedTreeish, cachedRemote, tmpdir, cb);
      });
    });
  }
  function cloneResolved(from, resolvedURL, resolvedTreeish, cachedRemote, tmpdir, cb) {
    var args = ['clone', cachedRemote, tmpdir];
    git.whichAndExec(args, {
      cwd: cachedRemote,
      env: gitEnv()
    }, function(er, stdout, stderr) {
      stdout = (stdout + '\n' + stderr).trim();
      if (er) {
        log.error('git ' + args.join(' ') + ':', stderr);
        return cb(er);
      }
      log.verbose('cloneResolved', from, 'clone', stdout);
      checkoutTreeish(from, resolvedURL, resolvedTreeish, tmpdir, cb);
    });
  }
  function checkoutTreeish(from, resolvedURL, resolvedTreeish, tmpdir, cb) {
    var args = ['checkout', resolvedTreeish];
    git.whichAndExec(args, {
      cwd: tmpdir,
      env: gitEnv()
    }, function(er, stdout, stderr) {
      stdout = (stdout + '\n' + stderr).trim();
      if (er) {
        log.error('git ' + args.join(' ') + ':', stderr);
        return cb(er);
      }
      log.verbose('checkoutTreeish', from, 'checkout', stdout);
      realizePackageSpecifier(tmpdir, function(er, spec) {
        if (er) {
          log.error('addRemoteGit', 'Failed to map', tmpdir, 'to a package specifier');
          return cb(er);
        }
        addLocal(spec, null, function(er, data) {
          if (data) {
            if (npm.config.get('save-exact')) {
              log.verbose('addRemoteGit', 'data._from:', resolvedURL, '(save-exact)');
              data._from = resolvedURL;
            } else {
              log.verbose('addRemoteGit', 'data._from:', from);
              data._from = from;
            }
            log.verbose('addRemoteGit', 'data._resolved:', resolvedURL);
            data._resolved = resolvedURL;
          }
          cb(er, data);
        });
      });
    });
  }
  function getGitDir(cb) {
    correctMkdir(remotes, function(er, stats) {
      if (er)
        return cb(er);
      mkdir(templates, function(er) {
        if (er)
          return cb(er);
        fs.chown(templates, stats.uid, stats.gid, function(er) {
          cb(er, stats);
        });
      });
    });
  }
  var gitEnv_;
  function gitEnv() {
    if (gitEnv_)
      return gitEnv_;
    gitEnv_ = {GIT_ASKPASS: 'echo'};
    for (var k in process.env) {
      if (!~VALID_VARIABLES.indexOf(k) && k.match(/^GIT/))
        continue;
      gitEnv_[k] = process.env[k];
    }
    return gitEnv_;
  }
  addRemoteGit.getResolved = getResolved;
  function getResolved(uri, treeish) {
    var rehydrated = hostedFromURL(uri);
    if (rehydrated)
      uri = rehydrated.toString();
    var parsed = url.parse(uri);
    if (!parsed.protocol || !parsed.protocol.match(/^(((git\+)?(https?|ssh))|git|file):$/)) {
      uri = 'git+ssh://' + uri;
    }
    if (!/^git[+:]/.test(uri)) {
      uri = 'git+' + uri;
    }
    return uri.replace(/(?:#.*)?$/, '#' + treeish);
  }
  function addModeRecursive(cachedRemote, mode, cb) {
    fs.readdir(cachedRemote, function(er, children) {
      if (er && er.code !== 'ENOTDIR')
        return cb(er);
      if (er || !children.length)
        return addMode(cachedRemote, mode, cb);
      var len = children.length;
      var errState = null;
      children.forEach(function(child) {
        addModeRecursive(path.resolve(cachedRemote, child), mode, then);
      });
      function then(er) {
        if (errState)
          return undefined;
        if (er)
          return cb(errState = er);
        if (--len === 0)
          return addMode(cachedRemote, dirMode(mode), cb);
      }
    });
  }
  function addMode(cachedRemote, mode, cb) {
    fs.stat(cachedRemote, function(er, stats) {
      if (er)
        return cb(er);
      mode = stats.mode | mode;
      fs.chmod(cachedRemote, mode, cb);
    });
  }
  function dirMode(mode) {
    if (mode & parseInt('0400', 8))
      mode |= parseInt('0100', 8);
    if (mode & parseInt('040', 8))
      mode |= parseInt('010', 8);
    if (mode & parseInt('04', 8))
      mode |= parseInt('01', 8);
    return mode;
  }
})(require("process"));
