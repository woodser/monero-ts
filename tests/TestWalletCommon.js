const assert = require("assert");
const TestUtils = require("./TestUtils");
const GenUtils = require("../src/utils/GenUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");
const BigInteger = require("../src/submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroWallet = require("../src/wallet/MoneroWallet");
const MoneroDaemon = require("../src/daemon/MoneroDaemon");
const MoneroTx = require("../src/daemon/model/MoneroTx");
const MoneroTxWallet = require("../src/wallet/model/MoneroTxWallet");
const MoneroTxFilter = require("../src/wallet/model/MoneroTxFilter");

/**
 * Runs common tests that every Monero wallet implementation should support.
 * 
 * TODO: test filtering with not relayed
 */
class TestWalletCommon {
  
  /**
   * Constructs the tester.
   * 
   * @param wallet is the Monero wallet to test
   * @param daemon informs some tests
   */
  constructor(daemon, wallet) {
    assert(daemon instanceof MoneroDaemon);
    assert(wallet instanceof MoneroWallet);
    this.wallet = wallet;
    this.daemon = daemon;
  }
  
  /**
   * Runs the tests.
   */
  runTests() {
    
    let wallet = this.wallet;
    let daemon = this.daemon;
    
    // track ids of txs whose total amount !== sum of payments so one warning per tx is printed
    let unbalancedTxIds = []; // TODO: report issue, remove this when issue is fixed
    
    // local tx cache for tests
    let txCache;
    async function getCachedTxs() {
      if (!txCache) txCache = await wallet.getTxs();
      return txCache;
    }
    
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
      TestUtils.testUnsignedBigInteger(balance);
      let unlockedBalance = await wallet.getUnlockedBalance();
      TestUtils.testUnsignedBigInteger(unlockedBalance);
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
      assert(accountsBefore.length === (await wallet.getAccounts()).length - 1);
    });
    
    it("Can create a new account with a label", async function() {
      
      // create account with label
      let accountsBefore = await wallet.getAccounts();
      let label = GenUtils.uuidv4();
      let createdAccount = await wallet.createAccount(label);
      testAccount(createdAccount);
      assert(createdAccount.getLabel() === label);
      assert(accountsBefore.length === (await wallet.getAccounts()).length - 1);

      // create account with same label
      createdAccount = await wallet.createAccount(label);
      testAccount(createdAccount);
      assert(createdAccount.getLabel() === label);
      assert(accountsBefore.length === (await wallet.getAccounts()).length - 2);
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
        let subaddressIndices = subaddresses.map(subaddress => subaddress.getSubaddressIndex());
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
          assert.deepEqual(subaddress, await wallet.getSubaddress(account.getIndex(), subaddress.getSubaddressIndex()));
          assert.deepEqual(subaddress, (await wallet.getSubaddresses(account.getIndex(), subaddress.getSubaddressIndex()))[0]); // test plural call with single subaddr number
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
        assert.deepEqual(subaddress, subaddressesNew[subaddressesNew.length - 1]);
        
        // create subaddress with label
        subaddresses = await wallet.getSubaddresses(accountIdx);
        let uuid = GenUtils.uuidv4();
        subaddress = await wallet.createSubaddress(accountIdx, uuid);
        assert.equal(subaddress.getLabel(), uuid);
        testSubaddress(subaddress);
        subaddressesNew = await wallet.getSubaddresses(accountIdx);
        assert.equal(subaddresses.length, subaddressesNew.length - 1);
        assert.deepEqual(subaddress, subaddressesNew[subaddressesNew.length - 1]);
      }
    });
    
    it("Can get the address of a subaddress at a specified account and subaddress index", async function() {
      assert.equal(await wallet.getPrimaryAddress(), (await wallet.getSubaddress(0, 0)).getAddress());
      for (let account of await wallet.getAccounts(true)) {
        for (let subaddress of await wallet.getSubaddresses(account.getIndex())) {
          assert.equal(subaddress.getAddress(), await wallet.getAddress(account.getIndex(), subaddress.getSubaddressIndex()));
        }
      }
    });
    
    it("Has proper accounting across all accounts and subaddresses", async function() {
      
      // get wallet balances
      let walletBalance = await wallet.getBalance();
      let walletUnlockedBalance = await wallet.getUnlockedBalance();
      TestUtils.testUnsignedBigInteger(walletBalance);
      TestUtils.testUnsignedBigInteger(walletUnlockedBalance);
      assert(walletBalance >= walletUnlockedBalance);
      
      // get wallet accounts and subaddresses
      let accounts = await wallet.getAccounts(true);
      
      // add account balances
      let accountsBalance = new BigInteger(0);
      let accountsUnlockedBalance = new BigInteger(0);
      for (let account of accounts) {
        testAccount(account); // tests that subaddress balances add to account balance
        accountsBalance = accountsBalance.add(account.getBalance());
        accountsUnlockedBalance = accountsUnlockedBalance.add(account.getUnlockedBalance());
      }
      
      // test that wallet balances equal sum of account balances
      assert.equal(walletBalance.toJSValue(), accountsBalance.toJSValue());
      assert.equal(walletUnlockedBalance.toJSValue(), accountsUnlockedBalance.toJSValue());
    });
    
    it("Can get transactions pertaining to the wallet", async function() {
      let nonDefaultIncoming = false;
      let txs1 = await getCachedTxs();
      let txs2 = await wallet.getTxs();
      assert.equal(txs1.length, txs2.length);
      for (let i = 0; i < txs1.length; i++) {
        await testTxWalletGet(txs1[i], wallet, unbalancedTxIds);
        await testTxWalletGet(txs2[i], wallet, unbalancedTxIds);
        assert.deepEqual(txs1[i], txs2[i]);
        if (txs1[i].getIsIncoming()) {
          for (let payment of txs1[i].getPayments()) {
            if (payment.getAccountIndex() !== 0 && payment.getSubaddressIndex() !== 0) nonDefaultIncoming = true;
          }
        }
      }
      assert(nonDefaultIncoming, "No incoming transactions found in non-default account and subaddress; run testSendToMultiple() first");
    });
    
    it("Can get transactions pertaining to an account", async function() {
      let nonDefaultIncoming = false;
      for (let account of await wallet.getAccounts()) {
        let txs = await wallet.getTxs(account.getIndex());
        for (let tx of txs) {
          await testTxWalletGet(tx, wallet, unbalancedTxIds);
          if (tx.getIsOutgoing()) {
            assert.equal(account.getIndex(), tx.getSrcAccountIndex());
          } else {
            for (let payment of tx.getPayments()) {
              assert.equal(account.getIndex(), payment.getAccountIndex());
              if (payment.getAccountIndex() !== 0 && payment.getSubaddressIndex() !== 0) nonDefaultIncoming = true;
            }
          }
        }
      }
      assert(nonDefaultIncoming, "No incoming transactions found in non-default account and subaddress; run testSendToMultiple() first");
    });
    
    it("Can get transactions pertaining to a subaddress", async function() {
      let nonDefaultIncoming = false;
      let accounts = await wallet.getAccounts(true);
      for (let accountIdx = 0; accountIdx < Math.min(accounts.length, 3); accountIdx++) {
        for (let subaddressIdx = 0; subaddressIdx < Math.min(accounts[accountIdx].getSubaddresses().length, 5); subaddressIdx++) {
          for (let tx of await wallet.getTxs(accountIdx, subaddressIdx)) {
            await testTxWalletGet(tx, wallet, unbalancedTxIds);
            if (tx.getIsOutgoing())  {
              assert.equal(accountIdx, tx.getSrcAccountIndex());
            } else {
              for (let payment of tx.getPayments()) {
                assert.equal(accountIdx, payment.getAccountIndex());
                assert.equal(subaddressIdx, payment.getSubaddressIndex());
                if (payment.getAccountIndex() !== 0 && payment.getSubaddressIndex() !== 0) nonDefaultIncoming = true;
              }
            }
          }
        }
      }
      assert(nonDefaultIncoming, "No incoming transactions found in non-default account and subaddress; run testSendToMultiple() first");
    });
    
    it("Can get wallet transactions by id", async function() {
      
      // get random transactions
      let txs = await getRandomTransactions(wallet, undefined, 1, 5);
      
      // fetch transactions by id
      let txIds = [];
      for (let tx of txs) {
        txIds.push(tx.getId());
        let filter = new MoneroTxFilter();
        filter.setTxIds([tx.getId()]);
        let filteredTxs = await wallet.getTxs(filter);
        assert(filteredTxs.length > 0);
        for (let filteredTx of filteredTxs) {
          assert.equal(tx.getId(), filteredTx.getId());
        }
      }
      
      // fetch transactions by ids
      let filter = new MoneroTxFilter();
      filter.setTxIds(txIds);
      let filteredTxs = await wallet.getTxs(filter);
      assert(filteredTxs.length > 0);
      for (let filteredTx of filteredTxs) {
        assert(txIds.includes(filteredTx.getId()));
      }
      for (let txId of txIds) {
        let found = false;
        for (let filteredTx of filteredTxs) if (filteredTx.getId() === txId) found = true;
        assert(found, "No transaction with id " + txId + " fetched");
      }
    });
    
    it("Can get transactions filtered by having payments or not", async function() {
      
      // filter on having payments
      let filter = new MoneroTxFilter();
      filter.setAccountIndex(0);
      filter.setHasPayments(true);
      let txs = await wallet.getTxs(filter);
      assert(txs.length > 0);
      for (let tx of await wallet.getTxs(filter)) {
        assert(tx.getPayments());
        assert(tx.getPayments().length > 0);
      }
      
      // filter on not having payments
      filter.setHasPayments(false);
      txs = await wallet.getTxs(filter);
      assert(txs.length > 0);  // requires running rescan blockchain so tx payments get wiped
      for (let tx of await wallet.getTxs(filter)) {
        assert.equal(undefined, tx.getPayments());
      }
      
      // filter on no preference
      filter.setHasPayments(undefined);
      txs = await wallet.getTxs(filter);
      let foundPayments = false;
      let foundNoPayments = false;
      for (let tx of await wallet.getTxs(filter)) {
        if (tx.getPayments() !== undefined && tx.getPayments().length > 0) foundPayments = true;
        if (tx.getPayments() === undefined) foundNoPayments = true;
      }
      assert(foundPayments);
      assert(foundNoPayments);
    });
    
    it("Can get wallet transactions with a filter", async function() {
      
      // get all transactions for reference
      let allTxs = await getCachedTxs();
      assert(allTxs.length > 0);
      for (let tx of allTxs) {
        await testTxWalletGet(tx, wallet, unbalancedTxIds);
      }
      
      // test getting transactions by payment ids
      // TODO: this test is very slow, optimize
      let paymentIds = [];
      for (let tx of allTxs) paymentIds.push(tx.getPaymentId());
      assert(paymentIds.length > 0);
      for (let paymentId of paymentIds) {
        let filter = new MoneroTxFilter();
        filter.setPaymentIds([paymentId]);
        let txs = await wallet.getTxs(filter);
        assert(txs.length > 0);
        for (let tx of txs) {
          await testTxWalletGet(tx, wallet, unbalancedTxIds);
          assert(filter.getPaymentIds().includes(tx.getPaymentId()));
        }
      }
      
      // test getting incoming transactions
      let filter = new MoneroTxFilter();
      filter.setIsIncoming(true);
      filter.setIsConfirmed(true);
      let txs = await wallet.getTxs(filter);
      assert(txs.length > 0);
      for (let tx of txs) {
        assert(tx.getIsIncoming());
        assert(tx.getIsConfirmed());
      }
      
      // test getting outgoing transactions
      filter = new MoneroTxFilter();
      filter.setIsOutgoing(true);
      filter.setIsConfirmed(true);
      txs = await wallet.getTxs(filter);
      assert(txs.length > 0);
      for (let tx of txs) {
        assert(tx.getIsOutgoing());
        assert(tx.getIsConfirmed());
      }
      
      // test block height filtering
      {
        txs = await wallet.getTxs(0);
        assert(txs.length > 0, "No transactions; run send to multiple test");
          
        // get and sort block heights in ascending order
        let heights = [];
        for (let tx of txs) {
          if (tx.getHeight() !== undefined) heights.push(tx.getHeight());
        }
        GenUtils.sort(heights);
        
        // pick minimum and maximum heights for filtering
        let minHeight = -1;
        let maxHeight = -1;
        if (heights.length == 1) {
          minHeight = 0;
          maxHeight = heights[0] - 1;
        } else {
          minHeight = heights[0] + 1;
          maxHeight = heights[heights.length - 1] - 1;
        }
        
        // assert some transactions filtered
        let unfilteredCount = txs.length;
        filter = new MoneroTxFilter();
        filter.setAccountIndex(0);
        filter.setMinHeight(minHeight);
        filter.setMaxHeight(maxHeight);
        txs = await wallet.getTxs(filter);
        assert(txs.length > 0);
        assert(txs.length < unfilteredCount);
        for (let tx of txs) {
          assert(tx.getHeight() >= minHeight && tx.getHeight() <= maxHeight);
        }
      }
      
      // get all subaddresses with balances
      let subaddresses = [];
      for (let account of await wallet.getAccounts(true)) {
        for (let subaddress of account.getSubaddresses()) {
          if (subaddress.getBalance().compare(new BigInteger(0)) > 0 || subaddress.getUnlockedBalance().compare(new BigInteger(0)) > 0) {
            subaddresses.push(subaddress);
          }
        }
      }
      
      // test that unspent tx payments add up to balance
      for (let subaddress of subaddresses) {
        filter = new MoneroTxFilter();
        filter.setAccountIndex(subaddress.getAccountIndex());
        filter.setSubaddressIndices([subaddress.getSubaddressIndex()]);
        txs = await wallet.getTxs(filter);
        
        // test that unspent tx payments add up to subaddress balance
        let balance = new BigInteger(0);
        for (let tx of txs) {
          if (tx.getIsIncoming() && tx.getIsConfirmed()) {
            for (let payment of tx.getPayments()) {
              if (!payment.getIsSpent()) {  // TODO: test that typeof === "boolean" in testPayment() test
                balance = balance.add(payment.getAmount());
              }
            }
          }
        }
        let actualBalance = (await wallet.getSubaddress(subaddress.getAccountIndex(), subaddress.getSubaddressIndex())).getBalance();
        assert(actualBalance.compare(balance) === 0); // TODO: (monero-wallet-rpc): fails after send tests
      }
      
      // assert that ummet filter criteria has no results
      filter = new MoneroTxFilter();
      filter.setAccountIndex(0);
      filter.setSubaddressIndices([1234907]);
      txs = await wallet.getTxs(filter);
      assert(txs.length === 0);
    });
    
    it("Has a balance that is the sum of all unspent incoming transactions", async function() {

      // test each account balance
      for (let account of await wallet.getAccounts()) {
        
        // get transactions
        let filter = new MoneroTxFilter();
        filter.setAccountIndex(account.getIndex());
        let txs = await wallet.getTxs(filter);
        if (account.getIndex() === 0) assert(txs.length > 0);
        
        // sum balances of incoming payments and pending deductions
        let inBalance = new BigInteger(0);
        let inPoolBalance = new BigInteger(0);
        let outPoolBalance = new BigInteger(0);
        for (let tx of txs) {
          
          // handle incoming
          if (tx.getIsIncoming()) {
            assert(tx.getPayments().length > 0);
            for (let payment of tx.getPayments()) {
              if (!payment.getIsSpent()) {  // TODO: this should be tested as boolean in testPayment()
                if (tx.getIsConfirmed()) inBalance = inBalance.add(payment.getAmount());
                else inPoolBalance = inPoolBalance.add(payment.getAmount());
              }
            }
          }
          
          // handle outgoing
          else {
            if (tx.getInMempool()) outPoolBalance = outPoolBalance.add(tx.getTotalAmount()); // TODO: test pending balance
          }
        }
        
        // wallet balance must equal sum of unspent incoming txs
        let walletBalance = (await wallet.getAccount(account.getIndex())).getBalance();
        let expectedBalance = inBalance;  // TODO (monero-wallet-rpc): unconfirmed balance may not add up because of https://github.com/monero-project/monero/issues/4500
//        System.out.println("Wallet    : " + walletBalance);
//        System.out.println("Incoming  : " + incomingBalance);
//        System.out.println("Pending   : " + pendingBalance);
//        System.out.println("Mempool   : " + mempoolBalance);
//        System.out.println("Expected  : " + expectedBalance);
        assert(walletBalance.compare(expectedBalance) === 0, "Account " + account.getIndex() + " balance does not add up");
      }
    });
    
    it("Can get and set a transaction note", async function() {
      throw new Error("Not implemented");
    });
    
    it("Can get and set multiple transaction notes", async function() {
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
      let images = await wallet.getKeyImages();
      assert(Array.isArray(images));
      assert(images.length > 0, "No signed key images in wallet");  // TODO (monero-wallet-rpc): https://github.com/monero-project/monero/issues/4992
      for (let image of images) {
        assert(image.getKeyImage());
        assert(image.getSignature());
      }
    });
    
    it("Can import key images", async function() {
      let images = await wallet.getKeyImages();
      assert(Array.isArray(images));
      assert(images.length > 0);
      let result = await wallet.importKeyImages(images);
      assert(result.getHeight() > 0);
      TestUtils.testUnsignedBigInteger(result.getSpent(), true);  // tests assume wallet has spend history and balance
      TestUtils.testUnsignedBigInteger(result.getUnspent(), true);
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
}

function isUnsignedBigInteger(param) {
  if (param instanceof BigInteger && param.toJSValue() >= 0) return true;
  return false;
}

function testAccount(account) {
  
  // test account
  assert(account);
  assert(account.getIndex() >= 0);
  assert(account.getPrimaryAddress());
  TestUtils.testUnsignedBigInteger(account.getBalance());
  TestUtils.testUnsignedBigInteger(account.getUnlockedBalance());
  
  // if given, test subaddresses and that their balances add up to account balances
  if (account.getSubaddresses()) {
    let balance = BigInteger.valueOf(0);
    let unlockedBalance = BigInteger.valueOf(0);
    for (let i = 0; i < account.getSubaddresses().length; i++) {
      testSubaddress(account.getSubaddresses()[i]);
      assert.equal(account.getIndex(), account.getSubaddresses()[i].getAccountIndex());
      assert.equal(i, account.getSubaddresses()[i].getSubaddressIndex());
      balance = balance.add(account.getSubaddresses()[i].getBalance());
      unlockedBalance = unlockedBalance.add(account.getSubaddresses()[i].getUnlockedBalance());
    }
    assert(account.getBalance().compare(balance) === 0, "Subaddress balances " + balance + " does not equal account balance " + account.getBalance());
    assert(account.getUnlockedBalance().compare(unlockedBalance) === 0, "Subaddress unlocked balances " + unlockedBalance + " does not equal account unlocked balance " + account.getUnlockedBalance());
  }
}

function testSubaddress(subaddress) {
  assert(subaddress.getAccountIndex() >= 0);
  assert(subaddress.getSubaddressIndex() >= 0);
  assert(subaddress.getAddress());
  TestUtils.testUnsignedBigInteger(subaddress.getBalance());
  TestUtils.testUnsignedBigInteger(subaddress.getUnlockedBalance());
  assert(subaddress.getNumUnspentOutputs() >= 0);
  if (subaddress.getBalance().toJSValue() > 0) assert(subaddress.getIsUsed());
}

// common tests
function testTxWalletCommon(tx) {
  assert(tx.getId());
  assert.equal("boolean", typeof tx.getIsIncoming());
  assert.equal("boolean", typeof tx.getIsOutgoing());
  assert.equal("boolean", typeof tx.getIsConfirmed());
  assert.equal("boolean", typeof tx.getInMempool());
}

/**
 * Test a single transaction from a getTxs() request.
 * 
 * @param tx is the transaction to test
 * @param wallet is the tx's wallet to cross-reference
 * @param unbalancedTxIds is a cache of previously seen unbalanced txs so as not to spam the console with warnings
 * @param hasOutgoingPayments specifies if the tx has outgoing payents, undefined if doesn't matter
 */
async function testTxWalletGet(tx, wallet, unbalancedTxIds, hasOutgoingPayments) {
  
  // validate inputs
  assert(tx instanceof MoneroTxWallet);
  assert(hasOutgoingPayments === undefined || typeof hasOutgoingPayments === "boolean");
  assert(wallet instanceof MoneroWallet);
  
  // run tests
  testTxWalletCommon(tx);
  if (tx.getIsIncoming()) await testTxWalletGetIncoming(tx, wallet);
  else await testTxWalletGetOutgoing(tx, wallet, hasOutgoingPayments, unbalancedTxIds);
}

async function testTxWalletGetIncoming(tx, wallet) {
  
  // test state
  assert(tx.getIsIncoming());
  assert(!tx.getIsOutgoing());
  assert.equal(undefined, tx.getIsFailed());  // TODO: these really should be part of a separate class, MoneroTxWalletIncoming, MoneroTxWalletOutgoing
  assert.equal(undefined, tx.getIsRelayed());
  assert(typeof tx.getIsCoinbase() === "boolean");
  // TODO: validate state is self consistent
  
  // test common incoming
  assert(tx.getId());
  assert.equal(undefined, tx.getSrcAddress());
  assert.equal(undefined, tx.getSrcAccountIndex());
  assert.equal(undefined, tx.getSrcSubaddressIndex());
  assert(isUnsignedBigInteger(tx.getTotalAmount()));
  assert.notEqual(MoneroTx.DEFAULT_PAYMENT_ID, tx.getPaymentId());
  assert.equal(undefined, tx.getMixin());
  assert.equal(undefined, tx.getWeight());
  assert.equal(undefined, tx.getNote());
  
  // TODO (monero-wallet-rpc): incoming txs are occluded by outgoing counterparts from same account (https://github.com/monero-project/monero/issues/4500) and then incoming_transfers need address, fee, timestamp, unlock_time, is_double_spend, height, tx_size
//  if (tx.getFee() === undefined) console.log("WARNING: incoming transaction is occluded by outgoing counterpart (#4500): " + tx.getId());
//  if (tx.getFee() === undefined) console.log("WARNING: incoming transaction is missing fee: " + tx.getId());
//  if (tx.getTimestamp() === undefined) console.log("WARNING: incoming transaction is missing timestamp: " + tx.getId());
//  if (tx.getUnlockTime() === undefined) console.log("WARNING: incoming transaction is missing unlock_time: " + tx.getId());
//  if (tx.getIsDoubleSpend() === undefined) console.log("WARNING: incoming transaction is missing is_double_spend: " + tx.getId());
  if (tx.getFee() === undefined) {} // TODO: remove once #4500 fixed
  else assert(!tx.getIsDoubleSpend());
  assert.equal(undefined, tx.getHex());
  assert.equal(undefined, tx.getMetadata());
  
  // test confirmed
  if (tx.getIsConfirmed()) {
    assert.equal(undefined, tx.getKey());
//    if (tx.getHeight() === undefined) console.log("WARNING: incoming transaction is missing height: " + tx.getId());
//    if (tx.getNumConfirmations() === undefined) console.log("WARNING: incoming transaction is missing confirmations: " + tx.getId());
    if (tx.getNumConfirmations() === undefined) {} // TODO: remove once #4500 fixed
    else assert(tx.getNumConfirmations() > 0);
    assert.equal(undefined, tx.getNumEstimatedBlocksUntilConfirmed());
  }
  
  // test unconfirmed
  else {
    assert.equal(undefined, tx.getKey());
    assert.equal(undefined, tx.getHeight());
    assert.equal(0, tx.getNumConfirmations());
    assert(tx.getNumEstimatedBlocksUntilConfirmed() > 0);
  }
  
  // test payments
  assert(tx.getPayments());
  assert(tx.getPayments().length > 0);
  let totalAmount = new BigInteger(0);
  for (let payment of tx.getPayments()) {
    totalAmount = totalAmount.add(payment.getAmount());
    assert(payment.getAddress());
    assert(payment.getAccountIndex() >= 0);
    assert(payment.getSubaddressIndex() >= 0);
    assert.equal(await wallet.getAddress(payment.getAccountIndex(), payment.getSubaddressIndex()), payment.getAddress());
    assert(isUnsignedBigInteger(payment.getAmount()));
    assert(payment.getAmount().toJSValue() > 0);
    assert(typeof payment.getIsSpent() === "boolean");
    if (tx.getIsConfirmed()) assert(payment.getKeyImage());
    else assert.equal(undefined, payment.getKeyImage());   // TODO (monero-wallet-rpc): mempool transactions do not have key_images
  }
  assert(totalAmount.compare(tx.getTotalAmount()) === 0);
}

async function testTxWalletGetOutgoing(tx, wallet, hasOutgoingPayments, unbalancedTxIds) {
  assert(Array.isArray(unbalancedTxIds));
  
  // test state
  assert(tx);
  assert(tx.getIsIncoming() === false);
  assert(tx.getIsOutgoing());
  assert(typeof tx.getIsFailed() === "boolean");
  assert(typeof tx.getIsRelayed() === "boolean");
  assert.equal(undefined, tx.getIsCoinbase());
  // TODO: validate state is self consistent
  
  // test common outgoing
  assert(tx.getId());
  assert(tx.getSrcAccountIndex() >= 0);
  assert(tx.getSrcSubaddressIndex() >= 0);
  assert(tx.getSrcAddress());
  assert.equal(await wallet.getAddress(tx.getSrcAccountIndex(), tx.getSrcSubaddressIndex()), tx.getSrcAddress());
  assert(isUnsignedBigInteger(tx.getTotalAmount()));
  assert.notEqual(MoneroTx.DEFAULT_PAYMENT_ID, tx.getPaymentId());
  assert(isUnsignedBigInteger(tx.getFee()));
  assert.equal(undefined, tx.getMixin());
  assert.equal(undefined, tx.getWeight()); // TODO (monero-wallet-rpc): add tx_size to get_transfers and get_transfer_by_txid
  assert(tx.getNote() === undefined || tx.getNote().length > 0);
  assert(tx.getTimestamp() >= 0);
  assert.equal(0, tx.getUnlockTime());
  assert(typeof tx.getIsDoubleSpend() === "boolean");
  assert.equal(undefined, tx.getKey());
  assert.equal(undefined, tx.getHex());
  assert.equal(undefined, tx.getMetadata());
  
  // test confirmed
  if (tx.getIsConfirmed()) {
    assert(tx.getHeight() >= 0);
    assert(tx.getNumConfirmations() > 0);
    assert.equal(undefined, tx.getNumEstimatedBlocksUntilConfirmed());
  }
  
  // test mempool
  else if (tx.getInMempool()) {
    assert.equal(undefined, tx.getHeight());
    assert.equal(0, tx.getNumConfirmations());
    assert(tx.getNumEstimatedBlocksUntilConfirmed() > 0);
  }
  
  // test payments
  if (hasOutgoingPayments === true) assert(tx.getPayments());
  else if (hasOutgoingPayments === false) assert.equal(undefined, tx.getPayments());
  if (tx.getPayments()) {
    assert(tx.getPayments().length > 0);
    let totalAmount = new BigInteger(0);
    for (let payment of tx.getPayments()) {
      assert(payment.getAddress());
      assert(isUnsignedBigInteger(payment.getAmount()));
      assert(payment.getAmount().toJSValue() > 0);
      assert.equal(undefined, payment.getAccountIndex());
      assert.equal(undefined, payment.getSubaddressIndex());
      assert.equal(undefined, payment.getIsSpent());
      assert.equal(undefined, payment.getKeyImage());
      totalAmount = totalAmount.add(payment.getAmount());
    }
    
    // assert total amount is sum of payments
    // TODO: incoming_transfers d59fe775249465621d7736b53c0cb488e03e4da8dae647a13492ea51d7685c62 totalAmount is 0?
    if (totalAmount.compare(tx.getTotalAmount()) !== 0 && tx.getTotalAmount().compare(new BigInteger(0)) === 0) { // TODO: fix this.
      if (!unbalancedTxIds.includes(tx.getId())) {
        unbalancedTxIds.push(tx.getId());
        console.log("WARNING: Total amount is not sum of payments: " + tx.getTotalAmount() + " vs " + totalAmount + " for TX " + tx.getId());
      }
    } else {
      assert(totalAmount.compare(tx.getTotalAmount()) == 0, "Total amount is not sum of payments: " + tx.getTotalAmount() + " vs " + totalAmount + " for TX " + tx.getId());
    }
  }
  
  // TODO: test failed
}

/**
 * Gets random transactions.
 * 
 * @param wallet is the wallet to query for transactions
 * @param filter specifies a filter for the transactions.
 * @param minTxs specifies the minimum number of transactions (undefined for no minimum)
 * @param maxTxs specifies the maximum number of transactions (undefined for all filtered transactions)
 * @return {MoneroTx[]} are the random transactions
 */
async function getRandomTransactions(wallet, filter, minTxs, maxTxs) {
  let txs = await wallet.getTxs(filter);
  if (minTxs !== undefined) assert(txs.length >= minTxs);
  GenUtils.shuffle(txs);
  if (maxTxs === undefined) return txs;
  else return txs.slice(0, Math.min(maxTxs, txs.length));
}

module.exports = TestWalletCommon