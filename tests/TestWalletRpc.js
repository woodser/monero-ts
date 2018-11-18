const TestUtils = require("./TestUtils");
const TestWallet = require("./TestWallet");

// get wallet
let wallet = TestUtils.getWalletRpc();

describe("Monero Wallet RPC", function() {
  
  // run common tests
  TestWallet.testWallet(wallet);
  
  it("Can indicate if multisig import is needed for correct balance information", async function() {
    throw new Error("Not implemented");
  });
});