/* */ 
var Node = require("./node"),
    nodes = require("./index"),
    utils = require("../utils");
var Expression = module.exports = function Expression(isList) {
  Node.call(this);
  this.nodes = [];
  this.isList = isList;
};
Expression.prototype.__defineGetter__('isEmpty', function() {
  return !this.nodes.length;
});
Expression.prototype.__defineGetter__('first', function() {
  return this.nodes[0] ? this.nodes[0].first : nodes.null;
});
Expression.prototype.__defineGetter__('hash', function() {
  return this.nodes.map(function(node) {
    return node.hash;
  }).join('::');
});
Expression.prototype.__proto__ = Node.prototype;
Expression.prototype.clone = function(parent) {
  var clone = new this.constructor(this.isList);
  clone.preserve = this.preserve;
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  clone.nodes = this.nodes.map(function(node) {
    return node.clone(parent, clone);
  });
  return clone;
};
Expression.prototype.push = function(node) {
  this.nodes.push(node);
};
Expression.prototype.operate = function(op, right, val) {
  switch (op) {
    case '[]=':
      var self = this,
          range = utils.unwrap(right).nodes,
          val = utils.unwrap(val),
          len,
          node;
      range.forEach(function(unit) {
        len = self.nodes.length;
        if ('unit' == unit.nodeName) {
          var i = unit.val < 0 ? len + unit.val : unit.val,
              n = i;
          while (i-- > len)
            self.nodes[i] = nodes.null;
          self.nodes[n] = val;
        } else if (unit.string) {
          node = self.nodes[0];
          if (node && 'object' == node.nodeName)
            node.set(unit.string, val.clone());
        }
      });
      return val;
    case '[]':
      var expr = new nodes.Expression,
          vals = utils.unwrap(this).nodes,
          range = utils.unwrap(right).nodes,
          node;
      range.forEach(function(unit) {
        if ('unit' == unit.nodeName) {
          node = vals[unit.val < 0 ? vals.length + unit.val : unit.val];
        } else if ('object' == vals[0].nodeName) {
          node = vals[0].get(unit.string);
        }
        if (node)
          expr.push(node);
      });
      return expr.isEmpty ? nodes.null : utils.unwrap(expr);
    case '||':
      return this.toBoolean().isTrue ? this : right;
    case 'in':
      return Node.prototype.operate.call(this, op, right);
    case '!=':
      return this.operate('==', right, val).negate();
    case '==':
      var len = this.nodes.length,
          right = right.toExpression(),
          a,
          b;
      if (len != right.nodes.length)
        return nodes.false;
      for (var i = 0; i < len; ++i) {
        a = this.nodes[i];
        b = right.nodes[i];
        if (a.operate(op, b).isTrue)
          continue;
        return nodes.false;
      }
      return nodes.true;
      break;
    default:
      return this.first.operate(op, right, val);
  }
};
Expression.prototype.toBoolean = function() {
  if (this.nodes.length > 1)
    return nodes.true;
  return this.first.toBoolean();
};
Expression.prototype.toString = function() {
  return '(' + this.nodes.map(function(node) {
    return node.toString();
  }).join(this.isList ? ', ' : ' ') + ')';
};
Expression.prototype.toJSON = function() {
  return {
    __type: 'Expression',
    isList: this.isList,
    preserve: this.preserve,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename,
    nodes: this.nodes
  };
};
