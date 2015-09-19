/* */ 
var ArrayIndex = require("./index");
var inherits = require("util").inherits;
var assert = require("assert");
function Arrayish(length) {
  ArrayIndex.call(this, length);
  this.sets = Object.create(null);
}
inherits(Arrayish, ArrayIndex);
var a = new Arrayish(11);
assert.throws(function() {
  a[0];
}, /__get__/);
assert.throws(function() {
  a[0] = 0;
}, /__set__/);
Arrayish.prototype.__get__ = function get(index) {
  if (index in this.sets) {
    return +this.sets[index] * index;
  } else {
    return index;
  }
};
Arrayish.prototype.__set__ = function set(index, value) {
  this.sets[index] = value;
};
assert.equal(0, a[0]);
assert.equal(1, a[1]);
assert.equal(2, a[2]);
assert.equal(3, a[3]);
assert.equal(4, a[4]);
a[10] = 1;
assert.equal(10, a[10]);
a[10] = 2;
assert.equal(20, a[10]);
a[10] = 3;
assert.equal(30, a[10]);
assert.equal(11, a.length);
a[4] = 20;
a[6] = 5.55432;
var b = [0, 1, 2, 3, 80, 5, 33.325919999999996, 7, 8, 9, 30];
assert.equal(JSON.stringify(b), JSON.stringify(a));
