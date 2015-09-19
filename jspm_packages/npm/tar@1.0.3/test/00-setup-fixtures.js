/* */ 
(function(process) {
  var tap = require("tap"),
      child_process = require("child_process"),
      rimraf = require("rimraf"),
      test = tap.test,
      path = require("path");
  test("clean fixtures", function(t) {
    rimraf(path.resolve(__dirname, "fixtures"), function(er) {
      t.ifError(er, "rimraf ./fixtures/");
      t.end();
    });
  });
  test("clean tmp", function(t) {
    rimraf(path.resolve(__dirname, "tmp"), function(er) {
      t.ifError(er, "rimraf ./tmp/");
      t.end();
    });
  });
  test("extract fixtures", function(t) {
    var c = child_process.spawn("tar", ["xzvf", "fixtures.tgz"], {cwd: __dirname});
    c.stdout.on("data", errwrite);
    c.stderr.on("data", errwrite);
    function errwrite(chunk) {
      process.stderr.write(chunk);
    }
    c.on("exit", function(code) {
      t.equal(code, 0, "extract fixtures should exit with 0");
      if (code) {
        t.comment("Note, all tests from here on out will fail because of this.");
      }
      t.end();
    });
  });
})(require("process"));
