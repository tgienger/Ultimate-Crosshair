/* */ 
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Animation = (function () {
  function Animation(animationSource, options, target, onNeedReattachAllAninmations) {
    _classCallCheck(this, Animation);

    this._animationSource = animationSource;
    this._target = target;
    this._options = options;
    this._onNeedReattachAllAninmations = onNeedReattachAllAninmations;
    this._commandsWaitingForAttach = [];
  }

  _createClass(Animation, [{
    key: 'replaceAnimationSource',
    value: function replaceAnimationSource(animationSource) {
      if (this._gsapAnimation) {
        this._gsapAnimation.kill();
        this._gsapAnimation = undefined;
        this._animationSource = animationSource;
        this._onNeedReattachAllAninmations();
      } else {
        //it's not attached yet
        this._animationSource = animationSource;
      }
    }
  }, {
    key: 'attach',
    value: function attach() {
      var _this = this;

      if (this._gsapAnimation) {
        var time = this._gsapAnimation.time();
        var paused = this._gsapAnimation.paused();
        this._gsapAnimation.invalidate().restart().time(time);

        if (paused) {
          this._gsapAnimation.pause();
        }
      } else {
        this._gsapAnimation = this._animationSource({
          target: this._target,
          options: this._options
        });
      }

      this._commandsWaitingForAttach.splice(0).forEach(function (_ref) {
        var fnName = _ref.fnName;
        var args = _ref.args;
        return _this[fnName].apply(_this, _toConsumableArray(args));
      });
    }
  }]);

  return Animation;
})();

exports['default'] = Animation;

function bindAPI() {
  var TweenMaxMethods = ['delay', 'duration', 'endTime', 'eventCallback', 'invalidate', 'isActive', 'kill', 'pause', 'paused', 'play', 'progress', 'repeat', 'repeatDelay', 'restart', 'resume', 'reverse', 'reversed', 'seek', 'startTime', 'time', 'timeScale', 'totalDuration', 'totalProgress', 'totalTime', 'updateTo', 'yoyo'];
  var TimelineMaxMethods = ['recent', 'add', 'addCallback', 'addLabel', 'addPause', 'call', 'clear', 'currentLabel', 'duration', 'endTime', 'eventCallback', 'from', 'fromTo', 'getActive', 'getChildren', 'getLabelAfter', 'getLabelBefore', 'getLabelsArray', 'getLabelTime', 'getTweensOf', 'invalidate', 'isActive', 'kill', 'pause', 'paused', 'play', 'progress', 'remove', 'removeCallback', 'removeLabel', 'render', 'repeat', 'repeatDelay', 'restart', 'resume', 'reverse', 'reversed', 'seek', 'set', 'shiftChildren', 'staggerFrom', 'staggerFromTo', 'staggerTo', 'startTime', 'time', 'timeScale', 'to', 'totalDuration', 'totalProgress', 'totalTime', 'tweenFromTo', 'tweenTo', 'useFrames', 'yoyo'];

  TweenMaxMethods.concat(TimelineMaxMethods).forEach(function (fnName) {
    Animation.prototype[fnName] = function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (!this._gsapAnimation) {
        this._commandsWaitingForAttach.push({ fnName: fnName, args: args });
      } else if (typeof this._gsapAnimation[fnName] === 'function') {
        var _gsapAnimation;

        (_gsapAnimation = this._gsapAnimation)[fnName].apply(_gsapAnimation, args);
      } else {
        throw Error('Animation source has no method: \'' + fnName + '\'');
      }
      return this;
    };
  });
}
bindAPI();
module.exports = exports['default'];
//# sourceMappingURL=Animation.js.map