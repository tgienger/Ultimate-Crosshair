/* */ 
(function(process) {
  module.exports = completion;
  completion.usage = "npm completion >> ~/.bashrc\n" + "npm completion >> ~/.zshrc\n" + "source <(npm completion)";
  var npm = require("./npm"),
      npmconf = require("./config/core"),
      configDefs = npmconf.defs,
      configTypes = configDefs.types,
      shorthands = configDefs.shorthands,
      nopt = require("nopt"),
      configNames = Object.keys(configTypes).filter(function(e) {
        return e.charAt(0) !== "_";
      }),
      shorthandNames = Object.keys(shorthands),
      allConfs = configNames.concat(shorthandNames),
      once = require("once");
  completion.completion = function(opts, cb) {
    if (opts.w > 3)
      return cb();
    var fs = require("graceful-fs"),
        path = require("path"),
        bashExists = null,
        zshExists = null;
    fs.stat(path.resolve(process.env.HOME, ".bashrc"), function(er) {
      bashExists = !er;
      next();
    });
    fs.stat(path.resolve(process.env.HOME, ".zshrc"), function(er) {
      zshExists = !er;
      next();
    });
    function next() {
      if (zshExists === null || bashExists === null)
        return;
      var out = [];
      if (zshExists)
        out.push("~/.zshrc");
      if (bashExists)
        out.push("~/.bashrc");
      if (opts.w === 2)
        out = out.map(function(m) {
          return [">>", m];
        });
      cb(null, out);
    }
  };
  function completion(args, cb) {
    if (process.platform === "win32") {
      var e = new Error("npm completion not supported on windows");
      e.code = "ENOTSUP";
      e.errno = require("constants").ENOTSUP;
      return cb(e);
    }
    if (process.env.COMP_CWORD === undefined || process.env.COMP_LINE === undefined || process.env.COMP_POINT === undefined)
      return dumpScript(cb);
    console.error(process.env.COMP_CWORD);
    console.error(process.env.COMP_LINE);
    console.error(process.env.COMP_POINT);
    var w = +process.env.COMP_CWORD,
        words = args.map(unescape),
        word = words[w],
        line = process.env.COMP_LINE,
        point = +process.env.COMP_POINT,
        partialLine = line.substr(0, point),
        partialWords = words.slice(0, w);
    var partialWord = args[w],
        i = partialWord.length;
    while (partialWord.substr(0, i) !== partialLine.substr(-1 * i) && i > 0) {
      i--;
    }
    partialWord = unescape(partialWord.substr(0, i));
    partialWords.push(partialWord);
    var opts = {
      words: words,
      w: w,
      word: word,
      line: line,
      lineLength: line.length,
      point: point,
      partialLine: partialLine,
      partialWords: partialWords,
      partialWord: partialWord,
      raw: args
    };
    cb = wrapCb(cb, opts);
    console.error(opts);
    if (partialWords.slice(0, -1).indexOf("--") === -1) {
      if (word.charAt(0) === "-")
        return configCompl(opts, cb);
      if (words[w - 1] && words[w - 1].charAt(0) === "-" && !isFlag(words[w - 1])) {
        console.error("configValueCompl");
        return configValueCompl(opts, cb);
      }
    }
    var parsed = opts.conf = nopt(configTypes, shorthands, partialWords.slice(0, -1), 0);
    console.error(parsed);
    var cmd = parsed.argv.remain[1];
    if (!cmd)
      return cmdCompl(opts, cb);
    Object.keys(parsed).forEach(function(k) {
      npm.config.set(k, parsed[k]);
    });
    cmd = npm.commands[cmd];
    if (cmd && cmd.completion)
      return cmd.completion(opts, cb);
    cb();
  }
  function dumpScript(cb) {
    var fs = require("graceful-fs"),
        path = require("path"),
        p = path.resolve(__dirname, "utils/completion.sh");
    cb = once(cb);
    fs.readFile(p, "utf8", function(er, d) {
      if (er)
        return cb(er);
      d = d.replace(/^\#\!.*?\n/, "");
      process.stdout.write(d, function() {
        cb();
      });
      process.stdout.on("error", function(er) {
        if (er.errno === "EPIPE")
          er = null;
        cb(er);
      });
    });
  }
  function unescape(w) {
    if (w.charAt(0) === "\"")
      return w.replace(/^"|"$/g, "");
    else
      return w.replace(/\\ /g, " ");
  }
  function escape(w) {
    if (!w.match(/\s+/))
      return w;
    return "\"" + w + "\"";
  }
  function wrapCb(cb, opts) {
    return function(er, compls) {
      if (!Array.isArray(compls))
        compls = compls ? [compls] : [];
      compls = compls.map(function(c) {
        if (Array.isArray(c))
          c = c.map(escape).join(" ");
        else
          c = escape(c);
        return c;
      });
      if (opts.partialWord)
        compls = compls.filter(function(c) {
          return c.indexOf(opts.partialWord) === 0;
        });
      console.error([er && er.stack, compls, opts.partialWord]);
      if (er || compls.length === 0)
        return cb(er);
      console.log(compls.join("\n"));
      cb();
    };
  }
  function configCompl(opts, cb) {
    var word = opts.word,
        split = word.match(/^(-+)((?:no-)*)(.*)$/),
        dashes = split[1],
        no = split[2],
        flags = configNames.filter(isFlag);
    console.error(flags);
    return cb(null, allConfs.map(function(c) {
      return dashes + c;
    }).concat(flags.map(function(f) {
      return dashes + (no || "no-") + f;
    })));
  }
  function configValueCompl(opts, cb) {
    console.error("configValue", opts);
    return cb(null, []);
  }
  function isFlag(word) {
    var split = word.match(/^(-*)((?:no-)+)?(.*)$/),
        no = split[2],
        conf = split[3];
    return no || configTypes[conf] === Boolean || shorthands[conf];
  }
  function cmdCompl(opts, cb) {
    return cb(null, npm.fullList);
  }
})(require("process"));
