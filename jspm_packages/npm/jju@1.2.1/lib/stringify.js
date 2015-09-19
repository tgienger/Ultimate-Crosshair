/* */ 
var Uni = require("./unicode");
if (!(function f() {}).name) {
  Object.defineProperty((function() {}).constructor.prototype, 'name', {get: function() {
      var name = this.toString().match(/^\s*function\s*(\S*)\s*\(/)[1];
      Object.defineProperty(this, 'name', {value: name});
      return name;
    }});
}
var special_chars = {
  0: '\\0',
  8: '\\b',
  9: '\\t',
  10: '\\n',
  11: '\\v',
  12: '\\f',
  13: '\\r',
  92: '\\\\'
};
var hasOwnProperty = Object.prototype.hasOwnProperty;
var escapable = /[\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/;
function _stringify(object, options, recursiveLvl, currentKey) {
  var opt_json = options.mode === 'json';
  function indent(str, add) {
    var prefix = options._prefix ? options._prefix : '';
    if (!options.indent)
      return prefix + str;
    var result = '';
    var count = recursiveLvl + (add || 0);
    for (var i = 0; i < count; i++)
      result += options.indent;
    return prefix + result + str + (add ? '\n' : '');
  }
  function _stringify_key(key) {
    if (options.quote_keys)
      return _stringify_str(key);
    if (String(Number(key)) == key && key[0] != '-')
      return key;
    if (key == '')
      return _stringify_str(key);
    var result = '';
    for (var i = 0; i < key.length; i++) {
      if (i > 0) {
        if (!Uni.isIdentifierPart(key[i]))
          return _stringify_str(key);
      } else {
        if (!Uni.isIdentifierStart(key[i]))
          return _stringify_str(key);
      }
      var chr = key.charCodeAt(i);
      if (options.ascii) {
        if (chr < 0x80) {
          result += key[i];
        } else {
          result += '\\u' + ('0000' + chr.toString(16)).slice(-4);
        }
      } else {
        if (escapable.exec(key[i])) {
          result += '\\u' + ('0000' + chr.toString(16)).slice(-4);
        } else {
          result += key[i];
        }
      }
    }
    return result;
  }
  function _stringify_str(key) {
    var quote = options.quote;
    var quoteChr = quote.charCodeAt(0);
    var result = '';
    for (var i = 0; i < key.length; i++) {
      var chr = key.charCodeAt(i);
      if (chr < 0x10) {
        if (chr === 0 && !opt_json) {
          result += '\\0';
        } else if (chr >= 8 && chr <= 13 && (!opt_json || chr !== 11)) {
          result += special_chars[chr];
        } else if (!opt_json) {
          result += '\\x0' + chr.toString(16);
        } else {
          result += '\\u000' + chr.toString(16);
        }
      } else if (chr < 0x20) {
        if (!opt_json) {
          result += '\\x' + chr.toString(16);
        } else {
          result += '\\u00' + chr.toString(16);
        }
      } else if (chr >= 0x20 && chr < 0x80) {
        if (chr === 47 && i && key[i - 1] === '<') {
          result += '\\' + key[i];
        } else if (chr === 92) {
          result += '\\\\';
        } else if (chr === quoteChr) {
          result += '\\' + quote;
        } else {
          result += key[i];
        }
      } else if (options.ascii || Uni.isLineTerminator(key[i]) || escapable.exec(key[i])) {
        if (chr < 0x100) {
          if (!opt_json) {
            result += '\\x' + chr.toString(16);
          } else {
            result += '\\u00' + chr.toString(16);
          }
        } else if (chr < 0x1000) {
          result += '\\u0' + chr.toString(16);
        } else if (chr < 0x10000) {
          result += '\\u' + chr.toString(16);
        } else {
          throw Error('weird codepoint');
        }
      } else {
        result += key[i];
      }
    }
    return quote + result + quote;
  }
  function _stringify_object() {
    if (object === null)
      return 'null';
    var result = [],
        len = 0,
        braces;
    if (Array.isArray(object)) {
      braces = '[]';
      for (var i = 0; i < object.length; i++) {
        var s = _stringify(object[i], options, recursiveLvl + 1, String(i));
        if (s === undefined)
          s = 'null';
        len += s.length + 2;
        result.push(s + ',');
      }
    } else {
      braces = '{}';
      var fn = function(key) {
        var t = _stringify(object[key], options, recursiveLvl + 1, key);
        if (t !== undefined) {
          t = _stringify_key(key) + ':' + (options.indent ? ' ' : '') + t + ',';
          len += t.length + 1;
          result.push(t);
        }
      };
      if (Array.isArray(options.replacer)) {
        for (var i = 0; i < options.replacer.length; i++)
          if (hasOwnProperty.call(object, options.replacer[i]))
            fn(options.replacer[i]);
      } else {
        var keys = Object.keys(object);
        if (options.sort_keys)
          keys = keys.sort(typeof(options.sort_keys) === 'function' ? options.sort_keys : undefined);
        keys.forEach(fn);
      }
    }
    len -= 2;
    if (options.indent && (len > options._splitMax - recursiveLvl * options.indent.length || len > options._splitMin)) {
      if (options.no_trailing_comma && result.length) {
        result[result.length - 1] = result[result.length - 1].substring(0, result[result.length - 1].length - 1);
      }
      var innerStuff = result.map(function(x) {
        return indent(x, 1);
      }).join('');
      return braces[0] + (options.indent ? '\n' : '') + innerStuff + indent(braces[1]);
    } else {
      if (result.length) {
        result[result.length - 1] = result[result.length - 1].substring(0, result[result.length - 1].length - 1);
      }
      var innerStuff = result.join(options.indent ? ' ' : '');
      return braces[0] + innerStuff + braces[1];
    }
  }
  function _stringify_nonobject(object) {
    if (typeof(options.replacer) === 'function') {
      object = options.replacer.call(null, currentKey, object);
    }
    switch (typeof(object)) {
      case 'string':
        return _stringify_str(object);
      case 'number':
        if (object === 0 && 1 / object < 0) {
          return '-0';
        }
        if (options.mode === 'json' && !Number.isFinite(object)) {
          return 'null';
        }
        return object.toString();
      case 'boolean':
        return object.toString();
      case 'undefined':
        return undefined;
      case 'function':
      default:
        return JSON.stringify(object);
    }
  }
  if (options._stringify_key) {
    return _stringify_key(object);
  }
  if (typeof(object) === 'object') {
    if (object === null)
      return 'null';
    var str;
    if (typeof(str = object.toJSON5) === 'function' && options.mode !== 'json') {
      object = str.call(object, currentKey);
    } else if (typeof(str = object.toJSON) === 'function') {
      object = str.call(object, currentKey);
    }
    if (object === null)
      return 'null';
    if (typeof(object) !== 'object')
      return _stringify_nonobject(object);
    if (object.constructor === Number || object.constructor === Boolean || object.constructor === String) {
      object = object.valueOf();
      return _stringify_nonobject(object);
    } else if (object.constructor === Date) {
      return _stringify_nonobject(object.toISOString());
    } else {
      if (typeof(options.replacer) === 'function') {
        object = options.replacer.call(null, currentKey, object);
        if (typeof(object) !== 'object')
          return _stringify_nonobject(object);
      }
      return _stringify_object(object);
    }
  } else {
    return _stringify_nonobject(object);
  }
}
module.exports.stringify = function stringifyJSON(object, options, _space) {
  if (typeof(options) === 'function' || Array.isArray(options)) {
    options = {replacer: options};
  } else if (typeof(options) === 'object' && options !== null) {} else {
    options = {};
  }
  if (_space != null)
    options.indent = _space;
  if (options.indent == null)
    options.indent = '\t';
  if (options.quote == null)
    options.quote = "'";
  if (options.ascii == null)
    options.ascii = false;
  if (options.mode == null)
    options.mode = 'simple';
  if (options.mode === 'json') {
    options.quote = '"';
    options.no_trailing_comma = true;
    options.quote_keys = true;
  }
  if (typeof(options.indent) === 'object') {
    if (options.indent.constructor === Number || options.indent.constructor === Boolean || options.indent.constructor === String)
      options.indent = options.indent.valueOf();
  }
  if (typeof(options.indent) === 'number') {
    if (options.indent >= 0) {
      options.indent = Array(Math.min(~~options.indent, 10) + 1).join(' ');
    } else {
      options.indent = false;
    }
  } else if (typeof(options.indent) === 'string') {
    options.indent = options.indent.substr(0, 10);
  }
  if (options._splitMin == null)
    options._splitMin = 50;
  if (options._splitMax == null)
    options._splitMax = 70;
  return _stringify(object, options, 0, '');
};
