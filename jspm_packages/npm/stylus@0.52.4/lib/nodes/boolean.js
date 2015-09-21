/* */ 
var Node = require("./node"),
    nodes = require("./index");
var Boolean = module.exports = function Boolean(val) {
  Node.call(this);
  if (this.nodeName) {
    this.val = !!val;
  } else {
    return new Boolean(val);
  }
};
Boolean.prototype.__proto__ = Node.prototype;
Boolean.prototype.toBoolean = function() {
  return this;
};
Boolean.prototype.__defineGetter__('isTrue', function() {
  return this.val;
});
Boolean.prototype.__defineGetter__('isFalse', function() {
  return !this.val;
});
Boolean.prototype.negate = function() {
  return new Boolean(!this.val);
};
Boolean.prototype.inspect = function() {
  return '[Boolean ' + this.val + ']';
};
Boolean.prototype.toString = function() {
  return this.val ? 'true' : 'false';
};
Boolean.prototype.toJSON = function() {
  return {
    __type: 'Boolean',
    val: this.val
  };
};
