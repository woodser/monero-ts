/**
 * Monero banhammer.
 */
class MoneroBan {
  
  getHost() {
    return this.host;
  }
  
  setHost(host) {
    this.host = host;
  }
  
  getIp() {
    return this.ip;
  }
  
  setIp(ip) {
    this.ip = ip;
  }
  
  getIsBanned() {
    return this.isBanned;
  }
  
  setIsBanned(isBanned) {
    this.isBanned = isBanned;
  }
  
  getSeconds() {
    return this.seconds;
  }
  
  setSeconds(seconds) {
    this.seconds = seconds;
  }
}

module.exports = MoneroBan;