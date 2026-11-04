import TestUtils from "./TestUtils";
import StartMining from "./StartMining";
import {GenUtils,
        MoneroDaemonRpc,
        MoneroTxConfig,
        MoneroWalletRpc,
        connectToDaemonRpc,
        connectToWalletRpc} from "../../../index";

const env = typeof process === "undefined" ? {} : process.env || {};

/**
 * Starts and funds the regtest servers used by the tests unless they are already running.
 */
export default class Regtest {

  static COINBASE_BLOCKS = 100; // blocks mined to the test wallet from its first receive height
  static COVERAGE_BLOCKS = 15; // one block funding accounts 1 to 3, 10 to unlock, one spend per account, one block funding every subaddress
  static HISTORY_ROUNDS = 20; // random transfers confirmed one per block after coverage

  // getters because TestUtils imports this module and is undefined while its static fields initialize
  static get FUNDING_HEIGHT() { return TestUtils.FIRST_RECEIVE_HEIGHT + Regtest.COINBASE_BLOCKS + 60; } // the test wallet's coinbase outputs are unlocked
  static get FIXTURE_HEIGHT() { return Regtest.FUNDING_HEIGHT + Regtest.COVERAGE_BLOCKS + Regtest.HISTORY_ROUNDS + 10; } // history outputs are unlocked

  protected static daemon: MoneroDaemonRpc;
  protected static walletRpc: MoneroWalletRpc;
  protected static started: Promise<void>;
  protected static stopped: Promise<void>;

  /**
   * Start the servers unless they answer on the configured ports, then fund the test wallet on a fresh chain.
   */
  static async start(): Promise<void> {
    if (GenUtils.isBrowser()) return; // the browser uses servers started by RunBrowserTestServers
    if (!Regtest.started) Regtest.started = Regtest.startAndFund();
    return Regtest.started;
  }

  /**
   * Stop the servers started by this process and any wallet servers left running by tests, once for concurrent callers.
   */
  static async stop(): Promise<void> {
    if (!Regtest.stopped) Regtest.stopped = Regtest.stopAll();
    return Regtest.stopped;
  }

  protected static async stopAll() {
    if (Regtest.started) await Regtest.started.catch(() => undefined); // a pending start assigns its servers when it settles
    for (let wallet of Object.values(TestUtils.WALLET_PORT_OFFSETS)) if (wallet) await TestUtils.stopWalletRpcProcess(wallet);
    if (Regtest.walletRpc && Regtest.walletRpc.getProcess()) await Regtest.walletRpc.stopProcess();
    if (Regtest.daemon && Regtest.daemon.getProcess()) await Regtest.daemon.stopProcess();
  }

  protected static async startAndFund() {
    Regtest.daemon = await Regtest.startDaemon();
    Regtest.walletRpc = await Regtest.startWalletRpc();
    await Regtest.mineTo(TestUtils.MINING_ADDRESS, TestUtils.FIRST_RECEIVE_HEIGHT);
    await Regtest.mineTo(TestUtils.ADDRESS, TestUtils.FIRST_RECEIVE_HEIGHT + Regtest.COINBASE_BLOCKS);
    await Regtest.mineTo(TestUtils.MINING_ADDRESS, Regtest.FUNDING_HEIGHT);
    if (await Regtest.daemon.getHeight() < Regtest.FIXTURE_HEIGHT) await Regtest.buildHistory();
    if ((await Regtest.daemon.getTxPool()).length) await StartMining.generateBlocks(10); // confirm and unlock txs left by a previous run
    await Regtest.initMiningDataset();
  }

  // mine a block with the daemon so its randomx dataset is initialized before tests stop mining through
  // the wallet servers, whose daemon requests time out after 15 seconds
  protected static async initMiningDataset() {
    let height = await Regtest.daemon.getHeight();
    let miningStarted = !(await Regtest.daemon.getMiningStatus()).getIsActive();
    if (miningStarted) await Regtest.daemon.startMining(TestUtils.MINING_ADDRESS, 1, false, true);
    while (await Regtest.daemon.getHeight() === height) await GenUtils.waitFor(100);
    if (miningStarted) await Regtest.daemon.stopMining();
  }

  // connect to the daemon on the configured port, starting one if nothing answers
  protected static async startDaemon(): Promise<MoneroDaemonRpc> {
    let daemon = await connectToDaemonRpc(TestUtils.DAEMON_RPC_CONFIG);
    let info;
    try {
      info = await daemon.getInfo();
    } catch (e: any) {
      let dataDir = TestUtils.REGTEST_DIR + "/monerod"; // TestUtils imports this module, so it is undefined while static fields initialize
      await (await TestUtils.getDefaultFs()).mkdir(dataDir, {recursive: true});
      daemon = await connectToDaemonRpc([TestUtils.DAEMON_LOCAL_PATH,
          "--regtest", "--keep-fakechain", "--offline", "--fixed-difficulty", "1", "--non-interactive", "--no-zmq",
          "--p2p-bind-ip", "127.0.0.1", "--p2p-bind-port", "" + (TestUtils.DAEMON_RPC_PORT - 1),
          "--rpc-bind-ip", "127.0.0.1", "--rpc-bind-port", "" + TestUtils.DAEMON_RPC_PORT,
          "--rpc-ssl", "disabled", "--rpc-access-control-origins", TestUtils.WALLET_RPC_ACCESS_CONTROL_ORIGINS,
          "--data-dir", dataDir, "--check-updates", "disabled", "--disable-dns-checkpoints"]);
      info = await daemon.getInfo();
    }
    if (!info.getIsRegtest()) throw new Error("Daemon at " + TestUtils.DAEMON_RPC_CONFIG.uri + " is not regtest");
    return daemon;
  }

  // connect to the wallet server on the configured port, starting one if nothing answers
  protected static async startWalletRpc(): Promise<MoneroWalletRpc> {
    let walletRpc = await connectToWalletRpc(TestUtils.WALLET_RPC_CONFIG);
    try {
      await walletRpc.getVersion();
      return walletRpc;
    } catch (e: any) {
      await (await TestUtils.getDefaultFs()).mkdir(TestUtils.WALLET_RPC_LOCAL_WALLET_DIR, {recursive: true});
      let cmd = [TestUtils.WALLET_RPC_LOCAL_PATH,
          "--rpc-bind-ip", "127.0.0.1", "--rpc-bind-port", "" + TestUtils.WALLET_RPC_PORT_START,
          "--rpc-login", TestUtils.WALLET_RPC_CONFIG.username + ":" + TestUtils.WALLET_RPC_CONFIG.password,
          "--rpc-ssl", "disabled", "--daemon-ssl", "disabled",
          "--rpc-access-control-origins", TestUtils.WALLET_RPC_ACCESS_CONTROL_ORIGINS,
          "--daemon-address", TestUtils.DAEMON_RPC_CONFIG.uri,
          "--wallet-dir", TestUtils.WALLET_RPC_LOCAL_WALLET_DIR,
          "--log-file", TestUtils.WALLET_RPC_LOCAL_WALLET_DIR + "/monero-wallet-rpc.log",
          "--allow-mismatched-daemon-version", "--trusted-daemon", "--non-interactive"];
      if (TestUtils.DAEMON_RPC_CONFIG.username) cmd.push("--daemon-login", TestUtils.DAEMON_RPC_CONFIG.username + ":" + TestUtils.DAEMON_RPC_CONFIG.password);
      return connectToWalletRpc(cmd);
    }
  }

  protected static async mineTo(address: string, height: number) {
    await StartMining.generateBlocks(height - await Regtest.daemon.getHeight(), address);
  }

  // confirm a seeded random sequence of transfers so the test wallet has history beyond coinbase
  protected static async buildHistory() {
    let seed = Number(env.MONERO_HISTORY_SEED) || Math.floor(Math.random() * 2147483646) + 1;
    console.log("Building regtest history with seed " + seed);
    let nextInt = (bound: number) => (seed = seed * 48271 % 2147483647) % bound; // minimal standard generator
    let wallet = Regtest.walletRpc;
    await TestUtils.openTestWallet(wallet);
    let funder = await TestUtils.createWalletRpc({seed: TestUtils.MINING_SEED, server: TestUtils.getDaemonRpcConnection()});
    try {
      await funder.sync();
      if (await funder.getUnlockedBalance() === 0n) throw new Error("Mining wallet is unfunded on this chain, delete " + TestUtils.REGTEST_DIR + " to start over");
      while ((await wallet.getAccounts()).length < 4) await wallet.createAccount();
      for (let accountIdx = 0; accountIdx < 4; accountIdx++) while ((await wallet.getSubaddresses(accountIdx)).length < 3) await wallet.createSubaddress(accountIdx);
      let randomAddress = () => wallet.getAddress(nextInt(4), nextInt(3));
      let randomAmount = () => TestUtils.MAX_FEE * BigInt(nextInt(20) + 1);
      
      // fund accounts 1 to 3, spend from each so each has spent outputs, then fund every subaddress from account 0
      let funding = new MoneroTxConfig({accountIndex: 0, relay: true});
      for (let accountIdx = 1; accountIdx < 4; accountIdx++) funding.addDestination(await wallet.getAddress(accountIdx, 0), TestUtils.MAX_FEE * 2n);
      await wallet.sync();
      await wallet.createTx(funding);
      await StartMining.generateBlocks(10);
      for (let accountIdx = 1; accountIdx < 4; accountIdx++) {
        await wallet.sync();
        await wallet.createTx({accountIndex: accountIdx, address: await funder.getPrimaryAddress(), amount: TestUtils.MAX_FEE, relay: true});
        await StartMining.generateBlocks(1);
      }
      funding = new MoneroTxConfig({accountIndex: 0, relay: true});
      for (let accountIdx = 0; accountIdx < 4; accountIdx++) for (let subaddressIdx = 0; subaddressIdx < 3; subaddressIdx++) funding.addDestination(await wallet.getAddress(accountIdx, subaddressIdx), randomAmount());
      await wallet.sync();
      await wallet.createTx(funding);
      await StartMining.generateBlocks(1);
      
      // random transfers one per block
      while (await Regtest.daemon.getHeight() < Regtest.FUNDING_HEIGHT + Regtest.COVERAGE_BLOCKS + Regtest.HISTORY_ROUNDS) {
        await wallet.sync();
        await funder.sync();
        let config = new MoneroTxConfig({accountIndex: 0, relay: true});
        let shape = nextInt(4);
        if (shape === 0) await funder.createTx(config.addDestination(await randomAddress(), randomAmount()));
        else if (shape === 1) await wallet.createTx(config.addDestination(await funder.getPrimaryAddress(), randomAmount()));
        else {
          for (let i = nextInt(3); i >= 0; i--) config.addDestination(await randomAddress(), randomAmount());
          await wallet.createTx(config);
        }
        await StartMining.generateBlocks(1);
      }
      await Regtest.mineTo(TestUtils.MINING_ADDRESS, Regtest.FIXTURE_HEIGHT);
    } finally {
      await funder.close(true);
      await TestUtils.stopWalletRpcProcess(funder);
    }
  }
}
