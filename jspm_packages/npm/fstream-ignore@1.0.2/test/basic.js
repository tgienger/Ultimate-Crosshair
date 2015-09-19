/* */ 
var IgnoreFile = require("../ignore");
var c = require("./common");
c.ignores({"a/.basic-ignore": ["b/", "aca"]});
var notAllowed = [/^\/a\/b\/.*/, /^\/a\/.*\/aca$/];
require("tap").test("basic ignore rules", function(t) {
  t.pass("start");
  IgnoreFile({
    path: __dirname + "/fixtures",
    ignoreFiles: [".basic-ignore"]
  }).on("ignoreFile", function(e) {
    console.error("ignore file!", e);
  }).on("child", function(e) {
    var p = e.path.substr(e.root.path.length);
    notAllowed.forEach(function(na) {
      t.dissimilar(p, na);
    });
  }).on("close", t.end.bind(t));
});
