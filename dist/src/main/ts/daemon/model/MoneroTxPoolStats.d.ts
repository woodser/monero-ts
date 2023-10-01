/**
 * Models transaction pool statistics.
 */
export default class MoneroTxPoolStats {
    numTxs: number;
    numNotRelayed: number;
    numFailing: number;
    numDoubleSpends: number;
    num10m: number;
    feeTotal: bigint;
    bytesMax: number;
    bytesMed: number;
    bytesMin: number;
    bytesTotal: number;
    histo: Map<number, number>;
    histo98pc: number;
    oldestTimestamp: number;
    constructor(stats?: Partial<MoneroTxPoolStats>);
    toJson(): any;
    getNumTxs(): number;
    setNumTxs(numTxs: number): MoneroTxPoolStats;
    getNumNotRelayed(): number;
    setNumNotRelayed(numNotRelayed: number): MoneroTxPoolStats;
    getNumFailing(): number;
    setNumFailing(numFailing: number): MoneroTxPoolStats;
    getNumDoubleSpends(): number;
    setNumDoubleSpends(numDoubleSpends: number): MoneroTxPoolStats;
    getNum10m(): number;
    setNum10m(num10m: any): MoneroTxPoolStats;
    getFeeTotal(): bigint;
    setFeeTotal(feeTotal: bigint): MoneroTxPoolStats;
    getBytesMax(): number;
    setBytesMax(bytesMax: number): MoneroTxPoolStats;
    getBytesMed(): number;
    setBytesMed(bytesMed: number): MoneroTxPoolStats;
    getBytesMin(): number;
    setBytesMin(bytesMin: number): MoneroTxPoolStats;
    getBytesTotal(): number;
    setBytesTotal(bytesTotal: number): MoneroTxPoolStats;
    getHisto(): Map<number, number>;
    setHisto(histo: Map<number, number>): MoneroTxPoolStats;
    getHisto98pc(): number;
    setHisto98pc(histo98pc: number): MoneroTxPoolStats;
    getOldestTimestamp(): number;
    setOldestTimestamp(oldestTimestamp: number): MoneroTxPoolStats;
}
