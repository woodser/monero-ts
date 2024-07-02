import assert from "assert";
import WalletSyncPrinter from "./WalletSyncPrinter";
import WalletTxTracker from "./WalletTxTracker";
import {LibraryUtils,
        GenUtils,
        MoneroRpcError,
        MoneroRpcConnection,
        MoneroNetworkType,
        MoneroDaemonRpc,
        MoneroWalletRpc,
        connectToWalletRpc,
        connectToDaemonRpc,
        openWalletFull,
        createWalletFull,
        createWalletKeys,
        MoneroWalletFull,
        MoneroWalletKeys} from "../../../index";

/**
 * Collection of test utilities and configurations.
 */
export default class TestUtils {

  // classes to test
  static daemonRpc: MoneroDaemonRpc;
  static walletRpc: MoneroWalletRpc;
  static walletFull: MoneroWalletFull;
  static walletKeys: MoneroWalletKeys;

  // common config
  static PROXY_TO_WORKER = true;
  static MONERO_BINS_DIR = ""; // directory with monero binaries to test (monerod and monero-wallet-rpc)
  static SYNC_PERIOD_IN_MS = 5000; // period between wallet syncs in milliseconds
  static OFFLINE_SERVER_URI = "offline_server_uri"; // dummy server uri to remain offline because wallet2 connects to default if not given
  static AUTO_CONNECT_TIMEOUT_MS = 3000;

  // wallet config
  static NETWORK_TYPE = MoneroNetworkType.TESTNET;
  static SEED = "silk mocked cucumber lettuce hope adrenalin aching lush roles fuel revamp baptism wrist long tender teardrop midst pastry pigment equip frying inbound pinched ravine frying";
  static ADDRESS = "A1y9sbVt8nqhZAVm3me1U18rUVXcjeNKuBd1oE2cTs8biA9cozPMeyYLhe77nPv12JA3ejJN3qprmREriit2fi6tJDi99RR";
  static FIRST_RECEIVE_HEIGHT = 171; // NOTE: this value must be the height of the wallet's first tx for tests
  static WALLET_NAME = "test_wallet_1";
  static WALLET_PASSWORD = "supersecretpassword123";
  static TEST_WALLETS_DIR = "./test_wallets";
  static WALLET_FULL_PATH = TestUtils.TEST_WALLETS_DIR + "/" + TestUtils.WALLET_NAME;
  static WALLET_RPC_PORT_START = 28084;
  static WALLET_PORT_OFFSETS = {};
  static WALLET_RPC_LOCAL_PATH = TestUtils.MONERO_BINS_DIR + "/monero-wallet-rpc";
  static WALLET_RPC_LOCAL_WALLET_DIR = TestUtils.MONERO_BINS_DIR;
  static WALLET_RPC_ACCESS_CONTROL_ORIGINS = "http://localhost:8080"; // cors access from web browser
  static MAX_FEE = 7500000n * 10000n;
  static WALLET_TX_TRACKER = new WalletTxTracker(); // used to track wallet txs for tests
  static WALLET_RPC_CONFIG = {
    uri: "localhost:28084",
    username: "rpc_user",
    password: "abc123",
    rejectUnauthorized: true // reject self-signed certificates if true
  };

  // daemon config
  static DAEMON_LOCAL_PATH = TestUtils.MONERO_BINS_DIR + "/monerod";
  static DAEMON_RPC_CONFIG = {
    uri: "localhost:28081",
    username: "",
    password: "",
    rejectUnauthorized: true // reject self-signed certificates if true
  };
  
  /**
   * Get a default file system.  Uses an in-memory file system if running in the browser.
   * 
   * @return {any} nodejs-compatible file system
   */
  static async getDefaultFs(): Promise<any> {
    return GenUtils.isBrowser() ? (await import('memfs')).fs : await import('fs');
  }
  
  /**
   * Get a singleton daemon RPC instance shared among tests.
   * 
   * @return {Promise<MoneroDaemonRpc>} a daemon RPC instance
   */
  static async getDaemonRpc(): Promise<MoneroDaemonRpc> {
    if (TestUtils.daemonRpc === undefined) TestUtils.daemonRpc = await connectToDaemonRpc(Object.assign({proxyToWorker: TestUtils.PROXY_TO_WORKER}, TestUtils.DAEMON_RPC_CONFIG));
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
   * @return {Promise<MoneroWalletRpc>} a wallet RPC instance
   */
  static async getWalletRpc(): Promise<MoneroWalletRpc> {
    if (TestUtils.walletRpc === undefined) {
      
      // construct wallet rpc instance with daemon connection
      TestUtils.walletRpc = await connectToWalletRpc(TestUtils.WALLET_RPC_CONFIG);
    }
    
    // attempt to open test wallet
    try {
      await TestUtils.walletRpc.openWallet({path: TestUtils.WALLET_NAME, password: TestUtils.WALLET_PASSWORD});
    } catch (e) {
      if (!(e instanceof MoneroRpcError)) throw e;

      console.log(e);
      
      // -1 returned when wallet does not exist or fails to open e.g. it's already open by another application
      if (e.getCode() === -1) {
        
        // create wallet
        console.log("Creating wallet!");
        await TestUtils.walletRpc.createWallet({path: TestUtils.WALLET_NAME, password: TestUtils.WALLET_PASSWORD, seed: TestUtils.SEED, restoreHeight: TestUtils.FIRST_RECEIVE_HEIGHT});
      } else {
        throw e;
      }
    }
    
    // ensure we're testing the right wallet
    assert.equal(await TestUtils.walletRpc.getSeed(), TestUtils.SEED);
    assert.equal(await TestUtils.walletRpc.getPrimaryAddress(), TestUtils.ADDRESS);
    
    // sync and save wallet
    await TestUtils.walletRpc.sync();
    await TestUtils.walletRpc.save();
    await TestUtils.walletRpc.startSyncing(TestUtils.SYNC_PERIOD_IN_MS);
    
    // return cached wallet rpc
    return TestUtils.walletRpc;
  }
  
  /**
   * Create a monero-wallet-rpc process bound to the next available port.
   *
   * @param {boolean} [offline] - wallet is started in offline mode (default false)
   * @return {Promise<MoneroWalletRpc>} - client connected to an internal monero-wallet-rpc instance
   */
  static async startWalletRpcProcess(offline = false): Promise<MoneroWalletRpc> {
    
    // get next available offset of ports to bind to
    let portOffset = 1;
    while (Object.keys(TestUtils.WALLET_PORT_OFFSETS).includes("" + portOffset)) portOffset++;
    TestUtils.WALLET_PORT_OFFSETS[portOffset] = undefined; // reserve port
    
    // create or connect to monero-wallet-rpc process
    let wallet;
    if (GenUtils.isBrowser()) {
      let uri = TestUtils.WALLET_RPC_CONFIG.uri.substring(0, TestUtils.WALLET_RPC_CONFIG.uri.lastIndexOf(":")) + ":" + (TestUtils.WALLET_RPC_PORT_START + portOffset);
      wallet = await connectToWalletRpc(uri, TestUtils.WALLET_RPC_CONFIG.username, TestUtils.WALLET_RPC_CONFIG.password);
    } else {
        
      // create command to start client with internal monero-wallet-rpc process
      let cmd = [
          TestUtils.WALLET_RPC_LOCAL_PATH,
          "--" + GenUtils.getEnumKeyByValue(MoneroNetworkType, TestUtils.NETWORK_TYPE)!.toLowerCase(),
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
      wallet = await connectToWalletRpc(cmd);
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
      
      // create wallet from seed phrase if it doesn't exist
      let fs = await TestUtils.getDefaultFs();
      if (!await MoneroWalletFull.walletExists(TestUtils.WALLET_FULL_PATH, fs)) {
        // create directory for test wallets if it doesn't exist
        fs.existsSync(TestUtils.TEST_WALLETS_DIR) || fs.mkdirSync(TestUtils.TEST_WALLETS_DIR);
        if (!fs.existsSync(TestUtils.TEST_WALLETS_DIR)) {
          if (!fs.existsSync(process.cwd())) fs.mkdirSync(process.cwd(), { recursive: true });  // create current process directory for relative paths which does not exist in memory fs
          fs.mkdirSync(TestUtils.TEST_WALLETS_DIR);
        }
        
        // create wallet with connection
        TestUtils.walletFull = await createWalletFull({path: TestUtils.WALLET_FULL_PATH, password: TestUtils.WALLET_PASSWORD, networkType: TestUtils.NETWORK_TYPE, seed: TestUtils.SEED, server: TestUtils.getDaemonRpcConnection(), restoreHeight: TestUtils.FIRST_RECEIVE_HEIGHT, proxyToWorker: TestUtils.PROXY_TO_WORKER, fs: fs});
        assert.equal(await TestUtils.walletFull.getRestoreHeight(), TestUtils.FIRST_RECEIVE_HEIGHT);
        assert.deepEqual(await TestUtils.walletFull.getDaemonConnection(), TestUtils.getDaemonRpcConnection());
      }
      
      // otherwise open existing wallet
      else {
        TestUtils.walletFull = await openWalletFull({path: TestUtils.WALLET_FULL_PATH, password: TestUtils.WALLET_PASSWORD, networkType: TestUtils.NETWORK_TYPE, server: TestUtils.getDaemonRpcConnection(), proxyToWorker: TestUtils.PROXY_TO_WORKER, fs: fs});
        await TestUtils.walletFull.setDaemonConnection(TestUtils.getDaemonRpcConnection());
      }
    }

    // sync and save wallet
    await TestUtils.walletFull.sync(new WalletSyncPrinter());
    await TestUtils.walletFull.save();
    await TestUtils.walletFull.startSyncing(TestUtils.SYNC_PERIOD_IN_MS);
    
    // ensure we're testing the right wallet
    assert.equal(await TestUtils.walletFull.getSeed(), TestUtils.SEED);
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
      
      // create wallet from seed
      TestUtils.walletKeys = await createWalletKeys({networkType: TestUtils.NETWORK_TYPE, seed: TestUtils.SEED});
    }
    return TestUtils.walletKeys;
  }
  
  /**
   * Creates a new wallet considered to be "ground truth".
   * 
   * @param networkType - ground truth wallet's network type
   * @param seed - ground truth wallet's seed
   * @param startHeight - height to start syncing from
   * @param restoreHeight - ground truth wallet's restore height
   * @return {MoneroWalletFull} the created wallet
   */
  static async createWalletGroundTruth(networkType, seed, startHeight, restoreHeight) {

    // create directory for test wallets if it doesn't exist
    let fs = await TestUtils.getDefaultFs();
    if (!fs.existsSync(TestUtils.TEST_WALLETS_DIR)) {
      if (!fs.existsSync(process.cwd())) fs.mkdirSync(process.cwd(), { recursive: true });  // create current process directory for relative paths which does not exist in memory fs
      fs.mkdirSync(TestUtils.TEST_WALLETS_DIR);
    }

    // create ground truth wallet
    let daemonConnection = new MoneroRpcConnection(TestUtils.DAEMON_RPC_CONFIG);
    let path = TestUtils.TEST_WALLETS_DIR + "/gt_wallet_" + new Date().getTime();
    let gtWallet = await createWalletFull({
      path: path,
      password: TestUtils.WALLET_PASSWORD,
      networkType: networkType,
      seed: seed,
      server: daemonConnection,
      restoreHeight: restoreHeight,
      fs: fs
    });
    assert.equal(await gtWallet.getRestoreHeight(), restoreHeight ? restoreHeight : 0);
    await gtWallet.sync(new WalletSyncPrinter(), startHeight);
    await gtWallet.startSyncing(TestUtils.SYNC_PERIOD_IN_MS);
    return gtWallet;
  }
  
  static testUnsignedBigInt(num, nonZero?) {
    assert.equal("bigint", typeof num);
    assert(num >= 0n);
    if (nonZero === true) assert(num > 0n);
    else if (nonZero === false) assert(num === 0n);
  }
  
  static async getExternalWalletAddress() {
    let wallet = await createWalletKeys({networkType: TestUtils.NETWORK_TYPE});
    return await wallet.getAddress(0, 1); // subaddress
  }
  
  static txsMergeable(tx1, tx2) {
    try {
      let copy1 = tx1.copy();
      let copy2 = tx2.copy();
      if (copy1.getIsConfirmed()) copy1.setBlock(tx1.getBlock().copy().setTxs([copy1]));
      if (copy2.getIsConfirmed()) copy2.setBlock(tx2.getBlock().copy().setTxs([copy2]));
      copy1.merge(copy2);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}