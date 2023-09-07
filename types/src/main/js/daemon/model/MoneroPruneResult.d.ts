export = MoneroPruneResult;
/**
 * Result of pruning the blockchain.
 */
declare class MoneroPruneResult {
    constructor(state: any);
    state: any;
    toJson(): any;
    isPruned(): any;
    setIsPruned(isPruned: any): this;
    getPruningSeed(): any;
    setPruningSeed(pruningSeed: any): this;
}
