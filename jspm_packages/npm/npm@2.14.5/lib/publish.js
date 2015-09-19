/* */ 
(function(process) {
  module.exports = publish;
  var npm = require("./npm"),
      log = require("npmlog"),
      path = require("path"),
      readJson = require("read-package-json"),
      lifecycle = require("./utils/lifecycle"),
      chain = require("slide").chain,
      mapToRegistry = require("./utils/map-to-registry"),
      cachedPackageRoot = require("./cache/cached-package-root"),
      createReadStream = require("graceful-fs").createReadStream,
      npa = require("npm-package-arg"),
      semver = require("semver"),
      getPublishConfig = require("./utils/get-publish-config");
  publish.usage = "npm publish <tarball> [--tag <tagname>]" + "\nnpm publish <folder> [--tag <tagname>]" + "\n\nPublishes '.' if no argument supplied" + "\n\nSets tag `latest` if no --tag specified";
  publish.completion = function(opts, cb) {
    return cb();
  };
  function publish(args, isRetry, cb) {
    if (typeof cb !== "function") {
      cb = isRetry;
      isRetry = false;
    }
    if (args.length === 0)
      args = ["."];
    if (args.length !== 1)
      return cb(publish.usage);
    log.verbose("publish", args);
    var t = npm.config.get('tag').trim();
    if (semver.validRange(t)) {
      var er = new Error("Tag name must not be a valid SemVer range: " + t);
      return cb(er);
    }
    var arg = args[0];
    readJson(path.resolve(arg, "package.json"), function(er, data) {
      if (er && er.code !== "ENOENT" && er.code !== "ENOTDIR")
        return cb(er);
      if (data) {
        if (!data.name)
          return cb(new Error("No name provided"));
        if (!data.version)
          return cb(new Error("No version provided"));
      }
      if (er)
        return cacheAddPublish(arg, false, isRetry, cb);
      else
        cacheAddPublish(arg, true, isRetry, cb);
    });
  }
  function cacheAddPublish(dir, didPre, isRetry, cb) {
    npm.commands.cache.add(dir, null, null, false, function(er, data) {
      if (er)
        return cb(er);
      log.silly("publish", data);
      var cachedir = path.resolve(cachedPackageRoot(data), "package");
      chain([!didPre && [lifecycle, data, "prepublish", cachedir], [publish_, dir, data, isRetry, cachedir], [lifecycle, data, "publish", didPre ? dir : cachedir], [lifecycle, data, "postpublish", didPre ? dir : cachedir]], cb);
    });
  }
  function publish_(arg, data, isRetry, cachedir, cb) {
    if (!data)
      return cb(new Error("no package.json file found"));
    var mappedConfig = getPublishConfig(data.publishConfig, npm.config, npm.registry);
    var config = mappedConfig.config;
    var registry = mappedConfig.client;
    data._npmVersion = npm.version;
    data._nodeVersion = process.versions.node;
    delete data.modules;
    if (data.private)
      return cb(new Error("This package has been marked as private\n" + "Remove the 'private' field from the package.json to publish it."));
    mapToRegistry(data.name, config, function(er, registryURI, auth, registryBase) {
      if (er)
        return cb(er);
      var tarballPath = cachedir + ".tgz";
      log.verbose("publish", "registryBase", registryBase);
      log.silly("publish", "uploading", tarballPath);
      data._npmUser = {
        name: auth.username,
        email: auth.email
      };
      var params = {
        metadata: data,
        body: createReadStream(tarballPath),
        auth: auth
      };
      if (config.get("access")) {
        if (!npa(data.name).scope && config.get("access") === "restricted") {
          return cb(new Error("Can't restrict access to unscoped packages."));
        }
        params.access = config.get("access");
      }
      registry.publish(registryBase, params, function(er) {
        if (er && er.code === "EPUBLISHCONFLICT" && npm.config.get("force") && !isRetry) {
          log.warn("publish", "Forced publish over " + data._id);
          return npm.commands.unpublish([data._id], function(er) {
            publish([arg], er || true, cb);
          });
        }
        if (er && isRetry && isRetry !== true)
          return cb(isRetry);
        if (er)
          return cb(er);
        console.log("+ " + data._id);
        cb();
      });
    });
  }
})(require("process"));
