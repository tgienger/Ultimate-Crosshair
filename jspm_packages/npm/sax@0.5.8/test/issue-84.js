/* */ 
(function(process) {
  require(__dirname).test({
    xml: "<?has unbalanced \"quotes?><xml>body</xml>",
    expect: [["processinginstruction", {
      name: "has",
      body: "unbalanced \"quotes"
    }], ["opentag", {
      name: "xml",
      attributes: {},
      isSelfClosing: false
    }], ["text", "body"], ["closetag", "xml"]],
    strict: false,
    opt: {
      lowercasetags: true,
      noscript: true
    }
  });
})(require("process"));
