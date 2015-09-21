/* */ 
var Renderer = require("./renderer"),
    nodes = require("./nodes/index"),
    utils = require("./utils");
exports = module.exports = render;
exports.version = require("../package.json!systemjs-json").version;
exports.nodes = nodes;
exports.functions = require("./functions/index");
exports.utils = require("./utils");
exports.middleware = require("./middleware");
exports.Visitor = require("./visitor/index");
exports.Parser = require("./parser");
exports.Evaluator = require("./visitor/evaluator");
exports.Normalizer = require("./visitor/normalizer");
exports.Compiler = require("./visitor/compiler");
exports.convertCSS = require("./convert/css");
exports.render = function(str, options, fn) {
  if ('function' == typeof options)
    fn = options, options = {};
  return new Renderer(str, options).render(fn);
};
function render(str, options) {
  return new Renderer(str, options);
}
exports.url = require("./functions/url");
exports.resolver = require("./functions/resolver");
