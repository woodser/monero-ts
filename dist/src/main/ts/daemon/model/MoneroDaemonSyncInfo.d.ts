import MoneroConnectionSpan from "./MoneroConnectionSpan";
import MoneroPeer from "./MoneroPeer";
/**
 * Models daemon synchronization information.
 */
export default class MoneroDaemonSyncInfo {
    height: number;
    peers: MoneroPeer[];
    spans: MoneroConnectionSpan[];
    targetHeight: number;
    nextNeededPruningSeed: number;
    overview: string;
    credits: bigint;
    topBlockHash: string;
    constructor(info?: Partial<MoneroDaemonSyncInfo>);
    toJson(): any;
    getHeight(): number;
    setHeight(height: number): MoneroDaemonSyncInfo;
    getPeers(): MoneroPeer[];
    setPeers(peers: MoneroPeer[]): MoneroDaemonSyncInfo;
    getSpans(): MoneroConnectionSpan[];
    setSpans(spans: MoneroConnectionSpan[]): MoneroDaemonSyncInfo;
    getTargetHeight(): number;
    setTargetHeight(targetHeight: number): MoneroDaemonSyncInfo;
    getNextNeededPruningSeed(): number;
    setNextNeededPruningSeed(nextNeededPruningSeed: number): MoneroDaemonSyncInfo;
    getOverview(): string;
    setOverview(overview: string): MoneroDaemonSyncInfo;
    getCredits(): bigint;
    setCredits(credits: bigint): MoneroDaemonSyncInfo;
    getTopBlockHash(): string;
    setTopBlockHash(topBlockHash: string): MoneroDaemonSyncInfo;
}
