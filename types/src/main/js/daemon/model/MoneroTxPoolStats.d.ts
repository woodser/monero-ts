export = MoneroTxPoolStats;
/**
 * Models transaction pool statistics.
 */
declare class MoneroTxPoolStats {
    constructor(state: any);
    state: any;
    toJson(): any;
    getNumTxs(): any;
    setNumTxs(numTxs: any): this;
    getNumNotRelayed(): any;
    setNumNotRelayed(numNotRelayed: any): this;
    getNumFailing(): any;
    setNumFailing(numFailing: any): this;
    getNumDoubleSpends(): any;
    setNumDoubleSpends(numDoubleSpends: any): this;
    getNum10m(): any;
    setNum10m(num10m: any): this;
    getFeeTotal(): any;
    setFeeTotal(feeTotal: any): this;
    getBytesMax(): any;
    setBytesMax(bytesMax: any): this;
    getBytesMed(): any;
    setBytesMed(bytesMed: any): this;
    getBytesMin(): any;
    setBytesMin(bytesMin: any): this;
    getBytesTotal(): any;
    setBytesTotal(bytesTotal: any): this;
    getHisto(): any;
    setHisto(histo: any): this;
    getHisto98pc(): any;
    setHisto98pc(histo98pc: any): this;
    getOldestTimestamp(): any;
    setOldestTimestamp(oldestTimestamp: any): this;
}
