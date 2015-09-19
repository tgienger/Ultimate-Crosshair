/* */ 
'use strict';
var vows = require("vows");
var assert = require("assert");
var tough = require("../lib/cookie");
var Cookie = tough.Cookie;
vows.describe('Cookie.toString()').addBatch({
  "a simple cookie": {
    topic: function() {
      var c = new Cookie();
      c.key = 'a';
      c.value = 'b';
      return c;
    },
    "validates": function(c) {
      assert.ok(c.validate());
    },
    "to string": function(c) {
      assert.equal(c.toString(), 'a=b');
    }
  },
  "a cookie with spaces in the value": {
    topic: function() {
      var c = new Cookie();
      c.key = 'a';
      c.value = 'beta gamma';
      return c;
    },
    "doesn't validate": function(c) {
      assert.ok(!c.validate());
    },
    "'garbage in, garbage out'": function(c) {
      assert.equal(c.toString(), 'a=beta gamma');
    }
  },
  "with an empty value and HttpOnly": {
    topic: function() {
      var c = new Cookie();
      c.key = 'a';
      c.httpOnly = true;
      return c;
    },
    "to string": function(c) {
      assert.equal(c.toString(), 'a=; HttpOnly');
    }
  },
  "with an expiry": {
    topic: function() {
      var c = new Cookie();
      c.key = 'a';
      c.value = 'b';
      c.setExpires("Oct 18 2011 07:05:03 GMT");
      return c;
    },
    "validates": function(c) {
      assert.ok(c.validate());
    },
    "to string": function(c) {
      assert.equal(c.toString(), 'a=b; Expires=Tue, 18 Oct 2011 07:05:03 GMT');
    },
    "to short string": function(c) {
      assert.equal(c.cookieString(), 'a=b');
    }
  },
  "with a max-age": {
    topic: function() {
      var c = new Cookie();
      c.key = 'a';
      c.value = 'b';
      c.setExpires("Oct 18 2011 07:05:03 GMT");
      c.maxAge = 12345;
      return c;
    },
    "validates": function(c) {
      assert.ok(c.validate());
    },
    "to string": function(c) {
      assert.equal(c.toString(), 'a=b; Expires=Tue, 18 Oct 2011 07:05:03 GMT; Max-Age=12345');
    }
  },
  "with a bunch of things": function() {
    var c = new Cookie();
    c.key = 'a';
    c.value = 'b';
    c.setExpires("Oct 18 2011 07:05:03 GMT");
    c.maxAge = 12345;
    c.domain = 'example.com';
    c.path = '/foo';
    c.secure = true;
    c.httpOnly = true;
    c.extensions = ['MyExtension'];
    assert.equal(c.toString(), 'a=b; Expires=Tue, 18 Oct 2011 07:05:03 GMT; Max-Age=12345; Domain=example.com; Path=/foo; Secure; HttpOnly; MyExtension');
  },
  "a host-only cookie": {
    topic: function() {
      var c = new Cookie();
      c.key = 'a';
      c.value = 'b';
      c.hostOnly = true;
      c.domain = 'shouldnt-stringify.example.com';
      c.path = '/should-stringify';
      return c;
    },
    "validates": function(c) {
      assert.ok(c.validate());
    },
    "to string": function(c) {
      assert.equal(c.toString(), 'a=b; Path=/should-stringify');
    }
  },
  "minutes are '10'": {
    topic: function() {
      var c = new Cookie();
      c.key = 'a';
      c.value = 'b';
      c.expires = new Date(1284113410000);
      return c;
    },
    "validates": function(c) {
      assert.ok(c.validate());
    },
    "to string": function(c) {
      var str = c.toString();
      assert.notEqual(str, 'a=b; Expires=Fri, 010 Sep 2010 010:010:010 GMT');
      assert.equal(str, 'a=b; Expires=Fri, 10 Sep 2010 10:10:10 GMT');
    }
  }
}).export(module);
