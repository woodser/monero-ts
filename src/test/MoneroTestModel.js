/**
 * Export library test models.
 */
module.exports = function() {
  require("./utils/TestUtilsModule")();
  this.TestSampleCode = require("./TestSampleCode");
  this.TestMoneroUtils = require("./TestMoneroUtils");
  this.TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
  this.TestMoneroWalletRpc = require("./TestMoneroWalletRpc");
  this.TestMoneroWalletKeys = require("./TestMoneroWalletKeys");
  this.TestMoneroWalletWasm = require("./TestMoneroWalletWasm");
  this.TestDeveloperGuide = require("./TestDeveloperGuide");
}