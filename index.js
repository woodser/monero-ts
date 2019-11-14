'use strict';

module.exports = {
    MoneroDaemonRpc: require("./src/main/js/daemon/MoneroDaemonRpc"),
    MoneroWalletRpc: require("./src/main/js/wallet/MoneroWalletRpc"),
    MoneroWalletWasmPromise: require("./src/main/js/wallet/MoneroWalletWasm"),
    MoneroWalletLocal: require("./src/main/js/wallet/MoneroWalletLocal"),
    MoneroCppUtilsPromise: require("./src/main/js/utils/MoneroCppUtils")
};