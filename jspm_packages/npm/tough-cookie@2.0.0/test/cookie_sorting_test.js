/* */ 
'use strict';
var vows = require("vows");
var assert = require("assert");
var tough = require("../lib/cookie");
var Cookie = tough.Cookie;
var CookieJar = tough.CookieJar;
function toKeyArray(cookies) {
  return cookies.map(function(c) {
    return c.key;
  });
}
vows.describe('Cookie sorting').addBatch({"Assumptions:": {
    ".creationIndex is set during construction": function() {
      var now = new Date();
      var c1 = new Cookie();
      var c2 = new Cookie();
      assert.isNumber(c1.creationIndex);
      assert.isNumber(c2.creationIndex);
      assert(c1.creationIndex < c2.creationIndex, 'creationIndex should increase with each construction');
    },
    ".creationIndex is set during construction (forced ctime)": function() {
      var now = new Date();
      var c1 = new Cookie({creation: now});
      var c2 = new Cookie({creation: now});
      assert.strictEqual(c1.creation, c2.creation);
      assert.isNumber(c1.creationIndex);
      assert.isNumber(c2.creationIndex);
      assert(c1.creationIndex < c2.creationIndex, 'creationIndex should increase with each construction');
    },
    ".creationIndex is left alone during new setCookie": function() {
      var jar = new CookieJar();
      var c = new Cookie({
        key: 'k',
        value: 'v',
        domain: 'example.com'
      });
      var now = new Date();
      var beforeDate = c.creation;
      assert.instanceOf(beforeDate, Date);
      assert.notStrictEqual(now, beforeDate);
      var beforeIndex = c.creationIndex;
      assert.isNumber(c.creationIndex);
      jar.setCookieSync(c, 'http://example.com/', {now: now});
      assert.strictEqual(c.creation, now);
      assert.strictEqual(c.creationIndex, beforeIndex);
    },
    ".creationIndex is preserved during update setCookie": function() {
      var jar = new CookieJar();
      var thisMs = Date.now();
      var t1 = new Date(thisMs);
      var t2 = new Date(thisMs);
      assert.notStrictEqual(t1, t2);
      var c = new Cookie({
        key: 'k',
        value: 'v1',
        domain: 'example.com'
      });
      jar.setCookieSync(c, 'http://example.com/', {now: t1});
      var originalIndex = c.creationIndex;
      assert.strictEqual(c.creation, t1);
      assert.strictEqual(c.lastAccessed, t1);
      c = new Cookie({
        key: 'k',
        value: 'v2',
        domain: 'example.com'
      });
      assert.notStrictEqual(c.creation, t1);
      jar.setCookieSync(c, 'http://example.com/', {now: t2});
      assert.strictEqual(c.creation, t1);
      assert.strictEqual(c.lastAccessed, t2);
      assert.strictEqual(c.creationIndex, originalIndex);
    }
  }}).addBatch({"Cookie Sorting": {
    topic: function() {
      var cookies = [];
      cookies.push(Cookie.parse("a=0; Domain=example.com"));
      cookies.push(Cookie.parse("b=1; Domain=www.example.com"));
      cookies.push(Cookie.parse("c=2; Domain=example.com; Path=/pathA"));
      cookies.push(Cookie.parse("d=3; Domain=www.example.com; Path=/pathA"));
      cookies.push(Cookie.parse("e=4; Domain=example.com; Path=/pathA/pathB"));
      cookies.push(Cookie.parse("f=5; Domain=www.example.com; Path=/pathA/pathB"));
      cookies = cookies.sort(function() {
        return Math.random() - 0.5;
      });
      cookies = cookies.sort(tough.cookieCompare);
      return cookies;
    },
    "got": function(cookies) {
      assert.lengthOf(cookies, 6);
      assert.deepEqual(toKeyArray(cookies), ['e', 'f', 'c', 'd', 'a', 'b']);
    }
  }}).addBatch({"Changing creation date affects sorting": {
    topic: function() {
      var cookies = [];
      var now = Date.now();
      cookies.push(Cookie.parse("a=0;"));
      cookies.push(Cookie.parse("b=1;"));
      cookies.push(Cookie.parse("c=2;"));
      cookies.forEach(function(cookie, idx) {
        cookie.creation = new Date(now - 100 * idx);
      });
      return cookies.sort(tough.cookieCompare);
    },
    "got": function(cookies) {
      assert.deepEqual(toKeyArray(cookies), ['c', 'b', 'a']);
    }
  }}).export(module);
