export = MoneroAltChain;
/**
 * Models an alternative chain seen by the node.
 */
declare class MoneroAltChain {
    constructor(state: any);
    state: any;
    toJson(): any;
    getBlockHashes(blockHashes: any): any;
    setBlockHashes(blockHashes: any): this;
    getDifficulty(): any;
    setDifficulty(difficulty: any): this;
    getHeight(): any;
    setHeight(height: any): this;
    getLength(): any;
    setLength(length: any): this;
    getMainChainParentBlockHash(): any;
    setMainChainParentBlockHash(mainChainParentBlockHash: any): this;
}
