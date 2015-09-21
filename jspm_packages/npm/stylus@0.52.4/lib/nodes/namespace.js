/* */ 
var Node = require("./node");
var Namespace = module.exports = function Namespace(val, prefix) {
  Node.call(this);
  this.val = val;
  this.prefix = prefix;
};
Namespace.prototype.__proto__ = Node.prototype;
Namespace.prototype.toString = function() {
  return '@namespace ' + (this.prefix ? this.prefix + ' ' : '') + this.val;
};
Namespace.prototype.toJSON = function() {
  return {
    __type: 'Namespace',
    val: this.val,
    prefix: this.prefix,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
