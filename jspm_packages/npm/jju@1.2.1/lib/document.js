/* */ 
var assert = require("assert");
var tokenize = require("./parse").tokenize;
var stringify = require("./stringify").stringify;
var analyze = require("./analyze").analyze;
function isObject(x) {
  return typeof(x) === 'object' && x !== null;
}
function value_to_tokenlist(value, stack, options, is_key, indent) {
  options = Object.create(options);
  options._stringify_key = !!is_key;
  if (indent) {
    options._prefix = indent.prefix.map(function(x) {
      return x.raw;
    }).join('');
  }
  if (options._splitMin == null)
    options._splitMin = 0;
  if (options._splitMax == null)
    options._splitMax = 0;
  var stringified = stringify(value, options);
  if (is_key) {
    return [{
      raw: stringified,
      type: 'key',
      stack: stack,
      value: value
    }];
  }
  options._addstack = stack;
  var result = tokenize(stringified, {_addstack: stack});
  result.data = null;
  return result;
}
function arg_to_path(path) {
  if (typeof(path) === 'number')
    path = String(path);
  if (path === '')
    path = [];
  if (typeof(path) === 'string')
    path = path.split('.');
  if (!Array.isArray(path))
    throw Error('Invalid path type, string or array expected');
  return path;
}
function find_element_in_tokenlist(element, lvl, tokens, begin, end) {
  while (tokens[begin].stack[lvl] != element) {
    if (begin++ >= end)
      return false;
  }
  while (tokens[end].stack[lvl] != element) {
    if (end-- < begin)
      return false;
  }
  return [begin, end];
}
function is_whitespace(token_type) {
  return token_type === 'whitespace' || token_type === 'newline' || token_type === 'comment';
}
function find_first_non_ws_token(tokens, begin, end) {
  while (is_whitespace(tokens[begin].type)) {
    if (begin++ >= end)
      return false;
  }
  return begin;
}
function find_last_non_ws_token(tokens, begin, end) {
  while (is_whitespace(tokens[end].type)) {
    if (end-- < begin)
      return false;
  }
  return end;
}
function detect_indent_style(tokens, is_array, begin, end, level) {
  var result = {
    sep1: [],
    sep2: [],
    suffix: [],
    prefix: [],
    newline: []
  };
  if (tokens[end].type === 'separator' && tokens[end].stack.length !== level + 1 && tokens[end].raw !== ',') {
    return result;
  }
  if (tokens[end].type === 'separator')
    end = find_last_non_ws_token(tokens, begin, end - 1);
  if (end === false)
    return result;
  while (tokens[end].stack.length > level)
    end--;
  if (!is_array) {
    while (is_whitespace(tokens[end].type)) {
      if (end < begin)
        return result;
      if (tokens[end].type === 'whitespace') {
        result.sep2.unshift(tokens[end]);
      } else {
        return result;
      }
      end--;
    }
    assert.equal(tokens[end].type, 'separator');
    assert.equal(tokens[end].raw, ':');
    while (is_whitespace(tokens[--end].type)) {
      if (end < begin)
        return result;
      if (tokens[end].type === 'whitespace') {
        result.sep1.unshift(tokens[end]);
      } else {
        return result;
      }
    }
    assert.equal(tokens[end].type, 'key');
    end--;
  }
  while (is_whitespace(tokens[end].type)) {
    if (end < begin)
      return result;
    if (tokens[end].type === 'whitespace') {
      result.prefix.unshift(tokens[end]);
    } else if (tokens[end].type === 'newline') {
      result.newline.unshift(tokens[end]);
      return result;
    } else {
      return result;
    }
    end--;
  }
  return result;
}
function Document(text, options) {
  var self = Object.create(Document.prototype);
  if (options == null)
    options = {};
  var tokens = self._tokens = tokenize(text, options);
  self._data = tokens.data;
  tokens.data = null;
  self._options = options;
  var stats = analyze(text, options);
  if (options.indent == null) {
    options.indent = stats.indent;
  }
  if (options.quote == null) {
    options.quote = stats.quote;
  }
  if (options.quote_keys == null) {
    options.quote_keys = stats.quote_keys;
  }
  if (options.no_trailing_comma == null) {
    options.no_trailing_comma = !stats.has_trailing_comma;
  }
  return self;
}
function check_if_can_be_placed(key, object, is_unset) {
  function error(add) {
    return Error("You can't " + (is_unset ? 'unset' : 'set') + " key '" + key + "'" + add);
  }
  if (!isObject(object)) {
    throw error(' of an non-object');
  }
  if (Array.isArray(object)) {
    if (String(key).match(/^\d+$/)) {
      key = Number(String(key));
      if (object.length < key || (is_unset && object.length === key)) {
        throw error(', out of bounds');
      } else if (is_unset && object.length !== key + 1) {
        throw error(' in the middle of an array');
      } else {
        return true;
      }
    } else {
      throw error(' of an array');
    }
  } else {
    return true;
  }
}
Document.prototype.set = function(path, value) {
  path = arg_to_path(path);
  if (path.length === 0) {
    if (value === undefined)
      throw Error("can't remove root document");
    this._data = value;
    var new_key = false;
  } else {
    var data = this._data;
    for (var i = 0; i < path.length - 1; i++) {
      check_if_can_be_placed(path[i], data, false);
      data = data[path[i]];
    }
    if (i === path.length - 1) {
      check_if_can_be_placed(path[i], data, value === undefined);
    }
    var new_key = !(path[i] in data);
    if (value === undefined) {
      if (Array.isArray(data)) {
        data.pop();
      } else {
        delete data[path[i]];
      }
    } else {
      data[path[i]] = value;
    }
  }
  if (!this._tokens.length)
    this._tokens = [{
      raw: '',
      type: 'literal',
      stack: [],
      value: undefined
    }];
  var position = [find_first_non_ws_token(this._tokens, 0, this._tokens.length - 1), find_last_non_ws_token(this._tokens, 0, this._tokens.length - 1)];
  for (var i = 0; i < path.length - 1; i++) {
    position = find_element_in_tokenlist(path[i], i, this._tokens, position[0], position[1]);
    if (position == false)
      throw Error('internal error, please report this');
  }
  if (path.length === 0) {
    var newtokens = value_to_tokenlist(value, path, this._options);
  } else if (!new_key) {
    var pos_old = position;
    position = find_element_in_tokenlist(path[i], i, this._tokens, position[0], position[1]);
    if (value === undefined && position !== false) {
      var newtokens = [];
      if (!Array.isArray(data)) {
        var pos2 = find_last_non_ws_token(this._tokens, pos_old[0], position[0] - 1);
        assert.equal(this._tokens[pos2].type, 'separator');
        assert.equal(this._tokens[pos2].raw, ':');
        position[0] = pos2;
        var pos2 = find_last_non_ws_token(this._tokens, pos_old[0], position[0] - 1);
        assert.equal(this._tokens[pos2].type, 'key');
        assert.equal(this._tokens[pos2].value, path[path.length - 1]);
        position[0] = pos2;
      }
      var pos2 = find_last_non_ws_token(this._tokens, pos_old[0], position[0] - 1);
      assert.equal(this._tokens[pos2].type, 'separator');
      if (this._tokens[pos2].raw === ',') {
        position[0] = pos2;
      } else {
        pos2 = find_first_non_ws_token(this._tokens, position[1] + 1, pos_old[1]);
        assert.equal(this._tokens[pos2].type, 'separator');
        if (this._tokens[pos2].raw === ',') {
          position[1] = pos2;
        }
      }
    } else {
      var indent = pos2 !== false ? detect_indent_style(this._tokens, Array.isArray(data), pos_old[0], position[1] - 1, i) : {};
      var newtokens = value_to_tokenlist(value, path, this._options, false, indent);
    }
  } else {
    var path_1 = path.slice(0, i);
    var pos2 = find_last_non_ws_token(this._tokens, position[0] + 1, position[1] - 1);
    assert(pos2 !== false);
    var indent = pos2 !== false ? detect_indent_style(this._tokens, Array.isArray(data), position[0] + 1, pos2, i) : {};
    var newtokens = value_to_tokenlist(value, path, this._options, false, indent);
    var prefix = [];
    if (indent.newline && indent.newline.length)
      prefix = prefix.concat(indent.newline);
    if (indent.prefix && indent.prefix.length)
      prefix = prefix.concat(indent.prefix);
    if (!Array.isArray(data)) {
      prefix = prefix.concat(value_to_tokenlist(path[path.length - 1], path_1, this._options, true));
      if (indent.sep1 && indent.sep1.length)
        prefix = prefix.concat(indent.sep1);
      prefix.push({
        raw: ':',
        type: 'separator',
        stack: path_1
      });
      if (indent.sep2 && indent.sep2.length)
        prefix = prefix.concat(indent.sep2);
    }
    newtokens.unshift.apply(newtokens, prefix);
    if (this._tokens[pos2].type === 'separator' && this._tokens[pos2].stack.length === path.length - 1) {
      if (this._tokens[pos2].raw === ',') {
        newtokens.push({
          raw: ',',
          type: 'separator',
          stack: path_1
        });
      }
    } else {
      newtokens.unshift({
        raw: ',',
        type: 'separator',
        stack: path_1
      });
    }
    if (indent.suffix && indent.suffix.length)
      newtokens.push.apply(newtokens, indent.suffix);
    assert.equal(this._tokens[position[1]].type, 'separator');
    position[0] = pos2 + 1;
    position[1] = pos2;
  }
  newtokens.unshift(position[1] - position[0] + 1);
  newtokens.unshift(position[0]);
  this._tokens.splice.apply(this._tokens, newtokens);
  return this;
};
Document.prototype.unset = function(path) {
  return this.set(path, undefined);
};
Document.prototype.get = function(path) {
  path = arg_to_path(path);
  var data = this._data;
  for (var i = 0; i < path.length; i++) {
    if (!isObject(data))
      return undefined;
    data = data[path[i]];
  }
  return data;
};
Document.prototype.has = function(path) {
  path = arg_to_path(path);
  var data = this._data;
  for (var i = 0; i < path.length; i++) {
    if (!isObject(data))
      return false;
    data = data[path[i]];
  }
  return data !== undefined;
};
Document.prototype.update = function(value) {
  var self = this;
  change([], self._data, value);
  return self;
  function change(path, old_data, new_data) {
    if (!isObject(new_data) || !isObject(old_data)) {
      if (new_data !== old_data)
        self.set(path, new_data);
    } else if (Array.isArray(new_data) != Array.isArray(old_data)) {
      self.set(path, new_data);
    } else if (Array.isArray(new_data)) {
      if (new_data.length > old_data.length) {
        for (var i = 0; i < new_data.length; i++) {
          path.push(String(i));
          change(path, old_data[i], new_data[i]);
          path.pop();
        }
      } else {
        for (var i = old_data.length - 1; i >= 0; i--) {
          path.push(String(i));
          change(path, old_data[i], new_data[i]);
          path.pop();
        }
      }
    } else {
      for (var i in new_data) {
        path.push(String(i));
        change(path, old_data[i], new_data[i]);
        path.pop();
      }
      for (var i in old_data) {
        if (i in new_data)
          continue;
        path.push(String(i));
        change(path, old_data[i], new_data[i]);
        path.pop();
      }
    }
  }
};
Document.prototype.toString = function() {
  return this._tokens.map(function(x) {
    return x.raw;
  }).join('');
};
module.exports.Document = Document;
module.exports.update = function updateJSON(source, new_value, options) {
  return Document(source, options).update(new_value).toString();
};
