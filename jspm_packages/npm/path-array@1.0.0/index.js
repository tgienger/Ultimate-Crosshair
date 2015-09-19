/* */ 
(function(process) {
  var inherits = require("util").inherits;
  var delimiter = require("path").delimiter || ':';
  var ArrayIndex = require("array-index");
  module.exports = PathArray;
  function PathArray(env, property) {
    if (!(this instanceof PathArray))
      return new PathArray(env);
    ArrayIndex.call(this);
    this.property = property || 'PATH';
    Object.defineProperty(this, 'length', {get: this._getLength});
    Object.defineProperty(this, '_env', {
      value: env || process.env,
      writable: true,
      enumerable: false,
      configurable: true
    });
    void(this.length);
  }
  inherits(PathArray, ArrayIndex);
  PathArray.prototype._array = function() {
    var path = this._env[this.property];
    if (!path)
      return [];
    return path.split(delimiter);
  };
  PathArray.prototype._setArray = function(arr) {
    this._env[this.property] = arr.join(delimiter);
  };
  PathArray.prototype._getLength = function() {
    var length = this._array().length;
    this.length = length;
    return length;
  };
  PathArray.prototype.__get__ = function get(index) {
    return this._array()[index];
  };
  PathArray.prototype.__set__ = function set(index, value) {
    var arr = this._array();
    arr[index] = value;
    this._setArray(arr);
    return value;
  };
  PathArray.prototype.toString = function toString() {
    return this._env[this.property] || '';
  };
  Object.getOwnPropertyNames(Array.prototype).forEach(function(name) {
    if ('constructor' == name)
      return;
    if ('function' != typeof Array.prototype[name])
      return;
    if (/to(Locale)?String/.test(name))
      return;
    PathArray.prototype[name] = function() {
      var arr = this._array();
      var rtn = arr[name].apply(arr, arguments);
      this._setArray(arr);
      return rtn;
    };
  });
})(require("process"));
