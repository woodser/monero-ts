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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiTW9uZXJvV2FsbGV0UnBjIiwiTW9uZXJvV2FsbGV0IiwiREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwiYWRkcmVzc0NhY2hlIiwic3luY1BlcmlvZEluTXMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRTZXJ2ZXIiLCJvcGVuV2FsbGV0IiwicGF0aE9yQ29uZmlnIiwicGFzc3dvcmQiLCJNb25lcm9XYWxsZXRDb25maWciLCJwYXRoIiwiZ2V0UGF0aCIsImdldFJlZ3Rlc3QiLCJzZW5kSnNvblJlcXVlc3QiLCJmaWxlbmFtZSIsImdldFBhc3N3b3JkIiwiY2xlYXIiLCJfaXNDbG9zZWQiLCJnZXRDb25uZWN0aW9uTWFuYWdlciIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsImNyZWF0ZVdhbGxldCIsImNvbmZpZ05vcm1hbGl6ZWQiLCJnZXRTZWVkIiwiZ2V0UHJpbWFyeUFkZHJlc3MiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFByaXZhdGVTcGVuZEtleSIsImdldE5ldHdvcmtUeXBlIiwiZ2V0QWNjb3VudExvb2thaGVhZCIsImdldFN1YmFkZHJlc3NMb29rYWhlYWQiLCJzZXRQYXNzd29yZCIsInNldFNlcnZlciIsImdldENvbm5lY3Rpb24iLCJjcmVhdGVXYWxsZXRGcm9tU2VlZCIsImNyZWF0ZVdhbGxldEZyb21LZXlzIiwiY3JlYXRlV2FsbGV0UmFuZG9tIiwiZ2V0U2VlZE9mZnNldCIsImdldFJlc3RvcmVIZWlnaHQiLCJnZXRTYXZlQ3VycmVudCIsImdldExhbmd1YWdlIiwic2V0TGFuZ3VhZ2UiLCJERUZBVUxUX0xBTkdVQUdFIiwicGFyYW1zIiwibGFuZ3VhZ2UiLCJlcnIiLCJoYW5kbGVDcmVhdGVXYWxsZXRFcnJvciIsInNlZWQiLCJzZWVkX29mZnNldCIsImVuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWwiLCJnZXRJc011bHRpc2lnIiwicmVzdG9yZV9oZWlnaHQiLCJhdXRvc2F2ZV9jdXJyZW50Iiwic2V0UmVzdG9yZUhlaWdodCIsImFkZHJlc3MiLCJ2aWV3a2V5Iiwic3BlbmRrZXkiLCJuYW1lIiwibWVzc2FnZSIsInRvTG93ZXJDYXNlIiwiaW5jbHVkZXMiLCJNb25lcm9ScGNFcnJvciIsImdldENvZGUiLCJnZXRScGNNZXRob2QiLCJnZXRScGNQYXJhbXMiLCJpc1ZpZXdPbmx5Iiwia2V5X3R5cGUiLCJlIiwidXJpT3JDb25uZWN0aW9uIiwiaXNUcnVzdGVkIiwic3NsT3B0aW9ucyIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiU3NsT3B0aW9ucyIsInNldEFsbG93QW55Q2VydCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsImdldFVyaSIsInVzZXJuYW1lIiwiZ2V0VXNlcm5hbWUiLCJ0cnVzdGVkIiwiaGFzQ2VydGlmaWNhdGVzIiwiZ2V0Q2VydGlmaWNhdGVBdXRob3JpdHlGaWxlIiwiZ2V0QWxsb3dlZEZpbmdlcnByaW50cyIsImxlbmd0aCIsInNzbF9zdXBwb3J0IiwiZ2V0QWxsb3dBbnlDZXJ0Iiwic3NsX3ByaXZhdGVfa2V5X3BhdGgiLCJnZXRQcml2YXRlS2V5UGF0aCIsInNzbF9jZXJ0aWZpY2F0ZV9wYXRoIiwiZ2V0Q2VydGlmaWNhdGVQYXRoIiwic3NsX2NhX2ZpbGUiLCJzc2xfYWxsb3dlZF9maW5nZXJwcmludHMiLCJzc2xfYWxsb3dfYW55X2NlcnQiLCJnZXRQcm94eVVyaSIsInN0YXJ0dXBQcm94eVVyaSIsInByb3h5IiwiaXNTYW1lUHJveHlVcmkiLCJkYWVtb25Db25uZWN0aW9uIiwicmVqZWN0VW5hdXRob3JpemVkIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImdldEJhbGFuY2VzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJhc3NlcnQiLCJlcXVhbCIsImJhbGFuY2UiLCJCaWdJbnQiLCJ1bmxvY2tlZEJhbGFuY2UiLCJhY2NvdW50IiwiZ2V0QWNjb3VudHMiLCJnZXRCYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudF9pbmRleCIsImFkZHJlc3NfaW5kaWNlcyIsInJlc3AiLCJyZXN1bHQiLCJ1bmxvY2tlZF9iYWxhbmNlIiwicGVyX3N1YmFkZHJlc3MiLCJhZGRMaXN0ZW5lciIsInJlZnJlc2hMaXN0ZW5pbmciLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiY2hlY2tSZXNlcnZlUHJvb2YiLCJpbmRleE9mIiwiZ2V0VmVyc2lvbiIsIk1vbmVyb1ZlcnNpb24iLCJ2ZXJzaW9uIiwicmVsZWFzZSIsImdldFNlZWRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJsYW5ndWFnZXMiLCJnZXRBZGRyZXNzIiwic3ViYWRkcmVzc01hcCIsImdldFN1YmFkZHJlc3NlcyIsImdldEFkZHJlc3NJbmRleCIsInN1YmFkZHJlc3MiLCJNb25lcm9TdWJhZGRyZXNzIiwic2V0QWNjb3VudEluZGV4IiwiaW5kZXgiLCJtYWpvciIsInNldEluZGV4IiwibWlub3IiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInN0YW5kYXJkQWRkcmVzcyIsInBheW1lbnRJZCIsImludGVncmF0ZWRBZGRyZXNzU3RyIiwic3RhbmRhcmRfYWRkcmVzcyIsInBheW1lbnRfaWQiLCJpbnRlZ3JhdGVkX2FkZHJlc3MiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImludGVncmF0ZWRBZGRyZXNzIiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJzZXRTdGFuZGFyZEFkZHJlc3MiLCJzZXRQYXltZW50SWQiLCJzZXRJbnRlZ3JhdGVkQWRkcmVzcyIsImdldEhlaWdodCIsImhlaWdodCIsImdldERhZW1vbkhlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsInN5bmMiLCJsaXN0ZW5lck9yU3RhcnRIZWlnaHQiLCJzdGFydEhlaWdodCIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwic3RhcnRfaGVpZ2h0IiwicG9sbCIsIk1vbmVyb1N5bmNSZXN1bHQiLCJibG9ja3NfZmV0Y2hlZCIsInJlY2VpdmVkX21vbmV5Iiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluU2Vjb25kcyIsIk1hdGgiLCJyb3VuZCIsImVuYWJsZSIsInBlcmlvZCIsIndhbGxldFBvbGxlciIsInNldFBlcmlvZEluTXMiLCJnZXRTeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwidHhpZHMiLCJyZXNjYW5TcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwic2tpcEJhbGFuY2VzIiwiYWNjb3VudHMiLCJycGNBY2NvdW50Iiwic3ViYWRkcmVzc19hY2NvdW50cyIsImNvbnZlcnRScGNBY2NvdW50Iiwic2V0U3ViYWRkcmVzc2VzIiwiZ2V0SW5kZXgiLCJwdXNoIiwic2V0QmFsYW5jZSIsInNldFVubG9ja2VkQmFsYW5jZSIsInNldE51bVVuc3BlbnRPdXRwdXRzIiwic2V0TnVtQmxvY2tzVG9VbmxvY2siLCJhbGxfYWNjb3VudHMiLCJycGNTdWJhZGRyZXNzIiwiY29udmVydFJwY1N1YmFkZHJlc3MiLCJnZXRBY2NvdW50SW5kZXgiLCJ0Z3RTdWJhZGRyZXNzIiwiZ2V0TnVtVW5zcGVudE91dHB1dHMiLCJnZXRBY2NvdW50IiwiRXJyb3IiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJNb25lcm9BY2NvdW50IiwicHJpbWFyeUFkZHJlc3MiLCJzdWJhZGRyZXNzSW5kaWNlcyIsImFkZHJlc3NfaW5kZXgiLCJsaXN0aWZ5Iiwic3ViYWRkcmVzc2VzIiwiYWRkcmVzc2VzIiwiZ2V0TnVtQmxvY2tzVG9VbmxvY2siLCJnZXRTdWJhZGRyZXNzIiwiY3JlYXRlU3ViYWRkcmVzcyIsInNldEFkZHJlc3MiLCJzZXRMYWJlbCIsInNldElzVXNlZCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwiZ2V0VHhzQXV4IiwibWF4QXR0ZW1wdHMiLCJxdWVyeU5vcm1hbGl6ZWQiLCJub3JtYWxpemVUeFF1ZXJ5IiwidHJhbnNmZXJRdWVyeSIsImdldFRyYW5zZmVyUXVlcnkiLCJpbnB1dFF1ZXJ5IiwiZ2V0SW5wdXRRdWVyeSIsIm91dHB1dFF1ZXJ5IiwiZ2V0T3V0cHV0UXVlcnkiLCJzZXRUcmFuc2ZlclF1ZXJ5Iiwic2V0SW5wdXRRdWVyeSIsInNldE91dHB1dFF1ZXJ5IiwidHJhbnNmZXJzIiwiZ2V0VHJhbnNmZXJzQXV4IiwiTW9uZXJvVHJhbnNmZXJRdWVyeSIsInNldFR4UXVlcnkiLCJkZWNvbnRleHR1YWxpemUiLCJjb3B5IiwidHhzIiwidHhzU2V0IiwiU2V0IiwidHJhbnNmZXIiLCJnZXRUeCIsImFkZCIsInR4TWFwIiwiYmxvY2tNYXAiLCJ0eCIsIm1lcmdlVHgiLCJnZXRJbmNsdWRlT3V0cHV0cyIsIm91dHB1dFF1ZXJ5QXV4IiwiTW9uZXJvT3V0cHV0UXVlcnkiLCJvdXRwdXRzIiwiZ2V0T3V0cHV0c0F1eCIsIm91dHB1dFR4cyIsIm91dHB1dCIsInR4c1F1ZXJpZWQiLCJtZWV0c0NyaXRlcmlhIiwiZ2V0QmxvY2siLCJzcGxpY2UiLCJnZXRJc0NvbmZpcm1lZCIsImNvbnNvbGUiLCJlcnJvciIsImdldEhhc2hlcyIsInR4c0J5SWQiLCJNYXAiLCJnZXRIYXNoIiwib3JkZXJlZFR4cyIsImhhc2giLCJnZXRUcmFuc2ZlcnMiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiaXNDb250ZXh0dWFsIiwiZ2V0VHhRdWVyeSIsImZpbHRlclRyYW5zZmVycyIsImdldE91dHB1dHMiLCJub3JtYWxpemVPdXRwdXRRdWVyeSIsImZpbHRlck91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwib3V0cHV0c19kYXRhX2hleCIsImltcG9ydE91dHB1dHMiLCJvdXRwdXRzSGV4IiwibnVtX2ltcG9ydGVkIiwiZXhwb3J0S2V5SW1hZ2VzIiwicnBjRXhwb3J0S2V5SW1hZ2VzIiwiaW1wb3J0S2V5SW1hZ2VzIiwia2V5SW1hZ2VzIiwib2Zmc2V0IiwicnBjS2V5SW1hZ2VzIiwibWFwIiwia2V5SW1hZ2UiLCJrZXlfaW1hZ2UiLCJnZXRIZXgiLCJzaWduYXR1cmUiLCJnZXRTaWduYXR1cmUiLCJzaWduZWRfa2V5X2ltYWdlcyIsImltcG9ydFJlc3VsdCIsIk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0Iiwic2V0SGVpZ2h0Iiwic2V0U3BlbnRBbW91bnQiLCJzcGVudCIsInNldFVuc3BlbnRBbW91bnQiLCJ1bnNwZW50IiwiZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQiLCJnZXRLZXlJbWFnZXMiLCJmcmVlemVPdXRwdXQiLCJ0aGF3T3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJmcm96ZW4iLCJnZXREZWZhdWx0RmVlUHJpb3JpdHkiLCJwcmlvcml0eSIsImNyZWF0ZVR4cyIsIm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyIsImdldENhblNwbGl0Iiwic2V0Q2FuU3BsaXQiLCJnZXRSZWxheSIsImlzTXVsdGlzaWciLCJnZXRTdWJhZGRyZXNzSW5kaWNlcyIsInNsaWNlIiwiZGVzdGluYXRpb25zIiwiZGVzdGluYXRpb24iLCJnZXREZXN0aW5hdGlvbnMiLCJnZXRBbW91bnQiLCJhbW91bnQiLCJ0b1N0cmluZyIsImdldFN1YnRyYWN0RmVlRnJvbSIsInN1YnRyYWN0X2ZlZV9mcm9tX291dHB1dHMiLCJzdWJhZGRyX2luZGljZXMiLCJnZXRQYXltZW50SWQiLCJkb19ub3RfcmVsYXkiLCJnZXRQcmlvcml0eSIsImdldF90eF9oZXgiLCJnZXRfdHhfbWV0YWRhdGEiLCJnZXRfdHhfa2V5cyIsImdldF90eF9rZXkiLCJudW1UeHMiLCJmZWVfbGlzdCIsImZlZSIsImNvcHlEZXN0aW5hdGlvbnMiLCJpIiwiTW9uZXJvVHhXYWxsZXQiLCJpbml0U2VudFR4V2FsbGV0IiwiZ2V0T3V0Z29pbmdUcmFuc2ZlciIsInNldFN1YmFkZHJlc3NJbmRpY2VzIiwiY29udmVydFJwY1NlbnRUeHNUb1R4U2V0IiwiY29udmVydFJwY1R4VG9UeFNldCIsInN3ZWVwT3V0cHV0Iiwibm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWciLCJnZXRLZXlJbWFnZSIsInNldEFtb3VudCIsInN3ZWVwVW5sb2NrZWQiLCJub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnIiwiaW5kaWNlcyIsImtleXMiLCJzZXRTd2VlcEVhY2hTdWJhZGRyZXNzIiwiZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcyIsInJwY1N3ZWVwQWNjb3VudCIsInN3ZWVwRHVzdCIsInJlbGF5IiwidHhTZXQiLCJzZXRJc1JlbGF5ZWQiLCJzZXRJblR4UG9vbCIsImdldElzUmVsYXllZCIsInJlbGF5VHhzIiwidHhzT3JNZXRhZGF0YXMiLCJBcnJheSIsImlzQXJyYXkiLCJ0eE9yTWV0YWRhdGEiLCJtZXRhZGF0YSIsImdldE1ldGFkYXRhIiwiaGV4IiwidHhfaGFzaCIsImRlc2NyaWJlVHhTZXQiLCJ1bnNpZ25lZF90eHNldCIsImdldFVuc2lnbmVkVHhIZXgiLCJtdWx0aXNpZ190eHNldCIsImdldE11bHRpc2lnVHhIZXgiLCJjb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlciIsInNpZ25UeHMiLCJ1bnNpZ25lZFR4SGV4IiwiZXhwb3J0X3JhdyIsInN1Ym1pdFR4cyIsInNpZ25lZFR4SGV4IiwidHhfZGF0YV9oZXgiLCJ0eF9oYXNoX2xpc3QiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIlNJR05fV0lUSF9TUEVORF9LRVkiLCJkYXRhIiwic2lnbmF0dXJlX3R5cGUiLCJ2ZXJpZnlNZXNzYWdlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCIsImdvb2QiLCJpc0dvb2QiLCJpc09sZCIsIm9sZCIsIlNJR05fV0lUSF9WSUVXX0tFWSIsImdldFR4S2V5IiwidHhIYXNoIiwidHhpZCIsInR4X2tleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImNoZWNrIiwiTW9uZXJvQ2hlY2tUeCIsInNldElzR29vZCIsInNldE51bUNvbmZpcm1hdGlvbnMiLCJjb25maXJtYXRpb25zIiwiaW5fcG9vbCIsInNldFJlY2VpdmVkQW1vdW50IiwicmVjZWl2ZWQiLCJnZXRUeFByb29mIiwiY2hlY2tUeFByb29mIiwiZ2V0U3BlbmRQcm9vZiIsImNoZWNrU3BlbmRQcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJNb25lcm9DaGVja1Jlc2VydmUiLCJzZXRVbmNvbmZpcm1lZFNwZW50QW1vdW50Iiwic2V0VG90YWxBbW91bnQiLCJ0b3RhbCIsImdldFR4Tm90ZXMiLCJub3RlcyIsInNldFR4Tm90ZXMiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJlbnRyaWVzIiwicnBjRW50cnkiLCJNb25lcm9BZGRyZXNzQm9va0VudHJ5Iiwic2V0RGVzY3JpcHRpb24iLCJkZXNjcmlwdGlvbiIsImFkZEFkZHJlc3NCb29rRW50cnkiLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsInNldF9hZGRyZXNzIiwic2V0X2Rlc2NyaXB0aW9uIiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsInRhZ3MiLCJhY2NvdW50X3RhZ3MiLCJycGNBY2NvdW50VGFnIiwiTW9uZXJvQWNjb3VudFRhZyIsInNldEFjY291bnRUYWdMYWJlbCIsImdldFBheW1lbnRVcmkiLCJyZWNpcGllbnRfbmFtZSIsImdldFJlY2lwaWVudE5hbWUiLCJ0eF9kZXNjcmlwdGlvbiIsImdldE5vdGUiLCJ1cmkiLCJwYXJzZVBheW1lbnRVcmkiLCJNb25lcm9UeENvbmZpZyIsInNldFJlY2lwaWVudE5hbWUiLCJzZXROb3RlIiwiZ2V0QXR0cmlidXRlIiwidmFsdWUiLCJzZXRBdHRyaWJ1dGUiLCJ2YWwiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsInRocmVhZHNfY291bnQiLCJkb19iYWNrZ3JvdW5kX21pbmluZyIsImlnbm9yZV9iYXR0ZXJ5Iiwic3RvcE1pbmluZyIsImlzTXVsdGlzaWdJbXBvcnROZWVkZWQiLCJtdWx0aXNpZ19pbXBvcnRfbmVlZGVkIiwiZ2V0TXVsdGlzaWdJbmZvIiwiaW5mbyIsIk1vbmVyb011bHRpc2lnSW5mbyIsInNldElzTXVsdGlzaWciLCJtdWx0aXNpZyIsInNldElzUmVhZHkiLCJyZWFkeSIsInNldFRocmVzaG9sZCIsInRocmVzaG9sZCIsInNldE51bVBhcnRpY2lwYW50cyIsInByZXBhcmVNdWx0aXNpZyIsIm11bHRpc2lnX2luZm8iLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJtc1Jlc3VsdCIsIk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsInNldE11bHRpc2lnSGV4IiwiZ2V0TXVsdGlzaWdIZXgiLCJleHBvcnRNdWx0aXNpZ0hleCIsImltcG9ydE11bHRpc2lnSGV4IiwicmVmcmVzaEFmdGVySW1wb3J0IiwicmVmcmVzaF9hZnRlcl9pbXBvcnQiLCJuX291dHB1dHMiLCJzaWduTXVsdGlzaWdUeEhleCIsIm11bHRpc2lnVHhIZXgiLCJzaWduUmVzdWx0IiwiTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0Iiwic2V0U2lnbmVkTXVsdGlzaWdUeEhleCIsInNldFR4SGFzaGVzIiwic3VibWl0TXVsdGlzaWdUeEhleCIsInNpZ25lZE11bHRpc2lnVHhIZXgiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJvbGRfcGFzc3dvcmQiLCJuZXdfcGFzc3dvcmQiLCJzYXZlIiwiY2xvc2UiLCJpc0Nsb3NlZCIsInN0b3AiLCJnZXRJbmNvbWluZ1RyYW5zZmVycyIsImdldE91dGdvaW5nVHJhbnNmZXJzIiwiY3JlYXRlVHgiLCJyZWxheVR4IiwiZ2V0VHhOb3RlIiwic2V0VHhOb3RlIiwibm90ZSIsImNvbm5lY3RUb1dhbGxldFJwYyIsInVyaU9yQ29uZmlnIiwibm9ybWFsaXplQ29uZmlnIiwiY21kIiwic3RhcnRXYWxsZXRScGNQcm9jZXNzIiwiY2hpbGRfcHJvY2VzcyIsIlByb21pc2UiLCJyZXNvbHZlIiwidGhlbiIsImNoaWxkUHJvY2VzcyIsInNwYXduIiwiZW52IiwiTEFORyIsInN0ZG91dCIsInNldEVuY29kaW5nIiwic3RkZXJyIiwidGhhdCIsInJlamVjdCIsIm9uIiwibGluZSIsIkxpYnJhcnlVdGlscyIsImxvZyIsInVyaUxpbmVDb250YWlucyIsInVyaUxpbmVDb250YWluc0lkeCIsImhvc3QiLCJzdWJzdHJpbmciLCJsYXN0SW5kZXhPZiIsInVuZm9ybWF0dGVkTGluZSIsInJlcGxhY2UiLCJ0cmltIiwicG9ydCIsInNzbElkeCIsInNzbEVuYWJsZWQiLCJ1c2VyUGFzc0lkeCIsInVzZXJQYXNzIiwiem1xVXJpSWR4Iiwiem1xVXJpIiwicHJveHlVcmlJZHgiLCJwcm94eVVyaSIsIndhbGxldCIsImlzUmVzb2x2ZWQiLCJnZXRMb2dMZXZlbCIsImNvZGUiLCJvcmlnaW4iLCJsaXN0ZW5lckdlbmVyYXRpb24iLCJyZXNldCIsImdldEFjY291bnRJbmRpY2VzIiwidHhRdWVyeSIsImNhbkJlQ29uZmlybWVkIiwiZ2V0SW5UeFBvb2wiLCJnZXRJc0ZhaWxlZCIsImNhbkJlSW5UeFBvb2wiLCJnZXRNYXhIZWlnaHQiLCJnZXRJc0xvY2tlZCIsImNhbkJlSW5jb21pbmciLCJnZXRJc0luY29taW5nIiwiZ2V0SXNPdXRnb2luZyIsImdldEhhc0Rlc3RpbmF0aW9ucyIsImNhbkJlT3V0Z29pbmciLCJpbiIsIm91dCIsInBvb2wiLCJwZW5kaW5nIiwiZmFpbGVkIiwiZ2V0TWluSGVpZ2h0IiwibWluX2hlaWdodCIsIm1heF9oZWlnaHQiLCJmaWx0ZXJfYnlfaGVpZ2h0IiwiZ2V0U3ViYWRkcmVzc0luZGV4Iiwic2l6ZSIsImZyb20iLCJycGNUeCIsImNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlciIsImdldE91dGdvaW5nQW1vdW50Iiwib3V0Z29pbmdUcmFuc2ZlciIsInRyYW5zZmVyVG90YWwiLCJ2YWx1ZXMiLCJzb3J0IiwiY29tcGFyZVR4c0J5SGVpZ2h0Iiwic2V0SXNJbmNvbWluZyIsInNldElzT3V0Z29pbmciLCJjb21wYXJlSW5jb21pbmdUcmFuc2ZlcnMiLCJ0cmFuc2Zlcl90eXBlIiwiZ2V0SXNTcGVudCIsInZlcmJvc2UiLCJycGNPdXRwdXQiLCJjb252ZXJ0UnBjVHhXaXRoT3V0cHV0IiwiY29tcGFyZU91dHB1dHMiLCJycGNJbWFnZSIsIk1vbmVyb0tleUltYWdlIiwiTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQiLCJzZXRPZmZzZXQiLCJzZXRLZXlJbWFnZXMiLCJiZWxvd19hbW91bnQiLCJnZXRCZWxvd0Ftb3VudCIsInNldElzTG9ja2VkIiwic2V0SXNDb25maXJtZWQiLCJzZXRSZWxheSIsInNldElzTWluZXJUeCIsInNldElzRmFpbGVkIiwiTW9uZXJvRGVzdGluYXRpb24iLCJzZXREZXN0aW5hdGlvbnMiLCJzZXRPdXRnb2luZ1RyYW5zZmVyIiwiZ2V0VW5sb2NrVGltZSIsInNldFVubG9ja1RpbWUiLCJnZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsInNldExhc3RSZWxheWVkVGltZXN0YW1wIiwiRGF0ZSIsImdldFRpbWUiLCJnZXRJc0RvdWJsZVNwZW5kU2VlbiIsInNldElzRG91YmxlU3BlbmRTZWVuIiwibGlzdGVuZXJzIiwiV2FsbGV0UG9sbGVyIiwic2V0SXNQb2xsaW5nIiwiaXNQb2xsaW5nIiwic2VydmVyIiwicHJveHlUb1dvcmtlciIsInNldFByaW1hcnlBZGRyZXNzIiwic2V0VGFnIiwiZ2V0VGFnIiwic2V0UmluZ1NpemUiLCJNb25lcm9VdGlscyIsIlJJTkdfU0laRSIsIk1vbmVyb091dGdvaW5nVHJhbnNmZXIiLCJzZXRUeCIsImRlc3RDb3BpZXMiLCJkZXN0IiwiY29udmVydFJwY1R4U2V0IiwicnBjTWFwIiwiTW9uZXJvVHhTZXQiLCJzZXRNdWx0aXNpZ1R4SGV4Iiwic2V0VW5zaWduZWRUeEhleCIsInNldFNpZ25lZFR4SGV4Iiwic2lnbmVkX3R4c2V0IiwiZ2V0U2lnbmVkVHhIZXgiLCJycGNUeHMiLCJzZXRUeHMiLCJzZXRUeFNldCIsInNldEhhc2giLCJzZXRLZXkiLCJzZXRGdWxsSGV4Iiwic2V0TWV0YWRhdGEiLCJzZXRGZWUiLCJzZXRXZWlnaHQiLCJpbnB1dEtleUltYWdlc0xpc3QiLCJhc3NlcnRUcnVlIiwiZ2V0SW5wdXRzIiwic2V0SW5wdXRzIiwiaW5wdXRLZXlJbWFnZSIsIk1vbmVyb091dHB1dFdhbGxldCIsInNldEtleUltYWdlIiwic2V0SGV4IiwiYW1vdW50c0J5RGVzdExpc3QiLCJkZXN0aW5hdGlvbklkeCIsInR4SWR4IiwiYW1vdW50c0J5RGVzdCIsImlzT3V0Z29pbmciLCJ0eXBlIiwiZGVjb2RlUnBjVHlwZSIsImhlYWRlciIsInNldFNpemUiLCJNb25lcm9CbG9ja0hlYWRlciIsInNldFRpbWVzdGFtcCIsIk1vbmVyb0luY29taW5nVHJhbnNmZXIiLCJzZXROdW1TdWdnZXN0ZWRDb25maXJtYXRpb25zIiwiREVGQVVMVF9QQVlNRU5UX0lEIiwicnBjSW5kaWNlcyIsInJwY0luZGV4Iiwic2V0U3ViYWRkcmVzc0luZGV4IiwicnBjRGVzdGluYXRpb24iLCJkZXN0aW5hdGlvbktleSIsInJwY1NvdXJjZSIsImlucHV0IiwiZ2xvYmFsX2luZGV4IiwicHVia2V5Iiwic2V0U3RlYWx0aFB1YmxpY0tleSIsInNldElucHV0U3VtIiwic2V0T3V0cHV0U3VtIiwic2V0Q2hhbmdlQWRkcmVzcyIsInNldENoYW5nZUFtb3VudCIsInNldE51bUR1bW15T3V0cHV0cyIsInNldEV4dHJhSGV4IiwiaW5wdXRLZXlJbWFnZXMiLCJrZXlfaW1hZ2VzIiwiYW1vdW50cyIsInNldEJsb2NrIiwiTW9uZXJvQmxvY2siLCJtZXJnZSIsInNldEluY29taW5nVHJhbnNmZXJzIiwic2V0SXNTcGVudCIsInNldElzRnJvemVuIiwic2V0T3V0cHV0cyIsInJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQiLCJycGNUeXBlIiwiYVR4IiwiYUJsb2NrIiwidHgxIiwidHgyIiwiZGlmZiIsInQxIiwidDIiLCJvMSIsIm8yIiwiaGVpZ2h0Q29tcGFyaXNvbiIsImNvbXBhcmUiLCJsb2NhbGVDb21wYXJlIiwiZXhwb3J0cyIsInByZXZMb2NrZWRUeHNNaW5IZWlnaHQiLCJnZW5lcmF0aW9uIiwic25hcHNob3RHZW5lcmF0aW9uIiwibG9vcGVyIiwiVGFza0xvb3BlciIsInByZXZMb2NrZWRUeHMiLCJwcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zIiwicHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMiLCJ0aHJlYWRQb29sIiwiVGhyZWFkUG9vbCIsIm51bVBvbGxpbmciLCJzdGFydCIsInBlcmlvZEluTXMiLCJzdWJtaXQiLCJwcmV2SGVpZ2h0IiwicHJldkJhbGFuY2VzIiwiTW9uZXJvVHhRdWVyeSIsIm9uTmV3QmxvY2siLCJtaW5IZWlnaHQiLCJtYXgiLCJsb2NrZWRUeHMiLCJzZXRNaW5IZWlnaHQiLCJzZXRJbmNsdWRlT3V0cHV0cyIsIm5vTG9uZ2VyTG9ja2VkSGFzaGVzIiwicHJldkxvY2tlZFR4IiwicHJldk1pbkhlaWdodCIsInVubG9ja2VkVHhzIiwic2V0SGFzaGVzIiwibG9ja2VkVHgiLCJzZWFyY2hTZXQiLCJ1bmFubm91bmNlZCIsIm5vdGlmeU91dHB1dHMiLCJ1bmxvY2tlZFR4IiwibWlzc2VkQ29uZmlybSIsImRlbGV0ZSIsImNvbmZpcm1lZFR4IiwiY2hlY2tGb3JDaGFuZ2VkQmFsYW5jZXMiLCJhbm5vdW5jZU5ld0Jsb2NrIiwiZ2V0RmVlIiwiYW5ub3VuY2VPdXRwdXRTcGVudCIsImFubm91bmNlT3V0cHV0UmVjZWl2ZWQiLCJiYWxhbmNlcyIsImFubm91bmNlQmFsYW5jZXNDaGFuZ2VkIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldFJwYy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuLi9jb21tb24vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgVGFza0xvb3BlciBmcm9tIFwiLi4vY29tbW9uL1Rhc2tMb29wZXJcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50IGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50VGFnIGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRUYWdcIjtcbmltcG9ydCBNb25lcm9BZGRyZXNzQm9va0VudHJ5IGZyb20gXCIuL21vZGVsL01vbmVyb0FkZHJlc3NCb29rRW50cnlcIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tIZWFkZXIgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja0hlYWRlclwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrUmVzZXJ2ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1Jlc2VydmVcIjtcbmltcG9ydCBNb25lcm9DaGVja1R4IGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrVHhcIjtcbmltcG9ydCBNb25lcm9EZXN0aW5hdGlvbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EZXN0aW5hdGlvblwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbmNvbWluZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb0luY29taW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5mb1wiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luaXRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0UXVlcnlcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9ScGNFcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvU3ViYWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJhZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvU3luY1Jlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TeW5jUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlclF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyUXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFByaW9yaXR5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UHJpb3JpdHlcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1R4V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0IGZyb20gXCIuL01vbmVyb1dhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRDb25maWdcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0XCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi4vY29tbW9uL1RocmVhZFBvb2xcIjtcbmltcG9ydCBTc2xPcHRpb25zIGZyb20gXCIuLi9jb21tb24vU3NsT3B0aW9uc1wiO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIHdvb2RzZXJcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb1dhbGxldCBhcyBhIGNsaWVudCBvZiBtb25lcm8td2FsbGV0LXJwYy5cbiAqIFxuICogQGltcGxlbWVudHMge01vbmVyb1dhbGxldH1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvV2FsbGV0UnBjIGV4dGVuZHMgTW9uZXJvV2FsbGV0IHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA9IDIwMDAwOyAvLyBkZWZhdWx0IHBlcmlvZCBiZXR3ZWVuIHN5bmNzIGluIG1zIChkZWZpbmVkIGJ5IERFRkFVTFRfQVVUT19SRUZSRVNIX1BFUklPRCBpbiB3YWxsZXRfcnBjX3NlcnZlci5jcHApXG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPjtcbiAgcHJvdGVjdGVkIGFkZHJlc3NDYWNoZTogYW55O1xuICBwcm90ZWN0ZWQgc3luY1BlcmlvZEluTXM6IG51bWJlcjtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXTtcbiAgcHJvdGVjdGVkIHByb2Nlc3M6IGFueTtcbiAgcHJvdGVjdGVkIHBhdGg6IHN0cmluZztcbiAgcHJvdGVjdGVkIGRhZW1vbkNvbm5lY3Rpb246IE1vbmVyb1JwY0Nvbm5lY3Rpb247XG4gIHByb3RlY3RlZCB3YWxsZXRQb2xsZXI6IFdhbGxldFBvbGxlcjtcbiAgcHJvdGVjdGVkIHN0YXJ0dXBQcm94eVVyaTogc3RyaW5nO1xuICBcbiAgLyoqIEBwcml2YXRlICovXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9OyAvLyBhdm9pZCB1bmVjZXNzYXJ5IHJlcXVlc3RzIGZvciBhZGRyZXNzZXNcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gTW9uZXJvV2FsbGV0UnBjLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVM7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBSUEMgV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtDaGlsZFByb2Nlc3N9IHRoZSBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMsIHVuZGVmaW5lZCBpZiBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXG4gICAqL1xuICBnZXRQcm9jZXNzKCk6IENoaWxkUHJvY2VzcyB7XG4gICAgcmV0dXJuIHRoaXMucHJvY2VzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3AgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm8td2FsbGV0LXJwYywgaWYgYXBwbGljYWJsZS5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2Ugc3BlY2lmaWVzIGlmIHRoZSBwcm9jZXNzIHNob3VsZCBiZSBkZXN0cm95ZWQgZm9yY2libHkgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPn0gdGhlIGV4aXQgY29kZSBmcm9tIHN0b3BwaW5nIHRoZSBwcm9jZXNzXG4gICAqL1xuICBhc3luYyBzdG9wUHJvY2Vzcyhmb3JjZSA9IGZhbHNlKTogUHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+ICB7XG4gICAgaWYgKHRoaXMucHJvY2VzcyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMgaW5zdGFuY2Ugbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1wiKTtcbiAgICBsZXQgbGlzdGVuZXJzQ29weSA9IEdlblV0aWxzLmNvcHlBcnJheSh0aGlzLmdldExpc3RlbmVycygpKTtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnNDb3B5KSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gR2VuVXRpbHMua2lsbFByb2Nlc3ModGhpcy5wcm9jZXNzLCBmb3JjZSA/IFwiU0lHS0lMTFwiIDogdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgUlBDIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9uIHwgdW5kZWZpbmVkfSB0aGUgd2FsbGV0J3MgcnBjIGNvbm5lY3Rpb25cbiAgICovXG4gIGdldFJwY0Nvbm5lY3Rpb24oKTogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+T3BlbiBhbiBleGlzdGluZyB3YWxsZXQgb24gdGhlIG1vbmVyby13YWxsZXQtcnBjIHNlcnZlci48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlOjxwPlxuICAgKiBcbiAgICogPGNvZGU+XG4gICAqIGxldCB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0UnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4NFwiLCBcInJwY191c2VyXCIsIFwiYWJjMTIzXCIpOzxicj5cbiAgICogYXdhaXQgd2FsbGV0Lm9wZW5XYWxsZXQoXCJteXdhbGxldDFcIiwgXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIpOzxicj5cbiAgICogPGJyPlxuICAgKiBhd2FpdCB3YWxsZXQub3BlbldhbGxldCh7PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGF0aDogXCJteXdhbGxldDJcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VydmVyOiBcImh0dHA6Ly9sb2NhaG9zdDozODA4MVwiLCAvLyBvciBvYmplY3Qgd2l0aCB1cmksIHVzZXJuYW1lLCBwYXNzd29yZCwgZXRjIDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2U8YnI+XG4gICAqIH0pOzxicj5cbiAgICogPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvV2FsbGV0Q29uZmlnfSBwYXRoT3JDb25maWcgIC0gdGhlIHdhbGxldCdzIG5hbWUgb3IgY29uZmlndXJhdGlvbiB0byBvcGVuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoT3JDb25maWcucGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCBpbi1tZW1vcnkgd2FsbGV0IGlmIG5vdCBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhPckNvbmZpZy5wYXNzd29yZCAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IHBhdGhPckNvbmZpZy5zZXJ2ZXIgLSB1cmkgb3IgTW9uZXJvUnBjQ29ubmVjdGlvbiBvZiBhIGRhZW1vbiB0byB1c2UgKG9wdGlvbmFsLCBtb25lcm8td2FsbGV0LXJwYyB1c3VhbGx5IHN0YXJ0ZWQgd2l0aCBkYWVtb24gY29uZmlnKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3Bhc3N3b3JkXSB0aGUgd2FsbGV0J3MgcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9XYWxsZXRScGM+fSB0aGlzIHdhbGxldCBjbGllbnRcbiAgICovXG4gIGFzeW5jIG9wZW5XYWxsZXQocGF0aE9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4sIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHR5cGVvZiBwYXRoT3JDb25maWcgPT09IFwic3RyaW5nXCIgPyB7cGF0aDogcGF0aE9yQ29uZmlnLCBwYXNzd29yZDogcGFzc3dvcmQgPyBwYXNzd29yZCA6IFwiXCJ9IDogcGF0aE9yQ29uZmlnKTtcbiAgICAvLyBUT0RPOiBlbnN1cmUgb3RoZXIgZmllbGRzIHVuaW5pdGlhbGl6ZWQ/XG4gICAgXG4gICAgLy8gb3BlbiB3YWxsZXQgb24gcnBjIHNlcnZlclxuICAgIGlmICghY29uZmlnLmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIG5hbWUgb2Ygd2FsbGV0IHRvIG9wZW5cIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZWd0ZXN0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcmVndGVzdCBtb2RlIHdoZW4gb3BlbmluZyBSUEMgd2FsbGV0XCIpXG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwib3Blbl93YWxsZXRcIiwge2ZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLCBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCl9KTtcbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICB0aGlzLl9pc0Nsb3NlZCA9IGZhbHNlO1xuXG4gICAgLy8gc2V0IGNvbm5lY3Rpb24gbWFuYWdlciBvciBzZXJ2ZXJcbiAgICBpZiAoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkgIT0gbnVsbCkge1xuICAgICAgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBvcGVuZWQgd2l0aCBhIHNlcnZlciBvciBjb25uZWN0aW9uIG1hbmFnZXIgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgYXdhaXQgdGhpcy5zZXRDb25uZWN0aW9uTWFuYWdlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSk7XG4gICAgfSBlbHNlIGlmIChjb25maWcuZ2V0U2VydmVyKCkgIT0gbnVsbCkge1xuICAgICAgYXdhaXQgdGhpcy5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZy5nZXRTZXJ2ZXIoKSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+Q3JlYXRlIGFuZCBvcGVuIGEgd2FsbGV0IG9uIHRoZSBtb25lcm8td2FsbGV0LXJwYyBzZXJ2ZXIuPHA+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlOjxwPlxuICAgKiBcbiAgICogPGNvZGU+XG4gICAqICZzb2w7JnNvbDsgY29uc3RydWN0IGNsaWVudCB0byBtb25lcm8td2FsbGV0LXJwYzxicj5cbiAgICogbGV0IHdhbGxldFJwYyA9IG5ldyBNb25lcm9XYWxsZXRScGMoXCJodHRwOi8vbG9jYWxob3N0OjM4MDg0XCIsIFwicnBjX3VzZXJcIiwgXCJhYmMxMjNcIik7PGJyPjxicj5cbiAgICogXG4gICAqICZzb2w7JnNvbDsgY3JlYXRlIGFuZCBvcGVuIHdhbGxldCBvbiBtb25lcm8td2FsbGV0LXJwYzxicj5cbiAgICogYXdhaXQgd2FsbGV0UnBjLmNyZWF0ZVdhbGxldCh7PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGF0aDogXCJteXdhbGxldFwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImFiYzEyM1wiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHNlZWQ6IFwiY29leGlzdCBpZ2xvbyBwYW1waGxldCBsYWdvb24uLi5cIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyByZXN0b3JlSGVpZ2h0OiAxNTQzMjE4bDxicj5cbiAgICogfSk7XG4gICAqICA8L2NvZGU+XG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPn0gY29uZmlnIC0gTW9uZXJvV2FsbGV0Q29uZmlnIG9yIGVxdWl2YWxlbnQgSlMgb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhdGhdIC0gcGF0aCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIGluLW1lbW9yeSB3YWxsZXQgaWYgbm90IGdpdmVuKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXNzd29yZF0gLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZWVkXSAtIHNlZWQgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCByYW5kb20gd2FsbGV0IGNyZWF0ZWQgaWYgbmVpdGhlciBzZWVkIG5vciBrZXlzIGdpdmVuKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZWVkT2Zmc2V0XSAtIHRoZSBvZmZzZXQgdXNlZCB0byBkZXJpdmUgYSBuZXcgc2VlZCBmcm9tIHRoZSBnaXZlbiBzZWVkIHRvIHJlY292ZXIgYSBzZWNyZXQgd2FsbGV0IGZyb20gdGhlIHNlZWRcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLmlzTXVsdGlzaWddIC0gcmVzdG9yZSBtdWx0aXNpZyB3YWxsZXQgZnJvbSBzZWVkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaW1hcnlBZGRyZXNzXSAtIHByaW1hcnkgYWRkcmVzcyBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob25seSBwcm92aWRlIGlmIHJlc3RvcmluZyBmcm9tIGtleXMpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVWaWV3S2V5XSAtIHByaXZhdGUgdmlldyBrZXkgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlU3BlbmRLZXldIC0gcHJpdmF0ZSBzcGVuZCBrZXkgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5yZXN0b3JlSGVpZ2h0XSAtIGJsb2NrIGhlaWdodCB0byBzdGFydCBzY2FubmluZyBmcm9tIChkZWZhdWx0cyB0byAwIHVubGVzcyBnZW5lcmF0aW5nIHJhbmRvbSB3YWxsZXQpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmxhbmd1YWdlXSAtIGxhbmd1YWdlIG9mIHRoZSB3YWxsZXQncyBtbmVtb25pYyBwaHJhc2Ugb3Igc2VlZCAoZGVmYXVsdHMgdG8gXCJFbmdsaXNoXCIgb3IgYXV0by1kZXRlY3RlZClcbiAgICogQHBhcmFtIHtNb25lcm9ScGNDb25uZWN0aW9ufSBbY29uZmlnLnNlcnZlcl0gLSBNb25lcm9ScGNDb25uZWN0aW9uIHRvIGEgbW9uZXJvIGRhZW1vbiAob3B0aW9uYWwpPGJyPlxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZXJ2ZXJVcmldIC0gdXJpIG9mIGEgZGFlbW9uIHRvIHVzZSAob3B0aW9uYWwsIG1vbmVyby13YWxsZXQtcnBjIHVzdWFsbHkgc3RhcnRlZCB3aXRoIGRhZW1vbiBjb25maWcpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclVzZXJuYW1lXSAtIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBkYWVtb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZXJ2ZXJQYXNzd29yZF0gLSBwYXNzd29yZCB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgZGFlbW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9Db25uZWN0aW9uTWFuYWdlcn0gW2NvbmZpZy5jb25uZWN0aW9uTWFuYWdlcl0gLSBtYW5hZ2UgY29ubmVjdGlvbnMgdG8gbW9uZXJvZCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5yZWplY3RVbmF1dGhvcml6ZWRdIC0gcmVqZWN0IHNlbGYtc2lnbmVkIHNlcnZlciBjZXJ0aWZpY2F0ZXMgaWYgdHJ1ZSAoZGVmYXVsdHMgdG8gdHJ1ZSlcbiAgICogQHBhcmFtIHtNb25lcm9ScGNDb25uZWN0aW9ufSBbY29uZmlnLnNlcnZlcl0gLSBNb25lcm9ScGNDb25uZWN0aW9uIG9yIGVxdWl2YWxlbnQgSlMgb2JqZWN0IHByb3ZpZGluZyBkYWVtb24gY29uZmlndXJhdGlvbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5zYXZlQ3VycmVudF0gLSBzcGVjaWZpZXMgaWYgdGhlIGN1cnJlbnQgUlBDIHdhbGxldCBzaG91bGQgYmUgc2F2ZWQgYmVmb3JlIGJlaW5nIGNsb3NlZCAoZGVmYXVsdCB0cnVlKVxuICAgKiBAcmV0dXJuIHtNb25lcm9XYWxsZXRScGN9IHRoaXMgd2FsbGV0IGNsaWVudFxuICAgKi9cbiAgYXN5bmMgY3JlYXRlV2FsbGV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGNvbmZpZyB0byBjcmVhdGUgd2FsbGV0XCIpO1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQgJiYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpdmF0ZVZpZXdLZXkoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgaW5pdGlhbGl6ZWQgd2l0aCBhIHNlZWQgb3Iga2V5cyBidXQgbm90IGJvdGhcIik7XG4gICAgfVxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFJlZ3Rlc3QoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSByZWd0ZXN0IG1vZGUgd2hlbiBjcmVhdGluZyBSUEMgd2FsbGV0XCIpXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0TmV0d29ya1R5cGUoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBuZXR3b3JrVHlwZSB3aGVuIGNyZWF0aW5nIFJQQyB3YWxsZXQgYmVjYXVzZSBzZXJ2ZXIncyBuZXR3b3JrIHR5cGUgaXMgYWxyZWFkeSBzZXRcIik7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudExvb2thaGVhZCgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzTG9va2FoZWFkKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3Qgc3VwcG9ydCBjcmVhdGluZyB3YWxsZXRzIHdpdGggc3ViYWRkcmVzcyBsb29rYWhlYWQgb3ZlciBycGNcIik7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UGFzc3dvcmQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWdOb3JtYWxpemVkLnNldFBhc3N3b3JkKFwiXCIpO1xuXG4gICAgLy8gc2V0IHNlcnZlciBmcm9tIGNvbm5lY3Rpb24gbWFuYWdlciBpZiBwcm92aWRlZFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpIHtcbiAgICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlcnZlcigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIGNyZWF0ZWQgd2l0aCBhIHNlcnZlciBvciBjb25uZWN0aW9uIG1hbmFnZXIgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgY29uZmlnTm9ybWFsaXplZC5zZXRTZXJ2ZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkuZ2V0Q29ubmVjdGlvbigpKTtcbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQpIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnTm9ybWFsaXplZCk7XG4gICAgZWxzZSBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkKSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZ05vcm1hbGl6ZWQpO1xuICAgIGVsc2UgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRSYW5kb20oY29uZmlnTm9ybWFsaXplZCk7XG4gICAgdGhpcy5faXNDbG9zZWQgPSBmYWxzZTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXIgb3Igc2VydmVyXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXRDb25uZWN0aW9uTWFuYWdlcihjb25maWdOb3JtYWxpemVkLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIH0gZWxzZSBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldFJhbmRvbShjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHJlc3RvcmVIZWlnaHQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKSA9PT0gZmFsc2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkN1cnJlbnQgd2FsbGV0IGlzIHNhdmVkIGF1dG9tYXRpY2FsbHkgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmICghY29uZmlnLmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTmFtZSBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0TGFuZ3VhZ2UoKSkgY29uZmlnLnNldExhbmd1YWdlKE1vbmVyb1dhbGxldC5ERUZBVUxUX0xBTkdVQUdFKTtcbiAgICBsZXQgcGFyYW1zID0geyBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSwgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLCBsYW5ndWFnZTogY29uZmlnLmdldExhbmd1YWdlKCkgfTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX3dhbGxldFwiLCBwYXJhbXMpO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aGlzLmhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKGNvbmZpZy5nZXRQYXRoKCksIGVycik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVzdG9yZV9kZXRlcm1pbmlzdGljX3dhbGxldFwiLCB7XG4gICAgICAgIGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLFxuICAgICAgICBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksXG4gICAgICAgIHNlZWQ6IGNvbmZpZy5nZXRTZWVkKCksXG4gICAgICAgIHNlZWRfb2Zmc2V0OiBjb25maWcuZ2V0U2VlZE9mZnNldCgpLFxuICAgICAgICBlbmFibGVfbXVsdGlzaWdfZXhwZXJpbWVudGFsOiBjb25maWcuZ2V0SXNNdWx0aXNpZygpLFxuICAgICAgICByZXN0b3JlX2hlaWdodDogY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSxcbiAgICAgICAgbGFuZ3VhZ2U6IGNvbmZpZy5nZXRMYW5ndWFnZSgpLFxuICAgICAgICBhdXRvc2F2ZV9jdXJyZW50OiBjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBrZXlzXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRSZXN0b3JlSGVpZ2h0KDApO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoTW9uZXJvV2FsbGV0LkRFRkFVTFRfTEFOR1VBR0UpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZW5lcmF0ZV9mcm9tX2tleXNcIiwge1xuICAgICAgICBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSxcbiAgICAgICAgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLFxuICAgICAgICBhZGRyZXNzOiBjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSxcbiAgICAgICAgdmlld2tleTogY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCksXG4gICAgICAgIHNwZW5ka2V5OiBjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCksXG4gICAgICAgIHJlc3RvcmVfaGVpZ2h0OiBjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpLFxuICAgICAgICBhdXRvc2F2ZV9jdXJyZW50OiBjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBoYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihuYW1lLCBlcnIpIHtcbiAgICBpZiAoZXJyLm1lc3NhZ2UpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwiYWxyZWFkeSBleGlzdHNcIikpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBuYW1lLCBlcnIuZ2V0Q29kZSgpLCBlcnIuZ2V0UnBjTWV0aG9kKCksIGVyci5nZXRScGNQYXJhbXMoKSk7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcIndvcmQgbGlzdCBmYWlsZWQgdmVyaWZpY2F0aW9uXCIpKSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoXCJJbnZhbGlkIG1uZW1vbmljXCIsIGVyci5nZXRDb2RlKCksIGVyci5nZXRScGNNZXRob2QoKSwgZXJyLmdldFJwY1BhcmFtcygpKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9XG4gIFxuICBhc3luYyBpc1ZpZXdPbmx5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwge2tleV90eXBlOiBcIm1uZW1vbmljXCJ9KTtcbiAgICAgIHJldHVybiBmYWxzZTsgLy8ga2V5IHJldHJpZXZhbCBzdWNjZWVkcyBpZiBub3QgdmlldyBvbmx5XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0yOSkgcmV0dXJuIHRydWU7ICAvLyB3YWxsZXQgaXMgdmlldyBvbmx5XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0xKSByZXR1cm4gZmFsc2U7ICAvLyB3YWxsZXQgaXMgb2ZmbGluZSBidXQgbm90IHZpZXcgb25seVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uLlxuICAgKiBUaGUgY2FjaGVkIGNvbm5lY3Rpb24gcmVjb3JkcyB0aGUgcmVxdWVzdGVkIGFsbG93LWFueS1jZXJ0IHNldHRpbmcsIG5vdCBjdXN0b20gU1NMIG9wdGlvbnMuXG4gICAqIFdhbGxldCBSUEMgZW5mb3JjZXMgYSBDQSBmaWxlIG9yIGZpbmdlcnByaW50czsgb3RoZXJ3aXNlIFNTTCBhdXRvZGV0ZWN0IGNhbiBhY2NlcHQgdW52ZXJpZmllZCBjZXJ0aWZpY2F0ZXMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ3xNb25lcm9ScGNDb25uZWN0aW9ufSBbdXJpT3JDb25uZWN0aW9uXSAtIHRoZSBkYWVtb24ncyBVUkkgb3IgY29ubmVjdGlvbiAoZGVmYXVsdHMgdG8gb2ZmbGluZSlcbiAgICogQHBhcmFtIHtib29sZWFufSBpc1RydXN0ZWQgLSBpbmRpY2F0ZXMgaWYgdGhlIGRhZW1vbiBpbiB0cnVzdGVkXG4gICAqIEBwYXJhbSB7U3NsT3B0aW9uc30gc3NsT3B0aW9ucyAtIGN1c3RvbSBTU0wgY29uZmlndXJhdGlvbiAodGFrZXMgcHJlY2VkZW5jZSBvdmVyIHRoZSBjb25uZWN0aW9uJ3MgcmVqZWN0VW5hdXRob3JpemVkIHNldHRpbmcpXG4gICAqL1xuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbj86IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBzdHJpbmcsIGlzVHJ1c3RlZD86IGJvb2xlYW4sIHNzbE9wdGlvbnM/OiBTc2xPcHRpb25zKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IGNvbm5lY3Rpb24gPSAhdXJpT3JDb25uZWN0aW9uID8gdW5kZWZpbmVkIDogdXJpT3JDb25uZWN0aW9uIGluc3RhbmNlb2YgTW9uZXJvUnBjQ29ubmVjdGlvbiA/IHVyaU9yQ29ubmVjdGlvbiA6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbik7XG4gICAgaWYgKCFzc2xPcHRpb25zKSB7XG4gICAgICBzc2xPcHRpb25zID0gbmV3IFNzbE9wdGlvbnMoKTtcbiAgICAgIGlmIChjb25uZWN0aW9uKSBzc2xPcHRpb25zLnNldEFsbG93QW55Q2VydChjb25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpID09PSBmYWxzZSk7XG4gICAgfVxuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hZGRyZXNzID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0VXJpKCkgOiBcImJhZF91cmlcIjsgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogYmFkIGRhZW1vbiB1cmkgbmVjZXNzYXJ5IGZvciBvZmZsaW5lP1xuICAgIHBhcmFtcy51c2VybmFtZSA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFVzZXJuYW1lKCkgOiBcIlwiO1xuICAgIHBhcmFtcy5wYXNzd29yZCA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIHBhcmFtcy50cnVzdGVkID0gaXNUcnVzdGVkO1xuICAgIGNvbnN0IGhhc0NlcnRpZmljYXRlcyA9ICEhc3NsT3B0aW9ucy5nZXRDZXJ0aWZpY2F0ZUF1dGhvcml0eUZpbGUoKSB8fCBzc2xPcHRpb25zLmdldEFsbG93ZWRGaW5nZXJwcmludHMoKT8ubGVuZ3RoID4gMDtcbiAgICBwYXJhbXMuc3NsX3N1cHBvcnQgPSBoYXNDZXJ0aWZpY2F0ZXMgJiYgc3NsT3B0aW9ucy5nZXRBbGxvd0FueUNlcnQoKSAhPT0gdHJ1ZSA/IFwiZW5hYmxlZFwiIDogXCJhdXRvZGV0ZWN0XCI7IC8vIHdhbGxldCBycGMgb25seSBlbmZvcmNlcyBjZXJ0aWZpY2F0ZXMgaWYgZW5hYmxlZFxuICAgIHBhcmFtcy5zc2xfcHJpdmF0ZV9rZXlfcGF0aCA9IHNzbE9wdGlvbnMuZ2V0UHJpdmF0ZUtleVBhdGgoKTtcbiAgICBwYXJhbXMuc3NsX2NlcnRpZmljYXRlX3BhdGggID0gc3NsT3B0aW9ucy5nZXRDZXJ0aWZpY2F0ZVBhdGgoKTtcbiAgICBwYXJhbXMuc3NsX2NhX2ZpbGUgPSBzc2xPcHRpb25zLmdldENlcnRpZmljYXRlQXV0aG9yaXR5RmlsZSgpO1xuICAgIHBhcmFtcy5zc2xfYWxsb3dlZF9maW5nZXJwcmludHMgPSBzc2xPcHRpb25zLmdldEFsbG93ZWRGaW5nZXJwcmludHMoKTtcbiAgICBwYXJhbXMuc3NsX2FsbG93X2FueV9jZXJ0ID0gc3NsT3B0aW9ucy5nZXRBbGxvd0FueUNlcnQoKTtcblxuICAgIC8vIHNldCBwcm94eSB3aGljaCBtdXN0IG1hdGNoIHN0YXJ0dXAgcHJveHkgaWYgYXBwbGljYWJsZVxuICAgIGlmIChjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodGhpcy5zdGFydHVwUHJveHlVcmkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNldCBkYWVtb24gY29ubmVjdGlvbiB3aXRob3V0IHByb3h5IFVSSSBiZWNhdXNlIG1vbmVyby13YWxsZXQtcnBjIHdhcyBzdGFydGVkIHdpdGggYSBwcm94eSBVUkk6IFwiICsgdGhpcy5zdGFydHVwUHJveHlVcmkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5zdGFydHVwUHJveHlVcmkgPT09IHVuZGVmaW5lZCkgcGFyYW1zLnByb3h5ID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA6IFwiXCI7XG4gICAgICBlbHNlIGlmICghR2VuVXRpbHMuaXNTYW1lUHJveHlVcmkodGhpcy5zdGFydHVwUHJveHlVcmksIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNldCBkYWVtb24gY29ubmVjdGlvbiB3aXRoIHByb3h5IFVSSSBcIiArIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSArIFwiIGJlY2F1c2UgbW9uZXJvLXdhbGxldC1ycGMgd2FzIHN0YXJ0ZWQgd2l0aCBhIGRpZmZlcmVudCBwcm94eSBVUkk6IFwiICsgdGhpcy5zdGFydHVwUHJveHlVcmkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXBhcmFtcy5wcm94eSkgcGFyYW1zLnByb3h5ID0gXCJcIjtcblxuICAgIGNvbnN0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25uZWN0aW9uID8gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oY29ubmVjdGlvbikgOiB1bmRlZmluZWQ7XG4gICAgaWYgKGRhZW1vbkNvbm5lY3Rpb24pIGRhZW1vbkNvbm5lY3Rpb24ucmVqZWN0VW5hdXRob3JpemVkID0gcGFyYW1zLnNzbF9hbGxvd19hbnlfY2VydCAhPT0gdHJ1ZTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfZGFlbW9uXCIsIHBhcmFtcyk7XG4gICAgdGhpcy5kYWVtb25Db25uZWN0aW9uID0gZGFlbW9uQ29ubmVjdGlvbjtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uQ29ubmVjdGlvbigpOiBQcm9taXNlPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHtcbiAgICByZXR1cm4gdGhpcy5kYWVtb25Db25uZWN0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdG90YWwgYW5kIHVubG9ja2VkIGJhbGFuY2VzIGluIGEgc2luZ2xlIHJlcXVlc3QuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2FjY291bnRJZHhdIGFjY291bnQgaW5kZXhcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdWJhZGRyZXNzSWR4XSBzdWJhZGRyZXNzIGluZGV4XG4gICAqIEByZXR1cm4ge1Byb21pc2U8YmlnaW50W10+fSBpcyB0aGUgdG90YWwgYW5kIHVubG9ja2VkIGJhbGFuY2VzIGluIGFuIGFycmF5LCByZXNwZWN0aXZlbHlcbiAgICovXG4gIGFzeW5jIGdldEJhbGFuY2VzKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludFtdPiB7XG4gICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0LmVxdWFsKHN1YmFkZHJlc3NJZHgsIHVuZGVmaW5lZCwgXCJNdXN0IHByb3ZpZGUgYWNjb3VudCBpbmRleCB3aXRoIHN1YmFkZHJlc3MgaW5kZXhcIik7XG4gICAgICBsZXQgYmFsYW5jZSA9IEJpZ0ludCgwKTtcbiAgICAgIGxldCB1bmxvY2tlZEJhbGFuY2UgPSBCaWdJbnQoMCk7XG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgICBiYWxhbmNlID0gYmFsYW5jZSArIGFjY291bnQuZ2V0QmFsYW5jZSgpO1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2UgPSB1bmxvY2tlZEJhbGFuY2UgKyBhY2NvdW50LmdldFVubG9ja2VkQmFsYW5jZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFtiYWxhbmNlLCB1bmxvY2tlZEJhbGFuY2VdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcGFyYW1zID0ge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHgsIGFkZHJlc3NfaW5kaWNlczogc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogW3N1YmFkZHJlc3NJZHhdfTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwgcGFyYW1zKTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQpIHJldHVybiBbQmlnSW50KHJlc3AucmVzdWx0LmJhbGFuY2UpLCBCaWdJbnQocmVzcC5yZXN1bHQudW5sb2NrZWRfYmFsYW5jZSldO1xuICAgICAgZWxzZSByZXR1cm4gW0JpZ0ludChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzc1swXS5iYWxhbmNlKSwgQmlnSW50KHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzWzBdLnVubG9ja2VkX2JhbGFuY2UpXTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIENPTU1PTiBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvV2FsbGV0TGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3VwZXIucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZFRvRGFlbW9uKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNoZWNrUmVzZXJ2ZVByb29mKGF3YWl0IHRoaXMuZ2V0UHJpbWFyeUFkZHJlc3MoKSwgXCJcIiwgXCJcIik7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogcHJvdmlkZSBiZXR0ZXIgd2F5IHRvIGtub3cgaWYgd2FsbGV0IHJwYyBpcyBjb25uZWN0ZWQgdG8gZGFlbW9uXG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJjaGVjayByZXNlcnZlIGV4cGVjdGVkIHRvIGZhaWxcIik7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtMTMpIHRocm93IGU7IC8vIG5vIHdhbGxldCBmaWxlXG4gICAgICByZXR1cm4gZS5tZXNzYWdlLmluZGV4T2YoXCJGYWlsZWQgdG8gY29ubmVjdCB0byBkYWVtb25cIikgPCAwO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF92ZXJzaW9uXCIpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVmVyc2lvbihyZXNwLnJlc3VsdC52ZXJzaW9uLCByZXNwLnJlc3VsdC5yZWxlYXNlKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF0aCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLnBhdGg7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNlZWQoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcIm1uZW1vbmljXCIgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmtleTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZExhbmd1YWdlKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKGF3YWl0IHRoaXMuZ2V0U2VlZCgpID09PSB1bmRlZmluZWQpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0UnBjLmdldFNlZWRMYW5ndWFnZSgpIG5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgbGlzdCBvZiBhdmFpbGFibGUgbGFuZ3VhZ2VzIGZvciB0aGUgd2FsbGV0J3Mgc2VlZC5cbiAgICogXG4gICAqIEByZXR1cm4ge3N0cmluZ1tdfSB0aGUgYXZhaWxhYmxlIGxhbmd1YWdlcyBmb3IgdGhlIHdhbGxldCdzIHNlZWQuXG4gICAqL1xuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2VzKCkge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2xhbmd1YWdlc1wiKSkucmVzdWx0Lmxhbmd1YWdlcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHJpdmF0ZVZpZXdLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcInZpZXdfa2V5XCIgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmtleTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHJpdmF0ZVNwZW5kS2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwgeyBrZXlfdHlwZTogXCJzcGVuZF9rZXlcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgc3ViYWRkcmVzc01hcCA9IHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdO1xuICAgIGlmICghc3ViYWRkcmVzc01hcCkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCB0cnVlKTsgIC8vIGNhY2hlJ3MgYWxsIGFkZHJlc3NlcyBhdCB0aGlzIGFjY291bnRcbiAgICAgIHJldHVybiB0aGlzLmdldEFkZHJlc3MoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7ICAgICAgICAvLyByZWN1cnNpdmUgY2FsbCB1c2VzIGNhY2hlXG4gICAgfVxuICAgIGxldCBhZGRyZXNzID0gc3ViYWRkcmVzc01hcFtzdWJhZGRyZXNzSWR4XTtcbiAgICBpZiAoIWFkZHJlc3MpIHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHVuZGVmaW5lZCwgdHJ1ZSk7ICAvLyBjYWNoZSdzIGFsbCBhZGRyZXNzZXMgYXQgdGhpcyBhY2NvdW50XG4gICAgICByZXR1cm4gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF1bc3ViYWRkcmVzc0lkeF07XG4gICAgfVxuICAgIHJldHVybiBhZGRyZXNzO1xuICB9XG4gIFxuICAvLyBUT0RPOiB1c2UgY2FjaGVcbiAgYXN5bmMgZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIFxuICAgIC8vIGZldGNoIHJlc3VsdCBhbmQgbm9ybWFsaXplIGVycm9yIGlmIGFkZHJlc3MgZG9lcyBub3QgYmVsb25nIHRvIHRoZSB3YWxsZXRcbiAgICBsZXQgcmVzcDtcbiAgICB0cnkge1xuICAgICAgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzX2luZGV4XCIsIHthZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0yKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZS5tZXNzYWdlKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICAgIFxuICAgIC8vIGNvbnZlcnQgcnBjIHJlc3BvbnNlXG4gICAgbGV0IHN1YmFkZHJlc3MgPSBuZXcgTW9uZXJvU3ViYWRkcmVzcyh7YWRkcmVzczogYWRkcmVzc30pO1xuICAgIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KHJlc3AucmVzdWx0LmluZGV4Lm1ham9yKTtcbiAgICBzdWJhZGRyZXNzLnNldEluZGV4KHJlc3AucmVzdWx0LmluZGV4Lm1pbm9yKTtcbiAgICByZXR1cm4gc3ViYWRkcmVzcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzPzogc3RyaW5nLCBwYXltZW50SWQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBpbnRlZ3JhdGVkQWRkcmVzc1N0ciA9IChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJtYWtlX2ludGVncmF0ZWRfYWRkcmVzc1wiLCB7c3RhbmRhcmRfYWRkcmVzczogc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50X2lkOiBwYXltZW50SWR9KSkucmVzdWx0LmludGVncmF0ZWRfYWRkcmVzcztcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzU3RyKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLm1lc3NhZ2UuaW5jbHVkZXMoXCJJbnZhbGlkIHBheW1lbnQgSURcIikpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgcGF5bWVudCBJRDogXCIgKyBwYXltZW50SWQpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzcGxpdF9pbnRlZ3JhdGVkX2FkZHJlc3NcIiwge2ludGVncmF0ZWRfYWRkcmVzczogaW50ZWdyYXRlZEFkZHJlc3N9KTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKCkuc2V0U3RhbmRhcmRBZGRyZXNzKHJlc3AucmVzdWx0LnN0YW5kYXJkX2FkZHJlc3MpLnNldFBheW1lbnRJZChyZXNwLnJlc3VsdC5wYXltZW50X2lkKS5zZXRJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzcyk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2hlaWdodFwiKSkucmVzdWx0LmhlaWdodDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uSGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3Qgc3VwcG9ydCBnZXR0aW5nIHRoZSBjaGFpbiBoZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodEJ5RGF0ZSh5ZWFyOiBudW1iZXIsIG1vbnRoOiBudW1iZXIsIGRheTogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGdldHRpbmcgYSBoZWlnaHQgYnkgZGF0ZVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc3luYyhsaXN0ZW5lck9yU3RhcnRIZWlnaHQ/OiBNb25lcm9XYWxsZXRMaXN0ZW5lciB8IG51bWJlciwgc3RhcnRIZWlnaHQ/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb1N5bmNSZXN1bHQ+IHtcbiAgICBhc3NlcnQoIShsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciksIFwiTW9uZXJvIFdhbGxldCBSUEMgZG9lcyBub3Qgc3VwcG9ydCByZXBvcnRpbmcgc3luYyBwcm9ncmVzc1wiKTtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZWZyZXNoXCIsIHtzdGFydF9oZWlnaHQ6IHN0YXJ0SGVpZ2h0fSk7XG4gICAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvU3luY1Jlc3VsdChyZXNwLnJlc3VsdC5ibG9ja3NfZmV0Y2hlZCwgcmVzcC5yZXN1bHQucmVjZWl2ZWRfbW9uZXkpO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UgPT09IFwibm8gY29ubmVjdGlvbiB0byBkYWVtb25cIikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIG5vdCBjb25uZWN0ZWQgdG8gZGFlbW9uXCIpO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgXG4gICAgLy8gY29udmVydCBtcyB0byBzZWNvbmRzIGZvciBycGMgcGFyYW1ldGVyXG4gICAgbGV0IHN5bmNQZXJpb2RJblNlY29uZHMgPSBNYXRoLnJvdW5kKChzeW5jUGVyaW9kSW5NcyA9PT0gdW5kZWZpbmVkID8gTW9uZXJvV2FsbGV0UnBjLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgOiBzeW5jUGVyaW9kSW5NcykgLyAxMDAwKTtcbiAgICBcbiAgICAvLyBzZW5kIHJwYyByZXF1ZXN0XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiYXV0b19yZWZyZXNoXCIsIHtcbiAgICAgIGVuYWJsZTogdHJ1ZSxcbiAgICAgIHBlcmlvZDogc3luY1BlcmlvZEluU2Vjb25kc1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHVwZGF0ZSBzeW5jIHBlcmlvZCBmb3IgcG9sbGVyXG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IHN5bmNQZXJpb2RJblNlY29uZHMgKiAxMDAwO1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkKSB0aGlzLndhbGxldFBvbGxlci5zZXRQZXJpb2RJbk1zKHRoaXMuc3luY1BlcmlvZEluTXMpO1xuICAgIFxuICAgIC8vIHBvbGwgaWYgbGlzdGVuaW5nXG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gIH1cblxuICBnZXRTeW5jUGVyaW9kSW5NcygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnN5bmNQZXJpb2RJbk1zO1xuICB9XG4gIFxuICBhc3luYyBzdG9wU3luY2luZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiYXV0b19yZWZyZXNoXCIsIHsgZW5hYmxlOiBmYWxzZSB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXR4SGFzaGVzIHx8ICF0eEhhc2hlcy5sZW5ndGgpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vIHR4IGhhc2hlcyBnaXZlbiB0byBzY2FuXCIpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNjYW5fdHhcIiwge3R4aWRzOiB0eEhhc2hlc30pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5TcGVudCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXNjYW5fc3BlbnRcIiwgdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXNjYW5fYmxvY2tjaGFpblwiLCB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYWxhbmNlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSlbMF07XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0QmFsYW5jZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkpWzFdO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbiwgdGFnPzogc3RyaW5nLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50W10+IHtcbiAgICBcbiAgICAvLyBmZXRjaCBhY2NvdW50cyBmcm9tIHJwY1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FjY291bnRzXCIsIHt0YWc6IHRhZ30pO1xuICAgIFxuICAgIC8vIGJ1aWxkIGFjY291bnQgb2JqZWN0cyBhbmQgZmV0Y2ggc3ViYWRkcmVzc2VzIHBlciBhY2NvdW50IHVzaW5nIGdldF9hZGRyZXNzXG4gICAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogZ2V0X2FkZHJlc3Mgc2hvdWxkIHN1cHBvcnQgYWxsX2FjY291bnRzIHNvIG5vdCBjYWxsZWQgb25jZSBwZXIgYWNjb3VudFxuICAgIGxldCBhY2NvdW50czogTW9uZXJvQWNjb3VudFtdID0gW107XG4gICAgZm9yIChsZXQgcnBjQWNjb3VudCBvZiByZXNwLnJlc3VsdC5zdWJhZGRyZXNzX2FjY291bnRzKSB7XG4gICAgICBsZXQgYWNjb3VudCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjQWNjb3VudChycGNBY2NvdW50KTtcbiAgICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzKSBhY2NvdW50LnNldFN1YmFkZHJlc3Nlcyhhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50LmdldEluZGV4KCksIHVuZGVmaW5lZCwgdHJ1ZSkpO1xuICAgICAgYWNjb3VudHMucHVzaChhY2NvdW50KTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIG1lcmdlIGZpZWxkcyBmcm9tIGdldF9iYWxhbmNlIGFjcm9zcyBhbGwgYWNjb3VudHNcbiAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcyAmJiAhc2tpcEJhbGFuY2VzKSB7XG4gICAgICBcbiAgICAgIC8vIHRoZXNlIGZpZWxkcyBhcmUgbm90IGluaXRpYWxpemVkIGlmIHN1YmFkZHJlc3MgaXMgdW51c2VkIGFuZCB0aGVyZWZvcmUgbm90IHJldHVybmVkIGZyb20gYGdldF9iYWxhbmNlYFxuICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiBhY2NvdW50cykge1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jaygwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBmZXRjaCBhbmQgbWVyZ2UgaW5mbyBmcm9tIGdldF9iYWxhbmNlXG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwge2FsbF9hY2NvdW50czogdHJ1ZX0pO1xuICAgICAgaWYgKHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgIGZvciAobGV0IHJwY1N1YmFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzcyA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBtZXJnZSBpbmZvXG4gICAgICAgICAgbGV0IGFjY291bnQgPSBhY2NvdW50c1tzdWJhZGRyZXNzLmdldEFjY291bnRJbmRleCgpXTtcbiAgICAgICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzcy5nZXRBY2NvdW50SW5kZXgoKSwgYWNjb3VudC5nZXRJbmRleCgpLCBcIlJQQyBhY2NvdW50cyBhcmUgb3V0IG9mIG9yZGVyXCIpOyAgLy8gd291bGQgbmVlZCB0byBzd2l0Y2ggbG9va3VwIHRvIGxvb3BcbiAgICAgICAgICBsZXQgdGd0U3ViYWRkcmVzcyA9IGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKClbc3ViYWRkcmVzcy5nZXRJbmRleCgpXTtcbiAgICAgICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzcy5nZXRJbmRleCgpLCB0Z3RTdWJhZGRyZXNzLmdldEluZGV4KCksIFwiUlBDIHN1YmFkZHJlc3NlcyBhcmUgb3V0IG9mIG9yZGVyXCIpO1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkpO1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkpO1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cyhzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBhY2NvdW50cztcbiAgfVxuICBcbiAgLy8gVE9ETzogZ2V0QWNjb3VudEJ5SW5kZXgoKSwgZ2V0QWNjb3VudEJ5VGFnKClcbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgYXNzZXJ0KGFjY291bnRJZHggPj0gMCk7XG4gICAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCB0aGlzLmdldEFjY291bnRzKCkpIHtcbiAgICAgIGlmIChhY2NvdW50LmdldEluZGV4KCkgPT09IGFjY291bnRJZHgpIHtcbiAgICAgICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMpIGFjY291bnQuc2V0U3ViYWRkcmVzc2VzKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHVuZGVmaW5lZCwgc2tpcEJhbGFuY2VzKSk7XG4gICAgICAgIHJldHVybiBhY2NvdW50O1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBY2NvdW50IHdpdGggaW5kZXggXCIgKyBhY2NvdW50SWR4ICsgXCIgZG9lcyBub3QgZXhpc3RcIik7XG4gIH1cblxuICBhc3luYyBjcmVhdGVBY2NvdW50KGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgbGFiZWwgPSBsYWJlbCA/IGxhYmVsIDogdW5kZWZpbmVkO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX2FjY291bnRcIiwge2xhYmVsOiBsYWJlbH0pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvQWNjb3VudCh7XG4gICAgICBpbmRleDogcmVzcC5yZXN1bHQuYWNjb3VudF9pbmRleCxcbiAgICAgIHByaW1hcnlBZGRyZXNzOiByZXNwLnJlc3VsdC5hZGRyZXNzLFxuICAgICAgbGFiZWw6IGxhYmVsLFxuICAgICAgYmFsYW5jZTogQmlnSW50KDApLFxuICAgICAgdW5sb2NrZWRCYWxhbmNlOiBCaWdJbnQoMClcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJbmRpY2VzPzogbnVtYmVyW10sIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3NbXT4ge1xuICAgIFxuICAgIC8vIGZldGNoIHN1YmFkZHJlc3Nlc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gYWNjb3VudElkeDtcbiAgICBpZiAoc3ViYWRkcmVzc0luZGljZXMpIHBhcmFtcy5hZGRyZXNzX2luZGV4ID0gR2VuVXRpbHMubGlzdGlmeShzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc1wiLCBwYXJhbXMpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgc3ViYWRkcmVzc2VzXG4gICAgbGV0IHN1YmFkZHJlc3NlcyA9IFtdO1xuICAgIGZvciAobGV0IHJwY1N1YmFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQuYWRkcmVzc2VzKSB7XG4gICAgICBsZXQgc3ViYWRkcmVzcyA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKTtcbiAgICAgIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgc3ViYWRkcmVzc2VzLnB1c2goc3ViYWRkcmVzcyk7XG4gICAgfVxuICAgIFxuICAgIC8vIGZldGNoIGFuZCBpbml0aWFsaXplIHN1YmFkZHJlc3MgYmFsYW5jZXNcbiAgICBpZiAoIXNraXBCYWxhbmNlcykge1xuICAgICAgXG4gICAgICAvLyB0aGVzZSBmaWVsZHMgYXJlIG5vdCBpbml0aWFsaXplZCBpZiBzdWJhZGRyZXNzIGlzIHVudXNlZCBhbmQgdGhlcmVmb3JlIG5vdCByZXR1cm5lZCBmcm9tIGBnZXRfYmFsYW5jZWBcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKDApO1xuICAgICAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgICAgfVxuXG4gICAgICAvLyBmZXRjaCBhbmQgaW5pdGlhbGl6ZSBiYWxhbmNlc1xuICAgICAgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIsIHBhcmFtcyk7XG4gICAgICBpZiAocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIHRyYW5zZmVyIGluZm8gdG8gZXhpc3Rpbmcgc3ViYWRkcmVzcyBvYmplY3RcbiAgICAgICAgICBmb3IgKGxldCB0Z3RTdWJhZGRyZXNzIG9mIHN1YmFkZHJlc3Nlcykge1xuICAgICAgICAgICAgaWYgKHRndFN1YmFkZHJlc3MuZ2V0SW5kZXgoKSAhPT0gc3ViYWRkcmVzcy5nZXRJbmRleCgpKSBjb250aW51ZTsgLy8gc2tpcCB0byBzdWJhZGRyZXNzIHdpdGggc2FtZSBpbmRleFxuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0QmFsYW5jZShzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cyhzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKHN1YmFkZHJlc3MuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIGFkZHJlc3Nlc1xuICAgIGxldCBzdWJhZGRyZXNzTWFwID0gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF07XG4gICAgaWYgKCFzdWJhZGRyZXNzTWFwKSB7XG4gICAgICBzdWJhZGRyZXNzTWFwID0ge307XG4gICAgICB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XSA9IHN1YmFkZHJlc3NNYXA7XG4gICAgfVxuICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICBzdWJhZGRyZXNzTWFwW3N1YmFkZHJlc3MuZ2V0SW5kZXgoKV0gPSBzdWJhZGRyZXNzLmdldEFkZHJlc3MoKTtcbiAgICB9XG4gICAgXG4gICAgLy8gcmV0dXJuIHJlc3VsdHNcbiAgICByZXR1cm4gc3ViYWRkcmVzc2VzO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlciwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIGFzc2VydChhY2NvdW50SWR4ID49IDApO1xuICAgIGFzc2VydChzdWJhZGRyZXNzSWR4ID49IDApO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgW3N1YmFkZHJlc3NJZHhdLCBza2lwQmFsYW5jZXMpKVswXTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX2FkZHJlc3NcIiwge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHgsIGxhYmVsOiBsYWJlbH0pO1xuICAgIFxuICAgIC8vIGJ1aWxkIHN1YmFkZHJlc3Mgb2JqZWN0XG4gICAgbGV0IHN1YmFkZHJlc3MgPSBuZXcgTW9uZXJvU3ViYWRkcmVzcygpO1xuICAgIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgIHN1YmFkZHJlc3Muc2V0SW5kZXgocmVzcC5yZXN1bHQuYWRkcmVzc19pbmRleCk7XG4gICAgc3ViYWRkcmVzcy5zZXRBZGRyZXNzKHJlc3AucmVzdWx0LmFkZHJlc3MpO1xuICAgIHN1YmFkZHJlc3Muc2V0TGFiZWwobGFiZWwgPyBsYWJlbCA6IHVuZGVmaW5lZCk7XG4gICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgc3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKDApO1xuICAgIHN1YmFkZHJlc3Muc2V0SXNVc2VkKGZhbHNlKTtcbiAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgIHJldHVybiBzdWJhZGRyZXNzO1xuICB9XG5cbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibGFiZWxfYWRkcmVzc1wiLCB7aW5kZXg6IHttYWpvcjogYWNjb3VudElkeCwgbWlub3I6IHN1YmFkZHJlc3NJZHh9LCBsYWJlbDogbGFiZWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5Pzogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VHhzQXV4KHF1ZXJ5LCA1KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBnZXRUeHNBdXgocXVlcnk6IHN0cmluZ1tdIHwgUGFydGlhbDxNb25lcm9UeFF1ZXJ5PiB8IHVuZGVmaW5lZCwgbWF4QXR0ZW1wdHM6IG51bWJlcik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuXG4gICAgLy8gY29weSBxdWVyeVxuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyB0ZW1wb3JhcmlseSBkaXNhYmxlIHRyYW5zZmVyIGFuZCBvdXRwdXQgcXVlcmllcyBpbiBvcmRlciB0byBjb2xsZWN0IGFsbCB0eCBpbmZvcm1hdGlvblxuICAgIGxldCB0cmFuc2ZlclF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldFRyYW5zZmVyUXVlcnkoKTtcbiAgICBsZXQgaW5wdXRRdWVyeSA9IHF1ZXJ5Tm9ybWFsaXplZC5nZXRJbnB1dFF1ZXJ5KCk7XG4gICAgbGV0IG91dHB1dFF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldE91dHB1dFF1ZXJ5KCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldFRyYW5zZmVyUXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SW5wdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRPdXRwdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIGZldGNoIGFsbCB0cmFuc2ZlcnMgdGhhdCBtZWV0IHR4IHF1ZXJ5XG4gICAgbGV0IHRyYW5zZmVycyA9IGF3YWl0IHRoaXMuZ2V0VHJhbnNmZXJzQXV4KG5ldyBNb25lcm9UcmFuc2ZlclF1ZXJ5KCkuc2V0VHhRdWVyeShNb25lcm9XYWxsZXRScGMuZGVjb250ZXh0dWFsaXplKHF1ZXJ5Tm9ybWFsaXplZC5jb3B5KCkpKSk7XG4gICAgXG4gICAgLy8gY29sbGVjdCB1bmlxdWUgdHhzIGZyb20gdHJhbnNmZXJzIHdoaWxlIHJldGFpbmluZyBvcmRlclxuICAgIGxldCB0eHMgPSBbXTtcbiAgICBsZXQgdHhzU2V0ID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHRyYW5zZmVycykge1xuICAgICAgaWYgKCF0eHNTZXQuaGFzKHRyYW5zZmVyLmdldFR4KCkpKSB7XG4gICAgICAgIHR4cy5wdXNoKHRyYW5zZmVyLmdldFR4KCkpO1xuICAgICAgICB0eHNTZXQuYWRkKHRyYW5zZmVyLmdldFR4KCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB0eXBlcyBpbnRvIG1hcHMgZm9yIG1lcmdpbmcgYW5kIGxvb2t1cFxuICAgIGxldCB0eE1hcCA9IHt9O1xuICAgIGxldCBibG9ja01hcCA9IHt9O1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGZldGNoIGFuZCBtZXJnZSBvdXRwdXRzIGlmIHJlcXVlc3RlZFxuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SW5jbHVkZU91dHB1dHMoKSB8fCBvdXRwdXRRdWVyeSkge1xuICAgICAgICBcbiAgICAgIC8vIGZldGNoIG91dHB1dHNcbiAgICAgIGxldCBvdXRwdXRRdWVyeUF1eCA9IChvdXRwdXRRdWVyeSA/IG91dHB1dFF1ZXJ5LmNvcHkoKSA6IG5ldyBNb25lcm9PdXRwdXRRdWVyeSgpKS5zZXRUeFF1ZXJ5KE1vbmVyb1dhbGxldFJwYy5kZWNvbnRleHR1YWxpemUocXVlcnlOb3JtYWxpemVkLmNvcHkoKSkpO1xuICAgICAgbGV0IG91dHB1dHMgPSBhd2FpdCB0aGlzLmdldE91dHB1dHNBdXgob3V0cHV0UXVlcnlBdXgpO1xuICAgICAgXG4gICAgICAvLyBtZXJnZSBvdXRwdXQgdHhzIG9uZSB0aW1lIHdoaWxlIHJldGFpbmluZyBvcmRlclxuICAgICAgbGV0IG91dHB1dFR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIG91dHB1dHMpIHtcbiAgICAgICAgaWYgKCFvdXRwdXRUeHMuaW5jbHVkZXMob3V0cHV0LmdldFR4KCkpKSB7XG4gICAgICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgob3V0cHV0LmdldFR4KCksIHR4TWFwLCBibG9ja01hcCk7XG4gICAgICAgICAgb3V0cHV0VHhzLnB1c2gob3V0cHV0LmdldFR4KCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHJlc3RvcmUgdHJhbnNmZXIgYW5kIG91dHB1dCBxdWVyaWVzXG4gICAgcXVlcnlOb3JtYWxpemVkLnNldFRyYW5zZmVyUXVlcnkodHJhbnNmZXJRdWVyeSk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldElucHV0UXVlcnkoaW5wdXRRdWVyeSk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldE91dHB1dFF1ZXJ5KG91dHB1dFF1ZXJ5KTtcbiAgICBcbiAgICAvLyBmaWx0ZXIgdHhzIHRoYXQgZG9uJ3QgbWVldCB0cmFuc2ZlciBxdWVyeVxuICAgIGxldCB0eHNRdWVyaWVkID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBpZiAocXVlcnlOb3JtYWxpemVkLm1lZXRzQ3JpdGVyaWEodHgpKSB0eHNRdWVyaWVkLnB1c2godHgpO1xuICAgICAgZWxzZSBpZiAodHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB0eC5nZXRCbG9jaygpLmdldFR4cygpLnNwbGljZSh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpLCAxKTtcbiAgICB9XG4gICAgdHhzID0gdHhzUXVlcmllZDtcbiAgICBcbiAgICAvLyBzcGVjaWFsIGNhc2U6IHJlLWZldGNoIHR4cyBpZiBpbmNvbnNpc3RlbmN5IGNhdXNlZCBieSBuZWVkaW5nIHRvIG1ha2UgbXVsdGlwbGUgcnBjIGNhbGxzXG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSAmJiB0eC5nZXRCbG9jaygpID09PSB1bmRlZmluZWQgfHwgIXR4LmdldElzQ29uZmlybWVkKCkgJiYgdHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChtYXhBdHRlbXB0cyA8PSAxKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbmFibGUgdG8gYnVpbGQgY29uc2lzdGVudCB0eHMgZnJvbSBtdWx0aXBsZSBycGMgY2FsbHNcIik7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJJbmNvbnNpc3RlbmN5IGRldGVjdGVkIGJ1aWxkaW5nIHR4cyBmcm9tIG11bHRpcGxlIHJwYyBjYWxscywgcmUtZmV0Y2hpbmcgdHhzXCIpO1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRUeHNBdXgocXVlcnlOb3JtYWxpemVkLCBtYXhBdHRlbXB0cyAtIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBvcmRlciB0eHMgaWYgdHggaGFzaGVzIGdpdmVuIHRoZW4gcmV0dXJuXG4gICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKSAmJiBxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkubGVuZ3RoID4gMCkge1xuICAgICAgbGV0IHR4c0J5SWQgPSBuZXcgTWFwKCkgIC8vIHN0b3JlIHR4cyBpbiB0ZW1wb3JhcnkgbWFwIGZvciBzb3J0aW5nXG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4c0J5SWQuc2V0KHR4LmdldEhhc2goKSwgdHgpO1xuICAgICAgbGV0IG9yZGVyZWRUeHMgPSBbXTtcbiAgICAgIGZvciAobGV0IGhhc2ggb2YgcXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpKSBpZiAodHhzQnlJZC5nZXQoaGFzaCkpIG9yZGVyZWRUeHMucHVzaCh0eHNCeUlkLmdldChoYXNoKSk7XG4gICAgICB0eHMgPSBvcmRlcmVkVHhzO1xuICAgIH1cbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9UcmFuc2ZlcltdPiB7XG4gICAgXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIGdldCB0cmFuc2ZlcnMgZGlyZWN0bHkgaWYgcXVlcnkgZG9lcyBub3QgcmVxdWlyZSB0eCBjb250ZXh0IChvdGhlciB0cmFuc2ZlcnMsIG91dHB1dHMpXG4gICAgaWYgKCFNb25lcm9XYWxsZXRScGMuaXNDb250ZXh0dWFsKHF1ZXJ5Tm9ybWFsaXplZCkpIHJldHVybiB0aGlzLmdldFRyYW5zZmVyc0F1eChxdWVyeU5vcm1hbGl6ZWQpO1xuICAgIFxuICAgIC8vIG90aGVyd2lzZSBnZXQgdHhzIHdpdGggZnVsbCBtb2RlbHMgdG8gZnVsZmlsbCBxdWVyeVxuICAgIGxldCB0cmFuc2ZlcnMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLmdldFR4cyhxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpKSkge1xuICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZmlsdGVyVHJhbnNmZXJzKHF1ZXJ5Tm9ybWFsaXplZCkpIHtcbiAgICAgICAgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHJhbnNmZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9PdXRwdXRRdWVyeT4pOiBQcm9taXNlPE1vbmVyb091dHB1dFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZU91dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBnZXQgb3V0cHV0cyBkaXJlY3RseSBpZiBxdWVyeSBkb2VzIG5vdCByZXF1aXJlIHR4IGNvbnRleHQgKG90aGVyIG91dHB1dHMsIHRyYW5zZmVycylcbiAgICBpZiAoIU1vbmVyb1dhbGxldFJwYy5pc0NvbnRleHR1YWwocXVlcnlOb3JtYWxpemVkKSkgcmV0dXJuIHRoaXMuZ2V0T3V0cHV0c0F1eChxdWVyeU5vcm1hbGl6ZWQpO1xuICAgIFxuICAgIC8vIG90aGVyd2lzZSBnZXQgdHhzIHdpdGggZnVsbCBtb2RlbHMgdG8gZnVsZmlsbCBxdWVyeVxuICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5nZXRUeHMocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKSkpIHtcbiAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5maWx0ZXJPdXRwdXRzKHF1ZXJ5Tm9ybWFsaXplZCkpIHtcbiAgICAgICAgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRPdXRwdXRzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4cG9ydF9vdXRwdXRzXCIsIHthbGw6IGFsbH0pKS5yZXN1bHQub3V0cHV0c19kYXRhX2hleDtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW1wb3J0X291dHB1dHNcIiwge291dHB1dHNfZGF0YV9oZXg6IG91dHB1dHNIZXh9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQubnVtX2ltcG9ydGVkO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRLZXlJbWFnZXMoYWxsID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucnBjRXhwb3J0S2V5SW1hZ2VzKGFsbCk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydEtleUltYWdlcyhrZXlJbWFnZXM6IE1vbmVyb0tleUltYWdlW10sIG9mZnNldCA9IDApOiBQcm9taXNlPE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0PiB7XG4gICAgXG4gICAgLy8gY29udmVydCBrZXkgaW1hZ2VzIHRvIHJwYyBwYXJhbWV0ZXJcbiAgICBsZXQgcnBjS2V5SW1hZ2VzID0ga2V5SW1hZ2VzLm1hcChrZXlJbWFnZSA9PiAoe2tleV9pbWFnZToga2V5SW1hZ2UuZ2V0SGV4KCksIHNpZ25hdHVyZToga2V5SW1hZ2UuZ2V0U2lnbmF0dXJlKCl9KSk7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbXBvcnRfa2V5X2ltYWdlc1wiLCB7c2lnbmVkX2tleV9pbWFnZXM6IHJwY0tleUltYWdlcywgb2Zmc2V0OiBvZmZzZXR9KTtcbiAgICBcbiAgICAvLyBidWlsZCBhbmQgcmV0dXJuIHJlc3VsdFxuICAgIGxldCBpbXBvcnRSZXN1bHQgPSBuZXcgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQoKTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0SGVpZ2h0KHJlc3AucmVzdWx0LmhlaWdodCk7XG4gICAgaW1wb3J0UmVzdWx0LnNldFNwZW50QW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5zcGVudCkpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRVbnNwZW50QW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC51bnNwZW50KSk7XG4gICAgcmV0dXJuIGltcG9ydFJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLnJwY0V4cG9ydEtleUltYWdlcyhmYWxzZSkpLmdldEtleUltYWdlcygpO1xuICB9XG4gIFxuICBhc3luYyBmcmVlemVPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmcmVlemVcIiwge2tleV9pbWFnZToga2V5SW1hZ2V9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGhhd091dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInRoYXdcIiwge2tleV9pbWFnZToga2V5SW1hZ2V9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZnJvemVuXCIsIHtrZXlfaW1hZ2U6IGtleUltYWdlfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmZyb3plbiA9PT0gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIGdldERlZmF1bHRGZWVQcmlvcml0eSgpOiBQcm9taXNlPE1vbmVyb1R4UHJpb3JpdHk+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9kZWZhdWx0X2ZlZV9wcmlvcml0eVwiKTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQucHJpb3JpdHk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVR4cyhjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUsIGNvcHksIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpID09PSB1bmRlZmluZWQpIGNvbmZpZ05vcm1hbGl6ZWQuc2V0Q2FuU3BsaXQodHJ1ZSk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSA9PT0gdHJ1ZSAmJiBhd2FpdCB0aGlzLmlzTXVsdGlzaWcoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHJlbGF5IG11bHRpc2lnIHRyYW5zYWN0aW9uIHVudGlsIGNvLXNpZ25lZFwiKTtcblxuICAgIC8vIGRldGVybWluZSBhY2NvdW50IGFuZCBzdWJhZGRyZXNzZXMgdG8gc2VuZCBmcm9tXG4gICAgbGV0IGFjY291bnRJZHggPSBjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpO1xuICAgIGlmIChhY2NvdW50SWR4ID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSB0aGUgYWNjb3VudCBpbmRleCB0byBzZW5kIGZyb21cIik7XG4gICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkuc2xpY2UoMCk7IC8vIGZldGNoIGFsbCBvciBjb3B5IGdpdmVuIGluZGljZXNcbiAgICBcbiAgICAvLyBidWlsZCBjb25maWcgcGFyYW1ldGVyc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5kZXN0aW5hdGlvbnMgPSBbXTtcbiAgICBmb3IgKGxldCBkZXN0aW5hdGlvbiBvZiBjb25maWdOb3JtYWxpemVkLmdldERlc3RpbmF0aW9ucygpKSB7XG4gICAgICBhc3NlcnQoZGVzdGluYXRpb24uZ2V0QWRkcmVzcygpLCBcIkRlc3RpbmF0aW9uIGFkZHJlc3MgaXMgbm90IGRlZmluZWRcIik7XG4gICAgICBhc3NlcnQoZGVzdGluYXRpb24uZ2V0QW1vdW50KCksIFwiRGVzdGluYXRpb24gYW1vdW50IGlzIG5vdCBkZWZpbmVkXCIpO1xuICAgICAgcGFyYW1zLmRlc3RpbmF0aW9ucy5wdXNoKHsgYWRkcmVzczogZGVzdGluYXRpb24uZ2V0QWRkcmVzcygpLCBhbW91bnQ6IGRlc3RpbmF0aW9uLmdldEFtb3VudCgpLnRvU3RyaW5nKCkgfSk7XG4gICAgfVxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFN1YnRyYWN0RmVlRnJvbSgpKSBwYXJhbXMuc3VidHJhY3RfZmVlX2Zyb21fb3V0cHV0cyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCk7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBhY2NvdW50SWR4O1xuICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBzdWJhZGRyZXNzSW5kaWNlcztcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UGF5bWVudElkKCk7XG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSAhPT0gdHJ1ZTtcbiAgICBhc3NlcnQoY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpIDw9IDMpO1xuICAgIHBhcmFtcy5wcmlvcml0eSA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2hleCA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9tZXRhZGF0YSA9IHRydWU7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSkgcGFyYW1zLmdldF90eF9rZXlzID0gdHJ1ZTsgLy8gcGFyYW0gdG8gZ2V0IHR4IGtleShzKSBkZXBlbmRzIGlmIHNwbGl0XG4gICAgZWxzZSBwYXJhbXMuZ2V0X3R4X2tleSA9IHRydWU7XG5cbiAgICAvLyBjYW5ub3QgYXBwbHkgc3VidHJhY3RGZWVGcm9tIHdpdGggYHRyYW5zZmVyX3NwbGl0YCBjYWxsXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSAmJiBjb25maWdOb3JtYWxpemVkLmdldFN1YnRyYWN0RmVlRnJvbSgpICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkubGVuZ3RoID4gMCkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwic3VidHJhY3RmZWVmcm9tIHRyYW5zZmVycyBjYW5ub3QgYmUgc3BsaXQgb3ZlciBtdWx0aXBsZSB0cmFuc2FjdGlvbnMgeWV0XCIpO1xuICAgIH1cbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPyBcInRyYW5zZmVyX3NwbGl0XCIgOiBcInRyYW5zZmVyXCIsIHBhcmFtcyk7XG4gICAgICByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgaWYgKGVyci5tZXNzYWdlLmluZGV4T2YoXCJXQUxMRVRfUlBDX0VSUk9SX0NPREVfV1JPTkdfQUREUkVTU1wiKSA+IC0xKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIGRlc3RpbmF0aW9uIGFkZHJlc3NcIik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICAgIFxuICAgIC8vIHByZS1pbml0aWFsaXplIHR4cyBpZmYgcHJlc2VudC4gbXVsdGlzaWcgYW5kIHZpZXctb25seSB3YWxsZXRzIHdpbGwgaGF2ZSB0eCBzZXQgd2l0aG91dCB0cmFuc2FjdGlvbnNcbiAgICBsZXQgdHhzO1xuICAgIGxldCBudW1UeHMgPSBjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPyAocmVzdWx0LmZlZV9saXN0ICE9PSB1bmRlZmluZWQgPyByZXN1bHQuZmVlX2xpc3QubGVuZ3RoIDogMCkgOiAocmVzdWx0LmZlZSAhPT0gdW5kZWZpbmVkID8gMSA6IDApO1xuICAgIGlmIChudW1UeHMgPiAwKSB0eHMgPSBbXTtcbiAgICBsZXQgY29weURlc3RpbmF0aW9ucyA9IG51bVR4cyA9PT0gMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVR4czsgaSsrKSB7XG4gICAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICAgIE1vbmVyb1dhbGxldFJwYy5pbml0U2VudFR4V2FsbGV0KGNvbmZpZ05vcm1hbGl6ZWQsIHR4LCBjb3B5RGVzdGluYXRpb25zKTtcbiAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgICBpZiAoc3ViYWRkcmVzc0luZGljZXMgIT09IHVuZGVmaW5lZCAmJiBzdWJhZGRyZXNzSW5kaWNlcy5sZW5ndGggPT09IDEpIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICB0eHMucHVzaCh0eCk7XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCBzZXQgZnJvbSBycGMgcmVzcG9uc2Ugd2l0aCBwcmUtaW5pdGlhbGl6ZWQgdHhzXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSkgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzdWx0LCB0eHMsIGNvbmZpZ05vcm1hbGl6ZWQpLmdldFR4cygpO1xuICAgIGVsc2UgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhUb1R4U2V0KHJlc3VsdCwgdHhzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0eHNbMF0sIHRydWUsIGNvbmZpZ05vcm1hbGl6ZWQpLmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcE91dHB1dChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gYnVpbGQgcmVxdWVzdCBwYXJhbWV0ZXJzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmFkZHJlc3MgPSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpO1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gY29uZmlnLmdldEFjY291bnRJbmRleCgpO1xuICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKTtcbiAgICBwYXJhbXMua2V5X2ltYWdlID0gY29uZmlnLmdldEtleUltYWdlKCk7XG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpICE9PSB0cnVlO1xuICAgIGFzc2VydChjb25maWcuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnLmdldFByaW9yaXR5KCk7XG4gICAgcGFyYW1zLnBheW1lbnRfaWQgPSBjb25maWcuZ2V0UGF5bWVudElkKCk7XG4gICAgcGFyYW1zLmdldF90eF9rZXkgPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN3ZWVwX3NpbmdsZVwiLCBwYXJhbXMpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBcbiAgICAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIGlmIChjb25maWcuZ2V0UmVsYXkoKSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgXG4gICAgLy8gYnVpbGQgYW5kIHJldHVybiB0eFxuICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5pbml0U2VudFR4V2FsbGV0KGNvbmZpZywgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4VG9UeFNldChyZXN1bHQsIHR4LCB0cnVlLCBjb25maWcpO1xuICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKVswXS5zZXRBbW91bnQodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFtb3VudCgpKTsgLy8gaW5pdGlhbGl6ZSBkZXN0aW5hdGlvbiBhbW91bnRcbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwVW5sb2NrZWQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBzd2VlcDsgZGVmYXVsdCB0byBhbGwgd2l0aCB1bmxvY2tlZCBiYWxhbmNlIGlmIG5vdCBzcGVjaWZpZWRcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTsgIC8vIG1hcHMgZWFjaCBhY2NvdW50IGluZGV4IHRvIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBzd2VlcFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpbmRpY2VzLnNldChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpLCBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgICAgIGluZGljZXMuc2V0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3Nlcyhjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpKSkge1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgYWNjb3VudHMgPSBhd2FpdCB0aGlzLmdldEFjY291bnRzKHRydWUpO1xuICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiBhY2NvdW50cykge1xuICAgICAgICBpZiAoYWNjb3VudC5nZXRVbmxvY2tlZEJhbGFuY2UoKSA+IDBuKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgICAgICAgaW5kaWNlcy5zZXQoYWNjb3VudC5nZXRJbmRleCgpLCBzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpKSB7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSA+IDBuKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHN3ZWVwIGZyb20gZWFjaCBhY2NvdW50IGFuZCBjb2xsZWN0IHJlc3VsdGluZyB0eCBzZXRzXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGZvciAobGV0IGFjY291bnRJZHggb2YgaW5kaWNlcy5rZXlzKCkpIHtcbiAgICAgIFxuICAgICAgLy8gY29weSBhbmQgbW9kaWZ5IHRoZSBvcmlnaW5hbCBjb25maWdcbiAgICAgIGxldCBjb3B5ID0gY29uZmlnTm9ybWFsaXplZC5jb3B5KCk7XG4gICAgICBjb3B5LnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIGNvcHkuc2V0U3dlZXBFYWNoU3ViYWRkcmVzcyhmYWxzZSk7XG4gICAgICBcbiAgICAgIC8vIHN3ZWVwIGFsbCBzdWJhZGRyZXNzZXMgdG9nZXRoZXIgIC8vIFRPRE8gbW9uZXJvLXByb2plY3Q6IGNhbiB0aGlzIHJldmVhbCBvdXRwdXRzIGJlbG9uZyB0byB0aGUgc2FtZSB3YWxsZXQ/XG4gICAgICBpZiAoY29weS5nZXRTd2VlcEVhY2hTdWJhZGRyZXNzKCkgIT09IHRydWUpIHtcbiAgICAgICAgY29weS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhpbmRpY2VzLmdldChhY2NvdW50SWR4KSk7XG4gICAgICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMucnBjU3dlZXBBY2NvdW50KGNvcHkpKSB0eHMucHVzaCh0eCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIG90aGVyd2lzZSBzd2VlcCBlYWNoIHN1YmFkZHJlc3MgaW5kaXZpZHVhbGx5XG4gICAgICBlbHNlIHtcbiAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzc0lkeCBvZiBpbmRpY2VzLmdldChhY2NvdW50SWR4KSkge1xuICAgICAgICAgIGNvcHkuc2V0U3ViYWRkcmVzc0luZGljZXMoW3N1YmFkZHJlc3NJZHhdKTtcbiAgICAgICAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLnJwY1N3ZWVwQWNjb3VudChjb3B5KSkgdHhzLnB1c2godHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5PzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmIChyZWxheSA9PT0gdW5kZWZpbmVkKSByZWxheSA9IGZhbHNlO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfZHVzdFwiLCB7ZG9fbm90X3JlbGF5OiAhcmVsYXl9KTtcbiAgICBpZiAocmVsYXkpIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCk7XG4gICAgaWYgKHR4U2V0LmdldFR4cygpID09PSB1bmRlZmluZWQpIHJldHVybiBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkge1xuICAgICAgdHguc2V0SXNSZWxheWVkKCFyZWxheSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0eC5nZXRJc1JlbGF5ZWQoKSk7XG4gICAgfVxuICAgIHJldHVybiB0eFNldC5nZXRUeHMoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHModHhzT3JNZXRhZGF0YXM6IChNb25lcm9UeFdhbGxldCB8IHN0cmluZylbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eHNPck1ldGFkYXRhcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBvciB0aGVpciBtZXRhZGF0YSB0byByZWxheVwiKTtcbiAgICBsZXQgdHhIYXNoZXMgPSBbXTtcbiAgICBmb3IgKGxldCB0eE9yTWV0YWRhdGEgb2YgdHhzT3JNZXRhZGF0YXMpIHtcbiAgICAgIGxldCBtZXRhZGF0YSA9IHR4T3JNZXRhZGF0YSBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0ID8gdHhPck1ldGFkYXRhLmdldE1ldGFkYXRhKCkgOiB0eE9yTWV0YWRhdGE7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlbGF5X3R4XCIsIHsgaGV4OiBtZXRhZGF0YSB9KTtcbiAgICAgIHR4SGFzaGVzLnB1c2gocmVzcC5yZXN1bHQudHhfaGFzaCk7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMucG9sbCgpOyAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIHJldHVybiB0eEhhc2hlcztcbiAgfVxuICBcbiAgYXN5bmMgZGVzY3JpYmVUeFNldCh0eFNldDogTW9uZXJvVHhTZXQpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJkZXNjcmliZV90cmFuc2ZlclwiLCB7XG4gICAgICB1bnNpZ25lZF90eHNldDogdHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpLFxuICAgICAgbXVsdGlzaWdfdHhzZXQ6IHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKVxuICAgIH0pO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY0Rlc2NyaWJlVHJhbnNmZXIocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25fdHJhbnNmZXJcIiwge1xuICAgICAgdW5zaWduZWRfdHhzZXQ6IHVuc2lnbmVkVHhIZXgsXG4gICAgICBleHBvcnRfcmF3OiB0cnVlLFxuICAgICAgZ2V0X3R4X2tleXM6IHRydWVcbiAgICB9KTtcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4cyhzaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3VibWl0X3RyYW5zZmVyXCIsIHtcbiAgICAgIHR4X2RhdGFfaGV4OiBzaWduZWRUeEhleFxuICAgIH0pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC50eF9oYXNoX2xpc3Q7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgc2lnbmF0dXJlVHlwZSA9IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVksIGFjY291bnRJZHggPSAwLCBzdWJhZGRyZXNzSWR4ID0gMCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzaWduXCIsIHtcbiAgICAgICAgZGF0YTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlX3R5cGU6IHNpZ25hdHVyZVR5cGUgPT09IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVkgPyBcInNwZW5kXCIgOiBcInZpZXdcIixcbiAgICAgICAgYWNjb3VudF9pbmRleDogYWNjb3VudElkeCxcbiAgICAgICAgYWRkcmVzc19pbmRleDogc3ViYWRkcmVzc0lkeFxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gIH1cbiAgXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0PiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidmVyaWZ5XCIsIHtkYXRhOiBtZXNzYWdlLCBhZGRyZXNzOiBhZGRyZXNzLCBzaWduYXR1cmU6IHNpZ25hdHVyZX0pO1xuICAgICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KFxuICAgICAgICByZXN1bHQuZ29vZCA/IHtpc0dvb2Q6IHJlc3VsdC5nb29kLCBpc09sZDogcmVzdWx0Lm9sZCwgc2lnbmF0dXJlVHlwZTogcmVzdWx0LnNpZ25hdHVyZV90eXBlID09PSBcInZpZXdcIiA/IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9WSUVXX0tFWSA6IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVksIHZlcnNpb246IHJlc3VsdC52ZXJzaW9ufSA6IHtpc0dvb2Q6IGZhbHNlfVxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTIpIHJldHVybiBuZXcgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCh7aXNHb29kOiBmYWxzZX0pO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4S2V5KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHhfa2V5XCIsIHt0eGlkOiB0eEhhc2h9KSkucmVzdWx0LnR4X2tleTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2g6IHN0cmluZywgdHhLZXk6IHN0cmluZywgYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgdHJ5IHtcbiAgICAgIFxuICAgICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3R4X2tleVwiLCB7dHhpZDogdHhIYXNoLCB0eF9rZXk6IHR4S2V5LCBhZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgICBcbiAgICAgIC8vIGludGVycHJldCByZXN1bHRcbiAgICAgIGxldCBjaGVjayA9IG5ldyBNb25lcm9DaGVja1R4KCk7XG4gICAgICBjaGVjay5zZXRJc0dvb2QodHJ1ZSk7XG4gICAgICBjaGVjay5zZXROdW1Db25maXJtYXRpb25zKHJlc3AucmVzdWx0LmNvbmZpcm1hdGlvbnMpO1xuICAgICAgY2hlY2suc2V0SW5UeFBvb2wocmVzcC5yZXN1bHQuaW5fcG9vbCk7XG4gICAgICBjaGVjay5zZXRSZWNlaXZlZEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQucmVjZWl2ZWQpKTtcbiAgICAgIHJldHVybiBjaGVjaztcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHhfcHJvb2ZcIiwge3R4aWQ6IHR4SGFzaCwgYWRkcmVzczogYWRkcmVzcywgbWVzc2FnZTogbWVzc2FnZX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfdHhfcHJvb2ZcIiwge1xuICAgICAgICB0eGlkOiB0eEhhc2gsXG4gICAgICAgIGFkZHJlc3M6IGFkZHJlc3MsXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gaW50ZXJwcmV0IHJlc3BvbnNlXG4gICAgICBsZXQgaXNHb29kID0gcmVzcC5yZXN1bHQuZ29vZDtcbiAgICAgIGxldCBjaGVjayA9IG5ldyBNb25lcm9DaGVja1R4KCk7XG4gICAgICBjaGVjay5zZXRJc0dvb2QoaXNHb29kKTtcbiAgICAgIGlmIChpc0dvb2QpIHtcbiAgICAgICAgY2hlY2suc2V0TnVtQ29uZmlybWF0aW9ucyhyZXNwLnJlc3VsdC5jb25maXJtYXRpb25zKTtcbiAgICAgICAgY2hlY2suc2V0SW5UeFBvb2wocmVzcC5yZXN1bHQuaW5fcG9vbCk7XG4gICAgICAgIGNoZWNrLnNldFJlY2VpdmVkQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5yZWNlaXZlZCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNoZWNrO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTEgJiYgZS5tZXNzYWdlID09PSBcImJhc2ljX3N0cmluZ1wiKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiTXVzdCBwcm92aWRlIHNpZ25hdHVyZSB0byBjaGVjayB0eCBwcm9vZlwiLCAtMSk7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3NwZW5kX3Byb29mXCIsIHt0eGlkOiB0eEhhc2gsIG1lc3NhZ2U6IG1lc3NhZ2V9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrU3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3NwZW5kX3Byb29mXCIsIHtcbiAgICAgICAgdHhpZDogdHhIYXNoLFxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzaWduYXR1cmU6IHNpZ25hdHVyZVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuZ29vZDtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3Jlc2VydmVfcHJvb2ZcIiwge1xuICAgICAgYWxsOiB0cnVlLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBhbW91bnQ6IGJpZ2ludCwgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LFxuICAgICAgYW1vdW50OiBhbW91bnQudG9TdHJpbmcoKSxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICB9XG5cbiAgYXN5bmMgY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1Jlc2VydmU+IHtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3Jlc2VydmVfcHJvb2ZcIiwge1xuICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICBzaWduYXR1cmU6IHNpZ25hdHVyZVxuICAgIH0pO1xuICAgIFxuICAgIC8vIGludGVycHJldCByZXN1bHRzXG4gICAgbGV0IGlzR29vZCA9IHJlc3AucmVzdWx0Lmdvb2Q7XG4gICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrUmVzZXJ2ZSgpO1xuICAgIGNoZWNrLnNldElzR29vZChpc0dvb2QpO1xuICAgIGlmIChpc0dvb2QpIHtcbiAgICAgIGNoZWNrLnNldFVuY29uZmlybWVkU3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnNwZW50KSk7XG4gICAgICBjaGVjay5zZXRUb3RhbEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQudG90YWwpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoZWNrO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9ub3Rlc1wiLCB7dHhpZHM6IHR4SGFzaGVzfSkpLnJlc3VsdC5ub3RlcztcbiAgfVxuICBcbiAgYXN5bmMgc2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10sIG5vdGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF90eF9ub3Rlc1wiLCB7dHhpZHM6IHR4SGFzaGVzLCBub3Rlczogbm90ZXN9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9BZGRyZXNzQm9va0VudHJ5W10+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzX2Jvb2tcIiwge2VudHJpZXM6IGVudHJ5SW5kaWNlc30pO1xuICAgIGlmICghcmVzcC5yZXN1bHQuZW50cmllcykgcmV0dXJuIFtdO1xuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgZm9yIChsZXQgcnBjRW50cnkgb2YgcmVzcC5yZXN1bHQuZW50cmllcykge1xuICAgICAgZW50cmllcy5wdXNoKG5ldyBNb25lcm9BZGRyZXNzQm9va0VudHJ5KCkuc2V0SW5kZXgocnBjRW50cnkuaW5kZXgpLnNldEFkZHJlc3MocnBjRW50cnkuYWRkcmVzcykuc2V0RGVzY3JpcHRpb24ocnBjRW50cnkuZGVzY3JpcHRpb24pLnNldFBheW1lbnRJZChycGNFbnRyeS5wYXltZW50X2lkKSk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG4gIFxuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3M6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiYWRkX2FkZHJlc3NfYm9va1wiLCB7YWRkcmVzczogYWRkcmVzcywgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9ufSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmluZGV4O1xuICB9XG4gIFxuICBhc3luYyBlZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleDogbnVtYmVyLCBzZXRBZGRyZXNzOiBib29sZWFuLCBhZGRyZXNzOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNldERlc2NyaXB0aW9uOiBib29sZWFuLCBkZXNjcmlwdGlvbjogc3RyaW5nIHwgdW5kZWZpbmVkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJlZGl0X2FkZHJlc3NfYm9va1wiLCB7XG4gICAgICBpbmRleDogaW5kZXgsXG4gICAgICBzZXRfYWRkcmVzczogc2V0QWRkcmVzcyxcbiAgICAgIGFkZHJlc3M6IGFkZHJlc3MsXG4gICAgICBzZXRfZGVzY3JpcHRpb246IHNldERlc2NyaXB0aW9uLFxuICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uXG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHg6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImRlbGV0ZV9hZGRyZXNzX2Jvb2tcIiwge2luZGV4OiBlbnRyeUlkeH0pO1xuICB9XG4gIFxuICBhc3luYyB0YWdBY2NvdW50cyh0YWcsIGFjY291bnRJbmRpY2VzKSB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidGFnX2FjY291bnRzXCIsIHt0YWc6IHRhZywgYWNjb3VudHM6IGFjY291bnRJbmRpY2VzfSk7XG4gIH1cblxuICBhc3luYyB1bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInVudGFnX2FjY291bnRzXCIsIHthY2NvdW50czogYWNjb3VudEluZGljZXN9KTtcbiAgfVxuXG4gIGFzeW5jIGdldEFjY291bnRUYWdzKCk6IFByb21pc2U8TW9uZXJvQWNjb3VudFRhZ1tdPiB7XG4gICAgbGV0IHRhZ3MgPSBbXTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hY2NvdW50X3RhZ3NcIik7XG4gICAgaWYgKHJlc3AucmVzdWx0LmFjY291bnRfdGFncykge1xuICAgICAgZm9yIChsZXQgcnBjQWNjb3VudFRhZyBvZiByZXNwLnJlc3VsdC5hY2NvdW50X3RhZ3MpIHtcbiAgICAgICAgdGFncy5wdXNoKG5ldyBNb25lcm9BY2NvdW50VGFnKHtcbiAgICAgICAgICB0YWc6IHJwY0FjY291bnRUYWcudGFnID8gcnBjQWNjb3VudFRhZy50YWcgOiB1bmRlZmluZWQsXG4gICAgICAgICAgbGFiZWw6IHJwY0FjY291bnRUYWcubGFiZWwgPyBycGNBY2NvdW50VGFnLmxhYmVsIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGFjY291bnRJbmRpY2VzOiBycGNBY2NvdW50VGFnLmFjY291bnRzXG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhZ3M7XG4gIH1cblxuICBhc3luYyBzZXRBY2NvdW50VGFnTGFiZWwodGFnOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYWNjb3VudF90YWdfZGVzY3JpcHRpb25cIiwge3RhZzogdGFnLCBkZXNjcmlwdGlvbjogbGFiZWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWc6IE1vbmVyb1R4Q29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJtYWtlX3VyaVwiLCB7XG4gICAgICBhZGRyZXNzOiBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLFxuICAgICAgYW1vdW50OiBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QW1vdW50KCkgPyBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QW1vdW50KCkudG9TdHJpbmcoKSA6IHVuZGVmaW5lZCxcbiAgICAgIHBheW1lbnRfaWQ6IGNvbmZpZy5nZXRQYXltZW50SWQoKSxcbiAgICAgIHJlY2lwaWVudF9uYW1lOiBjb25maWcuZ2V0UmVjaXBpZW50TmFtZSgpLFxuICAgICAgdHhfZGVzY3JpcHRpb246IGNvbmZpZy5nZXROb3RlKClcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQudXJpO1xuICB9XG4gIFxuICBhc3luYyBwYXJzZVBheW1lbnRVcmkodXJpOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4Q29uZmlnPiB7XG4gICAgYXNzZXJ0KHVyaSwgXCJNdXN0IHByb3ZpZGUgVVJJIHRvIHBhcnNlXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicGFyc2VfdXJpXCIsIHt1cmk6IHVyaX0pO1xuICAgIGxldCBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoe2FkZHJlc3M6IHJlc3AucmVzdWx0LnVyaS5hZGRyZXNzLCBhbW91bnQ6IEJpZ0ludChyZXNwLnJlc3VsdC51cmkuYW1vdW50KX0pO1xuICAgIGNvbmZpZy5zZXRQYXltZW50SWQocmVzcC5yZXN1bHQudXJpLnBheW1lbnRfaWQpO1xuICAgIGNvbmZpZy5zZXRSZWNpcGllbnROYW1lKHJlc3AucmVzdWx0LnVyaS5yZWNpcGllbnRfbmFtZSk7XG4gICAgY29uZmlnLnNldE5vdGUocmVzcC5yZXN1bHQudXJpLnR4X2Rlc2NyaXB0aW9uKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSkgY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLnNldEFkZHJlc3ModW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldFBheW1lbnRJZCgpKSBjb25maWcuc2V0UGF5bWVudElkKHVuZGVmaW5lZCk7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXRSZWNpcGllbnROYW1lKCkpIGNvbmZpZy5zZXRSZWNpcGllbnROYW1lKHVuZGVmaW5lZCk7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXROb3RlKCkpIGNvbmZpZy5zZXROb3RlKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIGNvbmZpZztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QXR0cmlidXRlKGtleTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYXR0cmlidXRlXCIsIHtrZXk6IGtleX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnZhbHVlID09PSBcIlwiID8gdW5kZWZpbmVkIDogcmVzcC5yZXN1bHQudmFsdWU7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtNDUpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgc2V0QXR0cmlidXRlKGtleTogc3RyaW5nLCB2YWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9hdHRyaWJ1dGVcIiwge2tleToga2V5LCB2YWx1ZTogdmFsfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKG51bVRocmVhZHM6IG51bWJlciwgYmFja2dyb3VuZE1pbmluZz86IGJvb2xlYW4sIGlnbm9yZUJhdHRlcnk/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3RhcnRfbWluaW5nXCIsIHtcbiAgICAgIHRocmVhZHNfY291bnQ6IG51bVRocmVhZHMsXG4gICAgICBkb19iYWNrZ3JvdW5kX21pbmluZzogYmFja2dyb3VuZE1pbmluZyxcbiAgICAgIGlnbm9yZV9iYXR0ZXJ5OiBpZ25vcmVCYXR0ZXJ5XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3RvcF9taW5pbmdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiKTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQubXVsdGlzaWdfaW1wb3J0X25lZWRlZCA9PT0gdHJ1ZTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TXVsdGlzaWdJbmZvKCk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbmZvPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpc19tdWx0aXNpZ1wiKTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgbGV0IGluZm8gPSBuZXcgTW9uZXJvTXVsdGlzaWdJbmZvKCk7XG4gICAgaW5mby5zZXRJc011bHRpc2lnKHJlc3VsdC5tdWx0aXNpZyk7XG4gICAgaW5mby5zZXRJc1JlYWR5KHJlc3VsdC5yZWFkeSk7XG4gICAgaW5mby5zZXRUaHJlc2hvbGQocmVzdWx0LnRocmVzaG9sZCk7XG4gICAgaW5mby5zZXROdW1QYXJ0aWNpcGFudHMocmVzdWx0LnRvdGFsKTtcbiAgICByZXR1cm4gaW5mbztcbiAgfVxuICBcbiAgYXN5bmMgcHJlcGFyZU11bHRpc2lnKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJwcmVwYXJlX211bHRpc2lnXCIsIHtlbmFibGVfbXVsdGlzaWdfZXhwZXJpbWVudGFsOiB0cnVlfSk7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgcmV0dXJuIHJlc3VsdC5tdWx0aXNpZ19pbmZvO1xuICB9XG4gIFxuICBhc3luYyBtYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHRocmVzaG9sZDogbnVtYmVyLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfbXVsdGlzaWdcIiwge1xuICAgICAgbXVsdGlzaWdfaW5mbzogbXVsdGlzaWdIZXhlcyxcbiAgICAgIHRocmVzaG9sZDogdGhyZXNob2xkLFxuICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkXG4gICAgfSk7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQubXVsdGlzaWdfaW5mbztcbiAgfVxuICBcbiAgYXN5bmMgZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhjaGFuZ2VfbXVsdGlzaWdfa2V5c1wiLCB7bXVsdGlzaWdfaW5mbzogbXVsdGlzaWdIZXhlcywgcGFzc3dvcmQ6IHBhc3N3b3JkfSk7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICBsZXQgbXNSZXN1bHQgPSBuZXcgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0KCk7XG4gICAgbXNSZXN1bHQuc2V0QWRkcmVzcyhyZXNwLnJlc3VsdC5hZGRyZXNzKTtcbiAgICBtc1Jlc3VsdC5zZXRNdWx0aXNpZ0hleChyZXNwLnJlc3VsdC5tdWx0aXNpZ19pbmZvKTtcbiAgICBpZiAobXNSZXN1bHQuZ2V0QWRkcmVzcygpLmxlbmd0aCA9PT0gMCkgbXNSZXN1bHQuc2V0QWRkcmVzcyh1bmRlZmluZWQpO1xuICAgIGlmIChtc1Jlc3VsdC5nZXRNdWx0aXNpZ0hleCgpLmxlbmd0aCA9PT0gMCkgbXNSZXN1bHQuc2V0TXVsdGlzaWdIZXgodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gbXNSZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfbXVsdGlzaWdfaW5mb1wiKTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuaW5mbztcbiAgfVxuXG4gIGFzeW5jIGltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCByZWZyZXNoQWZ0ZXJJbXBvcnQ/OiBib29sZWFuKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAocmVmcmVzaEFmdGVySW1wb3J0ID09PSB1bmRlZmluZWQpIHJlZnJlc2hBZnRlckltcG9ydCA9IHRydWU7XG4gICAgaWYgKCFHZW5VdGlscy5pc0FycmF5KG11bHRpc2lnSGV4ZXMpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgc3RyaW5nW10gdG8gaW1wb3J0TXVsdGlzaWdIZXgoKVwiKVxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW1wb3J0X211bHRpc2lnX2luZm9cIiwge2luZm86IG11bHRpc2lnSGV4ZXMsIHJlZnJlc2hfYWZ0ZXJfaW1wb3J0OiByZWZyZXNoQWZ0ZXJJbXBvcnR9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQubl9vdXRwdXRzO1xuICB9XG5cbiAgYXN5bmMgc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25fbXVsdGlzaWdcIiwge3R4X2RhdGFfaGV4OiBtdWx0aXNpZ1R4SGV4fSk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCBzaWduUmVzdWx0ID0gbmV3IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCgpO1xuICAgIHNpZ25SZXN1bHQuc2V0U2lnbmVkTXVsdGlzaWdUeEhleChyZXN1bHQudHhfZGF0YV9oZXgpO1xuICAgIHNpZ25SZXN1bHQuc2V0VHhIYXNoZXMocmVzdWx0LnR4X2hhc2hfbGlzdCk7XG4gICAgcmV0dXJuIHNpZ25SZXN1bHQ7XG4gIH1cblxuICBhc3luYyBzdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN1Ym1pdF9tdWx0aXNpZ1wiLCB7dHhfZGF0YV9oZXg6IHNpZ25lZE11bHRpc2lnVHhIZXh9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQudHhfaGFzaF9saXN0O1xuICB9XG4gIFxuICBhc3luYyBjaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZDogc3RyaW5nLCBuZXdQYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoYW5nZV93YWxsZXRfcGFzc3dvcmRcIiwge29sZF9wYXNzd29yZDogb2xkUGFzc3dvcmQgfHwgXCJcIiwgbmV3X3Bhc3N3b3JkOiBuZXdQYXNzd29yZCB8fCBcIlwifSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNhdmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3RvcmVcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGNsb3NlKHNhdmUgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN1cGVyLmNsb3NlKHNhdmUpO1xuICAgIGlmIChzYXZlID09PSB1bmRlZmluZWQpIHNhdmUgPSBmYWxzZTtcbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2xvc2Vfd2FsbGV0XCIsIHthdXRvc2F2ZV9jdXJyZW50OiBzYXZlfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ2xvc2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFByaW1hcnlBZGRyZXNzKCk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICByZXR1cm4gZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtMTMgJiYgZS5tZXNzYWdlLmluZGV4T2YoXCJObyB3YWxsZXQgZmlsZVwiKSA+IC0xO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTYXZlIGFuZCBjbG9zZSB0aGUgY3VycmVudCB3YWxsZXQgYW5kIHN0b3AgdGhlIFJQQyBzZXJ2ZXIuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3RvcF93YWxsZXRcIik7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tIEFERCBKU0RPQyBGT1IgU1VQUE9SVEVEIERFRkFVTFQgSU1QTEVNRU5UQVRJT05TIC0tLS0tLS0tLS0tLS0tXG5cbiAgYXN5bmMgZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTogUHJvbWlzZTxudW1iZXJbXXx1bmRlZmluZWQ+IHsgcmV0dXJuIHN1cGVyLmdldE51bUJsb2Nrc1RvVW5sb2NrKCk7IH1cbiAgYXN5bmMgZ2V0VHgodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0fHVuZGVmaW5lZD4geyByZXR1cm4gc3VwZXIuZ2V0VHgodHhIYXNoKTsgfVxuICBhc3luYyBnZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdPiB7IHJldHVybiBzdXBlci5nZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeSk7IH1cbiAgYXN5bmMgZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pIHsgcmV0dXJuIHN1cGVyLmdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBjcmVhdGVUeChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4geyByZXR1cm4gc3VwZXIuY3JlYXRlVHgoY29uZmlnKTsgfVxuICBhc3luYyByZWxheVR4KHR4T3JNZXRhZGF0YTogTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIucmVsYXlUeCh0eE9yTWV0YWRhdGEpOyB9XG4gIGFzeW5jIGdldFR4Tm90ZSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5nZXRUeE5vdGUodHhIYXNoKTsgfVxuICBhc3luYyBzZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcsIG5vdGU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4geyByZXR1cm4gc3VwZXIuc2V0VHhOb3RlKHR4SGFzaCwgbm90ZSk7IH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgc3RhdGljIGFzeW5jIGNvbm5lY3RUb1dhbGxldFJwYyh1cmlPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPiB8IHN0cmluZ1tdLCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICAgIGxldCBjb25maWcgPSBNb25lcm9XYWxsZXRScGMubm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnLCB1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgIGlmIChjb25maWcuY21kKSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLnN0YXJ0V2FsbGV0UnBjUHJvY2Vzcyhjb25maWcpO1xuICAgIGVsc2UgcmV0dXJuIG5ldyBNb25lcm9XYWxsZXRScGMoY29uZmlnKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBzdGFydFdhbGxldFJwY1Byb2Nlc3MoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICAgIGFzc2VydChHZW5VdGlscy5pc0FycmF5KGNvbmZpZy5jbWQpLCBcIk11c3QgcHJvdmlkZSBzdHJpbmcgYXJyYXkgd2l0aCBjb21tYW5kIGxpbmUgcGFyYW1ldGVyc1wiKTtcbiAgICBcbiAgICAvLyBzdGFydCBwcm9jZXNzXG4gICAgbGV0IGNoaWxkX3Byb2Nlc3MgPSBhd2FpdCBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpO1xuICAgIGNvbnN0IGNoaWxkUHJvY2VzcyA9IGNoaWxkX3Byb2Nlc3Muc3Bhd24oY29uZmlnLmNtZFswXSwgY29uZmlnLmNtZC5zbGljZSgxKSwge1xuICAgICAgZW52OiB7IC4uLnByb2Nlc3MuZW52LCBMQU5HOiAnZW5fVVMuVVRGLTgnIH0gLy8gc2NyYXBlIG91dHB1dCBpbiBlbmdsaXNoXG4gICAgfSk7XG4gICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIGNoaWxkUHJvY2Vzcy5zdGRlcnIuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBcbiAgICAvLyByZXR1cm4gcHJvbWlzZSB3aGljaCByZXNvbHZlcyBhZnRlciBzdGFydGluZyBtb25lcm8td2FsbGV0LXJwY1xuICAgIGxldCB1cmk7XG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIGxldCBvdXRwdXQgPSBcIlwiO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHN0ZG91dFxuICAgICAgICBjaGlsZFByb2Nlc3Muc3Rkb3V0Lm9uKCdkYXRhJywgYXN5bmMgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGxldCBsaW5lID0gZGF0YS50b1N0cmluZygpO1xuICAgICAgICAgIExpYnJhcnlVdGlscy5sb2coMiwgbGluZSk7XG4gICAgICAgICAgb3V0cHV0ICs9IGxpbmUgKyAnXFxuJzsgLy8gY2FwdHVyZSBvdXRwdXQgaW4gY2FzZSBvZiBlcnJvclxuICAgICAgICAgIFxuICAgICAgICAgIC8vIGV4dHJhY3QgdXJpIGZyb20gZS5nLiBcIkkgQmluZGluZyBvbiAxMjcuMC4wLjEgKElQdjQpOjM4MDg1XCJcbiAgICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zID0gXCJCaW5kaW5nIG9uIFwiO1xuICAgICAgICAgIGxldCB1cmlMaW5lQ29udGFpbnNJZHggPSBsaW5lLmluZGV4T2YodXJpTGluZUNvbnRhaW5zKTtcbiAgICAgICAgICBpZiAodXJpTGluZUNvbnRhaW5zSWR4ID49IDApIHtcbiAgICAgICAgICAgIGxldCBob3N0ID0gbGluZS5zdWJzdHJpbmcodXJpTGluZUNvbnRhaW5zSWR4ICsgdXJpTGluZUNvbnRhaW5zLmxlbmd0aCwgbGluZS5sYXN0SW5kZXhPZignICcpKTtcbiAgICAgICAgICAgIGxldCB1bmZvcm1hdHRlZExpbmUgPSBsaW5lLnJlcGxhY2UoL1xcdTAwMWJcXFsuKj9tL2csICcnKS50cmltKCk7IC8vIHJlbW92ZSBjb2xvciBmb3JtYXR0aW5nXG4gICAgICAgICAgICBsZXQgcG9ydCA9IHVuZm9ybWF0dGVkTGluZS5zdWJzdHJpbmcodW5mb3JtYXR0ZWRMaW5lLmxhc3RJbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICAgIGxldCBzc2xJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXJwYy1zc2xcIik7XG4gICAgICAgICAgICBsZXQgc3NsRW5hYmxlZCA9IHNzbElkeCA+PSAwID8gXCJlbmFibGVkXCIgPT0gY29uZmlnLmNtZFtzc2xJZHggKyAxXS50b0xvd2VyQ2FzZSgpIDogZmFsc2U7XG4gICAgICAgICAgICB1cmkgPSAoc3NsRW5hYmxlZCA/IFwiaHR0cHNcIiA6IFwiaHR0cFwiKSArIFwiOi8vXCIgKyBob3N0ICsgXCI6XCIgKyBwb3J0O1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyByZWFkIHN1Y2Nlc3MgbWVzc2FnZVxuICAgICAgICAgIGlmIChsaW5lLmluZGV4T2YoXCJTdGFydGluZyB3YWxsZXQgUlBDIHNlcnZlclwiKSA+PSAwKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGdldCB1c2VybmFtZSwgcGFzc3dvcmQsIHptcSBwdWJsaXNoIHVyaSwgYW5kIHByb3h5IHVyaSBmcm9tIHBhcmFtc1xuICAgICAgICAgICAgbGV0IHVzZXJQYXNzSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtbG9naW5cIik7XG4gICAgICAgICAgICBsZXQgdXNlclBhc3MgPSB1c2VyUGFzc0lkeCA+PSAwID8gY29uZmlnLmNtZFt1c2VyUGFzc0lkeCArIDFdIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHVzZXJuYW1lID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZygwLCB1c2VyUGFzcy5pbmRleE9mKCc6JykpO1xuICAgICAgICAgICAgbGV0IHBhc3N3b3JkID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZyh1c2VyUGFzcy5pbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICAgIGxldCB6bXFVcmlJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXptcS1wdWJcIik7XG4gICAgICAgICAgICBsZXQgem1xVXJpID0gem1xVXJpSWR4ID49IDAgPyBjb25maWcuY21kW3ptcVVyaUlkeCArIDFdIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHByb3h5VXJpSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1wcm94eVwiKTtcbiAgICAgICAgICAgIHRoaXMuc3RhcnR1cFByb3h5VXJpID0gcHJveHlVcmlJZHggPj0gMCA/IGNvbmZpZy5jbWRbcHJveHlVcmlJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gY3JlYXRlIGNsaWVudCBjb25uZWN0ZWQgdG8gaW50ZXJuYWwgcHJvY2Vzc1xuICAgICAgICAgICAgY29uZmlnID0gY29uZmlnLmNvcHkoKS5zZXRTZXJ2ZXIoe3VyaTogdXJpLCB1c2VybmFtZTogdXNlcm5hbWUsIHBhc3N3b3JkOiBwYXNzd29yZCwgem1xVXJpOiB6bXFVcmksIHByb3h5VXJpOiB0aGlzLnN0YXJ0dXBQcm94eVVyaSwgcmVqZWN0VW5hdXRob3JpemVkOiBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWR9KTtcbiAgICAgICAgICAgIGNvbmZpZy5jbWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0UnBjLmNvbm5lY3RUb1dhbGxldFJwYyhjb25maWcpO1xuICAgICAgICAgICAgd2FsbGV0LnByb2Nlc3MgPSBjaGlsZFByb2Nlc3M7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHJlc29sdmUgcHJvbWlzZSB3aXRoIGNsaWVudCBjb25uZWN0ZWQgdG8gaW50ZXJuYWwgcHJvY2VzcyBcbiAgICAgICAgICAgIHRoaXMuaXNSZXNvbHZlZCA9IHRydWU7XG4gICAgICAgICAgICByZXNvbHZlKHdhbGxldCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRlcnJcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5vbignZGF0YScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgY29uc29sZS5lcnJvcihkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXhpdFxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJleGl0XCIsIGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIHByb2Nlc3MgdGVybWluYXRlZCB3aXRoIGV4aXQgY29kZSBcIiArIGNvZGUgKyAob3V0cHV0ID8gXCI6XFxuXFxuXCIgKyBvdXRwdXQgOiBcIlwiKSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBlcnJvclxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJlcnJvclwiLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIkVOT0VOVFwiKSA+PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgZXhpc3QgYXQgcGF0aCAnXCIgKyBjb25maWcuY21kWzBdICsgXCInXCIpKTtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHVuY2F1Z2h0IGV4Y2VwdGlvblxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCBmdW5jdGlvbihlcnIsIG9yaWdpbikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmNhdWdodCBleGNlcHRpb24gaW4gbW9uZXJvLXdhbGxldC1ycGMgcHJvY2VzczogXCIgKyBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihvcmlnaW4pO1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjbGVhcigpIHtcbiAgICB0aGlzLmxpc3RlbmVyR2VuZXJhdGlvbisrO1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlcikgdGhpcy53YWxsZXRQb2xsZXIucmVzZXQoKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgICBkZWxldGUgdGhpcy5hZGRyZXNzQ2FjaGU7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICB0aGlzLnBhdGggPSB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRBY2NvdW50SW5kaWNlcyhnZXRTdWJhZGRyZXNzSW5kaWNlcz86IGFueSkge1xuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpO1xuICAgIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgdGhpcy5nZXRBY2NvdW50cygpKSB7XG4gICAgICBpbmRpY2VzLnNldChhY2NvdW50LmdldEluZGV4KCksIGdldFN1YmFkZHJlc3NJbmRpY2VzID8gYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzSW5kaWNlcyhhY2NvdW50LmdldEluZGV4KCkpIDogdW5kZWZpbmVkKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZGljZXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRTdWJhZGRyZXNzSW5kaWNlcyhhY2NvdW50SWR4KSB7XG4gICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc1wiLCB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeH0pO1xuICAgIGZvciAobGV0IGFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQuYWRkcmVzc2VzKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKGFkZHJlc3MuYWRkcmVzc19pbmRleCk7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3NJbmRpY2VzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0VHJhbnNmZXJzQXV4KHF1ZXJ5OiBNb25lcm9UcmFuc2ZlclF1ZXJ5KSB7XG4gICAgXG4gICAgLy8gYnVpbGQgcGFyYW1zIGZvciBnZXRfdHJhbnNmZXJzIHJwYyBjYWxsXG4gICAgbGV0IHR4UXVlcnkgPSBxdWVyeS5nZXRUeFF1ZXJ5KCk7XG4gICAgbGV0IGNhbkJlQ29uZmlybWVkID0gdHhRdWVyeS5nZXRJc0NvbmZpcm1lZCgpICE9PSBmYWxzZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJc0ZhaWxlZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SXNSZWxheWVkKCkgIT09IGZhbHNlO1xuICAgIGxldCBjYW5CZUluVHhQb29sID0gdHhRdWVyeS5nZXRJc0NvbmZpcm1lZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJc0ZhaWxlZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCAmJiB0eFF1ZXJ5LmdldE1heEhlaWdodCgpID09PSB1bmRlZmluZWQgJiYgdHhRdWVyeS5nZXRJc0xvY2tlZCgpICE9PSBmYWxzZTtcbiAgICBsZXQgY2FuQmVJbmNvbWluZyA9IHF1ZXJ5LmdldElzSW5jb21pbmcoKSAhPT0gZmFsc2UgJiYgcXVlcnkuZ2V0SXNPdXRnb2luZygpICE9PSB0cnVlICYmIHF1ZXJ5LmdldEhhc0Rlc3RpbmF0aW9ucygpICE9PSB0cnVlO1xuICAgIGxldCBjYW5CZU91dGdvaW5nID0gcXVlcnkuZ2V0SXNPdXRnb2luZygpICE9PSBmYWxzZSAmJiBxdWVyeS5nZXRJc0luY29taW5nKCkgIT09IHRydWU7XG5cbiAgICAvLyBjaGVjayBpZiBmZXRjaGluZyBwb29sIHR4cyBjb250cmFkaWN0ZWQgYnkgY29uZmlndXJhdGlvblxuICAgIGlmICh0eFF1ZXJ5LmdldEluVHhQb29sKCkgPT09IHRydWUgJiYgIWNhbkJlSW5UeFBvb2wpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBmZXRjaCBwb29sIHRyYW5zYWN0aW9ucyBiZWNhdXNlIGl0IGNvbnRyYWRpY3RzIGNvbmZpZ3VyYXRpb25cIik7XG4gICAgfVxuXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmluID0gY2FuQmVJbmNvbWluZyAmJiBjYW5CZUNvbmZpcm1lZDtcbiAgICBwYXJhbXMub3V0ID0gY2FuQmVPdXRnb2luZyAmJiBjYW5CZUNvbmZpcm1lZDtcbiAgICBwYXJhbXMucG9vbCA9IGNhbkJlSW5jb21pbmcgJiYgY2FuQmVJblR4UG9vbDtcbiAgICBwYXJhbXMucGVuZGluZyA9IGNhbkJlT3V0Z29pbmcgJiYgY2FuQmVJblR4UG9vbDtcbiAgICBwYXJhbXMuZmFpbGVkID0gdHhRdWVyeS5nZXRJc0ZhaWxlZCgpICE9PSBmYWxzZSAmJiB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9IHRydWU7XG4gICAgaWYgKHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgPiAwKSBwYXJhbXMubWluX2hlaWdodCA9IHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgLSAxOyAvLyBUT0RPIG1vbmVyby1wcm9qZWN0OiB3YWxsZXQyOjpnZXRfcGF5bWVudHMoKSBtaW5faGVpZ2h0IGlzIGV4Y2x1c2l2ZSwgc28gbWFudWFsbHkgb2Zmc2V0IHRvIG1hdGNoIGludGVuZGVkIHJhbmdlIChpc3N1ZXMgIzU3NTEsICM1NTk4KVxuICAgICAgZWxzZSBwYXJhbXMubWluX2hlaWdodCA9IHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCk7XG4gICAgfVxuICAgIGlmICh0eFF1ZXJ5LmdldE1heEhlaWdodCgpICE9PSB1bmRlZmluZWQpIHBhcmFtcy5tYXhfaGVpZ2h0ID0gdHhRdWVyeS5nZXRNYXhIZWlnaHQoKTtcbiAgICBwYXJhbXMuZmlsdGVyX2J5X2hlaWdodCA9IHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCB8fCB0eFF1ZXJ5LmdldE1heEhlaWdodCgpICE9PSB1bmRlZmluZWQ7XG4gICAgaWYgKHF1ZXJ5LmdldEFjY291bnRJbmRleCgpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSA9PT0gdW5kZWZpbmVkICYmIHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCwgXCJRdWVyeSBzcGVjaWZpZXMgYSBzdWJhZGRyZXNzIGluZGV4IGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKTtcbiAgICAgIHBhcmFtcy5hbGxfYWNjb3VudHMgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IHF1ZXJ5LmdldEFjY291bnRJbmRleCgpO1xuICAgICAgXG4gICAgICAvLyBzZXQgc3ViYWRkcmVzcyBpbmRpY2VzIHBhcmFtXG4gICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBuZXcgU2V0KCk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkgIT09IHVuZGVmaW5lZCkgc3ViYWRkcmVzc0luZGljZXMuYWRkKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQpIHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubWFwKHN1YmFkZHJlc3NJZHggPT4gc3ViYWRkcmVzc0luZGljZXMuYWRkKHN1YmFkZHJlc3NJZHgpKTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcy5zaXplKSBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gQXJyYXkuZnJvbShzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHVuaXF1ZSB0eHMgYW5kIGJsb2Nrc1xuICAgIGxldCB0eE1hcCA9IHt9O1xuICAgIGxldCBibG9ja01hcCA9IHt9O1xuICAgIFxuICAgIC8vIGJ1aWxkIHR4cyB1c2luZyBgZ2V0X3RyYW5zZmVyc2BcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90cmFuc2ZlcnNcIiwgcGFyYW1zKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocmVzcC5yZXN1bHQpKSB7XG4gICAgICBmb3IgKGxldCBycGNUeCBvZiByZXNwLnJlc3VsdFtrZXldKSB7XG4gICAgICAgIC8vaWYgKHJwY1R4LnR4aWQgPT09IHF1ZXJ5LmRlYnVnVHhJZCkgY29uc29sZS5sb2cocnBjVHgpO1xuICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4KTtcbiAgICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIGFzc2VydCh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpID4gLTEpO1xuICAgICAgICBcbiAgICAgICAgLy8gcmVwbGFjZSB0cmFuc2ZlciBhbW91bnQgd2l0aCBkZXN0aW5hdGlvbiBzdW1cbiAgICAgICAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogY29uZmlybWVkIHR4IGZyb20vdG8gc2FtZSBhY2NvdW50IGhhcyBhbW91bnQgMCBidXQgY2FjaGVkIHRyYW5zZmVyc1xuICAgICAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICE9PSB1bmRlZmluZWQgJiYgdHguZ2V0SXNSZWxheWVkKCkgJiYgIXR4LmdldElzRmFpbGVkKCkgJiZcbiAgICAgICAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKSAmJiB0eC5nZXRPdXRnb2luZ0Ftb3VudCgpID09PSAwbikge1xuICAgICAgICAgIGxldCBvdXRnb2luZ1RyYW5zZmVyID0gdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpO1xuICAgICAgICAgIGxldCB0cmFuc2ZlclRvdGFsID0gQmlnSW50KDApO1xuICAgICAgICAgIGZvciAobGV0IGRlc3RpbmF0aW9uIG9mIG91dGdvaW5nVHJhbnNmZXIuZ2V0RGVzdGluYXRpb25zKCkpIHRyYW5zZmVyVG90YWwgPSB0cmFuc2ZlclRvdGFsICsgZGVzdGluYXRpb24uZ2V0QW1vdW50KCk7XG4gICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFtb3VudCh0cmFuc2ZlclRvdGFsKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gbWVyZ2UgdHhcbiAgICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHNvcnQgdHhzIGJ5IGJsb2NrIGhlaWdodFxuICAgIGxldCB0eHM6IE1vbmVyb1R4V2FsbGV0W10gPSBPYmplY3QudmFsdWVzKHR4TWFwKTtcbiAgICB0eHMuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KTtcbiAgICBcbiAgICAvLyBmaWx0ZXIgYW5kIHJldHVybiB0cmFuc2ZlcnNcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBcbiAgICAgIC8vIHR4IGlzIG5vdCBpbmNvbWluZy9vdXRnb2luZyB1bmxlc3MgYWxyZWFkeSBzZXRcbiAgICAgIGlmICh0eC5nZXRJc0luY29taW5nKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNJbmNvbWluZyhmYWxzZSk7XG4gICAgICBpZiAodHguZ2V0SXNPdXRnb2luZygpID09PSB1bmRlZmluZWQpIHR4LnNldElzT3V0Z29pbmcoZmFsc2UpO1xuICAgICAgXG4gICAgICAvLyBzb3J0IGluY29taW5nIHRyYW5zZmVyc1xuICAgICAgaWYgKHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgIT09IHVuZGVmaW5lZCkgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKS5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlSW5jb21pbmdUcmFuc2ZlcnMpO1xuICAgICAgXG4gICAgICAvLyBjb2xsZWN0IHF1ZXJpZWQgdHJhbnNmZXJzLCBlcmFzZSBpZiBleGNsdWRlZFxuICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZmlsdGVyVHJhbnNmZXJzKHF1ZXJ5KSkge1xuICAgICAgICB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIHJlbW92ZSB0eHMgd2l0aG91dCByZXF1ZXN0ZWQgdHJhbnNmZXJcbiAgICAgIGlmICh0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQgJiYgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpID09PSB1bmRlZmluZWQgJiYgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHJhbnNmZXJzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0T3V0cHV0c0F1eChxdWVyeSkge1xuICAgIFxuICAgIC8vIGRldGVybWluZSBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMgdG8gYmUgcXVlcmllZFxuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpO1xuICAgIGlmIChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBuZXcgU2V0KCk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkgIT09IHVuZGVmaW5lZCkgc3ViYWRkcmVzc0luZGljZXMuYWRkKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQpIHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubWFwKHN1YmFkZHJlc3NJZHggPT4gc3ViYWRkcmVzc0luZGljZXMuYWRkKHN1YmFkZHJlc3NJZHgpKTtcbiAgICAgIGluZGljZXMuc2V0KHF1ZXJ5LmdldEFjY291bnRJbmRleCgpLCBzdWJhZGRyZXNzSW5kaWNlcy5zaXplID8gQXJyYXkuZnJvbShzdWJhZGRyZXNzSW5kaWNlcykgOiB1bmRlZmluZWQpOyAgLy8gdW5kZWZpbmVkIHdpbGwgZmV0Y2ggZnJvbSBhbGwgc3ViYWRkcmVzc2VzXG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2VydC5lcXVhbChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSwgdW5kZWZpbmVkLCBcIlF1ZXJ5IHNwZWNpZmllcyBhIHN1YmFkZHJlc3MgaW5kZXggYnV0IG5vdCBhbiBhY2NvdW50IGluZGV4XCIpXG4gICAgICBhc3NlcnQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkIHx8IHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwLCBcIlF1ZXJ5IHNwZWNpZmllcyBzdWJhZGRyZXNzIGluZGljZXMgYnV0IG5vdCBhbiBhY2NvdW50IGluZGV4XCIpO1xuICAgICAgaW5kaWNlcyA9IGF3YWl0IHRoaXMuZ2V0QWNjb3VudEluZGljZXMoKTsgIC8vIGZldGNoIGFsbCBhY2NvdW50IGluZGljZXMgd2l0aG91dCBzdWJhZGRyZXNzZXNcbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgdW5pcXVlIHR4cyBhbmQgYmxvY2tzXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgXG4gICAgLy8gY29sbGVjdCB0eHMgd2l0aCBvdXRwdXRzIGZvciBlYWNoIGluZGljYXRlZCBhY2NvdW50IHVzaW5nIGBpbmNvbWluZ190cmFuc2ZlcnNgIHJwYyBjYWxsXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLnRyYW5zZmVyX3R5cGUgPSBxdWVyeS5nZXRJc1NwZW50KCkgPT09IHRydWUgPyBcInVuYXZhaWxhYmxlXCIgOiBxdWVyeS5nZXRJc1NwZW50KCkgPT09IGZhbHNlID8gXCJhdmFpbGFibGVcIiA6IFwiYWxsXCI7XG4gICAgcGFyYW1zLnZlcmJvc2UgPSB0cnVlO1xuICAgIGZvciAobGV0IGFjY291bnRJZHggb2YgaW5kaWNlcy5rZXlzKCkpIHtcbiAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBhY2NvdW50SWR4O1xuICAgICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGluZGljZXMuZ2V0KGFjY291bnRJZHgpO1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbmNvbWluZ190cmFuc2ZlcnNcIiwgcGFyYW1zKTtcbiAgICAgIFxuICAgICAgLy8gY29udmVydCByZXNwb25zZSB0byB0eHMgd2l0aCBvdXRwdXRzIGFuZCBtZXJnZVxuICAgICAgaWYgKHJlc3AucmVzdWx0LnRyYW5zZmVycyA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcbiAgICAgIGZvciAobGV0IHJwY091dHB1dCBvZiByZXNwLnJlc3VsdC50cmFuc2ZlcnMpIHtcbiAgICAgICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhPdXRwdXQocnBjT3V0cHV0KTtcbiAgICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHNvcnQgdHhzIGJ5IGJsb2NrIGhlaWdodFxuICAgIGxldCB0eHM6IE1vbmVyb1R4V2FsbGV0W10gPSBPYmplY3QudmFsdWVzKHR4TWFwKTtcbiAgICB0eHMuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHF1ZXJpZWQgb3V0cHV0c1xuICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBcbiAgICAgIC8vIHNvcnQgb3V0cHV0c1xuICAgICAgaWYgKHR4LmdldE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0eC5nZXRPdXRwdXRzKCkuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZU91dHB1dHMpO1xuICAgICAgXG4gICAgICAvLyBjb2xsZWN0IHF1ZXJpZWQgb3V0cHV0cywgZXJhc2UgaWYgZXhjbHVkZWRcbiAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5maWx0ZXJPdXRwdXRzKHF1ZXJ5KSkgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgICBcbiAgICAgIC8vIHJlbW92ZSBleGNsdWRlZCB0eHMgZnJvbSBibG9ja1xuICAgICAgaWYgKHR4LmdldE91dHB1dHMoKSA9PT0gdW5kZWZpbmVkICYmIHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0eC5nZXRCbG9jaygpLmdldFR4cygpLnNwbGljZSh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dHM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21tb24gbWV0aG9kIHRvIGdldCBrZXkgaW1hZ2VzLlxuICAgKiBcbiAgICogQHBhcmFtIGFsbCAtIHBlY2lmaWVzIHRvIGdldCBhbGwgeG9yIG9ubHkgbmV3IGltYWdlcyBmcm9tIGxhc3QgaW1wb3J0XG4gICAqIEByZXR1cm4ge01vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0fSB0aGUga2V5IGltYWdlcyBhbmQgdGhlaXIgb2Zmc2V0IGFtb25nIHRoZSB3YWxsZXQncyBvdXRwdXRzXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgcnBjRXhwb3J0S2V5SW1hZ2VzKGFsbCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4cG9ydF9rZXlfaW1hZ2VzXCIsIHthbGw6IGFsbH0pO1xuICAgIGxldCBrZXlJbWFnZXMgPSAocmVzcC5yZXN1bHQuc2lnbmVkX2tleV9pbWFnZXMgfHwgW10pLm1hcChycGNJbWFnZSA9PiBuZXcgTW9uZXJvS2V5SW1hZ2UocnBjSW1hZ2Uua2V5X2ltYWdlLCBycGNJbWFnZS5zaWduYXR1cmUpKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0KCkuc2V0T2Zmc2V0KHJlc3AucmVzdWx0Lm9mZnNldCkuc2V0S2V5SW1hZ2VzKGtleUltYWdlcyk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBycGNTd2VlcEFjY291bnQoY29uZmlnOiBNb25lcm9UeENvbmZpZykge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN3ZWVwIGNvbmZpZ1wiKTtcbiAgICBpZiAoY29uZmlnLmdldEFjY291bnRJbmRleCgpID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBhbiBhY2NvdW50IGluZGV4IHRvIHN3ZWVwIGZyb21cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGggIT0gMSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGV4YWN0bHkgb25lIGRlc3RpbmF0aW9uIHRvIHN3ZWVwIHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBkZXN0aW5hdGlvbiBhZGRyZXNzIHRvIHN3ZWVwIHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QW1vdW50KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgYW1vdW50IGluIHN3ZWVwIGNvbmZpZ1wiKTtcbiAgICBpZiAoY29uZmlnLmdldEtleUltYWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiS2V5IGltYWdlIGRlZmluZWQ7IHVzZSBzd2VlcE91dHB1dCgpIHRvIHN3ZWVwIGFuIG91dHB1dCBieSBpdHMga2V5IGltYWdlXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkICYmIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiRW1wdHkgbGlzdCBnaXZlbiBmb3Igc3ViYWRkcmVzc2VzIGluZGljZXMgdG8gc3dlZXBcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTd2VlcEVhY2hTdWJhZGRyZXNzKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzd2VlcCBlYWNoIHN1YmFkZHJlc3Mgd2l0aCBSUEMgYHN3ZWVwX2FsbGBcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJ0cmFjdEZlZUZyb20oKSAhPT0gdW5kZWZpbmVkICYmIGNvbmZpZy5nZXRTdWJ0cmFjdEZlZUZyb20oKS5sZW5ndGggPiAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTd2VlcGluZyBvdXRwdXQgZG9lcyBub3Qgc3VwcG9ydCBzdWJ0cmFjdGluZyBmZWVzIGZyb20gZGVzdGluYXRpb25zXCIpO1xuICAgIFxuICAgIC8vIHN3ZWVwIGZyb20gYWxsIHN1YmFkZHJlc3NlcyBpZiBub3Qgb3RoZXJ3aXNlIGRlZmluZWRcbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uZmlnLnNldFN1YmFkZHJlc3NJbmRpY2VzKFtdKTtcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoY29uZmlnLmdldEFjY291bnRJbmRleCgpKSkge1xuICAgICAgICBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5wdXNoKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vIHN1YmFkZHJlc3NlcyB0byBzd2VlcCBmcm9tXCIpO1xuICAgIFxuICAgIC8vIGNvbW1vbiBjb25maWcgcGFyYW1zXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgbGV0IHJlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgPT09IHRydWU7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBjb25maWcuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpO1xuICAgIHBhcmFtcy5hZGRyZXNzID0gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKTtcbiAgICBhc3NlcnQoY29uZmlnLmdldFByaW9yaXR5KCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpb3JpdHkoKSA+PSAwICYmIGNvbmZpZy5nZXRQcmlvcml0eSgpIDw9IDMpO1xuICAgIHBhcmFtcy5wcmlvcml0eSA9IGNvbmZpZy5nZXRQcmlvcml0eSgpO1xuICAgIHBhcmFtcy5wYXltZW50X2lkID0gY29uZmlnLmdldFBheW1lbnRJZCgpO1xuICAgIHBhcmFtcy5kb19ub3RfcmVsYXkgPSAhcmVsYXk7XG4gICAgcGFyYW1zLmJlbG93X2Ftb3VudCA9IGNvbmZpZy5nZXRCZWxvd0Ftb3VudCgpO1xuICAgIHBhcmFtcy5nZXRfdHhfa2V5cyA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9oZXggPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfbWV0YWRhdGEgPSB0cnVlO1xuICAgIFxuICAgIC8vIGludm9rZSB3YWxsZXQgcnBjIGBzd2VlcF9hbGxgXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzd2VlcF9hbGxcIiwgcGFyYW1zKTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eHMgZnJvbSByZXNwb25zZVxuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzdWx0LCB1bmRlZmluZWQsIGNvbmZpZyk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSByZW1haW5pbmcga25vd24gZmllbGRzXG4gICAgZm9yIChsZXQgdHggb2YgdHhTZXQuZ2V0VHhzKCkpIHtcbiAgICAgIHR4LnNldElzTG9ja2VkKHRydWUpO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICAgIHR4LnNldFJlbGF5KHJlbGF5KTtcbiAgICAgIHR4LnNldEluVHhQb29sKHJlbGF5KTtcbiAgICAgIHR4LnNldElzUmVsYXllZChyZWxheSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgbGV0IHRyYW5zZmVyID0gdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpO1xuICAgICAgdHJhbnNmZXIuc2V0QWNjb3VudEluZGV4KGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKSk7XG4gICAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAxKSB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kaWNlcyhjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSk7XG4gICAgICBsZXQgZGVzdGluYXRpb24gPSBuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSwgQmlnSW50KHRyYW5zZmVyLmdldEFtb3VudCgpKSk7XG4gICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoW2Rlc3RpbmF0aW9uXSk7XG4gICAgICB0eC5zZXRPdXRnb2luZ1RyYW5zZmVyKHRyYW5zZmVyKTtcbiAgICAgIHR4LnNldFBheW1lbnRJZChjb25maWcuZ2V0UGF5bWVudElkKCkpO1xuICAgICAgaWYgKHR4LmdldFVubG9ja1RpbWUoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRVbmxvY2tUaW1lKDBuKTtcbiAgICAgIGlmICh0eC5nZXRSZWxheSgpKSB7XG4gICAgICAgIGlmICh0eC5nZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgpID09PSB1bmRlZmluZWQpIHR4LnNldExhc3RSZWxheWVkVGltZXN0YW1wKCtuZXcgRGF0ZSgpLmdldFRpbWUoKSk7ICAvLyBUT0RPIChtb25lcm8td2FsbGV0LXJwYyk6IHByb3ZpZGUgdGltZXN0YW1wIG9uIHJlc3BvbnNlOyB1bmNvbmZpcm1lZCB0aW1lc3RhbXBzIHZhcnlcbiAgICAgICAgaWYgKHR4LmdldElzRG91YmxlU3BlbmRTZWVuKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4oZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHhTZXQuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCByZWZyZXNoTGlzdGVuaW5nKCkge1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciA9PSB1bmRlZmluZWQgJiYgdGhpcy5saXN0ZW5lcnMubGVuZ3RoKSB0aGlzLndhbGxldFBvbGxlciA9IG5ldyBXYWxsZXRQb2xsZXIodGhpcyk7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyICE9PSB1bmRlZmluZWQpIHRoaXMud2FsbGV0UG9sbGVyLnNldElzUG9sbGluZyh0aGlzLmxpc3RlbmVycy5sZW5ndGggPiAwKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFBvbGwgaWYgbGlzdGVuaW5nLlxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIHBvbGwoKSB7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyICE9PSB1bmRlZmluZWQgJiYgdGhpcy53YWxsZXRQb2xsZXIuaXNQb2xsaW5nKSBhd2FpdCB0aGlzLndhbGxldFBvbGxlci5wb2xsKCk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBTVEFUSUMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPiB8IHN0cmluZ1tdLCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpOiBNb25lcm9XYWxsZXRDb25maWcge1xuICAgIGxldCBjb25maWc6IHVuZGVmaW5lZCB8IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPiA9IHVuZGVmaW5lZDtcbiAgICBpZiAodHlwZW9mIHVyaU9yQ29uZmlnID09PSBcInN0cmluZ1wiIHx8ICh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KS51cmkpIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoe3NlcnZlcjogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25maWcgYXMgc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiwgdXNlcm5hbWUsIHBhc3N3b3JkKX0pO1xuICAgIGVsc2UgaWYgKEdlblV0aWxzLmlzQXJyYXkodXJpT3JDb25maWcpKSBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHtjbWQ6IHVyaU9yQ29uZmlnIGFzIHN0cmluZ1tdfSk7XG4gICAgZWxzZSBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik7XG4gICAgaWYgKGNvbmZpZy5wcm94eVRvV29ya2VyID09PSB1bmRlZmluZWQpIGNvbmZpZy5wcm94eVRvV29ya2VyID0gdHJ1ZTtcbiAgICByZXR1cm4gY29uZmlnIGFzIE1vbmVyb1dhbGxldENvbmZpZztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlbW92ZSBjcml0ZXJpYSB3aGljaCByZXF1aXJlcyBsb29raW5nIHVwIG90aGVyIHRyYW5zZmVycy9vdXRwdXRzIHRvXG4gICAqIGZ1bGZpbGwgcXVlcnkuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4UXVlcnl9IHF1ZXJ5IC0gdGhlIHF1ZXJ5IHRvIGRlY29udGV4dHVhbGl6ZVxuICAgKiBAcmV0dXJuIHtNb25lcm9UeFF1ZXJ5fSBhIHJlZmVyZW5jZSB0byB0aGUgcXVlcnkgZm9yIGNvbnZlbmllbmNlXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGRlY29udGV4dHVhbGl6ZShxdWVyeSkge1xuICAgIHF1ZXJ5LnNldElzSW5jb21pbmcodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRJc091dGdvaW5nKHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0VHJhbnNmZXJRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldElucHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRPdXRwdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIHJldHVybiBxdWVyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBpc0NvbnRleHR1YWwocXVlcnkpIHtcbiAgICBpZiAoIXF1ZXJ5KSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKCFxdWVyeS5nZXRUeFF1ZXJ5KCkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldElzSW5jb21pbmcoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciB0cmFuc2ZlcnNcbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldElzT3V0Z29pbmcoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAocXVlcnkgaW5zdGFuY2VvZiBNb25lcm9UcmFuc2ZlclF1ZXJ5KSB7XG4gICAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldE91dHB1dFF1ZXJ5KCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7IC8vIHJlcXVpcmVzIGdldHRpbmcgb3RoZXIgb3V0cHV0c1xuICAgIH0gZWxzZSBpZiAocXVlcnkgaW5zdGFuY2VvZiBNb25lcm9PdXRwdXRRdWVyeSkge1xuICAgICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRUcmFuc2ZlclF1ZXJ5KCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7IC8vIHJlcXVpcmVzIGdldHRpbmcgb3RoZXIgdHJhbnNmZXJzXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcInF1ZXJ5IG11c3QgYmUgdHggb3IgdHJhbnNmZXIgcXVlcnlcIik7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQWNjb3VudChycGNBY2NvdW50KSB7XG4gICAgbGV0IGFjY291bnQgPSBuZXcgTW9uZXJvQWNjb3VudCgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNBY2NvdW50KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0FjY291bnRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYWNjb3VudF9pbmRleFwiKSBhY2NvdW50LnNldEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmFsYW5jZVwiKSBhY2NvdW50LnNldEJhbGFuY2UoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja2VkX2JhbGFuY2VcIikgYWNjb3VudC5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhc2VfYWRkcmVzc1wiKSBhY2NvdW50LnNldFByaW1hcnlBZGRyZXNzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFnXCIpIGFjY291bnQuc2V0VGFnKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFiZWxcIikgeyB9IC8vIGxhYmVsIGJlbG9uZ3MgdG8gZmlyc3Qgc3ViYWRkcmVzc1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgYWNjb3VudCBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBpZiAoXCJcIiA9PT0gYWNjb3VudC5nZXRUYWcoKSkgYWNjb3VudC5zZXRUYWcodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gYWNjb3VudDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKSB7XG4gICAgbGV0IHN1YmFkZHJlc3MgPSBuZXcgTW9uZXJvU3ViYWRkcmVzcygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNTdWJhZGRyZXNzKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1N1YmFkZHJlc3Nba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYWNjb3VudF9pbmRleFwiKSBzdWJhZGRyZXNzLnNldEFjY291bnRJbmRleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkZHJlc3NfaW5kZXhcIikgc3ViYWRkcmVzcy5zZXRJbmRleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkZHJlc3NcIikgc3ViYWRkcmVzcy5zZXRBZGRyZXNzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmFsYW5jZVwiKSBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja2VkX2JhbGFuY2VcIikgc3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV91bnNwZW50X291dHB1dHNcIikgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhYmVsXCIpIHsgaWYgKHZhbCkgc3ViYWRkcmVzcy5zZXRMYWJlbCh2YWwpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidXNlZFwiKSBzdWJhZGRyZXNzLnNldElzVXNlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2Nrc190b191bmxvY2tcIikgc3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jayh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09IFwidGltZV90b191bmxvY2tcIikge30gIC8vIGlnbm9yaW5nXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBzdWJhZGRyZXNzIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBzdWJhZGRyZXNzO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBzZW50IHRyYW5zYWN0aW9uLlxuICAgKiBcbiAgICogVE9ETzogcmVtb3ZlIGNvcHlEZXN0aW5hdGlvbnMgYWZ0ZXIgPjE4LjMuMSB3aGVuIHN1YnRyYWN0RmVlRnJvbSBmdWxseSBzdXBwb3J0ZWRcbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhDb25maWd9IGNvbmZpZyAtIHNlbmQgY29uZmlnXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhXYWxsZXR9IFt0eF0gLSBleGlzdGluZyB0cmFuc2FjdGlvbiB0byBpbml0aWFsaXplIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBjb3B5RGVzdGluYXRpb25zIC0gY29waWVzIGNvbmZpZyBkZXN0aW5hdGlvbnMgaWYgdHJ1ZVxuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gaXMgdGhlIGluaXRpYWxpemVkIHNlbmQgdHhcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgaW5pdFNlbnRUeFdhbGxldChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+LCB0eCwgY29weURlc3RpbmF0aW9ucykge1xuICAgIGlmICghdHgpIHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgbGV0IHJlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgPT09IHRydWU7XG4gICAgdHguc2V0SXNPdXRnb2luZyh0cnVlKTtcbiAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICB0eC5zZXRJblR4UG9vbChyZWxheSk7XG4gICAgdHguc2V0UmVsYXkocmVsYXkpO1xuICAgIHR4LnNldElzUmVsYXllZChyZWxheSk7XG4gICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgdHguc2V0SXNMb2NrZWQodHJ1ZSk7XG4gICAgdHguc2V0UmluZ1NpemUoTW9uZXJvVXRpbHMuUklOR19TSVpFKTtcbiAgICBsZXQgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpO1xuICAgIHRyYW5zZmVyLnNldFR4KHR4KTtcbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAxKSB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kaWNlcyhjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5zbGljZSgwKSk7IC8vIHdlIGtub3cgc3JjIHN1YmFkZHJlc3MgaW5kaWNlcyBpZmYgY29uZmlnIHNwZWNpZmllcyAxXG4gICAgaWYgKGNvcHlEZXN0aW5hdGlvbnMpIHtcbiAgICAgIGxldCBkZXN0Q29waWVzID0gW107XG4gICAgICBmb3IgKGxldCBkZXN0IG9mIGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSkgZGVzdENvcGllcy5wdXNoKGRlc3QuY29weSgpKTtcbiAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhkZXN0Q29waWVzKTtcbiAgICB9XG4gICAgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgdHguc2V0UGF5bWVudElkKGNvbmZpZy5nZXRQYXltZW50SWQoKSk7XG4gICAgaWYgKHR4LmdldFVubG9ja1RpbWUoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRVbmxvY2tUaW1lKDBuKTtcbiAgICBpZiAoY29uZmlnLmdldFJlbGF5KCkpIHtcbiAgICAgIGlmICh0eC5nZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgpID09PSB1bmRlZmluZWQpIHR4LnNldExhc3RSZWxheWVkVGltZXN0YW1wKCtuZXcgRGF0ZSgpLmdldFRpbWUoKSk7ICAvLyBUT0RPIChtb25lcm8td2FsbGV0LXJwYyk6IHByb3ZpZGUgdGltZXN0YW1wIG9uIHJlc3BvbnNlOyB1bmNvbmZpcm1lZCB0aW1lc3RhbXBzIHZhcnlcbiAgICAgIGlmICh0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbigpID09PSB1bmRlZmluZWQpIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKGZhbHNlKTtcbiAgICB9XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSB0eCBzZXQgZnJvbSBhIFJQQyBtYXAgZXhjbHVkaW5nIHR4cy5cbiAgICogXG4gICAqIEBwYXJhbSBycGNNYXAgLSBtYXAgdG8gaW5pdGlhbGl6ZSB0aGUgdHggc2V0IGZyb21cbiAgICogQHJldHVybiBNb25lcm9UeFNldCAtIGluaXRpYWxpemVkIHR4IHNldFxuICAgKiBAcmV0dXJuIHRoZSByZXN1bHRpbmcgdHggc2V0XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFNldChycGNNYXApIHtcbiAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoKTtcbiAgICB0eFNldC5zZXRNdWx0aXNpZ1R4SGV4KHJwY01hcC5tdWx0aXNpZ190eHNldCk7XG4gICAgdHhTZXQuc2V0VW5zaWduZWRUeEhleChycGNNYXAudW5zaWduZWRfdHhzZXQpO1xuICAgIHR4U2V0LnNldFNpZ25lZFR4SGV4KHJwY01hcC5zaWduZWRfdHhzZXQpO1xuICAgIGlmICh0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KCkubGVuZ3RoID09PSAwKSB0eFNldC5zZXRNdWx0aXNpZ1R4SGV4KHVuZGVmaW5lZCk7XG4gICAgaWYgKHR4U2V0LmdldFVuc2lnbmVkVHhIZXgoKSAhPT0gdW5kZWZpbmVkICYmIHR4U2V0LmdldFVuc2lnbmVkVHhIZXgoKS5sZW5ndGggPT09IDApIHR4U2V0LnNldFVuc2lnbmVkVHhIZXgodW5kZWZpbmVkKTtcbiAgICBpZiAodHhTZXQuZ2V0U2lnbmVkVHhIZXgoKSAhPT0gdW5kZWZpbmVkICYmIHR4U2V0LmdldFNpZ25lZFR4SGV4KCkubGVuZ3RoID09PSAwKSB0eFNldC5zZXRTaWduZWRUeEhleCh1bmRlZmluZWQpO1xuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgTW9uZXJvVHhTZXQgZnJvbSBhIGxpc3Qgb2YgcnBjIHR4cy5cbiAgICogXG4gICAqIEBwYXJhbSBycGNUeHMgLSBycGMgdHhzIHRvIGluaXRpYWxpemUgdGhlIHNldCBmcm9tXG4gICAqIEBwYXJhbSB0eHMgLSBleGlzdGluZyB0eHMgdG8gZnVydGhlciBpbml0aWFsaXplIChvcHRpb25hbClcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHRoZSBjb252ZXJ0ZWQgdHggc2V0XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTZW50VHhzVG9UeFNldChycGNUeHM6IGFueSwgdHhzPzogYW55LCBjb25maWc/OiBhbnkpIHtcbiAgICBcbiAgICAvLyBidWlsZCBzaGFyZWQgdHggc2V0XG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFNldChycGNUeHMpO1xuXG4gICAgLy8gZ2V0IG51bWJlciBvZiB0eHNcbiAgICBsZXQgbnVtVHhzID0gcnBjVHhzLmZlZV9saXN0ID8gcnBjVHhzLmZlZV9saXN0Lmxlbmd0aCA6IHJwY1R4cy50eF9oYXNoX2xpc3QgPyBycGNUeHMudHhfaGFzaF9saXN0Lmxlbmd0aCA6IDA7XG4gICAgXG4gICAgLy8gZG9uZSBpZiBycGMgcmVzcG9uc2UgY29udGFpbnMgbm8gdHhzXG4gICAgaWYgKG51bVR4cyA9PT0gMCkge1xuICAgICAgYXNzZXJ0LmVxdWFsKHR4cywgdW5kZWZpbmVkKTtcbiAgICAgIHJldHVybiB0eFNldDtcbiAgICB9XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eHMgaWYgbm9uZSBnaXZlblxuICAgIGlmICh0eHMpIHR4U2V0LnNldFR4cyh0eHMpO1xuICAgIGVsc2Uge1xuICAgICAgdHhzID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVR4czsgaSsrKSB0eHMucHVzaChuZXcgTW9uZXJvVHhXYWxsZXQoKSk7XG4gICAgfVxuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgdHguc2V0VHhTZXQodHhTZXQpO1xuICAgICAgdHguc2V0SXNPdXRnb2luZyh0cnVlKTtcbiAgICB9XG4gICAgdHhTZXQuc2V0VHhzKHR4cyk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eHMgZnJvbSBycGMgbGlzdHNcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVHhzKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1R4c1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJ0eF9oYXNoX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRIYXNoKHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfa2V5X2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRLZXkodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9ibG9iX2xpc3RcIiB8fCBrZXkgPT09IFwidHhfcmF3X2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRGdWxsSGV4KHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfbWV0YWRhdGFfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldE1ldGFkYXRhKHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRGZWUoQmlnSW50KHZhbFtpXSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndlaWdodF9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0V2VpZ2h0KHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50X2xpc3RcIikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh0eHNbaV0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpID09IHVuZGVmaW5lZCkgdHhzW2ldLnNldE91dGdvaW5nVHJhbnNmZXIobmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eHNbaV0pKTtcbiAgICAgICAgICB0eHNbaV0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFtb3VudChCaWdJbnQodmFsW2ldKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtdWx0aXNpZ190eHNldFwiIHx8IGtleSA9PT0gXCJ1bnNpZ25lZF90eHNldFwiIHx8IGtleSA9PT0gXCJzaWduZWRfdHhzZXRcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGVudF9rZXlfaW1hZ2VzX2xpc3RcIikge1xuICAgICAgICBsZXQgaW5wdXRLZXlJbWFnZXNMaXN0ID0gdmFsO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0S2V5SW1hZ2VzTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUodHhzW2ldLmdldElucHV0cygpID09PSB1bmRlZmluZWQpO1xuICAgICAgICAgIHR4c1tpXS5zZXRJbnB1dHMoW10pO1xuICAgICAgICAgIGZvciAobGV0IGlucHV0S2V5SW1hZ2Ugb2YgaW5wdXRLZXlJbWFnZXNMaXN0W2ldW1wia2V5X2ltYWdlc1wiXSkge1xuICAgICAgICAgICAgdHhzW2ldLmdldElucHV0cygpLnB1c2gobmV3IE1vbmVyb091dHB1dFdhbGxldCgpLnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSgpLnNldEhleChpbnB1dEtleUltYWdlKSkuc2V0VHgodHhzW2ldKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50c19ieV9kZXN0X2xpc3RcIikge1xuICAgICAgICBsZXQgYW1vdW50c0J5RGVzdExpc3QgPSB2YWw7XG4gICAgICAgIGxldCBkZXN0aW5hdGlvbklkeCA9IDA7XG4gICAgICAgIGZvciAobGV0IHR4SWR4ID0gMDsgdHhJZHggPCBhbW91bnRzQnlEZXN0TGlzdC5sZW5ndGg7IHR4SWR4KyspIHtcbiAgICAgICAgICBsZXQgYW1vdW50c0J5RGVzdCA9IGFtb3VudHNCeURlc3RMaXN0W3R4SWR4XVtcImFtb3VudHNcIl07XG4gICAgICAgICAgaWYgKHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpID09PSB1bmRlZmluZWQpIHR4c1t0eElkeF0uc2V0T3V0Z29pbmdUcmFuc2ZlcihuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHR4c1t0eElkeF0pKTtcbiAgICAgICAgICB0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXREZXN0aW5hdGlvbnMoW10pO1xuICAgICAgICAgIGZvciAobGV0IGFtb3VudCBvZiBhbW91bnRzQnlEZXN0KSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCA9PT0gMSkgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudCkpKTsgLy8gc3dlZXBpbmcgY2FuIGNyZWF0ZSBtdWx0aXBsZSB0eHMgd2l0aCBvbmUgYWRkcmVzc1xuICAgICAgICAgICAgZWxzZSB0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKS5wdXNoKG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbZGVzdGluYXRpb25JZHgrK10uZ2V0QWRkcmVzcygpLCBCaWdJbnQoYW1vdW50KSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgdHJhbnNhY3Rpb24gZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydHMgYSBycGMgdHggd2l0aCBhIHRyYW5zZmVyIHRvIGEgdHggc2V0IHdpdGggYSB0eCBhbmQgdHJhbnNmZXIuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHggLSBycGMgdHggdG8gYnVpbGQgZnJvbVxuICAgKiBAcGFyYW0gdHggLSBleGlzdGluZyB0eCB0byBjb250aW51ZSBpbml0aWFsaXppbmcgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gaXNPdXRnb2luZyAtIHNwZWNpZmllcyBpZiB0aGUgdHggaXMgb3V0Z29pbmcgaWYgdHJ1ZSwgaW5jb21pbmcgaWYgZmFsc2UsIG9yIGRlY29kZXMgZnJvbSB0eXBlIGlmIHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4gdGhlIGluaXRpYWxpemVkIHR4IHNldCB3aXRoIGEgdHhcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4VG9UeFNldChycGNUeCwgdHgsIGlzT3V0Z29pbmcsIGNvbmZpZykge1xuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhTZXQocnBjVHgpO1xuICAgIHR4U2V0LnNldFR4cyhbTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlcihycGNUeCwgdHgsIGlzT3V0Z29pbmcsIGNvbmZpZykuc2V0VHhTZXQodHhTZXQpXSk7XG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogQnVpbGRzIGEgTW9uZXJvVHhXYWxsZXQgZnJvbSBhIFJQQyB0eC5cbiAgICogXG4gICAqIEBwYXJhbSBycGNUeCAtIHJwYyB0eCB0byBidWlsZCBmcm9tXG4gICAqIEBwYXJhbSB0eCAtIGV4aXN0aW5nIHR4IHRvIGNvbnRpbnVlIGluaXRpYWxpemluZyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBpc091dGdvaW5nIC0gc3BlY2lmaWVzIGlmIHRoZSB0eCBpcyBvdXRnb2luZyBpZiB0cnVlLCBpbmNvbWluZyBpZiBmYWxzZSwgb3IgZGVjb2RlcyBmcm9tIHR5cGUgaWYgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IGlzIHRoZSBpbml0aWFsaXplZCB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHg6IGFueSwgdHg/OiBhbnksIGlzT3V0Z29pbmc/OiBhbnksIGNvbmZpZz86IGFueSkgeyAgLy8gVE9ETzogY2hhbmdlIGV2ZXJ5dGhpbmcgdG8gc2FmZSBzZXRcbiAgICAgICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCB0byByZXR1cm5cbiAgICBpZiAoIXR4KSB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggc3RhdGUgZnJvbSBycGMgdHlwZVxuICAgIGlmIChycGNUeC50eXBlICE9PSB1bmRlZmluZWQpIGlzT3V0Z29pbmcgPSBNb25lcm9XYWxsZXRScGMuZGVjb2RlUnBjVHlwZShycGNUeC50eXBlLCB0eCk7XG4gICAgZWxzZSBhc3NlcnQuZXF1YWwodHlwZW9mIGlzT3V0Z29pbmcsIFwiYm9vbGVhblwiLCBcIk11c3QgaW5kaWNhdGUgaWYgdHggaXMgb3V0Z29pbmcgKHRydWUpIHhvciBpbmNvbWluZyAoZmFsc2UpIHNpbmNlIHVua25vd25cIik7XG4gICAgXG4gICAgLy8gVE9ETzogc2FmZSBzZXRcbiAgICAvLyBpbml0aWFsaXplIHJlbWFpbmluZyBmaWVsZHMgIFRPRE86IHNlZW1zIHRoaXMgc2hvdWxkIGJlIHBhcnQgb2YgY29tbW9uIGZ1bmN0aW9uIHdpdGggRGFlbW9uUnBjLmNvbnZlcnRScGNUeFxuICAgIGxldCBoZWFkZXI7XG4gICAgbGV0IHRyYW5zZmVyO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUeCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUeFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJ0eGlkXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVcIikgdHguc2V0RmVlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJub3RlXCIpIHsgaWYgKHZhbCkgdHguc2V0Tm90ZSh2YWwpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfa2V5XCIpIHR4LnNldEtleSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR5cGVcIikgeyB9IC8vIHR5cGUgYWxyZWFkeSBoYW5kbGVkXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfc2l6ZVwiKSB0eC5zZXRTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrX3RpbWVcIikgdHguc2V0VW5sb2NrVGltZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndlaWdodFwiKSB0eC5zZXRXZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsb2NrZWRcIikgdHguc2V0SXNMb2NrZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9ibG9iXCIpIHR4LnNldEZ1bGxIZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9tZXRhZGF0YVwiKSB0eC5zZXRNZXRhZGF0YSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRvdWJsZV9zcGVuZF9zZWVuXCIpIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfaGVpZ2h0XCIgfHwga2V5ID09PSBcImhlaWdodFwiKSB7XG4gICAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSB7XG4gICAgICAgICAgaWYgKCFoZWFkZXIpIGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgICAgICAgIGhlYWRlci5zZXRIZWlnaHQodmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRpbWVzdGFtcFwiKSB7XG4gICAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSB7XG4gICAgICAgICAgaWYgKCFoZWFkZXIpIGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgICAgICAgIGhlYWRlci5zZXRUaW1lc3RhbXAodmFsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyB0aW1lc3RhbXAgb2YgdW5jb25maXJtZWQgdHggaXMgY3VycmVudCByZXF1ZXN0IHRpbWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNvbmZpcm1hdGlvbnNcIikgdHguc2V0TnVtQ29uZmlybWF0aW9ucyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1Z2dlc3RlZF9jb25maXJtYXRpb25zX3RocmVzaG9sZFwiKSB7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgaWYgKCFpc091dGdvaW5nKSB0cmFuc2Zlci5zZXROdW1TdWdnZXN0ZWRDb25maXJtYXRpb25zKHZhbCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIHtcbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gKGlzT3V0Z29pbmcgPyBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpIDogbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKSkuc2V0VHgodHgpO1xuICAgICAgICB0cmFuc2Zlci5zZXRBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNcIikge30gIC8vIGlnbm9yaW5nLCBhbW91bnRzIHN1bSB0byBhbW91bnRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzXCIpIHtcbiAgICAgICAgaWYgKCFpc091dGdvaW5nKSB7XG4gICAgICAgICAgaWYgKCF0cmFuc2ZlcikgdHJhbnNmZXIgPSBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpLnNldFR4KHR4KTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRBZGRyZXNzKHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwYXltZW50X2lkXCIpIHtcbiAgICAgICAgaWYgKFwiXCIgIT09IHZhbCAmJiBNb25lcm9UeFdhbGxldC5ERUZBVUxUX1BBWU1FTlRfSUQgIT09IHZhbCkgdHguc2V0UGF5bWVudElkKHZhbCk7ICAvLyBkZWZhdWx0IGlzIHVuZGVmaW5lZFxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1YmFkZHJfaW5kZXhcIikgYXNzZXJ0KHJwY1R4LnN1YmFkZHJfaW5kaWNlcyk7ICAvLyBoYW5kbGVkIGJ5IHN1YmFkZHJfaW5kaWNlc1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1YmFkZHJfaW5kaWNlc1wiKSB7XG4gICAgICAgIGlmICghdHJhbnNmZXIpIHRyYW5zZmVyID0gKGlzT3V0Z29pbmcgPyBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpIDogbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKSkuc2V0VHgodHgpO1xuICAgICAgICBsZXQgcnBjSW5kaWNlcyA9IHZhbDtcbiAgICAgICAgdHJhbnNmZXIuc2V0QWNjb3VudEluZGV4KHJwY0luZGljZXNbMF0ubWFqb3IpO1xuICAgICAgICBpZiAoaXNPdXRnb2luZykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgICAgICAgIGZvciAobGV0IHJwY0luZGV4IG9mIHJwY0luZGljZXMpIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2gocnBjSW5kZXgubWlub3IpO1xuICAgICAgICAgIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhc3NlcnQuZXF1YWwocnBjSW5kaWNlcy5sZW5ndGgsIDEpO1xuICAgICAgICAgIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRleChycGNJbmRpY2VzWzBdLm1pbm9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRlc3RpbmF0aW9uc1wiIHx8IGtleSA9PSBcInJlY2lwaWVudHNcIikge1xuICAgICAgICBhc3NlcnQoaXNPdXRnb2luZyk7XG4gICAgICAgIGxldCBkZXN0aW5hdGlvbnMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgcnBjRGVzdGluYXRpb24gb2YgdmFsKSB7XG4gICAgICAgICAgbGV0IGRlc3RpbmF0aW9uID0gbmV3IE1vbmVyb0Rlc3RpbmF0aW9uKCk7XG4gICAgICAgICAgZGVzdGluYXRpb25zLnB1c2goZGVzdGluYXRpb24pO1xuICAgICAgICAgIGZvciAobGV0IGRlc3RpbmF0aW9uS2V5IG9mIE9iamVjdC5rZXlzKHJwY0Rlc3RpbmF0aW9uKSkge1xuICAgICAgICAgICAgaWYgKGRlc3RpbmF0aW9uS2V5ID09PSBcImFkZHJlc3NcIikgZGVzdGluYXRpb24uc2V0QWRkcmVzcyhycGNEZXN0aW5hdGlvbltkZXN0aW5hdGlvbktleV0pO1xuICAgICAgICAgICAgZWxzZSBpZiAoZGVzdGluYXRpb25LZXkgPT09IFwiYW1vdW50XCIpIGRlc3RpbmF0aW9uLnNldEFtb3VudChCaWdJbnQocnBjRGVzdGluYXRpb25bZGVzdGluYXRpb25LZXldKSk7XG4gICAgICAgICAgICBlbHNlIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlVucmVjb2duaXplZCB0cmFuc2FjdGlvbiBkZXN0aW5hdGlvbiBmaWVsZDogXCIgKyBkZXN0aW5hdGlvbktleSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKHt0eDogdHh9KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKGRlc3RpbmF0aW9ucyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic291cmNlc1wiKSB7XG4gICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUodHguZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHR4LnNldElucHV0cyhbXSk7XG4gICAgICAgIGZvciAobGV0IHJwY1NvdXJjZSBvZiB2YWwpIHtcbiAgICAgICAgICBsZXQgaW5wdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCkuc2V0VHgodHgpO1xuICAgICAgICAgIGlucHV0LnNldEFtb3VudChCaWdJbnQocnBjU291cmNlLmFtb3VudCkpO1xuICAgICAgICAgIGlucHV0LnNldEluZGV4KHJwY1NvdXJjZS5nbG9iYWxfaW5kZXgpO1xuICAgICAgICAgIGlmIChycGNTb3VyY2UucHVia2V5ICE9PSB1bmRlZmluZWQpIGlucHV0LnNldFN0ZWFsdGhQdWJsaWNLZXkocnBjU291cmNlLnB1YmtleS5zdWJzdHJpbmcoMCwgNjQpKTsgLy8gZGVzdCBrZXkgb2YgZGVzdHx8bWFza1xuICAgICAgICAgIHR4LmdldElucHV0cygpLnB1c2goaW5wdXQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibXVsdGlzaWdfdHhzZXRcIiAmJiB2YWwgIT09IHVuZGVmaW5lZCkge30gLy8gaGFuZGxlZCBlbHNld2hlcmU7IHRoaXMgbWV0aG9kIG9ubHkgYnVpbGRzIGEgdHggd2FsbGV0XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5zaWduZWRfdHhzZXRcIiAmJiB2YWwgIT09IHVuZGVmaW5lZCkge30gLy8gaGFuZGxlZCBlbHNld2hlcmU7IHRoaXMgbWV0aG9kIG9ubHkgYnVpbGRzIGEgdHggd2FsbGV0XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50X2luXCIpIHR4LnNldElucHV0U3VtKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRfb3V0XCIpIHR4LnNldE91dHB1dFN1bShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY2hhbmdlX2FkZHJlc3NcIikgdHguc2V0Q2hhbmdlQWRkcmVzcyh2YWwgPT09IFwiXCIgPyB1bmRlZmluZWQgOiB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNoYW5nZV9hbW91bnRcIikgdHguc2V0Q2hhbmdlQW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkdW1teV9vdXRwdXRzXCIpIHR4LnNldE51bUR1bW15T3V0cHV0cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImV4dHJhXCIpIHR4LnNldEV4dHJhSGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmluZ19zaXplXCIpIHR4LnNldFJpbmdTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlbnRfa2V5X2ltYWdlc1wiKSB7XG4gICAgICAgIGxldCBpbnB1dEtleUltYWdlcyA9IHZhbC5rZXlfaW1hZ2VzO1xuICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR4LmdldElucHV0cygpID09PSB1bmRlZmluZWQpO1xuICAgICAgICB0eC5zZXRJbnB1dHMoW10pO1xuICAgICAgICBmb3IgKGxldCBpbnB1dEtleUltYWdlIG9mIGlucHV0S2V5SW1hZ2VzKSB7XG4gICAgICAgICAgdHguZ2V0SW5wdXRzKCkucHVzaChuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCkuc2V0S2V5SW1hZ2UobmV3IE1vbmVyb0tleUltYWdlKCkuc2V0SGV4KGlucHV0S2V5SW1hZ2UpKS5zZXRUeCh0eCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50c19ieV9kZXN0XCIpIHtcbiAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShpc091dGdvaW5nKTtcbiAgICAgICAgbGV0IGFtb3VudHNCeURlc3QgPSB2YWwuYW1vdW50cztcbiAgICAgICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGgsIGFtb3VudHNCeURlc3QubGVuZ3RoKTtcbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eCk7XG4gICAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhbXSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdHJhbnNmZXIuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpW2ldLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudHNCeURlc3RbaV0pKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHRyYW5zYWN0aW9uIGZpZWxkIHdpdGggdHJhbnNmZXI6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbGluayBibG9jayBhbmQgdHhcbiAgICBpZiAoaGVhZGVyKSB0eC5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soaGVhZGVyKS5zZXRUeHMoW3R4XSkpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgZmluYWwgZmllbGRzXG4gICAgaWYgKHRyYW5zZmVyKSB7XG4gICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICBpZiAoIXRyYW5zZmVyLmdldFR4KCkuZ2V0SXNDb25maXJtZWQoKSkgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICAgIGlmIChpc091dGdvaW5nKSB7XG4gICAgICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpIHtcbiAgICAgICAgICBpZiAodHJhbnNmZXIuZ2V0RGVzdGluYXRpb25zKCkpIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXREZXN0aW5hdGlvbnModW5kZWZpbmVkKTsgLy8gb3ZlcndyaXRlIHRvIGF2b2lkIHJlY29uY2lsZSBlcnJvciBUT0RPOiByZW1vdmUgYWZ0ZXIgPjE4LjMuMSB3aGVuIGFtb3VudHNfYnlfZGVzdCBzdXBwb3J0ZWRcbiAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkubWVyZ2UodHJhbnNmZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0eC5zZXRJc0luY29taW5nKHRydWUpO1xuICAgICAgICB0eC5zZXRJbmNvbWluZ1RyYW5zZmVycyhbdHJhbnNmZXJdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gcmV0dXJuIGluaXRpYWxpemVkIHRyYW5zYWN0aW9uXG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFdpdGhPdXRwdXQocnBjT3V0cHV0KSB7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eFxuICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoe3R4OiB0eH0pO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNPdXRwdXQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjT3V0cHV0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFtb3VudFwiKSBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGVudFwiKSBvdXRwdXQuc2V0SXNTcGVudCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImtleV9pbWFnZVwiKSB7IGlmIChcIlwiICE9PSB2YWwpIG91dHB1dC5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UodmFsKSk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJnbG9iYWxfaW5kZXhcIikgb3V0cHV0LnNldEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRcIikgdHguc2V0SXNMb2NrZWQoIXZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZnJvemVuXCIpIG91dHB1dC5zZXRJc0Zyb3plbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInB1YmtleVwiKSBvdXRwdXQuc2V0U3RlYWx0aFB1YmxpY0tleSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1YmFkZHJfaW5kZXhcIikge1xuICAgICAgICBvdXRwdXQuc2V0QWNjb3VudEluZGV4KHZhbC5tYWpvcik7XG4gICAgICAgIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgodmFsLm1pbm9yKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oZWlnaHRcIikgdHguc2V0QmxvY2soKG5ldyBNb25lcm9CbG9jaygpLnNldEhlaWdodCh2YWwpIGFzIE1vbmVyb0Jsb2NrKS5zZXRUeHMoW3R4IGFzIE1vbmVyb1R4XSkpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgdHJhbnNhY3Rpb24gZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCB3aXRoIG91dHB1dFxuICAgIHR4LnNldE91dHB1dHMoW291dHB1dF0pO1xuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlcihycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0KSB7XG4gICAgbGV0IHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJkZXNjXCIpIHtcbiAgICAgICAgdHhTZXQuc2V0VHhzKFtdKTtcbiAgICAgICAgZm9yIChsZXQgdHhNYXAgb2YgdmFsKSB7XG4gICAgICAgICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhUcmFuc2Zlcih0eE1hcCwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgICB0eC5zZXRUeFNldCh0eFNldCk7XG4gICAgICAgICAgdHhTZXQuZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdW1tYXJ5XCIpIHsgfSAvLyBUT0RPOiBzdXBwb3J0IHR4IHNldCBzdW1tYXJ5IGZpZWxkcz9cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGRlc2NkcmliZSB0cmFuc2ZlciBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZWNvZGVzIGEgXCJ0eXBlXCIgZnJvbSBtb25lcm8td2FsbGV0LXJwYyB0byBpbml0aWFsaXplIHR5cGUgYW5kIHN0YXRlXG4gICAqIGZpZWxkcyBpbiB0aGUgZ2l2ZW4gdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBUT0RPOiB0aGVzZSBzaG91bGQgYmUgc2FmZSBzZXRcbiAgICogXG4gICAqIEBwYXJhbSBycGNUeXBlIGlzIHRoZSB0eXBlIHRvIGRlY29kZVxuICAgKiBAcGFyYW0gdHggaXMgdGhlIHRyYW5zYWN0aW9uIHRvIGRlY29kZSBrbm93biBmaWVsZHMgdG9cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgcnBjIHR5cGUgaW5kaWNhdGVzIG91dGdvaW5nIHhvciBpbmNvbWluZ1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBkZWNvZGVScGNUeXBlKHJwY1R5cGUsIHR4KSB7XG4gICAgbGV0IGlzT3V0Z29pbmc7XG4gICAgaWYgKHJwY1R5cGUgPT09IFwiaW5cIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcIm91dFwiKSB7XG4gICAgICBpc091dGdvaW5nID0gdHJ1ZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJwb29sXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSBmYWxzZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKHRydWUpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpOyAgLy8gVE9ETzogYnV0IGNvdWxkIGl0IGJlP1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJwZW5kaW5nXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcImJsb2NrXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSBmYWxzZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgodHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcImZhaWxlZFwiKSB7XG4gICAgICBpc091dGdvaW5nID0gdHJ1ZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZChmYWxzZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKHRydWUpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVW5yZWNvZ25pemVkIHRyYW5zZmVyIHR5cGU6IFwiICsgcnBjVHlwZSk7XG4gICAgfVxuICAgIHJldHVybiBpc091dGdvaW5nO1xuICB9XG4gIFxuICAvKipcbiAgICogTWVyZ2VzIGEgdHJhbnNhY3Rpb24gaW50byBhIHVuaXF1ZSBzZXQgb2YgdHJhbnNhY3Rpb25zLlxuICAgKlxuICAgKiBAcGFyYW0ge01vbmVyb1R4V2FsbGV0fSB0eCAtIHRoZSB0cmFuc2FjdGlvbiB0byBtZXJnZSBpbnRvIHRoZSBleGlzdGluZyB0eHNcbiAgICogQHBhcmFtIHtPYmplY3R9IHR4TWFwIC0gbWFwcyB0eCBoYXNoZXMgdG8gdHhzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBibG9ja01hcCAtIG1hcHMgYmxvY2sgaGVpZ2h0cyB0byBibG9ja3NcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgbWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKSB7XG4gICAgYXNzZXJ0KHR4LmdldEhhc2goKSAhPT0gdW5kZWZpbmVkKTtcbiAgICBcbiAgICAvLyBtZXJnZSB0eFxuICAgIGxldCBhVHggPSB0eE1hcFt0eC5nZXRIYXNoKCldO1xuICAgIGlmIChhVHggPT09IHVuZGVmaW5lZCkgdHhNYXBbdHguZ2V0SGFzaCgpXSA9IHR4OyAvLyBjYWNoZSBuZXcgdHhcbiAgICBlbHNlIGFUeC5tZXJnZSh0eCk7IC8vIG1lcmdlIHdpdGggZXhpc3RpbmcgdHhcbiAgICBcbiAgICAvLyBtZXJnZSB0eCdzIGJsb2NrIGlmIGNvbmZpcm1lZFxuICAgIGlmICh0eC5nZXRIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgYUJsb2NrID0gYmxvY2tNYXBbdHguZ2V0SGVpZ2h0KCldO1xuICAgICAgaWYgKGFCbG9jayA9PT0gdW5kZWZpbmVkKSBibG9ja01hcFt0eC5nZXRIZWlnaHQoKV0gPSB0eC5nZXRCbG9jaygpOyAvLyBjYWNoZSBuZXcgYmxvY2tcbiAgICAgIGVsc2UgYUJsb2NrLm1lcmdlKHR4LmdldEJsb2NrKCkpOyAvLyBtZXJnZSB3aXRoIGV4aXN0aW5nIGJsb2NrXG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogQ29tcGFyZXMgdHdvIHRyYW5zYWN0aW9ucyBieSB0aGVpciBoZWlnaHQuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbXBhcmVUeHNCeUhlaWdodCh0eDEsIHR4Mikge1xuICAgIGlmICh0eDEuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCAmJiB0eDIuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIDA7IC8vIGJvdGggdW5jb25maXJtZWRcbiAgICBlbHNlIGlmICh0eDEuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIDE7ICAgLy8gdHgxIGlzIHVuY29uZmlybWVkXG4gICAgZWxzZSBpZiAodHgyLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHJldHVybiAtMTsgIC8vIHR4MiBpcyB1bmNvbmZpcm1lZFxuICAgIGxldCBkaWZmID0gdHgxLmdldEhlaWdodCgpIC0gdHgyLmdldEhlaWdodCgpO1xuICAgIGlmIChkaWZmICE9PSAwKSByZXR1cm4gZGlmZjtcbiAgICByZXR1cm4gdHgxLmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eDEpIC0gdHgyLmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eDIpOyAvLyB0eHMgYXJlIGluIHRoZSBzYW1lIGJsb2NrIHNvIHJldGFpbiB0aGVpciBvcmlnaW5hbCBvcmRlclxuICB9XG4gIFxuICAvKipcbiAgICogQ29tcGFyZXMgdHdvIHRyYW5zZmVycyBieSBhc2NlbmRpbmcgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzLlxuICAgKi9cbiAgc3RhdGljIGNvbXBhcmVJbmNvbWluZ1RyYW5zZmVycyh0MSwgdDIpIHtcbiAgICBpZiAodDEuZ2V0QWNjb3VudEluZGV4KCkgPCB0Mi5nZXRBY2NvdW50SW5kZXgoKSkgcmV0dXJuIC0xO1xuICAgIGVsc2UgaWYgKHQxLmdldEFjY291bnRJbmRleCgpID09PSB0Mi5nZXRBY2NvdW50SW5kZXgoKSkgcmV0dXJuIHQxLmdldFN1YmFkZHJlc3NJbmRleCgpIC0gdDIuZ2V0U3ViYWRkcmVzc0luZGV4KCk7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gb3V0cHV0cyBieSBhc2NlbmRpbmcgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzLlxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb21wYXJlT3V0cHV0cyhvMSwgbzIpIHtcbiAgICBcbiAgICAvLyBjb21wYXJlIGJ5IGhlaWdodFxuICAgIGxldCBoZWlnaHRDb21wYXJpc29uID0gTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVUeHNCeUhlaWdodChvMS5nZXRUeCgpLCBvMi5nZXRUeCgpKTtcbiAgICBpZiAoaGVpZ2h0Q29tcGFyaXNvbiAhPT0gMCkgcmV0dXJuIGhlaWdodENvbXBhcmlzb247XG4gICAgXG4gICAgLy8gY29tcGFyZSBieSBhY2NvdW50IGluZGV4LCBzdWJhZGRyZXNzIGluZGV4LCBvdXRwdXQgaW5kZXgsIHRoZW4ga2V5IGltYWdlIGhleFxuICAgIGxldCBjb21wYXJlID0gbzEuZ2V0QWNjb3VudEluZGV4KCkgLSBvMi5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBpZiAoY29tcGFyZSAhPT0gMCkgcmV0dXJuIGNvbXBhcmU7XG4gICAgY29tcGFyZSA9IG8xLmdldFN1YmFkZHJlc3NJbmRleCgpIC0gbzIuZ2V0U3ViYWRkcmVzc0luZGV4KCk7XG4gICAgaWYgKGNvbXBhcmUgIT09IDApIHJldHVybiBjb21wYXJlO1xuICAgIGNvbXBhcmUgPSBvMS5nZXRJbmRleCgpIC0gbzIuZ2V0SW5kZXgoKTtcbiAgICBpZiAoY29tcGFyZSAhPT0gMCkgcmV0dXJuIGNvbXBhcmU7XG4gICAgcmV0dXJuIG8xLmdldEtleUltYWdlKCkuZ2V0SGV4KCkubG9jYWxlQ29tcGFyZShvMi5nZXRLZXlJbWFnZSgpLmdldEhleCgpKTtcbiAgfVxufVxuXG4vKipcbiAqIFBvbGxzIG1vbmVyby13YWxsZXQtcnBjIHRvIHByb3ZpZGUgbGlzdGVuZXIgbm90aWZpY2F0aW9ucy5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgV2FsbGV0UG9sbGVyIHtcblxuICAvLyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgaXNQb2xsaW5nOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgd2FsbGV0OiBNb25lcm9XYWxsZXRScGM7XG4gIHByb3RlY3RlZCBsb29wZXI6IFRhc2tMb29wZXI7XG4gIHByb3RlY3RlZCBwcmV2TG9ja2VkVHhzOiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2TG9ja2VkVHhzTWluSGVpZ2h0ID0gMDtcbiAgcHJvdGVjdGVkIHByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZDb25maXJtZWROb3RpZmljYXRpb25zOiBhbnk7XG4gIHByb3RlY3RlZCB0aHJlYWRQb29sOiBhbnk7XG4gIHByb3RlY3RlZCBudW1Qb2xsaW5nOiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2SGVpZ2h0OiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2QmFsYW5jZXM6IGFueTtcbiAgcHJvdGVjdGVkIGdlbmVyYXRpb24gPSAwO1xuICBwcm90ZWN0ZWQgc25hcHNob3RHZW5lcmF0aW9uID0gMDtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICB0aGlzLndhbGxldCA9IHdhbGxldDtcbiAgICB0aGlzLmxvb3BlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jIGZ1bmN0aW9uKCkgeyBhd2FpdCB0aGF0LnBvbGwoKTsgfSk7XG4gICAgdGhpcy5wcmV2TG9ja2VkVHhzID0gW107XG4gICAgdGhpcy5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zID0gbmV3IFNldCgpOyAvLyB0eCBoYXNoZXMgb2YgcHJldmlvdXMgbm90aWZpY2F0aW9uc1xuICAgIHRoaXMucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMgPSBuZXcgU2V0KCk7IC8vIHR4IGhhc2hlcyBvZiBwcmV2aW91c2x5IGNvbmZpcm1lZCBidXQgbm90IHlldCB1bmxvY2tlZCBub3RpZmljYXRpb25zXG4gICAgdGhpcy50aHJlYWRQb29sID0gbmV3IFRocmVhZFBvb2woMSk7IC8vIHN5bmNocm9uaXplIHBvbGxzXG4gICAgdGhpcy5udW1Qb2xsaW5nID0gMDtcbiAgfVxuICBcbiAgcmVzZXQoKSB7XG4gICAgdGhpcy5nZW5lcmF0aW9uKys7IC8vIGludmFsaWRhdGUgaW4tZmxpZ2h0IHBvbGxzIHdpdGhvdXQgd2FpdGluZyBvbiB0aGVpciBjYWxsYmFja3NcbiAgfVxuXG4gIHNldElzUG9sbGluZyhpc1BvbGxpbmcpIHtcbiAgICB0aGlzLmlzUG9sbGluZyA9IGlzUG9sbGluZztcbiAgICBpZiAoaXNQb2xsaW5nKSB0aGlzLmxvb3Blci5zdGFydCh0aGlzLndhbGxldC5nZXRTeW5jUGVyaW9kSW5NcygpKTtcbiAgICBlbHNlIHRoaXMubG9vcGVyLnN0b3AoKTtcbiAgfVxuICBcbiAgc2V0UGVyaW9kSW5NcyhwZXJpb2RJbk1zKSB7XG4gICAgdGhpcy5sb29wZXIuc2V0UGVyaW9kSW5NcyhwZXJpb2RJbk1zKTtcbiAgfVxuICBcbiAgYXN5bmMgcG9sbCgpIHtcblxuICAgIC8vIHNraXAgaWYgbmV4dCBwb2xsIGlzIHF1ZXVlZFxuICAgIGlmICh0aGlzLm51bVBvbGxpbmcgPiAxKSByZXR1cm47XG4gICAgdGhpcy5udW1Qb2xsaW5nKys7XG4gICAgXG4gICAgLy8gc3luY2hyb25pemUgcG9sbHNcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgcmV0dXJuIHRoaXMudGhyZWFkUG9vbC5zdWJtaXQoYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBnZW5lcmF0aW9uID0gdGhhdC5nZW5lcmF0aW9uO1xuICAgICAgdHJ5IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHNraXAgaWYgd2FsbGV0IGlzIGNsb3NlZFxuICAgICAgICBpZiAoYXdhaXQgdGhhdC53YWxsZXQuaXNDbG9zZWQoKSB8fCBnZW5lcmF0aW9uICE9PSB0aGF0LmdlbmVyYXRpb24pIHJldHVybjtcblxuICAgICAgICAvLyByZXNldCBzbmFwc2hvdHMgb25seSBpbnNpZGUgdGhlIHNlcmlhbGl6ZWQgcG9sbFxuICAgICAgICBpZiAodGhhdC5zbmFwc2hvdEdlbmVyYXRpb24gIT09IGdlbmVyYXRpb24pIHtcbiAgICAgICAgICB0aGF0LnByZXZIZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgdGhhdC5wcmV2QmFsYW5jZXMgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzID0gW107XG4gICAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzTWluSGVpZ2h0ID0gMDtcbiAgICAgICAgICB0aGF0LnByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnMuY2xlYXIoKTtcbiAgICAgICAgICB0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zLmNsZWFyKCk7XG4gICAgICAgICAgdGhhdC5zbmFwc2hvdEdlbmVyYXRpb24gPSBnZW5lcmF0aW9uO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyB0YWtlIGluaXRpYWwgc25hcHNob3RcbiAgICAgICAgaWYgKHRoYXQucHJldkJhbGFuY2VzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGF0LnByZXZIZWlnaHQgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRIZWlnaHQoKTtcbiAgICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0VHhzKG5ldyBNb25lcm9UeFF1ZXJ5KCkuc2V0SXNMb2NrZWQodHJ1ZSkpO1xuICAgICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGF0LmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgICB0aGF0LnByZXZCYWxhbmNlcyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBoZWlnaHQgY2hhbmdlc1xuICAgICAgICBsZXQgaGVpZ2h0ID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0SGVpZ2h0KCk7XG4gICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGF0LmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgaWYgKHRoYXQucHJldkhlaWdodCAhPT0gaGVpZ2h0KSB7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IHRoYXQucHJldkhlaWdodDsgaSA8IGhlaWdodDsgaSsrKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGF0Lm9uTmV3QmxvY2soaSk7XG4gICAgICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gZ2V0IGxvY2tlZCB0eHMgZm9yIGNvbXBhcmlzb24gdG8gcHJldmlvdXNcbiAgICAgICAgbGV0IG1pbkhlaWdodCA9IE1hdGgubWF4KDAsIGhlaWdodCAtIDcwKTsgLy8gb25seSBtb25pdG9yIHJlY2VudCB0eHNcbiAgICAgICAgbGV0IGxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEluY2x1ZGVPdXRwdXRzKHRydWUpKTtcbiAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgLy8gY29sbGVjdCBoYXNoZXMgb2YgdHhzIG5vIGxvbmdlciBsb2NrZWRcbiAgICAgICAgbGV0IG5vTG9uZ2VyTG9ja2VkSGFzaGVzID0gW107XG4gICAgICAgIGZvciAobGV0IHByZXZMb2NrZWRUeCBvZiB0aGF0LnByZXZMb2NrZWRUeHMpIHtcbiAgICAgICAgICBpZiAodGhhdC5nZXRUeChsb2NrZWRUeHMsIHByZXZMb2NrZWRUeC5nZXRIYXNoKCkpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIG5vTG9uZ2VyTG9ja2VkSGFzaGVzLnB1c2gocHJldkxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBzYXZlIGxvY2tlZCB0eHMgZm9yIG5leHQgY29tcGFyaXNvblxuICAgICAgICBsZXQgcHJldk1pbkhlaWdodCA9IHRoYXQucHJldkxvY2tlZFR4c01pbkhlaWdodDtcbiAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzID0gbG9ja2VkVHhzO1xuICAgICAgICB0aGF0LnByZXZMb2NrZWRUeHNNaW5IZWlnaHQgPSBtaW5IZWlnaHQ7XG4gICAgICAgIFxuICAgICAgICAvLyB1c2UgdGhlIHByZXZpb3VzIHNuYXBzaG90J3MgYm91bmQgc28gdHJhY2tlZCB0eHMgZG8gbm90IGFnZSBvdXQgYmV0d2VlbiBwb2xsc1xuICAgICAgICBsZXQgdW5sb2NrZWRUeHMgPSBub0xvbmdlckxvY2tlZEhhc2hlcy5sZW5ndGggPT09IDAgPyBbXSA6IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKGZhbHNlKS5zZXRNaW5IZWlnaHQocHJldk1pbkhlaWdodCkuc2V0SGFzaGVzKG5vTG9uZ2VyTG9ja2VkSGFzaGVzKS5zZXRJbmNsdWRlT3V0cHV0cyh0cnVlKSk7XG4gICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGF0LmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBuZXcgdW5jb25maXJtZWQgYW5kIGNvbmZpcm1lZCBvdXRwdXRzXG4gICAgICAgIGZvciAobGV0IGxvY2tlZFR4IG9mIGxvY2tlZFR4cykge1xuICAgICAgICAgIGxldCBzZWFyY2hTZXQgPSBsb2NrZWRUeC5nZXRJc0NvbmZpcm1lZCgpID8gdGhhdC5wcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucyA6IHRoYXQucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucztcbiAgICAgICAgICBsZXQgdW5hbm5vdW5jZWQgPSAhc2VhcmNoU2V0Lmhhcyhsb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIHNlYXJjaFNldC5hZGQobG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICBpZiAodW5hbm5vdW5jZWQpIGF3YWl0IHRoYXQubm90aWZ5T3V0cHV0cyhsb2NrZWRUeCwgZ2VuZXJhdGlvbik7XG4gICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBuZXcgdW5sb2NrZWQgb3V0cHV0c1xuICAgICAgICBmb3IgKGxldCB1bmxvY2tlZFR4IG9mIHVubG9ja2VkVHhzKSB7XG4gICAgICAgICAgbGV0IG1pc3NlZENvbmZpcm0gPSB1bmxvY2tlZFR4LmdldElzQ29uZmlybWVkKCkgJiYgIXRoYXQucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMuaGFzKHVubG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICB0aGF0LnByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnMuZGVsZXRlKHVubG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICB0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zLmRlbGV0ZSh1bmxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgaWYgKG1pc3NlZENvbmZpcm0pIHsgLy8gYW5ub3VuY2UgbWlzc2VkIGNvbmZpcm0gdHJhbnNpdGlvbiBpZiB0eCB1bmxvY2tlZCBiZXR3ZWVuIHBvbGxzXG4gICAgICAgICAgICBsZXQgY29uZmlybWVkVHggPSB1bmxvY2tlZFR4LmNvcHkoKS5zZXRJc0xvY2tlZCh0cnVlKTtcbiAgICAgICAgICAgIGNvbmZpcm1lZFR4LnNldEJsb2NrKHVubG9ja2VkVHguZ2V0QmxvY2soKS5jb3B5KCkuc2V0VHhzKFtjb25maXJtZWRUeF0pKTtcbiAgICAgICAgICAgIGF3YWl0IHRoYXQubm90aWZ5T3V0cHV0cyhjb25maXJtZWRUeCwgZ2VuZXJhdGlvbik7XG4gICAgICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoYXQubm90aWZ5T3V0cHV0cyh1bmxvY2tlZFR4LCBnZW5lcmF0aW9uKTtcbiAgICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIGJhbGFuY2UgY2hhbmdlc1xuICAgICAgICBhd2FpdCB0aGF0LmNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzKGdlbmVyYXRpb24pO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgaWYgKGdlbmVyYXRpb24gPT09IHRoYXQuZ2VuZXJhdGlvbiAmJiB0aGF0LmlzUG9sbGluZykgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBiYWNrZ3JvdW5kIHBvbGwgd2FsbGV0ICdcIiArIGF3YWl0IHRoYXQud2FsbGV0LmdldFBhdGgoKSArIFwiJzogXCIgKyBlcnIubWVzc2FnZSk7IC8vIGlnbm9yZSBlcnJvcnMgZnJvbSBwb2xscyBzdHJhZ2dsaW5nIGFmdGVyIHRoZSB3YWxsZXQgaXMgY2xvc2VkXG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICB0aGF0Lm51bVBvbGxpbmctLTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VOZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgbm90aWZ5T3V0cHV0cyh0eCwgZ2VuZXJhdGlvbikge1xuICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLmdlbmVyYXRpb24pIHJldHVybjtcbiAgXG4gICAgLy8gbm90aWZ5IHNwZW50IG91dHB1dHMgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBhbGxvdyBzY3JhcGUgb2YgdHggaW5wdXRzIHNvIHByb3ZpZGluZyBvbmUgaW5wdXQgd2l0aCBvdXRnb2luZyBhbW91bnRcbiAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydCh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KClcbiAgICAgICAgICAuc2V0QW1vdW50KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBbW91bnQoKSArIHR4LmdldEZlZSgpKVxuICAgICAgICAgIC5zZXRBY2NvdW50SW5kZXgodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFjY291bnRJbmRleCgpKVxuICAgICAgICAgIC5zZXRTdWJhZGRyZXNzSW5kZXgodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAxID8gdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldFN1YmFkZHJlc3NJbmRpY2VzKClbMF0gOiB1bmRlZmluZWQpIC8vIGluaXRpYWxpemUgaWYgdHJhbnNmZXIgc291cmNlZCBmcm9tIHNpbmdsZSBzdWJhZGRyZXNzXG4gICAgICAgICAgLnNldFR4KHR4KTtcbiAgICAgIHR4LnNldElucHV0cyhbb3V0cHV0XSk7XG4gICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFNwZW50KG91dHB1dCk7XG4gICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSByZWNlaXZlZCBvdXRwdXRzXG4gICAgaWYgKHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR4LmdldE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldE91dHB1dHMoKS5sZW5ndGggPiAwKSB7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogb3V0cHV0cyBvbmx5IHJldHVybmVkIGZvciBjb25maXJtZWQgdHhzXG4gICAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5nZXRPdXRwdXRzKCkpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFJlY2VpdmVkKG91dHB1dCk7XG4gICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgeyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGFsbG93IHNjcmFwZSBvZiB1bmNvbmZpcm1lZCByZWNlaXZlZCBvdXRwdXRzIHNvIHVzaW5nIGluY29taW5nIHRyYW5zZmVyIHZhbHVlc1xuICAgICAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB7XG4gICAgICAgICAgb3V0cHV0cy5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKVxuICAgICAgICAgICAgICAuc2V0QWNjb3VudEluZGV4KHRyYW5zZmVyLmdldEFjY291bnRJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0U3ViYWRkcmVzc0luZGV4KHRyYW5zZmVyLmdldFN1YmFkZHJlc3NJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0QW1vdW50KHRyYW5zZmVyLmdldEFtb3VudCgpKVxuICAgICAgICAgICAgICAuc2V0VHgodHgpKTtcbiAgICAgICAgfVxuICAgICAgICB0eC5zZXRPdXRwdXRzKG91dHB1dHMpO1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIGdldFR4KHR4cywgdHhIYXNoKSB7XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSBpZiAodHhIYXNoID09PSB0eC5nZXRIYXNoKCkpIHJldHVybiB0eDtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY2hlY2tGb3JDaGFuZ2VkQmFsYW5jZXMoZ2VuZXJhdGlvbikge1xuICAgIGxldCBiYWxhbmNlcyA9IGF3YWl0IHRoaXMud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMuZ2VuZXJhdGlvbikgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChiYWxhbmNlc1swXSAhPT0gdGhpcy5wcmV2QmFsYW5jZXNbMF0gfHwgYmFsYW5jZXNbMV0gIT09IHRoaXMucHJldkJhbGFuY2VzWzFdKSB7XG4gICAgICB0aGlzLnByZXZCYWxhbmNlcyA9IGJhbGFuY2VzO1xuICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQoYmFsYW5jZXNbMF0sIGJhbGFuY2VzWzFdKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGFBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFdBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FB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