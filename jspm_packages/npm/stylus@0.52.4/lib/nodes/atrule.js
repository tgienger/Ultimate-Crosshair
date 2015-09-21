/* */ 
var Node = require("./node");
var Atrule = module.exports = function Atrule(type) {
  Node.call(this);
  this.type = type;
};
Atrule.prototype.__proto__ = Node.prototype;
Atrule.prototype.__defineGetter__('hasOnlyProperties', function() {
  if (!this.block)
    return false;
  var nodes = this.block.nodes;
  for (var i = 0,
      len = nodes.length; i < len; ++i) {
    var nodeName = nodes[i].nodeName;
    switch (nodes[i].nodeName) {
      case 'property':
      case 'expression':
      case 'comment':
        continue;
      default:
        return false;
    }
  }
  return true;
});
Atrule.prototype.clone = function(parent) {
  var clone = new Atrule(this.type);
  if (this.block)
    clone.block = this.block.clone(parent, clone);
  clone.segments = this.segments.map(function(node) {
    return node.clone(parent, clone);
  });
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
Atrule.prototype.toJSON = function() {
  var json = {
    __type: 'Atrule',
    type: this.type,
    segments: this.segments,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
  if (this.block)
    json.block = this.block;
  return json;
};
Atrule.prototype.toString = function() {
  return '@' + this.type;
};
Atrule.prototype.__defineGetter__('hasOutput', function() {
  return !!this.block && hasOutput(this.block);
});
function hasOutput(block) {
  var nodes = block.nodes;
  if (nodes.every(function(node) {
    return 'group' == node.nodeName && node.hasOnlyPlaceholders;
  }))
    return false;
  return nodes.some(function(node) {
    switch (node.nodeName) {
      case 'property':
      case 'literal':
      case 'import':
        return true;
      case 'block':
        return hasOutput(node);
      default:
        if (node.block)
          return hasOutput(node.block);
    }
  });
}
