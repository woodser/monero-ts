import MoneroConnectionManager from "../../common/MoneroConnectionManager";
import MoneroNetworkType from "../../daemon/model/MoneroNetworkType";
import MoneroRpcConnection from "../../common/MoneroRpcConnection";
import MoneroUtils from "../../common/MoneroUtils";

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

  /** Node.js compatible file system to use (defaults to disk or in-memory FS if browser). */
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
   * @param {fs} [config.fs] - Node.js compatible file system to use (defaults to disk or in-memory FS if browser)
   * @param {boolean} [config.saveCurrent] - specifies if the current RPC wallet should be saved before being closed
   * @param {number} [config.accountLookahead] - number of accounts to scan (optional)
   * @param {number} [config.subaddressLookahead] - number of subaddresses to scan per account (optional)
   * @param {string[]} [config.cmd] - command to start wallet daemon (optional)
   */
  constructor(config?: Partial<MoneroWalletConfig>) {
    Object.assign(this, config);

    // normalize config
    if (this.server) this.setServer(this.server);
    this.setProxyToWorker(this.proxyToWorker);
    if (this.networkType !== undefined) this.networkType = MoneroNetworkType.from(this.networkType);
  }

  copy(): MoneroWalletConfig {
    return new MoneroWalletConfig(this);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (json.server) json.server = json.server.toJson();
    json.fs = undefined;
    json.connectionManager = undefined;
    return json;
  }
  
  getPath(): string {
    return this.path;
  }
  
  setPath(path: string): MoneroWalletConfig {
    this.path = path;
    return this;
  }
  
  getPassword(): string {
    return this.password;
  }
  
  setPassword(password): MoneroWalletConfig {
    this.password = password;
    return this;
  }
  
  getNetworkType(): MoneroNetworkType {
    return this.networkType;
  }
  
  setNetworkType(networkTypeOrStr: MoneroNetworkType | string): MoneroWalletConfig {
    this.networkType = networkTypeOrStr === undefined ? undefined : MoneroNetworkType.from(networkTypeOrStr);
    return this;
  }
  
  getServer(): MoneroRpcConnection {
    return this.server as MoneroRpcConnection;
  }
  
  setServer(server: Partial<MoneroRpcConnection> | string): MoneroWalletConfig {
    if (server && !(server instanceof MoneroRpcConnection)) server = new MoneroRpcConnection(server);
    this.server = server as MoneroRpcConnection;
    return this;
  }
  
  getConnectionManager(): MoneroConnectionManager {
    return this.connectionManager;
  }
  
  setConnectionManager(connectionManager: MoneroConnectionManager): MoneroWalletConfig {
    this.connectionManager = connectionManager;
    return this;
  }
  
  getSeed(): string {
    return this.seed;
  }
  
  setSeed(seed: string): MoneroWalletConfig {
    this.seed = seed;
    return this;
  }
  
  getSeedOffset(): string {
    return this.seedOffset;
  }
  
  setSeedOffset(seedOffset: string): MoneroWalletConfig {
    this.seedOffset = seedOffset;
    return this;
  }

  getIsMultisig(): boolean {
    return this.isMultisig;
  }
  
  setIsMultisig(isMultisig: boolean): MoneroWalletConfig {
    this.isMultisig = isMultisig;
    return this;
  }
  
  getPrimaryAddress(): string {
    return this.primaryAddress;
  }
  
  setPrimaryAddress(primaryAddress: string) {
    this.primaryAddress = primaryAddress;
    return this;
  }
  
  getPrivateViewKey(): string {
    return this.privateViewKey;
  }
  
  setPrivateViewKey(privateViewKey): MoneroWalletConfig {
    this.privateViewKey = privateViewKey;
    return this;
  }
  
  getPrivateSpendKey(): string {
    return this.privateSpendKey;
  }
  
  setPrivateSpendKey(privateSpendKey: string): MoneroWalletConfig {
    this.privateSpendKey = privateSpendKey;
    return this;
  }
  
  getRestoreHeight(): number {
    return this.restoreHeight;
  }
  
  setRestoreHeight(restoreHeight: number): MoneroWalletConfig {
    this.restoreHeight = restoreHeight;
    return this;
  }
  
  getLanguage(): string {
    return this.language;
  }
  
  setLanguage(language: string): MoneroWalletConfig {
    this.language = language;
    return this;
  }
  
  getSaveCurrent(): boolean {
    return this.saveCurrent;
  }
  
  setSaveCurrent(saveCurrent: boolean): MoneroWalletConfig {
    this.saveCurrent = saveCurrent;
    return this;
  }
  
  getProxyToWorker(): boolean {
    return this.proxyToWorker;
  }
  
  setProxyToWorker(proxyToWorker: boolean): MoneroWalletConfig {
    this.proxyToWorker = proxyToWorker;
    return this;
  }
  
  getFs(): any {
    return this.fs;
  }
  
  setFs(fs: any) {
    this.fs = fs;
    return this;
  }
  
  getKeysData(): Uint8Array {
    return this.keysData;
  }
  
  setKeysData(keysData: Uint8Array): MoneroWalletConfig {
    this.keysData = keysData;
    return this;
  }
  
  getCacheData(): Uint8Array {
    return this.cacheData;
  }
  
  setCacheData(cacheData: Uint8Array): MoneroWalletConfig {
    this.cacheData = cacheData;
    return this;
  }
  
  getAccountLookahead(): number {
    return this.accountLookahead;
  }
  
  setAccountLookahead(accountLookahead: number): MoneroWalletConfig {
    this.accountLookahead = accountLookahead;
    return this;
  }
  
  getSubaddressLookahead(): number {
    return this.subaddressLookahead;
  }
  
  setSubaddressLookahead(subaddressLookahead: number): MoneroWalletConfig {
    this.subaddressLookahead = subaddressLookahead;
    return this;
  }
}