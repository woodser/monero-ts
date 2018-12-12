const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Monero daemon connection.
 */
class MoneroDaemonConnection extends MoneroDaemonModel {
  
  getId() {
    return this.id;
  }

  setId(id) {
    this.id = id;
  }

  getAddress() {
    return this.address;
  }

  setAddress(address) {
    this.address = address;
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

  getHost() {
    return this.host;
  }

  setHost(host) {
    this.host = host;
  }

  getIsIncoming() {
    return this.isIncoming;
  }

  setIsIncoming(isIncoming) {
    this.isIncoming = isIncoming;
  }

  getIp() {
    return this.ip;
  }

  setIp(ip) {
    this.ip = ip;
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

  getPeerId() {
    return this.peerId;
  }

  setPeerId(peerId) {
    this.peerId = peerId;
  }

  getPort() {
    return this.port;
  }

  setPort(port) {
    this.port = port;
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

  getSupportFlags() {
    return this.supportFlags;
  }

  setNumSupportFlags(supportFlags) {
    this.supportFlags = supportFlags;
  }
}

module.exports = MoneroDaemonConnection;