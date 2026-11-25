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
    let timeout;
    try {
      return await new Promise(function (resolve, reject) {

        // fail if process does not start within the timeout
        if (config.cmdTimeoutMs > 0) timeout = setTimeout(() => reject(new _MoneroError.default("Failed to start monero-wallet-rpc within " + config.cmdTimeoutMs + " ms" + (output ? ":\n\n" + output : ""))), config.cmdTimeoutMs);

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
            try {

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
            } catch (err) {
              reject(err);
            }
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
      await _GenUtils.default.killProcess(childProcess, "SIGKILL"); // do not leave the process running
      throw new _MoneroError.default(err.message);
    } finally {
      clearTimeout(timeout);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiTW9uZXJvV2FsbGV0UnBjIiwiTW9uZXJvV2FsbGV0IiwiREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwiYWRkcmVzc0NhY2hlIiwic3luY1BlcmlvZEluTXMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRTZXJ2ZXIiLCJvcGVuV2FsbGV0IiwicGF0aE9yQ29uZmlnIiwicGFzc3dvcmQiLCJNb25lcm9XYWxsZXRDb25maWciLCJwYXRoIiwiZ2V0UGF0aCIsImdldFJlZ3Rlc3QiLCJzZW5kSnNvblJlcXVlc3QiLCJmaWxlbmFtZSIsImdldFBhc3N3b3JkIiwiY2xlYXIiLCJfaXNDbG9zZWQiLCJnZXRDb25uZWN0aW9uTWFuYWdlciIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsImNyZWF0ZVdhbGxldCIsImNvbmZpZ05vcm1hbGl6ZWQiLCJnZXRTZWVkIiwiZ2V0UHJpbWFyeUFkZHJlc3MiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFByaXZhdGVTcGVuZEtleSIsImdldE5ldHdvcmtUeXBlIiwiZ2V0QWNjb3VudExvb2thaGVhZCIsImdldFN1YmFkZHJlc3NMb29rYWhlYWQiLCJzZXRQYXNzd29yZCIsInNldFNlcnZlciIsImdldENvbm5lY3Rpb24iLCJjcmVhdGVXYWxsZXRGcm9tU2VlZCIsImNyZWF0ZVdhbGxldEZyb21LZXlzIiwiY3JlYXRlV2FsbGV0UmFuZG9tIiwiZ2V0U2VlZE9mZnNldCIsImdldFJlc3RvcmVIZWlnaHQiLCJnZXRTYXZlQ3VycmVudCIsImdldExhbmd1YWdlIiwic2V0TGFuZ3VhZ2UiLCJERUZBVUxUX0xBTkdVQUdFIiwicGFyYW1zIiwibGFuZ3VhZ2UiLCJlcnIiLCJoYW5kbGVDcmVhdGVXYWxsZXRFcnJvciIsInNlZWQiLCJzZWVkX29mZnNldCIsImVuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWwiLCJnZXRJc011bHRpc2lnIiwicmVzdG9yZV9oZWlnaHQiLCJhdXRvc2F2ZV9jdXJyZW50Iiwic2V0UmVzdG9yZUhlaWdodCIsImFkZHJlc3MiLCJ2aWV3a2V5Iiwic3BlbmRrZXkiLCJuYW1lIiwibWVzc2FnZSIsInRvTG93ZXJDYXNlIiwiaW5jbHVkZXMiLCJNb25lcm9ScGNFcnJvciIsImdldENvZGUiLCJnZXRScGNNZXRob2QiLCJnZXRScGNQYXJhbXMiLCJpc1ZpZXdPbmx5Iiwia2V5X3R5cGUiLCJlIiwidXJpT3JDb25uZWN0aW9uIiwiaXNUcnVzdGVkIiwic3NsT3B0aW9ucyIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiU3NsT3B0aW9ucyIsInNldEFsbG93QW55Q2VydCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsImdldFVyaSIsInVzZXJuYW1lIiwiZ2V0VXNlcm5hbWUiLCJ0cnVzdGVkIiwiaGFzQ2VydGlmaWNhdGVzIiwiZ2V0Q2VydGlmaWNhdGVBdXRob3JpdHlGaWxlIiwiZ2V0QWxsb3dlZEZpbmdlcnByaW50cyIsImxlbmd0aCIsInNzbF9zdXBwb3J0IiwiZ2V0QWxsb3dBbnlDZXJ0Iiwic3NsX3ByaXZhdGVfa2V5X3BhdGgiLCJnZXRQcml2YXRlS2V5UGF0aCIsInNzbF9jZXJ0aWZpY2F0ZV9wYXRoIiwiZ2V0Q2VydGlmaWNhdGVQYXRoIiwic3NsX2NhX2ZpbGUiLCJzc2xfYWxsb3dlZF9maW5nZXJwcmludHMiLCJzc2xfYWxsb3dfYW55X2NlcnQiLCJnZXRQcm94eVVyaSIsInN0YXJ0dXBQcm94eVVyaSIsInByb3h5IiwiaXNTYW1lUHJveHlVcmkiLCJkYWVtb25Db25uZWN0aW9uIiwicmVqZWN0VW5hdXRob3JpemVkIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImdldEJhbGFuY2VzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJhc3NlcnQiLCJlcXVhbCIsImJhbGFuY2UiLCJCaWdJbnQiLCJ1bmxvY2tlZEJhbGFuY2UiLCJhY2NvdW50IiwiZ2V0QWNjb3VudHMiLCJnZXRCYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudF9pbmRleCIsImFkZHJlc3NfaW5kaWNlcyIsInJlc3AiLCJyZXN1bHQiLCJ1bmxvY2tlZF9iYWxhbmNlIiwicGVyX3N1YmFkZHJlc3MiLCJhZGRMaXN0ZW5lciIsInJlZnJlc2hMaXN0ZW5pbmciLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiY2hlY2tSZXNlcnZlUHJvb2YiLCJpbmRleE9mIiwiZ2V0VmVyc2lvbiIsIk1vbmVyb1ZlcnNpb24iLCJ2ZXJzaW9uIiwicmVsZWFzZSIsImdldFNlZWRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJsYW5ndWFnZXMiLCJnZXRBZGRyZXNzIiwic3ViYWRkcmVzc01hcCIsImdldFN1YmFkZHJlc3NlcyIsImdldEFkZHJlc3NJbmRleCIsInN1YmFkZHJlc3MiLCJNb25lcm9TdWJhZGRyZXNzIiwic2V0QWNjb3VudEluZGV4IiwiaW5kZXgiLCJtYWpvciIsInNldEluZGV4IiwibWlub3IiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInN0YW5kYXJkQWRkcmVzcyIsInBheW1lbnRJZCIsImludGVncmF0ZWRBZGRyZXNzU3RyIiwic3RhbmRhcmRfYWRkcmVzcyIsInBheW1lbnRfaWQiLCJpbnRlZ3JhdGVkX2FkZHJlc3MiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImludGVncmF0ZWRBZGRyZXNzIiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJzZXRTdGFuZGFyZEFkZHJlc3MiLCJzZXRQYXltZW50SWQiLCJzZXRJbnRlZ3JhdGVkQWRkcmVzcyIsImdldEhlaWdodCIsImhlaWdodCIsImdldERhZW1vbkhlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsInN5bmMiLCJsaXN0ZW5lck9yU3RhcnRIZWlnaHQiLCJzdGFydEhlaWdodCIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwic3RhcnRfaGVpZ2h0IiwicG9sbCIsIk1vbmVyb1N5bmNSZXN1bHQiLCJibG9ja3NfZmV0Y2hlZCIsInJlY2VpdmVkX21vbmV5Iiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluU2Vjb25kcyIsIk1hdGgiLCJyb3VuZCIsImVuYWJsZSIsInBlcmlvZCIsIndhbGxldFBvbGxlciIsInNldFBlcmlvZEluTXMiLCJnZXRTeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwidHhpZHMiLCJyZXNjYW5TcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwic2tpcEJhbGFuY2VzIiwiYWNjb3VudHMiLCJycGNBY2NvdW50Iiwic3ViYWRkcmVzc19hY2NvdW50cyIsImNvbnZlcnRScGNBY2NvdW50Iiwic2V0U3ViYWRkcmVzc2VzIiwiZ2V0SW5kZXgiLCJwdXNoIiwic2V0QmFsYW5jZSIsInNldFVubG9ja2VkQmFsYW5jZSIsInNldE51bVVuc3BlbnRPdXRwdXRzIiwic2V0TnVtQmxvY2tzVG9VbmxvY2siLCJhbGxfYWNjb3VudHMiLCJycGNTdWJhZGRyZXNzIiwiY29udmVydFJwY1N1YmFkZHJlc3MiLCJnZXRBY2NvdW50SW5kZXgiLCJ0Z3RTdWJhZGRyZXNzIiwiZ2V0TnVtVW5zcGVudE91dHB1dHMiLCJnZXRBY2NvdW50IiwiRXJyb3IiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJNb25lcm9BY2NvdW50IiwicHJpbWFyeUFkZHJlc3MiLCJzdWJhZGRyZXNzSW5kaWNlcyIsImFkZHJlc3NfaW5kZXgiLCJsaXN0aWZ5Iiwic3ViYWRkcmVzc2VzIiwiYWRkcmVzc2VzIiwiZ2V0TnVtQmxvY2tzVG9VbmxvY2siLCJnZXRTdWJhZGRyZXNzIiwiY3JlYXRlU3ViYWRkcmVzcyIsInNldEFkZHJlc3MiLCJzZXRMYWJlbCIsInNldElzVXNlZCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwiZ2V0VHhzQXV4IiwibWF4QXR0ZW1wdHMiLCJxdWVyeU5vcm1hbGl6ZWQiLCJub3JtYWxpemVUeFF1ZXJ5IiwidHJhbnNmZXJRdWVyeSIsImdldFRyYW5zZmVyUXVlcnkiLCJpbnB1dFF1ZXJ5IiwiZ2V0SW5wdXRRdWVyeSIsIm91dHB1dFF1ZXJ5IiwiZ2V0T3V0cHV0UXVlcnkiLCJzZXRUcmFuc2ZlclF1ZXJ5Iiwic2V0SW5wdXRRdWVyeSIsInNldE91dHB1dFF1ZXJ5IiwidHJhbnNmZXJzIiwiZ2V0VHJhbnNmZXJzQXV4IiwiTW9uZXJvVHJhbnNmZXJRdWVyeSIsInNldFR4UXVlcnkiLCJkZWNvbnRleHR1YWxpemUiLCJjb3B5IiwidHhzIiwidHhzU2V0IiwiU2V0IiwidHJhbnNmZXIiLCJnZXRUeCIsImFkZCIsInR4TWFwIiwiYmxvY2tNYXAiLCJ0eCIsIm1lcmdlVHgiLCJnZXRJbmNsdWRlT3V0cHV0cyIsIm91dHB1dFF1ZXJ5QXV4IiwiTW9uZXJvT3V0cHV0UXVlcnkiLCJvdXRwdXRzIiwiZ2V0T3V0cHV0c0F1eCIsIm91dHB1dFR4cyIsIm91dHB1dCIsInR4c1F1ZXJpZWQiLCJtZWV0c0NyaXRlcmlhIiwiZ2V0QmxvY2siLCJzcGxpY2UiLCJnZXRJc0NvbmZpcm1lZCIsImNvbnNvbGUiLCJlcnJvciIsImdldEhhc2hlcyIsInR4c0J5SWQiLCJNYXAiLCJnZXRIYXNoIiwib3JkZXJlZFR4cyIsImhhc2giLCJnZXRUcmFuc2ZlcnMiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiaXNDb250ZXh0dWFsIiwiZ2V0VHhRdWVyeSIsImZpbHRlclRyYW5zZmVycyIsImdldE91dHB1dHMiLCJub3JtYWxpemVPdXRwdXRRdWVyeSIsImZpbHRlck91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwib3V0cHV0c19kYXRhX2hleCIsImltcG9ydE91dHB1dHMiLCJvdXRwdXRzSGV4IiwibnVtX2ltcG9ydGVkIiwiZXhwb3J0S2V5SW1hZ2VzIiwicnBjRXhwb3J0S2V5SW1hZ2VzIiwiaW1wb3J0S2V5SW1hZ2VzIiwia2V5SW1hZ2VzIiwib2Zmc2V0IiwicnBjS2V5SW1hZ2VzIiwibWFwIiwia2V5SW1hZ2UiLCJrZXlfaW1hZ2UiLCJnZXRIZXgiLCJzaWduYXR1cmUiLCJnZXRTaWduYXR1cmUiLCJzaWduZWRfa2V5X2ltYWdlcyIsImltcG9ydFJlc3VsdCIsIk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0Iiwic2V0SGVpZ2h0Iiwic2V0U3BlbnRBbW91bnQiLCJzcGVudCIsInNldFVuc3BlbnRBbW91bnQiLCJ1bnNwZW50IiwiZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQiLCJnZXRLZXlJbWFnZXMiLCJmcmVlemVPdXRwdXQiLCJ0aGF3T3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJmcm96ZW4iLCJnZXREZWZhdWx0RmVlUHJpb3JpdHkiLCJwcmlvcml0eSIsImNyZWF0ZVR4cyIsIm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyIsImdldENhblNwbGl0Iiwic2V0Q2FuU3BsaXQiLCJnZXRSZWxheSIsImlzTXVsdGlzaWciLCJnZXRTdWJhZGRyZXNzSW5kaWNlcyIsInNsaWNlIiwiZGVzdGluYXRpb25zIiwiZGVzdGluYXRpb24iLCJnZXREZXN0aW5hdGlvbnMiLCJnZXRBbW91bnQiLCJhbW91bnQiLCJnZXRTdWJ0cmFjdEZlZUZyb20iLCJzdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzIiwic3ViYWRkcl9pbmRpY2VzIiwiZ2V0UGF5bWVudElkIiwiZG9fbm90X3JlbGF5IiwiZ2V0UHJpb3JpdHkiLCJnZXRfdHhfaGV4IiwiZ2V0X3R4X21ldGFkYXRhIiwiZ2V0X3R4X2tleXMiLCJnZXRfdHhfa2V5IiwibnVtVHhzIiwiZmVlX2xpc3QiLCJmZWUiLCJjb3B5RGVzdGluYXRpb25zIiwiaSIsIk1vbmVyb1R4V2FsbGV0IiwiaW5pdFNlbnRUeFdhbGxldCIsImdldE91dGdvaW5nVHJhbnNmZXIiLCJzZXRTdWJhZGRyZXNzSW5kaWNlcyIsImNvbnZlcnRScGNTZW50VHhzVG9UeFNldCIsImNvbnZlcnRScGNUeFRvVHhTZXQiLCJzd2VlcE91dHB1dCIsIm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnIiwiZ2V0S2V5SW1hZ2UiLCJzZXRBbW91bnQiLCJzd2VlcFVubG9ja2VkIiwibm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyIsImluZGljZXMiLCJrZXlzIiwic2V0U3dlZXBFYWNoU3ViYWRkcmVzcyIsImdldFN3ZWVwRWFjaFN1YmFkZHJlc3MiLCJycGNTd2VlcEFjY291bnQiLCJzd2VlcER1c3QiLCJyZWxheSIsInR4U2V0Iiwic2V0SXNSZWxheWVkIiwic2V0SW5UeFBvb2wiLCJnZXRJc1JlbGF5ZWQiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiQXJyYXkiLCJpc0FycmF5IiwidHhPck1ldGFkYXRhIiwibWV0YWRhdGEiLCJnZXRNZXRhZGF0YSIsImhleCIsInR4X2hhc2giLCJkZXNjcmliZVR4U2V0IiwidW5zaWduZWRfdHhzZXQiLCJnZXRVbnNpZ25lZFR4SGV4IiwibXVsdGlzaWdfdHhzZXQiLCJnZXRNdWx0aXNpZ1R4SGV4IiwiY29udmVydFJwY0Rlc2NyaWJlVHJhbnNmZXIiLCJzaWduVHhzIiwidW5zaWduZWRUeEhleCIsImV4cG9ydF9yYXciLCJzdWJtaXRUeHMiLCJzaWduZWRUeEhleCIsInR4X2RhdGFfaGV4IiwidHhfaGFzaF9saXN0Iiwic2lnbk1lc3NhZ2UiLCJzaWduYXR1cmVUeXBlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJTSUdOX1dJVEhfU1BFTkRfS0VZIiwiZGF0YSIsInNpZ25hdHVyZV90eXBlIiwidmVyaWZ5TWVzc2FnZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJnb29kIiwiaXNHb29kIiwiaXNPbGQiLCJvbGQiLCJTSUdOX1dJVEhfVklFV19LRVkiLCJnZXRUeEtleSIsInR4SGFzaCIsInR4aWQiLCJ0eF9rZXkiLCJjaGVja1R4S2V5IiwidHhLZXkiLCJjaGVjayIsIk1vbmVyb0NoZWNrVHgiLCJzZXRJc0dvb2QiLCJzZXROdW1Db25maXJtYXRpb25zIiwiY29uZmlybWF0aW9ucyIsImluX3Bvb2wiLCJzZXRSZWNlaXZlZEFtb3VudCIsInJlY2VpdmVkIiwiZ2V0VHhQcm9vZiIsImNoZWNrVHhQcm9vZiIsInN0YXJ0c1dpdGgiLCJnZXRTcGVuZFByb29mIiwiY2hlY2tTcGVuZFByb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsIk1vbmVyb0NoZWNrUmVzZXJ2ZSIsInNldFVuY29uZmlybWVkU3BlbnRBbW91bnQiLCJzZXRUb3RhbEFtb3VudCIsInRvdGFsIiwiZ2V0VHhOb3RlcyIsIm5vdGVzIiwic2V0VHhOb3RlcyIsIm5vdGUiLCJpc0luaXRpYWxpemVkIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiZW50cmllcyIsInJwY0VudHJ5IiwiTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsInNldERlc2NyaXB0aW9uIiwiZGVzY3JpcHRpb24iLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJzZXRfYWRkcmVzcyIsInNldF9kZXNjcmlwdGlvbiIsImRlbGV0ZUFkZHJlc3NCb29rRW50cnkiLCJlbnRyeUlkeCIsInRhZ0FjY291bnRzIiwiYWNjb3VudEluZGljZXMiLCJ1bnRhZ0FjY291bnRzIiwiZ2V0QWNjb3VudFRhZ3MiLCJ0YWdzIiwiYWNjb3VudF90YWdzIiwicnBjQWNjb3VudFRhZyIsIk1vbmVyb0FjY291bnRUYWciLCJzZXRBY2NvdW50VGFnTGFiZWwiLCJnZXRQYXltZW50VXJpIiwicmVjaXBpZW50X25hbWUiLCJnZXRSZWNpcGllbnROYW1lIiwidHhfZGVzY3JpcHRpb24iLCJnZXROb3RlIiwidXJpIiwicGFyc2VQYXltZW50VXJpIiwiTW9uZXJvVHhDb25maWciLCJzZXRSZWNpcGllbnROYW1lIiwic2V0Tm90ZSIsImdldEF0dHJpYnV0ZSIsInZhbHVlIiwic2V0QXR0cmlidXRlIiwidmFsIiwic3RhcnRNaW5pbmciLCJudW1UaHJlYWRzIiwiYmFja2dyb3VuZE1pbmluZyIsImlnbm9yZUJhdHRlcnkiLCJ0aHJlYWRzX2NvdW50IiwiZG9fYmFja2dyb3VuZF9taW5pbmciLCJpZ25vcmVfYmF0dGVyeSIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwibXVsdGlzaWdfaW1wb3J0X25lZWRlZCIsImdldE11bHRpc2lnSW5mbyIsImluZm8iLCJNb25lcm9NdWx0aXNpZ0luZm8iLCJzZXRJc011bHRpc2lnIiwibXVsdGlzaWciLCJzZXRJc1JlYWR5IiwicmVhZHkiLCJzZXRUaHJlc2hvbGQiLCJ0aHJlc2hvbGQiLCJzZXROdW1QYXJ0aWNpcGFudHMiLCJwcmVwYXJlTXVsdGlzaWciLCJtdWx0aXNpZ19pbmZvIiwibWFrZU11bHRpc2lnIiwibXVsdGlzaWdIZXhlcyIsImV4Y2hhbmdlTXVsdGlzaWdLZXlzIiwibXNSZXN1bHQiLCJNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQiLCJzZXRNdWx0aXNpZ0hleCIsImdldE11bHRpc2lnSGV4IiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJpbXBvcnRNdWx0aXNpZ0hleCIsInJlZnJlc2hBZnRlckltcG9ydCIsInJlZnJlc2hfYWZ0ZXJfaW1wb3J0Iiwibl9vdXRwdXRzIiwic2lnbk11bHRpc2lnVHhIZXgiLCJtdWx0aXNpZ1R4SGV4Iiwic2lnblJlc3VsdCIsIk1vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsInNldFNpZ25lZE11bHRpc2lnVHhIZXgiLCJzZXRUeEhhc2hlcyIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4IiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwib2xkX3Bhc3N3b3JkIiwibmV3X3Bhc3N3b3JkIiwic2F2ZSIsImNsb3NlIiwiaXNDbG9zZWQiLCJzdG9wIiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJnZXRPdXRnb2luZ1RyYW5zZmVycyIsImNyZWF0ZVR4IiwicmVsYXlUeCIsImdldFR4Tm90ZSIsInNldFR4Tm90ZSIsImNvbm5lY3RUb1dhbGxldFJwYyIsInVyaU9yQ29uZmlnIiwibm9ybWFsaXplQ29uZmlnIiwiY21kIiwic3RhcnRXYWxsZXRScGNQcm9jZXNzIiwiY2hpbGRfcHJvY2VzcyIsIlByb21pc2UiLCJyZXNvbHZlIiwidGhlbiIsImNoaWxkUHJvY2VzcyIsInNwYXduIiwiZW52IiwiTEFORyIsInN0ZG91dCIsInNldEVuY29kaW5nIiwic3RkZXJyIiwidGhhdCIsInRpbWVvdXQiLCJyZWplY3QiLCJjbWRUaW1lb3V0TXMiLCJzZXRUaW1lb3V0Iiwib24iLCJsaW5lIiwidG9TdHJpbmciLCJMaWJyYXJ5VXRpbHMiLCJsb2ciLCJ1cmlMaW5lQ29udGFpbnMiLCJ1cmlMaW5lQ29udGFpbnNJZHgiLCJob3N0Iiwic3Vic3RyaW5nIiwibGFzdEluZGV4T2YiLCJ1bmZvcm1hdHRlZExpbmUiLCJyZXBsYWNlIiwidHJpbSIsInBvcnQiLCJzc2xJZHgiLCJzc2xFbmFibGVkIiwidXNlclBhc3NJZHgiLCJ1c2VyUGFzcyIsInptcVVyaUlkeCIsInptcVVyaSIsInByb3h5VXJpSWR4IiwicHJveHlVcmkiLCJ3YWxsZXQiLCJpc1Jlc29sdmVkIiwiZ2V0TG9nTGV2ZWwiLCJjb2RlIiwib3JpZ2luIiwiY2xlYXJUaW1lb3V0IiwibGlzdGVuZXJHZW5lcmF0aW9uIiwicmVzZXQiLCJnZXRBY2NvdW50SW5kaWNlcyIsInR4UXVlcnkiLCJjYW5CZUNvbmZpcm1lZCIsImdldEluVHhQb29sIiwiZ2V0SXNGYWlsZWQiLCJjYW5CZUluVHhQb29sIiwiZ2V0TWF4SGVpZ2h0IiwiZ2V0SXNMb2NrZWQiLCJjYW5CZUluY29taW5nIiwiZ2V0SXNJbmNvbWluZyIsImdldElzT3V0Z29pbmciLCJnZXRIYXNEZXN0aW5hdGlvbnMiLCJjYW5CZU91dGdvaW5nIiwiaW4iLCJvdXQiLCJwb29sIiwicGVuZGluZyIsImZhaWxlZCIsImdldE1pbkhlaWdodCIsIm1pbl9oZWlnaHQiLCJtYXhfaGVpZ2h0IiwiZmlsdGVyX2J5X2hlaWdodCIsImdldFN1YmFkZHJlc3NJbmRleCIsInNpemUiLCJmcm9tIiwicnBjVHgiLCJjb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIiLCJnZXRPdXRnb2luZ0Ftb3VudCIsIm91dGdvaW5nVHJhbnNmZXIiLCJ0cmFuc2ZlclRvdGFsIiwidmFsdWVzIiwic29ydCIsImNvbXBhcmVUeHNCeUhlaWdodCIsInNldElzSW5jb21pbmciLCJzZXRJc091dGdvaW5nIiwiY29tcGFyZUluY29taW5nVHJhbnNmZXJzIiwidHJhbnNmZXJfdHlwZSIsImdldElzU3BlbnQiLCJ2ZXJib3NlIiwicnBjT3V0cHV0IiwiY29udmVydFJwY1R4V2l0aE91dHB1dCIsImNvbXBhcmVPdXRwdXRzIiwicnBjSW1hZ2UiLCJNb25lcm9LZXlJbWFnZSIsIk1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0Iiwic2V0T2Zmc2V0Iiwic2V0S2V5SW1hZ2VzIiwiYmVsb3dfYW1vdW50IiwiZ2V0QmVsb3dBbW91bnQiLCJzZXRJc0xvY2tlZCIsInNldElzQ29uZmlybWVkIiwic2V0UmVsYXkiLCJzZXRJc01pbmVyVHgiLCJzZXRJc0ZhaWxlZCIsIk1vbmVyb0Rlc3RpbmF0aW9uIiwic2V0RGVzdGluYXRpb25zIiwic2V0T3V0Z29pbmdUcmFuc2ZlciIsImdldFVubG9ja1RpbWUiLCJzZXRVbmxvY2tUaW1lIiwiZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJzZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsIkRhdGUiLCJnZXRUaW1lIiwiZ2V0SXNEb3VibGVTcGVuZFNlZW4iLCJzZXRJc0RvdWJsZVNwZW5kU2VlbiIsImxpc3RlbmVycyIsIldhbGxldFBvbGxlciIsInNldElzUG9sbGluZyIsImlzUG9sbGluZyIsInNlcnZlciIsInByb3h5VG9Xb3JrZXIiLCJzZXRQcmltYXJ5QWRkcmVzcyIsInNldFRhZyIsImdldFRhZyIsInNldFJpbmdTaXplIiwiTW9uZXJvVXRpbHMiLCJSSU5HX1NJWkUiLCJNb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwic2V0VHgiLCJkZXN0Q29waWVzIiwiZGVzdCIsImNvbnZlcnRScGNUeFNldCIsInJwY01hcCIsIk1vbmVyb1R4U2V0Iiwic2V0TXVsdGlzaWdUeEhleCIsInNldFVuc2lnbmVkVHhIZXgiLCJzZXRTaWduZWRUeEhleCIsInNpZ25lZF90eHNldCIsImdldFNpZ25lZFR4SGV4IiwicnBjVHhzIiwic2V0VHhzIiwic2V0VHhTZXQiLCJzZXRIYXNoIiwic2V0S2V5Iiwic2V0RnVsbEhleCIsInNldE1ldGFkYXRhIiwic2V0RmVlIiwic2V0V2VpZ2h0IiwiaW5wdXRLZXlJbWFnZXNMaXN0IiwiYXNzZXJ0VHJ1ZSIsImdldElucHV0cyIsInNldElucHV0cyIsImlucHV0S2V5SW1hZ2UiLCJNb25lcm9PdXRwdXRXYWxsZXQiLCJzZXRLZXlJbWFnZSIsInNldEhleCIsImFtb3VudHNCeURlc3RMaXN0IiwiZGVzdGluYXRpb25JZHgiLCJ0eElkeCIsImFtb3VudHNCeURlc3QiLCJpc091dGdvaW5nIiwidHlwZSIsImRlY29kZVJwY1R5cGUiLCJoZWFkZXIiLCJzZXRTaXplIiwiTW9uZXJvQmxvY2tIZWFkZXIiLCJzZXRUaW1lc3RhbXAiLCJNb25lcm9JbmNvbWluZ1RyYW5zZmVyIiwic2V0TnVtU3VnZ2VzdGVkQ29uZmlybWF0aW9ucyIsIkRFRkFVTFRfUEFZTUVOVF9JRCIsInJwY0luZGljZXMiLCJycGNJbmRleCIsInNldFN1YmFkZHJlc3NJbmRleCIsInJwY0Rlc3RpbmF0aW9uIiwiZGVzdGluYXRpb25LZXkiLCJycGNTb3VyY2UiLCJpbnB1dCIsImdsb2JhbF9pbmRleCIsInB1YmtleSIsInNldFN0ZWFsdGhQdWJsaWNLZXkiLCJzZXRJbnB1dFN1bSIsInNldE91dHB1dFN1bSIsInNldENoYW5nZUFkZHJlc3MiLCJzZXRDaGFuZ2VBbW91bnQiLCJzZXROdW1EdW1teU91dHB1dHMiLCJzZXRFeHRyYUhleCIsImlucHV0S2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsImFtb3VudHMiLCJzZXRCbG9jayIsIk1vbmVyb0Jsb2NrIiwibWVyZ2UiLCJzZXRJbmNvbWluZ1RyYW5zZmVycyIsInNldElzU3BlbnQiLCJzZXRJc0Zyb3plbiIsInNldE91dHB1dHMiLCJycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0IiwicnBjVHlwZSIsImFUeCIsImFCbG9jayIsInR4MSIsInR4MiIsImRpZmYiLCJ0MSIsInQyIiwibzEiLCJvMiIsImhlaWdodENvbXBhcmlzb24iLCJjb21wYXJlIiwibG9jYWxlQ29tcGFyZSIsImV4cG9ydHMiLCJwcmV2TG9ja2VkVHhzTWluSGVpZ2h0IiwiZ2VuZXJhdGlvbiIsInNuYXBzaG90R2VuZXJhdGlvbiIsImxvb3BlciIsIlRhc2tMb29wZXIiLCJwcmV2TG9ja2VkVHhzIiwicHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucyIsInByZXZDb25maXJtZWROb3RpZmljYXRpb25zIiwidGhyZWFkUG9vbCIsIlRocmVhZFBvb2wiLCJudW1Qb2xsaW5nIiwic3RhcnQiLCJwZXJpb2RJbk1zIiwic3VibWl0IiwicHJldkhlaWdodCIsInByZXZCYWxhbmNlcyIsIk1vbmVyb1R4UXVlcnkiLCJvbk5ld0Jsb2NrIiwibWluSGVpZ2h0IiwibWF4IiwibG9ja2VkVHhzIiwic2V0TWluSGVpZ2h0Iiwic2V0SW5jbHVkZU91dHB1dHMiLCJub0xvbmdlckxvY2tlZEhhc2hlcyIsInByZXZMb2NrZWRUeCIsInByZXZNaW5IZWlnaHQiLCJ1bmxvY2tlZFR4cyIsInNldEhhc2hlcyIsImxvY2tlZFR4Iiwic2VhcmNoU2V0IiwidW5hbm5vdW5jZWQiLCJub3RpZnlPdXRwdXRzIiwidW5sb2NrZWRUeCIsIm1pc3NlZENvbmZpcm0iLCJkZWxldGUiLCJjb25maXJtZWRUeCIsImNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzIiwiYW5ub3VuY2VOZXdCbG9jayIsImdldEZlZSIsImFubm91bmNlT3V0cHV0U3BlbnQiLCJhbm5vdW5jZU91dHB1dFJlY2VpdmVkIiwiYmFsYW5jZXMiLCJhbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRScGMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4uL2NvbW1vbi9UYXNrTG9vcGVyXCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50XCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudFRhZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50VGFnXCI7XG5pbXBvcnQgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BZGRyZXNzQm9va0VudHJ5XCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrSGVhZGVyIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tIZWFkZXJcIjtcbmltcG9ydCBNb25lcm9DaGVja1Jlc2VydmUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tSZXNlcnZlXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvRGVzdGluYXRpb24gZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGVzdGluYXRpb25cIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbmNvbWluZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnU2lnblJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb091dGdvaW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0Z29pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvUnBjRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNFcnJvclwiO1xuaW1wb3J0IE1vbmVyb1N1YmFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHggZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9UeFwiO1xuaW1wb3J0IE1vbmVyb1R4Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvVHhQcmlvcml0eSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFByaW9yaXR5XCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuLi9jb21tb24vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdFwiO1xuaW1wb3J0IFRocmVhZFBvb2wgZnJvbSBcIi4uL2NvbW1vbi9UaHJlYWRQb29sXCI7XG5pbXBvcnQgU3NsT3B0aW9ucyBmcm9tIFwiLi4vY29tbW9uL1NzbE9wdGlvbnNcIjtcbmltcG9ydCB7IENoaWxkUHJvY2VzcyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5cbi8qKlxuICogQ29weXJpZ2h0IChjKSB3b29kc2VyXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9XYWxsZXQgYXMgYSBjbGllbnQgb2YgbW9uZXJvLXdhbGxldC1ycGMuXG4gKiBcbiAqIEBpbXBsZW1lbnRzIHtNb25lcm9XYWxsZXR9XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1dhbGxldFJwYyBleHRlbmRzIE1vbmVyb1dhbGxldCB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgPSAyMDAwMDsgLy8gZGVmYXVsdCBwZXJpb2QgYmV0d2VlbiBzeW5jcyBpbiBtcyAoZGVmaW5lZCBieSBERUZBVUxUX0FVVE9fUkVGUkVTSF9QRVJJT0QgaW4gd2FsbGV0X3JwY19zZXJ2ZXIuY3BwKVxuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz47XG4gIHByb3RlY3RlZCBhZGRyZXNzQ2FjaGU6IGFueTtcbiAgcHJvdGVjdGVkIHN5bmNQZXJpb2RJbk1zOiBudW1iZXI7XG4gIHByb3RlY3RlZCBsaXN0ZW5lcnM6IE1vbmVyb1dhbGxldExpc3RlbmVyW107XG4gIHByb3RlY3RlZCBwcm9jZXNzOiBhbnk7XG4gIHByb3RlY3RlZCBwYXRoOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBkYWVtb25Db25uZWN0aW9uOiBNb25lcm9ScGNDb25uZWN0aW9uO1xuICBwcm90ZWN0ZWQgd2FsbGV0UG9sbGVyOiBXYWxsZXRQb2xsZXI7XG4gIHByb3RlY3RlZCBzdGFydHVwUHJveHlVcmk6IHN0cmluZztcbiAgXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTsgLy8gYXZvaWQgdW5lY2Vzc2FyeSByZXF1ZXN0cyBmb3IgYWRkcmVzc2VzXG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IE1vbmVyb1dhbGxldFJwYy5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUlBDIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaW50ZXJuYWwgcHJvY2VzcyBydW5uaW5nIG1vbmVyby13YWxsZXQtcnBjLlxuICAgKiBcbiAgICogQHJldHVybiB7Q2hpbGRQcm9jZXNzfSB0aGUgcHJvY2VzcyBydW5uaW5nIG1vbmVyby13YWxsZXQtcnBjLCB1bmRlZmluZWQgaWYgbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1xuICAgKi9cbiAgZ2V0UHJvY2VzcygpOiBDaGlsZFByb2Nlc3Mge1xuICAgIHJldHVybiB0aGlzLnByb2Nlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9wIHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMsIGlmIGFwcGxpY2FibGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZvcmNlIHNwZWNpZmllcyBpZiB0aGUgcHJvY2VzcyBzaG91bGQgYmUgZGVzdHJveWVkIGZvcmNpYmx5IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD59IHRoZSBleGl0IGNvZGUgZnJvbSBzdG9wcGluZyB0aGUgcHJvY2Vzc1xuICAgKi9cbiAgYXN5bmMgc3RvcFByb2Nlc3MoZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPiAge1xuICAgIGlmICh0aGlzLnByb2Nlc3MgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0UnBjIGluc3RhbmNlIG5vdCBjcmVhdGVkIGZyb20gbmV3IHByb2Nlc3NcIik7XG4gICAgbGV0IGxpc3RlbmVyc0NvcHkgPSBHZW5VdGlscy5jb3B5QXJyYXkodGhpcy5nZXRMaXN0ZW5lcnMoKSk7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgbGlzdGVuZXJzQ29weSkgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgcmV0dXJuIEdlblV0aWxzLmtpbGxQcm9jZXNzKHRoaXMucHJvY2VzcywgZm9yY2UgPyBcIlNJR0tJTExcIiA6IHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIFJQQyBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZH0gdGhlIHdhbGxldCdzIHJwYyBjb25uZWN0aW9uXG4gICAqL1xuICBnZXRScGNDb25uZWN0aW9uKCk6IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPk9wZW4gYW4gZXhpc3Rpbmcgd2FsbGV0IG9uIHRoZSBtb25lcm8td2FsbGV0LXJwYyBzZXJ2ZXIuPC9wPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZTo8cD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiBsZXQgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldFJwYyhcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODRcIiwgXCJycGNfdXNlclwiLCBcImFiYzEyM1wiKTs8YnI+XG4gICAqIGF3YWl0IHdhbGxldC5vcGVuV2FsbGV0KFwibXl3YWxsZXQxXCIsIFwic3VwZXJzZWNyZXRwYXNzd29yZFwiKTs8YnI+XG4gICAqIDxicj5cbiAgICogYXdhaXQgd2FsbGV0Lm9wZW5XYWxsZXQoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwibXl3YWxsZXQyXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwic3VwZXJzZWNyZXRwYXNzd29yZFwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHNlcnZlcjogXCJodHRwOi8vbG9jYWhvc3Q6MzgwODFcIiwgLy8gb3Igb2JqZWN0IHdpdGggdXJpLCB1c2VybmFtZSwgcGFzc3dvcmQsIGV0YyA8YnI+XG4gICAqICZuYnNwOyZuYnNwOyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlPGJyPlxuICAgKiB9KTs8YnI+XG4gICAqIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfE1vbmVyb1dhbGxldENvbmZpZ30gcGF0aE9yQ29uZmlnICAtIHRoZSB3YWxsZXQncyBuYW1lIG9yIGNvbmZpZ3VyYXRpb24gdG8gb3BlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aE9yQ29uZmlnLnBhdGggLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoT3JDb25maWcucGFzc3dvcmQgLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ3xQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fSBwYXRoT3JDb25maWcuc2VydmVyIC0gdXJpIG9yIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb2YgYSBkYWVtb24gdG8gdXNlIChvcHRpb25hbCwgbW9uZXJvLXdhbGxldC1ycGMgdXN1YWxseSBzdGFydGVkIHdpdGggZGFlbW9uIGNvbmZpZylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtwYXNzd29yZF0gdGhlIHdhbGxldCdzIHBhc3N3b3JkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvV2FsbGV0UnBjPn0gdGhpcyB3YWxsZXQgY2xpZW50XG4gICAqL1xuICBhc3luYyBvcGVuV2FsbGV0KHBhdGhPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+LCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh0eXBlb2YgcGF0aE9yQ29uZmlnID09PSBcInN0cmluZ1wiID8ge3BhdGg6IHBhdGhPckNvbmZpZywgcGFzc3dvcmQ6IHBhc3N3b3JkID8gcGFzc3dvcmQgOiBcIlwifSA6IHBhdGhPckNvbmZpZyk7XG4gICAgLy8gVE9ETzogZW5zdXJlIG90aGVyIGZpZWxkcyB1bmluaXRpYWxpemVkP1xuICAgIFxuICAgIC8vIG9wZW4gd2FsbGV0IG9uIHJwYyBzZXJ2ZXJcbiAgICBpZiAoIWNvbmZpZy5nZXRQYXRoKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBuYW1lIG9mIHdhbGxldCB0byBvcGVuXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVndGVzdCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHJlZ3Rlc3QgbW9kZSB3aGVuIG9wZW5pbmcgUlBDIHdhbGxldFwiKVxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm9wZW5fd2FsbGV0XCIsIHtmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSwgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpfSk7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgdGhpcy5faXNDbG9zZWQgPSBmYWxzZTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXIgb3Igc2VydmVyXG4gICAgaWYgKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpICE9IG51bGwpIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgb3BlbmVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGF3YWl0IHRoaXMuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIH0gZWxzZSBpZiAoY29uZmlnLmdldFNlcnZlcigpICE9IG51bGwpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2V0RGFlbW9uQ29ubmVjdGlvbihjb25maWcuZ2V0U2VydmVyKCkpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPkNyZWF0ZSBhbmQgb3BlbiBhIHdhbGxldCBvbiB0aGUgbW9uZXJvLXdhbGxldC1ycGMgc2VydmVyLjxwPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZTo8cD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiAmc29sOyZzb2w7IGNvbnN0cnVjdCBjbGllbnQgdG8gbW9uZXJvLXdhbGxldC1ycGM8YnI+XG4gICAqIGxldCB3YWxsZXRScGMgPSBuZXcgTW9uZXJvV2FsbGV0UnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4NFwiLCBcInJwY191c2VyXCIsIFwiYWJjMTIzXCIpOzxicj48YnI+XG4gICAqIFxuICAgKiAmc29sOyZzb2w7IGNyZWF0ZSBhbmQgb3BlbiB3YWxsZXQgb24gbW9uZXJvLXdhbGxldC1ycGM8YnI+XG4gICAqIGF3YWl0IHdhbGxldFJwYy5jcmVhdGVXYWxsZXQoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwibXl3YWxsZXRcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJhYmMxMjNcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBzZWVkOiBcImNvZXhpc3QgaWdsb28gcGFtcGhsZXQgbGFnb29uLi4uXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcmVzdG9yZUhlaWdodDogMTU0MzIxOGw8YnI+XG4gICAqIH0pO1xuICAgKiAgPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz59IGNvbmZpZyAtIE1vbmVyb1dhbGxldENvbmZpZyBvciBlcXVpdmFsZW50IEpTIG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXRoXSAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCBpbi1tZW1vcnkgd2FsbGV0IGlmIG5vdCBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGFzc3dvcmRdIC0gcGFzc3dvcmQgb2YgdGhlIHdhbGxldCB0byBjcmVhdGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZF0gLSBzZWVkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgcmFuZG9tIHdhbGxldCBjcmVhdGVkIGlmIG5laXRoZXIgc2VlZCBub3Iga2V5cyBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZE9mZnNldF0gLSB0aGUgb2Zmc2V0IHVzZWQgdG8gZGVyaXZlIGEgbmV3IHNlZWQgZnJvbSB0aGUgZ2l2ZW4gc2VlZCB0byByZWNvdmVyIGEgc2VjcmV0IHdhbGxldCBmcm9tIHRoZSBzZWVkXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5pc011bHRpc2lnXSAtIHJlc3RvcmUgbXVsdGlzaWcgd2FsbGV0IGZyb20gc2VlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcmltYXJ5QWRkcmVzc10gLSBwcmltYXJ5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9ubHkgcHJvdmlkZSBpZiByZXN0b3JpbmcgZnJvbSBrZXlzKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlVmlld0tleV0gLSBwcml2YXRlIHZpZXcga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVNwZW5kS2V5XSAtIHByaXZhdGUgc3BlbmQga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcucmVzdG9yZUhlaWdodF0gLSBibG9jayBoZWlnaHQgdG8gc3RhcnQgc2Nhbm5pbmcgZnJvbSAoZGVmYXVsdHMgdG8gMCB1bmxlc3MgZ2VuZXJhdGluZyByYW5kb20gd2FsbGV0KVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5sYW5ndWFnZV0gLSBsYW5ndWFnZSBvZiB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQgKGRlZmF1bHRzIHRvIFwiRW5nbGlzaFwiIG9yIGF1dG8tZGV0ZWN0ZWQpXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gW2NvbmZpZy5zZXJ2ZXJdIC0gTW9uZXJvUnBjQ29ubmVjdGlvbiB0byBhIG1vbmVybyBkYWVtb24gKG9wdGlvbmFsKTxicj5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyVXJpXSAtIHVyaSBvZiBhIGRhZW1vbiB0byB1c2UgKG9wdGlvbmFsLCBtb25lcm8td2FsbGV0LXJwYyB1c3VhbGx5IHN0YXJ0ZWQgd2l0aCBkYWVtb24gY29uZmlnKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZXJ2ZXJVc2VybmFtZV0gLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgZGFlbW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyUGFzc3dvcmRdIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIGRhZW1vbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJ9IFtjb25maWcuY29ubmVjdGlvbk1hbmFnZXJdIC0gbWFuYWdlIGNvbm5lY3Rpb25zIHRvIG1vbmVyb2QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVqZWN0VW5hdXRob3JpemVkXSAtIHJlamVjdCBzZWxmLXNpZ25lZCBzZXJ2ZXIgY2VydGlmaWNhdGVzIGlmIHRydWUgKGRlZmF1bHRzIHRvIHRydWUpXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gW2NvbmZpZy5zZXJ2ZXJdIC0gTW9uZXJvUnBjQ29ubmVjdGlvbiBvciBlcXVpdmFsZW50IEpTIG9iamVjdCBwcm92aWRpbmcgZGFlbW9uIGNvbmZpZ3VyYXRpb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuc2F2ZUN1cnJlbnRdIC0gc3BlY2lmaWVzIGlmIHRoZSBjdXJyZW50IFJQQyB3YWxsZXQgc2hvdWxkIGJlIHNhdmVkIGJlZm9yZSBiZWluZyBjbG9zZWQgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHJldHVybiB7TW9uZXJvV2FsbGV0UnBjfSB0aGlzIHdhbGxldCBjbGllbnRcbiAgICovXG4gIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBjb25maWcgdG8gY3JlYXRlIHdhbGxldFwiKTtcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkICYmIChjb25maWdOb3JtYWxpemVkLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVWaWV3S2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIGluaXRpYWxpemVkIHdpdGggYSBzZWVkIG9yIGtleXMgYnV0IG5vdCBib3RoXCIpO1xuICAgIH1cbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWd0ZXN0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcmVndGVzdCBtb2RlIHdoZW4gY3JlYXRpbmcgUlBDIHdhbGxldFwiKVxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldE5ldHdvcmtUeXBlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgbmV0d29ya1R5cGUgd2hlbiBjcmVhdGluZyBSUEMgd2FsbGV0IGJlY2F1c2Ugc2VydmVyJ3MgbmV0d29yayB0eXBlIGlzIGFscmVhZHkgc2V0XCIpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRMb29rYWhlYWQoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0xvb2thaGVhZCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgY3JlYXRpbmcgd2FsbGV0cyB3aXRoIHN1YmFkZHJlc3MgbG9va2FoZWFkIG92ZXIgcnBjXCIpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFBhc3N3b3JkKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRQYXNzd29yZChcIlwiKTtcblxuICAgIC8vIHNldCBzZXJ2ZXIgZnJvbSBjb25uZWN0aW9uIG1hbmFnZXIgaWYgcHJvdmlkZWRcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBjcmVhdGVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGNvbmZpZ05vcm1hbGl6ZWQuc2V0U2VydmVyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpLmdldENvbm5lY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIHdhbGxldFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZ05vcm1hbGl6ZWQpO1xuICAgIGVsc2UgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWdOb3JtYWxpemVkKTtcbiAgICBlbHNlIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZ05vcm1hbGl6ZWQpO1xuICAgIHRoaXMuX2lzQ2xvc2VkID0gZmFsc2U7XG5cbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyIG9yIHNlcnZlclxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnTm9ybWFsaXplZC5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICB9IGVsc2UgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2V0RGFlbW9uQ29ubmVjdGlvbihjb25maWdOb3JtYWxpemVkLmdldFNlcnZlcigpKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRSYW5kb20oY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpIHtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSByZXN0b3JlSGVpZ2h0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNhdmVDdXJyZW50KCkgPT09IGZhbHNlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDdXJyZW50IHdhbGxldCBpcyBzYXZlZCBhdXRvbWF0aWNhbGx5IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICBpZiAoIWNvbmZpZy5nZXRQYXRoKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5hbWUgaXMgbm90IGluaXRpYWxpemVkXCIpO1xuICAgIGlmICghY29uZmlnLmdldExhbmd1YWdlKCkpIGNvbmZpZy5zZXRMYW5ndWFnZShNb25lcm9XYWxsZXQuREVGQVVMVF9MQU5HVUFHRSk7XG4gICAgbGV0IHBhcmFtcyA9IHsgZmlsZW5hbWU6IGNvbmZpZy5nZXRQYXRoKCksIHBhc3N3b3JkOiBjb25maWcuZ2V0UGFzc3dvcmQoKSwgbGFuZ3VhZ2U6IGNvbmZpZy5nZXRMYW5ndWFnZSgpIH07XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNyZWF0ZV93YWxsZXRcIiwgcGFyYW1zKTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhpcy5oYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihjb25maWcuZ2V0UGF0aCgpLCBlcnIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc3RvcmVfZGV0ZXJtaW5pc3RpY193YWxsZXRcIiwge1xuICAgICAgICBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSxcbiAgICAgICAgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLFxuICAgICAgICBzZWVkOiBjb25maWcuZ2V0U2VlZCgpLFxuICAgICAgICBzZWVkX29mZnNldDogY29uZmlnLmdldFNlZWRPZmZzZXQoKSxcbiAgICAgICAgZW5hYmxlX211bHRpc2lnX2V4cGVyaW1lbnRhbDogY29uZmlnLmdldElzTXVsdGlzaWcoKSxcbiAgICAgICAgcmVzdG9yZV9oZWlnaHQ6IGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCksXG4gICAgICAgIGxhbmd1YWdlOiBjb25maWcuZ2V0TGFuZ3VhZ2UoKSxcbiAgICAgICAgYXV0b3NhdmVfY3VycmVudDogY29uZmlnLmdldFNhdmVDdXJyZW50KClcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aGlzLmhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKGNvbmZpZy5nZXRQYXRoKCksIGVycik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbUtleXMoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpIHtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgd2FsbGV0IGZyb20ga2V5c1wiKTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UmVzdG9yZUhlaWdodCgwKTtcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldExhbmd1YWdlKE1vbmVyb1dhbGxldC5ERUZBVUxUX0xBTkdVQUdFKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2VuZXJhdGVfZnJvbV9rZXlzXCIsIHtcbiAgICAgICAgZmlsZW5hbWU6IGNvbmZpZy5nZXRQYXRoKCksXG4gICAgICAgIHBhc3N3b3JkOiBjb25maWcuZ2V0UGFzc3dvcmQoKSxcbiAgICAgICAgYWRkcmVzczogY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCksXG4gICAgICAgIHZpZXdrZXk6IGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpLFxuICAgICAgICBzcGVuZGtleTogY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpLFxuICAgICAgICByZXN0b3JlX2hlaWdodDogY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSxcbiAgICAgICAgYXV0b3NhdmVfY3VycmVudDogY29uZmlnLmdldFNhdmVDdXJyZW50KClcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aGlzLmhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKGNvbmZpZy5nZXRQYXRoKCksIGVycik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IobmFtZSwgZXJyKSB7XG4gICAgaWYgKGVyci5tZXNzYWdlKSB7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcImFscmVhZHkgZXhpc3RzXCIpKSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoXCJXYWxsZXQgYWxyZWFkeSBleGlzdHM6IFwiICsgbmFtZSwgZXJyLmdldENvZGUoKSwgZXJyLmdldFJwY01ldGhvZCgpLCBlcnIuZ2V0UnBjUGFyYW1zKCkpO1xuICAgICAgaWYgKGVyci5tZXNzYWdlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoXCJ3b3JkIGxpc3QgZmFpbGVkIHZlcmlmaWNhdGlvblwiKSkgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKFwiSW52YWxpZCBtbmVtb25pY1wiLCBlcnIuZ2V0Q29kZSgpLCBlcnIuZ2V0UnBjTWV0aG9kKCksIGVyci5nZXRScGNQYXJhbXMoKSk7XG4gICAgfVxuICAgIHRocm93IGVycjtcbiAgfVxuICBcbiAgYXN5bmMgaXNWaWV3T25seSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHtrZXlfdHlwZTogXCJtbmVtb25pY1wifSk7XG4gICAgICByZXR1cm4gZmFsc2U7IC8vIGtleSByZXRyaWV2YWwgc3VjY2VlZHMgaWYgbm90IHZpZXcgb25seVxuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMjkpIHJldHVybiB0cnVlOyAgLy8gd2FsbGV0IGlzIHZpZXcgb25seVxuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMSkgcmV0dXJuIGZhbHNlOyAgLy8gd2FsbGV0IGlzIG9mZmxpbmUgYnV0IG5vdCB2aWV3IG9ubHlcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbi5cbiAgICogVGhlIGNhY2hlZCBjb25uZWN0aW9uIHJlY29yZHMgdGhlIHJlcXVlc3RlZCBhbGxvdy1hbnktY2VydCBzZXR0aW5nLCBub3QgY3VzdG9tIFNTTCBvcHRpb25zLlxuICAgKiBXYWxsZXQgUlBDIGVuZm9yY2VzIGEgQ0EgZmlsZSBvciBmaW5nZXJwcmludHM7IG90aGVyd2lzZSBTU0wgYXV0b2RldGVjdCBjYW4gYWNjZXB0IHVudmVyaWZpZWQgY2VydGlmaWNhdGVzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvUnBjQ29ubmVjdGlvbn0gW3VyaU9yQ29ubmVjdGlvbl0gLSB0aGUgZGFlbW9uJ3MgVVJJIG9yIGNvbm5lY3Rpb24gKGRlZmF1bHRzIHRvIG9mZmxpbmUpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNUcnVzdGVkIC0gaW5kaWNhdGVzIGlmIHRoZSBkYWVtb24gaW4gdHJ1c3RlZFxuICAgKiBAcGFyYW0ge1NzbE9wdGlvbnN9IHNzbE9wdGlvbnMgLSBjdXN0b20gU1NMIGNvbmZpZ3VyYXRpb24gKHRha2VzIHByZWNlZGVuY2Ugb3ZlciB0aGUgY29ubmVjdGlvbidzIHJlamVjdFVuYXV0aG9yaXplZCBzZXR0aW5nKVxuICAgKi9cbiAgYXN5bmMgc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24/OiBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgc3RyaW5nLCBpc1RydXN0ZWQ/OiBib29sZWFuLCBzc2xPcHRpb25zPzogU3NsT3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCBjb25uZWN0aW9uID0gIXVyaU9yQ29ubmVjdGlvbiA/IHVuZGVmaW5lZCA6IHVyaU9yQ29ubmVjdGlvbiBpbnN0YW5jZW9mIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPyB1cmlPckNvbm5lY3Rpb24gOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24pO1xuICAgIGlmICghc3NsT3B0aW9ucykge1xuICAgICAgc3NsT3B0aW9ucyA9IG5ldyBTc2xPcHRpb25zKCk7XG4gICAgICBpZiAoY29ubmVjdGlvbikgc3NsT3B0aW9ucy5zZXRBbGxvd0FueUNlcnQoY29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA9PT0gZmFsc2UpO1xuICAgIH1cbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFVyaSgpIDogXCJiYWRfdXJpXCI7IC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IGJhZCBkYWVtb24gdXJpIG5lY2Vzc2FyeSBmb3Igb2ZmbGluZT9cbiAgICBwYXJhbXMudXNlcm5hbWUgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRVc2VybmFtZSgpIDogXCJcIjtcbiAgICBwYXJhbXMucGFzc3dvcmQgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRQYXNzd29yZCgpIDogXCJcIjtcbiAgICBwYXJhbXMudHJ1c3RlZCA9IGlzVHJ1c3RlZDtcbiAgICBjb25zdCBoYXNDZXJ0aWZpY2F0ZXMgPSAhIXNzbE9wdGlvbnMuZ2V0Q2VydGlmaWNhdGVBdXRob3JpdHlGaWxlKCkgfHwgc3NsT3B0aW9ucy5nZXRBbGxvd2VkRmluZ2VycHJpbnRzKCk/Lmxlbmd0aCA+IDA7XG4gICAgcGFyYW1zLnNzbF9zdXBwb3J0ID0gaGFzQ2VydGlmaWNhdGVzICYmIHNzbE9wdGlvbnMuZ2V0QWxsb3dBbnlDZXJ0KCkgIT09IHRydWUgPyBcImVuYWJsZWRcIiA6IFwiYXV0b2RldGVjdFwiOyAvLyB3YWxsZXQgcnBjIG9ubHkgZW5mb3JjZXMgY2VydGlmaWNhdGVzIGlmIGVuYWJsZWRcbiAgICBwYXJhbXMuc3NsX3ByaXZhdGVfa2V5X3BhdGggPSBzc2xPcHRpb25zLmdldFByaXZhdGVLZXlQYXRoKCk7XG4gICAgcGFyYW1zLnNzbF9jZXJ0aWZpY2F0ZV9wYXRoICA9IHNzbE9wdGlvbnMuZ2V0Q2VydGlmaWNhdGVQYXRoKCk7XG4gICAgcGFyYW1zLnNzbF9jYV9maWxlID0gc3NsT3B0aW9ucy5nZXRDZXJ0aWZpY2F0ZUF1dGhvcml0eUZpbGUoKTtcbiAgICBwYXJhbXMuc3NsX2FsbG93ZWRfZmluZ2VycHJpbnRzID0gc3NsT3B0aW9ucy5nZXRBbGxvd2VkRmluZ2VycHJpbnRzKCk7XG4gICAgcGFyYW1zLnNzbF9hbGxvd19hbnlfY2VydCA9IHNzbE9wdGlvbnMuZ2V0QWxsb3dBbnlDZXJ0KCk7XG5cbiAgICAvLyBzZXQgcHJveHkgd2hpY2ggbXVzdCBtYXRjaCBzdGFydHVwIHByb3h5IGlmIGFwcGxpY2FibGVcbiAgICBpZiAoY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmdldFByb3h5VXJpKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXMuc3RhcnR1cFByb3h5VXJpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzZXQgZGFlbW9uIGNvbm5lY3Rpb24gd2l0aG91dCBwcm94eSBVUkkgYmVjYXVzZSBtb25lcm8td2FsbGV0LXJwYyB3YXMgc3RhcnRlZCB3aXRoIGEgcHJveHkgVVJJOiBcIiArIHRoaXMuc3RhcnR1cFByb3h5VXJpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuc3RhcnR1cFByb3h5VXJpID09PSB1bmRlZmluZWQpIHBhcmFtcy5wcm94eSA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFByb3h5VXJpKCkgOiBcIlwiO1xuICAgICAgZWxzZSBpZiAoIUdlblV0aWxzLmlzU2FtZVByb3h5VXJpKHRoaXMuc3RhcnR1cFByb3h5VXJpLCBjb25uZWN0aW9uLmdldFByb3h5VXJpKCkpKSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzZXQgZGFlbW9uIGNvbm5lY3Rpb24gd2l0aCBwcm94eSBVUkkgXCIgKyBjb25uZWN0aW9uLmdldFByb3h5VXJpKCkgKyBcIiBiZWNhdXNlIG1vbmVyby13YWxsZXQtcnBjIHdhcyBzdGFydGVkIHdpdGggYSBkaWZmZXJlbnQgcHJveHkgVVJJOiBcIiArIHRoaXMuc3RhcnR1cFByb3h5VXJpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFwYXJhbXMucHJveHkpIHBhcmFtcy5wcm94eSA9IFwiXCI7XG5cbiAgICBjb25zdCBkYWVtb25Db25uZWN0aW9uID0gY29ubmVjdGlvbiA/IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKGNvbm5lY3Rpb24pIDogdW5kZWZpbmVkO1xuICAgIGlmIChkYWVtb25Db25uZWN0aW9uKSBkYWVtb25Db25uZWN0aW9uLnJlamVjdFVuYXV0aG9yaXplZCA9IHBhcmFtcy5zc2xfYWxsb3dfYW55X2NlcnQgIT09IHRydWU7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2RhZW1vblwiLCBwYXJhbXMpO1xuICAgIHRoaXMuZGFlbW9uQ29ubmVjdGlvbiA9IGRhZW1vbkNvbm5lY3Rpb247XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkNvbm5lY3Rpb24oKTogUHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPiB7XG4gICAgcmV0dXJuIHRoaXMuZGFlbW9uQ29ubmVjdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHRvdGFsIGFuZCB1bmxvY2tlZCBiYWxhbmNlcyBpbiBhIHNpbmdsZSByZXF1ZXN0LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFthY2NvdW50SWR4XSBhY2NvdW50IGluZGV4XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3ViYWRkcmVzc0lkeF0gc3ViYWRkcmVzcyBpbmRleFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJpZ2ludFtdPn0gaXMgdGhlIHRvdGFsIGFuZCB1bmxvY2tlZCBiYWxhbmNlcyBpbiBhbiBhcnJheSwgcmVzcGVjdGl2ZWx5XG4gICAqL1xuICBhc3luYyBnZXRCYWxhbmNlcyhhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnRbXT4ge1xuICAgIGlmIChhY2NvdW50SWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzSWR4LCB1bmRlZmluZWQsIFwiTXVzdCBwcm92aWRlIGFjY291bnQgaW5kZXggd2l0aCBzdWJhZGRyZXNzIGluZGV4XCIpO1xuICAgICAgbGV0IGJhbGFuY2UgPSBCaWdJbnQoMCk7XG4gICAgICBsZXQgdW5sb2NrZWRCYWxhbmNlID0gQmlnSW50KDApO1xuICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCB0aGlzLmdldEFjY291bnRzKCkpIHtcbiAgICAgICAgYmFsYW5jZSA9IGJhbGFuY2UgKyBhY2NvdW50LmdldEJhbGFuY2UoKTtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlID0gdW5sb2NrZWRCYWxhbmNlICsgYWNjb3VudC5nZXRVbmxvY2tlZEJhbGFuY2UoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBbYmFsYW5jZSwgdW5sb2NrZWRCYWxhbmNlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHBhcmFtcyA9IHthY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LCBhZGRyZXNzX2luZGljZXM6IHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IFtzdWJhZGRyZXNzSWR4XX07XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIsIHBhcmFtcyk7XG4gICAgICBpZiAoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gW0JpZ0ludChyZXNwLnJlc3VsdC5iYWxhbmNlKSwgQmlnSW50KHJlc3AucmVzdWx0LnVubG9ja2VkX2JhbGFuY2UpXTtcbiAgICAgIGVsc2UgcmV0dXJuIFtCaWdJbnQocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3NbMF0uYmFsYW5jZSksIEJpZ0ludChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzc1swXS51bmxvY2tlZF9iYWxhbmNlKV07XG4gICAgfVxuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBDT01NT04gV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb1dhbGxldExpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3VwZXIuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN1cGVyLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWRUb0RhZW1vbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jaGVja1Jlc2VydmVQcm9vZihhd2FpdCB0aGlzLmdldFByaW1hcnlBZGRyZXNzKCksIFwiXCIsIFwiXCIpOyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IHByb3ZpZGUgYmV0dGVyIHdheSB0byBrbm93IGlmIHdhbGxldCBycGMgaXMgY29ubmVjdGVkIHRvIGRhZW1vblxuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiY2hlY2sgcmVzZXJ2ZSBleHBlY3RlZCB0byBmYWlsXCIpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9FcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTEzKSB0aHJvdyBlOyAvLyBubyB3YWxsZXQgZmlsZVxuICAgICAgcmV0dXJuIGUubWVzc2FnZS5pbmRleE9mKFwiRmFpbGVkIHRvIGNvbm5lY3QgdG8gZGFlbW9uXCIpIDwgMDtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFZlcnNpb24oKTogUHJvbWlzZTxNb25lcm9WZXJzaW9uPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdmVyc2lvblwiKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1ZlcnNpb24ocmVzcC5yZXN1bHQudmVyc2lvbiwgcmVzcC5yZXN1bHQucmVsZWFzZSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5wYXRoO1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwgeyBrZXlfdHlwZTogXCJtbmVtb25pY1wiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmIChhd2FpdCB0aGlzLmdldFNlZWQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb1dhbGxldFJwYy5nZXRTZWVkTGFuZ3VhZ2UoKSBub3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgYXZhaWxhYmxlIGxhbmd1YWdlcyBmb3IgdGhlIHdhbGxldCdzIHNlZWQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtzdHJpbmdbXX0gdGhlIGF2YWlsYWJsZSBsYW5ndWFnZXMgZm9yIHRoZSB3YWxsZXQncyBzZWVkLlxuICAgKi9cbiAgYXN5bmMgZ2V0U2VlZExhbmd1YWdlcygpIHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9sYW5ndWFnZXNcIikpLnJlc3VsdC5sYW5ndWFnZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFByaXZhdGVWaWV3S2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwgeyBrZXlfdHlwZTogXCJ2aWV3X2tleVwiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFByaXZhdGVTcGVuZEtleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwic3BlbmRfa2V5XCIgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmtleTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHN1YmFkZHJlc3NNYXAgPSB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XTtcbiAgICBpZiAoIXN1YmFkZHJlc3NNYXApIHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHVuZGVmaW5lZCwgdHJ1ZSk7ICAvLyBjYWNoZSdzIGFsbCBhZGRyZXNzZXMgYXQgdGhpcyBhY2NvdW50XG4gICAgICByZXR1cm4gdGhpcy5nZXRBZGRyZXNzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpOyAgICAgICAgLy8gcmVjdXJzaXZlIGNhbGwgdXNlcyBjYWNoZVxuICAgIH1cbiAgICBsZXQgYWRkcmVzcyA9IHN1YmFkZHJlc3NNYXBbc3ViYWRkcmVzc0lkeF07XG4gICAgaWYgKCFhZGRyZXNzKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHRydWUpOyAgLy8gY2FjaGUncyBhbGwgYWRkcmVzc2VzIGF0IHRoaXMgYWNjb3VudFxuICAgICAgcmV0dXJuIHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdW3N1YmFkZHJlc3NJZHhdO1xuICAgIH1cbiAgICByZXR1cm4gYWRkcmVzcztcbiAgfVxuICBcbiAgLy8gVE9ETzogdXNlIGNhY2hlXG4gIGFzeW5jIGdldEFkZHJlc3NJbmRleChhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBcbiAgICAvLyBmZXRjaCByZXN1bHQgYW5kIG5vcm1hbGl6ZSBlcnJvciBpZiBhZGRyZXNzIGRvZXMgbm90IGJlbG9uZyB0byB0aGUgd2FsbGV0XG4gICAgbGV0IHJlc3A7XG4gICAgdHJ5IHtcbiAgICAgIHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc19pbmRleFwiLCB7YWRkcmVzczogYWRkcmVzc30pO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGUubWVzc2FnZSk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICBcbiAgICAvLyBjb252ZXJ0IHJwYyByZXNwb25zZVxuICAgIGxldCBzdWJhZGRyZXNzID0gbmV3IE1vbmVyb1N1YmFkZHJlc3Moe2FkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICBzdWJhZGRyZXNzLnNldEFjY291bnRJbmRleChyZXNwLnJlc3VsdC5pbmRleC5tYWpvcik7XG4gICAgc3ViYWRkcmVzcy5zZXRJbmRleChyZXNwLnJlc3VsdC5pbmRleC5taW5vcik7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcz86IHN0cmluZywgcGF5bWVudElkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgaW50ZWdyYXRlZEFkZHJlc3NTdHIgPSAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibWFrZV9pbnRlZ3JhdGVkX2FkZHJlc3NcIiwge3N0YW5kYXJkX2FkZHJlc3M6IHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudF9pZDogcGF5bWVudElkfSkpLnJlc3VsdC5pbnRlZ3JhdGVkX2FkZHJlc3M7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5kZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzc1N0cik7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5tZXNzYWdlLmluY2x1ZGVzKFwiSW52YWxpZCBwYXltZW50IElEXCIpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIHBheW1lbnQgSUQ6IFwiICsgcGF5bWVudElkKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3BsaXRfaW50ZWdyYXRlZF9hZGRyZXNzXCIsIHtpbnRlZ3JhdGVkX2FkZHJlc3M6IGludGVncmF0ZWRBZGRyZXNzfSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcygpLnNldFN0YW5kYXJkQWRkcmVzcyhyZXNwLnJlc3VsdC5zdGFuZGFyZF9hZGRyZXNzKS5zZXRQYXltZW50SWQocmVzcC5yZXN1bHQucGF5bWVudF9pZCkuc2V0SW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3MpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9oZWlnaHRcIikpLnJlc3VsdC5oZWlnaHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGluZyB0aGUgY2hhaW4gaGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHRCeURhdGUoeWVhcjogbnVtYmVyLCBtb250aDogbnVtYmVyLCBkYXk6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3Qgc3VwcG9ydCBnZXR0aW5nIGEgaGVpZ2h0IGJ5IGRhdGVcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgYXNzZXJ0KCEobGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIpLCBcIk1vbmVybyBXYWxsZXQgUlBDIGRvZXMgbm90IHN1cHBvcnQgcmVwb3J0aW5nIHN5bmMgcHJvZ3Jlc3NcIik7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVmcmVzaFwiLCB7c3RhcnRfaGVpZ2h0OiBzdGFydEhlaWdodH0pO1xuICAgICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb1N5bmNSZXN1bHQocmVzcC5yZXN1bHQuYmxvY2tzX2ZldGNoZWQsIHJlc3AucmVzdWx0LnJlY2VpdmVkX21vbmV5KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgaWYgKGVyci5tZXNzYWdlID09PSBcIm5vIGNvbm5lY3Rpb24gdG8gZGFlbW9uXCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncz86IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIFxuICAgIC8vIGNvbnZlcnQgbXMgdG8gc2Vjb25kcyBmb3IgcnBjIHBhcmFtZXRlclxuICAgIGxldCBzeW5jUGVyaW9kSW5TZWNvbmRzID0gTWF0aC5yb3VuZCgoc3luY1BlcmlvZEluTXMgPT09IHVuZGVmaW5lZCA/IE1vbmVyb1dhbGxldFJwYy5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIDogc3luY1BlcmlvZEluTXMpIC8gMTAwMCk7XG4gICAgXG4gICAgLy8gc2VuZCBycGMgcmVxdWVzdFxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImF1dG9fcmVmcmVzaFwiLCB7XG4gICAgICBlbmFibGU6IHRydWUsXG4gICAgICBwZXJpb2Q6IHN5bmNQZXJpb2RJblNlY29uZHNcbiAgICB9KTtcbiAgICBcbiAgICAvLyB1cGRhdGUgc3luYyBwZXJpb2QgZm9yIHBvbGxlclxuICAgIHRoaXMuc3luY1BlcmlvZEluTXMgPSBzeW5jUGVyaW9kSW5TZWNvbmRzICogMTAwMDtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCkgdGhpcy53YWxsZXRQb2xsZXIuc2V0UGVyaW9kSW5Ncyh0aGlzLnN5bmNQZXJpb2RJbk1zKTtcbiAgICBcbiAgICAvLyBwb2xsIGlmIGxpc3RlbmluZ1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICB9XG5cbiAgZ2V0U3luY1BlcmlvZEluTXMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5zeW5jUGVyaW9kSW5NcztcbiAgfVxuICBcbiAgYXN5bmMgc3RvcFN5bmNpbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImF1dG9fcmVmcmVzaFwiLCB7IGVuYWJsZTogZmFsc2UgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0eEhhc2hlcyB8fCAhdHhIYXNoZXMubGVuZ3RoKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJObyB0eCBoYXNoZXMgZ2l2ZW4gdG8gc2NhblwiKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzY2FuX3R4XCIsIHt0eGlkczogdHhIYXNoZXN9KTtcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuU3BlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVzY2FuX3NwZW50XCIsIHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhbkJsb2NrY2hhaW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVzY2FuX2Jsb2NrY2hhaW5cIiwgdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0QmFsYW5jZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkpWzBdO1xuICB9XG4gIFxuICBhc3luYyBnZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbGFuY2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHRhZz86IHN0cmluZywgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvQWNjb3VudFtdPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggYWNjb3VudHMgZnJvbSBycGNcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hY2NvdW50c1wiLCB7dGFnOiB0YWd9KTtcbiAgICBcbiAgICAvLyBidWlsZCBhY2NvdW50IG9iamVjdHMgYW5kIGZldGNoIHN1YmFkZHJlc3NlcyBwZXIgYWNjb3VudCB1c2luZyBnZXRfYWRkcmVzc1xuICAgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IGdldF9hZGRyZXNzIHNob3VsZCBzdXBwb3J0IGFsbF9hY2NvdW50cyBzbyBub3QgY2FsbGVkIG9uY2UgcGVyIGFjY291bnRcbiAgICBsZXQgYWNjb3VudHM6IE1vbmVyb0FjY291bnRbXSA9IFtdO1xuICAgIGZvciAobGV0IHJwY0FjY291bnQgb2YgcmVzcC5yZXN1bHQuc3ViYWRkcmVzc19hY2NvdW50cykge1xuICAgICAgbGV0IGFjY291bnQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY0FjY291bnQocnBjQWNjb3VudCk7XG4gICAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcykgYWNjb3VudC5zZXRTdWJhZGRyZXNzZXMoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudC5nZXRJbmRleCgpLCB1bmRlZmluZWQsIHRydWUpKTtcbiAgICAgIGFjY291bnRzLnB1c2goYWNjb3VudCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGZldGNoIGFuZCBtZXJnZSBmaWVsZHMgZnJvbSBnZXRfYmFsYW5jZSBhY3Jvc3MgYWxsIGFjY291bnRzXG4gICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMgJiYgIXNraXBCYWxhbmNlcykge1xuICAgICAgXG4gICAgICAvLyB0aGVzZSBmaWVsZHMgYXJlIG5vdCBpbml0aWFsaXplZCBpZiBzdWJhZGRyZXNzIGlzIHVudXNlZCBhbmQgdGhlcmVmb3JlIG5vdCByZXR1cm5lZCBmcm9tIGBnZXRfYmFsYW5jZWBcbiAgICAgIGZvciAobGV0IGFjY291bnQgb2YgYWNjb3VudHMpIHtcbiAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpKSB7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKDApO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gZmV0Y2ggYW5kIG1lcmdlIGluZm8gZnJvbSBnZXRfYmFsYW5jZVxuICAgICAgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIsIHthbGxfYWNjb3VudHM6IHRydWV9KTtcbiAgICAgIGlmIChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICBmb3IgKGxldCBycGNTdWJhZGRyZXNzIG9mIHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3MgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gbWVyZ2UgaW5mb1xuICAgICAgICAgIGxldCBhY2NvdW50ID0gYWNjb3VudHNbc3ViYWRkcmVzcy5nZXRBY2NvdW50SW5kZXgoKV07XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsKHN1YmFkZHJlc3MuZ2V0QWNjb3VudEluZGV4KCksIGFjY291bnQuZ2V0SW5kZXgoKSwgXCJSUEMgYWNjb3VudHMgYXJlIG91dCBvZiBvcmRlclwiKTsgIC8vIHdvdWxkIG5lZWQgdG8gc3dpdGNoIGxvb2t1cCB0byBsb29wXG4gICAgICAgICAgbGV0IHRndFN1YmFkZHJlc3MgPSBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpW3N1YmFkZHJlc3MuZ2V0SW5kZXgoKV07XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSwgdGd0U3ViYWRkcmVzcy5nZXRJbmRleCgpLCBcIlJQQyBzdWJhZGRyZXNzZXMgYXJlIG91dCBvZiBvcmRlclwiKTtcbiAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpKTtcbiAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpKTtcbiAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gYWNjb3VudHM7XG4gIH1cbiAgXG4gIC8vIFRPRE86IGdldEFjY291bnRCeUluZGV4KCksIGdldEFjY291bnRCeVRhZygpXG4gIGFzeW5jIGdldEFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbiwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIGFzc2VydChhY2NvdW50SWR4ID49IDApO1xuICAgIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgdGhpcy5nZXRBY2NvdW50cygpKSB7XG4gICAgICBpZiAoYWNjb3VudC5nZXRJbmRleCgpID09PSBhY2NvdW50SWR4KSB7XG4gICAgICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzKSBhY2NvdW50LnNldFN1YmFkZHJlc3Nlcyhhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHNraXBCYWxhbmNlcykpO1xuICAgICAgICByZXR1cm4gYWNjb3VudDtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQWNjb3VudCB3aXRoIGluZGV4IFwiICsgYWNjb3VudElkeCArIFwiIGRvZXMgbm90IGV4aXN0XCIpO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlQWNjb3VudChsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIGxhYmVsID0gbGFiZWwgPyBsYWJlbCA6IHVuZGVmaW5lZDtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNyZWF0ZV9hY2NvdW50XCIsIHtsYWJlbDogbGFiZWx9KTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0FjY291bnQoe1xuICAgICAgaW5kZXg6IHJlc3AucmVzdWx0LmFjY291bnRfaW5kZXgsXG4gICAgICBwcmltYXJ5QWRkcmVzczogcmVzcC5yZXN1bHQuYWRkcmVzcyxcbiAgICAgIGxhYmVsOiBsYWJlbCxcbiAgICAgIGJhbGFuY2U6IEJpZ0ludCgwKSxcbiAgICAgIHVubG9ja2VkQmFsYW5jZTogQmlnSW50KDApXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBnZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSW5kaWNlcz86IG51bWJlcltdLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzW10+IHtcbiAgICBcbiAgICAvLyBmZXRjaCBzdWJhZGRyZXNzZXNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgaWYgKHN1YmFkZHJlc3NJbmRpY2VzKSBwYXJhbXMuYWRkcmVzc19pbmRleCA9IEdlblV0aWxzLmxpc3RpZnkoc3ViYWRkcmVzc0luZGljZXMpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NcIiwgcGFyYW1zKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHN1YmFkZHJlc3Nlc1xuICAgIGxldCBzdWJhZGRyZXNzZXMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNTdWJhZGRyZXNzIG9mIHJlc3AucmVzdWx0LmFkZHJlc3Nlcykge1xuICAgICAgbGV0IHN1YmFkZHJlc3MgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcyk7XG4gICAgICBzdWJhZGRyZXNzLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIHN1YmFkZHJlc3Nlcy5wdXNoKHN1YmFkZHJlc3MpO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgaW5pdGlhbGl6ZSBzdWJhZGRyZXNzIGJhbGFuY2VzXG4gICAgaWYgKCFza2lwQmFsYW5jZXMpIHtcbiAgICAgIFxuICAgICAgLy8gdGhlc2UgZmllbGRzIGFyZSBub3QgaW5pdGlhbGl6ZWQgaWYgc3ViYWRkcmVzcyBpcyB1bnVzZWQgYW5kIHRoZXJlZm9yZSBub3QgcmV0dXJuZWQgZnJvbSBgZ2V0X2JhbGFuY2VgXG4gICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIHN1YmFkZHJlc3Nlcykge1xuICAgICAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cygwKTtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jaygwKTtcbiAgICAgIH1cblxuICAgICAgLy8gZmV0Y2ggYW5kIGluaXRpYWxpemUgYmFsYW5jZXNcbiAgICAgIHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCBwYXJhbXMpO1xuICAgICAgaWYgKHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgIGZvciAobGV0IHJwY1N1YmFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzcyA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyB0cmFuc2ZlciBpbmZvIHRvIGV4aXN0aW5nIHN1YmFkZHJlc3Mgb2JqZWN0XG4gICAgICAgICAgZm9yIChsZXQgdGd0U3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgICAgICAgIGlmICh0Z3RTdWJhZGRyZXNzLmdldEluZGV4KCkgIT09IHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSkgY29udGludWU7IC8vIHNraXAgdG8gc3ViYWRkcmVzcyB3aXRoIHNhbWUgaW5kZXhcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldE51bUJsb2Nrc1RvVW5sb2NrKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jayhzdWJhZGRyZXNzLmdldE51bUJsb2Nrc1RvVW5sb2NrKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSBhZGRyZXNzZXNcbiAgICBsZXQgc3ViYWRkcmVzc01hcCA9IHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdO1xuICAgIGlmICghc3ViYWRkcmVzc01hcCkge1xuICAgICAgc3ViYWRkcmVzc01hcCA9IHt9O1xuICAgICAgdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF0gPSBzdWJhZGRyZXNzTWFwO1xuICAgIH1cbiAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIHN1YmFkZHJlc3Nlcykge1xuICAgICAgc3ViYWRkcmVzc01hcFtzdWJhZGRyZXNzLmdldEluZGV4KCldID0gc3ViYWRkcmVzcy5nZXRBZGRyZXNzKCk7XG4gICAgfVxuICAgIFxuICAgIC8vIHJldHVybiByZXN1bHRzXG4gICAgcmV0dXJuIHN1YmFkZHJlc3NlcztcbiAgfVxuXG4gIGFzeW5jIGdldFN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBhc3NlcnQoYWNjb3VudElkeCA+PSAwKTtcbiAgICBhc3NlcnQoc3ViYWRkcmVzc0lkeCA+PSAwKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIFtzdWJhZGRyZXNzSWR4XSwgc2tpcEJhbGFuY2VzKSlbMF07XG4gIH1cblxuICBhc3luYyBjcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNyZWF0ZV9hZGRyZXNzXCIsIHthY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LCBsYWJlbDogbGFiZWx9KTtcbiAgICBcbiAgICAvLyBidWlsZCBzdWJhZGRyZXNzIG9iamVjdFxuICAgIGxldCBzdWJhZGRyZXNzID0gbmV3IE1vbmVyb1N1YmFkZHJlc3MoKTtcbiAgICBzdWJhZGRyZXNzLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICBzdWJhZGRyZXNzLnNldEluZGV4KHJlc3AucmVzdWx0LmFkZHJlc3NfaW5kZXgpO1xuICAgIHN1YmFkZHJlc3Muc2V0QWRkcmVzcyhyZXNwLnJlc3VsdC5hZGRyZXNzKTtcbiAgICBzdWJhZGRyZXNzLnNldExhYmVsKGxhYmVsID8gbGFiZWwgOiB1bmRlZmluZWQpO1xuICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cygwKTtcbiAgICBzdWJhZGRyZXNzLnNldElzVXNlZChmYWxzZSk7XG4gICAgc3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jaygwKTtcbiAgICByZXR1cm4gc3ViYWRkcmVzcztcbiAgfVxuXG4gIGFzeW5jIHNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImxhYmVsX2FkZHJlc3NcIiwge2luZGV4OiB7bWFqb3I6IGFjY291bnRJZHgsIG1pbm9yOiBzdWJhZGRyZXNzSWR4fSwgbGFiZWw6IGxhYmVsfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyhxdWVyeT86IHN0cmluZ1tdIHwgUGFydGlhbDxNb25lcm9UeFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIHJldHVybiB0aGlzLmdldFR4c0F1eChxdWVyeSwgNSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0VHhzQXV4KHF1ZXJ5OiBzdHJpbmdbXSB8IFBhcnRpYWw8TW9uZXJvVHhRdWVyeT4gfCB1bmRlZmluZWQsIG1heEF0dGVtcHRzOiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcblxuICAgIC8vIGNvcHkgcXVlcnlcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHhRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gdGVtcG9yYXJpbHkgZGlzYWJsZSB0cmFuc2ZlciBhbmQgb3V0cHV0IHF1ZXJpZXMgaW4gb3JkZXIgdG8gY29sbGVjdCBhbGwgdHggaW5mb3JtYXRpb25cbiAgICBsZXQgdHJhbnNmZXJRdWVyeSA9IHF1ZXJ5Tm9ybWFsaXplZC5nZXRUcmFuc2ZlclF1ZXJ5KCk7XG4gICAgbGV0IGlucHV0UXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0SW5wdXRRdWVyeSgpO1xuICAgIGxldCBvdXRwdXRRdWVyeSA9IHF1ZXJ5Tm9ybWFsaXplZC5nZXRPdXRwdXRRdWVyeSgpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRUcmFuc2ZlclF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldElucHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0T3V0cHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICBcbiAgICAvLyBmZXRjaCBhbGwgdHJhbnNmZXJzIHRoYXQgbWVldCB0eCBxdWVyeVxuICAgIGxldCB0cmFuc2ZlcnMgPSBhd2FpdCB0aGlzLmdldFRyYW5zZmVyc0F1eChuZXcgTW9uZXJvVHJhbnNmZXJRdWVyeSgpLnNldFR4UXVlcnkoTW9uZXJvV2FsbGV0UnBjLmRlY29udGV4dHVhbGl6ZShxdWVyeU5vcm1hbGl6ZWQuY29weSgpKSkpO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdW5pcXVlIHR4cyBmcm9tIHRyYW5zZmVycyB3aGlsZSByZXRhaW5pbmcgb3JkZXJcbiAgICBsZXQgdHhzID0gW107XG4gICAgbGV0IHR4c1NldCA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0cmFuc2ZlcnMpIHtcbiAgICAgIGlmICghdHhzU2V0Lmhhcyh0cmFuc2Zlci5nZXRUeCgpKSkge1xuICAgICAgICB0eHMucHVzaCh0cmFuc2Zlci5nZXRUeCgpKTtcbiAgICAgICAgdHhzU2V0LmFkZCh0cmFuc2Zlci5nZXRUeCgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgdHlwZXMgaW50byBtYXBzIGZvciBtZXJnaW5nIGFuZCBsb29rdXBcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgbWVyZ2Ugb3V0cHV0cyBpZiByZXF1ZXN0ZWRcbiAgICBpZiAocXVlcnlOb3JtYWxpemVkLmdldEluY2x1ZGVPdXRwdXRzKCkgfHwgb3V0cHV0UXVlcnkpIHtcbiAgICAgICAgXG4gICAgICAvLyBmZXRjaCBvdXRwdXRzXG4gICAgICBsZXQgb3V0cHV0UXVlcnlBdXggPSAob3V0cHV0UXVlcnkgPyBvdXRwdXRRdWVyeS5jb3B5KCkgOiBuZXcgTW9uZXJvT3V0cHV0UXVlcnkoKSkuc2V0VHhRdWVyeShNb25lcm9XYWxsZXRScGMuZGVjb250ZXh0dWFsaXplKHF1ZXJ5Tm9ybWFsaXplZC5jb3B5KCkpKTtcbiAgICAgIGxldCBvdXRwdXRzID0gYXdhaXQgdGhpcy5nZXRPdXRwdXRzQXV4KG91dHB1dFF1ZXJ5QXV4KTtcbiAgICAgIFxuICAgICAgLy8gbWVyZ2Ugb3V0cHV0IHR4cyBvbmUgdGltZSB3aGlsZSByZXRhaW5pbmcgb3JkZXJcbiAgICAgIGxldCBvdXRwdXRUeHMgPSBbXTtcbiAgICAgIGZvciAobGV0IG91dHB1dCBvZiBvdXRwdXRzKSB7XG4gICAgICAgIGlmICghb3V0cHV0VHhzLmluY2x1ZGVzKG91dHB1dC5nZXRUeCgpKSkge1xuICAgICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KG91dHB1dC5nZXRUeCgpLCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgICAgIG91dHB1dFR4cy5wdXNoKG91dHB1dC5nZXRUeCgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyByZXN0b3JlIHRyYW5zZmVyIGFuZCBvdXRwdXQgcXVlcmllc1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRUcmFuc2ZlclF1ZXJ5KHRyYW5zZmVyUXVlcnkpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRJbnB1dFF1ZXJ5KGlucHV0UXVlcnkpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRPdXRwdXRRdWVyeShvdXRwdXRRdWVyeSk7XG4gICAgXG4gICAgLy8gZmlsdGVyIHR4cyB0aGF0IGRvbid0IG1lZXQgdHJhbnNmZXIgcXVlcnlcbiAgICBsZXQgdHhzUXVlcmllZCA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5tZWV0c0NyaXRlcmlhKHR4KSkgdHhzUXVlcmllZC5wdXNoKHR4KTtcbiAgICAgIGVsc2UgaWYgKHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCkgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgfVxuICAgIHR4cyA9IHR4c1F1ZXJpZWQ7XG4gICAgXG4gICAgLy8gc3BlY2lhbCBjYXNlOiByZS1mZXRjaCB0eHMgaWYgaW5jb25zaXN0ZW5jeSBjYXVzZWQgYnkgbmVlZGluZyB0byBtYWtlIG11bHRpcGxlIHJwYyBjYWxsc1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkgJiYgdHguZ2V0QmxvY2soKSA9PT0gdW5kZWZpbmVkIHx8ICF0eC5nZXRJc0NvbmZpcm1lZCgpICYmIHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAobWF4QXR0ZW1wdHMgPD0gMSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVW5hYmxlIHRvIGJ1aWxkIGNvbnNpc3RlbnQgdHhzIGZyb20gbXVsdGlwbGUgcnBjIGNhbGxzXCIpO1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiSW5jb25zaXN0ZW5jeSBkZXRlY3RlZCBidWlsZGluZyB0eHMgZnJvbSBtdWx0aXBsZSBycGMgY2FsbHMsIHJlLWZldGNoaW5nIHR4c1wiKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VHhzQXV4KHF1ZXJ5Tm9ybWFsaXplZCwgbWF4QXR0ZW1wdHMgLSAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gb3JkZXIgdHhzIGlmIHR4IGhhc2hlcyBnaXZlbiB0aGVuIHJldHVyblxuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkgJiYgcXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpLmxlbmd0aCA+IDApIHtcbiAgICAgIGxldCB0eHNCeUlkID0gbmV3IE1hcCgpICAvLyBzdG9yZSB0eHMgaW4gdGVtcG9yYXJ5IG1hcCBmb3Igc29ydGluZ1xuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB0eHNCeUlkLnNldCh0eC5nZXRIYXNoKCksIHR4KTtcbiAgICAgIGxldCBvcmRlcmVkVHhzID0gW107XG4gICAgICBmb3IgKGxldCBoYXNoIG9mIHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKSkgaWYgKHR4c0J5SWQuZ2V0KGhhc2gpKSBvcmRlcmVkVHhzLnB1c2godHhzQnlJZC5nZXQoaGFzaCkpO1xuICAgICAgdHhzID0gb3JkZXJlZFR4cztcbiAgICB9XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHJhbnNmZXJbXT4ge1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBnZXQgdHJhbnNmZXJzIGRpcmVjdGx5IGlmIHF1ZXJ5IGRvZXMgbm90IHJlcXVpcmUgdHggY29udGV4dCAob3RoZXIgdHJhbnNmZXJzLCBvdXRwdXRzKVxuICAgIGlmICghTW9uZXJvV2FsbGV0UnBjLmlzQ29udGV4dHVhbChxdWVyeU5vcm1hbGl6ZWQpKSByZXR1cm4gdGhpcy5nZXRUcmFuc2ZlcnNBdXgocXVlcnlOb3JtYWxpemVkKTtcbiAgICBcbiAgICAvLyBvdGhlcndpc2UgZ2V0IHR4cyB3aXRoIGZ1bGwgbW9kZWxzIHRvIGZ1bGZpbGwgcXVlcnlcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5nZXRUeHMocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKSkpIHtcbiAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmZpbHRlclRyYW5zZmVycyhxdWVyeU5vcm1hbGl6ZWQpKSB7XG4gICAgICAgIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvT3V0cHV0UXVlcnk+KTogUHJvbWlzZTxNb25lcm9PdXRwdXRXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gZ2V0IG91dHB1dHMgZGlyZWN0bHkgaWYgcXVlcnkgZG9lcyBub3QgcmVxdWlyZSB0eCBjb250ZXh0IChvdGhlciBvdXRwdXRzLCB0cmFuc2ZlcnMpXG4gICAgaWYgKCFNb25lcm9XYWxsZXRScGMuaXNDb250ZXh0dWFsKHF1ZXJ5Tm9ybWFsaXplZCkpIHJldHVybiB0aGlzLmdldE91dHB1dHNBdXgocXVlcnlOb3JtYWxpemVkKTtcbiAgICBcbiAgICAvLyBvdGhlcndpc2UgZ2V0IHR4cyB3aXRoIGZ1bGwgbW9kZWxzIHRvIGZ1bGZpbGwgcXVlcnlcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMuZ2V0VHhzKHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkpKSB7XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZmlsdGVyT3V0cHV0cyhxdWVyeU5vcm1hbGl6ZWQpKSB7XG4gICAgICAgIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfb3V0cHV0c1wiLCB7YWxsOiBhbGx9KSkucmVzdWx0Lm91dHB1dHNfZGF0YV9oZXg7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE91dHB1dHMob3V0cHV0c0hleDogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9vdXRwdXRzXCIsIHtvdXRwdXRzX2RhdGFfaGV4OiBvdXRwdXRzSGV4fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm51bV9pbXBvcnRlZDtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdD4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnJwY0V4cG9ydEtleUltYWdlcyhhbGwpO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzOiBNb25lcm9LZXlJbWFnZVtdLCBvZmZzZXQgPSAwKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD4ge1xuICAgIFxuICAgIC8vIGNvbnZlcnQga2V5IGltYWdlcyB0byBycGMgcGFyYW1ldGVyXG4gICAgbGV0IHJwY0tleUltYWdlcyA9IGtleUltYWdlcy5tYXAoa2V5SW1hZ2UgPT4gKHtrZXlfaW1hZ2U6IGtleUltYWdlLmdldEhleCgpLCBzaWduYXR1cmU6IGtleUltYWdlLmdldFNpZ25hdHVyZSgpfSkpO1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW1wb3J0X2tleV9pbWFnZXNcIiwge3NpZ25lZF9rZXlfaW1hZ2VzOiBycGNLZXlJbWFnZXMsIG9mZnNldDogb2Zmc2V0fSk7XG4gICAgXG4gICAgLy8gYnVpbGQgYW5kIHJldHVybiByZXN1bHRcbiAgICBsZXQgaW1wb3J0UmVzdWx0ID0gbmV3IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0KCk7XG4gICAgaW1wb3J0UmVzdWx0LnNldEhlaWdodChyZXNwLnJlc3VsdC5oZWlnaHQpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRTcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQuc3BlbnQpKTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0VW5zcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQudW5zcGVudCkpO1xuICAgIHJldHVybiBpbXBvcnRSZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5ycGNFeHBvcnRLZXlJbWFnZXMoZmFsc2UpKS5nZXRLZXlJbWFnZXMoKTtcbiAgfVxuICBcbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZnJlZXplXCIsIHtrZXlfaW1hZ2U6IGtleUltYWdlfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRoYXdPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ0aGF3XCIsIHtrZXlfaW1hZ2U6IGtleUltYWdlfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzT3V0cHV0RnJvemVuKGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImZyb3plblwiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5mcm96ZW4gPT09IHRydWU7XG4gIH1cblxuICBhc3luYyBnZXREZWZhdWx0RmVlUHJpb3JpdHkoKTogUHJvbWlzZTxNb25lcm9UeFByaW9yaXR5PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfZGVmYXVsdF9mZWVfcHJpb3JpdHlcIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnByaW9yaXR5O1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlLCBjb3B5LCBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWdOb3JtYWxpemVkLnNldENhblNwbGl0KHRydWUpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkgPT09IHRydWUgJiYgYXdhaXQgdGhpcy5pc011bHRpc2lnKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCByZWxheSBtdWx0aXNpZyB0cmFuc2FjdGlvbiB1bnRpbCBjby1zaWduZWRcIik7XG5cbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzc2VzIHRvIHNlbmQgZnJvbVxuICAgIGxldCBhY2NvdW50SWR4ID0gY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgdGhlIGFjY291bnQgaW5kZXggdG8gc2VuZCBmcm9tXCIpO1xuICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnNsaWNlKDApOyAvLyBmZXRjaCBhbGwgb3IgY29weSBnaXZlbiBpbmRpY2VzXG4gICAgXG4gICAgLy8gYnVpbGQgY29uZmlnIHBhcmFtZXRlcnNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuZGVzdGluYXRpb25zID0gW107XG4gICAgZm9yIChsZXQgZGVzdGluYXRpb24gb2YgY29uZmlnTm9ybWFsaXplZC5nZXREZXN0aW5hdGlvbnMoKSkge1xuICAgICAgYXNzZXJ0KGRlc3RpbmF0aW9uLmdldEFkZHJlc3MoKSwgXCJEZXN0aW5hdGlvbiBhZGRyZXNzIGlzIG5vdCBkZWZpbmVkXCIpO1xuICAgICAgYXNzZXJ0KGRlc3RpbmF0aW9uLmdldEFtb3VudCgpLCBcIkRlc3RpbmF0aW9uIGFtb3VudCBpcyBub3QgZGVmaW5lZFwiKTtcbiAgICAgIHBhcmFtcy5kZXN0aW5hdGlvbnMucHVzaCh7IGFkZHJlc3M6IGRlc3RpbmF0aW9uLmdldEFkZHJlc3MoKSwgYW1vdW50OiBkZXN0aW5hdGlvbi5nZXRBbW91bnQoKSB9KTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkpIHBhcmFtcy5zdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzID0gY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IHN1YmFkZHJlc3NJbmRpY2VzO1xuICAgIHBhcmFtcy5wYXltZW50X2lkID0gY29uZmlnTm9ybWFsaXplZC5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpICE9PSB0cnVlO1xuICAgIGFzc2VydChjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSBwYXJhbXMuZ2V0X3R4X2tleXMgPSB0cnVlOyAvLyBwYXJhbSB0byBnZXQgdHgga2V5KHMpIGRlcGVuZHMgaWYgc3BsaXRcbiAgICBlbHNlIHBhcmFtcy5nZXRfdHhfa2V5ID0gdHJ1ZTtcblxuICAgIC8vIGNhbm5vdCBhcHBseSBzdWJ0cmFjdEZlZUZyb20gd2l0aCBgdHJhbnNmZXJfc3BsaXRgIGNhbGxcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKS5sZW5ndGggPiAwKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJzdWJ0cmFjdGZlZWZyb20gdHJhbnNmZXJzIGNhbm5vdCBiZSBzcGxpdCBvdmVyIG11bHRpcGxlIHRyYW5zYWN0aW9ucyB5ZXRcIik7XG4gICAgfVxuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IFwidHJhbnNmZXJfc3BsaXRcIiA6IFwidHJhbnNmZXJcIiwgcGFyYW1zKTtcbiAgICAgIHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIldBTExFVF9SUENfRVJST1JfQ09ERV9XUk9OR19BRERSRVNTXCIpID4gLTEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgZGVzdGluYXRpb24gYWRkcmVzc1wiKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gICAgXG4gICAgLy8gcHJlLWluaXRpYWxpemUgdHhzIGlmZiBwcmVzZW50LiBtdWx0aXNpZyBhbmQgdmlldy1vbmx5IHdhbGxldHMgd2lsbCBoYXZlIHR4IHNldCB3aXRob3V0IHRyYW5zYWN0aW9uc1xuICAgIGxldCB0eHM7XG4gICAgbGV0IG51bVR4cyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IChyZXN1bHQuZmVlX2xpc3QgIT09IHVuZGVmaW5lZCA/IHJlc3VsdC5mZWVfbGlzdC5sZW5ndGggOiAwKSA6IChyZXN1bHQuZmVlICE9PSB1bmRlZmluZWQgPyAxIDogMCk7XG4gICAgaWYgKG51bVR4cyA+IDApIHR4cyA9IFtdO1xuICAgIGxldCBjb3B5RGVzdGluYXRpb25zID0gbnVtVHhzID09PSAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVHhzOyBpKyspIHtcbiAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgICAgTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnTm9ybWFsaXplZCwgdHgsIGNvcHlEZXN0aW5hdGlvbnMpO1xuICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcyAhPT0gdW5kZWZpbmVkICYmIHN1YmFkZHJlc3NJbmRpY2VzLmxlbmd0aCA9PT0gMSkgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldFN1YmFkZHJlc3NJbmRpY2VzKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHNldCBmcm9tIHJwYyByZXNwb25zZSB3aXRoIHByZS1pbml0aWFsaXplZCB0eHNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQsIHR4cywgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gICAgZWxzZSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFRvVHhTZXQocmVzdWx0LCB0eHMgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHR4c1swXSwgdHJ1ZSwgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBidWlsZCByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCk7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBjb25maWcuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpO1xuICAgIHBhcmFtcy5rZXlfaW1hZ2UgPSBjb25maWcuZ2V0S2V5SW1hZ2UoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgIT09IHRydWU7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWcuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWcuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZy5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2tleSA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9oZXggPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfbWV0YWRhdGEgPSB0cnVlO1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfc2luZ2xlXCIsIHBhcmFtcyk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZy5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBidWlsZCBhbmQgcmV0dXJuIHR4XG4gICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnLCB1bmRlZmluZWQsIHRydWUpO1xuICAgIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhUb1R4U2V0KHJlc3VsdCwgdHgsIHRydWUsIGNvbmZpZyk7XG4gICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpWzBdLnNldEFtb3VudCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkpOyAvLyBpbml0aWFsaXplIGRlc3RpbmF0aW9uIGFtb3VudFxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwOyBkZWZhdWx0IHRvIGFsbCB3aXRoIHVubG9ja2VkIGJhbGFuY2UgaWYgbm90IHNwZWNpZmllZFxuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpOyAgLy8gbWFwcyBlYWNoIGFjY291bnQgaW5kZXggdG8gc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGluZGljZXMuc2V0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCksIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgaW5kaWNlcy5zZXQoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkpKSB7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgPiAwbikgc3ViYWRkcmVzc0luZGljZXMucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBhY2NvdW50cyA9IGF3YWl0IHRoaXMuZ2V0QWNjb3VudHModHJ1ZSk7XG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICAgIGlmIChhY2NvdW50LmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgICBpbmRpY2VzLnNldChhY2NvdW50LmdldEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc3dlZXAgZnJvbSBlYWNoIGFjY291bnQgYW5kIGNvbGxlY3QgcmVzdWx0aW5nIHR4IHNldHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYWNjb3VudElkeCBvZiBpbmRpY2VzLmtleXMoKSkge1xuICAgICAgXG4gICAgICAvLyBjb3B5IGFuZCBtb2RpZnkgdGhlIG9yaWdpbmFsIGNvbmZpZ1xuICAgICAgbGV0IGNvcHkgPSBjb25maWdOb3JtYWxpemVkLmNvcHkoKTtcbiAgICAgIGNvcHkuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgY29weS5zZXRTd2VlcEVhY2hTdWJhZGRyZXNzKGZhbHNlKTtcbiAgICAgIFxuICAgICAgLy8gc3dlZXAgYWxsIHN1YmFkZHJlc3NlcyB0b2dldGhlciAgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogY2FuIHRoaXMgcmV2ZWFsIG91dHB1dHMgYmVsb25nIHRvIHRoZSBzYW1lIHdhbGxldD9cbiAgICAgIGlmIChjb3B5LmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSAhPT0gdHJ1ZSkge1xuICAgICAgICBjb3B5LnNldFN1YmFkZHJlc3NJbmRpY2VzKGluZGljZXMuZ2V0KGFjY291bnRJZHgpKTtcbiAgICAgICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5ycGNTd2VlcEFjY291bnQoY29weSkpIHR4cy5wdXNoKHR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gb3RoZXJ3aXNlIHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyBpbmRpdmlkdWFsbHlcbiAgICAgIGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzSWR4IG9mIGluZGljZXMuZ2V0KGFjY291bnRJZHgpKSB7XG4gICAgICAgICAgY29weS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhbc3ViYWRkcmVzc0lkeF0pO1xuICAgICAgICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMucnBjU3dlZXBBY2NvdW50KGNvcHkpKSB0eHMucHVzaCh0eCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcER1c3QocmVsYXk/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHJlbGF5ID09PSB1bmRlZmluZWQpIHJlbGF5ID0gZmFsc2U7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzd2VlcF9kdXN0XCIsIHtkb19ub3RfcmVsYXk6ICFyZWxheX0pO1xuICAgIGlmIChyZWxheSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzdWx0KTtcbiAgICBpZiAodHhTZXQuZ2V0VHhzKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQoIXJlbGF5KTtcbiAgICAgIHR4LnNldEluVHhQb29sKHR4LmdldElzUmVsYXllZCgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0LmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhczogKE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKVtdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eEhhc2hlcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykge1xuICAgICAgbGV0IG1ldGFkYXRhID0gdHhPck1ldGFkYXRhIGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQgPyB0eE9yTWV0YWRhdGEuZ2V0TWV0YWRhdGEoKSA6IHR4T3JNZXRhZGF0YTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVsYXlfdHhcIiwgeyBoZXg6IG1ldGFkYXRhIH0pO1xuICAgICAgdHhIYXNoZXMucHVzaChyZXNwLnJlc3VsdC50eF9oYXNoKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7IC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgcmV0dXJuIHR4SGFzaGVzO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImRlc2NyaWJlX3RyYW5zZmVyXCIsIHtcbiAgICAgIHVuc2lnbmVkX3R4c2V0OiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCksXG4gICAgICBtdWx0aXNpZ190eHNldDogdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpXG4gICAgfSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlcihyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnbl90cmFuc2ZlclwiLCB7XG4gICAgICB1bnNpZ25lZF90eHNldDogdW5zaWduZWRUeEhleCxcbiAgICAgIGV4cG9ydF9yYXc6IHRydWUsXG4gICAgICBnZXRfdHhfa2V5czogdHJ1ZVxuICAgIH0pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfdHJhbnNmZXJcIiwge1xuICAgICAgdHhfZGF0YV9oZXg6IHNpZ25lZFR4SGV4XG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBzaWduYXR1cmVUeXBlID0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgYWNjb3VudElkeCA9IDAsIHN1YmFkZHJlc3NJZHggPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25cIiwge1xuICAgICAgICBkYXRhOiBtZXNzYWdlLFxuICAgICAgICBzaWduYXR1cmVfdHlwZTogc2lnbmF0dXJlVHlwZSA9PT0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA/IFwic3BlbmRcIiA6IFwidmlld1wiLFxuICAgICAgICBhY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LFxuICAgICAgICBhZGRyZXNzX2luZGV4OiBzdWJhZGRyZXNzSWR4XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQ+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ2ZXJpZnlcIiwge2RhdGE6IG1lc3NhZ2UsIGFkZHJlc3M6IGFkZHJlc3MsIHNpZ25hdHVyZTogc2lnbmF0dXJlfSk7XG4gICAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQoXG4gICAgICAgIHJlc3VsdC5nb29kID8ge2lzR29vZDogcmVzdWx0Lmdvb2QsIGlzT2xkOiByZXN1bHQub2xkLCBzaWduYXR1cmVUeXBlOiByZXN1bHQuc2lnbmF0dXJlX3R5cGUgPT09IFwidmlld1wiID8gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1ZJRVdfS0VZIDogTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgdmVyc2lvbjogcmVzdWx0LnZlcnNpb259IDoge2lzR29vZDogZmFsc2V9XG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMikgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KHtpc0dvb2Q6IGZhbHNlfSk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9rZXlcIiwge3R4aWQ6IHR4SGFzaH0pKS5yZXN1bHQudHhfa2V5O1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaDogc3RyaW5nLCB0eEtleTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfdHhfa2V5XCIsIHt0eGlkOiB0eEhhc2gsIHR4X2tleTogdHhLZXksIGFkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICAgIFxuICAgICAgLy8gaW50ZXJwcmV0IHJlc3VsdFxuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZCh0cnVlKTtcbiAgICAgIGNoZWNrLnNldE51bUNvbmZpcm1hdGlvbnMocmVzcC5yZXN1bHQuY29uZmlybWF0aW9ucyk7XG4gICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgIGNoZWNrLnNldFJlY2VpdmVkQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5yZWNlaXZlZCkpO1xuICAgICAgcmV0dXJuIGNoZWNrO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9wcm9vZlwiLCB7dHhpZDogdHhIYXNoLCBhZGRyZXNzOiBhZGRyZXNzLCBtZXNzYWdlOiBtZXNzYWdlfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja190eF9wcm9vZlwiLCB7XG4gICAgICAgIHR4aWQ6IHR4SGFzaCxcbiAgICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBpbnRlcnByZXQgcmVzcG9uc2VcbiAgICAgIGxldCBpc0dvb2QgPSByZXNwLnJlc3VsdC5nb29kO1xuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZChpc0dvb2QpO1xuICAgICAgaWYgKGlzR29vZCkge1xuICAgICAgICBjaGVjay5zZXROdW1Db25maXJtYXRpb25zKHJlc3AucmVzdWx0LmNvbmZpcm1hdGlvbnMpO1xuICAgICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgICAgY2hlY2suc2V0UmVjZWl2ZWRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnJlY2VpdmVkKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2hlY2s7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtMSAmJiBlLm1lc3NhZ2Uuc3RhcnRzV2l0aChcImJhc2ljX3N0cmluZ1wiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIk11c3QgcHJvdmlkZSBzaWduYXR1cmUgdG8gY2hlY2sgdHggcHJvb2ZcIiwgLTEpO1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9zcGVuZF9wcm9vZlwiLCB7dHhpZDogdHhIYXNoLCBtZXNzYWdlOiBtZXNzYWdlfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja19zcGVuZF9wcm9vZlwiLCB7XG4gICAgICAgIHR4aWQ6IHR4SGFzaCxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0Lmdvb2Q7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFsbDogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgYW1vdW50OiBiaWdpbnQsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3Jlc2VydmVfcHJvb2ZcIiwge1xuICAgICAgYWNjb3VudF9pbmRleDogYWNjb3VudElkeCxcbiAgICAgIGFtb3VudDogYW1vdW50LFxuICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gIH1cblxuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT4ge1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgfSk7XG4gICAgXG4gICAgLy8gaW50ZXJwcmV0IHJlc3VsdHNcbiAgICBsZXQgaXNHb29kID0gcmVzcC5yZXN1bHQuZ29vZDtcbiAgICBsZXQgY2hlY2sgPSBuZXcgTW9uZXJvQ2hlY2tSZXNlcnZlKCk7XG4gICAgY2hlY2suc2V0SXNHb29kKGlzR29vZCk7XG4gICAgaWYgKGlzR29vZCkge1xuICAgICAgY2hlY2suc2V0VW5jb25maXJtZWRTcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQuc3BlbnQpKTtcbiAgICAgIGNoZWNrLnNldFRvdGFsQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC50b3RhbCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hlY2s7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3R4X25vdGVzXCIsIHt0eGlkczogdHhIYXNoZXN9KSkucmVzdWx0Lm5vdGVzO1xuICB9XG4gIFxuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSwgbm90ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbm90ZXMgPSBub3Rlcy5tYXAobm90ZSA9PiBHZW5VdGlscy5pc0luaXRpYWxpemVkKG5vdGUpID8gbm90ZSA6IFwiXCIpOyAvLyB3YWxsZXQgcnBjIHJlamVjdHMganNvbiBudWxsXG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X3R4X25vdGVzXCIsIHt0eGlkczogdHhIYXNoZXMsIG5vdGVzOiBub3Rlc30pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb0FkZHJlc3NCb29rRW50cnlbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NfYm9va1wiLCB7ZW50cmllczogZW50cnlJbmRpY2VzfSk7XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5lbnRyaWVzKSByZXR1cm4gW107XG4gICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNFbnRyeSBvZiByZXNwLnJlc3VsdC5lbnRyaWVzKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb0FkZHJlc3NCb29rRW50cnkoKS5zZXRJbmRleChycGNFbnRyeS5pbmRleCkuc2V0QWRkcmVzcyhycGNFbnRyeS5hZGRyZXNzKS5zZXREZXNjcmlwdGlvbihycGNFbnRyeS5kZXNjcmlwdGlvbikuc2V0UGF5bWVudElkKHJwY0VudHJ5LnBheW1lbnRfaWQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzczogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhZGRfYWRkcmVzc19ib29rXCIsIHthZGRyZXNzOiBhZGRyZXNzLCBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb259KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuaW5kZXg7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4OiBudW1iZXIsIHNldEFkZHJlc3M6IGJvb2xlYW4sIGFkZHJlc3M6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2V0RGVzY3JpcHRpb246IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImVkaXRfYWRkcmVzc19ib29rXCIsIHtcbiAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgIHNldF9hZGRyZXNzOiBzZXRBZGRyZXNzLFxuICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgIHNldF9kZXNjcmlwdGlvbjogc2V0RGVzY3JpcHRpb24sXG4gICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZGVsZXRlX2FkZHJlc3NfYm9va1wiLCB7aW5kZXg6IGVudHJ5SWR4fSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRhZ0FjY291bnRzKHRhZywgYWNjb3VudEluZGljZXMpIHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ0YWdfYWNjb3VudHNcIiwge3RhZzogdGFnLCBhY2NvdW50czogYWNjb3VudEluZGljZXN9KTtcbiAgfVxuXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidW50YWdfYWNjb3VudHNcIiwge2FjY291bnRzOiBhY2NvdW50SW5kaWNlc30pO1xuICB9XG5cbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICBsZXQgdGFncyA9IFtdO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FjY291bnRfdGFnc1wiKTtcbiAgICBpZiAocmVzcC5yZXN1bHQuYWNjb3VudF90YWdzKSB7XG4gICAgICBmb3IgKGxldCBycGNBY2NvdW50VGFnIG9mIHJlc3AucmVzdWx0LmFjY291bnRfdGFncykge1xuICAgICAgICB0YWdzLnB1c2gobmV3IE1vbmVyb0FjY291bnRUYWcoe1xuICAgICAgICAgIHRhZzogcnBjQWNjb3VudFRhZy50YWcgPyBycGNBY2NvdW50VGFnLnRhZyA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBsYWJlbDogcnBjQWNjb3VudFRhZy5sYWJlbCA/IHJwY0FjY291bnRUYWcubGFiZWwgOiB1bmRlZmluZWQsXG4gICAgICAgICAgYWNjb3VudEluZGljZXM6IHJwY0FjY291bnRUYWcuYWNjb3VudHNcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFncztcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9hY2NvdW50X3RhZ19kZXNjcmlwdGlvblwiLCB7dGFnOiB0YWcsIGRlc2NyaXB0aW9uOiBsYWJlbH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXltZW50VXJpKGNvbmZpZzogTW9uZXJvVHhDb25maWcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfdXJpXCIsIHtcbiAgICAgIGFkZHJlc3M6IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksXG4gICAgICBhbW91bnQ6IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSxcbiAgICAgIHBheW1lbnRfaWQ6IGNvbmZpZy5nZXRQYXltZW50SWQoKSxcbiAgICAgIHJlY2lwaWVudF9uYW1lOiBjb25maWcuZ2V0UmVjaXBpZW50TmFtZSgpLFxuICAgICAgdHhfZGVzY3JpcHRpb246IGNvbmZpZy5nZXROb3RlKClcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQudXJpO1xuICB9XG4gIFxuICBhc3luYyBwYXJzZVBheW1lbnRVcmkodXJpOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4Q29uZmlnPiB7XG4gICAgYXNzZXJ0KHVyaSwgXCJNdXN0IHByb3ZpZGUgVVJJIHRvIHBhcnNlXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicGFyc2VfdXJpXCIsIHt1cmk6IHVyaX0pO1xuICAgIGxldCBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoe2FkZHJlc3M6IHJlc3AucmVzdWx0LnVyaS5hZGRyZXNzLCBhbW91bnQ6IEJpZ0ludChyZXNwLnJlc3VsdC51cmkuYW1vdW50KX0pO1xuICAgIGNvbmZpZy5zZXRQYXltZW50SWQocmVzcC5yZXN1bHQudXJpLnBheW1lbnRfaWQpO1xuICAgIGNvbmZpZy5zZXRSZWNpcGllbnROYW1lKHJlc3AucmVzdWx0LnVyaS5yZWNpcGllbnRfbmFtZSk7XG4gICAgY29uZmlnLnNldE5vdGUocmVzcC5yZXN1bHQudXJpLnR4X2Rlc2NyaXB0aW9uKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSkgY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLnNldEFkZHJlc3ModW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldFBheW1lbnRJZCgpKSBjb25maWcuc2V0UGF5bWVudElkKHVuZGVmaW5lZCk7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXRSZWNpcGllbnROYW1lKCkpIGNvbmZpZy5zZXRSZWNpcGllbnROYW1lKHVuZGVmaW5lZCk7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXROb3RlKCkpIGNvbmZpZy5zZXROb3RlKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIGNvbmZpZztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QXR0cmlidXRlKGtleTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYXR0cmlidXRlXCIsIHtrZXk6IGtleX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnZhbHVlID09PSBcIlwiID8gdW5kZWZpbmVkIDogcmVzcC5yZXN1bHQudmFsdWU7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtNDUpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgc2V0QXR0cmlidXRlKGtleTogc3RyaW5nLCB2YWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9hdHRyaWJ1dGVcIiwge2tleToga2V5LCB2YWx1ZTogdmFsfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKG51bVRocmVhZHM6IG51bWJlciwgYmFja2dyb3VuZE1pbmluZz86IGJvb2xlYW4sIGlnbm9yZUJhdHRlcnk/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3RhcnRfbWluaW5nXCIsIHtcbiAgICAgIHRocmVhZHNfY291bnQ6IG51bVRocmVhZHMsXG4gICAgICBkb19iYWNrZ3JvdW5kX21pbmluZzogYmFja2dyb3VuZE1pbmluZyxcbiAgICAgIGlnbm9yZV9iYXR0ZXJ5OiBpZ25vcmVCYXR0ZXJ5XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3RvcF9taW5pbmdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiKTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQubXVsdGlzaWdfaW1wb3J0X25lZWRlZCA9PT0gdHJ1ZTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TXVsdGlzaWdJbmZvKCk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbmZvPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpc19tdWx0aXNpZ1wiKTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgbGV0IGluZm8gPSBuZXcgTW9uZXJvTXVsdGlzaWdJbmZvKCk7XG4gICAgaW5mby5zZXRJc011bHRpc2lnKHJlc3VsdC5tdWx0aXNpZyk7XG4gICAgaW5mby5zZXRJc1JlYWR5KHJlc3VsdC5yZWFkeSk7XG4gICAgaW5mby5zZXRUaHJlc2hvbGQocmVzdWx0LnRocmVzaG9sZCk7XG4gICAgaW5mby5zZXROdW1QYXJ0aWNpcGFudHMocmVzdWx0LnRvdGFsKTtcbiAgICByZXR1cm4gaW5mbztcbiAgfVxuICBcbiAgYXN5bmMgcHJlcGFyZU11bHRpc2lnKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJwcmVwYXJlX211bHRpc2lnXCIsIHtlbmFibGVfbXVsdGlzaWdfZXhwZXJpbWVudGFsOiB0cnVlfSk7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgcmV0dXJuIHJlc3VsdC5tdWx0aXNpZ19pbmZvO1xuICB9XG4gIFxuICBhc3luYyBtYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHRocmVzaG9sZDogbnVtYmVyLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfbXVsdGlzaWdcIiwge1xuICAgICAgbXVsdGlzaWdfaW5mbzogbXVsdGlzaWdIZXhlcyxcbiAgICAgIHRocmVzaG9sZDogdGhyZXNob2xkLFxuICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkXG4gICAgfSk7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQubXVsdGlzaWdfaW5mbztcbiAgfVxuICBcbiAgYXN5bmMgZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhjaGFuZ2VfbXVsdGlzaWdfa2V5c1wiLCB7bXVsdGlzaWdfaW5mbzogbXVsdGlzaWdIZXhlcywgcGFzc3dvcmQ6IHBhc3N3b3JkfSk7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICBsZXQgbXNSZXN1bHQgPSBuZXcgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0KCk7XG4gICAgbXNSZXN1bHQuc2V0QWRkcmVzcyhyZXNwLnJlc3VsdC5hZGRyZXNzKTtcbiAgICBtc1Jlc3VsdC5zZXRNdWx0aXNpZ0hleChyZXNwLnJlc3VsdC5tdWx0aXNpZ19pbmZvKTtcbiAgICBpZiAobXNSZXN1bHQuZ2V0QWRkcmVzcygpLmxlbmd0aCA9PT0gMCkgbXNSZXN1bHQuc2V0QWRkcmVzcyh1bmRlZmluZWQpO1xuICAgIGlmIChtc1Jlc3VsdC5nZXRNdWx0aXNpZ0hleCgpLmxlbmd0aCA9PT0gMCkgbXNSZXN1bHQuc2V0TXVsdGlzaWdIZXgodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gbXNSZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfbXVsdGlzaWdfaW5mb1wiKTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuaW5mbztcbiAgfVxuXG4gIGFzeW5jIGltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCByZWZyZXNoQWZ0ZXJJbXBvcnQ/OiBib29sZWFuKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAocmVmcmVzaEFmdGVySW1wb3J0ID09PSB1bmRlZmluZWQpIHJlZnJlc2hBZnRlckltcG9ydCA9IHRydWU7XG4gICAgaWYgKCFHZW5VdGlscy5pc0FycmF5KG11bHRpc2lnSGV4ZXMpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgc3RyaW5nW10gdG8gaW1wb3J0TXVsdGlzaWdIZXgoKVwiKVxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW1wb3J0X211bHRpc2lnX2luZm9cIiwge2luZm86IG11bHRpc2lnSGV4ZXMsIHJlZnJlc2hfYWZ0ZXJfaW1wb3J0OiByZWZyZXNoQWZ0ZXJJbXBvcnR9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQubl9vdXRwdXRzO1xuICB9XG5cbiAgYXN5bmMgc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25fbXVsdGlzaWdcIiwge3R4X2RhdGFfaGV4OiBtdWx0aXNpZ1R4SGV4fSk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCBzaWduUmVzdWx0ID0gbmV3IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCgpO1xuICAgIHNpZ25SZXN1bHQuc2V0U2lnbmVkTXVsdGlzaWdUeEhleChyZXN1bHQudHhfZGF0YV9oZXgpO1xuICAgIHNpZ25SZXN1bHQuc2V0VHhIYXNoZXMocmVzdWx0LnR4X2hhc2hfbGlzdCk7XG4gICAgcmV0dXJuIHNpZ25SZXN1bHQ7XG4gIH1cblxuICBhc3luYyBzdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN1Ym1pdF9tdWx0aXNpZ1wiLCB7dHhfZGF0YV9oZXg6IHNpZ25lZE11bHRpc2lnVHhIZXh9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQudHhfaGFzaF9saXN0O1xuICB9XG4gIFxuICBhc3luYyBjaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZDogc3RyaW5nLCBuZXdQYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoYW5nZV93YWxsZXRfcGFzc3dvcmRcIiwge29sZF9wYXNzd29yZDogb2xkUGFzc3dvcmQgfHwgXCJcIiwgbmV3X3Bhc3N3b3JkOiBuZXdQYXNzd29yZCB8fCBcIlwifSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNhdmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3RvcmVcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGNsb3NlKHNhdmUgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN1cGVyLmNsb3NlKHNhdmUpO1xuICAgIGlmIChzYXZlID09PSB1bmRlZmluZWQpIHNhdmUgPSBmYWxzZTtcbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2xvc2Vfd2FsbGV0XCIsIHthdXRvc2F2ZV9jdXJyZW50OiBzYXZlfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ2xvc2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFByaW1hcnlBZGRyZXNzKCk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICByZXR1cm4gZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtMTMgJiYgZS5tZXNzYWdlLmluZGV4T2YoXCJObyB3YWxsZXQgZmlsZVwiKSA+IC0xO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTYXZlIGFuZCBjbG9zZSB0aGUgY3VycmVudCB3YWxsZXQgYW5kIHN0b3AgdGhlIFJQQyBzZXJ2ZXIuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3RvcF93YWxsZXRcIik7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tIEFERCBKU0RPQyBGT1IgU1VQUE9SVEVEIERFRkFVTFQgSU1QTEVNRU5UQVRJT05TIC0tLS0tLS0tLS0tLS0tXG5cbiAgYXN5bmMgZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTogUHJvbWlzZTxudW1iZXJbXXx1bmRlZmluZWQ+IHsgcmV0dXJuIHN1cGVyLmdldE51bUJsb2Nrc1RvVW5sb2NrKCk7IH1cbiAgYXN5bmMgZ2V0VHgodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0fHVuZGVmaW5lZD4geyByZXR1cm4gc3VwZXIuZ2V0VHgodHhIYXNoKTsgfVxuICBhc3luYyBnZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdPiB7IHJldHVybiBzdXBlci5nZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeSk7IH1cbiAgYXN5bmMgZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pIHsgcmV0dXJuIHN1cGVyLmdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBjcmVhdGVUeChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4geyByZXR1cm4gc3VwZXIuY3JlYXRlVHgoY29uZmlnKTsgfVxuICBhc3luYyByZWxheVR4KHR4T3JNZXRhZGF0YTogTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIucmVsYXlUeCh0eE9yTWV0YWRhdGEpOyB9XG4gIGFzeW5jIGdldFR4Tm90ZSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5nZXRUeE5vdGUodHhIYXNoKTsgfVxuICBhc3luYyBzZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcsIG5vdGU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4geyByZXR1cm4gc3VwZXIuc2V0VHhOb3RlKHR4SGFzaCwgbm90ZSk7IH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgc3RhdGljIGFzeW5jIGNvbm5lY3RUb1dhbGxldFJwYyh1cmlPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPiB8IHN0cmluZ1tdLCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICAgIGxldCBjb25maWcgPSBNb25lcm9XYWxsZXRScGMubm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnLCB1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgIGlmIChjb25maWcuY21kKSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLnN0YXJ0V2FsbGV0UnBjUHJvY2Vzcyhjb25maWcpO1xuICAgIGVsc2UgcmV0dXJuIG5ldyBNb25lcm9XYWxsZXRScGMoY29uZmlnKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBzdGFydFdhbGxldFJwY1Byb2Nlc3MoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICAgIGFzc2VydChHZW5VdGlscy5pc0FycmF5KGNvbmZpZy5jbWQpLCBcIk11c3QgcHJvdmlkZSBzdHJpbmcgYXJyYXkgd2l0aCBjb21tYW5kIGxpbmUgcGFyYW1ldGVyc1wiKTtcbiAgICBcbiAgICAvLyBzdGFydCBwcm9jZXNzXG4gICAgbGV0IGNoaWxkX3Byb2Nlc3MgPSBhd2FpdCBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpO1xuICAgIGNvbnN0IGNoaWxkUHJvY2VzcyA9IGNoaWxkX3Byb2Nlc3Muc3Bhd24oY29uZmlnLmNtZFswXSwgY29uZmlnLmNtZC5zbGljZSgxKSwge1xuICAgICAgZW52OiB7IC4uLnByb2Nlc3MuZW52LCBMQU5HOiAnZW5fVVMuVVRGLTgnIH0gLy8gc2NyYXBlIG91dHB1dCBpbiBlbmdsaXNoXG4gICAgfSk7XG4gICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIGNoaWxkUHJvY2Vzcy5zdGRlcnIuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBcbiAgICAvLyByZXR1cm4gcHJvbWlzZSB3aGljaCByZXNvbHZlcyBhZnRlciBzdGFydGluZyBtb25lcm8td2FsbGV0LXJwY1xuICAgIGxldCB1cmk7XG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIGxldCBvdXRwdXQgPSBcIlwiO1xuICAgIGxldCB0aW1lb3V0O1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIFxuICAgICAgICAvLyBmYWlsIGlmIHByb2Nlc3MgZG9lcyBub3Qgc3RhcnQgd2l0aGluIHRoZSB0aW1lb3V0XG4gICAgICAgIGlmIChjb25maWcuY21kVGltZW91dE1zID4gMCkgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gcmVqZWN0KG5ldyBNb25lcm9FcnJvcihcIkZhaWxlZCB0byBzdGFydCBtb25lcm8td2FsbGV0LXJwYyB3aXRoaW4gXCIgKyBjb25maWcuY21kVGltZW91dE1zICsgXCIgbXNcIiArIChvdXRwdXQgPyBcIjpcXG5cXG5cIiArIG91dHB1dCA6IFwiXCIpKSksIGNvbmZpZy5jbWRUaW1lb3V0TXMpO1xuICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRvdXRcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5vbignZGF0YScsIGFzeW5jIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBsZXQgbGluZSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDIsIGxpbmUpO1xuICAgICAgICAgIG91dHB1dCArPSBsaW5lICsgJ1xcbic7IC8vIGNhcHR1cmUgb3V0cHV0IGluIGNhc2Ugb2YgZXJyb3JcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBleHRyYWN0IHVyaSBmcm9tIGUuZy4gXCJJIEJpbmRpbmcgb24gMTI3LjAuMC4xIChJUHY0KTozODA4NVwiXG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWlucyA9IFwiQmluZGluZyBvbiBcIjtcbiAgICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zSWR4ID0gbGluZS5pbmRleE9mKHVyaUxpbmVDb250YWlucyk7XG4gICAgICAgICAgaWYgKHVyaUxpbmVDb250YWluc0lkeCA+PSAwKSB7XG4gICAgICAgICAgICBsZXQgaG9zdCA9IGxpbmUuc3Vic3RyaW5nKHVyaUxpbmVDb250YWluc0lkeCArIHVyaUxpbmVDb250YWlucy5sZW5ndGgsIGxpbmUubGFzdEluZGV4T2YoJyAnKSk7XG4gICAgICAgICAgICBsZXQgdW5mb3JtYXR0ZWRMaW5lID0gbGluZS5yZXBsYWNlKC9cXHUwMDFiXFxbLio/bS9nLCAnJykudHJpbSgpOyAvLyByZW1vdmUgY29sb3IgZm9ybWF0dGluZ1xuICAgICAgICAgICAgbGV0IHBvcnQgPSB1bmZvcm1hdHRlZExpbmUuc3Vic3RyaW5nKHVuZm9ybWF0dGVkTGluZS5sYXN0SW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBsZXQgc3NsSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtc3NsXCIpO1xuICAgICAgICAgICAgbGV0IHNzbEVuYWJsZWQgPSBzc2xJZHggPj0gMCA/IFwiZW5hYmxlZFwiID09IGNvbmZpZy5jbWRbc3NsSWR4ICsgMV0udG9Mb3dlckNhc2UoKSA6IGZhbHNlO1xuICAgICAgICAgICAgdXJpID0gKHNzbEVuYWJsZWQgPyBcImh0dHBzXCIgOiBcImh0dHBcIikgKyBcIjovL1wiICsgaG9zdCArIFwiOlwiICsgcG9ydDtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVhZCBzdWNjZXNzIG1lc3NhZ2VcbiAgICAgICAgICBpZiAobGluZS5pbmRleE9mKFwiU3RhcnRpbmcgd2FsbGV0IFJQQyBzZXJ2ZXJcIikgPj0gMCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIGdldCB1c2VybmFtZSwgcGFzc3dvcmQsIHptcSBwdWJsaXNoIHVyaSwgYW5kIHByb3h5IHVyaSBmcm9tIHBhcmFtc1xuICAgICAgICAgICAgICBsZXQgdXNlclBhc3NJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXJwYy1sb2dpblwiKTtcbiAgICAgICAgICAgICAgbGV0IHVzZXJQYXNzID0gdXNlclBhc3NJZHggPj0gMCA/IGNvbmZpZy5jbWRbdXNlclBhc3NJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgbGV0IHVzZXJuYW1lID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZygwLCB1c2VyUGFzcy5pbmRleE9mKCc6JykpO1xuICAgICAgICAgICAgICBsZXQgcGFzc3dvcmQgPSB1c2VyUGFzcyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdXNlclBhc3Muc3Vic3RyaW5nKHVzZXJQYXNzLmluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgICBsZXQgem1xVXJpSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS16bXEtcHViXCIpO1xuICAgICAgICAgICAgICBsZXQgem1xVXJpID0gem1xVXJpSWR4ID49IDAgPyBjb25maWcuY21kW3ptcVVyaUlkeCArIDFdIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICBsZXQgcHJveHlVcmlJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXByb3h5XCIpO1xuICAgICAgICAgICAgICB0aGlzLnN0YXJ0dXBQcm94eVVyaSA9IHByb3h5VXJpSWR4ID49IDAgPyBjb25maWcuY21kW3Byb3h5VXJpSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyBjcmVhdGUgY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzXG4gICAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZy5jb3B5KCkuc2V0U2VydmVyKHt1cmk6IHVyaSwgdXNlcm5hbWU6IHVzZXJuYW1lLCBwYXNzd29yZDogcGFzc3dvcmQsIHptcVVyaTogem1xVXJpLCBwcm94eVVyaTogdGhpcy5zdGFydHVwUHJveHlVcmksIHJlamVjdFVuYXV0aG9yaXplZDogY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkfSk7XG4gICAgICAgICAgICAgIGNvbmZpZy5jbWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgIGxldCB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRScGMuY29ubmVjdFRvV2FsbGV0UnBjKGNvbmZpZyk7XG4gICAgICAgICAgICAgIHdhbGxldC5wcm9jZXNzID0gY2hpbGRQcm9jZXNzO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy8gcmVzb2x2ZSBwcm9taXNlIHdpdGggY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzIFxuICAgICAgICAgICAgICB0aGlzLmlzUmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICByZXNvbHZlKHdhbGxldCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRlcnJcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5vbignZGF0YScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgY29uc29sZS5lcnJvcihkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXhpdFxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJleGl0XCIsIGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIHByb2Nlc3MgdGVybWluYXRlZCB3aXRoIGV4aXQgY29kZSBcIiArIGNvZGUgKyAob3V0cHV0ID8gXCI6XFxuXFxuXCIgKyBvdXRwdXQgOiBcIlwiKSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBlcnJvclxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJlcnJvclwiLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIkVOT0VOVFwiKSA+PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgZXhpc3QgYXQgcGF0aCAnXCIgKyBjb25maWcuY21kWzBdICsgXCInXCIpKTtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHVuY2F1Z2h0IGV4Y2VwdGlvblxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCBmdW5jdGlvbihlcnIsIG9yaWdpbikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmNhdWdodCBleGNlcHRpb24gaW4gbW9uZXJvLXdhbGxldC1ycGMgcHJvY2VzczogXCIgKyBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihvcmlnaW4pO1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgYXdhaXQgR2VuVXRpbHMua2lsbFByb2Nlc3MoY2hpbGRQcm9jZXNzLCBcIlNJR0tJTExcIik7IC8vIGRvIG5vdCBsZWF2ZSB0aGUgcHJvY2VzcyBydW5uaW5nXG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY2xlYXIoKSB7XG4gICAgdGhpcy5saXN0ZW5lckdlbmVyYXRpb24rKztcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIpIHRoaXMud2FsbGV0UG9sbGVyLnJlc2V0KCk7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gICAgZGVsZXRlIHRoaXMuYWRkcmVzc0NhY2hlO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgdGhpcy5wYXRoID0gdW5kZWZpbmVkO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QWNjb3VudEluZGljZXMoZ2V0U3ViYWRkcmVzc0luZGljZXM/OiBhbnkpIHtcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTtcbiAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgaW5kaWNlcy5zZXQoYWNjb3VudC5nZXRJbmRleCgpLCBnZXRTdWJhZGRyZXNzSW5kaWNlcyA/IGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc0luZGljZXMoYWNjb3VudC5nZXRJbmRleCgpKSA6IHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIHJldHVybiBpbmRpY2VzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0U3ViYWRkcmVzc0luZGljZXMoYWNjb3VudElkeCkge1xuICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NcIiwge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHh9KTtcbiAgICBmb3IgKGxldCBhZGRyZXNzIG9mIHJlc3AucmVzdWx0LmFkZHJlc3Nlcykgc3ViYWRkcmVzc0luZGljZXMucHVzaChhZGRyZXNzLmFkZHJlc3NfaW5kZXgpO1xuICAgIHJldHVybiBzdWJhZGRyZXNzSW5kaWNlcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldFRyYW5zZmVyc0F1eChxdWVyeTogTW9uZXJvVHJhbnNmZXJRdWVyeSkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHBhcmFtcyBmb3IgZ2V0X3RyYW5zZmVycyBycGMgY2FsbFxuICAgIGxldCB0eFF1ZXJ5ID0gcXVlcnkuZ2V0VHhRdWVyeSgpO1xuICAgIGxldCBjYW5CZUNvbmZpcm1lZCA9IHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldElzUmVsYXllZCgpICE9PSBmYWxzZTtcbiAgICBsZXQgY2FuQmVJblR4UG9vbCA9IHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEhlaWdodCgpID09PSB1bmRlZmluZWQgJiYgdHhRdWVyeS5nZXRNYXhIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4UXVlcnkuZ2V0SXNMb2NrZWQoKSAhPT0gZmFsc2U7XG4gICAgbGV0IGNhbkJlSW5jb21pbmcgPSBxdWVyeS5nZXRJc0luY29taW5nKCkgIT09IGZhbHNlICYmIHF1ZXJ5LmdldElzT3V0Z29pbmcoKSAhPT0gdHJ1ZSAmJiBxdWVyeS5nZXRIYXNEZXN0aW5hdGlvbnMoKSAhPT0gdHJ1ZTtcbiAgICBsZXQgY2FuQmVPdXRnb2luZyA9IHF1ZXJ5LmdldElzT3V0Z29pbmcoKSAhPT0gZmFsc2UgJiYgcXVlcnkuZ2V0SXNJbmNvbWluZygpICE9PSB0cnVlO1xuXG4gICAgLy8gY2hlY2sgaWYgZmV0Y2hpbmcgcG9vbCB0eHMgY29udHJhZGljdGVkIGJ5IGNvbmZpZ3VyYXRpb25cbiAgICBpZiAodHhRdWVyeS5nZXRJblR4UG9vbCgpID09PSB0cnVlICYmICFjYW5CZUluVHhQb29sKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgZmV0Y2ggcG9vbCB0cmFuc2FjdGlvbnMgYmVjYXVzZSBpdCBjb250cmFkaWN0cyBjb25maWd1cmF0aW9uXCIpO1xuICAgIH1cblxuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5pbiA9IGNhbkJlSW5jb21pbmcgJiYgY2FuQmVDb25maXJtZWQ7XG4gICAgcGFyYW1zLm91dCA9IGNhbkJlT3V0Z29pbmcgJiYgY2FuQmVDb25maXJtZWQ7XG4gICAgcGFyYW1zLnBvb2wgPSBjYW5CZUluY29taW5nICYmIGNhbkJlSW5UeFBvb2w7XG4gICAgcGFyYW1zLnBlbmRpbmcgPSBjYW5CZU91dGdvaW5nICYmIGNhbkJlSW5UeFBvb2w7XG4gICAgcGFyYW1zLmZhaWxlZCA9IHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJc0NvbmZpcm1lZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPSB0cnVlO1xuICAgIGlmICh0eFF1ZXJ5LmdldE1pbkhlaWdodCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eFF1ZXJ5LmdldE1pbkhlaWdodCgpID4gMCkgcGFyYW1zLm1pbl9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpIC0gMTsgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogd2FsbGV0Mjo6Z2V0X3BheW1lbnRzKCkgbWluX2hlaWdodCBpcyBleGNsdXNpdmUsIHNvIG1hbnVhbGx5IG9mZnNldCB0byBtYXRjaCBpbnRlbmRlZCByYW5nZSAoaXNzdWVzICM1NzUxLCAjNTU5OClcbiAgICAgIGVsc2UgcGFyYW1zLm1pbl9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpO1xuICAgIH1cbiAgICBpZiAodHhRdWVyeS5nZXRNYXhIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSBwYXJhbXMubWF4X2hlaWdodCA9IHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCk7XG4gICAgcGFyYW1zLmZpbHRlcl9ieV9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpICE9PSB1bmRlZmluZWQgfHwgdHhRdWVyeS5nZXRNYXhIZWlnaHQoKSAhPT0gdW5kZWZpbmVkO1xuICAgIGlmIChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkgPT09IHVuZGVmaW5lZCAmJiBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQsIFwiUXVlcnkgc3BlY2lmaWVzIGEgc3ViYWRkcmVzcyBpbmRleCBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIik7XG4gICAgICBwYXJhbXMuYWxsX2FjY291bnRzID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBxdWVyeS5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICAgIFxuICAgICAgLy8gc2V0IHN1YmFkZHJlc3MgaW5kaWNlcyBwYXJhbVxuICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gbmV3IFNldCgpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpICE9PSB1bmRlZmluZWQpIHN1YmFkZHJlc3NJbmRpY2VzLmFkZChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLm1hcChzdWJhZGRyZXNzSWR4ID0+IHN1YmFkZHJlc3NJbmRpY2VzLmFkZChzdWJhZGRyZXNzSWR4KSk7XG4gICAgICBpZiAoc3ViYWRkcmVzc0luZGljZXMuc2l6ZSkgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IEFycmF5LmZyb20oc3ViYWRkcmVzc0luZGljZXMpO1xuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB1bmlxdWUgdHhzIGFuZCBibG9ja3NcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBcbiAgICAvLyBidWlsZCB0eHMgdXNpbmcgYGdldF90cmFuc2ZlcnNgXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHJhbnNmZXJzXCIsIHBhcmFtcyk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJlc3AucmVzdWx0KSkge1xuICAgICAgZm9yIChsZXQgcnBjVHggb2YgcmVzcC5yZXN1bHRba2V5XSkge1xuICAgICAgICAvL2lmIChycGNUeC50eGlkID09PSBxdWVyeS5kZWJ1Z1R4SWQpIGNvbnNvbGUubG9nKHJwY1R4KTtcbiAgICAgICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlcihycGNUeCk7XG4gICAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSBhc3NlcnQodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSA+IC0xKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlcGxhY2UgdHJhbnNmZXIgYW1vdW50IHdpdGggZGVzdGluYXRpb24gc3VtXG4gICAgICAgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IGNvbmZpcm1lZCB0eCBmcm9tL3RvIHNhbWUgYWNjb3VudCBoYXMgYW1vdW50IDAgYnV0IGNhY2hlZCB0cmFuc2ZlcnNcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldElzUmVsYXllZCgpICYmICF0eC5nZXRJc0ZhaWxlZCgpICYmXG4gICAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkgJiYgdHguZ2V0T3V0Z29pbmdBbW91bnQoKSA9PT0gMG4pIHtcbiAgICAgICAgICBsZXQgb3V0Z29pbmdUcmFuc2ZlciA9IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKTtcbiAgICAgICAgICBsZXQgdHJhbnNmZXJUb3RhbCA9IEJpZ0ludCgwKTtcbiAgICAgICAgICBmb3IgKGxldCBkZXN0aW5hdGlvbiBvZiBvdXRnb2luZ1RyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpKSB0cmFuc2ZlclRvdGFsID0gdHJhbnNmZXJUb3RhbCArIGRlc3RpbmF0aW9uLmdldEFtb3VudCgpO1xuICAgICAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBbW91bnQodHJhbnNmZXJUb3RhbCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIG1lcmdlIHR4XG4gICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzb3J0IHR4cyBieSBibG9jayBoZWlnaHRcbiAgICBsZXQgdHhzOiBNb25lcm9UeFdhbGxldFtdID0gT2JqZWN0LnZhbHVlcyh0eE1hcCk7XG4gICAgdHhzLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVUeHNCeUhlaWdodCk7XG4gICAgXG4gICAgLy8gZmlsdGVyIGFuZCByZXR1cm4gdHJhbnNmZXJzXG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgXG4gICAgICAvLyB0eCBpcyBub3QgaW5jb21pbmcvb3V0Z29pbmcgdW5sZXNzIGFscmVhZHkgc2V0XG4gICAgICBpZiAodHguZ2V0SXNJbmNvbWluZygpID09PSB1bmRlZmluZWQpIHR4LnNldElzSW5jb21pbmcoZmFsc2UpO1xuICAgICAgaWYgKHR4LmdldElzT3V0Z29pbmcoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc091dGdvaW5nKGZhbHNlKTtcbiAgICAgIFxuICAgICAgLy8gc29ydCBpbmNvbWluZyB0cmFuc2ZlcnNcbiAgICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZUluY29taW5nVHJhbnNmZXJzKTtcbiAgICAgIFxuICAgICAgLy8gY29sbGVjdCBxdWVyaWVkIHRyYW5zZmVycywgZXJhc2UgaWYgZXhjbHVkZWRcbiAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmZpbHRlclRyYW5zZmVycyhxdWVyeSkpIHtcbiAgICAgICAgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyByZW1vdmUgdHhzIHdpdGhvdXQgcmVxdWVzdGVkIHRyYW5zZmVyXG4gICAgICBpZiAodHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PT0gdW5kZWZpbmVkICYmIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0eC5nZXRCbG9jaygpLmdldFR4cygpLnNwbGljZSh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldE91dHB1dHNBdXgocXVlcnkpIHtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzIHRvIGJlIHF1ZXJpZWRcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTtcbiAgICBpZiAocXVlcnkuZ2V0QWNjb3VudEluZGV4KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gbmV3IFNldCgpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpICE9PSB1bmRlZmluZWQpIHN1YmFkZHJlc3NJbmRpY2VzLmFkZChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLm1hcChzdWJhZGRyZXNzSWR4ID0+IHN1YmFkZHJlc3NJbmRpY2VzLmFkZChzdWJhZGRyZXNzSWR4KSk7XG4gICAgICBpbmRpY2VzLnNldChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMuc2l6ZSA/IEFycmF5LmZyb20oc3ViYWRkcmVzc0luZGljZXMpIDogdW5kZWZpbmVkKTsgIC8vIHVuZGVmaW5lZCB3aWxsIGZldGNoIGZyb20gYWxsIHN1YmFkZHJlc3Nlc1xuICAgIH0gZWxzZSB7XG4gICAgICBhc3NlcnQuZXF1YWwocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCksIHVuZGVmaW5lZCwgXCJRdWVyeSBzcGVjaWZpZXMgYSBzdWJhZGRyZXNzIGluZGV4IGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKVxuICAgICAgYXNzZXJ0KHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCB8fCBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCwgXCJRdWVyeSBzcGVjaWZpZXMgc3ViYWRkcmVzcyBpbmRpY2VzIGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKTtcbiAgICAgIGluZGljZXMgPSBhd2FpdCB0aGlzLmdldEFjY291bnRJbmRpY2VzKCk7ICAvLyBmZXRjaCBhbGwgYWNjb3VudCBpbmRpY2VzIHdpdGhvdXQgc3ViYWRkcmVzc2VzXG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHVuaXF1ZSB0eHMgYW5kIGJsb2Nrc1xuICAgIGxldCB0eE1hcCA9IHt9O1xuICAgIGxldCBibG9ja01hcCA9IHt9O1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdHhzIHdpdGggb3V0cHV0cyBmb3IgZWFjaCBpbmRpY2F0ZWQgYWNjb3VudCB1c2luZyBgaW5jb21pbmdfdHJhbnNmZXJzYCBycGMgY2FsbFxuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy50cmFuc2Zlcl90eXBlID0gcXVlcnkuZ2V0SXNTcGVudCgpID09PSB0cnVlID8gXCJ1bmF2YWlsYWJsZVwiIDogcXVlcnkuZ2V0SXNTcGVudCgpID09PSBmYWxzZSA/IFwiYXZhaWxhYmxlXCIgOiBcImFsbFwiO1xuICAgIHBhcmFtcy52ZXJib3NlID0gdHJ1ZTtcbiAgICBmb3IgKGxldCBhY2NvdW50SWR4IG9mIGluZGljZXMua2V5cygpKSB7XG4gICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gYWNjb3VudElkeDtcbiAgICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBpbmRpY2VzLmdldChhY2NvdW50SWR4KTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW5jb21pbmdfdHJhbnNmZXJzXCIsIHBhcmFtcyk7XG4gICAgICBcbiAgICAgIC8vIGNvbnZlcnQgcmVzcG9uc2UgdG8gdHhzIHdpdGggb3V0cHV0cyBhbmQgbWVyZ2VcbiAgICAgIGlmIChyZXNwLnJlc3VsdC50cmFuc2ZlcnMgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG4gICAgICBmb3IgKGxldCBycGNPdXRwdXQgb2YgcmVzcC5yZXN1bHQudHJhbnNmZXJzKSB7XG4gICAgICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoT3V0cHV0KHJwY091dHB1dCk7XG4gICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzb3J0IHR4cyBieSBibG9jayBoZWlnaHRcbiAgICBsZXQgdHhzOiBNb25lcm9UeFdhbGxldFtdID0gT2JqZWN0LnZhbHVlcyh0eE1hcCk7XG4gICAgdHhzLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVUeHNCeUhlaWdodCk7XG4gICAgXG4gICAgLy8gY29sbGVjdCBxdWVyaWVkIG91dHB1dHNcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgXG4gICAgICAvLyBzb3J0IG91dHB1dHNcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdHguZ2V0T3V0cHV0cygpLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVPdXRwdXRzKTtcbiAgICAgIFxuICAgICAgLy8gY29sbGVjdCBxdWVyaWVkIG91dHB1dHMsIGVyYXNlIGlmIGV4Y2x1ZGVkXG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZmlsdGVyT3V0cHV0cyhxdWVyeSkpIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgXG4gICAgICAvLyByZW1vdmUgZXhjbHVkZWQgdHhzIGZyb20gYmxvY2tcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgPT09IHVuZGVmaW5lZCAmJiB0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29tbW9uIG1ldGhvZCB0byBnZXQga2V5IGltYWdlcy5cbiAgICogXG4gICAqIEBwYXJhbSBhbGwgLSBwZWNpZmllcyB0byBnZXQgYWxsIHhvciBvbmx5IG5ldyBpbWFnZXMgZnJvbSBsYXN0IGltcG9ydFxuICAgKiBAcmV0dXJuIHtNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdH0gdGhlIGtleSBpbWFnZXMgYW5kIHRoZWlyIG9mZnNldCBhbW9uZyB0aGUgd2FsbGV0J3Mgb3V0cHV0c1xuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIHJwY0V4cG9ydEtleUltYWdlcyhhbGwpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfa2V5X2ltYWdlc1wiLCB7YWxsOiBhbGx9KTtcbiAgICBsZXQga2V5SW1hZ2VzID0gKHJlc3AucmVzdWx0LnNpZ25lZF9rZXlfaW1hZ2VzIHx8IFtdKS5tYXAocnBjSW1hZ2UgPT4gbmV3IE1vbmVyb0tleUltYWdlKHJwY0ltYWdlLmtleV9pbWFnZSwgcnBjSW1hZ2Uuc2lnbmF0dXJlKSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCgpLnNldE9mZnNldChyZXNwLnJlc3VsdC5vZmZzZXQpLnNldEtleUltYWdlcyhrZXlJbWFnZXMpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgcnBjU3dlZXBBY2NvdW50KGNvbmZpZzogTW9uZXJvVHhDb25maWcpIHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBzd2VlcCBjb25maWdcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYW4gYWNjb3VudCBpbmRleCB0byBzd2VlcCBmcm9tXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoICE9IDEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBleGFjdGx5IG9uZSBkZXN0aW5hdGlvbiB0byBzd2VlcCB0b1wiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZGVzdGluYXRpb24gYWRkcmVzcyB0byBzd2VlcCB0b1wiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFtb3VudCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IGFtb3VudCBpbiBzd2VlcCBjb25maWdcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRLZXlJbWFnZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIktleSBpbWFnZSBkZWZpbmVkOyB1c2Ugc3dlZXBPdXRwdXQoKSB0byBzd2VlcCBhbiBvdXRwdXQgYnkgaXRzIGtleSBpbWFnZVwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCAmJiBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkVtcHR5IGxpc3QgZ2l2ZW4gZm9yIHN1YmFkZHJlc3NlcyBpbmRpY2VzIHRvIHN3ZWVwXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcygpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3dlZXAgZWFjaCBzdWJhZGRyZXNzIHdpdGggUlBDIGBzd2VlcF9hbGxgXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkgIT09IHVuZGVmaW5lZCAmJiBjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkubGVuZ3RoID4gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3dlZXBpbmcgb3V0cHV0IGRvZXMgbm90IHN1cHBvcnQgc3VidHJhY3RpbmcgZmVlcyBmcm9tIGRlc3RpbmF0aW9uc1wiKTtcbiAgICBcbiAgICAvLyBzd2VlcCBmcm9tIGFsbCBzdWJhZGRyZXNzZXMgaWYgbm90IG90aGVyd2lzZSBkZWZpbmVkXG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbmZpZy5zZXRTdWJhZGRyZXNzSW5kaWNlcyhbXSk7XG4gICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKSkpIHtcbiAgICAgICAgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJObyBzdWJhZGRyZXNzZXMgdG8gc3dlZXAgZnJvbVwiKTtcbiAgICBcbiAgICAvLyBjb21tb24gY29uZmlnIHBhcmFtc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIGxldCByZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpID09PSB0cnVlO1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gY29uZmlnLmdldEFjY291bnRJbmRleCgpO1xuICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCk7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWcuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWcuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZy5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gIXJlbGF5O1xuICAgIHBhcmFtcy5iZWxvd19hbW91bnQgPSBjb25maWcuZ2V0QmVsb3dBbW91bnQoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2tleXMgPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBpbnZva2Ugd2FsbGV0IHJwYyBgc3dlZXBfYWxsYFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfYWxsXCIsIHBhcmFtcyk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGZyb20gcmVzcG9uc2VcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCwgdW5kZWZpbmVkLCBjb25maWcpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgcmVtYWluaW5nIGtub3duIGZpZWxkc1xuICAgIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB7XG4gICAgICB0eC5zZXRJc0xvY2tlZCh0cnVlKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICB0eC5zZXRSZWxheShyZWxheSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChyZWxheSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQocmVsYXkpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIGxldCB0cmFuc2ZlciA9IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKTtcbiAgICAgIHRyYW5zZmVyLnNldEFjY291bnRJbmRleChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkpO1xuICAgICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSkgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkpO1xuICAgICAgbGV0IGRlc3RpbmF0aW9uID0gbmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksIEJpZ0ludCh0cmFuc2Zlci5nZXRBbW91bnQoKSkpO1xuICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKFtkZXN0aW5hdGlvbl0pO1xuICAgICAgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgICB0eC5zZXRQYXltZW50SWQoY29uZmlnLmdldFBheW1lbnRJZCgpKTtcbiAgICAgIGlmICh0eC5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0VW5sb2NrVGltZSgwbik7XG4gICAgICBpZiAodHguZ2V0UmVsYXkoKSkge1xuICAgICAgICBpZiAodHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgrbmV3IERhdGUoKS5nZXRUaW1lKCkpOyAgLy8gVE9ETyAobW9uZXJvLXdhbGxldC1ycGMpOiBwcm92aWRlIHRpbWVzdGFtcCBvbiByZXNwb25zZTsgdW5jb25maXJtZWQgdGltZXN0YW1wcyB2YXJ5XG4gICAgICAgIGlmICh0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbigpID09PSB1bmRlZmluZWQpIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0LmdldFR4cygpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgPT0gdW5kZWZpbmVkICYmIHRoaXMubGlzdGVuZXJzLmxlbmd0aCkgdGhpcy53YWxsZXRQb2xsZXIgPSBuZXcgV2FsbGV0UG9sbGVyKHRoaXMpO1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkKSB0aGlzLndhbGxldFBvbGxlci5zZXRJc1BvbGxpbmcodGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQb2xsIGlmIGxpc3RlbmluZy5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBwb2xsKCkge1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2FsbGV0UG9sbGVyLmlzUG9sbGluZykgYXdhaXQgdGhpcy53YWxsZXRQb2xsZXIucG9sbCgpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgU1RBVElDIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVDb25maWcodXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogTW9uZXJvV2FsbGV0Q29uZmlnIHtcbiAgICBsZXQgY29uZmlnOiB1bmRlZmluZWQgfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gPSB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbmZpZyA9PT0gXCJzdHJpbmdcIiB8fCAodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPikudXJpKSBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHtzZXJ2ZXI6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29uZmlnIGFzIHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4sIHVzZXJuYW1lLCBwYXNzd29yZCl9KTtcbiAgICBlbHNlIGlmIChHZW5VdGlscy5pc0FycmF5KHVyaU9yQ29uZmlnKSkgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh7Y21kOiB1cmlPckNvbmZpZyBhcyBzdHJpbmdbXX0pO1xuICAgIGVsc2UgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pO1xuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlciA9PT0gdW5kZWZpbmVkKSBjb25maWcucHJveHlUb1dvcmtlciA9IHRydWU7XG4gICAgcmV0dXJuIGNvbmZpZyBhcyBNb25lcm9XYWxsZXRDb25maWc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZW1vdmUgY3JpdGVyaWEgd2hpY2ggcmVxdWlyZXMgbG9va2luZyB1cCBvdGhlciB0cmFuc2ZlcnMvb3V0cHV0cyB0b1xuICAgKiBmdWxmaWxsIHF1ZXJ5LlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBxdWVyeSAtIHRoZSBxdWVyeSB0byBkZWNvbnRleHR1YWxpemVcbiAgICogQHJldHVybiB7TW9uZXJvVHhRdWVyeX0gYSByZWZlcmVuY2UgdG8gdGhlIHF1ZXJ5IGZvciBjb252ZW5pZW5jZVxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBkZWNvbnRleHR1YWxpemUocXVlcnkpIHtcbiAgICBxdWVyeS5zZXRJc0luY29taW5nKHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0SXNPdXRnb2luZyh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldFRyYW5zZmVyUXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRJbnB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0T3V0cHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gcXVlcnk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgaXNDb250ZXh0dWFsKHF1ZXJ5KSB7XG4gICAgaWYgKCFxdWVyeSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghcXVlcnkuZ2V0VHhRdWVyeSgpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRJc0luY29taW5nKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7IC8vIHJlcXVpcmVzIGdldHRpbmcgb3RoZXIgdHJhbnNmZXJzXG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRJc091dGdvaW5nKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKHF1ZXJ5IGluc3RhbmNlb2YgTW9uZXJvVHJhbnNmZXJRdWVyeSkge1xuICAgICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRPdXRwdXRRdWVyeSgpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIG91dHB1dHNcbiAgICB9IGVsc2UgaWYgKHF1ZXJ5IGluc3RhbmNlb2YgTW9uZXJvT3V0cHV0UXVlcnkpIHtcbiAgICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0VHJhbnNmZXJRdWVyeSgpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIHRyYW5zZmVyc1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJxdWVyeSBtdXN0IGJlIHR4IG9yIHRyYW5zZmVyIHF1ZXJ5XCIpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0FjY291bnQocnBjQWNjb3VudCkge1xuICAgIGxldCBhY2NvdW50ID0gbmV3IE1vbmVyb0FjY291bnQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQWNjb3VudCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNBY2NvdW50W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFjY291bnRfaW5kZXhcIikgYWNjb3VudC5zZXRJbmRleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhbGFuY2VcIikgYWNjb3VudC5zZXRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZF9iYWxhbmNlXCIpIGFjY291bnQuc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYXNlX2FkZHJlc3NcIikgYWNjb3VudC5zZXRQcmltYXJ5QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhZ1wiKSBhY2NvdW50LnNldFRhZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhYmVsXCIpIHsgfSAvLyBsYWJlbCBiZWxvbmdzIHRvIGZpcnN0IHN1YmFkZHJlc3NcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGFjY291bnQgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgaWYgKFwiXCIgPT09IGFjY291bnQuZ2V0VGFnKCkpIGFjY291bnQuc2V0VGFnKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIGFjY291bnQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcykge1xuICAgIGxldCBzdWJhZGRyZXNzID0gbmV3IE1vbmVyb1N1YmFkZHJlc3MoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjU3ViYWRkcmVzcykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNTdWJhZGRyZXNzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFjY291bnRfaW5kZXhcIikgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzX2luZGV4XCIpIHN1YmFkZHJlc3Muc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzXCIpIHN1YmFkZHJlc3Muc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhbGFuY2VcIikgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZF9iYWxhbmNlXCIpIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fdW5zcGVudF9vdXRwdXRzXCIpIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYWJlbFwiKSB7IGlmICh2YWwpIHN1YmFkZHJlc3Muc2V0TGFiZWwodmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVzZWRcIikgc3ViYWRkcmVzcy5zZXRJc1VzZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja3NfdG9fdW5sb2NrXCIpIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2sodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PSBcInRpbWVfdG9fdW5sb2NrXCIpIHt9ICAvLyBpZ25vcmluZ1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgc3ViYWRkcmVzcyBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gc3ViYWRkcmVzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgc2VudCB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIFRPRE86IHJlbW92ZSBjb3B5RGVzdGluYXRpb25zIGFmdGVyID4xOC4zLjEgd2hlbiBzdWJ0cmFjdEZlZUZyb20gZnVsbHkgc3VwcG9ydGVkXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4Q29uZmlnfSBjb25maWcgLSBzZW5kIGNvbmZpZ1xuICAgKiBAcGFyYW0ge01vbmVyb1R4V2FsbGV0fSBbdHhdIC0gZXhpc3RpbmcgdHJhbnNhY3Rpb24gdG8gaW5pdGlhbGl6ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gY29weURlc3RpbmF0aW9ucyAtIGNvcGllcyBjb25maWcgZGVzdGluYXRpb25zIGlmIHRydWVcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IGlzIHRoZSBpbml0aWFsaXplZCBzZW5kIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGluaXRTZW50VHhXYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPiwgdHgsIGNvcHlEZXN0aW5hdGlvbnMpIHtcbiAgICBpZiAoIXR4KSB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIGxldCByZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpID09PSB0cnVlO1xuICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgdHguc2V0SW5UeFBvb2wocmVsYXkpO1xuICAgIHR4LnNldFJlbGF5KHJlbGF5KTtcbiAgICB0eC5zZXRJc1JlbGF5ZWQocmVsYXkpO1xuICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIHR4LnNldElzTG9ja2VkKHRydWUpO1xuICAgIHR4LnNldFJpbmdTaXplKE1vbmVyb1V0aWxzLlJJTkdfU0laRSk7XG4gICAgbGV0IHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKTtcbiAgICB0cmFuc2Zlci5zZXRUeCh0eCk7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICYmIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSkgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkuc2xpY2UoMCkpOyAvLyB3ZSBrbm93IHNyYyBzdWJhZGRyZXNzIGluZGljZXMgaWZmIGNvbmZpZyBzcGVjaWZpZXMgMVxuICAgIGlmIChjb3B5RGVzdGluYXRpb25zKSB7XG4gICAgICBsZXQgZGVzdENvcGllcyA9IFtdO1xuICAgICAgZm9yIChsZXQgZGVzdCBvZiBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkpIGRlc3RDb3BpZXMucHVzaChkZXN0LmNvcHkoKSk7XG4gICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoZGVzdENvcGllcyk7XG4gICAgfVxuICAgIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgIHR4LnNldFBheW1lbnRJZChjb25maWcuZ2V0UGF5bWVudElkKCkpO1xuICAgIGlmICh0eC5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0VW5sb2NrVGltZSgwbik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZWxheSgpKSB7XG4gICAgICBpZiAodHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgrbmV3IERhdGUoKS5nZXRUaW1lKCkpOyAgLy8gVE9ETyAobW9uZXJvLXdhbGxldC1ycGMpOiBwcm92aWRlIHRpbWVzdGFtcCBvbiByZXNwb25zZTsgdW5jb25maXJtZWQgdGltZXN0YW1wcyB2YXJ5XG4gICAgICBpZiAodHguZ2V0SXNEb3VibGVTcGVuZFNlZW4oKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgdHggc2V0IGZyb20gYSBSUEMgbWFwIGV4Y2x1ZGluZyB0eHMuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjTWFwIC0gbWFwIHRvIGluaXRpYWxpemUgdGhlIHR4IHNldCBmcm9tXG4gICAqIEByZXR1cm4gTW9uZXJvVHhTZXQgLSBpbml0aWFsaXplZCB0eCBzZXRcbiAgICogQHJldHVybiB0aGUgcmVzdWx0aW5nIHR4IHNldFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhTZXQocnBjTWFwKSB7XG4gICAgbGV0IHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KCk7XG4gICAgdHhTZXQuc2V0TXVsdGlzaWdUeEhleChycGNNYXAubXVsdGlzaWdfdHhzZXQpO1xuICAgIHR4U2V0LnNldFVuc2lnbmVkVHhIZXgocnBjTWFwLnVuc2lnbmVkX3R4c2V0KTtcbiAgICB0eFNldC5zZXRTaWduZWRUeEhleChycGNNYXAuc2lnbmVkX3R4c2V0KTtcbiAgICBpZiAodHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0TXVsdGlzaWdUeEhleCh1bmRlZmluZWQpO1xuICAgIGlmICh0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCkubGVuZ3RoID09PSAwKSB0eFNldC5zZXRVbnNpZ25lZFR4SGV4KHVuZGVmaW5lZCk7XG4gICAgaWYgKHR4U2V0LmdldFNpZ25lZFR4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRTaWduZWRUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0U2lnbmVkVHhIZXgodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIE1vbmVyb1R4U2V0IGZyb20gYSBsaXN0IG9mIHJwYyB0eHMuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHhzIC0gcnBjIHR4cyB0byBpbml0aWFsaXplIHRoZSBzZXQgZnJvbVxuICAgKiBAcGFyYW0gdHhzIC0gZXhpc3RpbmcgdHhzIHRvIGZ1cnRoZXIgaW5pdGlhbGl6ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB0aGUgY29udmVydGVkIHR4IHNldFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocnBjVHhzOiBhbnksIHR4cz86IGFueSwgY29uZmlnPzogYW55KSB7XG4gICAgXG4gICAgLy8gYnVpbGQgc2hhcmVkIHR4IHNldFxuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhTZXQocnBjVHhzKTtcblxuICAgIC8vIGdldCBudW1iZXIgb2YgdHhzXG4gICAgbGV0IG51bVR4cyA9IHJwY1R4cy5mZWVfbGlzdCA/IHJwY1R4cy5mZWVfbGlzdC5sZW5ndGggOiBycGNUeHMudHhfaGFzaF9saXN0ID8gcnBjVHhzLnR4X2hhc2hfbGlzdC5sZW5ndGggOiAwO1xuICAgIFxuICAgIC8vIGRvbmUgaWYgcnBjIHJlc3BvbnNlIGNvbnRhaW5zIG5vIHR4c1xuICAgIGlmIChudW1UeHMgPT09IDApIHtcbiAgICAgIGFzc2VydC5lcXVhbCh0eHMsIHVuZGVmaW5lZCk7XG4gICAgICByZXR1cm4gdHhTZXQ7XG4gICAgfVxuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGlmIG5vbmUgZ2l2ZW5cbiAgICBpZiAodHhzKSB0eFNldC5zZXRUeHModHhzKTtcbiAgICBlbHNlIHtcbiAgICAgIHR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UeHM7IGkrKykgdHhzLnB1c2gobmV3IE1vbmVyb1R4V2FsbGV0KCkpO1xuICAgIH1cbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIHR4LnNldFR4U2V0KHR4U2V0KTtcbiAgICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgfVxuICAgIHR4U2V0LnNldFR4cyh0eHMpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGZyb20gcnBjIGxpc3RzXG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1R4cykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUeHNba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhfaGFzaF9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0SGFzaCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2tleV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0S2V5KHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfYmxvYl9saXN0XCIgfHwga2V5ID09PSBcInR4X3Jhd19saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0RnVsbEhleCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X21ldGFkYXRhX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRNZXRhZGF0YSh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0RmVlKEJpZ0ludCh2YWxbaV0pKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldFdlaWdodCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9saXN0XCIpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAodHhzW2ldLmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PSB1bmRlZmluZWQpIHR4c1tpXS5zZXRPdXRnb2luZ1RyYW5zZmVyKG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHhzW2ldKSk7XG4gICAgICAgICAgdHhzW2ldLmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBbW91bnQoQmlnSW50KHZhbFtpXSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibXVsdGlzaWdfdHhzZXRcIiB8fCBrZXkgPT09IFwidW5zaWduZWRfdHhzZXRcIiB8fCBrZXkgPT09IFwic2lnbmVkX3R4c2V0XCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlbnRfa2V5X2ltYWdlc19saXN0XCIpIHtcbiAgICAgICAgbGV0IGlucHV0S2V5SW1hZ2VzTGlzdCA9IHZhbDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dEtleUltYWdlc0xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR4c1tpXS5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgICB0eHNbaV0uc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgICBmb3IgKGxldCBpbnB1dEtleUltYWdlIG9mIGlucHV0S2V5SW1hZ2VzTGlzdFtpXVtcImtleV9pbWFnZXNcIl0pIHtcbiAgICAgICAgICAgIHR4c1tpXS5nZXRJbnB1dHMoKS5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKS5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UoKS5zZXRIZXgoaW5wdXRLZXlJbWFnZSkpLnNldFR4KHR4c1tpXSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNfYnlfZGVzdF9saXN0XCIpIHtcbiAgICAgICAgbGV0IGFtb3VudHNCeURlc3RMaXN0ID0gdmFsO1xuICAgICAgICBsZXQgZGVzdGluYXRpb25JZHggPSAwO1xuICAgICAgICBmb3IgKGxldCB0eElkeCA9IDA7IHR4SWR4IDwgYW1vdW50c0J5RGVzdExpc3QubGVuZ3RoOyB0eElkeCsrKSB7XG4gICAgICAgICAgbGV0IGFtb3VudHNCeURlc3QgPSBhbW91bnRzQnlEZXN0TGlzdFt0eElkeF1bXCJhbW91bnRzXCJdO1xuICAgICAgICAgIGlmICh0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PT0gdW5kZWZpbmVkKSB0eHNbdHhJZHhdLnNldE91dGdvaW5nVHJhbnNmZXIobmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eHNbdHhJZHhdKSk7XG4gICAgICAgICAgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0RGVzdGluYXRpb25zKFtdKTtcbiAgICAgICAgICBmb3IgKGxldCBhbW91bnQgb2YgYW1vdW50c0J5RGVzdCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGggPT09IDEpIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnQpKSk7IC8vIHN3ZWVwaW5nIGNhbiBjcmVhdGUgbXVsdGlwbGUgdHhzIHdpdGggb25lIGFkZHJlc3NcbiAgICAgICAgICAgIGVsc2UgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpW2Rlc3RpbmF0aW9uSWR4KytdLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudCkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHRyYW5zYWN0aW9uIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgcnBjIHR4IHdpdGggYSB0cmFuc2ZlciB0byBhIHR4IHNldCB3aXRoIGEgdHggYW5kIHRyYW5zZmVyLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4IC0gcnBjIHR4IHRvIGJ1aWxkIGZyb21cbiAgICogQHBhcmFtIHR4IC0gZXhpc3RpbmcgdHggdG8gY29udGludWUgaW5pdGlhbGl6aW5nIChvcHRpb25hbClcbiAgICogQHBhcmFtIGlzT3V0Z29pbmcgLSBzcGVjaWZpZXMgaWYgdGhlIHR4IGlzIG91dGdvaW5nIGlmIHRydWUsIGluY29taW5nIGlmIGZhbHNlLCBvciBkZWNvZGVzIGZyb20gdHlwZSBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHRoZSBpbml0aWFsaXplZCB0eCBzZXQgd2l0aCBhIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFRvVHhTZXQocnBjVHgsIHR4LCBpc091dGdvaW5nLCBjb25maWcpIHtcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4U2V0KHJwY1R4KTtcbiAgICB0eFNldC5zZXRUeHMoW01vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHgsIHR4LCBpc091dGdvaW5nLCBjb25maWcpLnNldFR4U2V0KHR4U2V0KV0pO1xuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEJ1aWxkcyBhIE1vbmVyb1R4V2FsbGV0IGZyb20gYSBSUEMgdHguXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHggLSBycGMgdHggdG8gYnVpbGQgZnJvbVxuICAgKiBAcGFyYW0gdHggLSBleGlzdGluZyB0eCB0byBjb250aW51ZSBpbml0aWFsaXppbmcgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gaXNPdXRnb2luZyAtIHNwZWNpZmllcyBpZiB0aGUgdHggaXMgb3V0Z29pbmcgaWYgdHJ1ZSwgaW5jb21pbmcgaWYgZmFsc2UsIG9yIGRlY29kZXMgZnJvbSB0eXBlIGlmIHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSBpcyB0aGUgaW5pdGlhbGl6ZWQgdHhcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4OiBhbnksIHR4PzogYW55LCBpc091dGdvaW5nPzogYW55LCBjb25maWc/OiBhbnkpIHsgIC8vIFRPRE86IGNoYW5nZSBldmVyeXRoaW5nIHRvIHNhZmUgc2V0XG4gICAgICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggdG8gcmV0dXJuXG4gICAgaWYgKCF0eCkgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHN0YXRlIGZyb20gcnBjIHR5cGVcbiAgICBpZiAocnBjVHgudHlwZSAhPT0gdW5kZWZpbmVkKSBpc091dGdvaW5nID0gTW9uZXJvV2FsbGV0UnBjLmRlY29kZVJwY1R5cGUocnBjVHgudHlwZSwgdHgpO1xuICAgIGVsc2UgYXNzZXJ0LmVxdWFsKHR5cGVvZiBpc091dGdvaW5nLCBcImJvb2xlYW5cIiwgXCJNdXN0IGluZGljYXRlIGlmIHR4IGlzIG91dGdvaW5nICh0cnVlKSB4b3IgaW5jb21pbmcgKGZhbHNlKSBzaW5jZSB1bmtub3duXCIpO1xuICAgIFxuICAgIC8vIFRPRE86IHNhZmUgc2V0XG4gICAgLy8gaW5pdGlhbGl6ZSByZW1haW5pbmcgZmllbGRzICBUT0RPOiBzZWVtcyB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGNvbW1vbiBmdW5jdGlvbiB3aXRoIERhZW1vblJwYy5jb252ZXJ0UnBjVHhcbiAgICBsZXQgaGVhZGVyO1xuICAgIGxldCB0cmFuc2ZlcjtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVHgpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVHhba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhpZFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlXCIpIHR4LnNldEZlZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm90ZVwiKSB7IGlmICh2YWwpIHR4LnNldE5vdGUodmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2tleVwiKSB0eC5zZXRLZXkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eXBlXCIpIHsgfSAvLyB0eXBlIGFscmVhZHkgaGFuZGxlZFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X3NpemVcIikgdHguc2V0U2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja190aW1lXCIpIHR4LnNldFVubG9ja1RpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRcIikgdHguc2V0V2VpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9ja2VkXCIpIHR4LnNldElzTG9ja2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfYmxvYlwiKSB0eC5zZXRGdWxsSGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfbWV0YWRhdGFcIikgdHguc2V0TWV0YWRhdGEodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkb3VibGVfc3BlbmRfc2VlblwiKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2Vlbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiIHx8IGtleSA9PT0gXCJoZWlnaHRcIikge1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgICBoZWFkZXIuc2V0SGVpZ2h0KHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0aW1lc3RhbXBcIikge1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgICBoZWFkZXIuc2V0VGltZXN0YW1wKHZhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gdGltZXN0YW1wIG9mIHVuY29uZmlybWVkIHR4IGlzIGN1cnJlbnQgcmVxdWVzdCB0aW1lXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjb25maXJtYXRpb25zXCIpIHR4LnNldE51bUNvbmZpcm1hdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWdnZXN0ZWRfY29uZmlybWF0aW9uc190aHJlc2hvbGRcIikge1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIGlmICghaXNPdXRnb2luZykgdHJhbnNmZXIuc2V0TnVtU3VnZ2VzdGVkQ29uZmlybWF0aW9ucyh2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudFwiKSB7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzXCIpIHt9ICAvLyBpZ25vcmluZywgYW1vdW50cyBzdW0gdG8gYW1vdW50XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSB7XG4gICAgICAgIGlmICghaXNPdXRnb2luZykge1xuICAgICAgICAgIGlmICghdHJhbnNmZXIpIHRyYW5zZmVyID0gbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKS5zZXRUeCh0eCk7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGF5bWVudF9pZFwiKSB7XG4gICAgICAgIGlmIChcIlwiICE9PSB2YWwgJiYgTW9uZXJvVHhXYWxsZXQuREVGQVVMVF9QQVlNRU5UX0lEICE9PSB2YWwpIHR4LnNldFBheW1lbnRJZCh2YWwpOyAgLy8gZGVmYXVsdCBpcyB1bmRlZmluZWRcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGV4XCIpIGFzc2VydChycGNUeC5zdWJhZGRyX2luZGljZXMpOyAgLy8gaGFuZGxlZCBieSBzdWJhZGRyX2luZGljZXNcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGljZXNcIikge1xuICAgICAgICBpZiAoIXRyYW5zZmVyKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgbGV0IHJwY0luZGljZXMgPSB2YWw7XG4gICAgICAgIHRyYW5zZmVyLnNldEFjY291bnRJbmRleChycGNJbmRpY2VzWzBdLm1ham9yKTtcbiAgICAgICAgaWYgKGlzT3V0Z29pbmcpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgICBmb3IgKGxldCBycGNJbmRleCBvZiBycGNJbmRpY2VzKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKHJwY0luZGV4Lm1pbm9yKTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kaWNlcyhzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsKHJwY0luZGljZXMubGVuZ3RoLCAxKTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kZXgocnBjSW5kaWNlc1swXS5taW5vcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkZXN0aW5hdGlvbnNcIiB8fCBrZXkgPT0gXCJyZWNpcGllbnRzXCIpIHtcbiAgICAgICAgYXNzZXJ0KGlzT3V0Z29pbmcpO1xuICAgICAgICBsZXQgZGVzdGluYXRpb25zID0gW107XG4gICAgICAgIGZvciAobGV0IHJwY0Rlc3RpbmF0aW9uIG9mIHZhbCkge1xuICAgICAgICAgIGxldCBkZXN0aW5hdGlvbiA9IG5ldyBNb25lcm9EZXN0aW5hdGlvbigpO1xuICAgICAgICAgIGRlc3RpbmF0aW9ucy5wdXNoKGRlc3RpbmF0aW9uKTtcbiAgICAgICAgICBmb3IgKGxldCBkZXN0aW5hdGlvbktleSBvZiBPYmplY3Qua2V5cyhycGNEZXN0aW5hdGlvbikpIHtcbiAgICAgICAgICAgIGlmIChkZXN0aW5hdGlvbktleSA9PT0gXCJhZGRyZXNzXCIpIGRlc3RpbmF0aW9uLnNldEFkZHJlc3MocnBjRGVzdGluYXRpb25bZGVzdGluYXRpb25LZXldKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKGRlc3RpbmF0aW9uS2V5ID09PSBcImFtb3VudFwiKSBkZXN0aW5hdGlvbi5zZXRBbW91bnQoQmlnSW50KHJwY0Rlc3RpbmF0aW9uW2Rlc3RpbmF0aW9uS2V5XSkpO1xuICAgICAgICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNhY3Rpb24gZGVzdGluYXRpb24gZmllbGQ6IFwiICsgZGVzdGluYXRpb25LZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2Zlcih7dHg6IHR4fSk7XG4gICAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhkZXN0aW5hdGlvbnMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNvdXJjZXNcIikge1xuICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR4LmdldElucHV0cygpID09PSB1bmRlZmluZWQpO1xuICAgICAgICB0eC5zZXRJbnB1dHMoW10pO1xuICAgICAgICBmb3IgKGxldCBycGNTb3VyY2Ugb2YgdmFsKSB7XG4gICAgICAgICAgbGV0IGlucHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCgpLnNldFR4KHR4KTtcbiAgICAgICAgICBpbnB1dC5zZXRBbW91bnQoQmlnSW50KHJwY1NvdXJjZS5hbW91bnQpKTtcbiAgICAgICAgICBpbnB1dC5zZXRJbmRleChycGNTb3VyY2UuZ2xvYmFsX2luZGV4KTtcbiAgICAgICAgICBpZiAocnBjU291cmNlLnB1YmtleSAhPT0gdW5kZWZpbmVkKSBpbnB1dC5zZXRTdGVhbHRoUHVibGljS2V5KHJwY1NvdXJjZS5wdWJrZXkuc3Vic3RyaW5nKDAsIDY0KSk7IC8vIGRlc3Qga2V5IG9mIGRlc3R8fG1hc2tcbiAgICAgICAgICB0eC5nZXRJbnB1dHMoKS5wdXNoKGlucHV0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm11bHRpc2lnX3R4c2V0XCIgJiYgdmFsICE9PSB1bmRlZmluZWQpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlOyB0aGlzIG1ldGhvZCBvbmx5IGJ1aWxkcyBhIHR4IHdhbGxldFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVuc2lnbmVkX3R4c2V0XCIgJiYgdmFsICE9PSB1bmRlZmluZWQpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlOyB0aGlzIG1ldGhvZCBvbmx5IGJ1aWxkcyBhIHR4IHdhbGxldFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9pblwiKSB0eC5zZXRJbnB1dFN1bShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50X291dFwiKSB0eC5zZXRPdXRwdXRTdW0oQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNoYW5nZV9hZGRyZXNzXCIpIHR4LnNldENoYW5nZUFkZHJlc3ModmFsID09PSBcIlwiID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjaGFuZ2VfYW1vdW50XCIpIHR4LnNldENoYW5nZUFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZHVtbXlfb3V0cHV0c1wiKSB0eC5zZXROdW1EdW1teU91dHB1dHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJleHRyYVwiKSB0eC5zZXRFeHRyYUhleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJpbmdfc2l6ZVwiKSB0eC5zZXRSaW5nU2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50X2tleV9pbWFnZXNcIikge1xuICAgICAgICBsZXQgaW5wdXRLZXlJbWFnZXMgPSB2YWwua2V5X2ltYWdlcztcbiAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZSh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdHguc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgZm9yIChsZXQgaW5wdXRLZXlJbWFnZSBvZiBpbnB1dEtleUltYWdlcykge1xuICAgICAgICAgIHR4LmdldElucHV0cygpLnB1c2gobmV3IE1vbmVyb091dHB1dFdhbGxldCgpLnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSgpLnNldEhleChpbnB1dEtleUltYWdlKSkuc2V0VHgodHgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNfYnlfZGVzdFwiKSB7XG4gICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUoaXNPdXRnb2luZyk7XG4gICAgICAgIGxldCBhbW91bnRzQnlEZXN0ID0gdmFsLmFtb3VudHM7XG4gICAgICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoLCBhbW91bnRzQnlEZXN0Lmxlbmd0aCk7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHgpO1xuICAgICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoW10pO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHRyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVtpXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnRzQnlEZXN0W2ldKSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZCB3aXRoIHRyYW5zZmVyOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGxpbmsgYmxvY2sgYW5kIHR4XG4gICAgaWYgKGhlYWRlcikgdHguc2V0QmxvY2sobmV3IE1vbmVyb0Jsb2NrKGhlYWRlcikuc2V0VHhzKFt0eF0pKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIGZpbmFsIGZpZWxkc1xuICAgIGlmICh0cmFuc2Zlcikge1xuICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgaWYgKCF0cmFuc2Zlci5nZXRUeCgpLmdldElzQ29uZmlybWVkKCkpIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICBpZiAoaXNPdXRnb2luZykge1xuICAgICAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgICAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpKSB7XG4gICAgICAgICAgaWYgKHRyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpKSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0RGVzdGluYXRpb25zKHVuZGVmaW5lZCk7IC8vIG92ZXJ3cml0ZSB0byBhdm9pZCByZWNvbmNpbGUgZXJyb3IgVE9ETzogcmVtb3ZlIGFmdGVyID4xOC4zLjEgd2hlbiBhbW91bnRzX2J5X2Rlc3Qgc3VwcG9ydGVkXG4gICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLm1lcmdlKHRyYW5zZmVyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHguc2V0SXNJbmNvbWluZyh0cnVlKTtcbiAgICAgICAgdHguc2V0SW5jb21pbmdUcmFuc2ZlcnMoW3RyYW5zZmVyXSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHJldHVybiBpbml0aWFsaXplZCB0cmFuc2FjdGlvblxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhXaXRoT3V0cHV0KHJwY091dHB1dCkge1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhcbiAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIG91dHB1dFxuICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KHt0eDogdHh9KTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjT3V0cHV0KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY091dHB1dFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhbW91bnRcIikgb3V0cHV0LnNldEFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlbnRcIikgb3V0cHV0LnNldElzU3BlbnQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJrZXlfaW1hZ2VcIikgeyBpZiAoXCJcIiAhPT0gdmFsKSBvdXRwdXQuc2V0S2V5SW1hZ2UobmV3IE1vbmVyb0tleUltYWdlKHZhbCkpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZ2xvYmFsX2luZGV4XCIpIG91dHB1dC5zZXRJbmRleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2hhc2hcIikgdHguc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja2VkXCIpIHR4LnNldElzTG9ja2VkKCF2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZyb3plblwiKSBvdXRwdXQuc2V0SXNGcm96ZW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwdWJrZXlcIikgb3V0cHV0LnNldFN0ZWFsdGhQdWJsaWNLZXkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGV4XCIpIHtcbiAgICAgICAgb3V0cHV0LnNldEFjY291bnRJbmRleCh2YWwubWFqb3IpO1xuICAgICAgICBvdXRwdXQuc2V0U3ViYWRkcmVzc0luZGV4KHZhbC5taW5vcik7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfaGVpZ2h0XCIpIHR4LnNldEJsb2NrKChuZXcgTW9uZXJvQmxvY2soKS5zZXRIZWlnaHQodmFsKSBhcyBNb25lcm9CbG9jaykuc2V0VHhzKFt0eCBhcyBNb25lcm9UeF0pKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHRyYW5zYWN0aW9uIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggd2l0aCBvdXRwdXRcbiAgICB0eC5zZXRPdXRwdXRzKFtvdXRwdXRdKTtcbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Rlc2NyaWJlVHJhbnNmZXIocnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdCkge1xuICAgIGxldCB0eFNldCA9IG5ldyBNb25lcm9UeFNldCgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZGVzY1wiKSB7XG4gICAgICAgIHR4U2V0LnNldFR4cyhbXSk7XG4gICAgICAgIGZvciAobGV0IHR4TWFwIG9mIHZhbCkge1xuICAgICAgICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIodHhNYXAsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgICAgICAgdHguc2V0VHhTZXQodHhTZXQpO1xuICAgICAgICAgIHR4U2V0LmdldFR4cygpLnB1c2godHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3VtbWFyeVwiKSB7IH0gLy8gVE9ETzogc3VwcG9ydCB0eCBzZXQgc3VtbWFyeSBmaWVsZHM/XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBkZXNjZHJpYmUgdHJhbnNmZXIgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogRGVjb2RlcyBhIFwidHlwZVwiIGZyb20gbW9uZXJvLXdhbGxldC1ycGMgdG8gaW5pdGlhbGl6ZSB0eXBlIGFuZCBzdGF0ZVxuICAgKiBmaWVsZHMgaW4gdGhlIGdpdmVuIHRyYW5zYWN0aW9uLlxuICAgKiBcbiAgICogVE9ETzogdGhlc2Ugc2hvdWxkIGJlIHNhZmUgc2V0XG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHlwZSBpcyB0aGUgdHlwZSB0byBkZWNvZGVcbiAgICogQHBhcmFtIHR4IGlzIHRoZSB0cmFuc2FjdGlvbiB0byBkZWNvZGUga25vd24gZmllbGRzIHRvXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIHJwYyB0eXBlIGluZGljYXRlcyBvdXRnb2luZyB4b3IgaW5jb21pbmdcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZGVjb2RlUnBjVHlwZShycGNUeXBlLCB0eCkge1xuICAgIGxldCBpc091dGdvaW5nO1xuICAgIGlmIChycGNUeXBlID09PSBcImluXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSBmYWxzZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJvdXRcIikge1xuICAgICAgaXNPdXRnb2luZyA9IHRydWU7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwicG9vbFwiKSB7XG4gICAgICBpc091dGdvaW5nID0gZmFsc2U7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTsgIC8vIFRPRE86IGJ1dCBjb3VsZCBpdCBiZT9cbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwicGVuZGluZ1wiKSB7XG4gICAgICBpc091dGdvaW5nID0gdHJ1ZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKHRydWUpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJibG9ja1wiKSB7XG4gICAgICBpc091dGdvaW5nID0gZmFsc2U7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KHRydWUpO1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJmYWlsZWRcIikge1xuICAgICAgaXNPdXRnb2luZyA9IHRydWU7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQoZmFsc2UpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZCh0cnVlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlVucmVjb2duaXplZCB0cmFuc2ZlciB0eXBlOiBcIiArIHJwY1R5cGUpO1xuICAgIH1cbiAgICByZXR1cm4gaXNPdXRnb2luZztcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1lcmdlcyBhIHRyYW5zYWN0aW9uIGludG8gYSB1bmlxdWUgc2V0IG9mIHRyYW5zYWN0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHtNb25lcm9UeFdhbGxldH0gdHggLSB0aGUgdHJhbnNhY3Rpb24gdG8gbWVyZ2UgaW50byB0aGUgZXhpc3RpbmcgdHhzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB0eE1hcCAtIG1hcHMgdHggaGFzaGVzIHRvIHR4c1xuICAgKiBAcGFyYW0ge09iamVjdH0gYmxvY2tNYXAgLSBtYXBzIGJsb2NrIGhlaWdodHMgdG8gYmxvY2tzXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIG1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCkge1xuICAgIGFzc2VydCh0eC5nZXRIYXNoKCkgIT09IHVuZGVmaW5lZCk7XG4gICAgXG4gICAgLy8gbWVyZ2UgdHhcbiAgICBsZXQgYVR4ID0gdHhNYXBbdHguZ2V0SGFzaCgpXTtcbiAgICBpZiAoYVR4ID09PSB1bmRlZmluZWQpIHR4TWFwW3R4LmdldEhhc2goKV0gPSB0eDsgLy8gY2FjaGUgbmV3IHR4XG4gICAgZWxzZSBhVHgubWVyZ2UodHgpOyAvLyBtZXJnZSB3aXRoIGV4aXN0aW5nIHR4XG4gICAgXG4gICAgLy8gbWVyZ2UgdHgncyBibG9jayBpZiBjb25maXJtZWRcbiAgICBpZiAodHguZ2V0SGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IGFCbG9jayA9IGJsb2NrTWFwW3R4LmdldEhlaWdodCgpXTtcbiAgICAgIGlmIChhQmxvY2sgPT09IHVuZGVmaW5lZCkgYmxvY2tNYXBbdHguZ2V0SGVpZ2h0KCldID0gdHguZ2V0QmxvY2soKTsgLy8gY2FjaGUgbmV3IGJsb2NrXG4gICAgICBlbHNlIGFCbG9jay5tZXJnZSh0eC5nZXRCbG9jaygpKTsgLy8gbWVyZ2Ugd2l0aCBleGlzdGluZyBibG9ja1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byB0cmFuc2FjdGlvbnMgYnkgdGhlaXIgaGVpZ2h0LlxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb21wYXJlVHhzQnlIZWlnaHQodHgxLCB0eDIpIHtcbiAgICBpZiAodHgxLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQgJiYgdHgyLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHJldHVybiAwOyAvLyBib3RoIHVuY29uZmlybWVkXG4gICAgZWxzZSBpZiAodHgxLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHJldHVybiAxOyAgIC8vIHR4MSBpcyB1bmNvbmZpcm1lZFxuICAgIGVsc2UgaWYgKHR4Mi5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gLTE7ICAvLyB0eDIgaXMgdW5jb25maXJtZWRcbiAgICBsZXQgZGlmZiA9IHR4MS5nZXRIZWlnaHQoKSAtIHR4Mi5nZXRIZWlnaHQoKTtcbiAgICBpZiAoZGlmZiAhPT0gMCkgcmV0dXJuIGRpZmY7XG4gICAgcmV0dXJuIHR4MS5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgxKSAtIHR4Mi5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgyKTsgLy8gdHhzIGFyZSBpbiB0aGUgc2FtZSBibG9jayBzbyByZXRhaW4gdGhlaXIgb3JpZ2luYWwgb3JkZXJcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byB0cmFuc2ZlcnMgYnkgYXNjZW5kaW5nIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcy5cbiAgICovXG4gIHN0YXRpYyBjb21wYXJlSW5jb21pbmdUcmFuc2ZlcnModDEsIHQyKSB7XG4gICAgaWYgKHQxLmdldEFjY291bnRJbmRleCgpIDwgdDIuZ2V0QWNjb3VudEluZGV4KCkpIHJldHVybiAtMTtcbiAgICBlbHNlIGlmICh0MS5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdDIuZ2V0QWNjb3VudEluZGV4KCkpIHJldHVybiB0MS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAtIHQyLmdldFN1YmFkZHJlc3NJbmRleCgpO1xuICAgIHJldHVybiAxO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29tcGFyZXMgdHdvIG91dHB1dHMgYnkgYXNjZW5kaW5nIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcy5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29tcGFyZU91dHB1dHMobzEsIG8yKSB7XG4gICAgXG4gICAgLy8gY29tcGFyZSBieSBoZWlnaHRcbiAgICBsZXQgaGVpZ2h0Q29tcGFyaXNvbiA9IE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQobzEuZ2V0VHgoKSwgbzIuZ2V0VHgoKSk7XG4gICAgaWYgKGhlaWdodENvbXBhcmlzb24gIT09IDApIHJldHVybiBoZWlnaHRDb21wYXJpc29uO1xuICAgIFxuICAgIC8vIGNvbXBhcmUgYnkgYWNjb3VudCBpbmRleCwgc3ViYWRkcmVzcyBpbmRleCwgb3V0cHV0IGluZGV4LCB0aGVuIGtleSBpbWFnZSBoZXhcbiAgICBsZXQgY29tcGFyZSA9IG8xLmdldEFjY291bnRJbmRleCgpIC0gbzIuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgaWYgKGNvbXBhcmUgIT09IDApIHJldHVybiBjb21wYXJlO1xuICAgIGNvbXBhcmUgPSBvMS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAtIG8yLmdldFN1YmFkZHJlc3NJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICBjb21wYXJlID0gbzEuZ2V0SW5kZXgoKSAtIG8yLmdldEluZGV4KCk7XG4gICAgaWYgKGNvbXBhcmUgIT09IDApIHJldHVybiBjb21wYXJlO1xuICAgIHJldHVybiBvMS5nZXRLZXlJbWFnZSgpLmdldEhleCgpLmxvY2FsZUNvbXBhcmUobzIuZ2V0S2V5SW1hZ2UoKS5nZXRIZXgoKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBQb2xscyBtb25lcm8td2FsbGV0LXJwYyB0byBwcm92aWRlIGxpc3RlbmVyIG5vdGlmaWNhdGlvbnMuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIFdhbGxldFBvbGxlciB7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIGlzUG9sbGluZzogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIHdhbGxldDogTW9uZXJvV2FsbGV0UnBjO1xuICBwcm90ZWN0ZWQgbG9vcGVyOiBUYXNrTG9vcGVyO1xuICBwcm90ZWN0ZWQgcHJldkxvY2tlZFR4czogYW55O1xuICBwcm90ZWN0ZWQgcHJldkxvY2tlZFR4c01pbkhlaWdodCA9IDA7XG4gIHByb3RlY3RlZCBwcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zOiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2Q29uZmlybWVkTm90aWZpY2F0aW9uczogYW55O1xuICBwcm90ZWN0ZWQgdGhyZWFkUG9vbDogYW55O1xuICBwcm90ZWN0ZWQgbnVtUG9sbGluZzogYW55O1xuICBwcm90ZWN0ZWQgcHJldkhlaWdodDogYW55O1xuICBwcm90ZWN0ZWQgcHJldkJhbGFuY2VzOiBhbnk7XG4gIHByb3RlY3RlZCBnZW5lcmF0aW9uID0gMDtcbiAgcHJvdGVjdGVkIHNuYXBzaG90R2VuZXJhdGlvbiA9IDA7XG4gIFxuICBjb25zdHJ1Y3Rvcih3YWxsZXQpIHtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgdGhpcy53YWxsZXQgPSB3YWxsZXQ7XG4gICAgdGhpcy5sb29wZXIgPSBuZXcgVGFza0xvb3Blcihhc3luYyBmdW5jdGlvbigpIHsgYXdhaXQgdGhhdC5wb2xsKCk7IH0pO1xuICAgIHRoaXMucHJldkxvY2tlZFR4cyA9IFtdO1xuICAgIHRoaXMucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucyA9IG5ldyBTZXQoKTsgLy8gdHggaGFzaGVzIG9mIHByZXZpb3VzIG5vdGlmaWNhdGlvbnNcbiAgICB0aGlzLnByZXZDb25maXJtZWROb3RpZmljYXRpb25zID0gbmV3IFNldCgpOyAvLyB0eCBoYXNoZXMgb2YgcHJldmlvdXNseSBjb25maXJtZWQgYnV0IG5vdCB5ZXQgdW5sb2NrZWQgbm90aWZpY2F0aW9uc1xuICAgIHRoaXMudGhyZWFkUG9vbCA9IG5ldyBUaHJlYWRQb29sKDEpOyAvLyBzeW5jaHJvbml6ZSBwb2xsc1xuICAgIHRoaXMubnVtUG9sbGluZyA9IDA7XG4gIH1cbiAgXG4gIHJlc2V0KCkge1xuICAgIHRoaXMuZ2VuZXJhdGlvbisrOyAvLyBpbnZhbGlkYXRlIGluLWZsaWdodCBwb2xscyB3aXRob3V0IHdhaXRpbmcgb24gdGhlaXIgY2FsbGJhY2tzXG4gIH1cblxuICBzZXRJc1BvbGxpbmcoaXNQb2xsaW5nKSB7XG4gICAgdGhpcy5pc1BvbGxpbmcgPSBpc1BvbGxpbmc7XG4gICAgaWYgKGlzUG9sbGluZykgdGhpcy5sb29wZXIuc3RhcnQodGhpcy53YWxsZXQuZ2V0U3luY1BlcmlvZEluTXMoKSk7XG4gICAgZWxzZSB0aGlzLmxvb3Blci5zdG9wKCk7XG4gIH1cbiAgXG4gIHNldFBlcmlvZEluTXMocGVyaW9kSW5Ncykge1xuICAgIHRoaXMubG9vcGVyLnNldFBlcmlvZEluTXMocGVyaW9kSW5Ncyk7XG4gIH1cbiAgXG4gIGFzeW5jIHBvbGwoKSB7XG5cbiAgICAvLyBza2lwIGlmIG5leHQgcG9sbCBpcyBxdWV1ZWRcbiAgICBpZiAodGhpcy5udW1Qb2xsaW5nID4gMSkgcmV0dXJuO1xuICAgIHRoaXMubnVtUG9sbGluZysrO1xuICAgIFxuICAgIC8vIHN5bmNocm9uaXplIHBvbGxzXG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIHJldHVybiB0aGlzLnRocmVhZFBvb2wuc3VibWl0KGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgZ2VuZXJhdGlvbiA9IHRoYXQuZ2VuZXJhdGlvbjtcbiAgICAgIHRyeSB7XG4gICAgICAgIFxuICAgICAgICAvLyBza2lwIGlmIHdhbGxldCBpcyBjbG9zZWRcbiAgICAgICAgaWYgKGF3YWl0IHRoYXQud2FsbGV0LmlzQ2xvc2VkKCkgfHwgZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgLy8gcmVzZXQgc25hcHNob3RzIG9ubHkgaW5zaWRlIHRoZSBzZXJpYWxpemVkIHBvbGxcbiAgICAgICAgaWYgKHRoYXQuc25hcHNob3RHZW5lcmF0aW9uICE9PSBnZW5lcmF0aW9uKSB7XG4gICAgICAgICAgdGhhdC5wcmV2SGVpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHRoYXQucHJldkJhbGFuY2VzID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IFtdO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4c01pbkhlaWdodCA9IDA7XG4gICAgICAgICAgdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zLmNsZWFyKCk7XG4gICAgICAgICAgdGhhdC5wcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucy5jbGVhcigpO1xuICAgICAgICAgIHRoYXQuc25hcHNob3RHZW5lcmF0aW9uID0gZ2VuZXJhdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gdGFrZSBpbml0aWFsIHNuYXBzaG90XG4gICAgICAgIGlmICh0aGF0LnByZXZCYWxhbmNlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhhdC5wcmV2SGVpZ2h0ID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0SGVpZ2h0KCk7XG4gICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpKTtcbiAgICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgICAgdGhhdC5wcmV2QmFsYW5jZXMgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRCYWxhbmNlcygpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgaGVpZ2h0IGNoYW5nZXNcbiAgICAgICAgbGV0IGhlaWdodCA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEhlaWdodCgpO1xuICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgIGlmICh0aGF0LnByZXZIZWlnaHQgIT09IGhlaWdodCkge1xuICAgICAgICAgIGZvciAobGV0IGkgPSB0aGF0LnByZXZIZWlnaHQ7IGkgPCBoZWlnaHQ7IGkrKykge1xuICAgICAgICAgICAgYXdhaXQgdGhhdC5vbk5ld0Jsb2NrKGkpO1xuICAgICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGF0LnByZXZIZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGdldCBsb2NrZWQgdHhzIGZvciBjb21wYXJpc29uIHRvIHByZXZpb3VzXG4gICAgICAgIGxldCBtaW5IZWlnaHQgPSBNYXRoLm1heCgwLCBoZWlnaHQgLSA3MCk7IC8vIG9ubHkgbW9uaXRvciByZWNlbnQgdHhzXG4gICAgICAgIGxldCBsb2NrZWRUeHMgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRUeHMobmV3IE1vbmVyb1R4UXVlcnkoKS5zZXRJc0xvY2tlZCh0cnVlKS5zZXRNaW5IZWlnaHQobWluSGVpZ2h0KS5zZXRJbmNsdWRlT3V0cHV0cyh0cnVlKSk7XG4gICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGF0LmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbGxlY3QgaGFzaGVzIG9mIHR4cyBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCBub0xvbmdlckxvY2tlZEhhc2hlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBwcmV2TG9ja2VkVHggb2YgdGhhdC5wcmV2TG9ja2VkVHhzKSB7XG4gICAgICAgICAgaWYgKHRoYXQuZ2V0VHgobG9ja2VkVHhzLCBwcmV2TG9ja2VkVHguZ2V0SGFzaCgpKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBub0xvbmdlckxvY2tlZEhhc2hlcy5wdXNoKHByZXZMb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gc2F2ZSBsb2NrZWQgdHhzIGZvciBuZXh0IGNvbXBhcmlzb25cbiAgICAgICAgbGV0IHByZXZNaW5IZWlnaHQgPSB0aGF0LnByZXZMb2NrZWRUeHNNaW5IZWlnaHQ7XG4gICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGxvY2tlZFR4cztcbiAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzTWluSGVpZ2h0ID0gbWluSGVpZ2h0O1xuICAgICAgICBcbiAgICAgICAgLy8gdXNlIHRoZSBwcmV2aW91cyBzbmFwc2hvdCdzIGJvdW5kIHNvIHRyYWNrZWQgdHhzIGRvIG5vdCBhZ2Ugb3V0IGJldHdlZW4gcG9sbHNcbiAgICAgICAgbGV0IHVubG9ja2VkVHhzID0gbm9Mb25nZXJMb2NrZWRIYXNoZXMubGVuZ3RoID09PSAwID8gW10gOiBhd2FpdCB0aGF0LndhbGxldC5nZXRUeHMobmV3IE1vbmVyb1R4UXVlcnkoKS5zZXRJc0xvY2tlZChmYWxzZSkuc2V0TWluSGVpZ2h0KHByZXZNaW5IZWlnaHQpLnNldEhhc2hlcyhub0xvbmdlckxvY2tlZEhhc2hlcykuc2V0SW5jbHVkZU91dHB1dHModHJ1ZSkpO1xuICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgbmV3IHVuY29uZmlybWVkIGFuZCBjb25maXJtZWQgb3V0cHV0c1xuICAgICAgICBmb3IgKGxldCBsb2NrZWRUeCBvZiBsb2NrZWRUeHMpIHtcbiAgICAgICAgICBsZXQgc2VhcmNoU2V0ID0gbG9ja2VkVHguZ2V0SXNDb25maXJtZWQoKSA/IHRoYXQucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMgOiB0aGF0LnByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnM7XG4gICAgICAgICAgbGV0IHVuYW5ub3VuY2VkID0gIXNlYXJjaFNldC5oYXMobG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICBzZWFyY2hTZXQuYWRkKGxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgaWYgKHVuYW5ub3VuY2VkKSBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHMobG9ja2VkVHgsIGdlbmVyYXRpb24pO1xuICAgICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGF0LmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgbmV3IHVubG9ja2VkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgdW5sb2NrZWRUeCBvZiB1bmxvY2tlZFR4cykge1xuICAgICAgICAgIGxldCBtaXNzZWRDb25maXJtID0gdW5sb2NrZWRUeC5nZXRJc0NvbmZpcm1lZCgpICYmICF0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zLmhhcyh1bmxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zLmRlbGV0ZSh1bmxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgdGhhdC5wcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucy5kZWxldGUodW5sb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIGlmIChtaXNzZWRDb25maXJtKSB7IC8vIGFubm91bmNlIG1pc3NlZCBjb25maXJtIHRyYW5zaXRpb24gaWYgdHggdW5sb2NrZWQgYmV0d2VlbiBwb2xsc1xuICAgICAgICAgICAgbGV0IGNvbmZpcm1lZFR4ID0gdW5sb2NrZWRUeC5jb3B5KCkuc2V0SXNMb2NrZWQodHJ1ZSk7XG4gICAgICAgICAgICBjb25maXJtZWRUeC5zZXRCbG9jayh1bmxvY2tlZFR4LmdldEJsb2NrKCkuY29weSgpLnNldFR4cyhbY29uZmlybWVkVHhdKSk7XG4gICAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHMoY29uZmlybWVkVHgsIGdlbmVyYXRpb24pO1xuICAgICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHModW5sb2NrZWRUeCwgZ2VuZXJhdGlvbik7XG4gICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBiYWxhbmNlIGNoYW5nZXNcbiAgICAgICAgYXdhaXQgdGhhdC5jaGVja0ZvckNoYW5nZWRCYWxhbmNlcyhnZW5lcmF0aW9uKTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIGlmIChnZW5lcmF0aW9uID09PSB0aGF0LmdlbmVyYXRpb24gJiYgdGhhdC5pc1BvbGxpbmcpIHsgLy8gaWdub3JlIGVycm9ycyBmcm9tIHBvbGxzIHN0cmFnZ2xpbmcgYWZ0ZXIgdGhlIHdhbGxldCBpcyBjbG9zZWRcbiAgICAgICAgICBsZXQgbGFiZWwgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRQYXRoKCkgfHwgdGhhdC53YWxsZXQuZ2V0UnBjQ29ubmVjdGlvbigpPy5nZXRVcmkoKTsgLy8gdGhlIHBhdGggaXMgdW5rbm93biB3aGVuIGNvbm5lY3RlZCB0byBhbiBhbHJlYWR5IGxvYWRlZCB3YWxsZXRcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGJhY2tncm91bmQgcG9sbCB3YWxsZXQgJ1wiICsgbGFiZWwgKyBcIic6IFwiICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICB0aGF0Lm51bVBvbGxpbmctLTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VOZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgbm90aWZ5T3V0cHV0cyh0eCwgZ2VuZXJhdGlvbikge1xuICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLmdlbmVyYXRpb24pIHJldHVybjtcbiAgXG4gICAgLy8gbm90aWZ5IHNwZW50IG91dHB1dHMgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBhbGxvdyBzY3JhcGUgb2YgdHggaW5wdXRzIHNvIHByb3ZpZGluZyBvbmUgaW5wdXQgd2l0aCBvdXRnb2luZyBhbW91bnRcbiAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydCh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KClcbiAgICAgICAgICAuc2V0QW1vdW50KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBbW91bnQoKSArIHR4LmdldEZlZSgpKVxuICAgICAgICAgIC5zZXRBY2NvdW50SW5kZXgodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFjY291bnRJbmRleCgpKVxuICAgICAgICAgIC5zZXRTdWJhZGRyZXNzSW5kZXgodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAxID8gdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldFN1YmFkZHJlc3NJbmRpY2VzKClbMF0gOiB1bmRlZmluZWQpIC8vIGluaXRpYWxpemUgaWYgdHJhbnNmZXIgc291cmNlZCBmcm9tIHNpbmdsZSBzdWJhZGRyZXNzXG4gICAgICAgICAgLnNldFR4KHR4KTtcbiAgICAgIHR4LnNldElucHV0cyhbb3V0cHV0XSk7XG4gICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFNwZW50KG91dHB1dCk7XG4gICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSByZWNlaXZlZCBvdXRwdXRzXG4gICAgaWYgKHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR4LmdldE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldE91dHB1dHMoKS5sZW5ndGggPiAwKSB7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogb3V0cHV0cyBvbmx5IHJldHVybmVkIGZvciBjb25maXJtZWQgdHhzXG4gICAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5nZXRPdXRwdXRzKCkpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFJlY2VpdmVkKG91dHB1dCk7XG4gICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgeyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGFsbG93IHNjcmFwZSBvZiB1bmNvbmZpcm1lZCByZWNlaXZlZCBvdXRwdXRzIHNvIHVzaW5nIGluY29taW5nIHRyYW5zZmVyIHZhbHVlc1xuICAgICAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB7XG4gICAgICAgICAgb3V0cHV0cy5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKVxuICAgICAgICAgICAgICAuc2V0QWNjb3VudEluZGV4KHRyYW5zZmVyLmdldEFjY291bnRJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0U3ViYWRkcmVzc0luZGV4KHRyYW5zZmVyLmdldFN1YmFkZHJlc3NJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0QW1vdW50KHRyYW5zZmVyLmdldEFtb3VudCgpKVxuICAgICAgICAgICAgICAuc2V0VHgodHgpKTtcbiAgICAgICAgfVxuICAgICAgICB0eC5zZXRPdXRwdXRzKG91dHB1dHMpO1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIGdldFR4KHR4cywgdHhIYXNoKSB7XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSBpZiAodHhIYXNoID09PSB0eC5nZXRIYXNoKCkpIHJldHVybiB0eDtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY2hlY2tGb3JDaGFuZ2VkQmFsYW5jZXMoZ2VuZXJhdGlvbikge1xuICAgIGxldCBiYWxhbmNlcyA9IGF3YWl0IHRoaXMud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMuZ2VuZXJhdGlvbikgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChiYWxhbmNlc1swXSAhPT0gdGhpcy5wcmV2QmFsYW5jZXNbMF0gfHwgYmFsYW5jZXNbMV0gIT09IHRoaXMucHJldkJhbGFuY2VzWzFdKSB7XG4gICAgICB0aGlzLnByZXZCYWxhbmNlcyA9IGJhbGFuY2VzO1xuICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQoYmFsYW5jZXNbMF0sIGJhbGFuY2VzWzFdKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGFBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFdBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLGNBQUEsR0FBQUwsc0JB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