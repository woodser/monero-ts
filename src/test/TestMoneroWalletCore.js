const TestMoneroWalletCommon = require("./TestMoneroWalletCommon");
const MoneroWalletCore = require("../main/js/wallet/MoneroWalletCore");

/**
 * Tests a Monero wallet using WebAssembly to bridge to monero-project's wallet2.
 */
class TestMoneroWalletCore extends TestMoneroWalletCommon {
  
  constructor() {
    super(TestUtils.getDaemonRpc());
  }
  
  async getTestWallet() {
    return await TestUtils.getWalletCore();
  }
  
  async openWallet(path) {
    let wallet = await MoneroWalletCore.openWallet(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.getDaemonRpc().getRpcConnection());
    //await wallet.startSyncing();  // TODO
    return wallet;
  }
  
  async createWalletRandom() {
    let wallet = await MoneroWalletCore.createWalletRandom(TestUtils.TEST_WALLETS_DIR + "/" + GenUtils.uuidv4(), TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.getDaemonRpc().getRpcConnection());
    //await wallet.startSyncing();  // TODO
    return wallet;
  }
  
  async createWalletFromMnemonic(mnemonic, restoreHeight, seedOffset) {
    let wallet = await MoneroWalletCore.createWalletFromMnemonic(TestUtils.TEST_WALLETS_DIR + "/" + GenUtils.uuidv4(), TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, mnemonic, TestUtils.getDaemonRpc().getRpcConnection(), restoreHeight, seedOffset);
    //await wallet.startSyncing();  // TODO
    return wallet;
  }
  
  async createWalletFromKeys(address, privateViewKey, privateSpendKey, daemonConnection, firstReceiveHeight, language) {
    let wallet = await MoneroWalletCore.createWalletFromKeys(TestUtils.TEST_WALLETS_DIR + "/" + GenUtils.uuidv4(), TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, address, privateViewKey, privateSpendKey, daemonConnection, firstReceiveHeight, language);
    //await wallet.startSyncing();  // TODO
    return wallet;
  }
  
  async getMnemonicLanguages() {
    return await MoneroWalletCore.getMnemonicLanguages();
  }
  
  // ------------------------------- BEGIN TESTS ------------------------------
  
  runTests(config) {
    let that = this;
    describe("TEST MONERO WALLET CORE", function() {
      
      // initialize wallet
      before(async function() {
        try {
          //that.wallet = await that.getTestWallet(); // TODO: update in TestMoneroWalletWasm.js
        } catch (e) {
          console.log("ERROR before!!!");
          console.log(e.message);
          throw e;
        }
        TestUtils.TX_POOL_WALLET_TRACKER.reset(); // all wallets need to wait for txs to confirm to reliably sync
      });
      
      // save wallet after tests
      after(async function() {
        console.log("Saving wallet on shut down");
        try {
          //await that.wallet.save();
        } catch (e) {
          console.log("ERROR after!!!");
          console.log(e.message);
          throw e;
        }
      });
      
      // run tests specific to wallet wasm
      that._testWalletCore(config);
      
      // run common tests
      //that.runCommonTests(config);
    });
  }
  
  _testWalletCore(config) {
    let that = this;
    let daemon = this.daemon;
    describe("Tests specific to Core wallet", function() {
      
      if (config.testNonRelays)
      it("Can get the daemon's height", async function() {
        assert(await that.wallet.isConnected());
        let daemonHeight = await that.wallet.getDaemonHeight();
        assert(daemonHeight > 0);
      });
      
      if (config.testNonRelays)
      it("Can get the daemon's max peer height", async function() {
        let height = await that.wallet.getDaemonMaxPeerHeight();
        assert(height > 0);
      });
      
      if (config.testNonRelays)
      it("Can set the daemon connection", async function() {
        
        // create random wallet with defaults
        let path = TestMoneroWalletCore._getRandomWalletPath();
        let wallet = await MoneroWalletCore.createWalletRandom(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE);
        assert.equal(await wallet.getDaemonConnection(), undefined);
        
        // set daemon uri
        await wallet.setDaemonConnection(TestUtils.DAEMON_RPC_URI);
        assert.deepEqual((await wallet.getDaemonConnection()).getConfig(), new MoneroRpcConnection(TestUtils.DAEMON_RPC_URI).getConfig());
        assert(await daemon.isConnected());
        
        // nullify daemon connection
        await wallet.setDaemonConnection(undefined);
        assert.equal(await wallet.getDaemonConnection(), undefined);
        await wallet.setDaemonConnection(TestUtils.DAEMON_RPC_URI);
        assert.deepEqual((await wallet.getDaemonConnection()).getConfig(), new MoneroRpcConnection(TestUtils.DAEMON_RPC_URI).getConfig());
        await wallet.setDaemonConnection(undefined);
        assert.equal(await wallet.getDaemonConnection(), undefined);
        
        // set daemon uri to non-daemon
        await wallet.setDaemonConnection("www.getmonero.org");
        assert.deepEqual((await wallet.getDaemonConnection()).getConfig(), new MoneroRpcConnection("www.getmonero.org").getConfig());
        assert(!(await wallet.isConnected()));
        
        // set daemon to invalid uri
        await wallet.setDaemonConnection("abc123");
        assert(!(await wallet.isConnected()));
        
        // attempt to sync
        let err;
        try {
          await wallet.sync();
          throw new Error("Exception expected");
        } catch (e1) {
          try {
            assert.equal(e1.message, "Wallet is not connected to daemon");
          } catch (e2) {
            err = e2;
          }
        }
        
        // close wallet and throw if error occurred
        await wallet.close();
        if (err) throw err;
      });
      
      if (config.testNonRelays)
      it("Can create a random core wallet", async function() {
        
        // create random wallet with defaults
        let path = TestMoneroWalletCore._getRandomWalletPath();
        let wallet = await MoneroWalletCore.createWalletRandom(path, TestUtils.WALLET_PASSWORD, MoneroNetworkType.MAINNET);
        MoneroUtils.validateMnemonic(await wallet.getMnemonic());
        MoneroUtils.validateAddress(await wallet.getPrimaryAddress(), MoneroNetworkType.MAINNET);
        assert.equal(await wallet.getNetworkType(), MoneroNetworkType.MAINNET);
        assert.equal(await wallet.getDaemonConnection(), undefined);
        assert(!(await wallet.isConnected()));
        assert.equal(await wallet.getMnemonicLanguage(), "English");
        assert.equal(await wallet.getPath(), path);
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
        await wallet.setDaemonConnection(await daemon.getRpcConnection());
        assert.equal(await wallet.getDaemonHeight(), await daemon.getHeight());
        
        // close wallet which releases resources
        await wallet.close();

        // create random wallet with non defaults
        path = TestMoneroWalletCore._getRandomWalletPath();
        wallet = await MoneroWalletCore.createWalletRandom(path, TestUtils.WALLET_PASSWORD, MoneroNetworkType.TESTNET, await daemon.getRpcConnection(), "Spanish");
        MoneroUtils.validateMnemonic(await wallet.getMnemonic());
        MoneroUtils.validateAddress(await wallet.getPrimaryAddress(), MoneroNetworkType.TESTNET);
        assert.equal(await wallet.getNetworkType(), await MoneroNetworkType.TESTNET);
        assert(await wallet.getDaemonConnection());
        assert((await daemon.getRpcConnection()).getConfig() !== (await wallet.getDaemonConnection()).getConfig());         // not same reference
        assert.equal((await wallet.getDaemonConnection()).getUri(), (await daemon.getRpcConnection()).getUri());
        assert.equal((await wallet.getDaemonConnection()).getUsername(), (await daemon.getRpcConnection()).getUsername());
        assert.equal((await wallet.getDaemonConnection()).getPassword(), (await daemon.getRpcConnection()).getPassword());
        assert(await wallet.isConnected());
        assert.equal(await wallet.getMnemonicLanguage(), "Spanish");
        assert.equal(await wallet.getPath(), path);
        assert(!(await wallet.isSynced()));
        assert.equal(await wallet.getHeight(), 1); // TODO monero core: why is height of unsynced wallet 1?
        if (await daemon.isConnected()) assert.equal(await wallet.getRestoreHeight(), await daemon.getHeight());
        else assert(await wallet.getRestoreHeight() >= 0);
        await wallet.close();
      });
      
      if (config.testNonRelays)
      it("Can create a core wallet from mnemonic", async function() {
        
        // create wallet with mnemonic and defaults
        let path = TestMoneroWalletCore._getRandomWalletPath();
        let wallet = await MoneroWalletCore.createWalletFromMnemonic(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC);
        assert.equal(await wallet.getMnemonic(), TestUtils.MNEMONIC);
        assert.equal(await wallet.getPrimaryAddress(), TestUtils.ADDRESS);
        assert.equal(await wallet.getNetworkType(), TestUtils.NETWORK_TYPE);
        assert.equal(await wallet.getDaemonConnection(), undefined);
        assert(!(await wallet.isConnected()));
        assert.equal(await wallet.getMnemonicLanguage(), "English");
        assert.equal(await wallet.getPath(), path);
        assert(!(await wallet.isSynced()));
        assert.equal(await wallet.getHeight(), 1);
        assert.equal(await wallet.getRestoreHeight(), 0);
        try { await wallet.startSyncing(); } catch (e) { assert.equal(e.message, "Wallet is not connected to daemon"); }
        wallet.close();
        
        // create wallet without restore height
        path = TestMoneroWalletCore._getRandomWalletPath();
        wallet = await MoneroWalletCore.createWalletFromMnemonic(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, daemon.getRpcConnection());
        assert.equal(await wallet.getMnemonic(), TestUtils.MNEMONIC);
        assert.equal(await wallet.getPrimaryAddress(), TestUtils.ADDRESS);
        assert.equal(TestUtils.NETWORK_TYPE, await wallet.getNetworkType());
        assert(await wallet.getDaemonConnection());
        assert(await daemon.getRpcConnection() != await wallet.getDaemonConnection());
        assert.equal((await wallet.getDaemonConnection()).getUri(), (await daemon.getRpcConnection()).getUri());
        assert.equal((await wallet.getDaemonConnection()).getUsername(), (await daemon.getRpcConnection()).getUsername());
        assert.equal((await wallet.getDaemonConnection()).getPassword(), (await daemon.getRpcConnection()).getPassword());
        assert(await wallet.isConnected());
        assert.equal(await wallet.getMnemonicLanguage(), "English");
        assert.equal(await wallet.getPath(), path);
        assert(!(await wallet.isSynced()));
        assert.equal(await wallet.getHeight(), 1); // TODO monero core: why does height of new unsynced wallet start at 1?
        assert.equal(await wallet.getRestoreHeight(), 0);
        await wallet.close();
        
        // create wallet with mnemonic, no connection, and restore height
        let restoreHeight = 10000;
        path = TestMoneroWalletCore._getRandomWalletPath();
        wallet = await MoneroWalletCore.createWalletFromMnemonic(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, undefined, restoreHeight);
        assert.equal(await wallet.getMnemonic(), TestUtils.MNEMONIC);
        assert.equal(await wallet.getPrimaryAddress(), TestUtils.ADDRESS);
        assert.equal(await wallet.getNetworkType(), TestUtils.NETWORK_TYPE);
        assert.equal(await wallet.getDaemonConnection(), undefined);
        assert(!(await wallet.isConnected()));
        assert.equal(await wallet.getMnemonicLanguage(), "English");
        assert.equal(await wallet.getPath(), path);
        assert.equal(await wallet.getHeight(), 1); // TODO monero core: why does height of new unsynced wallet start at 1?
        assert.equal(await wallet.getRestoreHeight(), restoreHeight);
        await wallet.save();
        await wallet.close();
        wallet = await MoneroWalletCore.openWallet(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE);
        assert(!(await wallet.isConnected()));
        assert(!(await wallet.isSynced()));
        assert.equal(await wallet.getHeight(), 1);
        assert.equal(await wallet.getRestoreHeight(), restoreHeight); // TODO: restore height is lost after closing in JNI?
        await wallet.close();

        // create wallet with mnemonic, connection, and restore height
        path = TestMoneroWalletCore._getRandomWalletPath();
        wallet = await MoneroWalletCore.createWalletFromMnemonic(path, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, daemon.getRpcConnection(), restoreHeight);
        assert.equal(await wallet.getMnemonic(), TestUtils.MNEMONIC);
        assert(await wallet.getPrimaryAddress(), TestUtils.ADDRESS);
        assert(await wallet.getNetworkType(), TestUtils.NETWORK_TYPE);
        assert(await wallet.getDaemonConnection());
        assert(daemon.getRpcConnection() != wallet.getDaemonConnection());
        assert.equal((await wallet.getDaemonConnection()).getUri(), (await daemon.getRpcConnection()).getUri());
        assert.equal((await wallet.getDaemonConnection()).getUsername(), (await daemon.getRpcConnection()).getUsername());
        assert.equal((await wallet.getDaemonConnection()).getPassword(), (await daemon.getRpcConnection()).getPassword());
        assert(await wallet.isConnected());
        assert.equal(await wallet.getMnemonicLanguage(), "English");
        assert.equal(await wallet.getPath(), path);
        assert(!(await wallet.isSynced()));
        assert.equal(await wallet.getHeight(), 1); // TODO monero core: why does height of new unsynced wallet start at 1?
        assert.equal(await wallet.getRestoreHeight(), restoreHeight);
        await wallet.close();
      });
      
      if (config.testNonRelays)
      it("Can create a core wallet from keys", async function() {
        
        // recreate test wallet from keys
        let wallet = that.wallet;
        let path = TestMoneroWalletCore._getRandomWalletPath();
        let walletKeys = await MoneroWalletCore.createWalletFromKeys(path, TestUtils.WALLET_PASSWORD, await wallet.getNetworkType(), await wallet.getPrimaryAddress(), await wallet.getPrivateViewKey(), await wallet.getPrivateSpendKey(), await wallet.getDaemonConnection(), TestUtils.FIRST_RECEIVE_HEIGHT, undefined);
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
      
      TestUtils.TEST_WALLETS_DIR = "./test_wallets";
      TestUtils.WALLET_WASM_PATH_1 = TestUtils.TEST_WALLETS_DIR + "/test_wallet_1";
      
      // TODO monero core: cannot re-sync from lower block height after wallet saved
      if (config.testNonRelays && !config.liteMode && false)
      it("Can re-sync an existing wallet from scratch", async function() {
        assert(await MoneroWalletCore.walletExists(TestUtils.WALLET_WASM_PATH_1));
        let wallet = await MoneroWalletCore.openWallet(TestUtils.WALLET_WASM_PATH_1, TestUtils.WALLET_PASSWORD, MoneroNetworkType.STAGENET);
        await wallet.setDaemonConnection((await TestUtils.getDaemonRpc()).getRpcConnection());
        //long startHeight = TestUtils.TEST_RESTORE_HEIGHT;
        let startHeight = 0;
        let progressTester = new SyncProgressTester(wallet, startHeight, await wallet.getDaemonHeight());
        await wallet.setRestoreHeight(1);
        let result = await wallet.sync(1, progressTester);
        await progressTester.onDone(await wallet.getDaemonHeight());
        
        // test result after syncing
        assert(await wallet.isConnected());
        assert(await wallet.isSynced());
        assert.equal(result.getNumBlocksFetched(), await wallet.getDaemonHeight() - startHeight);
        assert(result.getReceivedMoney());
        assert.equal(await wallet.getHeight(), await daemon.getHeight());
        await wallet.close(true);
      });
      
      if (config.testNonRelays)
      it("Can sync a wallet with a randomly generated seed", async function() {
        assert(await daemon.isConnected(), "Not connected to daemon");

        // create test wallet
        let restoreHeight = await daemon.getHeight();
        let wallet = await MoneroWalletCore.createWalletRandom(TestMoneroWalletCore._getRandomWalletPath(), TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, (await TestUtils.getDaemonRpc()).getRpcConnection(), undefined);

        // test wallet's height before syncing
        assert.equal((await wallet.getDaemonConnection()).getUri(), (await daemon.getRpcConnection()).getUri());
        assert.equal((await wallet.getDaemonConnection()).getUsername(), (await daemon.getRpcConnection()).getUsername());
        assert.equal((await wallet.getDaemonConnection()).getPassword(), (await daemon.getRpcConnection()).getPassword());
        assert.equal(await wallet.getDaemonHeight(), restoreHeight);
        assert(await wallet.isConnected());
        assert(!(await wallet.isSynced()));
        assert.equal(await wallet.getHeight(), 1);
        assert.equal(await wallet.getRestoreHeight(), restoreHeight);
        assert.equal(await wallet.getDaemonHeight(), await daemon.getHeight());

        // sync the wallet
        let progressTester = new SyncProgressTester(wallet, await wallet.getRestoreHeight(), await wallet.getDaemonHeight());
        let result = await wallet.sync(undefined, progressTester);
        await progressTester.onDone(await wallet.getDaemonHeight());
        
        // test result after syncing
        let walletGt = await TestUtils.createWalletGroundTruth(TestUtils.NETWORK_TYPE, wallet.getMnemonic(), restoreHeight);
        let err;
        try {
          assert(await wallet.isConnected());
          assert(await wallet.isSynced());
          assert.equal(result.getNumBlocksFetched(), 0);
          assert(!result.getReceivedMoney());
          assert.equal(await wallet.getHeight(), await daemon.getHeight());

          // sync the wallet with default params
          await wallet.sync();
          assert(await wallet.isSynced());
          assert.equal(await wallet.getHeight(), await daemon.getHeight());
          
          // compare wallet to ground truth
          await TestMoneroWalletCore._testWalletEqualityOnChain(walletGt, wallet);
        } catch (e) {
          err = e;
        }
        
        // finally 
        await walletGt.close();
        await wallet.close();
        if (err) throw err;
        
        // attempt to sync unconnected wallet
        wallet = await MoneroWalletCore.createWalletRandom(TestMoneroWalletCore._getRandomWalletPath(), TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, undefined, undefined);
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
      
      if (config.testNonRelays && !config.liteMode)
      it("Can sync a wallet created from mnemonic from the genesis", async function() {
        await _testSyncMnemonic(undefined, undefined, true, false);
      });
      
      if (config.testNonRelays)
      it("Can sync a wallet created from mnemonic from a restore height", async function() {
        await _testSyncMnemonic(undefined, TestUtils.FIRST_RECEIVE_HEIGHT);
      });
      
      if (config.testNonRelays && !config.liteMode)
      it("Can sync a wallet created from mnemonic from a start height", async function() {
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
        assert(await daemon.isConnected(), "Not connected to daemon");
        if (startHeight !== undefined && restoreHeight != undefined) assert(startHeight <= TestUtils.FIRST_RECEIVE_HEIGHT || restoreHeight <= TestUtils.FIRST_RECEIVE_HEIGHT);
        
        // create wallet from mnemonic
        let wallet = await MoneroWalletCore.createWalletFromMnemonic(TestMoneroWalletCore._getRandomWalletPath(), TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, (await TestUtils.getDaemonRpc()).getRpcConnection(), restoreHeight, undefined);
        
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
          wallet.addListener(walletSyncTester);
          
          // sync the wallet with a listener which tests sync notifications
          let progressTester = new SyncProgressTester(wallet, startHeightExpected, endHeightExpected);
          let result = await wallet.sync(startHeight, progressTester);
          
          // test completion of the wallet and sync listeners
          await progressTester.onDone(await wallet.getDaemonHeight());
          await walletSyncTester.onDone(await wallet.getDaemonHeight());
          
          // test result after syncing
          assert(await wallet.isSynced());
          assert.equal(result.getNumBlocksFetched(), await wallet.getDaemonHeight() - startHeightExpected);
          assert(result.getReceivedMoney());
          assert.equal(await wallet.getHeight(), await daemon.getHeight());
          assert.equal(await wallet.getDaemonHeight(), await daemon.getHeight());
          if (startHeightExpected > TestUtils.FIRST_RECEIVE_HEIGHT) assert((await wallet.getTxs())[0].getHeight() > TestUtils.FIRST_RECEIVE_HEIGHT);  // wallet is partially synced so first tx happens after true restore height
          else assert.equal((await wallet.getTxs())[0].getHeight(), TestUtils.FIRST_RECEIVE_HEIGHT);  // wallet should be fully synced so first tx happens on true restore height
          
          // sync the wallet with default params
          result = await wallet.sync();
          assert(await wallet.isSynced());
          assert.equal(await wallet.getHeight(), await daemon.getHeight());
          assert.equal(result.getNumBlocksFetched(), 0);
          assert(!result.getReceivedMoney());
          
          // compare with ground truth
          if (!skipGtComparison) {
            walletGt = await TestUtils.createWalletGroundTruth(TestUtils.NETWORK_TYPE, await wallet.getMnemonic(), startHeightExpected);
            TestMoneroWalletCore._testWalletEqualityOnChain(walletGt, wallet);
          }
          
          // if testing post-sync notifications, wait for a block to be added to the chain
          // then test that sync arg listener was not invoked and registered wallet listener was invoked
          if (testPostSyncNotifications) {
            
            // start automatic syncing
            await wallet.startSyncing();
            
            // attempt to start mining to push the network along  // TODO: TestUtils.tryStartMining() : reqId, TestUtils.tryStopMining(reqId)
            let startedMining = false;
            let miningStatus = await daemon.getMiningStatus();
            if (!miningStatus.isActive()) {
              try {
                StartMining.startMining();
                //await wallet.startMining(7, false, true); // TODO: support client-side mining?
                startedMining = true;
              } catch (e) {
                // no problem
              }
            }
            
            try {
              
              // wait for block
              console.log("Waiting for next block to test post sync notifications");
              await daemon.getNextBlockHeader();
              
              // ensure wallet has time to detect new block
              try {
                await new Promise(function(resolve) { setTimeout(resolve, MoneroUtils.WALLET_REFRESH_RATE); }); // sleep for the wallet interval
              } catch (e) {
                throw new Error(e.message);
              }
              
              // test that wallet listener's onSyncProgress() and onNewBlock() were invoked after previous completion
              assert(walletSyncTester.getOnSyncProgressAfterDone());
              assert(walletSyncTester.getOnNewBlockAfterDone());
            } catch (e) {
              err = e;
            }
            
            // finally
            if (startedMining) {
              await daemon.stopMining();
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
      
      it("Can sync a wallet created from keys", async function() {
        throw new Error("Not implemented");
      });
      
      // TODO: test start syncing, notification of syncs happening, stop syncing, no notifications, etc
      it("Can start and stop syncing", async function() {
        throw new Error("Not implemented");
      });
      
      it("Is equal to the RPC wallet", async function() {
        throw new Error("Not implemented");
      });
      
      it("Is equal to the RPC wallet with a seed offset", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can be saved", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can be moved", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can be closed", async function() {
        throw new Error("Not implemented");
      });
      
      it("Notification test #1: notifies listeners of outputs sent from/to the same account using local wallet data", async function() {
        throw new Error("Not implemented");
      });
      
      it("Notification test #2: notifies listeners of outputs sent from/to different accounts using local wallet data", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can be created and receive funds", async function() {
        throw new Error("Not implemented");
      });
      
      it("Supports multisig sample code", async function() {
        throw new Error("Not implemented");
      });
      
      // TODO
//      it("Can create a wallet from a mnemonic phrase", async function() {
//        let err;
//        try {
//          
//          // create wallet with mnemonic and defaults
//          let path = GenUtils.uuidv4();
//          await that.wallet.createWalletFromMnemonic(path, TestUtils.WALLET_PASSWORD, TestUtils.MNEMONIC, TestUtils.FIRST_RECEIVE_HEIGHT);
//          assert.equal(await that.wallet.getMnemonic(), TestUtils.MNEMONIC);
//          assert.equal(await that.wallet.getPrimaryAddress(), TestUtils.ADDRESS);
//          if (await that.wallet.getHeight() !== 1) console.log("WARNING: createWalletFromMnemonic() already has height as if synced");
//          if ((await that.wallet.getTxs()).length !== 0) console.log("WARNING: createWalletFromMnemonic() already has txs as if synced");
//          //assert.equal(await that.wallet.getHeight(), 1);                               // TODO monero core: sometimes height is as if synced
//          //assert.equal((await that.wallet.getTxs()).length, 0); // wallet is not synced // TODO monero core: sometimes wallet has txs as if synced
//          await that.wallet.sync();
//          assert.equal(await that.wallet.getHeight(), await daemon.getHeight());
//          let txs = await that.wallet.getTxs();
//          assert(txs.length > 0); // wallet is used
//          assert.equal(txs[0].getHeight(), TestUtils.FIRST_RECEIVE_HEIGHT);
//          await that.wallet.close();
//          
//          // create wallet with non-defaults
//          path = GenUtils.uuidv4();
//          await that.wallet.createWalletFromMnemonic(path, TestUtils.WALLET_PASSWORD, TestUtils.MNEMONIC, TestUtils.FIRST_RECEIVE_HEIGHT, "German", "my offset!", false);
//          MoneroUtils.validateMnemonic(await that.wallet.getMnemonic());
//          assert.notEqual(await that.wallet.getMnemonic(), TestUtils.MNEMONIC);  // mnemonic is different because of offset
//          assert.notEqual(await that.wallet.getPrimaryAddress(), TestUtils.ADDRESS);
//          assert.equal(await that.wallet.getHeight(), 1);
//          await that.wallet.close();
//          
//        } catch (e) {
//          console.log("Caught error so will call open!");
//          err = e;
//        }
//        
//        // open main test wallet for other tests
//        await that.wallet.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_PASSWORD);
//        
//        // throw error if there was one
//        if (err) throw err;
//      });
//      
//      it("Can open wallets", async function() {
//        let err;
//        try {
//          
//          // create names of test wallets
//          let numTestWallets = 3;
//          let names = [];
//          for (let i = 0; i < numTestWallets; i++) names.add(GenUtils.uuidv4());
//          
//          // create test wallets
//          let mnemonics = [];
//          for (let name of names) {
//            await that.wallet.createWalletRandom(name, TestUtils.WALLET_PASSWORD);
//            mnemonics.add(await that.wallet.getMnemonic());
//            await that.wallet.close();
//          }
//          
//          // open test wallets
//          for (let i = 0; i < numTestWallets; i++) {
//            await that.wallet.openWallet(names[i], TestUtils.WALLET_PASSWORD);
//            assert.equal(await that.wallet.getMnemonic(), mnemonics[i]);
//            await that.wallet.close();
//          }
//          
//          // attempt to re-open already opened wallet
//          try {
//            await that.wallet.openWallet(names[numTestWallets - 1], TestUtils.WALLET_PASSWORD);
//          } catch (e) {
//            assert.equal(e.getCode(), -1);
//          }
//          
//          // attempt to open non-existent
//          try {
//            await that.wallet.openWallet("btc_integrity", TestUtils.WALLET_PASSWORD);
//          } catch (e) {
//            assert.equal( e.getCode(), -1);  // -1 indicates wallet does not exist (or is open by another app)
//          }
//        } catch (e) {
//          let err = e;
//        }
//        
//        // open main test wallet for other tests
//        try {
//          await that.wallet.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_PASSWORD);
//        } catch (e) {
//          assert.equal(e.getCode(), -1); // ok if wallet is already open
//        }
//        
//        // throw error if there was one
//        if (err) throw err;
//      });
//      
//      it("Can indicate if multisig import is needed for correct balance information", async function() {
//        assert.equal(await that.wallet.isMultisigImportNeeded(), false); // TODO: test with multisig wallet
//      });
//
//      it("Can tag accounts and query accounts by tag", async function() {
//        
//        // get accounts
//        let accounts = await that.wallet.getAccounts();
//        assert(accounts.length >= 3, "Not enough accounts to test; run create account test");
//        
//        // tag some of the accounts
//        let tag = new MoneroAccountTag("my_tag_" + GenUtils.uuidv4(), "my tag label", [0, 1]);
//        await that.wallet.tagAccounts(tag.getTag(), tag.getAccountIndices());
//        
//        // query accounts by tag
//        let taggedAccounts = await that.wallet.getAccounts(undefined, tag.getTag());
//        assert.equal(taggedAccounts.length, 2);
//        assert.equal(taggedAccounts[0].getIndex(), 0);
//        assert.equal(taggedAccounts[0].getTag(), tag.getTag());
//        assert.equal(taggedAccounts[1].getIndex(), 1);
//        assert.equal(taggedAccounts[1].getTag(), tag.getTag());
//
//        // set tag label
//        await that.wallet.setAccountTagLabel(tag.getTag(), tag.getLabel());
//        
//        // fetch tags and ensure new tag is contained
//        let tags = await that.wallet.getAccountTags();
//        assert(GenUtils.arrayContains(tags, tag));
//        
//        // re-tag an account
//        let tag2 = new MoneroAccountTag("my_tag_" + GenUtils.uuidv4(), "my tag label 2", [1]);
//        await that.wallet.tagAccounts(tag2.getTag(), tag2.getAccountIndices());
//        let taggedAccounts2 = await that.wallet.getAccounts(undefined, tag2.getTag())
//        assert.equal(taggedAccounts2.length, 1);
//        assert.equal(taggedAccounts2[0].getIndex(), 1);
//        assert.equal(taggedAccounts2[0].getTag(), tag2.getTag());
//        
//        // re-query original tag which only applies to one account now
//        taggedAccounts = await that.wallet.getAccounts(undefined, tag.getTag());
//        assert.equal(taggedAccounts.length, 1);
//        assert.equal(taggedAccounts[0].getIndex(), 0);
//        assert.equal(taggedAccounts[0].getTag(), tag.getTag());
//        
//        // untag and query accounts
//        await that.wallet.untagAccounts([0, 1]);
//        assert.equal((await that.wallet.getAccountTags()).length, 0);
//        try {
//          await that.wallet.getAccounts(undefined, tag.getTag());
//          fail("Should have thrown exception with unregistered tag");
//        } catch (e) {
//          assert.equal(e.getCode(), -1);
//        }
//        
//        // test that non-existing tag returns no accounts
//        try {
//          await that.wallet.getAccounts(undefined, "non_existing_tag");
//          fail("Should have thrown exception with unregistered tag");
//        } catch (e) {
//          assert.equal(e.getCode(), -1);
//        }
//      });
//      
//      it("Can fetch accounts and subaddresses without balance info because this is another RPC call", async function() {
//        let accounts = await that.wallet.getAccounts(true, undefined, true);
//        assert(accounts.length > 0);
//        for (let account of accounts) {
//          assert(account.getSubaddresses().length > 0);
//          for (let subaddress of account.getSubaddresses()) {
//            assert.equal(typeof subaddress.getAddress(), "string");
//            assert(subaddress.getAddress().length > 0);
//            assert(subaddress.getAccountIndex() >= 0);
//            assert(subaddress.getIndex() >= 0);
//            assert(subaddress.getLabel() === undefined || typeof subaddress.getLabel() === "string");
//            if (typeof subaddress.getLabel() === "string") assert(subaddress.getLabel().length > 0);
//            assert.equal(typeof subaddress.isUsed(), "boolean");
//            assert.equal(subaddress.getNumUnspentOutputs(), undefined);
//            assert.equal(subaddress.getBalance(), undefined);
//            assert.equal(subaddress.getUnlockedBalance(), undefined);
//          }
//        }
//      });
//      
//      it("Has an address book", async function() {
//        
//        // initial state
//        let entries = await that.wallet.getAddressBookEntries();
//        let numEntriesStart = entries.length
//        for (let entry of entries) testAddressBookEntry(entry);
//        
//        // test adding standard addresses
//        const NUM_ENTRIES = 5;
//        let address = (await that.wallet.getSubaddress(0, 0)).getAddress();
//        let indices = [];
//        for (let i = 0; i < NUM_ENTRIES; i++) {
//          indices.push(await that.wallet.addAddressBookEntry(address, "hi there!"));
//        }
//        entries = await that.wallet.getAddressBookEntries();
//        assert.equal(entries.length, numEntriesStart + NUM_ENTRIES);
//        for (let idx of indices) {
//          let found = false;
//          for (let entry of entries) {
//            if (idx === entry.getIndex()) {
//              testAddressBookEntry(entry);
//              assert.equal(entry.getAddress(), address);
//              assert.equal(entry.getDescription(), "hi there!");
//              found = true;
//              break;
//            }
//          }
//          assert(found, "Index " + idx + " not found in address book indices");
//        }
//        
//        // delete entries at starting index
//        let deleteIdx = indices[0];
//        for (let i = 0; i < indices.length; i++) {
//          await that.wallet.deleteAddressBookEntry(deleteIdx);
//        }
//        entries = await that.wallet.getAddressBookEntries();
//        assert.equal(entries.length, numEntriesStart);
//        
//        // test adding integrated addresses
//        indices = [];
//        let paymentId = "03284e41c342f03"; // payment id less one character
//        let integratedAddresses = {};
//        let integratedDescriptions = {};
//        for (let i = 0; i < NUM_ENTRIES; i++) {
//          let integratedAddress = await that.wallet.getIntegratedAddress(paymentId + i); // create unique integrated address
//          let uuid = GenUtils.uuidv4();
//          let idx = await that.wallet.addAddressBookEntry(integratedAddress.toString(), uuid);
//          indices.push(idx);
//          integratedAddresses[idx] = integratedAddress;
//          integratedDescriptions[idx] = uuid;
//        }
//        entries = await that.wallet.getAddressBookEntries();
//        assert.equal(entries.length, numEntriesStart + NUM_ENTRIES);
//        for (let idx of indices) {
//          let found = false;
//          for (let entry of entries) {
//            if (idx === entry.getIndex()) {
//              testAddressBookEntry(entry);
//              assert.equal(entry.getDescription(), integratedDescriptions[idx]);
//              assert.equal(entry.getAddress(), integratedAddresses[idx].getStandardAddress());
//              assert(MoneroUtils.paymentIdsEqual(integratedAddresses[idx].getPaymentId(), entry.getPaymentId()));
//              found = true;
//              break;
//            }
//          }
//          assert(found, "Index " + idx + " not found in address book indices");
//        }
//        
//        // delete entries at starting index
//        deleteIdx = indices[0];
//        for (let i = 0; i < indices.length; i++) {
//          await that.wallet.deleteAddressBookEntry(deleteIdx);
//        }
//        entries = await that.wallet.getAddressBookEntries();
//        assert.equal(entries.length, numEntriesStart);
//      });
//      
//      it("Can rescan spent", async function() {
//        await that.wallet.rescanSpent();
//      });
//      
//      it("Can save the wallet file", async function() {
//        await that.wallet.save();
//      });
//      
//      it("Can close a wallet", async function() {
//        
//        // create a test wallet
//        let path = GenUtils.uuidv4();
//        await that.wallet.createWalletRandom(path, TestUtils.WALLET_PASSWORD);
//        await that.wallet.sync();
//        assert((await that.wallet.getHeight()) > 1);
//        
//        // close the wallet
//        await that.wallet.close();
//        
//        // attempt to interact with the wallet
//        try {
//          await that.wallet.getHeight();
//        } catch (e) {
//          assert.equal(e.getCode(), -13);
//          assert.equal(e.message, "No wallet file");
//        }
//        try {
//          await that.wallet.getMnemonic();
//        } catch (e) {
//          assert.equal(e.getCode(), -13);
//          assert.equal(e.message, "No wallet file");
//        }
//        try {
//          await that.wallet.sync();
//        } catch (e) {
//          assert.equal(e.getCode(), -13);
//          assert.equal(e.message, "No wallet file");
//        }
//        
//        // re-open the wallet
//        await that.wallet.openWallet(path, TestUtils.WALLET_PASSWORD);
//        await that.wallet.sync();
//        assert.equal(await that.wallet.getHeight(), await daemon.getHeight());
//        
//        // close the wallet
//        await that.wallet.close();
//        
//        // re-open main test wallet for other tests
//        await that.wallet.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_PASSWORD);
//      });
//      
//      if (false)  // disabled so server not actually stopped
//      it("Can stop the RPC server", async function() {
//        await that.wallet.stop();
//      });
    });
  }
  
  //----------------------------- PRIVATE HELPERS -----------------------------

  static _getRandomWalletPath() {
    return TestUtils.TEST_WALLETS_DIR + "/test_wallet_" + GenUtils.uuidv4();
  }
}

/**
 * Internal class to test progress updates.
 */
class SyncProgressTester extends MoneroSyncListener {
  
  static PRINT_INCREMENT = 2500;  // print every 2500 blocks
  
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
      assert(wallet.getListeners().includes(this), "Listener has completed and is not registered so should not be called again");
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
    } else {
      assert.equal(this.prevHeight, chainHeight - 1);  // otherwise last height is chain height - 1
      assert.equal(this.prevCompleteHeight, chainHeight);
    }
    this.onSyncProgressAfterDone = false;  // test subsequent onSyncProgress() calls
  }
  
  getOnSyncProgressAfterDone() {
    return this.onSyncProgressAfterDone;
  }
}

/**
 * Internal class to test all wallet notifications on sync. 
 */
class WalletSyncTester extends SyncProgressTester {
  
  constructor(wallet, startHeight, endHeight) {
    super(wallet, startHeight, endHeight);
    assert(startHeight >= 0);
    assert(endHeight >= 0);
    this.incomingTotal = new BigInteger("0");
    this.outgoingTotal = new BigInteger("0");
  }
  
  onNewBlock(height) {
    if (this.isDone) {
      assert(this.wallet.getListeners().includes(this), "Listener has completed and is not registered so should not be called again");
      this.onNewBlockAfterDone = true;
    }
    if (this.walletTesterPrevHeight !== undefined) assert.equal(height, walletTesterPrevHeight + 1);
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
    assert.equal(output.getTx().getHash().length(), 64);
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
    assert.equal(output.getTx().getHash().length(), 64);
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
    assert.notEqual(prevOutputReceived, undefined);
    assert.notEqual(prevOutputSpent, undefined);
    let balance = this.incomingTotal.subtract(this.outgoingTotal);
    assert.equal(await this.wallet.getBalance(), balance);
    this.onNewBlockAfterDone = false;  // test subsequent onNewBlock() calls
  }
  
  getOnNewBlockAfterDone() {
    return this.onNewBlockAfterDone;
  }
}

///**
// * Internal class to test progress updates.
// */
//class SyncProgressTester {
//  
//  constructor(wallet, startHeight, endHeight, noMidway, noProgress) {
//    assert(wallet);
//    assert(startHeight >= 0);
//    assert(endHeight >= 0);
//    this.wallet = wallet;
//    this.startHeight = startHeight;
//    this.endHeight = endHeight;
//    this.noMidway = noMidway;
//    this.noProgress = noProgress;
//    this.firstProgress = undefined;
//    this.lastProgress = undefined;
//    this.midwayFound = false;
//  }
//  
//  onProgress(progress) {
//    assert(!this.noProgress, "Should not call progress");
//    assert.equal(progress.totalBlocks, this.endHeight - this.startHeight + 1);
//    assert(progress.doneBlocks >= 0 && progress.doneBlocks <= progress.totalBlocks);
//    if (this.noMidway) assert(progress.percent === 0 || progress.percent === 1);
//    if (progress.percent > 0 && progress.percent < 1) this.midwayFound = true;
//    assert(progress.message);
//    if (this.firstProgress == undefined) {
//      this.firstProgress = progress;
//      assert(progress.percent === 0);
//      assert(progress.doneBlocks === 0);
//    } else {
//      assert(progress.percent > this.lastProgress.percent);
//      assert(progress.doneBlocks >= this.lastProgress.doneBlocks && progress.doneBlocks <= progress.totalBlocks);
//    }
//    this.lastProgress = progress;
//  }
//  
//  testDone() {
//    
//    // nothing to test if no progress called
//    if (this.noProgress) {
//      assert(!this.firstProgress);
//      return;
//    }
//    
//    // test first progress
//    assert(this.firstProgress, "Progress was never updated");
//    assert.equal(this.firstProgress.percent, 0);
//    assert.equal(this.firstProgress.doneBlocks, 0);
//    
//    // test midway progress
//    if (this.endHeight > this.startHeight && !this.noMidway) assert(this.midwayFound, "No midway progress reported but it should have been");
//    else assert(!this.midwayFound, "No midway progress should have been reported but it was");
//    
//    // test last progress
//    assert.equal(this.lastProgress.percent, 1);
//    assert.equal(this.lastProgress.doneBlocks, this.endHeight - this.startHeight + 1);
//    assert.equal(this.lastProgress.totalBlocks, this.lastProgress.doneBlocks);
//  }
//}

module.exports = TestMoneroWalletCore;
