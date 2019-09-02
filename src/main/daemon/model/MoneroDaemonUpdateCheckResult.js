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
    this.state = {};
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
    return this.state.isUpdateAvailable;
  }
  
  setIsUpdateAvailable(isUpdateAvailable) {
    this.state.isUpdateAvailable = isUpdateAvailable;
    return this;
  }
  
  /**
   * Get the update's version.
   * 
   * @return {string} is the update's version
   */
  getVersion() {
    return this.state.version;
  }
  
  setVersion(version) {
    this.state.version = version;
    return this;
  }
  
  /**
   * Get the update's hash.
   * 
   * @return {string} is the update's hash
   */
  getHash() {
    return this.state.hash;
  }
  
  setHash(hash) {
    this.state.hash = hash;
    return this;
  }
  
  /**
   * Get the uri to automatically download the update.
   * 
   * @return {string} is the uri to automatically download the update
   */
  getAutoUri() {
    return this.state.autoUri;
  }
  
  setAutoUri(autoUri) {
    this.state.autoUri = autoUri;
    return this;
  }
  
  /**
   * Get the uri to manually download the update.
   * 
   * @return {string} is the uri to manually download the update
   */
  getUserUri() {
    return this.state.userUri;
  }
  
  setUserUri(userUri) {
    this.state.userUri = userUri;
    return this;
  }
}

module.exports = MoneroDaemonUpdateCheckResult;