const assert = require("assert");
const MoneroRpcError = require("../src/rpc/MoneroRpcError");
const MoneroDaemonRpc = require("../src/daemon/MoneroDaemonRpc");
const MoneroWalletRpc = require("../src/wallet/MoneroWalletRpc");
const MoneroWalletLocal = require("../src/wallet/MoneroWalletLocal");

/**
 * Collection of test utilities and configurations.
 * 
 * TODO: move hard coded to config;
 */
class TestUtils {
  
  static getDaemonRpc(coreUtils) {
    if (this.daemonRpc === undefined) {
      this.daemonRpc = new MoneroDaemonRpc(Object.assign(TestUtils.DAEMON_RPC_CONFIG, { coreUtils: coreUtils }));
    }
    return this.daemonRpc;
  }
  
  static async getWalletRpc() {
    
    // check if wallet is already cached
    if (this.walletRpc) return this.walletRpc;
    
    // connect wallet to rpc endpoint
    this.walletRpc = new MoneroWalletRpc(TestUtils.WALLET_RPC_CONFIG);
    
    // create wallet if necessary
    try {
      await this.walletRpc.createWallet(TestUtils.WALLET_1_NAME, TestUtils.WALLET_1_PW, "English");
    } catch (e) {
      assert(e instanceof MoneroRpcError);
      assert.equal(-21, e.getCode()); // exception is ok if wallet already created
    }
    
    // open test wallet
    try {
      await this.walletRpc.openWallet(TestUtils.WALLET_1_NAME, TestUtils.WALLET_1_PW);
    } catch (e) {
      assert(e instanceof MoneroRpcError);
      assert.equal(-1, e.getCode()); // TODO (monero-wallet-rpc): -1: Failed to open wallet if wallet is already open; better code and message
    }
    
    // refresh wallet
    await this.walletRpc.rescanSpent();
    
    // returned cached wallet
    return this.walletRpc;
  }
  
  static getWalletLocal(coreUtils) {
    if (this.walletLocal === undefined) {
      let mnemonic = "nagged giddy virtual bias spying arsenic fowls hexagon oars frying lava dialect copy gasp utensils muffin tattoo ritual exotic inmate kisses either sprig sunken sprig";
      this.walletLocal = new MoneroWalletLocal({ daemon: this.getDaemonRpc(), coreUtils: coreUtils, mnemonic: mnemonic });
    }
    return this.walletLocal;
  }
}

// ---------------------------- STATIC TEST CONFIG ----------------------------

TestUtils.WALLET_1_NAME = "test_wallet_1";
TestUtils.WALLET_1_PW = "supersecretpassword123"
TestUtils.WALLET_2_NAME = "test_wallet_2";
TestUtils.WALLET_2_PW = "supersecretpassword123"
TestUtils.TEST_ADDRESS = "55AepZuUKYV7Wrf9BMiczAELg2gcZuWQsYmg4kXHGAiW8uhVC1VVhqA5HzFcePKhuNgS2d9ag5imvC1jxsJbbnHm5kF753Z";

// TODO: support URL
TestUtils.WALLET_RPC_CONFIG = {
  protocol: "http",
  host: "localhost",
  port: 38083,
  user: "rpc_user",
  pass: "abc123"
};

TestUtils.DAEMON_RPC_CONFIG = { 
  protocol: "http",
  host: "localhost",
  port: 38081,
  user: "superuser",
  pass: "abctesting123",
};

//TestUtils.DAEMON_RPC_CONFIG = { 
//  protocol: "http",
//  host: "node.xmrbackb.one",
//  port: 38081,
//  //user: "superuser",
//  //pass: "abctesting123",
//};

module.exports = TestUtils;