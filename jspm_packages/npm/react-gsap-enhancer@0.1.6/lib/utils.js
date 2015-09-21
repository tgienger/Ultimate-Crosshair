/* */ 
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.walkItemTree = walkItemTree;
exports.reattachAll = reattachAll;
exports.attachAll = attachAll;
exports.restoreRenderedStyles = restoreRenderedStyles;
exports.saveRenderedStyles = saveRenderedStyles;

function walkItemTree(itemTree, callback) {
  function walk(map) {
    map.forEach(function (item) {
      if (item.node) {
        callback(item);
        if (item.children) {
          walk(item.children);
        }
      }
    });
  }
  walk(itemTree);
}

function reattachAll(itemTree, runningAnimations) {
  restoreRenderedStyles(itemTree);
  attachAll(runningAnimations);
}

function attachAll(runningAnimations) {
  runningAnimations.forEach(function (animation) {
    return animation.attach();
  });
}

function restoreRenderedStyles(itemTree) {
  walkItemTree(itemTree, function (item) {
    var savedAttributeNames = Object.keys(item.savedAttributes);
    //restore the original attribute values
    savedAttributeNames.forEach(function (name) {
      item.node.setAttribute(name, item.savedAttributes[name]);
    });
    //remove the attributes added after the render
    for (var i = 0; i < item.node.attributes.length; ++i) {
      var _name = item.node.attributes[i].name;
      if (savedAttributeNames.indexOf(_name) === -1) {
        item.node.removeAttribute(_name);
        --i;
      }
    }
  });
}

function saveRenderedStyles(itemTree) {
  walkItemTree(itemTree, function (item) {
    item.savedAttributes = {};
    for (var i = 0; i < item.node.attributes.length; ++i) {
      var attribute = item.node.attributes[i];
      var _name2 = attribute.name;
      var value = attribute.value;
      item.savedAttributes[_name2] = value;
    }
    item.node._gsTransform = null;
    item.node._gsTweenID = null;
  });
}
//# sourceMappingURL=utils.js.map