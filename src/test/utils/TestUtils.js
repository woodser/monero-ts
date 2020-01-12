const MoneroWalletRpc = require("../../main/js/wallet/MoneroWalletRpc");
const MoneroDaemonRpc = require("../../main/js/daemon/MoneroDaemonRpc");

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
   * Get singleton instance of a keys-only wallet shared among tests.
   */
  static async getWalletKeys() {
    if (this.walletKeys === undefined) {
      
      // import keys-only wallet module
      const MoneroWalletKeys = await require("../../../src/main/js/wallet/MoneroWalletKeys")();
      
      // create wallet from mnemonic
      this.walletKeys = MoneroWalletKeys.createWalletFromMnemonic(TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC);
    }
    return this.walletKeys;
  }
  
  /**
   * Get a singleton instance of a wallet supported by WASM.
   * 
   * TODO: this creates and syncs new wallet every time; need to save and restore json
   */
  static async getWalletWasm() {
    if (this.walletWasm === undefined || await this.walletWasm.isClosed()) {
      
      // import wasm wallet module
      const MoneroWalletWasm = await require("../../../src/main/js/wallet/MoneroWalletWasm")();
      
      // create wallet from mnemonic phrase if it doesn't exist
      if (!await MoneroWalletWasm.walletExists(TestUtils.WALLET_WASM_PATH_1)) {
        let daemonConnection = new MoneroRpcConnection(TestUtils.DAEMON_RPC_URI, TestUtils.DAEMON_RPC_USERNAME, TestUtils.DAEMON_RPC_PASSWORD);
        this.walletWasm = await MoneroWalletWasm.createWalletFromMnemonic(TestUtils.WALLET_WASM_PATH_1, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, (await TestUtils.getDaemonRpc()).getRpcConnection(), TestUtils.FIRST_RECEIVE_HEIGHT);
        //assert.equal(await this.walletWasm.getRestoreHeight(), TestUtils.FIRST_RECEIVE_HEIGHT);
        console.log("Synchronizing test wallet...");
        await this.walletWasm.sync();
        //await this.walletWasm.sync(new WalletSyncPrinter());  // TODO
        await this.walletWasm.save(); // save progress
        //await this.walletWasm.startSyncing();                 // TODO
      }
      
      // otherwise open existing wallet
      else {
        this.walletWasm = await MoneroWalletWasm.openWallet(TestUtils.WALLET_WASM_PATH_1, TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, (await TestUtils.getDaemonRpc()).getRpcConnection());
        await this.walletWasm.sync();
        //await this.walletWasm.save();
        //await this.walletWasm.sync(new WalletSyncPrinter());  // TODO
        //await this.walletWasm.startSyncing();                 // TODO
      }
      
      // TODO: hook to save on shutdown?
//      // Save and close the JNI wallet when the runtime is shutting down in order
//      // to preserve local wallet data (e.g. destination addresses and amounts).
//      // This is not necessary in the rpc wallet which saves automatically.
//      Runtime.getRuntime().addShutdownHook(new Thread() {
//        public void run() {
//          walletJni.close(true);
//        }
//      });
    }
    
    // return cached wasm wallet
    return this.walletWasm;
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
    const MoneroWalletKeys = await require("../../../src/main/js/wallet/MoneroWalletKeys")();
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
TestUtils.MNEMONIC = "megabyte ghetto syllabus opposite firm january velvet kennel often bugs luggage nucleus volcano fainted ripped biology firm sushi putty swagger dove obedient unnoticed washing swagger";
TestUtils.ADDRESS = "58De3pTCy1CFkh2xwTDCPwiTzkby13CZfJ262vak9nmuSUAbayvYnXaJY7WNGJMJCMBdFn4opqYCrVP3rP3irUZyDMht94C";
TestUtils.FIRST_RECEIVE_HEIGHT = 453289;   // NOTE: this value MUST be the height of the wallet's first tx for tests

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
