/* */ 
var crypto = require("crypto"),
    nodes = require("../nodes/index");
var MemoryCache = module.exports = function(options) {
  options = options || {};
  this.limit = options['cache limit'] || 256;
  this._cache = {};
  this.length = 0;
  this.head = this.tail = null;
};
MemoryCache.prototype.set = function(key, value) {
  var clone = value.clone(),
      item;
  clone.filename = nodes.filename;
  clone.lineno = nodes.lineno;
  clone.column = nodes.column;
  item = {
    key: key,
    value: clone
  };
  this._cache[key] = item;
  if (this.tail) {
    this.tail.next = item;
    item.prev = this.tail;
  } else {
    this.head = item;
  }
  this.tail = item;
  if (this.length++ == this.limit)
    this.purge();
};
MemoryCache.prototype.get = function(key) {
  var item = this._cache[key],
      val = item.value.clone();
  if (item == this.tail)
    return val;
  if (item.next) {
    if (item == this.head)
      this.head = item.next;
    item.next.prev = item.prev;
  }
  if (item.prev)
    item.prev.next = item.next;
  item.next = null;
  item.prev = this.tail;
  if (this.tail)
    this.tail.next = item;
  this.tail = item;
  return val;
};
MemoryCache.prototype.has = function(key) {
  return !!this._cache[key];
};
MemoryCache.prototype.key = function(str, options) {
  var hash = crypto.createHash('sha1');
  hash.update(str + options.prefix);
  return hash.digest('hex');
};
MemoryCache.prototype.purge = function() {
  var item = this.head;
  if (this.head.next) {
    this.head = this.head.next;
    this.head.prev = null;
  }
  this._cache[item.key] = item.prev = item.next = null;
  this.length--;
};
