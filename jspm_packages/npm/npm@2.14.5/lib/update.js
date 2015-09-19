/* */ 
module.exports = update;
update.usage = "npm update [pkg]";
var npm = require("./npm"),
    asyncMap = require("slide").asyncMap,
    log = require("npmlog"),
    install = require("./install"),
    build = require("./build");
update.completion = npm.commands.outdated.completion;
function update(args, cb) {
  npm.commands.outdated(args, true, function(er, outdated) {
    if (er)
      return cb(er);
    var wanted = outdated.filter(function(ww) {
      var dep = ww[1];
      var current = ww[2];
      var wanted = ww[3];
      var latest = ww[4];
      if (current === wanted && wanted !== latest) {
        log.verbose('outdated', 'not updating', dep, "because it's currently at the maximum version that matches its specified semver range");
      }
      return current !== wanted;
    });
    if (wanted.length === 0)
      return cb();
    log.info('outdated', 'updating', wanted);
    asyncMap(wanted, function(ww, cb) {
      var where = ww[0],
          dep = ww[1],
          want = ww[3],
          what = dep + "@" + want,
          req = ww[5],
          url = require("url");
      if (url.parse(req).protocol)
        what = req;
      npm.commands.install(where, what, cb);
    }, cb);
  });
}
