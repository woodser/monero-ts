/**
 * Export library test models.
 */
module.exports = function() {
  require("./utils/TestUtilsModule")();
  this.TestMoneroUtils = require("./TestMoneroUtils");
  this.TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
}