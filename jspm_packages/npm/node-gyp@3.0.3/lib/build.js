/* */ 
(function(process) {
  module.exports = exports = build;
  var fs = require("graceful-fs"),
      rm = require("rimraf"),
      path = require("path"),
      glob = require("glob"),
      log = require("npmlog"),
      which = require("which"),
      mkdirp = require("mkdirp"),
      exec = require("child_process").exec,
      processRelease = require("./process-release"),
      win = process.platform == 'win32';
  exports.usage = 'Invokes `' + (win ? 'msbuild' : 'make') + '` and builds the module';
  function build(gyp, argv, callback) {
    var release = processRelease(argv, gyp, process.version, process.release),
        makeCommand = gyp.opts.make || process.env.MAKE || (process.platform.indexOf('bsd') != -1 && process.platform.indexOf('kfreebsd') == -1 ? 'gmake' : 'make'),
        command = win ? 'msbuild' : makeCommand,
        buildDir = path.resolve('build'),
        configPath = path.resolve(buildDir, 'config.gypi'),
        jobs = gyp.opts.jobs || process.env.JOBS,
        buildType,
        config,
        arch,
        nodeDir,
        copyDevLib;
    loadConfigGypi();
    function loadConfigGypi() {
      fs.readFile(configPath, 'utf8', function(err, data) {
        if (err) {
          if (err.code == 'ENOENT') {
            callback(new Error('You must run `node-gyp configure` first!'));
          } else {
            callback(err);
          }
          return;
        }
        config = JSON.parse(data.replace(/\#.+\n/, ''));
        buildType = config.target_defaults.default_configuration;
        arch = config.variables.target_arch;
        nodeDir = config.variables.nodedir;
        copyDevLib = config.variables.copy_dev_lib == 'true';
        if ('debug' in gyp.opts) {
          buildType = gyp.opts.debug ? 'Debug' : 'Release';
        }
        if (!buildType) {
          buildType = 'Release';
        }
        log.verbose('build type', buildType);
        log.verbose('architecture', arch);
        log.verbose('node dev dir', nodeDir);
        if (win) {
          findSolutionFile();
        } else {
          doWhich();
        }
      });
    }
    function findSolutionFile() {
      glob('build/*.sln', function(err, files) {
        if (err)
          return callback(err);
        if (files.length === 0) {
          return callback(new Error('Could not find *.sln file. Did you run "configure"?'));
        }
        guessedSolution = files[0];
        log.verbose('found first Solution file', guessedSolution);
        doWhich();
      });
    }
    function doWhich() {
      which(command, function(err, execPath) {
        if (err) {
          if (win && /not found/.test(err.message)) {
            findMsbuild();
          } else {
            callback(err);
          }
          return;
        }
        log.verbose('`which` succeeded for `' + command + '`', execPath);
        copyNodeLib();
      });
    }
    function findMsbuild() {
      log.verbose('could not find "msbuild.exe" in PATH - finding location in registry');
      var notfoundErr = new Error('Can\'t find "msbuild.exe". Do you have Microsoft Visual Studio C++ 2008+ installed?');
      var cmd = 'reg query "HKLM\\Software\\Microsoft\\MSBuild\\ToolsVersions" /s';
      if (process.arch !== 'ia32')
        cmd += ' /reg:32';
      exec(cmd, function(err, stdout, stderr) {
        var reVers = /ToolsVersions\\([^\\]+)$/i,
            rePath = /\r\n[ \t]+MSBuildToolsPath[ \t]+REG_SZ[ \t]+([^\r]+)/i,
            msbuilds = [],
            r,
            msbuildPath;
        if (err) {
          return callback(notfoundErr);
        }
        stdout.split('\r\n\r\n').forEach(function(l) {
          if (!l)
            return;
          l = l.trim();
          if (r = reVers.exec(l.substring(0, l.indexOf('\r\n')))) {
            var ver = parseFloat(r[1], 10);
            if (ver >= 3.5) {
              if (r = rePath.exec(l)) {
                msbuilds.push({
                  version: ver,
                  path: r[1]
                });
              }
            }
          }
        });
        msbuilds.sort(function(x, y) {
          return (x.version < y.version ? -1 : 1);
        });
        ;
        (function verifyMsbuild() {
          if (!msbuilds.length)
            return callback(notfoundErr);
          msbuildPath = path.resolve(msbuilds.pop().path, 'msbuild.exe');
          fs.stat(msbuildPath, function(err, stat) {
            if (err) {
              if (err.code == 'ENOENT') {
                if (msbuilds.length) {
                  return verifyMsbuild();
                } else {
                  callback(notfoundErr);
                }
              } else {
                callback(err);
              }
              return;
            }
            command = msbuildPath;
            copyNodeLib();
          });
        })();
      });
    }
    function copyNodeLib() {
      if (!win || !copyDevLib)
        return doBuild();
      var buildDir = path.resolve(nodeDir, buildType),
          archNodeLibPath = path.resolve(nodeDir, arch, release.name + '.lib'),
          buildNodeLibPath = path.resolve(buildDir, release.name + '.lib');
      mkdirp(buildDir, function(err, isNew) {
        if (err)
          return callback(err);
        log.verbose('"' + buildType + '" dir needed to be created?', isNew);
        var rs = fs.createReadStream(archNodeLibPath),
            ws = fs.createWriteStream(buildNodeLibPath);
        log.verbose('copying "' + release.name + '.lib" for ' + arch, buildNodeLibPath);
        rs.pipe(ws);
        rs.on('error', callback);
        ws.on('error', callback);
        rs.on('end', doBuild);
      });
    }
    function doBuild() {
      var verbose = log.levels[log.level] <= log.levels.verbose;
      if (!win && verbose) {
        argv.push('V=1');
      }
      if (win && !verbose) {
        argv.push('/clp:Verbosity=minimal');
      }
      if (win) {
        argv.push('/nologo');
      }
      if (win) {
        var p = arch === 'x64' ? 'x64' : 'Win32';
        argv.push('/p:Configuration=' + buildType + ';Platform=' + p);
        if (jobs) {
          var j = parseInt(jobs, 10);
          if (!isNaN(j) && j > 0) {
            argv.push('/m:' + j);
          } else if (jobs.toUpperCase() === 'MAX') {
            argv.push('/m:' + require("os").cpus().length);
          }
        }
      } else {
        argv.push('BUILDTYPE=' + buildType);
        argv.push('-C');
        argv.push('build');
        if (jobs) {
          var j = parseInt(jobs, 10);
          if (!isNaN(j) && j > 0) {
            argv.push('--jobs');
            argv.push(j);
          } else if (jobs.toUpperCase() === 'MAX') {
            argv.push('--jobs');
            argv.push(require("os").cpus().length);
          }
        }
      }
      if (win) {
        var hasSln = argv.some(function(arg) {
          return path.extname(arg) == '.sln';
        });
        if (!hasSln) {
          argv.unshift(gyp.opts.solution || guessedSolution);
        }
      }
      var proc = gyp.spawn(command, argv);
      proc.on('exit', onExit);
    }
    function onExit(code, signal) {
      if (code !== 0) {
        return callback(new Error('`' + command + '` failed with exit code: ' + code));
      }
      if (signal) {
        return callback(new Error('`' + command + '` got signal: ' + signal));
      }
      callback();
    }
  }
})(require("process"));
