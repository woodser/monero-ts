/**
 * Result of pruning the blockchain.
 */
export default class MoneroPruneResult {
    isPruned: boolean;
    pruningSeed: number;
    constructor(result?: Partial<MoneroPruneResult>);
    toJson(): any;
    getIsPruned(): boolean;
    setIsPruned(isPruned: boolean): MoneroPruneResult;
    getPruningSeed(): number;
    setPruningSeed(pruningSeed: number): MoneroPruneResult;
}
