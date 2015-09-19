/* */ 
var tar = require("../tar"),
    fstream = require("fstream"),
    fs = require("fs");
var dirDest = fs.createWriteStream('dir.tar');
function onError(err) {
  console.error('An error occurred:', err);
}
function onEnd() {
  console.log('Packed!');
}
var packer = tar.Pack({noProprietary: true}).on('error', onError).on('end', onEnd);
fstream.Reader({
  path: __dirname,
  type: "Directory"
}).on('error', onError).pipe(packer).pipe(dirDest);
