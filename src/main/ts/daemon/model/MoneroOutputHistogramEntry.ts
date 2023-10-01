/**
 * Entry in a Monero output histogram (see get_output_histogram of Daemon RPC documentation).
 */
export default class MoneroOutputHistogramEntry {

  amount: bigint;
  numInstances: number;
  numUnlockedInstances: number;
  numRecentInstances: number;
  
  constructor(entry?: MoneroOutputHistogramEntry) {
    Object.assign(this, entry);
    if (this.amount !== undefined && typeof this.amount !== "bigint") this.amount = BigInt(this.amount);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (json.amount !== undefined) json.amount = json.amount.toString();
    return json;
  }
  
  getAmount(): bigint {
    return this.amount;
  }
  
  setAmount(amount: bigint): MoneroOutputHistogramEntry {
    this.amount = amount;
    return this;
  }

  getNumInstances(): number {
    return this.numInstances;
  }

  setNumInstances(numInstances: number): MoneroOutputHistogramEntry {
    this.numInstances = numInstances;
    return this;
  }

  getNumUnlockedInstances(): number {
    return this.numUnlockedInstances;
  }

  setNumUnlockedInstances(numUnlockedInstances: number) {
    this.numUnlockedInstances = numUnlockedInstances;
    return this;
  }

  getNumRecentInstances(): number {
    return this.numRecentInstances;
  }

  setNumRecentInstances(numRecentInstances: number): MoneroOutputHistogramEntry {
    this.numRecentInstances = numRecentInstances;
    return this;
  }
}
