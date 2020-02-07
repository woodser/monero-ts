/**
 * Models daemon mining status.
 */
class MoneroMiningStatus {
  
  constructor(state) {
    if (!state) state = {};
    else if (state instanceof MoneroMiningStatus) state = state.toJson();
    else if (typeof state === "object") state = Object.assign({}, state);
    else throw new MoneroError("state must be a MoneroMiningStatus or JavaScript object");
    this.state = state;
  }
  
  toJson() {
    return Object.assign({}, this.state);
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