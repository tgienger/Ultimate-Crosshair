/* */ 
var Node = require("./node");
var Params = module.exports = function Params() {
  Node.call(this);
  this.nodes = [];
};
Params.prototype.__defineGetter__('length', function() {
  return this.nodes.length;
});
Params.prototype.__proto__ = Node.prototype;
Params.prototype.push = function(node) {
  this.nodes.push(node);
};
Params.prototype.clone = function(parent) {
  var clone = new Params;
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  this.nodes.forEach(function(node) {
    clone.push(node.clone(parent, clone));
  });
  return clone;
};
Params.prototype.toJSON = function() {
  return {
    __type: 'Params',
    nodes: this.nodes,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
