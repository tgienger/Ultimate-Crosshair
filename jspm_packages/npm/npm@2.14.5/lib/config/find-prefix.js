/* */ 
(function(process) {
  module.exports = findPrefix;
  var fs = require("fs");
  var path = require("path");
  function findPrefix(p, cb_) {
    function cb(er, p) {
      process.nextTick(function() {
        cb_(er, p);
      });
    }
    p = path.resolve(p);
    var walkedUp = false;
    while (path.basename(p) === "node_modules") {
      p = path.dirname(p);
      walkedUp = true;
    }
    if (walkedUp)
      return cb(null, p);
    findPrefix_(p, p, cb);
  }
  function findPrefix_(p, original, cb) {
    if (p === "/" || (process.platform === "win32" && p.match(/^[a-zA-Z]:(\\|\/)?$/))) {
      return cb(null, original);
    }
    fs.readdir(p, function(er, files) {
      if (er && p === original) {
        if (er.code === "ENOENT")
          return cb(null, original);
        return cb(er);
      }
      if (er)
        return cb(null, original);
      if (files.indexOf("node_modules") !== -1 || files.indexOf("package.json") !== -1) {
        return cb(null, p);
      }
      var d = path.dirname(p);
      if (d === p)
        return cb(null, original);
      return findPrefix_(d, original, cb);
    });
  }
})(require("process"));
