/* */ 
var Lexer = require("./lexer"),
    nodes = require("./nodes/index"),
    Token = require("./token"),
    units = require("./units"),
    errors = require("./errors"),
    cache = require("./cache/index");
var debug = {
  lexer: require("debug")('stylus:lexer'),
  selector: require("debug")('stylus:parser:selector')
};
var selectorTokens = ['ident', 'string', 'selector', 'function', 'comment', 'boolean', 'space', 'color', 'unit', 'for', 'in', '[', ']', '(', ')', '+', '-', '*', '*=', '<', '>', '=', ':', '&', '~', '{', '}', '.', '/'];
var pseudoSelectors = ['matches', 'not', 'dir', 'lang', 'any-link', 'link', 'visited', 'local-link', 'target', 'scope', 'hover', 'active', 'focus', 'drop', 'current', 'past', 'future', 'enabled', 'disabled', 'read-only', 'read-write', 'placeholder-shown', 'checked', 'indeterminate', 'valid', 'invalid', 'in-range', 'out-of-range', 'required', 'optional', 'user-error', 'root', 'empty', 'blank', 'nth-child', 'nth-last-child', 'first-child', 'last-child', 'only-child', 'nth-of-type', 'nth-last-of-type', 'first-of-type', 'last-of-type', 'only-of-type', 'nth-match', 'nth-last-match', 'nth-column', 'nth-last-column', 'first-line', 'first-letter', 'before', 'after', 'selection'];
var Parser = module.exports = function Parser(str, options) {
  var self = this;
  options = options || {};
  Parser.cache = Parser.cache || Parser.getCache(options);
  this.hash = Parser.cache.key(str, options);
  this.lexer = {};
  if (!Parser.cache.has(this.hash)) {
    this.lexer = new Lexer(str, options);
  }
  this.prefix = options.prefix || '';
  this.root = options.root || new nodes.Root;
  this.state = ['root'];
  this.stash = [];
  this.parens = 0;
  this.css = 0;
  this.state.pop = function() {
    self.prevState = [].pop.call(this);
  };
};
Parser.getCache = function(options) {
  return false === options.cache ? cache(false) : cache(options.cache || 'memory', options);
};
Parser.prototype = {
  constructor: Parser,
  currentState: function() {
    return this.state[this.state.length - 1];
  },
  previousState: function() {
    return this.state[this.state.length - 2];
  },
  parse: function() {
    var block = this.parent = this.root;
    if (Parser.cache.has(this.hash)) {
      block = Parser.cache.get(this.hash);
      if ('block' == block.nodeName)
        block.constructor = nodes.Root;
    } else {
      while ('eos' != this.peek().type) {
        this.skipWhitespace();
        if ('eos' == this.peek().type)
          break;
        var stmt = this.statement();
        this.accept(';');
        if (!stmt)
          this.error('unexpected token {peek}, not allowed at the root level');
        block.push(stmt);
      }
      Parser.cache.set(this.hash, block);
    }
    return block;
  },
  error: function(msg) {
    var type = this.peek().type,
        val = undefined == this.peek().val ? '' : ' ' + this.peek().toString();
    if (val.trim() == type.trim())
      val = '';
    throw new errors.ParseError(msg.replace('{peek}', '"' + type + val + '"'));
  },
  accept: function(type) {
    if (type == this.peek().type) {
      return this.next();
    }
  },
  expect: function(type) {
    if (type != this.peek().type) {
      this.error('expected "' + type + '", got {peek}');
    }
    return this.next();
  },
  next: function() {
    var tok = this.stash.length ? this.stash.pop() : this.lexer.next(),
        line = tok.lineno,
        column = tok.column || 1;
    if (tok.val && tok.val.nodeName) {
      tok.val.lineno = line;
      tok.val.column = column;
    }
    nodes.lineno = line;
    nodes.column = column;
    debug.lexer('%s %s', tok.type, tok.val || '');
    return tok;
  },
  peek: function() {
    return this.lexer.peek();
  },
  lookahead: function(n) {
    return this.lexer.lookahead(n);
  },
  isSelectorToken: function(n) {
    var la = this.lookahead(n).type;
    switch (la) {
      case 'for':
        return this.bracketed;
      case '[':
        this.bracketed = true;
        return true;
      case ']':
        this.bracketed = false;
        return true;
      default:
        return ~selectorTokens.indexOf(la);
    }
  },
  isPseudoSelector: function(n) {
    var val = this.lookahead(n).val;
    return val && ~pseudoSelectors.indexOf(val.name);
  },
  lineContains: function(type) {
    var i = 1,
        la;
    while (la = this.lookahead(i++)) {
      if (~['indent', 'outdent', 'newline', 'eos'].indexOf(la.type))
        return;
      if (type == la.type)
        return true;
    }
  },
  selectorToken: function() {
    if (this.isSelectorToken(1)) {
      if ('{' == this.peek().type) {
        if (!this.lineContains('}'))
          return;
        var i = 0,
            la;
        while (la = this.lookahead(++i)) {
          if ('}' == la.type) {
            if (i == 2 || (i == 3 && this.lookahead(i - 1).type == 'space'))
              return;
            break;
          }
          if (':' == la.type)
            return;
        }
      }
      return this.next();
    }
  },
  skip: function(tokens) {
    while (~tokens.indexOf(this.peek().type))
      this.next();
  },
  skipWhitespace: function() {
    this.skip(['space', 'indent', 'outdent', 'newline']);
  },
  skipNewlines: function() {
    while ('newline' == this.peek().type)
      this.next();
  },
  skipSpaces: function() {
    while ('space' == this.peek().type)
      this.next();
  },
  skipSpacesAndComments: function() {
    while ('space' == this.peek().type || 'comment' == this.peek().type)
      this.next();
  },
  looksLikeFunctionDefinition: function(i) {
    return 'indent' == this.lookahead(i).type || '{' == this.lookahead(i).type;
  },
  looksLikeSelector: function(fromProperty) {
    var i = 1,
        brace;
    if (fromProperty && ':' == this.lookahead(i + 1).type && (this.lookahead(i + 1).space || 'indent' == this.lookahead(i + 2).type))
      return false;
    while ('ident' == this.lookahead(i).type && ('newline' == this.lookahead(i + 1).type || ',' == this.lookahead(i + 1).type))
      i += 2;
    while (this.isSelectorToken(i) || ',' == this.lookahead(i).type) {
      if ('selector' == this.lookahead(i).type)
        return true;
      if ('&' == this.lookahead(i + 1).type)
        return true;
      if ('.' == this.lookahead(i).type && 'ident' == this.lookahead(i + 1).type)
        return true;
      if ('*' == this.lookahead(i).type && 'newline' == this.lookahead(i + 1).type)
        return true;
      if (':' == this.lookahead(i).type && ':' == this.lookahead(i + 1).type)
        return true;
      if ('color' == this.lookahead(i).type && 'newline' == this.lookahead(i - 1).type)
        return true;
      if (this.looksLikeAttributeSelector(i))
        return true;
      if (('=' == this.lookahead(i).type || 'function' == this.lookahead(i).type) && '{' == this.lookahead(i + 1).type)
        return false;
      if (':' == this.lookahead(i).type && !this.isPseudoSelector(i + 1) && this.lineContains('.'))
        return false;
      if ('{' == this.lookahead(i).type)
        brace = true;
      else if ('}' == this.lookahead(i).type)
        brace = false;
      if (brace && ':' == this.lookahead(i).type)
        return true;
      if ('space' == this.lookahead(i).type && '{' == this.lookahead(i + 1).type)
        return true;
      if (':' == this.lookahead(i++).type && !this.lookahead(i - 1).space && this.isPseudoSelector(i))
        return true;
      if ('space' == this.lookahead(i).type && 'newline' == this.lookahead(i + 1).type && '{' == this.lookahead(i + 2).type)
        return true;
      if (',' == this.lookahead(i).type && 'newline' == this.lookahead(i + 1).type)
        return true;
    }
    if (',' == this.lookahead(i).type && 'newline' == this.lookahead(i + 1).type)
      return true;
    if ('{' == this.lookahead(i).type && 'newline' == this.lookahead(i + 1).type)
      return true;
    if (this.css) {
      if (';' == this.lookahead(i).type || '}' == this.lookahead(i - 1).type)
        return false;
    }
    while (!~['indent', 'outdent', 'newline', 'for', 'if', ';', '}', 'eos'].indexOf(this.lookahead(i).type))
      ++i;
    if ('indent' == this.lookahead(i).type)
      return true;
  },
  looksLikeAttributeSelector: function(n) {
    var type = this.lookahead(n).type;
    if ('=' == type && this.bracketed)
      return true;
    return ('ident' == type || 'string' == type) && ']' == this.lookahead(n + 1).type && ('newline' == this.lookahead(n + 2).type || this.isSelectorToken(n + 2)) && !this.lineContains(':') && !this.lineContains('=');
  },
  looksLikeKeyframe: function() {
    var i = 2,
        type;
    switch (this.lookahead(i).type) {
      case '{':
      case 'indent':
      case ',':
        return true;
      case 'newline':
        while ('unit' == this.lookahead(++i).type || 'newline' == this.lookahead(i).type)
          ;
        type = this.lookahead(i).type;
        return 'indent' == type || '{' == type;
    }
  },
  stateAllowsSelector: function() {
    switch (this.currentState()) {
      case 'root':
      case 'atblock':
      case 'selector':
      case 'conditional':
      case 'function':
      case 'atrule':
      case 'for':
        return true;
    }
  },
  assignAtblock: function(expr) {
    try {
      expr.push(this.atblock(expr));
    } catch (err) {
      this.error('invalid right-hand side operand in assignment, got {peek}');
    }
  },
  statement: function() {
    var stmt = this.stmt(),
        state = this.prevState,
        block,
        op;
    if (this.allowPostfix) {
      this.allowPostfix = false;
      state = 'expression';
    }
    switch (state) {
      case 'assignment':
      case 'expression':
      case 'function arguments':
        while (op = this.accept('if') || this.accept('unless') || this.accept('for')) {
          switch (op.type) {
            case 'if':
            case 'unless':
              stmt = new nodes.If(this.expression(), stmt);
              stmt.postfix = true;
              stmt.negate = 'unless' == op.type;
              this.accept(';');
              break;
            case 'for':
              var key,
                  val = this.id().name;
              if (this.accept(','))
                key = this.id().name;
              this.expect('in');
              var each = new nodes.Each(val, key, this.expression());
              block = new nodes.Block(this.parent, each);
              block.push(stmt);
              each.block = block;
              stmt = each;
          }
        }
    }
    return stmt;
  },
  stmt: function() {
    var type = this.peek().type;
    switch (type) {
      case 'keyframes':
        return this.keyframes();
      case '-moz-document':
        return this.mozdocument();
      case 'comment':
      case 'selector':
      case 'literal':
      case 'charset':
      case 'namespace':
      case 'import':
      case 'require':
      case 'extend':
      case 'media':
      case 'atrule':
      case 'ident':
      case 'scope':
      case 'supports':
      case 'unless':
      case 'function':
      case 'for':
      case 'if':
        return this[type]();
      case 'return':
        return this.return();
      case '{':
        return this.property();
      default:
        if (this.stateAllowsSelector()) {
          switch (type) {
            case 'color':
            case '~':
            case '>':
            case '<':
            case ':':
            case '&':
            case '[':
            case '.':
            case '/':
              return this.selector();
            case '+':
              return 'function' == this.lookahead(2).type ? this.functionCall() : this.selector();
            case '*':
              return this.property();
            case 'unit':
              if (this.looksLikeKeyframe())
                return this.selector();
            case '-':
              if ('{' == this.lookahead(2).type)
                return this.property();
          }
        }
        var expr = this.expression();
        if (expr.isEmpty)
          this.error('unexpected {peek}');
        return expr;
    }
  },
  block: function(node, scope) {
    var delim,
        stmt,
        next,
        block = this.parent = new nodes.Block(this.parent, node);
    if (false === scope)
      block.scope = false;
    this.accept('newline');
    if (this.accept('{')) {
      this.css++;
      delim = '}';
      this.skipWhitespace();
    } else {
      delim = 'outdent';
      this.expect('indent');
    }
    while (delim != this.peek().type) {
      if (this.css) {
        if (this.accept('newline') || this.accept('indent'))
          continue;
        stmt = this.statement();
        this.accept(';');
        this.skipWhitespace();
      } else {
        if (this.accept('newline'))
          continue;
        next = this.lookahead(2).type;
        if ('indent' == this.peek().type && ~['outdent', 'newline', 'comment'].indexOf(next)) {
          this.skip(['indent', 'outdent']);
          continue;
        }
        if ('eos' == this.peek().type)
          return block;
        stmt = this.statement();
        this.accept(';');
      }
      if (!stmt)
        this.error('unexpected token {peek} in block');
      block.push(stmt);
    }
    if (this.css) {
      this.skipWhitespace();
      this.expect('}');
      this.skipSpaces();
      this.css--;
    } else {
      this.expect('outdent');
    }
    this.parent = block.parent;
    return block;
  },
  comment: function() {
    var node = this.next().val;
    this.skipSpaces();
    return node;
  },
  for: function() {
    this.expect('for');
    var key,
        val = this.id().name;
    if (this.accept(','))
      key = this.id().name;
    this.expect('in');
    this.state.push('for');
    this.cond = true;
    var each = new nodes.Each(val, key, this.expression());
    this.cond = false;
    each.block = this.block(each, false);
    this.state.pop();
    return each;
  },
  return: function() {
    this.expect('return');
    var expr = this.expression();
    return expr.isEmpty ? new nodes.Return : new nodes.Return(expr);
  },
  unless: function() {
    this.expect('unless');
    this.state.push('conditional');
    this.cond = true;
    var node = new nodes.If(this.expression(), true);
    this.cond = false;
    node.block = this.block(node, false);
    this.state.pop();
    return node;
  },
  if: function() {
    this.expect('if');
    this.state.push('conditional');
    this.cond = true;
    var node = new nodes.If(this.expression()),
        cond,
        block;
    this.cond = false;
    node.block = this.block(node, false);
    this.skip(['newline', 'comment']);
    while (this.accept('else')) {
      if (this.accept('if')) {
        this.cond = true;
        cond = this.expression();
        this.cond = false;
        block = this.block(node, false);
        node.elses.push(new nodes.If(cond, block));
      } else {
        node.elses.push(this.block(node, false));
        break;
      }
      this.skip(['newline', 'comment']);
    }
    this.state.pop();
    return node;
  },
  atblock: function(node) {
    if (!node)
      this.expect('atblock');
    node = new nodes.Atblock;
    this.state.push('atblock');
    node.block = this.block(node, false);
    this.state.pop();
    return node;
  },
  atrule: function() {
    var type = this.expect('atrule').val,
        node = new nodes.Atrule(type),
        tok;
    this.skipSpacesAndComments();
    node.segments = this.selectorParts();
    this.skipSpacesAndComments();
    tok = this.peek().type;
    if ('indent' == tok || '{' == tok || ('newline' == tok && '{' == this.lookahead(2).type)) {
      this.state.push('atrule');
      node.block = this.block(node);
      this.state.pop();
    }
    return node;
  },
  scope: function() {
    this.expect('scope');
    var selector = this.selectorParts().map(function(selector) {
      return selector.val;
    }).join('');
    this.selectorScope = selector.trim();
    return nodes.null;
  },
  supports: function() {
    this.expect('supports');
    var node = new nodes.Supports(this.supportsCondition());
    this.state.push('atrule');
    node.block = this.block(node);
    this.state.pop();
    return node;
  },
  supportsCondition: function() {
    var node = this.supportsNegation() || this.supportsOp();
    if (!node) {
      this.cond = true;
      node = this.expression();
      this.cond = false;
    }
    return node;
  },
  supportsNegation: function() {
    if (this.accept('not')) {
      var node = new nodes.Expression;
      node.push(new nodes.Literal('not'));
      node.push(this.supportsFeature());
      return node;
    }
  },
  supportsOp: function() {
    var feature = this.supportsFeature(),
        op,
        expr;
    if (feature) {
      expr = new nodes.Expression;
      expr.push(feature);
      while (op = this.accept('&&') || this.accept('||')) {
        expr.push(new nodes.Literal('&&' == op.val ? 'and' : 'or'));
        expr.push(this.supportsFeature());
      }
      return expr;
    }
  },
  supportsFeature: function() {
    this.skipSpacesAndComments();
    if ('(' == this.peek().type) {
      var la = this.lookahead(2).type;
      if ('ident' == la || '{' == la) {
        return this.feature();
      } else {
        this.expect('(');
        var node = new nodes.Expression;
        node.push(new nodes.Literal('('));
        node.push(this.supportsCondition());
        this.expect(')');
        node.push(new nodes.Literal(')'));
        this.skipSpacesAndComments();
        return node;
      }
    }
  },
  extend: function() {
    var tok = this.expect('extend'),
        selectors = [],
        sel,
        node,
        arr;
    do {
      arr = this.selectorParts();
      if (!arr.length)
        continue;
      sel = new nodes.Selector(arr);
      selectors.push(sel);
      if ('!' !== this.peek().type)
        continue;
      tok = this.lookahead(2);
      if ('ident' !== tok.type || 'optional' !== tok.val.name)
        continue;
      this.skip(['!', 'ident']);
      sel.optional = true;
    } while (this.accept(','));
    node = new nodes.Extend(selectors);
    node.lineno = tok.lineno;
    node.column = tok.column;
    return node;
  },
  media: function() {
    this.expect('media');
    this.state.push('atrule');
    var media = new nodes.Media(this.queries());
    media.block = this.block(media);
    this.state.pop();
    return media;
  },
  queries: function() {
    var queries = new nodes.QueryList,
        skip = ['comment', 'newline', 'space'];
    do {
      this.skip(skip);
      queries.push(this.query());
      this.skip(skip);
    } while (this.accept(','));
    return queries;
  },
  query: function() {
    var query = new nodes.Query,
        expr,
        pred,
        id;
    if ('ident' == this.peek().type && ('.' == this.lookahead(2).type || '[' == this.lookahead(2).type)) {
      this.cond = true;
      expr = this.expression();
      this.cond = false;
      query.push(new nodes.Feature(expr.nodes));
      return query;
    }
    if (pred = this.accept('ident') || this.accept('not')) {
      pred = new nodes.Literal(pred.val.string || pred.val);
      this.skipSpacesAndComments();
      if (id = this.accept('ident')) {
        query.type = id.val;
        query.predicate = pred;
      } else {
        query.type = pred;
      }
      this.skipSpacesAndComments();
      if (!this.accept('&&'))
        return query;
    }
    do {
      query.push(this.feature());
    } while (this.accept('&&'));
    return query;
  },
  feature: function() {
    this.skipSpacesAndComments();
    this.expect('(');
    this.skipSpacesAndComments();
    var node = new nodes.Feature(this.interpolate());
    this.skipSpacesAndComments();
    this.accept(':');
    this.skipSpacesAndComments();
    this.inProperty = true;
    node.expr = this.expression();
    this.inProperty = false;
    this.skipSpacesAndComments();
    this.expect(')');
    this.skipSpacesAndComments();
    return node;
  },
  mozdocument: function() {
    this.expect('-moz-document');
    var mozdocument = new nodes.Atrule('-moz-document'),
        calls = [];
    do {
      this.skipSpacesAndComments();
      calls.push(this.functionCall());
      this.skipSpacesAndComments();
    } while (this.accept(','));
    mozdocument.segments = [new nodes.Literal(calls.join(', '))];
    this.state.push('atrule');
    mozdocument.block = this.block(mozdocument, false);
    this.state.pop();
    return mozdocument;
  },
  import: function() {
    this.expect('import');
    this.allowPostfix = true;
    return new nodes.Import(this.expression(), false);
  },
  require: function() {
    this.expect('require');
    this.allowPostfix = true;
    return new nodes.Import(this.expression(), true);
  },
  charset: function() {
    this.expect('charset');
    var str = this.expect('string').val;
    this.allowPostfix = true;
    return new nodes.Charset(str);
  },
  namespace: function() {
    var str,
        prefix;
    this.expect('namespace');
    this.skipSpacesAndComments();
    if (prefix = this.accept('ident')) {
      prefix = prefix.val;
    }
    this.skipSpacesAndComments();
    str = this.accept('string') || this.url();
    this.allowPostfix = true;
    return new nodes.Namespace(str, prefix);
  },
  keyframes: function() {
    var tok = this.expect('keyframes'),
        keyframes;
    this.skipSpacesAndComments();
    keyframes = new nodes.Keyframes(this.selectorParts(), tok.val);
    this.skipSpacesAndComments();
    this.state.push('atrule');
    keyframes.block = this.block(keyframes);
    this.state.pop();
    return keyframes;
  },
  literal: function() {
    return this.expect('literal').val;
  },
  id: function() {
    var tok = this.expect('ident');
    this.accept('space');
    return tok.val;
  },
  ident: function() {
    var i = 2,
        la = this.lookahead(i).type;
    while ('space' == la)
      la = this.lookahead(++i).type;
    switch (la) {
      case '=':
      case '?=':
      case '-=':
      case '+=':
      case '*=':
      case '/=':
      case '%=':
        return this.assignment();
      case '.':
        if ('space' == this.lookahead(i - 1).type)
          return this.selector();
        if (this._ident == this.peek())
          return this.id();
        while ('=' != this.lookahead(++i).type && !~['[', ',', 'newline', 'indent', 'eos'].indexOf(this.lookahead(i).type))
          ;
        if ('=' == this.lookahead(i).type) {
          this._ident = this.peek();
          return this.expression();
        } else if (this.looksLikeSelector() && this.stateAllowsSelector()) {
          return this.selector();
        }
      case '[':
        if (this._ident == this.peek())
          return this.id();
        while (']' != this.lookahead(i++).type && 'selector' != this.lookahead(i).type && 'eos' != this.lookahead(i).type)
          ;
        if ('=' == this.lookahead(i).type) {
          this._ident = this.peek();
          return this.expression();
        } else if (this.looksLikeSelector() && this.stateAllowsSelector()) {
          return this.selector();
        }
      case '-':
      case '+':
      case '/':
      case '*':
      case '%':
      case '**':
      case '&&':
      case '||':
      case '>':
      case '<':
      case '>=':
      case '<=':
      case '!=':
      case '==':
      case '?':
      case 'in':
      case 'is a':
      case 'is defined':
        if (this._ident == this.peek()) {
          return this.id();
        } else {
          this._ident = this.peek();
          switch (this.currentState()) {
            case 'for':
            case 'selector':
              return this.property();
            case 'root':
            case 'atblock':
            case 'atrule':
              return '[' == la ? this.subscript() : this.selector();
            case 'function':
            case 'conditional':
              return this.looksLikeSelector() ? this.selector() : this.expression();
            default:
              return this.operand ? this.id() : this.expression();
          }
        }
      default:
        switch (this.currentState()) {
          case 'root':
            return this.selector();
          case 'for':
          case 'selector':
          case 'function':
          case 'conditional':
          case 'atblock':
          case 'atrule':
            return this.property();
          default:
            var id = this.id();
            if ('interpolation' == this.previousState())
              id.mixin = true;
            return id;
        }
    }
  },
  interpolate: function() {
    var node,
        segs = [],
        star;
    star = this.accept('*');
    if (star)
      segs.push(new nodes.Literal('*'));
    while (true) {
      if (this.accept('{')) {
        this.state.push('interpolation');
        segs.push(this.expression());
        this.expect('}');
        this.state.pop();
      } else if (node = this.accept('-')) {
        segs.push(new nodes.Literal('-'));
      } else if (node = this.accept('ident')) {
        segs.push(node.val);
      } else {
        break;
      }
    }
    if (!segs.length)
      this.expect('ident');
    return segs;
  },
  property: function() {
    if (this.looksLikeSelector(true))
      return this.selector();
    var ident = this.interpolate(),
        prop = new nodes.Property(ident),
        ret = prop;
    this.accept('space');
    if (this.accept(':'))
      this.accept('space');
    this.state.push('property');
    this.inProperty = true;
    prop.expr = this.list();
    if (prop.expr.isEmpty)
      ret = ident[0];
    this.inProperty = false;
    this.allowPostfix = true;
    this.state.pop();
    this.accept(';');
    return ret;
  },
  selector: function() {
    var arr,
        group = new nodes.Group,
        scope = this.selectorScope,
        isRoot = 'root' == this.currentState(),
        selector;
    do {
      this.accept('newline');
      arr = this.selectorParts();
      if (isRoot && scope)
        arr.unshift(new nodes.Literal(scope + ' '));
      if (arr.length) {
        selector = new nodes.Selector(arr);
        selector.lineno = arr[0].lineno;
        selector.column = arr[0].column;
        group.push(selector);
      }
    } while (this.accept(',') || this.accept('newline'));
    this.state.push('selector');
    group.block = this.block(group);
    this.state.pop();
    return group;
  },
  selectorParts: function() {
    var tok,
        arr = [];
    while (tok = this.selectorToken()) {
      debug.selector('%s', tok);
      switch (tok.type) {
        case '{':
          this.skipSpaces();
          var expr = this.expression();
          this.skipSpaces();
          this.expect('}');
          arr.push(expr);
          break;
        case this.prefix && '.':
          var literal = new nodes.Literal(tok.val + this.prefix);
          literal.prefixed = true;
          arr.push(literal);
          break;
        case 'comment':
          break;
        case 'color':
        case 'unit':
          arr.push(new nodes.Literal(tok.val.raw));
          break;
        case 'space':
          arr.push(new nodes.Literal(' '));
          break;
        case 'function':
          arr.push(new nodes.Literal(tok.val.name + '('));
          break;
        case 'ident':
          arr.push(new nodes.Literal(tok.val.name || tok.val.string));
          break;
        default:
          arr.push(new nodes.Literal(tok.val));
          if (tok.space)
            arr.push(new nodes.Literal(' '));
      }
    }
    return arr;
  },
  assignment: function() {
    var op,
        node,
        name = this.id().name;
    if (op = this.accept('=') || this.accept('?=') || this.accept('+=') || this.accept('-=') || this.accept('*=') || this.accept('/=') || this.accept('%=')) {
      this.state.push('assignment');
      var expr = this.list();
      if (expr.isEmpty)
        this.assignAtblock(expr);
      node = new nodes.Ident(name, expr);
      this.state.pop();
      switch (op.type) {
        case '?=':
          var defined = new nodes.BinOp('is defined', node),
              lookup = new nodes.Ident(name);
          node = new nodes.Ternary(defined, lookup, node);
          break;
        case '+=':
        case '-=':
        case '*=':
        case '/=':
        case '%=':
          node.val = new nodes.BinOp(op.type[0], new nodes.Ident(name), expr);
          break;
      }
    }
    return node;
  },
  function: function() {
    var parens = 1,
        i = 2,
        tok;
    out: while (tok = this.lookahead(i++)) {
      switch (tok.type) {
        case 'function':
        case '(':
          ++parens;
          break;
        case ')':
          if (!--parens)
            break out;
          break;
        case 'eos':
          this.error('failed to find closing paren ")"');
      }
    }
    switch (this.currentState()) {
      case 'expression':
        return this.functionCall();
      default:
        return this.looksLikeFunctionDefinition(i) ? this.functionDefinition() : this.expression();
    }
  },
  url: function() {
    this.expect('function');
    this.state.push('function arguments');
    var args = this.args();
    this.expect(')');
    this.state.pop();
    return new nodes.Call('url', args);
  },
  functionCall: function() {
    var withBlock = this.accept('+');
    if ('url' == this.peek().val.name)
      return this.url();
    var name = this.expect('function').val.name;
    this.state.push('function arguments');
    this.parens++;
    var args = this.args();
    this.expect(')');
    this.parens--;
    this.state.pop();
    var call = new nodes.Call(name, args);
    if (withBlock) {
      this.state.push('function');
      call.block = this.block(call);
      this.state.pop();
    }
    return call;
  },
  functionDefinition: function() {
    var name = this.expect('function').val.name;
    this.state.push('function params');
    this.skipWhitespace();
    var params = this.params();
    this.skipWhitespace();
    this.expect(')');
    this.state.pop();
    this.state.push('function');
    var fn = new nodes.Function(name, params);
    fn.block = this.block(fn);
    this.state.pop();
    return new nodes.Ident(name, fn);
  },
  params: function() {
    var tok,
        node,
        params = new nodes.Params;
    while (tok = this.accept('ident')) {
      this.accept('space');
      params.push(node = tok.val);
      if (this.accept('...')) {
        node.rest = true;
      } else if (this.accept('=')) {
        node.val = this.expression();
      }
      this.skipWhitespace();
      this.accept(',');
      this.skipWhitespace();
    }
    return params;
  },
  args: function() {
    var args = new nodes.Arguments,
        keyword;
    do {
      if ('ident' == this.peek().type && ':' == this.lookahead(2).type) {
        keyword = this.next().val.string;
        this.expect(':');
        args.map[keyword] = this.expression();
      } else {
        args.push(this.expression());
      }
    } while (this.accept(','));
    return args;
  },
  list: function() {
    var node = this.expression();
    while (this.accept(',')) {
      if (node.isList) {
        list.push(this.expression());
      } else {
        var list = new nodes.Expression(true);
        list.push(node);
        list.push(this.expression());
        node = list;
      }
    }
    return node;
  },
  expression: function() {
    var node,
        expr = new nodes.Expression;
    this.state.push('expression');
    while (node = this.negation()) {
      if (!node)
        this.error('unexpected token {peek} in expression');
      expr.push(node);
    }
    this.state.pop();
    if (expr.nodes.length) {
      expr.lineno = expr.nodes[0].lineno;
      expr.column = expr.nodes[0].column;
    }
    return expr;
  },
  negation: function() {
    if (this.accept('not')) {
      return new nodes.UnaryOp('!', this.negation());
    }
    return this.ternary();
  },
  ternary: function() {
    var node = this.logical();
    if (this.accept('?')) {
      var trueExpr = this.expression();
      this.expect(':');
      var falseExpr = this.expression();
      node = new nodes.Ternary(node, trueExpr, falseExpr);
    }
    return node;
  },
  logical: function() {
    var op,
        node = this.typecheck();
    while (op = this.accept('&&') || this.accept('||')) {
      node = new nodes.BinOp(op.type, node, this.typecheck());
    }
    return node;
  },
  typecheck: function() {
    var op,
        node = this.equality();
    while (op = this.accept('is a')) {
      this.operand = true;
      if (!node)
        this.error('illegal unary "' + op + '", missing left-hand operand');
      node = new nodes.BinOp(op.type, node, this.equality());
      this.operand = false;
    }
    return node;
  },
  equality: function() {
    var op,
        node = this.in();
    while (op = this.accept('==') || this.accept('!=')) {
      this.operand = true;
      if (!node)
        this.error('illegal unary "' + op + '", missing left-hand operand');
      node = new nodes.BinOp(op.type, node, this.in());
      this.operand = false;
    }
    return node;
  },
  in: function() {
    var node = this.relational();
    while (this.accept('in')) {
      this.operand = true;
      if (!node)
        this.error('illegal unary "in", missing left-hand operand');
      node = new nodes.BinOp('in', node, this.relational());
      this.operand = false;
    }
    return node;
  },
  relational: function() {
    var op,
        node = this.range();
    while (op = this.accept('>=') || this.accept('<=') || this.accept('<') || this.accept('>')) {
      this.operand = true;
      if (!node)
        this.error('illegal unary "' + op + '", missing left-hand operand');
      node = new nodes.BinOp(op.type, node, this.range());
      this.operand = false;
    }
    return node;
  },
  range: function() {
    var op,
        node = this.additive();
    if (op = this.accept('...') || this.accept('..')) {
      this.operand = true;
      if (!node)
        this.error('illegal unary "' + op + '", missing left-hand operand');
      node = new nodes.BinOp(op.val, node, this.additive());
      this.operand = false;
    }
    return node;
  },
  additive: function() {
    var op,
        node = this.multiplicative();
    while (op = this.accept('+') || this.accept('-')) {
      this.operand = true;
      node = new nodes.BinOp(op.type, node, this.multiplicative());
      this.operand = false;
    }
    return node;
  },
  multiplicative: function() {
    var op,
        node = this.defined();
    while (op = this.accept('**') || this.accept('*') || this.accept('/') || this.accept('%')) {
      this.operand = true;
      if ('/' == op && this.inProperty && !this.parens) {
        this.stash.push(new Token('literal', new nodes.Literal('/')));
        this.operand = false;
        return node;
      } else {
        if (!node)
          this.error('illegal unary "' + op + '", missing left-hand operand');
        node = new nodes.BinOp(op.type, node, this.defined());
        this.operand = false;
      }
    }
    return node;
  },
  defined: function() {
    var node = this.unary();
    if (this.accept('is defined')) {
      if (!node)
        this.error('illegal unary "is defined", missing left-hand operand');
      node = new nodes.BinOp('is defined', node);
    }
    return node;
  },
  unary: function() {
    var op,
        node;
    if (op = this.accept('!') || this.accept('~') || this.accept('+') || this.accept('-')) {
      this.operand = true;
      node = this.unary();
      if (!node)
        this.error('illegal unary "' + op + '"');
      node = new nodes.UnaryOp(op.type, node);
      this.operand = false;
      return node;
    }
    return this.subscript();
  },
  subscript: function() {
    var node = this.member(),
        id;
    while (this.accept('[')) {
      node = new nodes.BinOp('[]', node, this.expression());
      this.expect(']');
    }
    if (this.accept('=')) {
      node.op += '=';
      node.val = this.list();
      if (node.val.isEmpty)
        this.assignAtblock(node.val);
    }
    return node;
  },
  member: function() {
    var node = this.primary();
    if (node) {
      while (this.accept('.')) {
        var id = new nodes.Ident(this.expect('ident').val.string);
        node = new nodes.Member(node, id);
      }
      this.skipSpaces();
      if (this.accept('=')) {
        node.val = this.list();
        if (node.val.isEmpty)
          this.assignAtblock(node.val);
      }
    }
    return node;
  },
  object: function() {
    var obj = new nodes.Object,
        id,
        val,
        comma;
    this.expect('{');
    this.skipWhitespace();
    while (!this.accept('}')) {
      if (this.accept('comment') || this.accept('newline'))
        continue;
      if (!comma)
        this.accept(',');
      id = this.accept('ident') || this.accept('string');
      if (!id)
        this.error('expected "ident" or "string", got {peek}');
      id = id.val.hash;
      this.skipSpacesAndComments();
      this.expect(':');
      val = this.expression();
      obj.set(id, val);
      comma = this.accept(',');
      this.skipWhitespace();
    }
    return obj;
  },
  primary: function() {
    var tok;
    this.skipSpaces();
    if (this.accept('(')) {
      ++this.parens;
      var expr = this.expression(),
          paren = this.expect(')');
      --this.parens;
      if (this.accept('%'))
        expr.push(new nodes.Ident('%'));
      tok = this.peek();
      if (!paren.space && 'ident' == tok.type && ~units.indexOf(tok.val.string)) {
        expr.push(new nodes.Ident(tok.val.string));
        this.next();
      }
      return expr;
    }
    tok = this.peek();
    switch (tok.type) {
      case 'null':
      case 'unit':
      case 'color':
      case 'string':
      case 'literal':
      case 'boolean':
      case 'comment':
        return this.next().val;
      case !this.cond && '{':
        return this.object();
      case 'atblock':
        return this.atblock();
      case 'atrule':
        var id = new nodes.Ident(this.next().val);
        id.property = true;
        return id;
      case 'ident':
        return this.ident();
      case 'function':
        return tok.anonymous ? this.functionDefinition() : this.functionCall();
    }
  }
};
