/* */ 
var test = require("tap").test;
var writeStream = require("../index");
var fs = require("fs");
var path = require("path");
test('basic', function(t) {
  var target = path.resolve(__dirname, 'test.txt');
  var n = 10;
  var streams = [];
  for (var i = 0; i < n; i++) {
    var s = writeStream(target);
    s.on('finish', verifier('finish'));
    s.on('close', verifier('close'));
    streams.push(s);
  }
  var verifierCalled = 0;
  function verifier(ev) {
    return function() {
      if (ev === 'close')
        t.equal(this.__emittedFinish, true);
      else {
        this.__emittedFinish = true;
        t.equal(ev, 'finish');
      }
      var res = fs.readFileSync(target, 'utf8');
      var lines = res.trim().split(/\n/);
      lines.forEach(function(line) {
        var first = lines[0].match(/\d+$/)[0];
        var cur = line.match(/\d+$/)[0];
        t.equal(cur, first);
      });
      var resExpr = /^first write \d+\nsecond write \d+\nthird write \d+\nfinal write \d+\n$/;
      t.similar(res, resExpr);
      if (++verifierCalled === n * 2) {
        t.end();
      }
    };
  }
  streams.forEach(function(stream, i) {
    stream.write('first write ' + i + '\n');
  });
  setTimeout(function() {
    fs.writeFileSync(target, 'brutality!\n');
    streams.forEach(function(stream, i) {
      stream.write('second write ' + i + '\n');
    });
    setTimeout(function() {
      fs.unlinkSync(target);
      streams.forEach(function(stream, i) {
        stream.write('third write ' + i + '\n');
      });
      setTimeout(function() {
        fs.writeFileSync(target, 'brutality TWO!\n');
        streams.forEach(function(stream, i) {
          stream.end('final write ' + i + '\n');
        });
      }, 50);
    }, 50);
  }, 50);
});
test('cleanup', function(t) {
  fs.readdirSync(__dirname).filter(function(f) {
    return f.match(/^test.txt/);
  }).forEach(function(file) {
    fs.unlinkSync(path.resolve(__dirname, file));
  });
  t.end();
});
