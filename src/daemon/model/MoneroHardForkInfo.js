/**
 * Monero hard fork info.
 */
class MoneroHardForkInfo {
  
  getEarliestHeight() {
    return this.earliestHeight;
  }

  setEarliestHeight(earliestHeight) {
    this.earliestHeight = earliestHeight;
    return this;
  }

  isEnabled() {
    return this.isEnabled;
  }

  setIsEnabled(isEnabled) {
    this.isEnabled = isEnabled;
    return this;
  }

  getState() {
    return this.state;
  }

  setState(state) {
    this.state = state;
    return this;
  }

  getThreshold() {
    return this.threshold;
  }

  setThreshold(threshold) {
    this.threshold = threshold;
    return this;
  }

  getVersion() {
    return this.version;
  }

  setVersion(version) {
    this.version = version;
    return this;
  }

  getNumVotes() {
    return this.numVotes;
  }

  setNumVotes(numVotes) {
    this.numVotes = numVotes;
    return this;
  }

  getWindow() {
    return this.window;
  }

  setWindow(window) {
    this.window = window;
    return this;
  }

  getVoting() {
    return this.voting;
  }

  setVoting(voting) {
    this.voting = voting;
    return this;
  }
}

module.exports = MoneroHardForkInfo;