import MoneroConnectionManager from "../../common/MoneroConnectionManager";
import MoneroNetworkType from "../../daemon/model/MoneroNetworkType";
import MoneroRpcConnection from "../../common/MoneroRpcConnection";
/**
 * Configuration to create a Monero wallet.
 */
export default class MoneroWalletConfig {
    /** Path to the wallet to open or create. */
    path: string;
    /** Password of the wallet to open or create. */
    password: string;
    /** Network type of the wallet to open or create. */
    networkType: MoneroNetworkType;
    /** Server config to monerod or monero-wallet-rpc. */
    server: string | Partial<MoneroRpcConnection>;
    /** Govern the wallet's server connection. */
    connectionManager: MoneroConnectionManager;
    /** Seed of the wallet to ceate (random wallet created if neither seed nor keys given). */
    seed: string;
    /** Offset to derive a new seed from the given seed to recover a secret wallet. */
    seedOffset: string;
    /** Indicates if the wallet seed is multisig. */
    isMultisig: boolean;
    /** Primary address of the wallet to create (only provide if restoring from keys). */
    primaryAddress: string;
    /** Private view key of the wallet to create. */
    privateViewKey: string;
    /** Private spend key of the wallet to create. */
    privateSpendKey: string;
    /** Block height to start scanning from (defaults to 0 unless generating random wallet). */
    restoreHeight: number;
    /** Language of the wallet's seed phrase (defaults to "English" or auto-detected). */
    language: string;
    /** Specifies if the currently open RPC wallet should be saved before being closed. */
    saveCurrent: boolean;
    /** Proxies wallet operations to a worker in order to not block the main thread (default true). */
    proxyToWorker: boolean;
    /** File system compatible with Node.js `fs.promises` API (defaults to disk or in-memory FS if browser). */
    fs: any;
    /** Wallet keys data to open. */
    keysData: Uint8Array;
    /** Wallet cache data to open. */
    cacheData: Uint8Array;
    /** Number of accounts to scan (optional). */
    accountLookahead: number;
    /** Number of subaddresses to scan per account (optional). */
    subaddressLookahead: number;
    /** Command to start monero-wallet-rpc as a child process. */
    cmd: string[];
    /**
     * Construct a configuration to open or create a wallet.
     *
     * @param {Partial<MoneroWalletConfig>} [config] - MoneroWalletConfig or equivalent config object
     * @param {string} [config.path] - path of the wallet to open or create
     * @param {string} [config.password] - password of the wallet to open
     * @param {string|number} [config.networkType] - network type of the wallet to open (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
     * @param {string} [config.seed] - seed of the wallet to create (optional, random wallet created if neither seed nor keys given)
     * @param {string} [config.seedOffset] - the offset used to derive a new seed from the given seed to recover a secret wallet from the seed phrase
     * @param {boolean} [config.isMultisig] - restore multisig wallet from seed
     * @param {string} [config.primaryAddress] - primary address of the wallet to create (only provide if restoring from keys)
     * @param {string} [config.privateViewKey] - private view key of the wallet to create (optional)
     * @param {string} [config.privateSpendKey] - private spend key of the wallet to create (optional)
     * @param {number} [config.restoreHeight] - block height to start scanning from (defaults to 0 unless generating random wallet)
     * @param {string} [config.language] - language of the wallet's seed phrase (defaults to "English" or auto-detected)
     * @param {number} [config.accountLookahead] -  number of accounts to scan (optional)
     * @param {number} [config.subaddressLookahead] - number of subaddresses to scan per account (optional)
     * @param {string|Partial<MoneroRpcConnection>} [config.server] - uri or MoneroRpcConnection to the wallet's server (optional)
     * @param {MoneroConnectionManager} [config.connectionManager] - manage connections to monerod (optional)
     * @param {boolean} [config.rejectUnauthorized] - reject self-signed server certificates if true (default true)
     * @param {Uint8Array} [config.keysData] - wallet keys data to open (optional)
     * @param {Uint8Array} [config.cacheData] - wallet cache data to open (optional)
     * @param {boolean} [config.proxyToWorker] - proxies wallet operations to a worker in order to not block the main thread (default true)
     * @param {any} [config.fs] - file system compatible with Node.js `fs.promises` API (defaults to disk or in-memory FS if browser)
     * @param {boolean} [config.saveCurrent] - specifies if the current RPC wallet should be saved before being closed
     * @param {number} [config.accountLookahead] - number of accounts to scan (optional)
     * @param {number} [config.subaddressLookahead] - number of subaddresses to scan per account (optional)
     * @param {string[]} [config.cmd] - command to start wallet daemon (optional)
     */
    constructor(config?: Partial<MoneroWalletConfig>);
    copy(): MoneroWalletConfig;
    toJson(): any;
    getPath(): string;
    setPath(path: string): MoneroWalletConfig;
    getPassword(): string;
    setPassword(password: any): MoneroWalletConfig;
    getNetworkType(): MoneroNetworkType;
    setNetworkType(networkTypeOrStr: MoneroNetworkType | string): MoneroWalletConfig;
    getServer(): MoneroRpcConnection;
    setServer(server: Partial<MoneroRpcConnection> | string): MoneroWalletConfig;
    getConnectionManager(): MoneroConnectionManager;
    setConnectionManager(connectionManager: MoneroConnectionManager): MoneroWalletConfig;
    getSeed(): string;
    setSeed(seed: string): MoneroWalletConfig;
    getSeedOffset(): string;
    setSeedOffset(seedOffset: string): MoneroWalletConfig;
    getIsMultisig(): boolean;
    setIsMultisig(isMultisig: boolean): MoneroWalletConfig;
    getPrimaryAddress(): string;
    setPrimaryAddress(primaryAddress: string): this;
    getPrivateViewKey(): string;
    setPrivateViewKey(privateViewKey: any): MoneroWalletConfig;
    getPrivateSpendKey(): string;
    setPrivateSpendKey(privateSpendKey: string): MoneroWalletConfig;
    getRestoreHeight(): number;
    setRestoreHeight(restoreHeight: number): MoneroWalletConfig;
    getLanguage(): string;
    setLanguage(language: string): MoneroWalletConfig;
    getSaveCurrent(): boolean;
    setSaveCurrent(saveCurrent: boolean): MoneroWalletConfig;
    getProxyToWorker(): boolean;
    setProxyToWorker(proxyToWorker: boolean): MoneroWalletConfig;
    getFs(): any;
    setFs(fs: any): this;
    getKeysData(): Uint8Array;
    setKeysData(keysData: Uint8Array): MoneroWalletConfig;
    getCacheData(): Uint8Array;
    setCacheData(cacheData: Uint8Array): MoneroWalletConfig;
    getAccountLookahead(): number;
    setAccountLookahead(accountLookahead: number): MoneroWalletConfig;
    getSubaddressLookahead(): number;
    setSubaddressLookahead(subaddressLookahead: number): MoneroWalletConfig;
}
