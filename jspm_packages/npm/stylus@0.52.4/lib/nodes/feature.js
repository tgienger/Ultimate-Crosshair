/* */ 
var Node = require("./node");
var Feature = module.exports = function Feature(segs) {
  Node.call(this);
  this.segments = segs;
  this.expr = null;
};
Feature.prototype.__proto__ = Node.prototype;
Feature.prototype.clone = function(parent) {
  var clone = new Feature;
  clone.segments = this.segments.map(function(node) {
    return node.clone(parent, clone);
  });
  if (this.expr)
    clone.expr = this.expr.clone(parent, clone);
  if (this.name)
    clone.name = this.name;
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
Feature.prototype.toString = function() {
  if (this.expr) {
    return '(' + this.segments.join('') + ': ' + this.expr.toString() + ')';
  } else {
    return this.segments.join('');
  }
};
Feature.prototype.toJSON = function() {
  var json = {
    __type: 'Feature',
    segments: this.segments,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
  if (this.expr)
    json.expr = this.expr;
  if (this.name)
    json.name = this.name;
  return json;
};
