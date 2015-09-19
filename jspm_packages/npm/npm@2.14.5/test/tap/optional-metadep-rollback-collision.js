/* */ 
(function(process) {
  var fs = require("graceful-fs");
  var path = require("path");
  var mkdirp = require("mkdirp");
  var osenv = require("osenv");
  var rimraf = require("rimraf");
  var test = require("tap").test;
  var common = require("../common-tap");
  var pkg = path.resolve(__dirname, 'optional-metadep-rollback-collision');
  var deps = path.resolve(pkg, 'deps');
  var nm = path.resolve(pkg, 'node_modules');
  var cache = path.resolve(pkg, 'cache');
  var pidfile = path.resolve(pkg, 'child.pid');
  var json = {
    name: 'optional-metadep-rollback-collision',
    version: '1.0.0',
    description: 'let\'s just see about that race condition',
    optionalDependencies: {opdep: 'file:./deps/opdep'}
  };
  var d1 = {
    name: 'd1',
    version: '1.0.0',
    description: 'I FAIL CONSTANTLY',
    scripts: {preinstall: 'sleep 1'},
    dependencies: {foo: 'http://localhost:8080/'}
  };
  var d2 = {
    name: 'd2',
    version: '1.0.0',
    description: 'how do you *really* know you exist?',
    scripts: {postinstall: 'node blart.js'},
    dependencies: {
      'graceful-fs': '^3.0.2',
      mkdirp: '^0.5.0',
      rimraf: '^2.2.8'
    }
  };
  var opdep = {
    name: 'opdep',
    version: '1.0.0',
    description: 'To explode, of course!',
    main: 'index.js',
    scripts: {preinstall: 'node bad-server.js'},
    dependencies: {
      d1: 'file:../d1',
      d2: 'file:../d2'
    }
  };
  var badServer = function() {}.toString().split('\n').slice(1, -1).join('\n');
  var blart = function() {}.toString().split('\n').slice(1, -1).join('\n');
  test('setup', function(t) {
    cleanup();
    mkdirp.sync(pkg);
    fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify(json, null, 2));
    mkdirp.sync(path.join(deps, 'd1'));
    fs.writeFileSync(path.join(deps, 'd1', 'package.json'), JSON.stringify(d1, null, 2));
    mkdirp.sync(path.join(deps, 'd2'));
    fs.writeFileSync(path.join(deps, 'd2', 'package.json'), JSON.stringify(d2, null, 2));
    fs.writeFileSync(path.join(deps, 'd2', 'blart.js'), blart);
    mkdirp.sync(path.join(deps, 'opdep'));
    fs.writeFileSync(path.join(deps, 'opdep', 'package.json'), JSON.stringify(opdep, null, 2));
    fs.writeFileSync(path.join(deps, 'opdep', 'bad-server.js'), badServer);
    t.end();
  });
  test('go go test racer', function(t) {
    common.npm(['--prefix', pkg, '--fetch-retries', '0', '--loglevel', 'silent', '--cache', cache, 'install'], {
      cwd: pkg,
      env: {
        PATH: process.env.PATH,
        Path: process.env.Path
      },
      stdio: [0, 'pipe', 2]
    }, function(er, code, stdout, stderr) {
      t.ifError(er, 'install ran to completion without error');
      t.notOk(code, 'npm install exited with code 0');
      t.equal(stdout, 'ok\nok\n');
      t.notOk(/not ok/.test(stdout), 'should not contain the string \'not ok\'');
      t.end();
    });
  });
  test('verify results', function(t) {
    t.throws(function() {
      fs.statSync(nm);
    });
    t.end();
  });
  test('cleanup', function(t) {
    cleanup();
    t.end();
  });
  function cleanup() {
    process.chdir(osenv.tmpdir());
    try {
      var pid = +fs.readFileSync(pidfile);
      process.kill(pid, 'SIGKILL');
    } catch (er) {}
    rimraf.sync(pkg);
  }
})(require("process"));
