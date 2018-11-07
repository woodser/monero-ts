const WalletTester = require("./WalletTester");
const TestUtils = require("./TestUtils");
require('../src/mymonero_core_js/monero_utils/monero_utils')().then(function(coreUtils) {
  let wallet = TestUtils.getWalletLocal(coreUtils);
  new WalletTester("Test Wallet Local", wallet).run();
});
