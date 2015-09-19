/* */ 
module.exports = normalize;
var fixer = require("./fixer");
normalize.fixer = fixer;
var makeWarning = require("./make_warning");
var fieldsToFix = ['name', 'version', 'description', 'repository', 'modules', 'scripts', 'files', 'bin', 'man', 'bugs', 'keywords', 'readme', 'homepage', 'license'];
var otherThingsToFix = ['dependencies', 'people', 'typos'];
var thingsToFix = fieldsToFix.map(function(fieldName) {
  return ucFirst(fieldName) + "Field";
});
thingsToFix = thingsToFix.concat(otherThingsToFix);
function normalize(data, warn, strict) {
  if (warn === true)
    warn = null, strict = true;
  if (!strict)
    strict = false;
  if (!warn || data.private)
    warn = function(msg) {};
  if (data.scripts && data.scripts.install === "node-gyp rebuild" && !data.scripts.preinstall) {
    data.gypfile = true;
  }
  fixer.warn = function() {
    warn(makeWarning.apply(null, arguments));
  };
  thingsToFix.forEach(function(thingName) {
    fixer["fix" + ucFirst(thingName)](data, strict);
  });
  data._id = data.name + "@" + data.version;
}
function ucFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
