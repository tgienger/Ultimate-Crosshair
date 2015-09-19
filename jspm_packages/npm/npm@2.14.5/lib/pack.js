/* */ 
(function(process) {
  module.exports = pack;
  var npm = require("./npm"),
      install = require("./install"),
      cache = require("./cache"),
      fs = require("graceful-fs"),
      chain = require("slide").chain,
      path = require("path"),
      cwd = process.cwd(),
      writeStream = require("fs-write-stream-atomic"),
      cachedPackageRoot = require("./cache/cached-package-root");
  pack.usage = "npm pack <pkg>";
  pack.completion = install.completion;
  function pack(args, silent, cb) {
    if (typeof cb !== "function")
      cb = silent, silent = false;
    if (args.length === 0)
      args = ["."];
    chain(args.map(function(arg) {
      return function(cb) {
        pack_(arg, cb);
      };
    }), function(er, files) {
      if (er || silent)
        return cb(er, files);
      printFiles(files, cb);
    });
  }
  function printFiles(files, cb) {
    files = files.map(function(file) {
      return path.relative(cwd, file);
    });
    console.log(files.join("\n"));
    cb();
  }
  function pack_(pkg, cb) {
    cache.add(pkg, null, null, false, function(er, data) {
      if (er)
        return cb(er);
      var name = data.name;
      if (name[0] === "@")
        name = name.substr(1).replace(/\//g, "-");
      var fname = name + "-" + data.version + ".tgz";
      var cached = path.join(cachedPackageRoot(data), "package.tgz"),
          from = fs.createReadStream(cached),
          to = writeStream(fname),
          errState = null;
      from.on("error", cb_);
      to.on("error", cb_);
      to.on("close", cb_);
      from.pipe(to);
      function cb_(er) {
        if (errState)
          return;
        if (er)
          return cb(errState = er);
        cb(null, fname);
      }
    });
  }
})(require("process"));
