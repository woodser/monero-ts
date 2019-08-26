/**
 * Models daemon mining status.
 */
class MoneroMiningStatus {
  
  constructor() {
    this.state = {};
  }
  
  isActive() {
    return this.state.isActive;
  }
  
  setIsActive(isActive) {
    this.state.isActive = isActive;
    return this;
  }
  
  getAddress() {
    return this.state.address;
  }
  
  setAddress(address) {
    this.state.address = address;
    return this;
  }
  
  getSpeed() {
    return this.state.speed;
  }
  
  setSpeed(speed) {
    this.state.speed = speed;
    return this;
  }
  
  getNumThreads() {
    return this.state.numThreads;
  }
  
  setNumThreads(numThreads) {
    this.state.numThreads = numThreads;
    return this;
  }
  
  isBackground() {
    return this.state.isBackground;
  }
  
  setIsBackground(isBackground) {
    this.state.isBackground = isBackground;
    return this;
  }
}

module.exports = MoneroMiningStatus;