/* */ 
(function(process) {
  var npm = require("./npm");
  module.exports = whoami;
  whoami.usage = "npm whoami\n(just prints username according to given registry)";
  function whoami(args, silent, cb) {
    if (typeof cb !== "function") {
      cb = silent;
      silent = false;
    }
    var registry = npm.config.get("registry");
    if (!registry)
      return cb(new Error("no default registry set"));
    var auth = npm.config.getCredentialsByURI(registry);
    if (auth) {
      if (auth.username) {
        if (!silent)
          console.log(auth.username);
        return process.nextTick(cb.bind(this, null, auth.username));
      } else if (auth.token) {
        return npm.registry.whoami(registry, {auth: auth}, function(er, username) {
          if (er)
            return cb(er);
          if (!username) {
            var needNewSession = new Error("Your auth token is no longer valid. Please log in again.");
            needNewSession.code = 'ENEEDAUTH';
            return cb(needNewSession);
          }
          if (!silent)
            console.log(username);
          cb(null, username);
        });
      }
    }
    var needAuth = new Error("this command requires you to be logged in.");
    needAuth.code = 'ENEEDAUTH';
    process.nextTick(cb.bind(this, needAuth));
  }
})(require("process"));
