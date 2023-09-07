export = MoneroBlockHeader;
/**
 * Models a Monero block header which contains information about the block.
 *
 * @class
 */
declare class MoneroBlockHeader {
    /**
     * Construct the model.
     *
     * @param {MoneroBlockHeader|object} state is existing state to initialize from (optional)
     */
    constructor(state: MoneroBlockHeader | object);
    state: any;
    copy(): MoneroBlockHeader;
    toJson(): any;
    getHash(): any;
    setHash(hash: any): this;
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
    getTimestamp(): any;
    setTimestamp(timestamp: any): this;
    getSize(): any;
    setSize(size: any): this;
    getWeight(): any;
    setWeight(weight: any): this;
    getLongTermWeight(): any;
    setLongTermWeight(longTermWeight: any): this;
    getDepth(): any;
    setDepth(depth: any): this;
    getDifficulty(): any;
    setDifficulty(difficulty: any): this;
    getCumulativeDifficulty(): any;
    setCumulativeDifficulty(cumulativeDifficulty: any): this;
    getMajorVersion(): any;
    setMajorVersion(majorVersion: any): this;
    getMinorVersion(): any;
    setMinorVersion(minorVersion: any): this;
    getNonce(): any;
    setNonce(nonce: any): this;
    getMinerTxHash(): any;
    setMinerTxHash(minerTxHash: any): this;
    getNumTxs(): any;
    setNumTxs(numTxs: any): this;
    getOrphanStatus(): any;
    setOrphanStatus(orphanStatus: any): this;
    getPrevHash(): any;
    setPrevHash(prevHash: any): this;
    getReward(): any;
    setReward(reward: any): this;
    getPowHash(): any;
    setPowHash(powHash: any): this;
    merge(header: any): this;
    toString(indent?: number): string;
}
