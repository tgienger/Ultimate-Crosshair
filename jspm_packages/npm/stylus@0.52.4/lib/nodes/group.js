/* */ 
var Node = require("./node");
var Group = module.exports = function Group() {
  Node.call(this);
  this.nodes = [];
  this.extends = [];
};
Group.prototype.__proto__ = Node.prototype;
Group.prototype.push = function(selector) {
  this.nodes.push(selector);
};
Group.prototype.__defineGetter__('block', function() {
  return this.nodes[0].block;
});
Group.prototype.__defineSetter__('block', function(block) {
  for (var i = 0,
      len = this.nodes.length; i < len; ++i) {
    this.nodes[i].block = block;
  }
});
Group.prototype.__defineGetter__('hasOnlyPlaceholders', function() {
  return this.nodes.every(function(selector) {
    return selector.isPlaceholder;
  });
});
Group.prototype.clone = function(parent) {
  var clone = new Group;
  clone.lineno = this.lineno;
  clone.column = this.column;
  this.nodes.forEach(function(node) {
    clone.push(node.clone(parent, clone));
  });
  clone.filename = this.filename;
  clone.block = this.block.clone(parent, clone);
  return clone;
};
Group.prototype.toJSON = function() {
  return {
    __type: 'Group',
    nodes: this.nodes,
    block: this.block,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
