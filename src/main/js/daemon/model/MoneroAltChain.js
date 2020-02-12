/**
 * Models an alternative chain seen by the node.
 */
class MoneroAltChain {
  
  constructor(state) {
    this.state = Object.assign({}, state);
  }
  
  toJson() {
    return Object.assign({}, this.state);
  }
  
  getBlockHashes(blockHashes) {
    return this.state.blockHashes;
  }
  
  setBlockHashes(blockHashes) {
    this.state.blockHashes = blockHashes;
    return this;
  }
  
  getDifficulty() {
    return this.state.difficulty;
  }
  
  setDifficulty(difficulty) {
    this.state.difficulty = difficulty;
    return this;
  }
  
  getHeight() {
    return this.state.height;
  }
  
  setHeight(height) {
    this.state.height = height;
    return this;
  }
  
  getLength() {
    return this.state.length;
  }
  
  setLength(length) {
    this.state.length = length;
    return this;
  }
  
  getMainChainParentBlockHash() {
    return this.state.mainChainParentBlockHash;
  }
  
  setMainChainParentBlockHash(mainChainParentBlockHash) {
    this.state.mainChainParentBlockHash = mainChainParentBlockHash;
    return this;
  }
}

module.exports = MoneroAltChain;