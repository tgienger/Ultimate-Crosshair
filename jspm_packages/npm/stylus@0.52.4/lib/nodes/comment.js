/* */ 
var Node = require("./node");
var Comment = module.exports = function Comment(str, suppress, inline) {
  Node.call(this);
  this.str = str;
  this.suppress = suppress;
  this.inline = inline;
};
Comment.prototype.__proto__ = Node.prototype;
Comment.prototype.toJSON = function() {
  return {
    __type: 'Comment',
    str: this.str,
    suppress: this.suppress,
    inline: this.inline,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
Comment.prototype.toString = function() {
  return this.str;
};
