import MoneroDaemonUpdateCheckResult from "./MoneroDaemonUpdateCheckResult";
/**
 * Models the result of downloading an update.
 */
export default class MoneroDaemonUpdateDownloadResult extends MoneroDaemonUpdateCheckResult {
    downloadPath: string;
    constructor(state: MoneroDaemonUpdateDownloadResult);
    /**
     * Get the path the update was downloaded to.
     *
     * @return {string} is the path the update was downloaded to
     */
    getDownloadPath(): string;
    setDownloadPath(downloadPath: string): MoneroDaemonUpdateDownloadResult;
}
