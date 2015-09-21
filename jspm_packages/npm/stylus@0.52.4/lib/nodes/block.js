/* */ 
var Node = require("./node");
var Block = module.exports = function Block(parent, node) {
  Node.call(this);
  this.nodes = [];
  this.parent = parent;
  this.node = node;
  this.scope = true;
};
Block.prototype.__proto__ = Node.prototype;
Block.prototype.__defineGetter__('hasProperties', function() {
  for (var i = 0,
      len = this.nodes.length; i < len; ++i) {
    if ('property' == this.nodes[i].nodeName) {
      return true;
    }
  }
});
Block.prototype.__defineGetter__('hasMedia', function() {
  for (var i = 0,
      len = this.nodes.length; i < len; ++i) {
    var nodeName = this.nodes[i].nodeName;
    if ('media' == nodeName) {
      return true;
    }
  }
  return false;
});
Block.prototype.__defineGetter__('isEmpty', function() {
  return !this.nodes.length;
});
Block.prototype.clone = function(parent, node) {
  parent = parent || this.parent;
  var clone = new Block(parent, node || this.node);
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  clone.scope = this.scope;
  this.nodes.forEach(function(node) {
    clone.push(node.clone(clone, clone));
  });
  return clone;
};
Block.prototype.push = function(node) {
  this.nodes.push(node);
};
Block.prototype.toJSON = function() {
  return {
    __type: 'Block',
    scope: this.scope,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename,
    nodes: this.nodes
  };
};
