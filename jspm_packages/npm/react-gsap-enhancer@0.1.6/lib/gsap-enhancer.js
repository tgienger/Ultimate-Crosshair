/* */ 
(function(process) {
  'use strict';
  Object.defineProperty(exports, '__esModule', {value: true});
  var _createClass = (function() {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ('value' in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    return function(Constructor, protoProps, staticProps) {
      if (protoProps)
        defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();
  var _get = function get(_x, _x2, _x3) {
    var _again = true;
    _function: while (_again) {
      var object = _x,
          property = _x2,
          receiver = _x3;
      desc = parent = getter = undefined;
      _again = false;
      if (object === null)
        object = Function.prototype;
      var desc = Object.getOwnPropertyDescriptor(object, property);
      if (desc === undefined) {
        var parent = Object.getPrototypeOf(object);
        if (parent === null) {
          return undefined;
        } else {
          _x = parent;
          _x2 = property;
          _x3 = receiver;
          _again = true;
          continue _function;
        }
      } else if ('value' in desc) {
        return desc.value;
      } else {
        var getter = desc.get;
        if (getter === undefined) {
          return undefined;
        }
        return getter.call(receiver);
      }
    }
  };
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {'default': obj};
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError('Cannot call a class as a function');
    }
  }
  function _inherits(subClass, superClass) {
    if (typeof superClass !== 'function' && superClass !== null) {
      throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass);
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }});
    if (superClass)
      Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }
  var _attachRefs = require("./attachRefs");
  var _attachRefs2 = _interopRequireDefault(_attachRefs);
  var _Animation = require("./Animation");
  var _Animation2 = _interopRequireDefault(_Animation);
  var _createTarget = require("./createTarget");
  var _createTarget2 = _interopRequireDefault(_createTarget);
  var _utils = require("./utils");
  exports['default'] = function(animationSourceMap) {
    if (animationSourceMap && animationSourceMap.prototype && animationSourceMap.prototype.render) {
      var ComposedComponent = animationSourceMap;
      return enhance(undefined, ComposedComponent);
    } else {
      return enhance.bind(undefined, animationSourceMap);
    }
  };
  function enhance(animationSourceMap, ComposedComponent) {
    var GSAPEnhancer = (function(_ComposedComponent) {
      _inherits(GSAPEnhancer, _ComposedComponent);
      function GSAPEnhancer(props) {
        var _this = this;
        _classCallCheck(this, GSAPEnhancer);
        _get(Object.getPrototypeOf(GSAPEnhancer.prototype), 'constructor', this).call(this, props);
        this.addAnimation = function(createGSAPAnimation, options) {
          var sourceMap = _this.__animationSourceMap;
          if (sourceMap && sourceMap[createGSAPAnimation]) {
            createGSAPAnimation = sourceMap[createGSAPAnimation];
          }
          var target = (0, _createTarget2['default'])(_this.__itemTree).find();
          var animation = new _Animation2['default'](createGSAPAnimation, options, target, function() {
            return (0, _utils.reattachAll)(_this.__itemTree, _this.__runningAnimations);
          });
          _this.__runningAnimations.add(animation);
          _this.forceUpdate();
          return animation;
        };
        this.__itemTree = new Map();
        this.__runningAnimations = new Set();
        this.__animationSourceMap = animationSourceMap;
      }
      _createClass(GSAPEnhancer, [{
        key: 'removeAnimation',
        value: function removeAnimation(animation) {
          animation.kill();
          this.__runningAnimations['delete'](animation);
          this.forceUpdate();
        }
      }, {
        key: 'componentDidMount',
        value: function componentDidMount() {
          (0, _utils.saveRenderedStyles)(this.__itemTree);
          if (_get(Object.getPrototypeOf(GSAPEnhancer.prototype), 'componentDidMount', this)) {
            for (var _len = arguments.length,
                args = Array(_len),
                _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }
            _get(Object.getPrototypeOf(GSAPEnhancer.prototype), 'componentDidMount', this).apply(this, args);
          }
        }
      }, {
        key: 'componentWillUpdate',
        value: function componentWillUpdate() {
          (0, _utils.restoreRenderedStyles)(this.__itemTree);
          if (_get(Object.getPrototypeOf(GSAPEnhancer.prototype), 'componentWillUpdate', this)) {
            for (var _len2 = arguments.length,
                args = Array(_len2),
                _key2 = 0; _key2 < _len2; _key2++) {
              args[_key2] = arguments[_key2];
            }
            _get(Object.getPrototypeOf(GSAPEnhancer.prototype), 'componentWillUpdate', this).apply(this, args);
          }
        }
      }, {
        key: 'render',
        value: function render() {
          for (var _len3 = arguments.length,
              args = Array(_len3),
              _key3 = 0; _key3 < _len3; _key3++) {
            args[_key3] = arguments[_key3];
          }
          return (0, _attachRefs2['default'])(_get(Object.getPrototypeOf(GSAPEnhancer.prototype), 'render', this).apply(this, args), this.__itemTree);
        }
      }, {
        key: 'componentDidUpdate',
        value: function componentDidUpdate() {
          (0, _utils.saveRenderedStyles)(this.__itemTree);
          (0, _utils.attachAll)(this.__runningAnimations);
          if (_get(Object.getPrototypeOf(GSAPEnhancer.prototype), 'componentDidUpdate', this)) {
            for (var _len4 = arguments.length,
                args = Array(_len4),
                _key4 = 0; _key4 < _len4; _key4++) {
              args[_key4] = arguments[_key4];
            }
            _get(Object.getPrototypeOf(GSAPEnhancer.prototype), 'componentDidUpdate', this).apply(this, args);
          }
        }
      }]);
      return GSAPEnhancer;
    })(ComposedComponent);
    if (process.env.NODE_ENV !== 'production') {
      Object.keys(ComposedComponent.prototype).forEach(function(key) {
        if (!GSAPEnhancer.prototype.hasOwnProperty(key)) {
          var descriptor = Object.getOwnPropertyDescriptor(ComposedComponent.prototype, key);
          Object.defineProperty(GSAPEnhancer.prototype, key, descriptor);
        }
      });
    }
    return GSAPEnhancer;
  }
  module.exports = exports['default'];
})(require("process"));
