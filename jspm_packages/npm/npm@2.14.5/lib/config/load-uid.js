/* */ 
(function(process) {
  module.exports = loadUid;
  var getUid = require("uid-number");
  function loadUid(cb) {
    if (!this.get("unsafe-perm")) {
      getUid(this.get("user"), this.get("group"), cb);
    } else {
      process.nextTick(cb);
    }
  }
})(require("process"));
