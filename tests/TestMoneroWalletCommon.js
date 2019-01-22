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
    describe("Common Wallet Tests" + (config.liteMode ? " (lite mode)" : ""), function() {
      if (config.testNonSends) that._testNonSends(config.liteMode);
      if (config.testSends) that._testSends(config.liteMode);
      if (config.testResets) that._testResets(config.liteMode);
      if (config.testNotifications) that._testNotifications(config.liteMode);
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
    
    describe("Test Non-Sends", function() {

      // local tx cache for tests
      let txCache;
      async function getCachedTxs() {
        if (!txCache) txCache = await wallet.getTxs();
        return txCache;
      }
      
//      it("Can get the current height that the wallet is synchronized to", async function() {
//        let height = await wallet.getHeight();
//        assert(height >= 0);
//      });
//      
//      it("Can get the mnemonic phrase derived from the seed", async function() {
//        let mnemonic = await wallet.getMnemonic();
//        MoneroUtils.validateMnemonic(mnemonic);
//        assert.equal(mnemonic, TestUtils.TEST_MNEMONIC);
//      });
//      
//      it("Can get a list of supported languages for the mnemonic phrase", async function() {
//        let languages = await wallet.getLanguages();
//        assert(Array.isArray(languages));
//        assert(languages.length);
//        for (let language of languages) assert(language);
//      });
//      
//      it("Can get the private view key", async function() {
//        let privateViewKey = await wallet.getPrivateViewKey()
//        MoneroUtils.validatePrivateViewKey(privateViewKey);
//      });
//      
//      it("Can get the primary address", async function() {
//        let primaryAddress = await wallet.getPrimaryAddress();
//        MoneroUtils.validateAddress(primaryAddress);
//        assert.equal(primaryAddress, (await wallet.getSubaddress(0, 0)).getAddress());
//      });
//      
//      it("Can get an integrated address given a payment id", async function() {
//        
//        // save address for later comparison
//        let address = (await wallet.getSubaddress(0, 0)).getAddress();
//        
//        // test valid payment id
//        let paymentId = "03284e41c342f036";
//        let integratedAddress = await wallet.getIntegratedAddress(paymentId);
//        assert.equal(integratedAddress.getStandardAddress(), address);
//        assert.equal(integratedAddress.getPaymentId(), paymentId);
//        
//        // test invalid payment id
//        try {
//          let invalidPaymentId = "invalid_payment_id_123456";
//          integratedAddress = await wallet.getIntegratedAddress(invalidPaymentId);
//          throw new Error("Getting integrated address with invalid payment id " + invalidPaymentId + " should have thrown a RPC exception");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -5);
//          assert.equal(e.getRpcMessage(), "Invalid payment ID");
//        }
//        
//        // test null payment id which generates a new one
//        integratedAddress = await wallet.getIntegratedAddress(null);
//        assert.equal(integratedAddress.getStandardAddress(), address);
//        assert(integratedAddress.getPaymentId().length);
//      });
//      
//      it("Can decode an integrated address", async function() {
//        let integratedAddress = await wallet.getIntegratedAddress("03284e41c342f036");
//        let decodedAddress = await wallet.decodeIntegratedAddress(integratedAddress.toString());
//        assert.deepEqual(decodedAddress, integratedAddress);
//      });
//      
//      it("Can sync (without progress)", async function() {
//        let numBlocks = 100;
//        let chainHeight = await daemon.getHeight();
//        assert(chainHeight >= numBlocks);
//        let resp = await wallet.sync(chainHeight - numBlocks);  // sync end of chain
//        assert(resp.blocks_fetched >= 0);
//        assert(typeof resp.received_money === "boolean");
//      });
//      
//      it("Can get the balance and unlocked balance", async function() {
//        let balance = await wallet.getBalance();
//        TestUtils.testUnsignedBigInteger(balance);
//        let unlockedBalance = await wallet.getUnlockedBalance();
//        TestUtils.testUnsignedBigInteger(unlockedBalance);
//      });
//      
//      it("Can get all accounts in the wallet without subaddresses", async function() {
//        let accounts = await wallet.getAccounts();
//        assert(accounts.length > 0);
//        accounts.map(account => {
//          testAccount(account)
//          assert(account.getSubaddresses() === undefined);
//        });
//      });
//      
//      it("Can get all accounts in the wallet with subaddresses", async function() {
//        let accounts = await wallet.getAccounts(true);
//        assert(accounts.length > 0);
//        accounts.map(account => {
//          testAccount(account);
//          assert(account.getSubaddresses().length > 0);
//        });
//      });
//      
//      it("Can get an account at a specified index", async function() {
//        let accounts = await wallet.getAccounts();
//        assert(accounts.length > 0);
//        for (let account of accounts) {
//          testAccount(account);
//          
//          // test without subaddresses
//          let retrieved = await wallet.getAccount(account.getIndex());
//          assert(retrieved.getSubaddresses() === undefined);
//          
//          // test with subaddresses
//          retrieved = await wallet.getAccount(account.getIndex(), true);
//          assert(retrieved.getSubaddresses().length > 0);
//        }
//      });
//      
//      it("Can create a new account without a label", async function() {
//        let accountsBefore = await wallet.getAccounts();
//        let createdAccount = await wallet.createAccount();
//        testAccount(createdAccount);
//        assert(createdAccount.getLabel() === undefined);
//        assert(accountsBefore.length === (await wallet.getAccounts()).length - 1);
//      });
//      
//      it("Can create a new account with a label", async function() {
//        
//        // create account with label
//        let accountsBefore = await wallet.getAccounts();
//        let label = GenUtils.uuidv4();
//        let createdAccount = await wallet.createAccount(label);
//        testAccount(createdAccount);
//        assert(createdAccount.getLabel() === label);
//        assert(accountsBefore.length === (await wallet.getAccounts()).length - 1);
//
//        // create account with same label
//        createdAccount = await wallet.createAccount(label);
//        testAccount(createdAccount);
//        assert(createdAccount.getLabel() === label);
//        assert(accountsBefore.length === (await wallet.getAccounts()).length - 2);
//      });
//      
//      it("Can get subaddresses at a specified account index", async function() {
//        let accounts = await wallet.getAccounts();
//        assert(accounts.length > 0);
//        for (let account of accounts) {
//          let subaddresses = await wallet.getSubaddresses(account.getIndex());
//          assert(subaddresses.length > 0);
//          subaddresses.map(subaddress => {
//            testSubaddress(subaddress);
//            assert(account.getIndex() === subaddress.getAccountIndex());
//          });
//        }
//      });
//      
//      it("Can get subaddresses at specified account and subaddress indices", async function() {
//        let accounts = await wallet.getAccounts();
//        assert(accounts.length > 0);
//        for (let account of accounts) {
//          
//          // get subaddresses
//          let subaddresses = await wallet.getSubaddresses(account.getIndex());
//          assert(subaddresses.length > 0);
//          
//          // remove a subaddress for query if possible
//          if (subaddresses.length > 1) subaddresses.splice(0, 1);
//          
//          // get subaddress indices
//          let subaddressIndices = subaddresses.map(subaddress => subaddress.getSubaddressIndex());
//          assert(subaddressIndices.length > 0);
//          
//          // fetch subaddresses by indices
//          let fetchedSubaddresses = await wallet.getSubaddresses(account.getIndex(), subaddressIndices);
//          
//          // original subaddresses (minus one removed if applicable) is equal to fetched subaddresses
//          assert.deepEqual(fetchedSubaddresses, subaddresses);
//        }
//      });
//      
//      it("Can get a subaddress at a specified account and subaddress index", async function() {
//        let accounts = await wallet.getAccounts();
//        assert(accounts.length > 0);
//        for (let account of accounts) {
//          let subaddresses = await wallet.getSubaddresses(account.getIndex());
//          assert(subaddresses.length > 0);
//          for (let subaddress of subaddresses) {
//            assert.deepEqual(await wallet.getSubaddress(account.getIndex(), subaddress.getSubaddressIndex()), subaddress);
//            assert.deepEqual((await wallet.getSubaddresses(account.getIndex(), subaddress.getSubaddressIndex()))[0], subaddress); // test plural call with single subaddr number
//          }
//        }
//      });
//      
//      it("Can create a subaddress with and without a label", async function() {
//        
//        // create subaddresses across accounts
//        let accounts = await wallet.getAccounts();
//        if (accounts.length < 2) await wallet.createAccount();
//        accounts = await wallet.getAccounts();
//        assert(accounts.length > 1);
//        for (let accountIdx = 0; accountIdx < 2; accountIdx++) {
//          
//          // create subaddress with no label
//          let subaddresses = await wallet.getSubaddresses(accountIdx);
//          let subaddress = await wallet.createSubaddress(accountIdx);
//          assert.equal(subaddress.getLabel(), "");
//          testSubaddress(subaddress);
//          let subaddressesNew = await wallet.getSubaddresses(accountIdx);
//          assert.equal(subaddressesNew.length - 1, subaddresses.length);
//          assert.deepEqual(subaddressesNew[subaddressesNew.length - 1], subaddress);
//          
//          // create subaddress with label
//          subaddresses = await wallet.getSubaddresses(accountIdx);
//          let uuid = GenUtils.uuidv4();
//          subaddress = await wallet.createSubaddress(accountIdx, uuid);
//          assert.equal(uuid, subaddress.getLabel());
//          testSubaddress(subaddress);
//          subaddressesNew = await wallet.getSubaddresses(accountIdx);
//          assert.equal(subaddressesNew.length - 1, subaddresses.length);
//          assert.deepEqual(subaddressesNew[subaddressesNew.length - 1], subaddress);
//        }
//      });
//      
//      it("Can get the address of a subaddress at a specified account and subaddress index", async function() {
//        assert.equal((await wallet.getSubaddress(0, 0)).getAddress(), await wallet.getPrimaryAddress());
//        for (let account of await wallet.getAccounts(true)) {
//          for (let subaddress of await wallet.getSubaddresses(account.getIndex())) {
//            assert.equal(await wallet.getAddress(account.getIndex(), subaddress.getSubaddressIndex()), subaddress.getAddress());
//          }
//        }
//      });
//      
//      it("Can get transactions in the wallet", async function() {
//        let nonDefaultIncoming = false;
//        let txs1 = await getCachedTxs();
//        let txs2 = await testGetTxs(wallet, undefined, true);
//        assert.equal(txs2.length, txs1.length);
//        for (let i = 0; i < txs1.length; i++) {
//          await testWalletTx(txs1[i], {wallet: wallet});  // test cached tx
//          let merged = txs1[i].copy().merge(txs2[i].copy());
//          await testWalletTx(merged, {wallet: wallet});   // test merging equivalent txs
//          if (txs1[i].getIncomingTransfers()) {
//            for (let transfer of txs1[i].getIncomingTransfers()) {
//              if (transfer.getAccountIndex() !== 0 && transfer.getSubaddressIndex() !== 0) nonDefaultIncoming = true;
//            }
//          }
//        }
//        assert(nonDefaultIncoming, "No incoming transfers found to non-default account and subaddress; run send-to-multiple tests first");
//      });
//      
//      if (!liteMode)
//      it("Can get transactions with additional configuration", async function() {
//        
//        // get random transactions with payment ids for testing
//        let randomTxs = await getRandomTransactions(wallet, {hasPaymentId: true}, 3, 5);
//        for (let randomTx of randomTxs) {
//          assert(randomTx.getPaymentId());
//        }
//        
//        // get transactions by id
//        let txIds = [];
//        for (let randomTx of randomTxs) {
//          txIds.push(randomTx.getId());
//          let txs = await testGetTxs(wallet, {txId: randomTx.getId()}, true);
//          assert.equal(txs.length, 1);
//          let merged = txs[0].merge(randomTx.copy()); // txs change with chain so check mergeability
//          await testWalletTx(merged);
//        }
//        
//        // get transactions by ids
//        let txs = await testGetTxs(wallet, {txIds: txIds});
//        assert.equal(txs.length, randomTxs.length);
//        for (let tx of txs) assert(txIds.includes(tx.getId()));
//        
//        // get transactions with an outgoing transfer
//        txs = await testGetTxs(wallet, {hasOutgoingTransfer: true}, true);
//        for (let tx of txs) assert(tx.getOutgoingTransfer() instanceof MoneroTransfer);
//        
//        // get transactions without an outgoing transfer
//        txs = await testGetTxs(wallet, {hasOutgoingTransfer: false}, true);
//        for (let tx of txs) assert.equal(tx.getOutgoingTransfer(), undefined);
//        
//        // get transactions with incoming transfers
//        txs = await testGetTxs(wallet, {hasIncomingTransfers: true}, true);
//        for (let tx of txs) {
//          assert(tx.getIncomingTransfers().length > 0);
//          for (let transfer of tx.getIncomingTransfers()) assert(transfer instanceof MoneroTransfer);
//        }
//        
//        // get transactions without incoming transfers
//        txs = await testGetTxs(wallet, {hasIncomingTransfers: false}, true);
//        for (let tx of txs) assert.equal(tx.getIncomingTransfers(), undefined);
//        
//        // get transactions associated with an account
//        let accountIdx = 1;
//        txs = await wallet.getTxs({transferFilter: {accountIndex: accountIdx}});
//        for (let tx of txs) {
//          let found = false;
//          if (tx.getOutgoingTransfer() && tx.getOutgoingTransfer().getAccountIndex() === accountIdx) found = true;
//          else if (tx.getIncomingTransfers()) {
//            for (let transfer of tx.getIncomingTransfers()) {
//              if (transfer.getAccountIndex() === accountIdx) {
//                found = true;
//                break;
//              }
//            }
//          }
//          assert(found, ("Transaction is not associated with account " + accountIdx + ":\n" + tx.toString()));
//        }
//        
//        // get transactions with incoming transfers to an account
//        txs = await wallet.getTxs({transferFilter: {isIncoming: true, accountIndex: accountIdx}});
//        for (let tx of txs) {
//          assert(tx.getIncomingTransfers().length > 0);
//          let found = false;
//          for (let transfer of tx.getIncomingTransfers()) {
//            if (transfer.getAccountIndex() === accountIdx) {
//              found = true;
//              break;
//            }
//          }
//          assert(found, "No incoming transfers to account " + accountIdx + " found:\n" + tx.toString());
//        }
//        
//        // get txs with manually built filter that are confirmed have an outgoing transfer from account 0
//        let txFilter = new MoneroTxFilter();
//        txFilter.setTx(new MoneroTx().setIsConfirmed(true));
//        txFilter.setTransferFilter(new MoneroTransferFilter().setTransfer(new MoneroTransfer().setAccountIndex(0)).setIsOutgoing(true));
//        txs = await testGetTxs(wallet, txFilter, true);
//        for (let tx of txs) {
//          if (!tx.getIsConfirmed()) console.log(tx.toString());
//          assert.equal(tx.getIsConfirmed(), true);
//          assert(tx.getOutgoingTransfer());
//          assert.equal(tx.getOutgoingTransfer().getAccountIndex(), 0);
//        }
//        
//        // get txs with outgoing transfers that have destinations to account 1
//        txs = await testGetTxs(wallet, {transferFilter: {hasDestinations: true, accountIndex: 0}});
//        for (let tx of txs) {
//          assert(tx.getOutgoingTransfer());
//          assert(tx.getOutgoingTransfer().getDestinations().length > 0);
//        }
//        
//        // get transactions by payment id
//        let paymentIds = randomTxs.map(tx => tx.getPaymentId());
//        assert(paymentIds.length > 1);
//        for (let paymentId of paymentIds) {
//          txs = await testGetTxs(wallet, {paymentId: paymentId});
//          assert.equal(txs.length, 1);
//          assert(txs[0].getPaymentId());
//          MoneroUtils.validatePaymentId(txs[0].getPaymentId());
//        }
//        
//        // get transactions by payment ids
//        txs = await testGetTxs(wallet, {paymentIds: paymentIds});
//        for (let tx of txs) {
//          assert(paymentIds.includes(tx.getPaymentId()));
//        }
//        
//        // test block height filtering
//        {
//          txs = await wallet.getTxs({accountIndex: 0});
//          assert(txs.length > 0, "No transactions; run send to multiple test");
//            
//          // get and sort block heights in ascending order
//          let heights = [];
//          for (let tx of txs) {
//            if (tx.getHeight() !== undefined) heights.push(tx.getHeight());
//          }
//          GenUtils.sort(heights);
//          
//          // pick minimum and maximum heights for filtering
//          let minHeight = -1;
//          let maxHeight = -1;
//          if (heights.length == 1) {
//            minHeight = 0;
//            maxHeight = heights[0] - 1;
//          } else {
//            minHeight = heights[0] + 1;
//            maxHeight = heights[heights.length - 1] - 1;
//          }
//          
//          // assert some transactions filtered
//          let unfilteredCount = txs.length;
//          txs = await testGetTxs(wallet, {accountIndex: 0, minHeight: minHeight, maxHeight: maxHeight}, true);
//          assert(txs.length < unfilteredCount);
//          for (let tx of txs) {
//            assert(tx.getHeight() >= minHeight && tx.getHeight() <= maxHeight);
//          }
//        }
//        
//        // include vouts with transactions
//        txs = await testGetTxs(wallet, {getVouts: true}, true);
//        let found = false;
//        for (let tx of txs) {
//          if (tx.getVouts()) {
//            assert(tx.getVouts().length > 0);
//            found = true;
//            break;
//          }
//        }
//        assert(found, "No vouts found in txs");
//      });
//      
//      it("Returns all known fields of txs regardless of filtering", async function() {
//        
//        // fetch wallet txs
//        let txs = await wallet.getTxs();
//        for (let tx of txs) {
//          
//          // find tx sent to same wallet with incoming transfer in different account than src account
//          if (!tx.getOutgoingTransfer() || !tx.getIncomingTransfers()) continue;
//          if (tx.getOutgoingAmount().compare(tx.getIncomingAmount()) !== 0) continue;
//          for (let transfer of tx.getIncomingTransfers()) {
//            if (transfer.getAccountIndex() === tx.getOutgoingTransfer().getAccountIndex()) continue;
//            
//            // fetch tx with filtering
//            let filteredTxs = await wallet.getTxs({transferFilter: {isIncoming: true, accountIndex: transfer.getAccountIndex()}});
//            let filteredTx = new MoneroTxFilter().setTxIds([tx.getId()]).apply(filteredTxs)[0];
//            
//            // txs should be the same (mergeable)
//            assert.equal(filteredTx.getId(), tx.getId());
//            tx.merge(filteredTx);
//            
//            // test is done
//            return;
//          }
//        }
//        
//        // test did not fully execute
//        throw new Error("Test requires tx sent from/to different accounts of same wallet but none found; run send tests");
//      });
//      
//      if (!liteMode)
//      it("Validates inputs when getting transactions", async function() {
//        
//        // test with invalid id
//        let txs = await wallet.getTxs({txId: "invalid_id"});
//        assert.equal(txs.length, 0);
//        
//        // test invalid id in collection
//        let randomTxs = await getRandomTransactions(wallet, undefined, 3, 5);
//        txs = await wallet.getTxs({txIds: [randomTxs[0].getId(), "invalid_id"]});
//        assert.equal(txs.length, 1);
//        assert.equal(txs[0].getId(), randomTxs[0].getId());
//        
//        // TODO: test other input validation here
//      });
//
//      it("Can get transfers in the wallet, accounts, and subaddresses", async function() {
//        
//        // get all transfers
//        await testGetTransfers(wallet, undefined, true);
//        
//        // get transfers by account index
//        let nonDefaultIncoming = false;
//        for (let account of await wallet.getAccounts(true)) {
//          let accountTransfers = await testGetTransfers(wallet, {accountIndex: account.getIndex()});
//          for (let transfer of accountTransfers) assert.equal(transfer.getAccountIndex(), account.getIndex());
//          
//          // get transfers by subaddress index
//          let subaddressTransfers = [];
//          for (let subaddress of account.getSubaddresses()) {
//            let transfers = await testGetTransfers(wallet, {accountIndex: subaddress.getAccountIndex(), subaddressIndex: subaddress.getSubaddressIndex()});
//            for (let transfer of transfers) {
//              assert.equal(transfer.getAccountIndex(), subaddress.getAccountIndex());
//              assert.equal(transfer.getSubaddressIndex(), transfer.getIsOutgoing() ? 0 : subaddress.getSubaddressIndex());
//              if (transfer.getAccountIndex() !== 0 && transfer.getSubaddressIndex() !== 0) nonDefaultIncoming = true;
//              
//              // don't add duplicates TODO monero-wallet-rpc: duplicate outgoing transfers returned for different subaddress indices, way to return outgoing subaddress indices?
//              let found = false;
//              for (let subaddressTransfer of subaddressTransfers) {
//                if (transfer.toString() === subaddressTransfer.toString() && transfer.getTx().getId() === subaddressTransfer.getTx().getId()) {
//                  found = true;
//                  break;
//                }
//              }
//              if (!found) subaddressTransfers.push(transfer);
//            }
//          }
//          assert.equal(subaddressTransfers.length, accountTransfers.length);
//          
//          // get transfers by subaddress indices
//          let subaddressIndices = subaddressTransfers.map(transfer => transfer.getSubaddressIndex());
//          let transfers = await testGetTransfers(wallet, {accountIndex: account.getIndex(), subaddressIndices: subaddressIndices});
//          assert.equal(transfers.length, subaddressTransfers.length);
//          for (let transfer of transfers) {
//            assert.equal(transfer.getAccountIndex(), account.getIndex());
//            assert(subaddressIndices.includes(transfer.getSubaddressIndex()));
//          }
//        }
//        
//        // ensure transfer found with non-zero account and subaddress indices
//        assert(nonDefaultIncoming, "No transfers found in non-default account and subaddress; run send-to-multiple tests");
//      });
//      
//      if (!liteMode)
//      it("Can get transfers with additional configuration", async function() {
//        
//        // get incoming transfers
//        let transfers = await testGetTransfers(wallet, {isIncoming: true}, true);
//        for (let transfer of transfers) assert(transfer.getIsIncoming());
//        
//        // get outgoing transfers
//        transfers = await testGetTransfers(wallet, {isOutgoing: true}, true);
//        for (let transfer of transfers) assert(transfer.getIsOutgoing());
//        
//        // get confirmed transfers to account 0
//        transfers = await testGetTransfers(wallet, {accountIndex: 0, isConfirmed: true}, true);
//        for (let transfer of transfers) {
//          assert.equal(transfer.getAccountIndex(), 0);
//          assert(transfer.getTx().getIsConfirmed());
//        }
//        
//        // get confirmed transfers to [1, 2]
//        transfers = await testGetTransfers(wallet, {accountIndex: 1, subaddressIndex: 2, isConfirmed: true}, true);
//        for (let transfer of transfers) {
//          assert.equal(transfer.getAccountIndex(), 1);
//          assert.equal(transfer.getSubaddressIndex(), transfer.getIsOutgoing() ? 0 : 2);
//          assert(transfer.getTx().getIsConfirmed());
//        }
//        
//        // get transfers in the tx pool
//        transfers = await testGetTransfers(wallet, {inTxPool: true});
//        for (let transfer of transfers) {
//          assert.equal(transfer.getTx().getInTxPool(), true);
//        }
//        
//        // get random transactions
//        let txs = await getRandomTransactions(wallet, undefined, 3, 5);
//        
//        // get transfers with a tx id
//        let txIds = [];
//        for (let tx of txs) {
//          txIds.push(tx.getId());
//          transfers = await testGetTransfers(wallet, {txId: tx.getId()}, true);
//          for (let transfer of transfers) assert.equal(transfer.getTx().getId(), tx.getId());
//        }
//        
//        // get transfers with tx ids
//        transfers = await testGetTransfers(wallet, {txIds: txIds}, true);
//        for (let transfer of transfers) assert(txIds.includes(transfer.getTx().getId()));
//        
//        // TODO: test that transfers with the same txId have the same tx reference
//        
//        // TODO: test transfers destinations
//        
//        // get transfers with pre-built filter that are confirmed and have outgoing destinations
//        let transferFilter = new MoneroTransferFilter();
//        transferFilter.setIsOutgoing(true);
//        transferFilter.setHasDestinations(true);
//        transferFilter.setTxFilter(new MoneroTxFilter().setTx(new MoneroTx().setIsConfirmed(true)));
//        transfers = await testGetTransfers(wallet, transferFilter);
//        for (let transfer of transfers) {
//          assert.equal(transfer.getIsOutgoing(), true);
//          assert(transfer.getDestinations().length > 0);
//          assert.equal(transfer.getTx().getIsConfirmed(), true);
//        }
//      });
//      
//      if (!liteMode)
//      it("Validates inputs when getting transfers", async function() {
//        
//        // test with invalid id
//        let transfers = await wallet.getTransfers({txId: "invalid_id"});
//        assert.equal(transfers.length, 0);
//        
//        // test invalid id in collection
//        let randomTxs = await getRandomTransactions(wallet, undefined, 3, 5);
//        transfers = await wallet.getTransfers({txIds: [randomTxs[0].getId(), "invalid_id"]});
//        assert(transfers.length > 0);
//        let tx = transfers[0].getTx();
//        for (let transfer of transfers) assert(tx === transfer.getTx());
//        
//        // test unused subaddress indices
//        transfers = await wallet.getTransfers({accountIndex: 0, subaddressIndices: [1234907]});
//        assert(transfers.length === 0);
//        
//        // test invalid subaddress index
//        try {
//          transfers = await wallet.getTransfers({accountIndex: 0, subaddressIndex: -10});
//          throw new Error("Should have failed");
//        } catch (e) {
//          assert.notEqual(e.message, "Should have failed");
//        }
//      });
//      
//      it("Can get vouts in the wallet, accounts, and subaddresses", async function() {
//
//        // get all vouts
//        await testGetVouts(wallet, undefined, true);
//        
//        // get vouts for each account
//        let nonDefaultIncoming = false;
//        let accounts = await wallet.getAccounts(true);
//        for (let account of accounts) {
//          
//          // determine if account is used
//          let isUsed = false;
//          for (let subaddress of account.getSubaddresses()) if (subaddress.getIsUsed()) isUsed = true;
//          
//          // get vouts by account index
//          let accountVouts = await testGetVouts(wallet, {accountIndex: account.getIndex()}, isUsed);
//          for (let vout of accountVouts) assert.equal(vout.getAccountIndex(), account.getIndex());
//          
//          // get vouts by subaddress index
//          let subaddressVouts = [];
//          for (let subaddress of account.getSubaddresses()) {
//            let vouts = await testGetVouts(wallet, {accountIndex: account.getIndex(), subaddressIndex: subaddress.getSubaddressIndex()}, subaddress.getIsUsed());
//            for (let vout of vouts) {
//              assert.equal(vout.getAccountIndex(), subaddress.getAccountIndex());
//              assert.equal(vout.getSubaddressIndex(), subaddress.getSubaddressIndex());
//              if (vout.getAccountIndex() !== 0 && vout.getSubaddressIndex() !== 0) nonDefaultIncoming = true;
//              subaddressVouts.push(vout);
//            }
//          }
//          assert.equal(subaddressVouts.length, accountVouts.length);
//          
//          // get vouts by subaddress indices
//          let subaddressIndices = Array.from(new Set(subaddressVouts.map(vout => vout.getSubaddressIndex())));
//          let vouts = await testGetVouts(wallet, {accountIndex: account.getIndex(), subaddressIndices: subaddressIndices}, isUsed);
//          assert.equal(vouts.length, subaddressVouts.length);
//          for (let vout of vouts) {
//            assert.equal(vout.getAccountIndex(), account.getIndex());
//            assert(subaddressIndices.includes(vout.getSubaddressIndex()));
//          }
//        }
//        
//        // ensure vout found with non-zero account and subaddress indices
//        assert(nonDefaultIncoming, "No vouts found in non-default account and subaddress; run send-to-multiple tests");
//      });
//      
//      if (!liteMode)
//      it("Can get vouts with additional configuration", async function() {
//        
//        // get unspent vouts to account 0
//        let vouts = await testGetVouts(wallet, {accountIndex: 0, isSpent: false});
//        for (let vout of vouts) {
//          assert.equal(vout.getAccountIndex(), 0);
//          assert.equal(vout.getIsSpent(), false);
//        }
//        
//        // get spent vouts to account 1
//        vouts = await testGetVouts(wallet, {accountIndex: 1, isSpent: true}, true);
//        for (let vout of vouts) {
//          assert.equal(vout.getAccountIndex(), 1);
//          assert.equal(vout.getIsSpent(), true);
//        }
//        
//        // get random transactions
//        let txs = await getRandomTransactions(wallet, undefined, 3, 5);
//        
//        // get vouts with a tx id
//        let txIds = [];
//        for (let tx of txs) {
//          txIds.push(tx.getId());
//          vouts = await testGetVouts(wallet, {txId: tx.getId()}, true);
//          for (let vout of vouts) assert.equal(vout.getTx().getId(), tx.getId());
//        }
//        
//        // get vouts with tx ids
//        vouts = await testGetVouts(wallet, {txIds: txIds}, true);
//        for (let vout of vouts) assert(txIds.includes(vout.getTx().getId()));
//        
//        // get confirmed vouts to specific subaddress with pre-built filter
//        let accountIdx = 0;
//        let subaddressIdx = 1;
//        let voutFilter = new MoneroVoutFilter();
//        voutFilter.setVout(new MoneroWalletOutput().setAccountIndex(accountIdx).setSubaddressIndex(subaddressIdx));
//        voutFilter.setTxFilter(new MoneroTxFilter().setTx(new MoneroTx().setIsConfirmed(true)));
//        vouts = await testGetVouts(wallet, voutFilter, true);
//        for (let vout of vouts) {
//          assert.equal(vout.getAccountIndex(), accountIdx);
//          assert.equal(vout.getSubaddressIndex(), subaddressIdx);
//          assert.equal(vout.getTx().getIsConfirmed(), true);
//        }
//      });
//      
//      if (!liteMode)
//      it("Validates inputs when getting vouts", async function() {
//        
//        // test with invalid id
//        let vouts = await wallet.getVouts({txId: "invalid_id"});
//        assert.equal(vouts.length, 0);
//        
//        // test invalid id in collection
//        let randomTxs = await getRandomTransactions(wallet, undefined, 3, 5);
//        vouts = await wallet.getVouts({txIds: [randomTxs[0].getId(), "invalid_id"]});
//        assert(vouts.length > 0);
//        let tx = vouts[0].getTx();
//        for (let vout of vouts) assert(tx === vout.getTx());
//      });
//      
//      it("Has correct accounting across accounts, subaddresses, txs, transfers, and vouts", async function() {
//        
//        // pre-fetch wallet balances, accounts, subaddresses, and txs
//        let walletBalance = await wallet.getBalance();
//        let walletUnlockedBalance = await wallet.getUnlockedBalance();
//        let accounts = await wallet.getAccounts(true);  // includes subaddresses
//        let txs = await wallet.getTxs();
//        
//        // sort txs
//        txs.sort((a, b) => {
//          let timestampA = a.getBlockTimestamp() ? a.getBlockTimestamp() : a.getReceivedTime();
//          let timestampB = b.getBlockTimestamp() ? b.getBlockTimestamp() : b.getReceivedTime();
//          if (timestampA < timestampB) return -1;
//          if (timestampA > timestampB) return 1;
//          return 0;
//        })
//        
//        // test wallet balance
//        TestUtils.testUnsignedBigInteger(walletBalance);
//        TestUtils.testUnsignedBigInteger(walletUnlockedBalance);
//        assert(walletBalance >= walletUnlockedBalance);
//        
//        // test that wallet balance equals sum of account balances
//        let accountsBalance = new BigInteger(0);
//        let accountsUnlockedBalance = new BigInteger(0);
//        for (let account of accounts) {
//          testAccount(account); // test that account balance equals sum of subaddress balances
//          accountsBalance = accountsBalance.add(account.getBalance());
//          accountsUnlockedBalance = accountsUnlockedBalance.add(account.getUnlockedBalance());
//        }
//        assert.equal(walletBalance.compare(accountsBalance), 0);
//        assert.equal(walletUnlockedBalance.compare(accountsUnlockedBalance), 0);
//        
////        // test that wallet balance equals net of wallet's incoming and outgoing tx amounts
////        // TODO monero-wallet-rpc: these tests are disabled because incoming transfers are not returned when sent from the same account, so doesn't balance #4500
////        // TODO: test unlocked balance based on txs, requires e.g. tx.isLocked()
////        let outgoingSum = new BigInteger(0);
////        let incomingSum = new BigInteger(0);
////        for (let tx of txs) {
////          if (tx.getOutgoingAmount()) outgoingSum = outgoingSum.add(tx.getOutgoingAmount());
////          if (tx.getIncomingAmount()) incomingSum = incomingSum.add(tx.getIncomingAmount());
////        }
////        assert.equal(incomingSum.subtract(outgoingSum).toString(), walletBalance.toString());
////        
////        // test that each account's balance equals net of account's incoming and outgoing tx amounts
////        for (let account of accounts) {
////          if (account.getIndex() !== 1) continue; // find 1
////          outgoingSum = new BigInteger(0);
////          incomingSum = new BigInteger(0);
////          let filter = new MoneroTxFilter();
////          filter.setAccountIndex(account.getIndex());
////          for (let tx of txs.filter(tx => filter.meetsCriteria(tx))) { // normally we'd call wallet.getTxs(filter) but we're using pre-fetched txs
////            if (tx.getId() === "8d3919d98dd5a734da8c52eddc558db3fbf059ad55d432f0052ecd59ef122ecb") console.log(tx.toString(0));
////            
////            //console.log((tx.getOutgoingAmount() ? tx.getOutgoingAmount().toString() : "") + ", " + (tx.getIncomingAmount() ? tx.getIncomingAmount().toString() : ""));
////            if (tx.getOutgoingAmount()) outgoingSum = outgoingSum.add(tx.getOutgoingAmount());
////            if (tx.getIncomingAmount()) incomingSum = incomingSum.add(tx.getIncomingAmount());
////          }
////          assert.equal(incomingSum.subtract(outgoingSum).toString(), account.getBalance().toString());
////        }
//        
//        // balance may not equal sum of unspent vouts if if unconfirmed txs
//        // TODO monero-wallet-rpc: reason not to return unspent vouts on unconfirmed txs? then this isn't necessary
//        let hasUnconfirmedTx = false;
//        for (let tx of txs) if (tx.getInTxPool()) hasUnconfirmedTx = true;
//        
//        // wallet balance is sum of all unspent vouts
//        let walletSum = new BigInteger(0);
//        for (let vout of await wallet.getVouts({isSpent: false})) walletSum = walletSum.add(vout.getAmount());
//        if (walletBalance.toString() !== walletSum.toString()) assert(hasUnconfirmedTx, "Wallet balance must equal sum of unspent vouts if no unconfirmed txs");
//        
//        // account balances are sum of their unspent vouts
//        for (let account of accounts) {
//          let accountSum = new BigInteger(0);
//          let accountVouts = await wallet.getVouts({accountIndex: account.getIndex(), isSpent: false});
//          for (let vout of accountVouts) accountSum = accountSum.add(vout.getAmount());
//          if (account.getBalance().toString() !== accountSum.toString()) assert(hasUnconfirmedTx, "Account balance must equal sum of its unspent vouts if no unconfirmed txs");
//          
//          // subaddress balances are sum of their unspent vouts
//          for (let subaddress of account.getSubaddresses()) {
//            let subaddressSum = new BigInteger(0);
//            let subaddressVouts = await wallet.getVouts({accountIndex: account.getIndex(), subaddressIndex: subaddress.getSubaddressIndex(), isSpent: false});
//            for (let vout of subaddressVouts) subaddressSum = subaddressSum.add(vout.getAmount());
//            if (subaddress.getBalance().toString() !== subaddressSum.toString()) assert(hasUnconfirmedTx, "Subaddress balance must equal sum of its unspent vouts if no unconfirmed txs");
//          }
//        }
//      });
//      
//      it("Can get and set a transaction note", async function() {
//        let txs = await getRandomTransactions(wallet, undefined, 1, 5);
//        
//        // set notes
//        let uuid = GenUtils.uuidv4();
//        for (let i = 0; i < txs.length; i++) {
//          await wallet.setTxNote(txs[i].getId(), uuid + i); // TODO: can we not iterate over awaits?
//        }
//        
//        // get notes
//        for (let i = 0; i < txs.length; i++) {
//          assert.equal(await wallet.getTxNote(txs[i].getId()), uuid + i);
//        }
//      });
//      
//      // TODO: why does getting cached txs take 2 seconds when should already be cached?
//      it("Can get and set multiple transaction notes", async function() {
//        
//        // set tx notes
//        let uuid = GenUtils.uuidv4();
//        let txs = await getCachedTxs();
//        assert(txs.length >= 3);
//        let txIds = [];
//        let txNotes = [];
//        for (let i = 0; i < txIds.length; i++) {
//          txIds.push(txs[i].getId());
//          txNotes.push(uuid + i);
//        }
//        await wallet.setTxNotes(txIds, txNotes);
//        
//        // get tx notes
//        txNotes = await wallet.getTxNotes(txIds);
//        for (let i = 0; i < txIds.length; i++) {
//          assert.equal(uuid + i, txNotes[i]);
//        }
//        
//        // TODO: test that get transaction has note
//      });
//      
//      it("Can check a transfer using the transaction's secret key and the destination", async function() {
//        
//        // get random txs that are confirmed and have outgoing destinations
//        let txs;
//        try {
//          txs = await getRandomTransactions(wallet, {isConfirmed: true, hasOutgoingTransfer: true, transferFilter: {hasDestinations: true}}, 1, MAX_TX_PROOFS);
//        } catch (e) {
//          throw new Error("No txs with outgoing destinations found; run send tests")
//        }
//        
//        // test good checks
//        assert(txs.length > 0, "No transactions found with outgoing destinations");
//        for (let tx of txs) {
//          let key = await wallet.getTxKey(tx.getId());
//          for (let destination of tx.getOutgoingTransfer().getDestinations()) {
//            let check = await wallet.checkTxKey(tx.getId(), key, destination.getAddress());
//            if (destination.getAmount().compare(new BigInteger()) > 0) {
//              // TODO monero-wallet-rpc: indicates amount received amount is 0 despite transaction with transfer to this address
//              // TODO monero-wallet-rpc: returns 0-4 errors, not consistent
////            assert(check.getAmountReceived().compare(new BigInteger(0)) > 0);
//              if (check.getAmountReceived().compare(new BigInteger(0)) === 0) {
//                console.log("WARNING: key proof indicates no funds received despite transfer (txid=" + tx.getId() + ", key=" + key + ", address=" + destination.getAddress() + ", amount=" + destination.getAmount() + ")");
//              }
//            }
//            else assert(check.getAmountReceived().compare(new BigInteger(0)) === 0);
//            testCheckTx(tx, check);
//          }
//        }
//        
//        // test get tx key with invalid id
//        try {
//          await wallet.getTxKey("invalid_tx_id");
//          throw new Error("Should throw exception for invalid key");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -8);
//        }
//        
//        // test check with invalid tx id
//        let tx = txs[0];
//        let key = await wallet.getTxKey(tx.getId());
//        let destination = tx.getOutgoingTransfer().getDestinations()[0];
//        try {
//          await wallet.checkTxKey("invalid_tx_id", key, destination.getAddress());
//          throw new Error("Should have thrown exception");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -8);
//        }
//        
//        // test check with invalid key
//        try {
//          await wallet.checkTxKey(tx.getId(), "invalid_tx_key", destination.getAddress());
//          throw new Error("Should have thrown exception");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -25);
//        }
//        
//        // test check with invalid address
//        try {
//          await wallet.checkTxKey(tx.getId(), key, "invalid_tx_address");
//          throw new Error("Should have thrown exception");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -2);
//        }
//        
//        // test check with different address
//        let differentAddress;
//        for (let aTx of await getCachedTxs()) {
//          if (!aTx.getOutgoingTransfer() || !aTx.getOutgoingTransfer().getDestinations()) continue;
//          for (let aDestination of aTx.getOutgoingTransfer().getDestinations()) {
//            if (aDestination.getAddress() !== destination.getAddress()) {
//              differentAddress = aDestination.getAddress();
//              break;
//            }
//          }
//        }
//        assert(differentAddress, "Could not get a different address to test");
//        let check = await wallet.checkTxKey(tx.getId(), key, differentAddress);
//        assert(check.getIsGood());
//        assert(check.getAmountReceived().compare(new BigInteger(0)) >= 0);
//        testCheckTx(tx, check);
//      });
//      
//      it("Can prove a transaction by getting its signature", async function() {
//        
//        // get random txs that are confirmed and have outgoing destinations
//        let txs;
//        try {
//          txs = await getRandomTransactions(wallet, {isConfirmed: true, hasOutgoingTransfer: true, transferFilter: {hasDestinations: true}}, 1, MAX_TX_PROOFS);
//        } catch (e) {
//          throw new Error("No txs with outgoing destinations found; run send tests")
//        }
//        
//        // test good checks with messages
//        for (let tx of txs) {
//          for (let destination of tx.getOutgoingTransfer().getDestinations()) {
//            let signature = await wallet.getTxProof(tx.getId(), destination.getAddress(), "This transaction definitely happened.");
//            let check = await wallet.checkTxProof(tx.getId(), destination.getAddress(), "This transaction definitely happened.", signature);
//            testCheckTx(tx, check);
//          }
//        }
//        
//        // test good check without message
//        let tx = txs[0];
//        let destination = tx.getOutgoingTransfer().getDestinations()[0];
//        let signature = await wallet.getTxProof(tx.getId(), destination.getAddress());
//        let check = await wallet.checkTxProof(tx.getId(), destination.getAddress(), undefined, signature);
//        testCheckTx(tx, check);
//        
//        // test get proof with invalid id
//        try {
//          await wallet.getTxProof("invalid_tx_id", destination.getAddress());
//          throw new Error("Should throw exception for invalid key");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -8);
//        }
//        
//        // test check with invalid tx id
//        try {
//          await wallet.checkTxProof("invalid_tx_id", destination.getAddress(), undefined, signature);
//          throw new Error("Should have thrown exception");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -8);
//        }
//        
//        // test check with invalid address
//        try {
//          await wallet.checkTxProof(tx.getId(), "invalid_tx_address", undefined, signature);
//          throw new Error("Should have thrown exception");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -2);
//        }
//        
//        // test check with wrong message
//        signature = await wallet.getTxProof(tx.getId(), destination.getAddress(), "This is the right message");
//        check = await wallet.checkTxProof(tx.getId(), destination.getAddress(), "This is the wrong message", signature);
//        assert.equal(check.getIsGood(), false);
//        testCheckTx(tx, check);
//        
//        // test check with wrong signature
//        let wrongSignature = await wallet.getTxProof(txs[1].getId(), txs[1].getOutgoingTransfer().getDestinations()[0].getAddress(), "This is the right message");
//        try {
//          check = await wallet.checkTxProof(tx.getId(), destination.getAddress(), "This is the right message", wrongSignature);  
//          assert.equal(check.getIsGood(), false);
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -1); // TODO: sometimes comes back bad, sometimes throws exception.  ensure txs come from different addresses?
//        }
//      });
//      
//      it("Can prove a spend using a generated signature and no destination public address", async function() {
//        
//        // get random confirmed outgoing txs
//        let filter = new MoneroTxFilter();
//        let txs = await getRandomTransactions(wallet, {hasIncomingTransfers: false, inTxPool: false, isFailed: false}, 2, MAX_TX_PROOFS);
//        for (let tx of txs) {
//          assert.equal(tx.getIsConfirmed(), true);
//          assert.equal(tx.getIncomingTransfers(), undefined);
//          assert(tx.getOutgoingTransfer());
//        }
//        
//        // test good checks with messages
//        for (let tx of txs) {
//          let signature = await wallet.getSpendProof(tx.getId(), "I am a message.");
//          assert(await wallet.checkSpendProof(tx.getId(), "I am a message.", signature));
//        }
//        
//        // test good check without message
//        let tx = txs[0];
//        let signature = await wallet.getSpendProof(tx.getId());
//        assert(await wallet.checkSpendProof(tx.getId(), undefined, signature));
//        
//        // test get proof with invalid id
//        try {
//          await wallet.getSpendProof("invalid_tx_id");
//          throw new Error("Should throw exception for invalid key");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -8);
//        }
//        
//        // test check with invalid tx id
//        try {
//          await wallet.checkSpendProof("invalid_tx_id", undefined, signature);
//          throw new Error("Should have thrown exception");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -8);
//        }
//        
//        // test check with invalid message
//        signature = await wallet.getSpendProof(tx.getId(), "This is the right message");
//        assert.equal(await wallet.checkSpendProof(tx.getId(), "This is the wrong message", signature), false);
//        
//        // test check with wrong signature
//        signature = await wallet.getSpendProof(txs[1].getId(), "This is the right message");
//        assert.equal(await wallet.checkSpendProof(tx.getId(), "This is the right message", signature), false);
//      });
//      
//      it("Can prove reserves in the wallet", async function() {
//        
//        // get proof of entire wallet
//        let signature = await wallet.getWalletReserveProof("Test message");
//        
//        // check proof of entire wallet
//        let check = await wallet.checkReserveProof(await wallet.getPrimaryAddress(), "Test message", signature);
//        assert(check.getIsGood());
//        testCheckReserve(check);
//        let balance = await wallet.getBalance();
//        if (balance.compare(check.getAmountTotal()) !== 0) {  // TODO monero-wallet-rpc: this check fails with unconfirmed txs
//          let unconfirmedTxs = await wallet.getTxs({inTxPool: true});
//          assert(unconfirmedTxs.length > 0, "Reserve amount must equal balance unless wallet has unconfirmed txs");
//        }
//        
//        // test different wallet address
//        // TODO: openWallet is not common so this won't work for other wallet impls
//        await wallet.openWallet(TestUtils.WALLET_RPC_NAME_2, TestUtils.WALLET_RPC_PW_2);
//        let differentAddress = await wallet.getPrimaryAddress();
//        await wallet.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_RPC_PW_1);
//        try {
//          await wallet.checkReserveProof(differentAddress, "Test message", signature);
//          throw new Error("Should have thrown exception");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -1);
//        }
//        
//        // test subaddress
//        try {1076
//          
//          await wallet.checkReserveProof((await wallet.getSubaddress(0, 1)).getAddress(), "Test message", signature);
//          throw new Error("Should have thrown exception");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -1);
//        }
//        
//        // test wrong message
//        check = await wallet.checkReserveProof(await wallet.getPrimaryAddress(), "Wrong message", signature);
//        assert.equal(check.getIsGood(), false);  // TODO: specifically test reserve checks, probably separate objects
//        testCheckReserve(check);
//        
//        // test wrong signature
//        try {
//          await wallet.checkReserveProof(await wallet.getPrimaryAddress(), "Test message", "wrong signature");
//          throw new Error("Should have thrown exception");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -1);
//        }
//      });
//      
//      it("Can prove reserves in an account", async function() {
//        
//        // test proofs of accounts
//        let numNonZeroTests = 0;
//        let msg = "Test message";
//        let accounts = await wallet.getAccounts();
//        let signature;
//        for (let account of accounts) {
//          if (account.getBalance().compare(new BigInteger(0)) > 0) {
//            let checkAmount = (await account.getBalance()).divide(new BigInteger(2));
//            signature = await wallet.getAccountReserveProof(account.getIndex(), checkAmount, msg);
//            let check = await wallet.checkReserveProof(await wallet.getPrimaryAddress(), msg, signature);
//            assert(check.getIsGood());
//            testCheckReserve(check);
//            assert(check.getAmountTotal().compare(checkAmount) >= 0);
//            numNonZeroTests++;
//          } else {
//            try {
//              await wallet.getAccountReserveProof(account.getIndex(), account.getBalance(), msg);
//              throw new Error("Should have thrown exception");
//            } catch (e) {
//              assert.equal(e.getRpcCode(), -1);
//              try {
//                await wallet.getAccountReserveProof(account.getIndex(), TestUtils.MAX_FEE, msg);
//                throw new Error("Should have thrown exception");
//              } catch (e2) {
//                assert.equal(e2.getRpcCode(), -1);
//              }
//            }
//          }
//        }
//        assert(numNonZeroTests > 1, "Must have more than one account with non-zero balance; run send-to-multiple tests");
//        
//        // test error when not enough balance for requested minimum reserve amount
//        try {
//          await wallet.getAccountReserveProof(0, accounts[0].getBalance().add(TestUtils.MAX_FEE), "Test message");
//          throw new Error("Should have thrown exception");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -1);
//        }
//        
//        // test different wallet address
//        // TODO: openWallet is not common so this won't work for other wallet impls
//        await wallet.openWallet(TestUtils.WALLET_RPC_NAME_2, TestUtils.WALLET_RPC_PW_2);
//        let differentAddress = await wallet.getPrimaryAddress();
//        await wallet.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_RPC_PW_1);
//        try {
//          await wallet.checkReserveProof(differentAddress, "Test message", signature);
//          throw new Error("Should have thrown exception");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -1);
//        }
//        
//        // test subaddress
//        try {
//          await wallet.checkReserveProof((await wallet.getSubaddress(0, 1)).getAddress(), "Test message", signature);
//          throw new Error("Should have thrown exception");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -1);
//        }
//        
//        // test wrong message
//        let check = await wallet.checkReserveProof(await wallet.getPrimaryAddress(), "Wrong message", signature);
//        assert.equal(check.getIsGood(), false); // TODO: specifically test reserve checks, probably separate objects
//        testCheckReserve(check);
//        
//        // test wrong signature
//        try {
//          await wallet.checkReserveProof(await wallet.getPrimaryAddress(), "Test message", "wrong signature");
//          throw new Error("Should have thrown exception");
//        } catch (e) {
//          assert.equal(e.getRpcCode(), -1);
//        }
//      });
      
      it("Can get outputs in hex format", async function() {
        let outputsHex = await wallet.getOutputsHex();
        assert.equal(typeof outputsHex, "string");  // TODO: this will fail if wallet has no outputs; run these tests on new wallet
        assert(outputsHex.length > 0);
      });
      
      it("Can import outputs in hex format", async function() {
        
        // get outputs hex
        let outputsHex = await wallet.getOutputsHex();
        
        // import outputs hex
        if (outputsHex !== undefined) {
          let numImported = await wallet.importOutputsHex(outputsHex);
          assert(numImported > 0);
        }
      });
      
      it("Can get signed key images", async function() {
        let images = await wallet.getKeyImages();
        assert(Array.isArray(images));
        assert(images.length > 0, "No signed key images in wallet");
        for (let image of images) {
          assert(image.getHex());
          assert(image.getSignature());
        }
      });
      
      it("Can get new key images from the last import", async function() {
        
        // get outputs hex
        // TODO: these are already known to the wallet, so no new key images will be imported
        let outputsHex = await wallet.getOutputsHex();
        
        // import outputs hex
        if (outputsHex !== undefined) {
          let numImported = await wallet.importOutputsHex(outputsHex);
          assert(numImported > 0);
        }
        
        // get and test new key images from last import
        let images = await wallet.getNewKeyImagesFromLastImport();
        assert(Array.isArray(images));
        assert(images.length > 0, "No new key images in last import");
        for (let image of images) {
          assert(image.getHex());
          assert(image.getSignature());
        }
      });
      
      it("Can import key images", async function() {
        let images = await wallet.getKeyImages();
        assert(Array.isArray(images));
        assert(images.length > 0, "Wallet does not have any key images; run send tests");
        let result = await wallet.importKeyImages(images);
        assert(result.getHeight() > 0);
        TestUtils.testUnsignedBigInteger(result.getSpent(), true);  // tests assume wallet has spend history and balance
        TestUtils.testUnsignedBigInteger(result.getUnspent(), true);
      });
      
      it("Can sign and verify messages", async function() {
        let msg = "This is a super important message which needs to be signed and verified.";
        let signature = await wallet.sign(msg);
        let verified = await wallet.verify(msg, await wallet.getAddress(0, 0), signature);
        assert.equal(verified, true);
        verified = await wallet.verify(msg, TestMoneroWalletCommon.SAMPLE_ADDRESS, signature);
        assert.equal(verified, false);
      });
      
      it("Can get and set arbitrary key/value attributes", async function() {
        
        // set attributes
        let attrs = {};
        for (let i = 0; i < 5; i++) {
          let key = "attr" + i;
          let val = GenUtils.uuidv4();
          attrs[key] = val;
          await wallet.setAttribute(key, val);
        }
        
        // test attributes
        for (let key of Object.keys(attrs)) {
          assert.equal(attrs[key], await wallet.getAttribute(key));
        }
      });
      
      it("Can convert between a tx send config and payment URI", async function() {
        
        // test with address and amount
        let config1 = new MoneroSendConfig(await wallet.getAddress(0, 0), new BigInteger(0));
        let uri = await wallet.createPaymentUri(config1);
        let config2 = await wallet.parsePaymentUri(uri);
        GenUtils.deleteUndefinedKeys(config1);
        GenUtils.deleteUndefinedKeys(config2);
        assert.deepEqual(config2, config1);
        
        // test with all fields3
        config1.getDestinations()[0].setAmount(new BigInteger("425000000000"));
        config1.setPaymentId("03284e41c342f036");
        config1.setRecipientName("John Doe");
        config1.setNote("OMZG XMR FTW");
        uri = await wallet.createPaymentUri(config1);
        config2 = await wallet.parsePaymentUri(uri);
        GenUtils.deleteUndefinedKeys(config1);
        GenUtils.deleteUndefinedKeys(config2);
        assert.deepEqual(config2, config1);
        
        // test with undefined address
        let address = config1.getDestinations()[0].getAddress();
        config1.getDestinations()[0].setAddress(undefined);
        try {
          await wallet.createPaymentUri(config1);
          fail("Should have thrown RPC exception with invalid parameters");
        } catch (e) {
          assert.equal(e.getRpcCode(), -11);
          assert(e.getRpcMessage().indexOf("Cannot make URI from supplied parameters") >= 0);
        }
        config1.getDestinations()[0].setAddress(address);
        
        // test with invalid payment id
        config1.setPaymentId("bizzup");
        try {
          await wallet.createPaymentUri(config1);
          fail("Should have thrown RPC exception with invalid parameters");
        } catch (e) {
          assert.equal(e.getRpcCode(), -11);
          assert(e.getRpcMessage().indexOf("Cannot make URI from supplied parameters") >= 0);
        }
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
          assert.equal(tx.getOutgoingTransfer().getAccountIndex(), fromAccount.getIndex());
          assert.equal(tx.getOutgoingTransfer().getSubaddressIndex(), 0); // TODO (monero-wallet-rpc): outgoing transactions do not indicate originating subaddresses
          assert(sendAmount.compare(tx.getOutgoingAmount()) === 0);
          
          // test outgoing destinations
          if (tx.getOutgoingTransfer() && tx.getOutgoingTransfer().getDestinations()) {
            assert.equal(tx.getOutgoingTransfer().getDestinations().length, 1);
            for (let destination of tx.getOutgoingTransfer().getDestinations()) {
              assert.equal(destination.getAddress(), address);
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
        assert(accounts.length >= 2, "This test requires at least 2 accounts; run send-to-multiple tests");
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
        assert(hasBalance, "Wallet does not have account with " + (NUM_SUBADDRESSES + 1) + " subaddresses with balances; run send-to-multiple tests");
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
        assert.equal(accountsAfter.length, accounts.length);
        for (let i = 0; i < accounts.length; i++) {
          assert.equal(accountsAfter[i].getSubaddresses().length, accounts[i].getSubaddresses().length);
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
              assert.equal(destination.getAddress(), address);
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
          await testTxWalletSend(tx, config, !canSplit, !canSplit, wallet); // TODO: this code is outdated
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
//          testWalletTx(tx);
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
        assert(balanceAccounts.length >= NUM_ACCOUNTS_TO_SWEEP + 1, "Test requires balance in at least " + (NUM_ACCOUNTS_TO_SWEEP + 1) + " accounts; run send-to-multiple tests");
        assert(unlockedAccounts.length >= NUM_ACCOUNTS_TO_SWEEP + 1, "Wallet is waiting on unlocked funds");
        
        // sweep from first unlocked accounts
        for (let i = 0; i < NUM_ACCOUNTS_TO_SWEEP; i++) {
          
          // sweep unlocked account
          let unlockedAccount = unlockedAccounts[i];
          let txs = await wallet.sweepAccount(unlockedAccount.getIndex(), await wallet.getPrimaryAddress());
          
          // test transactions
          assert(txs.length > 0);
          for (let tx of txs) {
            let config = new MoneroSendConfig(await wallet.getPrimaryAddress());
            config.setAccountIndex(unlockedAccount.getIndex());
            await testWalletTx(tx, {wallet: wallet, sendConfig: config, isSweep: true});
          }
          
          // assert no unlocked funds in account
          let account = await wallet.getAccount(unlockedAccount.getIndex());
          assert.equal(account.getUnlockedBalance().toJSValue(), 0);
        }
        
        // test accounts after sweeping
        let accountsAfter = await wallet.getAccounts(true);
        assert.equal(accountsAfter.length, accounts.length);
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
            assert.equal(accountAfter.getUnlockedBalance().toJSValue(), 0);
          } else {
            assert.equal(accountBefore.getUnlockedBalance().compare(accountAfter.getUnlockedBalance()), 0);
          }
        }
      });
      
//      it("Can sweep the whole wallet", async function() {
//        
//        // sweep destination
//        let destination = await wallet.getPrimaryAddress();
//        
//        // verify 2 accounts with unlocked balance
//        let subaddressesBalance = await getSubaddressesWithBalance(wallet);
//        let subaddressesUnlockedBalance = await getSubaddressesWithUnlockedBalance(wallet);
//        assert(subaddressesBalance.length >= 2, "Test requires multiple accounts with a balance; run send to multiple first");
//        assert(subaddressesUnlockedBalance.length >= 2, "Wallet is waiting on unlocked funds");
//        
//        // sweep
//        let txs = await wallet.sweepWallet(destination);
//        assert(txs.length > 0);
//        for (let tx of txs) {
//          let config = new MoneroSendConfig(destination);
//          config.setAccountIndex(tx.getOutgoingTransfer().getAccountIndex());
//          await testWalletTx(tx, {wallet: wallet, sendConfig: config, isSweep: true});
//        }
//        
//        // assert no unlocked funds across subaddresses
//        subaddressesUnlockedBalance = await getSubaddressesWithUnlockedBalance(wallet);
//        console.log(subaddressesUnlockedBalance);
//        assert(subaddressesUnlockedBalance.length === 0, "Wallet should have no unlocked funds after sweeping all");
//      });
    });
  }
  
  _testNotifications(liteMode) {
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
      
//      if (!liteMode)
//      it("Can update split locked txs sent from/to the same account as blocks are added to the chain", async function() {
//        let sendConfig = new MoneroSendConfig(await wallet.getPrimaryAddress(), TestUtils.MAX_FEE);
//        sendConfig.setAccountIndex(0);
//        sendConfig.setUnlockTime(3);
//        sendConfig.setCanSplit(true);
//        await testSendAndUpdateTxs(sendConfig);
//      });
//      
//      if (!liteMode)
//      it("Can update a locked tx sent from/to different accounts as blocks are added to the chain", async function() {
//        let sendConfig = new MoneroSendConfig((await wallet.getSubaddress(1, 0)).getAddress(), TestUtils.MAX_FEE);
//        sendConfig.setAccountIndex(0);
//        sendConfig.setUnlockTime(3);
//        sendConfig.setCanSplit(false);
//        await testSendAndUpdateTxs(sendConfig);
//      });
//      
//      if (!liteMode)
//      it("Can update a locked tx sent from/to different accounts as blocks are added to the chain", async function() {
//        let sendConfig = new MoneroSendConfig((await wallet.getSubaddress(1, 0)).getAddress(), TestUtils.MAX_FEE);
//        sendConfig.setAccountIndex(0);
//        sendConfig.setUnlockTime(3);
//        sendConfig.setCanSplit(true);
//        await testSendAndUpdateTxs(sendConfig);
//      });
      
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
          assert.equal(tx.getIsConfirmed(), false);
          assert.equal(tx.getInTxPool(), true);
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
          let fetchedTxs = await testGetTxs(wallet, filter, true);
          
          // test fetched txs
          await testOutInPairs(wallet, fetchedTxs, sendConfig);

          // merge fetched txs into updated txs and original sent txs
          for (let fetchedTx of fetchedTxs) {
            
            // merge with updated txs
            if (updatedTxs === undefined) updatedTxs = fetchedTxs;
            else {
              for (let updatedTx of updatedTxs) {
                if (fetchedTx.getId() !== updatedTx.getId()) continue;
                if (!!fetchedTx.getOutgoingTransfer() !== !!updatedTx.getOutgoingTransfer()) continue;  // skip if directions are different
                updatedTx.merge(fetchedTx.copy());
              }
            }
            
            // merge with original sent txs
            for (let sentTx of sentTxs) {
              if (fetchedTx.getId() !== sentTx.getId()) continue;
              if (!!fetchedTx.getOutgoingTransfer() !== !!sentTx.getOutgoingTransfer()) continue; // skip if directions are different
              sentTx.merge(fetchedTx.copy());  // TODO: it's mergeable but tests don't account for extra info from send (e.g. hex) so not tested; could specify in test config
            }
          }
          
          // test updated txs
          await testOutInPairs(wallet, updatedTxs, sendConfig);
          
          // update confirmations in order to exit loop
          numConfirmations = fetchedTxs[0].getConfirmationCount();
        }
      }
      
      async function testOutInPairs(wallet, txs, sendConfig) {
        
        // for each out tx
        let txOut;
        for (let tx of txs) {
          await testUnlockTx(wallet, tx, sendConfig);
          if (!tx.getOutgoingTransfer()) continue;
          let txOut = tx;
          
          // find incoming counterpart
          let txIn;
          for (let tx2 of txs) {
            if (tx2.getIncomingTransfers() && tx.getId() === tx2.getId()) {
              txIn = tx2;
              break;
            }
          }
          
          // test out / in pair
          // TODO monero-wallet-rpc: incoming txs occluded by their outgoing counterpart #4500
          if (!txIn) {
            console.log("WARNING: outgoing tx " + txOut.getId() + " missing incoming counterpart (issue #4500)");
          } else {
            await testOutInPair(txOut, txIn);
          }
        }
      }
      
      async function testOutInPair(txOut, txIn) {
        assert.equal(txIn.getIsConfirmed(), txOut.getIsConfirmed());
        assert.equal(txOut.getOutgoingAmount().compare(txIn.getIncomingAmount()), 0);
      }
      
      async function testUnlockTx(wallet, tx, sendConfig) {
        try {
          await testWalletTx(tx, {wallet: wallet});
        } catch (e) {
          console.log(tx.toString());
          throw e;
        }
        assert.equal(tx.getUnlockTime(), sendConfig.getUnlockTime()); // TODO: send config as part of test, then this fn not necessary
      }
    });
  }
}

// sample address to be used in tests
// TODO: this is hardcoded to stagenet so some tests will fail if tested against non-stagenet
TestMoneroWalletCommon.SAMPLE_ADDRESS = "58bf9MfrBNDXSqCzK6snxSXaJHehLTnvx3BdS6qMkYAsW8P5kvRVq8ePbGQ7mfAeYfC7QELPhpQBe2C9bqCrqeesUsifaWw";

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
      assert.equal(account.getSubaddresses()[i].getAccountIndex(), account.getIndex());
      assert.equal(account.getSubaddresses()[i].getSubaddressIndex(), i);
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
 * Fetchs and tests transactions according to the given config.
 * 
 * TODO: convert config to filter and ensure each tx passes filter, same with testGetTransfer and testGetVouts
 */
async function testGetTxs(wallet, config, isExpected) {
  let txs = await wallet.getTxs(config);
  assert(Array.isArray(txs));
  if (isExpected === false) assert.equal(txs.length, 0);
  if (isExpected === true) assert(txs.length > 0);
  for (let tx of txs) await testWalletTx(tx, Object.assign({wallet: wallet}, config));
  return txs;
}

/**
 * Fetchs and tests transfers according to the given config.
 */
async function testGetTransfers(wallet, config, isExpected) {
  let transfers = await wallet.getTransfers(config);
  assert(Array.isArray(transfers));
  if (isExpected === false) assert.equal(transfers.length, 0);
  if (isExpected === true) assert(transfers.length > 0);
  for (let transfer of transfers) await testWalletTx(transfer.getTx(), Object.assign({wallet: wallet}, config));
  return transfers;
}

/**
 * Fetchs and tests vouts according to the given config.
 */
async function testGetVouts(wallet, config, isExpected) {
  let vouts = await wallet.getVouts(config);
  assert(Array.isArray(vouts));
  if (isExpected === false) assert.equal(vouts.length, 0);
  if (isExpected === true) assert(vouts.length > 0);
  for (let vout of vouts) await testVout(vout, Object.assign({wallet: wallet}, config));
  return vouts;
}

/**
 * Gets random transactions.
 * 
 * @param wallet is the wallet to query for transactions
 * @param config configures the transactions to retrieve
 * @param minTxs specifies the minimum number of transactions (undefined for no minimum)
 * @param maxTxs specifies the maximum number of transactions (undefined for all filtered transactions)
 * @return {MoneroTx[]} are the random transactions
 */
async function getRandomTransactions(wallet, config, minTxs, maxTxs) {
  let txs = await wallet.getTxs(config);
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
 *        testConfig.getVouts specifies if vouts were fetched and should therefore be expected with incoming transfers
 *        testConfig.isRelayResponse specifies if tx is a fresh relay response which is missing some fields (e.g. key)
 */
async function testWalletTx(tx, testConfig) {
  
  // validate / sanitize inputs
  testConfig = Object.assign({}, testConfig);
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
    assert.equal(tx.getIsRelayed(), true);
    assert.equal(tx.getIsFailed(), false);
    assert.equal(tx.getInTxPool(), false);
    assert.equal(tx.getDoNotRelay(), false);
    assert(tx.getHeight() >= 0);
    assert(tx.getConfirmationCount() > 0);
    assert(tx.getBlockTimestamp() > 0);
    assert.equal(tx.getIsDoubleSpend(), false);
  } else {
    assert.equal(tx.getHeight(), undefined);
    assert.equal(tx.getConfirmationCount(), 0);
    assert.equal(tx.getBlockTimestamp(), undefined);
  }
  
  // test in tx pool
  if (tx.getInTxPool()) {
    assert.equal(tx.getIsConfirmed(), false);
    assert.equal(tx.getDoNotRelay(), false);
    assert.equal(tx.getIsRelayed(), true);
    assert.equal(tx.getIsDoubleSpend(), false); // TODO: test double spend attempt
    assert.equal(tx.getLastFailedHeight(), undefined);
    assert.equal(tx.getLastFailedId(), undefined);
    
    // these should be initialized unless freshly sent
    if (!testConfig.sendConfig) {
      assert(tx.getReceivedTime() > 0);
      tx.getEstimatedBlockCountUntilConfirmed() > 0
    }
  } else {
    assert.equal(tx.getEstimatedBlockCountUntilConfirmed(), undefined);
    assert.equal(tx.getLastRelayedTime(), undefined);
  }
  
  // test outgoing transfer per configuration
  if (testConfig.hasOutgoingTransfer === false) assert(tx.getOutgoingTransfer() === undefined);
  if (testConfig.hasDestinations) assert(tx.getOutgoingTransfer() && tx.getOutgoingTransfer().getDestionations().length > 0);
  
  // test outgoing transfer
  if (tx.getOutgoingTransfer()) {
    testTransfer(tx.getOutgoingTransfer());
    if (testConfig.isSweep) assert.equal(tx.getOutgoingTransfer().getDestinations().length, 1);
    
    // TODO: handle special cases
  } else {
    assert(tx.getIncomingTransfers().length > 0);
    assert.equal(tx.getOutgoingAmount(), undefined);
    assert.equal(tx.getOutgoingTransfer(), undefined);
    assert.equal(tx.getMixin(), undefined);
    assert.equal(tx.getHex(), undefined);
    assert.equal(tx.getMetadata(), undefined);
    assert.equal(tx.getKey(), undefined);
  }
  
  // test incoming transfers
  if (tx.getIncomingTransfers()) {
    assert(tx.getIncomingTransfers().length > 0);
    TestUtils.testUnsignedBigInteger(tx.getIncomingAmount());      
    assert.equal(tx.getIsFailed(), false);
    
    // test each transfer and collect transfer sum
    let transferSum = new BigInteger(0);
    for (let transfer of tx.getIncomingTransfers()) {
      testTransfer(transfer);
      assert(transfer.getAddress());
      assert(transfer.getAccountIndex() >= 0);
      assert(transfer.getSubaddressIndex() >= 0);
      transferSum = transferSum.add(transfer.getAmount());
      if (testConfig.wallet) assert.equal(transfer.getSubaddressIndex()), transfer.getAddress(), await testConfig.wallet.getAddress(transfer.getAccountIndex());
      
      // TODO special case: transfer amount of 0
    }
    
    // incoming transfers add up to incoming tx amount
    assert.equal(transferSum.compare(tx.getIncomingAmount()), 0);
  } else {
    assert(tx.getOutgoingTransfer());
    assert.equal(tx.getIncomingAmount(), undefined);
    assert.equal(tx.getIncomingTransfers(), undefined);
  }
  
  // test coinbase tx
  if (tx.getIsCoinbase()) {
    assert.equal(tx.getFee().compare(new BigInteger(0)), 0);
    assert(tx.getIncomingTransfers().length > 0);
  }
  
  // test failed  // TODO: what else to test associated with failed
  if (tx.getIsFailed()) {
    assert(tx.getOutgoingTransfer() instanceof MoneroTransfer);
    assert(tx.getReceivedTime() > 0)
  } else {
    if (tx.getIsRelayed()) assert.equal(tx.getIsDoubleSpend(), false);
    else {
      assert.equal(tx.getIsRelayed(), false);
      assert.equal(tx.getDoNotRelay(), true);
      assert.equal(tx.getIsDoubleSpend(), undefined);
    }
  }
  assert.equal(tx.getLastFailedHeight(), undefined);
  assert.equal(tx.getLastFailedId(), undefined);
  
  // received time only for tx pool or failed txs
  if (tx.getReceivedTime() !== undefined) {
    assert(tx.getInTxPool() || tx.getIsFailed());
  }
  
  // test relayed tx
  if (tx.getIsRelayed()) assert.equal(tx.getDoNotRelay(), false);
  if (tx.getDoNotRelay()) assert(!tx.getIsRelayed());
  
  // test tx result from send(), sendSplit(), or relayTxs()
  if (testConfig.sendConfig) {
    
    // test common attributes
    let sendConfig = testConfig.sendConfig;
    assert.equal(tx.getIsConfirmed(), false);
    testTransfer(tx.getOutgoingTransfer());
    assert.equal(tx.getMixin(), sendConfig.getMixin());
    assert.equal(tx.getUnlockTime(), sendConfig.getUnlockTime() ? sendConfig.getUnlockTime() : 0);
    assert.equal(tx.getBlockTimestamp(), undefined);
    if (sendConfig.getCanSplit()) assert.equal(tx.getKey(), undefined); // TODO monero-wallet-rpc: key only known on `transfer` response
    else assert(tx.getKey().length > 0);
    assert.equal(typeof tx.getHex(), "string");
    assert(tx.getHex().length > 0);
    assert(tx.getMetadata());
    assert.equal(tx.getReceivedTime(), undefined);
    if (testConfig.isRelayResponse) assert.equal(sendConfig.getDoNotRelay(), true);
    
    // test destinations of sent tx
    assert.equal(tx.getOutgoingTransfer().getDestinations().length, sendConfig.getDestinations().length);
    for (let i = 0; i < sendConfig.getDestinations().length; i++) {
      assert.equal(tx.getOutgoingTransfer().getDestinations()[i].getAddress(), sendConfig.getDestinations()[i].getAddress());
      if (testConfig.isSweep) {
        assert.equal(sendConfig.getDestinations().length, 1);
        assert.equal(sendConfig.getDestinations()[i].getAmount(), undefined);
        assert.equal(tx.getOutgoingTransfer().getDestinations()[i].getAmount().toString(), tx.getOutgoingTransfer().getAmount().toString());
      } else {
        assert.equal(tx.getOutgoingTransfer().getDestinations()[i].getAmount().toString(), sendConfig.getDestinations()[i].getAmount().toString());
      }
    }
    
    // test relayed txs
    if (testConfig.isRelayResponse || !sendConfig.getDoNotRelay()) {
      assert.equal(tx.getInTxPool(), true);
      assert.equal(tx.getDoNotRelay(), false);
      assert.equal(tx.getIsRelayed(), true);
      assert(tx.getLastRelayedTime() > 0);
      assert.equal(tx.getIsDoubleSpend(), false);
    }
    
    // test non-relayed txs
    else {
      assert.equal(tx.getInTxPool(), false);
      assert.equal(tx.getDoNotRelay(), true);
      assert.equal(tx.getIsRelayed(), false);
      assert.equal(tx.getLastRelayedTime(), undefined);
      assert.equal(tx.getIsDoubleSpend(), undefined);
    }
  } else {
    assert.equal(tx.getMixin(), undefined);
    assert.equal(tx.getKey(), undefined);
    assert.equal(tx.getHex(), undefined);
    assert.equal(tx.getMetadata(), undefined);
    assert.equal(tx.getLastRelayedTime(), undefined);
  }
  
  // test vouts
  if (tx.getIncomingTransfers() && tx.getIsConfirmed() && testConfig.getVouts) assert(tx.getVouts().length > 0);
  if (tx.getVouts()) tx.getVouts().map(vout => testVout(vout));
  
  // test deep copy
  if (!testConfig.doNotTestCopy) await testWalletTxCopy(tx, testConfig);
}

/**
 * Tests that common tx field types are valid regardless of tx state.
 * 
 * @param tx is the tx to test
 */
function testWalletTxTypes(tx) {
  assert.equal(typeof tx.getId(), "string");
  assert.equal(typeof tx.getIsConfirmed(), "boolean");
  assert.equal(typeof tx.getIsCoinbase(), "boolean");
  assert.equal(typeof tx.getIsFailed(), "boolean");
  assert.equal(typeof tx.getIsRelayed(), "boolean");
  assert.equal(typeof tx.getInTxPool(), "boolean");
  TestUtils.testUnsignedBigInteger(tx.getFee());
  assert.equal(tx.getVins(), undefined);  // TODO no way to expose vins?
  if (tx.getPaymentId()) assert.notEqual(tx.getPaymentId(), MoneroTx.DEFAULT_PAYMENT_ID); // default payment id converted to undefined
  if (tx.getNote()) assert(tx.getNote().length > 0);  // empty notes converted to undefined
  assert(tx.getUnlockTime() >= 0);
  assert.equal(tx.getSize(), undefined);   // TODO (monero-wallet-rpc): add tx_size to get_transfers and get_transfer_by_txid
  assert.equal(tx.getWeight(), undefined);
}

// TODO: test uncommon references
async function testWalletTxCopy(tx, testConfig) {
  
  // copy tx and assert deep equality
  let copy = tx.copy();
  assert(copy instanceof MoneroWalletTx);
  assert.deepEqual(copy, tx);
  
  // test different references
  if (tx.getOutgoingTransfer()) {
    assert(tx.getOutgoingTransfer() !== copy.getOutgoingTransfer());
    assert(tx.getOutgoingTransfer().getTx() !== copy.getOutgoingTransfer().getTx());
    //assert(tx.getOutgoingTransfer().getAmount() !== copy.getOutgoingTransfer().getAmount());  // TODO: BI 0 === BI 0?, testing this instead:
    if (tx.getOutgoingTransfer().getAmount() == copy.getOutgoingTransfer().getAmount()) assert(tx.getOutgoingTransfer().getAmount() === new BigInteger(0));
    if (tx.getOutgoingTransfer().getDestinations()) {
      assert(tx.getOutgoingTransfer().getDestinations() !== copy.getOutgoingTransfer().getDestinations());
      for (let i = 0; i < tx.getOutgoingTransfer().getDestinations().length; i++) {
        assert.deepEqual(copy.getOutgoingTransfer().getDestinations()[i], tx.getOutgoingTransfer().getDestinations()[i]);
        assert(tx.getOutgoingTransfer().getDestinations()[i] !== copy.getOutgoingTransfer().getDestinations()[i]);
      }
    }
  }
  if (tx.getIncomingTransfers()) {
    for (let i = 0; i < tx.getIncomingTransfers().length; i++) {
      assert.deepEqual(copy.getIncomingTransfers()[i], tx.getIncomingTransfers()[i]);
      assert(tx.getIncomingTransfers()[i] !== copy.getIncomingTransfers()[i]);
    }
  }
  
  // test copied tx
  testConfig = Object.assign({}, testConfig);
  testConfig.doNotTestCopy = true;
  await testWalletTx(copy, testConfig);
  
  // test merging with copy
  let merged = copy.merge(copy.copy());
  assert.equal(merged.toString(), tx.toString()); // TODO: not deepEqual() because merges create undefineds; remove pre or post api
}

function testTransfer(transfer) {
  assert(transfer instanceof MoneroTransfer);
  TestUtils.testUnsignedBigInteger(transfer.getAmount());
  
  // transfer and tx reference each other
  assert(transfer.getTx() instanceof MoneroWalletTx);
  if (transfer.getTx().getOutgoingTransfer() !== transfer) {
    let found = false;
    assert(transfer.getTx().getIncomingTransfers());
    for (let inTransfer of transfer.getTx().getIncomingTransfers()) {
      if (inTransfer === transfer) {
        found = true;
        break;
      }
    }
    assert(found, "Transaction does not reference given transfer");
  }
  
  // test destinations sum to outgoing amount
  if (transfer.getDestinations()) {
    assert(transfer.getDestinations().length > 0);
    assert.equal(transfer.getIsOutgoing(), true);
    let sum = new BigInteger(0);
    for (let destination of transfer.getDestinations()) {
      assert(destination.getAddress());
      TestUtils.testUnsignedBigInteger(destination.getAmount(), true);
      sum = sum.add(destination.getAmount());
    }
    try {
      assert.equal(sum.toString(), transfer.getAmount().toString());
    } catch (e) {
      console.log(transfer.getTx().toString());
      throw e;
    }
  }
  
  // transfer is outgoing xor incoming
  assert((transfer.getIsOutgoing() === true && transfer.getIsIncoming() === false) || (transfer.getIsOutgoing() === false && transfer.getIsIncoming() === true));
}

function testVout(vout) {
  assert(vout);
  assert(vout instanceof MoneroWalletOutput);
  assert(vout.getAccountIndex() >= 0);
  assert(vout.getSubaddressIndex() >= 0);
  assert(vout.getIndex() >= 0);
  assert.equal(typeof vout.getIsSpent(), "boolean");
  assert(vout.getKeyImage());
  TestUtils.testUnsignedBigInteger(vout.getAmount(), true);
  
  // vout has circular reference to its transaction which has some initialized fields
  let tx = vout.getTx();
  assert(tx);
  assert(tx instanceof MoneroWalletTx);
  assert(tx.getVouts().includes(vout));
  assert(tx.getId());
  assert.equal(tx.getIsConfirmed(), true);  // TODO monero-wallet-rpc: possible to get unconfirmed vouts?
  assert.equal(tx.getIsRelayed(), true);
  assert.equal(tx.getIsFailed(), false);
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
  if (!hasSigned && !hasUnsigned && !hasMultisig) assert.equal(sets, undefined);
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
  assert.equal(typeof check.getIsGood(), "boolean");
  if (check.getIsGood()) {
    assert(check.getConfirmationCount() >= 0);
    assert.equal(typeof check.getInTxPool(), "boolean");
    TestUtils.testUnsignedBigInteger(check.getAmountReceived());
    if (check.getInTxPool()) assert.equal(0, check.getConfirmationCount());
    else assert(check.getConfirmationCount() > 0); // TODO (monero-wall-rpc) this fails (confirmations is 0) for (at least one) transaction that has 1 confirmation on testCheckTxKey()
  } else {
    assert.equal(check.getConfirmationCount(), undefined);
    assert.equal(check.getInTxPool(), undefined);
    assert.equal(check.getAmountReceived(), undefined);
  }
}

function testCheckReserve(check) {
  assert.equal(typeof check.getIsGood(), "boolean");
  if (check.getIsGood()) {
    TestUtils.testUnsignedBigInteger(check.getAmountSpent());
    assert.equal(check.getAmountSpent().toString(), "0");  // TODO sometimes see non-zero, seg fault after sweep and send tests
    TestUtils.testUnsignedBigInteger(check.getAmountTotal());
    assert(check.getAmountTotal().compare(new BigInteger(0)) >= 0);
  } else {
    assert.equal(check.getAmountSpent(), undefined);
    assert.equal(check.getAmountTotal(), undefined);
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