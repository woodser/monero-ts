/**
 * Monero block template to mine.
 */
class MoneroBlockTemplate {
  
  getBlockTemplateBlob() {
    return this.blockTemplateBlob;
  }
  
  setBlockTemplateBlob(blockTemplateBlob) {
    this.blockTemplateBlob = blockTemplateBlob;
    return this;
  }
  
  getBlockHashingBlob() {
    return this.blockHashingBlob;
  }
  
  setBlockHashingBlob(blockHashingBlob) {
    this.blockHashingBlob = blockHashingBlob;
    return this;
  }
  
  getDifficulty() {
    return this.difficulty;
  }
  
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    return this;
  }
  
  getExpectedReward() {
    return this.expectedReward;
  }
  
  setExpectedReward(expectedReward) {
    this.expectedReward = expectedReward;
    return this;
  }
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
    return this;
  }
  
  getPrevId() {
    return this.prevId;
  }
  
  setPrevId(prevId) {
    this.prevId = prevId;
    return this;
  }
  
  getReservedOffset() {
    return this.reservedOffset;
  }
  
  setReservedOffset(reservedOffset) {
    this.reservedOffset = reservedOffset;
    return this;
  }
}

module.exports = MoneroBlockTemplate;