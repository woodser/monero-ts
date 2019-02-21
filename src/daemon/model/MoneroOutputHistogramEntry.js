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

  getInstancesCount() {
    return this.instancesCount;
  }

  setInstancesCount(instancesCount) {
    this.instancesCount = instancesCount;
    return this;
  }

  getUnlockedInstancesCount() {
    return this.unlockedInstancesCount;
  }

  setUnlockedInstancesCount(unlockedInstancesCount) {
    this.unlockedInstancesCount = unlockedInstancesCount;
    return this;
  }

  getRecentInstancesCount() {
    return this.recentInstancesCount;
  }

  setRecentInstancesCount(recentInstancesCount) {
    this.recentInstancesCount = recentInstancesCount;
    return this;
  }
}

module.exports = MoneroOutputHistogramEntry;