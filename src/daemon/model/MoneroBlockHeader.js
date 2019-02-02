/**
 * Monero block header information.
 */
class MoneroBlockHeader {
  
  getSize() {
    return this.size;
  }
  
  setSize(size) {
    this.size = size;
    return this;
  }
  
  getDepth() {
    return this.depth;
  }
  
  setDepth(depth) {
    this.depth = depth;
    return this;
  }
  
  getDifficulty() {
    return this.difficulty;
  }
  
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    return this;
  }
  
  getCumulativeDifficulty() {
    return this.cumulativeDifficulty;
  }
  
  setCumulativeDifficulty(cumulativeDifficulty) {
    this.cumulativeDifficulty = cumulativeDifficulty;
    return this;
  }
  
  getId() {
    return this.id;
  }
  
  setId(id) {
    this.id = id;
    return this;
  }
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
    return this;
  }
  
  getMajorVersion() {
    return this.majorVersion;
  }
  
  setMajorVersion(majorVersion) {
    this.majorVersion = majorVersion;
    return this;
  }
  
  getMinorVersion() {
    return this.minorVersion;
  }
  
  setMinorVersion(minorVersion) {
    this.minorVersion = minorVersion;
    return this;
  }
  
  getNonce() {
    return this.nonce;
  }
  
  setNonce(nonce) {
    this.nonce = nonce;
    return this;
  }
  
  getTxCount() {
    return this.txCount;
  }
  
  setTxCount(txCount) {
    this.txCount = txCount;
    return this;
  }
  
  getOrphanStatus() {
    return this.orphanStatus;
  }
  
  setOrphanStatus(orphanStatus) {
    this.orphanStatus = orphanStatus;
    return this;
  }
  
  getPrevId() {
    return this.prevId;
  }
  
  setPrevId(prevId) {
    this.prevId = prevId;
    return this;
  }
  
  getReward() {
    return this.reward;
  }
  
  setReward(reward) {
    this.reward = reward;
    return this;
  }
  
  getTimestamp() {
    return this.timestamp;
  }
  
  setTimestamp(timestamp) {
    this.timestamp = timestamp;
    return this;
  }
  
  getBlockWeight() {
    return this.blockWeight;
  }
  
  setBlockWeight(blockWeight) {
    this.blockWeight = blockWeight;
    return this;
  }
  
  getPowHash() {
    return this.powHash;
  }
  
  setPowHash(powHash) {
    this.powHash = powHash;
    return this;
  }
}

module.exports = MoneroBlockHeader;