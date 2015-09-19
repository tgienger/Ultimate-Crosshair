/* */ 
(function(Buffer) {
  var zlib = require("zlib");
  var test = require("tap").test;
  var server = require("./lib/server");
  var common = require("./lib/common");
  var client = common.freshClient({retry: {
      count: 1,
      minTimeout: 10,
      maxTimeout: 100
    }});
  var TEST_URL = common.registry + '/some-package-gzip/1.2.3';
  var pkg = {
    _id: 'some-package-gzip@1.2.3',
    name: 'some-package-gzip',
    version: '1.2.3'
  };
  zlib.gzip(JSON.stringify(pkg), function(err, pkgGzip) {
    test('request gzip package content', function(t) {
      t.ifError(err, 'example package compressed');
      server.expect('GET', '/some-package-gzip/1.2.3', function(req, res) {
        res.statusCode = 200;
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', 'application/json');
        res.end(pkgGzip);
      });
      client.get(TEST_URL, {}, function(er, data) {
        if (er)
          throw er;
        t.deepEqual(data, pkg, 'some-package-gzip version 1.2.3');
        t.end();
      });
    });
    test('request wrong gzip package content', function(t) {
      for (var i = 0; i < 3; i++) {
        server.expect('GET', '/some-package-gzip/1.2.3', function(req, res) {
          res.statusCode = 200;
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Content-Type', 'application/json');
          res.end(new Buffer('wrong gzip content'));
        });
      }
      client.get(TEST_URL, {}, function(er) {
        t.ok(er, 'ungzip error');
        t.end();
      });
    });
    test('cleanup', function(t) {
      server.close();
      t.end();
    });
  });
})(require("buffer").Buffer);
