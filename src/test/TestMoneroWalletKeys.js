const TestMoneroWalletCommon = require("./TestMoneroWalletCommon");
const MoneroWalletKeys = require("../main/js/wallet/MoneroWalletKeys");

/**
 * Tests the implementation of MoneroWallet which only manages keys using WebAssembly.
 */
class TestMoneroWalletKeys extends TestMoneroWalletCommon {
  
  constructor(config) {
    super(config);
  }
  
  async getTestWallet() {
    return TestUtils.getWalletKeys();
  }
  
  async getTestDaemon() {
    throw new Error("TestMoneroWalletKeys.getTestDaemon() not applicable");
  }
  
  async openWallet(path) {
    throw new Error("TestMoneroWalletKeys.openWallet(path) not applicable");
  }
  
  async createWalletRandom() {
    return await MoneroWalletKeys.createWalletRandom(TestUtils.NETWORK_TYPE);
  }
  
  async createWalletFromMnemonic(mnemonic, daemonConnection, restoreHeight, seedOffset) {
    return await MoneroWalletKeys.createWalletFromMnemonic(TestUtils.NETWORK_TYPE, mnemonic, seedOffset);
  }
  
  async createWalletFromKeys(address, privateViewKey, privateSpendKey, daemonConnection, firstReceiveHeight, language) {  // TODO: daemonConnection placeholder not applicable for this method, use wallet creation config?
    return await MoneroWalletKeys.createWalletFromKeys(TestUtils.NETWORK_TYPE, address, privateViewKey, privateSpendKey, language);
  }
  
  async getMnemonicLanguages() {
    return await MoneroWalletKeys.getMnemonicLanguages();
  }
  
  runTests() {
    let that = this;
    describe("TEST MONERO WALLET KEYS", function() {
      
      // initialize wallet
      before(async function() {
        that.wallet = await that.getTestWallet();
      });
      
      // run tests specific to keys wallet
      that._testWalletKeys();
      
      // run common tests
      that.runCommonTests();
    });
  }
  
  // ---------------------------------- PRIVATE -------------------------------
  
  _testWalletKeys() {
    let that = this;
    let config = this.config;
    let daemon = this.daemon;
    
    describe("Tests specific to keys wallet", function() {
      
      it("Has the same keys as the RPC wallet", async function() {
        await WalletEqualityUtils.testWalletEqualityKeys(await TestUtils.getWalletRpc(), await that.getTestWallet());
      });
      
      it("Has the same keys as the RPC wallet with a seed offset", async function() {
        
        // use common offset to compare wallet implementations
        let seedOffset = "my super secret offset!";
        
        // create rpc wallet with offset
        let walletRpc = await TestUtils.getWalletRpc();
        await walletRpc.createWalletFromMnemonic(GenUtils.uuidv4(), TestUtils.WALLET_PASSWORD, await walletRpc.getMnemonic(), TestUtils.FIRST_RECEIVE_HEIGHT, undefined, seedOffset, undefined);
        
        // create keys-only wallet with offset
        let walletKeys = await MoneroWalletKeys.createWalletFromMnemonic(
            TestUtils.NETWORK_TYPE,
            TestUtils.MNEMONIC,
            seedOffset);
        
        // deep compare
        await WalletEqualityUtils.testWalletEqualityKeys(walletRpc, walletKeys);
      });
    });
  }
}

module.exports = TestMoneroWalletKeys