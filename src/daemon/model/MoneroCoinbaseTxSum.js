/**
 * Model for the summation of coinbase emissions and fees.
 */
class MoneroCoinbaseTxSum {
  
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

module.exports = MoneroCoinbaseTxSum;