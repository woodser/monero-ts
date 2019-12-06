'use strict';

module.exports = {
    MoneroDaemonRpc: require("./src/main/js/daemon/MoneroDaemonRpc"),
    MoneroWalletRpc: require("./src/main/js/wallet/MoneroWalletRpc"),
    MoneroWalletKeysPromise: require("./src/main/js/wallet/MoneroWalletKeys"),
    MoneroCppUtilsPromise: require("./src/main/js/utils/MoneroCppUtils")
};