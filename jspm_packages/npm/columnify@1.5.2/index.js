/* */ 
(function(process) {
  "use strict";
  const wcwidth = require("./width");
  const {padRight,
    padCenter,
    padLeft,
    splitIntoLines,
    splitLongWords,
    truncateString} = require("./utils");
  const DEFAULT_HEADING_TRANSFORM = (key) => key.toUpperCase();
  const DEFAULT_DATA_TRANSFORM = (cell, column, index) => cell;
  const DEFAULTS = Object.freeze({
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
  module.exports = function(items, options = {}) {
    let columnConfigs = options.config || {};
    delete options.config;
    let maxLineWidth = options.maxLineWidth || Infinity;
    if (maxLineWidth === 'auto')
      maxLineWidth = process.stdout.columns || Infinity;
    delete options.maxLineWidth;
    options = mixin({}, DEFAULTS, options);
    options.config = options.config || Object.create(null);
    options.spacing = options.spacing || '\n';
    options.preserveNewLines = !!options.preserveNewLines;
    options.showHeaders = !!options.showHeaders;
    options.columns = options.columns || options.include;
    let columnNames = options.columns || [];
    items = toArray(items, columnNames);
    if (!columnNames.length) {
      items.forEach(function(item) {
        for (let columnName in item) {
          if (columnNames.indexOf(columnName) === -1)
            columnNames.push(columnName);
        }
      });
    }
    let columns = columnNames.reduce((columns, columnName) => {
      let column = Object.create(options);
      columns[columnName] = mixin(column, columnConfigs[columnName]);
      return columns;
    }, Object.create(null));
    columnNames.forEach((columnName) => {
      let column = columns[columnName];
      column.name = columnName;
      column.maxWidth = Math.ceil(column.maxWidth);
      column.minWidth = Math.ceil(column.minWidth);
      column.truncate = !!column.truncate;
      column.align = column.align || 'left';
    });
    items = items.map((item) => {
      let result = Object.create(null);
      columnNames.forEach((columnName) => {
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
    columnNames.forEach((columnName) => {
      let column = columns[columnName];
      items = items.map((item, index) => {
        let col = Object.create(column);
        item[columnName] = column.dataTransform(item[columnName], col, index);
        let changedKeys = Object.keys(col);
        if (changedKeys.indexOf('name') !== -1) {
          if (column.headingTransform !== DEFAULT_HEADING_TRANSFORM)
            return;
          column.headingTransform = (heading) => heading;
        }
        changedKeys.forEach((key) => column[key] = col[key]);
        return item;
      });
    });
    let headers = {};
    if (options.showHeaders) {
      columnNames.forEach((columnName) => {
        let column = columns[columnName];
        if (!column.showHeaders) {
          headers[columnName] = '';
          return;
        }
        headers[columnName] = column.headingTransform(column.name);
      });
      items.unshift(headers);
    }
    columnNames.forEach((columnName) => {
      let column = columns[columnName];
      column.width = items.map((item) => item[columnName]).reduce((min, cur) => {
        return Math.max(min, Math.min(column.maxWidth, Math.max(column.minWidth, wcwidth(cur))));
      }, 0);
    });
    columnNames.forEach((columnName) => {
      let column = columns[columnName];
      items = items.map((item) => {
        item[columnName] = splitLongWords(item[columnName], column.width, column.truncateMarker);
        return item;
      });
    });
    columnNames.forEach((columnName) => {
      let column = columns[columnName];
      items = items.map((item, index) => {
        let cell = item[columnName];
        item[columnName] = splitIntoLines(cell, column.width);
        if (column.truncate && item[columnName].length > 1) {
          item[columnName] = splitIntoLines(cell, column.width - wcwidth(column.truncateMarker));
          let firstLine = item[columnName][0];
          if (!endsWith(firstLine, column.truncateMarker))
            item[columnName][0] += column.truncateMarker;
          item[columnName] = item[columnName].slice(0, 1);
        }
        return item;
      });
    });
    columnNames.forEach((columnName) => {
      let column = columns[columnName];
      column.width = items.map((item) => {
        return item[columnName].reduce((min, cur) => {
          return Math.max(min, Math.min(column.maxWidth, Math.max(column.minWidth, wcwidth(cur))));
        }, 0);
      }).reduce((min, cur) => {
        return Math.max(min, Math.min(column.maxWidth, Math.max(column.minWidth, cur)));
      }, 0);
    });
    let rows = createRows(items, columns, columnNames, options.paddingChr);
    return rows.reduce((output, row) => {
      return output.concat(row.reduce((rowOut, line) => {
        return rowOut.concat(line.join(options.columnSplitter));
      }, []));
    }, []).map((line) => truncateString(line, maxLineWidth)).join(options.spacing);
  };
  function createRows(items, columns, columnNames, paddingChr) {
    return items.map((item) => {
      let row = [];
      let numLines = 0;
      columnNames.forEach((columnName) => {
        numLines = Math.max(numLines, item[columnName].length);
      });
      for (let i = 0; i < numLines; i++) {
        row[i] = row[i] || [];
        columnNames.forEach((columnName) => {
          let column = columns[columnName];
          let val = item[columnName][i] || '';
          if (column.align === 'right')
            row[i].push(padLeft(val, column.width, paddingChr));
          else if (column.align === 'center' || column.align === 'centre')
            row[i].push(padCenter(val, column.width, paddingChr));
          else
            row[i].push(padRight(val, column.width, paddingChr));
        });
      }
      return row;
    });
  }
  function mixin(...args) {
    if (Object.assign)
      return Object.assign(...args);
    return ObjectAssign(...args);
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
    let lastIndex = target.lastIndexOf(searchString);
    return lastIndex !== -1 && lastIndex === position;
  }
  function toArray(items, columnNames) {
    if (Array.isArray(items))
      return items;
    let rows = [];
    for (let key in items) {
      let item = {};
      item[columnNames[0] || 'key'] = key;
      item[columnNames[1] || 'value'] = items[key];
      rows.push(item);
    }
    return rows;
  }
})(require("process"));
