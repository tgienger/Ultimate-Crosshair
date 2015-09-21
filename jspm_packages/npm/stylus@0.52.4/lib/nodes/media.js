/* */ 
var Atrule = require("./atrule");
var Media = module.exports = function Media(val) {
  Atrule.call(this, 'media');
  this.val = val;
};
Media.prototype.__proto__ = Atrule.prototype;
Media.prototype.clone = function(parent) {
  var clone = new Media;
  clone.val = this.val.clone(parent, clone);
  clone.block = this.block.clone(parent, clone);
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
Media.prototype.toJSON = function() {
  return {
    __type: 'Media',
    val: this.val,
    block: this.block,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
Media.prototype.toString = function() {
  return '@media ' + this.val;
};
