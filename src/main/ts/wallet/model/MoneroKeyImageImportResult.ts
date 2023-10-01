/**
 * Models results from importing key images.
 */
export default class MoneroKeyImageImportResult {

  height: number;
  spentAmount: bigint;
  unspentAmount: bigint;
  
  constructor(result?: Partial<MoneroKeyImageImportResult>) {
    Object.assign(this, result);
    if (this.spentAmount !== undefined && typeof this.spentAmount !== "bigint") this.spentAmount = BigInt(this.spentAmount);
    if (this.unspentAmount !== undefined && typeof this.unspentAmount !== "bigint") this.unspentAmount = BigInt(this.unspentAmount);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (this.getSpentAmount() !== undefined) json.spentAmount = this.getSpentAmount().toString();
    if (this.getUnspentAmount() !== undefined) json.unspentAmount = this.getUnspentAmount().toString();
    return json;
  }
  
  getHeight(): number {
    return this.height;
  }
  
  setHeight(height: number): MoneroKeyImageImportResult {
    this.height = height;
    return this;
  }
  
  getSpentAmount(): bigint {
    return this.spentAmount;
  }
  
  setSpentAmount(spentAmount: bigint): MoneroKeyImageImportResult {
    this.spentAmount = spentAmount;
    return this;
  }
  
  getUnspentAmount(): bigint {
    return this.unspentAmount;
  }
  
  setUnspentAmount(unspentAmount: bigint): MoneroKeyImageImportResult {
    this.unspentAmount = unspentAmount;
    return this;
  }
}
