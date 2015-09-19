/* */ 
var test = require("tap").test;
var common = require("../common-tap");
var path = require("path");
var root = path.resolve(__dirname, "../..");
var lib = path.resolve(root, "lib");
var commands = ["run", "version"];
commands.forEach(function(cmd) {
  var stdout,
      stderr;
  test(cmd + " in root", function(t) {
    common.npm([cmd], {cwd: root}, function(er, code, so, se) {
      if (er)
        throw er;
      t.notOk(code, "npm " + cmd + " exited with code 0");
      stdout = so;
      stderr = se;
      t.end();
    });
  });
  test(cmd + " in lib", function(t) {
    common.npm([cmd], {cwd: lib}, function(er, code, so, se) {
      if (er)
        throw er;
      t.notOk(code, "npm " + cmd + " exited with code 0");
      t.equal(so, stdout);
      t.equal(se, stderr);
      t.end();
    });
  });
});
