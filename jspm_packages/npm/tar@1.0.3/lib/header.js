/* */ 
(function(Buffer, process) {
  module.exports = TarHeader;
  var tar = require("../tar"),
      fields = tar.fields,
      fieldOffs = tar.fieldOffs,
      fieldEnds = tar.fieldEnds,
      fieldSize = tar.fieldSize,
      numeric = tar.numeric,
      assert = require("assert").ok,
      space = " ".charCodeAt(0),
      slash = "/".charCodeAt(0),
      bslash = process.platform === "win32" ? "\\".charCodeAt(0) : null;
  function TarHeader(block) {
    if (!(this instanceof TarHeader))
      return new TarHeader(block);
    if (block)
      this.decode(block);
  }
  TarHeader.prototype = {
    decode: decode,
    encode: encode,
    calcSum: calcSum,
    checkSum: checkSum
  };
  TarHeader.parseNumeric = parseNumeric;
  TarHeader.encode = encode;
  TarHeader.decode = decode;
  function encode(obj) {
    if (!obj && !(this instanceof TarHeader))
      throw new Error("encode must be called on a TarHeader, or supplied an object");
    obj = obj || this;
    var block = obj.block = new Buffer(512);
    if (obj.prefix) {
      obj.path = obj.prefix + "/" + obj.path;
      obj.prefix = "";
    }
    obj.needExtended = false;
    if (obj.mode) {
      if (typeof obj.mode === "string")
        obj.mode = parseInt(obj.mode, 8);
      obj.mode = obj.mode & 0777;
    }
    for (var f = 0; fields[f] !== null; f++) {
      var field = fields[f],
          off = fieldOffs[f],
          end = fieldEnds[f],
          ret;
      switch (field) {
        case "cksum":
          break;
        case "prefix":
          break;
        case "type":
          var type = obj.type || "0";
          if (type.length > 1) {
            type = tar.types[obj.type];
            if (!type)
              type = "0";
          }
          writeText(block, off, end, type);
          break;
        case "path":
          var pathLen = Buffer.byteLength(obj.path),
              pathFSize = fieldSize[fields.path],
              prefFSize = fieldSize[fields.prefix];
          if (pathLen > pathFSize && pathLen <= pathFSize + prefFSize) {
            var searchStart = pathLen - 1 - pathFSize,
                searchEnd = prefFSize,
                found = false,
                pathBuf = new Buffer(obj.path);
            for (var s = searchStart; (s <= searchEnd); s++) {
              if (pathBuf[s] === slash || pathBuf[s] === bslash) {
                found = s;
                break;
              }
            }
            if (found !== false) {
              prefix = pathBuf.slice(0, found).toString("utf8");
              path = pathBuf.slice(found + 1).toString("utf8");
              ret = writeText(block, off, end, path);
              off = fieldOffs[fields.prefix];
              end = fieldEnds[fields.prefix];
              ret = writeText(block, off, end, prefix) || ret;
              break;
            }
          }
          var poff = fieldOffs[fields.prefix],
              pend = fieldEnds[fields.prefix];
          writeText(block, poff, pend, "");
        default:
          ret = numeric[field] ? writeNumeric(block, off, end, obj[field]) : writeText(block, off, end, obj[field] || "");
          break;
      }
      obj.needExtended = obj.needExtended || ret;
    }
    var off = fieldOffs[fields.cksum],
        end = fieldEnds[fields.cksum];
    writeNumeric(block, off, end, calcSum.call(this, block));
    return block;
  }
  var MAXNUM = {
    12: 077777777777,
    11: 07777777777,
    8: 07777777,
    7: 0777777
  };
  function writeNumeric(block, off, end, num) {
    var writeLen = end - off,
        maxNum = MAXNUM[writeLen] || 0;
    num = num || 0;
    if (num instanceof Date || Object.prototype.toString.call(num) === "[object Date]") {
      num = num.getTime() / 1000;
    }
    if (num > maxNum || num < 0) {
      write256(block, off, end, num);
      return true;
    }
    var numStr = Math.floor(num).toString(8);
    if (num < MAXNUM[writeLen - 1])
      numStr += " ";
    if (numStr.length < writeLen) {
      numStr = (new Array(writeLen - numStr.length).join("0")) + numStr;
    }
    if (numStr.length !== writeLen - 1) {
      throw new Error("invalid length: " + JSON.stringify(numStr) + "\n" + "expected: " + writeLen);
    }
    block.write(numStr, off, writeLen, "utf8");
    block[end - 1] = 0;
  }
  function write256(block, off, end, num) {
    var buf = block.slice(off, end);
    var positive = num >= 0;
    buf[0] = positive ? 0x80 : 0xFF;
    if (!positive)
      num *= -1;
    var tuple = [];
    do {
      var n = num % 256;
      tuple.push(n);
      num = (num - n) / 256;
    } while (num);
    var bytes = tuple.length;
    var fill = buf.length - bytes;
    for (var i = 1; i < fill; i++) {
      buf[i] = positive ? 0 : 0xFF;
    }
    var zero = true;
    for (i = bytes; i > 0; i--) {
      var byte = tuple[bytes - i];
      if (positive)
        buf[fill + i] = byte;
      else if (zero && byte === 0)
        buf[fill + i] = 0;
      else if (zero) {
        zero = false;
        buf[fill + i] = 0x100 - byte;
      } else
        buf[fill + i] = 0xFF - byte;
    }
  }
  function writeText(block, off, end, str) {
    var strLen = Buffer.byteLength(str),
        writeLen = Math.min(strLen, end - off),
        needExtended = strLen !== str.length || strLen > writeLen;
    if (writeLen > 0)
      block.write(str, off, writeLen, "utf8");
    for (var i = off + writeLen; i < end; i++)
      block[i] = 0;
    return needExtended;
  }
  function calcSum(block) {
    block = block || this.block;
    assert(Buffer.isBuffer(block) && block.length === 512);
    if (!block)
      throw new Error("Need block to checksum");
    var sum = 0,
        start = fieldOffs[fields.cksum],
        end = fieldEnds[fields.cksum];
    for (var i = 0; i < fieldOffs[fields.cksum]; i++) {
      sum += block[i];
    }
    for (var i = start; i < end; i++) {
      sum += space;
    }
    for (var i = end; i < 512; i++) {
      sum += block[i];
    }
    return sum;
  }
  function checkSum(block) {
    var sum = calcSum.call(this, block);
    block = block || this.block;
    var cksum = block.slice(fieldOffs[fields.cksum], fieldEnds[fields.cksum]);
    cksum = parseNumeric(cksum);
    return cksum === sum;
  }
  function decode(block) {
    block = block || this.block;
    assert(Buffer.isBuffer(block) && block.length === 512);
    this.block = block;
    this.cksumValid = this.checkSum();
    var prefix = null;
    for (var f = 0; fields[f] !== null; f++) {
      var field = fields[f],
          val = block.slice(fieldOffs[f], fieldEnds[f]);
      switch (field) {
        case "ustar":
          if (val.toString() !== "ustar\0") {
            this.ustar = false;
            return;
          } else {
            this.ustar = val.toString();
          }
          break;
        case "prefix":
          var atime = parseNumeric(val.slice(131, 131 + 12)),
              ctime = parseNumeric(val.slice(131 + 12, 131 + 12 + 12));
          if ((val[130] === 0 || val[130] === space) && typeof atime === "number" && typeof ctime === "number" && val[131 + 12] === space && val[131 + 12 + 12] === space) {
            this.atime = atime;
            this.ctime = ctime;
            val = val.slice(0, 130);
          }
          prefix = val.toString("utf8").replace(/\0+$/, "");
          break;
        default:
          if (numeric[field]) {
            this[field] = parseNumeric(val);
          } else {
            this[field] = val.toString("utf8").replace(/\0+$/, "");
          }
          break;
      }
    }
    if (prefix) {
      this.path = prefix + "/" + this.path;
    }
  }
  function parse256(buf) {
    var positive;
    if (buf[0] === 0x80)
      positive = true;
    else if (buf[0] === 0xFF)
      positive = false;
    else
      return null;
    var zero = false,
        tuple = [];
    for (var i = buf.length - 1; i > 0; i--) {
      var byte = buf[i];
      if (positive)
        tuple.push(byte);
      else if (zero && byte === 0)
        tuple.push(0);
      else if (zero) {
        zero = false;
        tuple.push(0x100 - byte);
      } else
        tuple.push(0xFF - byte);
    }
    for (var sum = 0,
        i = 0,
        l = tuple.length; i < l; i++) {
      sum += tuple[i] * Math.pow(256, i);
    }
    return positive ? sum : -1 * sum;
  }
  function parseNumeric(f) {
    if (f[0] & 0x80)
      return parse256(f);
    var str = f.toString("utf8").split("\0")[0].trim(),
        res = parseInt(str, 8);
    return isNaN(res) ? null : res;
  }
})(require("buffer").Buffer, require("process"));
