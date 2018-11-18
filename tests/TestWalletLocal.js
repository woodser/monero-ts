const TestUtils = require("./TestUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");
const WalletTester = require("./WalletTester");

// get core utils
MoneroUtils.getCoreUtils().then(function(coreUtils) {
  
  // get wallet
  let wallet = TestUtils.getWalletLocal(coreUtils);

  // test wallet
  new WalletTester("Test Wallet Local", wallet).run();
});