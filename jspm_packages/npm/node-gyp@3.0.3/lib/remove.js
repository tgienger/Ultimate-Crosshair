/* */ 
(function(process) {
  module.exports = exports = remove;
  exports.usage = 'Removes the node development files for the specified version';
  var fs = require("fs"),
      rm = require("rimraf"),
      path = require("path"),
      log = require("npmlog"),
      semver = require("semver");
  function remove(gyp, argv, callback) {
    var devDir = gyp.devDir;
    log.verbose('remove', 'using node-gyp dir:', devDir);
    var version = argv[0] || gyp.opts.target;
    log.verbose('remove', 'removing target version:', version);
    if (!version) {
      return callback(new Error('You must specify a version number to remove. Ex: "' + process.version + '"'));
    }
    var versionSemver = semver.parse(version);
    if (versionSemver) {
      version = versionSemver.version;
    }
    var versionPath = path.resolve(gyp.devDir, version);
    log.verbose('remove', 'removing development files for version:', version);
    fs.stat(versionPath, function(err, stat) {
      if (err) {
        if (err.code == 'ENOENT') {
          callback(null, 'version was already uninstalled: ' + version);
        } else {
          callback(err);
        }
        return;
      }
      rm(versionPath, callback);
    });
  }
})(require("process"));
