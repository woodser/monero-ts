const MoneroUtils = require("../src/utils/MoneroUtils");
const TestUtils = require("./TestUtils");
const WalletTester = require("./WalletTester");
const MoneroWalletLocal = require("../src/wallet/MoneroWalletLocal");

// get core utils
MoneroUtils.getCoreUtils().then(function(coreUtils) {
  
  // get wallet
  let wallet = TestUtils.getWalletLocal(coreUtils);

  // test wallet
  new WalletTester("Test Wallet Local", wallet).run();
});