/* */ 
(function(process) {
  exports = module.exports = cache;
  cache.unpack = unpack;
  cache.clean = clean;
  cache.read = read;
  var npm = require("./npm"),
      fs = require("graceful-fs"),
      writeFileAtomic = require("write-file-atomic"),
      assert = require("assert"),
      rm = require("./utils/gently-rm"),
      readJson = require("read-package-json"),
      log = require("npmlog"),
      path = require("path"),
      asyncMap = require("slide").asyncMap,
      tar = require("./utils/tar"),
      fileCompletion = require("./utils/completion/file-completion"),
      deprCheck = require("./utils/depr-check"),
      addNamed = require("./cache/add-named"),
      addLocal = require("./cache/add-local"),
      addRemoteTarball = require("./cache/add-remote-tarball"),
      addRemoteGit = require("./cache/add-remote-git"),
      inflight = require("inflight"),
      realizePackageSpecifier = require("realize-package-specifier"),
      npa = require("npm-package-arg"),
      getStat = require("./cache/get-stat"),
      cachedPackageRoot = require("./cache/cached-package-root"),
      mapToRegistry = require("./utils/map-to-registry");
  cache.usage = "npm cache add <tarball file>" + "\nnpm cache add <folder>" + "\nnpm cache add <tarball url>" + "\nnpm cache add <git url>" + "\nnpm cache add <name>@<version>" + "\nnpm cache ls [<path>]" + "\nnpm cache clean [<pkg>[@<version>]]";
  cache.completion = function(opts, cb) {
    var argv = opts.conf.argv.remain;
    if (argv.length === 2) {
      return cb(null, ["add", "ls", "clean"]);
    }
    switch (argv[2]) {
      case "clean":
      case "ls":
        var p = path.dirname(opts.partialWords.slice(3).join("/"));
        if (p === ".")
          p = "";
        return ls_(p, 2, cb);
      case "add":
        return npm.commands.install.completion(opts, cb);
    }
  };
  function cache(args, cb) {
    var cmd = args.shift();
    switch (cmd) {
      case "rm":
      case "clear":
      case "clean":
        return clean(args, cb);
      case "list":
      case "sl":
      case "ls":
        return ls(args, cb);
      case "add":
        return add(args, npm.prefix, cb);
      default:
        return cb("Usage: " + cache.usage);
    }
  }
  function read(name, ver, forceBypass, cb) {
    assert(typeof name === "string", "must include name of module to install");
    assert(typeof cb === "function", "must include callback");
    if (forceBypass === undefined || forceBypass === null)
      forceBypass = true;
    var root = cachedPackageRoot({
      name: name,
      version: ver
    });
    function c(er, data) {
      if (er)
        log.verbose("cache", "addNamed error for", name + "@" + ver, er);
      if (data)
        deprCheck(data);
      return cb(er, data);
    }
    if (forceBypass && npm.config.get("force")) {
      log.verbose("using force", "skipping cache");
      return addNamed(name, ver, null, c);
    }
    readJson(path.join(root, "package", "package.json"), function(er, data) {
      if (er && er.code !== "ENOENT" && er.code !== "ENOTDIR")
        return cb(er);
      if (data) {
        if (!data.name)
          return cb(new Error("No name provided"));
        if (!data.version)
          return cb(new Error("No version provided"));
      }
      if (er)
        return addNamed(name, ver, null, c);
      else
        c(er, data);
    });
  }
  function normalize(args) {
    var normalized = "";
    if (args.length > 0) {
      var a = npa(args[0]);
      if (a.name)
        normalized = a.name;
      if (a.rawSpec)
        normalized = [normalized, a.rawSpec].join("/");
      if (args.length > 1)
        normalized = [normalized].concat(args.slice(1)).join("/");
    }
    if (normalized.substr(-1) === "/") {
      normalized = normalized.substr(0, normalized.length - 1);
    }
    normalized = path.normalize(normalized);
    log.silly("ls", "normalized", normalized);
    return normalized;
  }
  function ls(args, cb) {
    var prefix = npm.config.get("cache");
    if (prefix.indexOf(process.env.HOME) === 0) {
      prefix = "~" + prefix.substr(process.env.HOME.length);
    }
    ls_(normalize(args), npm.config.get("depth"), function(er, files) {
      console.log(files.map(function(f) {
        return path.join(prefix, f);
      }).join("\n").trim());
      cb(er, files);
    });
  }
  function ls_(req, depth, cb) {
    return fileCompletion(npm.cache, req, depth, cb);
  }
  function clean(args, cb) {
    assert(typeof cb === "function", "must include callback");
    if (!args)
      args = [];
    var f = path.join(npm.cache, normalize(args));
    if (f === npm.cache) {
      fs.readdir(npm.cache, function(er, files) {
        if (er)
          return cb();
        asyncMap(files.filter(function(f) {
          return npm.config.get("force") || f !== "-";
        }).map(function(f) {
          return path.join(npm.cache, f);
        }), rm, cb);
      });
    } else {
      rm(f, cb);
    }
  }
  cache.add = function(pkg, ver, where, scrub, cb) {
    assert(typeof pkg === "string", "must include name of package to install");
    assert(typeof cb === "function", "must include callback");
    if (scrub) {
      return clean([], function(er) {
        if (er)
          return cb(er);
        add([pkg, ver], where, cb);
      });
    }
    return add([pkg, ver], where, cb);
  };
  var adding = 0;
  function add(args, where, cb) {
    var usage = "Usage:\n" + "    npm cache add <tarball-url>\n" + "    npm cache add <pkg>@<ver>\n" + "    npm cache add <tarball>\n" + "    npm cache add <folder>\n",
        spec;
    log.silly("cache add", "args", args);
    if (args[1] === undefined)
      args[1] = null;
    if (args[1] !== null) {
      spec = args[0] + "@" + args[1];
    } else if (args.length === 2) {
      spec = args[0];
    }
    log.verbose("cache add", "spec", spec);
    if (!spec)
      return cb(usage);
    if (adding <= 0) {
      npm.spinner.start();
    }
    adding++;
    cb = afterAdd(cb);
    realizePackageSpecifier(spec, where, function(err, p) {
      if (err)
        return cb(err);
      log.silly("cache add", "parsed spec", p);
      switch (p.type) {
        case "local":
        case "directory":
          addLocal(p, null, cb);
          break;
        case "remote":
          mapToRegistry(spec, npm.config, function(err, uri, auth) {
            if (err)
              return cb(err);
            addRemoteTarball(p.spec, {name: p.name}, null, auth, cb);
          });
          break;
        case "git":
        case "hosted":
          addRemoteGit(p.rawSpec, cb);
          break;
        default:
          if (p.name)
            return addNamed(p.name, p.spec, null, cb);
          cb(new Error("couldn't figure out how to install " + spec));
      }
    });
  }
  function unpack(pkg, ver, unpackTarget, dMode, fMode, uid, gid, cb) {
    if (typeof cb !== "function")
      cb = gid, gid = null;
    if (typeof cb !== "function")
      cb = uid, uid = null;
    if (typeof cb !== "function")
      cb = fMode, fMode = null;
    if (typeof cb !== "function")
      cb = dMode, dMode = null;
    read(pkg, ver, false, function(er) {
      if (er) {
        log.error("unpack", "Could not read data for %s", pkg + "@" + ver);
        return cb(er);
      }
      npm.commands.unbuild([unpackTarget], true, function(er) {
        if (er)
          return cb(er);
        tar.unpack(path.join(cachedPackageRoot({
          name: pkg,
          version: ver
        }), "package.tgz"), unpackTarget, dMode, fMode, uid, gid, cb);
      });
    });
  }
  function afterAdd(cb) {
    return function(er, data) {
      adding--;
      if (adding <= 0)
        npm.spinner.stop();
      if (er || !data || !data.name || !data.version)
        return cb(er, data);
      log.silly("cache", "afterAdd", data.name + "@" + data.version);
      var pj = path.join(cachedPackageRoot(data), "package", "package.json");
      var done = inflight(pj, cb);
      if (!done)
        return log.verbose("afterAdd", pj, "already in flight; not writing");
      log.verbose("afterAdd", pj, "not in flight; writing");
      getStat(function(er, cs) {
        if (er)
          return done(er);
        writeFileAtomic(pj, JSON.stringify(data), {chown: cs}, function(er) {
          if (!er)
            log.verbose("afterAdd", pj, "written");
          return done(er, data);
        });
      });
    };
  }
})(require("process"));
