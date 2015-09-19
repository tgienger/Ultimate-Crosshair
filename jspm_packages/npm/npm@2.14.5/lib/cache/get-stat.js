/* */ 
var npm = require("../npm");
var correctMkdir = require("../utils/correct-mkdir");
module.exports = function getCacheStat(cb) {
  correctMkdir(npm.cache, cb);
};
