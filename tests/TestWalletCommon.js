const assert = require("assert");
const TestUtils = require("./TestUtils");
const GenUtils = require("../src/utils/GenUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");
const BigInteger = require("../src/submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;

/**
 * Runs common tests that any Monero wallet should implement.
 * 
 * TODO: test filtering with not relayed
 * 
 * @param wallet is the Monero wallet to test
 * @param daemon informs some tests
 */
let txCache;  // caches transactions to optimize tests
function testWallet(wallet, daemon) {
  
  async function getCachedTxs() {
    if (!txCache) txCache = await wallet.getTxs();
    return txCache;
  }
  
//  it("Can get the current height that the wallet is synchronized to", async function() {
//    let height = await wallet.getHeight();
//    assert(height >= 0);
//  });
//  
//  it("Can get the mnemonic phrase derived from the seed", async function() {
//    let mnemonic = await wallet.getMnemonic();
//    MoneroUtils.validateMnemonic(mnemonic);
//    assert.equal(TestUtils.TEST_MNEMONIC, mnemonic);
//  });
//  
//  it("Can get a list of supported languages for the mnemonic phrase", async function() {
//    let languages = await wallet.getLanguages();
//    assert(Array.isArray(languages));
//    assert(languages.length);
//    for (let language of languages) assert(language);
//  });
//  
//  it("Can get the private view key", async function() {
//    let privateViewKey = await wallet.getPrivateViewKey()
//    MoneroUtils.validatePrivateViewKey(privateViewKey);
//  });
//  
//  it("Can get the primary address", async function() {
//    let primaryAddress = await wallet.getPrimaryAddress();
//    MoneroUtils.validateAddress(primaryAddress);
//    assert.equal((await wallet.getSubaddress(0, 0)).getAddress(), primaryAddress);
//  });
//  
//  it("Can get an integrated address given a payment id", async function() {
//    
//    // save address for later comparison
//    let address = (await wallet.getSubaddress(0, 0)).getAddress();
//    
//    // test valid payment id
//    let paymentId = "03284e41c342f036";
//    let integratedAddress = await wallet.getIntegratedAddress(paymentId);
//    assert.equal(address, integratedAddress.getStandardAddress());
//    assert.equal(paymentId, integratedAddress.getPaymentId());
//    
//    // test invalid payment id
//    try {
//      let invalidPaymentId = "invalid_payment_id_123456";
//      integratedAddress = await wallet.getIntegratedAddress(invalidPaymentId);
//      fail("Getting integrated address with invalid payment id " + invalidPaymentId + " should have thrown a RPC exception");
//    } catch (e) {
//      assert.equal(-5, e.getRpcCode());
//      assert.equal("Invalid payment ID", e.getRpcMessage());
//    }
//    
//    // test null payment id which generates a new one
//    integratedAddress = await wallet.getIntegratedAddress(null);
//    assert.equal(address, integratedAddress.getStandardAddress());
//    assert(integratedAddress.getPaymentId().length);
//  });
//  
//  it("Can decode an integrated address", async function() {
//    let integratedAddress = await wallet.getIntegratedAddress("03284e41c342f036");
//    let decodedAddress = await wallet.decodeIntegratedAddress(integratedAddress.toString());
//    assert.deepEqual(integratedAddress, decodedAddress);
//  });
//  
//  it("Can sync (without progress)", async function() {
//    let numBlocks = 100;
//    let chainHeight = await daemon.getHeight();
//    assert(chainHeight >= numBlocks);
//    let resp = await wallet.sync(chainHeight - numBlocks);  // sync end of chain
//    assert(resp.blocks_fetched >= 0);
//    assert(typeof resp.received_money === "boolean");
//  });
//  
//  it("Can get the balance and unlocked balance", async function() {
//    let balance = await wallet.getBalance();
//    testUnsignedBigInteger(balance);
//    let unlockedBalance = await wallet.getUnlockedBalance();
//    testUnsignedBigInteger(unlockedBalance);
//  });
//  
//  it("Can get all accounts in the wallet without subaddresses", async function() {
//    let accounts = await wallet.getAccounts();
//    assert(accounts.length > 0);
//    accounts.map(account => {
//      testAccount(account)
//      assert(account.getSubaddresses() === undefined);
//    });
//  });
//  
//  it("Can get all accounts in the wallet with subaddresses", async function() {
//    let accounts = await wallet.getAccounts(true);
//    assert(accounts.length > 0);
//    accounts.map(account => {
//      testAccount(account);
//      assert(account.getSubaddresses().length > 0);
//    });
//  });
//  
//  it("Can get an account at a specified index", async function() {
//    let accounts = await wallet.getAccounts();
//    assert(accounts.length > 0);
//    for (let account of accounts) {
//      testAccount(account);
//      
//      // test without subaddresses
//      let retrieved = await wallet.getAccount(account.getIndex());
//      assert(retrieved.getSubaddresses() === undefined);
//      
//      // test with subaddresses
//      retrieved = await wallet.getAccount(account.getIndex(), true);
//      assert(retrieved.getSubaddresses().length > 0);
//    }
//  });
//  
//  it("Can create a new account without a label", async function() {
//    let accountsBefore = await wallet.getAccounts();
//    let createdAccount = await wallet.createAccount();
//    testAccount(createdAccount);
//    assert(createdAccount.getLabel() === undefined);
//    assert(accountsBefore.length === (await wallet.getAccounts()).length - 1);
//  });
//  
//  it("Can create a new account with a label", async function() {
//    
//    // create account with label
//    let accountsBefore = await wallet.getAccounts();
//    let label = GenUtils.uuidv4();
//    let createdAccount = await wallet.createAccount(label);
//    testAccount(createdAccount);
//    assert(createdAccount.getLabel() === label);
//    assert(accountsBefore.length === (await wallet.getAccounts()).length - 1);
//
//    // create account with same label
//    createdAccount = await wallet.createAccount(label);
//    testAccount(createdAccount);
//    assert(createdAccount.getLabel() === label);
//    assert(accountsBefore.length === (await wallet.getAccounts()).length - 2);
//  });
//  
//  it("Can get subaddresses at a specified account index", async function() {
//    let accounts = await wallet.getAccounts();
//    assert(accounts.length > 0);
//    for (let account of accounts) {
//      let subaddresses = await wallet.getSubaddresses(account.getIndex());
//      assert(subaddresses.length > 0);
//      subaddresses.map(subaddress => {
//        testSubaddress(subaddress);
//        assert(account.getIndex() === subaddress.getAccountIndex());
//      });
//    }
//  });
//  
//  it("Can get subaddresses at specified account and subaddress indices", async function() {
//    let accounts = await wallet.getAccounts();
//    assert(accounts.length > 0);
//    for (let account of accounts) {
//      
//      // get subaddresses
//      let subaddresses = await wallet.getSubaddresses(account.getIndex());
//      assert(subaddresses.length > 0);
//      
//      // remove a subaddress for query if possible
//      if (subaddresses.length > 1) subaddresses.splice(0, 1);
//      
//      // get subaddress indices
//      let subaddressIndices = subaddresses.map(subaddress => subaddress.getSubaddrIndex());
//      assert(subaddressIndices.length > 0);
//      
//      // fetch subaddresses by indices
//      let fetchedSubaddresses = await wallet.getSubaddresses(account.getIndex(), subaddressIndices);
//      
//      // original subaddresses (minus one removed if applicable) is equal to fetched subaddresses
//      assert.deepEqual(subaddresses, fetchedSubaddresses);
//    }
//  });
//  
//  it("Can get a subaddress at a specified account and subaddress index", async function() {
//    let accounts = await wallet.getAccounts();
//    assert(accounts.length > 0);
//    for (let account of accounts) {
//      let subaddresses = await wallet.getSubaddresses(account.getIndex());
//      assert(subaddresses.length > 0);
//      for (let subaddress of subaddresses) {
//        assert.deepEqual(subaddress, await wallet.getSubaddress(account.getIndex(), subaddress.getSubaddrIndex()));
//        assert.deepEqual(subaddress, (await wallet.getSubaddresses(account.getIndex(), subaddress.getSubaddrIndex()))[0]); // test plural call with single subaddr number
//      }
//    }
//  });
//  
//  it("Can create a subaddress with and without a label", async function() {
//    
//    // create subaddresses across accounts
//    let accounts = await wallet.getAccounts();
//    if (accounts.length < 2) await wallet.createAccount();
//    accounts = await wallet.getAccounts();
//    assert(accounts.length > 1);
//    for (let accountIdx = 0; accountIdx < 2; accountIdx++) {
//      
//      // create subaddress with no label
//      let subaddresses = await wallet.getSubaddresses(accountIdx);
//      let subaddress = await wallet.createSubaddress(accountIdx);
//      assert.equal("", subaddress.getLabel());
//      testSubaddress(subaddress);
//      let subaddressesNew = await wallet.getSubaddresses(accountIdx);
//      assert.equal(subaddresses.length, subaddressesNew.length - 1);
//      assert.deepEqual(subaddress, subaddressesNew[subaddressesNew.length - 1]);
//      
//      // create subaddress with label
//      subaddresses = await wallet.getSubaddresses(accountIdx);
//      let uuid = GenUtils.uuidv4();
//      subaddress = await wallet.createSubaddress(accountIdx, uuid);
//      assert.equal(subaddress.getLabel(), uuid);
//      testSubaddress(subaddress);
//      subaddressesNew = await wallet.getSubaddresses(accountIdx);
//      assert.equal(subaddresses.length, subaddressesNew.length - 1);
//      assert.deepEqual(subaddress, subaddressesNew[subaddressesNew.length - 1]);
//    }
//  });
//  
//  it("Can get the address of a subaddress at a specified account and subaddress index", async function() {
//    assert.equal(await wallet.getPrimaryAddress(), (await wallet.getSubaddress(0, 0)).getAddress());
//    for (let account of await wallet.getAccounts(true)) {
//      for (let subaddress of await wallet.getSubaddresses(account.getIndex())) {
//        assert.equal(subaddress.getAddress(), await wallet.getAddress(account.getIndex(), subaddress.getSubaddrIndex()));
//      }
//    }
//  });
//  
//  it("Has proper accounting across all accounts and subaddresses", async function() {
//    
//    // get wallet balances
//    let walletBalance = await wallet.getBalance();
//    let walletUnlockedBalance = await wallet.getUnlockedBalance();
//    testUnsignedBigInteger(walletBalance);
//    testUnsignedBigInteger(walletUnlockedBalance);
//    assert(walletBalance >= walletUnlockedBalance);
//    
//    // get wallet accounts and subaddresses
//    let accounts = await wallet.getAccounts(true);
//    
//    // add account balances
//    let accountsBalance = new BigInteger(0);
//    let accountsUnlockedBalance = new BigInteger(0);
//    for (let account of accounts) {
//      testAccount(account); // tests that subaddress balances add to account balance
//      accountsBalance = accountsBalance.add(account.getBalance());
//      accountsUnlockedBalance = accountsUnlockedBalance.add(account.getUnlockedBalance());
//    }
//    
//    // test that wallet balances equal sum of account balances
//    assert.equal(walletBalance.toJSValue(), accountsBalance.toJSValue());
//    assert.equal(walletUnlockedBalance.toJSValue(), accountsUnlockedBalance.toJSValue());
//  });
  
  it("Has a balance that is the sum of all unspent incoming transactions", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get transactions pertaining to the wallet", async function() {
    let nonDefaultIncoming = false;
    let txs1 = await getCachedTxs();
    let txs2 = await wallet.getTxs();
    assert.equal(txs1.length, txs2.length);
    for (let i = 0; i < txs1.length; i++) {
      testGetTx(txs1[i], null, wallet);
      testGetTx(txs2[i], null, wallet);
      assert.deepEqual(txs1[i], txs2[i]);
      if (!MoneroUtils.isOutgoing(txs1[i].getType())) { // TODO: better way than this...
        for (let payment of txs1[i].getPayments()) {
          if (payment.getAccountIndex() !== 0 && payment.getSubaddrIndex() !== 0) nonDefaultIncoming = true;
        }
      }
    }
    assert(nonDefaultIncoming, "No incoming transactions found in non-default account and subaddress; run testSendToMultiple() first");
  });
  
//  it("Can get transactions pertaining to an account", async function() {
//    let nonDefaultIncoming = false;
//    for (let account of await wallet.getAccounts()) {
//      let = await wallet.getTxs(account.getIndex());
//      for (let tx of txs) {
//        testGetTx(tx, null, wallet);
//        if (MoneroUtils.isOutgoing(tx.getType())) {
//          assert.equal(account.getIndex(), tx.getSrcAccountIndex());
//        } else {
//          for (let payment of tx.getPayments()) {
//            assert.equal(account.getIndex(), payment.getAccountIndex());
//            if (payment.getAccountIndex() !== 0 && payment.getSubaddrIndex() !== 0) nonDefaultIncoming = true;
//          }
//        }
//      }
//    }
//    assertTrue(nonDefaultIncoming, "No incoming transactions found in non-default account and subaddress; run testSendToMultiple() first");
//  });
//  
//  it("Can get transactions pertaining to a subaddress", async function() {
//    let nonDefaultIncoming = false;
//    let accounts = await wallet.getAccounts(true);
//    for (let accountIdx = 0; accountIdx < Math.min(accounts.length, 3); accountIdx++) {
//      for (let subaddressIdx = 0; subaddressIdx < Math.min(accounts[accountIdx].getSubaddresses().length, 5); subaddressIdx++) {
//        for (let tx of await wallet.getTxs(accountIdx, subaddressIdx)) {
//          testGetTx(tx, null, wallet);
//          if (MoneroUtils.isOutgoing(tx.getType()))  {
//            assert.equal(accountIdx, tx.getSrcAccountIndex());
//          } else {
//            for (let payment of tx.getPayments()) {
//              assert.equal(accountIdx, payment.getAccountIndex());
//              assert.equal(subaddressIdx, payment.getSubaddrIndex());
//              if (payment.getAccountIndex() !== 0 && payment.getSubaddrIndex() !== 0) nonDefaultIncoming = true;
//            }
//          }
//        }
//      }
//    }
//    assertTrue(nonDefaultIncoming, "No incoming transactions found in non-default account and subaddress; run testSendToMultiple() first");
//  });
//  
//  it("Can get transactions filtered by having payments or not", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can get wallet transactions by id", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can get wallet transactions with a filter", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can get and set a transaction note", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can get and set multiple transaction notes", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can check a transaction using secret key", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can prove a transaction by checking its signature", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can prove a spend using a generated signature and no destination public address", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can prove reserves in the wallet", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can prove reserves in an account", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can get outputs in hex format", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can import outputs in hex format", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can get key images", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can import key images", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can sign and verify messages", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can get and set arbitrary key/value attributes", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can create a payment URI using the official URI spec", async function() {
//    throw new Error("Not implemented");
//  });
//  
//  it("Can parse a payment URI using the official URI spec", async function() {
//    throw new Error("Not implemented");
//  });
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