const BigInteger = require("../../common/biginteger").BigInteger;

/**
 * Models a peer to the daemon.
 */
class MoneroPeer {
  
  constructor(state) {
    this.state = Object.assign({}, state);
    if (this.state.rpcCreditsPerHash !== undefined && !(this.state.rpcCreditsPerHash instanceof BigInteger)) this.state.rpcCreditsPerHash = BigInteger.parse(this.state.rpcCreditsPerHash);
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (json.rpcCreditsPerHash) json.rpcCreditsPerHash = json.rpcCreditsPerHash.toString();
    return json;
  }
  
  getId() {
    return this.state.id;
  }

  setId(id) {
    this.state.id = id;
    return this;
  }

  getAddress() {
    return this.state.address;
  }

  setAddress(address) {
    this.state.address = address;
    return this;
  }

  getHost() {
    return this.state.host;
  }

  setHost(host) {
    this.state.host = host;
    return this;
  }

  getPort() {
    return this.state.port;
  }

  setPort(port) {
    this.state.port = port;
    return this;
  }
  
  /**
   * Indicates if the peer was online when last checked (aka "white listed" as
   * opposed to "gray listed").
   * 
   * @return {boolean} true if peer was online when last checked, false otherwise
   */
  isOnline() {
    return this.state.isOnline;
  }
  
  setIsOnline(isOnline) {
    this.state.isOnline = isOnline;
    return this;
  }
  
  getLastSeenTimestamp() {
    return this.state.lastSeenTimestamp;
  }
  
  setLastSeenTimestamp(lastSeenTimestamp) {
    this.state.lastSeenTimestamp = lastSeenTimestamp;
    return this;
  }
  
  getPruningSeed() {
    return this.state.pruningSeed;
  }
  
  setPruningSeed(pruningSeed) {
    this.state.pruningSeed = pruningSeed;
    return this;
  }
  
  getRpcPort() {
    return this.state.rpcPort;
  }

  setRpcPort(rpcPort) {
    this.state.rpcPort = rpcPort;
    return this;
  }
  
  getRpcCreditsPerHash() {
    return this.state.rpcCreditsPerHash;
  }
  
  setRpcCreditsPerHash(rpcCreditsPerHash) {
    this.state.rpcCreditsPerHash = rpcCreditsPerHash;
    return this;
  }
  
    getId() {
    return this.state.id;
  }

  setId(id) {
    this.state.id = id;
    return this;
  }

  getAvgDownload() {
    return this.state.avgDownload;
  }

  setAvgDownload(avgDownload) {
    this.state.avgDownload = avgDownload;
    return this;
  }

  getAvgUpload() {
    return this.state.avgUpload;
  }

  setAvgUpload(avgUpload) {
    this.state.avgUpload = avgUpload;
    return this;
  }

  getCurrentDownload() {
    return this.state.currentDownload;
  }

  setCurrentDownload(currentDownload) {
    this.state.currentDownload = currentDownload;
    return this;
  }

  getCurrentUpload() {
    return this.state.currentUpload;
  }

  setCurrentUpload(currentUpload) {
    this.state.currentUpload = currentUpload;
    return this;
  }

  getHeight() {
    return this.state.height;
  }

  setHeight(height) {
    this.state.height = height;
    return this;
  }

  isIncoming() {
    return this.state.isIncoming;
  }

  setIsIncoming(isIncoming) {
    this.state.isIncoming = isIncoming;
    return this;
  }

  getLiveTime() {
    return this.state.liveTime;
  }

  setLiveTime(liveTime) {
    this.state.liveTime = liveTime;
    return this;
  }

  isLocalIp() {
    return this.state.isLocalIp;
  }

  setIsLocalIp(isLocalIp) {
    this.state.isLocalIp = isLocalIp;
    return this;
  }

  isLocalHost() {
    return this.state.isLocalHost;
  }

  setIsLocalHost(isLocalHost) {
    this.state.isLocalHost = isLocalHost;
    return this;
  }

  getNumReceives() {
    return this.state.numReceives;
  }

  setNumReceives(numReceives) {
    this.state.numReceives = numReceives;
    return this;
  }

  getNumSends() {
    return this.state.numSends;
  }

  setNumSends(numSends) {
    this.state.numSends = numSends;
    return this;
  }

  getReceiveIdleTime() {
    return this.state.receiveIdleTime;
  }

  setReceiveIdleTime(receiveIdleTime) {
    this.state.receiveIdleTime = receiveIdleTime;
    return this;
  }

  getSendIdleTime() {
    return this.state.sendIdleTime;
  }

  setSendIdleTime(sendIdleTime) {
    this.state.sendIdleTime = sendIdleTime;
    return this;
  }

  getState() {
    return this.state.state;
  }

  setState(state) {
    this.state.state = state;
    return this;
  }

  getNumSupportFlags() {
    return this.state.numSupportFlags;
  }

  setNumSupportFlags(numSupportFlags) {
    this.state.numSupportFlags = numSupportFlags;
    return this;
  }
  
  getType() {
    return this.state.type;
  }
  
  setType(type) {
    this.state.type = type;
    return this;
  }
}

module.exports = MoneroPeer;