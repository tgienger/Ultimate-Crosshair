/* */ 
var Atrule = require("./atrule");
var Keyframes = module.exports = function Keyframes(segs, prefix) {
  Atrule.call(this, 'keyframes');
  this.segments = segs;
  this.prefix = prefix || 'official';
};
Keyframes.prototype.__proto__ = Atrule.prototype;
Keyframes.prototype.clone = function(parent) {
  var clone = new Keyframes;
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  clone.segments = this.segments.map(function(node) {
    return node.clone(parent, clone);
  });
  clone.prefix = this.prefix;
  clone.block = this.block.clone(parent, clone);
  return clone;
};
Keyframes.prototype.toJSON = function() {
  return {
    __type: 'Keyframes',
    segments: this.segments,
    prefix: this.prefix,
    block: this.block,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
Keyframes.prototype.toString = function() {
  return '@keyframes ' + this.segments.join('');
};
