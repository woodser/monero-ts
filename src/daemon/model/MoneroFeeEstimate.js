const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Monero fee estimate.
 * 
 * TODO: don't wrap this and other models with single field
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