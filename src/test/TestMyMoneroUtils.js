/**
 * Test MyMonero utilities.
 */
describe("TEST MYMONERO UTILS", function() {
  
  // initialize core utils to test
  let MyMoneroUtils;
  before(async function() {
    MyMoneroUtils = await MoneroUtils.getMyMoneroUtils();
  });
  
  describe("Binary Serialization", function() {
    
    it("Can serialize heights with small numbers", function() {
      let json = { heights: [111, 222, 333] };
      let binary = MyMoneroUtils.json_to_binary(json);
      assert(binary);
      let json2 = MyMoneroUtils.binary_to_json(binary);
      assert.deepEqual(json2, json);
    });
    
    it("Can serialize heights with big numbers", function() {
      let json = { heights: [123456, 1234567, 870987] };
      let binary = MyMoneroUtils.json_to_binary(json);
      assert(binary);
      let json2 = MyMoneroUtils.binary_to_json(binary);
      assert.deepEqual(json2, json);
    });
    
    it("Can serialize json with text", function() {
      let json = { msg: 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' };
      let binary = MyMoneroUtils.json_to_binary(json);
      assert(binary);
      let json2 = MyMoneroUtils.binary_to_json(binary);
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
      let binary = MyMoneroUtils.json_to_binary(json);
      assert(binary);
      let json2 = MyMoneroUtils.binary_to_json(binary);
      assert.deepEqual(json2, json);
    });
  });
});