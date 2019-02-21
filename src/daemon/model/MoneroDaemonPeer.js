/**
 * Models a peer to the daemon.
 */
class MoneroDaemonPeer {
  
  getId() {
    return this.id;
  }

  setId(id) {
    this.id = id;
    return this;
  }

  getAddress() {
    return this.address;
  }

  setAddress(address) {
    this.address = address;
    return this;
  }

  getHost() {
    return this.host;
  }

  setHost(host) {
    this.host = host;
    return this;
  }

  getPort() {
    return this.port;
  }

  setPort(port) {
    this.port = port;
    return this;
  }
  
  /**
   * Indicates if the peer was online when last checked (aka "white listed" as
   * opposed to "gray listed").
   * 
   * @return {boolean} true if peer was online when last checked, false otherwise
   */
  getIsOnline() {
    return this.isOnline;
  }
  
  setIsOnline(isOnline) {
    this.isOnline = isOnline;
    return this;
  }
  
  getLastSeenTimestamp() {
    return this.lastSeenTimestamp;
  }
  
  setLastSeenTimestamp(lastSeenTimestamp) {
    this.lastSeenTimestamp = lastSeenTimestamp;
    return this;
  }
  
  getPruningSeed() {
    return this.pruningSeed;
  }
  
  setPruningSeed(pruningSeed) {
    this.pruningSeed = pruningSeed;
    return this;
  }
}

module.exports = MoneroDaemonPeer;