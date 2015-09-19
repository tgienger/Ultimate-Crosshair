/* */ 
(function(process) {
  "use strict";
  var wcwidth = require("./width");
  var _require = require("./utils");
  var padRight = _require.padRight;
  var padCenter = _require.padCenter;
  var padLeft = _require.padLeft;
  var splitIntoLines = _require.splitIntoLines;
  var splitLongWords = _require.splitLongWords;
  var truncateString = _require.truncateString;
  var DEFAULT_HEADING_TRANSFORM = function DEFAULT_HEADING_TRANSFORM(key) {
    return key.toUpperCase();
  };
  var DEFAULT_DATA_TRANSFORM = function DEFAULT_DATA_TRANSFORM(cell, column, index) {
    return cell;
  };
  var DEFAULTS = Object.freeze({
    maxWidth: Infinity,
    minWidth: 0,
    columnSplitter: ' ',
    truncate: false,
    truncateMarker: '…',
    preserveNewLines: false,
    paddingChr: ' ',
    showHeaders: true,
    headingTransform: DEFAULT_HEADING_TRANSFORM,
    dataTransform: DEFAULT_DATA_TRANSFORM
  });
  module.exports = function(items) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    var columnConfigs = options.config || {};
    delete options.config;
    var maxLineWidth = options.maxLineWidth || Infinity;
    if (maxLineWidth === 'auto')
      maxLineWidth = process.stdout.columns || Infinity;
    delete options.maxLineWidth;
    options = mixin({}, DEFAULTS, options);
    options.config = options.config || Object.create(null);
    options.spacing = options.spacing || '\n';
    options.preserveNewLines = !!options.preserveNewLines;
    options.showHeaders = !!options.showHeaders;
    options.columns = options.columns || options.include;
    var columnNames = options.columns || [];
    items = toArray(items, columnNames);
    if (!columnNames.length) {
      items.forEach(function(item) {
        for (var columnName in item) {
          if (columnNames.indexOf(columnName) === -1)
            columnNames.push(columnName);
        }
      });
    }
    var columns = columnNames.reduce(function(columns, columnName) {
      var column = Object.create(options);
      columns[columnName] = mixin(column, columnConfigs[columnName]);
      return columns;
    }, Object.create(null));
    columnNames.forEach(function(columnName) {
      var column = columns[columnName];
      column.name = columnName;
      column.maxWidth = Math.ceil(column.maxWidth);
      column.minWidth = Math.ceil(column.minWidth);
      column.truncate = !!column.truncate;
      column.align = column.align || 'left';
    });
    items = items.map(function(item) {
      var result = Object.create(null);
      columnNames.forEach(function(columnName) {
        result[columnName] = item[columnName] != null ? item[columnName] : '';
        result[columnName] = '' + result[columnName];
        if (columns[columnName].preserveNewLines) {
          result[columnName] = result[columnName].replace(/[^\S\n]/gmi, ' ');
        } else {
          result[columnName] = result[columnName].replace(/\s/gmi, ' ');
        }
      });
      return result;
    });
    columnNames.forEach(function(columnName) {
      var column = columns[columnName];
      items = items.map(function(item, index) {
        var col = Object.create(column);
        item[columnName] = column.dataTransform(item[columnName], col, index);
        var changedKeys = Object.keys(col);
        if (changedKeys.indexOf('name') !== -1) {
          if (column.headingTransform !== DEFAULT_HEADING_TRANSFORM)
            return;
          column.headingTransform = function(heading) {
            return heading;
          };
        }
        changedKeys.forEach(function(key) {
          return column[key] = col[key];
        });
        return item;
      });
    });
    var headers = {};
    if (options.showHeaders) {
      columnNames.forEach(function(columnName) {
        var column = columns[columnName];
        if (!column.showHeaders) {
          headers[columnName] = '';
          return;
        }
        headers[columnName] = column.headingTransform(column.name);
      });
      items.unshift(headers);
    }
    columnNames.forEach(function(columnName) {
      var column = columns[columnName];
      column.width = items.map(function(item) {
        return item[columnName];
      }).reduce(function(min, cur) {
        return Math.max(min, Math.min(column.maxWidth, Math.max(column.minWidth, wcwidth(cur))));
      }, 0);
    });
    columnNames.forEach(function(columnName) {
      var column = columns[columnName];
      items = items.map(function(item) {
        item[columnName] = splitLongWords(item[columnName], column.width, column.truncateMarker);
        return item;
      });
    });
    columnNames.forEach(function(columnName) {
      var column = columns[columnName];
      items = items.map(function(item, index) {
        var cell = item[columnName];
        item[columnName] = splitIntoLines(cell, column.width);
        if (column.truncate && item[columnName].length > 1) {
          item[columnName] = splitIntoLines(cell, column.width - wcwidth(column.truncateMarker));
          var firstLine = item[columnName][0];
          if (!endsWith(firstLine, column.truncateMarker))
            item[columnName][0] += column.truncateMarker;
          item[columnName] = item[columnName].slice(0, 1);
        }
        return item;
      });
    });
    columnNames.forEach(function(columnName) {
      var column = columns[columnName];
      column.width = items.map(function(item) {
        return item[columnName].reduce(function(min, cur) {
          return Math.max(min, Math.min(column.maxWidth, Math.max(column.minWidth, wcwidth(cur))));
        }, 0);
      }).reduce(function(min, cur) {
        return Math.max(min, Math.min(column.maxWidth, Math.max(column.minWidth, cur)));
      }, 0);
    });
    var rows = createRows(items, columns, columnNames, options.paddingChr);
    return rows.reduce(function(output, row) {
      return output.concat(row.reduce(function(rowOut, line) {
        return rowOut.concat(line.join(options.columnSplitter));
      }, []));
    }, []).map(function(line) {
      return truncateString(line, maxLineWidth);
    }).join(options.spacing);
  };
  function createRows(items, columns, columnNames, paddingChr) {
    return items.map(function(item) {
      var row = [];
      var numLines = 0;
      columnNames.forEach(function(columnName) {
        numLines = Math.max(numLines, item[columnName].length);
      });
      var _loop = function(i) {
        row[i] = row[i] || [];
        columnNames.forEach(function(columnName) {
          var column = columns[columnName];
          var val = item[columnName][i] || '';
          if (column.align === 'right')
            row[i].push(padLeft(val, column.width, paddingChr));
          else if (column.align === 'center' || column.align === 'centre')
            row[i].push(padCenter(val, column.width, paddingChr));
          else
            row[i].push(padRight(val, column.width, paddingChr));
        });
      };
      for (var i = 0; i < numLines; i++) {
        _loop(i);
      }
      return row;
    });
  }
  function mixin() {
    if (Object.assign)
      return Object.assign.apply(Object, arguments);
    return ObjectAssign.apply(undefined, arguments);
  }
  function ObjectAssign(target, firstSource) {
    "use strict";
    if (target === undefined || target === null)
      throw new TypeError("Cannot convert first argument to object");
    var to = Object(target);
    var hasPendingException = false;
    var pendingException;
    for (var i = 1; i < arguments.length; i++) {
      var nextSource = arguments[i];
      if (nextSource === undefined || nextSource === null)
        continue;
      var keysArray = Object.keys(Object(nextSource));
      for (var nextIndex = 0,
          len = keysArray.length; nextIndex < len; nextIndex++) {
        var nextKey = keysArray[nextIndex];
        try {
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable)
            to[nextKey] = nextSource[nextKey];
        } catch (e) {
          if (!hasPendingException) {
            hasPendingException = true;
            pendingException = e;
          }
        }
      }
      if (hasPendingException)
        throw pendingException;
    }
    return to;
  }
  function endsWith(target, searchString, position) {
    position = position || target.length;
    position = position - searchString.length;
    var lastIndex = target.lastIndexOf(searchString);
    return lastIndex !== -1 && lastIndex === position;
  }
  function toArray(items, columnNames) {
    if (Array.isArray(items))
      return items;
    var rows = [];
    for (var key in items) {
      var item = {};
      item[columnNames[0] || 'key'] = key;
      item[columnNames[1] || 'value'] = items[key];
      rows.push(item);
    }
    return rows;
  }
})(require("process"));
