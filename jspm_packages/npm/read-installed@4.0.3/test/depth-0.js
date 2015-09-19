/* */ 
var readInstalled = require("../read-installed");
var test = require("tap").test;
var json = require("../package.json!systemjs-json");
var path = require("path");
var known = [].concat(Object.keys(json.dependencies), Object.keys(json.optionalDependencies), Object.keys(json.devDependencies)).sort();
test("make sure that it works with depth=0", function(t) {
  readInstalled(path.join(__dirname, "../"), {depth: 0}, function(er, map) {
    t.notOk(er, "er should be bull");
    t.ok(map, "map should be data");
    if (er)
      return console.error(er.stack || er.message);
    delete map.dependencies[json.name];
    var subdeps = Object.keys(map.dependencies).reduce(function(acc, dep) {
      delete map.dependencies[dep].dependencies[dep];
      acc += Object.keys(map.dependencies[dep].dependencies).length;
      return acc;
    }, 0);
    t.equal(subdeps, 0, "there should be no sub dependencies");
    t.end();
  });
});
