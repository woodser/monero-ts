/**
 * Monero daemon connection.
 */
class MoneroDaemonConnection {
  
  getPeer() {
    return this.peer;
  }

  setPeer(peer) {
    this.peer = peer;
  }
  
  getId() {
    return this.id;
  }

  setId(id) {
    this.id = id;
  }

  getAvgDownload() {
    return this.avgDownload;
  }

  setAvgDownload(avgDownload) {
    this.avgDownload = avgDownload;
  }

  getAvgUpload() {
    return this.avgUpload;
  }

  setAvgUpload(avgUpload) {
    this.avgUpload = avgUpload;
  }

  getCurrentDownload() {
    return this.currentDownload;
  }

  setCurrentDownload(currentDownload) {
    this.currentDownload = currentDownload;
  }

  getCurrentUpload() {
    return this.currentUpload;
  }

  setCurrentUpload(currentUpload) {
    this.currentUpload = currentUpload;
  }

  getHeight() {
    return this.height;
  }

  setHeight(height) {
    this.height = height;
  }

  getIsIncoming() {
    return this.isIncoming;
  }

  setIsIncoming(isIncoming) {
    this.isIncoming = isIncoming;
  }

  getLiveTime() {
    return this.liveTime;
  }

  setLiveTime(liveTime) {
    this.liveTime = liveTime;
  }

  getIsLocalIp() {
    return this.isLocalIp;
  }

  setIsLocalIp(isLocalIp) {
    this.isLocalIp = isLocalIp;
  }

  getIsLocalHost() {
    return this.isLocalHost;
  }

  setIsLocalHost(isLocalHost) {
    this.isLocalHost = isLocalHost;
  }

  getReceiveCount() {
    return this.receiveCount;
  }

  setReceiveCount(receiveCount) {
    this.receiveCount = receiveCount;
  }

  getReceiveIdleTime() {
    return this.receiveIdleTime;
  }

  setReceiveIdleTime(receiveIdleTime) {
    this.receiveIdleTime = receiveIdleTime;
  }

  getSendCount() {
    return this.sendCount;
  }

  setSendCount(sendCount) {
    this.sendCount = sendCount;
  }

  getSendIdleTime() {
    return this.sendIdleTime;
  }

  setSendIdleTime(sendIdleTime) {
    this.sendIdleTime = sendIdleTime;
  }

  getState() {
    return this.state;
  }

  setState(state) {
    this.state = state;
  }

  getSupportFlagCount() {
    return this.supportFlagCount;
  }

  setSupportFlagCount(supportFlagCount) {
    this.supportFlagCount = supportFlagCount;
  }
}

module.exports = MoneroDaemonConnection;