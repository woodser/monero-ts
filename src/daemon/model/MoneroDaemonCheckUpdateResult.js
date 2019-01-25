const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Models the result of checking for a daemon update.
 */
class MoneroDaemonCheckUpdateResult extends MoneroDaemonModel {
  
  /**
   * Indicates if an update is available.
   * 
   * @return {boolean} true if an update is available, false otherwise
   */
  getIsUpdateAvailable() {
    return this.isUpdateAvailable;
  }
  
  setIsUpdateAvailable(isUpdateAvailable) {
    this.isUpdateAvailable = isUpdateAvailable;
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
  }
  
  getPath() {
    return this.path;
  }
  
  setPath(path) {
    this.path = path;
  }
}

module.exports = MoneroDaemonCheckUpdateResult;