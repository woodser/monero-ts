/**
 * Monero daemon connection span.
 */
class MoneroDaemonConnectionSpan {
  
  getConnectionId() {
    return this.connectionId;
  }

  setConnectionId(connectionId) {
    this.connectionId = connectionId;
    return this;
  }
  
  getNumBlocks() {
    return this.numBlocks;
  }

  setNumBlocks(numBlocks) {
    this.numBlocks = numBlocks;
    return this;
  }
  
  getRemoteAddress() {
    return this.remoteAddress;
  }

  setRemoteAddress(remoteAddress) {
    this.remoteAddress = remoteAddress;
    return this;
  }
  
  getRate() {
    return this.rate;
  }

  setRate(rate) {
    this.rate = rate;
    return this;
  }
  
  getSpeed() {
    return this.speed;
  }

  setSpeed(speed) {
    this.speed = speed;
    return this;
  }
  
  getSize() {
    return this.size;
  }
  
  setSize(size) {
    this.size = size;
    return this;
  }
  
  getStartBlockHeight() {
    return this.startBlockHeight;
  }
  
  setStartBlockHeight(startBlockHeight) {
    this.startBlockHeight = startBlockHeight;
    return this;
  }
}

module.exports = MoneroDaemonConnectionSpan;