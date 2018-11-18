const TestUtils = require("./TestUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");
const TestWallet = require("./TestWallet");

// get core utils
MoneroUtils.getCoreUtils().then(function(coreUtils) {
  
  // get wallet
  let wallet = TestUtils.getWalletLocal(coreUtils);
  
  describe("Monero Wallet Local", function() {
    
    // run common tests
    TestWallet.testWallet(wallet);
    
    // tests specific to local wallet here
  });
});