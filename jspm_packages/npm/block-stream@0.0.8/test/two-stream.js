/* */ 
(function(Buffer) {
  var log = console.log,
      assert = require("assert"),
      BlockStream = require("../block-stream"),
      isize = 0,
      tsize = 0,
      fsize = 0,
      psize = 0,
      i = 0,
      filter = null,
      paper = null,
      stack = null,
      tsize = 1 * 1024;
  stack = new Buffer(tsize);
  for (; i < tsize; i++)
    stack[i] = "x".charCodeAt(0);
  isize = 1 * 1024;
  fsize = 2 * 1024;
  psize = Math.ceil(isize / 6);
  fexpected = Math.ceil(tsize / fsize);
  pexpected = Math.ceil(tsize / psize);
  filter = new BlockStream(fsize, {nopad: true});
  paper = new BlockStream(psize, {nopad: true});
  var fcounter = 0;
  filter.on('data', function(c) {
    for (var i = 0; i < c.length; i++) {
      assert.strictEqual(c[i], "x".charCodeAt(0));
    }
    ++fcounter;
  });
  var pcounter = 0;
  paper.on('data', function(c) {
    for (var i = 0; i < c.length; i++) {
      assert.strictEqual(c[i], "x".charCodeAt(0));
    }
    ++pcounter;
  });
  filter.pipe(paper);
  filter.on('end', function() {
    log("fcounter: %s === %s", fcounter, fexpected);
    assert.strictEqual(fcounter, fexpected);
  });
  paper.on('end', function() {
    log("pcounter: %s === %s", pcounter, pexpected);
    assert.strictEqual(pcounter, pexpected);
  });
  for (i = 0, j = isize; j <= tsize; j += isize) {
    filter.write(stack.slice(j - isize, j));
  }
  filter.end();
})(require("buffer").Buffer);
