const TestUtils = require("./TestUtils");
const WalletTester = require("./WalletTester");
const MoneroWalletLocal = require("../src/wallet/MoneroWalletLocal");

// get core utils
MoneroWalletLocal.getCoreUtils().then(function(coreUtils) {
  
  // get wallet
  let wallet = TestUtils.getWalletLocal(coreUtils);

  // test wallet
  new WalletTester("Test Wallet Local", wallet).run();
});