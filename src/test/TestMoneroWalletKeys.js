const TestMoneroWalletCommon = require("./TestMoneroWalletCommon");
let MoneroWalletKeys; // async import before tests run

/**
 * Tests the fully client-side Monero wallet.
 */
class TestMoneroWalletKeys extends TestMoneroWalletCommon {
  
  constructor() {
    super(TestUtils.getDaemonRpc());
  }
  
  async getTestWallet() {
    return TestUtils.getWalletKeys();
  }
  
  async openWallet(path) {
    throw new Error("TestMoneroWalletKeys.openWallet(path) not supported");
  }
  
  async createWalletRandom() {
    return await MoneroWalletKeys.createWalletRandom(TestUtils.NETWORK_TYPE);
  }
  
  async createWalletFromMnemonic(mnemonic, restoreHeight) {
    return await MoneroWalletKeys.createWalletFromMnemonic(TestUtils.NETWORK_TYPE, mnemonic, restoreHeight, undefined);
  }
  
  async createWalletFromKeys(address, privateViewKey, privateSpendKey, daemonConnection, firstReceiveHeight, language) {  // TODO: daemonConnection placeholder not applicable for this method, use wallet creation config?
    return await MoneroWalletKeys.createWalletFromKeys(TestUtils.NETWORK_TYPE, address, privateViewKey, privateSpendKey, language);
  }
  
  runTests(config) {
    let that = this;
    describe("TEST MONERO WALLET KEYS", function() {
      
      // initialize wallet
      before(async function() {
        MoneroWalletKeys = await require("../main/js/wallet/MoneroWalletKeys")();
        that.wallet = await TestUtils.getWalletKeys();
      });
      
      // run tests specific to keys wallet
      that._testWalletKeys(config);
      
      // run common tests
      that.runCommonTests(config);
    });
  }
  
  // ---------------------------------- PRIVATE -------------------------------
  
  _testWalletKeys(config) {
    let that = this;
    let daemon = this.daemon;
    
    describe("Tests specific to keys wallet", function() {
      
    });
  }
}

module.exports = TestMoneroWalletKeys