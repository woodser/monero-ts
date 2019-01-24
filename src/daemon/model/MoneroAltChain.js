const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Models an alternative chain seen by the node.
 */
class MoneroAltChain extends MoneroDaemonModel {
  
  getBlockId() {
    return this.blockId;
  }
  
  setBlockId(blockId) {
    this.blockId = blockId;
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
}

module.exports = MoneroAltChain;