/* */ 
(function(Buffer, process) {
  var common = require("../common-tap");
  var test = require("tap").test;
  var fs = require("fs");
  var osenv = require("osenv");
  var pkg = process.env.npm_config_tmp || "/tmp";
  pkg += "/npm-test-publish-config";
  require("mkdirp").sync(pkg);
  fs.writeFileSync(pkg + "/package.json", JSON.stringify({
    name: "npm-test-publish-config",
    version: "1.2.3",
    publishConfig: {registry: common.registry}
  }), "utf8");
  fs.writeFileSync(pkg + "/fixture_npmrc", "//localhost:1337/:email = fancy@feast.net\n" + "//localhost:1337/:username = fancy\n" + "//localhost:1337/:_password = " + new Buffer("feast").toString("base64") + "\n" + "registry = http://localhost:1337/");
  test(function(t) {
    var child;
    t.plan(4);
    require("http").createServer(function(req, res) {
      t.pass("got request on the fakey fake registry");
      this.close();
      res.statusCode = 500;
      res.end(JSON.stringify({error: "sshhh. naptime nao. \\^O^/ <(YAWWWWN!)"}));
      child.kill('SIGHUP');
    }).listen(common.port, function() {
      t.pass("server is listening");
      child = common.npm(["publish", "--userconfig=" + pkg + "/fixture_npmrc"], {
        cwd: pkg,
        stdio: "inherit",
        env: {
          "npm_config_cache_lock_stale": 1000,
          "npm_config_cache_lock_wait": 1000,
          HOME: process.env.HOME,
          Path: process.env.PATH,
          PATH: process.env.PATH,
          USERPROFILE: osenv.home()
        }
      }, function(err, code) {
        t.ifError(err, "publish command finished successfully");
        t.notOk(code, "npm install exited with code 0");
      });
    });
  });
})(require("buffer").Buffer, require("process"));
