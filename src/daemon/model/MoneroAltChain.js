/**
 * Models an alternative chain seen by the node.
 */
class MoneroAltChain {
  
  constructor() {
    this.state = {};
  }
  
  getBlockIds(blockIds) {
    return this.state.blockIds;
  }
  
  setBlockIds(blockIds) {
    this.state.blockIds = blockIds;
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
  
  getMainChainParentBlockId() {
    return this.state.mainChainParentBlockId;
  }
  
  setMainChainParentBlockId(mainChainParentBlockId) {
    this.state.mainChainParentBlockId = mainChainParentBlockId;
    return this;
  }
}

module.exports = MoneroAltChain;