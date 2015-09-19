/* */ 
(function(Buffer) {
  module.exports = BufferEntry;
  var inherits = require("inherits"),
      Entry = require("./entry");
  function BufferEntry() {
    Entry.apply(this, arguments);
    this._buffer = new Buffer(this.props.size);
    this._offset = 0;
    this.body = "";
    this.on("end", function() {
      this.body = this._buffer.toString().slice(0, -1);
    });
  }
  inherits(BufferEntry, Entry);
  BufferEntry.prototype.write = function(c) {
    c.copy(this._buffer, this._offset);
    this._offset += c.length;
    Entry.prototype.write.call(this, c);
  };
})(require("buffer").Buffer);
