/* */ 
var Node = require("./node");
var Call = module.exports = function Call(name, args) {
  Node.call(this);
  this.name = name;
  this.args = args;
};
Call.prototype.__proto__ = Node.prototype;
Call.prototype.clone = function(parent) {
  var clone = new Call(this.name);
  clone.args = this.args.clone(parent, clone);
  if (this.block)
    clone.block = this.block.clone(parent, clone);
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
Call.prototype.toString = function() {
  var args = this.args.nodes.map(function(node) {
    var str = node.toString();
    return str.slice(1, str.length - 1);
  }).join(', ');
  return this.name + '(' + args + ')';
};
Call.prototype.toJSON = function() {
  var json = {
    __type: 'Call',
    name: this.name,
    args: this.args,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
  if (this.block)
    json.block = this.block;
  return json;
};
