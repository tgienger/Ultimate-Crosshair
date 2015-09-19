/* */ 
var P = require("../fstream-npm");
P({path: './'}).on('package', function(p) {
  console.error('package', p);
}).on('ignoreFile', function(e) {
  console.error('ignoreFile', e);
}).on('entry', function(e) {
  console.error(e.constructor.name, e.path.substr(e.root.dirname.length + 1));
});
