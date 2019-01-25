const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Models an alternative chain seen by the node.
 */
class MoneroAltChain extends MoneroDaemonModel {
  
  getBlockIds(blockIds) {
    return this.blockIds;
  }
  
  setBlockIds(blockIds) {
    this.blockIds = blockIds;
  }
  
  getDifficulty() {
    return this.difficulty;
  }
  
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
  }
  
  getLength() {
    return this.length;
  }
  
  setLength(length) {
    this.length = length;
  }
  
  getMainChainParentBlockId() {
    return this.mainChainParentBlockId;
  }
  
  setMainChainParentBlockId(mainChainParentBlockId) {
    this.mainChainParentBlockId = mainChainParentBlockId;
  }
}

module.exports = MoneroAltChain;