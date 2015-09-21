/* */ 
var Atrule = require("./atrule");
var Supports = module.exports = function Supports(condition) {
  Atrule.call(this, 'supports');
  this.condition = condition;
};
Supports.prototype.__proto__ = Atrule.prototype;
Supports.prototype.clone = function(parent) {
  var clone = new Supports;
  clone.condition = this.condition.clone(parent, clone);
  clone.block = this.block.clone(parent, clone);
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
Supports.prototype.toJSON = function() {
  return {
    __type: 'Supports',
    condition: this.condition,
    block: this.block,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
Supports.prototype.toString = function() {
  return '@supports ' + this.condition;
};
