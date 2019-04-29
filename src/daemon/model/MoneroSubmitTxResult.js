/**
 * Models the result from submitting a tx to a daemon.
 */
class MoneroSubmitTxResult {
  
  getIsGood() {
    return this.isGood;
  }
  
  setIsGood(isGood) {
    this.isGood = isGood;
    return this;
  }
  
  getIsRelayed() {
    return this.isRelayed;
  }
  
  setIsRelayed(isRelayed) {
    this.isRelayed = isRelayed;
    return this;
  }
  
  getIsDoubleSpend() {
    return this.isDoubleSpend;
  }
  
  setIsDoubleSpend(isDoubleSpend) {
    this.isDoubleSpend = isDoubleSpend
    return this;
  }
  
  getIsFeeTooLow() {
    return this.isFeeTooLow;
  }
  
  setIsFeeTooLow(isFeeTooLow) {
    this.isFeeTooLow = isFeeTooLow;
    return this;
  }
  
  getIsMixinTooLow() {
    return this.isMixinTooLow;
  }
  
  setIsMixinTooLow(isMixinTooLow) {
    this.isMixinTooLow = isMixinTooLow;
    return this;
  }
  
  getHasInvalidInput() {
    return this.hasInvalidInput;
  }
  
  setHasInvalidInput(hasInvalidInput) {
    this.hasInvalidInput = hasInvalidInput;
    return this;
  }
  
  getHasInvalidOutput() {
    return this.hasInvalidOutput;
  }
  
  setHasInvalidOutput(hasInvalidOutput) {
    this.hasInvalidOutput = hasInvalidOutput;
    return this;
  }
  
  getIsRct() {
    return this.isRct;
  }
  
  setIsRct(isRct) {
    this.isRct = isRct;
    return this;
  }
  
  getIsOverspend() {
    return this.isOverspend;
  }
  
  setIsOverspend(isOverspend) {
    this.isOverspend = isOverspend;
    return this;
  }
  
  getReason() {
    return this.reason;
  }
  
  setReason(reason) {
    this.reason = reason;
    return this;
  }
  
  getIsTooBig() {
    return this.isTooBig;
  }
  
  setIsTooBig(isTooBig) {
    this.isTooBig = isTooBig;
    return this;
  }
  
  getSanityCheckFailed() {
    return this.sanityCheckFailed;
  }
  
  setSanityCheckFailed(sanityCheckFailed) {
    this.sanityCheckFailed = sanityCheckFailed;
    return this;
  }
}

module.exports = MoneroSubmitTxResult;