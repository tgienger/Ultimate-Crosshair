/* */ 
(function(Buffer) {
  module.exports = ExtendedHeaderWriter;
  var inherits = require("inherits"),
      EntryWriter = require("./entry-writer");
  inherits(ExtendedHeaderWriter, EntryWriter);
  var tar = require("../tar"),
      path = require("path"),
      TarHeader = require("./header");
  function ExtendedHeaderWriter(props) {
    var me = this;
    if (!(me instanceof ExtendedHeaderWriter)) {
      return new ExtendedHeaderWriter(props);
    }
    me.fields = props;
    var p = {
      path: ("PaxHeader" + path.join("/", props.path || "")).replace(/\\/g, "/").substr(0, 100),
      mode: props.mode || 0666,
      uid: props.uid || 0,
      gid: props.gid || 0,
      size: 0,
      mtime: props.mtime || Date.now() / 1000,
      type: "x",
      linkpath: "",
      ustar: "ustar\0",
      ustarver: "00",
      uname: props.uname || "",
      gname: props.gname || "",
      devmaj: props.devmaj || 0,
      devmin: props.devmin || 0
    };
    EntryWriter.call(me, p);
    me.props = p;
    me._meta = true;
  }
  ExtendedHeaderWriter.prototype.end = function() {
    var me = this;
    if (me._ended)
      return;
    me._ended = true;
    me._encodeFields();
    if (me.props.size === 0) {
      me._ready = true;
      me._stream.end();
      return;
    }
    me._stream.write(TarHeader.encode(me.props));
    me.body.forEach(function(l) {
      me._stream.write(l);
    });
    me._ready = true;
    this._stream.end();
  };
  ExtendedHeaderWriter.prototype._encodeFields = function() {
    this.body = [];
    if (this.fields.prefix) {
      this.fields.path = this.fields.prefix + "/" + this.fields.path;
      this.fields.prefix = "";
    }
    encodeFields(this.fields, "", this.body, this.fields.noProprietary);
    var me = this;
    this.body.forEach(function(l) {
      me.props.size += l.length;
    });
  };
  function encodeFields(fields, prefix, body, nop) {
    Object.keys(fields).forEach(function(k) {
      var val = fields[k],
          numeric = tar.numeric[k];
      if (prefix)
        k = prefix + "." + k;
      if (k === fields.type && val === true)
        return;
      switch (k) {
        case "mode":
        case "cksum":
        case "ustar":
        case "ustarver":
        case "prefix":
        case "basename":
        case "dirname":
        case "needExtended":
        case "block":
        case "filter":
          return;
        case "rdev":
          if (val === 0)
            return;
          break;
        case "nlink":
        case "dev":
        case "ino":
          k = "SCHILY." + k;
          break;
        default:
          break;
      }
      if (val && typeof val === "object" && !Buffer.isBuffer(val))
        encodeFields(val, k, body, nop);
      else if (val === null || val === undefined)
        return;
      else
        body.push.apply(body, encodeField(k, val, nop));
    });
    return body;
  }
  function encodeField(k, v, nop) {
    if (k.charAt(0) === k.charAt(0).toLowerCase()) {
      var m = k.split(".")[0];
      if (!tar.knownExtended[m])
        k = "NODETAR." + k;
    }
    if (nop && k.charAt(0) !== k.charAt(0).toLowerCase()) {
      return [];
    }
    if (typeof val === "number")
      val = val.toString(10);
    var s = new Buffer(" " + k + "=" + v + "\n"),
        digits = Math.floor(Math.log(s.length) / Math.log(10)) + 1;
    if (s.length + digits >= Math.pow(10, digits))
      digits += 1;
    var len = digits + s.length;
    var lenBuf = new Buffer("" + len);
    if (lenBuf.length + s.length !== len) {
      throw new Error("Bad length calculation\n" + "len=" + len + "\n" + "lenBuf=" + JSON.stringify(lenBuf.toString()) + "\n" + "lenBuf.length=" + lenBuf.length + "\n" + "digits=" + digits + "\n" + "s=" + JSON.stringify(s.toString()) + "\n" + "s.length=" + s.length);
    }
    return [lenBuf, s];
  }
})(require("buffer").Buffer);
