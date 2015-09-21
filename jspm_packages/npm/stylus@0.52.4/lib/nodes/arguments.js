/* */ 
var Node = require("./node"),
    nodes = require("./index"),
    utils = require("../utils");
var Arguments = module.exports = function Arguments() {
  nodes.Expression.call(this);
  this.map = {};
};
Arguments.prototype.__proto__ = nodes.Expression.prototype;
Arguments.fromExpression = function(expr) {
  var args = new Arguments,
      len = expr.nodes.length;
  args.lineno = expr.lineno;
  args.column = expr.column;
  args.isList = expr.isList;
  for (var i = 0; i < len; ++i) {
    args.push(expr.nodes[i]);
  }
  return args;
};
Arguments.prototype.clone = function(parent) {
  var clone = nodes.Expression.prototype.clone.call(this, parent);
  clone.map = {};
  for (var key in this.map) {
    clone.map[key] = this.map[key].clone(parent, clone);
  }
  clone.isList = this.isList;
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
Arguments.prototype.toJSON = function() {
  return {
    __type: 'Arguments',
    map: this.map,
    isList: this.isList,
    preserve: this.preserve,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename,
    nodes: this.nodes
  };
};
