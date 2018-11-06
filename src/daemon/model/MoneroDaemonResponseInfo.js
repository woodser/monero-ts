
/**
 * Model for common daemon response attributes.
 */
class MoneroDaemonResponseInfo {
  
  constructor(status, isTrusted) {
    this.status = status;
    this.isTrusted = isTrusted;
  }
  
  getStatus() {
    return this.status;
  }
  
  setStatus(status) {
    this.status = status;
  }
  
  getIsTrusted() {
    return this.isTrusted;
  }
  
  setIsTrusted(isTrusted) {
    this.isTrusted = isTrusted;
  }
}

module.exports = MoneroDaemonResponseInfo;