/* */ 
var Node = require("./node");
var Charset = module.exports = function Charset(val) {
  Node.call(this);
  this.val = val;
};
Charset.prototype.__proto__ = Node.prototype;
Charset.prototype.toString = function() {
  return '@charset ' + this.val;
};
Charset.prototype.toJSON = function() {
  return {
    __type: 'Charset',
    val: this.val,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
