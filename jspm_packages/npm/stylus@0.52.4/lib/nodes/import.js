/* */ 
var Node = require("./node");
var Import = module.exports = function Import(expr, once) {
  Node.call(this);
  this.path = expr;
  this.once = once || false;
};
Import.prototype.__proto__ = Node.prototype;
Import.prototype.clone = function(parent) {
  var clone = new Import();
  clone.path = this.path.nodeName ? this.path.clone(parent, clone) : this.path;
  clone.once = this.once;
  clone.mtime = this.mtime;
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
Import.prototype.toJSON = function() {
  return {
    __type: 'Import',
    path: this.path,
    once: this.once,
    mtime: this.mtime,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
