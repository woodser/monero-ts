/**
 * Model for the summation of miner emissions and fees.
 */
class MoneroMinerTxSum {
  
  constructor() {
    this.state = {};
  }
  
  getEmissionSum() {
    return this.state.emissionSum;
  }
  
  setEmissionSum(emissionSum) {
    this.state.emissionSum = emissionSum;
    return this;
  }
  
  getFeeSum() {
    return this.state.feeSum;
  }
  
  setFeeSum(feeSum) {
    this.state.feeSum = feeSum;
    return this;
  }
}

module.exports = MoneroMinerTxSum;