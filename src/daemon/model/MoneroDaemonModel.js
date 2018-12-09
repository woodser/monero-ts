/**
 * Base daemon model including a reference to common daemon response information (status, isTrusted, etc).
 */
class MoneroDaemonModel {
  
  constructor(respInfo) { // TODO: this should probably be changed to json and support removed for respInfo constructor
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