export = MoneroWalletConfig;
/**
 * Configuration to create a Monero wallet.
 */
declare class MoneroWalletConfig {
    /**
     * Construct a configuration to open or create a wallet.
     *
     * @param {object|MoneroWalletConfig} config - MoneroWalletConfig or equivalent config object
     * @param {string} config.path - path of the wallet to open or create
     * @param {string} config.password - password of the wallet to open
     * @param {string|number} config.networkType - network type of the wallet to open (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
     * @param {string} config.seed - seed of the wallet to create (optional, random wallet created if neither seed nor keys given)
     * @param {string} config.seedOffset - the offset used to derive a new seed from the given seed to recover a secret wallet from the seed phrase
     * @param {boolean} config.isMultisig - restore multisig wallet from seed
     * @param {string} config.primaryAddress - primary address of the wallet to create (only provide if restoring from keys)
     * @param {string} config.privateViewKey - private view key of the wallet to create (optional)
     * @param {string} config.privateSpendKey - private spend key of the wallet to create (optional)
     * @param {number} config.restoreHeight - block height to start scanning from (defaults to 0 unless generating random wallet)
     * @param {string} config.language - language of the wallet's seed phrase (defaults to "English" or auto-detected)
     * @param {number} config.accountLookahead -  number of accounts to scan (optional)
     * @param {number} config.subaddressLookahead - number of subaddresses to scan per account (optional)
     * @param {MoneroRpcConnection|object} config.server - MoneroRpcConnection or equivalent JS object configuring the server connection (optional)
     * @param {string} config.serverUri - uri of the wallet's server (optional)
     * @param {string} config.serverUsername - username of the wallet's server (optional)
     * @param {string} config.serverPassword - password of the wallet's server (optional)
     * @param {boolean} config.rejectUnauthorized - reject self-signed server certificates if true (default true)
     * @param {Uint8Array} config.keysData - wallet keys data to open (optional)
     * @param {Uint8Array} config.cacheData - wallet cache data to open (optional)
     * @param {boolean} config.proxyToWorker - proxies wallet operations to a worker in order to not block the main thread (default true)
     * @param {fs} config.fs - Node.js compatible file system to use (defaults to disk or in-memory FS if browser)
     * @param {boolean} config.saveCurrent - specifies if the current RPC wallet should be saved before being closed
     * @param {number} config.accountLookahead - number of accounts to scan (optional)
     * @param {number} config.subaddressLookahead - number of subaddresses to scan per account (optional)
     */
    constructor(config: object | MoneroWalletConfig);
    config: any;
    copy(): MoneroWalletConfig;
    toJson(): any;
    getPath(): any;
    setPath(path: any): this;
    getPassword(): any;
    setPassword(password: any): this;
    getNetworkType(): any;
    setNetworkType(networkTypeOrStr: any): this;
    getServer(): any;
    setServer(server: any): this;
    getServerUri(): any;
    setServerUri(serverUri: any): this;
    getServerUsername(): any;
    setServerUsername(serverUsername: any): this;
    getServerPassword(): any;
    setServerPassword(serverPassword: any): this;
    getRejectUnauthorized(): any;
    setRejectUnauthorized(rejectUnauthorized: any): this;
    getSeed(): any;
    setSeed(seed: any): this;
    getSeedOffset(): any;
    setSeedOffset(seedOffset: any): this;
    isMultisig(): any;
    setIsMultisig(isMultisig: any): this;
    getPrimaryAddress(): any;
    setPrimaryAddress(primaryAddress: any): this;
    getPrivateViewKey(): any;
    setPrivateViewKey(privateViewKey: any): this;
    getPrivateSpendKey(): any;
    setPrivateSpendKey(privateSpendKey: any): this;
    getRestoreHeight(): any;
    setRestoreHeight(restoreHeight: any): this;
    getLanguage(): any;
    setLanguage(language: any): this;
    getSaveCurrent(): any;
    setSaveCurrent(saveCurrent: any): this;
    getProxyToWorker(): any;
    setProxyToWorker(proxyToWorker: any): this;
    getFs(): any;
    setFs(fs: any): this;
    getKeysData(): any;
    setKeysData(keysData: any): this;
    getCacheData(): any;
    setCacheData(cacheData: any): this;
    getAccountLookahead(): any;
    setAccountLookahead(accountLookahead: any): this;
    getSubaddressLookahead(): any;
    setSubaddressLookahead(subaddressLookahead: any): this;
}
declare namespace MoneroWalletConfig {
    let SUPPORTED_FIELDS: string[];
}
