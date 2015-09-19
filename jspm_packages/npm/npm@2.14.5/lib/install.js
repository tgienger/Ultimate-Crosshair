/* */ 
(function(process) {
  module.exports = install;
  install.usage = "npm install" + "\nnpm install <pkg>" + "\nnpm install <pkg>@<tag>" + "\nnpm install <pkg>@<version>" + "\nnpm install <pkg>@<version range>" + "\nnpm install <folder>" + "\nnpm install <tarball file>" + "\nnpm install <tarball url>" + "\nnpm install <git:// url>" + "\nnpm install <github username>/<github project>" + "\n\nCan specify one or more: npm install ./foo.tgz bar@stable /some/folder" + "\nIf no argument is supplied and ./npm-shrinkwrap.json is " + "\npresent, installs dependencies specified in the shrinkwrap." + "\nOtherwise, installs dependencies from ./package.json.";
  install.completion = function(opts, cb) {
    if (/^https?:\/\//.test(opts.partialWord)) {
      return cb(null, []);
    }
    if (/\//.test(opts.partialWord)) {
      var lastSlashIdx = opts.partialWord.lastIndexOf("/");
      var partialName = opts.partialWord.slice(lastSlashIdx + 1);
      var partialPath = opts.partialWord.slice(0, lastSlashIdx);
      if (partialPath === "")
        partialPath = "/";
      function annotatePackageDirMatch(sibling, cb) {
        var fullPath = path.join(partialPath, sibling);
        if (sibling.slice(0, partialName.length) !== partialName) {
          return cb(null, null);
        }
        fs.readdir(fullPath, function(err, contents) {
          if (err)
            return cb(null, {isPackage: false});
          cb(null, {
            fullPath: fullPath,
            isPackage: contents.indexOf("package.json") !== -1
          });
        });
      }
      return fs.readdir(partialPath, function(err, siblings) {
        if (err)
          return cb(null, []);
        asyncMap(siblings, annotatePackageDirMatch, function(err, matches) {
          if (err)
            return cb(err);
          var cleaned = matches.filter(function(x) {
            return x !== null;
          });
          if (cleaned.length !== 1)
            return cb(null, []);
          if (!cleaned[0].isPackage)
            return cb(null, []);
          return cb(null, [cleaned[0].fullPath]);
        });
      });
    }
    cb();
  };
  var npm = require("./npm"),
      semver = require("semver"),
      readJson = require("read-package-json"),
      readInstalled = require("read-installed"),
      log = require("npmlog"),
      path = require("path"),
      fs = require("graceful-fs"),
      writeFileAtomic = require("write-file-atomic"),
      cache = require("./cache"),
      asyncMap = require("slide").asyncMap,
      chain = require("slide").chain,
      url = require("url"),
      mkdir = require("mkdirp"),
      lifecycle = require("./utils/lifecycle"),
      archy = require("archy"),
      npmInstallChecks = require("npm-install-checks"),
      sortedObject = require("sorted-object"),
      mapToRegistry = require("./utils/map-to-registry"),
      npa = require("npm-package-arg"),
      inflight = require("inflight"),
      locker = require("./utils/locker"),
      lock = locker.lock,
      unlock = locker.unlock,
      warnStrict = require("./utils/warn-deprecated")("engineStrict"),
      warnPeers = require("./utils/warn-deprecated")("peerDependencies");
  function install(args, cb_) {
    var hasArguments = !!args.length;
    function cb(er, installed) {
      if (er)
        return cb_(er);
      validateInstall(where, function(er, problem) {
        if (er)
          return cb_(er);
        if (problem) {
          var peerInvalidError = new Error("The package " + problem._id + " does not satisfy its siblings' peerDependencies requirements!");
          peerInvalidError.code = "EPEERINVALID";
          peerInvalidError.packageName = problem.name;
          peerInvalidError.packageVersion = problem.version;
          peerInvalidError.peersDepending = problem.peersDepending;
          return cb(peerInvalidError);
        }
        var tree = treeify(installed || []),
            pretty = prettify(tree, installed).trim();
        if (pretty)
          console.log(pretty);
        save(where, installed, tree, pretty, hasArguments, cb_);
      });
    }
    var where = path.resolve(npm.dir, "..");
    if (arguments.length === 3) {
      where = args;
      args = [].concat(cb_);
      cb_ = arguments[2];
      log.verbose("install", "where, what", [where, args]);
    }
    if (!npm.config.get("global")) {
      args = args.filter(function(a) {
        return path.resolve(a) !== where;
      });
    }
    mkdir(where, function(er) {
      if (er)
        return cb(er);
      if (!args.length) {
        var opt = {dev: npm.config.get("dev") || !npm.config.get("production")};
        if (npm.config.get("global"))
          args = ["."];
        else
          return readDependencies(null, where, opt, function(er, data) {
            if (er) {
              log.error("install", "Couldn't read dependencies");
              return cb(er);
            }
            var deps = Object.keys(data.dependencies || {});
            log.verbose("install", "where, deps", [where, deps]);
            var peers = [];
            Object.keys(data.peerDependencies || {}).forEach(function(dep) {
              if (!data.dependencies[dep]) {
                log.verbose("install", "peerDependency", dep, "wasn't going to be installed; adding");
                warnPeers(["The peer dependency " + dep + " included from " + data.name + " will no", "longer be automatically installed to fulfill the peerDependency ", "in npm 3+. Your application will need to depend on it explicitly."], dep + "," + data.name);
                peers.push(dep);
              }
            });
            log.verbose("install", "where, peers", [where, peers]);
            var context = {
              family: {},
              ancestors: {},
              explicit: false,
              parent: data,
              root: true,
              wrap: null
            };
            if (data.name === path.basename(where) && path.basename(path.dirname(where)) === "node_modules") {
              context.family[data.name] = context.ancestors[data.name] = data.version;
            }
            installManyTop(deps.map(function(dep) {
              var target = data.dependencies[dep];
              return dep + "@" + target;
            }).concat(peers.map(function(dep) {
              var target = data.peerDependencies[dep];
              return dep + "@" + target;
            })), where, context, function(er, results) {
              if (er || npm.config.get("production"))
                return cb(er, results);
              lifecycle(data, "prepublish", where, function(er) {
                return cb(er, results);
              });
            });
          });
      }
      var jsonPath = path.resolve(where, "package.json");
      log.verbose('install', 'initial load of', jsonPath);
      readJson(jsonPath, log.warn, function(er, data) {
        if (er && er.code !== "ENOENT" && er.code !== "ENOTDIR")
          return cb(er);
        if (er)
          data = null;
        var context = {
          family: {},
          ancestors: {},
          explicit: true,
          parent: data,
          root: true,
          wrap: null
        };
        if (data && data.name === path.basename(where) && path.basename(path.dirname(where)) === "node_modules") {
          context.family[data.name] = context.ancestors[data.name] = data.version;
        }
        var fn = npm.config.get("global") ? installMany : installManyTop;
        fn(args, where, context, cb);
      });
    });
  }
  function validateInstall(where, cb) {
    var jsonPath = path.resolve(where, 'package.json');
    log.verbose('validateInstall', 'loading', jsonPath, 'for validation');
    readJson(jsonPath, log.warn, function(er, data) {
      if (er && er.code !== 'ENOENT' && er.code !== 'ENOTDIR')
        return cb(er);
      if (data && data.engineStrict) {
        warnStrict(["Per-package engineStrict (found in this package's package.json) ", "won't be used in npm 3+. Use the config setting `engine-strict` instead."], data.name);
      }
      readInstalled(where, {
        log: log.warn,
        dev: true
      }, function(er, data) {
        if (er)
          return cb(er);
        cb(null, findPeerInvalid_(data.dependencies, []));
      });
    });
  }
  function findPeerInvalid_(packageMap, fpiList) {
    if (fpiList.indexOf(packageMap) !== -1)
      return undefined;
    fpiList.push(packageMap);
    for (var packageName in packageMap) {
      var pkg = packageMap[packageName];
      if (pkg.peerInvalid) {
        var peersDepending = {};
        for (var peerName in packageMap) {
          var peer = packageMap[peerName];
          if (peer.peerDependencies && peer.peerDependencies[packageName]) {
            peersDepending[peer.name + "@" + peer.version] = peer.peerDependencies[packageName];
          }
        }
        return {
          name: pkg.name,
          peersDepending: peersDepending,
          version: pkg.version,
          _id: pkg._id
        };
      }
      if (pkg.dependencies) {
        var invalid = findPeerInvalid_(pkg.dependencies, fpiList);
        if (invalid)
          return invalid;
      }
    }
    return null;
  }
  function readDependencies(context, where, opts, cb) {
    var wrap = context ? context.wrap : null;
    var jsonPath = path.resolve(where, 'package.json');
    log.verbose('readDependencies', 'loading dependencies from', jsonPath);
    readJson(jsonPath, log.warn, function(er, data) {
      if (er && er.code === "ENOENT")
        er.code = "ENOPACKAGEJSON";
      if (er)
        return cb(er);
      if (opts && opts.dev) {
        if (!data.dependencies)
          data.dependencies = {};
        Object.keys(data.devDependencies || {}).forEach(function(k) {
          if (data.dependencies[k]) {
            log.warn("package.json", "Dependency '%s' exists in both dependencies " + "and devDependencies, using '%s@%s' from dependencies", k, k, data.dependencies[k]);
          } else {
            data.dependencies[k] = data.devDependencies[k];
          }
        });
      }
      if (!npm.config.get("optional") && data.optionalDependencies) {
        Object.keys(data.optionalDependencies).forEach(function(d) {
          delete data.dependencies[d];
        });
      }
      if (npm.config.get("shrinkwrap") === false)
        return cb(null, data, null);
      if (wrap) {
        log.verbose("readDependencies: using existing wrap", [where, wrap]);
        var rv = {};
        Object.keys(data).forEach(function(key) {
          rv[key] = data[key];
        });
        rv.dependencies = {};
        Object.keys(wrap).forEach(function(key) {
          log.verbose("from wrap", [key, wrap[key]]);
          rv.dependencies[key] = readWrap(wrap[key]);
        });
        log.verbose("readDependencies returned deps", rv.dependencies);
        return cb(null, rv, wrap);
      }
      var wrapfile = path.resolve(where, "npm-shrinkwrap.json");
      fs.readFile(wrapfile, "utf8", function(er, wrapjson) {
        if (er)
          return cb(null, data, null);
        log.verbose("readDependencies", "npm-shrinkwrap.json is overriding dependencies");
        var newwrap;
        try {
          newwrap = JSON.parse(wrapjson);
        } catch (ex) {
          return cb(ex);
        }
        log.info("shrinkwrap", "file %j", wrapfile);
        var rv = {};
        Object.keys(data).forEach(function(key) {
          rv[key] = data[key];
        });
        rv.dependencies = {};
        Object.keys(newwrap.dependencies || {}).forEach(function(key) {
          rv.dependencies[key] = readWrap(newwrap.dependencies[key]);
        });
        if (opts && opts.dev) {
          Object.keys(data.devDependencies || {}).forEach(function(k) {
            rv.dependencies[k] = rv.dependencies[k] || data.devDependencies[k];
          });
        }
        log.verbose("readDependencies returned deps", rv.dependencies);
        return cb(null, rv, newwrap.dependencies);
      });
    });
  }
  function readWrap(w) {
    return (w.resolved) ? w.resolved : (w.from && url.parse(w.from).protocol) ? w.from : w.version;
  }
  function save(where, installed, tree, pretty, hasArguments, cb) {
    if (!hasArguments || !npm.config.get("save") && !npm.config.get("save-dev") && !npm.config.get("save-optional") || npm.config.get("global")) {
      return cb(null, installed, tree, pretty);
    }
    var saveBundle = npm.config.get("save-bundle");
    var savePrefix = npm.config.get("save-prefix");
    var saveTarget = path.resolve(where, "package.json");
    asyncMap(Object.keys(tree), function(k, cb) {
      var t = tree[k],
          f = npa(t.from),
          a = npa(t.what),
          w = [a.name, a.spec];
      fs.stat(t.from, function(er) {
        if (!er) {
          w[1] = "file:" + t.from;
        } else if (['hosted', 'git', 'remote'].indexOf(f.type) !== -1) {
          w[1] = t.from;
        }
        cb(null, [w]);
      });
    }, function(er, arr) {
      var things = arr.reduce(function(set, k) {
        var rangeDescriptor = semver.valid(k[1], true) && semver.gte(k[1], "0.1.0", true) && !npm.config.get("save-exact") ? savePrefix : "";
        set[k[0]] = rangeDescriptor + k[1];
        return set;
      }, {});
      fs.readFile(saveTarget, function(er, data) {
        try {
          data = JSON.parse(data.toString("utf8"));
        } catch (ex) {
          er = ex;
        }
        if (er) {
          return cb(null, installed, tree, pretty);
        }
        var deps = npm.config.get("save-optional") ? "optionalDependencies" : npm.config.get("save-dev") ? "devDependencies" : "dependencies";
        if (saveBundle) {
          var bundle = data.bundleDependencies || data.bundledDependencies;
          delete data.bundledDependencies;
          if (!Array.isArray(bundle))
            bundle = [];
          data.bundleDependencies = bundle.sort();
        }
        log.verbose("save", "saving", things);
        data[deps] = data[deps] || {};
        Object.keys(things).forEach(function(t) {
          data[deps][t] = things[t];
          if (saveBundle) {
            var i = bundle.indexOf(t);
            if (i === -1)
              bundle.push(t);
            data.bundleDependencies = bundle.sort();
          }
        });
        data[deps] = sortedObject(data[deps]);
        log.silly("save", "writing", saveTarget);
        data = JSON.stringify(data, null, 2) + "\n";
        writeFileAtomic(saveTarget, data, function(er) {
          cb(er, installed, tree, pretty);
        });
      });
    });
  }
  function prettify(tree, installed) {
    function red(set, kv) {
      set[kv[0]] = kv[1];
      return set;
    }
    if (npm.config.get("json")) {
      tree = Object.keys(tree).map(function(p) {
        if (!tree[p])
          return null;
        var what = npa(tree[p].what),
            name = what.name,
            version = what.spec,
            o = {
              name: name,
              version: version,
              from: tree[p].from
            };
        o.dependencies = tree[p].children.map(function P(dep) {
          var what = npa(dep.what),
              name = what.name,
              version = what.spec,
              o = {
                version: version,
                from: dep.from
              };
          o.dependencies = dep.children.map(P).reduce(red, {});
          return [name, o];
        }).reduce(red, {});
        return o;
      });
      return JSON.stringify(tree, null, 2);
    }
    if (npm.config.get("parseable"))
      return parseable(installed);
    return Object.keys(tree).map(function(p) {
      return archy({
        label: tree[p].what + " " + p,
        nodes: (tree[p].children || []).map(function P(c) {
          if (npm.config.get("long")) {
            return {
              label: c.what,
              nodes: c.children.map(P)
            };
          }
          var g = c.children.map(function(g) {
            return g.what;
          }).join(", ");
          if (g)
            g = " (" + g + ")";
          return c.what + g;
        })
      }, "", {unicode: npm.config.get("unicode")});
    }).join("\n");
  }
  function parseable(installed) {
    var long = npm.config.get("long"),
        cwd = process.cwd();
    return installed.map(function(item) {
      return path.resolve(cwd, item[1]) + (long ? ":" + item[0] : "");
    }).join("\n");
  }
  function treeify(installed) {
    var whatWhere = installed.reduce(function(l, r) {
      var parentDir = r[3],
          parent = r[2],
          where = r[1],
          what = r[0],
          from = r[4];
      l[where] = {
        parentDir: parentDir,
        parent: parent,
        children: [],
        where: where,
        what: what,
        from: from
      };
      return l;
    }, {});
    return Object.keys(whatWhere).reduce(function(l, r) {
      var ww = whatWhere[r];
      if (!ww.parent) {
        l[r] = ww;
      } else {
        var p = whatWhere[ww.parentDir];
        if (p)
          p.children.push(ww);
        else
          l[r] = ww;
      }
      return l;
    }, {});
  }
  function installManyTop(what, where, context, cb_) {
    function cb(er, d) {
      if (context.explicit || er)
        return cb_(er, d);
      npm.commands.build([where], false, true, function(er) {
        return cb_(er, d);
      });
    }
    if (context.explicit)
      return next();
    var jsonPath = path.join(where, 'package.json');
    log.verbose('installManyTop', 'reading for lifecycle', jsonPath);
    readJson(jsonPath, log.warn, function(er, data) {
      if (er)
        return next(er);
      lifecycle(data, "preinstall", where, next);
    });
    function next(er) {
      if (er)
        return cb(er);
      installManyTop_(what, where, context, cb);
    }
  }
  function installManyTop_(what, where, context, cb) {
    var nm = path.resolve(where, "node_modules");
    fs.readdir(nm, function(er, pkgs) {
      if (er)
        return installMany(what, where, context, cb);
      var scopes = [],
          unscoped = [];
      pkgs.filter(function(p) {
        return !p.match(/^[\._-]/);
      }).forEach(function(p) {
        if (p[0] === "@") {
          scopes.push(p);
        } else {
          unscoped.push(p);
        }
      });
      maybeScoped(scopes, nm, function(er, scoped) {
        if (er && er.code !== "ENOENT" && er.code !== "ENOTDIR")
          return cb(er);
        asyncMap(unscoped.concat(scoped).map(function(p) {
          return path.resolve(nm, p, "package.json");
        }), function(jsonPath, cb) {
          log.verbose('installManyTop', 'reading scoped package data from', jsonPath);
          readJson(jsonPath, log.info, function(er, data) {
            if (er && er.code !== "ENOENT" && er.code !== "ENOTDIR")
              return cb(er);
            if (er)
              return cb(null, []);
            cb(null, [[data.name, data.version]]);
          });
        }, function(er, packages) {
          if (er)
            packages = [];
          packages.forEach(function(p) {
            context.family[p[0]] = p[1];
          });
          installMany(what, where, context, cb);
        });
      });
    });
  }
  function maybeScoped(scopes, where, cb) {
    asyncMap(scopes, function(scope, cb) {
      fs.readdir(path.resolve(where, scope), function(er, scoped) {
        if (er)
          return cb(er);
        var paths = scoped.map(function(p) {
          return path.join(scope, p);
        });
        cb(null, paths);
      });
    }, cb);
  }
  function installMany(what, where, context, cb) {
    var opt = {dev: npm.config.get("dev")};
    readDependencies(context, where, opt, function(er, data, wrap) {
      if (er)
        data = {};
      var parent = data;
      if (context.explicit)
        wrap = null;
      var deps = data.dependencies || {};
      var devDeps = data.devDependencies || {};
      asyncMap(what, targetResolver(where, context, deps, devDeps), function(er, targets) {
        if (er)
          return cb(er);
        var bundled = data.bundleDependencies || data.bundledDependencies || [];
        if (bundled.length) {
          readInstalled(where, {dev: true}, andBuildResolvedTree);
        } else {
          andBuildResolvedTree();
        }
        function andBuildResolvedTree(er, current) {
          if (er)
            return cb(er);
          var newPrev = Object.create(context.family),
              newAnc = Object.create(context.ancestors);
          if (!context.root) {
            newAnc[data.name] = data.version;
          }
          bundled.forEach(function(bundle) {
            var bundleData = current.dependencies[bundle];
            if ((!bundleData || !bundleData.version) && current.devDependencies) {
              log.verbose('installMany', bundle, 'was bundled with', data.name + '@' + data.version + ", but wasn't found in dependencies. Trying devDependencies");
              bundleData = current.devDependencies[bundle];
            }
            if (!bundleData || !bundleData.version) {
              log.warn('installMany', bundle, 'was bundled with', data.name + '@' + data.version + ", but bundled package wasn't found in unpacked tree");
            } else {
              log.verbose('installMany', bundle + '@' + bundleData.version, 'was bundled with', data.name + '@' + data.version);
              newPrev[bundle] = bundleData.version;
            }
          });
          targets.forEach(function(t) {
            newPrev[t.name] = t.version;
          });
          log.silly("install resolved", targets);
          targets.filter(function(t) {
            return t;
          }).forEach(function(t) {
            log.info("install", "%s into %s", t._id, where);
          });
          asyncMap(targets, function(target, cb) {
            log.info("installOne", target._id);
            var wrapData = wrap ? wrap[target.name] : null;
            var newWrap = wrapData && wrapData.dependencies ? wrap[target.name].dependencies || {} : null;
            var newContext = {
              family: newPrev,
              ancestors: newAnc,
              parent: parent,
              explicit: false,
              wrap: newWrap
            };
            installOne(target, where, newContext, cb);
          }, cb);
        }
      });
    });
  }
  function targetResolver(where, context, deps, devDeps) {
    var alreadyInstalledManually = [],
        resolveLeft = 0,
        nm = path.resolve(where, "node_modules"),
        parent = context.parent,
        wrap = context.wrap;
    if (!context.explicit)
      readdir(nm);
    function readdir(name) {
      resolveLeft++;
      fs.readdir(name, function(er, inst) {
        if (er)
          return resolveLeft--;
        inst = inst.filter(function(p) {
          if (!p.match(/^[@\._-]/))
            return true;
          readdir(path.join(name, p));
        });
        asyncMap(inst, function(pkg, cb) {
          var jsonPath = path.resolve(name, pkg, 'package.json');
          log.verbose('targetResolver', 'reading package data from', jsonPath);
          readJson(jsonPath, log.info, function(er, d) {
            if (er && er.code !== "ENOENT" && er.code !== "ENOTDIR")
              return cb(er);
            if (er)
              return cb(null, []);
            var bd = parent.bundleDependencies;
            var isBundled = bd && bd.indexOf(d.name) !== -1;
            var expectedVersion = deps[d.name] || (devDeps && devDeps[d.name]) || "*";
            var currentIsSatisfactory = semver.satisfies(d.version, expectedVersion, true);
            if (isBundled || currentIsSatisfactory || deps[d.name] === d._resolved) {
              return cb(null, d.name);
            }
            fs.lstat(path.resolve(nm, pkg), function(err, s) {
              if (err)
                return cb(null, []);
              if (s.isSymbolicLink()) {
                return cb(null, d.name);
              }
              return cb(null, []);
            });
          });
        }, function(er, inst) {
          alreadyInstalledManually = alreadyInstalledManually.concat(inst);
          resolveLeft--;
        });
      });
    }
    var to = 0;
    return function resolver(what, cb) {
      if (resolveLeft)
        return setTimeout(function() {
          resolver(what, cb);
        }, to++);
      if (alreadyInstalledManually.indexOf(npa(what).name) !== -1) {
        log.verbose("already installed", "skipping %s %s", what, where);
        return cb(null, []);
      }
      if (context.family[what]) {
        log.verbose('install', what, 'is installed as', context.family[what]);
        if (wrap && wrap[what].version === context.family[what]) {
          log.verbose("shrinkwrap", "use existing", what);
          return cb(null, []);
        }
      }
      if (parent && parent.name === what && !npm.config.get("force")) {
        log.warn("install", "Refusing to install %s as a dependency of itself", what);
        return cb(null, []);
      }
      if (wrap) {
        var name = npa(what).name;
        if (wrap[name]) {
          var wrapTarget = readWrap(wrap[name]);
          what = name + "@" + wrapTarget;
        } else {
          log.verbose("shrinkwrap", "skipping %s (not in shrinkwrap)", what);
        }
      } else if (deps[what]) {
        what = what + "@" + deps[what];
      }
      var pkgroot = path.resolve(npm.prefix, (parent && parent._from) || "");
      cache.add(what, null, pkgroot, false, function(er, data) {
        if (er && parent && parent.optionalDependencies && parent.optionalDependencies.hasOwnProperty(npa(what).name)) {
          log.warn("optional dep failed, continuing", what);
          log.verbose("optional dep failed, continuing", [what, er]);
          return cb(null, []);
        }
        var type = npa(what).type;
        var isGit = type === "git" || type === "hosted";
        if (!er && data && !context.explicit && context.family[data.name] === data.version && !npm.config.get("force") && !isGit) {
          log.info("already installed", data.name + "@" + data.version);
          return cb(null, []);
        }
        if (data && !data._from)
          data._from = what;
        if (er && parent && parent.name)
          er.parent = parent.name;
        return cb(er, data || []);
      });
    };
  }
  function installOne(target, where, context, cb) {
    var isGit = false;
    var type = npa(target._from).type;
    if (target && target._from)
      isGit = type === 'git' || type === 'hosted';
    if (where === npm.prefix && npm.config.get("link") && !npm.config.get("global") && !isGit) {
      return localLink(target, where, context, cb);
    }
    installOne_(target, where, context, function(er, installedWhat) {
      if (er && context.parent && context.parent.optionalDependencies && context.parent.optionalDependencies.hasOwnProperty(target.name)) {
        log.warn("optional dep failed, continuing", target._id);
        log.verbose("optional dep failed, continuing", [target._id, er]);
        er = null;
      }
      cb(er, installedWhat);
    });
  }
  function localLink(target, where, context, cb) {
    log.verbose("localLink", target._id);
    var jsonPath = path.resolve(npm.globalDir, target.name, 'package.json');
    var parent = context.parent;
    log.verbose('localLink', 'reading data to link', target.name, 'from', jsonPath);
    readJson(jsonPath, log.warn, function(er, data) {
      function thenLink() {
        npm.commands.link([target.name], function(er, d) {
          log.silly("localLink", "back from link", [er, d]);
          cb(er, [resultList(target, where, parent && parent._id)]);
        });
      }
      if (er && er.code !== "ENOENT" && er.code !== "ENOTDIR")
        return cb(er);
      if (er || data._id === target._id) {
        if (er) {
          install(path.resolve(npm.globalDir, ".."), target._id, function(er) {
            if (er)
              return cb(er, []);
            thenLink();
          });
        } else
          thenLink();
      } else {
        log.verbose("localLink", "install locally (no link)", target._id);
        installOne_(target, where, context, cb);
      }
    });
  }
  function resultList(target, where, parentId) {
    var nm = path.resolve(where, "node_modules"),
        targetFolder = path.resolve(nm, target.name),
        prettyWhere = where;
    if (!npm.config.get("global")) {
      prettyWhere = path.relative(process.cwd(), where);
    }
    if (prettyWhere === ".")
      prettyWhere = null;
    if (!npm.config.get("global")) {
      targetFolder = path.relative(process.cwd(), targetFolder);
    }
    return [target._id, targetFolder, prettyWhere && parentId, parentId && prettyWhere, target._from];
  }
  var installed = Object.create(null);
  function installOne_(target, where, context, cb_) {
    var nm = path.resolve(where, "node_modules"),
        targetFolder = path.resolve(nm, target.name),
        prettyWhere = path.relative(process.cwd(), where),
        parent = context.parent;
    if (prettyWhere === ".")
      prettyWhere = null;
    cb_ = inflight(target.name + ":" + where, cb_);
    if (!cb_) {
      return log.verbose("installOne", "of", target.name, "to", where, "already in flight; waiting");
    } else {
      log.verbose("installOne", "of", target.name, "to", where, "not in flight; installing");
    }
    function cb(er, data) {
      unlock(nm, target.name, function() {
        cb_(er, data);
      });
    }
    lock(nm, target.name, function(er) {
      if (er)
        return cb(er);
      if (targetFolder in installed) {
        log.error("install", "trying to install", target.version, "to", targetFolder);
        log.error("install", "but already installed versions", installed[targetFolder]);
        installed[targetFolder].push(target.version);
      } else {
        installed[targetFolder] = [target.version];
      }
      var force = npm.config.get("force"),
          nodeVersion = npm.config.get("node-version"),
          strict = npm.config.get("engine-strict"),
          c = npmInstallChecks;
      chain([[c.checkEngine, target, npm.version, nodeVersion, force, strict], [c.checkPlatform, target, force], [c.checkCycle, target, context.ancestors], [c.checkGit, targetFolder], [write, target, targetFolder, context]], function(er, d) {
        if (er)
          return cb(er);
        d.push(resultList(target, where, parent && parent._id));
        cb(er, d);
      });
    });
  }
  function write(target, targetFolder, context, cb_) {
    var up = npm.config.get("unsafe-perm"),
        user = up ? null : npm.config.get("user"),
        group = up ? null : npm.config.get("group"),
        family = context.family;
    function cb(er, data) {
      if (!er)
        return cb_(er, data);
      if (npm.config.get("rollback") === false)
        return cb_(er);
      npm.rollbacks.push(targetFolder);
      cb_(er, data);
    }
    var bundled = [];
    log.silly("install write", "writing", target.name, target.version, "to", targetFolder);
    chain([[cache.unpack, target.name, target.version, targetFolder, null, null, user, group], function writePackageJSON(cb) {
      var jsonPath = path.resolve(targetFolder, 'package.json');
      log.verbose('write', 'writing to', jsonPath);
      writeFileAtomic(jsonPath, JSON.stringify(target, null, 2) + '\n', cb);
    }, [lifecycle, target, "preinstall", targetFolder], function collectBundled(cb) {
      if (!target.bundleDependencies)
        return cb();
      var bd = path.resolve(targetFolder, "node_modules");
      fs.readdir(bd, function(er, b) {
        if (er)
          return cb();
        bundled = b || [];
        cb();
      });
    }], function X(er) {
      if (er)
        return cb(er);
      var opt = {dev: npm.config.get("dev")};
      readDependencies(context, targetFolder, opt, function(er, data, wrap) {
        if (er)
          return cb(er);
        var deps = prepareForInstallMany(data, "dependencies", bundled, wrap, family);
        var depsTargetFolder = targetFolder;
        var depsContext = {
          family: family,
          ancestors: context.ancestors,
          parent: target,
          explicit: false,
          wrap: wrap
        };
        var actions = [[installManyAndBuild, deps, depsTargetFolder, depsContext]];
        var peerDeps = prepareForInstallMany(data, "peerDependencies", bundled, wrap, family);
        peerDeps.forEach(function(pd) {
          warnPeers(["The peer dependency " + pd + " included from " + data.name + " will no", "longer be automatically installed to fulfill the peerDependency ", "in npm 3+. Your application will need to depend on it explicitly."], pd + "," + data.name);
        });
        var pdTargetFolder;
        if (npa(target.name).scope) {
          pdTargetFolder = path.resolve(targetFolder, '../../..');
        } else {
          pdTargetFolder = path.resolve(targetFolder, '../..');
        }
        var pdContext = context;
        if (peerDeps.length > 0) {
          actions.push([installMany, peerDeps, pdTargetFolder, pdContext]);
        }
        chain(actions, cb);
      });
    });
  }
  function installManyAndBuild(deps, targetFolder, context, cb) {
    installMany(deps, targetFolder, context, function(er, d) {
      log.verbose("about to build", targetFolder);
      if (er)
        return cb(er);
      npm.commands.build([targetFolder], npm.config.get("global"), true, function(er) {
        return cb(er, d);
      });
    });
  }
  function prepareForInstallMany(packageData, depsKey, bundled, wrap, family) {
    var deps = Object.keys(packageData[depsKey] || {});
    if (packageData.bundleDependencies) {
      deps = deps.filter(function(d) {
        return packageData.bundleDependencies.indexOf(d) === -1 || bundled.indexOf(d) === -1;
      });
    }
    return deps.filter(function(d) {
      if (wrap)
        return wrap;
      if (semver.validRange(family[d], true)) {
        return !semver.satisfies(family[d], packageData[depsKey][d], true);
      }
      return true;
    }).map(function(d) {
      var v = packageData[depsKey][d];
      var t = d + "@" + v;
      log.silly("prepareForInstallMany", "adding", t, "from", packageData.name, depsKey);
      return t;
    });
  }
})(require("process"));
