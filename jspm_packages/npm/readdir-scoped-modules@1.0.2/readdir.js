/* */ 
var fs = require("graceful-fs");
var dz = require("dezalgo");
var once = require("once");
var path = require("path");
var debug = require("debuglog")('rds');
module.exports = readdir;
function readdir(dir, cb) {
  fs.readdir(dir, function(er, kids) {
    if (er)
      return cb(er);
    debug('dir=%j, kids=%j', dir, kids);
    readScopes(dir, kids, function(er, data) {
      if (er)
        return cb(er);
      data = data.sort(function(a, b) {
        return a > b ? 1 : -1;
      });
      return cb(null, data);
    });
  });
}
function readScopes(root, kids, cb) {
  var scopes = kids.filter(function(kid) {
    return kid.charAt(0) === '@';
  });
  kids = kids.filter(function(kid) {
    return kid.charAt(0) !== '@';
  });
  debug('scopes=%j', scopes);
  if (scopes.length === 0)
    dz(cb)(null, kids);
  cb = once(cb);
  var l = scopes.length;
  scopes.forEach(function(scope) {
    var scopedir = path.resolve(root, scope);
    debug('root=%j scope=%j scopedir=%j', root, scope, scopedir);
    fs.readdir(scopedir, then.bind(null, scope));
  });
  function then(scope, er, scopekids) {
    if (er)
      return cb(er);
    scopekids = scopekids.filter(function(scopekid) {
      return !(scopekid === '.' || scopekid === '..' || !scopekid);
    });
    kids.push.apply(kids, scopekids.map(function(scopekid) {
      return scope + '/' + scopekid;
    }));
    debug('scope=%j scopekids=%j kids=%j', scope, scopekids, kids);
    if (--l === 0)
      cb(null, kids);
  }
}
