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
      if (key === "sources") {} // ignoring
      else if (key === "multisig_txset" && val !== undefined) {} // handled elsewhere; this method only builds a tx wallet
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiTW9uZXJvV2FsbGV0UnBjIiwiTW9uZXJvV2FsbGV0IiwiREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwiYWRkcmVzc0NhY2hlIiwic3luY1BlcmlvZEluTXMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRTZXJ2ZXIiLCJvcGVuV2FsbGV0IiwicGF0aE9yQ29uZmlnIiwicGFzc3dvcmQiLCJNb25lcm9XYWxsZXRDb25maWciLCJwYXRoIiwiZ2V0UGF0aCIsImdldFJlZ3Rlc3QiLCJzZW5kSnNvblJlcXVlc3QiLCJmaWxlbmFtZSIsImdldFBhc3N3b3JkIiwiY2xlYXIiLCJnZXRDb25uZWN0aW9uTWFuYWdlciIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsImNyZWF0ZVdhbGxldCIsImNvbmZpZ05vcm1hbGl6ZWQiLCJnZXRTZWVkIiwiZ2V0UHJpbWFyeUFkZHJlc3MiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFByaXZhdGVTcGVuZEtleSIsImdldE5ldHdvcmtUeXBlIiwiZ2V0QWNjb3VudExvb2thaGVhZCIsImdldFN1YmFkZHJlc3NMb29rYWhlYWQiLCJzZXRQYXNzd29yZCIsInNldFNlcnZlciIsImdldENvbm5lY3Rpb24iLCJjcmVhdGVXYWxsZXRGcm9tU2VlZCIsImNyZWF0ZVdhbGxldEZyb21LZXlzIiwiY3JlYXRlV2FsbGV0UmFuZG9tIiwiZ2V0U2VlZE9mZnNldCIsImdldFJlc3RvcmVIZWlnaHQiLCJnZXRTYXZlQ3VycmVudCIsImdldExhbmd1YWdlIiwic2V0TGFuZ3VhZ2UiLCJERUZBVUxUX0xBTkdVQUdFIiwicGFyYW1zIiwibGFuZ3VhZ2UiLCJlcnIiLCJoYW5kbGVDcmVhdGVXYWxsZXRFcnJvciIsInNlZWQiLCJzZWVkX29mZnNldCIsImVuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWwiLCJnZXRJc011bHRpc2lnIiwicmVzdG9yZV9oZWlnaHQiLCJhdXRvc2F2ZV9jdXJyZW50Iiwic2V0UmVzdG9yZUhlaWdodCIsImFkZHJlc3MiLCJ2aWV3a2V5Iiwic3BlbmRrZXkiLCJuYW1lIiwibWVzc2FnZSIsInRvTG93ZXJDYXNlIiwiaW5jbHVkZXMiLCJNb25lcm9ScGNFcnJvciIsImdldENvZGUiLCJnZXRScGNNZXRob2QiLCJnZXRScGNQYXJhbXMiLCJpc1ZpZXdPbmx5Iiwia2V5X3R5cGUiLCJlIiwidXJpT3JDb25uZWN0aW9uIiwiaXNUcnVzdGVkIiwic3NsT3B0aW9ucyIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiU3NsT3B0aW9ucyIsImdldFVyaSIsInVzZXJuYW1lIiwiZ2V0VXNlcm5hbWUiLCJ0cnVzdGVkIiwic3NsX3N1cHBvcnQiLCJzc2xfcHJpdmF0ZV9rZXlfcGF0aCIsImdldFByaXZhdGVLZXlQYXRoIiwic3NsX2NlcnRpZmljYXRlX3BhdGgiLCJnZXRDZXJ0aWZpY2F0ZVBhdGgiLCJzc2xfY2FfZmlsZSIsImdldENlcnRpZmljYXRlQXV0aG9yaXR5RmlsZSIsInNzbF9hbGxvd2VkX2ZpbmdlcnByaW50cyIsImdldEFsbG93ZWRGaW5nZXJwcmludHMiLCJzc2xfYWxsb3dfYW55X2NlcnQiLCJnZXRBbGxvd0FueUNlcnQiLCJnZXRQcm94eVVyaSIsInN0YXJ0dXBQcm94eVVyaSIsInByb3h5IiwiZGFlbW9uQ29ubmVjdGlvbiIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJnZXRCYWxhbmNlcyIsImFjY291bnRJZHgiLCJzdWJhZGRyZXNzSWR4IiwiYXNzZXJ0IiwiZXF1YWwiLCJiYWxhbmNlIiwiQmlnSW50IiwidW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudCIsImdldEFjY291bnRzIiwiZ2V0QmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsImFjY291bnRfaW5kZXgiLCJhZGRyZXNzX2luZGljZXMiLCJyZXNwIiwicmVzdWx0IiwidW5sb2NrZWRfYmFsYW5jZSIsInBlcl9zdWJhZGRyZXNzIiwiYWRkTGlzdGVuZXIiLCJyZWZyZXNoTGlzdGVuaW5nIiwiaXNDb25uZWN0ZWRUb0RhZW1vbiIsImNoZWNrUmVzZXJ2ZVByb29mIiwiaW5kZXhPZiIsImdldFZlcnNpb24iLCJNb25lcm9WZXJzaW9uIiwidmVyc2lvbiIsInJlbGVhc2UiLCJnZXRTZWVkTGFuZ3VhZ2UiLCJnZXRTZWVkTGFuZ3VhZ2VzIiwibGFuZ3VhZ2VzIiwiZ2V0QWRkcmVzcyIsInN1YmFkZHJlc3NNYXAiLCJnZXRTdWJhZGRyZXNzZXMiLCJnZXRBZGRyZXNzSW5kZXgiLCJzdWJhZGRyZXNzIiwiTW9uZXJvU3ViYWRkcmVzcyIsInNldEFjY291bnRJbmRleCIsImluZGV4IiwibWFqb3IiLCJzZXRJbmRleCIsIm1pbm9yIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJpbnRlZ3JhdGVkQWRkcmVzc1N0ciIsInN0YW5kYXJkX2FkZHJlc3MiLCJwYXltZW50X2lkIiwiaW50ZWdyYXRlZF9hZGRyZXNzIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbnRlZ3JhdGVkQWRkcmVzcyIsIk1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwic2V0U3RhbmRhcmRBZGRyZXNzIiwic2V0UGF5bWVudElkIiwic2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJnZXRIZWlnaHQiLCJoZWlnaHQiLCJnZXREYWVtb25IZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJzeW5jIiwibGlzdGVuZXJPclN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJNb25lcm9XYWxsZXRMaXN0ZW5lciIsInN0YXJ0X2hlaWdodCIsInBvbGwiLCJNb25lcm9TeW5jUmVzdWx0IiwiYmxvY2tzX2ZldGNoZWQiLCJyZWNlaXZlZF9tb25leSIsInN0YXJ0U3luY2luZyIsInN5bmNQZXJpb2RJblNlY29uZHMiLCJNYXRoIiwicm91bmQiLCJlbmFibGUiLCJwZXJpb2QiLCJ3YWxsZXRQb2xsZXIiLCJzZXRQZXJpb2RJbk1zIiwiZ2V0U3luY1BlcmlvZEluTXMiLCJzdG9wU3luY2luZyIsInNjYW5UeHMiLCJ0eEhhc2hlcyIsImxlbmd0aCIsInR4aWRzIiwicmVzY2FuU3BlbnQiLCJyZXNjYW5CbG9ja2NoYWluIiwiaW5jbHVkZVN1YmFkZHJlc3NlcyIsInRhZyIsInNraXBCYWxhbmNlcyIsImFjY291bnRzIiwicnBjQWNjb3VudCIsInN1YmFkZHJlc3NfYWNjb3VudHMiLCJjb252ZXJ0UnBjQWNjb3VudCIsInNldFN1YmFkZHJlc3NlcyIsImdldEluZGV4IiwicHVzaCIsInNldEJhbGFuY2UiLCJzZXRVbmxvY2tlZEJhbGFuY2UiLCJzZXROdW1VbnNwZW50T3V0cHV0cyIsInNldE51bUJsb2Nrc1RvVW5sb2NrIiwiYWxsX2FjY291bnRzIiwicnBjU3ViYWRkcmVzcyIsImNvbnZlcnRScGNTdWJhZGRyZXNzIiwiZ2V0QWNjb3VudEluZGV4IiwidGd0U3ViYWRkcmVzcyIsImdldE51bVVuc3BlbnRPdXRwdXRzIiwiZ2V0QWNjb3VudCIsIkVycm9yIiwiY3JlYXRlQWNjb3VudCIsImxhYmVsIiwiTW9uZXJvQWNjb3VudCIsInByaW1hcnlBZGRyZXNzIiwic3ViYWRkcmVzc0luZGljZXMiLCJhZGRyZXNzX2luZGV4IiwibGlzdGlmeSIsInN1YmFkZHJlc3NlcyIsImFkZHJlc3NlcyIsImdldE51bUJsb2Nrc1RvVW5sb2NrIiwiZ2V0U3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJzZXRBZGRyZXNzIiwic2V0TGFiZWwiLCJzZXRJc1VzZWQiLCJzZXRTdWJhZGRyZXNzTGFiZWwiLCJnZXRUeHMiLCJxdWVyeSIsInF1ZXJ5Tm9ybWFsaXplZCIsIm5vcm1hbGl6ZVR4UXVlcnkiLCJ0cmFuc2ZlclF1ZXJ5IiwiZ2V0VHJhbnNmZXJRdWVyeSIsImlucHV0UXVlcnkiLCJnZXRJbnB1dFF1ZXJ5Iiwib3V0cHV0UXVlcnkiLCJnZXRPdXRwdXRRdWVyeSIsInNldFRyYW5zZmVyUXVlcnkiLCJzZXRJbnB1dFF1ZXJ5Iiwic2V0T3V0cHV0UXVlcnkiLCJ0cmFuc2ZlcnMiLCJnZXRUcmFuc2ZlcnNBdXgiLCJNb25lcm9UcmFuc2ZlclF1ZXJ5Iiwic2V0VHhRdWVyeSIsImRlY29udGV4dHVhbGl6ZSIsImNvcHkiLCJ0eHMiLCJ0eHNTZXQiLCJTZXQiLCJ0cmFuc2ZlciIsImdldFR4IiwiYWRkIiwidHhNYXAiLCJibG9ja01hcCIsInR4IiwibWVyZ2VUeCIsImdldEluY2x1ZGVPdXRwdXRzIiwib3V0cHV0UXVlcnlBdXgiLCJNb25lcm9PdXRwdXRRdWVyeSIsIm91dHB1dHMiLCJnZXRPdXRwdXRzQXV4Iiwib3V0cHV0VHhzIiwib3V0cHV0IiwidHhzUXVlcmllZCIsIm1lZXRzQ3JpdGVyaWEiLCJnZXRCbG9jayIsInNwbGljZSIsImdldElzQ29uZmlybWVkIiwiY29uc29sZSIsImVycm9yIiwiZ2V0SGFzaGVzIiwidHhzQnlJZCIsIk1hcCIsImdldEhhc2giLCJvcmRlcmVkVHhzIiwiaGFzaCIsImdldFRyYW5zZmVycyIsIm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkiLCJpc0NvbnRleHR1YWwiLCJnZXRUeFF1ZXJ5IiwiZmlsdGVyVHJhbnNmZXJzIiwiZ2V0T3V0cHV0cyIsIm5vcm1hbGl6ZU91dHB1dFF1ZXJ5IiwiZmlsdGVyT3V0cHV0cyIsImV4cG9ydE91dHB1dHMiLCJhbGwiLCJvdXRwdXRzX2RhdGFfaGV4IiwiaW1wb3J0T3V0cHV0cyIsIm91dHB1dHNIZXgiLCJudW1faW1wb3J0ZWQiLCJleHBvcnRLZXlJbWFnZXMiLCJycGNFeHBvcnRLZXlJbWFnZXMiLCJpbXBvcnRLZXlJbWFnZXMiLCJrZXlJbWFnZXMiLCJvZmZzZXQiLCJycGNLZXlJbWFnZXMiLCJtYXAiLCJrZXlJbWFnZSIsImtleV9pbWFnZSIsImdldEhleCIsInNpZ25hdHVyZSIsImdldFNpZ25hdHVyZSIsInNpZ25lZF9rZXlfaW1hZ2VzIiwiaW1wb3J0UmVzdWx0IiwiTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJzZXRIZWlnaHQiLCJzZXRTcGVudEFtb3VudCIsInNwZW50Iiwic2V0VW5zcGVudEFtb3VudCIsInVuc3BlbnQiLCJnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCIsImdldEtleUltYWdlcyIsImZyZWV6ZU91dHB1dCIsInRoYXdPdXRwdXQiLCJpc091dHB1dEZyb3plbiIsImZyb3plbiIsImdldERlZmF1bHRGZWVQcmlvcml0eSIsInByaW9yaXR5IiwiY3JlYXRlVHhzIiwibm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnIiwiZ2V0Q2FuU3BsaXQiLCJzZXRDYW5TcGxpdCIsImdldFJlbGF5IiwiaXNNdWx0aXNpZyIsImdldFN1YmFkZHJlc3NJbmRpY2VzIiwic2xpY2UiLCJkZXN0aW5hdGlvbnMiLCJkZXN0aW5hdGlvbiIsImdldERlc3RpbmF0aW9ucyIsImdldEFtb3VudCIsImFtb3VudCIsInRvU3RyaW5nIiwiZ2V0U3VidHJhY3RGZWVGcm9tIiwic3VidHJhY3RfZmVlX2Zyb21fb3V0cHV0cyIsInN1YmFkZHJfaW5kaWNlcyIsImdldFBheW1lbnRJZCIsImRvX25vdF9yZWxheSIsImdldFByaW9yaXR5IiwiZ2V0X3R4X2hleCIsImdldF90eF9tZXRhZGF0YSIsImdldF90eF9rZXlzIiwiZ2V0X3R4X2tleSIsIm51bVR4cyIsImZlZV9saXN0IiwiZmVlIiwiY29weURlc3RpbmF0aW9ucyIsImkiLCJNb25lcm9UeFdhbGxldCIsImluaXRTZW50VHhXYWxsZXQiLCJnZXRPdXRnb2luZ1RyYW5zZmVyIiwic2V0U3ViYWRkcmVzc0luZGljZXMiLCJjb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQiLCJjb252ZXJ0UnBjVHhUb1R4U2V0Iiwic3dlZXBPdXRwdXQiLCJub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyIsImdldEtleUltYWdlIiwic2V0QW1vdW50Iiwic3dlZXBVbmxvY2tlZCIsIm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWciLCJpbmRpY2VzIiwia2V5cyIsInNldFN3ZWVwRWFjaFN1YmFkZHJlc3MiLCJnZXRTd2VlcEVhY2hTdWJhZGRyZXNzIiwicnBjU3dlZXBBY2NvdW50Iiwic3dlZXBEdXN0IiwicmVsYXkiLCJ0eFNldCIsInNldElzUmVsYXllZCIsInNldEluVHhQb29sIiwiZ2V0SXNSZWxheWVkIiwicmVsYXlUeHMiLCJ0eHNPck1ldGFkYXRhcyIsIkFycmF5IiwiaXNBcnJheSIsInR4T3JNZXRhZGF0YSIsIm1ldGFkYXRhIiwiZ2V0TWV0YWRhdGEiLCJoZXgiLCJ0eF9oYXNoIiwiZGVzY3JpYmVUeFNldCIsInVuc2lnbmVkX3R4c2V0IiwiZ2V0VW5zaWduZWRUeEhleCIsIm11bHRpc2lnX3R4c2V0IiwiZ2V0TXVsdGlzaWdUeEhleCIsImNvbnZlcnRScGNEZXNjcmliZVRyYW5zZmVyIiwic2lnblR4cyIsInVuc2lnbmVkVHhIZXgiLCJleHBvcnRfcmF3Iiwic3VibWl0VHhzIiwic2lnbmVkVHhIZXgiLCJ0eF9kYXRhX2hleCIsInR4X2hhc2hfbGlzdCIsInNpZ25NZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiU0lHTl9XSVRIX1NQRU5EX0tFWSIsImRhdGEiLCJzaWduYXR1cmVfdHlwZSIsInZlcmlmeU1lc3NhZ2UiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiZ29vZCIsImlzR29vZCIsImlzT2xkIiwib2xkIiwiU0lHTl9XSVRIX1ZJRVdfS0VZIiwiZ2V0VHhLZXkiLCJ0eEhhc2giLCJ0eGlkIiwidHhfa2V5IiwiY2hlY2tUeEtleSIsInR4S2V5IiwiY2hlY2siLCJNb25lcm9DaGVja1R4Iiwic2V0SXNHb29kIiwic2V0TnVtQ29uZmlybWF0aW9ucyIsImNvbmZpcm1hdGlvbnMiLCJpbl9wb29sIiwic2V0UmVjZWl2ZWRBbW91bnQiLCJyZWNlaXZlZCIsImdldFR4UHJvb2YiLCJjaGVja1R4UHJvb2YiLCJnZXRTcGVuZFByb29mIiwiY2hlY2tTcGVuZFByb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsIk1vbmVyb0NoZWNrUmVzZXJ2ZSIsInNldFVuY29uZmlybWVkU3BlbnRBbW91bnQiLCJzZXRUb3RhbEFtb3VudCIsInRvdGFsIiwiZ2V0VHhOb3RlcyIsIm5vdGVzIiwic2V0VHhOb3RlcyIsImdldEFkZHJlc3NCb29rRW50cmllcyIsImVudHJ5SW5kaWNlcyIsImVudHJpZXMiLCJycGNFbnRyeSIsIk1vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJzZXREZXNjcmlwdGlvbiIsImRlc2NyaXB0aW9uIiwiYWRkQWRkcmVzc0Jvb2tFbnRyeSIsImVkaXRBZGRyZXNzQm9va0VudHJ5Iiwic2V0X2FkZHJlc3MiLCJzZXRfZGVzY3JpcHRpb24iLCJkZWxldGVBZGRyZXNzQm9va0VudHJ5IiwiZW50cnlJZHgiLCJ0YWdBY2NvdW50cyIsImFjY291bnRJbmRpY2VzIiwidW50YWdBY2NvdW50cyIsImdldEFjY291bnRUYWdzIiwidGFncyIsImFjY291bnRfdGFncyIsInJwY0FjY291bnRUYWciLCJNb25lcm9BY2NvdW50VGFnIiwic2V0QWNjb3VudFRhZ0xhYmVsIiwiZ2V0UGF5bWVudFVyaSIsInJlY2lwaWVudF9uYW1lIiwiZ2V0UmVjaXBpZW50TmFtZSIsInR4X2Rlc2NyaXB0aW9uIiwiZ2V0Tm90ZSIsInVyaSIsInBhcnNlUGF5bWVudFVyaSIsIk1vbmVyb1R4Q29uZmlnIiwic2V0UmVjaXBpZW50TmFtZSIsInNldE5vdGUiLCJnZXRBdHRyaWJ1dGUiLCJ2YWx1ZSIsInNldEF0dHJpYnV0ZSIsInZhbCIsInN0YXJ0TWluaW5nIiwibnVtVGhyZWFkcyIsImJhY2tncm91bmRNaW5pbmciLCJpZ25vcmVCYXR0ZXJ5IiwidGhyZWFkc19jb3VudCIsImRvX2JhY2tncm91bmRfbWluaW5nIiwiaWdub3JlX2JhdHRlcnkiLCJzdG9wTWluaW5nIiwiaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCIsIm11bHRpc2lnX2ltcG9ydF9uZWVkZWQiLCJnZXRNdWx0aXNpZ0luZm8iLCJpbmZvIiwiTW9uZXJvTXVsdGlzaWdJbmZvIiwic2V0SXNNdWx0aXNpZyIsIm11bHRpc2lnIiwic2V0SXNSZWFkeSIsInJlYWR5Iiwic2V0VGhyZXNob2xkIiwidGhyZXNob2xkIiwic2V0TnVtUGFydGljaXBhbnRzIiwicHJlcGFyZU11bHRpc2lnIiwibXVsdGlzaWdfaW5mbyIsIm1ha2VNdWx0aXNpZyIsIm11bHRpc2lnSGV4ZXMiLCJleGNoYW5nZU11bHRpc2lnS2V5cyIsIm1zUmVzdWx0IiwiTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0Iiwic2V0TXVsdGlzaWdIZXgiLCJnZXRNdWx0aXNpZ0hleCIsImV4cG9ydE11bHRpc2lnSGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJyZWZyZXNoQWZ0ZXJJbXBvcnQiLCJyZWZyZXNoX2FmdGVyX2ltcG9ydCIsIm5fb3V0cHV0cyIsInNpZ25NdWx0aXNpZ1R4SGV4IiwibXVsdGlzaWdUeEhleCIsInNpZ25SZXN1bHQiLCJNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJzZXRTaWduZWRNdWx0aXNpZ1R4SGV4Iiwic2V0VHhIYXNoZXMiLCJzdWJtaXRNdWx0aXNpZ1R4SGV4Iiwic2lnbmVkTXVsdGlzaWdUeEhleCIsImNoYW5nZVBhc3N3b3JkIiwib2xkUGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsIm9sZF9wYXNzd29yZCIsIm5ld19wYXNzd29yZCIsInNhdmUiLCJjbG9zZSIsImlzQ2xvc2VkIiwic3RvcCIsImdldEluY29taW5nVHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlcnMiLCJjcmVhdGVUeCIsInJlbGF5VHgiLCJnZXRUeE5vdGUiLCJzZXRUeE5vdGUiLCJub3RlIiwiY29ubmVjdFRvV2FsbGV0UnBjIiwidXJpT3JDb25maWciLCJub3JtYWxpemVDb25maWciLCJjbWQiLCJzdGFydFdhbGxldFJwY1Byb2Nlc3MiLCJjaGlsZF9wcm9jZXNzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aGVuIiwiY2hpbGRQcm9jZXNzIiwic3Bhd24iLCJlbnYiLCJMQU5HIiwic3Rkb3V0Iiwic2V0RW5jb2RpbmciLCJzdGRlcnIiLCJ0aGF0IiwicmVqZWN0Iiwib24iLCJsaW5lIiwiTGlicmFyeVV0aWxzIiwibG9nIiwidXJpTGluZUNvbnRhaW5zIiwidXJpTGluZUNvbnRhaW5zSWR4IiwiaG9zdCIsInN1YnN0cmluZyIsImxhc3RJbmRleE9mIiwidW5mb3JtYXR0ZWRMaW5lIiwicmVwbGFjZSIsInRyaW0iLCJwb3J0Iiwic3NsSWR4Iiwic3NsRW5hYmxlZCIsInVzZXJQYXNzSWR4IiwidXNlclBhc3MiLCJ6bXFVcmlJZHgiLCJ6bXFVcmkiLCJwcm94eVVyaUlkeCIsInByb3h5VXJpIiwicmVqZWN0VW5hdXRob3JpemVkIiwiZ2V0UmVqZWN0VW5hdXRob3JpemVkIiwid2FsbGV0IiwiaXNSZXNvbHZlZCIsImdldExvZ0xldmVsIiwiY29kZSIsIm9yaWdpbiIsImdldEFjY291bnRJbmRpY2VzIiwidHhRdWVyeSIsImNhbkJlQ29uZmlybWVkIiwiZ2V0SW5UeFBvb2wiLCJnZXRJc0ZhaWxlZCIsImNhbkJlSW5UeFBvb2wiLCJnZXRNYXhIZWlnaHQiLCJnZXRJc0xvY2tlZCIsImNhbkJlSW5jb21pbmciLCJnZXRJc0luY29taW5nIiwiZ2V0SXNPdXRnb2luZyIsImdldEhhc0Rlc3RpbmF0aW9ucyIsImNhbkJlT3V0Z29pbmciLCJpbiIsIm91dCIsInBvb2wiLCJwZW5kaW5nIiwiZmFpbGVkIiwiZ2V0TWluSGVpZ2h0IiwibWluX2hlaWdodCIsIm1heF9oZWlnaHQiLCJmaWx0ZXJfYnlfaGVpZ2h0IiwiZ2V0U3ViYWRkcmVzc0luZGV4Iiwic2l6ZSIsImZyb20iLCJycGNUeCIsImNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlciIsImdldE91dGdvaW5nQW1vdW50Iiwib3V0Z29pbmdUcmFuc2ZlciIsInRyYW5zZmVyVG90YWwiLCJ2YWx1ZXMiLCJzb3J0IiwiY29tcGFyZVR4c0J5SGVpZ2h0Iiwic2V0SXNJbmNvbWluZyIsInNldElzT3V0Z29pbmciLCJjb21wYXJlSW5jb21pbmdUcmFuc2ZlcnMiLCJ0cmFuc2Zlcl90eXBlIiwiZ2V0SXNTcGVudCIsInZlcmJvc2UiLCJycGNPdXRwdXQiLCJjb252ZXJ0UnBjVHhXaXRoT3V0cHV0IiwiY29tcGFyZU91dHB1dHMiLCJycGNJbWFnZSIsIk1vbmVyb0tleUltYWdlIiwiTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQiLCJzZXRPZmZzZXQiLCJzZXRLZXlJbWFnZXMiLCJiZWxvd19hbW91bnQiLCJnZXRCZWxvd0Ftb3VudCIsInNldElzTG9ja2VkIiwic2V0SXNDb25maXJtZWQiLCJzZXRSZWxheSIsInNldElzTWluZXJUeCIsInNldElzRmFpbGVkIiwiTW9uZXJvRGVzdGluYXRpb24iLCJzZXREZXN0aW5hdGlvbnMiLCJzZXRPdXRnb2luZ1RyYW5zZmVyIiwiZ2V0VW5sb2NrVGltZSIsInNldFVubG9ja1RpbWUiLCJnZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsInNldExhc3RSZWxheWVkVGltZXN0YW1wIiwiRGF0ZSIsImdldFRpbWUiLCJnZXRJc0RvdWJsZVNwZW5kU2VlbiIsInNldElzRG91YmxlU3BlbmRTZWVuIiwibGlzdGVuZXJzIiwiV2FsbGV0UG9sbGVyIiwic2V0SXNQb2xsaW5nIiwiaXNQb2xsaW5nIiwic2VydmVyIiwicHJveHlUb1dvcmtlciIsInNldFByaW1hcnlBZGRyZXNzIiwic2V0VGFnIiwiZ2V0VGFnIiwic2V0UmluZ1NpemUiLCJNb25lcm9VdGlscyIsIlJJTkdfU0laRSIsIk1vbmVyb091dGdvaW5nVHJhbnNmZXIiLCJzZXRUeCIsImRlc3RDb3BpZXMiLCJkZXN0IiwiY29udmVydFJwY1R4U2V0IiwicnBjTWFwIiwiTW9uZXJvVHhTZXQiLCJzZXRNdWx0aXNpZ1R4SGV4Iiwic2V0VW5zaWduZWRUeEhleCIsInNldFNpZ25lZFR4SGV4Iiwic2lnbmVkX3R4c2V0IiwiZ2V0U2lnbmVkVHhIZXgiLCJycGNUeHMiLCJzZXRUeHMiLCJzZXRUeFNldCIsInNldEhhc2giLCJzZXRLZXkiLCJzZXRGdWxsSGV4Iiwic2V0TWV0YWRhdGEiLCJzZXRGZWUiLCJzZXRXZWlnaHQiLCJpbnB1dEtleUltYWdlc0xpc3QiLCJhc3NlcnRUcnVlIiwiZ2V0SW5wdXRzIiwic2V0SW5wdXRzIiwiaW5wdXRLZXlJbWFnZSIsIk1vbmVyb091dHB1dFdhbGxldCIsInNldEtleUltYWdlIiwic2V0SGV4IiwiYW1vdW50c0J5RGVzdExpc3QiLCJkZXN0aW5hdGlvbklkeCIsInR4SWR4IiwiYW1vdW50c0J5RGVzdCIsImlzT3V0Z29pbmciLCJ0eXBlIiwiZGVjb2RlUnBjVHlwZSIsImhlYWRlciIsInNldFNpemUiLCJNb25lcm9CbG9ja0hlYWRlciIsInNldFRpbWVzdGFtcCIsIk1vbmVyb0luY29taW5nVHJhbnNmZXIiLCJzZXROdW1TdWdnZXN0ZWRDb25maXJtYXRpb25zIiwiREVGQVVMVF9QQVlNRU5UX0lEIiwicnBjSW5kaWNlcyIsInJwY0luZGV4Iiwic2V0U3ViYWRkcmVzc0luZGV4IiwicnBjRGVzdGluYXRpb24iLCJkZXN0aW5hdGlvbktleSIsInNldElucHV0U3VtIiwic2V0T3V0cHV0U3VtIiwic2V0Q2hhbmdlQWRkcmVzcyIsInNldENoYW5nZUFtb3VudCIsInNldE51bUR1bW15T3V0cHV0cyIsInNldEV4dHJhSGV4IiwiaW5wdXRLZXlJbWFnZXMiLCJrZXlfaW1hZ2VzIiwiYW1vdW50cyIsInNldEJsb2NrIiwiTW9uZXJvQmxvY2siLCJtZXJnZSIsInNldEluY29taW5nVHJhbnNmZXJzIiwic2V0SXNTcGVudCIsInNldElzRnJvemVuIiwic2V0U3RlYWx0aFB1YmxpY0tleSIsInNldE91dHB1dHMiLCJycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0IiwicnBjVHlwZSIsImFUeCIsImFCbG9jayIsInR4MSIsInR4MiIsImRpZmYiLCJ0MSIsInQyIiwibzEiLCJvMiIsImhlaWdodENvbXBhcmlzb24iLCJjb21wYXJlIiwibG9jYWxlQ29tcGFyZSIsImV4cG9ydHMiLCJsb29wZXIiLCJUYXNrTG9vcGVyIiwicHJldkxvY2tlZFR4cyIsInByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnMiLCJwcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucyIsInRocmVhZFBvb2wiLCJUaHJlYWRQb29sIiwibnVtUG9sbGluZyIsInN0YXJ0IiwicGVyaW9kSW5NcyIsInN1Ym1pdCIsInByZXZCYWxhbmNlcyIsInByZXZIZWlnaHQiLCJNb25lcm9UeFF1ZXJ5Iiwib25OZXdCbG9jayIsIm1pbkhlaWdodCIsIm1heCIsImxvY2tlZFR4cyIsInNldE1pbkhlaWdodCIsInNldEluY2x1ZGVPdXRwdXRzIiwibm9Mb25nZXJMb2NrZWRIYXNoZXMiLCJwcmV2TG9ja2VkVHgiLCJ1bmxvY2tlZFR4cyIsInNldEhhc2hlcyIsImxvY2tlZFR4Iiwic2VhcmNoU2V0IiwidW5hbm5vdW5jZWQiLCJub3RpZnlPdXRwdXRzIiwidW5sb2NrZWRUeCIsImRlbGV0ZSIsImNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzIiwiYW5ub3VuY2VOZXdCbG9jayIsImdldEZlZSIsImFubm91bmNlT3V0cHV0U3BlbnQiLCJhbm5vdW5jZU91dHB1dFJlY2VpdmVkIiwiYmFsYW5jZXMiLCJhbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRScGMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4uL2NvbW1vbi9UYXNrTG9vcGVyXCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50XCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudFRhZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50VGFnXCI7XG5pbXBvcnQgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BZGRyZXNzQm9va0VudHJ5XCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrSGVhZGVyIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tIZWFkZXJcIjtcbmltcG9ydCBNb25lcm9DaGVja1Jlc2VydmUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tSZXNlcnZlXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvRGVzdGluYXRpb24gZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGVzdGluYXRpb25cIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbmNvbWluZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnU2lnblJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb091dGdvaW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0Z29pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvUnBjRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNFcnJvclwiO1xuaW1wb3J0IE1vbmVyb1N1YmFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHggZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9UeFwiO1xuaW1wb3J0IE1vbmVyb1R4Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvVHhQcmlvcml0eSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFByaW9yaXR5XCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuLi9jb21tb24vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdFwiO1xuaW1wb3J0IFRocmVhZFBvb2wgZnJvbSBcIi4uL2NvbW1vbi9UaHJlYWRQb29sXCI7XG5pbXBvcnQgU3NsT3B0aW9ucyBmcm9tIFwiLi4vY29tbW9uL1NzbE9wdGlvbnNcIjtcbmltcG9ydCB7IENoaWxkUHJvY2VzcyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5cbi8qKlxuICogQ29weXJpZ2h0IChjKSB3b29kc2VyXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9XYWxsZXQgYXMgYSBjbGllbnQgb2YgbW9uZXJvLXdhbGxldC1ycGMuXG4gKiBcbiAqIEBpbXBsZW1lbnRzIHtNb25lcm9XYWxsZXR9XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1dhbGxldFJwYyBleHRlbmRzIE1vbmVyb1dhbGxldCB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgPSAyMDAwMDsgLy8gZGVmYXVsdCBwZXJpb2QgYmV0d2VlbiBzeW5jcyBpbiBtcyAoZGVmaW5lZCBieSBERUZBVUxUX0FVVE9fUkVGUkVTSF9QRVJJT0QgaW4gd2FsbGV0X3JwY19zZXJ2ZXIuY3BwKVxuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz47XG4gIHByb3RlY3RlZCBhZGRyZXNzQ2FjaGU6IGFueTtcbiAgcHJvdGVjdGVkIHN5bmNQZXJpb2RJbk1zOiBudW1iZXI7XG4gIHByb3RlY3RlZCBsaXN0ZW5lcnM6IE1vbmVyb1dhbGxldExpc3RlbmVyW107XG4gIHByb3RlY3RlZCBwcm9jZXNzOiBhbnk7XG4gIHByb3RlY3RlZCBwYXRoOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBkYWVtb25Db25uZWN0aW9uOiBNb25lcm9ScGNDb25uZWN0aW9uO1xuICBwcm90ZWN0ZWQgd2FsbGV0UG9sbGVyOiBXYWxsZXRQb2xsZXI7XG4gIHByb3RlY3RlZCBzdGFydHVwUHJveHlVcmk6IHN0cmluZztcbiAgXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTsgLy8gYXZvaWQgdW5lY2Vzc2FyeSByZXF1ZXN0cyBmb3IgYWRkcmVzc2VzXG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IE1vbmVyb1dhbGxldFJwYy5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUlBDIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaW50ZXJuYWwgcHJvY2VzcyBydW5uaW5nIG1vbmVyby13YWxsZXQtcnBjLlxuICAgKiBcbiAgICogQHJldHVybiB7Q2hpbGRQcm9jZXNzfSB0aGUgcHJvY2VzcyBydW5uaW5nIG1vbmVyby13YWxsZXQtcnBjLCB1bmRlZmluZWQgaWYgbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1xuICAgKi9cbiAgZ2V0UHJvY2VzcygpOiBDaGlsZFByb2Nlc3Mge1xuICAgIHJldHVybiB0aGlzLnByb2Nlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9wIHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMsIGlmIGFwcGxpY2FibGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZvcmNlIHNwZWNpZmllcyBpZiB0aGUgcHJvY2VzcyBzaG91bGQgYmUgZGVzdHJveWVkIGZvcmNpYmx5IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD59IHRoZSBleGl0IGNvZGUgZnJvbSBzdG9wcGluZyB0aGUgcHJvY2Vzc1xuICAgKi9cbiAgYXN5bmMgc3RvcFByb2Nlc3MoZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPiAge1xuICAgIGlmICh0aGlzLnByb2Nlc3MgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0UnBjIGluc3RhbmNlIG5vdCBjcmVhdGVkIGZyb20gbmV3IHByb2Nlc3NcIik7XG4gICAgbGV0IGxpc3RlbmVyc0NvcHkgPSBHZW5VdGlscy5jb3B5QXJyYXkodGhpcy5nZXRMaXN0ZW5lcnMoKSk7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgbGlzdGVuZXJzQ29weSkgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgcmV0dXJuIEdlblV0aWxzLmtpbGxQcm9jZXNzKHRoaXMucHJvY2VzcywgZm9yY2UgPyBcIlNJR0tJTExcIiA6IHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIFJQQyBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZH0gdGhlIHdhbGxldCdzIHJwYyBjb25uZWN0aW9uXG4gICAqL1xuICBnZXRScGNDb25uZWN0aW9uKCk6IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPk9wZW4gYW4gZXhpc3Rpbmcgd2FsbGV0IG9uIHRoZSBtb25lcm8td2FsbGV0LXJwYyBzZXJ2ZXIuPC9wPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZTo8cD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiBsZXQgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldFJwYyhcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODRcIiwgXCJycGNfdXNlclwiLCBcImFiYzEyM1wiKTs8YnI+XG4gICAqIGF3YWl0IHdhbGxldC5vcGVuV2FsbGV0KFwibXl3YWxsZXQxXCIsIFwic3VwZXJzZWNyZXRwYXNzd29yZFwiKTs8YnI+XG4gICAqIDxicj5cbiAgICogYXdhaXQgd2FsbGV0Lm9wZW5XYWxsZXQoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwibXl3YWxsZXQyXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwic3VwZXJzZWNyZXRwYXNzd29yZFwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHNlcnZlcjogXCJodHRwOi8vbG9jYWhvc3Q6MzgwODFcIiwgLy8gb3Igb2JqZWN0IHdpdGggdXJpLCB1c2VybmFtZSwgcGFzc3dvcmQsIGV0YyA8YnI+XG4gICAqICZuYnNwOyZuYnNwOyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlPGJyPlxuICAgKiB9KTs8YnI+XG4gICAqIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfE1vbmVyb1dhbGxldENvbmZpZ30gcGF0aE9yQ29uZmlnICAtIHRoZSB3YWxsZXQncyBuYW1lIG9yIGNvbmZpZ3VyYXRpb24gdG8gb3BlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aE9yQ29uZmlnLnBhdGggLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoT3JDb25maWcucGFzc3dvcmQgLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ3xQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fSBwYXRoT3JDb25maWcuc2VydmVyIC0gdXJpIG9yIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb2YgYSBkYWVtb24gdG8gdXNlIChvcHRpb25hbCwgbW9uZXJvLXdhbGxldC1ycGMgdXN1YWxseSBzdGFydGVkIHdpdGggZGFlbW9uIGNvbmZpZylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtwYXNzd29yZF0gdGhlIHdhbGxldCdzIHBhc3N3b3JkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvV2FsbGV0UnBjPn0gdGhpcyB3YWxsZXQgY2xpZW50XG4gICAqL1xuICBhc3luYyBvcGVuV2FsbGV0KHBhdGhPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+LCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh0eXBlb2YgcGF0aE9yQ29uZmlnID09PSBcInN0cmluZ1wiID8ge3BhdGg6IHBhdGhPckNvbmZpZywgcGFzc3dvcmQ6IHBhc3N3b3JkID8gcGFzc3dvcmQgOiBcIlwifSA6IHBhdGhPckNvbmZpZyk7XG4gICAgLy8gVE9ETzogZW5zdXJlIG90aGVyIGZpZWxkcyB1bmluaXRpYWxpemVkP1xuICAgIFxuICAgIC8vIG9wZW4gd2FsbGV0IG9uIHJwYyBzZXJ2ZXJcbiAgICBpZiAoIWNvbmZpZy5nZXRQYXRoKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBuYW1lIG9mIHdhbGxldCB0byBvcGVuXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVndGVzdCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHJlZ3Rlc3QgbW9kZSB3aGVuIG9wZW5pbmcgUlBDIHdhbGxldFwiKVxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm9wZW5fd2FsbGV0XCIsIHtmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSwgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpfSk7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG5cbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyIG9yIHNlcnZlclxuICAgIGlmIChjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSAhPSBudWxsKSB7XG4gICAgICBpZiAoY29uZmlnLmdldFNlcnZlcigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIG9wZW5lZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBhd2FpdCB0aGlzLnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICB9IGVsc2UgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSAhPSBudWxsKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldERhZW1vbkNvbm5lY3Rpb24oY29uZmlnLmdldFNlcnZlcigpKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5DcmVhdGUgYW5kIG9wZW4gYSB3YWxsZXQgb24gdGhlIG1vbmVyby13YWxsZXQtcnBjIHNlcnZlci48cD5cbiAgICogXG4gICAqIDxwPkV4YW1wbGU6PHA+XG4gICAqIFxuICAgKiA8Y29kZT5cbiAgICogJnNvbDsmc29sOyBjb25zdHJ1Y3QgY2xpZW50IHRvIG1vbmVyby13YWxsZXQtcnBjPGJyPlxuICAgKiBsZXQgd2FsbGV0UnBjID0gbmV3IE1vbmVyb1dhbGxldFJwYyhcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODRcIiwgXCJycGNfdXNlclwiLCBcImFiYzEyM1wiKTs8YnI+PGJyPlxuICAgKiBcbiAgICogJnNvbDsmc29sOyBjcmVhdGUgYW5kIG9wZW4gd2FsbGV0IG9uIG1vbmVyby13YWxsZXQtcnBjPGJyPlxuICAgKiBhd2FpdCB3YWxsZXRScGMuY3JlYXRlV2FsbGV0KHs8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXRoOiBcIm15d2FsbGV0XCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiYWJjMTIzXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VlZDogXCJjb2V4aXN0IGlnbG9vIHBhbXBobGV0IGxhZ29vbi4uLlwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlc3RvcmVIZWlnaHQ6IDE1NDMyMThsPGJyPlxuICAgKiB9KTtcbiAgICogIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+fSBjb25maWcgLSBNb25lcm9XYWxsZXRDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF0aF0gLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhc3N3b3JkXSAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRdIC0gc2VlZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIHJhbmRvbSB3YWxsZXQgY3JlYXRlZCBpZiBuZWl0aGVyIHNlZWQgbm9yIGtleXMgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRPZmZzZXRdIC0gdGhlIG9mZnNldCB1c2VkIHRvIGRlcml2ZSBhIG5ldyBzZWVkIGZyb20gdGhlIGdpdmVuIHNlZWQgdG8gcmVjb3ZlciBhIHNlY3JldCB3YWxsZXQgZnJvbSB0aGUgc2VlZFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuaXNNdWx0aXNpZ10gLSByZXN0b3JlIG11bHRpc2lnIHdhbGxldCBmcm9tIHNlZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpbWFyeUFkZHJlc3NdIC0gcHJpbWFyeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmx5IHByb3ZpZGUgaWYgcmVzdG9yaW5nIGZyb20ga2V5cylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVZpZXdLZXldIC0gcHJpdmF0ZSB2aWV3IGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVTcGVuZEtleV0gLSBwcml2YXRlIHNwZW5kIGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnJlc3RvcmVIZWlnaHRdIC0gYmxvY2sgaGVpZ2h0IHRvIHN0YXJ0IHNjYW5uaW5nIGZyb20gKGRlZmF1bHRzIHRvIDAgdW5sZXNzIGdlbmVyYXRpbmcgcmFuZG9tIHdhbGxldClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcubGFuZ3VhZ2VdIC0gbGFuZ3VhZ2Ugb2YgdGhlIHdhbGxldCdzIG1uZW1vbmljIHBocmFzZSBvciBzZWVkIChkZWZhdWx0cyB0byBcIkVuZ2xpc2hcIiBvciBhdXRvLWRldGVjdGVkKVxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb259IFtjb25maWcuc2VydmVyXSAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gdG8gYSBtb25lcm8gZGFlbW9uIChvcHRpb25hbCk8YnI+XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclVyaV0gLSB1cmkgb2YgYSBkYWVtb24gdG8gdXNlIChvcHRpb25hbCwgbW9uZXJvLXdhbGxldC1ycGMgdXN1YWxseSBzdGFydGVkIHdpdGggZGFlbW9uIGNvbmZpZylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyVXNlcm5hbWVdIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIGRhZW1vbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclBhc3N3b3JkXSAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBkYWVtb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSBbY29uZmlnLmNvbm5lY3Rpb25NYW5hZ2VyXSAtIG1hbmFnZSBjb25uZWN0aW9ucyB0byBtb25lcm9kIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlamVjdFVuYXV0aG9yaXplZF0gLSByZWplY3Qgc2VsZi1zaWduZWQgc2VydmVyIGNlcnRpZmljYXRlcyBpZiB0cnVlIChkZWZhdWx0cyB0byB0cnVlKVxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb259IFtjb25maWcuc2VydmVyXSAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb3IgZXF1aXZhbGVudCBKUyBvYmplY3QgcHJvdmlkaW5nIGRhZW1vbiBjb25maWd1cmF0aW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnNhdmVDdXJyZW50XSAtIHNwZWNpZmllcyBpZiB0aGUgY3VycmVudCBSUEMgd2FsbGV0IHNob3VsZCBiZSBzYXZlZCBiZWZvcmUgYmVpbmcgY2xvc2VkIChkZWZhdWx0IHRydWUpXG4gICAqIEByZXR1cm4ge01vbmVyb1dhbGxldFJwY30gdGhpcyB3YWxsZXQgY2xpZW50XG4gICAqL1xuICBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgY29uZmlnIHRvIGNyZWF0ZSB3YWxsZXRcIik7XG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCAmJiAoY29uZmlnTm9ybWFsaXplZC5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBpbml0aWFsaXplZCB3aXRoIGEgc2VlZCBvciBrZXlzIGJ1dCBub3QgYm90aFwiKTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVndGVzdCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHJlZ3Rlc3QgbW9kZSB3aGVuIGNyZWF0aW5nIFJQQyB3YWxsZXRcIilcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXROZXR3b3JrVHlwZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIG5ldHdvcmtUeXBlIHdoZW4gY3JlYXRpbmcgUlBDIHdhbGxldCBiZWNhdXNlIHNlcnZlcidzIG5ldHdvcmsgdHlwZSBpcyBhbHJlYWR5IHNldFwiKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50TG9va2FoZWFkKCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NMb29rYWhlYWQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGNyZWF0aW5nIHdhbGxldHMgd2l0aCBzdWJhZGRyZXNzIGxvb2thaGVhZCBvdmVyIHJwY1wiKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRQYXNzd29yZCgpID09PSB1bmRlZmluZWQpIGNvbmZpZ05vcm1hbGl6ZWQuc2V0UGFzc3dvcmQoXCJcIik7XG5cbiAgICAvLyBzZXQgc2VydmVyIGZyb20gY29ubmVjdGlvbiBtYW5hZ2VyIGlmIHByb3ZpZGVkXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgY3JlYXRlZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBjb25maWdOb3JtYWxpemVkLnNldFNlcnZlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKS5nZXRDb25uZWN0aW9uKCkpO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCkgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWdOb3JtYWxpemVkKTtcbiAgICBlbHNlIGlmIChjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQpIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0RnJvbUtleXMoY29uZmlnTm9ybWFsaXplZCk7XG4gICAgZWxzZSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldFJhbmRvbShjb25maWdOb3JtYWxpemVkKTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXIgb3Igc2VydmVyXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXRDb25uZWN0aW9uTWFuYWdlcihjb25maWdOb3JtYWxpemVkLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIH0gZWxzZSBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldFJhbmRvbShjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHJlc3RvcmVIZWlnaHQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKSA9PT0gZmFsc2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkN1cnJlbnQgd2FsbGV0IGlzIHNhdmVkIGF1dG9tYXRpY2FsbHkgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmICghY29uZmlnLmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTmFtZSBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0TGFuZ3VhZ2UoKSkgY29uZmlnLnNldExhbmd1YWdlKE1vbmVyb1dhbGxldC5ERUZBVUxUX0xBTkdVQUdFKTtcbiAgICBsZXQgcGFyYW1zID0geyBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSwgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLCBsYW5ndWFnZTogY29uZmlnLmdldExhbmd1YWdlKCkgfTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX3dhbGxldFwiLCBwYXJhbXMpO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aGlzLmhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKGNvbmZpZy5nZXRQYXRoKCksIGVycik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVzdG9yZV9kZXRlcm1pbmlzdGljX3dhbGxldFwiLCB7XG4gICAgICAgIGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLFxuICAgICAgICBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksXG4gICAgICAgIHNlZWQ6IGNvbmZpZy5nZXRTZWVkKCksXG4gICAgICAgIHNlZWRfb2Zmc2V0OiBjb25maWcuZ2V0U2VlZE9mZnNldCgpLFxuICAgICAgICBlbmFibGVfbXVsdGlzaWdfZXhwZXJpbWVudGFsOiBjb25maWcuZ2V0SXNNdWx0aXNpZygpLFxuICAgICAgICByZXN0b3JlX2hlaWdodDogY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSxcbiAgICAgICAgbGFuZ3VhZ2U6IGNvbmZpZy5nZXRMYW5ndWFnZSgpLFxuICAgICAgICBhdXRvc2F2ZV9jdXJyZW50OiBjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBrZXlzXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRSZXN0b3JlSGVpZ2h0KDApO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoTW9uZXJvV2FsbGV0LkRFRkFVTFRfTEFOR1VBR0UpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZW5lcmF0ZV9mcm9tX2tleXNcIiwge1xuICAgICAgICBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSxcbiAgICAgICAgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLFxuICAgICAgICBhZGRyZXNzOiBjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSxcbiAgICAgICAgdmlld2tleTogY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCksXG4gICAgICAgIHNwZW5ka2V5OiBjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCksXG4gICAgICAgIHJlc3RvcmVfaGVpZ2h0OiBjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpLFxuICAgICAgICBhdXRvc2F2ZV9jdXJyZW50OiBjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBoYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihuYW1lLCBlcnIpIHtcbiAgICBpZiAoZXJyLm1lc3NhZ2UpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwiYWxyZWFkeSBleGlzdHNcIikpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBuYW1lLCBlcnIuZ2V0Q29kZSgpLCBlcnIuZ2V0UnBjTWV0aG9kKCksIGVyci5nZXRScGNQYXJhbXMoKSk7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcIndvcmQgbGlzdCBmYWlsZWQgdmVyaWZpY2F0aW9uXCIpKSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoXCJJbnZhbGlkIG1uZW1vbmljXCIsIGVyci5nZXRDb2RlKCksIGVyci5nZXRScGNNZXRob2QoKSwgZXJyLmdldFJwY1BhcmFtcygpKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9XG4gIFxuICBhc3luYyBpc1ZpZXdPbmx5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwge2tleV90eXBlOiBcIm1uZW1vbmljXCJ9KTtcbiAgICAgIHJldHVybiBmYWxzZTsgLy8ga2V5IHJldHJpZXZhbCBzdWNjZWVkcyBpZiBub3QgdmlldyBvbmx5XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0yOSkgcmV0dXJuIHRydWU7ICAvLyB3YWxsZXQgaXMgdmlldyBvbmx5XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0xKSByZXR1cm4gZmFsc2U7ICAvLyB3YWxsZXQgaXMgb2ZmbGluZSBidXQgbm90IHZpZXcgb25seVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvUnBjQ29ubmVjdGlvbn0gW3VyaU9yQ29ubmVjdGlvbl0gLSB0aGUgZGFlbW9uJ3MgVVJJIG9yIGNvbm5lY3Rpb24gKGRlZmF1bHRzIHRvIG9mZmxpbmUpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNUcnVzdGVkIC0gaW5kaWNhdGVzIGlmIHRoZSBkYWVtb24gaW4gdHJ1c3RlZFxuICAgKiBAcGFyYW0ge1NzbE9wdGlvbnN9IHNzbE9wdGlvbnMgLSBjdXN0b20gU1NMIGNvbmZpZ3VyYXRpb25cbiAgICovXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uPzogUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IHN0cmluZywgaXNUcnVzdGVkPzogYm9vbGVhbiwgc3NsT3B0aW9ucz86IFNzbE9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgY29ubmVjdGlvbiA9ICF1cmlPckNvbm5lY3Rpb24gPyB1bmRlZmluZWQgOiB1cmlPckNvbm5lY3Rpb24gaW5zdGFuY2VvZiBNb25lcm9ScGNDb25uZWN0aW9uID8gdXJpT3JDb25uZWN0aW9uIDogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uKTtcbiAgICBpZiAoIXNzbE9wdGlvbnMpIHNzbE9wdGlvbnMgPSBuZXcgU3NsT3B0aW9ucygpO1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hZGRyZXNzID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0VXJpKCkgOiBcImJhZF91cmlcIjsgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogYmFkIGRhZW1vbiB1cmkgbmVjZXNzYXJ5IGZvciBvZmZsaW5lP1xuICAgIHBhcmFtcy51c2VybmFtZSA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFVzZXJuYW1lKCkgOiBcIlwiO1xuICAgIHBhcmFtcy5wYXNzd29yZCA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIHBhcmFtcy50cnVzdGVkID0gaXNUcnVzdGVkO1xuICAgIHBhcmFtcy5zc2xfc3VwcG9ydCA9IFwiYXV0b2RldGVjdFwiO1xuICAgIHBhcmFtcy5zc2xfcHJpdmF0ZV9rZXlfcGF0aCA9IHNzbE9wdGlvbnMuZ2V0UHJpdmF0ZUtleVBhdGgoKTtcbiAgICBwYXJhbXMuc3NsX2NlcnRpZmljYXRlX3BhdGggID0gc3NsT3B0aW9ucy5nZXRDZXJ0aWZpY2F0ZVBhdGgoKTtcbiAgICBwYXJhbXMuc3NsX2NhX2ZpbGUgPSBzc2xPcHRpb25zLmdldENlcnRpZmljYXRlQXV0aG9yaXR5RmlsZSgpO1xuICAgIHBhcmFtcy5zc2xfYWxsb3dlZF9maW5nZXJwcmludHMgPSBzc2xPcHRpb25zLmdldEFsbG93ZWRGaW5nZXJwcmludHMoKTtcbiAgICBwYXJhbXMuc3NsX2FsbG93X2FueV9jZXJ0ID0gc3NsT3B0aW9ucy5nZXRBbGxvd0FueUNlcnQoKTtcblxuICAgIC8vIHNldCBwcm94eSB3aGljaCBtdXN0IG1hdGNoIHN0YXJ0dXAgcHJveHkgaWYgYXBwbGljYWJsZVxuICAgIGlmIChjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodGhpcy5zdGFydHVwUHJveHlVcmkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNldCBkYWVtb24gY29ubmVjdGlvbiB3aXRob3V0IHByb3h5IFVSSSBiZWNhdXNlIG1vbmVyby13YWxsZXQtcnBjIHdhcyBzdGFydGVkIHdpdGggYSBwcm94eSBVUkk6IFwiICsgdGhpcy5zdGFydHVwUHJveHlVcmkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5zdGFydHVwUHJveHlVcmkgPT09IHVuZGVmaW5lZCkgcGFyYW1zLnByb3h5ID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA6IFwiXCI7XG4gICAgICBlbHNlIGlmICh0aGlzLnN0YXJ0dXBQcm94eVVyaSAhPT0gY29ubmVjdGlvbi5nZXRQcm94eVVyaSgpKSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzZXQgZGFlbW9uIGNvbm5lY3Rpb24gd2l0aCBwcm94eSBVUkkgXCIgKyBjb25uZWN0aW9uLmdldFByb3h5VXJpKCkgKyBcIiBiZWNhdXNlIG1vbmVyby13YWxsZXQtcnBjIHdhcyBzdGFydGVkIHdpdGggYSBkaWZmZXJlbnQgcHJveHkgVVJJOiBcIiArIHRoaXMuc3RhcnR1cFByb3h5VXJpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFwYXJhbXMucHJveHkpIHBhcmFtcy5wcm94eSA9IFwiXCI7XG5cbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfZGFlbW9uXCIsIHBhcmFtcyk7XG4gICAgdGhpcy5kYWVtb25Db25uZWN0aW9uID0gY29ubmVjdGlvbjtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uQ29ubmVjdGlvbigpOiBQcm9taXNlPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHtcbiAgICByZXR1cm4gdGhpcy5kYWVtb25Db25uZWN0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdG90YWwgYW5kIHVubG9ja2VkIGJhbGFuY2VzIGluIGEgc2luZ2xlIHJlcXVlc3QuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2FjY291bnRJZHhdIGFjY291bnQgaW5kZXhcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdWJhZGRyZXNzSWR4XSBzdWJhZGRyZXNzIGluZGV4XG4gICAqIEByZXR1cm4ge1Byb21pc2U8YmlnaW50W10+fSBpcyB0aGUgdG90YWwgYW5kIHVubG9ja2VkIGJhbGFuY2VzIGluIGFuIGFycmF5LCByZXNwZWN0aXZlbHlcbiAgICovXG4gIGFzeW5jIGdldEJhbGFuY2VzKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludFtdPiB7XG4gICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0LmVxdWFsKHN1YmFkZHJlc3NJZHgsIHVuZGVmaW5lZCwgXCJNdXN0IHByb3ZpZGUgYWNjb3VudCBpbmRleCB3aXRoIHN1YmFkZHJlc3MgaW5kZXhcIik7XG4gICAgICBsZXQgYmFsYW5jZSA9IEJpZ0ludCgwKTtcbiAgICAgIGxldCB1bmxvY2tlZEJhbGFuY2UgPSBCaWdJbnQoMCk7XG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgICBiYWxhbmNlID0gYmFsYW5jZSArIGFjY291bnQuZ2V0QmFsYW5jZSgpO1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2UgPSB1bmxvY2tlZEJhbGFuY2UgKyBhY2NvdW50LmdldFVubG9ja2VkQmFsYW5jZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFtiYWxhbmNlLCB1bmxvY2tlZEJhbGFuY2VdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcGFyYW1zID0ge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHgsIGFkZHJlc3NfaW5kaWNlczogc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogW3N1YmFkZHJlc3NJZHhdfTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwgcGFyYW1zKTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQpIHJldHVybiBbQmlnSW50KHJlc3AucmVzdWx0LmJhbGFuY2UpLCBCaWdJbnQocmVzcC5yZXN1bHQudW5sb2NrZWRfYmFsYW5jZSldO1xuICAgICAgZWxzZSByZXR1cm4gW0JpZ0ludChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzc1swXS5iYWxhbmNlKSwgQmlnSW50KHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzWzBdLnVubG9ja2VkX2JhbGFuY2UpXTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIENPTU1PTiBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvV2FsbGV0TGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3VwZXIucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZFRvRGFlbW9uKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNoZWNrUmVzZXJ2ZVByb29mKGF3YWl0IHRoaXMuZ2V0UHJpbWFyeUFkZHJlc3MoKSwgXCJcIiwgXCJcIik7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogcHJvdmlkZSBiZXR0ZXIgd2F5IHRvIGtub3cgaWYgd2FsbGV0IHJwYyBpcyBjb25uZWN0ZWQgdG8gZGFlbW9uXG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJjaGVjayByZXNlcnZlIGV4cGVjdGVkIHRvIGZhaWxcIik7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtMTMpIHRocm93IGU7IC8vIG5vIHdhbGxldCBmaWxlXG4gICAgICByZXR1cm4gZS5tZXNzYWdlLmluZGV4T2YoXCJGYWlsZWQgdG8gY29ubmVjdCB0byBkYWVtb25cIikgPCAwO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF92ZXJzaW9uXCIpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVmVyc2lvbihyZXNwLnJlc3VsdC52ZXJzaW9uLCByZXNwLnJlc3VsdC5yZWxlYXNlKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF0aCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLnBhdGg7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNlZWQoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcIm1uZW1vbmljXCIgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmtleTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZExhbmd1YWdlKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKGF3YWl0IHRoaXMuZ2V0U2VlZCgpID09PSB1bmRlZmluZWQpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0UnBjLmdldFNlZWRMYW5ndWFnZSgpIG5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgbGlzdCBvZiBhdmFpbGFibGUgbGFuZ3VhZ2VzIGZvciB0aGUgd2FsbGV0J3Mgc2VlZC5cbiAgICogXG4gICAqIEByZXR1cm4ge3N0cmluZ1tdfSB0aGUgYXZhaWxhYmxlIGxhbmd1YWdlcyBmb3IgdGhlIHdhbGxldCdzIHNlZWQuXG4gICAqL1xuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2VzKCkge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2xhbmd1YWdlc1wiKSkucmVzdWx0Lmxhbmd1YWdlcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHJpdmF0ZVZpZXdLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcInZpZXdfa2V5XCIgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmtleTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHJpdmF0ZVNwZW5kS2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwgeyBrZXlfdHlwZTogXCJzcGVuZF9rZXlcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgc3ViYWRkcmVzc01hcCA9IHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdO1xuICAgIGlmICghc3ViYWRkcmVzc01hcCkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCB0cnVlKTsgIC8vIGNhY2hlJ3MgYWxsIGFkZHJlc3NlcyBhdCB0aGlzIGFjY291bnRcbiAgICAgIHJldHVybiB0aGlzLmdldEFkZHJlc3MoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7ICAgICAgICAvLyByZWN1cnNpdmUgY2FsbCB1c2VzIGNhY2hlXG4gICAgfVxuICAgIGxldCBhZGRyZXNzID0gc3ViYWRkcmVzc01hcFtzdWJhZGRyZXNzSWR4XTtcbiAgICBpZiAoIWFkZHJlc3MpIHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHVuZGVmaW5lZCwgdHJ1ZSk7ICAvLyBjYWNoZSdzIGFsbCBhZGRyZXNzZXMgYXQgdGhpcyBhY2NvdW50XG4gICAgICByZXR1cm4gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF1bc3ViYWRkcmVzc0lkeF07XG4gICAgfVxuICAgIHJldHVybiBhZGRyZXNzO1xuICB9XG4gIFxuICAvLyBUT0RPOiB1c2UgY2FjaGVcbiAgYXN5bmMgZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIFxuICAgIC8vIGZldGNoIHJlc3VsdCBhbmQgbm9ybWFsaXplIGVycm9yIGlmIGFkZHJlc3MgZG9lcyBub3QgYmVsb25nIHRvIHRoZSB3YWxsZXRcbiAgICBsZXQgcmVzcDtcbiAgICB0cnkge1xuICAgICAgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzX2luZGV4XCIsIHthZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0yKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZS5tZXNzYWdlKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICAgIFxuICAgIC8vIGNvbnZlcnQgcnBjIHJlc3BvbnNlXG4gICAgbGV0IHN1YmFkZHJlc3MgPSBuZXcgTW9uZXJvU3ViYWRkcmVzcyh7YWRkcmVzczogYWRkcmVzc30pO1xuICAgIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KHJlc3AucmVzdWx0LmluZGV4Lm1ham9yKTtcbiAgICBzdWJhZGRyZXNzLnNldEluZGV4KHJlc3AucmVzdWx0LmluZGV4Lm1pbm9yKTtcbiAgICByZXR1cm4gc3ViYWRkcmVzcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzPzogc3RyaW5nLCBwYXltZW50SWQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBpbnRlZ3JhdGVkQWRkcmVzc1N0ciA9IChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJtYWtlX2ludGVncmF0ZWRfYWRkcmVzc1wiLCB7c3RhbmRhcmRfYWRkcmVzczogc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50X2lkOiBwYXltZW50SWR9KSkucmVzdWx0LmludGVncmF0ZWRfYWRkcmVzcztcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzU3RyKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLm1lc3NhZ2UuaW5jbHVkZXMoXCJJbnZhbGlkIHBheW1lbnQgSURcIikpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgcGF5bWVudCBJRDogXCIgKyBwYXltZW50SWQpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzcGxpdF9pbnRlZ3JhdGVkX2FkZHJlc3NcIiwge2ludGVncmF0ZWRfYWRkcmVzczogaW50ZWdyYXRlZEFkZHJlc3N9KTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKCkuc2V0U3RhbmRhcmRBZGRyZXNzKHJlc3AucmVzdWx0LnN0YW5kYXJkX2FkZHJlc3MpLnNldFBheW1lbnRJZChyZXNwLnJlc3VsdC5wYXltZW50X2lkKS5zZXRJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzcyk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2hlaWdodFwiKSkucmVzdWx0LmhlaWdodDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uSGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3Qgc3VwcG9ydCBnZXR0aW5nIHRoZSBjaGFpbiBoZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodEJ5RGF0ZSh5ZWFyOiBudW1iZXIsIG1vbnRoOiBudW1iZXIsIGRheTogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGdldHRpbmcgYSBoZWlnaHQgYnkgZGF0ZVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc3luYyhsaXN0ZW5lck9yU3RhcnRIZWlnaHQ/OiBNb25lcm9XYWxsZXRMaXN0ZW5lciB8IG51bWJlciwgc3RhcnRIZWlnaHQ/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb1N5bmNSZXN1bHQ+IHtcbiAgICBhc3NlcnQoIShsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciksIFwiTW9uZXJvIFdhbGxldCBSUEMgZG9lcyBub3Qgc3VwcG9ydCByZXBvcnRpbmcgc3luYyBwcm9ncmVzc1wiKTtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZWZyZXNoXCIsIHtzdGFydF9oZWlnaHQ6IHN0YXJ0SGVpZ2h0fSk7XG4gICAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvU3luY1Jlc3VsdChyZXNwLnJlc3VsdC5ibG9ja3NfZmV0Y2hlZCwgcmVzcC5yZXN1bHQucmVjZWl2ZWRfbW9uZXkpO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UgPT09IFwibm8gY29ubmVjdGlvbiB0byBkYWVtb25cIikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIG5vdCBjb25uZWN0ZWQgdG8gZGFlbW9uXCIpO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgXG4gICAgLy8gY29udmVydCBtcyB0byBzZWNvbmRzIGZvciBycGMgcGFyYW1ldGVyXG4gICAgbGV0IHN5bmNQZXJpb2RJblNlY29uZHMgPSBNYXRoLnJvdW5kKChzeW5jUGVyaW9kSW5NcyA9PT0gdW5kZWZpbmVkID8gTW9uZXJvV2FsbGV0UnBjLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgOiBzeW5jUGVyaW9kSW5NcykgLyAxMDAwKTtcbiAgICBcbiAgICAvLyBzZW5kIHJwYyByZXF1ZXN0XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiYXV0b19yZWZyZXNoXCIsIHtcbiAgICAgIGVuYWJsZTogdHJ1ZSxcbiAgICAgIHBlcmlvZDogc3luY1BlcmlvZEluU2Vjb25kc1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHVwZGF0ZSBzeW5jIHBlcmlvZCBmb3IgcG9sbGVyXG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IHN5bmNQZXJpb2RJblNlY29uZHMgKiAxMDAwO1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkKSB0aGlzLndhbGxldFBvbGxlci5zZXRQZXJpb2RJbk1zKHRoaXMuc3luY1BlcmlvZEluTXMpO1xuICAgIFxuICAgIC8vIHBvbGwgaWYgbGlzdGVuaW5nXG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gIH1cblxuICBnZXRTeW5jUGVyaW9kSW5NcygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnN5bmNQZXJpb2RJbk1zO1xuICB9XG4gIFxuICBhc3luYyBzdG9wU3luY2luZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiYXV0b19yZWZyZXNoXCIsIHsgZW5hYmxlOiBmYWxzZSB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXR4SGFzaGVzIHx8ICF0eEhhc2hlcy5sZW5ndGgpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vIHR4IGhhc2hlcyBnaXZlbiB0byBzY2FuXCIpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNjYW5fdHhcIiwge3R4aWRzOiB0eEhhc2hlc30pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5TcGVudCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXNjYW5fc3BlbnRcIiwgdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXNjYW5fYmxvY2tjaGFpblwiLCB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYWxhbmNlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSlbMF07XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0QmFsYW5jZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkpWzFdO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbiwgdGFnPzogc3RyaW5nLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50W10+IHtcbiAgICBcbiAgICAvLyBmZXRjaCBhY2NvdW50cyBmcm9tIHJwY1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FjY291bnRzXCIsIHt0YWc6IHRhZ30pO1xuICAgIFxuICAgIC8vIGJ1aWxkIGFjY291bnQgb2JqZWN0cyBhbmQgZmV0Y2ggc3ViYWRkcmVzc2VzIHBlciBhY2NvdW50IHVzaW5nIGdldF9hZGRyZXNzXG4gICAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogZ2V0X2FkZHJlc3Mgc2hvdWxkIHN1cHBvcnQgYWxsX2FjY291bnRzIHNvIG5vdCBjYWxsZWQgb25jZSBwZXIgYWNjb3VudFxuICAgIGxldCBhY2NvdW50czogTW9uZXJvQWNjb3VudFtdID0gW107XG4gICAgZm9yIChsZXQgcnBjQWNjb3VudCBvZiByZXNwLnJlc3VsdC5zdWJhZGRyZXNzX2FjY291bnRzKSB7XG4gICAgICBsZXQgYWNjb3VudCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjQWNjb3VudChycGNBY2NvdW50KTtcbiAgICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzKSBhY2NvdW50LnNldFN1YmFkZHJlc3Nlcyhhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50LmdldEluZGV4KCksIHVuZGVmaW5lZCwgdHJ1ZSkpO1xuICAgICAgYWNjb3VudHMucHVzaChhY2NvdW50KTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIG1lcmdlIGZpZWxkcyBmcm9tIGdldF9iYWxhbmNlIGFjcm9zcyBhbGwgYWNjb3VudHNcbiAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcyAmJiAhc2tpcEJhbGFuY2VzKSB7XG4gICAgICBcbiAgICAgIC8vIHRoZXNlIGZpZWxkcyBhcmUgbm90IGluaXRpYWxpemVkIGlmIHN1YmFkZHJlc3MgaXMgdW51c2VkIGFuZCB0aGVyZWZvcmUgbm90IHJldHVybmVkIGZyb20gYGdldF9iYWxhbmNlYFxuICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiBhY2NvdW50cykge1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jaygwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBmZXRjaCBhbmQgbWVyZ2UgaW5mbyBmcm9tIGdldF9iYWxhbmNlXG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwge2FsbF9hY2NvdW50czogdHJ1ZX0pO1xuICAgICAgaWYgKHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgIGZvciAobGV0IHJwY1N1YmFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzcyA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBtZXJnZSBpbmZvXG4gICAgICAgICAgbGV0IGFjY291bnQgPSBhY2NvdW50c1tzdWJhZGRyZXNzLmdldEFjY291bnRJbmRleCgpXTtcbiAgICAgICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzcy5nZXRBY2NvdW50SW5kZXgoKSwgYWNjb3VudC5nZXRJbmRleCgpLCBcIlJQQyBhY2NvdW50cyBhcmUgb3V0IG9mIG9yZGVyXCIpOyAgLy8gd291bGQgbmVlZCB0byBzd2l0Y2ggbG9va3VwIHRvIGxvb3BcbiAgICAgICAgICBsZXQgdGd0U3ViYWRkcmVzcyA9IGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKClbc3ViYWRkcmVzcy5nZXRJbmRleCgpXTtcbiAgICAgICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzcy5nZXRJbmRleCgpLCB0Z3RTdWJhZGRyZXNzLmdldEluZGV4KCksIFwiUlBDIHN1YmFkZHJlc3NlcyBhcmUgb3V0IG9mIG9yZGVyXCIpO1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkpO1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkpO1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cyhzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBhY2NvdW50cztcbiAgfVxuICBcbiAgLy8gVE9ETzogZ2V0QWNjb3VudEJ5SW5kZXgoKSwgZ2V0QWNjb3VudEJ5VGFnKClcbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgYXNzZXJ0KGFjY291bnRJZHggPj0gMCk7XG4gICAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCB0aGlzLmdldEFjY291bnRzKCkpIHtcbiAgICAgIGlmIChhY2NvdW50LmdldEluZGV4KCkgPT09IGFjY291bnRJZHgpIHtcbiAgICAgICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMpIGFjY291bnQuc2V0U3ViYWRkcmVzc2VzKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHVuZGVmaW5lZCwgc2tpcEJhbGFuY2VzKSk7XG4gICAgICAgIHJldHVybiBhY2NvdW50O1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBY2NvdW50IHdpdGggaW5kZXggXCIgKyBhY2NvdW50SWR4ICsgXCIgZG9lcyBub3QgZXhpc3RcIik7XG4gIH1cblxuICBhc3luYyBjcmVhdGVBY2NvdW50KGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgbGFiZWwgPSBsYWJlbCA/IGxhYmVsIDogdW5kZWZpbmVkO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX2FjY291bnRcIiwge2xhYmVsOiBsYWJlbH0pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvQWNjb3VudCh7XG4gICAgICBpbmRleDogcmVzcC5yZXN1bHQuYWNjb3VudF9pbmRleCxcbiAgICAgIHByaW1hcnlBZGRyZXNzOiByZXNwLnJlc3VsdC5hZGRyZXNzLFxuICAgICAgbGFiZWw6IGxhYmVsLFxuICAgICAgYmFsYW5jZTogQmlnSW50KDApLFxuICAgICAgdW5sb2NrZWRCYWxhbmNlOiBCaWdJbnQoMClcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJbmRpY2VzPzogbnVtYmVyW10sIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3NbXT4ge1xuICAgIFxuICAgIC8vIGZldGNoIHN1YmFkZHJlc3Nlc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gYWNjb3VudElkeDtcbiAgICBpZiAoc3ViYWRkcmVzc0luZGljZXMpIHBhcmFtcy5hZGRyZXNzX2luZGV4ID0gR2VuVXRpbHMubGlzdGlmeShzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc1wiLCBwYXJhbXMpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgc3ViYWRkcmVzc2VzXG4gICAgbGV0IHN1YmFkZHJlc3NlcyA9IFtdO1xuICAgIGZvciAobGV0IHJwY1N1YmFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQuYWRkcmVzc2VzKSB7XG4gICAgICBsZXQgc3ViYWRkcmVzcyA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKTtcbiAgICAgIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgc3ViYWRkcmVzc2VzLnB1c2goc3ViYWRkcmVzcyk7XG4gICAgfVxuICAgIFxuICAgIC8vIGZldGNoIGFuZCBpbml0aWFsaXplIHN1YmFkZHJlc3MgYmFsYW5jZXNcbiAgICBpZiAoIXNraXBCYWxhbmNlcykge1xuICAgICAgXG4gICAgICAvLyB0aGVzZSBmaWVsZHMgYXJlIG5vdCBpbml0aWFsaXplZCBpZiBzdWJhZGRyZXNzIGlzIHVudXNlZCBhbmQgdGhlcmVmb3JlIG5vdCByZXR1cm5lZCBmcm9tIGBnZXRfYmFsYW5jZWBcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKDApO1xuICAgICAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgICAgfVxuXG4gICAgICAvLyBmZXRjaCBhbmQgaW5pdGlhbGl6ZSBiYWxhbmNlc1xuICAgICAgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIsIHBhcmFtcyk7XG4gICAgICBpZiAocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIHRyYW5zZmVyIGluZm8gdG8gZXhpc3Rpbmcgc3ViYWRkcmVzcyBvYmplY3RcbiAgICAgICAgICBmb3IgKGxldCB0Z3RTdWJhZGRyZXNzIG9mIHN1YmFkZHJlc3Nlcykge1xuICAgICAgICAgICAgaWYgKHRndFN1YmFkZHJlc3MuZ2V0SW5kZXgoKSAhPT0gc3ViYWRkcmVzcy5nZXRJbmRleCgpKSBjb250aW51ZTsgLy8gc2tpcCB0byBzdWJhZGRyZXNzIHdpdGggc2FtZSBpbmRleFxuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0QmFsYW5jZShzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cyhzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKHN1YmFkZHJlc3MuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIGFkZHJlc3Nlc1xuICAgIGxldCBzdWJhZGRyZXNzTWFwID0gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF07XG4gICAgaWYgKCFzdWJhZGRyZXNzTWFwKSB7XG4gICAgICBzdWJhZGRyZXNzTWFwID0ge307XG4gICAgICB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XSA9IHN1YmFkZHJlc3NNYXA7XG4gICAgfVxuICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICBzdWJhZGRyZXNzTWFwW3N1YmFkZHJlc3MuZ2V0SW5kZXgoKV0gPSBzdWJhZGRyZXNzLmdldEFkZHJlc3MoKTtcbiAgICB9XG4gICAgXG4gICAgLy8gcmV0dXJuIHJlc3VsdHNcbiAgICByZXR1cm4gc3ViYWRkcmVzc2VzO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlciwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIGFzc2VydChhY2NvdW50SWR4ID49IDApO1xuICAgIGFzc2VydChzdWJhZGRyZXNzSWR4ID49IDApO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgW3N1YmFkZHJlc3NJZHhdLCBza2lwQmFsYW5jZXMpKVswXTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX2FkZHJlc3NcIiwge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHgsIGxhYmVsOiBsYWJlbH0pO1xuICAgIFxuICAgIC8vIGJ1aWxkIHN1YmFkZHJlc3Mgb2JqZWN0XG4gICAgbGV0IHN1YmFkZHJlc3MgPSBuZXcgTW9uZXJvU3ViYWRkcmVzcygpO1xuICAgIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgIHN1YmFkZHJlc3Muc2V0SW5kZXgocmVzcC5yZXN1bHQuYWRkcmVzc19pbmRleCk7XG4gICAgc3ViYWRkcmVzcy5zZXRBZGRyZXNzKHJlc3AucmVzdWx0LmFkZHJlc3MpO1xuICAgIHN1YmFkZHJlc3Muc2V0TGFiZWwobGFiZWwgPyBsYWJlbCA6IHVuZGVmaW5lZCk7XG4gICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgc3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKDApO1xuICAgIHN1YmFkZHJlc3Muc2V0SXNVc2VkKGZhbHNlKTtcbiAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgIHJldHVybiBzdWJhZGRyZXNzO1xuICB9XG5cbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibGFiZWxfYWRkcmVzc1wiLCB7aW5kZXg6IHttYWpvcjogYWNjb3VudElkeCwgbWlub3I6IHN1YmFkZHJlc3NJZHh9LCBsYWJlbDogbGFiZWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5Pzogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gY29weSBxdWVyeVxuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyB0ZW1wb3JhcmlseSBkaXNhYmxlIHRyYW5zZmVyIGFuZCBvdXRwdXQgcXVlcmllcyBpbiBvcmRlciB0byBjb2xsZWN0IGFsbCB0eCBpbmZvcm1hdGlvblxuICAgIGxldCB0cmFuc2ZlclF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldFRyYW5zZmVyUXVlcnkoKTtcbiAgICBsZXQgaW5wdXRRdWVyeSA9IHF1ZXJ5Tm9ybWFsaXplZC5nZXRJbnB1dFF1ZXJ5KCk7XG4gICAgbGV0IG91dHB1dFF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldE91dHB1dFF1ZXJ5KCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldFRyYW5zZmVyUXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SW5wdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRPdXRwdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIGZldGNoIGFsbCB0cmFuc2ZlcnMgdGhhdCBtZWV0IHR4IHF1ZXJ5XG4gICAgbGV0IHRyYW5zZmVycyA9IGF3YWl0IHRoaXMuZ2V0VHJhbnNmZXJzQXV4KG5ldyBNb25lcm9UcmFuc2ZlclF1ZXJ5KCkuc2V0VHhRdWVyeShNb25lcm9XYWxsZXRScGMuZGVjb250ZXh0dWFsaXplKHF1ZXJ5Tm9ybWFsaXplZC5jb3B5KCkpKSk7XG4gICAgXG4gICAgLy8gY29sbGVjdCB1bmlxdWUgdHhzIGZyb20gdHJhbnNmZXJzIHdoaWxlIHJldGFpbmluZyBvcmRlclxuICAgIGxldCB0eHMgPSBbXTtcbiAgICBsZXQgdHhzU2V0ID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHRyYW5zZmVycykge1xuICAgICAgaWYgKCF0eHNTZXQuaGFzKHRyYW5zZmVyLmdldFR4KCkpKSB7XG4gICAgICAgIHR4cy5wdXNoKHRyYW5zZmVyLmdldFR4KCkpO1xuICAgICAgICB0eHNTZXQuYWRkKHRyYW5zZmVyLmdldFR4KCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB0eXBlcyBpbnRvIG1hcHMgZm9yIG1lcmdpbmcgYW5kIGxvb2t1cFxuICAgIGxldCB0eE1hcCA9IHt9O1xuICAgIGxldCBibG9ja01hcCA9IHt9O1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGZldGNoIGFuZCBtZXJnZSBvdXRwdXRzIGlmIHJlcXVlc3RlZFxuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SW5jbHVkZU91dHB1dHMoKSB8fCBvdXRwdXRRdWVyeSkge1xuICAgICAgICBcbiAgICAgIC8vIGZldGNoIG91dHB1dHNcbiAgICAgIGxldCBvdXRwdXRRdWVyeUF1eCA9IChvdXRwdXRRdWVyeSA/IG91dHB1dFF1ZXJ5LmNvcHkoKSA6IG5ldyBNb25lcm9PdXRwdXRRdWVyeSgpKS5zZXRUeFF1ZXJ5KE1vbmVyb1dhbGxldFJwYy5kZWNvbnRleHR1YWxpemUocXVlcnlOb3JtYWxpemVkLmNvcHkoKSkpO1xuICAgICAgbGV0IG91dHB1dHMgPSBhd2FpdCB0aGlzLmdldE91dHB1dHNBdXgob3V0cHV0UXVlcnlBdXgpO1xuICAgICAgXG4gICAgICAvLyBtZXJnZSBvdXRwdXQgdHhzIG9uZSB0aW1lIHdoaWxlIHJldGFpbmluZyBvcmRlclxuICAgICAgbGV0IG91dHB1dFR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIG91dHB1dHMpIHtcbiAgICAgICAgaWYgKCFvdXRwdXRUeHMuaW5jbHVkZXMob3V0cHV0LmdldFR4KCkpKSB7XG4gICAgICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgob3V0cHV0LmdldFR4KCksIHR4TWFwLCBibG9ja01hcCk7XG4gICAgICAgICAgb3V0cHV0VHhzLnB1c2gob3V0cHV0LmdldFR4KCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHJlc3RvcmUgdHJhbnNmZXIgYW5kIG91dHB1dCBxdWVyaWVzXG4gICAgcXVlcnlOb3JtYWxpemVkLnNldFRyYW5zZmVyUXVlcnkodHJhbnNmZXJRdWVyeSk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldElucHV0UXVlcnkoaW5wdXRRdWVyeSk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldE91dHB1dFF1ZXJ5KG91dHB1dFF1ZXJ5KTtcbiAgICBcbiAgICAvLyBmaWx0ZXIgdHhzIHRoYXQgZG9uJ3QgbWVldCB0cmFuc2ZlciBxdWVyeVxuICAgIGxldCB0eHNRdWVyaWVkID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBpZiAocXVlcnlOb3JtYWxpemVkLm1lZXRzQ3JpdGVyaWEodHgpKSB0eHNRdWVyaWVkLnB1c2godHgpO1xuICAgICAgZWxzZSBpZiAodHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB0eC5nZXRCbG9jaygpLmdldFR4cygpLnNwbGljZSh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpLCAxKTtcbiAgICB9XG4gICAgdHhzID0gdHhzUXVlcmllZDtcbiAgICBcbiAgICAvLyBzcGVjaWFsIGNhc2U6IHJlLWZldGNoIHR4cyBpZiBpbmNvbnNpc3RlbmN5IGNhdXNlZCBieSBuZWVkaW5nIHRvIG1ha2UgbXVsdGlwbGUgcnBjIGNhbGxzXG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSAmJiB0eC5nZXRCbG9jaygpID09PSB1bmRlZmluZWQgfHwgIXR4LmdldElzQ29uZmlybWVkKCkgJiYgdHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJJbmNvbnNpc3RlbmN5IGRldGVjdGVkIGJ1aWxkaW5nIHR4cyBmcm9tIG11bHRpcGxlIHJwYyBjYWxscywgcmUtZmV0Y2hpbmcgdHhzXCIpO1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRUeHMocXVlcnlOb3JtYWxpemVkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gb3JkZXIgdHhzIGlmIHR4IGhhc2hlcyBnaXZlbiB0aGVuIHJldHVyblxuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkgJiYgcXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpLmxlbmd0aCA+IDApIHtcbiAgICAgIGxldCB0eHNCeUlkID0gbmV3IE1hcCgpICAvLyBzdG9yZSB0eHMgaW4gdGVtcG9yYXJ5IG1hcCBmb3Igc29ydGluZ1xuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB0eHNCeUlkLnNldCh0eC5nZXRIYXNoKCksIHR4KTtcbiAgICAgIGxldCBvcmRlcmVkVHhzID0gW107XG4gICAgICBmb3IgKGxldCBoYXNoIG9mIHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKSkgaWYgKHR4c0J5SWQuZ2V0KGhhc2gpKSBvcmRlcmVkVHhzLnB1c2godHhzQnlJZC5nZXQoaGFzaCkpO1xuICAgICAgdHhzID0gb3JkZXJlZFR4cztcbiAgICB9XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHJhbnNmZXJbXT4ge1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBnZXQgdHJhbnNmZXJzIGRpcmVjdGx5IGlmIHF1ZXJ5IGRvZXMgbm90IHJlcXVpcmUgdHggY29udGV4dCAob3RoZXIgdHJhbnNmZXJzLCBvdXRwdXRzKVxuICAgIGlmICghTW9uZXJvV2FsbGV0UnBjLmlzQ29udGV4dHVhbChxdWVyeU5vcm1hbGl6ZWQpKSByZXR1cm4gdGhpcy5nZXRUcmFuc2ZlcnNBdXgocXVlcnlOb3JtYWxpemVkKTtcbiAgICBcbiAgICAvLyBvdGhlcndpc2UgZ2V0IHR4cyB3aXRoIGZ1bGwgbW9kZWxzIHRvIGZ1bGZpbGwgcXVlcnlcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5nZXRUeHMocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKSkpIHtcbiAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmZpbHRlclRyYW5zZmVycyhxdWVyeU5vcm1hbGl6ZWQpKSB7XG4gICAgICAgIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvT3V0cHV0UXVlcnk+KTogUHJvbWlzZTxNb25lcm9PdXRwdXRXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gZ2V0IG91dHB1dHMgZGlyZWN0bHkgaWYgcXVlcnkgZG9lcyBub3QgcmVxdWlyZSB0eCBjb250ZXh0IChvdGhlciBvdXRwdXRzLCB0cmFuc2ZlcnMpXG4gICAgaWYgKCFNb25lcm9XYWxsZXRScGMuaXNDb250ZXh0dWFsKHF1ZXJ5Tm9ybWFsaXplZCkpIHJldHVybiB0aGlzLmdldE91dHB1dHNBdXgocXVlcnlOb3JtYWxpemVkKTtcbiAgICBcbiAgICAvLyBvdGhlcndpc2UgZ2V0IHR4cyB3aXRoIGZ1bGwgbW9kZWxzIHRvIGZ1bGZpbGwgcXVlcnlcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMuZ2V0VHhzKHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkpKSB7XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZmlsdGVyT3V0cHV0cyhxdWVyeU5vcm1hbGl6ZWQpKSB7XG4gICAgICAgIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfb3V0cHV0c1wiLCB7YWxsOiBhbGx9KSkucmVzdWx0Lm91dHB1dHNfZGF0YV9oZXg7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE91dHB1dHMob3V0cHV0c0hleDogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9vdXRwdXRzXCIsIHtvdXRwdXRzX2RhdGFfaGV4OiBvdXRwdXRzSGV4fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm51bV9pbXBvcnRlZDtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdD4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnJwY0V4cG9ydEtleUltYWdlcyhhbGwpO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzOiBNb25lcm9LZXlJbWFnZVtdLCBvZmZzZXQgPSAwKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD4ge1xuICAgIFxuICAgIC8vIGNvbnZlcnQga2V5IGltYWdlcyB0byBycGMgcGFyYW1ldGVyXG4gICAgbGV0IHJwY0tleUltYWdlcyA9IGtleUltYWdlcy5tYXAoa2V5SW1hZ2UgPT4gKHtrZXlfaW1hZ2U6IGtleUltYWdlLmdldEhleCgpLCBzaWduYXR1cmU6IGtleUltYWdlLmdldFNpZ25hdHVyZSgpfSkpO1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW1wb3J0X2tleV9pbWFnZXNcIiwge3NpZ25lZF9rZXlfaW1hZ2VzOiBycGNLZXlJbWFnZXMsIG9mZnNldDogb2Zmc2V0fSk7XG4gICAgXG4gICAgLy8gYnVpbGQgYW5kIHJldHVybiByZXN1bHRcbiAgICBsZXQgaW1wb3J0UmVzdWx0ID0gbmV3IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0KCk7XG4gICAgaW1wb3J0UmVzdWx0LnNldEhlaWdodChyZXNwLnJlc3VsdC5oZWlnaHQpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRTcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQuc3BlbnQpKTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0VW5zcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQudW5zcGVudCkpO1xuICAgIHJldHVybiBpbXBvcnRSZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5ycGNFeHBvcnRLZXlJbWFnZXMoZmFsc2UpKS5nZXRLZXlJbWFnZXMoKTtcbiAgfVxuICBcbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZnJlZXplXCIsIHtrZXlfaW1hZ2U6IGtleUltYWdlfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRoYXdPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ0aGF3XCIsIHtrZXlfaW1hZ2U6IGtleUltYWdlfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzT3V0cHV0RnJvemVuKGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImZyb3plblwiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5mcm96ZW4gPT09IHRydWU7XG4gIH1cblxuICBhc3luYyBnZXREZWZhdWx0RmVlUHJpb3JpdHkoKTogUHJvbWlzZTxNb25lcm9UeFByaW9yaXR5PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfZGVmYXVsdF9mZWVfcHJpb3JpdHlcIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnByaW9yaXR5O1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlLCBjb3B5LCBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWdOb3JtYWxpemVkLnNldENhblNwbGl0KHRydWUpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkgPT09IHRydWUgJiYgYXdhaXQgdGhpcy5pc011bHRpc2lnKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCByZWxheSBtdWx0aXNpZyB0cmFuc2FjdGlvbiB1bnRpbCBjby1zaWduZWRcIik7XG5cbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzc2VzIHRvIHNlbmQgZnJvbVxuICAgIGxldCBhY2NvdW50SWR4ID0gY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgdGhlIGFjY291bnQgaW5kZXggdG8gc2VuZCBmcm9tXCIpO1xuICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnNsaWNlKDApOyAvLyBmZXRjaCBhbGwgb3IgY29weSBnaXZlbiBpbmRpY2VzXG4gICAgXG4gICAgLy8gYnVpbGQgY29uZmlnIHBhcmFtZXRlcnNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuZGVzdGluYXRpb25zID0gW107XG4gICAgZm9yIChsZXQgZGVzdGluYXRpb24gb2YgY29uZmlnTm9ybWFsaXplZC5nZXREZXN0aW5hdGlvbnMoKSkge1xuICAgICAgYXNzZXJ0KGRlc3RpbmF0aW9uLmdldEFkZHJlc3MoKSwgXCJEZXN0aW5hdGlvbiBhZGRyZXNzIGlzIG5vdCBkZWZpbmVkXCIpO1xuICAgICAgYXNzZXJ0KGRlc3RpbmF0aW9uLmdldEFtb3VudCgpLCBcIkRlc3RpbmF0aW9uIGFtb3VudCBpcyBub3QgZGVmaW5lZFwiKTtcbiAgICAgIHBhcmFtcy5kZXN0aW5hdGlvbnMucHVzaCh7IGFkZHJlc3M6IGRlc3RpbmF0aW9uLmdldEFkZHJlc3MoKSwgYW1vdW50OiBkZXN0aW5hdGlvbi5nZXRBbW91bnQoKS50b1N0cmluZygpIH0pO1xuICAgIH1cbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKSkgcGFyYW1zLnN1YnRyYWN0X2ZlZV9mcm9tX291dHB1dHMgPSBjb25maWdOb3JtYWxpemVkLmdldFN1YnRyYWN0RmVlRnJvbSgpO1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gYWNjb3VudElkeDtcbiAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gc3ViYWRkcmVzc0luZGljZXM7XG4gICAgcGFyYW1zLnBheW1lbnRfaWQgPSBjb25maWdOb3JtYWxpemVkLmdldFBheW1lbnRJZCgpO1xuICAgIHBhcmFtcy5kb19ub3RfcmVsYXkgPSBjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkgIT09IHRydWU7XG4gICAgYXNzZXJ0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKSA+PSAwICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCk7XG4gICAgcGFyYW1zLmdldF90eF9oZXggPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfbWV0YWRhdGEgPSB0cnVlO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkpIHBhcmFtcy5nZXRfdHhfa2V5cyA9IHRydWU7IC8vIHBhcmFtIHRvIGdldCB0eCBrZXkocykgZGVwZW5kcyBpZiBzcGxpdFxuICAgIGVsc2UgcGFyYW1zLmdldF90eF9rZXkgPSB0cnVlO1xuXG4gICAgLy8gY2Fubm90IGFwcGx5IHN1YnRyYWN0RmVlRnJvbSB3aXRoIGB0cmFuc2Zlcl9zcGxpdGAgY2FsbFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKSAmJiBjb25maWdOb3JtYWxpemVkLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcInN1YnRyYWN0ZmVlZnJvbSB0cmFuc2ZlcnMgY2Fubm90IGJlIHNwbGl0IG92ZXIgbXVsdGlwbGUgdHJhbnNhY3Rpb25zIHlldFwiKTtcbiAgICB9XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3VsdDtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpID8gXCJ0cmFuc2Zlcl9zcGxpdFwiIDogXCJ0cmFuc2ZlclwiLCBwYXJhbXMpO1xuICAgICAgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZS5pbmRleE9mKFwiV0FMTEVUX1JQQ19FUlJPUl9DT0RFX1dST05HX0FERFJFU1NcIikgPiAtMSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBkZXN0aW5hdGlvbiBhZGRyZXNzXCIpO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgICBcbiAgICAvLyBwcmUtaW5pdGlhbGl6ZSB0eHMgaWZmIHByZXNlbnQuIG11bHRpc2lnIGFuZCB2aWV3LW9ubHkgd2FsbGV0cyB3aWxsIGhhdmUgdHggc2V0IHdpdGhvdXQgdHJhbnNhY3Rpb25zXG4gICAgbGV0IHR4cztcbiAgICBsZXQgbnVtVHhzID0gY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpID8gKHJlc3VsdC5mZWVfbGlzdCAhPT0gdW5kZWZpbmVkID8gcmVzdWx0LmZlZV9saXN0Lmxlbmd0aCA6IDApIDogKHJlc3VsdC5mZWUgIT09IHVuZGVmaW5lZCA/IDEgOiAwKTtcbiAgICBpZiAobnVtVHhzID4gMCkgdHhzID0gW107XG4gICAgbGV0IGNvcHlEZXN0aW5hdGlvbnMgPSBudW1UeHMgPT09IDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UeHM7IGkrKykge1xuICAgICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgICBNb25lcm9XYWxsZXRScGMuaW5pdFNlbnRUeFdhbGxldChjb25maWdOb3JtYWxpemVkLCB0eCwgY29weURlc3RpbmF0aW9ucyk7XG4gICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJbmRpY2VzICE9PSB1bmRlZmluZWQgJiYgc3ViYWRkcmVzc0luZGljZXMubGVuZ3RoID09PSAxKSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0U3ViYWRkcmVzc0luZGljZXMoc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgdHhzLnB1c2godHgpO1xuICAgIH1cbiAgICBcbiAgICAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkpIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggc2V0IGZyb20gcnBjIHJlc3BvbnNlIHdpdGggcHJlLWluaXRpYWxpemVkIHR4c1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkpIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCwgdHhzLCBjb25maWdOb3JtYWxpemVkKS5nZXRUeHMoKTtcbiAgICBlbHNlIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4VG9UeFNldChyZXN1bHQsIHR4cyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdHhzWzBdLCB0cnVlLCBjb25maWdOb3JtYWxpemVkKS5nZXRUeHMoKTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBPdXRwdXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyhjb25maWcpO1xuICAgIFxuICAgIC8vIGJ1aWxkIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hZGRyZXNzID0gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCk7XG4gICAgcGFyYW1zLmtleV9pbWFnZSA9IGNvbmZpZy5nZXRLZXlJbWFnZSgpO1xuICAgIHBhcmFtcy5kb19ub3RfcmVsYXkgPSBjb25maWcuZ2V0UmVsYXkoKSAhPT0gdHJ1ZTtcbiAgICBhc3NlcnQoY29uZmlnLmdldFByaW9yaXR5KCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpb3JpdHkoKSA+PSAwICYmIGNvbmZpZy5nZXRQcmlvcml0eSgpIDw9IDMpO1xuICAgIHBhcmFtcy5wcmlvcml0eSA9IGNvbmZpZy5nZXRQcmlvcml0eSgpO1xuICAgIHBhcmFtcy5wYXltZW50X2lkID0gY29uZmlnLmdldFBheW1lbnRJZCgpO1xuICAgIHBhcmFtcy5nZXRfdHhfa2V5ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X2hleCA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9tZXRhZGF0YSA9IHRydWU7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzd2VlcF9zaW5nbGVcIiwgcGFyYW1zKTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnLmdldFJlbGF5KCkpIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIFxuICAgIC8vIGJ1aWxkIGFuZCByZXR1cm4gdHhcbiAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuaW5pdFNlbnRUeFdhbGxldChjb25maWcsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFRvVHhTZXQocmVzdWx0LCB0eCwgdHJ1ZSwgY29uZmlnKTtcbiAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKClbMF0uc2V0QW1vdW50KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBbW91bnQoKSk7IC8vIGluaXRpYWxpemUgZGVzdGluYXRpb24gYW1vdW50XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBhc3luYyBzd2VlcFVubG9ja2VkKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyhjb25maWcpO1xuICAgIFxuICAgIC8vIGRldGVybWluZSBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMgdG8gc3dlZXA7IGRlZmF1bHQgdG8gYWxsIHdpdGggdW5sb2NrZWQgYmFsYW5jZSBpZiBub3Qgc3BlY2lmaWVkXG4gICAgbGV0IGluZGljZXMgPSBuZXcgTWFwKCk7ICAvLyBtYXBzIGVhY2ggYWNjb3VudCBpbmRleCB0byBzdWJhZGRyZXNzIGluZGljZXMgdG8gc3dlZXBcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaW5kaWNlcy5zZXQoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSwgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzSW5kaWNlcygpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgICAgICBpbmRpY2VzLnNldChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpLCBzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSkpIHtcbiAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSA+IDBuKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGFjY291bnRzID0gYXdhaXQgdGhpcy5nZXRBY2NvdW50cyh0cnVlKTtcbiAgICAgIGZvciAobGV0IGFjY291bnQgb2YgYWNjb3VudHMpIHtcbiAgICAgICAgaWYgKGFjY291bnQuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgPiAwbikge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgICAgICAgIGluZGljZXMuc2V0KGFjY291bnQuZ2V0SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkge1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgPiAwbikgc3ViYWRkcmVzc0luZGljZXMucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzd2VlcCBmcm9tIGVhY2ggYWNjb3VudCBhbmQgY29sbGVjdCByZXN1bHRpbmcgdHggc2V0c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBmb3IgKGxldCBhY2NvdW50SWR4IG9mIGluZGljZXMua2V5cygpKSB7XG4gICAgICBcbiAgICAgIC8vIGNvcHkgYW5kIG1vZGlmeSB0aGUgb3JpZ2luYWwgY29uZmlnXG4gICAgICBsZXQgY29weSA9IGNvbmZpZ05vcm1hbGl6ZWQuY29weSgpO1xuICAgICAgY29weS5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgICBjb3B5LnNldFN3ZWVwRWFjaFN1YmFkZHJlc3MoZmFsc2UpO1xuICAgICAgXG4gICAgICAvLyBzd2VlcCBhbGwgc3ViYWRkcmVzc2VzIHRvZ2V0aGVyICAvLyBUT0RPIG1vbmVyby1wcm9qZWN0OiBjYW4gdGhpcyByZXZlYWwgb3V0cHV0cyBiZWxvbmcgdG8gdGhlIHNhbWUgd2FsbGV0P1xuICAgICAgaWYgKGNvcHkuZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcygpICE9PSB0cnVlKSB7XG4gICAgICAgIGNvcHkuc2V0U3ViYWRkcmVzc0luZGljZXMoaW5kaWNlcy5nZXQoYWNjb3VudElkeCkpO1xuICAgICAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLnJwY1N3ZWVwQWNjb3VudChjb3B5KSkgdHhzLnB1c2godHgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBvdGhlcndpc2Ugc3dlZXAgZWFjaCBzdWJhZGRyZXNzIGluZGl2aWR1YWxseVxuICAgICAgZWxzZSB7XG4gICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3NJZHggb2YgaW5kaWNlcy5nZXQoYWNjb3VudElkeCkpIHtcbiAgICAgICAgICBjb3B5LnNldFN1YmFkZHJlc3NJbmRpY2VzKFtzdWJhZGRyZXNzSWR4XSk7XG4gICAgICAgICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5ycGNTd2VlcEFjY291bnQoY29weSkpIHR4cy5wdXNoKHR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkpIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwRHVzdChyZWxheT86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAocmVsYXkgPT09IHVuZGVmaW5lZCkgcmVsYXkgPSBmYWxzZTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN3ZWVwX2R1c3RcIiwge2RvX25vdF9yZWxheTogIXJlbGF5fSk7XG4gICAgaWYgKHJlbGF5KSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQpO1xuICAgIGlmICh0eFNldC5nZXRUeHMoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhTZXQuZ2V0VHhzKCkpIHtcbiAgICAgIHR4LnNldElzUmVsYXllZCghcmVsYXkpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHguZ2V0SXNSZWxheWVkKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdHhTZXQuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzKHR4c09yTWV0YWRhdGFzOiAoTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhzT3JNZXRhZGF0YXMpLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0eHMgb3IgdGhlaXIgbWV0YWRhdGEgdG8gcmVsYXlcIik7XG4gICAgbGV0IHR4SGFzaGVzID0gW107XG4gICAgZm9yIChsZXQgdHhPck1ldGFkYXRhIG9mIHR4c09yTWV0YWRhdGFzKSB7XG4gICAgICBsZXQgbWV0YWRhdGEgPSB0eE9yTWV0YWRhdGEgaW5zdGFuY2VvZiBNb25lcm9UeFdhbGxldCA/IHR4T3JNZXRhZGF0YS5nZXRNZXRhZGF0YSgpIDogdHhPck1ldGFkYXRhO1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZWxheV90eFwiLCB7IGhleDogbWV0YWRhdGEgfSk7XG4gICAgICB0eEhhc2hlcy5wdXNoKHJlc3AucmVzdWx0LnR4X2hhc2gpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnBvbGwoKTsgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICByZXR1cm4gdHhIYXNoZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGRlc2NyaWJlVHhTZXQodHhTZXQ6IE1vbmVyb1R4U2V0KTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZGVzY3JpYmVfdHJhbnNmZXJcIiwge1xuICAgICAgdW5zaWduZWRfdHhzZXQ6IHR4U2V0LmdldFVuc2lnbmVkVHhIZXgoKSxcbiAgICAgIG11bHRpc2lnX3R4c2V0OiB0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KClcbiAgICB9KTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNEZXNjcmliZVRyYW5zZmVyKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnblR4cyh1bnNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzaWduX3RyYW5zZmVyXCIsIHtcbiAgICAgIHVuc2lnbmVkX3R4c2V0OiB1bnNpZ25lZFR4SGV4LFxuICAgICAgZXhwb3J0X3JhdzogdHJ1ZSxcbiAgICAgIGdldF90eF9rZXlzOiB0cnVlXG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeHMoc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN1Ym1pdF90cmFuc2ZlclwiLCB7XG4gICAgICB0eF9kYXRhX2hleDogc2lnbmVkVHhIZXhcbiAgICB9KTtcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQudHhfaGFzaF9saXN0O1xuICB9XG4gIFxuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIHNpZ25hdHVyZVR5cGUgPSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCBhY2NvdW50SWR4ID0gMCwgc3ViYWRkcmVzc0lkeCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnblwiLCB7XG4gICAgICAgIGRhdGE6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZV90eXBlOiBzaWduYXR1cmVUeXBlID09PSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZID8gXCJzcGVuZFwiIDogXCJ2aWV3XCIsXG4gICAgICAgIGFjY291bnRfaW5kZXg6IGFjY291bnRJZHgsXG4gICAgICAgIGFkZHJlc3NfaW5kZXg6IHN1YmFkZHJlc3NJZHhcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICB9XG4gIFxuICBhc3luYyB2ZXJpZnlNZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdD4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInZlcmlmeVwiLCB7ZGF0YTogbWVzc2FnZSwgYWRkcmVzczogYWRkcmVzcywgc2lnbmF0dXJlOiBzaWduYXR1cmV9KTtcbiAgICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdChcbiAgICAgICAgcmVzdWx0Lmdvb2QgPyB7aXNHb29kOiByZXN1bHQuZ29vZCwgaXNPbGQ6IHJlc3VsdC5vbGQsIHNpZ25hdHVyZVR5cGU6IHJlc3VsdC5zaWduYXR1cmVfdHlwZSA9PT0gXCJ2aWV3XCIgPyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfVklFV19LRVkgOiBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCB2ZXJzaW9uOiByZXN1bHQudmVyc2lvbn0gOiB7aXNHb29kOiBmYWxzZX1cbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0yKSByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQoe2lzR29vZDogZmFsc2V9KTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeEtleSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3R4X2tleVwiLCB7dHhpZDogdHhIYXNofSkpLnJlc3VsdC50eF9rZXk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhLZXkodHhIYXNoOiBzdHJpbmcsIHR4S2V5OiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja190eF9rZXlcIiwge3R4aWQ6IHR4SGFzaCwgdHhfa2V5OiB0eEtleSwgYWRkcmVzczogYWRkcmVzc30pO1xuICAgICAgXG4gICAgICAvLyBpbnRlcnByZXQgcmVzdWx0XG4gICAgICBsZXQgY2hlY2sgPSBuZXcgTW9uZXJvQ2hlY2tUeCgpO1xuICAgICAgY2hlY2suc2V0SXNHb29kKHRydWUpO1xuICAgICAgY2hlY2suc2V0TnVtQ29uZmlybWF0aW9ucyhyZXNwLnJlc3VsdC5jb25maXJtYXRpb25zKTtcbiAgICAgIGNoZWNrLnNldEluVHhQb29sKHJlc3AucmVzdWx0LmluX3Bvb2wpO1xuICAgICAgY2hlY2suc2V0UmVjZWl2ZWRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnJlY2VpdmVkKSk7XG4gICAgICByZXR1cm4gY2hlY2s7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3R4X3Byb29mXCIsIHt0eGlkOiB0eEhhc2gsIGFkZHJlc3M6IGFkZHJlc3MsIG1lc3NhZ2U6IG1lc3NhZ2V9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgdHJ5IHtcbiAgICAgIFxuICAgICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3R4X3Byb29mXCIsIHtcbiAgICAgICAgdHhpZDogdHhIYXNoLFxuICAgICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzaWduYXR1cmU6IHNpZ25hdHVyZVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIGludGVycHJldCByZXNwb25zZVxuICAgICAgbGV0IGlzR29vZCA9IHJlc3AucmVzdWx0Lmdvb2Q7XG4gICAgICBsZXQgY2hlY2sgPSBuZXcgTW9uZXJvQ2hlY2tUeCgpO1xuICAgICAgY2hlY2suc2V0SXNHb29kKGlzR29vZCk7XG4gICAgICBpZiAoaXNHb29kKSB7XG4gICAgICAgIGNoZWNrLnNldE51bUNvbmZpcm1hdGlvbnMocmVzcC5yZXN1bHQuY29uZmlybWF0aW9ucyk7XG4gICAgICAgIGNoZWNrLnNldEluVHhQb29sKHJlc3AucmVzdWx0LmluX3Bvb2wpO1xuICAgICAgICBjaGVjay5zZXRSZWNlaXZlZEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQucmVjZWl2ZWQpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjaGVjaztcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC0xICYmIGUubWVzc2FnZSA9PT0gXCJiYXNpY19zdHJpbmdcIikgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIk11c3QgcHJvdmlkZSBzaWduYXR1cmUgdG8gY2hlY2sgdHggcHJvb2ZcIiwgLTEpO1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9zcGVuZF9wcm9vZlwiLCB7dHhpZDogdHhIYXNoLCBtZXNzYWdlOiBtZXNzYWdlfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja19zcGVuZF9wcm9vZlwiLCB7XG4gICAgICAgIHR4aWQ6IHR4SGFzaCxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0Lmdvb2Q7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFsbDogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgYW1vdW50OiBiaWdpbnQsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3Jlc2VydmVfcHJvb2ZcIiwge1xuICAgICAgYWNjb3VudF9pbmRleDogYWNjb3VudElkeCxcbiAgICAgIGFtb3VudDogYW1vdW50LnRvU3RyaW5nKCksXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuXG4gIGFzeW5jIGNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tSZXNlcnZlPiB7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja19yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFkZHJlc3M6IGFkZHJlc3MsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICB9KTtcbiAgICBcbiAgICAvLyBpbnRlcnByZXQgcmVzdWx0c1xuICAgIGxldCBpc0dvb2QgPSByZXNwLnJlc3VsdC5nb29kO1xuICAgIGxldCBjaGVjayA9IG5ldyBNb25lcm9DaGVja1Jlc2VydmUoKTtcbiAgICBjaGVjay5zZXRJc0dvb2QoaXNHb29kKTtcbiAgICBpZiAoaXNHb29kKSB7XG4gICAgICBjaGVjay5zZXRVbmNvbmZpcm1lZFNwZW50QW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5zcGVudCkpO1xuICAgICAgY2hlY2suc2V0VG90YWxBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnRvdGFsKSk7XG4gICAgfVxuICAgIHJldHVybiBjaGVjaztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHhfbm90ZXNcIiwge3R4aWRzOiB0eEhhc2hlc30pKS5yZXN1bHQubm90ZXM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdLCBub3Rlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfdHhfbm90ZXNcIiwge3R4aWRzOiB0eEhhc2hlcywgbm90ZXM6IG5vdGVzfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVtdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc19ib29rXCIsIHtlbnRyaWVzOiBlbnRyeUluZGljZXN9KTtcbiAgICBpZiAoIXJlc3AucmVzdWx0LmVudHJpZXMpIHJldHVybiBbXTtcbiAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0LmVudHJpZXMpIHtcbiAgICAgIGVudHJpZXMucHVzaChuZXcgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSgpLnNldEluZGV4KHJwY0VudHJ5LmluZGV4KS5zZXRBZGRyZXNzKHJwY0VudHJ5LmFkZHJlc3MpLnNldERlc2NyaXB0aW9uKHJwY0VudHJ5LmRlc2NyaXB0aW9uKS5zZXRQYXltZW50SWQocnBjRW50cnkucGF5bWVudF9pZCkpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzOiBzdHJpbmcsIGRlc2NyaXB0aW9uPzogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImFkZF9hZGRyZXNzX2Jvb2tcIiwge2FkZHJlc3M6IGFkZHJlc3MsIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbn0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5pbmRleDtcbiAgfVxuICBcbiAgYXN5bmMgZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXg6IG51bWJlciwgc2V0QWRkcmVzczogYm9vbGVhbiwgYWRkcmVzczogc3RyaW5nIHwgdW5kZWZpbmVkLCBzZXREZXNjcmlwdGlvbjogYm9vbGVhbiwgZGVzY3JpcHRpb246IHN0cmluZyB8IHVuZGVmaW5lZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZWRpdF9hZGRyZXNzX2Jvb2tcIiwge1xuICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgc2V0X2FkZHJlc3M6IHNldEFkZHJlc3MsXG4gICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgc2V0X2Rlc2NyaXB0aW9uOiBzZXREZXNjcmlwdGlvbixcbiAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJkZWxldGVfYWRkcmVzc19ib29rXCIsIHtpbmRleDogZW50cnlJZHh9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGFnQWNjb3VudHModGFnLCBhY2NvdW50SW5kaWNlcykge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInRhZ19hY2NvdW50c1wiLCB7dGFnOiB0YWcsIGFjY291bnRzOiBhY2NvdW50SW5kaWNlc30pO1xuICB9XG5cbiAgYXN5bmMgdW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ1bnRhZ19hY2NvdW50c1wiLCB7YWNjb3VudHM6IGFjY291bnRJbmRpY2VzfSk7XG4gIH1cblxuICBhc3luYyBnZXRBY2NvdW50VGFncygpOiBQcm9taXNlPE1vbmVyb0FjY291bnRUYWdbXT4ge1xuICAgIGxldCB0YWdzID0gW107XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWNjb3VudF90YWdzXCIpO1xuICAgIGlmIChyZXNwLnJlc3VsdC5hY2NvdW50X3RhZ3MpIHtcbiAgICAgIGZvciAobGV0IHJwY0FjY291bnRUYWcgb2YgcmVzcC5yZXN1bHQuYWNjb3VudF90YWdzKSB7XG4gICAgICAgIHRhZ3MucHVzaChuZXcgTW9uZXJvQWNjb3VudFRhZyh7XG4gICAgICAgICAgdGFnOiBycGNBY2NvdW50VGFnLnRhZyA/IHJwY0FjY291bnRUYWcudGFnIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGxhYmVsOiBycGNBY2NvdW50VGFnLmxhYmVsID8gcnBjQWNjb3VudFRhZy5sYWJlbCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBhY2NvdW50SW5kaWNlczogcnBjQWNjb3VudFRhZy5hY2NvdW50c1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YWdzO1xuICB9XG5cbiAgYXN5bmMgc2V0QWNjb3VudFRhZ0xhYmVsKHRhZzogc3RyaW5nLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2FjY291bnRfdGFnX2Rlc2NyaXB0aW9uXCIsIHt0YWc6IHRhZywgZGVzY3JpcHRpb246IGxhYmVsfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBheW1lbnRVcmkoY29uZmlnOiBNb25lcm9UeENvbmZpZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibWFrZV91cmlcIiwge1xuICAgICAgYWRkcmVzczogY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSxcbiAgICAgIGFtb3VudDogY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFtb3VudCgpID8gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFtb3VudCgpLnRvU3RyaW5nKCkgOiB1bmRlZmluZWQsXG4gICAgICBwYXltZW50X2lkOiBjb25maWcuZ2V0UGF5bWVudElkKCksXG4gICAgICByZWNpcGllbnRfbmFtZTogY29uZmlnLmdldFJlY2lwaWVudE5hbWUoKSxcbiAgICAgIHR4X2Rlc2NyaXB0aW9uOiBjb25maWcuZ2V0Tm90ZSgpXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnVyaTtcbiAgfVxuICBcbiAgYXN5bmMgcGFyc2VQYXltZW50VXJpKHVyaTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeENvbmZpZz4ge1xuICAgIGFzc2VydCh1cmksIFwiTXVzdCBwcm92aWRlIFVSSSB0byBwYXJzZVwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInBhcnNlX3VyaVwiLCB7dXJpOiB1cml9KTtcbiAgICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKHthZGRyZXNzOiByZXNwLnJlc3VsdC51cmkuYWRkcmVzcywgYW1vdW50OiBCaWdJbnQocmVzcC5yZXN1bHQudXJpLmFtb3VudCl9KTtcbiAgICBjb25maWcuc2V0UGF5bWVudElkKHJlc3AucmVzdWx0LnVyaS5wYXltZW50X2lkKTtcbiAgICBjb25maWcuc2V0UmVjaXBpZW50TmFtZShyZXNwLnJlc3VsdC51cmkucmVjaXBpZW50X25hbWUpO1xuICAgIGNvbmZpZy5zZXROb3RlKHJlc3AucmVzdWx0LnVyaS50eF9kZXNjcmlwdGlvbik7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkpIGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5zZXRBZGRyZXNzKHVuZGVmaW5lZCk7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXRQYXltZW50SWQoKSkgY29uZmlnLnNldFBheW1lbnRJZCh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0UmVjaXBpZW50TmFtZSgpKSBjb25maWcuc2V0UmVjaXBpZW50TmFtZSh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0Tm90ZSgpKSBjb25maWcuc2V0Tm90ZSh1bmRlZmluZWQpO1xuICAgIHJldHVybiBjb25maWc7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2F0dHJpYnV0ZVwiLCB7a2V5OiBrZXl9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC52YWx1ZSA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHJlc3AucmVzdWx0LnZhbHVlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTQ1KSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXk6IHN0cmluZywgdmFsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYXR0cmlidXRlXCIsIHtrZXk6IGtleSwgdmFsdWU6IHZhbH0pO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzOiBudW1iZXIsIGJhY2tncm91bmRNaW5pbmc/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0YXJ0X21pbmluZ1wiLCB7XG4gICAgICB0aHJlYWRzX2NvdW50OiBudW1UaHJlYWRzLFxuICAgICAgZG9fYmFja2dyb3VuZF9taW5pbmc6IGJhY2tncm91bmRNaW5pbmcsXG4gICAgICBpZ25vcmVfYmF0dGVyeTogaWdub3JlQmF0dGVyeVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3BfbWluaW5nXCIpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnSW1wb3J0TmVlZGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm11bHRpc2lnX2ltcG9ydF9uZWVkZWQgPT09IHRydWU7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE11bHRpc2lnSW5mbygpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5mbz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaXNfbXVsdGlzaWdcIik7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCBpbmZvID0gbmV3IE1vbmVyb011bHRpc2lnSW5mbygpO1xuICAgIGluZm8uc2V0SXNNdWx0aXNpZyhyZXN1bHQubXVsdGlzaWcpO1xuICAgIGluZm8uc2V0SXNSZWFkeShyZXN1bHQucmVhZHkpO1xuICAgIGluZm8uc2V0VGhyZXNob2xkKHJlc3VsdC50aHJlc2hvbGQpO1xuICAgIGluZm8uc2V0TnVtUGFydGljaXBhbnRzKHJlc3VsdC50b3RhbCk7XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbiAgXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicHJlcGFyZV9tdWx0aXNpZ1wiLCB7ZW5hYmxlX211bHRpc2lnX2V4cGVyaW1lbnRhbDogdHJ1ZX0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIHJldHVybiByZXN1bHQubXVsdGlzaWdfaW5mbztcbiAgfVxuICBcbiAgYXN5bmMgbWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCB0aHJlc2hvbGQ6IG51bWJlciwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJtYWtlX211bHRpc2lnXCIsIHtcbiAgICAgIG11bHRpc2lnX2luZm86IG11bHRpc2lnSGV4ZXMsXG4gICAgICB0aHJlc2hvbGQ6IHRocmVzaG9sZCxcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZFxuICAgIH0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm11bHRpc2lnX2luZm87XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4Y2hhbmdlX211bHRpc2lnX2tleXNcIiwge211bHRpc2lnX2luZm86IG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkOiBwYXNzd29yZH0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgbGV0IG1zUmVzdWx0ID0gbmV3IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCgpO1xuICAgIG1zUmVzdWx0LnNldEFkZHJlc3MocmVzcC5yZXN1bHQuYWRkcmVzcyk7XG4gICAgbXNSZXN1bHQuc2V0TXVsdGlzaWdIZXgocmVzcC5yZXN1bHQubXVsdGlzaWdfaW5mbyk7XG4gICAgaWYgKG1zUmVzdWx0LmdldEFkZHJlc3MoKS5sZW5ndGggPT09IDApIG1zUmVzdWx0LnNldEFkZHJlc3ModW5kZWZpbmVkKTtcbiAgICBpZiAobXNSZXN1bHQuZ2V0TXVsdGlzaWdIZXgoKS5sZW5ndGggPT09IDApIG1zUmVzdWx0LnNldE11bHRpc2lnSGV4KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIG1zUmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRNdWx0aXNpZ0hleCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X211bHRpc2lnX2luZm9cIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmluZm87XG4gIH1cblxuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcmVmcmVzaEFmdGVySW1wb3J0PzogYm9vbGVhbik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHJlZnJlc2hBZnRlckltcG9ydCA9PT0gdW5kZWZpbmVkKSByZWZyZXNoQWZ0ZXJJbXBvcnQgPSB0cnVlO1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShtdWx0aXNpZ0hleGVzKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN0cmluZ1tdIHRvIGltcG9ydE11bHRpc2lnSGV4KClcIilcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9tdWx0aXNpZ19pbmZvXCIsIHtpbmZvOiBtdWx0aXNpZ0hleGVzLCByZWZyZXNoX2FmdGVyX2ltcG9ydDogcmVmcmVzaEFmdGVySW1wb3J0fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm5fb3V0cHV0cztcbiAgfVxuXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzaWduX211bHRpc2lnXCIsIHt0eF9kYXRhX2hleDogbXVsdGlzaWdUeEhleH0pO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgc2lnblJlc3VsdCA9IG5ldyBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQoKTtcbiAgICBzaWduUmVzdWx0LnNldFNpZ25lZE11bHRpc2lnVHhIZXgocmVzdWx0LnR4X2RhdGFfaGV4KTtcbiAgICBzaWduUmVzdWx0LnNldFR4SGFzaGVzKHJlc3VsdC50eF9oYXNoX2xpc3QpO1xuICAgIHJldHVybiBzaWduUmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfbXVsdGlzaWdcIiwge3R4X2RhdGFfaGV4OiBzaWduZWRNdWx0aXNpZ1R4SGV4fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQ6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkXCIsIHtvbGRfcGFzc3dvcmQ6IG9sZFBhc3N3b3JkIHx8IFwiXCIsIG5ld19wYXNzd29yZDogbmV3UGFzc3dvcmQgfHwgXCJcIn0pO1xuICB9XG4gIFxuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3JlXCIpO1xuICB9XG4gIFxuICBhc3luYyBjbG9zZShzYXZlID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5jbG9zZShzYXZlKTtcbiAgICBpZiAoc2F2ZSA9PT0gdW5kZWZpbmVkKSBzYXZlID0gZmFsc2U7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNsb3NlX3dhbGxldFwiLCB7YXV0b3NhdmVfY3VycmVudDogc2F2ZX0pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nsb3NlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmV0dXJuIGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTEzICYmIGUubWVzc2FnZS5pbmRleE9mKFwiTm8gd2FsbGV0IGZpbGVcIikgPiAtMTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICAvKipcbiAgICogU2F2ZSBhbmQgY2xvc2UgdGhlIGN1cnJlbnQgd2FsbGV0IGFuZCBzdG9wIHRoZSBSUEMgc2VydmVyLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3Bfd2FsbGV0XCIpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuXG4gIGFzeW5jIGdldE51bUJsb2Nrc1RvVW5sb2NrKCk6IFByb21pc2U8bnVtYmVyW118dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXROdW1CbG9ja3NUb1VubG9jaygpOyB9XG4gIGFzeW5jIGdldFR4KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldHx1bmRlZmluZWQ+IHsgcmV0dXJuIHN1cGVyLmdldFR4KHR4SGFzaCk7IH1cbiAgYXN5bmMgZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb0luY29taW5nVHJhbnNmZXJbXT4geyByZXR1cm4gc3VwZXIuZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KSB7IHJldHVybiBzdXBlci5nZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeSk7IH1cbiAgYXN5bmMgY3JlYXRlVHgoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHsgcmV0dXJuIHN1cGVyLmNyZWF0ZVR4KGNvbmZpZyk7IH1cbiAgYXN5bmMgcmVsYXlUeCh0eE9yTWV0YWRhdGE6IE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLnJlbGF5VHgodHhPck1ldGFkYXRhKTsgfVxuICBhc3luYyBnZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIuZ2V0VHhOb3RlKHR4SGFzaCk7IH1cbiAgYXN5bmMgc2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nLCBub3RlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHN1cGVyLnNldFR4Tm90ZSh0eEhhc2gsIG5vdGUpOyB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHN0YXRpYyBhc3luYyBjb25uZWN0VG9XYWxsZXRScGModXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBsZXQgY29uZmlnID0gTW9uZXJvV2FsbGV0UnBjLm5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZywgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICBpZiAoY29uZmlnLmNtZCkgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5zdGFydFdhbGxldFJwY1Byb2Nlc3MoY29uZmlnKTtcbiAgICBlbHNlIHJldHVybiBuZXcgTW9uZXJvV2FsbGV0UnBjKGNvbmZpZyk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgc3RhcnRXYWxsZXRScGNQcm9jZXNzKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNBcnJheShjb25maWcuY21kKSwgXCJNdXN0IHByb3ZpZGUgc3RyaW5nIGFycmF5IHdpdGggY29tbWFuZCBsaW5lIHBhcmFtZXRlcnNcIik7XG4gICAgXG4gICAgLy8gc3RhcnQgcHJvY2Vzc1xuICAgIGxldCBjaGlsZF9wcm9jZXNzID0gYXdhaXQgaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKTtcbiAgICBjb25zdCBjaGlsZFByb2Nlc3MgPSBjaGlsZF9wcm9jZXNzLnNwYXduKGNvbmZpZy5jbWRbMF0sIGNvbmZpZy5jbWQuc2xpY2UoMSksIHtcbiAgICAgIGVudjogeyAuLi5wcm9jZXNzLmVudiwgTEFORzogJ2VuX1VTLlVURi04JyB9IC8vIHNjcmFwZSBvdXRwdXQgaW4gZW5nbGlzaFxuICAgIH0pO1xuICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgYWZ0ZXIgc3RhcnRpbmcgbW9uZXJvLXdhbGxldC1ycGNcbiAgICBsZXQgdXJpO1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICBsZXQgb3V0cHV0ID0gXCJcIjtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRvdXRcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5vbignZGF0YScsIGFzeW5jIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBsZXQgbGluZSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDIsIGxpbmUpO1xuICAgICAgICAgIG91dHB1dCArPSBsaW5lICsgJ1xcbic7IC8vIGNhcHR1cmUgb3V0cHV0IGluIGNhc2Ugb2YgZXJyb3JcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBleHRyYWN0IHVyaSBmcm9tIGUuZy4gXCJJIEJpbmRpbmcgb24gMTI3LjAuMC4xIChJUHY0KTozODA4NVwiXG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWlucyA9IFwiQmluZGluZyBvbiBcIjtcbiAgICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zSWR4ID0gbGluZS5pbmRleE9mKHVyaUxpbmVDb250YWlucyk7XG4gICAgICAgICAgaWYgKHVyaUxpbmVDb250YWluc0lkeCA+PSAwKSB7XG4gICAgICAgICAgICBsZXQgaG9zdCA9IGxpbmUuc3Vic3RyaW5nKHVyaUxpbmVDb250YWluc0lkeCArIHVyaUxpbmVDb250YWlucy5sZW5ndGgsIGxpbmUubGFzdEluZGV4T2YoJyAnKSk7XG4gICAgICAgICAgICBsZXQgdW5mb3JtYXR0ZWRMaW5lID0gbGluZS5yZXBsYWNlKC9cXHUwMDFiXFxbLio/bS9nLCAnJykudHJpbSgpOyAvLyByZW1vdmUgY29sb3IgZm9ybWF0dGluZ1xuICAgICAgICAgICAgbGV0IHBvcnQgPSB1bmZvcm1hdHRlZExpbmUuc3Vic3RyaW5nKHVuZm9ybWF0dGVkTGluZS5sYXN0SW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBsZXQgc3NsSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtc3NsXCIpO1xuICAgICAgICAgICAgbGV0IHNzbEVuYWJsZWQgPSBzc2xJZHggPj0gMCA/IFwiZW5hYmxlZFwiID09IGNvbmZpZy5jbWRbc3NsSWR4ICsgMV0udG9Mb3dlckNhc2UoKSA6IGZhbHNlO1xuICAgICAgICAgICAgdXJpID0gKHNzbEVuYWJsZWQgPyBcImh0dHBzXCIgOiBcImh0dHBcIikgKyBcIjovL1wiICsgaG9zdCArIFwiOlwiICsgcG9ydDtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVhZCBzdWNjZXNzIG1lc3NhZ2VcbiAgICAgICAgICBpZiAobGluZS5pbmRleE9mKFwiU3RhcnRpbmcgd2FsbGV0IFJQQyBzZXJ2ZXJcIikgPj0gMCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBnZXQgdXNlcm5hbWUsIHBhc3N3b3JkLCB6bXEgcHVibGlzaCB1cmksIGFuZCBwcm94eSB1cmkgZnJvbSBwYXJhbXNcbiAgICAgICAgICAgIGxldCB1c2VyUGFzc0lkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLWxvZ2luXCIpO1xuICAgICAgICAgICAgbGV0IHVzZXJQYXNzID0gdXNlclBhc3NJZHggPj0gMCA/IGNvbmZpZy5jbWRbdXNlclBhc3NJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcoMCwgdXNlclBhc3MuaW5kZXhPZignOicpKTtcbiAgICAgICAgICAgIGxldCBwYXNzd29yZCA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcodXNlclBhc3MuaW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBsZXQgem1xVXJpSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS16bXEtcHViXCIpO1xuICAgICAgICAgICAgbGV0IHptcVVyaSA9IHptcVVyaUlkeCA+PSAwID8gY29uZmlnLmNtZFt6bXFVcmlJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCBwcm94eVVyaUlkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcHJveHlcIik7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0dXBQcm94eVVyaSA9IHByb3h5VXJpSWR4ID49IDAgPyBjb25maWcuY21kW3Byb3h5VXJpSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3NcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZy5jb3B5KCkuc2V0U2VydmVyKHt1cmk6IHVyaSwgdXNlcm5hbWU6IHVzZXJuYW1lLCBwYXNzd29yZDogcGFzc3dvcmQsIHptcVVyaTogem1xVXJpLCBwcm94eVVyaTogdGhpcy5zdGFydHVwUHJveHlVcmksIHJlamVjdFVuYXV0aG9yaXplZDogY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkfSk7XG4gICAgICAgICAgICBjb25maWcuY21kID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldFJwYy5jb25uZWN0VG9XYWxsZXRScGMoY29uZmlnKTtcbiAgICAgICAgICAgIHdhbGxldC5wcm9jZXNzID0gY2hpbGRQcm9jZXNzO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyByZXNvbHZlIHByb21pc2Ugd2l0aCBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3MgXG4gICAgICAgICAgICB0aGlzLmlzUmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZSh3YWxsZXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3RkZXJyXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRlcnIub24oJ2RhdGEnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIGNvbnNvbGUuZXJyb3IoZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIGV4aXRcbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwiZXhpdFwiLCBmdW5jdGlvbihjb2RlKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBwcm9jZXNzIHRlcm1pbmF0ZWQgd2l0aCBleGl0IGNvZGUgXCIgKyBjb2RlICsgKG91dHB1dCA/IFwiOlxcblxcblwiICsgb3V0cHV0IDogXCJcIikpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXJyb3JcbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgaWYgKGVyci5tZXNzYWdlLmluZGV4T2YoXCJFTk9FTlRcIikgPj0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGV4aXN0IGF0IHBhdGggJ1wiICsgY29uZmlnLmNtZFswXSArIFwiJ1wiKSk7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSB1bmNhdWdodCBleGNlcHRpb25cbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIiwgZnVuY3Rpb24oZXJyLCBvcmlnaW4pIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5jYXVnaHQgZXhjZXB0aW9uIGluIG1vbmVyby13YWxsZXQtcnBjIHByb2Nlc3M6IFwiICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3Iob3JpZ2luKTtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY2xlYXIoKSB7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gICAgZGVsZXRlIHRoaXMuYWRkcmVzc0NhY2hlO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgdGhpcy5wYXRoID0gdW5kZWZpbmVkO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QWNjb3VudEluZGljZXMoZ2V0U3ViYWRkcmVzc0luZGljZXM/OiBhbnkpIHtcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTtcbiAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgaW5kaWNlcy5zZXQoYWNjb3VudC5nZXRJbmRleCgpLCBnZXRTdWJhZGRyZXNzSW5kaWNlcyA/IGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc0luZGljZXMoYWNjb3VudC5nZXRJbmRleCgpKSA6IHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIHJldHVybiBpbmRpY2VzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0U3ViYWRkcmVzc0luZGljZXMoYWNjb3VudElkeCkge1xuICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NcIiwge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHh9KTtcbiAgICBmb3IgKGxldCBhZGRyZXNzIG9mIHJlc3AucmVzdWx0LmFkZHJlc3Nlcykgc3ViYWRkcmVzc0luZGljZXMucHVzaChhZGRyZXNzLmFkZHJlc3NfaW5kZXgpO1xuICAgIHJldHVybiBzdWJhZGRyZXNzSW5kaWNlcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldFRyYW5zZmVyc0F1eChxdWVyeTogTW9uZXJvVHJhbnNmZXJRdWVyeSkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHBhcmFtcyBmb3IgZ2V0X3RyYW5zZmVycyBycGMgY2FsbFxuICAgIGxldCB0eFF1ZXJ5ID0gcXVlcnkuZ2V0VHhRdWVyeSgpO1xuICAgIGxldCBjYW5CZUNvbmZpcm1lZCA9IHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldElzUmVsYXllZCgpICE9PSBmYWxzZTtcbiAgICBsZXQgY2FuQmVJblR4UG9vbCA9IHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEhlaWdodCgpID09PSB1bmRlZmluZWQgJiYgdHhRdWVyeS5nZXRNYXhIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4UXVlcnkuZ2V0SXNMb2NrZWQoKSAhPT0gZmFsc2U7XG4gICAgbGV0IGNhbkJlSW5jb21pbmcgPSBxdWVyeS5nZXRJc0luY29taW5nKCkgIT09IGZhbHNlICYmIHF1ZXJ5LmdldElzT3V0Z29pbmcoKSAhPT0gdHJ1ZSAmJiBxdWVyeS5nZXRIYXNEZXN0aW5hdGlvbnMoKSAhPT0gdHJ1ZTtcbiAgICBsZXQgY2FuQmVPdXRnb2luZyA9IHF1ZXJ5LmdldElzT3V0Z29pbmcoKSAhPT0gZmFsc2UgJiYgcXVlcnkuZ2V0SXNJbmNvbWluZygpICE9PSB0cnVlO1xuXG4gICAgLy8gY2hlY2sgaWYgZmV0Y2hpbmcgcG9vbCB0eHMgY29udHJhZGljdGVkIGJ5IGNvbmZpZ3VyYXRpb25cbiAgICBpZiAodHhRdWVyeS5nZXRJblR4UG9vbCgpID09PSB0cnVlICYmICFjYW5CZUluVHhQb29sKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgZmV0Y2ggcG9vbCB0cmFuc2FjdGlvbnMgYmVjYXVzZSBpdCBjb250cmFkaWN0cyBjb25maWd1cmF0aW9uXCIpO1xuICAgIH1cblxuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5pbiA9IGNhbkJlSW5jb21pbmcgJiYgY2FuQmVDb25maXJtZWQ7XG4gICAgcGFyYW1zLm91dCA9IGNhbkJlT3V0Z29pbmcgJiYgY2FuQmVDb25maXJtZWQ7XG4gICAgcGFyYW1zLnBvb2wgPSBjYW5CZUluY29taW5nICYmIGNhbkJlSW5UeFBvb2w7XG4gICAgcGFyYW1zLnBlbmRpbmcgPSBjYW5CZU91dGdvaW5nICYmIGNhbkJlSW5UeFBvb2w7XG4gICAgcGFyYW1zLmZhaWxlZCA9IHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJc0NvbmZpcm1lZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPSB0cnVlO1xuICAgIGlmICh0eFF1ZXJ5LmdldE1pbkhlaWdodCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eFF1ZXJ5LmdldE1pbkhlaWdodCgpID4gMCkgcGFyYW1zLm1pbl9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpIC0gMTsgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogd2FsbGV0Mjo6Z2V0X3BheW1lbnRzKCkgbWluX2hlaWdodCBpcyBleGNsdXNpdmUsIHNvIG1hbnVhbGx5IG9mZnNldCB0byBtYXRjaCBpbnRlbmRlZCByYW5nZSAoaXNzdWVzICM1NzUxLCAjNTU5OClcbiAgICAgIGVsc2UgcGFyYW1zLm1pbl9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpO1xuICAgIH1cbiAgICBpZiAodHhRdWVyeS5nZXRNYXhIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSBwYXJhbXMubWF4X2hlaWdodCA9IHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCk7XG4gICAgcGFyYW1zLmZpbHRlcl9ieV9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpICE9PSB1bmRlZmluZWQgfHwgdHhRdWVyeS5nZXRNYXhIZWlnaHQoKSAhPT0gdW5kZWZpbmVkO1xuICAgIGlmIChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkgPT09IHVuZGVmaW5lZCAmJiBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQsIFwiUXVlcnkgc3BlY2lmaWVzIGEgc3ViYWRkcmVzcyBpbmRleCBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIik7XG4gICAgICBwYXJhbXMuYWxsX2FjY291bnRzID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBxdWVyeS5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICAgIFxuICAgICAgLy8gc2V0IHN1YmFkZHJlc3MgaW5kaWNlcyBwYXJhbVxuICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gbmV3IFNldCgpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpICE9PSB1bmRlZmluZWQpIHN1YmFkZHJlc3NJbmRpY2VzLmFkZChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLm1hcChzdWJhZGRyZXNzSWR4ID0+IHN1YmFkZHJlc3NJbmRpY2VzLmFkZChzdWJhZGRyZXNzSWR4KSk7XG4gICAgICBpZiAoc3ViYWRkcmVzc0luZGljZXMuc2l6ZSkgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IEFycmF5LmZyb20oc3ViYWRkcmVzc0luZGljZXMpO1xuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB1bmlxdWUgdHhzIGFuZCBibG9ja3NcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBcbiAgICAvLyBidWlsZCB0eHMgdXNpbmcgYGdldF90cmFuc2ZlcnNgXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHJhbnNmZXJzXCIsIHBhcmFtcyk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJlc3AucmVzdWx0KSkge1xuICAgICAgZm9yIChsZXQgcnBjVHggb2YgcmVzcC5yZXN1bHRba2V5XSkge1xuICAgICAgICAvL2lmIChycGNUeC50eGlkID09PSBxdWVyeS5kZWJ1Z1R4SWQpIGNvbnNvbGUubG9nKHJwY1R4KTtcbiAgICAgICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlcihycGNUeCk7XG4gICAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSBhc3NlcnQodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSA+IC0xKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlcGxhY2UgdHJhbnNmZXIgYW1vdW50IHdpdGggZGVzdGluYXRpb24gc3VtXG4gICAgICAgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IGNvbmZpcm1lZCB0eCBmcm9tL3RvIHNhbWUgYWNjb3VudCBoYXMgYW1vdW50IDAgYnV0IGNhY2hlZCB0cmFuc2ZlcnNcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldElzUmVsYXllZCgpICYmICF0eC5nZXRJc0ZhaWxlZCgpICYmXG4gICAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkgJiYgdHguZ2V0T3V0Z29pbmdBbW91bnQoKSA9PT0gMG4pIHtcbiAgICAgICAgICBsZXQgb3V0Z29pbmdUcmFuc2ZlciA9IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKTtcbiAgICAgICAgICBsZXQgdHJhbnNmZXJUb3RhbCA9IEJpZ0ludCgwKTtcbiAgICAgICAgICBmb3IgKGxldCBkZXN0aW5hdGlvbiBvZiBvdXRnb2luZ1RyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpKSB0cmFuc2ZlclRvdGFsID0gdHJhbnNmZXJUb3RhbCArIGRlc3RpbmF0aW9uLmdldEFtb3VudCgpO1xuICAgICAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBbW91bnQodHJhbnNmZXJUb3RhbCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIG1lcmdlIHR4XG4gICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzb3J0IHR4cyBieSBibG9jayBoZWlnaHRcbiAgICBsZXQgdHhzOiBNb25lcm9UeFdhbGxldFtdID0gT2JqZWN0LnZhbHVlcyh0eE1hcCk7XG4gICAgdHhzLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVUeHNCeUhlaWdodCk7XG4gICAgXG4gICAgLy8gZmlsdGVyIGFuZCByZXR1cm4gdHJhbnNmZXJzXG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgXG4gICAgICAvLyB0eCBpcyBub3QgaW5jb21pbmcvb3V0Z29pbmcgdW5sZXNzIGFscmVhZHkgc2V0XG4gICAgICBpZiAodHguZ2V0SXNJbmNvbWluZygpID09PSB1bmRlZmluZWQpIHR4LnNldElzSW5jb21pbmcoZmFsc2UpO1xuICAgICAgaWYgKHR4LmdldElzT3V0Z29pbmcoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc091dGdvaW5nKGZhbHNlKTtcbiAgICAgIFxuICAgICAgLy8gc29ydCBpbmNvbWluZyB0cmFuc2ZlcnNcbiAgICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZUluY29taW5nVHJhbnNmZXJzKTtcbiAgICAgIFxuICAgICAgLy8gY29sbGVjdCBxdWVyaWVkIHRyYW5zZmVycywgZXJhc2UgaWYgZXhjbHVkZWRcbiAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmZpbHRlclRyYW5zZmVycyhxdWVyeSkpIHtcbiAgICAgICAgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyByZW1vdmUgdHhzIHdpdGhvdXQgcmVxdWVzdGVkIHRyYW5zZmVyXG4gICAgICBpZiAodHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PT0gdW5kZWZpbmVkICYmIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0eC5nZXRCbG9jaygpLmdldFR4cygpLnNwbGljZSh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldE91dHB1dHNBdXgocXVlcnkpIHtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzIHRvIGJlIHF1ZXJpZWRcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTtcbiAgICBpZiAocXVlcnkuZ2V0QWNjb3VudEluZGV4KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gbmV3IFNldCgpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpICE9PSB1bmRlZmluZWQpIHN1YmFkZHJlc3NJbmRpY2VzLmFkZChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLm1hcChzdWJhZGRyZXNzSWR4ID0+IHN1YmFkZHJlc3NJbmRpY2VzLmFkZChzdWJhZGRyZXNzSWR4KSk7XG4gICAgICBpbmRpY2VzLnNldChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMuc2l6ZSA/IEFycmF5LmZyb20oc3ViYWRkcmVzc0luZGljZXMpIDogdW5kZWZpbmVkKTsgIC8vIHVuZGVmaW5lZCB3aWxsIGZldGNoIGZyb20gYWxsIHN1YmFkZHJlc3Nlc1xuICAgIH0gZWxzZSB7XG4gICAgICBhc3NlcnQuZXF1YWwocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCksIHVuZGVmaW5lZCwgXCJRdWVyeSBzcGVjaWZpZXMgYSBzdWJhZGRyZXNzIGluZGV4IGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKVxuICAgICAgYXNzZXJ0KHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCB8fCBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCwgXCJRdWVyeSBzcGVjaWZpZXMgc3ViYWRkcmVzcyBpbmRpY2VzIGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKTtcbiAgICAgIGluZGljZXMgPSBhd2FpdCB0aGlzLmdldEFjY291bnRJbmRpY2VzKCk7ICAvLyBmZXRjaCBhbGwgYWNjb3VudCBpbmRpY2VzIHdpdGhvdXQgc3ViYWRkcmVzc2VzXG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHVuaXF1ZSB0eHMgYW5kIGJsb2Nrc1xuICAgIGxldCB0eE1hcCA9IHt9O1xuICAgIGxldCBibG9ja01hcCA9IHt9O1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdHhzIHdpdGggb3V0cHV0cyBmb3IgZWFjaCBpbmRpY2F0ZWQgYWNjb3VudCB1c2luZyBgaW5jb21pbmdfdHJhbnNmZXJzYCBycGMgY2FsbFxuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy50cmFuc2Zlcl90eXBlID0gcXVlcnkuZ2V0SXNTcGVudCgpID09PSB0cnVlID8gXCJ1bmF2YWlsYWJsZVwiIDogcXVlcnkuZ2V0SXNTcGVudCgpID09PSBmYWxzZSA/IFwiYXZhaWxhYmxlXCIgOiBcImFsbFwiO1xuICAgIHBhcmFtcy52ZXJib3NlID0gdHJ1ZTtcbiAgICBmb3IgKGxldCBhY2NvdW50SWR4IG9mIGluZGljZXMua2V5cygpKSB7XG4gICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gYWNjb3VudElkeDtcbiAgICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBpbmRpY2VzLmdldChhY2NvdW50SWR4KTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW5jb21pbmdfdHJhbnNmZXJzXCIsIHBhcmFtcyk7XG4gICAgICBcbiAgICAgIC8vIGNvbnZlcnQgcmVzcG9uc2UgdG8gdHhzIHdpdGggb3V0cHV0cyBhbmQgbWVyZ2VcbiAgICAgIGlmIChyZXNwLnJlc3VsdC50cmFuc2ZlcnMgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG4gICAgICBmb3IgKGxldCBycGNPdXRwdXQgb2YgcmVzcC5yZXN1bHQudHJhbnNmZXJzKSB7XG4gICAgICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoT3V0cHV0KHJwY091dHB1dCk7XG4gICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzb3J0IHR4cyBieSBibG9jayBoZWlnaHRcbiAgICBsZXQgdHhzOiBNb25lcm9UeFdhbGxldFtdID0gT2JqZWN0LnZhbHVlcyh0eE1hcCk7XG4gICAgdHhzLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVUeHNCeUhlaWdodCk7XG4gICAgXG4gICAgLy8gY29sbGVjdCBxdWVyaWVkIG91dHB1dHNcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgXG4gICAgICAvLyBzb3J0IG91dHB1dHNcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdHguZ2V0T3V0cHV0cygpLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVPdXRwdXRzKTtcbiAgICAgIFxuICAgICAgLy8gY29sbGVjdCBxdWVyaWVkIG91dHB1dHMsIGVyYXNlIGlmIGV4Y2x1ZGVkXG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZmlsdGVyT3V0cHV0cyhxdWVyeSkpIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgXG4gICAgICAvLyByZW1vdmUgZXhjbHVkZWQgdHhzIGZyb20gYmxvY2tcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgPT09IHVuZGVmaW5lZCAmJiB0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29tbW9uIG1ldGhvZCB0byBnZXQga2V5IGltYWdlcy5cbiAgICogXG4gICAqIEBwYXJhbSBhbGwgLSBwZWNpZmllcyB0byBnZXQgYWxsIHhvciBvbmx5IG5ldyBpbWFnZXMgZnJvbSBsYXN0IGltcG9ydFxuICAgKiBAcmV0dXJuIHtNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdH0gdGhlIGtleSBpbWFnZXMgYW5kIHRoZWlyIG9mZnNldCBhbW9uZyB0aGUgd2FsbGV0J3Mgb3V0cHV0c1xuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIHJwY0V4cG9ydEtleUltYWdlcyhhbGwpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfa2V5X2ltYWdlc1wiLCB7YWxsOiBhbGx9KTtcbiAgICBsZXQga2V5SW1hZ2VzID0gKHJlc3AucmVzdWx0LnNpZ25lZF9rZXlfaW1hZ2VzIHx8IFtdKS5tYXAocnBjSW1hZ2UgPT4gbmV3IE1vbmVyb0tleUltYWdlKHJwY0ltYWdlLmtleV9pbWFnZSwgcnBjSW1hZ2Uuc2lnbmF0dXJlKSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCgpLnNldE9mZnNldChyZXNwLnJlc3VsdC5vZmZzZXQpLnNldEtleUltYWdlcyhrZXlJbWFnZXMpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgcnBjU3dlZXBBY2NvdW50KGNvbmZpZzogTW9uZXJvVHhDb25maWcpIHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBzd2VlcCBjb25maWdcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYW4gYWNjb3VudCBpbmRleCB0byBzd2VlcCBmcm9tXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoICE9IDEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBleGFjdGx5IG9uZSBkZXN0aW5hdGlvbiB0byBzd2VlcCB0b1wiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZGVzdGluYXRpb24gYWRkcmVzcyB0byBzd2VlcCB0b1wiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFtb3VudCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IGFtb3VudCBpbiBzd2VlcCBjb25maWdcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRLZXlJbWFnZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIktleSBpbWFnZSBkZWZpbmVkOyB1c2Ugc3dlZXBPdXRwdXQoKSB0byBzd2VlcCBhbiBvdXRwdXQgYnkgaXRzIGtleSBpbWFnZVwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCAmJiBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkVtcHR5IGxpc3QgZ2l2ZW4gZm9yIHN1YmFkZHJlc3NlcyBpbmRpY2VzIHRvIHN3ZWVwXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcygpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3dlZXAgZWFjaCBzdWJhZGRyZXNzIHdpdGggUlBDIGBzd2VlcF9hbGxgXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkgIT09IHVuZGVmaW5lZCAmJiBjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkubGVuZ3RoID4gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3dlZXBpbmcgb3V0cHV0IGRvZXMgbm90IHN1cHBvcnQgc3VidHJhY3RpbmcgZmVlcyBmcm9tIGRlc3RpbmF0aW9uc1wiKTtcbiAgICBcbiAgICAvLyBzd2VlcCBmcm9tIGFsbCBzdWJhZGRyZXNzZXMgaWYgbm90IG90aGVyd2lzZSBkZWZpbmVkXG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbmZpZy5zZXRTdWJhZGRyZXNzSW5kaWNlcyhbXSk7XG4gICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKSkpIHtcbiAgICAgICAgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJObyBzdWJhZGRyZXNzZXMgdG8gc3dlZXAgZnJvbVwiKTtcbiAgICBcbiAgICAvLyBjb21tb24gY29uZmlnIHBhcmFtc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIGxldCByZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpID09PSB0cnVlO1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gY29uZmlnLmdldEFjY291bnRJbmRleCgpO1xuICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCk7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWcuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWcuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZy5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gIXJlbGF5O1xuICAgIHBhcmFtcy5iZWxvd19hbW91bnQgPSBjb25maWcuZ2V0QmVsb3dBbW91bnQoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2tleXMgPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBpbnZva2Ugd2FsbGV0IHJwYyBgc3dlZXBfYWxsYFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfYWxsXCIsIHBhcmFtcyk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGZyb20gcmVzcG9uc2VcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCwgdW5kZWZpbmVkLCBjb25maWcpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgcmVtYWluaW5nIGtub3duIGZpZWxkc1xuICAgIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB7XG4gICAgICB0eC5zZXRJc0xvY2tlZCh0cnVlKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICB0eC5zZXRSZWxheShyZWxheSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChyZWxheSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQocmVsYXkpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIGxldCB0cmFuc2ZlciA9IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKTtcbiAgICAgIHRyYW5zZmVyLnNldEFjY291bnRJbmRleChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkpO1xuICAgICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSkgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkpO1xuICAgICAgbGV0IGRlc3RpbmF0aW9uID0gbmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksIEJpZ0ludCh0cmFuc2Zlci5nZXRBbW91bnQoKSkpO1xuICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKFtkZXN0aW5hdGlvbl0pO1xuICAgICAgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgICB0eC5zZXRQYXltZW50SWQoY29uZmlnLmdldFBheW1lbnRJZCgpKTtcbiAgICAgIGlmICh0eC5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0VW5sb2NrVGltZSgwbik7XG4gICAgICBpZiAodHguZ2V0UmVsYXkoKSkge1xuICAgICAgICBpZiAodHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgrbmV3IERhdGUoKS5nZXRUaW1lKCkpOyAgLy8gVE9ETyAobW9uZXJvLXdhbGxldC1ycGMpOiBwcm92aWRlIHRpbWVzdGFtcCBvbiByZXNwb25zZTsgdW5jb25maXJtZWQgdGltZXN0YW1wcyB2YXJ5XG4gICAgICAgIGlmICh0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbigpID09PSB1bmRlZmluZWQpIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0LmdldFR4cygpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgPT0gdW5kZWZpbmVkICYmIHRoaXMubGlzdGVuZXJzLmxlbmd0aCkgdGhpcy53YWxsZXRQb2xsZXIgPSBuZXcgV2FsbGV0UG9sbGVyKHRoaXMpO1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkKSB0aGlzLndhbGxldFBvbGxlci5zZXRJc1BvbGxpbmcodGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQb2xsIGlmIGxpc3RlbmluZy5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBwb2xsKCkge1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2FsbGV0UG9sbGVyLmlzUG9sbGluZykgYXdhaXQgdGhpcy53YWxsZXRQb2xsZXIucG9sbCgpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgU1RBVElDIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVDb25maWcodXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogTW9uZXJvV2FsbGV0Q29uZmlnIHtcbiAgICBsZXQgY29uZmlnOiB1bmRlZmluZWQgfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gPSB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbmZpZyA9PT0gXCJzdHJpbmdcIiB8fCAodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPikudXJpKSBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHtzZXJ2ZXI6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29uZmlnIGFzIHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4sIHVzZXJuYW1lLCBwYXNzd29yZCl9KTtcbiAgICBlbHNlIGlmIChHZW5VdGlscy5pc0FycmF5KHVyaU9yQ29uZmlnKSkgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh7Y21kOiB1cmlPckNvbmZpZyBhcyBzdHJpbmdbXX0pO1xuICAgIGVsc2UgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pO1xuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlciA9PT0gdW5kZWZpbmVkKSBjb25maWcucHJveHlUb1dvcmtlciA9IHRydWU7XG4gICAgcmV0dXJuIGNvbmZpZyBhcyBNb25lcm9XYWxsZXRDb25maWc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZW1vdmUgY3JpdGVyaWEgd2hpY2ggcmVxdWlyZXMgbG9va2luZyB1cCBvdGhlciB0cmFuc2ZlcnMvb3V0cHV0cyB0b1xuICAgKiBmdWxmaWxsIHF1ZXJ5LlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBxdWVyeSAtIHRoZSBxdWVyeSB0byBkZWNvbnRleHR1YWxpemVcbiAgICogQHJldHVybiB7TW9uZXJvVHhRdWVyeX0gYSByZWZlcmVuY2UgdG8gdGhlIHF1ZXJ5IGZvciBjb252ZW5pZW5jZVxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBkZWNvbnRleHR1YWxpemUocXVlcnkpIHtcbiAgICBxdWVyeS5zZXRJc0luY29taW5nKHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0SXNPdXRnb2luZyh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldFRyYW5zZmVyUXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRJbnB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0T3V0cHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gcXVlcnk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgaXNDb250ZXh0dWFsKHF1ZXJ5KSB7XG4gICAgaWYgKCFxdWVyeSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghcXVlcnkuZ2V0VHhRdWVyeSgpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRJc0luY29taW5nKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7IC8vIHJlcXVpcmVzIGdldHRpbmcgb3RoZXIgdHJhbnNmZXJzXG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRJc091dGdvaW5nKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKHF1ZXJ5IGluc3RhbmNlb2YgTW9uZXJvVHJhbnNmZXJRdWVyeSkge1xuICAgICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRPdXRwdXRRdWVyeSgpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIG91dHB1dHNcbiAgICB9IGVsc2UgaWYgKHF1ZXJ5IGluc3RhbmNlb2YgTW9uZXJvT3V0cHV0UXVlcnkpIHtcbiAgICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0VHJhbnNmZXJRdWVyeSgpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIHRyYW5zZmVyc1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJxdWVyeSBtdXN0IGJlIHR4IG9yIHRyYW5zZmVyIHF1ZXJ5XCIpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0FjY291bnQocnBjQWNjb3VudCkge1xuICAgIGxldCBhY2NvdW50ID0gbmV3IE1vbmVyb0FjY291bnQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQWNjb3VudCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNBY2NvdW50W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFjY291bnRfaW5kZXhcIikgYWNjb3VudC5zZXRJbmRleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhbGFuY2VcIikgYWNjb3VudC5zZXRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZF9iYWxhbmNlXCIpIGFjY291bnQuc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYXNlX2FkZHJlc3NcIikgYWNjb3VudC5zZXRQcmltYXJ5QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhZ1wiKSBhY2NvdW50LnNldFRhZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhYmVsXCIpIHsgfSAvLyBsYWJlbCBiZWxvbmdzIHRvIGZpcnN0IHN1YmFkZHJlc3NcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGFjY291bnQgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgaWYgKFwiXCIgPT09IGFjY291bnQuZ2V0VGFnKCkpIGFjY291bnQuc2V0VGFnKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIGFjY291bnQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcykge1xuICAgIGxldCBzdWJhZGRyZXNzID0gbmV3IE1vbmVyb1N1YmFkZHJlc3MoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjU3ViYWRkcmVzcykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNTdWJhZGRyZXNzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFjY291bnRfaW5kZXhcIikgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzX2luZGV4XCIpIHN1YmFkZHJlc3Muc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzXCIpIHN1YmFkZHJlc3Muc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhbGFuY2VcIikgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZF9iYWxhbmNlXCIpIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fdW5zcGVudF9vdXRwdXRzXCIpIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYWJlbFwiKSB7IGlmICh2YWwpIHN1YmFkZHJlc3Muc2V0TGFiZWwodmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVzZWRcIikgc3ViYWRkcmVzcy5zZXRJc1VzZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja3NfdG9fdW5sb2NrXCIpIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2sodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PSBcInRpbWVfdG9fdW5sb2NrXCIpIHt9ICAvLyBpZ25vcmluZ1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgc3ViYWRkcmVzcyBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gc3ViYWRkcmVzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgc2VudCB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIFRPRE86IHJlbW92ZSBjb3B5RGVzdGluYXRpb25zIGFmdGVyID4xOC4zLjEgd2hlbiBzdWJ0cmFjdEZlZUZyb20gZnVsbHkgc3VwcG9ydGVkXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4Q29uZmlnfSBjb25maWcgLSBzZW5kIGNvbmZpZ1xuICAgKiBAcGFyYW0ge01vbmVyb1R4V2FsbGV0fSBbdHhdIC0gZXhpc3RpbmcgdHJhbnNhY3Rpb24gdG8gaW5pdGlhbGl6ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gY29weURlc3RpbmF0aW9ucyAtIGNvcGllcyBjb25maWcgZGVzdGluYXRpb25zIGlmIHRydWVcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IGlzIHRoZSBpbml0aWFsaXplZCBzZW5kIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGluaXRTZW50VHhXYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPiwgdHgsIGNvcHlEZXN0aW5hdGlvbnMpIHtcbiAgICBpZiAoIXR4KSB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIGxldCByZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpID09PSB0cnVlO1xuICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgdHguc2V0SW5UeFBvb2wocmVsYXkpO1xuICAgIHR4LnNldFJlbGF5KHJlbGF5KTtcbiAgICB0eC5zZXRJc1JlbGF5ZWQocmVsYXkpO1xuICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIHR4LnNldElzTG9ja2VkKHRydWUpO1xuICAgIHR4LnNldFJpbmdTaXplKE1vbmVyb1V0aWxzLlJJTkdfU0laRSk7XG4gICAgbGV0IHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKTtcbiAgICB0cmFuc2Zlci5zZXRUeCh0eCk7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICYmIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSkgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkuc2xpY2UoMCkpOyAvLyB3ZSBrbm93IHNyYyBzdWJhZGRyZXNzIGluZGljZXMgaWZmIGNvbmZpZyBzcGVjaWZpZXMgMVxuICAgIGlmIChjb3B5RGVzdGluYXRpb25zKSB7XG4gICAgICBsZXQgZGVzdENvcGllcyA9IFtdO1xuICAgICAgZm9yIChsZXQgZGVzdCBvZiBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkpIGRlc3RDb3BpZXMucHVzaChkZXN0LmNvcHkoKSk7XG4gICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoZGVzdENvcGllcyk7XG4gICAgfVxuICAgIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgIHR4LnNldFBheW1lbnRJZChjb25maWcuZ2V0UGF5bWVudElkKCkpO1xuICAgIGlmICh0eC5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0VW5sb2NrVGltZSgwbik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZWxheSgpKSB7XG4gICAgICBpZiAodHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgrbmV3IERhdGUoKS5nZXRUaW1lKCkpOyAgLy8gVE9ETyAobW9uZXJvLXdhbGxldC1ycGMpOiBwcm92aWRlIHRpbWVzdGFtcCBvbiByZXNwb25zZTsgdW5jb25maXJtZWQgdGltZXN0YW1wcyB2YXJ5XG4gICAgICBpZiAodHguZ2V0SXNEb3VibGVTcGVuZFNlZW4oKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgdHggc2V0IGZyb20gYSBSUEMgbWFwIGV4Y2x1ZGluZyB0eHMuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjTWFwIC0gbWFwIHRvIGluaXRpYWxpemUgdGhlIHR4IHNldCBmcm9tXG4gICAqIEByZXR1cm4gTW9uZXJvVHhTZXQgLSBpbml0aWFsaXplZCB0eCBzZXRcbiAgICogQHJldHVybiB0aGUgcmVzdWx0aW5nIHR4IHNldFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhTZXQocnBjTWFwKSB7XG4gICAgbGV0IHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KCk7XG4gICAgdHhTZXQuc2V0TXVsdGlzaWdUeEhleChycGNNYXAubXVsdGlzaWdfdHhzZXQpO1xuICAgIHR4U2V0LnNldFVuc2lnbmVkVHhIZXgocnBjTWFwLnVuc2lnbmVkX3R4c2V0KTtcbiAgICB0eFNldC5zZXRTaWduZWRUeEhleChycGNNYXAuc2lnbmVkX3R4c2V0KTtcbiAgICBpZiAodHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0TXVsdGlzaWdUeEhleCh1bmRlZmluZWQpO1xuICAgIGlmICh0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCkubGVuZ3RoID09PSAwKSB0eFNldC5zZXRVbnNpZ25lZFR4SGV4KHVuZGVmaW5lZCk7XG4gICAgaWYgKHR4U2V0LmdldFNpZ25lZFR4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRTaWduZWRUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0U2lnbmVkVHhIZXgodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIE1vbmVyb1R4U2V0IGZyb20gYSBsaXN0IG9mIHJwYyB0eHMuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHhzIC0gcnBjIHR4cyB0byBpbml0aWFsaXplIHRoZSBzZXQgZnJvbVxuICAgKiBAcGFyYW0gdHhzIC0gZXhpc3RpbmcgdHhzIHRvIGZ1cnRoZXIgaW5pdGlhbGl6ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB0aGUgY29udmVydGVkIHR4IHNldFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocnBjVHhzOiBhbnksIHR4cz86IGFueSwgY29uZmlnPzogYW55KSB7XG4gICAgXG4gICAgLy8gYnVpbGQgc2hhcmVkIHR4IHNldFxuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhTZXQocnBjVHhzKTtcblxuICAgIC8vIGdldCBudW1iZXIgb2YgdHhzXG4gICAgbGV0IG51bVR4cyA9IHJwY1R4cy5mZWVfbGlzdCA/IHJwY1R4cy5mZWVfbGlzdC5sZW5ndGggOiBycGNUeHMudHhfaGFzaF9saXN0ID8gcnBjVHhzLnR4X2hhc2hfbGlzdC5sZW5ndGggOiAwO1xuICAgIFxuICAgIC8vIGRvbmUgaWYgcnBjIHJlc3BvbnNlIGNvbnRhaW5zIG5vIHR4c1xuICAgIGlmIChudW1UeHMgPT09IDApIHtcbiAgICAgIGFzc2VydC5lcXVhbCh0eHMsIHVuZGVmaW5lZCk7XG4gICAgICByZXR1cm4gdHhTZXQ7XG4gICAgfVxuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGlmIG5vbmUgZ2l2ZW5cbiAgICBpZiAodHhzKSB0eFNldC5zZXRUeHModHhzKTtcbiAgICBlbHNlIHtcbiAgICAgIHR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UeHM7IGkrKykgdHhzLnB1c2gobmV3IE1vbmVyb1R4V2FsbGV0KCkpO1xuICAgIH1cbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIHR4LnNldFR4U2V0KHR4U2V0KTtcbiAgICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgfVxuICAgIHR4U2V0LnNldFR4cyh0eHMpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGZyb20gcnBjIGxpc3RzXG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1R4cykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUeHNba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhfaGFzaF9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0SGFzaCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2tleV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0S2V5KHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfYmxvYl9saXN0XCIgfHwga2V5ID09PSBcInR4X3Jhd19saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0RnVsbEhleCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X21ldGFkYXRhX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRNZXRhZGF0YSh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0RmVlKEJpZ0ludCh2YWxbaV0pKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldFdlaWdodCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9saXN0XCIpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAodHhzW2ldLmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PSB1bmRlZmluZWQpIHR4c1tpXS5zZXRPdXRnb2luZ1RyYW5zZmVyKG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHhzW2ldKSk7XG4gICAgICAgICAgdHhzW2ldLmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBbW91bnQoQmlnSW50KHZhbFtpXSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibXVsdGlzaWdfdHhzZXRcIiB8fCBrZXkgPT09IFwidW5zaWduZWRfdHhzZXRcIiB8fCBrZXkgPT09IFwic2lnbmVkX3R4c2V0XCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlbnRfa2V5X2ltYWdlc19saXN0XCIpIHtcbiAgICAgICAgbGV0IGlucHV0S2V5SW1hZ2VzTGlzdCA9IHZhbDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dEtleUltYWdlc0xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR4c1tpXS5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgICB0eHNbaV0uc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgICBmb3IgKGxldCBpbnB1dEtleUltYWdlIG9mIGlucHV0S2V5SW1hZ2VzTGlzdFtpXVtcImtleV9pbWFnZXNcIl0pIHtcbiAgICAgICAgICAgIHR4c1tpXS5nZXRJbnB1dHMoKS5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKS5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UoKS5zZXRIZXgoaW5wdXRLZXlJbWFnZSkpLnNldFR4KHR4c1tpXSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNfYnlfZGVzdF9saXN0XCIpIHtcbiAgICAgICAgbGV0IGFtb3VudHNCeURlc3RMaXN0ID0gdmFsO1xuICAgICAgICBsZXQgZGVzdGluYXRpb25JZHggPSAwO1xuICAgICAgICBmb3IgKGxldCB0eElkeCA9IDA7IHR4SWR4IDwgYW1vdW50c0J5RGVzdExpc3QubGVuZ3RoOyB0eElkeCsrKSB7XG4gICAgICAgICAgbGV0IGFtb3VudHNCeURlc3QgPSBhbW91bnRzQnlEZXN0TGlzdFt0eElkeF1bXCJhbW91bnRzXCJdO1xuICAgICAgICAgIGlmICh0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PT0gdW5kZWZpbmVkKSB0eHNbdHhJZHhdLnNldE91dGdvaW5nVHJhbnNmZXIobmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eHNbdHhJZHhdKSk7XG4gICAgICAgICAgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0RGVzdGluYXRpb25zKFtdKTtcbiAgICAgICAgICBmb3IgKGxldCBhbW91bnQgb2YgYW1vdW50c0J5RGVzdCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGggPT09IDEpIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnQpKSk7IC8vIHN3ZWVwaW5nIGNhbiBjcmVhdGUgbXVsdGlwbGUgdHhzIHdpdGggb25lIGFkZHJlc3NcbiAgICAgICAgICAgIGVsc2UgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpW2Rlc3RpbmF0aW9uSWR4KytdLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudCkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHRyYW5zYWN0aW9uIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgcnBjIHR4IHdpdGggYSB0cmFuc2ZlciB0byBhIHR4IHNldCB3aXRoIGEgdHggYW5kIHRyYW5zZmVyLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4IC0gcnBjIHR4IHRvIGJ1aWxkIGZyb21cbiAgICogQHBhcmFtIHR4IC0gZXhpc3RpbmcgdHggdG8gY29udGludWUgaW5pdGlhbGl6aW5nIChvcHRpb25hbClcbiAgICogQHBhcmFtIGlzT3V0Z29pbmcgLSBzcGVjaWZpZXMgaWYgdGhlIHR4IGlzIG91dGdvaW5nIGlmIHRydWUsIGluY29taW5nIGlmIGZhbHNlLCBvciBkZWNvZGVzIGZyb20gdHlwZSBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHRoZSBpbml0aWFsaXplZCB0eCBzZXQgd2l0aCBhIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFRvVHhTZXQocnBjVHgsIHR4LCBpc091dGdvaW5nLCBjb25maWcpIHtcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4U2V0KHJwY1R4KTtcbiAgICB0eFNldC5zZXRUeHMoW01vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHgsIHR4LCBpc091dGdvaW5nLCBjb25maWcpLnNldFR4U2V0KHR4U2V0KV0pO1xuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEJ1aWxkcyBhIE1vbmVyb1R4V2FsbGV0IGZyb20gYSBSUEMgdHguXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHggLSBycGMgdHggdG8gYnVpbGQgZnJvbVxuICAgKiBAcGFyYW0gdHggLSBleGlzdGluZyB0eCB0byBjb250aW51ZSBpbml0aWFsaXppbmcgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gaXNPdXRnb2luZyAtIHNwZWNpZmllcyBpZiB0aGUgdHggaXMgb3V0Z29pbmcgaWYgdHJ1ZSwgaW5jb21pbmcgaWYgZmFsc2UsIG9yIGRlY29kZXMgZnJvbSB0eXBlIGlmIHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSBpcyB0aGUgaW5pdGlhbGl6ZWQgdHhcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4OiBhbnksIHR4PzogYW55LCBpc091dGdvaW5nPzogYW55LCBjb25maWc/OiBhbnkpIHsgIC8vIFRPRE86IGNoYW5nZSBldmVyeXRoaW5nIHRvIHNhZmUgc2V0XG4gICAgICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggdG8gcmV0dXJuXG4gICAgaWYgKCF0eCkgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHN0YXRlIGZyb20gcnBjIHR5cGVcbiAgICBpZiAocnBjVHgudHlwZSAhPT0gdW5kZWZpbmVkKSBpc091dGdvaW5nID0gTW9uZXJvV2FsbGV0UnBjLmRlY29kZVJwY1R5cGUocnBjVHgudHlwZSwgdHgpO1xuICAgIGVsc2UgYXNzZXJ0LmVxdWFsKHR5cGVvZiBpc091dGdvaW5nLCBcImJvb2xlYW5cIiwgXCJNdXN0IGluZGljYXRlIGlmIHR4IGlzIG91dGdvaW5nICh0cnVlKSB4b3IgaW5jb21pbmcgKGZhbHNlKSBzaW5jZSB1bmtub3duXCIpO1xuICAgIFxuICAgIC8vIFRPRE86IHNhZmUgc2V0XG4gICAgLy8gaW5pdGlhbGl6ZSByZW1haW5pbmcgZmllbGRzICBUT0RPOiBzZWVtcyB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGNvbW1vbiBmdW5jdGlvbiB3aXRoIERhZW1vblJwYy5jb252ZXJ0UnBjVHhcbiAgICBsZXQgaGVhZGVyO1xuICAgIGxldCB0cmFuc2ZlcjtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVHgpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVHhba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhpZFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlXCIpIHR4LnNldEZlZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm90ZVwiKSB7IGlmICh2YWwpIHR4LnNldE5vdGUodmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2tleVwiKSB0eC5zZXRLZXkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eXBlXCIpIHsgfSAvLyB0eXBlIGFscmVhZHkgaGFuZGxlZFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X3NpemVcIikgdHguc2V0U2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja190aW1lXCIpIHR4LnNldFVubG9ja1RpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRcIikgdHguc2V0V2VpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9ja2VkXCIpIHR4LnNldElzTG9ja2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfYmxvYlwiKSB0eC5zZXRGdWxsSGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfbWV0YWRhdGFcIikgdHguc2V0TWV0YWRhdGEodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkb3VibGVfc3BlbmRfc2VlblwiKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2Vlbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiIHx8IGtleSA9PT0gXCJoZWlnaHRcIikge1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgICBoZWFkZXIuc2V0SGVpZ2h0KHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0aW1lc3RhbXBcIikge1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgICBoZWFkZXIuc2V0VGltZXN0YW1wKHZhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gdGltZXN0YW1wIG9mIHVuY29uZmlybWVkIHR4IGlzIGN1cnJlbnQgcmVxdWVzdCB0aW1lXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjb25maXJtYXRpb25zXCIpIHR4LnNldE51bUNvbmZpcm1hdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWdnZXN0ZWRfY29uZmlybWF0aW9uc190aHJlc2hvbGRcIikge1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIGlmICghaXNPdXRnb2luZykgdHJhbnNmZXIuc2V0TnVtU3VnZ2VzdGVkQ29uZmlybWF0aW9ucyh2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudFwiKSB7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzXCIpIHt9ICAvLyBpZ25vcmluZywgYW1vdW50cyBzdW0gdG8gYW1vdW50XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSB7XG4gICAgICAgIGlmICghaXNPdXRnb2luZykge1xuICAgICAgICAgIGlmICghdHJhbnNmZXIpIHRyYW5zZmVyID0gbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKS5zZXRUeCh0eCk7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGF5bWVudF9pZFwiKSB7XG4gICAgICAgIGlmIChcIlwiICE9PSB2YWwgJiYgTW9uZXJvVHhXYWxsZXQuREVGQVVMVF9QQVlNRU5UX0lEICE9PSB2YWwpIHR4LnNldFBheW1lbnRJZCh2YWwpOyAgLy8gZGVmYXVsdCBpcyB1bmRlZmluZWRcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGV4XCIpIGFzc2VydChycGNUeC5zdWJhZGRyX2luZGljZXMpOyAgLy8gaGFuZGxlZCBieSBzdWJhZGRyX2luZGljZXNcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGljZXNcIikge1xuICAgICAgICBpZiAoIXRyYW5zZmVyKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgbGV0IHJwY0luZGljZXMgPSB2YWw7XG4gICAgICAgIHRyYW5zZmVyLnNldEFjY291bnRJbmRleChycGNJbmRpY2VzWzBdLm1ham9yKTtcbiAgICAgICAgaWYgKGlzT3V0Z29pbmcpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgICBmb3IgKGxldCBycGNJbmRleCBvZiBycGNJbmRpY2VzKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKHJwY0luZGV4Lm1pbm9yKTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kaWNlcyhzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsKHJwY0luZGljZXMubGVuZ3RoLCAxKTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kZXgocnBjSW5kaWNlc1swXS5taW5vcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkZXN0aW5hdGlvbnNcIiB8fCBrZXkgPT0gXCJyZWNpcGllbnRzXCIpIHtcbiAgICAgICAgYXNzZXJ0KGlzT3V0Z29pbmcpO1xuICAgICAgICBsZXQgZGVzdGluYXRpb25zID0gW107XG4gICAgICAgIGZvciAobGV0IHJwY0Rlc3RpbmF0aW9uIG9mIHZhbCkge1xuICAgICAgICAgIGxldCBkZXN0aW5hdGlvbiA9IG5ldyBNb25lcm9EZXN0aW5hdGlvbigpO1xuICAgICAgICAgIGRlc3RpbmF0aW9ucy5wdXNoKGRlc3RpbmF0aW9uKTtcbiAgICAgICAgICBmb3IgKGxldCBkZXN0aW5hdGlvbktleSBvZiBPYmplY3Qua2V5cyhycGNEZXN0aW5hdGlvbikpIHtcbiAgICAgICAgICAgIGlmIChkZXN0aW5hdGlvbktleSA9PT0gXCJhZGRyZXNzXCIpIGRlc3RpbmF0aW9uLnNldEFkZHJlc3MocnBjRGVzdGluYXRpb25bZGVzdGluYXRpb25LZXldKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKGRlc3RpbmF0aW9uS2V5ID09PSBcImFtb3VudFwiKSBkZXN0aW5hdGlvbi5zZXRBbW91bnQoQmlnSW50KHJwY0Rlc3RpbmF0aW9uW2Rlc3RpbmF0aW9uS2V5XSkpO1xuICAgICAgICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNhY3Rpb24gZGVzdGluYXRpb24gZmllbGQ6IFwiICsgZGVzdGluYXRpb25LZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2Zlcih7dHg6IHR4fSk7XG4gICAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhkZXN0aW5hdGlvbnMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNvdXJjZXNcIikge30gLy8gaWdub3JpbmdcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtdWx0aXNpZ190eHNldFwiICYmIHZhbCAhPT0gdW5kZWZpbmVkKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZTsgdGhpcyBtZXRob2Qgb25seSBidWlsZHMgYSB0eCB3YWxsZXRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnNpZ25lZF90eHNldFwiICYmIHZhbCAhPT0gdW5kZWZpbmVkKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZTsgdGhpcyBtZXRob2Qgb25seSBidWlsZHMgYSB0eCB3YWxsZXRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRfaW5cIikgdHguc2V0SW5wdXRTdW0oQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9vdXRcIikgdHguc2V0T3V0cHV0U3VtKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjaGFuZ2VfYWRkcmVzc1wiKSB0eC5zZXRDaGFuZ2VBZGRyZXNzKHZhbCA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY2hhbmdlX2Ftb3VudFwiKSB0eC5zZXRDaGFuZ2VBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImR1bW15X291dHB1dHNcIikgdHguc2V0TnVtRHVtbXlPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZXh0cmFcIikgdHguc2V0RXh0cmFIZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyaW5nX3NpemVcIikgdHguc2V0UmluZ1NpemUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGVudF9rZXlfaW1hZ2VzXCIpIHtcbiAgICAgICAgbGV0IGlucHV0S2V5SW1hZ2VzID0gdmFsLmtleV9pbWFnZXM7XG4gICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUodHguZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHR4LnNldElucHV0cyhbXSk7XG4gICAgICAgIGZvciAobGV0IGlucHV0S2V5SW1hZ2Ugb2YgaW5wdXRLZXlJbWFnZXMpIHtcbiAgICAgICAgICB0eC5nZXRJbnB1dHMoKS5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKS5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UoKS5zZXRIZXgoaW5wdXRLZXlJbWFnZSkpLnNldFR4KHR4KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzX2J5X2Rlc3RcIikge1xuICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKGlzT3V0Z29pbmcpO1xuICAgICAgICBsZXQgYW1vdW50c0J5RGVzdCA9IHZhbC5hbW91bnRzO1xuICAgICAgICBhc3NlcnQuZXF1YWwoY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCwgYW1vdW50c0J5RGVzdC5sZW5ndGgpO1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHR4KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKFtdKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB0cmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKS5wdXNoKG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbaV0uZ2V0QWRkcmVzcygpLCBCaWdJbnQoYW1vdW50c0J5RGVzdFtpXSkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgdHJhbnNhY3Rpb24gZmllbGQgd2l0aCB0cmFuc2ZlcjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBsaW5rIGJsb2NrIGFuZCB0eFxuICAgIGlmIChoZWFkZXIpIHR4LnNldEJsb2NrKG5ldyBNb25lcm9CbG9jayhoZWFkZXIpLnNldFR4cyhbdHhdKSk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBmaW5hbCBmaWVsZHNcbiAgICBpZiAodHJhbnNmZXIpIHtcbiAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpID09PSB1bmRlZmluZWQpIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIGlmICghdHJhbnNmZXIuZ2V0VHgoKS5nZXRJc0NvbmZpcm1lZCgpKSB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgICAgaWYgKGlzT3V0Z29pbmcpIHtcbiAgICAgICAgdHguc2V0SXNPdXRnb2luZyh0cnVlKTtcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSkge1xuICAgICAgICAgIGlmICh0cmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKSkgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldERlc3RpbmF0aW9ucyh1bmRlZmluZWQpOyAvLyBvdmVyd3JpdGUgdG8gYXZvaWQgcmVjb25jaWxlIGVycm9yIFRPRE86IHJlbW92ZSBhZnRlciA+MTguMy4xIHdoZW4gYW1vdW50c19ieV9kZXN0IHN1cHBvcnRlZFxuICAgICAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5tZXJnZSh0cmFuc2Zlcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB0eC5zZXRPdXRnb2luZ1RyYW5zZmVyKHRyYW5zZmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHR4LnNldElzSW5jb21pbmcodHJ1ZSk7XG4gICAgICAgIHR4LnNldEluY29taW5nVHJhbnNmZXJzKFt0cmFuc2Zlcl0pO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyByZXR1cm4gaW5pdGlhbGl6ZWQgdHJhbnNhY3Rpb25cbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4V2l0aE91dHB1dChycGNPdXRwdXQpIHtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4XG4gICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBvdXRwdXRcbiAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCh7dHg6IHR4fSk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY091dHB1dCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNPdXRwdXRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIG91dHB1dC5zZXRBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50XCIpIG91dHB1dC5zZXRJc1NwZW50KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwia2V5X2ltYWdlXCIpIHsgaWYgKFwiXCIgIT09IHZhbCkgb3V0cHV0LnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSh2YWwpKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImdsb2JhbF9pbmRleFwiKSBvdXRwdXQuc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZFwiKSB0eC5zZXRJc0xvY2tlZCghdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmcm96ZW5cIikgb3V0cHV0LnNldElzRnJvemVuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHVia2V5XCIpIG91dHB1dC5zZXRTdGVhbHRoUHVibGljS2V5KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRleFwiKSB7XG4gICAgICAgIG91dHB1dC5zZXRBY2NvdW50SW5kZXgodmFsLm1ham9yKTtcbiAgICAgICAgb3V0cHV0LnNldFN1YmFkZHJlc3NJbmRleCh2YWwubWlub3IpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiKSB0eC5zZXRCbG9jaygobmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KHZhbCkgYXMgTW9uZXJvQmxvY2spLnNldFR4cyhbdHggYXMgTW9uZXJvVHhdKSk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHdpdGggb3V0cHV0XG4gICAgdHguc2V0T3V0cHV0cyhbb3V0cHV0XSk7XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNEZXNjcmliZVRyYW5zZmVyKHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQpIHtcbiAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImRlc2NcIikge1xuICAgICAgICB0eFNldC5zZXRUeHMoW10pO1xuICAgICAgICBmb3IgKGxldCB0eE1hcCBvZiB2YWwpIHtcbiAgICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHR4TWFwLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgIHR4LnNldFR4U2V0KHR4U2V0KTtcbiAgICAgICAgICB0eFNldC5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1bW1hcnlcIikgeyB9IC8vIFRPRE86IHN1cHBvcnQgdHggc2V0IHN1bW1hcnkgZmllbGRzP1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZGVzY2RyaWJlIHRyYW5zZmVyIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlY29kZXMgYSBcInR5cGVcIiBmcm9tIG1vbmVyby13YWxsZXQtcnBjIHRvIGluaXRpYWxpemUgdHlwZSBhbmQgc3RhdGVcbiAgICogZmllbGRzIGluIHRoZSBnaXZlbiB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIFRPRE86IHRoZXNlIHNob3VsZCBiZSBzYWZlIHNldFxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R5cGUgaXMgdGhlIHR5cGUgdG8gZGVjb2RlXG4gICAqIEBwYXJhbSB0eCBpcyB0aGUgdHJhbnNhY3Rpb24gdG8gZGVjb2RlIGtub3duIGZpZWxkcyB0b1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBycGMgdHlwZSBpbmRpY2F0ZXMgb3V0Z29pbmcgeG9yIGluY29taW5nXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGRlY29kZVJwY1R5cGUocnBjVHlwZSwgdHgpIHtcbiAgICBsZXQgaXNPdXRnb2luZztcbiAgICBpZiAocnBjVHlwZSA9PT0gXCJpblwiKSB7XG4gICAgICBpc091dGdvaW5nID0gZmFsc2U7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwib3V0XCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBvb2xcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7ICAvLyBUT0RPOiBidXQgY291bGQgaXQgYmU/XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBlbmRpbmdcIikge1xuICAgICAgaXNPdXRnb2luZyA9IHRydWU7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiYmxvY2tcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeCh0cnVlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiZmFpbGVkXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNmZXIgdHlwZTogXCIgKyBycGNUeXBlKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzT3V0Z29pbmc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNZXJnZXMgYSB0cmFuc2FjdGlvbiBpbnRvIGEgdW5pcXVlIHNldCBvZiB0cmFuc2FjdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhXYWxsZXR9IHR4IC0gdGhlIHRyYW5zYWN0aW9uIHRvIG1lcmdlIGludG8gdGhlIGV4aXN0aW5nIHR4c1xuICAgKiBAcGFyYW0ge09iamVjdH0gdHhNYXAgLSBtYXBzIHR4IGhhc2hlcyB0byB0eHNcbiAgICogQHBhcmFtIHtPYmplY3R9IGJsb2NrTWFwIC0gbWFwcyBibG9jayBoZWlnaHRzIHRvIGJsb2Nrc1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBtZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApIHtcbiAgICBhc3NlcnQodHguZ2V0SGFzaCgpICE9PSB1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIG1lcmdlIHR4XG4gICAgbGV0IGFUeCA9IHR4TWFwW3R4LmdldEhhc2goKV07XG4gICAgaWYgKGFUeCA9PT0gdW5kZWZpbmVkKSB0eE1hcFt0eC5nZXRIYXNoKCldID0gdHg7IC8vIGNhY2hlIG5ldyB0eFxuICAgIGVsc2UgYVR4Lm1lcmdlKHR4KTsgLy8gbWVyZ2Ugd2l0aCBleGlzdGluZyB0eFxuICAgIFxuICAgIC8vIG1lcmdlIHR4J3MgYmxvY2sgaWYgY29uZmlybWVkXG4gICAgaWYgKHR4LmdldEhlaWdodCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBhQmxvY2sgPSBibG9ja01hcFt0eC5nZXRIZWlnaHQoKV07XG4gICAgICBpZiAoYUJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrTWFwW3R4LmdldEhlaWdodCgpXSA9IHR4LmdldEJsb2NrKCk7IC8vIGNhY2hlIG5ldyBibG9ja1xuICAgICAgZWxzZSBhQmxvY2subWVyZ2UodHguZ2V0QmxvY2soKSk7IC8vIG1lcmdlIHdpdGggZXhpc3RpbmcgYmxvY2tcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNhY3Rpb25zIGJ5IHRoZWlyIGhlaWdodC5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29tcGFyZVR4c0J5SGVpZ2h0KHR4MSwgdHgyKSB7XG4gICAgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4Mi5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMDsgLy8gYm90aCB1bmNvbmZpcm1lZFxuICAgIGVsc2UgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMTsgICAvLyB0eDEgaXMgdW5jb25maXJtZWRcbiAgICBlbHNlIGlmICh0eDIuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIC0xOyAgLy8gdHgyIGlzIHVuY29uZmlybWVkXG4gICAgbGV0IGRpZmYgPSB0eDEuZ2V0SGVpZ2h0KCkgLSB0eDIuZ2V0SGVpZ2h0KCk7XG4gICAgaWYgKGRpZmYgIT09IDApIHJldHVybiBkaWZmO1xuICAgIHJldHVybiB0eDEuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4MSkgLSB0eDIuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4Mik7IC8vIHR4cyBhcmUgaW4gdGhlIHNhbWUgYmxvY2sgc28gcmV0YWluIHRoZWlyIG9yaWdpbmFsIG9yZGVyXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNmZXJzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBzdGF0aWMgY29tcGFyZUluY29taW5nVHJhbnNmZXJzKHQxLCB0Mikge1xuICAgIGlmICh0MS5nZXRBY2NvdW50SW5kZXgoKSA8IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gLTE7XG4gICAgZWxzZSBpZiAodDEuZ2V0QWNjb3VudEluZGV4KCkgPT09IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gdDEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSB0Mi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICByZXR1cm4gMTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byBvdXRwdXRzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbXBhcmVPdXRwdXRzKG8xLCBvMikge1xuICAgIFxuICAgIC8vIGNvbXBhcmUgYnkgaGVpZ2h0XG4gICAgbGV0IGhlaWdodENvbXBhcmlzb24gPSBNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KG8xLmdldFR4KCksIG8yLmdldFR4KCkpO1xuICAgIGlmIChoZWlnaHRDb21wYXJpc29uICE9PSAwKSByZXR1cm4gaGVpZ2h0Q29tcGFyaXNvbjtcbiAgICBcbiAgICAvLyBjb21wYXJlIGJ5IGFjY291bnQgaW5kZXgsIHN1YmFkZHJlc3MgaW5kZXgsIG91dHB1dCBpbmRleCwgdGhlbiBrZXkgaW1hZ2UgaGV4XG4gICAgbGV0IGNvbXBhcmUgPSBvMS5nZXRBY2NvdW50SW5kZXgoKSAtIG8yLmdldEFjY291bnRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICBjb21wYXJlID0gbzEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSBvMi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICBpZiAoY29tcGFyZSAhPT0gMCkgcmV0dXJuIGNvbXBhcmU7XG4gICAgY29tcGFyZSA9IG8xLmdldEluZGV4KCkgLSBvMi5nZXRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICByZXR1cm4gbzEuZ2V0S2V5SW1hZ2UoKS5nZXRIZXgoKS5sb2NhbGVDb21wYXJlKG8yLmdldEtleUltYWdlKCkuZ2V0SGV4KCkpO1xuICB9XG59XG5cbi8qKlxuICogUG9sbHMgbW9uZXJvLXdhbGxldC1ycGMgdG8gcHJvdmlkZSBsaXN0ZW5lciBub3RpZmljYXRpb25zLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRQb2xsZXIge1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBpc1BvbGxpbmc6IGJvb2xlYW47XG4gIHByb3RlY3RlZCB3YWxsZXQ6IE1vbmVyb1dhbGxldFJwYztcbiAgcHJvdGVjdGVkIGxvb3BlcjogVGFza0xvb3BlcjtcbiAgcHJvdGVjdGVkIHByZXZMb2NrZWRUeHM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZDb25maXJtZWROb3RpZmljYXRpb25zOiBhbnk7XG4gIHByb3RlY3RlZCB0aHJlYWRQb29sOiBhbnk7XG4gIHByb3RlY3RlZCBudW1Qb2xsaW5nOiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2SGVpZ2h0OiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2QmFsYW5jZXM6IGFueTtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICB0aGlzLndhbGxldCA9IHdhbGxldDtcbiAgICB0aGlzLmxvb3BlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jIGZ1bmN0aW9uKCkgeyBhd2FpdCB0aGF0LnBvbGwoKTsgfSk7XG4gICAgdGhpcy5wcmV2TG9ja2VkVHhzID0gW107XG4gICAgdGhpcy5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zID0gbmV3IFNldCgpOyAvLyB0eCBoYXNoZXMgb2YgcHJldmlvdXMgbm90aWZpY2F0aW9uc1xuICAgIHRoaXMucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMgPSBuZXcgU2V0KCk7IC8vIHR4IGhhc2hlcyBvZiBwcmV2aW91c2x5IGNvbmZpcm1lZCBidXQgbm90IHlldCB1bmxvY2tlZCBub3RpZmljYXRpb25zXG4gICAgdGhpcy50aHJlYWRQb29sID0gbmV3IFRocmVhZFBvb2woMSk7IC8vIHN5bmNocm9uaXplIHBvbGxzXG4gICAgdGhpcy5udW1Qb2xsaW5nID0gMDtcbiAgfVxuICBcbiAgc2V0SXNQb2xsaW5nKGlzUG9sbGluZykge1xuICAgIHRoaXMuaXNQb2xsaW5nID0gaXNQb2xsaW5nO1xuICAgIGlmIChpc1BvbGxpbmcpIHRoaXMubG9vcGVyLnN0YXJ0KHRoaXMud2FsbGV0LmdldFN5bmNQZXJpb2RJbk1zKCkpO1xuICAgIGVsc2UgdGhpcy5sb29wZXIuc3RvcCgpO1xuICB9XG4gIFxuICBzZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpIHtcbiAgICB0aGlzLmxvb3Blci5zZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpO1xuICB9XG4gIFxuICBhc3luYyBwb2xsKCkge1xuXG4gICAgLy8gc2tpcCBpZiBuZXh0IHBvbGwgaXMgcXVldWVkXG4gICAgaWYgKHRoaXMubnVtUG9sbGluZyA+IDEpIHJldHVybjtcbiAgICB0aGlzLm51bVBvbGxpbmcrKztcbiAgICBcbiAgICAvLyBzeW5jaHJvbml6ZSBwb2xsc1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICByZXR1cm4gdGhpcy50aHJlYWRQb29sLnN1Ym1pdChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIFxuICAgICAgICAvLyBza2lwIGlmIHdhbGxldCBpcyBjbG9zZWRcbiAgICAgICAgaWYgKGF3YWl0IHRoYXQud2FsbGV0LmlzQ2xvc2VkKCkpIHtcbiAgICAgICAgICB0aGF0Lm51bVBvbGxpbmctLTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHRha2UgaW5pdGlhbCBzbmFwc2hvdFxuICAgICAgICBpZiAodGhhdC5wcmV2QmFsYW5jZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEhlaWdodCgpO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpKTtcbiAgICAgICAgICB0aGF0LnByZXZCYWxhbmNlcyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBoZWlnaHQgY2hhbmdlc1xuICAgICAgICBsZXQgaGVpZ2h0ID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0SGVpZ2h0KCk7XG4gICAgICAgIGlmICh0aGF0LnByZXZIZWlnaHQgIT09IGhlaWdodCkge1xuICAgICAgICAgIGZvciAobGV0IGkgPSB0aGF0LnByZXZIZWlnaHQ7IGkgPCBoZWlnaHQ7IGkrKykgYXdhaXQgdGhhdC5vbk5ld0Jsb2NrKGkpO1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gZ2V0IGxvY2tlZCB0eHMgZm9yIGNvbXBhcmlzb24gdG8gcHJldmlvdXNcbiAgICAgICAgbGV0IG1pbkhlaWdodCA9IE1hdGgubWF4KDAsIGhlaWdodCAtIDcwKTsgLy8gb25seSBtb25pdG9yIHJlY2VudCB0eHNcbiAgICAgICAgbGV0IGxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEluY2x1ZGVPdXRwdXRzKHRydWUpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbGxlY3QgaGFzaGVzIG9mIHR4cyBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCBub0xvbmdlckxvY2tlZEhhc2hlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBwcmV2TG9ja2VkVHggb2YgdGhhdC5wcmV2TG9ja2VkVHhzKSB7XG4gICAgICAgICAgaWYgKHRoYXQuZ2V0VHgobG9ja2VkVHhzLCBwcmV2TG9ja2VkVHguZ2V0SGFzaCgpKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBub0xvbmdlckxvY2tlZEhhc2hlcy5wdXNoKHByZXZMb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gc2F2ZSBsb2NrZWQgdHhzIGZvciBuZXh0IGNvbXBhcmlzb25cbiAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzID0gbG9ja2VkVHhzO1xuICAgICAgICBcbiAgICAgICAgLy8gZmV0Y2ggdHhzIHdoaWNoIGFyZSBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCB1bmxvY2tlZFR4cyA9IG5vTG9uZ2VyTG9ja2VkSGFzaGVzLmxlbmd0aCA9PT0gMCA/IFtdIDogYXdhaXQgdGhhdC53YWxsZXQuZ2V0VHhzKG5ldyBNb25lcm9UeFF1ZXJ5KCkuc2V0SXNMb2NrZWQoZmFsc2UpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEhhc2hlcyhub0xvbmdlckxvY2tlZEhhc2hlcykuc2V0SW5jbHVkZU91dHB1dHModHJ1ZSkpO1xuICAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIG5ldyB1bmNvbmZpcm1lZCBhbmQgY29uZmlybWVkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgbG9ja2VkVHggb2YgbG9ja2VkVHhzKSB7XG4gICAgICAgICAgbGV0IHNlYXJjaFNldCA9IGxvY2tlZFR4LmdldElzQ29uZmlybWVkKCkgPyB0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zIDogdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zO1xuICAgICAgICAgIGxldCB1bmFubm91bmNlZCA9ICFzZWFyY2hTZXQuaGFzKGxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgc2VhcmNoU2V0LmFkZChsb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIGlmICh1bmFubm91bmNlZCkgYXdhaXQgdGhhdC5ub3RpZnlPdXRwdXRzKGxvY2tlZFR4KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgbmV3IHVubG9ja2VkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgdW5sb2NrZWRUeCBvZiB1bmxvY2tlZFR4cykge1xuICAgICAgICAgIHRoYXQucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucy5kZWxldGUodW5sb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIHRoYXQucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMuZGVsZXRlKHVubG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHModW5sb2NrZWRUeCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIGJhbGFuY2UgY2hhbmdlc1xuICAgICAgICBhd2FpdCB0aGF0LmNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzKCk7XG4gICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgIGlmICh0aGF0LmlzUG9sbGluZykgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBiYWNrZ3JvdW5kIHBvbGwgd2FsbGV0ICdcIiArIGF3YWl0IHRoYXQud2FsbGV0LmdldFBhdGgoKSArIFwiJzogXCIgKyBlcnIubWVzc2FnZSk7IC8vIGlnbm9yZSBlcnJvcnMgZnJvbSBwb2xscyBzdHJhZ2dsaW5nIGFmdGVyIHRoZSB3YWxsZXQgaXMgY2xvc2VkXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkge1xuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlTmV3QmxvY2soaGVpZ2h0KTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIG5vdGlmeU91dHB1dHModHgpIHtcbiAgXG4gICAgLy8gbm90aWZ5IHNwZW50IG91dHB1dHMgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBhbGxvdyBzY3JhcGUgb2YgdHggaW5wdXRzIHNvIHByb3ZpZGluZyBvbmUgaW5wdXQgd2l0aCBvdXRnb2luZyBhbW91bnRcbiAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydCh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KClcbiAgICAgICAgICAuc2V0QW1vdW50KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBbW91bnQoKSArIHR4LmdldEZlZSgpKVxuICAgICAgICAgIC5zZXRBY2NvdW50SW5kZXgodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFjY291bnRJbmRleCgpKVxuICAgICAgICAgIC5zZXRTdWJhZGRyZXNzSW5kZXgodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAxID8gdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldFN1YmFkZHJlc3NJbmRpY2VzKClbMF0gOiB1bmRlZmluZWQpIC8vIGluaXRpYWxpemUgaWYgdHJhbnNmZXIgc291cmNlZCBmcm9tIHNpbmdsZSBzdWJhZGRyZXNzXG4gICAgICAgICAgLnNldFR4KHR4KTtcbiAgICAgIHR4LnNldElucHV0cyhbb3V0cHV0XSk7XG4gICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFNwZW50KG91dHB1dCk7XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSByZWNlaXZlZCBvdXRwdXRzXG4gICAgaWYgKHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR4LmdldE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldE91dHB1dHMoKS5sZW5ndGggPiAwKSB7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogb3V0cHV0cyBvbmx5IHJldHVybmVkIGZvciBjb25maXJtZWQgdHhzXG4gICAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5nZXRPdXRwdXRzKCkpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFJlY2VpdmVkKG91dHB1dCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogbW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgYWxsb3cgc2NyYXBlIG9mIHVuY29uZmlybWVkIHJlY2VpdmVkIG91dHB1dHMgc28gdXNpbmcgaW5jb21pbmcgdHJhbnNmZXIgdmFsdWVzXG4gICAgICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkpIHtcbiAgICAgICAgICBvdXRwdXRzLnB1c2gobmV3IE1vbmVyb091dHB1dFdhbGxldCgpXG4gICAgICAgICAgICAgIC5zZXRBY2NvdW50SW5kZXgodHJhbnNmZXIuZ2V0QWNjb3VudEluZGV4KCkpXG4gICAgICAgICAgICAgIC5zZXRTdWJhZGRyZXNzSW5kZXgodHJhbnNmZXIuZ2V0U3ViYWRkcmVzc0luZGV4KCkpXG4gICAgICAgICAgICAgIC5zZXRBbW91bnQodHJhbnNmZXIuZ2V0QW1vdW50KCkpXG4gICAgICAgICAgICAgIC5zZXRUeCh0eCkpO1xuICAgICAgICB9XG4gICAgICAgIHR4LnNldE91dHB1dHMob3V0cHV0cyk7XG4gICAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5nZXRPdXRwdXRzKCkpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFJlY2VpdmVkKG91dHB1dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBnZXRUeCh0eHMsIHR4SGFzaCkge1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykgaWYgKHR4SGFzaCA9PT0gdHguZ2V0SGFzaCgpKSByZXR1cm4gdHg7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzKCkge1xuICAgIGxldCBiYWxhbmNlcyA9IGF3YWl0IHRoaXMud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgaWYgKGJhbGFuY2VzWzBdICE9PSB0aGlzLnByZXZCYWxhbmNlc1swXSB8fCBiYWxhbmNlc1sxXSAhPT0gdGhpcy5wcmV2QmFsYW5jZXNbMV0pIHtcbiAgICAgIHRoaXMucHJldkJhbGFuY2VzID0gYmFsYW5jZXM7XG4gICAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZChiYWxhbmNlc1swXSwgYmFsYW5jZXNbMV0pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsU0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsYUFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsV0FBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksY0FBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssaUJBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLHVCQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyxZQUFBLEdBQUFSLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUSxrQkFBQSxHQUFBVCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVMsbUJBQUEsR0FBQVYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFVLGNBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFXLGtCQUFBLEdBQUFaLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBWSxZQUFBLEdBQUFiLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBYSx1QkFBQSxHQUFBZCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWMsd0JBQUEsR0FBQWYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFlLGVBQUEsR0FBQWhCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZ0IsMkJBQUEsR0FBQWpCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBaUIsMkJBQUEsR0FBQWxCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBa0IsbUJBQUEsR0FB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