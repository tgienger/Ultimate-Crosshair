/* */ 
(function(Buffer) {
  module.exports = ExtendedHeader;
  var Entry = require("./entry"),
      inherits = require("inherits"),
      tar = require("../tar"),
      numeric = tar.numeric,
      keyTrans = {
        "SCHILY.dev": "dev",
        "SCHILY.ino": "ino",
        "SCHILY.nlink": "nlink"
      };
  function ExtendedHeader() {
    Entry.apply(this, arguments);
    this.on("data", this._parse);
    this.fields = {};
    this._position = 0;
    this._fieldPos = 0;
    this._state = SIZE;
    this._sizeBuf = [];
    this._keyBuf = [];
    this._valBuf = [];
    this._size = -1;
    this._key = "";
  }
  inherits(ExtendedHeader, Entry);
  ExtendedHeader.prototype._parse = parse;
  var s = 0,
      states = ExtendedHeader.states = {},
      SIZE = states.SIZE = s++,
      KEY = states.KEY = s++,
      VAL = states.VAL = s++,
      ERR = states.ERR = s++;
  Object.keys(states).forEach(function(s) {
    states[states[s]] = states[s];
  });
  states[s] = null;
  var _0 = "0".charCodeAt(0),
      _9 = "9".charCodeAt(0),
      point = ".".charCodeAt(0),
      a = "a".charCodeAt(0),
      Z = "Z".charCodeAt(0),
      a = "a".charCodeAt(0),
      z = "z".charCodeAt(0),
      space = " ".charCodeAt(0),
      eq = "=".charCodeAt(0),
      cr = "\n".charCodeAt(0);
  function parse(c) {
    if (this._state === ERR)
      return;
    for (var i = 0,
        l = c.length; i < l; this._position++, this._fieldPos++, i++) {
      var b = c[i];
      if (this._size >= 0 && this._fieldPos > this._size) {
        error(this, "field exceeds length=" + this._size);
        return;
      }
      switch (this._state) {
        case ERR:
          return;
        case SIZE:
          if (b === space) {
            this._state = KEY;
            this._size = parseInt(new Buffer(this._sizeBuf).toString(), 10);
            this._sizeBuf.length = 0;
            continue;
          }
          if (b < _0 || b > _9) {
            error(this, "expected [" + _0 + ".." + _9 + "], got " + b);
            return;
          }
          this._sizeBuf.push(b);
          continue;
        case KEY:
          if (b === eq) {
            this._state = VAL;
            this._key = new Buffer(this._keyBuf).toString();
            if (keyTrans[this._key])
              this._key = keyTrans[this._key];
            this._keyBuf.length = 0;
            continue;
          }
          this._keyBuf.push(b);
          continue;
        case VAL:
          if (this._fieldPos === this._size - 1) {
            if (b !== cr) {
              error(this, "expected \\n at end of field");
              return;
            }
            var val = new Buffer(this._valBuf).toString();
            if (numeric[this._key]) {
              val = parseFloat(val);
            }
            this.fields[this._key] = val;
            this._valBuf.length = 0;
            this._state = SIZE;
            this._size = -1;
            this._fieldPos = -1;
            continue;
          }
          this._valBuf.push(b);
          continue;
      }
    }
  }
  function error(me, msg) {
    msg = "invalid header: " + msg + "\nposition=" + me._position + "\nfield position=" + me._fieldPos;
    me.error(msg);
    me.state = ERR;
  }
})(require("buffer").Buffer);
