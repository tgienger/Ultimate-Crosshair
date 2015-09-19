/* */ 
(function(Buffer, process) {
  module.exports = BlockStream;
  var Stream = require("stream").Stream,
      inherits = require("inherits"),
      assert = require("assert").ok,
      debug = process.env.DEBUG ? console.error : function() {};
  function BlockStream(size, opt) {
    this.writable = this.readable = true;
    this._opt = opt || {};
    this._chunkSize = size || 512;
    this._offset = 0;
    this._buffer = [];
    this._bufferLength = 0;
    if (this._opt.nopad)
      this._zeroes = false;
    else {
      this._zeroes = new Buffer(this._chunkSize);
      for (var i = 0; i < this._chunkSize; i++) {
        this._zeroes[i] = 0;
      }
    }
  }
  inherits(BlockStream, Stream);
  BlockStream.prototype.write = function(c) {
    if (this._ended)
      throw new Error("BlockStream: write after end");
    if (c && !Buffer.isBuffer(c))
      c = new Buffer(c + "");
    if (c.length) {
      this._buffer.push(c);
      this._bufferLength += c.length;
    }
    if (this._bufferLength >= this._chunkSize) {
      if (this._paused) {
        this._needDrain = true;
        return false;
      }
      this._emitChunk();
    }
    return true;
  };
  BlockStream.prototype.pause = function() {
    this._paused = true;
  };
  BlockStream.prototype.resume = function() {
    this._paused = false;
    return this._emitChunk();
  };
  BlockStream.prototype.end = function(chunk) {
    if (typeof chunk === "function")
      cb = chunk, chunk = null;
    if (chunk)
      this.write(chunk);
    this._ended = true;
    this.flush();
  };
  BlockStream.prototype.flush = function() {
    this._emitChunk(true);
  };
  BlockStream.prototype._emitChunk = function(flush) {
    if (flush && this._zeroes) {
      var padBytes = (this._bufferLength % this._chunkSize);
      if (padBytes !== 0)
        padBytes = this._chunkSize - padBytes;
      if (padBytes > 0) {
        this._buffer.push(this._zeroes.slice(0, padBytes));
        this._bufferLength += padBytes;
      }
    }
    if (this._emitting || this._paused)
      return;
    this._emitting = true;
    var bufferIndex = 0;
    while (this._bufferLength >= this._chunkSize && (flush || !this._paused)) {
      var out,
          outOffset = 0,
          outHas = this._chunkSize;
      while (outHas > 0 && (flush || !this._paused)) {
        var cur = this._buffer[bufferIndex],
            curHas = cur.length - this._offset;
        if (out || curHas < outHas) {
          out = out || new Buffer(this._chunkSize);
          cur.copy(out, outOffset, this._offset, this._offset + Math.min(curHas, outHas));
        } else if (cur.length === outHas && this._offset === 0) {
          out = cur;
        } else {
          out = cur.slice(this._offset, this._offset + outHas);
        }
        if (curHas > outHas) {
          this._offset += outHas;
          outHas = 0;
        } else {
          outHas -= curHas;
          outOffset += curHas;
          bufferIndex++;
          this._offset = 0;
        }
      }
      this._bufferLength -= this._chunkSize;
      assert(out.length === this._chunkSize);
      this.emit("data", out);
      out = null;
    }
    this._buffer = this._buffer.slice(bufferIndex);
    if (this._paused) {
      this._needsDrain = true;
      this._emitting = false;
      return;
    }
    var l = this._buffer.length;
    if (flush && !this._zeroes && l) {
      if (l === 1) {
        if (this._offset) {
          this.emit("data", this._buffer[0].slice(this._offset));
        } else {
          this.emit("data", this._buffer[0]);
        }
      } else {
        var outHas = this._bufferLength,
            out = new Buffer(outHas),
            outOffset = 0;
        for (var i = 0; i < l; i++) {
          var cur = this._buffer[i],
              curHas = cur.length - this._offset;
          cur.copy(out, outOffset, this._offset);
          this._offset = 0;
          outOffset += curHas;
          this._bufferLength -= curHas;
        }
        this.emit("data", out);
      }
      this._buffer.length = 0;
      this._bufferLength = 0;
      this._offset = 0;
    }
    if (this._needDrain) {
      this._needDrain = false;
      this.emit("drain");
    }
    if ((this._bufferLength === 0) && this._ended && !this._endEmitted) {
      this._endEmitted = true;
      this.emit("end");
    }
    this._emitting = false;
  };
})(require("buffer").Buffer, require("process"));
