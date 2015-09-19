/* */ 
(function(process) {
  "use strict";
  var childProcess = require("child_process");
  function opener(args, options, callback) {
    var command = process.platform === "win32" ? "cmd" : process.platform === "darwin" ? "open" : "xdg-open";
    if (typeof args === "string") {
      args = [args];
    }
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    if (options && typeof options === "object" && options.command) {
      if (process.platform === "win32") {
        args = [options.command].concat(args);
      } else {
        command = options.command;
      }
    }
    if (process.platform === "win32") {
      args = args.map(function(value) {
        return value.replace(/&/g, '^&');
      });
      args = ["/c", "start", '""'].concat(args);
    }
    return childProcess.execFile(command, args, options, callback);
  }
  module.exports = opener;
  if (require.main && require.main.id === module.id) {
    opener(process.argv.slice(2), function(error) {
      if (error) {
        throw error;
      }
    });
  }
})(require("process"));
