/**
 * Monero block template to mine.
 */
class MoneroBlockTemplate {
  
  getTemplateBlob() { // TODO: rename getTemplateBlob() -> getBlockTemplateBlob(), getHashBlob() -> getBlockHashBlob() for recognizability
    return this.templateBlob;
  }
  
  setTemplateBlob(templateBlob) {
    this.templateBlob = templateBlob;
    return this;
  }
  
  getHashBlob() {
    return this.hashBlob;
  }
  
  setHashBlob(hashBlob) {
    this.hashBlob = hashBlob;
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