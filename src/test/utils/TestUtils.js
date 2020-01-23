const FS = require("fs");
const MoneroDaemonRpc = require("../../main/js/daemon/MoneroDaemonRpc");
const MoneroWalletRpc = require("../../main/js/wallet/MoneroWalletRpc");
const MoneroWalletKeys = require("../../main/js/wallet/MoneroWalletKeys");
const MoneroWalletCore = require("../../main/js/wallet/MoneroWalletCore")

const TxPoolWalletTracker = require("./TxPoolWalletTracker");

/**
 * Collection of test utilities and configurations.
 * 
 * TODO: move hard coded to config
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
   * Get a singleton instance of a wallet supported by RPC.
   */
  static async getWalletRpc() {
    if (this.walletRpc === undefined) {
      
      // construct wallet rpc instance with daemon connection
      this.walletRpc = new MoneroWalletRpc(TestUtils.WALLET_RPC_CONFIG);
    }
    
    // attempt to open test wallet
    try {
      await this.walletRpc.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_PASSWORD);
    } catch (e) {
      if (!(e instanceof MoneroRpcError)) throw e;
      
      // -1 returned when the wallet does not exist or it's open by another application
      if (e.getCode() === -1) {
        
        // create wallet
        await this.walletRpc.createWalletFromMnemonic(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_PASSWORD, TestUtils.MNEMONIC, TestUtils.FIRST_RECEIVE_HEIGHT);
      } else {
        throw e;
      }
    }
    
    // ensure we're testing the right wallet
    assert.equal(await this.walletRpc.getMnemonic(), TestUtils.MNEMONIC);
    assert.equal(await this.walletRpc.getPrimaryAddress(), TestUtils.ADDRESS);
    
    // sync and save the wallet
    await this.walletRpc.sync();
    await this.walletRpc.save();
    
    // return cached wallet rpc
    return this.walletRpc;
  }
  
  /**
   * Get a singleton instance of a keys-only wallet shared among tests.
   */
  static async getWalletKeys() {
    if (this.walletKeys === undefined) {
      
      // create wallet from mnemonic
      this.walletKeys = MoneroWalletKeys.createWalletFromMnemonic(TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC);
    }
    return this.walletKeys;
  }
  
  /**
   * Get a singleton instance of a core wallet shared among tests.
   */
  static async getWalletCore() {
    if (this.walletCore === undefined || await this.walletCore.isClosed()) { 
      
      // create wallet from mnemonic phrase if it doesn't exist
      if (!await MoneroWalletCore.walletExists(TestUtils.WALLET_WASM_PATH_1)) {
        
        // create directory for test wallets if it doesn't exist
        if (!FS.existsSync(TestUtils.TEST_WALLETS_DIR)) FS.mkdirSync(TestUtils.TEST_WALLETS_DIR);
        
        // create wallet iwth connection
        this.walletCore = await MoneroWalletCore.createWalletFromMnemonic(TestUtils.WALLET_WASM_PATH_1, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, (await TestUtils.getDaemonRpc()).getRpcConnection(), TestUtils.FIRST_RECEIVE_HEIGHT);
        assert.equal(await this.walletCore.getRestoreHeight(), TestUtils.FIRST_RECEIVE_HEIGHT);
        await this.walletCore.sync(new WalletSyncPrinter());
        //await this.walletCore.save();  // TODO: necessary for can start and stop syncing test?
        //await this.walletCore.startSyncing();
      }
      
      // otherwise open existing wallet
      else {
        this.walletCore = await MoneroWalletCore.openWallet(TestUtils.WALLET_WASM_PATH_1, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, (await TestUtils.getDaemonRpc()).getRpcConnection());
        await this.walletCore.sync(new WalletSyncPrinter());
        //await this.walletCore.startSyncing();
      }
    }
    
    // return cached core wallet
    return this.walletCore;
  }
  
  /**
   * Creates a new wallet considered to be "ground truth" (a freshly created wasm wallet).
   * 
   * @param networkType is the ground truth wallet's network type
   * @param mnemonic is the ground truth wallet's mnemonic
   * @param restoreHeight is the ground truth wallet's restore height
   * @return the created wallet
   */
  static async createWalletGroundTruth(networkType, mnemonic, restoreHeight) {
    let path = TestUtils.TEST_WALLETS_DIR + "/gt_wallet_" + GenUtils.uuidv4();
    let gtWallet = await MoneroWalletCore.createWalletFromMnemonic(path, TestUtils.WALLET_PASSWORD, networkType, mnemonic, (await TestUtils.getDaemonRpc()).getRpcConnection(), restoreHeight, undefined);
    assert.equal(await gtWallet.getRestoreHeight(), restoreHeight === undefined ? 0 : restoreHeight);
    await gtWallet.sync();
    //await gtWallet.startSyncing();  // TODO
    return gtWallet;
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
    let wallet = await MoneroWalletKeys.createWalletRandom(TestUtils.NETWORK_TYPE);
    return await wallet.getPrimaryAddress();
  }
}

// ---------------------------- STATIC TEST CONFIG ----------------------------

// TODO: export these to key/value properties file for tests
// TODO: in properties, define {network: stagnet, network_configs: { stagnet: { daemonRpc: { host: _, port: _ ... etc

// monero daemon rpc endpoint configuration (adjust per your configuration)
TestUtils.DAEMON_RPC_URI = "http://localhost:38081";
TestUtils.DAEMON_RPC_USERNAME = undefined;
TestUtils.DAEMON_RPC_PASSWORD = undefined;

TestUtils.TEST_WALLETS_DIR = "./test_wallets";
TestUtils.WALLET_WASM_PATH_1 = TestUtils.TEST_WALLETS_DIR + "/test_wallet_1";

TestUtils.MAX_FEE = new BigInteger(7500000).multiply(new BigInteger(10000));
TestUtils.NETWORK_TYPE = MoneroNetworkType.STAGENET;

// default keypair to test
TestUtils.MNEMONIC = "petals frown aerial leisure ruined needed pruned object misery items sober agile lopped galaxy mouth glide business sieve dizzy imitate ritual nucleus chlorine cottage ruined";
TestUtils.ADDRESS = "54tjXUgQVYNXQCJM4CatRQZMacZ2Awq4NboKiUYtUJrhgYZjiDhMz4ccuYRcMTno6V9mzKFXzfY8pbPnGmu2ukfWABV75k4";
TestUtils.FIRST_RECEIVE_HEIGHT = 501788;   // NOTE: this value MUST be the height of the wallet's first tx for tests

//wallet rpc test wallet filenames and passwords
TestUtils.WALLET_RPC_NAME_1 = "test_wallet_1";
TestUtils.WALLET_RPC_NAME_2 = "test_wallet_2";
TestUtils.WALLET_PASSWORD = "supersecretpassword123";

// wallet RPC config
TestUtils.WALLET_RPC_CONFIG = {
  uri: "http://localhost:38083",
  user: "rpc_user",
  pass: "abc123",
  maxRequestsPerSecond: 500,
  rejectUnauthorized: true // reject self-signed certificates if true
};

// daemon RPC config
TestUtils.DAEMON_RPC_CONFIG = {
  uri: "http://localhost:38081",
  user: "superuser",
  pass: "abctesting123",
  maxRequestsPerSecond: 500,
  rejectUnauthorized: true // reject self-signed certificates if true
};

// used to track which wallets are in sync with pool so associated txs in the pool do not need to be waited on
TestUtils.TX_POOL_WALLET_TRACKER = new TxPoolWalletTracker();

//utils/TestUtils.DAEMON_RPC_CONFIG = {
//  uri: "http://node.xmrbackb.one:28081",
//  //user: "superuser",
//  //pass: "abctesting123",
//  maxRequestsPerSecond: 1
//};

module.exports = TestUtils;
