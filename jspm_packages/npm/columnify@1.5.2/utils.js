/* */ 
"use strict";
var wcwidth = require("./width");
function repeatString(str, len) {
  return Array.apply(null, {length: len + 1}).join(str).slice(0, len);
}
function padRight(str, max, chr) {
  str = str != null ? str : '';
  str = String(str);
  var length = max - wcwidth(str);
  if (length <= 0)
    return str;
  return str + repeatString(chr || ' ', length);
}
function padCenter(str, max, chr) {
  str = str != null ? str : '';
  str = String(str);
  var length = max - wcwidth(str);
  if (length <= 0)
    return str;
  var lengthLeft = Math.floor(length / 2);
  var lengthRight = length - lengthLeft;
  return repeatString(chr || ' ', lengthLeft) + str + repeatString(chr || ' ', lengthRight);
}
function padLeft(str, max, chr) {
  str = str != null ? str : '';
  str = String(str);
  var length = max - wcwidth(str);
  if (length <= 0)
    return str;
  return repeatString(chr || ' ', length) + str;
}
function splitIntoLines(str, max) {
  function _splitIntoLines(str, max) {
    return str.trim().split(' ').reduce(function(lines, word) {
      var line = lines[lines.length - 1];
      if (line && wcwidth(line.join(' ')) + wcwidth(word) < max) {
        lines[lines.length - 1].push(word);
      } else
        lines.push([word]);
      return lines;
    }, []).map(function(l) {
      return l.join(' ');
    });
  }
  return str.split('\n').map(function(str) {
    return _splitIntoLines(str, max);
  }).reduce(function(lines, line) {
    return lines.concat(line);
  }, []);
}
function splitLongWords(str, max, truncationChar, result) {
  str = str.trim();
  result = result || [];
  if (!str)
    return result.join(' ') || '';
  var words = str.split(' ');
  var word = words.shift() || str;
  if (wcwidth(word) > max) {
    var i = 0;
    var wwidth = 0;
    var limit = max - wcwidth(truncationChar);
    while (i < word.length) {
      var w = wcwidth(word.charAt(i));
      if (w + wwidth > limit)
        break;
      wwidth += w;
      ++i;
    }
    var remainder = word.slice(i);
    words.unshift(remainder);
    word = word.slice(0, i);
    word += truncationChar;
  }
  result.push(word);
  return splitLongWords(words.join(' '), max, truncationChar, result);
}
function truncateString(str, max) {
  str = str != null ? str : '';
  str = String(str);
  if (max == Infinity)
    return str;
  var i = 0;
  var wwidth = 0;
  while (i < str.length) {
    var w = wcwidth(str.charAt(i));
    if (w + wwidth > max)
      break;
    wwidth += w;
    ++i;
  }
  return str.slice(0, i);
}
module.exports.padRight = padRight;
module.exports.padCenter = padCenter;
module.exports.padLeft = padLeft;
module.exports.splitIntoLines = splitIntoLines;
module.exports.splitLongWords = splitLongWords;
module.exports.truncateString = truncateString;
