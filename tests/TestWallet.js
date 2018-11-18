const assert = require("assert");
const MoneroUtils = require("../src/utils/MoneroUtils");

function testWallet(wallet) {
  
  it("Can synchronize (whatever that means yet :)", async function() {
    await wallet.sync();
  });
  
  it("Can get the current height that the wallet is synchronized to", function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the seed", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the mnemonic phrase derived from the seed", async function() {
    let mnemonic = await wallet.getMnemonic();
    MoneroUtils.validateMnemonic(mnemonic);
  });
  
  it("Can get the language of the mnemonic phrase", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the public view key", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the private view key", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the public spend key", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the private spend key", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the primary address", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get an integrated address given a payment id", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get all accounts in the wallet", async function() {
    throw new Error("Not implemented"); //  TODO: test retrieving with subaddresses
  });
  
  it("Can get accounts filtered by a tag", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get an account at a specified index", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can create a new account", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can create a new account with a label", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get subaddresses at a specified account index", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get subaddresses at specified account and subaddress indices", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get a subaddress at a specified account and subaddress index", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can create a subaddress", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can create a subaddress with a label", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the address of a subaddress at a specified account and subaddress index", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the balance across all accounts", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the unlocked balance across all accounts", async function() {
    throw new Error("Not implemented");
  });
  
  it("TODO", async function() {
    throw new Error("Not implemented");
  });
  
  it("TODO", async function() {
    throw new Error("Not implemented");
  });
  
  it("TODO", async function() {
    throw new Error("Not implemented");
  });
  
  it("TODO", async function() {
    throw new Error("Not implemented");
  });
  
  it("TODO", async function() {
    throw new Error("Not implemented");
  });
  
  it("TODO", async function() {
    throw new Error("Not implemented");
  });
  
  it("TODO", async function() {
    throw new Error("Not implemented");
  });
  
  it("TODO", async function() {
    throw new Error("Not implemented");
  });
  
  it("TODO", async function() {
    throw new Error("Not implemented");
  });
  
  it("TODO", async function() {
    throw new Error("Not implemented");
  });
  
  it("TODO", async function() {
    throw new Error("Not implemented");
  });
  
  it("TODO", async function() {
    throw new Error("Not implemented");
  });
  
  it("TODO", async function() {
    throw new Error("Not implemented");
  });
  
  it("TODO", async function() {
    throw new Error("Not implemented");
  });
}

module.exports.testWallet = testWallet;