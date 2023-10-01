/**
 * Models an alternative chain seen by the node.
 */
export default class MoneroAltChain {

  blockHashes: string[];
  difficulty: bigint;
  height: number;
  length: number;
  mainChainParentBlockHash: string;
  
  constructor(altChain?: Partial<MoneroAltChain>) {
    Object.assign(this, altChain);
    if (this.difficulty !== undefined && typeof this.difficulty !== "bigint") this.difficulty = BigInt(this.difficulty);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (this.getDifficulty() !== undefined) json.difficulty = this.getDifficulty().toString();
    return json;
  }
  
  getBlockHashes(): string[] {
    return this.blockHashes;
  }
  
  setBlockHashes(blockHashes: string[]): MoneroAltChain {
    this.blockHashes = blockHashes;
    return this;
  }
  
  getDifficulty(): bigint {
    return this.difficulty;
  }
  
  setDifficulty(difficulty: bigint): MoneroAltChain {
    this.difficulty = difficulty;
    return this;
  }
  
  getHeight(): number {
    return this.height;
  }
  
  setHeight(height: number): MoneroAltChain {
    this.height = height;
    return this;
  }
  
  getLength(): number {
    return this.length;
  }
  
  setLength(length: number): MoneroAltChain {
    this.length = length;
    return this;
  }
  
  getMainChainParentBlockHash(): string {
    return this.mainChainParentBlockHash;
  }
  
  setMainChainParentBlockHash(mainChainParentBlockHash: string): MoneroAltChain {
    this.mainChainParentBlockHash = mainChainParentBlockHash;
    return this;
  }
}
