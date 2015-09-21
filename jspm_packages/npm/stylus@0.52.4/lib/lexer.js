/* */ 
var Token = require("./token"),
    nodes = require("./nodes/index"),
    errors = require("./errors"),
    units = require("./units");
exports = module.exports = Lexer;
var alias = {
  'and': '&&',
  'or': '||',
  'is': '==',
  'isnt': '!=',
  'is not': '!=',
  ':=': '?='
};
units = units.join('|');
var unit = new RegExp('^(-)?(\\d+\\.\\d+|\\d+|\\.\\d+)(' + units + ')?[ \\t]*');
function Lexer(str, options) {
  options = options || {};
  this.stash = [];
  this.indentStack = [];
  this.indentRe = null;
  this.lineno = 1;
  this.column = 1;
  function comment(str, val, offset, s) {
    var inComment = s.lastIndexOf('/*', offset) > s.lastIndexOf('*/', offset),
        commentIdx = s.lastIndexOf('//', offset),
        i = s.lastIndexOf('\n', offset),
        double = 0,
        single = 0;
    if (~commentIdx && commentIdx > i) {
      while (i != offset) {
        if ("'" == s[i])
          single ? single-- : single++;
        if ('"' == s[i])
          double ? double-- : double++;
        if ('/' == s[i] && '/' == s[i + 1]) {
          inComment = !single && !double;
          break;
        }
        ++i;
      }
    }
    return inComment ? str : val + '\r';
  }
  ;
  if ('\uFEFF' == str.charAt(0))
    str = str.slice(1);
  this.str = str.replace(/\s+$/, '\n').replace(/\r\n?/g, '\n').replace(/\\ *\n/g, '\r').replace(/([,(:](?!\/\/[^ ])) *(?:\/\/[^\n]*)?\n\s*/g, comment).replace(/\s*\n[ \t]*([,)])/g, comment);
}
;
Lexer.prototype = {
  inspect: function() {
    var tok,
        tmp = this.str,
        buf = [];
    while ('eos' != (tok = this.next()).type) {
      buf.push(tok.inspect());
    }
    this.str = tmp;
    return buf.concat(tok.inspect()).join('\n');
  },
  lookahead: function(n) {
    var fetch = n - this.stash.length;
    while (fetch-- > 0)
      this.stash.push(this.advance());
    return this.stash[--n];
  },
  skip: function(len) {
    var chunk = len[0];
    len = chunk ? chunk.length : len;
    this.str = this.str.substr(len);
    if (chunk) {
      this.move(chunk);
    } else {
      this.column += len;
    }
  },
  move: function(str) {
    var lines = str.match(/\n/g),
        idx = str.lastIndexOf('\n');
    if (lines)
      this.lineno += lines.length;
    this.column = ~idx ? str.length - idx : this.column + str.length;
  },
  next: function() {
    var tok = this.stashed() || this.advance();
    this.prev = tok;
    return tok;
  },
  isPartOfSelector: function() {
    var tok = this.stash[this.stash.length - 1] || this.prev;
    switch (tok && tok.type) {
      case 'color':
        return 2 == tok.val.raw.length;
      case '.':
      case '[':
        return true;
    }
    return false;
  },
  advance: function() {
    var column = this.column,
        line = this.lineno,
        tok = this.eos() || this.null() || this.sep() || this.keyword() || this.urlchars() || this.comment() || this.newline() || this.escaped() || this.important() || this.literal() || this.anonFunc() || this.atrule() || this.function() || this.brace() || this.paren() || this.color() || this.string() || this.unit() || this.namedop() || this.boolean() || this.unicode() || this.ident() || this.op() || this.eol() || this.space() || this.selector();
    tok.lineno = line;
    tok.column = column;
    return tok;
  },
  peek: function() {
    return this.lookahead(1);
  },
  stashed: function() {
    return this.stash.shift();
  },
  eos: function() {
    if (this.str.length)
      return;
    if (this.indentStack.length) {
      this.indentStack.shift();
      return new Token('outdent');
    } else {
      return new Token('eos');
    }
  },
  urlchars: function() {
    var captures;
    if (!this.isURL)
      return;
    if (captures = /^[\/:@.;?&=*!,<>#%0-9]+/.exec(this.str)) {
      this.skip(captures);
      return new Token('literal', new nodes.Literal(captures[0]));
    }
  },
  sep: function() {
    var captures;
    if (captures = /^;[ \t]*/.exec(this.str)) {
      this.skip(captures);
      return new Token(';');
    }
  },
  eol: function() {
    if ('\r' == this.str[0]) {
      ++this.lineno;
      this.skip(1);
      return this.advance();
    }
  },
  space: function() {
    var captures;
    if (captures = /^([ \t]+)/.exec(this.str)) {
      this.skip(captures);
      return new Token('space');
    }
  },
  escaped: function() {
    var captures;
    if (captures = /^\\(.)[ \t]*/.exec(this.str)) {
      var c = captures[1];
      this.skip(captures);
      return new Token('ident', new nodes.Literal(c));
    }
  },
  literal: function() {
    var captures;
    if (captures = /^@css[ \t]*\{/.exec(this.str)) {
      this.skip(captures);
      var c,
          braces = 1,
          css = '',
          node;
      while (c = this.str[0]) {
        this.str = this.str.substr(1);
        switch (c) {
          case '{':
            ++braces;
            break;
          case '}':
            --braces;
            break;
          case '\n':
          case '\r':
            ++this.lineno;
            break;
        }
        css += c;
        if (!braces)
          break;
      }
      css = css.replace(/\s*}$/, '');
      node = new nodes.Literal(css);
      node.css = true;
      return new Token('literal', node);
    }
  },
  important: function() {
    var captures;
    if (captures = /^!important[ \t]*/.exec(this.str)) {
      this.skip(captures);
      return new Token('ident', new nodes.Literal('!important'));
    }
  },
  brace: function() {
    var captures;
    if (captures = /^([{}])/.exec(this.str)) {
      this.skip(1);
      var brace = captures[1];
      return new Token(brace, brace);
    }
  },
  paren: function() {
    var captures;
    if (captures = /^([()])([ \t]*)/.exec(this.str)) {
      var paren = captures[1];
      this.skip(captures);
      if (')' == paren)
        this.isURL = false;
      var tok = new Token(paren, paren);
      tok.space = captures[2];
      return tok;
    }
  },
  null: function() {
    var captures,
        tok;
    if (captures = /^(null)\b[ \t]*/.exec(this.str)) {
      this.skip(captures);
      if (this.isPartOfSelector()) {
        tok = new Token('ident', new nodes.Ident(captures[0]));
      } else {
        tok = new Token('null', nodes.null);
      }
      return tok;
    }
  },
  keyword: function() {
    var captures,
        tok;
    if (captures = /^(return|if|else|unless|for|in)\b[ \t]*/.exec(this.str)) {
      var keyword = captures[1];
      this.skip(captures);
      if (this.isPartOfSelector()) {
        tok = new Token('ident', new nodes.Ident(captures[0]));
      } else {
        tok = new Token(keyword, keyword);
      }
      return tok;
    }
  },
  namedop: function() {
    var captures,
        tok;
    if (captures = /^(not|and|or|is a|is defined|isnt|is not|is)(?!-)\b([ \t]*)/.exec(this.str)) {
      var op = captures[1];
      this.skip(captures);
      if (this.isPartOfSelector()) {
        tok = new Token('ident', new nodes.Ident(captures[0]));
      } else {
        op = alias[op] || op;
        tok = new Token(op, op);
      }
      tok.space = captures[2];
      return tok;
    }
  },
  op: function() {
    var captures;
    if (captures = /^([.]{1,3}|&&|\|\||[!<>=?:]=|\*\*|[-+*\/%]=?|[,=?:!~<>&\[\]])([ \t]*)/.exec(this.str)) {
      var op = captures[1];
      this.skip(captures);
      op = alias[op] || op;
      var tok = new Token(op, op);
      tok.space = captures[2];
      this.isURL = false;
      return tok;
    }
  },
  anonFunc: function() {
    var tok;
    if ('@' == this.str[0] && '(' == this.str[1]) {
      this.skip(2);
      tok = new Token('function', new nodes.Ident('anonymous'));
      tok.anonymous = true;
      return tok;
    }
  },
  atrule: function() {
    var captures;
    if (captures = /^@(?:-(\w+)-)?([a-zA-Z0-9-_]+)[ \t]*/.exec(this.str)) {
      this.skip(captures);
      var vendor = captures[1],
          type = captures[2],
          tok;
      switch (type) {
        case 'require':
        case 'import':
        case 'charset':
        case 'namespace':
        case 'media':
        case 'scope':
        case 'supports':
          return new Token(type);
        case 'document':
          return new Token('-moz-document');
        case 'block':
          return new Token('atblock');
        case 'extend':
        case 'extends':
          return new Token('extend');
        case 'keyframes':
          return new Token(type, vendor);
        default:
          return new Token('atrule', (vendor ? '-' + vendor + '-' + type : type));
      }
    }
  },
  comment: function() {
    if ('/' == this.str[0] && '/' == this.str[1]) {
      var end = this.str.indexOf('\n');
      if (-1 == end)
        end = this.str.length;
      this.skip(end);
      return this.advance();
    }
    if ('/' == this.str[0] && '*' == this.str[1]) {
      var end = this.str.indexOf('*/');
      if (-1 == end)
        end = this.str.length;
      var str = this.str.substr(0, end + 2),
          lines = str.split(/\n|\r/).length - 1,
          suppress = true,
          inline = false;
      this.lineno += lines;
      this.skip(end + 2);
      if ('!' == str[2]) {
        str = str.replace('*!', '*');
        suppress = false;
      }
      if (this.prev && ';' == this.prev.type)
        inline = true;
      return new Token('comment', new nodes.Comment(str, suppress, inline));
    }
  },
  boolean: function() {
    var captures;
    if (captures = /^(true|false)\b([ \t]*)/.exec(this.str)) {
      var val = nodes.Boolean('true' == captures[1]);
      this.skip(captures);
      var tok = new Token('boolean', val);
      tok.space = captures[2];
      return tok;
    }
  },
  unicode: function() {
    var captures;
    if (captures = /^u\+[0-9a-f?]{1,6}(?:-[0-9a-f]{1,6})?/i.exec(this.str)) {
      this.skip(captures);
      return new Token('literal', new nodes.Literal(captures[0]));
    }
  },
  function: function() {
    var captures;
    if (captures = /^(-*[_a-zA-Z$][-\w\d$]*)\(([ \t]*)/.exec(this.str)) {
      var name = captures[1];
      this.skip(captures);
      this.isURL = 'url' == name;
      var tok = new Token('function', new nodes.Ident(name));
      tok.space = captures[2];
      return tok;
    }
  },
  ident: function() {
    var captures;
    if (captures = /^-*[_a-zA-Z$][-\w\d$]*/.exec(this.str)) {
      this.skip(captures);
      return new Token('ident', new nodes.Ident(captures[0]));
    }
  },
  newline: function() {
    var captures,
        re;
    if (this.indentRe) {
      captures = this.indentRe.exec(this.str);
    } else {
      re = /^\n([\t]*)[ \t]*/;
      captures = re.exec(this.str);
      if (captures && !captures[1].length) {
        re = /^\n([ \t]*)/;
        captures = re.exec(this.str);
      }
      if (captures && captures[1].length)
        this.indentRe = re;
    }
    if (captures) {
      var tok,
          indents = captures[1].length;
      this.skip(captures);
      if (this.str[0] === ' ' || this.str[0] === '\t') {
        throw new errors.SyntaxError('Invalid indentation. You can use tabs or spaces to indent, but not both.');
      }
      if ('\n' == this.str[0])
        return this.advance();
      if (this.indentStack.length && indents < this.indentStack[0]) {
        while (this.indentStack.length && this.indentStack[0] > indents) {
          this.stash.push(new Token('outdent'));
          this.indentStack.shift();
        }
        tok = this.stash.pop();
      } else if (indents && indents != this.indentStack[0]) {
        this.indentStack.unshift(indents);
        tok = new Token('indent');
      } else {
        tok = new Token('newline');
      }
      return tok;
    }
  },
  unit: function() {
    var captures;
    if (captures = unit.exec(this.str)) {
      this.skip(captures);
      var n = parseFloat(captures[2]);
      if ('-' == captures[1])
        n = -n;
      var node = new nodes.Unit(n, captures[3]);
      node.raw = captures[0];
      return new Token('unit', node);
    }
  },
  string: function() {
    var captures;
    if (captures = /^("[^"]*"|'[^']*')[ \t]*/.exec(this.str)) {
      var str = captures[1],
          quote = captures[0][0];
      this.skip(captures);
      str = str.slice(1, -1).replace(/\\n/g, '\n');
      return new Token('string', new nodes.String(str, quote));
    }
  },
  color: function() {
    return this.rrggbbaa() || this.rrggbb() || this.rgba() || this.rgb() || this.nn() || this.n();
  },
  n: function() {
    var captures;
    if (captures = /^#([a-fA-F0-9]{1})[ \t]*/.exec(this.str)) {
      this.skip(captures);
      var n = parseInt(captures[1] + captures[1], 16),
          color = new nodes.RGBA(n, n, n, 1);
      color.raw = captures[0];
      return new Token('color', color);
    }
  },
  nn: function() {
    var captures;
    if (captures = /^#([a-fA-F0-9]{2})[ \t]*/.exec(this.str)) {
      this.skip(captures);
      var n = parseInt(captures[1], 16),
          color = new nodes.RGBA(n, n, n, 1);
      color.raw = captures[0];
      return new Token('color', color);
    }
  },
  rgb: function() {
    var captures;
    if (captures = /^#([a-fA-F0-9]{3})[ \t]*/.exec(this.str)) {
      this.skip(captures);
      var rgb = captures[1],
          r = parseInt(rgb[0] + rgb[0], 16),
          g = parseInt(rgb[1] + rgb[1], 16),
          b = parseInt(rgb[2] + rgb[2], 16),
          color = new nodes.RGBA(r, g, b, 1);
      color.raw = captures[0];
      return new Token('color', color);
    }
  },
  rgba: function() {
    var captures;
    if (captures = /^#([a-fA-F0-9]{4})[ \t]*/.exec(this.str)) {
      this.skip(captures);
      var rgb = captures[1],
          r = parseInt(rgb[0] + rgb[0], 16),
          g = parseInt(rgb[1] + rgb[1], 16),
          b = parseInt(rgb[2] + rgb[2], 16),
          a = parseInt(rgb[3] + rgb[3], 16),
          color = new nodes.RGBA(r, g, b, a / 255);
      color.raw = captures[0];
      return new Token('color', color);
    }
  },
  rrggbb: function() {
    var captures;
    if (captures = /^#([a-fA-F0-9]{6})[ \t]*/.exec(this.str)) {
      this.skip(captures);
      var rgb = captures[1],
          r = parseInt(rgb.substr(0, 2), 16),
          g = parseInt(rgb.substr(2, 2), 16),
          b = parseInt(rgb.substr(4, 2), 16),
          color = new nodes.RGBA(r, g, b, 1);
      color.raw = captures[0];
      return new Token('color', color);
    }
  },
  rrggbbaa: function() {
    var captures;
    if (captures = /^#([a-fA-F0-9]{8})[ \t]*/.exec(this.str)) {
      this.skip(captures);
      var rgb = captures[1],
          r = parseInt(rgb.substr(0, 2), 16),
          g = parseInt(rgb.substr(2, 2), 16),
          b = parseInt(rgb.substr(4, 2), 16),
          a = parseInt(rgb.substr(6, 2), 16),
          color = new nodes.RGBA(r, g, b, a / 255);
      color.raw = captures[0];
      return new Token('color', color);
    }
  },
  selector: function() {
    var captures;
    if (captures = /^.*?(?=\/\/(?![^\[]*\])|[,\n{])/.exec(this.str)) {
      var selector = captures[0];
      this.skip(captures);
      return new Token('selector', selector);
    }
  }
};
