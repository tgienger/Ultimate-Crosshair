/* */ 
var fs = require("fs");
var asyncMap = require("slide").asyncMap;
var path = require("path");
var readJson = require("read-package-json");
var semver = require("semver");
var rm = require("./utils/gently-rm");
var log = require("npmlog");
var npm = require("./npm");
var mapToRegistry = require("./utils/map-to-registry");
module.exports = dedupe;
dedupe.usage = "npm dedupe [pkg pkg...]";
function dedupe(args, silent, cb) {
  if (typeof silent === "function")
    cb = silent, silent = false;
  var dryrun = false;
  if (npm.command.match(/^find/))
    dryrun = true;
  return dedupe_(npm.prefix, args, {}, dryrun, silent, cb);
}
function dedupe_(dir, filter, unavoidable, dryrun, silent, cb) {
  readInstalled(path.resolve(dir), {}, null, function(er, data, counter) {
    if (er) {
      return cb(er);
    }
    if (!data) {
      return cb();
    }
    var dupes = Object.keys(counter || {}).filter(function(k) {
      if (filter.length && -1 === filter.indexOf(k))
        return false;
      return counter[k] > 1 && !unavoidable[k];
    }).reduce(function(s, k) {
      s[k] = [];
      return s;
    }, {});
    ;
    (function U(obj) {
      if (unavoidable[obj.name]) {
        obj.unavoidable = true;
      }
      if (obj.parent && obj.parent.unavoidable) {
        obj.unavoidable = true;
      }
      Object.keys(obj.children).forEach(function(k) {
        U(obj.children[k]);
      });
    })(data);
    ;
    (function C(obj) {
      if (dupes[obj.name] && !obj.unavoidable) {
        dupes[obj.name].push(obj);
        obj.duplicate = true;
      }
      obj.dependents = whoDepends(obj);
      Object.keys(obj.children).forEach(function(k) {
        C(obj.children[k]);
      });
    })(data);
    if (dryrun) {
      var k = Object.keys(dupes);
      if (!k.length)
        return cb();
      return npm.commands.ls(k, silent, cb);
    }
    var summary = Object.keys(dupes).map(function(n) {
      return [n, dupes[n].filter(function(d) {
        return d && d.parent && !d.parent.duplicate && !d.unavoidable;
      }).map(function M(d) {
        return [d.path, d.version, d.dependents.map(function(k) {
          return [k.path, k.version, k.dependencies[d.name] || ""];
        })];
      })];
    }).map(function(item) {
      var set = item[1];
      var ranges = set.map(function(i) {
        return i[2].map(function(d) {
          return d[2];
        });
      }).reduce(function(l, r) {
        return l.concat(r);
      }, []).map(function(v, i, set) {
        if (set.indexOf(v) !== i)
          return false;
        return v;
      }).filter(function(v) {
        return v !== false;
      });
      var locs = set.map(function(i) {
        return i[0];
      });
      var versions = set.map(function(i) {
        return i[1];
      }).filter(function(v, i, set) {
        return set.indexOf(v) === i;
      });
      var has = set.map(function(i) {
        return [i[0], i[1]];
      }).reduce(function(set, kv) {
        set[kv[0]] = kv[1];
        return set;
      }, {});
      var loc = locs.length ? locs.reduce(function(a, b) {
        var nmReg = new RegExp("\\" + path.sep + "node_modules\\" + path.sep);
        a = a.split(nmReg);
        b = b.split(nmReg);
        var name = a.pop();
        b.pop();
        for (var i = 0,
            al = a.length,
            bl = b.length; i < al && i < bl && a[i] === b[i]; i++)
          ;
        return a.slice(0, i).concat(name).join(path.sep + "node_modules" + path.sep);
      }) : undefined;
      return [item[0], {
        item: item,
        ranges: ranges,
        locs: locs,
        loc: loc,
        has: has,
        versions: versions
      }];
    }).filter(function(i) {
      return i[1].loc;
    });
    findVersions(npm, summary, function(er, set) {
      if (er)
        return cb(er);
      if (!set.length)
        return cb();
      installAndRetest(set, filter, dir, unavoidable, silent, cb);
    });
  });
}
function installAndRetest(set, filter, dir, unavoidable, silent, cb) {
  var remove = [];
  asyncMap(set, function(item, cb) {
    var name = item[0];
    var has = item[1];
    var where = item[2];
    var locMatch = item[3];
    var regMatch = item[4];
    var others = item[5];
    if (!locMatch && !regMatch) {
      log.warn("unavoidable conflict", item[0], item[1]);
      log.warn("unavoidable conflict", "Not de-duplicating");
      unavoidable[item[0]] = true;
      return cb();
    }
    if (locMatch && has[where] === locMatch) {
      remove.push.apply(remove, others);
      return cb();
    }
    if (regMatch) {
      var what = name + "@" + regMatch;
      var nmReg = new RegExp("\\" + path.sep + "node_modules\\" + path.sep);
      where = where.split(nmReg);
      where.pop();
      where = where.join(path.sep + "node_modules" + path.sep);
      remove.push.apply(remove, others);
      return npm.commands.install(where, what, cb);
    }
    return cb(new Error("danger zone\n" + name + " " + regMatch + " " + locMatch));
  }, function(er) {
    if (er)
      return cb(er);
    asyncMap(remove, rm, function(er) {
      if (er)
        return cb(er);
      remove.forEach(function(r) {
        log.info("rm", r);
      });
      dedupe_(dir, filter, unavoidable, false, silent, cb);
    });
  });
}
function findVersions(npm, summary, cb) {
  asyncMap(summary, function(item, cb) {
    var name = item[0];
    var data = item[1];
    var loc = data.loc;
    var locs = data.locs.filter(function(l) {
      return l !== loc;
    });
    if (locs.length === 0) {
      return cb(null, []);
    }
    var has = data.has;
    var versions = data.versions;
    var ranges = data.ranges;
    mapToRegistry(name, npm.config, function(er, uri, auth) {
      if (er)
        return cb(er);
      npm.registry.get(uri, {auth: auth}, next);
    });
    function next(er, data) {
      var regVersions = er ? [] : Object.keys(data.versions);
      var locMatch = bestMatch(versions, ranges);
      var tag = npm.config.get("tag");
      var distTag = data["dist-tags"] && data["dist-tags"][tag];
      var regMatch;
      if (distTag && data.versions[distTag] && matches(distTag, ranges)) {
        regMatch = distTag;
      } else {
        regMatch = bestMatch(regVersions, ranges);
      }
      cb(null, [[name, has, loc, locMatch, regMatch, locs]]);
    }
  }, cb);
}
function matches(version, ranges) {
  return !ranges.some(function(r) {
    return !semver.satisfies(version, r, true);
  });
}
function bestMatch(versions, ranges) {
  return versions.filter(function(v) {
    return matches(v, ranges);
  }).sort(semver.compareLoose).pop();
}
function readInstalled(dir, counter, parent, cb) {
  var pkg,
      children,
      realpath;
  fs.realpath(dir, function(er, rp) {
    realpath = rp;
    next();
  });
  readJson(path.resolve(dir, "package.json"), function(er, data) {
    if (er && er.code !== "ENOENT" && er.code !== "ENOTDIR")
      return cb(er);
    if (er)
      return cb();
    counter[data.name] = counter[data.name] || 0;
    counter[data.name]++;
    pkg = {
      _id: data._id,
      name: data.name,
      version: data.version,
      dependencies: data.dependencies || {},
      optionalDependencies: data.optionalDependencies || {},
      devDependencies: data.devDependencies || {},
      bundledDependencies: data.bundledDependencies || [],
      path: dir,
      realPath: dir,
      children: {},
      parent: parent,
      family: Object.create(parent ? parent.family : null),
      unavoidable: false,
      duplicate: false
    };
    if (parent) {
      parent.children[data.name] = pkg;
      parent.family[data.name] = pkg;
    }
    next();
  });
  fs.readdir(path.resolve(dir, "node_modules"), function(er, c) {
    children = children || [];
    asyncMap(c || [], function(child, cb) {
      if (child.indexOf('@') === 0) {
        fs.readdir(path.resolve(dir, "node_modules", child), function(er, scopedChildren) {
          (scopedChildren || []).forEach(function(sc) {
            children.push(path.join(child, sc));
          });
          cb();
        });
      } else {
        children.push(child);
        cb();
      }
    }, function(er) {
      if (er)
        return cb(er);
      children = children.filter(function(p) {
        return !p.match(/^[\._-]/);
      });
      next();
    });
  });
  function next() {
    if (!children || !pkg || !realpath)
      return;
    children = children.filter(function(c) {
      return !pkg.devDependencies.hasOwnProperty(c);
    });
    pkg.realPath = realpath;
    if (pkg.realPath !== pkg.path)
      children = [];
    var d = path.resolve(dir, "node_modules");
    asyncMap(children, function(child, cb) {
      readInstalled(path.resolve(d, child), counter, pkg, cb);
    }, function(er) {
      cb(er, pkg, counter);
    });
  }
}
function whoDepends(pkg) {
  var start = pkg.parent || pkg;
  return whoDepends_(pkg, [], start);
}
function whoDepends_(pkg, who, test) {
  if (test !== pkg && test.dependencies[pkg.name] && test.family[pkg.name] === pkg) {
    who.push(test);
  }
  Object.keys(test.children).forEach(function(n) {
    whoDepends_(pkg, who, test.children[n]);
  });
  return who;
}
