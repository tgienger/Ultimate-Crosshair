/* */ 
(function(process) {
  module.exports = root;
  var npm = require("./npm");
  root.usage = "npm root\nnpm root -g\n(just prints the root folder)";
  function root(args, silent, cb) {
    if (typeof cb !== "function")
      cb = silent, silent = false;
    if (!silent)
      console.log(npm.dir);
    process.nextTick(cb.bind(this, null, npm.dir));
  }
})(require("process"));
