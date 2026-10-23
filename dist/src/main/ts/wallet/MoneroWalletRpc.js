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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiTW9uZXJvV2FsbGV0UnBjIiwiTW9uZXJvV2FsbGV0IiwiREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwiYWRkcmVzc0NhY2hlIiwic3luY1BlcmlvZEluTXMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRTZXJ2ZXIiLCJvcGVuV2FsbGV0IiwicGF0aE9yQ29uZmlnIiwicGFzc3dvcmQiLCJNb25lcm9XYWxsZXRDb25maWciLCJwYXRoIiwiZ2V0UGF0aCIsImdldFJlZ3Rlc3QiLCJzZW5kSnNvblJlcXVlc3QiLCJmaWxlbmFtZSIsImdldFBhc3N3b3JkIiwiY2xlYXIiLCJfaXNDbG9zZWQiLCJnZXRDb25uZWN0aW9uTWFuYWdlciIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsImNyZWF0ZVdhbGxldCIsImNvbmZpZ05vcm1hbGl6ZWQiLCJnZXRTZWVkIiwiZ2V0UHJpbWFyeUFkZHJlc3MiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFByaXZhdGVTcGVuZEtleSIsImdldE5ldHdvcmtUeXBlIiwiZ2V0QWNjb3VudExvb2thaGVhZCIsImdldFN1YmFkZHJlc3NMb29rYWhlYWQiLCJzZXRQYXNzd29yZCIsInNldFNlcnZlciIsImdldENvbm5lY3Rpb24iLCJjcmVhdGVXYWxsZXRGcm9tU2VlZCIsImNyZWF0ZVdhbGxldEZyb21LZXlzIiwiY3JlYXRlV2FsbGV0UmFuZG9tIiwiZ2V0U2VlZE9mZnNldCIsImdldFJlc3RvcmVIZWlnaHQiLCJnZXRTYXZlQ3VycmVudCIsImdldExhbmd1YWdlIiwic2V0TGFuZ3VhZ2UiLCJERUZBVUxUX0xBTkdVQUdFIiwicGFyYW1zIiwibGFuZ3VhZ2UiLCJlcnIiLCJoYW5kbGVDcmVhdGVXYWxsZXRFcnJvciIsInNlZWQiLCJzZWVkX29mZnNldCIsImVuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWwiLCJnZXRJc011bHRpc2lnIiwicmVzdG9yZV9oZWlnaHQiLCJhdXRvc2F2ZV9jdXJyZW50Iiwic2V0UmVzdG9yZUhlaWdodCIsImFkZHJlc3MiLCJ2aWV3a2V5Iiwic3BlbmRrZXkiLCJuYW1lIiwibWVzc2FnZSIsInRvTG93ZXJDYXNlIiwiaW5jbHVkZXMiLCJNb25lcm9ScGNFcnJvciIsImdldENvZGUiLCJnZXRScGNNZXRob2QiLCJnZXRScGNQYXJhbXMiLCJpc1ZpZXdPbmx5Iiwia2V5X3R5cGUiLCJlIiwidXJpT3JDb25uZWN0aW9uIiwiaXNUcnVzdGVkIiwic3NsT3B0aW9ucyIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiU3NsT3B0aW9ucyIsInNldEFsbG93QW55Q2VydCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsImdldFVyaSIsInVzZXJuYW1lIiwiZ2V0VXNlcm5hbWUiLCJ0cnVzdGVkIiwiaGFzQ2VydGlmaWNhdGVzIiwiZ2V0Q2VydGlmaWNhdGVBdXRob3JpdHlGaWxlIiwiZ2V0QWxsb3dlZEZpbmdlcnByaW50cyIsImxlbmd0aCIsInNzbF9zdXBwb3J0IiwiZ2V0QWxsb3dBbnlDZXJ0Iiwic3NsX3ByaXZhdGVfa2V5X3BhdGgiLCJnZXRQcml2YXRlS2V5UGF0aCIsInNzbF9jZXJ0aWZpY2F0ZV9wYXRoIiwiZ2V0Q2VydGlmaWNhdGVQYXRoIiwic3NsX2NhX2ZpbGUiLCJzc2xfYWxsb3dlZF9maW5nZXJwcmludHMiLCJzc2xfYWxsb3dfYW55X2NlcnQiLCJnZXRQcm94eVVyaSIsInN0YXJ0dXBQcm94eVVyaSIsInByb3h5IiwiaXNTYW1lUHJveHlVcmkiLCJkYWVtb25Db25uZWN0aW9uIiwicmVqZWN0VW5hdXRob3JpemVkIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImdldEJhbGFuY2VzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJhc3NlcnQiLCJlcXVhbCIsImJhbGFuY2UiLCJCaWdJbnQiLCJ1bmxvY2tlZEJhbGFuY2UiLCJhY2NvdW50IiwiZ2V0QWNjb3VudHMiLCJnZXRCYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudF9pbmRleCIsImFkZHJlc3NfaW5kaWNlcyIsInJlc3AiLCJyZXN1bHQiLCJ1bmxvY2tlZF9iYWxhbmNlIiwicGVyX3N1YmFkZHJlc3MiLCJhZGRMaXN0ZW5lciIsInJlZnJlc2hMaXN0ZW5pbmciLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiY2hlY2tSZXNlcnZlUHJvb2YiLCJpbmRleE9mIiwiZ2V0VmVyc2lvbiIsIk1vbmVyb1ZlcnNpb24iLCJ2ZXJzaW9uIiwicmVsZWFzZSIsImdldFNlZWRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJsYW5ndWFnZXMiLCJnZXRBZGRyZXNzIiwic3ViYWRkcmVzc01hcCIsImdldFN1YmFkZHJlc3NlcyIsImdldEFkZHJlc3NJbmRleCIsInN1YmFkZHJlc3MiLCJNb25lcm9TdWJhZGRyZXNzIiwic2V0QWNjb3VudEluZGV4IiwiaW5kZXgiLCJtYWpvciIsInNldEluZGV4IiwibWlub3IiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInN0YW5kYXJkQWRkcmVzcyIsInBheW1lbnRJZCIsImludGVncmF0ZWRBZGRyZXNzU3RyIiwic3RhbmRhcmRfYWRkcmVzcyIsInBheW1lbnRfaWQiLCJpbnRlZ3JhdGVkX2FkZHJlc3MiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImludGVncmF0ZWRBZGRyZXNzIiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJzZXRTdGFuZGFyZEFkZHJlc3MiLCJzZXRQYXltZW50SWQiLCJzZXRJbnRlZ3JhdGVkQWRkcmVzcyIsImdldEhlaWdodCIsImhlaWdodCIsImdldERhZW1vbkhlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsInN5bmMiLCJsaXN0ZW5lck9yU3RhcnRIZWlnaHQiLCJzdGFydEhlaWdodCIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwic3RhcnRfaGVpZ2h0IiwicG9sbCIsIk1vbmVyb1N5bmNSZXN1bHQiLCJibG9ja3NfZmV0Y2hlZCIsInJlY2VpdmVkX21vbmV5Iiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluU2Vjb25kcyIsIk1hdGgiLCJyb3VuZCIsImVuYWJsZSIsInBlcmlvZCIsIndhbGxldFBvbGxlciIsInNldFBlcmlvZEluTXMiLCJnZXRTeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwidHhpZHMiLCJyZXNjYW5TcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwic2tpcEJhbGFuY2VzIiwiYWNjb3VudHMiLCJycGNBY2NvdW50Iiwic3ViYWRkcmVzc19hY2NvdW50cyIsImNvbnZlcnRScGNBY2NvdW50Iiwic2V0U3ViYWRkcmVzc2VzIiwiZ2V0SW5kZXgiLCJwdXNoIiwic2V0QmFsYW5jZSIsInNldFVubG9ja2VkQmFsYW5jZSIsInNldE51bVVuc3BlbnRPdXRwdXRzIiwic2V0TnVtQmxvY2tzVG9VbmxvY2siLCJhbGxfYWNjb3VudHMiLCJycGNTdWJhZGRyZXNzIiwiY29udmVydFJwY1N1YmFkZHJlc3MiLCJnZXRBY2NvdW50SW5kZXgiLCJ0Z3RTdWJhZGRyZXNzIiwiZ2V0TnVtVW5zcGVudE91dHB1dHMiLCJnZXRBY2NvdW50IiwiRXJyb3IiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJNb25lcm9BY2NvdW50IiwicHJpbWFyeUFkZHJlc3MiLCJzdWJhZGRyZXNzSW5kaWNlcyIsImFkZHJlc3NfaW5kZXgiLCJsaXN0aWZ5Iiwic3ViYWRkcmVzc2VzIiwiYWRkcmVzc2VzIiwiZ2V0TnVtQmxvY2tzVG9VbmxvY2siLCJnZXRTdWJhZGRyZXNzIiwiY3JlYXRlU3ViYWRkcmVzcyIsInNldEFkZHJlc3MiLCJzZXRMYWJlbCIsInNldElzVXNlZCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwiZ2V0VHhzQXV4IiwibWF4QXR0ZW1wdHMiLCJxdWVyeU5vcm1hbGl6ZWQiLCJub3JtYWxpemVUeFF1ZXJ5IiwidHJhbnNmZXJRdWVyeSIsImdldFRyYW5zZmVyUXVlcnkiLCJpbnB1dFF1ZXJ5IiwiZ2V0SW5wdXRRdWVyeSIsIm91dHB1dFF1ZXJ5IiwiZ2V0T3V0cHV0UXVlcnkiLCJzZXRUcmFuc2ZlclF1ZXJ5Iiwic2V0SW5wdXRRdWVyeSIsInNldE91dHB1dFF1ZXJ5IiwidHJhbnNmZXJzIiwiZ2V0VHJhbnNmZXJzQXV4IiwiTW9uZXJvVHJhbnNmZXJRdWVyeSIsInNldFR4UXVlcnkiLCJkZWNvbnRleHR1YWxpemUiLCJjb3B5IiwidHhzIiwidHhzU2V0IiwiU2V0IiwidHJhbnNmZXIiLCJnZXRUeCIsImFkZCIsInR4TWFwIiwiYmxvY2tNYXAiLCJ0eCIsIm1lcmdlVHgiLCJnZXRJbmNsdWRlT3V0cHV0cyIsIm91dHB1dFF1ZXJ5QXV4IiwiTW9uZXJvT3V0cHV0UXVlcnkiLCJvdXRwdXRzIiwiZ2V0T3V0cHV0c0F1eCIsIm91dHB1dFR4cyIsIm91dHB1dCIsInR4c1F1ZXJpZWQiLCJtZWV0c0NyaXRlcmlhIiwiZ2V0QmxvY2siLCJzcGxpY2UiLCJnZXRJc0NvbmZpcm1lZCIsImNvbnNvbGUiLCJlcnJvciIsImdldEhhc2hlcyIsInR4c0J5SWQiLCJNYXAiLCJnZXRIYXNoIiwib3JkZXJlZFR4cyIsImhhc2giLCJnZXRUcmFuc2ZlcnMiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiaXNDb250ZXh0dWFsIiwiZ2V0VHhRdWVyeSIsImZpbHRlclRyYW5zZmVycyIsImdldE91dHB1dHMiLCJub3JtYWxpemVPdXRwdXRRdWVyeSIsImZpbHRlck91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwib3V0cHV0c19kYXRhX2hleCIsImltcG9ydE91dHB1dHMiLCJvdXRwdXRzSGV4IiwibnVtX2ltcG9ydGVkIiwiZXhwb3J0S2V5SW1hZ2VzIiwicnBjRXhwb3J0S2V5SW1hZ2VzIiwiaW1wb3J0S2V5SW1hZ2VzIiwia2V5SW1hZ2VzIiwib2Zmc2V0IiwicnBjS2V5SW1hZ2VzIiwibWFwIiwia2V5SW1hZ2UiLCJrZXlfaW1hZ2UiLCJnZXRIZXgiLCJzaWduYXR1cmUiLCJnZXRTaWduYXR1cmUiLCJzaWduZWRfa2V5X2ltYWdlcyIsImltcG9ydFJlc3VsdCIsIk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0Iiwic2V0SGVpZ2h0Iiwic2V0U3BlbnRBbW91bnQiLCJzcGVudCIsInNldFVuc3BlbnRBbW91bnQiLCJ1bnNwZW50IiwiZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQiLCJnZXRLZXlJbWFnZXMiLCJmcmVlemVPdXRwdXQiLCJ0aGF3T3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJmcm96ZW4iLCJnZXREZWZhdWx0RmVlUHJpb3JpdHkiLCJwcmlvcml0eSIsImNyZWF0ZVR4cyIsIm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyIsImdldENhblNwbGl0Iiwic2V0Q2FuU3BsaXQiLCJnZXRSZWxheSIsImlzTXVsdGlzaWciLCJnZXRTdWJhZGRyZXNzSW5kaWNlcyIsInNsaWNlIiwiZGVzdGluYXRpb25zIiwiZGVzdGluYXRpb24iLCJnZXREZXN0aW5hdGlvbnMiLCJnZXRBbW91bnQiLCJhbW91bnQiLCJnZXRTdWJ0cmFjdEZlZUZyb20iLCJzdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzIiwic3ViYWRkcl9pbmRpY2VzIiwiZ2V0UGF5bWVudElkIiwiZG9fbm90X3JlbGF5IiwiZ2V0UHJpb3JpdHkiLCJnZXRfdHhfaGV4IiwiZ2V0X3R4X21ldGFkYXRhIiwiZ2V0X3R4X2tleXMiLCJnZXRfdHhfa2V5IiwibnVtVHhzIiwiZmVlX2xpc3QiLCJmZWUiLCJjb3B5RGVzdGluYXRpb25zIiwiaSIsIk1vbmVyb1R4V2FsbGV0IiwiaW5pdFNlbnRUeFdhbGxldCIsImdldE91dGdvaW5nVHJhbnNmZXIiLCJzZXRTdWJhZGRyZXNzSW5kaWNlcyIsImNvbnZlcnRScGNTZW50VHhzVG9UeFNldCIsImNvbnZlcnRScGNUeFRvVHhTZXQiLCJzd2VlcE91dHB1dCIsIm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnIiwiZ2V0S2V5SW1hZ2UiLCJzZXRBbW91bnQiLCJzd2VlcFVubG9ja2VkIiwibm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyIsImluZGljZXMiLCJrZXlzIiwic2V0U3dlZXBFYWNoU3ViYWRkcmVzcyIsImdldFN3ZWVwRWFjaFN1YmFkZHJlc3MiLCJycGNTd2VlcEFjY291bnQiLCJzd2VlcER1c3QiLCJyZWxheSIsInR4U2V0Iiwic2V0SXNSZWxheWVkIiwic2V0SW5UeFBvb2wiLCJnZXRJc1JlbGF5ZWQiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiQXJyYXkiLCJpc0FycmF5IiwidHhPck1ldGFkYXRhIiwibWV0YWRhdGEiLCJnZXRNZXRhZGF0YSIsImhleCIsInR4X2hhc2giLCJkZXNjcmliZVR4U2V0IiwidW5zaWduZWRfdHhzZXQiLCJnZXRVbnNpZ25lZFR4SGV4IiwibXVsdGlzaWdfdHhzZXQiLCJnZXRNdWx0aXNpZ1R4SGV4IiwiY29udmVydFJwY0Rlc2NyaWJlVHJhbnNmZXIiLCJzaWduVHhzIiwidW5zaWduZWRUeEhleCIsImV4cG9ydF9yYXciLCJzdWJtaXRUeHMiLCJzaWduZWRUeEhleCIsInR4X2RhdGFfaGV4IiwidHhfaGFzaF9saXN0Iiwic2lnbk1lc3NhZ2UiLCJzaWduYXR1cmVUeXBlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJTSUdOX1dJVEhfU1BFTkRfS0VZIiwiZGF0YSIsInNpZ25hdHVyZV90eXBlIiwidmVyaWZ5TWVzc2FnZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJnb29kIiwiaXNHb29kIiwiaXNPbGQiLCJvbGQiLCJTSUdOX1dJVEhfVklFV19LRVkiLCJnZXRUeEtleSIsInR4SGFzaCIsInR4aWQiLCJ0eF9rZXkiLCJjaGVja1R4S2V5IiwidHhLZXkiLCJjaGVjayIsIk1vbmVyb0NoZWNrVHgiLCJzZXRJc0dvb2QiLCJzZXROdW1Db25maXJtYXRpb25zIiwiY29uZmlybWF0aW9ucyIsImluX3Bvb2wiLCJzZXRSZWNlaXZlZEFtb3VudCIsInJlY2VpdmVkIiwiZ2V0VHhQcm9vZiIsImNoZWNrVHhQcm9vZiIsImdldFNwZW5kUHJvb2YiLCJjaGVja1NwZW5kUHJvb2YiLCJnZXRSZXNlcnZlUHJvb2ZXYWxsZXQiLCJnZXRSZXNlcnZlUHJvb2ZBY2NvdW50IiwiTW9uZXJvQ2hlY2tSZXNlcnZlIiwic2V0VW5jb25maXJtZWRTcGVudEFtb3VudCIsInNldFRvdGFsQW1vdW50IiwidG90YWwiLCJnZXRUeE5vdGVzIiwibm90ZXMiLCJzZXRUeE5vdGVzIiwibm90ZSIsImlzSW5pdGlhbGl6ZWQiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJlbnRyaWVzIiwicnBjRW50cnkiLCJNb25lcm9BZGRyZXNzQm9va0VudHJ5Iiwic2V0RGVzY3JpcHRpb24iLCJkZXNjcmlwdGlvbiIsImFkZEFkZHJlc3NCb29rRW50cnkiLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsInNldF9hZGRyZXNzIiwic2V0X2Rlc2NyaXB0aW9uIiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsInRhZ3MiLCJhY2NvdW50X3RhZ3MiLCJycGNBY2NvdW50VGFnIiwiTW9uZXJvQWNjb3VudFRhZyIsInNldEFjY291bnRUYWdMYWJlbCIsImdldFBheW1lbnRVcmkiLCJyZWNpcGllbnRfbmFtZSIsImdldFJlY2lwaWVudE5hbWUiLCJ0eF9kZXNjcmlwdGlvbiIsImdldE5vdGUiLCJ1cmkiLCJwYXJzZVBheW1lbnRVcmkiLCJNb25lcm9UeENvbmZpZyIsInNldFJlY2lwaWVudE5hbWUiLCJzZXROb3RlIiwiZ2V0QXR0cmlidXRlIiwidmFsdWUiLCJzZXRBdHRyaWJ1dGUiLCJ2YWwiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsInRocmVhZHNfY291bnQiLCJkb19iYWNrZ3JvdW5kX21pbmluZyIsImlnbm9yZV9iYXR0ZXJ5Iiwic3RvcE1pbmluZyIsImlzTXVsdGlzaWdJbXBvcnROZWVkZWQiLCJtdWx0aXNpZ19pbXBvcnRfbmVlZGVkIiwiZ2V0TXVsdGlzaWdJbmZvIiwiaW5mbyIsIk1vbmVyb011bHRpc2lnSW5mbyIsInNldElzTXVsdGlzaWciLCJtdWx0aXNpZyIsInNldElzUmVhZHkiLCJyZWFkeSIsInNldFRocmVzaG9sZCIsInRocmVzaG9sZCIsInNldE51bVBhcnRpY2lwYW50cyIsInByZXBhcmVNdWx0aXNpZyIsIm11bHRpc2lnX2luZm8iLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJtc1Jlc3VsdCIsIk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsInNldE11bHRpc2lnSGV4IiwiZ2V0TXVsdGlzaWdIZXgiLCJleHBvcnRNdWx0aXNpZ0hleCIsImltcG9ydE11bHRpc2lnSGV4IiwicmVmcmVzaEFmdGVySW1wb3J0IiwicmVmcmVzaF9hZnRlcl9pbXBvcnQiLCJuX291dHB1dHMiLCJzaWduTXVsdGlzaWdUeEhleCIsIm11bHRpc2lnVHhIZXgiLCJzaWduUmVzdWx0IiwiTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0Iiwic2V0U2lnbmVkTXVsdGlzaWdUeEhleCIsInNldFR4SGFzaGVzIiwic3VibWl0TXVsdGlzaWdUeEhleCIsInNpZ25lZE11bHRpc2lnVHhIZXgiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJvbGRfcGFzc3dvcmQiLCJuZXdfcGFzc3dvcmQiLCJzYXZlIiwiY2xvc2UiLCJpc0Nsb3NlZCIsInN0b3AiLCJnZXRJbmNvbWluZ1RyYW5zZmVycyIsImdldE91dGdvaW5nVHJhbnNmZXJzIiwiY3JlYXRlVHgiLCJyZWxheVR4IiwiZ2V0VHhOb3RlIiwic2V0VHhOb3RlIiwiY29ubmVjdFRvV2FsbGV0UnBjIiwidXJpT3JDb25maWciLCJub3JtYWxpemVDb25maWciLCJjbWQiLCJzdGFydFdhbGxldFJwY1Byb2Nlc3MiLCJjaGlsZF9wcm9jZXNzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aGVuIiwiY2hpbGRQcm9jZXNzIiwic3Bhd24iLCJlbnYiLCJMQU5HIiwic3Rkb3V0Iiwic2V0RW5jb2RpbmciLCJzdGRlcnIiLCJ0aGF0IiwicmVqZWN0Iiwib24iLCJsaW5lIiwidG9TdHJpbmciLCJMaWJyYXJ5VXRpbHMiLCJsb2ciLCJ1cmlMaW5lQ29udGFpbnMiLCJ1cmlMaW5lQ29udGFpbnNJZHgiLCJob3N0Iiwic3Vic3RyaW5nIiwibGFzdEluZGV4T2YiLCJ1bmZvcm1hdHRlZExpbmUiLCJyZXBsYWNlIiwidHJpbSIsInBvcnQiLCJzc2xJZHgiLCJzc2xFbmFibGVkIiwidXNlclBhc3NJZHgiLCJ1c2VyUGFzcyIsInptcVVyaUlkeCIsInptcVVyaSIsInByb3h5VXJpSWR4IiwicHJveHlVcmkiLCJ3YWxsZXQiLCJpc1Jlc29sdmVkIiwiZ2V0TG9nTGV2ZWwiLCJjb2RlIiwib3JpZ2luIiwibGlzdGVuZXJHZW5lcmF0aW9uIiwicmVzZXQiLCJnZXRBY2NvdW50SW5kaWNlcyIsInR4UXVlcnkiLCJjYW5CZUNvbmZpcm1lZCIsImdldEluVHhQb29sIiwiZ2V0SXNGYWlsZWQiLCJjYW5CZUluVHhQb29sIiwiZ2V0TWF4SGVpZ2h0IiwiZ2V0SXNMb2NrZWQiLCJjYW5CZUluY29taW5nIiwiZ2V0SXNJbmNvbWluZyIsImdldElzT3V0Z29pbmciLCJnZXRIYXNEZXN0aW5hdGlvbnMiLCJjYW5CZU91dGdvaW5nIiwiaW4iLCJvdXQiLCJwb29sIiwicGVuZGluZyIsImZhaWxlZCIsImdldE1pbkhlaWdodCIsIm1pbl9oZWlnaHQiLCJtYXhfaGVpZ2h0IiwiZmlsdGVyX2J5X2hlaWdodCIsImdldFN1YmFkZHJlc3NJbmRleCIsInNpemUiLCJmcm9tIiwicnBjVHgiLCJjb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIiLCJnZXRPdXRnb2luZ0Ftb3VudCIsIm91dGdvaW5nVHJhbnNmZXIiLCJ0cmFuc2ZlclRvdGFsIiwidmFsdWVzIiwic29ydCIsImNvbXBhcmVUeHNCeUhlaWdodCIsInNldElzSW5jb21pbmciLCJzZXRJc091dGdvaW5nIiwiY29tcGFyZUluY29taW5nVHJhbnNmZXJzIiwidHJhbnNmZXJfdHlwZSIsImdldElzU3BlbnQiLCJ2ZXJib3NlIiwicnBjT3V0cHV0IiwiY29udmVydFJwY1R4V2l0aE91dHB1dCIsImNvbXBhcmVPdXRwdXRzIiwicnBjSW1hZ2UiLCJNb25lcm9LZXlJbWFnZSIsIk1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0Iiwic2V0T2Zmc2V0Iiwic2V0S2V5SW1hZ2VzIiwiYmVsb3dfYW1vdW50IiwiZ2V0QmVsb3dBbW91bnQiLCJzZXRJc0xvY2tlZCIsInNldElzQ29uZmlybWVkIiwic2V0UmVsYXkiLCJzZXRJc01pbmVyVHgiLCJzZXRJc0ZhaWxlZCIsIk1vbmVyb0Rlc3RpbmF0aW9uIiwic2V0RGVzdGluYXRpb25zIiwic2V0T3V0Z29pbmdUcmFuc2ZlciIsImdldFVubG9ja1RpbWUiLCJzZXRVbmxvY2tUaW1lIiwiZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJzZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsIkRhdGUiLCJnZXRUaW1lIiwiZ2V0SXNEb3VibGVTcGVuZFNlZW4iLCJzZXRJc0RvdWJsZVNwZW5kU2VlbiIsImxpc3RlbmVycyIsIldhbGxldFBvbGxlciIsInNldElzUG9sbGluZyIsImlzUG9sbGluZyIsInNlcnZlciIsInByb3h5VG9Xb3JrZXIiLCJzZXRQcmltYXJ5QWRkcmVzcyIsInNldFRhZyIsImdldFRhZyIsInNldFJpbmdTaXplIiwiTW9uZXJvVXRpbHMiLCJSSU5HX1NJWkUiLCJNb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwic2V0VHgiLCJkZXN0Q29waWVzIiwiZGVzdCIsImNvbnZlcnRScGNUeFNldCIsInJwY01hcCIsIk1vbmVyb1R4U2V0Iiwic2V0TXVsdGlzaWdUeEhleCIsInNldFVuc2lnbmVkVHhIZXgiLCJzZXRTaWduZWRUeEhleCIsInNpZ25lZF90eHNldCIsImdldFNpZ25lZFR4SGV4IiwicnBjVHhzIiwic2V0VHhzIiwic2V0VHhTZXQiLCJzZXRIYXNoIiwic2V0S2V5Iiwic2V0RnVsbEhleCIsInNldE1ldGFkYXRhIiwic2V0RmVlIiwic2V0V2VpZ2h0IiwiaW5wdXRLZXlJbWFnZXNMaXN0IiwiYXNzZXJ0VHJ1ZSIsImdldElucHV0cyIsInNldElucHV0cyIsImlucHV0S2V5SW1hZ2UiLCJNb25lcm9PdXRwdXRXYWxsZXQiLCJzZXRLZXlJbWFnZSIsInNldEhleCIsImFtb3VudHNCeURlc3RMaXN0IiwiZGVzdGluYXRpb25JZHgiLCJ0eElkeCIsImFtb3VudHNCeURlc3QiLCJpc091dGdvaW5nIiwidHlwZSIsImRlY29kZVJwY1R5cGUiLCJoZWFkZXIiLCJzZXRTaXplIiwiTW9uZXJvQmxvY2tIZWFkZXIiLCJzZXRUaW1lc3RhbXAiLCJNb25lcm9JbmNvbWluZ1RyYW5zZmVyIiwic2V0TnVtU3VnZ2VzdGVkQ29uZmlybWF0aW9ucyIsIkRFRkFVTFRfUEFZTUVOVF9JRCIsInJwY0luZGljZXMiLCJycGNJbmRleCIsInNldFN1YmFkZHJlc3NJbmRleCIsInJwY0Rlc3RpbmF0aW9uIiwiZGVzdGluYXRpb25LZXkiLCJycGNTb3VyY2UiLCJpbnB1dCIsImdsb2JhbF9pbmRleCIsInB1YmtleSIsInNldFN0ZWFsdGhQdWJsaWNLZXkiLCJzZXRJbnB1dFN1bSIsInNldE91dHB1dFN1bSIsInNldENoYW5nZUFkZHJlc3MiLCJzZXRDaGFuZ2VBbW91bnQiLCJzZXROdW1EdW1teU91dHB1dHMiLCJzZXRFeHRyYUhleCIsImlucHV0S2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsImFtb3VudHMiLCJzZXRCbG9jayIsIk1vbmVyb0Jsb2NrIiwibWVyZ2UiLCJzZXRJbmNvbWluZ1RyYW5zZmVycyIsInNldElzU3BlbnQiLCJzZXRJc0Zyb3plbiIsInNldE91dHB1dHMiLCJycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0IiwicnBjVHlwZSIsImFUeCIsImFCbG9jayIsInR4MSIsInR4MiIsImRpZmYiLCJ0MSIsInQyIiwibzEiLCJvMiIsImhlaWdodENvbXBhcmlzb24iLCJjb21wYXJlIiwibG9jYWxlQ29tcGFyZSIsImV4cG9ydHMiLCJwcmV2TG9ja2VkVHhzTWluSGVpZ2h0IiwiZ2VuZXJhdGlvbiIsInNuYXBzaG90R2VuZXJhdGlvbiIsImxvb3BlciIsIlRhc2tMb29wZXIiLCJwcmV2TG9ja2VkVHhzIiwicHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucyIsInByZXZDb25maXJtZWROb3RpZmljYXRpb25zIiwidGhyZWFkUG9vbCIsIlRocmVhZFBvb2wiLCJudW1Qb2xsaW5nIiwic3RhcnQiLCJwZXJpb2RJbk1zIiwic3VibWl0IiwicHJldkhlaWdodCIsInByZXZCYWxhbmNlcyIsIk1vbmVyb1R4UXVlcnkiLCJvbk5ld0Jsb2NrIiwibWluSGVpZ2h0IiwibWF4IiwibG9ja2VkVHhzIiwic2V0TWluSGVpZ2h0Iiwic2V0SW5jbHVkZU91dHB1dHMiLCJub0xvbmdlckxvY2tlZEhhc2hlcyIsInByZXZMb2NrZWRUeCIsInByZXZNaW5IZWlnaHQiLCJ1bmxvY2tlZFR4cyIsInNldEhhc2hlcyIsImxvY2tlZFR4Iiwic2VhcmNoU2V0IiwidW5hbm5vdW5jZWQiLCJub3RpZnlPdXRwdXRzIiwidW5sb2NrZWRUeCIsIm1pc3NlZENvbmZpcm0iLCJkZWxldGUiLCJjb25maXJtZWRUeCIsImNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzIiwiYW5ub3VuY2VOZXdCbG9jayIsImdldEZlZSIsImFubm91bmNlT3V0cHV0U3BlbnQiLCJhbm5vdW5jZU91dHB1dFJlY2VpdmVkIiwiYmFsYW5jZXMiLCJhbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRScGMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4uL2NvbW1vbi9UYXNrTG9vcGVyXCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50XCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudFRhZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50VGFnXCI7XG5pbXBvcnQgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BZGRyZXNzQm9va0VudHJ5XCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrSGVhZGVyIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tIZWFkZXJcIjtcbmltcG9ydCBNb25lcm9DaGVja1Jlc2VydmUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tSZXNlcnZlXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvRGVzdGluYXRpb24gZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGVzdGluYXRpb25cIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbmNvbWluZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnU2lnblJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb091dGdvaW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0Z29pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvUnBjRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNFcnJvclwiO1xuaW1wb3J0IE1vbmVyb1N1YmFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHggZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9UeFwiO1xuaW1wb3J0IE1vbmVyb1R4Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvVHhQcmlvcml0eSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFByaW9yaXR5XCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuLi9jb21tb24vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdFwiO1xuaW1wb3J0IFRocmVhZFBvb2wgZnJvbSBcIi4uL2NvbW1vbi9UaHJlYWRQb29sXCI7XG5pbXBvcnQgU3NsT3B0aW9ucyBmcm9tIFwiLi4vY29tbW9uL1NzbE9wdGlvbnNcIjtcbmltcG9ydCB7IENoaWxkUHJvY2VzcyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5cbi8qKlxuICogQ29weXJpZ2h0IChjKSB3b29kc2VyXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9XYWxsZXQgYXMgYSBjbGllbnQgb2YgbW9uZXJvLXdhbGxldC1ycGMuXG4gKiBcbiAqIEBpbXBsZW1lbnRzIHtNb25lcm9XYWxsZXR9XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1dhbGxldFJwYyBleHRlbmRzIE1vbmVyb1dhbGxldCB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgPSAyMDAwMDsgLy8gZGVmYXVsdCBwZXJpb2QgYmV0d2VlbiBzeW5jcyBpbiBtcyAoZGVmaW5lZCBieSBERUZBVUxUX0FVVE9fUkVGUkVTSF9QRVJJT0QgaW4gd2FsbGV0X3JwY19zZXJ2ZXIuY3BwKVxuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz47XG4gIHByb3RlY3RlZCBhZGRyZXNzQ2FjaGU6IGFueTtcbiAgcHJvdGVjdGVkIHN5bmNQZXJpb2RJbk1zOiBudW1iZXI7XG4gIHByb3RlY3RlZCBsaXN0ZW5lcnM6IE1vbmVyb1dhbGxldExpc3RlbmVyW107XG4gIHByb3RlY3RlZCBwcm9jZXNzOiBhbnk7XG4gIHByb3RlY3RlZCBwYXRoOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBkYWVtb25Db25uZWN0aW9uOiBNb25lcm9ScGNDb25uZWN0aW9uO1xuICBwcm90ZWN0ZWQgd2FsbGV0UG9sbGVyOiBXYWxsZXRQb2xsZXI7XG4gIHByb3RlY3RlZCBzdGFydHVwUHJveHlVcmk6IHN0cmluZztcbiAgXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTsgLy8gYXZvaWQgdW5lY2Vzc2FyeSByZXF1ZXN0cyBmb3IgYWRkcmVzc2VzXG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IE1vbmVyb1dhbGxldFJwYy5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUlBDIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaW50ZXJuYWwgcHJvY2VzcyBydW5uaW5nIG1vbmVyby13YWxsZXQtcnBjLlxuICAgKiBcbiAgICogQHJldHVybiB7Q2hpbGRQcm9jZXNzfSB0aGUgcHJvY2VzcyBydW5uaW5nIG1vbmVyby13YWxsZXQtcnBjLCB1bmRlZmluZWQgaWYgbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1xuICAgKi9cbiAgZ2V0UHJvY2VzcygpOiBDaGlsZFByb2Nlc3Mge1xuICAgIHJldHVybiB0aGlzLnByb2Nlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9wIHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMsIGlmIGFwcGxpY2FibGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZvcmNlIHNwZWNpZmllcyBpZiB0aGUgcHJvY2VzcyBzaG91bGQgYmUgZGVzdHJveWVkIGZvcmNpYmx5IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD59IHRoZSBleGl0IGNvZGUgZnJvbSBzdG9wcGluZyB0aGUgcHJvY2Vzc1xuICAgKi9cbiAgYXN5bmMgc3RvcFByb2Nlc3MoZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPiAge1xuICAgIGlmICh0aGlzLnByb2Nlc3MgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0UnBjIGluc3RhbmNlIG5vdCBjcmVhdGVkIGZyb20gbmV3IHByb2Nlc3NcIik7XG4gICAgbGV0IGxpc3RlbmVyc0NvcHkgPSBHZW5VdGlscy5jb3B5QXJyYXkodGhpcy5nZXRMaXN0ZW5lcnMoKSk7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgbGlzdGVuZXJzQ29weSkgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgcmV0dXJuIEdlblV0aWxzLmtpbGxQcm9jZXNzKHRoaXMucHJvY2VzcywgZm9yY2UgPyBcIlNJR0tJTExcIiA6IHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIFJQQyBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZH0gdGhlIHdhbGxldCdzIHJwYyBjb25uZWN0aW9uXG4gICAqL1xuICBnZXRScGNDb25uZWN0aW9uKCk6IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPk9wZW4gYW4gZXhpc3Rpbmcgd2FsbGV0IG9uIHRoZSBtb25lcm8td2FsbGV0LXJwYyBzZXJ2ZXIuPC9wPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZTo8cD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiBsZXQgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldFJwYyhcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODRcIiwgXCJycGNfdXNlclwiLCBcImFiYzEyM1wiKTs8YnI+XG4gICAqIGF3YWl0IHdhbGxldC5vcGVuV2FsbGV0KFwibXl3YWxsZXQxXCIsIFwic3VwZXJzZWNyZXRwYXNzd29yZFwiKTs8YnI+XG4gICAqIDxicj5cbiAgICogYXdhaXQgd2FsbGV0Lm9wZW5XYWxsZXQoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwibXl3YWxsZXQyXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwic3VwZXJzZWNyZXRwYXNzd29yZFwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHNlcnZlcjogXCJodHRwOi8vbG9jYWhvc3Q6MzgwODFcIiwgLy8gb3Igb2JqZWN0IHdpdGggdXJpLCB1c2VybmFtZSwgcGFzc3dvcmQsIGV0YyA8YnI+XG4gICAqICZuYnNwOyZuYnNwOyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlPGJyPlxuICAgKiB9KTs8YnI+XG4gICAqIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfE1vbmVyb1dhbGxldENvbmZpZ30gcGF0aE9yQ29uZmlnICAtIHRoZSB3YWxsZXQncyBuYW1lIG9yIGNvbmZpZ3VyYXRpb24gdG8gb3BlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aE9yQ29uZmlnLnBhdGggLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoT3JDb25maWcucGFzc3dvcmQgLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ3xQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fSBwYXRoT3JDb25maWcuc2VydmVyIC0gdXJpIG9yIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb2YgYSBkYWVtb24gdG8gdXNlIChvcHRpb25hbCwgbW9uZXJvLXdhbGxldC1ycGMgdXN1YWxseSBzdGFydGVkIHdpdGggZGFlbW9uIGNvbmZpZylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtwYXNzd29yZF0gdGhlIHdhbGxldCdzIHBhc3N3b3JkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvV2FsbGV0UnBjPn0gdGhpcyB3YWxsZXQgY2xpZW50XG4gICAqL1xuICBhc3luYyBvcGVuV2FsbGV0KHBhdGhPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+LCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh0eXBlb2YgcGF0aE9yQ29uZmlnID09PSBcInN0cmluZ1wiID8ge3BhdGg6IHBhdGhPckNvbmZpZywgcGFzc3dvcmQ6IHBhc3N3b3JkID8gcGFzc3dvcmQgOiBcIlwifSA6IHBhdGhPckNvbmZpZyk7XG4gICAgLy8gVE9ETzogZW5zdXJlIG90aGVyIGZpZWxkcyB1bmluaXRpYWxpemVkP1xuICAgIFxuICAgIC8vIG9wZW4gd2FsbGV0IG9uIHJwYyBzZXJ2ZXJcbiAgICBpZiAoIWNvbmZpZy5nZXRQYXRoKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBuYW1lIG9mIHdhbGxldCB0byBvcGVuXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVndGVzdCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHJlZ3Rlc3QgbW9kZSB3aGVuIG9wZW5pbmcgUlBDIHdhbGxldFwiKVxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm9wZW5fd2FsbGV0XCIsIHtmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSwgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpfSk7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgdGhpcy5faXNDbG9zZWQgPSBmYWxzZTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXIgb3Igc2VydmVyXG4gICAgaWYgKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpICE9IG51bGwpIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgb3BlbmVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGF3YWl0IHRoaXMuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIH0gZWxzZSBpZiAoY29uZmlnLmdldFNlcnZlcigpICE9IG51bGwpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2V0RGFlbW9uQ29ubmVjdGlvbihjb25maWcuZ2V0U2VydmVyKCkpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPkNyZWF0ZSBhbmQgb3BlbiBhIHdhbGxldCBvbiB0aGUgbW9uZXJvLXdhbGxldC1ycGMgc2VydmVyLjxwPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZTo8cD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiAmc29sOyZzb2w7IGNvbnN0cnVjdCBjbGllbnQgdG8gbW9uZXJvLXdhbGxldC1ycGM8YnI+XG4gICAqIGxldCB3YWxsZXRScGMgPSBuZXcgTW9uZXJvV2FsbGV0UnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4NFwiLCBcInJwY191c2VyXCIsIFwiYWJjMTIzXCIpOzxicj48YnI+XG4gICAqIFxuICAgKiAmc29sOyZzb2w7IGNyZWF0ZSBhbmQgb3BlbiB3YWxsZXQgb24gbW9uZXJvLXdhbGxldC1ycGM8YnI+XG4gICAqIGF3YWl0IHdhbGxldFJwYy5jcmVhdGVXYWxsZXQoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwibXl3YWxsZXRcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJhYmMxMjNcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBzZWVkOiBcImNvZXhpc3QgaWdsb28gcGFtcGhsZXQgbGFnb29uLi4uXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcmVzdG9yZUhlaWdodDogMTU0MzIxOGw8YnI+XG4gICAqIH0pO1xuICAgKiAgPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz59IGNvbmZpZyAtIE1vbmVyb1dhbGxldENvbmZpZyBvciBlcXVpdmFsZW50IEpTIG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXRoXSAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCBpbi1tZW1vcnkgd2FsbGV0IGlmIG5vdCBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGFzc3dvcmRdIC0gcGFzc3dvcmQgb2YgdGhlIHdhbGxldCB0byBjcmVhdGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZF0gLSBzZWVkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgcmFuZG9tIHdhbGxldCBjcmVhdGVkIGlmIG5laXRoZXIgc2VlZCBub3Iga2V5cyBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZE9mZnNldF0gLSB0aGUgb2Zmc2V0IHVzZWQgdG8gZGVyaXZlIGEgbmV3IHNlZWQgZnJvbSB0aGUgZ2l2ZW4gc2VlZCB0byByZWNvdmVyIGEgc2VjcmV0IHdhbGxldCBmcm9tIHRoZSBzZWVkXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5pc011bHRpc2lnXSAtIHJlc3RvcmUgbXVsdGlzaWcgd2FsbGV0IGZyb20gc2VlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcmltYXJ5QWRkcmVzc10gLSBwcmltYXJ5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9ubHkgcHJvdmlkZSBpZiByZXN0b3JpbmcgZnJvbSBrZXlzKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlVmlld0tleV0gLSBwcml2YXRlIHZpZXcga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVNwZW5kS2V5XSAtIHByaXZhdGUgc3BlbmQga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcucmVzdG9yZUhlaWdodF0gLSBibG9jayBoZWlnaHQgdG8gc3RhcnQgc2Nhbm5pbmcgZnJvbSAoZGVmYXVsdHMgdG8gMCB1bmxlc3MgZ2VuZXJhdGluZyByYW5kb20gd2FsbGV0KVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5sYW5ndWFnZV0gLSBsYW5ndWFnZSBvZiB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQgKGRlZmF1bHRzIHRvIFwiRW5nbGlzaFwiIG9yIGF1dG8tZGV0ZWN0ZWQpXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gW2NvbmZpZy5zZXJ2ZXJdIC0gTW9uZXJvUnBjQ29ubmVjdGlvbiB0byBhIG1vbmVybyBkYWVtb24gKG9wdGlvbmFsKTxicj5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyVXJpXSAtIHVyaSBvZiBhIGRhZW1vbiB0byB1c2UgKG9wdGlvbmFsLCBtb25lcm8td2FsbGV0LXJwYyB1c3VhbGx5IHN0YXJ0ZWQgd2l0aCBkYWVtb24gY29uZmlnKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZXJ2ZXJVc2VybmFtZV0gLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgZGFlbW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyUGFzc3dvcmRdIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIGRhZW1vbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJ9IFtjb25maWcuY29ubmVjdGlvbk1hbmFnZXJdIC0gbWFuYWdlIGNvbm5lY3Rpb25zIHRvIG1vbmVyb2QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVqZWN0VW5hdXRob3JpemVkXSAtIHJlamVjdCBzZWxmLXNpZ25lZCBzZXJ2ZXIgY2VydGlmaWNhdGVzIGlmIHRydWUgKGRlZmF1bHRzIHRvIHRydWUpXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gW2NvbmZpZy5zZXJ2ZXJdIC0gTW9uZXJvUnBjQ29ubmVjdGlvbiBvciBlcXVpdmFsZW50IEpTIG9iamVjdCBwcm92aWRpbmcgZGFlbW9uIGNvbmZpZ3VyYXRpb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuc2F2ZUN1cnJlbnRdIC0gc3BlY2lmaWVzIGlmIHRoZSBjdXJyZW50IFJQQyB3YWxsZXQgc2hvdWxkIGJlIHNhdmVkIGJlZm9yZSBiZWluZyBjbG9zZWQgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHJldHVybiB7TW9uZXJvV2FsbGV0UnBjfSB0aGlzIHdhbGxldCBjbGllbnRcbiAgICovXG4gIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBjb25maWcgdG8gY3JlYXRlIHdhbGxldFwiKTtcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkICYmIChjb25maWdOb3JtYWxpemVkLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVWaWV3S2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIGluaXRpYWxpemVkIHdpdGggYSBzZWVkIG9yIGtleXMgYnV0IG5vdCBib3RoXCIpO1xuICAgIH1cbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWd0ZXN0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcmVndGVzdCBtb2RlIHdoZW4gY3JlYXRpbmcgUlBDIHdhbGxldFwiKVxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldE5ldHdvcmtUeXBlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgbmV0d29ya1R5cGUgd2hlbiBjcmVhdGluZyBSUEMgd2FsbGV0IGJlY2F1c2Ugc2VydmVyJ3MgbmV0d29yayB0eXBlIGlzIGFscmVhZHkgc2V0XCIpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRMb29rYWhlYWQoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0xvb2thaGVhZCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgY3JlYXRpbmcgd2FsbGV0cyB3aXRoIHN1YmFkZHJlc3MgbG9va2FoZWFkIG92ZXIgcnBjXCIpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFBhc3N3b3JkKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRQYXNzd29yZChcIlwiKTtcblxuICAgIC8vIHNldCBzZXJ2ZXIgZnJvbSBjb25uZWN0aW9uIG1hbmFnZXIgaWYgcHJvdmlkZWRcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBjcmVhdGVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGNvbmZpZ05vcm1hbGl6ZWQuc2V0U2VydmVyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpLmdldENvbm5lY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIHdhbGxldFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZ05vcm1hbGl6ZWQpO1xuICAgIGVsc2UgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWdOb3JtYWxpemVkKTtcbiAgICBlbHNlIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZ05vcm1hbGl6ZWQpO1xuICAgIHRoaXMuX2lzQ2xvc2VkID0gZmFsc2U7XG5cbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyIG9yIHNlcnZlclxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnTm9ybWFsaXplZC5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICB9IGVsc2UgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2V0RGFlbW9uQ29ubmVjdGlvbihjb25maWdOb3JtYWxpemVkLmdldFNlcnZlcigpKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRSYW5kb20oY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpIHtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSByZXN0b3JlSGVpZ2h0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNhdmVDdXJyZW50KCkgPT09IGZhbHNlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDdXJyZW50IHdhbGxldCBpcyBzYXZlZCBhdXRvbWF0aWNhbGx5IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICBpZiAoIWNvbmZpZy5nZXRQYXRoKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5hbWUgaXMgbm90IGluaXRpYWxpemVkXCIpO1xuICAgIGlmICghY29uZmlnLmdldExhbmd1YWdlKCkpIGNvbmZpZy5zZXRMYW5ndWFnZShNb25lcm9XYWxsZXQuREVGQVVMVF9MQU5HVUFHRSk7XG4gICAgbGV0IHBhcmFtcyA9IHsgZmlsZW5hbWU6IGNvbmZpZy5nZXRQYXRoKCksIHBhc3N3b3JkOiBjb25maWcuZ2V0UGFzc3dvcmQoKSwgbGFuZ3VhZ2U6IGNvbmZpZy5nZXRMYW5ndWFnZSgpIH07XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNyZWF0ZV93YWxsZXRcIiwgcGFyYW1zKTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhpcy5oYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihjb25maWcuZ2V0UGF0aCgpLCBlcnIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc3RvcmVfZGV0ZXJtaW5pc3RpY193YWxsZXRcIiwge1xuICAgICAgICBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSxcbiAgICAgICAgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLFxuICAgICAgICBzZWVkOiBjb25maWcuZ2V0U2VlZCgpLFxuICAgICAgICBzZWVkX29mZnNldDogY29uZmlnLmdldFNlZWRPZmZzZXQoKSxcbiAgICAgICAgZW5hYmxlX211bHRpc2lnX2V4cGVyaW1lbnRhbDogY29uZmlnLmdldElzTXVsdGlzaWcoKSxcbiAgICAgICAgcmVzdG9yZV9oZWlnaHQ6IGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCksXG4gICAgICAgIGxhbmd1YWdlOiBjb25maWcuZ2V0TGFuZ3VhZ2UoKSxcbiAgICAgICAgYXV0b3NhdmVfY3VycmVudDogY29uZmlnLmdldFNhdmVDdXJyZW50KClcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aGlzLmhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKGNvbmZpZy5nZXRQYXRoKCksIGVycik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbUtleXMoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpIHtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgd2FsbGV0IGZyb20ga2V5c1wiKTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UmVzdG9yZUhlaWdodCgwKTtcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldExhbmd1YWdlKE1vbmVyb1dhbGxldC5ERUZBVUxUX0xBTkdVQUdFKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2VuZXJhdGVfZnJvbV9rZXlzXCIsIHtcbiAgICAgICAgZmlsZW5hbWU6IGNvbmZpZy5nZXRQYXRoKCksXG4gICAgICAgIHBhc3N3b3JkOiBjb25maWcuZ2V0UGFzc3dvcmQoKSxcbiAgICAgICAgYWRkcmVzczogY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCksXG4gICAgICAgIHZpZXdrZXk6IGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpLFxuICAgICAgICBzcGVuZGtleTogY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpLFxuICAgICAgICByZXN0b3JlX2hlaWdodDogY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSxcbiAgICAgICAgYXV0b3NhdmVfY3VycmVudDogY29uZmlnLmdldFNhdmVDdXJyZW50KClcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aGlzLmhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKGNvbmZpZy5nZXRQYXRoKCksIGVycik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IobmFtZSwgZXJyKSB7XG4gICAgaWYgKGVyci5tZXNzYWdlKSB7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcImFscmVhZHkgZXhpc3RzXCIpKSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoXCJXYWxsZXQgYWxyZWFkeSBleGlzdHM6IFwiICsgbmFtZSwgZXJyLmdldENvZGUoKSwgZXJyLmdldFJwY01ldGhvZCgpLCBlcnIuZ2V0UnBjUGFyYW1zKCkpO1xuICAgICAgaWYgKGVyci5tZXNzYWdlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoXCJ3b3JkIGxpc3QgZmFpbGVkIHZlcmlmaWNhdGlvblwiKSkgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKFwiSW52YWxpZCBtbmVtb25pY1wiLCBlcnIuZ2V0Q29kZSgpLCBlcnIuZ2V0UnBjTWV0aG9kKCksIGVyci5nZXRScGNQYXJhbXMoKSk7XG4gICAgfVxuICAgIHRocm93IGVycjtcbiAgfVxuICBcbiAgYXN5bmMgaXNWaWV3T25seSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHtrZXlfdHlwZTogXCJtbmVtb25pY1wifSk7XG4gICAgICByZXR1cm4gZmFsc2U7IC8vIGtleSByZXRyaWV2YWwgc3VjY2VlZHMgaWYgbm90IHZpZXcgb25seVxuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMjkpIHJldHVybiB0cnVlOyAgLy8gd2FsbGV0IGlzIHZpZXcgb25seVxuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMSkgcmV0dXJuIGZhbHNlOyAgLy8gd2FsbGV0IGlzIG9mZmxpbmUgYnV0IG5vdCB2aWV3IG9ubHlcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbi5cbiAgICogVGhlIGNhY2hlZCBjb25uZWN0aW9uIHJlY29yZHMgdGhlIHJlcXVlc3RlZCBhbGxvdy1hbnktY2VydCBzZXR0aW5nLCBub3QgY3VzdG9tIFNTTCBvcHRpb25zLlxuICAgKiBXYWxsZXQgUlBDIGVuZm9yY2VzIGEgQ0EgZmlsZSBvciBmaW5nZXJwcmludHM7IG90aGVyd2lzZSBTU0wgYXV0b2RldGVjdCBjYW4gYWNjZXB0IHVudmVyaWZpZWQgY2VydGlmaWNhdGVzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvUnBjQ29ubmVjdGlvbn0gW3VyaU9yQ29ubmVjdGlvbl0gLSB0aGUgZGFlbW9uJ3MgVVJJIG9yIGNvbm5lY3Rpb24gKGRlZmF1bHRzIHRvIG9mZmxpbmUpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNUcnVzdGVkIC0gaW5kaWNhdGVzIGlmIHRoZSBkYWVtb24gaW4gdHJ1c3RlZFxuICAgKiBAcGFyYW0ge1NzbE9wdGlvbnN9IHNzbE9wdGlvbnMgLSBjdXN0b20gU1NMIGNvbmZpZ3VyYXRpb24gKHRha2VzIHByZWNlZGVuY2Ugb3ZlciB0aGUgY29ubmVjdGlvbidzIHJlamVjdFVuYXV0aG9yaXplZCBzZXR0aW5nKVxuICAgKi9cbiAgYXN5bmMgc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24/OiBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgc3RyaW5nLCBpc1RydXN0ZWQ/OiBib29sZWFuLCBzc2xPcHRpb25zPzogU3NsT3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCBjb25uZWN0aW9uID0gIXVyaU9yQ29ubmVjdGlvbiA/IHVuZGVmaW5lZCA6IHVyaU9yQ29ubmVjdGlvbiBpbnN0YW5jZW9mIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPyB1cmlPckNvbm5lY3Rpb24gOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24pO1xuICAgIGlmICghc3NsT3B0aW9ucykge1xuICAgICAgc3NsT3B0aW9ucyA9IG5ldyBTc2xPcHRpb25zKCk7XG4gICAgICBpZiAoY29ubmVjdGlvbikgc3NsT3B0aW9ucy5zZXRBbGxvd0FueUNlcnQoY29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA9PT0gZmFsc2UpO1xuICAgIH1cbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFVyaSgpIDogXCJiYWRfdXJpXCI7IC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IGJhZCBkYWVtb24gdXJpIG5lY2Vzc2FyeSBmb3Igb2ZmbGluZT9cbiAgICBwYXJhbXMudXNlcm5hbWUgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRVc2VybmFtZSgpIDogXCJcIjtcbiAgICBwYXJhbXMucGFzc3dvcmQgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRQYXNzd29yZCgpIDogXCJcIjtcbiAgICBwYXJhbXMudHJ1c3RlZCA9IGlzVHJ1c3RlZDtcbiAgICBjb25zdCBoYXNDZXJ0aWZpY2F0ZXMgPSAhIXNzbE9wdGlvbnMuZ2V0Q2VydGlmaWNhdGVBdXRob3JpdHlGaWxlKCkgfHwgc3NsT3B0aW9ucy5nZXRBbGxvd2VkRmluZ2VycHJpbnRzKCk/Lmxlbmd0aCA+IDA7XG4gICAgcGFyYW1zLnNzbF9zdXBwb3J0ID0gaGFzQ2VydGlmaWNhdGVzICYmIHNzbE9wdGlvbnMuZ2V0QWxsb3dBbnlDZXJ0KCkgIT09IHRydWUgPyBcImVuYWJsZWRcIiA6IFwiYXV0b2RldGVjdFwiOyAvLyB3YWxsZXQgcnBjIG9ubHkgZW5mb3JjZXMgY2VydGlmaWNhdGVzIGlmIGVuYWJsZWRcbiAgICBwYXJhbXMuc3NsX3ByaXZhdGVfa2V5X3BhdGggPSBzc2xPcHRpb25zLmdldFByaXZhdGVLZXlQYXRoKCk7XG4gICAgcGFyYW1zLnNzbF9jZXJ0aWZpY2F0ZV9wYXRoICA9IHNzbE9wdGlvbnMuZ2V0Q2VydGlmaWNhdGVQYXRoKCk7XG4gICAgcGFyYW1zLnNzbF9jYV9maWxlID0gc3NsT3B0aW9ucy5nZXRDZXJ0aWZpY2F0ZUF1dGhvcml0eUZpbGUoKTtcbiAgICBwYXJhbXMuc3NsX2FsbG93ZWRfZmluZ2VycHJpbnRzID0gc3NsT3B0aW9ucy5nZXRBbGxvd2VkRmluZ2VycHJpbnRzKCk7XG4gICAgcGFyYW1zLnNzbF9hbGxvd19hbnlfY2VydCA9IHNzbE9wdGlvbnMuZ2V0QWxsb3dBbnlDZXJ0KCk7XG5cbiAgICAvLyBzZXQgcHJveHkgd2hpY2ggbXVzdCBtYXRjaCBzdGFydHVwIHByb3h5IGlmIGFwcGxpY2FibGVcbiAgICBpZiAoY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmdldFByb3h5VXJpKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXMuc3RhcnR1cFByb3h5VXJpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzZXQgZGFlbW9uIGNvbm5lY3Rpb24gd2l0aG91dCBwcm94eSBVUkkgYmVjYXVzZSBtb25lcm8td2FsbGV0LXJwYyB3YXMgc3RhcnRlZCB3aXRoIGEgcHJveHkgVVJJOiBcIiArIHRoaXMuc3RhcnR1cFByb3h5VXJpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuc3RhcnR1cFByb3h5VXJpID09PSB1bmRlZmluZWQpIHBhcmFtcy5wcm94eSA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFByb3h5VXJpKCkgOiBcIlwiO1xuICAgICAgZWxzZSBpZiAoIUdlblV0aWxzLmlzU2FtZVByb3h5VXJpKHRoaXMuc3RhcnR1cFByb3h5VXJpLCBjb25uZWN0aW9uLmdldFByb3h5VXJpKCkpKSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzZXQgZGFlbW9uIGNvbm5lY3Rpb24gd2l0aCBwcm94eSBVUkkgXCIgKyBjb25uZWN0aW9uLmdldFByb3h5VXJpKCkgKyBcIiBiZWNhdXNlIG1vbmVyby13YWxsZXQtcnBjIHdhcyBzdGFydGVkIHdpdGggYSBkaWZmZXJlbnQgcHJveHkgVVJJOiBcIiArIHRoaXMuc3RhcnR1cFByb3h5VXJpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFwYXJhbXMucHJveHkpIHBhcmFtcy5wcm94eSA9IFwiXCI7XG5cbiAgICBjb25zdCBkYWVtb25Db25uZWN0aW9uID0gY29ubmVjdGlvbiA/IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKGNvbm5lY3Rpb24pIDogdW5kZWZpbmVkO1xuICAgIGlmIChkYWVtb25Db25uZWN0aW9uKSBkYWVtb25Db25uZWN0aW9uLnJlamVjdFVuYXV0aG9yaXplZCA9IHBhcmFtcy5zc2xfYWxsb3dfYW55X2NlcnQgIT09IHRydWU7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2RhZW1vblwiLCBwYXJhbXMpO1xuICAgIHRoaXMuZGFlbW9uQ29ubmVjdGlvbiA9IGRhZW1vbkNvbm5lY3Rpb247XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkNvbm5lY3Rpb24oKTogUHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPiB7XG4gICAgcmV0dXJuIHRoaXMuZGFlbW9uQ29ubmVjdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHRvdGFsIGFuZCB1bmxvY2tlZCBiYWxhbmNlcyBpbiBhIHNpbmdsZSByZXF1ZXN0LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFthY2NvdW50SWR4XSBhY2NvdW50IGluZGV4XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3ViYWRkcmVzc0lkeF0gc3ViYWRkcmVzcyBpbmRleFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJpZ2ludFtdPn0gaXMgdGhlIHRvdGFsIGFuZCB1bmxvY2tlZCBiYWxhbmNlcyBpbiBhbiBhcnJheSwgcmVzcGVjdGl2ZWx5XG4gICAqL1xuICBhc3luYyBnZXRCYWxhbmNlcyhhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnRbXT4ge1xuICAgIGlmIChhY2NvdW50SWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzSWR4LCB1bmRlZmluZWQsIFwiTXVzdCBwcm92aWRlIGFjY291bnQgaW5kZXggd2l0aCBzdWJhZGRyZXNzIGluZGV4XCIpO1xuICAgICAgbGV0IGJhbGFuY2UgPSBCaWdJbnQoMCk7XG4gICAgICBsZXQgdW5sb2NrZWRCYWxhbmNlID0gQmlnSW50KDApO1xuICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCB0aGlzLmdldEFjY291bnRzKCkpIHtcbiAgICAgICAgYmFsYW5jZSA9IGJhbGFuY2UgKyBhY2NvdW50LmdldEJhbGFuY2UoKTtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlID0gdW5sb2NrZWRCYWxhbmNlICsgYWNjb3VudC5nZXRVbmxvY2tlZEJhbGFuY2UoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBbYmFsYW5jZSwgdW5sb2NrZWRCYWxhbmNlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHBhcmFtcyA9IHthY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LCBhZGRyZXNzX2luZGljZXM6IHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IFtzdWJhZGRyZXNzSWR4XX07XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIsIHBhcmFtcyk7XG4gICAgICBpZiAoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gW0JpZ0ludChyZXNwLnJlc3VsdC5iYWxhbmNlKSwgQmlnSW50KHJlc3AucmVzdWx0LnVubG9ja2VkX2JhbGFuY2UpXTtcbiAgICAgIGVsc2UgcmV0dXJuIFtCaWdJbnQocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3NbMF0uYmFsYW5jZSksIEJpZ0ludChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzc1swXS51bmxvY2tlZF9iYWxhbmNlKV07XG4gICAgfVxuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBDT01NT04gV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb1dhbGxldExpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3VwZXIuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN1cGVyLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWRUb0RhZW1vbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jaGVja1Jlc2VydmVQcm9vZihhd2FpdCB0aGlzLmdldFByaW1hcnlBZGRyZXNzKCksIFwiXCIsIFwiXCIpOyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IHByb3ZpZGUgYmV0dGVyIHdheSB0byBrbm93IGlmIHdhbGxldCBycGMgaXMgY29ubmVjdGVkIHRvIGRhZW1vblxuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiY2hlY2sgcmVzZXJ2ZSBleHBlY3RlZCB0byBmYWlsXCIpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9FcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTEzKSB0aHJvdyBlOyAvLyBubyB3YWxsZXQgZmlsZVxuICAgICAgcmV0dXJuIGUubWVzc2FnZS5pbmRleE9mKFwiRmFpbGVkIHRvIGNvbm5lY3QgdG8gZGFlbW9uXCIpIDwgMDtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFZlcnNpb24oKTogUHJvbWlzZTxNb25lcm9WZXJzaW9uPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdmVyc2lvblwiKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1ZlcnNpb24ocmVzcC5yZXN1bHQudmVyc2lvbiwgcmVzcC5yZXN1bHQucmVsZWFzZSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5wYXRoO1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwgeyBrZXlfdHlwZTogXCJtbmVtb25pY1wiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmIChhd2FpdCB0aGlzLmdldFNlZWQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb1dhbGxldFJwYy5nZXRTZWVkTGFuZ3VhZ2UoKSBub3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgYXZhaWxhYmxlIGxhbmd1YWdlcyBmb3IgdGhlIHdhbGxldCdzIHNlZWQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtzdHJpbmdbXX0gdGhlIGF2YWlsYWJsZSBsYW5ndWFnZXMgZm9yIHRoZSB3YWxsZXQncyBzZWVkLlxuICAgKi9cbiAgYXN5bmMgZ2V0U2VlZExhbmd1YWdlcygpIHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9sYW5ndWFnZXNcIikpLnJlc3VsdC5sYW5ndWFnZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFByaXZhdGVWaWV3S2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwgeyBrZXlfdHlwZTogXCJ2aWV3X2tleVwiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFByaXZhdGVTcGVuZEtleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwic3BlbmRfa2V5XCIgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmtleTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHN1YmFkZHJlc3NNYXAgPSB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XTtcbiAgICBpZiAoIXN1YmFkZHJlc3NNYXApIHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHVuZGVmaW5lZCwgdHJ1ZSk7ICAvLyBjYWNoZSdzIGFsbCBhZGRyZXNzZXMgYXQgdGhpcyBhY2NvdW50XG4gICAgICByZXR1cm4gdGhpcy5nZXRBZGRyZXNzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpOyAgICAgICAgLy8gcmVjdXJzaXZlIGNhbGwgdXNlcyBjYWNoZVxuICAgIH1cbiAgICBsZXQgYWRkcmVzcyA9IHN1YmFkZHJlc3NNYXBbc3ViYWRkcmVzc0lkeF07XG4gICAgaWYgKCFhZGRyZXNzKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHRydWUpOyAgLy8gY2FjaGUncyBhbGwgYWRkcmVzc2VzIGF0IHRoaXMgYWNjb3VudFxuICAgICAgcmV0dXJuIHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdW3N1YmFkZHJlc3NJZHhdO1xuICAgIH1cbiAgICByZXR1cm4gYWRkcmVzcztcbiAgfVxuICBcbiAgLy8gVE9ETzogdXNlIGNhY2hlXG4gIGFzeW5jIGdldEFkZHJlc3NJbmRleChhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBcbiAgICAvLyBmZXRjaCByZXN1bHQgYW5kIG5vcm1hbGl6ZSBlcnJvciBpZiBhZGRyZXNzIGRvZXMgbm90IGJlbG9uZyB0byB0aGUgd2FsbGV0XG4gICAgbGV0IHJlc3A7XG4gICAgdHJ5IHtcbiAgICAgIHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc19pbmRleFwiLCB7YWRkcmVzczogYWRkcmVzc30pO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGUubWVzc2FnZSk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICBcbiAgICAvLyBjb252ZXJ0IHJwYyByZXNwb25zZVxuICAgIGxldCBzdWJhZGRyZXNzID0gbmV3IE1vbmVyb1N1YmFkZHJlc3Moe2FkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICBzdWJhZGRyZXNzLnNldEFjY291bnRJbmRleChyZXNwLnJlc3VsdC5pbmRleC5tYWpvcik7XG4gICAgc3ViYWRkcmVzcy5zZXRJbmRleChyZXNwLnJlc3VsdC5pbmRleC5taW5vcik7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcz86IHN0cmluZywgcGF5bWVudElkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgaW50ZWdyYXRlZEFkZHJlc3NTdHIgPSAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibWFrZV9pbnRlZ3JhdGVkX2FkZHJlc3NcIiwge3N0YW5kYXJkX2FkZHJlc3M6IHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudF9pZDogcGF5bWVudElkfSkpLnJlc3VsdC5pbnRlZ3JhdGVkX2FkZHJlc3M7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5kZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzc1N0cik7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5tZXNzYWdlLmluY2x1ZGVzKFwiSW52YWxpZCBwYXltZW50IElEXCIpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIHBheW1lbnQgSUQ6IFwiICsgcGF5bWVudElkKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3BsaXRfaW50ZWdyYXRlZF9hZGRyZXNzXCIsIHtpbnRlZ3JhdGVkX2FkZHJlc3M6IGludGVncmF0ZWRBZGRyZXNzfSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcygpLnNldFN0YW5kYXJkQWRkcmVzcyhyZXNwLnJlc3VsdC5zdGFuZGFyZF9hZGRyZXNzKS5zZXRQYXltZW50SWQocmVzcC5yZXN1bHQucGF5bWVudF9pZCkuc2V0SW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3MpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9oZWlnaHRcIikpLnJlc3VsdC5oZWlnaHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGluZyB0aGUgY2hhaW4gaGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHRCeURhdGUoeWVhcjogbnVtYmVyLCBtb250aDogbnVtYmVyLCBkYXk6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3Qgc3VwcG9ydCBnZXR0aW5nIGEgaGVpZ2h0IGJ5IGRhdGVcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgYXNzZXJ0KCEobGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIpLCBcIk1vbmVybyBXYWxsZXQgUlBDIGRvZXMgbm90IHN1cHBvcnQgcmVwb3J0aW5nIHN5bmMgcHJvZ3Jlc3NcIik7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVmcmVzaFwiLCB7c3RhcnRfaGVpZ2h0OiBzdGFydEhlaWdodH0pO1xuICAgICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb1N5bmNSZXN1bHQocmVzcC5yZXN1bHQuYmxvY2tzX2ZldGNoZWQsIHJlc3AucmVzdWx0LnJlY2VpdmVkX21vbmV5KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgaWYgKGVyci5tZXNzYWdlID09PSBcIm5vIGNvbm5lY3Rpb24gdG8gZGFlbW9uXCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncz86IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIFxuICAgIC8vIGNvbnZlcnQgbXMgdG8gc2Vjb25kcyBmb3IgcnBjIHBhcmFtZXRlclxuICAgIGxldCBzeW5jUGVyaW9kSW5TZWNvbmRzID0gTWF0aC5yb3VuZCgoc3luY1BlcmlvZEluTXMgPT09IHVuZGVmaW5lZCA/IE1vbmVyb1dhbGxldFJwYy5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIDogc3luY1BlcmlvZEluTXMpIC8gMTAwMCk7XG4gICAgXG4gICAgLy8gc2VuZCBycGMgcmVxdWVzdFxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImF1dG9fcmVmcmVzaFwiLCB7XG4gICAgICBlbmFibGU6IHRydWUsXG4gICAgICBwZXJpb2Q6IHN5bmNQZXJpb2RJblNlY29uZHNcbiAgICB9KTtcbiAgICBcbiAgICAvLyB1cGRhdGUgc3luYyBwZXJpb2QgZm9yIHBvbGxlclxuICAgIHRoaXMuc3luY1BlcmlvZEluTXMgPSBzeW5jUGVyaW9kSW5TZWNvbmRzICogMTAwMDtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCkgdGhpcy53YWxsZXRQb2xsZXIuc2V0UGVyaW9kSW5Ncyh0aGlzLnN5bmNQZXJpb2RJbk1zKTtcbiAgICBcbiAgICAvLyBwb2xsIGlmIGxpc3RlbmluZ1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICB9XG5cbiAgZ2V0U3luY1BlcmlvZEluTXMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5zeW5jUGVyaW9kSW5NcztcbiAgfVxuICBcbiAgYXN5bmMgc3RvcFN5bmNpbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImF1dG9fcmVmcmVzaFwiLCB7IGVuYWJsZTogZmFsc2UgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0eEhhc2hlcyB8fCAhdHhIYXNoZXMubGVuZ3RoKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJObyB0eCBoYXNoZXMgZ2l2ZW4gdG8gc2NhblwiKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzY2FuX3R4XCIsIHt0eGlkczogdHhIYXNoZXN9KTtcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuU3BlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVzY2FuX3NwZW50XCIsIHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhbkJsb2NrY2hhaW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVzY2FuX2Jsb2NrY2hhaW5cIiwgdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0QmFsYW5jZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkpWzBdO1xuICB9XG4gIFxuICBhc3luYyBnZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbGFuY2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHRhZz86IHN0cmluZywgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvQWNjb3VudFtdPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggYWNjb3VudHMgZnJvbSBycGNcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hY2NvdW50c1wiLCB7dGFnOiB0YWd9KTtcbiAgICBcbiAgICAvLyBidWlsZCBhY2NvdW50IG9iamVjdHMgYW5kIGZldGNoIHN1YmFkZHJlc3NlcyBwZXIgYWNjb3VudCB1c2luZyBnZXRfYWRkcmVzc1xuICAgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IGdldF9hZGRyZXNzIHNob3VsZCBzdXBwb3J0IGFsbF9hY2NvdW50cyBzbyBub3QgY2FsbGVkIG9uY2UgcGVyIGFjY291bnRcbiAgICBsZXQgYWNjb3VudHM6IE1vbmVyb0FjY291bnRbXSA9IFtdO1xuICAgIGZvciAobGV0IHJwY0FjY291bnQgb2YgcmVzcC5yZXN1bHQuc3ViYWRkcmVzc19hY2NvdW50cykge1xuICAgICAgbGV0IGFjY291bnQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY0FjY291bnQocnBjQWNjb3VudCk7XG4gICAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcykgYWNjb3VudC5zZXRTdWJhZGRyZXNzZXMoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudC5nZXRJbmRleCgpLCB1bmRlZmluZWQsIHRydWUpKTtcbiAgICAgIGFjY291bnRzLnB1c2goYWNjb3VudCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGZldGNoIGFuZCBtZXJnZSBmaWVsZHMgZnJvbSBnZXRfYmFsYW5jZSBhY3Jvc3MgYWxsIGFjY291bnRzXG4gICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMgJiYgIXNraXBCYWxhbmNlcykge1xuICAgICAgXG4gICAgICAvLyB0aGVzZSBmaWVsZHMgYXJlIG5vdCBpbml0aWFsaXplZCBpZiBzdWJhZGRyZXNzIGlzIHVudXNlZCBhbmQgdGhlcmVmb3JlIG5vdCByZXR1cm5lZCBmcm9tIGBnZXRfYmFsYW5jZWBcbiAgICAgIGZvciAobGV0IGFjY291bnQgb2YgYWNjb3VudHMpIHtcbiAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpKSB7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKDApO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gZmV0Y2ggYW5kIG1lcmdlIGluZm8gZnJvbSBnZXRfYmFsYW5jZVxuICAgICAgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIsIHthbGxfYWNjb3VudHM6IHRydWV9KTtcbiAgICAgIGlmIChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICBmb3IgKGxldCBycGNTdWJhZGRyZXNzIG9mIHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3MgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gbWVyZ2UgaW5mb1xuICAgICAgICAgIGxldCBhY2NvdW50ID0gYWNjb3VudHNbc3ViYWRkcmVzcy5nZXRBY2NvdW50SW5kZXgoKV07XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsKHN1YmFkZHJlc3MuZ2V0QWNjb3VudEluZGV4KCksIGFjY291bnQuZ2V0SW5kZXgoKSwgXCJSUEMgYWNjb3VudHMgYXJlIG91dCBvZiBvcmRlclwiKTsgIC8vIHdvdWxkIG5lZWQgdG8gc3dpdGNoIGxvb2t1cCB0byBsb29wXG4gICAgICAgICAgbGV0IHRndFN1YmFkZHJlc3MgPSBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpW3N1YmFkZHJlc3MuZ2V0SW5kZXgoKV07XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSwgdGd0U3ViYWRkcmVzcy5nZXRJbmRleCgpLCBcIlJQQyBzdWJhZGRyZXNzZXMgYXJlIG91dCBvZiBvcmRlclwiKTtcbiAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpKTtcbiAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpKTtcbiAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gYWNjb3VudHM7XG4gIH1cbiAgXG4gIC8vIFRPRE86IGdldEFjY291bnRCeUluZGV4KCksIGdldEFjY291bnRCeVRhZygpXG4gIGFzeW5jIGdldEFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbiwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIGFzc2VydChhY2NvdW50SWR4ID49IDApO1xuICAgIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgdGhpcy5nZXRBY2NvdW50cygpKSB7XG4gICAgICBpZiAoYWNjb3VudC5nZXRJbmRleCgpID09PSBhY2NvdW50SWR4KSB7XG4gICAgICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzKSBhY2NvdW50LnNldFN1YmFkZHJlc3Nlcyhhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHNraXBCYWxhbmNlcykpO1xuICAgICAgICByZXR1cm4gYWNjb3VudDtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQWNjb3VudCB3aXRoIGluZGV4IFwiICsgYWNjb3VudElkeCArIFwiIGRvZXMgbm90IGV4aXN0XCIpO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlQWNjb3VudChsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIGxhYmVsID0gbGFiZWwgPyBsYWJlbCA6IHVuZGVmaW5lZDtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNyZWF0ZV9hY2NvdW50XCIsIHtsYWJlbDogbGFiZWx9KTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0FjY291bnQoe1xuICAgICAgaW5kZXg6IHJlc3AucmVzdWx0LmFjY291bnRfaW5kZXgsXG4gICAgICBwcmltYXJ5QWRkcmVzczogcmVzcC5yZXN1bHQuYWRkcmVzcyxcbiAgICAgIGxhYmVsOiBsYWJlbCxcbiAgICAgIGJhbGFuY2U6IEJpZ0ludCgwKSxcbiAgICAgIHVubG9ja2VkQmFsYW5jZTogQmlnSW50KDApXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBnZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSW5kaWNlcz86IG51bWJlcltdLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzW10+IHtcbiAgICBcbiAgICAvLyBmZXRjaCBzdWJhZGRyZXNzZXNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgaWYgKHN1YmFkZHJlc3NJbmRpY2VzKSBwYXJhbXMuYWRkcmVzc19pbmRleCA9IEdlblV0aWxzLmxpc3RpZnkoc3ViYWRkcmVzc0luZGljZXMpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NcIiwgcGFyYW1zKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHN1YmFkZHJlc3Nlc1xuICAgIGxldCBzdWJhZGRyZXNzZXMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNTdWJhZGRyZXNzIG9mIHJlc3AucmVzdWx0LmFkZHJlc3Nlcykge1xuICAgICAgbGV0IHN1YmFkZHJlc3MgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcyk7XG4gICAgICBzdWJhZGRyZXNzLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIHN1YmFkZHJlc3Nlcy5wdXNoKHN1YmFkZHJlc3MpO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgaW5pdGlhbGl6ZSBzdWJhZGRyZXNzIGJhbGFuY2VzXG4gICAgaWYgKCFza2lwQmFsYW5jZXMpIHtcbiAgICAgIFxuICAgICAgLy8gdGhlc2UgZmllbGRzIGFyZSBub3QgaW5pdGlhbGl6ZWQgaWYgc3ViYWRkcmVzcyBpcyB1bnVzZWQgYW5kIHRoZXJlZm9yZSBub3QgcmV0dXJuZWQgZnJvbSBgZ2V0X2JhbGFuY2VgXG4gICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIHN1YmFkZHJlc3Nlcykge1xuICAgICAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cygwKTtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jaygwKTtcbiAgICAgIH1cblxuICAgICAgLy8gZmV0Y2ggYW5kIGluaXRpYWxpemUgYmFsYW5jZXNcbiAgICAgIHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCBwYXJhbXMpO1xuICAgICAgaWYgKHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgIGZvciAobGV0IHJwY1N1YmFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzcyA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyB0cmFuc2ZlciBpbmZvIHRvIGV4aXN0aW5nIHN1YmFkZHJlc3Mgb2JqZWN0XG4gICAgICAgICAgZm9yIChsZXQgdGd0U3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgICAgICAgIGlmICh0Z3RTdWJhZGRyZXNzLmdldEluZGV4KCkgIT09IHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSkgY29udGludWU7IC8vIHNraXAgdG8gc3ViYWRkcmVzcyB3aXRoIHNhbWUgaW5kZXhcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldE51bUJsb2Nrc1RvVW5sb2NrKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jayhzdWJhZGRyZXNzLmdldE51bUJsb2Nrc1RvVW5sb2NrKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSBhZGRyZXNzZXNcbiAgICBsZXQgc3ViYWRkcmVzc01hcCA9IHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdO1xuICAgIGlmICghc3ViYWRkcmVzc01hcCkge1xuICAgICAgc3ViYWRkcmVzc01hcCA9IHt9O1xuICAgICAgdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF0gPSBzdWJhZGRyZXNzTWFwO1xuICAgIH1cbiAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIHN1YmFkZHJlc3Nlcykge1xuICAgICAgc3ViYWRkcmVzc01hcFtzdWJhZGRyZXNzLmdldEluZGV4KCldID0gc3ViYWRkcmVzcy5nZXRBZGRyZXNzKCk7XG4gICAgfVxuICAgIFxuICAgIC8vIHJldHVybiByZXN1bHRzXG4gICAgcmV0dXJuIHN1YmFkZHJlc3NlcztcbiAgfVxuXG4gIGFzeW5jIGdldFN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBhc3NlcnQoYWNjb3VudElkeCA+PSAwKTtcbiAgICBhc3NlcnQoc3ViYWRkcmVzc0lkeCA+PSAwKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIFtzdWJhZGRyZXNzSWR4XSwgc2tpcEJhbGFuY2VzKSlbMF07XG4gIH1cblxuICBhc3luYyBjcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNyZWF0ZV9hZGRyZXNzXCIsIHthY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LCBsYWJlbDogbGFiZWx9KTtcbiAgICBcbiAgICAvLyBidWlsZCBzdWJhZGRyZXNzIG9iamVjdFxuICAgIGxldCBzdWJhZGRyZXNzID0gbmV3IE1vbmVyb1N1YmFkZHJlc3MoKTtcbiAgICBzdWJhZGRyZXNzLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICBzdWJhZGRyZXNzLnNldEluZGV4KHJlc3AucmVzdWx0LmFkZHJlc3NfaW5kZXgpO1xuICAgIHN1YmFkZHJlc3Muc2V0QWRkcmVzcyhyZXNwLnJlc3VsdC5hZGRyZXNzKTtcbiAgICBzdWJhZGRyZXNzLnNldExhYmVsKGxhYmVsID8gbGFiZWwgOiB1bmRlZmluZWQpO1xuICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cygwKTtcbiAgICBzdWJhZGRyZXNzLnNldElzVXNlZChmYWxzZSk7XG4gICAgc3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jaygwKTtcbiAgICByZXR1cm4gc3ViYWRkcmVzcztcbiAgfVxuXG4gIGFzeW5jIHNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImxhYmVsX2FkZHJlc3NcIiwge2luZGV4OiB7bWFqb3I6IGFjY291bnRJZHgsIG1pbm9yOiBzdWJhZGRyZXNzSWR4fSwgbGFiZWw6IGxhYmVsfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyhxdWVyeT86IHN0cmluZ1tdIHwgUGFydGlhbDxNb25lcm9UeFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIHJldHVybiB0aGlzLmdldFR4c0F1eChxdWVyeSwgNSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0VHhzQXV4KHF1ZXJ5OiBzdHJpbmdbXSB8IFBhcnRpYWw8TW9uZXJvVHhRdWVyeT4gfCB1bmRlZmluZWQsIG1heEF0dGVtcHRzOiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcblxuICAgIC8vIGNvcHkgcXVlcnlcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHhRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gdGVtcG9yYXJpbHkgZGlzYWJsZSB0cmFuc2ZlciBhbmQgb3V0cHV0IHF1ZXJpZXMgaW4gb3JkZXIgdG8gY29sbGVjdCBhbGwgdHggaW5mb3JtYXRpb25cbiAgICBsZXQgdHJhbnNmZXJRdWVyeSA9IHF1ZXJ5Tm9ybWFsaXplZC5nZXRUcmFuc2ZlclF1ZXJ5KCk7XG4gICAgbGV0IGlucHV0UXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0SW5wdXRRdWVyeSgpO1xuICAgIGxldCBvdXRwdXRRdWVyeSA9IHF1ZXJ5Tm9ybWFsaXplZC5nZXRPdXRwdXRRdWVyeSgpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRUcmFuc2ZlclF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldElucHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0T3V0cHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICBcbiAgICAvLyBmZXRjaCBhbGwgdHJhbnNmZXJzIHRoYXQgbWVldCB0eCBxdWVyeVxuICAgIGxldCB0cmFuc2ZlcnMgPSBhd2FpdCB0aGlzLmdldFRyYW5zZmVyc0F1eChuZXcgTW9uZXJvVHJhbnNmZXJRdWVyeSgpLnNldFR4UXVlcnkoTW9uZXJvV2FsbGV0UnBjLmRlY29udGV4dHVhbGl6ZShxdWVyeU5vcm1hbGl6ZWQuY29weSgpKSkpO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdW5pcXVlIHR4cyBmcm9tIHRyYW5zZmVycyB3aGlsZSByZXRhaW5pbmcgb3JkZXJcbiAgICBsZXQgdHhzID0gW107XG4gICAgbGV0IHR4c1NldCA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0cmFuc2ZlcnMpIHtcbiAgICAgIGlmICghdHhzU2V0Lmhhcyh0cmFuc2Zlci5nZXRUeCgpKSkge1xuICAgICAgICB0eHMucHVzaCh0cmFuc2Zlci5nZXRUeCgpKTtcbiAgICAgICAgdHhzU2V0LmFkZCh0cmFuc2Zlci5nZXRUeCgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgdHlwZXMgaW50byBtYXBzIGZvciBtZXJnaW5nIGFuZCBsb29rdXBcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgbWVyZ2Ugb3V0cHV0cyBpZiByZXF1ZXN0ZWRcbiAgICBpZiAocXVlcnlOb3JtYWxpemVkLmdldEluY2x1ZGVPdXRwdXRzKCkgfHwgb3V0cHV0UXVlcnkpIHtcbiAgICAgICAgXG4gICAgICAvLyBmZXRjaCBvdXRwdXRzXG4gICAgICBsZXQgb3V0cHV0UXVlcnlBdXggPSAob3V0cHV0UXVlcnkgPyBvdXRwdXRRdWVyeS5jb3B5KCkgOiBuZXcgTW9uZXJvT3V0cHV0UXVlcnkoKSkuc2V0VHhRdWVyeShNb25lcm9XYWxsZXRScGMuZGVjb250ZXh0dWFsaXplKHF1ZXJ5Tm9ybWFsaXplZC5jb3B5KCkpKTtcbiAgICAgIGxldCBvdXRwdXRzID0gYXdhaXQgdGhpcy5nZXRPdXRwdXRzQXV4KG91dHB1dFF1ZXJ5QXV4KTtcbiAgICAgIFxuICAgICAgLy8gbWVyZ2Ugb3V0cHV0IHR4cyBvbmUgdGltZSB3aGlsZSByZXRhaW5pbmcgb3JkZXJcbiAgICAgIGxldCBvdXRwdXRUeHMgPSBbXTtcbiAgICAgIGZvciAobGV0IG91dHB1dCBvZiBvdXRwdXRzKSB7XG4gICAgICAgIGlmICghb3V0cHV0VHhzLmluY2x1ZGVzKG91dHB1dC5nZXRUeCgpKSkge1xuICAgICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KG91dHB1dC5nZXRUeCgpLCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgICAgIG91dHB1dFR4cy5wdXNoKG91dHB1dC5nZXRUeCgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyByZXN0b3JlIHRyYW5zZmVyIGFuZCBvdXRwdXQgcXVlcmllc1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRUcmFuc2ZlclF1ZXJ5KHRyYW5zZmVyUXVlcnkpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRJbnB1dFF1ZXJ5KGlucHV0UXVlcnkpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRPdXRwdXRRdWVyeShvdXRwdXRRdWVyeSk7XG4gICAgXG4gICAgLy8gZmlsdGVyIHR4cyB0aGF0IGRvbid0IG1lZXQgdHJhbnNmZXIgcXVlcnlcbiAgICBsZXQgdHhzUXVlcmllZCA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5tZWV0c0NyaXRlcmlhKHR4KSkgdHhzUXVlcmllZC5wdXNoKHR4KTtcbiAgICAgIGVsc2UgaWYgKHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCkgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgfVxuICAgIHR4cyA9IHR4c1F1ZXJpZWQ7XG4gICAgXG4gICAgLy8gc3BlY2lhbCBjYXNlOiByZS1mZXRjaCB0eHMgaWYgaW5jb25zaXN0ZW5jeSBjYXVzZWQgYnkgbmVlZGluZyB0byBtYWtlIG11bHRpcGxlIHJwYyBjYWxsc1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkgJiYgdHguZ2V0QmxvY2soKSA9PT0gdW5kZWZpbmVkIHx8ICF0eC5nZXRJc0NvbmZpcm1lZCgpICYmIHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAobWF4QXR0ZW1wdHMgPD0gMSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVW5hYmxlIHRvIGJ1aWxkIGNvbnNpc3RlbnQgdHhzIGZyb20gbXVsdGlwbGUgcnBjIGNhbGxzXCIpO1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiSW5jb25zaXN0ZW5jeSBkZXRlY3RlZCBidWlsZGluZyB0eHMgZnJvbSBtdWx0aXBsZSBycGMgY2FsbHMsIHJlLWZldGNoaW5nIHR4c1wiKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VHhzQXV4KHF1ZXJ5Tm9ybWFsaXplZCwgbWF4QXR0ZW1wdHMgLSAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gb3JkZXIgdHhzIGlmIHR4IGhhc2hlcyBnaXZlbiB0aGVuIHJldHVyblxuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkgJiYgcXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpLmxlbmd0aCA+IDApIHtcbiAgICAgIGxldCB0eHNCeUlkID0gbmV3IE1hcCgpICAvLyBzdG9yZSB0eHMgaW4gdGVtcG9yYXJ5IG1hcCBmb3Igc29ydGluZ1xuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB0eHNCeUlkLnNldCh0eC5nZXRIYXNoKCksIHR4KTtcbiAgICAgIGxldCBvcmRlcmVkVHhzID0gW107XG4gICAgICBmb3IgKGxldCBoYXNoIG9mIHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKSkgaWYgKHR4c0J5SWQuZ2V0KGhhc2gpKSBvcmRlcmVkVHhzLnB1c2godHhzQnlJZC5nZXQoaGFzaCkpO1xuICAgICAgdHhzID0gb3JkZXJlZFR4cztcbiAgICB9XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHJhbnNmZXJbXT4ge1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBnZXQgdHJhbnNmZXJzIGRpcmVjdGx5IGlmIHF1ZXJ5IGRvZXMgbm90IHJlcXVpcmUgdHggY29udGV4dCAob3RoZXIgdHJhbnNmZXJzLCBvdXRwdXRzKVxuICAgIGlmICghTW9uZXJvV2FsbGV0UnBjLmlzQ29udGV4dHVhbChxdWVyeU5vcm1hbGl6ZWQpKSByZXR1cm4gdGhpcy5nZXRUcmFuc2ZlcnNBdXgocXVlcnlOb3JtYWxpemVkKTtcbiAgICBcbiAgICAvLyBvdGhlcndpc2UgZ2V0IHR4cyB3aXRoIGZ1bGwgbW9kZWxzIHRvIGZ1bGZpbGwgcXVlcnlcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5nZXRUeHMocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKSkpIHtcbiAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmZpbHRlclRyYW5zZmVycyhxdWVyeU5vcm1hbGl6ZWQpKSB7XG4gICAgICAgIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvT3V0cHV0UXVlcnk+KTogUHJvbWlzZTxNb25lcm9PdXRwdXRXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gZ2V0IG91dHB1dHMgZGlyZWN0bHkgaWYgcXVlcnkgZG9lcyBub3QgcmVxdWlyZSB0eCBjb250ZXh0IChvdGhlciBvdXRwdXRzLCB0cmFuc2ZlcnMpXG4gICAgaWYgKCFNb25lcm9XYWxsZXRScGMuaXNDb250ZXh0dWFsKHF1ZXJ5Tm9ybWFsaXplZCkpIHJldHVybiB0aGlzLmdldE91dHB1dHNBdXgocXVlcnlOb3JtYWxpemVkKTtcbiAgICBcbiAgICAvLyBvdGhlcndpc2UgZ2V0IHR4cyB3aXRoIGZ1bGwgbW9kZWxzIHRvIGZ1bGZpbGwgcXVlcnlcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMuZ2V0VHhzKHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkpKSB7XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZmlsdGVyT3V0cHV0cyhxdWVyeU5vcm1hbGl6ZWQpKSB7XG4gICAgICAgIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfb3V0cHV0c1wiLCB7YWxsOiBhbGx9KSkucmVzdWx0Lm91dHB1dHNfZGF0YV9oZXg7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE91dHB1dHMob3V0cHV0c0hleDogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9vdXRwdXRzXCIsIHtvdXRwdXRzX2RhdGFfaGV4OiBvdXRwdXRzSGV4fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm51bV9pbXBvcnRlZDtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdD4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnJwY0V4cG9ydEtleUltYWdlcyhhbGwpO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzOiBNb25lcm9LZXlJbWFnZVtdLCBvZmZzZXQgPSAwKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD4ge1xuICAgIFxuICAgIC8vIGNvbnZlcnQga2V5IGltYWdlcyB0byBycGMgcGFyYW1ldGVyXG4gICAgbGV0IHJwY0tleUltYWdlcyA9IGtleUltYWdlcy5tYXAoa2V5SW1hZ2UgPT4gKHtrZXlfaW1hZ2U6IGtleUltYWdlLmdldEhleCgpLCBzaWduYXR1cmU6IGtleUltYWdlLmdldFNpZ25hdHVyZSgpfSkpO1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW1wb3J0X2tleV9pbWFnZXNcIiwge3NpZ25lZF9rZXlfaW1hZ2VzOiBycGNLZXlJbWFnZXMsIG9mZnNldDogb2Zmc2V0fSk7XG4gICAgXG4gICAgLy8gYnVpbGQgYW5kIHJldHVybiByZXN1bHRcbiAgICBsZXQgaW1wb3J0UmVzdWx0ID0gbmV3IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0KCk7XG4gICAgaW1wb3J0UmVzdWx0LnNldEhlaWdodChyZXNwLnJlc3VsdC5oZWlnaHQpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRTcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQuc3BlbnQpKTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0VW5zcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQudW5zcGVudCkpO1xuICAgIHJldHVybiBpbXBvcnRSZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5ycGNFeHBvcnRLZXlJbWFnZXMoZmFsc2UpKS5nZXRLZXlJbWFnZXMoKTtcbiAgfVxuICBcbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZnJlZXplXCIsIHtrZXlfaW1hZ2U6IGtleUltYWdlfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRoYXdPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ0aGF3XCIsIHtrZXlfaW1hZ2U6IGtleUltYWdlfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzT3V0cHV0RnJvemVuKGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImZyb3plblwiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5mcm96ZW4gPT09IHRydWU7XG4gIH1cblxuICBhc3luYyBnZXREZWZhdWx0RmVlUHJpb3JpdHkoKTogUHJvbWlzZTxNb25lcm9UeFByaW9yaXR5PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfZGVmYXVsdF9mZWVfcHJpb3JpdHlcIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnByaW9yaXR5O1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlLCBjb3B5LCBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWdOb3JtYWxpemVkLnNldENhblNwbGl0KHRydWUpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkgPT09IHRydWUgJiYgYXdhaXQgdGhpcy5pc011bHRpc2lnKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCByZWxheSBtdWx0aXNpZyB0cmFuc2FjdGlvbiB1bnRpbCBjby1zaWduZWRcIik7XG5cbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzc2VzIHRvIHNlbmQgZnJvbVxuICAgIGxldCBhY2NvdW50SWR4ID0gY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgdGhlIGFjY291bnQgaW5kZXggdG8gc2VuZCBmcm9tXCIpO1xuICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnNsaWNlKDApOyAvLyBmZXRjaCBhbGwgb3IgY29weSBnaXZlbiBpbmRpY2VzXG4gICAgXG4gICAgLy8gYnVpbGQgY29uZmlnIHBhcmFtZXRlcnNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuZGVzdGluYXRpb25zID0gW107XG4gICAgZm9yIChsZXQgZGVzdGluYXRpb24gb2YgY29uZmlnTm9ybWFsaXplZC5nZXREZXN0aW5hdGlvbnMoKSkge1xuICAgICAgYXNzZXJ0KGRlc3RpbmF0aW9uLmdldEFkZHJlc3MoKSwgXCJEZXN0aW5hdGlvbiBhZGRyZXNzIGlzIG5vdCBkZWZpbmVkXCIpO1xuICAgICAgYXNzZXJ0KGRlc3RpbmF0aW9uLmdldEFtb3VudCgpLCBcIkRlc3RpbmF0aW9uIGFtb3VudCBpcyBub3QgZGVmaW5lZFwiKTtcbiAgICAgIHBhcmFtcy5kZXN0aW5hdGlvbnMucHVzaCh7IGFkZHJlc3M6IGRlc3RpbmF0aW9uLmdldEFkZHJlc3MoKSwgYW1vdW50OiBkZXN0aW5hdGlvbi5nZXRBbW91bnQoKSB9KTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkpIHBhcmFtcy5zdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzID0gY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IHN1YmFkZHJlc3NJbmRpY2VzO1xuICAgIHBhcmFtcy5wYXltZW50X2lkID0gY29uZmlnTm9ybWFsaXplZC5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpICE9PSB0cnVlO1xuICAgIGFzc2VydChjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSBwYXJhbXMuZ2V0X3R4X2tleXMgPSB0cnVlOyAvLyBwYXJhbSB0byBnZXQgdHgga2V5KHMpIGRlcGVuZHMgaWYgc3BsaXRcbiAgICBlbHNlIHBhcmFtcy5nZXRfdHhfa2V5ID0gdHJ1ZTtcblxuICAgIC8vIGNhbm5vdCBhcHBseSBzdWJ0cmFjdEZlZUZyb20gd2l0aCBgdHJhbnNmZXJfc3BsaXRgIGNhbGxcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKS5sZW5ndGggPiAwKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJzdWJ0cmFjdGZlZWZyb20gdHJhbnNmZXJzIGNhbm5vdCBiZSBzcGxpdCBvdmVyIG11bHRpcGxlIHRyYW5zYWN0aW9ucyB5ZXRcIik7XG4gICAgfVxuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IFwidHJhbnNmZXJfc3BsaXRcIiA6IFwidHJhbnNmZXJcIiwgcGFyYW1zKTtcbiAgICAgIHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIldBTExFVF9SUENfRVJST1JfQ09ERV9XUk9OR19BRERSRVNTXCIpID4gLTEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgZGVzdGluYXRpb24gYWRkcmVzc1wiKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gICAgXG4gICAgLy8gcHJlLWluaXRpYWxpemUgdHhzIGlmZiBwcmVzZW50LiBtdWx0aXNpZyBhbmQgdmlldy1vbmx5IHdhbGxldHMgd2lsbCBoYXZlIHR4IHNldCB3aXRob3V0IHRyYW5zYWN0aW9uc1xuICAgIGxldCB0eHM7XG4gICAgbGV0IG51bVR4cyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IChyZXN1bHQuZmVlX2xpc3QgIT09IHVuZGVmaW5lZCA/IHJlc3VsdC5mZWVfbGlzdC5sZW5ndGggOiAwKSA6IChyZXN1bHQuZmVlICE9PSB1bmRlZmluZWQgPyAxIDogMCk7XG4gICAgaWYgKG51bVR4cyA+IDApIHR4cyA9IFtdO1xuICAgIGxldCBjb3B5RGVzdGluYXRpb25zID0gbnVtVHhzID09PSAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVHhzOyBpKyspIHtcbiAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgICAgTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnTm9ybWFsaXplZCwgdHgsIGNvcHlEZXN0aW5hdGlvbnMpO1xuICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcyAhPT0gdW5kZWZpbmVkICYmIHN1YmFkZHJlc3NJbmRpY2VzLmxlbmd0aCA9PT0gMSkgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldFN1YmFkZHJlc3NJbmRpY2VzKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHNldCBmcm9tIHJwYyByZXNwb25zZSB3aXRoIHByZS1pbml0aWFsaXplZCB0eHNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQsIHR4cywgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gICAgZWxzZSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFRvVHhTZXQocmVzdWx0LCB0eHMgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHR4c1swXSwgdHJ1ZSwgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBidWlsZCByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCk7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBjb25maWcuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpO1xuICAgIHBhcmFtcy5rZXlfaW1hZ2UgPSBjb25maWcuZ2V0S2V5SW1hZ2UoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgIT09IHRydWU7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWcuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWcuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZy5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2tleSA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9oZXggPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfbWV0YWRhdGEgPSB0cnVlO1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfc2luZ2xlXCIsIHBhcmFtcyk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZy5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBidWlsZCBhbmQgcmV0dXJuIHR4XG4gICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnLCB1bmRlZmluZWQsIHRydWUpO1xuICAgIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhUb1R4U2V0KHJlc3VsdCwgdHgsIHRydWUsIGNvbmZpZyk7XG4gICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpWzBdLnNldEFtb3VudCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkpOyAvLyBpbml0aWFsaXplIGRlc3RpbmF0aW9uIGFtb3VudFxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwOyBkZWZhdWx0IHRvIGFsbCB3aXRoIHVubG9ja2VkIGJhbGFuY2UgaWYgbm90IHNwZWNpZmllZFxuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpOyAgLy8gbWFwcyBlYWNoIGFjY291bnQgaW5kZXggdG8gc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGluZGljZXMuc2V0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCksIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgaW5kaWNlcy5zZXQoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkpKSB7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgPiAwbikgc3ViYWRkcmVzc0luZGljZXMucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBhY2NvdW50cyA9IGF3YWl0IHRoaXMuZ2V0QWNjb3VudHModHJ1ZSk7XG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICAgIGlmIChhY2NvdW50LmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgICBpbmRpY2VzLnNldChhY2NvdW50LmdldEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc3dlZXAgZnJvbSBlYWNoIGFjY291bnQgYW5kIGNvbGxlY3QgcmVzdWx0aW5nIHR4IHNldHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYWNjb3VudElkeCBvZiBpbmRpY2VzLmtleXMoKSkge1xuICAgICAgXG4gICAgICAvLyBjb3B5IGFuZCBtb2RpZnkgdGhlIG9yaWdpbmFsIGNvbmZpZ1xuICAgICAgbGV0IGNvcHkgPSBjb25maWdOb3JtYWxpemVkLmNvcHkoKTtcbiAgICAgIGNvcHkuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgY29weS5zZXRTd2VlcEVhY2hTdWJhZGRyZXNzKGZhbHNlKTtcbiAgICAgIFxuICAgICAgLy8gc3dlZXAgYWxsIHN1YmFkZHJlc3NlcyB0b2dldGhlciAgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogY2FuIHRoaXMgcmV2ZWFsIG91dHB1dHMgYmVsb25nIHRvIHRoZSBzYW1lIHdhbGxldD9cbiAgICAgIGlmIChjb3B5LmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSAhPT0gdHJ1ZSkge1xuICAgICAgICBjb3B5LnNldFN1YmFkZHJlc3NJbmRpY2VzKGluZGljZXMuZ2V0KGFjY291bnRJZHgpKTtcbiAgICAgICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5ycGNTd2VlcEFjY291bnQoY29weSkpIHR4cy5wdXNoKHR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gb3RoZXJ3aXNlIHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyBpbmRpdmlkdWFsbHlcbiAgICAgIGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzSWR4IG9mIGluZGljZXMuZ2V0KGFjY291bnRJZHgpKSB7XG4gICAgICAgICAgY29weS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhbc3ViYWRkcmVzc0lkeF0pO1xuICAgICAgICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMucnBjU3dlZXBBY2NvdW50KGNvcHkpKSB0eHMucHVzaCh0eCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcER1c3QocmVsYXk/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHJlbGF5ID09PSB1bmRlZmluZWQpIHJlbGF5ID0gZmFsc2U7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzd2VlcF9kdXN0XCIsIHtkb19ub3RfcmVsYXk6ICFyZWxheX0pO1xuICAgIGlmIChyZWxheSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzdWx0KTtcbiAgICBpZiAodHhTZXQuZ2V0VHhzKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQoIXJlbGF5KTtcbiAgICAgIHR4LnNldEluVHhQb29sKHR4LmdldElzUmVsYXllZCgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0LmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhczogKE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKVtdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eEhhc2hlcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykge1xuICAgICAgbGV0IG1ldGFkYXRhID0gdHhPck1ldGFkYXRhIGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQgPyB0eE9yTWV0YWRhdGEuZ2V0TWV0YWRhdGEoKSA6IHR4T3JNZXRhZGF0YTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVsYXlfdHhcIiwgeyBoZXg6IG1ldGFkYXRhIH0pO1xuICAgICAgdHhIYXNoZXMucHVzaChyZXNwLnJlc3VsdC50eF9oYXNoKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7IC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgcmV0dXJuIHR4SGFzaGVzO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImRlc2NyaWJlX3RyYW5zZmVyXCIsIHtcbiAgICAgIHVuc2lnbmVkX3R4c2V0OiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCksXG4gICAgICBtdWx0aXNpZ190eHNldDogdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpXG4gICAgfSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlcihyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnbl90cmFuc2ZlclwiLCB7XG4gICAgICB1bnNpZ25lZF90eHNldDogdW5zaWduZWRUeEhleCxcbiAgICAgIGV4cG9ydF9yYXc6IHRydWUsXG4gICAgICBnZXRfdHhfa2V5czogdHJ1ZVxuICAgIH0pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfdHJhbnNmZXJcIiwge1xuICAgICAgdHhfZGF0YV9oZXg6IHNpZ25lZFR4SGV4XG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBzaWduYXR1cmVUeXBlID0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgYWNjb3VudElkeCA9IDAsIHN1YmFkZHJlc3NJZHggPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25cIiwge1xuICAgICAgICBkYXRhOiBtZXNzYWdlLFxuICAgICAgICBzaWduYXR1cmVfdHlwZTogc2lnbmF0dXJlVHlwZSA9PT0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA/IFwic3BlbmRcIiA6IFwidmlld1wiLFxuICAgICAgICBhY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LFxuICAgICAgICBhZGRyZXNzX2luZGV4OiBzdWJhZGRyZXNzSWR4XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQ+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ2ZXJpZnlcIiwge2RhdGE6IG1lc3NhZ2UsIGFkZHJlc3M6IGFkZHJlc3MsIHNpZ25hdHVyZTogc2lnbmF0dXJlfSk7XG4gICAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQoXG4gICAgICAgIHJlc3VsdC5nb29kID8ge2lzR29vZDogcmVzdWx0Lmdvb2QsIGlzT2xkOiByZXN1bHQub2xkLCBzaWduYXR1cmVUeXBlOiByZXN1bHQuc2lnbmF0dXJlX3R5cGUgPT09IFwidmlld1wiID8gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1ZJRVdfS0VZIDogTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgdmVyc2lvbjogcmVzdWx0LnZlcnNpb259IDoge2lzR29vZDogZmFsc2V9XG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMikgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KHtpc0dvb2Q6IGZhbHNlfSk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9rZXlcIiwge3R4aWQ6IHR4SGFzaH0pKS5yZXN1bHQudHhfa2V5O1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaDogc3RyaW5nLCB0eEtleTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfdHhfa2V5XCIsIHt0eGlkOiB0eEhhc2gsIHR4X2tleTogdHhLZXksIGFkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICAgIFxuICAgICAgLy8gaW50ZXJwcmV0IHJlc3VsdFxuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZCh0cnVlKTtcbiAgICAgIGNoZWNrLnNldE51bUNvbmZpcm1hdGlvbnMocmVzcC5yZXN1bHQuY29uZmlybWF0aW9ucyk7XG4gICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgIGNoZWNrLnNldFJlY2VpdmVkQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5yZWNlaXZlZCkpO1xuICAgICAgcmV0dXJuIGNoZWNrO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9wcm9vZlwiLCB7dHhpZDogdHhIYXNoLCBhZGRyZXNzOiBhZGRyZXNzLCBtZXNzYWdlOiBtZXNzYWdlfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja190eF9wcm9vZlwiLCB7XG4gICAgICAgIHR4aWQ6IHR4SGFzaCxcbiAgICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBpbnRlcnByZXQgcmVzcG9uc2VcbiAgICAgIGxldCBpc0dvb2QgPSByZXNwLnJlc3VsdC5nb29kO1xuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZChpc0dvb2QpO1xuICAgICAgaWYgKGlzR29vZCkge1xuICAgICAgICBjaGVjay5zZXROdW1Db25maXJtYXRpb25zKHJlc3AucmVzdWx0LmNvbmZpcm1hdGlvbnMpO1xuICAgICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgICAgY2hlY2suc2V0UmVjZWl2ZWRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnJlY2VpdmVkKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2hlY2s7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtMSAmJiBlLm1lc3NhZ2UgPT09IFwiYmFzaWNfc3RyaW5nXCIpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJNdXN0IHByb3ZpZGUgc2lnbmF0dXJlIHRvIGNoZWNrIHR4IHByb29mXCIsIC0xKTtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfc3BlbmRfcHJvb2ZcIiwge3R4aWQ6IHR4SGFzaCwgbWVzc2FnZTogbWVzc2FnZX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfc3BlbmRfcHJvb2ZcIiwge1xuICAgICAgICB0eGlkOiB0eEhhc2gsXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC5nb29kO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhbGw6IHRydWUsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGFtb3VudDogYmlnaW50LCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFjY291bnRfaW5kZXg6IGFjY291bnRJZHgsXG4gICAgICBhbW91bnQ6IGFtb3VudCxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICB9XG5cbiAgYXN5bmMgY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1Jlc2VydmU+IHtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3Jlc2VydmVfcHJvb2ZcIiwge1xuICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICBzaWduYXR1cmU6IHNpZ25hdHVyZVxuICAgIH0pO1xuICAgIFxuICAgIC8vIGludGVycHJldCByZXN1bHRzXG4gICAgbGV0IGlzR29vZCA9IHJlc3AucmVzdWx0Lmdvb2Q7XG4gICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrUmVzZXJ2ZSgpO1xuICAgIGNoZWNrLnNldElzR29vZChpc0dvb2QpO1xuICAgIGlmIChpc0dvb2QpIHtcbiAgICAgIGNoZWNrLnNldFVuY29uZmlybWVkU3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnNwZW50KSk7XG4gICAgICBjaGVjay5zZXRUb3RhbEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQudG90YWwpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoZWNrO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9ub3Rlc1wiLCB7dHhpZHM6IHR4SGFzaGVzfSkpLnJlc3VsdC5ub3RlcztcbiAgfVxuICBcbiAgYXN5bmMgc2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10sIG5vdGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIG5vdGVzID0gbm90ZXMubWFwKG5vdGUgPT4gR2VuVXRpbHMuaXNJbml0aWFsaXplZChub3RlKSA/IG5vdGUgOiBcIlwiKTsgLy8gd2FsbGV0IHJwYyByZWplY3RzIGpzb24gbnVsbFxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF90eF9ub3Rlc1wiLCB7dHhpZHM6IHR4SGFzaGVzLCBub3Rlczogbm90ZXN9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9BZGRyZXNzQm9va0VudHJ5W10+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzX2Jvb2tcIiwge2VudHJpZXM6IGVudHJ5SW5kaWNlc30pO1xuICAgIGlmICghcmVzcC5yZXN1bHQuZW50cmllcykgcmV0dXJuIFtdO1xuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgZm9yIChsZXQgcnBjRW50cnkgb2YgcmVzcC5yZXN1bHQuZW50cmllcykge1xuICAgICAgZW50cmllcy5wdXNoKG5ldyBNb25lcm9BZGRyZXNzQm9va0VudHJ5KCkuc2V0SW5kZXgocnBjRW50cnkuaW5kZXgpLnNldEFkZHJlc3MocnBjRW50cnkuYWRkcmVzcykuc2V0RGVzY3JpcHRpb24ocnBjRW50cnkuZGVzY3JpcHRpb24pLnNldFBheW1lbnRJZChycGNFbnRyeS5wYXltZW50X2lkKSk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG4gIFxuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3M6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiYWRkX2FkZHJlc3NfYm9va1wiLCB7YWRkcmVzczogYWRkcmVzcywgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9ufSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmluZGV4O1xuICB9XG4gIFxuICBhc3luYyBlZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleDogbnVtYmVyLCBzZXRBZGRyZXNzOiBib29sZWFuLCBhZGRyZXNzOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNldERlc2NyaXB0aW9uOiBib29sZWFuLCBkZXNjcmlwdGlvbjogc3RyaW5nIHwgdW5kZWZpbmVkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJlZGl0X2FkZHJlc3NfYm9va1wiLCB7XG4gICAgICBpbmRleDogaW5kZXgsXG4gICAgICBzZXRfYWRkcmVzczogc2V0QWRkcmVzcyxcbiAgICAgIGFkZHJlc3M6IGFkZHJlc3MsXG4gICAgICBzZXRfZGVzY3JpcHRpb246IHNldERlc2NyaXB0aW9uLFxuICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uXG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHg6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImRlbGV0ZV9hZGRyZXNzX2Jvb2tcIiwge2luZGV4OiBlbnRyeUlkeH0pO1xuICB9XG4gIFxuICBhc3luYyB0YWdBY2NvdW50cyh0YWcsIGFjY291bnRJbmRpY2VzKSB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidGFnX2FjY291bnRzXCIsIHt0YWc6IHRhZywgYWNjb3VudHM6IGFjY291bnRJbmRpY2VzfSk7XG4gIH1cblxuICBhc3luYyB1bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInVudGFnX2FjY291bnRzXCIsIHthY2NvdW50czogYWNjb3VudEluZGljZXN9KTtcbiAgfVxuXG4gIGFzeW5jIGdldEFjY291bnRUYWdzKCk6IFByb21pc2U8TW9uZXJvQWNjb3VudFRhZ1tdPiB7XG4gICAgbGV0IHRhZ3MgPSBbXTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hY2NvdW50X3RhZ3NcIik7XG4gICAgaWYgKHJlc3AucmVzdWx0LmFjY291bnRfdGFncykge1xuICAgICAgZm9yIChsZXQgcnBjQWNjb3VudFRhZyBvZiByZXNwLnJlc3VsdC5hY2NvdW50X3RhZ3MpIHtcbiAgICAgICAgdGFncy5wdXNoKG5ldyBNb25lcm9BY2NvdW50VGFnKHtcbiAgICAgICAgICB0YWc6IHJwY0FjY291bnRUYWcudGFnID8gcnBjQWNjb3VudFRhZy50YWcgOiB1bmRlZmluZWQsXG4gICAgICAgICAgbGFiZWw6IHJwY0FjY291bnRUYWcubGFiZWwgPyBycGNBY2NvdW50VGFnLmxhYmVsIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGFjY291bnRJbmRpY2VzOiBycGNBY2NvdW50VGFnLmFjY291bnRzXG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhZ3M7XG4gIH1cblxuICBhc3luYyBzZXRBY2NvdW50VGFnTGFiZWwodGFnOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYWNjb3VudF90YWdfZGVzY3JpcHRpb25cIiwge3RhZzogdGFnLCBkZXNjcmlwdGlvbjogbGFiZWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWc6IE1vbmVyb1R4Q29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJtYWtlX3VyaVwiLCB7XG4gICAgICBhZGRyZXNzOiBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLFxuICAgICAgYW1vdW50OiBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QW1vdW50KCksXG4gICAgICBwYXltZW50X2lkOiBjb25maWcuZ2V0UGF5bWVudElkKCksXG4gICAgICByZWNpcGllbnRfbmFtZTogY29uZmlnLmdldFJlY2lwaWVudE5hbWUoKSxcbiAgICAgIHR4X2Rlc2NyaXB0aW9uOiBjb25maWcuZ2V0Tm90ZSgpXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnVyaTtcbiAgfVxuICBcbiAgYXN5bmMgcGFyc2VQYXltZW50VXJpKHVyaTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeENvbmZpZz4ge1xuICAgIGFzc2VydCh1cmksIFwiTXVzdCBwcm92aWRlIFVSSSB0byBwYXJzZVwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInBhcnNlX3VyaVwiLCB7dXJpOiB1cml9KTtcbiAgICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKHthZGRyZXNzOiByZXNwLnJlc3VsdC51cmkuYWRkcmVzcywgYW1vdW50OiBCaWdJbnQocmVzcC5yZXN1bHQudXJpLmFtb3VudCl9KTtcbiAgICBjb25maWcuc2V0UGF5bWVudElkKHJlc3AucmVzdWx0LnVyaS5wYXltZW50X2lkKTtcbiAgICBjb25maWcuc2V0UmVjaXBpZW50TmFtZShyZXNwLnJlc3VsdC51cmkucmVjaXBpZW50X25hbWUpO1xuICAgIGNvbmZpZy5zZXROb3RlKHJlc3AucmVzdWx0LnVyaS50eF9kZXNjcmlwdGlvbik7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkpIGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5zZXRBZGRyZXNzKHVuZGVmaW5lZCk7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXRQYXltZW50SWQoKSkgY29uZmlnLnNldFBheW1lbnRJZCh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0UmVjaXBpZW50TmFtZSgpKSBjb25maWcuc2V0UmVjaXBpZW50TmFtZSh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0Tm90ZSgpKSBjb25maWcuc2V0Tm90ZSh1bmRlZmluZWQpO1xuICAgIHJldHVybiBjb25maWc7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2F0dHJpYnV0ZVwiLCB7a2V5OiBrZXl9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC52YWx1ZSA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHJlc3AucmVzdWx0LnZhbHVlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTQ1KSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXk6IHN0cmluZywgdmFsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYXR0cmlidXRlXCIsIHtrZXk6IGtleSwgdmFsdWU6IHZhbH0pO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzOiBudW1iZXIsIGJhY2tncm91bmRNaW5pbmc/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0YXJ0X21pbmluZ1wiLCB7XG4gICAgICB0aHJlYWRzX2NvdW50OiBudW1UaHJlYWRzLFxuICAgICAgZG9fYmFja2dyb3VuZF9taW5pbmc6IGJhY2tncm91bmRNaW5pbmcsXG4gICAgICBpZ25vcmVfYmF0dGVyeTogaWdub3JlQmF0dGVyeVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3BfbWluaW5nXCIpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnSW1wb3J0TmVlZGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm11bHRpc2lnX2ltcG9ydF9uZWVkZWQgPT09IHRydWU7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE11bHRpc2lnSW5mbygpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5mbz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaXNfbXVsdGlzaWdcIik7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCBpbmZvID0gbmV3IE1vbmVyb011bHRpc2lnSW5mbygpO1xuICAgIGluZm8uc2V0SXNNdWx0aXNpZyhyZXN1bHQubXVsdGlzaWcpO1xuICAgIGluZm8uc2V0SXNSZWFkeShyZXN1bHQucmVhZHkpO1xuICAgIGluZm8uc2V0VGhyZXNob2xkKHJlc3VsdC50aHJlc2hvbGQpO1xuICAgIGluZm8uc2V0TnVtUGFydGljaXBhbnRzKHJlc3VsdC50b3RhbCk7XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbiAgXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicHJlcGFyZV9tdWx0aXNpZ1wiLCB7ZW5hYmxlX211bHRpc2lnX2V4cGVyaW1lbnRhbDogdHJ1ZX0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIHJldHVybiByZXN1bHQubXVsdGlzaWdfaW5mbztcbiAgfVxuICBcbiAgYXN5bmMgbWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCB0aHJlc2hvbGQ6IG51bWJlciwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJtYWtlX211bHRpc2lnXCIsIHtcbiAgICAgIG11bHRpc2lnX2luZm86IG11bHRpc2lnSGV4ZXMsXG4gICAgICB0aHJlc2hvbGQ6IHRocmVzaG9sZCxcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZFxuICAgIH0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm11bHRpc2lnX2luZm87XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4Y2hhbmdlX211bHRpc2lnX2tleXNcIiwge211bHRpc2lnX2luZm86IG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkOiBwYXNzd29yZH0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgbGV0IG1zUmVzdWx0ID0gbmV3IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCgpO1xuICAgIG1zUmVzdWx0LnNldEFkZHJlc3MocmVzcC5yZXN1bHQuYWRkcmVzcyk7XG4gICAgbXNSZXN1bHQuc2V0TXVsdGlzaWdIZXgocmVzcC5yZXN1bHQubXVsdGlzaWdfaW5mbyk7XG4gICAgaWYgKG1zUmVzdWx0LmdldEFkZHJlc3MoKS5sZW5ndGggPT09IDApIG1zUmVzdWx0LnNldEFkZHJlc3ModW5kZWZpbmVkKTtcbiAgICBpZiAobXNSZXN1bHQuZ2V0TXVsdGlzaWdIZXgoKS5sZW5ndGggPT09IDApIG1zUmVzdWx0LnNldE11bHRpc2lnSGV4KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIG1zUmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRNdWx0aXNpZ0hleCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X211bHRpc2lnX2luZm9cIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmluZm87XG4gIH1cblxuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcmVmcmVzaEFmdGVySW1wb3J0PzogYm9vbGVhbik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHJlZnJlc2hBZnRlckltcG9ydCA9PT0gdW5kZWZpbmVkKSByZWZyZXNoQWZ0ZXJJbXBvcnQgPSB0cnVlO1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShtdWx0aXNpZ0hleGVzKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN0cmluZ1tdIHRvIGltcG9ydE11bHRpc2lnSGV4KClcIilcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9tdWx0aXNpZ19pbmZvXCIsIHtpbmZvOiBtdWx0aXNpZ0hleGVzLCByZWZyZXNoX2FmdGVyX2ltcG9ydDogcmVmcmVzaEFmdGVySW1wb3J0fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm5fb3V0cHV0cztcbiAgfVxuXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzaWduX211bHRpc2lnXCIsIHt0eF9kYXRhX2hleDogbXVsdGlzaWdUeEhleH0pO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgc2lnblJlc3VsdCA9IG5ldyBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQoKTtcbiAgICBzaWduUmVzdWx0LnNldFNpZ25lZE11bHRpc2lnVHhIZXgocmVzdWx0LnR4X2RhdGFfaGV4KTtcbiAgICBzaWduUmVzdWx0LnNldFR4SGFzaGVzKHJlc3VsdC50eF9oYXNoX2xpc3QpO1xuICAgIHJldHVybiBzaWduUmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfbXVsdGlzaWdcIiwge3R4X2RhdGFfaGV4OiBzaWduZWRNdWx0aXNpZ1R4SGV4fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQ6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkXCIsIHtvbGRfcGFzc3dvcmQ6IG9sZFBhc3N3b3JkIHx8IFwiXCIsIG5ld19wYXNzd29yZDogbmV3UGFzc3dvcmQgfHwgXCJcIn0pO1xuICB9XG4gIFxuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3JlXCIpO1xuICB9XG4gIFxuICBhc3luYyBjbG9zZShzYXZlID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5jbG9zZShzYXZlKTtcbiAgICBpZiAoc2F2ZSA9PT0gdW5kZWZpbmVkKSBzYXZlID0gZmFsc2U7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNsb3NlX3dhbGxldFwiLCB7YXV0b3NhdmVfY3VycmVudDogc2F2ZX0pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nsb3NlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmV0dXJuIGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTEzICYmIGUubWVzc2FnZS5pbmRleE9mKFwiTm8gd2FsbGV0IGZpbGVcIikgPiAtMTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICAvKipcbiAgICogU2F2ZSBhbmQgY2xvc2UgdGhlIGN1cnJlbnQgd2FsbGV0IGFuZCBzdG9wIHRoZSBSUEMgc2VydmVyLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3Bfd2FsbGV0XCIpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuXG4gIGFzeW5jIGdldE51bUJsb2Nrc1RvVW5sb2NrKCk6IFByb21pc2U8bnVtYmVyW118dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXROdW1CbG9ja3NUb1VubG9jaygpOyB9XG4gIGFzeW5jIGdldFR4KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldHx1bmRlZmluZWQ+IHsgcmV0dXJuIHN1cGVyLmdldFR4KHR4SGFzaCk7IH1cbiAgYXN5bmMgZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb0luY29taW5nVHJhbnNmZXJbXT4geyByZXR1cm4gc3VwZXIuZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KSB7IHJldHVybiBzdXBlci5nZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeSk7IH1cbiAgYXN5bmMgY3JlYXRlVHgoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHsgcmV0dXJuIHN1cGVyLmNyZWF0ZVR4KGNvbmZpZyk7IH1cbiAgYXN5bmMgcmVsYXlUeCh0eE9yTWV0YWRhdGE6IE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLnJlbGF5VHgodHhPck1ldGFkYXRhKTsgfVxuICBhc3luYyBnZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIuZ2V0VHhOb3RlKHR4SGFzaCk7IH1cbiAgYXN5bmMgc2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nLCBub3RlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHN1cGVyLnNldFR4Tm90ZSh0eEhhc2gsIG5vdGUpOyB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHN0YXRpYyBhc3luYyBjb25uZWN0VG9XYWxsZXRScGModXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBsZXQgY29uZmlnID0gTW9uZXJvV2FsbGV0UnBjLm5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZywgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICBpZiAoY29uZmlnLmNtZCkgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5zdGFydFdhbGxldFJwY1Byb2Nlc3MoY29uZmlnKTtcbiAgICBlbHNlIHJldHVybiBuZXcgTW9uZXJvV2FsbGV0UnBjKGNvbmZpZyk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgc3RhcnRXYWxsZXRScGNQcm9jZXNzKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNBcnJheShjb25maWcuY21kKSwgXCJNdXN0IHByb3ZpZGUgc3RyaW5nIGFycmF5IHdpdGggY29tbWFuZCBsaW5lIHBhcmFtZXRlcnNcIik7XG4gICAgXG4gICAgLy8gc3RhcnQgcHJvY2Vzc1xuICAgIGxldCBjaGlsZF9wcm9jZXNzID0gYXdhaXQgaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKTtcbiAgICBjb25zdCBjaGlsZFByb2Nlc3MgPSBjaGlsZF9wcm9jZXNzLnNwYXduKGNvbmZpZy5jbWRbMF0sIGNvbmZpZy5jbWQuc2xpY2UoMSksIHtcbiAgICAgIGVudjogeyAuLi5wcm9jZXNzLmVudiwgTEFORzogJ2VuX1VTLlVURi04JyB9IC8vIHNjcmFwZSBvdXRwdXQgaW4gZW5nbGlzaFxuICAgIH0pO1xuICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgYWZ0ZXIgc3RhcnRpbmcgbW9uZXJvLXdhbGxldC1ycGNcbiAgICBsZXQgdXJpO1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICBsZXQgb3V0cHV0ID0gXCJcIjtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRvdXRcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5vbignZGF0YScsIGFzeW5jIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBsZXQgbGluZSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDIsIGxpbmUpO1xuICAgICAgICAgIG91dHB1dCArPSBsaW5lICsgJ1xcbic7IC8vIGNhcHR1cmUgb3V0cHV0IGluIGNhc2Ugb2YgZXJyb3JcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBleHRyYWN0IHVyaSBmcm9tIGUuZy4gXCJJIEJpbmRpbmcgb24gMTI3LjAuMC4xIChJUHY0KTozODA4NVwiXG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWlucyA9IFwiQmluZGluZyBvbiBcIjtcbiAgICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zSWR4ID0gbGluZS5pbmRleE9mKHVyaUxpbmVDb250YWlucyk7XG4gICAgICAgICAgaWYgKHVyaUxpbmVDb250YWluc0lkeCA+PSAwKSB7XG4gICAgICAgICAgICBsZXQgaG9zdCA9IGxpbmUuc3Vic3RyaW5nKHVyaUxpbmVDb250YWluc0lkeCArIHVyaUxpbmVDb250YWlucy5sZW5ndGgsIGxpbmUubGFzdEluZGV4T2YoJyAnKSk7XG4gICAgICAgICAgICBsZXQgdW5mb3JtYXR0ZWRMaW5lID0gbGluZS5yZXBsYWNlKC9cXHUwMDFiXFxbLio/bS9nLCAnJykudHJpbSgpOyAvLyByZW1vdmUgY29sb3IgZm9ybWF0dGluZ1xuICAgICAgICAgICAgbGV0IHBvcnQgPSB1bmZvcm1hdHRlZExpbmUuc3Vic3RyaW5nKHVuZm9ybWF0dGVkTGluZS5sYXN0SW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBsZXQgc3NsSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtc3NsXCIpO1xuICAgICAgICAgICAgbGV0IHNzbEVuYWJsZWQgPSBzc2xJZHggPj0gMCA/IFwiZW5hYmxlZFwiID09IGNvbmZpZy5jbWRbc3NsSWR4ICsgMV0udG9Mb3dlckNhc2UoKSA6IGZhbHNlO1xuICAgICAgICAgICAgdXJpID0gKHNzbEVuYWJsZWQgPyBcImh0dHBzXCIgOiBcImh0dHBcIikgKyBcIjovL1wiICsgaG9zdCArIFwiOlwiICsgcG9ydDtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVhZCBzdWNjZXNzIG1lc3NhZ2VcbiAgICAgICAgICBpZiAobGluZS5pbmRleE9mKFwiU3RhcnRpbmcgd2FsbGV0IFJQQyBzZXJ2ZXJcIikgPj0gMCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBnZXQgdXNlcm5hbWUsIHBhc3N3b3JkLCB6bXEgcHVibGlzaCB1cmksIGFuZCBwcm94eSB1cmkgZnJvbSBwYXJhbXNcbiAgICAgICAgICAgIGxldCB1c2VyUGFzc0lkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLWxvZ2luXCIpO1xuICAgICAgICAgICAgbGV0IHVzZXJQYXNzID0gdXNlclBhc3NJZHggPj0gMCA/IGNvbmZpZy5jbWRbdXNlclBhc3NJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcoMCwgdXNlclBhc3MuaW5kZXhPZignOicpKTtcbiAgICAgICAgICAgIGxldCBwYXNzd29yZCA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcodXNlclBhc3MuaW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBsZXQgem1xVXJpSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS16bXEtcHViXCIpO1xuICAgICAgICAgICAgbGV0IHptcVVyaSA9IHptcVVyaUlkeCA+PSAwID8gY29uZmlnLmNtZFt6bXFVcmlJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCBwcm94eVVyaUlkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcHJveHlcIik7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0dXBQcm94eVVyaSA9IHByb3h5VXJpSWR4ID49IDAgPyBjb25maWcuY21kW3Byb3h5VXJpSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3NcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZy5jb3B5KCkuc2V0U2VydmVyKHt1cmk6IHVyaSwgdXNlcm5hbWU6IHVzZXJuYW1lLCBwYXNzd29yZDogcGFzc3dvcmQsIHptcVVyaTogem1xVXJpLCBwcm94eVVyaTogdGhpcy5zdGFydHVwUHJveHlVcmksIHJlamVjdFVuYXV0aG9yaXplZDogY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkfSk7XG4gICAgICAgICAgICBjb25maWcuY21kID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldFJwYy5jb25uZWN0VG9XYWxsZXRScGMoY29uZmlnKTtcbiAgICAgICAgICAgIHdhbGxldC5wcm9jZXNzID0gY2hpbGRQcm9jZXNzO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyByZXNvbHZlIHByb21pc2Ugd2l0aCBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3MgXG4gICAgICAgICAgICB0aGlzLmlzUmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZSh3YWxsZXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3RkZXJyXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRlcnIub24oJ2RhdGEnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIGNvbnNvbGUuZXJyb3IoZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIGV4aXRcbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwiZXhpdFwiLCBmdW5jdGlvbihjb2RlKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBwcm9jZXNzIHRlcm1pbmF0ZWQgd2l0aCBleGl0IGNvZGUgXCIgKyBjb2RlICsgKG91dHB1dCA/IFwiOlxcblxcblwiICsgb3V0cHV0IDogXCJcIikpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXJyb3JcbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgaWYgKGVyci5tZXNzYWdlLmluZGV4T2YoXCJFTk9FTlRcIikgPj0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGV4aXN0IGF0IHBhdGggJ1wiICsgY29uZmlnLmNtZFswXSArIFwiJ1wiKSk7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSB1bmNhdWdodCBleGNlcHRpb25cbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIiwgZnVuY3Rpb24oZXJyLCBvcmlnaW4pIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5jYXVnaHQgZXhjZXB0aW9uIGluIG1vbmVyby13YWxsZXQtcnBjIHByb2Nlc3M6IFwiICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3Iob3JpZ2luKTtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY2xlYXIoKSB7XG4gICAgdGhpcy5saXN0ZW5lckdlbmVyYXRpb24rKztcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIpIHRoaXMud2FsbGV0UG9sbGVyLnJlc2V0KCk7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gICAgZGVsZXRlIHRoaXMuYWRkcmVzc0NhY2hlO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgdGhpcy5wYXRoID0gdW5kZWZpbmVkO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QWNjb3VudEluZGljZXMoZ2V0U3ViYWRkcmVzc0luZGljZXM/OiBhbnkpIHtcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTtcbiAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgaW5kaWNlcy5zZXQoYWNjb3VudC5nZXRJbmRleCgpLCBnZXRTdWJhZGRyZXNzSW5kaWNlcyA/IGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc0luZGljZXMoYWNjb3VudC5nZXRJbmRleCgpKSA6IHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIHJldHVybiBpbmRpY2VzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0U3ViYWRkcmVzc0luZGljZXMoYWNjb3VudElkeCkge1xuICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NcIiwge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHh9KTtcbiAgICBmb3IgKGxldCBhZGRyZXNzIG9mIHJlc3AucmVzdWx0LmFkZHJlc3Nlcykgc3ViYWRkcmVzc0luZGljZXMucHVzaChhZGRyZXNzLmFkZHJlc3NfaW5kZXgpO1xuICAgIHJldHVybiBzdWJhZGRyZXNzSW5kaWNlcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldFRyYW5zZmVyc0F1eChxdWVyeTogTW9uZXJvVHJhbnNmZXJRdWVyeSkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHBhcmFtcyBmb3IgZ2V0X3RyYW5zZmVycyBycGMgY2FsbFxuICAgIGxldCB0eFF1ZXJ5ID0gcXVlcnkuZ2V0VHhRdWVyeSgpO1xuICAgIGxldCBjYW5CZUNvbmZpcm1lZCA9IHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldElzUmVsYXllZCgpICE9PSBmYWxzZTtcbiAgICBsZXQgY2FuQmVJblR4UG9vbCA9IHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEhlaWdodCgpID09PSB1bmRlZmluZWQgJiYgdHhRdWVyeS5nZXRNYXhIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4UXVlcnkuZ2V0SXNMb2NrZWQoKSAhPT0gZmFsc2U7XG4gICAgbGV0IGNhbkJlSW5jb21pbmcgPSBxdWVyeS5nZXRJc0luY29taW5nKCkgIT09IGZhbHNlICYmIHF1ZXJ5LmdldElzT3V0Z29pbmcoKSAhPT0gdHJ1ZSAmJiBxdWVyeS5nZXRIYXNEZXN0aW5hdGlvbnMoKSAhPT0gdHJ1ZTtcbiAgICBsZXQgY2FuQmVPdXRnb2luZyA9IHF1ZXJ5LmdldElzT3V0Z29pbmcoKSAhPT0gZmFsc2UgJiYgcXVlcnkuZ2V0SXNJbmNvbWluZygpICE9PSB0cnVlO1xuXG4gICAgLy8gY2hlY2sgaWYgZmV0Y2hpbmcgcG9vbCB0eHMgY29udHJhZGljdGVkIGJ5IGNvbmZpZ3VyYXRpb25cbiAgICBpZiAodHhRdWVyeS5nZXRJblR4UG9vbCgpID09PSB0cnVlICYmICFjYW5CZUluVHhQb29sKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgZmV0Y2ggcG9vbCB0cmFuc2FjdGlvbnMgYmVjYXVzZSBpdCBjb250cmFkaWN0cyBjb25maWd1cmF0aW9uXCIpO1xuICAgIH1cblxuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5pbiA9IGNhbkJlSW5jb21pbmcgJiYgY2FuQmVDb25maXJtZWQ7XG4gICAgcGFyYW1zLm91dCA9IGNhbkJlT3V0Z29pbmcgJiYgY2FuQmVDb25maXJtZWQ7XG4gICAgcGFyYW1zLnBvb2wgPSBjYW5CZUluY29taW5nICYmIGNhbkJlSW5UeFBvb2w7XG4gICAgcGFyYW1zLnBlbmRpbmcgPSBjYW5CZU91dGdvaW5nICYmIGNhbkJlSW5UeFBvb2w7XG4gICAgcGFyYW1zLmZhaWxlZCA9IHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJc0NvbmZpcm1lZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPSB0cnVlO1xuICAgIGlmICh0eFF1ZXJ5LmdldE1pbkhlaWdodCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eFF1ZXJ5LmdldE1pbkhlaWdodCgpID4gMCkgcGFyYW1zLm1pbl9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpIC0gMTsgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogd2FsbGV0Mjo6Z2V0X3BheW1lbnRzKCkgbWluX2hlaWdodCBpcyBleGNsdXNpdmUsIHNvIG1hbnVhbGx5IG9mZnNldCB0byBtYXRjaCBpbnRlbmRlZCByYW5nZSAoaXNzdWVzICM1NzUxLCAjNTU5OClcbiAgICAgIGVsc2UgcGFyYW1zLm1pbl9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpO1xuICAgIH1cbiAgICBpZiAodHhRdWVyeS5nZXRNYXhIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSBwYXJhbXMubWF4X2hlaWdodCA9IHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCk7XG4gICAgcGFyYW1zLmZpbHRlcl9ieV9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpICE9PSB1bmRlZmluZWQgfHwgdHhRdWVyeS5nZXRNYXhIZWlnaHQoKSAhPT0gdW5kZWZpbmVkO1xuICAgIGlmIChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkgPT09IHVuZGVmaW5lZCAmJiBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQsIFwiUXVlcnkgc3BlY2lmaWVzIGEgc3ViYWRkcmVzcyBpbmRleCBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIik7XG4gICAgICBwYXJhbXMuYWxsX2FjY291bnRzID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBxdWVyeS5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICAgIFxuICAgICAgLy8gc2V0IHN1YmFkZHJlc3MgaW5kaWNlcyBwYXJhbVxuICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gbmV3IFNldCgpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpICE9PSB1bmRlZmluZWQpIHN1YmFkZHJlc3NJbmRpY2VzLmFkZChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLm1hcChzdWJhZGRyZXNzSWR4ID0+IHN1YmFkZHJlc3NJbmRpY2VzLmFkZChzdWJhZGRyZXNzSWR4KSk7XG4gICAgICBpZiAoc3ViYWRkcmVzc0luZGljZXMuc2l6ZSkgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IEFycmF5LmZyb20oc3ViYWRkcmVzc0luZGljZXMpO1xuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB1bmlxdWUgdHhzIGFuZCBibG9ja3NcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBcbiAgICAvLyBidWlsZCB0eHMgdXNpbmcgYGdldF90cmFuc2ZlcnNgXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHJhbnNmZXJzXCIsIHBhcmFtcyk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJlc3AucmVzdWx0KSkge1xuICAgICAgZm9yIChsZXQgcnBjVHggb2YgcmVzcC5yZXN1bHRba2V5XSkge1xuICAgICAgICAvL2lmIChycGNUeC50eGlkID09PSBxdWVyeS5kZWJ1Z1R4SWQpIGNvbnNvbGUubG9nKHJwY1R4KTtcbiAgICAgICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlcihycGNUeCk7XG4gICAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSBhc3NlcnQodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSA+IC0xKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlcGxhY2UgdHJhbnNmZXIgYW1vdW50IHdpdGggZGVzdGluYXRpb24gc3VtXG4gICAgICAgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IGNvbmZpcm1lZCB0eCBmcm9tL3RvIHNhbWUgYWNjb3VudCBoYXMgYW1vdW50IDAgYnV0IGNhY2hlZCB0cmFuc2ZlcnNcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldElzUmVsYXllZCgpICYmICF0eC5nZXRJc0ZhaWxlZCgpICYmXG4gICAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkgJiYgdHguZ2V0T3V0Z29pbmdBbW91bnQoKSA9PT0gMG4pIHtcbiAgICAgICAgICBsZXQgb3V0Z29pbmdUcmFuc2ZlciA9IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKTtcbiAgICAgICAgICBsZXQgdHJhbnNmZXJUb3RhbCA9IEJpZ0ludCgwKTtcbiAgICAgICAgICBmb3IgKGxldCBkZXN0aW5hdGlvbiBvZiBvdXRnb2luZ1RyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpKSB0cmFuc2ZlclRvdGFsID0gdHJhbnNmZXJUb3RhbCArIGRlc3RpbmF0aW9uLmdldEFtb3VudCgpO1xuICAgICAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBbW91bnQodHJhbnNmZXJUb3RhbCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIG1lcmdlIHR4XG4gICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzb3J0IHR4cyBieSBibG9jayBoZWlnaHRcbiAgICBsZXQgdHhzOiBNb25lcm9UeFdhbGxldFtdID0gT2JqZWN0LnZhbHVlcyh0eE1hcCk7XG4gICAgdHhzLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVUeHNCeUhlaWdodCk7XG4gICAgXG4gICAgLy8gZmlsdGVyIGFuZCByZXR1cm4gdHJhbnNmZXJzXG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgXG4gICAgICAvLyB0eCBpcyBub3QgaW5jb21pbmcvb3V0Z29pbmcgdW5sZXNzIGFscmVhZHkgc2V0XG4gICAgICBpZiAodHguZ2V0SXNJbmNvbWluZygpID09PSB1bmRlZmluZWQpIHR4LnNldElzSW5jb21pbmcoZmFsc2UpO1xuICAgICAgaWYgKHR4LmdldElzT3V0Z29pbmcoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc091dGdvaW5nKGZhbHNlKTtcbiAgICAgIFxuICAgICAgLy8gc29ydCBpbmNvbWluZyB0cmFuc2ZlcnNcbiAgICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZUluY29taW5nVHJhbnNmZXJzKTtcbiAgICAgIFxuICAgICAgLy8gY29sbGVjdCBxdWVyaWVkIHRyYW5zZmVycywgZXJhc2UgaWYgZXhjbHVkZWRcbiAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmZpbHRlclRyYW5zZmVycyhxdWVyeSkpIHtcbiAgICAgICAgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyByZW1vdmUgdHhzIHdpdGhvdXQgcmVxdWVzdGVkIHRyYW5zZmVyXG4gICAgICBpZiAodHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PT0gdW5kZWZpbmVkICYmIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0eC5nZXRCbG9jaygpLmdldFR4cygpLnNwbGljZSh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldE91dHB1dHNBdXgocXVlcnkpIHtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzIHRvIGJlIHF1ZXJpZWRcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTtcbiAgICBpZiAocXVlcnkuZ2V0QWNjb3VudEluZGV4KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gbmV3IFNldCgpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpICE9PSB1bmRlZmluZWQpIHN1YmFkZHJlc3NJbmRpY2VzLmFkZChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLm1hcChzdWJhZGRyZXNzSWR4ID0+IHN1YmFkZHJlc3NJbmRpY2VzLmFkZChzdWJhZGRyZXNzSWR4KSk7XG4gICAgICBpbmRpY2VzLnNldChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMuc2l6ZSA/IEFycmF5LmZyb20oc3ViYWRkcmVzc0luZGljZXMpIDogdW5kZWZpbmVkKTsgIC8vIHVuZGVmaW5lZCB3aWxsIGZldGNoIGZyb20gYWxsIHN1YmFkZHJlc3Nlc1xuICAgIH0gZWxzZSB7XG4gICAgICBhc3NlcnQuZXF1YWwocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCksIHVuZGVmaW5lZCwgXCJRdWVyeSBzcGVjaWZpZXMgYSBzdWJhZGRyZXNzIGluZGV4IGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKVxuICAgICAgYXNzZXJ0KHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCB8fCBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCwgXCJRdWVyeSBzcGVjaWZpZXMgc3ViYWRkcmVzcyBpbmRpY2VzIGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKTtcbiAgICAgIGluZGljZXMgPSBhd2FpdCB0aGlzLmdldEFjY291bnRJbmRpY2VzKCk7ICAvLyBmZXRjaCBhbGwgYWNjb3VudCBpbmRpY2VzIHdpdGhvdXQgc3ViYWRkcmVzc2VzXG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHVuaXF1ZSB0eHMgYW5kIGJsb2Nrc1xuICAgIGxldCB0eE1hcCA9IHt9O1xuICAgIGxldCBibG9ja01hcCA9IHt9O1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdHhzIHdpdGggb3V0cHV0cyBmb3IgZWFjaCBpbmRpY2F0ZWQgYWNjb3VudCB1c2luZyBgaW5jb21pbmdfdHJhbnNmZXJzYCBycGMgY2FsbFxuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy50cmFuc2Zlcl90eXBlID0gcXVlcnkuZ2V0SXNTcGVudCgpID09PSB0cnVlID8gXCJ1bmF2YWlsYWJsZVwiIDogcXVlcnkuZ2V0SXNTcGVudCgpID09PSBmYWxzZSA/IFwiYXZhaWxhYmxlXCIgOiBcImFsbFwiO1xuICAgIHBhcmFtcy52ZXJib3NlID0gdHJ1ZTtcbiAgICBmb3IgKGxldCBhY2NvdW50SWR4IG9mIGluZGljZXMua2V5cygpKSB7XG4gICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gYWNjb3VudElkeDtcbiAgICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBpbmRpY2VzLmdldChhY2NvdW50SWR4KTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW5jb21pbmdfdHJhbnNmZXJzXCIsIHBhcmFtcyk7XG4gICAgICBcbiAgICAgIC8vIGNvbnZlcnQgcmVzcG9uc2UgdG8gdHhzIHdpdGggb3V0cHV0cyBhbmQgbWVyZ2VcbiAgICAgIGlmIChyZXNwLnJlc3VsdC50cmFuc2ZlcnMgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG4gICAgICBmb3IgKGxldCBycGNPdXRwdXQgb2YgcmVzcC5yZXN1bHQudHJhbnNmZXJzKSB7XG4gICAgICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoT3V0cHV0KHJwY091dHB1dCk7XG4gICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzb3J0IHR4cyBieSBibG9jayBoZWlnaHRcbiAgICBsZXQgdHhzOiBNb25lcm9UeFdhbGxldFtdID0gT2JqZWN0LnZhbHVlcyh0eE1hcCk7XG4gICAgdHhzLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVUeHNCeUhlaWdodCk7XG4gICAgXG4gICAgLy8gY29sbGVjdCBxdWVyaWVkIG91dHB1dHNcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgXG4gICAgICAvLyBzb3J0IG91dHB1dHNcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdHguZ2V0T3V0cHV0cygpLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVPdXRwdXRzKTtcbiAgICAgIFxuICAgICAgLy8gY29sbGVjdCBxdWVyaWVkIG91dHB1dHMsIGVyYXNlIGlmIGV4Y2x1ZGVkXG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZmlsdGVyT3V0cHV0cyhxdWVyeSkpIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgXG4gICAgICAvLyByZW1vdmUgZXhjbHVkZWQgdHhzIGZyb20gYmxvY2tcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgPT09IHVuZGVmaW5lZCAmJiB0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29tbW9uIG1ldGhvZCB0byBnZXQga2V5IGltYWdlcy5cbiAgICogXG4gICAqIEBwYXJhbSBhbGwgLSBwZWNpZmllcyB0byBnZXQgYWxsIHhvciBvbmx5IG5ldyBpbWFnZXMgZnJvbSBsYXN0IGltcG9ydFxuICAgKiBAcmV0dXJuIHtNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdH0gdGhlIGtleSBpbWFnZXMgYW5kIHRoZWlyIG9mZnNldCBhbW9uZyB0aGUgd2FsbGV0J3Mgb3V0cHV0c1xuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIHJwY0V4cG9ydEtleUltYWdlcyhhbGwpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfa2V5X2ltYWdlc1wiLCB7YWxsOiBhbGx9KTtcbiAgICBsZXQga2V5SW1hZ2VzID0gKHJlc3AucmVzdWx0LnNpZ25lZF9rZXlfaW1hZ2VzIHx8IFtdKS5tYXAocnBjSW1hZ2UgPT4gbmV3IE1vbmVyb0tleUltYWdlKHJwY0ltYWdlLmtleV9pbWFnZSwgcnBjSW1hZ2Uuc2lnbmF0dXJlKSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCgpLnNldE9mZnNldChyZXNwLnJlc3VsdC5vZmZzZXQpLnNldEtleUltYWdlcyhrZXlJbWFnZXMpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgcnBjU3dlZXBBY2NvdW50KGNvbmZpZzogTW9uZXJvVHhDb25maWcpIHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBzd2VlcCBjb25maWdcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYW4gYWNjb3VudCBpbmRleCB0byBzd2VlcCBmcm9tXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoICE9IDEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBleGFjdGx5IG9uZSBkZXN0aW5hdGlvbiB0byBzd2VlcCB0b1wiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZGVzdGluYXRpb24gYWRkcmVzcyB0byBzd2VlcCB0b1wiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFtb3VudCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IGFtb3VudCBpbiBzd2VlcCBjb25maWdcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRLZXlJbWFnZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIktleSBpbWFnZSBkZWZpbmVkOyB1c2Ugc3dlZXBPdXRwdXQoKSB0byBzd2VlcCBhbiBvdXRwdXQgYnkgaXRzIGtleSBpbWFnZVwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCAmJiBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkVtcHR5IGxpc3QgZ2l2ZW4gZm9yIHN1YmFkZHJlc3NlcyBpbmRpY2VzIHRvIHN3ZWVwXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcygpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3dlZXAgZWFjaCBzdWJhZGRyZXNzIHdpdGggUlBDIGBzd2VlcF9hbGxgXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkgIT09IHVuZGVmaW5lZCAmJiBjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkubGVuZ3RoID4gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3dlZXBpbmcgb3V0cHV0IGRvZXMgbm90IHN1cHBvcnQgc3VidHJhY3RpbmcgZmVlcyBmcm9tIGRlc3RpbmF0aW9uc1wiKTtcbiAgICBcbiAgICAvLyBzd2VlcCBmcm9tIGFsbCBzdWJhZGRyZXNzZXMgaWYgbm90IG90aGVyd2lzZSBkZWZpbmVkXG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbmZpZy5zZXRTdWJhZGRyZXNzSW5kaWNlcyhbXSk7XG4gICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKSkpIHtcbiAgICAgICAgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJObyBzdWJhZGRyZXNzZXMgdG8gc3dlZXAgZnJvbVwiKTtcbiAgICBcbiAgICAvLyBjb21tb24gY29uZmlnIHBhcmFtc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIGxldCByZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpID09PSB0cnVlO1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gY29uZmlnLmdldEFjY291bnRJbmRleCgpO1xuICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCk7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWcuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWcuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZy5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gIXJlbGF5O1xuICAgIHBhcmFtcy5iZWxvd19hbW91bnQgPSBjb25maWcuZ2V0QmVsb3dBbW91bnQoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2tleXMgPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBpbnZva2Ugd2FsbGV0IHJwYyBgc3dlZXBfYWxsYFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfYWxsXCIsIHBhcmFtcyk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGZyb20gcmVzcG9uc2VcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCwgdW5kZWZpbmVkLCBjb25maWcpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgcmVtYWluaW5nIGtub3duIGZpZWxkc1xuICAgIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB7XG4gICAgICB0eC5zZXRJc0xvY2tlZCh0cnVlKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICB0eC5zZXRSZWxheShyZWxheSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChyZWxheSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQocmVsYXkpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIGxldCB0cmFuc2ZlciA9IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKTtcbiAgICAgIHRyYW5zZmVyLnNldEFjY291bnRJbmRleChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkpO1xuICAgICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSkgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkpO1xuICAgICAgbGV0IGRlc3RpbmF0aW9uID0gbmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksIEJpZ0ludCh0cmFuc2Zlci5nZXRBbW91bnQoKSkpO1xuICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKFtkZXN0aW5hdGlvbl0pO1xuICAgICAgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgICB0eC5zZXRQYXltZW50SWQoY29uZmlnLmdldFBheW1lbnRJZCgpKTtcbiAgICAgIGlmICh0eC5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0VW5sb2NrVGltZSgwbik7XG4gICAgICBpZiAodHguZ2V0UmVsYXkoKSkge1xuICAgICAgICBpZiAodHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgrbmV3IERhdGUoKS5nZXRUaW1lKCkpOyAgLy8gVE9ETyAobW9uZXJvLXdhbGxldC1ycGMpOiBwcm92aWRlIHRpbWVzdGFtcCBvbiByZXNwb25zZTsgdW5jb25maXJtZWQgdGltZXN0YW1wcyB2YXJ5XG4gICAgICAgIGlmICh0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbigpID09PSB1bmRlZmluZWQpIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0LmdldFR4cygpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgPT0gdW5kZWZpbmVkICYmIHRoaXMubGlzdGVuZXJzLmxlbmd0aCkgdGhpcy53YWxsZXRQb2xsZXIgPSBuZXcgV2FsbGV0UG9sbGVyKHRoaXMpO1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkKSB0aGlzLndhbGxldFBvbGxlci5zZXRJc1BvbGxpbmcodGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQb2xsIGlmIGxpc3RlbmluZy5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBwb2xsKCkge1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2FsbGV0UG9sbGVyLmlzUG9sbGluZykgYXdhaXQgdGhpcy53YWxsZXRQb2xsZXIucG9sbCgpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgU1RBVElDIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVDb25maWcodXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogTW9uZXJvV2FsbGV0Q29uZmlnIHtcbiAgICBsZXQgY29uZmlnOiB1bmRlZmluZWQgfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gPSB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbmZpZyA9PT0gXCJzdHJpbmdcIiB8fCAodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPikudXJpKSBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHtzZXJ2ZXI6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29uZmlnIGFzIHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4sIHVzZXJuYW1lLCBwYXNzd29yZCl9KTtcbiAgICBlbHNlIGlmIChHZW5VdGlscy5pc0FycmF5KHVyaU9yQ29uZmlnKSkgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh7Y21kOiB1cmlPckNvbmZpZyBhcyBzdHJpbmdbXX0pO1xuICAgIGVsc2UgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pO1xuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlciA9PT0gdW5kZWZpbmVkKSBjb25maWcucHJveHlUb1dvcmtlciA9IHRydWU7XG4gICAgcmV0dXJuIGNvbmZpZyBhcyBNb25lcm9XYWxsZXRDb25maWc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZW1vdmUgY3JpdGVyaWEgd2hpY2ggcmVxdWlyZXMgbG9va2luZyB1cCBvdGhlciB0cmFuc2ZlcnMvb3V0cHV0cyB0b1xuICAgKiBmdWxmaWxsIHF1ZXJ5LlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBxdWVyeSAtIHRoZSBxdWVyeSB0byBkZWNvbnRleHR1YWxpemVcbiAgICogQHJldHVybiB7TW9uZXJvVHhRdWVyeX0gYSByZWZlcmVuY2UgdG8gdGhlIHF1ZXJ5IGZvciBjb252ZW5pZW5jZVxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBkZWNvbnRleHR1YWxpemUocXVlcnkpIHtcbiAgICBxdWVyeS5zZXRJc0luY29taW5nKHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0SXNPdXRnb2luZyh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldFRyYW5zZmVyUXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRJbnB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0T3V0cHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gcXVlcnk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgaXNDb250ZXh0dWFsKHF1ZXJ5KSB7XG4gICAgaWYgKCFxdWVyeSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghcXVlcnkuZ2V0VHhRdWVyeSgpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRJc0luY29taW5nKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7IC8vIHJlcXVpcmVzIGdldHRpbmcgb3RoZXIgdHJhbnNmZXJzXG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRJc091dGdvaW5nKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKHF1ZXJ5IGluc3RhbmNlb2YgTW9uZXJvVHJhbnNmZXJRdWVyeSkge1xuICAgICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRPdXRwdXRRdWVyeSgpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIG91dHB1dHNcbiAgICB9IGVsc2UgaWYgKHF1ZXJ5IGluc3RhbmNlb2YgTW9uZXJvT3V0cHV0UXVlcnkpIHtcbiAgICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0VHJhbnNmZXJRdWVyeSgpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIHRyYW5zZmVyc1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJxdWVyeSBtdXN0IGJlIHR4IG9yIHRyYW5zZmVyIHF1ZXJ5XCIpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0FjY291bnQocnBjQWNjb3VudCkge1xuICAgIGxldCBhY2NvdW50ID0gbmV3IE1vbmVyb0FjY291bnQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQWNjb3VudCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNBY2NvdW50W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFjY291bnRfaW5kZXhcIikgYWNjb3VudC5zZXRJbmRleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhbGFuY2VcIikgYWNjb3VudC5zZXRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZF9iYWxhbmNlXCIpIGFjY291bnQuc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYXNlX2FkZHJlc3NcIikgYWNjb3VudC5zZXRQcmltYXJ5QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhZ1wiKSBhY2NvdW50LnNldFRhZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhYmVsXCIpIHsgfSAvLyBsYWJlbCBiZWxvbmdzIHRvIGZpcnN0IHN1YmFkZHJlc3NcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGFjY291bnQgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgaWYgKFwiXCIgPT09IGFjY291bnQuZ2V0VGFnKCkpIGFjY291bnQuc2V0VGFnKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIGFjY291bnQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcykge1xuICAgIGxldCBzdWJhZGRyZXNzID0gbmV3IE1vbmVyb1N1YmFkZHJlc3MoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjU3ViYWRkcmVzcykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNTdWJhZGRyZXNzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFjY291bnRfaW5kZXhcIikgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzX2luZGV4XCIpIHN1YmFkZHJlc3Muc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzXCIpIHN1YmFkZHJlc3Muc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhbGFuY2VcIikgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZF9iYWxhbmNlXCIpIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fdW5zcGVudF9vdXRwdXRzXCIpIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYWJlbFwiKSB7IGlmICh2YWwpIHN1YmFkZHJlc3Muc2V0TGFiZWwodmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVzZWRcIikgc3ViYWRkcmVzcy5zZXRJc1VzZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja3NfdG9fdW5sb2NrXCIpIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2sodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PSBcInRpbWVfdG9fdW5sb2NrXCIpIHt9ICAvLyBpZ25vcmluZ1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgc3ViYWRkcmVzcyBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gc3ViYWRkcmVzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgc2VudCB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIFRPRE86IHJlbW92ZSBjb3B5RGVzdGluYXRpb25zIGFmdGVyID4xOC4zLjEgd2hlbiBzdWJ0cmFjdEZlZUZyb20gZnVsbHkgc3VwcG9ydGVkXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4Q29uZmlnfSBjb25maWcgLSBzZW5kIGNvbmZpZ1xuICAgKiBAcGFyYW0ge01vbmVyb1R4V2FsbGV0fSBbdHhdIC0gZXhpc3RpbmcgdHJhbnNhY3Rpb24gdG8gaW5pdGlhbGl6ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gY29weURlc3RpbmF0aW9ucyAtIGNvcGllcyBjb25maWcgZGVzdGluYXRpb25zIGlmIHRydWVcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IGlzIHRoZSBpbml0aWFsaXplZCBzZW5kIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGluaXRTZW50VHhXYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPiwgdHgsIGNvcHlEZXN0aW5hdGlvbnMpIHtcbiAgICBpZiAoIXR4KSB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIGxldCByZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpID09PSB0cnVlO1xuICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgdHguc2V0SW5UeFBvb2wocmVsYXkpO1xuICAgIHR4LnNldFJlbGF5KHJlbGF5KTtcbiAgICB0eC5zZXRJc1JlbGF5ZWQocmVsYXkpO1xuICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIHR4LnNldElzTG9ja2VkKHRydWUpO1xuICAgIHR4LnNldFJpbmdTaXplKE1vbmVyb1V0aWxzLlJJTkdfU0laRSk7XG4gICAgbGV0IHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKTtcbiAgICB0cmFuc2Zlci5zZXRUeCh0eCk7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICYmIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSkgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkuc2xpY2UoMCkpOyAvLyB3ZSBrbm93IHNyYyBzdWJhZGRyZXNzIGluZGljZXMgaWZmIGNvbmZpZyBzcGVjaWZpZXMgMVxuICAgIGlmIChjb3B5RGVzdGluYXRpb25zKSB7XG4gICAgICBsZXQgZGVzdENvcGllcyA9IFtdO1xuICAgICAgZm9yIChsZXQgZGVzdCBvZiBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkpIGRlc3RDb3BpZXMucHVzaChkZXN0LmNvcHkoKSk7XG4gICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoZGVzdENvcGllcyk7XG4gICAgfVxuICAgIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgIHR4LnNldFBheW1lbnRJZChjb25maWcuZ2V0UGF5bWVudElkKCkpO1xuICAgIGlmICh0eC5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0VW5sb2NrVGltZSgwbik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZWxheSgpKSB7XG4gICAgICBpZiAodHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgrbmV3IERhdGUoKS5nZXRUaW1lKCkpOyAgLy8gVE9ETyAobW9uZXJvLXdhbGxldC1ycGMpOiBwcm92aWRlIHRpbWVzdGFtcCBvbiByZXNwb25zZTsgdW5jb25maXJtZWQgdGltZXN0YW1wcyB2YXJ5XG4gICAgICBpZiAodHguZ2V0SXNEb3VibGVTcGVuZFNlZW4oKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgdHggc2V0IGZyb20gYSBSUEMgbWFwIGV4Y2x1ZGluZyB0eHMuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjTWFwIC0gbWFwIHRvIGluaXRpYWxpemUgdGhlIHR4IHNldCBmcm9tXG4gICAqIEByZXR1cm4gTW9uZXJvVHhTZXQgLSBpbml0aWFsaXplZCB0eCBzZXRcbiAgICogQHJldHVybiB0aGUgcmVzdWx0aW5nIHR4IHNldFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhTZXQocnBjTWFwKSB7XG4gICAgbGV0IHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KCk7XG4gICAgdHhTZXQuc2V0TXVsdGlzaWdUeEhleChycGNNYXAubXVsdGlzaWdfdHhzZXQpO1xuICAgIHR4U2V0LnNldFVuc2lnbmVkVHhIZXgocnBjTWFwLnVuc2lnbmVkX3R4c2V0KTtcbiAgICB0eFNldC5zZXRTaWduZWRUeEhleChycGNNYXAuc2lnbmVkX3R4c2V0KTtcbiAgICBpZiAodHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0TXVsdGlzaWdUeEhleCh1bmRlZmluZWQpO1xuICAgIGlmICh0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCkubGVuZ3RoID09PSAwKSB0eFNldC5zZXRVbnNpZ25lZFR4SGV4KHVuZGVmaW5lZCk7XG4gICAgaWYgKHR4U2V0LmdldFNpZ25lZFR4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRTaWduZWRUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0U2lnbmVkVHhIZXgodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIE1vbmVyb1R4U2V0IGZyb20gYSBsaXN0IG9mIHJwYyB0eHMuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHhzIC0gcnBjIHR4cyB0byBpbml0aWFsaXplIHRoZSBzZXQgZnJvbVxuICAgKiBAcGFyYW0gdHhzIC0gZXhpc3RpbmcgdHhzIHRvIGZ1cnRoZXIgaW5pdGlhbGl6ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB0aGUgY29udmVydGVkIHR4IHNldFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocnBjVHhzOiBhbnksIHR4cz86IGFueSwgY29uZmlnPzogYW55KSB7XG4gICAgXG4gICAgLy8gYnVpbGQgc2hhcmVkIHR4IHNldFxuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhTZXQocnBjVHhzKTtcblxuICAgIC8vIGdldCBudW1iZXIgb2YgdHhzXG4gICAgbGV0IG51bVR4cyA9IHJwY1R4cy5mZWVfbGlzdCA/IHJwY1R4cy5mZWVfbGlzdC5sZW5ndGggOiBycGNUeHMudHhfaGFzaF9saXN0ID8gcnBjVHhzLnR4X2hhc2hfbGlzdC5sZW5ndGggOiAwO1xuICAgIFxuICAgIC8vIGRvbmUgaWYgcnBjIHJlc3BvbnNlIGNvbnRhaW5zIG5vIHR4c1xuICAgIGlmIChudW1UeHMgPT09IDApIHtcbiAgICAgIGFzc2VydC5lcXVhbCh0eHMsIHVuZGVmaW5lZCk7XG4gICAgICByZXR1cm4gdHhTZXQ7XG4gICAgfVxuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGlmIG5vbmUgZ2l2ZW5cbiAgICBpZiAodHhzKSB0eFNldC5zZXRUeHModHhzKTtcbiAgICBlbHNlIHtcbiAgICAgIHR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UeHM7IGkrKykgdHhzLnB1c2gobmV3IE1vbmVyb1R4V2FsbGV0KCkpO1xuICAgIH1cbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIHR4LnNldFR4U2V0KHR4U2V0KTtcbiAgICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgfVxuICAgIHR4U2V0LnNldFR4cyh0eHMpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGZyb20gcnBjIGxpc3RzXG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1R4cykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUeHNba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhfaGFzaF9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0SGFzaCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2tleV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0S2V5KHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfYmxvYl9saXN0XCIgfHwga2V5ID09PSBcInR4X3Jhd19saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0RnVsbEhleCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X21ldGFkYXRhX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRNZXRhZGF0YSh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0RmVlKEJpZ0ludCh2YWxbaV0pKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldFdlaWdodCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9saXN0XCIpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAodHhzW2ldLmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PSB1bmRlZmluZWQpIHR4c1tpXS5zZXRPdXRnb2luZ1RyYW5zZmVyKG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHhzW2ldKSk7XG4gICAgICAgICAgdHhzW2ldLmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBbW91bnQoQmlnSW50KHZhbFtpXSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibXVsdGlzaWdfdHhzZXRcIiB8fCBrZXkgPT09IFwidW5zaWduZWRfdHhzZXRcIiB8fCBrZXkgPT09IFwic2lnbmVkX3R4c2V0XCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlbnRfa2V5X2ltYWdlc19saXN0XCIpIHtcbiAgICAgICAgbGV0IGlucHV0S2V5SW1hZ2VzTGlzdCA9IHZhbDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dEtleUltYWdlc0xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR4c1tpXS5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgICB0eHNbaV0uc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgICBmb3IgKGxldCBpbnB1dEtleUltYWdlIG9mIGlucHV0S2V5SW1hZ2VzTGlzdFtpXVtcImtleV9pbWFnZXNcIl0pIHtcbiAgICAgICAgICAgIHR4c1tpXS5nZXRJbnB1dHMoKS5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKS5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UoKS5zZXRIZXgoaW5wdXRLZXlJbWFnZSkpLnNldFR4KHR4c1tpXSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNfYnlfZGVzdF9saXN0XCIpIHtcbiAgICAgICAgbGV0IGFtb3VudHNCeURlc3RMaXN0ID0gdmFsO1xuICAgICAgICBsZXQgZGVzdGluYXRpb25JZHggPSAwO1xuICAgICAgICBmb3IgKGxldCB0eElkeCA9IDA7IHR4SWR4IDwgYW1vdW50c0J5RGVzdExpc3QubGVuZ3RoOyB0eElkeCsrKSB7XG4gICAgICAgICAgbGV0IGFtb3VudHNCeURlc3QgPSBhbW91bnRzQnlEZXN0TGlzdFt0eElkeF1bXCJhbW91bnRzXCJdO1xuICAgICAgICAgIGlmICh0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PT0gdW5kZWZpbmVkKSB0eHNbdHhJZHhdLnNldE91dGdvaW5nVHJhbnNmZXIobmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eHNbdHhJZHhdKSk7XG4gICAgICAgICAgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0RGVzdGluYXRpb25zKFtdKTtcbiAgICAgICAgICBmb3IgKGxldCBhbW91bnQgb2YgYW1vdW50c0J5RGVzdCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGggPT09IDEpIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnQpKSk7IC8vIHN3ZWVwaW5nIGNhbiBjcmVhdGUgbXVsdGlwbGUgdHhzIHdpdGggb25lIGFkZHJlc3NcbiAgICAgICAgICAgIGVsc2UgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpW2Rlc3RpbmF0aW9uSWR4KytdLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudCkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHRyYW5zYWN0aW9uIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgcnBjIHR4IHdpdGggYSB0cmFuc2ZlciB0byBhIHR4IHNldCB3aXRoIGEgdHggYW5kIHRyYW5zZmVyLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4IC0gcnBjIHR4IHRvIGJ1aWxkIGZyb21cbiAgICogQHBhcmFtIHR4IC0gZXhpc3RpbmcgdHggdG8gY29udGludWUgaW5pdGlhbGl6aW5nIChvcHRpb25hbClcbiAgICogQHBhcmFtIGlzT3V0Z29pbmcgLSBzcGVjaWZpZXMgaWYgdGhlIHR4IGlzIG91dGdvaW5nIGlmIHRydWUsIGluY29taW5nIGlmIGZhbHNlLCBvciBkZWNvZGVzIGZyb20gdHlwZSBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHRoZSBpbml0aWFsaXplZCB0eCBzZXQgd2l0aCBhIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFRvVHhTZXQocnBjVHgsIHR4LCBpc091dGdvaW5nLCBjb25maWcpIHtcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4U2V0KHJwY1R4KTtcbiAgICB0eFNldC5zZXRUeHMoW01vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHgsIHR4LCBpc091dGdvaW5nLCBjb25maWcpLnNldFR4U2V0KHR4U2V0KV0pO1xuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEJ1aWxkcyBhIE1vbmVyb1R4V2FsbGV0IGZyb20gYSBSUEMgdHguXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHggLSBycGMgdHggdG8gYnVpbGQgZnJvbVxuICAgKiBAcGFyYW0gdHggLSBleGlzdGluZyB0eCB0byBjb250aW51ZSBpbml0aWFsaXppbmcgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gaXNPdXRnb2luZyAtIHNwZWNpZmllcyBpZiB0aGUgdHggaXMgb3V0Z29pbmcgaWYgdHJ1ZSwgaW5jb21pbmcgaWYgZmFsc2UsIG9yIGRlY29kZXMgZnJvbSB0eXBlIGlmIHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSBpcyB0aGUgaW5pdGlhbGl6ZWQgdHhcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4OiBhbnksIHR4PzogYW55LCBpc091dGdvaW5nPzogYW55LCBjb25maWc/OiBhbnkpIHsgIC8vIFRPRE86IGNoYW5nZSBldmVyeXRoaW5nIHRvIHNhZmUgc2V0XG4gICAgICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggdG8gcmV0dXJuXG4gICAgaWYgKCF0eCkgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHN0YXRlIGZyb20gcnBjIHR5cGVcbiAgICBpZiAocnBjVHgudHlwZSAhPT0gdW5kZWZpbmVkKSBpc091dGdvaW5nID0gTW9uZXJvV2FsbGV0UnBjLmRlY29kZVJwY1R5cGUocnBjVHgudHlwZSwgdHgpO1xuICAgIGVsc2UgYXNzZXJ0LmVxdWFsKHR5cGVvZiBpc091dGdvaW5nLCBcImJvb2xlYW5cIiwgXCJNdXN0IGluZGljYXRlIGlmIHR4IGlzIG91dGdvaW5nICh0cnVlKSB4b3IgaW5jb21pbmcgKGZhbHNlKSBzaW5jZSB1bmtub3duXCIpO1xuICAgIFxuICAgIC8vIFRPRE86IHNhZmUgc2V0XG4gICAgLy8gaW5pdGlhbGl6ZSByZW1haW5pbmcgZmllbGRzICBUT0RPOiBzZWVtcyB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGNvbW1vbiBmdW5jdGlvbiB3aXRoIERhZW1vblJwYy5jb252ZXJ0UnBjVHhcbiAgICBsZXQgaGVhZGVyO1xuICAgIGxldCB0cmFuc2ZlcjtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVHgpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVHhba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhpZFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlXCIpIHR4LnNldEZlZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm90ZVwiKSB7IGlmICh2YWwpIHR4LnNldE5vdGUodmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2tleVwiKSB0eC5zZXRLZXkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eXBlXCIpIHsgfSAvLyB0eXBlIGFscmVhZHkgaGFuZGxlZFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X3NpemVcIikgdHguc2V0U2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja190aW1lXCIpIHR4LnNldFVubG9ja1RpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRcIikgdHguc2V0V2VpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9ja2VkXCIpIHR4LnNldElzTG9ja2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfYmxvYlwiKSB0eC5zZXRGdWxsSGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfbWV0YWRhdGFcIikgdHguc2V0TWV0YWRhdGEodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkb3VibGVfc3BlbmRfc2VlblwiKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2Vlbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiIHx8IGtleSA9PT0gXCJoZWlnaHRcIikge1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgICBoZWFkZXIuc2V0SGVpZ2h0KHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0aW1lc3RhbXBcIikge1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgICBoZWFkZXIuc2V0VGltZXN0YW1wKHZhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gdGltZXN0YW1wIG9mIHVuY29uZmlybWVkIHR4IGlzIGN1cnJlbnQgcmVxdWVzdCB0aW1lXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjb25maXJtYXRpb25zXCIpIHR4LnNldE51bUNvbmZpcm1hdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWdnZXN0ZWRfY29uZmlybWF0aW9uc190aHJlc2hvbGRcIikge1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIGlmICghaXNPdXRnb2luZykgdHJhbnNmZXIuc2V0TnVtU3VnZ2VzdGVkQ29uZmlybWF0aW9ucyh2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudFwiKSB7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzXCIpIHt9ICAvLyBpZ25vcmluZywgYW1vdW50cyBzdW0gdG8gYW1vdW50XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSB7XG4gICAgICAgIGlmICghaXNPdXRnb2luZykge1xuICAgICAgICAgIGlmICghdHJhbnNmZXIpIHRyYW5zZmVyID0gbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKS5zZXRUeCh0eCk7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGF5bWVudF9pZFwiKSB7XG4gICAgICAgIGlmIChcIlwiICE9PSB2YWwgJiYgTW9uZXJvVHhXYWxsZXQuREVGQVVMVF9QQVlNRU5UX0lEICE9PSB2YWwpIHR4LnNldFBheW1lbnRJZCh2YWwpOyAgLy8gZGVmYXVsdCBpcyB1bmRlZmluZWRcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGV4XCIpIGFzc2VydChycGNUeC5zdWJhZGRyX2luZGljZXMpOyAgLy8gaGFuZGxlZCBieSBzdWJhZGRyX2luZGljZXNcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGljZXNcIikge1xuICAgICAgICBpZiAoIXRyYW5zZmVyKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgbGV0IHJwY0luZGljZXMgPSB2YWw7XG4gICAgICAgIHRyYW5zZmVyLnNldEFjY291bnRJbmRleChycGNJbmRpY2VzWzBdLm1ham9yKTtcbiAgICAgICAgaWYgKGlzT3V0Z29pbmcpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgICBmb3IgKGxldCBycGNJbmRleCBvZiBycGNJbmRpY2VzKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKHJwY0luZGV4Lm1pbm9yKTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kaWNlcyhzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsKHJwY0luZGljZXMubGVuZ3RoLCAxKTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kZXgocnBjSW5kaWNlc1swXS5taW5vcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkZXN0aW5hdGlvbnNcIiB8fCBrZXkgPT0gXCJyZWNpcGllbnRzXCIpIHtcbiAgICAgICAgYXNzZXJ0KGlzT3V0Z29pbmcpO1xuICAgICAgICBsZXQgZGVzdGluYXRpb25zID0gW107XG4gICAgICAgIGZvciAobGV0IHJwY0Rlc3RpbmF0aW9uIG9mIHZhbCkge1xuICAgICAgICAgIGxldCBkZXN0aW5hdGlvbiA9IG5ldyBNb25lcm9EZXN0aW5hdGlvbigpO1xuICAgICAgICAgIGRlc3RpbmF0aW9ucy5wdXNoKGRlc3RpbmF0aW9uKTtcbiAgICAgICAgICBmb3IgKGxldCBkZXN0aW5hdGlvbktleSBvZiBPYmplY3Qua2V5cyhycGNEZXN0aW5hdGlvbikpIHtcbiAgICAgICAgICAgIGlmIChkZXN0aW5hdGlvbktleSA9PT0gXCJhZGRyZXNzXCIpIGRlc3RpbmF0aW9uLnNldEFkZHJlc3MocnBjRGVzdGluYXRpb25bZGVzdGluYXRpb25LZXldKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKGRlc3RpbmF0aW9uS2V5ID09PSBcImFtb3VudFwiKSBkZXN0aW5hdGlvbi5zZXRBbW91bnQoQmlnSW50KHJwY0Rlc3RpbmF0aW9uW2Rlc3RpbmF0aW9uS2V5XSkpO1xuICAgICAgICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNhY3Rpb24gZGVzdGluYXRpb24gZmllbGQ6IFwiICsgZGVzdGluYXRpb25LZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2Zlcih7dHg6IHR4fSk7XG4gICAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhkZXN0aW5hdGlvbnMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNvdXJjZXNcIikge1xuICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR4LmdldElucHV0cygpID09PSB1bmRlZmluZWQpO1xuICAgICAgICB0eC5zZXRJbnB1dHMoW10pO1xuICAgICAgICBmb3IgKGxldCBycGNTb3VyY2Ugb2YgdmFsKSB7XG4gICAgICAgICAgbGV0IGlucHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCgpLnNldFR4KHR4KTtcbiAgICAgICAgICBpbnB1dC5zZXRBbW91bnQoQmlnSW50KHJwY1NvdXJjZS5hbW91bnQpKTtcbiAgICAgICAgICBpbnB1dC5zZXRJbmRleChycGNTb3VyY2UuZ2xvYmFsX2luZGV4KTtcbiAgICAgICAgICBpZiAocnBjU291cmNlLnB1YmtleSAhPT0gdW5kZWZpbmVkKSBpbnB1dC5zZXRTdGVhbHRoUHVibGljS2V5KHJwY1NvdXJjZS5wdWJrZXkuc3Vic3RyaW5nKDAsIDY0KSk7IC8vIGRlc3Qga2V5IG9mIGRlc3R8fG1hc2tcbiAgICAgICAgICB0eC5nZXRJbnB1dHMoKS5wdXNoKGlucHV0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm11bHRpc2lnX3R4c2V0XCIgJiYgdmFsICE9PSB1bmRlZmluZWQpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlOyB0aGlzIG1ldGhvZCBvbmx5IGJ1aWxkcyBhIHR4IHdhbGxldFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVuc2lnbmVkX3R4c2V0XCIgJiYgdmFsICE9PSB1bmRlZmluZWQpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlOyB0aGlzIG1ldGhvZCBvbmx5IGJ1aWxkcyBhIHR4IHdhbGxldFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9pblwiKSB0eC5zZXRJbnB1dFN1bShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50X291dFwiKSB0eC5zZXRPdXRwdXRTdW0oQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNoYW5nZV9hZGRyZXNzXCIpIHR4LnNldENoYW5nZUFkZHJlc3ModmFsID09PSBcIlwiID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjaGFuZ2VfYW1vdW50XCIpIHR4LnNldENoYW5nZUFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZHVtbXlfb3V0cHV0c1wiKSB0eC5zZXROdW1EdW1teU91dHB1dHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJleHRyYVwiKSB0eC5zZXRFeHRyYUhleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJpbmdfc2l6ZVwiKSB0eC5zZXRSaW5nU2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50X2tleV9pbWFnZXNcIikge1xuICAgICAgICBsZXQgaW5wdXRLZXlJbWFnZXMgPSB2YWwua2V5X2ltYWdlcztcbiAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZSh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdHguc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgZm9yIChsZXQgaW5wdXRLZXlJbWFnZSBvZiBpbnB1dEtleUltYWdlcykge1xuICAgICAgICAgIHR4LmdldElucHV0cygpLnB1c2gobmV3IE1vbmVyb091dHB1dFdhbGxldCgpLnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSgpLnNldEhleChpbnB1dEtleUltYWdlKSkuc2V0VHgodHgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNfYnlfZGVzdFwiKSB7XG4gICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUoaXNPdXRnb2luZyk7XG4gICAgICAgIGxldCBhbW91bnRzQnlEZXN0ID0gdmFsLmFtb3VudHM7XG4gICAgICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoLCBhbW91bnRzQnlEZXN0Lmxlbmd0aCk7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHgpO1xuICAgICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoW10pO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHRyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVtpXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnRzQnlEZXN0W2ldKSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZCB3aXRoIHRyYW5zZmVyOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGxpbmsgYmxvY2sgYW5kIHR4XG4gICAgaWYgKGhlYWRlcikgdHguc2V0QmxvY2sobmV3IE1vbmVyb0Jsb2NrKGhlYWRlcikuc2V0VHhzKFt0eF0pKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIGZpbmFsIGZpZWxkc1xuICAgIGlmICh0cmFuc2Zlcikge1xuICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgaWYgKCF0cmFuc2Zlci5nZXRUeCgpLmdldElzQ29uZmlybWVkKCkpIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICBpZiAoaXNPdXRnb2luZykge1xuICAgICAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgICAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpKSB7XG4gICAgICAgICAgaWYgKHRyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpKSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0RGVzdGluYXRpb25zKHVuZGVmaW5lZCk7IC8vIG92ZXJ3cml0ZSB0byBhdm9pZCByZWNvbmNpbGUgZXJyb3IgVE9ETzogcmVtb3ZlIGFmdGVyID4xOC4zLjEgd2hlbiBhbW91bnRzX2J5X2Rlc3Qgc3VwcG9ydGVkXG4gICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLm1lcmdlKHRyYW5zZmVyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHguc2V0SXNJbmNvbWluZyh0cnVlKTtcbiAgICAgICAgdHguc2V0SW5jb21pbmdUcmFuc2ZlcnMoW3RyYW5zZmVyXSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHJldHVybiBpbml0aWFsaXplZCB0cmFuc2FjdGlvblxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhXaXRoT3V0cHV0KHJwY091dHB1dCkge1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhcbiAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIG91dHB1dFxuICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KHt0eDogdHh9KTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjT3V0cHV0KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY091dHB1dFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhbW91bnRcIikgb3V0cHV0LnNldEFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlbnRcIikgb3V0cHV0LnNldElzU3BlbnQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJrZXlfaW1hZ2VcIikgeyBpZiAoXCJcIiAhPT0gdmFsKSBvdXRwdXQuc2V0S2V5SW1hZ2UobmV3IE1vbmVyb0tleUltYWdlKHZhbCkpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZ2xvYmFsX2luZGV4XCIpIG91dHB1dC5zZXRJbmRleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2hhc2hcIikgdHguc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja2VkXCIpIHR4LnNldElzTG9ja2VkKCF2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZyb3plblwiKSBvdXRwdXQuc2V0SXNGcm96ZW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwdWJrZXlcIikgb3V0cHV0LnNldFN0ZWFsdGhQdWJsaWNLZXkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGV4XCIpIHtcbiAgICAgICAgb3V0cHV0LnNldEFjY291bnRJbmRleCh2YWwubWFqb3IpO1xuICAgICAgICBvdXRwdXQuc2V0U3ViYWRkcmVzc0luZGV4KHZhbC5taW5vcik7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfaGVpZ2h0XCIpIHR4LnNldEJsb2NrKChuZXcgTW9uZXJvQmxvY2soKS5zZXRIZWlnaHQodmFsKSBhcyBNb25lcm9CbG9jaykuc2V0VHhzKFt0eCBhcyBNb25lcm9UeF0pKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHRyYW5zYWN0aW9uIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggd2l0aCBvdXRwdXRcbiAgICB0eC5zZXRPdXRwdXRzKFtvdXRwdXRdKTtcbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Rlc2NyaWJlVHJhbnNmZXIocnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdCkge1xuICAgIGxldCB0eFNldCA9IG5ldyBNb25lcm9UeFNldCgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZGVzY1wiKSB7XG4gICAgICAgIHR4U2V0LnNldFR4cyhbXSk7XG4gICAgICAgIGZvciAobGV0IHR4TWFwIG9mIHZhbCkge1xuICAgICAgICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIodHhNYXAsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgICAgICAgdHguc2V0VHhTZXQodHhTZXQpO1xuICAgICAgICAgIHR4U2V0LmdldFR4cygpLnB1c2godHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3VtbWFyeVwiKSB7IH0gLy8gVE9ETzogc3VwcG9ydCB0eCBzZXQgc3VtbWFyeSBmaWVsZHM/XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBkZXNjZHJpYmUgdHJhbnNmZXIgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogRGVjb2RlcyBhIFwidHlwZVwiIGZyb20gbW9uZXJvLXdhbGxldC1ycGMgdG8gaW5pdGlhbGl6ZSB0eXBlIGFuZCBzdGF0ZVxuICAgKiBmaWVsZHMgaW4gdGhlIGdpdmVuIHRyYW5zYWN0aW9uLlxuICAgKiBcbiAgICogVE9ETzogdGhlc2Ugc2hvdWxkIGJlIHNhZmUgc2V0XG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHlwZSBpcyB0aGUgdHlwZSB0byBkZWNvZGVcbiAgICogQHBhcmFtIHR4IGlzIHRoZSB0cmFuc2FjdGlvbiB0byBkZWNvZGUga25vd24gZmllbGRzIHRvXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIHJwYyB0eXBlIGluZGljYXRlcyBvdXRnb2luZyB4b3IgaW5jb21pbmdcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZGVjb2RlUnBjVHlwZShycGNUeXBlLCB0eCkge1xuICAgIGxldCBpc091dGdvaW5nO1xuICAgIGlmIChycGNUeXBlID09PSBcImluXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSBmYWxzZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJvdXRcIikge1xuICAgICAgaXNPdXRnb2luZyA9IHRydWU7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwicG9vbFwiKSB7XG4gICAgICBpc091dGdvaW5nID0gZmFsc2U7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTsgIC8vIFRPRE86IGJ1dCBjb3VsZCBpdCBiZT9cbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwicGVuZGluZ1wiKSB7XG4gICAgICBpc091dGdvaW5nID0gdHJ1ZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKHRydWUpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJibG9ja1wiKSB7XG4gICAgICBpc091dGdvaW5nID0gZmFsc2U7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KHRydWUpO1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJmYWlsZWRcIikge1xuICAgICAgaXNPdXRnb2luZyA9IHRydWU7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQoZmFsc2UpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZCh0cnVlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlVucmVjb2duaXplZCB0cmFuc2ZlciB0eXBlOiBcIiArIHJwY1R5cGUpO1xuICAgIH1cbiAgICByZXR1cm4gaXNPdXRnb2luZztcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1lcmdlcyBhIHRyYW5zYWN0aW9uIGludG8gYSB1bmlxdWUgc2V0IG9mIHRyYW5zYWN0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHtNb25lcm9UeFdhbGxldH0gdHggLSB0aGUgdHJhbnNhY3Rpb24gdG8gbWVyZ2UgaW50byB0aGUgZXhpc3RpbmcgdHhzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB0eE1hcCAtIG1hcHMgdHggaGFzaGVzIHRvIHR4c1xuICAgKiBAcGFyYW0ge09iamVjdH0gYmxvY2tNYXAgLSBtYXBzIGJsb2NrIGhlaWdodHMgdG8gYmxvY2tzXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIG1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCkge1xuICAgIGFzc2VydCh0eC5nZXRIYXNoKCkgIT09IHVuZGVmaW5lZCk7XG4gICAgXG4gICAgLy8gbWVyZ2UgdHhcbiAgICBsZXQgYVR4ID0gdHhNYXBbdHguZ2V0SGFzaCgpXTtcbiAgICBpZiAoYVR4ID09PSB1bmRlZmluZWQpIHR4TWFwW3R4LmdldEhhc2goKV0gPSB0eDsgLy8gY2FjaGUgbmV3IHR4XG4gICAgZWxzZSBhVHgubWVyZ2UodHgpOyAvLyBtZXJnZSB3aXRoIGV4aXN0aW5nIHR4XG4gICAgXG4gICAgLy8gbWVyZ2UgdHgncyBibG9jayBpZiBjb25maXJtZWRcbiAgICBpZiAodHguZ2V0SGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IGFCbG9jayA9IGJsb2NrTWFwW3R4LmdldEhlaWdodCgpXTtcbiAgICAgIGlmIChhQmxvY2sgPT09IHVuZGVmaW5lZCkgYmxvY2tNYXBbdHguZ2V0SGVpZ2h0KCldID0gdHguZ2V0QmxvY2soKTsgLy8gY2FjaGUgbmV3IGJsb2NrXG4gICAgICBlbHNlIGFCbG9jay5tZXJnZSh0eC5nZXRCbG9jaygpKTsgLy8gbWVyZ2Ugd2l0aCBleGlzdGluZyBibG9ja1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byB0cmFuc2FjdGlvbnMgYnkgdGhlaXIgaGVpZ2h0LlxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb21wYXJlVHhzQnlIZWlnaHQodHgxLCB0eDIpIHtcbiAgICBpZiAodHgxLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQgJiYgdHgyLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHJldHVybiAwOyAvLyBib3RoIHVuY29uZmlybWVkXG4gICAgZWxzZSBpZiAodHgxLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHJldHVybiAxOyAgIC8vIHR4MSBpcyB1bmNvbmZpcm1lZFxuICAgIGVsc2UgaWYgKHR4Mi5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gLTE7ICAvLyB0eDIgaXMgdW5jb25maXJtZWRcbiAgICBsZXQgZGlmZiA9IHR4MS5nZXRIZWlnaHQoKSAtIHR4Mi5nZXRIZWlnaHQoKTtcbiAgICBpZiAoZGlmZiAhPT0gMCkgcmV0dXJuIGRpZmY7XG4gICAgcmV0dXJuIHR4MS5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgxKSAtIHR4Mi5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgyKTsgLy8gdHhzIGFyZSBpbiB0aGUgc2FtZSBibG9jayBzbyByZXRhaW4gdGhlaXIgb3JpZ2luYWwgb3JkZXJcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byB0cmFuc2ZlcnMgYnkgYXNjZW5kaW5nIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcy5cbiAgICovXG4gIHN0YXRpYyBjb21wYXJlSW5jb21pbmdUcmFuc2ZlcnModDEsIHQyKSB7XG4gICAgaWYgKHQxLmdldEFjY291bnRJbmRleCgpIDwgdDIuZ2V0QWNjb3VudEluZGV4KCkpIHJldHVybiAtMTtcbiAgICBlbHNlIGlmICh0MS5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdDIuZ2V0QWNjb3VudEluZGV4KCkpIHJldHVybiB0MS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAtIHQyLmdldFN1YmFkZHJlc3NJbmRleCgpO1xuICAgIHJldHVybiAxO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29tcGFyZXMgdHdvIG91dHB1dHMgYnkgYXNjZW5kaW5nIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcy5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29tcGFyZU91dHB1dHMobzEsIG8yKSB7XG4gICAgXG4gICAgLy8gY29tcGFyZSBieSBoZWlnaHRcbiAgICBsZXQgaGVpZ2h0Q29tcGFyaXNvbiA9IE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQobzEuZ2V0VHgoKSwgbzIuZ2V0VHgoKSk7XG4gICAgaWYgKGhlaWdodENvbXBhcmlzb24gIT09IDApIHJldHVybiBoZWlnaHRDb21wYXJpc29uO1xuICAgIFxuICAgIC8vIGNvbXBhcmUgYnkgYWNjb3VudCBpbmRleCwgc3ViYWRkcmVzcyBpbmRleCwgb3V0cHV0IGluZGV4LCB0aGVuIGtleSBpbWFnZSBoZXhcbiAgICBsZXQgY29tcGFyZSA9IG8xLmdldEFjY291bnRJbmRleCgpIC0gbzIuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgaWYgKGNvbXBhcmUgIT09IDApIHJldHVybiBjb21wYXJlO1xuICAgIGNvbXBhcmUgPSBvMS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAtIG8yLmdldFN1YmFkZHJlc3NJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICBjb21wYXJlID0gbzEuZ2V0SW5kZXgoKSAtIG8yLmdldEluZGV4KCk7XG4gICAgaWYgKGNvbXBhcmUgIT09IDApIHJldHVybiBjb21wYXJlO1xuICAgIHJldHVybiBvMS5nZXRLZXlJbWFnZSgpLmdldEhleCgpLmxvY2FsZUNvbXBhcmUobzIuZ2V0S2V5SW1hZ2UoKS5nZXRIZXgoKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBQb2xscyBtb25lcm8td2FsbGV0LXJwYyB0byBwcm92aWRlIGxpc3RlbmVyIG5vdGlmaWNhdGlvbnMuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIFdhbGxldFBvbGxlciB7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIGlzUG9sbGluZzogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIHdhbGxldDogTW9uZXJvV2FsbGV0UnBjO1xuICBwcm90ZWN0ZWQgbG9vcGVyOiBUYXNrTG9vcGVyO1xuICBwcm90ZWN0ZWQgcHJldkxvY2tlZFR4czogYW55O1xuICBwcm90ZWN0ZWQgcHJldkxvY2tlZFR4c01pbkhlaWdodCA9IDA7XG4gIHByb3RlY3RlZCBwcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zOiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2Q29uZmlybWVkTm90aWZpY2F0aW9uczogYW55O1xuICBwcm90ZWN0ZWQgdGhyZWFkUG9vbDogYW55O1xuICBwcm90ZWN0ZWQgbnVtUG9sbGluZzogYW55O1xuICBwcm90ZWN0ZWQgcHJldkhlaWdodDogYW55O1xuICBwcm90ZWN0ZWQgcHJldkJhbGFuY2VzOiBhbnk7XG4gIHByb3RlY3RlZCBnZW5lcmF0aW9uID0gMDtcbiAgcHJvdGVjdGVkIHNuYXBzaG90R2VuZXJhdGlvbiA9IDA7XG4gIFxuICBjb25zdHJ1Y3Rvcih3YWxsZXQpIHtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgdGhpcy53YWxsZXQgPSB3YWxsZXQ7XG4gICAgdGhpcy5sb29wZXIgPSBuZXcgVGFza0xvb3Blcihhc3luYyBmdW5jdGlvbigpIHsgYXdhaXQgdGhhdC5wb2xsKCk7IH0pO1xuICAgIHRoaXMucHJldkxvY2tlZFR4cyA9IFtdO1xuICAgIHRoaXMucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucyA9IG5ldyBTZXQoKTsgLy8gdHggaGFzaGVzIG9mIHByZXZpb3VzIG5vdGlmaWNhdGlvbnNcbiAgICB0aGlzLnByZXZDb25maXJtZWROb3RpZmljYXRpb25zID0gbmV3IFNldCgpOyAvLyB0eCBoYXNoZXMgb2YgcHJldmlvdXNseSBjb25maXJtZWQgYnV0IG5vdCB5ZXQgdW5sb2NrZWQgbm90aWZpY2F0aW9uc1xuICAgIHRoaXMudGhyZWFkUG9vbCA9IG5ldyBUaHJlYWRQb29sKDEpOyAvLyBzeW5jaHJvbml6ZSBwb2xsc1xuICAgIHRoaXMubnVtUG9sbGluZyA9IDA7XG4gIH1cbiAgXG4gIHJlc2V0KCkge1xuICAgIHRoaXMuZ2VuZXJhdGlvbisrOyAvLyBpbnZhbGlkYXRlIGluLWZsaWdodCBwb2xscyB3aXRob3V0IHdhaXRpbmcgb24gdGhlaXIgY2FsbGJhY2tzXG4gIH1cblxuICBzZXRJc1BvbGxpbmcoaXNQb2xsaW5nKSB7XG4gICAgdGhpcy5pc1BvbGxpbmcgPSBpc1BvbGxpbmc7XG4gICAgaWYgKGlzUG9sbGluZykgdGhpcy5sb29wZXIuc3RhcnQodGhpcy53YWxsZXQuZ2V0U3luY1BlcmlvZEluTXMoKSk7XG4gICAgZWxzZSB0aGlzLmxvb3Blci5zdG9wKCk7XG4gIH1cbiAgXG4gIHNldFBlcmlvZEluTXMocGVyaW9kSW5Ncykge1xuICAgIHRoaXMubG9vcGVyLnNldFBlcmlvZEluTXMocGVyaW9kSW5Ncyk7XG4gIH1cbiAgXG4gIGFzeW5jIHBvbGwoKSB7XG5cbiAgICAvLyBza2lwIGlmIG5leHQgcG9sbCBpcyBxdWV1ZWRcbiAgICBpZiAodGhpcy5udW1Qb2xsaW5nID4gMSkgcmV0dXJuO1xuICAgIHRoaXMubnVtUG9sbGluZysrO1xuICAgIFxuICAgIC8vIHN5bmNocm9uaXplIHBvbGxzXG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIHJldHVybiB0aGlzLnRocmVhZFBvb2wuc3VibWl0KGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgZ2VuZXJhdGlvbiA9IHRoYXQuZ2VuZXJhdGlvbjtcbiAgICAgIHRyeSB7XG4gICAgICAgIFxuICAgICAgICAvLyBza2lwIGlmIHdhbGxldCBpcyBjbG9zZWRcbiAgICAgICAgaWYgKGF3YWl0IHRoYXQud2FsbGV0LmlzQ2xvc2VkKCkgfHwgZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgLy8gcmVzZXQgc25hcHNob3RzIG9ubHkgaW5zaWRlIHRoZSBzZXJpYWxpemVkIHBvbGxcbiAgICAgICAgaWYgKHRoYXQuc25hcHNob3RHZW5lcmF0aW9uICE9PSBnZW5lcmF0aW9uKSB7XG4gICAgICAgICAgdGhhdC5wcmV2SGVpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHRoYXQucHJldkJhbGFuY2VzID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IFtdO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4c01pbkhlaWdodCA9IDA7XG4gICAgICAgICAgdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zLmNsZWFyKCk7XG4gICAgICAgICAgdGhhdC5wcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucy5jbGVhcigpO1xuICAgICAgICAgIHRoYXQuc25hcHNob3RHZW5lcmF0aW9uID0gZ2VuZXJhdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gdGFrZSBpbml0aWFsIHNuYXBzaG90XG4gICAgICAgIGlmICh0aGF0LnByZXZCYWxhbmNlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhhdC5wcmV2SGVpZ2h0ID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0SGVpZ2h0KCk7XG4gICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpKTtcbiAgICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgICAgdGhhdC5wcmV2QmFsYW5jZXMgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRCYWxhbmNlcygpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgaGVpZ2h0IGNoYW5nZXNcbiAgICAgICAgbGV0IGhlaWdodCA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEhlaWdodCgpO1xuICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgIGlmICh0aGF0LnByZXZIZWlnaHQgIT09IGhlaWdodCkge1xuICAgICAgICAgIGZvciAobGV0IGkgPSB0aGF0LnByZXZIZWlnaHQ7IGkgPCBoZWlnaHQ7IGkrKykge1xuICAgICAgICAgICAgYXdhaXQgdGhhdC5vbk5ld0Jsb2NrKGkpO1xuICAgICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGF0LnByZXZIZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGdldCBsb2NrZWQgdHhzIGZvciBjb21wYXJpc29uIHRvIHByZXZpb3VzXG4gICAgICAgIGxldCBtaW5IZWlnaHQgPSBNYXRoLm1heCgwLCBoZWlnaHQgLSA3MCk7IC8vIG9ubHkgbW9uaXRvciByZWNlbnQgdHhzXG4gICAgICAgIGxldCBsb2NrZWRUeHMgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRUeHMobmV3IE1vbmVyb1R4UXVlcnkoKS5zZXRJc0xvY2tlZCh0cnVlKS5zZXRNaW5IZWlnaHQobWluSGVpZ2h0KS5zZXRJbmNsdWRlT3V0cHV0cyh0cnVlKSk7XG4gICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGF0LmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbGxlY3QgaGFzaGVzIG9mIHR4cyBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCBub0xvbmdlckxvY2tlZEhhc2hlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBwcmV2TG9ja2VkVHggb2YgdGhhdC5wcmV2TG9ja2VkVHhzKSB7XG4gICAgICAgICAgaWYgKHRoYXQuZ2V0VHgobG9ja2VkVHhzLCBwcmV2TG9ja2VkVHguZ2V0SGFzaCgpKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBub0xvbmdlckxvY2tlZEhhc2hlcy5wdXNoKHByZXZMb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gc2F2ZSBsb2NrZWQgdHhzIGZvciBuZXh0IGNvbXBhcmlzb25cbiAgICAgICAgbGV0IHByZXZNaW5IZWlnaHQgPSB0aGF0LnByZXZMb2NrZWRUeHNNaW5IZWlnaHQ7XG4gICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGxvY2tlZFR4cztcbiAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzTWluSGVpZ2h0ID0gbWluSGVpZ2h0O1xuICAgICAgICBcbiAgICAgICAgLy8gdXNlIHRoZSBwcmV2aW91cyBzbmFwc2hvdCdzIGJvdW5kIHNvIHRyYWNrZWQgdHhzIGRvIG5vdCBhZ2Ugb3V0IGJldHdlZW4gcG9sbHNcbiAgICAgICAgbGV0IHVubG9ja2VkVHhzID0gbm9Mb25nZXJMb2NrZWRIYXNoZXMubGVuZ3RoID09PSAwID8gW10gOiBhd2FpdCB0aGF0LndhbGxldC5nZXRUeHMobmV3IE1vbmVyb1R4UXVlcnkoKS5zZXRJc0xvY2tlZChmYWxzZSkuc2V0TWluSGVpZ2h0KHByZXZNaW5IZWlnaHQpLnNldEhhc2hlcyhub0xvbmdlckxvY2tlZEhhc2hlcykuc2V0SW5jbHVkZU91dHB1dHModHJ1ZSkpO1xuICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhhdC5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgbmV3IHVuY29uZmlybWVkIGFuZCBjb25maXJtZWQgb3V0cHV0c1xuICAgICAgICBmb3IgKGxldCBsb2NrZWRUeCBvZiBsb2NrZWRUeHMpIHtcbiAgICAgICAgICBsZXQgc2VhcmNoU2V0ID0gbG9ja2VkVHguZ2V0SXNDb25maXJtZWQoKSA/IHRoYXQucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMgOiB0aGF0LnByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnM7XG4gICAgICAgICAgbGV0IHVuYW5ub3VuY2VkID0gIXNlYXJjaFNldC5oYXMobG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICBzZWFyY2hTZXQuYWRkKGxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgaWYgKHVuYW5ub3VuY2VkKSBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHMobG9ja2VkVHgsIGdlbmVyYXRpb24pO1xuICAgICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGF0LmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgbmV3IHVubG9ja2VkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgdW5sb2NrZWRUeCBvZiB1bmxvY2tlZFR4cykge1xuICAgICAgICAgIGxldCBtaXNzZWRDb25maXJtID0gdW5sb2NrZWRUeC5nZXRJc0NvbmZpcm1lZCgpICYmICF0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zLmhhcyh1bmxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zLmRlbGV0ZSh1bmxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgdGhhdC5wcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucy5kZWxldGUodW5sb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIGlmIChtaXNzZWRDb25maXJtKSB7IC8vIGFubm91bmNlIG1pc3NlZCBjb25maXJtIHRyYW5zaXRpb24gaWYgdHggdW5sb2NrZWQgYmV0d2VlbiBwb2xsc1xuICAgICAgICAgICAgbGV0IGNvbmZpcm1lZFR4ID0gdW5sb2NrZWRUeC5jb3B5KCkuc2V0SXNMb2NrZWQodHJ1ZSk7XG4gICAgICAgICAgICBjb25maXJtZWRUeC5zZXRCbG9jayh1bmxvY2tlZFR4LmdldEJsb2NrKCkuY29weSgpLnNldFR4cyhbY29uZmlybWVkVHhdKSk7XG4gICAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHMoY29uZmlybWVkVHgsIGdlbmVyYXRpb24pO1xuICAgICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHModW5sb2NrZWRUeCwgZ2VuZXJhdGlvbik7XG4gICAgICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoYXQuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBiYWxhbmNlIGNoYW5nZXNcbiAgICAgICAgYXdhaXQgdGhhdC5jaGVja0ZvckNoYW5nZWRCYWxhbmNlcyhnZW5lcmF0aW9uKTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIGlmIChnZW5lcmF0aW9uID09PSB0aGF0LmdlbmVyYXRpb24gJiYgdGhhdC5pc1BvbGxpbmcpIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gYmFja2dyb3VuZCBwb2xsIHdhbGxldCAnXCIgKyBhd2FpdCB0aGF0LndhbGxldC5nZXRQYXRoKCkgKyBcIic6IFwiICsgZXJyLm1lc3NhZ2UpOyAvLyBpZ25vcmUgZXJyb3JzIGZyb20gcG9sbHMgc3RyYWdnbGluZyBhZnRlciB0aGUgd2FsbGV0IGlzIGNsb3NlZFxuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkge1xuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlTmV3QmxvY2soaGVpZ2h0KTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIG5vdGlmeU91dHB1dHModHgsIGdlbmVyYXRpb24pIHtcbiAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5nZW5lcmF0aW9uKSByZXR1cm47XG4gIFxuICAgIC8vIG5vdGlmeSBzcGVudCBvdXRwdXRzIC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogbW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgYWxsb3cgc2NyYXBlIG9mIHR4IGlucHV0cyBzbyBwcm92aWRpbmcgb25lIGlucHV0IHdpdGggb3V0Z29pbmcgYW1vdW50XG4gICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQodHguZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCgpXG4gICAgICAgICAgLnNldEFtb3VudCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkgKyB0eC5nZXRGZWUoKSlcbiAgICAgICAgICAuc2V0QWNjb3VudEluZGV4KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBY2NvdW50SW5kZXgoKSlcbiAgICAgICAgICAuc2V0U3ViYWRkcmVzc0luZGV4KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSA/IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpWzBdIDogdW5kZWZpbmVkKSAvLyBpbml0aWFsaXplIGlmIHRyYW5zZmVyIHNvdXJjZWQgZnJvbSBzaW5nbGUgc3ViYWRkcmVzc1xuICAgICAgICAgIC5zZXRUeCh0eCk7XG4gICAgICB0eC5zZXRJbnB1dHMoW291dHB1dF0pO1xuICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRTcGVudChvdXRwdXQpO1xuICAgICAgaWYgKGdlbmVyYXRpb24gIT09IHRoaXMuZ2VuZXJhdGlvbikgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICAvLyBub3RpZnkgcmVjZWl2ZWQgb3V0cHV0c1xuICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRPdXRwdXRzKCkubGVuZ3RoID4gMCkgeyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG91dHB1dHMgb25seSByZXR1cm5lZCBmb3IgY29uZmlybWVkIHR4c1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLmdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBhbGxvdyBzY3JhcGUgb2YgdW5jb25maXJtZWQgcmVjZWl2ZWQgb3V0cHV0cyBzbyB1c2luZyBpbmNvbWluZyB0cmFuc2ZlciB2YWx1ZXNcbiAgICAgICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkge1xuICAgICAgICAgIG91dHB1dHMucHVzaChuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KClcbiAgICAgICAgICAgICAgLnNldEFjY291bnRJbmRleCh0cmFuc2Zlci5nZXRBY2NvdW50SW5kZXgoKSlcbiAgICAgICAgICAgICAgLnNldFN1YmFkZHJlc3NJbmRleCh0cmFuc2Zlci5nZXRTdWJhZGRyZXNzSW5kZXgoKSlcbiAgICAgICAgICAgICAgLnNldEFtb3VudCh0cmFuc2Zlci5nZXRBbW91bnQoKSlcbiAgICAgICAgICAgICAgLnNldFR4KHR4KSk7XG4gICAgICAgIH1cbiAgICAgICAgdHguc2V0T3V0cHV0cyhvdXRwdXRzKTtcbiAgICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmdldE91dHB1dHMoKSkge1xuICAgICAgICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlT3V0cHV0UmVjZWl2ZWQob3V0cHV0KTtcbiAgICAgICAgICBpZiAoZ2VuZXJhdGlvbiAhPT0gdGhpcy5nZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBnZXRUeCh0eHMsIHR4SGFzaCkge1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykgaWYgKHR4SGFzaCA9PT0gdHguZ2V0SGFzaCgpKSByZXR1cm4gdHg7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzKGdlbmVyYXRpb24pIHtcbiAgICBsZXQgYmFsYW5jZXMgPSBhd2FpdCB0aGlzLndhbGxldC5nZXRCYWxhbmNlcygpO1xuICAgIGlmIChnZW5lcmF0aW9uICE9PSB0aGlzLmdlbmVyYXRpb24pIHJldHVybiBmYWxzZTtcbiAgICBpZiAoYmFsYW5jZXNbMF0gIT09IHRoaXMucHJldkJhbGFuY2VzWzBdIHx8IGJhbGFuY2VzWzFdICE9PSB0aGlzLnByZXZCYWxhbmNlc1sxXSkge1xuICAgICAgdGhpcy5wcmV2QmFsYW5jZXMgPSBiYWxhbmNlcztcbiAgICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlQmFsYW5jZXNDaGFuZ2VkKGJhbGFuY2VzWzBdLCBiYWxhbmNlc1sxXSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxhQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7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