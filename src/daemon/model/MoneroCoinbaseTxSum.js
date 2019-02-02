/**
 * Model for the summation of coinbase emissions and fees.
 */
class MoneroCoinbaseTxSum {
  
  getTotalEmission() {
    return this.totalEmission;
  }
  
  setTotalEmission(totalEmission) {
    this.totalEmission = totalEmission;
    return this;
  }
  
  getTotalFees() {
    return this.totalFees;
  }
  
  setTotalFees(totalFees) {
    this.totalFees = totalFees;
    return this;
  }
}

module.exports = MoneroCoinbaseTxSum;