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
  }
  
  getIsDoubleSpend() {
    return this.isDoubleSpend;
  }
  
  setIsDoubleSpend(isDoubleSpend) {
    this.isDoubleSpend = isDoubleSpend
  }
  
  getIsFeeTooLow() {
    return this.isFeeTooLow;
  }
  
  setIsFeeTooLow(isFeeTooLow) {
    this.isFeeTooLow = isFeeTooLow;
  }
  
  getIsMixinTooLow() {
    return this.isMixinTooLow;
  }
  
  setIsMixinTooLow(isMixinTooLow) {
    this.isMixinTooLow = isMixinTooLow;
  }
  
  getHasInvalidInput() {
    return this.hasInvalidInput;
  }
  
  setHasInvalidInput(hasInvalidInput) {
    this.hasInvalidInput = hasInvalidInput;
  }
  
  getHasInvalidOutput() {
    return this.hasInvalidOutput;
  }
  
  setHasInvalidOutput(hasInvalidOutput) {
    this.hasInvalidOutput = hasInvalidOutput;
  }
  
  getIsRct() {
    return this.isRct;
  }
  
  setIsRct(isRct) {
    this.isRct = isRct;
  }
  
  getIsOverspend() {
    return this.isOverspend;
  }
  
  setIsOverspend(isOverspend) {
    this.isOverspend = isOverspend;
  }
  
  getReason() {
    return this.reason;
  }
  
  setReason(reason) {
    this.reason = reason;
  }
  
  getIsTooBig() {
    return this.isTooBig;
  }
  
  setIsTooBig(isTooBig) {
    this.isTooBig = isTooBig;
  }
}

module.exports = MoneroSubmitTxResult;