/* */ 
var tap = require("tap");
var server = require("./lib/server");
var common = require("./lib/common");
var client = common.freshClient({retry: {
    retries: 6,
    minTimeout: 10,
    maxTimeout: 100
  }});
var pkg = {
  _id: 'some-package@1.2.3',
  name: 'some-package',
  version: '1.2.3'
};
tap.test('create new user account', function(t) {
  server.expect('GET', '/some-package/1.2.3', function(req, res) {
    res.statusCode = 408;
    res.end('Timeout');
  });
  server.expect('GET', '/some-package/1.2.3', function(req, res) {
    res.destroy();
  });
  server.expect('GET', '/some-package/1.2.3', function(req, res) {
    res.statusCode = 502;
    res.end('Gateway Timeout');
  });
  server.expect('GET', '/some-package/1.2.3', function(req, res) {
    res.statusCode = 503;
    res.setHeader('retry-after', '10');
    res.end('Come back later');
  });
  server.expect('GET', '/some-package/1.2.3', function(req, res) {
    res.statusCode = 200;
    res.json(pkg);
  });
  client.get('http://localhost:1337/some-package/1.2.3', {}, function(er, data) {
    if (er)
      throw er;
    t.deepEqual(data, pkg);
    server.close();
    t.end();
  });
});
