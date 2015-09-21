/* */ 
var Node = require("./node");
var Atblock = module.exports = function Atblock() {
  Node.call(this);
};
Atblock.prototype.__defineGetter__('nodes', function() {
  return this.block.nodes;
});
Atblock.prototype.__proto__ = Node.prototype;
Atblock.prototype.clone = function(parent) {
  var clone = new Atblock;
  clone.block = this.block.clone(parent, clone);
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
Atblock.prototype.toString = function() {
  return '@block';
};
Atblock.prototype.toJSON = function() {
  return {
    __type: 'Atblock',
    block: this.block,
    lineno: this.lineno,
    column: this.column,
    fileno: this.fileno
  };
};
