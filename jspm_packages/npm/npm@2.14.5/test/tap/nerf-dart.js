/* */ 
var test = require("tap").test;
var toNerfDart = require("../../lib/config/nerf-dart");
function validNerfDart(uri, valid) {
  if (!valid)
    valid = "//registry.npmjs.org/";
  test(uri, function(t) {
    t.equal(toNerfDart(uri), valid);
    t.end();
  });
}
validNerfDart("http://registry.npmjs.org");
validNerfDart("http://registry.npmjs.org/some-package");
validNerfDart("http://registry.npmjs.org/some-package?write=true");
validNerfDart("http://user:pass@registry.npmjs.org/some-package?write=true");
validNerfDart("http://registry.npmjs.org/#random-hash");
validNerfDart("http://registry.npmjs.org/some-package#random-hash");
validNerfDart("http://relative.couchapp.npm/design/-/rewrite/", "//relative.couchapp.npm/design/-/rewrite/");
validNerfDart("http://relative.couchapp.npm:8080/design/-/rewrite/", "//relative.couchapp.npm:8080/design/-/rewrite/");
validNerfDart("http://relative.couchapp.npm:8080/design/-/rewrite/some-package", "//relative.couchapp.npm:8080/design/-/rewrite/");
