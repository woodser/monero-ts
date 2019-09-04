const MoneroDaemon = require("../main/daemon/MoneroDaemon");
const MoneroWallet = require("../main/wallet/MoneroWallet")

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
  constructor(daemon) {
    assert(daemon instanceof MoneroDaemon);
    this.daemon = daemon;
    TestUtils.TX_POOL_WALLET_TRACKER.reset(); // all wallets need to wait for txs to confirm to reliably sync
  }
  
  /**
   * Get the daemon to test.
   * 
   * @return the daemon to test
   */
  getTestDaemon() {
    return TestUtils.getDaemonRpc();
  }
  
  /**
   * Get the main wallet to test.
   * 
   * @return the wallet to test
   */
  async getTestWallet() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Create and open a random test wallet.
   * 
   * @return the random test wallet
   */
  async createRandomWallet() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Open a test wallet.
   * 
   * @param path identifies the test wallet to open
   * @return MoneroWallet returns a reference to the opened wallet
   */
  async openWallet(path) {
    throw new Error("Subclass must implement");
  }
  
  runCommonTests(config) {
    let that = this;
    let daemon = this.daemon;
    describe("Common Wallet Tests" + (config.liteMode ? " (lite mode)" : ""), function() {
      
      //  --------------------------- TEST NON RELAYS -------------------------
      
   		// local tx cache for tests
      let txCache;
      async function getCachedTxs() {
        if (txCache !== undefined) return txCache;
        txCache = await that.wallet.getTxs();
        testGetTxsStructure(txCache);
        return txCache;
      }
      
      it("Can get the wallet's path", async function() {
        
        // create a random wallet
        let wallet = await that.createRandomWallet();
        
        // set a random attribute
        let uuid = GenUtils.uuidv4();
        await that.wallet.setAttribute("uuid", uuid);
        
        // record the wallet's path then save and close
        let path = await that.wallet.getPath();
        await that.wallet.close(true);
        
        // re-open the wallet using its path
        wallet = await that.openWallet(path);
        
        // test the attribute
        assert.equal(await that.wallet.getAttribute("uuid"), uuid);
        
        // re-open main test wallet
        await that.wallet.close();
        await that.getTestWallet();
      });
      
      if (config.testNonRelays)
      it("Can get the mnemonic phrase derived from the seed", async function() {
        let mnemonic = await that.wallet.getMnemonic();
        MoneroUtils.validateMnemonic(mnemonic);
        assert.equal(mnemonic, TestUtils.MNEMONIC);
      });
      
      if (config.testNonRelays)
      it("Can get a list of supported languages for the mnemonic phrase", async function() {
        let languages = await that.wallet.getLanguages();
        assert(Array.isArray(languages));
        assert(languages.length);
        for (let language of languages) assert(language);
      });
      
      if (config.testNonRelays)
      it("Can get the private view key", async function() {
        let privateViewKey = await that.wallet.getPrivateViewKey()
        MoneroUtils.validatePrivateViewKey(privateViewKey);
      });
      
      if (config.testNonRelays)
      it("Can get the private spend key", async function() {
        let privateSpendKey = await that.wallet.getPrivateSpendKey()
        MoneroUtils.validatePrivateSpendKey(privateSpendKey);
      });
      
      if (config.testNonRelays)
      it("Can get the primary address", async function() {
        let primaryAddress = await that.wallet.getPrimaryAddress();
        MoneroUtils.validateAddress(primaryAddress);
        assert.equal(primaryAddress, (await that.wallet.getSubaddress(0, 0)).getAddress());
      });
      
      if (config.testNonRelays)
      it("Can get the address of a subaddress at a specified account and subaddress index", async function() {
        assert.equal((await that.wallet.getSubaddress(0, 0)).getAddress(), await that.wallet.getPrimaryAddress());
        for (let account of await that.wallet.getAccounts(true)) {
          for (let subaddress of account.getSubaddresses()) {
            assert.equal(await that.wallet.getAddress(account.getIndex(), subaddress.getIndex()), subaddress.getAddress());
          }
        }
      });
      
      if (config.testNonRelays)
      it("Can get addresses out of range of used accounts and subaddresses", async function() {
        await that._testGetSubaddressAddressOutOfRange();
      });
      
      if (config.testNonRelays)
      it("Can get the account and subaddress indices of an address", async function() {
        
        // get last subaddress to test
        let accounts = await that.wallet.getAccounts(true);
        let accountIdx = accounts.length - 1;
        let subaddressIdx = accounts[accountIdx].getSubaddresses().length - 1;
        let address = await that.wallet.getAddress(accountIdx, subaddressIdx);
        assert(address);
        assert.equal(typeof address, "string");
        
        // get address index
        let subaddress = await that.wallet.getAddressIndex(address);
        assert.equal(subaddress.getAccountIndex(), accountIdx);
        assert.equal(subaddress.getIndex(), subaddressIdx);

        // test valid but unfound address
        let nonWalletAddress = await TestUtils.getRandomWalletAddress();
        try {
          subaddress = await that.wallet.getAddressIndex(nonWalletAddress);
          throw new Error("fail");
        } catch (e) {
          assert.equal("Address doesn't belong to the wallet", e.message);
        }
        
        // test invalid address
        try {
          subaddress = await that.wallet.getAddressIndex("this is definitely not an address");
          throw new Error("fail");
        } catch (e) {
          assert.equal("Invalid address", e.message);
        }
      });
      
      if (config.testNonRelays)
      it("Can get an integrated address given a payment id", async function() {
        
        // save address for later comparison
        let address = (await that.wallet.getSubaddress(0, 0)).getAddress();
        
        // test valid payment id
        let paymentId = "03284e41c342f036";
        let integratedAddress = await that.wallet.getIntegratedAddress(paymentId);
        assert.equal(integratedAddress.getStandardAddress(), address);
        assert.equal(integratedAddress.getPaymentId(), paymentId);
        
        // test invalid payment id
        let invalidPaymentId = "invalid_payment_id_123456";
        try {
          integratedAddress = await that.wallet.getIntegratedAddress(invalidPaymentId);
          throw new Error("Getting integrated address with invalid payment id " + invalidPaymentId + " should have thrown a RPC exception");
        } catch (e) {
          //assert.equal(e.getCode(), -5);  // TODO: error codes part of rpc only?
          assert.equal(e.message, "Invalid payment ID: " + invalidPaymentId);
        }
        
        // test undefined payment id which generates a new one
        integratedAddress = await that.wallet.getIntegratedAddress(undefined);
        assert.equal(integratedAddress.getStandardAddress(), address);
        assert(integratedAddress.getPaymentId().length);
      });
      
      it("Can decode an integrated address", async function() {
        let integratedAddress = await that.wallet.getIntegratedAddress("03284e41c342f036");
        let decodedAddress = await that.wallet.decodeIntegratedAddress(integratedAddress.toString());
        assert.deepEqual(decodedAddress, integratedAddress);
      });
      
      // TODO: test syncing from start height
      if (config.testNonRelays)
      it("Can sync (without progress)", async function() {
        let numBlocks = 100;
        let chainHeight = await daemon.getHeight();
        assert(chainHeight >= numBlocks);
        let result = await that.wallet.sync(chainHeight - numBlocks);  // sync to end of chain
        assert(result instanceof MoneroSyncResult);
        assert(result.getNumBlocksFetched() >= 0);
        assert.equal(typeof result.getReceivedMoney(), "boolean");
      });
      
      if (config.testNonRelays)
      it("Can get the current height that the wallet is synchronized to", async function() {
        let height = await that.wallet.getHeight();
        assert(height >= 0);
      });
      
      if (config.testNonRelays)
      it("Can get the locked and unlocked balances of the wallet, accounts, and subaddresses", async function() {
        
        // fetch accounts with all info as reference
        let accounts = await that.wallet.getAccounts(true);
        
        // test that balances add up between accounts and wallet
        let accountsBalance = new BigInteger(0);
        let accountsUnlockedBalance = new BigInteger(0);
        for (let account of accounts) {
          accountsBalance = accountsBalance.add(account.getBalance());
          accountsUnlockedBalance = accountsUnlockedBalance.add(account.getUnlockedBalance());
          
          // test that balances add up between subaddresses and accounts
          let subaddressesBalance = new BigInteger(0);
          let subaddressesUnlockedBalance = new BigInteger(0);
          for (let subaddress of account.getSubaddresses()) {
            subaddressesBalance = subaddressesBalance.add(subaddress.getBalance());
            subaddressesUnlockedBalance = subaddressesUnlockedBalance.add(subaddress.getUnlockedBalance());
            
            // test that balances are consistent with getAccounts() call
            assert.equal((await that.wallet.getBalance(subaddress.getAccountIndex(), subaddress.getIndex())).toString(), subaddress.getBalance().toString());
            assert.equal((await that.wallet.getUnlockedBalance(subaddress.getAccountIndex(), subaddress.getIndex())).toString(), subaddress.getUnlockedBalance().toString());
          }
          assert.equal((await that.wallet.getBalance(account.getIndex())).toString(), subaddressesBalance.toString());
          assert.equal((await that.wallet.getUnlockedBalance(account.getIndex())).toString(), subaddressesUnlockedBalance.toString());
        }
        TestUtils.testUnsignedBigInteger(accountsBalance);
        TestUtils.testUnsignedBigInteger(accountsUnlockedBalance);
        assert.equal((await that.wallet.getBalance()).toString(), accountsBalance.toString());
        assert.equal((await that.wallet.getUnlockedBalance()).toString(), accountsUnlockedBalance.toString());
        
        // test invalid input
        try {
          await that.wallet.getBalance(undefined, 0);
          throw new Error("Should have failed");
        } catch(e) {
          assert.notEqual("Should have failed", e.message);
        }
      });
      
      if (config.testNonRelays)
      it("Can get accounts without subaddresses", async function() {
        let accounts = await that.wallet.getAccounts();
        assert(accounts.length > 0);
        accounts.map(account => {
          testAccount(account)
          assert(account.getSubaddresses() === undefined);
        });
      });
      
      if (config.testNonRelays)
      it("Can get accounts with subaddresses", async function() {
        let accounts = await that.wallet.getAccounts(true);
        assert(accounts.length > 0);
        accounts.map(account => {
          testAccount(account);
          assert(account.getSubaddresses().length > 0);
        });
      });
      
      if (config.testNonRelays)
      it("Can get an account at a specified index", async function() {
        let accounts = await that.wallet.getAccounts();
        assert(accounts.length > 0);
        for (let account of accounts) {
          testAccount(account);
          
          // test without subaddresses
          let retrieved = await that.wallet.getAccount(account.getIndex());
          assert(retrieved.getSubaddresses() === undefined);
          
          // test with subaddresses
          retrieved = await that.wallet.getAccount(account.getIndex(), true);
          assert(retrieved.getSubaddresses().length > 0);
        }
      });
      
      if (config.testNonRelays)
      it("Can create a new account without a label", async function() {
        let accountsBefore = await that.wallet.getAccounts();
        let createdAccount = await that.wallet.createAccount();
        testAccount(createdAccount);
        assert.equal((await that.wallet.getAccounts()).length - 1, accountsBefore.length);
      });
      
      if (config.testNonRelays)
      it("Can create a new account with a label", async function() {
        
        // create account with label
        let accountsBefore = await that.wallet.getAccounts();
        let label = GenUtils.uuidv4();
        let createdAccount = await that.wallet.createAccount(label);
        testAccount(createdAccount);
        assert.equal((await that.wallet.getAccounts()).length - 1, accountsBefore.length);
        assert.equal((await that.wallet.getSubaddress(createdAccount.getIndex(), 0)).getLabel(), label);
        
        // fetch and test account
        createdAccount = await that.wallet.getAccount(createdAccount.getIndex());
        testAccount(createdAccount);
        
        // create account with same label
        createdAccount = await that.wallet.createAccount(label);
        testAccount(createdAccount);
        assert.equal((await that.wallet.getAccounts()).length - 2, accountsBefore.length);
        assert.equal((await that.wallet.getSubaddress(createdAccount.getIndex(), 0)).getLabel(), label);
        
        // fetch and test account
        createdAccount = await that.wallet.getAccount(createdAccount.getIndex());
        testAccount(createdAccount);
      });
      
      if (config.testNonRelays)
      it("Can get subaddresses at a specified account index", async function() {
        let accounts = await that.wallet.getAccounts();
        assert(accounts.length > 0);
        for (let account of accounts) {
          let subaddresses = await that.wallet.getSubaddresses(account.getIndex());
          assert(subaddresses.length > 0);
          subaddresses.map(subaddress => {
            testSubaddress(subaddress);
            assert(account.getIndex() === subaddress.getAccountIndex());
          });
        }
      });
      
      if (config.testNonRelays)
      it("Can get subaddresses at specified account and subaddress indices", async function() {
        let accounts = await that.wallet.getAccounts();
        assert(accounts.length > 0);
        for (let account of accounts) {
          
          // get subaddresses
          let subaddresses = await that.wallet.getSubaddresses(account.getIndex());
          assert(subaddresses.length > 0);
          
          // remove a subaddress for query if possible
          if (subaddresses.length > 1) subaddresses.splice(0, 1);
          
          // get subaddress indices
          let subaddressIndices = subaddresses.map(subaddress => subaddress.getIndex());
          assert(subaddressIndices.length > 0);
          
          // fetch subaddresses by indices
          let fetchedSubaddresses = await that.wallet.getSubaddresses(account.getIndex(), subaddressIndices);
          
          // original subaddresses (minus one removed if applicable) is equal to fetched subaddresses
          assert.deepEqual(fetchedSubaddresses, subaddresses);
        }
      });
      
      if (config.testNonRelays)
      it("Can get a subaddress at a specified account and subaddress index", async function() {
        let accounts = await that.wallet.getAccounts();
        assert(accounts.length > 0);
        for (let account of accounts) {
          let subaddresses = await that.wallet.getSubaddresses(account.getIndex());
          assert(subaddresses.length > 0);
          for (let subaddress of subaddresses) {
            assert.deepEqual(await that.wallet.getSubaddress(account.getIndex(), subaddress.getIndex()), subaddress);
            assert.deepEqual((await that.wallet.getSubaddresses(account.getIndex(), subaddress.getIndex()))[0], subaddress); // test plural call with single subaddr number
          }
        }
      });
      
      if (config.testNonRelays)
      it("Can create a subaddress with and without a label", async function() {
        
        // create subaddresses across accounts
        let accounts = await that.wallet.getAccounts();
        if (accounts.length < 2) await that.wallet.createAccount();
        accounts = await that.wallet.getAccounts();
        assert(accounts.length > 1);
        for (let accountIdx = 0; accountIdx < 2; accountIdx++) {
          
          // create subaddress with no label
          let subaddresses = await that.wallet.getSubaddresses(accountIdx);
          let subaddress = await that.wallet.createSubaddress(accountIdx);
          assert.equal(subaddress.getLabel(), undefined);
          testSubaddress(subaddress);
          let subaddressesNew = await that.wallet.getSubaddresses(accountIdx);
          assert.equal(subaddressesNew.length - 1, subaddresses.length);
          assert.deepEqual(subaddressesNew[subaddressesNew.length - 1].toString(), subaddress.toString());
          
          // create subaddress with label
          subaddresses = await that.wallet.getSubaddresses(accountIdx);
          let uuid = GenUtils.uuidv4();
          subaddress = await that.wallet.createSubaddress(accountIdx, uuid);
          assert.equal(uuid, subaddress.getLabel());
          testSubaddress(subaddress);
          subaddressesNew = await that.wallet.getSubaddresses(accountIdx);
          assert.equal(subaddressesNew.length - 1, subaddresses.length);
          assert.deepEqual(subaddressesNew[subaddressesNew.length - 1].toString(), subaddress.toString());
        }
      });
      
      if (config.testNonRelays)
      it("Can get transactions in the wallet", async function() {
        let nonDefaultIncoming = false;
        let txs1 = await getCachedTxs();
        let txs2 = await that._getAndTestTxs(that.wallet, undefined, true);
        assert.equal(txs2.length, txs1.length);
        assert(txs1.length > 0, "Wallet has no txs to test");
        assert.equal(txs1[0].getHeight(), TestUtils.FIRST_RECEIVE_HEIGHT, "First tx's restore height must match the restore height in TestUtils");
        
        // test each tranasction
        let blocksPerHeight = {};
        for (let i = 0; i < txs1.length; i++) {
          await that._testTxWallet(txs1[i], {wallet: that.wallet});
          await that._testTxWallet(txs2[i], {wallet: that.wallet});
          assert.equal(txs1[i].toString(), txs2[i].toString());
          
          // test merging equivalent txs
          let copy1 = txs1[i].copy();
          let copy2 = txs2[i].copy();
          if (copy1.isConfirmed()) copy1.setBlock(txs1[i].getBlock().copy().setTxs([copy1]));
          if (copy2.isConfirmed()) copy2.setBlock(txs2[i].getBlock().copy().setTxs([copy2]));
          let merged = copy1.merge(copy2);
          await that._testTxWallet(merged, {wallet: that.wallet});
          
          // find non-default incoming
          if (txs1[i].getIncomingTransfers()) {
            for (let transfer of txs1[i].getIncomingTransfers()) {
              if (transfer.getAccountIndex() !== 0 && transfer.getSubaddressIndex() !== 0) nonDefaultIncoming = true;
            }
          }
          
          // ensure unique block reference per height
          if (txs2[i].isConfirmed()) {
            let block = blocksPerHeight[txs2[i].getHeight()];
            if (block === undefined) blocksPerHeight[txs2[i].getHeight()] = txs2[i].getBlock();
            else assert(block === txs2[i].getBlock(), "Block references for same height must be same");
          }
        }
        
        // ensure non-default account and subaddress tested
        assert(nonDefaultIncoming, "No incoming transfers found to non-default account and subaddress; run send-to-multiple tests first");
      });
      
      if (config.testNonRelays)
      it("Can get transactions by id", async function() {
        
        let maxNumTxs = 10;  // max number of txs to test
        
        // fetch all txs for testing
        let txs = await that.wallet.getTxs();
        assert(txs.length > 1, "Test requires at least 2 txs to fetch by id");
        
        // randomly pick a few for fetching by id
        GenUtils.shuffle(txs);
        txs = txs.slice(0, Math.min(txs.length, maxNumTxs));
        
        // test fetching by id
        let fetchedTx = await that.wallet.getTx(txs[0].getId());
        assert.equal(fetchedTx.getId(), txs[0].getId());
        await that._testTxWallet(fetchedTx);
        
        // test fetching by ids
        let txId1 = txs[0].getId();
        let txId2 = txs[1].getId();
        let fetchedTxs = await that.wallet.getTxs(txId1, txId2);
        
        // test fetching by ids as collection
        let txIds = [];
        for (let tx of txs) txIds.push(tx.getId());
        fetchedTxs = await that.wallet.getTxs(txIds);
        assert.equal(fetchedTxs.length, txs.length);
        for (let i = 0; i < txs.length; i++) {
          assert.equal(fetchedTxs[i].getId(), txs[i].getId());
          await that._testTxWallet(fetchedTxs[i]);
        }
      });
      
      if (config.testNonRelays && !config.liteMode)
      it("Can get transactions with additional configuration", async function() {
        
        // get random transactions for testing
        let randomTxs = await getRandomTransactions(that.wallet, undefined, 3, 5);
        for (let randomTx of randomTxs) await that._testTxWallet(randomTx);
        
        // get transactions by id
        let txIds = [];
        for (let randomTx of randomTxs) {
          txIds.push(randomTx.getId());
          let txs = await that._getAndTestTxs(that.wallet, {txId: randomTx.getId()}, true);
          assert.equal(txs.length, 1);
          let merged = txs[0].merge(randomTx.copy()); // txs change with chain so check mergeability
          await that._testTxWallet(merged);
        }
        
        // get transactions by ids
        let txs = await that._getAndTestTxs(that.wallet, {txIds: txIds});
        assert.equal(txs.length, randomTxs.length);
        for (let tx of txs) assert(txIds.includes(tx.getId()));
        
        // get transactions with an outgoing transfer
        txs = await that._getAndTestTxs(that.wallet, {isOutgoing: true}, true);
        for (let tx of txs) {
          assert(tx.isOutgoing());
          assert(tx.getOutgoingTransfer() instanceof MoneroTransfer);
          testTransfer(tx.getOutgoingTransfer());
        }
        
        // get transactions without an outgoing transfer
        txs = await that._getAndTestTxs(that.wallet, {isOutgoing: false}, true);
        for (let tx of txs) assert.equal(tx.getOutgoingTransfer(), undefined);
        
        // get transactions with incoming transfers
        txs = await that._getAndTestTxs(that.wallet, {isIncoming: true}, true);
        for (let tx of txs) {
          assert(tx.getIncomingTransfers().length > 0);
          for (let transfer of tx.getIncomingTransfers()) assert(transfer instanceof MoneroTransfer);
        }
        
        // get transactions without incoming transfers
        txs = await that._getAndTestTxs(that.wallet, {isIncoming: false}, true);
        for (let tx of txs) assert.equal(tx.getIncomingTransfers(), undefined);
        
        // get transactions associated with an account
        let accountIdx = 1;
        txs = await that.wallet.getTxs({transferQuery: {accountIndex: accountIdx}});
        for (let tx of txs) {
          let found = false;
          if (tx.getOutgoingTransfer() && tx.getOutgoingTransfer().getAccountIndex() === accountIdx) found = true;
          else if (tx.getIncomingTransfers()) {
            for (let transfer of tx.getIncomingTransfers()) {
              if (transfer.getAccountIndex() === accountIdx) {
                found = true;
                break;
              }
            }
          }
          assert(found, ("Transaction is not associated with account " + accountIdx + ":\n" + tx.toString()));
        }
        
        // get transactions with incoming transfers to an account
        txs = await that.wallet.getTxs({transferQuery: {isIncoming: true, accountIndex: accountIdx}});
        for (let tx of txs) {
          assert(tx.getIncomingTransfers().length > 0);
          let found = false;
          for (let transfer of tx.getIncomingTransfers()) {
            if (transfer.getAccountIndex() === accountIdx) {
              found = true;
              break;
            }
          }
          assert(found, "No incoming transfers to account " + accountIdx + " found:\n" + tx.toString());
        }
        
        // get txs with manually built query that are confirmed and have an outgoing transfer from account 0
        let txQuery = new MoneroTxQuery();
        txQuery.setIsConfirmed(true);
        txQuery.setTransferQuery(new MoneroTransferQuery().setAccountIndex(0).setIsOutgoing(true));
        txs = await that._getAndTestTxs(that.wallet, txQuery, true);
        for (let tx of txs) {
          if (!tx.isConfirmed()) console.log(tx.toString());
          assert.equal(tx.isConfirmed(), true);
          assert(tx.getOutgoingTransfer());
          assert.equal(tx.getOutgoingTransfer().getAccountIndex(), 0);
        }
        
        // get txs with outgoing transfers that have destinations to account 1
        txs = await that._getAndTestTxs(that.wallet, {transferQuery: {hasDestinations: true, accountIndex: 0}});
        for (let tx of txs) {
          assert(tx.getOutgoingTransfer());
          assert(tx.getOutgoingTransfer().getDestinations().length > 0);
        }
        
        // include outputs with transactions
        txs = await that._getAndTestTxs(that.wallet, {includeOutputs: true}, true);
        let found = false;
        for (let tx of txs) {
          if (tx.getVouts()) {
            assert(tx.getVouts().length > 0);
            found = true;
          } else {
            assert(tx.isOutgoing() || (tx.isIncoming() && !tx.isConfirmed())); // TODO: monero-wallet-rpc: return vouts for unconfirmed txs
          }
        }
        assert(found, "No vouts found in txs");
        
        // get txs with output query
        let outputQuery = new MoneroOutputQuery().setIsSpent(false).setAccountIndex(1).setSubaddressIndex(2);
        txs = await that.wallet.getTxs(new MoneroTxQuery().setOutputQuery(outputQuery));
        assert(txs.length > 0);
        for (let tx of txs) {
          assert(tx.getVouts().length > 0);
          found = false;
          for (let vout of tx.getVouts()) {
            if (vout.isSpent() === false && vout.getAccountIndex() === 1 && vout.getSubaddressIndex() === 2) {
              found = true;
              break;
            }
          }
          if (!found) throw new Error("Tx does not contain specified vout");
        }
      });
      
      if (config.testNonRelays)
      it("Can get transactions by height", async function() {
        
        // get all confirmed txs for testing
        let txs = await that._getAndTestTxs(that.wallet, new MoneroTxQuery().setIsConfirmed(true));
        assert(txs.length > 0, "Wallet has no confirmed txs; run send tests");
        
        // collect all tx heights
        let txHeights = [];
        for (let tx of txs) txHeights.push(tx.getHeight());
        
        // get height that most txs occur at
        let heightCounts = countNumInstances(txHeights);
        let heightModes = getModes(heightCounts);
        let modeHeight = heightModes.values().next().value;
        
        // fetch txs at mode height
        let modeTxs = await that._getAndTestTxs(that.wallet, new MoneroTxQuery().setHeight(modeHeight));
        assert.equal(modeTxs.length, heightCounts.get(modeHeight));
        
        // fetch txs at mode height by range
        let modeTxsByRange = await that._getAndTestTxs(that.wallet, new MoneroTxQuery().setMinHeight(modeHeight).setMaxHeight(modeHeight));
        assert.equal(modeTxsByRange.length, modeTxs.length);
        assert.deepEqual(modeTxsByRange, modeTxs);
        
        // fetch all txs by range
        let fetched = await that._getAndTestTxs(that.wallet, new MoneroTxQuery().setMinHeight(txs[0].getHeight()).setMaxHeight(txs[txs.length - 1].getHeight()));
        assert.deepEqual(txs, fetched);
        
        // test some filtered by range  // TODO: these are separated in Java?
        {
          txs = await that.wallet.getTxs({isConfirmed: true});
          assert(txs.length > 0, "No transactions; run send to multiple test");
            
          // get and sort block heights in ascending order
          let heights = [];
          for (let tx of txs) {
            heights.push(tx.getBlock().getHeight());
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
          txs = await that._getAndTestTxs(that.wallet, {minHeight: minHeight, maxHeight: maxHeight}, true);
          assert(txs.length < unfilteredCount);
          for (let tx of txs) {
            let height = tx.getBlock().getHeight();
            assert(height >= minHeight && height <= maxHeight);
          }
        }
      });
      
      // NOTE: payment ids are deprecated so this test will require an old wallet to pass
      if (config.testNonRelays)
      it("Can get transactions by payment ids", async function() {
        
        // get random transactions with payment ids for testing
        let randomTxs = await getRandomTransactions(that.wallet, {hasPaymentId: true}, 3, 5);
        for (let randomTx of randomTxs) {
          assert(randomTx.getPaymentId());
        }
        
        // get transactions by payment id
        let paymentIds = randomTxs.map(tx => tx.getPaymentId());
        assert(paymentIds.length > 1);
        for (let paymentId of paymentIds) {
          let txs = await that._getAndTestTxs(that.wallet, {paymentId: paymentId});
          assert.equal(txs.length, 1);
          assert(txs[0].getPaymentId());
          MoneroUtils.validatePaymentId(txs[0].getPaymentId());
        }
        
        // get transactions by payment ids
        let txs = await that._getAndTestTxs(that.wallet, {paymentIds: paymentIds});
        for (let tx of txs) {
          assert(paymentIds.includes(tx.getPaymentId()));
        }
      });
      
      if (config.testNonRelays)
      it("Returns all known fields of txs regardless of filtering", async function() {
        
        // fetch wallet txs
        let txs = await that.wallet.getTxs({isConfirmed: true});
        for (let tx of txs) {
          
          // find tx sent to same wallet with incoming transfer in different account than src account
          if (!tx.getOutgoingTransfer() || !tx.getIncomingTransfers()) continue;
          for (let transfer of tx.getIncomingTransfers()) {
            if (transfer.getAccountIndex() === tx.getOutgoingTransfer().getAccountIndex()) continue;
            
            // fetch tx with filtering
            let filteredTxs = await that.wallet.getTxs({transferQuery: {isIncoming: true, accountIndex: transfer.getAccountIndex()}});
            let filteredTx = Filter.apply(new MoneroTxQuery().setTxIds([tx.getId()]), filteredTxs)[0];
            
            // txs should be the same (mergeable)
            assert.equal(filteredTx.getId(), tx.getId());
            tx.merge(filteredTx);
            
            // test is done
            return;
          }
        }
        
        // test did not fully execute
        throw new Error("Test requires tx sent from/to different accounts of same wallet but none found; run send tests");
      });
      
      if (config.testNonRelays && !config.liteMode)
      it("Validates inputs when getting transactions", async function() {
        
        // fetch random txs for testing
        let randomTxs = await getRandomTransactions(that.wallet, undefined, 3, 5);
        
        // valid, invalid, and unknown tx ids for tests
        let txId = randomTxs[0].getId();
        let invalidId = "invalid_id";
        let unknownId1 = "6c4982f2499ece80e10b627083c4f9b992a00155e98bcba72a9588ccb91d0a61";
        let unknownId2 = "ff397104dd875882f5e7c66e4f852ee134f8cf45e21f0c40777c9188bc92e943";
        
        // fetch unknown tx id
        try {
          await that.wallet.getTx(unknownId1);
          throw new Error("Should have thrown error getting tx id unknown to wallet");
        } catch (e) {
          assert.equal(e.message, "Tx not found in wallet: " + unknownId1);
        }
        
        // fetch unknown tx id using query
        try {
          await that.wallet.getTxs(new MoneroTxQuery().setTxId(unknownId1));
          throw new Error("Should have thrown error getting tx id unknown to wallet");
        } catch (e) {
          assert.equal(e.message, "Tx not found in wallet: " + unknownId1);
        }
        
        // fetch unknown tx id in collection
        try {
          await that.wallet.getTxs([txId, unknownId1]);
          throw new Error("Should have thrown error getting tx id unknown to wallet");
        } catch (e) {
          assert.equal(e.message, "Tx not found in wallet: " + unknownId1);
        }
        
        // fetch unknown tx ids in collection
        try {
          await that.wallet.getTxs([txId, unknownId1, unknownId2]);
          throw new Error("Should have thrown error getting tx id unknown to wallet");
        } catch (e) {
          assert.equal(e.message, "Tx not found in wallet: " + unknownId1); // TODO: list all invalid ids in error description?
        }
        
        // fetch invalid id
        try {
          await that.wallet.getTx(invalidId);
          throw new Error("Should have thrown error getting tx id unknown to wallet");
        } catch (e) {
          assert.equal(e.message, "Tx not found in wallet: " + invalidId);
        }
        
        // fetch invalid id collection
        try {
          await that.wallet.getTxs([txId, invalidId]);
          throw new Error("Should have thrown error getting tx id unknown to wallet");
        } catch (e) {
          assert.equal(e.message, "Tx not found in wallet: " + invalidId);
        }
        
        // fetch invalid ids in collection
        try {
          await that.wallet.getTxs([txId, invalidId, "invalid_id_2"]);
          throw new Error("Should have thrown error getting tx id unknown to wallet");
        } catch (e) {
          assert.equal(e.message, "Tx not found in wallet: " + invalidId);
        }
      });

      if (config.testNonRelays)
      it("Can get transfers in the wallet, accounts, and subaddresses", async function() {
        
        // get all transfers
        await that._getAndTestTransfers(that.wallet, undefined, true);
        
        // get transfers by account index
        let nonDefaultIncoming = false;
        for (let account of await that.wallet.getAccounts(true)) {
          let accountTransfers = await that._getAndTestTransfers(that.wallet, {accountIndex: account.getIndex()});
          for (let transfer of accountTransfers) assert.equal(transfer.getAccountIndex(), account.getIndex());
          
          // get transfers by subaddress index
          let subaddressTransfers = [];
          for (let subaddress of account.getSubaddresses()) {
            let transfers = await that._getAndTestTransfers(that.wallet, {accountIndex: subaddress.getAccountIndex(), subaddressIndex: subaddress.getIndex()});
            for (let transfer of transfers) {
              
              // test account and subaddress indices
              assert.equal(transfer.getAccountIndex(), subaddress.getAccountIndex());
              if (transfer.isIncoming()) {
                assert.equal(transfer.getSubaddressIndex(), subaddress.getIndex());
                if (transfer.getAccountIndex() !== 0 && transfer.getSubaddressIndex() !== 0) nonDefaultIncoming = true;
              } else {
                assert(transfer.getSubaddressIndices().includes(subaddress.getIndex()));
                if (transfer.getAccountIndex() !== 0) {
                  for (let subaddrIdx of transfer.getSubaddressIndices()) {
                    if (subaddrIdx > 0) {
                      nonDefaultIncoming = true;
                      break;
                    }
                  }
                }
              }
              
              // don't add duplicates TODO monero-wallet-rpc: duplicate outgoing transfers returned for different subaddress indices, way to return outgoing subaddress indices?
              let found = false;
              for (let subaddressTransfer of subaddressTransfers) {
                if (transfer.toString() === subaddressTransfer.toString() && transfer.getTx().getId() === subaddressTransfer.getTx().getId()) {
                  found = true;
                  break;
                }
              }
              if (!found) subaddressTransfers.push(transfer);
            }
          }
          assert.equal(subaddressTransfers.length, accountTransfers.length);
          
          // collect unique subaddress indices
          let subaddressIndices = new Set();
          for (let transfer of subaddressTransfers) {
            if (transfer.isIncoming()) subaddressIndices.add(transfer.getSubaddressIndex());
            else for (let subaddressIdx of transfer.getSubaddressIndices()) subaddressIndices.add(subaddressIdx);
          }
          
          // get and test transfers by subaddress indices
          let transfers = await that._getAndTestTransfers(that.wallet, new MoneroTransferQuery().setAccountIndex(account.getIndex()).setSubaddressIndices(Array.from(subaddressIndices)), undefined, undefined);
          //if (transfers.length !== subaddressTransfers.length) console.log("WARNING: outgoing transfers always from subaddress 0 (monero-wallet-rpc #5171)");
          assert.equal(transfers.length, subaddressTransfers.length); // TODO monero-wallet-rpc: these may not be equal because outgoing transfers are always from subaddress 0 (#5171) and/or incoming transfers from/to same account are occluded (#4500)
          for (let transfer of transfers) {
            assert.equal(account.getIndex(), transfer.getAccountIndex());
            if (transfer.isIncoming()) assert(subaddressIndices.has(transfer.getSubaddressIndex()));
            else {
              let overlaps = false;
              for (let subaddressIdx of subaddressIndices) {
                for (let outSubaddressIdx of transfer.getSubaddressIndices()) {
                  if (subaddressIdx === outSubaddressIdx) {
                    overlaps = true;
                    break;
                  }
                }
              }
              assert(overlaps, "Subaddresses must overlap");
            }
          }
        }
        
        // ensure transfer found with non-zero account and subaddress indices
        assert(nonDefaultIncoming, "No transfers found in non-default account and subaddress; run send-to-multiple tests");
      });
      
      if (config.testNonRelays && !config.liteMode)
      it("Can get transfers with additional configuration", async function() {
        
        // get incoming transfers
        let transfers = await that._getAndTestTransfers(that.wallet, {isIncoming: true}, true);
        for (let transfer of transfers) assert(transfer.isIncoming());
        
        // get outgoing transfers
        transfers = await that._getAndTestTransfers(that.wallet, {isOutgoing: true}, true);
        for (let transfer of transfers) assert(transfer.isOutgoing());
        
        // get confirmed transfers to account 0
        transfers = await that._getAndTestTransfers(that.wallet, {accountIndex: 0, isConfirmed: true}, true);
        for (let transfer of transfers) {
          assert.equal(transfer.getAccountIndex(), 0);
          assert(transfer.getTx().isConfirmed());
        }
        
        // get confirmed transfers to [1, 2]
        transfers = await that._getAndTestTransfers(that.wallet, {accountIndex: 1, subaddressIndex: 2, isConfirmed: true}, true);
        for (let transfer of transfers) {
          assert.equal(transfer.getAccountIndex(), 1);
          if (transfer.isIncoming()) assert.equal(transfer.getSubaddressIndex(), 2);
          else assert(transfer.getSubaddressIndices().includes(2));
          assert(transfer.getTx().isConfirmed());
        }
        
        // get transfers in the tx pool
        transfers = await that._getAndTestTransfers(that.wallet, {inTxPool: true});
        for (let transfer of transfers) {
          assert.equal(transfer.getTx().inTxPool(), true);
        }
        
        // get random transactions
        let txs = await getRandomTransactions(that.wallet, undefined, 3, 5);
        
        // get transfers with a tx id
        let txIds = [];
        for (let tx of txs) {
          txIds.push(tx.getId());
          transfers = await that._getAndTestTransfers(that.wallet, {txId: tx.getId()}, true);
          for (let transfer of transfers) assert.equal(transfer.getTx().getId(), tx.getId());
        }
        
        // get transfers with tx ids
        transfers = await that._getAndTestTransfers(that.wallet, {txIds: txIds}, true);
        for (let transfer of transfers) assert(txIds.includes(transfer.getTx().getId()));
        
        // TODO: test that transfers with the same txId have the same tx reference
        
        // TODO: test transfers destinations
        
        // get transfers with pre-built query that are confirmed and have outgoing destinations
        let transferQuery = new MoneroTransferQuery();
        transferQuery.setIsOutgoing(true);
        transferQuery.setHasDestinations(true);
        transferQuery.setTxQuery(new MoneroTxQuery().setIsConfirmed(true));
        transfers = await that._getAndTestTransfers(that.wallet, transferQuery);
        for (let transfer of transfers) {
          assert.equal(transfer.isOutgoing(), true);
          assert(transfer.getDestinations().length > 0);
          assert.equal(transfer.getTx().isConfirmed(), true);
        }
      });
      
      if (config.testNonRelays && !config.liteMode)
      it("Validates inputs when getting transfers", async function() {
        
        // test with invalid id
        let transfers = await that.wallet.getTransfers({txId: "invalid_id"});
        assert.equal(transfers.length, 0);
        
        // test invalid id in collection
        let randomTxs = await getRandomTransactions(that.wallet, undefined, 3, 5);
        transfers = await that.wallet.getTransfers({txIds: [randomTxs[0].getId(), "invalid_id"]});
        assert(transfers.length > 0);
        let tx = transfers[0].getTx();
        for (let transfer of transfers) assert(tx === transfer.getTx());
        
        // test unused subaddress indices
        transfers = await that.wallet.getTransfers({accountIndex: 0, subaddressIndices: [1234907]});
        assert(transfers.length === 0);
        
        // test invalid subaddress index
        try {
          let transfers = await that.wallet.getTransfers({accountIndex: 0, subaddressIndex: -10});
          throw new Error("Should have failed");
        } catch (e) {
          assert.notEqual(e.message, "Should have failed");
        }
      });
      
      if (config.testNonRelays)
      it("Can get outputs in the wallet, accounts, and subaddresses", async function() {

        // get all outputs
        await that._getAndTestOutputs(that.wallet, undefined, true);
        
        // get outputs for each account
        let nonDefaultIncoming = false;
        let accounts = await that.wallet.getAccounts(true);
        for (let account of accounts) {
          
          // determine if account is used
          let isUsed = false;
          for (let subaddress of account.getSubaddresses()) if (subaddress.isUsed()) isUsed = true;
          
          // get outputs by account index
          let accountOutputs = await that._getAndTestOutputs(that.wallet, {accountIndex: account.getIndex()}, isUsed);
          for (let output of accountOutputs) assert.equal(output.getAccountIndex(), account.getIndex());
          
          // get outputs by subaddress index
          let subaddressOutputs = [];
          for (let subaddress of account.getSubaddresses()) {
            let outputs = await that._getAndTestOutputs(that.wallet, {accountIndex: account.getIndex(), subaddressIndex: subaddress.getIndex()}, subaddress.isUsed());
            for (let output of outputs) {
              assert.equal(output.getAccountIndex(), subaddress.getAccountIndex());
              assert.equal(output.getSubaddressIndex(), subaddress.getIndex());
              if (output.getAccountIndex() !== 0 && output.getSubaddressIndex() !== 0) nonDefaultIncoming = true;
              subaddressOutputs.push(output);
            }
          }
          assert.equal(subaddressOutputs.length, accountOutputs.length);
          
          // get outputs by subaddress indices
          let subaddressIndices = Array.from(new Set(subaddressOutputs.map(output => output.getSubaddressIndex())));
          let outputs = await that._getAndTestOutputs(that.wallet, {accountIndex: account.getIndex(), subaddressIndices: subaddressIndices}, isUsed);
          assert.equal(outputs.length, subaddressOutputs.length);
          for (let output of outputs) {
            assert.equal(output.getAccountIndex(), account.getIndex());
            assert(subaddressIndices.includes(output.getSubaddressIndex()));
          }
        }
        
        // ensure output found with non-zero account and subaddress indices
        assert(nonDefaultIncoming, "No outputs found in non-default account and subaddress; run send-to-multiple tests");
      });

      if (config.testNonRelays && !config.liteMode)
      it("Can get outputs with additional configuration", async function() {
        
        // get unspent outputs to account 0
        let outputs = await that._getAndTestOutputs(that.wallet, {accountIndex: 0, isSpent: false});
        for (let output of outputs) {
          assert.equal(output.getAccountIndex(), 0);
          assert.equal(output.isSpent(), false);
        }
        
        // get spent outputs to account 1
        outputs = await that._getAndTestOutputs(that.wallet, {accountIndex: 1, isSpent: true}, true);
        for (let output of outputs) {
          assert.equal(output.getAccountIndex(), 1);
          assert.equal(output.isSpent(), true);
        }
        
        // get random transactions
        let txs = await getRandomTransactions(that.wallet, {isConfirmed: true}, 3, 5);
        
        // get outputs with a tx id
        let txIds = [];
        for (let tx of txs) {
          txIds.push(tx.getId());
          outputs = await that._getAndTestOutputs(that.wallet, {txId: tx.getId()}, true);
          for (let output of outputs) assert.equal(output.getTx().getId(), tx.getId());
        }
        
        // get outputs with tx ids
        outputs = await that._getAndTestOutputs(that.wallet, {txIds: txIds}, true);
        for (let output of outputs) assert(txIds.includes(output.getTx().getId()));
        
        // get confirmed outputs to specific subaddress with pre-built query
        let accountIdx = 0;
        let subaddressIdx = 1;
        let query = new MoneroOutputQuery();
        query.setAccountIndex(accountIdx).setSubaddressIndex(subaddressIdx);
        query.setTxQuery(new MoneroTxQuery().setIsConfirmed(true));
        outputs = await that._getAndTestOutputs(that.wallet, query, true);
        for (let output of outputs) {
          assert.equal(output.getAccountIndex(), accountIdx);
          assert.equal(output.getSubaddressIndex(), subaddressIdx);
          assert.equal(output.getTx().isConfirmed(), true);
        }
        
        // get output by key image
        let keyImage = outputs[0].getKeyImage().getHex();
        outputs = await that.wallet.getOutputs(new MoneroOutputQuery().setKeyImage(new MoneroKeyImage(keyImage)));
        assert.equal(outputs.length, 1);
        assert.equal(outputs[0].getKeyImage().getHex(), keyImage);
      });
      
      if (config.testNonRelays && !config.liteMode)
      it("Validates inputs when getting outputs", async function() {
        
        // test with invalid id
        let outputs = await that.wallet.getOutputs({txId: "invalid_id"});
        assert.equal(outputs.length, 0);
        
        // test invalid id in collection
        let randomTxs = await getRandomTransactions(that.wallet, {isConfirmed: true, includeOutputs: true}, 3, 5);
        outputs = await that.wallet.getOutputs({txIds: [randomTxs[0].getId(), "invalid_id"]});
        assert(outputs.length > 0);
        assert.equal(randomTxs[0].getVouts().length, outputs.length);
        let tx = outputs[0].getTx();
        for (let output of outputs) assert(tx === output.getTx());
      });
      
      if (config.testNonRelays)
      it("Can get outputs in hex format", async function() {
        let outputsHex = await that.wallet.getOutputsHex();
        assert.equal(typeof outputsHex, "string");  // TODO: this will fail if wallet has no outputs; run these tests on new wallet
        assert(outputsHex.length > 0);
      });
      
      if (config.testNonRelays)
      it("Can import outputs in hex format", async function() {
        
        // get outputs hex
        let outputsHex = await that.wallet.getOutputsHex();
        
        // import outputs hex
        if (outputsHex !== undefined) {
          let numImported = await that.wallet.importOutputsHex(outputsHex);
          assert(numImported > 0);
        }
      });
      
      if (config.testNonRelays)
      it("Has correct accounting across accounts, subaddresses, txs, transfers, and outputs", async function() {
        
        // pre-fetch wallet balances, accounts, subaddresses, and txs
        let walletBalance = await that.wallet.getBalance();
        let walletUnlockedBalance = await that.wallet.getUnlockedBalance();
        let accounts = await that.wallet.getAccounts(true);  // includes subaddresses
        let txs = await that.wallet.getTxs();
        
        // test wallet balance
        TestUtils.testUnsignedBigInteger(walletBalance);
        TestUtils.testUnsignedBigInteger(walletUnlockedBalance);
        assert(walletBalance.compare(walletUnlockedBalance) >= 0);
        
        // test that wallet balance equals sum of account balances
        let accountsBalance = new BigInteger(0);
        let accountsUnlockedBalance = new BigInteger(0);
        for (let account of accounts) {
          testAccount(account); // test that account balance equals sum of subaddress balances
          accountsBalance = accountsBalance.add(account.getBalance());
          accountsUnlockedBalance = accountsUnlockedBalance.add(account.getUnlockedBalance());
        }
        assert.equal(walletBalance.compare(accountsBalance), 0);
        assert.equal(walletUnlockedBalance.compare(accountsUnlockedBalance), 0);
        
//        // test that wallet balance equals net of wallet's incoming and outgoing tx amounts
//        // TODO monero-wallet-rpc: these tests are disabled because incoming transfers are not returned when sent from the same account, so doesn't balance #4500
//        // TODO: test unlocked balance based on txs, requires e.g. tx.isLocked()
//        let outgoingSum = new BigInteger(0);
//        let incomingSum = new BigInteger(0);
//        for (let tx of txs) {
//          if (tx.getOutgoingAmount()) outgoingSum = outgoingSum.add(tx.getOutgoingAmount());
//          if (tx.getIncomingAmount()) incomingSum = incomingSum.add(tx.getIncomingAmount());
//        }
//        assert.equal(incomingSum.subtract(outgoingSum).toString(), walletBalance.toString());
//        
//        // test that each account's balance equals net of account's incoming and outgoing tx amounts
//        for (let account of accounts) {
//          if (account.getIndex() !== 1) continue; // find 1
//          outgoingSum = new BigInteger(0);
//          incomingSum = new BigInteger(0);
//          let filter = new MoneroTxQuery();
//          filter.setAccountIndex(account.getIndex());
//          for (let tx of txs.filter(tx => filter.meetsCriteria(tx))) { // normally we'd call wallet.getTxs(filter) but we're using pre-fetched txs
//            if (tx.getId() === "8d3919d98dd5a734da8c52eddc558db3fbf059ad55d432f0052ecd59ef122ecb") console.log(tx.toString(0));
//            
//            //console.log((tx.getOutgoingAmount() ? tx.getOutgoingAmount().toString() : "") + ", " + (tx.getIncomingAmount() ? tx.getIncomingAmount().toString() : ""));
//            if (tx.getOutgoingAmount()) outgoingSum = outgoingSum.add(tx.getOutgoingAmount());
//            if (tx.getIncomingAmount()) incomingSum = incomingSum.add(tx.getIncomingAmount());
//          }
//          assert.equal(incomingSum.subtract(outgoingSum).toString(), account.getBalance().toString());
//        }
        
        // balance may not equal sum of unspent outputs if unconfirmed txs
        // TODO monero-wallet-rpc: reason not to return unspent outputs on unconfirmed txs? then this isn't necessary
        let hasUnconfirmedTx = false;
        for (let tx of txs) if (tx.inTxPool()) hasUnconfirmedTx = true;
        
        // wallet balance is sum of all unspent outputs
        let walletSum = new BigInteger(0);
        for (let output of await that.wallet.getOutputs({isSpent: false})) walletSum = walletSum.add(output.getAmount());
        if (walletBalance.toString() !== walletSum.toString()) assert(hasUnconfirmedTx, "Wallet balance must equal sum of unspent outputs if no unconfirmed txs");
        
        // account balances are sum of their unspent outputs
        for (let account of accounts) {
          let accountSum = new BigInteger(0);
          let accountOutputs = await that.wallet.getOutputs({accountIndex: account.getIndex(), isSpent: false});
          for (let output of accountOutputs) accountSum = accountSum.add(output.getAmount());
          if (account.getBalance().toString() !== accountSum.toString()) assert(hasUnconfirmedTx, "Account balance must equal sum of its unspent outputs if no unconfirmed txs");
          
          // subaddress balances are sum of their unspent outputs
          for (let subaddress of account.getSubaddresses()) {
            let subaddressSum = new BigInteger(0);
            let subaddressOutputs = await that.wallet.getOutputs({accountIndex: account.getIndex(), subaddressIndex: subaddress.getIndex(), isSpent: false});
            for (let output of subaddressOutputs) subaddressSum = subaddressSum.add(output.getAmount());
            if (subaddress.getBalance().toString() !== subaddressSum.toString()) assert(hasUnconfirmedTx, "Subaddress balance must equal sum of its unspent outputs if no unconfirmed txs");
          }
        }
      });
      
      if (config.testNonRelays)
      it("Can get and set a transaction note", async function() {
        let txs = await getRandomTransactions(that.wallet, undefined, 1, 5);
        
        // set notes
        let uuid = GenUtils.uuidv4();
        for (let i = 0; i < txs.length; i++) {
          await that.wallet.setTxNote(txs[i].getId(), uuid + i); // TODO: can we not iterate over awaits?
        }
        
        // get notes
        for (let i = 0; i < txs.length; i++) {
          assert.equal(await that.wallet.getTxNote(txs[i].getId()), uuid + i);
        }
      });
      
      // TODO: why does getting cached txs take 2 seconds when should already be cached?
      if (config.testNonRelays)
      it("Can get and set multiple transaction notes", async function() {
        
        // set tx notes
        let uuid = GenUtils.uuidv4();
        let txs = await getCachedTxs();
        assert(txs.length >= 3, "Test requires 3 or more wallet transactions; run send tests");
        let txIds = [];
        let txNotes = [];
        for (let i = 0; i < txIds.length; i++) {
          txIds.push(txs[i].getId());
          txNotes.push(uuid + i);
        }
        await that.wallet.setTxNotes(txIds, txNotes);
        
        // get tx notes
        txNotes = await that.wallet.getTxNotes(txIds);
        for (let i = 0; i < txIds.length; i++) {
          assert.equal(uuid + i, txNotes[i]);
        }
        
        // TODO: test that get transaction has note
      });
      
      if (config.testNonRelays)
      it("Can check a transfer using the transaction's secret key and the destination", async function() {
        
        // get random txs that are confirmed and have outgoing destinations
        let txs;
        try {
          txs = await getRandomTransactions(that.wallet, {isConfirmed: true, isOutgoing: true, transferQuery: {hasDestinations: true}}, 1, MAX_TX_PROOFS);
        } catch (e) {
          if (e.message.indexOf("found with")) throw new Error("No txs with outgoing destinations found; run send tests")
          throw e;
        }
        
        // test good checks
        assert(txs.length > 0, "No transactions found with outgoing destinations");
        for (let tx of txs) {
          let key = await that.wallet.getTxKey(tx.getId());
          for (let destination of tx.getOutgoingTransfer().getDestinations()) {
            let check = await that.wallet.checkTxKey(tx.getId(), key, destination.getAddress());
            if (destination.getAmount().compare(new BigInteger()) > 0) {
              // TODO monero-wallet-rpc: indicates amount received amount is 0 despite transaction with transfer to this address
              // TODO monero-wallet-rpc: returns 0-4 errors, not consistent
//            assert(check.getReceivedAmount().compare(new BigInteger(0)) > 0);
              if (check.getReceivedAmount().compare(new BigInteger(0)) === 0) {
                console.log("WARNING: key proof indicates no funds received despite transfer (txid=" + tx.getId() + ", key=" + key + ", address=" + destination.getAddress() + ", amount=" + destination.getAmount() + ")");
              }
            }
            else assert(check.getReceivedAmount().compare(new BigInteger(0)) === 0);
            testCheckTx(tx, check);
          }
        }
        
        // test get tx key with invalid id
        try {
          await that.wallet.getTxKey("invalid_tx_id");
          throw new Error("Should throw exception for invalid key");
        } catch (e) {
          assert.equal(e.getCode(), -8);
        }
        
        // test check with invalid tx id
        let tx = txs[0];
        let key = await that.wallet.getTxKey(tx.getId());
        let destination = tx.getOutgoingTransfer().getDestinations()[0];
        try {
          await that.wallet.checkTxKey("invalid_tx_id", key, destination.getAddress());
          throw new Error("Should have thrown exception");
        } catch (e) {
          assert.equal(e.getCode(), -8);
        }
        
        // test check with invalid key
        try {
          await that.wallet.checkTxKey(tx.getId(), "invalid_tx_key", destination.getAddress());
          throw new Error("Should have thrown exception");
        } catch (e) {
          assert.equal(e.getCode(), -25);
        }
        
        // test check with invalid address
        try {
          await that.wallet.checkTxKey(tx.getId(), key, "invalid_tx_address");
          throw new Error("Should have thrown exception");
        } catch (e) {
          assert.equal(e.getCode(), -2);
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
        assert(differentAddress, "Could not get a different outgoing address to test; run send tests");
        let check = await that.wallet.checkTxKey(tx.getId(), key, differentAddress);
        assert(check.isGood());
        assert(check.getReceivedAmount().compare(new BigInteger(0)) >= 0);
        testCheckTx(tx, check);
      });
      
      if (config.testNonRelays)
      it("Can prove a transaction by getting its signature", async function() {
        
        // get random txs that are confirmed and have outgoing destinations
        let txs;
        try {
          txs = await getRandomTransactions(that.wallet, {isConfirmed: true, isOutgoing: true, transferQuery: {hasDestinations: true}}, 1, MAX_TX_PROOFS);
        } catch (e) {
          if (e.message.indexOf("found with")) throw new Error("No txs with outgoing destinations found; run send tests")
          throw e;
        }
        
        // test good checks with messages
        for (let tx of txs) {
          for (let destination of tx.getOutgoingTransfer().getDestinations()) {
            let signature = await that.wallet.getTxProof(tx.getId(), destination.getAddress(), "This transaction definitely happened.");
            let check = await that.wallet.checkTxProof(tx.getId(), destination.getAddress(), "This transaction definitely happened.", signature);
            testCheckTx(tx, check);
          }
        }
        
        // test good check without message
        let tx = txs[0];
        let destination = tx.getOutgoingTransfer().getDestinations()[0];
        let signature = await that.wallet.getTxProof(tx.getId(), destination.getAddress());
        let check = await that.wallet.checkTxProof(tx.getId(), destination.getAddress(), undefined, signature);
        testCheckTx(tx, check);
        
        // test get proof with invalid id
        try {
          await that.wallet.getTxProof("invalid_tx_id", destination.getAddress());
          throw new Error("Should throw exception for invalid key");
        } catch (e) {
          assert.equal(e.getCode(), -8);
        }
        
        // test check with invalid tx id
        try {
          await that.wallet.checkTxProof("invalid_tx_id", destination.getAddress(), undefined, signature);
          throw new Error("Should have thrown exception");
        } catch (e) {
          assert.equal(e.getCode(), -8);
        }
        
        // test check with invalid address
        try {
          await that.wallet.checkTxProof(tx.getId(), "invalid_tx_address", undefined, signature);
          throw new Error("Should have thrown exception");
        } catch (e) {
          assert.equal(e.getCode(), -2);
        }
        
        // test check with wrong message
        signature = await that.wallet.getTxProof(tx.getId(), destination.getAddress(), "This is the right message");
        check = await that.wallet.checkTxProof(tx.getId(), destination.getAddress(), "This is the wrong message", signature);
        assert.equal(check.isGood(), false);
        testCheckTx(tx, check);
        
        // test check with wrong signature
        let wrongSignature = await that.wallet.getTxProof(txs[1].getId(), txs[1].getOutgoingTransfer().getDestinations()[0].getAddress(), "This is the right message");
        try {
          check = await that.wallet.checkTxProof(tx.getId(), destination.getAddress(), "This is the right message", wrongSignature);  
          assert.equal(check.isGood(), false);
        } catch (e) {
          assert.equal(e.getCode(), -1); // TODO: sometimes comes back bad, sometimes throws exception.  ensure txs come from different addresses?
        }
      });
      
      if (config.testNonRelays)
      it("Can prove a spend using a generated signature and no destination public address", async function() {
        
        // get random confirmed outgoing txs
        let txs = await getRandomTransactions(that.wallet, {isIncoming: false, inTxPool: false, isFailed: false}, 2, MAX_TX_PROOFS);
        for (let tx of txs) {
          assert.equal(tx.isConfirmed(), true);
          assert.equal(tx.getIncomingTransfers(), undefined);
          assert(tx.getOutgoingTransfer());
        }
        
        // test good checks with messages
        for (let tx of txs) {
          let signature = await that.wallet.getSpendProof(tx.getId(), "I am a message.");
          assert(await that.wallet.checkSpendProof(tx.getId(), "I am a message.", signature));
        }
        
        // test good check without message
        let tx = txs[0];
        let signature = await that.wallet.getSpendProof(tx.getId());
        assert(await that.wallet.checkSpendProof(tx.getId(), undefined, signature));
        
        // test get proof with invalid id
        try {
          await that.wallet.getSpendProof("invalid_tx_id");
          throw new Error("Should throw exception for invalid key");
        } catch (e) {
          assert.equal(e.getCode(), -8);
        }
        
        // test check with invalid tx id
        try {
          await that.wallet.checkSpendProof("invalid_tx_id", undefined, signature);
          throw new Error("Should have thrown exception");
        } catch (e) {
          assert.equal(e.getCode(), -8);
        }
        
        // test check with invalid message
        signature = await that.wallet.getSpendProof(tx.getId(), "This is the right message");
        assert.equal(await that.wallet.checkSpendProof(tx.getId(), "This is the wrong message", signature), false);
        
        // test check with wrong signature
        signature = await that.wallet.getSpendProof(txs[1].getId(), "This is the right message");
        assert.equal(await that.wallet.checkSpendProof(tx.getId(), "This is the right message", signature), false);
      });
      
      if (config.testNonRelays)
      it("Can prove reserves in the wallet", async function() {
        
        // get proof of entire wallet
        let signature = await that.wallet.getReserveProofWallet("Test message");
        
        // check proof of entire wallet
        let check = await that.wallet.checkReserveProof(await that.wallet.getPrimaryAddress(), "Test message", signature);
        assert(check.isGood());
        testCheckReserve(check);
        let balance = await that.wallet.getBalance();
        if (balance.compare(check.getTotalAmount()) !== 0) {  // TODO monero-wallet-rpc: this check fails with unconfirmed txs
          let unconfirmedTxs = await that.wallet.getTxs({inTxPool: true});
          assert(unconfirmedTxs.length > 0, "Reserve amount must equal balance unless wallet has unconfirmed txs");
        }
        
        // test different wallet address
        let differentAddress = await TestUtils.getRandomWalletAddress();
        try {
          await that.wallet.checkReserveProof(differentAddress, "Test message", signature);
          throw new Error("Should have thrown exception");
        } catch (e) {
          assert.equal(e.getCode(), -1);
        }
        
        // test subaddress
        try {
          
          await that.wallet.checkReserveProof((await that.wallet.getSubaddress(0, 1)).getAddress(), "Test message", signature);
          throw new Error("Should have thrown exception");
        } catch (e) {
          assert.equal(e.getCode(), -1);
        }
        
        // test wrong message
        check = await that.wallet.checkReserveProof(await that.wallet.getPrimaryAddress(), "Wrong message", signature);
        assert.equal(check.isGood(), false);  // TODO: specifically test reserve checks, probably separate objects
        testCheckReserve(check);
        
        // test wrong signature
        try {
          await that.wallet.checkReserveProof(await that.wallet.getPrimaryAddress(), "Test message", "wrong signature");
          throw new Error("Should have thrown exception");
        } catch (e) {
          assert.equal(e.getCode(), -1);
        }
      });
      
      if (config.testNonRelays && false)  // TODO: re-enable this after 14.x point release which fixes this
      it("Can prove reserves in an account", async function() {
        
        // test proofs of accounts
        let numNonZeroTests = 0;
        let msg = "Test message";
        let accounts = await that.wallet.getAccounts();
        let signature;
        for (let account of accounts) {
          if (account.getBalance().compare(new BigInteger(0)) > 0) {
            let checkAmount = (await account.getBalance()).divide(new BigInteger(2));
            signature = await that.wallet.getReserveProofAccount(account.getIndex(), checkAmount, msg);
            let check = await that.wallet.checkReserveProof(await that.wallet.getPrimaryAddress(), msg, signature);
            assert(check.isGood());
            testCheckReserve(check);
            assert(check.getTotalAmount().compare(checkAmount) >= 0);
            numNonZeroTests++;
          } else {
            try {
              await that.wallet.getReserveProofAccount(account.getIndex(), account.getBalance(), msg);
              throw new Error("Should have thrown exception");
            } catch (e) {
              assert.equal(e.getCode(), -1);
              try {
                await that.wallet.getReserveProofAccount(account.getIndex(), TestUtils.MAX_FEE, msg);
                throw new Error("Should have thrown exception");
              } catch (e2) {
                assert.equal(e2.getCode(), -1);
              }
            }
          }
        }
        assert(numNonZeroTests > 1, "Must have more than one account with non-zero balance; run send-to-multiple tests");
        
        // test error when not enough balance for requested minimum reserve amount
        try {
          await that.wallet.getReserveProofAccount(0, accounts[0].getBalance().add(TestUtils.MAX_FEE), "Test message");
          throw new Error("Should have thrown exception");
        } catch (e) {
          assert.equal(e.getCode(), -1);
        }
        
        // test different wallet address
        let differentAddress = await TestUtils.getRandomWalletAddress();
        try {
          await that.wallet.checkReserveProof(differentAddress, "Test message", signature);
          throw new Error("Should have thrown exception");
        } catch (e) {
          assert.equal(e.getCode(), -1);
        }
        
        // test subaddress
        try {
          await that.wallet.checkReserveProof((await that.wallet.getSubaddress(0, 1)).getAddress(), "Test message", signature);
          throw new Error("Should have thrown exception");
        } catch (e) {
          assert.equal(e.getCode(), -1);
        }
        
        // test wrong message
        let check = await that.wallet.checkReserveProof(await that.wallet.getPrimaryAddress(), "Wrong message", signature);
        assert.equal(check.isGood(), false); // TODO: specifically test reserve checks, probably separate objects
        testCheckReserve(check);
        
        // test wrong signature
        try {
          await that.wallet.checkReserveProof(await that.wallet.getPrimaryAddress(), "Test message", "wrong signature");
          throw new Error("Should have thrown exception");
        } catch (e) {
          assert.equal(e.getCode(), -1);
        }
      });
      
      if (config.testNonRelays)
      it("Can get signed key images", async function() {
        let images = await that.wallet.getKeyImages();
        assert(Array.isArray(images));
        assert(images.length > 0, "No signed key images in wallet");
        for (let image of images) {
          assert(image instanceof MoneroKeyImage);
          assert(image.getHex());
          assert(image.getSignature());
        }
      });
      
      if (config.testNonRelays)
      it("Can get new key images from the last import", async function() {
        
        // get outputs hex
        let outputsHex = await that.wallet.getOutputsHex();
        
        // import outputs hex
        if (outputsHex !== undefined) {
          let numImported = await that.wallet.importOutputsHex(outputsHex);
          assert(numImported > 0);
        }
        
        // get and test new key images from last import
        let images = await that.wallet.getNewKeyImagesFromLastImport();
        assert(Array.isArray(images));
        assert(images.length > 0, "No new key images in last import");  // TODO: these are already known to the wallet, so no new key images will be imported
        for (let image of images) {
          assert(image.getHex());
          assert(image.getSignature());
        }
      });
      
      if (config.testNonRelays && false)  // TODO monero core: importing key images can cause erasure of incoming transfers per wallet2.cpp:11957
      it("Can import key images", async function() {
        let images = await that.wallet.getKeyImages();
        assert(Array.isArray(images));
        assert(images.length > 0, "Wallet does not have any key images; run send tests");
        let result = await that.wallet.importKeyImages(images);
        assert(result.getHeight() > 0);
        
        // determine if non-zero spent and unspent amounts are expected
        let txs = await that.wallet.getTxs({isConfirmed: true, transferQuery: {isOutgoing: true}});
        let balance = await that.wallet.getBalance();
        let hasSpent = txs.length > 0;
        let hasUnspent = balance.toJSValue() > 0;
        
        // test amounts
        TestUtils.testUnsignedBigInteger(result.getSpentAmount(), hasSpent);
        TestUtils.testUnsignedBigInteger(result.getUnspentAmount(), hasUnspent);
      });
      
      if (config.testNonRelays)
      it("Can sign and verify messages", async function() {
        let msg = "This is a super important message which needs to be signed and verified.";
        let signature = await that.wallet.sign(msg);
        let verified = await that.wallet.verify(msg, await that.wallet.getAddress(0, 0), signature);
        assert.equal(verified, true);
        verified = await that.wallet.verify(msg, await TestUtils.getRandomWalletAddress(), signature);
        assert.equal(verified, false);
      });
      
      if (config.testNonRelays)
      it("Can get and set arbitrary key/value attributes", async function() {
        
        // set attributes
        let attrs = {};
        for (let i = 0; i < 5; i++) {
          let key = "attr" + i;
          let val = GenUtils.uuidv4();
          attrs[key] = val;
          await that.wallet.setAttribute(key, val);
        }
        
        // test attributes
        for (let key of Object.keys(attrs)) {
          assert.equal(attrs[key], await that.wallet.getAttribute(key));
        }
        
        // get an undefined attribute
        assert.equal(await that.wallet.getAttribute("unset_key"), undefined);
      });
      
      if (config.testNonRelays)
      it("Can convert between a tx send request and payment URI", async function() {
        
        // test with address and amount
        let request1 = new MoneroSendRequest(await that.wallet.getAddress(0, 0), new BigInteger(0));
        let uri = await that.wallet.createPaymentUri(request1);
        let request2 = await that.wallet.parsePaymentUri(uri);
        GenUtils.deleteUndefinedKeys(request1);
        GenUtils.deleteUndefinedKeys(request2);
        assert.deepEqual(JSON.parse(JSON.stringify(request2)), JSON.parse(JSON.stringify(request1)));
        
        // test with all fields3
        request1.getDestinations()[0].setAmount(new BigInteger("425000000000"));
        request1.setPaymentId("03284e41c342f03603284e41c342f03603284e41c342f03603284e41c342f036");
        request1.setRecipientName("John Doe");
        request1.setNote("OMZG XMR FTW");
        uri = await that.wallet.createPaymentUri(request1);
        request2 = await that.wallet.parsePaymentUri(uri);
        GenUtils.deleteUndefinedKeys(request1);
        GenUtils.deleteUndefinedKeys(request2);
        assert.deepEqual(request2, request1);
        
        // test with undefined address
        let address = request1.getDestinations()[0].getAddress();
        request1.getDestinations()[0].setAddress(undefined);
        try {
          await that.wallet.createPaymentUri(request1);
          fail("Should have thrown RPC exception with invalid parameters");
        } catch (e) {
          assert.equal(e.getCode(), -11);
          assert(e.message.indexOf("Cannot make URI from supplied parameters") >= 0);
        }
        request1.getDestinations()[0].setAddress(address);
        
        // test with invalid payment id
        request1.setPaymentId("bizzup");
        try {
          await that.wallet.createPaymentUri(request1);
          fail("Should have thrown RPC exception with invalid parameters");
        } catch (e) {
          assert.equal(e.getCode(), -11);
          assert(e.message.indexOf("Cannot make URI from supplied parameters") >= 0);
        }
      });
      
      if (config.testNonRelays)
      it("Can start and stop mining", async function() {
        let status = await daemon.getMiningStatus();
        if (status.isActive()) await that.wallet.stopMining();
        await that.wallet.startMining(2, false, true);
        await that.wallet.stopMining();
      });
      
      if (config.testNonRelays)
      it("Can save and close the wallet in a single call", async function() {
        
        // create a random wallet
        let wallet = await that.createRandomWallet();
        let path = await that.wallet.getPath();
                
        // set an attribute
        let uuid = GenUtils.uuidv4();
        await that.wallet.setAttribute("id", uuid);
        
        // close the wallet without saving
        await that.wallet.close();
        
        // re-open the wallet and ensure attribute was not saved
        wallet = await that.openWallet(path);
        assert.equal(await that.wallet.getAttribute("id"), undefined);
        
        // set the attribute and close with saving
        await that.wallet.setAttribute("id", uuid);
        await that.wallet.close(true);
        
        // re-open the wallet and ensure attribute was saved
        wallet = await that.openWallet(path);
        assert.equal(await that.wallet.getAttribute("id"), uuid);
        
        // re-open main test wallet
        await that.wallet.close(); // defaults to not saving
        this.wallet = await that.getTestWallet();
      });
      
      // ------------------------ TEST NOTIFICATIONS --------------------------
      
      // TODO: test sending to multiple accounts
      
      if (config.testNotifications)
      it("Can update a locked tx sent from/to the same account as blocks are added to the chain", async function() {
        let request = new MoneroSendRequest(0, await that.wallet.getPrimaryAddress(), TestUtils.MAX_FEE);
        request.setUnlockTime(3);
        request.setCanSplit(false);
        await testSendAndUpdateTxs(request);
      });
      
      if (config.testNotifications && !config.liteMode)
      it("Can update split locked txs sent from/to the same account as blocks are added to the chain", async function() {
        let request = new MoneroSendRequest(0, await that.wallet.getPrimaryAddress(), TestUtils.MAX_FEE);
        request.setUnlockTime(3);
        request.setCanSplit(true);
        await testSendAndUpdateTxs(request);
      });
      
      if (config.testNotifications && !config.liteMode)
      it("Can update a locked tx sent from/to different accounts as blocks are added to the chain", async function() {
        let request = new MoneroSendRequest(0, (await that.wallet.getSubaddress(1, 0)).getAddress(), TestUtils.MAX_FEE);
        request.setUnlockTime(3);
        await testSendAndUpdateTxs(request);
      });
      
      if (config.testNotifications && !config.liteMode)
      it("Can update locked, split txs sent from/to different accounts as blocks are added to the chain", async function() {
        let request = new MoneroSendRequest(0, (await that.wallet.getSubaddress(1, 0)).getAddress(), TestUtils.MAX_FEE);
        request.setUnlockTime(3);
        await testSendAndUpdateTxs(request);
      });
      
      // TODO: incorporate mining into testSendAndUpdateTxs()
//      // start mining if possible to help push the network along
//      before(async function() {

//      });
//      
//      // stop mining
//      after(async function() {

//      });
      
      /**
       * Tests sending a tx with an unlock time then tracking and updating it as
       * blocks are added to the chain.
       * 
       * TODO: test wallet accounting throughout this; dedicated method? probably.
       * 
       * Allows sending to and from the same account which is an edge case where
       * incoming txs are occluded by their outgoing counterpart (issue #4500)
       * and also where it is impossible to discern which incoming output is
       * the tx amount and which is the change amount without wallet metadata.
       * 
       * @param request is the send configuration to send and test
       */
      async function testSendAndUpdateTxs(request) {
        await TestUtils.TX_POOL_WALLET_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        if (!request) request = new MoneroSendRequest();
        
        // this test starts and stops mining, so it's wrapped in order to stop mining if anything fails
        let err;
        try {
          
          // send transactions
          let sentTxs = (await (request.getCanSplit() ? that.wallet.sendSplit(request) : that.wallet.send(request))).getTxs();
          
          // test sent transactions
          for (let tx of sentTxs) {
            await that._testTxWallet(tx, {wallet: that.wallet, sendRequest: request, isSendResponse: true});
            assert.equal(tx.isConfirmed(), false);
            assert.equal(tx.inTxPool(), true);
          }
          
          // track resulting outgoing and incoming txs as blocks are added to the chain
          let updatedTxs;
          
          // start mining
          try { await that.wallet.startMining(8, false, true); }
          catch (e) { } // no problem
          
          // loop to update txs through confirmations
          let numConfirmations = 0;
          const numConfirmationsTotal = 2; // number of confirmations to test
          while (numConfirmations < numConfirmationsTotal) {
            
            // wait for a block
            let header = await daemon.getNextBlockHeader();
            console.log("*** Block " + header.getHeight() + " added to chain ***");
            
            // give wallet time to catch up, otherwise incoming tx may not appear
            await new Promise(function(resolve) { setTimeout(resolve, MoneroUtils.WALLET_REFRESH_RATE); }); // TODO: this lets block slip, okay?
            
            // get incoming/outgoing txs with sent ids
            let txQuery = new MoneroTxQuery();
            txQuery.setTxIds(sentTxs.map(sentTx => sentTx.getId())); // TODO: convenience methods wallet.getTxById(), getTxsById()?
            let fetchedTxs = await that._getAndTestTxs(that.wallet, txQuery, true);
            assert(fetchedTxs.length > 0);
            
            // test fetched txs
            await testOutInPairs(that.wallet, fetchedTxs, request, false);

            // merge fetched txs into updated txs and original sent txs
            for (let fetchedTx of fetchedTxs) {
              
              // merge with updated txs
              if (updatedTxs === undefined) updatedTxs = fetchedTxs;
              else {
                for (let updatedTx of updatedTxs) {
                  if (fetchedTx.getId() !== updatedTx.getId()) continue;
                  if (!!fetchedTx.getOutgoingTransfer() !== !!updatedTx.getOutgoingTransfer()) continue;  // skip if directions are different
                  updatedTx.merge(fetchedTx.copy());
                  if (!updatedTx.getBlock() && fetchedTx.getBlock()) updatedTx.setBlock(fetchedTx.getBlock().copy().setTxs([updatedTx]));  // copy block for testing
                }
              }
              
              // merge with original sent txs
              for (let sentTx of sentTxs) {
                if (fetchedTx.getId() !== sentTx.getId()) continue;
                if (!!fetchedTx.getOutgoingTransfer() !== !!sentTx.getOutgoingTransfer()) continue; // skip if directions are different
                sentTx.merge(fetchedTx.copy());  // TODO: it's mergeable but tests don't account for extra info from send (e.g. hex) so not tested; could specify in test context
              }
            }
            
            // test updated txs
            testGetTxsStructure(updatedTxs, request);
            await testOutInPairs(that.wallet, updatedTxs, request, false);
            
            // update confirmations in order to exit loop
            numConfirmations = fetchedTxs[0].getNumConfirmations();
          }
        } catch (e) {
          err = e;
        }
        
        // stop mining
        try { await that.wallet.stopMining(); }
        catch (e) { }
        
        // throw error if there was one
        if (err) throw err;
      }
      
      async function testOutInPairs(wallet, txs, request, isSendResponse) {
        
        // for each out tx
        let txOut;
        for (let tx of txs) {
          await testUnlockTx(that.wallet, tx, request, isSendResponse);
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
        assert.equal(txIn.isConfirmed(), txOut.isConfirmed());
        assert.equal(txOut.getOutgoingAmount().compare(txIn.getIncomingAmount()), 0);
      }
      
      async function testUnlockTx(wallet, tx, sendRequest, isSendResponse) {
        try {
          await that._testTxWallet(tx, {wallet: that.wallet, sendRequest: sendRequest, isSendResponse: isSendResponse});
        } catch (e) {
          console.log(tx.toString());
          throw e;
        }
      }
      
      //  ----------------------------- TEST RELAYS ---------------------------
      
      if (config.testRelays)
      it("Can send to external address", async function() {
        
        // collect balances before
        let balance1 = await that.wallet.getBalance();
        let unlockedBalance1 = await that.wallet.getUnlockedBalance();
        
        // send funds to external address
        let tx = (await that.wallet.send(0, await TestUtils.getRandomWalletAddress(), TestUtils.MAX_FEE.multiply(new BigInteger(3)))).getTxs()[0];
        
        // collect balances after
        let balance2 = await that.wallet.getBalance();
        let unlockedBalance2 = await that.wallet.getUnlockedBalance();
        
        // test balances
        assert(unlockedBalance2.compare(unlockedBalance1) < 0); // unlocked balance should decrease
        let expectedBalance = balance1.subtract(tx.getOutgoingAmount().subtract(tx.getFee()));
        assert.equal(balance2, expectedBalance, "Balance after send was not balance before - net tx amount - fee (5 - 1 != 4 test)");
      });
      
      if (config.testRelays)
      it("Can send from multiple subaddresses in a single transaction", async function() {
        await testSendFromMultiple();
      });
      
      if (config.testRelays)
      it("Can send from multiple subaddresses in split transactions", async function() {
        await testSendFromMultiple(new MoneroSendRequest().setCanSplit(true));
      });
      
      async function testSendFromMultiple(request) {
        await TestUtils.TX_POOL_WALLET_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        if (!request) request = new MoneroSendRequest();
        
        let NUM_SUBADDRESSES = 2; // number of subaddresses to send from
        
        // get first account with (NUM_SUBADDRESSES + 1) subaddresses with unlocked balances
        let accounts = await that.wallet.getAccounts(true);
        assert(accounts.length >= 2, "This test requires at least 2 accounts; run send-to-multiple tests");
        let srcAccount;
        let unlockedSubaddresses = [];
        let hasBalance = false;
        for (let account of accounts) {
          unlockedSubaddresses = [];
          let numSubaddressBalances = 0;
          for (let subaddress of account.getSubaddresses()) {
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
          fromSubaddressIndices.push(unlockedSubaddresses[i].getIndex());
        }
        
        // determine the amount to send (slightly less than the sum to send from)
        let sendAmount = new BigInteger(0);
        for (let fromSubaddressIdx of fromSubaddressIndices) {
          sendAmount = sendAmount.add(srcAccount.getSubaddresses()[fromSubaddressIdx].getUnlockedBalance()).subtract(TestUtils.MAX_FEE);
        }
        
        // send from the first subaddresses with unlocked balances
        let address = await that.wallet.getPrimaryAddress();
        request.setDestinations([new MoneroDestination(address, sendAmount)]);
        request.setAccountIndex(srcAccount.getIndex());
        request.setSubaddressIndices(fromSubaddressIndices);
        let reqCopy = request.copy();
        let txs = [];
        if (request.getCanSplit() !== false) {
          let txSet = await that.wallet.sendSplit(request);
          for (let tx of txSet.getTxs()) txs.push(tx);
        } else {
          let txSet = await that.wallet.send(request);
          for (let tx of txSet.getTxs()) txs.push(tx);
        }
        if (request.getCanSplit() === false) assert.equal(txs.length, 1);  // must have exactly one tx if no split
        
        // test that request is unchanged
        assert(reqCopy !== request);
        assert.deepEqual(request, reqCopy);
        
        // test that balances of intended subaddresses decreased
        let accountsAfter = await that.wallet.getAccounts(true);
        assert.equal(accountsAfter.length, accounts.length);
        for (let i = 0; i < accounts.length; i++) {
          assert.equal(accountsAfter[i].getSubaddresses().length, accounts[i].getSubaddresses().length);
          for (let j = 0; j < accounts[i].getSubaddresses().length; j++) {
            let subaddressBefore = accounts[i].getSubaddresses()[j];
            let subaddressAfter = accountsAfter[i].getSubaddresses()[j];
            if (i === srcAccount.getIndex() && fromSubaddressIndices.includes(j)) {
              assert(subaddressAfter.getUnlockedBalance().compare(subaddressBefore.getUnlockedBalance()) < 0, "Subaddress [" + i + "," + j + "] unlocked balance should have decreased but started at " + subaddressBefore.getUnlockedBalance().toString() + " and ended at " + subaddressAfter.getUnlockedBalance().toString()); // TODO: Subaddress [0,1] unlocked balance should have decreased          
            } else {
              assert(subaddressAfter.getUnlockedBalance().compare(subaddressBefore.getUnlockedBalance()) === 0, "Subaddress [" + i + "," + j + "] unlocked balance should not have changed");          
            }
          }
        }
        
        // test each transaction
        assert(txs.length > 0);
        let outgoingSum = new BigInteger(0);
        for (let tx of txs) {
          await that._testTxWallet(tx, {wallet: that.wallet, sendRequest: request, isSendResponse: true});
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
      
      if (config.testRelays)
      it("Can send to an address in a single transaction.", async function() {
        await testSendToSingle(new MoneroSendRequest().setCanSplit(false));
      });
      
      // NOTE: this test will be invalid when payment ids are fully removed
      if (config.testRelays)
      it("Can send to an address in a single transaction with a payment id.", async function() {
        let integratedAddress = await that.wallet.getIntegratedAddress();
        let paymentId = integratedAddress.getPaymentId();
        await testSendToSingle(new MoneroSendRequest().setCanSplit(false).setPaymentId(paymentId + paymentId + paymentId + paymentId));  // 64 character payment id
      });
      
      if (config.testRelays)
      it("Can send to an address in a single transaction with a ring size", async function() {
        await testSendToSingle(new MoneroSendRequest().setCanSplit(false).setRingSize(8)); // TODO monero-wallet-rpc: wallet rpc transfer and sweep calls are not rejecting low ring sizes, like 8.  should they?
      });
      
      if (config.testRelays)
      it("Can send to an address with split transactions", async function() {
        await testSendToSingle(new MoneroSendRequest().setCanSplit(true));
      });
      
      if (config.testRelays)
      it("Can create then relay a transaction to send to a single address", async function() {
        await testSendToSingle(new MoneroSendRequest().setCanSplit(false).setDoNotRelay(true));
      });
      
      if (config.testRelays)
      it("Can create then relay split transactions to send to a single address", async function() {
        await testSendToSingle(new MoneroSendRequest().setCanSplit(true).setDoNotRelay(true));
      });
      
      async function testSendToSingle(request) {
        await TestUtils.TX_POOL_WALLET_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        if (!request) request = new MoneroSendRequest();
        
        // find a non-primary subaddress to send from
        let sufficientBalance = false;
        let fromAccount = undefined;
        let fromSubaddress = undefined;
        let accounts = await that.wallet.getAccounts(true);
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
          if (fromAccount != undefined) break;
        }
        assert(sufficientBalance, "No non-primary subaddress found with sufficient balance");
        assert(fromSubaddress !== undefined, "Wallet is waiting on unlocked funds");
        
        // get balance before send
        let balanceBefore = fromSubaddress.getBalance();
        let unlockedBalanceBefore  = fromSubaddress.getUnlockedBalance();
        
        // init send request
        let sendAmount = unlockedBalanceBefore.subtract(TestUtils.MAX_FEE).divide(new BigInteger(SEND_DIVISOR));
        let address = await that.wallet.getPrimaryAddress();
        let txs = []
        request.setDestinations([new MoneroDestination(address, sendAmount)]);
        request.setAccountIndex(fromAccount.getIndex());
        request.setSubaddressIndices([fromSubaddress.getIndex()]);
        let reqCopy = request.copy();
        
        // send to self
        // can use create() or send() because request's doNotRelay is used, but exercise both calls
        if (request.getCanSplit() !== false) {
          let txSet = await (request.getDoNotRelay() ? that.wallet.createTxs(request) : that.wallet.sendSplit(request));
          for (let tx of txSet.getTxs()) txs.push(tx);
        } else {
          let txSet = await (request.getDoNotRelay() ? that.wallet.createTx(request) : that.wallet.send(request));
          for (let tx of txSet.getTxs()) txs.push(tx);
        }
        if (request.getCanSplit() === false) assert.equal(txs.length, 1);  // must have exactly one tx if no split
        
        // test that request is unchanged
        assert(reqCopy !== request);
        assert.deepEqual(request, reqCopy);
        
        // test common tx set among txs
        testCommonTxSets(txs, false, false, false);
        
        // handle non-relayed transaction
        if (request.getDoNotRelay()) {
          
          // test transactions
          for (let tx of txs) {
            await that._testTxWallet(tx, {wallet: that.wallet, sendRequest: request, isSendResponse: true});
          }
          
          // txs are not in the pool
          for (let txCreated of txs) {
            for (let txPool of await daemon.getTxPool()) {
              assert(txPool.getId() !== txCreated.getId(), "Created tx should not be in the pool");
            }
          }
          
          // relay txs
          let txIds;
          if (request.getCanSplit() !== true) txIds = [await that.wallet.relayTx(txs[0])]; // test relayTx() with single transaction
          else {
            let txMetadatas = [];
            for (let tx of txs) txMetadatas.push(tx.getMetadata());
            txIds = await that.wallet.relayTxs(txMetadatas); // test relayTxs() with potentially multiple transactions
          }  
          for (let txId of txIds) assert(typeof txId === "string" && txId.length === 64);
          
          // fetch txs for testing
          txs = await that.wallet.getTxs({txIds: txIds});
        }
        
        // test that balance and unlocked balance decreased
        // TODO: test that other balances did not decrease
        let subaddress = await that.wallet.getSubaddress(fromAccount.getIndex(), fromSubaddress.getIndex());
        assert(subaddress.getBalance().compare(balanceBefore) < 0);
        assert(subaddress.getUnlockedBalance().compare(unlockedBalanceBefore) < 0);
        
        // test transactions
        assert(txs.length > 0);
        for (let tx of txs) {
          await that._testTxWallet(tx, {wallet: that.wallet, sendRequest: request, isSendResponse: request.getDoNotRelay() ? false : true});
          assert.equal(tx.getOutgoingTransfer().getAccountIndex(), fromAccount.getIndex());
          assert.equal(tx.getOutgoingTransfer().getSubaddressIndices().length, 1);
          assert.equal(tx.getOutgoingTransfer().getSubaddressIndices()[0], fromSubaddress.getIndex());
          assert(sendAmount.compare(tx.getOutgoingAmount()) === 0);
          if (request.getPaymentId()) assert.equal(request.getPaymentId(), tx.getPaymentId());
          
          // test outgoing destinations
          if (tx.getOutgoingTransfer() && tx.getOutgoingTransfer().getDestinations()) {
            assert.equal(tx.getOutgoingTransfer().getDestinations().length, 1);
            for (let destination of tx.getOutgoingTransfer().getDestinations()) {
              assert.equal(destination.getAddress(), address);
              assert(sendAmount.compare(destination.getAmount()) === 0);
            }
          }
        }
        
        // if tx was relayed, all wallets will need to wait for tx to confirm in order to reliably sync
        if (request.getDoNotRelay() === true) {
          await TestUtils.TX_POOL_WALLET_TRACKER.reset(); // TODO: resetExcept(that.wallet), or does this test wallet also need to be waited on?
        }
      }
      
      if (config.testRelays)
      it("Can send to multiple addresses in a single transaction", async function() {
        await testSendToMultiple(5, 3, false);
      });
      
      if (config.testRelays)
      it("Can send to multiple addresses in split transactions", async function() {
        await testSendToMultiple(3, 5, true);
      });
      
      if (config.testRelays)
      it("Can send to multiple addresses in split transactions using a JavaScript object for configuration", async function() {
        await testSendToMultiple(1, 15, true, undefined, true);
      });
      
      if (config.testRelays)
      it("Can send dust to multiple addresses in split transactions", async function() {
        let dustAmt = (await daemon.getFeeEstimate()).divide(new BigInteger(2));
        await testSendToMultiple(5, 3, true, dustAmt);
      });
      
      /**
       * Sends funds from the first unlocked account to multiple accounts and subaddresses.
       * 
       * @param numAccounts is the number of accounts to receive funds
       * @param numSubaddressesPerAccount is the number of subaddresses per account to receive funds
       * @param canSplit specifies if the operation can be split into multiple transactions
       * @param sendAmountPerSubaddress is the amount to send to each subaddress (optional, computed if not given)
       * @param useJsConfig specifies if the api should be invoked with a JS object instead of a MoneroSendRequest
       */
      async function testSendToMultiple(numAccounts, numSubaddressesPerAccount, canSplit, sendAmountPerSubaddress, useJsConfig) {
        await TestUtils.TX_POOL_WALLET_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        
        // compute the minimum account unlocked balance needed in order to fulfill the request
        let minAccountAmount;
        let totalSubaddresses = numAccounts * numSubaddressesPerAccount;
        if (sendAmountPerSubaddress !== undefined) minAccountAmount = new BigInteger(totalSubaddresses).multiply(sendAmountPerSubaddress.add(TestUtils.MAX_FEE)); // min account amount must cover the total amount being sent plus the tx fee = numAddresses * (amtPerSubaddress + fee)
        else minAccountAmount = TestUtils.MAX_FEE.multiply(new BigInteger(totalSubaddresses)).multiply(new BigInteger(SEND_DIVISOR)).add(TestUtils.MAX_FEE); // account balance must be more than fee * numAddresses * divisor + fee so each destination amount is at least a fee's worth (so dust is not sent)
        
        // send funds from first account with sufficient unlocked funds
        let srcAccount;
        let hasBalance = false;
        for (let account of await that.wallet.getAccounts()) {
          if (account.getBalance().compare(minAccountAmount) > 0) hasBalance = true;
          if (account.getUnlockedBalance().compare(minAccountAmount) > 0) {
            srcAccount = account;
            break;
          }
        }
        assert(hasBalance, "Wallet does not have enough balance; load '" + TestUtils.WALLET_RPC_NAME_1 + "' with XMR in order to test sending");
        assert(srcAccount, "Wallet is waiting on unlocked funds");
        let balance = srcAccount.getBalance();
        let unlockedBalance = srcAccount.getUnlockedBalance();
        
        // get amount to send total and per subaddress
        let sendAmount;
        if (sendAmountPerSubaddress === undefined) {
          sendAmount = unlockedBalance.subtract(TestUtils.MAX_FEE).divide(new BigInteger(SEND_DIVISOR));
          sendAmountPerSubaddress = sendAmount.divide(new BigInteger(totalSubaddresses));
        } else {
          sendAmount = sendAmountPerSubaddress.multiply(new BigInteger(totalSubaddresses));
        }
        
        // create minimum number of accounts
        let accounts = await that.wallet.getAccounts();
        for (let i = 0; i < numAccounts - accounts.length; i++) {
          await that.wallet.createAccount();
        }
        
        // create minimum number of subaddresses per account and collect destination addresses
        let destinationAddresses = [];
        for (let i = 0; i < numAccounts; i++) {
          let subaddresses = await that.wallet.getSubaddresses(i);
          for (let j = 0; j < numSubaddressesPerAccount - subaddresses.length; j++) await that.wallet.createSubaddress(i);
          subaddresses = await that.wallet.getSubaddresses(i);
          assert(subaddresses.length >= numSubaddressesPerAccount);
          for (let j = 0; j < numSubaddressesPerAccount; j++) destinationAddresses.push(subaddresses[j].getAddress());
        }
        
        // build send request using MoneroSendRequest
        let request = new MoneroSendRequest();
        request.setMixin(TestUtils.MIXIN);
        request.setAccountIndex(srcAccount.getIndex());
        request.setDestinations([]);
        request.setCanSplit(canSplit);
        for (let i = 0; i < destinationAddresses.length; i++) {
          request.getDestinations().push(new MoneroDestination(destinationAddresses[i], sendAmountPerSubaddress));
        }
        let reqCopy = request.copy();
        
        // build send request with JS object
        let jsConfig;
        if (useJsConfig) {
          jsConfig = {};
          jsConfig.mixin = TestUtils.MIXIN;
          jsConfig.accountIndex = srcAccount.getIndex();
          jsConfig.destinations = [];
          for (let i = 0; i < destinationAddresses.length; i++) {
            jsConfig.destinations.push({address: destinationAddresses[i], amount: sendAmountPerSubaddress});
          }
        }
        
        // send tx(s) with request xor js object
        let txs = [];
        if (canSplit) {
          let txSet = await that.wallet.sendSplit(useJsConfig ? jsConfig : request);
          for (let tx of txSet.getTxs()) txs.push(tx);
        } else {
          let txSet = await that.wallet.send(useJsConfig ? jsConfig : request)
          for (let tx of txSet.getTxs()) txs.push(tx);
        }
        
        // test that request is unchanged
        assert(reqCopy !== request);
        assert.deepEqual(request, reqCopy);
        
        // test that wallet balance decreased
        let account = await that.wallet.getAccount(srcAccount.getIndex());
        assert(account.getBalance().compare(balance) < 0);
        assert(account.getUnlockedBalance().compare(unlockedBalance) < 0);
        
        // test each transaction
        assert(txs.length > 0);
        let outgoingSum = new BigInteger(0);
        for (let tx of txs) {
          await that._testTxWallet(tx, {wallet: that.wallet, sendRequest: request, isSendResponse: true});
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
      
      if (config.testRelays)
      it("Can sweep individual outputs identified by their key images", async function() {
        await TestUtils.TX_POOL_WALLET_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        
        // test config
        let numOutputs = 3;
        
        // get outputs to sweep (not spent, unlocked, and amount >= fee)
        let spendableUnlockedOutputs = await that.wallet.getOutputs(new MoneroOutputQuery().setIsSpent(false).setIsUnlocked(true));
        let outputsToSweep = [];
        for (let i = 0; i < spendableUnlockedOutputs.length && outputsToSweep.length < numOutputs; i++) {
          if (spendableUnlockedOutputs[i].getAmount().compare(TestUtils.MAX_FEE) > 0) outputsToSweep.push(spendableUnlockedOutputs[i]);  // output cannot be swept if amount does not cover fee
        }
        assert(outputsToSweep.length >= numOutputs, "Wallet does not have enough sweepable outputs; run send tests");
        
        // sweep each output by key image
        let useParams = true; // for loop flips in order to alternate test
        for (let output of outputsToSweep) {
          testOutputWallet(output);
          assert(!output.isSpent());
          assert(output.isUnlocked());
          if (output.getAmount().compare(TestUtils.MAX_FEE) <= 0) continue;
          
          // sweep output to address
          let address = await that.wallet.getAddress(output.getAccountIndex(), output.getSubaddressIndex());
          let request = new MoneroSendRequest(address).setKeyImage(output.getKeyImage().getHex());
          let txSet;
          if (useParams) txSet = await that.wallet.sweepOutput(address, output.getKeyImage().getHex(), undefined); // test params
          else txSet = await that.wallet.sweepOutput(request);  // test request
          
          // test resulting tx
          assert.equal(txSet.getTxs().length, 1);
          await that._testTxWallet(txSet.getTxs()[0], {wallet: that.wallet, sendRequest: request, isSendResponse: true, isSweepResponse: true, isSweepOutputResponse: true});
          useParams = !useParams;
        }
        
        // get outputs after sweeping
        let afterOutputs = await that.wallet.getOutputs();
        
        // swept output are now spent
        for (let afterOutput of afterOutputs) {
          for (let output of outputsToSweep) {
            if (output.getKeyImage().getHex() === afterOutput.getKeyImage().getHex()) {
              assert(afterOutput.isSpent(), "Output should be spent");
            }
          }
        }
      });
      
      if (config.testRelays)
      it("Can sweep dust without relaying", async function() {
        await TestUtils.TX_POOL_WALLET_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        
        // generate non-relayed transactions to sweep dust
        let txs;
        try {
          txs = (await that.wallet.sweepDust(true)).getTxs();
        } catch (e) {
          assert.equal(e.message, "No dust to sweep");
          return;
        }
        
        // test txs
        let ctx = {sendRequest: new MoneroSendRequest().setDoNotRelay(true), isSendResponse: true, isSweepResponse: true};
        for (let tx of txs) {
          await that._testTxWallet(tx, ctx);
        }
        
        // relay txs
        let metadatas = [];
        for (let tx of txs) metadatas.push(tx.getMetadata());
        let txIds = await that.wallet.relayTxs(metadatas);
        assert.equal(txs.length, txIds.length);
        for (let txId of txIds) assert.equal(txId.length, 64);
        
        // fetch and test txs
        txs = wallet.getTxs(new MoneroTxQuery().setTxIds(txIds));
        ctx.sendRequest.setDoNotRelay(false);
        for (let tx of txs) {
          await that._testTxWallet(tx, ctx);
        }
      });
      
      if (config.testRelays)
      it("Can sweep dust", async function() {
        await TestUtils.TX_POOL_WALLET_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        
        // sweep dust which will throw exception if no dust to sweep (dust does not exist after rct) 
        let txs;
        try {
          txs = (await that.wallet.sweepDust()).getTxs();
        } catch (e) {
          assert.equal(e.message, "No dust to sweep");
          return;
        }
        
        // if dust swept, test txs
        let ctx = {wallet: that.wallet, isSendResponse: true, isSweepResponse: true};
        assert(txs.length > 0);
        for (let tx of txs) {
          await that._testTxWallet(tx, ctx);
        }
      });
      
      if (config.testRelays && !config.liteMode)
      it("Supports multisig wallets", async function() {
        let err;
        try {
          
          // test n/n
          await that._testMultisig(2, 2, false);
          //_testMultisig(3, 3, false);
          //_testMultisig(4, 4, false);
          
          // test (n-1)/n
          await that._testMultisig(2, 3, false);
          //_testMultisig(3, 4, false);
          //_testMultisig(5, 6, false);
          
          // test m/n
          await that._testMultisig(2, 4, true);
          //_testMultisig(3, 5, false);
          //_testMultisig(3, 7, false);
        } catch (e) {
          err = e;
        }
        
        // stop mining at end of test
        try { await daemon.stopMining(); }
        catch (e) { }
        
        // throw error if there was one
        if (err) throw err;
      });
      
      // ---------------------------- TEST RESETS -----------------------------
      
      if (config.testResets)
      it("Can sweep subaddresses", async function() {
        await TestUtils.TX_POOL_WALLET_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        
        const NUM_SUBADDRESSES_TO_SWEEP = 2;
        
        // collect subaddresses with balance and unlocked balance
        let subaddresses = [];
        let subaddressesBalance = [];
        let subaddressesUnlocked = [];
        for (let account of await that.wallet.getAccounts(true)) {
          if (account.getIndex() === 0) continue;  // skip default account
          for (let subaddress of account.getSubaddresses()) {
            subaddresses.push(subaddress);
            if (subaddress.getBalance().compare(new BigInteger(0)) > 0) subaddressesBalance.push(subaddress);
            if (subaddress.getUnlockedBalance().compare(new BigInteger(0)) > 0) subaddressesUnlocked.push(subaddress);
          }
        }
        
        // test requires at least one more subaddresses than the number being swept to verify it does not change
        assert(subaddressesBalance.length >= NUM_SUBADDRESSES_TO_SWEEP + 1, "Test requires balance in at least " + (NUM_SUBADDRESSES_TO_SWEEP + 1) + " subaddresses from non-default acccount; run send-to-multiple tests");
        assert(subaddressesUnlocked.length >= NUM_SUBADDRESSES_TO_SWEEP + 1, "Wallet is waiting on unlocked funds");
        
        // sweep from first unlocked subaddresses
        for (let i = 0; i < NUM_SUBADDRESSES_TO_SWEEP; i++) {
          
          // sweep unlocked account
          let unlockedSubaddress = subaddressesUnlocked[i];
          let txSet = await that.wallet.sweepSubaddress(unlockedSubaddress.getAccountIndex(), unlockedSubaddress.getIndex(), await that.wallet.getPrimaryAddress());
          
          // test transactions
          let txs = txSet.getTxs();
          assert(txs.length > 0);
          for (let tx of txs) {
            assert(txSet === tx.getTxSet());
            let request = new MoneroSendRequest(await that.wallet.getPrimaryAddress());
            request.setAccountIndex(unlockedSubaddress.getAccountIndex());
            request.setSubaddressIndices([unlockedSubaddress.getIndex()]);
            await that._testTxWallet(tx, {wallet: that.wallet, sendRequest: request, isSendResponse: true, isSweepResponse: true});
          }
          
          // assert no unlocked funds in subaddress
          let subaddress = await that.wallet.getSubaddress(unlockedSubaddress.getAccountIndex(), unlockedSubaddress.getIndex());
          assert(subaddress.getUnlockedBalance().compare(new BigInteger(0)) === 0);
        }
        
        // test subaddresses after sweeping
        let subaddressesAfter = [];
        for (let account of await that.wallet.getAccounts(true)) {
          if (account.getIndex() === 0) continue;  // skip default account
          for (let subaddress of account.getSubaddresses()) {
            subaddressesAfter.push(subaddress);
          }
        }
        assert.equal(subaddressesAfter.length, subaddresses.length);
        for (let i = 0; i < subaddresses.length; i++) {
          let subaddressBefore = subaddresses[i];
          let subaddressAfter = subaddressesAfter[i];
          
          // determine if subaddress was swept
          let swept = false;
          for (let j = 0; j < NUM_SUBADDRESSES_TO_SWEEP; j++) {
            if (subaddressesUnlocked[j].getAccountIndex() === subaddressBefore.getAccountIndex() && subaddressesUnlocked[j].getIndex() === subaddressBefore.getIndex()) {
              swept = true;
              break;
            }
          }
          
          // test that unlocked balance is 0 if swept, unchanged otherwise
          if (swept) {
            assert(subaddressAfter.getUnlockedBalance().compare(BigInteger.valueOf(0)) === 0);
          } else {
            assert(subaddressBefore.getUnlockedBalance().compare(subaddressAfter.getUnlockedBalance()) === 0);
          }
        }
      });
      
      if (config.testResets)
      it("Can sweep accounts", async function() {
        await TestUtils.TX_POOL_WALLET_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        const NUM_ACCOUNTS_TO_SWEEP = 1;
        
        // collect accounts with sufficient balance and unlocked balance to cover the fee
        let accounts = await that.wallet.getAccounts(true);
        let accountsBalance = [];
        let accountsUnlocked = [];
        for (let account of accounts) {
          if (account.getBalance().compare(TestUtils.MAX_FEE) > 0) accountsBalance.push(account);
          if (account.getUnlockedBalance().compare(TestUtils.MAX_FEE) > 0) accountsUnlocked.push(account);
        }
        
        // test requires at least one more accounts than the number being swept to verify it does not change
        assert(accountsBalance.length >= NUM_ACCOUNTS_TO_SWEEP + 1, "Test requires balance greater than the fee in at least " + (NUM_ACCOUNTS_TO_SWEEP + 1) + " non-default accounts; run send-to-multiple tests");
        assert(accountsUnlocked.length >= NUM_ACCOUNTS_TO_SWEEP + 1, "Wallet is waiting on unlocked funds");
        
        // sweep from first unlocked accounts
        for (let i = 0; i < NUM_ACCOUNTS_TO_SWEEP; i++) {
          
          // sweep unlocked account
          let accountUnlocked = accountsUnlocked[i];
          let txs = (await that.wallet.sweepAccount(accountUnlocked.getIndex(), await that.wallet.getPrimaryAddress())).getTxs();
          
          // test transactions
          assert(txs.length > 0);
          for (let tx of txs) {
            let request = new MoneroSendRequest(await that.wallet.getPrimaryAddress());
            request.setAccountIndex(accountUnlocked.getIndex());
            await that._testTxWallet(tx, {wallet: that.wallet, sendRequest: request, isSendResponse: true, isSweepResponse: true});
          }
          
          // assert no unlocked funds in account
          let account = await that.wallet.getAccount(accountUnlocked.getIndex());
          assert.equal(account.getUnlockedBalance().toJSValue(), 0);
        }
        
        // test accounts after sweeping
        let accountsAfter = await that.wallet.getAccounts(true);
        assert.equal(accountsAfter.length, accounts.length);
        for (let i = 1; i < accounts.length; i++) {
          let accountBefore = accounts[i];
          let accountAfter = accountsAfter[i];
          
          // determine if account was swept
          let swept = false;
          for (let j = 0; j < NUM_ACCOUNTS_TO_SWEEP; j++) {
            if (accountsUnlocked[j].getIndex() === accountBefore.getIndex()) {
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
      
      if (config.testResets)
      it("Can sweep the whole wallet by accounts", async function() {
        assert(false, "Are you sure you want to sweep the whole wallet?");
        await _testSweepWallet();
      });
      
      if (config.testResets)
      it("Can sweep the whole wallet by subaddresses", async function() {
        assert(false, "Are you sure you want to sweep the whole wallet?");
        await _testSweepWallet(true);
      });
      
      async function _testSweepWallet(sweepEachSubaddress) {
        await TestUtils.TX_POOL_WALLET_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        
        // verify 2 subaddresses with enough unlocked balance to cover the fee
        let subaddressesBalance = [];
        let subaddressesUnlocked = [];
        for (let account of await that.wallet.getAccounts(true)) {
          for (let subaddress of account.getSubaddresses()) {
            if (subaddress.getBalance().compare(TestUtils.MAX_FEE) > 0) subaddressesBalance.push(subaddress);
            if (subaddress.getUnlockedBalance().compare(TestUtils.MAX_FEE) > 0) subaddressesUnlocked.push(subaddress);
          }
        }
        assert(subaddressesBalance.length >= 2, "Test requires multiple accounts with a balance greater than the fee; run send to multiple first");
        assert(subaddressesUnlocked.length >= 2, "Wallet is waiting on unlocked funds");
        
        // sweep
        let destination = await that.wallet.getPrimaryAddress();
        let req = new MoneroSendRequest(destination).setSweepEachSubaddress(sweepEachSubaddress);
        let txSets = await that.wallet.sweepUnlocked(req);
        let txs = [];
        for (let txSet of txSets) {
          assert.equal(txSet.getMultisigTxHex(), undefined);
          assert.equal(txSet.getSignedTxHex(), undefined);
          assert.equal(txSet.getUnsignedTxHex(), undefined);
          for (let tx of txSet.getTxs()) txs.push(tx);
        }
        assert(txs.length > 0);
        for (let tx of txs) {
          let request = new MoneroSendRequest(destination);
          request.setAccountIndex(tx.getOutgoingTransfer().getAccountIndex());
          request.setSweepEachSubaddress(sweepEachSubaddress);
          await that._testTxWallet(tx, {wallet: that.wallet, sendRequest: request, isSendResponse: true, isSweepResponse: true});
        }
        
        // all unspent, unlocked outputs must be less than fee
        let spendableOutputs = await that.wallet.getOutputs(new MoneroOutputQuery().setIsSpent(false).setIsUnlocked(true));
        for (let spendableOutput of spendableOutputs) {
          assert(spendableOutput.getAmount().compare(TestUtils.MAX_FEE) < 0, "Unspent output should have been swept\n" + spendableOutput.toString());
        }
        
        // all subaddress unlocked balances must be less than fee
        subaddressesBalance = [];
        subaddressesUnlocked = [];
        for (let account of await that.wallet.getAccounts(true)) {
          for (let subaddress of account.getSubaddresses()) {
            assert(subaddress.getUnlockedBalance().compare(TestUtils.MAX_FEE) < 0, "No subaddress should have more unlocked than the fee");
          }
        }
      }
      
      // disabled so tests don't delete local cache
      if (config.testResets)
      it("Can rescan the blockchain", async function() {
        assert(false, "Are you sure you want to discard local wallet data and rescan the blockchain?");
        await that.wallet.rescanBlockchain();
        for (let tx of await that.wallet.getTxs()) {
          await that._testTxWallet(tx);
        }
      });
    });
  }
  
  // -------------------------------- PRIVATE ---------------------------------

  async getSubaddressesWithBalance() {
    let subaddresses = [];
    for (let account of await this.wallet.getAccounts(true)) {
      for (let subaddress of account.getSubaddresses()) {
        if (subaddress.getBalance().toJSValue() > 0) subaddresses.push(subaddress);
      }
    }
    return subaddresses;
  }

  async getSubaddressesWithUnlockedBalance() {
    let subaddresses = [];
    for (let account of await this.wallet.getAccounts(true)) {
      for (let subaddress of account.getSubaddresses()) {
        if (subaddress.getUnlockedBalance().toJSValue() > 0) subaddresses.push(subaddress);
      }
    }
    return subaddresses;
  }
  
  async _testGetSubaddressAddressOutOfRange() {
    let accounts = await this.wallet.getAccounts(true);
    let accountIdx = accounts.length - 1;
    let subaddressIdx = accounts[accountIdx].getSubaddresses().length;
    let address = await this.wallet.getAddress(accountIdx, subaddressIdx);
    assert.notEqual(address, undefined);  // subclass my override with custom behavior (e.g. jni returns subaddress but wallet rpc does not)
    assert(address.length > 0);
  }
  
  /**
   * Fetches and tests transactions according to the given query.
   * 
   * TODO: convert query to query object and ensure each tx passes filter, same with getAndTestTransfer, getAndTestOutputs
   */
  async _getAndTestTxs(wallet, query, isExpected) {
    let copy;
    if (query !== undefined) {
      if (query instanceof MoneroTxQuery) copy = query.copy();
      else copy = Object.assign({}, query);
    }
    let txs = await wallet.getTxs(query);
    assert(Array.isArray(txs));
    if (isExpected === false) assert.equal(txs.length, 0);
    if (isExpected === true) assert(txs.length > 0);
    for (let tx of txs) await this._testTxWallet(tx, Object.assign({wallet: wallet}, query));
    testGetTxsStructure(txs, query);
    if (query !== undefined) assert.deepEqual(query, copy);
    return txs;
  }

  /**
   * Fetches and tests transfers according to the given query.
   */
  async _getAndTestTransfers(wallet, query, isExpected) {
    let copy;
    if (query !== undefined) {
      if (query instanceof MoneroTransferQuery) copy = query.copy();
      else copy = Object.assign({}, query);
    }
    let transfers = await wallet.getTransfers(query);
    assert(Array.isArray(transfers));
    if (isExpected === false) assert.equal(transfers.length, 0);
    if (isExpected === true) assert(transfers.length > 0, "Transactions were expected but not found; run send tests?");
    for (let transfer of transfers) await this._testTxWallet(transfer.getTx(), Object.assign({wallet: wallet}, query));
    if (query !== undefined) assert.deepEqual(query, copy);
    return transfers;
  }
  
  /**
   * Fetches and tests outputs according to the given query.
   */
  async _getAndTestOutputs(wallet, query, isExpected) {
    let copy;
    if (query !== undefined) {
      if (query instanceof MoneroOutputQuery) copy = query.copy();
      else copy = Object.assign({}, query);
    }
    let outputs = await wallet.getOutputs(query);
    assert(Array.isArray(outputs));
    if (isExpected === false) assert.equal(outputs.length, 0);
    if (isExpected === true) assert(outputs.length > 0, "Outputs were expected but not found; run send tests?");
    for (let output of outputs) testOutputWallet(output);
    if (query !== undefined) assert.deepEqual(query, copy);
    return outputs;
  }
  
  /**
   * Tests a wallet transaction with a test configuration.
   * 
   * @param tx is the wallet transaction to test
   * @param ctx specifies test configuration
   *        ctx.wallet is used to cross reference tx info if available
   *        ctx.sendRequest specifies the tx's originating send configuration
   *        ctx.isSendResponse indicates if the tx is built from a send response, which contains additional fields (e.g. key)
   *        ctx.hasDestinations specifies if the tx has an outgoing transfer with destinations, undefined if doesn't matter
   *        ctx.includeOutputs specifies if outputs were fetched and should therefore be expected with incoming transfers
   */
  async _testTxWallet(tx, ctx) {
    
    // validate / sanitize inputs
    ctx = Object.assign({}, ctx);
    delete ctx.wallet; // TODO: re-enable
    if (!(tx instanceof MoneroTxWallet)) {
      console.log("Tx is not a MoneroTxWallet!");
      console.log(tx);
    }
    assert(tx instanceof MoneroTxWallet);
    if (ctx.wallet) assert(ctx.wallet instanceof MoneroWallet);
    assert(ctx.hasDestinations == undefined || typeof ctx.hasDestinations === "boolean");
    if (ctx.isSendResponse === undefined || ctx.sendRequest === undefined) {
      assert.equal(ctx.isSendResponse, undefined, "if either sendRequest or isSendResponse is defined, they must both be defined");
      assert.equal(ctx.sendRequest, undefined, "if either sendRequest or isSendResponse is defined, they must both be defined");
    }
    
    // test common field types
    testTxWalletTypes(tx);
    
    // test confirmed
    if (tx.isConfirmed()) {
      assert(tx.getBlock());
      assert(tx.getBlock().getTxs().includes(tx));
      assert(tx.getBlock().getHeight() > 0);
      assert(tx.getBlock().getTimestamp() > 0);
      assert.equal(tx.isRelayed(), true);
      assert.equal(tx.isFailed(), false);
      assert.equal(tx.inTxPool(), false);
      assert.equal(tx.getDoNotRelay(), false);
      assert.equal(tx.isDoubleSpendSeen(), false);
      assert(tx.getNumConfirmations() > 0);
    } else {
      assert.equal(tx.getBlock(), undefined);
      assert.equal(tx.getNumConfirmations(), 0);
    }
    
    // test in tx pool
    if (tx.inTxPool()) {
      assert.equal(tx.isConfirmed(), false);
      assert.equal(tx.getDoNotRelay(), false);
      assert.equal(tx.isRelayed(), true);
      assert.equal(tx.isDoubleSpendSeen(), false); // TODO: test double spend attempt
      
      // these should be initialized unless a response from sending
      if (!ctx.isSendResponse) {
        //assert(tx.getReceivedTimestamp() > 0);    // TODO: re-enable when received timestamp returned in wallet rpc
      }
    } else {
      assert.equal(tx.getLastRelayedTimestamp(), undefined);
    }
    
    // test miner tx
    if (tx.isMinerTx()) {
      assert.equal(tx.getFee().compare(new BigInteger(0)), 0);
      assert(tx.getIncomingTransfers().length > 0);
    }
    
    // test failed  // TODO: what else to test associated with failed
    if (tx.isFailed()) {
      assert(tx.getOutgoingTransfer() instanceof MoneroTransfer);
      //assert(tx.getReceivedTimestamp() > 0);    // TODO: re-enable when received timestamp returned in wallet rpc
    } else {
      if (tx.isRelayed()) assert.equal(tx.isDoubleSpendSeen(), false);
      else {
        assert.equal(tx.isRelayed(), false);
        assert.equal(tx.getDoNotRelay(), true);
        assert.equal(tx.isDoubleSpendSeen(), undefined);
      }
    }
    assert.equal(tx.getLastFailedHeight(), undefined);
    assert.equal(tx.getLastFailedId(), undefined);
    
    // received time only for tx pool or failed txs
    if (tx.getReceivedTimestamp() !== undefined) {
      assert(tx.inTxPool() || tx.isFailed());
    }
    
    // test relayed tx
    if (tx.isRelayed()) assert.equal(tx.getDoNotRelay(), false);
    if (tx.getDoNotRelay()) assert(!tx.isRelayed());
    
    // test outgoing transfer per configuration
    if (ctx.isOutgoing === false) assert(tx.getOutgoingTransfer() === undefined);
    if (ctx.hasDestinations) assert(tx.getOutgoingTransfer() && tx.getOutgoingTransfer().getDestinations().length > 0);  // TODO: this was typo with getDestionations so is this actually being tested?
    
    // test outgoing transfer
    if (tx.getOutgoingTransfer()) {
      assert(tx.isOutgoing());
      testTransfer(tx.getOutgoingTransfer(), ctx);
      if (ctx.isSweepResponse) assert.equal(tx.getOutgoingTransfer().getDestinations().length, 1);
      
      // TODO: handle special cases
    } else {
      assert(tx.getIncomingTransfers().length > 0);
      assert.equal(tx.getOutgoingAmount(), undefined);
      assert.equal(tx.getOutgoingTransfer(), undefined);
      assert.equal(tx.getMixin(), undefined);
      assert.equal(tx.getFullHex(), undefined);
      assert.equal(tx.getMetadata(), undefined);
      assert.equal(tx.getKey(), undefined);
    }
    
    // test incoming transfers
    if (tx.getIncomingTransfers()) {
      assert(tx.isIncoming());
      assert(tx.getIncomingTransfers().length > 0);
      TestUtils.testUnsignedBigInteger(tx.getIncomingAmount());      
      assert.equal(tx.isFailed(), false);
      
      // test each transfer and collect transfer sum
      let transferSum = new BigInteger(0);
      for (let transfer of tx.getIncomingTransfers()) {
        testTransfer(transfer, ctx);
        transferSum = transferSum.add(transfer.getAmount());
        if (ctx.wallet) assert.equal(transfer.getAddress(), await ctx.wallet.getAddress(transfer.getAccountIndex(), transfer.getSubaddressIndex()));
        
        // TODO special case: transfer amount of 0
      }
      
      // incoming transfers add up to incoming tx amount
      assert.equal(transferSum.compare(tx.getIncomingAmount()), 0);
    } else {
      assert(tx.getOutgoingTransfer());
      assert.equal(tx.getIncomingAmount(), undefined);
      assert.equal(tx.getIncomingTransfers(), undefined);
    }
    
    // test tx results from send or relay
    if (ctx.isSendResponse) {
      
      // test tx set
      assert.notEqual(tx.getTxSet(), undefined);
      let found = false;
      for (let aTx of tx.getTxSet().getTxs()) {
        if (aTx === tx) {
          found = true;
          break;
        }
      }
      if (ctx.isCopy) assert(!found); // copy will not have back reference from tx set
      else assert(found);
      
      // test common attributes
      let request = ctx.sendRequest;
      assert.equal(tx.isConfirmed(), false);
      testTransfer(tx.getOutgoingTransfer(), ctx);
      assert.equal(tx.getMixin(), request.getMixin());
      assert.equal(tx.getUnlockTime(), request.getUnlockTime() ? request.getUnlockTime() : 0);
      assert.equal(tx.getBlock(), undefined);
      if (request.getCanSplit() === false) assert(tx.getKey().length > 0);
      else assert.equal(tx.getKey(), undefined); // tx key unknown if from split response
      assert.equal(typeof tx.getFullHex(), "string");
      assert(tx.getFullHex().length > 0);
      assert(tx.getMetadata());
      assert.equal(tx.getReceivedTimestamp(), undefined);
      
      // test destinations of sent tx
      assert.equal(tx.getOutgoingTransfer().getDestinations().length, request.getDestinations().length);
      for (let i = 0; i < request.getDestinations().length; i++) {
        assert.equal(tx.getOutgoingTransfer().getDestinations()[i].getAddress(), request.getDestinations()[i].getAddress());
        if (ctx.isSweepResponse) {
          assert.equal(request.getDestinations().length, 1);
          assert.equal(request.getDestinations()[i].getAmount(), undefined);
          assert.equal(tx.getOutgoingTransfer().getDestinations()[i].getAmount().toString(), tx.getOutgoingTransfer().getAmount().toString());
        } else {
          assert.equal(tx.getOutgoingTransfer().getDestinations()[i].getAmount().toString(), request.getDestinations()[i].getAmount().toString());
        }
      }
      
      // test relayed txs
      if (!request.getDoNotRelay()) {
        assert.equal(tx.inTxPool(), true);
        assert.equal(tx.getDoNotRelay(), false);
        assert.equal(tx.isRelayed(), true);
        assert(tx.getLastRelayedTimestamp() > 0);
        assert.equal(tx.isDoubleSpendSeen(), false);
      }
      
      // test non-relayed txs
      else {
        assert.equal(tx.inTxPool(), false);
        assert.equal(tx.getDoNotRelay(), true);
        assert.equal(tx.isRelayed(), false);
        assert.equal(tx.getLastRelayedTimestamp(), undefined);
        assert.equal(tx.isDoubleSpendSeen(), undefined);
      }
    }
    
    // test tx result query
    else {
      assert.equal(tx.getTxSet(), undefined);  // tx set only initialized on send responses
      assert.equal(tx.getMixin(), undefined);
      assert.equal(tx.getKey(), undefined);
      assert.equal(tx.getFullHex(), undefined);
      assert.equal(tx.getMetadata(), undefined);
      assert.equal(tx.getLastRelayedTimestamp(), undefined);
    }
    
    // test vouts
    if (tx.getIncomingTransfers() && ctx.includeOutputs) {
      if (tx.isConfirmed()) {
        assert(tx.getVouts() !== undefined);
        assert(tx.getVouts().length > 0);
      } else {
        assert(tx.getVouts() === undefined);
      }

    }
    if (tx.getVouts()) for (let vout of tx.getVouts()) testOutputWallet(vout);
    
    // test deep copy
    if (!ctx.isCopy) await this._testTxWalletCopy(tx, ctx);
  }
  
  async _testTxWalletCopy(tx, ctx) {
    
    // copy tx and assert deep equality
    let copy = tx.copy();
    assert(copy instanceof MoneroTxWallet);
    assert.deepEqual(copy.toJson(), tx.toJson());
    
    // test different references
    if (tx.getOutgoingTransfer()) {
      assert(tx.getOutgoingTransfer() !== copy.getOutgoingTransfer());
      assert(tx.getOutgoingTransfer().getTx() !== copy.getOutgoingTransfer().getTx());
      //assert(tx.getOutgoingTransfer().getAmount() !== copy.getOutgoingTransfer().getAmount());  // TODO: BI 0 === BI 0?, testing this instead:
      if (tx.getOutgoingTransfer().getAmount() === copy.getOutgoingTransfer().getAmount()) assert(tx.getOutgoingTransfer().getAmount().compare(BigInteger(0)) === 0);
      if (tx.getOutgoingTransfer().getDestinations()) {
        assert(tx.getOutgoingTransfer().getDestinations() !== copy.getOutgoingTransfer().getDestinations());
        for (let i = 0; i < tx.getOutgoingTransfer().getDestinations().length; i++) {
          assert.deepEqual(copy.getOutgoingTransfer().getDestinations()[i], tx.getOutgoingTransfer().getDestinations()[i]);
          assert(tx.getOutgoingTransfer().getDestinations()[i] !== copy.getOutgoingTransfer().getDestinations()[i]);
          if (tx.getOutgoingTransfer().getDestinations()[i].getAmount() === copy.getOutgoingTransfer().getDestinations()[i].getAmount()) assert(tx.getOutgoingTransfer().getDestinations()[i].getAmount().toJSValue() === 0);
        }
      }
    }
    if (tx.getIncomingTransfers()) {
      for (let i = 0; i < tx.getIncomingTransfers().length; i++) {
        assert.deepEqual(copy.getIncomingTransfers()[i].toJson(), tx.getIncomingTransfers()[i].toJson());
        assert(tx.getIncomingTransfers()[i] !== copy.getIncomingTransfers()[i]);
        if (tx.getIncomingTransfers()[i].getAmount() == copy.getIncomingTransfers()[i].getAmount()) assert(tx.getIncomingTransfers()[i].getAmount().toJSValue() === 0);
      }
    }
    if (tx.getVouts()) {
      for (let i = 0; i < tx.getVouts().length; i++) {
        assert.deepEqual(copy.getVouts()[i].toJson(), tx.getVouts()[i].toJson());
        assert(tx.getVouts()[i] !== copy.getVouts()[i]);
        if (tx.getVouts()[i].getAmount() == copy.getVouts()[i].getAmount()) assert(tx.getVouts()[i].getAmount().toJSValue() === 0);
      }
    }
    
    // test copied tx
    ctx = Object.assign({}, ctx);
    ctx.isCopy = true;
    if (tx.getBlock()) copy.setBlock(tx.getBlock().copy().setTxs([copy])); // copy block for testing
    await this._testTxWallet(copy, ctx);
    
    // test merging with copy
    let merged = copy.merge(copy.copy());
    assert.equal(merged.toString(), tx.toString());
  }
  
  async _testMultisig(m, n, testTx) {
    console.log("_testMultisig(" + m + ", " + n + ")");
    
    // set name attribute of test wallet at beginning of test
    let BEGIN_MULTISIG_NAME = "begin_multisig_wallet";
    await this.wallet.setAttribute("name", BEGIN_MULTISIG_NAME);
    await this.wallet.save();
    //await this.wallet.close();
    
    // create n wallets and prepare multisig hexes
    let preparedMultisigHexes = [];
    let walletIds = [];
    for (let i = 0; i < n; i++) {
      let wallet = await this.createRandomWallet();
      walletIds.push(await this.wallet.getPath());
      await this.wallet.setAttribute("name", await this.wallet.getPath());  // set the name of each wallet as an attribute
      preparedMultisigHexes.push(await this.wallet.prepareMultisig());
      //console.log("PREPARED HEX: " + preparedMultisigHexes[preparedMultisigHexes.length - 1]);
      
      await this.wallet.close(true);
    }

    // make wallets multisig
    let address = undefined;
    let madeMultisigHexes = [];
    for (let i = 0; i < walletIds.length; i++) {
      
      // open the wallet
      let wallet = await this.openWallet(walletIds[i]);
      assert.equal(await this.wallet.getAttribute("name"), walletIds[i]);
      
      // collect prepared multisig hexes from wallet's peers
      let peerMultisigHexes = [];
      for (let j = 0; j < walletIds.length; j++) if (j !== i) peerMultisigHexes.push(preparedMultisigHexes[j]);

      // make the wallet multisig
      let result = await this.wallet.makeMultisig(peerMultisigHexes, m, TestUtils.WALLET_PASSWORD);
      //console.log("MADE RESULT: " + JsonUtils.serialize(result));
      if (address === undefined) address = result.getAddress();
      else assert.equal(result.getAddress(), address);
      madeMultisigHexes.push(result.getMultisigHex());
      
      await this.wallet.close();
    }
    
    // handle m/n which exchanges keys n - m times
    if (m !== n) {
      address = undefined;
      
      // exchange keys n - m times
      assert.equal(madeMultisigHexes.length, n);
      let prevMultisigHexes = madeMultisigHexes;
      for (let i = 0; i < n - m; i++) {
        //console.log("Exchanging multisig keys round " + (i + 1) + " / " + (n - m));
        
        // exchange multisig keys with each wallet and collect results
        let exchangeMultisigHexes = [];
        for (let j = 0; j < walletIds.length; j++) {
          let walletId = walletIds[j];
          
          // open the wallet
          let wallet = await this.openWallet(walletId);
          assert.equal(await this.wallet.getAttribute("name"), walletIds[j]);
          
          // collect the multisig hexes of the wallet's peers from last round
          let peerMultisigHexes = [];
          for (let k = 0; k < walletIds.length; k++) if (k !== j) peerMultisigHexes.push(prevMultisigHexes[k]);
          
          // import the multisig hexes of the wallet's peers
          let result = await this.wallet.exchangeMultisigKeys(peerMultisigHexes, TestUtils.WALLET_PASSWORD);
          //console.log("EXCHANGED MULTISIG KEYS RESULT: " + JsonUtils.serialize(result));
          
          // test result
          if (i === n - m - 1) {  // result on last round has address and not multisig hex to share
            assert.notEqual(result.getAddress(), undefined);
            assert(result.getAddress().length > 0);
            if (address === undefined) address = result.getAddress();
            else assert.equal(result.getAddress(), address);
            assert.equal(result.getMultisigHex(), undefined);
          } else {
            assert.notEqual(result.getMultisigHex(), undefined);
            assert(result.getMultisigHex().length > 0);
            assert.equal(result.getAddress(), undefined);
            exchangeMultisigHexes.push(result.getMultisigHex());
          }
          
          //await this.wallet.save();
          await this.wallet.close();
        }
        
        // use results for next round of exchange
        prevMultisigHexes = exchangeMultisigHexes;
      }
    }
    
    // print final multisig address
    let curWallet = await this.openWallet(walletIds[0]);
    assert.equal(await curWallet.getAttribute("name"), walletIds[0]);
    //console.log("FINAL MULTISIG ADDRESS: " + await curWallet.getPrimaryAddress());
    await curWallet.close();
    
    // test sending a multisig transaction if configured
    if (testTx) {
      
      console.log("Creating account");
      
      // create an account in the first multisig wallet to receive funds to
      curWallet = await this.openWallet(walletIds[0]);
      assert.equal(await curWallet.getAttribute("name"), walletIds[0]);
      await curWallet.createAccount();
      
      // get destinations to subaddresses within the account of the multisig wallet
      let accountIdx = 1;
      let destinations = [];
      for (let i = 0; i < 3; i++) {
        await curWallet.createSubaddress(accountIdx);
        destinations.push(new MoneroDestination(await curWallet.getAddress(accountIdx, i), TestUtils.MAX_FEE.multiply(new BigInteger(2))));
      }
      await curWallet.close();
      
      console.log("Sending funds from main wallet");
      
      // send funds from the main test wallet to destinations in the first multisig wallet
      curWallet = await this.getTestWallet();  // get / open the main test wallet
      assert.equal(await curWallet.getAttribute("name"), BEGIN_MULTISIG_NAME);
      assert((await curWallet.getBalance()).compare(new BigInteger(0)) > 0);
      await curWallet.send(new MoneroSendRequest().setAccountIndex(0).setDestinations(destinations));
      let returnAddress = await curWallet.getPrimaryAddress(); // funds will be returned to this address from the multisig wallet
      
      // open the first multisig participants
      curWallet = await this.openWallet(walletIds[0]);
      assert.equal(await curWallet.getAttribute("name"), walletIds[0]);
      this._testMultisigInfo(await curWallet.getMultisigInfo(), m, n);
      await curWallet.startSyncing();
      
      console.log("Starting mining");
      
      // start mining to push the network along
      await StartMining.startMining();
      
      // wait for the multisig wallet's funds to unlock // TODO: could replace with condition_variable and notify
      let lastNumConfirmations = undefined;
      while (true) {
        
        // wait for a moment
        await new Promise(function(resolve) { setTimeout(resolve, MoneroUtils.WALLET_REFRESH_RATE); });
        
        // fetch and test outputs
        let outputs = await curWallet.getOutputs();
        if (outputs.length === 0) console.log("No outputs reported yet");
        else {
          
          // print num confirmations
          let height = await this.daemon.getHeight();
          let numConfirmations = height - outputs[0].getTx().getHeight();
          if (lastNumConfirmations === undefined || lastNumConfirmations !== numConfirmations) console.log("Output has " + (height - outputs[0].getTx().getHeight()) + " confirmations");
          lastNumConfirmations = numConfirmations;
          
          // outputs are not spent
          for (let output of outputs) assert(output.isSpent() === false);
          
          // break if output is unlocked
          if (outputs[0].isUnlocked()) break;
        }
      }
        
      // stop mining
      await this.daemon.stopMining();
      
      // multisig wallet should have unlocked balance in account 1 subaddresses 0-3
      assert.equal(await curWallet.getAttribute("name"), walletIds[0]);
      for (let i = 0; i < 3; i++) {
        assert((await curWallet.getUnlockedBalance(1, i)).compare(new BigInteger(0)) > 0);
      }
      let outputs = await this.wallet.getOutputs(new MoneroOutputQuery().setAccountIndex(1));
      assert(outputs.length > 0);
      if (outputs.length < 3) console.log("WARNING: not one output per subaddress?");
      //assert(outputs.length >= 3);  // TODO
      for (let output of outputs) assert(output.isUnlocked());
      
      // wallet requires importing multisig to be reliable
      assert(await curWallet.isMultisigImportNeeded());
      
      // attempt creating and relaying transaction without synchronizing with participants
      try {
        let txSet = await curWallet.sendSplit(1, returnAddress, TestUtils.MAX_FEE.multiply(new BigInteger(3)));
        console.log("WARNING: wallet returned a tx set from sendSplit() even though it has not been synchronized with participants, expected exception: " + JSON.stringify(txSet));  // TODO monero core: wallet_rpc_server.cpp:995 should throw if no txs created
        //throw new RuntimeException("Should have failed sending funds without synchronizing with peers");
      } catch (e) {
        if (e.message.indexOf("Should have failed") < 0) { // TODO: remove this check when wallet rpc throws exception as expected
          assert.equal(e.message, "No transaction created");
        }
      }
      
      // synchronize the multisig participants since receiving outputs
      console.log("Synchronizing participants");
      curWallet = await this._synchronizeMultisigParticipants(curWallet, walletIds);
      assert.equal(await curWallet.getAttribute("name"), walletIds[0]);
      
      // send funds from a subaddress in the multisig wallet
      console.log("Sending");
      let txSet = await curWallet.sendSplit(new MoneroSendRequest(returnAddress, TestUtils.MAX_FEE).setAccountIndex(1).setSubaddressIndex(0));
      assert.notEqual(txSet.getMultisigTxHex(), undefined);
      assert.equal(txSet.getSignedTxHex(), undefined);
      assert.equal(txSet.getUnsignedTxHex(), undefined);
      assert(txSet.getTxs().length > 0);
      
      // sign the tx with participants 1 through m - 1 to meet threshold
      let multisigTxHex = txSet.getMultisigTxHex();
      console.log("Signing");
      for (let i = 1; i < m; i++) {
        curWallet = await this.openWallet(walletIds[i]);
        let result = await curWallet.signMultisigTxHex(multisigTxHex);
        multisigTxHex = result.getSignedMultisigTxHex();
        await curWallet.close();
      }
      
      //console.log("Submitting signed multisig tx hex: " + multisigTxHex);
      
      // submit the signed multisig tx hex to the network
      console.log("Submitting");
      curWallet = await this.openWallet(walletIds[0]);
      let txIds = await curWallet.submitMultisigTxHex(multisigTxHex);
      await curWallet.save();
      
      // synchronize the multisig participants since spending outputs
      console.log("Synchronizing participants");
      curWallet = await this._synchronizeMultisigParticipants(curWallet, walletIds);
      
      // fetch the wallet's multisig txs
      let multisigTxs = await curWallet.getTxs(new MoneroTxQuery().setTxIds(txIds));
      assert.equal(txIds.length, multisigTxs.length);
      
      // sweep an output from subaddress [1,1]
      outputs = await curWallet.getOutputs(new MoneroOutputQuery().setAccountIndex(1).setSubaddressIndex(1));
      assert(outputs.length > 0);
      assert(outputs[0].isSpent() === false);
      txSet = await curWallet.sweepOutput(returnAddress, outputs[0].getKeyImage().getHex());
      assert.notEqual(txSet.getMultisigTxHex(), undefined);
      assert.equal(txSet.getSignedTxHex(), undefined);
      assert.equal(txSet.getUnsignedTxHex(), undefined);
      assert(txSet.getTxs().length > 0);
      
      // sign the tx with participants 1 through m - 1 to meet threshold
      multisigTxHex = txSet.getMultisigTxHex();
      console.log("Signing sweep output");
      for (let i = 1; i < m; i++) {
        curWallet = await this.openWallet(walletIds[i]);
        let result = await curWallet.signMultisigTxHex(multisigTxHex);
        multisigTxHex = result.getSignedMultisigTxHex();
        await curWallet.close();
      }
      
      // submit the signed multisig tx hex to the network
      console.log("Submitting sweep output");
      curWallet = await this.openWallet(walletIds[0]);
      txIds = await curWallet.submitMultisigTxHex(multisigTxHex);
      await curWallet.save();
      
      // synchronize the multisig participants since spending outputs
      console.log("Synchronizing participants");
      curWallet = await this._synchronizeMultisigParticipants(curWallet, walletIds);
      
      // fetch the wallet's multisig txs
      multisigTxs = await curWallet.getTxs(new MoneroTxQuery().setTxIds(txIds));
      assert.equal(txIds.length, multisigTxs.length);
      
      // sweep remaining balance
      console.log("Sweeping");
      let txSets = await curWallet.sweepUnlocked(new MoneroSendRequest(returnAddress).setAccountIndex(1)); // TODO: test multisig with sweepEachSubaddress which will generate multiple tx sets without synchronizing participants
      assert.equal(txSets.length, 1); // only one tx set created per account
      txSet = txSets[0];
      assert.notEqual(txSet.getMultisigTxHex(), undefined);
      assert.equal(txSet.getSignedTxHex(), undefined);
      assert.equal(txSet.getUnsignedTxHex(), undefined);
      assert(txSet.getTxs().length > 0);
      
      // sign the tx with participants 1 through m - 1 to meet threshold
      multisigTxHex = txSet.getMultisigTxHex();
      console.log("Signing sweep");
      for (let i = 1; i < m; i++) {
        curWallet = await this.openWallet(walletIds[i]);
        let result = await curWallet.signMultisigTxHex(multisigTxHex);
        multisigTxHex = result.getSignedMultisigTxHex();
        await curWallet.close();
      }
      
      // submit the signed multisig tx hex to the network
      console.log("Submitting sweep");
      curWallet = await this.openWallet(walletIds[0]);
      txIds = await curWallet.submitMultisigTxHex(multisigTxHex);
      await curWallet.save();
      
      // synchronize the multisig participants since spending outputs
      console.log("Synchronizing participants");
      curWallet = await this._synchronizeMultisigParticipants(curWallet, walletIds);
      
      // fetch the wallet's multisig txs
      multisigTxs = await curWallet.getTxs(new MoneroTxQuery().setTxIds(txIds));
      assert.equal(txIds.length, multisigTxs.length);
      
      await curWallet.close(true);
    }
    
    // re-open main test wallet
    this.wallet = await this.getTestWallet();
    assert.equal(await this.wallet.getAttribute("name"), BEGIN_MULTISIG_NAME);
  }
  
  async _synchronizeMultisigParticipants(currentWallet, walletIds) {
    
    // close the current wallet
    let path = await currentWallet.getPath();
    await currentWallet.close();

    // collect multisig hex of all participants to synchronize
    let multisigHexes = [];
    for (let walletId of walletIds) {
      let wallet = await this.openWallet(walletId);
      await this.wallet.sync();
      multisigHexes.push(await this.wallet.getMultisigHex());
      await this.wallet.close(true);
    }
    
    // import each wallet's peer multisig hexIt 
    for (let i = 0; i < walletIds.length; i++) {
      let peerMultisigHexes = [];
      for (let j = 0; j < walletIds.length; j++) if (j !== i) peerMultisigHexes.push(multisigHexes[j]);
      let wallet = await this.openWallet(walletIds[i]);
      await this.wallet.importMultisigHex(peerMultisigHexes);
      await this.wallet.sync();
      await this.wallet.close(true);
    }
    
    // re-open current wallet and return
    let endWallet = await this.openWallet(path);
    await endWallet.sync();
    return endWallet;
  }
  
  async _testMultisigInfo(info, m, n) {
    assert(info.isMultisig());
    assert(info.isReady());
    assert.equal(info.getThreshold(), m);
    assert.equal(info.getNumParticipants(), n);
  }
}

// ------------------------------ PRIVATE STATIC ------------------------------
  
function testAccount(account) {
  
  // test account
  assert(account);
  assert(account.getIndex() >= 0);
  MoneroUtils.validateAddress(account.getPrimaryAddress());
  TestUtils.testUnsignedBigInteger(account.getBalance());
  TestUtils.testUnsignedBigInteger(account.getUnlockedBalance());
  
  // if given, test subaddresses and that their balances add up to account balances
  if (account.getSubaddresses()) {
    let balance = new BigInteger(0);
    let unlockedBalance = new BigInteger(0);
    for (let i = 0; i < account.getSubaddresses().length; i++) {
      testSubaddress(account.getSubaddresses()[i]);
      assert.equal(account.getSubaddresses()[i].getAccountIndex(), account.getIndex());
      assert.equal(account.getSubaddresses()[i].getIndex(), i);
      balance = balance.add(account.getSubaddresses()[i].getBalance());
      unlockedBalance = unlockedBalance.add(account.getSubaddresses()[i].getUnlockedBalance());
    }
    assert(account.getBalance().compare(balance) === 0, "Subaddress balances " + balance.toString() + " does not equal account " + account.getIndex() + " balance " + account.getBalance().toString());
    assert(account.getUnlockedBalance().compare(unlockedBalance) === 0, "Subaddress unlocked balances " + unlockedBalance.toString() + " does not equal account " + account.getIndex() + " unlocked balance " + account.getUnlockedBalance().toString());
  }
  
  // tag must be undefined or non-empty
  let tag = account.getTag();
  assert(tag === undefined || tag.length > 0);
}

function testSubaddress(subaddress) {
  assert(subaddress.getAccountIndex() >= 0);
  assert(subaddress.getIndex() >= 0);
  assert(subaddress.getAddress());
  assert(subaddress.getLabel() === undefined || typeof subaddress.getLabel() === "string");
  if (typeof subaddress.getLabel() === "string") assert(subaddress.getLabel().length > 0);
  TestUtils.testUnsignedBigInteger(subaddress.getBalance());
  TestUtils.testUnsignedBigInteger(subaddress.getUnlockedBalance());
  assert(subaddress.getNumUnspentOutputs() >= 0);
  assert(typeof subaddress.isUsed() === "boolean");
  if (subaddress.getBalance().compare(new BigInteger(0)) > 0) assert(subaddress.isUsed());
  assert(subaddress.getNumBlocksToUnlock() >= 0);
}

/**
 * Gets random transactions.
 * 
 * @param wallet is the wallet to query for transactions
 * @param query configures the transactions to retrieve
 * @param minTxs specifies the minimum number of transactions (undefined for no minimum)
 * @param maxTxs specifies the maximum number of transactions (undefined for all filtered transactions)
 * @return {MoneroTxWallet[]} are the random transactions
 */
async function getRandomTransactions(wallet, query, minTxs, maxTxs) {
  let txs = await wallet.getTxs(query);
  if (minTxs !== undefined) assert(txs.length >= minTxs, txs.length + "/" + minTxs + " transactions found with query: " + JSON.stringify(query));
  GenUtils.shuffle(txs);
  if (maxTxs === undefined) return txs;
  else return txs.slice(0, Math.min(maxTxs, txs.length));
}

/**
 * Tests that common tx field types are valid regardless of tx state.
 * 
 * @param tx is the tx to test
 */
function testTxWalletTypes(tx) {
  assert.equal(typeof tx.getId(), "string");
  assert.equal(typeof tx.isConfirmed(), "boolean");
  assert.equal(typeof tx.isMinerTx(), "boolean");
  assert.equal(typeof tx.isFailed(), "boolean");
  assert.equal(typeof tx.isRelayed(), "boolean");
  assert.equal(typeof tx.inTxPool(), "boolean");
  TestUtils.testUnsignedBigInteger(tx.getFee());
  assert.equal(tx.getVins(), undefined);  // TODO no way to expose vins?
  if (tx.getPaymentId()) assert.notEqual(tx.getPaymentId(), MoneroTx.DEFAULT_PAYMENT_ID); // default payment id converted to undefined
  if (tx.getNote()) assert(tx.getNote().length > 0);  // empty notes converted to undefined
  assert(tx.getUnlockTime() >= 0);
  assert.equal(tx.getSize(), undefined);   // TODO monero-wallet-rpc: add tx_size to get_transfers and get_transfer_by_txid
  assert.equal(tx.getWeight(), undefined);
  assert.equal(tx.getReceivedTimestamp(), undefined);  // TODO monero-wallet-rpc: return received timestamp (asked to file issue if wanted)
}

function testTransfer(transfer, ctx) {
  if (ctx === undefined) ctx = {};
  assert(transfer instanceof MoneroTransfer);
  TestUtils.testUnsignedBigInteger(transfer.getAmount());
  if (!ctx.isSweepOutputResponse) assert(transfer.getAccountIndex() >= 0);
  if (!ctx.isSendResponse) assert(transfer.getNumSuggestedConfirmations() >= 0); // TODO monero-wallet-rpc: some outgoing transfers have suggested_confirmations_threshold = 0
  if (transfer.isIncoming()) testIncomingTransfer(transfer);
  else testOutgoingTransfer(transfer, ctx);
  
  // transfer and tx reference each other
  assert(transfer.getTx());
  if (transfer !== transfer.getTx().getOutgoingTransfer()) {
    assert(transfer.getTx().getIncomingTransfers());
    assert(transfer.getTx().getIncomingTransfers().includes(transfer), "Transaction does not reference given transfer");
  }
}

function testIncomingTransfer(transfer) {
  assert(transfer.isIncoming());
  assert(!transfer.isOutgoing());
  assert(transfer.getAddress());
  assert(transfer.getSubaddressIndex() >= 0);
  assert(transfer.getNumSuggestedConfirmations() > 0);
}

function testOutgoingTransfer(transfer, ctx) {
  assert(!transfer.isIncoming());
  assert(transfer.isOutgoing());
  if (!ctx.isSendResponse) assert(transfer.getSubaddressIndices());
  if (transfer.getSubaddressIndices()) {
    assert(transfer.getSubaddressIndices().length >= 1);
    for (let subaddressIdx of transfer.getSubaddressIndices()) assert(subaddressIdx >= 0);
  }
  if (transfer.getAddresses()) {
    assert.equal(transfer.getAddresses().length, transfer.getSubaddressIndices().length);
    for (let address of transfer.getAddresses()) assert(address);
  }
  
  // test destinations sum to outgoing amount
  if (transfer.getDestinations()) {
    assert(transfer.getDestinations().length > 0);
    let sum = new BigInteger(0);
    for (let destination of transfer.getDestinations()) {
      assert(destination.getAddress());
      TestUtils.testUnsignedBigInteger(destination.getAmount(), true);
      sum = sum.add(destination.getAmount());
    }
    if (transfer.getAmount().compare(sum) !== 0) console.log(transfer.getTx().toString());
    assert.equal(sum.toString(), transfer.getAmount().toString());
  }
}

function testOutputWallet(output) {
  assert(output);
  assert(output instanceof MoneroOutputWallet);
  assert(output.getAccountIndex() >= 0);
  assert(output.getSubaddressIndex() >= 0);
  assert(output.getIndex() >= 0);
  assert.equal(typeof output.isSpent(), "boolean");
  assert.equal(typeof output.isUnlocked(), "boolean");
  assert.equal(typeof output.isFrozen(), "boolean");
  assert(output.getKeyImage());
  assert(output.getKeyImage() instanceof MoneroKeyImage);
  assert(output.getKeyImage().getHex());
  TestUtils.testUnsignedBigInteger(output.getAmount(), true);
  
  // output has circular reference to its transaction which has some initialized fields
  let tx = output.getTx();
  assert(tx);
  assert(tx instanceof MoneroTxWallet);
  assert(tx.getVouts().includes(output));
  assert(tx.getId());
  assert.equal(tx.isConfirmed(), true);  // TODO monero-wallet-rpc: possible to get unconfirmed vouts?
  assert.equal(tx.isRelayed(), true);
  assert.equal(tx.isFailed(), false);
  assert(tx.getHeight() > 0);
  
  // test copying
  let copy = output.copy();
  assert(copy !== output);
  assert.equal(copy.toString(), output.toString());
  assert.equal(copy.getTx(), undefined);  // TODO: should output copy do deep copy of tx so models are graph instead of tree?  Would need to work out circular references
}

function testCommonTxSets(txs, hasSigned, hasUnsigned, hasMultisig) {
  assert(txs.length > 0);
  
  // assert that all sets are same reference
  let set;
  for (let i = 0; i < txs.length; i++) {
    assert(txs[i] instanceof MoneroTx);
    if (i === 0) set = txs[i].getTxSet();
    else assert(txs[i].getTxSet() === set);
  }
  
  // test expected set
  assert(set);
  if (hasSigned) {
    assert(set.getSignedTxSet());
    assert(set.getSignedTxSet().length > 0);
  }
  if (hasUnsigned) {
    assert(set.getUnsignedTxSet());
    assert(set.getUnsignedTxSet().length > 0);
  }
  if (hasMultisig) {
    assert(set.getMultisigTxSet());
    assert(set.getMultisigTxSet().length > 0);
  }
}

function testCheckTx(tx, check) {
  assert.equal(typeof check.isGood(), "boolean");
  if (check.isGood()) {
    assert(check.getNumConfirmations() >= 0);
    assert.equal(typeof check.inTxPool(), "boolean");
    TestUtils.testUnsignedBigInteger(check.getReceivedAmount());
    if (check.inTxPool()) assert.equal(0, check.getNumConfirmations());
    else assert(check.getNumConfirmations() > 0); // TODO (monero-wall-rpc) this fails (confirmations is 0) for (at least one) transaction that has 1 confirmation on testCheckTxKey()
  } else {
    assert.equal(check.getNumConfirmations(), undefined);
    assert.equal(check.inTxPool(), undefined);
    assert.equal(check.getReceivedAmount(), undefined);
  }
}

function testCheckReserve(check) {
  assert.equal(typeof check.isGood(), "boolean");
  if (check.isGood()) {
    TestUtils.testUnsignedBigInteger(check.getTotalAmount());
    assert(check.getTotalAmount().compare(new BigInteger(0)) >= 0);
    TestUtils.testUnsignedBigInteger(check.getUnconfirmedSpentAmount());
    assert(check.getUnconfirmedSpentAmount().compare(new BigInteger(0)) >= 0);
  } else {
    assert.equal(check.getTotalAmount(), undefined);
    assert.equal(check.getUnconfirmedSpentAmount(), undefined);
  }
}

/**
 * Tests the integrity of the full structure in the given txs from the block down
 * to transfers / destinations.
 */
function testGetTxsStructure(txs, query = undefined) {
  
  // normalize query
  if (query === undefined) query = new MoneroTxQuery();
  if (!(query instanceof MoneroTxQuery)) query = new MoneroTxQuery(query);
  
  // collect unique blocks in order (using set and list instead of TreeSet for direct portability to other languages)
  let seenBlocks = new Set();
  let blocks = [];
  let unconfirmedTxs = [];
  for (let tx of txs) {
    if (tx.getBlock() === undefined) unconfirmedTxs.push(tx);
    else {
      assert(tx.getBlock().getTxs().includes(tx));
      if (!seenBlocks.has(tx.getBlock())) {
        seenBlocks.add(tx.getBlock());
        blocks.push(tx.getBlock());
      }
    }
  }
  
  // tx ids must be in order if requested
  if (query.getTxIds() !== undefined) {
    assert.equal(txs.length, query.getTxIds().length);
    for (let i = 0; i < query.getTxIds().length; i++) {
      assert.equal(txs[i].getId(), query.getTxIds()[i]);
    }
  }
  
  // test that txs and blocks reference each other and blocks are in ascending order unless specific tx ids requested
  let index = 0;
  let prevBlockHeight = undefined;
  for (let block of blocks) {
    if (prevBlockHeight === undefined) prevBlockHeight = block.getHeight();
    else if (query.getTxIds() === undefined) assert(block.getHeight() > prevBlockHeight, "Blocks are not in order of heights: " + prevBlockHeight + " vs " + block.getHeight());
    for (let tx of block.getTxs()) {
      assert(tx.getBlock() === block);
      if (query.getTxIds() === undefined) { 
        assert.equal(tx.getId(), txs[index].getId()); // verify tx order is self-consistent with blocks unless txs manually re-ordered by requesting by id
        assert(tx === txs[index]);
      }
      index++;
    }
  }
  assert.equal(index + unconfirmedTxs.length, txs.length);
  
  // test that incoming transfers are in order of ascending accounts and subaddresses
  for (let tx of txs) {
    let prevAccountIdx = undefined;
    let prevSubaddressIdx = undefined;
    if (tx.getIncomingTransfers() === undefined) continue;
    for (let transfer of tx.getIncomingTransfers()) {
      if (prevAccountIdx === undefined) prevAccountIdx = transfer.getAccountIndex();
      else {
        assert(prevAccountIdx <= transfer.getAccountIndex());
        if (prevAccountIdx < transfer.getAccountIndex()) {
          prevSubaddressIdx = undefined;
          prevAccountIdx = transfer.getAccountIndex();
        }
        if (prevSubaddressIdx === undefined) prevSubaddressIdx = transfer.getSubaddressIndex();
        else assert(prevSubaddressIdx < transfer.getSubaddressIndex());
      }
    }
  }
  
  // TODO monero core wallet2 does not provide ordered blocks or txs
//  // collect given tx ids
//  List<String> txIds = new ArrayList<String>();
//  for (MoneroTx tx : txs) txIds.add(tx.getId());
//  
//  // fetch network blocks at tx heights
//  List<Long> heights = new ArrayList<Long>();
//  for (MoneroBlock block : blocks) heights.add(block.getHeight());
//  List<MoneroBlock> networkBlocks = daemon.getBlocksByHeight(heights);
//  
//  // collect matching tx ids from network blocks in order
//  List<String> expectedTxIds = new ArrayList<String>();
//  for (MoneroBlock networkBlock : networkBlocks) {
//    for (String txId : networkBlock.getTxIds()) {
//      if (!txIds.contains(txId)) expectedTxIds.add(txId);
//    }
//  }
//  
//  // order of ids must match
//  assertEquals(expectedTxIds, txIds);
}

function countNumInstances(instances) {
  let counts = new Map();
  for (let instance of instances) {
    let count = counts.get(instance);
    counts.set(instance, count === undefined ? 1 : count + 1);
  }
  return counts;
}

function getModes(counts) {
  let modes = new Set();
  let maxCount;
  for (let key of counts.keys()) {
    let count = counts.get(key);
    if (maxCount === undefined || count > maxCount) maxCount = count;
  }
  for (let key of counts.keys()) {
    let count = counts.get(key);
    if (count === maxCount) modes.add(key);
  }
  return modes;
}

module.exports = TestMoneroWalletCommon;