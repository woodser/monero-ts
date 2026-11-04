import assert from "assert";
import WalletSyncPrinter from "./WalletSyncPrinter";
import WalletTxTracker from "./WalletTxTracker";
import Regtest from "./Regtest";
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
        MoneroWalletConfig,
        MoneroWalletFull,
        MoneroWalletKeys} from "../../../index";

const env = typeof process === "undefined" ? {} : process.env || {};

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
  static MONERO_BINS_DIR = env.MONERO_BINS_DIR || "./external/monero-cpp/external/monero-project/build/release/bin"; // directory with monero binaries to test (monerod and monero-wallet-rpc)
  static REGTEST_DIR = "./test_regtest"; // directory with the chain and wallets of the regtest servers started by the tests
  static SYNC_PERIOD_IN_MS = 5000; // period between wallet syncs in milliseconds
  static BLOCK_PERIOD_IN_MS = 2000; // period between blocks mined in the background
  static OFFLINE_SERVER_URI = "offline_server_uri"; // dummy server uri to remain offline because wallet2 connects to default if not given
  static AUTO_CONNECT_TIMEOUT_MS = 3000;

  // wallet config
  static NETWORK_TYPE = MoneroNetworkType.MAINNET;
  static SEED = "silk mocked cucumber lettuce hope adrenalin aching lush roles fuel revamp baptism wrist long tender teardrop midst pastry pigment equip frying inbound pinched ravine frying";
  static ADDRESS = "4ARcPLqcrRjhZAVm3me1U18rUVXcjeNKuBd1oE2cTs8biA9cozPMeyYLhe77nPv12JA3ejJN3qprmREriit2fi6tJAPbWJu";
  static MINING_SEED = "wield dinner tipsy pepper laboratory zigzags evicted fowls entrance cigar ourselves onboard inkling cousin losing whole smog mops viewpoint highway skater hashing kept lawsuit highway"; // wallet mined to, which funds the test wallet's history
  static MINING_ADDRESS = "45L2BnYnjPe4K74PfyNLCg37UPr7GTeVcRaSQYVTNFw9XebBpTexBTFNzCMhHWM5ftFBFiQMbAAd5ZR5fRdjx67R3h5mhTY";
  static FIRST_RECEIVE_HEIGHT = 101; // NOTE: this value must be the height of the wallet's first tx for tests
  static WALLET_NAME = "test_wallet_1";
  static WALLET_PASSWORD = "supersecretpassword123";
  static TEST_WALLETS_DIR = env.MONERO_TEST_WALLETS_DIR || TestUtils.REGTEST_DIR + "/wallet_full";
  static WALLET_FULL_PATH = TestUtils.TEST_WALLETS_DIR + "/" + TestUtils.WALLET_NAME;
  static WALLET_RPC_PORT_START = Number(env.MONERO_WALLET_RPC_PORT || 28984);
  static WALLET_PORT_OFFSETS = {};
  static WALLET_RPC_LOCAL_PATH = TestUtils.MONERO_BINS_DIR + "/monero-wallet-rpc";
  static WALLET_RPC_LOCAL_WALLET_DIR = env.MONERO_WALLET_RPC_DIR || TestUtils.REGTEST_DIR + "/wallet_rpc";
  static WALLET_RPC_ACCESS_CONTROL_ORIGINS = "http://localhost:8080"; // cors access from web browser
  static MAX_FEE = 7500000n * 10000n;
  static WALLET_TX_TRACKER = new WalletTxTracker(); // used to track wallet txs for tests
  static WALLET_RPC_CONFIG = {
    uri: "http://127.0.0.1:" + TestUtils.WALLET_RPC_PORT_START,
    username: env.MONERO_WALLET_RPC_USERNAME || "rpc_user",
    password: env.MONERO_WALLET_RPC_PASSWORD || "abc123",
    rejectUnauthorized: true // reject self-signed certificates if true
  };

  // daemon config
  static DAEMON_LOCAL_PATH = TestUtils.MONERO_BINS_DIR + "/monerod";
  static DAEMON_RPC_PORT = Number(env.MONERO_DAEMON_RPC_PORT || 28981);
  static DAEMON_RPC_CONFIG = {
    uri: "http://127.0.0.1:" + TestUtils.DAEMON_RPC_PORT,
    username: env.MONERO_DAEMON_RPC_USERNAME || "",
    password: env.MONERO_DAEMON_RPC_PASSWORD || "",
    rejectUnauthorized: true // reject self-signed certificates if true
  };
  
  /**
   * Get a default file system.  Uses an in-memory file system if running in the browser.
   * 
   * @return {any} nodejs-compatible file system
   */
  static async getDefaultFs(): Promise<any> {
    return GenUtils.isBrowser() ? (await import('memfs')).fs.promises : (await import('fs')).promises;
  }
  
  /**
   * Get a singleton daemon RPC instance shared among tests.
   * 
   * @return {Promise<MoneroDaemonRpc>} a daemon RPC instance
   */
  static async getDaemonRpc(): Promise<MoneroDaemonRpc> {
    if (TestUtils.daemonRpc === undefined) {
      await Regtest.start();
      TestUtils.daemonRpc = await connectToDaemonRpc(Object.assign({proxyToWorker: TestUtils.PROXY_TO_WORKER}, TestUtils.DAEMON_RPC_CONFIG));
    }
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
      await Regtest.start();
      
      // construct wallet rpc instance with daemon connection
      TestUtils.walletRpc = await connectToWalletRpc(TestUtils.WALLET_RPC_CONFIG);
    }
    await TestUtils.openTestWallet(TestUtils.walletRpc);
    
    // sync and save wallet
    await TestUtils.walletRpc.sync();
    await TestUtils.walletRpc.save();
    await TestUtils.walletRpc.startSyncing(TestUtils.SYNC_PERIOD_IN_MS);
    
    // return cached wallet rpc
    return TestUtils.walletRpc;
  }

  /**
   * Open the test wallet on a wallet server, creating it from the seed if it does not exist.
   */
  static async openTestWallet(walletRpc: MoneroWalletRpc) {
    try {
      await walletRpc.openWallet({path: TestUtils.WALLET_NAME, password: TestUtils.WALLET_PASSWORD});
    } catch (e) {

      // -1 returned when wallet does not exist or fails to open e.g. it's already open by another application
      if (!(e instanceof MoneroRpcError) || e.getCode() !== -1) throw e;
      await walletRpc.createWallet({path: TestUtils.WALLET_NAME, password: TestUtils.WALLET_PASSWORD, seed: TestUtils.SEED, restoreHeight: TestUtils.FIRST_RECEIVE_HEIGHT});
    }

    // ensure we're testing the right wallet
    assert.equal(await walletRpc.getSeed(), TestUtils.SEED);
    assert.equal(await walletRpc.getPrimaryAddress(), TestUtils.ADDRESS);
  }

  static async openWalletRpc(config: Partial<MoneroWalletConfig>): Promise<MoneroWalletRpc> {

      // assign defaults
      config = new MoneroWalletConfig(config);
      if (config.getPassword() === undefined) config.setPassword(TestUtils.WALLET_PASSWORD);
      if (!config.getServer() && !config.getConnectionManager()) config.setServer(await (await this.getDaemonRpc()).getRpcConnection());

      // create client connected to internal monero-wallet-rpc executable
      let server = config.getServer();
      let wallet = await TestUtils.startWalletRpcProcess(server ? server.getUri() : undefined, server ? server.getUsername() : undefined, server ? server.getPassword() : undefined);

      // open wallet
      try {
          await wallet.stopSyncing();
          await wallet.openWallet(config);
          await wallet.setDaemonConnection(await wallet.getDaemonConnection(), true, undefined); // set daemon as trusted
          if (await wallet.isConnectedToDaemon()) await wallet.startSyncing(TestUtils.SYNC_PERIOD_IN_MS);
          return wallet;
      } catch (err) {
          await TestUtils.stopWalletRpcProcess(wallet);
          throw err;
      }
  }

  static async createWalletRpc(config?: Partial<MoneroWalletConfig>): Promise<MoneroWalletRpc> {
        
      // assign defaults
      config = new MoneroWalletConfig(config);
      let random = !config.getSeed() && !config.getPrimaryAddress();
      if (!config.getPath()) config.setPath(GenUtils.getUUID());
      if (config.getPassword() === undefined) config.setPassword(TestUtils.WALLET_PASSWORD);
      if (!config.getRestoreHeight() && !random) config.setRestoreHeight(0);
      if (!config.getServer() && !config.getConnectionManager()) config.setServer(await (await this.getDaemonRpc()).getRpcConnection());

      // create client connected to internal monero-wallet-rpc executable
      let server = config.getServer();
      let wallet = await TestUtils.startWalletRpcProcess(server ? server.getUri() : undefined, server ? server.getUsername() : undefined, server ? server.getPassword() : undefined);

      // create wallet
      try {
          await wallet.stopSyncing();
          await wallet.createWallet(config);
          await wallet.setDaemonConnection(await wallet.getDaemonConnection(), true, undefined); // set daemon as trusted
          if (await wallet.isConnectedToDaemon()) await wallet.startSyncing(TestUtils.SYNC_PERIOD_IN_MS);
          return wallet;
      } catch (err) {
          await TestUtils.stopWalletRpcProcess(wallet);
          throw err;
      }
  }
  
  /**
   * Create a monero-wallet-rpc process bound to the next available port.
   *
   * @param {string} [daemonUri] - daemon URI to use as startup flag
   * @param {string} [daemonUsername] - daemon username to use as startup flag
   * @param {string} [daemonPassword] - daemon password to use as startup flag
   * @return {Promise<MoneroWalletRpc>} - client connected to an internal monero-wallet-rpc instance
   */
  static async startWalletRpcProcess(daemonUri = "", daemonUsername = "", daemonPassword = ""): Promise<MoneroWalletRpc> {

    if (!daemonUri) {
      daemonUri = TestUtils.DAEMON_RPC_CONFIG.uri;
      daemonUsername = TestUtils.DAEMON_RPC_CONFIG.username;
      daemonPassword = TestUtils.DAEMON_RPC_CONFIG.password;
    }
    
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
        
      await (await TestUtils.getDefaultFs()).mkdir(TestUtils.WALLET_RPC_LOCAL_WALLET_DIR, { recursive: true });

      // create command to start client with internal monero-wallet-rpc process
      let cmd = [
          TestUtils.WALLET_RPC_LOCAL_PATH,
          "--allow-mismatched-daemon-version",
          "--rpc-bind-port", "" + (TestUtils.WALLET_RPC_PORT_START + portOffset),
          "--rpc-login", TestUtils.WALLET_RPC_CONFIG.username + ":" + TestUtils.WALLET_RPC_CONFIG.password,
          "--wallet-dir", TestUtils.WALLET_RPC_LOCAL_WALLET_DIR,
          "--log-file", TestUtils.WALLET_RPC_LOCAL_WALLET_DIR + "/wallet_rpc_" + (TestUtils.WALLET_RPC_PORT_START + portOffset) + ".log",
          "--rpc-access-control-origins", TestUtils.WALLET_RPC_ACCESS_CONTROL_ORIGINS
      ];
      let offline = daemonUri === GenUtils.normalizeUri(TestUtils.OFFLINE_SERVER_URI);
      if (offline) cmd.push("--offline");
      else if (daemonUri) {
        cmd.push("--daemon-address", daemonUri);
        if (daemonUsername) cmd.push("--daemon-login", daemonUsername + ":" + daemonPassword);
      }
      
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
      await Regtest.start();
      
      // create wallet from seed phrase if it doesn't exist
      let fs = await TestUtils.getDefaultFs();
      if (!await MoneroWalletFull.walletExists(TestUtils.WALLET_FULL_PATH, fs)) {
        // create directory for test wallets if it doesn't exist
        await LibraryUtils.exists(fs, TestUtils.TEST_WALLETS_DIR) || await fs.mkdir(TestUtils.TEST_WALLETS_DIR, { recursive: true });
        if (!await LibraryUtils.exists(fs, TestUtils.TEST_WALLETS_DIR)) {
          if (!await LibraryUtils.exists(fs, process.cwd())) await fs.mkdir(process.cwd(), { recursive: true });  // create current process directory for relative paths which does not exist in memory fs
          fs.mkdir(TestUtils.TEST_WALLETS_DIR, { recursive: true });
        }
        
        // create wallet with connection
        TestUtils.walletFull = await createWalletFull({path: TestUtils.WALLET_FULL_PATH, password: TestUtils.WALLET_PASSWORD, networkType: TestUtils.NETWORK_TYPE, regtest: true, seed: TestUtils.SEED, server: TestUtils.getDaemonRpcConnection(), restoreHeight: TestUtils.FIRST_RECEIVE_HEIGHT, proxyToWorker: TestUtils.PROXY_TO_WORKER, fs: fs});
        assert.equal(await TestUtils.walletFull.getRestoreHeight(), TestUtils.FIRST_RECEIVE_HEIGHT);
        assert.deepEqual((await TestUtils.walletFull.getDaemonConnection()).getConfig(), TestUtils.getDaemonRpcConnection().getConfig());
      }
      
      // otherwise open existing wallet
      else {
        TestUtils.walletFull = await openWalletFull({path: TestUtils.WALLET_FULL_PATH, password: TestUtils.WALLET_PASSWORD, networkType: TestUtils.NETWORK_TYPE, regtest: true, server: TestUtils.getDaemonRpcConnection(), proxyToWorker: TestUtils.PROXY_TO_WORKER, fs: fs});
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
    await Regtest.start();

    // create directory for test wallets if it doesn't exist
    let fs = await TestUtils.getDefaultFs();
    if (!await LibraryUtils.exists(fs, TestUtils.TEST_WALLETS_DIR)) {
      if (!await LibraryUtils.exists(fs, process.cwd())) await fs.mkdir(process.cwd(), { recursive: true });  // create current process directory for relative paths which does not exist in memory fs
      await fs.mkdir(TestUtils.TEST_WALLETS_DIR, { recursive: true });
    }

    // create ground truth wallet
    let daemonConnection = new MoneroRpcConnection(TestUtils.DAEMON_RPC_CONFIG);
    let path = TestUtils.TEST_WALLETS_DIR + "/gt_wallet_" + new Date().getTime();
    let gtWallet = await createWalletFull({
      path: path,
      password: TestUtils.WALLET_PASSWORD,
      networkType: networkType,
      regtest: true,
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

// stop servers started by the tests when the process is signalled, since no after hook runs then
if (!GenUtils.isBrowser()) for (let signal of ["SIGINT", "SIGTERM"] as NodeJS.Signals[]) process.once(signal, async () => { await Regtest.stop(); process.kill(process.pid, signal); });
