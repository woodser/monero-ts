export = MoneroHardForkInfo;
/**
 * Monero hard fork info.
 */
declare class MoneroHardForkInfo {
    constructor(state: any);
    state: any;
    toJson(): any;
    getEarliestHeight(): any;
    setEarliestHeight(earliestHeight: any): this;
    isEnabled(): any;
    setIsEnabled(isEnabled: any): this;
    getState(): any;
    setState(state: any): this;
    getThreshold(): any;
    setThreshold(threshold: any): this;
    getVersion(): any;
    setVersion(version: any): this;
    getNumVotes(): any;
    setNumVotes(numVotes: any): this;
    getWindow(): any;
    setWindow(window: any): this;
    getVoting(): any;
    setVoting(voting: any): this;
    getCredits(): any;
    setCredits(credits: any): this;
    getTopBlockHash(): any;
    setTopBlockHash(topBlockHash: any): this;
}
