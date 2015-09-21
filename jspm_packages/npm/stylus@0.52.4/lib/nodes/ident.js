/* */ 
var Node = require("./node"),
    nodes = require("./index");
var Ident = module.exports = function Ident(name, val, mixin) {
  Node.call(this);
  this.name = name;
  this.string = name;
  this.val = val || nodes.null;
  this.mixin = !!mixin;
};
Ident.prototype.__defineGetter__('isEmpty', function() {
  return undefined == this.val;
});
Ident.prototype.__defineGetter__('hash', function() {
  return this.name;
});
Ident.prototype.__proto__ = Node.prototype;
Ident.prototype.clone = function(parent) {
  var clone = new Ident(this.name);
  clone.val = this.val.clone(parent, clone);
  clone.mixin = this.mixin;
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  clone.property = this.property;
  clone.rest = this.rest;
  return clone;
};
Ident.prototype.toJSON = function() {
  return {
    __type: 'Ident',
    name: this.name,
    val: this.val,
    mixin: this.mixin,
    property: this.property,
    rest: this.rest,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
Ident.prototype.toString = function() {
  return this.name;
};
Ident.prototype.coerce = function(other) {
  switch (other.nodeName) {
    case 'ident':
    case 'string':
    case 'literal':
      return new Ident(other.string);
    case 'unit':
      return new Ident(other.toString());
    default:
      return Node.prototype.coerce.call(this, other);
  }
};
Ident.prototype.operate = function(op, right) {
  var val = right.first;
  switch (op) {
    case '-':
      if ('unit' == val.nodeName) {
        var expr = new nodes.Expression;
        val = val.clone();
        val.val = -val.val;
        expr.push(this);
        expr.push(val);
        return expr;
      }
    case '+':
      return new nodes.Ident(this.string + this.coerce(val).string);
  }
  return Node.prototype.operate.call(this, op, right);
};
