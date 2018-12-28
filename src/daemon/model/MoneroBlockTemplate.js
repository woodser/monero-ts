const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Monero block template to mine.
 */
class MoneroBlockTemplate extends MoneroDaemonModel {

  constructor() {
    super();
  }
  
  getTemplateBlob() {
    return this.templateBlob;
  }
  
  setTemplateBlob(templateBlob) {
    this.templateBlob = templateBlob;
  }
  
  getHashBlob() {
    return this.hashBlob;
  }
  
  setHashBlob(hashBlob) {
    this.hashBlob = hashBlob;
  }
  
  getDifficulty() {
    return this.difficulty;
  }
  
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }
  
  getExpectedReward() {
    return this.expectedReward;
  }
  
  setExpectedReward(expectedReward) {
    this.expectedReward = expectedReward;
  }
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
  }
  
  getPrevId() {
    return this.prevId;
  }
  
  setPrevId(prevId) {
    this.prevId = prevId;
  }
  
  getReservedOffset() {
    return this.reservedOffset;
  }
  
  setReservedOffset(reservedOffset) {
    this.reservedOffset = reservedOffset;
  }
}

module.exports = MoneroBlockTemplate;