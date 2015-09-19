/* */ 
var createReadStream = require("fs").createReadStream;
var test = require("tap").test;
var server = require("./lib/server");
var common = require("./lib/common");
var config = {retry: {retries: 0}};
var client = common.freshClient(config);
var URI = 'http://localhost:1337/';
var USERNAME = 'username';
var PASSWORD = '%1234@asdf%';
var EMAIL = 'i@izs.me';
var METADATA = require("../package.json!systemjs-json");
var ACCESS = 'public';
var BODY_PATH = require.resolve('../package.json');
var BODY = createReadStream(BODY_PATH);
var AUTH = {
  username: USERNAME,
  password: PASSWORD,
  email: EMAIL
};
var PARAMS = {
  metadata: METADATA,
  access: ACCESS,
  body: BODY,
  auth: AUTH
};
test('publish with a 500 response but no message', function(t) {
  server.expect('/npm-registry-client', function(req, res) {
    res.statusCode = 500;
    res.json({success: false});
  });
  client.publish(URI, PARAMS, function(er, data) {
    t.ok(er, 'got expected error');
    t.notOk(data, 'no payload on failure');
    server.close();
    t.end();
  });
});
