/**
 * Result from syncing a Monero wallet.
 */
export default class MoneroSyncResult {

  numBlocksFetched: number;
  receivedMoney: bigint;
  
  constructor(numBlocksFetched: number, receivedMoney: bigint) {
    this.setNumBlocksFetched(numBlocksFetched);
    this.setReceivedMoney(receivedMoney);
  }
  
  getNumBlocksFetched(): number {
    return this.numBlocksFetched;
  }
  
  setNumBlocksFetched(numBlocksFetched: number): MoneroSyncResult {
    this.numBlocksFetched = numBlocksFetched;
    return this;
  }
  
  getReceivedMoney(): bigint {
    return this.receivedMoney;
  }
  
  setReceivedMoney(receivedMoney: bigint): MoneroSyncResult {
    this.receivedMoney = receivedMoney;
    return this;
  }
}
