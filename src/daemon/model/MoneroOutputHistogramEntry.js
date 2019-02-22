/**
 * Entry in a Monero output histogram (see get_output_histogram of Daemon RPC documentation).
 */
class MoneroOutputHistogramEntry {
  
  getAmount() {
    return this.amount;
  }
  
  setAmount(amount) {
    this.amount = amount;
    return this;
  }

  getNumInstances() {
    return this.numInstances;
  }

  setNumInstances(numInstances) {
    this.numInstances = numInstances;
    return this;
  }

  getNumUnlockedInstances() {
    return this.numUnlockedInstances;
  }

  setNumUnlockedInstances(numUnlockedInstances) {
    this.numUnlockedInstances = numUnlockedInstances;
    return this;
  }

  getNumRecentInstances() {
    return this.numRecentInstances;
  }

  setNumRecentInstances(numRecentInstances) {
    this.numRecentInstances = numRecentInstances;
    return this;
  }
}

module.exports = MoneroOutputHistogramEntry;