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
    params.proxy = connection ? connection.getProxyUri() : "";
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

  async importMultisigHex(multisigHexes) {
    if (!_GenUtils.default.isArray(multisigHexes)) throw new _MoneroError.default("Must provide string[] to importMultisigHex()");
    let resp = await this.config.getServer().sendJsonRequest("import_multisig_info", { info: multisigHexes });
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

            // get username and password from params
            let userPassIdx = config.cmd.indexOf("--rpc-login");
            let userPass = userPassIdx >= 0 ? config.cmd[userPassIdx + 1] : undefined;
            let username = userPass === undefined ? undefined : userPass.substring(0, userPass.indexOf(':'));
            let password = userPass === undefined ? undefined : userPass.substring(userPass.indexOf(':') + 1);

            // create client connected to internal process
            config = config.copy().setServer({ uri: uri, username: username, password: password, rejectUnauthorized: config.getServer() ? config.getServer().getRejectUnauthorized() : undefined });
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
        let tx = MoneroWalletRpc.convertRpcTxWalletWithOutput(rpcOutput);
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

  static convertRpcTxWalletWithOutput(rpcOutput) {

    // initialize tx
    let tx = new _MoneroTxWallet.default();
    tx.setIsConfirmed(true);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiTW9uZXJvV2FsbGV0UnBjIiwiTW9uZXJvV2FsbGV0IiwiREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwiYWRkcmVzc0NhY2hlIiwic3luY1BlcmlvZEluTXMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRTZXJ2ZXIiLCJvcGVuV2FsbGV0IiwicGF0aE9yQ29uZmlnIiwicGFzc3dvcmQiLCJNb25lcm9XYWxsZXRDb25maWciLCJwYXRoIiwiZ2V0UGF0aCIsInNlbmRKc29uUmVxdWVzdCIsImZpbGVuYW1lIiwiZ2V0UGFzc3dvcmQiLCJjbGVhciIsImdldENvbm5lY3Rpb25NYW5hZ2VyIiwic2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJzZXREYWVtb25Db25uZWN0aW9uIiwiY3JlYXRlV2FsbGV0IiwiY29uZmlnTm9ybWFsaXplZCIsImdldFNlZWQiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0TmV0d29ya1R5cGUiLCJnZXRBY2NvdW50TG9va2FoZWFkIiwiZ2V0U3ViYWRkcmVzc0xvb2thaGVhZCIsInNldFBhc3N3b3JkIiwic2V0U2VydmVyIiwiZ2V0Q29ubmVjdGlvbiIsImNyZWF0ZVdhbGxldEZyb21TZWVkIiwiY3JlYXRlV2FsbGV0RnJvbUtleXMiLCJjcmVhdGVXYWxsZXRSYW5kb20iLCJnZXRTZWVkT2Zmc2V0IiwiZ2V0UmVzdG9yZUhlaWdodCIsImdldFNhdmVDdXJyZW50IiwiZ2V0TGFuZ3VhZ2UiLCJzZXRMYW5ndWFnZSIsIkRFRkFVTFRfTEFOR1VBR0UiLCJwYXJhbXMiLCJsYW5ndWFnZSIsImVyciIsImhhbmRsZUNyZWF0ZVdhbGxldEVycm9yIiwic2VlZCIsInNlZWRfb2Zmc2V0IiwiZW5hYmxlX211bHRpc2lnX2V4cGVyaW1lbnRhbCIsImdldElzTXVsdGlzaWciLCJyZXN0b3JlX2hlaWdodCIsImF1dG9zYXZlX2N1cnJlbnQiLCJzZXRSZXN0b3JlSGVpZ2h0IiwiYWRkcmVzcyIsInZpZXdrZXkiLCJzcGVuZGtleSIsIm5hbWUiLCJtZXNzYWdlIiwidG9Mb3dlckNhc2UiLCJpbmNsdWRlcyIsIk1vbmVyb1JwY0Vycm9yIiwiZ2V0Q29kZSIsImdldFJwY01ldGhvZCIsImdldFJwY1BhcmFtcyIsImlzVmlld09ubHkiLCJrZXlfdHlwZSIsImUiLCJ1cmlPckNvbm5lY3Rpb24iLCJpc1RydXN0ZWQiLCJzc2xPcHRpb25zIiwiY29ubmVjdGlvbiIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJTc2xPcHRpb25zIiwiZ2V0VXJpIiwidXNlcm5hbWUiLCJnZXRVc2VybmFtZSIsInRydXN0ZWQiLCJzc2xfc3VwcG9ydCIsInNzbF9wcml2YXRlX2tleV9wYXRoIiwiZ2V0UHJpdmF0ZUtleVBhdGgiLCJzc2xfY2VydGlmaWNhdGVfcGF0aCIsImdldENlcnRpZmljYXRlUGF0aCIsInNzbF9jYV9maWxlIiwiZ2V0Q2VydGlmaWNhdGVBdXRob3JpdHlGaWxlIiwic3NsX2FsbG93ZWRfZmluZ2VycHJpbnRzIiwiZ2V0QWxsb3dlZEZpbmdlcnByaW50cyIsInNzbF9hbGxvd19hbnlfY2VydCIsImdldEFsbG93QW55Q2VydCIsInByb3h5IiwiZ2V0UHJveHlVcmkiLCJkYWVtb25Db25uZWN0aW9uIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImdldEJhbGFuY2VzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJhc3NlcnQiLCJlcXVhbCIsImJhbGFuY2UiLCJCaWdJbnQiLCJ1bmxvY2tlZEJhbGFuY2UiLCJhY2NvdW50IiwiZ2V0QWNjb3VudHMiLCJnZXRCYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudF9pbmRleCIsImFkZHJlc3NfaW5kaWNlcyIsInJlc3AiLCJyZXN1bHQiLCJ1bmxvY2tlZF9iYWxhbmNlIiwicGVyX3N1YmFkZHJlc3MiLCJhZGRMaXN0ZW5lciIsInJlZnJlc2hMaXN0ZW5pbmciLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiY2hlY2tSZXNlcnZlUHJvb2YiLCJpbmRleE9mIiwiZ2V0VmVyc2lvbiIsIk1vbmVyb1ZlcnNpb24iLCJ2ZXJzaW9uIiwicmVsZWFzZSIsImdldFNlZWRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJsYW5ndWFnZXMiLCJnZXRBZGRyZXNzIiwic3ViYWRkcmVzc01hcCIsImdldFN1YmFkZHJlc3NlcyIsImdldEFkZHJlc3NJbmRleCIsInN1YmFkZHJlc3MiLCJNb25lcm9TdWJhZGRyZXNzIiwic2V0QWNjb3VudEluZGV4IiwiaW5kZXgiLCJtYWpvciIsInNldEluZGV4IiwibWlub3IiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInN0YW5kYXJkQWRkcmVzcyIsInBheW1lbnRJZCIsImludGVncmF0ZWRBZGRyZXNzU3RyIiwic3RhbmRhcmRfYWRkcmVzcyIsInBheW1lbnRfaWQiLCJpbnRlZ3JhdGVkX2FkZHJlc3MiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImludGVncmF0ZWRBZGRyZXNzIiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJzZXRTdGFuZGFyZEFkZHJlc3MiLCJzZXRQYXltZW50SWQiLCJzZXRJbnRlZ3JhdGVkQWRkcmVzcyIsImdldEhlaWdodCIsImhlaWdodCIsImdldERhZW1vbkhlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsInN5bmMiLCJsaXN0ZW5lck9yU3RhcnRIZWlnaHQiLCJzdGFydEhlaWdodCIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwic3RhcnRfaGVpZ2h0IiwicG9sbCIsIk1vbmVyb1N5bmNSZXN1bHQiLCJibG9ja3NfZmV0Y2hlZCIsInJlY2VpdmVkX21vbmV5Iiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluU2Vjb25kcyIsIk1hdGgiLCJyb3VuZCIsImVuYWJsZSIsInBlcmlvZCIsIndhbGxldFBvbGxlciIsInNldFBlcmlvZEluTXMiLCJnZXRTeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwibGVuZ3RoIiwidHhpZHMiLCJyZXNjYW5TcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwic2tpcEJhbGFuY2VzIiwiYWNjb3VudHMiLCJycGNBY2NvdW50Iiwic3ViYWRkcmVzc19hY2NvdW50cyIsImNvbnZlcnRScGNBY2NvdW50Iiwic2V0U3ViYWRkcmVzc2VzIiwiZ2V0SW5kZXgiLCJwdXNoIiwic2V0QmFsYW5jZSIsInNldFVubG9ja2VkQmFsYW5jZSIsInNldE51bVVuc3BlbnRPdXRwdXRzIiwic2V0TnVtQmxvY2tzVG9VbmxvY2siLCJhbGxfYWNjb3VudHMiLCJycGNTdWJhZGRyZXNzIiwiY29udmVydFJwY1N1YmFkZHJlc3MiLCJnZXRBY2NvdW50SW5kZXgiLCJ0Z3RTdWJhZGRyZXNzIiwiZ2V0TnVtVW5zcGVudE91dHB1dHMiLCJnZXRBY2NvdW50IiwiRXJyb3IiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJNb25lcm9BY2NvdW50IiwicHJpbWFyeUFkZHJlc3MiLCJzdWJhZGRyZXNzSW5kaWNlcyIsImFkZHJlc3NfaW5kZXgiLCJsaXN0aWZ5Iiwic3ViYWRkcmVzc2VzIiwiYWRkcmVzc2VzIiwiZ2V0TnVtQmxvY2tzVG9VbmxvY2siLCJnZXRTdWJhZGRyZXNzIiwiY3JlYXRlU3ViYWRkcmVzcyIsInNldEFkZHJlc3MiLCJzZXRMYWJlbCIsInNldElzVXNlZCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwicXVlcnlOb3JtYWxpemVkIiwibm9ybWFsaXplVHhRdWVyeSIsInRyYW5zZmVyUXVlcnkiLCJnZXRUcmFuc2ZlclF1ZXJ5IiwiaW5wdXRRdWVyeSIsImdldElucHV0UXVlcnkiLCJvdXRwdXRRdWVyeSIsImdldE91dHB1dFF1ZXJ5Iiwic2V0VHJhbnNmZXJRdWVyeSIsInNldElucHV0UXVlcnkiLCJzZXRPdXRwdXRRdWVyeSIsInRyYW5zZmVycyIsImdldFRyYW5zZmVyc0F1eCIsIk1vbmVyb1RyYW5zZmVyUXVlcnkiLCJzZXRUeFF1ZXJ5IiwiZGVjb250ZXh0dWFsaXplIiwiY29weSIsInR4cyIsInR4c1NldCIsIlNldCIsInRyYW5zZmVyIiwiZ2V0VHgiLCJhZGQiLCJ0eE1hcCIsImJsb2NrTWFwIiwidHgiLCJtZXJnZVR4IiwiZ2V0SW5jbHVkZU91dHB1dHMiLCJvdXRwdXRRdWVyeUF1eCIsIk1vbmVyb091dHB1dFF1ZXJ5Iiwib3V0cHV0cyIsImdldE91dHB1dHNBdXgiLCJvdXRwdXRUeHMiLCJvdXRwdXQiLCJ0eHNRdWVyaWVkIiwibWVldHNDcml0ZXJpYSIsImdldEJsb2NrIiwic3BsaWNlIiwiZ2V0SXNDb25maXJtZWQiLCJjb25zb2xlIiwiZXJyb3IiLCJnZXRIYXNoZXMiLCJ0eHNCeUlkIiwiTWFwIiwiZ2V0SGFzaCIsIm9yZGVyZWRUeHMiLCJoYXNoIiwiZ2V0VHJhbnNmZXJzIiwibm9ybWFsaXplVHJhbnNmZXJRdWVyeSIsImlzQ29udGV4dHVhbCIsImdldFR4UXVlcnkiLCJmaWx0ZXJUcmFuc2ZlcnMiLCJnZXRPdXRwdXRzIiwibm9ybWFsaXplT3V0cHV0UXVlcnkiLCJmaWx0ZXJPdXRwdXRzIiwiZXhwb3J0T3V0cHV0cyIsImFsbCIsIm91dHB1dHNfZGF0YV9oZXgiLCJpbXBvcnRPdXRwdXRzIiwib3V0cHV0c0hleCIsIm51bV9pbXBvcnRlZCIsImV4cG9ydEtleUltYWdlcyIsInJwY0V4cG9ydEtleUltYWdlcyIsImltcG9ydEtleUltYWdlcyIsImtleUltYWdlcyIsInJwY0tleUltYWdlcyIsIm1hcCIsImtleUltYWdlIiwia2V5X2ltYWdlIiwiZ2V0SGV4Iiwic2lnbmF0dXJlIiwiZ2V0U2lnbmF0dXJlIiwic2lnbmVkX2tleV9pbWFnZXMiLCJpbXBvcnRSZXN1bHQiLCJNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsInNldEhlaWdodCIsInNldFNwZW50QW1vdW50Iiwic3BlbnQiLCJzZXRVbnNwZW50QW1vdW50IiwidW5zcGVudCIsImdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0IiwiZnJlZXplT3V0cHV0IiwidGhhd091dHB1dCIsImlzT3V0cHV0RnJvemVuIiwiZnJvemVuIiwiZ2V0RGVmYXVsdEZlZVByaW9yaXR5IiwicHJpb3JpdHkiLCJjcmVhdGVUeHMiLCJub3JtYWxpemVDcmVhdGVUeHNDb25maWciLCJnZXRDYW5TcGxpdCIsInNldENhblNwbGl0IiwiZ2V0UmVsYXkiLCJpc011bHRpc2lnIiwiZ2V0U3ViYWRkcmVzc0luZGljZXMiLCJzbGljZSIsImRlc3RpbmF0aW9ucyIsImRlc3RpbmF0aW9uIiwiZ2V0RGVzdGluYXRpb25zIiwiZ2V0QW1vdW50IiwiYW1vdW50IiwidG9TdHJpbmciLCJnZXRTdWJ0cmFjdEZlZUZyb20iLCJzdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzIiwic3ViYWRkcl9pbmRpY2VzIiwiZ2V0UGF5bWVudElkIiwiZG9fbm90X3JlbGF5IiwiZ2V0UHJpb3JpdHkiLCJnZXRfdHhfaGV4IiwiZ2V0X3R4X21ldGFkYXRhIiwiZ2V0X3R4X2tleXMiLCJnZXRfdHhfa2V5IiwibnVtVHhzIiwiZmVlX2xpc3QiLCJmZWUiLCJjb3B5RGVzdGluYXRpb25zIiwiaSIsIk1vbmVyb1R4V2FsbGV0IiwiaW5pdFNlbnRUeFdhbGxldCIsImdldE91dGdvaW5nVHJhbnNmZXIiLCJzZXRTdWJhZGRyZXNzSW5kaWNlcyIsImNvbnZlcnRScGNTZW50VHhzVG9UeFNldCIsImNvbnZlcnRScGNUeFRvVHhTZXQiLCJzd2VlcE91dHB1dCIsIm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnIiwiZ2V0S2V5SW1hZ2UiLCJzZXRBbW91bnQiLCJzd2VlcFVubG9ja2VkIiwibm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyIsImluZGljZXMiLCJrZXlzIiwic2V0U3dlZXBFYWNoU3ViYWRkcmVzcyIsImdldFN3ZWVwRWFjaFN1YmFkZHJlc3MiLCJycGNTd2VlcEFjY291bnQiLCJzd2VlcER1c3QiLCJyZWxheSIsInR4U2V0Iiwic2V0SXNSZWxheWVkIiwic2V0SW5UeFBvb2wiLCJnZXRJc1JlbGF5ZWQiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiQXJyYXkiLCJpc0FycmF5IiwidHhPck1ldGFkYXRhIiwibWV0YWRhdGEiLCJnZXRNZXRhZGF0YSIsImhleCIsInR4X2hhc2giLCJkZXNjcmliZVR4U2V0IiwidW5zaWduZWRfdHhzZXQiLCJnZXRVbnNpZ25lZFR4SGV4IiwibXVsdGlzaWdfdHhzZXQiLCJnZXRNdWx0aXNpZ1R4SGV4IiwiY29udmVydFJwY0Rlc2NyaWJlVHJhbnNmZXIiLCJzaWduVHhzIiwidW5zaWduZWRUeEhleCIsImV4cG9ydF9yYXciLCJzdWJtaXRUeHMiLCJzaWduZWRUeEhleCIsInR4X2RhdGFfaGV4IiwidHhfaGFzaF9saXN0Iiwic2lnbk1lc3NhZ2UiLCJzaWduYXR1cmVUeXBlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJTSUdOX1dJVEhfU1BFTkRfS0VZIiwiZGF0YSIsInNpZ25hdHVyZV90eXBlIiwidmVyaWZ5TWVzc2FnZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJnb29kIiwiaXNHb29kIiwiaXNPbGQiLCJvbGQiLCJTSUdOX1dJVEhfVklFV19LRVkiLCJnZXRUeEtleSIsInR4SGFzaCIsInR4aWQiLCJ0eF9rZXkiLCJjaGVja1R4S2V5IiwidHhLZXkiLCJjaGVjayIsIk1vbmVyb0NoZWNrVHgiLCJzZXRJc0dvb2QiLCJzZXROdW1Db25maXJtYXRpb25zIiwiY29uZmlybWF0aW9ucyIsImluX3Bvb2wiLCJzZXRSZWNlaXZlZEFtb3VudCIsInJlY2VpdmVkIiwiZ2V0VHhQcm9vZiIsImNoZWNrVHhQcm9vZiIsImdldFNwZW5kUHJvb2YiLCJjaGVja1NwZW5kUHJvb2YiLCJnZXRSZXNlcnZlUHJvb2ZXYWxsZXQiLCJnZXRSZXNlcnZlUHJvb2ZBY2NvdW50IiwiTW9uZXJvQ2hlY2tSZXNlcnZlIiwic2V0VW5jb25maXJtZWRTcGVudEFtb3VudCIsInNldFRvdGFsQW1vdW50IiwidG90YWwiLCJnZXRUeE5vdGVzIiwibm90ZXMiLCJzZXRUeE5vdGVzIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiZW50cmllcyIsInJwY0VudHJ5IiwiTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsInNldERlc2NyaXB0aW9uIiwiZGVzY3JpcHRpb24iLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJzZXRfYWRkcmVzcyIsInNldF9kZXNjcmlwdGlvbiIsImRlbGV0ZUFkZHJlc3NCb29rRW50cnkiLCJlbnRyeUlkeCIsInRhZ0FjY291bnRzIiwiYWNjb3VudEluZGljZXMiLCJ1bnRhZ0FjY291bnRzIiwiZ2V0QWNjb3VudFRhZ3MiLCJ0YWdzIiwiYWNjb3VudF90YWdzIiwicnBjQWNjb3VudFRhZyIsIk1vbmVyb0FjY291bnRUYWciLCJzZXRBY2NvdW50VGFnTGFiZWwiLCJnZXRQYXltZW50VXJpIiwicmVjaXBpZW50X25hbWUiLCJnZXRSZWNpcGllbnROYW1lIiwidHhfZGVzY3JpcHRpb24iLCJnZXROb3RlIiwidXJpIiwicGFyc2VQYXltZW50VXJpIiwiTW9uZXJvVHhDb25maWciLCJzZXRSZWNpcGllbnROYW1lIiwic2V0Tm90ZSIsImdldEF0dHJpYnV0ZSIsInZhbHVlIiwic2V0QXR0cmlidXRlIiwidmFsIiwic3RhcnRNaW5pbmciLCJudW1UaHJlYWRzIiwiYmFja2dyb3VuZE1pbmluZyIsImlnbm9yZUJhdHRlcnkiLCJ0aHJlYWRzX2NvdW50IiwiZG9fYmFja2dyb3VuZF9taW5pbmciLCJpZ25vcmVfYmF0dGVyeSIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwibXVsdGlzaWdfaW1wb3J0X25lZWRlZCIsImdldE11bHRpc2lnSW5mbyIsImluZm8iLCJNb25lcm9NdWx0aXNpZ0luZm8iLCJzZXRJc011bHRpc2lnIiwibXVsdGlzaWciLCJzZXRJc1JlYWR5IiwicmVhZHkiLCJzZXRUaHJlc2hvbGQiLCJ0aHJlc2hvbGQiLCJzZXROdW1QYXJ0aWNpcGFudHMiLCJwcmVwYXJlTXVsdGlzaWciLCJtdWx0aXNpZ19pbmZvIiwibWFrZU11bHRpc2lnIiwibXVsdGlzaWdIZXhlcyIsImV4Y2hhbmdlTXVsdGlzaWdLZXlzIiwibXNSZXN1bHQiLCJNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQiLCJzZXRNdWx0aXNpZ0hleCIsImdldE11bHRpc2lnSGV4IiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJpbXBvcnRNdWx0aXNpZ0hleCIsIm5fb3V0cHV0cyIsInNpZ25NdWx0aXNpZ1R4SGV4IiwibXVsdGlzaWdUeEhleCIsInNpZ25SZXN1bHQiLCJNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJzZXRTaWduZWRNdWx0aXNpZ1R4SGV4Iiwic2V0VHhIYXNoZXMiLCJzdWJtaXRNdWx0aXNpZ1R4SGV4Iiwic2lnbmVkTXVsdGlzaWdUeEhleCIsImNoYW5nZVBhc3N3b3JkIiwib2xkUGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsIm9sZF9wYXNzd29yZCIsIm5ld19wYXNzd29yZCIsInNhdmUiLCJjbG9zZSIsImlzQ2xvc2VkIiwic3RvcCIsImdldEluY29taW5nVHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlcnMiLCJjcmVhdGVUeCIsInJlbGF5VHgiLCJnZXRUeE5vdGUiLCJzZXRUeE5vdGUiLCJub3RlIiwiY29ubmVjdFRvV2FsbGV0UnBjIiwidXJpT3JDb25maWciLCJub3JtYWxpemVDb25maWciLCJjbWQiLCJzdGFydFdhbGxldFJwY1Byb2Nlc3MiLCJjaGlsZF9wcm9jZXNzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aGVuIiwiY2hpbGRQcm9jZXNzIiwic3Bhd24iLCJlbnYiLCJMQU5HIiwic3Rkb3V0Iiwic2V0RW5jb2RpbmciLCJzdGRlcnIiLCJ0aGF0IiwicmVqZWN0Iiwib24iLCJsaW5lIiwiTGlicmFyeVV0aWxzIiwibG9nIiwidXJpTGluZUNvbnRhaW5zIiwidXJpTGluZUNvbnRhaW5zSWR4IiwiaG9zdCIsInN1YnN0cmluZyIsImxhc3RJbmRleE9mIiwidW5mb3JtYXR0ZWRMaW5lIiwicmVwbGFjZSIsInRyaW0iLCJwb3J0Iiwic3NsSWR4Iiwic3NsRW5hYmxlZCIsInVzZXJQYXNzSWR4IiwidXNlclBhc3MiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJnZXRSZWplY3RVbmF1dGhvcml6ZWQiLCJ3YWxsZXQiLCJpc1Jlc29sdmVkIiwiZ2V0TG9nTGV2ZWwiLCJjb2RlIiwib3JpZ2luIiwiZ2V0QWNjb3VudEluZGljZXMiLCJ0eFF1ZXJ5IiwiY2FuQmVDb25maXJtZWQiLCJnZXRJblR4UG9vbCIsImdldElzRmFpbGVkIiwiY2FuQmVJblR4UG9vbCIsImdldE1heEhlaWdodCIsImdldElzTG9ja2VkIiwiY2FuQmVJbmNvbWluZyIsImdldElzSW5jb21pbmciLCJnZXRJc091dGdvaW5nIiwiZ2V0SGFzRGVzdGluYXRpb25zIiwiY2FuQmVPdXRnb2luZyIsImluIiwib3V0IiwicG9vbCIsInBlbmRpbmciLCJmYWlsZWQiLCJnZXRNaW5IZWlnaHQiLCJtaW5faGVpZ2h0IiwibWF4X2hlaWdodCIsImZpbHRlcl9ieV9oZWlnaHQiLCJnZXRTdWJhZGRyZXNzSW5kZXgiLCJzaXplIiwiZnJvbSIsInJwY1R4IiwiY29udmVydFJwY1R4V2l0aFRyYW5zZmVyIiwiZ2V0T3V0Z29pbmdBbW91bnQiLCJvdXRnb2luZ1RyYW5zZmVyIiwidHJhbnNmZXJUb3RhbCIsInZhbHVlcyIsInNvcnQiLCJjb21wYXJlVHhzQnlIZWlnaHQiLCJzZXRJc0luY29taW5nIiwic2V0SXNPdXRnb2luZyIsImNvbXBhcmVJbmNvbWluZ1RyYW5zZmVycyIsInRyYW5zZmVyX3R5cGUiLCJnZXRJc1NwZW50IiwidmVyYm9zZSIsInJwY091dHB1dCIsImNvbnZlcnRScGNUeFdhbGxldFdpdGhPdXRwdXQiLCJjb21wYXJlT3V0cHV0cyIsInJwY0ltYWdlIiwiTW9uZXJvS2V5SW1hZ2UiLCJiZWxvd19hbW91bnQiLCJnZXRCZWxvd0Ftb3VudCIsInNldElzTG9ja2VkIiwic2V0SXNDb25maXJtZWQiLCJzZXRSZWxheSIsInNldElzTWluZXJUeCIsInNldElzRmFpbGVkIiwiTW9uZXJvRGVzdGluYXRpb24iLCJzZXREZXN0aW5hdGlvbnMiLCJzZXRPdXRnb2luZ1RyYW5zZmVyIiwiZ2V0VW5sb2NrVGltZSIsInNldFVubG9ja1RpbWUiLCJnZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsInNldExhc3RSZWxheWVkVGltZXN0YW1wIiwiRGF0ZSIsImdldFRpbWUiLCJnZXRJc0RvdWJsZVNwZW5kU2VlbiIsInNldElzRG91YmxlU3BlbmRTZWVuIiwibGlzdGVuZXJzIiwiV2FsbGV0UG9sbGVyIiwic2V0SXNQb2xsaW5nIiwiaXNQb2xsaW5nIiwic2VydmVyIiwicHJveHlUb1dvcmtlciIsInNldFByaW1hcnlBZGRyZXNzIiwic2V0VGFnIiwiZ2V0VGFnIiwic2V0UmluZ1NpemUiLCJNb25lcm9VdGlscyIsIlJJTkdfU0laRSIsIk1vbmVyb091dGdvaW5nVHJhbnNmZXIiLCJzZXRUeCIsImRlc3RDb3BpZXMiLCJkZXN0IiwiY29udmVydFJwY1R4U2V0IiwicnBjTWFwIiwiTW9uZXJvVHhTZXQiLCJzZXRNdWx0aXNpZ1R4SGV4Iiwic2V0VW5zaWduZWRUeEhleCIsInNldFNpZ25lZFR4SGV4Iiwic2lnbmVkX3R4c2V0IiwiZ2V0U2lnbmVkVHhIZXgiLCJycGNUeHMiLCJzZXRUeHMiLCJzZXRUeFNldCIsInNldEhhc2giLCJzZXRLZXkiLCJzZXRGdWxsSGV4Iiwic2V0TWV0YWRhdGEiLCJzZXRGZWUiLCJzZXRXZWlnaHQiLCJpbnB1dEtleUltYWdlc0xpc3QiLCJhc3NlcnRUcnVlIiwiZ2V0SW5wdXRzIiwic2V0SW5wdXRzIiwiaW5wdXRLZXlJbWFnZSIsIk1vbmVyb091dHB1dFdhbGxldCIsInNldEtleUltYWdlIiwic2V0SGV4IiwiYW1vdW50c0J5RGVzdExpc3QiLCJkZXN0aW5hdGlvbklkeCIsInR4SWR4IiwiYW1vdW50c0J5RGVzdCIsImlzT3V0Z29pbmciLCJ0eXBlIiwiZGVjb2RlUnBjVHlwZSIsImhlYWRlciIsInNldFNpemUiLCJNb25lcm9CbG9ja0hlYWRlciIsInNldFRpbWVzdGFtcCIsIk1vbmVyb0luY29taW5nVHJhbnNmZXIiLCJzZXROdW1TdWdnZXN0ZWRDb25maXJtYXRpb25zIiwiREVGQVVMVF9QQVlNRU5UX0lEIiwicnBjSW5kaWNlcyIsInJwY0luZGV4Iiwic2V0U3ViYWRkcmVzc0luZGV4IiwicnBjRGVzdGluYXRpb24iLCJkZXN0aW5hdGlvbktleSIsInNldElucHV0U3VtIiwic2V0T3V0cHV0U3VtIiwic2V0Q2hhbmdlQWRkcmVzcyIsInNldENoYW5nZUFtb3VudCIsInNldE51bUR1bW15T3V0cHV0cyIsInNldEV4dHJhSGV4IiwiaW5wdXRLZXlJbWFnZXMiLCJrZXlfaW1hZ2VzIiwiYW1vdW50cyIsInNldEJsb2NrIiwiTW9uZXJvQmxvY2siLCJtZXJnZSIsInNldEluY29taW5nVHJhbnNmZXJzIiwic2V0SXNTcGVudCIsInNldElzRnJvemVuIiwic2V0U3RlYWx0aFB1YmxpY0tleSIsInNldE91dHB1dHMiLCJycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0IiwicnBjVHlwZSIsImFUeCIsImFCbG9jayIsInR4MSIsInR4MiIsImRpZmYiLCJ0MSIsInQyIiwibzEiLCJvMiIsImhlaWdodENvbXBhcmlzb24iLCJjb21wYXJlIiwibG9jYWxlQ29tcGFyZSIsImV4cG9ydHMiLCJsb29wZXIiLCJUYXNrTG9vcGVyIiwicHJldkxvY2tlZFR4cyIsInByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnMiLCJwcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucyIsInRocmVhZFBvb2wiLCJUaHJlYWRQb29sIiwibnVtUG9sbGluZyIsInN0YXJ0IiwicGVyaW9kSW5NcyIsInN1Ym1pdCIsInByZXZCYWxhbmNlcyIsInByZXZIZWlnaHQiLCJNb25lcm9UeFF1ZXJ5Iiwib25OZXdCbG9jayIsIm1pbkhlaWdodCIsIm1heCIsImxvY2tlZFR4cyIsInNldE1pbkhlaWdodCIsInNldEluY2x1ZGVPdXRwdXRzIiwibm9Mb25nZXJMb2NrZWRIYXNoZXMiLCJwcmV2TG9ja2VkVHgiLCJ1bmxvY2tlZFR4cyIsInNldEhhc2hlcyIsImxvY2tlZFR4Iiwic2VhcmNoU2V0IiwidW5hbm5vdW5jZWQiLCJub3RpZnlPdXRwdXRzIiwidW5sb2NrZWRUeCIsImRlbGV0ZSIsImNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzIiwiYW5ub3VuY2VOZXdCbG9jayIsImdldEZlZSIsImFubm91bmNlT3V0cHV0U3BlbnQiLCJhbm5vdW5jZU91dHB1dFJlY2VpdmVkIiwiYmFsYW5jZXMiLCJhbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRScGMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4uL2NvbW1vbi9UYXNrTG9vcGVyXCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50XCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudFRhZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50VGFnXCI7XG5pbXBvcnQgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BZGRyZXNzQm9va0VudHJ5XCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrSGVhZGVyIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tIZWFkZXJcIjtcbmltcG9ydCBNb25lcm9DaGVja1Jlc2VydmUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tSZXNlcnZlXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvRGVzdGluYXRpb24gZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGVzdGluYXRpb25cIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbmNvbWluZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbmZvXCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5pdFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHRcIjtcbmltcG9ydCBNb25lcm9PdXRnb2luZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb091dGdvaW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1JwY0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjRXJyb3JcIjtcbmltcG9ydCBNb25lcm9TdWJhZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb1N1YmFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9TeW5jUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb1N5bmNSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyUXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVHhcIjtcbmltcG9ydCBNb25lcm9UeENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb1R4UHJpb3JpdHkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhQcmlvcml0eVwiO1xuaW1wb3J0IE1vbmVyb1R4UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4U2V0XCI7XG5pbXBvcnQgTW9uZXJvVHhXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9VdGlscyBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1V0aWxzXCI7XG5pbXBvcnQgTW9uZXJvVmVyc2lvbiBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1ZlcnNpb25cIjtcbmltcG9ydCBNb25lcm9XYWxsZXQgZnJvbSBcIi4vTW9uZXJvV2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldExpc3RlbmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldExpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGVcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHRcIjtcbmltcG9ydCBUaHJlYWRQb29sIGZyb20gXCIuLi9jb21tb24vVGhyZWFkUG9vbFwiO1xuaW1wb3J0IFNzbE9wdGlvbnMgZnJvbSBcIi4uL2NvbW1vbi9Tc2xPcHRpb25zXCI7XG5pbXBvcnQgeyBDaGlsZFByb2Nlc3MgfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuXG4vKipcbiAqIENvcHlyaWdodCAoYykgd29vZHNlclxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvV2FsbGV0IGFzIGEgY2xpZW50IG9mIG1vbmVyby13YWxsZXQtcnBjLlxuICogXG4gKiBAaW1wbGVtZW50cyB7TW9uZXJvV2FsbGV0fVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9XYWxsZXRScGMgZXh0ZW5kcyBNb25lcm9XYWxsZXQge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TID0gMjAwMDA7IC8vIGRlZmF1bHQgcGVyaW9kIGJldHdlZW4gc3luY3MgaW4gbXMgKGRlZmluZWQgYnkgREVGQVVMVF9BVVRPX1JFRlJFU0hfUEVSSU9EIGluIHdhbGxldF9ycGNfc2VydmVyLmNwcClcblxuICAvLyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+O1xuICBwcm90ZWN0ZWQgYWRkcmVzc0NhY2hlOiBhbnk7XG4gIHByb3RlY3RlZCBzeW5jUGVyaW9kSW5NczogbnVtYmVyO1xuICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiBNb25lcm9XYWxsZXRMaXN0ZW5lcltdO1xuICBwcm90ZWN0ZWQgcHJvY2VzczogYW55O1xuICBwcm90ZWN0ZWQgcGF0aDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgZGFlbW9uQ29ubmVjdGlvbjogTW9uZXJvUnBjQ29ubmVjdGlvbjtcbiAgcHJvdGVjdGVkIHdhbGxldFBvbGxlcjogV2FsbGV0UG9sbGVyO1xuICBcbiAgLyoqIEBwcml2YXRlICovXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9OyAvLyBhdm9pZCB1bmVjZXNzYXJ5IHJlcXVlc3RzIGZvciBhZGRyZXNzZXNcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gTW9uZXJvV2FsbGV0UnBjLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVM7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBSUEMgV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtDaGlsZFByb2Nlc3N9IHRoZSBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMsIHVuZGVmaW5lZCBpZiBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXG4gICAqL1xuICBnZXRQcm9jZXNzKCk6IENoaWxkUHJvY2VzcyB7XG4gICAgcmV0dXJuIHRoaXMucHJvY2VzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3AgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm8td2FsbGV0LXJwYywgaWYgYXBwbGljYWJsZS5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2Ugc3BlY2lmaWVzIGlmIHRoZSBwcm9jZXNzIHNob3VsZCBiZSBkZXN0cm95ZWQgZm9yY2libHkgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPn0gdGhlIGV4aXQgY29kZSBmcm9tIHN0b3BwaW5nIHRoZSBwcm9jZXNzXG4gICAqL1xuICBhc3luYyBzdG9wUHJvY2Vzcyhmb3JjZSA9IGZhbHNlKTogUHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+ICB7XG4gICAgaWYgKHRoaXMucHJvY2VzcyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMgaW5zdGFuY2Ugbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1wiKTtcbiAgICBsZXQgbGlzdGVuZXJzQ29weSA9IEdlblV0aWxzLmNvcHlBcnJheSh0aGlzLmdldExpc3RlbmVycygpKTtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnNDb3B5KSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gR2VuVXRpbHMua2lsbFByb2Nlc3ModGhpcy5wcm9jZXNzLCBmb3JjZSA/IFwiU0lHS0lMTFwiIDogdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgUlBDIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9uIHwgdW5kZWZpbmVkfSB0aGUgd2FsbGV0J3MgcnBjIGNvbm5lY3Rpb25cbiAgICovXG4gIGdldFJwY0Nvbm5lY3Rpb24oKTogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+T3BlbiBhbiBleGlzdGluZyB3YWxsZXQgb24gdGhlIG1vbmVyby13YWxsZXQtcnBjIHNlcnZlci48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlOjxwPlxuICAgKiBcbiAgICogPGNvZGU+XG4gICAqIGxldCB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0UnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4NFwiLCBcInJwY191c2VyXCIsIFwiYWJjMTIzXCIpOzxicj5cbiAgICogYXdhaXQgd2FsbGV0Lm9wZW5XYWxsZXQoXCJteXdhbGxldDFcIiwgXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIpOzxicj5cbiAgICogPGJyPlxuICAgKiBhd2FpdCB3YWxsZXQub3BlbldhbGxldCh7PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGF0aDogXCJteXdhbGxldDJcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VydmVyOiBcImh0dHA6Ly9sb2NhaG9zdDozODA4MVwiLCAvLyBvciBvYmplY3Qgd2l0aCB1cmksIHVzZXJuYW1lLCBwYXNzd29yZCwgZXRjIDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2U8YnI+XG4gICAqIH0pOzxicj5cbiAgICogPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvV2FsbGV0Q29uZmlnfSBwYXRoT3JDb25maWcgIC0gdGhlIHdhbGxldCdzIG5hbWUgb3IgY29uZmlndXJhdGlvbiB0byBvcGVuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoT3JDb25maWcucGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCBpbi1tZW1vcnkgd2FsbGV0IGlmIG5vdCBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhPckNvbmZpZy5wYXNzd29yZCAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IHBhdGhPckNvbmZpZy5zZXJ2ZXIgLSB1cmkgb3IgTW9uZXJvUnBjQ29ubmVjdGlvbiBvZiBhIGRhZW1vbiB0byB1c2UgKG9wdGlvbmFsLCBtb25lcm8td2FsbGV0LXJwYyB1c3VhbGx5IHN0YXJ0ZWQgd2l0aCBkYWVtb24gY29uZmlnKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3Bhc3N3b3JkXSB0aGUgd2FsbGV0J3MgcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9XYWxsZXRScGM+fSB0aGlzIHdhbGxldCBjbGllbnRcbiAgICovXG4gIGFzeW5jIG9wZW5XYWxsZXQocGF0aE9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4sIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHR5cGVvZiBwYXRoT3JDb25maWcgPT09IFwic3RyaW5nXCIgPyB7cGF0aDogcGF0aE9yQ29uZmlnLCBwYXNzd29yZDogcGFzc3dvcmQgPyBwYXNzd29yZCA6IFwiXCJ9IDogcGF0aE9yQ29uZmlnKTtcbiAgICAvLyBUT0RPOiBlbnN1cmUgb3RoZXIgZmllbGRzIHVuaW5pdGlhbGl6ZWQ/XG4gICAgXG4gICAgLy8gb3BlbiB3YWxsZXQgb24gcnBjIHNlcnZlclxuICAgIGlmICghY29uZmlnLmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIG5hbWUgb2Ygd2FsbGV0IHRvIG9wZW5cIik7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwib3Blbl93YWxsZXRcIiwge2ZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLCBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCl9KTtcbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXIgb3Igc2VydmVyXG4gICAgaWYgKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpICE9IG51bGwpIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgb3BlbmVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGF3YWl0IHRoaXMuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIH0gZWxzZSBpZiAoY29uZmlnLmdldFNlcnZlcigpICE9IG51bGwpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2V0RGFlbW9uQ29ubmVjdGlvbihjb25maWcuZ2V0U2VydmVyKCkpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPkNyZWF0ZSBhbmQgb3BlbiBhIHdhbGxldCBvbiB0aGUgbW9uZXJvLXdhbGxldC1ycGMgc2VydmVyLjxwPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZTo8cD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiAmc29sOyZzb2w7IGNvbnN0cnVjdCBjbGllbnQgdG8gbW9uZXJvLXdhbGxldC1ycGM8YnI+XG4gICAqIGxldCB3YWxsZXRScGMgPSBuZXcgTW9uZXJvV2FsbGV0UnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4NFwiLCBcInJwY191c2VyXCIsIFwiYWJjMTIzXCIpOzxicj48YnI+XG4gICAqIFxuICAgKiAmc29sOyZzb2w7IGNyZWF0ZSBhbmQgb3BlbiB3YWxsZXQgb24gbW9uZXJvLXdhbGxldC1ycGM8YnI+XG4gICAqIGF3YWl0IHdhbGxldFJwYy5jcmVhdGVXYWxsZXQoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwibXl3YWxsZXRcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJhYmMxMjNcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBzZWVkOiBcImNvZXhpc3QgaWdsb28gcGFtcGhsZXQgbGFnb29uLi4uXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcmVzdG9yZUhlaWdodDogMTU0MzIxOGw8YnI+XG4gICAqIH0pO1xuICAgKiAgPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz59IGNvbmZpZyAtIE1vbmVyb1dhbGxldENvbmZpZyBvciBlcXVpdmFsZW50IEpTIG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXRoXSAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCBpbi1tZW1vcnkgd2FsbGV0IGlmIG5vdCBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGFzc3dvcmRdIC0gcGFzc3dvcmQgb2YgdGhlIHdhbGxldCB0byBjcmVhdGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZF0gLSBzZWVkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgcmFuZG9tIHdhbGxldCBjcmVhdGVkIGlmIG5laXRoZXIgc2VlZCBub3Iga2V5cyBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZE9mZnNldF0gLSB0aGUgb2Zmc2V0IHVzZWQgdG8gZGVyaXZlIGEgbmV3IHNlZWQgZnJvbSB0aGUgZ2l2ZW4gc2VlZCB0byByZWNvdmVyIGEgc2VjcmV0IHdhbGxldCBmcm9tIHRoZSBzZWVkXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5pc011bHRpc2lnXSAtIHJlc3RvcmUgbXVsdGlzaWcgd2FsbGV0IGZyb20gc2VlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcmltYXJ5QWRkcmVzc10gLSBwcmltYXJ5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9ubHkgcHJvdmlkZSBpZiByZXN0b3JpbmcgZnJvbSBrZXlzKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlVmlld0tleV0gLSBwcml2YXRlIHZpZXcga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVNwZW5kS2V5XSAtIHByaXZhdGUgc3BlbmQga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcucmVzdG9yZUhlaWdodF0gLSBibG9jayBoZWlnaHQgdG8gc3RhcnQgc2Nhbm5pbmcgZnJvbSAoZGVmYXVsdHMgdG8gMCB1bmxlc3MgZ2VuZXJhdGluZyByYW5kb20gd2FsbGV0KVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5sYW5ndWFnZV0gLSBsYW5ndWFnZSBvZiB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQgKGRlZmF1bHRzIHRvIFwiRW5nbGlzaFwiIG9yIGF1dG8tZGV0ZWN0ZWQpXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gW2NvbmZpZy5zZXJ2ZXJdIC0gTW9uZXJvUnBjQ29ubmVjdGlvbiB0byBhIG1vbmVybyBkYWVtb24gKG9wdGlvbmFsKTxicj5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyVXJpXSAtIHVyaSBvZiBhIGRhZW1vbiB0byB1c2UgKG9wdGlvbmFsLCBtb25lcm8td2FsbGV0LXJwYyB1c3VhbGx5IHN0YXJ0ZWQgd2l0aCBkYWVtb24gY29uZmlnKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZXJ2ZXJVc2VybmFtZV0gLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgZGFlbW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyUGFzc3dvcmRdIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIGRhZW1vbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJ9IFtjb25maWcuY29ubmVjdGlvbk1hbmFnZXJdIC0gbWFuYWdlIGNvbm5lY3Rpb25zIHRvIG1vbmVyb2QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVqZWN0VW5hdXRob3JpemVkXSAtIHJlamVjdCBzZWxmLXNpZ25lZCBzZXJ2ZXIgY2VydGlmaWNhdGVzIGlmIHRydWUgKGRlZmF1bHRzIHRvIHRydWUpXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gW2NvbmZpZy5zZXJ2ZXJdIC0gTW9uZXJvUnBjQ29ubmVjdGlvbiBvciBlcXVpdmFsZW50IEpTIG9iamVjdCBwcm92aWRpbmcgZGFlbW9uIGNvbmZpZ3VyYXRpb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuc2F2ZUN1cnJlbnRdIC0gc3BlY2lmaWVzIGlmIHRoZSBjdXJyZW50IFJQQyB3YWxsZXQgc2hvdWxkIGJlIHNhdmVkIGJlZm9yZSBiZWluZyBjbG9zZWQgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHJldHVybiB7TW9uZXJvV2FsbGV0UnBjfSB0aGlzIHdhbGxldCBjbGllbnRcbiAgICovXG4gIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBjb25maWcgdG8gY3JlYXRlIHdhbGxldFwiKTtcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkICYmIChjb25maWdOb3JtYWxpemVkLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVWaWV3S2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIGluaXRpYWxpemVkIHdpdGggYSBzZWVkIG9yIGtleXMgYnV0IG5vdCBib3RoXCIpO1xuICAgIH1cbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXROZXR3b3JrVHlwZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIG5ldHdvcmtUeXBlIHdoZW4gY3JlYXRpbmcgUlBDIHdhbGxldCBiZWNhdXNlIHNlcnZlcidzIG5ldHdvcmsgdHlwZSBpcyBhbHJlYWR5IHNldFwiKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50TG9va2FoZWFkKCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NMb29rYWhlYWQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGNyZWF0aW5nIHdhbGxldHMgd2l0aCBzdWJhZGRyZXNzIGxvb2thaGVhZCBvdmVyIHJwY1wiKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRQYXNzd29yZCgpID09PSB1bmRlZmluZWQpIGNvbmZpZ05vcm1hbGl6ZWQuc2V0UGFzc3dvcmQoXCJcIik7XG5cbiAgICAvLyBzZXQgc2VydmVyIGZyb20gY29ubmVjdGlvbiBtYW5hZ2VyIGlmIHByb3ZpZGVkXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgY3JlYXRlZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBjb25maWdOb3JtYWxpemVkLnNldFNlcnZlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKS5nZXRDb25uZWN0aW9uKCkpO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCkgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWdOb3JtYWxpemVkKTtcbiAgICBlbHNlIGlmIChjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQpIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0RnJvbUtleXMoY29uZmlnTm9ybWFsaXplZCk7XG4gICAgZWxzZSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldFJhbmRvbShjb25maWdOb3JtYWxpemVkKTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXIgb3Igc2VydmVyXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXRDb25uZWN0aW9uTWFuYWdlcihjb25maWdOb3JtYWxpemVkLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIH0gZWxzZSBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldFJhbmRvbShjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHJlc3RvcmVIZWlnaHQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKSA9PT0gZmFsc2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkN1cnJlbnQgd2FsbGV0IGlzIHNhdmVkIGF1dG9tYXRpY2FsbHkgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmICghY29uZmlnLmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTmFtZSBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0TGFuZ3VhZ2UoKSkgY29uZmlnLnNldExhbmd1YWdlKE1vbmVyb1dhbGxldC5ERUZBVUxUX0xBTkdVQUdFKTtcbiAgICBsZXQgcGFyYW1zID0geyBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSwgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLCBsYW5ndWFnZTogY29uZmlnLmdldExhbmd1YWdlKCkgfTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX3dhbGxldFwiLCBwYXJhbXMpO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aGlzLmhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKGNvbmZpZy5nZXRQYXRoKCksIGVycik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVzdG9yZV9kZXRlcm1pbmlzdGljX3dhbGxldFwiLCB7XG4gICAgICAgIGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLFxuICAgICAgICBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksXG4gICAgICAgIHNlZWQ6IGNvbmZpZy5nZXRTZWVkKCksXG4gICAgICAgIHNlZWRfb2Zmc2V0OiBjb25maWcuZ2V0U2VlZE9mZnNldCgpLFxuICAgICAgICBlbmFibGVfbXVsdGlzaWdfZXhwZXJpbWVudGFsOiBjb25maWcuZ2V0SXNNdWx0aXNpZygpLFxuICAgICAgICByZXN0b3JlX2hlaWdodDogY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSxcbiAgICAgICAgbGFuZ3VhZ2U6IGNvbmZpZy5nZXRMYW5ndWFnZSgpLFxuICAgICAgICBhdXRvc2F2ZV9jdXJyZW50OiBjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBrZXlzXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRSZXN0b3JlSGVpZ2h0KDApO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoTW9uZXJvV2FsbGV0LkRFRkFVTFRfTEFOR1VBR0UpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZW5lcmF0ZV9mcm9tX2tleXNcIiwge1xuICAgICAgICBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSxcbiAgICAgICAgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLFxuICAgICAgICBhZGRyZXNzOiBjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSxcbiAgICAgICAgdmlld2tleTogY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCksXG4gICAgICAgIHNwZW5ka2V5OiBjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCksXG4gICAgICAgIHJlc3RvcmVfaGVpZ2h0OiBjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpLFxuICAgICAgICBhdXRvc2F2ZV9jdXJyZW50OiBjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBoYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihuYW1lLCBlcnIpIHtcbiAgICBpZiAoZXJyLm1lc3NhZ2UpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwiYWxyZWFkeSBleGlzdHNcIikpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBuYW1lLCBlcnIuZ2V0Q29kZSgpLCBlcnIuZ2V0UnBjTWV0aG9kKCksIGVyci5nZXRScGNQYXJhbXMoKSk7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcIndvcmQgbGlzdCBmYWlsZWQgdmVyaWZpY2F0aW9uXCIpKSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoXCJJbnZhbGlkIG1uZW1vbmljXCIsIGVyci5nZXRDb2RlKCksIGVyci5nZXRScGNNZXRob2QoKSwgZXJyLmdldFJwY1BhcmFtcygpKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9XG4gIFxuICBhc3luYyBpc1ZpZXdPbmx5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwge2tleV90eXBlOiBcIm1uZW1vbmljXCJ9KTtcbiAgICAgIHJldHVybiBmYWxzZTsgLy8ga2V5IHJldHJpZXZhbCBzdWNjZWVkcyBpZiBub3QgdmlldyBvbmx5XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0yOSkgcmV0dXJuIHRydWU7ICAvLyB3YWxsZXQgaXMgdmlldyBvbmx5XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0xKSByZXR1cm4gZmFsc2U7ICAvLyB3YWxsZXQgaXMgb2ZmbGluZSBidXQgbm90IHZpZXcgb25seVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvUnBjQ29ubmVjdGlvbn0gW3VyaU9yQ29ubmVjdGlvbl0gLSB0aGUgZGFlbW9uJ3MgVVJJIG9yIGNvbm5lY3Rpb24gKGRlZmF1bHRzIHRvIG9mZmxpbmUpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNUcnVzdGVkIC0gaW5kaWNhdGVzIGlmIHRoZSBkYWVtb24gaW4gdHJ1c3RlZFxuICAgKiBAcGFyYW0ge1NzbE9wdGlvbnN9IHNzbE9wdGlvbnMgLSBjdXN0b20gU1NMIGNvbmZpZ3VyYXRpb25cbiAgICovXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uPzogUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IHN0cmluZywgaXNUcnVzdGVkPzogYm9vbGVhbiwgc3NsT3B0aW9ucz86IFNzbE9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgY29ubmVjdGlvbiA9ICF1cmlPckNvbm5lY3Rpb24gPyB1bmRlZmluZWQgOiB1cmlPckNvbm5lY3Rpb24gaW5zdGFuY2VvZiBNb25lcm9ScGNDb25uZWN0aW9uID8gdXJpT3JDb25uZWN0aW9uIDogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uKTtcbiAgICBpZiAoIXNzbE9wdGlvbnMpIHNzbE9wdGlvbnMgPSBuZXcgU3NsT3B0aW9ucygpO1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hZGRyZXNzID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0VXJpKCkgOiBcImJhZF91cmlcIjsgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogYmFkIGRhZW1vbiB1cmkgbmVjZXNzYXJ5IGZvciBvZmZsaW5lP1xuICAgIHBhcmFtcy51c2VybmFtZSA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFVzZXJuYW1lKCkgOiBcIlwiO1xuICAgIHBhcmFtcy5wYXNzd29yZCA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIHBhcmFtcy50cnVzdGVkID0gaXNUcnVzdGVkO1xuICAgIHBhcmFtcy5zc2xfc3VwcG9ydCA9IFwiYXV0b2RldGVjdFwiO1xuICAgIHBhcmFtcy5zc2xfcHJpdmF0ZV9rZXlfcGF0aCA9IHNzbE9wdGlvbnMuZ2V0UHJpdmF0ZUtleVBhdGgoKTtcbiAgICBwYXJhbXMuc3NsX2NlcnRpZmljYXRlX3BhdGggID0gc3NsT3B0aW9ucy5nZXRDZXJ0aWZpY2F0ZVBhdGgoKTtcbiAgICBwYXJhbXMuc3NsX2NhX2ZpbGUgPSBzc2xPcHRpb25zLmdldENlcnRpZmljYXRlQXV0aG9yaXR5RmlsZSgpO1xuICAgIHBhcmFtcy5zc2xfYWxsb3dlZF9maW5nZXJwcmludHMgPSBzc2xPcHRpb25zLmdldEFsbG93ZWRGaW5nZXJwcmludHMoKTtcbiAgICBwYXJhbXMuc3NsX2FsbG93X2FueV9jZXJ0ID0gc3NsT3B0aW9ucy5nZXRBbGxvd0FueUNlcnQoKTtcbiAgICBwYXJhbXMucHJveHkgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRQcm94eVVyaSgpIDogXCJcIjtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfZGFlbW9uXCIsIHBhcmFtcyk7XG4gICAgdGhpcy5kYWVtb25Db25uZWN0aW9uID0gY29ubmVjdGlvbjtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uQ29ubmVjdGlvbigpOiBQcm9taXNlPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHtcbiAgICByZXR1cm4gdGhpcy5kYWVtb25Db25uZWN0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdG90YWwgYW5kIHVubG9ja2VkIGJhbGFuY2VzIGluIGEgc2luZ2xlIHJlcXVlc3QuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2FjY291bnRJZHhdIGFjY291bnQgaW5kZXhcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdWJhZGRyZXNzSWR4XSBzdWJhZGRyZXNzIGluZGV4XG4gICAqIEByZXR1cm4ge1Byb21pc2U8YmlnaW50W10+fSBpcyB0aGUgdG90YWwgYW5kIHVubG9ja2VkIGJhbGFuY2VzIGluIGFuIGFycmF5LCByZXNwZWN0aXZlbHlcbiAgICovXG4gIGFzeW5jIGdldEJhbGFuY2VzKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludFtdPiB7XG4gICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0LmVxdWFsKHN1YmFkZHJlc3NJZHgsIHVuZGVmaW5lZCwgXCJNdXN0IHByb3ZpZGUgYWNjb3VudCBpbmRleCB3aXRoIHN1YmFkZHJlc3MgaW5kZXhcIik7XG4gICAgICBsZXQgYmFsYW5jZSA9IEJpZ0ludCgwKTtcbiAgICAgIGxldCB1bmxvY2tlZEJhbGFuY2UgPSBCaWdJbnQoMCk7XG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgICBiYWxhbmNlID0gYmFsYW5jZSArIGFjY291bnQuZ2V0QmFsYW5jZSgpO1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2UgPSB1bmxvY2tlZEJhbGFuY2UgKyBhY2NvdW50LmdldFVubG9ja2VkQmFsYW5jZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFtiYWxhbmNlLCB1bmxvY2tlZEJhbGFuY2VdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcGFyYW1zID0ge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHgsIGFkZHJlc3NfaW5kaWNlczogc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogW3N1YmFkZHJlc3NJZHhdfTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwgcGFyYW1zKTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQpIHJldHVybiBbQmlnSW50KHJlc3AucmVzdWx0LmJhbGFuY2UpLCBCaWdJbnQocmVzcC5yZXN1bHQudW5sb2NrZWRfYmFsYW5jZSldO1xuICAgICAgZWxzZSByZXR1cm4gW0JpZ0ludChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzc1swXS5iYWxhbmNlKSwgQmlnSW50KHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzWzBdLnVubG9ja2VkX2JhbGFuY2UpXTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIENPTU1PTiBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvV2FsbGV0TGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3VwZXIucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZFRvRGFlbW9uKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNoZWNrUmVzZXJ2ZVByb29mKGF3YWl0IHRoaXMuZ2V0UHJpbWFyeUFkZHJlc3MoKSwgXCJcIiwgXCJcIik7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogcHJvdmlkZSBiZXR0ZXIgd2F5IHRvIGtub3cgaWYgd2FsbGV0IHJwYyBpcyBjb25uZWN0ZWQgdG8gZGFlbW9uXG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJjaGVjayByZXNlcnZlIGV4cGVjdGVkIHRvIGZhaWxcIik7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtMTMpIHRocm93IGU7IC8vIG5vIHdhbGxldCBmaWxlXG4gICAgICByZXR1cm4gZS5tZXNzYWdlLmluZGV4T2YoXCJGYWlsZWQgdG8gY29ubmVjdCB0byBkYWVtb25cIikgPCAwO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF92ZXJzaW9uXCIpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVmVyc2lvbihyZXNwLnJlc3VsdC52ZXJzaW9uLCByZXNwLnJlc3VsdC5yZWxlYXNlKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF0aCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLnBhdGg7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNlZWQoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcIm1uZW1vbmljXCIgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmtleTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZExhbmd1YWdlKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKGF3YWl0IHRoaXMuZ2V0U2VlZCgpID09PSB1bmRlZmluZWQpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0UnBjLmdldFNlZWRMYW5ndWFnZSgpIG5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgbGlzdCBvZiBhdmFpbGFibGUgbGFuZ3VhZ2VzIGZvciB0aGUgd2FsbGV0J3Mgc2VlZC5cbiAgICogXG4gICAqIEByZXR1cm4ge3N0cmluZ1tdfSB0aGUgYXZhaWxhYmxlIGxhbmd1YWdlcyBmb3IgdGhlIHdhbGxldCdzIHNlZWQuXG4gICAqL1xuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2VzKCkge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2xhbmd1YWdlc1wiKSkucmVzdWx0Lmxhbmd1YWdlcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHJpdmF0ZVZpZXdLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcInZpZXdfa2V5XCIgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmtleTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHJpdmF0ZVNwZW5kS2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwgeyBrZXlfdHlwZTogXCJzcGVuZF9rZXlcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgc3ViYWRkcmVzc01hcCA9IHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdO1xuICAgIGlmICghc3ViYWRkcmVzc01hcCkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCB0cnVlKTsgIC8vIGNhY2hlJ3MgYWxsIGFkZHJlc3NlcyBhdCB0aGlzIGFjY291bnRcbiAgICAgIHJldHVybiB0aGlzLmdldEFkZHJlc3MoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7ICAgICAgICAvLyByZWN1cnNpdmUgY2FsbCB1c2VzIGNhY2hlXG4gICAgfVxuICAgIGxldCBhZGRyZXNzID0gc3ViYWRkcmVzc01hcFtzdWJhZGRyZXNzSWR4XTtcbiAgICBpZiAoIWFkZHJlc3MpIHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHVuZGVmaW5lZCwgdHJ1ZSk7ICAvLyBjYWNoZSdzIGFsbCBhZGRyZXNzZXMgYXQgdGhpcyBhY2NvdW50XG4gICAgICByZXR1cm4gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF1bc3ViYWRkcmVzc0lkeF07XG4gICAgfVxuICAgIHJldHVybiBhZGRyZXNzO1xuICB9XG4gIFxuICAvLyBUT0RPOiB1c2UgY2FjaGVcbiAgYXN5bmMgZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIFxuICAgIC8vIGZldGNoIHJlc3VsdCBhbmQgbm9ybWFsaXplIGVycm9yIGlmIGFkZHJlc3MgZG9lcyBub3QgYmVsb25nIHRvIHRoZSB3YWxsZXRcbiAgICBsZXQgcmVzcDtcbiAgICB0cnkge1xuICAgICAgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzX2luZGV4XCIsIHthZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0yKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZS5tZXNzYWdlKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICAgIFxuICAgIC8vIGNvbnZlcnQgcnBjIHJlc3BvbnNlXG4gICAgbGV0IHN1YmFkZHJlc3MgPSBuZXcgTW9uZXJvU3ViYWRkcmVzcyh7YWRkcmVzczogYWRkcmVzc30pO1xuICAgIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KHJlc3AucmVzdWx0LmluZGV4Lm1ham9yKTtcbiAgICBzdWJhZGRyZXNzLnNldEluZGV4KHJlc3AucmVzdWx0LmluZGV4Lm1pbm9yKTtcbiAgICByZXR1cm4gc3ViYWRkcmVzcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzPzogc3RyaW5nLCBwYXltZW50SWQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBpbnRlZ3JhdGVkQWRkcmVzc1N0ciA9IChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJtYWtlX2ludGVncmF0ZWRfYWRkcmVzc1wiLCB7c3RhbmRhcmRfYWRkcmVzczogc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50X2lkOiBwYXltZW50SWR9KSkucmVzdWx0LmludGVncmF0ZWRfYWRkcmVzcztcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzU3RyKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLm1lc3NhZ2UuaW5jbHVkZXMoXCJJbnZhbGlkIHBheW1lbnQgSURcIikpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgcGF5bWVudCBJRDogXCIgKyBwYXltZW50SWQpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzcGxpdF9pbnRlZ3JhdGVkX2FkZHJlc3NcIiwge2ludGVncmF0ZWRfYWRkcmVzczogaW50ZWdyYXRlZEFkZHJlc3N9KTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKCkuc2V0U3RhbmRhcmRBZGRyZXNzKHJlc3AucmVzdWx0LnN0YW5kYXJkX2FkZHJlc3MpLnNldFBheW1lbnRJZChyZXNwLnJlc3VsdC5wYXltZW50X2lkKS5zZXRJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzcyk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2hlaWdodFwiKSkucmVzdWx0LmhlaWdodDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uSGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3Qgc3VwcG9ydCBnZXR0aW5nIHRoZSBjaGFpbiBoZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodEJ5RGF0ZSh5ZWFyOiBudW1iZXIsIG1vbnRoOiBudW1iZXIsIGRheTogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGdldHRpbmcgYSBoZWlnaHQgYnkgZGF0ZVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc3luYyhsaXN0ZW5lck9yU3RhcnRIZWlnaHQ/OiBNb25lcm9XYWxsZXRMaXN0ZW5lciB8IG51bWJlciwgc3RhcnRIZWlnaHQ/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb1N5bmNSZXN1bHQ+IHtcbiAgICBhc3NlcnQoIShsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciksIFwiTW9uZXJvIFdhbGxldCBSUEMgZG9lcyBub3Qgc3VwcG9ydCByZXBvcnRpbmcgc3luYyBwcm9ncmVzc1wiKTtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZWZyZXNoXCIsIHtzdGFydF9oZWlnaHQ6IHN0YXJ0SGVpZ2h0fSk7XG4gICAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvU3luY1Jlc3VsdChyZXNwLnJlc3VsdC5ibG9ja3NfZmV0Y2hlZCwgcmVzcC5yZXN1bHQucmVjZWl2ZWRfbW9uZXkpO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UgPT09IFwibm8gY29ubmVjdGlvbiB0byBkYWVtb25cIikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIG5vdCBjb25uZWN0ZWQgdG8gZGFlbW9uXCIpO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgXG4gICAgLy8gY29udmVydCBtcyB0byBzZWNvbmRzIGZvciBycGMgcGFyYW1ldGVyXG4gICAgbGV0IHN5bmNQZXJpb2RJblNlY29uZHMgPSBNYXRoLnJvdW5kKChzeW5jUGVyaW9kSW5NcyA9PT0gdW5kZWZpbmVkID8gTW9uZXJvV2FsbGV0UnBjLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgOiBzeW5jUGVyaW9kSW5NcykgLyAxMDAwKTtcbiAgICBcbiAgICAvLyBzZW5kIHJwYyByZXF1ZXN0XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiYXV0b19yZWZyZXNoXCIsIHtcbiAgICAgIGVuYWJsZTogdHJ1ZSxcbiAgICAgIHBlcmlvZDogc3luY1BlcmlvZEluU2Vjb25kc1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHVwZGF0ZSBzeW5jIHBlcmlvZCBmb3IgcG9sbGVyXG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IHN5bmNQZXJpb2RJblNlY29uZHMgKiAxMDAwO1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkKSB0aGlzLndhbGxldFBvbGxlci5zZXRQZXJpb2RJbk1zKHRoaXMuc3luY1BlcmlvZEluTXMpO1xuICAgIFxuICAgIC8vIHBvbGwgaWYgbGlzdGVuaW5nXG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gIH1cblxuICBnZXRTeW5jUGVyaW9kSW5NcygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnN5bmNQZXJpb2RJbk1zO1xuICB9XG4gIFxuICBhc3luYyBzdG9wU3luY2luZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiYXV0b19yZWZyZXNoXCIsIHsgZW5hYmxlOiBmYWxzZSB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXR4SGFzaGVzIHx8ICF0eEhhc2hlcy5sZW5ndGgpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vIHR4IGhhc2hlcyBnaXZlbiB0byBzY2FuXCIpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNjYW5fdHhcIiwge3R4aWRzOiB0eEhhc2hlc30pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5TcGVudCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXNjYW5fc3BlbnRcIiwgdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXNjYW5fYmxvY2tjaGFpblwiLCB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYWxhbmNlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSlbMF07XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0QmFsYW5jZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkpWzFdO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbiwgdGFnPzogc3RyaW5nLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50W10+IHtcbiAgICBcbiAgICAvLyBmZXRjaCBhY2NvdW50cyBmcm9tIHJwY1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FjY291bnRzXCIsIHt0YWc6IHRhZ30pO1xuICAgIFxuICAgIC8vIGJ1aWxkIGFjY291bnQgb2JqZWN0cyBhbmQgZmV0Y2ggc3ViYWRkcmVzc2VzIHBlciBhY2NvdW50IHVzaW5nIGdldF9hZGRyZXNzXG4gICAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogZ2V0X2FkZHJlc3Mgc2hvdWxkIHN1cHBvcnQgYWxsX2FjY291bnRzIHNvIG5vdCBjYWxsZWQgb25jZSBwZXIgYWNjb3VudFxuICAgIGxldCBhY2NvdW50czogTW9uZXJvQWNjb3VudFtdID0gW107XG4gICAgZm9yIChsZXQgcnBjQWNjb3VudCBvZiByZXNwLnJlc3VsdC5zdWJhZGRyZXNzX2FjY291bnRzKSB7XG4gICAgICBsZXQgYWNjb3VudCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjQWNjb3VudChycGNBY2NvdW50KTtcbiAgICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzKSBhY2NvdW50LnNldFN1YmFkZHJlc3Nlcyhhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50LmdldEluZGV4KCksIHVuZGVmaW5lZCwgdHJ1ZSkpO1xuICAgICAgYWNjb3VudHMucHVzaChhY2NvdW50KTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIG1lcmdlIGZpZWxkcyBmcm9tIGdldF9iYWxhbmNlIGFjcm9zcyBhbGwgYWNjb3VudHNcbiAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcyAmJiAhc2tpcEJhbGFuY2VzKSB7XG4gICAgICBcbiAgICAgIC8vIHRoZXNlIGZpZWxkcyBhcmUgbm90IGluaXRpYWxpemVkIGlmIHN1YmFkZHJlc3MgaXMgdW51c2VkIGFuZCB0aGVyZWZvcmUgbm90IHJldHVybmVkIGZyb20gYGdldF9iYWxhbmNlYFxuICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiBhY2NvdW50cykge1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jaygwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBmZXRjaCBhbmQgbWVyZ2UgaW5mbyBmcm9tIGdldF9iYWxhbmNlXG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwge2FsbF9hY2NvdW50czogdHJ1ZX0pO1xuICAgICAgaWYgKHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgIGZvciAobGV0IHJwY1N1YmFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzcyA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBtZXJnZSBpbmZvXG4gICAgICAgICAgbGV0IGFjY291bnQgPSBhY2NvdW50c1tzdWJhZGRyZXNzLmdldEFjY291bnRJbmRleCgpXTtcbiAgICAgICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzcy5nZXRBY2NvdW50SW5kZXgoKSwgYWNjb3VudC5nZXRJbmRleCgpLCBcIlJQQyBhY2NvdW50cyBhcmUgb3V0IG9mIG9yZGVyXCIpOyAgLy8gd291bGQgbmVlZCB0byBzd2l0Y2ggbG9va3VwIHRvIGxvb3BcbiAgICAgICAgICBsZXQgdGd0U3ViYWRkcmVzcyA9IGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKClbc3ViYWRkcmVzcy5nZXRJbmRleCgpXTtcbiAgICAgICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzcy5nZXRJbmRleCgpLCB0Z3RTdWJhZGRyZXNzLmdldEluZGV4KCksIFwiUlBDIHN1YmFkZHJlc3NlcyBhcmUgb3V0IG9mIG9yZGVyXCIpO1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkpO1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkpO1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cyhzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBhY2NvdW50cztcbiAgfVxuICBcbiAgLy8gVE9ETzogZ2V0QWNjb3VudEJ5SW5kZXgoKSwgZ2V0QWNjb3VudEJ5VGFnKClcbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgYXNzZXJ0KGFjY291bnRJZHggPj0gMCk7XG4gICAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCB0aGlzLmdldEFjY291bnRzKCkpIHtcbiAgICAgIGlmIChhY2NvdW50LmdldEluZGV4KCkgPT09IGFjY291bnRJZHgpIHtcbiAgICAgICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMpIGFjY291bnQuc2V0U3ViYWRkcmVzc2VzKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHVuZGVmaW5lZCwgc2tpcEJhbGFuY2VzKSk7XG4gICAgICAgIHJldHVybiBhY2NvdW50O1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBY2NvdW50IHdpdGggaW5kZXggXCIgKyBhY2NvdW50SWR4ICsgXCIgZG9lcyBub3QgZXhpc3RcIik7XG4gIH1cblxuICBhc3luYyBjcmVhdGVBY2NvdW50KGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgbGFiZWwgPSBsYWJlbCA/IGxhYmVsIDogdW5kZWZpbmVkO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX2FjY291bnRcIiwge2xhYmVsOiBsYWJlbH0pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvQWNjb3VudCh7XG4gICAgICBpbmRleDogcmVzcC5yZXN1bHQuYWNjb3VudF9pbmRleCxcbiAgICAgIHByaW1hcnlBZGRyZXNzOiByZXNwLnJlc3VsdC5hZGRyZXNzLFxuICAgICAgbGFiZWw6IGxhYmVsLFxuICAgICAgYmFsYW5jZTogQmlnSW50KDApLFxuICAgICAgdW5sb2NrZWRCYWxhbmNlOiBCaWdJbnQoMClcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJbmRpY2VzPzogbnVtYmVyW10sIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3NbXT4ge1xuICAgIFxuICAgIC8vIGZldGNoIHN1YmFkZHJlc3Nlc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gYWNjb3VudElkeDtcbiAgICBpZiAoc3ViYWRkcmVzc0luZGljZXMpIHBhcmFtcy5hZGRyZXNzX2luZGV4ID0gR2VuVXRpbHMubGlzdGlmeShzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc1wiLCBwYXJhbXMpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgc3ViYWRkcmVzc2VzXG4gICAgbGV0IHN1YmFkZHJlc3NlcyA9IFtdO1xuICAgIGZvciAobGV0IHJwY1N1YmFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQuYWRkcmVzc2VzKSB7XG4gICAgICBsZXQgc3ViYWRkcmVzcyA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKTtcbiAgICAgIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgc3ViYWRkcmVzc2VzLnB1c2goc3ViYWRkcmVzcyk7XG4gICAgfVxuICAgIFxuICAgIC8vIGZldGNoIGFuZCBpbml0aWFsaXplIHN1YmFkZHJlc3MgYmFsYW5jZXNcbiAgICBpZiAoIXNraXBCYWxhbmNlcykge1xuICAgICAgXG4gICAgICAvLyB0aGVzZSBmaWVsZHMgYXJlIG5vdCBpbml0aWFsaXplZCBpZiBzdWJhZGRyZXNzIGlzIHVudXNlZCBhbmQgdGhlcmVmb3JlIG5vdCByZXR1cm5lZCBmcm9tIGBnZXRfYmFsYW5jZWBcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKDApO1xuICAgICAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgICAgfVxuXG4gICAgICAvLyBmZXRjaCBhbmQgaW5pdGlhbGl6ZSBiYWxhbmNlc1xuICAgICAgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIsIHBhcmFtcyk7XG4gICAgICBpZiAocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIHRyYW5zZmVyIGluZm8gdG8gZXhpc3Rpbmcgc3ViYWRkcmVzcyBvYmplY3RcbiAgICAgICAgICBmb3IgKGxldCB0Z3RTdWJhZGRyZXNzIG9mIHN1YmFkZHJlc3Nlcykge1xuICAgICAgICAgICAgaWYgKHRndFN1YmFkZHJlc3MuZ2V0SW5kZXgoKSAhPT0gc3ViYWRkcmVzcy5nZXRJbmRleCgpKSBjb250aW51ZTsgLy8gc2tpcCB0byBzdWJhZGRyZXNzIHdpdGggc2FtZSBpbmRleFxuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0QmFsYW5jZShzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cyhzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKHN1YmFkZHJlc3MuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIGFkZHJlc3Nlc1xuICAgIGxldCBzdWJhZGRyZXNzTWFwID0gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF07XG4gICAgaWYgKCFzdWJhZGRyZXNzTWFwKSB7XG4gICAgICBzdWJhZGRyZXNzTWFwID0ge307XG4gICAgICB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XSA9IHN1YmFkZHJlc3NNYXA7XG4gICAgfVxuICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICBzdWJhZGRyZXNzTWFwW3N1YmFkZHJlc3MuZ2V0SW5kZXgoKV0gPSBzdWJhZGRyZXNzLmdldEFkZHJlc3MoKTtcbiAgICB9XG4gICAgXG4gICAgLy8gcmV0dXJuIHJlc3VsdHNcbiAgICByZXR1cm4gc3ViYWRkcmVzc2VzO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlciwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIGFzc2VydChhY2NvdW50SWR4ID49IDApO1xuICAgIGFzc2VydChzdWJhZGRyZXNzSWR4ID49IDApO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgW3N1YmFkZHJlc3NJZHhdLCBza2lwQmFsYW5jZXMpKVswXTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX2FkZHJlc3NcIiwge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHgsIGxhYmVsOiBsYWJlbH0pO1xuICAgIFxuICAgIC8vIGJ1aWxkIHN1YmFkZHJlc3Mgb2JqZWN0XG4gICAgbGV0IHN1YmFkZHJlc3MgPSBuZXcgTW9uZXJvU3ViYWRkcmVzcygpO1xuICAgIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgIHN1YmFkZHJlc3Muc2V0SW5kZXgocmVzcC5yZXN1bHQuYWRkcmVzc19pbmRleCk7XG4gICAgc3ViYWRkcmVzcy5zZXRBZGRyZXNzKHJlc3AucmVzdWx0LmFkZHJlc3MpO1xuICAgIHN1YmFkZHJlc3Muc2V0TGFiZWwobGFiZWwgPyBsYWJlbCA6IHVuZGVmaW5lZCk7XG4gICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgc3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKDApO1xuICAgIHN1YmFkZHJlc3Muc2V0SXNVc2VkKGZhbHNlKTtcbiAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgIHJldHVybiBzdWJhZGRyZXNzO1xuICB9XG5cbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibGFiZWxfYWRkcmVzc1wiLCB7aW5kZXg6IHttYWpvcjogYWNjb3VudElkeCwgbWlub3I6IHN1YmFkZHJlc3NJZHh9LCBsYWJlbDogbGFiZWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5Pzogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gY29weSBxdWVyeVxuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyB0ZW1wb3JhcmlseSBkaXNhYmxlIHRyYW5zZmVyIGFuZCBvdXRwdXQgcXVlcmllcyBpbiBvcmRlciB0byBjb2xsZWN0IGFsbCB0eCBpbmZvcm1hdGlvblxuICAgIGxldCB0cmFuc2ZlclF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldFRyYW5zZmVyUXVlcnkoKTtcbiAgICBsZXQgaW5wdXRRdWVyeSA9IHF1ZXJ5Tm9ybWFsaXplZC5nZXRJbnB1dFF1ZXJ5KCk7XG4gICAgbGV0IG91dHB1dFF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldE91dHB1dFF1ZXJ5KCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldFRyYW5zZmVyUXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SW5wdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRPdXRwdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIGZldGNoIGFsbCB0cmFuc2ZlcnMgdGhhdCBtZWV0IHR4IHF1ZXJ5XG4gICAgbGV0IHRyYW5zZmVycyA9IGF3YWl0IHRoaXMuZ2V0VHJhbnNmZXJzQXV4KG5ldyBNb25lcm9UcmFuc2ZlclF1ZXJ5KCkuc2V0VHhRdWVyeShNb25lcm9XYWxsZXRScGMuZGVjb250ZXh0dWFsaXplKHF1ZXJ5Tm9ybWFsaXplZC5jb3B5KCkpKSk7XG4gICAgXG4gICAgLy8gY29sbGVjdCB1bmlxdWUgdHhzIGZyb20gdHJhbnNmZXJzIHdoaWxlIHJldGFpbmluZyBvcmRlclxuICAgIGxldCB0eHMgPSBbXTtcbiAgICBsZXQgdHhzU2V0ID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHRyYW5zZmVycykge1xuICAgICAgaWYgKCF0eHNTZXQuaGFzKHRyYW5zZmVyLmdldFR4KCkpKSB7XG4gICAgICAgIHR4cy5wdXNoKHRyYW5zZmVyLmdldFR4KCkpO1xuICAgICAgICB0eHNTZXQuYWRkKHRyYW5zZmVyLmdldFR4KCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB0eXBlcyBpbnRvIG1hcHMgZm9yIG1lcmdpbmcgYW5kIGxvb2t1cFxuICAgIGxldCB0eE1hcCA9IHt9O1xuICAgIGxldCBibG9ja01hcCA9IHt9O1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGZldGNoIGFuZCBtZXJnZSBvdXRwdXRzIGlmIHJlcXVlc3RlZFxuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SW5jbHVkZU91dHB1dHMoKSB8fCBvdXRwdXRRdWVyeSkge1xuICAgICAgICBcbiAgICAgIC8vIGZldGNoIG91dHB1dHNcbiAgICAgIGxldCBvdXRwdXRRdWVyeUF1eCA9IChvdXRwdXRRdWVyeSA/IG91dHB1dFF1ZXJ5LmNvcHkoKSA6IG5ldyBNb25lcm9PdXRwdXRRdWVyeSgpKS5zZXRUeFF1ZXJ5KE1vbmVyb1dhbGxldFJwYy5kZWNvbnRleHR1YWxpemUocXVlcnlOb3JtYWxpemVkLmNvcHkoKSkpO1xuICAgICAgbGV0IG91dHB1dHMgPSBhd2FpdCB0aGlzLmdldE91dHB1dHNBdXgob3V0cHV0UXVlcnlBdXgpO1xuICAgICAgXG4gICAgICAvLyBtZXJnZSBvdXRwdXQgdHhzIG9uZSB0aW1lIHdoaWxlIHJldGFpbmluZyBvcmRlclxuICAgICAgbGV0IG91dHB1dFR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIG91dHB1dHMpIHtcbiAgICAgICAgaWYgKCFvdXRwdXRUeHMuaW5jbHVkZXMob3V0cHV0LmdldFR4KCkpKSB7XG4gICAgICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgob3V0cHV0LmdldFR4KCksIHR4TWFwLCBibG9ja01hcCk7XG4gICAgICAgICAgb3V0cHV0VHhzLnB1c2gob3V0cHV0LmdldFR4KCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHJlc3RvcmUgdHJhbnNmZXIgYW5kIG91dHB1dCBxdWVyaWVzXG4gICAgcXVlcnlOb3JtYWxpemVkLnNldFRyYW5zZmVyUXVlcnkodHJhbnNmZXJRdWVyeSk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldElucHV0UXVlcnkoaW5wdXRRdWVyeSk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldE91dHB1dFF1ZXJ5KG91dHB1dFF1ZXJ5KTtcbiAgICBcbiAgICAvLyBmaWx0ZXIgdHhzIHRoYXQgZG9uJ3QgbWVldCB0cmFuc2ZlciBxdWVyeVxuICAgIGxldCB0eHNRdWVyaWVkID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBpZiAocXVlcnlOb3JtYWxpemVkLm1lZXRzQ3JpdGVyaWEodHgpKSB0eHNRdWVyaWVkLnB1c2godHgpO1xuICAgICAgZWxzZSBpZiAodHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB0eC5nZXRCbG9jaygpLmdldFR4cygpLnNwbGljZSh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpLCAxKTtcbiAgICB9XG4gICAgdHhzID0gdHhzUXVlcmllZDtcbiAgICBcbiAgICAvLyBzcGVjaWFsIGNhc2U6IHJlLWZldGNoIHR4cyBpZiBpbmNvbnNpc3RlbmN5IGNhdXNlZCBieSBuZWVkaW5nIHRvIG1ha2UgbXVsdGlwbGUgcnBjIGNhbGxzXG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSAmJiB0eC5nZXRCbG9jaygpID09PSB1bmRlZmluZWQgfHwgIXR4LmdldElzQ29uZmlybWVkKCkgJiYgdHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJJbmNvbnNpc3RlbmN5IGRldGVjdGVkIGJ1aWxkaW5nIHR4cyBmcm9tIG11bHRpcGxlIHJwYyBjYWxscywgcmUtZmV0Y2hpbmcgdHhzXCIpO1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRUeHMocXVlcnlOb3JtYWxpemVkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gb3JkZXIgdHhzIGlmIHR4IGhhc2hlcyBnaXZlbiB0aGVuIHJldHVyblxuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkgJiYgcXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpLmxlbmd0aCA+IDApIHtcbiAgICAgIGxldCB0eHNCeUlkID0gbmV3IE1hcCgpICAvLyBzdG9yZSB0eHMgaW4gdGVtcG9yYXJ5IG1hcCBmb3Igc29ydGluZ1xuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB0eHNCeUlkLnNldCh0eC5nZXRIYXNoKCksIHR4KTtcbiAgICAgIGxldCBvcmRlcmVkVHhzID0gW107XG4gICAgICBmb3IgKGxldCBoYXNoIG9mIHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKSkgaWYgKHR4c0J5SWQuZ2V0KGhhc2gpKSBvcmRlcmVkVHhzLnB1c2godHhzQnlJZC5nZXQoaGFzaCkpO1xuICAgICAgdHhzID0gb3JkZXJlZFR4cztcbiAgICB9XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHJhbnNmZXJbXT4ge1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBnZXQgdHJhbnNmZXJzIGRpcmVjdGx5IGlmIHF1ZXJ5IGRvZXMgbm90IHJlcXVpcmUgdHggY29udGV4dCAob3RoZXIgdHJhbnNmZXJzLCBvdXRwdXRzKVxuICAgIGlmICghTW9uZXJvV2FsbGV0UnBjLmlzQ29udGV4dHVhbChxdWVyeU5vcm1hbGl6ZWQpKSByZXR1cm4gdGhpcy5nZXRUcmFuc2ZlcnNBdXgocXVlcnlOb3JtYWxpemVkKTtcbiAgICBcbiAgICAvLyBvdGhlcndpc2UgZ2V0IHR4cyB3aXRoIGZ1bGwgbW9kZWxzIHRvIGZ1bGZpbGwgcXVlcnlcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5nZXRUeHMocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKSkpIHtcbiAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmZpbHRlclRyYW5zZmVycyhxdWVyeU5vcm1hbGl6ZWQpKSB7XG4gICAgICAgIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvT3V0cHV0UXVlcnk+KTogUHJvbWlzZTxNb25lcm9PdXRwdXRXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gZ2V0IG91dHB1dHMgZGlyZWN0bHkgaWYgcXVlcnkgZG9lcyBub3QgcmVxdWlyZSB0eCBjb250ZXh0IChvdGhlciBvdXRwdXRzLCB0cmFuc2ZlcnMpXG4gICAgaWYgKCFNb25lcm9XYWxsZXRScGMuaXNDb250ZXh0dWFsKHF1ZXJ5Tm9ybWFsaXplZCkpIHJldHVybiB0aGlzLmdldE91dHB1dHNBdXgocXVlcnlOb3JtYWxpemVkKTtcbiAgICBcbiAgICAvLyBvdGhlcndpc2UgZ2V0IHR4cyB3aXRoIGZ1bGwgbW9kZWxzIHRvIGZ1bGZpbGwgcXVlcnlcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMuZ2V0VHhzKHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkpKSB7XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZmlsdGVyT3V0cHV0cyhxdWVyeU5vcm1hbGl6ZWQpKSB7XG4gICAgICAgIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfb3V0cHV0c1wiLCB7YWxsOiBhbGx9KSkucmVzdWx0Lm91dHB1dHNfZGF0YV9oZXg7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE91dHB1dHMob3V0cHV0c0hleDogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9vdXRwdXRzXCIsIHtvdXRwdXRzX2RhdGFfaGV4OiBvdXRwdXRzSGV4fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm51bV9pbXBvcnRlZDtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucnBjRXhwb3J0S2V5SW1hZ2VzKGFsbCk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydEtleUltYWdlcyhrZXlJbWFnZXM6IE1vbmVyb0tleUltYWdlW10pOiBQcm9taXNlPE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0PiB7XG4gICAgXG4gICAgLy8gY29udmVydCBrZXkgaW1hZ2VzIHRvIHJwYyBwYXJhbWV0ZXJcbiAgICBsZXQgcnBjS2V5SW1hZ2VzID0ga2V5SW1hZ2VzLm1hcChrZXlJbWFnZSA9PiAoe2tleV9pbWFnZToga2V5SW1hZ2UuZ2V0SGV4KCksIHNpZ25hdHVyZToga2V5SW1hZ2UuZ2V0U2lnbmF0dXJlKCl9KSk7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbXBvcnRfa2V5X2ltYWdlc1wiLCB7c2lnbmVkX2tleV9pbWFnZXM6IHJwY0tleUltYWdlc30pO1xuICAgIFxuICAgIC8vIGJ1aWxkIGFuZCByZXR1cm4gcmVzdWx0XG4gICAgbGV0IGltcG9ydFJlc3VsdCA9IG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCgpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRIZWlnaHQocmVzcC5yZXN1bHQuaGVpZ2h0KTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0U3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnNwZW50KSk7XG4gICAgaW1wb3J0UmVzdWx0LnNldFVuc3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnVuc3BlbnQpKTtcbiAgICByZXR1cm4gaW1wb3J0UmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5ycGNFeHBvcnRLZXlJbWFnZXMoZmFsc2UpO1xuICB9XG4gIFxuICBhc3luYyBmcmVlemVPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmcmVlemVcIiwge2tleV9pbWFnZToga2V5SW1hZ2V9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGhhd091dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInRoYXdcIiwge2tleV9pbWFnZToga2V5SW1hZ2V9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZnJvemVuXCIsIHtrZXlfaW1hZ2U6IGtleUltYWdlfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmZyb3plbiA9PT0gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIGdldERlZmF1bHRGZWVQcmlvcml0eSgpOiBQcm9taXNlPE1vbmVyb1R4UHJpb3JpdHk+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9kZWZhdWx0X2ZlZV9wcmlvcml0eVwiKTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQucHJpb3JpdHk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVR4cyhjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUsIGNvcHksIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpID09PSB1bmRlZmluZWQpIGNvbmZpZ05vcm1hbGl6ZWQuc2V0Q2FuU3BsaXQodHJ1ZSk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSA9PT0gdHJ1ZSAmJiBhd2FpdCB0aGlzLmlzTXVsdGlzaWcoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHJlbGF5IG11bHRpc2lnIHRyYW5zYWN0aW9uIHVudGlsIGNvLXNpZ25lZFwiKTtcblxuICAgIC8vIGRldGVybWluZSBhY2NvdW50IGFuZCBzdWJhZGRyZXNzZXMgdG8gc2VuZCBmcm9tXG4gICAgbGV0IGFjY291bnRJZHggPSBjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpO1xuICAgIGlmIChhY2NvdW50SWR4ID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSB0aGUgYWNjb3VudCBpbmRleCB0byBzZW5kIGZyb21cIik7XG4gICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkuc2xpY2UoMCk7IC8vIGZldGNoIGFsbCBvciBjb3B5IGdpdmVuIGluZGljZXNcbiAgICBcbiAgICAvLyBidWlsZCBjb25maWcgcGFyYW1ldGVyc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5kZXN0aW5hdGlvbnMgPSBbXTtcbiAgICBmb3IgKGxldCBkZXN0aW5hdGlvbiBvZiBjb25maWdOb3JtYWxpemVkLmdldERlc3RpbmF0aW9ucygpKSB7XG4gICAgICBhc3NlcnQoZGVzdGluYXRpb24uZ2V0QWRkcmVzcygpLCBcIkRlc3RpbmF0aW9uIGFkZHJlc3MgaXMgbm90IGRlZmluZWRcIik7XG4gICAgICBhc3NlcnQoZGVzdGluYXRpb24uZ2V0QW1vdW50KCksIFwiRGVzdGluYXRpb24gYW1vdW50IGlzIG5vdCBkZWZpbmVkXCIpO1xuICAgICAgcGFyYW1zLmRlc3RpbmF0aW9ucy5wdXNoKHsgYWRkcmVzczogZGVzdGluYXRpb24uZ2V0QWRkcmVzcygpLCBhbW91bnQ6IGRlc3RpbmF0aW9uLmdldEFtb3VudCgpLnRvU3RyaW5nKCkgfSk7XG4gICAgfVxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFN1YnRyYWN0RmVlRnJvbSgpKSBwYXJhbXMuc3VidHJhY3RfZmVlX2Zyb21fb3V0cHV0cyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCk7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBhY2NvdW50SWR4O1xuICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBzdWJhZGRyZXNzSW5kaWNlcztcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UGF5bWVudElkKCk7XG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSAhPT0gdHJ1ZTtcbiAgICBhc3NlcnQoY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpIDw9IDMpO1xuICAgIHBhcmFtcy5wcmlvcml0eSA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2hleCA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9tZXRhZGF0YSA9IHRydWU7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSkgcGFyYW1zLmdldF90eF9rZXlzID0gdHJ1ZTsgLy8gcGFyYW0gdG8gZ2V0IHR4IGtleShzKSBkZXBlbmRzIGlmIHNwbGl0XG4gICAgZWxzZSBwYXJhbXMuZ2V0X3R4X2tleSA9IHRydWU7XG5cbiAgICAvLyBjYW5ub3QgYXBwbHkgc3VidHJhY3RGZWVGcm9tIHdpdGggYHRyYW5zZmVyX3NwbGl0YCBjYWxsXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSAmJiBjb25maWdOb3JtYWxpemVkLmdldFN1YnRyYWN0RmVlRnJvbSgpICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkubGVuZ3RoID4gMCkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwic3VidHJhY3RmZWVmcm9tIHRyYW5zZmVycyBjYW5ub3QgYmUgc3BsaXQgb3ZlciBtdWx0aXBsZSB0cmFuc2FjdGlvbnMgeWV0XCIpO1xuICAgIH1cbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPyBcInRyYW5zZmVyX3NwbGl0XCIgOiBcInRyYW5zZmVyXCIsIHBhcmFtcyk7XG4gICAgICByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgaWYgKGVyci5tZXNzYWdlLmluZGV4T2YoXCJXQUxMRVRfUlBDX0VSUk9SX0NPREVfV1JPTkdfQUREUkVTU1wiKSA+IC0xKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIGRlc3RpbmF0aW9uIGFkZHJlc3NcIik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICAgIFxuICAgIC8vIHByZS1pbml0aWFsaXplIHR4cyBpZmYgcHJlc2VudC4gbXVsdGlzaWcgYW5kIHZpZXctb25seSB3YWxsZXRzIHdpbGwgaGF2ZSB0eCBzZXQgd2l0aG91dCB0cmFuc2FjdGlvbnNcbiAgICBsZXQgdHhzO1xuICAgIGxldCBudW1UeHMgPSBjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPyAocmVzdWx0LmZlZV9saXN0ICE9PSB1bmRlZmluZWQgPyByZXN1bHQuZmVlX2xpc3QubGVuZ3RoIDogMCkgOiAocmVzdWx0LmZlZSAhPT0gdW5kZWZpbmVkID8gMSA6IDApO1xuICAgIGlmIChudW1UeHMgPiAwKSB0eHMgPSBbXTtcbiAgICBsZXQgY29weURlc3RpbmF0aW9ucyA9IG51bVR4cyA9PT0gMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVR4czsgaSsrKSB7XG4gICAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICAgIE1vbmVyb1dhbGxldFJwYy5pbml0U2VudFR4V2FsbGV0KGNvbmZpZ05vcm1hbGl6ZWQsIHR4LCBjb3B5RGVzdGluYXRpb25zKTtcbiAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgICBpZiAoc3ViYWRkcmVzc0luZGljZXMgIT09IHVuZGVmaW5lZCAmJiBzdWJhZGRyZXNzSW5kaWNlcy5sZW5ndGggPT09IDEpIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICB0eHMucHVzaCh0eCk7XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCBzZXQgZnJvbSBycGMgcmVzcG9uc2Ugd2l0aCBwcmUtaW5pdGlhbGl6ZWQgdHhzXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSkgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzdWx0LCB0eHMsIGNvbmZpZ05vcm1hbGl6ZWQpLmdldFR4cygpO1xuICAgIGVsc2UgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhUb1R4U2V0KHJlc3VsdCwgdHhzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0eHNbMF0sIHRydWUsIGNvbmZpZ05vcm1hbGl6ZWQpLmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcE91dHB1dChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gYnVpbGQgcmVxdWVzdCBwYXJhbWV0ZXJzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmFkZHJlc3MgPSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpO1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gY29uZmlnLmdldEFjY291bnRJbmRleCgpO1xuICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKTtcbiAgICBwYXJhbXMua2V5X2ltYWdlID0gY29uZmlnLmdldEtleUltYWdlKCk7XG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpICE9PSB0cnVlO1xuICAgIGFzc2VydChjb25maWcuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnLmdldFByaW9yaXR5KCk7XG4gICAgcGFyYW1zLnBheW1lbnRfaWQgPSBjb25maWcuZ2V0UGF5bWVudElkKCk7XG4gICAgcGFyYW1zLmdldF90eF9rZXkgPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN3ZWVwX3NpbmdsZVwiLCBwYXJhbXMpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBcbiAgICAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIGlmIChjb25maWcuZ2V0UmVsYXkoKSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgXG4gICAgLy8gYnVpbGQgYW5kIHJldHVybiB0eFxuICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5pbml0U2VudFR4V2FsbGV0KGNvbmZpZywgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4VG9UeFNldChyZXN1bHQsIHR4LCB0cnVlLCBjb25maWcpO1xuICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKVswXS5zZXRBbW91bnQodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFtb3VudCgpKTsgLy8gaW5pdGlhbGl6ZSBkZXN0aW5hdGlvbiBhbW91bnRcbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwVW5sb2NrZWQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBzd2VlcDsgZGVmYXVsdCB0byBhbGwgd2l0aCB1bmxvY2tlZCBiYWxhbmNlIGlmIG5vdCBzcGVjaWZpZWRcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTsgIC8vIG1hcHMgZWFjaCBhY2NvdW50IGluZGV4IHRvIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBzd2VlcFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpbmRpY2VzLnNldChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpLCBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgICAgIGluZGljZXMuc2V0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3Nlcyhjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpKSkge1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgYWNjb3VudHMgPSBhd2FpdCB0aGlzLmdldEFjY291bnRzKHRydWUpO1xuICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiBhY2NvdW50cykge1xuICAgICAgICBpZiAoYWNjb3VudC5nZXRVbmxvY2tlZEJhbGFuY2UoKSA+IDBuKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgICAgICAgaW5kaWNlcy5zZXQoYWNjb3VudC5nZXRJbmRleCgpLCBzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpKSB7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSA+IDBuKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHN3ZWVwIGZyb20gZWFjaCBhY2NvdW50IGFuZCBjb2xsZWN0IHJlc3VsdGluZyB0eCBzZXRzXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGZvciAobGV0IGFjY291bnRJZHggb2YgaW5kaWNlcy5rZXlzKCkpIHtcbiAgICAgIFxuICAgICAgLy8gY29weSBhbmQgbW9kaWZ5IHRoZSBvcmlnaW5hbCBjb25maWdcbiAgICAgIGxldCBjb3B5ID0gY29uZmlnTm9ybWFsaXplZC5jb3B5KCk7XG4gICAgICBjb3B5LnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIGNvcHkuc2V0U3dlZXBFYWNoU3ViYWRkcmVzcyhmYWxzZSk7XG4gICAgICBcbiAgICAgIC8vIHN3ZWVwIGFsbCBzdWJhZGRyZXNzZXMgdG9nZXRoZXIgIC8vIFRPRE8gbW9uZXJvLXByb2plY3Q6IGNhbiB0aGlzIHJldmVhbCBvdXRwdXRzIGJlbG9uZyB0byB0aGUgc2FtZSB3YWxsZXQ/XG4gICAgICBpZiAoY29weS5nZXRTd2VlcEVhY2hTdWJhZGRyZXNzKCkgIT09IHRydWUpIHtcbiAgICAgICAgY29weS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhpbmRpY2VzLmdldChhY2NvdW50SWR4KSk7XG4gICAgICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMucnBjU3dlZXBBY2NvdW50KGNvcHkpKSB0eHMucHVzaCh0eCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIG90aGVyd2lzZSBzd2VlcCBlYWNoIHN1YmFkZHJlc3MgaW5kaXZpZHVhbGx5XG4gICAgICBlbHNlIHtcbiAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzc0lkeCBvZiBpbmRpY2VzLmdldChhY2NvdW50SWR4KSkge1xuICAgICAgICAgIGNvcHkuc2V0U3ViYWRkcmVzc0luZGljZXMoW3N1YmFkZHJlc3NJZHhdKTtcbiAgICAgICAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLnJwY1N3ZWVwQWNjb3VudChjb3B5KSkgdHhzLnB1c2godHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5PzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmIChyZWxheSA9PT0gdW5kZWZpbmVkKSByZWxheSA9IGZhbHNlO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfZHVzdFwiLCB7ZG9fbm90X3JlbGF5OiAhcmVsYXl9KTtcbiAgICBpZiAocmVsYXkpIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCk7XG4gICAgaWYgKHR4U2V0LmdldFR4cygpID09PSB1bmRlZmluZWQpIHJldHVybiBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkge1xuICAgICAgdHguc2V0SXNSZWxheWVkKCFyZWxheSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0eC5nZXRJc1JlbGF5ZWQoKSk7XG4gICAgfVxuICAgIHJldHVybiB0eFNldC5nZXRUeHMoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHModHhzT3JNZXRhZGF0YXM6IChNb25lcm9UeFdhbGxldCB8IHN0cmluZylbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eHNPck1ldGFkYXRhcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBvciB0aGVpciBtZXRhZGF0YSB0byByZWxheVwiKTtcbiAgICBsZXQgdHhIYXNoZXMgPSBbXTtcbiAgICBmb3IgKGxldCB0eE9yTWV0YWRhdGEgb2YgdHhzT3JNZXRhZGF0YXMpIHtcbiAgICAgIGxldCBtZXRhZGF0YSA9IHR4T3JNZXRhZGF0YSBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0ID8gdHhPck1ldGFkYXRhLmdldE1ldGFkYXRhKCkgOiB0eE9yTWV0YWRhdGE7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlbGF5X3R4XCIsIHsgaGV4OiBtZXRhZGF0YSB9KTtcbiAgICAgIHR4SGFzaGVzLnB1c2gocmVzcC5yZXN1bHQudHhfaGFzaCk7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMucG9sbCgpOyAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIHJldHVybiB0eEhhc2hlcztcbiAgfVxuICBcbiAgYXN5bmMgZGVzY3JpYmVUeFNldCh0eFNldDogTW9uZXJvVHhTZXQpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJkZXNjcmliZV90cmFuc2ZlclwiLCB7XG4gICAgICB1bnNpZ25lZF90eHNldDogdHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpLFxuICAgICAgbXVsdGlzaWdfdHhzZXQ6IHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKVxuICAgIH0pO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY0Rlc2NyaWJlVHJhbnNmZXIocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25fdHJhbnNmZXJcIiwge1xuICAgICAgdW5zaWduZWRfdHhzZXQ6IHVuc2lnbmVkVHhIZXgsXG4gICAgICBleHBvcnRfcmF3OiBmYWxzZVxuICAgIH0pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfdHJhbnNmZXJcIiwge1xuICAgICAgdHhfZGF0YV9oZXg6IHNpZ25lZFR4SGV4XG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBzaWduYXR1cmVUeXBlID0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgYWNjb3VudElkeCA9IDAsIHN1YmFkZHJlc3NJZHggPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25cIiwge1xuICAgICAgICBkYXRhOiBtZXNzYWdlLFxuICAgICAgICBzaWduYXR1cmVfdHlwZTogc2lnbmF0dXJlVHlwZSA9PT0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA/IFwic3BlbmRcIiA6IFwidmlld1wiLFxuICAgICAgICBhY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LFxuICAgICAgICBhZGRyZXNzX2luZGV4OiBzdWJhZGRyZXNzSWR4XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQ+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ2ZXJpZnlcIiwge2RhdGE6IG1lc3NhZ2UsIGFkZHJlc3M6IGFkZHJlc3MsIHNpZ25hdHVyZTogc2lnbmF0dXJlfSk7XG4gICAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQoXG4gICAgICAgIHJlc3VsdC5nb29kID8ge2lzR29vZDogcmVzdWx0Lmdvb2QsIGlzT2xkOiByZXN1bHQub2xkLCBzaWduYXR1cmVUeXBlOiByZXN1bHQuc2lnbmF0dXJlX3R5cGUgPT09IFwidmlld1wiID8gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1ZJRVdfS0VZIDogTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgdmVyc2lvbjogcmVzdWx0LnZlcnNpb259IDoge2lzR29vZDogZmFsc2V9XG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMikgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KHtpc0dvb2Q6IGZhbHNlfSk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9rZXlcIiwge3R4aWQ6IHR4SGFzaH0pKS5yZXN1bHQudHhfa2V5O1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaDogc3RyaW5nLCB0eEtleTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfdHhfa2V5XCIsIHt0eGlkOiB0eEhhc2gsIHR4X2tleTogdHhLZXksIGFkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICAgIFxuICAgICAgLy8gaW50ZXJwcmV0IHJlc3VsdFxuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZCh0cnVlKTtcbiAgICAgIGNoZWNrLnNldE51bUNvbmZpcm1hdGlvbnMocmVzcC5yZXN1bHQuY29uZmlybWF0aW9ucyk7XG4gICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgIGNoZWNrLnNldFJlY2VpdmVkQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5yZWNlaXZlZCkpO1xuICAgICAgcmV0dXJuIGNoZWNrO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9wcm9vZlwiLCB7dHhpZDogdHhIYXNoLCBhZGRyZXNzOiBhZGRyZXNzLCBtZXNzYWdlOiBtZXNzYWdlfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja190eF9wcm9vZlwiLCB7XG4gICAgICAgIHR4aWQ6IHR4SGFzaCxcbiAgICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBpbnRlcnByZXQgcmVzcG9uc2VcbiAgICAgIGxldCBpc0dvb2QgPSByZXNwLnJlc3VsdC5nb29kO1xuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZChpc0dvb2QpO1xuICAgICAgaWYgKGlzR29vZCkge1xuICAgICAgICBjaGVjay5zZXROdW1Db25maXJtYXRpb25zKHJlc3AucmVzdWx0LmNvbmZpcm1hdGlvbnMpO1xuICAgICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgICAgY2hlY2suc2V0UmVjZWl2ZWRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnJlY2VpdmVkKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2hlY2s7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtMSAmJiBlLm1lc3NhZ2UgPT09IFwiYmFzaWNfc3RyaW5nXCIpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJNdXN0IHByb3ZpZGUgc2lnbmF0dXJlIHRvIGNoZWNrIHR4IHByb29mXCIsIC0xKTtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfc3BlbmRfcHJvb2ZcIiwge3R4aWQ6IHR4SGFzaCwgbWVzc2FnZTogbWVzc2FnZX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfc3BlbmRfcHJvb2ZcIiwge1xuICAgICAgICB0eGlkOiB0eEhhc2gsXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC5nb29kO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhbGw6IHRydWUsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGFtb3VudDogYmlnaW50LCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFjY291bnRfaW5kZXg6IGFjY291bnRJZHgsXG4gICAgICBhbW91bnQ6IGFtb3VudC50b1N0cmluZygpLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gIH1cblxuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT4ge1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgfSk7XG4gICAgXG4gICAgLy8gaW50ZXJwcmV0IHJlc3VsdHNcbiAgICBsZXQgaXNHb29kID0gcmVzcC5yZXN1bHQuZ29vZDtcbiAgICBsZXQgY2hlY2sgPSBuZXcgTW9uZXJvQ2hlY2tSZXNlcnZlKCk7XG4gICAgY2hlY2suc2V0SXNHb29kKGlzR29vZCk7XG4gICAgaWYgKGlzR29vZCkge1xuICAgICAgY2hlY2suc2V0VW5jb25maXJtZWRTcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQuc3BlbnQpKTtcbiAgICAgIGNoZWNrLnNldFRvdGFsQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC50b3RhbCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hlY2s7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3R4X25vdGVzXCIsIHt0eGlkczogdHhIYXNoZXN9KSkucmVzdWx0Lm5vdGVzO1xuICB9XG4gIFxuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSwgbm90ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X3R4X25vdGVzXCIsIHt0eGlkczogdHhIYXNoZXMsIG5vdGVzOiBub3Rlc30pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb0FkZHJlc3NCb29rRW50cnlbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NfYm9va1wiLCB7ZW50cmllczogZW50cnlJbmRpY2VzfSk7XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5lbnRyaWVzKSByZXR1cm4gW107XG4gICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNFbnRyeSBvZiByZXNwLnJlc3VsdC5lbnRyaWVzKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb0FkZHJlc3NCb29rRW50cnkoKS5zZXRJbmRleChycGNFbnRyeS5pbmRleCkuc2V0QWRkcmVzcyhycGNFbnRyeS5hZGRyZXNzKS5zZXREZXNjcmlwdGlvbihycGNFbnRyeS5kZXNjcmlwdGlvbikuc2V0UGF5bWVudElkKHJwY0VudHJ5LnBheW1lbnRfaWQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzczogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhZGRfYWRkcmVzc19ib29rXCIsIHthZGRyZXNzOiBhZGRyZXNzLCBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb259KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuaW5kZXg7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4OiBudW1iZXIsIHNldEFkZHJlc3M6IGJvb2xlYW4sIGFkZHJlc3M6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2V0RGVzY3JpcHRpb246IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImVkaXRfYWRkcmVzc19ib29rXCIsIHtcbiAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgIHNldF9hZGRyZXNzOiBzZXRBZGRyZXNzLFxuICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgIHNldF9kZXNjcmlwdGlvbjogc2V0RGVzY3JpcHRpb24sXG4gICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZGVsZXRlX2FkZHJlc3NfYm9va1wiLCB7aW5kZXg6IGVudHJ5SWR4fSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRhZ0FjY291bnRzKHRhZywgYWNjb3VudEluZGljZXMpIHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ0YWdfYWNjb3VudHNcIiwge3RhZzogdGFnLCBhY2NvdW50czogYWNjb3VudEluZGljZXN9KTtcbiAgfVxuXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidW50YWdfYWNjb3VudHNcIiwge2FjY291bnRzOiBhY2NvdW50SW5kaWNlc30pO1xuICB9XG5cbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICBsZXQgdGFncyA9IFtdO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FjY291bnRfdGFnc1wiKTtcbiAgICBpZiAocmVzcC5yZXN1bHQuYWNjb3VudF90YWdzKSB7XG4gICAgICBmb3IgKGxldCBycGNBY2NvdW50VGFnIG9mIHJlc3AucmVzdWx0LmFjY291bnRfdGFncykge1xuICAgICAgICB0YWdzLnB1c2gobmV3IE1vbmVyb0FjY291bnRUYWcoe1xuICAgICAgICAgIHRhZzogcnBjQWNjb3VudFRhZy50YWcgPyBycGNBY2NvdW50VGFnLnRhZyA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBsYWJlbDogcnBjQWNjb3VudFRhZy5sYWJlbCA/IHJwY0FjY291bnRUYWcubGFiZWwgOiB1bmRlZmluZWQsXG4gICAgICAgICAgYWNjb3VudEluZGljZXM6IHJwY0FjY291bnRUYWcuYWNjb3VudHNcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFncztcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9hY2NvdW50X3RhZ19kZXNjcmlwdGlvblwiLCB7dGFnOiB0YWcsIGRlc2NyaXB0aW9uOiBsYWJlbH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXltZW50VXJpKGNvbmZpZzogTW9uZXJvVHhDb25maWcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfdXJpXCIsIHtcbiAgICAgIGFkZHJlc3M6IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksXG4gICAgICBhbW91bnQ6IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSA/IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKS50b1N0cmluZygpIDogdW5kZWZpbmVkLFxuICAgICAgcGF5bWVudF9pZDogY29uZmlnLmdldFBheW1lbnRJZCgpLFxuICAgICAgcmVjaXBpZW50X25hbWU6IGNvbmZpZy5nZXRSZWNpcGllbnROYW1lKCksXG4gICAgICB0eF9kZXNjcmlwdGlvbjogY29uZmlnLmdldE5vdGUoKVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC51cmk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmk6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhDb25maWc+IHtcbiAgICBhc3NlcnQodXJpLCBcIk11c3QgcHJvdmlkZSBVUkkgdG8gcGFyc2VcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJwYXJzZV91cmlcIiwge3VyaTogdXJpfSk7XG4gICAgbGV0IGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyh7YWRkcmVzczogcmVzcC5yZXN1bHQudXJpLmFkZHJlc3MsIGFtb3VudDogQmlnSW50KHJlc3AucmVzdWx0LnVyaS5hbW91bnQpfSk7XG4gICAgY29uZmlnLnNldFBheW1lbnRJZChyZXNwLnJlc3VsdC51cmkucGF5bWVudF9pZCk7XG4gICAgY29uZmlnLnNldFJlY2lwaWVudE5hbWUocmVzcC5yZXN1bHQudXJpLnJlY2lwaWVudF9uYW1lKTtcbiAgICBjb25maWcuc2V0Tm90ZShyZXNwLnJlc3VsdC51cmkudHhfZGVzY3JpcHRpb24pO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpKSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uc2V0QWRkcmVzcyh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0UGF5bWVudElkKCkpIGNvbmZpZy5zZXRQYXltZW50SWQodW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldFJlY2lwaWVudE5hbWUoKSkgY29uZmlnLnNldFJlY2lwaWVudE5hbWUodW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldE5vdGUoKSkgY29uZmlnLnNldE5vdGUodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gY29uZmlnO1xuICB9XG4gIFxuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hdHRyaWJ1dGVcIiwge2tleToga2V5fSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQudmFsdWUgPT09IFwiXCIgPyB1bmRlZmluZWQgOiByZXNwLnJlc3VsdC52YWx1ZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC00NSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBzZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcsIHZhbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2F0dHJpYnV0ZVwiLCB7a2V5OiBrZXksIHZhbHVlOiB2YWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcobnVtVGhyZWFkczogbnVtYmVyLCBiYWNrZ3JvdW5kTWluaW5nPzogYm9vbGVhbiwgaWdub3JlQmF0dGVyeT86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdGFydF9taW5pbmdcIiwge1xuICAgICAgdGhyZWFkc19jb3VudDogbnVtVGhyZWFkcyxcbiAgICAgIGRvX2JhY2tncm91bmRfbWluaW5nOiBiYWNrZ3JvdW5kTWluaW5nLFxuICAgICAgaWdub3JlX2JhdHRlcnk6IGlnbm9yZUJhdHRlcnlcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9wX21pbmluZ1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5tdWx0aXNpZ19pbXBvcnRfbmVlZGVkID09PSB0cnVlO1xuICB9XG4gIFxuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luZm8+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImlzX211bHRpc2lnXCIpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgaW5mbyA9IG5ldyBNb25lcm9NdWx0aXNpZ0luZm8oKTtcbiAgICBpbmZvLnNldElzTXVsdGlzaWcocmVzdWx0Lm11bHRpc2lnKTtcbiAgICBpbmZvLnNldElzUmVhZHkocmVzdWx0LnJlYWR5KTtcbiAgICBpbmZvLnNldFRocmVzaG9sZChyZXN1bHQudGhyZXNob2xkKTtcbiAgICBpbmZvLnNldE51bVBhcnRpY2lwYW50cyhyZXN1bHQudG90YWwpO1xuICAgIHJldHVybiBpbmZvO1xuICB9XG4gIFxuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInByZXBhcmVfbXVsdGlzaWdcIiwge2VuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWw6IHRydWV9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICByZXR1cm4gcmVzdWx0Lm11bHRpc2lnX2luZm87XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgdGhyZXNob2xkOiBudW1iZXIsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibWFrZV9tdWx0aXNpZ1wiLCB7XG4gICAgICBtdWx0aXNpZ19pbmZvOiBtdWx0aXNpZ0hleGVzLFxuICAgICAgdGhyZXNob2xkOiB0aHJlc2hvbGQsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmRcbiAgICB9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5tdWx0aXNpZ19pbmZvO1xuICB9XG4gIFxuICBhc3luYyBleGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleGNoYW5nZV9tdWx0aXNpZ19rZXlzXCIsIHttdWx0aXNpZ19pbmZvOiBtdWx0aXNpZ0hleGVzLCBwYXNzd29yZDogcGFzc3dvcmR9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIGxldCBtc1Jlc3VsdCA9IG5ldyBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQoKTtcbiAgICBtc1Jlc3VsdC5zZXRBZGRyZXNzKHJlc3AucmVzdWx0LmFkZHJlc3MpO1xuICAgIG1zUmVzdWx0LnNldE11bHRpc2lnSGV4KHJlc3AucmVzdWx0Lm11bHRpc2lnX2luZm8pO1xuICAgIGlmIChtc1Jlc3VsdC5nZXRBZGRyZXNzKCkubGVuZ3RoID09PSAwKSBtc1Jlc3VsdC5zZXRBZGRyZXNzKHVuZGVmaW5lZCk7XG4gICAgaWYgKG1zUmVzdWx0LmdldE11bHRpc2lnSGV4KCkubGVuZ3RoID09PSAwKSBtc1Jlc3VsdC5zZXRNdWx0aXNpZ0hleCh1bmRlZmluZWQpO1xuICAgIHJldHVybiBtc1Jlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0TXVsdGlzaWdIZXgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4cG9ydF9tdWx0aXNpZ19pbmZvXCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5pbmZvO1xuICB9XG5cbiAgYXN5bmMgaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlczogc3RyaW5nW10pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShtdWx0aXNpZ0hleGVzKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN0cmluZ1tdIHRvIGltcG9ydE11bHRpc2lnSGV4KClcIilcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9tdWx0aXNpZ19pbmZvXCIsIHtpbmZvOiBtdWx0aXNpZ0hleGVzfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm5fb3V0cHV0cztcbiAgfVxuXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzaWduX211bHRpc2lnXCIsIHt0eF9kYXRhX2hleDogbXVsdGlzaWdUeEhleH0pO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgc2lnblJlc3VsdCA9IG5ldyBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQoKTtcbiAgICBzaWduUmVzdWx0LnNldFNpZ25lZE11bHRpc2lnVHhIZXgocmVzdWx0LnR4X2RhdGFfaGV4KTtcbiAgICBzaWduUmVzdWx0LnNldFR4SGFzaGVzKHJlc3VsdC50eF9oYXNoX2xpc3QpO1xuICAgIHJldHVybiBzaWduUmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfbXVsdGlzaWdcIiwge3R4X2RhdGFfaGV4OiBzaWduZWRNdWx0aXNpZ1R4SGV4fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQ6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkXCIsIHtvbGRfcGFzc3dvcmQ6IG9sZFBhc3N3b3JkIHx8IFwiXCIsIG5ld19wYXNzd29yZDogbmV3UGFzc3dvcmQgfHwgXCJcIn0pO1xuICB9XG4gIFxuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3JlXCIpO1xuICB9XG4gIFxuICBhc3luYyBjbG9zZShzYXZlID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5jbG9zZShzYXZlKTtcbiAgICBpZiAoc2F2ZSA9PT0gdW5kZWZpbmVkKSBzYXZlID0gZmFsc2U7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNsb3NlX3dhbGxldFwiLCB7YXV0b3NhdmVfY3VycmVudDogc2F2ZX0pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nsb3NlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmV0dXJuIGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTEzICYmIGUubWVzc2FnZS5pbmRleE9mKFwiTm8gd2FsbGV0IGZpbGVcIikgPiAtMTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICAvKipcbiAgICogU2F2ZSBhbmQgY2xvc2UgdGhlIGN1cnJlbnQgd2FsbGV0IGFuZCBzdG9wIHRoZSBSUEMgc2VydmVyLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3Bfd2FsbGV0XCIpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuXG4gIGFzeW5jIGdldE51bUJsb2Nrc1RvVW5sb2NrKCk6IFByb21pc2U8bnVtYmVyW118dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXROdW1CbG9ja3NUb1VubG9jaygpOyB9XG4gIGFzeW5jIGdldFR4KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldHx1bmRlZmluZWQ+IHsgcmV0dXJuIHN1cGVyLmdldFR4KHR4SGFzaCk7IH1cbiAgYXN5bmMgZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb0luY29taW5nVHJhbnNmZXJbXT4geyByZXR1cm4gc3VwZXIuZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KSB7IHJldHVybiBzdXBlci5nZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeSk7IH1cbiAgYXN5bmMgY3JlYXRlVHgoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHsgcmV0dXJuIHN1cGVyLmNyZWF0ZVR4KGNvbmZpZyk7IH1cbiAgYXN5bmMgcmVsYXlUeCh0eE9yTWV0YWRhdGE6IE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLnJlbGF5VHgodHhPck1ldGFkYXRhKTsgfVxuICBhc3luYyBnZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIuZ2V0VHhOb3RlKHR4SGFzaCk7IH1cbiAgYXN5bmMgc2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nLCBub3RlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHN1cGVyLnNldFR4Tm90ZSh0eEhhc2gsIG5vdGUpOyB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHN0YXRpYyBhc3luYyBjb25uZWN0VG9XYWxsZXRScGModXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBsZXQgY29uZmlnID0gTW9uZXJvV2FsbGV0UnBjLm5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZywgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICBpZiAoY29uZmlnLmNtZCkgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5zdGFydFdhbGxldFJwY1Byb2Nlc3MoY29uZmlnKTtcbiAgICBlbHNlIHJldHVybiBuZXcgTW9uZXJvV2FsbGV0UnBjKGNvbmZpZyk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgc3RhcnRXYWxsZXRScGNQcm9jZXNzKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNBcnJheShjb25maWcuY21kKSwgXCJNdXN0IHByb3ZpZGUgc3RyaW5nIGFycmF5IHdpdGggY29tbWFuZCBsaW5lIHBhcmFtZXRlcnNcIik7XG4gICAgXG4gICAgLy8gc3RhcnQgcHJvY2Vzc1xuICAgIGxldCBjaGlsZF9wcm9jZXNzID0gYXdhaXQgaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKTtcbiAgICBjb25zdCBjaGlsZFByb2Nlc3MgPSBjaGlsZF9wcm9jZXNzLnNwYXduKGNvbmZpZy5jbWRbMF0sIGNvbmZpZy5jbWQuc2xpY2UoMSksIHtcbiAgICAgIGVudjogeyAuLi5wcm9jZXNzLmVudiwgTEFORzogJ2VuX1VTLlVURi04JyB9IC8vIHNjcmFwZSBvdXRwdXQgaW4gZW5nbGlzaFxuICAgIH0pO1xuICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgYWZ0ZXIgc3RhcnRpbmcgbW9uZXJvLXdhbGxldC1ycGNcbiAgICBsZXQgdXJpO1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICBsZXQgb3V0cHV0ID0gXCJcIjtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRvdXRcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5vbignZGF0YScsIGFzeW5jIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBsZXQgbGluZSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDIsIGxpbmUpO1xuICAgICAgICAgIG91dHB1dCArPSBsaW5lICsgJ1xcbic7IC8vIGNhcHR1cmUgb3V0cHV0IGluIGNhc2Ugb2YgZXJyb3JcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBleHRyYWN0IHVyaSBmcm9tIGUuZy4gXCJJIEJpbmRpbmcgb24gMTI3LjAuMC4xIChJUHY0KTozODA4NVwiXG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWlucyA9IFwiQmluZGluZyBvbiBcIjtcbiAgICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zSWR4ID0gbGluZS5pbmRleE9mKHVyaUxpbmVDb250YWlucyk7XG4gICAgICAgICAgaWYgKHVyaUxpbmVDb250YWluc0lkeCA+PSAwKSB7XG4gICAgICAgICAgICBsZXQgaG9zdCA9IGxpbmUuc3Vic3RyaW5nKHVyaUxpbmVDb250YWluc0lkeCArIHVyaUxpbmVDb250YWlucy5sZW5ndGgsIGxpbmUubGFzdEluZGV4T2YoJyAnKSk7XG4gICAgICAgICAgICBsZXQgdW5mb3JtYXR0ZWRMaW5lID0gbGluZS5yZXBsYWNlKC9cXHUwMDFiXFxbLio/bS9nLCAnJykudHJpbSgpOyAvLyByZW1vdmUgY29sb3IgZm9ybWF0dGluZ1xuICAgICAgICAgICAgbGV0IHBvcnQgPSB1bmZvcm1hdHRlZExpbmUuc3Vic3RyaW5nKHVuZm9ybWF0dGVkTGluZS5sYXN0SW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBsZXQgc3NsSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtc3NsXCIpO1xuICAgICAgICAgICAgbGV0IHNzbEVuYWJsZWQgPSBzc2xJZHggPj0gMCA/IFwiZW5hYmxlZFwiID09IGNvbmZpZy5jbWRbc3NsSWR4ICsgMV0udG9Mb3dlckNhc2UoKSA6IGZhbHNlO1xuICAgICAgICAgICAgdXJpID0gKHNzbEVuYWJsZWQgPyBcImh0dHBzXCIgOiBcImh0dHBcIikgKyBcIjovL1wiICsgaG9zdCArIFwiOlwiICsgcG9ydDtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVhZCBzdWNjZXNzIG1lc3NhZ2VcbiAgICAgICAgICBpZiAobGluZS5pbmRleE9mKFwiU3RhcnRpbmcgd2FsbGV0IFJQQyBzZXJ2ZXJcIikgPj0gMCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBnZXQgdXNlcm5hbWUgYW5kIHBhc3N3b3JkIGZyb20gcGFyYW1zXG4gICAgICAgICAgICBsZXQgdXNlclBhc3NJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXJwYy1sb2dpblwiKTtcbiAgICAgICAgICAgIGxldCB1c2VyUGFzcyA9IHVzZXJQYXNzSWR4ID49IDAgPyBjb25maWcuY21kW3VzZXJQYXNzSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSB1c2VyUGFzcyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdXNlclBhc3Muc3Vic3RyaW5nKDAsIHVzZXJQYXNzLmluZGV4T2YoJzonKSk7XG4gICAgICAgICAgICBsZXQgcGFzc3dvcmQgPSB1c2VyUGFzcyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdXNlclBhc3Muc3Vic3RyaW5nKHVzZXJQYXNzLmluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBjcmVhdGUgY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzXG4gICAgICAgICAgICBjb25maWcgPSBjb25maWcuY29weSgpLnNldFNlcnZlcih7dXJpOiB1cmksIHVzZXJuYW1lOiB1c2VybmFtZSwgcGFzc3dvcmQ6IHBhc3N3b3JkLCByZWplY3RVbmF1dGhvcml6ZWQ6IGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZH0pO1xuICAgICAgICAgICAgY29uZmlnLmNtZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRScGMuY29ubmVjdFRvV2FsbGV0UnBjKGNvbmZpZyk7XG4gICAgICAgICAgICB3YWxsZXQucHJvY2VzcyA9IGNoaWxkUHJvY2VzcztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gcmVzb2x2ZSBwcm9taXNlIHdpdGggY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzIFxuICAgICAgICAgICAgdGhpcy5pc1Jlc29sdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmUod2FsbGV0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHN0ZGVyclxuICAgICAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBjb25zb2xlLmVycm9yKGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBleGl0XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcImV4aXRcIiwgZnVuY3Rpb24oY29kZSkge1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgcHJvY2VzcyB0ZXJtaW5hdGVkIHdpdGggZXhpdCBjb2RlIFwiICsgY29kZSArIChvdXRwdXQgPyBcIjpcXG5cXG5cIiArIG91dHB1dCA6IFwiXCIpKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIGVycm9yXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcImVycm9yXCIsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIGlmIChlcnIubWVzc2FnZS5pbmRleE9mKFwiRU5PRU5UXCIpID49IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBleGlzdCBhdCBwYXRoICdcIiArIGNvbmZpZy5jbWRbMF0gKyBcIidcIikpO1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgdW5jYXVnaHQgZXhjZXB0aW9uXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcInVuY2F1Z2h0RXhjZXB0aW9uXCIsIGZ1bmN0aW9uKGVyciwgb3JpZ2luKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuY2F1Z2h0IGV4Y2VwdGlvbiBpbiBtb25lcm8td2FsbGV0LXJwYyBwcm9jZXNzOiBcIiArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKG9yaWdpbik7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNsZWFyKCkge1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICAgIGRlbGV0ZSB0aGlzLmFkZHJlc3NDYWNoZTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIHRoaXMucGF0aCA9IHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldEFjY291bnRJbmRpY2VzKGdldFN1YmFkZHJlc3NJbmRpY2VzPzogYW55KSB7XG4gICAgbGV0IGluZGljZXMgPSBuZXcgTWFwKCk7XG4gICAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCB0aGlzLmdldEFjY291bnRzKCkpIHtcbiAgICAgIGluZGljZXMuc2V0KGFjY291bnQuZ2V0SW5kZXgoKSwgZ2V0U3ViYWRkcmVzc0luZGljZXMgPyBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NJbmRpY2VzKGFjY291bnQuZ2V0SW5kZXgoKSkgOiB1bmRlZmluZWQpO1xuICAgIH1cbiAgICByZXR1cm4gaW5kaWNlcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldFN1YmFkZHJlc3NJbmRpY2VzKGFjY291bnRJZHgpIHtcbiAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzXCIsIHthY2NvdW50X2luZGV4OiBhY2NvdW50SWR4fSk7XG4gICAgZm9yIChsZXQgYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5hZGRyZXNzZXMpIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goYWRkcmVzcy5hZGRyZXNzX2luZGV4KTtcbiAgICByZXR1cm4gc3ViYWRkcmVzc0luZGljZXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRUcmFuc2ZlcnNBdXgocXVlcnk6IE1vbmVyb1RyYW5zZmVyUXVlcnkpIHtcbiAgICBcbiAgICAvLyBidWlsZCBwYXJhbXMgZm9yIGdldF90cmFuc2ZlcnMgcnBjIGNhbGxcbiAgICBsZXQgdHhRdWVyeSA9IHF1ZXJ5LmdldFR4UXVlcnkoKTtcbiAgICBsZXQgY2FuQmVDb25maXJtZWQgPSB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJc1JlbGF5ZWQoKSAhPT0gZmFsc2U7XG4gICAgbGV0IGNhbkJlSW5UeFBvb2wgPSB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9PSBmYWxzZSAmJiB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCAmJiB0eFF1ZXJ5LmdldElzTG9ja2VkKCkgIT09IGZhbHNlO1xuICAgIGxldCBjYW5CZUluY29taW5nID0gcXVlcnkuZ2V0SXNJbmNvbWluZygpICE9PSBmYWxzZSAmJiBxdWVyeS5nZXRJc091dGdvaW5nKCkgIT09IHRydWUgJiYgcXVlcnkuZ2V0SGFzRGVzdGluYXRpb25zKCkgIT09IHRydWU7XG4gICAgbGV0IGNhbkJlT3V0Z29pbmcgPSBxdWVyeS5nZXRJc091dGdvaW5nKCkgIT09IGZhbHNlICYmIHF1ZXJ5LmdldElzSW5jb21pbmcoKSAhPT0gdHJ1ZTtcblxuICAgIC8vIGNoZWNrIGlmIGZldGNoaW5nIHBvb2wgdHhzIGNvbnRyYWRpY3RlZCBieSBjb25maWd1cmF0aW9uXG4gICAgaWYgKHR4UXVlcnkuZ2V0SW5UeFBvb2woKSA9PT0gdHJ1ZSAmJiAhY2FuQmVJblR4UG9vbCkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IGZldGNoIHBvb2wgdHJhbnNhY3Rpb25zIGJlY2F1c2UgaXQgY29udHJhZGljdHMgY29uZmlndXJhdGlvblwiKTtcbiAgICB9XG5cbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuaW4gPSBjYW5CZUluY29taW5nICYmIGNhbkJlQ29uZmlybWVkO1xuICAgIHBhcmFtcy5vdXQgPSBjYW5CZU91dGdvaW5nICYmIGNhbkJlQ29uZmlybWVkO1xuICAgIHBhcmFtcy5wb29sID0gY2FuQmVJbmNvbWluZyAmJiBjYW5CZUluVHhQb29sO1xuICAgIHBhcmFtcy5wZW5kaW5nID0gY2FuQmVPdXRnb2luZyAmJiBjYW5CZUluVHhQb29sO1xuICAgIHBhcmFtcy5mYWlsZWQgPSB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT0gdHJ1ZTtcbiAgICBpZiAodHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHhRdWVyeS5nZXRNaW5IZWlnaHQoKSA+IDApIHBhcmFtcy5taW5faGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAtIDE7IC8vIFRPRE8gbW9uZXJvLXByb2plY3Q6IHdhbGxldDI6OmdldF9wYXltZW50cygpIG1pbl9oZWlnaHQgaXMgZXhjbHVzaXZlLCBzbyBtYW51YWxseSBvZmZzZXQgdG8gbWF0Y2ggaW50ZW5kZWQgcmFuZ2UgKGlzc3VlcyAjNTc1MSwgIzU1OTgpXG4gICAgICBlbHNlIHBhcmFtcy5taW5faGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKTtcbiAgICB9XG4gICAgaWYgKHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgcGFyYW1zLm1heF9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1heEhlaWdodCgpO1xuICAgIHBhcmFtcy5maWx0ZXJfYnlfaGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAhPT0gdW5kZWZpbmVkIHx8IHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgIT09IHVuZGVmaW5lZDtcbiAgICBpZiAocXVlcnkuZ2V0QWNjb3VudEluZGV4KCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0KHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpID09PSB1bmRlZmluZWQgJiYgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkLCBcIlF1ZXJ5IHNwZWNpZmllcyBhIHN1YmFkZHJlc3MgaW5kZXggYnV0IG5vdCBhbiBhY2NvdW50IGluZGV4XCIpO1xuICAgICAgcGFyYW1zLmFsbF9hY2NvdW50cyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gcXVlcnkuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgICBcbiAgICAgIC8vIHNldCBzdWJhZGRyZXNzIGluZGljZXMgcGFyYW1cbiAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IG5ldyBTZXQoKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAhPT0gdW5kZWZpbmVkKSBzdWJhZGRyZXNzSW5kaWNlcy5hZGQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5tYXAoc3ViYWRkcmVzc0lkeCA9PiBzdWJhZGRyZXNzSW5kaWNlcy5hZGQoc3ViYWRkcmVzc0lkeCkpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJbmRpY2VzLnNpemUpIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBBcnJheS5mcm9tKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgdW5pcXVlIHR4cyBhbmQgYmxvY2tzXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgXG4gICAgLy8gYnVpbGQgdHhzIHVzaW5nIGBnZXRfdHJhbnNmZXJzYFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3RyYW5zZmVyc1wiLCBwYXJhbXMpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhyZXNwLnJlc3VsdCkpIHtcbiAgICAgIGZvciAobGV0IHJwY1R4IG9mIHJlc3AucmVzdWx0W2tleV0pIHtcbiAgICAgICAgLy9pZiAocnBjVHgudHhpZCA9PT0gcXVlcnkuZGVidWdUeElkKSBjb25zb2xlLmxvZyhycGNUeCk7XG4gICAgICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHgpO1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkgYXNzZXJ0KHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCkgPiAtMSk7XG4gICAgICAgIFxuICAgICAgICAvLyByZXBsYWNlIHRyYW5zZmVyIGFtb3VudCB3aXRoIGRlc3RpbmF0aW9uIHN1bVxuICAgICAgICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBjb25maXJtZWQgdHggZnJvbS90byBzYW1lIGFjY291bnQgaGFzIGFtb3VudCAwIGJ1dCBjYWNoZWQgdHJhbnNmZXJzXG4gICAgICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRJc1JlbGF5ZWQoKSAmJiAhdHguZ2V0SXNGYWlsZWQoKSAmJlxuICAgICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpICYmIHR4LmdldE91dGdvaW5nQW1vdW50KCkgPT09IDBuKSB7XG4gICAgICAgICAgbGV0IG91dGdvaW5nVHJhbnNmZXIgPSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgICAgICAgbGV0IHRyYW5zZmVyVG90YWwgPSBCaWdJbnQoMCk7XG4gICAgICAgICAgZm9yIChsZXQgZGVzdGluYXRpb24gb2Ygb3V0Z29pbmdUcmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKSkgdHJhbnNmZXJUb3RhbCA9IHRyYW5zZmVyVG90YWwgKyBkZXN0aW5hdGlvbi5nZXRBbW91bnQoKTtcbiAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0QW1vdW50KHRyYW5zZmVyVG90YWwpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBtZXJnZSB0eFxuICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc29ydCB0eHMgYnkgYmxvY2sgaGVpZ2h0XG4gICAgbGV0IHR4czogTW9uZXJvVHhXYWxsZXRbXSA9IE9iamVjdC52YWx1ZXModHhNYXApO1xuICAgIHR4cy5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQpO1xuICAgIFxuICAgIC8vIGZpbHRlciBhbmQgcmV0dXJuIHRyYW5zZmVyc1xuICAgIGxldCB0cmFuc2ZlcnMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIFxuICAgICAgLy8gdHggaXMgbm90IGluY29taW5nL291dGdvaW5nIHVubGVzcyBhbHJlYWR5IHNldFxuICAgICAgaWYgKHR4LmdldElzSW5jb21pbmcoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0luY29taW5nKGZhbHNlKTtcbiAgICAgIGlmICh0eC5nZXRJc091dGdvaW5nKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNPdXRnb2luZyhmYWxzZSk7XG4gICAgICBcbiAgICAgIC8vIHNvcnQgaW5jb21pbmcgdHJhbnNmZXJzXG4gICAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVJbmNvbWluZ1RyYW5zZmVycyk7XG4gICAgICBcbiAgICAgIC8vIGNvbGxlY3QgcXVlcmllZCB0cmFuc2ZlcnMsIGVyYXNlIGlmIGV4Y2x1ZGVkXG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5maWx0ZXJUcmFuc2ZlcnMocXVlcnkpKSB7XG4gICAgICAgIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcmVtb3ZlIHR4cyB3aXRob3V0IHJlcXVlc3RlZCB0cmFuc2ZlclxuICAgICAgaWYgKHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT09IHVuZGVmaW5lZCAmJiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRPdXRwdXRzQXV4KHF1ZXJ5KSB7XG4gICAgXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBiZSBxdWVyaWVkXG4gICAgbGV0IGluZGljZXMgPSBuZXcgTWFwKCk7XG4gICAgaWYgKHF1ZXJ5LmdldEFjY291bnRJbmRleCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IG5ldyBTZXQoKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAhPT0gdW5kZWZpbmVkKSBzdWJhZGRyZXNzSW5kaWNlcy5hZGQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5tYXAoc3ViYWRkcmVzc0lkeCA9PiBzdWJhZGRyZXNzSW5kaWNlcy5hZGQoc3ViYWRkcmVzc0lkeCkpO1xuICAgICAgaW5kaWNlcy5zZXQocXVlcnkuZ2V0QWNjb3VudEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzLnNpemUgPyBBcnJheS5mcm9tKHN1YmFkZHJlc3NJbmRpY2VzKSA6IHVuZGVmaW5lZCk7ICAvLyB1bmRlZmluZWQgd2lsbCBmZXRjaCBmcm9tIGFsbCBzdWJhZGRyZXNzZXNcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXJ0LmVxdWFsKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpLCB1bmRlZmluZWQsIFwiUXVlcnkgc3BlY2lmaWVzIGEgc3ViYWRkcmVzcyBpbmRleCBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIilcbiAgICAgIGFzc2VydChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQgfHwgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDAsIFwiUXVlcnkgc3BlY2lmaWVzIHN1YmFkZHJlc3MgaW5kaWNlcyBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIik7XG4gICAgICBpbmRpY2VzID0gYXdhaXQgdGhpcy5nZXRBY2NvdW50SW5kaWNlcygpOyAgLy8gZmV0Y2ggYWxsIGFjY291bnQgaW5kaWNlcyB3aXRob3V0IHN1YmFkZHJlc3Nlc1xuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB1bmlxdWUgdHhzIGFuZCBibG9ja3NcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHR4cyB3aXRoIG91dHB1dHMgZm9yIGVhY2ggaW5kaWNhdGVkIGFjY291bnQgdXNpbmcgYGluY29taW5nX3RyYW5zZmVyc2AgcnBjIGNhbGxcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMudHJhbnNmZXJfdHlwZSA9IHF1ZXJ5LmdldElzU3BlbnQoKSA9PT0gdHJ1ZSA/IFwidW5hdmFpbGFibGVcIiA6IHF1ZXJ5LmdldElzU3BlbnQoKSA9PT0gZmFsc2UgPyBcImF2YWlsYWJsZVwiIDogXCJhbGxcIjtcbiAgICBwYXJhbXMudmVyYm9zZSA9IHRydWU7XG4gICAgZm9yIChsZXQgYWNjb3VudElkeCBvZiBpbmRpY2VzLmtleXMoKSkge1xuICAgIFxuICAgICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gaW5kaWNlcy5nZXQoYWNjb3VudElkeCk7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImluY29taW5nX3RyYW5zZmVyc1wiLCBwYXJhbXMpO1xuICAgICAgXG4gICAgICAvLyBjb252ZXJ0IHJlc3BvbnNlIHRvIHR4cyB3aXRoIG91dHB1dHMgYW5kIG1lcmdlXG4gICAgICBpZiAocmVzcC5yZXN1bHQudHJhbnNmZXJzID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuICAgICAgZm9yIChsZXQgcnBjT3V0cHV0IG9mIHJlc3AucmVzdWx0LnRyYW5zZmVycykge1xuICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2FsbGV0V2l0aE91dHB1dChycGNPdXRwdXQpO1xuICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc29ydCB0eHMgYnkgYmxvY2sgaGVpZ2h0XG4gICAgbGV0IHR4czogTW9uZXJvVHhXYWxsZXRbXSA9IE9iamVjdC52YWx1ZXModHhNYXApO1xuICAgIHR4cy5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQpO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgcXVlcmllZCBvdXRwdXRzXG4gICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIFxuICAgICAgLy8gc29ydCBvdXRwdXRzXG4gICAgICBpZiAodHguZ2V0T3V0cHV0cygpICE9PSB1bmRlZmluZWQpIHR4LmdldE91dHB1dHMoKS5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlT3V0cHV0cyk7XG4gICAgICBcbiAgICAgIC8vIGNvbGxlY3QgcXVlcmllZCBvdXRwdXRzLCBlcmFzZSBpZiBleGNsdWRlZFxuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmZpbHRlck91dHB1dHMocXVlcnkpKSBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICAgIFxuICAgICAgLy8gcmVtb3ZlIGV4Y2x1ZGVkIHR4cyBmcm9tIGJsb2NrXG4gICAgICBpZiAodHguZ2V0T3V0cHV0cygpID09PSB1bmRlZmluZWQgJiYgdHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbW1vbiBtZXRob2QgdG8gZ2V0IGtleSBpbWFnZXMuXG4gICAqIFxuICAgKiBAcGFyYW0gYWxsIC0gcGVjaWZpZXMgdG8gZ2V0IGFsbCB4b3Igb25seSBuZXcgaW1hZ2VzIGZyb20gbGFzdCBpbXBvcnRcbiAgICogQHJldHVybiB7TW9uZXJvS2V5SW1hZ2VbXX0gYXJlIHRoZSBrZXkgaW1hZ2VzXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgcnBjRXhwb3J0S2V5SW1hZ2VzKGFsbCkge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X2tleV9pbWFnZXNcIiwge2FsbDogYWxsfSk7XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5zaWduZWRfa2V5X2ltYWdlcykgcmV0dXJuIFtdO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduZWRfa2V5X2ltYWdlcy5tYXAocnBjSW1hZ2UgPT4gbmV3IE1vbmVyb0tleUltYWdlKHJwY0ltYWdlLmtleV9pbWFnZSwgcnBjSW1hZ2Uuc2lnbmF0dXJlKSk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBycGNTd2VlcEFjY291bnQoY29uZmlnOiBNb25lcm9UeENvbmZpZykge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN3ZWVwIGNvbmZpZ1wiKTtcbiAgICBpZiAoY29uZmlnLmdldEFjY291bnRJbmRleCgpID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBhbiBhY2NvdW50IGluZGV4IHRvIHN3ZWVwIGZyb21cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGggIT0gMSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGV4YWN0bHkgb25lIGRlc3RpbmF0aW9uIHRvIHN3ZWVwIHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBkZXN0aW5hdGlvbiBhZGRyZXNzIHRvIHN3ZWVwIHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QW1vdW50KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgYW1vdW50IGluIHN3ZWVwIGNvbmZpZ1wiKTtcbiAgICBpZiAoY29uZmlnLmdldEtleUltYWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiS2V5IGltYWdlIGRlZmluZWQ7IHVzZSBzd2VlcE91dHB1dCgpIHRvIHN3ZWVwIGFuIG91dHB1dCBieSBpdHMga2V5IGltYWdlXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkICYmIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiRW1wdHkgbGlzdCBnaXZlbiBmb3Igc3ViYWRkcmVzc2VzIGluZGljZXMgdG8gc3dlZXBcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTd2VlcEVhY2hTdWJhZGRyZXNzKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzd2VlcCBlYWNoIHN1YmFkZHJlc3Mgd2l0aCBSUEMgYHN3ZWVwX2FsbGBcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJ0cmFjdEZlZUZyb20oKSAhPT0gdW5kZWZpbmVkICYmIGNvbmZpZy5nZXRTdWJ0cmFjdEZlZUZyb20oKS5sZW5ndGggPiAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTd2VlcGluZyBvdXRwdXQgZG9lcyBub3Qgc3VwcG9ydCBzdWJ0cmFjdGluZyBmZWVzIGZyb20gZGVzdGluYXRpb25zXCIpO1xuICAgIFxuICAgIC8vIHN3ZWVwIGZyb20gYWxsIHN1YmFkZHJlc3NlcyBpZiBub3Qgb3RoZXJ3aXNlIGRlZmluZWRcbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uZmlnLnNldFN1YmFkZHJlc3NJbmRpY2VzKFtdKTtcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoY29uZmlnLmdldEFjY291bnRJbmRleCgpKSkge1xuICAgICAgICBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5wdXNoKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vIHN1YmFkZHJlc3NlcyB0byBzd2VlcCBmcm9tXCIpO1xuICAgIFxuICAgIC8vIGNvbW1vbiBjb25maWcgcGFyYW1zXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgbGV0IHJlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgPT09IHRydWU7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBjb25maWcuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpO1xuICAgIHBhcmFtcy5hZGRyZXNzID0gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKTtcbiAgICBhc3NlcnQoY29uZmlnLmdldFByaW9yaXR5KCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpb3JpdHkoKSA+PSAwICYmIGNvbmZpZy5nZXRQcmlvcml0eSgpIDw9IDMpO1xuICAgIHBhcmFtcy5wcmlvcml0eSA9IGNvbmZpZy5nZXRQcmlvcml0eSgpO1xuICAgIHBhcmFtcy5wYXltZW50X2lkID0gY29uZmlnLmdldFBheW1lbnRJZCgpO1xuICAgIHBhcmFtcy5kb19ub3RfcmVsYXkgPSAhcmVsYXk7XG4gICAgcGFyYW1zLmJlbG93X2Ftb3VudCA9IGNvbmZpZy5nZXRCZWxvd0Ftb3VudCgpO1xuICAgIHBhcmFtcy5nZXRfdHhfa2V5cyA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9oZXggPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfbWV0YWRhdGEgPSB0cnVlO1xuICAgIFxuICAgIC8vIGludm9rZSB3YWxsZXQgcnBjIGBzd2VlcF9hbGxgXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzd2VlcF9hbGxcIiwgcGFyYW1zKTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eHMgZnJvbSByZXNwb25zZVxuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzdWx0LCB1bmRlZmluZWQsIGNvbmZpZyk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSByZW1haW5pbmcga25vd24gZmllbGRzXG4gICAgZm9yIChsZXQgdHggb2YgdHhTZXQuZ2V0VHhzKCkpIHtcbiAgICAgIHR4LnNldElzTG9ja2VkKHRydWUpO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICAgIHR4LnNldFJlbGF5KHJlbGF5KTtcbiAgICAgIHR4LnNldEluVHhQb29sKHJlbGF5KTtcbiAgICAgIHR4LnNldElzUmVsYXllZChyZWxheSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgbGV0IHRyYW5zZmVyID0gdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpO1xuICAgICAgdHJhbnNmZXIuc2V0QWNjb3VudEluZGV4KGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKSk7XG4gICAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAxKSB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kaWNlcyhjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSk7XG4gICAgICBsZXQgZGVzdGluYXRpb24gPSBuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSwgQmlnSW50KHRyYW5zZmVyLmdldEFtb3VudCgpKSk7XG4gICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoW2Rlc3RpbmF0aW9uXSk7XG4gICAgICB0eC5zZXRPdXRnb2luZ1RyYW5zZmVyKHRyYW5zZmVyKTtcbiAgICAgIHR4LnNldFBheW1lbnRJZChjb25maWcuZ2V0UGF5bWVudElkKCkpO1xuICAgICAgaWYgKHR4LmdldFVubG9ja1RpbWUoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRVbmxvY2tUaW1lKDBuKTtcbiAgICAgIGlmICh0eC5nZXRSZWxheSgpKSB7XG4gICAgICAgIGlmICh0eC5nZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgpID09PSB1bmRlZmluZWQpIHR4LnNldExhc3RSZWxheWVkVGltZXN0YW1wKCtuZXcgRGF0ZSgpLmdldFRpbWUoKSk7ICAvLyBUT0RPIChtb25lcm8td2FsbGV0LXJwYyk6IHByb3ZpZGUgdGltZXN0YW1wIG9uIHJlc3BvbnNlOyB1bmNvbmZpcm1lZCB0aW1lc3RhbXBzIHZhcnlcbiAgICAgICAgaWYgKHR4LmdldElzRG91YmxlU3BlbmRTZWVuKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4oZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHhTZXQuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCByZWZyZXNoTGlzdGVuaW5nKCkge1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciA9PSB1bmRlZmluZWQgJiYgdGhpcy5saXN0ZW5lcnMubGVuZ3RoKSB0aGlzLndhbGxldFBvbGxlciA9IG5ldyBXYWxsZXRQb2xsZXIodGhpcyk7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyICE9PSB1bmRlZmluZWQpIHRoaXMud2FsbGV0UG9sbGVyLnNldElzUG9sbGluZyh0aGlzLmxpc3RlbmVycy5sZW5ndGggPiAwKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFBvbGwgaWYgbGlzdGVuaW5nLlxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIHBvbGwoKSB7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyICE9PSB1bmRlZmluZWQgJiYgdGhpcy53YWxsZXRQb2xsZXIuaXNQb2xsaW5nKSBhd2FpdCB0aGlzLndhbGxldFBvbGxlci5wb2xsKCk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBTVEFUSUMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPiB8IHN0cmluZ1tdLCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpOiBNb25lcm9XYWxsZXRDb25maWcge1xuICAgIGxldCBjb25maWc6IHVuZGVmaW5lZCB8IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPiA9IHVuZGVmaW5lZDtcbiAgICBpZiAodHlwZW9mIHVyaU9yQ29uZmlnID09PSBcInN0cmluZ1wiIHx8ICh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KS51cmkpIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoe3NlcnZlcjogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25maWcgYXMgc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiwgdXNlcm5hbWUsIHBhc3N3b3JkKX0pO1xuICAgIGVsc2UgaWYgKEdlblV0aWxzLmlzQXJyYXkodXJpT3JDb25maWcpKSBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHtjbWQ6IHVyaU9yQ29uZmlnIGFzIHN0cmluZ1tdfSk7XG4gICAgZWxzZSBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik7XG4gICAgaWYgKGNvbmZpZy5wcm94eVRvV29ya2VyID09PSB1bmRlZmluZWQpIGNvbmZpZy5wcm94eVRvV29ya2VyID0gdHJ1ZTtcbiAgICByZXR1cm4gY29uZmlnIGFzIE1vbmVyb1dhbGxldENvbmZpZztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlbW92ZSBjcml0ZXJpYSB3aGljaCByZXF1aXJlcyBsb29raW5nIHVwIG90aGVyIHRyYW5zZmVycy9vdXRwdXRzIHRvXG4gICAqIGZ1bGZpbGwgcXVlcnkuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4UXVlcnl9IHF1ZXJ5IC0gdGhlIHF1ZXJ5IHRvIGRlY29udGV4dHVhbGl6ZVxuICAgKiBAcmV0dXJuIHtNb25lcm9UeFF1ZXJ5fSBhIHJlZmVyZW5jZSB0byB0aGUgcXVlcnkgZm9yIGNvbnZlbmllbmNlXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGRlY29udGV4dHVhbGl6ZShxdWVyeSkge1xuICAgIHF1ZXJ5LnNldElzSW5jb21pbmcodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRJc091dGdvaW5nKHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0VHJhbnNmZXJRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldElucHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRPdXRwdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIHJldHVybiBxdWVyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBpc0NvbnRleHR1YWwocXVlcnkpIHtcbiAgICBpZiAoIXF1ZXJ5KSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKCFxdWVyeS5nZXRUeFF1ZXJ5KCkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldElzSW5jb21pbmcoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciB0cmFuc2ZlcnNcbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldElzT3V0Z29pbmcoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAocXVlcnkgaW5zdGFuY2VvZiBNb25lcm9UcmFuc2ZlclF1ZXJ5KSB7XG4gICAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldE91dHB1dFF1ZXJ5KCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7IC8vIHJlcXVpcmVzIGdldHRpbmcgb3RoZXIgb3V0cHV0c1xuICAgIH0gZWxzZSBpZiAocXVlcnkgaW5zdGFuY2VvZiBNb25lcm9PdXRwdXRRdWVyeSkge1xuICAgICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRUcmFuc2ZlclF1ZXJ5KCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7IC8vIHJlcXVpcmVzIGdldHRpbmcgb3RoZXIgdHJhbnNmZXJzXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcInF1ZXJ5IG11c3QgYmUgdHggb3IgdHJhbnNmZXIgcXVlcnlcIik7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQWNjb3VudChycGNBY2NvdW50KSB7XG4gICAgbGV0IGFjY291bnQgPSBuZXcgTW9uZXJvQWNjb3VudCgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNBY2NvdW50KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0FjY291bnRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYWNjb3VudF9pbmRleFwiKSBhY2NvdW50LnNldEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmFsYW5jZVwiKSBhY2NvdW50LnNldEJhbGFuY2UoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja2VkX2JhbGFuY2VcIikgYWNjb3VudC5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhc2VfYWRkcmVzc1wiKSBhY2NvdW50LnNldFByaW1hcnlBZGRyZXNzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFnXCIpIGFjY291bnQuc2V0VGFnKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFiZWxcIikgeyB9IC8vIGxhYmVsIGJlbG9uZ3MgdG8gZmlyc3Qgc3ViYWRkcmVzc1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgYWNjb3VudCBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBpZiAoXCJcIiA9PT0gYWNjb3VudC5nZXRUYWcoKSkgYWNjb3VudC5zZXRUYWcodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gYWNjb3VudDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKSB7XG4gICAgbGV0IHN1YmFkZHJlc3MgPSBuZXcgTW9uZXJvU3ViYWRkcmVzcygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNTdWJhZGRyZXNzKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1N1YmFkZHJlc3Nba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYWNjb3VudF9pbmRleFwiKSBzdWJhZGRyZXNzLnNldEFjY291bnRJbmRleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkZHJlc3NfaW5kZXhcIikgc3ViYWRkcmVzcy5zZXRJbmRleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkZHJlc3NcIikgc3ViYWRkcmVzcy5zZXRBZGRyZXNzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmFsYW5jZVwiKSBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja2VkX2JhbGFuY2VcIikgc3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV91bnNwZW50X291dHB1dHNcIikgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhYmVsXCIpIHsgaWYgKHZhbCkgc3ViYWRkcmVzcy5zZXRMYWJlbCh2YWwpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidXNlZFwiKSBzdWJhZGRyZXNzLnNldElzVXNlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2Nrc190b191bmxvY2tcIikgc3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jayh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09IFwidGltZV90b191bmxvY2tcIikge30gIC8vIGlnbm9yaW5nXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBzdWJhZGRyZXNzIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBzdWJhZGRyZXNzO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSBzZW50IHRyYW5zYWN0aW9uLlxuICAgKiBcbiAgICogVE9ETzogcmVtb3ZlIGNvcHlEZXN0aW5hdGlvbnMgYWZ0ZXIgPjE4LjMuMSB3aGVuIHN1YnRyYWN0RmVlRnJvbSBmdWxseSBzdXBwb3J0ZWRcbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhDb25maWd9IGNvbmZpZyAtIHNlbmQgY29uZmlnXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhXYWxsZXR9IFt0eF0gLSBleGlzdGluZyB0cmFuc2FjdGlvbiB0byBpbml0aWFsaXplIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBjb3B5RGVzdGluYXRpb25zIC0gY29waWVzIGNvbmZpZyBkZXN0aW5hdGlvbnMgaWYgdHJ1ZVxuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gaXMgdGhlIGluaXRpYWxpemVkIHNlbmQgdHhcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgaW5pdFNlbnRUeFdhbGxldChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+LCB0eCwgY29weURlc3RpbmF0aW9ucykge1xuICAgIGlmICghdHgpIHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgbGV0IHJlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgPT09IHRydWU7XG4gICAgdHguc2V0SXNPdXRnb2luZyh0cnVlKTtcbiAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICB0eC5zZXRJblR4UG9vbChyZWxheSk7XG4gICAgdHguc2V0UmVsYXkocmVsYXkpO1xuICAgIHR4LnNldElzUmVsYXllZChyZWxheSk7XG4gICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgdHguc2V0SXNMb2NrZWQodHJ1ZSk7XG4gICAgdHguc2V0UmluZ1NpemUoTW9uZXJvVXRpbHMuUklOR19TSVpFKTtcbiAgICBsZXQgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpO1xuICAgIHRyYW5zZmVyLnNldFR4KHR4KTtcbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAxKSB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kaWNlcyhjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5zbGljZSgwKSk7IC8vIHdlIGtub3cgc3JjIHN1YmFkZHJlc3MgaW5kaWNlcyBpZmYgY29uZmlnIHNwZWNpZmllcyAxXG4gICAgaWYgKGNvcHlEZXN0aW5hdGlvbnMpIHtcbiAgICAgIGxldCBkZXN0Q29waWVzID0gW107XG4gICAgICBmb3IgKGxldCBkZXN0IG9mIGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSkgZGVzdENvcGllcy5wdXNoKGRlc3QuY29weSgpKTtcbiAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhkZXN0Q29waWVzKTtcbiAgICB9XG4gICAgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgdHguc2V0UGF5bWVudElkKGNvbmZpZy5nZXRQYXltZW50SWQoKSk7XG4gICAgaWYgKHR4LmdldFVubG9ja1RpbWUoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRVbmxvY2tUaW1lKDBuKTtcbiAgICBpZiAoY29uZmlnLmdldFJlbGF5KCkpIHtcbiAgICAgIGlmICh0eC5nZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgpID09PSB1bmRlZmluZWQpIHR4LnNldExhc3RSZWxheWVkVGltZXN0YW1wKCtuZXcgRGF0ZSgpLmdldFRpbWUoKSk7ICAvLyBUT0RPIChtb25lcm8td2FsbGV0LXJwYyk6IHByb3ZpZGUgdGltZXN0YW1wIG9uIHJlc3BvbnNlOyB1bmNvbmZpcm1lZCB0aW1lc3RhbXBzIHZhcnlcbiAgICAgIGlmICh0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbigpID09PSB1bmRlZmluZWQpIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKGZhbHNlKTtcbiAgICB9XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSB0eCBzZXQgZnJvbSBhIFJQQyBtYXAgZXhjbHVkaW5nIHR4cy5cbiAgICogXG4gICAqIEBwYXJhbSBycGNNYXAgLSBtYXAgdG8gaW5pdGlhbGl6ZSB0aGUgdHggc2V0IGZyb21cbiAgICogQHJldHVybiBNb25lcm9UeFNldCAtIGluaXRpYWxpemVkIHR4IHNldFxuICAgKiBAcmV0dXJuIHRoZSByZXN1bHRpbmcgdHggc2V0XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFNldChycGNNYXApIHtcbiAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoKTtcbiAgICB0eFNldC5zZXRNdWx0aXNpZ1R4SGV4KHJwY01hcC5tdWx0aXNpZ190eHNldCk7XG4gICAgdHhTZXQuc2V0VW5zaWduZWRUeEhleChycGNNYXAudW5zaWduZWRfdHhzZXQpO1xuICAgIHR4U2V0LnNldFNpZ25lZFR4SGV4KHJwY01hcC5zaWduZWRfdHhzZXQpO1xuICAgIGlmICh0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KCkubGVuZ3RoID09PSAwKSB0eFNldC5zZXRNdWx0aXNpZ1R4SGV4KHVuZGVmaW5lZCk7XG4gICAgaWYgKHR4U2V0LmdldFVuc2lnbmVkVHhIZXgoKSAhPT0gdW5kZWZpbmVkICYmIHR4U2V0LmdldFVuc2lnbmVkVHhIZXgoKS5sZW5ndGggPT09IDApIHR4U2V0LnNldFVuc2lnbmVkVHhIZXgodW5kZWZpbmVkKTtcbiAgICBpZiAodHhTZXQuZ2V0U2lnbmVkVHhIZXgoKSAhPT0gdW5kZWZpbmVkICYmIHR4U2V0LmdldFNpZ25lZFR4SGV4KCkubGVuZ3RoID09PSAwKSB0eFNldC5zZXRTaWduZWRUeEhleCh1bmRlZmluZWQpO1xuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgTW9uZXJvVHhTZXQgZnJvbSBhIGxpc3Qgb2YgcnBjIHR4cy5cbiAgICogXG4gICAqIEBwYXJhbSBycGNUeHMgLSBycGMgdHhzIHRvIGluaXRpYWxpemUgdGhlIHNldCBmcm9tXG4gICAqIEBwYXJhbSB0eHMgLSBleGlzdGluZyB0eHMgdG8gZnVydGhlciBpbml0aWFsaXplIChvcHRpb25hbClcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHRoZSBjb252ZXJ0ZWQgdHggc2V0XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTZW50VHhzVG9UeFNldChycGNUeHM6IGFueSwgdHhzPzogYW55LCBjb25maWc/OiBhbnkpIHtcbiAgICBcbiAgICAvLyBidWlsZCBzaGFyZWQgdHggc2V0XG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFNldChycGNUeHMpO1xuXG4gICAgLy8gZ2V0IG51bWJlciBvZiB0eHNcbiAgICBsZXQgbnVtVHhzID0gcnBjVHhzLmZlZV9saXN0ID8gcnBjVHhzLmZlZV9saXN0Lmxlbmd0aCA6IHJwY1R4cy50eF9oYXNoX2xpc3QgPyBycGNUeHMudHhfaGFzaF9saXN0Lmxlbmd0aCA6IDA7XG4gICAgXG4gICAgLy8gZG9uZSBpZiBycGMgcmVzcG9uc2UgY29udGFpbnMgbm8gdHhzXG4gICAgaWYgKG51bVR4cyA9PT0gMCkge1xuICAgICAgYXNzZXJ0LmVxdWFsKHR4cywgdW5kZWZpbmVkKTtcbiAgICAgIHJldHVybiB0eFNldDtcbiAgICB9XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eHMgaWYgbm9uZSBnaXZlblxuICAgIGlmICh0eHMpIHR4U2V0LnNldFR4cyh0eHMpO1xuICAgIGVsc2Uge1xuICAgICAgdHhzID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVR4czsgaSsrKSB0eHMucHVzaChuZXcgTW9uZXJvVHhXYWxsZXQoKSk7XG4gICAgfVxuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgdHguc2V0VHhTZXQodHhTZXQpO1xuICAgICAgdHguc2V0SXNPdXRnb2luZyh0cnVlKTtcbiAgICB9XG4gICAgdHhTZXQuc2V0VHhzKHR4cyk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eHMgZnJvbSBycGMgbGlzdHNcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVHhzKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1R4c1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJ0eF9oYXNoX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRIYXNoKHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfa2V5X2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRLZXkodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9ibG9iX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRGdWxsSGV4KHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfbWV0YWRhdGFfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldE1ldGFkYXRhKHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRGZWUoQmlnSW50KHZhbFtpXSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndlaWdodF9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0V2VpZ2h0KHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50X2xpc3RcIikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh0eHNbaV0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpID09IHVuZGVmaW5lZCkgdHhzW2ldLnNldE91dGdvaW5nVHJhbnNmZXIobmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eHNbaV0pKTtcbiAgICAgICAgICB0eHNbaV0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFtb3VudChCaWdJbnQodmFsW2ldKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtdWx0aXNpZ190eHNldFwiIHx8IGtleSA9PT0gXCJ1bnNpZ25lZF90eHNldFwiIHx8IGtleSA9PT0gXCJzaWduZWRfdHhzZXRcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGVudF9rZXlfaW1hZ2VzX2xpc3RcIikge1xuICAgICAgICBsZXQgaW5wdXRLZXlJbWFnZXNMaXN0ID0gdmFsO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0S2V5SW1hZ2VzTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUodHhzW2ldLmdldElucHV0cygpID09PSB1bmRlZmluZWQpO1xuICAgICAgICAgIHR4c1tpXS5zZXRJbnB1dHMoW10pO1xuICAgICAgICAgIGZvciAobGV0IGlucHV0S2V5SW1hZ2Ugb2YgaW5wdXRLZXlJbWFnZXNMaXN0W2ldW1wia2V5X2ltYWdlc1wiXSkge1xuICAgICAgICAgICAgdHhzW2ldLmdldElucHV0cygpLnB1c2gobmV3IE1vbmVyb091dHB1dFdhbGxldCgpLnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSgpLnNldEhleChpbnB1dEtleUltYWdlKSkuc2V0VHgodHhzW2ldKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50c19ieV9kZXN0X2xpc3RcIikge1xuICAgICAgICBsZXQgYW1vdW50c0J5RGVzdExpc3QgPSB2YWw7XG4gICAgICAgIGxldCBkZXN0aW5hdGlvbklkeCA9IDA7XG4gICAgICAgIGZvciAobGV0IHR4SWR4ID0gMDsgdHhJZHggPCBhbW91bnRzQnlEZXN0TGlzdC5sZW5ndGg7IHR4SWR4KyspIHtcbiAgICAgICAgICBsZXQgYW1vdW50c0J5RGVzdCA9IGFtb3VudHNCeURlc3RMaXN0W3R4SWR4XVtcImFtb3VudHNcIl07XG4gICAgICAgICAgaWYgKHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpID09PSB1bmRlZmluZWQpIHR4c1t0eElkeF0uc2V0T3V0Z29pbmdUcmFuc2ZlcihuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHR4c1t0eElkeF0pKTtcbiAgICAgICAgICB0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXREZXN0aW5hdGlvbnMoW10pO1xuICAgICAgICAgIGZvciAobGV0IGFtb3VudCBvZiBhbW91bnRzQnlEZXN0KSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCA9PT0gMSkgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudCkpKTsgLy8gc3dlZXBpbmcgY2FuIGNyZWF0ZSBtdWx0aXBsZSB0eHMgd2l0aCBvbmUgYWRkcmVzc1xuICAgICAgICAgICAgZWxzZSB0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKS5wdXNoKG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbZGVzdGluYXRpb25JZHgrK10uZ2V0QWRkcmVzcygpLCBCaWdJbnQoYW1vdW50KSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgdHJhbnNhY3Rpb24gZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydHMgYSBycGMgdHggd2l0aCBhIHRyYW5zZmVyIHRvIGEgdHggc2V0IHdpdGggYSB0eCBhbmQgdHJhbnNmZXIuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHggLSBycGMgdHggdG8gYnVpbGQgZnJvbVxuICAgKiBAcGFyYW0gdHggLSBleGlzdGluZyB0eCB0byBjb250aW51ZSBpbml0aWFsaXppbmcgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gaXNPdXRnb2luZyAtIHNwZWNpZmllcyBpZiB0aGUgdHggaXMgb3V0Z29pbmcgaWYgdHJ1ZSwgaW5jb21pbmcgaWYgZmFsc2UsIG9yIGRlY29kZXMgZnJvbSB0eXBlIGlmIHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4gdGhlIGluaXRpYWxpemVkIHR4IHNldCB3aXRoIGEgdHhcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4VG9UeFNldChycGNUeCwgdHgsIGlzT3V0Z29pbmcsIGNvbmZpZykge1xuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhTZXQocnBjVHgpO1xuICAgIHR4U2V0LnNldFR4cyhbTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlcihycGNUeCwgdHgsIGlzT3V0Z29pbmcsIGNvbmZpZykuc2V0VHhTZXQodHhTZXQpXSk7XG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogQnVpbGRzIGEgTW9uZXJvVHhXYWxsZXQgZnJvbSBhIFJQQyB0eC5cbiAgICogXG4gICAqIEBwYXJhbSBycGNUeCAtIHJwYyB0eCB0byBidWlsZCBmcm9tXG4gICAqIEBwYXJhbSB0eCAtIGV4aXN0aW5nIHR4IHRvIGNvbnRpbnVlIGluaXRpYWxpemluZyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBpc091dGdvaW5nIC0gc3BlY2lmaWVzIGlmIHRoZSB0eCBpcyBvdXRnb2luZyBpZiB0cnVlLCBpbmNvbWluZyBpZiBmYWxzZSwgb3IgZGVjb2RlcyBmcm9tIHR5cGUgaWYgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IGlzIHRoZSBpbml0aWFsaXplZCB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHg6IGFueSwgdHg/OiBhbnksIGlzT3V0Z29pbmc/OiBhbnksIGNvbmZpZz86IGFueSkgeyAgLy8gVE9ETzogY2hhbmdlIGV2ZXJ5dGhpbmcgdG8gc2FmZSBzZXRcbiAgICAgICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCB0byByZXR1cm5cbiAgICBpZiAoIXR4KSB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggc3RhdGUgZnJvbSBycGMgdHlwZVxuICAgIGlmIChycGNUeC50eXBlICE9PSB1bmRlZmluZWQpIGlzT3V0Z29pbmcgPSBNb25lcm9XYWxsZXRScGMuZGVjb2RlUnBjVHlwZShycGNUeC50eXBlLCB0eCk7XG4gICAgZWxzZSBhc3NlcnQuZXF1YWwodHlwZW9mIGlzT3V0Z29pbmcsIFwiYm9vbGVhblwiLCBcIk11c3QgaW5kaWNhdGUgaWYgdHggaXMgb3V0Z29pbmcgKHRydWUpIHhvciBpbmNvbWluZyAoZmFsc2UpIHNpbmNlIHVua25vd25cIik7XG4gICAgXG4gICAgLy8gVE9ETzogc2FmZSBzZXRcbiAgICAvLyBpbml0aWFsaXplIHJlbWFpbmluZyBmaWVsZHMgIFRPRE86IHNlZW1zIHRoaXMgc2hvdWxkIGJlIHBhcnQgb2YgY29tbW9uIGZ1bmN0aW9uIHdpdGggRGFlbW9uUnBjLmNvbnZlcnRScGNUeFxuICAgIGxldCBoZWFkZXI7XG4gICAgbGV0IHRyYW5zZmVyO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUeCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUeFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJ0eGlkXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVcIikgdHguc2V0RmVlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJub3RlXCIpIHsgaWYgKHZhbCkgdHguc2V0Tm90ZSh2YWwpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfa2V5XCIpIHR4LnNldEtleSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR5cGVcIikgeyB9IC8vIHR5cGUgYWxyZWFkeSBoYW5kbGVkXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfc2l6ZVwiKSB0eC5zZXRTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrX3RpbWVcIikgdHguc2V0VW5sb2NrVGltZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndlaWdodFwiKSB0eC5zZXRXZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsb2NrZWRcIikgdHguc2V0SXNMb2NrZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9ibG9iXCIpIHR4LnNldEZ1bGxIZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9tZXRhZGF0YVwiKSB0eC5zZXRNZXRhZGF0YSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRvdWJsZV9zcGVuZF9zZWVuXCIpIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfaGVpZ2h0XCIgfHwga2V5ID09PSBcImhlaWdodFwiKSB7XG4gICAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSB7XG4gICAgICAgICAgaWYgKCFoZWFkZXIpIGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgICAgICAgIGhlYWRlci5zZXRIZWlnaHQodmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRpbWVzdGFtcFwiKSB7XG4gICAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSB7XG4gICAgICAgICAgaWYgKCFoZWFkZXIpIGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgICAgICAgIGhlYWRlci5zZXRUaW1lc3RhbXAodmFsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyB0aW1lc3RhbXAgb2YgdW5jb25maXJtZWQgdHggaXMgY3VycmVudCByZXF1ZXN0IHRpbWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNvbmZpcm1hdGlvbnNcIikgdHguc2V0TnVtQ29uZmlybWF0aW9ucyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1Z2dlc3RlZF9jb25maXJtYXRpb25zX3RocmVzaG9sZFwiKSB7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgaWYgKCFpc091dGdvaW5nKSB0cmFuc2Zlci5zZXROdW1TdWdnZXN0ZWRDb25maXJtYXRpb25zKHZhbCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIHtcbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gKGlzT3V0Z29pbmcgPyBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpIDogbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKSkuc2V0VHgodHgpO1xuICAgICAgICB0cmFuc2Zlci5zZXRBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNcIikge30gIC8vIGlnbm9yaW5nLCBhbW91bnRzIHN1bSB0byBhbW91bnRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzXCIpIHtcbiAgICAgICAgaWYgKCFpc091dGdvaW5nKSB7XG4gICAgICAgICAgaWYgKCF0cmFuc2ZlcikgdHJhbnNmZXIgPSBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpLnNldFR4KHR4KTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRBZGRyZXNzKHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwYXltZW50X2lkXCIpIHtcbiAgICAgICAgaWYgKFwiXCIgIT09IHZhbCAmJiBNb25lcm9UeFdhbGxldC5ERUZBVUxUX1BBWU1FTlRfSUQgIT09IHZhbCkgdHguc2V0UGF5bWVudElkKHZhbCk7ICAvLyBkZWZhdWx0IGlzIHVuZGVmaW5lZFxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1YmFkZHJfaW5kZXhcIikgYXNzZXJ0KHJwY1R4LnN1YmFkZHJfaW5kaWNlcyk7ICAvLyBoYW5kbGVkIGJ5IHN1YmFkZHJfaW5kaWNlc1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1YmFkZHJfaW5kaWNlc1wiKSB7XG4gICAgICAgIGlmICghdHJhbnNmZXIpIHRyYW5zZmVyID0gKGlzT3V0Z29pbmcgPyBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpIDogbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKSkuc2V0VHgodHgpO1xuICAgICAgICBsZXQgcnBjSW5kaWNlcyA9IHZhbDtcbiAgICAgICAgdHJhbnNmZXIuc2V0QWNjb3VudEluZGV4KHJwY0luZGljZXNbMF0ubWFqb3IpO1xuICAgICAgICBpZiAoaXNPdXRnb2luZykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgICAgICAgIGZvciAobGV0IHJwY0luZGV4IG9mIHJwY0luZGljZXMpIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2gocnBjSW5kZXgubWlub3IpO1xuICAgICAgICAgIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhc3NlcnQuZXF1YWwocnBjSW5kaWNlcy5sZW5ndGgsIDEpO1xuICAgICAgICAgIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRleChycGNJbmRpY2VzWzBdLm1pbm9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRlc3RpbmF0aW9uc1wiIHx8IGtleSA9PSBcInJlY2lwaWVudHNcIikge1xuICAgICAgICBhc3NlcnQoaXNPdXRnb2luZyk7XG4gICAgICAgIGxldCBkZXN0aW5hdGlvbnMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgcnBjRGVzdGluYXRpb24gb2YgdmFsKSB7XG4gICAgICAgICAgbGV0IGRlc3RpbmF0aW9uID0gbmV3IE1vbmVyb0Rlc3RpbmF0aW9uKCk7XG4gICAgICAgICAgZGVzdGluYXRpb25zLnB1c2goZGVzdGluYXRpb24pO1xuICAgICAgICAgIGZvciAobGV0IGRlc3RpbmF0aW9uS2V5IG9mIE9iamVjdC5rZXlzKHJwY0Rlc3RpbmF0aW9uKSkge1xuICAgICAgICAgICAgaWYgKGRlc3RpbmF0aW9uS2V5ID09PSBcImFkZHJlc3NcIikgZGVzdGluYXRpb24uc2V0QWRkcmVzcyhycGNEZXN0aW5hdGlvbltkZXN0aW5hdGlvbktleV0pO1xuICAgICAgICAgICAgZWxzZSBpZiAoZGVzdGluYXRpb25LZXkgPT09IFwiYW1vdW50XCIpIGRlc3RpbmF0aW9uLnNldEFtb3VudChCaWdJbnQocnBjRGVzdGluYXRpb25bZGVzdGluYXRpb25LZXldKSk7XG4gICAgICAgICAgICBlbHNlIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlVucmVjb2duaXplZCB0cmFuc2FjdGlvbiBkZXN0aW5hdGlvbiBmaWVsZDogXCIgKyBkZXN0aW5hdGlvbktleSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKHt0eDogdHh9KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKGRlc3RpbmF0aW9ucyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibXVsdGlzaWdfdHhzZXRcIiAmJiB2YWwgIT09IHVuZGVmaW5lZCkge30gLy8gaGFuZGxlZCBlbHNld2hlcmU7IHRoaXMgbWV0aG9kIG9ubHkgYnVpbGRzIGEgdHggd2FsbGV0XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5zaWduZWRfdHhzZXRcIiAmJiB2YWwgIT09IHVuZGVmaW5lZCkge30gLy8gaGFuZGxlZCBlbHNld2hlcmU7IHRoaXMgbWV0aG9kIG9ubHkgYnVpbGRzIGEgdHggd2FsbGV0XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50X2luXCIpIHR4LnNldElucHV0U3VtKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRfb3V0XCIpIHR4LnNldE91dHB1dFN1bShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY2hhbmdlX2FkZHJlc3NcIikgdHguc2V0Q2hhbmdlQWRkcmVzcyh2YWwgPT09IFwiXCIgPyB1bmRlZmluZWQgOiB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNoYW5nZV9hbW91bnRcIikgdHguc2V0Q2hhbmdlQW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkdW1teV9vdXRwdXRzXCIpIHR4LnNldE51bUR1bW15T3V0cHV0cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImV4dHJhXCIpIHR4LnNldEV4dHJhSGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmluZ19zaXplXCIpIHR4LnNldFJpbmdTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlbnRfa2V5X2ltYWdlc1wiKSB7XG4gICAgICAgIGxldCBpbnB1dEtleUltYWdlcyA9IHZhbC5rZXlfaW1hZ2VzO1xuICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR4LmdldElucHV0cygpID09PSB1bmRlZmluZWQpO1xuICAgICAgICB0eC5zZXRJbnB1dHMoW10pO1xuICAgICAgICBmb3IgKGxldCBpbnB1dEtleUltYWdlIG9mIGlucHV0S2V5SW1hZ2VzKSB7XG4gICAgICAgICAgdHguZ2V0SW5wdXRzKCkucHVzaChuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCkuc2V0S2V5SW1hZ2UobmV3IE1vbmVyb0tleUltYWdlKCkuc2V0SGV4KGlucHV0S2V5SW1hZ2UpKS5zZXRUeCh0eCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50c19ieV9kZXN0XCIpIHtcbiAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShpc091dGdvaW5nKTtcbiAgICAgICAgbGV0IGFtb3VudHNCeURlc3QgPSB2YWwuYW1vdW50cztcbiAgICAgICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGgsIGFtb3VudHNCeURlc3QubGVuZ3RoKTtcbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eCk7XG4gICAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhbXSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdHJhbnNmZXIuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpW2ldLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudHNCeURlc3RbaV0pKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHRyYW5zYWN0aW9uIGZpZWxkIHdpdGggdHJhbnNmZXI6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbGluayBibG9jayBhbmQgdHhcbiAgICBpZiAoaGVhZGVyKSB0eC5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soaGVhZGVyKS5zZXRUeHMoW3R4XSkpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgZmluYWwgZmllbGRzXG4gICAgaWYgKHRyYW5zZmVyKSB7XG4gICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICBpZiAoIXRyYW5zZmVyLmdldFR4KCkuZ2V0SXNDb25maXJtZWQoKSkgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICAgIGlmIChpc091dGdvaW5nKSB7XG4gICAgICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpIHtcbiAgICAgICAgICBpZiAodHJhbnNmZXIuZ2V0RGVzdGluYXRpb25zKCkpIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXREZXN0aW5hdGlvbnModW5kZWZpbmVkKTsgLy8gb3ZlcndyaXRlIHRvIGF2b2lkIHJlY29uY2lsZSBlcnJvciBUT0RPOiByZW1vdmUgYWZ0ZXIgPjE4LjMuMSB3aGVuIGFtb3VudHNfYnlfZGVzdCBzdXBwb3J0ZWRcbiAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkubWVyZ2UodHJhbnNmZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0eC5zZXRJc0luY29taW5nKHRydWUpO1xuICAgICAgICB0eC5zZXRJbmNvbWluZ1RyYW5zZmVycyhbdHJhbnNmZXJdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gcmV0dXJuIGluaXRpYWxpemVkIHRyYW5zYWN0aW9uXG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFdhbGxldFdpdGhPdXRwdXQocnBjT3V0cHV0KSB7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eFxuICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBvdXRwdXRcbiAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCh7dHg6IHR4fSk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY091dHB1dCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNPdXRwdXRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIG91dHB1dC5zZXRBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50XCIpIG91dHB1dC5zZXRJc1NwZW50KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwia2V5X2ltYWdlXCIpIHsgaWYgKFwiXCIgIT09IHZhbCkgb3V0cHV0LnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSh2YWwpKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImdsb2JhbF9pbmRleFwiKSBvdXRwdXQuc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZFwiKSB0eC5zZXRJc0xvY2tlZCghdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmcm96ZW5cIikgb3V0cHV0LnNldElzRnJvemVuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHVia2V5XCIpIG91dHB1dC5zZXRTdGVhbHRoUHVibGljS2V5KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRleFwiKSB7XG4gICAgICAgIG91dHB1dC5zZXRBY2NvdW50SW5kZXgodmFsLm1ham9yKTtcbiAgICAgICAgb3V0cHV0LnNldFN1YmFkZHJlc3NJbmRleCh2YWwubWlub3IpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiKSB0eC5zZXRCbG9jaygobmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KHZhbCkgYXMgTW9uZXJvQmxvY2spLnNldFR4cyhbdHggYXMgTW9uZXJvVHhdKSk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHdpdGggb3V0cHV0XG4gICAgdHguc2V0T3V0cHV0cyhbb3V0cHV0XSk7XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNEZXNjcmliZVRyYW5zZmVyKHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQpIHtcbiAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImRlc2NcIikge1xuICAgICAgICB0eFNldC5zZXRUeHMoW10pO1xuICAgICAgICBmb3IgKGxldCB0eE1hcCBvZiB2YWwpIHtcbiAgICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHR4TWFwLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgIHR4LnNldFR4U2V0KHR4U2V0KTtcbiAgICAgICAgICB0eFNldC5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1bW1hcnlcIikgeyB9IC8vIFRPRE86IHN1cHBvcnQgdHggc2V0IHN1bW1hcnkgZmllbGRzP1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZGVzY2RyaWJlIHRyYW5zZmVyIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlY29kZXMgYSBcInR5cGVcIiBmcm9tIG1vbmVyby13YWxsZXQtcnBjIHRvIGluaXRpYWxpemUgdHlwZSBhbmQgc3RhdGVcbiAgICogZmllbGRzIGluIHRoZSBnaXZlbiB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIFRPRE86IHRoZXNlIHNob3VsZCBiZSBzYWZlIHNldFxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R5cGUgaXMgdGhlIHR5cGUgdG8gZGVjb2RlXG4gICAqIEBwYXJhbSB0eCBpcyB0aGUgdHJhbnNhY3Rpb24gdG8gZGVjb2RlIGtub3duIGZpZWxkcyB0b1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBycGMgdHlwZSBpbmRpY2F0ZXMgb3V0Z29pbmcgeG9yIGluY29taW5nXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGRlY29kZVJwY1R5cGUocnBjVHlwZSwgdHgpIHtcbiAgICBsZXQgaXNPdXRnb2luZztcbiAgICBpZiAocnBjVHlwZSA9PT0gXCJpblwiKSB7XG4gICAgICBpc091dGdvaW5nID0gZmFsc2U7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwib3V0XCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBvb2xcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7ICAvLyBUT0RPOiBidXQgY291bGQgaXQgYmU/XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBlbmRpbmdcIikge1xuICAgICAgaXNPdXRnb2luZyA9IHRydWU7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiYmxvY2tcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeCh0cnVlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiZmFpbGVkXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNmZXIgdHlwZTogXCIgKyBycGNUeXBlKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzT3V0Z29pbmc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNZXJnZXMgYSB0cmFuc2FjdGlvbiBpbnRvIGEgdW5pcXVlIHNldCBvZiB0cmFuc2FjdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhXYWxsZXR9IHR4IC0gdGhlIHRyYW5zYWN0aW9uIHRvIG1lcmdlIGludG8gdGhlIGV4aXN0aW5nIHR4c1xuICAgKiBAcGFyYW0ge09iamVjdH0gdHhNYXAgLSBtYXBzIHR4IGhhc2hlcyB0byB0eHNcbiAgICogQHBhcmFtIHtPYmplY3R9IGJsb2NrTWFwIC0gbWFwcyBibG9jayBoZWlnaHRzIHRvIGJsb2Nrc1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBtZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApIHtcbiAgICBhc3NlcnQodHguZ2V0SGFzaCgpICE9PSB1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIG1lcmdlIHR4XG4gICAgbGV0IGFUeCA9IHR4TWFwW3R4LmdldEhhc2goKV07XG4gICAgaWYgKGFUeCA9PT0gdW5kZWZpbmVkKSB0eE1hcFt0eC5nZXRIYXNoKCldID0gdHg7IC8vIGNhY2hlIG5ldyB0eFxuICAgIGVsc2UgYVR4Lm1lcmdlKHR4KTsgLy8gbWVyZ2Ugd2l0aCBleGlzdGluZyB0eFxuICAgIFxuICAgIC8vIG1lcmdlIHR4J3MgYmxvY2sgaWYgY29uZmlybWVkXG4gICAgaWYgKHR4LmdldEhlaWdodCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBhQmxvY2sgPSBibG9ja01hcFt0eC5nZXRIZWlnaHQoKV07XG4gICAgICBpZiAoYUJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrTWFwW3R4LmdldEhlaWdodCgpXSA9IHR4LmdldEJsb2NrKCk7IC8vIGNhY2hlIG5ldyBibG9ja1xuICAgICAgZWxzZSBhQmxvY2subWVyZ2UodHguZ2V0QmxvY2soKSk7IC8vIG1lcmdlIHdpdGggZXhpc3RpbmcgYmxvY2tcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNhY3Rpb25zIGJ5IHRoZWlyIGhlaWdodC5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29tcGFyZVR4c0J5SGVpZ2h0KHR4MSwgdHgyKSB7XG4gICAgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4Mi5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMDsgLy8gYm90aCB1bmNvbmZpcm1lZFxuICAgIGVsc2UgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMTsgICAvLyB0eDEgaXMgdW5jb25maXJtZWRcbiAgICBlbHNlIGlmICh0eDIuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIC0xOyAgLy8gdHgyIGlzIHVuY29uZmlybWVkXG4gICAgbGV0IGRpZmYgPSB0eDEuZ2V0SGVpZ2h0KCkgLSB0eDIuZ2V0SGVpZ2h0KCk7XG4gICAgaWYgKGRpZmYgIT09IDApIHJldHVybiBkaWZmO1xuICAgIHJldHVybiB0eDEuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4MSkgLSB0eDIuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4Mik7IC8vIHR4cyBhcmUgaW4gdGhlIHNhbWUgYmxvY2sgc28gcmV0YWluIHRoZWlyIG9yaWdpbmFsIG9yZGVyXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNmZXJzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBzdGF0aWMgY29tcGFyZUluY29taW5nVHJhbnNmZXJzKHQxLCB0Mikge1xuICAgIGlmICh0MS5nZXRBY2NvdW50SW5kZXgoKSA8IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gLTE7XG4gICAgZWxzZSBpZiAodDEuZ2V0QWNjb3VudEluZGV4KCkgPT09IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gdDEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSB0Mi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICByZXR1cm4gMTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byBvdXRwdXRzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbXBhcmVPdXRwdXRzKG8xLCBvMikge1xuICAgIFxuICAgIC8vIGNvbXBhcmUgYnkgaGVpZ2h0XG4gICAgbGV0IGhlaWdodENvbXBhcmlzb24gPSBNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KG8xLmdldFR4KCksIG8yLmdldFR4KCkpO1xuICAgIGlmIChoZWlnaHRDb21wYXJpc29uICE9PSAwKSByZXR1cm4gaGVpZ2h0Q29tcGFyaXNvbjtcbiAgICBcbiAgICAvLyBjb21wYXJlIGJ5IGFjY291bnQgaW5kZXgsIHN1YmFkZHJlc3MgaW5kZXgsIG91dHB1dCBpbmRleCwgdGhlbiBrZXkgaW1hZ2UgaGV4XG4gICAgbGV0IGNvbXBhcmUgPSBvMS5nZXRBY2NvdW50SW5kZXgoKSAtIG8yLmdldEFjY291bnRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICBjb21wYXJlID0gbzEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSBvMi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICBpZiAoY29tcGFyZSAhPT0gMCkgcmV0dXJuIGNvbXBhcmU7XG4gICAgY29tcGFyZSA9IG8xLmdldEluZGV4KCkgLSBvMi5nZXRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICByZXR1cm4gbzEuZ2V0S2V5SW1hZ2UoKS5nZXRIZXgoKS5sb2NhbGVDb21wYXJlKG8yLmdldEtleUltYWdlKCkuZ2V0SGV4KCkpO1xuICB9XG59XG5cbi8qKlxuICogUG9sbHMgbW9uZXJvLXdhbGxldC1ycGMgdG8gcHJvdmlkZSBsaXN0ZW5lciBub3RpZmljYXRpb25zLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRQb2xsZXIge1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBpc1BvbGxpbmc6IGJvb2xlYW47XG4gIHByb3RlY3RlZCB3YWxsZXQ6IE1vbmVyb1dhbGxldFJwYztcbiAgcHJvdGVjdGVkIGxvb3BlcjogVGFza0xvb3BlcjtcbiAgcHJvdGVjdGVkIHByZXZMb2NrZWRUeHM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZDb25maXJtZWROb3RpZmljYXRpb25zOiBhbnk7XG4gIHByb3RlY3RlZCB0aHJlYWRQb29sOiBhbnk7XG4gIHByb3RlY3RlZCBudW1Qb2xsaW5nOiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2SGVpZ2h0OiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2QmFsYW5jZXM6IGFueTtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICB0aGlzLndhbGxldCA9IHdhbGxldDtcbiAgICB0aGlzLmxvb3BlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jIGZ1bmN0aW9uKCkgeyBhd2FpdCB0aGF0LnBvbGwoKTsgfSk7XG4gICAgdGhpcy5wcmV2TG9ja2VkVHhzID0gW107XG4gICAgdGhpcy5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zID0gbmV3IFNldCgpOyAvLyB0eCBoYXNoZXMgb2YgcHJldmlvdXMgbm90aWZpY2F0aW9uc1xuICAgIHRoaXMucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMgPSBuZXcgU2V0KCk7IC8vIHR4IGhhc2hlcyBvZiBwcmV2aW91c2x5IGNvbmZpcm1lZCBidXQgbm90IHlldCB1bmxvY2tlZCBub3RpZmljYXRpb25zXG4gICAgdGhpcy50aHJlYWRQb29sID0gbmV3IFRocmVhZFBvb2woMSk7IC8vIHN5bmNocm9uaXplIHBvbGxzXG4gICAgdGhpcy5udW1Qb2xsaW5nID0gMDtcbiAgfVxuICBcbiAgc2V0SXNQb2xsaW5nKGlzUG9sbGluZykge1xuICAgIHRoaXMuaXNQb2xsaW5nID0gaXNQb2xsaW5nO1xuICAgIGlmIChpc1BvbGxpbmcpIHRoaXMubG9vcGVyLnN0YXJ0KHRoaXMud2FsbGV0LmdldFN5bmNQZXJpb2RJbk1zKCkpO1xuICAgIGVsc2UgdGhpcy5sb29wZXIuc3RvcCgpO1xuICB9XG4gIFxuICBzZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpIHtcbiAgICB0aGlzLmxvb3Blci5zZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpO1xuICB9XG4gIFxuICBhc3luYyBwb2xsKCkge1xuXG4gICAgLy8gc2tpcCBpZiBuZXh0IHBvbGwgaXMgcXVldWVkXG4gICAgaWYgKHRoaXMubnVtUG9sbGluZyA+IDEpIHJldHVybjtcbiAgICB0aGlzLm51bVBvbGxpbmcrKztcbiAgICBcbiAgICAvLyBzeW5jaHJvbml6ZSBwb2xsc1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICByZXR1cm4gdGhpcy50aHJlYWRQb29sLnN1Ym1pdChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIFxuICAgICAgICAvLyBza2lwIGlmIHdhbGxldCBpcyBjbG9zZWRcbiAgICAgICAgaWYgKGF3YWl0IHRoYXQud2FsbGV0LmlzQ2xvc2VkKCkpIHtcbiAgICAgICAgICB0aGF0Lm51bVBvbGxpbmctLTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHRha2UgaW5pdGlhbCBzbmFwc2hvdFxuICAgICAgICBpZiAodGhhdC5wcmV2QmFsYW5jZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEhlaWdodCgpO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpKTtcbiAgICAgICAgICB0aGF0LnByZXZCYWxhbmNlcyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBoZWlnaHQgY2hhbmdlc1xuICAgICAgICBsZXQgaGVpZ2h0ID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0SGVpZ2h0KCk7XG4gICAgICAgIGlmICh0aGF0LnByZXZIZWlnaHQgIT09IGhlaWdodCkge1xuICAgICAgICAgIGZvciAobGV0IGkgPSB0aGF0LnByZXZIZWlnaHQ7IGkgPCBoZWlnaHQ7IGkrKykgYXdhaXQgdGhhdC5vbk5ld0Jsb2NrKGkpO1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gZ2V0IGxvY2tlZCB0eHMgZm9yIGNvbXBhcmlzb24gdG8gcHJldmlvdXNcbiAgICAgICAgbGV0IG1pbkhlaWdodCA9IE1hdGgubWF4KDAsIGhlaWdodCAtIDcwKTsgLy8gb25seSBtb25pdG9yIHJlY2VudCB0eHNcbiAgICAgICAgbGV0IGxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEluY2x1ZGVPdXRwdXRzKHRydWUpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbGxlY3QgaGFzaGVzIG9mIHR4cyBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCBub0xvbmdlckxvY2tlZEhhc2hlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBwcmV2TG9ja2VkVHggb2YgdGhhdC5wcmV2TG9ja2VkVHhzKSB7XG4gICAgICAgICAgaWYgKHRoYXQuZ2V0VHgobG9ja2VkVHhzLCBwcmV2TG9ja2VkVHguZ2V0SGFzaCgpKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBub0xvbmdlckxvY2tlZEhhc2hlcy5wdXNoKHByZXZMb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gc2F2ZSBsb2NrZWQgdHhzIGZvciBuZXh0IGNvbXBhcmlzb25cbiAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzID0gbG9ja2VkVHhzO1xuICAgICAgICBcbiAgICAgICAgLy8gZmV0Y2ggdHhzIHdoaWNoIGFyZSBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCB1bmxvY2tlZFR4cyA9IG5vTG9uZ2VyTG9ja2VkSGFzaGVzLmxlbmd0aCA9PT0gMCA/IFtdIDogYXdhaXQgdGhhdC53YWxsZXQuZ2V0VHhzKG5ldyBNb25lcm9UeFF1ZXJ5KCkuc2V0SXNMb2NrZWQoZmFsc2UpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEhhc2hlcyhub0xvbmdlckxvY2tlZEhhc2hlcykuc2V0SW5jbHVkZU91dHB1dHModHJ1ZSkpO1xuICAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIG5ldyB1bmNvbmZpcm1lZCBhbmQgY29uZmlybWVkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgbG9ja2VkVHggb2YgbG9ja2VkVHhzKSB7XG4gICAgICAgICAgbGV0IHNlYXJjaFNldCA9IGxvY2tlZFR4LmdldElzQ29uZmlybWVkKCkgPyB0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zIDogdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zO1xuICAgICAgICAgIGxldCB1bmFubm91bmNlZCA9ICFzZWFyY2hTZXQuaGFzKGxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgc2VhcmNoU2V0LmFkZChsb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIGlmICh1bmFubm91bmNlZCkgYXdhaXQgdGhhdC5ub3RpZnlPdXRwdXRzKGxvY2tlZFR4KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgbmV3IHVubG9ja2VkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgdW5sb2NrZWRUeCBvZiB1bmxvY2tlZFR4cykge1xuICAgICAgICAgIHRoYXQucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucy5kZWxldGUodW5sb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIHRoYXQucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMuZGVsZXRlKHVubG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHModW5sb2NrZWRUeCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIGJhbGFuY2UgY2hhbmdlc1xuICAgICAgICBhd2FpdCB0aGF0LmNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzKCk7XG4gICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gYmFja2dyb3VuZCBwb2xsIHdhbGxldCAnXCIgKyBhd2FpdCB0aGF0LndhbGxldC5nZXRQYXRoKCkgKyBcIic6IFwiICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgb25OZXdCbG9jayhoZWlnaHQpIHtcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU5ld0Jsb2NrKGhlaWdodCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBub3RpZnlPdXRwdXRzKHR4KSB7XG4gIFxuICAgIC8vIG5vdGlmeSBzcGVudCBvdXRwdXRzIC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogbW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgYWxsb3cgc2NyYXBlIG9mIHR4IGlucHV0cyBzbyBwcm92aWRpbmcgb25lIGlucHV0IHdpdGggb3V0Z29pbmcgYW1vdW50XG4gICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQodHguZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCgpXG4gICAgICAgICAgLnNldEFtb3VudCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkgKyB0eC5nZXRGZWUoKSlcbiAgICAgICAgICAuc2V0QWNjb3VudEluZGV4KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBY2NvdW50SW5kZXgoKSlcbiAgICAgICAgICAuc2V0U3ViYWRkcmVzc0luZGV4KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSA/IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpWzBdIDogdW5kZWZpbmVkKSAvLyBpbml0aWFsaXplIGlmIHRyYW5zZmVyIHNvdXJjZWQgZnJvbSBzaW5nbGUgc3ViYWRkcmVzc1xuICAgICAgICAgIC5zZXRUeCh0eCk7XG4gICAgICB0eC5zZXRJbnB1dHMoW291dHB1dF0pO1xuICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRTcGVudChvdXRwdXQpO1xuICAgIH1cbiAgICBcbiAgICAvLyBub3RpZnkgcmVjZWl2ZWQgb3V0cHV0c1xuICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRPdXRwdXRzKCkubGVuZ3RoID4gMCkgeyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG91dHB1dHMgb25seSByZXR1cm5lZCBmb3IgY29uZmlybWVkIHR4c1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgeyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGFsbG93IHNjcmFwZSBvZiB1bmNvbmZpcm1lZCByZWNlaXZlZCBvdXRwdXRzIHNvIHVzaW5nIGluY29taW5nIHRyYW5zZmVyIHZhbHVlc1xuICAgICAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB7XG4gICAgICAgICAgb3V0cHV0cy5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKVxuICAgICAgICAgICAgICAuc2V0QWNjb3VudEluZGV4KHRyYW5zZmVyLmdldEFjY291bnRJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0U3ViYWRkcmVzc0luZGV4KHRyYW5zZmVyLmdldFN1YmFkZHJlc3NJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0QW1vdW50KHRyYW5zZmVyLmdldEFtb3VudCgpKVxuICAgICAgICAgICAgICAuc2V0VHgodHgpKTtcbiAgICAgICAgfVxuICAgICAgICB0eC5zZXRPdXRwdXRzKG91dHB1dHMpO1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgZ2V0VHgodHhzLCB0eEhhc2gpIHtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIGlmICh0eEhhc2ggPT09IHR4LmdldEhhc2goKSkgcmV0dXJuIHR4O1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjaGVja0ZvckNoYW5nZWRCYWxhbmNlcygpIHtcbiAgICBsZXQgYmFsYW5jZXMgPSBhd2FpdCB0aGlzLndhbGxldC5nZXRCYWxhbmNlcygpO1xuICAgIGlmIChiYWxhbmNlc1swXSAhPT0gdGhpcy5wcmV2QmFsYW5jZXNbMF0gfHwgYmFsYW5jZXNbMV0gIT09IHRoaXMucHJldkJhbGFuY2VzWzFdKSB7XG4gICAgICB0aGlzLnByZXZCYWxhbmNlcyA9IGJhbGFuY2VzO1xuICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQoYmFsYW5jZXNbMF0sIGJhbGFuY2VzWzFdKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGFBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFdBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLGNBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLGlCQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSx1QkFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sWUFBQSxHQUFBUixzQkFB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