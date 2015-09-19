/* */ 
var test = require("tap").test;
var server = require("./lib/server");
var common = require("./lib/common");
var client = common.freshClient();
var pkg = {
  _id: 'some-package@1.2.3',
  name: 'some-package',
  version: '1.2.3'
};
test('basic request', function(t) {
  server.expect('/-/some-package/1.2.3', function(req, res) {
    res.writeHead(301, {'Location': '/some-package/1.2.3'});
    res.end('Redirecting');
  });
  server.expect('/-/some-package/1.2.3', function(req, res) {
    res.writeHead(301, {'Location': '/some-package/1.2.3'});
    res.end('Redirecting');
  });
  server.expect('/some-package/1.2.3', function(req, res) {
    res.json(pkg);
  });
  t.plan(2);
  client.get('http://localhost:1337/-/some-package/1.2.3', {follow: false}, function(er) {
    t.ok(er, 'Error must be set');
  });
  client.get('http://localhost:1337/-/some-package/1.2.3', {follow: true}, function(er, data) {
    t.deepEqual(data, pkg);
  });
});
test('cleanup', function(t) {
  server.close();
  t.end();
});
