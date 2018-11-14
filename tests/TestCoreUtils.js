const assert = require("assert");
const MoneroUtils = require("../src/utils/MoneroUtils");
const GenUtils = require("../src/utils/GenUtils");
const TestUtils = require("./TestUtils");

//get core utils
MoneroUtils.getCoreUtils().then(function(coreUtils) {
  
  describe("Monero Core Utils", function() {
    
    it("Test say_something()", function() {
      let something_said = coreUtils.say_something("Hello world!");
      assert.equal("OK I will say 'Hello world!'", something_said);
    });
    
    it("Test binary serialization", async function() {
      let json = { heights: [111, 222, 333], myObject: {test1: "Hello", test2: "There"} };
      let binary = coreUtils.json_to_binary(json);
      assert(binary);
      console.log("Received binary from core utils: " + binary);
      let json2 = coreUtils.binary_to_json(binary);
      assert.deepEqual(json, json2);
    });
  });
});