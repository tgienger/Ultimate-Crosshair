/* */ 
(function(process) {
  var mod_assert = require("assert");
  function ruint8(buffer, endian, offset) {
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    return (buffer[offset]);
  }
  function rgint16(buffer, endian, offset) {
    var val = 0;
    if (endian == 'big') {
      val = buffer[offset] << 8;
      val |= buffer[offset + 1];
    } else {
      val = buffer[offset];
      val |= buffer[offset + 1] << 8;
    }
    return (val);
  }
  function ruint16(buffer, endian, offset) {
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 1 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    return (rgint16(buffer, endian, offset));
  }
  function rgint32(buffer, endian, offset) {
    var val = 0;
    if (endian == 'big') {
      val = buffer[offset + 1] << 16;
      val |= buffer[offset + 2] << 8;
      val |= buffer[offset + 3];
      val = val + (buffer[offset] << 24 >>> 0);
    } else {
      val = buffer[offset + 2] << 16;
      val |= buffer[offset + 1] << 8;
      val |= buffer[offset];
      val = val + (buffer[offset + 3] << 24 >>> 0);
    }
    return (val);
  }
  function ruint32(buffer, endian, offset) {
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 3 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    return (rgint32(buffer, endian, offset));
  }
  function rgint64(buffer, endian, offset) {
    var val = new Array(2);
    if (endian == 'big') {
      val[0] = ruint32(buffer, endian, offset);
      val[1] = ruint32(buffer, endian, offset + 4);
    } else {
      val[0] = ruint32(buffer, endian, offset + 4);
      val[1] = ruint32(buffer, endian, offset);
    }
    return (val);
  }
  function ruint64(buffer, endian, offset) {
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 7 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    return (rgint64(buffer, endian, offset));
  }
  function rsint8(buffer, endian, offset) {
    var neg;
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    neg = buffer[offset] & 0x80;
    if (!neg)
      return (buffer[offset]);
    return ((0xff - buffer[offset] + 1) * -1);
  }
  function rsint16(buffer, endian, offset) {
    var neg,
        val;
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 1 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    val = rgint16(buffer, endian, offset);
    neg = val & 0x8000;
    if (!neg)
      return (val);
    return ((0xffff - val + 1) * -1);
  }
  function rsint32(buffer, endian, offset) {
    var neg,
        val;
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 3 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    val = rgint32(buffer, endian, offset);
    neg = val & 0x80000000;
    if (!neg)
      return (val);
    return ((0xffffffff - val + 1) * -1);
  }
  function rsint64(buffer, endian, offset) {
    var neg,
        val;
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 3 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    val = rgint64(buffer, endian, offset);
    neg = val[0] & 0x80000000;
    if (!neg)
      return (val);
    val[0] = (0xffffffff - val[0]) * -1;
    val[1] = (0xffffffff - val[1] + 1) * -1;
    mod_assert.ok(val[1] <= 0x100000000);
    if (val[1] == -0x100000000) {
      val[1] = 0;
      val[0]--;
    }
    return (val);
  }
  function rfloat(buffer, endian, offset) {
    var bytes = [];
    var sign,
        exponent,
        mantissa,
        val;
    var bias = 127;
    var maxexp = 0xff;
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 3 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    if (endian == 'big') {
      bytes[0] = buffer[offset];
      bytes[1] = buffer[offset + 1];
      bytes[2] = buffer[offset + 2];
      bytes[3] = buffer[offset + 3];
    } else {
      bytes[3] = buffer[offset];
      bytes[2] = buffer[offset + 1];
      bytes[1] = buffer[offset + 2];
      bytes[0] = buffer[offset + 3];
    }
    sign = bytes[0] & 0x80;
    exponent = (bytes[0] & 0x7f) << 1;
    exponent |= (bytes[1] & 0x80) >>> 7;
    mantissa = (bytes[1] & 0x7f) << 16;
    mantissa |= bytes[2] << 8;
    mantissa |= bytes[3];
    if (!sign && exponent == maxexp && mantissa === 0)
      return (Number.POSITIVE_INFINITY);
    if (sign && exponent == maxexp && mantissa === 0)
      return (Number.NEGATIVE_INFINITY);
    if (exponent == maxexp && mantissa !== 0)
      return (Number.NaN);
    if (exponent === 0 && mantissa === 0)
      return (0);
    exponent -= bias;
    if (exponent == -bias) {
      exponent++;
      val = 0;
    } else {
      val = 1;
    }
    val = (val + mantissa * Math.pow(2, -23)) * Math.pow(2, exponent);
    if (sign)
      val *= -1;
    return (val);
  }
  function rdouble(buffer, endian, offset) {
    var bytes = [];
    var sign,
        exponent,
        mantissa,
        val,
        lowmant;
    var bias = 1023;
    var maxexp = 0x7ff;
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 7 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    if (endian == 'big') {
      bytes[0] = buffer[offset];
      bytes[1] = buffer[offset + 1];
      bytes[2] = buffer[offset + 2];
      bytes[3] = buffer[offset + 3];
      bytes[4] = buffer[offset + 4];
      bytes[5] = buffer[offset + 5];
      bytes[6] = buffer[offset + 6];
      bytes[7] = buffer[offset + 7];
    } else {
      bytes[7] = buffer[offset];
      bytes[6] = buffer[offset + 1];
      bytes[5] = buffer[offset + 2];
      bytes[4] = buffer[offset + 3];
      bytes[3] = buffer[offset + 4];
      bytes[2] = buffer[offset + 5];
      bytes[1] = buffer[offset + 6];
      bytes[0] = buffer[offset + 7];
    }
    sign = bytes[0] & 0x80;
    exponent = (bytes[0] & 0x7f) << 4;
    exponent |= (bytes[1] & 0xf0) >>> 4;
    lowmant = bytes[7];
    lowmant |= bytes[6] << 8;
    lowmant |= bytes[5] << 16;
    mantissa = bytes[4];
    mantissa |= bytes[3] << 8;
    mantissa |= bytes[2] << 16;
    mantissa |= (bytes[1] & 0x0f) << 24;
    mantissa *= Math.pow(2, 24);
    mantissa += lowmant;
    if (!sign && exponent == maxexp && mantissa === 0)
      return (Number.POSITIVE_INFINITY);
    if (sign && exponent == maxexp && mantissa === 0)
      return (Number.NEGATIVE_INFINITY);
    if (exponent == maxexp && mantissa !== 0)
      return (Number.NaN);
    if (exponent === 0 && mantissa === 0)
      return (0);
    exponent -= bias;
    if (exponent == -bias) {
      exponent++;
      val = 0;
    } else {
      val = 1;
    }
    val = (val + mantissa * Math.pow(2, -52)) * Math.pow(2, exponent);
    if (sign)
      val *= -1;
    return (val);
  }
  function prepuint(value, max) {
    if (typeof(value) != 'number')
      throw (new (Error('cannot write a non-number as a number')));
    if (value < 0)
      throw (new Error('specified a negative value for writing an ' + 'unsigned value'));
    if (value > max)
      throw (new Error('value is larger than maximum value for ' + 'type'));
    if (Math.floor(value) !== value)
      throw (new Error('value has a fractional component'));
    return (value);
  }
  function wuint8(value, endian, buffer, offset) {
    var val;
    if (value === undefined)
      throw (new Error('missing value'));
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    val = prepuint(value, 0xff);
    buffer[offset] = val;
  }
  function wgint16(val, endian, buffer, offset) {
    if (endian == 'big') {
      buffer[offset] = (val & 0xff00) >>> 8;
      buffer[offset + 1] = val & 0x00ff;
    } else {
      buffer[offset + 1] = (val & 0xff00) >>> 8;
      buffer[offset] = val & 0x00ff;
    }
  }
  function wuint16(value, endian, buffer, offset) {
    var val;
    if (value === undefined)
      throw (new Error('missing value'));
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 1 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    val = prepuint(value, 0xffff);
    wgint16(val, endian, buffer, offset);
  }
  function wgint32(val, endian, buffer, offset) {
    if (endian == 'big') {
      buffer[offset] = (val - (val & 0x00ffffff)) / Math.pow(2, 24);
      buffer[offset + 1] = (val >>> 16) & 0xff;
      buffer[offset + 2] = (val >>> 8) & 0xff;
      buffer[offset + 3] = val & 0xff;
    } else {
      buffer[offset + 3] = (val - (val & 0x00ffffff)) / Math.pow(2, 24);
      buffer[offset + 2] = (val >>> 16) & 0xff;
      buffer[offset + 1] = (val >>> 8) & 0xff;
      buffer[offset] = val & 0xff;
    }
  }
  function wuint32(value, endian, buffer, offset) {
    var val;
    if (value === undefined)
      throw (new Error('missing value'));
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 3 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    val = prepuint(value, 0xffffffff);
    wgint32(val, endian, buffer, offset);
  }
  function wgint64(value, endian, buffer, offset) {
    if (endian == 'big') {
      wgint32(value[0], endian, buffer, offset);
      wgint32(value[1], endian, buffer, offset + 4);
    } else {
      wgint32(value[0], endian, buffer, offset + 4);
      wgint32(value[1], endian, buffer, offset);
    }
  }
  function wuint64(value, endian, buffer, offset) {
    if (value === undefined)
      throw (new Error('missing value'));
    if (!(value instanceof Array))
      throw (new Error('value must be an array'));
    if (value.length != 2)
      throw (new Error('value must be an array of length 2'));
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 7 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    prepuint(value[0], 0xffffffff);
    prepuint(value[1], 0xffffffff);
    wgint64(value, endian, buffer, offset);
  }
  function prepsint(value, max, min) {
    if (typeof(value) != 'number')
      throw (new (Error('cannot write a non-number as a number')));
    if (value > max)
      throw (new Error('value larger than maximum allowed value'));
    if (value < min)
      throw (new Error('value smaller than minimum allowed value'));
    if (Math.floor(value) !== value)
      throw (new Error('value has a fractional component'));
    return (value);
  }
  function wsint8(value, endian, buffer, offset) {
    var val;
    if (value === undefined)
      throw (new Error('missing value'));
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    val = prepsint(value, 0x7f, -0x80);
    if (val >= 0)
      wuint8(val, endian, buffer, offset);
    else
      wuint8(0xff + val + 1, endian, buffer, offset);
  }
  function wsint16(value, endian, buffer, offset) {
    var val;
    if (value === undefined)
      throw (new Error('missing value'));
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 1 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    val = prepsint(value, 0x7fff, -0x8000);
    if (val >= 0)
      wgint16(val, endian, buffer, offset);
    else
      wgint16(0xffff + val + 1, endian, buffer, offset);
  }
  function wsint32(value, endian, buffer, offset) {
    var val;
    if (value === undefined)
      throw (new Error('missing value'));
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 3 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    val = prepsint(value, 0x7fffffff, -0x80000000);
    if (val >= 0)
      wgint32(val, endian, buffer, offset);
    else
      wgint32(0xffffffff + val + 1, endian, buffer, offset);
  }
  function wsint64(value, endian, buffer, offset) {
    var vzpos,
        vopos;
    var vals = new Array(2);
    if (value === undefined)
      throw (new Error('missing value'));
    if (!(value instanceof Array))
      throw (new Error('value must be an array'));
    if (value.length != 2)
      throw (new Error('value must be an array of length 2'));
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 7 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    vzpos = (value[0] * Number.POSITIVE_INFINITY) == Number.POSITIVE_INFINITY;
    vopos = (value[1] * Number.POSITIVE_INFINITY) == Number.POSITIVE_INFINITY;
    if (value[0] != 0 && value[1] != 0 && vzpos != vopos)
      throw (new Error('Both entries in the array must have ' + 'the same sign'));
    if (vzpos) {
      prepuint(value[0], 0x7fffffff);
      prepuint(value[1], 0xffffffff);
    } else {
      prepsint(value[0], 0, -0x80000000);
      prepsint(value[1], 0, -0xffffffff);
      if (value[0] == -0x80000000 && value[1] != 0)
        throw (new Error('value smaller than minimum ' + 'allowed value'));
    }
    if (value[0] < 0 || value[1] < 0) {
      vals[0] = 0xffffffff - Math.abs(value[0]);
      vals[1] = 0x100000000 - Math.abs(value[1]);
      if (vals[1] == 0x100000000) {
        vals[1] = 0;
        vals[0]++;
      }
    } else {
      vals[0] = value[0];
      vals[1] = value[1];
    }
    wgint64(vals, endian, buffer, offset);
  }
  function log2(value) {
    return (Math.log(value) / Math.log(2));
  }
  function intexp(value) {
    return (Math.floor(log2(value)));
  }
  function fracexp(value) {
    return (Math.floor(log2(value)));
  }
  function wfloat(value, endian, buffer, offset) {
    var sign,
        exponent,
        mantissa,
        ebits;
    var bytes = [];
    if (value === undefined)
      throw (new Error('missing value'));
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 3 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    if (isNaN(value)) {
      sign = 0;
      exponent = 0xff;
      mantissa = 23;
    } else if (value == Number.POSITIVE_INFINITY) {
      sign = 0;
      exponent = 0xff;
      mantissa = 0;
    } else if (value == Number.NEGATIVE_INFINITY) {
      sign = 1;
      exponent = 0xff;
      mantissa = 0;
    } else {
      if (value < 0) {
        sign = 1;
        value = Math.abs(value);
      } else {
        sign = 0;
      }
      if (value < 1)
        ebits = fracexp(value);
      else
        ebits = intexp(value);
      if (ebits <= -127) {
        exponent = 0;
        mantissa = (value * Math.pow(2, 149)) & 0x7fffff;
      } else {
        exponent = 127 + ebits;
        mantissa = value * Math.pow(2, 23 - ebits);
        mantissa &= 0x7fffff;
      }
    }
    bytes[0] = sign << 7 | (exponent & 0xfe) >>> 1;
    bytes[1] = (exponent & 0x01) << 7 | (mantissa & 0x7f0000) >>> 16;
    bytes[2] = (mantissa & 0x00ff00) >>> 8;
    bytes[3] = mantissa & 0x0000ff;
    if (endian == 'big') {
      buffer[offset] = bytes[0];
      buffer[offset + 1] = bytes[1];
      buffer[offset + 2] = bytes[2];
      buffer[offset + 3] = bytes[3];
    } else {
      buffer[offset] = bytes[3];
      buffer[offset + 1] = bytes[2];
      buffer[offset + 2] = bytes[1];
      buffer[offset + 3] = bytes[0];
    }
  }
  function wdouble(value, endian, buffer, offset) {
    var sign,
        exponent,
        mantissa,
        ebits;
    var bytes = [];
    if (value === undefined)
      throw (new Error('missing value'));
    if (endian === undefined)
      throw (new Error('missing endian'));
    if (buffer === undefined)
      throw (new Error('missing buffer'));
    if (offset === undefined)
      throw (new Error('missing offset'));
    if (offset + 7 >= buffer.length)
      throw (new Error('Trying to read beyond buffer length'));
    if (isNaN(value)) {
      sign = 0;
      exponent = 0x7ff;
      mantissa = 23;
    } else if (value == Number.POSITIVE_INFINITY) {
      sign = 0;
      exponent = 0x7ff;
      mantissa = 0;
    } else if (value == Number.NEGATIVE_INFINITY) {
      sign = 1;
      exponent = 0x7ff;
      mantissa = 0;
    } else {
      if (value < 0) {
        sign = 1;
        value = Math.abs(value);
      } else {
        sign = 0;
      }
      if (value < 1)
        ebits = fracexp(value);
      else
        ebits = intexp(value);
      if (value <= 2.225073858507201e-308 || ebits <= -1023) {
        exponent = 0;
        mantissa = value * Math.pow(2, 1023) * Math.pow(2, 51);
        mantissa %= Math.pow(2, 52);
      } else {
        if (ebits > 1023)
          ebits = 1023;
        exponent = 1023 + ebits;
        mantissa = value * Math.pow(2, -ebits);
        mantissa *= Math.pow(2, 52);
        mantissa %= Math.pow(2, 52);
      }
    }
    bytes[7] = mantissa & 0xff;
    bytes[6] = (mantissa >>> 8) & 0xff;
    bytes[5] = (mantissa >>> 16) & 0xff;
    mantissa = (mantissa - (mantissa & 0xffffff)) / Math.pow(2, 24);
    bytes[4] = mantissa & 0xff;
    bytes[3] = (mantissa >>> 8) & 0xff;
    bytes[2] = (mantissa >>> 16) & 0xff;
    bytes[1] = (exponent & 0x00f) << 4 | mantissa >>> 24;
    bytes[0] = (sign << 7) | (exponent & 0x7f0) >>> 4;
    if (endian == 'big') {
      buffer[offset] = bytes[0];
      buffer[offset + 1] = bytes[1];
      buffer[offset + 2] = bytes[2];
      buffer[offset + 3] = bytes[3];
      buffer[offset + 4] = bytes[4];
      buffer[offset + 5] = bytes[5];
      buffer[offset + 6] = bytes[6];
      buffer[offset + 7] = bytes[7];
    } else {
      buffer[offset + 7] = bytes[0];
      buffer[offset + 6] = bytes[1];
      buffer[offset + 5] = bytes[2];
      buffer[offset + 4] = bytes[3];
      buffer[offset + 3] = bytes[4];
      buffer[offset + 2] = bytes[5];
      buffer[offset + 1] = bytes[6];
      buffer[offset] = bytes[7];
    }
  }
  exports.ruint8 = ruint8;
  exports.ruint16 = ruint16;
  exports.ruint32 = ruint32;
  exports.ruint64 = ruint64;
  exports.wuint8 = wuint8;
  exports.wuint16 = wuint16;
  exports.wuint32 = wuint32;
  exports.wuint64 = wuint64;
  exports.rsint8 = rsint8;
  exports.rsint16 = rsint16;
  exports.rsint32 = rsint32;
  exports.rsint64 = rsint64;
  exports.wsint8 = wsint8;
  exports.wsint16 = wsint16;
  exports.wsint32 = wsint32;
  exports.wsint64 = wsint64;
  exports.rfloat = rfloat;
  exports.rdouble = rdouble;
  exports.wfloat = wfloat;
  exports.wdouble = wdouble;
})(require("process"));
