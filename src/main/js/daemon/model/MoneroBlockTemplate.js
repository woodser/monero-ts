
/**
 * Monero block template to mine.
 */
class MoneroBlockTemplate {
  
  constructor(state) {
    state = Object.assign({}, state);
    this.state = state;
    
    // deserialize BigInts
    if (state.expectedReward !== undefined && !(state.expectedReward instanceof BigInt)) state.expectedReward = BigInt(state.expectedReward);
    if (state.difficulty !== undefined && !(state.difficulty instanceof BigInt)) state.difficulty = BigInt(state.difficulty);
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getExpectedReward() !== undefined) json.expectedReward = this.getExpectedReward().toString();
    if (this.getDifficulty() !== undefined) json.difficulty = this.getDifficulty().toString();
    return json;
  }
  
  getBlockTemplateBlob() {
    return this.state.blockTemplateBlob;
  }
  
  setBlockTemplateBlob(blockTemplateBlob) {
    this.state.blockTemplateBlob = blockTemplateBlob;
    return this;
  }
  
  getBlockHashingBlob() {
    return this.state.blockHashingBlob;
  }
  
  setBlockHashingBlob(blockHashingBlob) {
    this.state.blockHashingBlob = blockHashingBlob;
    return this;
  }
  
  getDifficulty() {
    return this.state.difficulty;
  }
  
  setDifficulty(difficulty) {
    this.state.difficulty = difficulty;
    return this;
  }
  
  getExpectedReward() {
    return this.state.expectedReward;
  }
  
  setExpectedReward(expectedReward) {
    this.state.expectedReward = expectedReward;
    return this;
  }
  
  getHeight() {
    return this.state.height;
  }
  
  setHeight(height) {
    this.state.height = height;
    return this;
  }
  
  getPrevHash() {
    return this.state.prevId;
  }
  
  setPrevHash(prevId) {
    this.state.prevId = prevId;
    return this;
  }
  
  getReservedOffset() {
    return this.state.reservedOffset;
  }
  
  setReservedOffset(reservedOffset) {
    this.state.reservedOffset = reservedOffset;
    return this;
  }
  
  getSeedHeight() {
    return this.state.height;
  }
  
  setSeedHeight(seedHeight) {
    this.state.seedHeight = seedHeight;
    return this;
  }
  
  getSeedHash() {
    return this.state.seedHash;
  }
  
  setSeedHash(seedHash) {
    this.state.seedHash = seedHash;
    return this;
  }
  
  getNextSeedHash() {
    return this.state.nextSeedHash
  }
  
  setNextSeedHash(nextSeedHash) {
    this.state.nextSeedHash = nextSeedHash;
    return this;
  }
}

export default MoneroBlockTemplate;
