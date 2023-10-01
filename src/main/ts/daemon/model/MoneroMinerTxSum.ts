/**
 * Model for the summation of miner emissions and fees.
 */
export default class MoneroMinerTxSum {

  emissionSum: bigint;
  feeSum: bigint;
  
  constructor(txSum?: Partial<MoneroMinerTxSum>) {
    Object.assign(this, txSum);

    // deserialize bigints
    if (this.emissionSum !== undefined && typeof this.emissionSum !== "bigint") this.emissionSum = BigInt(this.emissionSum);
    if (this.feeSum !== undefined && typeof this.feeSum !== "bigint") this.feeSum = BigInt(this.feeSum);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (this.getEmissionSum() !== undefined) json.emissionSum = this.getEmissionSum().toString();
    if (this.getFeeSum() !== undefined) json.feeSum = this.getFeeSum().toString();
    return json;
  }
  
  getEmissionSum(): bigint {
    return this.emissionSum;
  }
  
  setEmissionSum(emissionSum: bigint): MoneroMinerTxSum {
    this.emissionSum = emissionSum;
    return this;
  }
  
  getFeeSum(): bigint {
    return this.feeSum;
  }
  
  setFeeSum(feeSum: bigint): MoneroMinerTxSum {
    this.feeSum = feeSum;
    return this;
  }
}