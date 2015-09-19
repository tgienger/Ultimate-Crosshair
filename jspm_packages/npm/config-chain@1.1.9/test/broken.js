/* */ 
var cc = require("../index");
var assert = require("assert");
assert.throws(function() {
  cc(__dirname + '/broken.json');
});
