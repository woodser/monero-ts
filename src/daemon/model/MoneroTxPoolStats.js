/**
 * Models transaction pool statistics.
 */
class MoneroTxPoolStats {
  
  getNumTxs() {
    return this.numTxs;
  }
  
  setNumTxs(numTxs) {
    this.numTxs = numTxs;
    return this;
  }
  
  getNumNotRelayed() {
    return this.numNotRelayed;
  }
  
  setNumNotRelayed(numNotRelayed) {
    this.numNotRelayed = numNotRelayed;
    return this;
  }
  
  getNumFailing() {
    return this.numFailing;
  }
  
  setNumFailing(numFailing) {
    this.numFailing = numFailing;
    return this;
  }
  
  getNumDoubleSpends() {
    return this.numDoubleSpends;
  }
  
  setNumDoubleSpends(numDoubleSpends) {
    this.numDoubleSpends = numDoubleSpends;
    return this;
  }
  
  getNum10m() {
    return this.num10m;
  }
  
  setNum10m(num10m) {
    this.num10m = num10m;
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
  
  getHisto98pc() {
    return this.histo98pc;
  }
  
  setHisto98pc(histo98pc) {
    this.histo98pc = histo98pc;
    return this;
  }
  
  getOldestTimestamp() {
    return this.oldestTimestamp;
  }
  
  setOldestTimestamp(oldestTimestamp) {
    this.oldestTimestamp = oldestTimestamp;
    return this;
  }
}

module.exports = MoneroTxPoolStats;