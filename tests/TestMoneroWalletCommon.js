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
const MoneroSendConfig = require("../src/wallet/model/MoneroSendConfig");
const MoneroPayment = require("../src/wallet/model/MoneroPayment");

// test constants
const MIXIN = 11;
const SEND_DIVISOR = 2;
const SEND_MAX_DIFF = 60;
const MAX_TX_PROOFS = 25;   // maximum number of transactions to check for each proof, undefined to check all

/**
 * Runs common tests that every Monero wallet implementation should support.
 * 
 * TODO: test filtering with not relayed
 */
class TestWalletCommon {
  
  /**
   * Constructs the tester.
   * 
   * @param wallet is the wallet to test
   * @param daemon informs some tests
   */
  constructor(daemon, wallet) {
    assert(daemon instanceof MoneroDaemon);
    assert(wallet instanceof MoneroWallet);
    this.wallet = wallet;
    this.daemon = daemon;
    this.unbalancedTxIds = []; // track ids of txs whose total amount !== sum of payments so one warning per tx is printed // TODO: report issue, remove this when issue is fixed
  }
  
  /**
   * Runs the tests.
   */
  runTests() {
    let that = this;
    let liteMode = true;    
    describe("Common Wallet Tests", function() {
      describe("Non-Send Tests" + (liteMode ? " (lite mode)" : ""), function() {
        that._runNonSendTests(liteMode);
      });
//      describe("Send Tests", function() {
//        that._runSendTests();
//      });
//      describe("Reset Tests", function() {
//        that._runResetTests();  // CAUTION: this will destroy local wallet information like destination addresses
//      });
    })
  }
  
  /**
   * Runs all tests that do not initiate transactions on the blockchain or destroy wallet state.
   * 
   * @param liteMode specifies if some heavy tests should be skipped (convenience for dev)
   */
  _runNonSendTests(liteMode) {
    let wallet = this.wallet;
    let daemon = this.daemon;
    let that = this;
    
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
        throw new Error("Getting integrated address with invalid payment id " + invalidPaymentId + " should have thrown a RPC exception");
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
        await testTxWalletGet(txs1[i], wallet, that.unbalancedTxIds);
        await testTxWalletGet(txs2[i], wallet, that.unbalancedTxIds);
        TestUtils.assertTxsMergeable(txs1[i], txs2[i]);
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
          await testTxWalletGet(tx, wallet, that.unbalancedTxIds);
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
            await testTxWalletGet(tx, wallet, that.unbalancedTxIds);
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
    
    if (!liteMode) {
      it("Can get wallet transactions with a filter", async function() {  // TODO: Timeout of 1000000ms exceeded. For async tests and hooks, ensure "done()" is called
        if (liteMode) return; // skips test if lite
        
        // get all transactions for reference
        let allTxs = await getCachedTxs();
        assert(allTxs.length > 0);
        for (let tx of allTxs) {
          await testTxWalletGet(tx, wallet, that.unbalancedTxIds);
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
            await testTxWalletGet(tx, wallet, that.unbalancedTxIds);
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
    }
    
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
            if (tx.getInTxPool()) outPoolBalance = outPoolBalance.add(tx.getTotalAmount()); // TODO: test pending balance
          }
        }
        
        // wallet balance must equal sum of unspent incoming txs
        let walletBalance = (await wallet.getAccount(account.getIndex())).getBalance();
        let expectedBalance = inBalance;  // TODO (monero-wallet-rpc): unconfirmed balance may not add up because of https://github.com/monero-project/monero/issues/4500
//        System.out.println("Wallet    : " + walletBalance);
//        System.out.println("Incoming  : " + incomingBalance);
//        System.out.println("Pending   : " + pendingBalance);
//        System.out.println("Tx pool   : " + txPoolBalance);
//        System.out.println("Expected  : " + expectedBalance);
        assert(walletBalance.compare(expectedBalance) === 0, "Account " + account.getIndex() + " balance does not add up: " + expectedBalance.toString() + " vs " + walletBalance.toString());
      }
    });
    
    it("Can get and set a transaction note", async function() {
      let txs = await getRandomTransactions(wallet, undefined, 1, 5);
      
      // set notes
      let uuid = GenUtils.uuidv4();
      for (let i = 0; i < txs.length; i++) {
        await wallet.setTxNote(txs[i].getId(), uuid + i); // TODO: can we not iterate over awaits?
      }
      
      // get notes
      for (let i = 0; i < txs.length; i++) {
        assert.equal(uuid + i, await wallet.getTxNote(txs[i].getId()));
      }
    });
    
    // TODO: why does getting cached txs take 2 seconds when should already be cached?
    it("Can get and set multiple transaction notes", async function() {
      
      // set tx notes
      let uuid = GenUtils.uuidv4();
      let txs = await getCachedTxs();
      assert(txs.length >= 3);
      let txIds = [];
      let txNotes = [];
      for (let i = 0; i < txIds.length; i++) {
        txIds.push(txs[i].getId());
        txNotes.push(uuid + i);
      }
      await wallet.setTxNotes(txIds, txNotes);
      
      // get tx notes
      txNotes = await wallet.getTxNotes(txIds);
      for (let i = 0; i < txIds.length; i++) {
        assert.equal(txNotes[i], uuid + i);
      }
      
      // TODO: test that get transaction has note
    });
    
    it("Can check a transaction using its secret key", async function() {
      
      // get random txs with outgoing payments
      let filter = new MoneroTxFilter();
      filter.setIsIncoming(false);
      filter.setInTxPool(false);
      filter.setIsFailed(false);
      filter.setHasPayments(true);  // requires outgoing payments which rescan_bc will destroy
      let txs = await getRandomTransactions(wallet, filter, 1, MAX_TX_PROOFS);
      
      // test good checks
      for (let tx of txs) {
        let key = await wallet.getTxKey(tx.getId());
        for (let payment of tx.getPayments()) {
          let check = await wallet.checkTxKey(tx.getId(), key, payment.getAddress());
          assert(check.getIsGood());
          if (payment.getAmount().compare(new BigInteger()) > 0) {
//          assert(check.getAmountReceived().compare(new BigInteger(0)) > 0); // TODO (monero-wallet-rpc): indicates amount received amount is 0 despite transaction with payment to this address
            if (check.getAmountReceived().compare(new BigInteger(0)) === 0) {
              console.log("WARNING: key proof indicates no funds received despite payment (txid=" + tx.getId() + ", key=" + key + ", address=" + payment.getAddress() + ", amount=" + payment.getAmount() + ")");
            }
          }
          else assert(check.getAmountReceived().compare(new BigInteger(0)) === 0);
          testCheckTx(tx, check);
        }
      }
      
      // test get tx key with invalid id
      try {
        await wallet.getTxKey("invalid_tx_id");
        throw new Error("Should throw exception for invalid key");
      } catch (e) {
        assert.equal(-8, e.getRpcCode());
      }
      
      // test check with invalid tx id
      let tx = txs[0];
      let key = await wallet.getTxKey(tx.getId());
      try {
        await wallet.checkTxKey("invalid_tx_id", key, tx.getPayments()[0].getAddress());
        throw new Error("Should have thrown exception");
      } catch (e) {
        assert.equal(-8, e.getRpcCode());
      }
      
      // test check with invalid key
      try {
        await wallet.checkTxKey(tx.getId(), "invalid_tx_key", tx.getPayments()[0].getAddress());
        throw new Error("Should have thrown exception");
      } catch (e) {
        assert.equal(-25, e.getRpcCode());
      }
      
      // test check with invalid address
      try {
        await wallet.checkTxKey(tx.getId(), key, "invalid_tx_address");
        throw new Error("Should have thrown exception");
      } catch (e) {
        assert.equal(-2, e.getRpcCode());
      }
      
      // test check with different address
      let differentAddress;
      for (let aTx of await getCachedTxs()) {
        if (aTx.getPayments() === undefined) continue;
        for (let aPayment of aTx.getPayments()) {
          if (aPayment.getAddress() !== tx.getPayments()[0].getAddress()) {
            differentAddress = aPayment.getAddress();
            break;
          }
        }
      }
      assert(differentAddress, "Could not get a different address to test");
      let check = await wallet.checkTxKey(tx.getId(), key, differentAddress);
      assert(check.getIsGood());
      assert(check.getAmountReceived().compare(new BigInteger(0)) >= 0);
      testCheckTx(tx, check);
    });
    
    it("Can prove a transaction by getting its signature", async function() {
      
      // get random txs with outgoing payments
      let filter = new MoneroTxFilter();
      filter.setIsIncoming(false);
      filter.setInTxPool(false);
      filter.setIsFailed(false);
      filter.setHasPayments(true);
      let txs = await getRandomTransactions(wallet, filter, 2, MAX_TX_PROOFS);
      
      // test good checks with messages
      for (let tx of txs) {
        for (let payment of tx.getPayments()) {
          let signature = await wallet.getTxProof(tx.getId(), payment.getAddress(), "This transaction definitely happened.");
          let check = await wallet.checkTxProof(tx.getId(), payment.getAddress(), "This transaction definitely happened.", signature);
          testCheckTx(tx, check);
        }
      }
      
      // test good check without message
      let tx = txs[0];
      let signature = await wallet.getTxProof(tx.getId(), tx.getPayments()[0].getAddress());
      let check = await wallet.checkTxProof(tx.getId(), tx.getPayments()[0].getAddress(), undefined, signature);
      testCheckTx(tx, check);
      
      // test get proof with invalid id
      try {
        await wallet.getTxProof("invalid_tx_id", tx.getPayments()[0].getAddress());
        throw new Error("Should throw exception for invalid key");
      } catch (e) {
        assert.equal(-8, e.getRpcCode());
      }
      
      // test check with invalid tx id
      try {
        await wallet.checkTxProof("invalid_tx_id", tx.getPayments()[0].getAddress(), undefined, signature);
        throw new Error("Should have thrown exception");
      } catch (e) {
        assert.equal(-8, e.getRpcCode());
      }
      
      // test check with invalid address
      try {
        await wallet.checkTxProof(tx.getId(), "invalid_tx_address", undefined, signature);
        throw new Error("Should have thrown exception");
      } catch (e) {
        assert.equal(-2, e.getRpcCode());
      }
      
      // test check with wrong message
      signature = await wallet.getTxProof(tx.getId(), tx.getPayments()[0].getAddress(), "This is the right message");
      check = await wallet.checkTxProof(tx.getId(), tx.getPayments()[0].getAddress(), "This is the wrong message", signature);
      assert.equal(false, check.getIsGood());
      testCheckTx(tx, check);
      
      // test check with wrong signature
      let wrongSignature = await wallet.getTxProof(txs[1].getId(), txs[1].getPayments()[0].getAddress(), "This is the right message");
      try {
        check = await wallet.checkTxProof(tx.getId(), tx.getPayments()[0].getAddress(), "This is the right message", wrongSignature);  
        assert.equal(false, check.getIsGood());
      } catch (e) {
        assert.equal(-1, e.getRpcCode()); // TODO: sometimes comes back bad, sometimes throws exception.  ensure txs come from different addresses?
      }
    });
    
    it("Can prove a spend using a generated signature and no destination public address", async function() {
      
      // get random outgoing txs
      let filter = new MoneroTxFilter();
      filter.setIsIncoming(false);
      filter.setInTxPool(false);
      filter.setIsFailed(false);
      let txs = await getRandomTransactions(wallet, filter, 2, MAX_TX_PROOFS);
      
      // test good checks with messages
      for (let tx of txs) {
        let signature = await wallet.getSpendProof(tx.getId(), "I am a message.");
        assert(await wallet.checkSpendProof(tx.getId(), "I am a message.", signature));
      }
      
      // test good check without message
      let tx = txs[0];
      let signature = await wallet.getSpendProof(tx.getId());
      assert(await wallet.checkSpendProof(tx.getId(), undefined, signature));
      
      // test get proof with invalid id
      try {
        await wallet.getSpendProof("invalid_tx_id");
        throw new Error("Should throw exception for invalid key");
      } catch (e) {
        assert.equal(-8, e.getRpcCode());
      }
      
      // test check with invalid tx id
      try {
        await wallet.checkSpendProof("invalid_tx_id", undefined, signature);
        throw new Error("Should have thrown exception");
      } catch (e) {
        assert.equal(-8, e.getRpcCode());
      }
      
      // test check with invalid message
      signature = await wallet.getSpendProof(tx.getId(), "This is the right message");
      assert.equal(false, await wallet.checkSpendProof(tx.getId(), "This is the wrong message", signature));
      
      // test check with wrong signature
      signature = await wallet.getSpendProof(txs[1].getId(), "This is the right message");
      assert.equal(false, await wallet.checkSpendProof(tx.getId(), "This is the right message", signature));
    });
    
    it("Can prove reserves in the wallet", async function() {
      
      // get proof of entire wallet
      let signature = await wallet.getWalletReserveProof("Test message");
      
      // check proof of entire wallet
      let check = await wallet.checkReserveProof(await wallet.getPrimaryAddress(), "Test message", signature);
      assert(check.getIsGood());
      testCheckReserve(check);
      assert((await wallet.getBalance()).compare(check.getAmountTotal()) === 0);  // TODO: fails after send tests
      
      // test different wallet address
      // TODO: openWallet is not common so this won't work for other wallet impls
      await wallet.openWallet(TestUtils.WALLET_RPC_NAME_2, TestUtils.WALLET_RPC_PW_2);
      let differentAddress = await wallet.getPrimaryAddress();
      await wallet.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_RPC_PW_1);
      try {
        await wallet.checkReserveProof(differentAddress, "Test message", signature);
        throw new Error("Should have thrown exception");
      } catch (e) {
        assert.equal(-1, e.getRpcCode());
      }
      
      // test subaddress
      try {
        await wallet.checkReserveProof((await wallet.getSubaddress(0, 1)).getAddress(), "Test message", signature);
        throw new Error("Should have thrown exception");
      } catch (e) {
        assert.equal(-1, e.getRpcCode());
      }
      
      // test wrong message
      check = await wallet.checkReserveProof(await wallet.getPrimaryAddress(), "Wrong message", signature);
      assert.equal(false, check.getIsGood());  // TODO: specifically test reserve checks, probably separate objects
      testCheckReserve(check);
      
      // test wrong signature
      try {
        await wallet.checkReserveProof(await wallet.getPrimaryAddress(), "Test message", "wrong signature");
        throw new Error("Should have thrown exception");
      } catch (e) {
        assert.equal(-1, e.getRpcCode());
      }
    });
    
    it("Can prove reserves in an account", async function() {
      
      // test proofs of accounts
      let numNonZeroTests = 0;
      let msg = "Test message";
      let accounts = await wallet.getAccounts();
      let signature;
      for (let account of accounts) {
        if (account.getBalance().compare(new BigInteger(0)) > 0) {
          let checkAmount = (await account.getBalance()).divide(new BigInteger(2));
          signature = await wallet.getAccountReserveProof(account.getIndex(), checkAmount, msg);
          let check = await wallet.checkReserveProof(await wallet.getPrimaryAddress(), msg, signature);
          assert(check.getIsGood());
          testCheckReserve(check);
          assert(check.getAmountTotal().compare(checkAmount) >= 0);
          numNonZeroTests++;
        } else {
          try {
            await wallet.getAccountReserveProof(account.getIndex(), account.getBalance(), msg);
            throw new Error("Should have thrown exception");
          } catch (e) {
            assert.equal(-1, e.getRpcCode());
            try {
              await wallet.getAccountReserveProof(account.getIndex(), TestUtils.MAX_FEE, msg);
              throw new Error("Should have thrown exception");
            } catch (e2) {
              assert.equal(-1, e2.getRpcCode());
            }
          }
        }
      }
      assert(numNonZeroTests > 1, "Must have more than one account with non-zero balance; run testSendToMultiple() first");
      
      // test error when not enough balance for requested minimum reserve amount
      try {
        await wallet.getAccountReserveProof(0, accounts[0].getBalance().add(TestUtils.MAX_FEE), "Test message");
        throw new Error("Should have thrown exception");
      } catch (e) {
        assert.equal(-1, e.getRpcCode());
      }
      
      // test different wallet address
      // TODO: openWallet is not common so this won't work for other wallet impls
      await wallet.openWallet(TestUtils.WALLET_RPC_NAME_2, TestUtils.WALLET_RPC_PW_2);
      let differentAddress = await wallet.getPrimaryAddress();
      await wallet.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_RPC_PW_1);
      try {
        await wallet.checkReserveProof(differentAddress, "Test message", signature);
        throw new Error("Should have thrown exception");
      } catch (e) {
        assert.equal(-1, e.getRpcCode());
      }
      
      // test subaddress
      try {
        await wallet.checkReserveProof((await wallet.getSubaddress(0, 1)).getAddress(), "Test message", signature);
        throw new Error("Should have thrown exception");
      } catch (e) {
        assert.equal(-1, e.getRpcCode());
      }
      
      // test wrong message
      let check = await wallet.checkReserveProof(await wallet.getPrimaryAddress(), "Wrong message", signature);
      assert.equal(false, check.getIsGood()); // TODO: specifically test reserve checks, probably separate objects
      testCheckReserve(check);
      
      // test wrong signature
      try {
        await wallet.checkReserveProof(await wallet.getPrimaryAddress(), "Test message", "wrong signature");
        throw new Error("Should have thrown exception");
      } catch (e) {
        assert.equal(-1, e.getRpcCode());
      }
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
    
    it("Can start and stop mining", async function() {
      await wallet.startMining(2, false, true);
      await wallet.stopMining();
    });
  }
  
  /**
   * Tests sending funds from a Monero wallet.
   * 
   * These tests rely on a balance and initiate transactions on the blockchain.
   */
  _runSendTests() {
    let wallet = this.wallet;
    let daemon = this.daemon;
    
    it("Can send to an address in a single transaction", async function() {
      await testSendToSingle(false, undefined, false);
    });
    
    it("Can send to an address in a single transaction with a payment id", async function() {
      let integratedAddress = await wallet.getIntegratedAddress();
      await testSendToSingle(false, integratedAddress.getPaymentId(), false);
    });
    
    it("Can create then relay a transaction to send to a single address", async function() {
      await testSendToSingle(false, undefined, true);
    });
    
    it("Can send to an address with split transactions", async function() {
      await testSendToSingle(true, undefined, false);
    });
    
    it("Can create then relay split transactions to send to a single address", async function() {
      await testSendToSingle(true, undefined, true);
    });
    
    async function testSendToSingle(canSplit, paymentId, doNotRelay) {
      
      // find a non-primary subaddress to send from
      let sufficientBalance = false;
      let fromAccount = null;
      let fromSubaddress = null;
      let accounts = await wallet.getAccounts(true);
      for (let account of accounts) {
        let subaddresses = account.getSubaddresses();
        for (let i = 1; i < subaddresses.length; i++) {
          if (subaddresses[i].getBalance().compare(TestUtils.MAX_FEE) > 0) sufficientBalance = true;
          if (subaddresses[i].getUnlockedBalance().compare(TestUtils.MAX_FEE) > 0) {
            fromAccount = account;
            fromSubaddress = subaddresses[i];
            break;
          }
        }
        if (fromAccount != null) break;
      }
      assert(sufficientBalance, "No non-primary subaddress found with sufficient balance");
      assert(fromSubaddress !== null, "Wallet is waiting on unlocked funds");
      
      // get balance before send
      let balanceBefore = fromSubaddress.getBalance();
      let unlockedBalanceBefore  = fromSubaddress.getUnlockedBalance();
      
      // send to self
      let sendAmount = unlockedBalanceBefore.subtract(TestUtils.MAX_FEE).divide(new BigInteger(SEND_DIVISOR));
      let address = await wallet.getPrimaryAddress();
      let txs = []
      let config = new MoneroSendConfig(address, sendAmount, paymentId, undefined, TestUtils.MIXIN);
      config.setAccountIndex(fromAccount.getIndex());
      config.setSubaddressIndices([fromSubaddress.getSubaddressIndex()]);
      config.setDoNotRelay(doNotRelay);
      if (canSplit) {
        let sendTxs = await wallet.sendSplit(config);
        for (let tx of sendTxs) txs.push(tx);
      } else {
        txs.push(await wallet.send(config));
      }
      
      // handle non-relayed transaction
      if (doNotRelay) {
        
        // test transactions
        testCommonTxSets(txs, false, false, false);
        for (let tx of txs) {
          await testTxWalletSend(tx, config, !canSplit, !canSplit, wallet);
        }
        
        // relay transactions
        txs = await wallet.relayTxs(txs);
      }
      
      // test that balance and unlocked balance decreased
      // TODO: test that other balances did not decrease
      let subaddress = await wallet.getSubaddress(fromAccount.getIndex(), fromSubaddress.getSubaddressIndex());
      assert(subaddress.getBalance().compare(balanceBefore) < 0);
      assert(subaddress.getUnlockedBalance().compare(unlockedBalanceBefore) < 0);
      
      // test transactions
      assert(txs.length > 0);
      testCommonTxSets(txs, false, false, false);
      config.setDoNotRelay(false);  // in order to test that txs have been relayed
      for (let tx of txs) {
        await testTxWalletSend(tx, config, !canSplit, !canSplit, wallet);
        assert.equal(fromAccount.getIndex(), tx.getSrcAccountIndex());
        assert.equal(0, tx.getSrcSubaddressIndex()); // TODO (monero-wallet-rpc): outgoing transactions do not indicate originating subaddresses
        assert(sendAmount.compare(tx.getTotalAmount()) === 0);
        
        // test tx payments
        if (tx.getPayments() !== undefined) {
          assert.equal(1, tx.getPayments().length);
          for (let payment of tx.getPayments()) {
            assert.equal(address, payment.getAddress());
            assert.equal(undefined, payment.getAccountIndex());
            assert.equal(undefined, payment.getSubaddressIndex());
            assert(sendAmount.compare(payment.getAmount()) === 0);
            assert.equal(undefined, payment.getIsSpent());
          }
        }
      }
    }
    
    it("Can send to multiple addresses in a single transaction", async function() {
      await testSendToMultiple(5, 3, false);
    });
    
    it("Can send to multiple addresses in split transactions", async function() {
      await testSendToMultiple(5, 3, true);
    });
    
    /**
     * Sends funds from the first unlocked account to multiple accounts and subaddresses.
     * 
     * @param numAccounts is the number of accounts to receive funds
     * @param numSubaddressesPerAccount is the number of subaddresses per account to receive funds
     * @param canSplit specifies if the operation can be split into multiple transactions
     */
    async function testSendToMultiple(numAccounts, numSubaddressesPerAccount, canSplit) {
      
      // test constants
      let totalSubaddresses = numAccounts * numSubaddressesPerAccount;
      let minAccountAmount = TestUtils.MAX_FEE.multiply(new BigInteger(totalSubaddresses)).multiply(new BigInteger(SEND_DIVISOR)).add(TestUtils.MAX_FEE); // account balance must be more than divisor * fee * numAddresses + fee so each destination amount is at least a fee's worth 
      
      // send funds from first account with sufficient unlocked funds
      let srcAccount;
      let hasBalance = true;
      for (let account of await wallet.getAccounts()) {
        if (account.getBalance().compare(minAccountAmount) > 0) hasBalance = true;
        if (account.getUnlockedBalance().compare(minAccountAmount) > 0) {
          srcAccount = account;
          break;
        }
      }
      assert(hasBalance, "Wallet does not have enough balance; load '" + TestUtils.WALLET_RPC_NAME_1 + "' with XMR in order to test sending");
      assert(srcAccount, "Wallet is waiting on unlocked funds");
      
      // get amount to send per address
      let balance = srcAccount.getBalance();
      let unlockedBalance = srcAccount.getUnlockedBalance();
      let sendAmount = unlockedBalance.subtract(TestUtils.MAX_FEE).divide(new BigInteger(SEND_DIVISOR));
      let sendAmountPerSubaddress = sendAmount.divide(new BigInteger(totalSubaddresses));
      
      // create minimum number of accounts
      let accounts = await wallet.getAccounts();
      for (let i = 0; i < numAccounts - accounts.length; i++) {
        await wallet.createAccount();
      }
      
      // create minimum number of subaddresses per account and collect destination addresses
      let destinationAddresses = [];
      for (let i = 0; i < numAccounts; i++) {
        let subaddresses = await wallet.getSubaddresses(i);
        for (let j = 0; j < numSubaddressesPerAccount - subaddresses.length; j++) await wallet.createSubaddress(i);
        subaddresses = await wallet.getSubaddresses(i);
        assert(subaddresses.length >= numSubaddressesPerAccount);
        for (let j = 0; j < numSubaddressesPerAccount; j++) destinationAddresses.push(subaddresses[j].getAddress());
      }
          
      // send to subaddresses
      let payments = [];
      for (let i = 0; i < destinationAddresses.length; i++) {
        let payment = new MoneroPayment(destinationAddresses[i], sendAmountPerSubaddress);
        payments.push(payment);
      }
      let config = new MoneroSendConfig();
      config.setMixin(TestUtils.MIXIN);
      config.setAccountIndex(srcAccount.getIndex());
      config.setPayments(payments);
      
      let txs = [];
      if (canSplit) {
        let sendTxs = await wallet.sendSplit(config);
        for (let tx of sendTxs) txs.push(tx);
      } else {
        txs.push(await wallet.send(config));
      }
      
      // test that wallet balance decreased
      let account = await wallet.getAccount(srcAccount.getIndex());
      assert(account.getBalance().compare(balance) < 0);
      assert(account.getUnlockedBalance().compare(unlockedBalance) < 0);
      
      // test each transaction
      assert(txs.length > 0);
      let txSum = new BigInteger(0);
      for (let tx of txs) {
        await testTxWalletSend(tx, config, !canSplit, !canSplit, wallet);
        txSum = txSum.add(tx.getTotalAmount());
        if (tx.getPayments() !== undefined) {
          let paymentSum = new BigInteger(0);
          for (let payment of tx.getPayments()) {
            assert(destinationAddresses.includes(payment.getAddress()));
            paymentSum = paymentSum.add(payment.getAmount());
          }
          assert(tx.getTotalAmount().compare(paymentSum) === 0);  // assert that payments sum up to tx amount
        }
      }
      
      // assert that tx amounts sum up the amount sent within a small margin
      if (Math.abs(sendAmount.subtract(txSum).toJSValue()) > SEND_MAX_DIFF) { // send amounts may be slightly different
        throw new Error("Tx amounts are too different: " + sendAmount + " - " + txSum + " = " + sendAmount.subtract(txSum));
      }
    }
    
    it("Can send from multiple subaddresses in a single transaction", async function() {
      await testSendFromMultiple(false);
    });
    
    it("Can send from multiple subaddresses in split transactions", async function() {
      await testSendFromMultiple(true);
    });
    
    async function testSendFromMultiple(canSplit) {
      
      let NUM_SUBADDRESSES = 2; // number of subaddresses to send from
      
      // get first account with (NUM_SUBADDRESSES + 1) subaddresses with unlocked balances
      let accounts = await wallet.getAccounts(true);
      assert(accounts.length >= 2, "This test requires at least 2 accounts.  Run testSendToMultiple() first");
      let srcAccount;
      let unlockedSubaddresses = [];
      let hasBalance = false;
      for (let account of accounts) {
        unlockedSubaddresses.length = 0;
        let numSubaddressBalances = 0;
        for (let subaddress of await account.getSubaddresses()) {
          if (subaddress.getBalance().compare(TestUtils.MAX_FEE) > 0) numSubaddressBalances++;
          if (subaddress.getUnlockedBalance().compare(TestUtils.MAX_FEE) > 0) unlockedSubaddresses.push(subaddress);
        }
        if (numSubaddressBalances >= NUM_SUBADDRESSES + 1) hasBalance = true;
        if (unlockedSubaddresses.length >= NUM_SUBADDRESSES + 1) {
          srcAccount = account;
          break;
        }
      }
      assert(hasBalance, "Wallet does not have account with " + (NUM_SUBADDRESSES + 1) + " subaddresses with balances.  Run testSendToMultiple() first");
      assert(unlockedSubaddresses.length >= NUM_SUBADDRESSES + 1, "Wallet is waiting on unlocked funds");
      
      // determine the indices of the first two subaddresses with unlocked balances
      let fromSubaddressIndices = [];
      for (let i = 0; i < NUM_SUBADDRESSES; i++) {
        fromSubaddressIndices.push(unlockedSubaddresses[i].getSubaddressIndex());
      }
      
      // determine the amount to send (slightly less than the sum to send from)
      let sendAmount = new BigInteger(0);
      for (let fromSubaddressIdx of fromSubaddressIndices) {
        sendAmount = sendAmount.add(srcAccount.getSubaddresses()[fromSubaddressIdx].getUnlockedBalance()).subtract(TestUtils.MAX_FEE);
      }
      
      let fromBalance = new BigInteger(0);
      let fromUnlockedBalance = new BigInteger(0);
      for (let subaddressIdx of fromSubaddressIndices) {
        let subaddress = await wallet.getSubaddress(srcAccount.getIndex(), subaddressIdx);
        fromBalance = fromBalance.add(subaddress.getBalance());
        fromUnlockedBalance = fromUnlockedBalance.add(subaddress.getUnlockedBalance());
      }
      
      // send from the first subaddresses with unlocked balances
      let address = await wallet.getPrimaryAddress();
      let config = new MoneroSendConfig(address, sendAmount);
      config.setAccountIndex(srcAccount.getIndex());
      config.setSubaddressIndices(fromSubaddressIndices);
      config.setMixin(TestUtils.MIXIN);
      let txs = [];
      if (canSplit) {
        let sendTxs = await wallet.sendSplit(config);
        for (let tx of sendTxs) txs.push(tx);
      } else {
        txs.push(await wallet.send(config));
      }
      
      // test that balances of intended subaddresses decreased
      let accountsAfter = await wallet.getAccounts(true);
      assert.equal(accounts.length, accountsAfter.length);
      for (let i = 0; i < accounts.length; i++) {
        assert.equal(accounts[i].getSubaddresses().length, accountsAfter[i].getSubaddresses().length);
        for (let j = 0; j < accounts[i].getSubaddresses().length; j++) {
          let subaddressBefore = accounts[i].getSubaddresses()[j];
          let subaddressAfter = accountsAfter[i].getSubaddresses()[j];
          if (i === srcAccount.getIndex() && fromSubaddressIndices.includes(j)) {
            assert(subaddressAfter.getUnlockedBalance().compare(subaddressBefore.getUnlockedBalance()) < 0, "Subaddress [" + i + "," + j + "] unlocked balance should have decreased but changed from " + subaddressBefore.getUnlockedBalance().toString() + " to " + subaddressAfter.getUnlockedBalance().toString()); // TODO: Subaddress [0,1] unlocked balance should have decreased          
          } else {
            assert(subaddressAfter.getUnlockedBalance().compare(subaddressBefore.getUnlockedBalance()) === 0, "Subaddress [" + i + "," + j + "] unlocked balance should not have changed");          
          }
        }
      }
      
      // test each transaction
      assert(txs.length > 0);
      let txSum = new BigInteger(0);
      for (let tx of txs) {
        await testTxWalletSend(tx, config, !canSplit, !canSplit, wallet);
        txSum = txSum.add(tx.getTotalAmount());
        if (tx.getPayments() !== undefined) {
          assert.equal(1, tx.getPayments().length);
          let paymentSum = new BigInteger(0);
          for (let payment of tx.getPayments()) {
            assert.equal(address, payment.getAddress());
            paymentSum = paymentSum.add(payment.getAmount());
          }
          assert(tx.getTotalAmount().compare(paymentSum) === 0);  // assert that payment amounts sum up to tx amount
        }
      }
      
      // assert that tx amounts sum up the amount sent within a small margin
      if (Math.abs(sendAmount.subtract(txSum).toJSValue()) > SEND_MAX_DIFF) { // send amounts may be slightly different
        throw new Error("Tx amounts are too different: " + sendAmount + " - " + txSum + " = " + sendAmount.subtract(txSum));
      }
    }
    
    it("Can sweep dust without relaying", async function() {
      
      // generate non-relayed transactions to sweep dust
      let txs = await wallet.sweepDust(true);
      assert(Array.isArray(txs));
      assert(txs.length > 0, "No dust to sweep");
      
      // test txs
      let config = new MoneroSendConfig();
      config.setDoNotRelay(true);
      for (let tx of txs) {
        await testTxWalletSend(tx, config, !canSplit, !canSplit, wallet);
      }
      
      // relay and test txs
      txs = await wallet.relayTxs(txs);
      config.setDoNotRelay(false);
      for (let tx of txs) {
        await testTxWalletSend(tx, config, !canSplit, !canSplit, wallet);
      }
    });
    
    it("Can sweep dust", async function() {
      let txs = await wallet.sweepDust();
      assert(Array.isArray(txs));
      assert(txs.length > 0, "No dust to sweep");
      for (let tx of txs) {
        await testTxWalletSend(tx, undefined, !canSplit, !canSplit, wallet);
      }
    });
  }
  
  /**
   * Runs tests that reset the wallet state including sweeping all funds to the primary account and
   * rescanning the blockchain which resets the local wallet cache (e.g. send destinations).
   * 
   * These tests are separated because they use all unlocked funds which invalidates other tests until
   * a send-to-multiple test is run.
   */
  _runResetTests() {
    let wallet = this.wallet;
    let daemon = this.daemon;
    let that = this;
    
    // TODO: specific to monero-wallet-rpc?
    // disabled so tests don't delete local cache
//    it("Can rescan the blockchain", async function() {
//      await wallet.rescanBlockchain();
//      for (let tx of await wallet.getTxs()) {
//        testTxWalletGet(tx, wallet, that.unbalancedTxIds);
//      }
//    });
    
    it("Can sweep subaddresses", async function() {
      throw new Error("Not implemented");
    });
    
    it("Can sweep accounts", async function() {
      const NUM_ACCOUNTS_TO_SWEEP = 1;
      
      // collect accounts with balance and unlocked balance
      let accounts = await wallet.getAccounts(true);
      let balanceAccounts = [];
      let unlockedAccounts = [];
      for (let account of accounts) {
        if (account.getBalance().toJSValue() > 0) balanceAccounts.push(account);
        if (account.getUnlockedBalance().toJSValue() > 0) unlockedAccounts.push(account);
      }
      
      // test requires at least one more account than the number being swept to verify it does not change
      assert(balanceAccounts.length >= NUM_ACCOUNTS_TO_SWEEP + 1, "Test requires balance in at least " + (NUM_ACCOUNTS_TO_SWEEP + 1) + " accounts; run testSendToMultiple() first");
      assert(unlockedAccounts.length >= NUM_ACCOUNTS_TO_SWEEP + 1, "Wallet is waiting on unlocked funds");
      
      // sweep from first unlocked accounts
      for (let i = 0; i < NUM_ACCOUNTS_TO_SWEEP; i++) {
        
        // sweep unlocked account
        let unlockedAccount = unlockedAccounts[i];
        let txs = await wallet.sweepAccount(unlockedAccount.getIndex(), await wallet.getPrimaryAddress());
        
        // test transactions
        assert(txs.length > 0);
        for (let tx of txs) {
          let config = new MoneroSendConfig(wallet.getPrimaryAddress());
          config.setAccountIndex(unlockedAccount.getIndex());
          testTxWalletSend(tx, config, true, false, wallet);
        }
        
        // assert no unlocked funds in account
        let account = await wallet.getAccount(unlockedAccount.getIndex());
        assert.equal(0, account.getUnlockedBalance().toJSValue());
      }
      
      // test accounts after sweeping
      let accountsAfter = await wallet.getAccounts(true);
      assert.equal(accounts.length, accountsAfter.length);
      for (let i = 0; i < accounts.length; i++) {
        let accountBefore = accounts[i];
        let accountAfter = accountsAfter[i];
        
        // determine if account was swept
        let swept = false;
        for (let j = 0; j < NUM_ACCOUNTS_TO_SWEEP; j++) {
          if (unlockedAccounts[j].getIndex() === accountBefore.getIndex()) {
            swept = true;
            break;
          }
        }
        
        // test that unlocked balance is 0 if swept, unchanged otherwise
        if (swept) {
          assert.equal(0, accountAfter.getUnlockedBalance().toJSValue());
        } else {
          assert.equal(0, accountBefore.compare(accountAfter));
        }
      }
    });
    
    it("Can sweep the whole wallet", async function() {
      
      // sweep destination
      let destination = await wallet.getPrimaryAddress();
      
      // verify 2 accounts with unlocked balance
      let subaddressesBalance = await getSubaddressesWithBalance(wallet);
      let subaddressesUnlockedBalance = await getSubaddressesWithUnlockedBalance(wallet);
      assert(subaddressesBalance.length >= 2, "Test requires multiple accounts with a balance; run send to multiple first");
      assert(subaddressesUnlockedBalance.length >= 2, "Wallet is waiting on unlocked funds");
      
      // sweep
      let txs = await wallet.sweepWallet(destination);
      assert(txs.length > 0);
      for (let tx of txs) {
        let config = new MoneroSendConfig(destination);
        config.setAccountIndex(tx.getSrcAccountIndex());  // TODO: this is to game testTxWalletSend(); should not assert account equivalency there?
        testTxWalletSend(tx, config, true, false, wallet);
      }
      
      // assert no unlocked funds across subaddresses
      subaddressesUnlockedBalance = await getSubaddressesWithUnlockedBalance(wallet);
      assert(subaddressesUnlockedBalance.length === 0, "Wallet should have no unlocked funds after sweeping all");
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
  assert(subaddress.getUnspentOutputCount() >= 0);
  if (subaddress.getBalance().toJSValue() > 0) assert(subaddress.getIsUsed());
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

// common tests
function testTxWalletCommon(tx) {
  assert(tx.getId());
  assert.equal("boolean", typeof tx.getIsIncoming());
  assert.equal("boolean", typeof tx.getIsOutgoing());
  assert.equal("boolean", typeof tx.getIsConfirmed());
  assert.equal("boolean", typeof tx.getInTxPool());
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
  assert(tx.getNote() === undefined || tx.getNote().length > 0);
  
  // TODO (monero-wallet-rpc): incoming txs are occluded by outgoing counterparts from same account (https://github.com/monero-project/monero/issues/4500) and then incoming_transfers need address, fee, timestamp, unlock_time, is_double_spend, height, tx_size
  //if (tx.getFee() === undefined) console.log("WARNING: incoming transaction is occluded by outgoing counterpart (#4500): " + tx.getId());
//  if (tx.getFee() === undefined) console.log("WARNING: incoming transaction is missing fee: " + tx.getId());
//  if (tx.getUnlockTime() === undefined) console.log("WARNING: incoming transaction is missing unlock_time: " + tx.getId());
//  if (tx.getIsDoubleSpend() === undefined) console.log("WARNING: incoming transaction is missing is_double_spend: " + tx.getId());
  if (tx.getFee() === undefined) {} // TODO: remove once #4500 fixed
  else assert.equal(false, tx.getIsDoubleSpend());
  assert.equal(undefined, tx.getHex());
//  if (tx.getSize() === undefined) console.log("WARNING: incoming transaction is missing size: " + tx.getId());
  assert.equal(undefined, tx.getMetadata());
  
  // test confirmed
  if (tx.getIsConfirmed()) {
    assert.equal(undefined, tx.getKey());
//    if (tx.getHeight() === undefined) console.log("WARNING: incoming transaction is missing height: " + tx.getId());
//    if (tx.getBlockTimestamp() === undefined) console.log("WARNING: incoming transaction is missing block timestamps: " + tx.getId());
//    if (tx.getConfirmationCount() === undefined) console.log("WARNING: incoming transaction is missing confirmations: " + tx.getId());
    if (tx.getConfirmationCount() === undefined) {} // TODO: remove once #4500 fixed
    else assert(tx.getConfirmationCount() > 0);
    assert.equal(undefined, tx.getEstimatedBlockCountUntilConfirmed());  // TODO: rename to getEstimatedBlockCountUntilConfirmed()
    assert.equal(undefined, tx.getLastRelayedTime());
    assert.equal(undefined, tx.getReceivedTime());
  }
  
  // test unconfirmed
  else {
    assert.equal(undefined, tx.getKey());
    assert.equal(undefined, tx.getHeight());
    assert.equal(undefined, tx.getBlockTimestamp());
    assert.equal(0, tx.getConfirmationCount());
    assert(tx.getEstimatedBlockCountUntilConfirmed() > 0);
    assert.equal(undefined, tx.getLastRelayedTime());
    assert(tx.getReceivedTime() > 0); // TODO: might need to log warning given #4500
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
    else assert.equal(undefined, payment.getKeyImage());   // TODO (monero-wallet-rpc): txpool transactions do not have key_images
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
  assert.equal(undefined, tx.getSize());   // TODO (monero-wallet-rpc): add tx_size to get_transfers and get_transfer_by_txid
  assert.equal(undefined, tx.getWeight());
  assert(tx.getNote() === undefined || tx.getNote().length > 0);
  assert.equal(0, tx.getUnlockTime());
  assert(typeof tx.getIsDoubleSpend() === "boolean");
  assert.equal(undefined, tx.getKey());
  assert.equal(undefined, tx.getHex());
  assert.equal(undefined, tx.getMetadata());
  
  // test confirmed
  if (tx.getIsConfirmed()) {
    assert(tx.getHeight() >= 0);
    assert(tx.getBlockTimestamp() > 0);
    assert(tx.getConfirmationCount() > 0);
    assert.equal(undefined, tx.getEstimatedBlockCountUntilConfirmed());
    assert.equal(undefined, tx.getLastRelayedTime());
    assert.equal(undefined, tx.getReceivedTime());
  }
  
  // test tx pool
  else if (tx.getInTxPool()) {
    assert.equal(undefined, tx.getHeight());
    assert.equal(undefined, tx.getBlockTimestamp());
    assert.equal(0, tx.getConfirmationCount());
    assert(tx.getEstimatedBlockCountUntilConfirmed() > 0);
    if (tx.getIsRelayed()) assert(tx.getLastRelayedTime() > 0);
    else assert.equal(undefined, tx.getLastRelayedTime());
    assert.equal(undefined, tx.getReceivedTime());
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
    if (totalAmount.compare(tx.getTotalAmount()) !== 0 && tx.getTotalAmount().compare(new BigInteger(0)) === 0) {
      if (!unbalancedTxIds.includes(tx.getId())) {
        unbalancedTxIds.push(tx.getId());
        //console.log("WARNING: Total amount is not sum of payments: " + tx.getTotalAmount() + " vs " + totalAmount + " for TX " + tx.getId()); // TODO: lots of these warnings, fix this.
      }
    } else {
      assert(totalAmount.compare(tx.getTotalAmount()) == 0, "Total amount is not sum of payments: " + tx.getTotalAmount() + " vs " + totalAmount + " for TX " + tx.getId());
    }
  }
  
  // TODO: test failed
}

// TODO: update with latest fields
async function testTxWalletSend(tx, config, hasKey, hasPayments, wallet) {
  if (config === undefined) config = new MoneroSendConfig();
  testTxWalletCommon(tx);
  assert(tx.getId());
  assert.equal(true, tx.getIsOutgoing());
  assert.equal(false, tx.getIsIncoming());
  assert.equal(false, tx.getIsConfirmed());
  if (config.getDoNotRelay()) {
    assert.equal(false, tx.getInTxPool());
    assert.equal(true, tx.getDoNotRelay());
    assert.equal(false, tx.getIsRelayed());
    assert.equal(undefined, tx.getLastRelayedTime());
    assert.equal(undefined, tx.getUnlockTime());
    assert.equal(undefined, tx.getIsDoubleSpend());
  } else {
    assert.equal(true, tx.getInTxPool());
    assert.equal(false, tx.getDoNotRelay());
    assert.equal(true, tx.getIsRelayed());
    assert(tx.getLastRelayedTime() > 0);
    assert.equal(0, tx.getUnlockTime());  // TODO: test with non-zero unlock time
    assert.equal(false, tx.getIsDoubleSpend());
  }
  assert(tx.getSrcAddress());
  assert.equal(await wallet.getAddress(tx.getSrcAccountIndex(), tx.getSrcSubaddressIndex()), tx.getSrcAddress());
  assert(tx.getSrcAccountIndex() >= 0);
  assert.equal(0, tx.getSrcSubaddressIndex());
  TestUtils.testUnsignedBigInteger(tx.getTotalAmount());
  if (MoneroTx.DEFAULT_PAYMENT_ID === config.getPaymentId()) assert.equal(undefined, tx.getPaymentId());
  else assert.equal(config.getPaymentId(), tx.getPaymentId());
  TestUtils.testUnsignedBigInteger(tx.getFee(), true);
  assert.equal(config.getMixin(), tx.getMixin());
  assert(tx.getNote() === undefined || tx.getNote().length > 0);
  assert.equal(undefined, tx.getBlockTimestamp());
  assert.equal(undefined, tx.getReceivedTime());
  if (hasKey) assert(tx.getKey().length > 0);
  else assert.equal(undefined, tx.getKey());
  if (hasPayments) {
    assert(Array.isArray(tx.getPayments()));
    assert(tx.getPayments().length > 0);
    assert.deepEqual(config.getPayments(), tx.getPayments());
  }
  assert.equal("string", typeof tx.getHex());
  assert(tx.getHex().length > 0);
  assert.equal(undefined, tx.getSize());
  assert.equal(undefined, tx.getWeight());
  assert(tx.getMetadata());
  assert.equal(undefined, tx.getHeight());
  if (tx.getPayments()) {
    let totalAmount = new BigInteger(0);
    for (let payment of tx.getPayments()) {
      assert(payment.getAddress());
      MoneroUtils.validateAddress(payment.getAddress());
      assert.equal(undefined, payment.getAccountIndex());
      assert.equal(undefined, payment.getSubaddressIndex());
      TestUtils.testUnsignedBigInteger(payment.getAmount(), true);
      assert.equal(undefined, payment.getIsSpent());
      assert.equal(undefined, payment.getKeyImage());
      totalAmount = totalAmount.add(payment.getAmount());
    }
    assert(totalAmount.compare(tx.getTotalAmount()) === 0, "Total amount is not sum of payments: " + tx.getTotalAmount() + " vs " + totalAmount + " for TX " + tx.getId());
  }
}

function testCommonTxSets(txs, hasSigned, hasUnsigned, hasMultisig) {
  assert(txs.length > 0);
  
  // assert that all sets are same reference
  let sets;
  for (let i = 0; i < txs.length; i++) {
    if (i === 0) sets = txs[i].getCommonTxSets();
    else assert(txs[i].getCommonTxSets() === sets);
  }
  
  // test expected set
  if (!hasSigned && !hasUnsigned && !hasMultisig) assert.equal(undefined, sets);
  else {
    assert(sets);
    if (hasSigned) {
      assert(sets.getSignedTxSet());
      assert(sets.getSignedTxSet().length > 0);
    }
    if (hasUnsigned) {
      assert(sets.getUnsignedTxSet());
      assert(sets.getUnsignedTxSet().length > 0);
    }
    if (hasMultisig) {
      assert(sets.getMultisigTxSet());
      assert(sets.getMultisigTxSet().length > 0);
    }
  }
}

function testCheckTx(tx, check) {
  assert.equal("boolean", typeof check.getIsGood());
  if (check.getIsGood()) {
    assert(check.getConfirmationCount() >= 0);
    assert.equal("boolean", typeof check.getInTxPool());
    TestUtils.testUnsignedBigInteger(check.getAmountReceived());
    if (check.getInTxPool()) assert.equal(0, check.getConfirmationCount());
    else assert(check.getConfirmationCount() > 0); // TODO (monero-wall-rpc) this fails (confirmations is 0) for (at least one) transaction that has 1 confirmation on testCheckTxKey()
  } else {
    assert.equal(undefined, check.getConfirmationCount());
    assert.equal(undefined, check.getInTxPool());
    assert.equal(undefined, check.getAmountReceived());
  }
}

function testCheckReserve(check) {
  assert.equal("boolean", typeof check.getIsGood());
  if (check.getIsGood()) {
    TestUtils.testUnsignedBigInteger(check.getAmountSpent());
    assert.equal(0, check.getAmountSpent().compare(new BigInteger(0))); // TODO (monero-wallet-rpc): ever return non-zero spent?
    TestUtils.testUnsignedBigInteger(check.getAmountTotal());
    assert(check.getAmountTotal().compare(new BigInteger(0)) >= 0);
  } else {
    assert.equal(undefined, check.getAmountSpent());
    assert.equal(undefined, check.getAmountTotal());
  }
}

async function getSubaddressesWithBalance(wallet) {
  let subaddresses = [];
  for (let account of await wallet.getAccounts(true)) {
    for (let subaddress of account.getSubaddresses()) {
      if (subaddress.getBalance().toJSValue() > 0) subaddresses.push(subaddress);
    }
  }
  return subaddresses;
}

async function getSubaddressesWithUnlockedBalance(wallet) {
  let subaddresses = [];
  for (let account of await wallet.getAccounts(true)) {
    for (let subaddress of account.getSubaddresses()) {
      if (subaddress.getUnlockedBalance().toJSValue() > 0) subaddresses.push(subaddress);
    }
  }
  return subaddresses;
}

module.exports = TestWalletCommon

