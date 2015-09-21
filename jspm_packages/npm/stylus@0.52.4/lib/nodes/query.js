/* */ 
var Node = require("./node");
var Query = module.exports = function Query() {
  Node.call(this);
  this.nodes = [];
  this.type = '';
  this.predicate = '';
};
Query.prototype.__proto__ = Node.prototype;
Query.prototype.clone = function(parent) {
  var clone = new Query;
  clone.predicate = this.predicate;
  clone.type = this.type;
  for (var i = 0,
      len = this.nodes.length; i < len; ++i) {
    clone.push(this.nodes[i].clone(parent, clone));
  }
  clone.lineno = this.lineno;
  clone.column = this.column;
  clone.filename = this.filename;
  return clone;
};
Query.prototype.push = function(feature) {
  this.nodes.push(feature);
};
Query.prototype.__defineGetter__('resolvedType', function() {
  if (this.type) {
    return this.type.nodeName ? this.type.string : this.type;
  }
});
Query.prototype.__defineGetter__('resolvedPredicate', function() {
  if (this.predicate) {
    return this.predicate.nodeName ? this.predicate.string : this.predicate;
  }
});
Query.prototype.merge = function(other) {
  var query = new Query,
      p1 = this.resolvedPredicate,
      p2 = other.resolvedPredicate,
      t1 = this.resolvedType,
      t2 = other.resolvedType,
      type,
      pred;
  t1 = t1 || t2;
  t2 = t2 || t1;
  if (('not' == p1) ^ ('not' == p2)) {
    if (t1 == t2)
      return;
    type = ('not' == p1) ? t2 : t1;
    pred = ('not' == p1) ? p2 : p1;
  } else if (('not' == p1) && ('not' == p2)) {
    if (t1 != t2)
      return;
    type = t1;
    pred = 'not';
  } else if (t1 != t2) {
    return;
  } else {
    type = t1;
    pred = p1 || p2;
  }
  query.predicate = pred;
  query.type = type;
  query.nodes = this.nodes.concat(other.nodes);
  return query;
};
Query.prototype.toString = function() {
  var pred = this.predicate ? this.predicate + ' ' : '',
      type = this.type || '',
      len = this.nodes.length,
      str = pred + type;
  if (len) {
    str += (type && ' and ') + this.nodes.map(function(expr) {
      return expr.toString();
    }).join(' and ');
  }
  return str;
};
Query.prototype.toJSON = function() {
  return {
    __type: 'Query',
    predicate: this.predicate,
    type: this.type,
    nodes: this.nodes,
    lineno: this.lineno,
    column: this.column,
    filename: this.filename
  };
};
