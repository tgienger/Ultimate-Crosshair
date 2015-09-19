/* */ 
'use strict';
var vows = require("vows");
var assert = require("assert");
var tough = require("../lib/cookie");
var Cookie = tough.Cookie;
function matchVows(func, table) {
  var theVows = {};
  table.forEach(function(item) {
    var str = item[0];
    var dom = item[1];
    var expect = item[2];
    var label = str + (expect ? " matches " : " doesn't match ") + dom;
    theVows[label] = function() {
      assert.equal(func(str, dom), expect);
    };
  });
  return theVows;
}
function defaultPathVows(table) {
  var theVows = {};
  table.forEach(function(item) {
    var str = item[0];
    var expect = item[1];
    var label = str + " gives " + expect;
    theVows[label] = function() {
      assert.equal(tough.defaultPath(str), expect);
    };
  });
  return theVows;
}
vows.describe('Domain and Path').addBatch({"domain normalization": {
    "simple": function() {
      var c = new Cookie();
      c.domain = "EXAMPLE.com";
      assert.equal(c.canonicalizedDomain(), "example.com");
    },
    "extra dots": function() {
      var c = new Cookie();
      c.domain = ".EXAMPLE.com";
      assert.equal(c.cdomain(), "example.com");
    },
    "weird trailing dot": function() {
      var c = new Cookie();
      c.domain = "EXAMPLE.ca.";
      assert.equal(c.canonicalizedDomain(), "example.ca.");
    },
    "weird internal dots": function() {
      var c = new Cookie();
      c.domain = "EXAMPLE...ca.";
      assert.equal(c.canonicalizedDomain(), "example...ca.");
    },
    "IDN": function() {
      var c = new Cookie();
      c.domain = "δοκιμή.δοκιμή";
      assert.equal(c.canonicalizedDomain(), "xn--jxalpdlp.xn--jxalpdlp");
    }
  }}).addBatch({"Domain Match": matchVows(tough.domainMatch, [["example.com", "example.com", true], ["eXaMpLe.cOm", "ExAmPlE.CoM", true], ["no.ca", "yes.ca", false], ["wwwexample.com", "example.com", false], ["www.example.com", "example.com", true], ["example.com", "www.example.com", false], ["www.subdom.example.com", "example.com", true], ["www.subdom.example.com", "subdom.example.com", true], ["example.com", "example.com.", false], ["192.168.0.1", "168.0.1", false], [null, "example.com", null], ["example.com", null, null], [null, null, null], [undefined, undefined, null]])}).addBatch({"default-path": defaultPathVows([[null, "/"], ["/", "/"], ["/file", "/"], ["/dir/file", "/dir"], ["noslash", "/"]])}).addBatch({"Path-Match": matchVows(tough.pathMatch, [["/", "/", true], ["/dir", "/", true], ["/", "/dir", false], ["/dir/", "/dir/", true], ["/dir/file", "/dir/", true], ["/dir/file", "/dir", true], ["/directory", "/dir", false]])}).addBatch({
  "permuteDomain": {
    "base case": {
      topic: tough.permuteDomain.bind(null, 'example.com'),
      "got the domain": function(list) {
        assert.deepEqual(list, ['example.com']);
      }
    },
    "two levels": {
      topic: tough.permuteDomain.bind(null, 'foo.bar.example.com'),
      "got three things": function(list) {
        assert.deepEqual(list, ['example.com', 'bar.example.com', 'foo.bar.example.com']);
      }
    },
    "local domain": {
      topic: tough.permuteDomain.bind(null, 'foo.bar.example.localduhmain'),
      "got three things": function(list) {
        assert.deepEqual(list, ['example.localduhmain', 'bar.example.localduhmain', 'foo.bar.example.localduhmain']);
      }
    }
  },
  "permutePath": {
    "base case": {
      topic: tough.permutePath.bind(null, '/'),
      "just slash": function(list) {
        assert.deepEqual(list, ['/']);
      }
    },
    "single case": {
      topic: tough.permutePath.bind(null, '/foo'),
      "two things": function(list) {
        assert.deepEqual(list, ['/foo', '/']);
      },
      "path matching": function(list) {
        list.forEach(function(e) {
          assert.ok(tough.pathMatch('/foo', e));
        });
      }
    },
    "double case": {
      topic: tough.permutePath.bind(null, '/foo/bar'),
      "four things": function(list) {
        assert.deepEqual(list, ['/foo/bar', '/foo', '/']);
      },
      "path matching": function(list) {
        list.forEach(function(e) {
          assert.ok(tough.pathMatch('/foo/bar', e));
        });
      }
    },
    "trailing slash": {
      topic: tough.permutePath.bind(null, '/foo/bar/'),
      "three things": function(list) {
        assert.deepEqual(list, ['/foo/bar', '/foo', '/']);
      },
      "path matching": function(list) {
        list.forEach(function(e) {
          assert.ok(tough.pathMatch('/foo/bar/', e));
        });
      }
    }
  }
}).export(module);
