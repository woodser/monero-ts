const assert = require("assert");
const WalletSyncPrinter = require("./WalletSyncPrinter");
const monerojs = require("../../../index");
const LibraryUtils = monerojs.LibraryUtils;
const GenUtils = monerojs.GenUtils;
const MoneroRpcError = monerojs.MoneroRpcError;
const MoneroRpcConnection = monerojs.MoneroRpcConnection;
const BigInteger = monerojs.BigInteger;
const MoneroNetworkType = monerojs.MoneroNetworkType;
const MoneroWalletRpc = monerojs.MoneroWalletRpc;

/**
 * Collection of test utilities and configurations.
 * 
 * TODO: move hard coded to config
 */
class TestUtils {
  
  /**
   * Get a default file system.  Uses an in-memory file system if running in the browser.
   * 
   * @return nodejs-compatible file system
   */
  static getDefaultFs() {
    if (!LibraryUtils.FS) LibraryUtils.FS = GenUtils.isBrowser() ? require('memfs') : require('fs');
    return LibraryUtils.FS;
  }
  
  /**
   * Get a singleton daemon RPC instance shared among tests.
   * 
   * @return {MoneroDaemonRpc} a daemon RPC instance
   */
  static async getDaemonRpc() {
    if (TestUtils.daemonRpc === undefined) TestUtils.daemonRpc = await monerojs.connectToDaemonRpc(Object.assign({proxyToWorker: TestUtils.PROXY_TO_WORKER}, TestUtils.DAEMON_RPC_CONFIG));
    return TestUtils.daemonRpc;
  }
  
  /**
   * Get a singleton instance of a monerod client.
   */
  static getDaemonRpcConnection() {
    return new MoneroRpcConnection(TestUtils.DAEMON_RPC_CONFIG);
  }
  
  /**
   * Get a singleton instance of a monero-wallet-rpc client.
   * 
   * @return {MoneroWalletRpc} a wallet RPC instance
   */
  static async getWalletRpc() {
    if (TestUtils.walletRpc === undefined) {
      
      // construct wallet rpc instance with daemon connection
      TestUtils.walletRpc = await monerojs.connectToWalletRpc(TestUtils.WALLET_RPC_CONFIG);
    }
    
    // attempt to open test wallet
    try {
      await TestUtils.walletRpc.openWallet({path: TestUtils.WALLET_NAME, password: TestUtils.WALLET_PASSWORD});
    } catch (e) {
      if (!(e instanceof MoneroRpcError)) throw e;
      
      // -1 returned when wallet does not exist or fails to open e.g. it's already open by another application
      if (e.getCode() === -1) {
        
        // create wallet
        await TestUtils.walletRpc.createWallet({path: TestUtils.WALLET_NAME, password: TestUtils.WALLET_PASSWORD, mnemonic: TestUtils.MNEMONIC, restoreHeight: TestUtils.FIRST_RECEIVE_HEIGHT});
      } else {
        throw e;
      }
    }
    
    // ensure we're testing the right wallet
    assert.equal(await TestUtils.walletRpc.getMnemonic(), TestUtils.MNEMONIC);
    assert.equal(await TestUtils.walletRpc.getPrimaryAddress(), TestUtils.ADDRESS);
    
    // sync and save the wallet
    await TestUtils.walletRpc.sync();
    await TestUtils.walletRpc.save();
    
    // start background synchronizing with sync rate
    await TestUtils.walletRpc.startSyncing(TestUtils.SYNC_PERIOD_IN_MS);
    
    // return cached wallet rpc
    return TestUtils.walletRpc;
  }
  
  /**
   * Create a monero-wallet-rpc process bound to the next available port.
   *
   * @param {boolean} offline - wallet is started in offline mode 
   * @return {Promise<MoneroWalletRpc>} - client connected to an internal monero-wallet-rpc instance
   */
  static async startWalletRpcProcess(offline) {
    
    // get next available offset of ports to bind to
    let portOffset = 1;
    while (Object.keys(TestUtils.WALLET_PORT_OFFSETS).includes("" + portOffset)) portOffset++;
    TestUtils.WALLET_PORT_OFFSETS[portOffset] = undefined; // reserve port
    
    // create or connect to monero-wallet-rpc process
    let wallet;
    if (GenUtils.isBrowser()) {
      let uri = TestUtils.WALLET_RPC_CONFIG.uri.substring(0, TestUtils.WALLET_RPC_CONFIG.uri.lastIndexOf(":")) + ":" + (TestUtils.WALLET_RPC_PORT_START + portOffset);
      wallet = await monerojs.connectToWalletRpc(uri, TestUtils.WALLET_RPC_CONFIG.username, TestUtils.WALLET_RPC_CONFIG.password);
    } else {
        
      // create command to start client with internal monero-wallet-rpc process
      let cmd = [
          TestUtils.WALLET_RPC_LOCAL_PATH,
          "--" + MoneroNetworkType.toString(TestUtils.NETWORK_TYPE),
          "--rpc-bind-port", "" + (TestUtils.WALLET_RPC_PORT_START + portOffset),
          "--rpc-login", TestUtils.WALLET_RPC_CONFIG.username + ":" + TestUtils.WALLET_RPC_CONFIG.password,
          "--wallet-dir", TestUtils.WALLET_RPC_LOCAL_WALLET_DIR,
          "--rpc-access-control-origins", TestUtils.WALLET_RPC_ACCESS_CONTROL_ORIGINS
      ];
      if (offline) cmd.push("--offline");
      else cmd.push("--daemon-address", TestUtils.DAEMON_RPC_CONFIG.uri);
      if (TestUtils.DAEMON_RPC_CONFIG.username) cmd.push("--daemon-login", TestUtils.DAEMON_RPC_CONFIG.username + ":" + TestUtils.DAEMON_RPC_CONFIG.password);
      
      // TODO: include zmq params when supported and enabled
      
      // create and connect to monero-wallet-rpc process
      wallet = await monerojs.connectToWalletRpc(cmd);
    }
    
    // register wallet with port offset
    TestUtils.WALLET_PORT_OFFSETS[portOffset] = wallet;
    return wallet;
  }
  
  /**
   * Stop a monero-wallet-rpc process and release its port.
   * 
   * @param {MoneroWalletRpc} walletRpc - wallet created with internal monero-wallet-rpc process
   */
  static async stopWalletRpcProcess(walletRpc) {
    assert(walletRpc instanceof MoneroWalletRpc, "Must provide instance of MoneroWalletRpc to close");
    
    // get corresponding port
    let portOffset;
    for (const [key, value] of Object.entries(TestUtils.WALLET_PORT_OFFSETS)) {
      if (value === walletRpc) {
        portOffset = key;
        break;
      }
    }
    if (portOffset === undefined) throw new Error("Wallet not registered");
    
    // unregister wallet with port offset
    delete TestUtils.WALLET_PORT_OFFSETS[portOffset];
    if (!GenUtils.isBrowser()) await walletRpc.stopProcess();
  }
  
  /**
   * Get a singleton instance of a wallet supported by WebAssembly bindings to monero-project's wallet2.
   * 
   * @return {MoneroWalletFull} a full wallet instance
   */
  static async getWalletFull() {
    if (!TestUtils.walletFull || await TestUtils.walletFull.isClosed()) {
      
      // create wallet from mnemonic phrase if it doesn't exist
      let fs = TestUtils.getDefaultFs();
      if (!await monerojs.MoneroWalletFull.walletExists(TestUtils.WALLET_FULL_PATH, fs)) {
        
        // create directory for test wallets if it doesn't exist
        if (!fs.existsSync(TestUtils.TEST_WALLETS_DIR)) {
          if (!fs.existsSync(process.cwd())) fs.mkdirSync(process.cwd(), { recursive: true });  // create current process directory for relative paths which does not exist in memory fs
          fs.mkdirSync(TestUtils.TEST_WALLETS_DIR);
        }
        
        // create wallet with connection
        TestUtils.walletFull = await monerojs.createWalletFull({path: TestUtils.WALLET_FULL_PATH, password: TestUtils.WALLET_PASSWORD, networkType: TestUtils.NETWORK_TYPE, mnemonic: TestUtils.MNEMONIC, server: TestUtils.getDaemonRpcConnection(), restoreHeight: TestUtils.FIRST_RECEIVE_HEIGHT, proxyToWorker: TestUtils.PROXY_TO_WORKER, fs: fs});
        assert.equal(await TestUtils.walletFull.getRestoreHeight(), TestUtils.FIRST_RECEIVE_HEIGHT);
        await TestUtils.walletFull.sync(new WalletSyncPrinter());
        await TestUtils.walletFull.save();
        await TestUtils.walletFull.startSyncing(TestUtils.SYNC_PERIOD_IN_MS);
      }
      
      // otherwise open existing wallet
      else {
        TestUtils.walletFull = await monerojs.openWalletFull({path: TestUtils.WALLET_FULL_PATH, password: TestUtils.WALLET_PASSWORD, networkType: TestUtils.NETWORK_TYPE, server: TestUtils.getDaemonRpcConnection(), proxyToWorker: TestUtils.PROXY_TO_WORKER, fs: TestUtils.getDefaultFs()});
        await TestUtils.walletFull.sync(new WalletSyncPrinter());
        await TestUtils.walletFull.startSyncing(TestUtils.SYNC_PERIOD_IN_MS);
      }
    }
    
    // ensure we're testing the right wallet
    assert.equal(await TestUtils.walletFull.getMnemonic(), TestUtils.MNEMONIC);
    assert.equal(await TestUtils.walletFull.getPrimaryAddress(), TestUtils.ADDRESS);
    return TestUtils.walletFull;
  }
  
  /**
   * Get a singleton keys-only wallet instance shared among tests.
   * 
   * @return {MoneroWalletKeys} a keys-only wallet instance
   */
  static async getWalletKeys() {
    if (TestUtils.walletKeys === undefined) {
      
      // create wallet from mnemonic
      TestUtils.walletKeys = await monerojs.createWalletKeys({networkType: TestUtils.NETWORK_TYPE, mnemonic: TestUtils.MNEMONIC});
    }
    return TestUtils.walletKeys;
  }
  
  /**
   * Creates a new wallet considered to be "ground truth".
   * 
   * @param networkType - ground truth wallet's network type
   * @param mnemonic - ground truth wallet's mnemonic
   * @param startHeight - height to start syncing from
   * @param restoreHeight - ground truth wallet's restore height
   * @return {MoneroWalletFull} the created wallet
   */
  static async createWalletGroundTruth(networkType, mnemonic, startHeight, restoreHeight) {

    // create directory for test wallets if it doesn't exist
    let fs = TestUtils.getDefaultFs();
    if (!fs.existsSync(TestUtils.TEST_WALLETS_DIR)) {
      if (!fs.existsSync(process.cwd())) fs.mkdirSync(process.cwd(), { recursive: true });  // create current process directory for relative paths which does not exist in memory fs
      fs.mkdirSync(TestUtils.TEST_WALLETS_DIR);
    }

    // create ground truth wallet
    let daemonConnection = new MoneroRpcConnection(TestUtils.DAEMON_RPC_CONFIG);
    let path = TestUtils.TEST_WALLETS_DIR + "/gt_wallet_" + new Date().getTime();
    let gtWallet = await monerojs.createWalletFull({
      path: path,
      password: TestUtils.WALLET_PASSWORD,
      networkType: networkType,
      mnemonic: mnemonic,
      server: daemonConnection,
      restoreHeight: restoreHeight,
      fs: fs
    });
    assert.equal(await gtWallet.getRestoreHeight(), restoreHeight ? restoreHeight : 0);
    await gtWallet.sync(startHeight, new WalletSyncPrinter());
    await gtWallet.startSyncing(TestUtils.SYNC_PERIOD_IN_MS);
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
  
  static async getExternalWalletAddress() {
    let wallet = await monerojs.createWalletKeys({networkType: TestUtils.NETWORK_TYPE});
    return await wallet.getAddress(0, 1); // subaddress
  }
  
  static txsMergeable(tx1, tx2) {
    try {
      let copy1 = tx1.copy();
      let copy2 = tx2.copy();
      if (copy1.isConfirmed()) copy1.setBlock(tx1.getBlock().copy().setTxs([copy1]));
      if (copy2.isConfirmed()) copy2.setBlock(tx2.getBlock().copy().setTxs([copy2]));
      copy1.merge(copy2);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}

// ---------------------------- STATIC TEST CONFIG ----------------------------

// TODO: export these to key/value properties file for tests

// directory with monero binaries to test (monerod and monero-wallet-rpc)
TestUtils.MONERO_BINS_DIR = "/path/to/bins";

// test wallet config
TestUtils.WALLET_NAME = "test_wallet_1";
TestUtils.WALLET_PASSWORD = "supersecretpassword123";
TestUtils.TEST_WALLETS_DIR = "./test_wallets";
TestUtils.WALLET_FULL_PATH = TestUtils.TEST_WALLETS_DIR + "/" + TestUtils.WALLET_NAME;

TestUtils.MAX_FEE = new BigInteger("7500000").multiply(new BigInteger("10000"));
TestUtils.NETWORK_TYPE = MoneroNetworkType.TESTNET;

// default keypair to test
TestUtils.MNEMONIC = "silk mocked cucumber lettuce hope adrenalin aching lush roles fuel revamp baptism wrist long tender teardrop midst pastry pigment equip frying inbound pinched ravine frying";
TestUtils.ADDRESS = "A1y9sbVt8nqhZAVm3me1U18rUVXcjeNKuBd1oE2cTs8biA9cozPMeyYLhe77nPv12JA3ejJN3qprmREriit2fi6tJDi99RR";
TestUtils.FIRST_RECEIVE_HEIGHT = 324; // NOTE: this value must be the height of the wallet's first tx for tests

// wallet RPC config
TestUtils.WALLET_RPC_CONFIG = {
  uri: "localhost:28084",
  username: "rpc_user",
  password: "abc123",
  rejectUnauthorized: true // reject self-signed certificates if true
};

// daemon config
TestUtils.DAEMON_LOCAL_PATH = TestUtils.MONERO_BINS_DIR + "/monerod";
TestUtils.DAEMON_RPC_CONFIG = {
  uri: "localhost:28081",
  username: undefined,
  password: undefined,
  rejectUnauthorized: true // reject self-signed certificates if true
};

const WalletTxTracker = require("./WalletTxTracker");
TestUtils.WALLET_TX_TRACKER = new WalletTxTracker(); // used to track wallet txs for tests
TestUtils.PROXY_TO_WORKER = true;
TestUtils.SYNC_PERIOD_IN_MS = 5000; // period between wallet syncs in milliseconds
TestUtils.OFFLINE_SERVER_URI = "offline_server_uri"; // dummy server uri to remain offline because wallet2 connects to default if not given

// monero-wallet-rpc process management
TestUtils.WALLET_RPC_PORT_START = 28084;
TestUtils.WALLET_PORT_OFFSETS = {};
TestUtils.WALLET_RPC_LOCAL_PATH = TestUtils.MONERO_BINS_DIR + "/monero-wallet-rpc";
TestUtils.WALLET_RPC_LOCAL_WALLET_DIR = TestUtils.MONERO_BINS_DIR;
TestUtils.WALLET_RPC_ACCESS_CONTROL_ORIGINS = "http://localhost:8080"; // cors access from web browser

module.exports = TestUtils;
