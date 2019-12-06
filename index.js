'use strict';

module.exports = {
    MoneroDaemonRpc: require("./src/main/js/daemon/MoneroDaemonRpc"),
    MoneroWalletRpc: require("./src/main/js/wallet/MoneroWalletRpc"),
    getMoneroUtilsWasm: require("./src/main/js/utils/MoneroUtilsWasm"),     // returns a promise
    getMoneroWalletKeys: require("./src/main/js/wallet/MoneroWalletKeys"),  // returns a promise
};