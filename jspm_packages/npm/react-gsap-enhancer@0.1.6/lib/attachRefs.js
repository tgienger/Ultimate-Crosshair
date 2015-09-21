/* */ 
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = attachRefs;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function attachRefs(element, itemMap) {
  var idx = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
  var key = element.key;
  var previousRef = element.ref;

  if (key === null) {
    key = idx;
  }

  if (typeof previousRef === 'string') {
    throw Error('Cannot connect GSAP Enhancer to an element with an existing string ref. ' + 'Please convert it to use a callback ref instead, or wrap it into a <span> or <div>. ' + 'Read more: https://facebook.github.io/react/docs/more-about-refs.html#the-ref-callback-attribute');
  }

  var item;
  if (itemMap.has(key)) {
    item = itemMap.get(key);
  } else {
    item = itemMap.set(key, {
      children: new Map()
    }).get(key);
  }

  if (!item.ref) {
    item.ref = function (component) {
      var node = _react2['default'].findDOMNode(component);
      item.component = component;
      item.node = node;

      if (typeof previousRef === 'function') {
        previousRef(component);
      }
    };
  }

  var originalChildren = element.props.children;
  var children = undefined;
  if (typeof originalChildren !== 'object') {
    children = originalChildren;
  } else if ((0, _react.isValidElement)(originalChildren)) {
    children = cloneChild(originalChildren);
  } else {
    children = _react.Children.map(originalChildren, function (child, childIdx) {
      return cloneChild(child, childIdx);
    });
  }

  function cloneChild(child, childIdx) {
    if (_react2['default'].isValidElement(child)) {
      return attachRefs(child, item.children, childIdx);
    } else {
      return child;
    }
  }

  return _react2['default'].cloneElement(element, { ref: item.ref, children: children });
}

module.exports = exports['default'];
//# sourceMappingURL=attachRefs.js.map