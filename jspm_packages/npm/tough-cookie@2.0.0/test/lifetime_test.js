/* */ 
'use strict';
var vows = require("vows");
var assert = require("assert");
var tough = require("../lib/cookie");
var Cookie = tough.Cookie;
vows.describe('Lifetime').addBatch({
  "TTL with max-age": function() {
    var c = new Cookie();
    c.maxAge = 123;
    assert.equal(c.TTL(), 123000);
    assert.equal(c.expiryTime(new Date(9000000)), 9123000);
  },
  "TTL with zero max-age": function() {
    var c = new Cookie();
    c.key = 'a';
    c.value = 'b';
    c.maxAge = 0;
    assert.equal(c.TTL(), 0);
    assert.equal(c.expiryTime(new Date(9000000)), -Infinity);
    assert.ok(!c.validate());
  },
  "TTL with negative max-age": function() {
    var c = new Cookie();
    c.key = 'a';
    c.value = 'b';
    c.maxAge = -1;
    assert.equal(c.TTL(), 0);
    assert.equal(c.expiryTime(new Date(9000000)), -Infinity);
    assert.ok(!c.validate());
  },
  "TTL with max-age and expires": function() {
    var c = new Cookie();
    c.maxAge = 123;
    c.expires = new Date(Date.now() + 9000);
    assert.equal(c.TTL(), 123000);
    assert.ok(c.isPersistent());
  },
  "TTL with expires": function() {
    var c = new Cookie();
    var now = Date.now();
    c.expires = new Date(now + 9000);
    assert.equal(c.TTL(now), 9000);
    assert.equal(c.expiryTime(), c.expires.getTime());
  },
  "TTL with old expires": function() {
    var c = new Cookie();
    c.setExpires('17 Oct 2010 00:00:00 GMT');
    assert.ok(c.TTL() < 0);
    assert.ok(c.isPersistent());
  },
  "default TTL": {
    topic: function() {
      return new Cookie();
    },
    "is Infinite-future": function(c) {
      assert.equal(c.TTL(), Infinity);
    },
    "is a 'session' cookie": function(c) {
      assert.ok(!c.isPersistent());
    }
  }
}).export(module);
