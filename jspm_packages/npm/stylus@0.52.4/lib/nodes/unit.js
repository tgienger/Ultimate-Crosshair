/* */ 
var Node = require("./node"),
    nodes = require("./index");
var FACTOR_TABLE = {
  'mm': {
    val: 1,
    label: 'mm'
  },
  'cm': {
    val: 10,
    label: 'mm'
  },
  'in': {
    val: 25.4,
    label: 'mm'
  },
  'pt': {
    val: 25.4 / 72,
    label: 'mm'
  },
  'ms': {
    val: 1,
    label: 'ms'
  },
  's': {
    val: 1000,
    label: 'ms'
  },
  'Hz': {
    val: 1,
    label: 'Hz'
  },
  'kHz': {
    val: 1000,
    label: 'Hz'
  }
};
var Unit = module.exports = function Unit(val, type) {
  Node.call(this);
  this.val = val;
  this.type = type;
};
Unit.prototype.__proto__ = Node.prototype;
Unit.prototype.toBoolean = function() {
  return nodes.Boolean(this.type ? true : this.val);
};
Unit.prototype.toString = function() {
  return this.val + (this.type || '');
};
Unit.prototype.clone = function() {
  var clone = new Unit(this.val, this.type);
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
Unit.prototype.toJSON = function() {
  return {
    __type: 'Unit',
    val: this.val,
    type: this.type,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
Unit.prototype.operate = function(op, right) {
  var type = this.type || right.first.type;
  if ('rgba' == right.nodeName || 'hsla' == right.nodeName) {
    return right.operate(op, this);
  }
  if (this.shouldCoerce(op)) {
    right = right.first;
    if ('%' != this.type && ('-' == op || '+' == op) && '%' == right.type) {
      right = new Unit(this.val * (right.val / 100), '%');
    } else {
      right = this.coerce(right);
    }
    switch (op) {
      case '-':
        return new Unit(this.val - right.val, type);
      case '+':
        type = type || (right.type == '%' && right.type);
        return new Unit(this.val + right.val, type);
      case '/':
        return new Unit(this.val / right.val, type);
      case '*':
        return new Unit(this.val * right.val, type);
      case '%':
        return new Unit(this.val % right.val, type);
      case '**':
        return new Unit(Math.pow(this.val, right.val), type);
      case '..':
      case '...':
        var start = this.val,
            end = right.val,
            expr = new nodes.Expression,
            inclusive = '..' == op;
        if (start < end) {
          do {
            expr.push(new nodes.Unit(start));
          } while (inclusive ? ++start <= end : ++start < end);
        } else {
          do {
            expr.push(new nodes.Unit(start));
          } while (inclusive ? --start >= end : --start > end);
        }
        return expr;
    }
  }
  return Node.prototype.operate.call(this, op, right);
};
Unit.prototype.coerce = function(other) {
  if ('unit' == other.nodeName) {
    var a = this,
        b = other,
        factorA = FACTOR_TABLE[a.type],
        factorB = FACTOR_TABLE[b.type];
    if (factorA && factorB && (factorA.label == factorB.label)) {
      var bVal = b.val * (factorB.val / factorA.val);
      return new nodes.Unit(bVal, a.type);
    } else {
      return new nodes.Unit(b.val, a.type);
    }
  } else if ('string' == other.nodeName) {
    if ('%' == other.val)
      return new nodes.Unit(0, '%');
    var val = parseFloat(other.val);
    if (isNaN(val))
      Node.prototype.coerce.call(this, other);
    return new nodes.Unit(val);
  } else {
    return Node.prototype.coerce.call(this, other);
  }
};
