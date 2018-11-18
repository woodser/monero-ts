const TestUtils = require("./TestUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");
const TestWallet = require("./TestWallet");

// get core utils
MoneroUtils.getCoreUtils().then(function(coreUtils) {
  
  // get wallet
  let wallet = TestUtils.getWalletLocal(coreUtils);
  
  describe("Monero Wallet Local", function() {
    
    it("Can refresh which reports progress", async function() {
      throw new Error("Not implemented");
    });
    
    // run common tests
    TestWallet.testWallet(wallet);
  });
});