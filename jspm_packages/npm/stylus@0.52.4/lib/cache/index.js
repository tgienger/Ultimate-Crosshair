/* */ 
var getCache = module.exports = function(name, options) {
  if ('function' == typeof name)
    return new name(options);
  var cache;
  switch (name) {
    case 'memory':
      cache = require("./memory");
      break;
    default:
      cache = require("./null");
  }
  return new cache(options);
};
