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

  getTotalInstances() {
    return this.totalInstances;
  }

  setTotalInstances(totalInstances) {
    this.totalInstances = totalInstances;
    return this;
  }

  getUnlockedInstances() {
    return this.unlockedInstances;
  }

  setUnlockedInstances(unlockedInstances) {
    this.unlockedInstances = unlockedInstances;
    return this;
  }

  getRecentInstances() {
    return this.recentInstances;
  }

  setRecentInstances(recentInstances) {
    this.recentInstances = recentInstances;
    return this;
  }
}

module.exports = MoneroOutputHistogramEntry;