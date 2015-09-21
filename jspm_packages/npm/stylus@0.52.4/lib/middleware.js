/* */ 
var stylus = require("./stylus"),
    fs = require("fs"),
    url = require("url"),
    dirname = require("path").dirname,
    mkdirp = require("mkdirp"),
    join = require("path").join,
    sep = require("path").sep,
    debug = require("debug")('stylus:middleware');
var imports = {};
module.exports = function(options) {
  options = options || {};
  if ('string' == typeof options) {
    options = {src: options};
  }
  var force = options.force;
  var src = options.src;
  if (!src)
    throw new Error('stylus.middleware() requires "src" directory');
  var dest = options.dest || src;
  options.compile = options.compile || function(str, path) {
    if (options.sourcemap) {
      if ('boolean' == typeof options.sourcemap)
        options.sourcemap = {};
      options.sourcemap.inline = true;
    }
    return stylus(str).set('filename', path).set('compress', options.compress).set('firebug', options.firebug).set('linenos', options.linenos).set('sourcemap', options.sourcemap);
  };
  return function stylus(req, res, next) {
    if ('GET' != req.method && 'HEAD' != req.method)
      return next();
    var path = url.parse(req.url).pathname;
    if (/\.css$/.test(path)) {
      if (typeof dest == 'string') {
        var overlap = compare(dest, path).length;
        if (sep == path.charAt(0))
          overlap++;
        path = path.slice(overlap);
      }
      var cssPath,
          stylusPath;
      cssPath = (typeof dest == 'function') ? dest(path) : join(dest, path);
      stylusPath = (typeof src == 'function') ? src(path) : join(src, path.replace('.css', '.styl'));
      function error(err) {
        next('ENOENT' == err.code ? null : err);
      }
      if (force)
        return compile();
      function compile() {
        debug('read %s', cssPath);
        fs.readFile(stylusPath, 'utf8', function(err, str) {
          if (err)
            return error(err);
          var style = options.compile(str, stylusPath);
          var paths = style.options._imports = [];
          imports[stylusPath] = null;
          style.render(function(err, css) {
            if (err)
              return next(err);
            debug('render %s', stylusPath);
            imports[stylusPath] = paths;
            mkdirp(dirname(cssPath), parseInt('0700', 8), function(err) {
              if (err)
                return error(err);
              fs.writeFile(cssPath, css, 'utf8', next);
            });
          });
        });
      }
      if (!imports[stylusPath])
        return compile();
      fs.stat(stylusPath, function(err, stylusStats) {
        if (err)
          return error(err);
        fs.stat(cssPath, function(err, cssStats) {
          if (err) {
            if ('ENOENT' == err.code) {
              debug('not found %s', cssPath);
              compile();
            } else {
              next(err);
            }
          } else {
            if (stylusStats.mtime > cssStats.mtime) {
              debug('modified %s', cssPath);
              compile();
            } else {
              checkImports(stylusPath, function(changed) {
                if (debug && changed.length) {
                  changed.forEach(function(path) {
                    debug('modified import %s', path);
                  });
                }
                changed.length ? compile() : next();
              });
            }
          }
        });
      });
    } else {
      next();
    }
  };
};
function checkImports(path, fn) {
  var nodes = imports[path];
  if (!nodes)
    return fn();
  if (!nodes.length)
    return fn();
  var pending = nodes.length,
      changed = [];
  nodes.forEach(function(imported) {
    fs.stat(imported.path, function(err, stat) {
      if (err || !imported.mtime || stat.mtime > imported.mtime) {
        changed.push(imported.path);
      }
      --pending || fn(changed);
    });
  });
}
function compare(pathA, pathB) {
  pathA = pathA.split(sep);
  pathB = pathB.split(sep);
  if (!pathA[pathA.length - 1])
    pathA.pop();
  if (!pathB[0])
    pathB.shift();
  var overlap = [];
  while (pathA[pathA.length - 1] == pathB[0]) {
    overlap.push(pathA.pop());
    pathB.shift();
  }
  return overlap.join(sep);
}
