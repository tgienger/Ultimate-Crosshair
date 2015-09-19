/* */ 
(function(process) {
  module.exports = setUser;
  var assert = require("assert");
  var path = require("path");
  var fs = require("fs");
  var mkdirp = require("mkdirp");
  function setUser(cb) {
    var defaultConf = this.root;
    assert(defaultConf !== Object.prototype);
    if (this.get("global"))
      return cb();
    if (process.env.SUDO_UID) {
      defaultConf.user = +(process.env.SUDO_UID);
      return cb();
    }
    var prefix = path.resolve(this.get("prefix"));
    mkdirp(prefix, function(er) {
      if (er)
        return cb(er);
      fs.stat(prefix, function(er, st) {
        defaultConf.user = st && st.uid;
        return cb(er);
      });
    });
  }
})(require("process"));
