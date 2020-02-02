/**
 * Export library test models.
 */
module.exports = function() {
  require("./utils/TestUtilsModule")();
  this.TestMoneroUtils = require("./TestMoneroUtils");
  this.TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
  this.TestMoneroWalletRpc = require("./TestMoneroWalletRpc");
  this.TestMoneroWalletKeys = require("./TestMoneroWalletRpc");
  this.TestMoneroWalletCore = require("./TestMoneroWalletRpc");
}