export = MoneroBlockTemplate;
/**
 * Monero block template to mine.
 */
declare class MoneroBlockTemplate {
    constructor(state: any);
    state: any;
    toJson(): any;
    getBlockTemplateBlob(): any;
    setBlockTemplateBlob(blockTemplateBlob: any): this;
    getBlockHashingBlob(): any;
    setBlockHashingBlob(blockHashingBlob: any): this;
    getDifficulty(): any;
    setDifficulty(difficulty: any): this;
    getExpectedReward(): any;
    setExpectedReward(expectedReward: any): this;
    getHeight(): any;
    setHeight(height: any): this;
    getPrevHash(): any;
    setPrevHash(prevId: any): this;
    getReservedOffset(): any;
    setReservedOffset(reservedOffset: any): this;
    getSeedHeight(): any;
    setSeedHeight(seedHeight: any): this;
    getSeedHash(): any;
    setSeedHash(seedHash: any): this;
    getNextSeedHash(): any;
    setNextSeedHash(nextSeedHash: any): this;
}
