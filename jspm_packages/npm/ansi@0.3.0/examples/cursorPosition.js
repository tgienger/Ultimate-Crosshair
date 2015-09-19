/* */ 
(function(process) {
  var tty = require("tty");
  var cursor = require("../lib/ansi")(process.stdout);
  process.stdin.resume();
  raw(true);
  process.stdin.once('data', function(b) {
    var match = /\[(\d+)\;(\d+)R$/.exec(b.toString());
    if (match) {
      var xy = match.slice(1, 3).reverse().map(Number);
      console.error(xy);
    }
    raw(false);
    process.stdin.pause();
  });
  cursor.queryPosition();
  function raw(mode) {
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(mode);
    } else {
      tty.setRawMode(mode);
    }
  }
})(require("process"));
