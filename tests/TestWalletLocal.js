const assert = require("assert");
const TestUtils = require("./TestUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");
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
    let numBlocks = 25;
    let chainHeight = await wallet.getChainHeight();
    let resp = await wallet.sync(chainHeight - numBlocks, null, function(progress) {
      console.log("RECEIVED PROGRESS")  // TODO: throw error if this isn't received
    });
    assert(resp.blocks_fetched >= 0);
    assert(typeof resp.received_money === "boolean");
  });
  
  it("Can get the block chain height", async function() {
    throw new Error("Not implemented");
  })
  
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