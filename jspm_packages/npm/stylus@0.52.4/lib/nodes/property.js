/* */ 
var Node = require("./node");
var Property = module.exports = function Property(segs, expr) {
  Node.call(this);
  this.segments = segs;
  this.expr = expr;
};
Property.prototype.__proto__ = Node.prototype;
Property.prototype.clone = function(parent) {
  var clone = new Property(this.segments);
  clone.name = this.name;
  if (this.literal)
    clone.literal = this.literal;
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  clone.segments = this.segments.map(function(node) {
    return node.clone(parent, clone);
  });
  if (this.expr)
    clone.expr = this.expr.clone(parent, clone);
  return clone;
};
Property.prototype.toJSON = function() {
  var json = {
    __type: 'Property',
    segments: this.segments,
    name: this.name,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
  if (this.expr)
    json.expr = this.expr;
  if (this.literal)
    json.literal = this.literal;
  return json;
};
Property.prototype.toString = function() {
  return 'property(' + this.segments.join('') + ', ' + this.expr + ')';
};
Property.prototype.operate = function(op, right, val) {
  return this.expr.operate(op, right, val);
};
