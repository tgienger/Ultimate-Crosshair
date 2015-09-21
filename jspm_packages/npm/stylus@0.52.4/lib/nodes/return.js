/* */ 
var Node = require("./node"),
    nodes = require("./index");
var Return = module.exports = function Return(expr) {
  this.expr = expr || nodes.null;
};
Return.prototype.__proto__ = Node.prototype;
Return.prototype.clone = function(parent) {
  var clone = new Return();
  clone.expr = this.expr.clone(parent, clone);
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
Return.prototype.toJSON = function() {
  return {
    __type: 'Return',
    expr: this.expr,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
