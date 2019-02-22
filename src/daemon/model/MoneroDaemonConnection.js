/**
 * Monero daemon connection.
 */
class MoneroDaemonConnection {
  
  getPeer() {
    return this.peer;
  }

  setPeer(peer) {
    this.peer = peer;
    return this;
  }
  
  getId() {
    return this.id;
  }

  setId(id) {
    this.id = id;
    return this;
  }

  getAvgDownload() {
    return this.avgDownload;
  }

  setAvgDownload(avgDownload) {
    this.avgDownload = avgDownload;
    return this;
  }

  getAvgUpload() {
    return this.avgUpload;
  }

  setAvgUpload(avgUpload) {
    this.avgUpload = avgUpload;
    return this;
  }

  getCurrentDownload() {
    return this.currentDownload;
  }

  setCurrentDownload(currentDownload) {
    this.currentDownload = currentDownload;
    return this;
  }

  getCurrentUpload() {
    return this.currentUpload;
  }

  setCurrentUpload(currentUpload) {
    this.currentUpload = currentUpload;
    return this;
  }

  getHeight() {
    return this.height;
  }

  setHeight(height) {
    this.height = height;
    return this;
  }

  getIsIncoming() {
    return this.isIncoming;
  }

  setIsIncoming(isIncoming) {
    this.isIncoming = isIncoming;
    return this;
  }

  getLiveTime() {
    return this.liveTime;
  }

  setLiveTime(liveTime) {
    this.liveTime = liveTime;
    return this;
  }

  getIsLocalIp() {
    return this.isLocalIp;
  }

  setIsLocalIp(isLocalIp) {
    this.isLocalIp = isLocalIp;
    return this;
  }

  getIsLocalHost() {
    return this.isLocalHost;
  }

  setIsLocalHost(isLocalHost) {
    this.isLocalHost = isLocalHost;
    return this;
  }

  getNumReceives() {
    return this.numReceives;
  }

  getNumReceives(numReceives) {
    this.numReceives = numReceives;
    return this;
  }

  getNumSends() {
    return this.numSends;
  }

  setNumSends(numSends) {
    this.numSends = numSends;
    return this;
  }

  getReceiveIdleTime() {
    return this.receiveIdleTime;
  }

  setReceiveIdleTime(receiveIdleTime) {
    this.receiveIdleTime = receiveIdleTime;
    return this;
  }

  getSendIdleTime() {
    return this.sendIdleTime;
  }

  setSendIdleTime(sendIdleTime) {
    this.sendIdleTime = sendIdleTime;
    return this;
  }

  getState() {
    return this.state;
  }

  setState(state) {
    this.state = state;
    return this;
  }

  getNumSupportFlags() {
    return this.numSupportFlags;
  }

  setNumSupportFlags(numSupportFlags) {
    this.numSupportFlags = numSupportFlags;
    return this;
  }
}

module.exports = MoneroDaemonConnection;