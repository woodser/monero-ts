const MoneroWalletKeys = require("../main/js/wallet/MoneroWalletKeys");
const TestMoneroWalletCommon = require("./TestMoneroWalletCommon");

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
  
  async createRandomWallet() {
    return await MoneroWalletKeys.createWalletRandom(TestUtils.NETWORK_TYPE);
  }
  
  async createWalletFromKeys(address, privateViewKey, privateSpendKey, daemonConnection, firstReceiveHeight, language) {
    return await MoneroWalletKeys.createWalletFromKeys(address, privateViewKey, privateSpendKey, language);
  }
  
  runTests(config) {
    let that = this;
    describe("TEST MONERO WALLET KEYS", function() {
      
      // initialize wallet
      before(async function() {
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