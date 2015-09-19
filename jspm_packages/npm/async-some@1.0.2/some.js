/* */ 
var assert = require("assert");
var dezalgoify = require("dezalgo");
module.exports = some;
function some(list, test, cb) {
  assert("length" in list, "array must be arraylike");
  assert.equal(typeof test, "function", "predicate must be callable");
  assert.equal(typeof cb, "function", "callback must be callable");
  var array = slice(list),
      index = 0,
      length = array.length,
      hecomes = dezalgoify(cb);
  map();
  function map() {
    if (index >= length)
      return hecomes(null, false);
    test(array[index], reduce);
  }
  function reduce(er, result) {
    if (er)
      return hecomes(er, false);
    if (result)
      return hecomes(null, result);
    index++;
    map();
  }
}
function slice(args) {
  var l = args.length,
      a = [],
      i;
  for (i = 0; i < l; i++)
    a[i] = args[i];
  return a;
}
