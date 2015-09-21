/* */ 
var Node = require("./node");
var Extend = module.exports = function Extend(selectors) {
  Node.call(this);
  this.selectors = selectors;
};
Extend.prototype.__proto__ = Node.prototype;
Extend.prototype.clone = function() {
  return new Extend(this.selectors);
};
Extend.prototype.toString = function() {
  return '@extend ' + this.selectors.join(', ');
};
Extend.prototype.toJSON = function() {
  return {
    __type: 'Extend',
    selectors: this.selectors,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
