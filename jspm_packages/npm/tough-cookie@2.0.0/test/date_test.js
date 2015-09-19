/* */ 
'use strict';
var vows = require("vows");
var assert = require("assert");
var tough = require("../lib/cookie");
function dateVows(table) {
  var theVows = {};
  Object.keys(table).forEach(function(date) {
    var expect = table[date];
    theVows[date] = function() {
      var got = tough.parseDate(date) ? 'valid' : 'invalid';
      assert.equal(got, expect ? 'valid' : 'invalid');
    };
  });
  return {"date parsing": theVows};
}
vows.describe('Date').addBatch(dateVows({
  "Wed, 09 Jun 2021 10:18:14 GMT": true,
  "Wed, 09 Jun 2021 22:18:14 GMT": true,
  "Tue, 18 Oct 2011 07:42:42.123 GMT": true,
  "18 Oct 2011 07:42:42 GMT": true,
  "8 Oct 2011 7:42:42 GMT": true,
  "8 Oct 2011 7:2:42 GMT": true,
  "Oct 18 2011 07:42:42 GMT": true,
  "Tue Oct 18 2011 07:05:03 GMT+0000 (GMT)": true,
  "09 Jun 2021 10:18:14 GMT": true,
  "99 Jix 3038 48:86:72 ZMT": false,
  '01 Jan 1970 00:00:00 GMT': true,
  '01 Jan 1600 00:00:00 GMT': false,
  '01 Jan 1601 00:00:00 GMT': true,
  '10 Feb 81 13:00:00 GMT': true,
  'Thu, 17-Apr-2014 02:12:29 GMT': true,
  'Thu, 17-Apr-2014 02:12:29 UTC': true
})).addBatch({"strict date parse of Thu, 01 Jan 1970 00:00:010 GMT": {
    topic: function() {
      return tough.parseDate('Thu, 01 Jan 1970 00:00:010 GMT', true) ? true : false;
    },
    "invalid": function(date) {
      assert.equal(date, false);
    }
  }}).export(module);
