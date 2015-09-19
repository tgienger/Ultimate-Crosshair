/* */ 
var lockFile = require("../../lockfile");
lockFile.lockSync('never-forget');
throw new Error('waaaaaaaaa');
