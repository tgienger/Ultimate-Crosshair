/* */ 
var Minimatch = require("minimatch").Minimatch,
    fstream = require("fstream"),
    DirReader = fstream.DirReader,
    inherits = require("inherits"),
    path = require("path"),
    fs = require("fs");
module.exports = IgnoreReader;
inherits(IgnoreReader, DirReader);
function IgnoreReader(props) {
  if (!(this instanceof IgnoreReader)) {
    return new IgnoreReader(props);
  }
  if (typeof props === "string") {
    props = {path: path.resolve(props)};
  }
  props.type = "Directory";
  props.Directory = true;
  if (!props.ignoreFiles)
    props.ignoreFiles = [".ignore"];
  this.ignoreFiles = props.ignoreFiles;
  this.ignoreRules = null;
  if (props.sort) {
    this._sort = props.sort === "alpha" ? alphasort : props.sort;
    props.sort = null;
  }
  this.on("entries", function() {
    var hasIg = this.entries.some(this.isIgnoreFile, this);
    if (!hasIg)
      return this.filterEntries();
    this.addIgnoreFiles();
  });
  this.on("_entryStat", function(entry, props) {
    var t = entry.basename;
    if (!this.applyIgnores(entry.basename, entry.type === "Directory", entry)) {
      entry.abort();
    }
  }.bind(this));
  DirReader.call(this, props);
}
IgnoreReader.prototype.addIgnoreFiles = function() {
  if (this._paused) {
    this.once("resume", this.addIgnoreFiles);
    return;
  }
  if (this._ignoreFilesAdded)
    return;
  this._ignoreFilesAdded = true;
  var newIg = this.entries.filter(this.isIgnoreFile, this),
      count = newIg.length,
      errState = null;
  if (!count)
    return;
  this.pause();
  var then = function(er) {
    if (errState)
      return;
    if (er)
      return this.emit("error", errState = er);
    if (--count === 0) {
      this.filterEntries();
      this.resume();
    } else {
      this.addIgnoreFile(newIg[newIg.length - count], then);
    }
  }.bind(this);
  this.addIgnoreFile(newIg[0], then);
};
IgnoreReader.prototype.isIgnoreFile = function(e) {
  return e !== "." && e !== ".." && -1 !== this.ignoreFiles.indexOf(e);
};
IgnoreReader.prototype.getChildProps = function(stat) {
  var props = DirReader.prototype.getChildProps.call(this, stat);
  props.ignoreFiles = this.ignoreFiles;
  if (stat.isDirectory()) {
    props.type = this.constructor;
  }
  return props;
};
IgnoreReader.prototype.addIgnoreFile = function(e, cb) {
  var ig = path.resolve(this.path, e);
  fs.readFile(ig, function(er, data) {
    if (er)
      return cb(er);
    this.emit("ignoreFile", e, data);
    var rules = this.readRules(data, e);
    this.addIgnoreRules(rules, e);
    cb();
  }.bind(this));
};
IgnoreReader.prototype.readRules = function(buf, e) {
  return buf.toString().split(/\r?\n/);
};
IgnoreReader.prototype.addIgnoreRules = function(set, e) {
  set = set.filter(function(s) {
    s = s.trim();
    return s && !s.match(/^#/);
  });
  if (!set.length)
    return;
  var mmopt = {
    matchBase: true,
    dot: true,
    flipNegate: true
  },
      mm = set.map(function(s) {
        var m = new Minimatch(s, mmopt);
        m.ignoreFile = e;
        return m;
      });
  if (!this.ignoreRules)
    this.ignoreRules = [];
  this.ignoreRules.push.apply(this.ignoreRules, mm);
};
IgnoreReader.prototype.filterEntries = function() {
  this.entries = this.entries.filter(function(entry) {
    return this.applyIgnores(entry) || this.applyIgnores(entry, true);
  }, this);
};
IgnoreReader.prototype.applyIgnores = function(entry, partial, obj) {
  var included = true;
  if (this.parent && this.parent.applyIgnores) {
    var pt = this.basename + "/" + entry;
    included = this.parent.applyIgnores(pt, partial);
  }
  if (!this.ignoreRules) {
    return included;
  }
  this.ignoreRules.forEach(function(rule) {
    if (rule.negate && included || !rule.negate && !included) {
      return;
    }
    var match = rule.match("/" + entry);
    if (!match) {
      match = rule.match(entry);
    }
    if (!match && partial) {
      match = rule.match("/" + entry + "/") || rule.match(entry + "/");
    }
    if (!match && rule.negate && partial) {
      match = rule.match("/" + entry, true) || rule.match(entry, true);
    }
    if (match) {
      included = rule.negate;
    }
  }, this);
  return included;
};
IgnoreReader.prototype.sort = function(a, b) {
  var aig = this.ignoreFiles.indexOf(a) !== -1,
      big = this.ignoreFiles.indexOf(b) !== -1;
  if (aig && !big)
    return -1;
  if (big && !aig)
    return 1;
  return this._sort(a, b);
};
IgnoreReader.prototype._sort = function(a, b) {
  return 0;
};
function alphasort(a, b) {
  return a === b ? 0 : a.toLowerCase() > b.toLowerCase() ? 1 : a.toLowerCase() < b.toLowerCase() ? -1 : a > b ? 1 : -1;
}
