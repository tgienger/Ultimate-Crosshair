/* */ 
(function(Buffer) {
  var mod_ctf = require("./ctf");
  var mod_ctio = require("./ctio");
  var mod_assert = require("assert");
  var deftypes = {
    'uint8_t': {
      read: ctReadUint8,
      write: ctWriteUint8
    },
    'uint16_t': {
      read: ctReadUint16,
      write: ctWriteUint16
    },
    'uint32_t': {
      read: ctReadUint32,
      write: ctWriteUint32
    },
    'uint64_t': {
      read: ctReadUint64,
      write: ctWriteUint64
    },
    'int8_t': {
      read: ctReadSint8,
      write: ctWriteSint8
    },
    'int16_t': {
      read: ctReadSint16,
      write: ctWriteSint16
    },
    'int32_t': {
      read: ctReadSint32,
      write: ctWriteSint32
    },
    'int64_t': {
      read: ctReadSint64,
      write: ctWriteSint64
    },
    'float': {
      read: ctReadFloat,
      write: ctWriteFloat
    },
    'double': {
      read: ctReadDouble,
      write: ctWriteDouble
    },
    'char': {
      read: ctReadChar,
      write: ctWriteChar
    },
    'char[]': {
      read: ctReadCharArray,
      write: ctWriteCharArray
    }
  };
  function ctReadUint8(endian, buffer, offset) {
    var val = mod_ctio.ruint8(buffer, endian, offset);
    return ({
      value: val,
      size: 1
    });
  }
  function ctReadUint16(endian, buffer, offset) {
    var val = mod_ctio.ruint16(buffer, endian, offset);
    return ({
      value: val,
      size: 2
    });
  }
  function ctReadUint32(endian, buffer, offset) {
    var val = mod_ctio.ruint32(buffer, endian, offset);
    return ({
      value: val,
      size: 4
    });
  }
  function ctReadUint64(endian, buffer, offset) {
    var val = mod_ctio.ruint64(buffer, endian, offset);
    return ({
      value: val,
      size: 8
    });
  }
  function ctReadSint8(endian, buffer, offset) {
    var val = mod_ctio.rsint8(buffer, endian, offset);
    return ({
      value: val,
      size: 1
    });
  }
  function ctReadSint16(endian, buffer, offset) {
    var val = mod_ctio.rsint16(buffer, endian, offset);
    return ({
      value: val,
      size: 2
    });
  }
  function ctReadSint32(endian, buffer, offset) {
    var val = mod_ctio.rsint32(buffer, endian, offset);
    return ({
      value: val,
      size: 4
    });
  }
  function ctReadSint64(endian, buffer, offset) {
    var val = mod_ctio.rsint64(buffer, endian, offset);
    return ({
      value: val,
      size: 8
    });
  }
  function ctReadFloat(endian, buffer, offset) {
    var val = mod_ctio.rfloat(buffer, endian, offset);
    return ({
      value: val,
      size: 4
    });
  }
  function ctReadDouble(endian, buffer, offset) {
    var val = mod_ctio.rdouble(buffer, endian, offset);
    return ({
      value: val,
      size: 8
    });
  }
  function ctReadChar(endian, buffer, offset) {
    var res = new Buffer(1);
    res[0] = mod_ctio.ruint8(buffer, endian, offset);
    return ({
      value: res,
      size: 1
    });
  }
  function ctReadCharArray(length, endian, buffer, offset) {
    var ii;
    var res = new Buffer(length);
    for (ii = 0; ii < length; ii++)
      res[ii] = mod_ctio.ruint8(buffer, endian, offset + ii);
    return ({
      value: res,
      size: length
    });
  }
  function ctWriteUint8(value, endian, buffer, offset) {
    mod_ctio.wuint8(value, endian, buffer, offset);
    return (1);
  }
  function ctWriteUint16(value, endian, buffer, offset) {
    mod_ctio.wuint16(value, endian, buffer, offset);
    return (2);
  }
  function ctWriteUint32(value, endian, buffer, offset) {
    mod_ctio.wuint32(value, endian, buffer, offset);
    return (4);
  }
  function ctWriteUint64(value, endian, buffer, offset) {
    mod_ctio.wuint64(value, endian, buffer, offset);
    return (8);
  }
  function ctWriteSint8(value, endian, buffer, offset) {
    mod_ctio.wsint8(value, endian, buffer, offset);
    return (1);
  }
  function ctWriteSint16(value, endian, buffer, offset) {
    mod_ctio.wsint16(value, endian, buffer, offset);
    return (2);
  }
  function ctWriteSint32(value, endian, buffer, offset) {
    mod_ctio.wsint32(value, endian, buffer, offset);
    return (4);
  }
  function ctWriteSint64(value, endian, buffer, offset) {
    mod_ctio.wsint64(value, endian, buffer, offset);
    return (8);
  }
  function ctWriteFloat(value, endian, buffer, offset) {
    mod_ctio.wfloat(value, endian, buffer, offset);
    return (4);
  }
  function ctWriteDouble(value, endian, buffer, offset) {
    mod_ctio.wdouble(value, endian, buffer, offset);
    return (8);
  }
  function ctWriteChar(value, endian, buffer, offset) {
    if (!(value instanceof Buffer))
      throw (new Error('Input must be a buffer'));
    mod_ctio.ruint8(value[0], endian, buffer, offset);
    return (1);
  }
  function ctWriteCharArray(value, length, endian, buffer, offset) {
    var ii;
    if (!(value instanceof Buffer))
      throw (new Error('Input must be a buffer'));
    if (value.length > length)
      throw (new Error('value length greater than array length'));
    for (ii = 0; ii < value.length && ii < length; ii++)
      mod_ctio.wuint8(value[ii], endian, buffer, offset + ii);
    for (; ii < length; ii++)
      mod_ctio.wuint8(0, endian, offset + ii);
    return (length);
  }
  function ctGetBasicTypes() {
    var ret = {};
    var key;
    for (key in deftypes)
      ret[key] = deftypes[key];
    return (ret);
  }
  function ctParseType(str) {
    var begInd,
        endInd;
    var type,
        len;
    if (typeof(str) != 'string')
      throw (new Error('type must be a Javascript string'));
    endInd = str.lastIndexOf(']');
    if (endInd == -1) {
      if (str.lastIndexOf('[') != -1)
        throw (new Error('found invalid type with \'[\' but ' + 'no corresponding \']\''));
      return ({type: str});
    }
    begInd = str.lastIndexOf('[');
    if (begInd == -1)
      throw (new Error('found invalid type with \']\' but ' + 'no corresponding \'[\''));
    if (begInd >= endInd)
      throw (new Error('malformed type, \']\' appears before \'[\''));
    type = str.substring(0, begInd);
    len = str.substring(begInd + 1, endInd);
    return ({
      type: type,
      len: len
    });
  }
  function ctCheckReq(def, types, fields) {
    var ii,
        jj;
    var req,
        keys,
        key;
    var found = {};
    if (!(def instanceof Array))
      throw (new Error('definition is not an array'));
    if (def.length === 0)
      throw (new Error('definition must have at least one element'));
    for (ii = 0; ii < def.length; ii++) {
      req = def[ii];
      if (!(req instanceof Object))
        throw (new Error('definition must be an array of' + 'objects'));
      keys = Object.keys(req);
      if (keys.length != 1)
        throw (new Error('definition entry must only have ' + 'one key'));
      if (keys[0] in found)
        throw (new Error('Specified name already ' + 'specified: ' + keys[0]));
      if (!('type' in req[keys[0]]))
        throw (new Error('missing required type definition'));
      key = ctParseType(req[keys[0]]['type']);
      while (key['len'] !== undefined) {
        if (isNaN(parseInt(key['len'], 10))) {
          if (!(key['len'] in found))
            throw (new Error('Given an array ' + 'length without a matching type'));
        }
        key = ctParseType(key['type']);
      }
      if (!(key['type'] in types))
        throw (new Error('type not found or typdefed: ' + key['type']));
      if (fields !== undefined) {
        for (jj = 0; jj < fields.length; jj++) {
          if (!(fields[jj] in req[keys[0]]))
            throw (new Error('Missing required ' + 'field: ' + fields[jj]));
        }
      }
      found[keys[0]] = true;
    }
  }
  function CTypeParser(conf) {
    if (!conf)
      throw (new Error('missing required argument'));
    if (!('endian' in conf))
      throw (new Error('missing required endian value'));
    if (conf['endian'] != 'big' && conf['endian'] != 'little')
      throw (new Error('Invalid endian type'));
    if ('char-type' in conf && (conf['char-type'] != 'uint8' && conf['char-type'] != 'int8'))
      throw (new Error('invalid option for char-type: ' + conf['char-type']));
    this.endian = conf['endian'];
    this.types = ctGetBasicTypes();
    if ('char-type' in conf && conf['char-type'] == 'uint8')
      this.types['char'] = this.types['uint8_t'];
    if ('char-type' in conf && conf['char-type'] == 'int8')
      this.types['char'] = this.types['int8_t'];
  }
  CTypeParser.prototype.setEndian = function(endian) {
    if (endian != 'big' && endian != 'little')
      throw (new Error('invalid endian type, must be big or ' + 'little'));
    this.endian = endian;
  };
  CTypeParser.prototype.getEndian = function() {
    return (this.endian);
  };
  CTypeParser.prototype.typedef = function(name, value) {
    var type;
    if (name === undefined)
      throw (new (Error('missing required typedef argument: name')));
    if (value === undefined)
      throw (new (Error('missing required typedef argument: value')));
    if (typeof(name) != 'string')
      throw (new (Error('the name of a type must be a string')));
    type = ctParseType(name);
    if (type['len'] !== undefined)
      throw (new Error('Cannot have an array in the typedef name'));
    if (name in this.types)
      throw (new Error('typedef name already present: ' + name));
    if (typeof(value) != 'string' && !(value instanceof Array))
      throw (new Error('typedef value must either be a string or ' + 'struct'));
    if (typeof(value) == 'string') {
      type = ctParseType(value);
      if (type['len'] !== undefined) {
        if (isNaN(parseInt(type['len'], 10)))
          throw (new (Error('typedef value must use ' + 'fixed size array when outside of a ' + 'struct')));
      }
      this.types[name] = value;
    } else {
      ctCheckReq(value, this.types);
      this.types[name] = value;
    }
  };
  CTypeParser.prototype.lstypes = function() {
    var key;
    var ret = {};
    for (key in this.types) {
      if (key in deftypes)
        continue;
      ret[key] = this.types[key];
    }
    return (ret);
  };
  function ctResolveArray(str, values) {
    var ret = '';
    var type = ctParseType(str);
    while (type['len'] !== undefined) {
      if (isNaN(parseInt(type['len'], 10))) {
        if (typeof(values[type['len']]) != 'number')
          throw (new Error('cannot sawp in non-number ' + 'for array value'));
        ret = '[' + values[type['len']] + ']' + ret;
      } else {
        ret = '[' + type['len'] + ']' + ret;
      }
      type = ctParseType(type['type']);
    }
    ret = type['type'] + ret;
    return (ret);
  }
  CTypeParser.prototype.resolveTypedef = function(type, dispatch, buffer, offset, value) {
    var pt;
    mod_assert.ok(type in this.types);
    if (typeof(this.types[type]) == 'string') {
      pt = ctParseType(this.types[type]);
      if (dispatch == 'read')
        return (this.readEntry(pt, buffer, offset));
      else if (dispatch == 'write')
        return (this.writeEntry(value, pt, buffer, offset));
      else
        throw (new Error('invalid dispatch type to ' + 'resolveTypedef'));
    } else {
      if (dispatch == 'read')
        return (this.readStruct(this.types[type], buffer, offset));
      else if (dispatch == 'write')
        return (this.writeStruct(value, this.types[type], buffer, offset));
      else
        throw (new Error('invalid dispatch type to ' + 'resolveTypedef'));
    }
  };
  CTypeParser.prototype.readEntry = function(type, buffer, offset) {
    var parse,
        len;
    if (type['len'] !== undefined) {
      len = parseInt(type['len'], 10);
      if (isNaN(len))
        throw (new Error('somehow got a non-numeric length'));
      if (type['type'] == 'char')
        parse = this.types['char[]']['read'](len, this.endian, buffer, offset);
      else
        parse = this.readArray(type['type'], len, buffer, offset);
    } else {
      if (type['type'] in deftypes)
        parse = this.types[type['type']]['read'](this.endian, buffer, offset);
      else
        parse = this.resolveTypedef(type['type'], 'read', buffer, offset);
    }
    return (parse);
  };
  CTypeParser.prototype.readArray = function(type, length, buffer, offset) {
    var ii,
        ent,
        pt;
    var baseOffset = offset;
    var ret = new Array(length);
    pt = ctParseType(type);
    for (ii = 0; ii < length; ii++) {
      ent = this.readEntry(pt, buffer, offset);
      offset += ent['size'];
      ret[ii] = ent['value'];
    }
    return ({
      value: ret,
      size: offset - baseOffset
    });
  };
  CTypeParser.prototype.readStruct = function(def, buffer, offset) {
    var parse,
        ii,
        type,
        entry,
        key;
    var baseOffset = offset;
    var ret = {};
    for (ii = 0; ii < def.length; ii++) {
      key = Object.keys(def[ii])[0];
      entry = def[ii][key];
      type = ctParseType(ctResolveArray(entry['type'], ret));
      if ('offset' in entry)
        offset = baseOffset + entry['offset'];
      parse = this.readEntry(type, buffer, offset);
      offset += parse['size'];
      ret[key] = parse['value'];
    }
    return ({
      value: ret,
      size: (offset - baseOffset)
    });
  };
  CTypeParser.prototype.readData = function(def, buffer, offset) {
    if (def === undefined)
      throw (new Error('missing definition for what we should be' + 'parsing'));
    if (buffer === undefined)
      throw (new Error('missing buffer for what we should be ' + 'parsing'));
    if (offset === undefined)
      throw (new Error('missing offset for what we should be ' + 'parsing'));
    ctCheckReq(def, this.types);
    return (this.readStruct(def, buffer, offset)['value']);
  };
  CTypeParser.prototype.writeArray = function(value, type, length, buffer, offset) {
    var ii,
        pt;
    var baseOffset = offset;
    if (!(value instanceof Array))
      throw (new Error('asked to write an array, but value is not ' + 'an array'));
    if (value.length != length)
      throw (new Error('asked to write array of length ' + length + ' but that does not match value length: ' + value.length));
    pt = ctParseType(type);
    for (ii = 0; ii < length; ii++)
      offset += this.writeEntry(value[ii], pt, buffer, offset);
    return (offset - baseOffset);
  };
  CTypeParser.prototype.writeEntry = function(value, type, buffer, offset) {
    var len,
        ret;
    if (type['len'] !== undefined) {
      len = parseInt(type['len'], 10);
      if (isNaN(len))
        throw (new Error('somehow got a non-numeric length'));
      if (type['type'] == 'char')
        ret = this.types['char[]']['write'](value, len, this.endian, buffer, offset);
      else
        ret = this.writeArray(value, type['type'], len, buffer, offset);
    } else {
      if (type['type'] in deftypes)
        ret = this.types[type['type']]['write'](value, this.endian, buffer, offset);
      else
        ret = this.resolveTypedef(type['type'], 'write', buffer, offset, value);
    }
    return (ret);
  };
  CTypeParser.prototype.writeStruct = function(value, def, buffer, offset) {
    var ii,
        entry,
        type,
        key;
    var baseOffset = offset;
    var vals = {};
    for (ii = 0; ii < def.length; ii++) {
      key = Object.keys(def[ii])[0];
      entry = def[ii][key];
      type = ctParseType(ctResolveArray(entry['type'], vals));
      if ('offset' in entry)
        offset = baseOffset + entry['offset'];
      offset += this.writeEntry(value[ii], type, buffer, offset);
      vals[key] = value[ii];
    }
    return (offset);
  };
  function getValues(def) {
    var ii,
        out,
        key;
    out = [];
    for (ii = 0; ii < def.length; ii++) {
      key = Object.keys(def[ii])[0];
      mod_assert.ok('value' in def[ii][key]);
      out.push(def[ii][key]['value']);
    }
    return (out);
  }
  CTypeParser.prototype.writeData = function(def, buffer, offset, values) {
    var hv;
    if (def === undefined)
      throw (new Error('missing definition for what we should be' + 'parsing'));
    if (buffer === undefined)
      throw (new Error('missing buffer for what we should be ' + 'parsing'));
    if (offset === undefined)
      throw (new Error('missing offset for what we should be ' + 'parsing'));
    hv = (values != null && values != undefined);
    if (hv) {
      if (!Array.isArray(values))
        throw (new Error('missing values for writing'));
      ctCheckReq(def, this.types);
    } else {
      ctCheckReq(def, this.types, ['value']);
    }
    this.writeStruct(hv ? values : getValues(def), def, buffer, offset);
  };
  function toAbs64(val) {
    if (val === undefined)
      throw (new Error('missing required arg: value'));
    if (!Array.isArray(val))
      throw (new Error('value must be an array'));
    if (val.length != 2)
      throw (new Error('value must be an array of length 2'));
    if (val[0] >= 0x100000)
      throw (new Error('value would become approximated'));
    return (val[0] * Math.pow(2, 32) + val[1]);
  }
  function toApprox64(val) {
    if (val === undefined)
      throw (new Error('missing required arg: value'));
    if (!Array.isArray(val))
      throw (new Error('value must be an array'));
    if (val.length != 2)
      throw (new Error('value must be an array of length 2'));
    return (Math.pow(2, 32) * val[0] + val[1]);
  }
  function parseCTF(json, conf) {
    var ctype = new CTypeParser(conf);
    mod_ctf.ctfParseJson(json, ctype);
    return (ctype);
  }
  exports.Parser = CTypeParser;
  exports.toAbs64 = toAbs64;
  exports.toApprox64 = toApprox64;
  exports.parseCTF = parseCTF;
  exports.ruint8 = mod_ctio.ruint8;
  exports.ruint16 = mod_ctio.ruint16;
  exports.ruint32 = mod_ctio.ruint32;
  exports.ruint64 = mod_ctio.ruint64;
  exports.wuint8 = mod_ctio.wuint8;
  exports.wuint16 = mod_ctio.wuint16;
  exports.wuint32 = mod_ctio.wuint32;
  exports.wuint64 = mod_ctio.wuint64;
  exports.rsint8 = mod_ctio.rsint8;
  exports.rsint16 = mod_ctio.rsint16;
  exports.rsint32 = mod_ctio.rsint32;
  exports.rsint64 = mod_ctio.rsint64;
  exports.wsint8 = mod_ctio.wsint8;
  exports.wsint16 = mod_ctio.wsint16;
  exports.wsint32 = mod_ctio.wsint32;
  exports.wsint64 = mod_ctio.wsint64;
  exports.rfloat = mod_ctio.rfloat;
  exports.rdouble = mod_ctio.rdouble;
  exports.wfloat = mod_ctio.wfloat;
  exports.wdouble = mod_ctio.wdouble;
})(require("buffer").Buffer);
