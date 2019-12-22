'use strict'

// import all models
require("./src/main/js/MoneroModel")();

/**
 * External library exports.
 */
module.exports = {
  MoneroDaemonRpc: MoneroDaemonRpc,
  MoneroWalletRpc: MoneroWalletRpc,
  getMoneroUtilsWasm: getMoneroUtilsWasm,   // returns a promise
  getMoneroWalletKeys: getMoneroWalletKeys, // returns a promise
  getMoneroWalletCore: getMoneroWalletCore  // returns a promise
}