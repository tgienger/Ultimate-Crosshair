/* */ 
module.exports = exports = shrinkwrap;
var npm = require("./npm"),
    log = require("npmlog"),
    fs = require("fs"),
    writeFileAtomic = require("write-file-atomic"),
    path = require("path"),
    readJson = require("read-package-json"),
    sortedObject = require("sorted-object");
shrinkwrap.usage = "npm shrinkwrap";
function shrinkwrap(args, silent, cb) {
  if (typeof cb !== "function")
    cb = silent, silent = false;
  if (args.length) {
    log.warn("shrinkwrap", "doesn't take positional args");
  }
  if (npm.config.get("dev")) {
    npm.config.set("production", true);
  }
  npm.commands.ls([], true, function(er, _, pkginfo) {
    if (er)
      return cb(er);
    shrinkwrap_(pkginfo, silent, npm.config.get("dev"), cb);
  });
}
function shrinkwrap_(pkginfo, silent, dev, cb) {
  if (pkginfo.problems) {
    return cb(new Error("Problems were encountered\n" + "Please correct and try again.\n" + pkginfo.problems.join("\n")));
  }
  if (!dev) {
    readJson(path.resolve(npm.prefix, "package.json"), function(er, data) {
      if (er)
        return cb(er);
      if (data.devDependencies) {
        Object.keys(data.devDependencies).forEach(function(dep) {
          if (data.dependencies && data.dependencies[dep]) {
            return;
          }
          log.warn("shrinkwrap", "Excluding devDependency: %s", dep, data.dependencies);
          delete pkginfo.dependencies[dep];
        });
      }
      save(pkginfo, silent, cb);
    });
  } else {
    save(pkginfo, silent, cb);
  }
}
function save(pkginfo, silent, cb) {
  pkginfo.dependencies = sortedObject(pkginfo.dependencies || {});
  var swdata;
  try {
    swdata = JSON.stringify(pkginfo, null, 2) + "\n";
  } catch (er) {
    log.error("shrinkwrap", "Error converting package info to json");
    return cb(er);
  }
  var file = path.resolve(npm.prefix, "npm-shrinkwrap.json");
  writeFileAtomic(file, swdata, function(er) {
    if (er)
      return cb(er);
    if (silent)
      return cb(null, pkginfo);
    console.log("wrote npm-shrinkwrap.json");
    cb(null, pkginfo);
  });
}
