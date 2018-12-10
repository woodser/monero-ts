const assert = require("assert");
const TestUtils = require("./TestUtils");
const TestWalletCommon = require("./TestWalletCommon");
const MoneroRpcError = require("../src/rpc/MoneroRpcError");

/**
 * Tests the Monero Wallet RPC client and server.
 */
let wallet = TestUtils.getWalletRpc();
let daemon = TestUtils.getDaemonRpc();
describe("Test Monero Wallet RPC", function() {
  
  // initialize wallet
  before(async function() {
    await TestUtils.initWalletRpc();
  });
  
  // run common wallet tests
  TestWalletCommon.testWallet(wallet, daemon);
  
  it("Can indicate if multisig import is needed for correct balance information", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can create and open a wallet", async function() {
    
    // create test wallet 2 which throws rpc code -21 if it already exists
    try {
      await wallet.createWallet(TestUtils.WALLET_RPC_NAME_2, TestUtils.WALLET_RPC_PW_2, "English");
    } catch (e) {
      assert(e instanceof MoneroRpcError); 
      assert.equal(-21, e.getRpcCode());
    }
    
    // open test wallet 2
    await wallet.openWallet(TestUtils.WALLET_RPC_NAME_2, TestUtils.WALLET_RPC_PW_2);
    
    // assert wallet is empty
    let txs = await wallet.getTxs();
    assert(txs.length === 0);
    
    // open test wallet 1
    await wallet.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_RPC_PW_1);
    txs = await wallet.getTxs();
    assert(txs.length !== 0);  // wallet is used
  });

  it("Can rescan spent", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can save the blockchain", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can be stopped", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can mine", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can tag accounts and query accounts by tag", async function() {
    throw new Error("Not implemented");
  });
  
  it("Has an address book", async function() {
    throw new Error("Not implemented");
  });
});