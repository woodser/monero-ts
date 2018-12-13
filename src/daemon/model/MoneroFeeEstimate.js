const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Monero fee estimate.
 */
class MoneroFeeEstimate extends MoneroDaemonModel {
  
  getFeeEstimate() {
    return this.feeEstimate;
  }

  setFeeEstimate(feeEstimate) {
    this.feeEstimate = feeEstimate;
  }
}

module.exports = MoneroFeeEstimate;