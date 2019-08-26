/**
 * Models daemon synchronization information.
 */
class MoneroDaemonSyncInfo {
  
  constructor() {
    this.state = {};
  }
  
  getHeight() {
    return this.state.height;
  }
  
  setHeight(height) {
    this.state.height = height;
    return this;
  }
  
  getConnections() {
    return this.state.peers;
  }
  
  setConnections(peers) {
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
}

module.exports = MoneroDaemonSyncInfo;