/* */ 
var test = require("tap").test;
var readdir = require("../readdir");
test('basic', function(t) {
  var expect = ['@org/x', '@org/y', '@scope/x', '@scope/y', 'a', 'b'];
  readdir(__dirname + '/fixtures', function(er, kids) {
    if (er)
      throw er;
    t.same(kids, expect);
    t.end();
  });
});
