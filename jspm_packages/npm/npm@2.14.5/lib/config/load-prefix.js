/* */ 
(function(process) {
  module.exports = loadPrefix;
  var findPrefix = require("./find-prefix");
  var path = require("path");
  function loadPrefix(cb) {
    var cli = this.list[0];
    Object.defineProperty(this, "prefix", {
      set: function(prefix) {
        var g = this.get("global");
        this[g ? "globalPrefix" : "localPrefix"] = prefix;
      }.bind(this),
      get: function() {
        var g = this.get("global");
        return g ? this.globalPrefix : this.localPrefix;
      }.bind(this),
      enumerable: true
    });
    Object.defineProperty(this, "globalPrefix", {
      set: function(prefix) {
        this.set("prefix", prefix);
      }.bind(this),
      get: function() {
        return path.resolve(this.get("prefix"));
      }.bind(this),
      enumerable: true
    });
    var p;
    Object.defineProperty(this, "localPrefix", {
      set: function(prefix) {
        p = prefix;
      },
      get: function() {
        return p;
      },
      enumerable: true
    });
    if (Object.prototype.hasOwnProperty.call(cli, "prefix")) {
      p = path.resolve(cli.prefix);
      process.nextTick(cb);
    } else {
      findPrefix(process.cwd(), function(er, found) {
        p = found;
        cb(er);
      });
    }
  }
})(require("process"));
