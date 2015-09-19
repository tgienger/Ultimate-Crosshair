/* */ 
(function(process) {
  module.exports = exports = configure;
  var fs = require("graceful-fs"),
      path = require("path"),
      glob = require("glob"),
      log = require("npmlog"),
      osenv = require("osenv"),
      which = require("which"),
      semver = require("semver"),
      mkdirp = require("mkdirp"),
      cp = require("child_process"),
      PathArray = require("path-array"),
      extend = require("util")._extend,
      processRelease = require("./process-release"),
      spawn = cp.spawn,
      execFile = cp.execFile,
      win = process.platform == 'win32';
  exports.usage = 'Generates ' + (win ? 'MSVC project files' : 'a Makefile') + ' for the current module';
  function configure(gyp, argv, callback) {
    var python = gyp.opts.python || process.env.PYTHON || 'python2',
        buildDir = path.resolve('build'),
        configNames = ['config.gypi', 'common.gypi'],
        configs = [],
        nodeDir,
        release = processRelease(argv, gyp, process.version, process.release);
    checkPython();
    function checkPython() {
      log.verbose('check python', 'checking for Python executable "%s" in the PATH', python);
      which(python, function(err, execPath) {
        if (err) {
          log.verbose('`which` failed', python, err);
          if (python === 'python2') {
            python = 'python';
            return checkPython();
          }
          if (win) {
            guessPython();
          } else {
            failNoPython();
          }
        } else {
          log.verbose('`which` succeeded', python, execPath);
          checkPythonVersion();
        }
      });
    }
    function guessPython() {
      log.verbose('could not find "' + python + '". guessing location');
      var rootDir = process.env.SystemDrive || 'C:\\';
      if (rootDir[rootDir.length - 1] !== '\\') {
        rootDir += '\\';
      }
      var pythonPath = path.resolve(rootDir, 'Python27', 'python.exe');
      log.verbose('ensuring that file exists:', pythonPath);
      fs.stat(pythonPath, function(err, stat) {
        if (err) {
          if (err.code == 'ENOENT') {
            failNoPython();
          } else {
            callback(err);
          }
          return;
        }
        python = pythonPath;
        checkPythonVersion();
      });
    }
    function checkPythonVersion() {
      var env = extend({}, process.env);
      env.TERM = 'dumb';
      execFile(python, ['-c', 'import platform; print(platform.python_version());'], {env: env}, function(err, stdout) {
        if (err) {
          return callback(err);
        }
        log.verbose('check python version', '`%s -c "import platform; print(platform.python_version());"` returned: %j', python, stdout);
        var version = stdout.trim();
        if (~version.indexOf('+')) {
          log.silly('stripping "+" sign(s) from version');
          version = version.replace(/\+/g, '');
        }
        if (~version.indexOf('rc')) {
          log.silly('stripping "rc" identifier from version');
          version = version.replace(/rc(.*)$/ig, '');
        }
        var range = semver.Range('>=2.5.0 <3.0.0');
        var valid = false;
        try {
          valid = range.test(version);
        } catch (e) {
          log.silly('range.test() error', e);
        }
        if (valid) {
          getNodeDir();
        } else {
          failPythonVersion(version);
        }
      });
    }
    function failNoPython() {
      callback(new Error('Can\'t find Python executable "' + python + '", you can set the PYTHON env variable.'));
    }
    function failPythonVersion(badVersion) {
      callback(new Error('Python executable "' + python + '" is v' + badVersion + ', which is not supported by gyp.\n' + 'You can pass the --python switch to point to Python >= v2.5.0 & < 3.0.0.'));
    }
    function getNodeDir() {
      process.env.PYTHON = python;
      if (gyp.opts.nodedir) {
        nodeDir = gyp.opts.nodedir.replace(/^~/, osenv.home());
        log.verbose('get node dir', 'compiling against specified --nodedir dev files: %s', nodeDir);
        createBuildDir();
      } else {
        if ('v' + release.version !== process.version) {
          log.verbose('get node dir', 'compiling against --target node version: %s', release.version);
        } else {
          log.verbose('get node dir', 'no --target version specified, falling back to host node version: %s', release.version);
        }
        if (!release.semver) {
          return callback(new Error('Invalid version number: ' + release.version));
        }
        gyp.opts.ensure = true;
        gyp.commands.install([release.version], function(err, version) {
          if (err)
            return callback(err);
          log.verbose('get node dir', 'target node version installed:', release.versionDir);
          nodeDir = path.resolve(gyp.devDir, release.versionDir);
          createBuildDir();
        });
      }
    }
    function createBuildDir() {
      log.verbose('build dir', 'attempting to create "build" dir: %s', buildDir);
      mkdirp(buildDir, function(err, isNew) {
        if (err)
          return callback(err);
        log.verbose('build dir', '"build" dir needed to be created?', isNew);
        createConfigFile();
      });
    }
    function createConfigFile(err) {
      if (err)
        return callback(err);
      var configFilename = 'config.gypi';
      var configPath = path.resolve(buildDir, configFilename);
      log.verbose('build/' + configFilename, 'creating config file');
      var config = process.config || {},
          defaults = config.target_defaults,
          variables = config.variables;
      if (!variables)
        variables = config.variables = {};
      if (!defaults)
        defaults = config.target_defaults = {};
      defaults.cflags = [];
      defaults.defines = [];
      defaults.include_dirs = [];
      defaults.libraries = [];
      if ('debug' in gyp.opts) {
        defaults.default_configuration = gyp.opts.debug ? 'Debug' : 'Release';
      }
      if (!defaults.default_configuration) {
        defaults.default_configuration = 'Release';
      }
      variables.target_arch = gyp.opts.arch || process.arch || 'ia32';
      variables.nodedir = nodeDir;
      variables.copy_dev_lib = !gyp.opts.nodedir;
      variables.standalone_static_library = gyp.opts.thin ? 0 : 1;
      Object.keys(gyp.opts).forEach(function(opt) {
        if (opt === 'argv')
          return;
        if (opt in gyp.configDefs)
          return;
        variables[opt.replace(/-/g, '_')] = gyp.opts[opt];
      });
      function boolsToString(k, v) {
        if (typeof v === 'boolean')
          return String(v);
        return v;
      }
      log.silly('build/' + configFilename, config);
      var prefix = '# Do not edit. File was generated by node-gyp\'s "configure" step',
          json = JSON.stringify(config, boolsToString, 2);
      log.verbose('build/' + configFilename, 'writing out config file: %s', configPath);
      configs.push(configPath);
      fs.writeFile(configPath, [prefix, json, ''].join('\n'), findConfigs);
    }
    function findConfigs(err) {
      if (err)
        return callback(err);
      var name = configNames.shift();
      if (!name)
        return runGyp();
      var fullPath = path.resolve(name);
      log.verbose(name, 'checking for gypi file: %s', fullPath);
      fs.stat(fullPath, function(err, stat) {
        if (err) {
          if (err.code == 'ENOENT') {
            findConfigs();
          } else {
            callback(err);
          }
        } else {
          log.verbose(name, 'found gypi file');
          configs.push(fullPath);
          findConfigs();
        }
      });
    }
    function runGyp(err) {
      if (err)
        return callback(err);
      if (!~argv.indexOf('-f') && !~argv.indexOf('--format')) {
        if (win) {
          log.verbose('gyp', 'gyp format was not specified; forcing "msvs"');
          argv.push('-f', 'msvs');
        } else {
          log.verbose('gyp', 'gyp format was not specified; forcing "make"');
          argv.push('-f', 'make');
        }
      }
      function hasMsvsVersion() {
        return argv.some(function(arg) {
          return arg.indexOf('msvs_version') === 0;
        });
      }
      if (win && !hasMsvsVersion()) {
        if ('msvs_version' in gyp.opts) {
          argv.push('-G', 'msvs_version=' + gyp.opts.msvs_version);
        } else {
          argv.push('-G', 'msvs_version=auto');
        }
      }
      configs.forEach(function(config) {
        argv.push('-I', config);
      });
      var gyp_script = path.resolve(__dirname, '..', 'gyp', 'gyp_main.py');
      var addon_gypi = path.resolve(__dirname, '..', 'addon.gypi');
      var common_gypi = path.resolve(nodeDir, 'include/node/common.gypi');
      fs.stat(common_gypi, function(err, stat) {
        if (err)
          common_gypi = path.resolve(nodeDir, 'common.gypi');
        var output_dir = 'build';
        if (win) {
          output_dir = buildDir;
        }
        var nodeGypDir = path.resolve(__dirname, '..');
        argv.push('-I', addon_gypi);
        argv.push('-I', common_gypi);
        argv.push('-Dlibrary=shared_library');
        argv.push('-Dvisibility=default');
        argv.push('-Dnode_root_dir=' + nodeDir);
        argv.push('-Dnode_gyp_dir=' + nodeGypDir);
        argv.push('-Dnode_lib_file=' + release.name + '.lib');
        argv.push('-Dmodule_root_dir=' + process.cwd());
        argv.push('--depth=.');
        argv.push('--no-parallel');
        argv.push('--generator-output', output_dir);
        argv.push('-Goutput_dir=.');
        argv.unshift('binding.gyp');
        argv.unshift(gyp_script);
        var pypath = new PathArray(process.env, 'PYTHONPATH');
        pypath.unshift(path.join(__dirname, '..', 'gyp', 'pylib'));
        var cp = gyp.spawn(python, argv);
        cp.on('exit', onCpExit);
      });
    }
    function onCpExit(code, signal) {
      if (code !== 0) {
        callback(new Error('`gyp` failed with exit code: ' + code));
      } else {
        callback();
      }
    }
  }
})(require("process"));
