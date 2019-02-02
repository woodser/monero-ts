/**
 * Models an alternative chain seen by the node.
 */
class MoneroAltChain {
  
  getBlockIds(blockIds) {
    return this.blockIds;
  }
  
  setBlockIds(blockIds) {
    this.blockIds = blockIds;
    return this;
  }
  
  getDifficulty() {
    return this.difficulty;
  }
  
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    return this;
  }
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
    return this;
  }
  
  getLength() {
    return this.length;
  }
  
  setLength(length) {
    this.length = length;
    return this;
  }
  
  getMainChainParentBlockId() {
    return this.mainChainParentBlockId;
  }
  
  setMainChainParentBlockId(mainChainParentBlockId) {
    this.mainChainParentBlockId = mainChainParentBlockId;
    return this;
  }
}

module.exports = MoneroAltChain;