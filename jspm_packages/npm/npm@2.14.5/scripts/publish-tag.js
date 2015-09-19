/* */ 
var semver = require("semver");
var version = semver.parse(require("../package.json!systemjs-json").version);
console.log('v%s.%s-next', version.major, version.minor);
