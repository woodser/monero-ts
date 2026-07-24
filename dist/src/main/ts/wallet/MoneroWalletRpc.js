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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiTW9uZXJvV2FsbGV0UnBjIiwiTW9uZXJvV2FsbGV0IiwiREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwiYWRkcmVzc0NhY2hlIiwic3luY1BlcmlvZEluTXMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRTZXJ2ZXIiLCJvcGVuV2FsbGV0IiwicGF0aE9yQ29uZmlnIiwicGFzc3dvcmQiLCJNb25lcm9XYWxsZXRDb25maWciLCJwYXRoIiwiZ2V0UGF0aCIsImdldFJlZ3Rlc3QiLCJzZW5kSnNvblJlcXVlc3QiLCJmaWxlbmFtZSIsImdldFBhc3N3b3JkIiwiY2xlYXIiLCJnZXRDb25uZWN0aW9uTWFuYWdlciIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsImNyZWF0ZVdhbGxldCIsImNvbmZpZ05vcm1hbGl6ZWQiLCJnZXRTZWVkIiwiZ2V0UHJpbWFyeUFkZHJlc3MiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFByaXZhdGVTcGVuZEtleSIsImdldE5ldHdvcmtUeXBlIiwiZ2V0QWNjb3VudExvb2thaGVhZCIsImdldFN1YmFkZHJlc3NMb29rYWhlYWQiLCJzZXRQYXNzd29yZCIsInNldFNlcnZlciIsImdldENvbm5lY3Rpb24iLCJjcmVhdGVXYWxsZXRGcm9tU2VlZCIsImNyZWF0ZVdhbGxldEZyb21LZXlzIiwiY3JlYXRlV2FsbGV0UmFuZG9tIiwiZ2V0U2VlZE9mZnNldCIsImdldFJlc3RvcmVIZWlnaHQiLCJnZXRTYXZlQ3VycmVudCIsImdldExhbmd1YWdlIiwic2V0TGFuZ3VhZ2UiLCJERUZBVUxUX0xBTkdVQUdFIiwicGFyYW1zIiwibGFuZ3VhZ2UiLCJlcnIiLCJoYW5kbGVDcmVhdGVXYWxsZXRFcnJvciIsInNlZWQiLCJzZWVkX29mZnNldCIsImVuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWwiLCJnZXRJc011bHRpc2lnIiwicmVzdG9yZV9oZWlnaHQiLCJhdXRvc2F2ZV9jdXJyZW50Iiwic2V0UmVzdG9yZUhlaWdodCIsImFkZHJlc3MiLCJ2aWV3a2V5Iiwic3BlbmRrZXkiLCJuYW1lIiwibWVzc2FnZSIsInRvTG93ZXJDYXNlIiwiaW5jbHVkZXMiLCJNb25lcm9ScGNFcnJvciIsImdldENvZGUiLCJnZXRScGNNZXRob2QiLCJnZXRScGNQYXJhbXMiLCJpc1ZpZXdPbmx5Iiwia2V5X3R5cGUiLCJlIiwidXJpT3JDb25uZWN0aW9uIiwiaXNUcnVzdGVkIiwic3NsT3B0aW9ucyIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiU3NsT3B0aW9ucyIsImdldFVyaSIsInVzZXJuYW1lIiwiZ2V0VXNlcm5hbWUiLCJ0cnVzdGVkIiwic3NsX3N1cHBvcnQiLCJzc2xfcHJpdmF0ZV9rZXlfcGF0aCIsImdldFByaXZhdGVLZXlQYXRoIiwic3NsX2NlcnRpZmljYXRlX3BhdGgiLCJnZXRDZXJ0aWZpY2F0ZVBhdGgiLCJzc2xfY2FfZmlsZSIsImdldENlcnRpZmljYXRlQXV0aG9yaXR5RmlsZSIsInNzbF9hbGxvd2VkX2ZpbmdlcnByaW50cyIsImdldEFsbG93ZWRGaW5nZXJwcmludHMiLCJzc2xfYWxsb3dfYW55X2NlcnQiLCJnZXRBbGxvd0FueUNlcnQiLCJnZXRQcm94eVVyaSIsInN0YXJ0dXBQcm94eVVyaSIsInByb3h5IiwiZGFlbW9uQ29ubmVjdGlvbiIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJnZXRCYWxhbmNlcyIsImFjY291bnRJZHgiLCJzdWJhZGRyZXNzSWR4IiwiYXNzZXJ0IiwiZXF1YWwiLCJiYWxhbmNlIiwiQmlnSW50IiwidW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudCIsImdldEFjY291bnRzIiwiZ2V0QmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsImFjY291bnRfaW5kZXgiLCJhZGRyZXNzX2luZGljZXMiLCJyZXNwIiwicmVzdWx0IiwidW5sb2NrZWRfYmFsYW5jZSIsInBlcl9zdWJhZGRyZXNzIiwiYWRkTGlzdGVuZXIiLCJyZWZyZXNoTGlzdGVuaW5nIiwiaXNDb25uZWN0ZWRUb0RhZW1vbiIsImNoZWNrUmVzZXJ2ZVByb29mIiwiaW5kZXhPZiIsImdldFZlcnNpb24iLCJNb25lcm9WZXJzaW9uIiwidmVyc2lvbiIsInJlbGVhc2UiLCJnZXRTZWVkTGFuZ3VhZ2UiLCJnZXRTZWVkTGFuZ3VhZ2VzIiwibGFuZ3VhZ2VzIiwiZ2V0QWRkcmVzcyIsInN1YmFkZHJlc3NNYXAiLCJnZXRTdWJhZGRyZXNzZXMiLCJnZXRBZGRyZXNzSW5kZXgiLCJzdWJhZGRyZXNzIiwiTW9uZXJvU3ViYWRkcmVzcyIsInNldEFjY291bnRJbmRleCIsImluZGV4IiwibWFqb3IiLCJzZXRJbmRleCIsIm1pbm9yIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJpbnRlZ3JhdGVkQWRkcmVzc1N0ciIsInN0YW5kYXJkX2FkZHJlc3MiLCJwYXltZW50X2lkIiwiaW50ZWdyYXRlZF9hZGRyZXNzIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbnRlZ3JhdGVkQWRkcmVzcyIsIk1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwic2V0U3RhbmRhcmRBZGRyZXNzIiwic2V0UGF5bWVudElkIiwic2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJnZXRIZWlnaHQiLCJoZWlnaHQiLCJnZXREYWVtb25IZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJzeW5jIiwibGlzdGVuZXJPclN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJNb25lcm9XYWxsZXRMaXN0ZW5lciIsInN0YXJ0X2hlaWdodCIsInBvbGwiLCJNb25lcm9TeW5jUmVzdWx0IiwiYmxvY2tzX2ZldGNoZWQiLCJyZWNlaXZlZF9tb25leSIsInN0YXJ0U3luY2luZyIsInN5bmNQZXJpb2RJblNlY29uZHMiLCJNYXRoIiwicm91bmQiLCJlbmFibGUiLCJwZXJpb2QiLCJ3YWxsZXRQb2xsZXIiLCJzZXRQZXJpb2RJbk1zIiwiZ2V0U3luY1BlcmlvZEluTXMiLCJzdG9wU3luY2luZyIsInNjYW5UeHMiLCJ0eEhhc2hlcyIsImxlbmd0aCIsInR4aWRzIiwicmVzY2FuU3BlbnQiLCJyZXNjYW5CbG9ja2NoYWluIiwiaW5jbHVkZVN1YmFkZHJlc3NlcyIsInRhZyIsInNraXBCYWxhbmNlcyIsImFjY291bnRzIiwicnBjQWNjb3VudCIsInN1YmFkZHJlc3NfYWNjb3VudHMiLCJjb252ZXJ0UnBjQWNjb3VudCIsInNldFN1YmFkZHJlc3NlcyIsImdldEluZGV4IiwicHVzaCIsInNldEJhbGFuY2UiLCJzZXRVbmxvY2tlZEJhbGFuY2UiLCJzZXROdW1VbnNwZW50T3V0cHV0cyIsInNldE51bUJsb2Nrc1RvVW5sb2NrIiwiYWxsX2FjY291bnRzIiwicnBjU3ViYWRkcmVzcyIsImNvbnZlcnRScGNTdWJhZGRyZXNzIiwiZ2V0QWNjb3VudEluZGV4IiwidGd0U3ViYWRkcmVzcyIsImdldE51bVVuc3BlbnRPdXRwdXRzIiwiZ2V0QWNjb3VudCIsIkVycm9yIiwiY3JlYXRlQWNjb3VudCIsImxhYmVsIiwiTW9uZXJvQWNjb3VudCIsInByaW1hcnlBZGRyZXNzIiwic3ViYWRkcmVzc0luZGljZXMiLCJhZGRyZXNzX2luZGV4IiwibGlzdGlmeSIsInN1YmFkZHJlc3NlcyIsImFkZHJlc3NlcyIsImdldE51bUJsb2Nrc1RvVW5sb2NrIiwiZ2V0U3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJzZXRBZGRyZXNzIiwic2V0TGFiZWwiLCJzZXRJc1VzZWQiLCJzZXRTdWJhZGRyZXNzTGFiZWwiLCJnZXRUeHMiLCJxdWVyeSIsInF1ZXJ5Tm9ybWFsaXplZCIsIm5vcm1hbGl6ZVR4UXVlcnkiLCJ0cmFuc2ZlclF1ZXJ5IiwiZ2V0VHJhbnNmZXJRdWVyeSIsImlucHV0UXVlcnkiLCJnZXRJbnB1dFF1ZXJ5Iiwib3V0cHV0UXVlcnkiLCJnZXRPdXRwdXRRdWVyeSIsInNldFRyYW5zZmVyUXVlcnkiLCJzZXRJbnB1dFF1ZXJ5Iiwic2V0T3V0cHV0UXVlcnkiLCJ0cmFuc2ZlcnMiLCJnZXRUcmFuc2ZlcnNBdXgiLCJNb25lcm9UcmFuc2ZlclF1ZXJ5Iiwic2V0VHhRdWVyeSIsImRlY29udGV4dHVhbGl6ZSIsImNvcHkiLCJ0eHMiLCJ0eHNTZXQiLCJTZXQiLCJ0cmFuc2ZlciIsImdldFR4IiwiYWRkIiwidHhNYXAiLCJibG9ja01hcCIsInR4IiwibWVyZ2VUeCIsImdldEluY2x1ZGVPdXRwdXRzIiwib3V0cHV0UXVlcnlBdXgiLCJNb25lcm9PdXRwdXRRdWVyeSIsIm91dHB1dHMiLCJnZXRPdXRwdXRzQXV4Iiwib3V0cHV0VHhzIiwib3V0cHV0IiwidHhzUXVlcmllZCIsIm1lZXRzQ3JpdGVyaWEiLCJnZXRCbG9jayIsInNwbGljZSIsImdldElzQ29uZmlybWVkIiwiY29uc29sZSIsImVycm9yIiwiZ2V0SGFzaGVzIiwidHhzQnlJZCIsIk1hcCIsImdldEhhc2giLCJvcmRlcmVkVHhzIiwiaGFzaCIsImdldFRyYW5zZmVycyIsIm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkiLCJpc0NvbnRleHR1YWwiLCJnZXRUeFF1ZXJ5IiwiZmlsdGVyVHJhbnNmZXJzIiwiZ2V0T3V0cHV0cyIsIm5vcm1hbGl6ZU91dHB1dFF1ZXJ5IiwiZmlsdGVyT3V0cHV0cyIsImV4cG9ydE91dHB1dHMiLCJhbGwiLCJvdXRwdXRzX2RhdGFfaGV4IiwiaW1wb3J0T3V0cHV0cyIsIm91dHB1dHNIZXgiLCJudW1faW1wb3J0ZWQiLCJleHBvcnRLZXlJbWFnZXMiLCJycGNFeHBvcnRLZXlJbWFnZXMiLCJpbXBvcnRLZXlJbWFnZXMiLCJrZXlJbWFnZXMiLCJycGNLZXlJbWFnZXMiLCJtYXAiLCJrZXlJbWFnZSIsImtleV9pbWFnZSIsImdldEhleCIsInNpZ25hdHVyZSIsImdldFNpZ25hdHVyZSIsInNpZ25lZF9rZXlfaW1hZ2VzIiwiaW1wb3J0UmVzdWx0IiwiTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJzZXRIZWlnaHQiLCJzZXRTcGVudEFtb3VudCIsInNwZW50Iiwic2V0VW5zcGVudEFtb3VudCIsInVuc3BlbnQiLCJnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCIsImZyZWV6ZU91dHB1dCIsInRoYXdPdXRwdXQiLCJpc091dHB1dEZyb3plbiIsImZyb3plbiIsImdldERlZmF1bHRGZWVQcmlvcml0eSIsInByaW9yaXR5IiwiY3JlYXRlVHhzIiwibm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnIiwiZ2V0Q2FuU3BsaXQiLCJzZXRDYW5TcGxpdCIsImdldFJlbGF5IiwiaXNNdWx0aXNpZyIsImdldFN1YmFkZHJlc3NJbmRpY2VzIiwic2xpY2UiLCJkZXN0aW5hdGlvbnMiLCJkZXN0aW5hdGlvbiIsImdldERlc3RpbmF0aW9ucyIsImdldEFtb3VudCIsImFtb3VudCIsInRvU3RyaW5nIiwiZ2V0U3VidHJhY3RGZWVGcm9tIiwic3VidHJhY3RfZmVlX2Zyb21fb3V0cHV0cyIsInN1YmFkZHJfaW5kaWNlcyIsImdldFBheW1lbnRJZCIsImRvX25vdF9yZWxheSIsImdldFByaW9yaXR5IiwiZ2V0X3R4X2hleCIsImdldF90eF9tZXRhZGF0YSIsImdldF90eF9rZXlzIiwiZ2V0X3R4X2tleSIsIm51bVR4cyIsImZlZV9saXN0IiwiZmVlIiwiY29weURlc3RpbmF0aW9ucyIsImkiLCJNb25lcm9UeFdhbGxldCIsImluaXRTZW50VHhXYWxsZXQiLCJnZXRPdXRnb2luZ1RyYW5zZmVyIiwic2V0U3ViYWRkcmVzc0luZGljZXMiLCJjb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQiLCJjb252ZXJ0UnBjVHhUb1R4U2V0Iiwic3dlZXBPdXRwdXQiLCJub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyIsImdldEtleUltYWdlIiwic2V0QW1vdW50Iiwic3dlZXBVbmxvY2tlZCIsIm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWciLCJpbmRpY2VzIiwia2V5cyIsInNldFN3ZWVwRWFjaFN1YmFkZHJlc3MiLCJnZXRTd2VlcEVhY2hTdWJhZGRyZXNzIiwicnBjU3dlZXBBY2NvdW50Iiwic3dlZXBEdXN0IiwicmVsYXkiLCJ0eFNldCIsInNldElzUmVsYXllZCIsInNldEluVHhQb29sIiwiZ2V0SXNSZWxheWVkIiwicmVsYXlUeHMiLCJ0eHNPck1ldGFkYXRhcyIsIkFycmF5IiwiaXNBcnJheSIsInR4T3JNZXRhZGF0YSIsIm1ldGFkYXRhIiwiZ2V0TWV0YWRhdGEiLCJoZXgiLCJ0eF9oYXNoIiwiZGVzY3JpYmVUeFNldCIsInVuc2lnbmVkX3R4c2V0IiwiZ2V0VW5zaWduZWRUeEhleCIsIm11bHRpc2lnX3R4c2V0IiwiZ2V0TXVsdGlzaWdUeEhleCIsImNvbnZlcnRScGNEZXNjcmliZVRyYW5zZmVyIiwic2lnblR4cyIsInVuc2lnbmVkVHhIZXgiLCJleHBvcnRfcmF3Iiwic3VibWl0VHhzIiwic2lnbmVkVHhIZXgiLCJ0eF9kYXRhX2hleCIsInR4X2hhc2hfbGlzdCIsInNpZ25NZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiU0lHTl9XSVRIX1NQRU5EX0tFWSIsImRhdGEiLCJzaWduYXR1cmVfdHlwZSIsInZlcmlmeU1lc3NhZ2UiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiZ29vZCIsImlzR29vZCIsImlzT2xkIiwib2xkIiwiU0lHTl9XSVRIX1ZJRVdfS0VZIiwiZ2V0VHhLZXkiLCJ0eEhhc2giLCJ0eGlkIiwidHhfa2V5IiwiY2hlY2tUeEtleSIsInR4S2V5IiwiY2hlY2siLCJNb25lcm9DaGVja1R4Iiwic2V0SXNHb29kIiwic2V0TnVtQ29uZmlybWF0aW9ucyIsImNvbmZpcm1hdGlvbnMiLCJpbl9wb29sIiwic2V0UmVjZWl2ZWRBbW91bnQiLCJyZWNlaXZlZCIsImdldFR4UHJvb2YiLCJjaGVja1R4UHJvb2YiLCJnZXRTcGVuZFByb29mIiwiY2hlY2tTcGVuZFByb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsIk1vbmVyb0NoZWNrUmVzZXJ2ZSIsInNldFVuY29uZmlybWVkU3BlbnRBbW91bnQiLCJzZXRUb3RhbEFtb3VudCIsInRvdGFsIiwiZ2V0VHhOb3RlcyIsIm5vdGVzIiwic2V0VHhOb3RlcyIsImdldEFkZHJlc3NCb29rRW50cmllcyIsImVudHJ5SW5kaWNlcyIsImVudHJpZXMiLCJycGNFbnRyeSIsIk1vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJzZXREZXNjcmlwdGlvbiIsImRlc2NyaXB0aW9uIiwiYWRkQWRkcmVzc0Jvb2tFbnRyeSIsImVkaXRBZGRyZXNzQm9va0VudHJ5Iiwic2V0X2FkZHJlc3MiLCJzZXRfZGVzY3JpcHRpb24iLCJkZWxldGVBZGRyZXNzQm9va0VudHJ5IiwiZW50cnlJZHgiLCJ0YWdBY2NvdW50cyIsImFjY291bnRJbmRpY2VzIiwidW50YWdBY2NvdW50cyIsImdldEFjY291bnRUYWdzIiwidGFncyIsImFjY291bnRfdGFncyIsInJwY0FjY291bnRUYWciLCJNb25lcm9BY2NvdW50VGFnIiwic2V0QWNjb3VudFRhZ0xhYmVsIiwiZ2V0UGF5bWVudFVyaSIsInJlY2lwaWVudF9uYW1lIiwiZ2V0UmVjaXBpZW50TmFtZSIsInR4X2Rlc2NyaXB0aW9uIiwiZ2V0Tm90ZSIsInVyaSIsInBhcnNlUGF5bWVudFVyaSIsIk1vbmVyb1R4Q29uZmlnIiwic2V0UmVjaXBpZW50TmFtZSIsInNldE5vdGUiLCJnZXRBdHRyaWJ1dGUiLCJ2YWx1ZSIsInNldEF0dHJpYnV0ZSIsInZhbCIsInN0YXJ0TWluaW5nIiwibnVtVGhyZWFkcyIsImJhY2tncm91bmRNaW5pbmciLCJpZ25vcmVCYXR0ZXJ5IiwidGhyZWFkc19jb3VudCIsImRvX2JhY2tncm91bmRfbWluaW5nIiwiaWdub3JlX2JhdHRlcnkiLCJzdG9wTWluaW5nIiwiaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCIsIm11bHRpc2lnX2ltcG9ydF9uZWVkZWQiLCJnZXRNdWx0aXNpZ0luZm8iLCJpbmZvIiwiTW9uZXJvTXVsdGlzaWdJbmZvIiwic2V0SXNNdWx0aXNpZyIsIm11bHRpc2lnIiwic2V0SXNSZWFkeSIsInJlYWR5Iiwic2V0VGhyZXNob2xkIiwidGhyZXNob2xkIiwic2V0TnVtUGFydGljaXBhbnRzIiwicHJlcGFyZU11bHRpc2lnIiwibXVsdGlzaWdfaW5mbyIsIm1ha2VNdWx0aXNpZyIsIm11bHRpc2lnSGV4ZXMiLCJleGNoYW5nZU11bHRpc2lnS2V5cyIsIm1zUmVzdWx0IiwiTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0Iiwic2V0TXVsdGlzaWdIZXgiLCJnZXRNdWx0aXNpZ0hleCIsImV4cG9ydE11bHRpc2lnSGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJyZWZyZXNoQWZ0ZXJJbXBvcnQiLCJyZWZyZXNoX2FmdGVyX2ltcG9ydCIsIm5fb3V0cHV0cyIsInNpZ25NdWx0aXNpZ1R4SGV4IiwibXVsdGlzaWdUeEhleCIsInNpZ25SZXN1bHQiLCJNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJzZXRTaWduZWRNdWx0aXNpZ1R4SGV4Iiwic2V0VHhIYXNoZXMiLCJzdWJtaXRNdWx0aXNpZ1R4SGV4Iiwic2lnbmVkTXVsdGlzaWdUeEhleCIsImNoYW5nZVBhc3N3b3JkIiwib2xkUGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsIm9sZF9wYXNzd29yZCIsIm5ld19wYXNzd29yZCIsInNhdmUiLCJjbG9zZSIsImlzQ2xvc2VkIiwic3RvcCIsImdldEluY29taW5nVHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlcnMiLCJjcmVhdGVUeCIsInJlbGF5VHgiLCJnZXRUeE5vdGUiLCJzZXRUeE5vdGUiLCJub3RlIiwiY29ubmVjdFRvV2FsbGV0UnBjIiwidXJpT3JDb25maWciLCJub3JtYWxpemVDb25maWciLCJjbWQiLCJzdGFydFdhbGxldFJwY1Byb2Nlc3MiLCJjaGlsZF9wcm9jZXNzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aGVuIiwiY2hpbGRQcm9jZXNzIiwic3Bhd24iLCJlbnYiLCJMQU5HIiwic3Rkb3V0Iiwic2V0RW5jb2RpbmciLCJzdGRlcnIiLCJ0aGF0IiwicmVqZWN0Iiwib24iLCJsaW5lIiwiTGlicmFyeVV0aWxzIiwibG9nIiwidXJpTGluZUNvbnRhaW5zIiwidXJpTGluZUNvbnRhaW5zSWR4IiwiaG9zdCIsInN1YnN0cmluZyIsImxhc3RJbmRleE9mIiwidW5mb3JtYXR0ZWRMaW5lIiwicmVwbGFjZSIsInRyaW0iLCJwb3J0Iiwic3NsSWR4Iiwic3NsRW5hYmxlZCIsInVzZXJQYXNzSWR4IiwidXNlclBhc3MiLCJ6bXFVcmlJZHgiLCJ6bXFVcmkiLCJwcm94eVVyaUlkeCIsInByb3h5VXJpIiwicmVqZWN0VW5hdXRob3JpemVkIiwiZ2V0UmVqZWN0VW5hdXRob3JpemVkIiwid2FsbGV0IiwiaXNSZXNvbHZlZCIsImdldExvZ0xldmVsIiwiY29kZSIsIm9yaWdpbiIsImdldEFjY291bnRJbmRpY2VzIiwidHhRdWVyeSIsImNhbkJlQ29uZmlybWVkIiwiZ2V0SW5UeFBvb2wiLCJnZXRJc0ZhaWxlZCIsImNhbkJlSW5UeFBvb2wiLCJnZXRNYXhIZWlnaHQiLCJnZXRJc0xvY2tlZCIsImNhbkJlSW5jb21pbmciLCJnZXRJc0luY29taW5nIiwiZ2V0SXNPdXRnb2luZyIsImdldEhhc0Rlc3RpbmF0aW9ucyIsImNhbkJlT3V0Z29pbmciLCJpbiIsIm91dCIsInBvb2wiLCJwZW5kaW5nIiwiZmFpbGVkIiwiZ2V0TWluSGVpZ2h0IiwibWluX2hlaWdodCIsIm1heF9oZWlnaHQiLCJmaWx0ZXJfYnlfaGVpZ2h0IiwiZ2V0U3ViYWRkcmVzc0luZGV4Iiwic2l6ZSIsImZyb20iLCJycGNUeCIsImNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlciIsImdldE91dGdvaW5nQW1vdW50Iiwib3V0Z29pbmdUcmFuc2ZlciIsInRyYW5zZmVyVG90YWwiLCJ2YWx1ZXMiLCJzb3J0IiwiY29tcGFyZVR4c0J5SGVpZ2h0Iiwic2V0SXNJbmNvbWluZyIsInNldElzT3V0Z29pbmciLCJjb21wYXJlSW5jb21pbmdUcmFuc2ZlcnMiLCJ0cmFuc2Zlcl90eXBlIiwiZ2V0SXNTcGVudCIsInZlcmJvc2UiLCJycGNPdXRwdXQiLCJjb252ZXJ0UnBjVHhXaXRoT3V0cHV0IiwiY29tcGFyZU91dHB1dHMiLCJycGNJbWFnZSIsIk1vbmVyb0tleUltYWdlIiwiYmVsb3dfYW1vdW50IiwiZ2V0QmVsb3dBbW91bnQiLCJzZXRJc0xvY2tlZCIsInNldElzQ29uZmlybWVkIiwic2V0UmVsYXkiLCJzZXRJc01pbmVyVHgiLCJzZXRJc0ZhaWxlZCIsIk1vbmVyb0Rlc3RpbmF0aW9uIiwic2V0RGVzdGluYXRpb25zIiwic2V0T3V0Z29pbmdUcmFuc2ZlciIsImdldFVubG9ja1RpbWUiLCJzZXRVbmxvY2tUaW1lIiwiZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJzZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsIkRhdGUiLCJnZXRUaW1lIiwiZ2V0SXNEb3VibGVTcGVuZFNlZW4iLCJzZXRJc0RvdWJsZVNwZW5kU2VlbiIsImxpc3RlbmVycyIsIldhbGxldFBvbGxlciIsInNldElzUG9sbGluZyIsImlzUG9sbGluZyIsInNlcnZlciIsInByb3h5VG9Xb3JrZXIiLCJzZXRQcmltYXJ5QWRkcmVzcyIsInNldFRhZyIsImdldFRhZyIsInNldFJpbmdTaXplIiwiTW9uZXJvVXRpbHMiLCJSSU5HX1NJWkUiLCJNb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwic2V0VHgiLCJkZXN0Q29waWVzIiwiZGVzdCIsImNvbnZlcnRScGNUeFNldCIsInJwY01hcCIsIk1vbmVyb1R4U2V0Iiwic2V0TXVsdGlzaWdUeEhleCIsInNldFVuc2lnbmVkVHhIZXgiLCJzZXRTaWduZWRUeEhleCIsInNpZ25lZF90eHNldCIsImdldFNpZ25lZFR4SGV4IiwicnBjVHhzIiwic2V0VHhzIiwic2V0VHhTZXQiLCJzZXRIYXNoIiwic2V0S2V5Iiwic2V0RnVsbEhleCIsInNldE1ldGFkYXRhIiwic2V0RmVlIiwic2V0V2VpZ2h0IiwiaW5wdXRLZXlJbWFnZXNMaXN0IiwiYXNzZXJ0VHJ1ZSIsImdldElucHV0cyIsInNldElucHV0cyIsImlucHV0S2V5SW1hZ2UiLCJNb25lcm9PdXRwdXRXYWxsZXQiLCJzZXRLZXlJbWFnZSIsInNldEhleCIsImFtb3VudHNCeURlc3RMaXN0IiwiZGVzdGluYXRpb25JZHgiLCJ0eElkeCIsImFtb3VudHNCeURlc3QiLCJpc091dGdvaW5nIiwidHlwZSIsImRlY29kZVJwY1R5cGUiLCJoZWFkZXIiLCJzZXRTaXplIiwiTW9uZXJvQmxvY2tIZWFkZXIiLCJzZXRUaW1lc3RhbXAiLCJNb25lcm9JbmNvbWluZ1RyYW5zZmVyIiwic2V0TnVtU3VnZ2VzdGVkQ29uZmlybWF0aW9ucyIsIkRFRkFVTFRfUEFZTUVOVF9JRCIsInJwY0luZGljZXMiLCJycGNJbmRleCIsInNldFN1YmFkZHJlc3NJbmRleCIsInJwY0Rlc3RpbmF0aW9uIiwiZGVzdGluYXRpb25LZXkiLCJzZXRJbnB1dFN1bSIsInNldE91dHB1dFN1bSIsInNldENoYW5nZUFkZHJlc3MiLCJzZXRDaGFuZ2VBbW91bnQiLCJzZXROdW1EdW1teU91dHB1dHMiLCJzZXRFeHRyYUhleCIsImlucHV0S2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsImFtb3VudHMiLCJzZXRCbG9jayIsIk1vbmVyb0Jsb2NrIiwibWVyZ2UiLCJzZXRJbmNvbWluZ1RyYW5zZmVycyIsInNldElzU3BlbnQiLCJzZXRJc0Zyb3plbiIsInNldFN0ZWFsdGhQdWJsaWNLZXkiLCJzZXRPdXRwdXRzIiwicnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdCIsInJwY1R5cGUiLCJhVHgiLCJhQmxvY2siLCJ0eDEiLCJ0eDIiLCJkaWZmIiwidDEiLCJ0MiIsIm8xIiwibzIiLCJoZWlnaHRDb21wYXJpc29uIiwiY29tcGFyZSIsImxvY2FsZUNvbXBhcmUiLCJleHBvcnRzIiwibG9vcGVyIiwiVGFza0xvb3BlciIsInByZXZMb2NrZWRUeHMiLCJwcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zIiwicHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMiLCJ0aHJlYWRQb29sIiwiVGhyZWFkUG9vbCIsIm51bVBvbGxpbmciLCJzdGFydCIsInBlcmlvZEluTXMiLCJzdWJtaXQiLCJwcmV2QmFsYW5jZXMiLCJwcmV2SGVpZ2h0IiwiTW9uZXJvVHhRdWVyeSIsIm9uTmV3QmxvY2siLCJtaW5IZWlnaHQiLCJtYXgiLCJsb2NrZWRUeHMiLCJzZXRNaW5IZWlnaHQiLCJzZXRJbmNsdWRlT3V0cHV0cyIsIm5vTG9uZ2VyTG9ja2VkSGFzaGVzIiwicHJldkxvY2tlZFR4IiwidW5sb2NrZWRUeHMiLCJzZXRIYXNoZXMiLCJsb2NrZWRUeCIsInNlYXJjaFNldCIsInVuYW5ub3VuY2VkIiwibm90aWZ5T3V0cHV0cyIsInVubG9ja2VkVHgiLCJkZWxldGUiLCJjaGVja0ZvckNoYW5nZWRCYWxhbmNlcyIsImFubm91bmNlTmV3QmxvY2siLCJnZXRGZWUiLCJhbm5vdW5jZU91dHB1dFNwZW50IiwiYW5ub3VuY2VPdXRwdXRSZWNlaXZlZCIsImJhbGFuY2VzIiwiYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0UnBjLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuLi9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBUYXNrTG9vcGVyIGZyb20gXCIuLi9jb21tb24vVGFza0xvb3BlclwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnRUYWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFRhZ1wiO1xuaW1wb3J0IE1vbmVyb0FkZHJlc3NCb29rRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9CbG9ja0hlYWRlciBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrSGVhZGVyXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tSZXNlcnZlIGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrUmVzZXJ2ZVwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrVHggZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tUeFwiO1xuaW1wb3J0IE1vbmVyb0Rlc3RpbmF0aW9uIGZyb20gXCIuL21vZGVsL01vbmVyb0Rlc3RpbmF0aW9uXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0luY29taW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW5jb21pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5mb1wiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luaXRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0UXVlcnlcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9ScGNFcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvU3ViYWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJhZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvU3luY1Jlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TeW5jUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlclF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyUXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFByaW9yaXR5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UHJpb3JpdHlcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1R4V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0IGZyb20gXCIuL01vbmVyb1dhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRDb25maWdcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0XCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi4vY29tbW9uL1RocmVhZFBvb2xcIjtcbmltcG9ydCBTc2xPcHRpb25zIGZyb20gXCIuLi9jb21tb24vU3NsT3B0aW9uc1wiO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIHdvb2RzZXJcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb1dhbGxldCBhcyBhIGNsaWVudCBvZiBtb25lcm8td2FsbGV0LXJwYy5cbiAqIFxuICogQGltcGxlbWVudHMge01vbmVyb1dhbGxldH1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvV2FsbGV0UnBjIGV4dGVuZHMgTW9uZXJvV2FsbGV0IHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA9IDIwMDAwOyAvLyBkZWZhdWx0IHBlcmlvZCBiZXR3ZWVuIHN5bmNzIGluIG1zIChkZWZpbmVkIGJ5IERFRkFVTFRfQVVUT19SRUZSRVNIX1BFUklPRCBpbiB3YWxsZXRfcnBjX3NlcnZlci5jcHApXG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPjtcbiAgcHJvdGVjdGVkIGFkZHJlc3NDYWNoZTogYW55O1xuICBwcm90ZWN0ZWQgc3luY1BlcmlvZEluTXM6IG51bWJlcjtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXTtcbiAgcHJvdGVjdGVkIHByb2Nlc3M6IGFueTtcbiAgcHJvdGVjdGVkIHBhdGg6IHN0cmluZztcbiAgcHJvdGVjdGVkIGRhZW1vbkNvbm5lY3Rpb246IE1vbmVyb1JwY0Nvbm5lY3Rpb247XG4gIHByb3RlY3RlZCB3YWxsZXRQb2xsZXI6IFdhbGxldFBvbGxlcjtcbiAgcHJvdGVjdGVkIHN0YXJ0dXBQcm94eVVyaTogc3RyaW5nO1xuICBcbiAgLyoqIEBwcml2YXRlICovXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9OyAvLyBhdm9pZCB1bmVjZXNzYXJ5IHJlcXVlc3RzIGZvciBhZGRyZXNzZXNcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gTW9uZXJvV2FsbGV0UnBjLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVM7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBSUEMgV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtDaGlsZFByb2Nlc3N9IHRoZSBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMsIHVuZGVmaW5lZCBpZiBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXG4gICAqL1xuICBnZXRQcm9jZXNzKCk6IENoaWxkUHJvY2VzcyB7XG4gICAgcmV0dXJuIHRoaXMucHJvY2VzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3AgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm8td2FsbGV0LXJwYywgaWYgYXBwbGljYWJsZS5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2Ugc3BlY2lmaWVzIGlmIHRoZSBwcm9jZXNzIHNob3VsZCBiZSBkZXN0cm95ZWQgZm9yY2libHkgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPn0gdGhlIGV4aXQgY29kZSBmcm9tIHN0b3BwaW5nIHRoZSBwcm9jZXNzXG4gICAqL1xuICBhc3luYyBzdG9wUHJvY2Vzcyhmb3JjZSA9IGZhbHNlKTogUHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+ICB7XG4gICAgaWYgKHRoaXMucHJvY2VzcyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMgaW5zdGFuY2Ugbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1wiKTtcbiAgICBsZXQgbGlzdGVuZXJzQ29weSA9IEdlblV0aWxzLmNvcHlBcnJheSh0aGlzLmdldExpc3RlbmVycygpKTtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnNDb3B5KSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gR2VuVXRpbHMua2lsbFByb2Nlc3ModGhpcy5wcm9jZXNzLCBmb3JjZSA/IFwiU0lHS0lMTFwiIDogdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgUlBDIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9uIHwgdW5kZWZpbmVkfSB0aGUgd2FsbGV0J3MgcnBjIGNvbm5lY3Rpb25cbiAgICovXG4gIGdldFJwY0Nvbm5lY3Rpb24oKTogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+T3BlbiBhbiBleGlzdGluZyB3YWxsZXQgb24gdGhlIG1vbmVyby13YWxsZXQtcnBjIHNlcnZlci48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlOjxwPlxuICAgKiBcbiAgICogPGNvZGU+XG4gICAqIGxldCB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0UnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4NFwiLCBcInJwY191c2VyXCIsIFwiYWJjMTIzXCIpOzxicj5cbiAgICogYXdhaXQgd2FsbGV0Lm9wZW5XYWxsZXQoXCJteXdhbGxldDFcIiwgXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIpOzxicj5cbiAgICogPGJyPlxuICAgKiBhd2FpdCB3YWxsZXQub3BlbldhbGxldCh7PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGF0aDogXCJteXdhbGxldDJcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VydmVyOiBcImh0dHA6Ly9sb2NhaG9zdDozODA4MVwiLCAvLyBvciBvYmplY3Qgd2l0aCB1cmksIHVzZXJuYW1lLCBwYXNzd29yZCwgZXRjIDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2U8YnI+XG4gICAqIH0pOzxicj5cbiAgICogPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvV2FsbGV0Q29uZmlnfSBwYXRoT3JDb25maWcgIC0gdGhlIHdhbGxldCdzIG5hbWUgb3IgY29uZmlndXJhdGlvbiB0byBvcGVuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoT3JDb25maWcucGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCBpbi1tZW1vcnkgd2FsbGV0IGlmIG5vdCBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhPckNvbmZpZy5wYXNzd29yZCAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IHBhdGhPckNvbmZpZy5zZXJ2ZXIgLSB1cmkgb3IgTW9uZXJvUnBjQ29ubmVjdGlvbiBvZiBhIGRhZW1vbiB0byB1c2UgKG9wdGlvbmFsLCBtb25lcm8td2FsbGV0LXJwYyB1c3VhbGx5IHN0YXJ0ZWQgd2l0aCBkYWVtb24gY29uZmlnKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3Bhc3N3b3JkXSB0aGUgd2FsbGV0J3MgcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9XYWxsZXRScGM+fSB0aGlzIHdhbGxldCBjbGllbnRcbiAgICovXG4gIGFzeW5jIG9wZW5XYWxsZXQocGF0aE9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4sIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHR5cGVvZiBwYXRoT3JDb25maWcgPT09IFwic3RyaW5nXCIgPyB7cGF0aDogcGF0aE9yQ29uZmlnLCBwYXNzd29yZDogcGFzc3dvcmQgPyBwYXNzd29yZCA6IFwiXCJ9IDogcGF0aE9yQ29uZmlnKTtcbiAgICAvLyBUT0RPOiBlbnN1cmUgb3RoZXIgZmllbGRzIHVuaW5pdGlhbGl6ZWQ/XG4gICAgXG4gICAgLy8gb3BlbiB3YWxsZXQgb24gcnBjIHNlcnZlclxuICAgIGlmICghY29uZmlnLmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIG5hbWUgb2Ygd2FsbGV0IHRvIG9wZW5cIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZWd0ZXN0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcmVndGVzdCBtb2RlIHdoZW4gb3BlbmluZyBSUEMgd2FsbGV0XCIpXG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwib3Blbl93YWxsZXRcIiwge2ZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLCBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCl9KTtcbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXIgb3Igc2VydmVyXG4gICAgaWYgKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpICE9IG51bGwpIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgb3BlbmVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGF3YWl0IHRoaXMuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIH0gZWxzZSBpZiAoY29uZmlnLmdldFNlcnZlcigpICE9IG51bGwpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2V0RGFlbW9uQ29ubmVjdGlvbihjb25maWcuZ2V0U2VydmVyKCkpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPkNyZWF0ZSBhbmQgb3BlbiBhIHdhbGxldCBvbiB0aGUgbW9uZXJvLXdhbGxldC1ycGMgc2VydmVyLjxwPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZTo8cD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiAmc29sOyZzb2w7IGNvbnN0cnVjdCBjbGllbnQgdG8gbW9uZXJvLXdhbGxldC1ycGM8YnI+XG4gICAqIGxldCB3YWxsZXRScGMgPSBuZXcgTW9uZXJvV2FsbGV0UnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4NFwiLCBcInJwY191c2VyXCIsIFwiYWJjMTIzXCIpOzxicj48YnI+XG4gICAqIFxuICAgKiAmc29sOyZzb2w7IGNyZWF0ZSBhbmQgb3BlbiB3YWxsZXQgb24gbW9uZXJvLXdhbGxldC1ycGM8YnI+XG4gICAqIGF3YWl0IHdhbGxldFJwYy5jcmVhdGVXYWxsZXQoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwibXl3YWxsZXRcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJhYmMxMjNcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBzZWVkOiBcImNvZXhpc3QgaWdsb28gcGFtcGhsZXQgbGFnb29uLi4uXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcmVzdG9yZUhlaWdodDogMTU0MzIxOGw8YnI+XG4gICAqIH0pO1xuICAgKiAgPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz59IGNvbmZpZyAtIE1vbmVyb1dhbGxldENvbmZpZyBvciBlcXVpdmFsZW50IEpTIG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXRoXSAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCBpbi1tZW1vcnkgd2FsbGV0IGlmIG5vdCBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGFzc3dvcmRdIC0gcGFzc3dvcmQgb2YgdGhlIHdhbGxldCB0byBjcmVhdGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZF0gLSBzZWVkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgcmFuZG9tIHdhbGxldCBjcmVhdGVkIGlmIG5laXRoZXIgc2VlZCBub3Iga2V5cyBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZE9mZnNldF0gLSB0aGUgb2Zmc2V0IHVzZWQgdG8gZGVyaXZlIGEgbmV3IHNlZWQgZnJvbSB0aGUgZ2l2ZW4gc2VlZCB0byByZWNvdmVyIGEgc2VjcmV0IHdhbGxldCBmcm9tIHRoZSBzZWVkXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5pc011bHRpc2lnXSAtIHJlc3RvcmUgbXVsdGlzaWcgd2FsbGV0IGZyb20gc2VlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcmltYXJ5QWRkcmVzc10gLSBwcmltYXJ5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9ubHkgcHJvdmlkZSBpZiByZXN0b3JpbmcgZnJvbSBrZXlzKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlVmlld0tleV0gLSBwcml2YXRlIHZpZXcga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVNwZW5kS2V5XSAtIHByaXZhdGUgc3BlbmQga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcucmVzdG9yZUhlaWdodF0gLSBibG9jayBoZWlnaHQgdG8gc3RhcnQgc2Nhbm5pbmcgZnJvbSAoZGVmYXVsdHMgdG8gMCB1bmxlc3MgZ2VuZXJhdGluZyByYW5kb20gd2FsbGV0KVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5sYW5ndWFnZV0gLSBsYW5ndWFnZSBvZiB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQgKGRlZmF1bHRzIHRvIFwiRW5nbGlzaFwiIG9yIGF1dG8tZGV0ZWN0ZWQpXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gW2NvbmZpZy5zZXJ2ZXJdIC0gTW9uZXJvUnBjQ29ubmVjdGlvbiB0byBhIG1vbmVybyBkYWVtb24gKG9wdGlvbmFsKTxicj5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyVXJpXSAtIHVyaSBvZiBhIGRhZW1vbiB0byB1c2UgKG9wdGlvbmFsLCBtb25lcm8td2FsbGV0LXJwYyB1c3VhbGx5IHN0YXJ0ZWQgd2l0aCBkYWVtb24gY29uZmlnKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZXJ2ZXJVc2VybmFtZV0gLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgZGFlbW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyUGFzc3dvcmRdIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIGRhZW1vbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJ9IFtjb25maWcuY29ubmVjdGlvbk1hbmFnZXJdIC0gbWFuYWdlIGNvbm5lY3Rpb25zIHRvIG1vbmVyb2QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVqZWN0VW5hdXRob3JpemVkXSAtIHJlamVjdCBzZWxmLXNpZ25lZCBzZXJ2ZXIgY2VydGlmaWNhdGVzIGlmIHRydWUgKGRlZmF1bHRzIHRvIHRydWUpXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gW2NvbmZpZy5zZXJ2ZXJdIC0gTW9uZXJvUnBjQ29ubmVjdGlvbiBvciBlcXVpdmFsZW50IEpTIG9iamVjdCBwcm92aWRpbmcgZGFlbW9uIGNvbmZpZ3VyYXRpb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuc2F2ZUN1cnJlbnRdIC0gc3BlY2lmaWVzIGlmIHRoZSBjdXJyZW50IFJQQyB3YWxsZXQgc2hvdWxkIGJlIHNhdmVkIGJlZm9yZSBiZWluZyBjbG9zZWQgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHJldHVybiB7TW9uZXJvV2FsbGV0UnBjfSB0aGlzIHdhbGxldCBjbGllbnRcbiAgICovXG4gIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBjb25maWcgdG8gY3JlYXRlIHdhbGxldFwiKTtcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkICYmIChjb25maWdOb3JtYWxpemVkLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVWaWV3S2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIGluaXRpYWxpemVkIHdpdGggYSBzZWVkIG9yIGtleXMgYnV0IG5vdCBib3RoXCIpO1xuICAgIH1cbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWd0ZXN0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcmVndGVzdCBtb2RlIHdoZW4gY3JlYXRpbmcgUlBDIHdhbGxldFwiKVxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldE5ldHdvcmtUeXBlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgbmV0d29ya1R5cGUgd2hlbiBjcmVhdGluZyBSUEMgd2FsbGV0IGJlY2F1c2Ugc2VydmVyJ3MgbmV0d29yayB0eXBlIGlzIGFscmVhZHkgc2V0XCIpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRMb29rYWhlYWQoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0xvb2thaGVhZCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgY3JlYXRpbmcgd2FsbGV0cyB3aXRoIHN1YmFkZHJlc3MgbG9va2FoZWFkIG92ZXIgcnBjXCIpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFBhc3N3b3JkKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRQYXNzd29yZChcIlwiKTtcblxuICAgIC8vIHNldCBzZXJ2ZXIgZnJvbSBjb25uZWN0aW9uIG1hbmFnZXIgaWYgcHJvdmlkZWRcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBjcmVhdGVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGNvbmZpZ05vcm1hbGl6ZWQuc2V0U2VydmVyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpLmdldENvbm5lY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIHdhbGxldFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZ05vcm1hbGl6ZWQpO1xuICAgIGVsc2UgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWdOb3JtYWxpemVkKTtcbiAgICBlbHNlIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZ05vcm1hbGl6ZWQpO1xuXG4gICAgLy8gc2V0IGNvbm5lY3Rpb24gbWFuYWdlciBvciBzZXJ2ZXJcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSk7XG4gICAgfSBlbHNlIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlcnZlcigpKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldERhZW1vbkNvbm5lY3Rpb24oY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgcmVzdG9yZUhlaWdodCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSBmYWxzZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ3VycmVudCB3YWxsZXQgaXMgc2F2ZWQgYXV0b21hdGljYWxseSB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0UGF0aCgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOYW1lIGlzIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICBpZiAoIWNvbmZpZy5nZXRMYW5ndWFnZSgpKSBjb25maWcuc2V0TGFuZ3VhZ2UoTW9uZXJvV2FsbGV0LkRFRkFVTFRfTEFOR1VBR0UpO1xuICAgIGxldCBwYXJhbXMgPSB7IGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLCBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksIGxhbmd1YWdlOiBjb25maWcuZ2V0TGFuZ3VhZ2UoKSB9O1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfd2FsbGV0XCIsIHBhcmFtcyk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXN0b3JlX2RldGVybWluaXN0aWNfd2FsbGV0XCIsIHtcbiAgICAgICAgZmlsZW5hbWU6IGNvbmZpZy5nZXRQYXRoKCksXG4gICAgICAgIHBhc3N3b3JkOiBjb25maWcuZ2V0UGFzc3dvcmQoKSxcbiAgICAgICAgc2VlZDogY29uZmlnLmdldFNlZWQoKSxcbiAgICAgICAgc2VlZF9vZmZzZXQ6IGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCksXG4gICAgICAgIGVuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWw6IGNvbmZpZy5nZXRJc011bHRpc2lnKCksXG4gICAgICAgIHJlc3RvcmVfaGVpZ2h0OiBjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpLFxuICAgICAgICBsYW5ndWFnZTogY29uZmlnLmdldExhbmd1YWdlKCksXG4gICAgICAgIGF1dG9zYXZlX2N1cnJlbnQ6IGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhpcy5oYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihjb25maWcuZ2V0UGF0aCgpLCBlcnIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHdhbGxldCBmcm9tIGtleXNcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFJlc3RvcmVIZWlnaHQoMCk7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShNb25lcm9XYWxsZXQuREVGQVVMVF9MQU5HVUFHRSk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdlbmVyYXRlX2Zyb21fa2V5c1wiLCB7XG4gICAgICAgIGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLFxuICAgICAgICBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksXG4gICAgICAgIGFkZHJlc3M6IGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpLFxuICAgICAgICB2aWV3a2V5OiBjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSxcbiAgICAgICAgc3BlbmRrZXk6IGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSxcbiAgICAgICAgcmVzdG9yZV9oZWlnaHQ6IGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCksXG4gICAgICAgIGF1dG9zYXZlX2N1cnJlbnQ6IGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhpcy5oYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihjb25maWcuZ2V0UGF0aCgpLCBlcnIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKG5hbWUsIGVycikge1xuICAgIGlmIChlcnIubWVzc2FnZSkge1xuICAgICAgaWYgKGVyci5tZXNzYWdlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoXCJhbHJlYWR5IGV4aXN0c1wiKSkgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKFwiV2FsbGV0IGFscmVhZHkgZXhpc3RzOiBcIiArIG5hbWUsIGVyci5nZXRDb2RlKCksIGVyci5nZXRScGNNZXRob2QoKSwgZXJyLmdldFJwY1BhcmFtcygpKTtcbiAgICAgIGlmIChlcnIubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwid29yZCBsaXN0IGZhaWxlZCB2ZXJpZmljYXRpb25cIikpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihcIkludmFsaWQgbW5lbW9uaWNcIiwgZXJyLmdldENvZGUoKSwgZXJyLmdldFJwY01ldGhvZCgpLCBlcnIuZ2V0UnBjUGFyYW1zKCkpO1xuICAgIH1cbiAgICB0aHJvdyBlcnI7XG4gIH1cbiAgXG4gIGFzeW5jIGlzVmlld09ubHkoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7a2V5X3R5cGU6IFwibW5lbW9uaWNcIn0pO1xuICAgICAgcmV0dXJuIGZhbHNlOyAvLyBrZXkgcmV0cmlldmFsIHN1Y2NlZWRzIGlmIG5vdCB2aWV3IG9ubHlcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTI5KSByZXR1cm4gdHJ1ZTsgIC8vIHdhbGxldCBpcyB2aWV3IG9ubHlcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTEpIHJldHVybiBmYWxzZTsgIC8vIHdhbGxldCBpcyBvZmZsaW5lIGJ1dCBub3QgdmlldyBvbmx5XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgd2FsbGV0J3MgZGFlbW9uIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ3xNb25lcm9ScGNDb25uZWN0aW9ufSBbdXJpT3JDb25uZWN0aW9uXSAtIHRoZSBkYWVtb24ncyBVUkkgb3IgY29ubmVjdGlvbiAoZGVmYXVsdHMgdG8gb2ZmbGluZSlcbiAgICogQHBhcmFtIHtib29sZWFufSBpc1RydXN0ZWQgLSBpbmRpY2F0ZXMgaWYgdGhlIGRhZW1vbiBpbiB0cnVzdGVkXG4gICAqIEBwYXJhbSB7U3NsT3B0aW9uc30gc3NsT3B0aW9ucyAtIGN1c3RvbSBTU0wgY29uZmlndXJhdGlvblxuICAgKi9cbiAgYXN5bmMgc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24/OiBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgc3RyaW5nLCBpc1RydXN0ZWQ/OiBib29sZWFuLCBzc2xPcHRpb25zPzogU3NsT3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCBjb25uZWN0aW9uID0gIXVyaU9yQ29ubmVjdGlvbiA/IHVuZGVmaW5lZCA6IHVyaU9yQ29ubmVjdGlvbiBpbnN0YW5jZW9mIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPyB1cmlPckNvbm5lY3Rpb24gOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24pO1xuICAgIGlmICghc3NsT3B0aW9ucykgc3NsT3B0aW9ucyA9IG5ldyBTc2xPcHRpb25zKCk7XG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmFkZHJlc3MgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRVcmkoKSA6IFwiYmFkX3VyaVwiOyAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBiYWQgZGFlbW9uIHVyaSBuZWNlc3NhcnkgZm9yIG9mZmxpbmU/XG4gICAgcGFyYW1zLnVzZXJuYW1lID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA6IFwiXCI7XG4gICAgcGFyYW1zLnBhc3N3b3JkID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA6IFwiXCI7XG4gICAgcGFyYW1zLnRydXN0ZWQgPSBpc1RydXN0ZWQ7XG4gICAgcGFyYW1zLnNzbF9zdXBwb3J0ID0gXCJhdXRvZGV0ZWN0XCI7XG4gICAgcGFyYW1zLnNzbF9wcml2YXRlX2tleV9wYXRoID0gc3NsT3B0aW9ucy5nZXRQcml2YXRlS2V5UGF0aCgpO1xuICAgIHBhcmFtcy5zc2xfY2VydGlmaWNhdGVfcGF0aCAgPSBzc2xPcHRpb25zLmdldENlcnRpZmljYXRlUGF0aCgpO1xuICAgIHBhcmFtcy5zc2xfY2FfZmlsZSA9IHNzbE9wdGlvbnMuZ2V0Q2VydGlmaWNhdGVBdXRob3JpdHlGaWxlKCk7XG4gICAgcGFyYW1zLnNzbF9hbGxvd2VkX2ZpbmdlcnByaW50cyA9IHNzbE9wdGlvbnMuZ2V0QWxsb3dlZEZpbmdlcnByaW50cygpO1xuICAgIHBhcmFtcy5zc2xfYWxsb3dfYW55X2NlcnQgPSBzc2xPcHRpb25zLmdldEFsbG93QW55Q2VydCgpO1xuXG4gICAgLy8gc2V0IHByb3h5IHdoaWNoIG11c3QgbWF0Y2ggc3RhcnR1cCBwcm94eSBpZiBhcHBsaWNhYmxlXG4gICAgaWYgKGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5nZXRQcm94eVVyaSgpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0aGlzLnN0YXJ0dXBQcm94eVVyaSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2V0IGRhZW1vbiBjb25uZWN0aW9uIHdpdGhvdXQgcHJveHkgVVJJIGJlY2F1c2UgbW9uZXJvLXdhbGxldC1ycGMgd2FzIHN0YXJ0ZWQgd2l0aCBhIHByb3h5IFVSSTogXCIgKyB0aGlzLnN0YXJ0dXBQcm94eVVyaSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLnN0YXJ0dXBQcm94eVVyaSA9PT0gdW5kZWZpbmVkKSBwYXJhbXMucHJveHkgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRQcm94eVVyaSgpIDogXCJcIjtcbiAgICAgIGVsc2UgaWYgKHRoaXMuc3RhcnR1cFByb3h5VXJpICE9PSBjb25uZWN0aW9uLmdldFByb3h5VXJpKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNldCBkYWVtb24gY29ubmVjdGlvbiB3aXRoIHByb3h5IFVSSSBcIiArIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSArIFwiIGJlY2F1c2UgbW9uZXJvLXdhbGxldC1ycGMgd2FzIHN0YXJ0ZWQgd2l0aCBhIGRpZmZlcmVudCBwcm94eSBVUkk6IFwiICsgdGhpcy5zdGFydHVwUHJveHlVcmkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXBhcmFtcy5wcm94eSkgcGFyYW1zLnByb3h5ID0gXCJcIjtcblxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9kYWVtb25cIiwgcGFyYW1zKTtcbiAgICB0aGlzLmRhZW1vbkNvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLmRhZW1vbkNvbm5lY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSB0b3RhbCBhbmQgdW5sb2NrZWQgYmFsYW5jZXMgaW4gYSBzaW5nbGUgcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbYWNjb3VudElkeF0gYWNjb3VudCBpbmRleFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N1YmFkZHJlc3NJZHhdIHN1YmFkZHJlc3MgaW5kZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxiaWdpbnRbXT59IGlzIHRoZSB0b3RhbCBhbmQgdW5sb2NrZWQgYmFsYW5jZXMgaW4gYW4gYXJyYXksIHJlc3BlY3RpdmVseVxuICAgKi9cbiAgYXN5bmMgZ2V0QmFsYW5jZXMoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50W10+IHtcbiAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzc0lkeCwgdW5kZWZpbmVkLCBcIk11c3QgcHJvdmlkZSBhY2NvdW50IGluZGV4IHdpdGggc3ViYWRkcmVzcyBpbmRleFwiKTtcbiAgICAgIGxldCBiYWxhbmNlID0gQmlnSW50KDApO1xuICAgICAgbGV0IHVubG9ja2VkQmFsYW5jZSA9IEJpZ0ludCgwKTtcbiAgICAgIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgdGhpcy5nZXRBY2NvdW50cygpKSB7XG4gICAgICAgIGJhbGFuY2UgPSBiYWxhbmNlICsgYWNjb3VudC5nZXRCYWxhbmNlKCk7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZSA9IHVubG9ja2VkQmFsYW5jZSArIGFjY291bnQuZ2V0VW5sb2NrZWRCYWxhbmNlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gW2JhbGFuY2UsIHVubG9ja2VkQmFsYW5jZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBwYXJhbXMgPSB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeCwgYWRkcmVzc19pbmRpY2VzOiBzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBbc3ViYWRkcmVzc0lkeF19O1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCBwYXJhbXMpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtCaWdJbnQocmVzcC5yZXN1bHQuYmFsYW5jZSksIEJpZ0ludChyZXNwLnJlc3VsdC51bmxvY2tlZF9iYWxhbmNlKV07XG4gICAgICBlbHNlIHJldHVybiBbQmlnSW50KHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzWzBdLmJhbGFuY2UpLCBCaWdJbnQocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3NbMF0udW5sb2NrZWRfYmFsYW5jZSldO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ09NTU9OIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9XYWxsZXRMaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN1cGVyLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZXNlcnZlUHJvb2YoYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpLCBcIlwiLCBcIlwiKTsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBwcm92aWRlIGJldHRlciB3YXkgdG8ga25vdyBpZiB3YWxsZXQgcnBjIGlzIGNvbm5lY3RlZCB0byBkYWVtb25cbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcImNoZWNrIHJlc2VydmUgZXhwZWN0ZWQgdG8gZmFpbFwiKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC0xMykgdGhyb3cgZTsgLy8gbm8gd2FsbGV0IGZpbGVcbiAgICAgIHJldHVybiBlLm1lc3NhZ2UuaW5kZXhPZihcIkZhaWxlZCB0byBjb25uZWN0IHRvIGRhZW1vblwiKSA8IDA7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3ZlcnNpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9WZXJzaW9uKHJlc3AucmVzdWx0LnZlcnNpb24sIHJlc3AucmVzdWx0LnJlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMucGF0aDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwibW5lbW9uaWNcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2UoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoYXdhaXQgdGhpcy5nZXRTZWVkKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMuZ2V0U2VlZExhbmd1YWdlKCkgbm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBsaXN0IG9mIGF2YWlsYWJsZSBsYW5ndWFnZXMgZm9yIHRoZSB3YWxsZXQncyBzZWVkLlxuICAgKiBcbiAgICogQHJldHVybiB7c3RyaW5nW119IHRoZSBhdmFpbGFibGUgbGFuZ3VhZ2VzIGZvciB0aGUgd2FsbGV0J3Mgc2VlZC5cbiAgICovXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZXMoKSB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfbGFuZ3VhZ2VzXCIpKS5yZXN1bHQubGFuZ3VhZ2VzO1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwidmlld19rZXlcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcInNwZW5kX2tleVwiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBzdWJhZGRyZXNzTWFwID0gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF07XG4gICAgaWYgKCFzdWJhZGRyZXNzTWFwKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHRydWUpOyAgLy8gY2FjaGUncyBhbGwgYWRkcmVzc2VzIGF0IHRoaXMgYWNjb3VudFxuICAgICAgcmV0dXJuIHRoaXMuZ2V0QWRkcmVzcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTsgICAgICAgIC8vIHJlY3Vyc2l2ZSBjYWxsIHVzZXMgY2FjaGVcbiAgICB9XG4gICAgbGV0IGFkZHJlc3MgPSBzdWJhZGRyZXNzTWFwW3N1YmFkZHJlc3NJZHhdO1xuICAgIGlmICghYWRkcmVzcykge1xuICAgICAgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCB0cnVlKTsgIC8vIGNhY2hlJ3MgYWxsIGFkZHJlc3NlcyBhdCB0aGlzIGFjY291bnRcbiAgICAgIHJldHVybiB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XVtzdWJhZGRyZXNzSWR4XTtcbiAgICB9XG4gICAgcmV0dXJuIGFkZHJlc3M7XG4gIH1cbiAgXG4gIC8vIFRPRE86IHVzZSBjYWNoZVxuICBhc3luYyBnZXRBZGRyZXNzSW5kZXgoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggcmVzdWx0IGFuZCBub3JtYWxpemUgZXJyb3IgaWYgYWRkcmVzcyBkb2VzIG5vdCBiZWxvbmcgdG8gdGhlIHdhbGxldFxuICAgIGxldCByZXNwO1xuICAgIHRyeSB7XG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NfaW5kZXhcIiwge2FkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTIpIHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29udmVydCBycGMgcmVzcG9uc2VcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKHthZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWFqb3IpO1xuICAgIHN1YmFkZHJlc3Muc2V0SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWlub3IpO1xuICAgIHJldHVybiBzdWJhZGRyZXNzO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3M/OiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IGludGVncmF0ZWRBZGRyZXNzU3RyID0gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfaW50ZWdyYXRlZF9hZGRyZXNzXCIsIHtzdGFuZGFyZF9hZGRyZXNzOiBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRfaWQ6IHBheW1lbnRJZH0pKS5yZXN1bHQuaW50ZWdyYXRlZF9hZGRyZXNzO1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3NTdHIpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUubWVzc2FnZS5pbmNsdWRlcyhcIkludmFsaWQgcGF5bWVudCBJRFwiKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBwYXltZW50IElEOiBcIiArIHBheW1lbnRJZCk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNwbGl0X2ludGVncmF0ZWRfYWRkcmVzc1wiLCB7aW50ZWdyYXRlZF9hZGRyZXNzOiBpbnRlZ3JhdGVkQWRkcmVzc30pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoKS5zZXRTdGFuZGFyZEFkZHJlc3MocmVzcC5yZXN1bHQuc3RhbmRhcmRfYWRkcmVzcykuc2V0UGF5bWVudElkKHJlc3AucmVzdWx0LnBheW1lbnRfaWQpLnNldEludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfaGVpZ2h0XCIpKS5yZXN1bHQuaGVpZ2h0O1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGdldHRpbmcgdGhlIGNoYWluIGhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF5OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGluZyBhIGhlaWdodCBieSBkYXRlXCIpO1xuICB9XG4gIFxuICBhc3luYyBzeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodD86IE1vbmVyb1dhbGxldExpc3RlbmVyIHwgbnVtYmVyLCBzdGFydEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvU3luY1Jlc3VsdD4ge1xuICAgIGFzc2VydCghKGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyKSwgXCJNb25lcm8gV2FsbGV0IFJQQyBkb2VzIG5vdCBzdXBwb3J0IHJlcG9ydGluZyBzeW5jIHByb2dyZXNzXCIpO1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlZnJlc2hcIiwge3N0YXJ0X2hlaWdodDogc3RhcnRIZWlnaHR9KTtcbiAgICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3AucmVzdWx0LmJsb2Nrc19mZXRjaGVkLCByZXNwLnJlc3VsdC5yZWNlaXZlZF9tb25leSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZSA9PT0gXCJubyBjb25uZWN0aW9uIHRvIGRhZW1vblwiKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXM/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBcbiAgICAvLyBjb252ZXJ0IG1zIHRvIHNlY29uZHMgZm9yIHJwYyBwYXJhbWV0ZXJcbiAgICBsZXQgc3luY1BlcmlvZEluU2Vjb25kcyA9IE1hdGgucm91bmQoKHN5bmNQZXJpb2RJbk1zID09PSB1bmRlZmluZWQgPyBNb25lcm9XYWxsZXRScGMuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA6IHN5bmNQZXJpb2RJbk1zKSAvIDEwMDApO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhdXRvX3JlZnJlc2hcIiwge1xuICAgICAgZW5hYmxlOiB0cnVlLFxuICAgICAgcGVyaW9kOiBzeW5jUGVyaW9kSW5TZWNvbmRzXG4gICAgfSk7XG4gICAgXG4gICAgLy8gdXBkYXRlIHN5bmMgcGVyaW9kIGZvciBwb2xsZXJcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gc3luY1BlcmlvZEluU2Vjb25kcyAqIDEwMDA7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyICE9PSB1bmRlZmluZWQpIHRoaXMud2FsbGV0UG9sbGVyLnNldFBlcmlvZEluTXModGhpcy5zeW5jUGVyaW9kSW5Ncyk7XG4gICAgXG4gICAgLy8gcG9sbCBpZiBsaXN0ZW5pbmdcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgfVxuXG4gIGdldFN5bmNQZXJpb2RJbk1zKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuc3luY1BlcmlvZEluTXM7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhdXRvX3JlZnJlc2hcIiwgeyBlbmFibGU6IGZhbHNlIH0pO1xuICB9XG4gIFxuICBhc3luYyBzY2FuVHhzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdHhIYXNoZXMgfHwgIXR4SGFzaGVzLmxlbmd0aCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gdHggaGFzaGVzIGdpdmVuIHRvIHNjYW5cIik7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2Nhbl90eFwiLCB7dHhpZHM6IHR4SGFzaGVzfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhblNwZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc2Nhbl9zcGVudFwiLCB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc2Nhbl9ibG9ja2NoYWluXCIsIHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbGFuY2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYWxhbmNlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCB0YWc/OiBzdHJpbmcsIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnRbXT4ge1xuICAgIFxuICAgIC8vIGZldGNoIGFjY291bnRzIGZyb20gcnBjXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWNjb3VudHNcIiwge3RhZzogdGFnfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgYWNjb3VudCBvYmplY3RzIGFuZCBmZXRjaCBzdWJhZGRyZXNzZXMgcGVyIGFjY291bnQgdXNpbmcgZ2V0X2FkZHJlc3NcbiAgICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBnZXRfYWRkcmVzcyBzaG91bGQgc3VwcG9ydCBhbGxfYWNjb3VudHMgc28gbm90IGNhbGxlZCBvbmNlIHBlciBhY2NvdW50XG4gICAgbGV0IGFjY291bnRzOiBNb25lcm9BY2NvdW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBycGNBY2NvdW50IG9mIHJlc3AucmVzdWx0LnN1YmFkZHJlc3NfYWNjb3VudHMpIHtcbiAgICAgIGxldCBhY2NvdW50ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNBY2NvdW50KHJwY0FjY291bnQpO1xuICAgICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMpIGFjY291bnQuc2V0U3ViYWRkcmVzc2VzKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnQuZ2V0SW5kZXgoKSwgdW5kZWZpbmVkLCB0cnVlKSk7XG4gICAgICBhY2NvdW50cy5wdXNoKGFjY291bnQpO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgbWVyZ2UgZmllbGRzIGZyb20gZ2V0X2JhbGFuY2UgYWNyb3NzIGFsbCBhY2NvdW50c1xuICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzICYmICFza2lwQmFsYW5jZXMpIHtcbiAgICAgIFxuICAgICAgLy8gdGhlc2UgZmllbGRzIGFyZSBub3QgaW5pdGlhbGl6ZWQgaWYgc3ViYWRkcmVzcyBpcyB1bnVzZWQgYW5kIHRoZXJlZm9yZSBub3QgcmV0dXJuZWQgZnJvbSBgZ2V0X2JhbGFuY2VgXG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkge1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cygwKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGZldGNoIGFuZCBtZXJnZSBpbmZvIGZyb20gZ2V0X2JhbGFuY2VcbiAgICAgIHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCB7YWxsX2FjY291bnRzOiB0cnVlfSk7XG4gICAgICBpZiAocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIG1lcmdlIGluZm9cbiAgICAgICAgICBsZXQgYWNjb3VudCA9IGFjY291bnRzW3N1YmFkZHJlc3MuZ2V0QWNjb3VudEluZGV4KCldO1xuICAgICAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzLmdldEFjY291bnRJbmRleCgpLCBhY2NvdW50LmdldEluZGV4KCksIFwiUlBDIGFjY291bnRzIGFyZSBvdXQgb2Ygb3JkZXJcIik7ICAvLyB3b3VsZCBuZWVkIHRvIHN3aXRjaCBsb29rdXAgdG8gbG9vcFxuICAgICAgICAgIGxldCB0Z3RTdWJhZGRyZXNzID0gYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKVtzdWJhZGRyZXNzLmdldEluZGV4KCldO1xuICAgICAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzLmdldEluZGV4KCksIHRndFN1YmFkZHJlc3MuZ2V0SW5kZXgoKSwgXCJSUEMgc3ViYWRkcmVzc2VzIGFyZSBvdXQgb2Ygb3JkZXJcIik7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0QmFsYW5jZShzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSk7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSk7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGFjY291bnRzO1xuICB9XG4gIFxuICAvLyBUT0RPOiBnZXRBY2NvdW50QnlJbmRleCgpLCBnZXRBY2NvdW50QnlUYWcoKVxuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBhc3NlcnQoYWNjb3VudElkeCA+PSAwKTtcbiAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgaWYgKGFjY291bnQuZ2V0SW5kZXgoKSA9PT0gYWNjb3VudElkeCkge1xuICAgICAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcykgYWNjb3VudC5zZXRTdWJhZGRyZXNzZXMoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCBza2lwQmFsYW5jZXMpKTtcbiAgICAgICAgcmV0dXJuIGFjY291bnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIkFjY291bnQgd2l0aCBpbmRleCBcIiArIGFjY291bnRJZHggKyBcIiBkb2VzIG5vdCBleGlzdFwiKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBsYWJlbCA9IGxhYmVsID8gbGFiZWwgOiB1bmRlZmluZWQ7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfYWNjb3VudFwiLCB7bGFiZWw6IGxhYmVsfSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9BY2NvdW50KHtcbiAgICAgIGluZGV4OiByZXNwLnJlc3VsdC5hY2NvdW50X2luZGV4LFxuICAgICAgcHJpbWFyeUFkZHJlc3M6IHJlc3AucmVzdWx0LmFkZHJlc3MsXG4gICAgICBsYWJlbDogbGFiZWwsXG4gICAgICBiYWxhbmNlOiBCaWdJbnQoMCksXG4gICAgICB1bmxvY2tlZEJhbGFuY2U6IEJpZ0ludCgwKVxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0luZGljZXM/OiBudW1iZXJbXSwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggc3ViYWRkcmVzc2VzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBhY2NvdW50SWR4O1xuICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcykgcGFyYW1zLmFkZHJlc3NfaW5kZXggPSBHZW5VdGlscy5saXN0aWZ5KHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzXCIsIHBhcmFtcyk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBzdWJhZGRyZXNzZXNcbiAgICBsZXQgc3ViYWRkcmVzc2VzID0gW107XG4gICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5hZGRyZXNzZXMpIHtcbiAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgICBzdWJhZGRyZXNzZXMucHVzaChzdWJhZGRyZXNzKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIGluaXRpYWxpemUgc3ViYWRkcmVzcyBiYWxhbmNlc1xuICAgIGlmICghc2tpcEJhbGFuY2VzKSB7XG4gICAgICBcbiAgICAgIC8vIHRoZXNlIGZpZWxkcyBhcmUgbm90IGluaXRpYWxpemVkIGlmIHN1YmFkZHJlc3MgaXMgdW51c2VkIGFuZCB0aGVyZWZvcmUgbm90IHJldHVybmVkIGZyb20gYGdldF9iYWxhbmNlYFxuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGZldGNoIGFuZCBpbml0aWFsaXplIGJhbGFuY2VzXG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwgcGFyYW1zKTtcbiAgICAgIGlmIChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICBmb3IgKGxldCBycGNTdWJhZGRyZXNzIG9mIHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3MgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gdHJhbnNmZXIgaW5mbyB0byBleGlzdGluZyBzdWJhZGRyZXNzIG9iamVjdFxuICAgICAgICAgIGZvciAobGV0IHRndFN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICAgICAgICBpZiAodGd0U3ViYWRkcmVzcy5nZXRJbmRleCgpICE9PSBzdWJhZGRyZXNzLmdldEluZGV4KCkpIGNvbnRpbnVlOyAvLyBza2lwIHRvIHN1YmFkZHJlc3Mgd2l0aCBzYW1lIGluZGV4XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXROdW1CbG9ja3NUb1VubG9jaygpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soc3ViYWRkcmVzcy5nZXROdW1CbG9ja3NUb1VubG9jaygpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgYWRkcmVzc2VzXG4gICAgbGV0IHN1YmFkZHJlc3NNYXAgPSB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XTtcbiAgICBpZiAoIXN1YmFkZHJlc3NNYXApIHtcbiAgICAgIHN1YmFkZHJlc3NNYXAgPSB7fTtcbiAgICAgIHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdID0gc3ViYWRkcmVzc01hcDtcbiAgICB9XG4gICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgIHN1YmFkZHJlc3NNYXBbc3ViYWRkcmVzcy5nZXRJbmRleCgpXSA9IHN1YmFkZHJlc3MuZ2V0QWRkcmVzcygpO1xuICAgIH1cbiAgICBcbiAgICAvLyByZXR1cm4gcmVzdWx0c1xuICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gIH1cblxuICBhc3luYyBnZXRTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgYXNzZXJ0KGFjY291bnRJZHggPj0gMCk7XG4gICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPj0gMCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBbc3ViYWRkcmVzc0lkeF0sIHNraXBCYWxhbmNlcykpWzBdO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfYWRkcmVzc1wiLCB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeCwgbGFiZWw6IGxhYmVsfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgc3ViYWRkcmVzcyBvYmplY3RcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKCk7XG4gICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgc3ViYWRkcmVzcy5zZXRJbmRleChyZXNwLnJlc3VsdC5hZGRyZXNzX2luZGV4KTtcbiAgICBzdWJhZGRyZXNzLnNldEFkZHJlc3MocmVzcC5yZXN1bHQuYWRkcmVzcyk7XG4gICAgc3ViYWRkcmVzcy5zZXRMYWJlbChsYWJlbCA/IGxhYmVsIDogdW5kZWZpbmVkKTtcbiAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgc3ViYWRkcmVzcy5zZXRJc1VzZWQoZmFsc2UpO1xuICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cblxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJsYWJlbF9hZGRyZXNzXCIsIHtpbmRleDoge21ham9yOiBhY2NvdW50SWR4LCBtaW5vcjogc3ViYWRkcmVzc0lkeH0sIGxhYmVsOiBsYWJlbH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHMocXVlcnk/OiBzdHJpbmdbXSB8IFBhcnRpYWw8TW9uZXJvVHhRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyBjb3B5IHF1ZXJ5XG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHRlbXBvcmFyaWx5IGRpc2FibGUgdHJhbnNmZXIgYW5kIG91dHB1dCBxdWVyaWVzIGluIG9yZGVyIHRvIGNvbGxlY3QgYWxsIHR4IGluZm9ybWF0aW9uXG4gICAgbGV0IHRyYW5zZmVyUXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0VHJhbnNmZXJRdWVyeSgpO1xuICAgIGxldCBpbnB1dFF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldElucHV0UXVlcnkoKTtcbiAgICBsZXQgb3V0cHV0UXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0T3V0cHV0UXVlcnkoKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0VHJhbnNmZXJRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRJbnB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldE91dHB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgXG4gICAgLy8gZmV0Y2ggYWxsIHRyYW5zZmVycyB0aGF0IG1lZXQgdHggcXVlcnlcbiAgICBsZXQgdHJhbnNmZXJzID0gYXdhaXQgdGhpcy5nZXRUcmFuc2ZlcnNBdXgobmV3IE1vbmVyb1RyYW5zZmVyUXVlcnkoKS5zZXRUeFF1ZXJ5KE1vbmVyb1dhbGxldFJwYy5kZWNvbnRleHR1YWxpemUocXVlcnlOb3JtYWxpemVkLmNvcHkoKSkpKTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHVuaXF1ZSB0eHMgZnJvbSB0cmFuc2ZlcnMgd2hpbGUgcmV0YWluaW5nIG9yZGVyXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGxldCB0eHNTZXQgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHJhbnNmZXJzKSB7XG4gICAgICBpZiAoIXR4c1NldC5oYXModHJhbnNmZXIuZ2V0VHgoKSkpIHtcbiAgICAgICAgdHhzLnB1c2godHJhbnNmZXIuZ2V0VHgoKSk7XG4gICAgICAgIHR4c1NldC5hZGQodHJhbnNmZXIuZ2V0VHgoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHR5cGVzIGludG8gbWFwcyBmb3IgbWVyZ2luZyBhbmQgbG9va3VwXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIG1lcmdlIG91dHB1dHMgaWYgcmVxdWVzdGVkXG4gICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5nZXRJbmNsdWRlT3V0cHV0cygpIHx8IG91dHB1dFF1ZXJ5KSB7XG4gICAgICAgIFxuICAgICAgLy8gZmV0Y2ggb3V0cHV0c1xuICAgICAgbGV0IG91dHB1dFF1ZXJ5QXV4ID0gKG91dHB1dFF1ZXJ5ID8gb3V0cHV0UXVlcnkuY29weSgpIDogbmV3IE1vbmVyb091dHB1dFF1ZXJ5KCkpLnNldFR4UXVlcnkoTW9uZXJvV2FsbGV0UnBjLmRlY29udGV4dHVhbGl6ZShxdWVyeU5vcm1hbGl6ZWQuY29weSgpKSk7XG4gICAgICBsZXQgb3V0cHV0cyA9IGF3YWl0IHRoaXMuZ2V0T3V0cHV0c0F1eChvdXRwdXRRdWVyeUF1eCk7XG4gICAgICBcbiAgICAgIC8vIG1lcmdlIG91dHB1dCB0eHMgb25lIHRpbWUgd2hpbGUgcmV0YWluaW5nIG9yZGVyXG4gICAgICBsZXQgb3V0cHV0VHhzID0gW107XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2Ygb3V0cHV0cykge1xuICAgICAgICBpZiAoIW91dHB1dFR4cy5pbmNsdWRlcyhvdXRwdXQuZ2V0VHgoKSkpIHtcbiAgICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeChvdXRwdXQuZ2V0VHgoKSwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgICAgICBvdXRwdXRUeHMucHVzaChvdXRwdXQuZ2V0VHgoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gcmVzdG9yZSB0cmFuc2ZlciBhbmQgb3V0cHV0IHF1ZXJpZXNcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0VHJhbnNmZXJRdWVyeSh0cmFuc2ZlclF1ZXJ5KTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SW5wdXRRdWVyeShpbnB1dFF1ZXJ5KTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0T3V0cHV0UXVlcnkob3V0cHV0UXVlcnkpO1xuICAgIFxuICAgIC8vIGZpbHRlciB0eHMgdGhhdCBkb24ndCBtZWV0IHRyYW5zZmVyIHF1ZXJ5XG4gICAgbGV0IHR4c1F1ZXJpZWQgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQubWVldHNDcml0ZXJpYSh0eCkpIHR4c1F1ZXJpZWQucHVzaCh0eCk7XG4gICAgICBlbHNlIGlmICh0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgIH1cbiAgICB0eHMgPSB0eHNRdWVyaWVkO1xuICAgIFxuICAgIC8vIHNwZWNpYWwgY2FzZTogcmUtZmV0Y2ggdHhzIGlmIGluY29uc2lzdGVuY3kgY2F1c2VkIGJ5IG5lZWRpbmcgdG8gbWFrZSBtdWx0aXBsZSBycGMgY2FsbHNcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpICYmIHR4LmdldEJsb2NrKCkgPT09IHVuZGVmaW5lZCB8fCAhdHguZ2V0SXNDb25maXJtZWQoKSAmJiB0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkluY29uc2lzdGVuY3kgZGV0ZWN0ZWQgYnVpbGRpbmcgdHhzIGZyb20gbXVsdGlwbGUgcnBjIGNhbGxzLCByZS1mZXRjaGluZyB0eHNcIik7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFR4cyhxdWVyeU5vcm1hbGl6ZWQpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBvcmRlciB0eHMgaWYgdHggaGFzaGVzIGdpdmVuIHRoZW4gcmV0dXJuXG4gICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKSAmJiBxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkubGVuZ3RoID4gMCkge1xuICAgICAgbGV0IHR4c0J5SWQgPSBuZXcgTWFwKCkgIC8vIHN0b3JlIHR4cyBpbiB0ZW1wb3JhcnkgbWFwIGZvciBzb3J0aW5nXG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4c0J5SWQuc2V0KHR4LmdldEhhc2goKSwgdHgpO1xuICAgICAgbGV0IG9yZGVyZWRUeHMgPSBbXTtcbiAgICAgIGZvciAobGV0IGhhc2ggb2YgcXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpKSBpZiAodHhzQnlJZC5nZXQoaGFzaCkpIG9yZGVyZWRUeHMucHVzaCh0eHNCeUlkLmdldChoYXNoKSk7XG4gICAgICB0eHMgPSBvcmRlcmVkVHhzO1xuICAgIH1cbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9UcmFuc2ZlcltdPiB7XG4gICAgXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIGdldCB0cmFuc2ZlcnMgZGlyZWN0bHkgaWYgcXVlcnkgZG9lcyBub3QgcmVxdWlyZSB0eCBjb250ZXh0IChvdGhlciB0cmFuc2ZlcnMsIG91dHB1dHMpXG4gICAgaWYgKCFNb25lcm9XYWxsZXRScGMuaXNDb250ZXh0dWFsKHF1ZXJ5Tm9ybWFsaXplZCkpIHJldHVybiB0aGlzLmdldFRyYW5zZmVyc0F1eChxdWVyeU5vcm1hbGl6ZWQpO1xuICAgIFxuICAgIC8vIG90aGVyd2lzZSBnZXQgdHhzIHdpdGggZnVsbCBtb2RlbHMgdG8gZnVsZmlsbCBxdWVyeVxuICAgIGxldCB0cmFuc2ZlcnMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLmdldFR4cyhxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpKSkge1xuICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZmlsdGVyVHJhbnNmZXJzKHF1ZXJ5Tm9ybWFsaXplZCkpIHtcbiAgICAgICAgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHJhbnNmZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9PdXRwdXRRdWVyeT4pOiBQcm9taXNlPE1vbmVyb091dHB1dFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZU91dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBnZXQgb3V0cHV0cyBkaXJlY3RseSBpZiBxdWVyeSBkb2VzIG5vdCByZXF1aXJlIHR4IGNvbnRleHQgKG90aGVyIG91dHB1dHMsIHRyYW5zZmVycylcbiAgICBpZiAoIU1vbmVyb1dhbGxldFJwYy5pc0NvbnRleHR1YWwocXVlcnlOb3JtYWxpemVkKSkgcmV0dXJuIHRoaXMuZ2V0T3V0cHV0c0F1eChxdWVyeU5vcm1hbGl6ZWQpO1xuICAgIFxuICAgIC8vIG90aGVyd2lzZSBnZXQgdHhzIHdpdGggZnVsbCBtb2RlbHMgdG8gZnVsZmlsbCBxdWVyeVxuICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5nZXRUeHMocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKSkpIHtcbiAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5maWx0ZXJPdXRwdXRzKHF1ZXJ5Tm9ybWFsaXplZCkpIHtcbiAgICAgICAgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRPdXRwdXRzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4cG9ydF9vdXRwdXRzXCIsIHthbGw6IGFsbH0pKS5yZXN1bHQub3V0cHV0c19kYXRhX2hleDtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW1wb3J0X291dHB1dHNcIiwge291dHB1dHNfZGF0YV9oZXg6IG91dHB1dHNIZXh9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQubnVtX2ltcG9ydGVkO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRLZXlJbWFnZXMoYWxsID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5ycGNFeHBvcnRLZXlJbWFnZXMoYWxsKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlczogTW9uZXJvS2V5SW1hZ2VbXSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQ+IHtcbiAgICBcbiAgICAvLyBjb252ZXJ0IGtleSBpbWFnZXMgdG8gcnBjIHBhcmFtZXRlclxuICAgIGxldCBycGNLZXlJbWFnZXMgPSBrZXlJbWFnZXMubWFwKGtleUltYWdlID0+ICh7a2V5X2ltYWdlOiBrZXlJbWFnZS5nZXRIZXgoKSwgc2lnbmF0dXJlOiBrZXlJbWFnZS5nZXRTaWduYXR1cmUoKX0pKTtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9rZXlfaW1hZ2VzXCIsIHtzaWduZWRfa2V5X2ltYWdlczogcnBjS2V5SW1hZ2VzfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgYW5kIHJldHVybiByZXN1bHRcbiAgICBsZXQgaW1wb3J0UmVzdWx0ID0gbmV3IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0KCk7XG4gICAgaW1wb3J0UmVzdWx0LnNldEhlaWdodChyZXNwLnJlc3VsdC5oZWlnaHQpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRTcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQuc3BlbnQpKTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0VW5zcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQudW5zcGVudCkpO1xuICAgIHJldHVybiBpbXBvcnRSZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnJwY0V4cG9ydEtleUltYWdlcyhmYWxzZSk7XG4gIH1cbiAgXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImZyZWV6ZVwiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICB9XG4gIFxuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidGhhd1wiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICB9XG4gIFxuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmcm96ZW5cIiwge2tleV9pbWFnZToga2V5SW1hZ2V9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuZnJvemVuID09PSB0cnVlO1xuICB9XG5cbiAgYXN5bmMgZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCk6IFByb21pc2U8TW9uZXJvVHhQcmlvcml0eT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2RlZmF1bHRfZmVlX3ByaW9yaXR5XCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5wcmlvcml0eTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSwgY29weSwgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRDYW5TcGxpdCh0cnVlKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpID09PSB0cnVlICYmIGF3YWl0IHRoaXMuaXNNdWx0aXNpZygpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcmVsYXkgbXVsdGlzaWcgdHJhbnNhY3Rpb24gdW50aWwgY28tc2lnbmVkXCIpO1xuXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3NlcyB0byBzZW5kIGZyb21cbiAgICBsZXQgYWNjb3VudElkeCA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHRoZSBhY2NvdW50IGluZGV4IHRvIHNlbmQgZnJvbVwiKTtcbiAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5zbGljZSgwKTsgLy8gZmV0Y2ggYWxsIG9yIGNvcHkgZ2l2ZW4gaW5kaWNlc1xuICAgIFxuICAgIC8vIGJ1aWxkIGNvbmZpZyBwYXJhbWV0ZXJzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmRlc3RpbmF0aW9ucyA9IFtdO1xuICAgIGZvciAobGV0IGRlc3RpbmF0aW9uIG9mIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0RGVzdGluYXRpb25zKCkpIHtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIFwiRGVzdGluYXRpb24gYWRkcmVzcyBpcyBub3QgZGVmaW5lZFwiKTtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBbW91bnQoKSwgXCJEZXN0aW5hdGlvbiBhbW91bnQgaXMgbm90IGRlZmluZWRcIik7XG4gICAgICBwYXJhbXMuZGVzdGluYXRpb25zLnB1c2goeyBhZGRyZXNzOiBkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIGFtb3VudDogZGVzdGluYXRpb24uZ2V0QW1vdW50KCkudG9TdHJpbmcoKSB9KTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkpIHBhcmFtcy5zdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzID0gY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IHN1YmFkZHJlc3NJbmRpY2VzO1xuICAgIHBhcmFtcy5wYXltZW50X2lkID0gY29uZmlnTm9ybWFsaXplZC5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpICE9PSB0cnVlO1xuICAgIGFzc2VydChjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSBwYXJhbXMuZ2V0X3R4X2tleXMgPSB0cnVlOyAvLyBwYXJhbSB0byBnZXQgdHgga2V5KHMpIGRlcGVuZHMgaWYgc3BsaXRcbiAgICBlbHNlIHBhcmFtcy5nZXRfdHhfa2V5ID0gdHJ1ZTtcblxuICAgIC8vIGNhbm5vdCBhcHBseSBzdWJ0cmFjdEZlZUZyb20gd2l0aCBgdHJhbnNmZXJfc3BsaXRgIGNhbGxcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKS5sZW5ndGggPiAwKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJzdWJ0cmFjdGZlZWZyb20gdHJhbnNmZXJzIGNhbm5vdCBiZSBzcGxpdCBvdmVyIG11bHRpcGxlIHRyYW5zYWN0aW9ucyB5ZXRcIik7XG4gICAgfVxuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IFwidHJhbnNmZXJfc3BsaXRcIiA6IFwidHJhbnNmZXJcIiwgcGFyYW1zKTtcbiAgICAgIHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIldBTExFVF9SUENfRVJST1JfQ09ERV9XUk9OR19BRERSRVNTXCIpID4gLTEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgZGVzdGluYXRpb24gYWRkcmVzc1wiKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gICAgXG4gICAgLy8gcHJlLWluaXRpYWxpemUgdHhzIGlmZiBwcmVzZW50LiBtdWx0aXNpZyBhbmQgdmlldy1vbmx5IHdhbGxldHMgd2lsbCBoYXZlIHR4IHNldCB3aXRob3V0IHRyYW5zYWN0aW9uc1xuICAgIGxldCB0eHM7XG4gICAgbGV0IG51bVR4cyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IChyZXN1bHQuZmVlX2xpc3QgIT09IHVuZGVmaW5lZCA/IHJlc3VsdC5mZWVfbGlzdC5sZW5ndGggOiAwKSA6IChyZXN1bHQuZmVlICE9PSB1bmRlZmluZWQgPyAxIDogMCk7XG4gICAgaWYgKG51bVR4cyA+IDApIHR4cyA9IFtdO1xuICAgIGxldCBjb3B5RGVzdGluYXRpb25zID0gbnVtVHhzID09PSAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVHhzOyBpKyspIHtcbiAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgICAgTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnTm9ybWFsaXplZCwgdHgsIGNvcHlEZXN0aW5hdGlvbnMpO1xuICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcyAhPT0gdW5kZWZpbmVkICYmIHN1YmFkZHJlc3NJbmRpY2VzLmxlbmd0aCA9PT0gMSkgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldFN1YmFkZHJlc3NJbmRpY2VzKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHNldCBmcm9tIHJwYyByZXNwb25zZSB3aXRoIHByZS1pbml0aWFsaXplZCB0eHNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQsIHR4cywgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gICAgZWxzZSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFRvVHhTZXQocmVzdWx0LCB0eHMgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHR4c1swXSwgdHJ1ZSwgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBidWlsZCByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCk7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBjb25maWcuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpO1xuICAgIHBhcmFtcy5rZXlfaW1hZ2UgPSBjb25maWcuZ2V0S2V5SW1hZ2UoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgIT09IHRydWU7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWcuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWcuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZy5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2tleSA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9oZXggPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfbWV0YWRhdGEgPSB0cnVlO1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfc2luZ2xlXCIsIHBhcmFtcyk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZy5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBidWlsZCBhbmQgcmV0dXJuIHR4XG4gICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnLCB1bmRlZmluZWQsIHRydWUpO1xuICAgIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhUb1R4U2V0KHJlc3VsdCwgdHgsIHRydWUsIGNvbmZpZyk7XG4gICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpWzBdLnNldEFtb3VudCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkpOyAvLyBpbml0aWFsaXplIGRlc3RpbmF0aW9uIGFtb3VudFxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwOyBkZWZhdWx0IHRvIGFsbCB3aXRoIHVubG9ja2VkIGJhbGFuY2UgaWYgbm90IHNwZWNpZmllZFxuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpOyAgLy8gbWFwcyBlYWNoIGFjY291bnQgaW5kZXggdG8gc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGluZGljZXMuc2V0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCksIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgaW5kaWNlcy5zZXQoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkpKSB7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgPiAwbikgc3ViYWRkcmVzc0luZGljZXMucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBhY2NvdW50cyA9IGF3YWl0IHRoaXMuZ2V0QWNjb3VudHModHJ1ZSk7XG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICAgIGlmIChhY2NvdW50LmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgICBpbmRpY2VzLnNldChhY2NvdW50LmdldEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc3dlZXAgZnJvbSBlYWNoIGFjY291bnQgYW5kIGNvbGxlY3QgcmVzdWx0aW5nIHR4IHNldHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYWNjb3VudElkeCBvZiBpbmRpY2VzLmtleXMoKSkge1xuICAgICAgXG4gICAgICAvLyBjb3B5IGFuZCBtb2RpZnkgdGhlIG9yaWdpbmFsIGNvbmZpZ1xuICAgICAgbGV0IGNvcHkgPSBjb25maWdOb3JtYWxpemVkLmNvcHkoKTtcbiAgICAgIGNvcHkuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgY29weS5zZXRTd2VlcEVhY2hTdWJhZGRyZXNzKGZhbHNlKTtcbiAgICAgIFxuICAgICAgLy8gc3dlZXAgYWxsIHN1YmFkZHJlc3NlcyB0b2dldGhlciAgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogY2FuIHRoaXMgcmV2ZWFsIG91dHB1dHMgYmVsb25nIHRvIHRoZSBzYW1lIHdhbGxldD9cbiAgICAgIGlmIChjb3B5LmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSAhPT0gdHJ1ZSkge1xuICAgICAgICBjb3B5LnNldFN1YmFkZHJlc3NJbmRpY2VzKGluZGljZXMuZ2V0KGFjY291bnRJZHgpKTtcbiAgICAgICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5ycGNTd2VlcEFjY291bnQoY29weSkpIHR4cy5wdXNoKHR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gb3RoZXJ3aXNlIHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyBpbmRpdmlkdWFsbHlcbiAgICAgIGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzSWR4IG9mIGluZGljZXMuZ2V0KGFjY291bnRJZHgpKSB7XG4gICAgICAgICAgY29weS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhbc3ViYWRkcmVzc0lkeF0pO1xuICAgICAgICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMucnBjU3dlZXBBY2NvdW50KGNvcHkpKSB0eHMucHVzaCh0eCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcER1c3QocmVsYXk/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHJlbGF5ID09PSB1bmRlZmluZWQpIHJlbGF5ID0gZmFsc2U7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzd2VlcF9kdXN0XCIsIHtkb19ub3RfcmVsYXk6ICFyZWxheX0pO1xuICAgIGlmIChyZWxheSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzdWx0KTtcbiAgICBpZiAodHhTZXQuZ2V0VHhzKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQoIXJlbGF5KTtcbiAgICAgIHR4LnNldEluVHhQb29sKHR4LmdldElzUmVsYXllZCgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0LmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhczogKE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKVtdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eEhhc2hlcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykge1xuICAgICAgbGV0IG1ldGFkYXRhID0gdHhPck1ldGFkYXRhIGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQgPyB0eE9yTWV0YWRhdGEuZ2V0TWV0YWRhdGEoKSA6IHR4T3JNZXRhZGF0YTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVsYXlfdHhcIiwgeyBoZXg6IG1ldGFkYXRhIH0pO1xuICAgICAgdHhIYXNoZXMucHVzaChyZXNwLnJlc3VsdC50eF9oYXNoKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7IC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgcmV0dXJuIHR4SGFzaGVzO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImRlc2NyaWJlX3RyYW5zZmVyXCIsIHtcbiAgICAgIHVuc2lnbmVkX3R4c2V0OiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCksXG4gICAgICBtdWx0aXNpZ190eHNldDogdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpXG4gICAgfSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlcihyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnbl90cmFuc2ZlclwiLCB7XG4gICAgICB1bnNpZ25lZF90eHNldDogdW5zaWduZWRUeEhleCxcbiAgICAgIGV4cG9ydF9yYXc6IGZhbHNlXG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeHMoc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN1Ym1pdF90cmFuc2ZlclwiLCB7XG4gICAgICB0eF9kYXRhX2hleDogc2lnbmVkVHhIZXhcbiAgICB9KTtcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQudHhfaGFzaF9saXN0O1xuICB9XG4gIFxuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIHNpZ25hdHVyZVR5cGUgPSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCBhY2NvdW50SWR4ID0gMCwgc3ViYWRkcmVzc0lkeCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnblwiLCB7XG4gICAgICAgIGRhdGE6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZV90eXBlOiBzaWduYXR1cmVUeXBlID09PSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZID8gXCJzcGVuZFwiIDogXCJ2aWV3XCIsXG4gICAgICAgIGFjY291bnRfaW5kZXg6IGFjY291bnRJZHgsXG4gICAgICAgIGFkZHJlc3NfaW5kZXg6IHN1YmFkZHJlc3NJZHhcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICB9XG4gIFxuICBhc3luYyB2ZXJpZnlNZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdD4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInZlcmlmeVwiLCB7ZGF0YTogbWVzc2FnZSwgYWRkcmVzczogYWRkcmVzcywgc2lnbmF0dXJlOiBzaWduYXR1cmV9KTtcbiAgICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdChcbiAgICAgICAgcmVzdWx0Lmdvb2QgPyB7aXNHb29kOiByZXN1bHQuZ29vZCwgaXNPbGQ6IHJlc3VsdC5vbGQsIHNpZ25hdHVyZVR5cGU6IHJlc3VsdC5zaWduYXR1cmVfdHlwZSA9PT0gXCJ2aWV3XCIgPyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfVklFV19LRVkgOiBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCB2ZXJzaW9uOiByZXN1bHQudmVyc2lvbn0gOiB7aXNHb29kOiBmYWxzZX1cbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0yKSByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQoe2lzR29vZDogZmFsc2V9KTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeEtleSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3R4X2tleVwiLCB7dHhpZDogdHhIYXNofSkpLnJlc3VsdC50eF9rZXk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhLZXkodHhIYXNoOiBzdHJpbmcsIHR4S2V5OiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja190eF9rZXlcIiwge3R4aWQ6IHR4SGFzaCwgdHhfa2V5OiB0eEtleSwgYWRkcmVzczogYWRkcmVzc30pO1xuICAgICAgXG4gICAgICAvLyBpbnRlcnByZXQgcmVzdWx0XG4gICAgICBsZXQgY2hlY2sgPSBuZXcgTW9uZXJvQ2hlY2tUeCgpO1xuICAgICAgY2hlY2suc2V0SXNHb29kKHRydWUpO1xuICAgICAgY2hlY2suc2V0TnVtQ29uZmlybWF0aW9ucyhyZXNwLnJlc3VsdC5jb25maXJtYXRpb25zKTtcbiAgICAgIGNoZWNrLnNldEluVHhQb29sKHJlc3AucmVzdWx0LmluX3Bvb2wpO1xuICAgICAgY2hlY2suc2V0UmVjZWl2ZWRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnJlY2VpdmVkKSk7XG4gICAgICByZXR1cm4gY2hlY2s7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3R4X3Byb29mXCIsIHt0eGlkOiB0eEhhc2gsIGFkZHJlc3M6IGFkZHJlc3MsIG1lc3NhZ2U6IG1lc3NhZ2V9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgdHJ5IHtcbiAgICAgIFxuICAgICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3R4X3Byb29mXCIsIHtcbiAgICAgICAgdHhpZDogdHhIYXNoLFxuICAgICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzaWduYXR1cmU6IHNpZ25hdHVyZVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIGludGVycHJldCByZXNwb25zZVxuICAgICAgbGV0IGlzR29vZCA9IHJlc3AucmVzdWx0Lmdvb2Q7XG4gICAgICBsZXQgY2hlY2sgPSBuZXcgTW9uZXJvQ2hlY2tUeCgpO1xuICAgICAgY2hlY2suc2V0SXNHb29kKGlzR29vZCk7XG4gICAgICBpZiAoaXNHb29kKSB7XG4gICAgICAgIGNoZWNrLnNldE51bUNvbmZpcm1hdGlvbnMocmVzcC5yZXN1bHQuY29uZmlybWF0aW9ucyk7XG4gICAgICAgIGNoZWNrLnNldEluVHhQb29sKHJlc3AucmVzdWx0LmluX3Bvb2wpO1xuICAgICAgICBjaGVjay5zZXRSZWNlaXZlZEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQucmVjZWl2ZWQpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjaGVjaztcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC0xICYmIGUubWVzc2FnZSA9PT0gXCJiYXNpY19zdHJpbmdcIikgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIk11c3QgcHJvdmlkZSBzaWduYXR1cmUgdG8gY2hlY2sgdHggcHJvb2ZcIiwgLTEpO1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9zcGVuZF9wcm9vZlwiLCB7dHhpZDogdHhIYXNoLCBtZXNzYWdlOiBtZXNzYWdlfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja19zcGVuZF9wcm9vZlwiLCB7XG4gICAgICAgIHR4aWQ6IHR4SGFzaCxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0Lmdvb2Q7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFsbDogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgYW1vdW50OiBiaWdpbnQsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3Jlc2VydmVfcHJvb2ZcIiwge1xuICAgICAgYWNjb3VudF9pbmRleDogYWNjb3VudElkeCxcbiAgICAgIGFtb3VudDogYW1vdW50LnRvU3RyaW5nKCksXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuXG4gIGFzeW5jIGNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tSZXNlcnZlPiB7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja19yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFkZHJlc3M6IGFkZHJlc3MsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICB9KTtcbiAgICBcbiAgICAvLyBpbnRlcnByZXQgcmVzdWx0c1xuICAgIGxldCBpc0dvb2QgPSByZXNwLnJlc3VsdC5nb29kO1xuICAgIGxldCBjaGVjayA9IG5ldyBNb25lcm9DaGVja1Jlc2VydmUoKTtcbiAgICBjaGVjay5zZXRJc0dvb2QoaXNHb29kKTtcbiAgICBpZiAoaXNHb29kKSB7XG4gICAgICBjaGVjay5zZXRVbmNvbmZpcm1lZFNwZW50QW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5zcGVudCkpO1xuICAgICAgY2hlY2suc2V0VG90YWxBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnRvdGFsKSk7XG4gICAgfVxuICAgIHJldHVybiBjaGVjaztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHhfbm90ZXNcIiwge3R4aWRzOiB0eEhhc2hlc30pKS5yZXN1bHQubm90ZXM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdLCBub3Rlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfdHhfbm90ZXNcIiwge3R4aWRzOiB0eEhhc2hlcywgbm90ZXM6IG5vdGVzfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVtdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc19ib29rXCIsIHtlbnRyaWVzOiBlbnRyeUluZGljZXN9KTtcbiAgICBpZiAoIXJlc3AucmVzdWx0LmVudHJpZXMpIHJldHVybiBbXTtcbiAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0LmVudHJpZXMpIHtcbiAgICAgIGVudHJpZXMucHVzaChuZXcgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSgpLnNldEluZGV4KHJwY0VudHJ5LmluZGV4KS5zZXRBZGRyZXNzKHJwY0VudHJ5LmFkZHJlc3MpLnNldERlc2NyaXB0aW9uKHJwY0VudHJ5LmRlc2NyaXB0aW9uKS5zZXRQYXltZW50SWQocnBjRW50cnkucGF5bWVudF9pZCkpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzOiBzdHJpbmcsIGRlc2NyaXB0aW9uPzogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImFkZF9hZGRyZXNzX2Jvb2tcIiwge2FkZHJlc3M6IGFkZHJlc3MsIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbn0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5pbmRleDtcbiAgfVxuICBcbiAgYXN5bmMgZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXg6IG51bWJlciwgc2V0QWRkcmVzczogYm9vbGVhbiwgYWRkcmVzczogc3RyaW5nIHwgdW5kZWZpbmVkLCBzZXREZXNjcmlwdGlvbjogYm9vbGVhbiwgZGVzY3JpcHRpb246IHN0cmluZyB8IHVuZGVmaW5lZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZWRpdF9hZGRyZXNzX2Jvb2tcIiwge1xuICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgc2V0X2FkZHJlc3M6IHNldEFkZHJlc3MsXG4gICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgc2V0X2Rlc2NyaXB0aW9uOiBzZXREZXNjcmlwdGlvbixcbiAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJkZWxldGVfYWRkcmVzc19ib29rXCIsIHtpbmRleDogZW50cnlJZHh9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGFnQWNjb3VudHModGFnLCBhY2NvdW50SW5kaWNlcykge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInRhZ19hY2NvdW50c1wiLCB7dGFnOiB0YWcsIGFjY291bnRzOiBhY2NvdW50SW5kaWNlc30pO1xuICB9XG5cbiAgYXN5bmMgdW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ1bnRhZ19hY2NvdW50c1wiLCB7YWNjb3VudHM6IGFjY291bnRJbmRpY2VzfSk7XG4gIH1cblxuICBhc3luYyBnZXRBY2NvdW50VGFncygpOiBQcm9taXNlPE1vbmVyb0FjY291bnRUYWdbXT4ge1xuICAgIGxldCB0YWdzID0gW107XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWNjb3VudF90YWdzXCIpO1xuICAgIGlmIChyZXNwLnJlc3VsdC5hY2NvdW50X3RhZ3MpIHtcbiAgICAgIGZvciAobGV0IHJwY0FjY291bnRUYWcgb2YgcmVzcC5yZXN1bHQuYWNjb3VudF90YWdzKSB7XG4gICAgICAgIHRhZ3MucHVzaChuZXcgTW9uZXJvQWNjb3VudFRhZyh7XG4gICAgICAgICAgdGFnOiBycGNBY2NvdW50VGFnLnRhZyA/IHJwY0FjY291bnRUYWcudGFnIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGxhYmVsOiBycGNBY2NvdW50VGFnLmxhYmVsID8gcnBjQWNjb3VudFRhZy5sYWJlbCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBhY2NvdW50SW5kaWNlczogcnBjQWNjb3VudFRhZy5hY2NvdW50c1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YWdzO1xuICB9XG5cbiAgYXN5bmMgc2V0QWNjb3VudFRhZ0xhYmVsKHRhZzogc3RyaW5nLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2FjY291bnRfdGFnX2Rlc2NyaXB0aW9uXCIsIHt0YWc6IHRhZywgZGVzY3JpcHRpb246IGxhYmVsfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBheW1lbnRVcmkoY29uZmlnOiBNb25lcm9UeENvbmZpZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibWFrZV91cmlcIiwge1xuICAgICAgYWRkcmVzczogY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSxcbiAgICAgIGFtb3VudDogY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFtb3VudCgpID8gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFtb3VudCgpLnRvU3RyaW5nKCkgOiB1bmRlZmluZWQsXG4gICAgICBwYXltZW50X2lkOiBjb25maWcuZ2V0UGF5bWVudElkKCksXG4gICAgICByZWNpcGllbnRfbmFtZTogY29uZmlnLmdldFJlY2lwaWVudE5hbWUoKSxcbiAgICAgIHR4X2Rlc2NyaXB0aW9uOiBjb25maWcuZ2V0Tm90ZSgpXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnVyaTtcbiAgfVxuICBcbiAgYXN5bmMgcGFyc2VQYXltZW50VXJpKHVyaTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeENvbmZpZz4ge1xuICAgIGFzc2VydCh1cmksIFwiTXVzdCBwcm92aWRlIFVSSSB0byBwYXJzZVwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInBhcnNlX3VyaVwiLCB7dXJpOiB1cml9KTtcbiAgICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKHthZGRyZXNzOiByZXNwLnJlc3VsdC51cmkuYWRkcmVzcywgYW1vdW50OiBCaWdJbnQocmVzcC5yZXN1bHQudXJpLmFtb3VudCl9KTtcbiAgICBjb25maWcuc2V0UGF5bWVudElkKHJlc3AucmVzdWx0LnVyaS5wYXltZW50X2lkKTtcbiAgICBjb25maWcuc2V0UmVjaXBpZW50TmFtZShyZXNwLnJlc3VsdC51cmkucmVjaXBpZW50X25hbWUpO1xuICAgIGNvbmZpZy5zZXROb3RlKHJlc3AucmVzdWx0LnVyaS50eF9kZXNjcmlwdGlvbik7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkpIGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5zZXRBZGRyZXNzKHVuZGVmaW5lZCk7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXRQYXltZW50SWQoKSkgY29uZmlnLnNldFBheW1lbnRJZCh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0UmVjaXBpZW50TmFtZSgpKSBjb25maWcuc2V0UmVjaXBpZW50TmFtZSh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0Tm90ZSgpKSBjb25maWcuc2V0Tm90ZSh1bmRlZmluZWQpO1xuICAgIHJldHVybiBjb25maWc7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2F0dHJpYnV0ZVwiLCB7a2V5OiBrZXl9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC52YWx1ZSA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHJlc3AucmVzdWx0LnZhbHVlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTQ1KSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXk6IHN0cmluZywgdmFsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYXR0cmlidXRlXCIsIHtrZXk6IGtleSwgdmFsdWU6IHZhbH0pO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzOiBudW1iZXIsIGJhY2tncm91bmRNaW5pbmc/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0YXJ0X21pbmluZ1wiLCB7XG4gICAgICB0aHJlYWRzX2NvdW50OiBudW1UaHJlYWRzLFxuICAgICAgZG9fYmFja2dyb3VuZF9taW5pbmc6IGJhY2tncm91bmRNaW5pbmcsXG4gICAgICBpZ25vcmVfYmF0dGVyeTogaWdub3JlQmF0dGVyeVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3BfbWluaW5nXCIpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnSW1wb3J0TmVlZGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm11bHRpc2lnX2ltcG9ydF9uZWVkZWQgPT09IHRydWU7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE11bHRpc2lnSW5mbygpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5mbz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaXNfbXVsdGlzaWdcIik7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCBpbmZvID0gbmV3IE1vbmVyb011bHRpc2lnSW5mbygpO1xuICAgIGluZm8uc2V0SXNNdWx0aXNpZyhyZXN1bHQubXVsdGlzaWcpO1xuICAgIGluZm8uc2V0SXNSZWFkeShyZXN1bHQucmVhZHkpO1xuICAgIGluZm8uc2V0VGhyZXNob2xkKHJlc3VsdC50aHJlc2hvbGQpO1xuICAgIGluZm8uc2V0TnVtUGFydGljaXBhbnRzKHJlc3VsdC50b3RhbCk7XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbiAgXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicHJlcGFyZV9tdWx0aXNpZ1wiLCB7ZW5hYmxlX211bHRpc2lnX2V4cGVyaW1lbnRhbDogdHJ1ZX0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIHJldHVybiByZXN1bHQubXVsdGlzaWdfaW5mbztcbiAgfVxuICBcbiAgYXN5bmMgbWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCB0aHJlc2hvbGQ6IG51bWJlciwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJtYWtlX211bHRpc2lnXCIsIHtcbiAgICAgIG11bHRpc2lnX2luZm86IG11bHRpc2lnSGV4ZXMsXG4gICAgICB0aHJlc2hvbGQ6IHRocmVzaG9sZCxcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZFxuICAgIH0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm11bHRpc2lnX2luZm87XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4Y2hhbmdlX211bHRpc2lnX2tleXNcIiwge211bHRpc2lnX2luZm86IG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkOiBwYXNzd29yZH0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgbGV0IG1zUmVzdWx0ID0gbmV3IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCgpO1xuICAgIG1zUmVzdWx0LnNldEFkZHJlc3MocmVzcC5yZXN1bHQuYWRkcmVzcyk7XG4gICAgbXNSZXN1bHQuc2V0TXVsdGlzaWdIZXgocmVzcC5yZXN1bHQubXVsdGlzaWdfaW5mbyk7XG4gICAgaWYgKG1zUmVzdWx0LmdldEFkZHJlc3MoKS5sZW5ndGggPT09IDApIG1zUmVzdWx0LnNldEFkZHJlc3ModW5kZWZpbmVkKTtcbiAgICBpZiAobXNSZXN1bHQuZ2V0TXVsdGlzaWdIZXgoKS5sZW5ndGggPT09IDApIG1zUmVzdWx0LnNldE11bHRpc2lnSGV4KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIG1zUmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRNdWx0aXNpZ0hleCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X211bHRpc2lnX2luZm9cIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmluZm87XG4gIH1cblxuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcmVmcmVzaEFmdGVySW1wb3J0PzogYm9vbGVhbik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHJlZnJlc2hBZnRlckltcG9ydCA9PT0gdW5kZWZpbmVkKSByZWZyZXNoQWZ0ZXJJbXBvcnQgPSB0cnVlO1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShtdWx0aXNpZ0hleGVzKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN0cmluZ1tdIHRvIGltcG9ydE11bHRpc2lnSGV4KClcIilcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9tdWx0aXNpZ19pbmZvXCIsIHtpbmZvOiBtdWx0aXNpZ0hleGVzLCByZWZyZXNoX2FmdGVyX2ltcG9ydDogcmVmcmVzaEFmdGVySW1wb3J0fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm5fb3V0cHV0cztcbiAgfVxuXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzaWduX211bHRpc2lnXCIsIHt0eF9kYXRhX2hleDogbXVsdGlzaWdUeEhleH0pO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgc2lnblJlc3VsdCA9IG5ldyBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQoKTtcbiAgICBzaWduUmVzdWx0LnNldFNpZ25lZE11bHRpc2lnVHhIZXgocmVzdWx0LnR4X2RhdGFfaGV4KTtcbiAgICBzaWduUmVzdWx0LnNldFR4SGFzaGVzKHJlc3VsdC50eF9oYXNoX2xpc3QpO1xuICAgIHJldHVybiBzaWduUmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfbXVsdGlzaWdcIiwge3R4X2RhdGFfaGV4OiBzaWduZWRNdWx0aXNpZ1R4SGV4fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQ6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkXCIsIHtvbGRfcGFzc3dvcmQ6IG9sZFBhc3N3b3JkIHx8IFwiXCIsIG5ld19wYXNzd29yZDogbmV3UGFzc3dvcmQgfHwgXCJcIn0pO1xuICB9XG4gIFxuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3JlXCIpO1xuICB9XG4gIFxuICBhc3luYyBjbG9zZShzYXZlID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5jbG9zZShzYXZlKTtcbiAgICBpZiAoc2F2ZSA9PT0gdW5kZWZpbmVkKSBzYXZlID0gZmFsc2U7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNsb3NlX3dhbGxldFwiLCB7YXV0b3NhdmVfY3VycmVudDogc2F2ZX0pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nsb3NlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmV0dXJuIGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTEzICYmIGUubWVzc2FnZS5pbmRleE9mKFwiTm8gd2FsbGV0IGZpbGVcIikgPiAtMTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICAvKipcbiAgICogU2F2ZSBhbmQgY2xvc2UgdGhlIGN1cnJlbnQgd2FsbGV0IGFuZCBzdG9wIHRoZSBSUEMgc2VydmVyLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3Bfd2FsbGV0XCIpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuXG4gIGFzeW5jIGdldE51bUJsb2Nrc1RvVW5sb2NrKCk6IFByb21pc2U8bnVtYmVyW118dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXROdW1CbG9ja3NUb1VubG9jaygpOyB9XG4gIGFzeW5jIGdldFR4KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldHx1bmRlZmluZWQ+IHsgcmV0dXJuIHN1cGVyLmdldFR4KHR4SGFzaCk7IH1cbiAgYXN5bmMgZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb0luY29taW5nVHJhbnNmZXJbXT4geyByZXR1cm4gc3VwZXIuZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KSB7IHJldHVybiBzdXBlci5nZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeSk7IH1cbiAgYXN5bmMgY3JlYXRlVHgoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHsgcmV0dXJuIHN1cGVyLmNyZWF0ZVR4KGNvbmZpZyk7IH1cbiAgYXN5bmMgcmVsYXlUeCh0eE9yTWV0YWRhdGE6IE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLnJlbGF5VHgodHhPck1ldGFkYXRhKTsgfVxuICBhc3luYyBnZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIuZ2V0VHhOb3RlKHR4SGFzaCk7IH1cbiAgYXN5bmMgc2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nLCBub3RlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHN1cGVyLnNldFR4Tm90ZSh0eEhhc2gsIG5vdGUpOyB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHN0YXRpYyBhc3luYyBjb25uZWN0VG9XYWxsZXRScGModXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBsZXQgY29uZmlnID0gTW9uZXJvV2FsbGV0UnBjLm5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZywgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICBpZiAoY29uZmlnLmNtZCkgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5zdGFydFdhbGxldFJwY1Byb2Nlc3MoY29uZmlnKTtcbiAgICBlbHNlIHJldHVybiBuZXcgTW9uZXJvV2FsbGV0UnBjKGNvbmZpZyk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgc3RhcnRXYWxsZXRScGNQcm9jZXNzKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNBcnJheShjb25maWcuY21kKSwgXCJNdXN0IHByb3ZpZGUgc3RyaW5nIGFycmF5IHdpdGggY29tbWFuZCBsaW5lIHBhcmFtZXRlcnNcIik7XG4gICAgXG4gICAgLy8gc3RhcnQgcHJvY2Vzc1xuICAgIGxldCBjaGlsZF9wcm9jZXNzID0gYXdhaXQgaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKTtcbiAgICBjb25zdCBjaGlsZFByb2Nlc3MgPSBjaGlsZF9wcm9jZXNzLnNwYXduKGNvbmZpZy5jbWRbMF0sIGNvbmZpZy5jbWQuc2xpY2UoMSksIHtcbiAgICAgIGVudjogeyAuLi5wcm9jZXNzLmVudiwgTEFORzogJ2VuX1VTLlVURi04JyB9IC8vIHNjcmFwZSBvdXRwdXQgaW4gZW5nbGlzaFxuICAgIH0pO1xuICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgYWZ0ZXIgc3RhcnRpbmcgbW9uZXJvLXdhbGxldC1ycGNcbiAgICBsZXQgdXJpO1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICBsZXQgb3V0cHV0ID0gXCJcIjtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRvdXRcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5vbignZGF0YScsIGFzeW5jIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBsZXQgbGluZSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDIsIGxpbmUpO1xuICAgICAgICAgIG91dHB1dCArPSBsaW5lICsgJ1xcbic7IC8vIGNhcHR1cmUgb3V0cHV0IGluIGNhc2Ugb2YgZXJyb3JcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBleHRyYWN0IHVyaSBmcm9tIGUuZy4gXCJJIEJpbmRpbmcgb24gMTI3LjAuMC4xIChJUHY0KTozODA4NVwiXG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWlucyA9IFwiQmluZGluZyBvbiBcIjtcbiAgICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zSWR4ID0gbGluZS5pbmRleE9mKHVyaUxpbmVDb250YWlucyk7XG4gICAgICAgICAgaWYgKHVyaUxpbmVDb250YWluc0lkeCA+PSAwKSB7XG4gICAgICAgICAgICBsZXQgaG9zdCA9IGxpbmUuc3Vic3RyaW5nKHVyaUxpbmVDb250YWluc0lkeCArIHVyaUxpbmVDb250YWlucy5sZW5ndGgsIGxpbmUubGFzdEluZGV4T2YoJyAnKSk7XG4gICAgICAgICAgICBsZXQgdW5mb3JtYXR0ZWRMaW5lID0gbGluZS5yZXBsYWNlKC9cXHUwMDFiXFxbLio/bS9nLCAnJykudHJpbSgpOyAvLyByZW1vdmUgY29sb3IgZm9ybWF0dGluZ1xuICAgICAgICAgICAgbGV0IHBvcnQgPSB1bmZvcm1hdHRlZExpbmUuc3Vic3RyaW5nKHVuZm9ybWF0dGVkTGluZS5sYXN0SW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBsZXQgc3NsSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtc3NsXCIpO1xuICAgICAgICAgICAgbGV0IHNzbEVuYWJsZWQgPSBzc2xJZHggPj0gMCA/IFwiZW5hYmxlZFwiID09IGNvbmZpZy5jbWRbc3NsSWR4ICsgMV0udG9Mb3dlckNhc2UoKSA6IGZhbHNlO1xuICAgICAgICAgICAgdXJpID0gKHNzbEVuYWJsZWQgPyBcImh0dHBzXCIgOiBcImh0dHBcIikgKyBcIjovL1wiICsgaG9zdCArIFwiOlwiICsgcG9ydDtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVhZCBzdWNjZXNzIG1lc3NhZ2VcbiAgICAgICAgICBpZiAobGluZS5pbmRleE9mKFwiU3RhcnRpbmcgd2FsbGV0IFJQQyBzZXJ2ZXJcIikgPj0gMCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBnZXQgdXNlcm5hbWUsIHBhc3N3b3JkLCB6bXEgcHVibGlzaCB1cmksIGFuZCBwcm94eSB1cmkgZnJvbSBwYXJhbXNcbiAgICAgICAgICAgIGxldCB1c2VyUGFzc0lkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLWxvZ2luXCIpO1xuICAgICAgICAgICAgbGV0IHVzZXJQYXNzID0gdXNlclBhc3NJZHggPj0gMCA/IGNvbmZpZy5jbWRbdXNlclBhc3NJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcoMCwgdXNlclBhc3MuaW5kZXhPZignOicpKTtcbiAgICAgICAgICAgIGxldCBwYXNzd29yZCA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcodXNlclBhc3MuaW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBsZXQgem1xVXJpSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS16bXEtcHViXCIpO1xuICAgICAgICAgICAgbGV0IHptcVVyaSA9IHptcVVyaUlkeCA+PSAwID8gY29uZmlnLmNtZFt6bXFVcmlJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCBwcm94eVVyaUlkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcHJveHlcIik7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0dXBQcm94eVVyaSA9IHByb3h5VXJpSWR4ID49IDAgPyBjb25maWcuY21kW3Byb3h5VXJpSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3NcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZy5jb3B5KCkuc2V0U2VydmVyKHt1cmk6IHVyaSwgdXNlcm5hbWU6IHVzZXJuYW1lLCBwYXNzd29yZDogcGFzc3dvcmQsIHptcVVyaTogem1xVXJpLCBwcm94eVVyaTogdGhpcy5zdGFydHVwUHJveHlVcmksIHJlamVjdFVuYXV0aG9yaXplZDogY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkfSk7XG4gICAgICAgICAgICBjb25maWcuY21kID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldFJwYy5jb25uZWN0VG9XYWxsZXRScGMoY29uZmlnKTtcbiAgICAgICAgICAgIHdhbGxldC5wcm9jZXNzID0gY2hpbGRQcm9jZXNzO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyByZXNvbHZlIHByb21pc2Ugd2l0aCBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3MgXG4gICAgICAgICAgICB0aGlzLmlzUmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZSh3YWxsZXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3RkZXJyXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRlcnIub24oJ2RhdGEnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIGNvbnNvbGUuZXJyb3IoZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIGV4aXRcbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwiZXhpdFwiLCBmdW5jdGlvbihjb2RlKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBwcm9jZXNzIHRlcm1pbmF0ZWQgd2l0aCBleGl0IGNvZGUgXCIgKyBjb2RlICsgKG91dHB1dCA/IFwiOlxcblxcblwiICsgb3V0cHV0IDogXCJcIikpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXJyb3JcbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgaWYgKGVyci5tZXNzYWdlLmluZGV4T2YoXCJFTk9FTlRcIikgPj0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGV4aXN0IGF0IHBhdGggJ1wiICsgY29uZmlnLmNtZFswXSArIFwiJ1wiKSk7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSB1bmNhdWdodCBleGNlcHRpb25cbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIiwgZnVuY3Rpb24oZXJyLCBvcmlnaW4pIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5jYXVnaHQgZXhjZXB0aW9uIGluIG1vbmVyby13YWxsZXQtcnBjIHByb2Nlc3M6IFwiICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3Iob3JpZ2luKTtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY2xlYXIoKSB7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gICAgZGVsZXRlIHRoaXMuYWRkcmVzc0NhY2hlO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgdGhpcy5wYXRoID0gdW5kZWZpbmVkO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QWNjb3VudEluZGljZXMoZ2V0U3ViYWRkcmVzc0luZGljZXM/OiBhbnkpIHtcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTtcbiAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgaW5kaWNlcy5zZXQoYWNjb3VudC5nZXRJbmRleCgpLCBnZXRTdWJhZGRyZXNzSW5kaWNlcyA/IGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc0luZGljZXMoYWNjb3VudC5nZXRJbmRleCgpKSA6IHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIHJldHVybiBpbmRpY2VzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0U3ViYWRkcmVzc0luZGljZXMoYWNjb3VudElkeCkge1xuICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NcIiwge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHh9KTtcbiAgICBmb3IgKGxldCBhZGRyZXNzIG9mIHJlc3AucmVzdWx0LmFkZHJlc3Nlcykgc3ViYWRkcmVzc0luZGljZXMucHVzaChhZGRyZXNzLmFkZHJlc3NfaW5kZXgpO1xuICAgIHJldHVybiBzdWJhZGRyZXNzSW5kaWNlcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldFRyYW5zZmVyc0F1eChxdWVyeTogTW9uZXJvVHJhbnNmZXJRdWVyeSkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHBhcmFtcyBmb3IgZ2V0X3RyYW5zZmVycyBycGMgY2FsbFxuICAgIGxldCB0eFF1ZXJ5ID0gcXVlcnkuZ2V0VHhRdWVyeSgpO1xuICAgIGxldCBjYW5CZUNvbmZpcm1lZCA9IHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldElzUmVsYXllZCgpICE9PSBmYWxzZTtcbiAgICBsZXQgY2FuQmVJblR4UG9vbCA9IHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEhlaWdodCgpID09PSB1bmRlZmluZWQgJiYgdHhRdWVyeS5nZXRNYXhIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4UXVlcnkuZ2V0SXNMb2NrZWQoKSAhPT0gZmFsc2U7XG4gICAgbGV0IGNhbkJlSW5jb21pbmcgPSBxdWVyeS5nZXRJc0luY29taW5nKCkgIT09IGZhbHNlICYmIHF1ZXJ5LmdldElzT3V0Z29pbmcoKSAhPT0gdHJ1ZSAmJiBxdWVyeS5nZXRIYXNEZXN0aW5hdGlvbnMoKSAhPT0gdHJ1ZTtcbiAgICBsZXQgY2FuQmVPdXRnb2luZyA9IHF1ZXJ5LmdldElzT3V0Z29pbmcoKSAhPT0gZmFsc2UgJiYgcXVlcnkuZ2V0SXNJbmNvbWluZygpICE9PSB0cnVlO1xuXG4gICAgLy8gY2hlY2sgaWYgZmV0Y2hpbmcgcG9vbCB0eHMgY29udHJhZGljdGVkIGJ5IGNvbmZpZ3VyYXRpb25cbiAgICBpZiAodHhRdWVyeS5nZXRJblR4UG9vbCgpID09PSB0cnVlICYmICFjYW5CZUluVHhQb29sKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgZmV0Y2ggcG9vbCB0cmFuc2FjdGlvbnMgYmVjYXVzZSBpdCBjb250cmFkaWN0cyBjb25maWd1cmF0aW9uXCIpO1xuICAgIH1cblxuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5pbiA9IGNhbkJlSW5jb21pbmcgJiYgY2FuQmVDb25maXJtZWQ7XG4gICAgcGFyYW1zLm91dCA9IGNhbkJlT3V0Z29pbmcgJiYgY2FuQmVDb25maXJtZWQ7XG4gICAgcGFyYW1zLnBvb2wgPSBjYW5CZUluY29taW5nICYmIGNhbkJlSW5UeFBvb2w7XG4gICAgcGFyYW1zLnBlbmRpbmcgPSBjYW5CZU91dGdvaW5nICYmIGNhbkJlSW5UeFBvb2w7XG4gICAgcGFyYW1zLmZhaWxlZCA9IHR4UXVlcnkuZ2V0SXNGYWlsZWQoKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJc0NvbmZpcm1lZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPSB0cnVlO1xuICAgIGlmICh0eFF1ZXJ5LmdldE1pbkhlaWdodCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eFF1ZXJ5LmdldE1pbkhlaWdodCgpID4gMCkgcGFyYW1zLm1pbl9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpIC0gMTsgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogd2FsbGV0Mjo6Z2V0X3BheW1lbnRzKCkgbWluX2hlaWdodCBpcyBleGNsdXNpdmUsIHNvIG1hbnVhbGx5IG9mZnNldCB0byBtYXRjaCBpbnRlbmRlZCByYW5nZSAoaXNzdWVzICM1NzUxLCAjNTU5OClcbiAgICAgIGVsc2UgcGFyYW1zLm1pbl9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpO1xuICAgIH1cbiAgICBpZiAodHhRdWVyeS5nZXRNYXhIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSBwYXJhbXMubWF4X2hlaWdodCA9IHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCk7XG4gICAgcGFyYW1zLmZpbHRlcl9ieV9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1pbkhlaWdodCgpICE9PSB1bmRlZmluZWQgfHwgdHhRdWVyeS5nZXRNYXhIZWlnaHQoKSAhPT0gdW5kZWZpbmVkO1xuICAgIGlmIChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkgPT09IHVuZGVmaW5lZCAmJiBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQsIFwiUXVlcnkgc3BlY2lmaWVzIGEgc3ViYWRkcmVzcyBpbmRleCBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIik7XG4gICAgICBwYXJhbXMuYWxsX2FjY291bnRzID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBxdWVyeS5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICAgIFxuICAgICAgLy8gc2V0IHN1YmFkZHJlc3MgaW5kaWNlcyBwYXJhbVxuICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gbmV3IFNldCgpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpICE9PSB1bmRlZmluZWQpIHN1YmFkZHJlc3NJbmRpY2VzLmFkZChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLm1hcChzdWJhZGRyZXNzSWR4ID0+IHN1YmFkZHJlc3NJbmRpY2VzLmFkZChzdWJhZGRyZXNzSWR4KSk7XG4gICAgICBpZiAoc3ViYWRkcmVzc0luZGljZXMuc2l6ZSkgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IEFycmF5LmZyb20oc3ViYWRkcmVzc0luZGljZXMpO1xuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB1bmlxdWUgdHhzIGFuZCBibG9ja3NcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBcbiAgICAvLyBidWlsZCB0eHMgdXNpbmcgYGdldF90cmFuc2ZlcnNgXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHJhbnNmZXJzXCIsIHBhcmFtcyk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJlc3AucmVzdWx0KSkge1xuICAgICAgZm9yIChsZXQgcnBjVHggb2YgcmVzcC5yZXN1bHRba2V5XSkge1xuICAgICAgICAvL2lmIChycGNUeC50eGlkID09PSBxdWVyeS5kZWJ1Z1R4SWQpIGNvbnNvbGUubG9nKHJwY1R4KTtcbiAgICAgICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlcihycGNUeCk7XG4gICAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSBhc3NlcnQodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSA+IC0xKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlcGxhY2UgdHJhbnNmZXIgYW1vdW50IHdpdGggZGVzdGluYXRpb24gc3VtXG4gICAgICAgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IGNvbmZpcm1lZCB0eCBmcm9tL3RvIHNhbWUgYWNjb3VudCBoYXMgYW1vdW50IDAgYnV0IGNhY2hlZCB0cmFuc2ZlcnNcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldElzUmVsYXllZCgpICYmICF0eC5nZXRJc0ZhaWxlZCgpICYmXG4gICAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkgJiYgdHguZ2V0T3V0Z29pbmdBbW91bnQoKSA9PT0gMG4pIHtcbiAgICAgICAgICBsZXQgb3V0Z29pbmdUcmFuc2ZlciA9IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKTtcbiAgICAgICAgICBsZXQgdHJhbnNmZXJUb3RhbCA9IEJpZ0ludCgwKTtcbiAgICAgICAgICBmb3IgKGxldCBkZXN0aW5hdGlvbiBvZiBvdXRnb2luZ1RyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpKSB0cmFuc2ZlclRvdGFsID0gdHJhbnNmZXJUb3RhbCArIGRlc3RpbmF0aW9uLmdldEFtb3VudCgpO1xuICAgICAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBbW91bnQodHJhbnNmZXJUb3RhbCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIG1lcmdlIHR4XG4gICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzb3J0IHR4cyBieSBibG9jayBoZWlnaHRcbiAgICBsZXQgdHhzOiBNb25lcm9UeFdhbGxldFtdID0gT2JqZWN0LnZhbHVlcyh0eE1hcCk7XG4gICAgdHhzLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVUeHNCeUhlaWdodCk7XG4gICAgXG4gICAgLy8gZmlsdGVyIGFuZCByZXR1cm4gdHJhbnNmZXJzXG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgXG4gICAgICAvLyB0eCBpcyBub3QgaW5jb21pbmcvb3V0Z29pbmcgdW5sZXNzIGFscmVhZHkgc2V0XG4gICAgICBpZiAodHguZ2V0SXNJbmNvbWluZygpID09PSB1bmRlZmluZWQpIHR4LnNldElzSW5jb21pbmcoZmFsc2UpO1xuICAgICAgaWYgKHR4LmdldElzT3V0Z29pbmcoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc091dGdvaW5nKGZhbHNlKTtcbiAgICAgIFxuICAgICAgLy8gc29ydCBpbmNvbWluZyB0cmFuc2ZlcnNcbiAgICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZUluY29taW5nVHJhbnNmZXJzKTtcbiAgICAgIFxuICAgICAgLy8gY29sbGVjdCBxdWVyaWVkIHRyYW5zZmVycywgZXJhc2UgaWYgZXhjbHVkZWRcbiAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmZpbHRlclRyYW5zZmVycyhxdWVyeSkpIHtcbiAgICAgICAgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyByZW1vdmUgdHhzIHdpdGhvdXQgcmVxdWVzdGVkIHRyYW5zZmVyXG4gICAgICBpZiAodHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PT0gdW5kZWZpbmVkICYmIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0eC5nZXRCbG9jaygpLmdldFR4cygpLnNwbGljZSh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldE91dHB1dHNBdXgocXVlcnkpIHtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzIHRvIGJlIHF1ZXJpZWRcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTtcbiAgICBpZiAocXVlcnkuZ2V0QWNjb3VudEluZGV4KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gbmV3IFNldCgpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpICE9PSB1bmRlZmluZWQpIHN1YmFkZHJlc3NJbmRpY2VzLmFkZChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLm1hcChzdWJhZGRyZXNzSWR4ID0+IHN1YmFkZHJlc3NJbmRpY2VzLmFkZChzdWJhZGRyZXNzSWR4KSk7XG4gICAgICBpbmRpY2VzLnNldChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMuc2l6ZSA/IEFycmF5LmZyb20oc3ViYWRkcmVzc0luZGljZXMpIDogdW5kZWZpbmVkKTsgIC8vIHVuZGVmaW5lZCB3aWxsIGZldGNoIGZyb20gYWxsIHN1YmFkZHJlc3Nlc1xuICAgIH0gZWxzZSB7XG4gICAgICBhc3NlcnQuZXF1YWwocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCksIHVuZGVmaW5lZCwgXCJRdWVyeSBzcGVjaWZpZXMgYSBzdWJhZGRyZXNzIGluZGV4IGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKVxuICAgICAgYXNzZXJ0KHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCB8fCBxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCwgXCJRdWVyeSBzcGVjaWZpZXMgc3ViYWRkcmVzcyBpbmRpY2VzIGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKTtcbiAgICAgIGluZGljZXMgPSBhd2FpdCB0aGlzLmdldEFjY291bnRJbmRpY2VzKCk7ICAvLyBmZXRjaCBhbGwgYWNjb3VudCBpbmRpY2VzIHdpdGhvdXQgc3ViYWRkcmVzc2VzXG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHVuaXF1ZSB0eHMgYW5kIGJsb2Nrc1xuICAgIGxldCB0eE1hcCA9IHt9O1xuICAgIGxldCBibG9ja01hcCA9IHt9O1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdHhzIHdpdGggb3V0cHV0cyBmb3IgZWFjaCBpbmRpY2F0ZWQgYWNjb3VudCB1c2luZyBgaW5jb21pbmdfdHJhbnNmZXJzYCBycGMgY2FsbFxuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy50cmFuc2Zlcl90eXBlID0gcXVlcnkuZ2V0SXNTcGVudCgpID09PSB0cnVlID8gXCJ1bmF2YWlsYWJsZVwiIDogcXVlcnkuZ2V0SXNTcGVudCgpID09PSBmYWxzZSA/IFwiYXZhaWxhYmxlXCIgOiBcImFsbFwiO1xuICAgIHBhcmFtcy52ZXJib3NlID0gdHJ1ZTtcbiAgICBmb3IgKGxldCBhY2NvdW50SWR4IG9mIGluZGljZXMua2V5cygpKSB7XG4gICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gYWNjb3VudElkeDtcbiAgICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBpbmRpY2VzLmdldChhY2NvdW50SWR4KTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW5jb21pbmdfdHJhbnNmZXJzXCIsIHBhcmFtcyk7XG4gICAgICBcbiAgICAgIC8vIGNvbnZlcnQgcmVzcG9uc2UgdG8gdHhzIHdpdGggb3V0cHV0cyBhbmQgbWVyZ2VcbiAgICAgIGlmIChyZXNwLnJlc3VsdC50cmFuc2ZlcnMgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG4gICAgICBmb3IgKGxldCBycGNPdXRwdXQgb2YgcmVzcC5yZXN1bHQudHJhbnNmZXJzKSB7XG4gICAgICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoT3V0cHV0KHJwY091dHB1dCk7XG4gICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzb3J0IHR4cyBieSBibG9jayBoZWlnaHRcbiAgICBsZXQgdHhzOiBNb25lcm9UeFdhbGxldFtdID0gT2JqZWN0LnZhbHVlcyh0eE1hcCk7XG4gICAgdHhzLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVUeHNCeUhlaWdodCk7XG4gICAgXG4gICAgLy8gY29sbGVjdCBxdWVyaWVkIG91dHB1dHNcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgXG4gICAgICAvLyBzb3J0IG91dHB1dHNcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdHguZ2V0T3V0cHV0cygpLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVPdXRwdXRzKTtcbiAgICAgIFxuICAgICAgLy8gY29sbGVjdCBxdWVyaWVkIG91dHB1dHMsIGVyYXNlIGlmIGV4Y2x1ZGVkXG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZmlsdGVyT3V0cHV0cyhxdWVyeSkpIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgXG4gICAgICAvLyByZW1vdmUgZXhjbHVkZWQgdHhzIGZyb20gYmxvY2tcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgPT09IHVuZGVmaW5lZCAmJiB0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29tbW9uIG1ldGhvZCB0byBnZXQga2V5IGltYWdlcy5cbiAgICogXG4gICAqIEBwYXJhbSBhbGwgLSBwZWNpZmllcyB0byBnZXQgYWxsIHhvciBvbmx5IG5ldyBpbWFnZXMgZnJvbSBsYXN0IGltcG9ydFxuICAgKiBAcmV0dXJuIHtNb25lcm9LZXlJbWFnZVtdfSBhcmUgdGhlIGtleSBpbWFnZXNcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBycGNFeHBvcnRLZXlJbWFnZXMoYWxsKSB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfa2V5X2ltYWdlc1wiLCB7YWxsOiBhbGx9KTtcbiAgICBpZiAoIXJlc3AucmVzdWx0LnNpZ25lZF9rZXlfaW1hZ2VzKSByZXR1cm4gW107XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25lZF9rZXlfaW1hZ2VzLm1hcChycGNJbWFnZSA9PiBuZXcgTW9uZXJvS2V5SW1hZ2UocnBjSW1hZ2Uua2V5X2ltYWdlLCBycGNJbWFnZS5zaWduYXR1cmUpKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIHJwY1N3ZWVwQWNjb3VudChjb25maWc6IE1vbmVyb1R4Q29uZmlnKSB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGFuIGFjY291bnQgaW5kZXggdG8gc3dlZXAgZnJvbVwiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCAhPSAxKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZXhhY3RseSBvbmUgZGVzdGluYXRpb24gdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGRlc3RpbmF0aW9uIGFkZHJlc3MgdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBhbW91bnQgaW4gc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0S2V5SW1hZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJLZXkgaW1hZ2UgZGVmaW5lZDsgdXNlIHN3ZWVwT3V0cHV0KCkgdG8gc3dlZXAgYW4gb3V0cHV0IGJ5IGl0cyBrZXkgaW1hZ2VcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJFbXB0eSBsaXN0IGdpdmVuIGZvciBzdWJhZGRyZXNzZXMgaW5kaWNlcyB0byBzd2VlcFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyB3aXRoIFJQQyBgc3dlZXBfYWxsYFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN3ZWVwaW5nIG91dHB1dCBkb2VzIG5vdCBzdXBwb3J0IHN1YnRyYWN0aW5nIGZlZXMgZnJvbSBkZXN0aW5hdGlvbnNcIik7XG4gICAgXG4gICAgLy8gc3dlZXAgZnJvbSBhbGwgc3ViYWRkcmVzc2VzIGlmIG5vdCBvdGhlcndpc2UgZGVmaW5lZFxuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25maWcuc2V0U3ViYWRkcmVzc0luZGljZXMoW10pO1xuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3Nlcyhjb25maWcuZ2V0QWNjb3VudEluZGV4KCkpKSB7XG4gICAgICAgIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gc3ViYWRkcmVzc2VzIHRvIHN3ZWVwIGZyb21cIik7XG4gICAgXG4gICAgLy8gY29tbW9uIGNvbmZpZyBwYXJhbXNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBsZXQgcmVsYXkgPSBjb25maWcuZ2V0UmVsYXkoKSA9PT0gdHJ1ZTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCk7XG4gICAgcGFyYW1zLmFkZHJlc3MgPSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpO1xuICAgIGFzc2VydChjb25maWcuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnLmdldFByaW9yaXR5KCk7XG4gICAgcGFyYW1zLnBheW1lbnRfaWQgPSBjb25maWcuZ2V0UGF5bWVudElkKCk7XG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9ICFyZWxheTtcbiAgICBwYXJhbXMuYmVsb3dfYW1vdW50ID0gY29uZmlnLmdldEJlbG93QW1vdW50KCk7XG4gICAgcGFyYW1zLmdldF90eF9rZXlzID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X2hleCA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9tZXRhZGF0YSA9IHRydWU7XG4gICAgXG4gICAgLy8gaW52b2tlIHdhbGxldCBycGMgYHN3ZWVwX2FsbGBcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN3ZWVwX2FsbFwiLCBwYXJhbXMpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBmcm9tIHJlc3BvbnNlXG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQsIHVuZGVmaW5lZCwgY29uZmlnKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHJlbWFpbmluZyBrbm93biBmaWVsZHNcbiAgICBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkge1xuICAgICAgdHguc2V0SXNMb2NrZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgICAgdHguc2V0UmVsYXkocmVsYXkpO1xuICAgICAgdHguc2V0SW5UeFBvb2wocmVsYXkpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHJlbGF5KTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICBsZXQgdHJhbnNmZXIgPSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgICB0cmFuc2Zlci5zZXRBY2NvdW50SW5kZXgoY29uZmlnLmdldEFjY291bnRJbmRleCgpKTtcbiAgICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDEpIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpKTtcbiAgICAgIGxldCBkZXN0aW5hdGlvbiA9IG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLCBCaWdJbnQodHJhbnNmZXIuZ2V0QW1vdW50KCkpKTtcbiAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhbZGVzdGluYXRpb25dKTtcbiAgICAgIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgICAgdHguc2V0UGF5bWVudElkKGNvbmZpZy5nZXRQYXltZW50SWQoKSk7XG4gICAgICBpZiAodHguZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQpIHR4LnNldFVubG9ja1RpbWUoMG4pO1xuICAgICAgaWYgKHR4LmdldFJlbGF5KCkpIHtcbiAgICAgICAgaWYgKHR4LmdldExhc3RSZWxheWVkVGltZXN0YW1wKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoK25ldyBEYXRlKCkuZ2V0VGltZSgpKTsgIC8vIFRPRE8gKG1vbmVyby13YWxsZXQtcnBjKTogcHJvdmlkZSB0aW1lc3RhbXAgb24gcmVzcG9uc2U7IHVuY29uZmlybWVkIHRpbWVzdGFtcHMgdmFyeVxuICAgICAgICBpZiAodHguZ2V0SXNEb3VibGVTcGVuZFNlZW4oKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0eFNldC5nZXRUeHMoKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHJlZnJlc2hMaXN0ZW5pbmcoKSB7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyID09IHVuZGVmaW5lZCAmJiB0aGlzLmxpc3RlbmVycy5sZW5ndGgpIHRoaXMud2FsbGV0UG9sbGVyID0gbmV3IFdhbGxldFBvbGxlcih0aGlzKTtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCkgdGhpcy53YWxsZXRQb2xsZXIuc2V0SXNQb2xsaW5nKHRoaXMubGlzdGVuZXJzLmxlbmd0aCA+IDApO1xuICB9XG4gIFxuICAvKipcbiAgICogUG9sbCBpZiBsaXN0ZW5pbmcuXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgcG9sbCgpIHtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndhbGxldFBvbGxlci5pc1BvbGxpbmcpIGF3YWl0IHRoaXMud2FsbGV0UG9sbGVyLnBvbGwoKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIFNUQVRJQyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IE1vbmVyb1dhbGxldENvbmZpZyB7XG4gICAgbGV0IGNvbmZpZzogdW5kZWZpbmVkIHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+ID0gdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlb2YgdXJpT3JDb25maWcgPT09IFwic3RyaW5nXCIgfHwgKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pLnVyaSkgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh7c2VydmVyOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbmZpZyBhcyBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+LCB1c2VybmFtZSwgcGFzc3dvcmQpfSk7XG4gICAgZWxzZSBpZiAoR2VuVXRpbHMuaXNBcnJheSh1cmlPckNvbmZpZykpIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoe2NtZDogdXJpT3JDb25maWcgYXMgc3RyaW5nW119KTtcbiAgICBlbHNlIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIgPT09IHVuZGVmaW5lZCkgY29uZmlnLnByb3h5VG9Xb3JrZXIgPSB0cnVlO1xuICAgIHJldHVybiBjb25maWcgYXMgTW9uZXJvV2FsbGV0Q29uZmlnO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVtb3ZlIGNyaXRlcmlhIHdoaWNoIHJlcXVpcmVzIGxvb2tpbmcgdXAgb3RoZXIgdHJhbnNmZXJzL291dHB1dHMgdG9cbiAgICogZnVsZmlsbCBxdWVyeS5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gcXVlcnkgLSB0aGUgcXVlcnkgdG8gZGVjb250ZXh0dWFsaXplXG4gICAqIEByZXR1cm4ge01vbmVyb1R4UXVlcnl9IGEgcmVmZXJlbmNlIHRvIHRoZSBxdWVyeSBmb3IgY29udmVuaWVuY2VcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZGVjb250ZXh0dWFsaXplKHF1ZXJ5KSB7XG4gICAgcXVlcnkuc2V0SXNJbmNvbWluZyh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldElzT3V0Z29pbmcodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRUcmFuc2ZlclF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0SW5wdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldE91dHB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHF1ZXJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGlzQ29udGV4dHVhbChxdWVyeSkge1xuICAgIGlmICghcXVlcnkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIXF1ZXJ5LmdldFR4UXVlcnkoKSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0SXNJbmNvbWluZygpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIHRyYW5zZmVyc1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0SXNPdXRnb2luZygpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlO1xuICAgIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb1RyYW5zZmVyUXVlcnkpIHtcbiAgICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0T3V0cHV0UXVlcnkoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciBvdXRwdXRzXG4gICAgfSBlbHNlIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb091dHB1dFF1ZXJ5KSB7XG4gICAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldFRyYW5zZmVyUXVlcnkoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciB0cmFuc2ZlcnNcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicXVlcnkgbXVzdCBiZSB0eCBvciB0cmFuc2ZlciBxdWVyeVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNBY2NvdW50KHJwY0FjY291bnQpIHtcbiAgICBsZXQgYWNjb3VudCA9IG5ldyBNb25lcm9BY2NvdW50KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0FjY291bnQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQWNjb3VudFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhY2NvdW50X2luZGV4XCIpIGFjY291bnQuc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYWxhbmNlXCIpIGFjY291bnQuc2V0QmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfYmFsYW5jZVwiKSBhY2NvdW50LnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmFzZV9hZGRyZXNzXCIpIGFjY291bnQuc2V0UHJpbWFyeUFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YWdcIikgYWNjb3VudC5zZXRUYWcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYWJlbFwiKSB7IH0gLy8gbGFiZWwgYmVsb25ncyB0byBmaXJzdCBzdWJhZGRyZXNzXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBhY2NvdW50IGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChcIlwiID09PSBhY2NvdW50LmdldFRhZygpKSBhY2NvdW50LnNldFRhZyh1bmRlZmluZWQpO1xuICAgIHJldHVybiBhY2NvdW50O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpIHtcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N1YmFkZHJlc3MpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjU3ViYWRkcmVzc1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhY2NvdW50X2luZGV4XCIpIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc19pbmRleFwiKSBzdWJhZGRyZXNzLnNldEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSBzdWJhZGRyZXNzLnNldEFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYWxhbmNlXCIpIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfYmFsYW5jZVwiKSBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX3Vuc3BlbnRfb3V0cHV0c1wiKSBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFiZWxcIikgeyBpZiAodmFsKSBzdWJhZGRyZXNzLnNldExhYmVsKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1c2VkXCIpIHN1YmFkZHJlc3Muc2V0SXNVc2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tzX3RvX3VubG9ja1wiKSBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT0gXCJ0aW1lX3RvX3VubG9ja1wiKSB7fSAgLy8gaWdub3JpbmdcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHN1YmFkZHJlc3MgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIHNlbnQgdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBUT0RPOiByZW1vdmUgY29weURlc3RpbmF0aW9ucyBhZnRlciA+MTguMy4xIHdoZW4gc3VidHJhY3RGZWVGcm9tIGZ1bGx5IHN1cHBvcnRlZFxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeENvbmZpZ30gY29uZmlnIC0gc2VuZCBjb25maWdcbiAgICogQHBhcmFtIHtNb25lcm9UeFdhbGxldH0gW3R4XSAtIGV4aXN0aW5nIHRyYW5zYWN0aW9uIHRvIGluaXRpYWxpemUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGNvcHlEZXN0aW5hdGlvbnMgLSBjb3BpZXMgY29uZmlnIGRlc3RpbmF0aW9ucyBpZiB0cnVlXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSBpcyB0aGUgaW5pdGlhbGl6ZWQgc2VuZCB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBpbml0U2VudFR4V2FsbGV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4sIHR4LCBjb3B5RGVzdGluYXRpb25zKSB7XG4gICAgaWYgKCF0eCkgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICBsZXQgcmVsYXkgPSBjb25maWcuZ2V0UmVsYXkoKSA9PT0gdHJ1ZTtcbiAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgIHR4LnNldEluVHhQb29sKHJlbGF5KTtcbiAgICB0eC5zZXRSZWxheShyZWxheSk7XG4gICAgdHguc2V0SXNSZWxheWVkKHJlbGF5KTtcbiAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICB0eC5zZXRJc0xvY2tlZCh0cnVlKTtcbiAgICB0eC5zZXRSaW5nU2l6ZShNb25lcm9VdGlscy5SSU5HX1NJWkUpO1xuICAgIGxldCB0cmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgdHJhbnNmZXIuc2V0VHgodHgpO1xuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAmJiBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDEpIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnNsaWNlKDApKTsgLy8gd2Uga25vdyBzcmMgc3ViYWRkcmVzcyBpbmRpY2VzIGlmZiBjb25maWcgc3BlY2lmaWVzIDFcbiAgICBpZiAoY29weURlc3RpbmF0aW9ucykge1xuICAgICAgbGV0IGRlc3RDb3BpZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IGRlc3Qgb2YgY29uZmlnLmdldERlc3RpbmF0aW9ucygpKSBkZXN0Q29waWVzLnB1c2goZGVzdC5jb3B5KCkpO1xuICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKGRlc3RDb3BpZXMpO1xuICAgIH1cbiAgICB0eC5zZXRPdXRnb2luZ1RyYW5zZmVyKHRyYW5zZmVyKTtcbiAgICB0eC5zZXRQYXltZW50SWQoY29uZmlnLmdldFBheW1lbnRJZCgpKTtcbiAgICBpZiAodHguZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQpIHR4LnNldFVubG9ja1RpbWUoMG4pO1xuICAgIGlmIChjb25maWcuZ2V0UmVsYXkoKSkge1xuICAgICAgaWYgKHR4LmdldExhc3RSZWxheWVkVGltZXN0YW1wKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoK25ldyBEYXRlKCkuZ2V0VGltZSgpKTsgIC8vIFRPRE8gKG1vbmVyby13YWxsZXQtcnBjKTogcHJvdmlkZSB0aW1lc3RhbXAgb24gcmVzcG9uc2U7IHVuY29uZmlybWVkIHRpbWVzdGFtcHMgdmFyeVxuICAgICAgaWYgKHR4LmdldElzRG91YmxlU3BlbmRTZWVuKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4oZmFsc2UpO1xuICAgIH1cbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIHR4IHNldCBmcm9tIGEgUlBDIG1hcCBleGNsdWRpbmcgdHhzLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY01hcCAtIG1hcCB0byBpbml0aWFsaXplIHRoZSB0eCBzZXQgZnJvbVxuICAgKiBAcmV0dXJuIE1vbmVyb1R4U2V0IC0gaW5pdGlhbGl6ZWQgdHggc2V0XG4gICAqIEByZXR1cm4gdGhlIHJlc3VsdGluZyB0eCBzZXRcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4U2V0KHJwY01hcCkge1xuICAgIGxldCB0eFNldCA9IG5ldyBNb25lcm9UeFNldCgpO1xuICAgIHR4U2V0LnNldE11bHRpc2lnVHhIZXgocnBjTWFwLm11bHRpc2lnX3R4c2V0KTtcbiAgICB0eFNldC5zZXRVbnNpZ25lZFR4SGV4KHJwY01hcC51bnNpZ25lZF90eHNldCk7XG4gICAgdHhTZXQuc2V0U2lnbmVkVHhIZXgocnBjTWFwLnNpZ25lZF90eHNldCk7XG4gICAgaWYgKHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKSAhPT0gdW5kZWZpbmVkICYmIHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKS5sZW5ndGggPT09IDApIHR4U2V0LnNldE11bHRpc2lnVHhIZXgodW5kZWZpbmVkKTtcbiAgICBpZiAodHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0VW5zaWduZWRUeEhleCh1bmRlZmluZWQpO1xuICAgIGlmICh0eFNldC5nZXRTaWduZWRUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0U2lnbmVkVHhIZXgoKS5sZW5ndGggPT09IDApIHR4U2V0LnNldFNpZ25lZFR4SGV4KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBNb25lcm9UeFNldCBmcm9tIGEgbGlzdCBvZiBycGMgdHhzLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4cyAtIHJwYyB0eHMgdG8gaW5pdGlhbGl6ZSB0aGUgc2V0IGZyb21cbiAgICogQHBhcmFtIHR4cyAtIGV4aXN0aW5nIHR4cyB0byBmdXJ0aGVyIGluaXRpYWxpemUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4gdGhlIGNvbnZlcnRlZCB0eCBzZXRcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJwY1R4czogYW55LCB0eHM/OiBhbnksIGNvbmZpZz86IGFueSkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHNoYXJlZCB0eCBzZXRcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4U2V0KHJwY1R4cyk7XG5cbiAgICAvLyBnZXQgbnVtYmVyIG9mIHR4c1xuICAgIGxldCBudW1UeHMgPSBycGNUeHMuZmVlX2xpc3QgPyBycGNUeHMuZmVlX2xpc3QubGVuZ3RoIDogcnBjVHhzLnR4X2hhc2hfbGlzdCA/IHJwY1R4cy50eF9oYXNoX2xpc3QubGVuZ3RoIDogMDtcbiAgICBcbiAgICAvLyBkb25lIGlmIHJwYyByZXNwb25zZSBjb250YWlucyBubyB0eHNcbiAgICBpZiAobnVtVHhzID09PSAwKSB7XG4gICAgICBhc3NlcnQuZXF1YWwodHhzLCB1bmRlZmluZWQpO1xuICAgICAgcmV0dXJuIHR4U2V0O1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBpZiBub25lIGdpdmVuXG4gICAgaWYgKHR4cykgdHhTZXQuc2V0VHhzKHR4cyk7XG4gICAgZWxzZSB7XG4gICAgICB0eHMgPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVHhzOyBpKyspIHR4cy5wdXNoKG5ldyBNb25lcm9UeFdhbGxldCgpKTtcbiAgICB9XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICB0eC5zZXRUeFNldCh0eFNldCk7XG4gICAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgIH1cbiAgICB0eFNldC5zZXRUeHModHhzKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBmcm9tIHJwYyBsaXN0c1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUeHMpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVHhzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInR4X2hhc2hfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEhhc2godmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9rZXlfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEtleSh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2Jsb2JfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEZ1bGxIZXgodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9tZXRhZGF0YV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0TWV0YWRhdGEodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldEZlZShCaWdJbnQodmFsW2ldKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2VpZ2h0X2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRXZWlnaHQodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRfbGlzdFwiKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHR4c1tpXS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT0gdW5kZWZpbmVkKSB0eHNbaV0uc2V0T3V0Z29pbmdUcmFuc2ZlcihuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHR4c1tpXSkpO1xuICAgICAgICAgIHR4c1tpXS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0QW1vdW50KEJpZ0ludCh2YWxbaV0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm11bHRpc2lnX3R4c2V0XCIgfHwga2V5ID09PSBcInVuc2lnbmVkX3R4c2V0XCIgfHwga2V5ID09PSBcInNpZ25lZF90eHNldFwiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50X2tleV9pbWFnZXNfbGlzdFwiKSB7XG4gICAgICAgIGxldCBpbnB1dEtleUltYWdlc0xpc3QgPSB2YWw7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRLZXlJbWFnZXNMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZSh0eHNbaV0uZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICAgICAgdHhzW2ldLnNldElucHV0cyhbXSk7XG4gICAgICAgICAgZm9yIChsZXQgaW5wdXRLZXlJbWFnZSBvZiBpbnB1dEtleUltYWdlc0xpc3RbaV1bXCJrZXlfaW1hZ2VzXCJdKSB7XG4gICAgICAgICAgICB0eHNbaV0uZ2V0SW5wdXRzKCkucHVzaChuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCkuc2V0S2V5SW1hZ2UobmV3IE1vbmVyb0tleUltYWdlKCkuc2V0SGV4KGlucHV0S2V5SW1hZ2UpKS5zZXRUeCh0eHNbaV0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzX2J5X2Rlc3RfbGlzdFwiKSB7XG4gICAgICAgIGxldCBhbW91bnRzQnlEZXN0TGlzdCA9IHZhbDtcbiAgICAgICAgbGV0IGRlc3RpbmF0aW9uSWR4ID0gMDtcbiAgICAgICAgZm9yIChsZXQgdHhJZHggPSAwOyB0eElkeCA8IGFtb3VudHNCeURlc3RMaXN0Lmxlbmd0aDsgdHhJZHgrKykge1xuICAgICAgICAgIGxldCBhbW91bnRzQnlEZXN0ID0gYW1vdW50c0J5RGVzdExpc3RbdHhJZHhdW1wiYW1vdW50c1wiXTtcbiAgICAgICAgICBpZiAodHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT09IHVuZGVmaW5lZCkgdHhzW3R4SWR4XS5zZXRPdXRnb2luZ1RyYW5zZmVyKG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHhzW3R4SWR4XSkpO1xuICAgICAgICAgIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldERlc3RpbmF0aW9ucyhbXSk7XG4gICAgICAgICAgZm9yIChsZXQgYW1vdW50IG9mIGFtb3VudHNCeURlc3QpIHtcbiAgICAgICAgICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoID09PSAxKSB0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKS5wdXNoKG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLCBCaWdJbnQoYW1vdW50KSkpOyAvLyBzd2VlcGluZyBjYW4gY3JlYXRlIG11bHRpcGxlIHR4cyB3aXRoIG9uZSBhZGRyZXNzXG4gICAgICAgICAgICBlbHNlIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVtkZXN0aW5hdGlvbklkeCsrXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnQpKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhIHJwYyB0eCB3aXRoIGEgdHJhbnNmZXIgdG8gYSB0eCBzZXQgd2l0aCBhIHR4IGFuZCB0cmFuc2Zlci5cbiAgICogXG4gICAqIEBwYXJhbSBycGNUeCAtIHJwYyB0eCB0byBidWlsZCBmcm9tXG4gICAqIEBwYXJhbSB0eCAtIGV4aXN0aW5nIHR4IHRvIGNvbnRpbnVlIGluaXRpYWxpemluZyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBpc091dGdvaW5nIC0gc3BlY2lmaWVzIGlmIHRoZSB0eCBpcyBvdXRnb2luZyBpZiB0cnVlLCBpbmNvbWluZyBpZiBmYWxzZSwgb3IgZGVjb2RlcyBmcm9tIHR5cGUgaWYgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB0aGUgaW5pdGlhbGl6ZWQgdHggc2V0IHdpdGggYSB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhUb1R4U2V0KHJwY1R4LCB0eCwgaXNPdXRnb2luZywgY29uZmlnKSB7XG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFNldChycGNUeCk7XG4gICAgdHhTZXQuc2V0VHhzKFtNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4LCB0eCwgaXNPdXRnb2luZywgY29uZmlnKS5zZXRUeFNldCh0eFNldCldKTtcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBCdWlsZHMgYSBNb25lcm9UeFdhbGxldCBmcm9tIGEgUlBDIHR4LlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4IC0gcnBjIHR4IHRvIGJ1aWxkIGZyb21cbiAgICogQHBhcmFtIHR4IC0gZXhpc3RpbmcgdHggdG8gY29udGludWUgaW5pdGlhbGl6aW5nIChvcHRpb25hbClcbiAgICogQHBhcmFtIGlzT3V0Z29pbmcgLSBzcGVjaWZpZXMgaWYgdGhlIHR4IGlzIG91dGdvaW5nIGlmIHRydWUsIGluY29taW5nIGlmIGZhbHNlLCBvciBkZWNvZGVzIGZyb20gdHlwZSBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gaXMgdGhlIGluaXRpYWxpemVkIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlcihycGNUeDogYW55LCB0eD86IGFueSwgaXNPdXRnb2luZz86IGFueSwgY29uZmlnPzogYW55KSB7ICAvLyBUT0RPOiBjaGFuZ2UgZXZlcnl0aGluZyB0byBzYWZlIHNldFxuICAgICAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHRvIHJldHVyblxuICAgIGlmICghdHgpIHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCBzdGF0ZSBmcm9tIHJwYyB0eXBlXG4gICAgaWYgKHJwY1R4LnR5cGUgIT09IHVuZGVmaW5lZCkgaXNPdXRnb2luZyA9IE1vbmVyb1dhbGxldFJwYy5kZWNvZGVScGNUeXBlKHJwY1R4LnR5cGUsIHR4KTtcbiAgICBlbHNlIGFzc2VydC5lcXVhbCh0eXBlb2YgaXNPdXRnb2luZywgXCJib29sZWFuXCIsIFwiTXVzdCBpbmRpY2F0ZSBpZiB0eCBpcyBvdXRnb2luZyAodHJ1ZSkgeG9yIGluY29taW5nIChmYWxzZSkgc2luY2UgdW5rbm93blwiKTtcbiAgICBcbiAgICAvLyBUT0RPOiBzYWZlIHNldFxuICAgIC8vIGluaXRpYWxpemUgcmVtYWluaW5nIGZpZWxkcyAgVE9ETzogc2VlbXMgdGhpcyBzaG91bGQgYmUgcGFydCBvZiBjb21tb24gZnVuY3Rpb24gd2l0aCBEYWVtb25ScGMuY29udmVydFJwY1R4XG4gICAgbGV0IGhlYWRlcjtcbiAgICBsZXQgdHJhbnNmZXI7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1R4KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1R4W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInR4aWRcIikgdHguc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2hhc2hcIikgdHguc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZVwiKSB0eC5zZXRGZWUoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5vdGVcIikgeyBpZiAodmFsKSB0eC5zZXROb3RlKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9rZXlcIikgdHguc2V0S2V5KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHlwZVwiKSB7IH0gLy8gdHlwZSBhbHJlYWR5IGhhbmRsZWRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9zaXplXCIpIHR4LnNldFNpemUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tfdGltZVwiKSB0eC5zZXRVbmxvY2tUaW1lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2VpZ2h0XCIpIHR4LnNldFdlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvY2tlZFwiKSB0eC5zZXRJc0xvY2tlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2Jsb2JcIikgdHguc2V0RnVsbEhleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X21ldGFkYXRhXCIpIHR4LnNldE1ldGFkYXRhKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZG91YmxlX3NwZW5kX3NlZW5cIikgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oZWlnaHRcIiB8fCBrZXkgPT09IFwiaGVpZ2h0XCIpIHtcbiAgICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIHtcbiAgICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgICAgaGVhZGVyLnNldEhlaWdodCh2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGltZXN0YW1wXCIpIHtcbiAgICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIHtcbiAgICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgICAgaGVhZGVyLnNldFRpbWVzdGFtcCh2YWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHRpbWVzdGFtcCBvZiB1bmNvbmZpcm1lZCB0eCBpcyBjdXJyZW50IHJlcXVlc3QgdGltZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY29uZmlybWF0aW9uc1wiKSB0eC5zZXROdW1Db25maXJtYXRpb25zKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3VnZ2VzdGVkX2NvbmZpcm1hdGlvbnNfdGhyZXNob2xkXCIpIHtcbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gKGlzT3V0Z29pbmcgPyBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpIDogbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKSkuc2V0VHgodHgpO1xuICAgICAgICBpZiAoIWlzT3V0Z29pbmcpIHRyYW5zZmVyLnNldE51bVN1Z2dlc3RlZENvbmZpcm1hdGlvbnModmFsKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRcIikge1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIHRyYW5zZmVyLnNldEFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50c1wiKSB7fSAgLy8gaWdub3JpbmcsIGFtb3VudHMgc3VtIHRvIGFtb3VudFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkZHJlc3NcIikge1xuICAgICAgICBpZiAoIWlzT3V0Z29pbmcpIHtcbiAgICAgICAgICBpZiAoIXRyYW5zZmVyKSB0cmFuc2ZlciA9IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkuc2V0VHgodHgpO1xuICAgICAgICAgIHRyYW5zZmVyLnNldEFkZHJlc3ModmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBheW1lbnRfaWRcIikge1xuICAgICAgICBpZiAoXCJcIiAhPT0gdmFsICYmIE1vbmVyb1R4V2FsbGV0LkRFRkFVTFRfUEFZTUVOVF9JRCAhPT0gdmFsKSB0eC5zZXRQYXltZW50SWQodmFsKTsgIC8vIGRlZmF1bHQgaXMgdW5kZWZpbmVkXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRleFwiKSBhc3NlcnQocnBjVHguc3ViYWRkcl9pbmRpY2VzKTsgIC8vIGhhbmRsZWQgYnkgc3ViYWRkcl9pbmRpY2VzXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRpY2VzXCIpIHtcbiAgICAgICAgaWYgKCF0cmFuc2ZlcikgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIGxldCBycGNJbmRpY2VzID0gdmFsO1xuICAgICAgICB0cmFuc2Zlci5zZXRBY2NvdW50SW5kZXgocnBjSW5kaWNlc1swXS5tYWpvcik7XG4gICAgICAgIGlmIChpc091dGdvaW5nKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgICAgICAgZm9yIChsZXQgcnBjSW5kZXggb2YgcnBjSW5kaWNlcykgc3ViYWRkcmVzc0luZGljZXMucHVzaChycGNJbmRleC5taW5vcik7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFzc2VydC5lcXVhbChycGNJbmRpY2VzLmxlbmd0aCwgMSk7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGV4KHJwY0luZGljZXNbMF0ubWlub3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGVzdGluYXRpb25zXCIgfHwga2V5ID09IFwicmVjaXBpZW50c1wiKSB7XG4gICAgICAgIGFzc2VydChpc091dGdvaW5nKTtcbiAgICAgICAgbGV0IGRlc3RpbmF0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBycGNEZXN0aW5hdGlvbiBvZiB2YWwpIHtcbiAgICAgICAgICBsZXQgZGVzdGluYXRpb24gPSBuZXcgTW9uZXJvRGVzdGluYXRpb24oKTtcbiAgICAgICAgICBkZXN0aW5hdGlvbnMucHVzaChkZXN0aW5hdGlvbik7XG4gICAgICAgICAgZm9yIChsZXQgZGVzdGluYXRpb25LZXkgb2YgT2JqZWN0LmtleXMocnBjRGVzdGluYXRpb24pKSB7XG4gICAgICAgICAgICBpZiAoZGVzdGluYXRpb25LZXkgPT09IFwiYWRkcmVzc1wiKSBkZXN0aW5hdGlvbi5zZXRBZGRyZXNzKHJwY0Rlc3RpbmF0aW9uW2Rlc3RpbmF0aW9uS2V5XSk7XG4gICAgICAgICAgICBlbHNlIGlmIChkZXN0aW5hdGlvbktleSA9PT0gXCJhbW91bnRcIikgZGVzdGluYXRpb24uc2V0QW1vdW50KEJpZ0ludChycGNEZXN0aW5hdGlvbltkZXN0aW5hdGlvbktleV0pKTtcbiAgICAgICAgICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVW5yZWNvZ25pemVkIHRyYW5zYWN0aW9uIGRlc3RpbmF0aW9uIGZpZWxkOiBcIiArIGRlc3RpbmF0aW9uS2V5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoe3R4OiB0eH0pO1xuICAgICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoZGVzdGluYXRpb25zKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzb3VyY2VzXCIpIHt9IC8vIGlnbm9yaW5nXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibXVsdGlzaWdfdHhzZXRcIiAmJiB2YWwgIT09IHVuZGVmaW5lZCkge30gLy8gaGFuZGxlZCBlbHNld2hlcmU7IHRoaXMgbWV0aG9kIG9ubHkgYnVpbGRzIGEgdHggd2FsbGV0XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5zaWduZWRfdHhzZXRcIiAmJiB2YWwgIT09IHVuZGVmaW5lZCkge30gLy8gaGFuZGxlZCBlbHNld2hlcmU7IHRoaXMgbWV0aG9kIG9ubHkgYnVpbGRzIGEgdHggd2FsbGV0XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50X2luXCIpIHR4LnNldElucHV0U3VtKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRfb3V0XCIpIHR4LnNldE91dHB1dFN1bShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY2hhbmdlX2FkZHJlc3NcIikgdHguc2V0Q2hhbmdlQWRkcmVzcyh2YWwgPT09IFwiXCIgPyB1bmRlZmluZWQgOiB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNoYW5nZV9hbW91bnRcIikgdHguc2V0Q2hhbmdlQW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkdW1teV9vdXRwdXRzXCIpIHR4LnNldE51bUR1bW15T3V0cHV0cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImV4dHJhXCIpIHR4LnNldEV4dHJhSGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmluZ19zaXplXCIpIHR4LnNldFJpbmdTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlbnRfa2V5X2ltYWdlc1wiKSB7XG4gICAgICAgIGxldCBpbnB1dEtleUltYWdlcyA9IHZhbC5rZXlfaW1hZ2VzO1xuICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR4LmdldElucHV0cygpID09PSB1bmRlZmluZWQpO1xuICAgICAgICB0eC5zZXRJbnB1dHMoW10pO1xuICAgICAgICBmb3IgKGxldCBpbnB1dEtleUltYWdlIG9mIGlucHV0S2V5SW1hZ2VzKSB7XG4gICAgICAgICAgdHguZ2V0SW5wdXRzKCkucHVzaChuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCkuc2V0S2V5SW1hZ2UobmV3IE1vbmVyb0tleUltYWdlKCkuc2V0SGV4KGlucHV0S2V5SW1hZ2UpKS5zZXRUeCh0eCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50c19ieV9kZXN0XCIpIHtcbiAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShpc091dGdvaW5nKTtcbiAgICAgICAgbGV0IGFtb3VudHNCeURlc3QgPSB2YWwuYW1vdW50cztcbiAgICAgICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGgsIGFtb3VudHNCeURlc3QubGVuZ3RoKTtcbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eCk7XG4gICAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhbXSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdHJhbnNmZXIuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpW2ldLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudHNCeURlc3RbaV0pKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHRyYW5zYWN0aW9uIGZpZWxkIHdpdGggdHJhbnNmZXI6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbGluayBibG9jayBhbmQgdHhcbiAgICBpZiAoaGVhZGVyKSB0eC5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soaGVhZGVyKS5zZXRUeHMoW3R4XSkpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgZmluYWwgZmllbGRzXG4gICAgaWYgKHRyYW5zZmVyKSB7XG4gICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICBpZiAoIXRyYW5zZmVyLmdldFR4KCkuZ2V0SXNDb25maXJtZWQoKSkgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICAgIGlmIChpc091dGdvaW5nKSB7XG4gICAgICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpIHtcbiAgICAgICAgICBpZiAodHJhbnNmZXIuZ2V0RGVzdGluYXRpb25zKCkpIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXREZXN0aW5hdGlvbnModW5kZWZpbmVkKTsgLy8gb3ZlcndyaXRlIHRvIGF2b2lkIHJlY29uY2lsZSBlcnJvciBUT0RPOiByZW1vdmUgYWZ0ZXIgPjE4LjMuMSB3aGVuIGFtb3VudHNfYnlfZGVzdCBzdXBwb3J0ZWRcbiAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkubWVyZ2UodHJhbnNmZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0eC5zZXRJc0luY29taW5nKHRydWUpO1xuICAgICAgICB0eC5zZXRJbmNvbWluZ1RyYW5zZmVycyhbdHJhbnNmZXJdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gcmV0dXJuIGluaXRpYWxpemVkIHRyYW5zYWN0aW9uXG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFdpdGhPdXRwdXQocnBjT3V0cHV0KSB7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eFxuICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoe3R4OiB0eH0pO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNPdXRwdXQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjT3V0cHV0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFtb3VudFwiKSBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGVudFwiKSBvdXRwdXQuc2V0SXNTcGVudCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImtleV9pbWFnZVwiKSB7IGlmIChcIlwiICE9PSB2YWwpIG91dHB1dC5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UodmFsKSk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJnbG9iYWxfaW5kZXhcIikgb3V0cHV0LnNldEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRcIikgdHguc2V0SXNMb2NrZWQoIXZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZnJvemVuXCIpIG91dHB1dC5zZXRJc0Zyb3plbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInB1YmtleVwiKSBvdXRwdXQuc2V0U3RlYWx0aFB1YmxpY0tleSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1YmFkZHJfaW5kZXhcIikge1xuICAgICAgICBvdXRwdXQuc2V0QWNjb3VudEluZGV4KHZhbC5tYWpvcik7XG4gICAgICAgIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgodmFsLm1pbm9yKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oZWlnaHRcIikgdHguc2V0QmxvY2soKG5ldyBNb25lcm9CbG9jaygpLnNldEhlaWdodCh2YWwpIGFzIE1vbmVyb0Jsb2NrKS5zZXRUeHMoW3R4IGFzIE1vbmVyb1R4XSkpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgdHJhbnNhY3Rpb24gZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCB3aXRoIG91dHB1dFxuICAgIHR4LnNldE91dHB1dHMoW291dHB1dF0pO1xuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlcihycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0KSB7XG4gICAgbGV0IHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJkZXNjXCIpIHtcbiAgICAgICAgdHhTZXQuc2V0VHhzKFtdKTtcbiAgICAgICAgZm9yIChsZXQgdHhNYXAgb2YgdmFsKSB7XG4gICAgICAgICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhUcmFuc2Zlcih0eE1hcCwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgICB0eC5zZXRUeFNldCh0eFNldCk7XG4gICAgICAgICAgdHhTZXQuZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdW1tYXJ5XCIpIHsgfSAvLyBUT0RPOiBzdXBwb3J0IHR4IHNldCBzdW1tYXJ5IGZpZWxkcz9cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGRlc2NkcmliZSB0cmFuc2ZlciBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZWNvZGVzIGEgXCJ0eXBlXCIgZnJvbSBtb25lcm8td2FsbGV0LXJwYyB0byBpbml0aWFsaXplIHR5cGUgYW5kIHN0YXRlXG4gICAqIGZpZWxkcyBpbiB0aGUgZ2l2ZW4gdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBUT0RPOiB0aGVzZSBzaG91bGQgYmUgc2FmZSBzZXRcbiAgICogXG4gICAqIEBwYXJhbSBycGNUeXBlIGlzIHRoZSB0eXBlIHRvIGRlY29kZVxuICAgKiBAcGFyYW0gdHggaXMgdGhlIHRyYW5zYWN0aW9uIHRvIGRlY29kZSBrbm93biBmaWVsZHMgdG9cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgcnBjIHR5cGUgaW5kaWNhdGVzIG91dGdvaW5nIHhvciBpbmNvbWluZ1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBkZWNvZGVScGNUeXBlKHJwY1R5cGUsIHR4KSB7XG4gICAgbGV0IGlzT3V0Z29pbmc7XG4gICAgaWYgKHJwY1R5cGUgPT09IFwiaW5cIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcIm91dFwiKSB7XG4gICAgICBpc091dGdvaW5nID0gdHJ1ZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJwb29sXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSBmYWxzZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKHRydWUpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpOyAgLy8gVE9ETzogYnV0IGNvdWxkIGl0IGJlP1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJwZW5kaW5nXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcImJsb2NrXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSBmYWxzZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgodHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcImZhaWxlZFwiKSB7XG4gICAgICBpc091dGdvaW5nID0gdHJ1ZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZChmYWxzZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKHRydWUpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVW5yZWNvZ25pemVkIHRyYW5zZmVyIHR5cGU6IFwiICsgcnBjVHlwZSk7XG4gICAgfVxuICAgIHJldHVybiBpc091dGdvaW5nO1xuICB9XG4gIFxuICAvKipcbiAgICogTWVyZ2VzIGEgdHJhbnNhY3Rpb24gaW50byBhIHVuaXF1ZSBzZXQgb2YgdHJhbnNhY3Rpb25zLlxuICAgKlxuICAgKiBAcGFyYW0ge01vbmVyb1R4V2FsbGV0fSB0eCAtIHRoZSB0cmFuc2FjdGlvbiB0byBtZXJnZSBpbnRvIHRoZSBleGlzdGluZyB0eHNcbiAgICogQHBhcmFtIHtPYmplY3R9IHR4TWFwIC0gbWFwcyB0eCBoYXNoZXMgdG8gdHhzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBibG9ja01hcCAtIG1hcHMgYmxvY2sgaGVpZ2h0cyB0byBibG9ja3NcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgbWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKSB7XG4gICAgYXNzZXJ0KHR4LmdldEhhc2goKSAhPT0gdW5kZWZpbmVkKTtcbiAgICBcbiAgICAvLyBtZXJnZSB0eFxuICAgIGxldCBhVHggPSB0eE1hcFt0eC5nZXRIYXNoKCldO1xuICAgIGlmIChhVHggPT09IHVuZGVmaW5lZCkgdHhNYXBbdHguZ2V0SGFzaCgpXSA9IHR4OyAvLyBjYWNoZSBuZXcgdHhcbiAgICBlbHNlIGFUeC5tZXJnZSh0eCk7IC8vIG1lcmdlIHdpdGggZXhpc3RpbmcgdHhcbiAgICBcbiAgICAvLyBtZXJnZSB0eCdzIGJsb2NrIGlmIGNvbmZpcm1lZFxuICAgIGlmICh0eC5nZXRIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgYUJsb2NrID0gYmxvY2tNYXBbdHguZ2V0SGVpZ2h0KCldO1xuICAgICAgaWYgKGFCbG9jayA9PT0gdW5kZWZpbmVkKSBibG9ja01hcFt0eC5nZXRIZWlnaHQoKV0gPSB0eC5nZXRCbG9jaygpOyAvLyBjYWNoZSBuZXcgYmxvY2tcbiAgICAgIGVsc2UgYUJsb2NrLm1lcmdlKHR4LmdldEJsb2NrKCkpOyAvLyBtZXJnZSB3aXRoIGV4aXN0aW5nIGJsb2NrXG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogQ29tcGFyZXMgdHdvIHRyYW5zYWN0aW9ucyBieSB0aGVpciBoZWlnaHQuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbXBhcmVUeHNCeUhlaWdodCh0eDEsIHR4Mikge1xuICAgIGlmICh0eDEuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCAmJiB0eDIuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIDA7IC8vIGJvdGggdW5jb25maXJtZWRcbiAgICBlbHNlIGlmICh0eDEuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIDE7ICAgLy8gdHgxIGlzIHVuY29uZmlybWVkXG4gICAgZWxzZSBpZiAodHgyLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHJldHVybiAtMTsgIC8vIHR4MiBpcyB1bmNvbmZpcm1lZFxuICAgIGxldCBkaWZmID0gdHgxLmdldEhlaWdodCgpIC0gdHgyLmdldEhlaWdodCgpO1xuICAgIGlmIChkaWZmICE9PSAwKSByZXR1cm4gZGlmZjtcbiAgICByZXR1cm4gdHgxLmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eDEpIC0gdHgyLmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eDIpOyAvLyB0eHMgYXJlIGluIHRoZSBzYW1lIGJsb2NrIHNvIHJldGFpbiB0aGVpciBvcmlnaW5hbCBvcmRlclxuICB9XG4gIFxuICAvKipcbiAgICogQ29tcGFyZXMgdHdvIHRyYW5zZmVycyBieSBhc2NlbmRpbmcgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzLlxuICAgKi9cbiAgc3RhdGljIGNvbXBhcmVJbmNvbWluZ1RyYW5zZmVycyh0MSwgdDIpIHtcbiAgICBpZiAodDEuZ2V0QWNjb3VudEluZGV4KCkgPCB0Mi5nZXRBY2NvdW50SW5kZXgoKSkgcmV0dXJuIC0xO1xuICAgIGVsc2UgaWYgKHQxLmdldEFjY291bnRJbmRleCgpID09PSB0Mi5nZXRBY2NvdW50SW5kZXgoKSkgcmV0dXJuIHQxLmdldFN1YmFkZHJlc3NJbmRleCgpIC0gdDIuZ2V0U3ViYWRkcmVzc0luZGV4KCk7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gb3V0cHV0cyBieSBhc2NlbmRpbmcgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzLlxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb21wYXJlT3V0cHV0cyhvMSwgbzIpIHtcbiAgICBcbiAgICAvLyBjb21wYXJlIGJ5IGhlaWdodFxuICAgIGxldCBoZWlnaHRDb21wYXJpc29uID0gTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVUeHNCeUhlaWdodChvMS5nZXRUeCgpLCBvMi5nZXRUeCgpKTtcbiAgICBpZiAoaGVpZ2h0Q29tcGFyaXNvbiAhPT0gMCkgcmV0dXJuIGhlaWdodENvbXBhcmlzb247XG4gICAgXG4gICAgLy8gY29tcGFyZSBieSBhY2NvdW50IGluZGV4LCBzdWJhZGRyZXNzIGluZGV4LCBvdXRwdXQgaW5kZXgsIHRoZW4ga2V5IGltYWdlIGhleFxuICAgIGxldCBjb21wYXJlID0gbzEuZ2V0QWNjb3VudEluZGV4KCkgLSBvMi5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBpZiAoY29tcGFyZSAhPT0gMCkgcmV0dXJuIGNvbXBhcmU7XG4gICAgY29tcGFyZSA9IG8xLmdldFN1YmFkZHJlc3NJbmRleCgpIC0gbzIuZ2V0U3ViYWRkcmVzc0luZGV4KCk7XG4gICAgaWYgKGNvbXBhcmUgIT09IDApIHJldHVybiBjb21wYXJlO1xuICAgIGNvbXBhcmUgPSBvMS5nZXRJbmRleCgpIC0gbzIuZ2V0SW5kZXgoKTtcbiAgICBpZiAoY29tcGFyZSAhPT0gMCkgcmV0dXJuIGNvbXBhcmU7XG4gICAgcmV0dXJuIG8xLmdldEtleUltYWdlKCkuZ2V0SGV4KCkubG9jYWxlQ29tcGFyZShvMi5nZXRLZXlJbWFnZSgpLmdldEhleCgpKTtcbiAgfVxufVxuXG4vKipcbiAqIFBvbGxzIG1vbmVyby13YWxsZXQtcnBjIHRvIHByb3ZpZGUgbGlzdGVuZXIgbm90aWZpY2F0aW9ucy5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgV2FsbGV0UG9sbGVyIHtcblxuICAvLyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgaXNQb2xsaW5nOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgd2FsbGV0OiBNb25lcm9XYWxsZXRScGM7XG4gIHByb3RlY3RlZCBsb29wZXI6IFRhc2tMb29wZXI7XG4gIHByb3RlY3RlZCBwcmV2TG9ja2VkVHhzOiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zOiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2Q29uZmlybWVkTm90aWZpY2F0aW9uczogYW55O1xuICBwcm90ZWN0ZWQgdGhyZWFkUG9vbDogYW55O1xuICBwcm90ZWN0ZWQgbnVtUG9sbGluZzogYW55O1xuICBwcm90ZWN0ZWQgcHJldkhlaWdodDogYW55O1xuICBwcm90ZWN0ZWQgcHJldkJhbGFuY2VzOiBhbnk7XG4gIFxuICBjb25zdHJ1Y3Rvcih3YWxsZXQpIHtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgdGhpcy53YWxsZXQgPSB3YWxsZXQ7XG4gICAgdGhpcy5sb29wZXIgPSBuZXcgVGFza0xvb3Blcihhc3luYyBmdW5jdGlvbigpIHsgYXdhaXQgdGhhdC5wb2xsKCk7IH0pO1xuICAgIHRoaXMucHJldkxvY2tlZFR4cyA9IFtdO1xuICAgIHRoaXMucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucyA9IG5ldyBTZXQoKTsgLy8gdHggaGFzaGVzIG9mIHByZXZpb3VzIG5vdGlmaWNhdGlvbnNcbiAgICB0aGlzLnByZXZDb25maXJtZWROb3RpZmljYXRpb25zID0gbmV3IFNldCgpOyAvLyB0eCBoYXNoZXMgb2YgcHJldmlvdXNseSBjb25maXJtZWQgYnV0IG5vdCB5ZXQgdW5sb2NrZWQgbm90aWZpY2F0aW9uc1xuICAgIHRoaXMudGhyZWFkUG9vbCA9IG5ldyBUaHJlYWRQb29sKDEpOyAvLyBzeW5jaHJvbml6ZSBwb2xsc1xuICAgIHRoaXMubnVtUG9sbGluZyA9IDA7XG4gIH1cbiAgXG4gIHNldElzUG9sbGluZyhpc1BvbGxpbmcpIHtcbiAgICB0aGlzLmlzUG9sbGluZyA9IGlzUG9sbGluZztcbiAgICBpZiAoaXNQb2xsaW5nKSB0aGlzLmxvb3Blci5zdGFydCh0aGlzLndhbGxldC5nZXRTeW5jUGVyaW9kSW5NcygpKTtcbiAgICBlbHNlIHRoaXMubG9vcGVyLnN0b3AoKTtcbiAgfVxuICBcbiAgc2V0UGVyaW9kSW5NcyhwZXJpb2RJbk1zKSB7XG4gICAgdGhpcy5sb29wZXIuc2V0UGVyaW9kSW5NcyhwZXJpb2RJbk1zKTtcbiAgfVxuICBcbiAgYXN5bmMgcG9sbCgpIHtcblxuICAgIC8vIHNraXAgaWYgbmV4dCBwb2xsIGlzIHF1ZXVlZFxuICAgIGlmICh0aGlzLm51bVBvbGxpbmcgPiAxKSByZXR1cm47XG4gICAgdGhpcy5udW1Qb2xsaW5nKys7XG4gICAgXG4gICAgLy8gc3luY2hyb25pemUgcG9sbHNcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgcmV0dXJuIHRoaXMudGhyZWFkUG9vbC5zdWJtaXQoYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICB0cnkge1xuICAgICAgICBcbiAgICAgICAgLy8gc2tpcCBpZiB3YWxsZXQgaXMgY2xvc2VkXG4gICAgICAgIGlmIChhd2FpdCB0aGF0LndhbGxldC5pc0Nsb3NlZCgpKSB7XG4gICAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyB0YWtlIGluaXRpYWwgc25hcHNob3RcbiAgICAgICAgaWYgKHRoYXQucHJldkJhbGFuY2VzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGF0LnByZXZIZWlnaHQgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRIZWlnaHQoKTtcbiAgICAgICAgICB0aGF0LnByZXZMb2NrZWRUeHMgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRUeHMobmV3IE1vbmVyb1R4UXVlcnkoKS5zZXRJc0xvY2tlZCh0cnVlKSk7XG4gICAgICAgICAgdGhhdC5wcmV2QmFsYW5jZXMgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRCYWxhbmNlcygpO1xuICAgICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgaGVpZ2h0IGNoYW5nZXNcbiAgICAgICAgbGV0IGhlaWdodCA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEhlaWdodCgpO1xuICAgICAgICBpZiAodGhhdC5wcmV2SGVpZ2h0ICE9PSBoZWlnaHQpIHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gdGhhdC5wcmV2SGVpZ2h0OyBpIDwgaGVpZ2h0OyBpKyspIGF3YWl0IHRoYXQub25OZXdCbG9jayhpKTtcbiAgICAgICAgICB0aGF0LnByZXZIZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGdldCBsb2NrZWQgdHhzIGZvciBjb21wYXJpc29uIHRvIHByZXZpb3VzXG4gICAgICAgIGxldCBtaW5IZWlnaHQgPSBNYXRoLm1heCgwLCBoZWlnaHQgLSA3MCk7IC8vIG9ubHkgbW9uaXRvciByZWNlbnQgdHhzXG4gICAgICAgIGxldCBsb2NrZWRUeHMgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRUeHMobmV3IE1vbmVyb1R4UXVlcnkoKS5zZXRJc0xvY2tlZCh0cnVlKS5zZXRNaW5IZWlnaHQobWluSGVpZ2h0KS5zZXRJbmNsdWRlT3V0cHV0cyh0cnVlKSk7XG4gICAgICAgIFxuICAgICAgICAvLyBjb2xsZWN0IGhhc2hlcyBvZiB0eHMgbm8gbG9uZ2VyIGxvY2tlZFxuICAgICAgICBsZXQgbm9Mb25nZXJMb2NrZWRIYXNoZXMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgcHJldkxvY2tlZFR4IG9mIHRoYXQucHJldkxvY2tlZFR4cykge1xuICAgICAgICAgIGlmICh0aGF0LmdldFR4KGxvY2tlZFR4cywgcHJldkxvY2tlZFR4LmdldEhhc2goKSkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbm9Mb25nZXJMb2NrZWRIYXNoZXMucHVzaChwcmV2TG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHNhdmUgbG9ja2VkIHR4cyBmb3IgbmV4dCBjb21wYXJpc29uXG4gICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGxvY2tlZFR4cztcbiAgICAgICAgXG4gICAgICAgIC8vIGZldGNoIHR4cyB3aGljaCBhcmUgbm8gbG9uZ2VyIGxvY2tlZFxuICAgICAgICBsZXQgdW5sb2NrZWRUeHMgPSBub0xvbmdlckxvY2tlZEhhc2hlcy5sZW5ndGggPT09IDAgPyBbXSA6IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKGZhbHNlKS5zZXRNaW5IZWlnaHQobWluSGVpZ2h0KS5zZXRIYXNoZXMobm9Mb25nZXJMb2NrZWRIYXNoZXMpLnNldEluY2x1ZGVPdXRwdXRzKHRydWUpKTtcbiAgICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBuZXcgdW5jb25maXJtZWQgYW5kIGNvbmZpcm1lZCBvdXRwdXRzXG4gICAgICAgIGZvciAobGV0IGxvY2tlZFR4IG9mIGxvY2tlZFR4cykge1xuICAgICAgICAgIGxldCBzZWFyY2hTZXQgPSBsb2NrZWRUeC5nZXRJc0NvbmZpcm1lZCgpID8gdGhhdC5wcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucyA6IHRoYXQucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucztcbiAgICAgICAgICBsZXQgdW5hbm5vdW5jZWQgPSAhc2VhcmNoU2V0Lmhhcyhsb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIHNlYXJjaFNldC5hZGQobG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICBpZiAodW5hbm5vdW5jZWQpIGF3YWl0IHRoYXQubm90aWZ5T3V0cHV0cyhsb2NrZWRUeCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIG5ldyB1bmxvY2tlZCBvdXRwdXRzXG4gICAgICAgIGZvciAobGV0IHVubG9ja2VkVHggb2YgdW5sb2NrZWRUeHMpIHtcbiAgICAgICAgICB0aGF0LnByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnMuZGVsZXRlKHVubG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICB0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zLmRlbGV0ZSh1bmxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgYXdhaXQgdGhhdC5ub3RpZnlPdXRwdXRzKHVubG9ja2VkVHgpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBiYWxhbmNlIGNoYW5nZXNcbiAgICAgICAgYXdhaXQgdGhhdC5jaGVja0ZvckNoYW5nZWRCYWxhbmNlcygpO1xuICAgICAgICB0aGF0Lm51bVBvbGxpbmctLTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGJhY2tncm91bmQgcG9sbCB3YWxsZXQgJ1wiICsgYXdhaXQgdGhhdC53YWxsZXQuZ2V0UGF0aCgpICsgXCInOiBcIiArIGVyci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VOZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgbm90aWZ5T3V0cHV0cyh0eCkge1xuICBcbiAgICAvLyBub3RpZnkgc3BlbnQgb3V0cHV0cyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGFsbG93IHNjcmFwZSBvZiB0eCBpbnB1dHMgc28gcHJvdmlkaW5nIG9uZSBpbnB1dCB3aXRoIG91dGdvaW5nIGFtb3VudFxuICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0KHR4LmdldElucHV0cygpID09PSB1bmRlZmluZWQpO1xuICAgICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKVxuICAgICAgICAgIC5zZXRBbW91bnQodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFtb3VudCgpICsgdHguZ2V0RmVlKCkpXG4gICAgICAgICAgLnNldEFjY291bnRJbmRleCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QWNjb3VudEluZGV4KCkpXG4gICAgICAgICAgLnNldFN1YmFkZHJlc3NJbmRleCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDEgPyB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKVswXSA6IHVuZGVmaW5lZCkgLy8gaW5pdGlhbGl6ZSBpZiB0cmFuc2ZlciBzb3VyY2VkIGZyb20gc2luZ2xlIHN1YmFkZHJlc3NcbiAgICAgICAgICAuc2V0VHgodHgpO1xuICAgICAgdHguc2V0SW5wdXRzKFtvdXRwdXRdKTtcbiAgICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlT3V0cHV0U3BlbnQob3V0cHV0KTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IHJlY2VpdmVkIG91dHB1dHNcbiAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHguZ2V0T3V0cHV0cygpICE9PSB1bmRlZmluZWQgJiYgdHguZ2V0T3V0cHV0cygpLmxlbmd0aCA+IDApIHsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBvdXRwdXRzIG9ubHkgcmV0dXJuZWQgZm9yIGNvbmZpcm1lZCB0eHNcbiAgICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmdldE91dHB1dHMoKSkge1xuICAgICAgICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlT3V0cHV0UmVjZWl2ZWQob3V0cHV0KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBhbGxvdyBzY3JhcGUgb2YgdW5jb25maXJtZWQgcmVjZWl2ZWQgb3V0cHV0cyBzbyB1c2luZyBpbmNvbWluZyB0cmFuc2ZlciB2YWx1ZXNcbiAgICAgICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkge1xuICAgICAgICAgIG91dHB1dHMucHVzaChuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KClcbiAgICAgICAgICAgICAgLnNldEFjY291bnRJbmRleCh0cmFuc2Zlci5nZXRBY2NvdW50SW5kZXgoKSlcbiAgICAgICAgICAgICAgLnNldFN1YmFkZHJlc3NJbmRleCh0cmFuc2Zlci5nZXRTdWJhZGRyZXNzSW5kZXgoKSlcbiAgICAgICAgICAgICAgLnNldEFtb3VudCh0cmFuc2Zlci5nZXRBbW91bnQoKSlcbiAgICAgICAgICAgICAgLnNldFR4KHR4KSk7XG4gICAgICAgIH1cbiAgICAgICAgdHguc2V0T3V0cHV0cyhvdXRwdXRzKTtcbiAgICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmdldE91dHB1dHMoKSkge1xuICAgICAgICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlT3V0cHV0UmVjZWl2ZWQob3V0cHV0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIGdldFR4KHR4cywgdHhIYXNoKSB7XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSBpZiAodHhIYXNoID09PSB0eC5nZXRIYXNoKCkpIHJldHVybiB0eDtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY2hlY2tGb3JDaGFuZ2VkQmFsYW5jZXMoKSB7XG4gICAgbGV0IGJhbGFuY2VzID0gYXdhaXQgdGhpcy53YWxsZXQuZ2V0QmFsYW5jZXMoKTtcbiAgICBpZiAoYmFsYW5jZXNbMF0gIT09IHRoaXMucHJldkJhbGFuY2VzWzBdIHx8IGJhbGFuY2VzWzFdICE9PSB0aGlzLnByZXZCYWxhbmNlc1sxXSkge1xuICAgICAgdGhpcy5wcmV2QmFsYW5jZXMgPSBiYWxhbmNlcztcbiAgICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlQmFsYW5jZXNDaGFuZ2VkKGJhbGFuY2VzWzBdLCBiYWxhbmNlc1sxXSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxhQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxXQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxjQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxpQkFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU0sdUJBQUEsR0FBQVAsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFPLFlBQUEsR0FBQVIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFRLGtCQUFBLEdBQUFULHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUyxtQkFBQSxH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