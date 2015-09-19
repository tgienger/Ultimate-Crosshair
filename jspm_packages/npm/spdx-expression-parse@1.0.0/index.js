/* */ 
var parser = require("./parser.generated").parser;
module.exports = function(argument) {
  return parser.parse(argument);
};
