const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Monero hard fork info.
 */
class MoneroHardForkInfo extends MoneroDaemonModel {
  
  getEarliestHeight() {
    return this.earliestHeight;
  }

  setEarliestHeight(earliestHeight) {
    this.earliestHeight = earliestHeight;
  }

  getIsEnabled() {
    return this.isEnabled;
  }

  setIsEnabled(isEnabled) {
    this.isEnabled = isEnabled;
  }

  getState() {
    return this.state;
  }

  setState(state) {
    this.state = state;
  }

  getThreshold() {
    return this.threshold;
  }

  setThreshold(threshold) {
    this.threshold = threshold;
  }

  getVersion() {
    return this.version;
  }

  setVersion(version) {
    this.version = version;
  }

  getVotes() {
    return this.votes;
  }

  setVotes(votes) {
    this.votes = votes;
  }

  getVoting() {
    return this.voting;
  }

  setVoting(voting) {
    this.voting = voting;
  }

  getWindow() {
    return this.window;
  }

  setWindow(window) {
    this.window = window;
  }
}

module.exports = MoneroHardForkInfo;