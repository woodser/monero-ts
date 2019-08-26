/**
 * Models the result from submitting a tx to a daemon.
 */
class MoneroSubmitTxResult {
  
  isGood() {
    return this.state.isGood;
  }
  
  setIsGood(isGood) {
    this.state.isGood = isGood;
    return this;
  }
  
  isRelayed() {
    return this.state.isRelayed;
  }
  
  setIsRelayed(isRelayed) {
    this.state.isRelayed = isRelayed;
    return this;
  }
  
  isDoubleSpend() {
    return this.state.isDoubleSpend;
  }
  
  setIsDoubleSpend(isDoubleSpend) {
    this.state.isDoubleSpend = isDoubleSpend
    return this;
  }
  
  isFeeTooLow() {
    return this.state.isFeeTooLow;
  }
  
  setIsFeeTooLow(isFeeTooLow) {
    this.state.isFeeTooLow = isFeeTooLow;
    return this;
  }
  
  isMixinTooLow() {
    return this.state.isMixinTooLow;
  }
  
  setIsMixinTooLow(isMixinTooLow) {
    this.state.isMixinTooLow = isMixinTooLow;
    return this;
  }
  
  getHasInvalidInput() {
    return this.state.hasInvalidInput;
  }
  
  setHasInvalidInput(hasInvalidInput) {
    this.state.hasInvalidInput = hasInvalidInput;
    return this;
  }
  
  getHasInvalidOutput() {
    return this.state.hasInvalidOutput;
  }
  
  setHasInvalidOutput(hasInvalidOutput) {
    this.state.hasInvalidOutput = hasInvalidOutput;
    return this;
  }
  
  isRct() {
    return this.state.isRct;
  }
  
  setIsRct(isRct) {
    this.state.isRct = isRct;
    return this;
  }
  
  isOverspend() {
    return this.state.isOverspend;
  }
  
  setIsOverspend(isOverspend) {
    this.state.isOverspend = isOverspend;
    return this;
  }
  
  getReason() {
    return this.state.reason;
  }
  
  setReason(reason) {
    this.state.reason = reason;
    return this;
  }
  
  isTooBig() {
    return this.state.isTooBig;
  }
  
  setIsTooBig(isTooBig) {
    this.state.isTooBig = isTooBig;
    return this;
  }
  
  getSanityCheckFailed() {
    return this.state.sanityCheckFailed;
  }
  
  setSanityCheckFailed(sanityCheckFailed) {
    this.state.sanityCheckFailed = sanityCheckFailed;
    return this;
  }
}

module.exports = MoneroSubmitTxResult;