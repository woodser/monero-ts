const assert = require("assert");
const TestUtils = require("./TestUtils");
const GenUtils = require("../src/utils/GenUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");
const BigInteger = require("../src/submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroWallet = require("../src/wallet/MoneroWallet");
const MoneroDaemon = require("../src/daemon/MoneroDaemon");
const MoneroTx = require("../src/daemon/model/MoneroTx");
const MoneroWalletTx = require("../src/wallet/model/MoneroWalletTx");
const MoneroTxFilter = require("../src/wallet/filters/MoneroTxFilter");
const MoneroVoutFilter = require("../src/wallet/filters/MoneroVoutFilter");
const MoneroTransferFilter = require("../src/wallet/filters/MoneroTransferFilter");
const MoneroSendConfig = require("../src/wallet/model/MoneroSendConfig");
const MoneroTransfer = require("../src/wallet/model/MoneroTransfer");
const MoneroDestination = require("../src/wallet/model/MoneroDestination");
const MoneroWalletOutput = require("../src/wallet/model/MoneroWalletOutput");

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
class TestMoneroWalletCommon {
  
  /**
   * Constructs the tester.
   * 
   * @param wallet is the wallet to test
   * @param daemon informs some tests
   */
  constructor(wallet, daemon) {
    assert(wallet instanceof MoneroWallet);
    assert(daemon instanceof MoneroDaemon);
    this.wallet = wallet;
    this.daemon = daemon;
    this.unbalancedTxIds = []; // track ids of txs whose total amount !== sum of transfers so one warning per tx is printed // TODO: report issue, remove this when issue is fixed
  }
  
  runCommonTests(config) {
    let that = this;
    describe("Common Wallet Tests", function() {
      if (config.testNonSends) that._testNonSends(config.liteMode);
      if (config.testSends) that._testSends();
      if (config.testResets) that._testResets();
      if (config.testNotifications) that._testNotifications();
    });
  }
  
  /**
   * Runs all tests that do not initiate transactions on the blockchain or destroy wallet state.
   * 
   * @param liteMode specifies if some heavy tests should be skipped (convenience for dev)
   */
  _testNonSends(liteMode) {
    let wallet = this.wallet;
    let daemon = this.daemon;
    let that = this;
    
    describe("Test Non-Sends" + (liteMode ? " (lite mode)" : ""), function() {

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
      
      it("Can get all transactions", async function() {
        let nonDefaultIncoming = false;
        let txs1 = await getCachedTxs();
        let txs2 = await wallet.getTxs();
        assert.equal(txs1.length, txs2.length);
        assert(txs1.length > 0, "No transactions found to test");
        //testTxsBalance(txs1, await wallet.getBalance());  // TODO: implement balance checking, here and/or elsewhere
        for (let i = 0; i < txs1.length; i++) {
          //console.log(txs1[i].toString());
          await testWalletTx(txs1[i], {wallet: wallet});
          await testWalletTx(txs2[i], {wallet: wallet});
          let merged = txs1[i].copy().merge(txs2[i].copy());
          await testWalletTx(merged, {wallet: wallet});
          if (txs1[i].getIncomingTransfers()) {
            for (let transfer of txs1[i].getIncomingTransfers()) {
              if (transfer.getAccountIndex() !== 0 && transfer.getSubaddressIndex() !== 0) nonDefaultIncoming = true;
            }
          }
        }
        assert(nonDefaultIncoming, "No incoming transfers found to non-default account and subaddress; run send-to-multiple tests first");
      });
      
      it("Can get transactions associated with an account", async function() {
        let accountIdx = 1;
        let filter = new MoneroTxFilter().setTransferFilter(new MoneroTransferFilter().setAccountIndex(accountIdx));
        let txs = await wallet.getTxs(filter);
        assert(txs.length > 0, "No transactions associated with account " + accountIdx);
        for (let tx of txs) {
          let found = false;
          if (tx.getOutgoingTransfer() && tx.getOutgoingTransfer().getAccountIndex() === accountIdx) found = true;
          else if (tx.getIncomingTransfers()) {
            for (let inTransfer of tx.getIncomingTransfers()) {
              if (inTransfer.getAccountIndex() === accountIdx) {
                found = true;
                break;
              }
            }
          }
          assert(found, ("Transaction is not associated with account:\n" + tx.toString()));
        }
      });
      
      it("Can get transactions by id and ids", async function() {
        
        // get random transactions
        let txs = await getRandomTransactions(wallet, undefined, 1, 5);
        
        // get each transaction by id
        let txIds = [];
        for (let tx of txs) {
          txIds.push(tx.getId());
          let retrievedTx = await wallet.getTxById(tx.getId());
          await testWalletTx(retrievedTx, {wallet: wallet});
          assert.equal(tx.getId(), retrievedTx.getId());
        }
        
        // get multiple transactions by id
        let retrievedTxs = await wallet.getTxsById(txIds);
        assert(retrievedTxs.length > 0);
        for (let retrievedTx of retrievedTxs) {
          assert(txIds.includes(retrievedTx.getId()));
        }
        for (let txId of txIds) {
          let found = false;
          for (let retrievedTx of retrievedTxs) if (retrievedTx.getId() === txId) found = true;
          assert(found, "No transaction with id " + txId + " retrieved");
        }
        
        // test with invalid id
        let expectedError = "No wallet transaction found with id 'invalid_id'";
        try {
          await wallet.getTxById("invalid_id");
          throw new Error("Should have thrown error");
        } catch (e) {
          assert.equal(expectedError, e.message);
        }
        
        // test with invalid ids
        try {
          await wallet.getTxsById([txIds[0], "invalid_id"]);
          throw new Error("Should have thrown error");
        } catch (e) {
          assert.equal(expectedError, e.message);
        }
      });
      
      it("Can get transactions filtered by having outgoing transfers or not", async function() {
        
        // filter on having outgoing transfers
        let filter = new MoneroTxFilter();
        filter.setHasOutgoingTransfer(true);
        let txs = await wallet.getTxs(filter);
        assert(txs.length > 0);
        for (let tx of txs) {
          assert(tx.getOutgoingTransfer());
        }
        
        // filter on not having outgoing transfer
        filter.setHasOutgoingTransfer(false);
        txs = await wallet.getTxs(filter);
        assert(txs.length > 0);  // requires running rescan blockchain so tx transfers get wiped
        for (let tx of txs) {
          assert.equal(undefined, tx.getOutgoingTransfer());
        }
        
        // filter on no preference
        filter.setHasOutgoingTransfer(undefined);
        let foundTransfer = false;
        let foundNoTransfer = false;
        for (let tx of await wallet.getTxs(filter)) {
          if (tx.getOutgoingTransfer() !== undefined && tx.getOutgoingTransfer()) foundTransfer = true;
          if (tx.getOutgoingTransfer() === undefined) foundNoTransfer = true;
        }
        assert(foundTransfer);
        assert(foundNoTransfer);
      });
      
      it("Can get transactions filtered by having incoming transfers or not", async function() {
        
        // filter on having incoming transfers
        let filter = new MoneroTxFilter();
        filter.setHasIncomingTransfers(true);
        let txs = await wallet.getTxs(filter);
        assert(txs.length > 0);
        for (let tx of txs) {
          assert(tx.getIncomingTransfers());
          assert(tx.getIncomingTransfers().length > 0);
        }
        
        // filter on not having incoming transfers
        filter.setHasIncomingTransfers(false);
        txs = await wallet.getTxs(filter);
        assert(txs.length > 0);  // requires running rescan blockchain so tx transfers get wiped
        for (let tx of txs) {
          assert.equal(undefined, tx.getIncomingTransfers());
        }
        
        // filter on no preference
        filter.setHasIncomingTransfers(undefined);
        txs = await wallet.getTxs(filter);
        let foundTransfers = false;
        let foundNoTransfers = false;
        for (let tx of txs) {
          if (tx.getIncomingTransfers() !== undefined && tx.getIncomingTransfers().length > 0) foundTransfers = true;
          if (tx.getIncomingTransfers() === undefined) foundNoTransfers = true;
        }
        assert(foundTransfers);
        assert(foundNoTransfers);
      });
      
      if (!liteMode) {
        it("Can get transactions with a filter", async function() {  // TODO: Timeout of 1000000ms exceeded. For async tests and hooks, ensure "done()" is called
          if (liteMode) return; // skips test if lite
          
          // get all transactions for reference
          let allTxs = await getCachedTxs();
          assert(allTxs.length > 0);
          for (let tx of allTxs) {
            await testTxWalletGet(wallet, tx, that.unbalancedTxIds);
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
              await testTxWalletGet(wallet, tx, that.unbalancedTxIds);
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
          
          // test that unspent tx transfers add up to balance
          for (let subaddress of subaddresses) {
            filter = new MoneroTxFilter();
            filter.setAccountIndex(subaddress.getAccountIndex());
            filter.setSubaddressIndices([subaddress.getSubaddressIndex()]);
            txs = await wallet.getTxs(filter);
            
            // test that unspent tx transfers add up to subaddress balance
            let balance = new BigInteger(0);
            for (let tx of txs) {
              if (tx.getIsIncoming() && tx.getIsConfirmed()) {
                for (let transfer of tx.getTransfers()) {
                  if (!transfer.getIsSpent()) {  // TODO: test that typeof === "boolean" in testTransfer() test
                    balance = balance.add(transfer.getAmount());
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
      
      it("Returns all known fields of txs regardless of filtering", async function() {
        
        // fetch wallet txs
        let txs = await wallet.getTxs();
        for (let tx of txs) {
          
          // find tx sent to same wallet with incoming transfer in different account than src account
          if (!tx.getIsOutgoing() || !tx.getIsIncoming()) continue;
          if (tx.getOutgoingAmount().compare(tx.getIncomingAmount()) !== 0) continue;
          if (!tx.getIncomingTransfers()) continue;
          for (let transfer of tx.getIncomingTransfers()) {
            if (transfer.getAccountIndex() === tx.getOutgoingTransfer().getAccountIndex()) continue;
            
            // fetch tx with filtering
            let filter = new MoneroTxFilter();
            filter.setTransferFilter(new MoneroTransferFilter().setIsIncoming(true).setAccountIndex(transfer.getAccountIndex()));
            let filteredTxs = await wallet.getTxs(filter);
            let filteredTx = new MoneroTxFilter().setTxIds([tx.getId()]).apply(filteredTxs)[0];
            
            // txs should be the same
            assert.equal(tx.getId(), filteredTx.getId());
            assert.equal(tx.toString(), filteredTx.toString()); // TODO: better deep comparator?
            
            // test is done
            return;
          }
        }
        
        // test did not fully execute
        throw new Error("Test requires tx sent from/to different accounts of same wallet but none found; run send tests");
      });
      
      it("Can get transfers", async function() {
        throw new Error("Not implemented");
      })
      
      it("Can get vouts", async function() {
        
        // test all vouts
        await testGetVouts(undefined, undefined, undefined, true);
        
        // test vouts per account
        let accounts = await wallet.getAccounts(true);
        for (let account of accounts) {
          await testGetVouts(account.getIndex());
          
          // test vouts per subaddress
          for (let subaddress of account.getSubaddresses()) {
            await testGetVouts(account.getIndex(), subaddress.getSubaddressIndex());
          }
        }
        
        // TODO: test unconfirmed txs
        //assert(walletBalance.compare(expectedBalance) === 0, "Account " + account.getIndex() + " balance does not add up: " + expectedBalance.toString() + " vs " + walletBalance.toString());
        
        // test fetching with filter
        await testGetVouts(1, undefined, true, true);
        await testGetVouts(2, undefined, false, true);
        await testGetVouts(1, 2, false, true);
        await testGetVouts(1, 2, true, true);
        await testGetVouts(1, [1, 2], false, true);
        await testGetVouts(1, [1, 3], true, true);
        await testGetVouts(new MoneroVoutFilter().setAccountIndex(1).setSubaddressIndices([1, 3]).setIsSpent(true), undefined, undefined, true);
        
        // test expected errors
        await testGetVoutsError([1], [2], false, "First parameter must be a MoneroVoutFilter, unsigned integer, or undefined");
        await testGetVoutsError(new MoneroVoutFilter().setSubaddressIndices([1]), [-1, 2], false, "Second parameter must be an unsigned integer, array of unsigned integers, or undefined");
        await testGetVoutsError(new MoneroVoutFilter().setSubaddressIndices([2]), [2], "hello", "Third parameter must be a boolean or undefined");
        await testGetVoutsError(new MoneroVoutFilter().setSubaddressIndices([1]), [2], false, "Parameters for subaddress indices do not match");
        await testGetVoutsError(new MoneroVoutFilter().setIsSpent(true), undefined, false, "Parameters for isSpent do not match");

        // helper function to fetch and test vouts
        async function testGetVouts(filterOrAccountIdx, subaddressIndices, isSpent, mustFind) {
          
          // get vouts
          let vouts = await wallet.getVouts(filterOrAccountIdx, subaddressIndices, isSpent);
          if (mustFind) assert(vouts.length > 0, "No vouts matching filter found; run send tests");
          
          // standardize inputs as filter
          let filter;
          if (filterOrAccountIdx instanceof MoneroVoutFilter) filter = filterOrAccountIdx;
          else {
            assert(filterOrAccountIdx === undefined || typeof filterOrAccountIdx === "number" && filterOrAccountIdx >= 0, "First parameter must be a MoneroVoutFilter, unsigned integer, or undefined");
            filter = new MoneroVoutFilter().setAccountIndex(filterOrAccountIdx);
          }
          if (subaddressIndices !== undefined) {
            subaddressIndices = GenUtils.listify(subaddressIndices);
            for (let subaddressIdx of subaddressIndices) assert(subaddressIdx >= 0, "Second parameter must be an unsigned integer, array of unsigned integers, or undefined");
            filter.setSubaddressIndices(MoneroUtils.reconcile(filter.getSubaddressIndices(), subaddressIndices, undefined, "Parameters for subaddress indices do not match"));
          }
          if (isSpent !== undefined) {
            assert.equal("boolean", typeof isSpent, "Third parameter must be a boolean or undefined");
            filter.setIsSpent(MoneroUtils.reconcile(filter.getIsSpent(), isSpent, undefined, "Parameters for isSpent do not match"));
          }
          
          // test each vout
          for (let vout of vouts) {
            testVout(vout);
            if (filter.getAccountIndex() !== undefined) assert.equal(filter.getAccountIndex(), vout.getAccountIndex());
            if (filter.getSubaddressIndices() !== undefined) assert(filter.getSubaddressIndices().includes(vout.getSubaddressIndex()));
            if (isSpent !== undefined) assert.equal(isSpent, vout.getIsSpent());
          }
        }
        
        // helper function to test expected errors
        async function testGetVoutsError(filterOrAccountIdx, subaddressIndices, isSpent, errMsg) {
          try {
            await testGetVouts(filterOrAccountIdx, subaddressIndices, isSpent);
            throw new Error("Should have failed");
          } catch (e) {
            assert.equal(errMsg, e.message);
          }
        }
      });
      
      it("Has correct accounting across accounts, subaddresses, txs, transfers, and vouts", async function() {
        
        // pre-fetch wallet balances, accounts, subaddresses, and txs
        let walletBalance = await wallet.getBalance();
        let walletUnlockedBalance = await wallet.getUnlockedBalance();
        let accounts = await wallet.getAccounts(true);  // includes subaddresses
        let txs = await wallet.getTxs();
        
        // sort txs
        txs.sort((a, b) => {
          let timestampA = a.getBlockTimestamp() ? a.getBlockTimestamp() : a.getReceivedTime();
          let timestampB = b.getBlockTimestamp() ? b.getBlockTimestamp() : b.getReceivedTime();
          if (timestampA < timestampB) return -1;
          if (timestampA > timestampB) return 1;
          return 0;
        })
        
        // test wallet balance
        TestUtils.testUnsignedBigInteger(walletBalance);
        TestUtils.testUnsignedBigInteger(walletUnlockedBalance);
        assert(walletBalance >= walletUnlockedBalance);
        
        // test that wallet balance equals sum of account balances
        let accountsBalance = new BigInteger(0);
        let accountsUnlockedBalance = new BigInteger(0);
        for (let account of accounts) {
          testAccount(account); // test that account balance equals sum of subaddress balances
          accountsBalance = accountsBalance.add(account.getBalance());
          accountsUnlockedBalance = accountsUnlockedBalance.add(account.getUnlockedBalance());
        }
        assert.equal(0, walletBalance.compare(accountsBalance));
        assert.equal(0, walletUnlockedBalance.compare(accountsUnlockedBalance));
        
//        // test that wallet balance equals net of wallet's incoming and outgoing tx amounts
//        // TODO monero-wallet-rpc: these tests are disabled because incoming transfers are not returned when sent from the same account, so doesn't balance #4500
//        // TODO: test unlocked balance based on txs, requires e.g. tx.isLocked()
//        let outgoingSum = new BigInteger(0);
//        let incomingSum = new BigInteger(0);
//        for (let tx of txs) {
//          if (tx.getOutgoingAmount()) outgoingSum = outgoingSum.add(tx.getOutgoingAmount());
//          if (tx.getIncomingAmount()) incomingSum = incomingSum.add(tx.getIncomingAmount());
//        }
//        assert.equal(walletBalance.toString(), incomingSum.subtract(outgoingSum).toString());
//        
//        // test that each account's balance equals net of account's incoming and outgoing tx amounts
//        for (let account of accounts) {
//          if (account.getIndex() !== 1) continue; // find 1
//          outgoingSum = new BigInteger(0);
//          incomingSum = new BigInteger(0);
//          let filter = new MoneroTxFilter();
//          filter.setAccountIndex(account.getIndex());
//          for (let tx of txs.filter(tx => filter.meetsCriteria(tx))) { // normally we'd call wallet.getTxs(filter) but we're using pre-fetched txs
//            if (tx.getId() === "8d3919d98dd5a734da8c52eddc558db3fbf059ad55d432f0052ecd59ef122ecb") console.log(tx.toString(0));
//            
//            //console.log((tx.getOutgoingAmount() ? tx.getOutgoingAmount().toString() : "") + ", " + (tx.getIncomingAmount() ? tx.getIncomingAmount().toString() : ""));
//            if (tx.getOutgoingAmount()) outgoingSum = outgoingSum.add(tx.getOutgoingAmount());
//            if (tx.getIncomingAmount()) incomingSum = incomingSum.add(tx.getIncomingAmount());
//          }
//          assert.equal(account.getBalance().toString(), incomingSum.subtract(outgoingSum).toString());
//        }
        
        // wallet balance is sum of all unspent vouts
        let walletSum = new BigInteger(0);
        for (let vout of await wallet.getVouts(undefined, undefined, false)) walletSum = walletSum.add(vout.getAmount());
        assert.equal(walletBalance.toString(), walletSum.toString());
        
        // account balances are sum of their unspent vouts
        for (let account of accounts) {
          let accountSum = new BigInteger(0);
          let accountVouts = await wallet.getVouts(account.getIndex(), undefined, false);
          for (let vout of accountVouts) accountSum = accountSum.add(vout.getAmount());
          assert.equal(account.getBalance().toString(), accountSum.toString());
          
          // subaddress balances are sum of their unspent vouts
          for (let subaddress of account.getSubaddresses()) {
            let subaddressSum = new BigInteger(0);
            let subaddressVouts = await wallet.getVouts(account.getIndex(), subaddress.getSubaddressIndex(), false);
            for (let vout of subaddressVouts) subaddressSum = subaddressSum.add(vout.getAmount());
            assert.equal(subaddress.getBalance().toString(), subaddressSum.toString());
          }
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
      
      it("Can check a transfer using the transaction's secret key and the destination", async function() {
        
        // get random txs that are confirmed and have outgoing destinations
        let filter = new MoneroTxFilter();
        filter.setIsConfirmed(true);
        filter.setHasOutgoingTransfer(true);
        filter.setTransferFilter(new MoneroTransferFilter().setHasDestinations(true));
        let txs = await getRandomTransactions(wallet, filter, 1, MAX_TX_PROOFS);
        
        // test good checks
        assert(txs.length > 0, "No transactions found with outgoing destinations");
        for (let tx of txs) {
          let key = await wallet.getTxKey(tx.getId());
          for (let destination of tx.getOutgoingTransfer().getDestinations()) {
            let check = await wallet.checkTxKey(tx.getId(), key, destination.getAddress());
            if (destination.getAmount().compare(new BigInteger()) > 0) {
              // TODO monero-wallet-rpc: indicates amount received amount is 0 despite transaction with transfer to this address
              // TODO monero-wallet-rpc: returns 0-4 errors, not consistent
//            assert(check.getAmountReceived().compare(new BigInteger(0)) > 0);
              if (check.getAmountReceived().compare(new BigInteger(0)) === 0) {
                console.log("WARNING: key proof indicates no funds received despite transfer (txid=" + tx.getId() + ", key=" + key + ", address=" + destination.getAddress() + ", amount=" + destination.getAmount() + ")");
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
        let destination = tx.getOutgoingTransfer().getDestinations()[0];
        try {
          await wallet.checkTxKey("invalid_tx_id", key, destination.getAddress());
          throw new Error("Should have thrown exception");
        } catch (e) {
          assert.equal(-8, e.getRpcCode());
        }
        
        // test check with invalid key
        try {
          await wallet.checkTxKey(tx.getId(), "invalid_tx_key", destination.getAddress());
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
          if (!aTx.getOutgoingTransfer() || !aTx.getOutgoingTransfer().getDestinations()) continue;
          for (let aDestination of aTx.getOutgoingTransfer().getDestinations()) {
            if (aDestination.getAddress() !== destination.getAddress()) {
              differentAddress = aDestination.getAddress();
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
        
        // get random txs that are confirmed and have outgoing destinations
        let filter = new MoneroTxFilter();
        filter.setIsConfirmed(true);
        filter.setHasOutgoingTransfer(true);
        filter.setTransferFilter(new MoneroTransferFilter().setHasDestinations(true));
        let txs = await getRandomTransactions(wallet, filter, 2, MAX_TX_PROOFS);
        
        // test good checks with messages
        for (let tx of txs) {
          for (let destination of tx.getOutgoingTransfer().getDestinations()) {
            let signature = await wallet.getTxProof(tx.getId(), destination.getAddress(), "This transaction definitely happened.");
            let check = await wallet.checkTxProof(tx.getId(), destination.getAddress(), "This transaction definitely happened.", signature);
            testCheckTx(tx, check);
          }
        }
        
        // test good check without message
        let tx = txs[0];
        let destination = tx.getOutgoingTransfer().getDestinations()[0];
        let signature = await wallet.getTxProof(tx.getId(), destination.getAddress());
        let check = await wallet.checkTxProof(tx.getId(), destination.getAddress(), undefined, signature);
        testCheckTx(tx, check);
        
        // test get proof with invalid id
        try {
          await wallet.getTxProof("invalid_tx_id", destination.getAddress());
          throw new Error("Should throw exception for invalid key");
        } catch (e) {
          assert.equal(-8, e.getRpcCode());
        }
        
        // test check with invalid tx id
        try {
          await wallet.checkTxProof("invalid_tx_id", destination.getAddress(), undefined, signature);
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
        signature = await wallet.getTxProof(tx.getId(), destination.getAddress(), "This is the right message");
        check = await wallet.checkTxProof(tx.getId(), destination.getAddress(), "This is the wrong message", signature);
        assert.equal(false, check.getIsGood());
        testCheckTx(tx, check);
        
        // test check with wrong signature
        let wrongSignature = await wallet.getTxProof(txs[1].getId(), txs[1].getOutgoingTransfer().getDestinations()[0].getAddress(), "This is the right message");
        try {
          check = await wallet.checkTxProof(tx.getId(), destination.getAddress(), "This is the right message", wrongSignature);  
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
        assert((await wallet.getBalance()).compare(check.getAmountTotal()) === 0);  // TODO monero-wallet-rpc: fails after send tests
        
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
    });
  }
  
  _testSends() {
    let wallet = this.wallet;
    let daemon = this.daemon;
    
    describe("Test Sends", function() {
      
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
        config.setCanSplit(canSplit); // so test knows txs could be split
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
            await testWalletTx(tx, {wallet: wallet, sendConfig: config});
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
        for (let tx of txs) {
          await testWalletTx(tx, {wallet: wallet, sendConfig: config, isRelayResponse: doNotRelay});
          assert.equal(fromAccount.getIndex(), tx.getOutgoingTransfer().getAccountIndex());
          assert.equal(0, tx.getOutgoingTransfer().getSubaddressIndex()); // TODO (monero-wallet-rpc): outgoing transactions do not indicate originating subaddresses
          assert(sendAmount.compare(tx.getOutgoingAmount()) === 0);
          
          // test outgoing destinations
          if (tx.getOutgoingTransfer() && tx.getOutgoingTransfer().getDestinations()) {
            assert.equal(1, tx.getOutgoingTransfer().getDestinations().length);
            for (let destination of tx.getOutgoingTransfer().getDestinations()) {
              assert.equal(address, destination.getAddress());
              assert(sendAmount.compare(destination.getAmount()) === 0);
            }
          }
        }
        testCommonTxSets(txs, false, false, false);
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
            
        // config to send
        let destinations = [];
        for (let i = 0; i < destinationAddresses.length; i++) {
          destinations.push(new MoneroDestination(destinationAddresses[i], sendAmountPerSubaddress));
        }
        let config = new MoneroSendConfig();
        config.setCanSplit(canSplit);
        config.setMixin(TestUtils.MIXIN);
        config.setAccountIndex(srcAccount.getIndex());
        config.setDestinations(destinations);
        
        // send tx(s) with config
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
        let outgoingSum = new BigInteger(0);
        for (let tx of txs) {
          await testWalletTx(tx, {wallet: wallet, sendConfig: config});
          outgoingSum = outgoingSum.add(tx.getOutgoingAmount());
          if (tx.getOutgoingTransfer() !== undefined && tx.getOutgoingTransfer().getDestinations()) {
            let destinationSum = new BigInteger(0);
            for (let destination of tx.getOutgoingTransfer().getDestinations()) {
              assert(destinationAddresses.includes(destination.getAddress()));
              destinationSum = destinationSum.add(destination.getAmount());
            }
            assert(tx.getOutgoingAmount().compare(destinationSum) === 0);  // assert that transfers sum up to tx amount
          }
        }
        
        // assert that outgoing amounts sum up to the amount sent within a small margin
        if (Math.abs(sendAmount.subtract(outgoingSum).toJSValue()) > SEND_MAX_DIFF) { // send amounts may be slightly different
          throw new Error("Actual send amount is too different from requested send amount: " + sendAmount + " - " + outgoingSum + " = " + sendAmount.subtract(outgoingSum));
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
        config.setCanSplit(canSplit); // so test knows txs could be split
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
        let outgoingSum = new BigInteger(0);
        for (let tx of txs) {
          await testWalletTx(tx, {wallet: wallet, sendConfig: config});
          outgoingSum = outgoingSum.add(tx.getOutgoingAmount());
          if (tx.getOutgoingTransfer() !== undefined && tx.getOutgoingTransfer().getDestinations()) {
            let destinationSum = new BigInteger(0);
            for (let destination of tx.getOutgoingTransfer().getDestinations()) {
              assert.equal(address, destination.getAddress());
              destinationSum = destinationSum.add(destination.getAmount());
            }
            assert(tx.getOutgoingAmount().compare(destinationSum) === 0);  // assert that transfers sum up to tx amount
          }
        }
        
        // assert that tx amounts sum up the amount sent within a small margin
        if (Math.abs(sendAmount.subtract(outgoingSum).toJSValue()) > SEND_MAX_DIFF) { // send amounts may be slightly different
          throw new Error("Tx amounts are too different: " + sendAmount + " - " + outgoingSum + " = " + sendAmount.subtract(outgoingSum));
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
        config.setDoNotRelay(false);  // TODO: remoe this and update testTxWalletSend with isRelayResponse
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
    });
  }
  
  _testResets() {
    let wallet = this.wallet;
    let daemon = this.daemon;
    let that = this;
    
    describe("Test Resets", function() {
      
      // TODO: specific to monero-wallet-rpc?
      // disabled so tests don't delete local cache
//      it("Can rescan the blockchain", async function() {
//        await wallet.rescanBlockchain();
//        for (let tx of await wallet.getTxs()) {
//          testTxWalletGet(wallet, tx, hat.unbalancedTxIds);
//        }
//      });
      
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
    });
  }
  
  _testNotifications() {
    let wallet = this.wallet;
    let daemon = this.daemon;
    let that = this;
    
    describe("Test Notifications", function() {
      
      // start mining if possible to help push the network along
      before(async function() {
        try { await wallet.startMining(8, false, true); }
        catch (e) { }
      });
      
      // stop mining
      after(async function() {
        try { await wallet.stopMining(); }
        catch (e) { }
      });
      
      // TODO: test sending to multiple accounts
      
      it("Can update a locked tx sent from/to the same account as blocks are added to the chain", async function() {
        let sendConfig = new MoneroSendConfig(await wallet.getPrimaryAddress(), TestUtils.MAX_FEE);
        sendConfig.setAccountIndex(0);
        sendConfig.setUnlockTime(3);
        sendConfig.setCanSplit(false);
        await testSendAndUpdateTxs(sendConfig);
      });
      
      it("Can update split locked txs sent from/to the same account as blocks are added to the chain", async function() {
        let sendConfig = new MoneroSendConfig(await wallet.getPrimaryAddress(), TestUtils.MAX_FEE);
        sendConfig.setAccountIndex(0);
        sendConfig.setUnlockTime(3);
        sendConfig.setCanSplit(true);
        await testSendAndUpdateTxs(sendConfig);
      });
      
      it("Can update a locked tx sent from/to different accounts as blocks are added to the chain", async function() {
        let sendConfig = new MoneroSendConfig((await wallet.getSubaddress(1, 0)).getAddress(), TestUtils.MAX_FEE);
        sendConfig.setAccountIndex(0);
        sendConfig.setUnlockTime(3);
        sendConfig.setCanSplit(false);
        await testSendAndUpdateTxs(sendConfig);
      });
      
      it("Can update a locked tx sent from/to different accounts as blocks are added to the chain", async function() {
        let sendConfig = new MoneroSendConfig((await wallet.getSubaddress(1, 0)).getAddress(), TestUtils.MAX_FEE);
        sendConfig.setAccountIndex(0);
        sendConfig.setUnlockTime(3);
        sendConfig.setCanSplit(true);
        await testSendAndUpdateTxs(sendConfig);
      });
      
      /**
       * Tests sending a tx with an unlockTime then tracking and updating it as
       * blocks are added to the chain.
       * 
       * TODO: test wallet accounting throughout this; dedicated method? probably.
       * 
       * Allows sending to and from the same account which is an edge case where
       * incoming txs are occluded by their outgoing counterpart (issue #4500)
       * and also where it is impossible to discern which incoming output is
       * the tx amount and which is the change amount without wallet metadata.
       * 
       * @param sendConfig is the send configuration to send and test
       */
      async function testSendAndUpdateTxs(sendConfig) {
        
        // send transactions
        let sentTxs;
        if (sendConfig.getCanSplit()) sentTxs = await wallet.sendSplit(sendConfig);
        else sentTxs = [await wallet.send(sendConfig)];
        
        // test sent transactions
        for (let tx of sentTxs) {
          await testWalletTx(tx, {wallet: wallet, sendConfig: sendConfig})
          assert.equal(false, tx.getIsConfirmed());
          assert.equal(true, tx.getInTxPool());
        }
        
        // track resulting outoging and incoming txs as blocks are added to the chain
        let updatedTxs;
        
        // loop to update txs through confirmations
        let numConfirmations = 0;
        const numConfirmationsTotal = 2; // number of confirmations to test
        while (numConfirmations < numConfirmationsTotal) {
          
          // wait for a block
          let header = await daemon.nextBlockHeader();
          console.log("*** Block " + header.getHeight() + " added to chain ***");
          
          // give wallet time to catch up, otherwise incoming tx may not appear
          await new Promise(function(resolve) { setTimeout(resolve, 5000); });  // TODO: this lets new block slip, okay?
          
          // get incoming/outgoing txs with sent ids
          let filter = new MoneroTxFilter();
          filter.setTxIds(sentTxs.map(sentTx => sentTx.getId())); // TODO: convenience methods wallet.getTxById(), getTxsById()?
          let fetchedTxs = await wallet.getTxs(filter);
          assert(fetchedTxs.length > 0);
          
          // test fetched txs
          await testOutInPairs(wallet, fetchedTxs, sendConfig);

          // merge fetched txs into updated txs and original sent txs
          for (let fetchedTx of fetchedTxs) {
            
            // merge with updated txs
            if (updatedTxs === undefined) updatedTxs = fetchedTxs;
            else {
              for (let updatedTx of updatedTxs) {
                if (fetchedTx.getId() !== updatedTx.getId()) continue;
                if (fetchedTx.getIsOutgoing() !== updatedTx.getIsOutgoing()) continue;
                updatedTx.merge(fetchedTx);
              }
            }
            
            // merge with original sent txs
            for (let sentTx of sentTxs) {
              if (fetchedTx.getId() !== sentTx.getId()) continue;
              if (fetchedTx.getIsOutgoing() !== sentTx.getIsOutgoing()) continue;
              sentTx.merge(fetchedTx);  // TODO: it's mergeable but tests don't account for extra info from send (e.g. hex) so not tested; could specify in test config
            }
          }
          
          // test updated txs
          await testOutInPairs(wallet, updatedTxs, sendConfig);
          
          // update confirmations to exit loop
          numConfirmations = fetchedTxs[0].getConfirmationCount();
        }
      }
      
      async function testOutInPairs(wallet, txs, sendConfig) {
        
        // for each out tx
        let txOut;
        for (let tx of txs) {
          await testUnlockTx(wallet, tx, sendConfig);
          if (!tx.getIsOutgoing()) continue;
          let txOut = tx;
          
          // find incoming counterpart
          let txIn;
          for (let tx2 of txs) {
            if (tx2.getIsIncoming() && tx.getId() == tx2.getId()) {
              txIn = tx2;
              break;
            }
          }
          
          // test out / in pair
          // TODO monero-wallet-rpc: incoming txs occluded by their outgoing counterpart #4500
          if (!txIn) {
            assert.equal(true, txOut.getInTxPool());
            assert(txOut.getOutgoingAmount().toJSValue() > 0); // counterpart only fabricated for 0 amt txs
            console.log("WARNING: unconfirmed outgoing tx " + txOut.getId() + " missing incoming counterpart (issue #4500)");
          } else {
            await testOutInPair(txOut, txIn);
          }
        }
      }
      
      async function testOutInPair(txOut, txIn) {
        assert.equal(txOut.getIsConfirmed(), txIn.getIsConfirmed());
        assert.equal(0, txOut.getOutgoingAmount().compare(txIn.getIncomingAmount()));
      }
      
      async function testUnlockTx(wallet, tx, sendConfig) {
        try {
          await testWalletTx(tx, {wallet: wallet});
        } catch (e) {
          console.log(tx.toString());
          throw e;
        }
        assert.equal(sendConfig.getUnlockTime(), tx.getUnlockTime()); // TODO: send config as part of test, then this fn not necessary
      }
    });
  }
}

// TODO: replace with TestUtils.testUnsignedBigInteger
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

/**
 * Tests a wallet transaction with a test configuration.
 * 
 * @param tx is the wallet transaction to test
 * @param testConfig specifies test configuration
 *        testConfig.wallet is used to cross reference tx info if available
 *        testConfig.sendConfig specifies config of a tx generated with send()
 *        testConfig.hasDestinations specifies if the tx has an outgoing transfer with destinations, undefined if doesn't matter
 *        testConfig.voutsFetched specifies if vouts were fetched and should therefore be expected  // TODO: keep?
 *        testConfig.isRelayResponse specifies if tx is a fresh relay response which is missing some fields (e.g. key)
 */
async function testWalletTx(tx, testConfig) {
  
  // validate / sanitize inputs
  delete testConfig.wallet; // TODO: re-enable
  if (!(tx instanceof MoneroWalletTx)) {
    console.log("TX is not a MoneroWalletTx!");
    console.log(tx);
  }
  assert(tx instanceof MoneroWalletTx);
  testConfig = Object.assign({}, testConfig);
  if (testConfig.wallet) assert (testConfig.wallet instanceof MoneroWallet);
  assert(testConfig.hasDestinations == undefined || typeof config.hasDestinations === "boolean");
  
  // test common field types
  testWalletTxTypes(tx);
  
  // test confirmed
  if (tx.getIsConfirmed()) {
    assert.equal(true, tx.getIsRelayed());
    assert.equal(false, tx.getIsFailed());
    assert.equal(false, tx.getInTxPool());
    assert.equal(false, tx.getDoNotRelay());
    assert.notEqual(tx.getHeight() >= 0);
    assert(tx.getConfirmationCount() > 0);
    assert(tx.getBlockTimestamp() > 0);
    assert.equal(false, tx.getIsDoubleSpend());
  } else {
    assert.equal(undefined, tx.getHeight());
    assert.equal(0, tx.getConfirmationCount());
    assert.equal(undefined, tx.getBlockTimestamp());
  }
  
  // test in tx pool
  if (tx.getInTxPool()) {
    assert.equal(false, tx.getIsConfirmed());
    assert.equal(false, tx.getDoNotRelay());
    assert.equal(true, tx.getIsRelayed());
    assert.equal(false, tx.getIsDoubleSpend()); // TODO: test double spend attempt
    assert.equal(undefined, tx.getLastFailedHeight());
    assert.equal(undefined, tx.getLastFailedId());
    
    // these should be initialized unless freshly sent
    if (!testConfig.sendConfig) {
      assert(tx.getReceivedTime() > 0);
      tx.getEstimatedBlockCountUntilConfirmed() > 0
    }
  } else {
    assert.equal(undefined, tx.getEstimatedBlockCountUntilConfirmed());
    assert.equal(undefined, tx.getLastRelayedTime());
  }
  
  // test outgoing
  if (tx.getIsOutgoing()) {
    TestUtils.testUnsignedBigInteger(tx.getOutgoingAmount());
    let outgoingTransfer = tx.getOutgoingTransfer();
    assert(outgoingTransfer);
    assert(outgoingTransfer.getAccountIndex() >= 0);
    assert.equal(outgoingTransfer.getSubaddressIndex(), 0);  // TODO: possible to know actual src subaddress index?
    assert(outgoingTransfer.getAddress());
    if (testConfig.wallet) assert.equal(await testConfig.wallet.getAddress(outgoingTransfer.getAccountIndex(), outgoingTransfer.getSubaddressIndex()), outgoingTransfer.getAddress());
    assert.equal(false, tx.getIsCoinbase());
  } else {
    assert.equal(undefined, tx.getOutgoingAmount());
    assert.equal(undefined, tx.getOutgoingTransfer());
    assert.equal(undefined, tx.getMixin());
    assert.equal(undefined, tx.getHex());
    assert.equal(undefined, tx.getMetadata());
    assert.equal(undefined, tx.getKey());
  }
  
  // test outgoing destinations per configuration
  if (testConfig.hasDestinations) {
    assert(tx.getOutgoingTransfer());
    assert(tx.getOutgoingTransfer().getDestinations());
  } else if (testConfig.hasOutgoingTransfer === false) {
    assert(tx.getOutgoingTransfer() === undefined || tx.getOutgoingTransfer().getDestinations() === undefined);
  }
  if (tx.getOutgoingTransfer() && tx.getOutgoingTransfer().getDestinations()) {
    
    // test each destination and collect sum
    let sum = new BigInteger(0);
    for (let destination of tx.getOutgoingTransfer().getDestinations()) {
      assert(destination instanceof MoneroDestination);
      assert(destination.getAddress());
      TestUtils.testUnsignedBigInteger(destination.getAmount());
      sum = sum.add(destination.getAmount());
      
      // TODO special case: transfer amount of 0
    }
    
    // destinations add up to outgoing amount
    assert.equal(0, sum.compare(tx.getOutgoingTransfer().getAmount()));
  }
  
  // test incoming
  if (tx.getIsIncoming()) {
    TestUtils.testUnsignedBigInteger(tx.getIncomingAmount());
    assert.equal(false, tx.getIsFailed());
  } else {
    assert.equal(undefined, tx.getIncomingAmount());
    assert.equal(undefined, tx.getIncomingTransfers());
  }
  
  // test incoming transfers
  if (tx.getIncomingTransfers()) {
    assert.equal(true, tx.getIsIncoming());
    assert(tx.getIncomingTransfers().length > 0);
    
    // test each transfer and collect transfer sum
    let transferSum = new BigInteger(0);
    for (let transfer of tx.getIncomingTransfers()) {
      assert(transfer instanceof MoneroTransfer);
      assert(transfer.getAddress());
      TestUtils.testUnsignedBigInteger(transfer.getAmount());
      transferSum = transferSum.add(transfer.getAmount());
      assert(transfer.getAccountIndex() >= 0);
      assert(transfer.getSubaddressIndex() >= 0);
      if (testConfig.wallet) assert.equal(await testConfig.wallet.getAddress(transfer.getAccountIndex(), transfer.getSubaddressIndex()), transfer.getAddress());
      
      // TODO special case: transfer amount of 0
    }
    
    // incoming transfers add up to incoming tx amount
    assert.equal(0, transferSum.compare(tx.getIncomingAmount()));
  } else {
    
    // transfers can can be undefined if sent from/to same account
    if (tx.getIsIncoming()) {
      assert.equal(undefined, tx.getOutgoingTransfers());
      assert.equal(0, new BigInteger(0).compare(tx.getOutgoingAmount()));
      assert.equal(0, new BigInteger(0).compare(tx.getIncomingAmount()));
    }
  }
  
  // test coinbase tx
  if (tx.getIsCoinbase()) {
    assert.equal(0, tx.getFee().compare(new BigInteger(0)));
    assert.equal(true, tx.getIsIncoming());
  }
  
  // test failed  // TODO: what else to test associated with failed
  if (tx.getIsFailed()) {
    assert(tx.getIsOutgoing());
    assert(tx.getReceivedTime() > 0)
  } else {
    if (tx.getIsRelayed()) assert.equal(false, tx.getIsDoubleSpend());
    else {
      assert.equal(false, tx.getIsRelayed());
      assert.equal(true, tx.getDoNotRelay());
      assert.equal(undefined, tx.getIsDoubleSpend());
    }
  }
  assert.equal(undefined, tx.getLastFailedHeight());
  assert.equal(undefined, tx.getLastFailedId());
  
  // received time only for tx pool or failed txs
  if (tx.getReceivedTime() !== undefined) {
    assert(tx.getInTxPool() || tx.getIsFailed());
  }
  
  // test relayed tx
  if (tx.getIsRelayed()) assert.equal(false, tx.getDoNotRelay());
  if (tx.getDoNotRelay()) assert(!tx.getIsRelayed());
  
  // test tx result from send(), sendSplit(), or relayTxs()
  if (testConfig.sendConfig) {
    
    // test common attributes
    let sendConfig = testConfig.sendConfig;
    assert.equal(true, tx.getIsOutgoing());
    assert.equal(false, tx.getIsConfirmed());
    assert.equal(sendConfig.getMixin(), tx.getMixin());
    assert.equal(sendConfig.getUnlockTime() ? sendConfig.getUnlockTime() : 0, tx.getUnlockTime());
    assert.equal(undefined, tx.getBlockTimestamp());
    if (sendConfig.getCanSplit()) assert.equal(undefined, tx.getKey()); // TODO monero-wallet-rpc: key only known on `transfer` response
    else assert(tx.getKey().length > 0);
    assert.equal("string", typeof tx.getHex());
    assert(tx.getHex().length > 0);
    assert(tx.getMetadata());
    assert.deepEqual(sendConfig.getDestinations(), tx.getOutgoingTransfer().getDestinations());
    assert.equal(undefined, tx.getReceivedTime());
    if (testConfig.isRelayResponse) assert.equal(true, sendConfig.getDoNotRelay());
    
    // test relayed txs
    if (testConfig.isRelayResponse || !sendConfig.getDoNotRelay()) {
      assert.equal(true, tx.getInTxPool());
      assert.equal(false, tx.getDoNotRelay());
      assert.equal(true, tx.getIsRelayed());
      assert(tx.getLastRelayedTime() > 0);
      assert.equal(false, tx.getIsDoubleSpend());
    }
    
    // test non-relayed txs
    else {
      assert.equal(false, tx.getInTxPool());
      assert.equal(true, tx.getDoNotRelay());
      assert.equal(false, tx.getIsRelayed());
      assert.equal(undefined, tx.getLastRelayedTime());
      assert.equal(undefined, tx.getIsDoubleSpend());
    }
  } else {
    assert.equal(undefined, tx.getMixin());
    assert.equal(undefined, tx.getKey());
    assert.equal(undefined, tx.getHex());
    assert.equal(undefined, tx.getMetadata());
    assert.equal(undefined, tx.getLastRelayedTime());
  }
  
  // test vouts
  // TODO: ensure test of some vouts
  if (testConfig.voutsFetched && (tx.getIncomingTransfers() || tx.getVouts())) {
    assert(tx.getVouts().length > 0);
    for (let vout of tx.getVouts()) {
      assert(vout instanceof MoneroWalletOutput);
      assert(vout.getKeyImage());
      TestUtils.testUnsignedBigInteger(vout.getAmount(), true);
      assert(vout.getIndex() >= 0);
      assert(vout.getAccountIndex() >= 0);
      assert(vout.getSubaddressIndex() >= 0);
      assert.equal("boolean", typeof vout.getIsSpent());
    }
  } else {
    assert.equal(undefined, tx.getVouts());
  }
}

/**
 * Tests that common tx field types are valid regardless of tx state.
 * 
 * @param tx is the tx to test
 */
function testWalletTxTypes(tx) {
  assert.equal("string", typeof tx.getId());
  assert.equal("boolean", typeof tx.getIsIncoming());
  assert.equal("boolean", typeof tx.getIsOutgoing());
  assert.equal("boolean", typeof tx.getIsConfirmed());
  assert.equal("boolean", typeof tx.getIsCoinbase());
  assert.equal("boolean", typeof tx.getIsFailed());
  assert.equal("boolean", typeof tx.getIsRelayed());
  assert.equal("boolean", typeof tx.getInTxPool());
  TestUtils.testUnsignedBigInteger(tx.getFee());
  assert.equal(undefined, tx.getVins());  // TODO no way to expose vins?
  if (tx.getPaymentId()) assert.notEqual(MoneroTx.DEFAULT_PAYMENT_ID, tx.getPaymentId()); // default payment id converted to undefined
  if (tx.getNote()) assert(tx.getNote().length > 0);  // empty notes converted to undefined
  assert(tx.getUnlockTime() >= 0);
  assert.equal(undefined, tx.getSize());   // TODO (monero-wallet-rpc): add tx_size to get_transfers and get_transfer_by_txid
  assert.equal(undefined, tx.getWeight());
}

// TODO: test uncommon references
function testWalletTxCopy(tx) {
  let copy = tx.copy();
  assert(copy instanceof MoneroWalletTx);
  assert.deepEqual(tx, copy);
}

function testTransfer(transfer) {
  throw new Error("Not implemented");
}

function testVout(vout) {
  assert(vout);
  assert(vout instanceof MoneroWalletOutput);
  assert(vout.getAccountIndex() >= 0);
  assert(vout.getSubaddressIndex() >= 0);
  assert.equal("boolean", typeof vout.getIsSpent());
  assert(vout.getKeyImage());
  TestUtils.testUnsignedBigInteger(vout.getAmount(), true);
  assert(vout.getIndex() >= 0);
  
  // vout has circular reference to its transaction which has some initialized fields
  let tx = vout.getTx();
  assert(tx);
  assert(tx instanceof MoneroWalletTx);
  assert(tx.getVouts().includes(vout));
  assert(tx.getId());
  assert.equal(true, tx.getIsConfirmed());  // TODO monero-wallet-rpc: possible to get unconfirmed vouts?
  assert.equal(true, tx.getIsRelayed());
  assert.equal(false, tx.getIsFailed());
}

function testCommonTxSets(txs, hasSigned, hasUnsigned, hasMultisig) {
  assert(txs.length > 0);
  
  // assert that all sets are same reference
  let sets;
  for (let i = 0; i < txs.length; i++) {
    assert(txs[i] instanceof MoneroTx);
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

module.exports = TestMoneroWalletCommon;