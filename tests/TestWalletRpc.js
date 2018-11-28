const TestUtils = require("./TestUtils");
const TestWallet = require("./TestWallet");

// get rpc wallet which may fail
TestUtils.getWalletRpc().catch(function(err) {
  console.error("Error initializing Monero Wallet RPC:");
  console.error(err);
}).then(function(wallet) {
  
  // test wallet
  describe("Monero Wallet RPC", function() {
    
    // run common tests
    TestWallet.testWallet(wallet);
    
    it("Can indicate if multisig import is needed for correct balance information", async function() {
      throw new Error("Not implemented");
    });
    
    it("Can create and open a wallet", async function() {
      
      // create test wallet 2 which throws rpc code -21 if it already exists
      try {
        await wallet.createWallet(TestUtils.WALLET_2_NAME, TestUtils.WALLET_2_PW, "English");
      } catch (e) {
        assert(e instanceof MoneroRpcError); 
        assert.equal(-21, e.getRpcCode());
      }
      
      // open test wallet 2
      await wallet.openWallet(TestUtils.WALLET_2_NAME, TestUtils.WALLET_2_PW);
      
      // assert wallet is empty
      let txs = wallet.getTxs();
      assert(txs.isEmpty());
      
      // open test wallet 1
      await wallet.openWallet(TestUtils.WALLET_1_NAME, TestUtils.WALLET_1_PW);
      txs = wallet.getTxs();
      assert(!txs.isEmpty());  // wallet is used
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
})