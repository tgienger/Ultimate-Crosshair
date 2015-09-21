/* */ 
var Node = require("./node"),
    nodes = require("./index");
var Null = module.exports = function Null() {};
Null.prototype.__proto__ = Node.prototype;
Null.prototype.inspect = Null.prototype.toString = function() {
  return 'null';
};
Null.prototype.toBoolean = function() {
  return nodes.false;
};
Null.prototype.__defineGetter__('isNull', function() {
  return true;
});
Null.prototype.__defineGetter__('hash', function() {
  return null;
});
Null.prototype.toJSON = function() {
  return {
    __type: 'Null',
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
