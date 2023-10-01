/**
 * Models an alternative chain seen by the node.
 */
export default class MoneroAltChain {
    blockHashes: string[];
    difficulty: bigint;
    height: number;
    length: number;
    mainChainParentBlockHash: string;
    constructor(altChain?: Partial<MoneroAltChain>);
    toJson(): any;
    getBlockHashes(): string[];
    setBlockHashes(blockHashes: string[]): MoneroAltChain;
    getDifficulty(): bigint;
    setDifficulty(difficulty: bigint): MoneroAltChain;
    getHeight(): number;
    setHeight(height: number): MoneroAltChain;
    getLength(): number;
    setLength(length: number): MoneroAltChain;
    getMainChainParentBlockHash(): string;
    setMainChainParentBlockHash(mainChainParentBlockHash: string): MoneroAltChain;
}
