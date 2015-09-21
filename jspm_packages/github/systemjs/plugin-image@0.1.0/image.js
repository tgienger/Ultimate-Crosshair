/*
  Image plugin
  Adapted from Miller Medeiros requirejs-plugins
  https://github.com/millermedeiros/requirejs-plugins/blob/master/src/image.js
*/
exports.build = false;
exports.fetch = function(load) {
  return new Promise(function(resolve, reject) {
    var img = load.metadata.img = new Image();
    img.onerror = reject;
    img.onload = function(evt) {      
      try {
        delete img.onload; //release memory - suggested by John Hann
      } catch(err) {
        img.onload = function() {}; // IE7 :(
      }
      resolve('');
    }
    img.src = load.address;
  });
};

exports.instantiate = function(load) {
  return load.metadata.img;
};
