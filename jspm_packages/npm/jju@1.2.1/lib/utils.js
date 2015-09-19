/* */ 
var FS = require("fs");
var jju = require("../index");
module.exports.register = function() {
  var r = require,
      e = 'extensions';
  r[e]['.json5'] = function(m, f) {
    m.exports = jju.parse(FS.readFileSync(f, 'utf8'));
  };
};
module.exports.patch_JSON_parse = function() {
  var _parse = JSON.parse;
  JSON.parse = function(text, rev) {
    try {
      return _parse(text, rev);
    } catch (err) {
      require("../index").parse(text, {
        mode: 'json',
        legacy: true,
        reviver: rev,
        reserved_keys: 'replace',
        null_prototype: false
      });
      throw err;
    }
  };
};
module.exports.middleware = function() {
  return function(req, res, next) {
    throw Error('this function is removed, use express-json5 instead');
  };
};
