const assert = require("assert");

/**
 * Models the result of checking for a daemon update.
 */
class MoneroDaemonUpdateCheckResult {
  
  /**
   * Deep copy constructor.
   * 
   * @param {MoneroDaemonUpdateCheckResult} is an existing result to deep copy from
   */
  constructor(result) {
    if (result !== undefined) {
      assert(result instanceof MoneroDaemonUpdateCheckResult);
      this.setIsUpdateAvailable(result.isUpdateAvailable());
      this.setVersion(result.getVersion());
      this.setHash(result.getHash());
      this.setAutoUri(result.getAutoUri());
      this.setUserUri(result.getUserUri());
    }
  }
  
  /**
   * Indicates if an update is available.
   * 
   * @return {boolean} true if an update is available, false otherwise
   */
  isUpdateAvailable() {
    return this.isUpdateAvailable;
  }
  
  setIsUpdateAvailable(isUpdateAvailable) {
    this.isUpdateAvailable = isUpdateAvailable;
    return this;
  }
  
  /**
   * Get the update's version.
   * 
   * @return {string} is the update's version
   */
  getVersion() {
    return this.version;
  }
  
  setVersion(version) {
    this.version = version;
    return this;
  }
  
  /**
   * Get the update's hash.
   * 
   * @return {string} is the update's hash
   */
  getHash() {
    return this.hash;
  }
  
  setHash(hash) {
    this.hash = hash;
    return this;
  }
  
  /**
   * Get the uri to automatically download the update.
   * 
   * @return {string} is the uri to automatically download the update
   */
  getAutoUri() {
    return this.autoUri;
  }
  
  setAutoUri(autoUri) {
    this.autoUri = autoUri;
    return this;
  }
  
  /**
   * Get the uri to manually download the update.
   * 
   * @return {string} is the uri to manually download the update
   */
  getUserUri() {
    return this.userUri;
  }
  
  setUserUri(userUri) {
    this.userUri = userUri;
    return this;
  }
}

module.exports = MoneroDaemonUpdateCheckResult;