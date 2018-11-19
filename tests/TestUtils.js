const assert = require("assert");
const MoneroRpcError = require("../src/rpc/MoneroRpcError");
const MoneroDaemonRpc = require("../src/daemon/MoneroDaemonRpc");
const MoneroWalletRpc = require("../src/wallet/MoneroWalletRpc");
const MoneroWalletLocal = require("../src/wallet/MoneroWalletLocal");

let defaultDaemonRpc = {
    
}

/**
 * Collection of test utilities and configurations.
 * 
 * TODO: move hard coded to config
 */
class TestUtils {
  
  static getDaemonRpc(coreUtils) {
    if (this.daemonRpc === undefined) {
      this.daemonRpc = new MoneroDaemonRpc({ 
        protocol: "http",
        host: "localhost",
        port: 38081,
        user: "superuser",
        pass: "abctesting123",
        coreUtils: coreUtils
      });
    }
    return this.daemonRpc;
  }
  
  static getWalletRpc() {
    
    // check if wallet is already cached
    if (this.walletRpc) return this.walletRpc;
    
    let walletName = "test_wallet_1";
    let walletPassword = "supersecretpassword123";
    
    // connect wallet to rpc endpoint
    this.walletRpc = new MoneroWalletRpc({
      protocol: "http",
      host: "localhost",
      port: 38083,
      user: "rpc_user",
      pass: "abc123"
    });
    
    // create wallet if necessary
    try {
      this.walletRpc.createWallet(walletName, walletPassword, "English");
    } catch (e) {
      assert(e instanceof MoneroRpcError);
      assert.equal(-21, e.getRpcCode()); // exception is ok if wallet already created
    }
    
    // open test wallet
    try {
      this.walletRpc.openWallet(walletName, walletPassword);
    } catch (e) {
      assert.equal(-1, e.getRpcCode()); // TODO (monero-wallet-rpc): -1: Failed to open wallet if wallet is already open; better code and message
    }
    
    // refresh wallet
    this.walletRpc.rescanSpent();
    
    // returned cached wallet
    return this.walletRpc;
  }
  
  static getWalletLocal(coreUtils) {
    if (this.walletLocal === undefined) {
      let mnemonic = "nagged giddy virtual bias spying arsenic fowls hexagon oars frying lava dialect copy gasp utensils muffin tattoo ritual exotic inmate kisses either sprig sunken sprig";
      this.walletLocal = new MoneroWalletLocal(this.getDaemonRpc(), coreUtils, mnemonic);
    }
    return this.walletLocal;
  }
}

module.exports = TestUtils;