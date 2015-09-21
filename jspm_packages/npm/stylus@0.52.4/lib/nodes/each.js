/* */ 
var Node = require("./node"),
    nodes = require("./index");
var Each = module.exports = function Each(val, key, expr, block) {
  Node.call(this);
  this.val = val;
  this.key = key;
  this.expr = expr;
  this.block = block;
};
Each.prototype.__proto__ = Node.prototype;
Each.prototype.clone = function(parent) {
  var clone = new Each(this.val, this.key);
  clone.expr = this.expr.clone(parent, clone);
  clone.block = this.block.clone(parent, clone);
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
Each.prototype.toJSON = function() {
  return {
    __type: 'Each',
    val: this.val,
    key: this.key,
    expr: this.expr,
    block: this.block,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
