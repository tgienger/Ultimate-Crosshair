/* */ 
(function(process) {
  process.title = 'clear';
  function lf() {
    return '\n';
  }
  require("../../lib/ansi")(process.stdout).write(Array.apply(null, Array(process.stdout.getWindowSize()[1])).map(lf).join('')).eraseData(2).goto(1, 1);
})(require("process"));
