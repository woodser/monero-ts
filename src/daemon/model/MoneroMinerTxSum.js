/**
 * Model for the summation of miner emissions and fees.
 */
class MoneroMinerTxSum {
  
  getEmissionSum() {
    return this.emissionSum;
  }
  
  setEmissionSum(emissionSum) {
    this.emissionSum = emissionSum;
    return this;
  }
  
  getFeeSum() {
    return this.feeSum;
  }
  
  setFeeSum(feeSum) {
    this.feeSum = feeSum;
    return this;
  }
}

module.exports = MoneroMinerTxSum;