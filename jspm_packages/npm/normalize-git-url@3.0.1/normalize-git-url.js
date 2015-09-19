/* */ 
var url = require("url");
module.exports = function normalize(u) {
  var parsed = url.parse(u);
  var altered = u !== url.format(parsed);
  if (parsed.protocol) {
    parsed.protocol = parsed.protocol.replace(/^git\+/, '');
  }
  var checkout = parsed.hash && parsed.hash.substr(1) || 'master';
  parsed.hash = '';
  var returnedUrl;
  if (altered) {
    if (u.match(/^git\+https?/) && parsed.pathname.match(/\/?:[^0-9]/)) {
      returnedUrl = u.replace(/^git\+(.*:[^:]+):(.*)/, '$1/$2');
    } else {
      returnedUrl = u.replace(/^(?:git\+)?ssh:\/\//, '');
    }
    returnedUrl = returnedUrl.replace(/#[^#]*$/, '');
  } else {
    returnedUrl = url.format(parsed);
  }
  return {
    url: returnedUrl,
    branch: checkout
  };
};
