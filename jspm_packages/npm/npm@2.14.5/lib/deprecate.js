/* */ 
var npm = require("./npm"),
    mapToRegistry = require("./utils/map-to-registry"),
    npa = require("npm-package-arg");
module.exports = deprecate;
deprecate.usage = "npm deprecate <pkg>[@<version>] <message>";
deprecate.completion = function(opts, cb) {
  if (opts.conf.argv.remain.length > 2)
    return cb();
  var path = "/-/by-user/";
  mapToRegistry(path, npm.config, function(er, uri, c) {
    if (er)
      return cb(er);
    if (!(c && c.username))
      return cb();
    var params = {
      timeout: 60000,
      auth: c
    };
    npm.registry.get(uri + c.username, params, function(er, list) {
      if (er)
        return cb();
      console.error(list);
      return cb(null, list[c.username]);
    });
  });
};
function deprecate(args, cb) {
  var pkg = args[0],
      msg = args[1];
  if (msg === undefined)
    return cb("Usage: " + deprecate.usage);
  var p = npa(pkg);
  mapToRegistry(p.name, npm.config, function(er, uri, auth) {
    if (er)
      return cb(er);
    var params = {
      version: p.spec,
      message: msg,
      auth: auth
    };
    npm.registry.deprecate(uri, params, cb);
  });
}
