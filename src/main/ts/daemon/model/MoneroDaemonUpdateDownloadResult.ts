import MoneroDaemonUpdateCheckResult from "./MoneroDaemonUpdateCheckResult";

/**
 * Models the result of downloading an update.
 */
export default class MoneroDaemonUpdateDownloadResult extends MoneroDaemonUpdateCheckResult {

  downloadPath: string;
  
  constructor(state: MoneroDaemonUpdateDownloadResult) {
    super(state);
  }
  
  /**
   * Get the path the update was downloaded to.
   * 
   * @return {string} is the path the update was downloaded to
   */
  getDownloadPath(): string {
    return this.downloadPath;
  }
  
  setDownloadPath(downloadPath: string): MoneroDaemonUpdateDownloadResult {
    this.downloadPath = downloadPath;
    return this;
  }
}