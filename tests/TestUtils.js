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
   * Get a local wallet singleton instance shared among tests.
   */
  static getWalletLocal() {
    if (this.walletLocal === undefined) this.walletLocal = new MoneroWalletLocal(TestUtils.WALLET_LOCAL_CONFIG);
    return this.walletLocal;
  }
  
  /**
   * Get a daemon RPC singletoninstance shared among tests.
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
      assert.equal(-21, e.getRpcCode()); // exception is ok if wallet already created
    }
    
    // open rpc wallet file
    try {
      await this.walletRpc.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_RPC_PW_1);
    } catch (e) {
      if (!(e instanceof MoneroRpcError)) throw e;
      assert.equal(-1, e.getRpcCode()); // TODO (monero-wallet-rpc): -1: Failed to open wallet if wallet is already open; better code and message
    }
    
    // refresh wallet
    try {
      await this.walletRpc.rescanSpent();
    } catch (e) {
      assert.equal(-38, e.getRpcCode());  // TODO: (monero-wallet-rpc) sometimes getting -38: no connection to daemon on rescan call (after above calls) which causes mocha "before all" hook problem
      console.log("WARNING: received -38: no connection to daemon on rescan call after create/open, ignoring...");
    }
  }
  
  static testUnsignedBigInteger(num, nonZero) {
    assert(num);
    assert(num instanceof BigInteger);
    assert(num.toJSValue() >= 0);
    if (nonZero) assert(num.toJSValue() > 0);
  }
}

// ---------------------------- STATIC TEST CONFIG ----------------------------

// TODO: export these to key/value properties file for tests
// TODO: in properties, define {network: stagnet, network_configs: { stagnet: { daemonRpc: { host: _, port: _ ... etc

TestUtils.MAX_FEE = new BigInteger(7500000).multiply(new BigInteger(10000));

// default keypair to test
TestUtils.TEST_MNEMONIC = "nagged giddy virtual bias spying arsenic fowls hexagon oars frying lava dialect copy gasp utensils muffin tattoo ritual exotic inmate kisses either sprig sunken sprig";
TestUtils.TEST_ADDRESS = "59aZULsUF3YNSKGiHz4JPMfjGYkm1S4TB3sPsTr3j85HhXb9crZqGa7jJ8cA87U48kT5wzi2VzGZnN2PKojEwoyaHqtpeZh";

// default wallet RPC configuration
// TODO: support URL
TestUtils.WALLET_RPC_CONFIG = {
  protocol: "http",
  host: "localhost",
  port: 38083,
  user: "rpc_user",
  pass: "abc123",
  requestsPerSecond: 500
};

// wallet rpc wallet filenames and passwords
TestUtils.WALLET_RPC_NAME_1 = "test_wallet_1";
TestUtils.WALLET_RPC_NAME_2 = "test_wallet_2";
TestUtils.WALLET_RPC_PW_1 = "supersecretpassword123"
TestUtils.WALLET_RPC_PW_2 = "supersecretpassword123"

// default daemon RPC configuration
TestUtils.DAEMON_RPC_CONFIG = { 
  protocol: "http",
  host: "localhost",
  port: 38081,
  user: "superuser",
  pass: "abctesting123",
  requestsPerSecond: 500
};

// local wallet config
TestUtils.WALLET_LOCAL_CONFIG = {
  daemon: TestUtils.getDaemonRpc(),
  mnemonic: TestUtils.TEST_MNEMONIC
}

//TestUtils.DAEMON_RPC_CONFIG = { 
//  protocol: "http",
//  host: "node.xmrbackb.one",
//  port: 38081,
//  //user: "superuser",
//  //pass: "abctesting123",
//  requestsPerSecond: 1
//};

module.exports = TestUtils;