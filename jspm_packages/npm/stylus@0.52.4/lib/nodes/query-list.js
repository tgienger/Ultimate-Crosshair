/* */ 
var Node = require("./node");
var QueryList = module.exports = function QueryList() {
  Node.call(this);
  this.nodes = [];
};
QueryList.prototype.__proto__ = Node.prototype;
QueryList.prototype.clone = function(parent) {
  var clone = new QueryList;
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  for (var i = 0; i < this.nodes.length; ++i) {
    clone.push(this.nodes[i].clone(parent, clone));
  }
  return clone;
};
QueryList.prototype.push = function(node) {
  this.nodes.push(node);
};
QueryList.prototype.merge = function(other) {
  var list = new QueryList,
      merged;
  this.nodes.forEach(function(query) {
    for (var i = 0,
        len = other.nodes.length; i < len; ++i) {
      merged = query.merge(other.nodes[i]);
      if (merged)
        list.push(merged);
    }
  });
  return list;
};
QueryList.prototype.toString = function() {
  return '(' + this.nodes.map(function(node) {
    return node.toString();
  }).join(', ') + ')';
};
QueryList.prototype.toJSON = function() {
  return {
    __type: 'QueryList',
    nodes: this.nodes,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
