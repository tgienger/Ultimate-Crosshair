/* */ 
'use strict';
var schemas = require("./schemas/index");
var ValidationError = require("./error");
var validator = require("is-my-json-valid");
var runner = function(schema, data, cb) {
  var validate = validator(schema, {
    greedy: true,
    verbose: true,
    schemas: schemas
  });
  var valid = false;
  if (data !== undefined) {
    valid = validate(data);
  }
  if (!cb) {
    return valid;
  } else {
    return cb(validate.errors ? new ValidationError(validate.errors) : null, valid);
  }
  return valid;
};
module.exports = function(data, cb) {
  return runner(schemas.har, data, cb);
};
Object.keys(schemas).map(function(name) {
  module.exports[name] = function(data, cb) {
    return runner(schemas[name], data, cb);
  };
});
