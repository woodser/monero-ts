const MoneroDaemonRpc = require("../src/daemon/MoneroDaemonRpc");
const MoneroWalletRpc = require("../src/wallet/MoneroWalletRpc");
const MoneroWalletLocal = require("../src/wallet/MoneroWalletLocal");

/**
 * Collection of test utilities and configurations.
 */
class TestUtils {
  
  static getDaemonRpc(coreUtils) {
    if (this.daemonRpc === undefined) this.daemonRpc = new MoneroDaemonRpc({ port: 38081, user: "superuser", pass: "abctesting123", protocol: "http", coreUtils: coreUtils });
    return this.daemonRpc;
  }
  
  static getWalletRpc() {
    if (this.walletRpc === undefined) this.walletRpc = new MoneroWalletRpc(); // TODO: host info
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