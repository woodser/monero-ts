const TestMoneroWalletCommon = require("./TestMoneroWalletCommon");
const MoneroWalletCore = require("../main/js/wallet/MoneroWalletCore");

/**
 * Tests a Monero wallet using WebAssembly to bridge to monero-project's wallet2.
 */
class TestMoneroWalletCore extends TestMoneroWalletCommon {
  
  constructor(config) {
    super(config);
  }
  
  async getTestWallet() {
    return await TestUtils.getWalletCore();
  }
  
  async getTestDaemon() {
    return await TestUtils.getDaemonRpc();
  }
  
  async openWallet(path) {
    let wallet = await MoneroWalletCore.openWallet(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.getDaemonRpcConnection(), TestUtils.PROXY_TO_WORKER, TestUtils.FS);
    //if (await wallet.isConnected()) await wallet.startSyncing();
    return wallet;
  }
  
  async openWalletCustom(path, password, networkType, daemonConnection) {
    let wallet = await MoneroWalletCore.openWallet(path, password, networkType, daemonConnection, TestUtils.PROXY_TO_WORKER, TestUtils.FS);
    //if (await wallet.isConnected()) await wallet.startSyncing();
    return wallet;
  }
  
  async createWalletRandom() {
    let path = TestUtils.TEST_WALLETS_DIR + "/" + GenUtils.uuidv4();
    let wallet = await MoneroWalletCore.createWalletRandom(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.getDaemonRpcConnection(), undefined, TestUtils.PROXY_TO_WORKER, TestUtils.FS);
    assert.equal(await wallet.getPath(), path);
    //if (await wallet.isConnected()) await wallet.startSyncing();
    return wallet;
  }
  
  /**
   * Create a random wallet with custom configuration using a method which subclasses may override.
   */
  async createWalletRandomCustom(password, networkType, daemonConnection, language) {
    let path = TestUtils.TEST_WALLETS_DIR + "/" + GenUtils.uuidv4();
    let wallet = await MoneroWalletCore.createWalletRandom(path, password, networkType, daemonConnection, language, TestUtils.PROXY_TO_WORKER, TestUtils.FS);
    assert.equal(await wallet.getPath(), path);
    //if (await wallet.isConnected()) await wallet.startSyncing();
    return wallet;
  }
  
  async createWalletFromMnemonic(mnemonic, daemonConnection, restoreHeight, seedOffset) {
    let path = TestUtils.TEST_WALLETS_DIR + "/" + GenUtils.uuidv4();
    let wallet = await MoneroWalletCore.createWalletFromMnemonic(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, mnemonic, daemonConnection, restoreHeight, seedOffset, TestUtils.PROXY_TO_WORKER, TestUtils.FS);
    assert.equal(await wallet.getPath(), path);
    //if (await wallet.isConnected()) await wallet.startSyncing();
    return wallet;
  }
  
  /**
   * Create a wallet from mnemonic with custom configuration using a method which subclasses may override.
   */
  async createWalletFromMnemonicCustom(password, networkType, mnemonic, daemonConnection, restoreHeight, seedOffset) {
    let path = TestUtils.TEST_WALLETS_DIR + "/" + GenUtils.uuidv4();
    let wallet = await MoneroWalletCore.createWalletFromMnemonic(path, password, networkType, mnemonic, daemonConnection, restoreHeight, seedOffset, TestUtils.PROXY_TO_WORKER, TestUtils.FS);
    assert.equal(await wallet.getPath(), path);
    //if (await wallet.isConnected()) await wallet.startSyncing();
    return wallet;
  }
  
  async createWalletFromKeys(address, privateViewKey, privateSpendKey, daemonConnection, firstReceiveHeight, language) {
    let path = TestUtils.TEST_WALLETS_DIR + "/" + GenUtils.uuidv4();
    let wallet = await MoneroWalletCore.createWalletFromKeys(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, address, privateViewKey, privateSpendKey, daemonConnection, firstReceiveHeight, language, TestUtils.PROXY_TO_WORKER, TestUtils.FS);
    assert.equal(await wallet.getPath(), path);
    //if (await wallet.isConnected()) await wallet.startSyncing();
    return wallet;
  }
  
  async createWalletFromKeysCustom(password, networkType, address, privateViewKey, privateSpendKey, daemonConnection, restoreHeight, language) {
    let path = TestUtils.TEST_WALLETS_DIR + "/" + GenUtils.uuidv4();
    let wallet = await MoneroWalletCore.createWalletFromKeys(path, password, networkType, address, privateViewKey, privateSpendKey, daemonConnection, restoreHeight, language, TestUtils.PROXY_TO_WORKER, TestUtils.FS);
    assert.equal(await wallet.getPath(), path);
    //if (await wallet.isConnected()) await wallet.startSyncing();
    return wallet;
  }
  
  async createWalletGroundTruth(networkType, mnemonic, restoreHeight) {
    let path = TestUtils.TEST_WALLETS_DIR + "/gt_wallet_" + GenUtils.uuidv4();
    let gtWallet = await MoneroWalletCore.createWalletFromMnemonic(path, TestUtils.WALLET_PASSWORD, networkType, mnemonic, TestUtils.getDaemonRpcConnection(), restoreHeight, undefined, TestUtils.PROXY_TO_WORKER, TestUtils.FS);
    assert.equal(await gtWallet.getRestoreHeight(), restoreHeight === undefined ? 0 : restoreHeight);
    await gtWallet.sync();
    //if (await wallet.isConnected()) await gtWallet.startSyncing();
    return gtWallet;
  }
  
  async getMnemonicLanguages() {
    return await MoneroWalletCore.getMnemonicLanguages();
  }
  
  // ------------------------------- BEGIN TESTS ------------------------------
  
  runTests() {
    let that = this;
    describe("TEST MONERO WALLET CORE", function() {
      
      // initialize wallet
      before(async function() {
        try {
          that.wallet = await that.getTestWallet();
          that.daemon = await that.getTestDaemon();
        } catch (e) {
          console.log("ERROR BEFORE!");
          console.log(e);
          throw e;
        }
        TestUtils.TX_POOL_WALLET_TRACKER.reset(); // all wallets need to wait for txs to confirm to reliably sync
      });
      
      // save wallet after tests
      after(async function() {
        console.log("Saving and closing wallet on shut down");
        try {
          await that.wallet.close(true);
        } catch (e) {
          console.log("ERROR AFTER");
          console.log(e);
          throw e;
        }
      });
      
      // run tests specific to wallet wasm
      that._testWalletCore();
      
      // run common tests
      that.runCommonTests();
    });
  }
  
  _testWalletCore() {
    let that = this;
    let config = this.config;
    describe("Tests specific to Core wallet", function() {
      
      if (config.testNonRelays)
      it("Can get the daemon's height", async function() {
        assert(await that.wallet.isConnected());
        let daemonHeight = await that.wallet.getDaemonHeight();
        assert(daemonHeight > 0);
      });
      
      if (config.testNonRelays && !config.liteMode)
      it("Can open, sync, and close wallets repeatedly", async function() {
        for (let i = 0; i < 6; i++) {
          let wallet = await that.createWalletRandom();
          await wallet.sync();
          await wallet.close();
        }
      });
      
      if (config.testNonRelays)
      it("Can get the daemon's max peer height", async function() {
        let height = await that.wallet.getDaemonMaxPeerHeight();
        assert(height > 0);
      });
      
      if (config.testNonRelays)
      it("Can set the daemon connection", async function() {
        let err;
        let wallet;
        try {
          
          // create random wallet with defaults
          wallet = await that.createWalletRandomCustom(TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE);
          assert.equal(await wallet.getDaemonConnection(), undefined);
          
          // set daemon uri
          await wallet.setDaemonConnection(TestUtils.DAEMON_RPC_CONFIG.uri);
          assert.deepEqual((await wallet.getDaemonConnection()).getConfig(), new MoneroRpcConnection(TestUtils.DAEMON_RPC_CONFIG.uri).getConfig());
          await wallet.setDaemonConnection(TestUtils.DAEMON_RPC_CONFIG.uri, TestUtils.DAEMON_RPC_CONFIG.user, TestUtils.DAEMON_RPC_CONFIG.pass);
          assert(await wallet.isConnected());
          
          // nullify daemon connection
          await wallet.setDaemonConnection(undefined);
          assert.equal(await wallet.getDaemonConnection(), undefined);
          await wallet.setDaemonConnection(TestUtils.DAEMON_RPC_CONFIG.uri);
          assert.deepEqual((await wallet.getDaemonConnection()).getConfig(), new MoneroRpcConnection(TestUtils.DAEMON_RPC_CONFIG.uri).getConfig());
          await wallet.setDaemonConnection(undefined);
          assert.equal(await wallet.getDaemonConnection(), undefined);
          
          // set daemon uri to non-daemon
          await wallet.setDaemonConnection("www.getmonero.org");
          assert.deepEqual((await wallet.getDaemonConnection()).getConfig(), new MoneroRpcConnection("www.getmonero.org").getConfig());
          assert(!await wallet.isConnected());
          
          // set daemon to invalid uri
          await wallet.setDaemonConnection("abc123");
          assert(!await wallet.isConnected());
          
          // attempt to sync
          try {
            await wallet.sync();
            throw new Error("Exception expected");
          } catch (e1) {
            assert.equal(e1.message, "Wallet is not connected to daemon");
          }
        } catch (e) {
          err = e;
        }
        
        // close wallet and throw if error occurred
        if (err) console.log(err);
        await wallet.close();
        if (err) throw err;
      });
      
      if (config.testNonRelays)
      it("Can create a random core wallet", async function() {
        
        // create random wallet with defaults
        let wallet = await that.createWalletRandomCustom(TestUtils.WALLET_PASSWORD, MoneroNetworkType.MAINNET);
        MoneroUtils.validateMnemonic(await wallet.getMnemonic());
        MoneroUtils.validateAddress(await wallet.getPrimaryAddress(), MoneroNetworkType.MAINNET);
        assert.equal(await wallet.getNetworkType(), MoneroNetworkType.MAINNET);
        assert.equal(await wallet.getDaemonConnection(), undefined);
        assert(!(await wallet.isConnected()));
        assert.equal(await wallet.getMnemonicLanguage(), "English");
        assert(!(await wallet.isSynced()));
        assert.equal(await wallet.getHeight(), 1); // TODO monero core: why does height of new unsynced wallet start at 1?
        assert(await wallet.getRestoreHeight() >= 0);
        
        // cannot get daemon chain height
        try {
          await wallet.getDaemonHeight();
        } catch (e) {
          assert.equal(e.message, "Wallet is not connected to daemon");
        }
        
        // set daemon connection and check chain height
        await wallet.setDaemonConnection(await that.daemon.getRpcConnection());
        assert.equal(await wallet.getDaemonHeight(), await that.daemon.getHeight());
        
        // close wallet which releases resources
        await wallet.close();

        // create random wallet with non defaults
        wallet = await that.createWalletRandomCustom(TestUtils.WALLET_PASSWORD, MoneroNetworkType.TESTNET, await that.daemon.getRpcConnection(), "Spanish");
        MoneroUtils.validateMnemonic(await wallet.getMnemonic());
        MoneroUtils.validateAddress(await wallet.getPrimaryAddress(), MoneroNetworkType.TESTNET);
        assert.equal(await wallet.getNetworkType(), await MoneroNetworkType.TESTNET);
        assert(await wallet.getDaemonConnection());
        assert((await that.daemon.getRpcConnection()).getConfig() !== (await wallet.getDaemonConnection()).getConfig());         // not same reference
        assert.equal((await wallet.getDaemonConnection()).getUri(), (await that.daemon.getRpcConnection()).getUri());
        assert.equal((await wallet.getDaemonConnection()).getUsername(), (await that.daemon.getRpcConnection()).getUsername());
        assert.equal((await wallet.getDaemonConnection()).getPassword(), (await that.daemon.getRpcConnection()).getPassword());
        assert(await wallet.isConnected());
        assert.equal(await wallet.getMnemonicLanguage(), "Spanish");
        assert(!(await wallet.isSynced()));
        assert.equal(await wallet.getHeight(), 1); // TODO monero core: why is height of unsynced wallet 1?
        if (await that.daemon.isConnected()) assert.equal(await wallet.getRestoreHeight(), await that.daemon.getHeight());
        else assert(await wallet.getRestoreHeight() >= 0);
        await wallet.close();
      });
      
      if (config.testNonRelays)
      it("Can create a core wallet from mnemonic", async function() {
        
        // create wallet with mnemonic and defaults
        let wallet = await that.createWalletFromMnemonicCustom(TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC);
        assert.equal(await wallet.getMnemonic(), TestUtils.MNEMONIC);
        assert.equal(await wallet.getPrimaryAddress(), TestUtils.ADDRESS);
        assert.equal(await wallet.getNetworkType(), TestUtils.NETWORK_TYPE);
        assert.equal(await wallet.getDaemonConnection(), undefined);
        assert(!(await wallet.isConnected()));
        assert.equal(await wallet.getMnemonicLanguage(), "English");
        assert(!(await wallet.isSynced()));
        assert.equal(await wallet.getHeight(), 1);
        assert.equal(await wallet.getRestoreHeight(), 0);
        try { await wallet.startSyncing(); } catch (e) { assert.equal(e.message, "Wallet is not connected to daemon"); }
        wallet.close();
        
        // create wallet without restore height
        wallet = await that.createWalletFromMnemonicCustom(TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, await that.daemon.getRpcConnection());
        assert.equal(await wallet.getMnemonic(), TestUtils.MNEMONIC);
        assert.equal(await wallet.getPrimaryAddress(), TestUtils.ADDRESS);
        assert.equal(TestUtils.NETWORK_TYPE, await wallet.getNetworkType());
        assert(await wallet.getDaemonConnection());
        assert(await that.daemon.getRpcConnection() != await wallet.getDaemonConnection());
        assert.equal((await wallet.getDaemonConnection()).getUri(), (await that.daemon.getRpcConnection()).getUri());
        assert.equal((await wallet.getDaemonConnection()).getUsername(), (await that.daemon.getRpcConnection()).getUsername());
        assert.equal((await wallet.getDaemonConnection()).getPassword(), (await that.daemon.getRpcConnection()).getPassword());
        assert(await wallet.isConnected());
        assert.equal(await wallet.getMnemonicLanguage(), "English");
        assert(!(await wallet.isSynced()));
        assert.equal(await wallet.getHeight(), 1); // TODO monero core: why does height of new unsynced wallet start at 1?
        assert.equal(await wallet.getRestoreHeight(), 0);
        await wallet.close();
        
        // create wallet with mnemonic, no connection, and restore height
        let restoreHeight = 10000;
        wallet = await that.createWalletFromMnemonicCustom(TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, undefined, restoreHeight);
        assert.equal(await wallet.getMnemonic(), TestUtils.MNEMONIC);
        assert.equal(await wallet.getPrimaryAddress(), TestUtils.ADDRESS);
        assert.equal(await wallet.getNetworkType(), TestUtils.NETWORK_TYPE);
        assert.equal(await wallet.getDaemonConnection(), undefined);
        assert(!(await wallet.isConnected()));
        assert.equal(await wallet.getMnemonicLanguage(), "English");
        assert.equal(await wallet.getHeight(), 1); // TODO monero core: why does height of new unsynced wallet start at 1?
        assert.equal(await wallet.getRestoreHeight(), restoreHeight);
        let path = await await wallet.getPath();
        await wallet.close(true);
        wallet = await that.openWalletCustom(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE);
        assert(!(await wallet.isConnected()));
        assert(!(await wallet.isSynced()));
        assert.equal(await wallet.getHeight(), 1);
        assert.equal(await wallet.getRestoreHeight(), restoreHeight); // TODO: restore height is lost after closing in JNI?
        await wallet.close();

        // create wallet with mnemonic, connection, and restore height
        wallet = await that.createWalletFromMnemonicCustom(TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, await that.daemon.getRpcConnection(), restoreHeight);
        assert.equal(await wallet.getMnemonic(), TestUtils.MNEMONIC);
        assert(await wallet.getPrimaryAddress(), TestUtils.ADDRESS);
        assert(await wallet.getNetworkType(), TestUtils.NETWORK_TYPE);
        assert(await wallet.getDaemonConnection());
        assert(await that.daemon.getRpcConnection() != wallet.getDaemonConnection());
        assert.equal((await wallet.getDaemonConnection()).getUri(), (await that.daemon.getRpcConnection()).getUri());
        assert.equal((await wallet.getDaemonConnection()).getUsername(), (await that.daemon.getRpcConnection()).getUsername());
        assert.equal((await wallet.getDaemonConnection()).getPassword(), (await that.daemon.getRpcConnection()).getPassword());
        assert(await wallet.isConnected());
        assert.equal(await wallet.getMnemonicLanguage(), "English");
        assert(!(await wallet.isSynced()));
        assert.equal(await wallet.getHeight(), 1); // TODO monero core: why does height of new unsynced wallet start at 1?
        assert.equal(await wallet.getRestoreHeight(), restoreHeight);
        await wallet.close();
      });
      
      if (config.testNonRelays)
      it("Can create a core wallet from keys", async function() {
        
        // recreate test wallet from keys
        let wallet = that.wallet;
        let walletKeys = await that.createWalletFromKeysCustom(TestUtils.WALLET_PASSWORD, await wallet.getNetworkType(), await wallet.getPrimaryAddress(), await wallet.getPrivateViewKey(), await wallet.getPrivateSpendKey(), await wallet.getDaemonConnection(), TestUtils.FIRST_RECEIVE_HEIGHT, undefined);
        let err;
        try {
          assert.equal(await walletKeys.getMnemonic(), await wallet.getMnemonic());
          assert.equal(await walletKeys.getPrimaryAddress(), await wallet.getPrimaryAddress());
          assert.equal(await walletKeys.getPrivateViewKey(), await wallet.getPrivateViewKey());
          assert.equal(await walletKeys.getPublicViewKey(), await wallet.getPublicViewKey());
          assert.equal(await walletKeys.getPrivateSpendKey(), await wallet.getPrivateSpendKey());
          assert.equal(await walletKeys.getPublicSpendKey(), await wallet.getPublicSpendKey());
          assert.equal(await walletKeys.getRestoreHeight(), TestUtils.FIRST_RECEIVE_HEIGHT);
          assert(await walletKeys.isConnected());
          assert(!(await walletKeys.isSynced()));
        } catch (e) {
          err = e;
        }
        await walletKeys.close();
        if (err) throw err;
      });
      
      // TODO monero core: cannot re-sync from lower block height after wallet saved
      if (config.testNonRelays && !config.liteMode && false)
      it("Can re-sync an existing wallet from scratch", async function() {
        let wallet = await that.openWalletCustom(TestUtils.WALLET_WASM_PATH_1, TestUtils.WALLET_PASSWORD, MoneroNetworkType.STAGENET);  // wallet must already exist
        await wallet.setDaemonConnection(TestUtils.getDaemonRpcConnection());
        //long startHeight = TestUtils.TEST_RESTORE_HEIGHT;
        let startHeight = 0;
        let progressTester = new SyncProgressTester(wallet, startHeight, await wallet.getDaemonHeight());
        await wallet.setRestoreHeight(1);
        let result = await wallet.sync(progressTester, 1);
        await progressTester.onDone(await wallet.getDaemonHeight());
        
        // test result after syncing
        assert(await wallet.isConnected());
        assert(await wallet.isSynced());
        assert.equal(result.getNumBlocksFetched(), await wallet.getDaemonHeight() - startHeight);
        assert(result.getReceivedMoney());
        assert.equal(await wallet.getHeight(), await that.daemon.getHeight());
        await wallet.close();
      });
      
      if (config.testNonRelays)
      it("Can sync a wallet with a randomly generated seed", async function() {
        assert(await that.daemon.isConnected(), "Not connected to daemon");

        // create test wallet
        let restoreHeight = await that.daemon.getHeight();
        let wallet = await that.createWalletRandomCustom(TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, await that.daemon.getRpcConnection(), undefined);

        // test wallet's height before syncing
        let walletGt;
        let err;
        try {
          assert.equal((await wallet.getDaemonConnection()).getUri(), (await that.daemon.getRpcConnection()).getUri());
          assert.equal((await wallet.getDaemonConnection()).getUsername(), (await that.daemon.getRpcConnection()).getUsername());
          assert.equal((await wallet.getDaemonConnection()).getPassword(), (await that.daemon.getRpcConnection()).getPassword());
          assert.equal(await wallet.getDaemonHeight(), restoreHeight);
          assert(await wallet.isConnected());
          assert(!(await wallet.isSynced()));
          assert.equal(await wallet.getHeight(), 1);
          assert.equal(await wallet.getRestoreHeight(), restoreHeight);
          assert.equal(await wallet.getDaemonHeight(), await that.daemon.getHeight());
  
          // sync the wallet
          let progressTester = new SyncProgressTester(wallet, await wallet.getRestoreHeight(), await wallet.getDaemonHeight());
          let result = await wallet.sync(progressTester, undefined);
          await progressTester.onDone(await wallet.getDaemonHeight());
        
          // test result after syncing
          walletGt = await that.createWalletGroundTruth(TestUtils.NETWORK_TYPE, await wallet.getMnemonic(), restoreHeight);
          assert(await wallet.isConnected());
          assert(await wallet.isSynced());
          assert.equal(result.getNumBlocksFetched(), 0);
          assert(!result.getReceivedMoney());
          assert.equal(await wallet.getHeight(), await that.daemon.getHeight());

          // sync the wallet with default params
          await wallet.sync();
          assert(await wallet.isSynced());
          assert.equal(await wallet.getHeight(), await that.daemon.getHeight());
          
          // compare wallet to ground truth
          await TestMoneroWalletCore._testWalletEqualityOnChain(walletGt, wallet);
        } catch (e) {
          err = e;
        }
        
        // finally 
        if (walletGt) await walletGt.close();
        await wallet.close();
        if (err) throw err;
        
        // attempt to sync unconnected wallet
        wallet = await that.createWalletRandomCustom(TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE);
        err = undefined;
        try {
          await wallet.sync();
          throw new Error("Should have thrown exception");
        } catch (e1) {
          try {
            assert.equal(e1.message, "Wallet is not connected to daemon");
          } catch (e2) {
            err = e2;
          }
        }
        
        // finally
        await wallet.close();
        if (err) throw err;
      });
      
      if (false && config.testNonRelays && !config.liteMode) // TODO: re-enable before release
      it("Can sync a wallet created from mnemonic from the genesis", async function() {
        await _testSyncMnemonic(undefined, undefined, true, false);
      });
      
      if (config.testNonRelays)
      it("Can sync a wallet created from mnemonic from a restore height", async function() {
        await _testSyncMnemonic(undefined, TestUtils.FIRST_RECEIVE_HEIGHT);
      });
      
      if (config.testNonRelays && !config.liteMode)
      it("Can sync a wallet created from mnemonic from a start height.", async function() {
        await _testSyncMnemonic(TestUtils.FIRST_RECEIVE_HEIGHT, undefined, false, true);
      });
      
      if (config.testNonRelays && !config.liteMode)
      it("Can sync a wallet created from mnemonic from a start height less than the restore height", async function() {
        await _testSyncMnemonic(TestUtils.FIRST_RECEIVE_HEIGHT, TestUtils.FIRST_RECEIVE_HEIGHT + 3);
      });
      
      if (config.testNonRelays && !config.liteMode)
      it("Can sync a wallet created from mnemonic from a start height greater than the restore height", async function() {
        await _testSyncMnemonic(TestUtils.FIRST_RECEIVE_HEIGHT + 3, TestUtils.FIRST_RECEIVE_HEIGHT);
      });
      
      async function _testSyncMnemonic(startHeight, restoreHeight, skipGtComparison, testPostSyncNotifications) {
        assert(await that.daemon.isConnected(), "Not connected to daemon");
        if (startHeight !== undefined && restoreHeight != undefined) assert(startHeight <= TestUtils.FIRST_RECEIVE_HEIGHT || restoreHeight <= TestUtils.FIRST_RECEIVE_HEIGHT);
        
        // create wallet from mnemonic
        let wallet = await that.createWalletFromMnemonicCustom(TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, await that.daemon.getRpcConnection(), restoreHeight, undefined);
        
        // sanitize expected sync bounds
        if (restoreHeight === undefined) restoreHeight = 0;
        let startHeightExpected = startHeight === undefined ? restoreHeight : startHeight;
        if (startHeightExpected === 0) startHeightExpected = 1;
        let endHeightExpected = await wallet.getDaemonMaxPeerHeight();
        
        // test wallet and close as final step
        let walletGt = undefined;
        let err = undefined;  // to permit final cleanup like Java's try...catch...finally
        try {
          
          // test wallet's height before syncing
          assert(await wallet.isConnected());
          assert(!(await wallet.isSynced()));
          assert.equal(await wallet.getHeight(), 1);
          assert.equal(await wallet.getRestoreHeight(), restoreHeight);
          
          // register a wallet listener which tests notifications throughout the sync
          let walletSyncTester = new WalletSyncTester(wallet, startHeightExpected, endHeightExpected);
          await wallet.addListener(walletSyncTester);
          
          // sync the wallet with a listener which tests sync notifications
          let progressTester = new SyncProgressTester(wallet, startHeightExpected, endHeightExpected);
          let result = await wallet.sync(progressTester, startHeight);
          
          // test completion of the wallet and sync listeners
          await progressTester.onDone(await wallet.getDaemonHeight());
          await walletSyncTester.onDone(await wallet.getDaemonHeight());
          
          // test result after syncing
          assert(await wallet.isSynced());
          assert.equal(result.getNumBlocksFetched(), await wallet.getDaemonHeight() - startHeightExpected);
          assert(result.getReceivedMoney());
          assert.equal(await wallet.getHeight(), await that.daemon.getHeight());
          assert.equal(await wallet.getDaemonHeight(), await that.daemon.getHeight());
          if (startHeightExpected > TestUtils.FIRST_RECEIVE_HEIGHT) assert((await wallet.getTxs())[0].getHeight() > TestUtils.FIRST_RECEIVE_HEIGHT);  // wallet is partially synced so first tx happens after true restore height
          else assert.equal((await wallet.getTxs())[0].getHeight(), TestUtils.FIRST_RECEIVE_HEIGHT);  // wallet should be fully synced so first tx happens on true restore height
          
          // sync the wallet with default params
          result = await wallet.sync();
          assert(await wallet.isSynced());
          assert.equal(await wallet.getHeight(), await that.daemon.getHeight());
          assert.equal(result.getNumBlocksFetched(), 0);
          assert(!result.getReceivedMoney());
          
          // compare with ground truth
          if (!skipGtComparison) {
            walletGt = await that.createWalletGroundTruth(TestUtils.NETWORK_TYPE, await wallet.getMnemonic(), startHeightExpected);
            await TestMoneroWalletCore._testWalletEqualityOnChain(walletGt, wallet);
          }
          
          // if testing post-sync notifications, wait for a block to be added to the chain
          // then test that sync arg listener was not invoked and registered wallet listener was invoked
          if (testPostSyncNotifications) {
            
            // start automatic syncing
            await wallet.startSyncing();
            
            // attempt to start mining to push the network along  // TODO: TestUtils.tryStartMining() : reqId, TestUtils.tryStopMining(reqId)
            let startedMining = false;
            let miningStatus = await that.daemon.getMiningStatus();
            if (!miningStatus.isActive()) {
              try {
                await StartMining.startMining();
                //await wallet.startMining(7, false, true); // TODO: support client-side mining?
                startedMining = true;
              } catch (e) {
                // no problem
              }
            }
            
            try {
              
              // wait for block
              console.log("Waiting for next block to test post sync notifications");
              await that.daemon.getNextBlockHeader();
              
              // ensure wallet has time to detect new block
              await new Promise(function(resolve) { setTimeout(resolve, MoneroUtils.WALLET_REFRESH_RATE); }); // sleep for the wallet interval
              
              // test that wallet listener's onSyncProgress() and onNewBlock() were invoked after previous completion
              assert(walletSyncTester.getOnSyncProgressAfterDone());
              assert(walletSyncTester.getOnNewBlockAfterDone());
            } catch (e) {
              err = e;
            }
            
            // finally
            if (startedMining) {
              await that.daemon.stopMining();
              //await wallet.stopMining();  // TODO: support client-side mining?
            }
            if (err) throw err;
          }
        } catch (e) {
          err = e;
        }
        
        // finally
        if (walletGt !== undefined) await walletGt.close();
        await wallet.close();
        if (err) throw err;
      }
      
      if (config.testNonRelays)
      it("Can sync a wallet created from keys", async function() {
        
        // recreate test wallet from keys
        let walletKeys = await that.createWalletFromKeysCustom(TestUtils.WALLET_PASSWORD,  await that.wallet.getNetworkType(), await that.wallet.getPrimaryAddress(), await that.wallet.getPrivateViewKey(), await that.wallet.getPrivateSpendKey(), await that.wallet.getDaemonConnection(), TestUtils.FIRST_RECEIVE_HEIGHT, undefined);
        
        // create ground truth wallet for comparison
        let walletGt = await that.createWalletGroundTruth(TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, TestUtils.FIRST_RECEIVE_HEIGHT);
        
        // test wallet and close as final step
        let err;
        try {
          assert.equal(await walletKeys.getMnemonic(), await walletKeys.getMnemonic());
          assert.equal(await walletKeys.getPrimaryAddress(), await walletKeys.getPrimaryAddress());
          assert.equal(await walletKeys.getPrivateViewKey(), await walletKeys.getPrivateViewKey());
          assert.equal(await walletKeys.getPublicViewKey(), await walletKeys.getPublicViewKey());
          assert.equal(await walletKeys.getPrivateSpendKey(), await walletKeys.getPrivateSpendKey());
          assert.equal(await walletKeys.getPublicSpendKey(), await walletKeys.getPublicSpendKey());
          assert.equal(await walletKeys.getRestoreHeight(), TestUtils.FIRST_RECEIVE_HEIGHT);
          assert(await walletKeys.isConnected());
          assert(!(await walletKeys.isSynced()));
          
          // sync the wallet
          let progressTester = new SyncProgressTester(walletKeys, TestUtils.FIRST_RECEIVE_HEIGHT, await walletKeys.getDaemonMaxPeerHeight());
          let result = await walletKeys.sync(progressTester);
          await progressTester.onDone(await walletKeys.getDaemonHeight());
          
          // test result after syncing
          assert(await walletKeys.isSynced());
          assert.equal(result.getNumBlocksFetched(), await walletKeys.getDaemonHeight() - TestUtils.FIRST_RECEIVE_HEIGHT);
          assert(result.getReceivedMoney());
          assert.equal(await walletKeys.getHeight(), await that.daemon.getHeight());
          assert.equal(await walletKeys.getDaemonHeight(), await that.daemon.getHeight());
          assert.equal((await walletKeys.getTxs())[0].getHeight(), TestUtils.FIRST_RECEIVE_HEIGHT);  // wallet should be fully synced so first tx happens on true restore height
          
          // compare with ground truth
          await TestMoneroWalletCore._testWalletEqualityOnChain(walletGt, walletKeys);
        } catch (e) {
          err = e;
        }
        
        // finally
        await walletGt.close();
        await walletKeys.close();
        if (err) throw err;
      });
      
      // TODO: test start syncing, notification of syncs happening, stop syncing, no notifications, etc
      if (config.testNonRelays)
      it("Can start and stop syncing", async function() {
        
        // test unconnected wallet
        let err;  // used to emulate Java's try...catch...finally
        let wallet = await that.createWalletRandomCustom(TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, undefined, undefined);
        try {
          assert.notEqual(await wallet.getMnemonic(), undefined);
          assert.equal(await wallet.getHeight(), 1);
          assert.equal(await wallet.getBalance(), BigInteger.parse("0"));
          await wallet.startSyncing();
        } catch (e1) {  // first error is expected
          try {
            assert.equal(e1.message, "Wallet is not connected to daemon");
          } catch (e2) {
            err = e2;
          }
        }
        
        // finally
        await wallet.close();
        if (err) throw err;
        
        // test that sync starts automatically
        let restoreHeight = await that.daemon.getHeight() - 100;
        wallet = await that.createWalletFromMnemonicCustom(TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, await that.daemon.getRpcConnection(), restoreHeight, undefined);
        try {
          
          // start syncing
          assert.equal(await wallet.getRestoreHeight(), restoreHeight);
          await wallet.startSyncing();
          assert.equal(await wallet.getHeight(), 1);
          let chainHeight = await wallet.getDaemonHeight();
          assert(!(await wallet.isSynced()));
          assert.equal(await wallet.getBalance(), BigInteger.parse("0"));
          
          // sleep for a moment
          await new Promise(function(resolve) { setTimeout(resolve, MoneroUtils.WALLET_REFRESH_RATE); }); // in ms
          
          // TODO: reconcile diffs with JNI
          // test that wallet has started syncing
          assert(await wallet.getHeight() > 1);
          chainHeight = await wallet.getDaemonHeight();
          //assert(await wallet.isSynced());
          //assert.equal(await wallet.getHeight(), await that.daemon.getHeight());
          
          // stop syncing
          await wallet.stopSyncing();
          //assert(await wallet.isSynced()); // wallet is still synced
          
       // TODO monero core: wallet.cpp m_synchronized only ever set to true, never false
//          // wait for block to be added to chain
//          await that.daemon.getNextBlockHeader();
//          
//          // wallet is no longer synced
//          assert(!(await wallet.isSynced()));  
        } catch (e) {
          err = e;
        }
                
        // finally
        await wallet.close();
        if (err) throw err;
        
        // test connected wallet
        wallet = await that.createWalletRandomCustom(TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, undefined, undefined);
        try {
          assert.notEqual(await wallet.getMnemonic(), undefined);
          await wallet.setDaemonConnection(await that.daemon.getRpcConnection());
          await wallet.startSyncing();
          assert.equal(await wallet.getHeight(), 1);
          let chainHeight = await wallet.getDaemonHeight();
          assert(!(await wallet.isSynced()));
          assert.equal(await wallet.getBalance(), BigInteger.parse("0"));
          await wallet.setRestoreHeight(chainHeight - 3);
          assert.equal(await wallet.getRestoreHeight(), chainHeight - 3);
          assert.equal((await wallet.getDaemonConnection()).getUri(), (await that.daemon.getRpcConnection()).getUri());
          assert.equal((await wallet.getDaemonConnection()).getUsername(), (await that.daemon.getRpcConnection()).getUsername());
          assert.equal((await wallet.getDaemonConnection()).getPassword(), (await that.daemon.getRpcConnection()).getPassword());
          await wallet.stopSyncing();
          await wallet.sync();
        } catch (e) {
          err = e;
        }
                
        // finally
        await wallet.close();
        if (err) throw err;
      });
      
      if (config.testNonRelays)
      it("Does not interfere with other wallet notifications", async function() {
        
        // create 2 wallets with a recent restore height
        let height = await that.daemon.getHeight();
        let restoreHeight = height - 5;
        await that.wallet.isSynced();
        let wallet1 = await that.createWalletFromMnemonicCustom(TestUtils.WALLET_PASSWORD, MoneroNetworkType.STAGENET, TestUtils.MNEMONIC, await that.daemon.getRpcConnection(), restoreHeight, undefined);
        let wallet2 = await that.createWalletFromMnemonicCustom(TestUtils.WALLET_PASSWORD, MoneroNetworkType.STAGENET, TestUtils.MNEMONIC, await that.daemon.getRpcConnection(), restoreHeight, undefined);
        
        // track notifications of each wallet
        let tester1 = new SyncProgressTester(wallet1, restoreHeight, height);
        let tester2 = new SyncProgressTester(wallet2, restoreHeight, height);
        await wallet1.addListener(tester1);
        await wallet2.addListener(tester2);
        
        // sync first wallet and test that 2nd is not notified
        await wallet1.sync();
        assert(tester1.isNotified());
        assert(!tester2.isNotified());
        
        // sync 2nd wallet and test that 1st is not notified
        let tester3 = new SyncProgressTester(wallet1, restoreHeight, height);
        await wallet1.addListener(tester3);
        await wallet2.sync();
        assert(tester2.isNotified());
        assert(!(tester3.isNotified()));
        
        // close wallets
        await wallet1.close();
        await wallet2.close();
      });
      
      if (config.testNonRelays)
      it("Is equal to the RPC wallet.", async function() {
        await WalletEqualityUtils.testWalletEqualityOnChain(await TestUtils.getWalletRpc(), that.wallet);
      });

      if (config.testNonRelays)
      it("Is equal to the RPC wallet with a seed offset", async function() {
        
        // use common offset to compare wallet implementations
        let seedOffset = "my super secret offset!";
        
        // create rpc wallet with offset
        let walletRpc = await TestUtils.getWalletRpc();
        await walletRpc.createWalletFromMnemonic(GenUtils.uuidv4(), TestUtils.WALLET_PASSWORD, await walletRpc.getMnemonic(), TestUtils.FIRST_RECEIVE_HEIGHT, undefined, seedOffset, undefined);
        
        // create wasm wallet with offset
        let walletCore = await that.createWalletFromMnemonicCustom(
                TestUtils.WALLET_PASSWORD,
                TestUtils.NETWORK_TYPE,
                TestUtils.MNEMONIC,
                await that.daemon.getRpcConnection(),
                TestUtils.FIRST_RECEIVE_HEIGHT,
                seedOffset);
        
        // deep compare
        await WalletEqualityUtils.testWalletEqualityOnChain(walletRpc, walletCore);
      });
      
      if (config.testNonRelays)
      it("Can be saved", async function() {
        
        // create unique path for new test wallet
        let path = TestMoneroWalletCore._getRandomWalletPath();
        
        // wallet does not exist
        assert(!(await MoneroWalletCore.walletExists(path, TestUtils.FS)));
        
        // cannot open non-existant wallet
        try {
          await MoneroWalletCore.openWallet(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, undefined, undefined, TestUtils.FS);
          throw new Error("Cannot open non-existant wallet");
        } catch (e) {
          assert.equal(e.message, "Wallet does not exist at path: " + path);
        }
        
        // create wallet at the path
        let restoreHeight = await that.daemon.getHeight() - 200;
        
        let wallet = await MoneroWalletCore.createWalletFromMnemonic(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, undefined, restoreHeight, undefined, undefined, TestUtils.FS);
        
        // test wallet at newly created state
        let err;
        try {
          assert(await MoneroWalletCore.walletExists(path, TestUtils.FS));
          assert.equal(await wallet.getMnemonic(), TestUtils.MNEMONIC);
          assert.equal(await wallet.getNetworkType(), TestUtils.NETWORK_TYPE);
          assert.equal(await wallet.getDaemonConnection(), undefined);
          assert.equal(await wallet.getRestoreHeight(), restoreHeight);
          assert.equal(await wallet.getMnemonicLanguage(), "English");
          assert.equal(await wallet.getHeight(), 1);
          assert.equal(await wallet.getRestoreHeight(), restoreHeight);
          
          // set the wallet's connection and sync
          await wallet.setDaemonConnection(TestUtils.getDaemonRpcConnection());
          await wallet.sync();
          assert.equal(await wallet.getHeight(), await wallet.getDaemonHeight());
          
          // close the wallet without saving
          await wallet.close();
          
          // re-open the wallet
          wallet = await MoneroWalletCore.openWallet(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, undefined, undefined, TestUtils.FS);
          
          // test wallet is at newly created state
          assert(await MoneroWalletCore.walletExists(path, TestUtils.FS));
          assert.equal(await wallet.getMnemonic(), TestUtils.MNEMONIC);
          assert.equal(await wallet.getNetworkType(), TestUtils.NETWORK_TYPE);
          assert.equal(await wallet.getDaemonConnection(), undefined);
          assert(!(await wallet.isConnected()));
          assert.equal(await wallet.getMnemonicLanguage(), "English");
          assert(!(await wallet.isSynced()));
          assert.equal(await wallet.getHeight(), 1);
          assert.equal(await wallet.getRestoreHeight(), 0); // TODO monero-core: restoreHeight is reset to 0 after closing
          
          // set the wallet's connection and sync
          await wallet.setDaemonConnection(TestUtils.getDaemonRpcConnection());
          assert(await wallet.isConnected());
          await wallet.setRestoreHeight(restoreHeight);
          await wallet.sync();
          assert(await wallet.isSynced());
          assert.equal(await wallet.getHeight(), await wallet.getDaemonHeight());
          let prevHeight = await wallet.getHeight();
          
          // save and close the wallet
          await wallet.save();
          await wallet.close();
          
          // re-open the wallet
          wallet = await MoneroWalletCore.openWallet(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, undefined, TestUtils.FS);
          
          // test wallet state is saved
          assert(!(await wallet.isConnected()));
          await wallet.setDaemonConnection(TestUtils.getDaemonRpcConnection());  // TODO monero core: daemon connection not stored in wallet files so must be explicitly set each time
          assert.equal(await wallet.getDaemonConnection(), TestUtils.getDaemonRpcConnection());
          assert(await wallet.isConnected());
          assert.equal(await wallet.getHeight(), prevHeight);
          assert.equal(await wallet.getRestoreHeight(), 0); // TODO monero core: restoreHeight is reset to 0 after closing
          assert(await MoneroWalletCore.walletExists(path, TestUtils.FS));
          assert.equal(await wallet.getMnemonic(), TestUtils.MNEMONIC);
          assert.equal(await wallet.getNetworkType(), TestUtils.NETWORK_TYPE);
          assert.equal(await wallet.getMnemonicLanguage(), "English");
          
          // sync
          await wallet.sync();
        } catch (e) {
          let err = e;
        }
        
        // finally
        await wallet.close();
        if (err) throw err;
      });
      
      if (config.testNonRelays)
      it("Can be moved", async function() {
        let err;
        let wallet;
        try {
          
          // create unique name for test wallet
          let walletName = "test_wallet_" + GenUtils.uuidv4();
          let path = TestUtils.TEST_WALLETS_DIR + "/" + walletName;
          
          // wallet does not exist
          assert(!await MoneroWalletCore.walletExists(path, TestUtils.FS));
          
          // create wallet at the path
          let restoreHeight = await that.daemon.getHeight() - 200;
          wallet = await MoneroWalletCore.createWalletFromMnemonic(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, undefined, restoreHeight, undefined, TestUtils.PROXY_TO_WORKER, TestUtils.FS);
          let subaddressLabel = "Move test wallet subaddress!";
          let account = await wallet.createAccount(subaddressLabel);
          await wallet.save();
          
          // wallet exists
          assert(await MoneroWalletCore.walletExists(path, TestUtils.FS));
          
          // move wallet to a subdirectory
          let movedPath = TestUtils.TEST_WALLETS_DIR + "/moved/" + walletName;
          await wallet.moveTo(movedPath, TestUtils.WALLET_PASSWORD);
          assert(!(await MoneroWalletCore.walletExists(path, TestUtils.FS)));
          assert(!(await MoneroWalletCore.walletExists(movedPath))); // wallet does not exist until saved
          await wallet.save();
          assert(!(await MoneroWalletCore.walletExists(path, TestUtils.FS)));
          assert(await MoneroWalletCore.walletExists(movedPath));
          await wallet.close();
          assert(!(await MoneroWalletCore.walletExists(path, TestUtils.FS)));
          assert(await MoneroWalletCore.walletExists(movedPath));
          
          // re-open and test wallet
          wallet = await MoneroWalletCore.openWallet(movedPath, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.PROXY_TO_WORKER, TestUtils.FS);
          assert.equal(await wallet.getSubaddress(account.getIndex(), 0).getLabel(), subaddressLabel);
          
          // move wallet back
          await wallet.moveTo(path, TestUtils.WALLET_PASSWORD);
          assert(!(await MoneroWalletCore.walletExists(path, TestUtils.FS)));  // wallet does not exist until saved
          assert(!(await MoneroWalletCore.walletExists(movedPath)));
          await wallet.save();
          assert(await MoneroWalletCore.walletExists(path, TestUtils.FS));
          assert(!(await MoneroWalletJni.walletExists(movedPath)));
          await wallet.close();
          assert(await MoneroWalletCore.walletExists(path, TestUtils.FS));
          assert(!(await MoneroWalletCore.walletExists(movedPath)));
        } catch (e) {
          err = e;
        }
        
        // final cleanup
        if (wallet) await wallet.close();
        if (err) throw err;
      });
      
    if (config.testNonRelays)
      it("Can be closed", async function() {
        let err;
        let wallet;
        try {
          
          // create a test wallet
          wallet = await that.createWalletRandomCustom(TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.getDaemonRpcConnection());
          let path = await wallet.getPath();
          await wallet.sync();
          assert(await wallet.getHeight() > 1);
          assert(await wallet.isSynced());
          assert.equal(await wallet.isClosed(), false);
          
          // close the wallet
          await wallet.close();
          assert(await wallet.isClosed());
          
          // attempt to interact with the wallet
          try { await wallet.getHeight(); }
          catch (e) { assert.equal(e.message, "Wallet is closed"); }
          try { await wallet.getMnemonic(); }
          catch (e) { assert.equal(e.message, "Wallet is closed"); }
          try { await wallet.sync(); }
          catch (e) { assert.equal(e.message, "Wallet is closed"); }
          try { await wallet.startSyncing(); }
          catch (e) { assert.equal(e.message, "Wallet is closed"); }
          try { await wallet.stopSyncing(); }
          catch (e) { assert.equal(e.message, "Wallet is closed"); }
          
          // re-open the wallet
          wallet = await that.openWalletCustom(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, await that.daemon.getRpcConnection());
          await wallet.sync();
          assert.equal(await wallet.getHeight(), await wallet.getDaemonHeight());
          assert.equal(await wallet.isClosed(), false);
        } catch (e) {
          console.log(e);
          err = e;
        }
        
        // final cleanup
        await wallet.close();
        assert(await wallet.isClosed());
        if (err) throw err;
      });
      
      // ----------------------------- NOTIFICATION TESTS -------------------------
      
      /**
       * 4 output notification tests are considered when transferring within one wallet.  // TODO: multi-wallet tests
       * 
       * 1. with local wallet data, transfer from/to same account
       * 2. with local wallet data, transfer from/to different accounts
       * 3. without local wallet data, transfer from/to same account
       * 4. without local wallet data, transfer from/to different accounts
       * 
       * For example, two wallets may be instantiated with the same mnemonic,
       * so neither is privy to the local wallet data of the other.
       */
      
    if (config.testNotifications)
      it("Notification test #1: notifies listeners of outputs sent from/to the same account using local wallet data", async function() {
        let issues = await testOutputNotifications(true);
        if (issues === undefined) return;
        let msg = "testOutputNotificationsSameAccounts() generated " + issues.length + " issues:\n" + issuesToStr(issues);
        console.log(msg);
        assert(!msg.includes("ERROR:"), msg);
      });
      
    if (config.testNotifications)
      it("Notification test #2: notifies listeners of outputs sent from/to different accounts using local wallet data", async function() {
        let issues = await testOutputNotifications(false);
        if (issues === undefined) return;
        let msg = "testOutputNotificationsDifferentAccounts() generated " + issues.length + " issues:\n" + issuesToStr(issues);
        console.log(msg);
        assert(!msg.includes("ERROR:"), msg);
      });
      
      async function testOutputNotifications(sameAccount) {
        
        // collect errors and warnings
        let errors = [];
        let wallet = that.wallet;
        
        // wait for wallet txs in the pool in case they were sent from another wallet and therefore will not fully sync until confirmed // TODO monero core
        await TestUtils.TX_POOL_WALLET_TRACKER.waitForWalletTxsToClearPool(wallet);
        
        // create send request
        let request = new MoneroSendRequest();
        request.setAccountIndex(0);
        let destinationAccounts = sameAccount ? [0, 1, 2] : [1, 2, 3];
        for (let destinationAccount of destinationAccounts) {
          request.addDestination(new MoneroDestination(await wallet.getAddress(destinationAccount, 0), TestUtils.MAX_FEE));
        }
        
        // get balances before for later comparison
        let balanceBefore = await wallet.getBalance();
        let unlockedBalanceBefore = await wallet.getUnlockedBalance();
        
        // register a listener to collect notifications
        let listener = new OutputNotificationCollector();
        await wallet.addListener(listener);
        
        // start syncing to test automatic notifications
        await wallet.startSyncing();
        
        // send tx
        let tx = (await wallet.send(request)).getTxs()[0];
        
        // test wallet's balance
        let balanceAfter = await wallet.getBalance();
        let unlockedBalanceAfter = await wallet.getUnlockedBalance();
        let balanceAfterExpected = balanceBefore.subtract(tx.getFee());  // txs sent from/to same wallet so only decrease in balance is tx fee
        if (!balanceAfterExpected.compare(balanceAfter) === 0) errors.push("WARNING: wallet balance immediately after send expected to be " + balanceAfterExpected + " but was " + balanceAfter);
        if (unlockedBalanceBefore.compare(unlockedBalanceAfter) <= 0 && unlockedBalanceBefore.compare(BigInteger.parse("0")) !== 0) errors.push("WARNING: Wallet unlocked balance immediately after send was expected to decrease but changed from " + unlockedBalanceBefore + " to " + unlockedBalanceAfter);
            
        // wait for wallet to send notifications
        if (listener.getOutputsSpent().length === 0) {
          errors.push("WARNING: wallet does not notify listeners of outputs when tx sent directly through wallet or when refreshed from the pool; must wait for confirmation to receive notifications and have correct balance");
          
          // mine until next block
          try { await StartMining.startMining(); } catch (e) { }
          await that.daemon.getNextBlockHeader();  
          try { await that.daemon.stopMining(); } catch (e) { }
          
          // sleep for a moment
          console.log("Sleeping to test that sync starts automatically...");
          await new Promise(function(resolve) { setTimeout(resolve, MoneroUtils.WALLET_REFRESH_RATE); }); // in ms
        }
        
        // test sent output notifications
        if (listener.getOutputsSpent().length === 0) {
          errors.push("ERROR: did not receive any sent output notifications");
          return errors;
        }
        
        // test received output notifications
        if (listener.getOutputsReceived().length < 4) {  // 3+ outputs received from transfers + 1 change output (very unlikely to send exact output amount)
          errors.push("ERROR: received " + listener.getOutputsReceived().length + " output notifications when at least 4 were expected");
          return errors;
        }
        
        // must receive outputs with known subaddresses and amounts
        for (let destinationAccount of destinationAccounts) {
          if (!hasOutput(listener.getOutputsReceived(), destinationAccount, 0, TestUtils.MAX_FEE)) {
            errors.push("ERROR: missing expected received output to subaddress [" + destinationAccount + ", 0] of amount " + TestUtils.MAX_FEE);
            return errors;
          }
        }
        
        // since sending from/to the same wallet, the net amount spent = tx fee = outputs spent - outputs received
        let netAmount = BigInteger.parse("0");
        for (let outputSpent of listener.getOutputsSpent()) netAmount = netAmount.add(outputSpent.getAmount());
        for (let outputReceived of listener.getOutputsReceived()) netAmount = netAmount.subtract(outputReceived.getAmount());
        if (tx.getFee().compare(netAmount) !== 0) {
          errors.push("ERROR: net output amount must equal tx fee");
          return errors;
        }
        
        // test wallet's balance
        balanceAfter = await wallet.getBalance();
        unlockedBalanceAfter = await wallet.getUnlockedBalance();
        if (!balanceAfterExpected.compare(balanceAfter) === 0) errors.push("WARNING: Wallet balance after confirmation expected to be " + balanceAfterExpected + " but was " + balanceAfter);
        if (unlockedBalanceBefore.compare(unlockedBalanceAfter) <= 0 && unlockedBalanceBefore.compare(BigInteger.parse("0")) !== 0) errors.push("WARNING: Wallet unlocked balance immediately after send was expected to decrease but changed from " + unlockedBalanceBefore + " to " + unlockedBalanceAfter);

        // return all errors and warnings as single string
        return errors;
      }
      
      function issuesToStr(issues) {
        if (issues.length === 0) return undefined;
        let str = "";
        for (let i = 0; i < issues.length; i++) {
          str += (i + 1) + ": " + issues[i];
          if (i < issues.length - 1) str += "\n";
        }
        return str;
      }
      
      function hasOutput(outputs, accountIdx, subaddressIdx, amount) { // TODO: use comon filter?
        let query = new MoneroOutputQuery().setAccountIndex(accountIdx).setSubaddressIndex(subaddressIdx).setAmount(amount);
        for (let output of outputs) {
          if (query.meetsCriteria(output)) return true;
        }
        return false;
      }
      
      if (config.testNotifications)  // TODO: re-enable
      it("Can be created and receive funds", async function() {
        let err;
        let myWallet;
        try {
          
          // create a random stagenet wallet
          myWallet = await that.createWalletRandomCustom("mysupersecretpassword123", MoneroNetworkType.STAGENET, TestUtils.getDaemonRpcConnection());
          await myWallet.startSyncing();
          
          // listen for received outputs
          let myListener = new OutputNotificationCollector();
          await myWallet.addListener(myListener);
          
          // send funds to the created wallet
          await TestUtils.TX_POOL_WALLET_TRACKER.waitForWalletTxsToClearPool(that.wallet);
          let sentTx = (await that.wallet.send(0, await myWallet.getPrimaryAddress(), TestUtils.MAX_FEE)).getTxs()[0];
          
          // wait until block added to the chain
          // TODO monero core: notify on refresh from pool instead instead of confirmation
          try { await StartMining.startMining(); } catch (e) { }
          await that.daemon.getNextBlockHeader();
          try { await that.daemon.stopMining(); } catch (e) { }
          
          // give wallets time to observe block
          await new Promise(function(resolve) { setTimeout(resolve, MoneroUtils.WALLET_REFRESH_RATE); }); // in ms

          // tx is now confirmed
          assert((await that.wallet.getTx(sentTx.getHash())).isConfirmed()); // TODO: tx is not guaranteed to confirm, which can cause occasional test failure
          
          // created wallet should have notified listeners of received outputs
          assert(myListener.getOutputsReceived().length > 0);
        } catch (e) {
          err = e;
        }
        
        // final cleanup
        await myWallet.close();
        if (err) throw err;
      });
      
      it("Supports multisig sample code", async function() {
        await testCreateMultisigWallet(2, 2);
        await testCreateMultisigWallet(2, 3);
        await testCreateMultisigWallet(2, 4);
      });
      
      async function testCreateMultisigWallet(M, N) {
        console.log("Creating " + M + "/" + N + " multisig wallet");
        
        // create participating wallets
        let wallets = []
        for (let i = 0; i < N; i++) {
          wallets.push(await that.createWalletRandom());
        }
        
        // prepare and collect multisig hex from each participant
        let preparedMultisigHexes = []
        for (let wallet of wallets) preparedMultisigHexes.push(await wallet.prepareMultisig());
        
        // make each wallet multsig and collect results
        let madeMultisigHexes = [];
        for (let i = 0; i < wallets.length; i++) {
          
          // collect prepared multisig hexes from wallet's peers
          let peerMultisigHexes = [];
          for (let j = 0; j < wallets.length; j++) if (j !== i) peerMultisigHexes.push(preparedMultisigHexes[j]);
        
          // make wallet multisig and collect result hex
          let result = await wallets[i].makeMultisig(peerMultisigHexes, M, TestUtils.WALLET_PASSWORD);
          madeMultisigHexes.push(result.getMultisigHex());
        }
        
        // if wallet is not N/N, exchange multisig keys N-M times
        if (M !== N) {
          let multisigHexes = madeMultisigHexes;
          for (let i = 0; i < N - M; i++) {
            
            // exchange multisig keys among participants and collect results for next round if applicable
            let resultMultisigHexes = [];
            for (let wallet of wallets) {
              
              // import the multisig hex of other participants and collect results
              let result = await wallet.exchangeMultisigKeys(multisigHexes, TestUtils.WALLET_PASSWORD);
              resultMultisigHexes.push(result.getMultisigHex());
            }
            
            // use resulting multisig hex for next round of exchange if applicable
            multisigHexes = resultMultisigHexes;
          }
        }
        
        // wallets are now multisig
        for (let wallet of wallets) {
          let primaryAddress = await wallet.getAddress(0, 0);
          MoneroUtils.validateAddress(primaryAddress, await wallet.getNetworkType());
          let info = await wallet.getMultisigInfo();
          assert(info.isMultisig());
          assert(info.isReady());
          assert.equal(info.getThreshold(), M);
          assert.equal(info.getNumParticipants(), N);
          await wallet.close(true);
        }
      }
    });
  }
  
  //----------------------------- PRIVATE HELPERS -----------------------------
  
  static _getRandomWalletPath() {
    return TestUtils.TEST_WALLETS_DIR + "/test_wallet_" + GenUtils.uuidv4();
  }
  
  // possible configuration: on chain xor local wallet data ("strict"), txs ordered same way? TBD
  static async _testWalletEqualityOnChain(wallet1, wallet2) {
    await WalletEqualityUtils.testWalletEqualityOnChain(wallet1, wallet2);
    assert.equal(await wallet2.getNetworkType(), await wallet1.getNetworkType());
    //assert.equal(await wallet2.getRestoreHeight(), await wallet1.getRestoreHeight()); // TODO monero-core: restore height is lost after close
    assert.equal((await wallet2.getDaemonConnection()).getUri(), (await wallet1.getDaemonConnection()).getUri());
    assert.equal((await wallet2.getDaemonConnection()).getUsername(), (await wallet1.getDaemonConnection()).getUsername());
    assert.equal((await wallet2.getDaemonConnection()).getPassword(), (await wallet1.getDaemonConnection()).getPassword());
    assert.equal(await wallet2.getMnemonicLanguage(), await wallet1.getMnemonicLanguage());
    // TODO: more wasm-specific extensions
  }
}

/**
 * Wallet listener to collect output notifications.
 */
class OutputNotificationCollector extends MoneroWalletListener {
  
  constructor() {
    super();
    this.outputsReceived = [];
    this.outputsSpent = [];
  }
  
  onOutputReceived(output) {
    this.outputsReceived.push(output);
  }
  
  onOutputSpent(output) {
    this.outputsSpent.push(output);
  }
  
  getOutputsReceived() {
    return this.outputsReceived;
  }
  
  getOutputsSpent() {
    return this.outputsSpent;
  }
}

/**
 * Helper class to test progress updates.
 */
class SyncProgressTester extends MoneroWalletListener {
  
  constructor(wallet, startHeight, endHeight) {
    super();
    this.wallet = wallet;
    assert(startHeight >= 0);
    assert(endHeight >= 0);
    this.startHeight = startHeight;
    this.prevEndHeight = endHeight;
    this.isDone = false;
  }
  
  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    if ((height - startHeight) % SyncProgressTester.PRINT_INCREMENT === 0 || percentDone === 1.0) console.log("onSyncProgress(" + height + ", " + startHeight + ", " + endHeight + ", " + percentDone + ", " + message + ")");
    
    // registered wallet listeners will continue to get sync notifications after the wallet's initial sync
    if (this.isDone) {
      assert(this.wallet.getListeners().includes(this), "Listener has completed and is not registered so should not be called again");
      this.onSyncProgressAfterDone = true;
    }
    
    // update tester's start height if new sync session
    if (this.prevCompleteHeight !== undefined && startHeight === this.prevCompleteHeight) this.startHeight = startHeight;  
    
    // if sync is complete, record completion height for subsequent start heights
    if (percentDone === 1) this.prevCompleteHeight = endHeight; // TODO: Double.compare(x,y) === 0 to not lose precision?
    
    // otherwise start height is equal to previous completion height
    else if (this.prevCompleteHeight !== undefined) assert.equal(startHeight, this.prevCompleteHeight);
    
    assert(endHeight > startHeight, "end height > start height");
    assert.equal(startHeight, this.startHeight);
    assert(endHeight >= this.prevEndHeight);  // chain can grow while syncing
    this.prevEndHeight = endHeight;
    assert(height >= startHeight);
    assert(height < endHeight);
    let expectedPercentDone = (height - startHeight + 1) / (endHeight - startHeight);
    assert.equal(expectedPercentDone, percentDone);
    if (this.prevHeight === undefined) assert.equal(height, startHeight);
    else assert.equal(this.prevHeight + 1, height);
    this.prevHeight = height;
  }
  
  async onDone(chainHeight) {
    assert(!this.isDone);
    this.isDone = true;
    if (this.prevHeight === undefined) {
      assert.equal(this.prevCompleteHeight, undefined);
      assert.equal(this.startHeight, chainHeight);
    } else {
      assert.equal(this.prevHeight, chainHeight - 1);  // otherwise last height is chain height - 1
      assert.equal(this.prevCompleteHeight, chainHeight);
    }
    this.onSyncProgressAfterDone = false;  // test subsequent onSyncProgress() calls
  }
  
  isNotified() {
    return this.prevHeight !== undefined;
  }
  
  getOnSyncProgressAfterDone() {
    return this.onSyncProgressAfterDone;
  }
}
SyncProgressTester.PRINT_INCREMENT = 2500;  // print every 2500 blocks

/**
 * Internal class to test all wallet notifications on sync. 
 */
class WalletSyncTester extends SyncProgressTester {
  
  constructor(wallet, startHeight, endHeight) {
    super(wallet, startHeight, endHeight);
    assert(startHeight >= 0);
    assert(endHeight >= 0);
    this.incomingTotal = BigInteger.parse("0");
    this.outgoingTotal = BigInteger.parse("0");
  }
  
  onNewBlock(height) {
    if (this.isDone) {
      assert(this.wallet.getListeners().includes(this), "Listener has completed and is not registered so should not be called again");
      this.onNewBlockAfterDone = true;
    }
    if (this.walletTesterPrevHeight !== undefined) assert.equal(height, this.walletTesterPrevHeight + 1);
    assert(height >= this.startHeight);
    this.walletTesterPrevHeight = height;
  }

  onOutputReceived(output) {
    assert.notEqual(output, undefined);
    this.prevOutputReceived = output;
    
    // test output
    TestUtils.testUnsignedBigInteger(output.getAmount());
    assert(output.getAccountIndex() >= 0);
    assert(output.getSubaddressIndex() >= 0);
    
    // test output's tx
    assert(output.getTx());
    assert(output.getTx() instanceof MoneroTxWallet);
    assert(output.getTx().getHash());
    assert.equal(output.getTx().getHash().length, 64);
    assert(output.getTx().getVersion() >= 0);
    assert(output.getTx().getUnlockTime() >= 0);
    assert.equal(output.getTx().getInputs(), undefined);
    assert.equal(output.getTx().getOutputs().length, 1);
    assert(output.getTx().getOutputs()[0] === output);
    
    // extra is not sent over the wasm bridge
    assert.equal(output.getTx().getExtra(), undefined);
    
    // add incoming amount to running total
    this.incomingTotal = this.incomingTotal.add(output.getAmount());
  }

  onOutputSpent(output) {
    assert.notEqual(output, undefined);
    this.prevOutputSpent = output;
    
    // test output
    TestUtils.testUnsignedBigInteger(output.getAmount());
    assert(output.getAccountIndex() >= 0);
    assert(output.getSubaddressIndex() >= 0);
    
    // test output's tx
    assert(output.getTx());
    assert(output.getTx() instanceof MoneroTxWallet);
    assert(output.getTx().getHash());
    assert.equal(output.getTx().getHash().length, 64);
    assert(output.getTx().getVersion() >= 0);
    assert.equal(output.getTx().getUnlockTime(), undefined);
    assert.equal(output.getTx().getInputs().length, 1);
    assert(output.getTx().getInputs()[0] === output);
    assert.equal(output.getTx().getOutputs(), undefined);
    
    // extra is not sent over the wasm bridge
    assert.equal(output.getTx().getExtra(), undefined);
    
    // add outgoing amount to running total
    this.outgoingTotal = this.outgoingTotal.add(output.getAmount());
  }
  
  async onDone(chainHeight) {
    await super.onDone(chainHeight);
    assert.notEqual(this.walletTesterPrevHeight, undefined);
    assert.notEqual(this.prevOutputReceived, undefined);
    assert.notEqual(this.prevOutputSpent, undefined);
    let balance = this.incomingTotal.subtract(this.outgoingTotal);
    assert.equal((await this.wallet.getBalance()).toString(), balance.toString());
    this.onNewBlockAfterDone = false;  // test subsequent onNewBlock() calls
  }
  
  getOnNewBlockAfterDone() {
    return this.onNewBlockAfterDone;
  }
}

module.exports = TestMoneroWalletCore;
