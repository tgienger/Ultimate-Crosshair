/* */ 
var Node = require("./node");
var BinOp = module.exports = function BinOp(op, left, right) {
  Node.call(this);
  this.op = op;
  this.left = left;
  this.right = right;
};
BinOp.prototype.__proto__ = Node.prototype;
BinOp.prototype.clone = function(parent) {
  var clone = new BinOp(this.op);
  clone.left = this.left.clone(parent, clone);
  clone.right = this.right && this.right.clone(parent, clone);
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  if (this.val)
    clone.val = this.val.clone(parent, clone);
  return clone;
};
BinOp.prototype.toString = function() {
  return this.left.toString() + ' ' + this.op + ' ' + this.right.toString();
};
BinOp.prototype.toJSON = function() {
  var json = {
    __type: 'BinOp',
    left: this.left,
    right: this.right,
    op: this.op,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
  if (this.val)
    json.val = this.val;
  return json;
};
