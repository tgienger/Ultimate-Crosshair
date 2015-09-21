/* */ 
var Block = require("./block"),
    Node = require("./node");
var Selector = module.exports = function Selector(segs) {
  Node.call(this);
  this.inherits = true;
  this.segments = segs;
  this.optional = false;
};
Selector.prototype.__proto__ = Node.prototype;
Selector.prototype.toString = function() {
  return this.segments.join('') + (this.optional ? ' !optional' : '');
};
Selector.prototype.__defineGetter__('isPlaceholder', function() {
  return this.val && ~this.val.substr(0, 2).indexOf('$');
});
Selector.prototype.clone = function(parent) {
  var clone = new Selector;
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  clone.inherits = this.inherits;
  clone.val = this.val;
  clone.segments = this.segments.map(function(node) {
    return node.clone(parent, clone);
  });
  clone.optional = this.optional;
  return clone;
};
Selector.prototype.toJSON = function() {
  return {
    __type: 'Selector',
    inherits: this.inherits,
    segments: this.segments,
    optional: this.optional,
    val: this.val,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
