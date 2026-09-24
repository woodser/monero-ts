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
var _MoneroKeyImageExportResult = _interopRequireDefault(require("./model/MoneroKeyImageExportResult"));
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
    this._isClosed = false;

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
    this._isClosed = false;

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
      if (!_GenUtils.default.isSameProxyUri(this.startupProxyUri, connection.getProxyUri())) {
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
    return this.getTxsAux(query, 5);
  }

  async getTxsAux(query, maxAttempts) {

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
        if (maxAttempts <= 1) throw new _MoneroError.default("Unable to build consistent txs from multiple rpc calls");
        console.error("Inconsistency detected building txs from multiple rpc calls, re-fetching txs");
        return this.getTxsAux(queryNormalized, maxAttempts - 1);
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

  async importKeyImages(keyImages, offset = 0) {

    // convert key images to rpc parameter
    let rpcKeyImages = keyImages.map((keyImage) => ({ key_image: keyImage.getHex(), signature: keyImage.getSignature() }));

    // send request
    let resp = await this.config.getServer().sendJsonRequest("import_key_images", { signed_key_images: rpcKeyImages, offset: offset });

    // build and return result
    let importResult = new _MoneroKeyImageImportResult.default();
    importResult.setHeight(resp.result.height);
    importResult.setSpentAmount(BigInt(resp.result.spent));
    importResult.setUnspentAmount(BigInt(resp.result.unspent));
    return importResult;
  }

  async getNewKeyImagesFromLastImport() {
    return (await this.rpcExportKeyImages(false)).getKeyImages();
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
      export_raw: true,
      get_tx_keys: true
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
    this.listenerGeneration++;
    if (this.walletPoller) this.walletPoller.reset();
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
   * @return {MoneroKeyImageExportResult} the key images and their offset among the wallet's outputs
   */
  async rpcExportKeyImages(all) {
    let resp = await this.config.getServer().sendJsonRequest("export_key_images", { all: all });
    let keyImages = (resp.result.signed_key_images || []).map((rpcImage) => new _MoneroKeyImage.default(rpcImage.key_image, rpcImage.signature));
    return new _MoneroKeyImageExportResult.default().setOffset(resp.result.offset).setKeyImages(keyImages);
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
      if (key === "tx_blob_list" || key === "tx_raw_list") for (let i = 0; i < val.length; i++) txs[i].setFullHex(val[i]);else
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
      if (key === "sources") {
        _GenUtils.default.assertTrue(tx.getInputs() === undefined);
        tx.setInputs([]);
        for (let rpcSource of val) {
          let input = new _MoneroOutputWallet.default().setTx(tx);
          input.setAmount(BigInt(rpcSource.amount));
          input.setIndex(rpcSource.global_index);
          if (rpcSource.pubkey !== undefined) input.setStealthPublicKey(rpcSource.pubkey.substring(0, 64)); // dest key of dest||mask
          tx.getInputs().push(input);
        }
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




  prevLockedTxsMinHeight = 0;






  generation = 0;
  snapshotGeneration = 0;

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

  reset() {
    this.generation++; // invalidate in-flight polls without waiting on their callbacks
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
      const generation = that.generation;
      try {

        // skip if wallet is closed
        if ((await that.wallet.isClosed()) || generation !== that.generation) return;

        // reset snapshots only inside the serialized poll
        if (that.snapshotGeneration !== generation) {
          that.prevHeight = undefined;
          that.prevBalances = undefined;
          that.prevLockedTxs = [];
          that.prevLockedTxsMinHeight = 0;
          that.prevUnconfirmedNotifications.clear();
          that.prevConfirmedNotifications.clear();
          that.snapshotGeneration = generation;
        }

        // take initial snapshot
        if (that.prevBalances === undefined) {
          that.prevHeight = await that.wallet.getHeight();
          if (generation !== that.generation) return;
          that.prevLockedTxs = await that.wallet.getTxs(new _MoneroTxQuery.default().setIsLocked(true));
          if (generation !== that.generation) return;
          that.prevBalances = await that.wallet.getBalances();
          return;
        }

        // announce height changes
        let height = await that.wallet.getHeight();
        if (generation !== that.generation) return;
        if (that.prevHeight !== height) {
          for (let i = that.prevHeight; i < height; i++) {
            await that.onNewBlock(i);
            if (generation !== that.generation) return;
          }
          that.prevHeight = height;
        }

        // get locked txs for comparison to previous
        let minHeight = Math.max(0, height - 70); // only monitor recent txs
        let lockedTxs = await that.wallet.getTxs(new _MoneroTxQuery.default().setIsLocked(true).setMinHeight(minHeight).setIncludeOutputs(true));
        if (generation !== that.generation) return;

        // collect hashes of txs no longer locked
        let noLongerLockedHashes = [];
        for (let prevLockedTx of that.prevLockedTxs) {
          if (that.getTx(lockedTxs, prevLockedTx.getHash()) === undefined) {
            noLongerLockedHashes.push(prevLockedTx.getHash());
          }
        }

        // save locked txs for next comparison
        let prevMinHeight = that.prevLockedTxsMinHeight;
        that.prevLockedTxs = lockedTxs;
        that.prevLockedTxsMinHeight = minHeight;

        // use the previous snapshot's bound so tracked txs do not age out between polls
        let unlockedTxs = noLongerLockedHashes.length === 0 ? [] : await that.wallet.getTxs(new _MoneroTxQuery.default().setIsLocked(false).setMinHeight(prevMinHeight).setHashes(noLongerLockedHashes).setIncludeOutputs(true));
        if (generation !== that.generation) return;

        // announce new unconfirmed and confirmed outputs
        for (let lockedTx of lockedTxs) {
          let searchSet = lockedTx.getIsConfirmed() ? that.prevConfirmedNotifications : that.prevUnconfirmedNotifications;
          let unannounced = !searchSet.has(lockedTx.getHash());
          searchSet.add(lockedTx.getHash());
          if (unannounced) await that.notifyOutputs(lockedTx, generation);
          if (generation !== that.generation) return;
        }

        // announce new unlocked outputs
        for (let unlockedTx of unlockedTxs) {
          let missedConfirm = unlockedTx.getIsConfirmed() && !that.prevConfirmedNotifications.has(unlockedTx.getHash());
          that.prevUnconfirmedNotifications.delete(unlockedTx.getHash());
          that.prevConfirmedNotifications.delete(unlockedTx.getHash());
          if (missedConfirm) {// announce missed confirm transition if tx unlocked between polls
            let confirmedTx = unlockedTx.copy().setIsLocked(true);
            confirmedTx.setBlock(unlockedTx.getBlock().copy().setTxs([confirmedTx]));
            await that.notifyOutputs(confirmedTx, generation);
            if (generation !== that.generation) return;
          }
          await that.notifyOutputs(unlockedTx, generation);
          if (generation !== that.generation) return;
        }

        // announce balance changes
        await that.checkForChangedBalances(generation);
      } catch (err) {
        if (generation === that.generation && that.isPolling) console.error("Failed to background poll wallet '" + (await that.wallet.getPath()) + "': " + err.message); // ignore errors from polls straggling after the wallet is closed
      } finally {
        that.numPolling--;
      }
    });
  }

  async onNewBlock(height) {
    await this.wallet.announceNewBlock(height);
  }

  async notifyOutputs(tx, generation) {
    if (generation !== this.generation) return;

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
      if (generation !== this.generation) return;
    }

    // notify received outputs
    if (tx.getIncomingTransfers() !== undefined) {
      if (tx.getOutputs() !== undefined && tx.getOutputs().length > 0) {// TODO (monero-project): outputs only returned for confirmed txs
        for (let output of tx.getOutputs()) {
          await this.wallet.announceOutputReceived(output);
          if (generation !== this.generation) return;
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
          if (generation !== this.generation) return;
        }
      }
    }
  }

  getTx(txs, txHash) {
    for (let tx of txs) if (txHash === tx.getHash()) return tx;
    return undefined;
  }

  async checkForChangedBalances(generation) {
    let balances = await this.wallet.getBalances();
    if (generation !== this.generation) return false;
    if (balances[0] !== this.prevBalances[0] || balances[1] !== this.prevBalances[1]) {
      this.prevBalances = balances;
      await this.wallet.announceBalancesChanged(balances[0], balances[1]);
      return true;
    }
    return false;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiTW9uZXJvV2FsbGV0UnBjIiwiTW9uZXJvV2FsbGV0IiwiREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwiYWRkcmVzc0NhY2hlIiwic3luY1BlcmlvZEluTXMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRTZXJ2ZXIiLCJvcGVuV2FsbGV0IiwicGF0aE9yQ29uZmlnIiwicGFzc3dvcmQiLCJNb25lcm9XYWxsZXRDb25maWciLCJwYXRoIiwiZ2V0UGF0aCIsImdldFJlZ3Rlc3QiLCJzZW5kSnNvblJlcXVlc3QiLCJmaWxlbmFtZSIsImdldFBhc3N3b3JkIiwiY2xlYXIiLCJfaXNDbG9zZWQiLCJnZXRDb25uZWN0aW9uTWFuYWdlciIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsImNyZWF0ZVdhbGxldCIsImNvbmZpZ05vcm1hbGl6ZWQiLCJnZXRTZWVkIiwiZ2V0UHJpbWFyeUFkZHJlc3MiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFByaXZhdGVTcGVuZEtleSIsImdldE5ldHdvcmtUeXBlIiwiZ2V0QWNjb3VudExvb2thaGVhZCIsImdldFN1YmFkZHJlc3NMb29rYWhlYWQiLCJzZXRQYXNzd29yZCIsInNldFNlcnZlciIsImdldENvbm5lY3Rpb24iLCJjcmVhdGVXYWxsZXRGcm9tU2VlZCIsImNyZWF0ZVdhbGxldEZyb21LZXlzIiwiY3JlYXRlV2FsbGV0UmFuZG9tIiwiZ2V0U2VlZE9mZnNldCIsImdldFJlc3RvcmVIZWlnaHQiLCJnZXRTYXZlQ3VycmVudCIsImdldExhbmd1YWdlIiwic2V0TGFuZ3VhZ2UiLCJERUZBVUxUX0xBTkdVQUdFIiwicGFyYW1zIiwibGFuZ3VhZ2UiLCJlcnIiLCJoYW5kbGVDcmVhdGVXYWxsZXRFcnJvciIsInNlZWQiLCJzZWVkX29mZnNldCIsImVuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWwiLCJnZXRJc011bHRpc2lnIiwicmVzdG9yZV9oZWlnaHQiLCJhdXRvc2F2ZV9jdXJyZW50Iiwic2V0UmVzdG9yZUhlaWdodCIsImFkZHJlc3MiLCJ2aWV3a2V5Iiwic3BlbmRrZXkiLCJuYW1lIiwibWVzc2FnZSIsInRvTG93ZXJDYXNlIiwiaW5jbHVkZXMiLCJNb25lcm9ScGNFcnJvciIsImdldENvZGUiLCJnZXRScGNNZXRob2QiLCJnZXRScGNQYXJhbXMiLCJpc1ZpZXdPbmx5Iiwia2V5X3R5cGUiLCJlIiwidXJpT3JDb25uZWN0aW9uIiwiaXNUcnVzdGVkIiwic3NsT3B0aW9ucyIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiU3NsT3B0aW9ucyIsImdldFVyaSIsInVzZXJuYW1lIiwiZ2V0VXNlcm5hbWUiLCJ0cnVzdGVkIiwic3NsX3N1cHBvcnQiLCJzc2xfcHJpdmF0ZV9rZXlfcGF0aCIsImdldFByaXZhdGVLZXlQYXRoIiwic3NsX2NlcnRpZmljYXRlX3BhdGgiLCJnZXRDZXJ0aWZpY2F0ZVBhdGgiLCJzc2xfY2FfZmlsZSIsImdldENlcnRpZmljYXRlQXV0aG9yaXR5RmlsZSIsInNzbF9hbGxvd2VkX2ZpbmdlcnByaW50cyIsImdldEFsbG93ZWRGaW5nZXJwcmludHMiLCJzc2xfYWxsb3dfYW55X2NlcnQiLCJnZXRBbGxvd0FueUNlcnQiLCJnZXRQcm94eVVyaSIsInN0YXJ0dXBQcm94eVVyaSIsInByb3h5IiwiaXNTYW1lUHJveHlVcmkiLCJkYWVtb25Db25uZWN0aW9uIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImdldEJhbGFuY2VzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJhc3NlcnQiLCJlcXVhbCIsImJhbGFuY2UiLCJCaWdJbnQiLCJ1bmxvY2tlZEJhbGFuY2UiLCJhY2NvdW50IiwiZ2V0QWNjb3VudHMiLCJnZXRCYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudF9pbmRleCIsImFkZHJlc3NfaW5kaWNlcyIsInJlc3AiLCJyZXN1bHQiLCJ1bmxvY2tlZF9iYWxhbmNlIiwicGVyX3N1YmFkZHJlc3MiLCJhZGRMaXN0ZW5lciIsInJlZnJlc2hMaXN0ZW5pbmciLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiY2hlY2tSZXNlcnZlUHJvb2YiLCJpbmRleE9mIiwiZ2V0VmVyc2lvbiIsIk1vbmVyb1ZlcnNpb24iLCJ2ZXJzaW9uIiwicmVsZWFzZSIsImdldFNlZWRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJsYW5ndWFnZXMiLCJnZXRBZGRyZXNzIiwic3ViYWRkcmVzc01hcCIsImdldFN1YmFkZHJlc3NlcyIsImdldEFkZHJlc3NJbmRleCIsInN1YmFkZHJlc3MiLCJNb25lcm9TdWJhZGRyZXNzIiwic2V0QWNjb3VudEluZGV4IiwiaW5kZXgiLCJtYWpvciIsInNldEluZGV4IiwibWlub3IiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInN0YW5kYXJkQWRkcmVzcyIsInBheW1lbnRJZCIsImludGVncmF0ZWRBZGRyZXNzU3RyIiwic3RhbmRhcmRfYWRkcmVzcyIsInBheW1lbnRfaWQiLCJpbnRlZ3JhdGVkX2FkZHJlc3MiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImludGVncmF0ZWRBZGRyZXNzIiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJzZXRTdGFuZGFyZEFkZHJlc3MiLCJzZXRQYXltZW50SWQiLCJzZXRJbnRlZ3JhdGVkQWRkcmVzcyIsImdldEhlaWdodCIsImhlaWdodCIsImdldERhZW1vbkhlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsInN5bmMiLCJsaXN0ZW5lck9yU3RhcnRIZWlnaHQiLCJzdGFydEhlaWdodCIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwic3RhcnRfaGVpZ2h0IiwicG9sbCIsIk1vbmVyb1N5bmNSZXN1bHQiLCJibG9ja3NfZmV0Y2hlZCIsInJlY2VpdmVkX21vbmV5Iiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluU2Vjb25kcyIsIk1hdGgiLCJyb3VuZCIsImVuYWJsZSIsInBlcmlvZCIsIndhbGxldFBvbGxlciIsInNldFBlcmlvZEluTXMiLCJnZXRTeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwibGVuZ3RoIiwidHhpZHMiLCJyZXNjYW5TcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwic2tpcEJhbGFuY2VzIiwiYWNjb3VudHMiLCJycGNBY2NvdW50Iiwic3ViYWRkcmVzc19hY2NvdW50cyIsImNvbnZlcnRScGNBY2NvdW50Iiwic2V0U3ViYWRkcmVzc2VzIiwiZ2V0SW5kZXgiLCJwdXNoIiwic2V0QmFsYW5jZSIsInNldFVubG9ja2VkQmFsYW5jZSIsInNldE51bVVuc3BlbnRPdXRwdXRzIiwic2V0TnVtQmxvY2tzVG9VbmxvY2siLCJhbGxfYWNjb3VudHMiLCJycGNTdWJhZGRyZXNzIiwiY29udmVydFJwY1N1YmFkZHJlc3MiLCJnZXRBY2NvdW50SW5kZXgiLCJ0Z3RTdWJhZGRyZXNzIiwiZ2V0TnVtVW5zcGVudE91dHB1dHMiLCJnZXRBY2NvdW50IiwiRXJyb3IiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJNb25lcm9BY2NvdW50IiwicHJpbWFyeUFkZHJlc3MiLCJzdWJhZGRyZXNzSW5kaWNlcyIsImFkZHJlc3NfaW5kZXgiLCJsaXN0aWZ5Iiwic3ViYWRkcmVzc2VzIiwiYWRkcmVzc2VzIiwiZ2V0TnVtQmxvY2tzVG9VbmxvY2siLCJnZXRTdWJhZGRyZXNzIiwiY3JlYXRlU3ViYWRkcmVzcyIsInNldEFkZHJlc3MiLCJzZXRMYWJlbCIsInNldElzVXNlZCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwiZ2V0VHhzQXV4IiwibWF4QXR0ZW1wdHMiLCJxdWVyeU5vcm1hbGl6ZWQiLCJub3JtYWxpemVUeFF1ZXJ5IiwidHJhbnNmZXJRdWVyeSIsImdldFRyYW5zZmVyUXVlcnkiLCJpbnB1dFF1ZXJ5IiwiZ2V0SW5wdXRRdWVyeSIsIm91dHB1dFF1ZXJ5IiwiZ2V0T3V0cHV0UXVlcnkiLCJzZXRUcmFuc2ZlclF1ZXJ5Iiwic2V0SW5wdXRRdWVyeSIsInNldE91dHB1dFF1ZXJ5IiwidHJhbnNmZXJzIiwiZ2V0VHJhbnNmZXJzQXV4IiwiTW9uZXJvVHJhbnNmZXJRdWVyeSIsInNldFR4UXVlcnkiLCJkZWNvbnRleHR1YWxpemUiLCJjb3B5IiwidHhzIiwidHhzU2V0IiwiU2V0IiwidHJhbnNmZXIiLCJnZXRUeCIsImFkZCIsInR4TWFwIiwiYmxvY2tNYXAiLCJ0eCIsIm1lcmdlVHgiLCJnZXRJbmNsdWRlT3V0cHV0cyIsIm91dHB1dFF1ZXJ5QXV4IiwiTW9uZXJvT3V0cHV0UXVlcnkiLCJvdXRwdXRzIiwiZ2V0T3V0cHV0c0F1eCIsIm91dHB1dFR4cyIsIm91dHB1dCIsInR4c1F1ZXJpZWQiLCJtZWV0c0NyaXRlcmlhIiwiZ2V0QmxvY2siLCJzcGxpY2UiLCJnZXRJc0NvbmZpcm1lZCIsImNvbnNvbGUiLCJlcnJvciIsImdldEhhc2hlcyIsInR4c0J5SWQiLCJNYXAiLCJnZXRIYXNoIiwib3JkZXJlZFR4cyIsImhhc2giLCJnZXRUcmFuc2ZlcnMiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiaXNDb250ZXh0dWFsIiwiZ2V0VHhRdWVyeSIsImZpbHRlclRyYW5zZmVycyIsImdldE91dHB1dHMiLCJub3JtYWxpemVPdXRwdXRRdWVyeSIsImZpbHRlck91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwib3V0cHV0c19kYXRhX2hleCIsImltcG9ydE91dHB1dHMiLCJvdXRwdXRzSGV4IiwibnVtX2ltcG9ydGVkIiwiZXhwb3J0S2V5SW1hZ2VzIiwicnBjRXhwb3J0S2V5SW1hZ2VzIiwiaW1wb3J0S2V5SW1hZ2VzIiwia2V5SW1hZ2VzIiwib2Zmc2V0IiwicnBjS2V5SW1hZ2VzIiwibWFwIiwia2V5SW1hZ2UiLCJrZXlfaW1hZ2UiLCJnZXRIZXgiLCJzaWduYXR1cmUiLCJnZXRTaWduYXR1cmUiLCJzaWduZWRfa2V5X2ltYWdlcyIsImltcG9ydFJlc3VsdCIsIk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0Iiwic2V0SGVpZ2h0Iiwic2V0U3BlbnRBbW91bnQiLCJzcGVudCIsInNldFVuc3BlbnRBbW91bnQiLCJ1bnNwZW50IiwiZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQiLCJnZXRLZXlJbWFnZXMiLCJmcmVlemVPdXRwdXQiLCJ0aGF3T3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJmcm96ZW4iLCJnZXREZWZhdWx0RmVlUHJpb3JpdHkiLCJwcmlvcml0eSIsImNyZWF0ZVR4cyIsIm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyIsImdldENhblNwbGl0Iiwic2V0Q2FuU3BsaXQiLCJnZXRSZWxheSIsImlzTXVsdGlzaWciLCJnZXRTdWJhZGRyZXNzSW5kaWNlcyIsInNsaWNlIiwiZGVzdGluYXRpb25zIiwiZGVzdGluYXRpb24iLCJnZXREZXN0aW5hdGlvbnMiLCJnZXRBbW91bnQiLCJhbW91bnQiLCJ0b1N0cmluZyIsImdldFN1YnRyYWN0RmVlRnJvbSIsInN1YnRyYWN0X2ZlZV9mcm9tX291dHB1dHMiLCJzdWJhZGRyX2luZGljZXMiLCJnZXRQYXltZW50SWQiLCJkb19ub3RfcmVsYXkiLCJnZXRQcmlvcml0eSIsImdldF90eF9oZXgiLCJnZXRfdHhfbWV0YWRhdGEiLCJnZXRfdHhfa2V5cyIsImdldF90eF9rZXkiLCJudW1UeHMiLCJmZWVfbGlzdCIsImZlZSIsImNvcHlEZXN0aW5hdGlvbnMiLCJpIiwiTW9uZXJvVHhXYWxsZXQiLCJpbml0U2VudFR4V2FsbGV0IiwiZ2V0T3V0Z29pbmdUcmFuc2ZlciIsInNldFN1YmFkZHJlc3NJbmRpY2VzIiwiY29udmVydFJwY1NlbnRUeHNUb1R4U2V0IiwiY29udmVydFJwY1R4VG9UeFNldCIsInN3ZWVwT3V0cHV0Iiwibm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWciLCJnZXRLZXlJbWFnZSIsInNldEFtb3VudCIsInN3ZWVwVW5sb2NrZWQiLCJub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnIiwiaW5kaWNlcyIsImtleXMiLCJzZXRTd2VlcEVhY2hTdWJhZGRyZXNzIiwiZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcyIsInJwY1N3ZWVwQWNjb3VudCIsInN3ZWVwRHVzdCIsInJlbGF5IiwidHhTZXQiLCJzZXRJc1JlbGF5ZWQiLCJzZXRJblR4UG9vbCIsImdldElzUmVsYXllZCIsInJlbGF5VHhzIiwidHhzT3JNZXRhZGF0YXMiLCJBcnJheSIsImlzQXJyYXkiLCJ0eE9yTWV0YWRhdGEiLCJtZXRhZGF0YSIsImdldE1ldGFkYXRhIiwiaGV4IiwidHhfaGFzaCIsImRlc2NyaWJlVHhTZXQiLCJ1bnNpZ25lZF90eHNldCIsImdldFVuc2lnbmVkVHhIZXgiLCJtdWx0aXNpZ190eHNldCIsImdldE11bHRpc2lnVHhIZXgiLCJjb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlciIsInNpZ25UeHMiLCJ1bnNpZ25lZFR4SGV4IiwiZXhwb3J0X3JhdyIsInN1Ym1pdFR4cyIsInNpZ25lZFR4SGV4IiwidHhfZGF0YV9oZXgiLCJ0eF9oYXNoX2xpc3QiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIlNJR05fV0lUSF9TUEVORF9LRVkiLCJkYXRhIiwic2lnbmF0dXJlX3R5cGUiLCJ2ZXJpZnlNZXNzYWdlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCIsImdvb2QiLCJpc0dvb2QiLCJpc09sZCIsIm9sZCIsIlNJR05fV0lUSF9WSUVXX0tFWSIsImdldFR4S2V5IiwidHhIYXNoIiwidHhpZCIsInR4X2tleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImNoZWNrIiwiTW9uZXJvQ2hlY2tUeCIsInNldElzR29vZCIsInNldE51bUNvbmZpcm1hdGlvbnMiLCJjb25maXJtYXRpb25zIiwiaW5fcG9vbCIsInNldFJlY2VpdmVkQW1vdW50IiwicmVjZWl2ZWQiLCJnZXRUeFByb29mIiwiY2hlY2tUeFByb29mIiwiZ2V0U3BlbmRQcm9vZiIsImNoZWNrU3BlbmRQcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJNb25lcm9DaGVja1Jlc2VydmUiLCJzZXRVbmNvbmZpcm1lZFNwZW50QW1vdW50Iiwic2V0VG90YWxBbW91bnQiLCJ0b3RhbCIsImdldFR4Tm90ZXMiLCJub3RlcyIsInNldFR4Tm90ZXMiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJlbnRyaWVzIiwicnBjRW50cnkiLCJNb25lcm9BZGRyZXNzQm9va0VudHJ5Iiwic2V0RGVzY3JpcHRpb24iLCJkZXNjcmlwdGlvbiIsImFkZEFkZHJlc3NCb29rRW50cnkiLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsInNldF9hZGRyZXNzIiwic2V0X2Rlc2NyaXB0aW9uIiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsInRhZ3MiLCJhY2NvdW50X3RhZ3MiLCJycGNBY2NvdW50VGFnIiwiTW9uZXJvQWNjb3VudFRhZyIsInNldEFjY291bnRUYWdMYWJlbCIsImdldFBheW1lbnRVcmkiLCJyZWNpcGllbnRfbmFtZSIsImdldFJlY2lwaWVudE5hbWUiLCJ0eF9kZXNjcmlwdGlvbiIsImdldE5vdGUiLCJ1cmkiLCJwYXJzZVBheW1lbnRVcmkiLCJNb25lcm9UeENvbmZpZyIsInNldFJlY2lwaWVudE5hbWUiLCJzZXROb3RlIiwiZ2V0QXR0cmlidXRlIiwidmFsdWUiLCJzZXRBdHRyaWJ1dGUiLCJ2YWwiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsInRocmVhZHNfY291bnQiLCJkb19iYWNrZ3JvdW5kX21pbmluZyIsImlnbm9yZV9iYXR0ZXJ5Iiwic3RvcE1pbmluZyIsImlzTXVsdGlzaWdJbXBvcnROZWVkZWQiLCJtdWx0aXNpZ19pbXBvcnRfbmVlZGVkIiwiZ2V0TXVsdGlzaWdJbmZvIiwiaW5mbyIsIk1vbmVyb011bHRpc2lnSW5mbyIsInNldElzTXVsdGlzaWciLCJtdWx0aXNpZyIsInNldElzUmVhZHkiLCJyZWFkeSIsInNldFRocmVzaG9sZCIsInRocmVzaG9sZCIsInNldE51bVBhcnRpY2lwYW50cyIsInByZXBhcmVNdWx0aXNpZyIsIm11bHRpc2lnX2luZm8iLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJtc1Jlc3VsdCIsIk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsInNldE11bHRpc2lnSGV4IiwiZ2V0TXVsdGlzaWdIZXgiLCJleHBvcnRNdWx0aXNpZ0hleCIsImltcG9ydE11bHRpc2lnSGV4IiwicmVmcmVzaEFmdGVySW1wb3J0IiwicmVmcmVzaF9hZnRlcl9pbXBvcnQiLCJuX291dHB1dHMiLCJzaWduTXVsdGlzaWdUeEhleCIsIm11bHRpc2lnVHhIZXgiLCJzaWduUmVzdWx0IiwiTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0Iiwic2V0U2lnbmVkTXVsdGlzaWdUeEhleCIsInNldFR4SGFzaGVzIiwic3VibWl0TXVsdGlzaWdUeEhleCIsInNpZ25lZE11bHRpc2lnVHhIZXgiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJvbGRfcGFzc3dvcmQiLCJuZXdfcGFzc3dvcmQiLCJzYXZlIiwiY2xvc2UiLCJpc0Nsb3NlZCIsInN0b3AiLCJnZXRJbmNvbWluZ1RyYW5zZmVycyIsImdldE91dGdvaW5nVHJhbnNmZXJzIiwiY3JlYXRlVHgiLCJyZWxheVR4IiwiZ2V0VHhOb3RlIiwic2V0VHhOb3RlIiwibm90ZSIsImNvbm5lY3RUb1dhbGxldFJwYyIsInVyaU9yQ29uZmlnIiwibm9ybWFsaXplQ29uZmlnIiwiY21kIiwic3RhcnRXYWxsZXRScGNQcm9jZXNzIiwiY2hpbGRfcHJvY2VzcyIsIlByb21pc2UiLCJyZXNvbHZlIiwidGhlbiIsImNoaWxkUHJvY2VzcyIsInNwYXduIiwiZW52IiwiTEFORyIsInN0ZG91dCIsInNldEVuY29kaW5nIiwic3RkZXJyIiwidGhhdCIsInJlamVjdCIsIm9uIiwibGluZSIsIkxpYnJhcnlVdGlscyIsImxvZyIsInVyaUxpbmVDb250YWlucyIsInVyaUxpbmVDb250YWluc0lkeCIsImhvc3QiLCJzdWJzdHJpbmciLCJsYXN0SW5kZXhPZiIsInVuZm9ybWF0dGVkTGluZSIsInJlcGxhY2UiLCJ0cmltIiwicG9ydCIsInNzbElkeCIsInNzbEVuYWJsZWQiLCJ1c2VyUGFzc0lkeCIsInVzZXJQYXNzIiwiem1xVXJpSWR4Iiwiem1xVXJpIiwicHJveHlVcmlJZHgiLCJwcm94eVVyaSIsInJlamVjdFVuYXV0aG9yaXplZCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsIndhbGxldCIsImlzUmVzb2x2ZWQiLCJnZXRMb2dMZXZlbCIsImNvZGUiLCJvcmlnaW4iLCJsaXN0ZW5lckdlbmVyYXRpb24iLCJyZXNldCIsImdldEFjY291bnRJbmRpY2VzIiwidHhRdWVyeSIsImNhbkJlQ29uZmlybWVkIiwiZ2V0SW5UeFBvb2wiLCJnZXRJc0ZhaWxlZCIsImNhbkJlSW5UeFBvb2wiLCJnZXRNYXhIZWlnaHQiLCJnZXRJc0xvY2tlZCIsImNhbkJlSW5jb21pbmciLCJnZXRJc0luY29taW5nIiwiZ2V0SXNPdXRnb2luZyIsImdldEhhc0Rlc3RpbmF0aW9ucyIsImNhbkJlT3V0Z29pbmciLCJpbiIsIm91dCIsInBvb2wiLCJwZW5kaW5nIiwiZmFpbGVkIiwiZ2V0TWluSGVpZ2h0IiwibWluX2hlaWdodCIsIm1heF9oZWlnaHQiLCJmaWx0ZXJfYnlfaGVpZ2h0IiwiZ2V0U3ViYWRkcmVzc0luZGV4Iiwic2l6ZSIsImZyb20iLCJycGNUeCIsImNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlciIsImdldE91dGdvaW5nQW1vdW50Iiwib3V0Z29pbmdUcmFuc2ZlciIsInRyYW5zZmVyVG90YWwiLCJ2YWx1ZXMiLCJzb3J0IiwiY29tcGFyZVR4c0J5SGVpZ2h0Iiwic2V0SXNJbmNvbWluZyIsInNldElzT3V0Z29pbmciLCJjb21wYXJlSW5jb21pbmdUcmFuc2ZlcnMiLCJ0cmFuc2Zlcl90eXBlIiwiZ2V0SXNTcGVudCIsInZlcmJvc2UiLCJycGNPdXRwdXQiLCJjb252ZXJ0UnBjVHhXaXRoT3V0cHV0IiwiY29tcGFyZU91dHB1dHMiLCJycGNJbWFnZSIsIk1vbmVyb0tleUltYWdlIiwiTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQiLCJzZXRPZmZzZXQiLCJzZXRLZXlJbWFnZXMiLCJiZWxvd19hbW91bnQiLCJnZXRCZWxvd0Ftb3VudCIsInNldElzTG9ja2VkIiwic2V0SXNDb25maXJtZWQiLCJzZXRSZWxheSIsInNldElzTWluZXJUeCIsInNldElzRmFpbGVkIiwiTW9uZXJvRGVzdGluYXRpb24iLCJzZXREZXN0aW5hdGlvbnMiLCJzZXRPdXRnb2luZ1RyYW5zZmVyIiwiZ2V0VW5sb2NrVGltZSIsInNldFVubG9ja1RpbWUiLCJnZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsInNldExhc3RSZWxheWVkVGltZXN0YW1wIiwiRGF0ZSIsImdldFRpbWUiLCJnZXRJc0RvdWJsZVNwZW5kU2VlbiIsInNldElzRG91YmxlU3BlbmRTZWVuIiwibGlzdGVuZXJzIiwiV2FsbGV0UG9sbGVyIiwic2V0SXNQb2xsaW5nIiwiaXNQb2xsaW5nIiwic2VydmVyIiwicHJveHlUb1dvcmtlciIsInNldFByaW1hcnlBZGRyZXNzIiwic2V0VGFnIiwiZ2V0VGFnIiwic2V0UmluZ1NpemUiLCJNb25lcm9VdGlscyIsIlJJTkdfU0laRSIsIk1vbmVyb091dGdvaW5nVHJhbnNmZXIiLCJzZXRUeCIsImRlc3RDb3BpZXMiLCJkZXN0IiwiY29udmVydFJwY1R4U2V0IiwicnBjTWFwIiwiTW9uZXJvVHhTZXQiLCJzZXRNdWx0aXNpZ1R4SGV4Iiwic2V0VW5zaWduZWRUeEhleCIsInNldFNpZ25lZFR4SGV4Iiwic2lnbmVkX3R4c2V0IiwiZ2V0U2lnbmVkVHhIZXgiLCJycGNUeHMiLCJzZXRUeHMiLCJzZXRUeFNldCIsInNldEhhc2giLCJzZXRLZXkiLCJzZXRGdWxsSGV4Iiwic2V0TWV0YWRhdGEiLCJzZXRGZWUiLCJzZXRXZWlnaHQiLCJpbnB1dEtleUltYWdlc0xpc3QiLCJhc3NlcnRUcnVlIiwiZ2V0SW5wdXRzIiwic2V0SW5wdXRzIiwiaW5wdXRLZXlJbWFnZSIsIk1vbmVyb091dHB1dFdhbGxldCIsInNldEtleUltYWdlIiwic2V0SGV4IiwiYW1vdW50c0J5RGVzdExpc3QiLCJkZXN0aW5hdGlvbklkeCIsInR4SWR4IiwiYW1vdW50c0J5RGVzdCIsImlzT3V0Z29pbmciLCJ0eXBlIiwiZGVjb2RlUnBjVHlwZSIsImhlYWRlciIsInNldFNpemUiLCJNb25lcm9CbG9ja0hlYWRlciIsInNldFRpbWVzdGFtcCIsIk1vbmVyb0luY29taW5nVHJhbnNmZXIiLCJzZXROdW1TdWdnZXN0ZWRDb25maXJtYXRpb25zIiwiREVGQVVMVF9QQVlNRU5UX0lEIiwicnBjSW5kaWNlcyIsInJwY0luZGV4Iiwic2V0U3ViYWRkcmVzc0luZGV4IiwicnBjRGVzdGluYXRpb24iLCJkZXN0aW5hdGlvbktleSIsInJwY1NvdXJjZSIsImlucHV0IiwiZ2xvYmFsX2luZGV4IiwicHVia2V5Iiwic2V0U3RlYWx0aFB1YmxpY0tleSIsInNldElucHV0U3VtIiwic2V0T3V0cHV0U3VtIiwic2V0Q2hhbmdlQWRkcmVzcyIsInNldENoYW5nZUFtb3VudCIsInNldE51bUR1bW15T3V0cHV0cyIsInNldEV4dHJhSGV4IiwiaW5wdXRLZXlJbWFnZXMiLCJrZXlfaW1hZ2VzIiwiYW1vdW50cyIsInNldEJsb2NrIiwiTW9uZXJvQmxvY2siLCJtZXJnZSIsInNldEluY29taW5nVHJhbnNmZXJzIiwic2V0SXNTcGVudCIsInNldElzRnJvemVuIiwic2V0T3V0cHV0cyIsInJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQiLCJycGNUeXBlIiwiYVR4IiwiYUJsb2NrIiwidHgxIiwidHgyIiwiZGlmZiIsInQxIiwidDIiLCJvMSIsIm8yIiwiaGVpZ2h0Q29tcGFyaXNvbiIsImNvbXBhcmUiLCJsb2NhbGVDb21wYXJlIiwiZXhwb3J0cyIsInByZXZMb2NrZWRUeHNNaW5IZWlnaHQiLCJnZW5lcmF0aW9uIiwic25hcHNob3RHZW5lcmF0aW9uIiwibG9vcGVyIiwiVGFza0xvb3BlciIsInByZXZMb2NrZWRUeHMiLCJwcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zIiwicHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMiLCJ0aHJlYWRQb29sIiwiVGhyZWFkUG9vbCIsIm51bVBvbGxpbmciLCJzdGFydCIsInBlcmlvZEluTXMiLCJzdWJtaXQiLCJwcmV2SGVpZ2h0IiwicHJldkJhbGFuY2VzIiwiTW9uZXJvVHhRdWVyeSIsIm9uTmV3QmxvY2siLCJtaW5IZWlnaHQiLCJtYXgiLCJsb2NrZWRUeHMiLCJzZXRNaW5IZWlnaHQiLCJzZXRJbmNsdWRlT3V0cHV0cyIsIm5vTG9uZ2VyTG9ja2VkSGFzaGVzIiwicHJldkxvY2tlZFR4IiwicHJldk1pbkhlaWdodCIsInVubG9ja2VkVHhzIiwic2V0SGFzaGVzIiwibG9ja2VkVHgiLCJzZWFyY2hTZXQiLCJ1bmFubm91bmNlZCIsIm5vdGlmeU91dHB1dHMiLCJ1bmxvY2tlZFR4IiwibWlzc2VkQ29uZmlybSIsImRlbGV0ZSIsImNvbmZpcm1lZFR4IiwiY2hlY2tGb3JDaGFuZ2VkQmFsYW5jZXMiLCJhbm5vdW5jZU5ld0Jsb2NrIiwiZ2V0RmVlIiwiYW5ub3VuY2VPdXRwdXRTcGVudCIsImFubm91bmNlT3V0cHV0UmVjZWl2ZWQiLCJiYWxhbmNlcyIsImFubm91bmNlQmFsYW5jZXNDaGFuZ2VkIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldFJwYy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuLi9jb21tb24vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgVGFza0xvb3BlciBmcm9tIFwiLi4vY29tbW9uL1Rhc2tMb29wZXJcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50IGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50VGFnIGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRUYWdcIjtcbmltcG9ydCBNb25lcm9BZGRyZXNzQm9va0VudHJ5IGZyb20gXCIuL21vZGVsL01vbmVyb0FkZHJlc3NCb29rRW50cnlcIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tIZWFkZXIgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja0hlYWRlclwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrUmVzZXJ2ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1Jlc2VydmVcIjtcbmltcG9ydCBNb25lcm9DaGVja1R4IGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrVHhcIjtcbmltcG9ydCBNb25lcm9EZXN0aW5hdGlvbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EZXN0aW5hdGlvblwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbmNvbWluZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb0luY29taW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5mb1wiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luaXRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0UXVlcnlcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9ScGNFcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvU3ViYWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJhZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvU3luY1Jlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TeW5jUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlclF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyUXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFByaW9yaXR5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UHJpb3JpdHlcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1R4V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0IGZyb20gXCIuL01vbmVyb1dhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRDb25maWdcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0XCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi4vY29tbW9uL1RocmVhZFBvb2xcIjtcbmltcG9ydCBTc2xPcHRpb25zIGZyb20gXCIuLi9jb21tb24vU3NsT3B0aW9uc1wiO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIHdvb2RzZXJcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb1dhbGxldCBhcyBhIGNsaWVudCBvZiBtb25lcm8td2FsbGV0LXJwYy5cbiAqIFxuICogQGltcGxlbWVudHMge01vbmVyb1dhbGxldH1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvV2FsbGV0UnBjIGV4dGVuZHMgTW9uZXJvV2FsbGV0IHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA9IDIwMDAwOyAvLyBkZWZhdWx0IHBlcmlvZCBiZXR3ZWVuIHN5bmNzIGluIG1zIChkZWZpbmVkIGJ5IERFRkFVTFRfQVVUT19SRUZSRVNIX1BFUklPRCBpbiB3YWxsZXRfcnBjX3NlcnZlci5jcHApXG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPjtcbiAgcHJvdGVjdGVkIGFkZHJlc3NDYWNoZTogYW55O1xuICBwcm90ZWN0ZWQgc3luY1BlcmlvZEluTXM6IG51bWJlcjtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXTtcbiAgcHJvdGVjdGVkIHByb2Nlc3M6IGFueTtcbiAgcHJvdGVjdGVkIHBhdGg6IHN0cmluZztcbiAgcHJvdGVjdGVkIGRhZW1vbkNvbm5lY3Rpb246IE1vbmVyb1JwY0Nvbm5lY3Rpb247XG4gIHByb3RlY3RlZCB3YWxsZXRQb2xsZXI6IFdhbGxldFBvbGxlcjtcbiAgcHJvdGVjdGVkIHN0YXJ0dXBQcm94eVVyaTogc3RyaW5nO1xuICBcbiAgLyoqIEBwcml2YXRlICovXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9OyAvLyBhdm9pZCB1bmVjZXNzYXJ5IHJlcXVlc3RzIGZvciBhZGRyZXNzZXNcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gTW9uZXJvV2FsbGV0UnBjLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVM7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBSUEMgV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtDaGlsZFByb2Nlc3N9IHRoZSBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMsIHVuZGVmaW5lZCBpZiBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXG4gICAqL1xuICBnZXRQcm9jZXNzKCk6IENoaWxkUHJvY2VzcyB7XG4gICAgcmV0dXJuIHRoaXMucHJvY2VzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3AgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm8td2FsbGV0LXJwYywgaWYgYXBwbGljYWJsZS5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2Ugc3BlY2lmaWVzIGlmIHRoZSBwcm9jZXNzIHNob3VsZCBiZSBkZXN0cm95ZWQgZm9yY2libHkgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPn0gdGhlIGV4aXQgY29kZSBmcm9tIHN0b3BwaW5nIHRoZSBwcm9jZXNzXG4gICAqL1xuICBhc3luYyBzdG9wUHJvY2Vzcyhmb3JjZSA9IGZhbHNlKTogUHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+ICB7XG4gICAgaWYgKHRoaXMucHJvY2VzcyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMgaW5zdGFuY2Ugbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1wiKTtcbiAgICBsZXQgbGlzdGVuZXJzQ29weSA9IEdlblV0aWxzLmNvcHlBcnJheSh0aGlzLmdldExpc3RlbmVycygpKTtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnNDb3B5KSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gR2VuVXRpbHMua2lsbFByb2Nlc3ModGhpcy5wcm9jZXNzLCBmb3JjZSA/IFwiU0lHS0lMTFwiIDogdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgUlBDIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9uIHwgdW5kZWZpbmVkfSB0aGUgd2FsbGV0J3MgcnBjIGNvbm5lY3Rpb25cbiAgICovXG4gIGdldFJwY0Nvbm5lY3Rpb24oKTogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+T3BlbiBhbiBleGlzdGluZyB3YWxsZXQgb24gdGhlIG1vbmVyby13YWxsZXQtcnBjIHNlcnZlci48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlOjxwPlxuICAgKiBcbiAgICogPGNvZGU+XG4gICAqIGxldCB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0UnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4NFwiLCBcInJwY191c2VyXCIsIFwiYWJjMTIzXCIpOzxicj5cbiAgICogYXdhaXQgd2FsbGV0Lm9wZW5XYWxsZXQoXCJteXdhbGxldDFcIiwgXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIpOzxicj5cbiAgICogPGJyPlxuICAgKiBhd2FpdCB3YWxsZXQub3BlbldhbGxldCh7PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGF0aDogXCJteXdhbGxldDJcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VydmVyOiBcImh0dHA6Ly9sb2NhaG9zdDozODA4MVwiLCAvLyBvciBvYmplY3Qgd2l0aCB1cmksIHVzZXJuYW1lLCBwYXNzd29yZCwgZXRjIDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2U8YnI+XG4gICAqIH0pOzxicj5cbiAgICogPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvV2FsbGV0Q29uZmlnfSBwYXRoT3JDb25maWcgIC0gdGhlIHdhbGxldCdzIG5hbWUgb3IgY29uZmlndXJhdGlvbiB0byBvcGVuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoT3JDb25maWcucGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCBpbi1tZW1vcnkgd2FsbGV0IGlmIG5vdCBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhPckNvbmZpZy5wYXNzd29yZCAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IHBhdGhPckNvbmZpZy5zZXJ2ZXIgLSB1cmkgb3IgTW9uZXJvUnBjQ29ubmVjdGlvbiBvZiBhIGRhZW1vbiB0byB1c2UgKG9wdGlvbmFsLCBtb25lcm8td2FsbGV0LXJwYyB1c3VhbGx5IHN0YXJ0ZWQgd2l0aCBkYWVtb24gY29uZmlnKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3Bhc3N3b3JkXSB0aGUgd2FsbGV0J3MgcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9XYWxsZXRScGM+fSB0aGlzIHdhbGxldCBjbGllbnRcbiAgICovXG4gIGFzeW5jIG9wZW5XYWxsZXQocGF0aE9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4sIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHR5cGVvZiBwYXRoT3JDb25maWcgPT09IFwic3RyaW5nXCIgPyB7cGF0aDogcGF0aE9yQ29uZmlnLCBwYXNzd29yZDogcGFzc3dvcmQgPyBwYXNzd29yZCA6IFwiXCJ9IDogcGF0aE9yQ29uZmlnKTtcbiAgICAvLyBUT0RPOiBlbnN1cmUgb3RoZXIgZmllbGRzIHVuaW5pdGlhbGl6ZWQ/XG4gICAgXG4gICAgLy8gb3BlbiB3YWxsZXQgb24gcnBjIHNlcnZlclxuICAgIGlmICghY29uZmlnLmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIG5hbWUgb2Ygd2FsbGV0IHRvIG9wZW5cIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZWd0ZXN0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcmVndGVzdCBtb2RlIHdoZW4gb3BlbmluZyBSUEMgd2FsbGV0XCIpXG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwib3Blbl93YWxsZXRcIiwge2ZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLCBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCl9KTtcbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICB0aGlzLl9pc0Nsb3NlZCA9IGZhbHNlO1xuXG4gICAgLy8gc2V0IGNvbm5lY3Rpb24gbWFuYWdlciBvciBzZXJ2ZXJcbiAgICBpZiAoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkgIT0gbnVsbCkge1xuICAgICAgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBvcGVuZWQgd2l0aCBhIHNlcnZlciBvciBjb25uZWN0aW9uIG1hbmFnZXIgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgYXdhaXQgdGhpcy5zZXRDb25uZWN0aW9uTWFuYWdlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSk7XG4gICAgfSBlbHNlIGlmIChjb25maWcuZ2V0U2VydmVyKCkgIT0gbnVsbCkge1xuICAgICAgYXdhaXQgdGhpcy5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZy5nZXRTZXJ2ZXIoKSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+Q3JlYXRlIGFuZCBvcGVuIGEgd2FsbGV0IG9uIHRoZSBtb25lcm8td2FsbGV0LXJwYyBzZXJ2ZXIuPHA+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlOjxwPlxuICAgKiBcbiAgICogPGNvZGU+XG4gICAqICZzb2w7JnNvbDsgY29uc3RydWN0IGNsaWVudCB0byBtb25lcm8td2FsbGV0LXJwYzxicj5cbiAgICogbGV0IHdhbGxldFJwYyA9IG5ldyBNb25lcm9XYWxsZXRScGMoXCJodHRwOi8vbG9jYWxob3N0OjM4MDg0XCIsIFwicnBjX3VzZXJcIiwgXCJhYmMxMjNcIik7PGJyPjxicj5cbiAgICogXG4gICAqICZzb2w7JnNvbDsgY3JlYXRlIGFuZCBvcGVuIHdhbGxldCBvbiBtb25lcm8td2FsbGV0LXJwYzxicj5cbiAgICogYXdhaXQgd2FsbGV0UnBjLmNyZWF0ZVdhbGxldCh7PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGF0aDogXCJteXdhbGxldFwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImFiYzEyM1wiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHNlZWQ6IFwiY29leGlzdCBpZ2xvbyBwYW1waGxldCBsYWdvb24uLi5cIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyByZXN0b3JlSGVpZ2h0OiAxNTQzMjE4bDxicj5cbiAgICogfSk7XG4gICAqICA8L2NvZGU+XG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPn0gY29uZmlnIC0gTW9uZXJvV2FsbGV0Q29uZmlnIG9yIGVxdWl2YWxlbnQgSlMgb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhdGhdIC0gcGF0aCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIGluLW1lbW9yeSB3YWxsZXQgaWYgbm90IGdpdmVuKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXNzd29yZF0gLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZWVkXSAtIHNlZWQgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCByYW5kb20gd2FsbGV0IGNyZWF0ZWQgaWYgbmVpdGhlciBzZWVkIG5vciBrZXlzIGdpdmVuKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZWVkT2Zmc2V0XSAtIHRoZSBvZmZzZXQgdXNlZCB0byBkZXJpdmUgYSBuZXcgc2VlZCBmcm9tIHRoZSBnaXZlbiBzZWVkIHRvIHJlY292ZXIgYSBzZWNyZXQgd2FsbGV0IGZyb20gdGhlIHNlZWRcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLmlzTXVsdGlzaWddIC0gcmVzdG9yZSBtdWx0aXNpZyB3YWxsZXQgZnJvbSBzZWVkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaW1hcnlBZGRyZXNzXSAtIHByaW1hcnkgYWRkcmVzcyBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob25seSBwcm92aWRlIGlmIHJlc3RvcmluZyBmcm9tIGtleXMpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVWaWV3S2V5XSAtIHByaXZhdGUgdmlldyBrZXkgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlU3BlbmRLZXldIC0gcHJpdmF0ZSBzcGVuZCBrZXkgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5yZXN0b3JlSGVpZ2h0XSAtIGJsb2NrIGhlaWdodCB0byBzdGFydCBzY2FubmluZyBmcm9tIChkZWZhdWx0cyB0byAwIHVubGVzcyBnZW5lcmF0aW5nIHJhbmRvbSB3YWxsZXQpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmxhbmd1YWdlXSAtIGxhbmd1YWdlIG9mIHRoZSB3YWxsZXQncyBtbmVtb25pYyBwaHJhc2Ugb3Igc2VlZCAoZGVmYXVsdHMgdG8gXCJFbmdsaXNoXCIgb3IgYXV0by1kZXRlY3RlZClcbiAgICogQHBhcmFtIHtNb25lcm9ScGNDb25uZWN0aW9ufSBbY29uZmlnLnNlcnZlcl0gLSBNb25lcm9ScGNDb25uZWN0aW9uIHRvIGEgbW9uZXJvIGRhZW1vbiAob3B0aW9uYWwpPGJyPlxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZXJ2ZXJVcmldIC0gdXJpIG9mIGEgZGFlbW9uIHRvIHVzZSAob3B0aW9uYWwsIG1vbmVyby13YWxsZXQtcnBjIHVzdWFsbHkgc3RhcnRlZCB3aXRoIGRhZW1vbiBjb25maWcpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclVzZXJuYW1lXSAtIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBkYWVtb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZXJ2ZXJQYXNzd29yZF0gLSBwYXNzd29yZCB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgZGFlbW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9Db25uZWN0aW9uTWFuYWdlcn0gW2NvbmZpZy5jb25uZWN0aW9uTWFuYWdlcl0gLSBtYW5hZ2UgY29ubmVjdGlvbnMgdG8gbW9uZXJvZCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5yZWplY3RVbmF1dGhvcml6ZWRdIC0gcmVqZWN0IHNlbGYtc2lnbmVkIHNlcnZlciBjZXJ0aWZpY2F0ZXMgaWYgdHJ1ZSAoZGVmYXVsdHMgdG8gdHJ1ZSlcbiAgICogQHBhcmFtIHtNb25lcm9ScGNDb25uZWN0aW9ufSBbY29uZmlnLnNlcnZlcl0gLSBNb25lcm9ScGNDb25uZWN0aW9uIG9yIGVxdWl2YWxlbnQgSlMgb2JqZWN0IHByb3ZpZGluZyBkYWVtb24gY29uZmlndXJhdGlvbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5zYXZlQ3VycmVudF0gLSBzcGVjaWZpZXMgaWYgdGhlIGN1cnJlbnQgUlBDIHdhbGxldCBzaG91bGQgYmUgc2F2ZWQgYmVmb3JlIGJlaW5nIGNsb3NlZCAoZGVmYXVsdCB0cnVlKVxuICAgKiBAcmV0dXJuIHtNb25lcm9XYWxsZXRScGN9IHRoaXMgd2FsbGV0IGNsaWVudFxuICAgKi9cbiAgYXN5bmMgY3JlYXRlV2FsbGV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGNvbmZpZyB0byBjcmVhdGUgd2FsbGV0XCIpO1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQgJiYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpdmF0ZVZpZXdLZXkoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgaW5pdGlhbGl6ZWQgd2l0aCBhIHNlZWQgb3Iga2V5cyBidXQgbm90IGJvdGhcIik7XG4gICAgfVxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFJlZ3Rlc3QoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSByZWd0ZXN0IG1vZGUgd2hlbiBjcmVhdGluZyBSUEMgd2FsbGV0XCIpXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0TmV0d29ya1R5cGUoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBuZXR3b3JrVHlwZSB3aGVuIGNyZWF0aW5nIFJQQyB3YWxsZXQgYmVjYXVzZSBzZXJ2ZXIncyBuZXR3b3JrIHR5cGUgaXMgYWxyZWFkeSBzZXRcIik7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudExvb2thaGVhZCgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzTG9va2FoZWFkKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3Qgc3VwcG9ydCBjcmVhdGluZyB3YWxsZXRzIHdpdGggc3ViYWRkcmVzcyBsb29rYWhlYWQgb3ZlciBycGNcIik7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UGFzc3dvcmQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWdOb3JtYWxpemVkLnNldFBhc3N3b3JkKFwiXCIpO1xuXG4gICAgLy8gc2V0IHNlcnZlciBmcm9tIGNvbm5lY3Rpb24gbWFuYWdlciBpZiBwcm92aWRlZFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpIHtcbiAgICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlcnZlcigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIGNyZWF0ZWQgd2l0aCBhIHNlcnZlciBvciBjb25uZWN0aW9uIG1hbmFnZXIgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgY29uZmlnTm9ybWFsaXplZC5zZXRTZXJ2ZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkuZ2V0Q29ubmVjdGlvbigpKTtcbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQpIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnTm9ybWFsaXplZCk7XG4gICAgZWxzZSBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkKSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZ05vcm1hbGl6ZWQpO1xuICAgIGVsc2UgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRSYW5kb20oY29uZmlnTm9ybWFsaXplZCk7XG4gICAgdGhpcy5faXNDbG9zZWQgPSBmYWxzZTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXIgb3Igc2VydmVyXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXRDb25uZWN0aW9uTWFuYWdlcihjb25maWdOb3JtYWxpemVkLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIH0gZWxzZSBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldFJhbmRvbShjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHJlc3RvcmVIZWlnaHQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKSA9PT0gZmFsc2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkN1cnJlbnQgd2FsbGV0IGlzIHNhdmVkIGF1dG9tYXRpY2FsbHkgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmICghY29uZmlnLmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTmFtZSBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0TGFuZ3VhZ2UoKSkgY29uZmlnLnNldExhbmd1YWdlKE1vbmVyb1dhbGxldC5ERUZBVUxUX0xBTkdVQUdFKTtcbiAgICBsZXQgcGFyYW1zID0geyBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSwgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLCBsYW5ndWFnZTogY29uZmlnLmdldExhbmd1YWdlKCkgfTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX3dhbGxldFwiLCBwYXJhbXMpO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aGlzLmhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKGNvbmZpZy5nZXRQYXRoKCksIGVycik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVzdG9yZV9kZXRlcm1pbmlzdGljX3dhbGxldFwiLCB7XG4gICAgICAgIGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLFxuICAgICAgICBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksXG4gICAgICAgIHNlZWQ6IGNvbmZpZy5nZXRTZWVkKCksXG4gICAgICAgIHNlZWRfb2Zmc2V0OiBjb25maWcuZ2V0U2VlZE9mZnNldCgpLFxuICAgICAgICBlbmFibGVfbXVsdGlzaWdfZXhwZXJpbWVudGFsOiBjb25maWcuZ2V0SXNNdWx0aXNpZygpLFxuICAgICAgICByZXN0b3JlX2hlaWdodDogY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSxcbiAgICAgICAgbGFuZ3VhZ2U6IGNvbmZpZy5nZXRMYW5ndWFnZSgpLFxuICAgICAgICBhdXRvc2F2ZV9jdXJyZW50OiBjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBrZXlzXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRSZXN0b3JlSGVpZ2h0KDApO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoTW9uZXJvV2FsbGV0LkRFRkFVTFRfTEFOR1VBR0UpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZW5lcmF0ZV9mcm9tX2tleXNcIiwge1xuICAgICAgICBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSxcbiAgICAgICAgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLFxuICAgICAgICBhZGRyZXNzOiBjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSxcbiAgICAgICAgdmlld2tleTogY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCksXG4gICAgICAgIHNwZW5ka2V5OiBjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCksXG4gICAgICAgIHJlc3RvcmVfaGVpZ2h0OiBjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpLFxuICAgICAgICBhdXRvc2F2ZV9jdXJyZW50OiBjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBoYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihuYW1lLCBlcnIpIHtcbiAgICBpZiAoZXJyLm1lc3NhZ2UpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwiYWxyZWFkeSBleGlzdHNcIikpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBuYW1lLCBlcnIuZ2V0Q29kZSgpLCBlcnIuZ2V0UnBjTWV0aG9kKCksIGVyci5nZXRScGNQYXJhbXMoKSk7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcIndvcmQgbGlzdCBmYWlsZWQgdmVyaWZpY2F0aW9uXCIpKSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoXCJJbnZhbGlkIG1uZW1vbmljXCIsIGVyci5nZXRDb2RlKCksIGVyci5nZXRScGNNZXRob2QoKSwgZXJyLmdldFJwY1BhcmFtcygpKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9XG4gIFxuICBhc3luYyBpc1ZpZXdPbmx5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwge2tleV90eXBlOiBcIm1uZW1vbmljXCJ9KTtcbiAgICAgIHJldHVybiBmYWxzZTsgLy8ga2V5IHJldHJpZXZhbCBzdWNjZWVkcyBpZiBub3QgdmlldyBvbmx5XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0yOSkgcmV0dXJuIHRydWU7ICAvLyB3YWxsZXQgaXMgdmlldyBvbmx5XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0xKSByZXR1cm4gZmFsc2U7ICAvLyB3YWxsZXQgaXMgb2ZmbGluZSBidXQgbm90IHZpZXcgb25seVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvUnBjQ29ubmVjdGlvbn0gW3VyaU9yQ29ubmVjdGlvbl0gLSB0aGUgZGFlbW9uJ3MgVVJJIG9yIGNvbm5lY3Rpb24gKGRlZmF1bHRzIHRvIG9mZmxpbmUpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNUcnVzdGVkIC0gaW5kaWNhdGVzIGlmIHRoZSBkYWVtb24gaW4gdHJ1c3RlZFxuICAgKiBAcGFyYW0ge1NzbE9wdGlvbnN9IHNzbE9wdGlvbnMgLSBjdXN0b20gU1NMIGNvbmZpZ3VyYXRpb25cbiAgICovXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uPzogUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IHN0cmluZywgaXNUcnVzdGVkPzogYm9vbGVhbiwgc3NsT3B0aW9ucz86IFNzbE9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgY29ubmVjdGlvbiA9ICF1cmlPckNvbm5lY3Rpb24gPyB1bmRlZmluZWQgOiB1cmlPckNvbm5lY3Rpb24gaW5zdGFuY2VvZiBNb25lcm9ScGNDb25uZWN0aW9uID8gdXJpT3JDb25uZWN0aW9uIDogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uKTtcbiAgICBpZiAoIXNzbE9wdGlvbnMpIHNzbE9wdGlvbnMgPSBuZXcgU3NsT3B0aW9ucygpO1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hZGRyZXNzID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0VXJpKCkgOiBcImJhZF91cmlcIjsgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogYmFkIGRhZW1vbiB1cmkgbmVjZXNzYXJ5IGZvciBvZmZsaW5lP1xuICAgIHBhcmFtcy51c2VybmFtZSA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFVzZXJuYW1lKCkgOiBcIlwiO1xuICAgIHBhcmFtcy5wYXNzd29yZCA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIHBhcmFtcy50cnVzdGVkID0gaXNUcnVzdGVkO1xuICAgIHBhcmFtcy5zc2xfc3VwcG9ydCA9IFwiYXV0b2RldGVjdFwiO1xuICAgIHBhcmFtcy5zc2xfcHJpdmF0ZV9rZXlfcGF0aCA9IHNzbE9wdGlvbnMuZ2V0UHJpdmF0ZUtleVBhdGgoKTtcbiAgICBwYXJhbXMuc3NsX2NlcnRpZmljYXRlX3BhdGggID0gc3NsT3B0aW9ucy5nZXRDZXJ0aWZpY2F0ZVBhdGgoKTtcbiAgICBwYXJhbXMuc3NsX2NhX2ZpbGUgPSBzc2xPcHRpb25zLmdldENlcnRpZmljYXRlQXV0aG9yaXR5RmlsZSgpO1xuICAgIHBhcmFtcy5zc2xfYWxsb3dlZF9maW5nZXJwcmludHMgPSBzc2xPcHRpb25zLmdldEFsbG93ZWRGaW5nZXJwcmludHMoKTtcbiAgICBwYXJhbXMuc3NsX2FsbG93X2FueV9jZXJ0ID0gc3NsT3B0aW9ucy5nZXRBbGxvd0FueUNlcnQoKTtcblxuICAgIC8vIHNldCBwcm94eSB3aGljaCBtdXN0IG1hdGNoIHN0YXJ0dXAgcHJveHkgaWYgYXBwbGljYWJsZVxuICAgIGlmIChjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodGhpcy5zdGFydHVwUHJveHlVcmkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNldCBkYWVtb24gY29ubmVjdGlvbiB3aXRob3V0IHByb3h5IFVSSSBiZWNhdXNlIG1vbmVyby13YWxsZXQtcnBjIHdhcyBzdGFydGVkIHdpdGggYSBwcm94eSBVUkk6IFwiICsgdGhpcy5zdGFydHVwUHJveHlVcmkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5zdGFydHVwUHJveHlVcmkgPT09IHVuZGVmaW5lZCkgcGFyYW1zLnByb3h5ID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA6IFwiXCI7XG4gICAgICBlbHNlIGlmICghR2VuVXRpbHMuaXNTYW1lUHJveHlVcmkodGhpcy5zdGFydHVwUHJveHlVcmksIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNldCBkYWVtb24gY29ubmVjdGlvbiB3aXRoIHByb3h5IFVSSSBcIiArIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSArIFwiIGJlY2F1c2UgbW9uZXJvLXdhbGxldC1ycGMgd2FzIHN0YXJ0ZWQgd2l0aCBhIGRpZmZlcmVudCBwcm94eSBVUkk6IFwiICsgdGhpcy5zdGFydHVwUHJveHlVcmkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXBhcmFtcy5wcm94eSkgcGFyYW1zLnByb3h5ID0gXCJcIjtcblxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9kYWVtb25cIiwgcGFyYW1zKTtcbiAgICB0aGlzLmRhZW1vbkNvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLmRhZW1vbkNvbm5lY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSB0b3RhbCBhbmQgdW5sb2NrZWQgYmFsYW5jZXMgaW4gYSBzaW5nbGUgcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbYWNjb3VudElkeF0gYWNjb3VudCBpbmRleFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N1YmFkZHJlc3NJZHhdIHN1YmFkZHJlc3MgaW5kZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxiaWdpbnRbXT59IGlzIHRoZSB0b3RhbCBhbmQgdW5sb2NrZWQgYmFsYW5jZXMgaW4gYW4gYXJyYXksIHJlc3BlY3RpdmVseVxuICAgKi9cbiAgYXN5bmMgZ2V0QmFsYW5jZXMoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50W10+IHtcbiAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzc0lkeCwgdW5kZWZpbmVkLCBcIk11c3QgcHJvdmlkZSBhY2NvdW50IGluZGV4IHdpdGggc3ViYWRkcmVzcyBpbmRleFwiKTtcbiAgICAgIGxldCBiYWxhbmNlID0gQmlnSW50KDApO1xuICAgICAgbGV0IHVubG9ja2VkQmFsYW5jZSA9IEJpZ0ludCgwKTtcbiAgICAgIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgdGhpcy5nZXRBY2NvdW50cygpKSB7XG4gICAgICAgIGJhbGFuY2UgPSBiYWxhbmNlICsgYWNjb3VudC5nZXRCYWxhbmNlKCk7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZSA9IHVubG9ja2VkQmFsYW5jZSArIGFjY291bnQuZ2V0VW5sb2NrZWRCYWxhbmNlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gW2JhbGFuY2UsIHVubG9ja2VkQmFsYW5jZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBwYXJhbXMgPSB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeCwgYWRkcmVzc19pbmRpY2VzOiBzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBbc3ViYWRkcmVzc0lkeF19O1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCBwYXJhbXMpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtCaWdJbnQocmVzcC5yZXN1bHQuYmFsYW5jZSksIEJpZ0ludChyZXNwLnJlc3VsdC51bmxvY2tlZF9iYWxhbmNlKV07XG4gICAgICBlbHNlIHJldHVybiBbQmlnSW50KHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzWzBdLmJhbGFuY2UpLCBCaWdJbnQocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3NbMF0udW5sb2NrZWRfYmFsYW5jZSldO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ09NTU9OIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9XYWxsZXRMaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN1cGVyLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZXNlcnZlUHJvb2YoYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpLCBcIlwiLCBcIlwiKTsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBwcm92aWRlIGJldHRlciB3YXkgdG8ga25vdyBpZiB3YWxsZXQgcnBjIGlzIGNvbm5lY3RlZCB0byBkYWVtb25cbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcImNoZWNrIHJlc2VydmUgZXhwZWN0ZWQgdG8gZmFpbFwiKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC0xMykgdGhyb3cgZTsgLy8gbm8gd2FsbGV0IGZpbGVcbiAgICAgIHJldHVybiBlLm1lc3NhZ2UuaW5kZXhPZihcIkZhaWxlZCB0byBjb25uZWN0IHRvIGRhZW1vblwiKSA8IDA7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3ZlcnNpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9WZXJzaW9uKHJlc3AucmVzdWx0LnZlcnNpb24sIHJlc3AucmVzdWx0LnJlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMucGF0aDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwibW5lbW9uaWNcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2UoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoYXdhaXQgdGhpcy5nZXRTZWVkKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMuZ2V0U2VlZExhbmd1YWdlKCkgbm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBsaXN0IG9mIGF2YWlsYWJsZSBsYW5ndWFnZXMgZm9yIHRoZSB3YWxsZXQncyBzZWVkLlxuICAgKiBcbiAgICogQHJldHVybiB7c3RyaW5nW119IHRoZSBhdmFpbGFibGUgbGFuZ3VhZ2VzIGZvciB0aGUgd2FsbGV0J3Mgc2VlZC5cbiAgICovXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZXMoKSB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfbGFuZ3VhZ2VzXCIpKS5yZXN1bHQubGFuZ3VhZ2VzO1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwidmlld19rZXlcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcInNwZW5kX2tleVwiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBzdWJhZGRyZXNzTWFwID0gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF07XG4gICAgaWYgKCFzdWJhZGRyZXNzTWFwKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHRydWUpOyAgLy8gY2FjaGUncyBhbGwgYWRkcmVzc2VzIGF0IHRoaXMgYWNjb3VudFxuICAgICAgcmV0dXJuIHRoaXMuZ2V0QWRkcmVzcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTsgICAgICAgIC8vIHJlY3Vyc2l2ZSBjYWxsIHVzZXMgY2FjaGVcbiAgICB9XG4gICAgbGV0IGFkZHJlc3MgPSBzdWJhZGRyZXNzTWFwW3N1YmFkZHJlc3NJZHhdO1xuICAgIGlmICghYWRkcmVzcykge1xuICAgICAgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCB0cnVlKTsgIC8vIGNhY2hlJ3MgYWxsIGFkZHJlc3NlcyBhdCB0aGlzIGFjY291bnRcbiAgICAgIHJldHVybiB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XVtzdWJhZGRyZXNzSWR4XTtcbiAgICB9XG4gICAgcmV0dXJuIGFkZHJlc3M7XG4gIH1cbiAgXG4gIC8vIFRPRE86IHVzZSBjYWNoZVxuICBhc3luYyBnZXRBZGRyZXNzSW5kZXgoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggcmVzdWx0IGFuZCBub3JtYWxpemUgZXJyb3IgaWYgYWRkcmVzcyBkb2VzIG5vdCBiZWxvbmcgdG8gdGhlIHdhbGxldFxuICAgIGxldCByZXNwO1xuICAgIHRyeSB7XG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NfaW5kZXhcIiwge2FkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTIpIHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29udmVydCBycGMgcmVzcG9uc2VcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKHthZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWFqb3IpO1xuICAgIHN1YmFkZHJlc3Muc2V0SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWlub3IpO1xuICAgIHJldHVybiBzdWJhZGRyZXNzO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3M/OiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IGludGVncmF0ZWRBZGRyZXNzU3RyID0gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfaW50ZWdyYXRlZF9hZGRyZXNzXCIsIHtzdGFuZGFyZF9hZGRyZXNzOiBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRfaWQ6IHBheW1lbnRJZH0pKS5yZXN1bHQuaW50ZWdyYXRlZF9hZGRyZXNzO1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3NTdHIpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUubWVzc2FnZS5pbmNsdWRlcyhcIkludmFsaWQgcGF5bWVudCBJRFwiKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBwYXltZW50IElEOiBcIiArIHBheW1lbnRJZCk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNwbGl0X2ludGVncmF0ZWRfYWRkcmVzc1wiLCB7aW50ZWdyYXRlZF9hZGRyZXNzOiBpbnRlZ3JhdGVkQWRkcmVzc30pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoKS5zZXRTdGFuZGFyZEFkZHJlc3MocmVzcC5yZXN1bHQuc3RhbmRhcmRfYWRkcmVzcykuc2V0UGF5bWVudElkKHJlc3AucmVzdWx0LnBheW1lbnRfaWQpLnNldEludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfaGVpZ2h0XCIpKS5yZXN1bHQuaGVpZ2h0O1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGdldHRpbmcgdGhlIGNoYWluIGhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF5OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGluZyBhIGhlaWdodCBieSBkYXRlXCIpO1xuICB9XG4gIFxuICBhc3luYyBzeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodD86IE1vbmVyb1dhbGxldExpc3RlbmVyIHwgbnVtYmVyLCBzdGFydEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvU3luY1Jlc3VsdD4ge1xuICAgIGFzc2VydCghKGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyKSwgXCJNb25lcm8gV2FsbGV0IFJQQyBkb2VzIG5vdCBzdXBwb3J0IHJlcG9ydGluZyBzeW5jIHByb2dyZXNzXCIpO1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlZnJlc2hcIiwge3N0YXJ0X2hlaWdodDogc3RhcnRIZWlnaHR9KTtcbiAgICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3AucmVzdWx0LmJsb2Nrc19mZXRjaGVkLCByZXNwLnJlc3VsdC5yZWNlaXZlZF9tb25leSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZSA9PT0gXCJubyBjb25uZWN0aW9uIHRvIGRhZW1vblwiKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXM/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBcbiAgICAvLyBjb252ZXJ0IG1zIHRvIHNlY29uZHMgZm9yIHJwYyBwYXJhbWV0ZXJcbiAgICBsZXQgc3luY1BlcmlvZEluU2Vjb25kcyA9IE1hdGgucm91bmQoKHN5bmNQZXJpb2RJbk1zID09PSB1bmRlZmluZWQgPyBNb25lcm9XYWxsZXRScGMuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA6IHN5bmNQZXJpb2RJbk1zKSAvIDEwMDApO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhdXRvX3JlZnJlc2hcIiwge1xuICAgICAgZW5hYmxlOiB0cnVlLFxuICAgICAgcGVyaW9kOiBzeW5jUGVyaW9kSW5TZWNvbmRzXG4gICAgfSk7XG4gICAgXG4gICAgLy8gdXBkYXRlIHN5bmMgcGVyaW9kIGZvciBwb2xsZXJcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gc3luY1BlcmlvZEluU2Vjb25kcyAqIDEwMDA7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyICE9PSB1bmRlZmluZWQpIHRoaXMud2FsbGV0UG9sbGVyLnNldFBlcmlvZEluTXModGhpcy5zeW5jUGVyaW9kSW5Ncyk7XG4gICAgXG4gICAgLy8gcG9sbCBpZiBsaXN0ZW5pbmdcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgfVxuXG4gIGdldFN5bmNQZXJpb2RJbk1zKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuc3luY1BlcmlvZEluTXM7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhdXRvX3JlZnJlc2hcIiwgeyBlbmFibGU6IGZhbHNlIH0pO1xuICB9XG4gIFxuICBhc3luYyBzY2FuVHhzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdHhIYXNoZXMgfHwgIXR4SGFzaGVzLmxlbmd0aCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gdHggaGFzaGVzIGdpdmVuIHRvIHNjYW5cIik7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2Nhbl90eFwiLCB7dHhpZHM6IHR4SGFzaGVzfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhblNwZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc2Nhbl9zcGVudFwiLCB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc2Nhbl9ibG9ja2NoYWluXCIsIHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbGFuY2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYWxhbmNlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCB0YWc/OiBzdHJpbmcsIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnRbXT4ge1xuICAgIFxuICAgIC8vIGZldGNoIGFjY291bnRzIGZyb20gcnBjXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWNjb3VudHNcIiwge3RhZzogdGFnfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgYWNjb3VudCBvYmplY3RzIGFuZCBmZXRjaCBzdWJhZGRyZXNzZXMgcGVyIGFjY291bnQgdXNpbmcgZ2V0X2FkZHJlc3NcbiAgICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBnZXRfYWRkcmVzcyBzaG91bGQgc3VwcG9ydCBhbGxfYWNjb3VudHMgc28gbm90IGNhbGxlZCBvbmNlIHBlciBhY2NvdW50XG4gICAgbGV0IGFjY291bnRzOiBNb25lcm9BY2NvdW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBycGNBY2NvdW50IG9mIHJlc3AucmVzdWx0LnN1YmFkZHJlc3NfYWNjb3VudHMpIHtcbiAgICAgIGxldCBhY2NvdW50ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNBY2NvdW50KHJwY0FjY291bnQpO1xuICAgICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMpIGFjY291bnQuc2V0U3ViYWRkcmVzc2VzKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnQuZ2V0SW5kZXgoKSwgdW5kZWZpbmVkLCB0cnVlKSk7XG4gICAgICBhY2NvdW50cy5wdXNoKGFjY291bnQpO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgbWVyZ2UgZmllbGRzIGZyb20gZ2V0X2JhbGFuY2UgYWNyb3NzIGFsbCBhY2NvdW50c1xuICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzICYmICFza2lwQmFsYW5jZXMpIHtcbiAgICAgIFxuICAgICAgLy8gdGhlc2UgZmllbGRzIGFyZSBub3QgaW5pdGlhbGl6ZWQgaWYgc3ViYWRkcmVzcyBpcyB1bnVzZWQgYW5kIHRoZXJlZm9yZSBub3QgcmV0dXJuZWQgZnJvbSBgZ2V0X2JhbGFuY2VgXG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkge1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cygwKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGZldGNoIGFuZCBtZXJnZSBpbmZvIGZyb20gZ2V0X2JhbGFuY2VcbiAgICAgIHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCB7YWxsX2FjY291bnRzOiB0cnVlfSk7XG4gICAgICBpZiAocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIG1lcmdlIGluZm9cbiAgICAgICAgICBsZXQgYWNjb3VudCA9IGFjY291bnRzW3N1YmFkZHJlc3MuZ2V0QWNjb3VudEluZGV4KCldO1xuICAgICAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzLmdldEFjY291bnRJbmRleCgpLCBhY2NvdW50LmdldEluZGV4KCksIFwiUlBDIGFjY291bnRzIGFyZSBvdXQgb2Ygb3JkZXJcIik7ICAvLyB3b3VsZCBuZWVkIHRvIHN3aXRjaCBsb29rdXAgdG8gbG9vcFxuICAgICAgICAgIGxldCB0Z3RTdWJhZGRyZXNzID0gYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKVtzdWJhZGRyZXNzLmdldEluZGV4KCldO1xuICAgICAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzLmdldEluZGV4KCksIHRndFN1YmFkZHJlc3MuZ2V0SW5kZXgoKSwgXCJSUEMgc3ViYWRkcmVzc2VzIGFyZSBvdXQgb2Ygb3JkZXJcIik7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0QmFsYW5jZShzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSk7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSk7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGFjY291bnRzO1xuICB9XG4gIFxuICAvLyBUT0RPOiBnZXRBY2NvdW50QnlJbmRleCgpLCBnZXRBY2NvdW50QnlUYWcoKVxuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBhc3NlcnQoYWNjb3VudElkeCA+PSAwKTtcbiAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgaWYgKGFjY291bnQuZ2V0SW5kZXgoKSA9PT0gYWNjb3VudElkeCkge1xuICAgICAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcykgYWNjb3VudC5zZXRTdWJhZGRyZXNzZXMoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCBza2lwQmFsYW5jZXMpKTtcbiAgICAgICAgcmV0dXJuIGFjY291bnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIkFjY291bnQgd2l0aCBpbmRleCBcIiArIGFjY291bnRJZHggKyBcIiBkb2VzIG5vdCBleGlzdFwiKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBsYWJlbCA9IGxhYmVsID8gbGFiZWwgOiB1bmRlZmluZWQ7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfYWNjb3VudFwiLCB7bGFiZWw6IGxhYmVsfSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9BY2NvdW50KHtcbiAgICAgIGluZGV4OiByZXNwLnJlc3VsdC5hY2NvdW50X2luZGV4LFxuICAgICAgcHJpbWFyeUFkZHJlc3M6IHJlc3AucmVzdWx0LmFkZHJlc3MsXG4gICAgICBsYWJlbDogbGFiZWwsXG4gICAgICBiYWxhbmNlOiBCaWdJbnQoMCksXG4gICAgICB1bmxvY2tlZEJhbGFuY2U6IEJpZ0ludCgwKVxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0luZGljZXM/OiBudW1iZXJbXSwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggc3ViYWRkcmVzc2VzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBhY2NvdW50SWR4O1xuICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcykgcGFyYW1zLmFkZHJlc3NfaW5kZXggPSBHZW5VdGlscy5saXN0aWZ5KHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzXCIsIHBhcmFtcyk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBzdWJhZGRyZXNzZXNcbiAgICBsZXQgc3ViYWRkcmVzc2VzID0gW107XG4gICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5hZGRyZXNzZXMpIHtcbiAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgICBzdWJhZGRyZXNzZXMucHVzaChzdWJhZGRyZXNzKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIGluaXRpYWxpemUgc3ViYWRkcmVzcyBiYWxhbmNlc1xuICAgIGlmICghc2tpcEJhbGFuY2VzKSB7XG4gICAgICBcbiAgICAgIC8vIHRoZXNlIGZpZWxkcyBhcmUgbm90IGluaXRpYWxpemVkIGlmIHN1YmFkZHJlc3MgaXMgdW51c2VkIGFuZCB0aGVyZWZvcmUgbm90IHJldHVybmVkIGZyb20gYGdldF9iYWxhbmNlYFxuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGZldGNoIGFuZCBpbml0aWFsaXplIGJhbGFuY2VzXG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwgcGFyYW1zKTtcbiAgICAgIGlmIChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICBmb3IgKGxldCBycGNTdWJhZGRyZXNzIG9mIHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3MgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gdHJhbnNmZXIgaW5mbyB0byBleGlzdGluZyBzdWJhZGRyZXNzIG9iamVjdFxuICAgICAgICAgIGZvciAobGV0IHRndFN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICAgICAgICBpZiAodGd0U3ViYWRkcmVzcy5nZXRJbmRleCgpICE9PSBzdWJhZGRyZXNzLmdldEluZGV4KCkpIGNvbnRpbnVlOyAvLyBza2lwIHRvIHN1YmFkZHJlc3Mgd2l0aCBzYW1lIGluZGV4XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXROdW1CbG9ja3NUb1VubG9jaygpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soc3ViYWRkcmVzcy5nZXROdW1CbG9ja3NUb1VubG9jaygpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgYWRkcmVzc2VzXG4gICAgbGV0IHN1YmFkZHJlc3NNYXAgPSB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XTtcbiAgICBpZiAoIXN1YmFkZHJlc3NNYXApIHtcbiAgICAgIHN1YmFkZHJlc3NNYXAgPSB7fTtcbiAgICAgIHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdID0gc3ViYWRkcmVzc01hcDtcbiAgICB9XG4gICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgIHN1YmFkZHJlc3NNYXBbc3ViYWRkcmVzcy5nZXRJbmRleCgpXSA9IHN1YmFkZHJlc3MuZ2V0QWRkcmVzcygpO1xuICAgIH1cbiAgICBcbiAgICAvLyByZXR1cm4gcmVzdWx0c1xuICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gIH1cblxuICBhc3luYyBnZXRTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgYXNzZXJ0KGFjY291bnRJZHggPj0gMCk7XG4gICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPj0gMCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBbc3ViYWRkcmVzc0lkeF0sIHNraXBCYWxhbmNlcykpWzBdO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfYWRkcmVzc1wiLCB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeCwgbGFiZWw6IGxhYmVsfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgc3ViYWRkcmVzcyBvYmplY3RcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKCk7XG4gICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgc3ViYWRkcmVzcy5zZXRJbmRleChyZXNwLnJlc3VsdC5hZGRyZXNzX2luZGV4KTtcbiAgICBzdWJhZGRyZXNzLnNldEFkZHJlc3MocmVzcC5yZXN1bHQuYWRkcmVzcyk7XG4gICAgc3ViYWRkcmVzcy5zZXRMYWJlbChsYWJlbCA/IGxhYmVsIDogdW5kZWZpbmVkKTtcbiAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgc3ViYWRkcmVzcy5zZXRJc1VzZWQoZmFsc2UpO1xuICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cblxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJsYWJlbF9hZGRyZXNzXCIsIHtpbmRleDoge21ham9yOiBhY2NvdW50SWR4LCBtaW5vcjogc3ViYWRkcmVzc0lkeH0sIGxhYmVsOiBsYWJlbH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHMocXVlcnk/OiBzdHJpbmdbXSB8IFBhcnRpYWw8TW9uZXJvVHhRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICByZXR1cm4gdGhpcy5nZXRUeHNBdXgocXVlcnksIDUpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGdldFR4c0F1eChxdWVyeTogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+IHwgdW5kZWZpbmVkLCBtYXhBdHRlbXB0czogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG5cbiAgICAvLyBjb3B5IHF1ZXJ5XG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHRlbXBvcmFyaWx5IGRpc2FibGUgdHJhbnNmZXIgYW5kIG91dHB1dCBxdWVyaWVzIGluIG9yZGVyIHRvIGNvbGxlY3QgYWxsIHR4IGluZm9ybWF0aW9uXG4gICAgbGV0IHRyYW5zZmVyUXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0VHJhbnNmZXJRdWVyeSgpO1xuICAgIGxldCBpbnB1dFF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldElucHV0UXVlcnkoKTtcbiAgICBsZXQgb3V0cHV0UXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0T3V0cHV0UXVlcnkoKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0VHJhbnNmZXJRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRJbnB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldE91dHB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgXG4gICAgLy8gZmV0Y2ggYWxsIHRyYW5zZmVycyB0aGF0IG1lZXQgdHggcXVlcnlcbiAgICBsZXQgdHJhbnNmZXJzID0gYXdhaXQgdGhpcy5nZXRUcmFuc2ZlcnNBdXgobmV3IE1vbmVyb1RyYW5zZmVyUXVlcnkoKS5zZXRUeFF1ZXJ5KE1vbmVyb1dhbGxldFJwYy5kZWNvbnRleHR1YWxpemUocXVlcnlOb3JtYWxpemVkLmNvcHkoKSkpKTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHVuaXF1ZSB0eHMgZnJvbSB0cmFuc2ZlcnMgd2hpbGUgcmV0YWluaW5nIG9yZGVyXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGxldCB0eHNTZXQgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHJhbnNmZXJzKSB7XG4gICAgICBpZiAoIXR4c1NldC5oYXModHJhbnNmZXIuZ2V0VHgoKSkpIHtcbiAgICAgICAgdHhzLnB1c2godHJhbnNmZXIuZ2V0VHgoKSk7XG4gICAgICAgIHR4c1NldC5hZGQodHJhbnNmZXIuZ2V0VHgoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHR5cGVzIGludG8gbWFwcyBmb3IgbWVyZ2luZyBhbmQgbG9va3VwXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIG1lcmdlIG91dHB1dHMgaWYgcmVxdWVzdGVkXG4gICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5nZXRJbmNsdWRlT3V0cHV0cygpIHx8IG91dHB1dFF1ZXJ5KSB7XG4gICAgICAgIFxuICAgICAgLy8gZmV0Y2ggb3V0cHV0c1xuICAgICAgbGV0IG91dHB1dFF1ZXJ5QXV4ID0gKG91dHB1dFF1ZXJ5ID8gb3V0cHV0UXVlcnkuY29weSgpIDogbmV3IE1vbmVyb091dHB1dFF1ZXJ5KCkpLnNldFR4UXVlcnkoTW9uZXJvV2FsbGV0UnBjLmRlY29udGV4dHVhbGl6ZShxdWVyeU5vcm1hbGl6ZWQuY29weSgpKSk7XG4gICAgICBsZXQgb3V0cHV0cyA9IGF3YWl0IHRoaXMuZ2V0T3V0cHV0c0F1eChvdXRwdXRRdWVyeUF1eCk7XG4gICAgICBcbiAgICAgIC8vIG1lcmdlIG91dHB1dCB0eHMgb25lIHRpbWUgd2hpbGUgcmV0YWluaW5nIG9yZGVyXG4gICAgICBsZXQgb3V0cHV0VHhzID0gW107XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2Ygb3V0cHV0cykge1xuICAgICAgICBpZiAoIW91dHB1dFR4cy5pbmNsdWRlcyhvdXRwdXQuZ2V0VHgoKSkpIHtcbiAgICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeChvdXRwdXQuZ2V0VHgoKSwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgICAgICBvdXRwdXRUeHMucHVzaChvdXRwdXQuZ2V0VHgoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gcmVzdG9yZSB0cmFuc2ZlciBhbmQgb3V0cHV0IHF1ZXJpZXNcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0VHJhbnNmZXJRdWVyeSh0cmFuc2ZlclF1ZXJ5KTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SW5wdXRRdWVyeShpbnB1dFF1ZXJ5KTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0T3V0cHV0UXVlcnkob3V0cHV0UXVlcnkpO1xuICAgIFxuICAgIC8vIGZpbHRlciB0eHMgdGhhdCBkb24ndCBtZWV0IHRyYW5zZmVyIHF1ZXJ5XG4gICAgbGV0IHR4c1F1ZXJpZWQgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQubWVldHNDcml0ZXJpYSh0eCkpIHR4c1F1ZXJpZWQucHVzaCh0eCk7XG4gICAgICBlbHNlIGlmICh0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgIH1cbiAgICB0eHMgPSB0eHNRdWVyaWVkO1xuICAgIFxuICAgIC8vIHNwZWNpYWwgY2FzZTogcmUtZmV0Y2ggdHhzIGlmIGluY29uc2lzdGVuY3kgY2F1c2VkIGJ5IG5lZWRpbmcgdG8gbWFrZSBtdWx0aXBsZSBycGMgY2FsbHNcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpICYmIHR4LmdldEJsb2NrKCkgPT09IHVuZGVmaW5lZCB8fCAhdHguZ2V0SXNDb25maXJtZWQoKSAmJiB0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKG1heEF0dGVtcHRzIDw9IDEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlVuYWJsZSB0byBidWlsZCBjb25zaXN0ZW50IHR4cyBmcm9tIG11bHRpcGxlIHJwYyBjYWxsc1wiKTtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkluY29uc2lzdGVuY3kgZGV0ZWN0ZWQgYnVpbGRpbmcgdHhzIGZyb20gbXVsdGlwbGUgcnBjIGNhbGxzLCByZS1mZXRjaGluZyB0eHNcIik7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFR4c0F1eChxdWVyeU5vcm1hbGl6ZWQsIG1heEF0dGVtcHRzIC0gMSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIG9yZGVyIHR4cyBpZiB0eCBoYXNoZXMgZ2l2ZW4gdGhlbiByZXR1cm5cbiAgICBpZiAocXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpICYmIHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKS5sZW5ndGggPiAwKSB7XG4gICAgICBsZXQgdHhzQnlJZCA9IG5ldyBNYXAoKSAgLy8gc3RvcmUgdHhzIGluIHRlbXBvcmFyeSBtYXAgZm9yIHNvcnRpbmdcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykgdHhzQnlJZC5zZXQodHguZ2V0SGFzaCgpLCB0eCk7XG4gICAgICBsZXQgb3JkZXJlZFR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgaGFzaCBvZiBxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkpIGlmICh0eHNCeUlkLmdldChoYXNoKSkgb3JkZXJlZFR4cy5wdXNoKHR4c0J5SWQuZ2V0KGhhc2gpKTtcbiAgICAgIHR4cyA9IG9yZGVyZWRUeHM7XG4gICAgfVxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1RyYW5zZmVyW10+IHtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gZ2V0IHRyYW5zZmVycyBkaXJlY3RseSBpZiBxdWVyeSBkb2VzIG5vdCByZXF1aXJlIHR4IGNvbnRleHQgKG90aGVyIHRyYW5zZmVycywgb3V0cHV0cylcbiAgICBpZiAoIU1vbmVyb1dhbGxldFJwYy5pc0NvbnRleHR1YWwocXVlcnlOb3JtYWxpemVkKSkgcmV0dXJuIHRoaXMuZ2V0VHJhbnNmZXJzQXV4KHF1ZXJ5Tm9ybWFsaXplZCk7XG4gICAgXG4gICAgLy8gb3RoZXJ3aXNlIGdldCB0eHMgd2l0aCBmdWxsIG1vZGVscyB0byBmdWxmaWxsIHF1ZXJ5XG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMuZ2V0VHhzKHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkpKSB7XG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5maWx0ZXJUcmFuc2ZlcnMocXVlcnlOb3JtYWxpemVkKSkge1xuICAgICAgICB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb091dHB1dFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvT3V0cHV0V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplT3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIGdldCBvdXRwdXRzIGRpcmVjdGx5IGlmIHF1ZXJ5IGRvZXMgbm90IHJlcXVpcmUgdHggY29udGV4dCAob3RoZXIgb3V0cHV0cywgdHJhbnNmZXJzKVxuICAgIGlmICghTW9uZXJvV2FsbGV0UnBjLmlzQ29udGV4dHVhbChxdWVyeU5vcm1hbGl6ZWQpKSByZXR1cm4gdGhpcy5nZXRPdXRwdXRzQXV4KHF1ZXJ5Tm9ybWFsaXplZCk7XG4gICAgXG4gICAgLy8gb3RoZXJ3aXNlIGdldCB0eHMgd2l0aCBmdWxsIG1vZGVscyB0byBmdWxmaWxsIHF1ZXJ5XG4gICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLmdldFR4cyhxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpKSkge1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmZpbHRlck91dHB1dHMocXVlcnlOb3JtYWxpemVkKSkge1xuICAgICAgICBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dHB1dHM7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE91dHB1dHMoYWxsID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X291dHB1dHNcIiwge2FsbDogYWxsfSkpLnJlc3VsdC5vdXRwdXRzX2RhdGFfaGV4O1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXg6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbXBvcnRfb3V0cHV0c1wiLCB7b3V0cHV0c19kYXRhX2hleDogb3V0cHV0c0hleH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5udW1faW1wb3J0ZWQ7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydEtleUltYWdlcyhhbGwgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQ+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5ycGNFeHBvcnRLZXlJbWFnZXMoYWxsKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlczogTW9uZXJvS2V5SW1hZ2VbXSwgb2Zmc2V0ID0gMCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQ+IHtcbiAgICBcbiAgICAvLyBjb252ZXJ0IGtleSBpbWFnZXMgdG8gcnBjIHBhcmFtZXRlclxuICAgIGxldCBycGNLZXlJbWFnZXMgPSBrZXlJbWFnZXMubWFwKGtleUltYWdlID0+ICh7a2V5X2ltYWdlOiBrZXlJbWFnZS5nZXRIZXgoKSwgc2lnbmF0dXJlOiBrZXlJbWFnZS5nZXRTaWduYXR1cmUoKX0pKTtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9rZXlfaW1hZ2VzXCIsIHtzaWduZWRfa2V5X2ltYWdlczogcnBjS2V5SW1hZ2VzLCBvZmZzZXQ6IG9mZnNldH0pO1xuICAgIFxuICAgIC8vIGJ1aWxkIGFuZCByZXR1cm4gcmVzdWx0XG4gICAgbGV0IGltcG9ydFJlc3VsdCA9IG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCgpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRIZWlnaHQocmVzcC5yZXN1bHQuaGVpZ2h0KTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0U3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnNwZW50KSk7XG4gICAgaW1wb3J0UmVzdWx0LnNldFVuc3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnVuc3BlbnQpKTtcbiAgICByZXR1cm4gaW1wb3J0UmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMucnBjRXhwb3J0S2V5SW1hZ2VzKGZhbHNlKSkuZ2V0S2V5SW1hZ2VzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImZyZWV6ZVwiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICB9XG4gIFxuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidGhhd1wiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICB9XG4gIFxuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmcm96ZW5cIiwge2tleV9pbWFnZToga2V5SW1hZ2V9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuZnJvemVuID09PSB0cnVlO1xuICB9XG5cbiAgYXN5bmMgZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCk6IFByb21pc2U8TW9uZXJvVHhQcmlvcml0eT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2RlZmF1bHRfZmVlX3ByaW9yaXR5XCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5wcmlvcml0eTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSwgY29weSwgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRDYW5TcGxpdCh0cnVlKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpID09PSB0cnVlICYmIGF3YWl0IHRoaXMuaXNNdWx0aXNpZygpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcmVsYXkgbXVsdGlzaWcgdHJhbnNhY3Rpb24gdW50aWwgY28tc2lnbmVkXCIpO1xuXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3NlcyB0byBzZW5kIGZyb21cbiAgICBsZXQgYWNjb3VudElkeCA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHRoZSBhY2NvdW50IGluZGV4IHRvIHNlbmQgZnJvbVwiKTtcbiAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5zbGljZSgwKTsgLy8gZmV0Y2ggYWxsIG9yIGNvcHkgZ2l2ZW4gaW5kaWNlc1xuICAgIFxuICAgIC8vIGJ1aWxkIGNvbmZpZyBwYXJhbWV0ZXJzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmRlc3RpbmF0aW9ucyA9IFtdO1xuICAgIGZvciAobGV0IGRlc3RpbmF0aW9uIG9mIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0RGVzdGluYXRpb25zKCkpIHtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIFwiRGVzdGluYXRpb24gYWRkcmVzcyBpcyBub3QgZGVmaW5lZFwiKTtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBbW91bnQoKSwgXCJEZXN0aW5hdGlvbiBhbW91bnQgaXMgbm90IGRlZmluZWRcIik7XG4gICAgICBwYXJhbXMuZGVzdGluYXRpb25zLnB1c2goeyBhZGRyZXNzOiBkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIGFtb3VudDogZGVzdGluYXRpb24uZ2V0QW1vdW50KCkudG9TdHJpbmcoKSB9KTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkpIHBhcmFtcy5zdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzID0gY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IHN1YmFkZHJlc3NJbmRpY2VzO1xuICAgIHBhcmFtcy5wYXltZW50X2lkID0gY29uZmlnTm9ybWFsaXplZC5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpICE9PSB0cnVlO1xuICAgIGFzc2VydChjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSBwYXJhbXMuZ2V0X3R4X2tleXMgPSB0cnVlOyAvLyBwYXJhbSB0byBnZXQgdHgga2V5KHMpIGRlcGVuZHMgaWYgc3BsaXRcbiAgICBlbHNlIHBhcmFtcy5nZXRfdHhfa2V5ID0gdHJ1ZTtcblxuICAgIC8vIGNhbm5vdCBhcHBseSBzdWJ0cmFjdEZlZUZyb20gd2l0aCBgdHJhbnNmZXJfc3BsaXRgIGNhbGxcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKS5sZW5ndGggPiAwKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJzdWJ0cmFjdGZlZWZyb20gdHJhbnNmZXJzIGNhbm5vdCBiZSBzcGxpdCBvdmVyIG11bHRpcGxlIHRyYW5zYWN0aW9ucyB5ZXRcIik7XG4gICAgfVxuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IFwidHJhbnNmZXJfc3BsaXRcIiA6IFwidHJhbnNmZXJcIiwgcGFyYW1zKTtcbiAgICAgIHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIldBTExFVF9SUENfRVJST1JfQ09ERV9XUk9OR19BRERSRVNTXCIpID4gLTEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgZGVzdGluYXRpb24gYWRkcmVzc1wiKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gICAgXG4gICAgLy8gcHJlLWluaXRpYWxpemUgdHhzIGlmZiBwcmVzZW50LiBtdWx0aXNpZyBhbmQgdmlldy1vbmx5IHdhbGxldHMgd2lsbCBoYXZlIHR4IHNldCB3aXRob3V0IHRyYW5zYWN0aW9uc1xuICAgIGxldCB0eHM7XG4gICAgbGV0IG51bVR4cyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IChyZXN1bHQuZmVlX2xpc3QgIT09IHVuZGVmaW5lZCA/IHJlc3VsdC5mZWVfbGlzdC5sZW5ndGggOiAwKSA6IChyZXN1bHQuZmVlICE9PSB1bmRlZmluZWQgPyAxIDogMCk7XG4gICAgaWYgKG51bVR4cyA+IDApIHR4cyA9IFtdO1xuICAgIGxldCBjb3B5RGVzdGluYXRpb25zID0gbnVtVHhzID09PSAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVHhzOyBpKyspIHtcbiAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgICAgTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnTm9ybWFsaXplZCwgdHgsIGNvcHlEZXN0aW5hdGlvbnMpO1xuICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcyAhPT0gdW5kZWZpbmVkICYmIHN1YmFkZHJlc3NJbmRpY2VzLmxlbmd0aCA9PT0gMSkgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldFN1YmFkZHJlc3NJbmRpY2VzKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHNldCBmcm9tIHJwYyByZXNwb25zZSB3aXRoIHByZS1pbml0aWFsaXplZCB0eHNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQsIHR4cywgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gICAgZWxzZSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFRvVHhTZXQocmVzdWx0LCB0eHMgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHR4c1swXSwgdHJ1ZSwgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBidWlsZCByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCk7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBjb25maWcuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpO1xuICAgIHBhcmFtcy5rZXlfaW1hZ2UgPSBjb25maWcuZ2V0S2V5SW1hZ2UoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgIT09IHRydWU7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWcuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWcuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZy5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2tleSA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9oZXggPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfbWV0YWRhdGEgPSB0cnVlO1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfc2luZ2xlXCIsIHBhcmFtcyk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZy5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBidWlsZCBhbmQgcmV0dXJuIHR4XG4gICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnLCB1bmRlZmluZWQsIHRydWUpO1xuICAgIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhUb1R4U2V0KHJlc3VsdCwgdHgsIHRydWUsIGNvbmZpZyk7XG4gICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpWzBdLnNldEFtb3VudCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkpOyAvLyBpbml0aWFsaXplIGRlc3RpbmF0aW9uIGFtb3VudFxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwOyBkZWZhdWx0IHRvIGFsbCB3aXRoIHVubG9ja2VkIGJhbGFuY2UgaWYgbm90IHNwZWNpZmllZFxuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpOyAgLy8gbWFwcyBlYWNoIGFjY291bnQgaW5kZXggdG8gc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGluZGljZXMuc2V0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCksIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgaW5kaWNlcy5zZXQoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkpKSB7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgPiAwbikgc3ViYWRkcmVzc0luZGljZXMucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBhY2NvdW50cyA9IGF3YWl0IHRoaXMuZ2V0QWNjb3VudHModHJ1ZSk7XG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICAgIGlmIChhY2NvdW50LmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgICBpbmRpY2VzLnNldChhY2NvdW50LmdldEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc3dlZXAgZnJvbSBlYWNoIGFjY291bnQgYW5kIGNvbGxlY3QgcmVzdWx0aW5nIHR4IHNldHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYWNjb3VudElkeCBvZiBpbmRpY2VzLmtleXMoKSkge1xuICAgICAgXG4gICAgICAvLyBjb3B5IGFuZCBtb2RpZnkgdGhlIG9yaWdpbmFsIGNvbmZpZ1xuICAgICAgbGV0IGNvcHkgPSBjb25maWdOb3JtYWxpemVkLmNvcHkoKTtcbiAgICAgIGNvcHkuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgY29weS5zZXRTd2VlcEVhY2hTdWJhZGRyZXNzKGZhbHNlKTtcbiAgICAgIFxuICAgICAgLy8gc3dlZXAgYWxsIHN1YmFkZHJlc3NlcyB0b2dldGhlciAgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogY2FuIHRoaXMgcmV2ZWFsIG91dHB1dHMgYmVsb25nIHRvIHRoZSBzYW1lIHdhbGxldD9cbiAgICAgIGlmIChjb3B5LmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSAhPT0gdHJ1ZSkge1xuICAgICAgICBjb3B5LnNldFN1YmFkZHJlc3NJbmRpY2VzKGluZGljZXMuZ2V0KGFjY291bnRJZHgpKTtcbiAgICAgICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5ycGNTd2VlcEFjY291bnQoY29weSkpIHR4cy5wdXNoKHR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gb3RoZXJ3aXNlIHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyBpbmRpdmlkdWFsbHlcbiAgICAgIGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzSWR4IG9mIGluZGljZXMuZ2V0KGFjY291bnRJZHgpKSB7XG4gICAgICAgICAgY29weS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhbc3ViYWRkcmVzc0lkeF0pO1xuICAgICAgICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMucnBjU3dlZXBBY2NvdW50KGNvcHkpKSB0eHMucHVzaCh0eCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcER1c3QocmVsYXk/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHJlbGF5ID09PSB1bmRlZmluZWQpIHJlbGF5ID0gZmFsc2U7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzd2VlcF9kdXN0XCIsIHtkb19ub3RfcmVsYXk6ICFyZWxheX0pO1xuICAgIGlmIChyZWxheSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzdWx0KTtcbiAgICBpZiAodHhTZXQuZ2V0VHhzKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQoIXJlbGF5KTtcbiAgICAgIHR4LnNldEluVHhQb29sKHR4LmdldElzUmVsYXllZCgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0LmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhczogKE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKVtdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eEhhc2hlcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykge1xuICAgICAgbGV0IG1ldGFkYXRhID0gdHhPck1ldGFkYXRhIGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQgPyB0eE9yTWV0YWRhdGEuZ2V0TWV0YWRhdGEoKSA6IHR4T3JNZXRhZGF0YTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVsYXlfdHhcIiwgeyBoZXg6IG1ldGFkYXRhIH0pO1xuICAgICAgdHhIYXNoZXMucHVzaChyZXNwLnJlc3VsdC50eF9oYXNoKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7IC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgcmV0dXJuIHR4SGFzaGVzO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImRlc2NyaWJlX3RyYW5zZmVyXCIsIHtcbiAgICAgIHVuc2lnbmVkX3R4c2V0OiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCksXG4gICAgICBtdWx0aXNpZ190eHNldDogdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpXG4gICAgfSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlcihyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnbl90cmFuc2ZlclwiLCB7XG4gICAgICB1bnNpZ25lZF90eHNldDogdW5zaWduZWRUeEhleCxcbiAgICAgIGV4cG9ydF9yYXc6IHRydWUsXG4gICAgICBnZXRfdHhfa2V5czogdHJ1ZVxuICAgIH0pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfdHJhbnNmZXJcIiwge1xuICAgICAgdHhfZGF0YV9oZXg6IHNpZ25lZFR4SGV4XG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBzaWduYXR1cmVUeXBlID0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgYWNjb3VudElkeCA9IDAsIHN1YmFkZHJlc3NJZHggPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25cIiwge1xuICAgICAgICBkYXRhOiBtZXNzYWdlLFxuICAgICAgICBzaWduYXR1cmVfdHlwZTogc2lnbmF0dXJlVHlwZSA9PT0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA/IFwic3BlbmRcIiA6IFwidmlld1wiLFxuICAgICAgICBhY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LFxuICAgICAgICBhZGRyZXNzX2luZGV4OiBzdWJhZGRyZXNzSWR4XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQ+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ2ZXJpZnlcIiwge2RhdGE6IG1lc3NhZ2UsIGFkZHJlc3M6IGFkZHJlc3MsIHNpZ25hdHVyZTogc2lnbmF0dXJlfSk7XG4gICAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQoXG4gICAgICAgIHJlc3VsdC5nb29kID8ge2lzR29vZDogcmVzdWx0Lmdvb2QsIGlzT2xkOiByZXN1bHQub2xkLCBzaWduYXR1cmVUeXBlOiByZXN1bHQuc2lnbmF0dXJlX3R5cGUgPT09IFwidmlld1wiID8gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1ZJRVdfS0VZIDogTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgdmVyc2lvbjogcmVzdWx0LnZlcnNpb259IDoge2lzR29vZDogZmFsc2V9XG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMikgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KHtpc0dvb2Q6IGZhbHNlfSk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9rZXlcIiwge3R4aWQ6IHR4SGFzaH0pKS5yZXN1bHQudHhfa2V5O1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaDogc3RyaW5nLCB0eEtleTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfdHhfa2V5XCIsIHt0eGlkOiB0eEhhc2gsIHR4X2tleTogdHhLZXksIGFkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICAgIFxuICAgICAgLy8gaW50ZXJwcmV0IHJlc3VsdFxuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZCh0cnVlKTtcbiAgICAgIGNoZWNrLnNldE51bUNvbmZpcm1hdGlvbnMocmVzcC5yZXN1bHQuY29uZmlybWF0aW9ucyk7XG4gICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgIGNoZWNrLnNldFJlY2VpdmVkQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5yZWNlaXZlZCkpO1xuICAgICAgcmV0dXJuIGNoZWNrO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9wcm9vZlwiLCB7dHhpZDogdHhIYXNoLCBhZGRyZXNzOiBhZGRyZXNzLCBtZXNzYWdlOiBtZXNzYWdlfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja190eF9wcm9vZlwiLCB7XG4gICAgICAgIHR4aWQ6IHR4SGFzaCxcbiAgICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBpbnRlcnByZXQgcmVzcG9uc2VcbiAgICAgIGxldCBpc0dvb2QgPSByZXNwLnJlc3VsdC5nb29kO1xuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZChpc0dvb2QpO1xuICAgICAgaWYgKGlzR29vZCkge1xuICAgICAgICBjaGVjay5zZXROdW1Db25maXJtYXRpb25zKHJlc3AucmVzdWx0LmNvbmZpcm1hdGlvbnMpO1xuICAgICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgICAgY2hlY2suc2V0UmVjZWl2ZWRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnJlY2VpdmVkKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2hlY2s7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtMSAmJiBlLm1lc3NhZ2UgPT09IFwiYmFzaWNfc3RyaW5nXCIpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJNdXN0IHByb3ZpZGUgc2lnbmF0dXJlIHRvIGNoZWNrIHR4IHByb29mXCIsIC0xKTtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfc3BlbmRfcHJvb2ZcIiwge3R4aWQ6IHR4SGFzaCwgbWVzc2FnZTogbWVzc2FnZX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfc3BlbmRfcHJvb2ZcIiwge1xuICAgICAgICB0eGlkOiB0eEhhc2gsXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC5nb29kO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhbGw6IHRydWUsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGFtb3VudDogYmlnaW50LCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFjY291bnRfaW5kZXg6IGFjY291bnRJZHgsXG4gICAgICBhbW91bnQ6IGFtb3VudC50b1N0cmluZygpLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gIH1cblxuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT4ge1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgfSk7XG4gICAgXG4gICAgLy8gaW50ZXJwcmV0IHJlc3VsdHNcbiAgICBsZXQgaXNHb29kID0gcmVzcC5yZXN1bHQuZ29vZDtcbiAgICBsZXQgY2hlY2sgPSBuZXcgTW9uZXJvQ2hlY2tSZXNlcnZlKCk7XG4gICAgY2hlY2suc2V0SXNHb29kKGlzR29vZCk7XG4gICAgaWYgKGlzR29vZCkge1xuICAgICAgY2hlY2suc2V0VW5jb25maXJtZWRTcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQuc3BlbnQpKTtcbiAgICAgIGNoZWNrLnNldFRvdGFsQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC50b3RhbCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hlY2s7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3R4X25vdGVzXCIsIHt0eGlkczogdHhIYXNoZXN9KSkucmVzdWx0Lm5vdGVzO1xuICB9XG4gIFxuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSwgbm90ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X3R4X25vdGVzXCIsIHt0eGlkczogdHhIYXNoZXMsIG5vdGVzOiBub3Rlc30pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb0FkZHJlc3NCb29rRW50cnlbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NfYm9va1wiLCB7ZW50cmllczogZW50cnlJbmRpY2VzfSk7XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5lbnRyaWVzKSByZXR1cm4gW107XG4gICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNFbnRyeSBvZiByZXNwLnJlc3VsdC5lbnRyaWVzKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb0FkZHJlc3NCb29rRW50cnkoKS5zZXRJbmRleChycGNFbnRyeS5pbmRleCkuc2V0QWRkcmVzcyhycGNFbnRyeS5hZGRyZXNzKS5zZXREZXNjcmlwdGlvbihycGNFbnRyeS5kZXNjcmlwdGlvbikuc2V0UGF5bWVudElkKHJwY0VudHJ5LnBheW1lbnRfaWQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzczogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhZGRfYWRkcmVzc19ib29rXCIsIHthZGRyZXNzOiBhZGRyZXNzLCBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb259KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuaW5kZXg7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4OiBudW1iZXIsIHNldEFkZHJlc3M6IGJvb2xlYW4sIGFkZHJlc3M6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2V0RGVzY3JpcHRpb246IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImVkaXRfYWRkcmVzc19ib29rXCIsIHtcbiAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgIHNldF9hZGRyZXNzOiBzZXRBZGRyZXNzLFxuICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgIHNldF9kZXNjcmlwdGlvbjogc2V0RGVzY3JpcHRpb24sXG4gICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZGVsZXRlX2FkZHJlc3NfYm9va1wiLCB7aW5kZXg6IGVudHJ5SWR4fSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRhZ0FjY291bnRzKHRhZywgYWNjb3VudEluZGljZXMpIHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ0YWdfYWNjb3VudHNcIiwge3RhZzogdGFnLCBhY2NvdW50czogYWNjb3VudEluZGljZXN9KTtcbiAgfVxuXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidW50YWdfYWNjb3VudHNcIiwge2FjY291bnRzOiBhY2NvdW50SW5kaWNlc30pO1xuICB9XG5cbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICBsZXQgdGFncyA9IFtdO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FjY291bnRfdGFnc1wiKTtcbiAgICBpZiAocmVzcC5yZXN1bHQuYWNjb3VudF90YWdzKSB7XG4gICAgICBmb3IgKGxldCBycGNBY2NvdW50VGFnIG9mIHJlc3AucmVzdWx0LmFjY291bnRfdGFncykge1xuICAgICAgICB0YWdzLnB1c2gobmV3IE1vbmVyb0FjY291bnRUYWcoe1xuICAgICAgICAgIHRhZzogcnBjQWNjb3VudFRhZy50YWcgPyBycGNBY2NvdW50VGFnLnRhZyA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBsYWJlbDogcnBjQWNjb3VudFRhZy5sYWJlbCA/IHJwY0FjY291bnRUYWcubGFiZWwgOiB1bmRlZmluZWQsXG4gICAgICAgICAgYWNjb3VudEluZGljZXM6IHJwY0FjY291bnRUYWcuYWNjb3VudHNcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFncztcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9hY2NvdW50X3RhZ19kZXNjcmlwdGlvblwiLCB7dGFnOiB0YWcsIGRlc2NyaXB0aW9uOiBsYWJlbH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXltZW50VXJpKGNvbmZpZzogTW9uZXJvVHhDb25maWcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfdXJpXCIsIHtcbiAgICAgIGFkZHJlc3M6IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksXG4gICAgICBhbW91bnQ6IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSA/IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKS50b1N0cmluZygpIDogdW5kZWZpbmVkLFxuICAgICAgcGF5bWVudF9pZDogY29uZmlnLmdldFBheW1lbnRJZCgpLFxuICAgICAgcmVjaXBpZW50X25hbWU6IGNvbmZpZy5nZXRSZWNpcGllbnROYW1lKCksXG4gICAgICB0eF9kZXNjcmlwdGlvbjogY29uZmlnLmdldE5vdGUoKVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC51cmk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmk6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhDb25maWc+IHtcbiAgICBhc3NlcnQodXJpLCBcIk11c3QgcHJvdmlkZSBVUkkgdG8gcGFyc2VcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJwYXJzZV91cmlcIiwge3VyaTogdXJpfSk7XG4gICAgbGV0IGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyh7YWRkcmVzczogcmVzcC5yZXN1bHQudXJpLmFkZHJlc3MsIGFtb3VudDogQmlnSW50KHJlc3AucmVzdWx0LnVyaS5hbW91bnQpfSk7XG4gICAgY29uZmlnLnNldFBheW1lbnRJZChyZXNwLnJlc3VsdC51cmkucGF5bWVudF9pZCk7XG4gICAgY29uZmlnLnNldFJlY2lwaWVudE5hbWUocmVzcC5yZXN1bHQudXJpLnJlY2lwaWVudF9uYW1lKTtcbiAgICBjb25maWcuc2V0Tm90ZShyZXNwLnJlc3VsdC51cmkudHhfZGVzY3JpcHRpb24pO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpKSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uc2V0QWRkcmVzcyh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0UGF5bWVudElkKCkpIGNvbmZpZy5zZXRQYXltZW50SWQodW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldFJlY2lwaWVudE5hbWUoKSkgY29uZmlnLnNldFJlY2lwaWVudE5hbWUodW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldE5vdGUoKSkgY29uZmlnLnNldE5vdGUodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gY29uZmlnO1xuICB9XG4gIFxuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hdHRyaWJ1dGVcIiwge2tleToga2V5fSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQudmFsdWUgPT09IFwiXCIgPyB1bmRlZmluZWQgOiByZXNwLnJlc3VsdC52YWx1ZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC00NSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBzZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcsIHZhbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2F0dHJpYnV0ZVwiLCB7a2V5OiBrZXksIHZhbHVlOiB2YWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcobnVtVGhyZWFkczogbnVtYmVyLCBiYWNrZ3JvdW5kTWluaW5nPzogYm9vbGVhbiwgaWdub3JlQmF0dGVyeT86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdGFydF9taW5pbmdcIiwge1xuICAgICAgdGhyZWFkc19jb3VudDogbnVtVGhyZWFkcyxcbiAgICAgIGRvX2JhY2tncm91bmRfbWluaW5nOiBiYWNrZ3JvdW5kTWluaW5nLFxuICAgICAgaWdub3JlX2JhdHRlcnk6IGlnbm9yZUJhdHRlcnlcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9wX21pbmluZ1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5tdWx0aXNpZ19pbXBvcnRfbmVlZGVkID09PSB0cnVlO1xuICB9XG4gIFxuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luZm8+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImlzX211bHRpc2lnXCIpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgaW5mbyA9IG5ldyBNb25lcm9NdWx0aXNpZ0luZm8oKTtcbiAgICBpbmZvLnNldElzTXVsdGlzaWcocmVzdWx0Lm11bHRpc2lnKTtcbiAgICBpbmZvLnNldElzUmVhZHkocmVzdWx0LnJlYWR5KTtcbiAgICBpbmZvLnNldFRocmVzaG9sZChyZXN1bHQudGhyZXNob2xkKTtcbiAgICBpbmZvLnNldE51bVBhcnRpY2lwYW50cyhyZXN1bHQudG90YWwpO1xuICAgIHJldHVybiBpbmZvO1xuICB9XG4gIFxuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInByZXBhcmVfbXVsdGlzaWdcIiwge2VuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWw6IHRydWV9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICByZXR1cm4gcmVzdWx0Lm11bHRpc2lnX2luZm87XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgdGhyZXNob2xkOiBudW1iZXIsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibWFrZV9tdWx0aXNpZ1wiLCB7XG4gICAgICBtdWx0aXNpZ19pbmZvOiBtdWx0aXNpZ0hleGVzLFxuICAgICAgdGhyZXNob2xkOiB0aHJlc2hvbGQsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmRcbiAgICB9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5tdWx0aXNpZ19pbmZvO1xuICB9XG4gIFxuICBhc3luYyBleGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleGNoYW5nZV9tdWx0aXNpZ19rZXlzXCIsIHttdWx0aXNpZ19pbmZvOiBtdWx0aXNpZ0hleGVzLCBwYXNzd29yZDogcGFzc3dvcmR9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIGxldCBtc1Jlc3VsdCA9IG5ldyBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQoKTtcbiAgICBtc1Jlc3VsdC5zZXRBZGRyZXNzKHJlc3AucmVzdWx0LmFkZHJlc3MpO1xuICAgIG1zUmVzdWx0LnNldE11bHRpc2lnSGV4KHJlc3AucmVzdWx0Lm11bHRpc2lnX2luZm8pO1xuICAgIGlmIChtc1Jlc3VsdC5nZXRBZGRyZXNzKCkubGVuZ3RoID09PSAwKSBtc1Jlc3VsdC5zZXRBZGRyZXNzKHVuZGVmaW5lZCk7XG4gICAgaWYgKG1zUmVzdWx0LmdldE11bHRpc2lnSGV4KCkubGVuZ3RoID09PSAwKSBtc1Jlc3VsdC5zZXRNdWx0aXNpZ0hleCh1bmRlZmluZWQpO1xuICAgIHJldHVybiBtc1Jlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0TXVsdGlzaWdIZXgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4cG9ydF9tdWx0aXNpZ19pbmZvXCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5pbmZvO1xuICB9XG5cbiAgYXN5bmMgaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHJlZnJlc2hBZnRlckltcG9ydD86IGJvb2xlYW4pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmIChyZWZyZXNoQWZ0ZXJJbXBvcnQgPT09IHVuZGVmaW5lZCkgcmVmcmVzaEFmdGVySW1wb3J0ID0gdHJ1ZTtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkobXVsdGlzaWdIZXhlcykpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBzdHJpbmdbXSB0byBpbXBvcnRNdWx0aXNpZ0hleCgpXCIpXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbXBvcnRfbXVsdGlzaWdfaW5mb1wiLCB7aW5mbzogbXVsdGlzaWdIZXhlcywgcmVmcmVzaF9hZnRlcl9pbXBvcnQ6IHJlZnJlc2hBZnRlckltcG9ydH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5uX291dHB1dHM7XG4gIH1cblxuICBhc3luYyBzaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnU2lnblJlc3VsdD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnbl9tdWx0aXNpZ1wiLCB7dHhfZGF0YV9oZXg6IG11bHRpc2lnVHhIZXh9KTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgbGV0IHNpZ25SZXN1bHQgPSBuZXcgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0KCk7XG4gICAgc2lnblJlc3VsdC5zZXRTaWduZWRNdWx0aXNpZ1R4SGV4KHJlc3VsdC50eF9kYXRhX2hleCk7XG4gICAgc2lnblJlc3VsdC5zZXRUeEhhc2hlcyhyZXN1bHQudHhfaGFzaF9saXN0KTtcbiAgICByZXR1cm4gc2lnblJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3VibWl0X211bHRpc2lnXCIsIHt0eF9kYXRhX2hleDogc2lnbmVkTXVsdGlzaWdUeEhleH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC50eF9oYXNoX2xpc3Q7XG4gIH1cbiAgXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkOiBzdHJpbmcsIG5ld1Bhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hhbmdlX3dhbGxldF9wYXNzd29yZFwiLCB7b2xkX3Bhc3N3b3JkOiBvbGRQYXNzd29yZCB8fCBcIlwiLCBuZXdfcGFzc3dvcmQ6IG5ld1Bhc3N3b3JkIHx8IFwiXCJ9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2F2ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9yZVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgY2xvc2Uoc2F2ZSA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3VwZXIuY2xvc2Uoc2F2ZSk7XG4gICAgaWYgKHNhdmUgPT09IHVuZGVmaW5lZCkgc2F2ZSA9IGZhbHNlO1xuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjbG9zZV93YWxsZXRcIiwge2F1dG9zYXZlX2N1cnJlbnQ6IHNhdmV9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDbG9zZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0UHJpbWFyeUFkZHJlc3MoKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIHJldHVybiBlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC0xMyAmJiBlLm1lc3NhZ2UuaW5kZXhPZihcIk5vIHdhbGxldCBmaWxlXCIpID4gLTE7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNhdmUgYW5kIGNsb3NlIHRoZSBjdXJyZW50IHdhbGxldCBhbmQgc3RvcCB0aGUgUlBDIHNlcnZlci5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdG9wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9wX3dhbGxldFwiKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0gQUREIEpTRE9DIEZPUiBTVVBQT1JURUQgREVGQVVMVCBJTVBMRU1FTlRBVElPTlMgLS0tLS0tLS0tLS0tLS1cblxuICBhc3luYyBnZXROdW1CbG9ja3NUb1VubG9jaygpOiBQcm9taXNlPG51bWJlcltdfHVuZGVmaW5lZD4geyByZXR1cm4gc3VwZXIuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTsgfVxuICBhc3luYyBnZXRUeCh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhXYWxsZXR8dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gpOyB9XG4gIGFzeW5jIGdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBnZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5PikgeyByZXR1cm4gc3VwZXIuZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGNyZWF0ZVR4KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5jcmVhdGVUeChjb25maWcpOyB9XG4gIGFzeW5jIHJlbGF5VHgodHhPck1ldGFkYXRhOiBNb25lcm9UeFdhbGxldCB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5yZWxheVR4KHR4T3JNZXRhZGF0YSk7IH1cbiAgYXN5bmMgZ2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFR4Tm90ZSh0eEhhc2gpOyB9XG4gIGFzeW5jIHNldFR4Tm90ZSh0eEhhc2g6IHN0cmluZywgbm90ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zZXRUeE5vdGUodHhIYXNoLCBub3RlKTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzdGF0aWMgYXN5bmMgY29ubmVjdFRvV2FsbGV0UnBjKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgbGV0IGNvbmZpZyA9IE1vbmVyb1dhbGxldFJwYy5ub3JtYWxpemVDb25maWcodXJpT3JDb25maWcsIHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgaWYgKGNvbmZpZy5jbWQpIHJldHVybiBNb25lcm9XYWxsZXRScGMuc3RhcnRXYWxsZXRScGNQcm9jZXNzKGNvbmZpZyk7XG4gICAgZWxzZSByZXR1cm4gbmV3IE1vbmVyb1dhbGxldFJwYyhjb25maWcpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIHN0YXJ0V2FsbGV0UnBjUHJvY2Vzcyhjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzQXJyYXkoY29uZmlnLmNtZCksIFwiTXVzdCBwcm92aWRlIHN0cmluZyBhcnJheSB3aXRoIGNvbW1hbmQgbGluZSBwYXJhbWV0ZXJzXCIpO1xuICAgIFxuICAgIC8vIHN0YXJ0IHByb2Nlc3NcbiAgICBsZXQgY2hpbGRfcHJvY2VzcyA9IGF3YWl0IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIik7XG4gICAgY29uc3QgY2hpbGRQcm9jZXNzID0gY2hpbGRfcHJvY2Vzcy5zcGF3bihjb25maWcuY21kWzBdLCBjb25maWcuY21kLnNsaWNlKDEpLCB7XG4gICAgICBlbnY6IHsgLi4ucHJvY2Vzcy5lbnYsIExBTkc6ICdlbl9VUy5VVEYtOCcgfSAvLyBzY3JhcGUgb3V0cHV0IGluIGVuZ2xpc2hcbiAgICB9KTtcbiAgICBjaGlsZFByb2Nlc3Muc3Rkb3V0LnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIG1vbmVyby13YWxsZXQtcnBjXG4gICAgbGV0IHVyaTtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgbGV0IG91dHB1dCA9IFwiXCI7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3Rkb3V0XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQub24oJ2RhdGEnLCBhc3luYyBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgbGV0IGxpbmUgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICAgICAgTGlicmFyeVV0aWxzLmxvZygyLCBsaW5lKTtcbiAgICAgICAgICBvdXRwdXQgKz0gbGluZSArICdcXG4nOyAvLyBjYXB0dXJlIG91dHB1dCBpbiBjYXNlIG9mIGVycm9yXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gZXh0cmFjdCB1cmkgZnJvbSBlLmcuIFwiSSBCaW5kaW5nIG9uIDEyNy4wLjAuMSAoSVB2NCk6MzgwODVcIlxuICAgICAgICAgIGxldCB1cmlMaW5lQ29udGFpbnMgPSBcIkJpbmRpbmcgb24gXCI7XG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWluc0lkeCA9IGxpbmUuaW5kZXhPZih1cmlMaW5lQ29udGFpbnMpO1xuICAgICAgICAgIGlmICh1cmlMaW5lQ29udGFpbnNJZHggPj0gMCkge1xuICAgICAgICAgICAgbGV0IGhvc3QgPSBsaW5lLnN1YnN0cmluZyh1cmlMaW5lQ29udGFpbnNJZHggKyB1cmlMaW5lQ29udGFpbnMubGVuZ3RoLCBsaW5lLmxhc3RJbmRleE9mKCcgJykpO1xuICAgICAgICAgICAgbGV0IHVuZm9ybWF0dGVkTGluZSA9IGxpbmUucmVwbGFjZSgvXFx1MDAxYlxcWy4qP20vZywgJycpLnRyaW0oKTsgLy8gcmVtb3ZlIGNvbG9yIGZvcm1hdHRpbmdcbiAgICAgICAgICAgIGxldCBwb3J0ID0gdW5mb3JtYXR0ZWRMaW5lLnN1YnN0cmluZyh1bmZvcm1hdHRlZExpbmUubGFzdEluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgbGV0IHNzbElkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLXNzbFwiKTtcbiAgICAgICAgICAgIGxldCBzc2xFbmFibGVkID0gc3NsSWR4ID49IDAgPyBcImVuYWJsZWRcIiA9PSBjb25maWcuY21kW3NzbElkeCArIDFdLnRvTG93ZXJDYXNlKCkgOiBmYWxzZTtcbiAgICAgICAgICAgIHVyaSA9IChzc2xFbmFibGVkID8gXCJodHRwc1wiIDogXCJodHRwXCIpICsgXCI6Ly9cIiArIGhvc3QgKyBcIjpcIiArIHBvcnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlYWQgc3VjY2VzcyBtZXNzYWdlXG4gICAgICAgICAgaWYgKGxpbmUuaW5kZXhPZihcIlN0YXJ0aW5nIHdhbGxldCBSUEMgc2VydmVyXCIpID49IDApIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gZ2V0IHVzZXJuYW1lLCBwYXNzd29yZCwgem1xIHB1Ymxpc2ggdXJpLCBhbmQgcHJveHkgdXJpIGZyb20gcGFyYW1zXG4gICAgICAgICAgICBsZXQgdXNlclBhc3NJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXJwYy1sb2dpblwiKTtcbiAgICAgICAgICAgIGxldCB1c2VyUGFzcyA9IHVzZXJQYXNzSWR4ID49IDAgPyBjb25maWcuY21kW3VzZXJQYXNzSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSB1c2VyUGFzcyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdXNlclBhc3Muc3Vic3RyaW5nKDAsIHVzZXJQYXNzLmluZGV4T2YoJzonKSk7XG4gICAgICAgICAgICBsZXQgcGFzc3dvcmQgPSB1c2VyUGFzcyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdXNlclBhc3Muc3Vic3RyaW5nKHVzZXJQYXNzLmluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgbGV0IHptcVVyaUlkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tem1xLXB1YlwiKTtcbiAgICAgICAgICAgIGxldCB6bXFVcmkgPSB6bXFVcmlJZHggPj0gMCA/IGNvbmZpZy5jbWRbem1xVXJpSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgcHJveHlVcmlJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXByb3h5XCIpO1xuICAgICAgICAgICAgdGhpcy5zdGFydHVwUHJveHlVcmkgPSBwcm94eVVyaUlkeCA+PSAwID8gY29uZmlnLmNtZFtwcm94eVVyaUlkeCArIDFdIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBjcmVhdGUgY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzXG4gICAgICAgICAgICBjb25maWcgPSBjb25maWcuY29weSgpLnNldFNlcnZlcih7dXJpOiB1cmksIHVzZXJuYW1lOiB1c2VybmFtZSwgcGFzc3dvcmQ6IHBhc3N3b3JkLCB6bXFVcmk6IHptcVVyaSwgcHJveHlVcmk6IHRoaXMuc3RhcnR1cFByb3h5VXJpLCByZWplY3RVbmF1dGhvcml6ZWQ6IGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZH0pO1xuICAgICAgICAgICAgY29uZmlnLmNtZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRScGMuY29ubmVjdFRvV2FsbGV0UnBjKGNvbmZpZyk7XG4gICAgICAgICAgICB3YWxsZXQucHJvY2VzcyA9IGNoaWxkUHJvY2VzcztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gcmVzb2x2ZSBwcm9taXNlIHdpdGggY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzIFxuICAgICAgICAgICAgdGhpcy5pc1Jlc29sdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmUod2FsbGV0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHN0ZGVyclxuICAgICAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBjb25zb2xlLmVycm9yKGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBleGl0XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcImV4aXRcIiwgZnVuY3Rpb24oY29kZSkge1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgcHJvY2VzcyB0ZXJtaW5hdGVkIHdpdGggZXhpdCBjb2RlIFwiICsgY29kZSArIChvdXRwdXQgPyBcIjpcXG5cXG5cIiArIG91dHB1dCA6IFwiXCIpKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIGVycm9yXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcImVycm9yXCIsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIGlmIChlcnIubWVzc2FnZS5pbmRleE9mKFwiRU5PRU5UXCIpID49IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBleGlzdCBhdCBwYXRoICdcIiArIGNvbmZpZy5jbWRbMF0gKyBcIidcIikpO1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgdW5jYXVnaHQgZXhjZXB0aW9uXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcInVuY2F1Z2h0RXhjZXB0aW9uXCIsIGZ1bmN0aW9uKGVyciwgb3JpZ2luKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuY2F1Z2h0IGV4Y2VwdGlvbiBpbiBtb25lcm8td2FsbGV0LXJwYyBwcm9jZXNzOiBcIiArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKG9yaWdpbik7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNsZWFyKCkge1xuICAgIHRoaXMubGlzdGVuZXJHZW5lcmF0aW9uKys7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyKSB0aGlzLndhbGxldFBvbGxlci5yZXNldCgpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICAgIGRlbGV0ZSB0aGlzLmFkZHJlc3NDYWNoZTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIHRoaXMucGF0aCA9IHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldEFjY291bnRJbmRpY2VzKGdldFN1YmFkZHJlc3NJbmRpY2VzPzogYW55KSB7XG4gICAgbGV0IGluZGljZXMgPSBuZXcgTWFwKCk7XG4gICAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCB0aGlzLmdldEFjY291bnRzKCkpIHtcbiAgICAgIGluZGljZXMuc2V0KGFjY291bnQuZ2V0SW5kZXgoKSwgZ2V0U3ViYWRkcmVzc0luZGljZXMgPyBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NJbmRpY2VzKGFjY291bnQuZ2V0SW5kZXgoKSkgOiB1bmRlZmluZWQpO1xuICAgIH1cbiAgICByZXR1cm4gaW5kaWNlcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldFN1YmFkZHJlc3NJbmRpY2VzKGFjY291bnRJZHgpIHtcbiAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzXCIsIHthY2NvdW50X2luZGV4OiBhY2NvdW50SWR4fSk7XG4gICAgZm9yIChsZXQgYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5hZGRyZXNzZXMpIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goYWRkcmVzcy5hZGRyZXNzX2luZGV4KTtcbiAgICByZXR1cm4gc3ViYWRkcmVzc0luZGljZXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRUcmFuc2ZlcnNBdXgocXVlcnk6IE1vbmVyb1RyYW5zZmVyUXVlcnkpIHtcbiAgICBcbiAgICAvLyBidWlsZCBwYXJhbXMgZm9yIGdldF90cmFuc2ZlcnMgcnBjIGNhbGxcbiAgICBsZXQgdHhRdWVyeSA9IHF1ZXJ5LmdldFR4UXVlcnkoKTtcbiAgICBsZXQgY2FuQmVDb25maXJtZWQgPSB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJc1JlbGF5ZWQoKSAhPT0gZmFsc2U7XG4gICAgbGV0IGNhbkJlSW5UeFBvb2wgPSB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9PSBmYWxzZSAmJiB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCAmJiB0eFF1ZXJ5LmdldElzTG9ja2VkKCkgIT09IGZhbHNlO1xuICAgIGxldCBjYW5CZUluY29taW5nID0gcXVlcnkuZ2V0SXNJbmNvbWluZygpICE9PSBmYWxzZSAmJiBxdWVyeS5nZXRJc091dGdvaW5nKCkgIT09IHRydWUgJiYgcXVlcnkuZ2V0SGFzRGVzdGluYXRpb25zKCkgIT09IHRydWU7XG4gICAgbGV0IGNhbkJlT3V0Z29pbmcgPSBxdWVyeS5nZXRJc091dGdvaW5nKCkgIT09IGZhbHNlICYmIHF1ZXJ5LmdldElzSW5jb21pbmcoKSAhPT0gdHJ1ZTtcblxuICAgIC8vIGNoZWNrIGlmIGZldGNoaW5nIHBvb2wgdHhzIGNvbnRyYWRpY3RlZCBieSBjb25maWd1cmF0aW9uXG4gICAgaWYgKHR4UXVlcnkuZ2V0SW5UeFBvb2woKSA9PT0gdHJ1ZSAmJiAhY2FuQmVJblR4UG9vbCkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IGZldGNoIHBvb2wgdHJhbnNhY3Rpb25zIGJlY2F1c2UgaXQgY29udHJhZGljdHMgY29uZmlndXJhdGlvblwiKTtcbiAgICB9XG5cbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuaW4gPSBjYW5CZUluY29taW5nICYmIGNhbkJlQ29uZmlybWVkO1xuICAgIHBhcmFtcy5vdXQgPSBjYW5CZU91dGdvaW5nICYmIGNhbkJlQ29uZmlybWVkO1xuICAgIHBhcmFtcy5wb29sID0gY2FuQmVJbmNvbWluZyAmJiBjYW5CZUluVHhQb29sO1xuICAgIHBhcmFtcy5wZW5kaW5nID0gY2FuQmVPdXRnb2luZyAmJiBjYW5CZUluVHhQb29sO1xuICAgIHBhcmFtcy5mYWlsZWQgPSB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT0gdHJ1ZTtcbiAgICBpZiAodHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHhRdWVyeS5nZXRNaW5IZWlnaHQoKSA+IDApIHBhcmFtcy5taW5faGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAtIDE7IC8vIFRPRE8gbW9uZXJvLXByb2plY3Q6IHdhbGxldDI6OmdldF9wYXltZW50cygpIG1pbl9oZWlnaHQgaXMgZXhjbHVzaXZlLCBzbyBtYW51YWxseSBvZmZzZXQgdG8gbWF0Y2ggaW50ZW5kZWQgcmFuZ2UgKGlzc3VlcyAjNTc1MSwgIzU1OTgpXG4gICAgICBlbHNlIHBhcmFtcy5taW5faGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKTtcbiAgICB9XG4gICAgaWYgKHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgcGFyYW1zLm1heF9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1heEhlaWdodCgpO1xuICAgIHBhcmFtcy5maWx0ZXJfYnlfaGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAhPT0gdW5kZWZpbmVkIHx8IHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgIT09IHVuZGVmaW5lZDtcbiAgICBpZiAocXVlcnkuZ2V0QWNjb3VudEluZGV4KCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0KHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpID09PSB1bmRlZmluZWQgJiYgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkLCBcIlF1ZXJ5IHNwZWNpZmllcyBhIHN1YmFkZHJlc3MgaW5kZXggYnV0IG5vdCBhbiBhY2NvdW50IGluZGV4XCIpO1xuICAgICAgcGFyYW1zLmFsbF9hY2NvdW50cyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gcXVlcnkuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgICBcbiAgICAgIC8vIHNldCBzdWJhZGRyZXNzIGluZGljZXMgcGFyYW1cbiAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IG5ldyBTZXQoKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAhPT0gdW5kZWZpbmVkKSBzdWJhZGRyZXNzSW5kaWNlcy5hZGQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5tYXAoc3ViYWRkcmVzc0lkeCA9PiBzdWJhZGRyZXNzSW5kaWNlcy5hZGQoc3ViYWRkcmVzc0lkeCkpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJbmRpY2VzLnNpemUpIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBBcnJheS5mcm9tKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgdW5pcXVlIHR4cyBhbmQgYmxvY2tzXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgXG4gICAgLy8gYnVpbGQgdHhzIHVzaW5nIGBnZXRfdHJhbnNmZXJzYFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3RyYW5zZmVyc1wiLCBwYXJhbXMpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhyZXNwLnJlc3VsdCkpIHtcbiAgICAgIGZvciAobGV0IHJwY1R4IG9mIHJlc3AucmVzdWx0W2tleV0pIHtcbiAgICAgICAgLy9pZiAocnBjVHgudHhpZCA9PT0gcXVlcnkuZGVidWdUeElkKSBjb25zb2xlLmxvZyhycGNUeCk7XG4gICAgICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHgpO1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkgYXNzZXJ0KHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCkgPiAtMSk7XG4gICAgICAgIFxuICAgICAgICAvLyByZXBsYWNlIHRyYW5zZmVyIGFtb3VudCB3aXRoIGRlc3RpbmF0aW9uIHN1bVxuICAgICAgICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBjb25maXJtZWQgdHggZnJvbS90byBzYW1lIGFjY291bnQgaGFzIGFtb3VudCAwIGJ1dCBjYWNoZWQgdHJhbnNmZXJzXG4gICAgICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRJc1JlbGF5ZWQoKSAmJiAhdHguZ2V0SXNGYWlsZWQoKSAmJlxuICAgICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpICYmIHR4LmdldE91dGdvaW5nQW1vdW50KCkgPT09IDBuKSB7XG4gICAgICAgICAgbGV0IG91dGdvaW5nVHJhbnNmZXIgPSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgICAgICAgbGV0IHRyYW5zZmVyVG90YWwgPSBCaWdJbnQoMCk7XG4gICAgICAgICAgZm9yIChsZXQgZGVzdGluYXRpb24gb2Ygb3V0Z29pbmdUcmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKSkgdHJhbnNmZXJUb3RhbCA9IHRyYW5zZmVyVG90YWwgKyBkZXN0aW5hdGlvbi5nZXRBbW91bnQoKTtcbiAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0QW1vdW50KHRyYW5zZmVyVG90YWwpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBtZXJnZSB0eFxuICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc29ydCB0eHMgYnkgYmxvY2sgaGVpZ2h0XG4gICAgbGV0IHR4czogTW9uZXJvVHhXYWxsZXRbXSA9IE9iamVjdC52YWx1ZXModHhNYXApO1xuICAgIHR4cy5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQpO1xuICAgIFxuICAgIC8vIGZpbHRlciBhbmQgcmV0dXJuIHRyYW5zZmVyc1xuICAgIGxldCB0cmFuc2ZlcnMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIFxuICAgICAgLy8gdHggaXMgbm90IGluY29taW5nL291dGdvaW5nIHVubGVzcyBhbHJlYWR5IHNldFxuICAgICAgaWYgKHR4LmdldElzSW5jb21pbmcoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0luY29taW5nKGZhbHNlKTtcbiAgICAgIGlmICh0eC5nZXRJc091dGdvaW5nKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNPdXRnb2luZyhmYWxzZSk7XG4gICAgICBcbiAgICAgIC8vIHNvcnQgaW5jb21pbmcgdHJhbnNmZXJzXG4gICAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVJbmNvbWluZ1RyYW5zZmVycyk7XG4gICAgICBcbiAgICAgIC8vIGNvbGxlY3QgcXVlcmllZCB0cmFuc2ZlcnMsIGVyYXNlIGlmIGV4Y2x1ZGVkXG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5maWx0ZXJUcmFuc2ZlcnMocXVlcnkpKSB7XG4gICAgICAgIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcmVtb3ZlIHR4cyB3aXRob3V0IHJlcXVlc3RlZCB0cmFuc2ZlclxuICAgICAgaWYgKHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT09IHVuZGVmaW5lZCAmJiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRPdXRwdXRzQXV4KHF1ZXJ5KSB7XG4gICAgXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBiZSBxdWVyaWVkXG4gICAgbGV0IGluZGljZXMgPSBuZXcgTWFwKCk7XG4gICAgaWYgKHF1ZXJ5LmdldEFjY291bnRJbmRleCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IG5ldyBTZXQoKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAhPT0gdW5kZWZpbmVkKSBzdWJhZGRyZXNzSW5kaWNlcy5hZGQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5tYXAoc3ViYWRkcmVzc0lkeCA9PiBzdWJhZGRyZXNzSW5kaWNlcy5hZGQoc3ViYWRkcmVzc0lkeCkpO1xuICAgICAgaW5kaWNlcy5zZXQocXVlcnkuZ2V0QWNjb3VudEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzLnNpemUgPyBBcnJheS5mcm9tKHN1YmFkZHJlc3NJbmRpY2VzKSA6IHVuZGVmaW5lZCk7ICAvLyB1bmRlZmluZWQgd2lsbCBmZXRjaCBmcm9tIGFsbCBzdWJhZGRyZXNzZXNcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXJ0LmVxdWFsKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpLCB1bmRlZmluZWQsIFwiUXVlcnkgc3BlY2lmaWVzIGEgc3ViYWRkcmVzcyBpbmRleCBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIilcbiAgICAgIGFzc2VydChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQgfHwgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDAsIFwiUXVlcnkgc3BlY2lmaWVzIHN1YmFkZHJlc3MgaW5kaWNlcyBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIik7XG4gICAgICBpbmRpY2VzID0gYXdhaXQgdGhpcy5nZXRBY2NvdW50SW5kaWNlcygpOyAgLy8gZmV0Y2ggYWxsIGFjY291bnQgaW5kaWNlcyB3aXRob3V0IHN1YmFkZHJlc3Nlc1xuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB1bmlxdWUgdHhzIGFuZCBibG9ja3NcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHR4cyB3aXRoIG91dHB1dHMgZm9yIGVhY2ggaW5kaWNhdGVkIGFjY291bnQgdXNpbmcgYGluY29taW5nX3RyYW5zZmVyc2AgcnBjIGNhbGxcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMudHJhbnNmZXJfdHlwZSA9IHF1ZXJ5LmdldElzU3BlbnQoKSA9PT0gdHJ1ZSA/IFwidW5hdmFpbGFibGVcIiA6IHF1ZXJ5LmdldElzU3BlbnQoKSA9PT0gZmFsc2UgPyBcImF2YWlsYWJsZVwiIDogXCJhbGxcIjtcbiAgICBwYXJhbXMudmVyYm9zZSA9IHRydWU7XG4gICAgZm9yIChsZXQgYWNjb3VudElkeCBvZiBpbmRpY2VzLmtleXMoKSkge1xuICAgIFxuICAgICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gaW5kaWNlcy5nZXQoYWNjb3VudElkeCk7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImluY29taW5nX3RyYW5zZmVyc1wiLCBwYXJhbXMpO1xuICAgICAgXG4gICAgICAvLyBjb252ZXJ0IHJlc3BvbnNlIHRvIHR4cyB3aXRoIG91dHB1dHMgYW5kIG1lcmdlXG4gICAgICBpZiAocmVzcC5yZXN1bHQudHJhbnNmZXJzID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuICAgICAgZm9yIChsZXQgcnBjT3V0cHV0IG9mIHJlc3AucmVzdWx0LnRyYW5zZmVycykge1xuICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aE91dHB1dChycGNPdXRwdXQpO1xuICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc29ydCB0eHMgYnkgYmxvY2sgaGVpZ2h0XG4gICAgbGV0IHR4czogTW9uZXJvVHhXYWxsZXRbXSA9IE9iamVjdC52YWx1ZXModHhNYXApO1xuICAgIHR4cy5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQpO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgcXVlcmllZCBvdXRwdXRzXG4gICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIFxuICAgICAgLy8gc29ydCBvdXRwdXRzXG4gICAgICBpZiAodHguZ2V0T3V0cHV0cygpICE9PSB1bmRlZmluZWQpIHR4LmdldE91dHB1dHMoKS5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlT3V0cHV0cyk7XG4gICAgICBcbiAgICAgIC8vIGNvbGxlY3QgcXVlcmllZCBvdXRwdXRzLCBlcmFzZSBpZiBleGNsdWRlZFxuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmZpbHRlck91dHB1dHMocXVlcnkpKSBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICAgIFxuICAgICAgLy8gcmVtb3ZlIGV4Y2x1ZGVkIHR4cyBmcm9tIGJsb2NrXG4gICAgICBpZiAodHguZ2V0T3V0cHV0cygpID09PSB1bmRlZmluZWQgJiYgdHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbW1vbiBtZXRob2QgdG8gZ2V0IGtleSBpbWFnZXMuXG4gICAqIFxuICAgKiBAcGFyYW0gYWxsIC0gcGVjaWZpZXMgdG8gZ2V0IGFsbCB4b3Igb25seSBuZXcgaW1hZ2VzIGZyb20gbGFzdCBpbXBvcnRcbiAgICogQHJldHVybiB7TW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHR9IHRoZSBrZXkgaW1hZ2VzIGFuZCB0aGVpciBvZmZzZXQgYW1vbmcgdGhlIHdhbGxldCdzIG91dHB1dHNcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBycGNFeHBvcnRLZXlJbWFnZXMoYWxsKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X2tleV9pbWFnZXNcIiwge2FsbDogYWxsfSk7XG4gICAgbGV0IGtleUltYWdlcyA9IChyZXNwLnJlc3VsdC5zaWduZWRfa2V5X2ltYWdlcyB8fCBbXSkubWFwKHJwY0ltYWdlID0+IG5ldyBNb25lcm9LZXlJbWFnZShycGNJbWFnZS5rZXlfaW1hZ2UsIHJwY0ltYWdlLnNpZ25hdHVyZSkpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQoKS5zZXRPZmZzZXQocmVzcC5yZXN1bHQub2Zmc2V0KS5zZXRLZXlJbWFnZXMoa2V5SW1hZ2VzKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIHJwY1N3ZWVwQWNjb3VudChjb25maWc6IE1vbmVyb1R4Q29uZmlnKSB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGFuIGFjY291bnQgaW5kZXggdG8gc3dlZXAgZnJvbVwiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCAhPSAxKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZXhhY3RseSBvbmUgZGVzdGluYXRpb24gdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGRlc3RpbmF0aW9uIGFkZHJlc3MgdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBhbW91bnQgaW4gc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0S2V5SW1hZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJLZXkgaW1hZ2UgZGVmaW5lZDsgdXNlIHN3ZWVwT3V0cHV0KCkgdG8gc3dlZXAgYW4gb3V0cHV0IGJ5IGl0cyBrZXkgaW1hZ2VcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJFbXB0eSBsaXN0IGdpdmVuIGZvciBzdWJhZGRyZXNzZXMgaW5kaWNlcyB0byBzd2VlcFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyB3aXRoIFJQQyBgc3dlZXBfYWxsYFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN3ZWVwaW5nIG91dHB1dCBkb2VzIG5vdCBzdXBwb3J0IHN1YnRyYWN0aW5nIGZlZXMgZnJvbSBkZXN0aW5hdGlvbnNcIik7XG4gICAgXG4gICAgLy8gc3dlZXAgZnJvbSBhbGwgc3ViYWRkcmVzc2VzIGlmIG5vdCBvdGhlcndpc2UgZGVmaW5lZFxuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25maWcuc2V0U3ViYWRkcmVzc0luZGljZXMoW10pO1xuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3Nlcyhjb25maWcuZ2V0QWNjb3VudEluZGV4KCkpKSB7XG4gICAgICAgIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gc3ViYWRkcmVzc2VzIHRvIHN3ZWVwIGZyb21cIik7XG4gICAgXG4gICAgLy8gY29tbW9uIGNvbmZpZyBwYXJhbXNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBsZXQgcmVsYXkgPSBjb25maWcuZ2V0UmVsYXkoKSA9PT0gdHJ1ZTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCk7XG4gICAgcGFyYW1zLmFkZHJlc3MgPSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpO1xuICAgIGFzc2VydChjb25maWcuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnLmdldFByaW9yaXR5KCk7XG4gICAgcGFyYW1zLnBheW1lbnRfaWQgPSBjb25maWcuZ2V0UGF5bWVudElkKCk7XG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9ICFyZWxheTtcbiAgICBwYXJhbXMuYmVsb3dfYW1vdW50ID0gY29uZmlnLmdldEJlbG93QW1vdW50KCk7XG4gICAgcGFyYW1zLmdldF90eF9rZXlzID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X2hleCA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9tZXRhZGF0YSA9IHRydWU7XG4gICAgXG4gICAgLy8gaW52b2tlIHdhbGxldCBycGMgYHN3ZWVwX2FsbGBcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN3ZWVwX2FsbFwiLCBwYXJhbXMpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBmcm9tIHJlc3BvbnNlXG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQsIHVuZGVmaW5lZCwgY29uZmlnKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHJlbWFpbmluZyBrbm93biBmaWVsZHNcbiAgICBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkge1xuICAgICAgdHguc2V0SXNMb2NrZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgICAgdHguc2V0UmVsYXkocmVsYXkpO1xuICAgICAgdHguc2V0SW5UeFBvb2wocmVsYXkpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHJlbGF5KTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICBsZXQgdHJhbnNmZXIgPSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgICB0cmFuc2Zlci5zZXRBY2NvdW50SW5kZXgoY29uZmlnLmdldEFjY291bnRJbmRleCgpKTtcbiAgICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDEpIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpKTtcbiAgICAgIGxldCBkZXN0aW5hdGlvbiA9IG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLCBCaWdJbnQodHJhbnNmZXIuZ2V0QW1vdW50KCkpKTtcbiAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhbZGVzdGluYXRpb25dKTtcbiAgICAgIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgICAgdHguc2V0UGF5bWVudElkKGNvbmZpZy5nZXRQYXltZW50SWQoKSk7XG4gICAgICBpZiAodHguZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQpIHR4LnNldFVubG9ja1RpbWUoMG4pO1xuICAgICAgaWYgKHR4LmdldFJlbGF5KCkpIHtcbiAgICAgICAgaWYgKHR4LmdldExhc3RSZWxheWVkVGltZXN0YW1wKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoK25ldyBEYXRlKCkuZ2V0VGltZSgpKTsgIC8vIFRPRE8gKG1vbmVyby13YWxsZXQtcnBjKTogcHJvdmlkZSB0aW1lc3RhbXAgb24gcmVzcG9uc2U7IHVuY29uZmlybWVkIHRpbWVzdGFtcHMgdmFyeVxuICAgICAgICBpZiAodHguZ2V0SXNEb3VibGVTcGVuZFNlZW4oKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0eFNldC5nZXRUeHMoKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHJlZnJlc2hMaXN0ZW5pbmcoKSB7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyID09IHVuZGVmaW5lZCAmJiB0aGlzLmxpc3RlbmVycy5sZW5ndGgpIHRoaXMud2FsbGV0UG9sbGVyID0gbmV3IFdhbGxldFBvbGxlcih0aGlzKTtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCkgdGhpcy53YWxsZXRQb2xsZXIuc2V0SXNQb2xsaW5nKHRoaXMubGlzdGVuZXJzLmxlbmd0aCA+IDApO1xuICB9XG4gIFxuICAvKipcbiAgICogUG9sbCBpZiBsaXN0ZW5pbmcuXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgcG9sbCgpIHtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndhbGxldFBvbGxlci5pc1BvbGxpbmcpIGF3YWl0IHRoaXMud2FsbGV0UG9sbGVyLnBvbGwoKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIFNUQVRJQyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IE1vbmVyb1dhbGxldENvbmZpZyB7XG4gICAgbGV0IGNvbmZpZzogdW5kZWZpbmVkIHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+ID0gdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlb2YgdXJpT3JDb25maWcgPT09IFwic3RyaW5nXCIgfHwgKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pLnVyaSkgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh7c2VydmVyOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbmZpZyBhcyBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+LCB1c2VybmFtZSwgcGFzc3dvcmQpfSk7XG4gICAgZWxzZSBpZiAoR2VuVXRpbHMuaXNBcnJheSh1cmlPckNvbmZpZykpIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoe2NtZDogdXJpT3JDb25maWcgYXMgc3RyaW5nW119KTtcbiAgICBlbHNlIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIgPT09IHVuZGVmaW5lZCkgY29uZmlnLnByb3h5VG9Xb3JrZXIgPSB0cnVlO1xuICAgIHJldHVybiBjb25maWcgYXMgTW9uZXJvV2FsbGV0Q29uZmlnO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVtb3ZlIGNyaXRlcmlhIHdoaWNoIHJlcXVpcmVzIGxvb2tpbmcgdXAgb3RoZXIgdHJhbnNmZXJzL291dHB1dHMgdG9cbiAgICogZnVsZmlsbCBxdWVyeS5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gcXVlcnkgLSB0aGUgcXVlcnkgdG8gZGVjb250ZXh0dWFsaXplXG4gICAqIEByZXR1cm4ge01vbmVyb1R4UXVlcnl9IGEgcmVmZXJlbmNlIHRvIHRoZSBxdWVyeSBmb3IgY29udmVuaWVuY2VcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZGVjb250ZXh0dWFsaXplKHF1ZXJ5KSB7XG4gICAgcXVlcnkuc2V0SXNJbmNvbWluZyh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldElzT3V0Z29pbmcodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRUcmFuc2ZlclF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0SW5wdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldE91dHB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHF1ZXJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGlzQ29udGV4dHVhbChxdWVyeSkge1xuICAgIGlmICghcXVlcnkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIXF1ZXJ5LmdldFR4UXVlcnkoKSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0SXNJbmNvbWluZygpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIHRyYW5zZmVyc1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0SXNPdXRnb2luZygpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlO1xuICAgIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb1RyYW5zZmVyUXVlcnkpIHtcbiAgICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0T3V0cHV0UXVlcnkoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciBvdXRwdXRzXG4gICAgfSBlbHNlIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb091dHB1dFF1ZXJ5KSB7XG4gICAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldFRyYW5zZmVyUXVlcnkoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciB0cmFuc2ZlcnNcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicXVlcnkgbXVzdCBiZSB0eCBvciB0cmFuc2ZlciBxdWVyeVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNBY2NvdW50KHJwY0FjY291bnQpIHtcbiAgICBsZXQgYWNjb3VudCA9IG5ldyBNb25lcm9BY2NvdW50KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0FjY291bnQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQWNjb3VudFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhY2NvdW50X2luZGV4XCIpIGFjY291bnQuc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYWxhbmNlXCIpIGFjY291bnQuc2V0QmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfYmFsYW5jZVwiKSBhY2NvdW50LnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmFzZV9hZGRyZXNzXCIpIGFjY291bnQuc2V0UHJpbWFyeUFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YWdcIikgYWNjb3VudC5zZXRUYWcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYWJlbFwiKSB7IH0gLy8gbGFiZWwgYmVsb25ncyB0byBmaXJzdCBzdWJhZGRyZXNzXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBhY2NvdW50IGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChcIlwiID09PSBhY2NvdW50LmdldFRhZygpKSBhY2NvdW50LnNldFRhZyh1bmRlZmluZWQpO1xuICAgIHJldHVybiBhY2NvdW50O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpIHtcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N1YmFkZHJlc3MpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjU3ViYWRkcmVzc1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhY2NvdW50X2luZGV4XCIpIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc19pbmRleFwiKSBzdWJhZGRyZXNzLnNldEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSBzdWJhZGRyZXNzLnNldEFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYWxhbmNlXCIpIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfYmFsYW5jZVwiKSBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX3Vuc3BlbnRfb3V0cHV0c1wiKSBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFiZWxcIikgeyBpZiAodmFsKSBzdWJhZGRyZXNzLnNldExhYmVsKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1c2VkXCIpIHN1YmFkZHJlc3Muc2V0SXNVc2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tzX3RvX3VubG9ja1wiKSBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT0gXCJ0aW1lX3RvX3VubG9ja1wiKSB7fSAgLy8gaWdub3JpbmdcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHN1YmFkZHJlc3MgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIHNlbnQgdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBUT0RPOiByZW1vdmUgY29weURlc3RpbmF0aW9ucyBhZnRlciA+MTguMy4xIHdoZW4gc3VidHJhY3RGZWVGcm9tIGZ1bGx5IHN1cHBvcnRlZFxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeENvbmZpZ30gY29uZmlnIC0gc2VuZCBjb25maWdcbiAgICogQHBhcmFtIHtNb25lcm9UeFdhbGxldH0gW3R4XSAtIGV4aXN0aW5nIHRyYW5zYWN0aW9uIHRvIGluaXRpYWxpemUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGNvcHlEZXN0aW5hdGlvbnMgLSBjb3BpZXMgY29uZmlnIGRlc3RpbmF0aW9ucyBpZiB0cnVlXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSBpcyB0aGUgaW5pdGlhbGl6ZWQgc2VuZCB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBpbml0U2VudFR4V2FsbGV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4sIHR4LCBjb3B5RGVzdGluYXRpb25zKSB7XG4gICAgaWYgKCF0eCkgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICBsZXQgcmVsYXkgPSBjb25maWcuZ2V0UmVsYXkoKSA9PT0gdHJ1ZTtcbiAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgIHR4LnNldEluVHhQb29sKHJlbGF5KTtcbiAgICB0eC5zZXRSZWxheShyZWxheSk7XG4gICAgdHguc2V0SXNSZWxheWVkKHJlbGF5KTtcbiAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICB0eC5zZXRJc0xvY2tlZCh0cnVlKTtcbiAgICB0eC5zZXRSaW5nU2l6ZShNb25lcm9VdGlscy5SSU5HX1NJWkUpO1xuICAgIGxldCB0cmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgdHJhbnNmZXIuc2V0VHgodHgpO1xuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAmJiBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDEpIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnNsaWNlKDApKTsgLy8gd2Uga25vdyBzcmMgc3ViYWRkcmVzcyBpbmRpY2VzIGlmZiBjb25maWcgc3BlY2lmaWVzIDFcbiAgICBpZiAoY29weURlc3RpbmF0aW9ucykge1xuICAgICAgbGV0IGRlc3RDb3BpZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IGRlc3Qgb2YgY29uZmlnLmdldERlc3RpbmF0aW9ucygpKSBkZXN0Q29waWVzLnB1c2goZGVzdC5jb3B5KCkpO1xuICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKGRlc3RDb3BpZXMpO1xuICAgIH1cbiAgICB0eC5zZXRPdXRnb2luZ1RyYW5zZmVyKHRyYW5zZmVyKTtcbiAgICB0eC5zZXRQYXltZW50SWQoY29uZmlnLmdldFBheW1lbnRJZCgpKTtcbiAgICBpZiAodHguZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQpIHR4LnNldFVubG9ja1RpbWUoMG4pO1xuICAgIGlmIChjb25maWcuZ2V0UmVsYXkoKSkge1xuICAgICAgaWYgKHR4LmdldExhc3RSZWxheWVkVGltZXN0YW1wKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoK25ldyBEYXRlKCkuZ2V0VGltZSgpKTsgIC8vIFRPRE8gKG1vbmVyby13YWxsZXQtcnBjKTogcHJvdmlkZSB0aW1lc3RhbXAgb24gcmVzcG9uc2U7IHVuY29uZmlybWVkIHRpbWVzdGFtcHMgdmFyeVxuICAgICAgaWYgKHR4LmdldElzRG91YmxlU3BlbmRTZWVuKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4oZmFsc2UpO1xuICAgIH1cbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIHR4IHNldCBmcm9tIGEgUlBDIG1hcCBleGNsdWRpbmcgdHhzLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY01hcCAtIG1hcCB0byBpbml0aWFsaXplIHRoZSB0eCBzZXQgZnJvbVxuICAgKiBAcmV0dXJuIE1vbmVyb1R4U2V0IC0gaW5pdGlhbGl6ZWQgdHggc2V0XG4gICAqIEByZXR1cm4gdGhlIHJlc3VsdGluZyB0eCBzZXRcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4U2V0KHJwY01hcCkge1xuICAgIGxldCB0eFNldCA9IG5ldyBNb25lcm9UeFNldCgpO1xuICAgIHR4U2V0LnNldE11bHRpc2lnVHhIZXgocnBjTWFwLm11bHRpc2lnX3R4c2V0KTtcbiAgICB0eFNldC5zZXRVbnNpZ25lZFR4SGV4KHJwY01hcC51bnNpZ25lZF90eHNldCk7XG4gICAgdHhTZXQuc2V0U2lnbmVkVHhIZXgocnBjTWFwLnNpZ25lZF90eHNldCk7XG4gICAgaWYgKHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKSAhPT0gdW5kZWZpbmVkICYmIHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKS5sZW5ndGggPT09IDApIHR4U2V0LnNldE11bHRpc2lnVHhIZXgodW5kZWZpbmVkKTtcbiAgICBpZiAodHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0VW5zaWduZWRUeEhleCh1bmRlZmluZWQpO1xuICAgIGlmICh0eFNldC5nZXRTaWduZWRUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0U2lnbmVkVHhIZXgoKS5sZW5ndGggPT09IDApIHR4U2V0LnNldFNpZ25lZFR4SGV4KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBNb25lcm9UeFNldCBmcm9tIGEgbGlzdCBvZiBycGMgdHhzLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4cyAtIHJwYyB0eHMgdG8gaW5pdGlhbGl6ZSB0aGUgc2V0IGZyb21cbiAgICogQHBhcmFtIHR4cyAtIGV4aXN0aW5nIHR4cyB0byBmdXJ0aGVyIGluaXRpYWxpemUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4gdGhlIGNvbnZlcnRlZCB0eCBzZXRcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJwY1R4czogYW55LCB0eHM/OiBhbnksIGNvbmZpZz86IGFueSkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHNoYXJlZCB0eCBzZXRcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4U2V0KHJwY1R4cyk7XG5cbiAgICAvLyBnZXQgbnVtYmVyIG9mIHR4c1xuICAgIGxldCBudW1UeHMgPSBycGNUeHMuZmVlX2xpc3QgPyBycGNUeHMuZmVlX2xpc3QubGVuZ3RoIDogcnBjVHhzLnR4X2hhc2hfbGlzdCA/IHJwY1R4cy50eF9oYXNoX2xpc3QubGVuZ3RoIDogMDtcbiAgICBcbiAgICAvLyBkb25lIGlmIHJwYyByZXNwb25zZSBjb250YWlucyBubyB0eHNcbiAgICBpZiAobnVtVHhzID09PSAwKSB7XG4gICAgICBhc3NlcnQuZXF1YWwodHhzLCB1bmRlZmluZWQpO1xuICAgICAgcmV0dXJuIHR4U2V0O1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBpZiBub25lIGdpdmVuXG4gICAgaWYgKHR4cykgdHhTZXQuc2V0VHhzKHR4cyk7XG4gICAgZWxzZSB7XG4gICAgICB0eHMgPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVHhzOyBpKyspIHR4cy5wdXNoKG5ldyBNb25lcm9UeFdhbGxldCgpKTtcbiAgICB9XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICB0eC5zZXRUeFNldCh0eFNldCk7XG4gICAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgIH1cbiAgICB0eFNldC5zZXRUeHModHhzKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBmcm9tIHJwYyBsaXN0c1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUeHMpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVHhzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInR4X2hhc2hfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEhhc2godmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9rZXlfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEtleSh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2Jsb2JfbGlzdFwiIHx8IGtleSA9PT0gXCJ0eF9yYXdfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEZ1bGxIZXgodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9tZXRhZGF0YV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0TWV0YWRhdGEodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEZlZShCaWdJbnQodmFsW2ldKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2VpZ2h0X2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRXZWlnaHQodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRfbGlzdFwiKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHR4c1tpXS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT0gdW5kZWZpbmVkKSB0eHNbaV0uc2V0T3V0Z29pbmdUcmFuc2ZlcihuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHR4c1tpXSkpO1xuICAgICAgICAgIHR4c1tpXS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0QW1vdW50KEJpZ0ludCh2YWxbaV0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm11bHRpc2lnX3R4c2V0XCIgfHwga2V5ID09PSBcInVuc2lnbmVkX3R4c2V0XCIgfHwga2V5ID09PSBcInNpZ25lZF90eHNldFwiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50X2tleV9pbWFnZXNfbGlzdFwiKSB7XG4gICAgICAgIGxldCBpbnB1dEtleUltYWdlc0xpc3QgPSB2YWw7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRLZXlJbWFnZXNMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZSh0eHNbaV0uZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICAgICAgdHhzW2ldLnNldElucHV0cyhbXSk7XG4gICAgICAgICAgZm9yIChsZXQgaW5wdXRLZXlJbWFnZSBvZiBpbnB1dEtleUltYWdlc0xpc3RbaV1bXCJrZXlfaW1hZ2VzXCJdKSB7XG4gICAgICAgICAgICB0eHNbaV0uZ2V0SW5wdXRzKCkucHVzaChuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCkuc2V0S2V5SW1hZ2UobmV3IE1vbmVyb0tleUltYWdlKCkuc2V0SGV4KGlucHV0S2V5SW1hZ2UpKS5zZXRUeCh0eHNbaV0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzX2J5X2Rlc3RfbGlzdFwiKSB7XG4gICAgICAgIGxldCBhbW91bnRzQnlEZXN0TGlzdCA9IHZhbDtcbiAgICAgICAgbGV0IGRlc3RpbmF0aW9uSWR4ID0gMDtcbiAgICAgICAgZm9yIChsZXQgdHhJZHggPSAwOyB0eElkeCA8IGFtb3VudHNCeURlc3RMaXN0Lmxlbmd0aDsgdHhJZHgrKykge1xuICAgICAgICAgIGxldCBhbW91bnRzQnlEZXN0ID0gYW1vdW50c0J5RGVzdExpc3RbdHhJZHhdW1wiYW1vdW50c1wiXTtcbiAgICAgICAgICBpZiAodHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT09IHVuZGVmaW5lZCkgdHhzW3R4SWR4XS5zZXRPdXRnb2luZ1RyYW5zZmVyKG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHhzW3R4SWR4XSkpO1xuICAgICAgICAgIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldERlc3RpbmF0aW9ucyhbXSk7XG4gICAgICAgICAgZm9yIChsZXQgYW1vdW50IG9mIGFtb3VudHNCeURlc3QpIHtcbiAgICAgICAgICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoID09PSAxKSB0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKS5wdXNoKG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLCBCaWdJbnQoYW1vdW50KSkpOyAvLyBzd2VlcGluZyBjYW4gY3JlYXRlIG11bHRpcGxlIHR4cyB3aXRoIG9uZSBhZGRyZXNzXG4gICAgICAgICAgICBlbHNlIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVtkZXN0aW5hdGlvbklkeCsrXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnQpKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhIHJwYyB0eCB3aXRoIGEgdHJhbnNmZXIgdG8gYSB0eCBzZXQgd2l0aCBhIHR4IGFuZCB0cmFuc2Zlci5cbiAgICogXG4gICAqIEBwYXJhbSBycGNUeCAtIHJwYyB0eCB0byBidWlsZCBmcm9tXG4gICAqIEBwYXJhbSB0eCAtIGV4aXN0aW5nIHR4IHRvIGNvbnRpbnVlIGluaXRpYWxpemluZyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBpc091dGdvaW5nIC0gc3BlY2lmaWVzIGlmIHRoZSB0eCBpcyBvdXRnb2luZyBpZiB0cnVlLCBpbmNvbWluZyBpZiBmYWxzZSwgb3IgZGVjb2RlcyBmcm9tIHR5cGUgaWYgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB0aGUgaW5pdGlhbGl6ZWQgdHggc2V0IHdpdGggYSB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhUb1R4U2V0KHJwY1R4LCB0eCwgaXNPdXRnb2luZywgY29uZmlnKSB7XG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFNldChycGNUeCk7XG4gICAgdHhTZXQuc2V0VHhzKFtNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4LCB0eCwgaXNPdXRnb2luZywgY29uZmlnKS5zZXRUeFNldCh0eFNldCldKTtcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBCdWlsZHMgYSBNb25lcm9UeFdhbGxldCBmcm9tIGEgUlBDIHR4LlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4IC0gcnBjIHR4IHRvIGJ1aWxkIGZyb21cbiAgICogQHBhcmFtIHR4IC0gZXhpc3RpbmcgdHggdG8gY29udGludWUgaW5pdGlhbGl6aW5nIChvcHRpb25hbClcbiAgICogQHBhcmFtIGlzT3V0Z29pbmcgLSBzcGVjaWZpZXMgaWYgdGhlIHR4IGlzIG91dGdvaW5nIGlmIHRydWUsIGluY29taW5nIGlmIGZhbHNlLCBvciBkZWNvZGVzIGZyb20gdHlwZSBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gaXMgdGhlIGluaXRpYWxpemVkIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlcihycGNUeDogYW55LCB0eD86IGFueSwgaXNPdXRnb2luZz86IGFueSwgY29uZmlnPzogYW55KSB7ICAvLyBUT0RPOiBjaGFuZ2UgZXZlcnl0aGluZyB0byBzYWZlIHNldFxuICAgICAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHRvIHJldHVyblxuICAgIGlmICghdHgpIHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCBzdGF0ZSBmcm9tIHJwYyB0eXBlXG4gICAgaWYgKHJwY1R4LnR5cGUgIT09IHVuZGVmaW5lZCkgaXNPdXRnb2luZyA9IE1vbmVyb1dhbGxldFJwYy5kZWNvZGVScGNUeXBlKHJwY1R4LnR5cGUsIHR4KTtcbiAgICBlbHNlIGFzc2VydC5lcXVhbCh0eXBlb2YgaXNPdXRnb2luZywgXCJib29sZWFuXCIsIFwiTXVzdCBpbmRpY2F0ZSBpZiB0eCBpcyBvdXRnb2luZyAodHJ1ZSkgeG9yIGluY29taW5nIChmYWxzZSkgc2luY2UgdW5rbm93blwiKTtcbiAgICBcbiAgICAvLyBUT0RPOiBzYWZlIHNldFxuICAgIC8vIGluaXRpYWxpemUgcmVtYWluaW5nIGZpZWxkcyAgVE9ETzogc2VlbXMgdGhpcyBzaG91bGQgYmUgcGFydCBvZiBjb21tb24gZnVuY3Rpb24gd2l0aCBEYWVtb25ScGMuY29udmVydFJwY1R4XG4gICAgbGV0IGhlYWRlcjtcbiAgICBsZXQgdHJhbnNmZXI7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1R4KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1R4W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInR4aWRcIikgdHguc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2hhc2hcIikgdHguc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZVwiKSB0eC5zZXRGZWUoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5vdGVcIikgeyBpZiAodmFsKSB0eC5zZXROb3RlKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9rZXlcIikgdHguc2V0S2V5KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHlwZVwiKSB7IH0gLy8gdHlwZSBhbHJlYWR5IGhhbmRsZWRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9zaXplXCIpIHR4LnNldFNpemUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tfdGltZVwiKSB0eC5zZXRVbmxvY2tUaW1lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2VpZ2h0XCIpIHR4LnNldFdlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvY2tlZFwiKSB0eC5zZXRJc0xvY2tlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2Jsb2JcIikgdHguc2V0RnVsbEhleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X21ldGFkYXRhXCIpIHR4LnNldE1ldGFkYXRhKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZG91YmxlX3NwZW5kX3NlZW5cIikgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oZWlnaHRcIiB8fCBrZXkgPT09IFwiaGVpZ2h0XCIpIHtcbiAgICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIHtcbiAgICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgICAgaGVhZGVyLnNldEhlaWdodCh2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGltZXN0YW1wXCIpIHtcbiAgICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIHtcbiAgICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgICAgaGVhZGVyLnNldFRpbWVzdGFtcCh2YWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHRpbWVzdGFtcCBvZiB1bmNvbmZpcm1lZCB0eCBpcyBjdXJyZW50IHJlcXVlc3QgdGltZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY29uZmlybWF0aW9uc1wiKSB0eC5zZXROdW1Db25maXJtYXRpb25zKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3VnZ2VzdGVkX2NvbmZpcm1hdGlvbnNfdGhyZXNob2xkXCIpIHtcbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gKGlzT3V0Z29pbmcgPyBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpIDogbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKSkuc2V0VHgodHgpO1xuICAgICAgICBpZiAoIWlzT3V0Z29pbmcpIHRyYW5zZmVyLnNldE51bVN1Z2dlc3RlZENvbmZpcm1hdGlvbnModmFsKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRcIikge1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIHRyYW5zZmVyLnNldEFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50c1wiKSB7fSAgLy8gaWdub3JpbmcsIGFtb3VudHMgc3VtIHRvIGFtb3VudFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkZHJlc3NcIikge1xuICAgICAgICBpZiAoIWlzT3V0Z29pbmcpIHtcbiAgICAgICAgICBpZiAoIXRyYW5zZmVyKSB0cmFuc2ZlciA9IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkuc2V0VHgodHgpO1xuICAgICAgICAgIHRyYW5zZmVyLnNldEFkZHJlc3ModmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBheW1lbnRfaWRcIikge1xuICAgICAgICBpZiAoXCJcIiAhPT0gdmFsICYmIE1vbmVyb1R4V2FsbGV0LkRFRkFVTFRfUEFZTUVOVF9JRCAhPT0gdmFsKSB0eC5zZXRQYXltZW50SWQodmFsKTsgIC8vIGRlZmF1bHQgaXMgdW5kZWZpbmVkXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRleFwiKSBhc3NlcnQocnBjVHguc3ViYWRkcl9pbmRpY2VzKTsgIC8vIGhhbmRsZWQgYnkgc3ViYWRkcl9pbmRpY2VzXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRpY2VzXCIpIHtcbiAgICAgICAgaWYgKCF0cmFuc2ZlcikgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIGxldCBycGNJbmRpY2VzID0gdmFsO1xuICAgICAgICB0cmFuc2Zlci5zZXRBY2NvdW50SW5kZXgocnBjSW5kaWNlc1swXS5tYWpvcik7XG4gICAgICAgIGlmIChpc091dGdvaW5nKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgICAgICAgZm9yIChsZXQgcnBjSW5kZXggb2YgcnBjSW5kaWNlcykgc3ViYWRkcmVzc0luZGljZXMucHVzaChycGNJbmRleC5taW5vcik7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFzc2VydC5lcXVhbChycGNJbmRpY2VzLmxlbmd0aCwgMSk7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGV4KHJwY0luZGljZXNbMF0ubWlub3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGVzdGluYXRpb25zXCIgfHwga2V5ID09IFwicmVjaXBpZW50c1wiKSB7XG4gICAgICAgIGFzc2VydChpc091dGdvaW5nKTtcbiAgICAgICAgbGV0IGRlc3RpbmF0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBycGNEZXN0aW5hdGlvbiBvZiB2YWwpIHtcbiAgICAgICAgICBsZXQgZGVzdGluYXRpb24gPSBuZXcgTW9uZXJvRGVzdGluYXRpb24oKTtcbiAgICAgICAgICBkZXN0aW5hdGlvbnMucHVzaChkZXN0aW5hdGlvbik7XG4gICAgICAgICAgZm9yIChsZXQgZGVzdGluYXRpb25LZXkgb2YgT2JqZWN0LmtleXMocnBjRGVzdGluYXRpb24pKSB7XG4gICAgICAgICAgICBpZiAoZGVzdGluYXRpb25LZXkgPT09IFwiYWRkcmVzc1wiKSBkZXN0aW5hdGlvbi5zZXRBZGRyZXNzKHJwY0Rlc3RpbmF0aW9uW2Rlc3RpbmF0aW9uS2V5XSk7XG4gICAgICAgICAgICBlbHNlIGlmIChkZXN0aW5hdGlvbktleSA9PT0gXCJhbW91bnRcIikgZGVzdGluYXRpb24uc2V0QW1vdW50KEJpZ0ludChycGNEZXN0aW5hdGlvbltkZXN0aW5hdGlvbktleV0pKTtcbiAgICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVW5yZWNvZ25pemVkIHRyYW5zYWN0aW9uIGRlc3RpbmF0aW9uIGZpZWxkOiBcIiArIGRlc3RpbmF0aW9uS2V5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoe3R4OiB0eH0pO1xuICAgICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoZGVzdGluYXRpb25zKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzb3VyY2VzXCIpIHtcbiAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZSh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdHguc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgZm9yIChsZXQgcnBjU291cmNlIG9mIHZhbCkge1xuICAgICAgICAgIGxldCBpbnB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKS5zZXRUeCh0eCk7XG4gICAgICAgICAgaW5wdXQuc2V0QW1vdW50KEJpZ0ludChycGNTb3VyY2UuYW1vdW50KSk7XG4gICAgICAgICAgaW5wdXQuc2V0SW5kZXgocnBjU291cmNlLmdsb2JhbF9pbmRleCk7XG4gICAgICAgICAgaWYgKHJwY1NvdXJjZS5wdWJrZXkgIT09IHVuZGVmaW5lZCkgaW5wdXQuc2V0U3RlYWx0aFB1YmxpY0tleShycGNTb3VyY2UucHVia2V5LnN1YnN0cmluZygwLCA2NCkpOyAvLyBkZXN0IGtleSBvZiBkZXN0fHxtYXNrXG4gICAgICAgICAgdHguZ2V0SW5wdXRzKCkucHVzaChpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtdWx0aXNpZ190eHNldFwiICYmIHZhbCAhPT0gdW5kZWZpbmVkKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZTsgdGhpcyBtZXRob2Qgb25seSBidWlsZHMgYSB0eCB3YWxsZXRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnNpZ25lZF90eHNldFwiICYmIHZhbCAhPT0gdW5kZWZpbmVkKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZTsgdGhpcyBtZXRob2Qgb25seSBidWlsZHMgYSB0eCB3YWxsZXRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRfaW5cIikgdHguc2V0SW5wdXRTdW0oQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9vdXRcIikgdHguc2V0T3V0cHV0U3VtKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjaGFuZ2VfYWRkcmVzc1wiKSB0eC5zZXRDaGFuZ2VBZGRyZXNzKHZhbCA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY2hhbmdlX2Ftb3VudFwiKSB0eC5zZXRDaGFuZ2VBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImR1bW15X291dHB1dHNcIikgdHguc2V0TnVtRHVtbXlPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZXh0cmFcIikgdHguc2V0RXh0cmFIZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyaW5nX3NpemVcIikgdHguc2V0UmluZ1NpemUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGVudF9rZXlfaW1hZ2VzXCIpIHtcbiAgICAgICAgbGV0IGlucHV0S2V5SW1hZ2VzID0gdmFsLmtleV9pbWFnZXM7XG4gICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUodHguZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHR4LnNldElucHV0cyhbXSk7XG4gICAgICAgIGZvciAobGV0IGlucHV0S2V5SW1hZ2Ugb2YgaW5wdXRLZXlJbWFnZXMpIHtcbiAgICAgICAgICB0eC5nZXRJbnB1dHMoKS5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKS5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UoKS5zZXRIZXgoaW5wdXRLZXlJbWFnZSkpLnNldFR4KHR4KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzX2J5X2Rlc3RcIikge1xuICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKGlzT3V0Z29pbmcpO1xuICAgICAgICBsZXQgYW1vdW50c0J5RGVzdCA9IHZhbC5hbW91bnRzO1xuICAgICAgICBhc3NlcnQuZXF1YWwoY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCwgYW1vdW50c0J5RGVzdC5sZW5ndGgpO1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHR4KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKFtdKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB0cmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKS5wdXNoKG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbaV0uZ2V0QWRkcmVzcygpLCBCaWdJbnQoYW1vdW50c0J5RGVzdFtpXSkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgdHJhbnNhY3Rpb24gZmllbGQgd2l0aCB0cmFuc2ZlcjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBsaW5rIGJsb2NrIGFuZCB0eFxuICAgIGlmIChoZWFkZXIpIHR4LnNldEJsb2NrKG5ldyBNb25lcm9CbG9jayhoZWFkZXIpLnNldFR4cyhbdHhdKSk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBmaW5hbCBmaWVsZHNcbiAgICBpZiAodHJhbnNmZXIpIHtcbiAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpID09PSB1bmRlZmluZWQpIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIGlmICghdHJhbnNmZXIuZ2V0VHgoKS5nZXRJc0NvbmZpcm1lZCgpKSB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgICAgaWYgKGlzT3V0Z29pbmcpIHtcbiAgICAgICAgdHguc2V0SXNPdXRnb2luZyh0cnVlKTtcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSkge1xuICAgICAgICAgIGlmICh0cmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKSkgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldERlc3RpbmF0aW9ucyh1bmRlZmluZWQpOyAvLyBvdmVyd3JpdGUgdG8gYXZvaWQgcmVjb25jaWxlIGVycm9yIFRPRE86IHJlbW92ZSBhZnRlciA+MTguMy4xIHdoZW4gYW1vdW50c19ieV9kZXN0IHN1cHBvcnRlZFxuICAgICAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5tZXJnZSh0cmFuc2Zlcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB0eC5zZXRPdXRnb2luZ1RyYW5zZmVyKHRyYW5zZmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHR4LnNldElzSW5jb21pbmcodHJ1ZSk7XG4gICAgICAgIHR4LnNldEluY29taW5nVHJhbnNmZXJzKFt0cmFuc2Zlcl0pO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyByZXR1cm4gaW5pdGlhbGl6ZWQgdHJhbnNhY3Rpb25cbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4V2l0aE91dHB1dChycGNPdXRwdXQpIHtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4XG4gICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBvdXRwdXRcbiAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCh7dHg6IHR4fSk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY091dHB1dCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNPdXRwdXRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIG91dHB1dC5zZXRBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50XCIpIG91dHB1dC5zZXRJc1NwZW50KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwia2V5X2ltYWdlXCIpIHsgaWYgKFwiXCIgIT09IHZhbCkgb3V0cHV0LnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSh2YWwpKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImdsb2JhbF9pbmRleFwiKSBvdXRwdXQuc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZFwiKSB0eC5zZXRJc0xvY2tlZCghdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmcm96ZW5cIikgb3V0cHV0LnNldElzRnJvemVuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHVia2V5XCIpIG91dHB1dC5zZXRTdGVhbHRoUHVibGljS2V5KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRleFwiKSB7XG4gICAgICAgIG91dHB1dC5zZXRBY2NvdW50SW5kZXgodmFsLm1ham9yKTtcbiAgICAgICAgb3V0cHV0LnNldFN1YmFkZHJlc3NJbmRleCh2YWwubWlub3IpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiKSB0eC5zZXRCbG9jaygobmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KHZhbCkgYXMgTW9uZXJvQmxvY2spLnNldFR4cyhbdHggYXMgTW9uZXJvVHhdKSk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHdpdGggb3V0cHV0XG4gICAgdHguc2V0T3V0cHV0cyhbb3V0cHV0XSk7XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNEZXNjcmliZVRyYW5zZmVyKHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQpIHtcbiAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImRlc2NcIikge1xuICAgICAgICB0eFNldC5zZXRUeHMoW10pO1xuICAgICAgICBmb3IgKGxldCB0eE1hcCBvZiB2YWwpIHtcbiAgICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHR4TWFwLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgIHR4LnNldFR4U2V0KHR4U2V0KTtcbiAgICAgICAgICB0eFNldC5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1bW1hcnlcIikgeyB9IC8vIFRPRE86IHN1cHBvcnQgdHggc2V0IHN1bW1hcnkgZmllbGRzP1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZGVzY2RyaWJlIHRyYW5zZmVyIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlY29kZXMgYSBcInR5cGVcIiBmcm9tIG1vbmVyby13YWxsZXQtcnBjIHRvIGluaXRpYWxpemUgdHlwZSBhbmQgc3RhdGVcbiAgICogZmllbGRzIGluIHRoZSBnaXZlbiB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIFRPRE86IHRoZXNlIHNob3VsZCBiZSBzYWZlIHNldFxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R5cGUgaXMgdGhlIHR5cGUgdG8gZGVjb2RlXG4gICAqIEBwYXJhbSB0eCBpcyB0aGUgdHJhbnNhY3Rpb24gdG8gZGVjb2RlIGtub3duIGZpZWxkcyB0b1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBycGMgdHlwZSBpbmRpY2F0ZXMgb3V0Z29pbmcgeG9yIGluY29taW5nXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGRlY29kZVJwY1R5cGUocnBjVHlwZSwgdHgpIHtcbiAgICBsZXQgaXNPdXRnb2luZztcbiAgICBpZiAocnBjVHlwZSA9PT0gXCJpblwiKSB7XG4gICAgICBpc091dGdvaW5nID0gZmFsc2U7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwib3V0XCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBvb2xcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7ICAvLyBUT0RPOiBidXQgY291bGQgaXQgYmU/XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBlbmRpbmdcIikge1xuICAgICAgaXNPdXRnb2luZyA9IHRydWU7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiYmxvY2tcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeCh0cnVlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiZmFpbGVkXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNmZXIgdHlwZTogXCIgKyBycGNUeXBlKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzT3V0Z29pbmc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNZXJnZXMgYSB0cmFuc2FjdGlvbiBpbnRvIGEgdW5pcXVlIHNldCBvZiB0cmFuc2FjdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhXYWxsZXR9IHR4IC0gdGhlIHRyYW5zYWN0aW9uIHRvIG1lcmdlIGludG8gdGhlIGV4aXN0aW5nIHR4c1xuICAgKiBAcGFyYW0ge09iamVjdH0gdHhNYXAgLSBtYXBzIHR4IGhhc2hlcyB0byB0eHNcbiAgICogQHBhcmFtIHtPYmplY3R9IGJsb2NrTWFwIC0gbWFwcyBibG9jayBoZWlnaHRzIHRvIGJsb2Nrc1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBtZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApIHtcbiAgICBhc3NlcnQodHguZ2V0SGFzaCgpICE9PSB1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIG1lcmdlIHR4XG4gICAgbGV0IGFUeCA9IHR4TWFwW3R4LmdldEhhc2goKV07XG4gICAgaWYgKGFUeCA9PT0gdW5kZWZpbmVkKSB0eE1hcFt0eC5nZXRIYXNoKCldID0gdHg7IC8vIGNhY2hlIG5ldyB0eFxuICAgIGVsc2UgYVR4Lm1lcmdlKHR4KTsgLy8gbWVyZ2Ugd2l0aCBleGlzdGluZyB0eFxuICAgIFxuICAgIC8vIG1lcmdlIHR4J3MgYmxvY2sgaWYgY29uZmlybWVkXG4gICAgaWYgKHR4LmdldEhlaWdodCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBhQmxvY2sgPSBibG9ja01hcFt0eC5nZXRIZWlnaHQoKV07XG4gICAgICBpZiAoYUJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrTWFwW3R4LmdldEhlaWdodCgpXSA9IHR4LmdldEJsb2NrKCk7IC8vIGNhY2hlIG5ldyBibG9ja1xuICAgICAgZWxzZSBhQmxvY2subWVyZ2UodHguZ2V0QmxvY2soKSk7IC8vIG1lcmdlIHdpdGggZXhpc3RpbmcgYmxvY2tcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNhY3Rpb25zIGJ5IHRoZWlyIGhlaWdodC5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29tcGFyZVR4c0J5SGVpZ2h0KHR4MSwgdHgyKSB7XG4gICAgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4Mi5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMDsgLy8gYm90aCB1bmNvbmZpcm1lZFxuICAgIGVsc2UgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMTsgICAvLyB0eDEgaXMgdW5jb25maXJtZWRcbiAgICBlbHNlIGlmICh0eDIuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIC0xOyAgLy8gdHgyIGlzIHVuY29uZmlybWVkXG4gICAgbGV0IGRpZmYgPSB0eDEuZ2V0SGVpZ2h0KCkgLSB0eDIuZ2V0SGVpZ2h0KCk7XG4gICAgaWYgKGRpZmYgIT09IDApIHJldHVybiBkaWZmO1xuICAgIHJldHVybiB0eDEuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4MSkgLSB0eDIuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4Mik7IC8vIHR4cyBhcmUgaW4gdGhlIHNhbWUgYmxvY2sgc28gcmV0YWluIHRoZWlyIG9yaWdpbmFsIG9yZGVyXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNmZXJzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBzdGF0aWMgY29tcGFyZUluY29taW5nVHJhbnNmZXJzKHQxLCB0Mikge1xuICAgIGlmICh0MS5nZXRBY2NvdW50SW5kZXgoKSA8IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gLTE7XG4gICAgZWxzZSBpZiAodDEuZ2V0QWNjb3VudEluZGV4KCkgPT09IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gdDEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSB0Mi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICByZXR1cm4gMTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byBvdXRwdXRzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbXBhcmVPdXRwdXRzKG8xLCBvMikge1xuICAgIFxuICAgIC8vIGNvbXBhcmUgYnkgaGVpZ2h0XG4gICAgbGV0IGhlaWdodENvbXBhcmlzb24gPSBNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KG8xLmdldFR4KCksIG8yLmdldFR4KCkpO1xuICAgIGlmIChoZWlnaHRDb21wYXJpc29uICE9PSAwKSByZXR1cm4gaGVpZ2h0Q29tcGFyaXNvbjtcbiAgICBcbiAgICAvLyBjb21wYXJlIGJ5IGFjY291bnQgaW5kZXgsIHN1YmFkZHJlc3MgaW5kZXgsIG91dHB1dCBpbmRleCwgdGhlbiBrZXkgaW1hZ2UgaGV4XG4gICAgbGV0IGNvbXBhcmUgPSBvMS5nZXRBY2NvdW50SW5kZXgoKSAtIG8yLmdldEFjY291bnRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICBjb21wYXJlID0gbzEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSBvMi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICBpZiAoY29tcGFyZSAhPT0gMCkgcmV0dXJuIGNvbXBhcmU7XG4gICAgY29tcGFyZSA9IG8xLmdldEluZGV4KCkgLSBvMi5nZXRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICByZXR1cm4gbzEuZ2V0S2V5SW1hZ2UoKS5nZXRIZXgoKS5sb2NhbGVDb21wYXJlKG8yLmdldEtleUltYWdlKCkuZ2V0SGV4KCkpO1xuICB9XG59XG5cbi8qKlxuICogUG9sbHMgbW9uZXJvLXdhbGxldC1ycGMgdG8gcHJvdmlkZSBsaXN0ZW5lciBub3RpZmljYXRpb25zLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRQb2xsZXIge1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBpc1BvbGxpbmc6IGJvb2xlYW47XG4gIHByb3RlY3RlZCB3YWxsZXQ6IE1vbmVyb1dhbGxldFJwYztcbiAgcHJvdGVjdGVkIGxvb3BlcjogVGFza0xvb3BlcjtcbiAgcHJvdGVjdGVkIHByZXZMb2NrZWRUeHM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZMb2NrZWRUeHNNaW5IZWlnaHQgPSAwO1xuICBwcm90ZWN0ZWQgcHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9uczogYW55O1xuICBwcm90ZWN0ZWQgcHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnM6IGFueTtcbiAgcHJvdGVjdGVkIHRocmVhZFBvb2w6IGFueTtcbiAgcHJvdGVjdGVkIG51bVBvbGxpbmc6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZIZWlnaHQ6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZCYWxhbmNlczogYW55O1xuICBwcm90ZWN0ZWQgZ2VuZXJhdGlvbiA9IDA7XG4gIHByb3RlY3RlZCBzbmFwc2hvdEdlbmVyYXRpb24gPSAwO1xuICBcbiAgY29uc3RydWN0b3Iod2FsbGV0KSB7XG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIHRoaXMud2FsbGV0ID0gd2FsbGV0O1xuICAgIHRoaXMubG9vcGVyID0gbmV3IFRhc2tMb29wZXIoYXN5bmMgZnVuY3Rpb24oKSB7IGF3YWl0IHRoYXQucG9sbCgpOyB9KTtcbiAgICB0aGlzLnByZXZMb2NrZWRUeHMgPSBbXTtcbiAgICB0aGlzLnByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnMgPSBuZXcgU2V0KCk7IC8vIHR4IGhhc2hlcyBvZiBwcmV2aW91cyBub3RpZmljYXRpb25zXG4gICAgdGhpcy5wcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucyA9IG5ldyBTZXQoKTsgLy8gdHggaGFzaGVzIG9mIHByZXZpb3VzbHkgY29uZmlybWVkIGJ1dCBub3QgeWV0IHVubG9ja2VkIG5vdGlmaWNhdGlvbnNcbiAgICB0aGlzLnRocmVhZFBvb2wgPSBuZXcgVGhyZWFkUG9vbCgxKTsgLy8gc3luY2hyb25pemUgcG9sbHNcbiAgICB0aGlzLm51bVBvbGxpbmcgPSAwO1xuICB9XG4gIFxuICByZXNldCgpIHtcbiAgICB0aGlzLmdlbmVyYXRpb24rKzsgLy8gaW52YWxpZGF0ZSBpbi1mbGlnaHQgcG9sbHMgd2l0aG91dCB3YWl0aW5nIG9uIHRoZWlyIGNhbGxiYWNrc1xuICB9XG5cbiAgc2V0SXNQb2xsaW5nKGlzUG9sbGluZykge1xuICAgIHRoaXMuaXNQb2xsaW5nID0gaXNQb2xsaW5nO1xuICAgIGlmIChpc1BvbGxpbmcpIHRoaXMubG9vcGVyLnN0YXJ0KHRoaXMud2FsbGV0LmdldFN5bmNQZXJpb2RJbk1zKCkpO1xuICAgIGVsc2UgdGhpcy5sb29wZXIuc3RvcCgpO1xuICB9XG4gIFxuICBzZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpIHtcbiAgICB0aGlzLmxvb3Blci5zZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpO1xuICB9XG4gIFxuICBhc3luYyBwb2xsKCkge1xuXG4gICAgLy8gc2tpcCBpZiBuZXh0IHBvbGwgaXMgcXVldWVkXG4gICAgaWYgKHRoaXMubnVtUG9sbGluZyA+IDEpIHJldHVybjtcbiAgICB0aGlzLm51bVBvbGxpbmcrKztcbiAgICBcbiAgICAvLyBzeW5jaHJvbml6ZSBwb2xsc1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICByZXR1cm4gdGhpcy50aHJlYWRQb29sLnN1Ym1pdChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IGdlbmVyYXRpb24gPSB0aGF0LmdlbmVyYXRpb247XG4gICAgICB0cnkge1xuICAgICAgICBcbiAgICAgICAgLy8gc2tpcCBpZiB3YWxsZXQgaXMgY2xvc2VkXG4gICAgICAgIGlmIChhd2FpdCB0aGF0LndhbGxldC5pc0Nsb3NlZCgpIHx8IGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuXG4gICAgICAgIC8vIHJlc2V0IHNuYXBzaG90cyBvbmx5IGluc2lkZSB0aGUgc2VyaWFsaXplZCBwb2xsXG4gICAgICAgIGlmICh0aGF0LnNuYXBzaG90R2VuZXJhdGlvbiAhPT0gZ2VuZXJhdGlvbikge1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB0aGF0LnByZXZCYWxhbmNlcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB0aGF0LnByZXZMb2NrZWRUeHMgPSBbXTtcbiAgICAgICAgICB0aGF0LnByZXZMb2NrZWRUeHNNaW5IZWlnaHQgPSAwO1xuICAgICAgICAgIHRoYXQucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucy5jbGVhcigpO1xuICAgICAgICAgIHRoYXQucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMuY2xlYXIoKTtcbiAgICAgICAgICB0aGF0LnNuYXBzaG90R2VuZXJhdGlvbiA9IGdlbmVyYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHRha2UgaW5pdGlhbCBzbmFwc2hvdFxuICAgICAgICBpZiAodGhhdC5wcmV2QmFsYW5jZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEhlaWdodCgpO1xuICAgICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGF0LmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgICB0aGF0LnByZXZMb2NrZWRUeHMgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRUeHMobmV3IE1vbmVyb1R4UXVlcnkoKS5zZXRJc0xvY2tlZCh0cnVlKSk7XG4gICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICAgIHRoYXQucHJldkJhbGFuY2VzID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0QmFsYW5jZXMoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIGhlaWdodCBjaGFuZ2VzXG4gICAgICAgIGxldCBoZWlnaHQgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRIZWlnaHQoKTtcbiAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICBpZiAodGhhdC5wcmV2SGVpZ2h0ICE9PSBoZWlnaHQpIHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gdGhhdC5wcmV2SGVpZ2h0OyBpIDwgaGVpZ2h0OyBpKyspIHtcbiAgICAgICAgICAgIGF3YWl0IHRoYXQub25OZXdCbG9jayhpKTtcbiAgICAgICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGF0LmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhhdC5wcmV2SGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBnZXQgbG9ja2VkIHR4cyBmb3IgY29tcGFyaXNvbiB0byBwcmV2aW91c1xuICAgICAgICBsZXQgbWluSGVpZ2h0ID0gTWF0aC5tYXgoMCwgaGVpZ2h0IC0gNzApOyAvLyBvbmx5IG1vbml0b3IgcmVjZW50IHR4c1xuICAgICAgICBsZXQgbG9ja2VkVHhzID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0VHhzKG5ldyBNb25lcm9UeFF1ZXJ5KCkuc2V0SXNMb2NrZWQodHJ1ZSkuc2V0TWluSGVpZ2h0KG1pbkhlaWdodCkuc2V0SW5jbHVkZU91dHB1dHModHJ1ZSkpO1xuICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICAvLyBjb2xsZWN0IGhhc2hlcyBvZiB0eHMgbm8gbG9uZ2VyIGxvY2tlZFxuICAgICAgICBsZXQgbm9Mb25nZXJMb2NrZWRIYXNoZXMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgcHJldkxvY2tlZFR4IG9mIHRoYXQucHJldkxvY2tlZFR4cykge1xuICAgICAgICAgIGlmICh0aGF0LmdldFR4KGxvY2tlZFR4cywgcHJldkxvY2tlZFR4LmdldEhhc2goKSkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbm9Mb25nZXJMb2NrZWRIYXNoZXMucHVzaChwcmV2TG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHNhdmUgbG9ja2VkIHR4cyBmb3IgbmV4dCBjb21wYXJpc29uXG4gICAgICAgIGxldCBwcmV2TWluSGVpZ2h0ID0gdGhhdC5wcmV2TG9ja2VkVHhzTWluSGVpZ2h0O1xuICAgICAgICB0aGF0LnByZXZMb2NrZWRUeHMgPSBsb2NrZWRUeHM7XG4gICAgICAgIHRoYXQucHJldkxvY2tlZFR4c01pbkhlaWdodCA9IG1pbkhlaWdodDtcbiAgICAgICAgXG4gICAgICAgIC8vIHVzZSB0aGUgcHJldmlvdXMgc25hcHNob3QncyBib3VuZCBzbyB0cmFja2VkIHR4cyBkbyBub3QgYWdlIG91dCBiZXR3ZWVuIHBvbGxzXG4gICAgICAgIGxldCB1bmxvY2tlZFR4cyA9IG5vTG9uZ2VyTG9ja2VkSGFzaGVzLmxlbmd0aCA9PT0gMCA/IFtdIDogYXdhaXQgdGhhdC53YWxsZXQuZ2V0VHhzKG5ldyBNb25lcm9UeFF1ZXJ5KCkuc2V0SXNMb2NrZWQoZmFsc2UpLnNldE1pbkhlaWdodChwcmV2TWluSGVpZ2h0KS5zZXRIYXNoZXMobm9Mb25nZXJMb2NrZWRIYXNoZXMpLnNldEluY2x1ZGVPdXRwdXRzKHRydWUpKTtcbiAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIG5ldyB1bmNvbmZpcm1lZCBhbmQgY29uZmlybWVkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgbG9ja2VkVHggb2YgbG9ja2VkVHhzKSB7XG4gICAgICAgICAgbGV0IHNlYXJjaFNldCA9IGxvY2tlZFR4LmdldElzQ29uZmlybWVkKCkgPyB0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zIDogdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zO1xuICAgICAgICAgIGxldCB1bmFubm91bmNlZCA9ICFzZWFyY2hTZXQuaGFzKGxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgc2VhcmNoU2V0LmFkZChsb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIGlmICh1bmFubm91bmNlZCkgYXdhaXQgdGhhdC5ub3RpZnlPdXRwdXRzKGxvY2tlZFR4LCBnZW5lcmF0aW9uKTtcbiAgICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIG5ldyB1bmxvY2tlZCBvdXRwdXRzXG4gICAgICAgIGZvciAobGV0IHVubG9ja2VkVHggb2YgdW5sb2NrZWRUeHMpIHtcbiAgICAgICAgICBsZXQgbWlzc2VkQ29uZmlybSA9IHVubG9ja2VkVHguZ2V0SXNDb25maXJtZWQoKSAmJiAhdGhhdC5wcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucy5oYXModW5sb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIHRoYXQucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucy5kZWxldGUodW5sb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIHRoYXQucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMuZGVsZXRlKHVubG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICBpZiAobWlzc2VkQ29uZmlybSkgeyAvLyBhbm5vdW5jZSBtaXNzZWQgY29uZmlybSB0cmFuc2l0aW9uIGlmIHR4IHVubG9ja2VkIGJldHdlZW4gcG9sbHNcbiAgICAgICAgICAgIGxldCBjb25maXJtZWRUeCA9IHVubG9ja2VkVHguY29weSgpLnNldElzTG9ja2VkKHRydWUpO1xuICAgICAgICAgICAgY29uZmlybWVkVHguc2V0QmxvY2sodW5sb2NrZWRUeC5nZXRCbG9jaygpLmNvcHkoKS5zZXRUeHMoW2NvbmZpcm1lZFR4XSkpO1xuICAgICAgICAgICAgYXdhaXQgdGhhdC5ub3RpZnlPdXRwdXRzKGNvbmZpcm1lZFR4LCBnZW5lcmF0aW9uKTtcbiAgICAgICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGF0LmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgdGhhdC5ub3RpZnlPdXRwdXRzKHVubG9ja2VkVHgsIGdlbmVyYXRpb24pO1xuICAgICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGF0LmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgYmFsYW5jZSBjaGFuZ2VzXG4gICAgICAgIGF3YWl0IHRoYXQuY2hlY2tGb3JDaGFuZ2VkQmFsYW5jZXMoZ2VuZXJhdGlvbik7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBpZiAoZ2VuZXJhdGlvbiA9PT0gdGhhdC5nZW5lcmF0aW9uICYmIHRoYXQuaXNQb2xsaW5nKSBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGJhY2tncm91bmQgcG9sbCB3YWxsZXQgJ1wiICsgYXdhaXQgdGhhdC53YWxsZXQuZ2V0UGF0aCgpICsgXCInOiBcIiArIGVyci5tZXNzYWdlKTsgLy8gaWdub3JlIGVycm9ycyBmcm9tIHBvbGxzIHN0cmFnZ2xpbmcgYWZ0ZXIgdGhlIHdhbGxldCBpcyBjbG9zZWRcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgb25OZXdCbG9jayhoZWlnaHQpIHtcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU5ld0Jsb2NrKGhlaWdodCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBub3RpZnlPdXRwdXRzKHR4LCBnZW5lcmF0aW9uKSB7XG4gICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICBcbiAgICAvLyBub3RpZnkgc3BlbnQgb3V0cHV0cyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGFsbG93IHNjcmFwZSBvZiB0eCBpbnB1dHMgc28gcHJvdmlkaW5nIG9uZSBpbnB1dCB3aXRoIG91dGdvaW5nIGFtb3VudFxuICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0KHR4LmdldElucHV0cygpID09PSB1bmRlZmluZWQpO1xuICAgICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKVxuICAgICAgICAgIC5zZXRBbW91bnQodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFtb3VudCgpICsgdHguZ2V0RmVlKCkpXG4gICAgICAgICAgLnNldEFjY291bnRJbmRleCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QWNjb3VudEluZGV4KCkpXG4gICAgICAgICAgLnNldFN1YmFkZHJlc3NJbmRleCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDEgPyB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKVswXSA6IHVuZGVmaW5lZCkgLy8gaW5pdGlhbGl6ZSBpZiB0cmFuc2ZlciBzb3VyY2VkIGZyb20gc2luZ2xlIHN1YmFkZHJlc3NcbiAgICAgICAgICAuc2V0VHgodHgpO1xuICAgICAgdHguc2V0SW5wdXRzKFtvdXRwdXRdKTtcbiAgICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlT3V0cHV0U3BlbnQob3V0cHV0KTtcbiAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLmdlbmVyYXRpb24pIHJldHVybjtcbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IHJlY2VpdmVkIG91dHB1dHNcbiAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHguZ2V0T3V0cHV0cygpICE9PSB1bmRlZmluZWQgJiYgdHguZ2V0T3V0cHV0cygpLmxlbmd0aCA+IDApIHsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBvdXRwdXRzIG9ubHkgcmV0dXJuZWQgZm9yIGNvbmZpcm1lZCB0eHNcbiAgICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmdldE91dHB1dHMoKSkge1xuICAgICAgICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlT3V0cHV0UmVjZWl2ZWQob3V0cHV0KTtcbiAgICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogbW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgYWxsb3cgc2NyYXBlIG9mIHVuY29uZmlybWVkIHJlY2VpdmVkIG91dHB1dHMgc28gdXNpbmcgaW5jb21pbmcgdHJhbnNmZXIgdmFsdWVzXG4gICAgICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkpIHtcbiAgICAgICAgICBvdXRwdXRzLnB1c2gobmV3IE1vbmVyb091dHB1dFdhbGxldCgpXG4gICAgICAgICAgICAgIC5zZXRBY2NvdW50SW5kZXgodHJhbnNmZXIuZ2V0QWNjb3VudEluZGV4KCkpXG4gICAgICAgICAgICAgIC5zZXRTdWJhZGRyZXNzSW5kZXgodHJhbnNmZXIuZ2V0U3ViYWRkcmVzc0luZGV4KCkpXG4gICAgICAgICAgICAgIC5zZXRBbW91bnQodHJhbnNmZXIuZ2V0QW1vdW50KCkpXG4gICAgICAgICAgICAgIC5zZXRUeCh0eCkpO1xuICAgICAgICB9XG4gICAgICAgIHR4LnNldE91dHB1dHMob3V0cHV0cyk7XG4gICAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5nZXRPdXRwdXRzKCkpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFJlY2VpdmVkKG91dHB1dCk7XG4gICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgZ2V0VHgodHhzLCB0eEhhc2gpIHtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIGlmICh0eEhhc2ggPT09IHR4LmdldEhhc2goKSkgcmV0dXJuIHR4O1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjaGVja0ZvckNoYW5nZWRCYWxhbmNlcyhnZW5lcmF0aW9uKSB7XG4gICAgbGV0IGJhbGFuY2VzID0gYXdhaXQgdGhpcy53YWxsZXQuZ2V0QmFsYW5jZXMoKTtcbiAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5nZW5lcmF0aW9uKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGJhbGFuY2VzWzBdICE9PSB0aGlzLnByZXZCYWxhbmNlc1swXSB8fCBiYWxhbmNlc1sxXSAhPT0gdGhpcy5wcmV2QmFsYW5jZXNbMV0pIHtcbiAgICAgIHRoaXMucHJldkJhbGFuY2VzID0gYmFsYW5jZXM7XG4gICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZChiYWxhbmNlc1swXSwgYmFsYW5jZXNbMV0pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsU0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsYUFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsV0FB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