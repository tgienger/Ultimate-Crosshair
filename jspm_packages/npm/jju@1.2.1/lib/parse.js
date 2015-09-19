/* */ 
var Uni = require("./unicode");
function isHexDigit(x) {
  return (x >= '0' && x <= '9') || (x >= 'A' && x <= 'F') || (x >= 'a' && x <= 'f');
}
function isOctDigit(x) {
  return x >= '0' && x <= '7';
}
function isDecDigit(x) {
  return x >= '0' && x <= '9';
}
var unescapeMap = {
  '\'': '\'',
  '"': '"',
  '\\': '\\',
  'b': '\b',
  'f': '\f',
  'n': '\n',
  'r': '\r',
  't': '\t',
  'v': '\v',
  '/': '/'
};
function formatError(input, msg, position, lineno, column, json5) {
  var result = msg + ' at ' + (lineno + 1) + ':' + (column + 1),
      tmppos = position - column - 1,
      srcline = '',
      underline = '';
  var isLineTerminator = json5 ? Uni.isLineTerminator : Uni.isLineTerminatorJSON;
  if (tmppos < position - 70) {
    tmppos = position - 70;
  }
  while (1) {
    var chr = input[++tmppos];
    if (isLineTerminator(chr) || tmppos === input.length) {
      if (position >= tmppos) {
        underline += '^';
      }
      break;
    }
    srcline += chr;
    if (position === tmppos) {
      underline += '^';
    } else if (position > tmppos) {
      underline += input[tmppos] === '\t' ? '\t' : ' ';
    }
    if (srcline.length > 78)
      break;
  }
  return result + '\n' + srcline + '\n' + underline;
}
function parse(input, options) {
  var json5 = !(options.mode === 'json' || options.legacy);
  var isLineTerminator = json5 ? Uni.isLineTerminator : Uni.isLineTerminatorJSON;
  var isWhiteSpace = json5 ? Uni.isWhiteSpace : Uni.isWhiteSpaceJSON;
  var length = input.length,
      lineno = 0,
      linestart = 0,
      position = 0,
      stack = [];
  var tokenStart = function() {};
  var tokenEnd = function(v) {
    return v;
  };
  if (options._tokenize) {
    ;
    (function() {
      var start = null;
      tokenStart = function() {
        if (start !== null)
          throw Error('internal error, token overlap');
        start = position;
      };
      tokenEnd = function(v, type) {
        if (start != position) {
          var hash = {
            raw: input.substr(start, position - start),
            type: type,
            stack: stack.slice(0)
          };
          if (v !== undefined)
            hash.value = v;
          options._tokenize.call(null, hash);
        }
        start = null;
        return v;
      };
    })();
  }
  function fail(msg) {
    var column = position - linestart;
    if (!msg) {
      if (position < length) {
        var token = '\'' + JSON.stringify(input[position]).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\'';
        if (!msg)
          msg = 'Unexpected token ' + token;
      } else {
        if (!msg)
          msg = 'Unexpected end of input';
      }
    }
    var error = SyntaxError(formatError(input, msg, position, lineno, column, json5));
    error.row = lineno + 1;
    error.column = column + 1;
    throw error;
  }
  function newline(chr) {
    if (chr === '\r' && input[position] === '\n')
      position++;
    linestart = position;
    lineno++;
  }
  function parseGeneric() {
    var result;
    while (position < length) {
      tokenStart();
      var chr = input[position++];
      if (chr === '"' || (chr === '\'' && json5)) {
        return tokenEnd(parseString(chr), 'literal');
      } else if (chr === '{') {
        tokenEnd(undefined, 'separator');
        return parseObject();
      } else if (chr === '[') {
        tokenEnd(undefined, 'separator');
        return parseArray();
      } else if (chr === '-' || chr === '.' || isDecDigit(chr) || (json5 && (chr === '+' || chr === 'I' || chr === 'N'))) {
        return tokenEnd(parseNumber(), 'literal');
      } else if (chr === 'n') {
        parseKeyword('null');
        return tokenEnd(null, 'literal');
      } else if (chr === 't') {
        parseKeyword('true');
        return tokenEnd(true, 'literal');
      } else if (chr === 'f') {
        parseKeyword('false');
        return tokenEnd(false, 'literal');
      } else {
        position--;
        return tokenEnd(undefined);
      }
    }
  }
  function parseKey() {
    var result;
    while (position < length) {
      tokenStart();
      var chr = input[position++];
      if (chr === '"' || (chr === '\'' && json5)) {
        return tokenEnd(parseString(chr), 'key');
      } else if (chr === '{') {
        tokenEnd(undefined, 'separator');
        return parseObject();
      } else if (chr === '[') {
        tokenEnd(undefined, 'separator');
        return parseArray();
      } else if (chr === '.' || isDecDigit(chr)) {
        return tokenEnd(parseNumber(true), 'key');
      } else if (json5 && Uni.isIdentifierStart(chr) || (chr === '\\' && input[position] === 'u')) {
        var rollback = position - 1;
        var result = parseIdentifier();
        if (result === undefined) {
          position = rollback;
          return tokenEnd(undefined);
        } else {
          return tokenEnd(result, 'key');
        }
      } else {
        position--;
        return tokenEnd(undefined);
      }
    }
  }
  function skipWhiteSpace() {
    tokenStart();
    while (position < length) {
      var chr = input[position++];
      if (isLineTerminator(chr)) {
        position--;
        tokenEnd(undefined, 'whitespace');
        tokenStart();
        position++;
        newline(chr);
        tokenEnd(undefined, 'newline');
        tokenStart();
      } else if (isWhiteSpace(chr)) {} else if (chr === '/' && json5 && (input[position] === '/' || input[position] === '*')) {
        position--;
        tokenEnd(undefined, 'whitespace');
        tokenStart();
        position++;
        skipComment(input[position++] === '*');
        tokenEnd(undefined, 'comment');
        tokenStart();
      } else {
        position--;
        break;
      }
    }
    return tokenEnd(undefined, 'whitespace');
  }
  function skipComment(multi) {
    while (position < length) {
      var chr = input[position++];
      if (isLineTerminator(chr)) {
        if (!multi) {
          position--;
          return;
        }
        newline(chr);
      } else if (chr === '*' && multi) {
        if (input[position] === '/') {
          position++;
          return;
        }
      } else {}
    }
    if (multi) {
      fail('Unclosed multiline comment');
    }
  }
  function parseKeyword(keyword) {
    var _pos = position;
    var len = keyword.length;
    for (var i = 1; i < len; i++) {
      if (position >= length || keyword[i] != input[position]) {
        position = _pos - 1;
        fail();
      }
      position++;
    }
  }
  function parseObject() {
    var result = options.null_prototype ? Object.create(null) : {},
        empty_object = {},
        is_non_empty = false;
    while (position < length) {
      skipWhiteSpace();
      var item1 = parseKey();
      skipWhiteSpace();
      tokenStart();
      var chr = input[position++];
      tokenEnd(undefined, 'separator');
      if (chr === '}' && item1 === undefined) {
        if (!json5 && is_non_empty) {
          position--;
          fail('Trailing comma in object');
        }
        return result;
      } else if (chr === ':' && item1 !== undefined) {
        skipWhiteSpace();
        stack.push(item1);
        var item2 = parseGeneric();
        stack.pop();
        if (item2 === undefined)
          fail('No value found for key ' + item1);
        if (typeof(item1) !== 'string') {
          if (!json5 || typeof(item1) !== 'number') {
            fail('Wrong key type: ' + item1);
          }
        }
        if ((item1 in empty_object || empty_object[item1] != null) && options.reserved_keys !== 'replace') {
          if (options.reserved_keys === 'throw') {
            fail('Reserved key: ' + item1);
          } else {}
        } else {
          if (typeof(options.reviver) === 'function') {
            item2 = options.reviver.call(null, item1, item2);
          }
          if (item2 !== undefined) {
            is_non_empty = true;
            Object.defineProperty(result, item1, {
              value: item2,
              enumerable: true,
              configurable: true,
              writable: true
            });
          }
        }
        skipWhiteSpace();
        tokenStart();
        var chr = input[position++];
        tokenEnd(undefined, 'separator');
        if (chr === ',') {
          continue;
        } else if (chr === '}') {
          return result;
        } else {
          fail();
        }
      } else {
        position--;
        fail();
      }
    }
    fail();
  }
  function parseArray() {
    var result = [];
    while (position < length) {
      skipWhiteSpace();
      stack.push(result.length);
      var item = parseGeneric();
      stack.pop();
      skipWhiteSpace();
      tokenStart();
      var chr = input[position++];
      tokenEnd(undefined, 'separator');
      if (item !== undefined) {
        if (typeof(options.reviver) === 'function') {
          item = options.reviver.call(null, String(result.length), item);
        }
        if (item === undefined) {
          result.length++;
          item = true;
        } else {
          result.push(item);
        }
      }
      if (chr === ',') {
        if (item === undefined) {
          fail('Elisions are not supported');
        }
      } else if (chr === ']') {
        if (!json5 && item === undefined && result.length) {
          position--;
          fail('Trailing comma in array');
        }
        return result;
      } else {
        position--;
        fail();
      }
    }
  }
  function parseNumber() {
    position--;
    var start = position,
        chr = input[position++],
        t;
    var to_num = function(is_octal) {
      var str = input.substr(start, position - start);
      if (is_octal) {
        var result = parseInt(str.replace(/^0o?/, ''), 8);
      } else {
        var result = Number(str);
      }
      if (Number.isNaN(result)) {
        position--;
        fail('Bad numeric literal - "' + input.substr(start, position - start + 1) + '"');
      } else if (!json5 && !str.match(/^-?(0|[1-9][0-9]*)(\.[0-9]+)?(e[+-]?[0-9]+)?$/i)) {
        position--;
        fail('Non-json numeric literal - "' + input.substr(start, position - start + 1) + '"');
      } else {
        return result;
      }
    };
    if (chr === '-' || (chr === '+' && json5))
      chr = input[position++];
    if (chr === 'N' && json5) {
      parseKeyword('NaN');
      return NaN;
    }
    if (chr === 'I' && json5) {
      parseKeyword('Infinity');
      return to_num();
    }
    if (chr >= '1' && chr <= '9') {
      while (position < length && isDecDigit(input[position]))
        position++;
      chr = input[position++];
    }
    if (chr === '0') {
      chr = input[position++];
      var is_octal = chr === 'o' || chr === 'O' || isOctDigit(chr);
      var is_hex = chr === 'x' || chr === 'X';
      if (json5 && (is_octal || is_hex)) {
        while (position < length && (is_hex ? isHexDigit : isOctDigit)(input[position]))
          position++;
        var sign = 1;
        if (input[start] === '-') {
          sign = -1;
          start++;
        } else if (input[start] === '+') {
          start++;
        }
        return sign * to_num(is_octal);
      }
    }
    if (chr === '.') {
      while (position < length && isDecDigit(input[position]))
        position++;
      chr = input[position++];
    }
    if (chr === 'e' || chr === 'E') {
      chr = input[position++];
      if (chr === '-' || chr === '+')
        position++;
      while (position < length && isDecDigit(input[position]))
        position++;
      chr = input[position++];
    }
    position--;
    return to_num();
  }
  function parseIdentifier() {
    position--;
    var result = '';
    while (position < length) {
      var chr = input[position++];
      if (chr === '\\' && input[position] === 'u' && isHexDigit(input[position + 1]) && isHexDigit(input[position + 2]) && isHexDigit(input[position + 3]) && isHexDigit(input[position + 4])) {
        chr = String.fromCharCode(parseInt(input.substr(position + 1, 4), 16));
        position += 5;
      }
      if (result.length) {
        if (Uni.isIdentifierPart(chr)) {
          result += chr;
        } else {
          position--;
          return result;
        }
      } else {
        if (Uni.isIdentifierStart(chr)) {
          result += chr;
        } else {
          return undefined;
        }
      }
    }
    fail();
  }
  function parseString(endChar) {
    var result = '';
    while (position < length) {
      var chr = input[position++];
      if (chr === endChar) {
        return result;
      } else if (chr === '\\') {
        if (position >= length)
          fail();
        chr = input[position++];
        if (unescapeMap[chr] && (json5 || (chr != 'v' && chr != "'"))) {
          result += unescapeMap[chr];
        } else if (json5 && isLineTerminator(chr)) {
          newline(chr);
        } else if (chr === 'u' || (chr === 'x' && json5)) {
          var off = chr === 'u' ? 4 : 2;
          for (var i = 0; i < off; i++) {
            if (position >= length)
              fail();
            if (!isHexDigit(input[position]))
              fail('Bad escape sequence');
            position++;
          }
          result += String.fromCharCode(parseInt(input.substr(position - off, off), 16));
        } else if (json5 && isOctDigit(chr)) {
          if (chr < '4' && isOctDigit(input[position]) && isOctDigit(input[position + 1])) {
            var digits = 3;
          } else if (isOctDigit(input[position])) {
            var digits = 2;
          } else {
            var digits = 1;
          }
          position += digits - 1;
          result += String.fromCharCode(parseInt(input.substr(position - digits, digits), 8));
        } else if (json5) {
          result += chr;
        } else {
          position--;
          fail();
        }
      } else if (isLineTerminator(chr)) {
        fail();
      } else {
        if (!json5 && chr.charCodeAt(0) < 32) {
          position--;
          fail('Unexpected control character');
        }
        result += chr;
      }
    }
    fail();
  }
  skipWhiteSpace();
  var return_value = parseGeneric();
  if (return_value !== undefined || position < length) {
    skipWhiteSpace();
    if (position >= length) {
      if (typeof(options.reviver) === 'function') {
        return_value = options.reviver.call(null, '', return_value);
      }
      return return_value;
    } else {
      fail();
    }
  } else {
    if (position) {
      fail('No data, only a whitespace');
    } else {
      fail('No data, empty input');
    }
  }
}
module.exports.parse = function parseJSON(input, options) {
  if (typeof(options) === 'function') {
    options = {reviver: options};
  }
  if (input === undefined) {
    return undefined;
  }
  if (typeof(input) !== 'string')
    input = String(input);
  if (options == null)
    options = {};
  if (options.reserved_keys == null)
    options.reserved_keys = 'ignore';
  if (options.reserved_keys === 'throw' || options.reserved_keys === 'ignore') {
    if (options.null_prototype == null) {
      options.null_prototype = true;
    }
  }
  try {
    return parse(input, options);
  } catch (err) {
    if (err instanceof SyntaxError && err.row != null && err.column != null) {
      var old_err = err;
      err = SyntaxError(old_err.message);
      err.column = old_err.column;
      err.row = old_err.row;
    }
    throw err;
  }
};
module.exports.tokenize = function tokenizeJSON(input, options) {
  if (options == null)
    options = {};
  options._tokenize = function(smth) {
    if (options._addstack)
      smth.stack.unshift.apply(smth.stack, options._addstack);
    tokens.push(smth);
  };
  var tokens = [];
  tokens.data = module.exports.parse(input, options);
  return tokens;
};
