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
    wallet = new MoneroWalletLocal({daemon: daemon, mnemonic: TestUtils.TEST_MNEMONIC});
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
  
  it("Does not allow a start height to be specified if a new seed is being created", async function() {
    try {
      wallet = new MoneroWalletLocal({daemon: daemon, startHeight: 0});
      fail("Should have failed");
    } catch (e) { }
  });
  
  it("Can be created and synced without a seed", async function() {
    
    // wallet starts at the daemon's height by default
    wallet = new MoneroWalletLocal(daemon);
    assert.equal(await daemon.getHeight(), await wallet.getHeight());
    
    // sync the wallet 
    let progressTester = new SyncProgressTester(wallet, await wallet.getHeight(), await wallet.getChainHeight() - 1, null, true);
    await wallet.sync(null, null, function(progress) { progressTester.onProgress(progress) });
    progressTester.testDone();
    assert.equal(await wallet.getHeight(), await daemon.getHeight());
    
    // sync the wallet with default params
    await wallet.sync();
    assert.equal(await daemon.getHeight(), await wallet.getHeight());
  });
  
  it("Can be exported/imported to/from a JSON object", async function() {
    
    // create a new wallet initialized from a seed
    wallet = new MoneroWalletLocal({daemon: daemon, mnemonic: TestUtils.TEST_MNEMONIC});
    assert.equal(0, await wallet.getHeight());
    
    // sync some blocks
    let endHeight = Math.min(10000, await daemon.getHeight());
    await wallet.sync(0, endHeight);
    assert.equal(endHeight + 1, await wallet.getHeight());
    
    // save the wallet
    let store = await wallet.getStore();
    
    // recreate the wallet
    let wallet2 = new MoneroWalletLocal({daemon: daemon, store: store});
    assert.deepEqual(wallet.getStore(), wallet2.getStore());
    assert.equal(await wallet.getHeight(), await wallet2.getHeight());
    
    // sync the same blocks and assert progress is immediately done
    let progressTester = new SyncProgressTester(wallet, 0, endHeight, true);
    await wallet.sync(0, endHeight, function(progress) { progressTester.onProgress(progress) });
    progressTester.testDone();
  });
  
  it("Validates the sync range that is given to it", async function() {
    
    // create a new wallet
    let chainHeight = await daemon.getHeight();
    let wallet = new MoneroWalletLocal(daemon);
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
      await wallet.sync(0, chainHeight);
      fail("Should have failed");
    } catch (e) { }
    
    // sync last few
    await wallet.sync(chainHeight - 20, chainHeight - 1);
  });
  
  it("Reports progress while it's syncing", async function() {
    wallet = new MoneroWalletLocal({daemon: daemon, mnemonic: TestUtils.TEST_MNEMONIC});
    let numBlocks = 1000;
    let startHeight = await wallet.getChainHeight() - numBlocks
    let endHeight = await wallet.getChainHeight() - 1;
    let progressTester = new SyncProgressTester(wallet, startHeight, endHeight);
    let resp = await wallet.sync(startHeight, null, function(progress) { progressTester.onProgress(progress) });
    progressTester.testDone();
    assert.equal(numBlocks, resp.blocks_fetched);
    assert(typeof resp.received_money === "boolean");
  });
  
  it("Can sync specific ranges", async function() {
    
    // create a new wallet
    let chainHeight = await daemon.getHeight();
    let wallet = new MoneroWalletLocal(daemon);
    assert.equal(chainHeight, await wallet.getHeight());
    
    // scan a few ranges
    let progressTester = new SyncProgressTester(wallet, 0, 0);
    await wallet.sync(0, 0, function(progress) { progressTester.onProgress(progress) });
    progressTester.testDone();
    assert.equal(1, await wallet.getHeight());
    progressTester = new SyncProgressTester(wallet, 101000, 102000);
    await wallet.sync(101000, 102000, function(progress) { progressTester.onProgress(progress) });
    progressTester.testDone();
    assert.equal(102001, await wallet.getHeight());
    progressTester = new SyncProgressTester(wallet, 103000, 104000);
    await wallet.sync(103000, 104000, function(progress) { progressTester.onProgress(progress) });
    progressTester.testDone();
    assert.equal(104001, await wallet.getHeight());
    progressTester = new SyncProgressTester(wallet, 105000, 106000);
    await wallet.sync(105000, 106000, function(progress) { progressTester.onProgress(progress) });
    progressTester.testDone();
    assert.equal(106001, await wallet.getHeight());
    
    // scan a previously processed range
    progressTester = new SyncProgressTester(wallet, 101000, 102000, true);
    await wallet.sync(101000, 102000, function(progress) { progressTester.onProgress(progress) });
    progressTester.testDone();
    assert.equal(106001, await wallet.getHeight());
  });
  
  // run common tests
  TestWalletCommon.testWallet(TestUtils.getWalletLocal(), TestUtils.getDaemonRpc());
});

/**
 * Internal class to test progress updates.
 */
class SyncProgressTester {
  
  constructor(wallet, startHeight, endHeight, noMidway, noProgress) {
    assert(wallet);
    assert(startHeight >= 0);
    assert(endHeight >= 0);
    this.wallet = wallet;
    this.startHeight = startHeight;
    this.endHeight = endHeight;
    this.noMidway = noMidway;
    this.noProgress = noProgress;
    this.firstProgress = undefined;
    this.lastProgress = undefined;
  }
  
  onProgress(progress) {
    assert(!this.noProgress, "Should not call progress");
    assert.equal(this.endHeight - this.startHeight + 1, progress.totalBlocks);
    assert(progress.doneBlocks >= 0 && progress.doneBlocks <= progress.totalBlocks);
    if (this.noMidway) assert(progress.percent === 0 || progress.percent === 1);
    if (this.firstProgress == undefined) {
      this.firstProgress = progress;
      assert(progress.percent === 0);
      assert(progress.doneBlocks === 0);
    } else {
      assert(progress.percent > this.lastProgress.percent);
      assert(progress.doneBlocks >= this.lastProgress.doneBlocks && progress.doneBlocks <= progress.totalBlocks);
    }
    this.lastProgress = progress;
  }
  
  testDone() {
    
    // nothing to test if no progress called
    if (this.noProgress) return;
    
    // test first progress
    assert(this.firstProgress, "Progress was never updated");
    assert.equal(0, this.firstProgress.percent);
    assert.equal(0, this.firstProgress.doneBlocks);
    
    // test last progress
    assert.equal(1, this.lastProgress.percent);
    assert.equal(this.endHeight - this.startHeight + 1, this.lastProgress.doneBlocks);
    assert.equal(this.lastProgress.doneBlocks, this.lastProgress.totalBlocks);
  }
}