const assert = require("assert");
const TestUtils = require("./TestUtils").TestUtils;
const MoneroUtils = require("../main/utils/MoneroUtils");

/**
 * Compares two wallets for equality.
 */
describe("TEST WALLETS EQUALITY", function() {
  let that = this;
  
  // setup before tests run
  before(async function() {
    that.wallet1 = await TestUtils.getWalletRpc();
    that.wallet2 = TestUtils.getWalletLocal();
  });
  
  it("Have the same keys", async function() {
    assert.equal(await that.wallet2.getMnemonic(), await that.wallet1.getMnemonic());
    assert.equal(await that.wallet2.getPrimaryAddress(), await that.wallet1.getPrimaryAddress());
    assert.equal(await that.wallet2.getPrivateViewKey(), await that.wallet1.getPrivateViewKey());
  });
  
  it("Provide the same integrated address given a payment id", async function() {
    throw new Error("Not implemented");
  });
  
  it("Have the same accounts", async function() {
    assert.deepEqual(await that.wallet2.getAccounts(), await that.wallet1.getAccounts());
  });
  
  it("Have the same accounts and subaddresses", async function() {
    assert.deepEqual(await that.wallet2.getAccounts(true), await that.wallet1.getAccounts(true));
  });
  
  it("Have the same outputs", async function() {
    assert.deepEqual(await that.wallet2.getOutputs(), await that.wallet1.getOutputs());
  });
  
  it("Have the same wallet transactions", async function() {
    let txs1 = await that.wallet1.getTxs();
    let txs2 = await that.wallet2.getTxs();
    assert.deepEqual(txs2, txs1);
  });
  
  it("Have the same account transactions", async function() {
    throw new Error("Not implemented");
  })
  
  it("Have the same subaddress transactions", async function() {
    throw new Error("Not implemented");
  });
});