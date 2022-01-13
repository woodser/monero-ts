const BigInteger = require("../../common/biginteger").BigInteger;
const MoneroConnectionSpan = require("./MoneroConnectionSpan");
const MoneroPeer = require("./MoneroPeer");

/**
 * Models daemon synchronization information.
 */
class MoneroDaemonSyncInfo {
  
  constructor(state) {
    
    // copy state
    state = Object.assign({}, state);
    
    // deserialize if necessary
    if (state.peers) {
      for (let i = 0; i < state.peers.length; i++) {
        if (!(state.peers[i] instanceof MoneroPeer)) {
          state.peers[i] = new MoneroPeer(state.peers[i]);
        }
      }
    }
    if (state.spans) {
      for (let i = 0; i < state.spans.length; i++) {
        if (!(state.spans[i] instanceof MoneroConnectionSpan)) {
          state.spans[i] = new MoneroConnectionSpan(state.spans[i]);
        }
      }
    }
    if (state.credits !== undefined && !(state.credits instanceof BigInteger)) state.credits = BigInteger.parse(state.credits);
    
    // assign internal state
    this.state = state;
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (json.peers) {
      for (let i = 0; i < json.peers.length; i++) {
        json.peers[i] = json.peers[i].toJson();
      }
    }
    if (json.spans) {
      for (let i = 0; i < json.spans.length; i++) {
        json.spans[i] = json.spans[i].toJson();
      }
    }
    if (json.credits) json.credits = json.credits.toString();
    return json;
  }
  
  getHeight() {
    return this.state.height;
  }
  
  setHeight(height) {
    this.state.height = height;
    return this;
  }
  
  getPeers() {
    return this.state.peers;
  }
  
  setPeers(peers) {
    this.state.peers = peers;
    return this;
  }
  
  getSpans() {
    return this.state.spans;
  }
  
  setSpans(spans) {
    this.state.spans = spans;
    return this;
  }
  
  getTargetHeight() {
    return this.state.targetHeight;
  }
  
  setTargetHeight(targetHeight) {
    this.state.targetHeight = targetHeight;
    return this;
  }
  
  getNextNeededPruningSeed() {
    return this.state.nextNeededPruningSeed;
  }
  
  setNextNeededPruningSeed(nextNeededPruningSeed) {
    this.state.nextNeededPruningSeed = nextNeededPruningSeed;
    return this;
  }
  
  getOverview() {
    return this.state.overview;
  }
  
  setOverview(overview) {
    this.state.overview = overview;
    return this;
  }
  
  getCredits() {
    return this.state.credits;
  }
  
  setCredits(credits) {
    this.state.credits = credits;
    return this;
  }
  
  getTopBlockHash() {
    return this.state.topBlockHash;
  }
  
  setTopBlockHash(topBlockHash) {
    this.state.topBlockHash = topBlockHash;
    return this;
  }
}

module.exports = MoneroDaemonSyncInfo;