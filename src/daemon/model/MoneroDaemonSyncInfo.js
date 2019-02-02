/**
 * Models daemon synchronization information.
 */
class MoneroDaemonSyncInfo {
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
    return this;
  }
  
  getConnections() {
    return this.peers;
  }
  
  setConnections(peers) {
    this.peers = peers;
    return this;
  }
  
  getSpans() {
    return this.spans;
  }
  
  setSpans(spans) {
    this.spans = spans;
    return this;
  }
  
  getTargetHeight() {
    return this.targetHeight;
  }
  
  setTargetHeight(targetHeight) {
    this.targetHeight = targetHeight;
    return this;
  }
  
  getNextNeededPruningSeed() {
    return this.nextNeededPruningSeed;
  }
  
  setNextNeededPruningSeed(nextNeededPruningSeed) {
    this.nextNeededPruningSeed = nextNeededPruningSeed;
    return this;
  }
  
  getOverview() {
    return this.overview;
  }
  
  setOverview(overview) {
    this.overview = overview;
    return this;
  }
}

module.exports = MoneroDaemonSyncInfo;