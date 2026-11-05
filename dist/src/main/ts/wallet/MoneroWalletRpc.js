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
   * The cached connection records the requested allow-any-cert setting, not custom SSL options.
   * Wallet RPC enforces a CA file or fingerprints; otherwise SSL autodetect can accept unverified certificates.
   * 
   * @param {string|MoneroRpcConnection} [uriOrConnection] - the daemon's URI or connection (defaults to offline)
   * @param {boolean} isTrusted - indicates if the daemon in trusted
   * @param {SslOptions} sslOptions - custom SSL configuration (takes precedence over the connection's rejectUnauthorized setting)
   */
  async setDaemonConnection(uriOrConnection, isTrusted, sslOptions) {
    let connection = !uriOrConnection ? undefined : uriOrConnection instanceof _MoneroRpcConnection.default ? uriOrConnection : new _MoneroRpcConnection.default(uriOrConnection);
    if (!sslOptions) {
      sslOptions = new _SslOptions.default();
      if (connection) sslOptions.setAllowAnyCert(connection.getRejectUnauthorized() === false);
    }
    let params = {};
    params.address = connection ? connection.getUri() : "bad_uri"; // TODO monero-wallet-rpc: bad daemon uri necessary for offline?
    params.username = connection ? connection.getUsername() : "";
    params.password = connection ? connection.getPassword() : "";
    params.trusted = isTrusted;
    const hasCertificates = !!sslOptions.getCertificateAuthorityFile() || sslOptions.getAllowedFingerprints()?.length > 0;
    params.ssl_support = hasCertificates && sslOptions.getAllowAnyCert() !== true ? "enabled" : "autodetect"; // wallet rpc only enforces certificates if enabled
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

    const daemonConnection = connection ? new _MoneroRpcConnection.default(connection) : undefined;
    if (daemonConnection) daemonConnection.rejectUnauthorized = params.ssl_allow_any_cert !== true;
    await this.config.getServer().sendJsonRequest("set_daemon", params);
    this.daemonConnection = daemonConnection;
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
      params.destinations.push({ address: destination.getAddress(), amount: destination.getAmount() });
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
      if (e instanceof _MoneroRpcError.default && e.getCode() === -1 && e.message.startsWith("basic_string")) e = new _MoneroRpcError.default("Must provide signature to check tx proof", -1);
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
      amount: amount,
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
    notes = notes.map((note) => _GenUtils.default.isInitialized(note) ? note : ""); // wallet rpc rejects json null
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
      amount: config.getDestinations()[0].getAmount(),
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
        if (generation === that.generation && that.isPolling) {// ignore errors from polls straggling after the wallet is closed
          let label = (await that.wallet.getPath()) || that.wallet.getRpcConnection()?.getUri(); // the path is unknown when connected to an already loaded wallet
          console.error("Failed to background poll wallet '" + label + "': " + err.message);
        }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiTW9uZXJvV2FsbGV0UnBjIiwiTW9uZXJvV2FsbGV0IiwiREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwiYWRkcmVzc0NhY2hlIiwic3luY1BlcmlvZEluTXMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRTZXJ2ZXIiLCJvcGVuV2FsbGV0IiwicGF0aE9yQ29uZmlnIiwicGFzc3dvcmQiLCJNb25lcm9XYWxsZXRDb25maWciLCJwYXRoIiwiZ2V0UGF0aCIsImdldFJlZ3Rlc3QiLCJzZW5kSnNvblJlcXVlc3QiLCJmaWxlbmFtZSIsImdldFBhc3N3b3JkIiwiY2xlYXIiLCJfaXNDbG9zZWQiLCJnZXRDb25uZWN0aW9uTWFuYWdlciIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsImNyZWF0ZVdhbGxldCIsImNvbmZpZ05vcm1hbGl6ZWQiLCJnZXRTZWVkIiwiZ2V0UHJpbWFyeUFkZHJlc3MiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFByaXZhdGVTcGVuZEtleSIsImdldE5ldHdvcmtUeXBlIiwiZ2V0QWNjb3VudExvb2thaGVhZCIsImdldFN1YmFkZHJlc3NMb29rYWhlYWQiLCJzZXRQYXNzd29yZCIsInNldFNlcnZlciIsImdldENvbm5lY3Rpb24iLCJjcmVhdGVXYWxsZXRGcm9tU2VlZCIsImNyZWF0ZVdhbGxldEZyb21LZXlzIiwiY3JlYXRlV2FsbGV0UmFuZG9tIiwiZ2V0U2VlZE9mZnNldCIsImdldFJlc3RvcmVIZWlnaHQiLCJnZXRTYXZlQ3VycmVudCIsImdldExhbmd1YWdlIiwic2V0TGFuZ3VhZ2UiLCJERUZBVUxUX0xBTkdVQUdFIiwicGFyYW1zIiwibGFuZ3VhZ2UiLCJlcnIiLCJoYW5kbGVDcmVhdGVXYWxsZXRFcnJvciIsInNlZWQiLCJzZWVkX29mZnNldCIsImVuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWwiLCJnZXRJc011bHRpc2lnIiwicmVzdG9yZV9oZWlnaHQiLCJhdXRvc2F2ZV9jdXJyZW50Iiwic2V0UmVzdG9yZUhlaWdodCIsImFkZHJlc3MiLCJ2aWV3a2V5Iiwic3BlbmRrZXkiLCJuYW1lIiwibWVzc2FnZSIsInRvTG93ZXJDYXNlIiwiaW5jbHVkZXMiLCJNb25lcm9ScGNFcnJvciIsImdldENvZGUiLCJnZXRScGNNZXRob2QiLCJnZXRScGNQYXJhbXMiLCJpc1ZpZXdPbmx5Iiwia2V5X3R5cGUiLCJlIiwidXJpT3JDb25uZWN0aW9uIiwiaXNUcnVzdGVkIiwic3NsT3B0aW9ucyIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiU3NsT3B0aW9ucyIsInNldEFsbG93QW55Q2VydCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsImdldFVyaSIsInVzZXJuYW1lIiwiZ2V0VXNlcm5hbWUiLCJ0cnVzdGVkIiwiaGFzQ2VydGlmaWNhdGVzIiwiZ2V0Q2VydGlmaWNhdGVBdXRob3JpdHlGaWxlIiwiZ2V0QWxsb3dlZEZpbmdlcnByaW50cyIsImxlbmd0aCIsInNzbF9zdXBwb3J0IiwiZ2V0QWxsb3dBbnlDZXJ0Iiwic3NsX3ByaXZhdGVfa2V5X3BhdGgiLCJnZXRQcml2YXRlS2V5UGF0aCIsInNzbF9jZXJ0aWZpY2F0ZV9wYXRoIiwiZ2V0Q2VydGlmaWNhdGVQYXRoIiwic3NsX2NhX2ZpbGUiLCJzc2xfYWxsb3dlZF9maW5nZXJwcmludHMiLCJzc2xfYWxsb3dfYW55X2NlcnQiLCJnZXRQcm94eVVyaSIsInN0YXJ0dXBQcm94eVVyaSIsInByb3h5IiwiaXNTYW1lUHJveHlVcmkiLCJkYWVtb25Db25uZWN0aW9uIiwicmVqZWN0VW5hdXRob3JpemVkIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImdldEJhbGFuY2VzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJhc3NlcnQiLCJlcXVhbCIsImJhbGFuY2UiLCJCaWdJbnQiLCJ1bmxvY2tlZEJhbGFuY2UiLCJhY2NvdW50IiwiZ2V0QWNjb3VudHMiLCJnZXRCYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudF9pbmRleCIsImFkZHJlc3NfaW5kaWNlcyIsInJlc3AiLCJyZXN1bHQiLCJ1bmxvY2tlZF9iYWxhbmNlIiwicGVyX3N1YmFkZHJlc3MiLCJhZGRMaXN0ZW5lciIsInJlZnJlc2hMaXN0ZW5pbmciLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiY2hlY2tSZXNlcnZlUHJvb2YiLCJpbmRleE9mIiwiZ2V0VmVyc2lvbiIsIk1vbmVyb1ZlcnNpb24iLCJ2ZXJzaW9uIiwicmVsZWFzZSIsImdldFNlZWRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJsYW5ndWFnZXMiLCJnZXRBZGRyZXNzIiwic3ViYWRkcmVzc01hcCIsImdldFN1YmFkZHJlc3NlcyIsImdldEFkZHJlc3NJbmRleCIsInN1YmFkZHJlc3MiLCJNb25lcm9TdWJhZGRyZXNzIiwic2V0QWNjb3VudEluZGV4IiwiaW5kZXgiLCJtYWpvciIsInNldEluZGV4IiwibWlub3IiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInN0YW5kYXJkQWRkcmVzcyIsInBheW1lbnRJZCIsImludGVncmF0ZWRBZGRyZXNzU3RyIiwic3RhbmRhcmRfYWRkcmVzcyIsInBheW1lbnRfaWQiLCJpbnRlZ3JhdGVkX2FkZHJlc3MiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImludGVncmF0ZWRBZGRyZXNzIiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJzZXRTdGFuZGFyZEFkZHJlc3MiLCJzZXRQYXltZW50SWQiLCJzZXRJbnRlZ3JhdGVkQWRkcmVzcyIsImdldEhlaWdodCIsImhlaWdodCIsImdldERhZW1vbkhlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsInN5bmMiLCJsaXN0ZW5lck9yU3RhcnRIZWlnaHQiLCJzdGFydEhlaWdodCIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwic3RhcnRfaGVpZ2h0IiwicG9sbCIsIk1vbmVyb1N5bmNSZXN1bHQiLCJibG9ja3NfZmV0Y2hlZCIsInJlY2VpdmVkX21vbmV5Iiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluU2Vjb25kcyIsIk1hdGgiLCJyb3VuZCIsImVuYWJsZSIsInBlcmlvZCIsIndhbGxldFBvbGxlciIsInNldFBlcmlvZEluTXMiLCJnZXRTeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwidHhpZHMiLCJyZXNjYW5TcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwic2tpcEJhbGFuY2VzIiwiYWNjb3VudHMiLCJycGNBY2NvdW50Iiwic3ViYWRkcmVzc19hY2NvdW50cyIsImNvbnZlcnRScGNBY2NvdW50Iiwic2V0U3ViYWRkcmVzc2VzIiwiZ2V0SW5kZXgiLCJwdXNoIiwic2V0QmFsYW5jZSIsInNldFVubG9ja2VkQmFsYW5jZSIsInNldE51bVVuc3BlbnRPdXRwdXRzIiwic2V0TnVtQmxvY2tzVG9VbmxvY2siLCJhbGxfYWNjb3VudHMiLCJycGNTdWJhZGRyZXNzIiwiY29udmVydFJwY1N1YmFkZHJlc3MiLCJnZXRBY2NvdW50SW5kZXgiLCJ0Z3RTdWJhZGRyZXNzIiwiZ2V0TnVtVW5zcGVudE91dHB1dHMiLCJnZXRBY2NvdW50IiwiRXJyb3IiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJNb25lcm9BY2NvdW50IiwicHJpbWFyeUFkZHJlc3MiLCJzdWJhZGRyZXNzSW5kaWNlcyIsImFkZHJlc3NfaW5kZXgiLCJsaXN0aWZ5Iiwic3ViYWRkcmVzc2VzIiwiYWRkcmVzc2VzIiwiZ2V0TnVtQmxvY2tzVG9VbmxvY2siLCJnZXRTdWJhZGRyZXNzIiwiY3JlYXRlU3ViYWRkcmVzcyIsInNldEFkZHJlc3MiLCJzZXRMYWJlbCIsInNldElzVXNlZCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwiZ2V0VHhzQXV4IiwibWF4QXR0ZW1wdHMiLCJxdWVyeU5vcm1hbGl6ZWQiLCJub3JtYWxpemVUeFF1ZXJ5IiwidHJhbnNmZXJRdWVyeSIsImdldFRyYW5zZmVyUXVlcnkiLCJpbnB1dFF1ZXJ5IiwiZ2V0SW5wdXRRdWVyeSIsIm91dHB1dFF1ZXJ5IiwiZ2V0T3V0cHV0UXVlcnkiLCJzZXRUcmFuc2ZlclF1ZXJ5Iiwic2V0SW5wdXRRdWVyeSIsInNldE91dHB1dFF1ZXJ5IiwidHJhbnNmZXJzIiwiZ2V0VHJhbnNmZXJzQXV4IiwiTW9uZXJvVHJhbnNmZXJRdWVyeSIsInNldFR4UXVlcnkiLCJkZWNvbnRleHR1YWxpemUiLCJjb3B5IiwidHhzIiwidHhzU2V0IiwiU2V0IiwidHJhbnNmZXIiLCJnZXRUeCIsImFkZCIsInR4TWFwIiwiYmxvY2tNYXAiLCJ0eCIsIm1lcmdlVHgiLCJnZXRJbmNsdWRlT3V0cHV0cyIsIm91dHB1dFF1ZXJ5QXV4IiwiTW9uZXJvT3V0cHV0UXVlcnkiLCJvdXRwdXRzIiwiZ2V0T3V0cHV0c0F1eCIsIm91dHB1dFR4cyIsIm91dHB1dCIsInR4c1F1ZXJpZWQiLCJtZWV0c0NyaXRlcmlhIiwiZ2V0QmxvY2siLCJzcGxpY2UiLCJnZXRJc0NvbmZpcm1lZCIsImNvbnNvbGUiLCJlcnJvciIsImdldEhhc2hlcyIsInR4c0J5SWQiLCJNYXAiLCJnZXRIYXNoIiwib3JkZXJlZFR4cyIsImhhc2giLCJnZXRUcmFuc2ZlcnMiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiaXNDb250ZXh0dWFsIiwiZ2V0VHhRdWVyeSIsImZpbHRlclRyYW5zZmVycyIsImdldE91dHB1dHMiLCJub3JtYWxpemVPdXRwdXRRdWVyeSIsImZpbHRlck91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwib3V0cHV0c19kYXRhX2hleCIsImltcG9ydE91dHB1dHMiLCJvdXRwdXRzSGV4IiwibnVtX2ltcG9ydGVkIiwiZXhwb3J0S2V5SW1hZ2VzIiwicnBjRXhwb3J0S2V5SW1hZ2VzIiwiaW1wb3J0S2V5SW1hZ2VzIiwia2V5SW1hZ2VzIiwib2Zmc2V0IiwicnBjS2V5SW1hZ2VzIiwibWFwIiwia2V5SW1hZ2UiLCJrZXlfaW1hZ2UiLCJnZXRIZXgiLCJzaWduYXR1cmUiLCJnZXRTaWduYXR1cmUiLCJzaWduZWRfa2V5X2ltYWdlcyIsImltcG9ydFJlc3VsdCIsIk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0Iiwic2V0SGVpZ2h0Iiwic2V0U3BlbnRBbW91bnQiLCJzcGVudCIsInNldFVuc3BlbnRBbW91bnQiLCJ1bnNwZW50IiwiZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQiLCJnZXRLZXlJbWFnZXMiLCJmcmVlemVPdXRwdXQiLCJ0aGF3T3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJmcm96ZW4iLCJnZXREZWZhdWx0RmVlUHJpb3JpdHkiLCJwcmlvcml0eSIsImNyZWF0ZVR4cyIsIm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyIsImdldENhblNwbGl0Iiwic2V0Q2FuU3BsaXQiLCJnZXRSZWxheSIsImlzTXVsdGlzaWciLCJnZXRTdWJhZGRyZXNzSW5kaWNlcyIsInNsaWNlIiwiZGVzdGluYXRpb25zIiwiZGVzdGluYXRpb24iLCJnZXREZXN0aW5hdGlvbnMiLCJnZXRBbW91bnQiLCJhbW91bnQiLCJnZXRTdWJ0cmFjdEZlZUZyb20iLCJzdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzIiwic3ViYWRkcl9pbmRpY2VzIiwiZ2V0UGF5bWVudElkIiwiZG9fbm90X3JlbGF5IiwiZ2V0UHJpb3JpdHkiLCJnZXRfdHhfaGV4IiwiZ2V0X3R4X21ldGFkYXRhIiwiZ2V0X3R4X2tleXMiLCJnZXRfdHhfa2V5IiwibnVtVHhzIiwiZmVlX2xpc3QiLCJmZWUiLCJjb3B5RGVzdGluYXRpb25zIiwiaSIsIk1vbmVyb1R4V2FsbGV0IiwiaW5pdFNlbnRUeFdhbGxldCIsImdldE91dGdvaW5nVHJhbnNmZXIiLCJzZXRTdWJhZGRyZXNzSW5kaWNlcyIsImNvbnZlcnRScGNTZW50VHhzVG9UeFNldCIsImNvbnZlcnRScGNUeFRvVHhTZXQiLCJzd2VlcE91dHB1dCIsIm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnIiwiZ2V0S2V5SW1hZ2UiLCJzZXRBbW91bnQiLCJzd2VlcFVubG9ja2VkIiwibm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyIsImluZGljZXMiLCJrZXlzIiwic2V0U3dlZXBFYWNoU3ViYWRkcmVzcyIsImdldFN3ZWVwRWFjaFN1YmFkZHJlc3MiLCJycGNTd2VlcEFjY291bnQiLCJzd2VlcER1c3QiLCJyZWxheSIsInR4U2V0Iiwic2V0SXNSZWxheWVkIiwic2V0SW5UeFBvb2wiLCJnZXRJc1JlbGF5ZWQiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiQXJyYXkiLCJpc0FycmF5IiwidHhPck1ldGFkYXRhIiwibWV0YWRhdGEiLCJnZXRNZXRhZGF0YSIsImhleCIsInR4X2hhc2giLCJkZXNjcmliZVR4U2V0IiwidW5zaWduZWRfdHhzZXQiLCJnZXRVbnNpZ25lZFR4SGV4IiwibXVsdGlzaWdfdHhzZXQiLCJnZXRNdWx0aXNpZ1R4SGV4IiwiY29udmVydFJwY0Rlc2NyaWJlVHJhbnNmZXIiLCJzaWduVHhzIiwidW5zaWduZWRUeEhleCIsImV4cG9ydF9yYXciLCJzdWJtaXRUeHMiLCJzaWduZWRUeEhleCIsInR4X2RhdGFfaGV4IiwidHhfaGFzaF9saXN0Iiwic2lnbk1lc3NhZ2UiLCJzaWduYXR1cmVUeXBlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJTSUdOX1dJVEhfU1BFTkRfS0VZIiwiZGF0YSIsInNpZ25hdHVyZV90eXBlIiwidmVyaWZ5TWVzc2FnZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJnb29kIiwiaXNHb29kIiwiaXNPbGQiLCJvbGQiLCJTSUdOX1dJVEhfVklFV19LRVkiLCJnZXRUeEtleSIsInR4SGFzaCIsInR4aWQiLCJ0eF9rZXkiLCJjaGVja1R4S2V5IiwidHhLZXkiLCJjaGVjayIsIk1vbmVyb0NoZWNrVHgiLCJzZXRJc0dvb2QiLCJzZXROdW1Db25maXJtYXRpb25zIiwiY29uZmlybWF0aW9ucyIsImluX3Bvb2wiLCJzZXRSZWNlaXZlZEFtb3VudCIsInJlY2VpdmVkIiwiZ2V0VHhQcm9vZiIsImNoZWNrVHhQcm9vZiIsInN0YXJ0c1dpdGgiLCJnZXRTcGVuZFByb29mIiwiY2hlY2tTcGVuZFByb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsIk1vbmVyb0NoZWNrUmVzZXJ2ZSIsInNldFVuY29uZmlybWVkU3BlbnRBbW91bnQiLCJzZXRUb3RhbEFtb3VudCIsInRvdGFsIiwiZ2V0VHhOb3RlcyIsIm5vdGVzIiwic2V0VHhOb3RlcyIsIm5vdGUiLCJpc0luaXRpYWxpemVkIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiZW50cmllcyIsInJwY0VudHJ5IiwiTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsInNldERlc2NyaXB0aW9uIiwiZGVzY3JpcHRpb24iLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJzZXRfYWRkcmVzcyIsInNldF9kZXNjcmlwdGlvbiIsImRlbGV0ZUFkZHJlc3NCb29rRW50cnkiLCJlbnRyeUlkeCIsInRhZ0FjY291bnRzIiwiYWNjb3VudEluZGljZXMiLCJ1bnRhZ0FjY291bnRzIiwiZ2V0QWNjb3VudFRhZ3MiLCJ0YWdzIiwiYWNjb3VudF90YWdzIiwicnBjQWNjb3VudFRhZyIsIk1vbmVyb0FjY291bnRUYWciLCJzZXRBY2NvdW50VGFnTGFiZWwiLCJnZXRQYXltZW50VXJpIiwicmVjaXBpZW50X25hbWUiLCJnZXRSZWNpcGllbnROYW1lIiwidHhfZGVzY3JpcHRpb24iLCJnZXROb3RlIiwidXJpIiwicGFyc2VQYXltZW50VXJpIiwiTW9uZXJvVHhDb25maWciLCJzZXRSZWNpcGllbnROYW1lIiwic2V0Tm90ZSIsImdldEF0dHJpYnV0ZSIsInZhbHVlIiwic2V0QXR0cmlidXRlIiwidmFsIiwic3RhcnRNaW5pbmciLCJudW1UaHJlYWRzIiwiYmFja2dyb3VuZE1pbmluZyIsImlnbm9yZUJhdHRlcnkiLCJ0aHJlYWRzX2NvdW50IiwiZG9fYmFja2dyb3VuZF9taW5pbmciLCJpZ25vcmVfYmF0dGVyeSIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwibXVsdGlzaWdfaW1wb3J0X25lZWRlZCIsImdldE11bHRpc2lnSW5mbyIsImluZm8iLCJNb25lcm9NdWx0aXNpZ0luZm8iLCJzZXRJc011bHRpc2lnIiwibXVsdGlzaWciLCJzZXRJc1JlYWR5IiwicmVhZHkiLCJzZXRUaHJlc2hvbGQiLCJ0aHJlc2hvbGQiLCJzZXROdW1QYXJ0aWNpcGFudHMiLCJwcmVwYXJlTXVsdGlzaWciLCJtdWx0aXNpZ19pbmZvIiwibWFrZU11bHRpc2lnIiwibXVsdGlzaWdIZXhlcyIsImV4Y2hhbmdlTXVsdGlzaWdLZXlzIiwibXNSZXN1bHQiLCJNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQiLCJzZXRNdWx0aXNpZ0hleCIsImdldE11bHRpc2lnSGV4IiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJpbXBvcnRNdWx0aXNpZ0hleCIsInJlZnJlc2hBZnRlckltcG9ydCIsInJlZnJlc2hfYWZ0ZXJfaW1wb3J0Iiwibl9vdXRwdXRzIiwic2lnbk11bHRpc2lnVHhIZXgiLCJtdWx0aXNpZ1R4SGV4Iiwic2lnblJlc3VsdCIsIk1vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsInNldFNpZ25lZE11bHRpc2lnVHhIZXgiLCJzZXRUeEhhc2hlcyIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4IiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwib2xkX3Bhc3N3b3JkIiwibmV3X3Bhc3N3b3JkIiwic2F2ZSIsImNsb3NlIiwiaXNDbG9zZWQiLCJzdG9wIiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJnZXRPdXRnb2luZ1RyYW5zZmVycyIsImNyZWF0ZVR4IiwicmVsYXlUeCIsImdldFR4Tm90ZSIsInNldFR4Tm90ZSIsImNvbm5lY3RUb1dhbGxldFJwYyIsInVyaU9yQ29uZmlnIiwibm9ybWFsaXplQ29uZmlnIiwiY21kIiwic3RhcnRXYWxsZXRScGNQcm9jZXNzIiwiY2hpbGRfcHJvY2VzcyIsIlByb21pc2UiLCJyZXNvbHZlIiwidGhlbiIsImNoaWxkUHJvY2VzcyIsInNwYXduIiwiZW52IiwiTEFORyIsInN0ZG91dCIsInNldEVuY29kaW5nIiwic3RkZXJyIiwidGhhdCIsInJlamVjdCIsIm9uIiwibGluZSIsInRvU3RyaW5nIiwiTGlicmFyeVV0aWxzIiwibG9nIiwidXJpTGluZUNvbnRhaW5zIiwidXJpTGluZUNvbnRhaW5zSWR4IiwiaG9zdCIsInN1YnN0cmluZyIsImxhc3RJbmRleE9mIiwidW5mb3JtYXR0ZWRMaW5lIiwicmVwbGFjZSIsInRyaW0iLCJwb3J0Iiwic3NsSWR4Iiwic3NsRW5hYmxlZCIsInVzZXJQYXNzSWR4IiwidXNlclBhc3MiLCJ6bXFVcmlJZHgiLCJ6bXFVcmkiLCJwcm94eVVyaUlkeCIsInByb3h5VXJpIiwid2FsbGV0IiwiaXNSZXNvbHZlZCIsImdldExvZ0xldmVsIiwiY29kZSIsIm9yaWdpbiIsImxpc3RlbmVyR2VuZXJhdGlvbiIsInJlc2V0IiwiZ2V0QWNjb3VudEluZGljZXMiLCJ0eFF1ZXJ5IiwiY2FuQmVDb25maXJtZWQiLCJnZXRJblR4UG9vbCIsImdldElzRmFpbGVkIiwiY2FuQmVJblR4UG9vbCIsImdldE1heEhlaWdodCIsImdldElzTG9ja2VkIiwiY2FuQmVJbmNvbWluZyIsImdldElzSW5jb21pbmciLCJnZXRJc091dGdvaW5nIiwiZ2V0SGFzRGVzdGluYXRpb25zIiwiY2FuQmVPdXRnb2luZyIsImluIiwib3V0IiwicG9vbCIsInBlbmRpbmciLCJmYWlsZWQiLCJnZXRNaW5IZWlnaHQiLCJtaW5faGVpZ2h0IiwibWF4X2hlaWdodCIsImZpbHRlcl9ieV9oZWlnaHQiLCJnZXRTdWJhZGRyZXNzSW5kZXgiLCJzaXplIiwiZnJvbSIsInJwY1R4IiwiY29udmVydFJwY1R4V2l0aFRyYW5zZmVyIiwiZ2V0T3V0Z29pbmdBbW91bnQiLCJvdXRnb2luZ1RyYW5zZmVyIiwidHJhbnNmZXJUb3RhbCIsInZhbHVlcyIsInNvcnQiLCJjb21wYXJlVHhzQnlIZWlnaHQiLCJzZXRJc0luY29taW5nIiwic2V0SXNPdXRnb2luZyIsImNvbXBhcmVJbmNvbWluZ1RyYW5zZmVycyIsInRyYW5zZmVyX3R5cGUiLCJnZXRJc1NwZW50IiwidmVyYm9zZSIsInJwY091dHB1dCIsImNvbnZlcnRScGNUeFdpdGhPdXRwdXQiLCJjb21wYXJlT3V0cHV0cyIsInJwY0ltYWdlIiwiTW9uZXJvS2V5SW1hZ2UiLCJNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCIsInNldE9mZnNldCIsInNldEtleUltYWdlcyIsImJlbG93X2Ftb3VudCIsImdldEJlbG93QW1vdW50Iiwic2V0SXNMb2NrZWQiLCJzZXRJc0NvbmZpcm1lZCIsInNldFJlbGF5Iiwic2V0SXNNaW5lclR4Iiwic2V0SXNGYWlsZWQiLCJNb25lcm9EZXN0aW5hdGlvbiIsInNldERlc3RpbmF0aW9ucyIsInNldE91dGdvaW5nVHJhbnNmZXIiLCJnZXRVbmxvY2tUaW1lIiwic2V0VW5sb2NrVGltZSIsImdldExhc3RSZWxheWVkVGltZXN0YW1wIiwic2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJEYXRlIiwiZ2V0VGltZSIsImdldElzRG91YmxlU3BlbmRTZWVuIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJsaXN0ZW5lcnMiLCJXYWxsZXRQb2xsZXIiLCJzZXRJc1BvbGxpbmciLCJpc1BvbGxpbmciLCJzZXJ2ZXIiLCJwcm94eVRvV29ya2VyIiwic2V0UHJpbWFyeUFkZHJlc3MiLCJzZXRUYWciLCJnZXRUYWciLCJzZXRSaW5nU2l6ZSIsIk1vbmVyb1V0aWxzIiwiUklOR19TSVpFIiwiTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciIsInNldFR4IiwiZGVzdENvcGllcyIsImRlc3QiLCJjb252ZXJ0UnBjVHhTZXQiLCJycGNNYXAiLCJNb25lcm9UeFNldCIsInNldE11bHRpc2lnVHhIZXgiLCJzZXRVbnNpZ25lZFR4SGV4Iiwic2V0U2lnbmVkVHhIZXgiLCJzaWduZWRfdHhzZXQiLCJnZXRTaWduZWRUeEhleCIsInJwY1R4cyIsInNldFR4cyIsInNldFR4U2V0Iiwic2V0SGFzaCIsInNldEtleSIsInNldEZ1bGxIZXgiLCJzZXRNZXRhZGF0YSIsInNldEZlZSIsInNldFdlaWdodCIsImlucHV0S2V5SW1hZ2VzTGlzdCIsImFzc2VydFRydWUiLCJnZXRJbnB1dHMiLCJzZXRJbnB1dHMiLCJpbnB1dEtleUltYWdlIiwiTW9uZXJvT3V0cHV0V2FsbGV0Iiwic2V0S2V5SW1hZ2UiLCJzZXRIZXgiLCJhbW91bnRzQnlEZXN0TGlzdCIsImRlc3RpbmF0aW9uSWR4IiwidHhJZHgiLCJhbW91bnRzQnlEZXN0IiwiaXNPdXRnb2luZyIsInR5cGUiLCJkZWNvZGVScGNUeXBlIiwiaGVhZGVyIiwic2V0U2l6ZSIsIk1vbmVyb0Jsb2NrSGVhZGVyIiwic2V0VGltZXN0YW1wIiwiTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsInNldE51bVN1Z2dlc3RlZENvbmZpcm1hdGlvbnMiLCJERUZBVUxUX1BBWU1FTlRfSUQiLCJycGNJbmRpY2VzIiwicnBjSW5kZXgiLCJzZXRTdWJhZGRyZXNzSW5kZXgiLCJycGNEZXN0aW5hdGlvbiIsImRlc3RpbmF0aW9uS2V5IiwicnBjU291cmNlIiwiaW5wdXQiLCJnbG9iYWxfaW5kZXgiLCJwdWJrZXkiLCJzZXRTdGVhbHRoUHVibGljS2V5Iiwic2V0SW5wdXRTdW0iLCJzZXRPdXRwdXRTdW0iLCJzZXRDaGFuZ2VBZGRyZXNzIiwic2V0Q2hhbmdlQW1vdW50Iiwic2V0TnVtRHVtbXlPdXRwdXRzIiwic2V0RXh0cmFIZXgiLCJpbnB1dEtleUltYWdlcyIsImtleV9pbWFnZXMiLCJhbW91bnRzIiwic2V0QmxvY2siLCJNb25lcm9CbG9jayIsIm1lcmdlIiwic2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJzZXRJc1NwZW50Iiwic2V0SXNGcm96ZW4iLCJzZXRPdXRwdXRzIiwicnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdCIsInJwY1R5cGUiLCJhVHgiLCJhQmxvY2siLCJ0eDEiLCJ0eDIiLCJkaWZmIiwidDEiLCJ0MiIsIm8xIiwibzIiLCJoZWlnaHRDb21wYXJpc29uIiwiY29tcGFyZSIsImxvY2FsZUNvbXBhcmUiLCJleHBvcnRzIiwicHJldkxvY2tlZFR4c01pbkhlaWdodCIsImdlbmVyYXRpb24iLCJzbmFwc2hvdEdlbmVyYXRpb24iLCJsb29wZXIiLCJUYXNrTG9vcGVyIiwicHJldkxvY2tlZFR4cyIsInByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnMiLCJwcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucyIsInRocmVhZFBvb2wiLCJUaHJlYWRQb29sIiwibnVtUG9sbGluZyIsInN0YXJ0IiwicGVyaW9kSW5NcyIsInN1Ym1pdCIsInByZXZIZWlnaHQiLCJwcmV2QmFsYW5jZXMiLCJNb25lcm9UeFF1ZXJ5Iiwib25OZXdCbG9jayIsIm1pbkhlaWdodCIsIm1heCIsImxvY2tlZFR4cyIsInNldE1pbkhlaWdodCIsInNldEluY2x1ZGVPdXRwdXRzIiwibm9Mb25nZXJMb2NrZWRIYXNoZXMiLCJwcmV2TG9ja2VkVHgiLCJwcmV2TWluSGVpZ2h0IiwidW5sb2NrZWRUeHMiLCJzZXRIYXNoZXMiLCJsb2NrZWRUeCIsInNlYXJjaFNldCIsInVuYW5ub3VuY2VkIiwibm90aWZ5T3V0cHV0cyIsInVubG9ja2VkVHgiLCJtaXNzZWRDb25maXJtIiwiZGVsZXRlIiwiY29uZmlybWVkVHgiLCJjaGVja0ZvckNoYW5nZWRCYWxhbmNlcyIsImFubm91bmNlTmV3QmxvY2siLCJnZXRGZWUiLCJhbm5vdW5jZU91dHB1dFNwZW50IiwiYW5ub3VuY2VPdXRwdXRSZWNlaXZlZCIsImJhbGFuY2VzIiwiYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0UnBjLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuLi9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBUYXNrTG9vcGVyIGZyb20gXCIuLi9jb21tb24vVGFza0xvb3BlclwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnRUYWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFRhZ1wiO1xuaW1wb3J0IE1vbmVyb0FkZHJlc3NCb29rRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9CbG9ja0hlYWRlciBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrSGVhZGVyXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tSZXNlcnZlIGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrUmVzZXJ2ZVwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrVHggZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tUeFwiO1xuaW1wb3J0IE1vbmVyb0Rlc3RpbmF0aW9uIGZyb20gXCIuL21vZGVsL01vbmVyb0Rlc3RpbmF0aW9uXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0luY29taW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW5jb21pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbmZvXCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5pdFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHRcIjtcbmltcG9ydCBNb25lcm9PdXRnb2luZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb091dGdvaW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1JwY0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjRXJyb3JcIjtcbmltcG9ydCBNb25lcm9TdWJhZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb1N1YmFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9TeW5jUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb1N5bmNSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyUXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVHhcIjtcbmltcG9ydCBNb25lcm9UeENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb1R4UHJpb3JpdHkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhQcmlvcml0eVwiO1xuaW1wb3J0IE1vbmVyb1R4UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4U2V0XCI7XG5pbXBvcnQgTW9uZXJvVHhXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9VdGlscyBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1V0aWxzXCI7XG5pbXBvcnQgTW9uZXJvVmVyc2lvbiBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1ZlcnNpb25cIjtcbmltcG9ydCBNb25lcm9XYWxsZXQgZnJvbSBcIi4vTW9uZXJvV2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldExpc3RlbmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldExpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGVcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHRcIjtcbmltcG9ydCBUaHJlYWRQb29sIGZyb20gXCIuLi9jb21tb24vVGhyZWFkUG9vbFwiO1xuaW1wb3J0IFNzbE9wdGlvbnMgZnJvbSBcIi4uL2NvbW1vbi9Tc2xPcHRpb25zXCI7XG5pbXBvcnQgeyBDaGlsZFByb2Nlc3MgfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuXG4vKipcbiAqIENvcHlyaWdodCAoYykgd29vZHNlclxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvV2FsbGV0IGFzIGEgY2xpZW50IG9mIG1vbmVyby13YWxsZXQtcnBjLlxuICogXG4gKiBAaW1wbGVtZW50cyB7TW9uZXJvV2FsbGV0fVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9XYWxsZXRScGMgZXh0ZW5kcyBNb25lcm9XYWxsZXQge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TID0gMjAwMDA7IC8vIGRlZmF1bHQgcGVyaW9kIGJldHdlZW4gc3luY3MgaW4gbXMgKGRlZmluZWQgYnkgREVGQVVMVF9BVVRPX1JFRlJFU0hfUEVSSU9EIGluIHdhbGxldF9ycGNfc2VydmVyLmNwcClcblxuICAvLyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+O1xuICBwcm90ZWN0ZWQgYWRkcmVzc0NhY2hlOiBhbnk7XG4gIHByb3RlY3RlZCBzeW5jUGVyaW9kSW5NczogbnVtYmVyO1xuICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiBNb25lcm9XYWxsZXRMaXN0ZW5lcltdO1xuICBwcm90ZWN0ZWQgcHJvY2VzczogYW55O1xuICBwcm90ZWN0ZWQgcGF0aDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgZGFlbW9uQ29ubmVjdGlvbjogTW9uZXJvUnBjQ29ubmVjdGlvbjtcbiAgcHJvdGVjdGVkIHdhbGxldFBvbGxlcjogV2FsbGV0UG9sbGVyO1xuICBwcm90ZWN0ZWQgc3RhcnR1cFByb3h5VXJpOiBzdHJpbmc7XG4gIFxuICAvKiogQHByaXZhdGUgKi9cbiAgY29uc3RydWN0b3IoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307IC8vIGF2b2lkIHVuZWNlc3NhcnkgcmVxdWVzdHMgZm9yIGFkZHJlc3Nlc1xuICAgIHRoaXMuc3luY1BlcmlvZEluTXMgPSBNb25lcm9XYWxsZXRScGMuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUztcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFJQQyBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm8td2FsbGV0LXJwYy5cbiAgICogXG4gICAqIEByZXR1cm4ge0NoaWxkUHJvY2Vzc30gdGhlIHByb2Nlc3MgcnVubmluZyBtb25lcm8td2FsbGV0LXJwYywgdW5kZWZpbmVkIGlmIG5vdCBjcmVhdGVkIGZyb20gbmV3IHByb2Nlc3NcbiAgICovXG4gIGdldFByb2Nlc3MoKTogQ2hpbGRQcm9jZXNzIHtcbiAgICByZXR1cm4gdGhpcy5wcm9jZXNzO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RvcCB0aGUgaW50ZXJuYWwgcHJvY2VzcyBydW5uaW5nIG1vbmVyby13YWxsZXQtcnBjLCBpZiBhcHBsaWNhYmxlLlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBmb3JjZSBzcGVjaWZpZXMgaWYgdGhlIHByb2Nlc3Mgc2hvdWxkIGJlIGRlc3Ryb3llZCBmb3JjaWJseSAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+fSB0aGUgZXhpdCBjb2RlIGZyb20gc3RvcHBpbmcgdGhlIHByb2Nlc3NcbiAgICovXG4gIGFzeW5jIHN0b3BQcm9jZXNzKGZvcmNlID0gZmFsc2UpOiBQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD4gIHtcbiAgICBpZiAodGhpcy5wcm9jZXNzID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb1dhbGxldFJwYyBpbnN0YW5jZSBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXCIpO1xuICAgIGxldCBsaXN0ZW5lcnNDb3B5ID0gR2VuVXRpbHMuY29weUFycmF5KHRoaXMuZ2V0TGlzdGVuZXJzKCkpO1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIGxpc3RlbmVyc0NvcHkpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHJldHVybiBHZW5VdGlscy5raWxsUHJvY2Vzcyh0aGlzLnByb2Nlc3MsIGZvcmNlID8gXCJTSUdLSUxMXCIgOiB1bmRlZmluZWQpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBSUEMgY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEByZXR1cm4ge01vbmVyb1JwY0Nvbm5lY3Rpb24gfCB1bmRlZmluZWR9IHRoZSB3YWxsZXQncyBycGMgY29ubmVjdGlvblxuICAgKi9cbiAgZ2V0UnBjQ29ubmVjdGlvbigpOiBNb25lcm9ScGNDb25uZWN0aW9uIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5PcGVuIGFuIGV4aXN0aW5nIHdhbGxldCBvbiB0aGUgbW9uZXJvLXdhbGxldC1ycGMgc2VydmVyLjwvcD5cbiAgICogXG4gICAqIDxwPkV4YW1wbGU6PHA+XG4gICAqIFxuICAgKiA8Y29kZT5cbiAgICogbGV0IHdhbGxldCA9IG5ldyBNb25lcm9XYWxsZXRScGMoXCJodHRwOi8vbG9jYWxob3N0OjM4MDg0XCIsIFwicnBjX3VzZXJcIiwgXCJhYmMxMjNcIik7PGJyPlxuICAgKiBhd2FpdCB3YWxsZXQub3BlbldhbGxldChcIm15d2FsbGV0MVwiLCBcInN1cGVyc2VjcmV0cGFzc3dvcmRcIik7PGJyPlxuICAgKiA8YnI+XG4gICAqIGF3YWl0IHdhbGxldC5vcGVuV2FsbGV0KHs8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXRoOiBcIm15d2FsbGV0MlwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcInN1cGVyc2VjcmV0cGFzc3dvcmRcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBzZXJ2ZXI6IFwiaHR0cDovL2xvY2Fob3N0OjM4MDgxXCIsIC8vIG9yIG9iamVjdCB3aXRoIHVyaSwgdXNlcm5hbWUsIHBhc3N3b3JkLCBldGMgPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZTxicj5cbiAgICogfSk7PGJyPlxuICAgKiA8L2NvZGU+XG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ3xNb25lcm9XYWxsZXRDb25maWd9IHBhdGhPckNvbmZpZyAgLSB0aGUgd2FsbGV0J3MgbmFtZSBvciBjb25maWd1cmF0aW9uIHRvIG9wZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhPckNvbmZpZy5wYXRoIC0gcGF0aCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIGluLW1lbW9yeSB3YWxsZXQgaWYgbm90IGdpdmVuKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aE9yQ29uZmlnLnBhc3N3b3JkIC0gcGFzc3dvcmQgb2YgdGhlIHdhbGxldCB0byBjcmVhdGVcbiAgICogQHBhcmFtIHtzdHJpbmd8UGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPn0gcGF0aE9yQ29uZmlnLnNlcnZlciAtIHVyaSBvciBNb25lcm9ScGNDb25uZWN0aW9uIG9mIGEgZGFlbW9uIHRvIHVzZSAob3B0aW9uYWwsIG1vbmVyby13YWxsZXQtcnBjIHVzdWFsbHkgc3RhcnRlZCB3aXRoIGRhZW1vbiBjb25maWcpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcGFzc3dvcmRdIHRoZSB3YWxsZXQncyBwYXNzd29yZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1dhbGxldFJwYz59IHRoaXMgd2FsbGV0IGNsaWVudFxuICAgKi9cbiAgYXN5bmMgb3BlbldhbGxldChwYXRoT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPiwgcGFzc3dvcmQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgbGV0IGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcodHlwZW9mIHBhdGhPckNvbmZpZyA9PT0gXCJzdHJpbmdcIiA/IHtwYXRoOiBwYXRoT3JDb25maWcsIHBhc3N3b3JkOiBwYXNzd29yZCA/IHBhc3N3b3JkIDogXCJcIn0gOiBwYXRoT3JDb25maWcpO1xuICAgIC8vIFRPRE86IGVuc3VyZSBvdGhlciBmaWVsZHMgdW5pbml0aWFsaXplZD9cbiAgICBcbiAgICAvLyBvcGVuIHdhbGxldCBvbiBycGMgc2VydmVyXG4gICAgaWYgKCFjb25maWcuZ2V0UGF0aCgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgbmFtZSBvZiB3YWxsZXQgdG8gb3BlblwiKTtcbiAgICBpZiAoY29uZmlnLmdldFJlZ3Rlc3QoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSByZWd0ZXN0IG1vZGUgd2hlbiBvcGVuaW5nIFJQQyB3YWxsZXRcIilcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJvcGVuX3dhbGxldFwiLCB7ZmlsZW5hbWU6IGNvbmZpZy5nZXRQYXRoKCksIHBhc3N3b3JkOiBjb25maWcuZ2V0UGFzc3dvcmQoKX0pO1xuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuICAgIHRoaXMuX2lzQ2xvc2VkID0gZmFsc2U7XG5cbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyIG9yIHNlcnZlclxuICAgIGlmIChjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSAhPSBudWxsKSB7XG4gICAgICBpZiAoY29uZmlnLmdldFNlcnZlcigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIG9wZW5lZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBhd2FpdCB0aGlzLnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICB9IGVsc2UgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSAhPSBudWxsKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldERhZW1vbkNvbm5lY3Rpb24oY29uZmlnLmdldFNlcnZlcigpKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5DcmVhdGUgYW5kIG9wZW4gYSB3YWxsZXQgb24gdGhlIG1vbmVyby13YWxsZXQtcnBjIHNlcnZlci48cD5cbiAgICogXG4gICAqIDxwPkV4YW1wbGU6PHA+XG4gICAqIFxuICAgKiA8Y29kZT5cbiAgICogJnNvbDsmc29sOyBjb25zdHJ1Y3QgY2xpZW50IHRvIG1vbmVyby13YWxsZXQtcnBjPGJyPlxuICAgKiBsZXQgd2FsbGV0UnBjID0gbmV3IE1vbmVyb1dhbGxldFJwYyhcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODRcIiwgXCJycGNfdXNlclwiLCBcImFiYzEyM1wiKTs8YnI+PGJyPlxuICAgKiBcbiAgICogJnNvbDsmc29sOyBjcmVhdGUgYW5kIG9wZW4gd2FsbGV0IG9uIG1vbmVyby13YWxsZXQtcnBjPGJyPlxuICAgKiBhd2FpdCB3YWxsZXRScGMuY3JlYXRlV2FsbGV0KHs8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXRoOiBcIm15d2FsbGV0XCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiYWJjMTIzXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VlZDogXCJjb2V4aXN0IGlnbG9vIHBhbXBobGV0IGxhZ29vbi4uLlwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlc3RvcmVIZWlnaHQ6IDE1NDMyMThsPGJyPlxuICAgKiB9KTtcbiAgICogIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+fSBjb25maWcgLSBNb25lcm9XYWxsZXRDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF0aF0gLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhc3N3b3JkXSAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRdIC0gc2VlZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIHJhbmRvbSB3YWxsZXQgY3JlYXRlZCBpZiBuZWl0aGVyIHNlZWQgbm9yIGtleXMgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRPZmZzZXRdIC0gdGhlIG9mZnNldCB1c2VkIHRvIGRlcml2ZSBhIG5ldyBzZWVkIGZyb20gdGhlIGdpdmVuIHNlZWQgdG8gcmVjb3ZlciBhIHNlY3JldCB3YWxsZXQgZnJvbSB0aGUgc2VlZFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuaXNNdWx0aXNpZ10gLSByZXN0b3JlIG11bHRpc2lnIHdhbGxldCBmcm9tIHNlZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpbWFyeUFkZHJlc3NdIC0gcHJpbWFyeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmx5IHByb3ZpZGUgaWYgcmVzdG9yaW5nIGZyb20ga2V5cylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVZpZXdLZXldIC0gcHJpdmF0ZSB2aWV3IGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVTcGVuZEtleV0gLSBwcml2YXRlIHNwZW5kIGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnJlc3RvcmVIZWlnaHRdIC0gYmxvY2sgaGVpZ2h0IHRvIHN0YXJ0IHNjYW5uaW5nIGZyb20gKGRlZmF1bHRzIHRvIDAgdW5sZXNzIGdlbmVyYXRpbmcgcmFuZG9tIHdhbGxldClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcubGFuZ3VhZ2VdIC0gbGFuZ3VhZ2Ugb2YgdGhlIHdhbGxldCdzIG1uZW1vbmljIHBocmFzZSBvciBzZWVkIChkZWZhdWx0cyB0byBcIkVuZ2xpc2hcIiBvciBhdXRvLWRldGVjdGVkKVxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb259IFtjb25maWcuc2VydmVyXSAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gdG8gYSBtb25lcm8gZGFlbW9uIChvcHRpb25hbCk8YnI+XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclVyaV0gLSB1cmkgb2YgYSBkYWVtb24gdG8gdXNlIChvcHRpb25hbCwgbW9uZXJvLXdhbGxldC1ycGMgdXN1YWxseSBzdGFydGVkIHdpdGggZGFlbW9uIGNvbmZpZylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyVXNlcm5hbWVdIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIGRhZW1vbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclBhc3N3b3JkXSAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBkYWVtb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSBbY29uZmlnLmNvbm5lY3Rpb25NYW5hZ2VyXSAtIG1hbmFnZSBjb25uZWN0aW9ucyB0byBtb25lcm9kIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlamVjdFVuYXV0aG9yaXplZF0gLSByZWplY3Qgc2VsZi1zaWduZWQgc2VydmVyIGNlcnRpZmljYXRlcyBpZiB0cnVlIChkZWZhdWx0cyB0byB0cnVlKVxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb259IFtjb25maWcuc2VydmVyXSAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb3IgZXF1aXZhbGVudCBKUyBvYmplY3QgcHJvdmlkaW5nIGRhZW1vbiBjb25maWd1cmF0aW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnNhdmVDdXJyZW50XSAtIHNwZWNpZmllcyBpZiB0aGUgY3VycmVudCBSUEMgd2FsbGV0IHNob3VsZCBiZSBzYXZlZCBiZWZvcmUgYmVpbmcgY2xvc2VkIChkZWZhdWx0IHRydWUpXG4gICAqIEByZXR1cm4ge01vbmVyb1dhbGxldFJwY30gdGhpcyB3YWxsZXQgY2xpZW50XG4gICAqL1xuICBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgY29uZmlnIHRvIGNyZWF0ZSB3YWxsZXRcIik7XG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCAmJiAoY29uZmlnTm9ybWFsaXplZC5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBpbml0aWFsaXplZCB3aXRoIGEgc2VlZCBvciBrZXlzIGJ1dCBub3QgYm90aFwiKTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVndGVzdCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHJlZ3Rlc3QgbW9kZSB3aGVuIGNyZWF0aW5nIFJQQyB3YWxsZXRcIilcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXROZXR3b3JrVHlwZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIG5ldHdvcmtUeXBlIHdoZW4gY3JlYXRpbmcgUlBDIHdhbGxldCBiZWNhdXNlIHNlcnZlcidzIG5ldHdvcmsgdHlwZSBpcyBhbHJlYWR5IHNldFwiKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50TG9va2FoZWFkKCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NMb29rYWhlYWQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGNyZWF0aW5nIHdhbGxldHMgd2l0aCBzdWJhZGRyZXNzIGxvb2thaGVhZCBvdmVyIHJwY1wiKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRQYXNzd29yZCgpID09PSB1bmRlZmluZWQpIGNvbmZpZ05vcm1hbGl6ZWQuc2V0UGFzc3dvcmQoXCJcIik7XG5cbiAgICAvLyBzZXQgc2VydmVyIGZyb20gY29ubmVjdGlvbiBtYW5hZ2VyIGlmIHByb3ZpZGVkXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgY3JlYXRlZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBjb25maWdOb3JtYWxpemVkLnNldFNlcnZlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKS5nZXRDb25uZWN0aW9uKCkpO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCkgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWdOb3JtYWxpemVkKTtcbiAgICBlbHNlIGlmIChjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQpIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0RnJvbUtleXMoY29uZmlnTm9ybWFsaXplZCk7XG4gICAgZWxzZSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldFJhbmRvbShjb25maWdOb3JtYWxpemVkKTtcbiAgICB0aGlzLl9pc0Nsb3NlZCA9IGZhbHNlO1xuXG4gICAgLy8gc2V0IGNvbm5lY3Rpb24gbWFuYWdlciBvciBzZXJ2ZXJcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSk7XG4gICAgfSBlbHNlIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlcnZlcigpKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldERhZW1vbkNvbm5lY3Rpb24oY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgcmVzdG9yZUhlaWdodCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSBmYWxzZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ3VycmVudCB3YWxsZXQgaXMgc2F2ZWQgYXV0b21hdGljYWxseSB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0UGF0aCgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOYW1lIGlzIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICBpZiAoIWNvbmZpZy5nZXRMYW5ndWFnZSgpKSBjb25maWcuc2V0TGFuZ3VhZ2UoTW9uZXJvV2FsbGV0LkRFRkFVTFRfTEFOR1VBR0UpO1xuICAgIGxldCBwYXJhbXMgPSB7IGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLCBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksIGxhbmd1YWdlOiBjb25maWcuZ2V0TGFuZ3VhZ2UoKSB9O1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfd2FsbGV0XCIsIHBhcmFtcyk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXN0b3JlX2RldGVybWluaXN0aWNfd2FsbGV0XCIsIHtcbiAgICAgICAgZmlsZW5hbWU6IGNvbmZpZy5nZXRQYXRoKCksXG4gICAgICAgIHBhc3N3b3JkOiBjb25maWcuZ2V0UGFzc3dvcmQoKSxcbiAgICAgICAgc2VlZDogY29uZmlnLmdldFNlZWQoKSxcbiAgICAgICAgc2VlZF9vZmZzZXQ6IGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCksXG4gICAgICAgIGVuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWw6IGNvbmZpZy5nZXRJc011bHRpc2lnKCksXG4gICAgICAgIHJlc3RvcmVfaGVpZ2h0OiBjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpLFxuICAgICAgICBsYW5ndWFnZTogY29uZmlnLmdldExhbmd1YWdlKCksXG4gICAgICAgIGF1dG9zYXZlX2N1cnJlbnQ6IGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhpcy5oYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihjb25maWcuZ2V0UGF0aCgpLCBlcnIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHdhbGxldCBmcm9tIGtleXNcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFJlc3RvcmVIZWlnaHQoMCk7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShNb25lcm9XYWxsZXQuREVGQVVMVF9MQU5HVUFHRSk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdlbmVyYXRlX2Zyb21fa2V5c1wiLCB7XG4gICAgICAgIGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLFxuICAgICAgICBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksXG4gICAgICAgIGFkZHJlc3M6IGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpLFxuICAgICAgICB2aWV3a2V5OiBjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSxcbiAgICAgICAgc3BlbmRrZXk6IGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSxcbiAgICAgICAgcmVzdG9yZV9oZWlnaHQ6IGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCksXG4gICAgICAgIGF1dG9zYXZlX2N1cnJlbnQ6IGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhpcy5oYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihjb25maWcuZ2V0UGF0aCgpLCBlcnIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKG5hbWUsIGVycikge1xuICAgIGlmIChlcnIubWVzc2FnZSkge1xuICAgICAgaWYgKGVyci5tZXNzYWdlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoXCJhbHJlYWR5IGV4aXN0c1wiKSkgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKFwiV2FsbGV0IGFscmVhZHkgZXhpc3RzOiBcIiArIG5hbWUsIGVyci5nZXRDb2RlKCksIGVyci5nZXRScGNNZXRob2QoKSwgZXJyLmdldFJwY1BhcmFtcygpKTtcbiAgICAgIGlmIChlcnIubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwid29yZCBsaXN0IGZhaWxlZCB2ZXJpZmljYXRpb25cIikpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihcIkludmFsaWQgbW5lbW9uaWNcIiwgZXJyLmdldENvZGUoKSwgZXJyLmdldFJwY01ldGhvZCgpLCBlcnIuZ2V0UnBjUGFyYW1zKCkpO1xuICAgIH1cbiAgICB0aHJvdyBlcnI7XG4gIH1cbiAgXG4gIGFzeW5jIGlzVmlld09ubHkoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7a2V5X3R5cGU6IFwibW5lbW9uaWNcIn0pO1xuICAgICAgcmV0dXJuIGZhbHNlOyAvLyBrZXkgcmV0cmlldmFsIHN1Y2NlZWRzIGlmIG5vdCB2aWV3IG9ubHlcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTI5KSByZXR1cm4gdHJ1ZTsgIC8vIHdhbGxldCBpcyB2aWV3IG9ubHlcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTEpIHJldHVybiBmYWxzZTsgIC8vIHdhbGxldCBpcyBvZmZsaW5lIGJ1dCBub3QgdmlldyBvbmx5XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgd2FsbGV0J3MgZGFlbW9uIGNvbm5lY3Rpb24uXG4gICAqIFRoZSBjYWNoZWQgY29ubmVjdGlvbiByZWNvcmRzIHRoZSByZXF1ZXN0ZWQgYWxsb3ctYW55LWNlcnQgc2V0dGluZywgbm90IGN1c3RvbSBTU0wgb3B0aW9ucy5cbiAgICogV2FsbGV0IFJQQyBlbmZvcmNlcyBhIENBIGZpbGUgb3IgZmluZ2VycHJpbnRzOyBvdGhlcndpc2UgU1NMIGF1dG9kZXRlY3QgY2FuIGFjY2VwdCB1bnZlcmlmaWVkIGNlcnRpZmljYXRlcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfE1vbmVyb1JwY0Nvbm5lY3Rpb259IFt1cmlPckNvbm5lY3Rpb25dIC0gdGhlIGRhZW1vbidzIFVSSSBvciBjb25uZWN0aW9uIChkZWZhdWx0cyB0byBvZmZsaW5lKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzVHJ1c3RlZCAtIGluZGljYXRlcyBpZiB0aGUgZGFlbW9uIGluIHRydXN0ZWRcbiAgICogQHBhcmFtIHtTc2xPcHRpb25zfSBzc2xPcHRpb25zIC0gY3VzdG9tIFNTTCBjb25maWd1cmF0aW9uICh0YWtlcyBwcmVjZWRlbmNlIG92ZXIgdGhlIGNvbm5lY3Rpb24ncyByZWplY3RVbmF1dGhvcml6ZWQgc2V0dGluZylcbiAgICovXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uPzogUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IHN0cmluZywgaXNUcnVzdGVkPzogYm9vbGVhbiwgc3NsT3B0aW9ucz86IFNzbE9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgY29ubmVjdGlvbiA9ICF1cmlPckNvbm5lY3Rpb24gPyB1bmRlZmluZWQgOiB1cmlPckNvbm5lY3Rpb24gaW5zdGFuY2VvZiBNb25lcm9ScGNDb25uZWN0aW9uID8gdXJpT3JDb25uZWN0aW9uIDogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uKTtcbiAgICBpZiAoIXNzbE9wdGlvbnMpIHtcbiAgICAgIHNzbE9wdGlvbnMgPSBuZXcgU3NsT3B0aW9ucygpO1xuICAgICAgaWYgKGNvbm5lY3Rpb24pIHNzbE9wdGlvbnMuc2V0QWxsb3dBbnlDZXJ0KGNvbm5lY3Rpb24uZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgPT09IGZhbHNlKTtcbiAgICB9XG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmFkZHJlc3MgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRVcmkoKSA6IFwiYmFkX3VyaVwiOyAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBiYWQgZGFlbW9uIHVyaSBuZWNlc3NhcnkgZm9yIG9mZmxpbmU/XG4gICAgcGFyYW1zLnVzZXJuYW1lID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA6IFwiXCI7XG4gICAgcGFyYW1zLnBhc3N3b3JkID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA6IFwiXCI7XG4gICAgcGFyYW1zLnRydXN0ZWQgPSBpc1RydXN0ZWQ7XG4gICAgY29uc3QgaGFzQ2VydGlmaWNhdGVzID0gISFzc2xPcHRpb25zLmdldENlcnRpZmljYXRlQXV0aG9yaXR5RmlsZSgpIHx8IHNzbE9wdGlvbnMuZ2V0QWxsb3dlZEZpbmdlcnByaW50cygpPy5sZW5ndGggPiAwO1xuICAgIHBhcmFtcy5zc2xfc3VwcG9ydCA9IGhhc0NlcnRpZmljYXRlcyAmJiBzc2xPcHRpb25zLmdldEFsbG93QW55Q2VydCgpICE9PSB0cnVlID8gXCJlbmFibGVkXCIgOiBcImF1dG9kZXRlY3RcIjsgLy8gd2FsbGV0IHJwYyBvbmx5IGVuZm9yY2VzIGNlcnRpZmljYXRlcyBpZiBlbmFibGVkXG4gICAgcGFyYW1zLnNzbF9wcml2YXRlX2tleV9wYXRoID0gc3NsT3B0aW9ucy5nZXRQcml2YXRlS2V5UGF0aCgpO1xuICAgIHBhcmFtcy5zc2xfY2VydGlmaWNhdGVfcGF0aCAgPSBzc2xPcHRpb25zLmdldENlcnRpZmljYXRlUGF0aCgpO1xuICAgIHBhcmFtcy5zc2xfY2FfZmlsZSA9IHNzbE9wdGlvbnMuZ2V0Q2VydGlmaWNhdGVBdXRob3JpdHlGaWxlKCk7XG4gICAgcGFyYW1zLnNzbF9hbGxvd2VkX2ZpbmdlcnByaW50cyA9IHNzbE9wdGlvbnMuZ2V0QWxsb3dlZEZpbmdlcnByaW50cygpO1xuICAgIHBhcmFtcy5zc2xfYWxsb3dfYW55X2NlcnQgPSBzc2xPcHRpb25zLmdldEFsbG93QW55Q2VydCgpO1xuXG4gICAgLy8gc2V0IHByb3h5IHdoaWNoIG11c3QgbWF0Y2ggc3RhcnR1cCBwcm94eSBpZiBhcHBsaWNhYmxlXG4gICAgaWYgKGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5nZXRQcm94eVVyaSgpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0aGlzLnN0YXJ0dXBQcm94eVVyaSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2V0IGRhZW1vbiBjb25uZWN0aW9uIHdpdGhvdXQgcHJveHkgVVJJIGJlY2F1c2UgbW9uZXJvLXdhbGxldC1ycGMgd2FzIHN0YXJ0ZWQgd2l0aCBhIHByb3h5IFVSSTogXCIgKyB0aGlzLnN0YXJ0dXBQcm94eVVyaSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLnN0YXJ0dXBQcm94eVVyaSA9PT0gdW5kZWZpbmVkKSBwYXJhbXMucHJveHkgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRQcm94eVVyaSgpIDogXCJcIjtcbiAgICAgIGVsc2UgaWYgKCFHZW5VdGlscy5pc1NhbWVQcm94eVVyaSh0aGlzLnN0YXJ0dXBQcm94eVVyaSwgY29ubmVjdGlvbi5nZXRQcm94eVVyaSgpKSkge1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2V0IGRhZW1vbiBjb25uZWN0aW9uIHdpdGggcHJveHkgVVJJIFwiICsgY29ubmVjdGlvbi5nZXRQcm94eVVyaSgpICsgXCIgYmVjYXVzZSBtb25lcm8td2FsbGV0LXJwYyB3YXMgc3RhcnRlZCB3aXRoIGEgZGlmZmVyZW50IHByb3h5IFVSSTogXCIgKyB0aGlzLnN0YXJ0dXBQcm94eVVyaSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghcGFyYW1zLnByb3h5KSBwYXJhbXMucHJveHkgPSBcIlwiO1xuXG4gICAgY29uc3QgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbm5lY3Rpb24gPyBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbihjb25uZWN0aW9uKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoZGFlbW9uQ29ubmVjdGlvbikgZGFlbW9uQ29ubmVjdGlvbi5yZWplY3RVbmF1dGhvcml6ZWQgPSBwYXJhbXMuc3NsX2FsbG93X2FueV9jZXJ0ICE9PSB0cnVlO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9kYWVtb25cIiwgcGFyYW1zKTtcbiAgICB0aGlzLmRhZW1vbkNvbm5lY3Rpb24gPSBkYWVtb25Db25uZWN0aW9uO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLmRhZW1vbkNvbm5lY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSB0b3RhbCBhbmQgdW5sb2NrZWQgYmFsYW5jZXMgaW4gYSBzaW5nbGUgcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbYWNjb3VudElkeF0gYWNjb3VudCBpbmRleFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N1YmFkZHJlc3NJZHhdIHN1YmFkZHJlc3MgaW5kZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxiaWdpbnRbXT59IGlzIHRoZSB0b3RhbCBhbmQgdW5sb2NrZWQgYmFsYW5jZXMgaW4gYW4gYXJyYXksIHJlc3BlY3RpdmVseVxuICAgKi9cbiAgYXN5bmMgZ2V0QmFsYW5jZXMoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50W10+IHtcbiAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzc0lkeCwgdW5kZWZpbmVkLCBcIk11c3QgcHJvdmlkZSBhY2NvdW50IGluZGV4IHdpdGggc3ViYWRkcmVzcyBpbmRleFwiKTtcbiAgICAgIGxldCBiYWxhbmNlID0gQmlnSW50KDApO1xuICAgICAgbGV0IHVubG9ja2VkQmFsYW5jZSA9IEJpZ0ludCgwKTtcbiAgICAgIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgdGhpcy5nZXRBY2NvdW50cygpKSB7XG4gICAgICAgIGJhbGFuY2UgPSBiYWxhbmNlICsgYWNjb3VudC5nZXRCYWxhbmNlKCk7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZSA9IHVubG9ja2VkQmFsYW5jZSArIGFjY291bnQuZ2V0VW5sb2NrZWRCYWxhbmNlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gW2JhbGFuY2UsIHVubG9ja2VkQmFsYW5jZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBwYXJhbXMgPSB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeCwgYWRkcmVzc19pbmRpY2VzOiBzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBbc3ViYWRkcmVzc0lkeF19O1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCBwYXJhbXMpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtCaWdJbnQocmVzcC5yZXN1bHQuYmFsYW5jZSksIEJpZ0ludChyZXNwLnJlc3VsdC51bmxvY2tlZF9iYWxhbmNlKV07XG4gICAgICBlbHNlIHJldHVybiBbQmlnSW50KHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzWzBdLmJhbGFuY2UpLCBCaWdJbnQocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3NbMF0udW5sb2NrZWRfYmFsYW5jZSldO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ09NTU9OIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9XYWxsZXRMaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN1cGVyLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZXNlcnZlUHJvb2YoYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpLCBcIlwiLCBcIlwiKTsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBwcm92aWRlIGJldHRlciB3YXkgdG8ga25vdyBpZiB3YWxsZXQgcnBjIGlzIGNvbm5lY3RlZCB0byBkYWVtb25cbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcImNoZWNrIHJlc2VydmUgZXhwZWN0ZWQgdG8gZmFpbFwiKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC0xMykgdGhyb3cgZTsgLy8gbm8gd2FsbGV0IGZpbGVcbiAgICAgIHJldHVybiBlLm1lc3NhZ2UuaW5kZXhPZihcIkZhaWxlZCB0byBjb25uZWN0IHRvIGRhZW1vblwiKSA8IDA7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3ZlcnNpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9WZXJzaW9uKHJlc3AucmVzdWx0LnZlcnNpb24sIHJlc3AucmVzdWx0LnJlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMucGF0aDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwibW5lbW9uaWNcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2UoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoYXdhaXQgdGhpcy5nZXRTZWVkKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMuZ2V0U2VlZExhbmd1YWdlKCkgbm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBsaXN0IG9mIGF2YWlsYWJsZSBsYW5ndWFnZXMgZm9yIHRoZSB3YWxsZXQncyBzZWVkLlxuICAgKiBcbiAgICogQHJldHVybiB7c3RyaW5nW119IHRoZSBhdmFpbGFibGUgbGFuZ3VhZ2VzIGZvciB0aGUgd2FsbGV0J3Mgc2VlZC5cbiAgICovXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZXMoKSB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfbGFuZ3VhZ2VzXCIpKS5yZXN1bHQubGFuZ3VhZ2VzO1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwidmlld19rZXlcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcInNwZW5kX2tleVwiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBzdWJhZGRyZXNzTWFwID0gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF07XG4gICAgaWYgKCFzdWJhZGRyZXNzTWFwKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHRydWUpOyAgLy8gY2FjaGUncyBhbGwgYWRkcmVzc2VzIGF0IHRoaXMgYWNjb3VudFxuICAgICAgcmV0dXJuIHRoaXMuZ2V0QWRkcmVzcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTsgICAgICAgIC8vIHJlY3Vyc2l2ZSBjYWxsIHVzZXMgY2FjaGVcbiAgICB9XG4gICAgbGV0IGFkZHJlc3MgPSBzdWJhZGRyZXNzTWFwW3N1YmFkZHJlc3NJZHhdO1xuICAgIGlmICghYWRkcmVzcykge1xuICAgICAgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCB0cnVlKTsgIC8vIGNhY2hlJ3MgYWxsIGFkZHJlc3NlcyBhdCB0aGlzIGFjY291bnRcbiAgICAgIHJldHVybiB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XVtzdWJhZGRyZXNzSWR4XTtcbiAgICB9XG4gICAgcmV0dXJuIGFkZHJlc3M7XG4gIH1cbiAgXG4gIC8vIFRPRE86IHVzZSBjYWNoZVxuICBhc3luYyBnZXRBZGRyZXNzSW5kZXgoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggcmVzdWx0IGFuZCBub3JtYWxpemUgZXJyb3IgaWYgYWRkcmVzcyBkb2VzIG5vdCBiZWxvbmcgdG8gdGhlIHdhbGxldFxuICAgIGxldCByZXNwO1xuICAgIHRyeSB7XG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NfaW5kZXhcIiwge2FkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTIpIHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29udmVydCBycGMgcmVzcG9uc2VcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKHthZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWFqb3IpO1xuICAgIHN1YmFkZHJlc3Muc2V0SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWlub3IpO1xuICAgIHJldHVybiBzdWJhZGRyZXNzO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3M/OiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IGludGVncmF0ZWRBZGRyZXNzU3RyID0gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfaW50ZWdyYXRlZF9hZGRyZXNzXCIsIHtzdGFuZGFyZF9hZGRyZXNzOiBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRfaWQ6IHBheW1lbnRJZH0pKS5yZXN1bHQuaW50ZWdyYXRlZF9hZGRyZXNzO1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3NTdHIpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUubWVzc2FnZS5pbmNsdWRlcyhcIkludmFsaWQgcGF5bWVudCBJRFwiKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBwYXltZW50IElEOiBcIiArIHBheW1lbnRJZCk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNwbGl0X2ludGVncmF0ZWRfYWRkcmVzc1wiLCB7aW50ZWdyYXRlZF9hZGRyZXNzOiBpbnRlZ3JhdGVkQWRkcmVzc30pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoKS5zZXRTdGFuZGFyZEFkZHJlc3MocmVzcC5yZXN1bHQuc3RhbmRhcmRfYWRkcmVzcykuc2V0UGF5bWVudElkKHJlc3AucmVzdWx0LnBheW1lbnRfaWQpLnNldEludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfaGVpZ2h0XCIpKS5yZXN1bHQuaGVpZ2h0O1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGdldHRpbmcgdGhlIGNoYWluIGhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF5OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGluZyBhIGhlaWdodCBieSBkYXRlXCIpO1xuICB9XG4gIFxuICBhc3luYyBzeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodD86IE1vbmVyb1dhbGxldExpc3RlbmVyIHwgbnVtYmVyLCBzdGFydEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvU3luY1Jlc3VsdD4ge1xuICAgIGFzc2VydCghKGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyKSwgXCJNb25lcm8gV2FsbGV0IFJQQyBkb2VzIG5vdCBzdXBwb3J0IHJlcG9ydGluZyBzeW5jIHByb2dyZXNzXCIpO1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlZnJlc2hcIiwge3N0YXJ0X2hlaWdodDogc3RhcnRIZWlnaHR9KTtcbiAgICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3AucmVzdWx0LmJsb2Nrc19mZXRjaGVkLCByZXNwLnJlc3VsdC5yZWNlaXZlZF9tb25leSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZSA9PT0gXCJubyBjb25uZWN0aW9uIHRvIGRhZW1vblwiKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXM/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBcbiAgICAvLyBjb252ZXJ0IG1zIHRvIHNlY29uZHMgZm9yIHJwYyBwYXJhbWV0ZXJcbiAgICBsZXQgc3luY1BlcmlvZEluU2Vjb25kcyA9IE1hdGgucm91bmQoKHN5bmNQZXJpb2RJbk1zID09PSB1bmRlZmluZWQgPyBNb25lcm9XYWxsZXRScGMuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA6IHN5bmNQZXJpb2RJbk1zKSAvIDEwMDApO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhdXRvX3JlZnJlc2hcIiwge1xuICAgICAgZW5hYmxlOiB0cnVlLFxuICAgICAgcGVyaW9kOiBzeW5jUGVyaW9kSW5TZWNvbmRzXG4gICAgfSk7XG4gICAgXG4gICAgLy8gdXBkYXRlIHN5bmMgcGVyaW9kIGZvciBwb2xsZXJcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gc3luY1BlcmlvZEluU2Vjb25kcyAqIDEwMDA7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyICE9PSB1bmRlZmluZWQpIHRoaXMud2FsbGV0UG9sbGVyLnNldFBlcmlvZEluTXModGhpcy5zeW5jUGVyaW9kSW5Ncyk7XG4gICAgXG4gICAgLy8gcG9sbCBpZiBsaXN0ZW5pbmdcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgfVxuXG4gIGdldFN5bmNQZXJpb2RJbk1zKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuc3luY1BlcmlvZEluTXM7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhdXRvX3JlZnJlc2hcIiwgeyBlbmFibGU6IGZhbHNlIH0pO1xuICB9XG4gIFxuICBhc3luYyBzY2FuVHhzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdHhIYXNoZXMgfHwgIXR4SGFzaGVzLmxlbmd0aCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gdHggaGFzaGVzIGdpdmVuIHRvIHNjYW5cIik7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2Nhbl90eFwiLCB7dHhpZHM6IHR4SGFzaGVzfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhblNwZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc2Nhbl9zcGVudFwiLCB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc2Nhbl9ibG9ja2NoYWluXCIsIHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbGFuY2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYWxhbmNlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCB0YWc/OiBzdHJpbmcsIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnRbXT4ge1xuICAgIFxuICAgIC8vIGZldGNoIGFjY291bnRzIGZyb20gcnBjXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWNjb3VudHNcIiwge3RhZzogdGFnfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgYWNjb3VudCBvYmplY3RzIGFuZCBmZXRjaCBzdWJhZGRyZXNzZXMgcGVyIGFjY291bnQgdXNpbmcgZ2V0X2FkZHJlc3NcbiAgICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBnZXRfYWRkcmVzcyBzaG91bGQgc3VwcG9ydCBhbGxfYWNjb3VudHMgc28gbm90IGNhbGxlZCBvbmNlIHBlciBhY2NvdW50XG4gICAgbGV0IGFjY291bnRzOiBNb25lcm9BY2NvdW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBycGNBY2NvdW50IG9mIHJlc3AucmVzdWx0LnN1YmFkZHJlc3NfYWNjb3VudHMpIHtcbiAgICAgIGxldCBhY2NvdW50ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNBY2NvdW50KHJwY0FjY291bnQpO1xuICAgICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMpIGFjY291bnQuc2V0U3ViYWRkcmVzc2VzKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnQuZ2V0SW5kZXgoKSwgdW5kZWZpbmVkLCB0cnVlKSk7XG4gICAgICBhY2NvdW50cy5wdXNoKGFjY291bnQpO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgbWVyZ2UgZmllbGRzIGZyb20gZ2V0X2JhbGFuY2UgYWNyb3NzIGFsbCBhY2NvdW50c1xuICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzICYmICFza2lwQmFsYW5jZXMpIHtcbiAgICAgIFxuICAgICAgLy8gdGhlc2UgZmllbGRzIGFyZSBub3QgaW5pdGlhbGl6ZWQgaWYgc3ViYWRkcmVzcyBpcyB1bnVzZWQgYW5kIHRoZXJlZm9yZSBub3QgcmV0dXJuZWQgZnJvbSBgZ2V0X2JhbGFuY2VgXG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkge1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cygwKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGZldGNoIGFuZCBtZXJnZSBpbmZvIGZyb20gZ2V0X2JhbGFuY2VcbiAgICAgIHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCB7YWxsX2FjY291bnRzOiB0cnVlfSk7XG4gICAgICBpZiAocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIG1lcmdlIGluZm9cbiAgICAgICAgICBsZXQgYWNjb3VudCA9IGFjY291bnRzW3N1YmFkZHJlc3MuZ2V0QWNjb3VudEluZGV4KCldO1xuICAgICAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzLmdldEFjY291bnRJbmRleCgpLCBhY2NvdW50LmdldEluZGV4KCksIFwiUlBDIGFjY291bnRzIGFyZSBvdXQgb2Ygb3JkZXJcIik7ICAvLyB3b3VsZCBuZWVkIHRvIHN3aXRjaCBsb29rdXAgdG8gbG9vcFxuICAgICAgICAgIGxldCB0Z3RTdWJhZGRyZXNzID0gYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKVtzdWJhZGRyZXNzLmdldEluZGV4KCldO1xuICAgICAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzLmdldEluZGV4KCksIHRndFN1YmFkZHJlc3MuZ2V0SW5kZXgoKSwgXCJSUEMgc3ViYWRkcmVzc2VzIGFyZSBvdXQgb2Ygb3JkZXJcIik7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0QmFsYW5jZShzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSk7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSk7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGFjY291bnRzO1xuICB9XG4gIFxuICAvLyBUT0RPOiBnZXRBY2NvdW50QnlJbmRleCgpLCBnZXRBY2NvdW50QnlUYWcoKVxuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBhc3NlcnQoYWNjb3VudElkeCA+PSAwKTtcbiAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgaWYgKGFjY291bnQuZ2V0SW5kZXgoKSA9PT0gYWNjb3VudElkeCkge1xuICAgICAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcykgYWNjb3VudC5zZXRTdWJhZGRyZXNzZXMoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCBza2lwQmFsYW5jZXMpKTtcbiAgICAgICAgcmV0dXJuIGFjY291bnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIkFjY291bnQgd2l0aCBpbmRleCBcIiArIGFjY291bnRJZHggKyBcIiBkb2VzIG5vdCBleGlzdFwiKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBsYWJlbCA9IGxhYmVsID8gbGFiZWwgOiB1bmRlZmluZWQ7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfYWNjb3VudFwiLCB7bGFiZWw6IGxhYmVsfSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9BY2NvdW50KHtcbiAgICAgIGluZGV4OiByZXNwLnJlc3VsdC5hY2NvdW50X2luZGV4LFxuICAgICAgcHJpbWFyeUFkZHJlc3M6IHJlc3AucmVzdWx0LmFkZHJlc3MsXG4gICAgICBsYWJlbDogbGFiZWwsXG4gICAgICBiYWxhbmNlOiBCaWdJbnQoMCksXG4gICAgICB1bmxvY2tlZEJhbGFuY2U6IEJpZ0ludCgwKVxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0luZGljZXM/OiBudW1iZXJbXSwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggc3ViYWRkcmVzc2VzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBhY2NvdW50SWR4O1xuICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcykgcGFyYW1zLmFkZHJlc3NfaW5kZXggPSBHZW5VdGlscy5saXN0aWZ5KHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzXCIsIHBhcmFtcyk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBzdWJhZGRyZXNzZXNcbiAgICBsZXQgc3ViYWRkcmVzc2VzID0gW107XG4gICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5hZGRyZXNzZXMpIHtcbiAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgICBzdWJhZGRyZXNzZXMucHVzaChzdWJhZGRyZXNzKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIGluaXRpYWxpemUgc3ViYWRkcmVzcyBiYWxhbmNlc1xuICAgIGlmICghc2tpcEJhbGFuY2VzKSB7XG4gICAgICBcbiAgICAgIC8vIHRoZXNlIGZpZWxkcyBhcmUgbm90IGluaXRpYWxpemVkIGlmIHN1YmFkZHJlc3MgaXMgdW51c2VkIGFuZCB0aGVyZWZvcmUgbm90IHJldHVybmVkIGZyb20gYGdldF9iYWxhbmNlYFxuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGZldGNoIGFuZCBpbml0aWFsaXplIGJhbGFuY2VzXG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwgcGFyYW1zKTtcbiAgICAgIGlmIChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICBmb3IgKGxldCBycGNTdWJhZGRyZXNzIG9mIHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3MgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gdHJhbnNmZXIgaW5mbyB0byBleGlzdGluZyBzdWJhZGRyZXNzIG9iamVjdFxuICAgICAgICAgIGZvciAobGV0IHRndFN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICAgICAgICBpZiAodGd0U3ViYWRkcmVzcy5nZXRJbmRleCgpICE9PSBzdWJhZGRyZXNzLmdldEluZGV4KCkpIGNvbnRpbnVlOyAvLyBza2lwIHRvIHN1YmFkZHJlc3Mgd2l0aCBzYW1lIGluZGV4XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXROdW1CbG9ja3NUb1VubG9jaygpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soc3ViYWRkcmVzcy5nZXROdW1CbG9ja3NUb1VubG9jaygpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgYWRkcmVzc2VzXG4gICAgbGV0IHN1YmFkZHJlc3NNYXAgPSB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XTtcbiAgICBpZiAoIXN1YmFkZHJlc3NNYXApIHtcbiAgICAgIHN1YmFkZHJlc3NNYXAgPSB7fTtcbiAgICAgIHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdID0gc3ViYWRkcmVzc01hcDtcbiAgICB9XG4gICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgIHN1YmFkZHJlc3NNYXBbc3ViYWRkcmVzcy5nZXRJbmRleCgpXSA9IHN1YmFkZHJlc3MuZ2V0QWRkcmVzcygpO1xuICAgIH1cbiAgICBcbiAgICAvLyByZXR1cm4gcmVzdWx0c1xuICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gIH1cblxuICBhc3luYyBnZXRTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgYXNzZXJ0KGFjY291bnRJZHggPj0gMCk7XG4gICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPj0gMCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBbc3ViYWRkcmVzc0lkeF0sIHNraXBCYWxhbmNlcykpWzBdO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfYWRkcmVzc1wiLCB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeCwgbGFiZWw6IGxhYmVsfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgc3ViYWRkcmVzcyBvYmplY3RcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKCk7XG4gICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgc3ViYWRkcmVzcy5zZXRJbmRleChyZXNwLnJlc3VsdC5hZGRyZXNzX2luZGV4KTtcbiAgICBzdWJhZGRyZXNzLnNldEFkZHJlc3MocmVzcC5yZXN1bHQuYWRkcmVzcyk7XG4gICAgc3ViYWRkcmVzcy5zZXRMYWJlbChsYWJlbCA/IGxhYmVsIDogdW5kZWZpbmVkKTtcbiAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgc3ViYWRkcmVzcy5zZXRJc1VzZWQoZmFsc2UpO1xuICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cblxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJsYWJlbF9hZGRyZXNzXCIsIHtpbmRleDoge21ham9yOiBhY2NvdW50SWR4LCBtaW5vcjogc3ViYWRkcmVzc0lkeH0sIGxhYmVsOiBsYWJlbH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHMocXVlcnk/OiBzdHJpbmdbXSB8IFBhcnRpYWw8TW9uZXJvVHhRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICByZXR1cm4gdGhpcy5nZXRUeHNBdXgocXVlcnksIDUpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGdldFR4c0F1eChxdWVyeTogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+IHwgdW5kZWZpbmVkLCBtYXhBdHRlbXB0czogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG5cbiAgICAvLyBjb3B5IHF1ZXJ5XG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHRlbXBvcmFyaWx5IGRpc2FibGUgdHJhbnNmZXIgYW5kIG91dHB1dCBxdWVyaWVzIGluIG9yZGVyIHRvIGNvbGxlY3QgYWxsIHR4IGluZm9ybWF0aW9uXG4gICAgbGV0IHRyYW5zZmVyUXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0VHJhbnNmZXJRdWVyeSgpO1xuICAgIGxldCBpbnB1dFF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldElucHV0UXVlcnkoKTtcbiAgICBsZXQgb3V0cHV0UXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0T3V0cHV0UXVlcnkoKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0VHJhbnNmZXJRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRJbnB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldE91dHB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgXG4gICAgLy8gZmV0Y2ggYWxsIHRyYW5zZmVycyB0aGF0IG1lZXQgdHggcXVlcnlcbiAgICBsZXQgdHJhbnNmZXJzID0gYXdhaXQgdGhpcy5nZXRUcmFuc2ZlcnNBdXgobmV3IE1vbmVyb1RyYW5zZmVyUXVlcnkoKS5zZXRUeFF1ZXJ5KE1vbmVyb1dhbGxldFJwYy5kZWNvbnRleHR1YWxpemUocXVlcnlOb3JtYWxpemVkLmNvcHkoKSkpKTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHVuaXF1ZSB0eHMgZnJvbSB0cmFuc2ZlcnMgd2hpbGUgcmV0YWluaW5nIG9yZGVyXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGxldCB0eHNTZXQgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHJhbnNmZXJzKSB7XG4gICAgICBpZiAoIXR4c1NldC5oYXModHJhbnNmZXIuZ2V0VHgoKSkpIHtcbiAgICAgICAgdHhzLnB1c2godHJhbnNmZXIuZ2V0VHgoKSk7XG4gICAgICAgIHR4c1NldC5hZGQodHJhbnNmZXIuZ2V0VHgoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHR5cGVzIGludG8gbWFwcyBmb3IgbWVyZ2luZyBhbmQgbG9va3VwXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIG1lcmdlIG91dHB1dHMgaWYgcmVxdWVzdGVkXG4gICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5nZXRJbmNsdWRlT3V0cHV0cygpIHx8IG91dHB1dFF1ZXJ5KSB7XG4gICAgICAgIFxuICAgICAgLy8gZmV0Y2ggb3V0cHV0c1xuICAgICAgbGV0IG91dHB1dFF1ZXJ5QXV4ID0gKG91dHB1dFF1ZXJ5ID8gb3V0cHV0UXVlcnkuY29weSgpIDogbmV3IE1vbmVyb091dHB1dFF1ZXJ5KCkpLnNldFR4UXVlcnkoTW9uZXJvV2FsbGV0UnBjLmRlY29udGV4dHVhbGl6ZShxdWVyeU5vcm1hbGl6ZWQuY29weSgpKSk7XG4gICAgICBsZXQgb3V0cHV0cyA9IGF3YWl0IHRoaXMuZ2V0T3V0cHV0c0F1eChvdXRwdXRRdWVyeUF1eCk7XG4gICAgICBcbiAgICAgIC8vIG1lcmdlIG91dHB1dCB0eHMgb25lIHRpbWUgd2hpbGUgcmV0YWluaW5nIG9yZGVyXG4gICAgICBsZXQgb3V0cHV0VHhzID0gW107XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2Ygb3V0cHV0cykge1xuICAgICAgICBpZiAoIW91dHB1dFR4cy5pbmNsdWRlcyhvdXRwdXQuZ2V0VHgoKSkpIHtcbiAgICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeChvdXRwdXQuZ2V0VHgoKSwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgICAgICBvdXRwdXRUeHMucHVzaChvdXRwdXQuZ2V0VHgoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gcmVzdG9yZSB0cmFuc2ZlciBhbmQgb3V0cHV0IHF1ZXJpZXNcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0VHJhbnNmZXJRdWVyeSh0cmFuc2ZlclF1ZXJ5KTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SW5wdXRRdWVyeShpbnB1dFF1ZXJ5KTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0T3V0cHV0UXVlcnkob3V0cHV0UXVlcnkpO1xuICAgIFxuICAgIC8vIGZpbHRlciB0eHMgdGhhdCBkb24ndCBtZWV0IHRyYW5zZmVyIHF1ZXJ5XG4gICAgbGV0IHR4c1F1ZXJpZWQgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQubWVldHNDcml0ZXJpYSh0eCkpIHR4c1F1ZXJpZWQucHVzaCh0eCk7XG4gICAgICBlbHNlIGlmICh0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgIH1cbiAgICB0eHMgPSB0eHNRdWVyaWVkO1xuICAgIFxuICAgIC8vIHNwZWNpYWwgY2FzZTogcmUtZmV0Y2ggdHhzIGlmIGluY29uc2lzdGVuY3kgY2F1c2VkIGJ5IG5lZWRpbmcgdG8gbWFrZSBtdWx0aXBsZSBycGMgY2FsbHNcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpICYmIHR4LmdldEJsb2NrKCkgPT09IHVuZGVmaW5lZCB8fCAhdHguZ2V0SXNDb25maXJtZWQoKSAmJiB0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKG1heEF0dGVtcHRzIDw9IDEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlVuYWJsZSB0byBidWlsZCBjb25zaXN0ZW50IHR4cyBmcm9tIG11bHRpcGxlIHJwYyBjYWxsc1wiKTtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkluY29uc2lzdGVuY3kgZGV0ZWN0ZWQgYnVpbGRpbmcgdHhzIGZyb20gbXVsdGlwbGUgcnBjIGNhbGxzLCByZS1mZXRjaGluZyB0eHNcIik7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFR4c0F1eChxdWVyeU5vcm1hbGl6ZWQsIG1heEF0dGVtcHRzIC0gMSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIG9yZGVyIHR4cyBpZiB0eCBoYXNoZXMgZ2l2ZW4gdGhlbiByZXR1cm5cbiAgICBpZiAocXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpICYmIHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKS5sZW5ndGggPiAwKSB7XG4gICAgICBsZXQgdHhzQnlJZCA9IG5ldyBNYXAoKSAgLy8gc3RvcmUgdHhzIGluIHRlbXBvcmFyeSBtYXAgZm9yIHNvcnRpbmdcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykgdHhzQnlJZC5zZXQodHguZ2V0SGFzaCgpLCB0eCk7XG4gICAgICBsZXQgb3JkZXJlZFR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgaGFzaCBvZiBxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkpIGlmICh0eHNCeUlkLmdldChoYXNoKSkgb3JkZXJlZFR4cy5wdXNoKHR4c0J5SWQuZ2V0KGhhc2gpKTtcbiAgICAgIHR4cyA9IG9yZGVyZWRUeHM7XG4gICAgfVxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1RyYW5zZmVyW10+IHtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gZ2V0IHRyYW5zZmVycyBkaXJlY3RseSBpZiBxdWVyeSBkb2VzIG5vdCByZXF1aXJlIHR4IGNvbnRleHQgKG90aGVyIHRyYW5zZmVycywgb3V0cHV0cylcbiAgICBpZiAoIU1vbmVyb1dhbGxldFJwYy5pc0NvbnRleHR1YWwocXVlcnlOb3JtYWxpemVkKSkgcmV0dXJuIHRoaXMuZ2V0VHJhbnNmZXJzQXV4KHF1ZXJ5Tm9ybWFsaXplZCk7XG4gICAgXG4gICAgLy8gb3RoZXJ3aXNlIGdldCB0eHMgd2l0aCBmdWxsIG1vZGVscyB0byBmdWxmaWxsIHF1ZXJ5XG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMuZ2V0VHhzKHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkpKSB7XG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5maWx0ZXJUcmFuc2ZlcnMocXVlcnlOb3JtYWxpemVkKSkge1xuICAgICAgICB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb091dHB1dFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvT3V0cHV0V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplT3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIGdldCBvdXRwdXRzIGRpcmVjdGx5IGlmIHF1ZXJ5IGRvZXMgbm90IHJlcXVpcmUgdHggY29udGV4dCAob3RoZXIgb3V0cHV0cywgdHJhbnNmZXJzKVxuICAgIGlmICghTW9uZXJvV2FsbGV0UnBjLmlzQ29udGV4dHVhbChxdWVyeU5vcm1hbGl6ZWQpKSByZXR1cm4gdGhpcy5nZXRPdXRwdXRzQXV4KHF1ZXJ5Tm9ybWFsaXplZCk7XG4gICAgXG4gICAgLy8gb3RoZXJ3aXNlIGdldCB0eHMgd2l0aCBmdWxsIG1vZGVscyB0byBmdWxmaWxsIHF1ZXJ5XG4gICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLmdldFR4cyhxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpKSkge1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmZpbHRlck91dHB1dHMocXVlcnlOb3JtYWxpemVkKSkge1xuICAgICAgICBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dHB1dHM7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE91dHB1dHMoYWxsID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X291dHB1dHNcIiwge2FsbDogYWxsfSkpLnJlc3VsdC5vdXRwdXRzX2RhdGFfaGV4O1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXg6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbXBvcnRfb3V0cHV0c1wiLCB7b3V0cHV0c19kYXRhX2hleDogb3V0cHV0c0hleH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5udW1faW1wb3J0ZWQ7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydEtleUltYWdlcyhhbGwgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQ+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5ycGNFeHBvcnRLZXlJbWFnZXMoYWxsKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlczogTW9uZXJvS2V5SW1hZ2VbXSwgb2Zmc2V0ID0gMCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQ+IHtcbiAgICBcbiAgICAvLyBjb252ZXJ0IGtleSBpbWFnZXMgdG8gcnBjIHBhcmFtZXRlclxuICAgIGxldCBycGNLZXlJbWFnZXMgPSBrZXlJbWFnZXMubWFwKGtleUltYWdlID0+ICh7a2V5X2ltYWdlOiBrZXlJbWFnZS5nZXRIZXgoKSwgc2lnbmF0dXJlOiBrZXlJbWFnZS5nZXRTaWduYXR1cmUoKX0pKTtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9rZXlfaW1hZ2VzXCIsIHtzaWduZWRfa2V5X2ltYWdlczogcnBjS2V5SW1hZ2VzLCBvZmZzZXQ6IG9mZnNldH0pO1xuICAgIFxuICAgIC8vIGJ1aWxkIGFuZCByZXR1cm4gcmVzdWx0XG4gICAgbGV0IGltcG9ydFJlc3VsdCA9IG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCgpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRIZWlnaHQocmVzcC5yZXN1bHQuaGVpZ2h0KTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0U3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnNwZW50KSk7XG4gICAgaW1wb3J0UmVzdWx0LnNldFVuc3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnVuc3BlbnQpKTtcbiAgICByZXR1cm4gaW1wb3J0UmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMucnBjRXhwb3J0S2V5SW1hZ2VzKGZhbHNlKSkuZ2V0S2V5SW1hZ2VzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImZyZWV6ZVwiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICB9XG4gIFxuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidGhhd1wiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICB9XG4gIFxuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmcm96ZW5cIiwge2tleV9pbWFnZToga2V5SW1hZ2V9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuZnJvemVuID09PSB0cnVlO1xuICB9XG5cbiAgYXN5bmMgZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCk6IFByb21pc2U8TW9uZXJvVHhQcmlvcml0eT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2RlZmF1bHRfZmVlX3ByaW9yaXR5XCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5wcmlvcml0eTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSwgY29weSwgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRDYW5TcGxpdCh0cnVlKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpID09PSB0cnVlICYmIGF3YWl0IHRoaXMuaXNNdWx0aXNpZygpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcmVsYXkgbXVsdGlzaWcgdHJhbnNhY3Rpb24gdW50aWwgY28tc2lnbmVkXCIpO1xuXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3NlcyB0byBzZW5kIGZyb21cbiAgICBsZXQgYWNjb3VudElkeCA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHRoZSBhY2NvdW50IGluZGV4IHRvIHNlbmQgZnJvbVwiKTtcbiAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5zbGljZSgwKTsgLy8gZmV0Y2ggYWxsIG9yIGNvcHkgZ2l2ZW4gaW5kaWNlc1xuICAgIFxuICAgIC8vIGJ1aWxkIGNvbmZpZyBwYXJhbWV0ZXJzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmRlc3RpbmF0aW9ucyA9IFtdO1xuICAgIGZvciAobGV0IGRlc3RpbmF0aW9uIG9mIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0RGVzdGluYXRpb25zKCkpIHtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIFwiRGVzdGluYXRpb24gYWRkcmVzcyBpcyBub3QgZGVmaW5lZFwiKTtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBbW91bnQoKSwgXCJEZXN0aW5hdGlvbiBhbW91bnQgaXMgbm90IGRlZmluZWRcIik7XG4gICAgICBwYXJhbXMuZGVzdGluYXRpb25zLnB1c2goeyBhZGRyZXNzOiBkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIGFtb3VudDogZGVzdGluYXRpb24uZ2V0QW1vdW50KCkgfSk7XG4gICAgfVxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFN1YnRyYWN0RmVlRnJvbSgpKSBwYXJhbXMuc3VidHJhY3RfZmVlX2Zyb21fb3V0cHV0cyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCk7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBhY2NvdW50SWR4O1xuICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBzdWJhZGRyZXNzSW5kaWNlcztcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UGF5bWVudElkKCk7XG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSAhPT0gdHJ1ZTtcbiAgICBhc3NlcnQoY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpIDw9IDMpO1xuICAgIHBhcmFtcy5wcmlvcml0eSA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2hleCA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9tZXRhZGF0YSA9IHRydWU7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSkgcGFyYW1zLmdldF90eF9rZXlzID0gdHJ1ZTsgLy8gcGFyYW0gdG8gZ2V0IHR4IGtleShzKSBkZXBlbmRzIGlmIHNwbGl0XG4gICAgZWxzZSBwYXJhbXMuZ2V0X3R4X2tleSA9IHRydWU7XG5cbiAgICAvLyBjYW5ub3QgYXBwbHkgc3VidHJhY3RGZWVGcm9tIHdpdGggYHRyYW5zZmVyX3NwbGl0YCBjYWxsXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSAmJiBjb25maWdOb3JtYWxpemVkLmdldFN1YnRyYWN0RmVlRnJvbSgpICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkubGVuZ3RoID4gMCkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwic3VidHJhY3RmZWVmcm9tIHRyYW5zZmVycyBjYW5ub3QgYmUgc3BsaXQgb3ZlciBtdWx0aXBsZSB0cmFuc2FjdGlvbnMgeWV0XCIpO1xuICAgIH1cbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPyBcInRyYW5zZmVyX3NwbGl0XCIgOiBcInRyYW5zZmVyXCIsIHBhcmFtcyk7XG4gICAgICByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgaWYgKGVyci5tZXNzYWdlLmluZGV4T2YoXCJXQUxMRVRfUlBDX0VSUk9SX0NPREVfV1JPTkdfQUREUkVTU1wiKSA+IC0xKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIGRlc3RpbmF0aW9uIGFkZHJlc3NcIik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICAgIFxuICAgIC8vIHByZS1pbml0aWFsaXplIHR4cyBpZmYgcHJlc2VudC4gbXVsdGlzaWcgYW5kIHZpZXctb25seSB3YWxsZXRzIHdpbGwgaGF2ZSB0eCBzZXQgd2l0aG91dCB0cmFuc2FjdGlvbnNcbiAgICBsZXQgdHhzO1xuICAgIGxldCBudW1UeHMgPSBjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPyAocmVzdWx0LmZlZV9saXN0ICE9PSB1bmRlZmluZWQgPyByZXN1bHQuZmVlX2xpc3QubGVuZ3RoIDogMCkgOiAocmVzdWx0LmZlZSAhPT0gdW5kZWZpbmVkID8gMSA6IDApO1xuICAgIGlmIChudW1UeHMgPiAwKSB0eHMgPSBbXTtcbiAgICBsZXQgY29weURlc3RpbmF0aW9ucyA9IG51bVR4cyA9PT0gMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVR4czsgaSsrKSB7XG4gICAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICAgIE1vbmVyb1dhbGxldFJwYy5pbml0U2VudFR4V2FsbGV0KGNvbmZpZ05vcm1hbGl6ZWQsIHR4LCBjb3B5RGVzdGluYXRpb25zKTtcbiAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgICBpZiAoc3ViYWRkcmVzc0luZGljZXMgIT09IHVuZGVmaW5lZCAmJiBzdWJhZGRyZXNzSW5kaWNlcy5sZW5ndGggPT09IDEpIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICB0eHMucHVzaCh0eCk7XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCBzZXQgZnJvbSBycGMgcmVzcG9uc2Ugd2l0aCBwcmUtaW5pdGlhbGl6ZWQgdHhzXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSkgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzdWx0LCB0eHMsIGNvbmZpZ05vcm1hbGl6ZWQpLmdldFR4cygpO1xuICAgIGVsc2UgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhUb1R4U2V0KHJlc3VsdCwgdHhzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0eHNbMF0sIHRydWUsIGNvbmZpZ05vcm1hbGl6ZWQpLmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcE91dHB1dChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gYnVpbGQgcmVxdWVzdCBwYXJhbWV0ZXJzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmFkZHJlc3MgPSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpO1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gY29uZmlnLmdldEFjY291bnRJbmRleCgpO1xuICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKTtcbiAgICBwYXJhbXMua2V5X2ltYWdlID0gY29uZmlnLmdldEtleUltYWdlKCk7XG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpICE9PSB0cnVlO1xuICAgIGFzc2VydChjb25maWcuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnLmdldFByaW9yaXR5KCk7XG4gICAgcGFyYW1zLnBheW1lbnRfaWQgPSBjb25maWcuZ2V0UGF5bWVudElkKCk7XG4gICAgcGFyYW1zLmdldF90eF9rZXkgPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN3ZWVwX3NpbmdsZVwiLCBwYXJhbXMpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBcbiAgICAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIGlmIChjb25maWcuZ2V0UmVsYXkoKSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgXG4gICAgLy8gYnVpbGQgYW5kIHJldHVybiB0eFxuICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5pbml0U2VudFR4V2FsbGV0KGNvbmZpZywgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4VG9UeFNldChyZXN1bHQsIHR4LCB0cnVlLCBjb25maWcpO1xuICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKVswXS5zZXRBbW91bnQodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFtb3VudCgpKTsgLy8gaW5pdGlhbGl6ZSBkZXN0aW5hdGlvbiBhbW91bnRcbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwVW5sb2NrZWQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBzd2VlcDsgZGVmYXVsdCB0byBhbGwgd2l0aCB1bmxvY2tlZCBiYWxhbmNlIGlmIG5vdCBzcGVjaWZpZWRcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTsgIC8vIG1hcHMgZWFjaCBhY2NvdW50IGluZGV4IHRvIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBzd2VlcFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpbmRpY2VzLnNldChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpLCBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgICAgIGluZGljZXMuc2V0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3Nlcyhjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpKSkge1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgYWNjb3VudHMgPSBhd2FpdCB0aGlzLmdldEFjY291bnRzKHRydWUpO1xuICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiBhY2NvdW50cykge1xuICAgICAgICBpZiAoYWNjb3VudC5nZXRVbmxvY2tlZEJhbGFuY2UoKSA+IDBuKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgICAgICAgaW5kaWNlcy5zZXQoYWNjb3VudC5nZXRJbmRleCgpLCBzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpKSB7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSA+IDBuKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHN3ZWVwIGZyb20gZWFjaCBhY2NvdW50IGFuZCBjb2xsZWN0IHJlc3VsdGluZyB0eCBzZXRzXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGZvciAobGV0IGFjY291bnRJZHggb2YgaW5kaWNlcy5rZXlzKCkpIHtcbiAgICAgIFxuICAgICAgLy8gY29weSBhbmQgbW9kaWZ5IHRoZSBvcmlnaW5hbCBjb25maWdcbiAgICAgIGxldCBjb3B5ID0gY29uZmlnTm9ybWFsaXplZC5jb3B5KCk7XG4gICAgICBjb3B5LnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIGNvcHkuc2V0U3dlZXBFYWNoU3ViYWRkcmVzcyhmYWxzZSk7XG4gICAgICBcbiAgICAgIC8vIHN3ZWVwIGFsbCBzdWJhZGRyZXNzZXMgdG9nZXRoZXIgIC8vIFRPRE8gbW9uZXJvLXByb2plY3Q6IGNhbiB0aGlzIHJldmVhbCBvdXRwdXRzIGJlbG9uZyB0byB0aGUgc2FtZSB3YWxsZXQ/XG4gICAgICBpZiAoY29weS5nZXRTd2VlcEVhY2hTdWJhZGRyZXNzKCkgIT09IHRydWUpIHtcbiAgICAgICAgY29weS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhpbmRpY2VzLmdldChhY2NvdW50SWR4KSk7XG4gICAgICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMucnBjU3dlZXBBY2NvdW50KGNvcHkpKSB0eHMucHVzaCh0eCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIG90aGVyd2lzZSBzd2VlcCBlYWNoIHN1YmFkZHJlc3MgaW5kaXZpZHVhbGx5XG4gICAgICBlbHNlIHtcbiAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzc0lkeCBvZiBpbmRpY2VzLmdldChhY2NvdW50SWR4KSkge1xuICAgICAgICAgIGNvcHkuc2V0U3ViYWRkcmVzc0luZGljZXMoW3N1YmFkZHJlc3NJZHhdKTtcbiAgICAgICAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLnJwY1N3ZWVwQWNjb3VudChjb3B5KSkgdHhzLnB1c2godHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5PzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmIChyZWxheSA9PT0gdW5kZWZpbmVkKSByZWxheSA9IGZhbHNlO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfZHVzdFwiLCB7ZG9fbm90X3JlbGF5OiAhcmVsYXl9KTtcbiAgICBpZiAocmVsYXkpIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCk7XG4gICAgaWYgKHR4U2V0LmdldFR4cygpID09PSB1bmRlZmluZWQpIHJldHVybiBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkge1xuICAgICAgdHguc2V0SXNSZWxheWVkKCFyZWxheSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0eC5nZXRJc1JlbGF5ZWQoKSk7XG4gICAgfVxuICAgIHJldHVybiB0eFNldC5nZXRUeHMoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHModHhzT3JNZXRhZGF0YXM6IChNb25lcm9UeFdhbGxldCB8IHN0cmluZylbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eHNPck1ldGFkYXRhcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBvciB0aGVpciBtZXRhZGF0YSB0byByZWxheVwiKTtcbiAgICBsZXQgdHhIYXNoZXMgPSBbXTtcbiAgICBmb3IgKGxldCB0eE9yTWV0YWRhdGEgb2YgdHhzT3JNZXRhZGF0YXMpIHtcbiAgICAgIGxldCBtZXRhZGF0YSA9IHR4T3JNZXRhZGF0YSBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0ID8gdHhPck1ldGFkYXRhLmdldE1ldGFkYXRhKCkgOiB0eE9yTWV0YWRhdGE7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlbGF5X3R4XCIsIHsgaGV4OiBtZXRhZGF0YSB9KTtcbiAgICAgIHR4SGFzaGVzLnB1c2gocmVzcC5yZXN1bHQudHhfaGFzaCk7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMucG9sbCgpOyAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIHJldHVybiB0eEhhc2hlcztcbiAgfVxuICBcbiAgYXN5bmMgZGVzY3JpYmVUeFNldCh0eFNldDogTW9uZXJvVHhTZXQpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJkZXNjcmliZV90cmFuc2ZlclwiLCB7XG4gICAgICB1bnNpZ25lZF90eHNldDogdHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpLFxuICAgICAgbXVsdGlzaWdfdHhzZXQ6IHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKVxuICAgIH0pO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY0Rlc2NyaWJlVHJhbnNmZXIocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25fdHJhbnNmZXJcIiwge1xuICAgICAgdW5zaWduZWRfdHhzZXQ6IHVuc2lnbmVkVHhIZXgsXG4gICAgICBleHBvcnRfcmF3OiB0cnVlLFxuICAgICAgZ2V0X3R4X2tleXM6IHRydWVcbiAgICB9KTtcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4cyhzaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3VibWl0X3RyYW5zZmVyXCIsIHtcbiAgICAgIHR4X2RhdGFfaGV4OiBzaWduZWRUeEhleFxuICAgIH0pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC50eF9oYXNoX2xpc3Q7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgc2lnbmF0dXJlVHlwZSA9IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVksIGFjY291bnRJZHggPSAwLCBzdWJhZGRyZXNzSWR4ID0gMCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzaWduXCIsIHtcbiAgICAgICAgZGF0YTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlX3R5cGU6IHNpZ25hdHVyZVR5cGUgPT09IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVkgPyBcInNwZW5kXCIgOiBcInZpZXdcIixcbiAgICAgICAgYWNjb3VudF9pbmRleDogYWNjb3VudElkeCxcbiAgICAgICAgYWRkcmVzc19pbmRleDogc3ViYWRkcmVzc0lkeFxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gIH1cbiAgXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0PiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidmVyaWZ5XCIsIHtkYXRhOiBtZXNzYWdlLCBhZGRyZXNzOiBhZGRyZXNzLCBzaWduYXR1cmU6IHNpZ25hdHVyZX0pO1xuICAgICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KFxuICAgICAgICByZXN1bHQuZ29vZCA/IHtpc0dvb2Q6IHJlc3VsdC5nb29kLCBpc09sZDogcmVzdWx0Lm9sZCwgc2lnbmF0dXJlVHlwZTogcmVzdWx0LnNpZ25hdHVyZV90eXBlID09PSBcInZpZXdcIiA/IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9WSUVXX0tFWSA6IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVksIHZlcnNpb246IHJlc3VsdC52ZXJzaW9ufSA6IHtpc0dvb2Q6IGZhbHNlfVxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTIpIHJldHVybiBuZXcgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCh7aXNHb29kOiBmYWxzZX0pO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4S2V5KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHhfa2V5XCIsIHt0eGlkOiB0eEhhc2h9KSkucmVzdWx0LnR4X2tleTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2g6IHN0cmluZywgdHhLZXk6IHN0cmluZywgYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgdHJ5IHtcbiAgICAgIFxuICAgICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3R4X2tleVwiLCB7dHhpZDogdHhIYXNoLCB0eF9rZXk6IHR4S2V5LCBhZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgICBcbiAgICAgIC8vIGludGVycHJldCByZXN1bHRcbiAgICAgIGxldCBjaGVjayA9IG5ldyBNb25lcm9DaGVja1R4KCk7XG4gICAgICBjaGVjay5zZXRJc0dvb2QodHJ1ZSk7XG4gICAgICBjaGVjay5zZXROdW1Db25maXJtYXRpb25zKHJlc3AucmVzdWx0LmNvbmZpcm1hdGlvbnMpO1xuICAgICAgY2hlY2suc2V0SW5UeFBvb2wocmVzcC5yZXN1bHQuaW5fcG9vbCk7XG4gICAgICBjaGVjay5zZXRSZWNlaXZlZEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQucmVjZWl2ZWQpKTtcbiAgICAgIHJldHVybiBjaGVjaztcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHhfcHJvb2ZcIiwge3R4aWQ6IHR4SGFzaCwgYWRkcmVzczogYWRkcmVzcywgbWVzc2FnZTogbWVzc2FnZX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfdHhfcHJvb2ZcIiwge1xuICAgICAgICB0eGlkOiB0eEhhc2gsXG4gICAgICAgIGFkZHJlc3M6IGFkZHJlc3MsXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gaW50ZXJwcmV0IHJlc3BvbnNlXG4gICAgICBsZXQgaXNHb29kID0gcmVzcC5yZXN1bHQuZ29vZDtcbiAgICAgIGxldCBjaGVjayA9IG5ldyBNb25lcm9DaGVja1R4KCk7XG4gICAgICBjaGVjay5zZXRJc0dvb2QoaXNHb29kKTtcbiAgICAgIGlmIChpc0dvb2QpIHtcbiAgICAgICAgY2hlY2suc2V0TnVtQ29uZmlybWF0aW9ucyhyZXNwLnJlc3VsdC5jb25maXJtYXRpb25zKTtcbiAgICAgICAgY2hlY2suc2V0SW5UeFBvb2wocmVzcC5yZXN1bHQuaW5fcG9vbCk7XG4gICAgICAgIGNoZWNrLnNldFJlY2VpdmVkQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5yZWNlaXZlZCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNoZWNrO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTEgJiYgZS5tZXNzYWdlLnN0YXJ0c1dpdGgoXCJiYXNpY19zdHJpbmdcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJNdXN0IHByb3ZpZGUgc2lnbmF0dXJlIHRvIGNoZWNrIHR4IHByb29mXCIsIC0xKTtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfc3BlbmRfcHJvb2ZcIiwge3R4aWQ6IHR4SGFzaCwgbWVzc2FnZTogbWVzc2FnZX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfc3BlbmRfcHJvb2ZcIiwge1xuICAgICAgICB0eGlkOiB0eEhhc2gsXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC5nb29kO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhbGw6IHRydWUsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGFtb3VudDogYmlnaW50LCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFjY291bnRfaW5kZXg6IGFjY291bnRJZHgsXG4gICAgICBhbW91bnQ6IGFtb3VudCxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICB9XG5cbiAgYXN5bmMgY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1Jlc2VydmU+IHtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3Jlc2VydmVfcHJvb2ZcIiwge1xuICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICBzaWduYXR1cmU6IHNpZ25hdHVyZVxuICAgIH0pO1xuICAgIFxuICAgIC8vIGludGVycHJldCByZXN1bHRzXG4gICAgbGV0IGlzR29vZCA9IHJlc3AucmVzdWx0Lmdvb2Q7XG4gICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrUmVzZXJ2ZSgpO1xuICAgIGNoZWNrLnNldElzR29vZChpc0dvb2QpO1xuICAgIGlmIChpc0dvb2QpIHtcbiAgICAgIGNoZWNrLnNldFVuY29uZmlybWVkU3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnNwZW50KSk7XG4gICAgICBjaGVjay5zZXRUb3RhbEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQudG90YWwpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoZWNrO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9ub3Rlc1wiLCB7dHhpZHM6IHR4SGFzaGVzfSkpLnJlc3VsdC5ub3RlcztcbiAgfVxuICBcbiAgYXN5bmMgc2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10sIG5vdGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIG5vdGVzID0gbm90ZXMubWFwKG5vdGUgPT4gR2VuVXRpbHMuaXNJbml0aWFsaXplZChub3RlKSA/IG5vdGUgOiBcIlwiKTsgLy8gd2FsbGV0IHJwYyByZWplY3RzIGpzb24gbnVsbFxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF90eF9ub3Rlc1wiLCB7dHhpZHM6IHR4SGFzaGVzLCBub3Rlczogbm90ZXN9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9BZGRyZXNzQm9va0VudHJ5W10+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzX2Jvb2tcIiwge2VudHJpZXM6IGVudHJ5SW5kaWNlc30pO1xuICAgIGlmICghcmVzcC5yZXN1bHQuZW50cmllcykgcmV0dXJuIFtdO1xuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgZm9yIChsZXQgcnBjRW50cnkgb2YgcmVzcC5yZXN1bHQuZW50cmllcykge1xuICAgICAgZW50cmllcy5wdXNoKG5ldyBNb25lcm9BZGRyZXNzQm9va0VudHJ5KCkuc2V0SW5kZXgocnBjRW50cnkuaW5kZXgpLnNldEFkZHJlc3MocnBjRW50cnkuYWRkcmVzcykuc2V0RGVzY3JpcHRpb24ocnBjRW50cnkuZGVzY3JpcHRpb24pLnNldFBheW1lbnRJZChycGNFbnRyeS5wYXltZW50X2lkKSk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG4gIFxuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3M6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiYWRkX2FkZHJlc3NfYm9va1wiLCB7YWRkcmVzczogYWRkcmVzcywgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9ufSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmluZGV4O1xuICB9XG4gIFxuICBhc3luYyBlZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleDogbnVtYmVyLCBzZXRBZGRyZXNzOiBib29sZWFuLCBhZGRyZXNzOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNldERlc2NyaXB0aW9uOiBib29sZWFuLCBkZXNjcmlwdGlvbjogc3RyaW5nIHwgdW5kZWZpbmVkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJlZGl0X2FkZHJlc3NfYm9va1wiLCB7XG4gICAgICBpbmRleDogaW5kZXgsXG4gICAgICBzZXRfYWRkcmVzczogc2V0QWRkcmVzcyxcbiAgICAgIGFkZHJlc3M6IGFkZHJlc3MsXG4gICAgICBzZXRfZGVzY3JpcHRpb246IHNldERlc2NyaXB0aW9uLFxuICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uXG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHg6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImRlbGV0ZV9hZGRyZXNzX2Jvb2tcIiwge2luZGV4OiBlbnRyeUlkeH0pO1xuICB9XG4gIFxuICBhc3luYyB0YWdBY2NvdW50cyh0YWcsIGFjY291bnRJbmRpY2VzKSB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidGFnX2FjY291bnRzXCIsIHt0YWc6IHRhZywgYWNjb3VudHM6IGFjY291bnRJbmRpY2VzfSk7XG4gIH1cblxuICBhc3luYyB1bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInVudGFnX2FjY291bnRzXCIsIHthY2NvdW50czogYWNjb3VudEluZGljZXN9KTtcbiAgfVxuXG4gIGFzeW5jIGdldEFjY291bnRUYWdzKCk6IFByb21pc2U8TW9uZXJvQWNjb3VudFRhZ1tdPiB7XG4gICAgbGV0IHRhZ3MgPSBbXTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hY2NvdW50X3RhZ3NcIik7XG4gICAgaWYgKHJlc3AucmVzdWx0LmFjY291bnRfdGFncykge1xuICAgICAgZm9yIChsZXQgcnBjQWNjb3VudFRhZyBvZiByZXNwLnJlc3VsdC5hY2NvdW50X3RhZ3MpIHtcbiAgICAgICAgdGFncy5wdXNoKG5ldyBNb25lcm9BY2NvdW50VGFnKHtcbiAgICAgICAgICB0YWc6IHJwY0FjY291bnRUYWcudGFnID8gcnBjQWNjb3VudFRhZy50YWcgOiB1bmRlZmluZWQsXG4gICAgICAgICAgbGFiZWw6IHJwY0FjY291bnRUYWcubGFiZWwgPyBycGNBY2NvdW50VGFnLmxhYmVsIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGFjY291bnRJbmRpY2VzOiBycGNBY2NvdW50VGFnLmFjY291bnRzXG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhZ3M7XG4gIH1cblxuICBhc3luYyBzZXRBY2NvdW50VGFnTGFiZWwodGFnOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYWNjb3VudF90YWdfZGVzY3JpcHRpb25cIiwge3RhZzogdGFnLCBkZXNjcmlwdGlvbjogbGFiZWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWc6IE1vbmVyb1R4Q29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJtYWtlX3VyaVwiLCB7XG4gICAgICBhZGRyZXNzOiBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLFxuICAgICAgYW1vdW50OiBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QW1vdW50KCksXG4gICAgICBwYXltZW50X2lkOiBjb25maWcuZ2V0UGF5bWVudElkKCksXG4gICAgICByZWNpcGllbnRfbmFtZTogY29uZmlnLmdldFJlY2lwaWVudE5hbWUoKSxcbiAgICAgIHR4X2Rlc2NyaXB0aW9uOiBjb25maWcuZ2V0Tm90ZSgpXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnVyaTtcbiAgfVxuICBcbiAgYXN5bmMgcGFyc2VQYXltZW50VXJpKHVyaTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeENvbmZpZz4ge1xuICAgIGFzc2VydCh1cmksIFwiTXVzdCBwcm92aWRlIFVSSSB0byBwYXJzZVwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInBhcnNlX3VyaVwiLCB7dXJpOiB1cml9KTtcbiAgICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKHthZGRyZXNzOiByZXNwLnJlc3VsdC51cmkuYWRkcmVzcywgYW1vdW50OiBCaWdJbnQocmVzcC5yZXN1bHQudXJpLmFtb3VudCl9KTtcbiAgICBjb25maWcuc2V0UGF5bWVudElkKHJlc3AucmVzdWx0LnVyaS5wYXltZW50X2lkKTtcbiAgICBjb25maWcuc2V0UmVjaXBpZW50TmFtZShyZXNwLnJlc3VsdC51cmkucmVjaXBpZW50X25hbWUpO1xuICAgIGNvbmZpZy5zZXROb3RlKHJlc3AucmVzdWx0LnVyaS50eF9kZXNjcmlwdGlvbik7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkpIGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5zZXRBZGRyZXNzKHVuZGVmaW5lZCk7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXRQYXltZW50SWQoKSkgY29uZmlnLnNldFBheW1lbnRJZCh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0UmVjaXBpZW50TmFtZSgpKSBjb25maWcuc2V0UmVjaXBpZW50TmFtZSh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0Tm90ZSgpKSBjb25maWcuc2V0Tm90ZSh1bmRlZmluZWQpO1xuICAgIHJldHVybiBjb25maWc7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2F0dHJpYnV0ZVwiLCB7a2V5OiBrZXl9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC52YWx1ZSA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHJlc3AucmVzdWx0LnZhbHVlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTQ1KSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXk6IHN0cmluZywgdmFsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYXR0cmlidXRlXCIsIHtrZXk6IGtleSwgdmFsdWU6IHZhbH0pO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzOiBudW1iZXIsIGJhY2tncm91bmRNaW5pbmc/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0YXJ0X21pbmluZ1wiLCB7XG4gICAgICB0aHJlYWRzX2NvdW50OiBudW1UaHJlYWRzLFxuICAgICAgZG9fYmFja2dyb3VuZF9taW5pbmc6IGJhY2tncm91bmRNaW5pbmcsXG4gICAgICBpZ25vcmVfYmF0dGVyeTogaWdub3JlQmF0dGVyeVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3BfbWluaW5nXCIpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnSW1wb3J0TmVlZGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm11bHRpc2lnX2ltcG9ydF9uZWVkZWQgPT09IHRydWU7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE11bHRpc2lnSW5mbygpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5mbz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaXNfbXVsdGlzaWdcIik7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCBpbmZvID0gbmV3IE1vbmVyb011bHRpc2lnSW5mbygpO1xuICAgIGluZm8uc2V0SXNNdWx0aXNpZyhyZXN1bHQubXVsdGlzaWcpO1xuICAgIGluZm8uc2V0SXNSZWFkeShyZXN1bHQucmVhZHkpO1xuICAgIGluZm8uc2V0VGhyZXNob2xkKHJlc3VsdC50aHJlc2hvbGQpO1xuICAgIGluZm8uc2V0TnVtUGFydGljaXBhbnRzKHJlc3VsdC50b3RhbCk7XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbiAgXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicHJlcGFyZV9tdWx0aXNpZ1wiLCB7ZW5hYmxlX211bHRpc2lnX2V4cGVyaW1lbnRhbDogdHJ1ZX0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIHJldHVybiByZXN1bHQubXVsdGlzaWdfaW5mbztcbiAgfVxuICBcbiAgYXN5bmMgbWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCB0aHJlc2hvbGQ6IG51bWJlciwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJtYWtlX211bHRpc2lnXCIsIHtcbiAgICAgIG11bHRpc2lnX2luZm86IG11bHRpc2lnSGV4ZXMsXG4gICAgICB0aHJlc2hvbGQ6IHRocmVzaG9sZCxcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZFxuICAgIH0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm11bHRpc2lnX2luZm87XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4Y2hhbmdlX211bHRpc2lnX2tleXNcIiwge211bHRpc2lnX2luZm86IG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkOiBwYXNzd29yZH0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgbGV0IG1zUmVzdWx0ID0gbmV3IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCgpO1xuICAgIG1zUmVzdWx0LnNldEFkZHJlc3MocmVzcC5yZXN1bHQuYWRkcmVzcyk7XG4gICAgbXNSZXN1bHQuc2V0TXVsdGlzaWdIZXgocmVzcC5yZXN1bHQubXVsdGlzaWdfaW5mbyk7XG4gICAgaWYgKG1zUmVzdWx0LmdldEFkZHJlc3MoKS5sZW5ndGggPT09IDApIG1zUmVzdWx0LnNldEFkZHJlc3ModW5kZWZpbmVkKTtcbiAgICBpZiAobXNSZXN1bHQuZ2V0TXVsdGlzaWdIZXgoKS5sZW5ndGggPT09IDApIG1zUmVzdWx0LnNldE11bHRpc2lnSGV4KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIG1zUmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRNdWx0aXNpZ0hleCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X211bHRpc2lnX2luZm9cIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmluZm87XG4gIH1cblxuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcmVmcmVzaEFmdGVySW1wb3J0PzogYm9vbGVhbik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHJlZnJlc2hBZnRlckltcG9ydCA9PT0gdW5kZWZpbmVkKSByZWZyZXNoQWZ0ZXJJbXBvcnQgPSB0cnVlO1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShtdWx0aXNpZ0hleGVzKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN0cmluZ1tdIHRvIGltcG9ydE11bHRpc2lnSGV4KClcIilcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9tdWx0aXNpZ19pbmZvXCIsIHtpbmZvOiBtdWx0aXNpZ0hleGVzLCByZWZyZXNoX2FmdGVyX2ltcG9ydDogcmVmcmVzaEFmdGVySW1wb3J0fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm5fb3V0cHV0cztcbiAgfVxuXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzaWduX211bHRpc2lnXCIsIHt0eF9kYXRhX2hleDogbXVsdGlzaWdUeEhleH0pO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgc2lnblJlc3VsdCA9IG5ldyBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQoKTtcbiAgICBzaWduUmVzdWx0LnNldFNpZ25lZE11bHRpc2lnVHhIZXgocmVzdWx0LnR4X2RhdGFfaGV4KTtcbiAgICBzaWduUmVzdWx0LnNldFR4SGFzaGVzKHJlc3VsdC50eF9oYXNoX2xpc3QpO1xuICAgIHJldHVybiBzaWduUmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfbXVsdGlzaWdcIiwge3R4X2RhdGFfaGV4OiBzaWduZWRNdWx0aXNpZ1R4SGV4fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQ6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkXCIsIHtvbGRfcGFzc3dvcmQ6IG9sZFBhc3N3b3JkIHx8IFwiXCIsIG5ld19wYXNzd29yZDogbmV3UGFzc3dvcmQgfHwgXCJcIn0pO1xuICB9XG4gIFxuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3JlXCIpO1xuICB9XG4gIFxuICBhc3luYyBjbG9zZShzYXZlID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5jbG9zZShzYXZlKTtcbiAgICBpZiAoc2F2ZSA9PT0gdW5kZWZpbmVkKSBzYXZlID0gZmFsc2U7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNsb3NlX3dhbGxldFwiLCB7YXV0b3NhdmVfY3VycmVudDogc2F2ZX0pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nsb3NlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmV0dXJuIGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTEzICYmIGUubWVzc2FnZS5pbmRleE9mKFwiTm8gd2FsbGV0IGZpbGVcIikgPiAtMTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICAvKipcbiAgICogU2F2ZSBhbmQgY2xvc2UgdGhlIGN1cnJlbnQgd2FsbGV0IGFuZCBzdG9wIHRoZSBSUEMgc2VydmVyLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3Bfd2FsbGV0XCIpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuXG4gIGFzeW5jIGdldE51bUJsb2Nrc1RvVW5sb2NrKCk6IFByb21pc2U8bnVtYmVyW118dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXROdW1CbG9ja3NUb1VubG9jaygpOyB9XG4gIGFzeW5jIGdldFR4KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldHx1bmRlZmluZWQ+IHsgcmV0dXJuIHN1cGVyLmdldFR4KHR4SGFzaCk7IH1cbiAgYXN5bmMgZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb0luY29taW5nVHJhbnNmZXJbXT4geyByZXR1cm4gc3VwZXIuZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KSB7IHJldHVybiBzdXBlci5nZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeSk7IH1cbiAgYXN5bmMgY3JlYXRlVHgoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHsgcmV0dXJuIHN1cGVyLmNyZWF0ZVR4KGNvbmZpZyk7IH1cbiAgYXN5bmMgcmVsYXlUeCh0eE9yTWV0YWRhdGE6IE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLnJlbGF5VHgodHhPck1ldGFkYXRhKTsgfVxuICBhc3luYyBnZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIuZ2V0VHhOb3RlKHR4SGFzaCk7IH1cbiAgYXN5bmMgc2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nLCBub3RlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHN1cGVyLnNldFR4Tm90ZSh0eEhhc2gsIG5vdGUpOyB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHN0YXRpYyBhc3luYyBjb25uZWN0VG9XYWxsZXRScGModXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBsZXQgY29uZmlnID0gTW9uZXJvV2FsbGV0UnBjLm5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZywgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICBpZiAoY29uZmlnLmNtZCkgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5zdGFydFdhbGxldFJwY1Byb2Nlc3MoY29uZmlnKTtcbiAgICBlbHNlIHJldHVybiBuZXcgTW9uZXJvV2FsbGV0UnBjKGNvbmZpZyk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgc3RhcnRXYWxsZXRScGNQcm9jZXNzKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNBcnJheShjb25maWcuY21kKSwgXCJNdXN0IHByb3ZpZGUgc3RyaW5nIGFycmF5IHdpdGggY29tbWFuZCBsaW5lIHBhcmFtZXRlcnNcIik7XG4gICAgXG4gICAgLy8gc3RhcnQgcHJvY2Vzc1xuICAgIGxldCBjaGlsZF9wcm9jZXNzID0gYXdhaXQgaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKTtcbiAgICBjb25zdCBjaGlsZFByb2Nlc3MgPSBjaGlsZF9wcm9jZXNzLnNwYXduKGNvbmZpZy5jbWRbMF0sIGNvbmZpZy5jbWQuc2xpY2UoMSksIHtcbiAgICAgIGVudjogeyAuLi5wcm9jZXNzLmVudiwgTEFORzogJ2VuX1VTLlVURi04JyB9IC8vIHNjcmFwZSBvdXRwdXQgaW4gZW5nbGlzaFxuICAgIH0pO1xuICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgYWZ0ZXIgc3RhcnRpbmcgbW9uZXJvLXdhbGxldC1ycGNcbiAgICBsZXQgdXJpO1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICBsZXQgb3V0cHV0ID0gXCJcIjtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRvdXRcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5vbignZGF0YScsIGFzeW5jIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBsZXQgbGluZSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDIsIGxpbmUpO1xuICAgICAgICAgIG91dHB1dCArPSBsaW5lICsgJ1xcbic7IC8vIGNhcHR1cmUgb3V0cHV0IGluIGNhc2Ugb2YgZXJyb3JcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBleHRyYWN0IHVyaSBmcm9tIGUuZy4gXCJJIEJpbmRpbmcgb24gMTI3LjAuMC4xIChJUHY0KTozODA4NVwiXG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWlucyA9IFwiQmluZGluZyBvbiBcIjtcbiAgICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zSWR4ID0gbGluZS5pbmRleE9mKHVyaUxpbmVDb250YWlucyk7XG4gICAgICAgICAgaWYgKHVyaUxpbmVDb250YWluc0lkeCA+PSAwKSB7XG4gICAgICAgICAgICBsZXQgaG9zdCA9IGxpbmUuc3Vic3RyaW5nKHVyaUxpbmVDb250YWluc0lkeCArIHVyaUxpbmVDb250YWlucy5sZW5ndGgsIGxpbmUubGFzdEluZGV4T2YoJyAnKSk7XG4gICAgICAgICAgICBsZXQgdW5mb3JtYXR0ZWRMaW5lID0gbGluZS5yZXBsYWNlKC9cXHUwMDFiXFxbLio/bS9nLCAnJykudHJpbSgpOyAvLyByZW1vdmUgY29sb3IgZm9ybWF0dGluZ1xuICAgICAgICAgICAgbGV0IHBvcnQgPSB1bmZvcm1hdHRlZExpbmUuc3Vic3RyaW5nKHVuZm9ybWF0dGVkTGluZS5sYXN0SW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBsZXQgc3NsSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtc3NsXCIpO1xuICAgICAgICAgICAgbGV0IHNzbEVuYWJsZWQgPSBzc2xJZHggPj0gMCA/IFwiZW5hYmxlZFwiID09IGNvbmZpZy5jbWRbc3NsSWR4ICsgMV0udG9Mb3dlckNhc2UoKSA6IGZhbHNlO1xuICAgICAgICAgICAgdXJpID0gKHNzbEVuYWJsZWQgPyBcImh0dHBzXCIgOiBcImh0dHBcIikgKyBcIjovL1wiICsgaG9zdCArIFwiOlwiICsgcG9ydDtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVhZCBzdWNjZXNzIG1lc3NhZ2VcbiAgICAgICAgICBpZiAobGluZS5pbmRleE9mKFwiU3RhcnRpbmcgd2FsbGV0IFJQQyBzZXJ2ZXJcIikgPj0gMCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBnZXQgdXNlcm5hbWUsIHBhc3N3b3JkLCB6bXEgcHVibGlzaCB1cmksIGFuZCBwcm94eSB1cmkgZnJvbSBwYXJhbXNcbiAgICAgICAgICAgIGxldCB1c2VyUGFzc0lkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLWxvZ2luXCIpO1xuICAgICAgICAgICAgbGV0IHVzZXJQYXNzID0gdXNlclBhc3NJZHggPj0gMCA/IGNvbmZpZy5jbWRbdXNlclBhc3NJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcoMCwgdXNlclBhc3MuaW5kZXhPZignOicpKTtcbiAgICAgICAgICAgIGxldCBwYXNzd29yZCA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcodXNlclBhc3MuaW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBsZXQgem1xVXJpSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS16bXEtcHViXCIpO1xuICAgICAgICAgICAgbGV0IHptcVVyaSA9IHptcVVyaUlkeCA+PSAwID8gY29uZmlnLmNtZFt6bXFVcmlJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCBwcm94eVVyaUlkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcHJveHlcIik7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0dXBQcm94eVVyaSA9IHByb3h5VXJpSWR4ID49IDAgPyBjb25maWcuY21kW3Byb3h5VXJpSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3NcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZy5jb3B5KCkuc2V0U2VydmVyKHt1cmk6IHVyaSwgdXNlcm5hbWU6IHVzZXJuYW1lLCBwYXNzd29yZDogcGFzc3dvcmQsIHptcVVyaTogem1xVXJpLCBwcm94eVVyaTogdGhpcy5zdGFydHVwUHJveHlVcmksIHJlamVjdFVuYXV0aG9yaXplZDogY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkfSk7XG4gICAgICAgICAgICBjb25maWcuY21kID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldFJwYy5jb25uZWN0VG9XYWxsZXRScGMoY29uZmlnKTtcbiAgICAgICAgICAgIHdhbGxldC5wcm9jZXNzID0gY2hpbGRQcm9jZXNzO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyByZXNvbHZlIHByb21pc2Ugd2l0aCBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3MgXG4gICAgICAgICAgICB0aGlzLmlzUmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZSh3YWxsZXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3RkZXJyXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRlcnIub24oJ2RhdGEnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIGNvbnNvbGUuZXJyb3IoZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIGV4aXRcbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwiZXhpdFwiLCBmdW5jdGlvbihjb2RlKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBwcm9jZXNzIHRlcm1pbmF0ZWQgd2l0aCBleGl0IGNvZGUgXCIgKyBjb2RlICsgKG91dHB1dCA/IFwiOlxcblxcblwiICsgb3V0cHV0IDogXCJcIikpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXJyb3JcbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgaWYgKGVyci5tZXNzYWdlLmluZGV4T2YoXCJFTk9FTlRcIikgPj0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGV4aXN0IGF0IHBhdGggJ1wiICsgY29uZmlnLmNtZFswXSArIFwiJ1wiKSk7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSB1bmNhdWdodCBleGNlcHRpb25cbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIiwgZnVuY3Rpb24oZXJyLCBvcmlnaW4pIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5jYXVnaHQgZXhjZXB0aW9uIGluIG1vbmVyby13YWxsZXQtcnBjIHByb2Nlc3M6IFwiICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3Iob3JpZ2luKTtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY2xlYXIoKSB7XG4gICAgdGhpcy5saXN0ZW5lckdlbmVyYXRpb24rKztcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIpIHRoaXMud2FsbGV0UG9sbGVyLnJlc2V0KCk7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gICAgZGVsZXRlIHRoaXMuYWRkcmVzc0NhY2hlO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgdGhpcy5wYXRoID0gdW5kZWZpbmVkO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QWNjb3VudEluZGljZXMoZ2V0U3ViYWRkcmVzc0luZGljZXM/OiBhbnkpIHtcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTtcbiAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgaW5kaWNlcy5zZXQoYWNjb3VudC5nZXRJbmRleCgpLCBnZXRTdWJhZGRyZXNzSW5kaWNlcyA/IGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc0luZGljZXMoYWNjb3VudC5nZXRJbmRleCgpKSA6IHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIHJldHVybiBpbmRpY2VzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0U3ViYWRkcmVzc0luZGljZXMoYWNjb3VudElkeCkge1xuICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NcIiwge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHh9KTtcbiAgICBmb3IgKGxldCBhZGRyZXNzIG9mIHJlc3AucmVzdWx0LmFkZHJlc3Nlcykgc3ViYWRkcmVzc0luZGljZXMucHVzaChhZGRyZXNzLmFkZHJlc3NfaW5kZXgpO1xuICAgIHJldHVybiBzdWJhZGRyZXNzSW5kaWNlcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldFRyYW5zZmVyc0F1eChxdWVyeTogTW9uZXJvVHJhbnNmZXJRdWVyeSkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHBhcmFtcyBmb3IgZ2V0X3RyYW5zZmVycyBycGMgY2FsbFxuICAgIGxldCB0eFF1ZXJ5ID0gcXVlcnkuZ2V0VHhRdWVyeSgpO1xuICAgIGxldCBjYW5CZUNvbmZpcm1lZCA9IHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldElzUmVsYXllZCgpICE9PSBmYWxzZTtcbiAgICBsZXQgY2FuQmVJblR4UG9vbCA9IHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEhlaWdodCgpID09PSB1bmRlZmluZWQgJiYgdHhRdWVyeS5nZXRNYXhIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4UXVlcnkuZ2V0SXNMb2NrZWQoKSAhPT0gZmFsc2U7XG4gICAgbGV0IGNhbkJlSW5jb21pbmcgPSBxdWVyeS5nZXRJc0luY29taW5nKCkgIT09IGZhbHNlICYmIHF1ZXJ5LmdldElzT3V0Z29pbmcoKSAhPT0gdHJ1ZSAmJiBxdWVyeS5nZXRIYXNEZXN0aW5hdGlvbnMoKSAhPT0gdHJ1ZTtcbiAgICBsZXQgY2FuQmVPdXRnb2luZyA9IHF1ZXJ5LmdldElzT3V0Z29pbmcoKSAhPT0gZmFsc2UgJiYgcXVlcnkuZ2V0SXNJbmNvbWluZygpICE9PSB0cnVlO1xuXG4gICAgLy8gY2hlY2sgaWYgZmV0Y2hpbmcgcG9vbCB0eHMgY29udHJhZGljdGVkIGJ5IGNvbmZpZ3VyYXRpb25cbiAgICBpZiAodHhRdWVyeS5nZXRJblR4UG9vbCgpID09PSB0cnVlICYmICFjYW5CZUluVHhQb29sKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgZmV0Y2ggcG9vbCB0cmFuc2FjdGlvbnMgYmVjYXVzZSBpdCBjb250cmFkaWN0cyBjb25maWd1cmF0aW9uXCIpO1xuICAgIH1cblxuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5pbiA9IGNhbkJlSW5jb21pbmcgJiYgY2FuQmVDb25maXJtZWQ7XG4gICAgcGFyYW1zLm91dCA9IGNhbkJlT3V0Z29pbmcgJiYgY2FuQmVDb25maXJtZWQ7XG4gICAgcGFyYW1zLnBvb2wgPSBjYW5CZUluY29taW5nICYmIGNhbkJlSW5UeFBvb2w7XG4gICAgcGFyYW1zLnBlbmRpbmcgPSBjYW5CZU91dGdvaW5nICYmIGNhbkJlSW5UeFBvb2w7XG4gICAgcGFyYW1zLmZhaWxlZCA9IHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJc0NvbmZpcm1lZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPSB0cnVlO1xuICAgIGlmICh0eFF1ZXJ5LmdldE1pbkhlaWdodCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eFF1ZXJ5LmdldE1pbkhlaWdodCgpID4gMCkgcGFyYW1zLm1pbl9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpIC0gMTsgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogd2FsbGV0Mjo6Z2V0X3BheW1lbnRzKCkgbWluX2hlaWdodCBpcyBleGNsdXNpdmUsIHNvIG1hbnVhbGx5IG9mZnNldCB0byBtYXRjaCBpbnRlbmRlZCByYW5nZSAoaXNzdWVzICM1NzUxLCAjNTU5OClcbiAgICAgIGVsc2UgcGFyYW1zLm1pbl9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpO1xuICAgIH1cbiAgICBpZiAodHhRdWVyeS5nZXRNYXhIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSBwYXJhbXMubWF4X2hlaWdodCA9IHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCk7XG4gICAgcGFyYW1zLmZpbHRlcl9ieV9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpICE9PSB1bmRlZmluZWQgfHwgdHhRdWVyeS5nZXRNYXhIZWlnaHQoKSAhPT0gdW5kZWZpbmVkO1xuICAgIGlmIChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkgPT09IHVuZGVmaW5lZCAmJiBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQsIFwiUXVlcnkgc3BlY2lmaWVzIGEgc3ViYWRkcmVzcyBpbmRleCBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIik7XG4gICAgICBwYXJhbXMuYWxsX2FjY291bnRzID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBxdWVyeS5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICAgIFxuICAgICAgLy8gc2V0IHN1YmFkZHJlc3MgaW5kaWNlcyBwYXJhbVxuICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gbmV3IFNldCgpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpICE9PSB1bmRlZmluZWQpIHN1YmFkZHJlc3NJbmRpY2VzLmFkZChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLm1hcChzdWJhZGRyZXNzSWR4ID0+IHN1YmFkZHJlc3NJbmRpY2VzLmFkZChzdWJhZGRyZXNzSWR4KSk7XG4gICAgICBpZiAoc3ViYWRkcmVzc0luZGljZXMuc2l6ZSkgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IEFycmF5LmZyb20oc3ViYWRkcmVzc0luZGljZXMpO1xuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB1bmlxdWUgdHhzIGFuZCBibG9ja3NcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBcbiAgICAvLyBidWlsZCB0eHMgdXNpbmcgYGdldF90cmFuc2ZlcnNgXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHJhbnNmZXJzXCIsIHBhcmFtcyk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJlc3AucmVzdWx0KSkge1xuICAgICAgZm9yIChsZXQgcnBjVHggb2YgcmVzcC5yZXN1bHRba2V5XSkge1xuICAgICAgICAvL2lmIChycGNUeC50eGlkID09PSBxdWVyeS5kZWJ1Z1R4SWQpIGNvbnNvbGUubG9nKHJwY1R4KTtcbiAgICAgICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlcihycGNUeCk7XG4gICAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSBhc3NlcnQodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSA+IC0xKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlcGxhY2UgdHJhbnNmZXIgYW1vdW50IHdpdGggZGVzdGluYXRpb24gc3VtXG4gICAgICAgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IGNvbmZpcm1lZCB0eCBmcm9tL3RvIHNhbWUgYWNjb3VudCBoYXMgYW1vdW50IDAgYnV0IGNhY2hlZCB0cmFuc2ZlcnNcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldElzUmVsYXllZCgpICYmICF0eC5nZXRJc0ZhaWxlZCgpICYmXG4gICAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkgJiYgdHguZ2V0T3V0Z29pbmdBbW91bnQoKSA9PT0gMG4pIHtcbiAgICAgICAgICBsZXQgb3V0Z29pbmdUcmFuc2ZlciA9IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKTtcbiAgICAgICAgICBsZXQgdHJhbnNmZXJUb3RhbCA9IEJpZ0ludCgwKTtcbiAgICAgICAgICBmb3IgKGxldCBkZXN0aW5hdGlvbiBvZiBvdXRnb2luZ1RyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpKSB0cmFuc2ZlclRvdGFsID0gdHJhbnNmZXJUb3RhbCArIGRlc3RpbmF0aW9uLmdldEFtb3VudCgpO1xuICAgICAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBbW91bnQodHJhbnNmZXJUb3RhbCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIG1lcmdlIHR4XG4gICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzb3J0IHR4cyBieSBibG9jayBoZWlnaHRcbiAgICBsZXQgdHhzOiBNb25lcm9UeFdhbGxldFtdID0gT2JqZWN0LnZhbHVlcyh0eE1hcCk7XG4gICAgdHhzLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVUeHNCeUhlaWdodCk7XG4gICAgXG4gICAgLy8gZmlsdGVyIGFuZCByZXR1cm4gdHJhbnNmZXJzXG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgXG4gICAgICAvLyB0eCBpcyBub3QgaW5jb21pbmcvb3V0Z29pbmcgdW5sZXNzIGFscmVhZHkgc2V0XG4gICAgICBpZiAodHguZ2V0SXNJbmNvbWluZygpID09PSB1bmRlZmluZWQpIHR4LnNldElzSW5jb21pbmcoZmFsc2UpO1xuICAgICAgaWYgKHR4LmdldElzT3V0Z29pbmcoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc091dGdvaW5nKGZhbHNlKTtcbiAgICAgIFxuICAgICAgLy8gc29ydCBpbmNvbWluZyB0cmFuc2ZlcnNcbiAgICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZUluY29taW5nVHJhbnNmZXJzKTtcbiAgICAgIFxuICAgICAgLy8gY29sbGVjdCBxdWVyaWVkIHRyYW5zZmVycywgZXJhc2UgaWYgZXhjbHVkZWRcbiAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmZpbHRlclRyYW5zZmVycyhxdWVyeSkpIHtcbiAgICAgICAgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyByZW1vdmUgdHhzIHdpdGhvdXQgcmVxdWVzdGVkIHRyYW5zZmVyXG4gICAgICBpZiAodHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PT0gdW5kZWZpbmVkICYmIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0eC5nZXRCbG9jaygpLmdldFR4cygpLnNwbGljZSh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldE91dHB1dHNBdXgocXVlcnkpIHtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzIHRvIGJlIHF1ZXJpZWRcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTtcbiAgICBpZiAocXVlcnkuZ2V0QWNjb3VudEluZGV4KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gbmV3IFNldCgpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpICE9PSB1bmRlZmluZWQpIHN1YmFkZHJlc3NJbmRpY2VzLmFkZChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLm1hcChzdWJhZGRyZXNzSWR4ID0+IHN1YmFkZHJlc3NJbmRpY2VzLmFkZChzdWJhZGRyZXNzSWR4KSk7XG4gICAgICBpbmRpY2VzLnNldChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMuc2l6ZSA/IEFycmF5LmZyb20oc3ViYWRkcmVzc0luZGljZXMpIDogdW5kZWZpbmVkKTsgIC8vIHVuZGVmaW5lZCB3aWxsIGZldGNoIGZyb20gYWxsIHN1YmFkZHJlc3Nlc1xuICAgIH0gZWxzZSB7XG4gICAgICBhc3NlcnQuZXF1YWwocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCksIHVuZGVmaW5lZCwgXCJRdWVyeSBzcGVjaWZpZXMgYSBzdWJhZGRyZXNzIGluZGV4IGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKVxuICAgICAgYXNzZXJ0KHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCB8fCBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCwgXCJRdWVyeSBzcGVjaWZpZXMgc3ViYWRkcmVzcyBpbmRpY2VzIGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKTtcbiAgICAgIGluZGljZXMgPSBhd2FpdCB0aGlzLmdldEFjY291bnRJbmRpY2VzKCk7ICAvLyBmZXRjaCBhbGwgYWNjb3VudCBpbmRpY2VzIHdpdGhvdXQgc3ViYWRkcmVzc2VzXG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHVuaXF1ZSB0eHMgYW5kIGJsb2Nrc1xuICAgIGxldCB0eE1hcCA9IHt9O1xuICAgIGxldCBibG9ja01hcCA9IHt9O1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdHhzIHdpdGggb3V0cHV0cyBmb3IgZWFjaCBpbmRpY2F0ZWQgYWNjb3VudCB1c2luZyBgaW5jb21pbmdfdHJhbnNmZXJzYCBycGMgY2FsbFxuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy50cmFuc2Zlcl90eXBlID0gcXVlcnkuZ2V0SXNTcGVudCgpID09PSB0cnVlID8gXCJ1bmF2YWlsYWJsZVwiIDogcXVlcnkuZ2V0SXNTcGVudCgpID09PSBmYWxzZSA/IFwiYXZhaWxhYmxlXCIgOiBcImFsbFwiO1xuICAgIHBhcmFtcy52ZXJib3NlID0gdHJ1ZTtcbiAgICBmb3IgKGxldCBhY2NvdW50SWR4IG9mIGluZGljZXMua2V5cygpKSB7XG4gICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gYWNjb3VudElkeDtcbiAgICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBpbmRpY2VzLmdldChhY2NvdW50SWR4KTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW5jb21pbmdfdHJhbnNmZXJzXCIsIHBhcmFtcyk7XG4gICAgICBcbiAgICAgIC8vIGNvbnZlcnQgcmVzcG9uc2UgdG8gdHhzIHdpdGggb3V0cHV0cyBhbmQgbWVyZ2VcbiAgICAgIGlmIChyZXNwLnJlc3VsdC50cmFuc2ZlcnMgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG4gICAgICBmb3IgKGxldCBycGNPdXRwdXQgb2YgcmVzcC5yZXN1bHQudHJhbnNmZXJzKSB7XG4gICAgICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoT3V0cHV0KHJwY091dHB1dCk7XG4gICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzb3J0IHR4cyBieSBibG9jayBoZWlnaHRcbiAgICBsZXQgdHhzOiBNb25lcm9UeFdhbGxldFtdID0gT2JqZWN0LnZhbHVlcyh0eE1hcCk7XG4gICAgdHhzLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVUeHNCeUhlaWdodCk7XG4gICAgXG4gICAgLy8gY29sbGVjdCBxdWVyaWVkIG91dHB1dHNcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgXG4gICAgICAvLyBzb3J0IG91dHB1dHNcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdHguZ2V0T3V0cHV0cygpLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVPdXRwdXRzKTtcbiAgICAgIFxuICAgICAgLy8gY29sbGVjdCBxdWVyaWVkIG91dHB1dHMsIGVyYXNlIGlmIGV4Y2x1ZGVkXG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZmlsdGVyT3V0cHV0cyhxdWVyeSkpIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgXG4gICAgICAvLyByZW1vdmUgZXhjbHVkZWQgdHhzIGZyb20gYmxvY2tcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgPT09IHVuZGVmaW5lZCAmJiB0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29tbW9uIG1ldGhvZCB0byBnZXQga2V5IGltYWdlcy5cbiAgICogXG4gICAqIEBwYXJhbSBhbGwgLSBwZWNpZmllcyB0byBnZXQgYWxsIHhvciBvbmx5IG5ldyBpbWFnZXMgZnJvbSBsYXN0IGltcG9ydFxuICAgKiBAcmV0dXJuIHtNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdH0gdGhlIGtleSBpbWFnZXMgYW5kIHRoZWlyIG9mZnNldCBhbW9uZyB0aGUgd2FsbGV0J3Mgb3V0cHV0c1xuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIHJwY0V4cG9ydEtleUltYWdlcyhhbGwpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfa2V5X2ltYWdlc1wiLCB7YWxsOiBhbGx9KTtcbiAgICBsZXQga2V5SW1hZ2VzID0gKHJlc3AucmVzdWx0LnNpZ25lZF9rZXlfaW1hZ2VzIHx8IFtdKS5tYXAocnBjSW1hZ2UgPT4gbmV3IE1vbmVyb0tleUltYWdlKHJwY0ltYWdlLmtleV9pbWFnZSwgcnBjSW1hZ2Uuc2lnbmF0dXJlKSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCgpLnNldE9mZnNldChyZXNwLnJlc3VsdC5vZmZzZXQpLnNldEtleUltYWdlcyhrZXlJbWFnZXMpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgcnBjU3dlZXBBY2NvdW50KGNvbmZpZzogTW9uZXJvVHhDb25maWcpIHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBzd2VlcCBjb25maWdcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYW4gYWNjb3VudCBpbmRleCB0byBzd2VlcCBmcm9tXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoICE9IDEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBleGFjdGx5IG9uZSBkZXN0aW5hdGlvbiB0byBzd2VlcCB0b1wiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZGVzdGluYXRpb24gYWRkcmVzcyB0byBzd2VlcCB0b1wiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFtb3VudCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IGFtb3VudCBpbiBzd2VlcCBjb25maWdcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRLZXlJbWFnZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIktleSBpbWFnZSBkZWZpbmVkOyB1c2Ugc3dlZXBPdXRwdXQoKSB0byBzd2VlcCBhbiBvdXRwdXQgYnkgaXRzIGtleSBpbWFnZVwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCAmJiBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkVtcHR5IGxpc3QgZ2l2ZW4gZm9yIHN1YmFkZHJlc3NlcyBpbmRpY2VzIHRvIHN3ZWVwXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcygpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3dlZXAgZWFjaCBzdWJhZGRyZXNzIHdpdGggUlBDIGBzd2VlcF9hbGxgXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkgIT09IHVuZGVmaW5lZCAmJiBjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkubGVuZ3RoID4gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3dlZXBpbmcgb3V0cHV0IGRvZXMgbm90IHN1cHBvcnQgc3VidHJhY3RpbmcgZmVlcyBmcm9tIGRlc3RpbmF0aW9uc1wiKTtcbiAgICBcbiAgICAvLyBzd2VlcCBmcm9tIGFsbCBzdWJhZGRyZXNzZXMgaWYgbm90IG90aGVyd2lzZSBkZWZpbmVkXG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbmZpZy5zZXRTdWJhZGRyZXNzSW5kaWNlcyhbXSk7XG4gICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKSkpIHtcbiAgICAgICAgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJObyBzdWJhZGRyZXNzZXMgdG8gc3dlZXAgZnJvbVwiKTtcbiAgICBcbiAgICAvLyBjb21tb24gY29uZmlnIHBhcmFtc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIGxldCByZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpID09PSB0cnVlO1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gY29uZmlnLmdldEFjY291bnRJbmRleCgpO1xuICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCk7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWcuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWcuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZy5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gIXJlbGF5O1xuICAgIHBhcmFtcy5iZWxvd19hbW91bnQgPSBjb25maWcuZ2V0QmVsb3dBbW91bnQoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2tleXMgPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBpbnZva2Ugd2FsbGV0IHJwYyBgc3dlZXBfYWxsYFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfYWxsXCIsIHBhcmFtcyk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGZyb20gcmVzcG9uc2VcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCwgdW5kZWZpbmVkLCBjb25maWcpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgcmVtYWluaW5nIGtub3duIGZpZWxkc1xuICAgIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB7XG4gICAgICB0eC5zZXRJc0xvY2tlZCh0cnVlKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICB0eC5zZXRSZWxheShyZWxheSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChyZWxheSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQocmVsYXkpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIGxldCB0cmFuc2ZlciA9IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKTtcbiAgICAgIHRyYW5zZmVyLnNldEFjY291bnRJbmRleChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkpO1xuICAgICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSkgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkpO1xuICAgICAgbGV0IGRlc3RpbmF0aW9uID0gbmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksIEJpZ0ludCh0cmFuc2Zlci5nZXRBbW91bnQoKSkpO1xuICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKFtkZXN0aW5hdGlvbl0pO1xuICAgICAgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgICB0eC5zZXRQYXltZW50SWQoY29uZmlnLmdldFBheW1lbnRJZCgpKTtcbiAgICAgIGlmICh0eC5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0VW5sb2NrVGltZSgwbik7XG4gICAgICBpZiAodHguZ2V0UmVsYXkoKSkge1xuICAgICAgICBpZiAodHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgrbmV3IERhdGUoKS5nZXRUaW1lKCkpOyAgLy8gVE9ETyAobW9uZXJvLXdhbGxldC1ycGMpOiBwcm92aWRlIHRpbWVzdGFtcCBvbiByZXNwb25zZTsgdW5jb25maXJtZWQgdGltZXN0YW1wcyB2YXJ5XG4gICAgICAgIGlmICh0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbigpID09PSB1bmRlZmluZWQpIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0LmdldFR4cygpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgPT0gdW5kZWZpbmVkICYmIHRoaXMubGlzdGVuZXJzLmxlbmd0aCkgdGhpcy53YWxsZXRQb2xsZXIgPSBuZXcgV2FsbGV0UG9sbGVyKHRoaXMpO1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkKSB0aGlzLndhbGxldFBvbGxlci5zZXRJc1BvbGxpbmcodGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQb2xsIGlmIGxpc3RlbmluZy5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBwb2xsKCkge1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2FsbGV0UG9sbGVyLmlzUG9sbGluZykgYXdhaXQgdGhpcy53YWxsZXRQb2xsZXIucG9sbCgpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgU1RBVElDIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVDb25maWcodXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogTW9uZXJvV2FsbGV0Q29uZmlnIHtcbiAgICBsZXQgY29uZmlnOiB1bmRlZmluZWQgfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gPSB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbmZpZyA9PT0gXCJzdHJpbmdcIiB8fCAodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPikudXJpKSBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHtzZXJ2ZXI6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29uZmlnIGFzIHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4sIHVzZXJuYW1lLCBwYXNzd29yZCl9KTtcbiAgICBlbHNlIGlmIChHZW5VdGlscy5pc0FycmF5KHVyaU9yQ29uZmlnKSkgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh7Y21kOiB1cmlPckNvbmZpZyBhcyBzdHJpbmdbXX0pO1xuICAgIGVsc2UgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pO1xuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlciA9PT0gdW5kZWZpbmVkKSBjb25maWcucHJveHlUb1dvcmtlciA9IHRydWU7XG4gICAgcmV0dXJuIGNvbmZpZyBhcyBNb25lcm9XYWxsZXRDb25maWc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZW1vdmUgY3JpdGVyaWEgd2hpY2ggcmVxdWlyZXMgbG9va2luZyB1cCBvdGhlciB0cmFuc2ZlcnMvb3V0cHV0cyB0b1xuICAgKiBmdWxmaWxsIHF1ZXJ5LlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBxdWVyeSAtIHRoZSBxdWVyeSB0byBkZWNvbnRleHR1YWxpemVcbiAgICogQHJldHVybiB7TW9uZXJvVHhRdWVyeX0gYSByZWZlcmVuY2UgdG8gdGhlIHF1ZXJ5IGZvciBjb252ZW5pZW5jZVxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBkZWNvbnRleHR1YWxpemUocXVlcnkpIHtcbiAgICBxdWVyeS5zZXRJc0luY29taW5nKHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0SXNPdXRnb2luZyh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldFRyYW5zZmVyUXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRJbnB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0T3V0cHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gcXVlcnk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgaXNDb250ZXh0dWFsKHF1ZXJ5KSB7XG4gICAgaWYgKCFxdWVyeSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghcXVlcnkuZ2V0VHhRdWVyeSgpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRJc0luY29taW5nKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7IC8vIHJlcXVpcmVzIGdldHRpbmcgb3RoZXIgdHJhbnNmZXJzXG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRJc091dGdvaW5nKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKHF1ZXJ5IGluc3RhbmNlb2YgTW9uZXJvVHJhbnNmZXJRdWVyeSkge1xuICAgICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRPdXRwdXRRdWVyeSgpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIG91dHB1dHNcbiAgICB9IGVsc2UgaWYgKHF1ZXJ5IGluc3RhbmNlb2YgTW9uZXJvT3V0cHV0UXVlcnkpIHtcbiAgICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0VHJhbnNmZXJRdWVyeSgpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIHRyYW5zZmVyc1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJxdWVyeSBtdXN0IGJlIHR4IG9yIHRyYW5zZmVyIHF1ZXJ5XCIpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0FjY291bnQocnBjQWNjb3VudCkge1xuICAgIGxldCBhY2NvdW50ID0gbmV3IE1vbmVyb0FjY291bnQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQWNjb3VudCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNBY2NvdW50W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFjY291bnRfaW5kZXhcIikgYWNjb3VudC5zZXRJbmRleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhbGFuY2VcIikgYWNjb3VudC5zZXRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZF9iYWxhbmNlXCIpIGFjY291bnQuc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYXNlX2FkZHJlc3NcIikgYWNjb3VudC5zZXRQcmltYXJ5QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhZ1wiKSBhY2NvdW50LnNldFRhZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhYmVsXCIpIHsgfSAvLyBsYWJlbCBiZWxvbmdzIHRvIGZpcnN0IHN1YmFkZHJlc3NcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGFjY291bnQgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgaWYgKFwiXCIgPT09IGFjY291bnQuZ2V0VGFnKCkpIGFjY291bnQuc2V0VGFnKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIGFjY291bnQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcykge1xuICAgIGxldCBzdWJhZGRyZXNzID0gbmV3IE1vbmVyb1N1YmFkZHJlc3MoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjU3ViYWRkcmVzcykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNTdWJhZGRyZXNzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFjY291bnRfaW5kZXhcIikgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzX2luZGV4XCIpIHN1YmFkZHJlc3Muc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzXCIpIHN1YmFkZHJlc3Muc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhbGFuY2VcIikgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZF9iYWxhbmNlXCIpIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fdW5zcGVudF9vdXRwdXRzXCIpIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYWJlbFwiKSB7IGlmICh2YWwpIHN1YmFkZHJlc3Muc2V0TGFiZWwodmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVzZWRcIikgc3ViYWRkcmVzcy5zZXRJc1VzZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja3NfdG9fdW5sb2NrXCIpIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2sodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PSBcInRpbWVfdG9fdW5sb2NrXCIpIHt9ICAvLyBpZ25vcmluZ1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgc3ViYWRkcmVzcyBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gc3ViYWRkcmVzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgc2VudCB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIFRPRE86IHJlbW92ZSBjb3B5RGVzdGluYXRpb25zIGFmdGVyID4xOC4zLjEgd2hlbiBzdWJ0cmFjdEZlZUZyb20gZnVsbHkgc3VwcG9ydGVkXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4Q29uZmlnfSBjb25maWcgLSBzZW5kIGNvbmZpZ1xuICAgKiBAcGFyYW0ge01vbmVyb1R4V2FsbGV0fSBbdHhdIC0gZXhpc3RpbmcgdHJhbnNhY3Rpb24gdG8gaW5pdGlhbGl6ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gY29weURlc3RpbmF0aW9ucyAtIGNvcGllcyBjb25maWcgZGVzdGluYXRpb25zIGlmIHRydWVcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IGlzIHRoZSBpbml0aWFsaXplZCBzZW5kIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGluaXRTZW50VHhXYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPiwgdHgsIGNvcHlEZXN0aW5hdGlvbnMpIHtcbiAgICBpZiAoIXR4KSB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIGxldCByZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpID09PSB0cnVlO1xuICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgdHguc2V0SW5UeFBvb2wocmVsYXkpO1xuICAgIHR4LnNldFJlbGF5KHJlbGF5KTtcbiAgICB0eC5zZXRJc1JlbGF5ZWQocmVsYXkpO1xuICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIHR4LnNldElzTG9ja2VkKHRydWUpO1xuICAgIHR4LnNldFJpbmdTaXplKE1vbmVyb1V0aWxzLlJJTkdfU0laRSk7XG4gICAgbGV0IHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKTtcbiAgICB0cmFuc2Zlci5zZXRUeCh0eCk7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICYmIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSkgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkuc2xpY2UoMCkpOyAvLyB3ZSBrbm93IHNyYyBzdWJhZGRyZXNzIGluZGljZXMgaWZmIGNvbmZpZyBzcGVjaWZpZXMgMVxuICAgIGlmIChjb3B5RGVzdGluYXRpb25zKSB7XG4gICAgICBsZXQgZGVzdENvcGllcyA9IFtdO1xuICAgICAgZm9yIChsZXQgZGVzdCBvZiBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkpIGRlc3RDb3BpZXMucHVzaChkZXN0LmNvcHkoKSk7XG4gICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoZGVzdENvcGllcyk7XG4gICAgfVxuICAgIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgIHR4LnNldFBheW1lbnRJZChjb25maWcuZ2V0UGF5bWVudElkKCkpO1xuICAgIGlmICh0eC5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0VW5sb2NrVGltZSgwbik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZWxheSgpKSB7XG4gICAgICBpZiAodHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgrbmV3IERhdGUoKS5nZXRUaW1lKCkpOyAgLy8gVE9ETyAobW9uZXJvLXdhbGxldC1ycGMpOiBwcm92aWRlIHRpbWVzdGFtcCBvbiByZXNwb25zZTsgdW5jb25maXJtZWQgdGltZXN0YW1wcyB2YXJ5XG4gICAgICBpZiAodHguZ2V0SXNEb3VibGVTcGVuZFNlZW4oKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgdHggc2V0IGZyb20gYSBSUEMgbWFwIGV4Y2x1ZGluZyB0eHMuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjTWFwIC0gbWFwIHRvIGluaXRpYWxpemUgdGhlIHR4IHNldCBmcm9tXG4gICAqIEByZXR1cm4gTW9uZXJvVHhTZXQgLSBpbml0aWFsaXplZCB0eCBzZXRcbiAgICogQHJldHVybiB0aGUgcmVzdWx0aW5nIHR4IHNldFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhTZXQocnBjTWFwKSB7XG4gICAgbGV0IHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KCk7XG4gICAgdHhTZXQuc2V0TXVsdGlzaWdUeEhleChycGNNYXAubXVsdGlzaWdfdHhzZXQpO1xuICAgIHR4U2V0LnNldFVuc2lnbmVkVHhIZXgocnBjTWFwLnVuc2lnbmVkX3R4c2V0KTtcbiAgICB0eFNldC5zZXRTaWduZWRUeEhleChycGNNYXAuc2lnbmVkX3R4c2V0KTtcbiAgICBpZiAodHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0TXVsdGlzaWdUeEhleCh1bmRlZmluZWQpO1xuICAgIGlmICh0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCkubGVuZ3RoID09PSAwKSB0eFNldC5zZXRVbnNpZ25lZFR4SGV4KHVuZGVmaW5lZCk7XG4gICAgaWYgKHR4U2V0LmdldFNpZ25lZFR4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRTaWduZWRUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0U2lnbmVkVHhIZXgodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIE1vbmVyb1R4U2V0IGZyb20gYSBsaXN0IG9mIHJwYyB0eHMuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHhzIC0gcnBjIHR4cyB0byBpbml0aWFsaXplIHRoZSBzZXQgZnJvbVxuICAgKiBAcGFyYW0gdHhzIC0gZXhpc3RpbmcgdHhzIHRvIGZ1cnRoZXIgaW5pdGlhbGl6ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB0aGUgY29udmVydGVkIHR4IHNldFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocnBjVHhzOiBhbnksIHR4cz86IGFueSwgY29uZmlnPzogYW55KSB7XG4gICAgXG4gICAgLy8gYnVpbGQgc2hhcmVkIHR4IHNldFxuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhTZXQocnBjVHhzKTtcblxuICAgIC8vIGdldCBudW1iZXIgb2YgdHhzXG4gICAgbGV0IG51bVR4cyA9IHJwY1R4cy5mZWVfbGlzdCA/IHJwY1R4cy5mZWVfbGlzdC5sZW5ndGggOiBycGNUeHMudHhfaGFzaF9saXN0ID8gcnBjVHhzLnR4X2hhc2hfbGlzdC5sZW5ndGggOiAwO1xuICAgIFxuICAgIC8vIGRvbmUgaWYgcnBjIHJlc3BvbnNlIGNvbnRhaW5zIG5vIHR4c1xuICAgIGlmIChudW1UeHMgPT09IDApIHtcbiAgICAgIGFzc2VydC5lcXVhbCh0eHMsIHVuZGVmaW5lZCk7XG4gICAgICByZXR1cm4gdHhTZXQ7XG4gICAgfVxuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGlmIG5vbmUgZ2l2ZW5cbiAgICBpZiAodHhzKSB0eFNldC5zZXRUeHModHhzKTtcbiAgICBlbHNlIHtcbiAgICAgIHR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UeHM7IGkrKykgdHhzLnB1c2gobmV3IE1vbmVyb1R4V2FsbGV0KCkpO1xuICAgIH1cbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIHR4LnNldFR4U2V0KHR4U2V0KTtcbiAgICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgfVxuICAgIHR4U2V0LnNldFR4cyh0eHMpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGZyb20gcnBjIGxpc3RzXG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1R4cykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUeHNba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhfaGFzaF9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0SGFzaCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2tleV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0S2V5KHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfYmxvYl9saXN0XCIgfHwga2V5ID09PSBcInR4X3Jhd19saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0RnVsbEhleCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X21ldGFkYXRhX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRNZXRhZGF0YSh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0RmVlKEJpZ0ludCh2YWxbaV0pKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldFdlaWdodCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9saXN0XCIpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAodHhzW2ldLmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PSB1bmRlZmluZWQpIHR4c1tpXS5zZXRPdXRnb2luZ1RyYW5zZmVyKG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHhzW2ldKSk7XG4gICAgICAgICAgdHhzW2ldLmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBbW91bnQoQmlnSW50KHZhbFtpXSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibXVsdGlzaWdfdHhzZXRcIiB8fCBrZXkgPT09IFwidW5zaWduZWRfdHhzZXRcIiB8fCBrZXkgPT09IFwic2lnbmVkX3R4c2V0XCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlbnRfa2V5X2ltYWdlc19saXN0XCIpIHtcbiAgICAgICAgbGV0IGlucHV0S2V5SW1hZ2VzTGlzdCA9IHZhbDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dEtleUltYWdlc0xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR4c1tpXS5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgICB0eHNbaV0uc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgICBmb3IgKGxldCBpbnB1dEtleUltYWdlIG9mIGlucHV0S2V5SW1hZ2VzTGlzdFtpXVtcImtleV9pbWFnZXNcIl0pIHtcbiAgICAgICAgICAgIHR4c1tpXS5nZXRJbnB1dHMoKS5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKS5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UoKS5zZXRIZXgoaW5wdXRLZXlJbWFnZSkpLnNldFR4KHR4c1tpXSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNfYnlfZGVzdF9saXN0XCIpIHtcbiAgICAgICAgbGV0IGFtb3VudHNCeURlc3RMaXN0ID0gdmFsO1xuICAgICAgICBsZXQgZGVzdGluYXRpb25JZHggPSAwO1xuICAgICAgICBmb3IgKGxldCB0eElkeCA9IDA7IHR4SWR4IDwgYW1vdW50c0J5RGVzdExpc3QubGVuZ3RoOyB0eElkeCsrKSB7XG4gICAgICAgICAgbGV0IGFtb3VudHNCeURlc3QgPSBhbW91bnRzQnlEZXN0TGlzdFt0eElkeF1bXCJhbW91bnRzXCJdO1xuICAgICAgICAgIGlmICh0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PT0gdW5kZWZpbmVkKSB0eHNbdHhJZHhdLnNldE91dGdvaW5nVHJhbnNmZXIobmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eHNbdHhJZHhdKSk7XG4gICAgICAgICAgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0RGVzdGluYXRpb25zKFtdKTtcbiAgICAgICAgICBmb3IgKGxldCBhbW91bnQgb2YgYW1vdW50c0J5RGVzdCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGggPT09IDEpIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnQpKSk7IC8vIHN3ZWVwaW5nIGNhbiBjcmVhdGUgbXVsdGlwbGUgdHhzIHdpdGggb25lIGFkZHJlc3NcbiAgICAgICAgICAgIGVsc2UgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpW2Rlc3RpbmF0aW9uSWR4KytdLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudCkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHRyYW5zYWN0aW9uIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgcnBjIHR4IHdpdGggYSB0cmFuc2ZlciB0byBhIHR4IHNldCB3aXRoIGEgdHggYW5kIHRyYW5zZmVyLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4IC0gcnBjIHR4IHRvIGJ1aWxkIGZyb21cbiAgICogQHBhcmFtIHR4IC0gZXhpc3RpbmcgdHggdG8gY29udGludWUgaW5pdGlhbGl6aW5nIChvcHRpb25hbClcbiAgICogQHBhcmFtIGlzT3V0Z29pbmcgLSBzcGVjaWZpZXMgaWYgdGhlIHR4IGlzIG91dGdvaW5nIGlmIHRydWUsIGluY29taW5nIGlmIGZhbHNlLCBvciBkZWNvZGVzIGZyb20gdHlwZSBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHRoZSBpbml0aWFsaXplZCB0eCBzZXQgd2l0aCBhIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFRvVHhTZXQocnBjVHgsIHR4LCBpc091dGdvaW5nLCBjb25maWcpIHtcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4U2V0KHJwY1R4KTtcbiAgICB0eFNldC5zZXRUeHMoW01vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHgsIHR4LCBpc091dGdvaW5nLCBjb25maWcpLnNldFR4U2V0KHR4U2V0KV0pO1xuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEJ1aWxkcyBhIE1vbmVyb1R4V2FsbGV0IGZyb20gYSBSUEMgdHguXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHggLSBycGMgdHggdG8gYnVpbGQgZnJvbVxuICAgKiBAcGFyYW0gdHggLSBleGlzdGluZyB0eCB0byBjb250aW51ZSBpbml0aWFsaXppbmcgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gaXNPdXRnb2luZyAtIHNwZWNpZmllcyBpZiB0aGUgdHggaXMgb3V0Z29pbmcgaWYgdHJ1ZSwgaW5jb21pbmcgaWYgZmFsc2UsIG9yIGRlY29kZXMgZnJvbSB0eXBlIGlmIHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSBpcyB0aGUgaW5pdGlhbGl6ZWQgdHhcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4OiBhbnksIHR4PzogYW55LCBpc091dGdvaW5nPzogYW55LCBjb25maWc/OiBhbnkpIHsgIC8vIFRPRE86IGNoYW5nZSBldmVyeXRoaW5nIHRvIHNhZmUgc2V0XG4gICAgICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggdG8gcmV0dXJuXG4gICAgaWYgKCF0eCkgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHN0YXRlIGZyb20gcnBjIHR5cGVcbiAgICBpZiAocnBjVHgudHlwZSAhPT0gdW5kZWZpbmVkKSBpc091dGdvaW5nID0gTW9uZXJvV2FsbGV0UnBjLmRlY29kZVJwY1R5cGUocnBjVHgudHlwZSwgdHgpO1xuICAgIGVsc2UgYXNzZXJ0LmVxdWFsKHR5cGVvZiBpc091dGdvaW5nLCBcImJvb2xlYW5cIiwgXCJNdXN0IGluZGljYXRlIGlmIHR4IGlzIG91dGdvaW5nICh0cnVlKSB4b3IgaW5jb21pbmcgKGZhbHNlKSBzaW5jZSB1bmtub3duXCIpO1xuICAgIFxuICAgIC8vIFRPRE86IHNhZmUgc2V0XG4gICAgLy8gaW5pdGlhbGl6ZSByZW1haW5pbmcgZmllbGRzICBUT0RPOiBzZWVtcyB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGNvbW1vbiBmdW5jdGlvbiB3aXRoIERhZW1vblJwYy5jb252ZXJ0UnBjVHhcbiAgICBsZXQgaGVhZGVyO1xuICAgIGxldCB0cmFuc2ZlcjtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVHgpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVHhba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhpZFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlXCIpIHR4LnNldEZlZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm90ZVwiKSB7IGlmICh2YWwpIHR4LnNldE5vdGUodmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2tleVwiKSB0eC5zZXRLZXkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eXBlXCIpIHsgfSAvLyB0eXBlIGFscmVhZHkgaGFuZGxlZFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X3NpemVcIikgdHguc2V0U2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja190aW1lXCIpIHR4LnNldFVubG9ja1RpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRcIikgdHguc2V0V2VpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9ja2VkXCIpIHR4LnNldElzTG9ja2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfYmxvYlwiKSB0eC5zZXRGdWxsSGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfbWV0YWRhdGFcIikgdHguc2V0TWV0YWRhdGEodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkb3VibGVfc3BlbmRfc2VlblwiKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2Vlbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiIHx8IGtleSA9PT0gXCJoZWlnaHRcIikge1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgICBoZWFkZXIuc2V0SGVpZ2h0KHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0aW1lc3RhbXBcIikge1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgICBoZWFkZXIuc2V0VGltZXN0YW1wKHZhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gdGltZXN0YW1wIG9mIHVuY29uZmlybWVkIHR4IGlzIGN1cnJlbnQgcmVxdWVzdCB0aW1lXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjb25maXJtYXRpb25zXCIpIHR4LnNldE51bUNvbmZpcm1hdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWdnZXN0ZWRfY29uZmlybWF0aW9uc190aHJlc2hvbGRcIikge1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIGlmICghaXNPdXRnb2luZykgdHJhbnNmZXIuc2V0TnVtU3VnZ2VzdGVkQ29uZmlybWF0aW9ucyh2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudFwiKSB7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzXCIpIHt9ICAvLyBpZ25vcmluZywgYW1vdW50cyBzdW0gdG8gYW1vdW50XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSB7XG4gICAgICAgIGlmICghaXNPdXRnb2luZykge1xuICAgICAgICAgIGlmICghdHJhbnNmZXIpIHRyYW5zZmVyID0gbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKS5zZXRUeCh0eCk7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGF5bWVudF9pZFwiKSB7XG4gICAgICAgIGlmIChcIlwiICE9PSB2YWwgJiYgTW9uZXJvVHhXYWxsZXQuREVGQVVMVF9QQVlNRU5UX0lEICE9PSB2YWwpIHR4LnNldFBheW1lbnRJZCh2YWwpOyAgLy8gZGVmYXVsdCBpcyB1bmRlZmluZWRcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGV4XCIpIGFzc2VydChycGNUeC5zdWJhZGRyX2luZGljZXMpOyAgLy8gaGFuZGxlZCBieSBzdWJhZGRyX2luZGljZXNcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGljZXNcIikge1xuICAgICAgICBpZiAoIXRyYW5zZmVyKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgbGV0IHJwY0luZGljZXMgPSB2YWw7XG4gICAgICAgIHRyYW5zZmVyLnNldEFjY291bnRJbmRleChycGNJbmRpY2VzWzBdLm1ham9yKTtcbiAgICAgICAgaWYgKGlzT3V0Z29pbmcpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgICBmb3IgKGxldCBycGNJbmRleCBvZiBycGNJbmRpY2VzKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKHJwY0luZGV4Lm1pbm9yKTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kaWNlcyhzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsKHJwY0luZGljZXMubGVuZ3RoLCAxKTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kZXgocnBjSW5kaWNlc1swXS5taW5vcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkZXN0aW5hdGlvbnNcIiB8fCBrZXkgPT0gXCJyZWNpcGllbnRzXCIpIHtcbiAgICAgICAgYXNzZXJ0KGlzT3V0Z29pbmcpO1xuICAgICAgICBsZXQgZGVzdGluYXRpb25zID0gW107XG4gICAgICAgIGZvciAobGV0IHJwY0Rlc3RpbmF0aW9uIG9mIHZhbCkge1xuICAgICAgICAgIGxldCBkZXN0aW5hdGlvbiA9IG5ldyBNb25lcm9EZXN0aW5hdGlvbigpO1xuICAgICAgICAgIGRlc3RpbmF0aW9ucy5wdXNoKGRlc3RpbmF0aW9uKTtcbiAgICAgICAgICBmb3IgKGxldCBkZXN0aW5hdGlvbktleSBvZiBPYmplY3Qua2V5cyhycGNEZXN0aW5hdGlvbikpIHtcbiAgICAgICAgICAgIGlmIChkZXN0aW5hdGlvbktleSA9PT0gXCJhZGRyZXNzXCIpIGRlc3RpbmF0aW9uLnNldEFkZHJlc3MocnBjRGVzdGluYXRpb25bZGVzdGluYXRpb25LZXldKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKGRlc3RpbmF0aW9uS2V5ID09PSBcImFtb3VudFwiKSBkZXN0aW5hdGlvbi5zZXRBbW91bnQoQmlnSW50KHJwY0Rlc3RpbmF0aW9uW2Rlc3RpbmF0aW9uS2V5XSkpO1xuICAgICAgICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNhY3Rpb24gZGVzdGluYXRpb24gZmllbGQ6IFwiICsgZGVzdGluYXRpb25LZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2Zlcih7dHg6IHR4fSk7XG4gICAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhkZXN0aW5hdGlvbnMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNvdXJjZXNcIikge1xuICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR4LmdldElucHV0cygpID09PSB1bmRlZmluZWQpO1xuICAgICAgICB0eC5zZXRJbnB1dHMoW10pO1xuICAgICAgICBmb3IgKGxldCBycGNTb3VyY2Ugb2YgdmFsKSB7XG4gICAgICAgICAgbGV0IGlucHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCgpLnNldFR4KHR4KTtcbiAgICAgICAgICBpbnB1dC5zZXRBbW91bnQoQmlnSW50KHJwY1NvdXJjZS5hbW91bnQpKTtcbiAgICAgICAgICBpbnB1dC5zZXRJbmRleChycGNTb3VyY2UuZ2xvYmFsX2luZGV4KTtcbiAgICAgICAgICBpZiAocnBjU291cmNlLnB1YmtleSAhPT0gdW5kZWZpbmVkKSBpbnB1dC5zZXRTdGVhbHRoUHVibGljS2V5KHJwY1NvdXJjZS5wdWJrZXkuc3Vic3RyaW5nKDAsIDY0KSk7IC8vIGRlc3Qga2V5IG9mIGRlc3R8fG1hc2tcbiAgICAgICAgICB0eC5nZXRJbnB1dHMoKS5wdXNoKGlucHV0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm11bHRpc2lnX3R4c2V0XCIgJiYgdmFsICE9PSB1bmRlZmluZWQpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlOyB0aGlzIG1ldGhvZCBvbmx5IGJ1aWxkcyBhIHR4IHdhbGxldFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVuc2lnbmVkX3R4c2V0XCIgJiYgdmFsICE9PSB1bmRlZmluZWQpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlOyB0aGlzIG1ldGhvZCBvbmx5IGJ1aWxkcyBhIHR4IHdhbGxldFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9pblwiKSB0eC5zZXRJbnB1dFN1bShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50X291dFwiKSB0eC5zZXRPdXRwdXRTdW0oQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNoYW5nZV9hZGRyZXNzXCIpIHR4LnNldENoYW5nZUFkZHJlc3ModmFsID09PSBcIlwiID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjaGFuZ2VfYW1vdW50XCIpIHR4LnNldENoYW5nZUFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZHVtbXlfb3V0cHV0c1wiKSB0eC5zZXROdW1EdW1teU91dHB1dHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJleHRyYVwiKSB0eC5zZXRFeHRyYUhleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJpbmdfc2l6ZVwiKSB0eC5zZXRSaW5nU2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50X2tleV9pbWFnZXNcIikge1xuICAgICAgICBsZXQgaW5wdXRLZXlJbWFnZXMgPSB2YWwua2V5X2ltYWdlcztcbiAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZSh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdHguc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgZm9yIChsZXQgaW5wdXRLZXlJbWFnZSBvZiBpbnB1dEtleUltYWdlcykge1xuICAgICAgICAgIHR4LmdldElucHV0cygpLnB1c2gobmV3IE1vbmVyb091dHB1dFdhbGxldCgpLnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSgpLnNldEhleChpbnB1dEtleUltYWdlKSkuc2V0VHgodHgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNfYnlfZGVzdFwiKSB7XG4gICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUoaXNPdXRnb2luZyk7XG4gICAgICAgIGxldCBhbW91bnRzQnlEZXN0ID0gdmFsLmFtb3VudHM7XG4gICAgICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoLCBhbW91bnRzQnlEZXN0Lmxlbmd0aCk7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHgpO1xuICAgICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoW10pO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHRyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVtpXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnRzQnlEZXN0W2ldKSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZCB3aXRoIHRyYW5zZmVyOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGxpbmsgYmxvY2sgYW5kIHR4XG4gICAgaWYgKGhlYWRlcikgdHguc2V0QmxvY2sobmV3IE1vbmVyb0Jsb2NrKGhlYWRlcikuc2V0VHhzKFt0eF0pKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIGZpbmFsIGZpZWxkc1xuICAgIGlmICh0cmFuc2Zlcikge1xuICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgaWYgKCF0cmFuc2Zlci5nZXRUeCgpLmdldElzQ29uZmlybWVkKCkpIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICBpZiAoaXNPdXRnb2luZykge1xuICAgICAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgICAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpKSB7XG4gICAgICAgICAgaWYgKHRyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpKSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0RGVzdGluYXRpb25zKHVuZGVmaW5lZCk7IC8vIG92ZXJ3cml0ZSB0byBhdm9pZCByZWNvbmNpbGUgZXJyb3IgVE9ETzogcmVtb3ZlIGFmdGVyID4xOC4zLjEgd2hlbiBhbW91bnRzX2J5X2Rlc3Qgc3VwcG9ydGVkXG4gICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLm1lcmdlKHRyYW5zZmVyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHguc2V0SXNJbmNvbWluZyh0cnVlKTtcbiAgICAgICAgdHguc2V0SW5jb21pbmdUcmFuc2ZlcnMoW3RyYW5zZmVyXSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHJldHVybiBpbml0aWFsaXplZCB0cmFuc2FjdGlvblxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhXaXRoT3V0cHV0KHJwY091dHB1dCkge1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhcbiAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIG91dHB1dFxuICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KHt0eDogdHh9KTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjT3V0cHV0KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY091dHB1dFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhbW91bnRcIikgb3V0cHV0LnNldEFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlbnRcIikgb3V0cHV0LnNldElzU3BlbnQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJrZXlfaW1hZ2VcIikgeyBpZiAoXCJcIiAhPT0gdmFsKSBvdXRwdXQuc2V0S2V5SW1hZ2UobmV3IE1vbmVyb0tleUltYWdlKHZhbCkpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZ2xvYmFsX2luZGV4XCIpIG91dHB1dC5zZXRJbmRleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2hhc2hcIikgdHguc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja2VkXCIpIHR4LnNldElzTG9ja2VkKCF2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZyb3plblwiKSBvdXRwdXQuc2V0SXNGcm96ZW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwdWJrZXlcIikgb3V0cHV0LnNldFN0ZWFsdGhQdWJsaWNLZXkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGV4XCIpIHtcbiAgICAgICAgb3V0cHV0LnNldEFjY291bnRJbmRleCh2YWwubWFqb3IpO1xuICAgICAgICBvdXRwdXQuc2V0U3ViYWRkcmVzc0luZGV4KHZhbC5taW5vcik7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfaGVpZ2h0XCIpIHR4LnNldEJsb2NrKChuZXcgTW9uZXJvQmxvY2soKS5zZXRIZWlnaHQodmFsKSBhcyBNb25lcm9CbG9jaykuc2V0VHhzKFt0eCBhcyBNb25lcm9UeF0pKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHRyYW5zYWN0aW9uIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggd2l0aCBvdXRwdXRcbiAgICB0eC5zZXRPdXRwdXRzKFtvdXRwdXRdKTtcbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Rlc2NyaWJlVHJhbnNmZXIocnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdCkge1xuICAgIGxldCB0eFNldCA9IG5ldyBNb25lcm9UeFNldCgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZGVzY1wiKSB7XG4gICAgICAgIHR4U2V0LnNldFR4cyhbXSk7XG4gICAgICAgIGZvciAobGV0IHR4TWFwIG9mIHZhbCkge1xuICAgICAgICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIodHhNYXAsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgICAgICAgdHguc2V0VHhTZXQodHhTZXQpO1xuICAgICAgICAgIHR4U2V0LmdldFR4cygpLnB1c2godHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3VtbWFyeVwiKSB7IH0gLy8gVE9ETzogc3VwcG9ydCB0eCBzZXQgc3VtbWFyeSBmaWVsZHM/XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBkZXNjZHJpYmUgdHJhbnNmZXIgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogRGVjb2RlcyBhIFwidHlwZVwiIGZyb20gbW9uZXJvLXdhbGxldC1ycGMgdG8gaW5pdGlhbGl6ZSB0eXBlIGFuZCBzdGF0ZVxuICAgKiBmaWVsZHMgaW4gdGhlIGdpdmVuIHRyYW5zYWN0aW9uLlxuICAgKiBcbiAgICogVE9ETzogdGhlc2Ugc2hvdWxkIGJlIHNhZmUgc2V0XG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHlwZSBpcyB0aGUgdHlwZSB0byBkZWNvZGVcbiAgICogQHBhcmFtIHR4IGlzIHRoZSB0cmFuc2FjdGlvbiB0byBkZWNvZGUga25vd24gZmllbGRzIHRvXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIHJwYyB0eXBlIGluZGljYXRlcyBvdXRnb2luZyB4b3IgaW5jb21pbmdcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZGVjb2RlUnBjVHlwZShycGNUeXBlLCB0eCkge1xuICAgIGxldCBpc091dGdvaW5nO1xuICAgIGlmIChycGNUeXBlID09PSBcImluXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSBmYWxzZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJvdXRcIikge1xuICAgICAgaXNPdXRnb2luZyA9IHRydWU7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwicG9vbFwiKSB7XG4gICAgICBpc091dGdvaW5nID0gZmFsc2U7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTsgIC8vIFRPRE86IGJ1dCBjb3VsZCBpdCBiZT9cbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwicGVuZGluZ1wiKSB7XG4gICAgICBpc091dGdvaW5nID0gdHJ1ZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKHRydWUpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJibG9ja1wiKSB7XG4gICAgICBpc091dGdvaW5nID0gZmFsc2U7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KHRydWUpO1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJmYWlsZWRcIikge1xuICAgICAgaXNPdXRnb2luZyA9IHRydWU7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQoZmFsc2UpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZCh0cnVlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlVucmVjb2duaXplZCB0cmFuc2ZlciB0eXBlOiBcIiArIHJwY1R5cGUpO1xuICAgIH1cbiAgICByZXR1cm4gaXNPdXRnb2luZztcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1lcmdlcyBhIHRyYW5zYWN0aW9uIGludG8gYSB1bmlxdWUgc2V0IG9mIHRyYW5zYWN0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHtNb25lcm9UeFdhbGxldH0gdHggLSB0aGUgdHJhbnNhY3Rpb24gdG8gbWVyZ2UgaW50byB0aGUgZXhpc3RpbmcgdHhzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB0eE1hcCAtIG1hcHMgdHggaGFzaGVzIHRvIHR4c1xuICAgKiBAcGFyYW0ge09iamVjdH0gYmxvY2tNYXAgLSBtYXBzIGJsb2NrIGhlaWdodHMgdG8gYmxvY2tzXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIG1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCkge1xuICAgIGFzc2VydCh0eC5nZXRIYXNoKCkgIT09IHVuZGVmaW5lZCk7XG4gICAgXG4gICAgLy8gbWVyZ2UgdHhcbiAgICBsZXQgYVR4ID0gdHhNYXBbdHguZ2V0SGFzaCgpXTtcbiAgICBpZiAoYVR4ID09PSB1bmRlZmluZWQpIHR4TWFwW3R4LmdldEhhc2goKV0gPSB0eDsgLy8gY2FjaGUgbmV3IHR4XG4gICAgZWxzZSBhVHgubWVyZ2UodHgpOyAvLyBtZXJnZSB3aXRoIGV4aXN0aW5nIHR4XG4gICAgXG4gICAgLy8gbWVyZ2UgdHgncyBibG9jayBpZiBjb25maXJtZWRcbiAgICBpZiAodHguZ2V0SGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IGFCbG9jayA9IGJsb2NrTWFwW3R4LmdldEhlaWdodCgpXTtcbiAgICAgIGlmIChhQmxvY2sgPT09IHVuZGVmaW5lZCkgYmxvY2tNYXBbdHguZ2V0SGVpZ2h0KCldID0gdHguZ2V0QmxvY2soKTsgLy8gY2FjaGUgbmV3IGJsb2NrXG4gICAgICBlbHNlIGFCbG9jay5tZXJnZSh0eC5nZXRCbG9jaygpKTsgLy8gbWVyZ2Ugd2l0aCBleGlzdGluZyBibG9ja1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byB0cmFuc2FjdGlvbnMgYnkgdGhlaXIgaGVpZ2h0LlxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb21wYXJlVHhzQnlIZWlnaHQodHgxLCB0eDIpIHtcbiAgICBpZiAodHgxLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQgJiYgdHgyLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHJldHVybiAwOyAvLyBib3RoIHVuY29uZmlybWVkXG4gICAgZWxzZSBpZiAodHgxLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHJldHVybiAxOyAgIC8vIHR4MSBpcyB1bmNvbmZpcm1lZFxuICAgIGVsc2UgaWYgKHR4Mi5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gLTE7ICAvLyB0eDIgaXMgdW5jb25maXJtZWRcbiAgICBsZXQgZGlmZiA9IHR4MS5nZXRIZWlnaHQoKSAtIHR4Mi5nZXRIZWlnaHQoKTtcbiAgICBpZiAoZGlmZiAhPT0gMCkgcmV0dXJuIGRpZmY7XG4gICAgcmV0dXJuIHR4MS5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgxKSAtIHR4Mi5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgyKTsgLy8gdHhzIGFyZSBpbiB0aGUgc2FtZSBibG9jayBzbyByZXRhaW4gdGhlaXIgb3JpZ2luYWwgb3JkZXJcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byB0cmFuc2ZlcnMgYnkgYXNjZW5kaW5nIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcy5cbiAgICovXG4gIHN0YXRpYyBjb21wYXJlSW5jb21pbmdUcmFuc2ZlcnModDEsIHQyKSB7XG4gICAgaWYgKHQxLmdldEFjY291bnRJbmRleCgpIDwgdDIuZ2V0QWNjb3VudEluZGV4KCkpIHJldHVybiAtMTtcbiAgICBlbHNlIGlmICh0MS5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdDIuZ2V0QWNjb3VudEluZGV4KCkpIHJldHVybiB0MS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAtIHQyLmdldFN1YmFkZHJlc3NJbmRleCgpO1xuICAgIHJldHVybiAxO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29tcGFyZXMgdHdvIG91dHB1dHMgYnkgYXNjZW5kaW5nIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcy5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29tcGFyZU91dHB1dHMobzEsIG8yKSB7XG4gICAgXG4gICAgLy8gY29tcGFyZSBieSBoZWlnaHRcbiAgICBsZXQgaGVpZ2h0Q29tcGFyaXNvbiA9IE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQobzEuZ2V0VHgoKSwgbzIuZ2V0VHgoKSk7XG4gICAgaWYgKGhlaWdodENvbXBhcmlzb24gIT09IDApIHJldHVybiBoZWlnaHRDb21wYXJpc29uO1xuICAgIFxuICAgIC8vIGNvbXBhcmUgYnkgYWNjb3VudCBpbmRleCwgc3ViYWRkcmVzcyBpbmRleCwgb3V0cHV0IGluZGV4LCB0aGVuIGtleSBpbWFnZSBoZXhcbiAgICBsZXQgY29tcGFyZSA9IG8xLmdldEFjY291bnRJbmRleCgpIC0gbzIuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgaWYgKGNvbXBhcmUgIT09IDApIHJldHVybiBjb21wYXJlO1xuICAgIGNvbXBhcmUgPSBvMS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAtIG8yLmdldFN1YmFkZHJlc3NJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICBjb21wYXJlID0gbzEuZ2V0SW5kZXgoKSAtIG8yLmdldEluZGV4KCk7XG4gICAgaWYgKGNvbXBhcmUgIT09IDApIHJldHVybiBjb21wYXJlO1xuICAgIHJldHVybiBvMS5nZXRLZXlJbWFnZSgpLmdldEhleCgpLmxvY2FsZUNvbXBhcmUobzIuZ2V0S2V5SW1hZ2UoKS5nZXRIZXgoKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBQb2xscyBtb25lcm8td2FsbGV0LXJwYyB0byBwcm92aWRlIGxpc3RlbmVyIG5vdGlmaWNhdGlvbnMuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIFdhbGxldFBvbGxlciB7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIGlzUG9sbGluZzogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIHdhbGxldDogTW9uZXJvV2FsbGV0UnBjO1xuICBwcm90ZWN0ZWQgbG9vcGVyOiBUYXNrTG9vcGVyO1xuICBwcm90ZWN0ZWQgcHJldkxvY2tlZFR4czogYW55O1xuICBwcm90ZWN0ZWQgcHJldkxvY2tlZFR4c01pbkhlaWdodCA9IDA7XG4gIHByb3RlY3RlZCBwcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zOiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2Q29uZmlybWVkTm90aWZpY2F0aW9uczogYW55O1xuICBwcm90ZWN0ZWQgdGhyZWFkUG9vbDogYW55O1xuICBwcm90ZWN0ZWQgbnVtUG9sbGluZzogYW55O1xuICBwcm90ZWN0ZWQgcHJldkhlaWdodDogYW55O1xuICBwcm90ZWN0ZWQgcHJldkJhbGFuY2VzOiBhbnk7XG4gIHByb3RlY3RlZCBnZW5lcmF0aW9uID0gMDtcbiAgcHJvdGVjdGVkIHNuYXBzaG90R2VuZXJhdGlvbiA9IDA7XG4gIFxuICBjb25zdHJ1Y3Rvcih3YWxsZXQpIHtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgdGhpcy53YWxsZXQgPSB3YWxsZXQ7XG4gICAgdGhpcy5sb29wZXIgPSBuZXcgVGFza0xvb3Blcihhc3luYyBmdW5jdGlvbigpIHsgYXdhaXQgdGhhdC5wb2xsKCk7IH0pO1xuICAgIHRoaXMucHJldkxvY2tlZFR4cyA9IFtdO1xuICAgIHRoaXMucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucyA9IG5ldyBTZXQoKTsgLy8gdHggaGFzaGVzIG9mIHByZXZpb3VzIG5vdGlmaWNhdGlvbnNcbiAgICB0aGlzLnByZXZDb25maXJtZWROb3RpZmljYXRpb25zID0gbmV3IFNldCgpOyAvLyB0eCBoYXNoZXMgb2YgcHJldmlvdXNseSBjb25maXJtZWQgYnV0IG5vdCB5ZXQgdW5sb2NrZWQgbm90aWZpY2F0aW9uc1xuICAgIHRoaXMudGhyZWFkUG9vbCA9IG5ldyBUaHJlYWRQb29sKDEpOyAvLyBzeW5jaHJvbml6ZSBwb2xsc1xuICAgIHRoaXMubnVtUG9sbGluZyA9IDA7XG4gIH1cbiAgXG4gIHJlc2V0KCkge1xuICAgIHRoaXMuZ2VuZXJhdGlvbisrOyAvLyBpbnZhbGlkYXRlIGluLWZsaWdodCBwb2xscyB3aXRob3V0IHdhaXRpbmcgb24gdGhlaXIgY2FsbGJhY2tzXG4gIH1cblxuICBzZXRJc1BvbGxpbmcoaXNQb2xsaW5nKSB7XG4gICAgdGhpcy5pc1BvbGxpbmcgPSBpc1BvbGxpbmc7XG4gICAgaWYgKGlzUG9sbGluZykgdGhpcy5sb29wZXIuc3RhcnQodGhpcy53YWxsZXQuZ2V0U3luY1BlcmlvZEluTXMoKSk7XG4gICAgZWxzZSB0aGlzLmxvb3Blci5zdG9wKCk7XG4gIH1cbiAgXG4gIHNldFBlcmlvZEluTXMocGVyaW9kSW5Ncykge1xuICAgIHRoaXMubG9vcGVyLnNldFBlcmlvZEluTXMocGVyaW9kSW5Ncyk7XG4gIH1cbiAgXG4gIGFzeW5jIHBvbGwoKSB7XG5cbiAgICAvLyBza2lwIGlmIG5leHQgcG9sbCBpcyBxdWV1ZWRcbiAgICBpZiAodGhpcy5udW1Qb2xsaW5nID4gMSkgcmV0dXJuO1xuICAgIHRoaXMubnVtUG9sbGluZysrO1xuICAgIFxuICAgIC8vIHN5bmNocm9uaXplIHBvbGxzXG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIHJldHVybiB0aGlzLnRocmVhZFBvb2wuc3VibWl0KGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgZ2VuZXJhdGlvbiA9IHRoYXQuZ2VuZXJhdGlvbjtcbiAgICAgIHRyeSB7XG4gICAgICAgIFxuICAgICAgICAvLyBza2lwIGlmIHdhbGxldCBpcyBjbG9zZWRcbiAgICAgICAgaWYgKGF3YWl0IHRoYXQud2FsbGV0LmlzQ2xvc2VkKCkgfHwgZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgLy8gcmVzZXQgc25hcHNob3RzIG9ubHkgaW5zaWRlIHRoZSBzZXJpYWxpemVkIHBvbGxcbiAgICAgICAgaWYgKHRoYXQuc25hcHNob3RHZW5lcmF0aW9uICE9PSBnZW5lcmF0aW9uKSB7XG4gICAgICAgICAgdGhhdC5wcmV2SGVpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHRoYXQucHJldkJhbGFuY2VzID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IFtdO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4c01pbkhlaWdodCA9IDA7XG4gICAgICAgICAgdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zLmNsZWFyKCk7XG4gICAgICAgICAgdGhhdC5wcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucy5jbGVhcigpO1xuICAgICAgICAgIHRoYXQuc25hcHNob3RHZW5lcmF0aW9uID0gZ2VuZXJhdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gdGFrZSBpbml0aWFsIHNuYXBzaG90XG4gICAgICAgIGlmICh0aGF0LnByZXZCYWxhbmNlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhhdC5wcmV2SGVpZ2h0ID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0SGVpZ2h0KCk7XG4gICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpKTtcbiAgICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgICAgdGhhdC5wcmV2QmFsYW5jZXMgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRCYWxhbmNlcygpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgaGVpZ2h0IGNoYW5nZXNcbiAgICAgICAgbGV0IGhlaWdodCA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEhlaWdodCgpO1xuICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgIGlmICh0aGF0LnByZXZIZWlnaHQgIT09IGhlaWdodCkge1xuICAgICAgICAgIGZvciAobGV0IGkgPSB0aGF0LnByZXZIZWlnaHQ7IGkgPCBoZWlnaHQ7IGkrKykge1xuICAgICAgICAgICAgYXdhaXQgdGhhdC5vbk5ld0Jsb2NrKGkpO1xuICAgICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGF0LnByZXZIZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGdldCBsb2NrZWQgdHhzIGZvciBjb21wYXJpc29uIHRvIHByZXZpb3VzXG4gICAgICAgIGxldCBtaW5IZWlnaHQgPSBNYXRoLm1heCgwLCBoZWlnaHQgLSA3MCk7IC8vIG9ubHkgbW9uaXRvciByZWNlbnQgdHhzXG4gICAgICAgIGxldCBsb2NrZWRUeHMgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRUeHMobmV3IE1vbmVyb1R4UXVlcnkoKS5zZXRJc0xvY2tlZCh0cnVlKS5zZXRNaW5IZWlnaHQobWluSGVpZ2h0KS5zZXRJbmNsdWRlT3V0cHV0cyh0cnVlKSk7XG4gICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGF0LmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbGxlY3QgaGFzaGVzIG9mIHR4cyBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCBub0xvbmdlckxvY2tlZEhhc2hlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBwcmV2TG9ja2VkVHggb2YgdGhhdC5wcmV2TG9ja2VkVHhzKSB7XG4gICAgICAgICAgaWYgKHRoYXQuZ2V0VHgobG9ja2VkVHhzLCBwcmV2TG9ja2VkVHguZ2V0SGFzaCgpKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBub0xvbmdlckxvY2tlZEhhc2hlcy5wdXNoKHByZXZMb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gc2F2ZSBsb2NrZWQgdHhzIGZvciBuZXh0IGNvbXBhcmlzb25cbiAgICAgICAgbGV0IHByZXZNaW5IZWlnaHQgPSB0aGF0LnByZXZMb2NrZWRUeHNNaW5IZWlnaHQ7XG4gICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGxvY2tlZFR4cztcbiAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzTWluSGVpZ2h0ID0gbWluSGVpZ2h0O1xuICAgICAgICBcbiAgICAgICAgLy8gdXNlIHRoZSBwcmV2aW91cyBzbmFwc2hvdCdzIGJvdW5kIHNvIHRyYWNrZWQgdHhzIGRvIG5vdCBhZ2Ugb3V0IGJldHdlZW4gcG9sbHNcbiAgICAgICAgbGV0IHVubG9ja2VkVHhzID0gbm9Mb25nZXJMb2NrZWRIYXNoZXMubGVuZ3RoID09PSAwID8gW10gOiBhd2FpdCB0aGF0LndhbGxldC5nZXRUeHMobmV3IE1vbmVyb1R4UXVlcnkoKS5zZXRJc0xvY2tlZChmYWxzZSkuc2V0TWluSGVpZ2h0KHByZXZNaW5IZWlnaHQpLnNldEhhc2hlcyhub0xvbmdlckxvY2tlZEhhc2hlcykuc2V0SW5jbHVkZU91dHB1dHModHJ1ZSkpO1xuICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgbmV3IHVuY29uZmlybWVkIGFuZCBjb25maXJtZWQgb3V0cHV0c1xuICAgICAgICBmb3IgKGxldCBsb2NrZWRUeCBvZiBsb2NrZWRUeHMpIHtcbiAgICAgICAgICBsZXQgc2VhcmNoU2V0ID0gbG9ja2VkVHguZ2V0SXNDb25maXJtZWQoKSA/IHRoYXQucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMgOiB0aGF0LnByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnM7XG4gICAgICAgICAgbGV0IHVuYW5ub3VuY2VkID0gIXNlYXJjaFNldC5oYXMobG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICBzZWFyY2hTZXQuYWRkKGxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgaWYgKHVuYW5ub3VuY2VkKSBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHMobG9ja2VkVHgsIGdlbmVyYXRpb24pO1xuICAgICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGF0LmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgbmV3IHVubG9ja2VkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgdW5sb2NrZWRUeCBvZiB1bmxvY2tlZFR4cykge1xuICAgICAgICAgIGxldCBtaXNzZWRDb25maXJtID0gdW5sb2NrZWRUeC5nZXRJc0NvbmZpcm1lZCgpICYmICF0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zLmhhcyh1bmxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zLmRlbGV0ZSh1bmxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgdGhhdC5wcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucy5kZWxldGUodW5sb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIGlmIChtaXNzZWRDb25maXJtKSB7IC8vIGFubm91bmNlIG1pc3NlZCBjb25maXJtIHRyYW5zaXRpb24gaWYgdHggdW5sb2NrZWQgYmV0d2VlbiBwb2xsc1xuICAgICAgICAgICAgbGV0IGNvbmZpcm1lZFR4ID0gdW5sb2NrZWRUeC5jb3B5KCkuc2V0SXNMb2NrZWQodHJ1ZSk7XG4gICAgICAgICAgICBjb25maXJtZWRUeC5zZXRCbG9jayh1bmxvY2tlZFR4LmdldEJsb2NrKCkuY29weSgpLnNldFR4cyhbY29uZmlybWVkVHhdKSk7XG4gICAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHMoY29uZmlybWVkVHgsIGdlbmVyYXRpb24pO1xuICAgICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHModW5sb2NrZWRUeCwgZ2VuZXJhdGlvbik7XG4gICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBiYWxhbmNlIGNoYW5nZXNcbiAgICAgICAgYXdhaXQgdGhhdC5jaGVja0ZvckNoYW5nZWRCYWxhbmNlcyhnZW5lcmF0aW9uKTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIGlmIChnZW5lcmF0aW9uID09PSB0aGF0LmdlbmVyYXRpb24gJiYgdGhhdC5pc1BvbGxpbmcpIHsgLy8gaWdub3JlIGVycm9ycyBmcm9tIHBvbGxzIHN0cmFnZ2xpbmcgYWZ0ZXIgdGhlIHdhbGxldCBpcyBjbG9zZWRcbiAgICAgICAgICBsZXQgbGFiZWwgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRQYXRoKCkgfHwgdGhhdC53YWxsZXQuZ2V0UnBjQ29ubmVjdGlvbigpPy5nZXRVcmkoKTsgLy8gdGhlIHBhdGggaXMgdW5rbm93biB3aGVuIGNvbm5lY3RlZCB0byBhbiBhbHJlYWR5IGxvYWRlZCB3YWxsZXRcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGJhY2tncm91bmQgcG9sbCB3YWxsZXQgJ1wiICsgbGFiZWwgKyBcIic6IFwiICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICB0aGF0Lm51bVBvbGxpbmctLTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VOZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgbm90aWZ5T3V0cHV0cyh0eCwgZ2VuZXJhdGlvbikge1xuICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLmdlbmVyYXRpb24pIHJldHVybjtcbiAgXG4gICAgLy8gbm90aWZ5IHNwZW50IG91dHB1dHMgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBhbGxvdyBzY3JhcGUgb2YgdHggaW5wdXRzIHNvIHByb3ZpZGluZyBvbmUgaW5wdXQgd2l0aCBvdXRnb2luZyBhbW91bnRcbiAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydCh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KClcbiAgICAgICAgICAuc2V0QW1vdW50KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBbW91bnQoKSArIHR4LmdldEZlZSgpKVxuICAgICAgICAgIC5zZXRBY2NvdW50SW5kZXgodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFjY291bnRJbmRleCgpKVxuICAgICAgICAgIC5zZXRTdWJhZGRyZXNzSW5kZXgodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAxID8gdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldFN1YmFkZHJlc3NJbmRpY2VzKClbMF0gOiB1bmRlZmluZWQpIC8vIGluaXRpYWxpemUgaWYgdHJhbnNmZXIgc291cmNlZCBmcm9tIHNpbmdsZSBzdWJhZGRyZXNzXG4gICAgICAgICAgLnNldFR4KHR4KTtcbiAgICAgIHR4LnNldElucHV0cyhbb3V0cHV0XSk7XG4gICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFNwZW50KG91dHB1dCk7XG4gICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSByZWNlaXZlZCBvdXRwdXRzXG4gICAgaWYgKHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR4LmdldE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldE91dHB1dHMoKS5sZW5ndGggPiAwKSB7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogb3V0cHV0cyBvbmx5IHJldHVybmVkIGZvciBjb25maXJtZWQgdHhzXG4gICAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5nZXRPdXRwdXRzKCkpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFJlY2VpdmVkKG91dHB1dCk7XG4gICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgeyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGFsbG93IHNjcmFwZSBvZiB1bmNvbmZpcm1lZCByZWNlaXZlZCBvdXRwdXRzIHNvIHVzaW5nIGluY29taW5nIHRyYW5zZmVyIHZhbHVlc1xuICAgICAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB7XG4gICAgICAgICAgb3V0cHV0cy5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKVxuICAgICAgICAgICAgICAuc2V0QWNjb3VudEluZGV4KHRyYW5zZmVyLmdldEFjY291bnRJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0U3ViYWRkcmVzc0luZGV4KHRyYW5zZmVyLmdldFN1YmFkZHJlc3NJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0QW1vdW50KHRyYW5zZmVyLmdldEFtb3VudCgpKVxuICAgICAgICAgICAgICAuc2V0VHgodHgpKTtcbiAgICAgICAgfVxuICAgICAgICB0eC5zZXRPdXRwdXRzKG91dHB1dHMpO1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIGdldFR4KHR4cywgdHhIYXNoKSB7XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSBpZiAodHhIYXNoID09PSB0eC5nZXRIYXNoKCkpIHJldHVybiB0eDtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY2hlY2tGb3JDaGFuZ2VkQmFsYW5jZXMoZ2VuZXJhdGlvbikge1xuICAgIGxldCBiYWxhbmNlcyA9IGF3YWl0IHRoaXMud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMuZ2VuZXJhdGlvbikgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChiYWxhbmNlc1swXSAhPT0gdGhpcy5wcmV2QmFsYW5jZXNbMF0gfHwgYmFsYW5jZXNbMV0gIT09IHRoaXMucHJldkJhbGFuY2VzWzFdKSB7XG4gICAgICB0aGlzLnByZXZCYWxhbmNlcyA9IGJhbGFuY2VzO1xuICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQoYmFsYW5jZXNbMF0sIGJhbGFuY2VzWzFdKTtcbiAg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