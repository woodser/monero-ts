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
  
  constructor(stats?: Partial<MoneroTxPoolStats>) {
    Object.assign(this, stats);
    if (this.feeTotal !== undefined && typeof this.feeTotal !== "bigint") this.feeTotal = BigInt(this.feeTotal);
    if (this.histo !== undefined && !(this.histo instanceof Map)) this.histo = new Map(JSON.parse(this.histo));
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (json.feeTotal) json.feeTotal = json.feeTotal.toString();
    if (json.histo) json.histo = JSON.stringify([...json.histo]); // convert map to array of key-value pairs then stringify
    return json;
  }
  
  getNumTxs(): number {
    return this.numTxs;
  }
  
  setNumTxs(numTxs: number): MoneroTxPoolStats {
    this.numTxs = numTxs;
    return this;
  }
  
  getNumNotRelayed(): number {
    return this.numNotRelayed;
  }
  
  setNumNotRelayed(numNotRelayed: number): MoneroTxPoolStats {
    this.numNotRelayed = numNotRelayed;
    return this;
  }
  
  getNumFailing(): number {
    return this.numFailing;
  }
  
  setNumFailing(numFailing: number): MoneroTxPoolStats {
    this.numFailing = numFailing;
    return this;
  }
  
  getNumDoubleSpends(): number {
    return this.numDoubleSpends;
  }
  
  setNumDoubleSpends(numDoubleSpends: number): MoneroTxPoolStats {
    this.numDoubleSpends = numDoubleSpends;
    return this;
  }
  
  getNum10m(): number {
    return this.num10m;
  }
  
  setNum10m(num10m): MoneroTxPoolStats {
    this.num10m = num10m;
    return this;
  }
  
  getFeeTotal(): bigint {
    return this.feeTotal;
  }
  
  setFeeTotal(feeTotal: bigint): MoneroTxPoolStats {
    this.feeTotal = feeTotal;
    return this;
  }
  
  getBytesMax(): number {
    return this.bytesMax;
  }
  
  setBytesMax(bytesMax: number): MoneroTxPoolStats {
    this.bytesMax = bytesMax;
    return this;
  }
  
  getBytesMed(): number {
    return this.bytesMed;
  }
  
  setBytesMed(bytesMed: number): MoneroTxPoolStats {
    this.bytesMed = bytesMed;
    return this;
  }
  
  getBytesMin(): number {
    return this.bytesMin;
  }
  
  setBytesMin(bytesMin: number): MoneroTxPoolStats {
    this.bytesMin = bytesMin;
    return this;
  }
  
  getBytesTotal(): number {
    return this.bytesTotal;
  }
  
  setBytesTotal(bytesTotal: number): MoneroTxPoolStats {
    this.bytesTotal = bytesTotal;
    return this;
  }
  
  getHisto(): Map<number, number> {
    return this.histo;
  }
  
  setHisto(histo: Map<number, number>): MoneroTxPoolStats {
    this.histo = histo;
    return this;
  }
  
  getHisto98pc(): number {
    return this.histo98pc;
  }
  
  setHisto98pc(histo98pc: number): MoneroTxPoolStats {
    this.histo98pc = histo98pc;
    return this;
  }
  
  getOldestTimestamp(): number {
    return this.oldestTimestamp;
  }
  
  setOldestTimestamp(oldestTimestamp: number): MoneroTxPoolStats {
    this.oldestTimestamp = oldestTimestamp;
    return this;
  }
}
