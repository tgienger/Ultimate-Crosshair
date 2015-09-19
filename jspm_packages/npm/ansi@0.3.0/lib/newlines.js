/* */ 
(function(process) {
  var assert = require("assert");
  var NEWLINE = '\n'.charCodeAt(0);
  function emitNewlineEvents(stream) {
    if (stream._emittingNewlines) {
      return;
    }
    var write = stream.write;
    stream.write = function(data) {
      var rtn = write.apply(stream, arguments);
      if (stream.listeners('newline').length > 0) {
        var len = data.length,
            i = 0;
        if (typeof data == 'string') {
          for (; i < len; i++) {
            processByte(stream, data.charCodeAt(i));
          }
        } else {
          for (; i < len; i++) {
            processByte(stream, data[i]);
          }
        }
      }
      return rtn;
    };
    stream._emittingNewlines = true;
  }
  module.exports = emitNewlineEvents;
  function processByte(stream, b) {
    assert.equal(typeof b, 'number');
    if (b === NEWLINE) {
      stream.emit('newline');
    }
  }
})(require("process"));
