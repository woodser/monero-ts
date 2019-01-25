const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Models daemon synchronization information.
 */
class MoneroDaemonSyncInfo extends MoneroDaemonModel {
  
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
}

module.exports = MoneroDaemonSyncInfo;