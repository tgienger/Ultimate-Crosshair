/* */ 
(function(process) {
  var fs = require("fs");
  var path = require("path");
  var mkdirp = require("mkdirp");
  var osenv = require("osenv");
  var rimraf = require("rimraf");
  var test = require("tap").test;
  var common = require("../common-tap");
  var pkg = path.resolve(__dirname, 'lifecycle-path');
  var link = path.resolve(pkg, 'node-bin');
  var PATH;
  if (process.platform === 'win32') {
    PATH = 'C:\\foo\\bar';
  } else {
    PATH = '/bin:/usr/bin';
  }
  var printPath = 'console.log(process.env.PATH)\n';
  var json = {
    name: 'glorb',
    version: '1.2.3',
    scripts: {path: './node-bin/node print-path.js'}
  };
  test('setup', function(t) {
    cleanup();
    mkdirp.sync(pkg);
    fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify(json, null, 2));
    fs.writeFileSync(path.join(pkg, 'print-path.js'), printPath);
    fs.symlinkSync(path.dirname(process.execPath), link, 'dir');
    t.end();
  });
  test('make sure the path is correct', function(t) {
    common.npm(['run-script', 'path'], {
      cwd: pkg,
      env: {
        PATH: PATH,
        stdio: [0, 'pipe', 2]
      }
    }, function(er, code, stdout) {
      if (er)
        throw er;
      t.equal(code, 0, 'exit code');
      stdout = stdout.trim().split(/\r|\n/).pop();
      var pathSplit = process.platform === 'win32' ? ';' : ':';
      var root = path.resolve(__dirname, '../..');
      var actual = stdout.split(pathSplit).map(function(p) {
        if (p.indexOf(root) === 0) {
          p = '{{ROOT}}' + p.substr(root.length);
        }
        return p.replace(/\\/g, '/');
      });
      var expect = ['{{ROOT}}/bin/node-gyp-bin', '{{ROOT}}/test/tap/lifecycle-path/node_modules/.bin'].concat(PATH.split(pathSplit).map(function(p) {
        return p.replace(/\\/g, '/');
      }));
      t.same(actual, expect);
      t.end();
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
