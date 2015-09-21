/* */ 
var Node = require("./node"),
    nodes = require("./index");
var Literal = module.exports = function Literal(str) {
  Node.call(this);
  this.val = str;
  this.string = str;
  this.prefixed = false;
};
Literal.prototype.__proto__ = Node.prototype;
Literal.prototype.__defineGetter__('hash', function() {
  return this.val;
});
Literal.prototype.toString = function() {
  return this.val;
};
Literal.prototype.coerce = function(other) {
  switch (other.nodeName) {
    case 'ident':
    case 'string':
    case 'literal':
      return new Literal(other.string);
    default:
      return Node.prototype.coerce.call(this, other);
  }
};
Literal.prototype.operate = function(op, right) {
  var val = right.first;
  switch (op) {
    case '+':
      return new nodes.Literal(this.string + this.coerce(val).string);
    default:
      return Node.prototype.operate.call(this, op, right);
  }
};
Literal.prototype.toJSON = function() {
  return {
    __type: 'Literal',
    val: this.val,
    string: this.string,
    prefixed: this.prefixed,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
