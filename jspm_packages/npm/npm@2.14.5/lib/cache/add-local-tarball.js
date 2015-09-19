/* */ 
var mkdir = require("mkdirp"),
    assert = require("assert"),
    fs = require("graceful-fs"),
    writeFileAtomic = require("write-file-atomic"),
    path = require("path"),
    sha = require("sha"),
    npm = require("../npm"),
    log = require("npmlog"),
    tar = require("../utils/tar"),
    pathIsInside = require("path-is-inside"),
    getCacheStat = require("./get-stat"),
    cachedPackageRoot = require("./cached-package-root"),
    chownr = require("chownr"),
    inflight = require("inflight"),
    once = require("once"),
    writeStream = require("fs-write-stream-atomic"),
    randomBytes = require("crypto").pseudoRandomBytes;
module.exports = addLocalTarball;
function addLocalTarball(p, pkgData, shasum, cb) {
  assert(typeof p === "string", "must have path");
  assert(typeof cb === "function", "must have callback");
  if (!pkgData)
    pkgData = {};
  if (!shasum) {
    return sha.get(p, function(er, shasum) {
      if (er)
        return cb(er);
      log.silly("addLocalTarball", "shasum (computed)", shasum);
      addLocalTarball(p, pkgData, shasum, cb);
    });
  }
  if (pathIsInside(p, npm.cache)) {
    if (path.basename(p) !== "package.tgz") {
      return cb(new Error("Not a valid cache tarball name: " + p));
    }
    log.verbose("addLocalTarball", "adding from inside cache", p);
    return addPlacedTarball(p, pkgData, shasum, cb);
  }
  addTmpTarball(p, pkgData, shasum, function(er, data) {
    if (data) {
      data._resolved = p;
      data._shasum = data._shasum || shasum;
    }
    return cb(er, data);
  });
}
function addPlacedTarball(p, pkgData, shasum, cb) {
  assert(pkgData, "should have package data by now");
  assert(typeof cb === "function", "cb function required");
  getCacheStat(function(er, cs) {
    if (er)
      return cb(er);
    return addPlacedTarball_(p, pkgData, cs.uid, cs.gid, shasum, cb);
  });
}
function addPlacedTarball_(p, pkgData, uid, gid, resolvedSum, cb) {
  var folder = path.join(cachedPackageRoot(pkgData), "package");
  if (!resolvedSum) {
    sha.get(p, function(er, shasum) {
      if (er)
        return cb(er);
      addPlacedTarball_(p, pkgData, uid, gid, shasum, cb);
    });
    return;
  }
  mkdir(folder, function(er) {
    if (er)
      return cb(er);
    var pj = path.join(folder, "package.json");
    var json = JSON.stringify(pkgData, null, 2);
    writeFileAtomic(pj, json, function(er) {
      cb(er, pkgData);
    });
  });
}
function addTmpTarball(tgz, pkgData, shasum, cb) {
  assert(typeof cb === "function", "must have callback function");
  assert(shasum, "must have shasum by now");
  cb = inflight("addTmpTarball:" + tgz, cb);
  if (!cb)
    return log.verbose("addTmpTarball", tgz, "already in flight; not adding");
  log.verbose("addTmpTarball", tgz, "not in flight; adding");
  if (pkgData && pkgData.name && pkgData.version) {
    log.verbose("addTmpTarball", "already have metadata; skipping unpack for", pkgData.name + "@" + pkgData.version);
    return addTmpTarball_(tgz, pkgData, shasum, cb);
  }
  randomBytes(6, function(er, random) {
    if (er)
      return cb(er);
    var target = path.join(npm.tmp, "unpack-" + random.toString("hex"));
    getCacheStat(function(er, cs) {
      if (er)
        return cb(er);
      log.verbose("addTmpTarball", "validating metadata from", tgz);
      tar.unpack(tgz, target, null, null, cs.uid, cs.gid, function(er, data) {
        if (er)
          return cb(er);
        if (!data.name) {
          return cb(new Error("No name provided"));
        } else if (pkgData.name && data.name !== pkgData.name) {
          return cb(new Error("Invalid Package: expected " + pkgData.name + " but found " + data.name));
        }
        if (!data.version) {
          return cb(new Error("No version provided"));
        } else if (pkgData.version && data.version !== pkgData.version) {
          return cb(new Error("Invalid Package: expected " + pkgData.name + "@" + pkgData.version + " but found " + data.name + "@" + data.version));
        }
        addTmpTarball_(tgz, data, shasum, cb);
      });
    });
  });
}
function addTmpTarball_(tgz, data, shasum, cb) {
  assert(typeof cb === "function", "must have callback function");
  cb = once(cb);
  assert(data.name, "should have package name by now");
  assert(data.version, "should have package version by now");
  var root = cachedPackageRoot(data);
  var pkg = path.resolve(root, "package");
  var target = path.resolve(root, "package.tgz");
  getCacheStat(function(er, cs) {
    if (er)
      return cb(er);
    mkdir(pkg, function(er, created) {
      function chown() {
        chownr(created || root, cs.uid, cs.gid, done);
      }
      if (er)
        return cb(er);
      var read = fs.createReadStream(tgz);
      var write = writeStream(target, {mode: npm.modes.file});
      var fin = cs.uid && cs.gid ? chown : done;
      read.on("error", cb).pipe(write).on("error", cb).on("close", fin);
    });
  });
  function done() {
    data._shasum = data._shasum || shasum;
    cb(null, data);
  }
}
