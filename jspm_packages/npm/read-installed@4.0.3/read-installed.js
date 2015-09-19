/* */ 
try {
  var fs = require("graceful-fs");
} catch (er) {
  var fs = require("fs");
}
var path = require("path");
var asyncMap = require("slide").asyncMap;
var semver = require("semver");
var readJson = require("read-package-json");
var url = require("url");
var util = require("util");
var extend = require("util-extend");
var debug = require("debuglog")("read-installed");
var readdir = require("readdir-scoped-modules");
var ANY = {};
module.exports = readInstalled;
function readInstalled(folder, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  } else {
    opts = extend({}, opts);
  }
  if (typeof opts.depth !== 'number')
    opts.depth = Infinity;
  opts.depth = Math.max(0, opts.depth);
  if (typeof opts.log !== 'function')
    opts.log = function() {};
  opts.dev = !!opts.dev;
  opts.realpathSeen = {};
  opts.findUnmetSeen = [];
  readInstalled_(folder, null, null, null, 0, opts, function(er, obj) {
    if (er)
      return cb(er);
    resolveInheritance(obj, opts);
    obj.root = true;
    unmarkExtraneous(obj, opts);
    cb(null, obj);
  });
}
function readInstalled_(folder, parent, name, reqver, depth, opts, cb) {
  var installed,
      obj,
      real,
      link,
      realpathSeen = opts.realpathSeen;
  readdir(path.resolve(folder, "node_modules"), function(er, i) {
    if (er)
      i = [];
    installed = i.filter(function(f) {
      return f.charAt(0) !== ".";
    });
    next();
  });
  readJson(path.resolve(folder, "package.json"), function(er, data) {
    obj = copy(data);
    if (!parent) {
      obj = obj || true;
      er = null;
    }
    return next(er);
  });
  fs.lstat(folder, function(er, st) {
    if (er) {
      if (!parent)
        real = true;
      return next(er);
    }
    fs.realpath(folder, function(er, rp) {
      debug("realpath(%j) = %j", folder, rp);
      real = rp;
      if (st.isSymbolicLink())
        link = rp;
      next(er);
    });
  });
  var errState = null,
      called = false;
  function next(er) {
    if (errState)
      return;
    if (er) {
      errState = er;
      return cb(null, []);
    }
    debug('next', installed, obj && typeof obj, name, real);
    if (!installed || !obj || !real || called)
      return;
    called = true;
    if (realpathSeen[real])
      return cb(null, realpathSeen[real]);
    if (obj === true) {
      obj = {
        dependencies: {},
        path: folder
      };
      installed.forEach(function(i) {
        obj.dependencies[i] = ANY;
      });
    }
    if (name && obj.name !== name)
      obj.invalid = true;
    obj.realName = name || obj.name;
    obj.dependencies = obj.dependencies || {};
    obj._dependencies = copy(obj.dependencies);
    if (reqver === ANY) {
      reqver = obj.version;
    }
    if (reqver && semver.validRange(reqver, true) && !semver.satisfies(obj.version, reqver, true)) {
      obj.invalid = true;
    }
    obj.extraneous = true;
    obj.path = obj.path || folder;
    obj.realPath = real;
    obj.link = link;
    if (parent && !obj.link)
      obj.parent = parent;
    realpathSeen[real] = obj;
    obj.depth = depth;
    asyncMap(installed, function(pkg, cb) {
      var rv = obj.dependencies[pkg];
      if (!rv && obj.devDependencies && opts.dev)
        rv = obj.devDependencies[pkg];
      if (depth > opts.depth) {
        obj.dependencies = {};
        return cb(null, obj);
      }
      readInstalled_(path.resolve(folder, "node_modules/" + pkg), obj, pkg, obj.dependencies[pkg], depth + 1, opts, cb);
    }, function(er, installedData) {
      if (er)
        return cb(er);
      installedData.forEach(function(dep) {
        obj.dependencies[dep.realName] = dep;
      });
      if (obj.optionalDependencies) {
        Object.keys(obj.optionalDependencies).forEach(function(dep) {
          if (typeof obj.dependencies[dep] === "string") {
            delete obj.dependencies[dep];
          }
        });
      }
      return cb(null, obj);
    });
  }
}
var riSeen = [];
function resolveInheritance(obj, opts) {
  if (typeof obj !== "object")
    return;
  if (riSeen.indexOf(obj) !== -1)
    return;
  riSeen.push(obj);
  if (typeof obj.dependencies !== "object") {
    obj.dependencies = {};
  }
  Object.keys(obj.dependencies).forEach(function(dep) {
    findUnmet(obj.dependencies[dep], opts);
  });
  Object.keys(obj.dependencies).forEach(function(dep) {
    if (typeof obj.dependencies[dep] === "object") {
      resolveInheritance(obj.dependencies[dep], opts);
    } else {
      debug("unmet dep! %s %s@%s", obj.name, dep, obj.dependencies[dep]);
    }
  });
  findUnmet(obj, opts);
}
function findUnmet(obj, opts) {
  var findUnmetSeen = opts.findUnmetSeen;
  if (findUnmetSeen.indexOf(obj) !== -1)
    return;
  findUnmetSeen.push(obj);
  debug("find unmet parent=%s obj=", obj.parent && obj.parent.name, obj.name || obj);
  var deps = obj.dependencies = obj.dependencies || {};
  debug(deps);
  Object.keys(deps).filter(function(d) {
    return typeof deps[d] === "string";
  }).forEach(function(d) {
    var found = findDep(obj, d);
    debug("finding dep %j", d, found && found.name || found);
    if (typeof deps[d] === "string" && semver.validRange(deps[d], true) && found && !semver.satisfies(found.version, deps[d], true)) {
      opts.log("unmet dependency", obj.path + " requires " + d + "@'" + deps[d] + "' but will load\n" + found.path + ",\nwhich is version " + found.version);
      found.invalid = true;
    }
    if (found) {
      deps[d] = found;
    }
  });
  var peerDeps = obj.peerDependencies = obj.peerDependencies || {};
  Object.keys(peerDeps).forEach(function(d) {
    var dependency;
    if (!obj.parent) {
      dependency = obj.dependencies[d];
      if (!dependency) {
        obj.dependencies[d] = peerDeps[d];
      }
    } else {
      var r = obj.parent;
      while (r && !dependency) {
        dependency = r.dependencies && r.dependencies[d];
        r = r.link ? null : r.parent;
      }
    }
    if (!dependency) {
      obj.dependencies[d] = peerDeps[d];
    } else if (!semver.satisfies(dependency.version, peerDeps[d], true)) {
      dependency.peerInvalid = true;
    }
  });
  return obj;
}
function unmarkExtraneous(obj, opts) {
  obj.extraneous = false;
  var deps = obj._dependencies || [];
  if (opts.dev && obj.devDependencies && (obj.root || obj.link)) {
    Object.keys(obj.devDependencies).forEach(function(k) {
      deps[k] = obj.devDependencies[k];
    });
  }
  if (obj.peerDependencies) {
    Object.keys(obj.peerDependencies).forEach(function(k) {
      deps[k] = obj.peerDependencies[k];
    });
  }
  debug("not extraneous", obj._id, deps);
  Object.keys(deps).forEach(function(d) {
    var dep = findDep(obj, d);
    if (dep && dep.extraneous) {
      unmarkExtraneous(dep, opts);
    }
  });
}
function findDep(obj, d) {
  var r = obj,
      found = null;
  while (r && !found) {
    if (typeof r.dependencies[d] === "object") {
      found = r.dependencies[d];
    }
    if (!found && r.realName === d)
      found = r;
    r = r.link ? null : r.parent;
  }
  return found;
}
function copy(obj) {
  if (!obj || typeof obj !== 'object')
    return obj;
  if (Array.isArray(obj))
    return obj.map(copy);
  var o = {};
  for (var i in obj)
    o[i] = copy(obj[i]);
  return o;
}
