/* */ 
(function(process) {
  module.exports = link;
  link.ifExists = linkIfExists;
  var fs = require("graceful-fs"),
      chain = require("slide").chain,
      mkdir = require("mkdirp"),
      rm = require("./gently-rm"),
      path = require("path"),
      npm = require("../npm");
  function linkIfExists(from, to, gently, cb) {
    fs.stat(from, function(er) {
      if (er)
        return cb();
      link(from, to, gently, cb);
    });
  }
  function link(from, to, gently, abs, cb) {
    if (typeof cb !== "function")
      cb = abs, abs = false;
    if (typeof cb !== "function")
      cb = gently, gently = null;
    if (npm.config.get("force"))
      gently = false;
    to = path.resolve(to);
    var target = from = path.resolve(from);
    if (!abs && process.platform !== "win32") {
      target = path.relative(path.dirname(to), from);
      if (target.length >= from.length)
        target = from;
    }
    chain([[fs, "stat", from], [rm, to, gently], [mkdir, path.dirname(to)], [fs, "symlink", target, to, "junction"]], cb);
  }
})(require("process"));
