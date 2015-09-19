/* */ 
var IgnoreFile = require("../ignore");
var c = require("./common");
c.ignores({
  ".ignore": ["*", "a", "c", "!a/b/c/.abc", "!/c/b/a/cba"],
  "a/.ignore": ["!*", ".ignore"],
  "a/a/.ignore": ["*"],
  "a/b/.ignore": ["*", "!/c/.abc"],
  "a/c/.ignore": ["*"],
  "c/b/a/.ignore": ["!cba", "!.cba", "!/a{bc,cb}"]
});
var expected = ["/a", "/a/a", "/a/b", "/a/b/c", "/a/b/c/.abc", "/a/c", "/c", "/c/b", "/c/b/a", "/c/b/a/cba", "/c/b/a/.cba", "/c/b/a/abc", "/c/b/a/acb"];
require("tap").test("basic ignore rules", function(t) {
  t.pass("start");
  IgnoreFile({
    path: __dirname + "/fixtures",
    ignoreFiles: [".ignore"]
  }).on("child", function(e) {
    var p = e.path.substr(e.root.path.length);
    var i = expected.indexOf(p);
    if (i === -1) {
      console.log("not ok " + p);
      t.fail("unexpected file found", {found: p});
    } else {
      t.pass(p);
      expected.splice(i, 1);
    }
  }).on("close", function() {
    t.deepEqual(expected, [], "all expected files should be seen");
    t.end();
  });
});
