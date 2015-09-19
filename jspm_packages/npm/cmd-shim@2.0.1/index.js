/* */ 
module.exports = cmdShim;
cmdShim.ifExists = cmdShimIfExists;
var fs = require("graceful-fs");
var mkdir = require("mkdirp"),
    path = require("path"),
    shebangExpr = /^#\!\s*(?:\/usr\/bin\/env)?\s*([^ \t]+)(.*)$/;
function cmdShimIfExists(from, to, cb) {
  fs.stat(from, function(er) {
    if (er)
      return cb();
    cmdShim(from, to, cb);
  });
}
function rm(path, cb) {
  fs.unlink(path, function(er) {
    cb();
  });
}
function cmdShim(from, to, cb) {
  fs.stat(from, function(er, stat) {
    if (er)
      return cb(er);
    cmdShim_(from, to, cb);
  });
}
function cmdShim_(from, to, cb) {
  var then = times(2, next, cb);
  rm(to, then);
  rm(to + ".cmd", then);
  function next(er) {
    writeShim(from, to, cb);
  }
}
function writeShim(from, to, cb) {
  mkdir(path.dirname(to), function(er) {
    if (er)
      return cb(er);
    fs.readFile(from, "utf8", function(er, data) {
      if (er)
        return writeShim_(from, to, null, null, cb);
      var firstLine = data.trim().split(/\r*\n/)[0],
          shebang = firstLine.match(shebangExpr);
      if (!shebang)
        return writeShim_(from, to, null, null, cb);
      var prog = shebang[1],
          args = shebang[2] || "";
      return writeShim_(from, to, prog, args, cb);
    });
  });
}
function writeShim_(from, to, prog, args, cb) {
  var shTarget = path.relative(path.dirname(to), from),
      target = shTarget.split("/").join("\\"),
      longProg,
      shProg = prog && prog.split("\\").join("/"),
      shLongProg;
  shTarget = shTarget.split("\\").join("/");
  args = args || "";
  if (!prog) {
    prog = "\"%~dp0\\" + target + "\"";
    shProg = "\"$basedir/" + shTarget + "\"";
    args = "";
    target = "";
    shTarget = "";
  } else {
    longProg = "\"%~dp0\\" + prog + ".exe\"";
    shLongProg = "\"$basedir/" + prog + "\"";
    target = "\"%~dp0\\" + target + "\"";
    shTarget = "\"$basedir/" + shTarget + "\"";
  }
  var cmd;
  if (longProg) {
    cmd = "@IF EXIST " + longProg + " (\r\n" + "  " + longProg + " " + args + " " + target + " %*\r\n" + ") ELSE (\r\n" + "  @SETLOCAL\r\n" + "  @SET PATHEXT=%PATHEXT:;.JS;=;%\r\n" + "  " + prog + " " + args + " " + target + " %*\r\n" + ")";
  } else {
    cmd = prog + " " + args + " " + target + " %*\r\n";
  }
  var sh = "#!/bin/sh\n";
  if (shLongProg) {
    sh = sh + "basedir=`dirname \"$0\"`\n" + "\n" + "case `uname` in\n" + "    *CYGWIN*) basedir=`cygpath -w \"$basedir\"`;;\n" + "esac\n" + "\n";
    sh = sh + "if [ -x " + shLongProg + " ]; then\n" + "  " + shLongProg + " " + args + " " + shTarget + " \"$@\"\n" + "  ret=$?\n" + "else \n" + "  " + shProg + " " + args + " " + shTarget + " \"$@\"\n" + "  ret=$?\n" + "fi\n" + "exit $ret\n";
  } else {
    sh = shProg + " " + args + " " + shTarget + " \"$@\"\n" + "exit $?\n";
  }
  var then = times(2, next, cb);
  fs.writeFile(to + ".cmd", cmd, "utf8", then);
  fs.writeFile(to, sh, "utf8", then);
  function next() {
    chmodShim(to, cb);
  }
}
function chmodShim(to, cb) {
  var then = times(2, cb, cb);
  fs.chmod(to, 0755, then);
  fs.chmod(to + ".cmd", 0755, then);
}
function times(n, ok, cb) {
  var errState = null;
  return function(er) {
    if (!errState) {
      if (er)
        cb(errState = er);
      else if (--n === 0)
        ok();
    }
  };
}
