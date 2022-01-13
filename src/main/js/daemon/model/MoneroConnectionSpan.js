/**
 * Monero daemon connection span.
 */
class MoneroConnectionSpan {
  
  constructor(state) {
    this.state = Object.assign({}, state);
  }
  
  toJson() {
    return Object.assign({}, this.state);
  }
  
  getConnectionId() {
    return this.state.connectionId;
  }

  setConnectionId(connectionId) {
    this.state.connectionId = connectionId;
    return this;
  }
  
  getNumBlocks() {
    return this.state.numBlocks;
  }

  setNumBlocks(numBlocks) {
    this.state.numBlocks = numBlocks;
    return this;
  }
  
  getRemoteAddress() {
    return this.state.remoteAddress;
  }

  setRemoteAddress(remoteAddress) {
    this.state.remoteAddress = remoteAddress;
    return this;
  }
  
  getRate() {
    return this.state.rate;
  }

  setRate(rate) {
    this.state.rate = rate;
    return this;
  }
  
  getSpeed() {
    return this.state.speed;
  }

  setSpeed(speed) {
    this.state.speed = speed;
    return this;
  }
  
  getSize() {
    return this.state.size;
  }
  
  setSize(size) {
    this.state.size = size;
    return this;
  }
  
  getStartHeight() {
    return this.state.startHeight;
  }
  
  setStartHeight(startHeight) {
    this.state.startHeight = startHeight;
    return this;
  }
}

module.exports = MoneroConnectionSpan;