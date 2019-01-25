const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Models daemon mining status.
 */
class MoneroMiningStatus extends MoneroDaemonModel {
  
  getIsActive() {
    return this.isActive;
  }
  
  setIsActive(isActive) {
    this.isActive = isActive;
  }
  
  getAddress() {
    return this.address;
  }
  
  setAddress(address) {
    this.address = address;
  }
  
  getSpeed() {
    return this.speed;
  }
  
  setSpeed(speed) {
    this.speed = speed;
  }
  
  getThreadCount() {
    return this.threadCount;
  }
  
  setThreadCount(threadCount) {
    this.threadCount = threadCount;
  }
  
  getIsBackground() {
    return this.isBackground;
  }
  
  setIsBackground(isBackground) {
    this.isBackground = isBackground;
  }
}

module.exports = MoneroMiningStatus;