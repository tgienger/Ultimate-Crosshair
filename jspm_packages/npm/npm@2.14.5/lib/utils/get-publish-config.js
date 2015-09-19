/* */ 
var Conf = require("../config/core").Conf;
var CachingRegClient = require("../cache/caching-client");
var log = require("npmlog");
module.exports = getPublishConfig;
function getPublishConfig(publishConfig, defaultConfig, defaultClient) {
  var config = defaultConfig;
  var client = defaultClient;
  log.verbose('getPublishConfig', publishConfig);
  if (publishConfig) {
    config = new Conf(defaultConfig);
    config.save = defaultConfig.save.bind(defaultConfig);
    config.unshift(Object.keys(publishConfig).reduce(function(s, k) {
      s[k] = publishConfig[k];
      return s;
    }, {}));
    client = new CachingRegClient(config);
  }
  return {
    config: config,
    client: client
  };
}
