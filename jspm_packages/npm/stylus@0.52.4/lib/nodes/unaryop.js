/* */ 
var Node = require("./node");
var UnaryOp = module.exports = function UnaryOp(op, expr) {
  Node.call(this);
  this.op = op;
  this.expr = expr;
};
UnaryOp.prototype.__proto__ = Node.prototype;
UnaryOp.prototype.clone = function(parent) {
  var clone = new UnaryOp(this.op);
  clone.expr = this.expr.clone(parent, clone);
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
UnaryOp.prototype.toJSON = function() {
  return {
    __type: 'UnaryOp',
    op: this.op,
    expr: this.expr,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
