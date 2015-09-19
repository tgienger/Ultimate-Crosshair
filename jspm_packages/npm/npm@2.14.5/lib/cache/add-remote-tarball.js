/* */ 
var mkdir = require("mkdirp"),
    assert = require("assert"),
    log = require("npmlog"),
    path = require("path"),
    sha = require("sha"),
    retry = require("retry"),
    createWriteStream = require("fs-write-stream-atomic"),
    npm = require("../npm"),
    inflight = require("inflight"),
    addLocalTarball = require("./add-local-tarball"),
    cacheFile = require("npm-cache-filename");
module.exports = addRemoteTarball;
function addRemoteTarball(u, pkgData, shasum, auth, cb_) {
  assert(typeof u === "string", "must have module URL");
  assert(typeof cb_ === "function", "must have callback");
  function cb(er, data) {
    if (data) {
      data._from = u;
      data._resolved = u;
      data._shasum = data._shasum || shasum;
    }
    cb_(er, data);
  }
  cb_ = inflight(u, cb_);
  if (!cb_)
    return log.verbose("addRemoteTarball", u, "already in flight; waiting");
  log.verbose("addRemoteTarball", u, "not in flight; adding");
  var tmp = cacheFile(npm.tmp, u);
  function next(er, resp, shasum) {
    if (er)
      return cb(er);
    addLocalTarball(tmp, pkgData, shasum, cb);
  }
  log.verbose("addRemoteTarball", [u, shasum]);
  mkdir(path.dirname(tmp), function(er) {
    if (er)
      return cb(er);
    addRemoteTarball_(u, tmp, shasum, auth, next);
  });
}
function addRemoteTarball_(u, tmp, shasum, auth, cb) {
  var operation = retry.operation({
    retries: npm.config.get("fetch-retries"),
    factor: npm.config.get("fetch-retry-factor"),
    minTimeout: npm.config.get("fetch-retry-mintimeout"),
    maxTimeout: npm.config.get("fetch-retry-maxtimeout")
  });
  operation.attempt(function(currentAttempt) {
    log.info("retry", "fetch attempt " + currentAttempt + " at " + (new Date()).toLocaleTimeString());
    fetchAndShaCheck(u, tmp, shasum, auth, function(er, response, shasum) {
      var sc = response && response.statusCode;
      var statusRetry = !sc || (sc === 408 || sc >= 500);
      if (er && statusRetry && operation.retry(er)) {
        log.warn("retry", "will retry, error on last attempt: " + er);
        return;
      }
      cb(er, response, shasum);
    });
  });
}
function fetchAndShaCheck(u, tmp, shasum, auth, cb) {
  npm.registry.fetch(u, {auth: auth}, function(er, response) {
    if (er) {
      log.error("fetch failed", u);
      return cb(er, response);
    }
    var tarball = createWriteStream(tmp, {mode: npm.modes.file});
    tarball.on("error", function(er) {
      cb(er);
      tarball.destroy();
    });
    tarball.on("finish", function() {
      if (!shasum) {
        return sha.get(tmp, function(er, shasum) {
          log.silly("fetchAndShaCheck", "shasum", shasum);
          cb(er, response, shasum);
        });
      }
      log.silly("fetchAndShaCheck", "shasum", shasum);
      sha.check(tmp, shasum, function(er) {
        if (er && er.message) {
          er.message = er.message + "\n" + "From:     " + u;
        }
        return cb(er, response, shasum);
      });
    });
    response.pipe(tarball);
  });
}
