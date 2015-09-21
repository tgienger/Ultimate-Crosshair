/* */ 
(function(process) {
  var tap = require("tap"),
      child_process = require("child_process"),
      bashResults = require("./bash-results.json!systemjs-json"),
      globs = Object.keys(bashResults),
      glob = require("../glob"),
      path = require("path");
  process.chdir(path.resolve(__dirname, ".."));
  function alphasort(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    return a > b ? 1 : a < b ? -1 : 0;
  }
  globs.forEach(function(pattern) {
    var expect = bashResults[pattern];
    if (process.platform === "win32" && expect.some(function(m) {
      return /\/symlink\//.test(m);
    }))
      return;
    tap.test(pattern, function(t) {
      glob(pattern, function(er, matches) {
        if (er)
          throw er;
        matches = cleanResults(matches);
        t.deepEqual(matches, expect, pattern);
        t.end();
      });
    });
    tap.test(pattern + " sync", function(t) {
      var matches = cleanResults(glob.sync(pattern));
      t.deepEqual(matches, expect, "should match shell");
      t.end();
    });
  });
  function cleanResults(m) {
    return m.map(function(m) {
      return m.replace(/\/+/g, "/").replace(/\/$/, "");
    }).sort(alphasort).reduce(function(set, f) {
      if (f !== set[set.length - 1])
        set.push(f);
      return set;
    }, []).sort(alphasort).map(function(f) {
      return (process.platform !== 'win32') ? f : f.replace(/^[a-zA-Z]:[\/\\]+/, '/').replace(/[\\\/]+/g, '/');
    });
  }
})(require("process"));
