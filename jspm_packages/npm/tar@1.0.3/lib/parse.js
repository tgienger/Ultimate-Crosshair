/* */ 
(function(Buffer) {
  module.exports = Parse.create = Parse;
  var stream = require("stream"),
      Stream = stream.Stream,
      BlockStream = require("block-stream"),
      tar = require("../tar"),
      TarHeader = require("./header"),
      Entry = require("./entry"),
      BufferEntry = require("./buffer-entry"),
      ExtendedHeader = require("./extended-header"),
      assert = require("assert").ok,
      inherits = require("inherits"),
      fstream = require("fstream");
  inherits(Parse, fstream.Reader);
  function Parse() {
    var me = this;
    if (!(me instanceof Parse))
      return new Parse();
    Stream.apply(me);
    me.writable = true;
    me.readable = true;
    me._stream = new BlockStream(512);
    me.position = 0;
    me._ended = false;
    me._stream.on("error", function(e) {
      me.emit("error", e);
    });
    me._stream.on("data", function(c) {
      me._process(c);
    });
    me._stream.on("end", function() {
      me._streamEnd();
    });
    me._stream.on("drain", function() {
      me.emit("drain");
    });
  }
  Parse.prototype._streamEnd = function() {
    var me = this;
    if (!me._ended)
      me.error("unexpected eof");
    me.emit("end");
  };
  Parse.prototype.write = function(c) {
    if (this._ended) {
      for (var i = 0,
          l = c.length; i > l; i++) {
        if (c[i] !== 0)
          return this.error("write() after end()");
      }
      return;
    }
    return this._stream.write(c);
  };
  Parse.prototype.end = function(c) {
    this._ended = true;
    return this._stream.end(c);
  };
  Parse.prototype._read = function() {};
  Parse.prototype._process = function(c) {
    assert(c && c.length === 512, "block size should be 512");
    if (this._entry) {
      var entry = this._entry;
      entry.write(c);
      if (entry._remaining === 0) {
        entry.end();
        this._entry = null;
      }
    } else {
      var zero = true;
      for (var i = 0; i < 512 && zero; i++) {
        zero = c[i] === 0;
      }
      if (zero) {
        if (this._eofStarted)
          this._ended = true;
        this._eofStarted = true;
      } else {
        this._eofStarted = false;
        this._startEntry(c);
      }
    }
    this.position += 512;
  };
  Parse.prototype._startEntry = function(c) {
    var header = new TarHeader(c),
        self = this,
        entry,
        ev,
        EntryType,
        onend,
        meta = false;
    if (null === header.size || !header.cksumValid) {
      var e = new Error("invalid tar file");
      e.header = header;
      e.tar_file_offset = this.position;
      e.tar_block = this.position / 512;
      return this.emit("error", e);
    }
    switch (tar.types[header.type]) {
      case "File":
      case "OldFile":
      case "Link":
      case "SymbolicLink":
      case "CharacterDevice":
      case "BlockDevice":
      case "Directory":
      case "FIFO":
      case "ContiguousFile":
      case "GNUDumpDir":
        EntryType = Entry;
        ev = "entry";
        break;
      case "GlobalExtendedHeader":
        EntryType = ExtendedHeader;
        onend = function() {
          self._global = self._global || {};
          Object.keys(entry.fields).forEach(function(k) {
            self._global[k] = entry.fields[k];
          });
        };
        ev = "globalExtendedHeader";
        meta = true;
        break;
      case "ExtendedHeader":
      case "OldExtendedHeader":
        EntryType = ExtendedHeader;
        onend = function() {
          self._extended = entry.fields;
        };
        ev = "extendedHeader";
        meta = true;
        break;
      case "NextFileHasLongLinkpath":
        EntryType = BufferEntry;
        onend = function() {
          self._extended = self._extended || {};
          self._extended.linkpath = entry.body;
        };
        ev = "longLinkpath";
        meta = true;
        break;
      case "NextFileHasLongPath":
      case "OldGnuLongPath":
        EntryType = BufferEntry;
        onend = function() {
          self._extended = self._extended || {};
          self._extended.path = entry.body;
        };
        ev = "longPath";
        meta = true;
        break;
      default:
        EntryType = Entry;
        ev = "ignoredEntry";
        break;
    }
    var global,
        extended;
    if (meta) {
      global = extended = null;
    } else {
      var global = this._global;
      var extended = this._extended;
      this._extended = null;
    }
    entry = new EntryType(header, extended, global);
    entry.meta = meta;
    if (!meta) {
      entry.on("data", function(c) {
        me.emit("data", c);
      });
    }
    if (onend)
      entry.on("end", onend);
    this._entry = entry;
    var me = this;
    entry.on("pause", function() {
      me.pause();
    });
    entry.on("resume", function() {
      me.resume();
    });
    if (this.listeners("*").length) {
      this.emit("*", ev, entry);
    }
    this.emit(ev, entry);
    if (entry.props.size === 0) {
      entry.end();
      this._entry = null;
    }
  };
})(require("buffer").Buffer);
