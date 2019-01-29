/**
 * Models daemon synchronization information.
 */
class MoneroDaemonSyncInfo {
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
  }
  
  getConnections() {
    return this.peers;
  }
  
  setConnections(peers) {
    this.peers = peers;
  }
  
  getSpans() {
    return this.spans;
  }
  
  setSpans(spans) {
    this.spans = spans;
  }
  
  getTargetHeight() {
    return this.targetHeight;
  }
  
  setTargetHeight(targetHeight) {
    this.targetHeight = targetHeight;
  }
  
  getNextNeededPruningSeed() {
    return this.nextNeededPruningSeed;
  }
  
  setNextNeededPruningSeed(nextNeededPruningSeed) {
    this.nextNeededPruningSeed = nextNeededPruningSeed;
  }
  
  getOverview() {
    return this.overview;
  }
  
  setOverview(overview) {
    this.overview = overview;
  }
}

module.exports = MoneroDaemonSyncInfo;