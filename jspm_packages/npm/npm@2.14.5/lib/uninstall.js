/* */ 
module.exports = uninstall;
uninstall.usage = "npm uninstall <name>[@<version> [<name>[@<version>] ...]" + "\nnpm rm <name>[@<version> [<name>[@<version>] ...]";
uninstall.completion = require("./utils/completion/installed-shallow");
var fs = require("graceful-fs"),
    writeFileAtomic = require("write-file-atomic"),
    log = require("npmlog"),
    readJson = require("read-package-json"),
    path = require("path"),
    npm = require("./npm"),
    asyncMap = require("slide").asyncMap;
function uninstall(args, cb) {
  var nm = npm.dir;
  if (args.length === 1 && args[0] === ".")
    args = [];
  if (args.length)
    return uninstall_(args, nm, cb);
  readJson(path.resolve(npm.localPrefix, "package.json"), function(er, pkg) {
    if (er && er.code !== "ENOENT" && er.code !== "ENOTDIR")
      return cb(er);
    if (er)
      return cb(uninstall.usage);
    uninstall_([pkg.name], npm.globalDir, cb);
  });
}
function uninstall_(args, nm, cb) {
  var s = npm.config.get('save'),
      d = npm.config.get('save-dev'),
      o = npm.config.get('save-optional');
  if (s || d || o) {
    cb = saver(args, nm, cb);
  }
  asyncMap(args, function(arg, cb) {
    var p = path.join(path.resolve(nm), path.join("/", arg));
    if (path.resolve(p) === nm) {
      log.warn("uninstall", "invalid argument: %j", arg);
      return cb(null, []);
    }
    fs.lstat(p, function(er) {
      if (er) {
        log.warn("uninstall", "not installed in %s: %j", nm, arg);
        return cb(null, []);
      }
      cb(null, p);
    });
  }, function(er, folders) {
    if (er)
      return cb(er);
    asyncMap(folders, npm.commands.unbuild, cb);
  });
}
function saver(args, nm, cb_) {
  return cb;
  function cb(er, data) {
    var s = npm.config.get('save'),
        d = npm.config.get('save-dev'),
        o = npm.config.get('save-optional');
    if (er || !(s || d || o))
      return cb_(er, data);
    var pj = path.resolve(nm, '..', 'package.json');
    fs.readFile(pj, 'utf8', function(er, json) {
      var pkg;
      try {
        pkg = JSON.parse(json);
      } catch (_) {}
      if (!pkg)
        return cb_(null, data);
      var bundle;
      if (npm.config.get('save-bundle')) {
        bundle = pkg.bundleDependencies || pkg.bundledDependencies;
        if (!Array.isArray(bundle))
          bundle = undefined;
      }
      var changed = false;
      args.forEach(function(a) {
        ;
        [[s, 'dependencies'], [o, 'optionalDependencies'], [d, 'devDependencies']].forEach(function(f) {
          var flag = f[0],
              field = f[1];
          if (!flag || !pkg[field] || !pkg[field].hasOwnProperty(a))
            return;
          changed = true;
          if (bundle) {
            var i = bundle.indexOf(a);
            if (i !== -1)
              bundle.splice(i, 1);
          }
          delete pkg[field][a];
        });
      });
      if (!changed)
        return cb_(null, data);
      if (bundle) {
        delete pkg.bundledDependencies;
        if (bundle.length) {
          pkg.bundleDependencies = bundle;
        } else {
          delete pkg.bundleDependencies;
        }
      }
      writeFileAtomic(pj, JSON.stringify(pkg, null, 2) + "\n", function(er) {
        return cb_(er, data);
      });
    });
  }
}
