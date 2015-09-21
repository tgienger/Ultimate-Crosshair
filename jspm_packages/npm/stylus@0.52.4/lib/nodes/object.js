/* */ 
var Node = require("./node"),
    nodes = require("./index"),
    nativeObj = {}.constructor;
var Object = module.exports = function Object() {
  Node.call(this);
  this.vals = {};
};
Object.prototype.__proto__ = Node.prototype;
Object.prototype.set = function(key, val) {
  this.vals[key] = val;
  return this;
};
Object.prototype.__defineGetter__('length', function() {
  return nativeObj.keys(this.vals).length;
});
Object.prototype.get = function(key) {
  return this.vals[key] || nodes.null;
};
Object.prototype.has = function(key) {
  return key in this.vals;
};
Object.prototype.operate = function(op, right) {
  switch (op) {
    case '.':
    case '[]':
      return this.get(right.hash);
    case '==':
      var vals = this.vals,
          a,
          b;
      if ('object' != right.nodeName || this.length != right.length)
        return nodes.false;
      for (var key in vals) {
        a = vals[key];
        b = right.vals[key];
        if (a.operate(op, b).isFalse)
          return nodes.false;
      }
      return nodes.true;
    case '!=':
      return this.operate('==', right).negate();
    default:
      return Node.prototype.operate.call(this, op, right);
  }
};
Object.prototype.toBoolean = function() {
  return nodes.Boolean(this.length);
};
Object.prototype.toBlock = function() {
  var str = '{',
      key,
      val;
  for (key in this.vals) {
    val = this.get(key);
    if ('object' == val.first.nodeName) {
      str += key + ' ' + val.first.toBlock();
    } else {
      switch (key) {
        case '@charset':
          str += key + ' ' + val.first.toString() + ';';
          break;
        default:
          str += key + ':' + toString(val) + ';';
      }
    }
  }
  str += '}';
  return str;
  function toString(node) {
    if (node.nodes) {
      return node.nodes.map(toString).join(node.isList ? ',' : ' ');
    } else if ('literal' == node.nodeName && ',' == node.val) {
      return '\\,';
    }
    return node.toString();
  }
};
Object.prototype.clone = function(parent) {
  var clone = new Object;
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  for (var key in this.vals) {
    clone.vals[key] = this.vals[key].clone(parent, clone);
  }
  return clone;
};
Object.prototype.toJSON = function() {
  return {
    __type: 'Object',
    vals: this.vals,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
Object.prototype.toString = function() {
  var obj = {};
  for (var prop in this.vals) {
    obj[prop] = this.vals[prop].toString();
  }
  return JSON.stringify(obj);
};
