const assert = require("assert");
const MoneroUtils = require("../src/utils/MoneroUtils");
const GenUtils = require("../src/utils/GenUtils");
const TestUtils = require("./TestUtils");

/**
 * Test core utils ported from c++ at application layer.
 */
MoneroUtils.getCoreUtils().then(function(coreUtils) {
  
  describe("Test Monero Core Utils", function() {
    
    describe("Binary Serialization", function() {
      
      it("Can serialize heights with small numbers", function() {
        let json = { heights: [111, 222, 333] };
        let binary = coreUtils.json_to_binary(json);
        assert(binary);
        let json2 = coreUtils.binary_to_json(binary);
        assert.deepEqual(json, json2);
      });
      
      it("Can serialize heights with big numbers", function() {
        let json = { heights: [123456, 1234567, 870987] };
        let binary = coreUtils.json_to_binary(json);
        assert(binary);
        let json2 = coreUtils.binary_to_json(binary);
        assert.deepEqual(json, json2);
      });
      
      it("Can serialize json with text", function() {
        let json = { msg: 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' };
        let binary = coreUtils.json_to_binary(json);
        assert(binary);
        let json2 = coreUtils.binary_to_json(binary);
        assert.deepEqual(json, json2);
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
        assert.deepEqual(json, json2);
      });
    });
  });
});