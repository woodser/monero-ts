'use strict'

// import all models
require("./src/main/js/MoneroModel")();

/**
 * External library exports.
 */
module.exports = {
  MoneroDaemonRpc: MoneroDaemonRpc,
  MoneroWalletRpc: MoneroWalletRpc,
  MoneroWalletKeys: MoneroWalletKeys,
  MoneroWalletCore: MoneroWalletCore,
  getMoneroUtilsWasm: getMoneroUtilsWasm   // returns a promise
}