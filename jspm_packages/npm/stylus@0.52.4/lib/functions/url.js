/* */ 
var Compiler = require("../visitor/compiler"),
    events = require("../renderer").events,
    nodes = require("../nodes/index"),
    parse = require("url").parse,
    extname = require("path").extname,
    utils = require("../utils"),
    fs = require("fs");
var defaultMimes = {
  '.gif': 'image/gif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ttf': 'application/x-font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2'
};
module.exports = function(options) {
  options = options || {};
  var _paths = options.paths || [];
  var sizeLimit = null != options.limit ? options.limit : 30000;
  var mimes = options.mimes || defaultMimes;
  function fn(url) {
    var compiler = new Compiler(url);
    compiler.isURL = true;
    url = url.nodes.map(function(node) {
      return compiler.visit(node);
    }).join('');
    url = parse(url);
    var ext = extname(url.pathname),
        mime = mimes[ext],
        hash = url.hash || '',
        literal = new nodes.Literal('url("' + url.href + '")'),
        paths = _paths.concat(this.paths),
        buf;
    if (!mime)
      return literal;
    if (url.protocol)
      return literal;
    var found = utils.lookup(url.pathname, paths);
    if (!found) {
      events.emit('file not found', 'File ' + literal + ' could not be found, literal url retained!');
      return literal;
    }
    buf = fs.readFileSync(found);
    if (false !== sizeLimit && buf.length > sizeLimit)
      return literal;
    return new nodes.Literal('url("data:' + mime + ';base64,' + buf.toString('base64') + hash + '")');
  }
  ;
  fn.raw = true;
  return fn;
};
module.exports.mimes = defaultMimes;
