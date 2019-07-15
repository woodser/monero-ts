const assert = require("assert");
const MoneroDaemonRpc = require("../src/daemon/MoneroDaemonRpc");
const MoneroWalletRpc = require("../src/wallet/MoneroWalletRpc");
const MoneroWalletLocal = require("../src/wallet/MoneroWalletLocal");
const MoneroRpcError = require("../src/rpc/MoneroRpcError");
const BigInteger = require("../src/submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;

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
TestUtils.TEST_MNEMONIC = "dilute arrow koala gorilla loudly uttered bygones stockpile problems efficient alerts lordship sighting launching hire tycoon hence ultimate fetches napkin cube usage agony army efficient";
TestUtils.TEST_ADDRESS = "55PEGdaqz7iW3M4Puddfup1LumsrF2hHc4cQrVnFLVJ2eXexULWwYEUDRKHTRb6uouM9ybJs7GYcEXFht25jw3HZKHcULwp";

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

//TestUtils.DAEMON_RPC_CONFIG = {
//  uri: "http://node.xmrbackb.one:28081",
//  //user: "superuser",
//  //pass: "abctesting123",
//  maxRequestsPerSecond: 1
//};

module.exports = TestUtils;