const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Entry in a Monero output histogram (see get_output_histogram of Daemon RPC documentation).
 */
class MoneroOutputHistogramEntry extends MoneroDaemonModel {
  
  getAmount() {
    return this.amount;
  }
  
  setAmount(amount) {
    this.amount = amount;
  }

  getTotalInstances() {
    return this.totalInstances;
  }

  setTotalInstances(totalInstances) {
    this.totalInstances = totalInstances;
  }

  getUnlockedInstances() {
    return this.unlockedInstances;
  }

  setUnlockedInstances(unlockedInstances) {
    this.unlockedInstances = unlockedInstances;
  }

  getRecentInstances() {
    return this.recentInstances;
  }

  setRecentInstances(recentInstances) {
    this.recentInstances = recentInstances;
  }
}

module.exports = MoneroOutputHistogramEntry;