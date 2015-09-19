/* */ 
(function(Buffer) {
  'use strict';
  function objectToString(o) {
    return Object.prototype.toString.call(o);
  }
  var util = {
    isArray: function(ar) {
      return Array.isArray(ar) || (typeof ar === 'object' && objectToString(ar) === '[object Array]');
    },
    isDate: function(d) {
      return typeof d === 'object' && objectToString(d) === '[object Date]';
    },
    isRegExp: function(re) {
      return typeof re === 'object' && objectToString(re) === '[object RegExp]';
    },
    getRegExpFlags: function(re) {
      var flags = '';
      re.global && (flags += 'g');
      re.ignoreCase && (flags += 'i');
      re.multiline && (flags += 'm');
      return flags;
    }
  };
  if (typeof module === 'object')
    module.exports = clone;
  function clone(parent, circular, depth, prototype) {
    var allParents = [];
    var allChildren = [];
    var useBuffer = typeof Buffer != 'undefined';
    if (typeof circular == 'undefined')
      circular = true;
    if (typeof depth == 'undefined')
      depth = Infinity;
    function _clone(parent, depth) {
      if (parent === null)
        return null;
      if (depth == 0)
        return parent;
      var child;
      var proto;
      if (typeof parent != 'object') {
        return parent;
      }
      if (util.isArray(parent)) {
        child = [];
      } else if (util.isRegExp(parent)) {
        child = new RegExp(parent.source, util.getRegExpFlags(parent));
        if (parent.lastIndex)
          child.lastIndex = parent.lastIndex;
      } else if (util.isDate(parent)) {
        child = new Date(parent.getTime());
      } else if (useBuffer && Buffer.isBuffer(parent)) {
        child = new Buffer(parent.length);
        parent.copy(child);
        return child;
      } else {
        if (typeof prototype == 'undefined') {
          proto = Object.getPrototypeOf(parent);
          child = Object.create(proto);
        } else {
          child = Object.create(prototype);
          proto = prototype;
        }
      }
      if (circular) {
        var index = allParents.indexOf(parent);
        if (index != -1) {
          return allChildren[index];
        }
        allParents.push(parent);
        allChildren.push(child);
      }
      for (var i in parent) {
        var attrs;
        if (proto) {
          attrs = Object.getOwnPropertyDescriptor(proto, i);
        }
        if (attrs && attrs.set == null) {
          continue;
        }
        child[i] = _clone(parent[i], depth - 1);
      }
      return child;
    }
    return _clone(parent, depth);
  }
  clone.clonePrototype = function(parent) {
    if (parent === null)
      return null;
    var c = function() {};
    c.prototype = parent;
    return new c();
  };
})(require("buffer").Buffer);
