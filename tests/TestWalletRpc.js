const TestUtils = require("./TestUtils");
const TestWallet = require("./TestWallet");

// get wallet
let wallet = TestUtils.getWalletRpc();

// test wallet
new TestWallet("Test Wallet RPC", wallet).run();