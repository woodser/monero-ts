const TestUtils = require("./TestUtils");
const WalletTester = require("./WalletTester");

// get wallet
let wallet = TestUtils.getWalletRpc();

// test wallet
new WalletTester("Test Wallet RPC", wallet).run();