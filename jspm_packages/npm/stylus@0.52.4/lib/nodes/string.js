/* */ 
var Node = require("./node"),
    sprintf = require("../functions/index").s,
    utils = require("../utils"),
    nodes = require("./index");
var String = module.exports = function String(val, quote) {
  Node.call(this);
  this.val = val;
  this.string = val;
  this.prefixed = false;
  if (typeof quote !== 'string') {
    this.quote = "'";
  } else {
    this.quote = quote;
  }
};
String.prototype.__proto__ = Node.prototype;
String.prototype.toString = function() {
  return this.quote + this.val + this.quote;
};
String.prototype.clone = function() {
  var clone = new String(this.val, this.quote);
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
String.prototype.toJSON = function() {
  return {
    __type: 'String',
    val: this.val,
    quote: this.quote,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
String.prototype.toBoolean = function() {
  return nodes.Boolean(this.val.length);
};
String.prototype.coerce = function(other) {
  switch (other.nodeName) {
    case 'string':
      return other;
    case 'expression':
      return new String(other.nodes.map(function(node) {
        return this.coerce(node).val;
      }, this).join(' '));
    default:
      return new String(other.toString());
  }
};
String.prototype.operate = function(op, right) {
  switch (op) {
    case '%':
      var expr = new nodes.Expression;
      expr.push(this);
      var args = 'expression' == right.nodeName ? utils.unwrap(right).nodes : [right];
      return sprintf.apply(null, [expr].concat(args));
    case '+':
      var expr = new nodes.Expression;
      expr.push(new String(this.val + this.coerce(right).val));
      return expr;
    default:
      return Node.prototype.operate.call(this, op, right);
  }
};
