/* */ 
"use strict";
var defaults = require("defaults");
var combining = require("./combining");
var DEFAULTS = {
  nul: 0,
  control: 0
};
module.exports = function wcwidth(str) {
  return wcswidth(str, DEFAULTS);
};
module.exports.config = function(opts) {
  opts = defaults(opts || {}, DEFAULTS);
  return function wcwidth(str) {
    return wcswidth(str, opts);
  };
};
function wcswidth(str, opts) {
  if (typeof str !== 'string')
    return wcwidth(str, opts);
  var s = 0;
  for (var i = 0; i < str.length; i++) {
    var n = wcwidth(str.charCodeAt(i), opts);
    if (n < 0)
      return -1;
    s += n;
  }
  return s;
}
function wcwidth(ucs, opts) {
  if (ucs === 0)
    return opts.nul;
  if (ucs < 32 || (ucs >= 0x7f && ucs < 0xa0))
    return opts.control;
  if (bisearch(ucs))
    return 0;
  return 1 + (ucs >= 0x1100 && (ucs <= 0x115f || ucs == 0x2329 || ucs == 0x232a || (ucs >= 0x2e80 && ucs <= 0xa4cf && ucs != 0x303f) || (ucs >= 0xac00 && ucs <= 0xd7a3) || (ucs >= 0xf900 && ucs <= 0xfaff) || (ucs >= 0xfe10 && ucs <= 0xfe19) || (ucs >= 0xfe30 && ucs <= 0xfe6f) || (ucs >= 0xff00 && ucs <= 0xff60) || (ucs >= 0xffe0 && ucs <= 0xffe6) || (ucs >= 0x20000 && ucs <= 0x2fffd) || (ucs >= 0x30000 && ucs <= 0x3fffd)));
}
function bisearch(ucs) {
  var min = 0;
  var max = combining.length - 1;
  var mid;
  if (ucs < combining[0][0] || ucs > combining[max][1])
    return false;
  while (max >= min) {
    mid = Math.floor((min + max) / 2);
    if (ucs > combining[mid][1])
      min = mid + 1;
    else if (ucs < combining[mid][0])
      max = mid - 1;
    else
      return true;
  }
  return false;
}
