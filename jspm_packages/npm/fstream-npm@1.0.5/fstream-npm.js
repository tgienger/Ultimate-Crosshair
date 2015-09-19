/* */ 
var Ignore = require("fstream-ignore");
var inherits = require("inherits");
var path = require("path");
var fs = require("fs");
module.exports = Packer;
inherits(Packer, Ignore);
function Packer(props) {
  if (!(this instanceof Packer)) {
    return new Packer(props);
  }
  if (typeof props === 'string') {
    props = {path: props};
  }
  props.ignoreFiles = props.ignoreFiles || ['.npmignore', '.gitignore', 'package.json'];
  Ignore.call(this, props);
  this.bundled = props.bundled;
  this.bundleLinks = props.bundleLinks;
  this.package = props.package;
  this.bundleMagic = this.parent && this.parent.packageRoot && this.basename === 'node_modules';
  props.follow = this.follow = this.bundleMagic;
  if (this === this.root || this.parent && this.parent.bundleMagic && this.basename.charAt(0) !== '.') {
    this.readBundledLinks();
  }
  this.on('entryStat', function(entry, props) {
    entry.mode = props.mode = props.mode | parseInt('0200', 8);
  });
}
Packer.prototype.readBundledLinks = function() {
  if (this._paused) {
    this.once('resume', this.addIgnoreFiles);
    return;
  }
  this.pause();
  fs.readdir(this.path + '/node_modules', function(er, list) {
    var l = list && list.length;
    if (er || l === 0)
      return this.resume();
    var errState = null;
    var then = function then(er) {
      if (errState)
        return;
      if (er) {
        errState = er;
        return this.resume();
      }
      if (--l === 0)
        return this.resume();
    }.bind(this);
    list.forEach(function(pkg) {
      if (pkg.charAt(0) === '.')
        return then();
      var pd = this.path + '/node_modules/' + pkg;
      fs.realpath(pd, function(er, rp) {
        if (er)
          return then();
        this.bundleLinks = this.bundleLinks || {};
        this.bundleLinks[pkg] = rp;
        then();
      }.bind(this));
    }, this);
  }.bind(this));
};
Packer.prototype.applyIgnores = function(entry, partial, entryObj) {
  if (entry === 'package.json')
    return true;
  if (entry.match(/^readme(\.[^\.]*)$/i))
    return true;
  if (entry.match(/^(license|licence)(\.[^\.]*)?$/i))
    return true;
  if (entry.match(/^(changes|changelog|history)(\.[^\.]*)?$/i))
    return true;
  if (entry === 'node_modules' && this.packageRoot)
    return true;
  var mainFile = this.package && this.package.main;
  if (mainFile && path.resolve(this.path, entry) === path.resolve(this.path, mainFile))
    return true;
  if (entry === '.git' || entry === 'CVS' || entry === '.svn' || entry === '.hg' || entry === '.lock-wscript' || entry.match(/^\.wafpickle-[0-9]+$/) || entry === 'config.gypi' || entry === 'npm-debug.log' || entry === '.npmrc' || entry.match(/^\..*\.swp$/) || entry === '.DS_Store' || entry.match(/^\._/)) {
    return false;
  }
  if (this.bundleMagic) {
    if (entry.indexOf('/') !== -1)
      return true;
    if (entry === '.bin')
      return false;
    var p = this.parent;
    var pp = p && p.parent;
    if (pp && pp.bundleLinks && this.bundleLinks && pp.bundleLinks[entry] && pp.bundleLinks[entry] === this.bundleLinks[entry]) {
      return false;
    }
    if (pp && pp.package && pp.basename === 'node_modules') {
      return true;
    }
    var bd = this.package && this.package.bundleDependencies;
    if (bd && !Array.isArray(bd)) {
      throw new Error(this.package.name + '\'s `bundledDependencies` should ' + 'be an array');
    }
    var shouldBundle = bd && bd.indexOf(entry) !== -1;
    return shouldBundle;
  }
  return Ignore.prototype.applyIgnores.call(this, entry, partial, entryObj);
};
Packer.prototype.addIgnoreFiles = function() {
  var entries = this.entries;
  if (entries.indexOf('.npmignore') !== -1) {
    var i = entries.indexOf('.gitignore');
    if (i !== -1) {
      entries.splice(i, 1);
    }
  }
  this.entries = entries;
  Ignore.prototype.addIgnoreFiles.call(this);
};
Packer.prototype.readRules = function(buf, e) {
  if (e !== 'package.json') {
    return Ignore.prototype.readRules.call(this, buf, e);
  }
  buf = buf.toString().trim();
  if (buf.length === 0)
    return [];
  try {
    var p = this.package = JSON.parse(buf);
  } catch (er) {
    return [];
  }
  if (this === this.root) {
    this.bundleLinks = this.bundleLinks || {};
    this.bundleLinks[p.name] = this._path;
  }
  this.packageRoot = true;
  this.emit('package', p);
  if (p.bundledDependencies && !p.bundleDependencies) {
    p.bundleDependencies = p.bundledDependencies;
    delete p.bundledDependencies;
  }
  if (!p.files || !Array.isArray(p.files))
    return [];
  return ['*'].concat(p.files.map(function(f) {
    return '!' + f;
  })).concat(p.files.map(function(f) {
    return '!' + f.replace(/\/+$/, '') + '/**';
  }));
};
Packer.prototype.getChildProps = function(stat) {
  var props = Ignore.prototype.getChildProps.call(this, stat);
  props.package = this.package;
  props.bundled = this.bundled && this.bundled.slice(0);
  props.bundleLinks = this.bundleLinks && Object.create(this.bundleLinks);
  if (stat.isDirectory()) {
    props.type = this.constructor;
  }
  props.follow = false;
  return props;
};
var order = ['package.json', '.npmignore', '.gitignore', /^README(\.md)?$/, 'LICENCE', 'LICENSE', /\.js$/];
Packer.prototype.sort = function(a, b) {
  for (var i = 0,
      l = order.length; i < l; i++) {
    var o = order[i];
    if (typeof o === 'string') {
      if (a === o)
        return -1;
      if (b === o)
        return 1;
    } else {
      if (a.match(o))
        return -1;
      if (b.match(o))
        return 1;
    }
  }
  if (a === 'node_modules')
    return 1;
  if (b === 'node_modules')
    return -1;
  return Ignore.prototype.sort.call(this, a, b);
};
Packer.prototype.emitEntry = function(entry) {
  if (this._paused) {
    this.once('resume', this.emitEntry.bind(this, entry));
    return;
  }
  if (entry.basename === '.gitignore') {
    entry.basename = '.npmignore';
    entry.path = path.resolve(entry.dirname, entry.basename);
  }
  if (entry.basename.match(/\.gyp$/) && this.entries.indexOf('package.json') !== -1) {
    entry.basename = 'binding.gyp';
    entry.path = path.resolve(entry.dirname, entry.basename);
  }
  if (entry.type === 'SymbolicLink') {
    entry.abort();
    return;
  }
  if (entry.type !== 'Directory') {
    var h = path.dirname((entry.root || entry).path);
    var t = entry.path.substr(h.length + 1).replace(/^[^\/\\]+/, 'package');
    var p = h + '/' + t;
    entry.path = p;
    entry.dirname = path.dirname(p);
    return Ignore.prototype.emitEntry.call(this, entry);
  }
  var me = this;
  entry.on('entry', function(e) {
    if (e.parent === entry) {
      e.parent = me;
      me.emit('entry', e);
    }
  });
  entry.on('package', this.emit.bind(this, 'package'));
};
