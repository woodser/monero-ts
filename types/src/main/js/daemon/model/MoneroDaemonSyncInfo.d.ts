export = MoneroDaemonSyncInfo;
/**
 * Models daemon synchronization information.
 */
declare class MoneroDaemonSyncInfo {
    constructor(state: any);
    state: any;
    toJson(): any;
    getHeight(): any;
    setHeight(height: any): this;
    getPeers(): any;
    setPeers(peers: any): this;
    getSpans(): any;
    setSpans(spans: any): this;
    getTargetHeight(): any;
    setTargetHeight(targetHeight: any): this;
    getNextNeededPruningSeed(): any;
    setNextNeededPruningSeed(nextNeededPruningSeed: any): this;
    getOverview(): any;
    setOverview(overview: any): this;
    getCredits(): any;
    setCredits(credits: any): this;
    getTopBlockHash(): any;
    setTopBlockHash(topBlockHash: any): this;
}
