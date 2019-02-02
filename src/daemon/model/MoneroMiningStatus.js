/**
 * Models daemon mining status.
 */
class MoneroMiningStatus {
  
  getIsActive() {
    return this.isActive;
  }
  
  setIsActive(isActive) {
    this.isActive = isActive;
    return this;
  }
  
  getAddress() {
    return this.address;
  }
  
  setAddress(address) {
    this.address = address;
    return this;
  }
  
  getSpeed() {
    return this.speed;
  }
  
  setSpeed(speed) {
    this.speed = speed;
    return this;
  }
  
  getThreadCount() {
    return this.threadCount;
  }
  
  setThreadCount(threadCount) {
    this.threadCount = threadCount;
    return this;
  }
  
  getIsBackground() {
    return this.isBackground;
  }
  
  setIsBackground(isBackground) {
    this.isBackground = isBackground;
    return this;
  }
}

module.exports = MoneroMiningStatus;