/**
 * Result of pruning the blockchain.
 */
export default class MoneroPruneResult {

  isPruned: boolean;
  pruningSeed: number;
  
  constructor(result?: Partial<MoneroPruneResult>) {
    Object.assign(this, result);
  }
  
  toJson(): any {
    let json = Object.assign({}, this);
    if (this.getIsPruned()) json.isPruned = this.getIsPruned();
    if (this.getPruningSeed()) json.pruningSeed = this.getPruningSeed();
    return json;
  }
  
  getIsPruned(): boolean {
    return this.isPruned;
  }
  
  setIsPruned(isPruned: boolean): MoneroPruneResult {
    this.isPruned = isPruned;
    return this;
  }
  
  getPruningSeed(): number {
    return this.pruningSeed;
  }
  
  setPruningSeed(pruningSeed: number): MoneroPruneResult {
    this.pruningSeed = pruningSeed;
    return this;
  }
}
