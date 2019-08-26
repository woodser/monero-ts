/**
 * Monero banhammer.
 */
class MoneroBan {
  
  getHost() {
    return this.host;
  }
  
  setHost(host) {
    this.host = host;
    return this;
  }
  
  getIp() {
    return this.ip;
  }
  
  setIp(ip) {
    this.ip = ip;
    return this;
  }
  
  isBanned() {
    return this.isBanned;
  }
  
  setIsBanned(isBanned) {
    this.isBanned = isBanned;
    return this;
  }
  
  getSeconds() {
    return this.seconds;
  }
  
  setSeconds(seconds) {
    this.seconds = seconds;
    return this;
  }
}

module.exports = MoneroBan;