/* */ 
module.exports = Entry;
var TarHeader = require("./header"),
    tar = require("../tar"),
    assert = require("assert").ok,
    Stream = require("stream").Stream,
    inherits = require("inherits"),
    fstream = require("fstream").Abstract;
function Entry(header, extended, global) {
  Stream.call(this);
  this.readable = true;
  this.writable = true;
  this._needDrain = false;
  this._paused = false;
  this._reading = false;
  this._ending = false;
  this._ended = false;
  this._remaining = 0;
  this._abort = false;
  this._queue = [];
  this._index = 0;
  this._queueLen = 0;
  this._read = this._read.bind(this);
  this.props = {};
  this._header = header;
  this._extended = extended || {};
  this._global = {};
  var me = this;
  Object.keys(global || {}).forEach(function(g) {
    me._global[g] = global[g];
  });
  this._setProps();
}
inherits(Entry, Stream);
Entry.prototype.write = function(c) {
  if (this._ending)
    this.error("write() after end()", null, true);
  if (this._remaining === 0) {
    this.error("invalid bytes past eof");
  }
  if (c.length > this._remaining) {
    c = c.slice(0, this._remaining);
  }
  this._remaining -= c.length;
  var ql = this._queueLen;
  this._queue.push(c);
  this._queueLen++;
  this._read();
  if (this._paused || ql > 0) {
    this._needDrain = true;
    return false;
  }
  return true;
};
Entry.prototype.end = function(c) {
  if (c)
    this.write(c);
  this._ending = true;
  this._read();
};
Entry.prototype.pause = function() {
  this._paused = true;
  this.emit("pause");
};
Entry.prototype.resume = function() {
  this.emit("resume");
  this._paused = false;
  this._read();
  return this._queueLen - this._index > 1;
};
Entry.prototype._read = function() {
  if (this._paused || this._reading || this._ended)
    return;
  this._reading = true;
  while (this._index < this._queueLen && !this._paused) {
    var chunk = this._queue[this._index++];
    this.emit("data", chunk);
  }
  if (this._index >= this._queueLen) {
    this._queue.length = this._queueLen = this._index = 0;
    if (this._needDrain) {
      this._needDrain = false;
      this.emit("drain");
    }
    if (this._ending) {
      this._ended = true;
      this.emit("end");
    }
  }
  var mql = this._maxQueueLen;
  if (this._queueLen > mql && this._index > 0) {
    mql = Math.min(this._index, mql);
    this._index -= mql;
    this._queueLen -= mql;
    this._queue = this._queue.slice(mql);
  }
  this._reading = false;
};
Entry.prototype._setProps = function() {
  var header = this._header,
      extended = this._extended,
      global = this._global,
      props = this.props;
  var fields = tar.fields;
  for (var f = 0; fields[f] !== null; f++) {
    var field = fields[f],
        val = header[field];
    if (typeof val !== "undefined")
      props[field] = val;
  }
  ;
  [global, extended].forEach(function(p) {
    Object.keys(p).forEach(function(f) {
      if (typeof p[f] !== "undefined")
        props[f] = p[f];
    });
  });
  ;
  ["path", "linkpath"].forEach(function(p) {
    if (props.hasOwnProperty(p)) {
      props[p] = props[p].split("\0")[0];
    }
  });
  ;
  ["mtime", "ctime", "atime"].forEach(function(p) {
    if (props.hasOwnProperty(p)) {
      props[p] = new Date(props[p] * 1000);
    }
  });
  var type;
  switch (tar.types[props.type]) {
    case "OldFile":
    case "ContiguousFile":
      type = "File";
      break;
    case "GNUDumpDir":
      type = "Directory";
      break;
    case undefined:
      type = "Unknown";
      break;
    case "Link":
    case "SymbolicLink":
    case "CharacterDevice":
    case "BlockDevice":
    case "Directory":
    case "FIFO":
    default:
      type = tar.types[props.type];
  }
  this.type = type;
  this.path = props.path;
  this.size = props.size;
  this._remaining = props.size;
};
Entry.prototype.abort = function() {
  this._abort = true;
};
Entry.prototype.warn = fstream.warn;
Entry.prototype.error = fstream.error;
