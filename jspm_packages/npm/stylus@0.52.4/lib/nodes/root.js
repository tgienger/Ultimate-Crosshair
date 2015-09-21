/* */ 
var Node = require("./node");
var Root = module.exports = function Root() {
  this.nodes = [];
};
Root.prototype.__proto__ = Node.prototype;
Root.prototype.push = function(node) {
  this.nodes.push(node);
};
Root.prototype.unshift = function(node) {
  this.nodes.unshift(node);
};
Root.prototype.clone = function() {
  var clone = new Root();
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  this.nodes.forEach(function(node) {
    clone.push(node.clone(clone, clone));
  });
  return clone;
};
Root.prototype.toString = function() {
  return '[Root]';
};
Root.prototype.toJSON = function() {
  return {
    __type: 'Root',
    nodes: this.nodes,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
