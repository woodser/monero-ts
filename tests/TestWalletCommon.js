const assert = require("assert");
const TestUtils = require("./TestUtils");
const GenUtils = require("../src/utils/GenUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");
const BigInteger = require("../src/submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;

/**
 * Runs common tests that any Monero wallet should implement.
 * 
 * @param wallet is the Monero wallet to test
 * @param daemon informs some tests
 */
function testWallet(wallet, daemon) {
  
  it("Can get the current height that the wallet is synchronized to", async function() {
    let height = await wallet.getHeight();
    assert(height >= 0);
  });
  
  it("Can get the mnemonic phrase derived from the seed", async function() {
    let mnemonic = await wallet.getMnemonic();
    MoneroUtils.validateMnemonic(mnemonic);
    assert.equal(TestUtils.TEST_MNEMONIC, mnemonic);
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
    let primaryAddress = await wallet.getPrimaryAddress();
    MoneroUtils.validateAddress(primaryAddress);
    assert.equal((await wallet.getSubaddress(0, 0)).getAddress(), primaryAddress);
  });
  
  it("Can get an integrated address given a payment id", async function() {
    
    // save address for later comparison
    let address = (await wallet.getSubaddress(0, 0)).getAddress();
    
    // test valid payment id
    let paymentId = "03284e41c342f036";
    let integratedAddress = await wallet.getIntegratedAddress(paymentId);
    assert.equal(address, integratedAddress.getStandardAddress());
    assert.equal(paymentId, integratedAddress.getPaymentId());
    
    // test invalid payment id
    try {
      let invalidPaymentId = "invalid_payment_id_123456";
      integratedAddress = await wallet.getIntegratedAddress(invalidPaymentId);
      fail("Getting integrated address with invalid payment id " + invalidPaymentId + " should have thrown a RPC exception");
    } catch (e) {
      assert.equal(-5, e.getRpcCode());
      assert.equal("Invalid payment ID", e.getRpcMessage());
    }
    
    // test null payment id which generates a new one
    integratedAddress = await wallet.getIntegratedAddress(null);
    assert.equal(address, integratedAddress.getStandardAddress());
    assert(integratedAddress.getPaymentId().length);
  });
  
  it("Can decode an integrated address", async function() {
    let integratedAddress = await wallet.getIntegratedAddress("03284e41c342f036");
    let decodedAddress = await wallet.decodeIntegratedAddress(integratedAddress.toString());
    assert.deepEqual(integratedAddress, decodedAddress);
  });
  
  it("Can sync (without progress)", async function() {
    let numBlocks = 100;
    let chainHeight = await daemon.getHeight();
    assert(chainHeight >= numBlocks);
    let resp = await wallet.sync(chainHeight - numBlocks);  // sync end of chain
    assert(resp.blocks_fetched >= 0);
    assert(typeof resp.received_money === "boolean");
  });
  
  it("Can get the balance and unlocked balance", async function() {
    let balance = await wallet.getBalance();
    testUnsignedBigInteger(balance);
    let unlockedBalance = await wallet.getUnlockedBalance();
    testUnsignedBigInteger(unlockedBalance);
  });
  
  it("Can get all accounts in the wallet without subaddresses", async function() {
    let accounts = await wallet.getAccounts();
    assert(accounts.length > 0);
    accounts.map(account => {
      testAccount(account)
      assert(account.getSubaddresses() === undefined);
    });
  });
  
  it("Can get all accounts in the wallet with subaddresses", async function() {
    let accounts = await wallet.getAccounts(true);
    assert(accounts.length > 0);
    accounts.map(account => {
      testAccount(account);
      assert(account.getSubaddresses().length > 0);
    });
  });
  
  it("Can get an account at a specified index", async function() {
    let accounts = await wallet.getAccounts();
    assert(accounts.length > 0);
    for (let account of accounts) {
      testAccount(account);
      
      // test without subaddresses
      let retrieved = await wallet.getAccount(account.getIndex());
      assert(retrieved.getSubaddresses() === undefined);
      
      // test with subaddresses
      retrieved = await wallet.getAccount(account.getIndex(), true);
      assert(retrieved.getSubaddresses().length > 0);
    }
  });
  
  it("Can create a new account without a label", async function() {
    let accountsBefore = await wallet.getAccounts();
    let createdAccount = await wallet.createAccount();
    testAccount(createdAccount);
    assert(createdAccount.getLabel() === undefined);
    assert(accountsBefore.length === (await wallet.getAccounts().size()) - 1);
  });
  
  it("Can create a new account with a label", async function() {
    
    // create account with label
    let accountsBefore = await wallet.getAccounts();
    let label = GenUtils.uuidv4();
    let createdAccount = await wallet.createAccount(label);
    testAccount(createdAccount);
    assert(createdAccount.getLabel() === label);
    assert(accountsBefore.length === (await wallet.getAccounts().size()) - 1);

    // create account with same label
    createdAccount = await wallet.createAccount(label);
    testAccount(createdAccount);
    assert(createdAccount.getLabel() === label);
    assert(accountsBefore.length === (await wallet.getAccounts().size()) - 2);
  });
  
  it("Can get subaddresses at a specified account index", async function() {
    let accounts = await wallet.getAccounts();
    assert(accounts.length > 0);
    for (let account of accounts) {
      let subaddresses = await wallet.getSubaddresses(account.getIndex());
      assert(subaddresses.length > 0);
      subaddresses.map(subaddress => {
        testSubaddress(subaddress);
        assert(account.getIndex() === subaddress.getAccountIndex());
      });
    }
  });
  
  it("Can get subaddresses at specified account and subaddress indices", async function() {
    let accounts = await wallet.getAccounts();
    assert(accounts.length > 0);
    for (let account of accounts) {
      
      // get subaddresses
      let subaddresses = await wallet.getSubaddresses(account.getIndex());
      assert(subaddresses.length > 0);
      
      // remove a subaddress for query if possible
      if (subaddresses.length > 1) subaddresses.splice(0, 1);
      
      // get subaddress indices
      let subaddressIndices = subaddresses.map(subaddress => subaddress.getSubaddrIndex());
      assert(subaddressIndices.length > 0);
      
      // fetch subaddresses by indices
      let fetchedSubaddresses = await wallet.getSubaddresses(account.getIndex(), subaddressIndices);
      
      // original subaddresses (minus one removed if applicable) is equal to fetched subaddresses
      assert.deepEqual(subaddresses, fetchedSubaddresses);
    }
  });
  
  it("Can get a subaddress at a specified account and subaddress index", async function() {
    let accounts = await wallet.getAccounts();
    assert(accounts.length > 0);
    for (let account of accounts) {
      let subaddresses = await wallet.getSubaddresses(account.getIndex());
      assert(subaddresses.length > 0);
      for (let subaddress of subaddresses) {
        assert.deepEqual(subaddress, await wallet.getSubaddress(account.getIndex(), subaddress.getSubaddrIndex()));
        assert.deepEqual(subaddress, (await wallet.getSubaddresses(account.getIndex(), subaddress.getSubaddrIndex()))[0]); // test plural call with single subaddr number
      }
    }
  });
  
  it("Can create a subaddress with and without a label", async function() {
    
    // create subaddresses across accounts
    let accounts = await wallet.getAccounts();
    if (accounts.length < 2) await wallet.createAccount();
    accounts = await wallet.getAccounts();
    assert(accounts.length > 1);
    for (let accountIdx = 0; accountIdx < 2; accountIdx++) {
      
      // create subaddress with no label
      let subaddresses = await wallet.getSubaddresses(accountIdx);
      let subaddress = await wallet.createSubaddress(accountIdx);
      assert.equal("", subaddress.getLabel());
      testSubaddress(subaddress);
      let subaddressesNew = await wallet.getSubaddresses(accountIdx);
      assert.equal(subaddresses.length, subaddressesNew.length - 1);
      assert.deepEqual(subaddress, subaddressesNew.get(subaddressesNew.size() - 1));
      
      // create subaddress with label
      subaddresses = await wallet.getSubaddresses(accountIdx);
      let uuid = GenUtils.uuidv4();
      subaddress = await wallet.createSubaddress(accountIdx, uuid);
      assert.equal(subaddress.getLabel(), uuid);
      testSubaddress(subaddress);
      subaddressesNew = await wallet.getSubaddresses(accountIdx);
      assert.equal(subaddresses.length, subaddressesNew.length - 1);
      assert.equals(subaddress, subaddressesNew.get(subaddressesNew.length - 1));
    }
  });
  
  it("Can get the address of a subaddress at a specified account and subaddress index", async function() {
    assert.equal(await wallet.getPrimaryAddress(), (await wallet.getSubaddress(0, 0)).getAddress());
    for (let account of await wallet.getAccounts(true)) {
      for (let subaddress of await wallet.getSubaddresses(account.getIndex())) {
        assert.equal(subaddress.getAddress(), await wallet.getAddress(account.getIndex(), subaddress.getSubaddrIndex()));
      }
    }
  });
  
  it("Has proper accounting across all accounts and subaddresses", async function() {
    
    // get wallet balances
    let balance = await wallet.getBalance();
    testUnsignedBigInteger(balance);
    let unlockedBalance = await wallet.getUnlockedBalance();
    testUnsignedBigInteger(unlockedBalance);
    assert(balance >= unlockedBalance);
    
    // get wallet accounts and subaddresses
    let accounts = await wallet.getAccounts(true);
    
    // test that subaddress balances add up to each account balances
    for (let account of accounts) {
      throw new Error("Not implemented");
    }
    
    // test that account balances add up to wallet balances
    throw new Error("Now implemented");
  });
  
  it("Can get transactions pertaining to the wallet", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get transactions pertaining to an account", async function() {
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

function testUnsignedBigInteger(num) {
  assert(num instanceof BigInteger);
  assert(num.toJSValue() >= 0);
}

function testAccount(account) {
  
  // test account
  assert(account);
  assert(account.getIndex() >= 0);
  assert(account.getPrimaryAddress());
  testUnsignedBigInteger(account.getBalance());
  testUnsignedBigInteger(account.getUnlockedBalance());
  
  // if given, test subaddresses and that their balances add up to account balances
  if (account.getSubaddresses()) {
    let balance = BigInteger.valueOf(0);
    let unlockedBalance = BigInteger.valueOf(0);
    for (let i = 0; i < account.getSubaddresses().length; i++) {
      testSubaddress(account.getSubaddresses()[i]);
      assert.equal(account.getIndex(), account.getSubaddresses()[i].getAccountIndex());
      assert.equal(i, account.getSubaddresses()[i].getSubaddrIndex());
      balance = balance.add(account.getSubaddresses()[i].getBalance());
      unlockedBalance = unlockedBalance.add(account.getSubaddresses()[i].getUnlockedBalance());
    }
    assert(account.getBalance().compare(balance) === 0, "Subaddress balances " + balance + " does not equal account balance " + account.getBalance());
    assert(account.getUnlockedBalance().compare(unlockedBalance) === 0, "Subaddress unlocked balances " + unlockedBalance + " does not equal account unlocked balance " + account.getUnlockedBalance());
  }
}

function testSubaddress(subaddress) {
  assert(subaddress.getAccountIndex() >= 0);
  assert(subaddress.getSubaddrIndex() >= 0);
  assert(subaddress.getAddress());
  testUnsignedBigInteger(subaddress.getBalance());
  testUnsignedBigInteger(subaddress.getUnlockedBalance());
  assert(subaddress.getNumUnspentOutputs() >= 0);
  if (subaddress.getBalance().toJSValue() > 0) assert(subaddress.getIsUsed());
}

module.exports.testWallet = testWallet;