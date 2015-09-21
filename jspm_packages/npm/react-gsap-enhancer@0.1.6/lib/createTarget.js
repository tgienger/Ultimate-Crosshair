/* */ 
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports['default'] = createTarget;
function find(selection, selector) {
  var result = [];

  selection.forEach(function (item) {
    var match = undefined;

    recurseChildren(item, function (childItem, key) {
      if (!match && testSelector(key, childItem, selector)) {
        match = childItem;
      }
    });

    if (match) {
      result.push(match);
    }
  });

  return createTarget(result);
}

function findAll(selection, selector) {
  var result = [];

  selection.forEach(function (item) {
    return recurseChildren(item, function (childItem, key) {
      if (testSelector(key, childItem, selector)) {
        result.push(childItem);
      }
    });
  });
  return createTarget(result);
}

function findInChildren(selection, selector) {
  var result = [];

  selection.forEach(function (item) {
    var match = undefined;
    iterateChildren(item, function (childItem, key) {
      if (!match && testSelector(key, childItem, selector)) {
        match = childItem;
      }
    });

    if (match) {
      result.push(match);
    }
  });

  return createTarget(result);
}

function findAllInChildren(selection, selector) {
  var result = [];

  selection.forEach(function (item) {
    return iterateChildren(item, function (childItem, key) {
      if (testSelector(key, childItem, selector)) {
        result.push(childItem);
      }
    });
  });
  return createTarget(result);
}

function findWithCommands(target, commands) {
  commands.forEach(function (command) {
    if (!target[command.type]) {
      throw Error('[react-gsap-enhancer] unknown command type "' + target[command.type] + '"');
    }
    target = target[command.type](command.selector);
  });
  return target;
}

function isMounted(item) {
  return !!item.node;
}

function testSelector(key, childItem) {
  var selector = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  if (typeof selector === 'string') {
    selector = { key: selector };
  }
  var props = _extends({}, childItem.component.props, { key: key });
  return Object.keys(selector).every(function (selectorKey) {
    return selector[selectorKey] === props[selectorKey];
  });
}

function iterateChildren(item, callback) {
  item.children.forEach(function (childItem, key) {
    if (isMounted(childItem)) {
      callback(childItem, key);
    }
  });
}

function recurseChildren(item, callback) {
  iterateChildren(item, function (childItem, key) {
    callback(childItem, key);
    recurseChildren(childItem, callback);
  });
}

function createTarget(selection) {
  if (selection instanceof Map) {
    selection = [{ children: selection }];
  }

  var target = selection.map(function (item) {
    return item.node;
  }).filter(function (node) {
    return !!node;
  });

  target.find = function (selector) {
    return find(selection, selector);
  };
  target.findAll = function (selector) {
    return findAll(selection, selector);
  };
  target.findInChildren = function (selector) {
    return findInChildren(selection, selector);
  };
  target.findAllInChildren = function (selector) {
    return findAllInChildren(selection, selector);
  };
  target.findWithCommands = function (commands) {
    return findWithCommands(target, commands);
  };

  return target;
}

module.exports = exports['default'];
//# sourceMappingURL=createTarget.js.map