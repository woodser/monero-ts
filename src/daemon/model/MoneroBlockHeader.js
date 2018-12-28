const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Monero block header information.
 */
class MoneroBlockHeader extends MoneroDaemonModel {
  
  getSize() {
    return this.size;
  }
  
  setSize(size) {
    this.size = size;
  }
  
  getDepth() {
    return this.depth;
  }
  
  setDepth(depth) {
    this.depth = depth;
  }
  
  getDifficulty() {
    return this.difficulty;
  }
  
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }
  
  getCumulativeDifficulty() {
    return this.cumulativeDifficulty;
  }
  
  setCumulativeDifficulty(cumulativeDifficulty) {
    this.cumulativeDifficulty = cumulativeDifficulty;
  }
  
  getHash() {
    return this.hash;
  }
  
  setHash(hash) {
    this.hash = hash;
  }
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
  }
  
  getMajorVersion() {
    return this.majorVersion;
  }
  
  setMajorVersion(majorVersion) {
    this.majorVersion = majorVersion;
  }
  
  getMinorVersion() {
    return this.minorVersion;
  }
  
  setMinorVersion(minorVersion) {
    this.minorVersion = minorVersion;
  }
  
  getNonce() {
    return this.nonce;
  }
  
  setNonce(nonce) {
    this.nonce = nonce;
  }
  
  getNumTxs() {
    return this.numTxs;
  }
  
  setNumTxs(numTxs) {
    this.numTxs = numTxs;
  }
  
  getOrphanStatus() {
    return this.orphanStatus;
  }
  
  setOrphanStatus(orphanStatus) {
    this.orphanStatus = orphanStatus;
  }
  
  getPrevHash() {
    return this.prevHash;
  }
  
  setPrevHash(prevHash) {
    this.prevHash = prevHash;
  }
  
  getReward() {
    return this.reward;
  }
  
  setReward(reward) {
    this.reward = reward;
  }
  
  getTimestamp() {
    return this.timestamp;
  }
  
  setTimestamp(timestamp) {
    this.timestamp = timestamp;
  }
  
  getBlockWeight() {
    return this.blockWeight;
  }
  
  setBlockWeight(blockWeight) {
    this.blockWeight = blockWeight;
  }
  
  getPowHash() {
    return this.powHash;
  }
  
  setPowHash(powHash) {
    this.powHash = powHash;
  }
}

module.exports = MoneroBlockHeader;