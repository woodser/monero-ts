const assert = require("assert");
const TestUtils = require("./TestUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");

let wallet1 = TestUtils.getWalletRpc();
let wallet2 = TestUtils.getWalletLocal();
describe("Test Wallets Equal", function() {
  
  // setup before tests run
  before(async function() {
    await TestUtils.initWalletRpc();
  });
  
  it("Have the same keys", async function() {
    assert.equal(await wallet1.getMnemonic(), await wallet2.getMnemonic());
    assert.equal(await wallet1.getPrimaryAddress(), await wallet2.getPrimaryAddress());
    assert.equal(await wallet1.getPrivateViewKey(), await wallet2.getPrivateViewKey());
  });
});