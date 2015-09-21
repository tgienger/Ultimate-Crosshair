/* */ 
var Visitor = require("./index"),
    units = require("../units"),
    nodes = require("../nodes/index"),
    Stack = require("../stack/index"),
    Frame = require("../stack/frame"),
    utils = require("../utils"),
    bifs = require("../functions/index"),
    dirname = require("path").dirname,
    colors = require("../colors"),
    debug = require("debug")('stylus:evaluator'),
    fs = require("fs");
function importFile(node, file, literal) {
  var importStack = this.importStack,
      Parser = require("../parser"),
      stat;
  if (node.once) {
    if (this.requireHistory[file])
      return nodes.null;
    this.requireHistory[file] = true;
    if (literal && !this.includeCSS) {
      return node;
    }
  }
  node.path = file;
  node.dirname = dirname(file);
  stat = fs.statSync(file);
  node.mtime = stat.mtime;
  this.paths.push(node.dirname);
  if (~importStack.indexOf(file))
    throw new Error('import loop has been found');
  if (this.options._imports)
    this.options._imports.push(node.clone());
  importStack.push(file);
  nodes.filename = file;
  var str = fs.readFileSync(file, 'utf8');
  if (literal) {
    literal = new nodes.Literal(str.replace(/\r\n?/g, '\n'));
    literal.lineno = literal.column = 1;
    if (!this.resolveURL)
      return literal;
  }
  var block = new nodes.Block,
      parser = new Parser(str, utils.merge({root: block}, this.options));
  try {
    block = parser.parse();
  } catch (err) {
    var line = parser.lexer.lineno,
        column = parser.lexer.column;
    if (this.includeCSS && this.resolveURL) {
      this.warn('ParseError: ' + file + ':' + line + ':' + column + '. This file included as-is');
      return literal;
    } else {
      err.filename = file;
      err.lineno = line;
      err.column = column;
      err.input = str;
      throw err;
    }
  }
  block = block.clone(this.currentBlock);
  block.parent = this.currentBlock;
  block.scope = false;
  var ret = this.visit(block);
  importStack.pop();
  if (!this.resolveURL || this.resolveURL.nocheck)
    this.paths.pop();
  return ret;
}
var Evaluator = module.exports = function Evaluator(root, options) {
  options = options || {};
  Visitor.call(this, root);
  var functions = this.functions = options.functions || {};
  this.stack = new Stack;
  this.imports = options.imports || [];
  this.globals = options.globals || {};
  this.paths = options.paths || [];
  this.prefix = options.prefix || '';
  this.filename = options.filename;
  this.includeCSS = options['include css'];
  this.resolveURL = functions.url && 'resolver' == functions.url.name && functions.url.options;
  this.paths.push(dirname(options.filename || '.'));
  this.stack.push(this.global = new Frame(root));
  this.warnings = options.warn;
  this.options = options;
  this.calling = [];
  this.importStack = [];
  this.requireHistory = {};
  this.return = 0;
};
Evaluator.prototype.__proto__ = Visitor.prototype;
var visit = Visitor.prototype.visit;
Evaluator.prototype.visit = function(node) {
  try {
    return visit.call(this, node);
  } catch (err) {
    if (err.filename)
      throw err;
    err.lineno = node.lineno;
    err.column = node.column;
    err.filename = node.filename;
    err.stylusStack = this.stack.toString();
    try {
      err.input = fs.readFileSync(err.filename, 'utf8');
    } catch (err) {}
    throw err;
  }
};
Evaluator.prototype.setup = function() {
  var root = this.root;
  var imports = [];
  this.populateGlobalScope();
  this.imports.forEach(function(file) {
    var expr = new nodes.Expression;
    expr.push(new nodes.String(file));
    imports.push(new nodes.Import(expr));
  }, this);
  root.nodes = imports.concat(root.nodes);
};
Evaluator.prototype.populateGlobalScope = function() {
  var scope = this.global.scope;
  Object.keys(colors).forEach(function(name) {
    var color = colors[name],
        rgba = new nodes.RGBA(color[0], color[1], color[2], color[3]),
        node = new nodes.Ident(name, rgba);
    rgba.name = name;
    scope.add(node);
  });
  var globals = this.globals;
  Object.keys(globals).forEach(function(name) {
    scope.add(new nodes.Ident(name, globals[name]));
  });
};
Evaluator.prototype.evaluate = function() {
  debug('eval %s', this.filename);
  this.setup();
  return this.visit(this.root);
};
Evaluator.prototype.visitGroup = function(group) {
  group.nodes = group.nodes.map(function(selector) {
    selector.val = this.interpolate(selector);
    debug('ruleset %s', selector.val);
    return selector;
  }, this);
  group.block = this.visit(group.block);
  return group;
};
Evaluator.prototype.visitReturn = function(ret) {
  ret.expr = this.visit(ret.expr);
  throw ret;
};
Evaluator.prototype.visitMedia = function(media) {
  media.block = this.visit(media.block);
  media.val = this.visit(media.val);
  return media;
};
Evaluator.prototype.visitQueryList = function(queries) {
  var val,
      query;
  queries.nodes.forEach(this.visit, this);
  if (1 == queries.nodes.length) {
    query = queries.nodes[0];
    if (val = this.lookup(query.type)) {
      val = val.first.string;
      if (!val)
        return queries;
      var Parser = require("../parser"),
          parser = new Parser(val, this.options);
      queries = this.visit(parser.queries());
    }
  }
  return queries;
};
Evaluator.prototype.visitQuery = function(node) {
  node.predicate = this.visit(node.predicate);
  node.type = this.visit(node.type);
  node.nodes.forEach(this.visit, this);
  return node;
};
Evaluator.prototype.visitFeature = function(node) {
  node.name = this.interpolate(node);
  if (node.expr) {
    this.return++;
    node.expr = this.visit(node.expr);
    this.return--;
  }
  return node;
};
Evaluator.prototype.visitObject = function(obj) {
  for (var key in obj.vals) {
    obj.vals[key] = this.visit(obj.vals[key]);
  }
  return obj;
};
Evaluator.prototype.visitMember = function(node) {
  var left = node.left,
      right = node.right,
      obj = this.visit(left).first;
  if ('object' != obj.nodeName) {
    throw new Error(left.toString() + ' has no property .' + right);
  }
  if (node.val) {
    this.return++;
    obj.set(right.name, this.visit(node.val));
    this.return--;
  }
  return obj.get(right.name);
};
Evaluator.prototype.visitKeyframes = function(keyframes) {
  var val;
  if (keyframes.fabricated)
    return keyframes;
  keyframes.val = this.interpolate(keyframes).trim();
  if (val = this.lookup(keyframes.val)) {
    keyframes.val = val.first.string || val.first.name;
  }
  keyframes.block = this.visit(keyframes.block);
  if ('official' != keyframes.prefix)
    return keyframes;
  this.vendors.forEach(function(prefix) {
    if ('ms' == prefix)
      return;
    var node = keyframes.clone();
    node.val = keyframes.val;
    node.prefix = prefix;
    node.block = keyframes.block;
    node.fabricated = true;
    this.currentBlock.push(node);
  }, this);
  return nodes.null;
};
Evaluator.prototype.visitFunction = function(fn) {
  var local = this.stack.currentFrame.scope.lookup(fn.name);
  if (local)
    this.warn('local ' + local.nodeName + ' "' + fn.name + '" previously defined in this scope');
  var user = this.functions[fn.name];
  if (user)
    this.warn('user-defined function "' + fn.name + '" is already defined');
  var bif = bifs[fn.name];
  if (bif)
    this.warn('built-in function "' + fn.name + '" is already defined');
  return fn;
};
Evaluator.prototype.visitEach = function(each) {
  this.return++;
  var expr = utils.unwrap(this.visit(each.expr)),
      len = expr.nodes.length,
      val = new nodes.Ident(each.val),
      key = new nodes.Ident(each.key || '__index__'),
      scope = this.currentScope,
      block = this.currentBlock,
      vals = [],
      self = this,
      body,
      obj;
  this.return--;
  each.block.scope = false;
  function visitBody(key, val) {
    scope.add(val);
    scope.add(key);
    body = self.visit(each.block.clone());
    vals = vals.concat(body.nodes);
  }
  if (1 == len && 'object' == expr.nodes[0].nodeName) {
    obj = expr.nodes[0];
    for (var prop in obj.vals) {
      val.val = new nodes.String(prop);
      key.val = obj.get(prop);
      visitBody(key, val);
    }
  } else {
    for (var i = 0; i < len; ++i) {
      val.val = expr.nodes[i];
      key.val = new nodes.Unit(i);
      visitBody(key, val);
    }
  }
  this.mixin(vals, block);
  return vals[vals.length - 1] || nodes.null;
};
Evaluator.prototype.visitCall = function(call) {
  debug('call %s', call);
  var fn = this.lookup(call.name),
      literal,
      ret;
  this.ignoreColors = 'url' == call.name;
  if (fn && 'expression' == fn.nodeName) {
    fn = fn.nodes[0];
  }
  if (fn && 'function' != fn.nodeName) {
    fn = this.lookupFunction(call.name);
  }
  if (!fn || fn.nodeName != 'function') {
    debug('%s is undefined', call);
    if ('calc' == this.unvendorize(call.name)) {
      literal = call.args.nodes && call.args.nodes[0];
      if (literal)
        ret = new nodes.Literal(call.name + literal);
    } else {
      ret = this.literalCall(call);
    }
    this.ignoreColors = false;
    return ret;
  }
  this.calling.push(call.name);
  if (this.calling.length > 200) {
    throw new RangeError('Maximum stylus call stack size exceeded');
  }
  if ('expression' == fn.nodeName)
    fn = fn.first;
  this.return++;
  var args = this.visit(call.args);
  for (var key in args.map) {
    args.map[key] = this.visit(args.map[key].clone());
  }
  this.return--;
  if (fn.fn) {
    debug('%s is built-in', call);
    ret = this.invokeBuiltin(fn.fn, args);
  } else if ('function' == fn.nodeName) {
    debug('%s is user-defined', call);
    if (call.block)
      call.block = this.visit(call.block);
    ret = this.invokeFunction(fn, args, call.block);
  }
  this.calling.pop();
  this.ignoreColors = false;
  return ret;
};
Evaluator.prototype.visitIdent = function(ident) {
  var prop;
  if (ident.property) {
    if (prop = this.lookupProperty(ident.name)) {
      return this.visit(prop.expr.clone());
    }
    return nodes.null;
  } else if (ident.val.isNull) {
    var val = this.lookup(ident.name);
    if (val && ident.mixin)
      this.mixinNode(val);
    return val ? this.visit(val) : ident;
  } else {
    this.return++;
    ident.val = this.visit(ident.val);
    this.return--;
    this.currentScope.add(ident);
    return ident.val;
  }
};
Evaluator.prototype.visitBinOp = function(binop) {
  if ('is defined' == binop.op)
    return this.isDefined(binop.left);
  this.return++;
  var op = binop.op,
      left = this.visit(binop.left),
      right = ('||' == op || '&&' == op) ? binop.right : this.visit(binop.right);
  var val = binop.val ? this.visit(binop.val) : null;
  this.return--;
  try {
    return this.visit(left.operate(op, right, val));
  } catch (err) {
    if ('CoercionError' == err.name) {
      switch (op) {
        case '==':
          return nodes.false;
        case '!=':
          return nodes.true;
      }
    }
    throw err;
  }
};
Evaluator.prototype.visitUnaryOp = function(unary) {
  var op = unary.op,
      node = this.visit(unary.expr);
  if ('!' != op) {
    node = node.first.clone();
    utils.assertType(node, 'unit');
  }
  switch (op) {
    case '-':
      node.val = -node.val;
      break;
    case '+':
      node.val = +node.val;
      break;
    case '~':
      node.val = ~node.val;
      break;
    case '!':
      return node.toBoolean().negate();
  }
  return node;
};
Evaluator.prototype.visitTernary = function(ternary) {
  var ok = this.visit(ternary.cond).toBoolean();
  return ok.isTrue ? this.visit(ternary.trueExpr) : this.visit(ternary.falseExpr);
};
Evaluator.prototype.visitExpression = function(expr) {
  for (var i = 0,
      len = expr.nodes.length; i < len; ++i) {
    expr.nodes[i] = this.visit(expr.nodes[i]);
  }
  if (this.castable(expr))
    expr = this.cast(expr);
  return expr;
};
Evaluator.prototype.visitArguments = Evaluator.prototype.visitExpression;
Evaluator.prototype.visitProperty = function(prop) {
  var name = this.interpolate(prop),
      fn = this.lookup(name),
      call = fn && 'function' == fn.first.nodeName,
      literal = ~this.calling.indexOf(name),
      _prop = this.property;
  if (call && !literal && !prop.literal) {
    var args = nodes.Arguments.fromExpression(utils.unwrap(prop.expr.clone()));
    prop.name = name;
    this.property = prop;
    this.return++;
    this.property.expr = this.visit(prop.expr);
    this.return--;
    var ret = this.visit(new nodes.Call(name, args));
    this.property = _prop;
    return ret;
  } else {
    this.return++;
    prop.name = name;
    prop.literal = true;
    this.property = prop;
    prop.expr = this.visit(prop.expr);
    this.property = _prop;
    this.return--;
    return prop;
  }
};
Evaluator.prototype.visitRoot = function(block) {
  if (block != this.root) {
    block.constructor = nodes.Block;
    return this.visit(block);
  }
  for (var i = 0; i < block.nodes.length; ++i) {
    block.index = i;
    block.nodes[i] = this.visit(block.nodes[i]);
  }
  return block;
};
Evaluator.prototype.visitBlock = function(block) {
  this.stack.push(new Frame(block));
  for (block.index = 0; block.index < block.nodes.length; ++block.index) {
    try {
      block.nodes[block.index] = this.visit(block.nodes[block.index]);
    } catch (err) {
      if ('return' == err.nodeName) {
        if (this.return) {
          this.stack.pop();
          throw err;
        } else {
          block.nodes[block.index] = err;
          break;
        }
      } else {
        throw err;
      }
    }
  }
  this.stack.pop();
  return block;
};
Evaluator.prototype.visitAtblock = function(atblock) {
  atblock.block = this.visit(atblock.block);
  return atblock;
};
Evaluator.prototype.visitAtrule = function(atrule) {
  atrule.val = this.interpolate(atrule);
  if (atrule.block)
    atrule.block = this.visit(atrule.block);
  return atrule;
};
Evaluator.prototype.visitSupports = function(node) {
  var condition = node.condition,
      val;
  this.return++;
  node.condition = this.visit(condition);
  this.return--;
  val = condition.first;
  if (1 == condition.nodes.length && 'string' == val.nodeName) {
    node.condition = val.string;
  }
  node.block = this.visit(node.block);
  return node;
};
Evaluator.prototype.visitIf = function(node) {
  var ret,
      block = this.currentBlock,
      negate = node.negate;
  this.return++;
  var ok = this.visit(node.cond).first.toBoolean();
  this.return--;
  node.block.scope = node.block.hasMedia;
  if (negate) {
    if (ok.isFalse) {
      ret = this.visit(node.block);
    }
  } else {
    if (ok.isTrue) {
      ret = this.visit(node.block);
    } else if (node.elses.length) {
      var elses = node.elses,
          len = elses.length,
          cond;
      for (var i = 0; i < len; ++i) {
        if (elses[i].cond) {
          elses[i].block.scope = elses[i].block.hasMedia;
          this.return++;
          cond = this.visit(elses[i].cond).first.toBoolean();
          this.return--;
          if (cond.isTrue) {
            ret = this.visit(elses[i].block);
            break;
          }
        } else {
          elses[i].scope = elses[i].hasMedia;
          ret = this.visit(elses[i]);
        }
      }
    }
  }
  if (ret && !node.postfix && block.node && ~['group', 'atrule', 'media', 'supports', 'keyframes'].indexOf(block.node.nodeName)) {
    this.mixin(ret.nodes, block);
    return nodes.null;
  }
  return ret || nodes.null;
};
Evaluator.prototype.visitExtend = function(extend) {
  var block = this.currentBlock;
  if ('group' != block.node.nodeName)
    block = this.closestGroup;
  extend.selectors.forEach(function(selector) {
    block.node.extends.push({
      selector: this.interpolate(selector.clone()).trim(),
      optional: selector.optional,
      lineno: selector.lineno,
      column: selector.column
    });
  }, this);
  return nodes.null;
};
Evaluator.prototype.visitImport = function(imported) {
  this.return++;
  var path = this.visit(imported.path).first,
      nodeName = imported.once ? 'require' : 'import',
      found,
      literal;
  this.return--;
  debug('import %s', path);
  if ('url' == path.name) {
    if (imported.once)
      throw new Error('You cannot @require a url');
    return imported;
  }
  if (!path.string)
    throw new Error('@' + nodeName + ' string expected');
  var name = path = path.string;
  if (/(?:url\s*\(\s*)?['"]?(?:#|(?:https?:)?\/\/)/i.test(path)) {
    if (imported.once)
      throw new Error('You cannot @require a url');
    return imported;
  }
  if (/\.css(?:"|$)/.test(path)) {
    literal = true;
    if (!imported.once && !this.includeCSS) {
      return imported;
    }
  }
  if (!literal && !/\.styl$/i.test(path))
    path += '.styl';
  found = utils.find(path, this.paths, this.filename);
  if (!found) {
    found = utils.lookupIndex(name, this.paths, this.filename);
  }
  if (!found)
    throw new Error('failed to locate @' + nodeName + ' file ' + path);
  var block = new nodes.Block;
  for (var i = 0,
      len = found.length; i < len; ++i) {
    block.push(importFile.call(this, imported, found[i], literal));
  }
  return block;
};
Evaluator.prototype.invokeFunction = function(fn, args, content) {
  var block = new nodes.Block(fn.block.parent);
  var body = fn.block.clone(block);
  var mixinBlock = this.stack.currentFrame.block;
  this.stack.push(new Frame(block));
  var scope = this.currentScope;
  if ('arguments' != args.nodeName) {
    var expr = new nodes.Expression;
    expr.push(args);
    args = nodes.Arguments.fromExpression(expr);
  }
  scope.add(new nodes.Ident('arguments', args));
  scope.add(new nodes.Ident('mixin', this.return ? nodes.false : new nodes.String(mixinBlock.nodeName)));
  if (this.property) {
    var prop = this.propertyExpression(this.property, fn.name);
    scope.add(new nodes.Ident('current-property', prop));
  } else {
    scope.add(new nodes.Ident('current-property', nodes.null));
  }
  var expr = new nodes.Expression;
  for (var i = this.calling.length - 1; i--; ) {
    expr.push(new nodes.Literal(this.calling[i]));
  }
  ;
  scope.add(new nodes.Ident('called-from', expr));
  var i = 0,
      len = args.nodes.length;
  fn.params.nodes.forEach(function(node) {
    if (node.rest) {
      node.val = new nodes.Expression;
      for (; i < len; ++i)
        node.val.push(args.nodes[i]);
      node.val.preserve = true;
      node.val.isList = args.isList;
    } else {
      var arg = args.map[node.name] || args.nodes[i++];
      node = node.clone();
      if (arg) {
        arg.isEmpty ? args.nodes[i - 1] = node.val : node.val = arg;
      } else {
        args.push(node.val);
      }
      if (node.val.isNull) {
        throw new Error('argument "' + node + '" required for ' + fn);
      }
    }
    scope.add(node);
  });
  if (content)
    scope.add(new nodes.Ident('block', content, true));
  return this.invoke(body, true, fn.filename);
};
Evaluator.prototype.invokeBuiltin = function(fn, args) {
  if (fn.raw) {
    args = args.nodes;
  } else {
    args = utils.params(fn).reduce(function(ret, param) {
      var arg = args.map[param] || args.nodes.shift();
      if (arg) {
        arg = utils.unwrap(arg);
        var len = arg.nodes.length;
        if (len > 1) {
          for (var i = 0; i < len; ++i) {
            ret.push(utils.unwrap(arg.nodes[i].first));
          }
        } else {
          ret.push(arg.first);
        }
      }
      return ret;
    }, []);
  }
  var body = utils.coerce(fn.apply(this, args));
  var expr = new nodes.Expression;
  expr.push(body);
  body = expr;
  return this.invoke(body);
};
Evaluator.prototype.invoke = function(body, stack, filename) {
  var self = this,
      ret;
  if (filename)
    this.paths.push(dirname(filename));
  if (this.return) {
    ret = this.eval(body.nodes);
    if (stack)
      this.stack.pop();
  } else {
    body = this.visit(body);
    if (stack)
      this.stack.pop();
    this.mixin(body.nodes, this.currentBlock);
    ret = nodes.null;
  }
  if (filename)
    this.paths.pop();
  return ret;
};
Evaluator.prototype.mixin = function(nodes, block) {
  if (!nodes.length)
    return;
  var len = block.nodes.length,
      head = block.nodes.slice(0, block.index),
      tail = block.nodes.slice(block.index + 1, len);
  this._mixin(nodes, head, block);
  block.index = 0;
  block.nodes = head.concat(tail);
};
Evaluator.prototype._mixin = function(items, dest, block) {
  var node,
      len = items.length;
  for (var i = 0; i < len; ++i) {
    switch ((node = items[i]).nodeName) {
      case 'return':
        return;
      case 'block':
        this._mixin(node.nodes, dest, block);
        break;
      case 'media':
        var parentNode = node.block.parent.node;
        if (parentNode && 'call' != parentNode.nodeName) {
          node.block.parent = block;
        }
      case 'property':
        var val = node.expr;
        if (node.literal && 'block' == val.first.name) {
          val = utils.unwrap(val);
          val.nodes[0] = new nodes.Literal('block');
        }
      default:
        dest.push(node);
    }
  }
};
Evaluator.prototype.mixinNode = function(node) {
  node = this.visit(node.first);
  switch (node.nodeName) {
    case 'object':
      this.mixinObject(node);
      return nodes.null;
    case 'block':
    case 'atblock':
      this.mixin(node.nodes, this.currentBlock);
      return nodes.null;
  }
};
Evaluator.prototype.mixinObject = function(object) {
  var Parser = require("../parser"),
      root = this.root,
      str = '$block ' + object.toBlock(),
      parser = new Parser(str, utils.merge({root: block}, this.options)),
      block;
  try {
    block = parser.parse();
  } catch (err) {
    err.filename = this.filename;
    err.lineno = parser.lexer.lineno;
    err.column = parser.lexer.column;
    err.input = str;
    throw err;
  }
  block.parent = root;
  block.scope = false;
  var ret = this.visit(block),
      vals = ret.first.nodes;
  for (var i = 0,
      len = vals.length; i < len; ++i) {
    if (vals[i].block) {
      this.mixin(vals[i].block.nodes, this.currentBlock);
      break;
    }
  }
};
Evaluator.prototype.eval = function(vals) {
  if (!vals)
    return nodes.null;
  var len = vals.length,
      node = nodes.null;
  try {
    for (var i = 0; i < len; ++i) {
      node = vals[i];
      switch (node.nodeName) {
        case 'if':
          if ('block' != node.block.nodeName) {
            node = this.visit(node);
            break;
          }
        case 'each':
        case 'block':
          node = this.visit(node);
          if (node.nodes)
            node = this.eval(node.nodes);
          break;
        default:
          node = this.visit(node);
      }
    }
  } catch (err) {
    if ('return' == err.nodeName) {
      return err.expr;
    } else {
      throw err;
    }
  }
  return node;
};
Evaluator.prototype.literalCall = function(call) {
  call.args = this.visit(call.args);
  return call;
};
Evaluator.prototype.lookupProperty = function(name) {
  var i = this.stack.length,
      index = this.currentBlock.index,
      top = i,
      nodes,
      block,
      len,
      other;
  while (i--) {
    block = this.stack[i].block;
    if (!block.node)
      continue;
    switch (block.node.nodeName) {
      case 'group':
      case 'function':
      case 'if':
      case 'each':
      case 'atrule':
      case 'media':
      case 'atblock':
      case 'call':
        nodes = block.nodes;
        if (i + 1 == top) {
          while (index--) {
            if (this.property == nodes[index])
              continue;
            other = this.interpolate(nodes[index]);
            if (name == other)
              return nodes[index].clone();
          }
        } else {
          len = nodes.length;
          while (len--) {
            if ('property' != nodes[len].nodeName || this.property == nodes[len])
              continue;
            other = this.interpolate(nodes[len]);
            if (name == other)
              return nodes[len].clone();
          }
        }
        break;
    }
  }
  return nodes.null;
};
Evaluator.prototype.__defineGetter__('closestBlock', function() {
  var i = this.stack.length,
      block;
  while (i--) {
    block = this.stack[i].block;
    if (block.node) {
      switch (block.node.nodeName) {
        case 'group':
        case 'keyframes':
        case 'atrule':
        case 'atblock':
        case 'media':
        case 'call':
          return block;
      }
    }
  }
});
Evaluator.prototype.__defineGetter__('closestGroup', function() {
  var i = this.stack.length,
      block;
  while (i--) {
    block = this.stack[i].block;
    if (block.node && 'group' == block.node.nodeName) {
      return block;
    }
  }
});
Evaluator.prototype.__defineGetter__('selectorStack', function() {
  var block,
      stack = [];
  for (var i = 0,
      len = this.stack.length; i < len; ++i) {
    block = this.stack[i].block;
    if (block.node && 'group' == block.node.nodeName) {
      block.node.nodes.forEach(function(selector) {
        if (!selector.val)
          selector.val = this.interpolate(selector);
      }, this);
      stack.push(block.node.nodes);
    }
  }
  return stack;
});
Evaluator.prototype.lookup = function(name) {
  var val;
  if (this.ignoreColors && name in colors)
    return;
  if (val = this.stack.lookup(name)) {
    return utils.unwrap(val);
  } else {
    return this.lookupFunction(name);
  }
};
Evaluator.prototype.interpolate = function(node) {
  var self = this,
      isSelector = ('selector' == node.nodeName);
  function toString(node) {
    switch (node.nodeName) {
      case 'function':
      case 'ident':
        return node.name;
      case 'literal':
      case 'string':
        if (self.prefix && !node.prefixed && !node.val.nodeName) {
          node.val = node.val.replace(/\./g, '.' + self.prefix);
          node.prefixed = true;
        }
        return node.val;
      case 'unit':
        return '%' == node.type ? node.val + '%' : node.val;
      case 'member':
        return toString(self.visit(node));
      case 'expression':
        if (self.calling && ~self.calling.indexOf('selector') && self._selector)
          return self._selector;
        self.return++;
        var ret = toString(self.visit(node).first);
        self.return--;
        if (isSelector)
          self._selector = ret;
        return ret;
    }
  }
  if (node.segments) {
    return node.segments.map(toString).join('');
  } else {
    return toString(node);
  }
};
Evaluator.prototype.lookupFunction = function(name) {
  var fn = this.functions[name] || bifs[name];
  if (fn)
    return new nodes.Function(name, fn);
};
Evaluator.prototype.isDefined = function(node) {
  if ('ident' == node.nodeName) {
    return nodes.Boolean(this.lookup(node.name));
  } else {
    throw new Error('invalid "is defined" check on non-variable ' + node);
  }
};
Evaluator.prototype.propertyExpression = function(prop, name) {
  var expr = new nodes.Expression,
      val = prop.expr.clone();
  expr.push(new nodes.String(prop.name));
  function replace(node) {
    if ('call' == node.nodeName && name == node.name) {
      return new nodes.Literal('__CALL__');
    }
    if (node.nodes)
      node.nodes = node.nodes.map(replace);
    return node;
  }
  replace(val);
  expr.push(val);
  return expr;
};
Evaluator.prototype.cast = function(expr) {
  return new nodes.Unit(expr.first.val, expr.nodes[1].name);
};
Evaluator.prototype.castable = function(expr) {
  return 2 == expr.nodes.length && 'unit' == expr.first.nodeName && ~units.indexOf(expr.nodes[1].name);
};
Evaluator.prototype.warn = function(msg) {
  if (!this.warnings)
    return;
  console.warn('\u001b[33mWarning:\u001b[0m ' + msg);
};
Evaluator.prototype.__defineGetter__('currentBlock', function() {
  return this.stack.currentFrame.block;
});
Evaluator.prototype.__defineGetter__('vendors', function() {
  return this.lookup('vendors').nodes.map(function(node) {
    return node.string;
  });
});
Evaluator.prototype.unvendorize = function(prop) {
  for (var i = 0,
      len = this.vendors.length; i < len; i++) {
    if ('official' != this.vendors[i]) {
      var vendor = '-' + this.vendors[i] + '-';
      if (~prop.indexOf(vendor))
        return prop.replace(vendor, '');
    }
  }
  return prop;
};
Evaluator.prototype.__defineGetter__('currentScope', function() {
  return this.stack.currentFrame.scope;
});
Evaluator.prototype.__defineGetter__('currentFrame', function() {
  return this.stack.currentFrame;
});
