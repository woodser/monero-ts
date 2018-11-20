const assert = require("assert");
const MoneroUtils = require("../src/utils/MoneroUtils");

function testWallet(wallet) {
  
  it("Can get the current height that the wallet is synchronized to", async function() {
    let height = await wallet.getHeight();
    assert(height >= 0);
  });
  
  it("Can get the mnemonic phrase derived from the seed", async function() {
    let mnemonic = await wallet.getMnemonic();
    MoneroUtils.validateMnemonic(mnemonic);
  });
  
  it("Can refresh (without progress)", async function() {
    let resp = await wallet.refresh();
    assert(resp.blocks_fetched >= 0);
    assert(typeof resp.received_money === "boolean");
  });
  
  it("Can get a list of supported languages for the mnemonic phrase", async function() {
    let languages = await wallet.getLanguages();
    assert(Array.isArray(languages));
    assert(languages.length);
    for (let language of languages) assert(language);
  });
  
  it("Can get the private view key", async function() {
    let privateViewKey = await wallet.getPrivateViewKey()
    MoneroUtils.validatePrivateViewKey(privateViewKey);
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
  
  it("Can get txs pertaining to the wallet", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get txs pertaining to an account", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get txs pertaining to a subaddress", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get txs filtered by having payments or not", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get wallet txs by id", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get wallet txs with a filter", async function() {
    throw new Error("Not implemented");
  });
  
  it("Has a balance that is the sum of all unspent incoming transactions", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get and set a tx note", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get and set multiple tx notes", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can check a transaction using secret key", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can prove a transaction by checking its signature", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can prove a spend using a generated signature and no destination public address", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can prove reserves in the wallet", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can prove reserves in an account", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get outputs in hex format", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can import outputs in hex format", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get key images", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can import key images", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can sign and verify messages", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get and set arbitrary key/value attributes", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can create a payment URI using the official URI spec", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can parse a payment URI using the official URI spec", async function() {
    throw new Error("Not implemented");
  });
}

module.exports.testWallet = testWallet;