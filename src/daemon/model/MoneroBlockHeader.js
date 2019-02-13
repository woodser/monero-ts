const assert = require("assert");
const MoneroUtils = require("../../utils/MoneroUtils");

/**
 * Monero block header information.
 */
class MoneroBlockHeader {
  
  /**
   * Construct the model.
   * 
   * @param {MoneroBlockHeader|object} state is existing state to initialize from (optional)
   */
  constructor(state) {
    
    // initialize internal state
    if (!state) state = {};
    else if (state instanceof MoneroBlockHeader) state = state.toJson();
    else if (typeof state === "object") state = Object.assign({}, state);
    else throw new Error("state must be a MoneroBlockHeader or JavaScript object");
    this.state = state;
    
    // deserialize big integers
    if (state.difficulty && !(state.difficulty instanceof BigInteger)) state.difficulty = BigInteger.parse(state.difficulty);
    if (state.cumulativeDifficulty && !(state.cumulativeDifficulty instanceof BigInteger)) state.cumulativeDifficulty = BigInteger.parse(state.cumulativeDifficulty);
    if (state.reward && !(state.reward instanceof BigInteger)) state.reward = BigInteger.parse(state.reward);
  }
  
  getId() {
    return this.state.id;
  }
  
  setId(id) {
    this.state.id = id;
    return this;
  }
  
  getHeight() {
    return this.state.height;
  }
  
  setHeight(height) {
    this.state.height = height;
    return this;
  }
  
  getTimestamp() {
    return this.state.timestamp;
  }
  
  setTimestamp(timestamp) {
    this.state.timestamp = timestamp;
    return this;
  }
  
  getSize() {
    return this.state.size;
  }
  
  setSize(size) {
    this.state.size = size;
    return this;
  }
  
  getWeight() {
    return this.state.weight;
  }
  
  setWeight(weight) {
    this.state.weight = weight;
    return this;
  }
  
  getDepth() {
    return this.state.depth;
  }
  
  setDepth(depth) {
    this.state.depth = depth;
    return this;
  }
  
  getDifficulty() {
    return this.state.difficulty;
  }
  
  setDifficulty(difficulty) {
    this.state.difficulty = difficulty;
    return this;
  }
  
  getCumulativeDifficulty() {
    return this.state.cumulativeDifficulty;
  }
  
  setCumulativeDifficulty(cumulativeDifficulty) {
    this.state.cumulativeDifficulty = cumulativeDifficulty;
    return this;
  }
  
  getMajorVersion() {
    return this.state.majorVersion;
  }
  
  setMajorVersion(majorVersion) {
    this.state.majorVersion = majorVersion;
    return this;
  }
  
  getMinorVersion() {
    return this.state.minorVersion;
  }
  
  setMinorVersion(minorVersion) {
    this.state.minorVersion = minorVersion;
    return this;
  }
  
  getNonce() {
    return this.state.nonce;
  }
  
  setNonce(nonce) {
    this.state.nonce = nonce;
    return this;
  }
  
  getTxCount() {
    return this.state.txCount;
  }
  
  setTxCount(txCount) {
    this.state.txCount = txCount;
    return this;
  }
  
  getOrphanStatus() {
    return this.state.orphanStatus;
  }
  
  setOrphanStatus(orphanStatus) {
    this.state.orphanStatus = orphanStatus;
    return this;
  }
  
  getPrevId() {
    return this.state.prevId;
  }
  
  setPrevId(prevId) {
    this.state.prevId = prevId;
    return this;
  }
  
  getReward() {
    return this.state.reward;
  }
  
  setReward(reward) {
    this.state.reward = reward;
    return this;
  }
  
  getPowHash() {
    return this.state.powHash;
  }
  
  setPowHash(powHash) {
    this.state.powHash = powHash;
    return this;
  }
  
  copy() {
    return new MoneroBlockHeader(this);
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getDifficulty()) json.difficulty = this.getDifficulty().toString();
    if (this.getCumulativeDifficulty()) json.cumulativeDifficulty = this.getCumulativeDifficulty().toString();
    if (this.getReward()) json.reward = this.getReward().toString();
    return json;
  }
  
  merge(header) {
    assert(header instanceof MoneroBlockHeader);
    if (this === header) return;
    this.setId(MoneroUtils.reconcile(this.getId(), header.getId()));
    this.setHeight(MoneroUtils.reconcile(this.getHeight(), header.getHeight(), {resolveMax: true}));  // height can increase
    this.setTimestamp(MoneroUtils.reconcile(this.getTimestamp(), header.getTimestamp(), {resolveMax: true}));  // block timestamp can increase
    this.setSize(MoneroUtils.reconcile(this.getSize(), header.getSize()));
    this.setWeight(MoneroUtils.reconcile(this.getWeight(), header.getWeight()));
    this.setDepth(MoneroUtils.reconcile(this.getDepth(), header.getDepth()));
    this.setDifficulty(MoneroUtils.reconcile(this.getDifficulty(), header.getDifficulty()));
    this.setCumulativeDifficulty(MoneroUtils.reconcile(this.getCumulativeDifficulty(), header.getCumulativeDifficulty()));
    this.setMajorVersion(MoneroUtils.reconcile(this.getMajorVersion(), header.getMajorVersion()));
    this.setMinorVersion(MoneroUtils.reconcile(this.getMinorVersion(), header.getMinorVersion()));
    this.setNonce(MoneroUtils.reconcile(this.getNonce(), header.getNonce()));
    this.setTxCount(MoneroUtils.reconcile(this.getTxCount(), header.getTxCount()));
    this.setOrphanStatus(MoneroUtils.reconcile(this.getOrphanStatus(), header.getOrphanStatus()));
    this.setPrevId(MoneroUtils.reconcile(this.getPrevId(), header.getPrevId()));
    this.setReward(MoneroUtils.reconcile(this.getReward(), header.getReward()));
    this.setPowHash(MoneroUtils.reconcile(this.getPowHash(), header.getPowHash()));
    return this;
  }
  
  toString(indent = 0) {
    let str = "";
    str += MoneroUtils.kvLine("Id", this.getId(), indent);
    str += MoneroUtils.kvLine("Height", this.getHeight(), indent);
    str += MoneroUtils.kvLine("Timestamp", this.getTxCount(), indent);
    str += MoneroUtils.kvLine("Size", this.getSize(), indent);
    str += MoneroUtils.kvLine("Weight", this.getWeight(), indent);
    str += MoneroUtils.kvLine("Depth", this.getDepth(), indent);
    str += MoneroUtils.kvLine("Difficulty", this.getDifficulty(), indent);
    str += MoneroUtils.kvLine("Cumulative difficulty", this.getCumulativeDifficulty(), indent);
    str += MoneroUtils.kvLine("Major version", this.getMajorVersion(), indent);
    str += MoneroUtils.kvLine("Minor version", this.getMinorVersion(), indent);
    str += MoneroUtils.kvLine("Nonce", this.getNonce(), indent);
    str += MoneroUtils.kvLine("Tx count", this.getTxCount(), indent);
    str += MoneroUtils.kvLine("Orphan status", this.getOrphanStatus(), indent);
    str += MoneroUtils.kvLine("Prev id", this.getPrevId(), indent);
    str += MoneroUtils.kvLine("Reward", this.getReward(), indent);
    str += MoneroUtils.kvLine("Pow hash", this.getPowHash(), indent);
    return str[str.length - 1] === "\n" ? str.slice(0, str.length - 1) : str  // strip last newline
  }
}

module.exports = MoneroBlockHeader;