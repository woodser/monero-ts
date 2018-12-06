const assert = require("assert");
const TestUtils = require("./TestUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");
const MoneroWalletLocal = require("../src/wallet/MoneroWalletLocal");
const TestWalletCommon = require("./TestWalletCommon");

/**
 * Tests the fully client-side Monero Wallet which uses a Monero Daemon.
 * 
 * TODO: test getSeed, language, etc with given mnemonic
 */
let wallet; // initialized before each test
let daemon = TestUtils.getDaemonRpc();
describe("Monero Wallet Local", function() {
  
  // start each test with new wallet
  beforeEach(function() {
    wallet = new MoneroWalletLocal({daemon: daemon});
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
  
  it("Can get the blockchain height", async function() {
    assert.equal(await daemon.getHeight(), await wallet.getChainHeight());
  });
  
  it("Can be created and synced without a seed", async function() {
    
    // wallet starts at the daemon's height by default
    assert.equal(await daemon.getHeight(), await wallet.getHeight());
    
    // sync the wallet 
    let progressTester = new SyncProgressTester();
    await wallet.sync(null, null, progressTester.onProgress);
    assert.equal(await wallet.getHeight(), await daemon.getHeight());
    progressTester.testAndReset();
    
    // sync the wallet with default params
    await wallet.sync();
    assert.equal(await daemon.getHeight(), await wallet.getHeight());
  });
  
  it("Can be saved to and re-initialized from a JSON object", function() {
    throw new Error("Not implemented");
  });
  
  it("Validates the sync range that is given to it", async function() {
    
    // create a new wallet
    let chainHeight = await daemon.getHeight();
    let wallet = new MoneroWalletLocal({daemon: daemon});
    assert.equal(chainHeight, await wallet.getHeight());
    
    // heights must be less than chain height
    try {
      await wallet.sync(await wallet.getHeight(), chainHeight);
      fail("Should have failed");
    } catch (e) { }
    
    // end height must be greater than start height
    try {
      await wallet.sync(200, 199);
      fail("Should have failed");
    } catch (e) { }
    
    // end height must be less than chain height
    try {
      await wallet.sync(null, chainHeight);
      fail("Should have failed");
    } catch (e) { }
    await wallet.sync(null, chainHeight - 1);
  });
  
  it("Reports progress while it's syncing", async function() {
    let numBlocks = 25;
    let resp = await wallet.sync(192000, 200000, function(progress) {
      console.log("RECEIVED PROGRESS")  // TODO: throw error if this isn't received
    });
    assert(resp.blocks_fetched >= 0);
    assert(typeof resp.received_money === "boolean");
  });
  
  it("Can sync specific ranges", async function() {
    
    // create a new wallet
    let chainHeight = await daemon.getHeight();
    let wallet = new MoneroWalletLocal({daemon: daemon});
    assert.equal(chainHeight, await wallet.getHeight());
    
    // scan a few ranges
    let progressTester = new SyncProgressTester();
    await wallet.sync(0, 0, progressTester);
    progressTester.testAndReset();
    assert.equal(1, await wallet.getHeight());
    await wallet.sync(101000, 102000, progressTester);
    progressTester.testAndReset();
    assert.equal(102001, await wallet.getHeight());
    await wallet.sync(103000, 104000, progressTester);
    progressTester.testAndReset();
    assert.equal(104001, await wallet.getHeight());
    await wallet.sync(105000, 106000, progressTester);
    progressTester.testAndReset();
    assert.equal(106001, await wallet.getHeight());
    
    // scan a previous range
    await wallet.sync(101000, 102000, function(progress) {
      // TODO: ensure progress is only 0% and 100%
      throw new Error("Not implemented");
    });
    assert.equal(106001, await wallet.getHeight());
  });
  
  // run common tests
  TestWalletCommon.testWallet(TestUtils.getWalletLocal(), TestUtils.getDaemonRpc());
});

/**
 * Internal class to test progress updates.
 */
class SyncProgressTester {
  
  onProgress(progress) {
    //throw new Error("Not implemented");
  }
  
  testAndReset() {
    //throw new Error("Not implemented");
  }
}