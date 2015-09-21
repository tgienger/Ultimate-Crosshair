/* */ 
var inspect = require("util").inspect;
var Token = exports = module.exports = function Token(type, val) {
  this.type = type;
  this.val = val;
};
Token.prototype.inspect = function() {
  var val = ' ' + inspect(this.val);
  return '[Token:' + this.lineno + ':' + this.column + ' ' + '\x1b[32m' + this.type + '\x1b[0m' + '\x1b[33m' + (this.val ? val : '') + '\x1b[0m' + ']';
};
Token.prototype.toString = function() {
  return (undefined === this.val ? this.type : this.val).toString();
};
