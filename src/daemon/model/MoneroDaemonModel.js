/**
 * Base daemon model including a reference to common daemon response information (status, isTrusted, etc).
 */
class MoneroDaemonModel {
  
  constructor(respInfo) {
    this.respInfo = respInfo;
  }
  
  getResponseInfo() {
    return this.respInfo;
  }
  
  setResponseInfo(respInfo) {
    this.respInfo = respInfo;
  }
}

module.exports = MoneroDaemonModel;