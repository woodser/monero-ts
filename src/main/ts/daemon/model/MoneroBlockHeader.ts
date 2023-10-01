import assert from "assert";
import GenUtils from "../../common/GenUtils";

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
  
  constructor(header?: Partial<MoneroBlockHeader>) {
    Object.assign(this, header);

    // deserialize bigints
    if (this.difficulty !== undefined && typeof this.difficulty !== "bigint") this.difficulty = BigInt(this.difficulty);
    if (this.cumulativeDifficulty !== undefined && typeof this.cumulativeDifficulty !== "bigint") this.cumulativeDifficulty = BigInt(this.cumulativeDifficulty);
    if (this.reward !== undefined && typeof this.reward !== "bigint") this.reward = BigInt(this.reward);
  }
  
  copy(): MoneroBlockHeader {
    return new MoneroBlockHeader(this);
  }
  
  toJson() {
    let json: any = Object.assign({}, this);
    if (this.getDifficulty() !== undefined) json.difficulty = this.getDifficulty().toString();
    if (this.getCumulativeDifficulty() !== undefined) json.cumulativeDifficulty = this.getCumulativeDifficulty().toString();
    if (this.getReward() !== undefined) json.reward = this.getReward().toString();
    return json;
  }
  
  getHash() {
    return this.hash;
  }
  
  setHash(hash: string) {
    this.hash = hash;
    return this;
  }
  
  /**
   * Return the block's height which is the total number of blocks that have occurred before.
   * 
   * @return {number} the block's height
   */
  getHeight(): number {
    return this.height;
  }
  
  /**
   * Set the block's height which is the total number of blocks that have occurred before.
   * 
   * @param {number} height is the block's height to set
   * @return {MoneroBlockHeader} a reference to this header for chaining
   */
  setHeight(height: number): MoneroBlockHeader {
    this.height = height;
    return this;
  }
  
  getTimestamp(): number {
    return this.timestamp;
  }
  
  setTimestamp(timestamp): MoneroBlockHeader {
    this.timestamp = timestamp;
    return this;
  }
  
  getSize(): number {
    return this.size;
  }
  
  setSize(size: number): MoneroBlockHeader {
    this.size = size;
    return this;
  }
  
  getWeight(): number {
    return this.weight;
  }
  
  setWeight(weight: number): MoneroBlockHeader {
    this.weight = weight;
    return this;
  }
  
  getLongTermWeight(): number {
    return this.longTermWeight;
  }
  
  setLongTermWeight(longTermWeight: number): MoneroBlockHeader {
    this.longTermWeight = longTermWeight;
    return this;
  }
  
  getDepth(): number {
    return this.depth;
  }
  
  setDepth(depth: number): MoneroBlockHeader {
    this.depth = depth;
    return this;
  }
  
  getDifficulty(): bigint {
    return this.difficulty;
  }
  
  setDifficulty(difficulty: bigint): MoneroBlockHeader {
    this.difficulty = difficulty;
    return this;
  }
  
  getCumulativeDifficulty(): bigint {
    return this.cumulativeDifficulty;
  }
  
  setCumulativeDifficulty(cumulativeDifficulty: bigint): MoneroBlockHeader {
    this.cumulativeDifficulty = cumulativeDifficulty;
    return this;
  }
  
  getMajorVersion(): number {
    return this.majorVersion;
  }
  
  setMajorVersion(majorVersion: number): MoneroBlockHeader {
    this.majorVersion = majorVersion;
    return this;
  }
  
  getMinorVersion(): number {
    return this.minorVersion;
  }
  
  setMinorVersion(minorVersion: number): MoneroBlockHeader {
    this.minorVersion = minorVersion;
    return this;
  }
  
  getNonce(): number {
    return this.nonce;
  }
  
  setNonce(nonce: number): MoneroBlockHeader {
    this.nonce = nonce;
    return this;
  }
  
  getMinerTxHash(): string {
    return this.minerTxHash;
  }
  
  setMinerTxHash(minerTxHash: string): MoneroBlockHeader {
    this.minerTxHash = minerTxHash;
    return this;
  }
  
  getNumTxs(): number {
    return this.numTxs;
  }
  
  setNumTxs(numTxs: number): MoneroBlockHeader {
    this.numTxs = numTxs;
    return this;
  }
  
  getOrphanStatus(): boolean {
    return this.orphanStatus;
  }
  
  setOrphanStatus(orphanStatus: boolean): MoneroBlockHeader {
    this.orphanStatus = orphanStatus;
    return this;
  }
  
  getPrevHash(): string {
    return this.prevHash;
  }
  
  setPrevHash(prevHash: string): MoneroBlockHeader {
    this.prevHash = prevHash;
    return this;
  }
  
  getReward(): bigint {
    return this.reward;
  }
  
  setReward(reward: bigint): MoneroBlockHeader {
    this.reward = reward;
    return this;
  }
  
  getPowHash(): string {
    return this.powHash;
  }
  
  setPowHash(powHash: string): MoneroBlockHeader {
    this.powHash = powHash;
    return this;
  }
  
  merge(header: MoneroBlockHeader): MoneroBlockHeader {
    assert(header instanceof MoneroBlockHeader);
    if (this === header) return this;
    this.setHash(GenUtils.reconcile(this.getHash(), header.getHash()));
    this.setHeight(GenUtils.reconcile(this.getHeight(), header.getHeight(), {resolveMax: true}));  // height can increase
    this.setTimestamp(GenUtils.reconcile(this.getTimestamp(), header.getTimestamp(), {resolveMax: true}));  // block timestamp can increase
    this.setSize(GenUtils.reconcile(this.getSize(), header.getSize()));
    this.setWeight(GenUtils.reconcile(this.getWeight(), header.getWeight()));
    this.setDepth(GenUtils.reconcile(this.getDepth(), header.getDepth()));
    this.setDifficulty(GenUtils.reconcile(this.getDifficulty(), header.getDifficulty()));
    this.setCumulativeDifficulty(GenUtils.reconcile(this.getCumulativeDifficulty(), header.getCumulativeDifficulty()));
    this.setMajorVersion(GenUtils.reconcile(this.getMajorVersion(), header.getMajorVersion()));
    this.setMinorVersion(GenUtils.reconcile(this.getMinorVersion(), header.getMinorVersion()));
    this.setNonce(GenUtils.reconcile(this.getNonce(), header.getNonce()));
    this.setMinerTxHash(GenUtils.reconcile(this.getMinerTxHash(), header.getMinerTxHash()));
    this.setNumTxs(GenUtils.reconcile(this.getNumTxs(), header.getNumTxs()));
    this.setOrphanStatus(GenUtils.reconcile(this.getOrphanStatus(), header.getOrphanStatus()));
    this.setPrevHash(GenUtils.reconcile(this.getPrevHash(), header.getPrevHash()));
    this.setReward(GenUtils.reconcile(this.getReward(), header.getReward()));
    this.setPowHash(GenUtils.reconcile(this.getPowHash(), header.getPowHash()));
    return this;
  }
  
  toString(indent = 0) {
    let str = "";
    str += GenUtils.kvLine("Hash", this.getHash(), indent);
    str += GenUtils.kvLine("Height", this.getHeight(), indent);
    str += GenUtils.kvLine("Timestamp", this.getTimestamp(), indent);
    str += GenUtils.kvLine("Size", this.getSize(), indent);
    str += GenUtils.kvLine("Weight", this.getWeight(), indent);
    str += GenUtils.kvLine("Depth", this.getDepth(), indent);
    str += GenUtils.kvLine("Difficulty", this.getDifficulty(), indent);
    str += GenUtils.kvLine("Cumulative difficulty", this.getCumulativeDifficulty(), indent);
    str += GenUtils.kvLine("Major version", this.getMajorVersion(), indent);
    str += GenUtils.kvLine("Minor version", this.getMinorVersion(), indent);
    str += GenUtils.kvLine("Nonce", this.getNonce(), indent);
    str += GenUtils.kvLine("Miner tx hash", this.getMinerTxHash(), indent);
    str += GenUtils.kvLine("Num txs", this.getNumTxs(), indent);
    str += GenUtils.kvLine("Orphan status", this.getOrphanStatus(), indent);
    str += GenUtils.kvLine("Prev hash", this.getPrevHash(), indent);
    str += GenUtils.kvLine("Reward", this.getReward(), indent);
    str += GenUtils.kvLine("Pow hash", this.getPowHash(), indent);
    return str[str.length - 1] === "\n" ? str.slice(0, str.length - 1) : str  // strip last newline
  }
}