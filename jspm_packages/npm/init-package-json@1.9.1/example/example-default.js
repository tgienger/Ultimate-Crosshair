/* */ 
(function(process) {
  var init = require("../init-package-json");
  var dir = process.cwd();
  init(dir, 'file that does not exist', function(err, data) {
    if (!err)
      console.log('written successfully');
  });
})(require("process"));
