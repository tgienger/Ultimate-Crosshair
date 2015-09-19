/* */ 
module.exports = tag;
tag.usage = "npm tag <project>@<version> [<tag>]";
tag.completion = require("./unpublish").completion;
var npm = require("./npm"),
    mapToRegistry = require("./utils/map-to-registry"),
    npa = require("npm-package-arg"),
    semver = require("semver"),
    log = require("npmlog");
function tag(args, cb) {
  var thing = npa(args.shift() || ""),
      project = thing.name,
      version = thing.rawSpec,
      t = args.shift() || npm.config.get("tag");
  t = t.trim();
  if (!project || !version || !t)
    return cb("Usage:\n" + tag.usage);
  if (semver.validRange(t)) {
    var er = new Error("Tag name must not be a valid SemVer range: " + t);
    return cb(er);
  }
  log.warn("tag", "This command is deprecated. Use `npm dist-tag` instead.");
  mapToRegistry(project, npm.config, function(er, uri, auth) {
    if (er)
      return cb(er);
    var params = {
      version: version,
      tag: t,
      auth: auth
    };
    npm.registry.tag(uri, params, cb);
  });
}
