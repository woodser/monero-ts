/**
 * Models the result of checking for a daemon update.
 */
export default class MoneroDaemonUpdateCheckResult {

  isUpdateAvailable: boolean;
  version: string;
  hash: string;
  autoUri: string;
  userUri: string;
  
  constructor(result?: MoneroDaemonUpdateCheckResult) {
    Object.assign(this, result);
  }
  
  /**
   * Indicates if an update is available.
   * 
   * @return {boolean} true if an update is available, false otherwise
   */
  getIsUpdateAvailable(): boolean {
    return this.isUpdateAvailable;
  }
  
  setIsUpdateAvailable(isUpdateAvailable: boolean): MoneroDaemonUpdateCheckResult {
    this.isUpdateAvailable = isUpdateAvailable;
    return this;
  }
  
  /**
   * Get the update's version.
   * 
   * @return {string} is the update's version
   */
  getVersion(): string {
    return this.version;
  }
  
  setVersion(version: string): MoneroDaemonUpdateCheckResult {
    this.version = version;
    return this;
  }
  
  /**
   * Get the update's hash.
   * 
   * @return {string} is the update's hash
   */
  getHash(): string {
    return this.hash;
  }
  
  setHash(hash: string): MoneroDaemonUpdateCheckResult {
    this.hash = hash;
    return this;
  }
  
  /**
   * Get the uri to automatically download the update.
   * 
   * @return {string} is the uri to automatically download the update
   */
  getAutoUri(): string {
    return this.autoUri;
  }
  
  setAutoUri(autoUri: string): MoneroDaemonUpdateCheckResult {
    this.autoUri = autoUri;
    return this;
  }
  
  /**
   * Get the uri to manually download the update.
   * 
   * @return {string} is the uri to manually download the update
   */
  getUserUri(): string {
    return this.userUri;
  }
  
  setUserUri(userUri: string): MoneroDaemonUpdateCheckResult {
    this.userUri = userUri;
    return this;
  }
}