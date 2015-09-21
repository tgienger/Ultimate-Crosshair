/* */ 
var Node = require("./node");
var Ternary = module.exports = function Ternary(cond, trueExpr, falseExpr) {
  Node.call(this);
  this.cond = cond;
  this.trueExpr = trueExpr;
  this.falseExpr = falseExpr;
};
Ternary.prototype.__proto__ = Node.prototype;
Ternary.prototype.clone = function(parent) {
  var clone = new Ternary();
  clone.cond = this.cond.clone(parent, clone);
  clone.trueExpr = this.trueExpr.clone(parent, clone);
  clone.falseExpr = this.falseExpr.clone(parent, clone);
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
Ternary.prototype.toJSON = function() {
  return {
    __type: 'Ternary',
    cond: this.cond,
    trueExpr: this.trueExpr,
    falseExpr: this.falseExpr,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
