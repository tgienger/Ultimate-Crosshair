/* */ 
var Evaluator = require("../visitor/evaluator"),
    utils = require("../utils"),
    nodes = require("./index");
function CoercionError(msg) {
  this.name = 'CoercionError';
  this.message = msg;
  Error.captureStackTrace(this, CoercionError);
}
CoercionError.prototype.__proto__ = Error.prototype;
var Node = module.exports = function Node() {
  this.lineno = nodes.lineno || 1;
  this.column = nodes.column || 1;
  this.filename = nodes.filename;
};
Node.prototype = {
  constructor: Node,
  get first() {
    return this;
  },
  get hash() {
    return this.val;
  },
  get nodeName() {
    return this.constructor.name.toLowerCase();
  },
  clone: function() {
    return this;
  },
  toJSON: function() {
    return {
      lineno: this.lineno,
      column: this.column,
      filename: this.filename
    };
  },
  eval: function() {
    return new Evaluator(this).evaluate();
  },
  toBoolean: function() {
    return nodes.true;
  },
  toExpression: function() {
    if ('expression' == this.nodeName)
      return this;
    var expr = new nodes.Expression;
    expr.push(this);
    return expr;
  },
  shouldCoerce: function(op) {
    switch (op) {
      case 'is a':
      case 'in':
      case '||':
      case '&&':
        return false;
      default:
        return true;
    }
  },
  operate: function(op, right) {
    switch (op) {
      case 'is a':
        if ('string' == right.nodeName) {
          return nodes.Boolean(this.nodeName == right.val);
        } else {
          throw new Error('"is a" expects a string, got ' + right.toString());
        }
      case '==':
        return nodes.Boolean(this.hash == right.hash);
      case '!=':
        return nodes.Boolean(this.hash != right.hash);
      case '>=':
        return nodes.Boolean(this.hash >= right.hash);
      case '<=':
        return nodes.Boolean(this.hash <= right.hash);
      case '>':
        return nodes.Boolean(this.hash > right.hash);
      case '<':
        return nodes.Boolean(this.hash < right.hash);
      case '||':
        return this.toBoolean().isTrue ? this : right;
      case 'in':
        var vals = utils.unwrap(right).nodes,
            len = vals && vals.length,
            hash = this.hash;
        if (!vals)
          throw new Error('"in" given invalid right-hand operand, expecting an expression');
        if (1 == len && 'object' == vals[0].nodeName) {
          return nodes.Boolean(vals[0].has(this.hash));
        }
        for (var i = 0; i < len; ++i) {
          if (hash == vals[i].hash) {
            return nodes.true;
          }
        }
        return nodes.false;
      case '&&':
        var a = this.toBoolean(),
            b = right.toBoolean();
        return a.isTrue && b.isTrue ? right : a.isFalse ? this : right;
      default:
        if ('[]' == op) {
          var msg = 'cannot perform ' + this + '[' + right + ']';
        } else {
          var msg = 'cannot perform' + ' ' + this + ' ' + op + ' ' + right;
        }
        throw new Error(msg);
    }
  },
  coerce: function(other) {
    if (other.nodeName == this.nodeName)
      return other;
    throw new CoercionError('cannot coerce ' + other + ' to ' + this.nodeName);
  }
};
