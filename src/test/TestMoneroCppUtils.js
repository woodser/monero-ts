/**
 * Test C++ utilities accessed through WebAssembly.
 */
describe("TEST C++ UTILITIES", function() {
  
  // initialize utils to test
  let MoneroCppUtils;
  before(async function() {
    MoneroCppUtils = await MoneroUtils.getCppUtils();
  });
  
  describe("Binary Serialization", function() {
    
    it("Can serialize heights with small numbers", function() {
      let json = { heights: [111, 222, 333] };
      let binary = MoneroCppUtils.jsonToBinary(json);
      assert(binary);
      let json2 = MoneroCppUtils.binaryToJson(binary);
      assert.deepEqual(json2, json);
    });
    
    it("Can serialize heights with big numbers", function() {
      let json = { heights: [123456, 1234567, 870987] };
      let binary = MoneroCppUtils.jsonToBinary(json);
      assert(binary);
      let json2 = MoneroCppUtils.binaryToJson(binary);
      assert.deepEqual(json2, json);
    });
    
    it("Can serialize json with text", function() {
      let json = { msg: 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' };
      let binary = MoneroCppUtils.jsonToBinary(json);
      assert(binary);
      let json2 = MoneroCppUtils.binaryToJson(binary);
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
      let binary = MoneroCppUtils.jsonToBinary(json);
      assert(binary);
      let json2 = MoneroCppUtils.binaryToJson(binary);
      assert.deepEqual(json2, json);
    });
  });
});