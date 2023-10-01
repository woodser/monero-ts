/**
 * Result from syncing a Monero wallet.
 */
export default class MoneroSyncResult {
    numBlocksFetched: number;
    receivedMoney: bigint;
    constructor(numBlocksFetched: number, receivedMoney: bigint);
    getNumBlocksFetched(): number;
    setNumBlocksFetched(numBlocksFetched: number): MoneroSyncResult;
    getReceivedMoney(): bigint;
    setReceivedMoney(receivedMoney: bigint): MoneroSyncResult;
}
