"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _assert = _interopRequireDefault(require("assert"));
var _GenUtils = _interopRequireDefault(require("../common/GenUtils"));
var _LibraryUtils = _interopRequireDefault(require("../common/LibraryUtils"));
var _TaskLooper = _interopRequireDefault(require("../common/TaskLooper"));
var _MoneroAccount = _interopRequireDefault(require("./model/MoneroAccount"));
var _MoneroAccountTag = _interopRequireDefault(require("./model/MoneroAccountTag"));
var _MoneroAddressBookEntry = _interopRequireDefault(require("./model/MoneroAddressBookEntry"));
var _MoneroBlock = _interopRequireDefault(require("../daemon/model/MoneroBlock"));
var _MoneroBlockHeader = _interopRequireDefault(require("../daemon/model/MoneroBlockHeader"));
var _MoneroCheckReserve = _interopRequireDefault(require("./model/MoneroCheckReserve"));
var _MoneroCheckTx = _interopRequireDefault(require("./model/MoneroCheckTx"));
var _MoneroDestination = _interopRequireDefault(require("./model/MoneroDestination"));
var _MoneroError = _interopRequireDefault(require("../common/MoneroError"));
var _MoneroIncomingTransfer = _interopRequireDefault(require("./model/MoneroIncomingTransfer"));
var _MoneroIntegratedAddress = _interopRequireDefault(require("./model/MoneroIntegratedAddress"));
var _MoneroKeyImage = _interopRequireDefault(require("../daemon/model/MoneroKeyImage"));
var _MoneroKeyImageImportResult = _interopRequireDefault(require("./model/MoneroKeyImageImportResult"));
var _MoneroMultisigInfo = _interopRequireDefault(require("./model/MoneroMultisigInfo"));
var _MoneroMultisigInitResult = _interopRequireDefault(require("./model/MoneroMultisigInitResult"));
var _MoneroMultisigSignResult = _interopRequireDefault(require("./model/MoneroMultisigSignResult"));
var _MoneroOutgoingTransfer = _interopRequireDefault(require("./model/MoneroOutgoingTransfer"));
var _MoneroOutputQuery = _interopRequireDefault(require("./model/MoneroOutputQuery"));
var _MoneroOutputWallet = _interopRequireDefault(require("./model/MoneroOutputWallet"));
var _MoneroRpcConnection = _interopRequireDefault(require("../common/MoneroRpcConnection"));
var _MoneroRpcError = _interopRequireDefault(require("../common/MoneroRpcError"));
var _MoneroSubaddress = _interopRequireDefault(require("./model/MoneroSubaddress"));
var _MoneroSyncResult = _interopRequireDefault(require("./model/MoneroSyncResult"));

var _MoneroTransferQuery = _interopRequireDefault(require("./model/MoneroTransferQuery"));

var _MoneroTxConfig = _interopRequireDefault(require("./model/MoneroTxConfig"));

var _MoneroTxQuery = _interopRequireDefault(require("./model/MoneroTxQuery"));
var _MoneroTxSet = _interopRequireDefault(require("./model/MoneroTxSet"));
var _MoneroTxWallet = _interopRequireDefault(require("./model/MoneroTxWallet"));
var _MoneroUtils = _interopRequireDefault(require("../common/MoneroUtils"));
var _MoneroVersion = _interopRequireDefault(require("../daemon/model/MoneroVersion"));
var _MoneroWallet = _interopRequireDefault(require("./MoneroWallet"));
var _MoneroWalletConfig = _interopRequireDefault(require("./model/MoneroWalletConfig"));
var _MoneroWalletListener = _interopRequireDefault(require("./model/MoneroWalletListener"));
var _MoneroMessageSignatureType = _interopRequireDefault(require("./model/MoneroMessageSignatureType"));
var _MoneroMessageSignatureResult = _interopRequireDefault(require("./model/MoneroMessageSignatureResult"));
var _ThreadPool = _interopRequireDefault(require("../common/ThreadPool"));
var _SslOptions = _interopRequireDefault(require("../common/SslOptions"));function _getRequireWildcardCache(nodeInterop) {if (typeof WeakMap !== "function") return null;var cacheBabelInterop = new WeakMap();var cacheNodeInterop = new WeakMap();return (_getRequireWildcardCache = function (nodeInterop) {return nodeInterop ? cacheNodeInterop : cacheBabelInterop;})(nodeInterop);}function _interopRequireWildcard(obj, nodeInterop) {if (!nodeInterop && obj && obj.__esModule) {return obj;}if (obj === null || typeof obj !== "object" && typeof obj !== "function") {return { default: obj };}var cache = _getRequireWildcardCache(nodeInterop);if (cache && cache.has(obj)) {return cache.get(obj);}var newObj = {};var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;for (var key in obj) {if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;if (desc && (desc.get || desc.set)) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}newObj.default = obj;if (cache) {cache.set(obj, newObj);}return newObj;}


/**
 * Copyright (c) woodser
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Implements a MoneroWallet as a client of monero-wallet-rpc.
 * 
 * @implements {MoneroWallet}
 */
class MoneroWalletRpc extends _MoneroWallet.default {

  // static variables
  static DEFAULT_SYNC_PERIOD_IN_MS = 20000; // default period between syncs in ms (defined by DEFAULT_AUTO_REFRESH_PERIOD in wallet_rpc_server.cpp)

  // instance variables










  /** @private */
  constructor(config) {
    super();
    this.config = config;
    this.addressCache = {}; // avoid unecessary requests for addresses
    this.syncPeriodInMs = MoneroWalletRpc.DEFAULT_SYNC_PERIOD_IN_MS;
  }

  // --------------------------- RPC WALLET METHODS ---------------------------

  /**
   * Get the internal process running monero-wallet-rpc.
   * 
   * @return {ChildProcess} the process running monero-wallet-rpc, undefined if not created from new process
   */
  getProcess() {
    return this.process;
  }

  /**
   * Stop the internal process running monero-wallet-rpc, if applicable.
   * 
   * @param {boolean} force specifies if the process should be destroyed forcibly (default false)
   * @return {Promise<number | undefined>} the exit code from stopping the process
   */
  async stopProcess(force = false) {
    if (this.process === undefined) throw new _MoneroError.default("MoneroWalletRpc instance not created from new process");
    let listenersCopy = _GenUtils.default.copyArray(this.getListeners());
    for (let listener of listenersCopy) await this.removeListener(listener);
    return _GenUtils.default.killProcess(this.process, force ? "SIGKILL" : undefined);
  }

  /**
   * Get the wallet's RPC connection.
   * 
   * @return {MoneroRpcConnection | undefined} the wallet's rpc connection
   */
  getRpcConnection() {
    return this.config.getServer();
  }

  /**
   * <p>Open an existing wallet on the monero-wallet-rpc server.</p>
   * 
   * <p>Example:<p>
   * 
   * <code>
   * let wallet = new MoneroWalletRpc("http://localhost:38084", "rpc_user", "abc123");<br>
   * await wallet.openWallet("mywallet1", "supersecretpassword");<br>
   * <br>
   * await wallet.openWallet({<br>
   * &nbsp;&nbsp; path: "mywallet2",<br>
   * &nbsp;&nbsp; password: "supersecretpassword",<br>
   * &nbsp;&nbsp; server: "http://locahost:38081", // or object with uri, username, password, etc <br>
   * &nbsp;&nbsp; rejectUnauthorized: false<br>
   * });<br>
   * </code>
   * 
   * @param {string|MoneroWalletConfig} pathOrConfig  - the wallet's name or configuration to open
   * @param {string} pathOrConfig.path - path of the wallet to create (optional, in-memory wallet if not given)
   * @param {string} pathOrConfig.password - password of the wallet to create
   * @param {string|Partial<MoneroRpcConnection>} pathOrConfig.server - uri or MoneroRpcConnection of a daemon to use (optional, monero-wallet-rpc usually started with daemon config)
   * @param {string} [password] the wallet's password
   * @return {Promise<MoneroWalletRpc>} this wallet client
   */
  async openWallet(pathOrConfig, password) {

    // normalize and validate config
    let config = new _MoneroWalletConfig.default(typeof pathOrConfig === "string" ? { path: pathOrConfig, password: password ? password : "" } : pathOrConfig);
    // TODO: ensure other fields uninitialized?

    // open wallet on rpc server
    if (!config.getPath()) throw new _MoneroError.default("Must provide name of wallet to open");
    if (config.getRegtest() !== undefined) throw new _MoneroError.default("Cannot specify regtest mode when opening RPC wallet");
    await this.config.getServer().sendJsonRequest("open_wallet", { filename: config.getPath(), password: config.getPassword() });
    await this.clear();
    this.path = config.getPath();

    // set connection manager or server
    if (config.getConnectionManager() != null) {
      if (config.getServer()) throw new _MoneroError.default("Wallet can be opened with a server or connection manager but not both");
      await this.setConnectionManager(config.getConnectionManager());
    } else if (config.getServer() != null) {
      await this.setDaemonConnection(config.getServer());
    }

    return this;
  }

  /**
   * <p>Create and open a wallet on the monero-wallet-rpc server.<p>
   * 
   * <p>Example:<p>
   * 
   * <code>
   * &sol;&sol; construct client to monero-wallet-rpc<br>
   * let walletRpc = new MoneroWalletRpc("http://localhost:38084", "rpc_user", "abc123");<br><br>
   * 
   * &sol;&sol; create and open wallet on monero-wallet-rpc<br>
   * await walletRpc.createWallet({<br>
   * &nbsp;&nbsp; path: "mywallet",<br>
   * &nbsp;&nbsp; password: "abc123",<br>
   * &nbsp;&nbsp; seed: "coexist igloo pamphlet lagoon...",<br>
   * &nbsp;&nbsp; restoreHeight: 1543218l<br>
   * });
   *  </code>
   * 
   * @param {Partial<MoneroWalletConfig>} config - MoneroWalletConfig or equivalent JS object
   * @param {string} [config.path] - path of the wallet to create (optional, in-memory wallet if not given)
   * @param {string} [config.password] - password of the wallet to create
   * @param {string} [config.seed] - seed of the wallet to create (optional, random wallet created if neither seed nor keys given)
   * @param {string} [config.seedOffset] - the offset used to derive a new seed from the given seed to recover a secret wallet from the seed
   * @param {boolean} [config.isMultisig] - restore multisig wallet from seed
   * @param {string} [config.primaryAddress] - primary address of the wallet to create (only provide if restoring from keys)
   * @param {string} [config.privateViewKey] - private view key of the wallet to create (optional)
   * @param {string} [config.privateSpendKey] - private spend key of the wallet to create (optional)
   * @param {number} [config.restoreHeight] - block height to start scanning from (defaults to 0 unless generating random wallet)
   * @param {string} [config.language] - language of the wallet's mnemonic phrase or seed (defaults to "English" or auto-detected)
   * @param {MoneroRpcConnection} [config.server] - MoneroRpcConnection to a monero daemon (optional)<br>
   * @param {string} [config.serverUri] - uri of a daemon to use (optional, monero-wallet-rpc usually started with daemon config)
   * @param {string} [config.serverUsername] - username to authenticate with the daemon (optional)
   * @param {string} [config.serverPassword] - password to authenticate with the daemon (optional)
   * @param {MoneroConnectionManager} [config.connectionManager] - manage connections to monerod (optional)
   * @param {boolean} [config.rejectUnauthorized] - reject self-signed server certificates if true (defaults to true)
   * @param {MoneroRpcConnection} [config.server] - MoneroRpcConnection or equivalent JS object providing daemon configuration (optional)
   * @param {boolean} [config.saveCurrent] - specifies if the current RPC wallet should be saved before being closed (default true)
   * @return {MoneroWalletRpc} this wallet client
   */
  async createWallet(config) {

    // normalize and validate config
    if (config === undefined) throw new _MoneroError.default("Must provide config to create wallet");
    const configNormalized = new _MoneroWalletConfig.default(config);
    if (configNormalized.getSeed() !== undefined && (configNormalized.getPrimaryAddress() !== undefined || configNormalized.getPrivateViewKey() !== undefined || configNormalized.getPrivateSpendKey() !== undefined)) {
      throw new _MoneroError.default("Wallet can be initialized with a seed or keys but not both");
    }
    if (configNormalized.getRegtest() !== undefined) throw new _MoneroError.default("Cannot specify regtest mode when creating RPC wallet");
    if (configNormalized.getNetworkType() !== undefined) throw new _MoneroError.default("Cannot provide networkType when creating RPC wallet because server's network type is already set");
    if (configNormalized.getAccountLookahead() !== undefined || configNormalized.getSubaddressLookahead() !== undefined) throw new _MoneroError.default("monero-wallet-rpc does not support creating wallets with subaddress lookahead over rpc");
    if (configNormalized.getPassword() === undefined) configNormalized.setPassword("");

    // set server from connection manager if provided
    if (configNormalized.getConnectionManager()) {
      if (configNormalized.getServer()) throw new _MoneroError.default("Wallet can be created with a server or connection manager but not both");
      configNormalized.setServer(config.getConnectionManager().getConnection());
    }

    // create wallet
    if (configNormalized.getSeed() !== undefined) await this.createWalletFromSeed(configNormalized);else
    if (configNormalized.getPrivateSpendKey() !== undefined || configNormalized.getPrimaryAddress() !== undefined) await this.createWalletFromKeys(configNormalized);else
    await this.createWalletRandom(configNormalized);

    // set connection manager or server
    if (configNormalized.getConnectionManager()) {
      await this.setConnectionManager(configNormalized.getConnectionManager());
    } else if (configNormalized.getServer()) {
      await this.setDaemonConnection(configNormalized.getServer());
    }

    return this;
  }

  async createWalletRandom(config) {
    if (config.getSeedOffset() !== undefined) throw new _MoneroError.default("Cannot provide seedOffset when creating random wallet");
    if (config.getRestoreHeight() !== undefined) throw new _MoneroError.default("Cannot provide restoreHeight when creating random wallet");
    if (config.getSaveCurrent() === false) throw new _MoneroError.default("Current wallet is saved automatically when creating random wallet");
    if (!config.getPath()) throw new _MoneroError.default("Name is not initialized");
    if (!config.getLanguage()) config.setLanguage(_MoneroWallet.default.DEFAULT_LANGUAGE);
    let params = { filename: config.getPath(), password: config.getPassword(), language: config.getLanguage() };
    try {
      await this.config.getServer().sendJsonRequest("create_wallet", params);
    } catch (err) {
      this.handleCreateWalletError(config.getPath(), err);
    }
    await this.clear();
    this.path = config.getPath();
    return this;
  }

  async createWalletFromSeed(config) {
    try {
      await this.config.getServer().sendJsonRequest("restore_deterministic_wallet", {
        filename: config.getPath(),
        password: config.getPassword(),
        seed: config.getSeed(),
        seed_offset: config.getSeedOffset(),
        enable_multisig_experimental: config.getIsMultisig(),
        restore_height: config.getRestoreHeight(),
        language: config.getLanguage(),
        autosave_current: config.getSaveCurrent()
      });
    } catch (err) {
      this.handleCreateWalletError(config.getPath(), err);
    }
    await this.clear();
    this.path = config.getPath();
    return this;
  }

  async createWalletFromKeys(config) {
    if (config.getSeedOffset() !== undefined) throw new _MoneroError.default("Cannot provide seedOffset when creating wallet from keys");
    if (config.getRestoreHeight() === undefined) config.setRestoreHeight(0);
    if (config.getLanguage() === undefined) config.setLanguage(_MoneroWallet.default.DEFAULT_LANGUAGE);
    try {
      await this.config.getServer().sendJsonRequest("generate_from_keys", {
        filename: config.getPath(),
        password: config.getPassword(),
        address: config.getPrimaryAddress(),
        viewkey: config.getPrivateViewKey(),
        spendkey: config.getPrivateSpendKey(),
        restore_height: config.getRestoreHeight(),
        autosave_current: config.getSaveCurrent()
      });
    } catch (err) {
      this.handleCreateWalletError(config.getPath(), err);
    }
    await this.clear();
    this.path = config.getPath();
    return this;
  }

  handleCreateWalletError(name, err) {
    if (err.message) {
      if (err.message.toLowerCase().includes("already exists")) throw new _MoneroRpcError.default("Wallet already exists: " + name, err.getCode(), err.getRpcMethod(), err.getRpcParams());
      if (err.message.toLowerCase().includes("word list failed verification")) throw new _MoneroRpcError.default("Invalid mnemonic", err.getCode(), err.getRpcMethod(), err.getRpcParams());
    }
    throw err;
  }

  async isViewOnly() {
    try {
      await this.config.getServer().sendJsonRequest("query_key", { key_type: "mnemonic" });
      return false; // key retrieval succeeds if not view only
    } catch (e) {
      if (e.getCode() === -29) return true; // wallet is view only
      if (e.getCode() === -1) return false; // wallet is offline but not view only
      throw e;
    }
  }

  /**
   * Set the wallet's daemon connection.
   * 
   * @param {string|MoneroRpcConnection} [uriOrConnection] - the daemon's URI or connection (defaults to offline)
   * @param {boolean} isTrusted - indicates if the daemon in trusted
   * @param {SslOptions} sslOptions - custom SSL configuration
   */
  async setDaemonConnection(uriOrConnection, isTrusted, sslOptions) {
    let connection = !uriOrConnection ? undefined : uriOrConnection instanceof _MoneroRpcConnection.default ? uriOrConnection : new _MoneroRpcConnection.default(uriOrConnection);
    if (!sslOptions) sslOptions = new _SslOptions.default();
    let params = {};
    params.address = connection ? connection.getUri() : "bad_uri"; // TODO monero-wallet-rpc: bad daemon uri necessary for offline?
    params.username = connection ? connection.getUsername() : "";
    params.password = connection ? connection.getPassword() : "";
    params.trusted = isTrusted;
    params.ssl_support = "autodetect";
    params.ssl_private_key_path = sslOptions.getPrivateKeyPath();
    params.ssl_certificate_path = sslOptions.getCertificatePath();
    params.ssl_ca_file = sslOptions.getCertificateAuthorityFile();
    params.ssl_allowed_fingerprints = sslOptions.getAllowedFingerprints();
    params.ssl_allow_any_cert = sslOptions.getAllowAnyCert();

    // set proxy which must match startup proxy if applicable
    if (connection && connection.getProxyUri() === undefined) {
      if (this.startupProxyUri !== undefined) throw new _MoneroError.default("Cannot set daemon connection without proxy URI because monero-wallet-rpc was started with a proxy URI: " + this.startupProxyUri);
    } else {
      if (this.startupProxyUri === undefined) params.proxy = connection ? connection.getProxyUri() : "";else
      if (this.startupProxyUri !== connection.getProxyUri()) {
        throw new _MoneroError.default("Cannot set daemon connection with proxy URI " + connection.getProxyUri() + " because monero-wallet-rpc was started with a different proxy URI: " + this.startupProxyUri);
      }
    }
    if (!params.proxy) params.proxy = "";

    await this.config.getServer().sendJsonRequest("set_daemon", params);
    this.daemonConnection = connection;
  }

  async getDaemonConnection() {
    return this.daemonConnection;
  }

  /**
   * Get the total and unlocked balances in a single request.
   * 
   * @param {number} [accountIdx] account index
   * @param {number} [subaddressIdx] subaddress index
   * @return {Promise<bigint[]>} is the total and unlocked balances in an array, respectively
   */
  async getBalances(accountIdx, subaddressIdx) {
    if (accountIdx === undefined) {
      _assert.default.equal(subaddressIdx, undefined, "Must provide account index with subaddress index");
      let balance = BigInt(0);
      let unlockedBalance = BigInt(0);
      for (let account of await this.getAccounts()) {
        balance = balance + account.getBalance();
        unlockedBalance = unlockedBalance + account.getUnlockedBalance();
      }
      return [balance, unlockedBalance];
    } else {
      let params = { account_index: accountIdx, address_indices: subaddressIdx === undefined ? undefined : [subaddressIdx] };
      let resp = await this.config.getServer().sendJsonRequest("get_balance", params);
      if (subaddressIdx === undefined) return [BigInt(resp.result.balance), BigInt(resp.result.unlocked_balance)];else
      return [BigInt(resp.result.per_subaddress[0].balance), BigInt(resp.result.per_subaddress[0].unlocked_balance)];
    }
  }

  // -------------------------- COMMON WALLET METHODS -------------------------

  async addListener(listener) {
    await super.addListener(listener);
    this.refreshListening();
  }

  async removeListener(listener) {
    await super.removeListener(listener);
    this.refreshListening();
  }

  async isConnectedToDaemon() {
    try {
      await this.checkReserveProof(await this.getPrimaryAddress(), "", ""); // TODO (monero-project): provide better way to know if wallet rpc is connected to daemon
      throw new _MoneroError.default("check reserve expected to fail");
    } catch (e) {
      if (e instanceof _MoneroError.default && e.getCode() === -13) throw e; // no wallet file
      return e.message.indexOf("Failed to connect to daemon") < 0;
    }
  }

  async getVersion() {
    let resp = await this.config.getServer().sendJsonRequest("get_version");
    return new _MoneroVersion.default(resp.result.version, resp.result.release);
  }

  async getPath() {
    return this.path;
  }

  async getSeed() {
    let resp = await this.config.getServer().sendJsonRequest("query_key", { key_type: "mnemonic" });
    return resp.result.key;
  }

  async getSeedLanguage() {
    if ((await this.getSeed()) === undefined) return undefined;
    throw new _MoneroError.default("MoneroWalletRpc.getSeedLanguage() not supported");
  }

  /**
   * Get a list of available languages for the wallet's seed.
   * 
   * @return {string[]} the available languages for the wallet's seed.
   */
  async getSeedLanguages() {
    return (await this.config.getServer().sendJsonRequest("get_languages")).result.languages;
  }

  async getPrivateViewKey() {
    let resp = await this.config.getServer().sendJsonRequest("query_key", { key_type: "view_key" });
    return resp.result.key;
  }

  async getPrivateSpendKey() {
    let resp = await this.config.getServer().sendJsonRequest("query_key", { key_type: "spend_key" });
    return resp.result.key;
  }

  async getAddress(accountIdx, subaddressIdx) {
    let subaddressMap = this.addressCache[accountIdx];
    if (!subaddressMap) {
      await this.getSubaddresses(accountIdx, undefined, true); // cache's all addresses at this account
      return this.getAddress(accountIdx, subaddressIdx); // recursive call uses cache
    }
    let address = subaddressMap[subaddressIdx];
    if (!address) {
      await this.getSubaddresses(accountIdx, undefined, true); // cache's all addresses at this account
      return this.addressCache[accountIdx][subaddressIdx];
    }
    return address;
  }

  // TODO: use cache
  async getAddressIndex(address) {

    // fetch result and normalize error if address does not belong to the wallet
    let resp;
    try {
      resp = await this.config.getServer().sendJsonRequest("get_address_index", { address: address });
    } catch (e) {
      if (e.getCode() === -2) throw new _MoneroError.default(e.message);
      throw e;
    }

    // convert rpc response
    let subaddress = new _MoneroSubaddress.default({ address: address });
    subaddress.setAccountIndex(resp.result.index.major);
    subaddress.setIndex(resp.result.index.minor);
    return subaddress;
  }

  async getIntegratedAddress(standardAddress, paymentId) {
    try {
      let integratedAddressStr = (await this.config.getServer().sendJsonRequest("make_integrated_address", { standard_address: standardAddress, payment_id: paymentId })).result.integrated_address;
      return await this.decodeIntegratedAddress(integratedAddressStr);
    } catch (e) {
      if (e.message.includes("Invalid payment ID")) throw new _MoneroError.default("Invalid payment ID: " + paymentId);
      throw e;
    }
  }

  async decodeIntegratedAddress(integratedAddress) {
    let resp = await this.config.getServer().sendJsonRequest("split_integrated_address", { integrated_address: integratedAddress });
    return new _MoneroIntegratedAddress.default().setStandardAddress(resp.result.standard_address).setPaymentId(resp.result.payment_id).setIntegratedAddress(integratedAddress);
  }

  async getHeight() {
    return (await this.config.getServer().sendJsonRequest("get_height")).result.height;
  }

  async getDaemonHeight() {
    throw new _MoneroError.default("monero-wallet-rpc does not support getting the chain height");
  }

  async getHeightByDate(year, month, day) {
    throw new _MoneroError.default("monero-wallet-rpc does not support getting a height by date");
  }

  async sync(listenerOrStartHeight, startHeight) {
    (0, _assert.default)(!(listenerOrStartHeight instanceof _MoneroWalletListener.default), "Monero Wallet RPC does not support reporting sync progress");
    try {
      let resp = await this.config.getServer().sendJsonRequest("refresh", { start_height: startHeight });
      await this.poll();
      return new _MoneroSyncResult.default(resp.result.blocks_fetched, resp.result.received_money);
    } catch (err) {
      if (err.message === "no connection to daemon") throw new _MoneroError.default("Wallet is not connected to daemon");
      throw err;
    }
  }

  async startSyncing(syncPeriodInMs) {

    // convert ms to seconds for rpc parameter
    let syncPeriodInSeconds = Math.round((syncPeriodInMs === undefined ? MoneroWalletRpc.DEFAULT_SYNC_PERIOD_IN_MS : syncPeriodInMs) / 1000);

    // send rpc request
    await this.config.getServer().sendJsonRequest("auto_refresh", {
      enable: true,
      period: syncPeriodInSeconds
    });

    // update sync period for poller
    this.syncPeriodInMs = syncPeriodInSeconds * 1000;
    if (this.walletPoller !== undefined) this.walletPoller.setPeriodInMs(this.syncPeriodInMs);

    // poll if listening
    await this.poll();
  }

  getSyncPeriodInMs() {
    return this.syncPeriodInMs;
  }

  async stopSyncing() {
    return this.config.getServer().sendJsonRequest("auto_refresh", { enable: false });
  }

  async scanTxs(txHashes) {
    if (!txHashes || !txHashes.length) throw new _MoneroError.default("No tx hashes given to scan");
    await this.config.getServer().sendJsonRequest("scan_tx", { txids: txHashes });
    await this.poll();
  }

  async rescanSpent() {
    await this.config.getServer().sendJsonRequest("rescan_spent", undefined);
  }

  async rescanBlockchain() {
    await this.config.getServer().sendJsonRequest("rescan_blockchain", undefined);
  }

  async getBalance(accountIdx, subaddressIdx) {
    return (await this.getBalances(accountIdx, subaddressIdx))[0];
  }

  async getUnlockedBalance(accountIdx, subaddressIdx) {
    return (await this.getBalances(accountIdx, subaddressIdx))[1];
  }

  async getAccounts(includeSubaddresses, tag, skipBalances) {

    // fetch accounts from rpc
    let resp = await this.config.getServer().sendJsonRequest("get_accounts", { tag: tag });

    // build account objects and fetch subaddresses per account using get_address
    // TODO monero-wallet-rpc: get_address should support all_accounts so not called once per account
    let accounts = [];
    for (let rpcAccount of resp.result.subaddress_accounts) {
      let account = MoneroWalletRpc.convertRpcAccount(rpcAccount);
      if (includeSubaddresses) account.setSubaddresses(await this.getSubaddresses(account.getIndex(), undefined, true));
      accounts.push(account);
    }

    // fetch and merge fields from get_balance across all accounts
    if (includeSubaddresses && !skipBalances) {

      // these fields are not initialized if subaddress is unused and therefore not returned from `get_balance`
      for (let account of accounts) {
        for (let subaddress of account.getSubaddresses()) {
          subaddress.setBalance(BigInt(0));
          subaddress.setUnlockedBalance(BigInt(0));
          subaddress.setNumUnspentOutputs(0);
          subaddress.setNumBlocksToUnlock(0);
        }
      }

      // fetch and merge info from get_balance
      resp = await this.config.getServer().sendJsonRequest("get_balance", { all_accounts: true });
      if (resp.result.per_subaddress) {
        for (let rpcSubaddress of resp.result.per_subaddress) {
          let subaddress = MoneroWalletRpc.convertRpcSubaddress(rpcSubaddress);

          // merge info
          let account = accounts[subaddress.getAccountIndex()];
          _assert.default.equal(subaddress.getAccountIndex(), account.getIndex(), "RPC accounts are out of order"); // would need to switch lookup to loop
          let tgtSubaddress = account.getSubaddresses()[subaddress.getIndex()];
          _assert.default.equal(subaddress.getIndex(), tgtSubaddress.getIndex(), "RPC subaddresses are out of order");
          if (subaddress.getBalance() !== undefined) tgtSubaddress.setBalance(subaddress.getBalance());
          if (subaddress.getUnlockedBalance() !== undefined) tgtSubaddress.setUnlockedBalance(subaddress.getUnlockedBalance());
          if (subaddress.getNumUnspentOutputs() !== undefined) tgtSubaddress.setNumUnspentOutputs(subaddress.getNumUnspentOutputs());
        }
      }
    }

    return accounts;
  }

  // TODO: getAccountByIndex(), getAccountByTag()
  async getAccount(accountIdx, includeSubaddresses, skipBalances) {
    (0, _assert.default)(accountIdx >= 0);
    for (let account of await this.getAccounts()) {
      if (account.getIndex() === accountIdx) {
        if (includeSubaddresses) account.setSubaddresses(await this.getSubaddresses(accountIdx, undefined, skipBalances));
        return account;
      }
    }
    throw new Error("Account with index " + accountIdx + " does not exist");
  }

  async createAccount(label) {
    label = label ? label : undefined;
    let resp = await this.config.getServer().sendJsonRequest("create_account", { label: label });
    return new _MoneroAccount.default({
      index: resp.result.account_index,
      primaryAddress: resp.result.address,
      label: label,
      balance: BigInt(0),
      unlockedBalance: BigInt(0)
    });
  }

  async getSubaddresses(accountIdx, subaddressIndices, skipBalances) {

    // fetch subaddresses
    let params = {};
    params.account_index = accountIdx;
    if (subaddressIndices) params.address_index = _GenUtils.default.listify(subaddressIndices);
    let resp = await this.config.getServer().sendJsonRequest("get_address", params);

    // initialize subaddresses
    let subaddresses = [];
    for (let rpcSubaddress of resp.result.addresses) {
      let subaddress = MoneroWalletRpc.convertRpcSubaddress(rpcSubaddress);
      subaddress.setAccountIndex(accountIdx);
      subaddresses.push(subaddress);
    }

    // fetch and initialize subaddress balances
    if (!skipBalances) {

      // these fields are not initialized if subaddress is unused and therefore not returned from `get_balance`
      for (let subaddress of subaddresses) {
        subaddress.setBalance(BigInt(0));
        subaddress.setUnlockedBalance(BigInt(0));
        subaddress.setNumUnspentOutputs(0);
        subaddress.setNumBlocksToUnlock(0);
      }

      // fetch and initialize balances
      resp = await this.config.getServer().sendJsonRequest("get_balance", params);
      if (resp.result.per_subaddress) {
        for (let rpcSubaddress of resp.result.per_subaddress) {
          let subaddress = MoneroWalletRpc.convertRpcSubaddress(rpcSubaddress);

          // transfer info to existing subaddress object
          for (let tgtSubaddress of subaddresses) {
            if (tgtSubaddress.getIndex() !== subaddress.getIndex()) continue; // skip to subaddress with same index
            if (subaddress.getBalance() !== undefined) tgtSubaddress.setBalance(subaddress.getBalance());
            if (subaddress.getUnlockedBalance() !== undefined) tgtSubaddress.setUnlockedBalance(subaddress.getUnlockedBalance());
            if (subaddress.getNumUnspentOutputs() !== undefined) tgtSubaddress.setNumUnspentOutputs(subaddress.getNumUnspentOutputs());
            if (subaddress.getNumBlocksToUnlock() !== undefined) tgtSubaddress.setNumBlocksToUnlock(subaddress.getNumBlocksToUnlock());
          }
        }
      }
    }

    // cache addresses
    let subaddressMap = this.addressCache[accountIdx];
    if (!subaddressMap) {
      subaddressMap = {};
      this.addressCache[accountIdx] = subaddressMap;
    }
    for (let subaddress of subaddresses) {
      subaddressMap[subaddress.getIndex()] = subaddress.getAddress();
    }

    // return results
    return subaddresses;
  }

  async getSubaddress(accountIdx, subaddressIdx, skipBalances) {
    (0, _assert.default)(accountIdx >= 0);
    (0, _assert.default)(subaddressIdx >= 0);
    return (await this.getSubaddresses(accountIdx, [subaddressIdx], skipBalances))[0];
  }

  async createSubaddress(accountIdx, label) {

    // send request
    let resp = await this.config.getServer().sendJsonRequest("create_address", { account_index: accountIdx, label: label });

    // build subaddress object
    let subaddress = new _MoneroSubaddress.default();
    subaddress.setAccountIndex(accountIdx);
    subaddress.setIndex(resp.result.address_index);
    subaddress.setAddress(resp.result.address);
    subaddress.setLabel(label ? label : undefined);
    subaddress.setBalance(BigInt(0));
    subaddress.setUnlockedBalance(BigInt(0));
    subaddress.setNumUnspentOutputs(0);
    subaddress.setIsUsed(false);
    subaddress.setNumBlocksToUnlock(0);
    return subaddress;
  }

  async setSubaddressLabel(accountIdx, subaddressIdx, label) {
    await this.config.getServer().sendJsonRequest("label_address", { index: { major: accountIdx, minor: subaddressIdx }, label: label });
  }

  async getTxs(query) {

    // copy query
    const queryNormalized = _MoneroWallet.default.normalizeTxQuery(query);

    // temporarily disable transfer and output queries in order to collect all tx information
    let transferQuery = queryNormalized.getTransferQuery();
    let inputQuery = queryNormalized.getInputQuery();
    let outputQuery = queryNormalized.getOutputQuery();
    queryNormalized.setTransferQuery(undefined);
    queryNormalized.setInputQuery(undefined);
    queryNormalized.setOutputQuery(undefined);

    // fetch all transfers that meet tx query
    let transfers = await this.getTransfersAux(new _MoneroTransferQuery.default().setTxQuery(MoneroWalletRpc.decontextualize(queryNormalized.copy())));

    // collect unique txs from transfers while retaining order
    let txs = [];
    let txsSet = new Set();
    for (let transfer of transfers) {
      if (!txsSet.has(transfer.getTx())) {
        txs.push(transfer.getTx());
        txsSet.add(transfer.getTx());
      }
    }

    // cache types into maps for merging and lookup
    let txMap = {};
    let blockMap = {};
    for (let tx of txs) {
      MoneroWalletRpc.mergeTx(tx, txMap, blockMap);
    }

    // fetch and merge outputs if requested
    if (queryNormalized.getIncludeOutputs() || outputQuery) {

      // fetch outputs
      let outputQueryAux = (outputQuery ? outputQuery.copy() : new _MoneroOutputQuery.default()).setTxQuery(MoneroWalletRpc.decontextualize(queryNormalized.copy()));
      let outputs = await this.getOutputsAux(outputQueryAux);

      // merge output txs one time while retaining order
      let outputTxs = [];
      for (let output of outputs) {
        if (!outputTxs.includes(output.getTx())) {
          MoneroWalletRpc.mergeTx(output.getTx(), txMap, blockMap);
          outputTxs.push(output.getTx());
        }
      }
    }

    // restore transfer and output queries
    queryNormalized.setTransferQuery(transferQuery);
    queryNormalized.setInputQuery(inputQuery);
    queryNormalized.setOutputQuery(outputQuery);

    // filter txs that don't meet transfer query
    let txsQueried = [];
    for (let tx of txs) {
      if (queryNormalized.meetsCriteria(tx)) txsQueried.push(tx);else
      if (tx.getBlock() !== undefined) tx.getBlock().getTxs().splice(tx.getBlock().getTxs().indexOf(tx), 1);
    }
    txs = txsQueried;

    // special case: re-fetch txs if inconsistency caused by needing to make multiple rpc calls
    for (let tx of txs) {
      if (tx.getIsConfirmed() && tx.getBlock() === undefined || !tx.getIsConfirmed() && tx.getBlock() !== undefined) {
        console.error("Inconsistency detected building txs from multiple rpc calls, re-fetching txs");
        return this.getTxs(queryNormalized);
      }
    }

    // order txs if tx hashes given then return
    if (queryNormalized.getHashes() && queryNormalized.getHashes().length > 0) {
      let txsById = new Map(); // store txs in temporary map for sorting
      for (let tx of txs) txsById.set(tx.getHash(), tx);
      let orderedTxs = [];
      for (let hash of queryNormalized.getHashes()) if (txsById.get(hash)) orderedTxs.push(txsById.get(hash));
      txs = orderedTxs;
    }
    return txs;
  }

  async getTransfers(query) {

    // copy and normalize query up to block
    const queryNormalized = _MoneroWallet.default.normalizeTransferQuery(query);

    // get transfers directly if query does not require tx context (other transfers, outputs)
    if (!MoneroWalletRpc.isContextual(queryNormalized)) return this.getTransfersAux(queryNormalized);

    // otherwise get txs with full models to fulfill query
    let transfers = [];
    for (let tx of await this.getTxs(queryNormalized.getTxQuery())) {
      for (let transfer of tx.filterTransfers(queryNormalized)) {
        transfers.push(transfer);
      }
    }

    return transfers;
  }

  async getOutputs(query) {

    // copy and normalize query up to block
    const queryNormalized = _MoneroWallet.default.normalizeOutputQuery(query);

    // get outputs directly if query does not require tx context (other outputs, transfers)
    if (!MoneroWalletRpc.isContextual(queryNormalized)) return this.getOutputsAux(queryNormalized);

    // otherwise get txs with full models to fulfill query
    let outputs = [];
    for (let tx of await this.getTxs(queryNormalized.getTxQuery())) {
      for (let output of tx.filterOutputs(queryNormalized)) {
        outputs.push(output);
      }
    }

    return outputs;
  }

  async exportOutputs(all = false) {
    return (await this.config.getServer().sendJsonRequest("export_outputs", { all: all })).result.outputs_data_hex;
  }

  async importOutputs(outputsHex) {
    let resp = await this.config.getServer().sendJsonRequest("import_outputs", { outputs_data_hex: outputsHex });
    return resp.result.num_imported;
  }

  async exportKeyImages(all = false) {
    return await this.rpcExportKeyImages(all);
  }

  async importKeyImages(keyImages) {

    // convert key images to rpc parameter
    let rpcKeyImages = keyImages.map((keyImage) => ({ key_image: keyImage.getHex(), signature: keyImage.getSignature() }));

    // send request
    let resp = await this.config.getServer().sendJsonRequest("import_key_images", { signed_key_images: rpcKeyImages });

    // build and return result
    let importResult = new _MoneroKeyImageImportResult.default();
    importResult.setHeight(resp.result.height);
    importResult.setSpentAmount(BigInt(resp.result.spent));
    importResult.setUnspentAmount(BigInt(resp.result.unspent));
    return importResult;
  }

  async getNewKeyImagesFromLastImport() {
    return await this.rpcExportKeyImages(false);
  }

  async freezeOutput(keyImage) {
    return this.config.getServer().sendJsonRequest("freeze", { key_image: keyImage });
  }

  async thawOutput(keyImage) {
    return this.config.getServer().sendJsonRequest("thaw", { key_image: keyImage });
  }

  async isOutputFrozen(keyImage) {
    let resp = await this.config.getServer().sendJsonRequest("frozen", { key_image: keyImage });
    return resp.result.frozen === true;
  }

  async getDefaultFeePriority() {
    let resp = await this.config.getServer().sendJsonRequest("get_default_fee_priority");
    return resp.result.priority;
  }

  async createTxs(config) {

    // validate, copy, and normalize config
    const configNormalized = _MoneroWallet.default.normalizeCreateTxsConfig(config);
    if (configNormalized.getCanSplit() === undefined) configNormalized.setCanSplit(true);
    if (configNormalized.getRelay() === true && (await this.isMultisig())) throw new _MoneroError.default("Cannot relay multisig transaction until co-signed");

    // determine account and subaddresses to send from
    let accountIdx = configNormalized.getAccountIndex();
    if (accountIdx === undefined) throw new _MoneroError.default("Must provide the account index to send from");
    let subaddressIndices = configNormalized.getSubaddressIndices() === undefined ? undefined : configNormalized.getSubaddressIndices().slice(0); // fetch all or copy given indices

    // build config parameters
    let params = {};
    params.destinations = [];
    for (let destination of configNormalized.getDestinations()) {
      (0, _assert.default)(destination.getAddress(), "Destination address is not defined");
      (0, _assert.default)(destination.getAmount(), "Destination amount is not defined");
      params.destinations.push({ address: destination.getAddress(), amount: destination.getAmount().toString() });
    }
    if (configNormalized.getSubtractFeeFrom()) params.subtract_fee_from_outputs = configNormalized.getSubtractFeeFrom();
    params.account_index = accountIdx;
    params.subaddr_indices = subaddressIndices;
    params.payment_id = configNormalized.getPaymentId();
    params.do_not_relay = configNormalized.getRelay() !== true;
    (0, _assert.default)(configNormalized.getPriority() === undefined || configNormalized.getPriority() >= 0 && configNormalized.getPriority() <= 3);
    params.priority = configNormalized.getPriority();
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    if (configNormalized.getCanSplit()) params.get_tx_keys = true; // param to get tx key(s) depends if split
    else params.get_tx_key = true;

    // cannot apply subtractFeeFrom with `transfer_split` call
    if (configNormalized.getCanSplit() && configNormalized.getSubtractFeeFrom() && configNormalized.getSubtractFeeFrom().length > 0) {
      throw new _MoneroError.default("subtractfeefrom transfers cannot be split over multiple transactions yet");
    }

    // send request
    let result;
    try {
      let resp = await this.config.getServer().sendJsonRequest(configNormalized.getCanSplit() ? "transfer_split" : "transfer", params);
      result = resp.result;
    } catch (err) {
      if (err.message.indexOf("WALLET_RPC_ERROR_CODE_WRONG_ADDRESS") > -1) throw new _MoneroError.default("Invalid destination address");
      throw err;
    }

    // pre-initialize txs iff present. multisig and view-only wallets will have tx set without transactions
    let txs;
    let numTxs = configNormalized.getCanSplit() ? result.fee_list !== undefined ? result.fee_list.length : 0 : result.fee !== undefined ? 1 : 0;
    if (numTxs > 0) txs = [];
    let copyDestinations = numTxs === 1;
    for (let i = 0; i < numTxs; i++) {
      let tx = new _MoneroTxWallet.default();
      MoneroWalletRpc.initSentTxWallet(configNormalized, tx, copyDestinations);
      tx.getOutgoingTransfer().setAccountIndex(accountIdx);
      if (subaddressIndices !== undefined && subaddressIndices.length === 1) tx.getOutgoingTransfer().setSubaddressIndices(subaddressIndices);
      txs.push(tx);
    }

    // notify of changes
    if (configNormalized.getRelay()) await this.poll();

    // initialize tx set from rpc response with pre-initialized txs
    if (configNormalized.getCanSplit()) return MoneroWalletRpc.convertRpcSentTxsToTxSet(result, txs, configNormalized).getTxs();else
    return MoneroWalletRpc.convertRpcTxToTxSet(result, txs === undefined ? undefined : txs[0], true, configNormalized).getTxs();
  }

  async sweepOutput(config) {

    // normalize and validate config
    config = _MoneroWallet.default.normalizeSweepOutputConfig(config);

    // build request parameters
    let params = {};
    params.address = config.getDestinations()[0].getAddress();
    params.account_index = config.getAccountIndex();
    params.subaddr_indices = config.getSubaddressIndices();
    params.key_image = config.getKeyImage();
    params.do_not_relay = config.getRelay() !== true;
    (0, _assert.default)(config.getPriority() === undefined || config.getPriority() >= 0 && config.getPriority() <= 3);
    params.priority = config.getPriority();
    params.payment_id = config.getPaymentId();
    params.get_tx_key = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;

    // send request
    let resp = await this.config.getServer().sendJsonRequest("sweep_single", params);
    let result = resp.result;

    // notify of changes
    if (config.getRelay()) await this.poll();

    // build and return tx
    let tx = MoneroWalletRpc.initSentTxWallet(config, undefined, true);
    MoneroWalletRpc.convertRpcTxToTxSet(result, tx, true, config);
    tx.getOutgoingTransfer().getDestinations()[0].setAmount(tx.getOutgoingTransfer().getAmount()); // initialize destination amount
    return tx;
  }

  async sweepUnlocked(config) {

    // validate and normalize config
    const configNormalized = _MoneroWallet.default.normalizeSweepUnlockedConfig(config);

    // determine account and subaddress indices to sweep; default to all with unlocked balance if not specified
    let indices = new Map(); // maps each account index to subaddress indices to sweep
    if (configNormalized.getAccountIndex() !== undefined) {
      if (configNormalized.getSubaddressIndices() !== undefined) {
        indices.set(configNormalized.getAccountIndex(), configNormalized.getSubaddressIndices());
      } else {
        let subaddressIndices = [];
        indices.set(configNormalized.getAccountIndex(), subaddressIndices);
        for (let subaddress of await this.getSubaddresses(configNormalized.getAccountIndex())) {
          if (subaddress.getUnlockedBalance() > 0n) subaddressIndices.push(subaddress.getIndex());
        }
      }
    } else {
      let accounts = await this.getAccounts(true);
      for (let account of accounts) {
        if (account.getUnlockedBalance() > 0n) {
          let subaddressIndices = [];
          indices.set(account.getIndex(), subaddressIndices);
          for (let subaddress of account.getSubaddresses()) {
            if (subaddress.getUnlockedBalance() > 0n) subaddressIndices.push(subaddress.getIndex());
          }
        }
      }
    }

    // sweep from each account and collect resulting tx sets
    let txs = [];
    for (let accountIdx of indices.keys()) {

      // copy and modify the original config
      let copy = configNormalized.copy();
      copy.setAccountIndex(accountIdx);
      copy.setSweepEachSubaddress(false);

      // sweep all subaddresses together  // TODO monero-project: can this reveal outputs belong to the same wallet?
      if (copy.getSweepEachSubaddress() !== true) {
        copy.setSubaddressIndices(indices.get(accountIdx));
        for (let tx of await this.rpcSweepAccount(copy)) txs.push(tx);
      }

      // otherwise sweep each subaddress individually
      else {
        for (let subaddressIdx of indices.get(accountIdx)) {
          copy.setSubaddressIndices([subaddressIdx]);
          for (let tx of await this.rpcSweepAccount(copy)) txs.push(tx);
        }
      }
    }

    // notify of changes
    if (configNormalized.getRelay()) await this.poll();
    return txs;
  }

  async sweepDust(relay) {
    if (relay === undefined) relay = false;
    let resp = await this.config.getServer().sendJsonRequest("sweep_dust", { do_not_relay: !relay });
    if (relay) await this.poll();
    let result = resp.result;
    let txSet = MoneroWalletRpc.convertRpcSentTxsToTxSet(result);
    if (txSet.getTxs() === undefined) return [];
    for (let tx of txSet.getTxs()) {
      tx.setIsRelayed(!relay);
      tx.setInTxPool(tx.getIsRelayed());
    }
    return txSet.getTxs();
  }

  async relayTxs(txsOrMetadatas) {
    (0, _assert.default)(Array.isArray(txsOrMetadatas), "Must provide an array of txs or their metadata to relay");
    let txHashes = [];
    for (let txOrMetadata of txsOrMetadatas) {
      let metadata = txOrMetadata instanceof _MoneroTxWallet.default ? txOrMetadata.getMetadata() : txOrMetadata;
      let resp = await this.config.getServer().sendJsonRequest("relay_tx", { hex: metadata });
      txHashes.push(resp.result.tx_hash);
    }
    await this.poll(); // notify of changes
    return txHashes;
  }

  async describeTxSet(txSet) {
    let resp = await this.config.getServer().sendJsonRequest("describe_transfer", {
      unsigned_txset: txSet.getUnsignedTxHex(),
      multisig_txset: txSet.getMultisigTxHex()
    });
    return MoneroWalletRpc.convertRpcDescribeTransfer(resp.result);
  }

  async signTxs(unsignedTxHex) {
    let resp = await this.config.getServer().sendJsonRequest("sign_transfer", {
      unsigned_txset: unsignedTxHex,
      export_raw: false
    });
    await this.poll();
    return MoneroWalletRpc.convertRpcSentTxsToTxSet(resp.result);
  }

  async submitTxs(signedTxHex) {
    let resp = await this.config.getServer().sendJsonRequest("submit_transfer", {
      tx_data_hex: signedTxHex
    });
    await this.poll();
    return resp.result.tx_hash_list;
  }

  async signMessage(message, signatureType = _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY, accountIdx = 0, subaddressIdx = 0) {
    let resp = await this.config.getServer().sendJsonRequest("sign", {
      data: message,
      signature_type: signatureType === _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY ? "spend" : "view",
      account_index: accountIdx,
      address_index: subaddressIdx
    });
    return resp.result.signature;
  }

  async verifyMessage(message, address, signature) {
    try {
      let resp = await this.config.getServer().sendJsonRequest("verify", { data: message, address: address, signature: signature });
      let result = resp.result;
      return new _MoneroMessageSignatureResult.default(
        result.good ? { isGood: result.good, isOld: result.old, signatureType: result.signature_type === "view" ? _MoneroMessageSignatureType.default.SIGN_WITH_VIEW_KEY : _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY, version: result.version } : { isGood: false }
      );
    } catch (e) {
      if (e.getCode() === -2) return new _MoneroMessageSignatureResult.default({ isGood: false });
      throw e;
    }
  }

  async getTxKey(txHash) {
    try {
      return (await this.config.getServer().sendJsonRequest("get_tx_key", { txid: txHash })).result.tx_key;
    } catch (e) {
      if (e instanceof _MoneroRpcError.default && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new _MoneroRpcError.default("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams()); // normalize error message
      throw e;
    }
  }

  async checkTxKey(txHash, txKey, address) {
    try {

      // send request
      let resp = await this.config.getServer().sendJsonRequest("check_tx_key", { txid: txHash, tx_key: txKey, address: address });

      // interpret result
      let check = new _MoneroCheckTx.default();
      check.setIsGood(true);
      check.setNumConfirmations(resp.result.confirmations);
      check.setInTxPool(resp.result.in_pool);
      check.setReceivedAmount(BigInt(resp.result.received));
      return check;
    } catch (e) {
      if (e instanceof _MoneroRpcError.default && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new _MoneroRpcError.default("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams()); // normalize error message
      throw e;
    }
  }

  async getTxProof(txHash, address, message) {
    try {
      let resp = await this.config.getServer().sendJsonRequest("get_tx_proof", { txid: txHash, address: address, message: message });
      return resp.result.signature;
    } catch (e) {
      if (e instanceof _MoneroRpcError.default && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new _MoneroRpcError.default("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams()); // normalize error message
      throw e;
    }
  }

  async checkTxProof(txHash, address, message, signature) {
    try {

      // send request
      let resp = await this.config.getServer().sendJsonRequest("check_tx_proof", {
        txid: txHash,
        address: address,
        message: message,
        signature: signature
      });

      // interpret response
      let isGood = resp.result.good;
      let check = new _MoneroCheckTx.default();
      check.setIsGood(isGood);
      if (isGood) {
        check.setNumConfirmations(resp.result.confirmations);
        check.setInTxPool(resp.result.in_pool);
        check.setReceivedAmount(BigInt(resp.result.received));
      }
      return check;
    } catch (e) {
      if (e instanceof _MoneroRpcError.default && e.getCode() === -1 && e.message === "basic_string") e = new _MoneroRpcError.default("Must provide signature to check tx proof", -1);
      if (e instanceof _MoneroRpcError.default && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new _MoneroRpcError.default("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams());
      throw e;
    }
  }

  async getSpendProof(txHash, message) {
    try {
      let resp = await this.config.getServer().sendJsonRequest("get_spend_proof", { txid: txHash, message: message });
      return resp.result.signature;
    } catch (e) {
      if (e instanceof _MoneroRpcError.default && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new _MoneroRpcError.default("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams()); // normalize error message
      throw e;
    }
  }

  async checkSpendProof(txHash, message, signature) {
    try {
      let resp = await this.config.getServer().sendJsonRequest("check_spend_proof", {
        txid: txHash,
        message: message,
        signature: signature
      });
      return resp.result.good;
    } catch (e) {
      if (e instanceof _MoneroRpcError.default && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new _MoneroRpcError.default("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams()); // normalize error message
      throw e;
    }
  }

  async getReserveProofWallet(message) {
    let resp = await this.config.getServer().sendJsonRequest("get_reserve_proof", {
      all: true,
      message: message
    });
    return resp.result.signature;
  }

  async getReserveProofAccount(accountIdx, amount, message) {
    let resp = await this.config.getServer().sendJsonRequest("get_reserve_proof", {
      account_index: accountIdx,
      amount: amount.toString(),
      message: message
    });
    return resp.result.signature;
  }

  async checkReserveProof(address, message, signature) {

    // send request
    let resp = await this.config.getServer().sendJsonRequest("check_reserve_proof", {
      address: address,
      message: message,
      signature: signature
    });

    // interpret results
    let isGood = resp.result.good;
    let check = new _MoneroCheckReserve.default();
    check.setIsGood(isGood);
    if (isGood) {
      check.setUnconfirmedSpentAmount(BigInt(resp.result.spent));
      check.setTotalAmount(BigInt(resp.result.total));
    }
    return check;
  }

  async getTxNotes(txHashes) {
    return (await this.config.getServer().sendJsonRequest("get_tx_notes", { txids: txHashes })).result.notes;
  }

  async setTxNotes(txHashes, notes) {
    await this.config.getServer().sendJsonRequest("set_tx_notes", { txids: txHashes, notes: notes });
  }

  async getAddressBookEntries(entryIndices) {
    let resp = await this.config.getServer().sendJsonRequest("get_address_book", { entries: entryIndices });
    if (!resp.result.entries) return [];
    let entries = [];
    for (let rpcEntry of resp.result.entries) {
      entries.push(new _MoneroAddressBookEntry.default().setIndex(rpcEntry.index).setAddress(rpcEntry.address).setDescription(rpcEntry.description).setPaymentId(rpcEntry.payment_id));
    }
    return entries;
  }

  async addAddressBookEntry(address, description) {
    let resp = await this.config.getServer().sendJsonRequest("add_address_book", { address: address, description: description });
    return resp.result.index;
  }

  async editAddressBookEntry(index, setAddress, address, setDescription, description) {
    let resp = await this.config.getServer().sendJsonRequest("edit_address_book", {
      index: index,
      set_address: setAddress,
      address: address,
      set_description: setDescription,
      description: description
    });
  }

  async deleteAddressBookEntry(entryIdx) {
    await this.config.getServer().sendJsonRequest("delete_address_book", { index: entryIdx });
  }

  async tagAccounts(tag, accountIndices) {
    await this.config.getServer().sendJsonRequest("tag_accounts", { tag: tag, accounts: accountIndices });
  }

  async untagAccounts(accountIndices) {
    await this.config.getServer().sendJsonRequest("untag_accounts", { accounts: accountIndices });
  }

  async getAccountTags() {
    let tags = [];
    let resp = await this.config.getServer().sendJsonRequest("get_account_tags");
    if (resp.result.account_tags) {
      for (let rpcAccountTag of resp.result.account_tags) {
        tags.push(new _MoneroAccountTag.default({
          tag: rpcAccountTag.tag ? rpcAccountTag.tag : undefined,
          label: rpcAccountTag.label ? rpcAccountTag.label : undefined,
          accountIndices: rpcAccountTag.accounts
        }));
      }
    }
    return tags;
  }

  async setAccountTagLabel(tag, label) {
    await this.config.getServer().sendJsonRequest("set_account_tag_description", { tag: tag, description: label });
  }

  async getPaymentUri(config) {
    config = _MoneroWallet.default.normalizeCreateTxsConfig(config);
    let resp = await this.config.getServer().sendJsonRequest("make_uri", {
      address: config.getDestinations()[0].getAddress(),
      amount: config.getDestinations()[0].getAmount() ? config.getDestinations()[0].getAmount().toString() : undefined,
      payment_id: config.getPaymentId(),
      recipient_name: config.getRecipientName(),
      tx_description: config.getNote()
    });
    return resp.result.uri;
  }

  async parsePaymentUri(uri) {
    (0, _assert.default)(uri, "Must provide URI to parse");
    let resp = await this.config.getServer().sendJsonRequest("parse_uri", { uri: uri });
    let config = new _MoneroTxConfig.default({ address: resp.result.uri.address, amount: BigInt(resp.result.uri.amount) });
    config.setPaymentId(resp.result.uri.payment_id);
    config.setRecipientName(resp.result.uri.recipient_name);
    config.setNote(resp.result.uri.tx_description);
    if ("" === config.getDestinations()[0].getAddress()) config.getDestinations()[0].setAddress(undefined);
    if ("" === config.getPaymentId()) config.setPaymentId(undefined);
    if ("" === config.getRecipientName()) config.setRecipientName(undefined);
    if ("" === config.getNote()) config.setNote(undefined);
    return config;
  }

  async getAttribute(key) {
    try {
      let resp = await this.config.getServer().sendJsonRequest("get_attribute", { key: key });
      return resp.result.value === "" ? undefined : resp.result.value;
    } catch (e) {
      if (e instanceof _MoneroRpcError.default && e.getCode() === -45) return undefined;
      throw e;
    }
  }

  async setAttribute(key, val) {
    await this.config.getServer().sendJsonRequest("set_attribute", { key: key, value: val });
  }

  async startMining(numThreads, backgroundMining, ignoreBattery) {
    await this.config.getServer().sendJsonRequest("start_mining", {
      threads_count: numThreads,
      do_background_mining: backgroundMining,
      ignore_battery: ignoreBattery
    });
  }

  async stopMining() {
    await this.config.getServer().sendJsonRequest("stop_mining");
  }

  async isMultisigImportNeeded() {
    let resp = await this.config.getServer().sendJsonRequest("get_balance");
    return resp.result.multisig_import_needed === true;
  }

  async getMultisigInfo() {
    let resp = await this.config.getServer().sendJsonRequest("is_multisig");
    let result = resp.result;
    let info = new _MoneroMultisigInfo.default();
    info.setIsMultisig(result.multisig);
    info.setIsReady(result.ready);
    info.setThreshold(result.threshold);
    info.setNumParticipants(result.total);
    return info;
  }

  async prepareMultisig() {
    let resp = await this.config.getServer().sendJsonRequest("prepare_multisig", { enable_multisig_experimental: true });
    this.addressCache = {};
    let result = resp.result;
    return result.multisig_info;
  }

  async makeMultisig(multisigHexes, threshold, password) {
    let resp = await this.config.getServer().sendJsonRequest("make_multisig", {
      multisig_info: multisigHexes,
      threshold: threshold,
      password: password
    });
    this.addressCache = {};
    return resp.result.multisig_info;
  }

  async exchangeMultisigKeys(multisigHexes, password) {
    let resp = await this.config.getServer().sendJsonRequest("exchange_multisig_keys", { multisig_info: multisigHexes, password: password });
    this.addressCache = {};
    let msResult = new _MoneroMultisigInitResult.default();
    msResult.setAddress(resp.result.address);
    msResult.setMultisigHex(resp.result.multisig_info);
    if (msResult.getAddress().length === 0) msResult.setAddress(undefined);
    if (msResult.getMultisigHex().length === 0) msResult.setMultisigHex(undefined);
    return msResult;
  }

  async exportMultisigHex() {
    let resp = await this.config.getServer().sendJsonRequest("export_multisig_info");
    return resp.result.info;
  }

  async importMultisigHex(multisigHexes, refreshAfterImport) {
    if (refreshAfterImport === undefined) refreshAfterImport = true;
    if (!_GenUtils.default.isArray(multisigHexes)) throw new _MoneroError.default("Must provide string[] to importMultisigHex()");
    let resp = await this.config.getServer().sendJsonRequest("import_multisig_info", { info: multisigHexes, refresh_after_import: refreshAfterImport });
    return resp.result.n_outputs;
  }

  async signMultisigTxHex(multisigTxHex) {
    let resp = await this.config.getServer().sendJsonRequest("sign_multisig", { tx_data_hex: multisigTxHex });
    let result = resp.result;
    let signResult = new _MoneroMultisigSignResult.default();
    signResult.setSignedMultisigTxHex(result.tx_data_hex);
    signResult.setTxHashes(result.tx_hash_list);
    return signResult;
  }

  async submitMultisigTxHex(signedMultisigTxHex) {
    let resp = await this.config.getServer().sendJsonRequest("submit_multisig", { tx_data_hex: signedMultisigTxHex });
    return resp.result.tx_hash_list;
  }

  async changePassword(oldPassword, newPassword) {
    return this.config.getServer().sendJsonRequest("change_wallet_password", { old_password: oldPassword || "", new_password: newPassword || "" });
  }

  async save() {
    await this.config.getServer().sendJsonRequest("store");
  }

  async close(save = false) {
    await super.close(save);
    if (save === undefined) save = false;
    await this.clear();
    await this.config.getServer().sendJsonRequest("close_wallet", { autosave_current: save });
  }

  async isClosed() {
    try {
      await this.getPrimaryAddress();
    } catch (e) {
      return e instanceof _MoneroRpcError.default && e.getCode() === -13 && e.message.indexOf("No wallet file") > -1;
    }
    return false;
  }

  /**
   * Save and close the current wallet and stop the RPC server.
   * 
   * @return {Promise<void>}
   */
  async stop() {
    await this.clear();
    await this.config.getServer().sendJsonRequest("stop_wallet");
  }

  // ----------- ADD JSDOC FOR SUPPORTED DEFAULT IMPLEMENTATIONS --------------

  async getNumBlocksToUnlock() {return super.getNumBlocksToUnlock();}
  async getTx(txHash) {return super.getTx(txHash);}
  async getIncomingTransfers(query) {return super.getIncomingTransfers(query);}
  async getOutgoingTransfers(query) {return super.getOutgoingTransfers(query);}
  async createTx(config) {return super.createTx(config);}
  async relayTx(txOrMetadata) {return super.relayTx(txOrMetadata);}
  async getTxNote(txHash) {return super.getTxNote(txHash);}
  async setTxNote(txHash, note) {return super.setTxNote(txHash, note);}

  // -------------------------------- PRIVATE ---------------------------------

  static async connectToWalletRpc(uriOrConfig, username, password) {
    let config = MoneroWalletRpc.normalizeConfig(uriOrConfig, username, password);
    if (config.cmd) return MoneroWalletRpc.startWalletRpcProcess(config);else
    return new MoneroWalletRpc(config);
  }

  static async startWalletRpcProcess(config) {
    (0, _assert.default)(_GenUtils.default.isArray(config.cmd), "Must provide string array with command line parameters");

    // start process
    let child_process = await Promise.resolve().then(() => _interopRequireWildcard(require("child_process")));
    const childProcess = child_process.spawn(config.cmd[0], config.cmd.slice(1), {
      env: { ...process.env, LANG: 'en_US.UTF-8' } // scrape output in english
    });
    childProcess.stdout.setEncoding('utf8');
    childProcess.stderr.setEncoding('utf8');

    // return promise which resolves after starting monero-wallet-rpc
    let uri;
    let that = this;
    let output = "";
    try {
      return await new Promise(function (resolve, reject) {

        // handle stdout
        childProcess.stdout.on('data', async function (data) {
          let line = data.toString();
          _LibraryUtils.default.log(2, line);
          output += line + '\n'; // capture output in case of error

          // extract uri from e.g. "I Binding on 127.0.0.1 (IPv4):38085"
          let uriLineContains = "Binding on ";
          let uriLineContainsIdx = line.indexOf(uriLineContains);
          if (uriLineContainsIdx >= 0) {
            let host = line.substring(uriLineContainsIdx + uriLineContains.length, line.lastIndexOf(' '));
            let unformattedLine = line.replace(/\u001b\[.*?m/g, '').trim(); // remove color formatting
            let port = unformattedLine.substring(unformattedLine.lastIndexOf(':') + 1);
            let sslIdx = config.cmd.indexOf("--rpc-ssl");
            let sslEnabled = sslIdx >= 0 ? "enabled" == config.cmd[sslIdx + 1].toLowerCase() : false;
            uri = (sslEnabled ? "https" : "http") + "://" + host + ":" + port;
          }

          // read success message
          if (line.indexOf("Starting wallet RPC server") >= 0) {

            // get username, password, zmq publish uri, and proxy uri from params
            let userPassIdx = config.cmd.indexOf("--rpc-login");
            let userPass = userPassIdx >= 0 ? config.cmd[userPassIdx + 1] : undefined;
            let username = userPass === undefined ? undefined : userPass.substring(0, userPass.indexOf(':'));
            let password = userPass === undefined ? undefined : userPass.substring(userPass.indexOf(':') + 1);
            let zmqUriIdx = config.cmd.indexOf("--zmq-pub");
            let zmqUri = zmqUriIdx >= 0 ? config.cmd[zmqUriIdx + 1] : undefined;
            let proxyUriIdx = config.cmd.indexOf("--proxy");
            this.startupProxyUri = proxyUriIdx >= 0 ? config.cmd[proxyUriIdx + 1] : undefined;

            // create client connected to internal process
            config = config.copy().setServer({ uri: uri, username: username, password: password, zmqUri: zmqUri, proxyUri: this.startupProxyUri, rejectUnauthorized: config.getServer() ? config.getServer().getRejectUnauthorized() : undefined });
            config.cmd = undefined;
            let wallet = await MoneroWalletRpc.connectToWalletRpc(config);
            wallet.process = childProcess;

            // resolve promise with client connected to internal process 
            this.isResolved = true;
            resolve(wallet);
          }
        });

        // handle stderr
        childProcess.stderr.on('data', function (data) {
          if (_LibraryUtils.default.getLogLevel() >= 2) console.error(data);
        });

        // handle exit
        childProcess.on("exit", function (code) {
          if (!this.isResolved) reject(new _MoneroError.default("monero-wallet-rpc process terminated with exit code " + code + (output ? ":\n\n" + output : "")));
        });

        // handle error
        childProcess.on("error", function (err) {
          if (err.message.indexOf("ENOENT") >= 0) reject(new _MoneroError.default("monero-wallet-rpc does not exist at path '" + config.cmd[0] + "'"));
          if (!this.isResolved) reject(err);
        });

        // handle uncaught exception
        childProcess.on("uncaughtException", function (err, origin) {
          console.error("Uncaught exception in monero-wallet-rpc process: " + err.message);
          console.error(origin);
          if (!this.isResolved) reject(err);
        });
      });
    } catch (err) {
      throw new _MoneroError.default(err.message);
    }
  }

  async clear() {
    this.refreshListening();
    delete this.addressCache;
    this.addressCache = {};
    this.path = undefined;
  }

  async getAccountIndices(getSubaddressIndices) {
    let indices = new Map();
    for (let account of await this.getAccounts()) {
      indices.set(account.getIndex(), getSubaddressIndices ? await this.getSubaddressIndices(account.getIndex()) : undefined);
    }
    return indices;
  }

  async getSubaddressIndices(accountIdx) {
    let subaddressIndices = [];
    let resp = await this.config.getServer().sendJsonRequest("get_address", { account_index: accountIdx });
    for (let address of resp.result.addresses) subaddressIndices.push(address.address_index);
    return subaddressIndices;
  }

  async getTransfersAux(query) {

    // build params for get_transfers rpc call
    let txQuery = query.getTxQuery();
    let canBeConfirmed = txQuery.getIsConfirmed() !== false && txQuery.getInTxPool() !== true && txQuery.getIsFailed() !== true && txQuery.getIsRelayed() !== false;
    let canBeInTxPool = txQuery.getIsConfirmed() !== true && txQuery.getInTxPool() !== false && txQuery.getIsFailed() !== true && txQuery.getHeight() === undefined && txQuery.getMaxHeight() === undefined && txQuery.getIsLocked() !== false;
    let canBeIncoming = query.getIsIncoming() !== false && query.getIsOutgoing() !== true && query.getHasDestinations() !== true;
    let canBeOutgoing = query.getIsOutgoing() !== false && query.getIsIncoming() !== true;

    // check if fetching pool txs contradicted by configuration
    if (txQuery.getInTxPool() === true && !canBeInTxPool) {
      throw new _MoneroError.default("Cannot fetch pool transactions because it contradicts configuration");
    }

    let params = {};
    params.in = canBeIncoming && canBeConfirmed;
    params.out = canBeOutgoing && canBeConfirmed;
    params.pool = canBeIncoming && canBeInTxPool;
    params.pending = canBeOutgoing && canBeInTxPool;
    params.failed = txQuery.getIsFailed() !== false && txQuery.getIsConfirmed() !== true && txQuery.getInTxPool() != true;
    if (txQuery.getMinHeight() !== undefined) {
      if (txQuery.getMinHeight() > 0) params.min_height = txQuery.getMinHeight() - 1; // TODO monero-project: wallet2::get_payments() min_height is exclusive, so manually offset to match intended range (issues #5751, #5598)
      else params.min_height = txQuery.getMinHeight();
    }
    if (txQuery.getMaxHeight() !== undefined) params.max_height = txQuery.getMaxHeight();
    params.filter_by_height = txQuery.getMinHeight() !== undefined || txQuery.getMaxHeight() !== undefined;
    if (query.getAccountIndex() === undefined) {
      (0, _assert.default)(query.getSubaddressIndex() === undefined && query.getSubaddressIndices() === undefined, "Query specifies a subaddress index but not an account index");
      params.all_accounts = true;
    } else {
      params.account_index = query.getAccountIndex();

      // set subaddress indices param
      let subaddressIndices = new Set();
      if (query.getSubaddressIndex() !== undefined) subaddressIndices.add(query.getSubaddressIndex());
      if (query.getSubaddressIndices() !== undefined) query.getSubaddressIndices().map((subaddressIdx) => subaddressIndices.add(subaddressIdx));
      if (subaddressIndices.size) params.subaddr_indices = Array.from(subaddressIndices);
    }

    // cache unique txs and blocks
    let txMap = {};
    let blockMap = {};

    // build txs using `get_transfers`
    let resp = await this.config.getServer().sendJsonRequest("get_transfers", params);
    for (let key of Object.keys(resp.result)) {
      for (let rpcTx of resp.result[key]) {
        //if (rpcTx.txid === query.debugTxId) console.log(rpcTx);
        let tx = MoneroWalletRpc.convertRpcTxWithTransfer(rpcTx);
        if (tx.getIsConfirmed()) (0, _assert.default)(tx.getBlock().getTxs().indexOf(tx) > -1);

        // replace transfer amount with destination sum
        // TODO monero-wallet-rpc: confirmed tx from/to same account has amount 0 but cached transfers
        if (tx.getOutgoingTransfer() !== undefined && tx.getIsRelayed() && !tx.getIsFailed() &&
        tx.getOutgoingTransfer().getDestinations() && tx.getOutgoingAmount() === 0n) {
          let outgoingTransfer = tx.getOutgoingTransfer();
          let transferTotal = BigInt(0);
          for (let destination of outgoingTransfer.getDestinations()) transferTotal = transferTotal + destination.getAmount();
          tx.getOutgoingTransfer().setAmount(transferTotal);
        }

        // merge tx
        MoneroWalletRpc.mergeTx(tx, txMap, blockMap);
      }
    }

    // sort txs by block height
    let txs = Object.values(txMap);
    txs.sort(MoneroWalletRpc.compareTxsByHeight);

    // filter and return transfers
    let transfers = [];
    for (let tx of txs) {

      // tx is not incoming/outgoing unless already set
      if (tx.getIsIncoming() === undefined) tx.setIsIncoming(false);
      if (tx.getIsOutgoing() === undefined) tx.setIsOutgoing(false);

      // sort incoming transfers
      if (tx.getIncomingTransfers() !== undefined) tx.getIncomingTransfers().sort(MoneroWalletRpc.compareIncomingTransfers);

      // collect queried transfers, erase if excluded
      for (let transfer of tx.filterTransfers(query)) {
        transfers.push(transfer);
      }

      // remove txs without requested transfer
      if (tx.getBlock() !== undefined && tx.getOutgoingTransfer() === undefined && tx.getIncomingTransfers() === undefined) {
        tx.getBlock().getTxs().splice(tx.getBlock().getTxs().indexOf(tx), 1);
      }
    }

    return transfers;
  }

  async getOutputsAux(query) {

    // determine account and subaddress indices to be queried
    let indices = new Map();
    if (query.getAccountIndex() !== undefined) {
      let subaddressIndices = new Set();
      if (query.getSubaddressIndex() !== undefined) subaddressIndices.add(query.getSubaddressIndex());
      if (query.getSubaddressIndices() !== undefined) query.getSubaddressIndices().map((subaddressIdx) => subaddressIndices.add(subaddressIdx));
      indices.set(query.getAccountIndex(), subaddressIndices.size ? Array.from(subaddressIndices) : undefined); // undefined will fetch from all subaddresses
    } else {
      _assert.default.equal(query.getSubaddressIndex(), undefined, "Query specifies a subaddress index but not an account index");
      (0, _assert.default)(query.getSubaddressIndices() === undefined || query.getSubaddressIndices().length === 0, "Query specifies subaddress indices but not an account index");
      indices = await this.getAccountIndices(); // fetch all account indices without subaddresses
    }

    // cache unique txs and blocks
    let txMap = {};
    let blockMap = {};

    // collect txs with outputs for each indicated account using `incoming_transfers` rpc call
    let params = {};
    params.transfer_type = query.getIsSpent() === true ? "unavailable" : query.getIsSpent() === false ? "available" : "all";
    params.verbose = true;
    for (let accountIdx of indices.keys()) {

      // send request
      params.account_index = accountIdx;
      params.subaddr_indices = indices.get(accountIdx);
      let resp = await this.config.getServer().sendJsonRequest("incoming_transfers", params);

      // convert response to txs with outputs and merge
      if (resp.result.transfers === undefined) continue;
      for (let rpcOutput of resp.result.transfers) {
        let tx = MoneroWalletRpc.convertRpcTxWithOutput(rpcOutput);
        MoneroWalletRpc.mergeTx(tx, txMap, blockMap);
      }
    }

    // sort txs by block height
    let txs = Object.values(txMap);
    txs.sort(MoneroWalletRpc.compareTxsByHeight);

    // collect queried outputs
    let outputs = [];
    for (let tx of txs) {

      // sort outputs
      if (tx.getOutputs() !== undefined) tx.getOutputs().sort(MoneroWalletRpc.compareOutputs);

      // collect queried outputs, erase if excluded
      for (let output of tx.filterOutputs(query)) outputs.push(output);

      // remove excluded txs from block
      if (tx.getOutputs() === undefined && tx.getBlock() !== undefined) {
        tx.getBlock().getTxs().splice(tx.getBlock().getTxs().indexOf(tx), 1);
      }
    }
    return outputs;
  }

  /**
   * Common method to get key images.
   * 
   * @param all - pecifies to get all xor only new images from last import
   * @return {MoneroKeyImage[]} are the key images
   */
  async rpcExportKeyImages(all) {
    let resp = await this.config.getServer().sendJsonRequest("export_key_images", { all: all });
    if (!resp.result.signed_key_images) return [];
    return resp.result.signed_key_images.map((rpcImage) => new _MoneroKeyImage.default(rpcImage.key_image, rpcImage.signature));
  }

  async rpcSweepAccount(config) {

    // validate config
    if (config === undefined) throw new _MoneroError.default("Must provide sweep config");
    if (config.getAccountIndex() === undefined) throw new _MoneroError.default("Must provide an account index to sweep from");
    if (config.getDestinations() === undefined || config.getDestinations().length != 1) throw new _MoneroError.default("Must provide exactly one destination to sweep to");
    if (config.getDestinations()[0].getAddress() === undefined) throw new _MoneroError.default("Must provide destination address to sweep to");
    if (config.getDestinations()[0].getAmount() !== undefined) throw new _MoneroError.default("Cannot specify amount in sweep config");
    if (config.getKeyImage() !== undefined) throw new _MoneroError.default("Key image defined; use sweepOutput() to sweep an output by its key image");
    if (config.getSubaddressIndices() !== undefined && config.getSubaddressIndices().length === 0) throw new _MoneroError.default("Empty list given for subaddresses indices to sweep");
    if (config.getSweepEachSubaddress()) throw new _MoneroError.default("Cannot sweep each subaddress with RPC `sweep_all`");
    if (config.getSubtractFeeFrom() !== undefined && config.getSubtractFeeFrom().length > 0) throw new _MoneroError.default("Sweeping output does not support subtracting fees from destinations");

    // sweep from all subaddresses if not otherwise defined
    if (config.getSubaddressIndices() === undefined) {
      config.setSubaddressIndices([]);
      for (let subaddress of await this.getSubaddresses(config.getAccountIndex())) {
        config.getSubaddressIndices().push(subaddress.getIndex());
      }
    }
    if (config.getSubaddressIndices().length === 0) throw new _MoneroError.default("No subaddresses to sweep from");

    // common config params
    let params = {};
    let relay = config.getRelay() === true;
    params.account_index = config.getAccountIndex();
    params.subaddr_indices = config.getSubaddressIndices();
    params.address = config.getDestinations()[0].getAddress();
    (0, _assert.default)(config.getPriority() === undefined || config.getPriority() >= 0 && config.getPriority() <= 3);
    params.priority = config.getPriority();
    params.payment_id = config.getPaymentId();
    params.do_not_relay = !relay;
    params.below_amount = config.getBelowAmount();
    params.get_tx_keys = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;

    // invoke wallet rpc `sweep_all`
    let resp = await this.config.getServer().sendJsonRequest("sweep_all", params);
    let result = resp.result;

    // initialize txs from response
    let txSet = MoneroWalletRpc.convertRpcSentTxsToTxSet(result, undefined, config);

    // initialize remaining known fields
    for (let tx of txSet.getTxs()) {
      tx.setIsLocked(true);
      tx.setIsConfirmed(false);
      tx.setNumConfirmations(0);
      tx.setRelay(relay);
      tx.setInTxPool(relay);
      tx.setIsRelayed(relay);
      tx.setIsMinerTx(false);
      tx.setIsFailed(false);
      let transfer = tx.getOutgoingTransfer();
      transfer.setAccountIndex(config.getAccountIndex());
      if (config.getSubaddressIndices().length === 1) transfer.setSubaddressIndices(config.getSubaddressIndices());
      let destination = new _MoneroDestination.default(config.getDestinations()[0].getAddress(), BigInt(transfer.getAmount()));
      transfer.setDestinations([destination]);
      tx.setOutgoingTransfer(transfer);
      tx.setPaymentId(config.getPaymentId());
      if (tx.getUnlockTime() === undefined) tx.setUnlockTime(0n);
      if (tx.getRelay()) {
        if (tx.getLastRelayedTimestamp() === undefined) tx.setLastRelayedTimestamp(+new Date().getTime()); // TODO (monero-wallet-rpc): provide timestamp on response; unconfirmed timestamps vary
        if (tx.getIsDoubleSpendSeen() === undefined) tx.setIsDoubleSpendSeen(false);
      }
    }
    return txSet.getTxs();
  }

  refreshListening() {
    if (this.walletPoller == undefined && this.listeners.length) this.walletPoller = new WalletPoller(this);
    if (this.walletPoller !== undefined) this.walletPoller.setIsPolling(this.listeners.length > 0);
  }

  /**
   * Poll if listening.
   */
  async poll() {
    if (this.walletPoller !== undefined && this.walletPoller.isPolling) await this.walletPoller.poll();
  }

  // ---------------------------- PRIVATE STATIC ------------------------------

  static normalizeConfig(uriOrConfig, username, password) {
    let config = undefined;
    if (typeof uriOrConfig === "string" || uriOrConfig.uri) config = new _MoneroWalletConfig.default({ server: new _MoneroRpcConnection.default(uriOrConfig, username, password) });else
    if (_GenUtils.default.isArray(uriOrConfig)) config = new _MoneroWalletConfig.default({ cmd: uriOrConfig });else
    config = new _MoneroWalletConfig.default(uriOrConfig);
    if (config.proxyToWorker === undefined) config.proxyToWorker = true;
    return config;
  }

  /**
   * Remove criteria which requires looking up other transfers/outputs to
   * fulfill query.
   * 
   * @param {MoneroTxQuery} query - the query to decontextualize
   * @return {MoneroTxQuery} a reference to the query for convenience
   */
  static decontextualize(query) {
    query.setIsIncoming(undefined);
    query.setIsOutgoing(undefined);
    query.setTransferQuery(undefined);
    query.setInputQuery(undefined);
    query.setOutputQuery(undefined);
    return query;
  }

  static isContextual(query) {
    if (!query) return false;
    if (!query.getTxQuery()) return false;
    if (query.getTxQuery().getIsIncoming() !== undefined) return true; // requires getting other transfers
    if (query.getTxQuery().getIsOutgoing() !== undefined) return true;
    if (query instanceof _MoneroTransferQuery.default) {
      if (query.getTxQuery().getOutputQuery() !== undefined) return true; // requires getting other outputs
    } else if (query instanceof _MoneroOutputQuery.default) {
      if (query.getTxQuery().getTransferQuery() !== undefined) return true; // requires getting other transfers
    } else {
      throw new _MoneroError.default("query must be tx or transfer query");
    }
    return false;
  }

  static convertRpcAccount(rpcAccount) {
    let account = new _MoneroAccount.default();
    for (let key of Object.keys(rpcAccount)) {
      let val = rpcAccount[key];
      if (key === "account_index") account.setIndex(val);else
      if (key === "balance") account.setBalance(BigInt(val));else
      if (key === "unlocked_balance") account.setUnlockedBalance(BigInt(val));else
      if (key === "base_address") account.setPrimaryAddress(val);else
      if (key === "tag") account.setTag(val);else
      if (key === "label") {} // label belongs to first subaddress
      else console.log("WARNING: ignoring unexpected account field: " + key + ": " + val);
    }
    if ("" === account.getTag()) account.setTag(undefined);
    return account;
  }

  static convertRpcSubaddress(rpcSubaddress) {
    let subaddress = new _MoneroSubaddress.default();
    for (let key of Object.keys(rpcSubaddress)) {
      let val = rpcSubaddress[key];
      if (key === "account_index") subaddress.setAccountIndex(val);else
      if (key === "address_index") subaddress.setIndex(val);else
      if (key === "address") subaddress.setAddress(val);else
      if (key === "balance") subaddress.setBalance(BigInt(val));else
      if (key === "unlocked_balance") subaddress.setUnlockedBalance(BigInt(val));else
      if (key === "num_unspent_outputs") subaddress.setNumUnspentOutputs(val);else
      if (key === "label") {if (val) subaddress.setLabel(val);} else
      if (key === "used") subaddress.setIsUsed(val);else
      if (key === "blocks_to_unlock") subaddress.setNumBlocksToUnlock(val);else
      if (key == "time_to_unlock") {} // ignoring
      else console.log("WARNING: ignoring unexpected subaddress field: " + key + ": " + val);
    }
    return subaddress;
  }

  /**
   * Initializes a sent transaction.
   * 
   * TODO: remove copyDestinations after >18.3.1 when subtractFeeFrom fully supported
   * 
   * @param {MoneroTxConfig} config - send config
   * @param {MoneroTxWallet} [tx] - existing transaction to initialize (optional)
   * @param {boolean} copyDestinations - copies config destinations if true
   * @return {MoneroTxWallet} is the initialized send tx
   */
  static initSentTxWallet(config, tx, copyDestinations) {
    if (!tx) tx = new _MoneroTxWallet.default();
    let relay = config.getRelay() === true;
    tx.setIsOutgoing(true);
    tx.setIsConfirmed(false);
    tx.setNumConfirmations(0);
    tx.setInTxPool(relay);
    tx.setRelay(relay);
    tx.setIsRelayed(relay);
    tx.setIsMinerTx(false);
    tx.setIsFailed(false);
    tx.setIsLocked(true);
    tx.setRingSize(_MoneroUtils.default.RING_SIZE);
    let transfer = new _MoneroOutgoingTransfer.default();
    transfer.setTx(tx);
    if (config.getSubaddressIndices() && config.getSubaddressIndices().length === 1) transfer.setSubaddressIndices(config.getSubaddressIndices().slice(0)); // we know src subaddress indices iff config specifies 1
    if (copyDestinations) {
      let destCopies = [];
      for (let dest of config.getDestinations()) destCopies.push(dest.copy());
      transfer.setDestinations(destCopies);
    }
    tx.setOutgoingTransfer(transfer);
    tx.setPaymentId(config.getPaymentId());
    if (tx.getUnlockTime() === undefined) tx.setUnlockTime(0n);
    if (config.getRelay()) {
      if (tx.getLastRelayedTimestamp() === undefined) tx.setLastRelayedTimestamp(+new Date().getTime()); // TODO (monero-wallet-rpc): provide timestamp on response; unconfirmed timestamps vary
      if (tx.getIsDoubleSpendSeen() === undefined) tx.setIsDoubleSpendSeen(false);
    }
    return tx;
  }

  /**
   * Initializes a tx set from a RPC map excluding txs.
   * 
   * @param rpcMap - map to initialize the tx set from
   * @return MoneroTxSet - initialized tx set
   * @return the resulting tx set
   */
  static convertRpcTxSet(rpcMap) {
    let txSet = new _MoneroTxSet.default();
    txSet.setMultisigTxHex(rpcMap.multisig_txset);
    txSet.setUnsignedTxHex(rpcMap.unsigned_txset);
    txSet.setSignedTxHex(rpcMap.signed_txset);
    if (txSet.getMultisigTxHex() !== undefined && txSet.getMultisigTxHex().length === 0) txSet.setMultisigTxHex(undefined);
    if (txSet.getUnsignedTxHex() !== undefined && txSet.getUnsignedTxHex().length === 0) txSet.setUnsignedTxHex(undefined);
    if (txSet.getSignedTxHex() !== undefined && txSet.getSignedTxHex().length === 0) txSet.setSignedTxHex(undefined);
    return txSet;
  }

  /**
   * Initializes a MoneroTxSet from a list of rpc txs.
   * 
   * @param rpcTxs - rpc txs to initialize the set from
   * @param txs - existing txs to further initialize (optional)
   * @param config - tx config
   * @return the converted tx set
   */
  static convertRpcSentTxsToTxSet(rpcTxs, txs, config) {

    // build shared tx set
    let txSet = MoneroWalletRpc.convertRpcTxSet(rpcTxs);

    // get number of txs
    let numTxs = rpcTxs.fee_list ? rpcTxs.fee_list.length : rpcTxs.tx_hash_list ? rpcTxs.tx_hash_list.length : 0;

    // done if rpc response contains no txs
    if (numTxs === 0) {
      _assert.default.equal(txs, undefined);
      return txSet;
    }

    // initialize txs if none given
    if (txs) txSet.setTxs(txs);else
    {
      txs = [];
      for (let i = 0; i < numTxs; i++) txs.push(new _MoneroTxWallet.default());
    }
    for (let tx of txs) {
      tx.setTxSet(txSet);
      tx.setIsOutgoing(true);
    }
    txSet.setTxs(txs);

    // initialize txs from rpc lists
    for (let key of Object.keys(rpcTxs)) {
      let val = rpcTxs[key];
      if (key === "tx_hash_list") for (let i = 0; i < val.length; i++) txs[i].setHash(val[i]);else
      if (key === "tx_key_list") for (let i = 0; i < val.length; i++) txs[i].setKey(val[i]);else
      if (key === "tx_blob_list") for (let i = 0; i < val.length; i++) txs[i].setFullHex(val[i]);else
      if (key === "tx_metadata_list") for (let i = 0; i < val.length; i++) txs[i].setMetadata(val[i]);else
      if (key === "fee_list") for (let i = 0; i < val.length; i++) txs[i].setFee(BigInt(val[i]));else
      if (key === "weight_list") for (let i = 0; i < val.length; i++) txs[i].setWeight(val[i]);else
      if (key === "amount_list") {
        for (let i = 0; i < val.length; i++) {
          if (txs[i].getOutgoingTransfer() == undefined) txs[i].setOutgoingTransfer(new _MoneroOutgoingTransfer.default().setTx(txs[i]));
          txs[i].getOutgoingTransfer().setAmount(BigInt(val[i]));
        }
      } else
      if (key === "multisig_txset" || key === "unsigned_txset" || key === "signed_txset") {} // handled elsewhere
      else if (key === "spent_key_images_list") {
        let inputKeyImagesList = val;
        for (let i = 0; i < inputKeyImagesList.length; i++) {
          _GenUtils.default.assertTrue(txs[i].getInputs() === undefined);
          txs[i].setInputs([]);
          for (let inputKeyImage of inputKeyImagesList[i]["key_images"]) {
            txs[i].getInputs().push(new _MoneroOutputWallet.default().setKeyImage(new _MoneroKeyImage.default().setHex(inputKeyImage)).setTx(txs[i]));
          }
        }
      } else
      if (key === "amounts_by_dest_list") {
        let amountsByDestList = val;
        let destinationIdx = 0;
        for (let txIdx = 0; txIdx < amountsByDestList.length; txIdx++) {
          let amountsByDest = amountsByDestList[txIdx]["amounts"];
          if (txs[txIdx].getOutgoingTransfer() === undefined) txs[txIdx].setOutgoingTransfer(new _MoneroOutgoingTransfer.default().setTx(txs[txIdx]));
          txs[txIdx].getOutgoingTransfer().setDestinations([]);
          for (let amount of amountsByDest) {
            if (config.getDestinations().length === 1) txs[txIdx].getOutgoingTransfer().getDestinations().push(new _MoneroDestination.default(config.getDestinations()[0].getAddress(), BigInt(amount))); // sweeping can create multiple txs with one address
            else txs[txIdx].getOutgoingTransfer().getDestinations().push(new _MoneroDestination.default(config.getDestinations()[destinationIdx++].getAddress(), BigInt(amount)));
          }
        }
      } else
      console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
    }

    return txSet;
  }

  /**
   * Converts a rpc tx with a transfer to a tx set with a tx and transfer.
   * 
   * @param rpcTx - rpc tx to build from
   * @param tx - existing tx to continue initializing (optional)
   * @param isOutgoing - specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
   * @param config - tx config
   * @return the initialized tx set with a tx
   */
  static convertRpcTxToTxSet(rpcTx, tx, isOutgoing, config) {
    let txSet = MoneroWalletRpc.convertRpcTxSet(rpcTx);
    txSet.setTxs([MoneroWalletRpc.convertRpcTxWithTransfer(rpcTx, tx, isOutgoing, config).setTxSet(txSet)]);
    return txSet;
  }

  /**
   * Builds a MoneroTxWallet from a RPC tx.
   * 
   * @param rpcTx - rpc tx to build from
   * @param tx - existing tx to continue initializing (optional)
   * @param isOutgoing - specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
   * @param config - tx config
   * @return {MoneroTxWallet} is the initialized tx
   */
  static convertRpcTxWithTransfer(rpcTx, tx, isOutgoing, config) {// TODO: change everything to safe set

    // initialize tx to return
    if (!tx) tx = new _MoneroTxWallet.default();

    // initialize tx state from rpc type
    if (rpcTx.type !== undefined) isOutgoing = MoneroWalletRpc.decodeRpcType(rpcTx.type, tx);else
    _assert.default.equal(typeof isOutgoing, "boolean", "Must indicate if tx is outgoing (true) xor incoming (false) since unknown");

    // TODO: safe set
    // initialize remaining fields  TODO: seems this should be part of common function with DaemonRpc.convertRpcTx
    let header;
    let transfer;
    for (let key of Object.keys(rpcTx)) {
      let val = rpcTx[key];
      if (key === "txid") tx.setHash(val);else
      if (key === "tx_hash") tx.setHash(val);else
      if (key === "fee") tx.setFee(BigInt(val));else
      if (key === "note") {if (val) tx.setNote(val);} else
      if (key === "tx_key") tx.setKey(val);else
      if (key === "type") {} // type already handled
      else if (key === "tx_size") tx.setSize(val);else
      if (key === "unlock_time") tx.setUnlockTime(val);else
      if (key === "weight") tx.setWeight(val);else
      if (key === "locked") tx.setIsLocked(val);else
      if (key === "tx_blob") tx.setFullHex(val);else
      if (key === "tx_metadata") tx.setMetadata(val);else
      if (key === "double_spend_seen") tx.setIsDoubleSpendSeen(val);else
      if (key === "block_height" || key === "height") {
        if (tx.getIsConfirmed()) {
          if (!header) header = new _MoneroBlockHeader.default();
          header.setHeight(val);
        }
      } else
      if (key === "timestamp") {
        if (tx.getIsConfirmed()) {
          if (!header) header = new _MoneroBlockHeader.default();
          header.setTimestamp(val);
        } else {

          // timestamp of unconfirmed tx is current request time
        }} else
      if (key === "confirmations") tx.setNumConfirmations(val);else
      if (key === "suggested_confirmations_threshold") {
        if (transfer === undefined) transfer = (isOutgoing ? new _MoneroOutgoingTransfer.default() : new _MoneroIncomingTransfer.default()).setTx(tx);
        if (!isOutgoing) transfer.setNumSuggestedConfirmations(val);
      } else
      if (key === "amount") {
        if (transfer === undefined) transfer = (isOutgoing ? new _MoneroOutgoingTransfer.default() : new _MoneroIncomingTransfer.default()).setTx(tx);
        transfer.setAmount(BigInt(val));
      } else
      if (key === "amounts") {} // ignoring, amounts sum to amount
      else if (key === "address") {
        if (!isOutgoing) {
          if (!transfer) transfer = new _MoneroIncomingTransfer.default().setTx(tx);
          transfer.setAddress(val);
        }
      } else
      if (key === "payment_id") {
        if ("" !== val && _MoneroTxWallet.default.DEFAULT_PAYMENT_ID !== val) tx.setPaymentId(val); // default is undefined
      } else
      if (key === "subaddr_index") (0, _assert.default)(rpcTx.subaddr_indices); // handled by subaddr_indices
      else if (key === "subaddr_indices") {
        if (!transfer) transfer = (isOutgoing ? new _MoneroOutgoingTransfer.default() : new _MoneroIncomingTransfer.default()).setTx(tx);
        let rpcIndices = val;
        transfer.setAccountIndex(rpcIndices[0].major);
        if (isOutgoing) {
          let subaddressIndices = [];
          for (let rpcIndex of rpcIndices) subaddressIndices.push(rpcIndex.minor);
          transfer.setSubaddressIndices(subaddressIndices);
        } else {
          _assert.default.equal(rpcIndices.length, 1);
          transfer.setSubaddressIndex(rpcIndices[0].minor);
        }
      } else
      if (key === "destinations" || key == "recipients") {
        (0, _assert.default)(isOutgoing);
        let destinations = [];
        for (let rpcDestination of val) {
          let destination = new _MoneroDestination.default();
          destinations.push(destination);
          for (let destinationKey of Object.keys(rpcDestination)) {
            if (destinationKey === "address") destination.setAddress(rpcDestination[destinationKey]);else
            if (destinationKey === "amount") destination.setAmount(BigInt(rpcDestination[destinationKey]));else
            throw new _MoneroError.default("Unrecognized transaction destination field: " + destinationKey);
          }
        }
        if (transfer === undefined) transfer = new _MoneroOutgoingTransfer.default({ tx: tx });
        transfer.setDestinations(destinations);
      } else
      if (key === "multisig_txset" && val !== undefined) {} // handled elsewhere; this method only builds a tx wallet
      else if (key === "unsigned_txset" && val !== undefined) {} // handled elsewhere; this method only builds a tx wallet
      else if (key === "amount_in") tx.setInputSum(BigInt(val));else
      if (key === "amount_out") tx.setOutputSum(BigInt(val));else
      if (key === "change_address") tx.setChangeAddress(val === "" ? undefined : val);else
      if (key === "change_amount") tx.setChangeAmount(BigInt(val));else
      if (key === "dummy_outputs") tx.setNumDummyOutputs(val);else
      if (key === "extra") tx.setExtraHex(val);else
      if (key === "ring_size") tx.setRingSize(val);else
      if (key === "spent_key_images") {
        let inputKeyImages = val.key_images;
        _GenUtils.default.assertTrue(tx.getInputs() === undefined);
        tx.setInputs([]);
        for (let inputKeyImage of inputKeyImages) {
          tx.getInputs().push(new _MoneroOutputWallet.default().setKeyImage(new _MoneroKeyImage.default().setHex(inputKeyImage)).setTx(tx));
        }
      } else
      if (key === "amounts_by_dest") {
        _GenUtils.default.assertTrue(isOutgoing);
        let amountsByDest = val.amounts;
        _assert.default.equal(config.getDestinations().length, amountsByDest.length);
        if (transfer === undefined) transfer = new _MoneroOutgoingTransfer.default().setTx(tx);
        transfer.setDestinations([]);
        for (let i = 0; i < config.getDestinations().length; i++) {
          transfer.getDestinations().push(new _MoneroDestination.default(config.getDestinations()[i].getAddress(), BigInt(amountsByDest[i])));
        }
      } else
      console.log("WARNING: ignoring unexpected transaction field with transfer: " + key + ": " + val);
    }

    // link block and tx
    if (header) tx.setBlock(new _MoneroBlock.default(header).setTxs([tx]));

    // initialize final fields
    if (transfer) {
      if (tx.getIsConfirmed() === undefined) tx.setIsConfirmed(false);
      if (!transfer.getTx().getIsConfirmed()) tx.setNumConfirmations(0);
      if (isOutgoing) {
        tx.setIsOutgoing(true);
        if (tx.getOutgoingTransfer()) {
          if (transfer.getDestinations()) tx.getOutgoingTransfer().setDestinations(undefined); // overwrite to avoid reconcile error TODO: remove after >18.3.1 when amounts_by_dest supported
          tx.getOutgoingTransfer().merge(transfer);
        } else
        tx.setOutgoingTransfer(transfer);
      } else {
        tx.setIsIncoming(true);
        tx.setIncomingTransfers([transfer]);
      }
    }

    // return initialized transaction
    return tx;
  }

  static convertRpcTxWithOutput(rpcOutput) {

    // initialize tx
    let tx = new _MoneroTxWallet.default();
    tx.setIsConfirmed(true);
    tx.setInTxPool(false);
    tx.setIsRelayed(true);
    tx.setIsFailed(false);

    // initialize output
    let output = new _MoneroOutputWallet.default({ tx: tx });
    for (let key of Object.keys(rpcOutput)) {
      let val = rpcOutput[key];
      if (key === "amount") output.setAmount(BigInt(val));else
      if (key === "spent") output.setIsSpent(val);else
      if (key === "key_image") {if ("" !== val) output.setKeyImage(new _MoneroKeyImage.default(val));} else
      if (key === "global_index") output.setIndex(val);else
      if (key === "tx_hash") tx.setHash(val);else
      if (key === "unlocked") tx.setIsLocked(!val);else
      if (key === "frozen") output.setIsFrozen(val);else
      if (key === "pubkey") output.setStealthPublicKey(val);else
      if (key === "subaddr_index") {
        output.setAccountIndex(val.major);
        output.setSubaddressIndex(val.minor);
      } else
      if (key === "block_height") tx.setBlock(new _MoneroBlock.default().setHeight(val).setTxs([tx]));else
      console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
    }

    // initialize tx with output
    tx.setOutputs([output]);
    return tx;
  }

  static convertRpcDescribeTransfer(rpcDescribeTransferResult) {
    let txSet = new _MoneroTxSet.default();
    for (let key of Object.keys(rpcDescribeTransferResult)) {
      let val = rpcDescribeTransferResult[key];
      if (key === "desc") {
        txSet.setTxs([]);
        for (let txMap of val) {
          let tx = MoneroWalletRpc.convertRpcTxWithTransfer(txMap, undefined, true);
          tx.setTxSet(txSet);
          txSet.getTxs().push(tx);
        }
      } else
      if (key === "summary") {} // TODO: support tx set summary fields?
      else console.log("WARNING: ignoring unexpected descdribe transfer field: " + key + ": " + val);
    }
    return txSet;
  }

  /**
   * Decodes a "type" from monero-wallet-rpc to initialize type and state
   * fields in the given transaction.
   * 
   * TODO: these should be safe set
   * 
   * @param rpcType is the type to decode
   * @param tx is the transaction to decode known fields to
   * @return {boolean} true if the rpc type indicates outgoing xor incoming
   */
  static decodeRpcType(rpcType, tx) {
    let isOutgoing;
    if (rpcType === "in") {
      isOutgoing = false;
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(false);
      tx.setIsMinerTx(false);
    } else if (rpcType === "out") {
      isOutgoing = true;
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(false);
      tx.setIsMinerTx(false);
    } else if (rpcType === "pool") {
      isOutgoing = false;
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(false);
      tx.setIsMinerTx(false); // TODO: but could it be?
    } else if (rpcType === "pending") {
      isOutgoing = true;
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(false);
      tx.setIsMinerTx(false);
    } else if (rpcType === "block") {
      isOutgoing = false;
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(false);
      tx.setIsMinerTx(true);
    } else if (rpcType === "failed") {
      isOutgoing = true;
      tx.setIsConfirmed(false);
      tx.setInTxPool(false);
      tx.setIsRelayed(false);
      tx.setRelay(true);
      tx.setIsFailed(true);
      tx.setIsMinerTx(false);
    } else {
      throw new _MoneroError.default("Unrecognized transfer type: " + rpcType);
    }
    return isOutgoing;
  }

  /**
   * Merges a transaction into a unique set of transactions.
   *
   * @param {MoneroTxWallet} tx - the transaction to merge into the existing txs
   * @param {Object} txMap - maps tx hashes to txs
   * @param {Object} blockMap - maps block heights to blocks
   */
  static mergeTx(tx, txMap, blockMap) {
    (0, _assert.default)(tx.getHash() !== undefined);

    // merge tx
    let aTx = txMap[tx.getHash()];
    if (aTx === undefined) txMap[tx.getHash()] = tx; // cache new tx
    else aTx.merge(tx); // merge with existing tx

    // merge tx's block if confirmed
    if (tx.getHeight() !== undefined) {
      let aBlock = blockMap[tx.getHeight()];
      if (aBlock === undefined) blockMap[tx.getHeight()] = tx.getBlock(); // cache new block
      else aBlock.merge(tx.getBlock()); // merge with existing block
    }
  }

  /**
   * Compares two transactions by their height.
   */
  static compareTxsByHeight(tx1, tx2) {
    if (tx1.getHeight() === undefined && tx2.getHeight() === undefined) return 0; // both unconfirmed
    else if (tx1.getHeight() === undefined) return 1; // tx1 is unconfirmed
    else if (tx2.getHeight() === undefined) return -1; // tx2 is unconfirmed
    let diff = tx1.getHeight() - tx2.getHeight();
    if (diff !== 0) return diff;
    return tx1.getBlock().getTxs().indexOf(tx1) - tx2.getBlock().getTxs().indexOf(tx2); // txs are in the same block so retain their original order
  }

  /**
   * Compares two transfers by ascending account and subaddress indices.
   */
  static compareIncomingTransfers(t1, t2) {
    if (t1.getAccountIndex() < t2.getAccountIndex()) return -1;else
    if (t1.getAccountIndex() === t2.getAccountIndex()) return t1.getSubaddressIndex() - t2.getSubaddressIndex();
    return 1;
  }

  /**
   * Compares two outputs by ascending account and subaddress indices.
   */
  static compareOutputs(o1, o2) {

    // compare by height
    let heightComparison = MoneroWalletRpc.compareTxsByHeight(o1.getTx(), o2.getTx());
    if (heightComparison !== 0) return heightComparison;

    // compare by account index, subaddress index, output index, then key image hex
    let compare = o1.getAccountIndex() - o2.getAccountIndex();
    if (compare !== 0) return compare;
    compare = o1.getSubaddressIndex() - o2.getSubaddressIndex();
    if (compare !== 0) return compare;
    compare = o1.getIndex() - o2.getIndex();
    if (compare !== 0) return compare;
    return o1.getKeyImage().getHex().localeCompare(o2.getKeyImage().getHex());
  }
}

/**
 * Polls monero-wallet-rpc to provide listener notifications.
 * 
 * @private
 */exports.default = MoneroWalletRpc;
class WalletPoller {

  // instance variables











  constructor(wallet) {
    let that = this;
    this.wallet = wallet;
    this.looper = new _TaskLooper.default(async function () {await that.poll();});
    this.prevLockedTxs = [];
    this.prevUnconfirmedNotifications = new Set(); // tx hashes of previous notifications
    this.prevConfirmedNotifications = new Set(); // tx hashes of previously confirmed but not yet unlocked notifications
    this.threadPool = new _ThreadPool.default(1); // synchronize polls
    this.numPolling = 0;
  }

  setIsPolling(isPolling) {
    this.isPolling = isPolling;
    if (isPolling) this.looper.start(this.wallet.getSyncPeriodInMs());else
    this.looper.stop();
  }

  setPeriodInMs(periodInMs) {
    this.looper.setPeriodInMs(periodInMs);
  }

  async poll() {

    // skip if next poll is queued
    if (this.numPolling > 1) return;
    this.numPolling++;

    // synchronize polls
    let that = this;
    return this.threadPool.submit(async function () {
      try {

        // skip if wallet is closed
        if (await that.wallet.isClosed()) {
          that.numPolling--;
          return;
        }

        // take initial snapshot
        if (that.prevBalances === undefined) {
          that.prevHeight = await that.wallet.getHeight();
          that.prevLockedTxs = await that.wallet.getTxs(new _MoneroTxQuery.default().setIsLocked(true));
          that.prevBalances = await that.wallet.getBalances();
          that.numPolling--;
          return;
        }

        // announce height changes
        let height = await that.wallet.getHeight();
        if (that.prevHeight !== height) {
          for (let i = that.prevHeight; i < height; i++) await that.onNewBlock(i);
          that.prevHeight = height;
        }

        // get locked txs for comparison to previous
        let minHeight = Math.max(0, height - 70); // only monitor recent txs
        let lockedTxs = await that.wallet.getTxs(new _MoneroTxQuery.default().setIsLocked(true).setMinHeight(minHeight).setIncludeOutputs(true));

        // collect hashes of txs no longer locked
        let noLongerLockedHashes = [];
        for (let prevLockedTx of that.prevLockedTxs) {
          if (that.getTx(lockedTxs, prevLockedTx.getHash()) === undefined) {
            noLongerLockedHashes.push(prevLockedTx.getHash());
          }
        }

        // save locked txs for next comparison
        that.prevLockedTxs = lockedTxs;

        // fetch txs which are no longer locked
        let unlockedTxs = noLongerLockedHashes.length === 0 ? [] : await that.wallet.getTxs(new _MoneroTxQuery.default().setIsLocked(false).setMinHeight(minHeight).setHashes(noLongerLockedHashes).setIncludeOutputs(true));

        // announce new unconfirmed and confirmed outputs
        for (let lockedTx of lockedTxs) {
          let searchSet = lockedTx.getIsConfirmed() ? that.prevConfirmedNotifications : that.prevUnconfirmedNotifications;
          let unannounced = !searchSet.has(lockedTx.getHash());
          searchSet.add(lockedTx.getHash());
          if (unannounced) await that.notifyOutputs(lockedTx);
        }

        // announce new unlocked outputs
        for (let unlockedTx of unlockedTxs) {
          that.prevUnconfirmedNotifications.delete(unlockedTx.getHash());
          that.prevConfirmedNotifications.delete(unlockedTx.getHash());
          await that.notifyOutputs(unlockedTx);
        }

        // announce balance changes
        await that.checkForChangedBalances();
        that.numPolling--;
      } catch (err) {
        that.numPolling--;
        console.error("Failed to background poll wallet '" + (await that.wallet.getPath()) + "': " + err.message);
      }
    });
  }

  async onNewBlock(height) {
    await this.wallet.announceNewBlock(height);
  }

  async notifyOutputs(tx) {

    // notify spent outputs // TODO (monero-project): monero-wallet-rpc does not allow scrape of tx inputs so providing one input with outgoing amount
    if (tx.getOutgoingTransfer() !== undefined) {
      (0, _assert.default)(tx.getInputs() === undefined);
      let output = new _MoneroOutputWallet.default().
      setAmount(tx.getOutgoingTransfer().getAmount() + tx.getFee()).
      setAccountIndex(tx.getOutgoingTransfer().getAccountIndex()).
      setSubaddressIndex(tx.getOutgoingTransfer().getSubaddressIndices().length === 1 ? tx.getOutgoingTransfer().getSubaddressIndices()[0] : undefined) // initialize if transfer sourced from single subaddress
      .setTx(tx);
      tx.setInputs([output]);
      await this.wallet.announceOutputSpent(output);
    }

    // notify received outputs
    if (tx.getIncomingTransfers() !== undefined) {
      if (tx.getOutputs() !== undefined && tx.getOutputs().length > 0) {// TODO (monero-project): outputs only returned for confirmed txs
        for (let output of tx.getOutputs()) {
          await this.wallet.announceOutputReceived(output);
        }
      } else {// TODO (monero-project): monero-wallet-rpc does not allow scrape of unconfirmed received outputs so using incoming transfer values
        let outputs = [];
        for (let transfer of tx.getIncomingTransfers()) {
          outputs.push(new _MoneroOutputWallet.default().
          setAccountIndex(transfer.getAccountIndex()).
          setSubaddressIndex(transfer.getSubaddressIndex()).
          setAmount(transfer.getAmount()).
          setTx(tx));
        }
        tx.setOutputs(outputs);
        for (let output of tx.getOutputs()) {
          await this.wallet.announceOutputReceived(output);
        }
      }
    }
  }

  getTx(txs, txHash) {
    for (let tx of txs) if (txHash === tx.getHash()) return tx;
    return undefined;
  }

  async checkForChangedBalances() {
    let balances = await this.wallet.getBalances();
    if (balances[0] !== this.prevBalances[0] || balances[1] !== this.prevBalances[1]) {
      this.prevBalances = balances;
      await this.wallet.announceBalancesChanged(balances[0], balances[1]);
      return true;
    }
    return false;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiTW9uZXJvV2FsbGV0UnBjIiwiTW9uZXJvV2FsbGV0IiwiREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwiYWRkcmVzc0NhY2hlIiwic3luY1BlcmlvZEluTXMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRTZXJ2ZXIiLCJvcGVuV2FsbGV0IiwicGF0aE9yQ29uZmlnIiwicGFzc3dvcmQiLCJNb25lcm9XYWxsZXRDb25maWciLCJwYXRoIiwiZ2V0UGF0aCIsImdldFJlZ3Rlc3QiLCJzZW5kSnNvblJlcXVlc3QiLCJmaWxlbmFtZSIsImdldFBhc3N3b3JkIiwiY2xlYXIiLCJnZXRDb25uZWN0aW9uTWFuYWdlciIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsImNyZWF0ZVdhbGxldCIsImNvbmZpZ05vcm1hbGl6ZWQiLCJnZXRTZWVkIiwiZ2V0UHJpbWFyeUFkZHJlc3MiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFByaXZhdGVTcGVuZEtleSIsImdldE5ldHdvcmtUeXBlIiwiZ2V0QWNjb3VudExvb2thaGVhZCIsImdldFN1YmFkZHJlc3NMb29rYWhlYWQiLCJzZXRQYXNzd29yZCIsInNldFNlcnZlciIsImdldENvbm5lY3Rpb24iLCJjcmVhdGVXYWxsZXRGcm9tU2VlZCIsImNyZWF0ZVdhbGxldEZyb21LZXlzIiwiY3JlYXRlV2FsbGV0UmFuZG9tIiwiZ2V0U2VlZE9mZnNldCIsImdldFJlc3RvcmVIZWlnaHQiLCJnZXRTYXZlQ3VycmVudCIsImdldExhbmd1YWdlIiwic2V0TGFuZ3VhZ2UiLCJERUZBVUxUX0xBTkdVQUdFIiwicGFyYW1zIiwibGFuZ3VhZ2UiLCJlcnIiLCJoYW5kbGVDcmVhdGVXYWxsZXRFcnJvciIsInNlZWQiLCJzZWVkX29mZnNldCIsImVuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWwiLCJnZXRJc011bHRpc2lnIiwicmVzdG9yZV9oZWlnaHQiLCJhdXRvc2F2ZV9jdXJyZW50Iiwic2V0UmVzdG9yZUhlaWdodCIsImFkZHJlc3MiLCJ2aWV3a2V5Iiwic3BlbmRrZXkiLCJuYW1lIiwibWVzc2FnZSIsInRvTG93ZXJDYXNlIiwiaW5jbHVkZXMiLCJNb25lcm9ScGNFcnJvciIsImdldENvZGUiLCJnZXRScGNNZXRob2QiLCJnZXRScGNQYXJhbXMiLCJpc1ZpZXdPbmx5Iiwia2V5X3R5cGUiLCJlIiwidXJpT3JDb25uZWN0aW9uIiwiaXNUcnVzdGVkIiwic3NsT3B0aW9ucyIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiU3NsT3B0aW9ucyIsImdldFVyaSIsInVzZXJuYW1lIiwiZ2V0VXNlcm5hbWUiLCJ0cnVzdGVkIiwic3NsX3N1cHBvcnQiLCJzc2xfcHJpdmF0ZV9rZXlfcGF0aCIsImdldFByaXZhdGVLZXlQYXRoIiwic3NsX2NlcnRpZmljYXRlX3BhdGgiLCJnZXRDZXJ0aWZpY2F0ZVBhdGgiLCJzc2xfY2FfZmlsZSIsImdldENlcnRpZmljYXRlQXV0aG9yaXR5RmlsZSIsInNzbF9hbGxvd2VkX2ZpbmdlcnByaW50cyIsImdldEFsbG93ZWRGaW5nZXJwcmludHMiLCJzc2xfYWxsb3dfYW55X2NlcnQiLCJnZXRBbGxvd0FueUNlcnQiLCJnZXRQcm94eVVyaSIsInN0YXJ0dXBQcm94eVVyaSIsInByb3h5IiwiZGFlbW9uQ29ubmVjdGlvbiIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJnZXRCYWxhbmNlcyIsImFjY291bnRJZHgiLCJzdWJhZGRyZXNzSWR4IiwiYXNzZXJ0IiwiZXF1YWwiLCJiYWxhbmNlIiwiQmlnSW50IiwidW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudCIsImdldEFjY291bnRzIiwiZ2V0QmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsImFjY291bnRfaW5kZXgiLCJhZGRyZXNzX2luZGljZXMiLCJyZXNwIiwicmVzdWx0IiwidW5sb2NrZWRfYmFsYW5jZSIsInBlcl9zdWJhZGRyZXNzIiwiYWRkTGlzdGVuZXIiLCJyZWZyZXNoTGlzdGVuaW5nIiwiaXNDb25uZWN0ZWRUb0RhZW1vbiIsImNoZWNrUmVzZXJ2ZVByb29mIiwiaW5kZXhPZiIsImdldFZlcnNpb24iLCJNb25lcm9WZXJzaW9uIiwidmVyc2lvbiIsInJlbGVhc2UiLCJnZXRTZWVkTGFuZ3VhZ2UiLCJnZXRTZWVkTGFuZ3VhZ2VzIiwibGFuZ3VhZ2VzIiwiZ2V0QWRkcmVzcyIsInN1YmFkZHJlc3NNYXAiLCJnZXRTdWJhZGRyZXNzZXMiLCJnZXRBZGRyZXNzSW5kZXgiLCJzdWJhZGRyZXNzIiwiTW9uZXJvU3ViYWRkcmVzcyIsInNldEFjY291bnRJbmRleCIsImluZGV4IiwibWFqb3IiLCJzZXRJbmRleCIsIm1pbm9yIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJpbnRlZ3JhdGVkQWRkcmVzc1N0ciIsInN0YW5kYXJkX2FkZHJlc3MiLCJwYXltZW50X2lkIiwiaW50ZWdyYXRlZF9hZGRyZXNzIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbnRlZ3JhdGVkQWRkcmVzcyIsIk1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwic2V0U3RhbmRhcmRBZGRyZXNzIiwic2V0UGF5bWVudElkIiwic2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJnZXRIZWlnaHQiLCJoZWlnaHQiLCJnZXREYWVtb25IZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJzeW5jIiwibGlzdGVuZXJPclN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJNb25lcm9XYWxsZXRMaXN0ZW5lciIsInN0YXJ0X2hlaWdodCIsInBvbGwiLCJNb25lcm9TeW5jUmVzdWx0IiwiYmxvY2tzX2ZldGNoZWQiLCJyZWNlaXZlZF9tb25leSIsInN0YXJ0U3luY2luZyIsInN5bmNQZXJpb2RJblNlY29uZHMiLCJNYXRoIiwicm91bmQiLCJlbmFibGUiLCJwZXJpb2QiLCJ3YWxsZXRQb2xsZXIiLCJzZXRQZXJpb2RJbk1zIiwiZ2V0U3luY1BlcmlvZEluTXMiLCJzdG9wU3luY2luZyIsInNjYW5UeHMiLCJ0eEhhc2hlcyIsImxlbmd0aCIsInR4aWRzIiwicmVzY2FuU3BlbnQiLCJyZXNjYW5CbG9ja2NoYWluIiwiaW5jbHVkZVN1YmFkZHJlc3NlcyIsInRhZyIsInNraXBCYWxhbmNlcyIsImFjY291bnRzIiwicnBjQWNjb3VudCIsInN1YmFkZHJlc3NfYWNjb3VudHMiLCJjb252ZXJ0UnBjQWNjb3VudCIsInNldFN1YmFkZHJlc3NlcyIsImdldEluZGV4IiwicHVzaCIsInNldEJhbGFuY2UiLCJzZXRVbmxvY2tlZEJhbGFuY2UiLCJzZXROdW1VbnNwZW50T3V0cHV0cyIsInNldE51bUJsb2Nrc1RvVW5sb2NrIiwiYWxsX2FjY291bnRzIiwicnBjU3ViYWRkcmVzcyIsImNvbnZlcnRScGNTdWJhZGRyZXNzIiwiZ2V0QWNjb3VudEluZGV4IiwidGd0U3ViYWRkcmVzcyIsImdldE51bVVuc3BlbnRPdXRwdXRzIiwiZ2V0QWNjb3VudCIsIkVycm9yIiwiY3JlYXRlQWNjb3VudCIsImxhYmVsIiwiTW9uZXJvQWNjb3VudCIsInByaW1hcnlBZGRyZXNzIiwic3ViYWRkcmVzc0luZGljZXMiLCJhZGRyZXNzX2luZGV4IiwibGlzdGlmeSIsInN1YmFkZHJlc3NlcyIsImFkZHJlc3NlcyIsImdldE51bUJsb2Nrc1RvVW5sb2NrIiwiZ2V0U3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJzZXRBZGRyZXNzIiwic2V0TGFiZWwiLCJzZXRJc1VzZWQiLCJzZXRTdWJhZGRyZXNzTGFiZWwiLCJnZXRUeHMiLCJxdWVyeSIsInF1ZXJ5Tm9ybWFsaXplZCIsIm5vcm1hbGl6ZVR4UXVlcnkiLCJ0cmFuc2ZlclF1ZXJ5IiwiZ2V0VHJhbnNmZXJRdWVyeSIsImlucHV0UXVlcnkiLCJnZXRJbnB1dFF1ZXJ5Iiwib3V0cHV0UXVlcnkiLCJnZXRPdXRwdXRRdWVyeSIsInNldFRyYW5zZmVyUXVlcnkiLCJzZXRJbnB1dFF1ZXJ5Iiwic2V0T3V0cHV0UXVlcnkiLCJ0cmFuc2ZlcnMiLCJnZXRUcmFuc2ZlcnNBdXgiLCJNb25lcm9UcmFuc2ZlclF1ZXJ5Iiwic2V0VHhRdWVyeSIsImRlY29udGV4dHVhbGl6ZSIsImNvcHkiLCJ0eHMiLCJ0eHNTZXQiLCJTZXQiLCJ0cmFuc2ZlciIsImdldFR4IiwiYWRkIiwidHhNYXAiLCJibG9ja01hcCIsInR4IiwibWVyZ2VUeCIsImdldEluY2x1ZGVPdXRwdXRzIiwib3V0cHV0UXVlcnlBdXgiLCJNb25lcm9PdXRwdXRRdWVyeSIsIm91dHB1dHMiLCJnZXRPdXRwdXRzQXV4Iiwib3V0cHV0VHhzIiwib3V0cHV0IiwidHhzUXVlcmllZCIsIm1lZXRzQ3JpdGVyaWEiLCJnZXRCbG9jayIsInNwbGljZSIsImdldElzQ29uZmlybWVkIiwiY29uc29sZSIsImVycm9yIiwiZ2V0SGFzaGVzIiwidHhzQnlJZCIsIk1hcCIsImdldEhhc2giLCJvcmRlcmVkVHhzIiwiaGFzaCIsImdldFRyYW5zZmVycyIsIm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkiLCJpc0NvbnRleHR1YWwiLCJnZXRUeFF1ZXJ5IiwiZmlsdGVyVHJhbnNmZXJzIiwiZ2V0T3V0cHV0cyIsIm5vcm1hbGl6ZU91dHB1dFF1ZXJ5IiwiZmlsdGVyT3V0cHV0cyIsImV4cG9ydE91dHB1dHMiLCJhbGwiLCJvdXRwdXRzX2RhdGFfaGV4IiwiaW1wb3J0T3V0cHV0cyIsIm91dHB1dHNIZXgiLCJudW1faW1wb3J0ZWQiLCJleHBvcnRLZXlJbWFnZXMiLCJycGNFeHBvcnRLZXlJbWFnZXMiLCJpbXBvcnRLZXlJbWFnZXMiLCJrZXlJbWFnZXMiLCJycGNLZXlJbWFnZXMiLCJtYXAiLCJrZXlJbWFnZSIsImtleV9pbWFnZSIsImdldEhleCIsInNpZ25hdHVyZSIsImdldFNpZ25hdHVyZSIsInNpZ25lZF9rZXlfaW1hZ2VzIiwiaW1wb3J0UmVzdWx0IiwiTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJzZXRIZWlnaHQiLCJzZXRTcGVudEFtb3VudCIsInNwZW50Iiwic2V0VW5zcGVudEFtb3VudCIsInVuc3BlbnQiLCJnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCIsImZyZWV6ZU91dHB1dCIsInRoYXdPdXRwdXQiLCJpc091dHB1dEZyb3plbiIsImZyb3plbiIsImdldERlZmF1bHRGZWVQcmlvcml0eSIsInByaW9yaXR5IiwiY3JlYXRlVHhzIiwibm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnIiwiZ2V0Q2FuU3BsaXQiLCJzZXRDYW5TcGxpdCIsImdldFJlbGF5IiwiaXNNdWx0aXNpZyIsImdldFN1YmFkZHJlc3NJbmRpY2VzIiwic2xpY2UiLCJkZXN0aW5hdGlvbnMiLCJkZXN0aW5hdGlvbiIsImdldERlc3RpbmF0aW9ucyIsImdldEFtb3VudCIsImFtb3VudCIsInRvU3RyaW5nIiwiZ2V0U3VidHJhY3RGZWVGcm9tIiwic3VidHJhY3RfZmVlX2Zyb21fb3V0cHV0cyIsInN1YmFkZHJfaW5kaWNlcyIsImdldFBheW1lbnRJZCIsImRvX25vdF9yZWxheSIsImdldFByaW9yaXR5IiwiZ2V0X3R4X2hleCIsImdldF90eF9tZXRhZGF0YSIsImdldF90eF9rZXlzIiwiZ2V0X3R4X2tleSIsIm51bVR4cyIsImZlZV9saXN0IiwiZmVlIiwiY29weURlc3RpbmF0aW9ucyIsImkiLCJNb25lcm9UeFdhbGxldCIsImluaXRTZW50VHhXYWxsZXQiLCJnZXRPdXRnb2luZ1RyYW5zZmVyIiwic2V0U3ViYWRkcmVzc0luZGljZXMiLCJjb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQiLCJjb252ZXJ0UnBjVHhUb1R4U2V0Iiwic3dlZXBPdXRwdXQiLCJub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyIsImdldEtleUltYWdlIiwic2V0QW1vdW50Iiwic3dlZXBVbmxvY2tlZCIsIm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWciLCJpbmRpY2VzIiwia2V5cyIsInNldFN3ZWVwRWFjaFN1YmFkZHJlc3MiLCJnZXRTd2VlcEVhY2hTdWJhZGRyZXNzIiwicnBjU3dlZXBBY2NvdW50Iiwic3dlZXBEdXN0IiwicmVsYXkiLCJ0eFNldCIsInNldElzUmVsYXllZCIsInNldEluVHhQb29sIiwiZ2V0SXNSZWxheWVkIiwicmVsYXlUeHMiLCJ0eHNPck1ldGFkYXRhcyIsIkFycmF5IiwiaXNBcnJheSIsInR4T3JNZXRhZGF0YSIsIm1ldGFkYXRhIiwiZ2V0TWV0YWRhdGEiLCJoZXgiLCJ0eF9oYXNoIiwiZGVzY3JpYmVUeFNldCIsInVuc2lnbmVkX3R4c2V0IiwiZ2V0VW5zaWduZWRUeEhleCIsIm11bHRpc2lnX3R4c2V0IiwiZ2V0TXVsdGlzaWdUeEhleCIsImNvbnZlcnRScGNEZXNjcmliZVRyYW5zZmVyIiwic2lnblR4cyIsInVuc2lnbmVkVHhIZXgiLCJleHBvcnRfcmF3Iiwic3VibWl0VHhzIiwic2lnbmVkVHhIZXgiLCJ0eF9kYXRhX2hleCIsInR4X2hhc2hfbGlzdCIsInNpZ25NZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiU0lHTl9XSVRIX1NQRU5EX0tFWSIsImRhdGEiLCJzaWduYXR1cmVfdHlwZSIsInZlcmlmeU1lc3NhZ2UiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiZ29vZCIsImlzR29vZCIsImlzT2xkIiwib2xkIiwiU0lHTl9XSVRIX1ZJRVdfS0VZIiwiZ2V0VHhLZXkiLCJ0eEhhc2giLCJ0eGlkIiwidHhfa2V5IiwiY2hlY2tUeEtleSIsInR4S2V5IiwiY2hlY2siLCJNb25lcm9DaGVja1R4Iiwic2V0SXNHb29kIiwic2V0TnVtQ29uZmlybWF0aW9ucyIsImNvbmZpcm1hdGlvbnMiLCJpbl9wb29sIiwic2V0UmVjZWl2ZWRBbW91bnQiLCJyZWNlaXZlZCIsImdldFR4UHJvb2YiLCJjaGVja1R4UHJvb2YiLCJnZXRTcGVuZFByb29mIiwiY2hlY2tTcGVuZFByb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsIk1vbmVyb0NoZWNrUmVzZXJ2ZSIsInNldFVuY29uZmlybWVkU3BlbnRBbW91bnQiLCJzZXRUb3RhbEFtb3VudCIsInRvdGFsIiwiZ2V0VHhOb3RlcyIsIm5vdGVzIiwic2V0VHhOb3RlcyIsImdldEFkZHJlc3NCb29rRW50cmllcyIsImVudHJ5SW5kaWNlcyIsImVudHJpZXMiLCJycGNFbnRyeSIsIk1vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJzZXREZXNjcmlwdGlvbiIsImRlc2NyaXB0aW9uIiwiYWRkQWRkcmVzc0Jvb2tFbnRyeSIsImVkaXRBZGRyZXNzQm9va0VudHJ5Iiwic2V0X2FkZHJlc3MiLCJzZXRfZGVzY3JpcHRpb24iLCJkZWxldGVBZGRyZXNzQm9va0VudHJ5IiwiZW50cnlJZHgiLCJ0YWdBY2NvdW50cyIsImFjY291bnRJbmRpY2VzIiwidW50YWdBY2NvdW50cyIsImdldEFjY291bnRUYWdzIiwidGFncyIsImFjY291bnRfdGFncyIsInJwY0FjY291bnRUYWciLCJNb25lcm9BY2NvdW50VGFnIiwic2V0QWNjb3VudFRhZ0xhYmVsIiwiZ2V0UGF5bWVudFVyaSIsInJlY2lwaWVudF9uYW1lIiwiZ2V0UmVjaXBpZW50TmFtZSIsInR4X2Rlc2NyaXB0aW9uIiwiZ2V0Tm90ZSIsInVyaSIsInBhcnNlUGF5bWVudFVyaSIsIk1vbmVyb1R4Q29uZmlnIiwic2V0UmVjaXBpZW50TmFtZSIsInNldE5vdGUiLCJnZXRBdHRyaWJ1dGUiLCJ2YWx1ZSIsInNldEF0dHJpYnV0ZSIsInZhbCIsInN0YXJ0TWluaW5nIiwibnVtVGhyZWFkcyIsImJhY2tncm91bmRNaW5pbmciLCJpZ25vcmVCYXR0ZXJ5IiwidGhyZWFkc19jb3VudCIsImRvX2JhY2tncm91bmRfbWluaW5nIiwiaWdub3JlX2JhdHRlcnkiLCJzdG9wTWluaW5nIiwiaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCIsIm11bHRpc2lnX2ltcG9ydF9uZWVkZWQiLCJnZXRNdWx0aXNpZ0luZm8iLCJpbmZvIiwiTW9uZXJvTXVsdGlzaWdJbmZvIiwic2V0SXNNdWx0aXNpZyIsIm11bHRpc2lnIiwic2V0SXNSZWFkeSIsInJlYWR5Iiwic2V0VGhyZXNob2xkIiwidGhyZXNob2xkIiwic2V0TnVtUGFydGljaXBhbnRzIiwicHJlcGFyZU11bHRpc2lnIiwibXVsdGlzaWdfaW5mbyIsIm1ha2VNdWx0aXNpZyIsIm11bHRpc2lnSGV4ZXMiLCJleGNoYW5nZU11bHRpc2lnS2V5cyIsIm1zUmVzdWx0IiwiTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0Iiwic2V0TXVsdGlzaWdIZXgiLCJnZXRNdWx0aXNpZ0hleCIsImV4cG9ydE11bHRpc2lnSGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJyZWZyZXNoQWZ0ZXJJbXBvcnQiLCJyZWZyZXNoX2FmdGVyX2ltcG9ydCIsIm5fb3V0cHV0cyIsInNpZ25NdWx0aXNpZ1R4SGV4IiwibXVsdGlzaWdUeEhleCIsInNpZ25SZXN1bHQiLCJNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJzZXRTaWduZWRNdWx0aXNpZ1R4SGV4Iiwic2V0VHhIYXNoZXMiLCJzdWJtaXRNdWx0aXNpZ1R4SGV4Iiwic2lnbmVkTXVsdGlzaWdUeEhleCIsImNoYW5nZVBhc3N3b3JkIiwib2xkUGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsIm9sZF9wYXNzd29yZCIsIm5ld19wYXNzd29yZCIsInNhdmUiLCJjbG9zZSIsImlzQ2xvc2VkIiwic3RvcCIsImdldEluY29taW5nVHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlcnMiLCJjcmVhdGVUeCIsInJlbGF5VHgiLCJnZXRUeE5vdGUiLCJzZXRUeE5vdGUiLCJub3RlIiwiY29ubmVjdFRvV2FsbGV0UnBjIiwidXJpT3JDb25maWciLCJub3JtYWxpemVDb25maWciLCJjbWQiLCJzdGFydFdhbGxldFJwY1Byb2Nlc3MiLCJjaGlsZF9wcm9jZXNzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aGVuIiwiY2hpbGRQcm9jZXNzIiwic3Bhd24iLCJlbnYiLCJMQU5HIiwic3Rkb3V0Iiwic2V0RW5jb2RpbmciLCJzdGRlcnIiLCJ0aGF0IiwicmVqZWN0Iiwib24iLCJsaW5lIiwiTGlicmFyeVV0aWxzIiwibG9nIiwidXJpTGluZUNvbnRhaW5zIiwidXJpTGluZUNvbnRhaW5zSWR4IiwiaG9zdCIsInN1YnN0cmluZyIsImxhc3RJbmRleE9mIiwidW5mb3JtYXR0ZWRMaW5lIiwicmVwbGFjZSIsInRyaW0iLCJwb3J0Iiwic3NsSWR4Iiwic3NsRW5hYmxlZCIsInVzZXJQYXNzSWR4IiwidXNlclBhc3MiLCJ6bXFVcmlJZHgiLCJ6bXFVcmkiLCJwcm94eVVyaUlkeCIsInByb3h5VXJpIiwicmVqZWN0VW5hdXRob3JpemVkIiwiZ2V0UmVqZWN0VW5hdXRob3JpemVkIiwid2FsbGV0IiwiaXNSZXNvbHZlZCIsImdldExvZ0xldmVsIiwiY29kZSIsIm9yaWdpbiIsImdldEFjY291bnRJbmRpY2VzIiwidHhRdWVyeSIsImNhbkJlQ29uZmlybWVkIiwiZ2V0SW5UeFBvb2wiLCJnZXRJc0ZhaWxlZCIsImNhbkJlSW5UeFBvb2wiLCJnZXRNYXhIZWlnaHQiLCJnZXRJc0xvY2tlZCIsImNhbkJlSW5jb21pbmciLCJnZXRJc0luY29taW5nIiwiZ2V0SXNPdXRnb2luZyIsImdldEhhc0Rlc3RpbmF0aW9ucyIsImNhbkJlT3V0Z29pbmciLCJpbiIsIm91dCIsInBvb2wiLCJwZW5kaW5nIiwiZmFpbGVkIiwiZ2V0TWluSGVpZ2h0IiwibWluX2hlaWdodCIsIm1heF9oZWlnaHQiLCJmaWx0ZXJfYnlfaGVpZ2h0IiwiZ2V0U3ViYWRkcmVzc0luZGV4Iiwic2l6ZSIsImZyb20iLCJycGNUeCIsImNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlciIsImdldE91dGdvaW5nQW1vdW50Iiwib3V0Z29pbmdUcmFuc2ZlciIsInRyYW5zZmVyVG90YWwiLCJ2YWx1ZXMiLCJzb3J0IiwiY29tcGFyZVR4c0J5SGVpZ2h0Iiwic2V0SXNJbmNvbWluZyIsInNldElzT3V0Z29pbmciLCJjb21wYXJlSW5jb21pbmdUcmFuc2ZlcnMiLCJ0cmFuc2Zlcl90eXBlIiwiZ2V0SXNTcGVudCIsInZlcmJvc2UiLCJycGNPdXRwdXQiLCJjb252ZXJ0UnBjVHhXaXRoT3V0cHV0IiwiY29tcGFyZU91dHB1dHMiLCJycGNJbWFnZSIsIk1vbmVyb0tleUltYWdlIiwiYmVsb3dfYW1vdW50IiwiZ2V0QmVsb3dBbW91bnQiLCJzZXRJc0xvY2tlZCIsInNldElzQ29uZmlybWVkIiwic2V0UmVsYXkiLCJzZXRJc01pbmVyVHgiLCJzZXRJc0ZhaWxlZCIsIk1vbmVyb0Rlc3RpbmF0aW9uIiwic2V0RGVzdGluYXRpb25zIiwic2V0T3V0Z29pbmdUcmFuc2ZlciIsImdldFVubG9ja1RpbWUiLCJzZXRVbmxvY2tUaW1lIiwiZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJzZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsIkRhdGUiLCJnZXRUaW1lIiwiZ2V0SXNEb3VibGVTcGVuZFNlZW4iLCJzZXRJc0RvdWJsZVNwZW5kU2VlbiIsImxpc3RlbmVycyIsIldhbGxldFBvbGxlciIsInNldElzUG9sbGluZyIsImlzUG9sbGluZyIsInNlcnZlciIsInByb3h5VG9Xb3JrZXIiLCJzZXRQcmltYXJ5QWRkcmVzcyIsInNldFRhZyIsImdldFRhZyIsInNldFJpbmdTaXplIiwiTW9uZXJvVXRpbHMiLCJSSU5HX1NJWkUiLCJNb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwic2V0VHgiLCJkZXN0Q29waWVzIiwiZGVzdCIsImNvbnZlcnRScGNUeFNldCIsInJwY01hcCIsIk1vbmVyb1R4U2V0Iiwic2V0TXVsdGlzaWdUeEhleCIsInNldFVuc2lnbmVkVHhIZXgiLCJzZXRTaWduZWRUeEhleCIsInNpZ25lZF90eHNldCIsImdldFNpZ25lZFR4SGV4IiwicnBjVHhzIiwic2V0VHhzIiwic2V0VHhTZXQiLCJzZXRIYXNoIiwic2V0S2V5Iiwic2V0RnVsbEhleCIsInNldE1ldGFkYXRhIiwic2V0RmVlIiwic2V0V2VpZ2h0IiwiaW5wdXRLZXlJbWFnZXNMaXN0IiwiYXNzZXJ0VHJ1ZSIsImdldElucHV0cyIsInNldElucHV0cyIsImlucHV0S2V5SW1hZ2UiLCJNb25lcm9PdXRwdXRXYWxsZXQiLCJzZXRLZXlJbWFnZSIsInNldEhleCIsImFtb3VudHNCeURlc3RMaXN0IiwiZGVzdGluYXRpb25JZHgiLCJ0eElkeCIsImFtb3VudHNCeURlc3QiLCJpc091dGdvaW5nIiwidHlwZSIsImRlY29kZVJwY1R5cGUiLCJoZWFkZXIiLCJzZXRTaXplIiwiTW9uZXJvQmxvY2tIZWFkZXIiLCJzZXRUaW1lc3RhbXAiLCJNb25lcm9JbmNvbWluZ1RyYW5zZmVyIiwic2V0TnVtU3VnZ2VzdGVkQ29uZmlybWF0aW9ucyIsIkRFRkFVTFRfUEFZTUVOVF9JRCIsInJwY0luZGljZXMiLCJycGNJbmRleCIsInNldFN1YmFkZHJlc3NJbmRleCIsInJwY0Rlc3RpbmF0aW9uIiwiZGVzdGluYXRpb25LZXkiLCJzZXRJbnB1dFN1bSIsInNldE91dHB1dFN1bSIsInNldENoYW5nZUFkZHJlc3MiLCJzZXRDaGFuZ2VBbW91bnQiLCJzZXROdW1EdW1teU91dHB1dHMiLCJzZXRFeHRyYUhleCIsImlucHV0S2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsImFtb3VudHMiLCJzZXRCbG9jayIsIk1vbmVyb0Jsb2NrIiwibWVyZ2UiLCJzZXRJbmNvbWluZ1RyYW5zZmVycyIsInNldElzU3BlbnQiLCJzZXRJc0Zyb3plbiIsInNldFN0ZWFsdGhQdWJsaWNLZXkiLCJzZXRPdXRwdXRzIiwicnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdCIsInJwY1R5cGUiLCJhVHgiLCJhQmxvY2siLCJ0eDEiLCJ0eDIiLCJkaWZmIiwidDEiLCJ0MiIsIm8xIiwibzIiLCJoZWlnaHRDb21wYXJpc29uIiwiY29tcGFyZSIsImxvY2FsZUNvbXBhcmUiLCJleHBvcnRzIiwibG9vcGVyIiwiVGFza0xvb3BlciIsInByZXZMb2NrZWRUeHMiLCJwcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zIiwicHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMiLCJ0aHJlYWRQb29sIiwiVGhyZWFkUG9vbCIsIm51bVBvbGxpbmciLCJzdGFydCIsInBlcmlvZEluTXMiLCJzdWJtaXQiLCJwcmV2QmFsYW5jZXMiLCJwcmV2SGVpZ2h0IiwiTW9uZXJvVHhRdWVyeSIsIm9uTmV3QmxvY2siLCJtaW5IZWlnaHQiLCJtYXgiLCJsb2NrZWRUeHMiLCJzZXRNaW5IZWlnaHQiLCJzZXRJbmNsdWRlT3V0cHV0cyIsIm5vTG9uZ2VyTG9ja2VkSGFzaGVzIiwicHJldkxvY2tlZFR4IiwidW5sb2NrZWRUeHMiLCJzZXRIYXNoZXMiLCJsb2NrZWRUeCIsInNlYXJjaFNldCIsInVuYW5ub3VuY2VkIiwibm90aWZ5T3V0cHV0cyIsInVubG9ja2VkVHgiLCJkZWxldGUiLCJjaGVja0ZvckNoYW5nZWRCYWxhbmNlcyIsImFubm91bmNlTmV3QmxvY2siLCJnZXRGZWUiLCJhbm5vdW5jZU91dHB1dFNwZW50IiwiYW5ub3VuY2VPdXRwdXRSZWNlaXZlZCIsImJhbGFuY2VzIiwiYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0UnBjLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuLi9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBUYXNrTG9vcGVyIGZyb20gXCIuLi9jb21tb24vVGFza0xvb3BlclwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnRUYWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFRhZ1wiO1xuaW1wb3J0IE1vbmVyb0FkZHJlc3NCb29rRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9CbG9ja0hlYWRlciBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrSGVhZGVyXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tSZXNlcnZlIGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrUmVzZXJ2ZVwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrVHggZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tUeFwiO1xuaW1wb3J0IE1vbmVyb0Rlc3RpbmF0aW9uIGZyb20gXCIuL21vZGVsL01vbmVyb0Rlc3RpbmF0aW9uXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0luY29taW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW5jb21pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5mb1wiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luaXRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0UXVlcnlcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9ScGNFcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvU3ViYWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJhZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvU3luY1Jlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TeW5jUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlclF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyUXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFByaW9yaXR5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UHJpb3JpdHlcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1R4V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0IGZyb20gXCIuL01vbmVyb1dhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRDb25maWdcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0XCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi4vY29tbW9uL1RocmVhZFBvb2xcIjtcbmltcG9ydCBTc2xPcHRpb25zIGZyb20gXCIuLi9jb21tb24vU3NsT3B0aW9uc1wiO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIHdvb2RzZXJcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb1dhbGxldCBhcyBhIGNsaWVudCBvZiBtb25lcm8td2FsbGV0LXJwYy5cbiAqIFxuICogQGltcGxlbWVudHMge01vbmVyb1dhbGxldH1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvV2FsbGV0UnBjIGV4dGVuZHMgTW9uZXJvV2FsbGV0IHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA9IDIwMDAwOyAvLyBkZWZhdWx0IHBlcmlvZCBiZXR3ZWVuIHN5bmNzIGluIG1zIChkZWZpbmVkIGJ5IERFRkFVTFRfQVVUT19SRUZSRVNIX1BFUklPRCBpbiB3YWxsZXRfcnBjX3NlcnZlci5jcHApXG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPjtcbiAgcHJvdGVjdGVkIGFkZHJlc3NDYWNoZTogYW55O1xuICBwcm90ZWN0ZWQgc3luY1BlcmlvZEluTXM6IG51bWJlcjtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXTtcbiAgcHJvdGVjdGVkIHByb2Nlc3M6IGFueTtcbiAgcHJvdGVjdGVkIHBhdGg6IHN0cmluZztcbiAgcHJvdGVjdGVkIGRhZW1vbkNvbm5lY3Rpb246IE1vbmVyb1JwY0Nvbm5lY3Rpb247XG4gIHByb3RlY3RlZCB3YWxsZXRQb2xsZXI6IFdhbGxldFBvbGxlcjtcbiAgcHJvdGVjdGVkIHN0YXJ0dXBQcm94eVVyaTogc3RyaW5nO1xuICBcbiAgLyoqIEBwcml2YXRlICovXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9OyAvLyBhdm9pZCB1bmVjZXNzYXJ5IHJlcXVlc3RzIGZvciBhZGRyZXNzZXNcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gTW9uZXJvV2FsbGV0UnBjLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVM7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBSUEMgV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtDaGlsZFByb2Nlc3N9IHRoZSBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMsIHVuZGVmaW5lZCBpZiBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXG4gICAqL1xuICBnZXRQcm9jZXNzKCk6IENoaWxkUHJvY2VzcyB7XG4gICAgcmV0dXJuIHRoaXMucHJvY2VzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3AgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm8td2FsbGV0LXJwYywgaWYgYXBwbGljYWJsZS5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2Ugc3BlY2lmaWVzIGlmIHRoZSBwcm9jZXNzIHNob3VsZCBiZSBkZXN0cm95ZWQgZm9yY2libHkgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPn0gdGhlIGV4aXQgY29kZSBmcm9tIHN0b3BwaW5nIHRoZSBwcm9jZXNzXG4gICAqL1xuICBhc3luYyBzdG9wUHJvY2Vzcyhmb3JjZSA9IGZhbHNlKTogUHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+ICB7XG4gICAgaWYgKHRoaXMucHJvY2VzcyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMgaW5zdGFuY2Ugbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1wiKTtcbiAgICBsZXQgbGlzdGVuZXJzQ29weSA9IEdlblV0aWxzLmNvcHlBcnJheSh0aGlzLmdldExpc3RlbmVycygpKTtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnNDb3B5KSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gR2VuVXRpbHMua2lsbFByb2Nlc3ModGhpcy5wcm9jZXNzLCBmb3JjZSA/IFwiU0lHS0lMTFwiIDogdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgUlBDIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9uIHwgdW5kZWZpbmVkfSB0aGUgd2FsbGV0J3MgcnBjIGNvbm5lY3Rpb25cbiAgICovXG4gIGdldFJwY0Nvbm5lY3Rpb24oKTogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+T3BlbiBhbiBleGlzdGluZyB3YWxsZXQgb24gdGhlIG1vbmVyby13YWxsZXQtcnBjIHNlcnZlci48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlOjxwPlxuICAgKiBcbiAgICogPGNvZGU+XG4gICAqIGxldCB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0UnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4NFwiLCBcInJwY191c2VyXCIsIFwiYWJjMTIzXCIpOzxicj5cbiAgICogYXdhaXQgd2FsbGV0Lm9wZW5XYWxsZXQoXCJteXdhbGxldDFcIiwgXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIpOzxicj5cbiAgICogPGJyPlxuICAgKiBhd2FpdCB3YWxsZXQub3BlbldhbGxldCh7PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGF0aDogXCJteXdhbGxldDJcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VydmVyOiBcImh0dHA6Ly9sb2NhaG9zdDozODA4MVwiLCAvLyBvciBvYmplY3Qgd2l0aCB1cmksIHVzZXJuYW1lLCBwYXNzd29yZCwgZXRjIDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2U8YnI+XG4gICAqIH0pOzxicj5cbiAgICogPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvV2FsbGV0Q29uZmlnfSBwYXRoT3JDb25maWcgIC0gdGhlIHdhbGxldCdzIG5hbWUgb3IgY29uZmlndXJhdGlvbiB0byBvcGVuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoT3JDb25maWcucGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCBpbi1tZW1vcnkgd2FsbGV0IGlmIG5vdCBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhPckNvbmZpZy5wYXNzd29yZCAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IHBhdGhPckNvbmZpZy5zZXJ2ZXIgLSB1cmkgb3IgTW9uZXJvUnBjQ29ubmVjdGlvbiBvZiBhIGRhZW1vbiB0byB1c2UgKG9wdGlvbmFsLCBtb25lcm8td2FsbGV0LXJwYyB1c3VhbGx5IHN0YXJ0ZWQgd2l0aCBkYWVtb24gY29uZmlnKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3Bhc3N3b3JkXSB0aGUgd2FsbGV0J3MgcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9XYWxsZXRScGM+fSB0aGlzIHdhbGxldCBjbGllbnRcbiAgICovXG4gIGFzeW5jIG9wZW5XYWxsZXQocGF0aE9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4sIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHR5cGVvZiBwYXRoT3JDb25maWcgPT09IFwic3RyaW5nXCIgPyB7cGF0aDogcGF0aE9yQ29uZmlnLCBwYXNzd29yZDogcGFzc3dvcmQgPyBwYXNzd29yZCA6IFwiXCJ9IDogcGF0aE9yQ29uZmlnKTtcbiAgICAvLyBUT0RPOiBlbnN1cmUgb3RoZXIgZmllbGRzIHVuaW5pdGlhbGl6ZWQ/XG4gICAgXG4gICAgLy8gb3BlbiB3YWxsZXQgb24gcnBjIHNlcnZlclxuICAgIGlmICghY29uZmlnLmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIG5hbWUgb2Ygd2FsbGV0IHRvIG9wZW5cIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZWd0ZXN0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcmVndGVzdCBtb2RlIHdoZW4gb3BlbmluZyBSUEMgd2FsbGV0XCIpXG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwib3Blbl93YWxsZXRcIiwge2ZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLCBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCl9KTtcbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXIgb3Igc2VydmVyXG4gICAgaWYgKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpICE9IG51bGwpIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgb3BlbmVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGF3YWl0IHRoaXMuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIH0gZWxzZSBpZiAoY29uZmlnLmdldFNlcnZlcigpICE9IG51bGwpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2V0RGFlbW9uQ29ubmVjdGlvbihjb25maWcuZ2V0U2VydmVyKCkpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPkNyZWF0ZSBhbmQgb3BlbiBhIHdhbGxldCBvbiB0aGUgbW9uZXJvLXdhbGxldC1ycGMgc2VydmVyLjxwPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZTo8cD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiAmc29sOyZzb2w7IGNvbnN0cnVjdCBjbGllbnQgdG8gbW9uZXJvLXdhbGxldC1ycGM8YnI+XG4gICAqIGxldCB3YWxsZXRScGMgPSBuZXcgTW9uZXJvV2FsbGV0UnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4NFwiLCBcInJwY191c2VyXCIsIFwiYWJjMTIzXCIpOzxicj48YnI+XG4gICAqIFxuICAgKiAmc29sOyZzb2w7IGNyZWF0ZSBhbmQgb3BlbiB3YWxsZXQgb24gbW9uZXJvLXdhbGxldC1ycGM8YnI+XG4gICAqIGF3YWl0IHdhbGxldFJwYy5jcmVhdGVXYWxsZXQoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwibXl3YWxsZXRcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJhYmMxMjNcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBzZWVkOiBcImNvZXhpc3QgaWdsb28gcGFtcGhsZXQgbGFnb29uLi4uXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcmVzdG9yZUhlaWdodDogMTU0MzIxOGw8YnI+XG4gICAqIH0pO1xuICAgKiAgPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz59IGNvbmZpZyAtIE1vbmVyb1dhbGxldENvbmZpZyBvciBlcXVpdmFsZW50IEpTIG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXRoXSAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCBpbi1tZW1vcnkgd2FsbGV0IGlmIG5vdCBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGFzc3dvcmRdIC0gcGFzc3dvcmQgb2YgdGhlIHdhbGxldCB0byBjcmVhdGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZF0gLSBzZWVkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgcmFuZG9tIHdhbGxldCBjcmVhdGVkIGlmIG5laXRoZXIgc2VlZCBub3Iga2V5cyBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZE9mZnNldF0gLSB0aGUgb2Zmc2V0IHVzZWQgdG8gZGVyaXZlIGEgbmV3IHNlZWQgZnJvbSB0aGUgZ2l2ZW4gc2VlZCB0byByZWNvdmVyIGEgc2VjcmV0IHdhbGxldCBmcm9tIHRoZSBzZWVkXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5pc011bHRpc2lnXSAtIHJlc3RvcmUgbXVsdGlzaWcgd2FsbGV0IGZyb20gc2VlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcmltYXJ5QWRkcmVzc10gLSBwcmltYXJ5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9ubHkgcHJvdmlkZSBpZiByZXN0b3JpbmcgZnJvbSBrZXlzKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlVmlld0tleV0gLSBwcml2YXRlIHZpZXcga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVNwZW5kS2V5XSAtIHByaXZhdGUgc3BlbmQga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcucmVzdG9yZUhlaWdodF0gLSBibG9jayBoZWlnaHQgdG8gc3RhcnQgc2Nhbm5pbmcgZnJvbSAoZGVmYXVsdHMgdG8gMCB1bmxlc3MgZ2VuZXJhdGluZyByYW5kb20gd2FsbGV0KVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5sYW5ndWFnZV0gLSBsYW5ndWFnZSBvZiB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQgKGRlZmF1bHRzIHRvIFwiRW5nbGlzaFwiIG9yIGF1dG8tZGV0ZWN0ZWQpXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gW2NvbmZpZy5zZXJ2ZXJdIC0gTW9uZXJvUnBjQ29ubmVjdGlvbiB0byBhIG1vbmVybyBkYWVtb24gKG9wdGlvbmFsKTxicj5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyVXJpXSAtIHVyaSBvZiBhIGRhZW1vbiB0byB1c2UgKG9wdGlvbmFsLCBtb25lcm8td2FsbGV0LXJwYyB1c3VhbGx5IHN0YXJ0ZWQgd2l0aCBkYWVtb24gY29uZmlnKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZXJ2ZXJVc2VybmFtZV0gLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgZGFlbW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyUGFzc3dvcmRdIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIGRhZW1vbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJ9IFtjb25maWcuY29ubmVjdGlvbk1hbmFnZXJdIC0gbWFuYWdlIGNvbm5lY3Rpb25zIHRvIG1vbmVyb2QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVqZWN0VW5hdXRob3JpemVkXSAtIHJlamVjdCBzZWxmLXNpZ25lZCBzZXJ2ZXIgY2VydGlmaWNhdGVzIGlmIHRydWUgKGRlZmF1bHRzIHRvIHRydWUpXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gW2NvbmZpZy5zZXJ2ZXJdIC0gTW9uZXJvUnBjQ29ubmVjdGlvbiBvciBlcXVpdmFsZW50IEpTIG9iamVjdCBwcm92aWRpbmcgZGFlbW9uIGNvbmZpZ3VyYXRpb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuc2F2ZUN1cnJlbnRdIC0gc3BlY2lmaWVzIGlmIHRoZSBjdXJyZW50IFJQQyB3YWxsZXQgc2hvdWxkIGJlIHNhdmVkIGJlZm9yZSBiZWluZyBjbG9zZWQgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHJldHVybiB7TW9uZXJvV2FsbGV0UnBjfSB0aGlzIHdhbGxldCBjbGllbnRcbiAgICovXG4gIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBjb25maWcgdG8gY3JlYXRlIHdhbGxldFwiKTtcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkICYmIChjb25maWdOb3JtYWxpemVkLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVWaWV3S2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIGluaXRpYWxpemVkIHdpdGggYSBzZWVkIG9yIGtleXMgYnV0IG5vdCBib3RoXCIpO1xuICAgIH1cbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWd0ZXN0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcmVndGVzdCBtb2RlIHdoZW4gY3JlYXRpbmcgUlBDIHdhbGxldFwiKVxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldE5ldHdvcmtUeXBlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgbmV0d29ya1R5cGUgd2hlbiBjcmVhdGluZyBSUEMgd2FsbGV0IGJlY2F1c2Ugc2VydmVyJ3MgbmV0d29yayB0eXBlIGlzIGFscmVhZHkgc2V0XCIpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRMb29rYWhlYWQoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0xvb2thaGVhZCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgY3JlYXRpbmcgd2FsbGV0cyB3aXRoIHN1YmFkZHJlc3MgbG9va2FoZWFkIG92ZXIgcnBjXCIpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFBhc3N3b3JkKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRQYXNzd29yZChcIlwiKTtcblxuICAgIC8vIHNldCBzZXJ2ZXIgZnJvbSBjb25uZWN0aW9uIG1hbmFnZXIgaWYgcHJvdmlkZWRcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBjcmVhdGVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGNvbmZpZ05vcm1hbGl6ZWQuc2V0U2VydmVyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpLmdldENvbm5lY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIHdhbGxldFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZ05vcm1hbGl6ZWQpO1xuICAgIGVsc2UgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWdOb3JtYWxpemVkKTtcbiAgICBlbHNlIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZ05vcm1hbGl6ZWQpO1xuXG4gICAgLy8gc2V0IGNvbm5lY3Rpb24gbWFuYWdlciBvciBzZXJ2ZXJcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSk7XG4gICAgfSBlbHNlIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlcnZlcigpKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldERhZW1vbkNvbm5lY3Rpb24oY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgcmVzdG9yZUhlaWdodCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSBmYWxzZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ3VycmVudCB3YWxsZXQgaXMgc2F2ZWQgYXV0b21hdGljYWxseSB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0UGF0aCgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOYW1lIGlzIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICBpZiAoIWNvbmZpZy5nZXRMYW5ndWFnZSgpKSBjb25maWcuc2V0TGFuZ3VhZ2UoTW9uZXJvV2FsbGV0LkRFRkFVTFRfTEFOR1VBR0UpO1xuICAgIGxldCBwYXJhbXMgPSB7IGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLCBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksIGxhbmd1YWdlOiBjb25maWcuZ2V0TGFuZ3VhZ2UoKSB9O1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfd2FsbGV0XCIsIHBhcmFtcyk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXN0b3JlX2RldGVybWluaXN0aWNfd2FsbGV0XCIsIHtcbiAgICAgICAgZmlsZW5hbWU6IGNvbmZpZy5nZXRQYXRoKCksXG4gICAgICAgIHBhc3N3b3JkOiBjb25maWcuZ2V0UGFzc3dvcmQoKSxcbiAgICAgICAgc2VlZDogY29uZmlnLmdldFNlZWQoKSxcbiAgICAgICAgc2VlZF9vZmZzZXQ6IGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCksXG4gICAgICAgIGVuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWw6IGNvbmZpZy5nZXRJc011bHRpc2lnKCksXG4gICAgICAgIHJlc3RvcmVfaGVpZ2h0OiBjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpLFxuICAgICAgICBsYW5ndWFnZTogY29uZmlnLmdldExhbmd1YWdlKCksXG4gICAgICAgIGF1dG9zYXZlX2N1cnJlbnQ6IGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhpcy5oYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihjb25maWcuZ2V0UGF0aCgpLCBlcnIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHdhbGxldCBmcm9tIGtleXNcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFJlc3RvcmVIZWlnaHQoMCk7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShNb25lcm9XYWxsZXQuREVGQVVMVF9MQU5HVUFHRSk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdlbmVyYXRlX2Zyb21fa2V5c1wiLCB7XG4gICAgICAgIGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLFxuICAgICAgICBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksXG4gICAgICAgIGFkZHJlc3M6IGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpLFxuICAgICAgICB2aWV3a2V5OiBjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSxcbiAgICAgICAgc3BlbmRrZXk6IGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSxcbiAgICAgICAgcmVzdG9yZV9oZWlnaHQ6IGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCksXG4gICAgICAgIGF1dG9zYXZlX2N1cnJlbnQ6IGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhpcy5oYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihjb25maWcuZ2V0UGF0aCgpLCBlcnIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKG5hbWUsIGVycikge1xuICAgIGlmIChlcnIubWVzc2FnZSkge1xuICAgICAgaWYgKGVyci5tZXNzYWdlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoXCJhbHJlYWR5IGV4aXN0c1wiKSkgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKFwiV2FsbGV0IGFscmVhZHkgZXhpc3RzOiBcIiArIG5hbWUsIGVyci5nZXRDb2RlKCksIGVyci5nZXRScGNNZXRob2QoKSwgZXJyLmdldFJwY1BhcmFtcygpKTtcbiAgICAgIGlmIChlcnIubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwid29yZCBsaXN0IGZhaWxlZCB2ZXJpZmljYXRpb25cIikpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihcIkludmFsaWQgbW5lbW9uaWNcIiwgZXJyLmdldENvZGUoKSwgZXJyLmdldFJwY01ldGhvZCgpLCBlcnIuZ2V0UnBjUGFyYW1zKCkpO1xuICAgIH1cbiAgICB0aHJvdyBlcnI7XG4gIH1cbiAgXG4gIGFzeW5jIGlzVmlld09ubHkoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7a2V5X3R5cGU6IFwibW5lbW9uaWNcIn0pO1xuICAgICAgcmV0dXJuIGZhbHNlOyAvLyBrZXkgcmV0cmlldmFsIHN1Y2NlZWRzIGlmIG5vdCB2aWV3IG9ubHlcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTI5KSByZXR1cm4gdHJ1ZTsgIC8vIHdhbGxldCBpcyB2aWV3IG9ubHlcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTEpIHJldHVybiBmYWxzZTsgIC8vIHdhbGxldCBpcyBvZmZsaW5lIGJ1dCBub3QgdmlldyBvbmx5XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgd2FsbGV0J3MgZGFlbW9uIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ3xNb25lcm9ScGNDb25uZWN0aW9ufSBbdXJpT3JDb25uZWN0aW9uXSAtIHRoZSBkYWVtb24ncyBVUkkgb3IgY29ubmVjdGlvbiAoZGVmYXVsdHMgdG8gb2ZmbGluZSlcbiAgICogQHBhcmFtIHtib29sZWFufSBpc1RydXN0ZWQgLSBpbmRpY2F0ZXMgaWYgdGhlIGRhZW1vbiBpbiB0cnVzdGVkXG4gICAqIEBwYXJhbSB7U3NsT3B0aW9uc30gc3NsT3B0aW9ucyAtIGN1c3RvbSBTU0wgY29uZmlndXJhdGlvblxuICAgKi9cbiAgYXN5bmMgc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24/OiBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgc3RyaW5nLCBpc1RydXN0ZWQ/OiBib29sZWFuLCBzc2xPcHRpb25zPzogU3NsT3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCBjb25uZWN0aW9uID0gIXVyaU9yQ29ubmVjdGlvbiA/IHVuZGVmaW5lZCA6IHVyaU9yQ29ubmVjdGlvbiBpbnN0YW5jZW9mIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPyB1cmlPckNvbm5lY3Rpb24gOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24pO1xuICAgIGlmICghc3NsT3B0aW9ucykgc3NsT3B0aW9ucyA9IG5ldyBTc2xPcHRpb25zKCk7XG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmFkZHJlc3MgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRVcmkoKSA6IFwiYmFkX3VyaVwiOyAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBiYWQgZGFlbW9uIHVyaSBuZWNlc3NhcnkgZm9yIG9mZmxpbmU/XG4gICAgcGFyYW1zLnVzZXJuYW1lID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA6IFwiXCI7XG4gICAgcGFyYW1zLnBhc3N3b3JkID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA6IFwiXCI7XG4gICAgcGFyYW1zLnRydXN0ZWQgPSBpc1RydXN0ZWQ7XG4gICAgcGFyYW1zLnNzbF9zdXBwb3J0ID0gXCJhdXRvZGV0ZWN0XCI7XG4gICAgcGFyYW1zLnNzbF9wcml2YXRlX2tleV9wYXRoID0gc3NsT3B0aW9ucy5nZXRQcml2YXRlS2V5UGF0aCgpO1xuICAgIHBhcmFtcy5zc2xfY2VydGlmaWNhdGVfcGF0aCAgPSBzc2xPcHRpb25zLmdldENlcnRpZmljYXRlUGF0aCgpO1xuICAgIHBhcmFtcy5zc2xfY2FfZmlsZSA9IHNzbE9wdGlvbnMuZ2V0Q2VydGlmaWNhdGVBdXRob3JpdHlGaWxlKCk7XG4gICAgcGFyYW1zLnNzbF9hbGxvd2VkX2ZpbmdlcnByaW50cyA9IHNzbE9wdGlvbnMuZ2V0QWxsb3dlZEZpbmdlcnByaW50cygpO1xuICAgIHBhcmFtcy5zc2xfYWxsb3dfYW55X2NlcnQgPSBzc2xPcHRpb25zLmdldEFsbG93QW55Q2VydCgpO1xuXG4gICAgLy8gc2V0IHByb3h5IHdoaWNoIG11c3QgbWF0Y2ggc3RhcnR1cCBwcm94eSBpZiBhcHBsaWNhYmxlXG4gICAgaWYgKGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5nZXRQcm94eVVyaSgpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0aGlzLnN0YXJ0dXBQcm94eVVyaSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2V0IGRhZW1vbiBjb25uZWN0aW9uIHdpdGhvdXQgcHJveHkgVVJJIGJlY2F1c2UgbW9uZXJvLXdhbGxldC1ycGMgd2FzIHN0YXJ0ZWQgd2l0aCBhIHByb3h5IFVSSTogXCIgKyB0aGlzLnN0YXJ0dXBQcm94eVVyaSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLnN0YXJ0dXBQcm94eVVyaSA9PT0gdW5kZWZpbmVkKSBwYXJhbXMucHJveHkgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRQcm94eVVyaSgpIDogXCJcIjtcbiAgICAgIGVsc2UgaWYgKHRoaXMuc3RhcnR1cFByb3h5VXJpICE9PSBjb25uZWN0aW9uLmdldFByb3h5VXJpKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNldCBkYWVtb24gY29ubmVjdGlvbiB3aXRoIHByb3h5IFVSSSBcIiArIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSArIFwiIGJlY2F1c2UgbW9uZXJvLXdhbGxldC1ycGMgd2FzIHN0YXJ0ZWQgd2l0aCBhIGRpZmZlcmVudCBwcm94eSBVUkk6IFwiICsgdGhpcy5zdGFydHVwUHJveHlVcmkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXBhcmFtcy5wcm94eSkgcGFyYW1zLnByb3h5ID0gXCJcIjtcblxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9kYWVtb25cIiwgcGFyYW1zKTtcbiAgICB0aGlzLmRhZW1vbkNvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLmRhZW1vbkNvbm5lY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSB0b3RhbCBhbmQgdW5sb2NrZWQgYmFsYW5jZXMgaW4gYSBzaW5nbGUgcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbYWNjb3VudElkeF0gYWNjb3VudCBpbmRleFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N1YmFkZHJlc3NJZHhdIHN1YmFkZHJlc3MgaW5kZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxiaWdpbnRbXT59IGlzIHRoZSB0b3RhbCBhbmQgdW5sb2NrZWQgYmFsYW5jZXMgaW4gYW4gYXJyYXksIHJlc3BlY3RpdmVseVxuICAgKi9cbiAgYXN5bmMgZ2V0QmFsYW5jZXMoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50W10+IHtcbiAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzc0lkeCwgdW5kZWZpbmVkLCBcIk11c3QgcHJvdmlkZSBhY2NvdW50IGluZGV4IHdpdGggc3ViYWRkcmVzcyBpbmRleFwiKTtcbiAgICAgIGxldCBiYWxhbmNlID0gQmlnSW50KDApO1xuICAgICAgbGV0IHVubG9ja2VkQmFsYW5jZSA9IEJpZ0ludCgwKTtcbiAgICAgIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgdGhpcy5nZXRBY2NvdW50cygpKSB7XG4gICAgICAgIGJhbGFuY2UgPSBiYWxhbmNlICsgYWNjb3VudC5nZXRCYWxhbmNlKCk7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZSA9IHVubG9ja2VkQmFsYW5jZSArIGFjY291bnQuZ2V0VW5sb2NrZWRCYWxhbmNlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gW2JhbGFuY2UsIHVubG9ja2VkQmFsYW5jZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBwYXJhbXMgPSB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeCwgYWRkcmVzc19pbmRpY2VzOiBzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBbc3ViYWRkcmVzc0lkeF19O1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCBwYXJhbXMpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtCaWdJbnQocmVzcC5yZXN1bHQuYmFsYW5jZSksIEJpZ0ludChyZXNwLnJlc3VsdC51bmxvY2tlZF9iYWxhbmNlKV07XG4gICAgICBlbHNlIHJldHVybiBbQmlnSW50KHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzWzBdLmJhbGFuY2UpLCBCaWdJbnQocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3NbMF0udW5sb2NrZWRfYmFsYW5jZSldO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ09NTU9OIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9XYWxsZXRMaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN1cGVyLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZXNlcnZlUHJvb2YoYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpLCBcIlwiLCBcIlwiKTsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBwcm92aWRlIGJldHRlciB3YXkgdG8ga25vdyBpZiB3YWxsZXQgcnBjIGlzIGNvbm5lY3RlZCB0byBkYWVtb25cbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcImNoZWNrIHJlc2VydmUgZXhwZWN0ZWQgdG8gZmFpbFwiKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC0xMykgdGhyb3cgZTsgLy8gbm8gd2FsbGV0IGZpbGVcbiAgICAgIHJldHVybiBlLm1lc3NhZ2UuaW5kZXhPZihcIkZhaWxlZCB0byBjb25uZWN0IHRvIGRhZW1vblwiKSA8IDA7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3ZlcnNpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9WZXJzaW9uKHJlc3AucmVzdWx0LnZlcnNpb24sIHJlc3AucmVzdWx0LnJlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMucGF0aDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwibW5lbW9uaWNcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2UoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoYXdhaXQgdGhpcy5nZXRTZWVkKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMuZ2V0U2VlZExhbmd1YWdlKCkgbm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBsaXN0IG9mIGF2YWlsYWJsZSBsYW5ndWFnZXMgZm9yIHRoZSB3YWxsZXQncyBzZWVkLlxuICAgKiBcbiAgICogQHJldHVybiB7c3RyaW5nW119IHRoZSBhdmFpbGFibGUgbGFuZ3VhZ2VzIGZvciB0aGUgd2FsbGV0J3Mgc2VlZC5cbiAgICovXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZXMoKSB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfbGFuZ3VhZ2VzXCIpKS5yZXN1bHQubGFuZ3VhZ2VzO1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwidmlld19rZXlcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcInNwZW5kX2tleVwiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBzdWJhZGRyZXNzTWFwID0gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF07XG4gICAgaWYgKCFzdWJhZGRyZXNzTWFwKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHRydWUpOyAgLy8gY2FjaGUncyBhbGwgYWRkcmVzc2VzIGF0IHRoaXMgYWNjb3VudFxuICAgICAgcmV0dXJuIHRoaXMuZ2V0QWRkcmVzcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTsgICAgICAgIC8vIHJlY3Vyc2l2ZSBjYWxsIHVzZXMgY2FjaGVcbiAgICB9XG4gICAgbGV0IGFkZHJlc3MgPSBzdWJhZGRyZXNzTWFwW3N1YmFkZHJlc3NJZHhdO1xuICAgIGlmICghYWRkcmVzcykge1xuICAgICAgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCB0cnVlKTsgIC8vIGNhY2hlJ3MgYWxsIGFkZHJlc3NlcyBhdCB0aGlzIGFjY291bnRcbiAgICAgIHJldHVybiB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XVtzdWJhZGRyZXNzSWR4XTtcbiAgICB9XG4gICAgcmV0dXJuIGFkZHJlc3M7XG4gIH1cbiAgXG4gIC8vIFRPRE86IHVzZSBjYWNoZVxuICBhc3luYyBnZXRBZGRyZXNzSW5kZXgoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggcmVzdWx0IGFuZCBub3JtYWxpemUgZXJyb3IgaWYgYWRkcmVzcyBkb2VzIG5vdCBiZWxvbmcgdG8gdGhlIHdhbGxldFxuICAgIGxldCByZXNwO1xuICAgIHRyeSB7XG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NfaW5kZXhcIiwge2FkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTIpIHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29udmVydCBycGMgcmVzcG9uc2VcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKHthZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWFqb3IpO1xuICAgIHN1YmFkZHJlc3Muc2V0SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWlub3IpO1xuICAgIHJldHVybiBzdWJhZGRyZXNzO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3M/OiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IGludGVncmF0ZWRBZGRyZXNzU3RyID0gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfaW50ZWdyYXRlZF9hZGRyZXNzXCIsIHtzdGFuZGFyZF9hZGRyZXNzOiBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRfaWQ6IHBheW1lbnRJZH0pKS5yZXN1bHQuaW50ZWdyYXRlZF9hZGRyZXNzO1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3NTdHIpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUubWVzc2FnZS5pbmNsdWRlcyhcIkludmFsaWQgcGF5bWVudCBJRFwiKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBwYXltZW50IElEOiBcIiArIHBheW1lbnRJZCk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNwbGl0X2ludGVncmF0ZWRfYWRkcmVzc1wiLCB7aW50ZWdyYXRlZF9hZGRyZXNzOiBpbnRlZ3JhdGVkQWRkcmVzc30pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoKS5zZXRTdGFuZGFyZEFkZHJlc3MocmVzcC5yZXN1bHQuc3RhbmRhcmRfYWRkcmVzcykuc2V0UGF5bWVudElkKHJlc3AucmVzdWx0LnBheW1lbnRfaWQpLnNldEludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfaGVpZ2h0XCIpKS5yZXN1bHQuaGVpZ2h0O1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGdldHRpbmcgdGhlIGNoYWluIGhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF5OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGluZyBhIGhlaWdodCBieSBkYXRlXCIpO1xuICB9XG4gIFxuICBhc3luYyBzeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodD86IE1vbmVyb1dhbGxldExpc3RlbmVyIHwgbnVtYmVyLCBzdGFydEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvU3luY1Jlc3VsdD4ge1xuICAgIGFzc2VydCghKGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyKSwgXCJNb25lcm8gV2FsbGV0IFJQQyBkb2VzIG5vdCBzdXBwb3J0IHJlcG9ydGluZyBzeW5jIHByb2dyZXNzXCIpO1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlZnJlc2hcIiwge3N0YXJ0X2hlaWdodDogc3RhcnRIZWlnaHR9KTtcbiAgICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3AucmVzdWx0LmJsb2Nrc19mZXRjaGVkLCByZXNwLnJlc3VsdC5yZWNlaXZlZF9tb25leSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZSA9PT0gXCJubyBjb25uZWN0aW9uIHRvIGRhZW1vblwiKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXM/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBcbiAgICAvLyBjb252ZXJ0IG1zIHRvIHNlY29uZHMgZm9yIHJwYyBwYXJhbWV0ZXJcbiAgICBsZXQgc3luY1BlcmlvZEluU2Vjb25kcyA9IE1hdGgucm91bmQoKHN5bmNQZXJpb2RJbk1zID09PSB1bmRlZmluZWQgPyBNb25lcm9XYWxsZXRScGMuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA6IHN5bmNQZXJpb2RJbk1zKSAvIDEwMDApO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhdXRvX3JlZnJlc2hcIiwge1xuICAgICAgZW5hYmxlOiB0cnVlLFxuICAgICAgcGVyaW9kOiBzeW5jUGVyaW9kSW5TZWNvbmRzXG4gICAgfSk7XG4gICAgXG4gICAgLy8gdXBkYXRlIHN5bmMgcGVyaW9kIGZvciBwb2xsZXJcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gc3luY1BlcmlvZEluU2Vjb25kcyAqIDEwMDA7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyICE9PSB1bmRlZmluZWQpIHRoaXMud2FsbGV0UG9sbGVyLnNldFBlcmlvZEluTXModGhpcy5zeW5jUGVyaW9kSW5Ncyk7XG4gICAgXG4gICAgLy8gcG9sbCBpZiBsaXN0ZW5pbmdcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgfVxuXG4gIGdldFN5bmNQZXJpb2RJbk1zKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuc3luY1BlcmlvZEluTXM7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhdXRvX3JlZnJlc2hcIiwgeyBlbmFibGU6IGZhbHNlIH0pO1xuICB9XG4gIFxuICBhc3luYyBzY2FuVHhzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdHhIYXNoZXMgfHwgIXR4SGFzaGVzLmxlbmd0aCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gdHggaGFzaGVzIGdpdmVuIHRvIHNjYW5cIik7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2Nhbl90eFwiLCB7dHhpZHM6IHR4SGFzaGVzfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhblNwZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc2Nhbl9zcGVudFwiLCB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc2Nhbl9ibG9ja2NoYWluXCIsIHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbGFuY2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYWxhbmNlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCB0YWc/OiBzdHJpbmcsIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnRbXT4ge1xuICAgIFxuICAgIC8vIGZldGNoIGFjY291bnRzIGZyb20gcnBjXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWNjb3VudHNcIiwge3RhZzogdGFnfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgYWNjb3VudCBvYmplY3RzIGFuZCBmZXRjaCBzdWJhZGRyZXNzZXMgcGVyIGFjY291bnQgdXNpbmcgZ2V0X2FkZHJlc3NcbiAgICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBnZXRfYWRkcmVzcyBzaG91bGQgc3VwcG9ydCBhbGxfYWNjb3VudHMgc28gbm90IGNhbGxlZCBvbmNlIHBlciBhY2NvdW50XG4gICAgbGV0IGFjY291bnRzOiBNb25lcm9BY2NvdW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBycGNBY2NvdW50IG9mIHJlc3AucmVzdWx0LnN1YmFkZHJlc3NfYWNjb3VudHMpIHtcbiAgICAgIGxldCBhY2NvdW50ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNBY2NvdW50KHJwY0FjY291bnQpO1xuICAgICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMpIGFjY291bnQuc2V0U3ViYWRkcmVzc2VzKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnQuZ2V0SW5kZXgoKSwgdW5kZWZpbmVkLCB0cnVlKSk7XG4gICAgICBhY2NvdW50cy5wdXNoKGFjY291bnQpO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgbWVyZ2UgZmllbGRzIGZyb20gZ2V0X2JhbGFuY2UgYWNyb3NzIGFsbCBhY2NvdW50c1xuICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzICYmICFza2lwQmFsYW5jZXMpIHtcbiAgICAgIFxuICAgICAgLy8gdGhlc2UgZmllbGRzIGFyZSBub3QgaW5pdGlhbGl6ZWQgaWYgc3ViYWRkcmVzcyBpcyB1bnVzZWQgYW5kIHRoZXJlZm9yZSBub3QgcmV0dXJuZWQgZnJvbSBgZ2V0X2JhbGFuY2VgXG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkge1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cygwKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGZldGNoIGFuZCBtZXJnZSBpbmZvIGZyb20gZ2V0X2JhbGFuY2VcbiAgICAgIHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCB7YWxsX2FjY291bnRzOiB0cnVlfSk7XG4gICAgICBpZiAocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIG1lcmdlIGluZm9cbiAgICAgICAgICBsZXQgYWNjb3VudCA9IGFjY291bnRzW3N1YmFkZHJlc3MuZ2V0QWNjb3VudEluZGV4KCldO1xuICAgICAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzLmdldEFjY291bnRJbmRleCgpLCBhY2NvdW50LmdldEluZGV4KCksIFwiUlBDIGFjY291bnRzIGFyZSBvdXQgb2Ygb3JkZXJcIik7ICAvLyB3b3VsZCBuZWVkIHRvIHN3aXRjaCBsb29rdXAgdG8gbG9vcFxuICAgICAgICAgIGxldCB0Z3RTdWJhZGRyZXNzID0gYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKVtzdWJhZGRyZXNzLmdldEluZGV4KCldO1xuICAgICAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzLmdldEluZGV4KCksIHRndFN1YmFkZHJlc3MuZ2V0SW5kZXgoKSwgXCJSUEMgc3ViYWRkcmVzc2VzIGFyZSBvdXQgb2Ygb3JkZXJcIik7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0QmFsYW5jZShzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSk7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSk7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGFjY291bnRzO1xuICB9XG4gIFxuICAvLyBUT0RPOiBnZXRBY2NvdW50QnlJbmRleCgpLCBnZXRBY2NvdW50QnlUYWcoKVxuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBhc3NlcnQoYWNjb3VudElkeCA+PSAwKTtcbiAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgaWYgKGFjY291bnQuZ2V0SW5kZXgoKSA9PT0gYWNjb3VudElkeCkge1xuICAgICAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcykgYWNjb3VudC5zZXRTdWJhZGRyZXNzZXMoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCBza2lwQmFsYW5jZXMpKTtcbiAgICAgICAgcmV0dXJuIGFjY291bnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIkFjY291bnQgd2l0aCBpbmRleCBcIiArIGFjY291bnRJZHggKyBcIiBkb2VzIG5vdCBleGlzdFwiKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBsYWJlbCA9IGxhYmVsID8gbGFiZWwgOiB1bmRlZmluZWQ7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfYWNjb3VudFwiLCB7bGFiZWw6IGxhYmVsfSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9BY2NvdW50KHtcbiAgICAgIGluZGV4OiByZXNwLnJlc3VsdC5hY2NvdW50X2luZGV4LFxuICAgICAgcHJpbWFyeUFkZHJlc3M6IHJlc3AucmVzdWx0LmFkZHJlc3MsXG4gICAgICBsYWJlbDogbGFiZWwsXG4gICAgICBiYWxhbmNlOiBCaWdJbnQoMCksXG4gICAgICB1bmxvY2tlZEJhbGFuY2U6IEJpZ0ludCgwKVxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0luZGljZXM/OiBudW1iZXJbXSwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggc3ViYWRkcmVzc2VzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBhY2NvdW50SWR4O1xuICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcykgcGFyYW1zLmFkZHJlc3NfaW5kZXggPSBHZW5VdGlscy5saXN0aWZ5KHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzXCIsIHBhcmFtcyk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBzdWJhZGRyZXNzZXNcbiAgICBsZXQgc3ViYWRkcmVzc2VzID0gW107XG4gICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5hZGRyZXNzZXMpIHtcbiAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgICBzdWJhZGRyZXNzZXMucHVzaChzdWJhZGRyZXNzKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIGluaXRpYWxpemUgc3ViYWRkcmVzcyBiYWxhbmNlc1xuICAgIGlmICghc2tpcEJhbGFuY2VzKSB7XG4gICAgICBcbiAgICAgIC8vIHRoZXNlIGZpZWxkcyBhcmUgbm90IGluaXRpYWxpemVkIGlmIHN1YmFkZHJlc3MgaXMgdW51c2VkIGFuZCB0aGVyZWZvcmUgbm90IHJldHVybmVkIGZyb20gYGdldF9iYWxhbmNlYFxuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGZldGNoIGFuZCBpbml0aWFsaXplIGJhbGFuY2VzXG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwgcGFyYW1zKTtcbiAgICAgIGlmIChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICBmb3IgKGxldCBycGNTdWJhZGRyZXNzIG9mIHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3MgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gdHJhbnNmZXIgaW5mbyB0byBleGlzdGluZyBzdWJhZGRyZXNzIG9iamVjdFxuICAgICAgICAgIGZvciAobGV0IHRndFN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICAgICAgICBpZiAodGd0U3ViYWRkcmVzcy5nZXRJbmRleCgpICE9PSBzdWJhZGRyZXNzLmdldEluZGV4KCkpIGNvbnRpbnVlOyAvLyBza2lwIHRvIHN1YmFkZHJlc3Mgd2l0aCBzYW1lIGluZGV4XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXROdW1CbG9ja3NUb1VubG9jaygpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soc3ViYWRkcmVzcy5nZXROdW1CbG9ja3NUb1VubG9jaygpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgYWRkcmVzc2VzXG4gICAgbGV0IHN1YmFkZHJlc3NNYXAgPSB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XTtcbiAgICBpZiAoIXN1YmFkZHJlc3NNYXApIHtcbiAgICAgIHN1YmFkZHJlc3NNYXAgPSB7fTtcbiAgICAgIHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdID0gc3ViYWRkcmVzc01hcDtcbiAgICB9XG4gICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgIHN1YmFkZHJlc3NNYXBbc3ViYWRkcmVzcy5nZXRJbmRleCgpXSA9IHN1YmFkZHJlc3MuZ2V0QWRkcmVzcygpO1xuICAgIH1cbiAgICBcbiAgICAvLyByZXR1cm4gcmVzdWx0c1xuICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gIH1cblxuICBhc3luYyBnZXRTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgYXNzZXJ0KGFjY291bnRJZHggPj0gMCk7XG4gICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPj0gMCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBbc3ViYWRkcmVzc0lkeF0sIHNraXBCYWxhbmNlcykpWzBdO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfYWRkcmVzc1wiLCB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeCwgbGFiZWw6IGxhYmVsfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgc3ViYWRkcmVzcyBvYmplY3RcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKCk7XG4gICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgc3ViYWRkcmVzcy5zZXRJbmRleChyZXNwLnJlc3VsdC5hZGRyZXNzX2luZGV4KTtcbiAgICBzdWJhZGRyZXNzLnNldEFkZHJlc3MocmVzcC5yZXN1bHQuYWRkcmVzcyk7XG4gICAgc3ViYWRkcmVzcy5zZXRMYWJlbChsYWJlbCA/IGxhYmVsIDogdW5kZWZpbmVkKTtcbiAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgc3ViYWRkcmVzcy5zZXRJc1VzZWQoZmFsc2UpO1xuICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cblxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJsYWJlbF9hZGRyZXNzXCIsIHtpbmRleDoge21ham9yOiBhY2NvdW50SWR4LCBtaW5vcjogc3ViYWRkcmVzc0lkeH0sIGxhYmVsOiBsYWJlbH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHMocXVlcnk/OiBzdHJpbmdbXSB8IFBhcnRpYWw8TW9uZXJvVHhRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyBjb3B5IHF1ZXJ5XG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHRlbXBvcmFyaWx5IGRpc2FibGUgdHJhbnNmZXIgYW5kIG91dHB1dCBxdWVyaWVzIGluIG9yZGVyIHRvIGNvbGxlY3QgYWxsIHR4IGluZm9ybWF0aW9uXG4gICAgbGV0IHRyYW5zZmVyUXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0VHJhbnNmZXJRdWVyeSgpO1xuICAgIGxldCBpbnB1dFF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldElucHV0UXVlcnkoKTtcbiAgICBsZXQgb3V0cHV0UXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0T3V0cHV0UXVlcnkoKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0VHJhbnNmZXJRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRJbnB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldE91dHB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgXG4gICAgLy8gZmV0Y2ggYWxsIHRyYW5zZmVycyB0aGF0IG1lZXQgdHggcXVlcnlcbiAgICBsZXQgdHJhbnNmZXJzID0gYXdhaXQgdGhpcy5nZXRUcmFuc2ZlcnNBdXgobmV3IE1vbmVyb1RyYW5zZmVyUXVlcnkoKS5zZXRUeFF1ZXJ5KE1vbmVyb1dhbGxldFJwYy5kZWNvbnRleHR1YWxpemUocXVlcnlOb3JtYWxpemVkLmNvcHkoKSkpKTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHVuaXF1ZSB0eHMgZnJvbSB0cmFuc2ZlcnMgd2hpbGUgcmV0YWluaW5nIG9yZGVyXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGxldCB0eHNTZXQgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHJhbnNmZXJzKSB7XG4gICAgICBpZiAoIXR4c1NldC5oYXModHJhbnNmZXIuZ2V0VHgoKSkpIHtcbiAgICAgICAgdHhzLnB1c2godHJhbnNmZXIuZ2V0VHgoKSk7XG4gICAgICAgIHR4c1NldC5hZGQodHJhbnNmZXIuZ2V0VHgoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHR5cGVzIGludG8gbWFwcyBmb3IgbWVyZ2luZyBhbmQgbG9va3VwXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIG1lcmdlIG91dHB1dHMgaWYgcmVxdWVzdGVkXG4gICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5nZXRJbmNsdWRlT3V0cHV0cygpIHx8IG91dHB1dFF1ZXJ5KSB7XG4gICAgICAgIFxuICAgICAgLy8gZmV0Y2ggb3V0cHV0c1xuICAgICAgbGV0IG91dHB1dFF1ZXJ5QXV4ID0gKG91dHB1dFF1ZXJ5ID8gb3V0cHV0UXVlcnkuY29weSgpIDogbmV3IE1vbmVyb091dHB1dFF1ZXJ5KCkpLnNldFR4UXVlcnkoTW9uZXJvV2FsbGV0UnBjLmRlY29udGV4dHVhbGl6ZShxdWVyeU5vcm1hbGl6ZWQuY29weSgpKSk7XG4gICAgICBsZXQgb3V0cHV0cyA9IGF3YWl0IHRoaXMuZ2V0T3V0cHV0c0F1eChvdXRwdXRRdWVyeUF1eCk7XG4gICAgICBcbiAgICAgIC8vIG1lcmdlIG91dHB1dCB0eHMgb25lIHRpbWUgd2hpbGUgcmV0YWluaW5nIG9yZGVyXG4gICAgICBsZXQgb3V0cHV0VHhzID0gW107XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2Ygb3V0cHV0cykge1xuICAgICAgICBpZiAoIW91dHB1dFR4cy5pbmNsdWRlcyhvdXRwdXQuZ2V0VHgoKSkpIHtcbiAgICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeChvdXRwdXQuZ2V0VHgoKSwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgICAgICBvdXRwdXRUeHMucHVzaChvdXRwdXQuZ2V0VHgoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gcmVzdG9yZSB0cmFuc2ZlciBhbmQgb3V0cHV0IHF1ZXJpZXNcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0VHJhbnNmZXJRdWVyeSh0cmFuc2ZlclF1ZXJ5KTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SW5wdXRRdWVyeShpbnB1dFF1ZXJ5KTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0T3V0cHV0UXVlcnkob3V0cHV0UXVlcnkpO1xuICAgIFxuICAgIC8vIGZpbHRlciB0eHMgdGhhdCBkb24ndCBtZWV0IHRyYW5zZmVyIHF1ZXJ5XG4gICAgbGV0IHR4c1F1ZXJpZWQgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQubWVldHNDcml0ZXJpYSh0eCkpIHR4c1F1ZXJpZWQucHVzaCh0eCk7XG4gICAgICBlbHNlIGlmICh0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgIH1cbiAgICB0eHMgPSB0eHNRdWVyaWVkO1xuICAgIFxuICAgIC8vIHNwZWNpYWwgY2FzZTogcmUtZmV0Y2ggdHhzIGlmIGluY29uc2lzdGVuY3kgY2F1c2VkIGJ5IG5lZWRpbmcgdG8gbWFrZSBtdWx0aXBsZSBycGMgY2FsbHNcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpICYmIHR4LmdldEJsb2NrKCkgPT09IHVuZGVmaW5lZCB8fCAhdHguZ2V0SXNDb25maXJtZWQoKSAmJiB0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkluY29uc2lzdGVuY3kgZGV0ZWN0ZWQgYnVpbGRpbmcgdHhzIGZyb20gbXVsdGlwbGUgcnBjIGNhbGxzLCByZS1mZXRjaGluZyB0eHNcIik7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFR4cyhxdWVyeU5vcm1hbGl6ZWQpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBvcmRlciB0eHMgaWYgdHggaGFzaGVzIGdpdmVuIHRoZW4gcmV0dXJuXG4gICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKSAmJiBxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkubGVuZ3RoID4gMCkge1xuICAgICAgbGV0IHR4c0J5SWQgPSBuZXcgTWFwKCkgIC8vIHN0b3JlIHR4cyBpbiB0ZW1wb3JhcnkgbWFwIGZvciBzb3J0aW5nXG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4c0J5SWQuc2V0KHR4LmdldEhhc2goKSwgdHgpO1xuICAgICAgbGV0IG9yZGVyZWRUeHMgPSBbXTtcbiAgICAgIGZvciAobGV0IGhhc2ggb2YgcXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpKSBpZiAodHhzQnlJZC5nZXQoaGFzaCkpIG9yZGVyZWRUeHMucHVzaCh0eHNCeUlkLmdldChoYXNoKSk7XG4gICAgICB0eHMgPSBvcmRlcmVkVHhzO1xuICAgIH1cbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9UcmFuc2ZlcltdPiB7XG4gICAgXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIGdldCB0cmFuc2ZlcnMgZGlyZWN0bHkgaWYgcXVlcnkgZG9lcyBub3QgcmVxdWlyZSB0eCBjb250ZXh0IChvdGhlciB0cmFuc2ZlcnMsIG91dHB1dHMpXG4gICAgaWYgKCFNb25lcm9XYWxsZXRScGMuaXNDb250ZXh0dWFsKHF1ZXJ5Tm9ybWFsaXplZCkpIHJldHVybiB0aGlzLmdldFRyYW5zZmVyc0F1eChxdWVyeU5vcm1hbGl6ZWQpO1xuICAgIFxuICAgIC8vIG90aGVyd2lzZSBnZXQgdHhzIHdpdGggZnVsbCBtb2RlbHMgdG8gZnVsZmlsbCBxdWVyeVxuICAgIGxldCB0cmFuc2ZlcnMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLmdldFR4cyhxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpKSkge1xuICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZmlsdGVyVHJhbnNmZXJzKHF1ZXJ5Tm9ybWFsaXplZCkpIHtcbiAgICAgICAgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHJhbnNmZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9PdXRwdXRRdWVyeT4pOiBQcm9taXNlPE1vbmVyb091dHB1dFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZU91dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBnZXQgb3V0cHV0cyBkaXJlY3RseSBpZiBxdWVyeSBkb2VzIG5vdCByZXF1aXJlIHR4IGNvbnRleHQgKG90aGVyIG91dHB1dHMsIHRyYW5zZmVycylcbiAgICBpZiAoIU1vbmVyb1dhbGxldFJwYy5pc0NvbnRleHR1YWwocXVlcnlOb3JtYWxpemVkKSkgcmV0dXJuIHRoaXMuZ2V0T3V0cHV0c0F1eChxdWVyeU5vcm1hbGl6ZWQpO1xuICAgIFxuICAgIC8vIG90aGVyd2lzZSBnZXQgdHhzIHdpdGggZnVsbCBtb2RlbHMgdG8gZnVsZmlsbCBxdWVyeVxuICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5nZXRUeHMocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKSkpIHtcbiAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5maWx0ZXJPdXRwdXRzKHF1ZXJ5Tm9ybWFsaXplZCkpIHtcbiAgICAgICAgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRPdXRwdXRzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4cG9ydF9vdXRwdXRzXCIsIHthbGw6IGFsbH0pKS5yZXN1bHQub3V0cHV0c19kYXRhX2hleDtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW1wb3J0X291dHB1dHNcIiwge291dHB1dHNfZGF0YV9oZXg6IG91dHB1dHNIZXh9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQubnVtX2ltcG9ydGVkO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRLZXlJbWFnZXMoYWxsID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5ycGNFeHBvcnRLZXlJbWFnZXMoYWxsKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlczogTW9uZXJvS2V5SW1hZ2VbXSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQ+IHtcbiAgICBcbiAgICAvLyBjb252ZXJ0IGtleSBpbWFnZXMgdG8gcnBjIHBhcmFtZXRlclxuICAgIGxldCBycGNLZXlJbWFnZXMgPSBrZXlJbWFnZXMubWFwKGtleUltYWdlID0+ICh7a2V5X2ltYWdlOiBrZXlJbWFnZS5nZXRIZXgoKSwgc2lnbmF0dXJlOiBrZXlJbWFnZS5nZXRTaWduYXR1cmUoKX0pKTtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9rZXlfaW1hZ2VzXCIsIHtzaWduZWRfa2V5X2ltYWdlczogcnBjS2V5SW1hZ2VzfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgYW5kIHJldHVybiByZXN1bHRcbiAgICBsZXQgaW1wb3J0UmVzdWx0ID0gbmV3IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0KCk7XG4gICAgaW1wb3J0UmVzdWx0LnNldEhlaWdodChyZXNwLnJlc3VsdC5oZWlnaHQpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRTcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQuc3BlbnQpKTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0VW5zcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQudW5zcGVudCkpO1xuICAgIHJldHVybiBpbXBvcnRSZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnJwY0V4cG9ydEtleUltYWdlcyhmYWxzZSk7XG4gIH1cbiAgXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImZyZWV6ZVwiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICB9XG4gIFxuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidGhhd1wiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICB9XG4gIFxuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmcm96ZW5cIiwge2tleV9pbWFnZToga2V5SW1hZ2V9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuZnJvemVuID09PSB0cnVlO1xuICB9XG5cbiAgYXN5bmMgZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCk6IFByb21pc2U8TW9uZXJvVHhQcmlvcml0eT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2RlZmF1bHRfZmVlX3ByaW9yaXR5XCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5wcmlvcml0eTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSwgY29weSwgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRDYW5TcGxpdCh0cnVlKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpID09PSB0cnVlICYmIGF3YWl0IHRoaXMuaXNNdWx0aXNpZygpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcmVsYXkgbXVsdGlzaWcgdHJhbnNhY3Rpb24gdW50aWwgY28tc2lnbmVkXCIpO1xuXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3NlcyB0byBzZW5kIGZyb21cbiAgICBsZXQgYWNjb3VudElkeCA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHRoZSBhY2NvdW50IGluZGV4IHRvIHNlbmQgZnJvbVwiKTtcbiAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5zbGljZSgwKTsgLy8gZmV0Y2ggYWxsIG9yIGNvcHkgZ2l2ZW4gaW5kaWNlc1xuICAgIFxuICAgIC8vIGJ1aWxkIGNvbmZpZyBwYXJhbWV0ZXJzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmRlc3RpbmF0aW9ucyA9IFtdO1xuICAgIGZvciAobGV0IGRlc3RpbmF0aW9uIG9mIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0RGVzdGluYXRpb25zKCkpIHtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIFwiRGVzdGluYXRpb24gYWRkcmVzcyBpcyBub3QgZGVmaW5lZFwiKTtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBbW91bnQoKSwgXCJEZXN0aW5hdGlvbiBhbW91bnQgaXMgbm90IGRlZmluZWRcIik7XG4gICAgICBwYXJhbXMuZGVzdGluYXRpb25zLnB1c2goeyBhZGRyZXNzOiBkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIGFtb3VudDogZGVzdGluYXRpb24uZ2V0QW1vdW50KCkudG9TdHJpbmcoKSB9KTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkpIHBhcmFtcy5zdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzID0gY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IHN1YmFkZHJlc3NJbmRpY2VzO1xuICAgIHBhcmFtcy5wYXltZW50X2lkID0gY29uZmlnTm9ybWFsaXplZC5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpICE9PSB0cnVlO1xuICAgIGFzc2VydChjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSBwYXJhbXMuZ2V0X3R4X2tleXMgPSB0cnVlOyAvLyBwYXJhbSB0byBnZXQgdHgga2V5KHMpIGRlcGVuZHMgaWYgc3BsaXRcbiAgICBlbHNlIHBhcmFtcy5nZXRfdHhfa2V5ID0gdHJ1ZTtcblxuICAgIC8vIGNhbm5vdCBhcHBseSBzdWJ0cmFjdEZlZUZyb20gd2l0aCBgdHJhbnNmZXJfc3BsaXRgIGNhbGxcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKS5sZW5ndGggPiAwKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJzdWJ0cmFjdGZlZWZyb20gdHJhbnNmZXJzIGNhbm5vdCBiZSBzcGxpdCBvdmVyIG11bHRpcGxlIHRyYW5zYWN0aW9ucyB5ZXRcIik7XG4gICAgfVxuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IFwidHJhbnNmZXJfc3BsaXRcIiA6IFwidHJhbnNmZXJcIiwgcGFyYW1zKTtcbiAgICAgIHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIldBTExFVF9SUENfRVJST1JfQ09ERV9XUk9OR19BRERSRVNTXCIpID4gLTEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgZGVzdGluYXRpb24gYWRkcmVzc1wiKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gICAgXG4gICAgLy8gcHJlLWluaXRpYWxpemUgdHhzIGlmZiBwcmVzZW50LiBtdWx0aXNpZyBhbmQgdmlldy1vbmx5IHdhbGxldHMgd2lsbCBoYXZlIHR4IHNldCB3aXRob3V0IHRyYW5zYWN0aW9uc1xuICAgIGxldCB0eHM7XG4gICAgbGV0IG51bVR4cyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IChyZXN1bHQuZmVlX2xpc3QgIT09IHVuZGVmaW5lZCA/IHJlc3VsdC5mZWVfbGlzdC5sZW5ndGggOiAwKSA6IChyZXN1bHQuZmVlICE9PSB1bmRlZmluZWQgPyAxIDogMCk7XG4gICAgaWYgKG51bVR4cyA+IDApIHR4cyA9IFtdO1xuICAgIGxldCBjb3B5RGVzdGluYXRpb25zID0gbnVtVHhzID09PSAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVHhzOyBpKyspIHtcbiAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgICAgTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnTm9ybWFsaXplZCwgdHgsIGNvcHlEZXN0aW5hdGlvbnMpO1xuICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcyAhPT0gdW5kZWZpbmVkICYmIHN1YmFkZHJlc3NJbmRpY2VzLmxlbmd0aCA9PT0gMSkgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldFN1YmFkZHJlc3NJbmRpY2VzKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHNldCBmcm9tIHJwYyByZXNwb25zZSB3aXRoIHByZS1pbml0aWFsaXplZCB0eHNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQsIHR4cywgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gICAgZWxzZSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFRvVHhTZXQocmVzdWx0LCB0eHMgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHR4c1swXSwgdHJ1ZSwgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBidWlsZCByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCk7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBjb25maWcuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpO1xuICAgIHBhcmFtcy5rZXlfaW1hZ2UgPSBjb25maWcuZ2V0S2V5SW1hZ2UoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgIT09IHRydWU7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWcuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWcuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZy5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2tleSA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9oZXggPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfbWV0YWRhdGEgPSB0cnVlO1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfc2luZ2xlXCIsIHBhcmFtcyk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZy5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBidWlsZCBhbmQgcmV0dXJuIHR4XG4gICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnLCB1bmRlZmluZWQsIHRydWUpO1xuICAgIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhUb1R4U2V0KHJlc3VsdCwgdHgsIHRydWUsIGNvbmZpZyk7XG4gICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpWzBdLnNldEFtb3VudCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkpOyAvLyBpbml0aWFsaXplIGRlc3RpbmF0aW9uIGFtb3VudFxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwOyBkZWZhdWx0IHRvIGFsbCB3aXRoIHVubG9ja2VkIGJhbGFuY2UgaWYgbm90IHNwZWNpZmllZFxuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpOyAgLy8gbWFwcyBlYWNoIGFjY291bnQgaW5kZXggdG8gc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGluZGljZXMuc2V0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCksIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgaW5kaWNlcy5zZXQoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkpKSB7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgPiAwbikgc3ViYWRkcmVzc0luZGljZXMucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBhY2NvdW50cyA9IGF3YWl0IHRoaXMuZ2V0QWNjb3VudHModHJ1ZSk7XG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICAgIGlmIChhY2NvdW50LmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgICBpbmRpY2VzLnNldChhY2NvdW50LmdldEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc3dlZXAgZnJvbSBlYWNoIGFjY291bnQgYW5kIGNvbGxlY3QgcmVzdWx0aW5nIHR4IHNldHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYWNjb3VudElkeCBvZiBpbmRpY2VzLmtleXMoKSkge1xuICAgICAgXG4gICAgICAvLyBjb3B5IGFuZCBtb2RpZnkgdGhlIG9yaWdpbmFsIGNvbmZpZ1xuICAgICAgbGV0IGNvcHkgPSBjb25maWdOb3JtYWxpemVkLmNvcHkoKTtcbiAgICAgIGNvcHkuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgY29weS5zZXRTd2VlcEVhY2hTdWJhZGRyZXNzKGZhbHNlKTtcbiAgICAgIFxuICAgICAgLy8gc3dlZXAgYWxsIHN1YmFkZHJlc3NlcyB0b2dldGhlciAgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogY2FuIHRoaXMgcmV2ZWFsIG91dHB1dHMgYmVsb25nIHRvIHRoZSBzYW1lIHdhbGxldD9cbiAgICAgIGlmIChjb3B5LmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSAhPT0gdHJ1ZSkge1xuICAgICAgICBjb3B5LnNldFN1YmFkZHJlc3NJbmRpY2VzKGluZGljZXMuZ2V0KGFjY291bnRJZHgpKTtcbiAgICAgICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5ycGNTd2VlcEFjY291bnQoY29weSkpIHR4cy5wdXNoKHR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gb3RoZXJ3aXNlIHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyBpbmRpdmlkdWFsbHlcbiAgICAgIGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzSWR4IG9mIGluZGljZXMuZ2V0KGFjY291bnRJZHgpKSB7XG4gICAgICAgICAgY29weS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhbc3ViYWRkcmVzc0lkeF0pO1xuICAgICAgICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMucnBjU3dlZXBBY2NvdW50KGNvcHkpKSB0eHMucHVzaCh0eCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcER1c3QocmVsYXk/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHJlbGF5ID09PSB1bmRlZmluZWQpIHJlbGF5ID0gZmFsc2U7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzd2VlcF9kdXN0XCIsIHtkb19ub3RfcmVsYXk6ICFyZWxheX0pO1xuICAgIGlmIChyZWxheSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzdWx0KTtcbiAgICBpZiAodHhTZXQuZ2V0VHhzKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQoIXJlbGF5KTtcbiAgICAgIHR4LnNldEluVHhQb29sKHR4LmdldElzUmVsYXllZCgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0LmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhczogKE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKVtdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eEhhc2hlcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykge1xuICAgICAgbGV0IG1ldGFkYXRhID0gdHhPck1ldGFkYXRhIGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQgPyB0eE9yTWV0YWRhdGEuZ2V0TWV0YWRhdGEoKSA6IHR4T3JNZXRhZGF0YTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVsYXlfdHhcIiwgeyBoZXg6IG1ldGFkYXRhIH0pO1xuICAgICAgdHhIYXNoZXMucHVzaChyZXNwLnJlc3VsdC50eF9oYXNoKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7IC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgcmV0dXJuIHR4SGFzaGVzO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImRlc2NyaWJlX3RyYW5zZmVyXCIsIHtcbiAgICAgIHVuc2lnbmVkX3R4c2V0OiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCksXG4gICAgICBtdWx0aXNpZ190eHNldDogdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpXG4gICAgfSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlcihyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnbl90cmFuc2ZlclwiLCB7XG4gICAgICB1bnNpZ25lZF90eHNldDogdW5zaWduZWRUeEhleCxcbiAgICAgIGV4cG9ydF9yYXc6IGZhbHNlXG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeHMoc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN1Ym1pdF90cmFuc2ZlclwiLCB7XG4gICAgICB0eF9kYXRhX2hleDogc2lnbmVkVHhIZXhcbiAgICB9KTtcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQudHhfaGFzaF9saXN0O1xuICB9XG4gIFxuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIHNpZ25hdHVyZVR5cGUgPSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCBhY2NvdW50SWR4ID0gMCwgc3ViYWRkcmVzc0lkeCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnblwiLCB7XG4gICAgICAgIGRhdGE6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZV90eXBlOiBzaWduYXR1cmVUeXBlID09PSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZID8gXCJzcGVuZFwiIDogXCJ2aWV3XCIsXG4gICAgICAgIGFjY291bnRfaW5kZXg6IGFjY291bnRJZHgsXG4gICAgICAgIGFkZHJlc3NfaW5kZXg6IHN1YmFkZHJlc3NJZHhcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICB9XG4gIFxuICBhc3luYyB2ZXJpZnlNZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdD4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInZlcmlmeVwiLCB7ZGF0YTogbWVzc2FnZSwgYWRkcmVzczogYWRkcmVzcywgc2lnbmF0dXJlOiBzaWduYXR1cmV9KTtcbiAgICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdChcbiAgICAgICAgcmVzdWx0Lmdvb2QgPyB7aXNHb29kOiByZXN1bHQuZ29vZCwgaXNPbGQ6IHJlc3VsdC5vbGQsIHNpZ25hdHVyZVR5cGU6IHJlc3VsdC5zaWduYXR1cmVfdHlwZSA9PT0gXCJ2aWV3XCIgPyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfVklFV19LRVkgOiBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCB2ZXJzaW9uOiByZXN1bHQudmVyc2lvbn0gOiB7aXNHb29kOiBmYWxzZX1cbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0yKSByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQoe2lzR29vZDogZmFsc2V9KTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeEtleSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3R4X2tleVwiLCB7dHhpZDogdHhIYXNofSkpLnJlc3VsdC50eF9rZXk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhLZXkodHhIYXNoOiBzdHJpbmcsIHR4S2V5OiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja190eF9rZXlcIiwge3R4aWQ6IHR4SGFzaCwgdHhfa2V5OiB0eEtleSwgYWRkcmVzczogYWRkcmVzc30pO1xuICAgICAgXG4gICAgICAvLyBpbnRlcnByZXQgcmVzdWx0XG4gICAgICBsZXQgY2hlY2sgPSBuZXcgTW9uZXJvQ2hlY2tUeCgpO1xuICAgICAgY2hlY2suc2V0SXNHb29kKHRydWUpO1xuICAgICAgY2hlY2suc2V0TnVtQ29uZmlybWF0aW9ucyhyZXNwLnJlc3VsdC5jb25maXJtYXRpb25zKTtcbiAgICAgIGNoZWNrLnNldEluVHhQb29sKHJlc3AucmVzdWx0LmluX3Bvb2wpO1xuICAgICAgY2hlY2suc2V0UmVjZWl2ZWRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnJlY2VpdmVkKSk7XG4gICAgICByZXR1cm4gY2hlY2s7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3R4X3Byb29mXCIsIHt0eGlkOiB0eEhhc2gsIGFkZHJlc3M6IGFkZHJlc3MsIG1lc3NhZ2U6IG1lc3NhZ2V9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgdHJ5IHtcbiAgICAgIFxuICAgICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3R4X3Byb29mXCIsIHtcbiAgICAgICAgdHhpZDogdHhIYXNoLFxuICAgICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzaWduYXR1cmU6IHNpZ25hdHVyZVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIGludGVycHJldCByZXNwb25zZVxuICAgICAgbGV0IGlzR29vZCA9IHJlc3AucmVzdWx0Lmdvb2Q7XG4gICAgICBsZXQgY2hlY2sgPSBuZXcgTW9uZXJvQ2hlY2tUeCgpO1xuICAgICAgY2hlY2suc2V0SXNHb29kKGlzR29vZCk7XG4gICAgICBpZiAoaXNHb29kKSB7XG4gICAgICAgIGNoZWNrLnNldE51bUNvbmZpcm1hdGlvbnMocmVzcC5yZXN1bHQuY29uZmlybWF0aW9ucyk7XG4gICAgICAgIGNoZWNrLnNldEluVHhQb29sKHJlc3AucmVzdWx0LmluX3Bvb2wpO1xuICAgICAgICBjaGVjay5zZXRSZWNlaXZlZEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQucmVjZWl2ZWQpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjaGVjaztcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC0xICYmIGUubWVzc2FnZSA9PT0gXCJiYXNpY19zdHJpbmdcIikgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIk11c3QgcHJvdmlkZSBzaWduYXR1cmUgdG8gY2hlY2sgdHggcHJvb2ZcIiwgLTEpO1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9zcGVuZF9wcm9vZlwiLCB7dHhpZDogdHhIYXNoLCBtZXNzYWdlOiBtZXNzYWdlfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja19zcGVuZF9wcm9vZlwiLCB7XG4gICAgICAgIHR4aWQ6IHR4SGFzaCxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0Lmdvb2Q7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFsbDogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgYW1vdW50OiBiaWdpbnQsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3Jlc2VydmVfcHJvb2ZcIiwge1xuICAgICAgYWNjb3VudF9pbmRleDogYWNjb3VudElkeCxcbiAgICAgIGFtb3VudDogYW1vdW50LnRvU3RyaW5nKCksXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuXG4gIGFzeW5jIGNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tSZXNlcnZlPiB7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja19yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFkZHJlc3M6IGFkZHJlc3MsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICB9KTtcbiAgICBcbiAgICAvLyBpbnRlcnByZXQgcmVzdWx0c1xuICAgIGxldCBpc0dvb2QgPSByZXNwLnJlc3VsdC5nb29kO1xuICAgIGxldCBjaGVjayA9IG5ldyBNb25lcm9DaGVja1Jlc2VydmUoKTtcbiAgICBjaGVjay5zZXRJc0dvb2QoaXNHb29kKTtcbiAgICBpZiAoaXNHb29kKSB7XG4gICAgICBjaGVjay5zZXRVbmNvbmZpcm1lZFNwZW50QW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5zcGVudCkpO1xuICAgICAgY2hlY2suc2V0VG90YWxBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnRvdGFsKSk7XG4gICAgfVxuICAgIHJldHVybiBjaGVjaztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHhfbm90ZXNcIiwge3R4aWRzOiB0eEhhc2hlc30pKS5yZXN1bHQubm90ZXM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdLCBub3Rlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfdHhfbm90ZXNcIiwge3R4aWRzOiB0eEhhc2hlcywgbm90ZXM6IG5vdGVzfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVtdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc19ib29rXCIsIHtlbnRyaWVzOiBlbnRyeUluZGljZXN9KTtcbiAgICBpZiAoIXJlc3AucmVzdWx0LmVudHJpZXMpIHJldHVybiBbXTtcbiAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0LmVudHJpZXMpIHtcbiAgICAgIGVudHJpZXMucHVzaChuZXcgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSgpLnNldEluZGV4KHJwY0VudHJ5LmluZGV4KS5zZXRBZGRyZXNzKHJwY0VudHJ5LmFkZHJlc3MpLnNldERlc2NyaXB0aW9uKHJwY0VudHJ5LmRlc2NyaXB0aW9uKS5zZXRQYXltZW50SWQocnBjRW50cnkucGF5bWVudF9pZCkpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzOiBzdHJpbmcsIGRlc2NyaXB0aW9uPzogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImFkZF9hZGRyZXNzX2Jvb2tcIiwge2FkZHJlc3M6IGFkZHJlc3MsIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbn0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5pbmRleDtcbiAgfVxuICBcbiAgYXN5bmMgZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXg6IG51bWJlciwgc2V0QWRkcmVzczogYm9vbGVhbiwgYWRkcmVzczogc3RyaW5nIHwgdW5kZWZpbmVkLCBzZXREZXNjcmlwdGlvbjogYm9vbGVhbiwgZGVzY3JpcHRpb246IHN0cmluZyB8IHVuZGVmaW5lZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZWRpdF9hZGRyZXNzX2Jvb2tcIiwge1xuICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgc2V0X2FkZHJlc3M6IHNldEFkZHJlc3MsXG4gICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgc2V0X2Rlc2NyaXB0aW9uOiBzZXREZXNjcmlwdGlvbixcbiAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJkZWxldGVfYWRkcmVzc19ib29rXCIsIHtpbmRleDogZW50cnlJZHh9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGFnQWNjb3VudHModGFnLCBhY2NvdW50SW5kaWNlcykge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInRhZ19hY2NvdW50c1wiLCB7dGFnOiB0YWcsIGFjY291bnRzOiBhY2NvdW50SW5kaWNlc30pO1xuICB9XG5cbiAgYXN5bmMgdW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ1bnRhZ19hY2NvdW50c1wiLCB7YWNjb3VudHM6IGFjY291bnRJbmRpY2VzfSk7XG4gIH1cblxuICBhc3luYyBnZXRBY2NvdW50VGFncygpOiBQcm9taXNlPE1vbmVyb0FjY291bnRUYWdbXT4ge1xuICAgIGxldCB0YWdzID0gW107XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWNjb3VudF90YWdzXCIpO1xuICAgIGlmIChyZXNwLnJlc3VsdC5hY2NvdW50X3RhZ3MpIHtcbiAgICAgIGZvciAobGV0IHJwY0FjY291bnRUYWcgb2YgcmVzcC5yZXN1bHQuYWNjb3VudF90YWdzKSB7XG4gICAgICAgIHRhZ3MucHVzaChuZXcgTW9uZXJvQWNjb3VudFRhZyh7XG4gICAgICAgICAgdGFnOiBycGNBY2NvdW50VGFnLnRhZyA/IHJwY0FjY291bnRUYWcudGFnIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGxhYmVsOiBycGNBY2NvdW50VGFnLmxhYmVsID8gcnBjQWNjb3VudFRhZy5sYWJlbCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBhY2NvdW50SW5kaWNlczogcnBjQWNjb3VudFRhZy5hY2NvdW50c1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YWdzO1xuICB9XG5cbiAgYXN5bmMgc2V0QWNjb3VudFRhZ0xhYmVsKHRhZzogc3RyaW5nLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2FjY291bnRfdGFnX2Rlc2NyaXB0aW9uXCIsIHt0YWc6IHRhZywgZGVzY3JpcHRpb246IGxhYmVsfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBheW1lbnRVcmkoY29uZmlnOiBNb25lcm9UeENvbmZpZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibWFrZV91cmlcIiwge1xuICAgICAgYWRkcmVzczogY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSxcbiAgICAgIGFtb3VudDogY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFtb3VudCgpID8gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFtb3VudCgpLnRvU3RyaW5nKCkgOiB1bmRlZmluZWQsXG4gICAgICBwYXltZW50X2lkOiBjb25maWcuZ2V0UGF5bWVudElkKCksXG4gICAgICByZWNpcGllbnRfbmFtZTogY29uZmlnLmdldFJlY2lwaWVudE5hbWUoKSxcbiAgICAgIHR4X2Rlc2NyaXB0aW9uOiBjb25maWcuZ2V0Tm90ZSgpXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnVyaTtcbiAgfVxuICBcbiAgYXN5bmMgcGFyc2VQYXltZW50VXJpKHVyaTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeENvbmZpZz4ge1xuICAgIGFzc2VydCh1cmksIFwiTXVzdCBwcm92aWRlIFVSSSB0byBwYXJzZVwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInBhcnNlX3VyaVwiLCB7dXJpOiB1cml9KTtcbiAgICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKHthZGRyZXNzOiByZXNwLnJlc3VsdC51cmkuYWRkcmVzcywgYW1vdW50OiBCaWdJbnQocmVzcC5yZXN1bHQudXJpLmFtb3VudCl9KTtcbiAgICBjb25maWcuc2V0UGF5bWVudElkKHJlc3AucmVzdWx0LnVyaS5wYXltZW50X2lkKTtcbiAgICBjb25maWcuc2V0UmVjaXBpZW50TmFtZShyZXNwLnJlc3VsdC51cmkucmVjaXBpZW50X25hbWUpO1xuICAgIGNvbmZpZy5zZXROb3RlKHJlc3AucmVzdWx0LnVyaS50eF9kZXNjcmlwdGlvbik7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkpIGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5zZXRBZGRyZXNzKHVuZGVmaW5lZCk7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXRQYXltZW50SWQoKSkgY29uZmlnLnNldFBheW1lbnRJZCh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0UmVjaXBpZW50TmFtZSgpKSBjb25maWcuc2V0UmVjaXBpZW50TmFtZSh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0Tm90ZSgpKSBjb25maWcuc2V0Tm90ZSh1bmRlZmluZWQpO1xuICAgIHJldHVybiBjb25maWc7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2F0dHJpYnV0ZVwiLCB7a2V5OiBrZXl9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC52YWx1ZSA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHJlc3AucmVzdWx0LnZhbHVlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTQ1KSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXk6IHN0cmluZywgdmFsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYXR0cmlidXRlXCIsIHtrZXk6IGtleSwgdmFsdWU6IHZhbH0pO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzOiBudW1iZXIsIGJhY2tncm91bmRNaW5pbmc/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0YXJ0X21pbmluZ1wiLCB7XG4gICAgICB0aHJlYWRzX2NvdW50OiBudW1UaHJlYWRzLFxuICAgICAgZG9fYmFja2dyb3VuZF9taW5pbmc6IGJhY2tncm91bmRNaW5pbmcsXG4gICAgICBpZ25vcmVfYmF0dGVyeTogaWdub3JlQmF0dGVyeVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3BfbWluaW5nXCIpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnSW1wb3J0TmVlZGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm11bHRpc2lnX2ltcG9ydF9uZWVkZWQgPT09IHRydWU7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE11bHRpc2lnSW5mbygpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5mbz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaXNfbXVsdGlzaWdcIik7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCBpbmZvID0gbmV3IE1vbmVyb011bHRpc2lnSW5mbygpO1xuICAgIGluZm8uc2V0SXNNdWx0aXNpZyhyZXN1bHQubXVsdGlzaWcpO1xuICAgIGluZm8uc2V0SXNSZWFkeShyZXN1bHQucmVhZHkpO1xuICAgIGluZm8uc2V0VGhyZXNob2xkKHJlc3VsdC50aHJlc2hvbGQpO1xuICAgIGluZm8uc2V0TnVtUGFydGljaXBhbnRzKHJlc3VsdC50b3RhbCk7XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbiAgXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicHJlcGFyZV9tdWx0aXNpZ1wiLCB7ZW5hYmxlX211bHRpc2lnX2V4cGVyaW1lbnRhbDogdHJ1ZX0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIHJldHVybiByZXN1bHQubXVsdGlzaWdfaW5mbztcbiAgfVxuICBcbiAgYXN5bmMgbWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCB0aHJlc2hvbGQ6IG51bWJlciwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJtYWtlX211bHRpc2lnXCIsIHtcbiAgICAgIG11bHRpc2lnX2luZm86IG11bHRpc2lnSGV4ZXMsXG4gICAgICB0aHJlc2hvbGQ6IHRocmVzaG9sZCxcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZFxuICAgIH0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm11bHRpc2lnX2luZm87XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4Y2hhbmdlX211bHRpc2lnX2tleXNcIiwge211bHRpc2lnX2luZm86IG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkOiBwYXNzd29yZH0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgbGV0IG1zUmVzdWx0ID0gbmV3IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCgpO1xuICAgIG1zUmVzdWx0LnNldEFkZHJlc3MocmVzcC5yZXN1bHQuYWRkcmVzcyk7XG4gICAgbXNSZXN1bHQuc2V0TXVsdGlzaWdIZXgocmVzcC5yZXN1bHQubXVsdGlzaWdfaW5mbyk7XG4gICAgaWYgKG1zUmVzdWx0LmdldEFkZHJlc3MoKS5sZW5ndGggPT09IDApIG1zUmVzdWx0LnNldEFkZHJlc3ModW5kZWZpbmVkKTtcbiAgICBpZiAobXNSZXN1bHQuZ2V0TXVsdGlzaWdIZXgoKS5sZW5ndGggPT09IDApIG1zUmVzdWx0LnNldE11bHRpc2lnSGV4KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIG1zUmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRNdWx0aXNpZ0hleCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X211bHRpc2lnX2luZm9cIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmluZm87XG4gIH1cblxuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcmVmcmVzaEFmdGVySW1wb3J0PzogYm9vbGVhbik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHJlZnJlc2hBZnRlckltcG9ydCA9PT0gdW5kZWZpbmVkKSByZWZyZXNoQWZ0ZXJJbXBvcnQgPSB0cnVlO1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShtdWx0aXNpZ0hleGVzKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN0cmluZ1tdIHRvIGltcG9ydE11bHRpc2lnSGV4KClcIilcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9tdWx0aXNpZ19pbmZvXCIsIHtpbmZvOiBtdWx0aXNpZ0hleGVzLCByZWZyZXNoX2FmdGVyX2ltcG9ydDogcmVmcmVzaEFmdGVySW1wb3J0fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm5fb3V0cHV0cztcbiAgfVxuXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzaWduX211bHRpc2lnXCIsIHt0eF9kYXRhX2hleDogbXVsdGlzaWdUeEhleH0pO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgc2lnblJlc3VsdCA9IG5ldyBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQoKTtcbiAgICBzaWduUmVzdWx0LnNldFNpZ25lZE11bHRpc2lnVHhIZXgocmVzdWx0LnR4X2RhdGFfaGV4KTtcbiAgICBzaWduUmVzdWx0LnNldFR4SGFzaGVzKHJlc3VsdC50eF9oYXNoX2xpc3QpO1xuICAgIHJldHVybiBzaWduUmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfbXVsdGlzaWdcIiwge3R4X2RhdGFfaGV4OiBzaWduZWRNdWx0aXNpZ1R4SGV4fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQ6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkXCIsIHtvbGRfcGFzc3dvcmQ6IG9sZFBhc3N3b3JkIHx8IFwiXCIsIG5ld19wYXNzd29yZDogbmV3UGFzc3dvcmQgfHwgXCJcIn0pO1xuICB9XG4gIFxuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3JlXCIpO1xuICB9XG4gIFxuICBhc3luYyBjbG9zZShzYXZlID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5jbG9zZShzYXZlKTtcbiAgICBpZiAoc2F2ZSA9PT0gdW5kZWZpbmVkKSBzYXZlID0gZmFsc2U7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNsb3NlX3dhbGxldFwiLCB7YXV0b3NhdmVfY3VycmVudDogc2F2ZX0pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nsb3NlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmV0dXJuIGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTEzICYmIGUubWVzc2FnZS5pbmRleE9mKFwiTm8gd2FsbGV0IGZpbGVcIikgPiAtMTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICAvKipcbiAgICogU2F2ZSBhbmQgY2xvc2UgdGhlIGN1cnJlbnQgd2FsbGV0IGFuZCBzdG9wIHRoZSBSUEMgc2VydmVyLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3Bfd2FsbGV0XCIpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuXG4gIGFzeW5jIGdldE51bUJsb2Nrc1RvVW5sb2NrKCk6IFByb21pc2U8bnVtYmVyW118dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXROdW1CbG9ja3NUb1VubG9jaygpOyB9XG4gIGFzeW5jIGdldFR4KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldHx1bmRlZmluZWQ+IHsgcmV0dXJuIHN1cGVyLmdldFR4KHR4SGFzaCk7IH1cbiAgYXN5bmMgZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb0luY29taW5nVHJhbnNmZXJbXT4geyByZXR1cm4gc3VwZXIuZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KSB7IHJldHVybiBzdXBlci5nZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeSk7IH1cbiAgYXN5bmMgY3JlYXRlVHgoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHsgcmV0dXJuIHN1cGVyLmNyZWF0ZVR4KGNvbmZpZyk7IH1cbiAgYXN5bmMgcmVsYXlUeCh0eE9yTWV0YWRhdGE6IE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLnJlbGF5VHgodHhPck1ldGFkYXRhKTsgfVxuICBhc3luYyBnZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIuZ2V0VHhOb3RlKHR4SGFzaCk7IH1cbiAgYXN5bmMgc2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nLCBub3RlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHN1cGVyLnNldFR4Tm90ZSh0eEhhc2gsIG5vdGUpOyB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHN0YXRpYyBhc3luYyBjb25uZWN0VG9XYWxsZXRScGModXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBsZXQgY29uZmlnID0gTW9uZXJvV2FsbGV0UnBjLm5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZywgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICBpZiAoY29uZmlnLmNtZCkgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5zdGFydFdhbGxldFJwY1Byb2Nlc3MoY29uZmlnKTtcbiAgICBlbHNlIHJldHVybiBuZXcgTW9uZXJvV2FsbGV0UnBjKGNvbmZpZyk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgc3RhcnRXYWxsZXRScGNQcm9jZXNzKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNBcnJheShjb25maWcuY21kKSwgXCJNdXN0IHByb3ZpZGUgc3RyaW5nIGFycmF5IHdpdGggY29tbWFuZCBsaW5lIHBhcmFtZXRlcnNcIik7XG4gICAgXG4gICAgLy8gc3RhcnQgcHJvY2Vzc1xuICAgIGxldCBjaGlsZF9wcm9jZXNzID0gYXdhaXQgaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKTtcbiAgICBjb25zdCBjaGlsZFByb2Nlc3MgPSBjaGlsZF9wcm9jZXNzLnNwYXduKGNvbmZpZy5jbWRbMF0sIGNvbmZpZy5jbWQuc2xpY2UoMSksIHtcbiAgICAgIGVudjogeyAuLi5wcm9jZXNzLmVudiwgTEFORzogJ2VuX1VTLlVURi04JyB9IC8vIHNjcmFwZSBvdXRwdXQgaW4gZW5nbGlzaFxuICAgIH0pO1xuICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgYWZ0ZXIgc3RhcnRpbmcgbW9uZXJvLXdhbGxldC1ycGNcbiAgICBsZXQgdXJpO1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICBsZXQgb3V0cHV0ID0gXCJcIjtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRvdXRcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5vbignZGF0YScsIGFzeW5jIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBsZXQgbGluZSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDIsIGxpbmUpO1xuICAgICAgICAgIG91dHB1dCArPSBsaW5lICsgJ1xcbic7IC8vIGNhcHR1cmUgb3V0cHV0IGluIGNhc2Ugb2YgZXJyb3JcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBleHRyYWN0IHVyaSBmcm9tIGUuZy4gXCJJIEJpbmRpbmcgb24gMTI3LjAuMC4xIChJUHY0KTozODA4NVwiXG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWlucyA9IFwiQmluZGluZyBvbiBcIjtcbiAgICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zSWR4ID0gbGluZS5pbmRleE9mKHVyaUxpbmVDb250YWlucyk7XG4gICAgICAgICAgaWYgKHVyaUxpbmVDb250YWluc0lkeCA+PSAwKSB7XG4gICAgICAgICAgICBsZXQgaG9zdCA9IGxpbmUuc3Vic3RyaW5nKHVyaUxpbmVDb250YWluc0lkeCArIHVyaUxpbmVDb250YWlucy5sZW5ndGgsIGxpbmUubGFzdEluZGV4T2YoJyAnKSk7XG4gICAgICAgICAgICBsZXQgdW5mb3JtYXR0ZWRMaW5lID0gbGluZS5yZXBsYWNlKC9cXHUwMDFiXFxbLio/bS9nLCAnJykudHJpbSgpOyAvLyByZW1vdmUgY29sb3IgZm9ybWF0dGluZ1xuICAgICAgICAgICAgbGV0IHBvcnQgPSB1bmZvcm1hdHRlZExpbmUuc3Vic3RyaW5nKHVuZm9ybWF0dGVkTGluZS5sYXN0SW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBsZXQgc3NsSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtc3NsXCIpO1xuICAgICAgICAgICAgbGV0IHNzbEVuYWJsZWQgPSBzc2xJZHggPj0gMCA/IFwiZW5hYmxlZFwiID09IGNvbmZpZy5jbWRbc3NsSWR4ICsgMV0udG9Mb3dlckNhc2UoKSA6IGZhbHNlO1xuICAgICAgICAgICAgdXJpID0gKHNzbEVuYWJsZWQgPyBcImh0dHBzXCIgOiBcImh0dHBcIikgKyBcIjovL1wiICsgaG9zdCArIFwiOlwiICsgcG9ydDtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVhZCBzdWNjZXNzIG1lc3NhZ2VcbiAgICAgICAgICBpZiAobGluZS5pbmRleE9mKFwiU3RhcnRpbmcgd2FsbGV0IFJQQyBzZXJ2ZXJcIikgPj0gMCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBnZXQgdXNlcm5hbWUsIHBhc3N3b3JkLCB6bXEgcHVibGlzaCB1cmksIGFuZCBwcm94eSB1cmkgZnJvbSBwYXJhbXNcbiAgICAgICAgICAgIGxldCB1c2VyUGFzc0lkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLWxvZ2luXCIpO1xuICAgICAgICAgICAgbGV0IHVzZXJQYXNzID0gdXNlclBhc3NJZHggPj0gMCA/IGNvbmZpZy5jbWRbdXNlclBhc3NJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcoMCwgdXNlclBhc3MuaW5kZXhPZignOicpKTtcbiAgICAgICAgICAgIGxldCBwYXNzd29yZCA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcodXNlclBhc3MuaW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBsZXQgem1xVXJpSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS16bXEtcHViXCIpO1xuICAgICAgICAgICAgbGV0IHptcVVyaSA9IHptcVVyaUlkeCA+PSAwID8gY29uZmlnLmNtZFt6bXFVcmlJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCBwcm94eVVyaUlkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcHJveHlcIik7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0dXBQcm94eVVyaSA9IHByb3h5VXJpSWR4ID49IDAgPyBjb25maWcuY21kW3Byb3h5VXJpSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3NcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZy5jb3B5KCkuc2V0U2VydmVyKHt1cmk6IHVyaSwgdXNlcm5hbWU6IHVzZXJuYW1lLCBwYXNzd29yZDogcGFzc3dvcmQsIHptcVVyaTogem1xVXJpLCBwcm94eVVyaTogdGhpcy5zdGFydHVwUHJveHlVcmksIHJlamVjdFVuYXV0aG9yaXplZDogY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkfSk7XG4gICAgICAgICAgICBjb25maWcuY21kID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldFJwYy5jb25uZWN0VG9XYWxsZXRScGMoY29uZmlnKTtcbiAgICAgICAgICAgIHdhbGxldC5wcm9jZXNzID0gY2hpbGRQcm9jZXNzO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyByZXNvbHZlIHByb21pc2Ugd2l0aCBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3MgXG4gICAgICAgICAgICB0aGlzLmlzUmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZSh3YWxsZXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3RkZXJyXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRlcnIub24oJ2RhdGEnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIGNvbnNvbGUuZXJyb3IoZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIGV4aXRcbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwiZXhpdFwiLCBmdW5jdGlvbihjb2RlKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBwcm9jZXNzIHRlcm1pbmF0ZWQgd2l0aCBleGl0IGNvZGUgXCIgKyBjb2RlICsgKG91dHB1dCA/IFwiOlxcblxcblwiICsgb3V0cHV0IDogXCJcIikpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXJyb3JcbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgaWYgKGVyci5tZXNzYWdlLmluZGV4T2YoXCJFTk9FTlRcIikgPj0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGV4aXN0IGF0IHBhdGggJ1wiICsgY29uZmlnLmNtZFswXSArIFwiJ1wiKSk7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSB1bmNhdWdodCBleGNlcHRpb25cbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIiwgZnVuY3Rpb24oZXJyLCBvcmlnaW4pIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5jYXVnaHQgZXhjZXB0aW9uIGluIG1vbmVyby13YWxsZXQtcnBjIHByb2Nlc3M6IFwiICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3Iob3JpZ2luKTtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY2xlYXIoKSB7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gICAgZGVsZXRlIHRoaXMuYWRkcmVzc0NhY2hlO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgdGhpcy5wYXRoID0gdW5kZWZpbmVkO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QWNjb3VudEluZGljZXMoZ2V0U3ViYWRkcmVzc0luZGljZXM/OiBhbnkpIHtcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTtcbiAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgaW5kaWNlcy5zZXQoYWNjb3VudC5nZXRJbmRleCgpLCBnZXRTdWJhZGRyZXNzSW5kaWNlcyA/IGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc0luZGljZXMoYWNjb3VudC5nZXRJbmRleCgpKSA6IHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIHJldHVybiBpbmRpY2VzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0U3ViYWRkcmVzc0luZGljZXMoYWNjb3VudElkeCkge1xuICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NcIiwge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHh9KTtcbiAgICBmb3IgKGxldCBhZGRyZXNzIG9mIHJlc3AucmVzdWx0LmFkZHJlc3Nlcykgc3ViYWRkcmVzc0luZGljZXMucHVzaChhZGRyZXNzLmFkZHJlc3NfaW5kZXgpO1xuICAgIHJldHVybiBzdWJhZGRyZXNzSW5kaWNlcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldFRyYW5zZmVyc0F1eChxdWVyeTogTW9uZXJvVHJhbnNmZXJRdWVyeSkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHBhcmFtcyBmb3IgZ2V0X3RyYW5zZmVycyBycGMgY2FsbFxuICAgIGxldCB0eFF1ZXJ5ID0gcXVlcnkuZ2V0VHhRdWVyeSgpO1xuICAgIGxldCBjYW5CZUNvbmZpcm1lZCA9IHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldElzUmVsYXllZCgpICE9PSBmYWxzZTtcbiAgICBsZXQgY2FuQmVJblR4UG9vbCA9IHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEhlaWdodCgpID09PSB1bmRlZmluZWQgJiYgdHhRdWVyeS5nZXRNYXhIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4UXVlcnkuZ2V0SXNMb2NrZWQoKSAhPT0gZmFsc2U7XG4gICAgbGV0IGNhbkJlSW5jb21pbmcgPSBxdWVyeS5nZXRJc0luY29taW5nKCkgIT09IGZhbHNlICYmIHF1ZXJ5LmdldElzT3V0Z29pbmcoKSAhPT0gdHJ1ZSAmJiBxdWVyeS5nZXRIYXNEZXN0aW5hdGlvbnMoKSAhPT0gdHJ1ZTtcbiAgICBsZXQgY2FuQmVPdXRnb2luZyA9IHF1ZXJ5LmdldElzT3V0Z29pbmcoKSAhPT0gZmFsc2UgJiYgcXVlcnkuZ2V0SXNJbmNvbWluZygpICE9PSB0cnVlO1xuXG4gICAgLy8gY2hlY2sgaWYgZmV0Y2hpbmcgcG9vbCB0eHMgY29udHJhZGljdGVkIGJ5IGNvbmZpZ3VyYXRpb25cbiAgICBpZiAodHhRdWVyeS5nZXRJblR4UG9vbCgpID09PSB0cnVlICYmICFjYW5CZUluVHhQb29sKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgZmV0Y2ggcG9vbCB0cmFuc2FjdGlvbnMgYmVjYXVzZSBpdCBjb250cmFkaWN0cyBjb25maWd1cmF0aW9uXCIpO1xuICAgIH1cblxuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5pbiA9IGNhbkJlSW5jb21pbmcgJiYgY2FuQmVDb25maXJtZWQ7XG4gICAgcGFyYW1zLm91dCA9IGNhbkJlT3V0Z29pbmcgJiYgY2FuQmVDb25maXJtZWQ7XG4gICAgcGFyYW1zLnBvb2wgPSBjYW5CZUluY29taW5nICYmIGNhbkJlSW5UeFBvb2w7XG4gICAgcGFyYW1zLnBlbmRpbmcgPSBjYW5CZU91dGdvaW5nICYmIGNhbkJlSW5UeFBvb2w7XG4gICAgcGFyYW1zLmZhaWxlZCA9IHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJc0NvbmZpcm1lZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPSB0cnVlO1xuICAgIGlmICh0eFF1ZXJ5LmdldE1pbkhlaWdodCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eFF1ZXJ5LmdldE1pbkhlaWdodCgpID4gMCkgcGFyYW1zLm1pbl9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpIC0gMTsgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogd2FsbGV0Mjo6Z2V0X3BheW1lbnRzKCkgbWluX2hlaWdodCBpcyBleGNsdXNpdmUsIHNvIG1hbnVhbGx5IG9mZnNldCB0byBtYXRjaCBpbnRlbmRlZCByYW5nZSAoaXNzdWVzICM1NzUxLCAjNTU5OClcbiAgICAgIGVsc2UgcGFyYW1zLm1pbl9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpO1xuICAgIH1cbiAgICBpZiAodHhRdWVyeS5nZXRNYXhIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSBwYXJhbXMubWF4X2hlaWdodCA9IHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCk7XG4gICAgcGFyYW1zLmZpbHRlcl9ieV9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpICE9PSB1bmRlZmluZWQgfHwgdHhRdWVyeS5nZXRNYXhIZWlnaHQoKSAhPT0gdW5kZWZpbmVkO1xuICAgIGlmIChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkgPT09IHVuZGVmaW5lZCAmJiBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQsIFwiUXVlcnkgc3BlY2lmaWVzIGEgc3ViYWRkcmVzcyBpbmRleCBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIik7XG4gICAgICBwYXJhbXMuYWxsX2FjY291bnRzID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBxdWVyeS5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICAgIFxuICAgICAgLy8gc2V0IHN1YmFkZHJlc3MgaW5kaWNlcyBwYXJhbVxuICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gbmV3IFNldCgpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpICE9PSB1bmRlZmluZWQpIHN1YmFkZHJlc3NJbmRpY2VzLmFkZChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLm1hcChzdWJhZGRyZXNzSWR4ID0+IHN1YmFkZHJlc3NJbmRpY2VzLmFkZChzdWJhZGRyZXNzSWR4KSk7XG4gICAgICBpZiAoc3ViYWRkcmVzc0luZGljZXMuc2l6ZSkgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IEFycmF5LmZyb20oc3ViYWRkcmVzc0luZGljZXMpO1xuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB1bmlxdWUgdHhzIGFuZCBibG9ja3NcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBcbiAgICAvLyBidWlsZCB0eHMgdXNpbmcgYGdldF90cmFuc2ZlcnNgXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHJhbnNmZXJzXCIsIHBhcmFtcyk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJlc3AucmVzdWx0KSkge1xuICAgICAgZm9yIChsZXQgcnBjVHggb2YgcmVzcC5yZXN1bHRba2V5XSkge1xuICAgICAgICAvL2lmIChycGNUeC50eGlkID09PSBxdWVyeS5kZWJ1Z1R4SWQpIGNvbnNvbGUubG9nKHJwY1R4KTtcbiAgICAgICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlcihycGNUeCk7XG4gICAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSBhc3NlcnQodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSA+IC0xKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlcGxhY2UgdHJhbnNmZXIgYW1vdW50IHdpdGggZGVzdGluYXRpb24gc3VtXG4gICAgICAgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IGNvbmZpcm1lZCB0eCBmcm9tL3RvIHNhbWUgYWNjb3VudCBoYXMgYW1vdW50IDAgYnV0IGNhY2hlZCB0cmFuc2ZlcnNcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldElzUmVsYXllZCgpICYmICF0eC5nZXRJc0ZhaWxlZCgpICYmXG4gICAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkgJiYgdHguZ2V0T3V0Z29pbmdBbW91bnQoKSA9PT0gMG4pIHtcbiAgICAgICAgICBsZXQgb3V0Z29pbmdUcmFuc2ZlciA9IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKTtcbiAgICAgICAgICBsZXQgdHJhbnNmZXJUb3RhbCA9IEJpZ0ludCgwKTtcbiAgICAgICAgICBmb3IgKGxldCBkZXN0aW5hdGlvbiBvZiBvdXRnb2luZ1RyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpKSB0cmFuc2ZlclRvdGFsID0gdHJhbnNmZXJUb3RhbCArIGRlc3RpbmF0aW9uLmdldEFtb3VudCgpO1xuICAgICAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBbW91bnQodHJhbnNmZXJUb3RhbCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIG1lcmdlIHR4XG4gICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzb3J0IHR4cyBieSBibG9jayBoZWlnaHRcbiAgICBsZXQgdHhzOiBNb25lcm9UeFdhbGxldFtdID0gT2JqZWN0LnZhbHVlcyh0eE1hcCk7XG4gICAgdHhzLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVUeHNCeUhlaWdodCk7XG4gICAgXG4gICAgLy8gZmlsdGVyIGFuZCByZXR1cm4gdHJhbnNmZXJzXG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgXG4gICAgICAvLyB0eCBpcyBub3QgaW5jb21pbmcvb3V0Z29pbmcgdW5sZXNzIGFscmVhZHkgc2V0XG4gICAgICBpZiAodHguZ2V0SXNJbmNvbWluZygpID09PSB1bmRlZmluZWQpIHR4LnNldElzSW5jb21pbmcoZmFsc2UpO1xuICAgICAgaWYgKHR4LmdldElzT3V0Z29pbmcoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc091dGdvaW5nKGZhbHNlKTtcbiAgICAgIFxuICAgICAgLy8gc29ydCBpbmNvbWluZyB0cmFuc2ZlcnNcbiAgICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZUluY29taW5nVHJhbnNmZXJzKTtcbiAgICAgIFxuICAgICAgLy8gY29sbGVjdCBxdWVyaWVkIHRyYW5zZmVycywgZXJhc2UgaWYgZXhjbHVkZWRcbiAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmZpbHRlclRyYW5zZmVycyhxdWVyeSkpIHtcbiAgICAgICAgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyByZW1vdmUgdHhzIHdpdGhvdXQgcmVxdWVzdGVkIHRyYW5zZmVyXG4gICAgICBpZiAodHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PT0gdW5kZWZpbmVkICYmIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0eC5nZXRCbG9jaygpLmdldFR4cygpLnNwbGljZSh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldE91dHB1dHNBdXgocXVlcnkpIHtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzIHRvIGJlIHF1ZXJpZWRcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTtcbiAgICBpZiAocXVlcnkuZ2V0QWNjb3VudEluZGV4KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gbmV3IFNldCgpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpICE9PSB1bmRlZmluZWQpIHN1YmFkZHJlc3NJbmRpY2VzLmFkZChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLm1hcChzdWJhZGRyZXNzSWR4ID0+IHN1YmFkZHJlc3NJbmRpY2VzLmFkZChzdWJhZGRyZXNzSWR4KSk7XG4gICAgICBpbmRpY2VzLnNldChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMuc2l6ZSA/IEFycmF5LmZyb20oc3ViYWRkcmVzc0luZGljZXMpIDogdW5kZWZpbmVkKTsgIC8vIHVuZGVmaW5lZCB3aWxsIGZldGNoIGZyb20gYWxsIHN1YmFkZHJlc3Nlc1xuICAgIH0gZWxzZSB7XG4gICAgICBhc3NlcnQuZXF1YWwocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCksIHVuZGVmaW5lZCwgXCJRdWVyeSBzcGVjaWZpZXMgYSBzdWJhZGRyZXNzIGluZGV4IGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKVxuICAgICAgYXNzZXJ0KHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCB8fCBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCwgXCJRdWVyeSBzcGVjaWZpZXMgc3ViYWRkcmVzcyBpbmRpY2VzIGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKTtcbiAgICAgIGluZGljZXMgPSBhd2FpdCB0aGlzLmdldEFjY291bnRJbmRpY2VzKCk7ICAvLyBmZXRjaCBhbGwgYWNjb3VudCBpbmRpY2VzIHdpdGhvdXQgc3ViYWRkcmVzc2VzXG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHVuaXF1ZSB0eHMgYW5kIGJsb2Nrc1xuICAgIGxldCB0eE1hcCA9IHt9O1xuICAgIGxldCBibG9ja01hcCA9IHt9O1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdHhzIHdpdGggb3V0cHV0cyBmb3IgZWFjaCBpbmRpY2F0ZWQgYWNjb3VudCB1c2luZyBgaW5jb21pbmdfdHJhbnNmZXJzYCBycGMgY2FsbFxuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy50cmFuc2Zlcl90eXBlID0gcXVlcnkuZ2V0SXNTcGVudCgpID09PSB0cnVlID8gXCJ1bmF2YWlsYWJsZVwiIDogcXVlcnkuZ2V0SXNTcGVudCgpID09PSBmYWxzZSA/IFwiYXZhaWxhYmxlXCIgOiBcImFsbFwiO1xuICAgIHBhcmFtcy52ZXJib3NlID0gdHJ1ZTtcbiAgICBmb3IgKGxldCBhY2NvdW50SWR4IG9mIGluZGljZXMua2V5cygpKSB7XG4gICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gYWNjb3VudElkeDtcbiAgICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBpbmRpY2VzLmdldChhY2NvdW50SWR4KTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW5jb21pbmdfdHJhbnNmZXJzXCIsIHBhcmFtcyk7XG4gICAgICBcbiAgICAgIC8vIGNvbnZlcnQgcmVzcG9uc2UgdG8gdHhzIHdpdGggb3V0cHV0cyBhbmQgbWVyZ2VcbiAgICAgIGlmIChyZXNwLnJlc3VsdC50cmFuc2ZlcnMgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG4gICAgICBmb3IgKGxldCBycGNPdXRwdXQgb2YgcmVzcC5yZXN1bHQudHJhbnNmZXJzKSB7XG4gICAgICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoT3V0cHV0KHJwY091dHB1dCk7XG4gICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzb3J0IHR4cyBieSBibG9jayBoZWlnaHRcbiAgICBsZXQgdHhzOiBNb25lcm9UeFdhbGxldFtdID0gT2JqZWN0LnZhbHVlcyh0eE1hcCk7XG4gICAgdHhzLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVUeHNCeUhlaWdodCk7XG4gICAgXG4gICAgLy8gY29sbGVjdCBxdWVyaWVkIG91dHB1dHNcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgXG4gICAgICAvLyBzb3J0IG91dHB1dHNcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdHguZ2V0T3V0cHV0cygpLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVPdXRwdXRzKTtcbiAgICAgIFxuICAgICAgLy8gY29sbGVjdCBxdWVyaWVkIG91dHB1dHMsIGVyYXNlIGlmIGV4Y2x1ZGVkXG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZmlsdGVyT3V0cHV0cyhxdWVyeSkpIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgXG4gICAgICAvLyByZW1vdmUgZXhjbHVkZWQgdHhzIGZyb20gYmxvY2tcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgPT09IHVuZGVmaW5lZCAmJiB0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29tbW9uIG1ldGhvZCB0byBnZXQga2V5IGltYWdlcy5cbiAgICogXG4gICAqIEBwYXJhbSBhbGwgLSBwZWNpZmllcyB0byBnZXQgYWxsIHhvciBvbmx5IG5ldyBpbWFnZXMgZnJvbSBsYXN0IGltcG9ydFxuICAgKiBAcmV0dXJuIHtNb25lcm9LZXlJbWFnZVtdfSBhcmUgdGhlIGtleSBpbWFnZXNcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBycGNFeHBvcnRLZXlJbWFnZXMoYWxsKSB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfa2V5X2ltYWdlc1wiLCB7YWxsOiBhbGx9KTtcbiAgICBpZiAoIXJlc3AucmVzdWx0LnNpZ25lZF9rZXlfaW1hZ2VzKSByZXR1cm4gW107XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25lZF9rZXlfaW1hZ2VzLm1hcChycGNJbWFnZSA9PiBuZXcgTW9uZXJvS2V5SW1hZ2UocnBjSW1hZ2Uua2V5X2ltYWdlLCBycGNJbWFnZS5zaWduYXR1cmUpKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIHJwY1N3ZWVwQWNjb3VudChjb25maWc6IE1vbmVyb1R4Q29uZmlnKSB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGFuIGFjY291bnQgaW5kZXggdG8gc3dlZXAgZnJvbVwiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCAhPSAxKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZXhhY3RseSBvbmUgZGVzdGluYXRpb24gdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGRlc3RpbmF0aW9uIGFkZHJlc3MgdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBhbW91bnQgaW4gc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0S2V5SW1hZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJLZXkgaW1hZ2UgZGVmaW5lZDsgdXNlIHN3ZWVwT3V0cHV0KCkgdG8gc3dlZXAgYW4gb3V0cHV0IGJ5IGl0cyBrZXkgaW1hZ2VcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJFbXB0eSBsaXN0IGdpdmVuIGZvciBzdWJhZGRyZXNzZXMgaW5kaWNlcyB0byBzd2VlcFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyB3aXRoIFJQQyBgc3dlZXBfYWxsYFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN3ZWVwaW5nIG91dHB1dCBkb2VzIG5vdCBzdXBwb3J0IHN1YnRyYWN0aW5nIGZlZXMgZnJvbSBkZXN0aW5hdGlvbnNcIik7XG4gICAgXG4gICAgLy8gc3dlZXAgZnJvbSBhbGwgc3ViYWRkcmVzc2VzIGlmIG5vdCBvdGhlcndpc2UgZGVmaW5lZFxuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25maWcuc2V0U3ViYWRkcmVzc0luZGljZXMoW10pO1xuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3Nlcyhjb25maWcuZ2V0QWNjb3VudEluZGV4KCkpKSB7XG4gICAgICAgIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gc3ViYWRkcmVzc2VzIHRvIHN3ZWVwIGZyb21cIik7XG4gICAgXG4gICAgLy8gY29tbW9uIGNvbmZpZyBwYXJhbXNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBsZXQgcmVsYXkgPSBjb25maWcuZ2V0UmVsYXkoKSA9PT0gdHJ1ZTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCk7XG4gICAgcGFyYW1zLmFkZHJlc3MgPSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpO1xuICAgIGFzc2VydChjb25maWcuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnLmdldFByaW9yaXR5KCk7XG4gICAgcGFyYW1zLnBheW1lbnRfaWQgPSBjb25maWcuZ2V0UGF5bWVudElkKCk7XG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9ICFyZWxheTtcbiAgICBwYXJhbXMuYmVsb3dfYW1vdW50ID0gY29uZmlnLmdldEJlbG93QW1vdW50KCk7XG4gICAgcGFyYW1zLmdldF90eF9rZXlzID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X2hleCA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9tZXRhZGF0YSA9IHRydWU7XG4gICAgXG4gICAgLy8gaW52b2tlIHdhbGxldCBycGMgYHN3ZWVwX2FsbGBcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN3ZWVwX2FsbFwiLCBwYXJhbXMpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBmcm9tIHJlc3BvbnNlXG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQsIHVuZGVmaW5lZCwgY29uZmlnKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHJlbWFpbmluZyBrbm93biBmaWVsZHNcbiAgICBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkge1xuICAgICAgdHguc2V0SXNMb2NrZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgICAgdHguc2V0UmVsYXkocmVsYXkpO1xuICAgICAgdHguc2V0SW5UeFBvb2wocmVsYXkpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHJlbGF5KTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICBsZXQgdHJhbnNmZXIgPSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgICB0cmFuc2Zlci5zZXRBY2NvdW50SW5kZXgoY29uZmlnLmdldEFjY291bnRJbmRleCgpKTtcbiAgICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDEpIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpKTtcbiAgICAgIGxldCBkZXN0aW5hdGlvbiA9IG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLCBCaWdJbnQodHJhbnNmZXIuZ2V0QW1vdW50KCkpKTtcbiAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhbZGVzdGluYXRpb25dKTtcbiAgICAgIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgICAgdHguc2V0UGF5bWVudElkKGNvbmZpZy5nZXRQYXltZW50SWQoKSk7XG4gICAgICBpZiAodHguZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQpIHR4LnNldFVubG9ja1RpbWUoMG4pO1xuICAgICAgaWYgKHR4LmdldFJlbGF5KCkpIHtcbiAgICAgICAgaWYgKHR4LmdldExhc3RSZWxheWVkVGltZXN0YW1wKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoK25ldyBEYXRlKCkuZ2V0VGltZSgpKTsgIC8vIFRPRE8gKG1vbmVyby13YWxsZXQtcnBjKTogcHJvdmlkZSB0aW1lc3RhbXAgb24gcmVzcG9uc2U7IHVuY29uZmlybWVkIHRpbWVzdGFtcHMgdmFyeVxuICAgICAgICBpZiAodHguZ2V0SXNEb3VibGVTcGVuZFNlZW4oKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0eFNldC5nZXRUeHMoKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHJlZnJlc2hMaXN0ZW5pbmcoKSB7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyID09IHVuZGVmaW5lZCAmJiB0aGlzLmxpc3RlbmVycy5sZW5ndGgpIHRoaXMud2FsbGV0UG9sbGVyID0gbmV3IFdhbGxldFBvbGxlcih0aGlzKTtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCkgdGhpcy53YWxsZXRQb2xsZXIuc2V0SXNQb2xsaW5nKHRoaXMubGlzdGVuZXJzLmxlbmd0aCA+IDApO1xuICB9XG4gIFxuICAvKipcbiAgICogUG9sbCBpZiBsaXN0ZW5pbmcuXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgcG9sbCgpIHtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndhbGxldFBvbGxlci5pc1BvbGxpbmcpIGF3YWl0IHRoaXMud2FsbGV0UG9sbGVyLnBvbGwoKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIFNUQVRJQyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IE1vbmVyb1dhbGxldENvbmZpZyB7XG4gICAgbGV0IGNvbmZpZzogdW5kZWZpbmVkIHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+ID0gdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlb2YgdXJpT3JDb25maWcgPT09IFwic3RyaW5nXCIgfHwgKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pLnVyaSkgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh7c2VydmVyOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbmZpZyBhcyBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+LCB1c2VybmFtZSwgcGFzc3dvcmQpfSk7XG4gICAgZWxzZSBpZiAoR2VuVXRpbHMuaXNBcnJheSh1cmlPckNvbmZpZykpIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoe2NtZDogdXJpT3JDb25maWcgYXMgc3RyaW5nW119KTtcbiAgICBlbHNlIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIgPT09IHVuZGVmaW5lZCkgY29uZmlnLnByb3h5VG9Xb3JrZXIgPSB0cnVlO1xuICAgIHJldHVybiBjb25maWcgYXMgTW9uZXJvV2FsbGV0Q29uZmlnO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVtb3ZlIGNyaXRlcmlhIHdoaWNoIHJlcXVpcmVzIGxvb2tpbmcgdXAgb3RoZXIgdHJhbnNmZXJzL291dHB1dHMgdG9cbiAgICogZnVsZmlsbCBxdWVyeS5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gcXVlcnkgLSB0aGUgcXVlcnkgdG8gZGVjb250ZXh0dWFsaXplXG4gICAqIEByZXR1cm4ge01vbmVyb1R4UXVlcnl9IGEgcmVmZXJlbmNlIHRvIHRoZSBxdWVyeSBmb3IgY29udmVuaWVuY2VcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZGVjb250ZXh0dWFsaXplKHF1ZXJ5KSB7XG4gICAgcXVlcnkuc2V0SXNJbmNvbWluZyh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldElzT3V0Z29pbmcodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRUcmFuc2ZlclF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0SW5wdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldE91dHB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHF1ZXJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGlzQ29udGV4dHVhbChxdWVyeSkge1xuICAgIGlmICghcXVlcnkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIXF1ZXJ5LmdldFR4UXVlcnkoKSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0SXNJbmNvbWluZygpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIHRyYW5zZmVyc1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0SXNPdXRnb2luZygpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlO1xuICAgIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb1RyYW5zZmVyUXVlcnkpIHtcbiAgICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0T3V0cHV0UXVlcnkoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciBvdXRwdXRzXG4gICAgfSBlbHNlIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb091dHB1dFF1ZXJ5KSB7XG4gICAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldFRyYW5zZmVyUXVlcnkoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciB0cmFuc2ZlcnNcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicXVlcnkgbXVzdCBiZSB0eCBvciB0cmFuc2ZlciBxdWVyeVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNBY2NvdW50KHJwY0FjY291bnQpIHtcbiAgICBsZXQgYWNjb3VudCA9IG5ldyBNb25lcm9BY2NvdW50KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0FjY291bnQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQWNjb3VudFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhY2NvdW50X2luZGV4XCIpIGFjY291bnQuc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYWxhbmNlXCIpIGFjY291bnQuc2V0QmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfYmFsYW5jZVwiKSBhY2NvdW50LnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmFzZV9hZGRyZXNzXCIpIGFjY291bnQuc2V0UHJpbWFyeUFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YWdcIikgYWNjb3VudC5zZXRUYWcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYWJlbFwiKSB7IH0gLy8gbGFiZWwgYmVsb25ncyB0byBmaXJzdCBzdWJhZGRyZXNzXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBhY2NvdW50IGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChcIlwiID09PSBhY2NvdW50LmdldFRhZygpKSBhY2NvdW50LnNldFRhZyh1bmRlZmluZWQpO1xuICAgIHJldHVybiBhY2NvdW50O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpIHtcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N1YmFkZHJlc3MpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjU3ViYWRkcmVzc1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhY2NvdW50X2luZGV4XCIpIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc19pbmRleFwiKSBzdWJhZGRyZXNzLnNldEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSBzdWJhZGRyZXNzLnNldEFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYWxhbmNlXCIpIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfYmFsYW5jZVwiKSBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX3Vuc3BlbnRfb3V0cHV0c1wiKSBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFiZWxcIikgeyBpZiAodmFsKSBzdWJhZGRyZXNzLnNldExhYmVsKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1c2VkXCIpIHN1YmFkZHJlc3Muc2V0SXNVc2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tzX3RvX3VubG9ja1wiKSBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT0gXCJ0aW1lX3RvX3VubG9ja1wiKSB7fSAgLy8gaWdub3JpbmdcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHN1YmFkZHJlc3MgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIHNlbnQgdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBUT0RPOiByZW1vdmUgY29weURlc3RpbmF0aW9ucyBhZnRlciA+MTguMy4xIHdoZW4gc3VidHJhY3RGZWVGcm9tIGZ1bGx5IHN1cHBvcnRlZFxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeENvbmZpZ30gY29uZmlnIC0gc2VuZCBjb25maWdcbiAgICogQHBhcmFtIHtNb25lcm9UeFdhbGxldH0gW3R4XSAtIGV4aXN0aW5nIHRyYW5zYWN0aW9uIHRvIGluaXRpYWxpemUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGNvcHlEZXN0aW5hdGlvbnMgLSBjb3BpZXMgY29uZmlnIGRlc3RpbmF0aW9ucyBpZiB0cnVlXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSBpcyB0aGUgaW5pdGlhbGl6ZWQgc2VuZCB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBpbml0U2VudFR4V2FsbGV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4sIHR4LCBjb3B5RGVzdGluYXRpb25zKSB7XG4gICAgaWYgKCF0eCkgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICBsZXQgcmVsYXkgPSBjb25maWcuZ2V0UmVsYXkoKSA9PT0gdHJ1ZTtcbiAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgIHR4LnNldEluVHhQb29sKHJlbGF5KTtcbiAgICB0eC5zZXRSZWxheShyZWxheSk7XG4gICAgdHguc2V0SXNSZWxheWVkKHJlbGF5KTtcbiAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICB0eC5zZXRJc0xvY2tlZCh0cnVlKTtcbiAgICB0eC5zZXRSaW5nU2l6ZShNb25lcm9VdGlscy5SSU5HX1NJWkUpO1xuICAgIGxldCB0cmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgdHJhbnNmZXIuc2V0VHgodHgpO1xuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAmJiBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDEpIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnNsaWNlKDApKTsgLy8gd2Uga25vdyBzcmMgc3ViYWRkcmVzcyBpbmRpY2VzIGlmZiBjb25maWcgc3BlY2lmaWVzIDFcbiAgICBpZiAoY29weURlc3RpbmF0aW9ucykge1xuICAgICAgbGV0IGRlc3RDb3BpZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IGRlc3Qgb2YgY29uZmlnLmdldERlc3RpbmF0aW9ucygpKSBkZXN0Q29waWVzLnB1c2goZGVzdC5jb3B5KCkpO1xuICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKGRlc3RDb3BpZXMpO1xuICAgIH1cbiAgICB0eC5zZXRPdXRnb2luZ1RyYW5zZmVyKHRyYW5zZmVyKTtcbiAgICB0eC5zZXRQYXltZW50SWQoY29uZmlnLmdldFBheW1lbnRJZCgpKTtcbiAgICBpZiAodHguZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQpIHR4LnNldFVubG9ja1RpbWUoMG4pO1xuICAgIGlmIChjb25maWcuZ2V0UmVsYXkoKSkge1xuICAgICAgaWYgKHR4LmdldExhc3RSZWxheWVkVGltZXN0YW1wKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoK25ldyBEYXRlKCkuZ2V0VGltZSgpKTsgIC8vIFRPRE8gKG1vbmVyby13YWxsZXQtcnBjKTogcHJvdmlkZSB0aW1lc3RhbXAgb24gcmVzcG9uc2U7IHVuY29uZmlybWVkIHRpbWVzdGFtcHMgdmFyeVxuICAgICAgaWYgKHR4LmdldElzRG91YmxlU3BlbmRTZWVuKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4oZmFsc2UpO1xuICAgIH1cbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIHR4IHNldCBmcm9tIGEgUlBDIG1hcCBleGNsdWRpbmcgdHhzLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY01hcCAtIG1hcCB0byBpbml0aWFsaXplIHRoZSB0eCBzZXQgZnJvbVxuICAgKiBAcmV0dXJuIE1vbmVyb1R4U2V0IC0gaW5pdGlhbGl6ZWQgdHggc2V0XG4gICAqIEByZXR1cm4gdGhlIHJlc3VsdGluZyB0eCBzZXRcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4U2V0KHJwY01hcCkge1xuICAgIGxldCB0eFNldCA9IG5ldyBNb25lcm9UeFNldCgpO1xuICAgIHR4U2V0LnNldE11bHRpc2lnVHhIZXgocnBjTWFwLm11bHRpc2lnX3R4c2V0KTtcbiAgICB0eFNldC5zZXRVbnNpZ25lZFR4SGV4KHJwY01hcC51bnNpZ25lZF90eHNldCk7XG4gICAgdHhTZXQuc2V0U2lnbmVkVHhIZXgocnBjTWFwLnNpZ25lZF90eHNldCk7XG4gICAgaWYgKHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKSAhPT0gdW5kZWZpbmVkICYmIHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKS5sZW5ndGggPT09IDApIHR4U2V0LnNldE11bHRpc2lnVHhIZXgodW5kZWZpbmVkKTtcbiAgICBpZiAodHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0VW5zaWduZWRUeEhleCh1bmRlZmluZWQpO1xuICAgIGlmICh0eFNldC5nZXRTaWduZWRUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0U2lnbmVkVHhIZXgoKS5sZW5ndGggPT09IDApIHR4U2V0LnNldFNpZ25lZFR4SGV4KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBNb25lcm9UeFNldCBmcm9tIGEgbGlzdCBvZiBycGMgdHhzLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4cyAtIHJwYyB0eHMgdG8gaW5pdGlhbGl6ZSB0aGUgc2V0IGZyb21cbiAgICogQHBhcmFtIHR4cyAtIGV4aXN0aW5nIHR4cyB0byBmdXJ0aGVyIGluaXRpYWxpemUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4gdGhlIGNvbnZlcnRlZCB0eCBzZXRcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJwY1R4czogYW55LCB0eHM/OiBhbnksIGNvbmZpZz86IGFueSkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHNoYXJlZCB0eCBzZXRcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4U2V0KHJwY1R4cyk7XG5cbiAgICAvLyBnZXQgbnVtYmVyIG9mIHR4c1xuICAgIGxldCBudW1UeHMgPSBycGNUeHMuZmVlX2xpc3QgPyBycGNUeHMuZmVlX2xpc3QubGVuZ3RoIDogcnBjVHhzLnR4X2hhc2hfbGlzdCA/IHJwY1R4cy50eF9oYXNoX2xpc3QubGVuZ3RoIDogMDtcbiAgICBcbiAgICAvLyBkb25lIGlmIHJwYyByZXNwb25zZSBjb250YWlucyBubyB0eHNcbiAgICBpZiAobnVtVHhzID09PSAwKSB7XG4gICAgICBhc3NlcnQuZXF1YWwodHhzLCB1bmRlZmluZWQpO1xuICAgICAgcmV0dXJuIHR4U2V0O1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBpZiBub25lIGdpdmVuXG4gICAgaWYgKHR4cykgdHhTZXQuc2V0VHhzKHR4cyk7XG4gICAgZWxzZSB7XG4gICAgICB0eHMgPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVHhzOyBpKyspIHR4cy5wdXNoKG5ldyBNb25lcm9UeFdhbGxldCgpKTtcbiAgICB9XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICB0eC5zZXRUeFNldCh0eFNldCk7XG4gICAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgIH1cbiAgICB0eFNldC5zZXRUeHModHhzKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBmcm9tIHJwYyBsaXN0c1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUeHMpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVHhzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInR4X2hhc2hfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEhhc2godmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9rZXlfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEtleSh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2Jsb2JfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEZ1bGxIZXgodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9tZXRhZGF0YV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0TWV0YWRhdGEodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEZlZShCaWdJbnQodmFsW2ldKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2VpZ2h0X2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRXZWlnaHQodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRfbGlzdFwiKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHR4c1tpXS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT0gdW5kZWZpbmVkKSB0eHNbaV0uc2V0T3V0Z29pbmdUcmFuc2ZlcihuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHR4c1tpXSkpO1xuICAgICAgICAgIHR4c1tpXS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0QW1vdW50KEJpZ0ludCh2YWxbaV0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm11bHRpc2lnX3R4c2V0XCIgfHwga2V5ID09PSBcInVuc2lnbmVkX3R4c2V0XCIgfHwga2V5ID09PSBcInNpZ25lZF90eHNldFwiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50X2tleV9pbWFnZXNfbGlzdFwiKSB7XG4gICAgICAgIGxldCBpbnB1dEtleUltYWdlc0xpc3QgPSB2YWw7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRLZXlJbWFnZXNMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZSh0eHNbaV0uZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICAgICAgdHhzW2ldLnNldElucHV0cyhbXSk7XG4gICAgICAgICAgZm9yIChsZXQgaW5wdXRLZXlJbWFnZSBvZiBpbnB1dEtleUltYWdlc0xpc3RbaV1bXCJrZXlfaW1hZ2VzXCJdKSB7XG4gICAgICAgICAgICB0eHNbaV0uZ2V0SW5wdXRzKCkucHVzaChuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCkuc2V0S2V5SW1hZ2UobmV3IE1vbmVyb0tleUltYWdlKCkuc2V0SGV4KGlucHV0S2V5SW1hZ2UpKS5zZXRUeCh0eHNbaV0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzX2J5X2Rlc3RfbGlzdFwiKSB7XG4gICAgICAgIGxldCBhbW91bnRzQnlEZXN0TGlzdCA9IHZhbDtcbiAgICAgICAgbGV0IGRlc3RpbmF0aW9uSWR4ID0gMDtcbiAgICAgICAgZm9yIChsZXQgdHhJZHggPSAwOyB0eElkeCA8IGFtb3VudHNCeURlc3RMaXN0Lmxlbmd0aDsgdHhJZHgrKykge1xuICAgICAgICAgIGxldCBhbW91bnRzQnlEZXN0ID0gYW1vdW50c0J5RGVzdExpc3RbdHhJZHhdW1wiYW1vdW50c1wiXTtcbiAgICAgICAgICBpZiAodHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT09IHVuZGVmaW5lZCkgdHhzW3R4SWR4XS5zZXRPdXRnb2luZ1RyYW5zZmVyKG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHhzW3R4SWR4XSkpO1xuICAgICAgICAgIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldERlc3RpbmF0aW9ucyhbXSk7XG4gICAgICAgICAgZm9yIChsZXQgYW1vdW50IG9mIGFtb3VudHNCeURlc3QpIHtcbiAgICAgICAgICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoID09PSAxKSB0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKS5wdXNoKG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLCBCaWdJbnQoYW1vdW50KSkpOyAvLyBzd2VlcGluZyBjYW4gY3JlYXRlIG11bHRpcGxlIHR4cyB3aXRoIG9uZSBhZGRyZXNzXG4gICAgICAgICAgICBlbHNlIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVtkZXN0aW5hdGlvbklkeCsrXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnQpKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhIHJwYyB0eCB3aXRoIGEgdHJhbnNmZXIgdG8gYSB0eCBzZXQgd2l0aCBhIHR4IGFuZCB0cmFuc2Zlci5cbiAgICogXG4gICAqIEBwYXJhbSBycGNUeCAtIHJwYyB0eCB0byBidWlsZCBmcm9tXG4gICAqIEBwYXJhbSB0eCAtIGV4aXN0aW5nIHR4IHRvIGNvbnRpbnVlIGluaXRpYWxpemluZyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBpc091dGdvaW5nIC0gc3BlY2lmaWVzIGlmIHRoZSB0eCBpcyBvdXRnb2luZyBpZiB0cnVlLCBpbmNvbWluZyBpZiBmYWxzZSwgb3IgZGVjb2RlcyBmcm9tIHR5cGUgaWYgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB0aGUgaW5pdGlhbGl6ZWQgdHggc2V0IHdpdGggYSB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhUb1R4U2V0KHJwY1R4LCB0eCwgaXNPdXRnb2luZywgY29uZmlnKSB7XG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFNldChycGNUeCk7XG4gICAgdHhTZXQuc2V0VHhzKFtNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4LCB0eCwgaXNPdXRnb2luZywgY29uZmlnKS5zZXRUeFNldCh0eFNldCldKTtcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBCdWlsZHMgYSBNb25lcm9UeFdhbGxldCBmcm9tIGEgUlBDIHR4LlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4IC0gcnBjIHR4IHRvIGJ1aWxkIGZyb21cbiAgICogQHBhcmFtIHR4IC0gZXhpc3RpbmcgdHggdG8gY29udGludWUgaW5pdGlhbGl6aW5nIChvcHRpb25hbClcbiAgICogQHBhcmFtIGlzT3V0Z29pbmcgLSBzcGVjaWZpZXMgaWYgdGhlIHR4IGlzIG91dGdvaW5nIGlmIHRydWUsIGluY29taW5nIGlmIGZhbHNlLCBvciBkZWNvZGVzIGZyb20gdHlwZSBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gaXMgdGhlIGluaXRpYWxpemVkIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlcihycGNUeDogYW55LCB0eD86IGFueSwgaXNPdXRnb2luZz86IGFueSwgY29uZmlnPzogYW55KSB7ICAvLyBUT0RPOiBjaGFuZ2UgZXZlcnl0aGluZyB0byBzYWZlIHNldFxuICAgICAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHRvIHJldHVyblxuICAgIGlmICghdHgpIHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCBzdGF0ZSBmcm9tIHJwYyB0eXBlXG4gICAgaWYgKHJwY1R4LnR5cGUgIT09IHVuZGVmaW5lZCkgaXNPdXRnb2luZyA9IE1vbmVyb1dhbGxldFJwYy5kZWNvZGVScGNUeXBlKHJwY1R4LnR5cGUsIHR4KTtcbiAgICBlbHNlIGFzc2VydC5lcXVhbCh0eXBlb2YgaXNPdXRnb2luZywgXCJib29sZWFuXCIsIFwiTXVzdCBpbmRpY2F0ZSBpZiB0eCBpcyBvdXRnb2luZyAodHJ1ZSkgeG9yIGluY29taW5nIChmYWxzZSkgc2luY2UgdW5rbm93blwiKTtcbiAgICBcbiAgICAvLyBUT0RPOiBzYWZlIHNldFxuICAgIC8vIGluaXRpYWxpemUgcmVtYWluaW5nIGZpZWxkcyAgVE9ETzogc2VlbXMgdGhpcyBzaG91bGQgYmUgcGFydCBvZiBjb21tb24gZnVuY3Rpb24gd2l0aCBEYWVtb25ScGMuY29udmVydFJwY1R4XG4gICAgbGV0IGhlYWRlcjtcbiAgICBsZXQgdHJhbnNmZXI7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1R4KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1R4W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInR4aWRcIikgdHguc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2hhc2hcIikgdHguc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZVwiKSB0eC5zZXRGZWUoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5vdGVcIikgeyBpZiAodmFsKSB0eC5zZXROb3RlKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9rZXlcIikgdHguc2V0S2V5KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHlwZVwiKSB7IH0gLy8gdHlwZSBhbHJlYWR5IGhhbmRsZWRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9zaXplXCIpIHR4LnNldFNpemUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tfdGltZVwiKSB0eC5zZXRVbmxvY2tUaW1lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2VpZ2h0XCIpIHR4LnNldFdlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvY2tlZFwiKSB0eC5zZXRJc0xvY2tlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2Jsb2JcIikgdHguc2V0RnVsbEhleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X21ldGFkYXRhXCIpIHR4LnNldE1ldGFkYXRhKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZG91YmxlX3NwZW5kX3NlZW5cIikgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oZWlnaHRcIiB8fCBrZXkgPT09IFwiaGVpZ2h0XCIpIHtcbiAgICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIHtcbiAgICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgICAgaGVhZGVyLnNldEhlaWdodCh2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGltZXN0YW1wXCIpIHtcbiAgICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIHtcbiAgICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgICAgaGVhZGVyLnNldFRpbWVzdGFtcCh2YWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHRpbWVzdGFtcCBvZiB1bmNvbmZpcm1lZCB0eCBpcyBjdXJyZW50IHJlcXVlc3QgdGltZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY29uZmlybWF0aW9uc1wiKSB0eC5zZXROdW1Db25maXJtYXRpb25zKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3VnZ2VzdGVkX2NvbmZpcm1hdGlvbnNfdGhyZXNob2xkXCIpIHtcbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gKGlzT3V0Z29pbmcgPyBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpIDogbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKSkuc2V0VHgodHgpO1xuICAgICAgICBpZiAoIWlzT3V0Z29pbmcpIHRyYW5zZmVyLnNldE51bVN1Z2dlc3RlZENvbmZpcm1hdGlvbnModmFsKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRcIikge1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIHRyYW5zZmVyLnNldEFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50c1wiKSB7fSAgLy8gaWdub3JpbmcsIGFtb3VudHMgc3VtIHRvIGFtb3VudFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkZHJlc3NcIikge1xuICAgICAgICBpZiAoIWlzT3V0Z29pbmcpIHtcbiAgICAgICAgICBpZiAoIXRyYW5zZmVyKSB0cmFuc2ZlciA9IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkuc2V0VHgodHgpO1xuICAgICAgICAgIHRyYW5zZmVyLnNldEFkZHJlc3ModmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBheW1lbnRfaWRcIikge1xuICAgICAgICBpZiAoXCJcIiAhPT0gdmFsICYmIE1vbmVyb1R4V2FsbGV0LkRFRkFVTFRfUEFZTUVOVF9JRCAhPT0gdmFsKSB0eC5zZXRQYXltZW50SWQodmFsKTsgIC8vIGRlZmF1bHQgaXMgdW5kZWZpbmVkXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRleFwiKSBhc3NlcnQocnBjVHguc3ViYWRkcl9pbmRpY2VzKTsgIC8vIGhhbmRsZWQgYnkgc3ViYWRkcl9pbmRpY2VzXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRpY2VzXCIpIHtcbiAgICAgICAgaWYgKCF0cmFuc2ZlcikgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIGxldCBycGNJbmRpY2VzID0gdmFsO1xuICAgICAgICB0cmFuc2Zlci5zZXRBY2NvdW50SW5kZXgocnBjSW5kaWNlc1swXS5tYWpvcik7XG4gICAgICAgIGlmIChpc091dGdvaW5nKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgICAgICAgZm9yIChsZXQgcnBjSW5kZXggb2YgcnBjSW5kaWNlcykgc3ViYWRkcmVzc0luZGljZXMucHVzaChycGNJbmRleC5taW5vcik7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFzc2VydC5lcXVhbChycGNJbmRpY2VzLmxlbmd0aCwgMSk7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGV4KHJwY0luZGljZXNbMF0ubWlub3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGVzdGluYXRpb25zXCIgfHwga2V5ID09IFwicmVjaXBpZW50c1wiKSB7XG4gICAgICAgIGFzc2VydChpc091dGdvaW5nKTtcbiAgICAgICAgbGV0IGRlc3RpbmF0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBycGNEZXN0aW5hdGlvbiBvZiB2YWwpIHtcbiAgICAgICAgICBsZXQgZGVzdGluYXRpb24gPSBuZXcgTW9uZXJvRGVzdGluYXRpb24oKTtcbiAgICAgICAgICBkZXN0aW5hdGlvbnMucHVzaChkZXN0aW5hdGlvbik7XG4gICAgICAgICAgZm9yIChsZXQgZGVzdGluYXRpb25LZXkgb2YgT2JqZWN0LmtleXMocnBjRGVzdGluYXRpb24pKSB7XG4gICAgICAgICAgICBpZiAoZGVzdGluYXRpb25LZXkgPT09IFwiYWRkcmVzc1wiKSBkZXN0aW5hdGlvbi5zZXRBZGRyZXNzKHJwY0Rlc3RpbmF0aW9uW2Rlc3RpbmF0aW9uS2V5XSk7XG4gICAgICAgICAgICBlbHNlIGlmIChkZXN0aW5hdGlvbktleSA9PT0gXCJhbW91bnRcIikgZGVzdGluYXRpb24uc2V0QW1vdW50KEJpZ0ludChycGNEZXN0aW5hdGlvbltkZXN0aW5hdGlvbktleV0pKTtcbiAgICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVW5yZWNvZ25pemVkIHRyYW5zYWN0aW9uIGRlc3RpbmF0aW9uIGZpZWxkOiBcIiArIGRlc3RpbmF0aW9uS2V5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoe3R4OiB0eH0pO1xuICAgICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoZGVzdGluYXRpb25zKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtdWx0aXNpZ190eHNldFwiICYmIHZhbCAhPT0gdW5kZWZpbmVkKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZTsgdGhpcyBtZXRob2Qgb25seSBidWlsZHMgYSB0eCB3YWxsZXRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnNpZ25lZF90eHNldFwiICYmIHZhbCAhPT0gdW5kZWZpbmVkKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZTsgdGhpcyBtZXRob2Qgb25seSBidWlsZHMgYSB0eCB3YWxsZXRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRfaW5cIikgdHguc2V0SW5wdXRTdW0oQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9vdXRcIikgdHguc2V0T3V0cHV0U3VtKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjaGFuZ2VfYWRkcmVzc1wiKSB0eC5zZXRDaGFuZ2VBZGRyZXNzKHZhbCA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY2hhbmdlX2Ftb3VudFwiKSB0eC5zZXRDaGFuZ2VBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImR1bW15X291dHB1dHNcIikgdHguc2V0TnVtRHVtbXlPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZXh0cmFcIikgdHguc2V0RXh0cmFIZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyaW5nX3NpemVcIikgdHguc2V0UmluZ1NpemUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGVudF9rZXlfaW1hZ2VzXCIpIHtcbiAgICAgICAgbGV0IGlucHV0S2V5SW1hZ2VzID0gdmFsLmtleV9pbWFnZXM7XG4gICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUodHguZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHR4LnNldElucHV0cyhbXSk7XG4gICAgICAgIGZvciAobGV0IGlucHV0S2V5SW1hZ2Ugb2YgaW5wdXRLZXlJbWFnZXMpIHtcbiAgICAgICAgICB0eC5nZXRJbnB1dHMoKS5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKS5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UoKS5zZXRIZXgoaW5wdXRLZXlJbWFnZSkpLnNldFR4KHR4KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzX2J5X2Rlc3RcIikge1xuICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKGlzT3V0Z29pbmcpO1xuICAgICAgICBsZXQgYW1vdW50c0J5RGVzdCA9IHZhbC5hbW91bnRzO1xuICAgICAgICBhc3NlcnQuZXF1YWwoY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCwgYW1vdW50c0J5RGVzdC5sZW5ndGgpO1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHR4KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKFtdKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB0cmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKS5wdXNoKG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbaV0uZ2V0QWRkcmVzcygpLCBCaWdJbnQoYW1vdW50c0J5RGVzdFtpXSkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgdHJhbnNhY3Rpb24gZmllbGQgd2l0aCB0cmFuc2ZlcjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBsaW5rIGJsb2NrIGFuZCB0eFxuICAgIGlmIChoZWFkZXIpIHR4LnNldEJsb2NrKG5ldyBNb25lcm9CbG9jayhoZWFkZXIpLnNldFR4cyhbdHhdKSk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBmaW5hbCBmaWVsZHNcbiAgICBpZiAodHJhbnNmZXIpIHtcbiAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpID09PSB1bmRlZmluZWQpIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIGlmICghdHJhbnNmZXIuZ2V0VHgoKS5nZXRJc0NvbmZpcm1lZCgpKSB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgICAgaWYgKGlzT3V0Z29pbmcpIHtcbiAgICAgICAgdHguc2V0SXNPdXRnb2luZyh0cnVlKTtcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSkge1xuICAgICAgICAgIGlmICh0cmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKSkgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldERlc3RpbmF0aW9ucyh1bmRlZmluZWQpOyAvLyBvdmVyd3JpdGUgdG8gYXZvaWQgcmVjb25jaWxlIGVycm9yIFRPRE86IHJlbW92ZSBhZnRlciA+MTguMy4xIHdoZW4gYW1vdW50c19ieV9kZXN0IHN1cHBvcnRlZFxuICAgICAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5tZXJnZSh0cmFuc2Zlcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB0eC5zZXRPdXRnb2luZ1RyYW5zZmVyKHRyYW5zZmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHR4LnNldElzSW5jb21pbmcodHJ1ZSk7XG4gICAgICAgIHR4LnNldEluY29taW5nVHJhbnNmZXJzKFt0cmFuc2Zlcl0pO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyByZXR1cm4gaW5pdGlhbGl6ZWQgdHJhbnNhY3Rpb25cbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4V2l0aE91dHB1dChycGNPdXRwdXQpIHtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4XG4gICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBvdXRwdXRcbiAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCh7dHg6IHR4fSk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY091dHB1dCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNPdXRwdXRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIG91dHB1dC5zZXRBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50XCIpIG91dHB1dC5zZXRJc1NwZW50KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwia2V5X2ltYWdlXCIpIHsgaWYgKFwiXCIgIT09IHZhbCkgb3V0cHV0LnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSh2YWwpKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImdsb2JhbF9pbmRleFwiKSBvdXRwdXQuc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZFwiKSB0eC5zZXRJc0xvY2tlZCghdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmcm96ZW5cIikgb3V0cHV0LnNldElzRnJvemVuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHVia2V5XCIpIG91dHB1dC5zZXRTdGVhbHRoUHVibGljS2V5KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRleFwiKSB7XG4gICAgICAgIG91dHB1dC5zZXRBY2NvdW50SW5kZXgodmFsLm1ham9yKTtcbiAgICAgICAgb3V0cHV0LnNldFN1YmFkZHJlc3NJbmRleCh2YWwubWlub3IpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiKSB0eC5zZXRCbG9jaygobmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KHZhbCkgYXMgTW9uZXJvQmxvY2spLnNldFR4cyhbdHggYXMgTW9uZXJvVHhdKSk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHdpdGggb3V0cHV0XG4gICAgdHguc2V0T3V0cHV0cyhbb3V0cHV0XSk7XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNEZXNjcmliZVRyYW5zZmVyKHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQpIHtcbiAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImRlc2NcIikge1xuICAgICAgICB0eFNldC5zZXRUeHMoW10pO1xuICAgICAgICBmb3IgKGxldCB0eE1hcCBvZiB2YWwpIHtcbiAgICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHR4TWFwLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgIHR4LnNldFR4U2V0KHR4U2V0KTtcbiAgICAgICAgICB0eFNldC5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1bW1hcnlcIikgeyB9IC8vIFRPRE86IHN1cHBvcnQgdHggc2V0IHN1bW1hcnkgZmllbGRzP1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZGVzY2RyaWJlIHRyYW5zZmVyIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlY29kZXMgYSBcInR5cGVcIiBmcm9tIG1vbmVyby13YWxsZXQtcnBjIHRvIGluaXRpYWxpemUgdHlwZSBhbmQgc3RhdGVcbiAgICogZmllbGRzIGluIHRoZSBnaXZlbiB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIFRPRE86IHRoZXNlIHNob3VsZCBiZSBzYWZlIHNldFxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R5cGUgaXMgdGhlIHR5cGUgdG8gZGVjb2RlXG4gICAqIEBwYXJhbSB0eCBpcyB0aGUgdHJhbnNhY3Rpb24gdG8gZGVjb2RlIGtub3duIGZpZWxkcyB0b1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBycGMgdHlwZSBpbmRpY2F0ZXMgb3V0Z29pbmcgeG9yIGluY29taW5nXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGRlY29kZVJwY1R5cGUocnBjVHlwZSwgdHgpIHtcbiAgICBsZXQgaXNPdXRnb2luZztcbiAgICBpZiAocnBjVHlwZSA9PT0gXCJpblwiKSB7XG4gICAgICBpc091dGdvaW5nID0gZmFsc2U7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwib3V0XCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBvb2xcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7ICAvLyBUT0RPOiBidXQgY291bGQgaXQgYmU/XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBlbmRpbmdcIikge1xuICAgICAgaXNPdXRnb2luZyA9IHRydWU7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiYmxvY2tcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeCh0cnVlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiZmFpbGVkXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNmZXIgdHlwZTogXCIgKyBycGNUeXBlKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzT3V0Z29pbmc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNZXJnZXMgYSB0cmFuc2FjdGlvbiBpbnRvIGEgdW5pcXVlIHNldCBvZiB0cmFuc2FjdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhXYWxsZXR9IHR4IC0gdGhlIHRyYW5zYWN0aW9uIHRvIG1lcmdlIGludG8gdGhlIGV4aXN0aW5nIHR4c1xuICAgKiBAcGFyYW0ge09iamVjdH0gdHhNYXAgLSBtYXBzIHR4IGhhc2hlcyB0byB0eHNcbiAgICogQHBhcmFtIHtPYmplY3R9IGJsb2NrTWFwIC0gbWFwcyBibG9jayBoZWlnaHRzIHRvIGJsb2Nrc1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBtZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApIHtcbiAgICBhc3NlcnQodHguZ2V0SGFzaCgpICE9PSB1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIG1lcmdlIHR4XG4gICAgbGV0IGFUeCA9IHR4TWFwW3R4LmdldEhhc2goKV07XG4gICAgaWYgKGFUeCA9PT0gdW5kZWZpbmVkKSB0eE1hcFt0eC5nZXRIYXNoKCldID0gdHg7IC8vIGNhY2hlIG5ldyB0eFxuICAgIGVsc2UgYVR4Lm1lcmdlKHR4KTsgLy8gbWVyZ2Ugd2l0aCBleGlzdGluZyB0eFxuICAgIFxuICAgIC8vIG1lcmdlIHR4J3MgYmxvY2sgaWYgY29uZmlybWVkXG4gICAgaWYgKHR4LmdldEhlaWdodCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBhQmxvY2sgPSBibG9ja01hcFt0eC5nZXRIZWlnaHQoKV07XG4gICAgICBpZiAoYUJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrTWFwW3R4LmdldEhlaWdodCgpXSA9IHR4LmdldEJsb2NrKCk7IC8vIGNhY2hlIG5ldyBibG9ja1xuICAgICAgZWxzZSBhQmxvY2subWVyZ2UodHguZ2V0QmxvY2soKSk7IC8vIG1lcmdlIHdpdGggZXhpc3RpbmcgYmxvY2tcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNhY3Rpb25zIGJ5IHRoZWlyIGhlaWdodC5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29tcGFyZVR4c0J5SGVpZ2h0KHR4MSwgdHgyKSB7XG4gICAgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4Mi5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMDsgLy8gYm90aCB1bmNvbmZpcm1lZFxuICAgIGVsc2UgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMTsgICAvLyB0eDEgaXMgdW5jb25maXJtZWRcbiAgICBlbHNlIGlmICh0eDIuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIC0xOyAgLy8gdHgyIGlzIHVuY29uZmlybWVkXG4gICAgbGV0IGRpZmYgPSB0eDEuZ2V0SGVpZ2h0KCkgLSB0eDIuZ2V0SGVpZ2h0KCk7XG4gICAgaWYgKGRpZmYgIT09IDApIHJldHVybiBkaWZmO1xuICAgIHJldHVybiB0eDEuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4MSkgLSB0eDIuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4Mik7IC8vIHR4cyBhcmUgaW4gdGhlIHNhbWUgYmxvY2sgc28gcmV0YWluIHRoZWlyIG9yaWdpbmFsIG9yZGVyXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNmZXJzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBzdGF0aWMgY29tcGFyZUluY29taW5nVHJhbnNmZXJzKHQxLCB0Mikge1xuICAgIGlmICh0MS5nZXRBY2NvdW50SW5kZXgoKSA8IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gLTE7XG4gICAgZWxzZSBpZiAodDEuZ2V0QWNjb3VudEluZGV4KCkgPT09IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gdDEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSB0Mi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICByZXR1cm4gMTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byBvdXRwdXRzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbXBhcmVPdXRwdXRzKG8xLCBvMikge1xuICAgIFxuICAgIC8vIGNvbXBhcmUgYnkgaGVpZ2h0XG4gICAgbGV0IGhlaWdodENvbXBhcmlzb24gPSBNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KG8xLmdldFR4KCksIG8yLmdldFR4KCkpO1xuICAgIGlmIChoZWlnaHRDb21wYXJpc29uICE9PSAwKSByZXR1cm4gaGVpZ2h0Q29tcGFyaXNvbjtcbiAgICBcbiAgICAvLyBjb21wYXJlIGJ5IGFjY291bnQgaW5kZXgsIHN1YmFkZHJlc3MgaW5kZXgsIG91dHB1dCBpbmRleCwgdGhlbiBrZXkgaW1hZ2UgaGV4XG4gICAgbGV0IGNvbXBhcmUgPSBvMS5nZXRBY2NvdW50SW5kZXgoKSAtIG8yLmdldEFjY291bnRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICBjb21wYXJlID0gbzEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSBvMi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICBpZiAoY29tcGFyZSAhPT0gMCkgcmV0dXJuIGNvbXBhcmU7XG4gICAgY29tcGFyZSA9IG8xLmdldEluZGV4KCkgLSBvMi5nZXRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICByZXR1cm4gbzEuZ2V0S2V5SW1hZ2UoKS5nZXRIZXgoKS5sb2NhbGVDb21wYXJlKG8yLmdldEtleUltYWdlKCkuZ2V0SGV4KCkpO1xuICB9XG59XG5cbi8qKlxuICogUG9sbHMgbW9uZXJvLXdhbGxldC1ycGMgdG8gcHJvdmlkZSBsaXN0ZW5lciBub3RpZmljYXRpb25zLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRQb2xsZXIge1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBpc1BvbGxpbmc6IGJvb2xlYW47XG4gIHByb3RlY3RlZCB3YWxsZXQ6IE1vbmVyb1dhbGxldFJwYztcbiAgcHJvdGVjdGVkIGxvb3BlcjogVGFza0xvb3BlcjtcbiAgcHJvdGVjdGVkIHByZXZMb2NrZWRUeHM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZDb25maXJtZWROb3RpZmljYXRpb25zOiBhbnk7XG4gIHByb3RlY3RlZCB0aHJlYWRQb29sOiBhbnk7XG4gIHByb3RlY3RlZCBudW1Qb2xsaW5nOiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2SGVpZ2h0OiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2QmFsYW5jZXM6IGFueTtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICB0aGlzLndhbGxldCA9IHdhbGxldDtcbiAgICB0aGlzLmxvb3BlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jIGZ1bmN0aW9uKCkgeyBhd2FpdCB0aGF0LnBvbGwoKTsgfSk7XG4gICAgdGhpcy5wcmV2TG9ja2VkVHhzID0gW107XG4gICAgdGhpcy5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zID0gbmV3IFNldCgpOyAvLyB0eCBoYXNoZXMgb2YgcHJldmlvdXMgbm90aWZpY2F0aW9uc1xuICAgIHRoaXMucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMgPSBuZXcgU2V0KCk7IC8vIHR4IGhhc2hlcyBvZiBwcmV2aW91c2x5IGNvbmZpcm1lZCBidXQgbm90IHlldCB1bmxvY2tlZCBub3RpZmljYXRpb25zXG4gICAgdGhpcy50aHJlYWRQb29sID0gbmV3IFRocmVhZFBvb2woMSk7IC8vIHN5bmNocm9uaXplIHBvbGxzXG4gICAgdGhpcy5udW1Qb2xsaW5nID0gMDtcbiAgfVxuICBcbiAgc2V0SXNQb2xsaW5nKGlzUG9sbGluZykge1xuICAgIHRoaXMuaXNQb2xsaW5nID0gaXNQb2xsaW5nO1xuICAgIGlmIChpc1BvbGxpbmcpIHRoaXMubG9vcGVyLnN0YXJ0KHRoaXMud2FsbGV0LmdldFN5bmNQZXJpb2RJbk1zKCkpO1xuICAgIGVsc2UgdGhpcy5sb29wZXIuc3RvcCgpO1xuICB9XG4gIFxuICBzZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpIHtcbiAgICB0aGlzLmxvb3Blci5zZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpO1xuICB9XG4gIFxuICBhc3luYyBwb2xsKCkge1xuXG4gICAgLy8gc2tpcCBpZiBuZXh0IHBvbGwgaXMgcXVldWVkXG4gICAgaWYgKHRoaXMubnVtUG9sbGluZyA+IDEpIHJldHVybjtcbiAgICB0aGlzLm51bVBvbGxpbmcrKztcbiAgICBcbiAgICAvLyBzeW5jaHJvbml6ZSBwb2xsc1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICByZXR1cm4gdGhpcy50aHJlYWRQb29sLnN1Ym1pdChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIFxuICAgICAgICAvLyBza2lwIGlmIHdhbGxldCBpcyBjbG9zZWRcbiAgICAgICAgaWYgKGF3YWl0IHRoYXQud2FsbGV0LmlzQ2xvc2VkKCkpIHtcbiAgICAgICAgICB0aGF0Lm51bVBvbGxpbmctLTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHRha2UgaW5pdGlhbCBzbmFwc2hvdFxuICAgICAgICBpZiAodGhhdC5wcmV2QmFsYW5jZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEhlaWdodCgpO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpKTtcbiAgICAgICAgICB0aGF0LnByZXZCYWxhbmNlcyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBoZWlnaHQgY2hhbmdlc1xuICAgICAgICBsZXQgaGVpZ2h0ID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0SGVpZ2h0KCk7XG4gICAgICAgIGlmICh0aGF0LnByZXZIZWlnaHQgIT09IGhlaWdodCkge1xuICAgICAgICAgIGZvciAobGV0IGkgPSB0aGF0LnByZXZIZWlnaHQ7IGkgPCBoZWlnaHQ7IGkrKykgYXdhaXQgdGhhdC5vbk5ld0Jsb2NrKGkpO1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gZ2V0IGxvY2tlZCB0eHMgZm9yIGNvbXBhcmlzb24gdG8gcHJldmlvdXNcbiAgICAgICAgbGV0IG1pbkhlaWdodCA9IE1hdGgubWF4KDAsIGhlaWdodCAtIDcwKTsgLy8gb25seSBtb25pdG9yIHJlY2VudCB0eHNcbiAgICAgICAgbGV0IGxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEluY2x1ZGVPdXRwdXRzKHRydWUpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbGxlY3QgaGFzaGVzIG9mIHR4cyBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCBub0xvbmdlckxvY2tlZEhhc2hlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBwcmV2TG9ja2VkVHggb2YgdGhhdC5wcmV2TG9ja2VkVHhzKSB7XG4gICAgICAgICAgaWYgKHRoYXQuZ2V0VHgobG9ja2VkVHhzLCBwcmV2TG9ja2VkVHguZ2V0SGFzaCgpKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBub0xvbmdlckxvY2tlZEhhc2hlcy5wdXNoKHByZXZMb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gc2F2ZSBsb2NrZWQgdHhzIGZvciBuZXh0IGNvbXBhcmlzb25cbiAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzID0gbG9ja2VkVHhzO1xuICAgICAgICBcbiAgICAgICAgLy8gZmV0Y2ggdHhzIHdoaWNoIGFyZSBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCB1bmxvY2tlZFR4cyA9IG5vTG9uZ2VyTG9ja2VkSGFzaGVzLmxlbmd0aCA9PT0gMCA/IFtdIDogYXdhaXQgdGhhdC53YWxsZXQuZ2V0VHhzKG5ldyBNb25lcm9UeFF1ZXJ5KCkuc2V0SXNMb2NrZWQoZmFsc2UpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEhhc2hlcyhub0xvbmdlckxvY2tlZEhhc2hlcykuc2V0SW5jbHVkZU91dHB1dHModHJ1ZSkpO1xuICAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIG5ldyB1bmNvbmZpcm1lZCBhbmQgY29uZmlybWVkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgbG9ja2VkVHggb2YgbG9ja2VkVHhzKSB7XG4gICAgICAgICAgbGV0IHNlYXJjaFNldCA9IGxvY2tlZFR4LmdldElzQ29uZmlybWVkKCkgPyB0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zIDogdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zO1xuICAgICAgICAgIGxldCB1bmFubm91bmNlZCA9ICFzZWFyY2hTZXQuaGFzKGxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgc2VhcmNoU2V0LmFkZChsb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIGlmICh1bmFubm91bmNlZCkgYXdhaXQgdGhhdC5ub3RpZnlPdXRwdXRzKGxvY2tlZFR4KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgbmV3IHVubG9ja2VkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgdW5sb2NrZWRUeCBvZiB1bmxvY2tlZFR4cykge1xuICAgICAgICAgIHRoYXQucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucy5kZWxldGUodW5sb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIHRoYXQucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMuZGVsZXRlKHVubG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHModW5sb2NrZWRUeCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIGJhbGFuY2UgY2hhbmdlc1xuICAgICAgICBhd2FpdCB0aGF0LmNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzKCk7XG4gICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gYmFja2dyb3VuZCBwb2xsIHdhbGxldCAnXCIgKyBhd2FpdCB0aGF0LndhbGxldC5nZXRQYXRoKCkgKyBcIic6IFwiICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgb25OZXdCbG9jayhoZWlnaHQpIHtcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU5ld0Jsb2NrKGhlaWdodCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBub3RpZnlPdXRwdXRzKHR4KSB7XG4gIFxuICAgIC8vIG5vdGlmeSBzcGVudCBvdXRwdXRzIC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogbW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgYWxsb3cgc2NyYXBlIG9mIHR4IGlucHV0cyBzbyBwcm92aWRpbmcgb25lIGlucHV0IHdpdGggb3V0Z29pbmcgYW1vdW50XG4gICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQodHguZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCgpXG4gICAgICAgICAgLnNldEFtb3VudCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkgKyB0eC5nZXRGZWUoKSlcbiAgICAgICAgICAuc2V0QWNjb3VudEluZGV4KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBY2NvdW50SW5kZXgoKSlcbiAgICAgICAgICAuc2V0U3ViYWRkcmVzc0luZGV4KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSA/IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpWzBdIDogdW5kZWZpbmVkKSAvLyBpbml0aWFsaXplIGlmIHRyYW5zZmVyIHNvdXJjZWQgZnJvbSBzaW5nbGUgc3ViYWRkcmVzc1xuICAgICAgICAgIC5zZXRUeCh0eCk7XG4gICAgICB0eC5zZXRJbnB1dHMoW291dHB1dF0pO1xuICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRTcGVudChvdXRwdXQpO1xuICAgIH1cbiAgICBcbiAgICAvLyBub3RpZnkgcmVjZWl2ZWQgb3V0cHV0c1xuICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRPdXRwdXRzKCkubGVuZ3RoID4gMCkgeyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG91dHB1dHMgb25seSByZXR1cm5lZCBmb3IgY29uZmlybWVkIHR4c1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgeyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGFsbG93IHNjcmFwZSBvZiB1bmNvbmZpcm1lZCByZWNlaXZlZCBvdXRwdXRzIHNvIHVzaW5nIGluY29taW5nIHRyYW5zZmVyIHZhbHVlc1xuICAgICAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB7XG4gICAgICAgICAgb3V0cHV0cy5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKVxuICAgICAgICAgICAgICAuc2V0QWNjb3VudEluZGV4KHRyYW5zZmVyLmdldEFjY291bnRJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0U3ViYWRkcmVzc0luZGV4KHRyYW5zZmVyLmdldFN1YmFkZHJlc3NJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0QW1vdW50KHRyYW5zZmVyLmdldEFtb3VudCgpKVxuICAgICAgICAgICAgICAuc2V0VHgodHgpKTtcbiAgICAgICAgfVxuICAgICAgICB0eC5zZXRPdXRwdXRzKG91dHB1dHMpO1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgZ2V0VHgodHhzLCB0eEhhc2gpIHtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIGlmICh0eEhhc2ggPT09IHR4LmdldEhhc2goKSkgcmV0dXJuIHR4O1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjaGVja0ZvckNoYW5nZWRCYWxhbmNlcygpIHtcbiAgICBsZXQgYmFsYW5jZXMgPSBhd2FpdCB0aGlzLndhbGxldC5nZXRCYWxhbmNlcygpO1xuICAgIGlmIChiYWxhbmNlc1swXSAhPT0gdGhpcy5wcmV2QmFsYW5jZXNbMF0gfHwgYmFsYW5jZXNbMV0gIT09IHRoaXMucHJldkJhbGFuY2VzWzFdKSB7XG4gICAgICB0aGlzLnByZXZCYWxhbmNlcyA9IGJhbGFuY2VzO1xuICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQoYmFsYW5jZXNbMF0sIGJhbGFuY2VzWzFdKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGFBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFdBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLGNBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLGlCQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSx1QkFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sWUFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsa0JBQUEsR0FBQVQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFTLG1CQUFBLEdBQUFWLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVSxjQUFBLEdBQUFYLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVyxrQkFBQSxHQUFBWixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVksWUFBQSxHQUFBYixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWEsdUJBQUEsR0FBQWQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFjLHdCQUFBLEdBQUFmLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZSxlQUFBLEdBQUFoQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWdCLDJCQUFBLEdBQUFqQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWlCLG1CQUFBLEdBQUFsQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWtCLHlCQUFBLEdBQUFuQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQW1CLHlCQUFBLEdBQUFwQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQW9CLHVCQUFBLEdBQUFyQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXFCLGtCQUFBLEdBQUF0QixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXNCLG1CQUFBLEdBQUF2QixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXVCLG9CQUFBLEdBQUF4QixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXdCLGVBQUEsR0FBQXpCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBeUIsaUJBQUEsR0FBQTFCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBMEIsaUJBQUEsR0FBQTNCLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQTJCLG9CQUFBLEdBQUE1QixzQkFBQSxDQUFBQyxPQUFBOztBQUVBLElBQUE0QixlQUFBLEdBQUE3QixzQkFBQSxDQUFBQyxPQUFBOztBQUVBLElBQUE2QixjQUFBLEdBQUE5QixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQThCLFlBQUEsR0FBQS9CLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBK0IsZUFBQSxHQUFBaEMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFnQyxZQUFBLEdBQUFqQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWlDLGNBQUEsR0FBQWxDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBa0MsYUFBQSxHQUFBbkMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFtQyxtQkFBQSxHQUFBcEMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFvQyxxQkFBQSxHQUFBckMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFxQywyQkFBQSxHQUFBdEMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFzQyw2QkFBQSxHQUFBdkMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUF1QyxXQUFBLEdBQUF4QyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXdDLFdBQUEsR0FBQXpDLHNCQUFBLENBQUFDLE9BQUEsMEJBQThDLFNBQUF5Qyx5QkFBQUMsV0FBQSxjQUFBQyxPQUFBLGlDQUFBQyxpQkFBQSxPQUFBRCxPQUFBLE9BQUFFLGdCQUFBLE9BQUFGLE9BQUEsV0FBQUYsd0JBQUEsWUFBQUEsQ0FBQUMsV0FBQSxVQUFBQSxXQUFBLEdBQUFHLGdCQUFBLEdBQUFELGlCQUFBLElBQUFGLFdBQUEsWUFBQUksd0JBQUFDLEdBQUEsRUFBQUwsV0FBQSxRQUFBQSxXQUFBLElBQUFLLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLFVBQUFELEdBQUEsTUFBQUEsR0FBQSxvQkFBQUEsR0FBQSx3QkFBQUEsR0FBQSwyQkFBQUUsT0FBQSxFQUFBRixHQUFBLFFBQUFHLEtBQUEsR0FBQVQsd0JBQUEsQ0FBQUMsV0FBQSxNQUFBUSxLQUFBLElBQUFBLEtBQUEsQ0FBQUMsR0FBQSxDQUFBSixHQUFBLFdBQUFHLEtBQUEsQ0FBQUUsR0FBQSxDQUFBTCxHQUFBLE9BQUFNLE1BQUEsVUFBQUMscUJBQUEsR0FBQUMsTUFBQSxDQUFBQyxjQUFBLElBQUFELE1BQUEsQ0FBQUUsd0JBQUEsVUFBQUMsR0FBQSxJQUFBWCxHQUFBLE9BQUFXLEdBQUEsa0JBQUFILE1BQUEsQ0FBQUksU0FBQSxDQUFBQyxjQUFBLENBQUFDLElBQUEsQ0FBQWQsR0FBQSxFQUFBVyxHQUFBLFFBQUFJLElBQUEsR0FBQVIscUJBQUEsR0FBQUMsTUFBQSxDQUFBRSx3QkFBQSxDQUFBVixHQUFBLEVBQUFXLEdBQUEsYUFBQUksSUFBQSxLQUFBQSxJQUFBLENBQUFWLEdBQUEsSUFBQVUsSUFBQSxDQUFBQyxHQUFBLElBQUFSLE1BQUEsQ0FBQUMsY0FBQSxDQUFBSCxNQUFBLEVBQUFLLEdBQUEsRUFBQUksSUFBQSxVQUFBVCxNQUFBLENBQUFLLEdBQUEsSUFBQVgsR0FBQSxDQUFBVyxHQUFBLEtBQUFMLE1BQUEsQ0FBQUosT0FBQSxHQUFBRixHQUFBLEtBQUFHLEtBQUEsR0FBQUEsS0FBQSxDQUFBYSxHQUFBLENBQUFoQixHQUFBLEVBQUFNLE1BQUEsVUFBQUEsTUFBQTs7O0FBRzlDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ2UsTUFBTVcsZUFBZSxTQUFTQyxxQkFBWSxDQUFDOztFQUV4RDtFQUNBLE9BQTBCQyx5QkFBeUIsR0FBRyxLQUFLLENBQUMsQ0FBQzs7RUFFN0Q7Ozs7Ozs7Ozs7O0VBV0E7RUFDQUMsV0FBV0EsQ0FBQ0MsTUFBMEIsRUFBRTtJQUN0QyxLQUFLLENBQUMsQ0FBQztJQUNQLElBQUksQ0FBQ0EsTUFBTSxHQUFHQSxNQUFNO0lBQ3BCLElBQUksQ0FBQ0MsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEIsSUFBSSxDQUFDQyxjQUFjLEdBQUdOLGVBQWUsQ0FBQ0UseUJBQXlCO0VBQ2pFOztFQUVBOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRUssVUFBVUEsQ0FBQSxFQUFpQjtJQUN6QixPQUFPLElBQUksQ0FBQ0MsT0FBTztFQUNyQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNQyxXQUFXQSxDQUFDQyxLQUFLLEdBQUcsS0FBSyxFQUFnQztJQUM3RCxJQUFJLElBQUksQ0FBQ0YsT0FBTyxLQUFLRyxTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLHVEQUF1RCxDQUFDO0lBQzlHLElBQUlDLGFBQWEsR0FBR0MsaUJBQVEsQ0FBQ0MsU0FBUyxDQUFDLElBQUksQ0FBQ0MsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUMzRCxLQUFLLElBQUlDLFFBQVEsSUFBSUosYUFBYSxFQUFFLE1BQU0sSUFBSSxDQUFDSyxjQUFjLENBQUNELFFBQVEsQ0FBQztJQUN2RSxPQUFPSCxpQkFBUSxDQUFDSyxXQUFXLENBQUMsSUFBSSxDQUFDWCxPQUFPLEVBQUVFLEtBQUssR0FBRyxTQUFTLEdBQUdDLFNBQVMsQ0FBQztFQUMxRTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0VTLGdCQUFnQkEsQ0FBQSxFQUFvQztJQUNsRCxPQUFPLElBQUksQ0FBQ2hCLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDO0VBQ2hDOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU1DLFVBQVVBLENBQUNDLFlBQWtELEVBQUVDLFFBQWlCLEVBQTRCOztJQUVoSDtJQUNBLElBQUlwQixNQUFNLEdBQUcsSUFBSXFCLDJCQUFrQixDQUFDLE9BQU9GLFlBQVksS0FBSyxRQUFRLEdBQUcsRUFBQ0csSUFBSSxFQUFFSCxZQUFZLEVBQUVDLFFBQVEsRUFBRUEsUUFBUSxHQUFHQSxRQUFRLEdBQUcsRUFBRSxFQUFDLEdBQUdELFlBQVksQ0FBQztJQUMvSTs7SUFFQTtJQUNBLElBQUksQ0FBQ25CLE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJZixvQkFBVyxDQUFDLHFDQUFxQyxDQUFDO0lBQ25GLElBQUlSLE1BQU0sQ0FBQ3dCLFVBQVUsQ0FBQyxDQUFDLEtBQUtqQixTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLHFEQUFxRCxDQUFDO0lBQ25ILE1BQU0sSUFBSSxDQUFDUixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsYUFBYSxFQUFFLEVBQUNDLFFBQVEsRUFBRTFCLE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDLEVBQUVILFFBQVEsRUFBRXBCLE1BQU0sQ0FBQzJCLFdBQVcsQ0FBQyxDQUFDLEVBQUMsQ0FBQztJQUMxSCxNQUFNLElBQUksQ0FBQ0MsS0FBSyxDQUFDLENBQUM7SUFDbEIsSUFBSSxDQUFDTixJQUFJLEdBQUd0QixNQUFNLENBQUN1QixPQUFPLENBQUMsQ0FBQzs7SUFFNUI7SUFDQSxJQUFJdkIsTUFBTSxDQUFDNkIsb0JBQW9CLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRTtNQUN6QyxJQUFJN0IsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUlULG9CQUFXLENBQUMsdUVBQXVFLENBQUM7TUFDdEgsTUFBTSxJQUFJLENBQUNzQixvQkFBb0IsQ0FBQzlCLE1BQU0sQ0FBQzZCLG9CQUFvQixDQUFDLENBQUMsQ0FBQztJQUNoRSxDQUFDLE1BQU0sSUFBSTdCLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLElBQUksSUFBSSxFQUFFO01BQ3JDLE1BQU0sSUFBSSxDQUFDYyxtQkFBbUIsQ0FBQy9CLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDcEQ7O0lBRUEsT0FBTyxJQUFJO0VBQ2I7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTWUsWUFBWUEsQ0FBQ2hDLE1BQW1DLEVBQTRCOztJQUVoRjtJQUNBLElBQUlBLE1BQU0sS0FBS08sU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyxzQ0FBc0MsQ0FBQztJQUN2RixNQUFNeUIsZ0JBQWdCLEdBQUcsSUFBSVosMkJBQWtCLENBQUNyQixNQUFNLENBQUM7SUFDdkQsSUFBSWlDLGdCQUFnQixDQUFDQyxPQUFPLENBQUMsQ0FBQyxLQUFLM0IsU0FBUyxLQUFLMEIsZ0JBQWdCLENBQUNFLGlCQUFpQixDQUFDLENBQUMsS0FBSzVCLFNBQVMsSUFBSTBCLGdCQUFnQixDQUFDRyxpQkFBaUIsQ0FBQyxDQUFDLEtBQUs3QixTQUFTLElBQUkwQixnQkFBZ0IsQ0FBQ0ksa0JBQWtCLENBQUMsQ0FBQyxLQUFLOUIsU0FBUyxDQUFDLEVBQUU7TUFDak4sTUFBTSxJQUFJQyxvQkFBVyxDQUFDLDREQUE0RCxDQUFDO0lBQ3JGO0lBQ0EsSUFBSXlCLGdCQUFnQixDQUFDVCxVQUFVLENBQUMsQ0FBQyxLQUFLakIsU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyxzREFBc0QsQ0FBQztJQUM5SCxJQUFJeUIsZ0JBQWdCLENBQUNLLGNBQWMsQ0FBQyxDQUFDLEtBQUsvQixTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLGtHQUFrRyxDQUFDO0lBQzlLLElBQUl5QixnQkFBZ0IsQ0FBQ00sbUJBQW1CLENBQUMsQ0FBQyxLQUFLaEMsU0FBUyxJQUFJMEIsZ0JBQWdCLENBQUNPLHNCQUFzQixDQUFDLENBQUMsS0FBS2pDLFNBQVMsRUFBRSxNQUFNLElBQUlDLG9CQUFXLENBQUMsd0ZBQXdGLENBQUM7SUFDcE8sSUFBSXlCLGdCQUFnQixDQUFDTixXQUFXLENBQUMsQ0FBQyxLQUFLcEIsU0FBUyxFQUFFMEIsZ0JBQWdCLENBQUNRLFdBQVcsQ0FBQyxFQUFFLENBQUM7O0lBRWxGO0lBQ0EsSUFBSVIsZ0JBQWdCLENBQUNKLG9CQUFvQixDQUFDLENBQUMsRUFBRTtNQUMzQyxJQUFJSSxnQkFBZ0IsQ0FBQ2hCLFNBQVMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJVCxvQkFBVyxDQUFDLHdFQUF3RSxDQUFDO01BQ2pJeUIsZ0JBQWdCLENBQUNTLFNBQVMsQ0FBQzFDLE1BQU0sQ0FBQzZCLG9CQUFvQixDQUFDLENBQUMsQ0FBQ2MsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUMzRTs7SUFFQTtJQUNBLElBQUlWLGdCQUFnQixDQUFDQyxPQUFPLENBQUMsQ0FBQyxLQUFLM0IsU0FBUyxFQUFFLE1BQU0sSUFBSSxDQUFDcUMsb0JBQW9CLENBQUNYLGdCQUFnQixDQUFDLENBQUM7SUFDM0YsSUFBSUEsZ0JBQWdCLENBQUNJLGtCQUFrQixDQUFDLENBQUMsS0FBSzlCLFNBQVMsSUFBSTBCLGdCQUFnQixDQUFDRSxpQkFBaUIsQ0FBQyxDQUFDLEtBQUs1QixTQUFTLEVBQUUsTUFBTSxJQUFJLENBQUNzQyxvQkFBb0IsQ0FBQ1osZ0JBQWdCLENBQUMsQ0FBQztJQUNqSyxNQUFNLElBQUksQ0FBQ2Esa0JBQWtCLENBQUNiLGdCQUFnQixDQUFDOztJQUVwRDtJQUNBLElBQUlBLGdCQUFnQixDQUFDSixvQkFBb0IsQ0FBQyxDQUFDLEVBQUU7TUFDM0MsTUFBTSxJQUFJLENBQUNDLG9CQUFvQixDQUFDRyxnQkFBZ0IsQ0FBQ0osb0JBQW9CLENBQUMsQ0FBQyxDQUFDO0lBQzFFLENBQUMsTUFBTSxJQUFJSSxnQkFBZ0IsQ0FBQ2hCLFNBQVMsQ0FBQyxDQUFDLEVBQUU7TUFDdkMsTUFBTSxJQUFJLENBQUNjLG1CQUFtQixDQUFDRSxnQkFBZ0IsQ0FBQ2hCLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDOUQ7O0lBRUEsT0FBTyxJQUFJO0VBQ2I7O0VBRUEsTUFBZ0I2QixrQkFBa0JBLENBQUM5QyxNQUEwQixFQUFFO0lBQzdELElBQUlBLE1BQU0sQ0FBQytDLGFBQWEsQ0FBQyxDQUFDLEtBQUt4QyxTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLHVEQUF1RCxDQUFDO0lBQ3hILElBQUlSLE1BQU0sQ0FBQ2dELGdCQUFnQixDQUFDLENBQUMsS0FBS3pDLFNBQVMsRUFBRSxNQUFNLElBQUlDLG9CQUFXLENBQUMsMERBQTBELENBQUM7SUFDOUgsSUFBSVIsTUFBTSxDQUFDaUQsY0FBYyxDQUFDLENBQUMsS0FBSyxLQUFLLEVBQUUsTUFBTSxJQUFJekMsb0JBQVcsQ0FBQyxtRUFBbUUsQ0FBQztJQUNqSSxJQUFJLENBQUNSLE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJZixvQkFBVyxDQUFDLHlCQUF5QixDQUFDO0lBQ3ZFLElBQUksQ0FBQ1IsTUFBTSxDQUFDa0QsV0FBVyxDQUFDLENBQUMsRUFBRWxELE1BQU0sQ0FBQ21ELFdBQVcsQ0FBQ3RELHFCQUFZLENBQUN1RCxnQkFBZ0IsQ0FBQztJQUM1RSxJQUFJQyxNQUFNLEdBQUcsRUFBRTNCLFFBQVEsRUFBRTFCLE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDLEVBQUVILFFBQVEsRUFBRXBCLE1BQU0sQ0FBQzJCLFdBQVcsQ0FBQyxDQUFDLEVBQUUyQixRQUFRLEVBQUV0RCxNQUFNLENBQUNrRCxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0csSUFBSTtNQUNGLE1BQU0sSUFBSSxDQUFDbEQsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGVBQWUsRUFBRTRCLE1BQU0sQ0FBQztJQUN4RSxDQUFDLENBQUMsT0FBT0UsR0FBUSxFQUFFO01BQ2pCLElBQUksQ0FBQ0MsdUJBQXVCLENBQUN4RCxNQUFNLENBQUN1QixPQUFPLENBQUMsQ0FBQyxFQUFFZ0MsR0FBRyxDQUFDO0lBQ3JEO0lBQ0EsTUFBTSxJQUFJLENBQUMzQixLQUFLLENBQUMsQ0FBQztJQUNsQixJQUFJLENBQUNOLElBQUksR0FBR3RCLE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDO0lBQzVCLE9BQU8sSUFBSTtFQUNiOztFQUVBLE1BQWdCcUIsb0JBQW9CQSxDQUFDNUMsTUFBMEIsRUFBRTtJQUMvRCxJQUFJO01BQ0YsTUFBTSxJQUFJLENBQUNBLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyw4QkFBOEIsRUFBRTtRQUM1RUMsUUFBUSxFQUFFMUIsTUFBTSxDQUFDdUIsT0FBTyxDQUFDLENBQUM7UUFDMUJILFFBQVEsRUFBRXBCLE1BQU0sQ0FBQzJCLFdBQVcsQ0FBQyxDQUFDO1FBQzlCOEIsSUFBSSxFQUFFekQsTUFBTSxDQUFDa0MsT0FBTyxDQUFDLENBQUM7UUFDdEJ3QixXQUFXLEVBQUUxRCxNQUFNLENBQUMrQyxhQUFhLENBQUMsQ0FBQztRQUNuQ1ksNEJBQTRCLEVBQUUzRCxNQUFNLENBQUM0RCxhQUFhLENBQUMsQ0FBQztRQUNwREMsY0FBYyxFQUFFN0QsTUFBTSxDQUFDZ0QsZ0JBQWdCLENBQUMsQ0FBQztRQUN6Q00sUUFBUSxFQUFFdEQsTUFBTSxDQUFDa0QsV0FBVyxDQUFDLENBQUM7UUFDOUJZLGdCQUFnQixFQUFFOUQsTUFBTSxDQUFDaUQsY0FBYyxDQUFDO01BQzFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxPQUFPTSxHQUFRLEVBQUU7TUFDakIsSUFBSSxDQUFDQyx1QkFBdUIsQ0FBQ3hELE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDLEVBQUVnQyxHQUFHLENBQUM7SUFDckQ7SUFDQSxNQUFNLElBQUksQ0FBQzNCLEtBQUssQ0FBQyxDQUFDO0lBQ2xCLElBQUksQ0FBQ04sSUFBSSxHQUFHdEIsTUFBTSxDQUFDdUIsT0FBTyxDQUFDLENBQUM7SUFDNUIsT0FBTyxJQUFJO0VBQ2I7O0VBRUEsTUFBZ0JzQixvQkFBb0JBLENBQUM3QyxNQUEwQixFQUFFO0lBQy9ELElBQUlBLE1BQU0sQ0FBQytDLGFBQWEsQ0FBQyxDQUFDLEtBQUt4QyxTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLDBEQUEwRCxDQUFDO0lBQzNILElBQUlSLE1BQU0sQ0FBQ2dELGdCQUFnQixDQUFDLENBQUMsS0FBS3pDLFNBQVMsRUFBRVAsTUFBTSxDQUFDK0QsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLElBQUkvRCxNQUFNLENBQUNrRCxXQUFXLENBQUMsQ0FBQyxLQUFLM0MsU0FBUyxFQUFFUCxNQUFNLENBQUNtRCxXQUFXLENBQUN0RCxxQkFBWSxDQUFDdUQsZ0JBQWdCLENBQUM7SUFDekYsSUFBSTtNQUNGLE1BQU0sSUFBSSxDQUFDcEQsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLG9CQUFvQixFQUFFO1FBQ2xFQyxRQUFRLEVBQUUxQixNQUFNLENBQUN1QixPQUFPLENBQUMsQ0FBQztRQUMxQkgsUUFBUSxFQUFFcEIsTUFBTSxDQUFDMkIsV0FBVyxDQUFDLENBQUM7UUFDOUJxQyxPQUFPLEVBQUVoRSxNQUFNLENBQUNtQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ25DOEIsT0FBTyxFQUFFakUsTUFBTSxDQUFDb0MsaUJBQWlCLENBQUMsQ0FBQztRQUNuQzhCLFFBQVEsRUFBRWxFLE1BQU0sQ0FBQ3FDLGtCQUFrQixDQUFDLENBQUM7UUFDckN3QixjQUFjLEVBQUU3RCxNQUFNLENBQUNnRCxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3pDYyxnQkFBZ0IsRUFBRTlELE1BQU0sQ0FBQ2lELGNBQWMsQ0FBQztNQUMxQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsT0FBT00sR0FBUSxFQUFFO01BQ2pCLElBQUksQ0FBQ0MsdUJBQXVCLENBQUN4RCxNQUFNLENBQUN1QixPQUFPLENBQUMsQ0FBQyxFQUFFZ0MsR0FBRyxDQUFDO0lBQ3JEO0lBQ0EsTUFBTSxJQUFJLENBQUMzQixLQUFLLENBQUMsQ0FBQztJQUNsQixJQUFJLENBQUNOLElBQUksR0FBR3RCLE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDO0lBQzVCLE9BQU8sSUFBSTtFQUNiOztFQUVVaUMsdUJBQXVCQSxDQUFDVyxJQUFJLEVBQUVaLEdBQUcsRUFBRTtJQUMzQyxJQUFJQSxHQUFHLENBQUNhLE9BQU8sRUFBRTtNQUNmLElBQUliLEdBQUcsQ0FBQ2EsT0FBTyxDQUFDQyxXQUFXLENBQUMsQ0FBQyxDQUFDQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLElBQUlDLHVCQUFjLENBQUMseUJBQXlCLEdBQUdKLElBQUksRUFBRVosR0FBRyxDQUFDaUIsT0FBTyxDQUFDLENBQUMsRUFBRWpCLEdBQUcsQ0FBQ2tCLFlBQVksQ0FBQyxDQUFDLEVBQUVsQixHQUFHLENBQUNtQixZQUFZLENBQUMsQ0FBQyxDQUFDO01BQzNLLElBQUluQixHQUFHLENBQUNhLE9BQU8sQ0FBQ0MsV0FBVyxDQUFDLENBQUMsQ0FBQ0MsUUFBUSxDQUFDLCtCQUErQixDQUFDLEVBQUUsTUFBTSxJQUFJQyx1QkFBYyxDQUFDLGtCQUFrQixFQUFFaEIsR0FBRyxDQUFDaUIsT0FBTyxDQUFDLENBQUMsRUFBRWpCLEdBQUcsQ0FBQ2tCLFlBQVksQ0FBQyxDQUFDLEVBQUVsQixHQUFHLENBQUNtQixZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQzlLO0lBQ0EsTUFBTW5CLEdBQUc7RUFDWDs7RUFFQSxNQUFNb0IsVUFBVUEsQ0FBQSxFQUFxQjtJQUNuQyxJQUFJO01BQ0YsTUFBTSxJQUFJLENBQUMzRSxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUNtRCxRQUFRLEVBQUUsVUFBVSxFQUFDLENBQUM7TUFDbEYsT0FBTyxLQUFLLENBQUMsQ0FBQztJQUNoQixDQUFDLENBQUMsT0FBT0MsQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLE9BQU8sSUFBSSxDQUFDLENBQUU7TUFDdkMsSUFBSUssQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLE9BQU8sS0FBSyxDQUFDLENBQUU7TUFDdkMsTUFBTUssQ0FBQztJQUNUO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNOUMsbUJBQW1CQSxDQUFDK0MsZUFBdUQsRUFBRUMsU0FBbUIsRUFBRUMsVUFBdUIsRUFBaUI7SUFDOUksSUFBSUMsVUFBVSxHQUFHLENBQUNILGVBQWUsR0FBR3ZFLFNBQVMsR0FBR3VFLGVBQWUsWUFBWUksNEJBQW1CLEdBQUdKLGVBQWUsR0FBRyxJQUFJSSw0QkFBbUIsQ0FBQ0osZUFBZSxDQUFDO0lBQzNKLElBQUksQ0FBQ0UsVUFBVSxFQUFFQSxVQUFVLEdBQUcsSUFBSUcsbUJBQVUsQ0FBQyxDQUFDO0lBQzlDLElBQUk5QixNQUFXLEdBQUcsQ0FBQyxDQUFDO0lBQ3BCQSxNQUFNLENBQUNXLE9BQU8sR0FBR2lCLFVBQVUsR0FBR0EsVUFBVSxDQUFDRyxNQUFNLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDO0lBQy9EL0IsTUFBTSxDQUFDZ0MsUUFBUSxHQUFHSixVQUFVLEdBQUdBLFVBQVUsQ0FBQ0ssV0FBVyxDQUFDLENBQUMsR0FBRyxFQUFFO0lBQzVEakMsTUFBTSxDQUFDakMsUUFBUSxHQUFHNkQsVUFBVSxHQUFHQSxVQUFVLENBQUN0RCxXQUFXLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDNUQwQixNQUFNLENBQUNrQyxPQUFPLEdBQUdSLFNBQVM7SUFDMUIxQixNQUFNLENBQUNtQyxXQUFXLEdBQUcsWUFBWTtJQUNqQ25DLE1BQU0sQ0FBQ29DLG9CQUFvQixHQUFHVCxVQUFVLENBQUNVLGlCQUFpQixDQUFDLENBQUM7SUFDNURyQyxNQUFNLENBQUNzQyxvQkFBb0IsR0FBSVgsVUFBVSxDQUFDWSxrQkFBa0IsQ0FBQyxDQUFDO0lBQzlEdkMsTUFBTSxDQUFDd0MsV0FBVyxHQUFHYixVQUFVLENBQUNjLDJCQUEyQixDQUFDLENBQUM7SUFDN0R6QyxNQUFNLENBQUMwQyx3QkFBd0IsR0FBR2YsVUFBVSxDQUFDZ0Isc0JBQXNCLENBQUMsQ0FBQztJQUNyRTNDLE1BQU0sQ0FBQzRDLGtCQUFrQixHQUFHakIsVUFBVSxDQUFDa0IsZUFBZSxDQUFDLENBQUM7O0lBRXhEO0lBQ0EsSUFBSWpCLFVBQVUsSUFBSUEsVUFBVSxDQUFDa0IsV0FBVyxDQUFDLENBQUMsS0FBSzVGLFNBQVMsRUFBRTtNQUN4RCxJQUFJLElBQUksQ0FBQzZGLGVBQWUsS0FBSzdGLFNBQVMsRUFBRSxNQUFNLElBQUlDLG9CQUFXLENBQUMseUdBQXlHLEdBQUcsSUFBSSxDQUFDNEYsZUFBZSxDQUFDO0lBQ2pNLENBQUMsTUFBTTtNQUNMLElBQUksSUFBSSxDQUFDQSxlQUFlLEtBQUs3RixTQUFTLEVBQUU4QyxNQUFNLENBQUNnRCxLQUFLLEdBQUdwQixVQUFVLEdBQUdBLFVBQVUsQ0FBQ2tCLFdBQVcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO01BQzdGLElBQUksSUFBSSxDQUFDQyxlQUFlLEtBQUtuQixVQUFVLENBQUNrQixXQUFXLENBQUMsQ0FBQyxFQUFFO1FBQzFELE1BQU0sSUFBSTNGLG9CQUFXLENBQUMsOENBQThDLEdBQUd5RSxVQUFVLENBQUNrQixXQUFXLENBQUMsQ0FBQyxHQUFHLHFFQUFxRSxHQUFHLElBQUksQ0FBQ0MsZUFBZSxDQUFDO01BQ2pNO0lBQ0Y7SUFDQSxJQUFJLENBQUMvQyxNQUFNLENBQUNnRCxLQUFLLEVBQUVoRCxNQUFNLENBQUNnRCxLQUFLLEdBQUcsRUFBRTs7SUFFcEMsTUFBTSxJQUFJLENBQUNyRyxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsWUFBWSxFQUFFNEIsTUFBTSxDQUFDO0lBQ25FLElBQUksQ0FBQ2lELGdCQUFnQixHQUFHckIsVUFBVTtFQUNwQzs7RUFFQSxNQUFNc0IsbUJBQW1CQSxDQUFBLEVBQWlDO0lBQ3hELE9BQU8sSUFBSSxDQUFDRCxnQkFBZ0I7RUFDOUI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNRSxXQUFXQSxDQUFDQyxVQUFtQixFQUFFQyxhQUFzQixFQUFxQjtJQUNoRixJQUFJRCxVQUFVLEtBQUtsRyxTQUFTLEVBQUU7TUFDNUJvRyxlQUFNLENBQUNDLEtBQUssQ0FBQ0YsYUFBYSxFQUFFbkcsU0FBUyxFQUFFLGtEQUFrRCxDQUFDO01BQzFGLElBQUlzRyxPQUFPLEdBQUdDLE1BQU0sQ0FBQyxDQUFDLENBQUM7TUFDdkIsSUFBSUMsZUFBZSxHQUFHRCxNQUFNLENBQUMsQ0FBQyxDQUFDO01BQy9CLEtBQUssSUFBSUUsT0FBTyxJQUFJLE1BQU0sSUFBSSxDQUFDQyxXQUFXLENBQUMsQ0FBQyxFQUFFO1FBQzVDSixPQUFPLEdBQUdBLE9BQU8sR0FBR0csT0FBTyxDQUFDRSxVQUFVLENBQUMsQ0FBQztRQUN4Q0gsZUFBZSxHQUFHQSxlQUFlLEdBQUdDLE9BQU8sQ0FBQ0csa0JBQWtCLENBQUMsQ0FBQztNQUNsRTtNQUNBLE9BQU8sQ0FBQ04sT0FBTyxFQUFFRSxlQUFlLENBQUM7SUFDbkMsQ0FBQyxNQUFNO01BQ0wsSUFBSTFELE1BQU0sR0FBRyxFQUFDK0QsYUFBYSxFQUFFWCxVQUFVLEVBQUVZLGVBQWUsRUFBRVgsYUFBYSxLQUFLbkcsU0FBUyxHQUFHQSxTQUFTLEdBQUcsQ0FBQ21HLGFBQWEsQ0FBQyxFQUFDO01BQ3BILElBQUlZLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxhQUFhLEVBQUU0QixNQUFNLENBQUM7TUFDL0UsSUFBSXFELGFBQWEsS0FBS25HLFNBQVMsRUFBRSxPQUFPLENBQUN1RyxNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDVixPQUFPLENBQUMsRUFBRUMsTUFBTSxDQUFDUSxJQUFJLENBQUNDLE1BQU0sQ0FBQ0MsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO01BQ3ZHLE9BQU8sQ0FBQ1YsTUFBTSxDQUFDUSxJQUFJLENBQUNDLE1BQU0sQ0FBQ0UsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDWixPQUFPLENBQUMsRUFBRUMsTUFBTSxDQUFDUSxJQUFJLENBQUNDLE1BQU0sQ0FBQ0UsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDRCxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3JIO0VBQ0Y7O0VBRUE7O0VBRUEsTUFBTUUsV0FBV0EsQ0FBQzdHLFFBQThCLEVBQWlCO0lBQy9ELE1BQU0sS0FBSyxDQUFDNkcsV0FBVyxDQUFDN0csUUFBUSxDQUFDO0lBQ2pDLElBQUksQ0FBQzhHLGdCQUFnQixDQUFDLENBQUM7RUFDekI7O0VBRUEsTUFBTTdHLGNBQWNBLENBQUNELFFBQVEsRUFBaUI7SUFDNUMsTUFBTSxLQUFLLENBQUNDLGNBQWMsQ0FBQ0QsUUFBUSxDQUFDO0lBQ3BDLElBQUksQ0FBQzhHLGdCQUFnQixDQUFDLENBQUM7RUFDekI7O0VBRUEsTUFBTUMsbUJBQW1CQSxDQUFBLEVBQXFCO0lBQzVDLElBQUk7TUFDRixNQUFNLElBQUksQ0FBQ0MsaUJBQWlCLENBQUMsTUFBTSxJQUFJLENBQUMxRixpQkFBaUIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7TUFDdEUsTUFBTSxJQUFJM0Isb0JBQVcsQ0FBQyxnQ0FBZ0MsQ0FBQztJQUN6RCxDQUFDLENBQUMsT0FBT3FFLENBQU0sRUFBRTtNQUNmLElBQUlBLENBQUMsWUFBWXJFLG9CQUFXLElBQUlxRSxDQUFDLENBQUNMLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsTUFBTUssQ0FBQyxDQUFDLENBQUM7TUFDOUQsT0FBT0EsQ0FBQyxDQUFDVCxPQUFPLENBQUMwRCxPQUFPLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDO0lBQzdEO0VBQ0Y7O0VBRUEsTUFBTUMsVUFBVUEsQ0FBQSxFQUEyQjtJQUN6QyxJQUFJVCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsYUFBYSxDQUFDO0lBQ3ZFLE9BQU8sSUFBSXVHLHNCQUFhLENBQUNWLElBQUksQ0FBQ0MsTUFBTSxDQUFDVSxPQUFPLEVBQUVYLElBQUksQ0FBQ0MsTUFBTSxDQUFDVyxPQUFPLENBQUM7RUFDcEU7O0VBRUEsTUFBTTNHLE9BQU9BLENBQUEsRUFBb0I7SUFDL0IsT0FBTyxJQUFJLENBQUNELElBQUk7RUFDbEI7O0VBRUEsTUFBTVksT0FBT0EsQ0FBQSxFQUFvQjtJQUMvQixJQUFJb0YsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFbUQsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDL0YsT0FBTzBDLElBQUksQ0FBQ0MsTUFBTSxDQUFDakksR0FBRztFQUN4Qjs7RUFFQSxNQUFNNkksZUFBZUEsQ0FBQSxFQUFvQjtJQUN2QyxJQUFJLE9BQU0sSUFBSSxDQUFDakcsT0FBTyxDQUFDLENBQUMsTUFBSzNCLFNBQVMsRUFBRSxPQUFPQSxTQUFTO0lBQ3hELE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyxpREFBaUQsQ0FBQztFQUMxRTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTTRILGdCQUFnQkEsQ0FBQSxFQUFHO0lBQ3ZCLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQ3BJLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxlQUFlLENBQUMsRUFBRThGLE1BQU0sQ0FBQ2MsU0FBUztFQUMxRjs7RUFFQSxNQUFNakcsaUJBQWlCQSxDQUFBLEVBQW9CO0lBQ3pDLElBQUlrRixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUVtRCxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUMvRixPQUFPMEMsSUFBSSxDQUFDQyxNQUFNLENBQUNqSSxHQUFHO0VBQ3hCOztFQUVBLE1BQU0rQyxrQkFBa0JBLENBQUEsRUFBb0I7SUFDMUMsSUFBSWlGLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRW1ELFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQ2hHLE9BQU8wQyxJQUFJLENBQUNDLE1BQU0sQ0FBQ2pJLEdBQUc7RUFDeEI7O0VBRUEsTUFBTWdKLFVBQVVBLENBQUM3QixVQUFrQixFQUFFQyxhQUFxQixFQUFtQjtJQUMzRSxJQUFJNkIsYUFBYSxHQUFHLElBQUksQ0FBQ3RJLFlBQVksQ0FBQ3dHLFVBQVUsQ0FBQztJQUNqRCxJQUFJLENBQUM4QixhQUFhLEVBQUU7TUFDbEIsTUFBTSxJQUFJLENBQUNDLGVBQWUsQ0FBQy9CLFVBQVUsRUFBRWxHLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFFO01BQzFELE9BQU8sSUFBSSxDQUFDK0gsVUFBVSxDQUFDN0IsVUFBVSxFQUFFQyxhQUFhLENBQUMsQ0FBQyxDQUFRO0lBQzVEO0lBQ0EsSUFBSTFDLE9BQU8sR0FBR3VFLGFBQWEsQ0FBQzdCLGFBQWEsQ0FBQztJQUMxQyxJQUFJLENBQUMxQyxPQUFPLEVBQUU7TUFDWixNQUFNLElBQUksQ0FBQ3dFLGVBQWUsQ0FBQy9CLFVBQVUsRUFBRWxHLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFFO01BQzFELE9BQU8sSUFBSSxDQUFDTixZQUFZLENBQUN3RyxVQUFVLENBQUMsQ0FBQ0MsYUFBYSxDQUFDO0lBQ3JEO0lBQ0EsT0FBTzFDLE9BQU87RUFDaEI7O0VBRUE7RUFDQSxNQUFNeUUsZUFBZUEsQ0FBQ3pFLE9BQWUsRUFBNkI7O0lBRWhFO0lBQ0EsSUFBSXNELElBQUk7SUFDUixJQUFJO01BQ0ZBLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRSxFQUFDdUMsT0FBTyxFQUFFQSxPQUFPLEVBQUMsQ0FBQztJQUMvRixDQUFDLENBQUMsT0FBT2EsQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSWhFLG9CQUFXLENBQUNxRSxDQUFDLENBQUNULE9BQU8sQ0FBQztNQUN4RCxNQUFNUyxDQUFDO0lBQ1Q7O0lBRUE7SUFDQSxJQUFJNkQsVUFBVSxHQUFHLElBQUlDLHlCQUFnQixDQUFDLEVBQUMzRSxPQUFPLEVBQUVBLE9BQU8sRUFBQyxDQUFDO0lBQ3pEMEUsVUFBVSxDQUFDRSxlQUFlLENBQUN0QixJQUFJLENBQUNDLE1BQU0sQ0FBQ3NCLEtBQUssQ0FBQ0MsS0FBSyxDQUFDO0lBQ25ESixVQUFVLENBQUNLLFFBQVEsQ0FBQ3pCLElBQUksQ0FBQ0MsTUFBTSxDQUFDc0IsS0FBSyxDQUFDRyxLQUFLLENBQUM7SUFDNUMsT0FBT04sVUFBVTtFQUNuQjs7RUFFQSxNQUFNTyxvQkFBb0JBLENBQUNDLGVBQXdCLEVBQUVDLFNBQWtCLEVBQW9DO0lBQ3pHLElBQUk7TUFDRixJQUFJQyxvQkFBb0IsR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDcEosTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLHlCQUF5QixFQUFFLEVBQUM0SCxnQkFBZ0IsRUFBRUgsZUFBZSxFQUFFSSxVQUFVLEVBQUVILFNBQVMsRUFBQyxDQUFDLEVBQUU1QixNQUFNLENBQUNnQyxrQkFBa0I7TUFDM0wsT0FBTyxNQUFNLElBQUksQ0FBQ0MsdUJBQXVCLENBQUNKLG9CQUFvQixDQUFDO0lBQ2pFLENBQUMsQ0FBQyxPQUFPdkUsQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxDQUFDVCxPQUFPLENBQUNFLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLE1BQU0sSUFBSTlELG9CQUFXLENBQUMsc0JBQXNCLEdBQUcySSxTQUFTLENBQUM7TUFDdkcsTUFBTXRFLENBQUM7SUFDVDtFQUNGOztFQUVBLE1BQU0yRSx1QkFBdUJBLENBQUNDLGlCQUF5QixFQUFvQztJQUN6RixJQUFJbkMsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLDBCQUEwQixFQUFFLEVBQUM4SCxrQkFBa0IsRUFBRUUsaUJBQWlCLEVBQUMsQ0FBQztJQUM3SCxPQUFPLElBQUlDLGdDQUF1QixDQUFDLENBQUMsQ0FBQ0Msa0JBQWtCLENBQUNyQyxJQUFJLENBQUNDLE1BQU0sQ0FBQzhCLGdCQUFnQixDQUFDLENBQUNPLFlBQVksQ0FBQ3RDLElBQUksQ0FBQ0MsTUFBTSxDQUFDK0IsVUFBVSxDQUFDLENBQUNPLG9CQUFvQixDQUFDSixpQkFBaUIsQ0FBQztFQUNwSzs7RUFFQSxNQUFNSyxTQUFTQSxDQUFBLEVBQW9CO0lBQ2pDLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQzlKLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxZQUFZLENBQUMsRUFBRThGLE1BQU0sQ0FBQ3dDLE1BQU07RUFDcEY7O0VBRUEsTUFBTUMsZUFBZUEsQ0FBQSxFQUFvQjtJQUN2QyxNQUFNLElBQUl4SixvQkFBVyxDQUFDLDZEQUE2RCxDQUFDO0VBQ3RGOztFQUVBLE1BQU15SixlQUFlQSxDQUFDQyxJQUFZLEVBQUVDLEtBQWEsRUFBRUMsR0FBVyxFQUFtQjtJQUMvRSxNQUFNLElBQUk1SixvQkFBVyxDQUFDLDZEQUE2RCxDQUFDO0VBQ3RGOztFQUVBLE1BQU02SixJQUFJQSxDQUFDQyxxQkFBcUQsRUFBRUMsV0FBb0IsRUFBNkI7SUFDakgsSUFBQTVELGVBQU0sRUFBQyxFQUFFMkQscUJBQXFCLFlBQVlFLDZCQUFvQixDQUFDLEVBQUUsNERBQTRELENBQUM7SUFDOUgsSUFBSTtNQUNGLElBQUlsRCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsU0FBUyxFQUFFLEVBQUNnSixZQUFZLEVBQUVGLFdBQVcsRUFBQyxDQUFDO01BQ2hHLE1BQU0sSUFBSSxDQUFDRyxJQUFJLENBQUMsQ0FBQztNQUNqQixPQUFPLElBQUlDLHlCQUFnQixDQUFDckQsSUFBSSxDQUFDQyxNQUFNLENBQUNxRCxjQUFjLEVBQUV0RCxJQUFJLENBQUNDLE1BQU0sQ0FBQ3NELGNBQWMsQ0FBQztJQUNyRixDQUFDLENBQUMsT0FBT3RILEdBQVEsRUFBRTtNQUNqQixJQUFJQSxHQUFHLENBQUNhLE9BQU8sS0FBSyx5QkFBeUIsRUFBRSxNQUFNLElBQUk1RCxvQkFBVyxDQUFDLG1DQUFtQyxDQUFDO01BQ3pHLE1BQU0rQyxHQUFHO0lBQ1g7RUFDRjs7RUFFQSxNQUFNdUgsWUFBWUEsQ0FBQzVLLGNBQXVCLEVBQWlCOztJQUV6RDtJQUNBLElBQUk2SyxtQkFBbUIsR0FBR0MsSUFBSSxDQUFDQyxLQUFLLENBQUMsQ0FBQy9LLGNBQWMsS0FBS0ssU0FBUyxHQUFHWCxlQUFlLENBQUNFLHlCQUF5QixHQUFHSSxjQUFjLElBQUksSUFBSSxDQUFDOztJQUV4STtJQUNBLE1BQU0sSUFBSSxDQUFDRixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsY0FBYyxFQUFFO01BQzVEeUosTUFBTSxFQUFFLElBQUk7TUFDWkMsTUFBTSxFQUFFSjtJQUNWLENBQUMsQ0FBQzs7SUFFRjtJQUNBLElBQUksQ0FBQzdLLGNBQWMsR0FBRzZLLG1CQUFtQixHQUFHLElBQUk7SUFDaEQsSUFBSSxJQUFJLENBQUNLLFlBQVksS0FBSzdLLFNBQVMsRUFBRSxJQUFJLENBQUM2SyxZQUFZLENBQUNDLGFBQWEsQ0FBQyxJQUFJLENBQUNuTCxjQUFjLENBQUM7O0lBRXpGO0lBQ0EsTUFBTSxJQUFJLENBQUN3SyxJQUFJLENBQUMsQ0FBQztFQUNuQjs7RUFFQVksaUJBQWlCQSxDQUFBLEVBQVc7SUFDMUIsT0FBTyxJQUFJLENBQUNwTCxjQUFjO0VBQzVCOztFQUVBLE1BQU1xTCxXQUFXQSxDQUFBLEVBQWtCO0lBQ2pDLE9BQU8sSUFBSSxDQUFDdkwsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGNBQWMsRUFBRSxFQUFFeUosTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7RUFDbkY7O0VBRUEsTUFBTU0sT0FBT0EsQ0FBQ0MsUUFBa0IsRUFBaUI7SUFDL0MsSUFBSSxDQUFDQSxRQUFRLElBQUksQ0FBQ0EsUUFBUSxDQUFDQyxNQUFNLEVBQUUsTUFBTSxJQUFJbEwsb0JBQVcsQ0FBQyw0QkFBNEIsQ0FBQztJQUN0RixNQUFNLElBQUksQ0FBQ1IsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLFNBQVMsRUFBRSxFQUFDa0ssS0FBSyxFQUFFRixRQUFRLEVBQUMsQ0FBQztJQUMzRSxNQUFNLElBQUksQ0FBQ2YsSUFBSSxDQUFDLENBQUM7RUFDbkI7O0VBRUEsTUFBTWtCLFdBQVdBLENBQUEsRUFBa0I7SUFDakMsTUFBTSxJQUFJLENBQUM1TCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsY0FBYyxFQUFFbEIsU0FBUyxDQUFDO0VBQzFFOztFQUVBLE1BQU1zTCxnQkFBZ0JBLENBQUEsRUFBa0I7SUFDdEMsTUFBTSxJQUFJLENBQUM3TCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsbUJBQW1CLEVBQUVsQixTQUFTLENBQUM7RUFDL0U7O0VBRUEsTUFBTTJHLFVBQVVBLENBQUNULFVBQW1CLEVBQUVDLGFBQXNCLEVBQW1CO0lBQzdFLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQ0YsV0FBVyxDQUFDQyxVQUFVLEVBQUVDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUMvRDs7RUFFQSxNQUFNUyxrQkFBa0JBLENBQUNWLFVBQW1CLEVBQUVDLGFBQXNCLEVBQW1CO0lBQ3JGLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQ0YsV0FBVyxDQUFDQyxVQUFVLEVBQUVDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUMvRDs7RUFFQSxNQUFNTyxXQUFXQSxDQUFDNkUsbUJBQTZCLEVBQUVDLEdBQVksRUFBRUMsWUFBc0IsRUFBNEI7O0lBRS9HO0lBQ0EsSUFBSTFFLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxjQUFjLEVBQUUsRUFBQ3NLLEdBQUcsRUFBRUEsR0FBRyxFQUFDLENBQUM7O0lBRXBGO0lBQ0E7SUFDQSxJQUFJRSxRQUF5QixHQUFHLEVBQUU7SUFDbEMsS0FBSyxJQUFJQyxVQUFVLElBQUk1RSxJQUFJLENBQUNDLE1BQU0sQ0FBQzRFLG1CQUFtQixFQUFFO01BQ3RELElBQUluRixPQUFPLEdBQUdwSCxlQUFlLENBQUN3TSxpQkFBaUIsQ0FBQ0YsVUFBVSxDQUFDO01BQzNELElBQUlKLG1CQUFtQixFQUFFOUUsT0FBTyxDQUFDcUYsZUFBZSxDQUFDLE1BQU0sSUFBSSxDQUFDN0QsZUFBZSxDQUFDeEIsT0FBTyxDQUFDc0YsUUFBUSxDQUFDLENBQUMsRUFBRS9MLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztNQUNqSDBMLFFBQVEsQ0FBQ00sSUFBSSxDQUFDdkYsT0FBTyxDQUFDO0lBQ3hCOztJQUVBO0lBQ0EsSUFBSThFLG1CQUFtQixJQUFJLENBQUNFLFlBQVksRUFBRTs7TUFFeEM7TUFDQSxLQUFLLElBQUloRixPQUFPLElBQUlpRixRQUFRLEVBQUU7UUFDNUIsS0FBSyxJQUFJdkQsVUFBVSxJQUFJMUIsT0FBTyxDQUFDd0IsZUFBZSxDQUFDLENBQUMsRUFBRTtVQUNoREUsVUFBVSxDQUFDOEQsVUFBVSxDQUFDMUYsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQ2hDNEIsVUFBVSxDQUFDK0Qsa0JBQWtCLENBQUMzRixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDeEM0QixVQUFVLENBQUNnRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7VUFDbENoRSxVQUFVLENBQUNpRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7UUFDcEM7TUFDRjs7TUFFQTtNQUNBckYsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGFBQWEsRUFBRSxFQUFDbUwsWUFBWSxFQUFFLElBQUksRUFBQyxDQUFDO01BQ3pGLElBQUl0RixJQUFJLENBQUNDLE1BQU0sQ0FBQ0UsY0FBYyxFQUFFO1FBQzlCLEtBQUssSUFBSW9GLGFBQWEsSUFBSXZGLElBQUksQ0FBQ0MsTUFBTSxDQUFDRSxjQUFjLEVBQUU7VUFDcEQsSUFBSWlCLFVBQVUsR0FBRzlJLGVBQWUsQ0FBQ2tOLG9CQUFvQixDQUFDRCxhQUFhLENBQUM7O1VBRXBFO1VBQ0EsSUFBSTdGLE9BQU8sR0FBR2lGLFFBQVEsQ0FBQ3ZELFVBQVUsQ0FBQ3FFLGVBQWUsQ0FBQyxDQUFDLENBQUM7VUFDcERwRyxlQUFNLENBQUNDLEtBQUssQ0FBQzhCLFVBQVUsQ0FBQ3FFLGVBQWUsQ0FBQyxDQUFDLEVBQUUvRixPQUFPLENBQUNzRixRQUFRLENBQUMsQ0FBQyxFQUFFLCtCQUErQixDQUFDLENBQUMsQ0FBRTtVQUNsRyxJQUFJVSxhQUFhLEdBQUdoRyxPQUFPLENBQUN3QixlQUFlLENBQUMsQ0FBQyxDQUFDRSxVQUFVLENBQUM0RCxRQUFRLENBQUMsQ0FBQyxDQUFDO1VBQ3BFM0YsZUFBTSxDQUFDQyxLQUFLLENBQUM4QixVQUFVLENBQUM0RCxRQUFRLENBQUMsQ0FBQyxFQUFFVSxhQUFhLENBQUNWLFFBQVEsQ0FBQyxDQUFDLEVBQUUsbUNBQW1DLENBQUM7VUFDbEcsSUFBSTVELFVBQVUsQ0FBQ3hCLFVBQVUsQ0FBQyxDQUFDLEtBQUszRyxTQUFTLEVBQUV5TSxhQUFhLENBQUNSLFVBQVUsQ0FBQzlELFVBQVUsQ0FBQ3hCLFVBQVUsQ0FBQyxDQUFDLENBQUM7VUFDNUYsSUFBSXdCLFVBQVUsQ0FBQ3ZCLGtCQUFrQixDQUFDLENBQUMsS0FBSzVHLFNBQVMsRUFBRXlNLGFBQWEsQ0FBQ1Asa0JBQWtCLENBQUMvRCxVQUFVLENBQUN2QixrQkFBa0IsQ0FBQyxDQUFDLENBQUM7VUFDcEgsSUFBSXVCLFVBQVUsQ0FBQ3VFLG9CQUFvQixDQUFDLENBQUMsS0FBSzFNLFNBQVMsRUFBRXlNLGFBQWEsQ0FBQ04sb0JBQW9CLENBQUNoRSxVQUFVLENBQUN1RSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7UUFDNUg7TUFDRjtJQUNGOztJQUVBLE9BQU9oQixRQUFRO0VBQ2pCOztFQUVBO0VBQ0EsTUFBTWlCLFVBQVVBLENBQUN6RyxVQUFrQixFQUFFcUYsbUJBQTZCLEVBQUVFLFlBQXNCLEVBQTBCO0lBQ2xILElBQUFyRixlQUFNLEVBQUNGLFVBQVUsSUFBSSxDQUFDLENBQUM7SUFDdkIsS0FBSyxJQUFJTyxPQUFPLElBQUksTUFBTSxJQUFJLENBQUNDLFdBQVcsQ0FBQyxDQUFDLEVBQUU7TUFDNUMsSUFBSUQsT0FBTyxDQUFDc0YsUUFBUSxDQUFDLENBQUMsS0FBSzdGLFVBQVUsRUFBRTtRQUNyQyxJQUFJcUYsbUJBQW1CLEVBQUU5RSxPQUFPLENBQUNxRixlQUFlLENBQUMsTUFBTSxJQUFJLENBQUM3RCxlQUFlLENBQUMvQixVQUFVLEVBQUVsRyxTQUFTLEVBQUV5TCxZQUFZLENBQUMsQ0FBQztRQUNqSCxPQUFPaEYsT0FBTztNQUNoQjtJQUNGO0lBQ0EsTUFBTSxJQUFJbUcsS0FBSyxDQUFDLHFCQUFxQixHQUFHMUcsVUFBVSxHQUFHLGlCQUFpQixDQUFDO0VBQ3pFOztFQUVBLE1BQU0yRyxhQUFhQSxDQUFDQyxLQUFjLEVBQTBCO0lBQzFEQSxLQUFLLEdBQUdBLEtBQUssR0FBR0EsS0FBSyxHQUFHOU0sU0FBUztJQUNqQyxJQUFJK0csSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGdCQUFnQixFQUFFLEVBQUM0TCxLQUFLLEVBQUVBLEtBQUssRUFBQyxDQUFDO0lBQzFGLE9BQU8sSUFBSUMsc0JBQWEsQ0FBQztNQUN2QnpFLEtBQUssRUFBRXZCLElBQUksQ0FBQ0MsTUFBTSxDQUFDSCxhQUFhO01BQ2hDbUcsY0FBYyxFQUFFakcsSUFBSSxDQUFDQyxNQUFNLENBQUN2RCxPQUFPO01BQ25DcUosS0FBSyxFQUFFQSxLQUFLO01BQ1p4RyxPQUFPLEVBQUVDLE1BQU0sQ0FBQyxDQUFDLENBQUM7TUFDbEJDLGVBQWUsRUFBRUQsTUFBTSxDQUFDLENBQUM7SUFDM0IsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTTBCLGVBQWVBLENBQUMvQixVQUFrQixFQUFFK0csaUJBQTRCLEVBQUV4QixZQUFzQixFQUErQjs7SUFFM0g7SUFDQSxJQUFJM0ksTUFBVyxHQUFHLENBQUMsQ0FBQztJQUNwQkEsTUFBTSxDQUFDK0QsYUFBYSxHQUFHWCxVQUFVO0lBQ2pDLElBQUkrRyxpQkFBaUIsRUFBRW5LLE1BQU0sQ0FBQ29LLGFBQWEsR0FBRy9NLGlCQUFRLENBQUNnTixPQUFPLENBQUNGLGlCQUFpQixDQUFDO0lBQ2pGLElBQUlsRyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsYUFBYSxFQUFFNEIsTUFBTSxDQUFDOztJQUUvRTtJQUNBLElBQUlzSyxZQUFZLEdBQUcsRUFBRTtJQUNyQixLQUFLLElBQUlkLGFBQWEsSUFBSXZGLElBQUksQ0FBQ0MsTUFBTSxDQUFDcUcsU0FBUyxFQUFFO01BQy9DLElBQUlsRixVQUFVLEdBQUc5SSxlQUFlLENBQUNrTixvQkFBb0IsQ0FBQ0QsYUFBYSxDQUFDO01BQ3BFbkUsVUFBVSxDQUFDRSxlQUFlLENBQUNuQyxVQUFVLENBQUM7TUFDdENrSCxZQUFZLENBQUNwQixJQUFJLENBQUM3RCxVQUFVLENBQUM7SUFDL0I7O0lBRUE7SUFDQSxJQUFJLENBQUNzRCxZQUFZLEVBQUU7O01BRWpCO01BQ0EsS0FBSyxJQUFJdEQsVUFBVSxJQUFJaUYsWUFBWSxFQUFFO1FBQ25DakYsVUFBVSxDQUFDOEQsVUFBVSxDQUFDMUYsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hDNEIsVUFBVSxDQUFDK0Qsa0JBQWtCLENBQUMzRixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEM0QixVQUFVLENBQUNnRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7UUFDbENoRSxVQUFVLENBQUNpRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7TUFDcEM7O01BRUE7TUFDQXJGLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxhQUFhLEVBQUU0QixNQUFNLENBQUM7TUFDM0UsSUFBSWlFLElBQUksQ0FBQ0MsTUFBTSxDQUFDRSxjQUFjLEVBQUU7UUFDOUIsS0FBSyxJQUFJb0YsYUFBYSxJQUFJdkYsSUFBSSxDQUFDQyxNQUFNLENBQUNFLGNBQWMsRUFBRTtVQUNwRCxJQUFJaUIsVUFBVSxHQUFHOUksZUFBZSxDQUFDa04sb0JBQW9CLENBQUNELGFBQWEsQ0FBQzs7VUFFcEU7VUFDQSxLQUFLLElBQUlHLGFBQWEsSUFBSVcsWUFBWSxFQUFFO1lBQ3RDLElBQUlYLGFBQWEsQ0FBQ1YsUUFBUSxDQUFDLENBQUMsS0FBSzVELFVBQVUsQ0FBQzRELFFBQVEsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDO1lBQ2xFLElBQUk1RCxVQUFVLENBQUN4QixVQUFVLENBQUMsQ0FBQyxLQUFLM0csU0FBUyxFQUFFeU0sYUFBYSxDQUFDUixVQUFVLENBQUM5RCxVQUFVLENBQUN4QixVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQzVGLElBQUl3QixVQUFVLENBQUN2QixrQkFBa0IsQ0FBQyxDQUFDLEtBQUs1RyxTQUFTLEVBQUV5TSxhQUFhLENBQUNQLGtCQUFrQixDQUFDL0QsVUFBVSxDQUFDdkIsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1lBQ3BILElBQUl1QixVQUFVLENBQUN1RSxvQkFBb0IsQ0FBQyxDQUFDLEtBQUsxTSxTQUFTLEVBQUV5TSxhQUFhLENBQUNOLG9CQUFvQixDQUFDaEUsVUFBVSxDQUFDdUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQzFILElBQUl2RSxVQUFVLENBQUNtRixvQkFBb0IsQ0FBQyxDQUFDLEtBQUt0TixTQUFTLEVBQUV5TSxhQUFhLENBQUNMLG9CQUFvQixDQUFDakUsVUFBVSxDQUFDbUYsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1VBQzVIO1FBQ0Y7TUFDRjtJQUNGOztJQUVBO0lBQ0EsSUFBSXRGLGFBQWEsR0FBRyxJQUFJLENBQUN0SSxZQUFZLENBQUN3RyxVQUFVLENBQUM7SUFDakQsSUFBSSxDQUFDOEIsYUFBYSxFQUFFO01BQ2xCQSxhQUFhLEdBQUcsQ0FBQyxDQUFDO01BQ2xCLElBQUksQ0FBQ3RJLFlBQVksQ0FBQ3dHLFVBQVUsQ0FBQyxHQUFHOEIsYUFBYTtJQUMvQztJQUNBLEtBQUssSUFBSUcsVUFBVSxJQUFJaUYsWUFBWSxFQUFFO01BQ25DcEYsYUFBYSxDQUFDRyxVQUFVLENBQUM0RCxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUc1RCxVQUFVLENBQUNKLFVBQVUsQ0FBQyxDQUFDO0lBQ2hFOztJQUVBO0lBQ0EsT0FBT3FGLFlBQVk7RUFDckI7O0VBRUEsTUFBTUcsYUFBYUEsQ0FBQ3JILFVBQWtCLEVBQUVDLGFBQXFCLEVBQUVzRixZQUFzQixFQUE2QjtJQUNoSCxJQUFBckYsZUFBTSxFQUFDRixVQUFVLElBQUksQ0FBQyxDQUFDO0lBQ3ZCLElBQUFFLGVBQU0sRUFBQ0QsYUFBYSxJQUFJLENBQUMsQ0FBQztJQUMxQixPQUFPLENBQUMsTUFBTSxJQUFJLENBQUM4QixlQUFlLENBQUMvQixVQUFVLEVBQUUsQ0FBQ0MsYUFBYSxDQUFDLEVBQUVzRixZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDbkY7O0VBRUEsTUFBTStCLGdCQUFnQkEsQ0FBQ3RILFVBQWtCLEVBQUU0RyxLQUFjLEVBQTZCOztJQUVwRjtJQUNBLElBQUkvRixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsZ0JBQWdCLEVBQUUsRUFBQzJGLGFBQWEsRUFBRVgsVUFBVSxFQUFFNEcsS0FBSyxFQUFFQSxLQUFLLEVBQUMsQ0FBQzs7SUFFckg7SUFDQSxJQUFJM0UsVUFBVSxHQUFHLElBQUlDLHlCQUFnQixDQUFDLENBQUM7SUFDdkNELFVBQVUsQ0FBQ0UsZUFBZSxDQUFDbkMsVUFBVSxDQUFDO0lBQ3RDaUMsVUFBVSxDQUFDSyxRQUFRLENBQUN6QixJQUFJLENBQUNDLE1BQU0sQ0FBQ2tHLGFBQWEsQ0FBQztJQUM5Qy9FLFVBQVUsQ0FBQ3NGLFVBQVUsQ0FBQzFHLElBQUksQ0FBQ0MsTUFBTSxDQUFDdkQsT0FBTyxDQUFDO0lBQzFDMEUsVUFBVSxDQUFDdUYsUUFBUSxDQUFDWixLQUFLLEdBQUdBLEtBQUssR0FBRzlNLFNBQVMsQ0FBQztJQUM5Q21JLFVBQVUsQ0FBQzhELFVBQVUsQ0FBQzFGLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoQzRCLFVBQVUsQ0FBQytELGtCQUFrQixDQUFDM0YsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hDNEIsVUFBVSxDQUFDZ0Usb0JBQW9CLENBQUMsQ0FBQyxDQUFDO0lBQ2xDaEUsVUFBVSxDQUFDd0YsU0FBUyxDQUFDLEtBQUssQ0FBQztJQUMzQnhGLFVBQVUsQ0FBQ2lFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztJQUNsQyxPQUFPakUsVUFBVTtFQUNuQjs7RUFFQSxNQUFNeUYsa0JBQWtCQSxDQUFDMUgsVUFBa0IsRUFBRUMsYUFBcUIsRUFBRTJHLEtBQWEsRUFBaUI7SUFDaEcsTUFBTSxJQUFJLENBQUNyTixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsZUFBZSxFQUFFLEVBQUNvSCxLQUFLLEVBQUUsRUFBQ0MsS0FBSyxFQUFFckMsVUFBVSxFQUFFdUMsS0FBSyxFQUFFdEMsYUFBYSxFQUFDLEVBQUUyRyxLQUFLLEVBQUVBLEtBQUssRUFBQyxDQUFDO0VBQ2xJOztFQUVBLE1BQU1lLE1BQU1BLENBQUNDLEtBQXlDLEVBQTZCOztJQUVqRjtJQUNBLE1BQU1DLGVBQWUsR0FBR3pPLHFCQUFZLENBQUMwTyxnQkFBZ0IsQ0FBQ0YsS0FBSyxDQUFDOztJQUU1RDtJQUNBLElBQUlHLGFBQWEsR0FBR0YsZUFBZSxDQUFDRyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3RELElBQUlDLFVBQVUsR0FBR0osZUFBZSxDQUFDSyxhQUFhLENBQUMsQ0FBQztJQUNoRCxJQUFJQyxXQUFXLEdBQUdOLGVBQWUsQ0FBQ08sY0FBYyxDQUFDLENBQUM7SUFDbERQLGVBQWUsQ0FBQ1EsZ0JBQWdCLENBQUN2TyxTQUFTLENBQUM7SUFDM0MrTixlQUFlLENBQUNTLGFBQWEsQ0FBQ3hPLFNBQVMsQ0FBQztJQUN4QytOLGVBQWUsQ0FBQ1UsY0FBYyxDQUFDek8sU0FBUyxDQUFDOztJQUV6QztJQUNBLElBQUkwTyxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUNDLGVBQWUsQ0FBQyxJQUFJQyw0QkFBbUIsQ0FBQyxDQUFDLENBQUNDLFVBQVUsQ0FBQ3hQLGVBQWUsQ0FBQ3lQLGVBQWUsQ0FBQ2YsZUFBZSxDQUFDZ0IsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0lBRXpJO0lBQ0EsSUFBSUMsR0FBRyxHQUFHLEVBQUU7SUFDWixJQUFJQyxNQUFNLEdBQUcsSUFBSUMsR0FBRyxDQUFDLENBQUM7SUFDdEIsS0FBSyxJQUFJQyxRQUFRLElBQUlULFNBQVMsRUFBRTtNQUM5QixJQUFJLENBQUNPLE1BQU0sQ0FBQ3pRLEdBQUcsQ0FBQzJRLFFBQVEsQ0FBQ0MsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQ2pDSixHQUFHLENBQUNoRCxJQUFJLENBQUNtRCxRQUFRLENBQUNDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDMUJILE1BQU0sQ0FBQ0ksR0FBRyxDQUFDRixRQUFRLENBQUNDLEtBQUssQ0FBQyxDQUFDLENBQUM7TUFDOUI7SUFDRjs7SUFFQTtJQUNBLElBQUlFLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDZCxJQUFJQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLEtBQUssSUFBSUMsRUFBRSxJQUFJUixHQUFHLEVBQUU7TUFDbEIzUCxlQUFlLENBQUNvUSxPQUFPLENBQUNELEVBQUUsRUFBRUYsS0FBSyxFQUFFQyxRQUFRLENBQUM7SUFDOUM7O0lBRUE7SUFDQSxJQUFJeEIsZUFBZSxDQUFDMkIsaUJBQWlCLENBQUMsQ0FBQyxJQUFJckIsV0FBVyxFQUFFOztNQUV0RDtNQUNBLElBQUlzQixjQUFjLEdBQUcsQ0FBQ3RCLFdBQVcsR0FBR0EsV0FBVyxDQUFDVSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUlhLDBCQUFpQixDQUFDLENBQUMsRUFBRWYsVUFBVSxDQUFDeFAsZUFBZSxDQUFDeVAsZUFBZSxDQUFDZixlQUFlLENBQUNnQixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDckosSUFBSWMsT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDQyxhQUFhLENBQUNILGNBQWMsQ0FBQzs7TUFFdEQ7TUFDQSxJQUFJSSxTQUFTLEdBQUcsRUFBRTtNQUNsQixLQUFLLElBQUlDLE1BQU0sSUFBSUgsT0FBTyxFQUFFO1FBQzFCLElBQUksQ0FBQ0UsU0FBUyxDQUFDaE0sUUFBUSxDQUFDaU0sTUFBTSxDQUFDWixLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7VUFDdkMvUCxlQUFlLENBQUNvUSxPQUFPLENBQUNPLE1BQU0sQ0FBQ1osS0FBSyxDQUFDLENBQUMsRUFBRUUsS0FBSyxFQUFFQyxRQUFRLENBQUM7VUFDeERRLFNBQVMsQ0FBQy9ELElBQUksQ0FBQ2dFLE1BQU0sQ0FBQ1osS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNoQztNQUNGO0lBQ0Y7O0lBRUE7SUFDQXJCLGVBQWUsQ0FBQ1EsZ0JBQWdCLENBQUNOLGFBQWEsQ0FBQztJQUMvQ0YsZUFBZSxDQUFDUyxhQUFhLENBQUNMLFVBQVUsQ0FBQztJQUN6Q0osZUFBZSxDQUFDVSxjQUFjLENBQUNKLFdBQVcsQ0FBQzs7SUFFM0M7SUFDQSxJQUFJNEIsVUFBVSxHQUFHLEVBQUU7SUFDbkIsS0FBSyxJQUFJVCxFQUFFLElBQUlSLEdBQUcsRUFBRTtNQUNsQixJQUFJakIsZUFBZSxDQUFDbUMsYUFBYSxDQUFDVixFQUFFLENBQUMsRUFBRVMsVUFBVSxDQUFDakUsSUFBSSxDQUFDd0QsRUFBRSxDQUFDLENBQUM7TUFDdEQsSUFBSUEsRUFBRSxDQUFDVyxRQUFRLENBQUMsQ0FBQyxLQUFLblEsU0FBUyxFQUFFd1AsRUFBRSxDQUFDVyxRQUFRLENBQUMsQ0FBQyxDQUFDdEMsTUFBTSxDQUFDLENBQUMsQ0FBQ3VDLE1BQU0sQ0FBQ1osRUFBRSxDQUFDVyxRQUFRLENBQUMsQ0FBQyxDQUFDdEMsTUFBTSxDQUFDLENBQUMsQ0FBQ3RHLE9BQU8sQ0FBQ2lJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM1RztJQUNBUixHQUFHLEdBQUdpQixVQUFVOztJQUVoQjtJQUNBLEtBQUssSUFBSVQsRUFBRSxJQUFJUixHQUFHLEVBQUU7TUFDbEIsSUFBSVEsRUFBRSxDQUFDYSxjQUFjLENBQUMsQ0FBQyxJQUFJYixFQUFFLENBQUNXLFFBQVEsQ0FBQyxDQUFDLEtBQUtuUSxTQUFTLElBQUksQ0FBQ3dQLEVBQUUsQ0FBQ2EsY0FBYyxDQUFDLENBQUMsSUFBSWIsRUFBRSxDQUFDVyxRQUFRLENBQUMsQ0FBQyxLQUFLblEsU0FBUyxFQUFFO1FBQzdHc1EsT0FBTyxDQUFDQyxLQUFLLENBQUMsOEVBQThFLENBQUM7UUFDN0YsT0FBTyxJQUFJLENBQUMxQyxNQUFNLENBQUNFLGVBQWUsQ0FBQztNQUNyQztJQUNGOztJQUVBO0lBQ0EsSUFBSUEsZUFBZSxDQUFDeUMsU0FBUyxDQUFDLENBQUMsSUFBSXpDLGVBQWUsQ0FBQ3lDLFNBQVMsQ0FBQyxDQUFDLENBQUNyRixNQUFNLEdBQUcsQ0FBQyxFQUFFO01BQ3pFLElBQUlzRixPQUFPLEdBQUcsSUFBSUMsR0FBRyxDQUFDLENBQUMsRUFBRTtNQUN6QixLQUFLLElBQUlsQixFQUFFLElBQUlSLEdBQUcsRUFBRXlCLE9BQU8sQ0FBQ3JSLEdBQUcsQ0FBQ29RLEVBQUUsQ0FBQ21CLE9BQU8sQ0FBQyxDQUFDLEVBQUVuQixFQUFFLENBQUM7TUFDakQsSUFBSW9CLFVBQVUsR0FBRyxFQUFFO01BQ25CLEtBQUssSUFBSUMsSUFBSSxJQUFJOUMsZUFBZSxDQUFDeUMsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJQyxPQUFPLENBQUNoUyxHQUFHLENBQUNvUyxJQUFJLENBQUMsRUFBRUQsVUFBVSxDQUFDNUUsSUFBSSxDQUFDeUUsT0FBTyxDQUFDaFMsR0FBRyxDQUFDb1MsSUFBSSxDQUFDLENBQUM7TUFDdkc3QixHQUFHLEdBQUc0QixVQUFVO0lBQ2xCO0lBQ0EsT0FBTzVCLEdBQUc7RUFDWjs7RUFFQSxNQUFNOEIsWUFBWUEsQ0FBQ2hELEtBQW9DLEVBQTZCOztJQUVsRjtJQUNBLE1BQU1DLGVBQWUsR0FBR3pPLHFCQUFZLENBQUN5UixzQkFBc0IsQ0FBQ2pELEtBQUssQ0FBQzs7SUFFbEU7SUFDQSxJQUFJLENBQUN6TyxlQUFlLENBQUMyUixZQUFZLENBQUNqRCxlQUFlLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ1ksZUFBZSxDQUFDWixlQUFlLENBQUM7O0lBRWhHO0lBQ0EsSUFBSVcsU0FBUyxHQUFHLEVBQUU7SUFDbEIsS0FBSyxJQUFJYyxFQUFFLElBQUksTUFBTSxJQUFJLENBQUMzQixNQUFNLENBQUNFLGVBQWUsQ0FBQ2tELFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUM5RCxLQUFLLElBQUk5QixRQUFRLElBQUlLLEVBQUUsQ0FBQzBCLGVBQWUsQ0FBQ25ELGVBQWUsQ0FBQyxFQUFFO1FBQ3hEVyxTQUFTLENBQUMxQyxJQUFJLENBQUNtRCxRQUFRLENBQUM7TUFDMUI7SUFDRjs7SUFFQSxPQUFPVCxTQUFTO0VBQ2xCOztFQUVBLE1BQU15QyxVQUFVQSxDQUFDckQsS0FBa0MsRUFBaUM7O0lBRWxGO0lBQ0EsTUFBTUMsZUFBZSxHQUFHek8scUJBQVksQ0FBQzhSLG9CQUFvQixDQUFDdEQsS0FBSyxDQUFDOztJQUVoRTtJQUNBLElBQUksQ0FBQ3pPLGVBQWUsQ0FBQzJSLFlBQVksQ0FBQ2pELGVBQWUsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDK0IsYUFBYSxDQUFDL0IsZUFBZSxDQUFDOztJQUU5RjtJQUNBLElBQUk4QixPQUFPLEdBQUcsRUFBRTtJQUNoQixLQUFLLElBQUlMLEVBQUUsSUFBSSxNQUFNLElBQUksQ0FBQzNCLE1BQU0sQ0FBQ0UsZUFBZSxDQUFDa0QsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFO01BQzlELEtBQUssSUFBSWpCLE1BQU0sSUFBSVIsRUFBRSxDQUFDNkIsYUFBYSxDQUFDdEQsZUFBZSxDQUFDLEVBQUU7UUFDcEQ4QixPQUFPLENBQUM3RCxJQUFJLENBQUNnRSxNQUFNLENBQUM7TUFDdEI7SUFDRjs7SUFFQSxPQUFPSCxPQUFPO0VBQ2hCOztFQUVBLE1BQU15QixhQUFhQSxDQUFDQyxHQUFHLEdBQUcsS0FBSyxFQUFtQjtJQUNoRCxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUM5UixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsZ0JBQWdCLEVBQUUsRUFBQ3FRLEdBQUcsRUFBRUEsR0FBRyxFQUFDLENBQUMsRUFBRXZLLE1BQU0sQ0FBQ3dLLGdCQUFnQjtFQUM5Rzs7RUFFQSxNQUFNQyxhQUFhQSxDQUFDQyxVQUFrQixFQUFtQjtJQUN2RCxJQUFJM0ssSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGdCQUFnQixFQUFFLEVBQUNzUSxnQkFBZ0IsRUFBRUUsVUFBVSxFQUFDLENBQUM7SUFDMUcsT0FBTzNLLElBQUksQ0FBQ0MsTUFBTSxDQUFDMkssWUFBWTtFQUNqQzs7RUFFQSxNQUFNQyxlQUFlQSxDQUFDTCxHQUFHLEdBQUcsS0FBSyxFQUE2QjtJQUM1RCxPQUFPLE1BQU0sSUFBSSxDQUFDTSxrQkFBa0IsQ0FBQ04sR0FBRyxDQUFDO0VBQzNDOztFQUVBLE1BQU1PLGVBQWVBLENBQUNDLFNBQTJCLEVBQXVDOztJQUV0RjtJQUNBLElBQUlDLFlBQVksR0FBR0QsU0FBUyxDQUFDRSxHQUFHLENBQUMsQ0FBQUMsUUFBUSxNQUFLLEVBQUNDLFNBQVMsRUFBRUQsUUFBUSxDQUFDRSxNQUFNLENBQUMsQ0FBQyxFQUFFQyxTQUFTLEVBQUVILFFBQVEsQ0FBQ0ksWUFBWSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7O0lBRWxIO0lBQ0EsSUFBSXZMLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRSxFQUFDcVIsaUJBQWlCLEVBQUVQLFlBQVksRUFBQyxDQUFDOztJQUVoSDtJQUNBLElBQUlRLFlBQVksR0FBRyxJQUFJQyxtQ0FBMEIsQ0FBQyxDQUFDO0lBQ25ERCxZQUFZLENBQUNFLFNBQVMsQ0FBQzNMLElBQUksQ0FBQ0MsTUFBTSxDQUFDd0MsTUFBTSxDQUFDO0lBQzFDZ0osWUFBWSxDQUFDRyxjQUFjLENBQUNwTSxNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDNEwsS0FBSyxDQUFDLENBQUM7SUFDdERKLFlBQVksQ0FBQ0ssZ0JBQWdCLENBQUN0TSxNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDOEwsT0FBTyxDQUFDLENBQUM7SUFDMUQsT0FBT04sWUFBWTtFQUNyQjs7RUFFQSxNQUFNTyw2QkFBNkJBLENBQUEsRUFBOEI7SUFDL0QsT0FBTyxNQUFNLElBQUksQ0FBQ2xCLGtCQUFrQixDQUFDLEtBQUssQ0FBQztFQUM3Qzs7RUFFQSxNQUFNbUIsWUFBWUEsQ0FBQ2QsUUFBZ0IsRUFBaUI7SUFDbEQsT0FBTyxJQUFJLENBQUN6UyxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsUUFBUSxFQUFFLEVBQUNpUixTQUFTLEVBQUVELFFBQVEsRUFBQyxDQUFDO0VBQ2pGOztFQUVBLE1BQU1lLFVBQVVBLENBQUNmLFFBQWdCLEVBQWlCO0lBQ2hELE9BQU8sSUFBSSxDQUFDelMsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLE1BQU0sRUFBRSxFQUFDaVIsU0FBUyxFQUFFRCxRQUFRLEVBQUMsQ0FBQztFQUMvRTs7RUFFQSxNQUFNZ0IsY0FBY0EsQ0FBQ2hCLFFBQWdCLEVBQW9CO0lBQ3ZELElBQUluTCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsUUFBUSxFQUFFLEVBQUNpUixTQUFTLEVBQUVELFFBQVEsRUFBQyxDQUFDO0lBQ3pGLE9BQU9uTCxJQUFJLENBQUNDLE1BQU0sQ0FBQ21NLE1BQU0sS0FBSyxJQUFJO0VBQ3BDOztFQUVBLE1BQU1DLHFCQUFxQkEsQ0FBQSxFQUE4QjtJQUN2RCxJQUFJck0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLDBCQUEwQixDQUFDO0lBQ3BGLE9BQU82RixJQUFJLENBQUNDLE1BQU0sQ0FBQ3FNLFFBQVE7RUFDN0I7O0VBRUEsTUFBTUMsU0FBU0EsQ0FBQzdULE1BQStCLEVBQTZCOztJQUUxRTtJQUNBLE1BQU1pQyxnQkFBZ0IsR0FBR3BDLHFCQUFZLENBQUNpVSx3QkFBd0IsQ0FBQzlULE1BQU0sQ0FBQztJQUN0RSxJQUFJaUMsZ0JBQWdCLENBQUM4UixXQUFXLENBQUMsQ0FBQyxLQUFLeFQsU0FBUyxFQUFFMEIsZ0JBQWdCLENBQUMrUixXQUFXLENBQUMsSUFBSSxDQUFDO0lBQ3BGLElBQUkvUixnQkFBZ0IsQ0FBQ2dTLFFBQVEsQ0FBQyxDQUFDLEtBQUssSUFBSSxLQUFJLE1BQU0sSUFBSSxDQUFDQyxVQUFVLENBQUMsQ0FBQyxHQUFFLE1BQU0sSUFBSTFULG9CQUFXLENBQUMsbURBQW1ELENBQUM7O0lBRS9JO0lBQ0EsSUFBSWlHLFVBQVUsR0FBR3hFLGdCQUFnQixDQUFDOEssZUFBZSxDQUFDLENBQUM7SUFDbkQsSUFBSXRHLFVBQVUsS0FBS2xHLFNBQVMsRUFBRSxNQUFNLElBQUlDLG9CQUFXLENBQUMsNkNBQTZDLENBQUM7SUFDbEcsSUFBSWdOLGlCQUFpQixHQUFHdkwsZ0JBQWdCLENBQUNrUyxvQkFBb0IsQ0FBQyxDQUFDLEtBQUs1VCxTQUFTLEdBQUdBLFNBQVMsR0FBRzBCLGdCQUFnQixDQUFDa1Msb0JBQW9CLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7SUFFOUk7SUFDQSxJQUFJL1EsTUFBVyxHQUFHLENBQUMsQ0FBQztJQUNwQkEsTUFBTSxDQUFDZ1IsWUFBWSxHQUFHLEVBQUU7SUFDeEIsS0FBSyxJQUFJQyxXQUFXLElBQUlyUyxnQkFBZ0IsQ0FBQ3NTLGVBQWUsQ0FBQyxDQUFDLEVBQUU7TUFDMUQsSUFBQTVOLGVBQU0sRUFBQzJOLFdBQVcsQ0FBQ2hNLFVBQVUsQ0FBQyxDQUFDLEVBQUUsb0NBQW9DLENBQUM7TUFDdEUsSUFBQTNCLGVBQU0sRUFBQzJOLFdBQVcsQ0FBQ0UsU0FBUyxDQUFDLENBQUMsRUFBRSxtQ0FBbUMsQ0FBQztNQUNwRW5SLE1BQU0sQ0FBQ2dSLFlBQVksQ0FBQzlILElBQUksQ0FBQyxFQUFFdkksT0FBTyxFQUFFc1EsV0FBVyxDQUFDaE0sVUFBVSxDQUFDLENBQUMsRUFBRW1NLE1BQU0sRUFBRUgsV0FBVyxDQUFDRSxTQUFTLENBQUMsQ0FBQyxDQUFDRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3RztJQUNBLElBQUl6UyxnQkFBZ0IsQ0FBQzBTLGtCQUFrQixDQUFDLENBQUMsRUFBRXRSLE1BQU0sQ0FBQ3VSLHlCQUF5QixHQUFHM1MsZ0JBQWdCLENBQUMwUyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ25IdFIsTUFBTSxDQUFDK0QsYUFBYSxHQUFHWCxVQUFVO0lBQ2pDcEQsTUFBTSxDQUFDd1IsZUFBZSxHQUFHckgsaUJBQWlCO0lBQzFDbkssTUFBTSxDQUFDaUcsVUFBVSxHQUFHckgsZ0JBQWdCLENBQUM2UyxZQUFZLENBQUMsQ0FBQztJQUNuRHpSLE1BQU0sQ0FBQzBSLFlBQVksR0FBRzlTLGdCQUFnQixDQUFDZ1MsUUFBUSxDQUFDLENBQUMsS0FBSyxJQUFJO0lBQzFELElBQUF0TixlQUFNLEVBQUMxRSxnQkFBZ0IsQ0FBQytTLFdBQVcsQ0FBQyxDQUFDLEtBQUt6VSxTQUFTLElBQUkwQixnQkFBZ0IsQ0FBQytTLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJL1MsZ0JBQWdCLENBQUMrUyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsSTNSLE1BQU0sQ0FBQ3VRLFFBQVEsR0FBRzNSLGdCQUFnQixDQUFDK1MsV0FBVyxDQUFDLENBQUM7SUFDaEQzUixNQUFNLENBQUM0UixVQUFVLEdBQUcsSUFBSTtJQUN4QjVSLE1BQU0sQ0FBQzZSLGVBQWUsR0FBRyxJQUFJO0lBQzdCLElBQUlqVCxnQkFBZ0IsQ0FBQzhSLFdBQVcsQ0FBQyxDQUFDLEVBQUUxUSxNQUFNLENBQUM4UixXQUFXLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFBQSxLQUMxRDlSLE1BQU0sQ0FBQytSLFVBQVUsR0FBRyxJQUFJOztJQUU3QjtJQUNBLElBQUluVCxnQkFBZ0IsQ0FBQzhSLFdBQVcsQ0FBQyxDQUFDLElBQUk5UixnQkFBZ0IsQ0FBQzBTLGtCQUFrQixDQUFDLENBQUMsSUFBSTFTLGdCQUFnQixDQUFDMFMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDakosTUFBTSxHQUFHLENBQUMsRUFBRTtNQUMvSCxNQUFNLElBQUlsTCxvQkFBVyxDQUFDLDBFQUEwRSxDQUFDO0lBQ25HOztJQUVBO0lBQ0EsSUFBSStHLE1BQU07SUFDVixJQUFJO01BQ0YsSUFBSUQsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDUSxnQkFBZ0IsQ0FBQzhSLFdBQVcsQ0FBQyxDQUFDLEdBQUcsZ0JBQWdCLEdBQUcsVUFBVSxFQUFFMVEsTUFBTSxDQUFDO01BQ2hJa0UsTUFBTSxHQUFHRCxJQUFJLENBQUNDLE1BQU07SUFDdEIsQ0FBQyxDQUFDLE9BQU9oRSxHQUFRLEVBQUU7TUFDakIsSUFBSUEsR0FBRyxDQUFDYSxPQUFPLENBQUMwRCxPQUFPLENBQUMscUNBQXFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUl0SCxvQkFBVyxDQUFDLDZCQUE2QixDQUFDO01BQ3pILE1BQU0rQyxHQUFHO0lBQ1g7O0lBRUE7SUFDQSxJQUFJZ00sR0FBRztJQUNQLElBQUk4RixNQUFNLEdBQUdwVCxnQkFBZ0IsQ0FBQzhSLFdBQVcsQ0FBQyxDQUFDLEdBQUl4TSxNQUFNLENBQUMrTixRQUFRLEtBQUsvVSxTQUFTLEdBQUdnSCxNQUFNLENBQUMrTixRQUFRLENBQUM1SixNQUFNLEdBQUcsQ0FBQyxHQUFLbkUsTUFBTSxDQUFDZ08sR0FBRyxLQUFLaFYsU0FBUyxHQUFHLENBQUMsR0FBRyxDQUFFO0lBQy9JLElBQUk4VSxNQUFNLEdBQUcsQ0FBQyxFQUFFOUYsR0FBRyxHQUFHLEVBQUU7SUFDeEIsSUFBSWlHLGdCQUFnQixHQUFHSCxNQUFNLEtBQUssQ0FBQztJQUNuQyxLQUFLLElBQUlJLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR0osTUFBTSxFQUFFSSxDQUFDLEVBQUUsRUFBRTtNQUMvQixJQUFJMUYsRUFBRSxHQUFHLElBQUkyRix1QkFBYyxDQUFDLENBQUM7TUFDN0I5VixlQUFlLENBQUMrVixnQkFBZ0IsQ0FBQzFULGdCQUFnQixFQUFFOE4sRUFBRSxFQUFFeUYsZ0JBQWdCLENBQUM7TUFDeEV6RixFQUFFLENBQUM2RixtQkFBbUIsQ0FBQyxDQUFDLENBQUNoTixlQUFlLENBQUNuQyxVQUFVLENBQUM7TUFDcEQsSUFBSStHLGlCQUFpQixLQUFLak4sU0FBUyxJQUFJaU4saUJBQWlCLENBQUM5QixNQUFNLEtBQUssQ0FBQyxFQUFFcUUsRUFBRSxDQUFDNkYsbUJBQW1CLENBQUMsQ0FBQyxDQUFDQyxvQkFBb0IsQ0FBQ3JJLGlCQUFpQixDQUFDO01BQ3ZJK0IsR0FBRyxDQUFDaEQsSUFBSSxDQUFDd0QsRUFBRSxDQUFDO0lBQ2Q7O0lBRUE7SUFDQSxJQUFJOU4sZ0JBQWdCLENBQUNnUyxRQUFRLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSSxDQUFDdkosSUFBSSxDQUFDLENBQUM7O0lBRWxEO0lBQ0EsSUFBSXpJLGdCQUFnQixDQUFDOFIsV0FBVyxDQUFDLENBQUMsRUFBRSxPQUFPblUsZUFBZSxDQUFDa1csd0JBQXdCLENBQUN2TyxNQUFNLEVBQUVnSSxHQUFHLEVBQUV0TixnQkFBZ0IsQ0FBQyxDQUFDbU0sTUFBTSxDQUFDLENBQUMsQ0FBQztJQUN2SCxPQUFPeE8sZUFBZSxDQUFDbVcsbUJBQW1CLENBQUN4TyxNQUFNLEVBQUVnSSxHQUFHLEtBQUtoUCxTQUFTLEdBQUdBLFNBQVMsR0FBR2dQLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUV0TixnQkFBZ0IsQ0FBQyxDQUFDbU0sTUFBTSxDQUFDLENBQUM7RUFDbEk7O0VBRUEsTUFBTTRILFdBQVdBLENBQUNoVyxNQUErQixFQUEyQjs7SUFFMUU7SUFDQUEsTUFBTSxHQUFHSCxxQkFBWSxDQUFDb1csMEJBQTBCLENBQUNqVyxNQUFNLENBQUM7O0lBRXhEO0lBQ0EsSUFBSXFELE1BQVcsR0FBRyxDQUFDLENBQUM7SUFDcEJBLE1BQU0sQ0FBQ1csT0FBTyxHQUFHaEUsTUFBTSxDQUFDdVUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ2pNLFVBQVUsQ0FBQyxDQUFDO0lBQ3pEakYsTUFBTSxDQUFDK0QsYUFBYSxHQUFHcEgsTUFBTSxDQUFDK00sZUFBZSxDQUFDLENBQUM7SUFDL0MxSixNQUFNLENBQUN3UixlQUFlLEdBQUc3VSxNQUFNLENBQUNtVSxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3REOVEsTUFBTSxDQUFDcVAsU0FBUyxHQUFHMVMsTUFBTSxDQUFDa1csV0FBVyxDQUFDLENBQUM7SUFDdkM3UyxNQUFNLENBQUMwUixZQUFZLEdBQUcvVSxNQUFNLENBQUNpVSxRQUFRLENBQUMsQ0FBQyxLQUFLLElBQUk7SUFDaEQsSUFBQXROLGVBQU0sRUFBQzNHLE1BQU0sQ0FBQ2dWLFdBQVcsQ0FBQyxDQUFDLEtBQUt6VSxTQUFTLElBQUlQLE1BQU0sQ0FBQ2dWLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJaFYsTUFBTSxDQUFDZ1YsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEczUixNQUFNLENBQUN1USxRQUFRLEdBQUc1VCxNQUFNLENBQUNnVixXQUFXLENBQUMsQ0FBQztJQUN0QzNSLE1BQU0sQ0FBQ2lHLFVBQVUsR0FBR3RKLE1BQU0sQ0FBQzhVLFlBQVksQ0FBQyxDQUFDO0lBQ3pDelIsTUFBTSxDQUFDK1IsVUFBVSxHQUFHLElBQUk7SUFDeEIvUixNQUFNLENBQUM0UixVQUFVLEdBQUcsSUFBSTtJQUN4QjVSLE1BQU0sQ0FBQzZSLGVBQWUsR0FBRyxJQUFJOztJQUU3QjtJQUNBLElBQUk1TixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsY0FBYyxFQUFFNEIsTUFBTSxDQUFDO0lBQ2hGLElBQUlrRSxNQUFNLEdBQUdELElBQUksQ0FBQ0MsTUFBTTs7SUFFeEI7SUFDQSxJQUFJdkgsTUFBTSxDQUFDaVUsUUFBUSxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUksQ0FBQ3ZKLElBQUksQ0FBQyxDQUFDOztJQUV4QztJQUNBLElBQUlxRixFQUFFLEdBQUduUSxlQUFlLENBQUMrVixnQkFBZ0IsQ0FBQzNWLE1BQU0sRUFBRU8sU0FBUyxFQUFFLElBQUksQ0FBQztJQUNsRVgsZUFBZSxDQUFDbVcsbUJBQW1CLENBQUN4TyxNQUFNLEVBQUV3SSxFQUFFLEVBQUUsSUFBSSxFQUFFL1AsTUFBTSxDQUFDO0lBQzdEK1AsRUFBRSxDQUFDNkYsbUJBQW1CLENBQUMsQ0FBQyxDQUFDckIsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzRCLFNBQVMsQ0FBQ3BHLEVBQUUsQ0FBQzZGLG1CQUFtQixDQUFDLENBQUMsQ0FBQ3BCLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQy9GLE9BQU96RSxFQUFFO0VBQ1g7O0VBRUEsTUFBTXFHLGFBQWFBLENBQUNwVyxNQUErQixFQUE2Qjs7SUFFOUU7SUFDQSxNQUFNaUMsZ0JBQWdCLEdBQUdwQyxxQkFBWSxDQUFDd1csNEJBQTRCLENBQUNyVyxNQUFNLENBQUM7O0lBRTFFO0lBQ0EsSUFBSXNXLE9BQU8sR0FBRyxJQUFJckYsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFFO0lBQzFCLElBQUloUCxnQkFBZ0IsQ0FBQzhLLGVBQWUsQ0FBQyxDQUFDLEtBQUt4TSxTQUFTLEVBQUU7TUFDcEQsSUFBSTBCLGdCQUFnQixDQUFDa1Msb0JBQW9CLENBQUMsQ0FBQyxLQUFLNVQsU0FBUyxFQUFFO1FBQ3pEK1YsT0FBTyxDQUFDM1csR0FBRyxDQUFDc0MsZ0JBQWdCLENBQUM4SyxlQUFlLENBQUMsQ0FBQyxFQUFFOUssZ0JBQWdCLENBQUNrUyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7TUFDMUYsQ0FBQyxNQUFNO1FBQ0wsSUFBSTNHLGlCQUFpQixHQUFHLEVBQUU7UUFDMUI4SSxPQUFPLENBQUMzVyxHQUFHLENBQUNzQyxnQkFBZ0IsQ0FBQzhLLGVBQWUsQ0FBQyxDQUFDLEVBQUVTLGlCQUFpQixDQUFDO1FBQ2xFLEtBQUssSUFBSTlFLFVBQVUsSUFBSSxNQUFNLElBQUksQ0FBQ0YsZUFBZSxDQUFDdkcsZ0JBQWdCLENBQUM4SyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUU7VUFDckYsSUFBSXJFLFVBQVUsQ0FBQ3ZCLGtCQUFrQixDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUVxRyxpQkFBaUIsQ0FBQ2pCLElBQUksQ0FBQzdELFVBQVUsQ0FBQzRELFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDekY7TUFDRjtJQUNGLENBQUMsTUFBTTtNQUNMLElBQUlMLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQ2hGLFdBQVcsQ0FBQyxJQUFJLENBQUM7TUFDM0MsS0FBSyxJQUFJRCxPQUFPLElBQUlpRixRQUFRLEVBQUU7UUFDNUIsSUFBSWpGLE9BQU8sQ0FBQ0csa0JBQWtCLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtVQUNyQyxJQUFJcUcsaUJBQWlCLEdBQUcsRUFBRTtVQUMxQjhJLE9BQU8sQ0FBQzNXLEdBQUcsQ0FBQ3FILE9BQU8sQ0FBQ3NGLFFBQVEsQ0FBQyxDQUFDLEVBQUVrQixpQkFBaUIsQ0FBQztVQUNsRCxLQUFLLElBQUk5RSxVQUFVLElBQUkxQixPQUFPLENBQUN3QixlQUFlLENBQUMsQ0FBQyxFQUFFO1lBQ2hELElBQUlFLFVBQVUsQ0FBQ3ZCLGtCQUFrQixDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUVxRyxpQkFBaUIsQ0FBQ2pCLElBQUksQ0FBQzdELFVBQVUsQ0FBQzRELFFBQVEsQ0FBQyxDQUFDLENBQUM7VUFDekY7UUFDRjtNQUNGO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJaUQsR0FBRyxHQUFHLEVBQUU7SUFDWixLQUFLLElBQUk5SSxVQUFVLElBQUk2UCxPQUFPLENBQUNDLElBQUksQ0FBQyxDQUFDLEVBQUU7O01BRXJDO01BQ0EsSUFBSWpILElBQUksR0FBR3JOLGdCQUFnQixDQUFDcU4sSUFBSSxDQUFDLENBQUM7TUFDbENBLElBQUksQ0FBQzFHLGVBQWUsQ0FBQ25DLFVBQVUsQ0FBQztNQUNoQzZJLElBQUksQ0FBQ2tILHNCQUFzQixDQUFDLEtBQUssQ0FBQzs7TUFFbEM7TUFDQSxJQUFJbEgsSUFBSSxDQUFDbUgsc0JBQXNCLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUMxQ25ILElBQUksQ0FBQ3VHLG9CQUFvQixDQUFDUyxPQUFPLENBQUN0WCxHQUFHLENBQUN5SCxVQUFVLENBQUMsQ0FBQztRQUNsRCxLQUFLLElBQUlzSixFQUFFLElBQUksTUFBTSxJQUFJLENBQUMyRyxlQUFlLENBQUNwSCxJQUFJLENBQUMsRUFBRUMsR0FBRyxDQUFDaEQsSUFBSSxDQUFDd0QsRUFBRSxDQUFDO01BQy9EOztNQUVBO01BQUEsS0FDSztRQUNILEtBQUssSUFBSXJKLGFBQWEsSUFBSTRQLE9BQU8sQ0FBQ3RYLEdBQUcsQ0FBQ3lILFVBQVUsQ0FBQyxFQUFFO1VBQ2pENkksSUFBSSxDQUFDdUcsb0JBQW9CLENBQUMsQ0FBQ25QLGFBQWEsQ0FBQyxDQUFDO1VBQzFDLEtBQUssSUFBSXFKLEVBQUUsSUFBSSxNQUFNLElBQUksQ0FBQzJHLGVBQWUsQ0FBQ3BILElBQUksQ0FBQyxFQUFFQyxHQUFHLENBQUNoRCxJQUFJLENBQUN3RCxFQUFFLENBQUM7UUFDL0Q7TUFDRjtJQUNGOztJQUVBO0lBQ0EsSUFBSTlOLGdCQUFnQixDQUFDZ1MsUUFBUSxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUksQ0FBQ3ZKLElBQUksQ0FBQyxDQUFDO0lBQ2xELE9BQU82RSxHQUFHO0VBQ1o7O0VBRUEsTUFBTW9ILFNBQVNBLENBQUNDLEtBQWUsRUFBNkI7SUFDMUQsSUFBSUEsS0FBSyxLQUFLclcsU0FBUyxFQUFFcVcsS0FBSyxHQUFHLEtBQUs7SUFDdEMsSUFBSXRQLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxZQUFZLEVBQUUsRUFBQ3NULFlBQVksRUFBRSxDQUFDNkIsS0FBSyxFQUFDLENBQUM7SUFDOUYsSUFBSUEsS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFDbE0sSUFBSSxDQUFDLENBQUM7SUFDNUIsSUFBSW5ELE1BQU0sR0FBR0QsSUFBSSxDQUFDQyxNQUFNO0lBQ3hCLElBQUlzUCxLQUFLLEdBQUdqWCxlQUFlLENBQUNrVyx3QkFBd0IsQ0FBQ3ZPLE1BQU0sQ0FBQztJQUM1RCxJQUFJc1AsS0FBSyxDQUFDekksTUFBTSxDQUFDLENBQUMsS0FBSzdOLFNBQVMsRUFBRSxPQUFPLEVBQUU7SUFDM0MsS0FBSyxJQUFJd1AsRUFBRSxJQUFJOEcsS0FBSyxDQUFDekksTUFBTSxDQUFDLENBQUMsRUFBRTtNQUM3QjJCLEVBQUUsQ0FBQytHLFlBQVksQ0FBQyxDQUFDRixLQUFLLENBQUM7TUFDdkI3RyxFQUFFLENBQUNnSCxXQUFXLENBQUNoSCxFQUFFLENBQUNpSCxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQ25DO0lBQ0EsT0FBT0gsS0FBSyxDQUFDekksTUFBTSxDQUFDLENBQUM7RUFDdkI7O0VBRUEsTUFBTTZJLFFBQVFBLENBQUNDLGNBQTJDLEVBQXFCO0lBQzdFLElBQUF2USxlQUFNLEVBQUN3USxLQUFLLENBQUNDLE9BQU8sQ0FBQ0YsY0FBYyxDQUFDLEVBQUUseURBQXlELENBQUM7SUFDaEcsSUFBSXpMLFFBQVEsR0FBRyxFQUFFO0lBQ2pCLEtBQUssSUFBSTRMLFlBQVksSUFBSUgsY0FBYyxFQUFFO01BQ3ZDLElBQUlJLFFBQVEsR0FBR0QsWUFBWSxZQUFZM0IsdUJBQWMsR0FBRzJCLFlBQVksQ0FBQ0UsV0FBVyxDQUFDLENBQUMsR0FBR0YsWUFBWTtNQUNqRyxJQUFJL1AsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLFVBQVUsRUFBRSxFQUFFK1YsR0FBRyxFQUFFRixRQUFRLENBQUMsQ0FBQyxDQUFDO01BQ3ZGN0wsUUFBUSxDQUFDYyxJQUFJLENBQUNqRixJQUFJLENBQUNDLE1BQU0sQ0FBQ2tRLE9BQU8sQ0FBQztJQUNwQztJQUNBLE1BQU0sSUFBSSxDQUFDL00sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25CLE9BQU9lLFFBQVE7RUFDakI7O0VBRUEsTUFBTWlNLGFBQWFBLENBQUNiLEtBQWtCLEVBQXdCO0lBQzVELElBQUl2UCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsbUJBQW1CLEVBQUU7TUFDNUVrVyxjQUFjLEVBQUVkLEtBQUssQ0FBQ2UsZ0JBQWdCLENBQUMsQ0FBQztNQUN4Q0MsY0FBYyxFQUFFaEIsS0FBSyxDQUFDaUIsZ0JBQWdCLENBQUM7SUFDekMsQ0FBQyxDQUFDO0lBQ0YsT0FBT2xZLGVBQWUsQ0FBQ21ZLDBCQUEwQixDQUFDelEsSUFBSSxDQUFDQyxNQUFNLENBQUM7RUFDaEU7O0VBRUEsTUFBTXlRLE9BQU9BLENBQUNDLGFBQXFCLEVBQXdCO0lBQ3pELElBQUkzUSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsZUFBZSxFQUFFO01BQ3hFa1csY0FBYyxFQUFFTSxhQUFhO01BQzdCQyxVQUFVLEVBQUU7SUFDZCxDQUFDLENBQUM7SUFDRixNQUFNLElBQUksQ0FBQ3hOLElBQUksQ0FBQyxDQUFDO0lBQ2pCLE9BQU85SyxlQUFlLENBQUNrVyx3QkFBd0IsQ0FBQ3hPLElBQUksQ0FBQ0MsTUFBTSxDQUFDO0VBQzlEOztFQUVBLE1BQU00USxTQUFTQSxDQUFDQyxXQUFtQixFQUFxQjtJQUN0RCxJQUFJOVEsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGlCQUFpQixFQUFFO01BQzFFNFcsV0FBVyxFQUFFRDtJQUNmLENBQUMsQ0FBQztJQUNGLE1BQU0sSUFBSSxDQUFDMU4sSUFBSSxDQUFDLENBQUM7SUFDakIsT0FBT3BELElBQUksQ0FBQ0MsTUFBTSxDQUFDK1EsWUFBWTtFQUNqQzs7RUFFQSxNQUFNQyxXQUFXQSxDQUFDblUsT0FBZSxFQUFFb1UsYUFBYSxHQUFHQyxtQ0FBMEIsQ0FBQ0MsbUJBQW1CLEVBQUVqUyxVQUFVLEdBQUcsQ0FBQyxFQUFFQyxhQUFhLEdBQUcsQ0FBQyxFQUFtQjtJQUNySixJQUFJWSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsTUFBTSxFQUFFO01BQzdEa1gsSUFBSSxFQUFFdlUsT0FBTztNQUNid1UsY0FBYyxFQUFFSixhQUFhLEtBQUtDLG1DQUEwQixDQUFDQyxtQkFBbUIsR0FBRyxPQUFPLEdBQUcsTUFBTTtNQUNuR3RSLGFBQWEsRUFBRVgsVUFBVTtNQUN6QmdILGFBQWEsRUFBRS9HO0lBQ25CLENBQUMsQ0FBQztJQUNGLE9BQU9ZLElBQUksQ0FBQ0MsTUFBTSxDQUFDcUwsU0FBUztFQUM5Qjs7RUFFQSxNQUFNaUcsYUFBYUEsQ0FBQ3pVLE9BQWUsRUFBRUosT0FBZSxFQUFFNE8sU0FBaUIsRUFBeUM7SUFDOUcsSUFBSTtNQUNGLElBQUl0TCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsUUFBUSxFQUFFLEVBQUNrWCxJQUFJLEVBQUV2VSxPQUFPLEVBQUVKLE9BQU8sRUFBRUEsT0FBTyxFQUFFNE8sU0FBUyxFQUFFQSxTQUFTLEVBQUMsQ0FBQztNQUMzSCxJQUFJckwsTUFBTSxHQUFHRCxJQUFJLENBQUNDLE1BQU07TUFDeEIsT0FBTyxJQUFJdVIscUNBQTRCO1FBQ3JDdlIsTUFBTSxDQUFDd1IsSUFBSSxHQUFHLEVBQUNDLE1BQU0sRUFBRXpSLE1BQU0sQ0FBQ3dSLElBQUksRUFBRUUsS0FBSyxFQUFFMVIsTUFBTSxDQUFDMlIsR0FBRyxFQUFFVixhQUFhLEVBQUVqUixNQUFNLENBQUNxUixjQUFjLEtBQUssTUFBTSxHQUFHSCxtQ0FBMEIsQ0FBQ1Usa0JBQWtCLEdBQUdWLG1DQUEwQixDQUFDQyxtQkFBbUIsRUFBRXpRLE9BQU8sRUFBRVYsTUFBTSxDQUFDVSxPQUFPLEVBQUMsR0FBRyxFQUFDK1EsTUFBTSxFQUFFLEtBQUs7TUFDcFAsQ0FBQztJQUNILENBQUMsQ0FBQyxPQUFPblUsQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSXNVLHFDQUE0QixDQUFDLEVBQUNFLE1BQU0sRUFBRSxLQUFLLEVBQUMsQ0FBQztNQUNoRixNQUFNblUsQ0FBQztJQUNUO0VBQ0Y7O0VBRUEsTUFBTXVVLFFBQVFBLENBQUNDLE1BQWMsRUFBbUI7SUFDOUMsSUFBSTtNQUNGLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQ3JaLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxZQUFZLEVBQUUsRUFBQzZYLElBQUksRUFBRUQsTUFBTSxFQUFDLENBQUMsRUFBRTlSLE1BQU0sQ0FBQ2dTLE1BQU07SUFDcEcsQ0FBQyxDQUFDLE9BQU8xVSxDQUFNLEVBQUU7TUFDZixJQUFJQSxDQUFDLFlBQVlOLHVCQUFjLElBQUlNLENBQUMsQ0FBQ0wsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSUssQ0FBQyxDQUFDVCxPQUFPLENBQUNFLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFTyxDQUFDLEdBQUcsSUFBSU4sdUJBQWMsQ0FBQyw0QkFBNEIsRUFBRU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxFQUFFSyxDQUFDLENBQUNKLFlBQVksQ0FBQyxDQUFDLEVBQUVJLENBQUMsQ0FBQ0gsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUU7TUFDak4sTUFBTUcsQ0FBQztJQUNUO0VBQ0Y7O0VBRUEsTUFBTTJVLFVBQVVBLENBQUNILE1BQWMsRUFBRUksS0FBYSxFQUFFelYsT0FBZSxFQUEwQjtJQUN2RixJQUFJOztNQUVGO01BQ0EsSUFBSXNELElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxjQUFjLEVBQUUsRUFBQzZYLElBQUksRUFBRUQsTUFBTSxFQUFFRSxNQUFNLEVBQUVFLEtBQUssRUFBRXpWLE9BQU8sRUFBRUEsT0FBTyxFQUFDLENBQUM7O01BRXpIO01BQ0EsSUFBSTBWLEtBQUssR0FBRyxJQUFJQyxzQkFBYSxDQUFDLENBQUM7TUFDL0JELEtBQUssQ0FBQ0UsU0FBUyxDQUFDLElBQUksQ0FBQztNQUNyQkYsS0FBSyxDQUFDRyxtQkFBbUIsQ0FBQ3ZTLElBQUksQ0FBQ0MsTUFBTSxDQUFDdVMsYUFBYSxDQUFDO01BQ3BESixLQUFLLENBQUMzQyxXQUFXLENBQUN6UCxJQUFJLENBQUNDLE1BQU0sQ0FBQ3dTLE9BQU8sQ0FBQztNQUN0Q0wsS0FBSyxDQUFDTSxpQkFBaUIsQ0FBQ2xULE1BQU0sQ0FBQ1EsSUFBSSxDQUFDQyxNQUFNLENBQUMwUyxRQUFRLENBQUMsQ0FBQztNQUNyRCxPQUFPUCxLQUFLO0lBQ2QsQ0FBQyxDQUFDLE9BQU83VSxDQUFNLEVBQUU7TUFDZixJQUFJQSxDQUFDLFlBQVlOLHVCQUFjLElBQUlNLENBQUMsQ0FBQ0wsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSUssQ0FBQyxDQUFDVCxPQUFPLENBQUNFLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFTyxDQUFDLEdBQUcsSUFBSU4sdUJBQWMsQ0FBQyw0QkFBNEIsRUFBRU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxFQUFFSyxDQUFDLENBQUNKLFlBQVksQ0FBQyxDQUFDLEVBQUVJLENBQUMsQ0FBQ0gsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUU7TUFDak4sTUFBTUcsQ0FBQztJQUNUO0VBQ0Y7O0VBRUEsTUFBTXFWLFVBQVVBLENBQUNiLE1BQWMsRUFBRXJWLE9BQWUsRUFBRUksT0FBZ0IsRUFBbUI7SUFDbkYsSUFBSTtNQUNGLElBQUlrRCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsY0FBYyxFQUFFLEVBQUM2WCxJQUFJLEVBQUVELE1BQU0sRUFBRXJWLE9BQU8sRUFBRUEsT0FBTyxFQUFFSSxPQUFPLEVBQUVBLE9BQU8sRUFBQyxDQUFDO01BQzVILE9BQU9rRCxJQUFJLENBQUNDLE1BQU0sQ0FBQ3FMLFNBQVM7SUFDOUIsQ0FBQyxDQUFDLE9BQU8vTixDQUFNLEVBQUU7TUFDZixJQUFJQSxDQUFDLFlBQVlOLHVCQUFjLElBQUlNLENBQUMsQ0FBQ0wsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSUssQ0FBQyxDQUFDVCxPQUFPLENBQUNFLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFTyxDQUFDLEdBQUcsSUFBSU4sdUJBQWMsQ0FBQyw0QkFBNEIsRUFBRU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxFQUFFSyxDQUFDLENBQUNKLFlBQVksQ0FBQyxDQUFDLEVBQUVJLENBQUMsQ0FBQ0gsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUU7TUFDak4sTUFBTUcsQ0FBQztJQUNUO0VBQ0Y7O0VBRUEsTUFBTXNWLFlBQVlBLENBQUNkLE1BQWMsRUFBRXJWLE9BQWUsRUFBRUksT0FBMkIsRUFBRXdPLFNBQWlCLEVBQTBCO0lBQzFILElBQUk7O01BRUY7TUFDQSxJQUFJdEwsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGdCQUFnQixFQUFFO1FBQ3pFNlgsSUFBSSxFQUFFRCxNQUFNO1FBQ1pyVixPQUFPLEVBQUVBLE9BQU87UUFDaEJJLE9BQU8sRUFBRUEsT0FBTztRQUNoQndPLFNBQVMsRUFBRUE7TUFDYixDQUFDLENBQUM7O01BRUY7TUFDQSxJQUFJb0csTUFBTSxHQUFHMVIsSUFBSSxDQUFDQyxNQUFNLENBQUN3UixJQUFJO01BQzdCLElBQUlXLEtBQUssR0FBRyxJQUFJQyxzQkFBYSxDQUFDLENBQUM7TUFDL0JELEtBQUssQ0FBQ0UsU0FBUyxDQUFDWixNQUFNLENBQUM7TUFDdkIsSUFBSUEsTUFBTSxFQUFFO1FBQ1ZVLEtBQUssQ0FBQ0csbUJBQW1CLENBQUN2UyxJQUFJLENBQUNDLE1BQU0sQ0FBQ3VTLGFBQWEsQ0FBQztRQUNwREosS0FBSyxDQUFDM0MsV0FBVyxDQUFDelAsSUFBSSxDQUFDQyxNQUFNLENBQUN3UyxPQUFPLENBQUM7UUFDdENMLEtBQUssQ0FBQ00saUJBQWlCLENBQUNsVCxNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDMFMsUUFBUSxDQUFDLENBQUM7TUFDdkQ7TUFDQSxPQUFPUCxLQUFLO0lBQ2QsQ0FBQyxDQUFDLE9BQU83VSxDQUFNLEVBQUU7TUFDZixJQUFJQSxDQUFDLFlBQVlOLHVCQUFjLElBQUlNLENBQUMsQ0FBQ0wsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSUssQ0FBQyxDQUFDVCxPQUFPLEtBQUssY0FBYyxFQUFFUyxDQUFDLEdBQUcsSUFBSU4sdUJBQWMsQ0FBQywwQ0FBMEMsRUFBRSxDQUFDLENBQUMsQ0FBQztNQUM3SixJQUFJTSxDQUFDLFlBQVlOLHVCQUFjLElBQUlNLENBQUMsQ0FBQ0wsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSUssQ0FBQyxDQUFDVCxPQUFPLENBQUNFLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFTyxDQUFDLEdBQUcsSUFBSU4sdUJBQWMsQ0FBQyw0QkFBNEIsRUFBRU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxFQUFFSyxDQUFDLENBQUNKLFlBQVksQ0FBQyxDQUFDLEVBQUVJLENBQUMsQ0FBQ0gsWUFBWSxDQUFDLENBQUMsQ0FBQztNQUM5TSxNQUFNRyxDQUFDO0lBQ1Q7RUFDRjs7RUFFQSxNQUFNdVYsYUFBYUEsQ0FBQ2YsTUFBYyxFQUFFalYsT0FBZ0IsRUFBbUI7SUFDckUsSUFBSTtNQUNGLElBQUlrRCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsaUJBQWlCLEVBQUUsRUFBQzZYLElBQUksRUFBRUQsTUFBTSxFQUFFalYsT0FBTyxFQUFFQSxPQUFPLEVBQUMsQ0FBQztNQUM3RyxPQUFPa0QsSUFBSSxDQUFDQyxNQUFNLENBQUNxTCxTQUFTO0lBQzlCLENBQUMsQ0FBQyxPQUFPL04sQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxZQUFZTix1QkFBYyxJQUFJTSxDQUFDLENBQUNMLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUlLLENBQUMsQ0FBQ1QsT0FBTyxDQUFDRSxRQUFRLENBQUMsMEJBQTBCLENBQUMsRUFBRU8sQ0FBQyxHQUFHLElBQUlOLHVCQUFjLENBQUMsNEJBQTRCLEVBQUVNLENBQUMsQ0FBQ0wsT0FBTyxDQUFDLENBQUMsRUFBRUssQ0FBQyxDQUFDSixZQUFZLENBQUMsQ0FBQyxFQUFFSSxDQUFDLENBQUNILFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFO01BQ2pOLE1BQU1HLENBQUM7SUFDVDtFQUNGOztFQUVBLE1BQU13VixlQUFlQSxDQUFDaEIsTUFBYyxFQUFFalYsT0FBMkIsRUFBRXdPLFNBQWlCLEVBQW9CO0lBQ3RHLElBQUk7TUFDRixJQUFJdEwsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLG1CQUFtQixFQUFFO1FBQzVFNlgsSUFBSSxFQUFFRCxNQUFNO1FBQ1pqVixPQUFPLEVBQUVBLE9BQU87UUFDaEJ3TyxTQUFTLEVBQUVBO01BQ2IsQ0FBQyxDQUFDO01BQ0YsT0FBT3RMLElBQUksQ0FBQ0MsTUFBTSxDQUFDd1IsSUFBSTtJQUN6QixDQUFDLENBQUMsT0FBT2xVLENBQU0sRUFBRTtNQUNmLElBQUlBLENBQUMsWUFBWU4sdUJBQWMsSUFBSU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJSyxDQUFDLENBQUNULE9BQU8sQ0FBQ0UsUUFBUSxDQUFDLDBCQUEwQixDQUFDLEVBQUVPLENBQUMsR0FBRyxJQUFJTix1QkFBYyxDQUFDLDRCQUE0QixFQUFFTSxDQUFDLENBQUNMLE9BQU8sQ0FBQyxDQUFDLEVBQUVLLENBQUMsQ0FBQ0osWUFBWSxDQUFDLENBQUMsRUFBRUksQ0FBQyxDQUFDSCxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtNQUNqTixNQUFNRyxDQUFDO0lBQ1Q7RUFDRjs7RUFFQSxNQUFNeVYscUJBQXFCQSxDQUFDbFcsT0FBZ0IsRUFBbUI7SUFDN0QsSUFBSWtELElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRTtNQUM1RXFRLEdBQUcsRUFBRSxJQUFJO01BQ1QxTixPQUFPLEVBQUVBO0lBQ1gsQ0FBQyxDQUFDO0lBQ0YsT0FBT2tELElBQUksQ0FBQ0MsTUFBTSxDQUFDcUwsU0FBUztFQUM5Qjs7RUFFQSxNQUFNMkgsc0JBQXNCQSxDQUFDOVQsVUFBa0IsRUFBRWdPLE1BQWMsRUFBRXJRLE9BQWdCLEVBQW1CO0lBQ2xHLElBQUlrRCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsbUJBQW1CLEVBQUU7TUFDNUUyRixhQUFhLEVBQUVYLFVBQVU7TUFDekJnTyxNQUFNLEVBQUVBLE1BQU0sQ0FBQ0MsUUFBUSxDQUFDLENBQUM7TUFDekJ0USxPQUFPLEVBQUVBO0lBQ1gsQ0FBQyxDQUFDO0lBQ0YsT0FBT2tELElBQUksQ0FBQ0MsTUFBTSxDQUFDcUwsU0FBUztFQUM5Qjs7RUFFQSxNQUFNL0ssaUJBQWlCQSxDQUFDN0QsT0FBZSxFQUFFSSxPQUEyQixFQUFFd08sU0FBaUIsRUFBK0I7O0lBRXBIO0lBQ0EsSUFBSXRMLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxxQkFBcUIsRUFBRTtNQUM5RXVDLE9BQU8sRUFBRUEsT0FBTztNQUNoQkksT0FBTyxFQUFFQSxPQUFPO01BQ2hCd08sU0FBUyxFQUFFQTtJQUNiLENBQUMsQ0FBQzs7SUFFRjtJQUNBLElBQUlvRyxNQUFNLEdBQUcxUixJQUFJLENBQUNDLE1BQU0sQ0FBQ3dSLElBQUk7SUFDN0IsSUFBSVcsS0FBSyxHQUFHLElBQUljLDJCQUFrQixDQUFDLENBQUM7SUFDcENkLEtBQUssQ0FBQ0UsU0FBUyxDQUFDWixNQUFNLENBQUM7SUFDdkIsSUFBSUEsTUFBTSxFQUFFO01BQ1ZVLEtBQUssQ0FBQ2UseUJBQXlCLENBQUMzVCxNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDNEwsS0FBSyxDQUFDLENBQUM7TUFDMUR1RyxLQUFLLENBQUNnQixjQUFjLENBQUM1VCxNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDb1QsS0FBSyxDQUFDLENBQUM7SUFDakQ7SUFDQSxPQUFPakIsS0FBSztFQUNkOztFQUVBLE1BQU1rQixVQUFVQSxDQUFDblAsUUFBa0IsRUFBcUI7SUFDdEQsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDekwsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGNBQWMsRUFBRSxFQUFDa0ssS0FBSyxFQUFFRixRQUFRLEVBQUMsQ0FBQyxFQUFFbEUsTUFBTSxDQUFDc1QsS0FBSztFQUN4Rzs7RUFFQSxNQUFNQyxVQUFVQSxDQUFDclAsUUFBa0IsRUFBRW9QLEtBQWUsRUFBaUI7SUFDbkUsTUFBTSxJQUFJLENBQUM3YSxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsY0FBYyxFQUFFLEVBQUNrSyxLQUFLLEVBQUVGLFFBQVEsRUFBRW9QLEtBQUssRUFBRUEsS0FBSyxFQUFDLENBQUM7RUFDaEc7O0VBRUEsTUFBTUUscUJBQXFCQSxDQUFDQyxZQUF1QixFQUFxQztJQUN0RixJQUFJMVQsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGtCQUFrQixFQUFFLEVBQUN3WixPQUFPLEVBQUVELFlBQVksRUFBQyxDQUFDO0lBQ3JHLElBQUksQ0FBQzFULElBQUksQ0FBQ0MsTUFBTSxDQUFDMFQsT0FBTyxFQUFFLE9BQU8sRUFBRTtJQUNuQyxJQUFJQSxPQUFPLEdBQUcsRUFBRTtJQUNoQixLQUFLLElBQUlDLFFBQVEsSUFBSTVULElBQUksQ0FBQ0MsTUFBTSxDQUFDMFQsT0FBTyxFQUFFO01BQ3hDQSxPQUFPLENBQUMxTyxJQUFJLENBQUMsSUFBSTRPLCtCQUFzQixDQUFDLENBQUMsQ0FBQ3BTLFFBQVEsQ0FBQ21TLFFBQVEsQ0FBQ3JTLEtBQUssQ0FBQyxDQUFDbUYsVUFBVSxDQUFDa04sUUFBUSxDQUFDbFgsT0FBTyxDQUFDLENBQUNvWCxjQUFjLENBQUNGLFFBQVEsQ0FBQ0csV0FBVyxDQUFDLENBQUN6UixZQUFZLENBQUNzUixRQUFRLENBQUM1UixVQUFVLENBQUMsQ0FBQztJQUN6SztJQUNBLE9BQU8yUixPQUFPO0VBQ2hCOztFQUVBLE1BQU1LLG1CQUFtQkEsQ0FBQ3RYLE9BQWUsRUFBRXFYLFdBQW9CLEVBQW1CO0lBQ2hGLElBQUkvVCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsa0JBQWtCLEVBQUUsRUFBQ3VDLE9BQU8sRUFBRUEsT0FBTyxFQUFFcVgsV0FBVyxFQUFFQSxXQUFXLEVBQUMsQ0FBQztJQUMxSCxPQUFPL1QsSUFBSSxDQUFDQyxNQUFNLENBQUNzQixLQUFLO0VBQzFCOztFQUVBLE1BQU0wUyxvQkFBb0JBLENBQUMxUyxLQUFhLEVBQUVtRixVQUFtQixFQUFFaEssT0FBMkIsRUFBRW9YLGNBQXVCLEVBQUVDLFdBQStCLEVBQWlCO0lBQ25LLElBQUkvVCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsbUJBQW1CLEVBQUU7TUFDNUVvSCxLQUFLLEVBQUVBLEtBQUs7TUFDWjJTLFdBQVcsRUFBRXhOLFVBQVU7TUFDdkJoSyxPQUFPLEVBQUVBLE9BQU87TUFDaEJ5WCxlQUFlLEVBQUVMLGNBQWM7TUFDL0JDLFdBQVcsRUFBRUE7SUFDZixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNSyxzQkFBc0JBLENBQUNDLFFBQWdCLEVBQWlCO0lBQzVELE1BQU0sSUFBSSxDQUFDM2IsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLHFCQUFxQixFQUFFLEVBQUNvSCxLQUFLLEVBQUU4UyxRQUFRLEVBQUMsQ0FBQztFQUN6Rjs7RUFFQSxNQUFNQyxXQUFXQSxDQUFDN1AsR0FBRyxFQUFFOFAsY0FBYyxFQUFFO0lBQ3JDLE1BQU0sSUFBSSxDQUFDN2IsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGNBQWMsRUFBRSxFQUFDc0ssR0FBRyxFQUFFQSxHQUFHLEVBQUVFLFFBQVEsRUFBRTRQLGNBQWMsRUFBQyxDQUFDO0VBQ3JHOztFQUVBLE1BQU1DLGFBQWFBLENBQUNELGNBQXdCLEVBQWlCO0lBQzNELE1BQU0sSUFBSSxDQUFDN2IsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGdCQUFnQixFQUFFLEVBQUN3SyxRQUFRLEVBQUU0UCxjQUFjLEVBQUMsQ0FBQztFQUM3Rjs7RUFFQSxNQUFNRSxjQUFjQSxDQUFBLEVBQWdDO0lBQ2xELElBQUlDLElBQUksR0FBRyxFQUFFO0lBQ2IsSUFBSTFVLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQztJQUM1RSxJQUFJNkYsSUFBSSxDQUFDQyxNQUFNLENBQUMwVSxZQUFZLEVBQUU7TUFDNUIsS0FBSyxJQUFJQyxhQUFhLElBQUk1VSxJQUFJLENBQUNDLE1BQU0sQ0FBQzBVLFlBQVksRUFBRTtRQUNsREQsSUFBSSxDQUFDelAsSUFBSSxDQUFDLElBQUk0UCx5QkFBZ0IsQ0FBQztVQUM3QnBRLEdBQUcsRUFBRW1RLGFBQWEsQ0FBQ25RLEdBQUcsR0FBR21RLGFBQWEsQ0FBQ25RLEdBQUcsR0FBR3hMLFNBQVM7VUFDdEQ4TSxLQUFLLEVBQUU2TyxhQUFhLENBQUM3TyxLQUFLLEdBQUc2TyxhQUFhLENBQUM3TyxLQUFLLEdBQUc5TSxTQUFTO1VBQzVEc2IsY0FBYyxFQUFFSyxhQUFhLENBQUNqUTtRQUNoQyxDQUFDLENBQUMsQ0FBQztNQUNMO0lBQ0Y7SUFDQSxPQUFPK1AsSUFBSTtFQUNiOztFQUVBLE1BQU1JLGtCQUFrQkEsQ0FBQ3JRLEdBQVcsRUFBRXNCLEtBQWEsRUFBaUI7SUFDbEUsTUFBTSxJQUFJLENBQUNyTixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsNkJBQTZCLEVBQUUsRUFBQ3NLLEdBQUcsRUFBRUEsR0FBRyxFQUFFc1AsV0FBVyxFQUFFaE8sS0FBSyxFQUFDLENBQUM7RUFDOUc7O0VBRUEsTUFBTWdQLGFBQWFBLENBQUNyYyxNQUFzQixFQUFtQjtJQUMzREEsTUFBTSxHQUFHSCxxQkFBWSxDQUFDaVUsd0JBQXdCLENBQUM5VCxNQUFNLENBQUM7SUFDdEQsSUFBSXNILElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxVQUFVLEVBQUU7TUFDbkV1QyxPQUFPLEVBQUVoRSxNQUFNLENBQUN1VSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDak0sVUFBVSxDQUFDLENBQUM7TUFDakRtTSxNQUFNLEVBQUV6VSxNQUFNLENBQUN1VSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDQyxTQUFTLENBQUMsQ0FBQyxHQUFHeFUsTUFBTSxDQUFDdVUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ0MsU0FBUyxDQUFDLENBQUMsQ0FBQ0UsUUFBUSxDQUFDLENBQUMsR0FBR25VLFNBQVM7TUFDaEgrSSxVQUFVLEVBQUV0SixNQUFNLENBQUM4VSxZQUFZLENBQUMsQ0FBQztNQUNqQ3dILGNBQWMsRUFBRXRjLE1BQU0sQ0FBQ3VjLGdCQUFnQixDQUFDLENBQUM7TUFDekNDLGNBQWMsRUFBRXhjLE1BQU0sQ0FBQ3ljLE9BQU8sQ0FBQztJQUNqQyxDQUFDLENBQUM7SUFDRixPQUFPblYsSUFBSSxDQUFDQyxNQUFNLENBQUNtVixHQUFHO0VBQ3hCOztFQUVBLE1BQU1DLGVBQWVBLENBQUNELEdBQVcsRUFBMkI7SUFDMUQsSUFBQS9WLGVBQU0sRUFBQytWLEdBQUcsRUFBRSwyQkFBMkIsQ0FBQztJQUN4QyxJQUFJcFYsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFDaWIsR0FBRyxFQUFFQSxHQUFHLEVBQUMsQ0FBQztJQUNqRixJQUFJMWMsTUFBTSxHQUFHLElBQUk0Yyx1QkFBYyxDQUFDLEVBQUM1WSxPQUFPLEVBQUVzRCxJQUFJLENBQUNDLE1BQU0sQ0FBQ21WLEdBQUcsQ0FBQzFZLE9BQU8sRUFBRXlRLE1BQU0sRUFBRTNOLE1BQU0sQ0FBQ1EsSUFBSSxDQUFDQyxNQUFNLENBQUNtVixHQUFHLENBQUNqSSxNQUFNLENBQUMsRUFBQyxDQUFDO0lBQzNHelUsTUFBTSxDQUFDNEosWUFBWSxDQUFDdEMsSUFBSSxDQUFDQyxNQUFNLENBQUNtVixHQUFHLENBQUNwVCxVQUFVLENBQUM7SUFDL0N0SixNQUFNLENBQUM2YyxnQkFBZ0IsQ0FBQ3ZWLElBQUksQ0FBQ0MsTUFBTSxDQUFDbVYsR0FBRyxDQUFDSixjQUFjLENBQUM7SUFDdkR0YyxNQUFNLENBQUM4YyxPQUFPLENBQUN4VixJQUFJLENBQUNDLE1BQU0sQ0FBQ21WLEdBQUcsQ0FBQ0YsY0FBYyxDQUFDO0lBQzlDLElBQUksRUFBRSxLQUFLeGMsTUFBTSxDQUFDdVUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ2pNLFVBQVUsQ0FBQyxDQUFDLEVBQUV0SSxNQUFNLENBQUN1VSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDdkcsVUFBVSxDQUFDek4sU0FBUyxDQUFDO0lBQ3RHLElBQUksRUFBRSxLQUFLUCxNQUFNLENBQUM4VSxZQUFZLENBQUMsQ0FBQyxFQUFFOVUsTUFBTSxDQUFDNEosWUFBWSxDQUFDckosU0FBUyxDQUFDO0lBQ2hFLElBQUksRUFBRSxLQUFLUCxNQUFNLENBQUN1YyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUV2YyxNQUFNLENBQUM2YyxnQkFBZ0IsQ0FBQ3RjLFNBQVMsQ0FBQztJQUN4RSxJQUFJLEVBQUUsS0FBS1AsTUFBTSxDQUFDeWMsT0FBTyxDQUFDLENBQUMsRUFBRXpjLE1BQU0sQ0FBQzhjLE9BQU8sQ0FBQ3ZjLFNBQVMsQ0FBQztJQUN0RCxPQUFPUCxNQUFNO0VBQ2Y7O0VBRUEsTUFBTStjLFlBQVlBLENBQUN6ZCxHQUFXLEVBQW1CO0lBQy9DLElBQUk7TUFDRixJQUFJZ0ksSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGVBQWUsRUFBRSxFQUFDbkMsR0FBRyxFQUFFQSxHQUFHLEVBQUMsQ0FBQztNQUNyRixPQUFPZ0ksSUFBSSxDQUFDQyxNQUFNLENBQUN5VixLQUFLLEtBQUssRUFBRSxHQUFHemMsU0FBUyxHQUFHK0csSUFBSSxDQUFDQyxNQUFNLENBQUN5VixLQUFLO0lBQ2pFLENBQUMsQ0FBQyxPQUFPblksQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxZQUFZTix1QkFBYyxJQUFJTSxDQUFDLENBQUNMLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsT0FBT2pFLFNBQVM7TUFDeEUsTUFBTXNFLENBQUM7SUFDVDtFQUNGOztFQUVBLE1BQU1vWSxZQUFZQSxDQUFDM2QsR0FBVyxFQUFFNGQsR0FBVyxFQUFpQjtJQUMxRCxNQUFNLElBQUksQ0FBQ2xkLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxlQUFlLEVBQUUsRUFBQ25DLEdBQUcsRUFBRUEsR0FBRyxFQUFFMGQsS0FBSyxFQUFFRSxHQUFHLEVBQUMsQ0FBQztFQUN4Rjs7RUFFQSxNQUFNQyxXQUFXQSxDQUFDQyxVQUFrQixFQUFFQyxnQkFBMEIsRUFBRUMsYUFBdUIsRUFBaUI7SUFDeEcsTUFBTSxJQUFJLENBQUN0ZCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsY0FBYyxFQUFFO01BQzVEOGIsYUFBYSxFQUFFSCxVQUFVO01BQ3pCSSxvQkFBb0IsRUFBRUgsZ0JBQWdCO01BQ3RDSSxjQUFjLEVBQUVIO0lBQ2xCLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1JLFVBQVVBLENBQUEsRUFBa0I7SUFDaEMsTUFBTSxJQUFJLENBQUMxZCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsYUFBYSxDQUFDO0VBQzlEOztFQUVBLE1BQU1rYyxzQkFBc0JBLENBQUEsRUFBcUI7SUFDL0MsSUFBSXJXLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxhQUFhLENBQUM7SUFDdkUsT0FBTzZGLElBQUksQ0FBQ0MsTUFBTSxDQUFDcVcsc0JBQXNCLEtBQUssSUFBSTtFQUNwRDs7RUFFQSxNQUFNQyxlQUFlQSxDQUFBLEVBQWdDO0lBQ25ELElBQUl2VyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsYUFBYSxDQUFDO0lBQ3ZFLElBQUk4RixNQUFNLEdBQUdELElBQUksQ0FBQ0MsTUFBTTtJQUN4QixJQUFJdVcsSUFBSSxHQUFHLElBQUlDLDJCQUFrQixDQUFDLENBQUM7SUFDbkNELElBQUksQ0FBQ0UsYUFBYSxDQUFDelcsTUFBTSxDQUFDMFcsUUFBUSxDQUFDO0lBQ25DSCxJQUFJLENBQUNJLFVBQVUsQ0FBQzNXLE1BQU0sQ0FBQzRXLEtBQUssQ0FBQztJQUM3QkwsSUFBSSxDQUFDTSxZQUFZLENBQUM3VyxNQUFNLENBQUM4VyxTQUFTLENBQUM7SUFDbkNQLElBQUksQ0FBQ1Esa0JBQWtCLENBQUMvVyxNQUFNLENBQUNvVCxLQUFLLENBQUM7SUFDckMsT0FBT21ELElBQUk7RUFDYjs7RUFFQSxNQUFNUyxlQUFlQSxDQUFBLEVBQW9CO0lBQ3ZDLElBQUlqWCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsa0JBQWtCLEVBQUUsRUFBQ2tDLDRCQUE0QixFQUFFLElBQUksRUFBQyxDQUFDO0lBQ2xILElBQUksQ0FBQzFELFlBQVksR0FBRyxDQUFDLENBQUM7SUFDdEIsSUFBSXNILE1BQU0sR0FBR0QsSUFBSSxDQUFDQyxNQUFNO0lBQ3hCLE9BQU9BLE1BQU0sQ0FBQ2lYLGFBQWE7RUFDN0I7O0VBRUEsTUFBTUMsWUFBWUEsQ0FBQ0MsYUFBdUIsRUFBRUwsU0FBaUIsRUFBRWpkLFFBQWdCLEVBQW1CO0lBQ2hHLElBQUlrRyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsZUFBZSxFQUFFO01BQ3hFK2MsYUFBYSxFQUFFRSxhQUFhO01BQzVCTCxTQUFTLEVBQUVBLFNBQVM7TUFDcEJqZCxRQUFRLEVBQUVBO0lBQ1osQ0FBQyxDQUFDO0lBQ0YsSUFBSSxDQUFDbkIsWUFBWSxHQUFHLENBQUMsQ0FBQztJQUN0QixPQUFPcUgsSUFBSSxDQUFDQyxNQUFNLENBQUNpWCxhQUFhO0VBQ2xDOztFQUVBLE1BQU1HLG9CQUFvQkEsQ0FBQ0QsYUFBdUIsRUFBRXRkLFFBQWdCLEVBQXFDO0lBQ3ZHLElBQUlrRyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsd0JBQXdCLEVBQUUsRUFBQytjLGFBQWEsRUFBRUUsYUFBYSxFQUFFdGQsUUFBUSxFQUFFQSxRQUFRLEVBQUMsQ0FBQztJQUN0SSxJQUFJLENBQUNuQixZQUFZLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLElBQUkyZSxRQUFRLEdBQUcsSUFBSUMsaUNBQXdCLENBQUMsQ0FBQztJQUM3Q0QsUUFBUSxDQUFDNVEsVUFBVSxDQUFDMUcsSUFBSSxDQUFDQyxNQUFNLENBQUN2RCxPQUFPLENBQUM7SUFDeEM0YSxRQUFRLENBQUNFLGNBQWMsQ0FBQ3hYLElBQUksQ0FBQ0MsTUFBTSxDQUFDaVgsYUFBYSxDQUFDO0lBQ2xELElBQUlJLFFBQVEsQ0FBQ3RXLFVBQVUsQ0FBQyxDQUFDLENBQUNvRCxNQUFNLEtBQUssQ0FBQyxFQUFFa1QsUUFBUSxDQUFDNVEsVUFBVSxDQUFDek4sU0FBUyxDQUFDO0lBQ3RFLElBQUlxZSxRQUFRLENBQUNHLGNBQWMsQ0FBQyxDQUFDLENBQUNyVCxNQUFNLEtBQUssQ0FBQyxFQUFFa1QsUUFBUSxDQUFDRSxjQUFjLENBQUN2ZSxTQUFTLENBQUM7SUFDOUUsT0FBT3FlLFFBQVE7RUFDakI7O0VBRUEsTUFBTUksaUJBQWlCQSxDQUFBLEVBQW9CO0lBQ3pDLElBQUkxWCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsc0JBQXNCLENBQUM7SUFDaEYsT0FBTzZGLElBQUksQ0FBQ0MsTUFBTSxDQUFDdVcsSUFBSTtFQUN6Qjs7RUFFQSxNQUFNbUIsaUJBQWlCQSxDQUFDUCxhQUF1QixFQUFFUSxrQkFBNEIsRUFBbUI7SUFDOUYsSUFBSUEsa0JBQWtCLEtBQUszZSxTQUFTLEVBQUUyZSxrQkFBa0IsR0FBRyxJQUFJO0lBQy9ELElBQUksQ0FBQ3hlLGlCQUFRLENBQUMwVyxPQUFPLENBQUNzSCxhQUFhLENBQUMsRUFBRSxNQUFNLElBQUlsZSxvQkFBVyxDQUFDLDhDQUE4QyxDQUFDO0lBQzNHLElBQUk4RyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsc0JBQXNCLEVBQUUsRUFBQ3FjLElBQUksRUFBRVksYUFBYSxFQUFFUyxvQkFBb0IsRUFBRUQsa0JBQWtCLEVBQUMsQ0FBQztJQUNqSixPQUFPNVgsSUFBSSxDQUFDQyxNQUFNLENBQUM2WCxTQUFTO0VBQzlCOztFQUVBLE1BQU1DLGlCQUFpQkEsQ0FBQ0MsYUFBcUIsRUFBcUM7SUFDaEYsSUFBSWhZLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxlQUFlLEVBQUUsRUFBQzRXLFdBQVcsRUFBRWlILGFBQWEsRUFBQyxDQUFDO0lBQ3ZHLElBQUkvWCxNQUFNLEdBQUdELElBQUksQ0FBQ0MsTUFBTTtJQUN4QixJQUFJZ1ksVUFBVSxHQUFHLElBQUlDLGlDQUF3QixDQUFDLENBQUM7SUFDL0NELFVBQVUsQ0FBQ0Usc0JBQXNCLENBQUNsWSxNQUFNLENBQUM4USxXQUFXLENBQUM7SUFDckRrSCxVQUFVLENBQUNHLFdBQVcsQ0FBQ25ZLE1BQU0sQ0FBQytRLFlBQVksQ0FBQztJQUMzQyxPQUFPaUgsVUFBVTtFQUNuQjs7RUFFQSxNQUFNSSxtQkFBbUJBLENBQUNDLG1CQUEyQixFQUFxQjtJQUN4RSxJQUFJdFksSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGlCQUFpQixFQUFFLEVBQUM0VyxXQUFXLEVBQUV1SCxtQkFBbUIsRUFBQyxDQUFDO0lBQy9HLE9BQU90WSxJQUFJLENBQUNDLE1BQU0sQ0FBQytRLFlBQVk7RUFDakM7O0VBRUEsTUFBTXVILGNBQWNBLENBQUNDLFdBQW1CLEVBQUVDLFdBQW1CLEVBQWlCO0lBQzVFLE9BQU8sSUFBSSxDQUFDL2YsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLHdCQUF3QixFQUFFLEVBQUN1ZSxZQUFZLEVBQUVGLFdBQVcsSUFBSSxFQUFFLEVBQUVHLFlBQVksRUFBRUYsV0FBVyxJQUFJLEVBQUUsRUFBQyxDQUFDO0VBQzlJOztFQUVBLE1BQU1HLElBQUlBLENBQUEsRUFBa0I7SUFDMUIsTUFBTSxJQUFJLENBQUNsZ0IsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLE9BQU8sQ0FBQztFQUN4RDs7RUFFQSxNQUFNMGUsS0FBS0EsQ0FBQ0QsSUFBSSxHQUFHLEtBQUssRUFBaUI7SUFDdkMsTUFBTSxLQUFLLENBQUNDLEtBQUssQ0FBQ0QsSUFBSSxDQUFDO0lBQ3ZCLElBQUlBLElBQUksS0FBSzNmLFNBQVMsRUFBRTJmLElBQUksR0FBRyxLQUFLO0lBQ3BDLE1BQU0sSUFBSSxDQUFDdGUsS0FBSyxDQUFDLENBQUM7SUFDbEIsTUFBTSxJQUFJLENBQUM1QixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsY0FBYyxFQUFFLEVBQUNxQyxnQkFBZ0IsRUFBRW9jLElBQUksRUFBQyxDQUFDO0VBQ3pGOztFQUVBLE1BQU1FLFFBQVFBLENBQUEsRUFBcUI7SUFDakMsSUFBSTtNQUNGLE1BQU0sSUFBSSxDQUFDamUsaUJBQWlCLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQUMsT0FBTzBDLENBQU0sRUFBRTtNQUNmLE9BQU9BLENBQUMsWUFBWU4sdUJBQWMsSUFBSU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJSyxDQUFDLENBQUNULE9BQU8sQ0FBQzBELE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2RztJQUNBLE9BQU8sS0FBSztFQUNkOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNdVksSUFBSUEsQ0FBQSxFQUFrQjtJQUMxQixNQUFNLElBQUksQ0FBQ3plLEtBQUssQ0FBQyxDQUFDO0lBQ2xCLE1BQU0sSUFBSSxDQUFDNUIsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLGFBQWEsQ0FBQztFQUM5RDs7RUFFQTs7RUFFQSxNQUFNb00sb0JBQW9CQSxDQUFBLEVBQWdDLENBQUUsT0FBTyxLQUFLLENBQUNBLG9CQUFvQixDQUFDLENBQUMsQ0FBRTtFQUNqRyxNQUFNOEIsS0FBS0EsQ0FBQzBKLE1BQWMsRUFBcUMsQ0FBRSxPQUFPLEtBQUssQ0FBQzFKLEtBQUssQ0FBQzBKLE1BQU0sQ0FBQyxDQUFFO0VBQzdGLE1BQU1pSCxvQkFBb0JBLENBQUNqUyxLQUFtQyxFQUFxQyxDQUFFLE9BQU8sS0FBSyxDQUFDaVMsb0JBQW9CLENBQUNqUyxLQUFLLENBQUMsQ0FBRTtFQUMvSSxNQUFNa1Msb0JBQW9CQSxDQUFDbFMsS0FBbUMsRUFBRSxDQUFFLE9BQU8sS0FBSyxDQUFDa1Msb0JBQW9CLENBQUNsUyxLQUFLLENBQUMsQ0FBRTtFQUM1RyxNQUFNbVMsUUFBUUEsQ0FBQ3hnQixNQUErQixFQUEyQixDQUFFLE9BQU8sS0FBSyxDQUFDd2dCLFFBQVEsQ0FBQ3hnQixNQUFNLENBQUMsQ0FBRTtFQUMxRyxNQUFNeWdCLE9BQU9BLENBQUNwSixZQUFxQyxFQUFtQixDQUFFLE9BQU8sS0FBSyxDQUFDb0osT0FBTyxDQUFDcEosWUFBWSxDQUFDLENBQUU7RUFDNUcsTUFBTXFKLFNBQVNBLENBQUNySCxNQUFjLEVBQW1CLENBQUUsT0FBTyxLQUFLLENBQUNxSCxTQUFTLENBQUNySCxNQUFNLENBQUMsQ0FBRTtFQUNuRixNQUFNc0gsU0FBU0EsQ0FBQ3RILE1BQWMsRUFBRXVILElBQVksRUFBaUIsQ0FBRSxPQUFPLEtBQUssQ0FBQ0QsU0FBUyxDQUFDdEgsTUFBTSxFQUFFdUgsSUFBSSxDQUFDLENBQUU7O0VBRXJHOztFQUVBLGFBQWFDLGtCQUFrQkEsQ0FBQ0MsV0FBMkYsRUFBRXpiLFFBQWlCLEVBQUVqRSxRQUFpQixFQUE0QjtJQUMzTCxJQUFJcEIsTUFBTSxHQUFHSixlQUFlLENBQUNtaEIsZUFBZSxDQUFDRCxXQUFXLEVBQUV6YixRQUFRLEVBQUVqRSxRQUFRLENBQUM7SUFDN0UsSUFBSXBCLE1BQU0sQ0FBQ2doQixHQUFHLEVBQUUsT0FBT3BoQixlQUFlLENBQUNxaEIscUJBQXFCLENBQUNqaEIsTUFBTSxDQUFDLENBQUM7SUFDaEUsT0FBTyxJQUFJSixlQUFlLENBQUNJLE1BQU0sQ0FBQztFQUN6Qzs7RUFFQSxhQUF1QmloQixxQkFBcUJBLENBQUNqaEIsTUFBbUMsRUFBNEI7SUFDMUcsSUFBQTJHLGVBQU0sRUFBQ2pHLGlCQUFRLENBQUMwVyxPQUFPLENBQUNwWCxNQUFNLENBQUNnaEIsR0FBRyxDQUFDLEVBQUUsd0RBQXdELENBQUM7O0lBRTlGO0lBQ0EsSUFBSUUsYUFBYSxHQUFHLE1BQUFDLE9BQUEsQ0FBQUMsT0FBQSxHQUFBQyxJQUFBLE9BQUEzaUIsdUJBQUEsQ0FBQTlDLE9BQUEsQ0FBYSxlQUFlLEdBQUM7SUFDakQsTUFBTTBsQixZQUFZLEdBQUdKLGFBQWEsQ0FBQ0ssS0FBSyxDQUFDdmhCLE1BQU0sQ0FBQ2doQixHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUVoaEIsTUFBTSxDQUFDZ2hCLEdBQUcsQ0FBQzVNLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUMzRW9OLEdBQUcsRUFBRSxFQUFFLEdBQUdwaEIsT0FBTyxDQUFDb2hCLEdBQUcsRUFBRUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7SUFDL0MsQ0FBQyxDQUFDO0lBQ0ZILFlBQVksQ0FBQ0ksTUFBTSxDQUFDQyxXQUFXLENBQUMsTUFBTSxDQUFDO0lBQ3ZDTCxZQUFZLENBQUNNLE1BQU0sQ0FBQ0QsV0FBVyxDQUFDLE1BQU0sQ0FBQzs7SUFFdkM7SUFDQSxJQUFJakYsR0FBRztJQUNQLElBQUltRixJQUFJLEdBQUcsSUFBSTtJQUNmLElBQUl0UixNQUFNLEdBQUcsRUFBRTtJQUNmLElBQUk7TUFDRixPQUFPLE1BQU0sSUFBSTRRLE9BQU8sQ0FBQyxVQUFTQyxPQUFPLEVBQUVVLE1BQU0sRUFBRTs7UUFFakQ7UUFDQVIsWUFBWSxDQUFDSSxNQUFNLENBQUNLLEVBQUUsQ0FBQyxNQUFNLEVBQUUsZ0JBQWVwSixJQUFJLEVBQUU7VUFDbEQsSUFBSXFKLElBQUksR0FBR3JKLElBQUksQ0FBQ2pFLFFBQVEsQ0FBQyxDQUFDO1VBQzFCdU4scUJBQVksQ0FBQ0MsR0FBRyxDQUFDLENBQUMsRUFBRUYsSUFBSSxDQUFDO1VBQ3pCelIsTUFBTSxJQUFJeVIsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDOztVQUV2QjtVQUNBLElBQUlHLGVBQWUsR0FBRyxhQUFhO1VBQ25DLElBQUlDLGtCQUFrQixHQUFHSixJQUFJLENBQUNsYSxPQUFPLENBQUNxYSxlQUFlLENBQUM7VUFDdEQsSUFBSUMsa0JBQWtCLElBQUksQ0FBQyxFQUFFO1lBQzNCLElBQUlDLElBQUksR0FBR0wsSUFBSSxDQUFDTSxTQUFTLENBQUNGLGtCQUFrQixHQUFHRCxlQUFlLENBQUN6VyxNQUFNLEVBQUVzVyxJQUFJLENBQUNPLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM3RixJQUFJQyxlQUFlLEdBQUdSLElBQUksQ0FBQ1MsT0FBTyxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUMsQ0FBQ0MsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLElBQUlDLElBQUksR0FBR0gsZUFBZSxDQUFDRixTQUFTLENBQUNFLGVBQWUsQ0FBQ0QsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxRSxJQUFJSyxNQUFNLEdBQUc1aUIsTUFBTSxDQUFDZ2hCLEdBQUcsQ0FBQ2xaLE9BQU8sQ0FBQyxXQUFXLENBQUM7WUFDNUMsSUFBSSthLFVBQVUsR0FBR0QsTUFBTSxJQUFJLENBQUMsR0FBRyxTQUFTLElBQUk1aUIsTUFBTSxDQUFDZ2hCLEdBQUcsQ0FBQzRCLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQ3ZlLFdBQVcsQ0FBQyxDQUFDLEdBQUcsS0FBSztZQUN4RnFZLEdBQUcsR0FBRyxDQUFDbUcsVUFBVSxHQUFHLE9BQU8sR0FBRyxNQUFNLElBQUksS0FBSyxHQUFHUixJQUFJLEdBQUcsR0FBRyxHQUFHTSxJQUFJO1VBQ25FOztVQUVBO1VBQ0EsSUFBSVgsSUFBSSxDQUFDbGEsT0FBTyxDQUFDLDRCQUE0QixDQUFDLElBQUksQ0FBQyxFQUFFOztZQUVuRDtZQUNBLElBQUlnYixXQUFXLEdBQUc5aUIsTUFBTSxDQUFDZ2hCLEdBQUcsQ0FBQ2xaLE9BQU8sQ0FBQyxhQUFhLENBQUM7WUFDbkQsSUFBSWliLFFBQVEsR0FBR0QsV0FBVyxJQUFJLENBQUMsR0FBRzlpQixNQUFNLENBQUNnaEIsR0FBRyxDQUFDOEIsV0FBVyxHQUFHLENBQUMsQ0FBQyxHQUFHdmlCLFNBQVM7WUFDekUsSUFBSThFLFFBQVEsR0FBRzBkLFFBQVEsS0FBS3hpQixTQUFTLEdBQUdBLFNBQVMsR0FBR3dpQixRQUFRLENBQUNULFNBQVMsQ0FBQyxDQUFDLEVBQUVTLFFBQVEsQ0FBQ2piLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoRyxJQUFJMUcsUUFBUSxHQUFHMmhCLFFBQVEsS0FBS3hpQixTQUFTLEdBQUdBLFNBQVMsR0FBR3dpQixRQUFRLENBQUNULFNBQVMsQ0FBQ1MsUUFBUSxDQUFDamIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqRyxJQUFJa2IsU0FBUyxHQUFHaGpCLE1BQU0sQ0FBQ2doQixHQUFHLENBQUNsWixPQUFPLENBQUMsV0FBVyxDQUFDO1lBQy9DLElBQUltYixNQUFNLEdBQUdELFNBQVMsSUFBSSxDQUFDLEdBQUdoakIsTUFBTSxDQUFDZ2hCLEdBQUcsQ0FBQ2dDLFNBQVMsR0FBRyxDQUFDLENBQUMsR0FBR3ppQixTQUFTO1lBQ25FLElBQUkyaUIsV0FBVyxHQUFHbGpCLE1BQU0sQ0FBQ2doQixHQUFHLENBQUNsWixPQUFPLENBQUMsU0FBUyxDQUFDO1lBQy9DLElBQUksQ0FBQzFCLGVBQWUsR0FBRzhjLFdBQVcsSUFBSSxDQUFDLEdBQUdsakIsTUFBTSxDQUFDZ2hCLEdBQUcsQ0FBQ2tDLFdBQVcsR0FBRyxDQUFDLENBQUMsR0FBRzNpQixTQUFTOztZQUVqRjtZQUNBUCxNQUFNLEdBQUdBLE1BQU0sQ0FBQ3NQLElBQUksQ0FBQyxDQUFDLENBQUM1TSxTQUFTLENBQUMsRUFBQ2dhLEdBQUcsRUFBRUEsR0FBRyxFQUFFclgsUUFBUSxFQUFFQSxRQUFRLEVBQUVqRSxRQUFRLEVBQUVBLFFBQVEsRUFBRTZoQixNQUFNLEVBQUVBLE1BQU0sRUFBRUUsUUFBUSxFQUFFLElBQUksQ0FBQy9jLGVBQWUsRUFBRWdkLGtCQUFrQixFQUFFcGpCLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLEdBQUdqQixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDb2lCLHFCQUFxQixDQUFDLENBQUMsR0FBRzlpQixTQUFTLEVBQUMsQ0FBQztZQUNyT1AsTUFBTSxDQUFDZ2hCLEdBQUcsR0FBR3pnQixTQUFTO1lBQ3RCLElBQUkraUIsTUFBTSxHQUFHLE1BQU0xakIsZUFBZSxDQUFDaWhCLGtCQUFrQixDQUFDN2dCLE1BQU0sQ0FBQztZQUM3RHNqQixNQUFNLENBQUNsakIsT0FBTyxHQUFHa2hCLFlBQVk7O1lBRTdCO1lBQ0EsSUFBSSxDQUFDaUMsVUFBVSxHQUFHLElBQUk7WUFDdEJuQyxPQUFPLENBQUNrQyxNQUFNLENBQUM7VUFDakI7UUFDRixDQUFDLENBQUM7O1FBRUY7UUFDQWhDLFlBQVksQ0FBQ00sTUFBTSxDQUFDRyxFQUFFLENBQUMsTUFBTSxFQUFFLFVBQVNwSixJQUFJLEVBQUU7VUFDNUMsSUFBSXNKLHFCQUFZLENBQUN1QixXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRTNTLE9BQU8sQ0FBQ0MsS0FBSyxDQUFDNkgsSUFBSSxDQUFDO1FBQzFELENBQUMsQ0FBQzs7UUFFRjtRQUNBMkksWUFBWSxDQUFDUyxFQUFFLENBQUMsTUFBTSxFQUFFLFVBQVMwQixJQUFJLEVBQUU7VUFDckMsSUFBSSxDQUFDLElBQUksQ0FBQ0YsVUFBVSxFQUFFekIsTUFBTSxDQUFDLElBQUl0aEIsb0JBQVcsQ0FBQyxzREFBc0QsR0FBR2lqQixJQUFJLElBQUlsVCxNQUFNLEdBQUcsT0FBTyxHQUFHQSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNqSixDQUFDLENBQUM7O1FBRUY7UUFDQStRLFlBQVksQ0FBQ1MsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFTeGUsR0FBRyxFQUFFO1VBQ3JDLElBQUlBLEdBQUcsQ0FBQ2EsT0FBTyxDQUFDMEQsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRWdhLE1BQU0sQ0FBQyxJQUFJdGhCLG9CQUFXLENBQUMsNENBQTRDLEdBQUdSLE1BQU0sQ0FBQ2doQixHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7VUFDbkksSUFBSSxDQUFDLElBQUksQ0FBQ3VDLFVBQVUsRUFBRXpCLE1BQU0sQ0FBQ3ZlLEdBQUcsQ0FBQztRQUNuQyxDQUFDLENBQUM7O1FBRUY7UUFDQStkLFlBQVksQ0FBQ1MsRUFBRSxDQUFDLG1CQUFtQixFQUFFLFVBQVN4ZSxHQUFHLEVBQUVtZ0IsTUFBTSxFQUFFO1VBQ3pEN1MsT0FBTyxDQUFDQyxLQUFLLENBQUMsbURBQW1ELEdBQUd2TixHQUFHLENBQUNhLE9BQU8sQ0FBQztVQUNoRnlNLE9BQU8sQ0FBQ0MsS0FBSyxDQUFDNFMsTUFBTSxDQUFDO1VBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUNILFVBQVUsRUFBRXpCLE1BQU0sQ0FBQ3ZlLEdBQUcsQ0FBQztRQUNuQyxDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsT0FBT0EsR0FBUSxFQUFFO01BQ2pCLE1BQU0sSUFBSS9DLG9CQUFXLENBQUMrQyxHQUFHLENBQUNhLE9BQU8sQ0FBQztJQUNwQztFQUNGOztFQUVBLE1BQWdCeEMsS0FBS0EsQ0FBQSxFQUFHO0lBQ3RCLElBQUksQ0FBQytGLGdCQUFnQixDQUFDLENBQUM7SUFDdkIsT0FBTyxJQUFJLENBQUMxSCxZQUFZO0lBQ3hCLElBQUksQ0FBQ0EsWUFBWSxHQUFHLENBQUMsQ0FBQztJQUN0QixJQUFJLENBQUNxQixJQUFJLEdBQUdmLFNBQVM7RUFDdkI7O0VBRUEsTUFBZ0JvakIsaUJBQWlCQSxDQUFDeFAsb0JBQTBCLEVBQUU7SUFDNUQsSUFBSW1DLE9BQU8sR0FBRyxJQUFJckYsR0FBRyxDQUFDLENBQUM7SUFDdkIsS0FBSyxJQUFJakssT0FBTyxJQUFJLE1BQU0sSUFBSSxDQUFDQyxXQUFXLENBQUMsQ0FBQyxFQUFFO01BQzVDcVAsT0FBTyxDQUFDM1csR0FBRyxDQUFDcUgsT0FBTyxDQUFDc0YsUUFBUSxDQUFDLENBQUMsRUFBRTZILG9CQUFvQixHQUFHLE1BQU0sSUFBSSxDQUFDQSxvQkFBb0IsQ0FBQ25OLE9BQU8sQ0FBQ3NGLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRy9MLFNBQVMsQ0FBQztJQUN6SDtJQUNBLE9BQU8rVixPQUFPO0VBQ2hCOztFQUVBLE1BQWdCbkMsb0JBQW9CQSxDQUFDMU4sVUFBVSxFQUFFO0lBQy9DLElBQUkrRyxpQkFBaUIsR0FBRyxFQUFFO0lBQzFCLElBQUlsRyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUN0SCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDUSxlQUFlLENBQUMsYUFBYSxFQUFFLEVBQUMyRixhQUFhLEVBQUVYLFVBQVUsRUFBQyxDQUFDO0lBQ3BHLEtBQUssSUFBSXpDLE9BQU8sSUFBSXNELElBQUksQ0FBQ0MsTUFBTSxDQUFDcUcsU0FBUyxFQUFFSixpQkFBaUIsQ0FBQ2pCLElBQUksQ0FBQ3ZJLE9BQU8sQ0FBQ3lKLGFBQWEsQ0FBQztJQUN4RixPQUFPRCxpQkFBaUI7RUFDMUI7O0VBRUEsTUFBZ0IwQixlQUFlQSxDQUFDYixLQUEwQixFQUFFOztJQUUxRDtJQUNBLElBQUl1VixPQUFPLEdBQUd2VixLQUFLLENBQUNtRCxVQUFVLENBQUMsQ0FBQztJQUNoQyxJQUFJcVMsY0FBYyxHQUFHRCxPQUFPLENBQUNoVCxjQUFjLENBQUMsQ0FBQyxLQUFLLEtBQUssSUFBSWdULE9BQU8sQ0FBQ0UsV0FBVyxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUlGLE9BQU8sQ0FBQ0csV0FBVyxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUlILE9BQU8sQ0FBQzVNLFlBQVksQ0FBQyxDQUFDLEtBQUssS0FBSztJQUMvSixJQUFJZ04sYUFBYSxHQUFHSixPQUFPLENBQUNoVCxjQUFjLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSWdULE9BQU8sQ0FBQ0UsV0FBVyxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUlGLE9BQU8sQ0FBQ0csV0FBVyxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUlILE9BQU8sQ0FBQzlaLFNBQVMsQ0FBQyxDQUFDLEtBQUt2SixTQUFTLElBQUlxakIsT0FBTyxDQUFDSyxZQUFZLENBQUMsQ0FBQyxLQUFLMWpCLFNBQVMsSUFBSXFqQixPQUFPLENBQUNNLFdBQVcsQ0FBQyxDQUFDLEtBQUssS0FBSztJQUMxTyxJQUFJQyxhQUFhLEdBQUc5VixLQUFLLENBQUMrVixhQUFhLENBQUMsQ0FBQyxLQUFLLEtBQUssSUFBSS9WLEtBQUssQ0FBQ2dXLGFBQWEsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJaFcsS0FBSyxDQUFDaVcsa0JBQWtCLENBQUMsQ0FBQyxLQUFLLElBQUk7SUFDNUgsSUFBSUMsYUFBYSxHQUFHbFcsS0FBSyxDQUFDZ1csYUFBYSxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUloVyxLQUFLLENBQUMrVixhQUFhLENBQUMsQ0FBQyxLQUFLLElBQUk7O0lBRXJGO0lBQ0EsSUFBSVIsT0FBTyxDQUFDRSxXQUFXLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDRSxhQUFhLEVBQUU7TUFDcEQsTUFBTSxJQUFJeGpCLG9CQUFXLENBQUMscUVBQXFFLENBQUM7SUFDOUY7O0lBRUEsSUFBSTZDLE1BQVcsR0FBRyxDQUFDLENBQUM7SUFDcEJBLE1BQU0sQ0FBQ21oQixFQUFFLEdBQUdMLGFBQWEsSUFBSU4sY0FBYztJQUMzQ3hnQixNQUFNLENBQUNvaEIsR0FBRyxHQUFHRixhQUFhLElBQUlWLGNBQWM7SUFDNUN4Z0IsTUFBTSxDQUFDcWhCLElBQUksR0FBR1AsYUFBYSxJQUFJSCxhQUFhO0lBQzVDM2dCLE1BQU0sQ0FBQ3NoQixPQUFPLEdBQUdKLGFBQWEsSUFBSVAsYUFBYTtJQUMvQzNnQixNQUFNLENBQUN1aEIsTUFBTSxHQUFHaEIsT0FBTyxDQUFDRyxXQUFXLENBQUMsQ0FBQyxLQUFLLEtBQUssSUFBSUgsT0FBTyxDQUFDaFQsY0FBYyxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUlnVCxPQUFPLENBQUNFLFdBQVcsQ0FBQyxDQUFDLElBQUksSUFBSTtJQUNySCxJQUFJRixPQUFPLENBQUNpQixZQUFZLENBQUMsQ0FBQyxLQUFLdGtCLFNBQVMsRUFBRTtNQUN4QyxJQUFJcWpCLE9BQU8sQ0FBQ2lCLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFeGhCLE1BQU0sQ0FBQ3loQixVQUFVLEdBQUdsQixPQUFPLENBQUNpQixZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQUEsS0FDM0V4aEIsTUFBTSxDQUFDeWhCLFVBQVUsR0FBR2xCLE9BQU8sQ0FBQ2lCLFlBQVksQ0FBQyxDQUFDO0lBQ2pEO0lBQ0EsSUFBSWpCLE9BQU8sQ0FBQ0ssWUFBWSxDQUFDLENBQUMsS0FBSzFqQixTQUFTLEVBQUU4QyxNQUFNLENBQUMwaEIsVUFBVSxHQUFHbkIsT0FBTyxDQUFDSyxZQUFZLENBQUMsQ0FBQztJQUNwRjVnQixNQUFNLENBQUMyaEIsZ0JBQWdCLEdBQUdwQixPQUFPLENBQUNpQixZQUFZLENBQUMsQ0FBQyxLQUFLdGtCLFNBQVMsSUFBSXFqQixPQUFPLENBQUNLLFlBQVksQ0FBQyxDQUFDLEtBQUsxakIsU0FBUztJQUN0RyxJQUFJOE4sS0FBSyxDQUFDdEIsZUFBZSxDQUFDLENBQUMsS0FBS3hNLFNBQVMsRUFBRTtNQUN6QyxJQUFBb0csZUFBTSxFQUFDMEgsS0FBSyxDQUFDNFcsa0JBQWtCLENBQUMsQ0FBQyxLQUFLMWtCLFNBQVMsSUFBSThOLEtBQUssQ0FBQzhGLG9CQUFvQixDQUFDLENBQUMsS0FBSzVULFNBQVMsRUFBRSw2REFBNkQsQ0FBQztNQUM3SjhDLE1BQU0sQ0FBQ3VKLFlBQVksR0FBRyxJQUFJO0lBQzVCLENBQUMsTUFBTTtNQUNMdkosTUFBTSxDQUFDK0QsYUFBYSxHQUFHaUgsS0FBSyxDQUFDdEIsZUFBZSxDQUFDLENBQUM7O01BRTlDO01BQ0EsSUFBSVMsaUJBQWlCLEdBQUcsSUFBSWlDLEdBQUcsQ0FBQyxDQUFDO01BQ2pDLElBQUlwQixLQUFLLENBQUM0VyxrQkFBa0IsQ0FBQyxDQUFDLEtBQUsxa0IsU0FBUyxFQUFFaU4saUJBQWlCLENBQUNvQyxHQUFHLENBQUN2QixLQUFLLENBQUM0VyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7TUFDL0YsSUFBSTVXLEtBQUssQ0FBQzhGLG9CQUFvQixDQUFDLENBQUMsS0FBSzVULFNBQVMsRUFBRThOLEtBQUssQ0FBQzhGLG9CQUFvQixDQUFDLENBQUMsQ0FBQzNCLEdBQUcsQ0FBQyxDQUFBOUwsYUFBYSxLQUFJOEcsaUJBQWlCLENBQUNvQyxHQUFHLENBQUNsSixhQUFhLENBQUMsQ0FBQztNQUN2SSxJQUFJOEcsaUJBQWlCLENBQUMwWCxJQUFJLEVBQUU3aEIsTUFBTSxDQUFDd1IsZUFBZSxHQUFHc0MsS0FBSyxDQUFDZ08sSUFBSSxDQUFDM1gsaUJBQWlCLENBQUM7SUFDcEY7O0lBRUE7SUFDQSxJQUFJcUMsS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNkLElBQUlDLFFBQVEsR0FBRyxDQUFDLENBQUM7O0lBRWpCO0lBQ0EsSUFBSXhJLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ3RILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNRLGVBQWUsQ0FBQyxlQUFlLEVBQUU0QixNQUFNLENBQUM7SUFDakYsS0FBSyxJQUFJL0QsR0FBRyxJQUFJSCxNQUFNLENBQUNvWCxJQUFJLENBQUNqUCxJQUFJLENBQUNDLE1BQU0sQ0FBQyxFQUFFO01BQ3hDLEtBQUssSUFBSTZkLEtBQUssSUFBSTlkLElBQUksQ0FBQ0MsTUFBTSxDQUFDakksR0FBRyxDQUFDLEVBQUU7UUFDbEM7UUFDQSxJQUFJeVEsRUFBRSxHQUFHblEsZUFBZSxDQUFDeWxCLHdCQUF3QixDQUFDRCxLQUFLLENBQUM7UUFDeEQsSUFBSXJWLEVBQUUsQ0FBQ2EsY0FBYyxDQUFDLENBQUMsRUFBRSxJQUFBakssZUFBTSxFQUFDb0osRUFBRSxDQUFDVyxRQUFRLENBQUMsQ0FBQyxDQUFDdEMsTUFBTSxDQUFDLENBQUMsQ0FBQ3RHLE9BQU8sQ0FBQ2lJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDOztRQUV4RTtRQUNBO1FBQ0EsSUFBSUEsRUFBRSxDQUFDNkYsbUJBQW1CLENBQUMsQ0FBQyxLQUFLclYsU0FBUyxJQUFJd1AsRUFBRSxDQUFDaUgsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDakgsRUFBRSxDQUFDZ1UsV0FBVyxDQUFDLENBQUM7UUFDaEZoVSxFQUFFLENBQUM2RixtQkFBbUIsQ0FBQyxDQUFDLENBQUNyQixlQUFlLENBQUMsQ0FBQyxJQUFJeEUsRUFBRSxDQUFDdVYsaUJBQWlCLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtVQUMvRSxJQUFJQyxnQkFBZ0IsR0FBR3hWLEVBQUUsQ0FBQzZGLG1CQUFtQixDQUFDLENBQUM7VUFDL0MsSUFBSTRQLGFBQWEsR0FBRzFlLE1BQU0sQ0FBQyxDQUFDLENBQUM7VUFDN0IsS0FBSyxJQUFJd04sV0FBVyxJQUFJaVIsZ0JBQWdCLENBQUNoUixlQUFlLENBQUMsQ0FBQyxFQUFFaVIsYUFBYSxHQUFHQSxhQUFhLEdBQUdsUixXQUFXLENBQUNFLFNBQVMsQ0FBQyxDQUFDO1VBQ25IekUsRUFBRSxDQUFDNkYsbUJBQW1CLENBQUMsQ0FBQyxDQUFDTyxTQUFTLENBQUNxUCxhQUFhLENBQUM7UUFDbkQ7O1FBRUE7UUFDQTVsQixlQUFlLENBQUNvUSxPQUFPLENBQUNELEVBQUUsRUFBRUYsS0FBSyxFQUFFQyxRQUFRLENBQUM7TUFDOUM7SUFDRjs7SUFFQTtJQUNBLElBQUlQLEdBQXFCLEdBQUdwUSxNQUFNLENBQUNzbUIsTUFBTSxDQUFDNVYsS0FBSyxDQUFDO0lBQ2hETixHQUFHLENBQUNtVyxJQUFJLENBQUM5bEIsZUFBZSxDQUFDK2xCLGtCQUFrQixDQUFDOztJQUU1QztJQUNBLElBQUkxVyxTQUFTLEdBQUcsRUFBRTtJQUNsQixLQUFLLElBQUljLEVBQUUsSUFBSVIsR0FBRyxFQUFFOztNQUVsQjtNQUNBLElBQUlRLEVBQUUsQ0FBQ3FVLGFBQWEsQ0FBQyxDQUFDLEtBQUs3akIsU0FBUyxFQUFFd1AsRUFBRSxDQUFDNlYsYUFBYSxDQUFDLEtBQUssQ0FBQztNQUM3RCxJQUFJN1YsRUFBRSxDQUFDc1UsYUFBYSxDQUFDLENBQUMsS0FBSzlqQixTQUFTLEVBQUV3UCxFQUFFLENBQUM4VixhQUFhLENBQUMsS0FBSyxDQUFDOztNQUU3RDtNQUNBLElBQUk5VixFQUFFLENBQUN1USxvQkFBb0IsQ0FBQyxDQUFDLEtBQUsvZixTQUFTLEVBQUV3UCxFQUFFLENBQUN1USxvQkFBb0IsQ0FBQyxDQUFDLENBQUNvRixJQUFJLENBQUM5bEIsZUFBZSxDQUFDa21CLHdCQUF3QixDQUFDOztNQUVySDtNQUNBLEtBQUssSUFBSXBXLFFBQVEsSUFBSUssRUFBRSxDQUFDMEIsZUFBZSxDQUFDcEQsS0FBSyxDQUFDLEVBQUU7UUFDOUNZLFNBQVMsQ0FBQzFDLElBQUksQ0FBQ21ELFFBQVEsQ0FBQztNQUMxQjs7TUFFQTtNQUNBLElBQUlLLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsS0FBS25RLFNBQVMsSUFBSXdQLEVBQUUsQ0FBQzZGLG1CQUFtQixDQUFDLENBQUMsS0FBS3JWLFNBQVMsSUFBSXdQLEVBQUUsQ0FBQ3VRLG9CQUFvQixDQUFDLENBQUMsS0FBSy9mLFNBQVMsRUFBRTtRQUNwSHdQLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUN1QyxNQUFNLENBQUNaLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUN0RyxPQUFPLENBQUNpSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7TUFDdEU7SUFDRjs7SUFFQSxPQUFPZCxTQUFTO0VBQ2xCOztFQUVBLE1BQWdCb0IsYUFBYUEsQ0FBQ2hDLEtBQUssRUFBRTs7SUFFbkM7SUFDQSxJQUFJaUksT0FBTyxHQUFHLElBQUlyRixHQUFHLENBQUMsQ0FBQztJQUN2QixJQUFJNUMsS0FBSyxDQUFDdEIsZUFBZSxDQUFDLENBQUMsS0FBS3hNLFNBQVMsRUFBRTtNQUN6QyxJQUFJaU4saUJBQWlCLEdBQUcsSUFBSWlDLEdBQUcsQ0FBQyxDQUFDO01BQ2pDLElBQUlwQixLQUFLLENBQUM0VyxrQkFBa0IsQ0FBQyxDQUFDLEtBQUsxa0IsU0FBUyxFQUFFaU4saUJBQWlCLENBQUNvQyxHQUFHLENBQUN2QixLQUFLLENBQUM0VyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7TUFDL0YsSUFBSTVXLEtBQUssQ0FBQzhGLG9CQUFvQixDQUFDLENBQUMsS0FBSzVULFNBQVMsRUFBRThOLEtBQUssQ0FBQzhGLG9CQUFvQixDQUFDLENBQUMsQ0FBQzNCLEdBQUcsQ0FBQyxDQUFBOUwsYUFBYSxLQUFJOEcsaUJBQWlCLENBQUNvQyxHQUFHLENBQUNsSixhQUFhLENBQUMsQ0FBQztNQUN2STRQLE9BQU8sQ0FBQzNXLEdBQUcsQ0FBQzBPLEtBQUssQ0FBQ3RCLGVBQWUsQ0FBQyxDQUFDLEVBQUVTLGlCQUFpQixDQUFDMFgsSUFBSSxHQUFHL04sS0FBSyxDQUFDZ08sSUFBSSxDQUFDM1gsaUJBQWlCLENBQUMsR0FBR2pOLFNBQVMsQ0FBQyxDQUFDLENBQUU7SUFDN0csQ0FBQyxNQUFNO01BQ0xvRyxlQUFNLENBQUNDLEtBQUssQ0FBQ3lILEtBQUssQ0FBQzRXLGtCQUFrQixDQUFDLENBQUMsRUFBRTFrQixTQUFTLEVBQUUsNkRBQTZELENBQUM7TUFDbEgsSUFBQW9HLGVBQU0sRUFBQzBILEtBQUssQ0FBQzhGLG9CQUFvQixDQUFDLENBQUMsS0FBSzVULFNBQVMsSUFBSThOLEtBQUssQ0FBQzhGLG9CQUFvQixDQUFDLENBQUMsQ0FBQ3pJLE1BQU0sS0FBSyxDQUFDLEVBQUUsNkRBQTZELENBQUM7TUFDOUo0SyxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUNxTixpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBRTtJQUM3Qzs7SUFFQTtJQUNBLElBQUk5VCxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSUMsUUFBUSxHQUFHLENBQUMsQ0FBQzs7SUFFakI7SUFDQSxJQUFJek0sTUFBVyxHQUFHLENBQUMsQ0FBQztJQUNwQkEsTUFBTSxDQUFDMGlCLGFBQWEsR0FBRzFYLEtBQUssQ0FBQzJYLFVBQVUsQ0FBQyxDQUFDLEtBQUssSUFBSSxHQUFHLGFBQWEsR0FBRzNYLEtBQUssQ0FBQzJYLFVBQVUsQ0FBQyxDQUFDLEtBQUssS0FBSyxHQUFHLFdBQVcsR0FBRyxLQUFLO0lBQ3ZIM2lCLE1BQU0sQ0FBQzRpQixPQUFPLEdBQUcsSUFBSTtJQUNyQixLQUFLLElBQUl4ZixVQUFVLElBQUk2UCxPQUFPLENBQUNDLElBQUksQ0FBQyxDQUFDLEVBQUU7O01BRXJDO01BQ0FsVCxNQUFNLENBQUMrRCxhQUFhLEdBQUdYLFVBQVU7TUFDakNwRCxNQUFNLENBQUN3UixlQUFlLEdBQUd5QixPQUFPLENBQUN0WCxHQUFHLENBQUN5SCxVQUFVLENBQUM7TUFDaEQsSUFBSWEsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLG9CQUFvQixFQUFFNEIsTUFBTSxDQUFDOztNQUV0RjtNQUNBLElBQUlpRSxJQUFJLENBQUNDLE1BQU0sQ0FBQzBILFNBQVMsS0FBSzFPLFNBQVMsRUFBRTtNQUN6QyxLQUFLLElBQUkybEIsU0FBUyxJQUFJNWUsSUFBSSxDQUFDQyxNQUFNLENBQUMwSCxTQUFTLEVBQUU7UUFDM0MsSUFBSWMsRUFBRSxHQUFHblEsZUFBZSxDQUFDdW1CLHNCQUFzQixDQUFDRCxTQUFTLENBQUM7UUFDMUR0bUIsZUFBZSxDQUFDb1EsT0FBTyxDQUFDRCxFQUFFLEVBQUVGLEtBQUssRUFBRUMsUUFBUSxDQUFDO01BQzlDO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJUCxHQUFxQixHQUFHcFEsTUFBTSxDQUFDc21CLE1BQU0sQ0FBQzVWLEtBQUssQ0FBQztJQUNoRE4sR0FBRyxDQUFDbVcsSUFBSSxDQUFDOWxCLGVBQWUsQ0FBQytsQixrQkFBa0IsQ0FBQzs7SUFFNUM7SUFDQSxJQUFJdlYsT0FBTyxHQUFHLEVBQUU7SUFDaEIsS0FBSyxJQUFJTCxFQUFFLElBQUlSLEdBQUcsRUFBRTs7TUFFbEI7TUFDQSxJQUFJUSxFQUFFLENBQUMyQixVQUFVLENBQUMsQ0FBQyxLQUFLblIsU0FBUyxFQUFFd1AsRUFBRSxDQUFDMkIsVUFBVSxDQUFDLENBQUMsQ0FBQ2dVLElBQUksQ0FBQzlsQixlQUFlLENBQUN3bUIsY0FBYyxDQUFDOztNQUV2RjtNQUNBLEtBQUssSUFBSTdWLE1BQU0sSUFBSVIsRUFBRSxDQUFDNkIsYUFBYSxDQUFDdkQsS0FBSyxDQUFDLEVBQUUrQixPQUFPLENBQUM3RCxJQUFJLENBQUNnRSxNQUFNLENBQUM7O01BRWhFO01BQ0EsSUFBSVIsRUFBRSxDQUFDMkIsVUFBVSxDQUFDLENBQUMsS0FBS25SLFNBQVMsSUFBSXdQLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsS0FBS25RLFNBQVMsRUFBRTtRQUNoRXdQLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUN1QyxNQUFNLENBQUNaLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUN0RyxPQUFPLENBQUNpSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7TUFDdEU7SUFDRjtJQUNBLE9BQU9LLE9BQU87RUFDaEI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBZ0JnQyxrQkFBa0JBLENBQUNOLEdBQUcsRUFBRTtJQUN0QyxJQUFJeEssSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLG1CQUFtQixFQUFFLEVBQUNxUSxHQUFHLEVBQUVBLEdBQUcsRUFBQyxDQUFDO0lBQ3pGLElBQUksQ0FBQ3hLLElBQUksQ0FBQ0MsTUFBTSxDQUFDdUwsaUJBQWlCLEVBQUUsT0FBTyxFQUFFO0lBQzdDLE9BQU94TCxJQUFJLENBQUNDLE1BQU0sQ0FBQ3VMLGlCQUFpQixDQUFDTixHQUFHLENBQUMsQ0FBQTZULFFBQVEsS0FBSSxJQUFJQyx1QkFBYyxDQUFDRCxRQUFRLENBQUMzVCxTQUFTLEVBQUUyVCxRQUFRLENBQUN6VCxTQUFTLENBQUMsQ0FBQztFQUNsSDs7RUFFQSxNQUFnQjhELGVBQWVBLENBQUMxVyxNQUFzQixFQUFFOztJQUV0RDtJQUNBLElBQUlBLE1BQU0sS0FBS08sU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQywyQkFBMkIsQ0FBQztJQUM1RSxJQUFJUixNQUFNLENBQUMrTSxlQUFlLENBQUMsQ0FBQyxLQUFLeE0sU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyw2Q0FBNkMsQ0FBQztJQUNoSCxJQUFJUixNQUFNLENBQUN1VSxlQUFlLENBQUMsQ0FBQyxLQUFLaFUsU0FBUyxJQUFJUCxNQUFNLENBQUN1VSxlQUFlLENBQUMsQ0FBQyxDQUFDN0ksTUFBTSxJQUFJLENBQUMsRUFBRSxNQUFNLElBQUlsTCxvQkFBVyxDQUFDLGtEQUFrRCxDQUFDO0lBQzdKLElBQUlSLE1BQU0sQ0FBQ3VVLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNqTSxVQUFVLENBQUMsQ0FBQyxLQUFLL0gsU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyw4Q0FBOEMsQ0FBQztJQUNqSSxJQUFJUixNQUFNLENBQUN1VSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDQyxTQUFTLENBQUMsQ0FBQyxLQUFLalUsU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyx1Q0FBdUMsQ0FBQztJQUN6SCxJQUFJUixNQUFNLENBQUNrVyxXQUFXLENBQUMsQ0FBQyxLQUFLM1YsU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQywwRUFBMEUsQ0FBQztJQUN6SSxJQUFJUixNQUFNLENBQUNtVSxvQkFBb0IsQ0FBQyxDQUFDLEtBQUs1VCxTQUFTLElBQUlQLE1BQU0sQ0FBQ21VLG9CQUFvQixDQUFDLENBQUMsQ0FBQ3pJLE1BQU0sS0FBSyxDQUFDLEVBQUUsTUFBTSxJQUFJbEwsb0JBQVcsQ0FBQyxvREFBb0QsQ0FBQztJQUMxSyxJQUFJUixNQUFNLENBQUN5VyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJalcsb0JBQVcsQ0FBQyxtREFBbUQsQ0FBQztJQUMvRyxJQUFJUixNQUFNLENBQUMyVSxrQkFBa0IsQ0FBQyxDQUFDLEtBQUtwVSxTQUFTLElBQUlQLE1BQU0sQ0FBQzJVLGtCQUFrQixDQUFDLENBQUMsQ0FBQ2pKLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxJQUFJbEwsb0JBQVcsQ0FBQyxxRUFBcUUsQ0FBQzs7SUFFckw7SUFDQSxJQUFJUixNQUFNLENBQUNtVSxvQkFBb0IsQ0FBQyxDQUFDLEtBQUs1VCxTQUFTLEVBQUU7TUFDL0NQLE1BQU0sQ0FBQzZWLG9CQUFvQixDQUFDLEVBQUUsQ0FBQztNQUMvQixLQUFLLElBQUluTixVQUFVLElBQUksTUFBTSxJQUFJLENBQUNGLGVBQWUsQ0FBQ3hJLE1BQU0sQ0FBQytNLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUMzRS9NLE1BQU0sQ0FBQ21VLG9CQUFvQixDQUFDLENBQUMsQ0FBQzVILElBQUksQ0FBQzdELFVBQVUsQ0FBQzRELFFBQVEsQ0FBQyxDQUFDLENBQUM7TUFDM0Q7SUFDRjtJQUNBLElBQUl0TSxNQUFNLENBQUNtVSxvQkFBb0IsQ0FBQyxDQUFDLENBQUN6SSxNQUFNLEtBQUssQ0FBQyxFQUFFLE1BQU0sSUFBSWxMLG9CQUFXLENBQUMsK0JBQStCLENBQUM7O0lBRXRHO0lBQ0EsSUFBSTZDLE1BQVcsR0FBRyxDQUFDLENBQUM7SUFDcEIsSUFBSXVULEtBQUssR0FBRzVXLE1BQU0sQ0FBQ2lVLFFBQVEsQ0FBQyxDQUFDLEtBQUssSUFBSTtJQUN0QzVRLE1BQU0sQ0FBQytELGFBQWEsR0FBR3BILE1BQU0sQ0FBQytNLGVBQWUsQ0FBQyxDQUFDO0lBQy9DMUosTUFBTSxDQUFDd1IsZUFBZSxHQUFHN1UsTUFBTSxDQUFDbVUsb0JBQW9CLENBQUMsQ0FBQztJQUN0RDlRLE1BQU0sQ0FBQ1csT0FBTyxHQUFHaEUsTUFBTSxDQUFDdVUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ2pNLFVBQVUsQ0FBQyxDQUFDO0lBQ3pELElBQUEzQixlQUFNLEVBQUMzRyxNQUFNLENBQUNnVixXQUFXLENBQUMsQ0FBQyxLQUFLelUsU0FBUyxJQUFJUCxNQUFNLENBQUNnVixXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSWhWLE1BQU0sQ0FBQ2dWLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BHM1IsTUFBTSxDQUFDdVEsUUFBUSxHQUFHNVQsTUFBTSxDQUFDZ1YsV0FBVyxDQUFDLENBQUM7SUFDdEMzUixNQUFNLENBQUNpRyxVQUFVLEdBQUd0SixNQUFNLENBQUM4VSxZQUFZLENBQUMsQ0FBQztJQUN6Q3pSLE1BQU0sQ0FBQzBSLFlBQVksR0FBRyxDQUFDNkIsS0FBSztJQUM1QnZULE1BQU0sQ0FBQ2tqQixZQUFZLEdBQUd2bUIsTUFBTSxDQUFDd21CLGNBQWMsQ0FBQyxDQUFDO0lBQzdDbmpCLE1BQU0sQ0FBQzhSLFdBQVcsR0FBRyxJQUFJO0lBQ3pCOVIsTUFBTSxDQUFDNFIsVUFBVSxHQUFHLElBQUk7SUFDeEI1UixNQUFNLENBQUM2UixlQUFlLEdBQUcsSUFBSTs7SUFFN0I7SUFDQSxJQUFJNU4sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDdEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ1EsZUFBZSxDQUFDLFdBQVcsRUFBRTRCLE1BQU0sQ0FBQztJQUM3RSxJQUFJa0UsTUFBTSxHQUFHRCxJQUFJLENBQUNDLE1BQU07O0lBRXhCO0lBQ0EsSUFBSXNQLEtBQUssR0FBR2pYLGVBQWUsQ0FBQ2tXLHdCQUF3QixDQUFDdk8sTUFBTSxFQUFFaEgsU0FBUyxFQUFFUCxNQUFNLENBQUM7O0lBRS9FO0lBQ0EsS0FBSyxJQUFJK1AsRUFBRSxJQUFJOEcsS0FBSyxDQUFDekksTUFBTSxDQUFDLENBQUMsRUFBRTtNQUM3QjJCLEVBQUUsQ0FBQzBXLFdBQVcsQ0FBQyxJQUFJLENBQUM7TUFDcEIxVyxFQUFFLENBQUMyVyxjQUFjLENBQUMsS0FBSyxDQUFDO01BQ3hCM1csRUFBRSxDQUFDOEosbUJBQW1CLENBQUMsQ0FBQyxDQUFDO01BQ3pCOUosRUFBRSxDQUFDNFcsUUFBUSxDQUFDL1AsS0FBSyxDQUFDO01BQ2xCN0csRUFBRSxDQUFDZ0gsV0FBVyxDQUFDSCxLQUFLLENBQUM7TUFDckI3RyxFQUFFLENBQUMrRyxZQUFZLENBQUNGLEtBQUssQ0FBQztNQUN0QjdHLEVBQUUsQ0FBQzZXLFlBQVksQ0FBQyxLQUFLLENBQUM7TUFDdEI3VyxFQUFFLENBQUM4VyxXQUFXLENBQUMsS0FBSyxDQUFDO01BQ3JCLElBQUluWCxRQUFRLEdBQUdLLEVBQUUsQ0FBQzZGLG1CQUFtQixDQUFDLENBQUM7TUFDdkNsRyxRQUFRLENBQUM5RyxlQUFlLENBQUM1SSxNQUFNLENBQUMrTSxlQUFlLENBQUMsQ0FBQyxDQUFDO01BQ2xELElBQUkvTSxNQUFNLENBQUNtVSxvQkFBb0IsQ0FBQyxDQUFDLENBQUN6SSxNQUFNLEtBQUssQ0FBQyxFQUFFZ0UsUUFBUSxDQUFDbUcsb0JBQW9CLENBQUM3VixNQUFNLENBQUNtVSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7TUFDNUcsSUFBSUcsV0FBVyxHQUFHLElBQUl3UywwQkFBaUIsQ0FBQzltQixNQUFNLENBQUN1VSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDak0sVUFBVSxDQUFDLENBQUMsRUFBRXhCLE1BQU0sQ0FBQzRJLFFBQVEsQ0FBQzhFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUMvRzlFLFFBQVEsQ0FBQ3FYLGVBQWUsQ0FBQyxDQUFDelMsV0FBVyxDQUFDLENBQUM7TUFDdkN2RSxFQUFFLENBQUNpWCxtQkFBbUIsQ0FBQ3RYLFFBQVEsQ0FBQztNQUNoQ0ssRUFBRSxDQUFDbkcsWUFBWSxDQUFDNUosTUFBTSxDQUFDOFUsWUFBWSxDQUFDLENBQUMsQ0FBQztNQUN0QyxJQUFJL0UsRUFBRSxDQUFDa1gsYUFBYSxDQUFDLENBQUMsS0FBSzFtQixTQUFTLEVBQUV3UCxFQUFFLENBQUNtWCxhQUFhLENBQUMsRUFBRSxDQUFDO01BQzFELElBQUluWCxFQUFFLENBQUNrRSxRQUFRLENBQUMsQ0FBQyxFQUFFO1FBQ2pCLElBQUlsRSxFQUFFLENBQUNvWCx1QkFBdUIsQ0FBQyxDQUFDLEtBQUs1bUIsU0FBUyxFQUFFd1AsRUFBRSxDQUFDcVgsdUJBQXVCLENBQUMsQ0FBQyxJQUFJQyxJQUFJLENBQUMsQ0FBQyxDQUFDQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtRQUNwRyxJQUFJdlgsRUFBRSxDQUFDd1gsb0JBQW9CLENBQUMsQ0FBQyxLQUFLaG5CLFNBQVMsRUFBRXdQLEVBQUUsQ0FBQ3lYLG9CQUFvQixDQUFDLEtBQUssQ0FBQztNQUM3RTtJQUNGO0lBQ0EsT0FBTzNRLEtBQUssQ0FBQ3pJLE1BQU0sQ0FBQyxDQUFDO0VBQ3ZCOztFQUVVekcsZ0JBQWdCQSxDQUFBLEVBQUc7SUFDM0IsSUFBSSxJQUFJLENBQUN5RCxZQUFZLElBQUk3SyxTQUFTLElBQUksSUFBSSxDQUFDa25CLFNBQVMsQ0FBQy9iLE1BQU0sRUFBRSxJQUFJLENBQUNOLFlBQVksR0FBRyxJQUFJc2MsWUFBWSxDQUFDLElBQUksQ0FBQztJQUN2RyxJQUFJLElBQUksQ0FBQ3RjLFlBQVksS0FBSzdLLFNBQVMsRUFBRSxJQUFJLENBQUM2SyxZQUFZLENBQUN1YyxZQUFZLENBQUMsSUFBSSxDQUFDRixTQUFTLENBQUMvYixNQUFNLEdBQUcsQ0FBQyxDQUFDO0VBQ2hHOztFQUVBO0FBQ0Y7QUFDQTtFQUNFLE1BQWdCaEIsSUFBSUEsQ0FBQSxFQUFHO0lBQ3JCLElBQUksSUFBSSxDQUFDVSxZQUFZLEtBQUs3SyxTQUFTLElBQUksSUFBSSxDQUFDNkssWUFBWSxDQUFDd2MsU0FBUyxFQUFFLE1BQU0sSUFBSSxDQUFDeGMsWUFBWSxDQUFDVixJQUFJLENBQUMsQ0FBQztFQUNwRzs7RUFFQTs7RUFFQSxPQUFpQnFXLGVBQWVBLENBQUNELFdBQTJGLEVBQUV6YixRQUFpQixFQUFFakUsUUFBaUIsRUFBc0I7SUFDdEwsSUFBSXBCLE1BQStDLEdBQUdPLFNBQVM7SUFDL0QsSUFBSSxPQUFPdWdCLFdBQVcsS0FBSyxRQUFRLElBQUtBLFdBQVcsQ0FBa0NwRSxHQUFHLEVBQUUxYyxNQUFNLEdBQUcsSUFBSXFCLDJCQUFrQixDQUFDLEVBQUN3bUIsTUFBTSxFQUFFLElBQUkzaUIsNEJBQW1CLENBQUM0YixXQUFXLEVBQTJDemIsUUFBUSxFQUFFakUsUUFBUSxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ2xPLElBQUlWLGlCQUFRLENBQUMwVyxPQUFPLENBQUMwSixXQUFXLENBQUMsRUFBRTlnQixNQUFNLEdBQUcsSUFBSXFCLDJCQUFrQixDQUFDLEVBQUMyZixHQUFHLEVBQUVGLFdBQXVCLEVBQUMsQ0FBQyxDQUFDO0lBQ25HOWdCLE1BQU0sR0FBRyxJQUFJcUIsMkJBQWtCLENBQUN5ZixXQUEwQyxDQUFDO0lBQ2hGLElBQUk5Z0IsTUFBTSxDQUFDOG5CLGFBQWEsS0FBS3ZuQixTQUFTLEVBQUVQLE1BQU0sQ0FBQzhuQixhQUFhLEdBQUcsSUFBSTtJQUNuRSxPQUFPOW5CLE1BQU07RUFDZjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQWlCcVAsZUFBZUEsQ0FBQ2hCLEtBQUssRUFBRTtJQUN0Q0EsS0FBSyxDQUFDdVgsYUFBYSxDQUFDcmxCLFNBQVMsQ0FBQztJQUM5QjhOLEtBQUssQ0FBQ3dYLGFBQWEsQ0FBQ3RsQixTQUFTLENBQUM7SUFDOUI4TixLQUFLLENBQUNTLGdCQUFnQixDQUFDdk8sU0FBUyxDQUFDO0lBQ2pDOE4sS0FBSyxDQUFDVSxhQUFhLENBQUN4TyxTQUFTLENBQUM7SUFDOUI4TixLQUFLLENBQUNXLGNBQWMsQ0FBQ3pPLFNBQVMsQ0FBQztJQUMvQixPQUFPOE4sS0FBSztFQUNkOztFQUVBLE9BQWlCa0QsWUFBWUEsQ0FBQ2xELEtBQUssRUFBRTtJQUNuQyxJQUFJLENBQUNBLEtBQUssRUFBRSxPQUFPLEtBQUs7SUFDeEIsSUFBSSxDQUFDQSxLQUFLLENBQUNtRCxVQUFVLENBQUMsQ0FBQyxFQUFFLE9BQU8sS0FBSztJQUNyQyxJQUFJbkQsS0FBSyxDQUFDbUQsVUFBVSxDQUFDLENBQUMsQ0FBQzRTLGFBQWEsQ0FBQyxDQUFDLEtBQUs3akIsU0FBUyxFQUFFLE9BQU8sSUFBSSxDQUFDLENBQUM7SUFDbkUsSUFBSThOLEtBQUssQ0FBQ21ELFVBQVUsQ0FBQyxDQUFDLENBQUM2UyxhQUFhLENBQUMsQ0FBQyxLQUFLOWpCLFNBQVMsRUFBRSxPQUFPLElBQUk7SUFDakUsSUFBSThOLEtBQUssWUFBWWMsNEJBQW1CLEVBQUU7TUFDeEMsSUFBSWQsS0FBSyxDQUFDbUQsVUFBVSxDQUFDLENBQUMsQ0FBQzNDLGNBQWMsQ0FBQyxDQUFDLEtBQUt0TyxTQUFTLEVBQUUsT0FBTyxJQUFJLENBQUMsQ0FBQztJQUN0RSxDQUFDLE1BQU0sSUFBSThOLEtBQUssWUFBWThCLDBCQUFpQixFQUFFO01BQzdDLElBQUk5QixLQUFLLENBQUNtRCxVQUFVLENBQUMsQ0FBQyxDQUFDL0MsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLbE8sU0FBUyxFQUFFLE9BQU8sSUFBSSxDQUFDLENBQUM7SUFDeEUsQ0FBQyxNQUFNO01BQ0wsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLG9DQUFvQyxDQUFDO0lBQzdEO0lBQ0EsT0FBTyxLQUFLO0VBQ2Q7O0VBRUEsT0FBaUI0TCxpQkFBaUJBLENBQUNGLFVBQVUsRUFBRTtJQUM3QyxJQUFJbEYsT0FBTyxHQUFHLElBQUlzRyxzQkFBYSxDQUFDLENBQUM7SUFDakMsS0FBSyxJQUFJaE8sR0FBRyxJQUFJSCxNQUFNLENBQUNvWCxJQUFJLENBQUNySyxVQUFVLENBQUMsRUFBRTtNQUN2QyxJQUFJZ1IsR0FBRyxHQUFHaFIsVUFBVSxDQUFDNU0sR0FBRyxDQUFDO01BQ3pCLElBQUlBLEdBQUcsS0FBSyxlQUFlLEVBQUUwSCxPQUFPLENBQUMrQixRQUFRLENBQUNtVSxHQUFHLENBQUMsQ0FBQztNQUM5QyxJQUFJNWQsR0FBRyxLQUFLLFNBQVMsRUFBRTBILE9BQU8sQ0FBQ3dGLFVBQVUsQ0FBQzFGLE1BQU0sQ0FBQ29XLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDdkQsSUFBSTVkLEdBQUcsS0FBSyxrQkFBa0IsRUFBRTBILE9BQU8sQ0FBQ3lGLGtCQUFrQixDQUFDM0YsTUFBTSxDQUFDb1csR0FBRyxDQUFDLENBQUMsQ0FBQztNQUN4RSxJQUFJNWQsR0FBRyxLQUFLLGNBQWMsRUFBRTBILE9BQU8sQ0FBQytnQixpQkFBaUIsQ0FBQzdLLEdBQUcsQ0FBQyxDQUFDO01BQzNELElBQUk1ZCxHQUFHLEtBQUssS0FBSyxFQUFFMEgsT0FBTyxDQUFDZ2hCLE1BQU0sQ0FBQzlLLEdBQUcsQ0FBQyxDQUFDO01BQ3ZDLElBQUk1ZCxHQUFHLEtBQUssT0FBTyxFQUFFLENBQUUsQ0FBQyxDQUFDO01BQUEsS0FDekJ1UixPQUFPLENBQUNxUixHQUFHLENBQUMsOENBQThDLEdBQUc1aUIsR0FBRyxHQUFHLElBQUksR0FBRzRkLEdBQUcsQ0FBQztJQUNyRjtJQUNBLElBQUksRUFBRSxLQUFLbFcsT0FBTyxDQUFDaWhCLE1BQU0sQ0FBQyxDQUFDLEVBQUVqaEIsT0FBTyxDQUFDZ2hCLE1BQU0sQ0FBQ3puQixTQUFTLENBQUM7SUFDdEQsT0FBT3lHLE9BQU87RUFDaEI7O0VBRUEsT0FBaUI4RixvQkFBb0JBLENBQUNELGFBQWEsRUFBRTtJQUNuRCxJQUFJbkUsVUFBVSxHQUFHLElBQUlDLHlCQUFnQixDQUFDLENBQUM7SUFDdkMsS0FBSyxJQUFJckosR0FBRyxJQUFJSCxNQUFNLENBQUNvWCxJQUFJLENBQUMxSixhQUFhLENBQUMsRUFBRTtNQUMxQyxJQUFJcVEsR0FBRyxHQUFHclEsYUFBYSxDQUFDdk4sR0FBRyxDQUFDO01BQzVCLElBQUlBLEdBQUcsS0FBSyxlQUFlLEVBQUVvSixVQUFVLENBQUNFLGVBQWUsQ0FBQ3NVLEdBQUcsQ0FBQyxDQUFDO01BQ3hELElBQUk1ZCxHQUFHLEtBQUssZUFBZSxFQUFFb0osVUFBVSxDQUFDSyxRQUFRLENBQUNtVSxHQUFHLENBQUMsQ0FBQztNQUN0RCxJQUFJNWQsR0FBRyxLQUFLLFNBQVMsRUFBRW9KLFVBQVUsQ0FBQ3NGLFVBQVUsQ0FBQ2tQLEdBQUcsQ0FBQyxDQUFDO01BQ2xELElBQUk1ZCxHQUFHLEtBQUssU0FBUyxFQUFFb0osVUFBVSxDQUFDOEQsVUFBVSxDQUFDMUYsTUFBTSxDQUFDb1csR0FBRyxDQUFDLENBQUMsQ0FBQztNQUMxRCxJQUFJNWQsR0FBRyxLQUFLLGtCQUFrQixFQUFFb0osVUFBVSxDQUFDK0Qsa0JBQWtCLENBQUMzRixNQUFNLENBQUNvVyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQzNFLElBQUk1ZCxHQUFHLEtBQUsscUJBQXFCLEVBQUVvSixVQUFVLENBQUNnRSxvQkFBb0IsQ0FBQ3dRLEdBQUcsQ0FBQyxDQUFDO01BQ3hFLElBQUk1ZCxHQUFHLEtBQUssT0FBTyxFQUFFLENBQUUsSUFBSTRkLEdBQUcsRUFBRXhVLFVBQVUsQ0FBQ3VGLFFBQVEsQ0FBQ2lQLEdBQUcsQ0FBQyxDQUFFLENBQUM7TUFDM0QsSUFBSTVkLEdBQUcsS0FBSyxNQUFNLEVBQUVvSixVQUFVLENBQUN3RixTQUFTLENBQUNnUCxHQUFHLENBQUMsQ0FBQztNQUM5QyxJQUFJNWQsR0FBRyxLQUFLLGtCQUFrQixFQUFFb0osVUFBVSxDQUFDaUUsb0JBQW9CLENBQUN1USxHQUFHLENBQUMsQ0FBQztNQUNyRSxJQUFJNWQsR0FBRyxJQUFJLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFFO01BQUEsS0FDakN1UixPQUFPLENBQUNxUixHQUFHLENBQUMsaURBQWlELEdBQUc1aUIsR0FBRyxHQUFHLElBQUksR0FBRzRkLEdBQUcsQ0FBQztJQUN4RjtJQUNBLE9BQU94VSxVQUFVO0VBQ25COztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBaUJpTixnQkFBZ0JBLENBQUMzVixNQUErQixFQUFFK1AsRUFBRSxFQUFFeUYsZ0JBQWdCLEVBQUU7SUFDdkYsSUFBSSxDQUFDekYsRUFBRSxFQUFFQSxFQUFFLEdBQUcsSUFBSTJGLHVCQUFjLENBQUMsQ0FBQztJQUNsQyxJQUFJa0IsS0FBSyxHQUFHNVcsTUFBTSxDQUFDaVUsUUFBUSxDQUFDLENBQUMsS0FBSyxJQUFJO0lBQ3RDbEUsRUFBRSxDQUFDOFYsYUFBYSxDQUFDLElBQUksQ0FBQztJQUN0QjlWLEVBQUUsQ0FBQzJXLGNBQWMsQ0FBQyxLQUFLLENBQUM7SUFDeEIzVyxFQUFFLENBQUM4SixtQkFBbUIsQ0FBQyxDQUFDLENBQUM7SUFDekI5SixFQUFFLENBQUNnSCxXQUFXLENBQUNILEtBQUssQ0FBQztJQUNyQjdHLEVBQUUsQ0FBQzRXLFFBQVEsQ0FBQy9QLEtBQUssQ0FBQztJQUNsQjdHLEVBQUUsQ0FBQytHLFlBQVksQ0FBQ0YsS0FBSyxDQUFDO0lBQ3RCN0csRUFBRSxDQUFDNlcsWUFBWSxDQUFDLEtBQUssQ0FBQztJQUN0QjdXLEVBQUUsQ0FBQzhXLFdBQVcsQ0FBQyxLQUFLLENBQUM7SUFDckI5VyxFQUFFLENBQUMwVyxXQUFXLENBQUMsSUFBSSxDQUFDO0lBQ3BCMVcsRUFBRSxDQUFDbVksV0FBVyxDQUFDQyxvQkFBVyxDQUFDQyxTQUFTLENBQUM7SUFDckMsSUFBSTFZLFFBQVEsR0FBRyxJQUFJMlksK0JBQXNCLENBQUMsQ0FBQztJQUMzQzNZLFFBQVEsQ0FBQzRZLEtBQUssQ0FBQ3ZZLEVBQUUsQ0FBQztJQUNsQixJQUFJL1AsTUFBTSxDQUFDbVUsb0JBQW9CLENBQUMsQ0FBQyxJQUFJblUsTUFBTSxDQUFDbVUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDekksTUFBTSxLQUFLLENBQUMsRUFBRWdFLFFBQVEsQ0FBQ21HLG9CQUFvQixDQUFDN1YsTUFBTSxDQUFDbVUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hKLElBQUlvQixnQkFBZ0IsRUFBRTtNQUNwQixJQUFJK1MsVUFBVSxHQUFHLEVBQUU7TUFDbkIsS0FBSyxJQUFJQyxJQUFJLElBQUl4b0IsTUFBTSxDQUFDdVUsZUFBZSxDQUFDLENBQUMsRUFBRWdVLFVBQVUsQ0FBQ2hjLElBQUksQ0FBQ2ljLElBQUksQ0FBQ2xaLElBQUksQ0FBQyxDQUFDLENBQUM7TUFDdkVJLFFBQVEsQ0FBQ3FYLGVBQWUsQ0FBQ3dCLFVBQVUsQ0FBQztJQUN0QztJQUNBeFksRUFBRSxDQUFDaVgsbUJBQW1CLENBQUN0WCxRQUFRLENBQUM7SUFDaENLLEVBQUUsQ0FBQ25HLFlBQVksQ0FBQzVKLE1BQU0sQ0FBQzhVLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDdEMsSUFBSS9FLEVBQUUsQ0FBQ2tYLGFBQWEsQ0FBQyxDQUFDLEtBQUsxbUIsU0FBUyxFQUFFd1AsRUFBRSxDQUFDbVgsYUFBYSxDQUFDLEVBQUUsQ0FBQztJQUMxRCxJQUFJbG5CLE1BQU0sQ0FBQ2lVLFFBQVEsQ0FBQyxDQUFDLEVBQUU7TUFDckIsSUFBSWxFLEVBQUUsQ0FBQ29YLHVCQUF1QixDQUFDLENBQUMsS0FBSzVtQixTQUFTLEVBQUV3UCxFQUFFLENBQUNxWCx1QkFBdUIsQ0FBQyxDQUFDLElBQUlDLElBQUksQ0FBQyxDQUFDLENBQUNDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFO01BQ3BHLElBQUl2WCxFQUFFLENBQUN3WCxvQkFBb0IsQ0FBQyxDQUFDLEtBQUtobkIsU0FBUyxFQUFFd1AsRUFBRSxDQUFDeVgsb0JBQW9CLENBQUMsS0FBSyxDQUFDO0lBQzdFO0lBQ0EsT0FBT3pYLEVBQUU7RUFDWDs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQWlCMFksZUFBZUEsQ0FBQ0MsTUFBTSxFQUFFO0lBQ3ZDLElBQUk3UixLQUFLLEdBQUcsSUFBSThSLG9CQUFXLENBQUMsQ0FBQztJQUM3QjlSLEtBQUssQ0FBQytSLGdCQUFnQixDQUFDRixNQUFNLENBQUM3USxjQUFjLENBQUM7SUFDN0NoQixLQUFLLENBQUNnUyxnQkFBZ0IsQ0FBQ0gsTUFBTSxDQUFDL1EsY0FBYyxDQUFDO0lBQzdDZCxLQUFLLENBQUNpUyxjQUFjLENBQUNKLE1BQU0sQ0FBQ0ssWUFBWSxDQUFDO0lBQ3pDLElBQUlsUyxLQUFLLENBQUNpQixnQkFBZ0IsQ0FBQyxDQUFDLEtBQUt2WCxTQUFTLElBQUlzVyxLQUFLLENBQUNpQixnQkFBZ0IsQ0FBQyxDQUFDLENBQUNwTSxNQUFNLEtBQUssQ0FBQyxFQUFFbUwsS0FBSyxDQUFDK1IsZ0JBQWdCLENBQUNyb0IsU0FBUyxDQUFDO0lBQ3RILElBQUlzVyxLQUFLLENBQUNlLGdCQUFnQixDQUFDLENBQUMsS0FBS3JYLFNBQVMsSUFBSXNXLEtBQUssQ0FBQ2UsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDbE0sTUFBTSxLQUFLLENBQUMsRUFBRW1MLEtBQUssQ0FBQ2dTLGdCQUFnQixDQUFDdG9CLFNBQVMsQ0FBQztJQUN0SCxJQUFJc1csS0FBSyxDQUFDbVMsY0FBYyxDQUFDLENBQUMsS0FBS3pvQixTQUFTLElBQUlzVyxLQUFLLENBQUNtUyxjQUFjLENBQUMsQ0FBQyxDQUFDdGQsTUFBTSxLQUFLLENBQUMsRUFBRW1MLEtBQUssQ0FBQ2lTLGNBQWMsQ0FBQ3ZvQixTQUFTLENBQUM7SUFDaEgsT0FBT3NXLEtBQUs7RUFDZDs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBaUJmLHdCQUF3QkEsQ0FBQ21ULE1BQVcsRUFBRTFaLEdBQVMsRUFBRXZQLE1BQVksRUFBRTs7SUFFOUU7SUFDQSxJQUFJNlcsS0FBSyxHQUFHalgsZUFBZSxDQUFDNm9CLGVBQWUsQ0FBQ1EsTUFBTSxDQUFDOztJQUVuRDtJQUNBLElBQUk1VCxNQUFNLEdBQUc0VCxNQUFNLENBQUMzVCxRQUFRLEdBQUcyVCxNQUFNLENBQUMzVCxRQUFRLENBQUM1SixNQUFNLEdBQUd1ZCxNQUFNLENBQUMzUSxZQUFZLEdBQUcyUSxNQUFNLENBQUMzUSxZQUFZLENBQUM1TSxNQUFNLEdBQUcsQ0FBQzs7SUFFNUc7SUFDQSxJQUFJMkosTUFBTSxLQUFLLENBQUMsRUFBRTtNQUNoQjFPLGVBQU0sQ0FBQ0MsS0FBSyxDQUFDMkksR0FBRyxFQUFFaFAsU0FBUyxDQUFDO01BQzVCLE9BQU9zVyxLQUFLO0lBQ2Q7O0lBRUE7SUFDQSxJQUFJdEgsR0FBRyxFQUFFc0gsS0FBSyxDQUFDcVMsTUFBTSxDQUFDM1osR0FBRyxDQUFDLENBQUM7SUFDdEI7TUFDSEEsR0FBRyxHQUFHLEVBQUU7TUFDUixLQUFLLElBQUlrRyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdKLE1BQU0sRUFBRUksQ0FBQyxFQUFFLEVBQUVsRyxHQUFHLENBQUNoRCxJQUFJLENBQUMsSUFBSW1KLHVCQUFjLENBQUMsQ0FBQyxDQUFDO0lBQ2pFO0lBQ0EsS0FBSyxJQUFJM0YsRUFBRSxJQUFJUixHQUFHLEVBQUU7TUFDbEJRLEVBQUUsQ0FBQ29aLFFBQVEsQ0FBQ3RTLEtBQUssQ0FBQztNQUNsQjlHLEVBQUUsQ0FBQzhWLGFBQWEsQ0FBQyxJQUFJLENBQUM7SUFDeEI7SUFDQWhQLEtBQUssQ0FBQ3FTLE1BQU0sQ0FBQzNaLEdBQUcsQ0FBQzs7SUFFakI7SUFDQSxLQUFLLElBQUlqUSxHQUFHLElBQUlILE1BQU0sQ0FBQ29YLElBQUksQ0FBQzBTLE1BQU0sQ0FBQyxFQUFFO01BQ25DLElBQUkvTCxHQUFHLEdBQUcrTCxNQUFNLENBQUMzcEIsR0FBRyxDQUFDO01BQ3JCLElBQUlBLEdBQUcsS0FBSyxjQUFjLEVBQUUsS0FBSyxJQUFJbVcsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHeUgsR0FBRyxDQUFDeFIsTUFBTSxFQUFFK0osQ0FBQyxFQUFFLEVBQUVsRyxHQUFHLENBQUNrRyxDQUFDLENBQUMsQ0FBQzJULE9BQU8sQ0FBQ2xNLEdBQUcsQ0FBQ3pILENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDbkYsSUFBSW5XLEdBQUcsS0FBSyxhQUFhLEVBQUUsS0FBSyxJQUFJbVcsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHeUgsR0FBRyxDQUFDeFIsTUFBTSxFQUFFK0osQ0FBQyxFQUFFLEVBQUVsRyxHQUFHLENBQUNrRyxDQUFDLENBQUMsQ0FBQzRULE1BQU0sQ0FBQ25NLEdBQUcsQ0FBQ3pILENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDdEYsSUFBSW5XLEdBQUcsS0FBSyxjQUFjLEVBQUUsS0FBSyxJQUFJbVcsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHeUgsR0FBRyxDQUFDeFIsTUFBTSxFQUFFK0osQ0FBQyxFQUFFLEVBQUVsRyxHQUFHLENBQUNrRyxDQUFDLENBQUMsQ0FBQzZULFVBQVUsQ0FBQ3BNLEdBQUcsQ0FBQ3pILENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDM0YsSUFBSW5XLEdBQUcsS0FBSyxrQkFBa0IsRUFBRSxLQUFLLElBQUltVyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUd5SCxHQUFHLENBQUN4UixNQUFNLEVBQUUrSixDQUFDLEVBQUUsRUFBRWxHLEdBQUcsQ0FBQ2tHLENBQUMsQ0FBQyxDQUFDOFQsV0FBVyxDQUFDck0sR0FBRyxDQUFDekgsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNoRyxJQUFJblcsR0FBRyxLQUFLLFVBQVUsRUFBRSxLQUFLLElBQUltVyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUd5SCxHQUFHLENBQUN4UixNQUFNLEVBQUUrSixDQUFDLEVBQUUsRUFBRWxHLEdBQUcsQ0FBQ2tHLENBQUMsQ0FBQyxDQUFDK1QsTUFBTSxDQUFDMWlCLE1BQU0sQ0FBQ29XLEdBQUcsQ0FBQ3pILENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUMzRixJQUFJblcsR0FBRyxLQUFLLGFBQWEsRUFBRSxLQUFLLElBQUltVyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUd5SCxHQUFHLENBQUN4UixNQUFNLEVBQUUrSixDQUFDLEVBQUUsRUFBRWxHLEdBQUcsQ0FBQ2tHLENBQUMsQ0FBQyxDQUFDZ1UsU0FBUyxDQUFDdk0sR0FBRyxDQUFDekgsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUN6RixJQUFJblcsR0FBRyxLQUFLLGFBQWEsRUFBRTtRQUM5QixLQUFLLElBQUltVyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUd5SCxHQUFHLENBQUN4UixNQUFNLEVBQUUrSixDQUFDLEVBQUUsRUFBRTtVQUNuQyxJQUFJbEcsR0FBRyxDQUFDa0csQ0FBQyxDQUFDLENBQUNHLG1CQUFtQixDQUFDLENBQUMsSUFBSXJWLFNBQVMsRUFBRWdQLEdBQUcsQ0FBQ2tHLENBQUMsQ0FBQyxDQUFDdVIsbUJBQW1CLENBQUMsSUFBSXFCLCtCQUFzQixDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFDL1ksR0FBRyxDQUFDa0csQ0FBQyxDQUFDLENBQUMsQ0FBQztVQUNySGxHLEdBQUcsQ0FBQ2tHLENBQUMsQ0FBQyxDQUFDRyxtQkFBbUIsQ0FBQyxDQUFDLENBQUNPLFNBQVMsQ0FBQ3JQLE1BQU0sQ0FBQ29XLEdBQUcsQ0FBQ3pILENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEQ7TUFDRixDQUFDO01BQ0ksSUFBSW5XLEdBQUcsS0FBSyxnQkFBZ0IsSUFBSUEsR0FBRyxLQUFLLGdCQUFnQixJQUFJQSxHQUFHLEtBQUssY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO01BQUEsS0FDdkYsSUFBSUEsR0FBRyxLQUFLLHVCQUF1QixFQUFFO1FBQ3hDLElBQUlvcUIsa0JBQWtCLEdBQUd4TSxHQUFHO1FBQzVCLEtBQUssSUFBSXpILENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR2lVLGtCQUFrQixDQUFDaGUsTUFBTSxFQUFFK0osQ0FBQyxFQUFFLEVBQUU7VUFDbEQvVSxpQkFBUSxDQUFDaXBCLFVBQVUsQ0FBQ3BhLEdBQUcsQ0FBQ2tHLENBQUMsQ0FBQyxDQUFDbVUsU0FBUyxDQUFDLENBQUMsS0FBS3JwQixTQUFTLENBQUM7VUFDckRnUCxHQUFHLENBQUNrRyxDQUFDLENBQUMsQ0FBQ29VLFNBQVMsQ0FBQyxFQUFFLENBQUM7VUFDcEIsS0FBSyxJQUFJQyxhQUFhLElBQUlKLGtCQUFrQixDQUFDalUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDN0RsRyxHQUFHLENBQUNrRyxDQUFDLENBQUMsQ0FBQ21VLFNBQVMsQ0FBQyxDQUFDLENBQUNyZCxJQUFJLENBQUMsSUFBSXdkLDJCQUFrQixDQUFDLENBQUMsQ0FBQ0MsV0FBVyxDQUFDLElBQUkxRCx1QkFBYyxDQUFDLENBQUMsQ0FBQzJELE1BQU0sQ0FBQ0gsYUFBYSxDQUFDLENBQUMsQ0FBQ3hCLEtBQUssQ0FBQy9ZLEdBQUcsQ0FBQ2tHLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDekg7UUFDRjtNQUNGLENBQUM7TUFDSSxJQUFJblcsR0FBRyxLQUFLLHNCQUFzQixFQUFFO1FBQ3ZDLElBQUk0cUIsaUJBQWlCLEdBQUdoTixHQUFHO1FBQzNCLElBQUlpTixjQUFjLEdBQUcsQ0FBQztRQUN0QixLQUFLLElBQUlDLEtBQUssR0FBRyxDQUFDLEVBQUVBLEtBQUssR0FBR0YsaUJBQWlCLENBQUN4ZSxNQUFNLEVBQUUwZSxLQUFLLEVBQUUsRUFBRTtVQUM3RCxJQUFJQyxhQUFhLEdBQUdILGlCQUFpQixDQUFDRSxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUM7VUFDdkQsSUFBSTdhLEdBQUcsQ0FBQzZhLEtBQUssQ0FBQyxDQUFDeFUsbUJBQW1CLENBQUMsQ0FBQyxLQUFLclYsU0FBUyxFQUFFZ1AsR0FBRyxDQUFDNmEsS0FBSyxDQUFDLENBQUNwRCxtQkFBbUIsQ0FBQyxJQUFJcUIsK0JBQXNCLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUMvWSxHQUFHLENBQUM2YSxLQUFLLENBQUMsQ0FBQyxDQUFDO1VBQ2xJN2EsR0FBRyxDQUFDNmEsS0FBSyxDQUFDLENBQUN4VSxtQkFBbUIsQ0FBQyxDQUFDLENBQUNtUixlQUFlLENBQUMsRUFBRSxDQUFDO1VBQ3BELEtBQUssSUFBSXRTLE1BQU0sSUFBSTRWLGFBQWEsRUFBRTtZQUNoQyxJQUFJcnFCLE1BQU0sQ0FBQ3VVLGVBQWUsQ0FBQyxDQUFDLENBQUM3SSxNQUFNLEtBQUssQ0FBQyxFQUFFNkQsR0FBRyxDQUFDNmEsS0FBSyxDQUFDLENBQUN4VSxtQkFBbUIsQ0FBQyxDQUFDLENBQUNyQixlQUFlLENBQUMsQ0FBQyxDQUFDaEksSUFBSSxDQUFDLElBQUl1YSwwQkFBaUIsQ0FBQzltQixNQUFNLENBQUN1VSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDak0sVUFBVSxDQUFDLENBQUMsRUFBRXhCLE1BQU0sQ0FBQzJOLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUEsS0FDaExsRixHQUFHLENBQUM2YSxLQUFLLENBQUMsQ0FBQ3hVLG1CQUFtQixDQUFDLENBQUMsQ0FBQ3JCLGVBQWUsQ0FBQyxDQUFDLENBQUNoSSxJQUFJLENBQUMsSUFBSXVhLDBCQUFpQixDQUFDOW1CLE1BQU0sQ0FBQ3VVLGVBQWUsQ0FBQyxDQUFDLENBQUM0VixjQUFjLEVBQUUsQ0FBQyxDQUFDN2hCLFVBQVUsQ0FBQyxDQUFDLEVBQUV4QixNQUFNLENBQUMyTixNQUFNLENBQUMsQ0FBQyxDQUFDO1VBQzlKO1FBQ0Y7TUFDRixDQUFDO01BQ0k1RCxPQUFPLENBQUNxUixHQUFHLENBQUMsa0RBQWtELEdBQUc1aUIsR0FBRyxHQUFHLElBQUksR0FBRzRkLEdBQUcsQ0FBQztJQUN6Rjs7SUFFQSxPQUFPckcsS0FBSztFQUNkOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQWlCZCxtQkFBbUJBLENBQUNxUCxLQUFLLEVBQUVyVixFQUFFLEVBQUV1YSxVQUFVLEVBQUV0cUIsTUFBTSxFQUFFO0lBQ2xFLElBQUk2VyxLQUFLLEdBQUdqWCxlQUFlLENBQUM2b0IsZUFBZSxDQUFDckQsS0FBSyxDQUFDO0lBQ2xEdk8sS0FBSyxDQUFDcVMsTUFBTSxDQUFDLENBQUN0cEIsZUFBZSxDQUFDeWxCLHdCQUF3QixDQUFDRCxLQUFLLEVBQUVyVixFQUFFLEVBQUV1YSxVQUFVLEVBQUV0cUIsTUFBTSxDQUFDLENBQUNtcEIsUUFBUSxDQUFDdFMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUN2RyxPQUFPQSxLQUFLO0VBQ2Q7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBaUJ3Tyx3QkFBd0JBLENBQUNELEtBQVUsRUFBRXJWLEVBQVEsRUFBRXVhLFVBQWdCLEVBQUV0cUIsTUFBWSxFQUFFLENBQUc7O0lBRWpHO0lBQ0EsSUFBSSxDQUFDK1AsRUFBRSxFQUFFQSxFQUFFLEdBQUcsSUFBSTJGLHVCQUFjLENBQUMsQ0FBQzs7SUFFbEM7SUFDQSxJQUFJMFAsS0FBSyxDQUFDbUYsSUFBSSxLQUFLaHFCLFNBQVMsRUFBRStwQixVQUFVLEdBQUcxcUIsZUFBZSxDQUFDNHFCLGFBQWEsQ0FBQ3BGLEtBQUssQ0FBQ21GLElBQUksRUFBRXhhLEVBQUUsQ0FBQyxDQUFDO0lBQ3BGcEosZUFBTSxDQUFDQyxLQUFLLENBQUMsT0FBTzBqQixVQUFVLEVBQUUsU0FBUyxFQUFFLDJFQUEyRSxDQUFDOztJQUU1SDtJQUNBO0lBQ0EsSUFBSUcsTUFBTTtJQUNWLElBQUkvYSxRQUFRO0lBQ1osS0FBSyxJQUFJcFEsR0FBRyxJQUFJSCxNQUFNLENBQUNvWCxJQUFJLENBQUM2TyxLQUFLLENBQUMsRUFBRTtNQUNsQyxJQUFJbEksR0FBRyxHQUFHa0ksS0FBSyxDQUFDOWxCLEdBQUcsQ0FBQztNQUNwQixJQUFJQSxHQUFHLEtBQUssTUFBTSxFQUFFeVEsRUFBRSxDQUFDcVosT0FBTyxDQUFDbE0sR0FBRyxDQUFDLENBQUM7TUFDL0IsSUFBSTVkLEdBQUcsS0FBSyxTQUFTLEVBQUV5USxFQUFFLENBQUNxWixPQUFPLENBQUNsTSxHQUFHLENBQUMsQ0FBQztNQUN2QyxJQUFJNWQsR0FBRyxLQUFLLEtBQUssRUFBRXlRLEVBQUUsQ0FBQ3laLE1BQU0sQ0FBQzFpQixNQUFNLENBQUNvVyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQzFDLElBQUk1ZCxHQUFHLEtBQUssTUFBTSxFQUFFLENBQUUsSUFBSTRkLEdBQUcsRUFBRW5OLEVBQUUsQ0FBQytNLE9BQU8sQ0FBQ0ksR0FBRyxDQUFDLENBQUUsQ0FBQztNQUNqRCxJQUFJNWQsR0FBRyxLQUFLLFFBQVEsRUFBRXlRLEVBQUUsQ0FBQ3NaLE1BQU0sQ0FBQ25NLEdBQUcsQ0FBQyxDQUFDO01BQ3JDLElBQUk1ZCxHQUFHLEtBQUssTUFBTSxFQUFFLENBQUUsQ0FBQyxDQUFDO01BQUEsS0FDeEIsSUFBSUEsR0FBRyxLQUFLLFNBQVMsRUFBRXlRLEVBQUUsQ0FBQzJhLE9BQU8sQ0FBQ3hOLEdBQUcsQ0FBQyxDQUFDO01BQ3ZDLElBQUk1ZCxHQUFHLEtBQUssYUFBYSxFQUFFeVEsRUFBRSxDQUFDbVgsYUFBYSxDQUFDaEssR0FBRyxDQUFDLENBQUM7TUFDakQsSUFBSTVkLEdBQUcsS0FBSyxRQUFRLEVBQUV5USxFQUFFLENBQUMwWixTQUFTLENBQUN2TSxHQUFHLENBQUMsQ0FBQztNQUN4QyxJQUFJNWQsR0FBRyxLQUFLLFFBQVEsRUFBRXlRLEVBQUUsQ0FBQzBXLFdBQVcsQ0FBQ3ZKLEdBQUcsQ0FBQyxDQUFDO01BQzFDLElBQUk1ZCxHQUFHLEtBQUssU0FBUyxFQUFFeVEsRUFBRSxDQUFDdVosVUFBVSxDQUFDcE0sR0FBRyxDQUFDLENBQUM7TUFDMUMsSUFBSTVkLEdBQUcsS0FBSyxhQUFhLEVBQUV5USxFQUFFLENBQUN3WixXQUFXLENBQUNyTSxHQUFHLENBQUMsQ0FBQztNQUMvQyxJQUFJNWQsR0FBRyxLQUFLLG1CQUFtQixFQUFFeVEsRUFBRSxDQUFDeVgsb0JBQW9CLENBQUN0SyxHQUFHLENBQUMsQ0FBQztNQUM5RCxJQUFJNWQsR0FBRyxLQUFLLGNBQWMsSUFBSUEsR0FBRyxLQUFLLFFBQVEsRUFBRTtRQUNuRCxJQUFJeVEsRUFBRSxDQUFDYSxjQUFjLENBQUMsQ0FBQyxFQUFFO1VBQ3ZCLElBQUksQ0FBQzZaLE1BQU0sRUFBRUEsTUFBTSxHQUFHLElBQUlFLDBCQUFpQixDQUFDLENBQUM7VUFDN0NGLE1BQU0sQ0FBQ3hYLFNBQVMsQ0FBQ2lLLEdBQUcsQ0FBQztRQUN2QjtNQUNGLENBQUM7TUFDSSxJQUFJNWQsR0FBRyxLQUFLLFdBQVcsRUFBRTtRQUM1QixJQUFJeVEsRUFBRSxDQUFDYSxjQUFjLENBQUMsQ0FBQyxFQUFFO1VBQ3ZCLElBQUksQ0FBQzZaLE1BQU0sRUFBRUEsTUFBTSxHQUFHLElBQUlFLDBCQUFpQixDQUFDLENBQUM7VUFDN0NGLE1BQU0sQ0FBQ0csWUFBWSxDQUFDMU4sR0FBRyxDQUFDO1FBQzFCLENBQUMsTUFBTTs7VUFDTDtRQUFBLENBRUosQ0FBQztNQUNJLElBQUk1ZCxHQUFHLEtBQUssZUFBZSxFQUFFeVEsRUFBRSxDQUFDOEosbUJBQW1CLENBQUNxRCxHQUFHLENBQUMsQ0FBQztNQUN6RCxJQUFJNWQsR0FBRyxLQUFLLG1DQUFtQyxFQUFFO1FBQ3BELElBQUlvUSxRQUFRLEtBQUtuUCxTQUFTLEVBQUVtUCxRQUFRLEdBQUcsQ0FBQzRhLFVBQVUsR0FBRyxJQUFJakMsK0JBQXNCLENBQUMsQ0FBQyxHQUFHLElBQUl3QywrQkFBc0IsQ0FBQyxDQUFDLEVBQUV2QyxLQUFLLENBQUN2WSxFQUFFLENBQUM7UUFDM0gsSUFBSSxDQUFDdWEsVUFBVSxFQUFFNWEsUUFBUSxDQUFDb2IsNEJBQTRCLENBQUM1TixHQUFHLENBQUM7TUFDN0QsQ0FBQztNQUNJLElBQUk1ZCxHQUFHLEtBQUssUUFBUSxFQUFFO1FBQ3pCLElBQUlvUSxRQUFRLEtBQUtuUCxTQUFTLEVBQUVtUCxRQUFRLEdBQUcsQ0FBQzRhLFVBQVUsR0FBRyxJQUFJakMsK0JBQXNCLENBQUMsQ0FBQyxHQUFHLElBQUl3QywrQkFBc0IsQ0FBQyxDQUFDLEVBQUV2QyxLQUFLLENBQUN2WSxFQUFFLENBQUM7UUFDM0hMLFFBQVEsQ0FBQ3lHLFNBQVMsQ0FBQ3JQLE1BQU0sQ0FBQ29XLEdBQUcsQ0FBQyxDQUFDO01BQ2pDLENBQUM7TUFDSSxJQUFJNWQsR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBRTtNQUFBLEtBQzNCLElBQUlBLEdBQUcsS0FBSyxTQUFTLEVBQUU7UUFDMUIsSUFBSSxDQUFDZ3JCLFVBQVUsRUFBRTtVQUNmLElBQUksQ0FBQzVhLFFBQVEsRUFBRUEsUUFBUSxHQUFHLElBQUltYiwrQkFBc0IsQ0FBQyxDQUFDLENBQUN2QyxLQUFLLENBQUN2WSxFQUFFLENBQUM7VUFDaEVMLFFBQVEsQ0FBQzFCLFVBQVUsQ0FBQ2tQLEdBQUcsQ0FBQztRQUMxQjtNQUNGLENBQUM7TUFDSSxJQUFJNWQsR0FBRyxLQUFLLFlBQVksRUFBRTtRQUM3QixJQUFJLEVBQUUsS0FBSzRkLEdBQUcsSUFBSXhILHVCQUFjLENBQUNxVixrQkFBa0IsS0FBSzdOLEdBQUcsRUFBRW5OLEVBQUUsQ0FBQ25HLFlBQVksQ0FBQ3NULEdBQUcsQ0FBQyxDQUFDLENBQUU7TUFDdEYsQ0FBQztNQUNJLElBQUk1ZCxHQUFHLEtBQUssZUFBZSxFQUFFLElBQUFxSCxlQUFNLEVBQUN5ZSxLQUFLLENBQUN2USxlQUFlLENBQUMsQ0FBQyxDQUFFO01BQUEsS0FDN0QsSUFBSXZWLEdBQUcsS0FBSyxpQkFBaUIsRUFBRTtRQUNsQyxJQUFJLENBQUNvUSxRQUFRLEVBQUVBLFFBQVEsR0FBRyxDQUFDNGEsVUFBVSxHQUFHLElBQUlqQywrQkFBc0IsQ0FBQyxDQUFDLEdBQUcsSUFBSXdDLCtCQUFzQixDQUFDLENBQUMsRUFBRXZDLEtBQUssQ0FBQ3ZZLEVBQUUsQ0FBQztRQUM5RyxJQUFJaWIsVUFBVSxHQUFHOU4sR0FBRztRQUNwQnhOLFFBQVEsQ0FBQzlHLGVBQWUsQ0FBQ29pQixVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUNsaUIsS0FBSyxDQUFDO1FBQzdDLElBQUl3aEIsVUFBVSxFQUFFO1VBQ2QsSUFBSTljLGlCQUFpQixHQUFHLEVBQUU7VUFDMUIsS0FBSyxJQUFJeWQsUUFBUSxJQUFJRCxVQUFVLEVBQUV4ZCxpQkFBaUIsQ0FBQ2pCLElBQUksQ0FBQzBlLFFBQVEsQ0FBQ2ppQixLQUFLLENBQUM7VUFDdkUwRyxRQUFRLENBQUNtRyxvQkFBb0IsQ0FBQ3JJLGlCQUFpQixDQUFDO1FBQ2xELENBQUMsTUFBTTtVQUNMN0csZUFBTSxDQUFDQyxLQUFLLENBQUNva0IsVUFBVSxDQUFDdGYsTUFBTSxFQUFFLENBQUMsQ0FBQztVQUNsQ2dFLFFBQVEsQ0FBQ3diLGtCQUFrQixDQUFDRixVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUNoaUIsS0FBSyxDQUFDO1FBQ2xEO01BQ0YsQ0FBQztNQUNJLElBQUkxSixHQUFHLEtBQUssY0FBYyxJQUFJQSxHQUFHLElBQUksWUFBWSxFQUFFO1FBQ3RELElBQUFxSCxlQUFNLEVBQUMyakIsVUFBVSxDQUFDO1FBQ2xCLElBQUlqVyxZQUFZLEdBQUcsRUFBRTtRQUNyQixLQUFLLElBQUk4VyxjQUFjLElBQUlqTyxHQUFHLEVBQUU7VUFDOUIsSUFBSTVJLFdBQVcsR0FBRyxJQUFJd1MsMEJBQWlCLENBQUMsQ0FBQztVQUN6Q3pTLFlBQVksQ0FBQzlILElBQUksQ0FBQytILFdBQVcsQ0FBQztVQUM5QixLQUFLLElBQUk4VyxjQUFjLElBQUlqc0IsTUFBTSxDQUFDb1gsSUFBSSxDQUFDNFUsY0FBYyxDQUFDLEVBQUU7WUFDdEQsSUFBSUMsY0FBYyxLQUFLLFNBQVMsRUFBRTlXLFdBQVcsQ0FBQ3RHLFVBQVUsQ0FBQ21kLGNBQWMsQ0FBQ0MsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUNwRixJQUFJQSxjQUFjLEtBQUssUUFBUSxFQUFFOVcsV0FBVyxDQUFDNkIsU0FBUyxDQUFDclAsTUFBTSxDQUFDcWtCLGNBQWMsQ0FBQ0MsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9GLE1BQU0sSUFBSTVxQixvQkFBVyxDQUFDLDhDQUE4QyxHQUFHNHFCLGNBQWMsQ0FBQztVQUM3RjtRQUNGO1FBQ0EsSUFBSTFiLFFBQVEsS0FBS25QLFNBQVMsRUFBRW1QLFFBQVEsR0FBRyxJQUFJMlksK0JBQXNCLENBQUMsRUFBQ3RZLEVBQUUsRUFBRUEsRUFBRSxFQUFDLENBQUM7UUFDM0VMLFFBQVEsQ0FBQ3FYLGVBQWUsQ0FBQzFTLFlBQVksQ0FBQztNQUN4QyxDQUFDO01BQ0ksSUFBSS9VLEdBQUcsS0FBSyxnQkFBZ0IsSUFBSTRkLEdBQUcsS0FBSzNjLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztNQUFBLEtBQ3RELElBQUlqQixHQUFHLEtBQUssZ0JBQWdCLElBQUk0ZCxHQUFHLEtBQUszYyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7TUFBQSxLQUN0RCxJQUFJakIsR0FBRyxLQUFLLFdBQVcsRUFBRXlRLEVBQUUsQ0FBQ3NiLFdBQVcsQ0FBQ3ZrQixNQUFNLENBQUNvVyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQ3JELElBQUk1ZCxHQUFHLEtBQUssWUFBWSxFQUFFeVEsRUFBRSxDQUFDdWIsWUFBWSxDQUFDeGtCLE1BQU0sQ0FBQ29XLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDdkQsSUFBSTVkLEdBQUcsS0FBSyxnQkFBZ0IsRUFBRXlRLEVBQUUsQ0FBQ3diLGdCQUFnQixDQUFDck8sR0FBRyxLQUFLLEVBQUUsR0FBRzNjLFNBQVMsR0FBRzJjLEdBQUcsQ0FBQyxDQUFDO01BQ2hGLElBQUk1ZCxHQUFHLEtBQUssZUFBZSxFQUFFeVEsRUFBRSxDQUFDeWIsZUFBZSxDQUFDMWtCLE1BQU0sQ0FBQ29XLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDN0QsSUFBSTVkLEdBQUcsS0FBSyxlQUFlLEVBQUV5USxFQUFFLENBQUMwYixrQkFBa0IsQ0FBQ3ZPLEdBQUcsQ0FBQyxDQUFDO01BQ3hELElBQUk1ZCxHQUFHLEtBQUssT0FBTyxFQUFFeVEsRUFBRSxDQUFDMmIsV0FBVyxDQUFDeE8sR0FBRyxDQUFDLENBQUM7TUFDekMsSUFBSTVkLEdBQUcsS0FBSyxXQUFXLEVBQUV5USxFQUFFLENBQUNtWSxXQUFXLENBQUNoTCxHQUFHLENBQUMsQ0FBQztNQUM3QyxJQUFJNWQsR0FBRyxLQUFLLGtCQUFrQixFQUFFO1FBQ25DLElBQUlxc0IsY0FBYyxHQUFHek8sR0FBRyxDQUFDME8sVUFBVTtRQUNuQ2xyQixpQkFBUSxDQUFDaXBCLFVBQVUsQ0FBQzVaLEVBQUUsQ0FBQzZaLFNBQVMsQ0FBQyxDQUFDLEtBQUtycEIsU0FBUyxDQUFDO1FBQ2pEd1AsRUFBRSxDQUFDOFosU0FBUyxDQUFDLEVBQUUsQ0FBQztRQUNoQixLQUFLLElBQUlDLGFBQWEsSUFBSTZCLGNBQWMsRUFBRTtVQUN4QzViLEVBQUUsQ0FBQzZaLFNBQVMsQ0FBQyxDQUFDLENBQUNyZCxJQUFJLENBQUMsSUFBSXdkLDJCQUFrQixDQUFDLENBQUMsQ0FBQ0MsV0FBVyxDQUFDLElBQUkxRCx1QkFBYyxDQUFDLENBQUMsQ0FBQzJELE1BQU0sQ0FBQ0gsYUFBYSxDQUFDLENBQUMsQ0FBQ3hCLEtBQUssQ0FBQ3ZZLEVBQUUsQ0FBQyxDQUFDO1FBQ2pIO01BQ0YsQ0FBQztNQUNJLElBQUl6USxHQUFHLEtBQUssaUJBQWlCLEVBQUU7UUFDbENvQixpQkFBUSxDQUFDaXBCLFVBQVUsQ0FBQ1csVUFBVSxDQUFDO1FBQy9CLElBQUlELGFBQWEsR0FBR25OLEdBQUcsQ0FBQzJPLE9BQU87UUFDL0JsbEIsZUFBTSxDQUFDQyxLQUFLLENBQUM1RyxNQUFNLENBQUN1VSxlQUFlLENBQUMsQ0FBQyxDQUFDN0ksTUFBTSxFQUFFMmUsYUFBYSxDQUFDM2UsTUFBTSxDQUFDO1FBQ25FLElBQUlnRSxRQUFRLEtBQUtuUCxTQUFTLEVBQUVtUCxRQUFRLEdBQUcsSUFBSTJZLCtCQUFzQixDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFDdlksRUFBRSxDQUFDO1FBQzdFTCxRQUFRLENBQUNxWCxlQUFlLENBQUMsRUFBRSxDQUFDO1FBQzVCLEtBQUssSUFBSXRSLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR3pWLE1BQU0sQ0FBQ3VVLGVBQWUsQ0FBQyxDQUFDLENBQUM3SSxNQUFNLEVBQUUrSixDQUFDLEVBQUUsRUFBRTtVQUN4RC9GLFFBQVEsQ0FBQzZFLGVBQWUsQ0FBQyxDQUFDLENBQUNoSSxJQUFJLENBQUMsSUFBSXVhLDBCQUFpQixDQUFDOW1CLE1BQU0sQ0FBQ3VVLGVBQWUsQ0FBQyxDQUFDLENBQUNrQixDQUFDLENBQUMsQ0FBQ25OLFVBQVUsQ0FBQyxDQUFDLEVBQUV4QixNQUFNLENBQUN1akIsYUFBYSxDQUFDNVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVIO01BQ0YsQ0FBQztNQUNJNUUsT0FBTyxDQUFDcVIsR0FBRyxDQUFDLGdFQUFnRSxHQUFHNWlCLEdBQUcsR0FBRyxJQUFJLEdBQUc0ZCxHQUFHLENBQUM7SUFDdkc7O0lBRUE7SUFDQSxJQUFJdU4sTUFBTSxFQUFFMWEsRUFBRSxDQUFDK2IsUUFBUSxDQUFDLElBQUlDLG9CQUFXLENBQUN0QixNQUFNLENBQUMsQ0FBQ3ZCLE1BQU0sQ0FBQyxDQUFDblosRUFBRSxDQUFDLENBQUMsQ0FBQzs7SUFFN0Q7SUFDQSxJQUFJTCxRQUFRLEVBQUU7TUFDWixJQUFJSyxFQUFFLENBQUNhLGNBQWMsQ0FBQyxDQUFDLEtBQUtyUSxTQUFTLEVBQUV3UCxFQUFFLENBQUMyVyxjQUFjLENBQUMsS0FBSyxDQUFDO01BQy9ELElBQUksQ0FBQ2hYLFFBQVEsQ0FBQ0MsS0FBSyxDQUFDLENBQUMsQ0FBQ2lCLGNBQWMsQ0FBQyxDQUFDLEVBQUViLEVBQUUsQ0FBQzhKLG1CQUFtQixDQUFDLENBQUMsQ0FBQztNQUNqRSxJQUFJeVEsVUFBVSxFQUFFO1FBQ2R2YSxFQUFFLENBQUM4VixhQUFhLENBQUMsSUFBSSxDQUFDO1FBQ3RCLElBQUk5VixFQUFFLENBQUM2RixtQkFBbUIsQ0FBQyxDQUFDLEVBQUU7VUFDNUIsSUFBSWxHLFFBQVEsQ0FBQzZFLGVBQWUsQ0FBQyxDQUFDLEVBQUV4RSxFQUFFLENBQUM2RixtQkFBbUIsQ0FBQyxDQUFDLENBQUNtUixlQUFlLENBQUN4bUIsU0FBUyxDQUFDLENBQUMsQ0FBQztVQUNyRndQLEVBQUUsQ0FBQzZGLG1CQUFtQixDQUFDLENBQUMsQ0FBQ29XLEtBQUssQ0FBQ3RjLFFBQVEsQ0FBQztRQUMxQyxDQUFDO1FBQ0lLLEVBQUUsQ0FBQ2lYLG1CQUFtQixDQUFDdFgsUUFBUSxDQUFDO01BQ3ZDLENBQUMsTUFBTTtRQUNMSyxFQUFFLENBQUM2VixhQUFhLENBQUMsSUFBSSxDQUFDO1FBQ3RCN1YsRUFBRSxDQUFDa2Msb0JBQW9CLENBQUMsQ0FBQ3ZjLFFBQVEsQ0FBQyxDQUFDO01BQ3JDO0lBQ0Y7O0lBRUE7SUFDQSxPQUFPSyxFQUFFO0VBQ1g7O0VBRUEsT0FBaUJvVyxzQkFBc0JBLENBQUNELFNBQVMsRUFBRTs7SUFFakQ7SUFDQSxJQUFJblcsRUFBRSxHQUFHLElBQUkyRix1QkFBYyxDQUFDLENBQUM7SUFDN0IzRixFQUFFLENBQUMyVyxjQUFjLENBQUMsSUFBSSxDQUFDO0lBQ3ZCM1csRUFBRSxDQUFDZ0gsV0FBVyxDQUFDLEtBQUssQ0FBQztJQUNyQmhILEVBQUUsQ0FBQytHLFlBQVksQ0FBQyxJQUFJLENBQUM7SUFDckIvRyxFQUFFLENBQUM4VyxXQUFXLENBQUMsS0FBSyxDQUFDOztJQUVyQjtJQUNBLElBQUl0VyxNQUFNLEdBQUcsSUFBSXdaLDJCQUFrQixDQUFDLEVBQUNoYSxFQUFFLEVBQUVBLEVBQUUsRUFBQyxDQUFDO0lBQzdDLEtBQUssSUFBSXpRLEdBQUcsSUFBSUgsTUFBTSxDQUFDb1gsSUFBSSxDQUFDMlAsU0FBUyxDQUFDLEVBQUU7TUFDdEMsSUFBSWhKLEdBQUcsR0FBR2dKLFNBQVMsQ0FBQzVtQixHQUFHLENBQUM7TUFDeEIsSUFBSUEsR0FBRyxLQUFLLFFBQVEsRUFBRWlSLE1BQU0sQ0FBQzRGLFNBQVMsQ0FBQ3JQLE1BQU0sQ0FBQ29XLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDL0MsSUFBSTVkLEdBQUcsS0FBSyxPQUFPLEVBQUVpUixNQUFNLENBQUMyYixVQUFVLENBQUNoUCxHQUFHLENBQUMsQ0FBQztNQUM1QyxJQUFJNWQsR0FBRyxLQUFLLFdBQVcsRUFBRSxDQUFFLElBQUksRUFBRSxLQUFLNGQsR0FBRyxFQUFFM00sTUFBTSxDQUFDeVosV0FBVyxDQUFDLElBQUkxRCx1QkFBYyxDQUFDcEosR0FBRyxDQUFDLENBQUMsQ0FBRSxDQUFDO01BQ3pGLElBQUk1ZCxHQUFHLEtBQUssY0FBYyxFQUFFaVIsTUFBTSxDQUFDeEgsUUFBUSxDQUFDbVUsR0FBRyxDQUFDLENBQUM7TUFDakQsSUFBSTVkLEdBQUcsS0FBSyxTQUFTLEVBQUV5USxFQUFFLENBQUNxWixPQUFPLENBQUNsTSxHQUFHLENBQUMsQ0FBQztNQUN2QyxJQUFJNWQsR0FBRyxLQUFLLFVBQVUsRUFBRXlRLEVBQUUsQ0FBQzBXLFdBQVcsQ0FBQyxDQUFDdkosR0FBRyxDQUFDLENBQUM7TUFDN0MsSUFBSTVkLEdBQUcsS0FBSyxRQUFRLEVBQUVpUixNQUFNLENBQUM0YixXQUFXLENBQUNqUCxHQUFHLENBQUMsQ0FBQztNQUM5QyxJQUFJNWQsR0FBRyxLQUFLLFFBQVEsRUFBRWlSLE1BQU0sQ0FBQzZiLG1CQUFtQixDQUFDbFAsR0FBRyxDQUFDLENBQUM7TUFDdEQsSUFBSTVkLEdBQUcsS0FBSyxlQUFlLEVBQUU7UUFDaENpUixNQUFNLENBQUMzSCxlQUFlLENBQUNzVSxHQUFHLENBQUNwVSxLQUFLLENBQUM7UUFDakN5SCxNQUFNLENBQUMyYSxrQkFBa0IsQ0FBQ2hPLEdBQUcsQ0FBQ2xVLEtBQUssQ0FBQztNQUN0QyxDQUFDO01BQ0ksSUFBSTFKLEdBQUcsS0FBSyxjQUFjLEVBQUV5USxFQUFFLENBQUMrYixRQUFRLENBQUUsSUFBSUMsb0JBQVcsQ0FBQyxDQUFDLENBQUM5WSxTQUFTLENBQUNpSyxHQUFHLENBQUMsQ0FBaUJnTSxNQUFNLENBQUMsQ0FBQ25aLEVBQUUsQ0FBYSxDQUFDLENBQUMsQ0FBQztNQUNwSGMsT0FBTyxDQUFDcVIsR0FBRyxDQUFDLGtEQUFrRCxHQUFHNWlCLEdBQUcsR0FBRyxJQUFJLEdBQUc0ZCxHQUFHLENBQUM7SUFDekY7O0lBRUE7SUFDQW5OLEVBQUUsQ0FBQ3NjLFVBQVUsQ0FBQyxDQUFDOWIsTUFBTSxDQUFDLENBQUM7SUFDdkIsT0FBT1IsRUFBRTtFQUNYOztFQUVBLE9BQWlCZ0ksMEJBQTBCQSxDQUFDdVUseUJBQXlCLEVBQUU7SUFDckUsSUFBSXpWLEtBQUssR0FBRyxJQUFJOFIsb0JBQVcsQ0FBQyxDQUFDO0lBQzdCLEtBQUssSUFBSXJwQixHQUFHLElBQUlILE1BQU0sQ0FBQ29YLElBQUksQ0FBQytWLHlCQUF5QixDQUFDLEVBQUU7TUFDdEQsSUFBSXBQLEdBQUcsR0FBR29QLHlCQUF5QixDQUFDaHRCLEdBQUcsQ0FBQztNQUN4QyxJQUFJQSxHQUFHLEtBQUssTUFBTSxFQUFFO1FBQ2xCdVgsS0FBSyxDQUFDcVMsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUNoQixLQUFLLElBQUlyWixLQUFLLElBQUlxTixHQUFHLEVBQUU7VUFDckIsSUFBSW5OLEVBQUUsR0FBR25RLGVBQWUsQ0FBQ3lsQix3QkFBd0IsQ0FBQ3hWLEtBQUssRUFBRXRQLFNBQVMsRUFBRSxJQUFJLENBQUM7VUFDekV3UCxFQUFFLENBQUNvWixRQUFRLENBQUN0UyxLQUFLLENBQUM7VUFDbEJBLEtBQUssQ0FBQ3pJLE1BQU0sQ0FBQyxDQUFDLENBQUM3QixJQUFJLENBQUN3RCxFQUFFLENBQUM7UUFDekI7TUFDRixDQUFDO01BQ0ksSUFBSXpRLEdBQUcsS0FBSyxTQUFTLEVBQUUsQ0FBRSxDQUFDLENBQUM7TUFBQSxLQUMzQnVSLE9BQU8sQ0FBQ3FSLEdBQUcsQ0FBQyx5REFBeUQsR0FBRzVpQixHQUFHLEdBQUcsSUFBSSxHQUFHNGQsR0FBRyxDQUFDO0lBQ2hHO0lBQ0EsT0FBT3JHLEtBQUs7RUFDZDs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQWlCMlQsYUFBYUEsQ0FBQytCLE9BQU8sRUFBRXhjLEVBQUUsRUFBRTtJQUMxQyxJQUFJdWEsVUFBVTtJQUNkLElBQUlpQyxPQUFPLEtBQUssSUFBSSxFQUFFO01BQ3BCakMsVUFBVSxHQUFHLEtBQUs7TUFDbEJ2YSxFQUFFLENBQUMyVyxjQUFjLENBQUMsSUFBSSxDQUFDO01BQ3ZCM1csRUFBRSxDQUFDZ0gsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQmhILEVBQUUsQ0FBQytHLFlBQVksQ0FBQyxJQUFJLENBQUM7TUFDckIvRyxFQUFFLENBQUM0VyxRQUFRLENBQUMsSUFBSSxDQUFDO01BQ2pCNVcsRUFBRSxDQUFDOFcsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQjlXLEVBQUUsQ0FBQzZXLFlBQVksQ0FBQyxLQUFLLENBQUM7SUFDeEIsQ0FBQyxNQUFNLElBQUkyRixPQUFPLEtBQUssS0FBSyxFQUFFO01BQzVCakMsVUFBVSxHQUFHLElBQUk7TUFDakJ2YSxFQUFFLENBQUMyVyxjQUFjLENBQUMsSUFBSSxDQUFDO01BQ3ZCM1csRUFBRSxDQUFDZ0gsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQmhILEVBQUUsQ0FBQytHLFlBQVksQ0FBQyxJQUFJLENBQUM7TUFDckIvRyxFQUFFLENBQUM0VyxRQUFRLENBQUMsSUFBSSxDQUFDO01BQ2pCNVcsRUFBRSxDQUFDOFcsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQjlXLEVBQUUsQ0FBQzZXLFlBQVksQ0FBQyxLQUFLLENBQUM7SUFDeEIsQ0FBQyxNQUFNLElBQUkyRixPQUFPLEtBQUssTUFBTSxFQUFFO01BQzdCakMsVUFBVSxHQUFHLEtBQUs7TUFDbEJ2YSxFQUFFLENBQUMyVyxjQUFjLENBQUMsS0FBSyxDQUFDO01BQ3hCM1csRUFBRSxDQUFDZ0gsV0FBVyxDQUFDLElBQUksQ0FBQztNQUNwQmhILEVBQUUsQ0FBQytHLFlBQVksQ0FBQyxJQUFJLENBQUM7TUFDckIvRyxFQUFFLENBQUM0VyxRQUFRLENBQUMsSUFBSSxDQUFDO01BQ2pCNVcsRUFBRSxDQUFDOFcsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQjlXLEVBQUUsQ0FBQzZXLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFFO0lBQzNCLENBQUMsTUFBTSxJQUFJMkYsT0FBTyxLQUFLLFNBQVMsRUFBRTtNQUNoQ2pDLFVBQVUsR0FBRyxJQUFJO01BQ2pCdmEsRUFBRSxDQUFDMlcsY0FBYyxDQUFDLEtBQUssQ0FBQztNQUN4QjNXLEVBQUUsQ0FBQ2dILFdBQVcsQ0FBQyxJQUFJLENBQUM7TUFDcEJoSCxFQUFFLENBQUMrRyxZQUFZLENBQUMsSUFBSSxDQUFDO01BQ3JCL0csRUFBRSxDQUFDNFcsUUFBUSxDQUFDLElBQUksQ0FBQztNQUNqQjVXLEVBQUUsQ0FBQzhXLFdBQVcsQ0FBQyxLQUFLLENBQUM7TUFDckI5VyxFQUFFLENBQUM2VyxZQUFZLENBQUMsS0FBSyxDQUFDO0lBQ3hCLENBQUMsTUFBTSxJQUFJMkYsT0FBTyxLQUFLLE9BQU8sRUFBRTtNQUM5QmpDLFVBQVUsR0FBRyxLQUFLO01BQ2xCdmEsRUFBRSxDQUFDMlcsY0FBYyxDQUFDLElBQUksQ0FBQztNQUN2QjNXLEVBQUUsQ0FBQ2dILFdBQVcsQ0FBQyxLQUFLLENBQUM7TUFDckJoSCxFQUFFLENBQUMrRyxZQUFZLENBQUMsSUFBSSxDQUFDO01BQ3JCL0csRUFBRSxDQUFDNFcsUUFBUSxDQUFDLElBQUksQ0FBQztNQUNqQjVXLEVBQUUsQ0FBQzhXLFdBQVcsQ0FBQyxLQUFLLENBQUM7TUFDckI5VyxFQUFFLENBQUM2VyxZQUFZLENBQUMsSUFBSSxDQUFDO0lBQ3ZCLENBQUMsTUFBTSxJQUFJMkYsT0FBTyxLQUFLLFFBQVEsRUFBRTtNQUMvQmpDLFVBQVUsR0FBRyxJQUFJO01BQ2pCdmEsRUFBRSxDQUFDMlcsY0FBYyxDQUFDLEtBQUssQ0FBQztNQUN4QjNXLEVBQUUsQ0FBQ2dILFdBQVcsQ0FBQyxLQUFLLENBQUM7TUFDckJoSCxFQUFFLENBQUMrRyxZQUFZLENBQUMsS0FBSyxDQUFDO01BQ3RCL0csRUFBRSxDQUFDNFcsUUFBUSxDQUFDLElBQUksQ0FBQztNQUNqQjVXLEVBQUUsQ0FBQzhXLFdBQVcsQ0FBQyxJQUFJLENBQUM7TUFDcEI5VyxFQUFFLENBQUM2VyxZQUFZLENBQUMsS0FBSyxDQUFDO0lBQ3hCLENBQUMsTUFBTTtNQUNMLE1BQU0sSUFBSXBtQixvQkFBVyxDQUFDLDhCQUE4QixHQUFHK3JCLE9BQU8sQ0FBQztJQUNqRTtJQUNBLE9BQU9qQyxVQUFVO0VBQ25COztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBaUJ0YSxPQUFPQSxDQUFDRCxFQUFFLEVBQUVGLEtBQUssRUFBRUMsUUFBUSxFQUFFO0lBQzVDLElBQUFuSixlQUFNLEVBQUNvSixFQUFFLENBQUNtQixPQUFPLENBQUMsQ0FBQyxLQUFLM1EsU0FBUyxDQUFDOztJQUVsQztJQUNBLElBQUlpc0IsR0FBRyxHQUFHM2MsS0FBSyxDQUFDRSxFQUFFLENBQUNtQixPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzdCLElBQUlzYixHQUFHLEtBQUtqc0IsU0FBUyxFQUFFc1AsS0FBSyxDQUFDRSxFQUFFLENBQUNtQixPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUduQixFQUFFLENBQUMsQ0FBQztJQUFBLEtBQzVDeWMsR0FBRyxDQUFDUixLQUFLLENBQUNqYyxFQUFFLENBQUMsQ0FBQyxDQUFDOztJQUVwQjtJQUNBLElBQUlBLEVBQUUsQ0FBQ2pHLFNBQVMsQ0FBQyxDQUFDLEtBQUt2SixTQUFTLEVBQUU7TUFDaEMsSUFBSWtzQixNQUFNLEdBQUczYyxRQUFRLENBQUNDLEVBQUUsQ0FBQ2pHLFNBQVMsQ0FBQyxDQUFDLENBQUM7TUFDckMsSUFBSTJpQixNQUFNLEtBQUtsc0IsU0FBUyxFQUFFdVAsUUFBUSxDQUFDQyxFQUFFLENBQUNqRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUdpRyxFQUFFLENBQUNXLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUFBLEtBQy9EK2IsTUFBTSxDQUFDVCxLQUFLLENBQUNqYyxFQUFFLENBQUNXLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BDO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0VBQ0UsT0FBaUJpVixrQkFBa0JBLENBQUMrRyxHQUFHLEVBQUVDLEdBQUcsRUFBRTtJQUM1QyxJQUFJRCxHQUFHLENBQUM1aUIsU0FBUyxDQUFDLENBQUMsS0FBS3ZKLFNBQVMsSUFBSW9zQixHQUFHLENBQUM3aUIsU0FBUyxDQUFDLENBQUMsS0FBS3ZKLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQUEsS0FDekUsSUFBSW1zQixHQUFHLENBQUM1aUIsU0FBUyxDQUFDLENBQUMsS0FBS3ZKLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFHO0lBQUEsS0FDL0MsSUFBSW9zQixHQUFHLENBQUM3aUIsU0FBUyxDQUFDLENBQUMsS0FBS3ZKLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUU7SUFDcEQsSUFBSXFzQixJQUFJLEdBQUdGLEdBQUcsQ0FBQzVpQixTQUFTLENBQUMsQ0FBQyxHQUFHNmlCLEdBQUcsQ0FBQzdpQixTQUFTLENBQUMsQ0FBQztJQUM1QyxJQUFJOGlCLElBQUksS0FBSyxDQUFDLEVBQUUsT0FBT0EsSUFBSTtJQUMzQixPQUFPRixHQUFHLENBQUNoYyxRQUFRLENBQUMsQ0FBQyxDQUFDdEMsTUFBTSxDQUFDLENBQUMsQ0FBQ3RHLE9BQU8sQ0FBQzRrQixHQUFHLENBQUMsR0FBR0MsR0FBRyxDQUFDamMsUUFBUSxDQUFDLENBQUMsQ0FBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUN0RyxPQUFPLENBQUM2a0IsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN0Rjs7RUFFQTtBQUNGO0FBQ0E7RUFDRSxPQUFPN0csd0JBQXdCQSxDQUFDK0csRUFBRSxFQUFFQyxFQUFFLEVBQUU7SUFDdEMsSUFBSUQsRUFBRSxDQUFDOWYsZUFBZSxDQUFDLENBQUMsR0FBRytmLEVBQUUsQ0FBQy9mLGVBQWUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUN0RCxJQUFJOGYsRUFBRSxDQUFDOWYsZUFBZSxDQUFDLENBQUMsS0FBSytmLEVBQUUsQ0FBQy9mLGVBQWUsQ0FBQyxDQUFDLEVBQUUsT0FBTzhmLEVBQUUsQ0FBQzVILGtCQUFrQixDQUFDLENBQUMsR0FBRzZILEVBQUUsQ0FBQzdILGtCQUFrQixDQUFDLENBQUM7SUFDaEgsT0FBTyxDQUFDO0VBQ1Y7O0VBRUE7QUFDRjtBQUNBO0VBQ0UsT0FBaUJtQixjQUFjQSxDQUFDMkcsRUFBRSxFQUFFQyxFQUFFLEVBQUU7O0lBRXRDO0lBQ0EsSUFBSUMsZ0JBQWdCLEdBQUdydEIsZUFBZSxDQUFDK2xCLGtCQUFrQixDQUFDb0gsRUFBRSxDQUFDcGQsS0FBSyxDQUFDLENBQUMsRUFBRXFkLEVBQUUsQ0FBQ3JkLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDakYsSUFBSXNkLGdCQUFnQixLQUFLLENBQUMsRUFBRSxPQUFPQSxnQkFBZ0I7O0lBRW5EO0lBQ0EsSUFBSUMsT0FBTyxHQUFHSCxFQUFFLENBQUNoZ0IsZUFBZSxDQUFDLENBQUMsR0FBR2lnQixFQUFFLENBQUNqZ0IsZUFBZSxDQUFDLENBQUM7SUFDekQsSUFBSW1nQixPQUFPLEtBQUssQ0FBQyxFQUFFLE9BQU9BLE9BQU87SUFDakNBLE9BQU8sR0FBR0gsRUFBRSxDQUFDOUgsa0JBQWtCLENBQUMsQ0FBQyxHQUFHK0gsRUFBRSxDQUFDL0gsa0JBQWtCLENBQUMsQ0FBQztJQUMzRCxJQUFJaUksT0FBTyxLQUFLLENBQUMsRUFBRSxPQUFPQSxPQUFPO0lBQ2pDQSxPQUFPLEdBQUdILEVBQUUsQ0FBQ3pnQixRQUFRLENBQUMsQ0FBQyxHQUFHMGdCLEVBQUUsQ0FBQzFnQixRQUFRLENBQUMsQ0FBQztJQUN2QyxJQUFJNGdCLE9BQU8sS0FBSyxDQUFDLEVBQUUsT0FBT0EsT0FBTztJQUNqQyxPQUFPSCxFQUFFLENBQUM3VyxXQUFXLENBQUMsQ0FBQyxDQUFDdkQsTUFBTSxDQUFDLENBQUMsQ0FBQ3dhLGFBQWEsQ0FBQ0gsRUFBRSxDQUFDOVcsV0FBVyxDQUFDLENBQUMsQ0FBQ3ZELE1BQU0sQ0FBQyxDQUFDLENBQUM7RUFDM0U7QUFDRjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBSkF5YSxPQUFBLENBQUF2dUIsT0FBQSxHQUFBZSxlQUFBO0FBS0EsTUFBTThuQixZQUFZLENBQUM7O0VBRWpCOzs7Ozs7Ozs7Ozs7RUFZQTNuQixXQUFXQSxDQUFDdWpCLE1BQU0sRUFBRTtJQUNsQixJQUFJekIsSUFBSSxHQUFHLElBQUk7SUFDZixJQUFJLENBQUN5QixNQUFNLEdBQUdBLE1BQU07SUFDcEIsSUFBSSxDQUFDK0osTUFBTSxHQUFHLElBQUlDLG1CQUFVLENBQUMsa0JBQWlCLENBQUUsTUFBTXpMLElBQUksQ0FBQ25YLElBQUksQ0FBQyxDQUFDLENBQUUsQ0FBQyxDQUFDO0lBQ3JFLElBQUksQ0FBQzZpQixhQUFhLEdBQUcsRUFBRTtJQUN2QixJQUFJLENBQUNDLDRCQUE0QixHQUFHLElBQUkvZCxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0MsSUFBSSxDQUFDZ2UsMEJBQTBCLEdBQUcsSUFBSWhlLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3QyxJQUFJLENBQUNpZSxVQUFVLEdBQUcsSUFBSUMsbUJBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLElBQUksQ0FBQ0MsVUFBVSxHQUFHLENBQUM7RUFDckI7O0VBRUFqRyxZQUFZQSxDQUFDQyxTQUFTLEVBQUU7SUFDdEIsSUFBSSxDQUFDQSxTQUFTLEdBQUdBLFNBQVM7SUFDMUIsSUFBSUEsU0FBUyxFQUFFLElBQUksQ0FBQ3lGLE1BQU0sQ0FBQ1EsS0FBSyxDQUFDLElBQUksQ0FBQ3ZLLE1BQU0sQ0FBQ2hZLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdELElBQUksQ0FBQytoQixNQUFNLENBQUNoTixJQUFJLENBQUMsQ0FBQztFQUN6Qjs7RUFFQWhWLGFBQWFBLENBQUN5aUIsVUFBVSxFQUFFO0lBQ3hCLElBQUksQ0FBQ1QsTUFBTSxDQUFDaGlCLGFBQWEsQ0FBQ3lpQixVQUFVLENBQUM7RUFDdkM7O0VBRUEsTUFBTXBqQixJQUFJQSxDQUFBLEVBQUc7O0lBRVg7SUFDQSxJQUFJLElBQUksQ0FBQ2tqQixVQUFVLEdBQUcsQ0FBQyxFQUFFO0lBQ3pCLElBQUksQ0FBQ0EsVUFBVSxFQUFFOztJQUVqQjtJQUNBLElBQUkvTCxJQUFJLEdBQUcsSUFBSTtJQUNmLE9BQU8sSUFBSSxDQUFDNkwsVUFBVSxDQUFDSyxNQUFNLENBQUMsa0JBQWlCO01BQzdDLElBQUk7O1FBRUY7UUFDQSxJQUFJLE1BQU1sTSxJQUFJLENBQUN5QixNQUFNLENBQUNsRCxRQUFRLENBQUMsQ0FBQyxFQUFFO1VBQ2hDeUIsSUFBSSxDQUFDK0wsVUFBVSxFQUFFO1VBQ2pCO1FBQ0Y7O1FBRUE7UUFDQSxJQUFJL0wsSUFBSSxDQUFDbU0sWUFBWSxLQUFLenRCLFNBQVMsRUFBRTtVQUNuQ3NoQixJQUFJLENBQUNvTSxVQUFVLEdBQUcsTUFBTXBNLElBQUksQ0FBQ3lCLE1BQU0sQ0FBQ3haLFNBQVMsQ0FBQyxDQUFDO1VBQy9DK1gsSUFBSSxDQUFDMEwsYUFBYSxHQUFHLE1BQU0xTCxJQUFJLENBQUN5QixNQUFNLENBQUNsVixNQUFNLENBQUMsSUFBSThmLHNCQUFhLENBQUMsQ0FBQyxDQUFDekgsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1VBQ3BGNUUsSUFBSSxDQUFDbU0sWUFBWSxHQUFHLE1BQU1uTSxJQUFJLENBQUN5QixNQUFNLENBQUM5YyxXQUFXLENBQUMsQ0FBQztVQUNuRHFiLElBQUksQ0FBQytMLFVBQVUsRUFBRTtVQUNqQjtRQUNGOztRQUVBO1FBQ0EsSUFBSTdqQixNQUFNLEdBQUcsTUFBTThYLElBQUksQ0FBQ3lCLE1BQU0sQ0FBQ3haLFNBQVMsQ0FBQyxDQUFDO1FBQzFDLElBQUkrWCxJQUFJLENBQUNvTSxVQUFVLEtBQUtsa0IsTUFBTSxFQUFFO1VBQzlCLEtBQUssSUFBSTBMLENBQUMsR0FBR29NLElBQUksQ0FBQ29NLFVBQVUsRUFBRXhZLENBQUMsR0FBRzFMLE1BQU0sRUFBRTBMLENBQUMsRUFBRSxFQUFFLE1BQU1vTSxJQUFJLENBQUNzTSxVQUFVLENBQUMxWSxDQUFDLENBQUM7VUFDdkVvTSxJQUFJLENBQUNvTSxVQUFVLEdBQUdsa0IsTUFBTTtRQUMxQjs7UUFFQTtRQUNBLElBQUlxa0IsU0FBUyxHQUFHcGpCLElBQUksQ0FBQ3FqQixHQUFHLENBQUMsQ0FBQyxFQUFFdGtCLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFDLElBQUl1a0IsU0FBUyxHQUFHLE1BQU16TSxJQUFJLENBQUN5QixNQUFNLENBQUNsVixNQUFNLENBQUMsSUFBSThmLHNCQUFhLENBQUMsQ0FBQyxDQUFDekgsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDOEgsWUFBWSxDQUFDSCxTQUFTLENBQUMsQ0FBQ0ksaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7O1FBRS9IO1FBQ0EsSUFBSUMsb0JBQW9CLEdBQUcsRUFBRTtRQUM3QixLQUFLLElBQUlDLFlBQVksSUFBSTdNLElBQUksQ0FBQzBMLGFBQWEsRUFBRTtVQUMzQyxJQUFJMUwsSUFBSSxDQUFDbFMsS0FBSyxDQUFDMmUsU0FBUyxFQUFFSSxZQUFZLENBQUN4ZCxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUszUSxTQUFTLEVBQUU7WUFDL0RrdUIsb0JBQW9CLENBQUNsaUIsSUFBSSxDQUFDbWlCLFlBQVksQ0FBQ3hkLE9BQU8sQ0FBQyxDQUFDLENBQUM7VUFDbkQ7UUFDRjs7UUFFQTtRQUNBMlEsSUFBSSxDQUFDMEwsYUFBYSxHQUFHZSxTQUFTOztRQUU5QjtRQUNBLElBQUlLLFdBQVcsR0FBR0Ysb0JBQW9CLENBQUMvaUIsTUFBTSxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsTUFBTW1XLElBQUksQ0FBQ3lCLE1BQU0sQ0FBQ2xWLE1BQU0sQ0FBQyxJQUFJOGYsc0JBQWEsQ0FBQyxDQUFDLENBQUN6SCxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM4SCxZQUFZLENBQUNILFNBQVMsQ0FBQyxDQUFDUSxTQUFTLENBQUNILG9CQUFvQixDQUFDLENBQUNELGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDOztRQUUzTTtRQUNBLEtBQUssSUFBSUssUUFBUSxJQUFJUCxTQUFTLEVBQUU7VUFDOUIsSUFBSVEsU0FBUyxHQUFHRCxRQUFRLENBQUNqZSxjQUFjLENBQUMsQ0FBQyxHQUFHaVIsSUFBSSxDQUFDNEwsMEJBQTBCLEdBQUc1TCxJQUFJLENBQUMyTCw0QkFBNEI7VUFDL0csSUFBSXVCLFdBQVcsR0FBRyxDQUFDRCxTQUFTLENBQUMvdkIsR0FBRyxDQUFDOHZCLFFBQVEsQ0FBQzNkLE9BQU8sQ0FBQyxDQUFDLENBQUM7VUFDcEQ0ZCxTQUFTLENBQUNsZixHQUFHLENBQUNpZixRQUFRLENBQUMzZCxPQUFPLENBQUMsQ0FBQyxDQUFDO1VBQ2pDLElBQUk2ZCxXQUFXLEVBQUUsTUFBTWxOLElBQUksQ0FBQ21OLGFBQWEsQ0FBQ0gsUUFBUSxDQUFDO1FBQ3JEOztRQUVBO1FBQ0EsS0FBSyxJQUFJSSxVQUFVLElBQUlOLFdBQVcsRUFBRTtVQUNsQzlNLElBQUksQ0FBQzJMLDRCQUE0QixDQUFDMEIsTUFBTSxDQUFDRCxVQUFVLENBQUMvZCxPQUFPLENBQUMsQ0FBQyxDQUFDO1VBQzlEMlEsSUFBSSxDQUFDNEwsMEJBQTBCLENBQUN5QixNQUFNLENBQUNELFVBQVUsQ0FBQy9kLE9BQU8sQ0FBQyxDQUFDLENBQUM7VUFDNUQsTUFBTTJRLElBQUksQ0FBQ21OLGFBQWEsQ0FBQ0MsVUFBVSxDQUFDO1FBQ3RDOztRQUVBO1FBQ0EsTUFBTXBOLElBQUksQ0FBQ3NOLHVCQUF1QixDQUFDLENBQUM7UUFDcEN0TixJQUFJLENBQUMrTCxVQUFVLEVBQUU7TUFDbkIsQ0FBQyxDQUFDLE9BQU9ycUIsR0FBUSxFQUFFO1FBQ2pCc2UsSUFBSSxDQUFDK0wsVUFBVSxFQUFFO1FBQ2pCL2MsT0FBTyxDQUFDQyxLQUFLLENBQUMsb0NBQW9DLElBQUcsTUFBTStRLElBQUksQ0FBQ3lCLE1BQU0sQ0FBQy9oQixPQUFPLENBQUMsQ0FBQyxJQUFHLEtBQUssR0FBR2dDLEdBQUcsQ0FBQ2EsT0FBTyxDQUFDO01BQ3pHO0lBQ0YsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBZ0IrcEIsVUFBVUEsQ0FBQ3BrQixNQUFNLEVBQUU7SUFDakMsTUFBTSxJQUFJLENBQUN1WixNQUFNLENBQUM4TCxnQkFBZ0IsQ0FBQ3JsQixNQUFNLENBQUM7RUFDNUM7O0VBRUEsTUFBZ0JpbEIsYUFBYUEsQ0FBQ2pmLEVBQUUsRUFBRTs7SUFFaEM7SUFDQSxJQUFJQSxFQUFFLENBQUM2RixtQkFBbUIsQ0FBQyxDQUFDLEtBQUtyVixTQUFTLEVBQUU7TUFDMUMsSUFBQW9HLGVBQU0sRUFBQ29KLEVBQUUsQ0FBQzZaLFNBQVMsQ0FBQyxDQUFDLEtBQUtycEIsU0FBUyxDQUFDO01BQ3BDLElBQUlnUSxNQUFNLEdBQUcsSUFBSXdaLDJCQUFrQixDQUFDLENBQUM7TUFDaEM1VCxTQUFTLENBQUNwRyxFQUFFLENBQUM2RixtQkFBbUIsQ0FBQyxDQUFDLENBQUNwQixTQUFTLENBQUMsQ0FBQyxHQUFHekUsRUFBRSxDQUFDc2YsTUFBTSxDQUFDLENBQUMsQ0FBQztNQUM3RHptQixlQUFlLENBQUNtSCxFQUFFLENBQUM2RixtQkFBbUIsQ0FBQyxDQUFDLENBQUM3SSxlQUFlLENBQUMsQ0FBQyxDQUFDO01BQzNEbWUsa0JBQWtCLENBQUNuYixFQUFFLENBQUM2RixtQkFBbUIsQ0FBQyxDQUFDLENBQUN6QixvQkFBb0IsQ0FBQyxDQUFDLENBQUN6SSxNQUFNLEtBQUssQ0FBQyxHQUFHcUUsRUFBRSxDQUFDNkYsbUJBQW1CLENBQUMsQ0FBQyxDQUFDekIsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHNVQsU0FBUyxDQUFDLENBQUM7TUFBQSxDQUNsSituQixLQUFLLENBQUN2WSxFQUFFLENBQUM7TUFDZEEsRUFBRSxDQUFDOFosU0FBUyxDQUFDLENBQUN0WixNQUFNLENBQUMsQ0FBQztNQUN0QixNQUFNLElBQUksQ0FBQytTLE1BQU0sQ0FBQ2dNLG1CQUFtQixDQUFDL2UsTUFBTSxDQUFDO0lBQy9DOztJQUVBO0lBQ0EsSUFBSVIsRUFBRSxDQUFDdVEsb0JBQW9CLENBQUMsQ0FBQyxLQUFLL2YsU0FBUyxFQUFFO01BQzNDLElBQUl3UCxFQUFFLENBQUMyQixVQUFVLENBQUMsQ0FBQyxLQUFLblIsU0FBUyxJQUFJd1AsRUFBRSxDQUFDMkIsVUFBVSxDQUFDLENBQUMsQ0FBQ2hHLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBRTtRQUNqRSxLQUFLLElBQUk2RSxNQUFNLElBQUlSLEVBQUUsQ0FBQzJCLFVBQVUsQ0FBQyxDQUFDLEVBQUU7VUFDbEMsTUFBTSxJQUFJLENBQUM0UixNQUFNLENBQUNpTSxzQkFBc0IsQ0FBQ2hmLE1BQU0sQ0FBQztRQUNsRDtNQUNGLENBQUMsTUFBTSxDQUFFO1FBQ1AsSUFBSUgsT0FBTyxHQUFHLEVBQUU7UUFDaEIsS0FBSyxJQUFJVixRQUFRLElBQUlLLEVBQUUsQ0FBQ3VRLG9CQUFvQixDQUFDLENBQUMsRUFBRTtVQUM5Q2xRLE9BQU8sQ0FBQzdELElBQUksQ0FBQyxJQUFJd2QsMkJBQWtCLENBQUMsQ0FBQztVQUNoQ25oQixlQUFlLENBQUM4RyxRQUFRLENBQUMzQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1VBQzNDbWUsa0JBQWtCLENBQUN4YixRQUFRLENBQUN1VixrQkFBa0IsQ0FBQyxDQUFDLENBQUM7VUFDakQ5TyxTQUFTLENBQUN6RyxRQUFRLENBQUM4RSxTQUFTLENBQUMsQ0FBQyxDQUFDO1VBQy9COFQsS0FBSyxDQUFDdlksRUFBRSxDQUFDLENBQUM7UUFDakI7UUFDQUEsRUFBRSxDQUFDc2MsVUFBVSxDQUFDamMsT0FBTyxDQUFDO1FBQ3RCLEtBQUssSUFBSUcsTUFBTSxJQUFJUixFQUFFLENBQUMyQixVQUFVLENBQUMsQ0FBQyxFQUFFO1VBQ2xDLE1BQU0sSUFBSSxDQUFDNFIsTUFBTSxDQUFDaU0sc0JBQXNCLENBQUNoZixNQUFNLENBQUM7UUFDbEQ7TUFDRjtJQUNGO0VBQ0Y7O0VBRVVaLEtBQUtBLENBQUNKLEdBQUcsRUFBRThKLE1BQU0sRUFBRTtJQUMzQixLQUFLLElBQUl0SixFQUFFLElBQUlSLEdBQUcsRUFBRSxJQUFJOEosTUFBTSxLQUFLdEosRUFBRSxDQUFDbUIsT0FBTyxDQUFDLENBQUMsRUFBRSxPQUFPbkIsRUFBRTtJQUMxRCxPQUFPeFAsU0FBUztFQUNsQjs7RUFFQSxNQUFnQjR1Qix1QkFBdUJBLENBQUEsRUFBRztJQUN4QyxJQUFJSyxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUNsTSxNQUFNLENBQUM5YyxXQUFXLENBQUMsQ0FBQztJQUM5QyxJQUFJZ3BCLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUN4QixZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUl3QixRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDeEIsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFO01BQ2hGLElBQUksQ0FBQ0EsWUFBWSxHQUFHd0IsUUFBUTtNQUM1QixNQUFNLElBQUksQ0FBQ2xNLE1BQU0sQ0FBQ21NLHVCQUF1QixDQUFDRCxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUVBLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNuRSxPQUFPLElBQUk7SUFDYjtJQUNBLE9BQU8sS0FBSztFQUNkO0FBQ0YifQ==