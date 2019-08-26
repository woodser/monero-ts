const assert = require("assert");
const MoneroDaemonRpc = require("../../src/daemon/MoneroDaemonRpc");
const MoneroWalletRpc = require("../../src/wallet/MoneroWalletRpc");
const MoneroWalletLocal = require("../../src/wallet/MoneroWalletLocal");
const MoneroRpcError = require("../../src/rpc/MoneroRpcError");
const BigInteger = require("../../external/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const StartMining = require("./StartMining");
const GenUtils = require("../../src/utils/GenUtils");

/**
 * Tracks wallets which are in sync with the tx pool and therefore whose txs in the pool
 * do not need to be waited on for up-to-date pool information e.g. to create txs.
 * 
 * This is only necessary because txs relayed outside wallets are not fully incorporated
 * into the wallet state until confirmed.
 * 
 * TODO monero core: sync txs relayed outside wallet so this class is unecessary
 */
class TxPoolWalletTracker {

  constructor() {
    this.clearedWallets = new Set();
  }
  
  reset() {
    this.clearedWallets.clear();
  }
  
//  /**
//   * Reset the tracker such that all wallets except the given sending wallet will
//   * need to wait for pool txs to confirm in order to reliably sync.
//   * 
//   * @param sendingWallet is the wallet which sent the tx and therefore should not cause txs to be waited on
//   */
//  resetExcept(sendingWallet) {
//    let found = this.clearedWallets.has(sendingWallet);
//    this.clearedWallets.clear();
//    if (found) clearedWallets.add(sendingWallet);
//  }
  
  async waitForWalletTxsToClearPool(wallets) {
    wallets = GenUtils.listify(wallets);
    
    // get ids of txs in the pool
    let txIdsPool = new Set();
    for (let tx of await TestUtils.getDaemonRpc().getTxPool()) {
      if (!tx.isRelayed() || tx.isFailed()) continue;
      txIdsPool.add(tx.getId());
    }
    
    // get ids of txs from wallets to wait for
    let txIdsWallet = new Set();
    for (let wallet of wallets) {
      if (!this.clearedWallets.has(wallet)) {
        await wallet.sync();
        for (let tx of await wallet.getTxs()) {
          txIdsWallet.add(tx.getId());
        }
      }
    }
    
    // wait for txs to clear pool
    let txIdsIntersection = new Set();
    for (let txIdPool of txIdsPool) {
      if (txIdsWallet.has(txIdPool)) txIdsIntersection.add(txIdPool);
    }
    await TxPoolWalletTracker.waitForTxsToClearPool(txIdsIntersection);
    
    // sync wallets with the pool
    for (let wallet of wallets) {
      await wallet.sync();
      this.clearedWallets.add(wallet);
    }
  }
  
  static async waitForTxsToClearPool(txIds) {
    txIds = GenUtils.listify(txIds);
    let daemon = TestUtils.getDaemonRpc(); 
      
    // attempt to start mining to push the network along
    let startedMining = false;
    let miningStatus = await daemon.getMiningStatus();
    if (!miningStatus.isActive()) {
      try {
        await StartMining.startMining();
        startedMining = true;
      } catch (e) { } // no problem
    }
    
    // loop until txs are not in pool
    let isFirst = true;
    while (await TxPoolWalletTracker._txsInPool(txIds)) {
      
      // print debug messsage one time
      if (isFirst) {  
        console.log("Waiting for wallet txs to clear from the pool in order to fully sync and avoid double spend attempts (known issue)");
        isFirst = false;
      }
      
      // sleep for a moment
      await new Promise(function(resolve) { setTimeout(resolve, MoneroUtils.WALLET_REFRESH_RATE); });
    }
    
    // stop mining at end of test
    if (startedMining) await daemon.stopMining();
  }
  
  static async _txsInPool(txIds) {
    txIds = GenUtils.listify(txIds);
    let daemon = TestUtils.getDaemonRpc();
    let txsPool = await daemon.getTxPool();
    for (let txPool of txsPool) {
      for (let txId of txIds) {
        if (txId === txPool.getId()) return true;
      }
    }
    return false;
  }
}

/**
 * Collection of test utilities and configurations.
 * 
 * TODO: move hard coded to config;
 */
class TestUtils {
  
  /**
   * Get a daemon RPC singleton instance shared among tests.
   */
  static getDaemonRpc() {
    if (this.daemonRpc === undefined) this.daemonRpc = new MoneroDaemonRpc(TestUtils.DAEMON_RPC_CONFIG);
    return this.daemonRpc;
  }
  
  /**
   * Get a wallet RPC singleton instance shared among tests.
   */
  static getWalletRpc() {
    if (this.walletRpc === undefined) this.walletRpc = new MoneroWalletRpc(TestUtils.WALLET_RPC_CONFIG);
    return this.walletRpc;
  }
  
  static async initWalletRpc() {
    
    // initialize cached wallet
    TestUtils.getWalletRpc();
    
    // create rpc wallet file if necessary
    try {
      await this.walletRpc.createWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_RPC_PW_1, "English");
    } catch (e) {
      if (!(e instanceof MoneroRpcError)) throw e;
      assert.equal(e.getCode(), -21); // exception is ok if wallet already created
    }
    
    // open rpc wallet file
    try {
      await this.walletRpc.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_RPC_PW_1);
    } catch (e) {
      if (!(e instanceof MoneroRpcError)) throw e;
      assert.equal(e.getCode(), -1); // TODO (monero-wallet-rpc): -1: Failed to open wallet if wallet is already open; better code and message
    }
    
    // refresh wallet
    try {
      await this.walletRpc.rescanSpent();
    } catch (e) {
      console.log(e);
      assert.equal(e.getCode(), -38);  // TODO: (monero-wallet-rpc) sometimes getting -38: no connection to daemon on rescan call (after above calls) which causes mocha "before all" hook problem
      console.log("WARNING: received -38: no connection to daemon on rescan call after create/open, ignoring...");
    }
  }
  
  /**
   * Get a local wallet singleton instance shared among tests.
   */
  static getWalletLocal() {
    if (this.walletLocal === undefined) this.walletLocal = new MoneroWalletLocal(TestUtils.WALLET_LOCAL_CONFIG);
    return this.walletLocal;
  }
  
  static testUnsignedBigInteger(num, nonZero) {
    assert(num);
    assert(num instanceof BigInteger);
    let comparison = num.compare(new BigInteger(0));
    assert(comparison >= 0);
    if (nonZero === true) assert(comparison > 0);
    if (nonZero === false) assert(comparison === 0);
  }
  
  static async getRandomWalletAddress() {
    let wallet = new MoneroWalletLocal({daemon: TestUtils.getDaemonRpc()});
    return await wallet.getPrimaryAddress();
  }
}

// ---------------------------- STATIC TEST CONFIG ----------------------------

// TODO: export these to key/value properties file for tests
// TODO: in properties, define {network: stagnet, network_configs: { stagnet: { daemonRpc: { host: _, port: _ ... etc

TestUtils.MAX_FEE = new BigInteger(7500000).multiply(new BigInteger(10000));

// default keypair to test
TestUtils.TEST_MNEMONIC = "hefty value later extra artistic firm radar yodel talent future fungal nutshell because sanity awesome nail unjustly rage unafraid cedar delayed thumbs comb custom sanity";
TestUtils.ADDRESS = "528qdm2pXnYYesCy5VdmBneWeaSZutEijFVAKjpVHeVd4unsCSM55CjgViQsK9WFNHK1eZgcCuZ3fRqYpzKDokqSKp4yp38";
TestUtils.TEST_RESTORE_HEIGHT = 383338;

//wallet rpc test wallet filenames and passwords
TestUtils.WALLET_RPC_NAME_1 = "test_wallet_1";
TestUtils.WALLET_RPC_NAME_2 = "test_wallet_2";
TestUtils.WALLET_RPC_PW_1 = "supersecretpassword123"
TestUtils.WALLET_RPC_PW_2 = "supersecretpassword123"

// wallet RPC config
TestUtils.WALLET_RPC_CONFIG = {
  uri: "http://localhost:38083",
  user: "rpc_user",
  pass: "abc123",
  maxRequestsPerSecond: 500
};

// daemon RPC config
TestUtils.DAEMON_RPC_CONFIG = {
  uri: "http://localhost:38081",
  user: "superuser",
  pass: "abctesting123",
  maxRequestsPerSecond: 500
};

// local wallet config
TestUtils.WALLET_LOCAL_CONFIG = {
  daemon: TestUtils.getDaemonRpc(),
  mnemonic: TestUtils.TEST_MNEMONIC
}

// used to track which wallets are in sync with pool so associated txs in the pool do not need to be waited on
TestUtils.TX_POOL_WALLET_TRACKER = new TxPoolWalletTracker();

//TestUtils.DAEMON_RPC_CONFIG = {
//  uri: "http://node.xmrbackb.one:28081",
//  //user: "superuser",
//  //pass: "abctesting123",
//  maxRequestsPerSecond: 1
//};

module.exports = TxPoolWalletTracker;
module.exports = TestUtils;
