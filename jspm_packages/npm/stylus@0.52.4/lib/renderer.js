/* */ 
var Parser = require("./parser"),
    EventEmitter = require("events").EventEmitter,
    Evaluator = require("./visitor/evaluator"),
    Normalizer = require("./visitor/normalizer"),
    events = new EventEmitter,
    utils = require("./utils"),
    nodes = require("./nodes/index"),
    join = require("path").join;
module.exports = Renderer;
function Renderer(str, options) {
  options = options || {};
  options.globals = options.globals || {};
  options.functions = options.functions || {};
  options.use = options.use || [];
  options.use = Array.isArray(options.use) ? options.use : [options.use];
  options.imports = [join(__dirname, 'functions')];
  options.paths = options.paths || [];
  options.filename = options.filename || 'stylus';
  options.Evaluator = options.Evaluator || Evaluator;
  this.options = options;
  this.str = str;
  this.events = events;
}
;
Renderer.prototype.__proto__ = EventEmitter.prototype;
module.exports.events = events;
Renderer.prototype.render = function(fn) {
  var parser = this.parser = new Parser(this.str, this.options);
  for (var i = 0,
      len = this.options.use.length; i < len; i++) {
    this.use(this.options.use[i]);
  }
  try {
    nodes.filename = this.options.filename;
    var ast = parser.parse();
    this.evaluator = new this.options.Evaluator(ast, this.options);
    this.nodes = nodes;
    this.evaluator.renderer = this;
    ast = this.evaluator.evaluate();
    var normalizer = new Normalizer(ast, this.options);
    ast = normalizer.normalize();
    var compiler = this.options.sourcemap ? new (require("./visitor/sourcemapper"))(ast, this.options) : new (require("./visitor/compiler"))(ast, this.options),
        css = compiler.compile();
    if (this.options.sourcemap)
      this.sourcemap = compiler.map.toJSON();
  } catch (err) {
    var options = {};
    options.input = err.input || this.str;
    options.filename = err.filename || this.options.filename;
    options.lineno = err.lineno || parser.lexer.lineno;
    options.column = err.column || parser.lexer.column;
    if (!fn)
      throw utils.formatException(err, options);
    return fn(utils.formatException(err, options));
  }
  var listeners = this.listeners('end');
  if (fn)
    listeners.push(fn);
  for (var i = 0,
      len = listeners.length; i < len; i++) {
    var ret = listeners[i](null, css);
    if (ret)
      css = ret;
  }
  if (!fn)
    return css;
};
Renderer.prototype.deps = function(filename) {
  if (filename)
    this.options.filename = filename;
  var DepsResolver = require("./visitor/deps-resolver"),
      parser = new Parser(this.str, this.options);
  try {
    nodes.filename = this.options.filename;
    var ast = parser.parse(),
        resolver = new DepsResolver(ast, this.options);
    return resolver.resolve();
  } catch (err) {
    var options = {};
    options.input = err.input || this.str;
    options.filename = err.filename || this.options.filename;
    options.lineno = err.lineno || parser.lexer.lineno;
    options.column = err.column || parser.lexer.column;
    throw utils.formatException(err, options);
  }
};
Renderer.prototype.set = function(key, val) {
  this.options[key] = val;
  return this;
};
Renderer.prototype.get = function(key) {
  return this.options[key];
};
Renderer.prototype.include = function(path) {
  this.options.paths.push(path);
  return this;
};
Renderer.prototype.use = function(fn) {
  fn.call(this, this);
  return this;
};
Renderer.prototype.define = function(name, fn, raw) {
  fn = utils.coerce(fn, raw);
  if (fn.nodeName) {
    this.options.globals[name] = fn;
    return this;
  }
  this.options.functions[name] = fn;
  if (undefined != raw)
    fn.raw = raw;
  return this;
};
Renderer.prototype.import = function(file) {
  this.options.imports.push(file);
  return this;
};
