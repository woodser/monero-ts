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
  
  it("Can create and open a wallet", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can save the blockchain", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can rescan spent", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can be stopped", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can mine", async function() {
    throw new Error("Not implemented");
  });
  
  it("Has account tags to apply to and query accounts", async function() {
    throw new Error("Not implemented");
  });
  
  it("Has an address book", async function() {
    throw new Error("Not implemented");
  });
});