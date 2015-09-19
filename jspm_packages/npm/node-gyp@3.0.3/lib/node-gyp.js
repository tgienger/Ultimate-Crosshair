/* */ 
(function(process) {
  module.exports = exports = gyp;
  var fs = require("graceful-fs"),
      path = require("path"),
      nopt = require("nopt"),
      log = require("npmlog"),
      child_process = require("child_process"),
      EE = require("events").EventEmitter,
      inherits = require("util").inherits,
      commands = ['build', 'clean', 'configure', 'rebuild', 'install', 'list', 'remove'],
      aliases = {
        'ls': 'list',
        'rm': 'remove'
      };
  log.heading = 'gyp';
  function gyp() {
    return new Gyp();
  }
  function Gyp() {
    var self = this;
    var homeDir = process.env.HOME || process.env.USERPROFILE;
    if (!homeDir) {
      throw new Error("node-gyp requires that the user's home directory is specified " + "in either of the environmental variables HOME or USERPROFILE");
    }
    this.devDir = path.resolve(homeDir, '.node-gyp');
    this.commands = {};
    commands.forEach(function(command) {
      self.commands[command] = function(argv, callback) {
        log.verbose('command', command, argv);
        return require('./' + command)(self, argv, callback);
      };
    });
  }
  inherits(Gyp, EE);
  exports.Gyp = Gyp;
  var proto = Gyp.prototype;
  proto.package = require("../package.json!systemjs-json");
  proto.configDefs = {
    help: Boolean,
    arch: String,
    debug: Boolean,
    directory: String,
    make: String,
    msvs_version: String,
    ensure: Boolean,
    solution: String,
    proxy: String,
    nodedir: String,
    loglevel: String,
    python: String,
    'dist-url': String,
    'tarball': String,
    jobs: String,
    thin: String
  };
  proto.shorthands = {
    release: '--no-debug',
    C: '--directory',
    debug: '--debug',
    j: '--jobs',
    silly: '--loglevel=silly',
    verbose: '--loglevel=verbose'
  };
  proto.aliases = aliases;
  proto.parseArgv = function parseOpts(argv) {
    this.opts = nopt(this.configDefs, this.shorthands, argv);
    this.argv = this.opts.argv.remain.slice();
    var commands = this.todo = [];
    argv = this.argv.map(function(arg) {
      if (arg in this.aliases) {
        arg = this.aliases[arg];
      }
      return arg;
    }, this);
    argv.slice().forEach(function(arg) {
      if (arg in this.commands) {
        var args = argv.splice(0, argv.indexOf(arg));
        argv.shift();
        if (commands.length > 0) {
          commands[commands.length - 1].args = args;
        }
        commands.push({
          name: arg,
          args: []
        });
      }
    }, this);
    if (commands.length > 0) {
      commands[commands.length - 1].args = argv.splice(0);
    }
    var npm_config_prefix = 'npm_config_';
    Object.keys(process.env).forEach(function(name) {
      if (name.indexOf(npm_config_prefix) !== 0)
        return;
      var val = process.env[name];
      if (name === npm_config_prefix + 'loglevel') {
        log.level = val;
      } else {
        name = name.substring(npm_config_prefix.length);
        this.opts[name] = val;
      }
    }, this);
    if (this.opts.loglevel) {
      log.level = this.opts.loglevel;
    }
    log.resume();
  };
  proto.spawn = function spawn(command, args, opts) {
    if (!opts)
      opts = {};
    if (!opts.silent && !opts.stdio) {
      opts.stdio = [0, 1, 2];
    }
    var cp = child_process.spawn(command, args, opts);
    log.info('spawn', command);
    log.info('spawn args', args);
    return cp;
  };
  proto.usage = function usage() {
    var str = ['', '  Usage: node-gyp <command> [options]', '', '  where <command> is one of:', commands.map(function(c) {
      return '    - ' + c + ' - ' + require('./' + c).usage;
    }).join('\n'), '', 'node-gyp@' + this.version + '  ' + path.resolve(__dirname, '..'), 'node@' + process.versions.node].join('\n');
    return str;
  };
  Object.defineProperty(proto, 'version', {
    get: function() {
      return this.package.version;
    },
    enumerable: true
  });
})(require("process"));
