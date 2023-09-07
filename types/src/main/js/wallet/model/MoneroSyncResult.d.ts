export = MoneroSyncResult;
/**
 * Result from syncing a Monero wallet.
 */
declare class MoneroSyncResult {
    constructor(numBlocksFetched: any, receivedMoney: any);
    getNumBlocksFetched(): any;
    setNumBlocksFetched(numBlocksFetched: any): this;
    numBlocksFetched: any;
    getReceivedMoney(): any;
    setReceivedMoney(receivedMoney: any): this;
    receivedMoney: any;
}
