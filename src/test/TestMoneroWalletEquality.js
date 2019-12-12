/**
 * Compares two wallets for equality.
 */
describe("TEST WALLET EQUALITY", function() {
  let that = this;
  
  // setup before tests run
  before(async function() {
    that.wallet1 = await TestUtils.getWalletRpc();
    that.wallet2 = await TestUtils.getWalletKeys();
  });
  
  it("RPC and keys-only wallets are equal", async function() {
    
  });
  
  it("RPC and keys-only wallets with a seed offset are equal", async function() {
    
  });
  
  it("Have the same keys", async function() {

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

async testWalletEqualityKeys(w1, w2) {
  assert.equal(await w2.getMnemonic(), await w1.getMnemonic());
  assert.equal(await w2.getPrimaryAddress(), await w1.getPrimaryAddress());
  assert.equal(await w2.getPrivateViewKey(), await w1.getPrivateViewKey());
  throw runtime_error("testWalletEqualityKeys() not implemented");
}