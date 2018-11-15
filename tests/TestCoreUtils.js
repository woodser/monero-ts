const assert = require("assert");
const MoneroUtils = require("../src/utils/MoneroUtils");
const GenUtils = require("../src/utils/GenUtils");
const TestUtils = require("./TestUtils");

//get core utils
MoneroUtils.getCoreUtils().then(function(coreUtils) {
  
  describe("Monero Core Utils", function() {
    
    it("Test binary serialization", async function() {
      
      // test 1
      let json = { heights: [111, 222, 333] };
      let binary = coreUtils.json_to_binary(json);
      assert(binary);
      console.log("Received binary from core utils: " + binary);
      let json2 = coreUtils.binary_to_json(binary);
      assert.deepEqual(json, json2);
      
      // test 2
      json = { msg: 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' };
      binary = coreUtils.json_to_binary(json);
      assert(binary);
      json2 = coreUtils.binary_to_json(binary);
      assert.deepEqual(json, json2);
      
      // test 3
      json = { heights: [123456, 1234567, 870987] };
      binary = coreUtils.json_to_binary(json);
      assert(binary);
      json2 = coreUtils.binary_to_json(binary);
      assert.deepEqual(json, json2);
    });
  });
});