const assert = require("assert");
const TestUtils = require("./TestUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");
const MoneroWalletLocal = require("../src/wallet/MoneroWalletLocal");
const TestWalletCommon = require("./TestWalletCommon");

/**
 * Tests the fully client-side Monero Wallet which uses a Monero Daemon.
 */
let wallet = TestUtils.getWalletLocal();
let daemon = TestUtils.getDaemonRpc();
describe("Monero Wallet Local", function() {
  
  // run common tests
  TestWalletCommon.testWallet(wallet, daemon);
  
  it("Can sync (with progress)", async function() {
//    let numBlocks = 25;
//    let chainHeight = await wallet.getChainHeight();
//    let resp = await wallet.sync(185500, 200000, function(progress) {
//      console.log("RECEIVED PROGRESS")  // TODO: throw error if this isn't received
//    });
//    assert(resp.blocks_fetched >= 0);
//    assert(typeof resp.received_money === "boolean");
  });
  
  it("Can sync specific ranges", async function() {
    
    // create a new wallet
    let wallet = new MoneroWalletLocal({daemon: daemon});
    
    let progressTester = new SyncProgressTester();
    
    // scan a few ranges
    assert.equal(0, await wallet.getHeight());
    await wallet.sync(0, 0, progressTester);
    progressTester.testDoneAndReset();
    assert.equal(1, await wallet.getHeight());
    await wallet.sync(101000, 102000, progressTester);
    progressTester.testDoneAndReset();
    assert.equal(102001, await wallet.getHeight());
    await wallet.sync(103000, 104000, progressTester);
    progressTester.testDoneAndReset();
    assert.equal(104001, await wallet.getHeight());
    await wallet.sync(105000, 106000, progressTester);
    progressTester.testDoneAndReset();
    assert.equal(106001, await wallet.getHeight());
    
    // scan a previous range
    await wallet.sync(101000, 102000, function(progress) {
      // TODO: ensure progress is only 0% and 100%
      throw new Error("Not implemented");
    });
    assert.equal(106001, await wallet.getHeight());
  });
  
  it("Can get the block chain height", async function() {
    assert.equal(await daemon.getHeight(), await wallet.getChainHeight());
  });
  
  it("Can get the seed", async function() {
    let seed = await wallet.getSeed();
    MoneroUtils.validateSeed(seed);
  });
  
  it("Can get the language of the mnemonic phrase", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the public view key", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the public spend key", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the private spend key", async function() {
    throw new Error("Not implemented");
  });
});

/**
 * Class to test progress updates.
 */
class SyncProgressTester {
  
  onProgress(progress) {
    //throw new Error("Not implemented");
  }
  
  testDoneAndReset() {
    //throw new Error("Not implemented");
  }
}