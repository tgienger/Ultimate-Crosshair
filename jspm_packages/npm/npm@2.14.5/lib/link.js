/* */ 
(function(process) {
  var npm = require("./npm"),
      symlink = require("./utils/link"),
      fs = require("graceful-fs"),
      log = require("npmlog"),
      asyncMap = require("slide").asyncMap,
      chain = require("slide").chain,
      path = require("path"),
      build = require("./build"),
      npa = require("npm-package-arg");
  module.exports = link;
  link.usage = "npm link (in package dir)" + "\nnpm link <pkg> (link global into local)";
  link.completion = function(opts, cb) {
    var dir = npm.globalDir;
    fs.readdir(dir, function(er, files) {
      cb(er, files.filter(function(f) {
        return !f.match(/^[\._-]/);
      }));
    });
  };
  function link(args, cb) {
    if (process.platform === 'win32') {
      var semver = require("semver");
      if (!semver.gte(process.version, '0.7.9')) {
        var msg = 'npm link not supported on windows prior to node 0.7.9';
        var e = new Error(msg);
        e.code = 'ENOTSUP';
        e.errno = require("constants").ENOTSUP;
        return cb(e);
      }
    }
    if (npm.config.get("global")) {
      return cb(new Error("link should never be --global.\n" + "Please re-run this command with --local"));
    }
    if (args.length === 1 && args[0] === ".")
      args = [];
    if (args.length)
      return linkInstall(args, cb);
    linkPkg(npm.prefix, cb);
  }
  function linkInstall(pkgs, cb) {
    asyncMap(pkgs, function(pkg, cb) {
      var t = path.resolve(npm.globalDir, ".."),
          pp = path.resolve(npm.globalDir, pkg),
          rp = null,
          target = path.resolve(npm.dir, pkg);
      function n(er, data) {
        if (er)
          return cb(er, data);
        var d = data.filter(function(d) {
          return !d[3];
        });
        var what = npa(d[0][0]);
        pp = d[0][1];
        pkg = what.name;
        target = path.resolve(npm.dir, pkg);
        next();
      }
      if (pkg[0] !== "@" && (pkg.indexOf("/") !== -1 || pkg.indexOf("\\") !== -1)) {
        return fs.lstat(path.resolve(pkg), function(er, st) {
          if (er || !st.isDirectory()) {
            npm.commands.install(t, pkg, n);
          } else {
            rp = path.resolve(pkg);
            linkPkg(rp, n);
          }
        });
      }
      fs.lstat(pp, function(er, st) {
        if (er) {
          rp = pp;
          return npm.commands.install(t, pkg, n);
        } else if (!st.isSymbolicLink()) {
          rp = pp;
          next();
        } else {
          return fs.realpath(pp, function(er, real) {
            if (er)
              log.warn("invalid symbolic link", pkg);
            else
              rp = real;
            next();
          });
        }
      });
      function next() {
        chain([[function(cb) {
          log.verbose("link", "symlinking %s to %s", pp, target);
          cb();
        }], [symlink, pp, target], rp && [build, [target], npm.config.get("global"), build._noLC, true], [resultPrinter, pkg, pp, target, rp]], cb);
      }
    }, cb);
  }
  function linkPkg(folder, cb_) {
    var me = folder || npm.prefix,
        readJson = require("read-package-json");
    log.verbose("linkPkg", folder);
    readJson(path.resolve(me, "package.json"), function(er, d) {
      function cb(er) {
        return cb_(er, [[d && d._id, target, null, null]]);
      }
      if (er)
        return cb(er);
      if (!d.name) {
        er = new Error("Package must have a name field to be linked");
        return cb(er);
      }
      var target = path.resolve(npm.globalDir, d.name);
      symlink(me, target, false, true, function(er) {
        if (er)
          return cb(er);
        log.verbose("link", "build target", target);
        npm.commands.install(me, [], function(er) {
          if (er)
            return cb(er);
          build([target], true, build._noLC, true, function(er) {
            if (er)
              return cb(er);
            resultPrinter(path.basename(me), me, target, cb);
          });
        });
      });
    });
  }
  function resultPrinter(pkg, src, dest, rp, cb) {
    if (typeof cb !== "function")
      cb = rp, rp = null;
    var where = dest;
    rp = (rp || "").trim();
    src = (src || "").trim();
    if (npm.config.get("parseable")) {
      return parseableOutput(dest, rp || src, cb);
    }
    if (rp === src)
      rp = null;
    console.log(where + " -> " + src + (rp ? " -> " + rp : ""));
    cb();
  }
  function parseableOutput(dest, rp, cb) {
    console.log(dest + "::" + rp);
    cb();
  }
})(require("process"));
