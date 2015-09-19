/* */ 
var cc = require("../index");
var chain = cc(),
    name = "forFun";
chain.add({__sample: "for fun only"}, name).on("load", function() {
  console.log(chain.get("__sample", name));
});
