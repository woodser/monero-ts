const MoneroDaemonModel = require("./MoneroDaemonModel")

/**
 * Models transaction pool statistics.
 */
class MoneroTxPoolStats extends MoneroDaemonModel {
  
  getCount() {
    return this.count;
  }
  
  setCount(count) {
    this.count = count;
  }
  
  getNotRelayedCount() {
    return this.notRelayedCount;
  }
  
  setNotRelayedCount(notRelayedCount) {
    this.notRelayedCount = notRelayedCount;
  }
  
  getFailedCount() {
    return this.failedCount;
  }
  
  setFailedCount(failedCount) {
    this.failedCount = failedCount;
  }
  
  getDoubleSpendCount() {
    return this.doubleSpendCount;
  }
  
  setDoubleSpendCount(doubleSpendCount) {
    this.doubleSpendCount = doubleSpendCount;
  }
  
  getFeeTotal() {
    return this.feeTotal;
  }
  
  setFeeTotal(feeTotal) {
    this.feeTotal = feeTotal;
  }
  
  getBytesMax() {
    return this.bytesMax;
  }
  
  setBytesMax(bytesMax) {
    this.bytesMax = bytesMax;
  }
  
  getBytesMed() {
    return this.bytesMed;
  }
  
  setBytesMed(bytesMed) {
    this.bytesMed = bytesMed;
  }
  
  getBytesMin() {
    return this.bytesMin;
  }
  
  setBytesMin(bytesMin) {
    this.bytesMin = bytesMin;
  }
  
  getBytesTotal() {
    return this.bytesTotal;
  }
  
  setBytesTotal(bytesTotal) {
    this.bytesTotal = bytesTotal;
  }
  
  // TODO: histo... what?
  getHisto() {
    return this.histo;
  }
  
  setHisto(histo) {
    this.histo = histo;
  }
  
  getTime98pc() {
    return this.time98pc;
  }
  
  setTime98pc(time98pc) {
    this.time98pc = time98pc;
  }
  
  getTimeOldest() {
    return this.timeOldest;
  }
  
  setTimeOldest(timeOldest) {
    this.timeOldest = timeOldest;
  }
  
  getCount10m() {
    return this.count10m;
  }
  
  setCount10m(count10m) {
    this.count10m = count10m;
  }
}

module.exports = MoneroTxPoolStats;