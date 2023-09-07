export = MoneroDaemonUpdateDownloadResult;
/**
 * Models the result of downloading an update.
 */
declare class MoneroDaemonUpdateDownloadResult extends MoneroDaemonUpdateCheckResult {
    /**
     * Get the path the update was downloaded to.
     *
     * @return {string} is the path the update was downloaded to
     */
    getDownloadPath(): string;
    setDownloadPath(downloadPath: any): this;
}
import MoneroDaemonUpdateCheckResult = require("./MoneroDaemonUpdateCheckResult");
