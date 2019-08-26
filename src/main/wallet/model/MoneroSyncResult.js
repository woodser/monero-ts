/**
 * Result from syncing a Monero wallet.
 */
class MoneroSyncResult {
  
  constructor(numBlocksFetched, receivedMoney) {
    this.setNumBlocksFetched(numBlocksFetched);
    this.setReceivedMoney(receivedMoney);
  }
  
  getNumBlocksFetched() {
    return this.numBlocksFetched;
  }
  
  setNumBlocksFetched(numBlocksFetched) {
    this.numBlocksFetched = numBlocksFetched;
    return this;
  }
  
  getReceivedMoney() {
    return this.receivedMoney;
  }
  
  setReceivedMoney(receivedMoney) {
    this.receivedMoney = receivedMoney;
    return this;
  }
}

module.exports = MoneroSyncResult;