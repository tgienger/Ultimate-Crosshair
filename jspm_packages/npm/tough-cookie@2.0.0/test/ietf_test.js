/* */ 
'use strict';
var vows = require("vows");
var assert = require("assert");
var fs = require("fs");
var path = require("path");
var url = require("url");
var tough = require("../lib/cookie");
var Cookie = tough.Cookie;
var CookieJar = tough.CookieJar;
function readJson(filePath) {
  filePath = path.join(__dirname, filePath);
  return JSON.parse(fs.readFileSync(filePath).toString());
}
function setGetCookieVows() {
  var theVows = {};
  var data = readJson('./ietf_data/parser.json');
  data.forEach(function(testCase) {
    theVows[testCase.test] = function() {
      var jar = new CookieJar();
      var expected = testCase['sent'];
      var sentFrom = 'http://home.example.org/cookie-parser?' + testCase.test;
      var sentTo = testCase['sent-to'] ? url.resolve('http://home.example.org', testCase['sent-to']) : 'http://home.example.org/cookie-parser-result?' + testCase.test;
      testCase['received'].forEach(function(cookieStr) {
        jar.setCookieSync(cookieStr, sentFrom, {ignoreError: true});
      });
      var actual = jar.getCookiesSync(sentTo, {sort: true});
      assert.strictEqual(actual.length, expected.length);
      actual.forEach(function(actualCookie, idx) {
        var expectedCookie = expected[idx];
        assert.strictEqual(actualCookie.key, expectedCookie.name);
        assert.strictEqual(actualCookie.value, expectedCookie.value);
      });
    };
  });
  return {'Set/get cookie tests': theVows};
}
function dateVows() {
  var theVows = {};
  ['./ietf_data/dates/bsd-examples.json', './ietf_data/dates/examples.json'].forEach(function(filePath) {
    var data = readJson(filePath);
    var fileName = path.basename(filePath);
    data.forEach(function(testCase) {
      theVows[fileName + ' : ' + testCase.test] = function() {
        var actual = tough.parseDate(testCase.test);
        actual = actual ? actual.toUTCString() : null;
        assert.strictEqual(actual, testCase.expected);
      };
    });
  });
  return {'Date': theVows};
}
vows.describe('IETF http state tests').addBatch(setGetCookieVows()).addBatch(dateVows()).export(module);
