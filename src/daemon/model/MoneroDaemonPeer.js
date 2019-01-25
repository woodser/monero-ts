const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Models a peer to the daemon.
 */
class MoneroDaemonPeer extends MoneroDaemonModel {
  
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

  getHost() {
    return this.host;
  }

  setHost(host) {
    this.host = host;
  }

  getPort() {
    return this.port;
  }

  setPort(port) {
    this.port = port;
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
  }
  
  getLastSeen() {
    return this.lastSeen;
  }
  
  setLastSeen(lastSeen) {
    this.lastSeen = lastSeen;
  }
}

module.exports = MoneroDaemonPeer;