const MoneroDaemonRpc = require("../src/daemon/MoneroDaemonRpc");
const MoneroWalletLocal = require("../src/wallet/MoneroWalletLocal");

/**
 * Collection of test utilities and configurations.
 */
class TestUtils {
  
  static getDaemonRpc() {
    if (this.daemonRpc === undefined) this.daemonRpc = new MoneroDaemonRpc({ port: 38081, user: "superuser", pass: "abctesting123", protocol: "http" });
    return this.daemonRpc;
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