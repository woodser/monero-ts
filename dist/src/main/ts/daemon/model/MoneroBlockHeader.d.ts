/**
 * Models a Monero block header which contains information about the block.
 */
export default class MoneroBlockHeader {
    hash: string;
    height: number;
    timestamp: number;
    size: number;
    weight: number;
    longTermWeight: number;
    depth: number;
    difficulty: bigint;
    cumulativeDifficulty: bigint;
    majorVersion: number;
    minorVersion: number;
    nonce: number;
    minerTxHash: string;
    numTxs: number;
    orphanStatus: boolean;
    prevHash: string;
    reward: bigint;
    powHash: string;
    constructor(header?: Partial<MoneroBlockHeader>);
    copy(): MoneroBlockHeader;
    toJson(): any;
    getHash(): string;
    setHash(hash: string): this;
    /**
     * Return the block's height which is the total number of blocks that have occurred before.
     *
     * @return {number} the block's height
     */
    getHeight(): number;
    /**
     * Set the block's height which is the total number of blocks that have occurred before.
     *
     * @param {number} height is the block's height to set
     * @return {MoneroBlockHeader} a reference to this header for chaining
     */
    setHeight(height: number): MoneroBlockHeader;
    getTimestamp(): number;
    setTimestamp(timestamp: any): MoneroBlockHeader;
    getSize(): number;
    setSize(size: number): MoneroBlockHeader;
    getWeight(): number;
    setWeight(weight: number): MoneroBlockHeader;
    getLongTermWeight(): number;
    setLongTermWeight(longTermWeight: number): MoneroBlockHeader;
    getDepth(): number;
    setDepth(depth: number): MoneroBlockHeader;
    getDifficulty(): bigint;
    setDifficulty(difficulty: bigint): MoneroBlockHeader;
    getCumulativeDifficulty(): bigint;
    setCumulativeDifficulty(cumulativeDifficulty: bigint): MoneroBlockHeader;
    getMajorVersion(): number;
    setMajorVersion(majorVersion: number): MoneroBlockHeader;
    getMinorVersion(): number;
    setMinorVersion(minorVersion: number): MoneroBlockHeader;
    getNonce(): number;
    setNonce(nonce: number): MoneroBlockHeader;
    getMinerTxHash(): string;
    setMinerTxHash(minerTxHash: string): MoneroBlockHeader;
    getNumTxs(): number;
    setNumTxs(numTxs: number): MoneroBlockHeader;
    getOrphanStatus(): boolean;
    setOrphanStatus(orphanStatus: boolean): MoneroBlockHeader;
    getPrevHash(): string;
    setPrevHash(prevHash: string): MoneroBlockHeader;
    getReward(): bigint;
    setReward(reward: bigint): MoneroBlockHeader;
    getPowHash(): string;
    setPowHash(powHash: string): MoneroBlockHeader;
    merge(header: MoneroBlockHeader): MoneroBlockHeader;
    toString(indent?: number): string;
}
