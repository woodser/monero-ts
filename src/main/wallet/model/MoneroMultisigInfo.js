package monero.wallet.model;

/**
 * Models information about a multisig wallet.
 */
class MoneroMultisigInfo {
  
  constructor() {
    this.state = {};
  }
  
  isMultisig() {
    return this.state.isMultisig;
  }
  
  setIsMultisig(isMultsig) {
    this.state.isMultisig = isMultisig;
    return this;
  }
  
  isReady() {
    return this.state.isReady;
  }
  
  setIsReady(isReady) {
    this.state.isReady = isReady;
  }
  
  getThreshold() {
    return this.state.threshold;
  }
  
  setThreshold(threshold) {
    this.state.threshold = threshold;
  }
  
  getNumParticipants() {
    return this.state.numParticipants;
  }
  
  setNumParticipants(numParticipants) {
    this.state.numParticipants = numParticipants;
  }
}

module.exports = MoneroMultisigInfo;