/* */ 
(function(process) {
  var fs = require("graceful-fs");
  var path = require("path");
  var mkdirp = require("mkdirp");
  var mr = require("npm-registry-mock");
  var osenv = require("osenv");
  var rimraf = require("rimraf");
  var test = require("tap").test;
  var npm = require("../../lib/npm");
  var common = require("../common-tap");
  var pkg = path.resolve(__dirname, 'peer-deps-invalid');
  var cache = path.resolve(pkg, 'cache');
  var json = {
    author: 'Domenic Denicola <domenic@domenicdenicola.com> (http://domenicdenicola.com/)',
    name: 'peer-deps-invalid',
    version: '0.0.0',
    dependencies: {
      'npm-test-peer-deps-file': 'http://localhost:1337/ok.js',
      'npm-test-peer-deps-file-invalid': 'http://localhost:1337/invalid.js'
    }
  };
  var fileFail = function() {
    module.exports = 'I\'m just a lonely index, naked as the day I was born.';
  }.toString().split('\n').slice(1, -1).join('\n');
  var fileOK = function() {
    module.exports = 'I\'m just a lonely index, naked as the day I was born.';
  }.toString().split('\n').slice(1, -1).join('\n');
  test('setup', function(t) {
    cleanup();
    mkdirp.sync(cache);
    fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify(json, null, 2));
    fs.writeFileSync(path.join(pkg, 'file-ok.js'), fileOK);
    fs.writeFileSync(path.join(pkg, 'file-fail.js'), fileFail);
    process.chdir(pkg);
    t.end();
  });
  test('installing dependencies that have conflicting peerDependencies', function(t) {
    var customMocks = {'get': {
        '/ok.js': [200, path.join(pkg, 'file-ok.js')],
        '/invalid.js': [200, path.join(pkg, 'file-fail.js')]
      }};
    mr({
      port: common.port,
      mocks: customMocks
    }, function(err, s) {
      t.ifError(err, 'mock registry started');
      npm.load({
        cache: pkg + "/cache",
        registry: common.registry
      }, function() {
        npm.commands.install([], function(err) {
          if (!err) {
            t.fail("No error!");
          } else {
            t.equal(err.code, "EPEERINVALID");
            t.equal(err.packageName, "underscore");
            t.equal(err.packageVersion, "1.3.3");
            t.equal(err.message, "The package underscore@1.3.3 does not satisfy its siblings' peerDependencies requirements!");
          }
          s.close();
          t.end();
        });
      });
    });
  });
  test('cleanup', function(t) {
    cleanup();
    t.end();
  });
  function cleanup() {
    process.chdir(osenv.tmpdir());
    rimraf.sync(pkg);
  }
})(require("process"));
