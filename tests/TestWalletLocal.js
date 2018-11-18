const TestUtils = require("./TestUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");
const TestWallet = require("./TestWallet");

// get core utils
MoneroUtils.getCoreUtils().then(function(coreUtils) {
  
  // get wallet
  let wallet = TestUtils.getWalletLocal(coreUtils);

  // test wallet
  new TestWallet("Test Wallet Local", wallet).run();
});