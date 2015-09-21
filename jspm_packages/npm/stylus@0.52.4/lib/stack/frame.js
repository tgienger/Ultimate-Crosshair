/* */ 
var Scope = require("./scope");
var Frame = module.exports = function Frame(block) {
  this._scope = false === block.scope ? null : new Scope;
  this.block = block;
};
Frame.prototype.__defineGetter__('scope', function() {
  return this._scope || this.parent.scope;
});
Frame.prototype.lookup = function(name) {
  return this.scope.lookup(name);
};
Frame.prototype.inspect = function() {
  return '[Frame ' + (false === this.block.scope ? 'scope-less' : this.scope.inspect()) + ']';
};
