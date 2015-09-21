/* */ 
var Node = require("./node");
var Member = module.exports = function Member(left, right) {
  Node.call(this);
  this.left = left;
  this.right = right;
};
Member.prototype.__proto__ = Node.prototype;
Member.prototype.clone = function(parent) {
  var clone = new Member;
  clone.left = this.left.clone(parent, clone);
  clone.right = this.right.clone(parent, clone);
  if (this.val)
    clone.val = this.val.clone(parent, clone);
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
Member.prototype.toJSON = function() {
  var json = {
    __type: 'Member',
    left: this.left,
    right: this.right,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
  if (this.val)
    json.val = this.val;
  return json;
};
Member.prototype.toString = function() {
  return this.left.toString() + '.' + this.right.toString();
};
