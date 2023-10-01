/**
 * Models the result of checking for a daemon update.
 */
export default class MoneroDaemonUpdateCheckResult {
    isUpdateAvailable: boolean;
    version: string;
    hash: string;
    autoUri: string;
    userUri: string;
    constructor(result?: MoneroDaemonUpdateCheckResult);
    /**
     * Indicates if an update is available.
     *
     * @return {boolean} true if an update is available, false otherwise
     */
    getIsUpdateAvailable(): boolean;
    setIsUpdateAvailable(isUpdateAvailable: boolean): MoneroDaemonUpdateCheckResult;
    /**
     * Get the update's version.
     *
     * @return {string} is the update's version
     */
    getVersion(): string;
    setVersion(version: string): MoneroDaemonUpdateCheckResult;
    /**
     * Get the update's hash.
     *
     * @return {string} is the update's hash
     */
    getHash(): string;
    setHash(hash: string): MoneroDaemonUpdateCheckResult;
    /**
     * Get the uri to automatically download the update.
     *
     * @return {string} is the uri to automatically download the update
     */
    getAutoUri(): string;
    setAutoUri(autoUri: string): MoneroDaemonUpdateCheckResult;
    /**
     * Get the uri to manually download the update.
     *
     * @return {string} is the uri to manually download the update
     */
    getUserUri(): string;
    setUserUri(userUri: string): MoneroDaemonUpdateCheckResult;
}
