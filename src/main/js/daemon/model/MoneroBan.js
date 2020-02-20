/**
 * Monero banhammer.
 */
class MoneroBan {
  
  constructor(state) {
    this.state = Object.assign({}, state);
  }
  
  toJson() {
    return Object.assign({}, this.state);
  }
  
  getHost() {
    return this.state.host;
  }
  
  setHost(host) {
    this.state.host = host;
    return this;
  }
  
  getIp() {
    return this.state.ip;
  }
  
  setIp(ip) {
    this.state.ip = ip;
    return this;
  }
  
  isBanned() {
    return this.state.isBanned;
  }
  
  setIsBanned(isBanned) {
    this.state.isBanned = isBanned;
    return this;
  }
  
  getSeconds() {
    return this.state.seconds;
  }
  
  setSeconds(seconds) {
    this.state.seconds = seconds;
    return this;
  }
}

module.exports = MoneroBan;