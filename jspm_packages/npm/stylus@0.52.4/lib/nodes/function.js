/* */ 
var Node = require("./node");
var Function = module.exports = function Function(name, params, body) {
  Node.call(this);
  this.name = name;
  this.params = params;
  this.block = body;
  if ('function' == typeof params)
    this.fn = params;
};
Function.prototype.__defineGetter__('arity', function() {
  return this.params.length;
});
Function.prototype.__proto__ = Node.prototype;
Function.prototype.__defineGetter__('hash', function() {
  return 'function ' + this.name;
});
Function.prototype.clone = function(parent) {
  if (this.fn) {
    var clone = new Function(this.name, this.fn);
  } else {
    var clone = new Function(this.name);
    clone.params = this.params.clone(parent, clone);
    clone.block = this.block.clone(parent, clone);
  }
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
Function.prototype.toString = function() {
  if (this.fn) {
    return this.name + '(' + this.fn.toString().match(/^function *\w*\((.*?)\)/).slice(1).join(', ') + ')';
  } else {
    return this.name + '(' + this.params.nodes.join(', ') + ')';
  }
};
Function.prototype.toJSON = function() {
  var json = {
    __type: 'Function',
    name: this.name,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
  if (this.fn) {
    json.fn = this.fn;
  } else {
    json.params = this.params;
    json.block = this.block;
  }
  return json;
};
