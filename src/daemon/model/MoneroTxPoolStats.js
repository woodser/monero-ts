/**
 * Models transaction pool statistics.
 */
class MoneroTxPoolStats {
  
  getCount() {
    return this.count;
  }
  
  setCount(count) {
    this.count = count;
    return this;
  }
  
  getNotRelayedCount() {
    return this.notRelayedCount;
  }
  
  setNotRelayedCount(notRelayedCount) {
    this.notRelayedCount = notRelayedCount;
    return this;
  }
  
  getFailedCount() {
    return this.failedCount;
  }
  
  setFailedCount(failedCount) {
    this.failedCount = failedCount;
    return this;
  }
  
  getDoubleSpendCount() {
    return this.doubleSpendCount;
  }
  
  setDoubleSpendCount(doubleSpendCount) {
    this.doubleSpendCount = doubleSpendCount;
    return this;
  }
  
  getFeeTotal() {
    return this.feeTotal;
  }
  
  setFeeTotal(feeTotal) {
    this.feeTotal = feeTotal;
    return this;
  }
  
  getBytesMax() {
    return this.bytesMax;
  }
  
  setBytesMax(bytesMax) {
    this.bytesMax = bytesMax;
    return this;
  }
  
  getBytesMed() {
    return this.bytesMed;
  }
  
  setBytesMed(bytesMed) {
    this.bytesMed = bytesMed;
    return this;
  }
  
  getBytesMin() {
    return this.bytesMin;
  }
  
  setBytesMin(bytesMin) {
    this.bytesMin = bytesMin;
    return this;
  }
  
  getBytesTotal() {
    return this.bytesTotal;
  }
  
  setBytesTotal(bytesTotal) {
    this.bytesTotal = bytesTotal;
    return this;
  }
  
  // TODO: histo... what?
  getHisto() {
    return this.histo;
  }
  
  setHisto(histo) {
    this.histo = histo;
    return this;
  }
  
  getTime98pc() {
    return this.time98pc;
  }
  
  setTime98pc(time98pc) {
    this.time98pc = time98pc;
    return this;
  }
  
  getTimeOldest() {
    return this.timeOldest;
  }
  
  setTimeOldest(timeOldest) {
    this.timeOldest = timeOldest;
    return this;
  }
  
  getCount10m() {
    return this.count10m;
  }
  
  setCount10m(count10m) {
    this.count10m = count10m;
    return this;
  }
}

module.exports = MoneroTxPoolStats;