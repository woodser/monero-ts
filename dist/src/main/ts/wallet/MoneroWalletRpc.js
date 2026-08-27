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
        if (that.isPolling) console.error("Failed to background poll wallet '" + (await that.wallet.getPath()) + "': " + err.message); // ignore errors from polls straggling after the wallet is closed
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiTW9uZXJvV2FsbGV0UnBjIiwiTW9uZXJvV2FsbGV0IiwiREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwiYWRkcmVzc0NhY2hlIiwic3luY1BlcmlvZEluTXMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRTZXJ2ZXIiLCJvcGVuV2FsbGV0IiwicGF0aE9yQ29uZmlnIiwicGFzc3dvcmQiLCJNb25lcm9XYWxsZXRDb25maWciLCJwYXRoIiwiZ2V0UGF0aCIsImdldFJlZ3Rlc3QiLCJzZW5kSnNvblJlcXVlc3QiLCJmaWxlbmFtZSIsImdldFBhc3N3b3JkIiwiY2xlYXIiLCJnZXRDb25uZWN0aW9uTWFuYWdlciIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsImNyZWF0ZVdhbGxldCIsImNvbmZpZ05vcm1hbGl6ZWQiLCJnZXRTZWVkIiwiZ2V0UHJpbWFyeUFkZHJlc3MiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFByaXZhdGVTcGVuZEtleSIsImdldE5ldHdvcmtUeXBlIiwiZ2V0QWNjb3VudExvb2thaGVhZCIsImdldFN1YmFkZHJlc3NMb29rYWhlYWQiLCJzZXRQYXNzd29yZCIsInNldFNlcnZlciIsImdldENvbm5lY3Rpb24iLCJjcmVhdGVXYWxsZXRGcm9tU2VlZCIsImNyZWF0ZVdhbGxldEZyb21LZXlzIiwiY3JlYXRlV2FsbGV0UmFuZG9tIiwiZ2V0U2VlZE9mZnNldCIsImdldFJlc3RvcmVIZWlnaHQiLCJnZXRTYXZlQ3VycmVudCIsImdldExhbmd1YWdlIiwic2V0TGFuZ3VhZ2UiLCJERUZBVUxUX0xBTkdVQUdFIiwicGFyYW1zIiwibGFuZ3VhZ2UiLCJlcnIiLCJoYW5kbGVDcmVhdGVXYWxsZXRFcnJvciIsInNlZWQiLCJzZWVkX29mZnNldCIsImVuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWwiLCJnZXRJc011bHRpc2lnIiwicmVzdG9yZV9oZWlnaHQiLCJhdXRvc2F2ZV9jdXJyZW50Iiwic2V0UmVzdG9yZUhlaWdodCIsImFkZHJlc3MiLCJ2aWV3a2V5Iiwic3BlbmRrZXkiLCJuYW1lIiwibWVzc2FnZSIsInRvTG93ZXJDYXNlIiwiaW5jbHVkZXMiLCJNb25lcm9ScGNFcnJvciIsImdldENvZGUiLCJnZXRScGNNZXRob2QiLCJnZXRScGNQYXJhbXMiLCJpc1ZpZXdPbmx5Iiwia2V5X3R5cGUiLCJlIiwidXJpT3JDb25uZWN0aW9uIiwiaXNUcnVzdGVkIiwic3NsT3B0aW9ucyIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiU3NsT3B0aW9ucyIsImdldFVyaSIsInVzZXJuYW1lIiwiZ2V0VXNlcm5hbWUiLCJ0cnVzdGVkIiwic3NsX3N1cHBvcnQiLCJzc2xfcHJpdmF0ZV9rZXlfcGF0aCIsImdldFByaXZhdGVLZXlQYXRoIiwic3NsX2NlcnRpZmljYXRlX3BhdGgiLCJnZXRDZXJ0aWZpY2F0ZVBhdGgiLCJzc2xfY2FfZmlsZSIsImdldENlcnRpZmljYXRlQXV0aG9yaXR5RmlsZSIsInNzbF9hbGxvd2VkX2ZpbmdlcnByaW50cyIsImdldEFsbG93ZWRGaW5nZXJwcmludHMiLCJzc2xfYWxsb3dfYW55X2NlcnQiLCJnZXRBbGxvd0FueUNlcnQiLCJnZXRQcm94eVVyaSIsInN0YXJ0dXBQcm94eVVyaSIsInByb3h5IiwiaXNTYW1lUHJveHlVcmkiLCJkYWVtb25Db25uZWN0aW9uIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImdldEJhbGFuY2VzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJhc3NlcnQiLCJlcXVhbCIsImJhbGFuY2UiLCJCaWdJbnQiLCJ1bmxvY2tlZEJhbGFuY2UiLCJhY2NvdW50IiwiZ2V0QWNjb3VudHMiLCJnZXRCYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudF9pbmRleCIsImFkZHJlc3NfaW5kaWNlcyIsInJlc3AiLCJyZXN1bHQiLCJ1bmxvY2tlZF9iYWxhbmNlIiwicGVyX3N1YmFkZHJlc3MiLCJhZGRMaXN0ZW5lciIsInJlZnJlc2hMaXN0ZW5pbmciLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiY2hlY2tSZXNlcnZlUHJvb2YiLCJpbmRleE9mIiwiZ2V0VmVyc2lvbiIsIk1vbmVyb1ZlcnNpb24iLCJ2ZXJzaW9uIiwicmVsZWFzZSIsImdldFNlZWRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJsYW5ndWFnZXMiLCJnZXRBZGRyZXNzIiwic3ViYWRkcmVzc01hcCIsImdldFN1YmFkZHJlc3NlcyIsImdldEFkZHJlc3NJbmRleCIsInN1YmFkZHJlc3MiLCJNb25lcm9TdWJhZGRyZXNzIiwic2V0QWNjb3VudEluZGV4IiwiaW5kZXgiLCJtYWpvciIsInNldEluZGV4IiwibWlub3IiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInN0YW5kYXJkQWRkcmVzcyIsInBheW1lbnRJZCIsImludGVncmF0ZWRBZGRyZXNzU3RyIiwic3RhbmRhcmRfYWRkcmVzcyIsInBheW1lbnRfaWQiLCJpbnRlZ3JhdGVkX2FkZHJlc3MiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImludGVncmF0ZWRBZGRyZXNzIiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJzZXRTdGFuZGFyZEFkZHJlc3MiLCJzZXRQYXltZW50SWQiLCJzZXRJbnRlZ3JhdGVkQWRkcmVzcyIsImdldEhlaWdodCIsImhlaWdodCIsImdldERhZW1vbkhlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsInN5bmMiLCJsaXN0ZW5lck9yU3RhcnRIZWlnaHQiLCJzdGFydEhlaWdodCIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwic3RhcnRfaGVpZ2h0IiwicG9sbCIsIk1vbmVyb1N5bmNSZXN1bHQiLCJibG9ja3NfZmV0Y2hlZCIsInJlY2VpdmVkX21vbmV5Iiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluU2Vjb25kcyIsIk1hdGgiLCJyb3VuZCIsImVuYWJsZSIsInBlcmlvZCIsIndhbGxldFBvbGxlciIsInNldFBlcmlvZEluTXMiLCJnZXRTeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwibGVuZ3RoIiwidHhpZHMiLCJyZXNjYW5TcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwic2tpcEJhbGFuY2VzIiwiYWNjb3VudHMiLCJycGNBY2NvdW50Iiwic3ViYWRkcmVzc19hY2NvdW50cyIsImNvbnZlcnRScGNBY2NvdW50Iiwic2V0U3ViYWRkcmVzc2VzIiwiZ2V0SW5kZXgiLCJwdXNoIiwic2V0QmFsYW5jZSIsInNldFVubG9ja2VkQmFsYW5jZSIsInNldE51bVVuc3BlbnRPdXRwdXRzIiwic2V0TnVtQmxvY2tzVG9VbmxvY2siLCJhbGxfYWNjb3VudHMiLCJycGNTdWJhZGRyZXNzIiwiY29udmVydFJwY1N1YmFkZHJlc3MiLCJnZXRBY2NvdW50SW5kZXgiLCJ0Z3RTdWJhZGRyZXNzIiwiZ2V0TnVtVW5zcGVudE91dHB1dHMiLCJnZXRBY2NvdW50IiwiRXJyb3IiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJNb25lcm9BY2NvdW50IiwicHJpbWFyeUFkZHJlc3MiLCJzdWJhZGRyZXNzSW5kaWNlcyIsImFkZHJlc3NfaW5kZXgiLCJsaXN0aWZ5Iiwic3ViYWRkcmVzc2VzIiwiYWRkcmVzc2VzIiwiZ2V0TnVtQmxvY2tzVG9VbmxvY2siLCJnZXRTdWJhZGRyZXNzIiwiY3JlYXRlU3ViYWRkcmVzcyIsInNldEFkZHJlc3MiLCJzZXRMYWJlbCIsInNldElzVXNlZCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwiZ2V0VHhzQXV4IiwibWF4QXR0ZW1wdHMiLCJxdWVyeU5vcm1hbGl6ZWQiLCJub3JtYWxpemVUeFF1ZXJ5IiwidHJhbnNmZXJRdWVyeSIsImdldFRyYW5zZmVyUXVlcnkiLCJpbnB1dFF1ZXJ5IiwiZ2V0SW5wdXRRdWVyeSIsIm91dHB1dFF1ZXJ5IiwiZ2V0T3V0cHV0UXVlcnkiLCJzZXRUcmFuc2ZlclF1ZXJ5Iiwic2V0SW5wdXRRdWVyeSIsInNldE91dHB1dFF1ZXJ5IiwidHJhbnNmZXJzIiwiZ2V0VHJhbnNmZXJzQXV4IiwiTW9uZXJvVHJhbnNmZXJRdWVyeSIsInNldFR4UXVlcnkiLCJkZWNvbnRleHR1YWxpemUiLCJjb3B5IiwidHhzIiwidHhzU2V0IiwiU2V0IiwidHJhbnNmZXIiLCJnZXRUeCIsImFkZCIsInR4TWFwIiwiYmxvY2tNYXAiLCJ0eCIsIm1lcmdlVHgiLCJnZXRJbmNsdWRlT3V0cHV0cyIsIm91dHB1dFF1ZXJ5QXV4IiwiTW9uZXJvT3V0cHV0UXVlcnkiLCJvdXRwdXRzIiwiZ2V0T3V0cHV0c0F1eCIsIm91dHB1dFR4cyIsIm91dHB1dCIsInR4c1F1ZXJpZWQiLCJtZWV0c0NyaXRlcmlhIiwiZ2V0QmxvY2siLCJzcGxpY2UiLCJnZXRJc0NvbmZpcm1lZCIsImNvbnNvbGUiLCJlcnJvciIsImdldEhhc2hlcyIsInR4c0J5SWQiLCJNYXAiLCJnZXRIYXNoIiwib3JkZXJlZFR4cyIsImhhc2giLCJnZXRUcmFuc2ZlcnMiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiaXNDb250ZXh0dWFsIiwiZ2V0VHhRdWVyeSIsImZpbHRlclRyYW5zZmVycyIsImdldE91dHB1dHMiLCJub3JtYWxpemVPdXRwdXRRdWVyeSIsImZpbHRlck91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwib3V0cHV0c19kYXRhX2hleCIsImltcG9ydE91dHB1dHMiLCJvdXRwdXRzSGV4IiwibnVtX2ltcG9ydGVkIiwiZXhwb3J0S2V5SW1hZ2VzIiwicnBjRXhwb3J0S2V5SW1hZ2VzIiwiaW1wb3J0S2V5SW1hZ2VzIiwia2V5SW1hZ2VzIiwib2Zmc2V0IiwicnBjS2V5SW1hZ2VzIiwibWFwIiwia2V5SW1hZ2UiLCJrZXlfaW1hZ2UiLCJnZXRIZXgiLCJzaWduYXR1cmUiLCJnZXRTaWduYXR1cmUiLCJzaWduZWRfa2V5X2ltYWdlcyIsImltcG9ydFJlc3VsdCIsIk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0Iiwic2V0SGVpZ2h0Iiwic2V0U3BlbnRBbW91bnQiLCJzcGVudCIsInNldFVuc3BlbnRBbW91bnQiLCJ1bnNwZW50IiwiZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQiLCJnZXRLZXlJbWFnZXMiLCJmcmVlemVPdXRwdXQiLCJ0aGF3T3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJmcm96ZW4iLCJnZXREZWZhdWx0RmVlUHJpb3JpdHkiLCJwcmlvcml0eSIsImNyZWF0ZVR4cyIsIm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyIsImdldENhblNwbGl0Iiwic2V0Q2FuU3BsaXQiLCJnZXRSZWxheSIsImlzTXVsdGlzaWciLCJnZXRTdWJhZGRyZXNzSW5kaWNlcyIsInNsaWNlIiwiZGVzdGluYXRpb25zIiwiZGVzdGluYXRpb24iLCJnZXREZXN0aW5hdGlvbnMiLCJnZXRBbW91bnQiLCJhbW91bnQiLCJ0b1N0cmluZyIsImdldFN1YnRyYWN0RmVlRnJvbSIsInN1YnRyYWN0X2ZlZV9mcm9tX291dHB1dHMiLCJzdWJhZGRyX2luZGljZXMiLCJnZXRQYXltZW50SWQiLCJkb19ub3RfcmVsYXkiLCJnZXRQcmlvcml0eSIsImdldF90eF9oZXgiLCJnZXRfdHhfbWV0YWRhdGEiLCJnZXRfdHhfa2V5cyIsImdldF90eF9rZXkiLCJudW1UeHMiLCJmZWVfbGlzdCIsImZlZSIsImNvcHlEZXN0aW5hdGlvbnMiLCJpIiwiTW9uZXJvVHhXYWxsZXQiLCJpbml0U2VudFR4V2FsbGV0IiwiZ2V0T3V0Z29pbmdUcmFuc2ZlciIsInNldFN1YmFkZHJlc3NJbmRpY2VzIiwiY29udmVydFJwY1NlbnRUeHNUb1R4U2V0IiwiY29udmVydFJwY1R4VG9UeFNldCIsInN3ZWVwT3V0cHV0Iiwibm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWciLCJnZXRLZXlJbWFnZSIsInNldEFtb3VudCIsInN3ZWVwVW5sb2NrZWQiLCJub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnIiwiaW5kaWNlcyIsImtleXMiLCJzZXRTd2VlcEVhY2hTdWJhZGRyZXNzIiwiZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcyIsInJwY1N3ZWVwQWNjb3VudCIsInN3ZWVwRHVzdCIsInJlbGF5IiwidHhTZXQiLCJzZXRJc1JlbGF5ZWQiLCJzZXRJblR4UG9vbCIsImdldElzUmVsYXllZCIsInJlbGF5VHhzIiwidHhzT3JNZXRhZGF0YXMiLCJBcnJheSIsImlzQXJyYXkiLCJ0eE9yTWV0YWRhdGEiLCJtZXRhZGF0YSIsImdldE1ldGFkYXRhIiwiaGV4IiwidHhfaGFzaCIsImRlc2NyaWJlVHhTZXQiLCJ1bnNpZ25lZF90eHNldCIsImdldFVuc2lnbmVkVHhIZXgiLCJtdWx0aXNpZ190eHNldCIsImdldE11bHRpc2lnVHhIZXgiLCJjb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlciIsInNpZ25UeHMiLCJ1bnNpZ25lZFR4SGV4IiwiZXhwb3J0X3JhdyIsInN1Ym1pdFR4cyIsInNpZ25lZFR4SGV4IiwidHhfZGF0YV9oZXgiLCJ0eF9oYXNoX2xpc3QiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIlNJR05fV0lUSF9TUEVORF9LRVkiLCJkYXRhIiwic2lnbmF0dXJlX3R5cGUiLCJ2ZXJpZnlNZXNzYWdlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCIsImdvb2QiLCJpc0dvb2QiLCJpc09sZCIsIm9sZCIsIlNJR05fV0lUSF9WSUVXX0tFWSIsImdldFR4S2V5IiwidHhIYXNoIiwidHhpZCIsInR4X2tleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImNoZWNrIiwiTW9uZXJvQ2hlY2tUeCIsInNldElzR29vZCIsInNldE51bUNvbmZpcm1hdGlvbnMiLCJjb25maXJtYXRpb25zIiwiaW5fcG9vbCIsInNldFJlY2VpdmVkQW1vdW50IiwicmVjZWl2ZWQiLCJnZXRUeFByb29mIiwiY2hlY2tUeFByb29mIiwiZ2V0U3BlbmRQcm9vZiIsImNoZWNrU3BlbmRQcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJNb25lcm9DaGVja1Jlc2VydmUiLCJzZXRVbmNvbmZpcm1lZFNwZW50QW1vdW50Iiwic2V0VG90YWxBbW91bnQiLCJ0b3RhbCIsImdldFR4Tm90ZXMiLCJub3RlcyIsInNldFR4Tm90ZXMiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJlbnRyaWVzIiwicnBjRW50cnkiLCJNb25lcm9BZGRyZXNzQm9va0VudHJ5Iiwic2V0RGVzY3JpcHRpb24iLCJkZXNjcmlwdGlvbiIsImFkZEFkZHJlc3NCb29rRW50cnkiLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsInNldF9hZGRyZXNzIiwic2V0X2Rlc2NyaXB0aW9uIiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsInRhZ3MiLCJhY2NvdW50X3RhZ3MiLCJycGNBY2NvdW50VGFnIiwiTW9uZXJvQWNjb3VudFRhZyIsInNldEFjY291bnRUYWdMYWJlbCIsImdldFBheW1lbnRVcmkiLCJyZWNpcGllbnRfbmFtZSIsImdldFJlY2lwaWVudE5hbWUiLCJ0eF9kZXNjcmlwdGlvbiIsImdldE5vdGUiLCJ1cmkiLCJwYXJzZVBheW1lbnRVcmkiLCJNb25lcm9UeENvbmZpZyIsInNldFJlY2lwaWVudE5hbWUiLCJzZXROb3RlIiwiZ2V0QXR0cmlidXRlIiwidmFsdWUiLCJzZXRBdHRyaWJ1dGUiLCJ2YWwiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsInRocmVhZHNfY291bnQiLCJkb19iYWNrZ3JvdW5kX21pbmluZyIsImlnbm9yZV9iYXR0ZXJ5Iiwic3RvcE1pbmluZyIsImlzTXVsdGlzaWdJbXBvcnROZWVkZWQiLCJtdWx0aXNpZ19pbXBvcnRfbmVlZGVkIiwiZ2V0TXVsdGlzaWdJbmZvIiwiaW5mbyIsIk1vbmVyb011bHRpc2lnSW5mbyIsInNldElzTXVsdGlzaWciLCJtdWx0aXNpZyIsInNldElzUmVhZHkiLCJyZWFkeSIsInNldFRocmVzaG9sZCIsInRocmVzaG9sZCIsInNldE51bVBhcnRpY2lwYW50cyIsInByZXBhcmVNdWx0aXNpZyIsIm11bHRpc2lnX2luZm8iLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJtc1Jlc3VsdCIsIk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsInNldE11bHRpc2lnSGV4IiwiZ2V0TXVsdGlzaWdIZXgiLCJleHBvcnRNdWx0aXNpZ0hleCIsImltcG9ydE11bHRpc2lnSGV4IiwicmVmcmVzaEFmdGVySW1wb3J0IiwicmVmcmVzaF9hZnRlcl9pbXBvcnQiLCJuX291dHB1dHMiLCJzaWduTXVsdGlzaWdUeEhleCIsIm11bHRpc2lnVHhIZXgiLCJzaWduUmVzdWx0IiwiTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0Iiwic2V0U2lnbmVkTXVsdGlzaWdUeEhleCIsInNldFR4SGFzaGVzIiwic3VibWl0TXVsdGlzaWdUeEhleCIsInNpZ25lZE11bHRpc2lnVHhIZXgiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJvbGRfcGFzc3dvcmQiLCJuZXdfcGFzc3dvcmQiLCJzYXZlIiwiY2xvc2UiLCJpc0Nsb3NlZCIsInN0b3AiLCJnZXRJbmNvbWluZ1RyYW5zZmVycyIsImdldE91dGdvaW5nVHJhbnNmZXJzIiwiY3JlYXRlVHgiLCJyZWxheVR4IiwiZ2V0VHhOb3RlIiwic2V0VHhOb3RlIiwibm90ZSIsImNvbm5lY3RUb1dhbGxldFJwYyIsInVyaU9yQ29uZmlnIiwibm9ybWFsaXplQ29uZmlnIiwiY21kIiwic3RhcnRXYWxsZXRScGNQcm9jZXNzIiwiY2hpbGRfcHJvY2VzcyIsIlByb21pc2UiLCJyZXNvbHZlIiwidGhlbiIsImNoaWxkUHJvY2VzcyIsInNwYXduIiwiZW52IiwiTEFORyIsInN0ZG91dCIsInNldEVuY29kaW5nIiwic3RkZXJyIiwidGhhdCIsInJlamVjdCIsIm9uIiwibGluZSIsIkxpYnJhcnlVdGlscyIsImxvZyIsInVyaUxpbmVDb250YWlucyIsInVyaUxpbmVDb250YWluc0lkeCIsImhvc3QiLCJzdWJzdHJpbmciLCJsYXN0SW5kZXhPZiIsInVuZm9ybWF0dGVkTGluZSIsInJlcGxhY2UiLCJ0cmltIiwicG9ydCIsInNzbElkeCIsInNzbEVuYWJsZWQiLCJ1c2VyUGFzc0lkeCIsInVzZXJQYXNzIiwiem1xVXJpSWR4Iiwiem1xVXJpIiwicHJveHlVcmlJZHgiLCJwcm94eVVyaSIsInJlamVjdFVuYXV0aG9yaXplZCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsIndhbGxldCIsImlzUmVzb2x2ZWQiLCJnZXRMb2dMZXZlbCIsImNvZGUiLCJvcmlnaW4iLCJnZXRBY2NvdW50SW5kaWNlcyIsInR4UXVlcnkiLCJjYW5CZUNvbmZpcm1lZCIsImdldEluVHhQb29sIiwiZ2V0SXNGYWlsZWQiLCJjYW5CZUluVHhQb29sIiwiZ2V0TWF4SGVpZ2h0IiwiZ2V0SXNMb2NrZWQiLCJjYW5CZUluY29taW5nIiwiZ2V0SXNJbmNvbWluZyIsImdldElzT3V0Z29pbmciLCJnZXRIYXNEZXN0aW5hdGlvbnMiLCJjYW5CZU91dGdvaW5nIiwiaW4iLCJvdXQiLCJwb29sIiwicGVuZGluZyIsImZhaWxlZCIsImdldE1pbkhlaWdodCIsIm1pbl9oZWlnaHQiLCJtYXhfaGVpZ2h0IiwiZmlsdGVyX2J5X2hlaWdodCIsImdldFN1YmFkZHJlc3NJbmRleCIsInNpemUiLCJmcm9tIiwicnBjVHgiLCJjb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIiLCJnZXRPdXRnb2luZ0Ftb3VudCIsIm91dGdvaW5nVHJhbnNmZXIiLCJ0cmFuc2ZlclRvdGFsIiwidmFsdWVzIiwic29ydCIsImNvbXBhcmVUeHNCeUhlaWdodCIsInNldElzSW5jb21pbmciLCJzZXRJc091dGdvaW5nIiwiY29tcGFyZUluY29taW5nVHJhbnNmZXJzIiwidHJhbnNmZXJfdHlwZSIsImdldElzU3BlbnQiLCJ2ZXJib3NlIiwicnBjT3V0cHV0IiwiY29udmVydFJwY1R4V2l0aE91dHB1dCIsImNvbXBhcmVPdXRwdXRzIiwicnBjSW1hZ2UiLCJNb25lcm9LZXlJbWFnZSIsIk1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0Iiwic2V0T2Zmc2V0Iiwic2V0S2V5SW1hZ2VzIiwiYmVsb3dfYW1vdW50IiwiZ2V0QmVsb3dBbW91bnQiLCJzZXRJc0xvY2tlZCIsInNldElzQ29uZmlybWVkIiwic2V0UmVsYXkiLCJzZXRJc01pbmVyVHgiLCJzZXRJc0ZhaWxlZCIsIk1vbmVyb0Rlc3RpbmF0aW9uIiwic2V0RGVzdGluYXRpb25zIiwic2V0T3V0Z29pbmdUcmFuc2ZlciIsImdldFVubG9ja1RpbWUiLCJzZXRVbmxvY2tUaW1lIiwiZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJzZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsIkRhdGUiLCJnZXRUaW1lIiwiZ2V0SXNEb3VibGVTcGVuZFNlZW4iLCJzZXRJc0RvdWJsZVNwZW5kU2VlbiIsImxpc3RlbmVycyIsIldhbGxldFBvbGxlciIsInNldElzUG9sbGluZyIsImlzUG9sbGluZyIsInNlcnZlciIsInByb3h5VG9Xb3JrZXIiLCJzZXRQcmltYXJ5QWRkcmVzcyIsInNldFRhZyIsImdldFRhZyIsInNldFJpbmdTaXplIiwiTW9uZXJvVXRpbHMiLCJSSU5HX1NJWkUiLCJNb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwic2V0VHgiLCJkZXN0Q29waWVzIiwiZGVzdCIsImNvbnZlcnRScGNUeFNldCIsInJwY01hcCIsIk1vbmVyb1R4U2V0Iiwic2V0TXVsdGlzaWdUeEhleCIsInNldFVuc2lnbmVkVHhIZXgiLCJzZXRTaWduZWRUeEhleCIsInNpZ25lZF90eHNldCIsImdldFNpZ25lZFR4SGV4IiwicnBjVHhzIiwic2V0VHhzIiwic2V0VHhTZXQiLCJzZXRIYXNoIiwic2V0S2V5Iiwic2V0RnVsbEhleCIsInNldE1ldGFkYXRhIiwic2V0RmVlIiwic2V0V2VpZ2h0IiwiaW5wdXRLZXlJbWFnZXNMaXN0IiwiYXNzZXJ0VHJ1ZSIsImdldElucHV0cyIsInNldElucHV0cyIsImlucHV0S2V5SW1hZ2UiLCJNb25lcm9PdXRwdXRXYWxsZXQiLCJzZXRLZXlJbWFnZSIsInNldEhleCIsImFtb3VudHNCeURlc3RMaXN0IiwiZGVzdGluYXRpb25JZHgiLCJ0eElkeCIsImFtb3VudHNCeURlc3QiLCJpc091dGdvaW5nIiwidHlwZSIsImRlY29kZVJwY1R5cGUiLCJoZWFkZXIiLCJzZXRTaXplIiwiTW9uZXJvQmxvY2tIZWFkZXIiLCJzZXRUaW1lc3RhbXAiLCJNb25lcm9JbmNvbWluZ1RyYW5zZmVyIiwic2V0TnVtU3VnZ2VzdGVkQ29uZmlybWF0aW9ucyIsIkRFRkFVTFRfUEFZTUVOVF9JRCIsInJwY0luZGljZXMiLCJycGNJbmRleCIsInNldFN1YmFkZHJlc3NJbmRleCIsInJwY0Rlc3RpbmF0aW9uIiwiZGVzdGluYXRpb25LZXkiLCJycGNTb3VyY2UiLCJpbnB1dCIsImdsb2JhbF9pbmRleCIsInB1YmtleSIsInNldFN0ZWFsdGhQdWJsaWNLZXkiLCJzZXRJbnB1dFN1bSIsInNldE91dHB1dFN1bSIsInNldENoYW5nZUFkZHJlc3MiLCJzZXRDaGFuZ2VBbW91bnQiLCJzZXROdW1EdW1teU91dHB1dHMiLCJzZXRFeHRyYUhleCIsImlucHV0S2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsImFtb3VudHMiLCJzZXRCbG9jayIsIk1vbmVyb0Jsb2NrIiwibWVyZ2UiLCJzZXRJbmNvbWluZ1RyYW5zZmVycyIsInNldElzU3BlbnQiLCJzZXRJc0Zyb3plbiIsInNldE91dHB1dHMiLCJycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0IiwicnBjVHlwZSIsImFUeCIsImFCbG9jayIsInR4MSIsInR4MiIsImRpZmYiLCJ0MSIsInQyIiwibzEiLCJvMiIsImhlaWdodENvbXBhcmlzb24iLCJjb21wYXJlIiwibG9jYWxlQ29tcGFyZSIsImV4cG9ydHMiLCJsb29wZXIiLCJUYXNrTG9vcGVyIiwicHJldkxvY2tlZFR4cyIsInByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnMiLCJwcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucyIsInRocmVhZFBvb2wiLCJUaHJlYWRQb29sIiwibnVtUG9sbGluZyIsInN0YXJ0IiwicGVyaW9kSW5NcyIsInN1Ym1pdCIsInByZXZCYWxhbmNlcyIsInByZXZIZWlnaHQiLCJNb25lcm9UeFF1ZXJ5Iiwib25OZXdCbG9jayIsIm1pbkhlaWdodCIsIm1heCIsImxvY2tlZFR4cyIsInNldE1pbkhlaWdodCIsInNldEluY2x1ZGVPdXRwdXRzIiwibm9Mb25nZXJMb2NrZWRIYXNoZXMiLCJwcmV2TG9ja2VkVHgiLCJ1bmxvY2tlZFR4cyIsInNldEhhc2hlcyIsImxvY2tlZFR4Iiwic2VhcmNoU2V0IiwidW5hbm5vdW5jZWQiLCJub3RpZnlPdXRwdXRzIiwidW5sb2NrZWRUeCIsImRlbGV0ZSIsImNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzIiwiYW5ub3VuY2VOZXdCbG9jayIsImdldEZlZSIsImFubm91bmNlT3V0cHV0U3BlbnQiLCJhbm5vdW5jZU91dHB1dFJlY2VpdmVkIiwiYmFsYW5jZXMiLCJhbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRScGMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4uL2NvbW1vbi9UYXNrTG9vcGVyXCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50XCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudFRhZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50VGFnXCI7XG5pbXBvcnQgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BZGRyZXNzQm9va0VudHJ5XCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrSGVhZGVyIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tIZWFkZXJcIjtcbmltcG9ydCBNb25lcm9DaGVja1Jlc2VydmUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tSZXNlcnZlXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvRGVzdGluYXRpb24gZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGVzdGluYXRpb25cIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbmNvbWluZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnU2lnblJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb091dGdvaW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0Z29pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvUnBjRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNFcnJvclwiO1xuaW1wb3J0IE1vbmVyb1N1YmFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHggZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9UeFwiO1xuaW1wb3J0IE1vbmVyb1R4Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvVHhQcmlvcml0eSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFByaW9yaXR5XCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuLi9jb21tb24vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdFwiO1xuaW1wb3J0IFRocmVhZFBvb2wgZnJvbSBcIi4uL2NvbW1vbi9UaHJlYWRQb29sXCI7XG5pbXBvcnQgU3NsT3B0aW9ucyBmcm9tIFwiLi4vY29tbW9uL1NzbE9wdGlvbnNcIjtcbmltcG9ydCB7IENoaWxkUHJvY2VzcyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5cbi8qKlxuICogQ29weXJpZ2h0IChjKSB3b29kc2VyXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9XYWxsZXQgYXMgYSBjbGllbnQgb2YgbW9uZXJvLXdhbGxldC1ycGMuXG4gKiBcbiAqIEBpbXBsZW1lbnRzIHtNb25lcm9XYWxsZXR9XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1dhbGxldFJwYyBleHRlbmRzIE1vbmVyb1dhbGxldCB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgPSAyMDAwMDsgLy8gZGVmYXVsdCBwZXJpb2QgYmV0d2VlbiBzeW5jcyBpbiBtcyAoZGVmaW5lZCBieSBERUZBVUxUX0FVVE9fUkVGUkVTSF9QRVJJT0QgaW4gd2FsbGV0X3JwY19zZXJ2ZXIuY3BwKVxuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz47XG4gIHByb3RlY3RlZCBhZGRyZXNzQ2FjaGU6IGFueTtcbiAgcHJvdGVjdGVkIHN5bmNQZXJpb2RJbk1zOiBudW1iZXI7XG4gIHByb3RlY3RlZCBsaXN0ZW5lcnM6IE1vbmVyb1dhbGxldExpc3RlbmVyW107XG4gIHByb3RlY3RlZCBwcm9jZXNzOiBhbnk7XG4gIHByb3RlY3RlZCBwYXRoOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBkYWVtb25Db25uZWN0aW9uOiBNb25lcm9ScGNDb25uZWN0aW9uO1xuICBwcm90ZWN0ZWQgd2FsbGV0UG9sbGVyOiBXYWxsZXRQb2xsZXI7XG4gIHByb3RlY3RlZCBzdGFydHVwUHJveHlVcmk6IHN0cmluZztcbiAgXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTsgLy8gYXZvaWQgdW5lY2Vzc2FyeSByZXF1ZXN0cyBmb3IgYWRkcmVzc2VzXG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IE1vbmVyb1dhbGxldFJwYy5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUlBDIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaW50ZXJuYWwgcHJvY2VzcyBydW5uaW5nIG1vbmVyby13YWxsZXQtcnBjLlxuICAgKiBcbiAgICogQHJldHVybiB7Q2hpbGRQcm9jZXNzfSB0aGUgcHJvY2VzcyBydW5uaW5nIG1vbmVyby13YWxsZXQtcnBjLCB1bmRlZmluZWQgaWYgbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1xuICAgKi9cbiAgZ2V0UHJvY2VzcygpOiBDaGlsZFByb2Nlc3Mge1xuICAgIHJldHVybiB0aGlzLnByb2Nlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9wIHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMsIGlmIGFwcGxpY2FibGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZvcmNlIHNwZWNpZmllcyBpZiB0aGUgcHJvY2VzcyBzaG91bGQgYmUgZGVzdHJveWVkIGZvcmNpYmx5IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD59IHRoZSBleGl0IGNvZGUgZnJvbSBzdG9wcGluZyB0aGUgcHJvY2Vzc1xuICAgKi9cbiAgYXN5bmMgc3RvcFByb2Nlc3MoZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPiAge1xuICAgIGlmICh0aGlzLnByb2Nlc3MgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0UnBjIGluc3RhbmNlIG5vdCBjcmVhdGVkIGZyb20gbmV3IHByb2Nlc3NcIik7XG4gICAgbGV0IGxpc3RlbmVyc0NvcHkgPSBHZW5VdGlscy5jb3B5QXJyYXkodGhpcy5nZXRMaXN0ZW5lcnMoKSk7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgbGlzdGVuZXJzQ29weSkgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgcmV0dXJuIEdlblV0aWxzLmtpbGxQcm9jZXNzKHRoaXMucHJvY2VzcywgZm9yY2UgPyBcIlNJR0tJTExcIiA6IHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIFJQQyBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZH0gdGhlIHdhbGxldCdzIHJwYyBjb25uZWN0aW9uXG4gICAqL1xuICBnZXRScGNDb25uZWN0aW9uKCk6IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPk9wZW4gYW4gZXhpc3Rpbmcgd2FsbGV0IG9uIHRoZSBtb25lcm8td2FsbGV0LXJwYyBzZXJ2ZXIuPC9wPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZTo8cD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiBsZXQgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldFJwYyhcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODRcIiwgXCJycGNfdXNlclwiLCBcImFiYzEyM1wiKTs8YnI+XG4gICAqIGF3YWl0IHdhbGxldC5vcGVuV2FsbGV0KFwibXl3YWxsZXQxXCIsIFwic3VwZXJzZWNyZXRwYXNzd29yZFwiKTs8YnI+XG4gICAqIDxicj5cbiAgICogYXdhaXQgd2FsbGV0Lm9wZW5XYWxsZXQoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwibXl3YWxsZXQyXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwic3VwZXJzZWNyZXRwYXNzd29yZFwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHNlcnZlcjogXCJodHRwOi8vbG9jYWhvc3Q6MzgwODFcIiwgLy8gb3Igb2JqZWN0IHdpdGggdXJpLCB1c2VybmFtZSwgcGFzc3dvcmQsIGV0YyA8YnI+XG4gICAqICZuYnNwOyZuYnNwOyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlPGJyPlxuICAgKiB9KTs8YnI+XG4gICAqIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfE1vbmVyb1dhbGxldENvbmZpZ30gcGF0aE9yQ29uZmlnICAtIHRoZSB3YWxsZXQncyBuYW1lIG9yIGNvbmZpZ3VyYXRpb24gdG8gb3BlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aE9yQ29uZmlnLnBhdGggLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoT3JDb25maWcucGFzc3dvcmQgLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ3xQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fSBwYXRoT3JDb25maWcuc2VydmVyIC0gdXJpIG9yIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb2YgYSBkYWVtb24gdG8gdXNlIChvcHRpb25hbCwgbW9uZXJvLXdhbGxldC1ycGMgdXN1YWxseSBzdGFydGVkIHdpdGggZGFlbW9uIGNvbmZpZylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtwYXNzd29yZF0gdGhlIHdhbGxldCdzIHBhc3N3b3JkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvV2FsbGV0UnBjPn0gdGhpcyB3YWxsZXQgY2xpZW50XG4gICAqL1xuICBhc3luYyBvcGVuV2FsbGV0KHBhdGhPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+LCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh0eXBlb2YgcGF0aE9yQ29uZmlnID09PSBcInN0cmluZ1wiID8ge3BhdGg6IHBhdGhPckNvbmZpZywgcGFzc3dvcmQ6IHBhc3N3b3JkID8gcGFzc3dvcmQgOiBcIlwifSA6IHBhdGhPckNvbmZpZyk7XG4gICAgLy8gVE9ETzogZW5zdXJlIG90aGVyIGZpZWxkcyB1bmluaXRpYWxpemVkP1xuICAgIFxuICAgIC8vIG9wZW4gd2FsbGV0IG9uIHJwYyBzZXJ2ZXJcbiAgICBpZiAoIWNvbmZpZy5nZXRQYXRoKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBuYW1lIG9mIHdhbGxldCB0byBvcGVuXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVndGVzdCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHJlZ3Rlc3QgbW9kZSB3aGVuIG9wZW5pbmcgUlBDIHdhbGxldFwiKVxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm9wZW5fd2FsbGV0XCIsIHtmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSwgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpfSk7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG5cbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyIG9yIHNlcnZlclxuICAgIGlmIChjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSAhPSBudWxsKSB7XG4gICAgICBpZiAoY29uZmlnLmdldFNlcnZlcigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIG9wZW5lZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBhd2FpdCB0aGlzLnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICB9IGVsc2UgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSAhPSBudWxsKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldERhZW1vbkNvbm5lY3Rpb24oY29uZmlnLmdldFNlcnZlcigpKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5DcmVhdGUgYW5kIG9wZW4gYSB3YWxsZXQgb24gdGhlIG1vbmVyby13YWxsZXQtcnBjIHNlcnZlci48cD5cbiAgICogXG4gICAqIDxwPkV4YW1wbGU6PHA+XG4gICAqIFxuICAgKiA8Y29kZT5cbiAgICogJnNvbDsmc29sOyBjb25zdHJ1Y3QgY2xpZW50IHRvIG1vbmVyby13YWxsZXQtcnBjPGJyPlxuICAgKiBsZXQgd2FsbGV0UnBjID0gbmV3IE1vbmVyb1dhbGxldFJwYyhcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODRcIiwgXCJycGNfdXNlclwiLCBcImFiYzEyM1wiKTs8YnI+PGJyPlxuICAgKiBcbiAgICogJnNvbDsmc29sOyBjcmVhdGUgYW5kIG9wZW4gd2FsbGV0IG9uIG1vbmVyby13YWxsZXQtcnBjPGJyPlxuICAgKiBhd2FpdCB3YWxsZXRScGMuY3JlYXRlV2FsbGV0KHs8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXRoOiBcIm15d2FsbGV0XCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiYWJjMTIzXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VlZDogXCJjb2V4aXN0IGlnbG9vIHBhbXBobGV0IGxhZ29vbi4uLlwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlc3RvcmVIZWlnaHQ6IDE1NDMyMThsPGJyPlxuICAgKiB9KTtcbiAgICogIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+fSBjb25maWcgLSBNb25lcm9XYWxsZXRDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF0aF0gLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhc3N3b3JkXSAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRdIC0gc2VlZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIHJhbmRvbSB3YWxsZXQgY3JlYXRlZCBpZiBuZWl0aGVyIHNlZWQgbm9yIGtleXMgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRPZmZzZXRdIC0gdGhlIG9mZnNldCB1c2VkIHRvIGRlcml2ZSBhIG5ldyBzZWVkIGZyb20gdGhlIGdpdmVuIHNlZWQgdG8gcmVjb3ZlciBhIHNlY3JldCB3YWxsZXQgZnJvbSB0aGUgc2VlZFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuaXNNdWx0aXNpZ10gLSByZXN0b3JlIG11bHRpc2lnIHdhbGxldCBmcm9tIHNlZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpbWFyeUFkZHJlc3NdIC0gcHJpbWFyeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmx5IHByb3ZpZGUgaWYgcmVzdG9yaW5nIGZyb20ga2V5cylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVZpZXdLZXldIC0gcHJpdmF0ZSB2aWV3IGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVTcGVuZEtleV0gLSBwcml2YXRlIHNwZW5kIGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnJlc3RvcmVIZWlnaHRdIC0gYmxvY2sgaGVpZ2h0IHRvIHN0YXJ0IHNjYW5uaW5nIGZyb20gKGRlZmF1bHRzIHRvIDAgdW5sZXNzIGdlbmVyYXRpbmcgcmFuZG9tIHdhbGxldClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcubGFuZ3VhZ2VdIC0gbGFuZ3VhZ2Ugb2YgdGhlIHdhbGxldCdzIG1uZW1vbmljIHBocmFzZSBvciBzZWVkIChkZWZhdWx0cyB0byBcIkVuZ2xpc2hcIiBvciBhdXRvLWRldGVjdGVkKVxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb259IFtjb25maWcuc2VydmVyXSAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gdG8gYSBtb25lcm8gZGFlbW9uIChvcHRpb25hbCk8YnI+XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclVyaV0gLSB1cmkgb2YgYSBkYWVtb24gdG8gdXNlIChvcHRpb25hbCwgbW9uZXJvLXdhbGxldC1ycGMgdXN1YWxseSBzdGFydGVkIHdpdGggZGFlbW9uIGNvbmZpZylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyVXNlcm5hbWVdIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIGRhZW1vbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclBhc3N3b3JkXSAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBkYWVtb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSBbY29uZmlnLmNvbm5lY3Rpb25NYW5hZ2VyXSAtIG1hbmFnZSBjb25uZWN0aW9ucyB0byBtb25lcm9kIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlamVjdFVuYXV0aG9yaXplZF0gLSByZWplY3Qgc2VsZi1zaWduZWQgc2VydmVyIGNlcnRpZmljYXRlcyBpZiB0cnVlIChkZWZhdWx0cyB0byB0cnVlKVxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb259IFtjb25maWcuc2VydmVyXSAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb3IgZXF1aXZhbGVudCBKUyBvYmplY3QgcHJvdmlkaW5nIGRhZW1vbiBjb25maWd1cmF0aW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnNhdmVDdXJyZW50XSAtIHNwZWNpZmllcyBpZiB0aGUgY3VycmVudCBSUEMgd2FsbGV0IHNob3VsZCBiZSBzYXZlZCBiZWZvcmUgYmVpbmcgY2xvc2VkIChkZWZhdWx0IHRydWUpXG4gICAqIEByZXR1cm4ge01vbmVyb1dhbGxldFJwY30gdGhpcyB3YWxsZXQgY2xpZW50XG4gICAqL1xuICBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgY29uZmlnIHRvIGNyZWF0ZSB3YWxsZXRcIik7XG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCAmJiAoY29uZmlnTm9ybWFsaXplZC5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBpbml0aWFsaXplZCB3aXRoIGEgc2VlZCBvciBrZXlzIGJ1dCBub3QgYm90aFwiKTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVndGVzdCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHJlZ3Rlc3QgbW9kZSB3aGVuIGNyZWF0aW5nIFJQQyB3YWxsZXRcIilcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXROZXR3b3JrVHlwZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIG5ldHdvcmtUeXBlIHdoZW4gY3JlYXRpbmcgUlBDIHdhbGxldCBiZWNhdXNlIHNlcnZlcidzIG5ldHdvcmsgdHlwZSBpcyBhbHJlYWR5IHNldFwiKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50TG9va2FoZWFkKCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NMb29rYWhlYWQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGNyZWF0aW5nIHdhbGxldHMgd2l0aCBzdWJhZGRyZXNzIGxvb2thaGVhZCBvdmVyIHJwY1wiKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRQYXNzd29yZCgpID09PSB1bmRlZmluZWQpIGNvbmZpZ05vcm1hbGl6ZWQuc2V0UGFzc3dvcmQoXCJcIik7XG5cbiAgICAvLyBzZXQgc2VydmVyIGZyb20gY29ubmVjdGlvbiBtYW5hZ2VyIGlmIHByb3ZpZGVkXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgY3JlYXRlZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBjb25maWdOb3JtYWxpemVkLnNldFNlcnZlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKS5nZXRDb25uZWN0aW9uKCkpO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCkgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWdOb3JtYWxpemVkKTtcbiAgICBlbHNlIGlmIChjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQpIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0RnJvbUtleXMoY29uZmlnTm9ybWFsaXplZCk7XG4gICAgZWxzZSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldFJhbmRvbShjb25maWdOb3JtYWxpemVkKTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXIgb3Igc2VydmVyXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXRDb25uZWN0aW9uTWFuYWdlcihjb25maWdOb3JtYWxpemVkLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIH0gZWxzZSBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldFJhbmRvbShjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHJlc3RvcmVIZWlnaHQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKSA9PT0gZmFsc2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkN1cnJlbnQgd2FsbGV0IGlzIHNhdmVkIGF1dG9tYXRpY2FsbHkgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmICghY29uZmlnLmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTmFtZSBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0TGFuZ3VhZ2UoKSkgY29uZmlnLnNldExhbmd1YWdlKE1vbmVyb1dhbGxldC5ERUZBVUxUX0xBTkdVQUdFKTtcbiAgICBsZXQgcGFyYW1zID0geyBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSwgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLCBsYW5ndWFnZTogY29uZmlnLmdldExhbmd1YWdlKCkgfTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX3dhbGxldFwiLCBwYXJhbXMpO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aGlzLmhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKGNvbmZpZy5nZXRQYXRoKCksIGVycik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVzdG9yZV9kZXRlcm1pbmlzdGljX3dhbGxldFwiLCB7XG4gICAgICAgIGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLFxuICAgICAgICBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksXG4gICAgICAgIHNlZWQ6IGNvbmZpZy5nZXRTZWVkKCksXG4gICAgICAgIHNlZWRfb2Zmc2V0OiBjb25maWcuZ2V0U2VlZE9mZnNldCgpLFxuICAgICAgICBlbmFibGVfbXVsdGlzaWdfZXhwZXJpbWVudGFsOiBjb25maWcuZ2V0SXNNdWx0aXNpZygpLFxuICAgICAgICByZXN0b3JlX2hlaWdodDogY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSxcbiAgICAgICAgbGFuZ3VhZ2U6IGNvbmZpZy5nZXRMYW5ndWFnZSgpLFxuICAgICAgICBhdXRvc2F2ZV9jdXJyZW50OiBjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBrZXlzXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRSZXN0b3JlSGVpZ2h0KDApO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoTW9uZXJvV2FsbGV0LkRFRkFVTFRfTEFOR1VBR0UpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZW5lcmF0ZV9mcm9tX2tleXNcIiwge1xuICAgICAgICBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSxcbiAgICAgICAgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLFxuICAgICAgICBhZGRyZXNzOiBjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSxcbiAgICAgICAgdmlld2tleTogY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCksXG4gICAgICAgIHNwZW5ka2V5OiBjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCksXG4gICAgICAgIHJlc3RvcmVfaGVpZ2h0OiBjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpLFxuICAgICAgICBhdXRvc2F2ZV9jdXJyZW50OiBjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBoYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihuYW1lLCBlcnIpIHtcbiAgICBpZiAoZXJyLm1lc3NhZ2UpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwiYWxyZWFkeSBleGlzdHNcIikpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBuYW1lLCBlcnIuZ2V0Q29kZSgpLCBlcnIuZ2V0UnBjTWV0aG9kKCksIGVyci5nZXRScGNQYXJhbXMoKSk7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcIndvcmQgbGlzdCBmYWlsZWQgdmVyaWZpY2F0aW9uXCIpKSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoXCJJbnZhbGlkIG1uZW1vbmljXCIsIGVyci5nZXRDb2RlKCksIGVyci5nZXRScGNNZXRob2QoKSwgZXJyLmdldFJwY1BhcmFtcygpKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9XG4gIFxuICBhc3luYyBpc1ZpZXdPbmx5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwge2tleV90eXBlOiBcIm1uZW1vbmljXCJ9KTtcbiAgICAgIHJldHVybiBmYWxzZTsgLy8ga2V5IHJldHJpZXZhbCBzdWNjZWVkcyBpZiBub3QgdmlldyBvbmx5XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0yOSkgcmV0dXJuIHRydWU7ICAvLyB3YWxsZXQgaXMgdmlldyBvbmx5XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0xKSByZXR1cm4gZmFsc2U7ICAvLyB3YWxsZXQgaXMgb2ZmbGluZSBidXQgbm90IHZpZXcgb25seVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvUnBjQ29ubmVjdGlvbn0gW3VyaU9yQ29ubmVjdGlvbl0gLSB0aGUgZGFlbW9uJ3MgVVJJIG9yIGNvbm5lY3Rpb24gKGRlZmF1bHRzIHRvIG9mZmxpbmUpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNUcnVzdGVkIC0gaW5kaWNhdGVzIGlmIHRoZSBkYWVtb24gaW4gdHJ1c3RlZFxuICAgKiBAcGFyYW0ge1NzbE9wdGlvbnN9IHNzbE9wdGlvbnMgLSBjdXN0b20gU1NMIGNvbmZpZ3VyYXRpb25cbiAgICovXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uPzogUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IHN0cmluZywgaXNUcnVzdGVkPzogYm9vbGVhbiwgc3NsT3B0aW9ucz86IFNzbE9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgY29ubmVjdGlvbiA9ICF1cmlPckNvbm5lY3Rpb24gPyB1bmRlZmluZWQgOiB1cmlPckNvbm5lY3Rpb24gaW5zdGFuY2VvZiBNb25lcm9ScGNDb25uZWN0aW9uID8gdXJpT3JDb25uZWN0aW9uIDogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uKTtcbiAgICBpZiAoIXNzbE9wdGlvbnMpIHNzbE9wdGlvbnMgPSBuZXcgU3NsT3B0aW9ucygpO1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hZGRyZXNzID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0VXJpKCkgOiBcImJhZF91cmlcIjsgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogYmFkIGRhZW1vbiB1cmkgbmVjZXNzYXJ5IGZvciBvZmZsaW5lP1xuICAgIHBhcmFtcy51c2VybmFtZSA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFVzZXJuYW1lKCkgOiBcIlwiO1xuICAgIHBhcmFtcy5wYXNzd29yZCA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIHBhcmFtcy50cnVzdGVkID0gaXNUcnVzdGVkO1xuICAgIHBhcmFtcy5zc2xfc3VwcG9ydCA9IFwiYXV0b2RldGVjdFwiO1xuICAgIHBhcmFtcy5zc2xfcHJpdmF0ZV9rZXlfcGF0aCA9IHNzbE9wdGlvbnMuZ2V0UHJpdmF0ZUtleVBhdGgoKTtcbiAgICBwYXJhbXMuc3NsX2NlcnRpZmljYXRlX3BhdGggID0gc3NsT3B0aW9ucy5nZXRDZXJ0aWZpY2F0ZVBhdGgoKTtcbiAgICBwYXJhbXMuc3NsX2NhX2ZpbGUgPSBzc2xPcHRpb25zLmdldENlcnRpZmljYXRlQXV0aG9yaXR5RmlsZSgpO1xuICAgIHBhcmFtcy5zc2xfYWxsb3dlZF9maW5nZXJwcmludHMgPSBzc2xPcHRpb25zLmdldEFsbG93ZWRGaW5nZXJwcmludHMoKTtcbiAgICBwYXJhbXMuc3NsX2FsbG93X2FueV9jZXJ0ID0gc3NsT3B0aW9ucy5nZXRBbGxvd0FueUNlcnQoKTtcblxuICAgIC8vIHNldCBwcm94eSB3aGljaCBtdXN0IG1hdGNoIHN0YXJ0dXAgcHJveHkgaWYgYXBwbGljYWJsZVxuICAgIGlmIChjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodGhpcy5zdGFydHVwUHJveHlVcmkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNldCBkYWVtb24gY29ubmVjdGlvbiB3aXRob3V0IHByb3h5IFVSSSBiZWNhdXNlIG1vbmVyby13YWxsZXQtcnBjIHdhcyBzdGFydGVkIHdpdGggYSBwcm94eSBVUkk6IFwiICsgdGhpcy5zdGFydHVwUHJveHlVcmkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5zdGFydHVwUHJveHlVcmkgPT09IHVuZGVmaW5lZCkgcGFyYW1zLnByb3h5ID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA6IFwiXCI7XG4gICAgICBlbHNlIGlmICghR2VuVXRpbHMuaXNTYW1lUHJveHlVcmkodGhpcy5zdGFydHVwUHJveHlVcmksIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNldCBkYWVtb24gY29ubmVjdGlvbiB3aXRoIHByb3h5IFVSSSBcIiArIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSArIFwiIGJlY2F1c2UgbW9uZXJvLXdhbGxldC1ycGMgd2FzIHN0YXJ0ZWQgd2l0aCBhIGRpZmZlcmVudCBwcm94eSBVUkk6IFwiICsgdGhpcy5zdGFydHVwUHJveHlVcmkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXBhcmFtcy5wcm94eSkgcGFyYW1zLnByb3h5ID0gXCJcIjtcblxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9kYWVtb25cIiwgcGFyYW1zKTtcbiAgICB0aGlzLmRhZW1vbkNvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLmRhZW1vbkNvbm5lY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSB0b3RhbCBhbmQgdW5sb2NrZWQgYmFsYW5jZXMgaW4gYSBzaW5nbGUgcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbYWNjb3VudElkeF0gYWNjb3VudCBpbmRleFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N1YmFkZHJlc3NJZHhdIHN1YmFkZHJlc3MgaW5kZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxiaWdpbnRbXT59IGlzIHRoZSB0b3RhbCBhbmQgdW5sb2NrZWQgYmFsYW5jZXMgaW4gYW4gYXJyYXksIHJlc3BlY3RpdmVseVxuICAgKi9cbiAgYXN5bmMgZ2V0QmFsYW5jZXMoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50W10+IHtcbiAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzc0lkeCwgdW5kZWZpbmVkLCBcIk11c3QgcHJvdmlkZSBhY2NvdW50IGluZGV4IHdpdGggc3ViYWRkcmVzcyBpbmRleFwiKTtcbiAgICAgIGxldCBiYWxhbmNlID0gQmlnSW50KDApO1xuICAgICAgbGV0IHVubG9ja2VkQmFsYW5jZSA9IEJpZ0ludCgwKTtcbiAgICAgIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgdGhpcy5nZXRBY2NvdW50cygpKSB7XG4gICAgICAgIGJhbGFuY2UgPSBiYWxhbmNlICsgYWNjb3VudC5nZXRCYWxhbmNlKCk7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZSA9IHVubG9ja2VkQmFsYW5jZSArIGFjY291bnQuZ2V0VW5sb2NrZWRCYWxhbmNlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gW2JhbGFuY2UsIHVubG9ja2VkQmFsYW5jZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBwYXJhbXMgPSB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeCwgYWRkcmVzc19pbmRpY2VzOiBzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBbc3ViYWRkcmVzc0lkeF19O1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCBwYXJhbXMpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtCaWdJbnQocmVzcC5yZXN1bHQuYmFsYW5jZSksIEJpZ0ludChyZXNwLnJlc3VsdC51bmxvY2tlZF9iYWxhbmNlKV07XG4gICAgICBlbHNlIHJldHVybiBbQmlnSW50KHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzWzBdLmJhbGFuY2UpLCBCaWdJbnQocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3NbMF0udW5sb2NrZWRfYmFsYW5jZSldO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ09NTU9OIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9XYWxsZXRMaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN1cGVyLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZXNlcnZlUHJvb2YoYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpLCBcIlwiLCBcIlwiKTsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBwcm92aWRlIGJldHRlciB3YXkgdG8ga25vdyBpZiB3YWxsZXQgcnBjIGlzIGNvbm5lY3RlZCB0byBkYWVtb25cbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcImNoZWNrIHJlc2VydmUgZXhwZWN0ZWQgdG8gZmFpbFwiKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC0xMykgdGhyb3cgZTsgLy8gbm8gd2FsbGV0IGZpbGVcbiAgICAgIHJldHVybiBlLm1lc3NhZ2UuaW5kZXhPZihcIkZhaWxlZCB0byBjb25uZWN0IHRvIGRhZW1vblwiKSA8IDA7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3ZlcnNpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9WZXJzaW9uKHJlc3AucmVzdWx0LnZlcnNpb24sIHJlc3AucmVzdWx0LnJlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMucGF0aDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwibW5lbW9uaWNcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2UoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoYXdhaXQgdGhpcy5nZXRTZWVkKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMuZ2V0U2VlZExhbmd1YWdlKCkgbm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBsaXN0IG9mIGF2YWlsYWJsZSBsYW5ndWFnZXMgZm9yIHRoZSB3YWxsZXQncyBzZWVkLlxuICAgKiBcbiAgICogQHJldHVybiB7c3RyaW5nW119IHRoZSBhdmFpbGFibGUgbGFuZ3VhZ2VzIGZvciB0aGUgd2FsbGV0J3Mgc2VlZC5cbiAgICovXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZXMoKSB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfbGFuZ3VhZ2VzXCIpKS5yZXN1bHQubGFuZ3VhZ2VzO1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwidmlld19rZXlcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcInNwZW5kX2tleVwiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBzdWJhZGRyZXNzTWFwID0gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF07XG4gICAgaWYgKCFzdWJhZGRyZXNzTWFwKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHRydWUpOyAgLy8gY2FjaGUncyBhbGwgYWRkcmVzc2VzIGF0IHRoaXMgYWNjb3VudFxuICAgICAgcmV0dXJuIHRoaXMuZ2V0QWRkcmVzcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTsgICAgICAgIC8vIHJlY3Vyc2l2ZSBjYWxsIHVzZXMgY2FjaGVcbiAgICB9XG4gICAgbGV0IGFkZHJlc3MgPSBzdWJhZGRyZXNzTWFwW3N1YmFkZHJlc3NJZHhdO1xuICAgIGlmICghYWRkcmVzcykge1xuICAgICAgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCB0cnVlKTsgIC8vIGNhY2hlJ3MgYWxsIGFkZHJlc3NlcyBhdCB0aGlzIGFjY291bnRcbiAgICAgIHJldHVybiB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XVtzdWJhZGRyZXNzSWR4XTtcbiAgICB9XG4gICAgcmV0dXJuIGFkZHJlc3M7XG4gIH1cbiAgXG4gIC8vIFRPRE86IHVzZSBjYWNoZVxuICBhc3luYyBnZXRBZGRyZXNzSW5kZXgoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggcmVzdWx0IGFuZCBub3JtYWxpemUgZXJyb3IgaWYgYWRkcmVzcyBkb2VzIG5vdCBiZWxvbmcgdG8gdGhlIHdhbGxldFxuICAgIGxldCByZXNwO1xuICAgIHRyeSB7XG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NfaW5kZXhcIiwge2FkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTIpIHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29udmVydCBycGMgcmVzcG9uc2VcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKHthZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWFqb3IpO1xuICAgIHN1YmFkZHJlc3Muc2V0SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWlub3IpO1xuICAgIHJldHVybiBzdWJhZGRyZXNzO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3M/OiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IGludGVncmF0ZWRBZGRyZXNzU3RyID0gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfaW50ZWdyYXRlZF9hZGRyZXNzXCIsIHtzdGFuZGFyZF9hZGRyZXNzOiBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRfaWQ6IHBheW1lbnRJZH0pKS5yZXN1bHQuaW50ZWdyYXRlZF9hZGRyZXNzO1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3NTdHIpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUubWVzc2FnZS5pbmNsdWRlcyhcIkludmFsaWQgcGF5bWVudCBJRFwiKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBwYXltZW50IElEOiBcIiArIHBheW1lbnRJZCk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNwbGl0X2ludGVncmF0ZWRfYWRkcmVzc1wiLCB7aW50ZWdyYXRlZF9hZGRyZXNzOiBpbnRlZ3JhdGVkQWRkcmVzc30pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoKS5zZXRTdGFuZGFyZEFkZHJlc3MocmVzcC5yZXN1bHQuc3RhbmRhcmRfYWRkcmVzcykuc2V0UGF5bWVudElkKHJlc3AucmVzdWx0LnBheW1lbnRfaWQpLnNldEludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfaGVpZ2h0XCIpKS5yZXN1bHQuaGVpZ2h0O1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGdldHRpbmcgdGhlIGNoYWluIGhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF5OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGluZyBhIGhlaWdodCBieSBkYXRlXCIpO1xuICB9XG4gIFxuICBhc3luYyBzeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodD86IE1vbmVyb1dhbGxldExpc3RlbmVyIHwgbnVtYmVyLCBzdGFydEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvU3luY1Jlc3VsdD4ge1xuICAgIGFzc2VydCghKGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyKSwgXCJNb25lcm8gV2FsbGV0IFJQQyBkb2VzIG5vdCBzdXBwb3J0IHJlcG9ydGluZyBzeW5jIHByb2dyZXNzXCIpO1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlZnJlc2hcIiwge3N0YXJ0X2hlaWdodDogc3RhcnRIZWlnaHR9KTtcbiAgICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3AucmVzdWx0LmJsb2Nrc19mZXRjaGVkLCByZXNwLnJlc3VsdC5yZWNlaXZlZF9tb25leSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZSA9PT0gXCJubyBjb25uZWN0aW9uIHRvIGRhZW1vblwiKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXM/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBcbiAgICAvLyBjb252ZXJ0IG1zIHRvIHNlY29uZHMgZm9yIHJwYyBwYXJhbWV0ZXJcbiAgICBsZXQgc3luY1BlcmlvZEluU2Vjb25kcyA9IE1hdGgucm91bmQoKHN5bmNQZXJpb2RJbk1zID09PSB1bmRlZmluZWQgPyBNb25lcm9XYWxsZXRScGMuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA6IHN5bmNQZXJpb2RJbk1zKSAvIDEwMDApO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhdXRvX3JlZnJlc2hcIiwge1xuICAgICAgZW5hYmxlOiB0cnVlLFxuICAgICAgcGVyaW9kOiBzeW5jUGVyaW9kSW5TZWNvbmRzXG4gICAgfSk7XG4gICAgXG4gICAgLy8gdXBkYXRlIHN5bmMgcGVyaW9kIGZvciBwb2xsZXJcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gc3luY1BlcmlvZEluU2Vjb25kcyAqIDEwMDA7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyICE9PSB1bmRlZmluZWQpIHRoaXMud2FsbGV0UG9sbGVyLnNldFBlcmlvZEluTXModGhpcy5zeW5jUGVyaW9kSW5Ncyk7XG4gICAgXG4gICAgLy8gcG9sbCBpZiBsaXN0ZW5pbmdcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgfVxuXG4gIGdldFN5bmNQZXJpb2RJbk1zKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuc3luY1BlcmlvZEluTXM7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhdXRvX3JlZnJlc2hcIiwgeyBlbmFibGU6IGZhbHNlIH0pO1xuICB9XG4gIFxuICBhc3luYyBzY2FuVHhzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdHhIYXNoZXMgfHwgIXR4SGFzaGVzLmxlbmd0aCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gdHggaGFzaGVzIGdpdmVuIHRvIHNjYW5cIik7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2Nhbl90eFwiLCB7dHhpZHM6IHR4SGFzaGVzfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhblNwZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc2Nhbl9zcGVudFwiLCB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc2Nhbl9ibG9ja2NoYWluXCIsIHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbGFuY2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYWxhbmNlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCB0YWc/OiBzdHJpbmcsIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnRbXT4ge1xuICAgIFxuICAgIC8vIGZldGNoIGFjY291bnRzIGZyb20gcnBjXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWNjb3VudHNcIiwge3RhZzogdGFnfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgYWNjb3VudCBvYmplY3RzIGFuZCBmZXRjaCBzdWJhZGRyZXNzZXMgcGVyIGFjY291bnQgdXNpbmcgZ2V0X2FkZHJlc3NcbiAgICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBnZXRfYWRkcmVzcyBzaG91bGQgc3VwcG9ydCBhbGxfYWNjb3VudHMgc28gbm90IGNhbGxlZCBvbmNlIHBlciBhY2NvdW50XG4gICAgbGV0IGFjY291bnRzOiBNb25lcm9BY2NvdW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBycGNBY2NvdW50IG9mIHJlc3AucmVzdWx0LnN1YmFkZHJlc3NfYWNjb3VudHMpIHtcbiAgICAgIGxldCBhY2NvdW50ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNBY2NvdW50KHJwY0FjY291bnQpO1xuICAgICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMpIGFjY291bnQuc2V0U3ViYWRkcmVzc2VzKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnQuZ2V0SW5kZXgoKSwgdW5kZWZpbmVkLCB0cnVlKSk7XG4gICAgICBhY2NvdW50cy5wdXNoKGFjY291bnQpO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgbWVyZ2UgZmllbGRzIGZyb20gZ2V0X2JhbGFuY2UgYWNyb3NzIGFsbCBhY2NvdW50c1xuICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzICYmICFza2lwQmFsYW5jZXMpIHtcbiAgICAgIFxuICAgICAgLy8gdGhlc2UgZmllbGRzIGFyZSBub3QgaW5pdGlhbGl6ZWQgaWYgc3ViYWRkcmVzcyBpcyB1bnVzZWQgYW5kIHRoZXJlZm9yZSBub3QgcmV0dXJuZWQgZnJvbSBgZ2V0X2JhbGFuY2VgXG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkge1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cygwKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGZldGNoIGFuZCBtZXJnZSBpbmZvIGZyb20gZ2V0X2JhbGFuY2VcbiAgICAgIHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCB7YWxsX2FjY291bnRzOiB0cnVlfSk7XG4gICAgICBpZiAocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIG1lcmdlIGluZm9cbiAgICAgICAgICBsZXQgYWNjb3VudCA9IGFjY291bnRzW3N1YmFkZHJlc3MuZ2V0QWNjb3VudEluZGV4KCldO1xuICAgICAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzLmdldEFjY291bnRJbmRleCgpLCBhY2NvdW50LmdldEluZGV4KCksIFwiUlBDIGFjY291bnRzIGFyZSBvdXQgb2Ygb3JkZXJcIik7ICAvLyB3b3VsZCBuZWVkIHRvIHN3aXRjaCBsb29rdXAgdG8gbG9vcFxuICAgICAgICAgIGxldCB0Z3RTdWJhZGRyZXNzID0gYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKVtzdWJhZGRyZXNzLmdldEluZGV4KCldO1xuICAgICAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzLmdldEluZGV4KCksIHRndFN1YmFkZHJlc3MuZ2V0SW5kZXgoKSwgXCJSUEMgc3ViYWRkcmVzc2VzIGFyZSBvdXQgb2Ygb3JkZXJcIik7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0QmFsYW5jZShzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSk7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSk7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGFjY291bnRzO1xuICB9XG4gIFxuICAvLyBUT0RPOiBnZXRBY2NvdW50QnlJbmRleCgpLCBnZXRBY2NvdW50QnlUYWcoKVxuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBhc3NlcnQoYWNjb3VudElkeCA+PSAwKTtcbiAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgaWYgKGFjY291bnQuZ2V0SW5kZXgoKSA9PT0gYWNjb3VudElkeCkge1xuICAgICAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcykgYWNjb3VudC5zZXRTdWJhZGRyZXNzZXMoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCBza2lwQmFsYW5jZXMpKTtcbiAgICAgICAgcmV0dXJuIGFjY291bnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIkFjY291bnQgd2l0aCBpbmRleCBcIiArIGFjY291bnRJZHggKyBcIiBkb2VzIG5vdCBleGlzdFwiKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBsYWJlbCA9IGxhYmVsID8gbGFiZWwgOiB1bmRlZmluZWQ7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfYWNjb3VudFwiLCB7bGFiZWw6IGxhYmVsfSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9BY2NvdW50KHtcbiAgICAgIGluZGV4OiByZXNwLnJlc3VsdC5hY2NvdW50X2luZGV4LFxuICAgICAgcHJpbWFyeUFkZHJlc3M6IHJlc3AucmVzdWx0LmFkZHJlc3MsXG4gICAgICBsYWJlbDogbGFiZWwsXG4gICAgICBiYWxhbmNlOiBCaWdJbnQoMCksXG4gICAgICB1bmxvY2tlZEJhbGFuY2U6IEJpZ0ludCgwKVxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0luZGljZXM/OiBudW1iZXJbXSwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggc3ViYWRkcmVzc2VzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBhY2NvdW50SWR4O1xuICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcykgcGFyYW1zLmFkZHJlc3NfaW5kZXggPSBHZW5VdGlscy5saXN0aWZ5KHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzXCIsIHBhcmFtcyk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBzdWJhZGRyZXNzZXNcbiAgICBsZXQgc3ViYWRkcmVzc2VzID0gW107XG4gICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5hZGRyZXNzZXMpIHtcbiAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgICBzdWJhZGRyZXNzZXMucHVzaChzdWJhZGRyZXNzKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIGluaXRpYWxpemUgc3ViYWRkcmVzcyBiYWxhbmNlc1xuICAgIGlmICghc2tpcEJhbGFuY2VzKSB7XG4gICAgICBcbiAgICAgIC8vIHRoZXNlIGZpZWxkcyBhcmUgbm90IGluaXRpYWxpemVkIGlmIHN1YmFkZHJlc3MgaXMgdW51c2VkIGFuZCB0aGVyZWZvcmUgbm90IHJldHVybmVkIGZyb20gYGdldF9iYWxhbmNlYFxuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGZldGNoIGFuZCBpbml0aWFsaXplIGJhbGFuY2VzXG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwgcGFyYW1zKTtcbiAgICAgIGlmIChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICBmb3IgKGxldCBycGNTdWJhZGRyZXNzIG9mIHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3MgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gdHJhbnNmZXIgaW5mbyB0byBleGlzdGluZyBzdWJhZGRyZXNzIG9iamVjdFxuICAgICAgICAgIGZvciAobGV0IHRndFN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICAgICAgICBpZiAodGd0U3ViYWRkcmVzcy5nZXRJbmRleCgpICE9PSBzdWJhZGRyZXNzLmdldEluZGV4KCkpIGNvbnRpbnVlOyAvLyBza2lwIHRvIHN1YmFkZHJlc3Mgd2l0aCBzYW1lIGluZGV4XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXROdW1CbG9ja3NUb1VubG9jaygpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soc3ViYWRkcmVzcy5nZXROdW1CbG9ja3NUb1VubG9jaygpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgYWRkcmVzc2VzXG4gICAgbGV0IHN1YmFkZHJlc3NNYXAgPSB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XTtcbiAgICBpZiAoIXN1YmFkZHJlc3NNYXApIHtcbiAgICAgIHN1YmFkZHJlc3NNYXAgPSB7fTtcbiAgICAgIHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdID0gc3ViYWRkcmVzc01hcDtcbiAgICB9XG4gICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgIHN1YmFkZHJlc3NNYXBbc3ViYWRkcmVzcy5nZXRJbmRleCgpXSA9IHN1YmFkZHJlc3MuZ2V0QWRkcmVzcygpO1xuICAgIH1cbiAgICBcbiAgICAvLyByZXR1cm4gcmVzdWx0c1xuICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gIH1cblxuICBhc3luYyBnZXRTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgYXNzZXJ0KGFjY291bnRJZHggPj0gMCk7XG4gICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPj0gMCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBbc3ViYWRkcmVzc0lkeF0sIHNraXBCYWxhbmNlcykpWzBdO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfYWRkcmVzc1wiLCB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeCwgbGFiZWw6IGxhYmVsfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgc3ViYWRkcmVzcyBvYmplY3RcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKCk7XG4gICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgc3ViYWRkcmVzcy5zZXRJbmRleChyZXNwLnJlc3VsdC5hZGRyZXNzX2luZGV4KTtcbiAgICBzdWJhZGRyZXNzLnNldEFkZHJlc3MocmVzcC5yZXN1bHQuYWRkcmVzcyk7XG4gICAgc3ViYWRkcmVzcy5zZXRMYWJlbChsYWJlbCA/IGxhYmVsIDogdW5kZWZpbmVkKTtcbiAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgc3ViYWRkcmVzcy5zZXRJc1VzZWQoZmFsc2UpO1xuICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cblxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJsYWJlbF9hZGRyZXNzXCIsIHtpbmRleDoge21ham9yOiBhY2NvdW50SWR4LCBtaW5vcjogc3ViYWRkcmVzc0lkeH0sIGxhYmVsOiBsYWJlbH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHMocXVlcnk/OiBzdHJpbmdbXSB8IFBhcnRpYWw8TW9uZXJvVHhRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICByZXR1cm4gdGhpcy5nZXRUeHNBdXgocXVlcnksIDUpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGdldFR4c0F1eChxdWVyeTogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+IHwgdW5kZWZpbmVkLCBtYXhBdHRlbXB0czogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG5cbiAgICAvLyBjb3B5IHF1ZXJ5XG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHRlbXBvcmFyaWx5IGRpc2FibGUgdHJhbnNmZXIgYW5kIG91dHB1dCBxdWVyaWVzIGluIG9yZGVyIHRvIGNvbGxlY3QgYWxsIHR4IGluZm9ybWF0aW9uXG4gICAgbGV0IHRyYW5zZmVyUXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0VHJhbnNmZXJRdWVyeSgpO1xuICAgIGxldCBpbnB1dFF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldElucHV0UXVlcnkoKTtcbiAgICBsZXQgb3V0cHV0UXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0T3V0cHV0UXVlcnkoKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0VHJhbnNmZXJRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRJbnB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldE91dHB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgXG4gICAgLy8gZmV0Y2ggYWxsIHRyYW5zZmVycyB0aGF0IG1lZXQgdHggcXVlcnlcbiAgICBsZXQgdHJhbnNmZXJzID0gYXdhaXQgdGhpcy5nZXRUcmFuc2ZlcnNBdXgobmV3IE1vbmVyb1RyYW5zZmVyUXVlcnkoKS5zZXRUeFF1ZXJ5KE1vbmVyb1dhbGxldFJwYy5kZWNvbnRleHR1YWxpemUocXVlcnlOb3JtYWxpemVkLmNvcHkoKSkpKTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHVuaXF1ZSB0eHMgZnJvbSB0cmFuc2ZlcnMgd2hpbGUgcmV0YWluaW5nIG9yZGVyXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGxldCB0eHNTZXQgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHJhbnNmZXJzKSB7XG4gICAgICBpZiAoIXR4c1NldC5oYXModHJhbnNmZXIuZ2V0VHgoKSkpIHtcbiAgICAgICAgdHhzLnB1c2godHJhbnNmZXIuZ2V0VHgoKSk7XG4gICAgICAgIHR4c1NldC5hZGQodHJhbnNmZXIuZ2V0VHgoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHR5cGVzIGludG8gbWFwcyBmb3IgbWVyZ2luZyBhbmQgbG9va3VwXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIG1lcmdlIG91dHB1dHMgaWYgcmVxdWVzdGVkXG4gICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5nZXRJbmNsdWRlT3V0cHV0cygpIHx8IG91dHB1dFF1ZXJ5KSB7XG4gICAgICAgIFxuICAgICAgLy8gZmV0Y2ggb3V0cHV0c1xuICAgICAgbGV0IG91dHB1dFF1ZXJ5QXV4ID0gKG91dHB1dFF1ZXJ5ID8gb3V0cHV0UXVlcnkuY29weSgpIDogbmV3IE1vbmVyb091dHB1dFF1ZXJ5KCkpLnNldFR4UXVlcnkoTW9uZXJvV2FsbGV0UnBjLmRlY29udGV4dHVhbGl6ZShxdWVyeU5vcm1hbGl6ZWQuY29weSgpKSk7XG4gICAgICBsZXQgb3V0cHV0cyA9IGF3YWl0IHRoaXMuZ2V0T3V0cHV0c0F1eChvdXRwdXRRdWVyeUF1eCk7XG4gICAgICBcbiAgICAgIC8vIG1lcmdlIG91dHB1dCB0eHMgb25lIHRpbWUgd2hpbGUgcmV0YWluaW5nIG9yZGVyXG4gICAgICBsZXQgb3V0cHV0VHhzID0gW107XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2Ygb3V0cHV0cykge1xuICAgICAgICBpZiAoIW91dHB1dFR4cy5pbmNsdWRlcyhvdXRwdXQuZ2V0VHgoKSkpIHtcbiAgICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeChvdXRwdXQuZ2V0VHgoKSwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgICAgICBvdXRwdXRUeHMucHVzaChvdXRwdXQuZ2V0VHgoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gcmVzdG9yZSB0cmFuc2ZlciBhbmQgb3V0cHV0IHF1ZXJpZXNcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0VHJhbnNmZXJRdWVyeSh0cmFuc2ZlclF1ZXJ5KTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SW5wdXRRdWVyeShpbnB1dFF1ZXJ5KTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0T3V0cHV0UXVlcnkob3V0cHV0UXVlcnkpO1xuICAgIFxuICAgIC8vIGZpbHRlciB0eHMgdGhhdCBkb24ndCBtZWV0IHRyYW5zZmVyIHF1ZXJ5XG4gICAgbGV0IHR4c1F1ZXJpZWQgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQubWVldHNDcml0ZXJpYSh0eCkpIHR4c1F1ZXJpZWQucHVzaCh0eCk7XG4gICAgICBlbHNlIGlmICh0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgIH1cbiAgICB0eHMgPSB0eHNRdWVyaWVkO1xuICAgIFxuICAgIC8vIHNwZWNpYWwgY2FzZTogcmUtZmV0Y2ggdHhzIGlmIGluY29uc2lzdGVuY3kgY2F1c2VkIGJ5IG5lZWRpbmcgdG8gbWFrZSBtdWx0aXBsZSBycGMgY2FsbHNcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpICYmIHR4LmdldEJsb2NrKCkgPT09IHVuZGVmaW5lZCB8fCAhdHguZ2V0SXNDb25maXJtZWQoKSAmJiB0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKG1heEF0dGVtcHRzIDw9IDEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlVuYWJsZSB0byBidWlsZCBjb25zaXN0ZW50IHR4cyBmcm9tIG11bHRpcGxlIHJwYyBjYWxsc1wiKTtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkluY29uc2lzdGVuY3kgZGV0ZWN0ZWQgYnVpbGRpbmcgdHhzIGZyb20gbXVsdGlwbGUgcnBjIGNhbGxzLCByZS1mZXRjaGluZyB0eHNcIik7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFR4c0F1eChxdWVyeU5vcm1hbGl6ZWQsIG1heEF0dGVtcHRzIC0gMSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIG9yZGVyIHR4cyBpZiB0eCBoYXNoZXMgZ2l2ZW4gdGhlbiByZXR1cm5cbiAgICBpZiAocXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpICYmIHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKS5sZW5ndGggPiAwKSB7XG4gICAgICBsZXQgdHhzQnlJZCA9IG5ldyBNYXAoKSAgLy8gc3RvcmUgdHhzIGluIHRlbXBvcmFyeSBtYXAgZm9yIHNvcnRpbmdcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykgdHhzQnlJZC5zZXQodHguZ2V0SGFzaCgpLCB0eCk7XG4gICAgICBsZXQgb3JkZXJlZFR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgaGFzaCBvZiBxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkpIGlmICh0eHNCeUlkLmdldChoYXNoKSkgb3JkZXJlZFR4cy5wdXNoKHR4c0J5SWQuZ2V0KGhhc2gpKTtcbiAgICAgIHR4cyA9IG9yZGVyZWRUeHM7XG4gICAgfVxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1RyYW5zZmVyW10+IHtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gZ2V0IHRyYW5zZmVycyBkaXJlY3RseSBpZiBxdWVyeSBkb2VzIG5vdCByZXF1aXJlIHR4IGNvbnRleHQgKG90aGVyIHRyYW5zZmVycywgb3V0cHV0cylcbiAgICBpZiAoIU1vbmVyb1dhbGxldFJwYy5pc0NvbnRleHR1YWwocXVlcnlOb3JtYWxpemVkKSkgcmV0dXJuIHRoaXMuZ2V0VHJhbnNmZXJzQXV4KHF1ZXJ5Tm9ybWFsaXplZCk7XG4gICAgXG4gICAgLy8gb3RoZXJ3aXNlIGdldCB0eHMgd2l0aCBmdWxsIG1vZGVscyB0byBmdWxmaWxsIHF1ZXJ5XG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMuZ2V0VHhzKHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkpKSB7XG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5maWx0ZXJUcmFuc2ZlcnMocXVlcnlOb3JtYWxpemVkKSkge1xuICAgICAgICB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb091dHB1dFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvT3V0cHV0V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplT3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIGdldCBvdXRwdXRzIGRpcmVjdGx5IGlmIHF1ZXJ5IGRvZXMgbm90IHJlcXVpcmUgdHggY29udGV4dCAob3RoZXIgb3V0cHV0cywgdHJhbnNmZXJzKVxuICAgIGlmICghTW9uZXJvV2FsbGV0UnBjLmlzQ29udGV4dHVhbChxdWVyeU5vcm1hbGl6ZWQpKSByZXR1cm4gdGhpcy5nZXRPdXRwdXRzQXV4KHF1ZXJ5Tm9ybWFsaXplZCk7XG4gICAgXG4gICAgLy8gb3RoZXJ3aXNlIGdldCB0eHMgd2l0aCBmdWxsIG1vZGVscyB0byBmdWxmaWxsIHF1ZXJ5XG4gICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLmdldFR4cyhxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpKSkge1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmZpbHRlck91dHB1dHMocXVlcnlOb3JtYWxpemVkKSkge1xuICAgICAgICBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dHB1dHM7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE91dHB1dHMoYWxsID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X291dHB1dHNcIiwge2FsbDogYWxsfSkpLnJlc3VsdC5vdXRwdXRzX2RhdGFfaGV4O1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXg6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbXBvcnRfb3V0cHV0c1wiLCB7b3V0cHV0c19kYXRhX2hleDogb3V0cHV0c0hleH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5udW1faW1wb3J0ZWQ7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydEtleUltYWdlcyhhbGwgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQ+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5ycGNFeHBvcnRLZXlJbWFnZXMoYWxsKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlczogTW9uZXJvS2V5SW1hZ2VbXSwgb2Zmc2V0ID0gMCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQ+IHtcbiAgICBcbiAgICAvLyBjb252ZXJ0IGtleSBpbWFnZXMgdG8gcnBjIHBhcmFtZXRlclxuICAgIGxldCBycGNLZXlJbWFnZXMgPSBrZXlJbWFnZXMubWFwKGtleUltYWdlID0+ICh7a2V5X2ltYWdlOiBrZXlJbWFnZS5nZXRIZXgoKSwgc2lnbmF0dXJlOiBrZXlJbWFnZS5nZXRTaWduYXR1cmUoKX0pKTtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9rZXlfaW1hZ2VzXCIsIHtzaWduZWRfa2V5X2ltYWdlczogcnBjS2V5SW1hZ2VzLCBvZmZzZXQ6IG9mZnNldH0pO1xuICAgIFxuICAgIC8vIGJ1aWxkIGFuZCByZXR1cm4gcmVzdWx0XG4gICAgbGV0IGltcG9ydFJlc3VsdCA9IG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCgpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRIZWlnaHQocmVzcC5yZXN1bHQuaGVpZ2h0KTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0U3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnNwZW50KSk7XG4gICAgaW1wb3J0UmVzdWx0LnNldFVuc3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnVuc3BlbnQpKTtcbiAgICByZXR1cm4gaW1wb3J0UmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMucnBjRXhwb3J0S2V5SW1hZ2VzKGZhbHNlKSkuZ2V0S2V5SW1hZ2VzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImZyZWV6ZVwiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICB9XG4gIFxuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidGhhd1wiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICB9XG4gIFxuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmcm96ZW5cIiwge2tleV9pbWFnZToga2V5SW1hZ2V9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuZnJvemVuID09PSB0cnVlO1xuICB9XG5cbiAgYXN5bmMgZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCk6IFByb21pc2U8TW9uZXJvVHhQcmlvcml0eT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2RlZmF1bHRfZmVlX3ByaW9yaXR5XCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5wcmlvcml0eTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSwgY29weSwgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRDYW5TcGxpdCh0cnVlKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpID09PSB0cnVlICYmIGF3YWl0IHRoaXMuaXNNdWx0aXNpZygpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcmVsYXkgbXVsdGlzaWcgdHJhbnNhY3Rpb24gdW50aWwgY28tc2lnbmVkXCIpO1xuXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3NlcyB0byBzZW5kIGZyb21cbiAgICBsZXQgYWNjb3VudElkeCA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHRoZSBhY2NvdW50IGluZGV4IHRvIHNlbmQgZnJvbVwiKTtcbiAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5zbGljZSgwKTsgLy8gZmV0Y2ggYWxsIG9yIGNvcHkgZ2l2ZW4gaW5kaWNlc1xuICAgIFxuICAgIC8vIGJ1aWxkIGNvbmZpZyBwYXJhbWV0ZXJzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmRlc3RpbmF0aW9ucyA9IFtdO1xuICAgIGZvciAobGV0IGRlc3RpbmF0aW9uIG9mIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0RGVzdGluYXRpb25zKCkpIHtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIFwiRGVzdGluYXRpb24gYWRkcmVzcyBpcyBub3QgZGVmaW5lZFwiKTtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBbW91bnQoKSwgXCJEZXN0aW5hdGlvbiBhbW91bnQgaXMgbm90IGRlZmluZWRcIik7XG4gICAgICBwYXJhbXMuZGVzdGluYXRpb25zLnB1c2goeyBhZGRyZXNzOiBkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIGFtb3VudDogZGVzdGluYXRpb24uZ2V0QW1vdW50KCkudG9TdHJpbmcoKSB9KTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkpIHBhcmFtcy5zdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzID0gY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IHN1YmFkZHJlc3NJbmRpY2VzO1xuICAgIHBhcmFtcy5wYXltZW50X2lkID0gY29uZmlnTm9ybWFsaXplZC5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpICE9PSB0cnVlO1xuICAgIGFzc2VydChjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSBwYXJhbXMuZ2V0X3R4X2tleXMgPSB0cnVlOyAvLyBwYXJhbSB0byBnZXQgdHgga2V5KHMpIGRlcGVuZHMgaWYgc3BsaXRcbiAgICBlbHNlIHBhcmFtcy5nZXRfdHhfa2V5ID0gdHJ1ZTtcblxuICAgIC8vIGNhbm5vdCBhcHBseSBzdWJ0cmFjdEZlZUZyb20gd2l0aCBgdHJhbnNmZXJfc3BsaXRgIGNhbGxcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKS5sZW5ndGggPiAwKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJzdWJ0cmFjdGZlZWZyb20gdHJhbnNmZXJzIGNhbm5vdCBiZSBzcGxpdCBvdmVyIG11bHRpcGxlIHRyYW5zYWN0aW9ucyB5ZXRcIik7XG4gICAgfVxuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IFwidHJhbnNmZXJfc3BsaXRcIiA6IFwidHJhbnNmZXJcIiwgcGFyYW1zKTtcbiAgICAgIHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIldBTExFVF9SUENfRVJST1JfQ09ERV9XUk9OR19BRERSRVNTXCIpID4gLTEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgZGVzdGluYXRpb24gYWRkcmVzc1wiKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gICAgXG4gICAgLy8gcHJlLWluaXRpYWxpemUgdHhzIGlmZiBwcmVzZW50LiBtdWx0aXNpZyBhbmQgdmlldy1vbmx5IHdhbGxldHMgd2lsbCBoYXZlIHR4IHNldCB3aXRob3V0IHRyYW5zYWN0aW9uc1xuICAgIGxldCB0eHM7XG4gICAgbGV0IG51bVR4cyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IChyZXN1bHQuZmVlX2xpc3QgIT09IHVuZGVmaW5lZCA/IHJlc3VsdC5mZWVfbGlzdC5sZW5ndGggOiAwKSA6IChyZXN1bHQuZmVlICE9PSB1bmRlZmluZWQgPyAxIDogMCk7XG4gICAgaWYgKG51bVR4cyA+IDApIHR4cyA9IFtdO1xuICAgIGxldCBjb3B5RGVzdGluYXRpb25zID0gbnVtVHhzID09PSAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVHhzOyBpKyspIHtcbiAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgICAgTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnTm9ybWFsaXplZCwgdHgsIGNvcHlEZXN0aW5hdGlvbnMpO1xuICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcyAhPT0gdW5kZWZpbmVkICYmIHN1YmFkZHJlc3NJbmRpY2VzLmxlbmd0aCA9PT0gMSkgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldFN1YmFkZHJlc3NJbmRpY2VzKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHNldCBmcm9tIHJwYyByZXNwb25zZSB3aXRoIHByZS1pbml0aWFsaXplZCB0eHNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQsIHR4cywgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gICAgZWxzZSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFRvVHhTZXQocmVzdWx0LCB0eHMgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHR4c1swXSwgdHJ1ZSwgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBidWlsZCByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCk7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBjb25maWcuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpO1xuICAgIHBhcmFtcy5rZXlfaW1hZ2UgPSBjb25maWcuZ2V0S2V5SW1hZ2UoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgIT09IHRydWU7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWcuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWcuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZy5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2tleSA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9oZXggPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfbWV0YWRhdGEgPSB0cnVlO1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfc2luZ2xlXCIsIHBhcmFtcyk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZy5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBidWlsZCBhbmQgcmV0dXJuIHR4XG4gICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnLCB1bmRlZmluZWQsIHRydWUpO1xuICAgIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhUb1R4U2V0KHJlc3VsdCwgdHgsIHRydWUsIGNvbmZpZyk7XG4gICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpWzBdLnNldEFtb3VudCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkpOyAvLyBpbml0aWFsaXplIGRlc3RpbmF0aW9uIGFtb3VudFxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwOyBkZWZhdWx0IHRvIGFsbCB3aXRoIHVubG9ja2VkIGJhbGFuY2UgaWYgbm90IHNwZWNpZmllZFxuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpOyAgLy8gbWFwcyBlYWNoIGFjY291bnQgaW5kZXggdG8gc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGluZGljZXMuc2V0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCksIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgaW5kaWNlcy5zZXQoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkpKSB7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgPiAwbikgc3ViYWRkcmVzc0luZGljZXMucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBhY2NvdW50cyA9IGF3YWl0IHRoaXMuZ2V0QWNjb3VudHModHJ1ZSk7XG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICAgIGlmIChhY2NvdW50LmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgICBpbmRpY2VzLnNldChhY2NvdW50LmdldEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc3dlZXAgZnJvbSBlYWNoIGFjY291bnQgYW5kIGNvbGxlY3QgcmVzdWx0aW5nIHR4IHNldHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYWNjb3VudElkeCBvZiBpbmRpY2VzLmtleXMoKSkge1xuICAgICAgXG4gICAgICAvLyBjb3B5IGFuZCBtb2RpZnkgdGhlIG9yaWdpbmFsIGNvbmZpZ1xuICAgICAgbGV0IGNvcHkgPSBjb25maWdOb3JtYWxpemVkLmNvcHkoKTtcbiAgICAgIGNvcHkuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgY29weS5zZXRTd2VlcEVhY2hTdWJhZGRyZXNzKGZhbHNlKTtcbiAgICAgIFxuICAgICAgLy8gc3dlZXAgYWxsIHN1YmFkZHJlc3NlcyB0b2dldGhlciAgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogY2FuIHRoaXMgcmV2ZWFsIG91dHB1dHMgYmVsb25nIHRvIHRoZSBzYW1lIHdhbGxldD9cbiAgICAgIGlmIChjb3B5LmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSAhPT0gdHJ1ZSkge1xuICAgICAgICBjb3B5LnNldFN1YmFkZHJlc3NJbmRpY2VzKGluZGljZXMuZ2V0KGFjY291bnRJZHgpKTtcbiAgICAgICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5ycGNTd2VlcEFjY291bnQoY29weSkpIHR4cy5wdXNoKHR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gb3RoZXJ3aXNlIHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyBpbmRpdmlkdWFsbHlcbiAgICAgIGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzSWR4IG9mIGluZGljZXMuZ2V0KGFjY291bnRJZHgpKSB7XG4gICAgICAgICAgY29weS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhbc3ViYWRkcmVzc0lkeF0pO1xuICAgICAgICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMucnBjU3dlZXBBY2NvdW50KGNvcHkpKSB0eHMucHVzaCh0eCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcER1c3QocmVsYXk/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHJlbGF5ID09PSB1bmRlZmluZWQpIHJlbGF5ID0gZmFsc2U7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzd2VlcF9kdXN0XCIsIHtkb19ub3RfcmVsYXk6ICFyZWxheX0pO1xuICAgIGlmIChyZWxheSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzdWx0KTtcbiAgICBpZiAodHhTZXQuZ2V0VHhzKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQoIXJlbGF5KTtcbiAgICAgIHR4LnNldEluVHhQb29sKHR4LmdldElzUmVsYXllZCgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0LmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhczogKE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKVtdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eEhhc2hlcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykge1xuICAgICAgbGV0IG1ldGFkYXRhID0gdHhPck1ldGFkYXRhIGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQgPyB0eE9yTWV0YWRhdGEuZ2V0TWV0YWRhdGEoKSA6IHR4T3JNZXRhZGF0YTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVsYXlfdHhcIiwgeyBoZXg6IG1ldGFkYXRhIH0pO1xuICAgICAgdHhIYXNoZXMucHVzaChyZXNwLnJlc3VsdC50eF9oYXNoKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7IC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgcmV0dXJuIHR4SGFzaGVzO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImRlc2NyaWJlX3RyYW5zZmVyXCIsIHtcbiAgICAgIHVuc2lnbmVkX3R4c2V0OiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCksXG4gICAgICBtdWx0aXNpZ190eHNldDogdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpXG4gICAgfSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlcihyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnbl90cmFuc2ZlclwiLCB7XG4gICAgICB1bnNpZ25lZF90eHNldDogdW5zaWduZWRUeEhleCxcbiAgICAgIGV4cG9ydF9yYXc6IHRydWUsXG4gICAgICBnZXRfdHhfa2V5czogdHJ1ZVxuICAgIH0pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfdHJhbnNmZXJcIiwge1xuICAgICAgdHhfZGF0YV9oZXg6IHNpZ25lZFR4SGV4XG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBzaWduYXR1cmVUeXBlID0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgYWNjb3VudElkeCA9IDAsIHN1YmFkZHJlc3NJZHggPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25cIiwge1xuICAgICAgICBkYXRhOiBtZXNzYWdlLFxuICAgICAgICBzaWduYXR1cmVfdHlwZTogc2lnbmF0dXJlVHlwZSA9PT0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA/IFwic3BlbmRcIiA6IFwidmlld1wiLFxuICAgICAgICBhY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LFxuICAgICAgICBhZGRyZXNzX2luZGV4OiBzdWJhZGRyZXNzSWR4XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQ+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ2ZXJpZnlcIiwge2RhdGE6IG1lc3NhZ2UsIGFkZHJlc3M6IGFkZHJlc3MsIHNpZ25hdHVyZTogc2lnbmF0dXJlfSk7XG4gICAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQoXG4gICAgICAgIHJlc3VsdC5nb29kID8ge2lzR29vZDogcmVzdWx0Lmdvb2QsIGlzT2xkOiByZXN1bHQub2xkLCBzaWduYXR1cmVUeXBlOiByZXN1bHQuc2lnbmF0dXJlX3R5cGUgPT09IFwidmlld1wiID8gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1ZJRVdfS0VZIDogTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgdmVyc2lvbjogcmVzdWx0LnZlcnNpb259IDoge2lzR29vZDogZmFsc2V9XG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMikgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KHtpc0dvb2Q6IGZhbHNlfSk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9rZXlcIiwge3R4aWQ6IHR4SGFzaH0pKS5yZXN1bHQudHhfa2V5O1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaDogc3RyaW5nLCB0eEtleTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfdHhfa2V5XCIsIHt0eGlkOiB0eEhhc2gsIHR4X2tleTogdHhLZXksIGFkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICAgIFxuICAgICAgLy8gaW50ZXJwcmV0IHJlc3VsdFxuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZCh0cnVlKTtcbiAgICAgIGNoZWNrLnNldE51bUNvbmZpcm1hdGlvbnMocmVzcC5yZXN1bHQuY29uZmlybWF0aW9ucyk7XG4gICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgIGNoZWNrLnNldFJlY2VpdmVkQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5yZWNlaXZlZCkpO1xuICAgICAgcmV0dXJuIGNoZWNrO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9wcm9vZlwiLCB7dHhpZDogdHhIYXNoLCBhZGRyZXNzOiBhZGRyZXNzLCBtZXNzYWdlOiBtZXNzYWdlfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja190eF9wcm9vZlwiLCB7XG4gICAgICAgIHR4aWQ6IHR4SGFzaCxcbiAgICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBpbnRlcnByZXQgcmVzcG9uc2VcbiAgICAgIGxldCBpc0dvb2QgPSByZXNwLnJlc3VsdC5nb29kO1xuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZChpc0dvb2QpO1xuICAgICAgaWYgKGlzR29vZCkge1xuICAgICAgICBjaGVjay5zZXROdW1Db25maXJtYXRpb25zKHJlc3AucmVzdWx0LmNvbmZpcm1hdGlvbnMpO1xuICAgICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgICAgY2hlY2suc2V0UmVjZWl2ZWRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnJlY2VpdmVkKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2hlY2s7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtMSAmJiBlLm1lc3NhZ2UgPT09IFwiYmFzaWNfc3RyaW5nXCIpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJNdXN0IHByb3ZpZGUgc2lnbmF0dXJlIHRvIGNoZWNrIHR4IHByb29mXCIsIC0xKTtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfc3BlbmRfcHJvb2ZcIiwge3R4aWQ6IHR4SGFzaCwgbWVzc2FnZTogbWVzc2FnZX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfc3BlbmRfcHJvb2ZcIiwge1xuICAgICAgICB0eGlkOiB0eEhhc2gsXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC5nb29kO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhbGw6IHRydWUsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGFtb3VudDogYmlnaW50LCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFjY291bnRfaW5kZXg6IGFjY291bnRJZHgsXG4gICAgICBhbW91bnQ6IGFtb3VudC50b1N0cmluZygpLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gIH1cblxuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT4ge1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgfSk7XG4gICAgXG4gICAgLy8gaW50ZXJwcmV0IHJlc3VsdHNcbiAgICBsZXQgaXNHb29kID0gcmVzcC5yZXN1bHQuZ29vZDtcbiAgICBsZXQgY2hlY2sgPSBuZXcgTW9uZXJvQ2hlY2tSZXNlcnZlKCk7XG4gICAgY2hlY2suc2V0SXNHb29kKGlzR29vZCk7XG4gICAgaWYgKGlzR29vZCkge1xuICAgICAgY2hlY2suc2V0VW5jb25maXJtZWRTcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQuc3BlbnQpKTtcbiAgICAgIGNoZWNrLnNldFRvdGFsQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC50b3RhbCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hlY2s7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3R4X25vdGVzXCIsIHt0eGlkczogdHhIYXNoZXN9KSkucmVzdWx0Lm5vdGVzO1xuICB9XG4gIFxuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSwgbm90ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X3R4X25vdGVzXCIsIHt0eGlkczogdHhIYXNoZXMsIG5vdGVzOiBub3Rlc30pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb0FkZHJlc3NCb29rRW50cnlbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NfYm9va1wiLCB7ZW50cmllczogZW50cnlJbmRpY2VzfSk7XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5lbnRyaWVzKSByZXR1cm4gW107XG4gICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNFbnRyeSBvZiByZXNwLnJlc3VsdC5lbnRyaWVzKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb0FkZHJlc3NCb29rRW50cnkoKS5zZXRJbmRleChycGNFbnRyeS5pbmRleCkuc2V0QWRkcmVzcyhycGNFbnRyeS5hZGRyZXNzKS5zZXREZXNjcmlwdGlvbihycGNFbnRyeS5kZXNjcmlwdGlvbikuc2V0UGF5bWVudElkKHJwY0VudHJ5LnBheW1lbnRfaWQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzczogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhZGRfYWRkcmVzc19ib29rXCIsIHthZGRyZXNzOiBhZGRyZXNzLCBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb259KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuaW5kZXg7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4OiBudW1iZXIsIHNldEFkZHJlc3M6IGJvb2xlYW4sIGFkZHJlc3M6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2V0RGVzY3JpcHRpb246IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImVkaXRfYWRkcmVzc19ib29rXCIsIHtcbiAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgIHNldF9hZGRyZXNzOiBzZXRBZGRyZXNzLFxuICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgIHNldF9kZXNjcmlwdGlvbjogc2V0RGVzY3JpcHRpb24sXG4gICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZGVsZXRlX2FkZHJlc3NfYm9va1wiLCB7aW5kZXg6IGVudHJ5SWR4fSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRhZ0FjY291bnRzKHRhZywgYWNjb3VudEluZGljZXMpIHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ0YWdfYWNjb3VudHNcIiwge3RhZzogdGFnLCBhY2NvdW50czogYWNjb3VudEluZGljZXN9KTtcbiAgfVxuXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidW50YWdfYWNjb3VudHNcIiwge2FjY291bnRzOiBhY2NvdW50SW5kaWNlc30pO1xuICB9XG5cbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICBsZXQgdGFncyA9IFtdO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FjY291bnRfdGFnc1wiKTtcbiAgICBpZiAocmVzcC5yZXN1bHQuYWNjb3VudF90YWdzKSB7XG4gICAgICBmb3IgKGxldCBycGNBY2NvdW50VGFnIG9mIHJlc3AucmVzdWx0LmFjY291bnRfdGFncykge1xuICAgICAgICB0YWdzLnB1c2gobmV3IE1vbmVyb0FjY291bnRUYWcoe1xuICAgICAgICAgIHRhZzogcnBjQWNjb3VudFRhZy50YWcgPyBycGNBY2NvdW50VGFnLnRhZyA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBsYWJlbDogcnBjQWNjb3VudFRhZy5sYWJlbCA/IHJwY0FjY291bnRUYWcubGFiZWwgOiB1bmRlZmluZWQsXG4gICAgICAgICAgYWNjb3VudEluZGljZXM6IHJwY0FjY291bnRUYWcuYWNjb3VudHNcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFncztcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9hY2NvdW50X3RhZ19kZXNjcmlwdGlvblwiLCB7dGFnOiB0YWcsIGRlc2NyaXB0aW9uOiBsYWJlbH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXltZW50VXJpKGNvbmZpZzogTW9uZXJvVHhDb25maWcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfdXJpXCIsIHtcbiAgICAgIGFkZHJlc3M6IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksXG4gICAgICBhbW91bnQ6IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSA/IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKS50b1N0cmluZygpIDogdW5kZWZpbmVkLFxuICAgICAgcGF5bWVudF9pZDogY29uZmlnLmdldFBheW1lbnRJZCgpLFxuICAgICAgcmVjaXBpZW50X25hbWU6IGNvbmZpZy5nZXRSZWNpcGllbnROYW1lKCksXG4gICAgICB0eF9kZXNjcmlwdGlvbjogY29uZmlnLmdldE5vdGUoKVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC51cmk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmk6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhDb25maWc+IHtcbiAgICBhc3NlcnQodXJpLCBcIk11c3QgcHJvdmlkZSBVUkkgdG8gcGFyc2VcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJwYXJzZV91cmlcIiwge3VyaTogdXJpfSk7XG4gICAgbGV0IGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyh7YWRkcmVzczogcmVzcC5yZXN1bHQudXJpLmFkZHJlc3MsIGFtb3VudDogQmlnSW50KHJlc3AucmVzdWx0LnVyaS5hbW91bnQpfSk7XG4gICAgY29uZmlnLnNldFBheW1lbnRJZChyZXNwLnJlc3VsdC51cmkucGF5bWVudF9pZCk7XG4gICAgY29uZmlnLnNldFJlY2lwaWVudE5hbWUocmVzcC5yZXN1bHQudXJpLnJlY2lwaWVudF9uYW1lKTtcbiAgICBjb25maWcuc2V0Tm90ZShyZXNwLnJlc3VsdC51cmkudHhfZGVzY3JpcHRpb24pO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpKSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uc2V0QWRkcmVzcyh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0UGF5bWVudElkKCkpIGNvbmZpZy5zZXRQYXltZW50SWQodW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldFJlY2lwaWVudE5hbWUoKSkgY29uZmlnLnNldFJlY2lwaWVudE5hbWUodW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldE5vdGUoKSkgY29uZmlnLnNldE5vdGUodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gY29uZmlnO1xuICB9XG4gIFxuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hdHRyaWJ1dGVcIiwge2tleToga2V5fSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQudmFsdWUgPT09IFwiXCIgPyB1bmRlZmluZWQgOiByZXNwLnJlc3VsdC52YWx1ZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC00NSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBzZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcsIHZhbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2F0dHJpYnV0ZVwiLCB7a2V5OiBrZXksIHZhbHVlOiB2YWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcobnVtVGhyZWFkczogbnVtYmVyLCBiYWNrZ3JvdW5kTWluaW5nPzogYm9vbGVhbiwgaWdub3JlQmF0dGVyeT86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdGFydF9taW5pbmdcIiwge1xuICAgICAgdGhyZWFkc19jb3VudDogbnVtVGhyZWFkcyxcbiAgICAgIGRvX2JhY2tncm91bmRfbWluaW5nOiBiYWNrZ3JvdW5kTWluaW5nLFxuICAgICAgaWdub3JlX2JhdHRlcnk6IGlnbm9yZUJhdHRlcnlcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9wX21pbmluZ1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5tdWx0aXNpZ19pbXBvcnRfbmVlZGVkID09PSB0cnVlO1xuICB9XG4gIFxuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luZm8+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImlzX211bHRpc2lnXCIpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgaW5mbyA9IG5ldyBNb25lcm9NdWx0aXNpZ0luZm8oKTtcbiAgICBpbmZvLnNldElzTXVsdGlzaWcocmVzdWx0Lm11bHRpc2lnKTtcbiAgICBpbmZvLnNldElzUmVhZHkocmVzdWx0LnJlYWR5KTtcbiAgICBpbmZvLnNldFRocmVzaG9sZChyZXN1bHQudGhyZXNob2xkKTtcbiAgICBpbmZvLnNldE51bVBhcnRpY2lwYW50cyhyZXN1bHQudG90YWwpO1xuICAgIHJldHVybiBpbmZvO1xuICB9XG4gIFxuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInByZXBhcmVfbXVsdGlzaWdcIiwge2VuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWw6IHRydWV9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICByZXR1cm4gcmVzdWx0Lm11bHRpc2lnX2luZm87XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgdGhyZXNob2xkOiBudW1iZXIsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibWFrZV9tdWx0aXNpZ1wiLCB7XG4gICAgICBtdWx0aXNpZ19pbmZvOiBtdWx0aXNpZ0hleGVzLFxuICAgICAgdGhyZXNob2xkOiB0aHJlc2hvbGQsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmRcbiAgICB9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5tdWx0aXNpZ19pbmZvO1xuICB9XG4gIFxuICBhc3luYyBleGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleGNoYW5nZV9tdWx0aXNpZ19rZXlzXCIsIHttdWx0aXNpZ19pbmZvOiBtdWx0aXNpZ0hleGVzLCBwYXNzd29yZDogcGFzc3dvcmR9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIGxldCBtc1Jlc3VsdCA9IG5ldyBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQoKTtcbiAgICBtc1Jlc3VsdC5zZXRBZGRyZXNzKHJlc3AucmVzdWx0LmFkZHJlc3MpO1xuICAgIG1zUmVzdWx0LnNldE11bHRpc2lnSGV4KHJlc3AucmVzdWx0Lm11bHRpc2lnX2luZm8pO1xuICAgIGlmIChtc1Jlc3VsdC5nZXRBZGRyZXNzKCkubGVuZ3RoID09PSAwKSBtc1Jlc3VsdC5zZXRBZGRyZXNzKHVuZGVmaW5lZCk7XG4gICAgaWYgKG1zUmVzdWx0LmdldE11bHRpc2lnSGV4KCkubGVuZ3RoID09PSAwKSBtc1Jlc3VsdC5zZXRNdWx0aXNpZ0hleCh1bmRlZmluZWQpO1xuICAgIHJldHVybiBtc1Jlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0TXVsdGlzaWdIZXgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4cG9ydF9tdWx0aXNpZ19pbmZvXCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5pbmZvO1xuICB9XG5cbiAgYXN5bmMgaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHJlZnJlc2hBZnRlckltcG9ydD86IGJvb2xlYW4pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmIChyZWZyZXNoQWZ0ZXJJbXBvcnQgPT09IHVuZGVmaW5lZCkgcmVmcmVzaEFmdGVySW1wb3J0ID0gdHJ1ZTtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkobXVsdGlzaWdIZXhlcykpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBzdHJpbmdbXSB0byBpbXBvcnRNdWx0aXNpZ0hleCgpXCIpXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbXBvcnRfbXVsdGlzaWdfaW5mb1wiLCB7aW5mbzogbXVsdGlzaWdIZXhlcywgcmVmcmVzaF9hZnRlcl9pbXBvcnQ6IHJlZnJlc2hBZnRlckltcG9ydH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5uX291dHB1dHM7XG4gIH1cblxuICBhc3luYyBzaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnU2lnblJlc3VsdD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnbl9tdWx0aXNpZ1wiLCB7dHhfZGF0YV9oZXg6IG11bHRpc2lnVHhIZXh9KTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgbGV0IHNpZ25SZXN1bHQgPSBuZXcgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0KCk7XG4gICAgc2lnblJlc3VsdC5zZXRTaWduZWRNdWx0aXNpZ1R4SGV4KHJlc3VsdC50eF9kYXRhX2hleCk7XG4gICAgc2lnblJlc3VsdC5zZXRUeEhhc2hlcyhyZXN1bHQudHhfaGFzaF9saXN0KTtcbiAgICByZXR1cm4gc2lnblJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3VibWl0X211bHRpc2lnXCIsIHt0eF9kYXRhX2hleDogc2lnbmVkTXVsdGlzaWdUeEhleH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC50eF9oYXNoX2xpc3Q7XG4gIH1cbiAgXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkOiBzdHJpbmcsIG5ld1Bhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hhbmdlX3dhbGxldF9wYXNzd29yZFwiLCB7b2xkX3Bhc3N3b3JkOiBvbGRQYXNzd29yZCB8fCBcIlwiLCBuZXdfcGFzc3dvcmQ6IG5ld1Bhc3N3b3JkIHx8IFwiXCJ9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2F2ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9yZVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgY2xvc2Uoc2F2ZSA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3VwZXIuY2xvc2Uoc2F2ZSk7XG4gICAgaWYgKHNhdmUgPT09IHVuZGVmaW5lZCkgc2F2ZSA9IGZhbHNlO1xuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjbG9zZV93YWxsZXRcIiwge2F1dG9zYXZlX2N1cnJlbnQ6IHNhdmV9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDbG9zZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0UHJpbWFyeUFkZHJlc3MoKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIHJldHVybiBlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC0xMyAmJiBlLm1lc3NhZ2UuaW5kZXhPZihcIk5vIHdhbGxldCBmaWxlXCIpID4gLTE7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNhdmUgYW5kIGNsb3NlIHRoZSBjdXJyZW50IHdhbGxldCBhbmQgc3RvcCB0aGUgUlBDIHNlcnZlci5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdG9wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9wX3dhbGxldFwiKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0gQUREIEpTRE9DIEZPUiBTVVBQT1JURUQgREVGQVVMVCBJTVBMRU1FTlRBVElPTlMgLS0tLS0tLS0tLS0tLS1cblxuICBhc3luYyBnZXROdW1CbG9ja3NUb1VubG9jaygpOiBQcm9taXNlPG51bWJlcltdfHVuZGVmaW5lZD4geyByZXR1cm4gc3VwZXIuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTsgfVxuICBhc3luYyBnZXRUeCh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhXYWxsZXR8dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gpOyB9XG4gIGFzeW5jIGdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBnZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5PikgeyByZXR1cm4gc3VwZXIuZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGNyZWF0ZVR4KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5jcmVhdGVUeChjb25maWcpOyB9XG4gIGFzeW5jIHJlbGF5VHgodHhPck1ldGFkYXRhOiBNb25lcm9UeFdhbGxldCB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5yZWxheVR4KHR4T3JNZXRhZGF0YSk7IH1cbiAgYXN5bmMgZ2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFR4Tm90ZSh0eEhhc2gpOyB9XG4gIGFzeW5jIHNldFR4Tm90ZSh0eEhhc2g6IHN0cmluZywgbm90ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zZXRUeE5vdGUodHhIYXNoLCBub3RlKTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzdGF0aWMgYXN5bmMgY29ubmVjdFRvV2FsbGV0UnBjKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgbGV0IGNvbmZpZyA9IE1vbmVyb1dhbGxldFJwYy5ub3JtYWxpemVDb25maWcodXJpT3JDb25maWcsIHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgaWYgKGNvbmZpZy5jbWQpIHJldHVybiBNb25lcm9XYWxsZXRScGMuc3RhcnRXYWxsZXRScGNQcm9jZXNzKGNvbmZpZyk7XG4gICAgZWxzZSByZXR1cm4gbmV3IE1vbmVyb1dhbGxldFJwYyhjb25maWcpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIHN0YXJ0V2FsbGV0UnBjUHJvY2Vzcyhjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzQXJyYXkoY29uZmlnLmNtZCksIFwiTXVzdCBwcm92aWRlIHN0cmluZyBhcnJheSB3aXRoIGNvbW1hbmQgbGluZSBwYXJhbWV0ZXJzXCIpO1xuICAgIFxuICAgIC8vIHN0YXJ0IHByb2Nlc3NcbiAgICBsZXQgY2hpbGRfcHJvY2VzcyA9IGF3YWl0IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIik7XG4gICAgY29uc3QgY2hpbGRQcm9jZXNzID0gY2hpbGRfcHJvY2Vzcy5zcGF3bihjb25maWcuY21kWzBdLCBjb25maWcuY21kLnNsaWNlKDEpLCB7XG4gICAgICBlbnY6IHsgLi4ucHJvY2Vzcy5lbnYsIExBTkc6ICdlbl9VUy5VVEYtOCcgfSAvLyBzY3JhcGUgb3V0cHV0IGluIGVuZ2xpc2hcbiAgICB9KTtcbiAgICBjaGlsZFByb2Nlc3Muc3Rkb3V0LnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIG1vbmVyby13YWxsZXQtcnBjXG4gICAgbGV0IHVyaTtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgbGV0IG91dHB1dCA9IFwiXCI7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3Rkb3V0XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQub24oJ2RhdGEnLCBhc3luYyBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgbGV0IGxpbmUgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICAgICAgTGlicmFyeVV0aWxzLmxvZygyLCBsaW5lKTtcbiAgICAgICAgICBvdXRwdXQgKz0gbGluZSArICdcXG4nOyAvLyBjYXB0dXJlIG91dHB1dCBpbiBjYXNlIG9mIGVycm9yXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gZXh0cmFjdCB1cmkgZnJvbSBlLmcuIFwiSSBCaW5kaW5nIG9uIDEyNy4wLjAuMSAoSVB2NCk6MzgwODVcIlxuICAgICAgICAgIGxldCB1cmlMaW5lQ29udGFpbnMgPSBcIkJpbmRpbmcgb24gXCI7XG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWluc0lkeCA9IGxpbmUuaW5kZXhPZih1cmlMaW5lQ29udGFpbnMpO1xuICAgICAgICAgIGlmICh1cmlMaW5lQ29udGFpbnNJZHggPj0gMCkge1xuICAgICAgICAgICAgbGV0IGhvc3QgPSBsaW5lLnN1YnN0cmluZyh1cmlMaW5lQ29udGFpbnNJZHggKyB1cmlMaW5lQ29udGFpbnMubGVuZ3RoLCBsaW5lLmxhc3RJbmRleE9mKCcgJykpO1xuICAgICAgICAgICAgbGV0IHVuZm9ybWF0dGVkTGluZSA9IGxpbmUucmVwbGFjZSgvXFx1MDAxYlxcWy4qP20vZywgJycpLnRyaW0oKTsgLy8gcmVtb3ZlIGNvbG9yIGZvcm1hdHRpbmdcbiAgICAgICAgICAgIGxldCBwb3J0ID0gdW5mb3JtYXR0ZWRMaW5lLnN1YnN0cmluZyh1bmZvcm1hdHRlZExpbmUubGFzdEluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgbGV0IHNzbElkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLXNzbFwiKTtcbiAgICAgICAgICAgIGxldCBzc2xFbmFibGVkID0gc3NsSWR4ID49IDAgPyBcImVuYWJsZWRcIiA9PSBjb25maWcuY21kW3NzbElkeCArIDFdLnRvTG93ZXJDYXNlKCkgOiBmYWxzZTtcbiAgICAgICAgICAgIHVyaSA9IChzc2xFbmFibGVkID8gXCJodHRwc1wiIDogXCJodHRwXCIpICsgXCI6Ly9cIiArIGhvc3QgKyBcIjpcIiArIHBvcnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlYWQgc3VjY2VzcyBtZXNzYWdlXG4gICAgICAgICAgaWYgKGxpbmUuaW5kZXhPZihcIlN0YXJ0aW5nIHdhbGxldCBSUEMgc2VydmVyXCIpID49IDApIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gZ2V0IHVzZXJuYW1lLCBwYXNzd29yZCwgem1xIHB1Ymxpc2ggdXJpLCBhbmQgcHJveHkgdXJpIGZyb20gcGFyYW1zXG4gICAgICAgICAgICBsZXQgdXNlclBhc3NJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXJwYy1sb2dpblwiKTtcbiAgICAgICAgICAgIGxldCB1c2VyUGFzcyA9IHVzZXJQYXNzSWR4ID49IDAgPyBjb25maWcuY21kW3VzZXJQYXNzSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSB1c2VyUGFzcyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdXNlclBhc3Muc3Vic3RyaW5nKDAsIHVzZXJQYXNzLmluZGV4T2YoJzonKSk7XG4gICAgICAgICAgICBsZXQgcGFzc3dvcmQgPSB1c2VyUGFzcyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdXNlclBhc3Muc3Vic3RyaW5nKHVzZXJQYXNzLmluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgbGV0IHptcVVyaUlkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tem1xLXB1YlwiKTtcbiAgICAgICAgICAgIGxldCB6bXFVcmkgPSB6bXFVcmlJZHggPj0gMCA/IGNvbmZpZy5jbWRbem1xVXJpSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgcHJveHlVcmlJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXByb3h5XCIpO1xuICAgICAgICAgICAgdGhpcy5zdGFydHVwUHJveHlVcmkgPSBwcm94eVVyaUlkeCA+PSAwID8gY29uZmlnLmNtZFtwcm94eVVyaUlkeCArIDFdIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBjcmVhdGUgY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzXG4gICAgICAgICAgICBjb25maWcgPSBjb25maWcuY29weSgpLnNldFNlcnZlcih7dXJpOiB1cmksIHVzZXJuYW1lOiB1c2VybmFtZSwgcGFzc3dvcmQ6IHBhc3N3b3JkLCB6bXFVcmk6IHptcVVyaSwgcHJveHlVcmk6IHRoaXMuc3RhcnR1cFByb3h5VXJpLCByZWplY3RVbmF1dGhvcml6ZWQ6IGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZH0pO1xuICAgICAgICAgICAgY29uZmlnLmNtZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRScGMuY29ubmVjdFRvV2FsbGV0UnBjKGNvbmZpZyk7XG4gICAgICAgICAgICB3YWxsZXQucHJvY2VzcyA9IGNoaWxkUHJvY2VzcztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gcmVzb2x2ZSBwcm9taXNlIHdpdGggY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzIFxuICAgICAgICAgICAgdGhpcy5pc1Jlc29sdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmUod2FsbGV0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHN0ZGVyclxuICAgICAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBjb25zb2xlLmVycm9yKGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBleGl0XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcImV4aXRcIiwgZnVuY3Rpb24oY29kZSkge1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgcHJvY2VzcyB0ZXJtaW5hdGVkIHdpdGggZXhpdCBjb2RlIFwiICsgY29kZSArIChvdXRwdXQgPyBcIjpcXG5cXG5cIiArIG91dHB1dCA6IFwiXCIpKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIGVycm9yXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcImVycm9yXCIsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIGlmIChlcnIubWVzc2FnZS5pbmRleE9mKFwiRU5PRU5UXCIpID49IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBleGlzdCBhdCBwYXRoICdcIiArIGNvbmZpZy5jbWRbMF0gKyBcIidcIikpO1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgdW5jYXVnaHQgZXhjZXB0aW9uXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcInVuY2F1Z2h0RXhjZXB0aW9uXCIsIGZ1bmN0aW9uKGVyciwgb3JpZ2luKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuY2F1Z2h0IGV4Y2VwdGlvbiBpbiBtb25lcm8td2FsbGV0LXJwYyBwcm9jZXNzOiBcIiArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKG9yaWdpbik7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNsZWFyKCkge1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICAgIGRlbGV0ZSB0aGlzLmFkZHJlc3NDYWNoZTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIHRoaXMucGF0aCA9IHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldEFjY291bnRJbmRpY2VzKGdldFN1YmFkZHJlc3NJbmRpY2VzPzogYW55KSB7XG4gICAgbGV0IGluZGljZXMgPSBuZXcgTWFwKCk7XG4gICAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCB0aGlzLmdldEFjY291bnRzKCkpIHtcbiAgICAgIGluZGljZXMuc2V0KGFjY291bnQuZ2V0SW5kZXgoKSwgZ2V0U3ViYWRkcmVzc0luZGljZXMgPyBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NJbmRpY2VzKGFjY291bnQuZ2V0SW5kZXgoKSkgOiB1bmRlZmluZWQpO1xuICAgIH1cbiAgICByZXR1cm4gaW5kaWNlcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldFN1YmFkZHJlc3NJbmRpY2VzKGFjY291bnRJZHgpIHtcbiAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzXCIsIHthY2NvdW50X2luZGV4OiBhY2NvdW50SWR4fSk7XG4gICAgZm9yIChsZXQgYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5hZGRyZXNzZXMpIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goYWRkcmVzcy5hZGRyZXNzX2luZGV4KTtcbiAgICByZXR1cm4gc3ViYWRkcmVzc0luZGljZXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRUcmFuc2ZlcnNBdXgocXVlcnk6IE1vbmVyb1RyYW5zZmVyUXVlcnkpIHtcbiAgICBcbiAgICAvLyBidWlsZCBwYXJhbXMgZm9yIGdldF90cmFuc2ZlcnMgcnBjIGNhbGxcbiAgICBsZXQgdHhRdWVyeSA9IHF1ZXJ5LmdldFR4UXVlcnkoKTtcbiAgICBsZXQgY2FuQmVDb25maXJtZWQgPSB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJc1JlbGF5ZWQoKSAhPT0gZmFsc2U7XG4gICAgbGV0IGNhbkJlSW5UeFBvb2wgPSB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9PSBmYWxzZSAmJiB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCAmJiB0eFF1ZXJ5LmdldElzTG9ja2VkKCkgIT09IGZhbHNlO1xuICAgIGxldCBjYW5CZUluY29taW5nID0gcXVlcnkuZ2V0SXNJbmNvbWluZygpICE9PSBmYWxzZSAmJiBxdWVyeS5nZXRJc091dGdvaW5nKCkgIT09IHRydWUgJiYgcXVlcnkuZ2V0SGFzRGVzdGluYXRpb25zKCkgIT09IHRydWU7XG4gICAgbGV0IGNhbkJlT3V0Z29pbmcgPSBxdWVyeS5nZXRJc091dGdvaW5nKCkgIT09IGZhbHNlICYmIHF1ZXJ5LmdldElzSW5jb21pbmcoKSAhPT0gdHJ1ZTtcblxuICAgIC8vIGNoZWNrIGlmIGZldGNoaW5nIHBvb2wgdHhzIGNvbnRyYWRpY3RlZCBieSBjb25maWd1cmF0aW9uXG4gICAgaWYgKHR4UXVlcnkuZ2V0SW5UeFBvb2woKSA9PT0gdHJ1ZSAmJiAhY2FuQmVJblR4UG9vbCkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IGZldGNoIHBvb2wgdHJhbnNhY3Rpb25zIGJlY2F1c2UgaXQgY29udHJhZGljdHMgY29uZmlndXJhdGlvblwiKTtcbiAgICB9XG5cbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuaW4gPSBjYW5CZUluY29taW5nICYmIGNhbkJlQ29uZmlybWVkO1xuICAgIHBhcmFtcy5vdXQgPSBjYW5CZU91dGdvaW5nICYmIGNhbkJlQ29uZmlybWVkO1xuICAgIHBhcmFtcy5wb29sID0gY2FuQmVJbmNvbWluZyAmJiBjYW5CZUluVHhQb29sO1xuICAgIHBhcmFtcy5wZW5kaW5nID0gY2FuQmVPdXRnb2luZyAmJiBjYW5CZUluVHhQb29sO1xuICAgIHBhcmFtcy5mYWlsZWQgPSB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT0gdHJ1ZTtcbiAgICBpZiAodHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHhRdWVyeS5nZXRNaW5IZWlnaHQoKSA+IDApIHBhcmFtcy5taW5faGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAtIDE7IC8vIFRPRE8gbW9uZXJvLXByb2plY3Q6IHdhbGxldDI6OmdldF9wYXltZW50cygpIG1pbl9oZWlnaHQgaXMgZXhjbHVzaXZlLCBzbyBtYW51YWxseSBvZmZzZXQgdG8gbWF0Y2ggaW50ZW5kZWQgcmFuZ2UgKGlzc3VlcyAjNTc1MSwgIzU1OTgpXG4gICAgICBlbHNlIHBhcmFtcy5taW5faGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKTtcbiAgICB9XG4gICAgaWYgKHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgcGFyYW1zLm1heF9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1heEhlaWdodCgpO1xuICAgIHBhcmFtcy5maWx0ZXJfYnlfaGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAhPT0gdW5kZWZpbmVkIHx8IHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgIT09IHVuZGVmaW5lZDtcbiAgICBpZiAocXVlcnkuZ2V0QWNjb3VudEluZGV4KCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0KHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpID09PSB1bmRlZmluZWQgJiYgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkLCBcIlF1ZXJ5IHNwZWNpZmllcyBhIHN1YmFkZHJlc3MgaW5kZXggYnV0IG5vdCBhbiBhY2NvdW50IGluZGV4XCIpO1xuICAgICAgcGFyYW1zLmFsbF9hY2NvdW50cyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gcXVlcnkuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgICBcbiAgICAgIC8vIHNldCBzdWJhZGRyZXNzIGluZGljZXMgcGFyYW1cbiAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IG5ldyBTZXQoKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAhPT0gdW5kZWZpbmVkKSBzdWJhZGRyZXNzSW5kaWNlcy5hZGQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5tYXAoc3ViYWRkcmVzc0lkeCA9PiBzdWJhZGRyZXNzSW5kaWNlcy5hZGQoc3ViYWRkcmVzc0lkeCkpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJbmRpY2VzLnNpemUpIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBBcnJheS5mcm9tKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgdW5pcXVlIHR4cyBhbmQgYmxvY2tzXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgXG4gICAgLy8gYnVpbGQgdHhzIHVzaW5nIGBnZXRfdHJhbnNmZXJzYFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3RyYW5zZmVyc1wiLCBwYXJhbXMpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhyZXNwLnJlc3VsdCkpIHtcbiAgICAgIGZvciAobGV0IHJwY1R4IG9mIHJlc3AucmVzdWx0W2tleV0pIHtcbiAgICAgICAgLy9pZiAocnBjVHgudHhpZCA9PT0gcXVlcnkuZGVidWdUeElkKSBjb25zb2xlLmxvZyhycGNUeCk7XG4gICAgICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHgpO1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkgYXNzZXJ0KHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCkgPiAtMSk7XG4gICAgICAgIFxuICAgICAgICAvLyByZXBsYWNlIHRyYW5zZmVyIGFtb3VudCB3aXRoIGRlc3RpbmF0aW9uIHN1bVxuICAgICAgICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBjb25maXJtZWQgdHggZnJvbS90byBzYW1lIGFjY291bnQgaGFzIGFtb3VudCAwIGJ1dCBjYWNoZWQgdHJhbnNmZXJzXG4gICAgICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRJc1JlbGF5ZWQoKSAmJiAhdHguZ2V0SXNGYWlsZWQoKSAmJlxuICAgICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpICYmIHR4LmdldE91dGdvaW5nQW1vdW50KCkgPT09IDBuKSB7XG4gICAgICAgICAgbGV0IG91dGdvaW5nVHJhbnNmZXIgPSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgICAgICAgbGV0IHRyYW5zZmVyVG90YWwgPSBCaWdJbnQoMCk7XG4gICAgICAgICAgZm9yIChsZXQgZGVzdGluYXRpb24gb2Ygb3V0Z29pbmdUcmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKSkgdHJhbnNmZXJUb3RhbCA9IHRyYW5zZmVyVG90YWwgKyBkZXN0aW5hdGlvbi5nZXRBbW91bnQoKTtcbiAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0QW1vdW50KHRyYW5zZmVyVG90YWwpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBtZXJnZSB0eFxuICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc29ydCB0eHMgYnkgYmxvY2sgaGVpZ2h0XG4gICAgbGV0IHR4czogTW9uZXJvVHhXYWxsZXRbXSA9IE9iamVjdC52YWx1ZXModHhNYXApO1xuICAgIHR4cy5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQpO1xuICAgIFxuICAgIC8vIGZpbHRlciBhbmQgcmV0dXJuIHRyYW5zZmVyc1xuICAgIGxldCB0cmFuc2ZlcnMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIFxuICAgICAgLy8gdHggaXMgbm90IGluY29taW5nL291dGdvaW5nIHVubGVzcyBhbHJlYWR5IHNldFxuICAgICAgaWYgKHR4LmdldElzSW5jb21pbmcoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0luY29taW5nKGZhbHNlKTtcbiAgICAgIGlmICh0eC5nZXRJc091dGdvaW5nKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNPdXRnb2luZyhmYWxzZSk7XG4gICAgICBcbiAgICAgIC8vIHNvcnQgaW5jb21pbmcgdHJhbnNmZXJzXG4gICAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVJbmNvbWluZ1RyYW5zZmVycyk7XG4gICAgICBcbiAgICAgIC8vIGNvbGxlY3QgcXVlcmllZCB0cmFuc2ZlcnMsIGVyYXNlIGlmIGV4Y2x1ZGVkXG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5maWx0ZXJUcmFuc2ZlcnMocXVlcnkpKSB7XG4gICAgICAgIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcmVtb3ZlIHR4cyB3aXRob3V0IHJlcXVlc3RlZCB0cmFuc2ZlclxuICAgICAgaWYgKHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT09IHVuZGVmaW5lZCAmJiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRPdXRwdXRzQXV4KHF1ZXJ5KSB7XG4gICAgXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBiZSBxdWVyaWVkXG4gICAgbGV0IGluZGljZXMgPSBuZXcgTWFwKCk7XG4gICAgaWYgKHF1ZXJ5LmdldEFjY291bnRJbmRleCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IG5ldyBTZXQoKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAhPT0gdW5kZWZpbmVkKSBzdWJhZGRyZXNzSW5kaWNlcy5hZGQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5tYXAoc3ViYWRkcmVzc0lkeCA9PiBzdWJhZGRyZXNzSW5kaWNlcy5hZGQoc3ViYWRkcmVzc0lkeCkpO1xuICAgICAgaW5kaWNlcy5zZXQocXVlcnkuZ2V0QWNjb3VudEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzLnNpemUgPyBBcnJheS5mcm9tKHN1YmFkZHJlc3NJbmRpY2VzKSA6IHVuZGVmaW5lZCk7ICAvLyB1bmRlZmluZWQgd2lsbCBmZXRjaCBmcm9tIGFsbCBzdWJhZGRyZXNzZXNcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXJ0LmVxdWFsKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpLCB1bmRlZmluZWQsIFwiUXVlcnkgc3BlY2lmaWVzIGEgc3ViYWRkcmVzcyBpbmRleCBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIilcbiAgICAgIGFzc2VydChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQgfHwgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDAsIFwiUXVlcnkgc3BlY2lmaWVzIHN1YmFkZHJlc3MgaW5kaWNlcyBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIik7XG4gICAgICBpbmRpY2VzID0gYXdhaXQgdGhpcy5nZXRBY2NvdW50SW5kaWNlcygpOyAgLy8gZmV0Y2ggYWxsIGFjY291bnQgaW5kaWNlcyB3aXRob3V0IHN1YmFkZHJlc3Nlc1xuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB1bmlxdWUgdHhzIGFuZCBibG9ja3NcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHR4cyB3aXRoIG91dHB1dHMgZm9yIGVhY2ggaW5kaWNhdGVkIGFjY291bnQgdXNpbmcgYGluY29taW5nX3RyYW5zZmVyc2AgcnBjIGNhbGxcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMudHJhbnNmZXJfdHlwZSA9IHF1ZXJ5LmdldElzU3BlbnQoKSA9PT0gdHJ1ZSA/IFwidW5hdmFpbGFibGVcIiA6IHF1ZXJ5LmdldElzU3BlbnQoKSA9PT0gZmFsc2UgPyBcImF2YWlsYWJsZVwiIDogXCJhbGxcIjtcbiAgICBwYXJhbXMudmVyYm9zZSA9IHRydWU7XG4gICAgZm9yIChsZXQgYWNjb3VudElkeCBvZiBpbmRpY2VzLmtleXMoKSkge1xuICAgIFxuICAgICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gaW5kaWNlcy5nZXQoYWNjb3VudElkeCk7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImluY29taW5nX3RyYW5zZmVyc1wiLCBwYXJhbXMpO1xuICAgICAgXG4gICAgICAvLyBjb252ZXJ0IHJlc3BvbnNlIHRvIHR4cyB3aXRoIG91dHB1dHMgYW5kIG1lcmdlXG4gICAgICBpZiAocmVzcC5yZXN1bHQudHJhbnNmZXJzID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuICAgICAgZm9yIChsZXQgcnBjT3V0cHV0IG9mIHJlc3AucmVzdWx0LnRyYW5zZmVycykge1xuICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aE91dHB1dChycGNPdXRwdXQpO1xuICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc29ydCB0eHMgYnkgYmxvY2sgaGVpZ2h0XG4gICAgbGV0IHR4czogTW9uZXJvVHhXYWxsZXRbXSA9IE9iamVjdC52YWx1ZXModHhNYXApO1xuICAgIHR4cy5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQpO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgcXVlcmllZCBvdXRwdXRzXG4gICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIFxuICAgICAgLy8gc29ydCBvdXRwdXRzXG4gICAgICBpZiAodHguZ2V0T3V0cHV0cygpICE9PSB1bmRlZmluZWQpIHR4LmdldE91dHB1dHMoKS5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlT3V0cHV0cyk7XG4gICAgICBcbiAgICAgIC8vIGNvbGxlY3QgcXVlcmllZCBvdXRwdXRzLCBlcmFzZSBpZiBleGNsdWRlZFxuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmZpbHRlck91dHB1dHMocXVlcnkpKSBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICAgIFxuICAgICAgLy8gcmVtb3ZlIGV4Y2x1ZGVkIHR4cyBmcm9tIGJsb2NrXG4gICAgICBpZiAodHguZ2V0T3V0cHV0cygpID09PSB1bmRlZmluZWQgJiYgdHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbW1vbiBtZXRob2QgdG8gZ2V0IGtleSBpbWFnZXMuXG4gICAqIFxuICAgKiBAcGFyYW0gYWxsIC0gcGVjaWZpZXMgdG8gZ2V0IGFsbCB4b3Igb25seSBuZXcgaW1hZ2VzIGZyb20gbGFzdCBpbXBvcnRcbiAgICogQHJldHVybiB7TW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHR9IHRoZSBrZXkgaW1hZ2VzIGFuZCB0aGVpciBvZmZzZXQgYW1vbmcgdGhlIHdhbGxldCdzIG91dHB1dHNcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBycGNFeHBvcnRLZXlJbWFnZXMoYWxsKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X2tleV9pbWFnZXNcIiwge2FsbDogYWxsfSk7XG4gICAgbGV0IGtleUltYWdlcyA9IChyZXNwLnJlc3VsdC5zaWduZWRfa2V5X2ltYWdlcyB8fCBbXSkubWFwKHJwY0ltYWdlID0+IG5ldyBNb25lcm9LZXlJbWFnZShycGNJbWFnZS5rZXlfaW1hZ2UsIHJwY0ltYWdlLnNpZ25hdHVyZSkpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQoKS5zZXRPZmZzZXQocmVzcC5yZXN1bHQub2Zmc2V0KS5zZXRLZXlJbWFnZXMoa2V5SW1hZ2VzKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIHJwY1N3ZWVwQWNjb3VudChjb25maWc6IE1vbmVyb1R4Q29uZmlnKSB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGFuIGFjY291bnQgaW5kZXggdG8gc3dlZXAgZnJvbVwiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCAhPSAxKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZXhhY3RseSBvbmUgZGVzdGluYXRpb24gdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGRlc3RpbmF0aW9uIGFkZHJlc3MgdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBhbW91bnQgaW4gc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0S2V5SW1hZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJLZXkgaW1hZ2UgZGVmaW5lZDsgdXNlIHN3ZWVwT3V0cHV0KCkgdG8gc3dlZXAgYW4gb3V0cHV0IGJ5IGl0cyBrZXkgaW1hZ2VcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJFbXB0eSBsaXN0IGdpdmVuIGZvciBzdWJhZGRyZXNzZXMgaW5kaWNlcyB0byBzd2VlcFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyB3aXRoIFJQQyBgc3dlZXBfYWxsYFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN3ZWVwaW5nIG91dHB1dCBkb2VzIG5vdCBzdXBwb3J0IHN1YnRyYWN0aW5nIGZlZXMgZnJvbSBkZXN0aW5hdGlvbnNcIik7XG4gICAgXG4gICAgLy8gc3dlZXAgZnJvbSBhbGwgc3ViYWRkcmVzc2VzIGlmIG5vdCBvdGhlcndpc2UgZGVmaW5lZFxuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25maWcuc2V0U3ViYWRkcmVzc0luZGljZXMoW10pO1xuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3Nlcyhjb25maWcuZ2V0QWNjb3VudEluZGV4KCkpKSB7XG4gICAgICAgIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gc3ViYWRkcmVzc2VzIHRvIHN3ZWVwIGZyb21cIik7XG4gICAgXG4gICAgLy8gY29tbW9uIGNvbmZpZyBwYXJhbXNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBsZXQgcmVsYXkgPSBjb25maWcuZ2V0UmVsYXkoKSA9PT0gdHJ1ZTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCk7XG4gICAgcGFyYW1zLmFkZHJlc3MgPSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpO1xuICAgIGFzc2VydChjb25maWcuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnLmdldFByaW9yaXR5KCk7XG4gICAgcGFyYW1zLnBheW1lbnRfaWQgPSBjb25maWcuZ2V0UGF5bWVudElkKCk7XG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9ICFyZWxheTtcbiAgICBwYXJhbXMuYmVsb3dfYW1vdW50ID0gY29uZmlnLmdldEJlbG93QW1vdW50KCk7XG4gICAgcGFyYW1zLmdldF90eF9rZXlzID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X2hleCA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9tZXRhZGF0YSA9IHRydWU7XG4gICAgXG4gICAgLy8gaW52b2tlIHdhbGxldCBycGMgYHN3ZWVwX2FsbGBcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN3ZWVwX2FsbFwiLCBwYXJhbXMpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBmcm9tIHJlc3BvbnNlXG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQsIHVuZGVmaW5lZCwgY29uZmlnKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHJlbWFpbmluZyBrbm93biBmaWVsZHNcbiAgICBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkge1xuICAgICAgdHguc2V0SXNMb2NrZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgICAgdHguc2V0UmVsYXkocmVsYXkpO1xuICAgICAgdHguc2V0SW5UeFBvb2wocmVsYXkpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHJlbGF5KTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICBsZXQgdHJhbnNmZXIgPSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgICB0cmFuc2Zlci5zZXRBY2NvdW50SW5kZXgoY29uZmlnLmdldEFjY291bnRJbmRleCgpKTtcbiAgICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDEpIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpKTtcbiAgICAgIGxldCBkZXN0aW5hdGlvbiA9IG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLCBCaWdJbnQodHJhbnNmZXIuZ2V0QW1vdW50KCkpKTtcbiAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhbZGVzdGluYXRpb25dKTtcbiAgICAgIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgICAgdHguc2V0UGF5bWVudElkKGNvbmZpZy5nZXRQYXltZW50SWQoKSk7XG4gICAgICBpZiAodHguZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQpIHR4LnNldFVubG9ja1RpbWUoMG4pO1xuICAgICAgaWYgKHR4LmdldFJlbGF5KCkpIHtcbiAgICAgICAgaWYgKHR4LmdldExhc3RSZWxheWVkVGltZXN0YW1wKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoK25ldyBEYXRlKCkuZ2V0VGltZSgpKTsgIC8vIFRPRE8gKG1vbmVyby13YWxsZXQtcnBjKTogcHJvdmlkZSB0aW1lc3RhbXAgb24gcmVzcG9uc2U7IHVuY29uZmlybWVkIHRpbWVzdGFtcHMgdmFyeVxuICAgICAgICBpZiAodHguZ2V0SXNEb3VibGVTcGVuZFNlZW4oKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0eFNldC5nZXRUeHMoKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHJlZnJlc2hMaXN0ZW5pbmcoKSB7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyID09IHVuZGVmaW5lZCAmJiB0aGlzLmxpc3RlbmVycy5sZW5ndGgpIHRoaXMud2FsbGV0UG9sbGVyID0gbmV3IFdhbGxldFBvbGxlcih0aGlzKTtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCkgdGhpcy53YWxsZXRQb2xsZXIuc2V0SXNQb2xsaW5nKHRoaXMubGlzdGVuZXJzLmxlbmd0aCA+IDApO1xuICB9XG4gIFxuICAvKipcbiAgICogUG9sbCBpZiBsaXN0ZW5pbmcuXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgcG9sbCgpIHtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndhbGxldFBvbGxlci5pc1BvbGxpbmcpIGF3YWl0IHRoaXMud2FsbGV0UG9sbGVyLnBvbGwoKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIFNUQVRJQyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IE1vbmVyb1dhbGxldENvbmZpZyB7XG4gICAgbGV0IGNvbmZpZzogdW5kZWZpbmVkIHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+ID0gdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlb2YgdXJpT3JDb25maWcgPT09IFwic3RyaW5nXCIgfHwgKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pLnVyaSkgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh7c2VydmVyOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbmZpZyBhcyBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+LCB1c2VybmFtZSwgcGFzc3dvcmQpfSk7XG4gICAgZWxzZSBpZiAoR2VuVXRpbHMuaXNBcnJheSh1cmlPckNvbmZpZykpIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoe2NtZDogdXJpT3JDb25maWcgYXMgc3RyaW5nW119KTtcbiAgICBlbHNlIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIgPT09IHVuZGVmaW5lZCkgY29uZmlnLnByb3h5VG9Xb3JrZXIgPSB0cnVlO1xuICAgIHJldHVybiBjb25maWcgYXMgTW9uZXJvV2FsbGV0Q29uZmlnO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVtb3ZlIGNyaXRlcmlhIHdoaWNoIHJlcXVpcmVzIGxvb2tpbmcgdXAgb3RoZXIgdHJhbnNmZXJzL291dHB1dHMgdG9cbiAgICogZnVsZmlsbCBxdWVyeS5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gcXVlcnkgLSB0aGUgcXVlcnkgdG8gZGVjb250ZXh0dWFsaXplXG4gICAqIEByZXR1cm4ge01vbmVyb1R4UXVlcnl9IGEgcmVmZXJlbmNlIHRvIHRoZSBxdWVyeSBmb3IgY29udmVuaWVuY2VcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZGVjb250ZXh0dWFsaXplKHF1ZXJ5KSB7XG4gICAgcXVlcnkuc2V0SXNJbmNvbWluZyh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldElzT3V0Z29pbmcodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRUcmFuc2ZlclF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0SW5wdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldE91dHB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHF1ZXJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGlzQ29udGV4dHVhbChxdWVyeSkge1xuICAgIGlmICghcXVlcnkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIXF1ZXJ5LmdldFR4UXVlcnkoKSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0SXNJbmNvbWluZygpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIHRyYW5zZmVyc1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0SXNPdXRnb2luZygpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlO1xuICAgIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb1RyYW5zZmVyUXVlcnkpIHtcbiAgICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0T3V0cHV0UXVlcnkoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciBvdXRwdXRzXG4gICAgfSBlbHNlIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb091dHB1dFF1ZXJ5KSB7XG4gICAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldFRyYW5zZmVyUXVlcnkoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciB0cmFuc2ZlcnNcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicXVlcnkgbXVzdCBiZSB0eCBvciB0cmFuc2ZlciBxdWVyeVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNBY2NvdW50KHJwY0FjY291bnQpIHtcbiAgICBsZXQgYWNjb3VudCA9IG5ldyBNb25lcm9BY2NvdW50KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0FjY291bnQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQWNjb3VudFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhY2NvdW50X2luZGV4XCIpIGFjY291bnQuc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYWxhbmNlXCIpIGFjY291bnQuc2V0QmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfYmFsYW5jZVwiKSBhY2NvdW50LnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmFzZV9hZGRyZXNzXCIpIGFjY291bnQuc2V0UHJpbWFyeUFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YWdcIikgYWNjb3VudC5zZXRUYWcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYWJlbFwiKSB7IH0gLy8gbGFiZWwgYmVsb25ncyB0byBmaXJzdCBzdWJhZGRyZXNzXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBhY2NvdW50IGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChcIlwiID09PSBhY2NvdW50LmdldFRhZygpKSBhY2NvdW50LnNldFRhZyh1bmRlZmluZWQpO1xuICAgIHJldHVybiBhY2NvdW50O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpIHtcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N1YmFkZHJlc3MpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjU3ViYWRkcmVzc1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhY2NvdW50X2luZGV4XCIpIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc19pbmRleFwiKSBzdWJhZGRyZXNzLnNldEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSBzdWJhZGRyZXNzLnNldEFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYWxhbmNlXCIpIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfYmFsYW5jZVwiKSBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX3Vuc3BlbnRfb3V0cHV0c1wiKSBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFiZWxcIikgeyBpZiAodmFsKSBzdWJhZGRyZXNzLnNldExhYmVsKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1c2VkXCIpIHN1YmFkZHJlc3Muc2V0SXNVc2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tzX3RvX3VubG9ja1wiKSBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT0gXCJ0aW1lX3RvX3VubG9ja1wiKSB7fSAgLy8gaWdub3JpbmdcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHN1YmFkZHJlc3MgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIHNlbnQgdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBUT0RPOiByZW1vdmUgY29weURlc3RpbmF0aW9ucyBhZnRlciA+MTguMy4xIHdoZW4gc3VidHJhY3RGZWVGcm9tIGZ1bGx5IHN1cHBvcnRlZFxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeENvbmZpZ30gY29uZmlnIC0gc2VuZCBjb25maWdcbiAgICogQHBhcmFtIHtNb25lcm9UeFdhbGxldH0gW3R4XSAtIGV4aXN0aW5nIHRyYW5zYWN0aW9uIHRvIGluaXRpYWxpemUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGNvcHlEZXN0aW5hdGlvbnMgLSBjb3BpZXMgY29uZmlnIGRlc3RpbmF0aW9ucyBpZiB0cnVlXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSBpcyB0aGUgaW5pdGlhbGl6ZWQgc2VuZCB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBpbml0U2VudFR4V2FsbGV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4sIHR4LCBjb3B5RGVzdGluYXRpb25zKSB7XG4gICAgaWYgKCF0eCkgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICBsZXQgcmVsYXkgPSBjb25maWcuZ2V0UmVsYXkoKSA9PT0gdHJ1ZTtcbiAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgIHR4LnNldEluVHhQb29sKHJlbGF5KTtcbiAgICB0eC5zZXRSZWxheShyZWxheSk7XG4gICAgdHguc2V0SXNSZWxheWVkKHJlbGF5KTtcbiAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICB0eC5zZXRJc0xvY2tlZCh0cnVlKTtcbiAgICB0eC5zZXRSaW5nU2l6ZShNb25lcm9VdGlscy5SSU5HX1NJWkUpO1xuICAgIGxldCB0cmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgdHJhbnNmZXIuc2V0VHgodHgpO1xuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAmJiBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDEpIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnNsaWNlKDApKTsgLy8gd2Uga25vdyBzcmMgc3ViYWRkcmVzcyBpbmRpY2VzIGlmZiBjb25maWcgc3BlY2lmaWVzIDFcbiAgICBpZiAoY29weURlc3RpbmF0aW9ucykge1xuICAgICAgbGV0IGRlc3RDb3BpZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IGRlc3Qgb2YgY29uZmlnLmdldERlc3RpbmF0aW9ucygpKSBkZXN0Q29waWVzLnB1c2goZGVzdC5jb3B5KCkpO1xuICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKGRlc3RDb3BpZXMpO1xuICAgIH1cbiAgICB0eC5zZXRPdXRnb2luZ1RyYW5zZmVyKHRyYW5zZmVyKTtcbiAgICB0eC5zZXRQYXltZW50SWQoY29uZmlnLmdldFBheW1lbnRJZCgpKTtcbiAgICBpZiAodHguZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQpIHR4LnNldFVubG9ja1RpbWUoMG4pO1xuICAgIGlmIChjb25maWcuZ2V0UmVsYXkoKSkge1xuICAgICAgaWYgKHR4LmdldExhc3RSZWxheWVkVGltZXN0YW1wKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoK25ldyBEYXRlKCkuZ2V0VGltZSgpKTsgIC8vIFRPRE8gKG1vbmVyby13YWxsZXQtcnBjKTogcHJvdmlkZSB0aW1lc3RhbXAgb24gcmVzcG9uc2U7IHVuY29uZmlybWVkIHRpbWVzdGFtcHMgdmFyeVxuICAgICAgaWYgKHR4LmdldElzRG91YmxlU3BlbmRTZWVuKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4oZmFsc2UpO1xuICAgIH1cbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIHR4IHNldCBmcm9tIGEgUlBDIG1hcCBleGNsdWRpbmcgdHhzLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY01hcCAtIG1hcCB0byBpbml0aWFsaXplIHRoZSB0eCBzZXQgZnJvbVxuICAgKiBAcmV0dXJuIE1vbmVyb1R4U2V0IC0gaW5pdGlhbGl6ZWQgdHggc2V0XG4gICAqIEByZXR1cm4gdGhlIHJlc3VsdGluZyB0eCBzZXRcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4U2V0KHJwY01hcCkge1xuICAgIGxldCB0eFNldCA9IG5ldyBNb25lcm9UeFNldCgpO1xuICAgIHR4U2V0LnNldE11bHRpc2lnVHhIZXgocnBjTWFwLm11bHRpc2lnX3R4c2V0KTtcbiAgICB0eFNldC5zZXRVbnNpZ25lZFR4SGV4KHJwY01hcC51bnNpZ25lZF90eHNldCk7XG4gICAgdHhTZXQuc2V0U2lnbmVkVHhIZXgocnBjTWFwLnNpZ25lZF90eHNldCk7XG4gICAgaWYgKHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKSAhPT0gdW5kZWZpbmVkICYmIHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKS5sZW5ndGggPT09IDApIHR4U2V0LnNldE11bHRpc2lnVHhIZXgodW5kZWZpbmVkKTtcbiAgICBpZiAodHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0VW5zaWduZWRUeEhleCh1bmRlZmluZWQpO1xuICAgIGlmICh0eFNldC5nZXRTaWduZWRUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0U2lnbmVkVHhIZXgoKS5sZW5ndGggPT09IDApIHR4U2V0LnNldFNpZ25lZFR4SGV4KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBNb25lcm9UeFNldCBmcm9tIGEgbGlzdCBvZiBycGMgdHhzLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4cyAtIHJwYyB0eHMgdG8gaW5pdGlhbGl6ZSB0aGUgc2V0IGZyb21cbiAgICogQHBhcmFtIHR4cyAtIGV4aXN0aW5nIHR4cyB0byBmdXJ0aGVyIGluaXRpYWxpemUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4gdGhlIGNvbnZlcnRlZCB0eCBzZXRcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJwY1R4czogYW55LCB0eHM/OiBhbnksIGNvbmZpZz86IGFueSkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHNoYXJlZCB0eCBzZXRcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4U2V0KHJwY1R4cyk7XG5cbiAgICAvLyBnZXQgbnVtYmVyIG9mIHR4c1xuICAgIGxldCBudW1UeHMgPSBycGNUeHMuZmVlX2xpc3QgPyBycGNUeHMuZmVlX2xpc3QubGVuZ3RoIDogcnBjVHhzLnR4X2hhc2hfbGlzdCA/IHJwY1R4cy50eF9oYXNoX2xpc3QubGVuZ3RoIDogMDtcbiAgICBcbiAgICAvLyBkb25lIGlmIHJwYyByZXNwb25zZSBjb250YWlucyBubyB0eHNcbiAgICBpZiAobnVtVHhzID09PSAwKSB7XG4gICAgICBhc3NlcnQuZXF1YWwodHhzLCB1bmRlZmluZWQpO1xuICAgICAgcmV0dXJuIHR4U2V0O1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBpZiBub25lIGdpdmVuXG4gICAgaWYgKHR4cykgdHhTZXQuc2V0VHhzKHR4cyk7XG4gICAgZWxzZSB7XG4gICAgICB0eHMgPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVHhzOyBpKyspIHR4cy5wdXNoKG5ldyBNb25lcm9UeFdhbGxldCgpKTtcbiAgICB9XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICB0eC5zZXRUeFNldCh0eFNldCk7XG4gICAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgIH1cbiAgICB0eFNldC5zZXRUeHModHhzKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBmcm9tIHJwYyBsaXN0c1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUeHMpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVHhzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInR4X2hhc2hfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEhhc2godmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9rZXlfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEtleSh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2Jsb2JfbGlzdFwiIHx8IGtleSA9PT0gXCJ0eF9yYXdfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEZ1bGxIZXgodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9tZXRhZGF0YV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0TWV0YWRhdGEodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEZlZShCaWdJbnQodmFsW2ldKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2VpZ2h0X2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRXZWlnaHQodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRfbGlzdFwiKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHR4c1tpXS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT0gdW5kZWZpbmVkKSB0eHNbaV0uc2V0T3V0Z29pbmdUcmFuc2ZlcihuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHR4c1tpXSkpO1xuICAgICAgICAgIHR4c1tpXS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0QW1vdW50KEJpZ0ludCh2YWxbaV0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm11bHRpc2lnX3R4c2V0XCIgfHwga2V5ID09PSBcInVuc2lnbmVkX3R4c2V0XCIgfHwga2V5ID09PSBcInNpZ25lZF90eHNldFwiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50X2tleV9pbWFnZXNfbGlzdFwiKSB7XG4gICAgICAgIGxldCBpbnB1dEtleUltYWdlc0xpc3QgPSB2YWw7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRLZXlJbWFnZXNMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZSh0eHNbaV0uZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICAgICAgdHhzW2ldLnNldElucHV0cyhbXSk7XG4gICAgICAgICAgZm9yIChsZXQgaW5wdXRLZXlJbWFnZSBvZiBpbnB1dEtleUltYWdlc0xpc3RbaV1bXCJrZXlfaW1hZ2VzXCJdKSB7XG4gICAgICAgICAgICB0eHNbaV0uZ2V0SW5wdXRzKCkucHVzaChuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCkuc2V0S2V5SW1hZ2UobmV3IE1vbmVyb0tleUltYWdlKCkuc2V0SGV4KGlucHV0S2V5SW1hZ2UpKS5zZXRUeCh0eHNbaV0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzX2J5X2Rlc3RfbGlzdFwiKSB7XG4gICAgICAgIGxldCBhbW91bnRzQnlEZXN0TGlzdCA9IHZhbDtcbiAgICAgICAgbGV0IGRlc3RpbmF0aW9uSWR4ID0gMDtcbiAgICAgICAgZm9yIChsZXQgdHhJZHggPSAwOyB0eElkeCA8IGFtb3VudHNCeURlc3RMaXN0Lmxlbmd0aDsgdHhJZHgrKykge1xuICAgICAgICAgIGxldCBhbW91bnRzQnlEZXN0ID0gYW1vdW50c0J5RGVzdExpc3RbdHhJZHhdW1wiYW1vdW50c1wiXTtcbiAgICAgICAgICBpZiAodHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT09IHVuZGVmaW5lZCkgdHhzW3R4SWR4XS5zZXRPdXRnb2luZ1RyYW5zZmVyKG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHhzW3R4SWR4XSkpO1xuICAgICAgICAgIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldERlc3RpbmF0aW9ucyhbXSk7XG4gICAgICAgICAgZm9yIChsZXQgYW1vdW50IG9mIGFtb3VudHNCeURlc3QpIHtcbiAgICAgICAgICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoID09PSAxKSB0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKS5wdXNoKG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLCBCaWdJbnQoYW1vdW50KSkpOyAvLyBzd2VlcGluZyBjYW4gY3JlYXRlIG11bHRpcGxlIHR4cyB3aXRoIG9uZSBhZGRyZXNzXG4gICAgICAgICAgICBlbHNlIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVtkZXN0aW5hdGlvbklkeCsrXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnQpKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhIHJwYyB0eCB3aXRoIGEgdHJhbnNmZXIgdG8gYSB0eCBzZXQgd2l0aCBhIHR4IGFuZCB0cmFuc2Zlci5cbiAgICogXG4gICAqIEBwYXJhbSBycGNUeCAtIHJwYyB0eCB0byBidWlsZCBmcm9tXG4gICAqIEBwYXJhbSB0eCAtIGV4aXN0aW5nIHR4IHRvIGNvbnRpbnVlIGluaXRpYWxpemluZyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBpc091dGdvaW5nIC0gc3BlY2lmaWVzIGlmIHRoZSB0eCBpcyBvdXRnb2luZyBpZiB0cnVlLCBpbmNvbWluZyBpZiBmYWxzZSwgb3IgZGVjb2RlcyBmcm9tIHR5cGUgaWYgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB0aGUgaW5pdGlhbGl6ZWQgdHggc2V0IHdpdGggYSB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhUb1R4U2V0KHJwY1R4LCB0eCwgaXNPdXRnb2luZywgY29uZmlnKSB7XG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFNldChycGNUeCk7XG4gICAgdHhTZXQuc2V0VHhzKFtNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4LCB0eCwgaXNPdXRnb2luZywgY29uZmlnKS5zZXRUeFNldCh0eFNldCldKTtcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBCdWlsZHMgYSBNb25lcm9UeFdhbGxldCBmcm9tIGEgUlBDIHR4LlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4IC0gcnBjIHR4IHRvIGJ1aWxkIGZyb21cbiAgICogQHBhcmFtIHR4IC0gZXhpc3RpbmcgdHggdG8gY29udGludWUgaW5pdGlhbGl6aW5nIChvcHRpb25hbClcbiAgICogQHBhcmFtIGlzT3V0Z29pbmcgLSBzcGVjaWZpZXMgaWYgdGhlIHR4IGlzIG91dGdvaW5nIGlmIHRydWUsIGluY29taW5nIGlmIGZhbHNlLCBvciBkZWNvZGVzIGZyb20gdHlwZSBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gaXMgdGhlIGluaXRpYWxpemVkIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlcihycGNUeDogYW55LCB0eD86IGFueSwgaXNPdXRnb2luZz86IGFueSwgY29uZmlnPzogYW55KSB7ICAvLyBUT0RPOiBjaGFuZ2UgZXZlcnl0aGluZyB0byBzYWZlIHNldFxuICAgICAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHRvIHJldHVyblxuICAgIGlmICghdHgpIHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCBzdGF0ZSBmcm9tIHJwYyB0eXBlXG4gICAgaWYgKHJwY1R4LnR5cGUgIT09IHVuZGVmaW5lZCkgaXNPdXRnb2luZyA9IE1vbmVyb1dhbGxldFJwYy5kZWNvZGVScGNUeXBlKHJwY1R4LnR5cGUsIHR4KTtcbiAgICBlbHNlIGFzc2VydC5lcXVhbCh0eXBlb2YgaXNPdXRnb2luZywgXCJib29sZWFuXCIsIFwiTXVzdCBpbmRpY2F0ZSBpZiB0eCBpcyBvdXRnb2luZyAodHJ1ZSkgeG9yIGluY29taW5nIChmYWxzZSkgc2luY2UgdW5rbm93blwiKTtcbiAgICBcbiAgICAvLyBUT0RPOiBzYWZlIHNldFxuICAgIC8vIGluaXRpYWxpemUgcmVtYWluaW5nIGZpZWxkcyAgVE9ETzogc2VlbXMgdGhpcyBzaG91bGQgYmUgcGFydCBvZiBjb21tb24gZnVuY3Rpb24gd2l0aCBEYWVtb25ScGMuY29udmVydFJwY1R4XG4gICAgbGV0IGhlYWRlcjtcbiAgICBsZXQgdHJhbnNmZXI7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1R4KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1R4W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInR4aWRcIikgdHguc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2hhc2hcIikgdHguc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZVwiKSB0eC5zZXRGZWUoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5vdGVcIikgeyBpZiAodmFsKSB0eC5zZXROb3RlKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9rZXlcIikgdHguc2V0S2V5KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHlwZVwiKSB7IH0gLy8gdHlwZSBhbHJlYWR5IGhhbmRsZWRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9zaXplXCIpIHR4LnNldFNpemUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tfdGltZVwiKSB0eC5zZXRVbmxvY2tUaW1lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2VpZ2h0XCIpIHR4LnNldFdlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvY2tlZFwiKSB0eC5zZXRJc0xvY2tlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2Jsb2JcIikgdHguc2V0RnVsbEhleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X21ldGFkYXRhXCIpIHR4LnNldE1ldGFkYXRhKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZG91YmxlX3NwZW5kX3NlZW5cIikgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oZWlnaHRcIiB8fCBrZXkgPT09IFwiaGVpZ2h0XCIpIHtcbiAgICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIHtcbiAgICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgICAgaGVhZGVyLnNldEhlaWdodCh2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGltZXN0YW1wXCIpIHtcbiAgICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIHtcbiAgICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgICAgaGVhZGVyLnNldFRpbWVzdGFtcCh2YWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHRpbWVzdGFtcCBvZiB1bmNvbmZpcm1lZCB0eCBpcyBjdXJyZW50IHJlcXVlc3QgdGltZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY29uZmlybWF0aW9uc1wiKSB0eC5zZXROdW1Db25maXJtYXRpb25zKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3VnZ2VzdGVkX2NvbmZpcm1hdGlvbnNfdGhyZXNob2xkXCIpIHtcbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gKGlzT3V0Z29pbmcgPyBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpIDogbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKSkuc2V0VHgodHgpO1xuICAgICAgICBpZiAoIWlzT3V0Z29pbmcpIHRyYW5zZmVyLnNldE51bVN1Z2dlc3RlZENvbmZpcm1hdGlvbnModmFsKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRcIikge1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIHRyYW5zZmVyLnNldEFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50c1wiKSB7fSAgLy8gaWdub3JpbmcsIGFtb3VudHMgc3VtIHRvIGFtb3VudFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkZHJlc3NcIikge1xuICAgICAgICBpZiAoIWlzT3V0Z29pbmcpIHtcbiAgICAgICAgICBpZiAoIXRyYW5zZmVyKSB0cmFuc2ZlciA9IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkuc2V0VHgodHgpO1xuICAgICAgICAgIHRyYW5zZmVyLnNldEFkZHJlc3ModmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBheW1lbnRfaWRcIikge1xuICAgICAgICBpZiAoXCJcIiAhPT0gdmFsICYmIE1vbmVyb1R4V2FsbGV0LkRFRkFVTFRfUEFZTUVOVF9JRCAhPT0gdmFsKSB0eC5zZXRQYXltZW50SWQodmFsKTsgIC8vIGRlZmF1bHQgaXMgdW5kZWZpbmVkXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRleFwiKSBhc3NlcnQocnBjVHguc3ViYWRkcl9pbmRpY2VzKTsgIC8vIGhhbmRsZWQgYnkgc3ViYWRkcl9pbmRpY2VzXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRpY2VzXCIpIHtcbiAgICAgICAgaWYgKCF0cmFuc2ZlcikgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIGxldCBycGNJbmRpY2VzID0gdmFsO1xuICAgICAgICB0cmFuc2Zlci5zZXRBY2NvdW50SW5kZXgocnBjSW5kaWNlc1swXS5tYWpvcik7XG4gICAgICAgIGlmIChpc091dGdvaW5nKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgICAgICAgZm9yIChsZXQgcnBjSW5kZXggb2YgcnBjSW5kaWNlcykgc3ViYWRkcmVzc0luZGljZXMucHVzaChycGNJbmRleC5taW5vcik7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFzc2VydC5lcXVhbChycGNJbmRpY2VzLmxlbmd0aCwgMSk7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGV4KHJwY0luZGljZXNbMF0ubWlub3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGVzdGluYXRpb25zXCIgfHwga2V5ID09IFwicmVjaXBpZW50c1wiKSB7XG4gICAgICAgIGFzc2VydChpc091dGdvaW5nKTtcbiAgICAgICAgbGV0IGRlc3RpbmF0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBycGNEZXN0aW5hdGlvbiBvZiB2YWwpIHtcbiAgICAgICAgICBsZXQgZGVzdGluYXRpb24gPSBuZXcgTW9uZXJvRGVzdGluYXRpb24oKTtcbiAgICAgICAgICBkZXN0aW5hdGlvbnMucHVzaChkZXN0aW5hdGlvbik7XG4gICAgICAgICAgZm9yIChsZXQgZGVzdGluYXRpb25LZXkgb2YgT2JqZWN0LmtleXMocnBjRGVzdGluYXRpb24pKSB7XG4gICAgICAgICAgICBpZiAoZGVzdGluYXRpb25LZXkgPT09IFwiYWRkcmVzc1wiKSBkZXN0aW5hdGlvbi5zZXRBZGRyZXNzKHJwY0Rlc3RpbmF0aW9uW2Rlc3RpbmF0aW9uS2V5XSk7XG4gICAgICAgICAgICBlbHNlIGlmIChkZXN0aW5hdGlvbktleSA9PT0gXCJhbW91bnRcIikgZGVzdGluYXRpb24uc2V0QW1vdW50KEJpZ0ludChycGNEZXN0aW5hdGlvbltkZXN0aW5hdGlvbktleV0pKTtcbiAgICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVW5yZWNvZ25pemVkIHRyYW5zYWN0aW9uIGRlc3RpbmF0aW9uIGZpZWxkOiBcIiArIGRlc3RpbmF0aW9uS2V5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoe3R4OiB0eH0pO1xuICAgICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoZGVzdGluYXRpb25zKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzb3VyY2VzXCIpIHtcbiAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZSh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdHguc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgZm9yIChsZXQgcnBjU291cmNlIG9mIHZhbCkge1xuICAgICAgICAgIGxldCBpbnB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKS5zZXRUeCh0eCk7XG4gICAgICAgICAgaW5wdXQuc2V0QW1vdW50KEJpZ0ludChycGNTb3VyY2UuYW1vdW50KSk7XG4gICAgICAgICAgaW5wdXQuc2V0SW5kZXgocnBjU291cmNlLmdsb2JhbF9pbmRleCk7XG4gICAgICAgICAgaWYgKHJwY1NvdXJjZS5wdWJrZXkgIT09IHVuZGVmaW5lZCkgaW5wdXQuc2V0U3RlYWx0aFB1YmxpY0tleShycGNTb3VyY2UucHVia2V5LnN1YnN0cmluZygwLCA2NCkpOyAvLyBkZXN0IGtleSBvZiBkZXN0fHxtYXNrXG4gICAgICAgICAgdHguZ2V0SW5wdXRzKCkucHVzaChpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtdWx0aXNpZ190eHNldFwiICYmIHZhbCAhPT0gdW5kZWZpbmVkKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZTsgdGhpcyBtZXRob2Qgb25seSBidWlsZHMgYSB0eCB3YWxsZXRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnNpZ25lZF90eHNldFwiICYmIHZhbCAhPT0gdW5kZWZpbmVkKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZTsgdGhpcyBtZXRob2Qgb25seSBidWlsZHMgYSB0eCB3YWxsZXRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRfaW5cIikgdHguc2V0SW5wdXRTdW0oQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9vdXRcIikgdHguc2V0T3V0cHV0U3VtKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjaGFuZ2VfYWRkcmVzc1wiKSB0eC5zZXRDaGFuZ2VBZGRyZXNzKHZhbCA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY2hhbmdlX2Ftb3VudFwiKSB0eC5zZXRDaGFuZ2VBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImR1bW15X291dHB1dHNcIikgdHguc2V0TnVtRHVtbXlPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZXh0cmFcIikgdHguc2V0RXh0cmFIZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyaW5nX3NpemVcIikgdHguc2V0UmluZ1NpemUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGVudF9rZXlfaW1hZ2VzXCIpIHtcbiAgICAgICAgbGV0IGlucHV0S2V5SW1hZ2VzID0gdmFsLmtleV9pbWFnZXM7XG4gICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUodHguZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHR4LnNldElucHV0cyhbXSk7XG4gICAgICAgIGZvciAobGV0IGlucHV0S2V5SW1hZ2Ugb2YgaW5wdXRLZXlJbWFnZXMpIHtcbiAgICAgICAgICB0eC5nZXRJbnB1dHMoKS5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKS5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UoKS5zZXRIZXgoaW5wdXRLZXlJbWFnZSkpLnNldFR4KHR4KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzX2J5X2Rlc3RcIikge1xuICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKGlzT3V0Z29pbmcpO1xuICAgICAgICBsZXQgYW1vdW50c0J5RGVzdCA9IHZhbC5hbW91bnRzO1xuICAgICAgICBhc3NlcnQuZXF1YWwoY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCwgYW1vdW50c0J5RGVzdC5sZW5ndGgpO1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHR4KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKFtdKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB0cmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKS5wdXNoKG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbaV0uZ2V0QWRkcmVzcygpLCBCaWdJbnQoYW1vdW50c0J5RGVzdFtpXSkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgdHJhbnNhY3Rpb24gZmllbGQgd2l0aCB0cmFuc2ZlcjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBsaW5rIGJsb2NrIGFuZCB0eFxuICAgIGlmIChoZWFkZXIpIHR4LnNldEJsb2NrKG5ldyBNb25lcm9CbG9jayhoZWFkZXIpLnNldFR4cyhbdHhdKSk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBmaW5hbCBmaWVsZHNcbiAgICBpZiAodHJhbnNmZXIpIHtcbiAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpID09PSB1bmRlZmluZWQpIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIGlmICghdHJhbnNmZXIuZ2V0VHgoKS5nZXRJc0NvbmZpcm1lZCgpKSB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgICAgaWYgKGlzT3V0Z29pbmcpIHtcbiAgICAgICAgdHguc2V0SXNPdXRnb2luZyh0cnVlKTtcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSkge1xuICAgICAgICAgIGlmICh0cmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKSkgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldERlc3RpbmF0aW9ucyh1bmRlZmluZWQpOyAvLyBvdmVyd3JpdGUgdG8gYXZvaWQgcmVjb25jaWxlIGVycm9yIFRPRE86IHJlbW92ZSBhZnRlciA+MTguMy4xIHdoZW4gYW1vdW50c19ieV9kZXN0IHN1cHBvcnRlZFxuICAgICAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5tZXJnZSh0cmFuc2Zlcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB0eC5zZXRPdXRnb2luZ1RyYW5zZmVyKHRyYW5zZmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHR4LnNldElzSW5jb21pbmcodHJ1ZSk7XG4gICAgICAgIHR4LnNldEluY29taW5nVHJhbnNmZXJzKFt0cmFuc2Zlcl0pO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyByZXR1cm4gaW5pdGlhbGl6ZWQgdHJhbnNhY3Rpb25cbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4V2l0aE91dHB1dChycGNPdXRwdXQpIHtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4XG4gICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBvdXRwdXRcbiAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCh7dHg6IHR4fSk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY091dHB1dCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNPdXRwdXRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIG91dHB1dC5zZXRBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50XCIpIG91dHB1dC5zZXRJc1NwZW50KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwia2V5X2ltYWdlXCIpIHsgaWYgKFwiXCIgIT09IHZhbCkgb3V0cHV0LnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSh2YWwpKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImdsb2JhbF9pbmRleFwiKSBvdXRwdXQuc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZFwiKSB0eC5zZXRJc0xvY2tlZCghdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmcm96ZW5cIikgb3V0cHV0LnNldElzRnJvemVuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHVia2V5XCIpIG91dHB1dC5zZXRTdGVhbHRoUHVibGljS2V5KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRleFwiKSB7XG4gICAgICAgIG91dHB1dC5zZXRBY2NvdW50SW5kZXgodmFsLm1ham9yKTtcbiAgICAgICAgb3V0cHV0LnNldFN1YmFkZHJlc3NJbmRleCh2YWwubWlub3IpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiKSB0eC5zZXRCbG9jaygobmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KHZhbCkgYXMgTW9uZXJvQmxvY2spLnNldFR4cyhbdHggYXMgTW9uZXJvVHhdKSk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHdpdGggb3V0cHV0XG4gICAgdHguc2V0T3V0cHV0cyhbb3V0cHV0XSk7XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNEZXNjcmliZVRyYW5zZmVyKHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQpIHtcbiAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImRlc2NcIikge1xuICAgICAgICB0eFNldC5zZXRUeHMoW10pO1xuICAgICAgICBmb3IgKGxldCB0eE1hcCBvZiB2YWwpIHtcbiAgICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHR4TWFwLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgIHR4LnNldFR4U2V0KHR4U2V0KTtcbiAgICAgICAgICB0eFNldC5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1bW1hcnlcIikgeyB9IC8vIFRPRE86IHN1cHBvcnQgdHggc2V0IHN1bW1hcnkgZmllbGRzP1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZGVzY2RyaWJlIHRyYW5zZmVyIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlY29kZXMgYSBcInR5cGVcIiBmcm9tIG1vbmVyby13YWxsZXQtcnBjIHRvIGluaXRpYWxpemUgdHlwZSBhbmQgc3RhdGVcbiAgICogZmllbGRzIGluIHRoZSBnaXZlbiB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIFRPRE86IHRoZXNlIHNob3VsZCBiZSBzYWZlIHNldFxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R5cGUgaXMgdGhlIHR5cGUgdG8gZGVjb2RlXG4gICAqIEBwYXJhbSB0eCBpcyB0aGUgdHJhbnNhY3Rpb24gdG8gZGVjb2RlIGtub3duIGZpZWxkcyB0b1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBycGMgdHlwZSBpbmRpY2F0ZXMgb3V0Z29pbmcgeG9yIGluY29taW5nXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGRlY29kZVJwY1R5cGUocnBjVHlwZSwgdHgpIHtcbiAgICBsZXQgaXNPdXRnb2luZztcbiAgICBpZiAocnBjVHlwZSA9PT0gXCJpblwiKSB7XG4gICAgICBpc091dGdvaW5nID0gZmFsc2U7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwib3V0XCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBvb2xcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7ICAvLyBUT0RPOiBidXQgY291bGQgaXQgYmU/XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBlbmRpbmdcIikge1xuICAgICAgaXNPdXRnb2luZyA9IHRydWU7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiYmxvY2tcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeCh0cnVlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiZmFpbGVkXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNmZXIgdHlwZTogXCIgKyBycGNUeXBlKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzT3V0Z29pbmc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNZXJnZXMgYSB0cmFuc2FjdGlvbiBpbnRvIGEgdW5pcXVlIHNldCBvZiB0cmFuc2FjdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhXYWxsZXR9IHR4IC0gdGhlIHRyYW5zYWN0aW9uIHRvIG1lcmdlIGludG8gdGhlIGV4aXN0aW5nIHR4c1xuICAgKiBAcGFyYW0ge09iamVjdH0gdHhNYXAgLSBtYXBzIHR4IGhhc2hlcyB0byB0eHNcbiAgICogQHBhcmFtIHtPYmplY3R9IGJsb2NrTWFwIC0gbWFwcyBibG9jayBoZWlnaHRzIHRvIGJsb2Nrc1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBtZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApIHtcbiAgICBhc3NlcnQodHguZ2V0SGFzaCgpICE9PSB1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIG1lcmdlIHR4XG4gICAgbGV0IGFUeCA9IHR4TWFwW3R4LmdldEhhc2goKV07XG4gICAgaWYgKGFUeCA9PT0gdW5kZWZpbmVkKSB0eE1hcFt0eC5nZXRIYXNoKCldID0gdHg7IC8vIGNhY2hlIG5ldyB0eFxuICAgIGVsc2UgYVR4Lm1lcmdlKHR4KTsgLy8gbWVyZ2Ugd2l0aCBleGlzdGluZyB0eFxuICAgIFxuICAgIC8vIG1lcmdlIHR4J3MgYmxvY2sgaWYgY29uZmlybWVkXG4gICAgaWYgKHR4LmdldEhlaWdodCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBhQmxvY2sgPSBibG9ja01hcFt0eC5nZXRIZWlnaHQoKV07XG4gICAgICBpZiAoYUJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrTWFwW3R4LmdldEhlaWdodCgpXSA9IHR4LmdldEJsb2NrKCk7IC8vIGNhY2hlIG5ldyBibG9ja1xuICAgICAgZWxzZSBhQmxvY2subWVyZ2UodHguZ2V0QmxvY2soKSk7IC8vIG1lcmdlIHdpdGggZXhpc3RpbmcgYmxvY2tcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNhY3Rpb25zIGJ5IHRoZWlyIGhlaWdodC5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29tcGFyZVR4c0J5SGVpZ2h0KHR4MSwgdHgyKSB7XG4gICAgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4Mi5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMDsgLy8gYm90aCB1bmNvbmZpcm1lZFxuICAgIGVsc2UgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMTsgICAvLyB0eDEgaXMgdW5jb25maXJtZWRcbiAgICBlbHNlIGlmICh0eDIuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIC0xOyAgLy8gdHgyIGlzIHVuY29uZmlybWVkXG4gICAgbGV0IGRpZmYgPSB0eDEuZ2V0SGVpZ2h0KCkgLSB0eDIuZ2V0SGVpZ2h0KCk7XG4gICAgaWYgKGRpZmYgIT09IDApIHJldHVybiBkaWZmO1xuICAgIHJldHVybiB0eDEuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4MSkgLSB0eDIuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4Mik7IC8vIHR4cyBhcmUgaW4gdGhlIHNhbWUgYmxvY2sgc28gcmV0YWluIHRoZWlyIG9yaWdpbmFsIG9yZGVyXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNmZXJzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBzdGF0aWMgY29tcGFyZUluY29taW5nVHJhbnNmZXJzKHQxLCB0Mikge1xuICAgIGlmICh0MS5nZXRBY2NvdW50SW5kZXgoKSA8IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gLTE7XG4gICAgZWxzZSBpZiAodDEuZ2V0QWNjb3VudEluZGV4KCkgPT09IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gdDEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSB0Mi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICByZXR1cm4gMTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byBvdXRwdXRzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbXBhcmVPdXRwdXRzKG8xLCBvMikge1xuICAgIFxuICAgIC8vIGNvbXBhcmUgYnkgaGVpZ2h0XG4gICAgbGV0IGhlaWdodENvbXBhcmlzb24gPSBNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KG8xLmdldFR4KCksIG8yLmdldFR4KCkpO1xuICAgIGlmIChoZWlnaHRDb21wYXJpc29uICE9PSAwKSByZXR1cm4gaGVpZ2h0Q29tcGFyaXNvbjtcbiAgICBcbiAgICAvLyBjb21wYXJlIGJ5IGFjY291bnQgaW5kZXgsIHN1YmFkZHJlc3MgaW5kZXgsIG91dHB1dCBpbmRleCwgdGhlbiBrZXkgaW1hZ2UgaGV4XG4gICAgbGV0IGNvbXBhcmUgPSBvMS5nZXRBY2NvdW50SW5kZXgoKSAtIG8yLmdldEFjY291bnRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICBjb21wYXJlID0gbzEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSBvMi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICBpZiAoY29tcGFyZSAhPT0gMCkgcmV0dXJuIGNvbXBhcmU7XG4gICAgY29tcGFyZSA9IG8xLmdldEluZGV4KCkgLSBvMi5nZXRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICByZXR1cm4gbzEuZ2V0S2V5SW1hZ2UoKS5nZXRIZXgoKS5sb2NhbGVDb21wYXJlKG8yLmdldEtleUltYWdlKCkuZ2V0SGV4KCkpO1xuICB9XG59XG5cbi8qKlxuICogUG9sbHMgbW9uZXJvLXdhbGxldC1ycGMgdG8gcHJvdmlkZSBsaXN0ZW5lciBub3RpZmljYXRpb25zLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRQb2xsZXIge1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBpc1BvbGxpbmc6IGJvb2xlYW47XG4gIHByb3RlY3RlZCB3YWxsZXQ6IE1vbmVyb1dhbGxldFJwYztcbiAgcHJvdGVjdGVkIGxvb3BlcjogVGFza0xvb3BlcjtcbiAgcHJvdGVjdGVkIHByZXZMb2NrZWRUeHM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZDb25maXJtZWROb3RpZmljYXRpb25zOiBhbnk7XG4gIHByb3RlY3RlZCB0aHJlYWRQb29sOiBhbnk7XG4gIHByb3RlY3RlZCBudW1Qb2xsaW5nOiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2SGVpZ2h0OiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2QmFsYW5jZXM6IGFueTtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICB0aGlzLndhbGxldCA9IHdhbGxldDtcbiAgICB0aGlzLmxvb3BlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jIGZ1bmN0aW9uKCkgeyBhd2FpdCB0aGF0LnBvbGwoKTsgfSk7XG4gICAgdGhpcy5wcmV2TG9ja2VkVHhzID0gW107XG4gICAgdGhpcy5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zID0gbmV3IFNldCgpOyAvLyB0eCBoYXNoZXMgb2YgcHJldmlvdXMgbm90aWZpY2F0aW9uc1xuICAgIHRoaXMucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMgPSBuZXcgU2V0KCk7IC8vIHR4IGhhc2hlcyBvZiBwcmV2aW91c2x5IGNvbmZpcm1lZCBidXQgbm90IHlldCB1bmxvY2tlZCBub3RpZmljYXRpb25zXG4gICAgdGhpcy50aHJlYWRQb29sID0gbmV3IFRocmVhZFBvb2woMSk7IC8vIHN5bmNocm9uaXplIHBvbGxzXG4gICAgdGhpcy5udW1Qb2xsaW5nID0gMDtcbiAgfVxuICBcbiAgc2V0SXNQb2xsaW5nKGlzUG9sbGluZykge1xuICAgIHRoaXMuaXNQb2xsaW5nID0gaXNQb2xsaW5nO1xuICAgIGlmIChpc1BvbGxpbmcpIHRoaXMubG9vcGVyLnN0YXJ0KHRoaXMud2FsbGV0LmdldFN5bmNQZXJpb2RJbk1zKCkpO1xuICAgIGVsc2UgdGhpcy5sb29wZXIuc3RvcCgpO1xuICB9XG4gIFxuICBzZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpIHtcbiAgICB0aGlzLmxvb3Blci5zZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpO1xuICB9XG4gIFxuICBhc3luYyBwb2xsKCkge1xuXG4gICAgLy8gc2tpcCBpZiBuZXh0IHBvbGwgaXMgcXVldWVkXG4gICAgaWYgKHRoaXMubnVtUG9sbGluZyA+IDEpIHJldHVybjtcbiAgICB0aGlzLm51bVBvbGxpbmcrKztcbiAgICBcbiAgICAvLyBzeW5jaHJvbml6ZSBwb2xsc1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICByZXR1cm4gdGhpcy50aHJlYWRQb29sLnN1Ym1pdChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIFxuICAgICAgICAvLyBza2lwIGlmIHdhbGxldCBpcyBjbG9zZWRcbiAgICAgICAgaWYgKGF3YWl0IHRoYXQud2FsbGV0LmlzQ2xvc2VkKCkpIHtcbiAgICAgICAgICB0aGF0Lm51bVBvbGxpbmctLTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHRha2UgaW5pdGlhbCBzbmFwc2hvdFxuICAgICAgICBpZiAodGhhdC5wcmV2QmFsYW5jZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEhlaWdodCgpO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpKTtcbiAgICAgICAgICB0aGF0LnByZXZCYWxhbmNlcyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBoZWlnaHQgY2hhbmdlc1xuICAgICAgICBsZXQgaGVpZ2h0ID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0SGVpZ2h0KCk7XG4gICAgICAgIGlmICh0aGF0LnByZXZIZWlnaHQgIT09IGhlaWdodCkge1xuICAgICAgICAgIGZvciAobGV0IGkgPSB0aGF0LnByZXZIZWlnaHQ7IGkgPCBoZWlnaHQ7IGkrKykgYXdhaXQgdGhhdC5vbk5ld0Jsb2NrKGkpO1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gZ2V0IGxvY2tlZCB0eHMgZm9yIGNvbXBhcmlzb24gdG8gcHJldmlvdXNcbiAgICAgICAgbGV0IG1pbkhlaWdodCA9IE1hdGgubWF4KDAsIGhlaWdodCAtIDcwKTsgLy8gb25seSBtb25pdG9yIHJlY2VudCB0eHNcbiAgICAgICAgbGV0IGxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEluY2x1ZGVPdXRwdXRzKHRydWUpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbGxlY3QgaGFzaGVzIG9mIHR4cyBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCBub0xvbmdlckxvY2tlZEhhc2hlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBwcmV2TG9ja2VkVHggb2YgdGhhdC5wcmV2TG9ja2VkVHhzKSB7XG4gICAgICAgICAgaWYgKHRoYXQuZ2V0VHgobG9ja2VkVHhzLCBwcmV2TG9ja2VkVHguZ2V0SGFzaCgpKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBub0xvbmdlckxvY2tlZEhhc2hlcy5wdXNoKHByZXZMb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gc2F2ZSBsb2NrZWQgdHhzIGZvciBuZXh0IGNvbXBhcmlzb25cbiAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzID0gbG9ja2VkVHhzO1xuICAgICAgICBcbiAgICAgICAgLy8gZmV0Y2ggdHhzIHdoaWNoIGFyZSBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCB1bmxvY2tlZFR4cyA9IG5vTG9uZ2VyTG9ja2VkSGFzaGVzLmxlbmd0aCA9PT0gMCA/IFtdIDogYXdhaXQgdGhhdC53YWxsZXQuZ2V0VHhzKG5ldyBNb25lcm9UeFF1ZXJ5KCkuc2V0SXNMb2NrZWQoZmFsc2UpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEhhc2hlcyhub0xvbmdlckxvY2tlZEhhc2hlcykuc2V0SW5jbHVkZU91dHB1dHModHJ1ZSkpO1xuICAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIG5ldyB1bmNvbmZpcm1lZCBhbmQgY29uZmlybWVkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgbG9ja2VkVHggb2YgbG9ja2VkVHhzKSB7XG4gICAgICAgICAgbGV0IHNlYXJjaFNldCA9IGxvY2tlZFR4LmdldElzQ29uZmlybWVkKCkgPyB0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zIDogdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zO1xuICAgICAgICAgIGxldCB1bmFubm91bmNlZCA9ICFzZWFyY2hTZXQuaGFzKGxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgc2VhcmNoU2V0LmFkZChsb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIGlmICh1bmFubm91bmNlZCkgYXdhaXQgdGhhdC5ub3RpZnlPdXRwdXRzKGxvY2tlZFR4KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgbmV3IHVubG9ja2VkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgdW5sb2NrZWRUeCBvZiB1bmxvY2tlZFR4cykge1xuICAgICAgICAgIHRoYXQucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucy5kZWxldGUodW5sb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIHRoYXQucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMuZGVsZXRlKHVubG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHModW5sb2NrZWRUeCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIGJhbGFuY2UgY2hhbmdlc1xuICAgICAgICBhd2FpdCB0aGF0LmNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzKCk7XG4gICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgIGlmICh0aGF0LmlzUG9sbGluZykgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBiYWNrZ3JvdW5kIHBvbGwgd2FsbGV0ICdcIiArIGF3YWl0IHRoYXQud2FsbGV0LmdldFBhdGgoKSArIFwiJzogXCIgKyBlcnIubWVzc2FnZSk7IC8vIGlnbm9yZSBlcnJvcnMgZnJvbSBwb2xscyBzdHJhZ2dsaW5nIGFmdGVyIHRoZSB3YWxsZXQgaXMgY2xvc2VkXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkge1xuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlTmV3QmxvY2soaGVpZ2h0KTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIG5vdGlmeU91dHB1dHModHgpIHtcbiAgXG4gICAgLy8gbm90aWZ5IHNwZW50IG91dHB1dHMgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBhbGxvdyBzY3JhcGUgb2YgdHggaW5wdXRzIHNvIHByb3ZpZGluZyBvbmUgaW5wdXQgd2l0aCBvdXRnb2luZyBhbW91bnRcbiAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydCh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KClcbiAgICAgICAgICAuc2V0QW1vdW50KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBbW91bnQoKSArIHR4LmdldEZlZSgpKVxuICAgICAgICAgIC5zZXRBY2NvdW50SW5kZXgodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFjY291bnRJbmRleCgpKVxuICAgICAgICAgIC5zZXRTdWJhZGRyZXNzSW5kZXgodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAxID8gdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldFN1YmFkZHJlc3NJbmRpY2VzKClbMF0gOiB1bmRlZmluZWQpIC8vIGluaXRpYWxpemUgaWYgdHJhbnNmZXIgc291cmNlZCBmcm9tIHNpbmdsZSBzdWJhZGRyZXNzXG4gICAgICAgICAgLnNldFR4KHR4KTtcbiAgICAgIHR4LnNldElucHV0cyhbb3V0cHV0XSk7XG4gICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFNwZW50KG91dHB1dCk7XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSByZWNlaXZlZCBvdXRwdXRzXG4gICAgaWYgKHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR4LmdldE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldE91dHB1dHMoKS5sZW5ndGggPiAwKSB7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogb3V0cHV0cyBvbmx5IHJldHVybmVkIGZvciBjb25maXJtZWQgdHhzXG4gICAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5nZXRPdXRwdXRzKCkpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFJlY2VpdmVkKG91dHB1dCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogbW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgYWxsb3cgc2NyYXBlIG9mIHVuY29uZmlybWVkIHJlY2VpdmVkIG91dHB1dHMgc28gdXNpbmcgaW5jb21pbmcgdHJhbnNmZXIgdmFsdWVzXG4gICAgICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkpIHtcbiAgICAgICAgICBvdXRwdXRzLnB1c2gobmV3IE1vbmVyb091dHB1dFdhbGxldCgpXG4gICAgICAgICAgICAgIC5zZXRBY2NvdW50SW5kZXgodHJhbnNmZXIuZ2V0QWNjb3VudEluZGV4KCkpXG4gICAgICAgICAgICAgIC5zZXRTdWJhZGRyZXNzSW5kZXgodHJhbnNmZXIuZ2V0U3ViYWRkcmVzc0luZGV4KCkpXG4gICAgICAgICAgICAgIC5zZXRBbW91bnQodHJhbnNmZXIuZ2V0QW1vdW50KCkpXG4gICAgICAgICAgICAgIC5zZXRUeCh0eCkpO1xuICAgICAgICB9XG4gICAgICAgIHR4LnNldE91dHB1dHMob3V0cHV0cyk7XG4gICAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5nZXRPdXRwdXRzKCkpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFJlY2VpdmVkKG91dHB1dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBnZXRUeCh0eHMsIHR4SGFzaCkge1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykgaWYgKHR4SGFzaCA9PT0gdHguZ2V0SGFzaCgpKSByZXR1cm4gdHg7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzKCkge1xuICAgIGxldCBiYWxhbmNlcyA9IGF3YWl0IHRoaXMud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgaWYgKGJhbGFuY2VzWzBdICE9PSB0aGlzLnByZXZCYWxhbmNlc1swXSB8fCBiYWxhbmNlc1sxXSAhPT0gdGhpcy5wcmV2QmFsYW5jZXNbMV0pIHtcbiAgICAgIHRoaXMucHJldkJhbGFuY2VzID0gYmFsYW5jZXM7XG4gICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZChiYWxhbmNlc1swXSwgYmFsYW5jZXNbMV0pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsU0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsYUFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsV0FBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksY0FBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssaUJBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLHVCQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyxZQUFBLEdBQUFSLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUSxrQkFBQSxHQUFBVCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVMsbUJBQUEsR0FBQVYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFVLGNBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFXLGtCQUFBLEdBQUFaLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBWSxZQUFBLEdBQUFiLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBYSx1QkFBQSxHQUFBZCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWMsd0JBQUEsR0FBQWYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFlLGVBQUEsR0FBQWhCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZ0IsMkJBQUEsR0FBQWpCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBaUIsMkJBQUEsR0FBQWxCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBa0IsbUJBQUEsR0FBQW5CLHNCQUFBLENB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