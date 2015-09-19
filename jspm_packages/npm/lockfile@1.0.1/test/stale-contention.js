/* */ 
(function(process) {
  var fs = require("fs");
  var lockFile = require("../lockfile");
  var test = require("tap").test;
  var path = require("path");
  var lock = path.resolve(__dirname, 'stale.lock');
  var touch = require("touch");
  var spawn = require("child_process").spawn;
  var node = process.execPath;
  lockFile.filetime = 'mtime';
  if (process.argv[2] === 'child') {
    return child();
  }
  function child() {
    fs.stat = function(stat) {
      return function() {
        var args = [].slice.call(arguments);
        var cb = args.pop();
        stat.apply(fs, args.concat(function(er, st) {
          setTimeout(function() {
            cb(er, st);
          }, 100);
        }));
      };
    }(fs.stat);
    lockFile.lock(lock, {stale: 100000}, function(er) {
      if (er && er.code !== 'EEXIST')
        throw er;
      else if (er)
        process.exit(17);
      else
        setTimeout(function() {}, 500);
    });
  }
  test('create stale file', function(t) {
    try {
      fs.unlinkSync(lock);
    } catch (er) {}
    touch.sync(lock, {time: '1979-07-01T19:10:00.000Z'});
    t.end();
  });
  test('contenders', function(t) {
    var n = 10;
    var fails = 0;
    var wins = 0;
    var args = [__filename, 'child'];
    var opt = {stdio: [0, "pipe", 2]};
    for (var i = 0; i < n; i++) {
      spawn(node, args, opt).on('close', then);
    }
    function then(code) {
      if (code === 17) {
        fails++;
      } else if (code) {
        t.fail("unexpected failure", code);
        fails++;
      } else {
        wins++;
      }
      if (fails + wins === n) {
        done();
      }
    }
    function done() {
      t.equal(wins, 1, "should have 1 lock winner");
      t.equal(fails, n - 1, "all others should lose");
      t.end();
    }
  });
  test('remove stale file', function(t) {
    try {
      fs.unlinkSync(lock);
    } catch (er) {}
    t.end();
  });
})(require("process"));
