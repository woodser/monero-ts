/**
 * Monero block template to mine.
 */
export default class MoneroBlockTemplate {
    blockTemplateBlob: string;
    blockHashingBlob: string;
    difficulty: bigint;
    expectedReward: bigint;
    height: number;
    prevId: string;
    reservedOffset: number;
    seedHeight: number;
    seedHash: string;
    nextSeedHash: string;
    constructor(template?: Partial<MoneroBlockTemplate>);
    toJson(): any;
    getBlockTemplateBlob(): string;
    setBlockTemplateBlob(blockTemplateBlob: string): MoneroBlockTemplate;
    getBlockHashingBlob(): string;
    setBlockHashingBlob(blockHashingBlob: string): MoneroBlockTemplate;
    getDifficulty(): bigint;
    setDifficulty(difficulty: bigint): MoneroBlockTemplate;
    getExpectedReward(): bigint;
    setExpectedReward(expectedReward: bigint): MoneroBlockTemplate;
    getHeight(): number;
    setHeight(height: number): MoneroBlockTemplate;
    getPrevHash(): string;
    setPrevHash(prevId: string): MoneroBlockTemplate;
    getReservedOffset(): number;
    setReservedOffset(reservedOffset: number): MoneroBlockTemplate;
    getSeedHeight(): number;
    setSeedHeight(seedHeight: number): MoneroBlockTemplate;
    getSeedHash(): string;
    setSeedHash(seedHash: string): MoneroBlockTemplate;
    getNextSeedHash(): string;
    setNextSeedHash(nextSeedHash: string): MoneroBlockTemplate;
}
