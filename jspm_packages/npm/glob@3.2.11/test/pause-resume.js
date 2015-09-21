/* */ 
(function(process) {
  var tap = require("tap"),
      child_process = require("child_process"),
      pattern = "test/a/!(symlink)/**",
      bashResults = require("./bash-results.json!systemjs-json"),
      patterns = Object.keys(bashResults),
      glob = require("../glob"),
      Glob = glob.Glob,
      path = require("path");
  process.chdir(path.resolve(__dirname, ".."));
  function alphasort(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    return a > b ? 1 : a < b ? -1 : 0;
  }
  function cleanResults(m) {
    return m.map(function(m) {
      return m.replace(/\/+/g, "/").replace(/\/$/, "");
    }).sort(alphasort).reduce(function(set, f) {
      if (f !== set[set.length - 1])
        set.push(f);
      return set;
    }, []).sort(alphasort).map(function(f) {
      return (process.platform !== 'win32') ? f : f.replace(/^[a-zA-Z]:\\\\/, '/').replace(/\\/g, '/');
    });
  }
  var globResults = [];
  tap.test("use a Glob object, and pause/resume it", function(t) {
    var g = new Glob(pattern),
        paused = false,
        res = [],
        expect = bashResults[pattern];
    g.on("pause", function() {
      console.error("pause");
    });
    g.on("resume", function() {
      console.error("resume");
    });
    g.on("match", function(m) {
      t.notOk(g.paused, "must not be paused");
      globResults.push(m);
      g.pause();
      t.ok(g.paused, "must be paused");
      setTimeout(g.resume.bind(g), 10);
    });
    g.on("end", function(matches) {
      t.pass("reached glob end");
      globResults = cleanResults(globResults);
      matches = cleanResults(matches);
      t.deepEqual(matches, globResults, "end event matches should be the same as match events");
      t.deepEqual(matches, expect, "glob matches should be the same as bash results");
      t.end();
    });
  });
})(require("process"));
