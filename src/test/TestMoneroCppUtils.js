const assert = require("assert");
const MoneroUtils = require("../main/utils/MoneroUtils");
const GenUtils = require("../main/utils/GenUtils");
const TestUtils = require("./utils/TestUtils");

/**
 * Test bridged C++ utilities.
 */
describe("TEST MONERO CORE UTILS", function() {
  
  // initialize core utils to test
  let coreUtils;
  before(async function() {
    coreUtils = await MoneroUtils.getCoreUtils();
  });
  
  describe("Binary Serialization", function() {
    
    it("Can serialize heights with small numbers", function() {
      let json = { heights: [111, 222, 333] };
      let binary = coreUtils.json_to_binary(json);
      assert(binary);
      let json2 = coreUtils.binary_to_json(binary);
      assert.deepEqual(json2, json);
    });
    
    it("Can serialize heights with big numbers", function() {
      let json = { heights: [123456, 1234567, 870987] };
      let binary = coreUtils.json_to_binary(json);
      assert(binary);
      let json2 = coreUtils.binary_to_json(binary);
      assert.deepEqual(json2, json);
    });
    
    it("Can serialize json with text", function() {
      let json = { msg: 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' };
      let binary = coreUtils.json_to_binary(json);
      assert(binary);
      let json2 = coreUtils.binary_to_json(binary);
      assert.deepEqual(json2, json);
    });
    
    it("Can serialize json with long text", function() {
      let json = { msg: 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' +
          'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
          'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
          'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
          'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
          'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
          'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
          'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
          'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
          'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
          'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
          'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
          'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 
          'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n'};
      let binary = coreUtils.json_to_binary(json);
      assert(binary);
      let json2 = coreUtils.binary_to_json(binary);
      assert.deepEqual(json2, json);
    });
  });
});