/**
 * Monero hard fork info.
 */
export default class MoneroHardForkInfo {
    earliestHeight: number;
    isEnabled: boolean;
    state: string;
    threshold: number;
    version: number;
    numVotes: number;
    window: number;
    voting: number;
    credits: bigint;
    topBlockHash: string;
    constructor(info?: Partial<MoneroHardForkInfo>);
    toJson(): any;
    getEarliestHeight(): number;
    setEarliestHeight(earliestHeight: number): MoneroHardForkInfo;
    getIsEnabled(): boolean;
    setIsEnabled(isEnabled: boolean): MoneroHardForkInfo;
    getState(): string;
    setState(state: string): MoneroHardForkInfo;
    getThreshold(): number;
    setThreshold(threshold: number): MoneroHardForkInfo;
    getVersion(): number;
    setVersion(version: number): MoneroHardForkInfo;
    getNumVotes(): number;
    setNumVotes(numVotes: number): MoneroHardForkInfo;
    getWindow(): number;
    setWindow(window: number): MoneroHardForkInfo;
    getVoting(): number;
    setVoting(voting: number): MoneroHardForkInfo;
    getCredits(): bigint;
    setCredits(credits: bigint): MoneroHardForkInfo;
    getTopBlockHash(): string;
    setTopBlockHash(topBlockHash: string): MoneroHardForkInfo;
}
