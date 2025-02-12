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
    if (err.message === "Cannot create wallet. Already exists.") throw new _MoneroRpcError.default("Wallet already exists: " + name, err.getCode(), err.getRpcMethod(), err.getRpcParams());
    if (err.message === "Electrum-style word list failed verification") throw new _MoneroRpcError.default("Invalid mnemonic", err.getCode(), err.getRpcMethod(), err.getRpcParams());
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
      tx.setIsRelayed(true);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiTW9uZXJvV2FsbGV0UnBjIiwiTW9uZXJvV2FsbGV0IiwiREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwiYWRkcmVzc0NhY2hlIiwic3luY1BlcmlvZEluTXMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRTZXJ2ZXIiLCJvcGVuV2FsbGV0IiwicGF0aE9yQ29uZmlnIiwicGFzc3dvcmQiLCJNb25lcm9XYWxsZXRDb25maWciLCJwYXRoIiwiZ2V0UGF0aCIsInNlbmRKc29uUmVxdWVzdCIsImZpbGVuYW1lIiwiZ2V0UGFzc3dvcmQiLCJjbGVhciIsImdldENvbm5lY3Rpb25NYW5hZ2VyIiwic2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJzZXREYWVtb25Db25uZWN0aW9uIiwiY3JlYXRlV2FsbGV0IiwiY29uZmlnTm9ybWFsaXplZCIsImdldFNlZWQiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0TmV0d29ya1R5cGUiLCJnZXRBY2NvdW50TG9va2FoZWFkIiwiZ2V0U3ViYWRkcmVzc0xvb2thaGVhZCIsInNldFBhc3N3b3JkIiwic2V0U2VydmVyIiwiZ2V0Q29ubmVjdGlvbiIsImNyZWF0ZVdhbGxldEZyb21TZWVkIiwiY3JlYXRlV2FsbGV0RnJvbUtleXMiLCJjcmVhdGVXYWxsZXRSYW5kb20iLCJnZXRTZWVkT2Zmc2V0IiwiZ2V0UmVzdG9yZUhlaWdodCIsImdldFNhdmVDdXJyZW50IiwiZ2V0TGFuZ3VhZ2UiLCJzZXRMYW5ndWFnZSIsIkRFRkFVTFRfTEFOR1VBR0UiLCJwYXJhbXMiLCJsYW5ndWFnZSIsImVyciIsImhhbmRsZUNyZWF0ZVdhbGxldEVycm9yIiwic2VlZCIsInNlZWRfb2Zmc2V0IiwiZW5hYmxlX211bHRpc2lnX2V4cGVyaW1lbnRhbCIsImdldElzTXVsdGlzaWciLCJyZXN0b3JlX2hlaWdodCIsImF1dG9zYXZlX2N1cnJlbnQiLCJzZXRSZXN0b3JlSGVpZ2h0IiwiYWRkcmVzcyIsInZpZXdrZXkiLCJzcGVuZGtleSIsIm5hbWUiLCJtZXNzYWdlIiwiTW9uZXJvUnBjRXJyb3IiLCJnZXRDb2RlIiwiZ2V0UnBjTWV0aG9kIiwiZ2V0UnBjUGFyYW1zIiwiaXNWaWV3T25seSIsImtleV90eXBlIiwiZSIsInVyaU9yQ29ubmVjdGlvbiIsImlzVHJ1c3RlZCIsInNzbE9wdGlvbnMiLCJjb25uZWN0aW9uIiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIlNzbE9wdGlvbnMiLCJnZXRVcmkiLCJ1c2VybmFtZSIsImdldFVzZXJuYW1lIiwidHJ1c3RlZCIsInNzbF9zdXBwb3J0Iiwic3NsX3ByaXZhdGVfa2V5X3BhdGgiLCJnZXRQcml2YXRlS2V5UGF0aCIsInNzbF9jZXJ0aWZpY2F0ZV9wYXRoIiwiZ2V0Q2VydGlmaWNhdGVQYXRoIiwic3NsX2NhX2ZpbGUiLCJnZXRDZXJ0aWZpY2F0ZUF1dGhvcml0eUZpbGUiLCJzc2xfYWxsb3dlZF9maW5nZXJwcmludHMiLCJnZXRBbGxvd2VkRmluZ2VycHJpbnRzIiwic3NsX2FsbG93X2FueV9jZXJ0IiwiZ2V0QWxsb3dBbnlDZXJ0IiwiZGFlbW9uQ29ubmVjdGlvbiIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJnZXRCYWxhbmNlcyIsImFjY291bnRJZHgiLCJzdWJhZGRyZXNzSWR4IiwiYXNzZXJ0IiwiZXF1YWwiLCJiYWxhbmNlIiwiQmlnSW50IiwidW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudCIsImdldEFjY291bnRzIiwiZ2V0QmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsImFjY291bnRfaW5kZXgiLCJhZGRyZXNzX2luZGljZXMiLCJyZXNwIiwicmVzdWx0IiwidW5sb2NrZWRfYmFsYW5jZSIsInBlcl9zdWJhZGRyZXNzIiwiYWRkTGlzdGVuZXIiLCJyZWZyZXNoTGlzdGVuaW5nIiwiaXNDb25uZWN0ZWRUb0RhZW1vbiIsImNoZWNrUmVzZXJ2ZVByb29mIiwiaW5kZXhPZiIsImdldFZlcnNpb24iLCJNb25lcm9WZXJzaW9uIiwidmVyc2lvbiIsInJlbGVhc2UiLCJnZXRTZWVkTGFuZ3VhZ2UiLCJnZXRTZWVkTGFuZ3VhZ2VzIiwibGFuZ3VhZ2VzIiwiZ2V0QWRkcmVzcyIsInN1YmFkZHJlc3NNYXAiLCJnZXRTdWJhZGRyZXNzZXMiLCJnZXRBZGRyZXNzSW5kZXgiLCJzdWJhZGRyZXNzIiwiTW9uZXJvU3ViYWRkcmVzcyIsInNldEFjY291bnRJbmRleCIsImluZGV4IiwibWFqb3IiLCJzZXRJbmRleCIsIm1pbm9yIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJpbnRlZ3JhdGVkQWRkcmVzc1N0ciIsInN0YW5kYXJkX2FkZHJlc3MiLCJwYXltZW50X2lkIiwiaW50ZWdyYXRlZF9hZGRyZXNzIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbmNsdWRlcyIsImludGVncmF0ZWRBZGRyZXNzIiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJzZXRTdGFuZGFyZEFkZHJlc3MiLCJzZXRQYXltZW50SWQiLCJzZXRJbnRlZ3JhdGVkQWRkcmVzcyIsImdldEhlaWdodCIsImhlaWdodCIsImdldERhZW1vbkhlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsInN5bmMiLCJsaXN0ZW5lck9yU3RhcnRIZWlnaHQiLCJzdGFydEhlaWdodCIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwic3RhcnRfaGVpZ2h0IiwicG9sbCIsIk1vbmVyb1N5bmNSZXN1bHQiLCJibG9ja3NfZmV0Y2hlZCIsInJlY2VpdmVkX21vbmV5Iiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluU2Vjb25kcyIsIk1hdGgiLCJyb3VuZCIsImVuYWJsZSIsInBlcmlvZCIsIndhbGxldFBvbGxlciIsInNldFBlcmlvZEluTXMiLCJnZXRTeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwibGVuZ3RoIiwidHhpZHMiLCJyZXNjYW5TcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwic2tpcEJhbGFuY2VzIiwiYWNjb3VudHMiLCJycGNBY2NvdW50Iiwic3ViYWRkcmVzc19hY2NvdW50cyIsImNvbnZlcnRScGNBY2NvdW50Iiwic2V0U3ViYWRkcmVzc2VzIiwiZ2V0SW5kZXgiLCJwdXNoIiwic2V0QmFsYW5jZSIsInNldFVubG9ja2VkQmFsYW5jZSIsInNldE51bVVuc3BlbnRPdXRwdXRzIiwic2V0TnVtQmxvY2tzVG9VbmxvY2siLCJhbGxfYWNjb3VudHMiLCJycGNTdWJhZGRyZXNzIiwiY29udmVydFJwY1N1YmFkZHJlc3MiLCJnZXRBY2NvdW50SW5kZXgiLCJ0Z3RTdWJhZGRyZXNzIiwiZ2V0TnVtVW5zcGVudE91dHB1dHMiLCJnZXRBY2NvdW50IiwiRXJyb3IiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJNb25lcm9BY2NvdW50IiwicHJpbWFyeUFkZHJlc3MiLCJzdWJhZGRyZXNzSW5kaWNlcyIsImFkZHJlc3NfaW5kZXgiLCJsaXN0aWZ5Iiwic3ViYWRkcmVzc2VzIiwiYWRkcmVzc2VzIiwiZ2V0TnVtQmxvY2tzVG9VbmxvY2siLCJnZXRTdWJhZGRyZXNzIiwiY3JlYXRlU3ViYWRkcmVzcyIsInNldEFkZHJlc3MiLCJzZXRMYWJlbCIsInNldElzVXNlZCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwicXVlcnlOb3JtYWxpemVkIiwibm9ybWFsaXplVHhRdWVyeSIsInRyYW5zZmVyUXVlcnkiLCJnZXRUcmFuc2ZlclF1ZXJ5IiwiaW5wdXRRdWVyeSIsImdldElucHV0UXVlcnkiLCJvdXRwdXRRdWVyeSIsImdldE91dHB1dFF1ZXJ5Iiwic2V0VHJhbnNmZXJRdWVyeSIsInNldElucHV0UXVlcnkiLCJzZXRPdXRwdXRRdWVyeSIsInRyYW5zZmVycyIsImdldFRyYW5zZmVyc0F1eCIsIk1vbmVyb1RyYW5zZmVyUXVlcnkiLCJzZXRUeFF1ZXJ5IiwiZGVjb250ZXh0dWFsaXplIiwiY29weSIsInR4cyIsInR4c1NldCIsIlNldCIsInRyYW5zZmVyIiwiZ2V0VHgiLCJhZGQiLCJ0eE1hcCIsImJsb2NrTWFwIiwidHgiLCJtZXJnZVR4IiwiZ2V0SW5jbHVkZU91dHB1dHMiLCJvdXRwdXRRdWVyeUF1eCIsIk1vbmVyb091dHB1dFF1ZXJ5Iiwib3V0cHV0cyIsImdldE91dHB1dHNBdXgiLCJvdXRwdXRUeHMiLCJvdXRwdXQiLCJ0eHNRdWVyaWVkIiwibWVldHNDcml0ZXJpYSIsImdldEJsb2NrIiwic3BsaWNlIiwiZ2V0SXNDb25maXJtZWQiLCJjb25zb2xlIiwiZXJyb3IiLCJnZXRIYXNoZXMiLCJ0eHNCeUlkIiwiTWFwIiwiZ2V0SGFzaCIsIm9yZGVyZWRUeHMiLCJoYXNoIiwiZ2V0VHJhbnNmZXJzIiwibm9ybWFsaXplVHJhbnNmZXJRdWVyeSIsImlzQ29udGV4dHVhbCIsImdldFR4UXVlcnkiLCJmaWx0ZXJUcmFuc2ZlcnMiLCJnZXRPdXRwdXRzIiwibm9ybWFsaXplT3V0cHV0UXVlcnkiLCJmaWx0ZXJPdXRwdXRzIiwiZXhwb3J0T3V0cHV0cyIsImFsbCIsIm91dHB1dHNfZGF0YV9oZXgiLCJpbXBvcnRPdXRwdXRzIiwib3V0cHV0c0hleCIsIm51bV9pbXBvcnRlZCIsImV4cG9ydEtleUltYWdlcyIsInJwY0V4cG9ydEtleUltYWdlcyIsImltcG9ydEtleUltYWdlcyIsImtleUltYWdlcyIsInJwY0tleUltYWdlcyIsIm1hcCIsImtleUltYWdlIiwia2V5X2ltYWdlIiwiZ2V0SGV4Iiwic2lnbmF0dXJlIiwiZ2V0U2lnbmF0dXJlIiwic2lnbmVkX2tleV9pbWFnZXMiLCJpbXBvcnRSZXN1bHQiLCJNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsInNldEhlaWdodCIsInNldFNwZW50QW1vdW50Iiwic3BlbnQiLCJzZXRVbnNwZW50QW1vdW50IiwidW5zcGVudCIsImdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0IiwiZnJlZXplT3V0cHV0IiwidGhhd091dHB1dCIsImlzT3V0cHV0RnJvemVuIiwiZnJvemVuIiwiZ2V0RGVmYXVsdEZlZVByaW9yaXR5IiwicHJpb3JpdHkiLCJjcmVhdGVUeHMiLCJub3JtYWxpemVDcmVhdGVUeHNDb25maWciLCJnZXRDYW5TcGxpdCIsInNldENhblNwbGl0IiwiZ2V0UmVsYXkiLCJpc011bHRpc2lnIiwiZ2V0U3ViYWRkcmVzc0luZGljZXMiLCJzbGljZSIsImRlc3RpbmF0aW9ucyIsImRlc3RpbmF0aW9uIiwiZ2V0RGVzdGluYXRpb25zIiwiZ2V0QW1vdW50IiwiYW1vdW50IiwidG9TdHJpbmciLCJnZXRTdWJ0cmFjdEZlZUZyb20iLCJzdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzIiwic3ViYWRkcl9pbmRpY2VzIiwiZ2V0UGF5bWVudElkIiwiZG9fbm90X3JlbGF5IiwiZ2V0UHJpb3JpdHkiLCJnZXRfdHhfaGV4IiwiZ2V0X3R4X21ldGFkYXRhIiwiZ2V0X3R4X2tleXMiLCJnZXRfdHhfa2V5IiwibnVtVHhzIiwiZmVlX2xpc3QiLCJmZWUiLCJjb3B5RGVzdGluYXRpb25zIiwiaSIsIk1vbmVyb1R4V2FsbGV0IiwiaW5pdFNlbnRUeFdhbGxldCIsImdldE91dGdvaW5nVHJhbnNmZXIiLCJzZXRTdWJhZGRyZXNzSW5kaWNlcyIsImNvbnZlcnRScGNTZW50VHhzVG9UeFNldCIsImNvbnZlcnRScGNUeFRvVHhTZXQiLCJzd2VlcE91dHB1dCIsIm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnIiwiZ2V0S2V5SW1hZ2UiLCJzZXRBbW91bnQiLCJzd2VlcFVubG9ja2VkIiwibm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyIsImluZGljZXMiLCJrZXlzIiwic2V0U3dlZXBFYWNoU3ViYWRkcmVzcyIsImdldFN3ZWVwRWFjaFN1YmFkZHJlc3MiLCJycGNTd2VlcEFjY291bnQiLCJzd2VlcER1c3QiLCJyZWxheSIsInR4U2V0Iiwic2V0SXNSZWxheWVkIiwic2V0SW5UeFBvb2wiLCJnZXRJc1JlbGF5ZWQiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiQXJyYXkiLCJpc0FycmF5IiwidHhPck1ldGFkYXRhIiwibWV0YWRhdGEiLCJnZXRNZXRhZGF0YSIsImhleCIsInR4X2hhc2giLCJkZXNjcmliZVR4U2V0IiwidW5zaWduZWRfdHhzZXQiLCJnZXRVbnNpZ25lZFR4SGV4IiwibXVsdGlzaWdfdHhzZXQiLCJnZXRNdWx0aXNpZ1R4SGV4IiwiY29udmVydFJwY0Rlc2NyaWJlVHJhbnNmZXIiLCJzaWduVHhzIiwidW5zaWduZWRUeEhleCIsImV4cG9ydF9yYXciLCJzdWJtaXRUeHMiLCJzaWduZWRUeEhleCIsInR4X2RhdGFfaGV4IiwidHhfaGFzaF9saXN0Iiwic2lnbk1lc3NhZ2UiLCJzaWduYXR1cmVUeXBlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJTSUdOX1dJVEhfU1BFTkRfS0VZIiwiZGF0YSIsInNpZ25hdHVyZV90eXBlIiwidmVyaWZ5TWVzc2FnZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJnb29kIiwiaXNHb29kIiwiaXNPbGQiLCJvbGQiLCJTSUdOX1dJVEhfVklFV19LRVkiLCJnZXRUeEtleSIsInR4SGFzaCIsInR4aWQiLCJ0eF9rZXkiLCJjaGVja1R4S2V5IiwidHhLZXkiLCJjaGVjayIsIk1vbmVyb0NoZWNrVHgiLCJzZXRJc0dvb2QiLCJzZXROdW1Db25maXJtYXRpb25zIiwiY29uZmlybWF0aW9ucyIsImluX3Bvb2wiLCJzZXRSZWNlaXZlZEFtb3VudCIsInJlY2VpdmVkIiwiZ2V0VHhQcm9vZiIsImNoZWNrVHhQcm9vZiIsImdldFNwZW5kUHJvb2YiLCJjaGVja1NwZW5kUHJvb2YiLCJnZXRSZXNlcnZlUHJvb2ZXYWxsZXQiLCJnZXRSZXNlcnZlUHJvb2ZBY2NvdW50IiwiTW9uZXJvQ2hlY2tSZXNlcnZlIiwic2V0VW5jb25maXJtZWRTcGVudEFtb3VudCIsInNldFRvdGFsQW1vdW50IiwidG90YWwiLCJnZXRUeE5vdGVzIiwibm90ZXMiLCJzZXRUeE5vdGVzIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiZW50cmllcyIsInJwY0VudHJ5IiwiTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsInNldERlc2NyaXB0aW9uIiwiZGVzY3JpcHRpb24iLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJzZXRfYWRkcmVzcyIsInNldF9kZXNjcmlwdGlvbiIsImRlbGV0ZUFkZHJlc3NCb29rRW50cnkiLCJlbnRyeUlkeCIsInRhZ0FjY291bnRzIiwiYWNjb3VudEluZGljZXMiLCJ1bnRhZ0FjY291bnRzIiwiZ2V0QWNjb3VudFRhZ3MiLCJ0YWdzIiwiYWNjb3VudF90YWdzIiwicnBjQWNjb3VudFRhZyIsIk1vbmVyb0FjY291bnRUYWciLCJzZXRBY2NvdW50VGFnTGFiZWwiLCJnZXRQYXltZW50VXJpIiwicmVjaXBpZW50X25hbWUiLCJnZXRSZWNpcGllbnROYW1lIiwidHhfZGVzY3JpcHRpb24iLCJnZXROb3RlIiwidXJpIiwicGFyc2VQYXltZW50VXJpIiwiTW9uZXJvVHhDb25maWciLCJzZXRSZWNpcGllbnROYW1lIiwic2V0Tm90ZSIsImdldEF0dHJpYnV0ZSIsInZhbHVlIiwic2V0QXR0cmlidXRlIiwidmFsIiwic3RhcnRNaW5pbmciLCJudW1UaHJlYWRzIiwiYmFja2dyb3VuZE1pbmluZyIsImlnbm9yZUJhdHRlcnkiLCJ0aHJlYWRzX2NvdW50IiwiZG9fYmFja2dyb3VuZF9taW5pbmciLCJpZ25vcmVfYmF0dGVyeSIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwibXVsdGlzaWdfaW1wb3J0X25lZWRlZCIsImdldE11bHRpc2lnSW5mbyIsImluZm8iLCJNb25lcm9NdWx0aXNpZ0luZm8iLCJzZXRJc011bHRpc2lnIiwibXVsdGlzaWciLCJzZXRJc1JlYWR5IiwicmVhZHkiLCJzZXRUaHJlc2hvbGQiLCJ0aHJlc2hvbGQiLCJzZXROdW1QYXJ0aWNpcGFudHMiLCJwcmVwYXJlTXVsdGlzaWciLCJtdWx0aXNpZ19pbmZvIiwibWFrZU11bHRpc2lnIiwibXVsdGlzaWdIZXhlcyIsImV4Y2hhbmdlTXVsdGlzaWdLZXlzIiwibXNSZXN1bHQiLCJNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQiLCJzZXRNdWx0aXNpZ0hleCIsImdldE11bHRpc2lnSGV4IiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJpbXBvcnRNdWx0aXNpZ0hleCIsIm5fb3V0cHV0cyIsInNpZ25NdWx0aXNpZ1R4SGV4IiwibXVsdGlzaWdUeEhleCIsInNpZ25SZXN1bHQiLCJNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJzZXRTaWduZWRNdWx0aXNpZ1R4SGV4Iiwic2V0VHhIYXNoZXMiLCJzdWJtaXRNdWx0aXNpZ1R4SGV4Iiwic2lnbmVkTXVsdGlzaWdUeEhleCIsImNoYW5nZVBhc3N3b3JkIiwib2xkUGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsIm9sZF9wYXNzd29yZCIsIm5ld19wYXNzd29yZCIsInNhdmUiLCJjbG9zZSIsImlzQ2xvc2VkIiwic3RvcCIsImdldEluY29taW5nVHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlcnMiLCJjcmVhdGVUeCIsInJlbGF5VHgiLCJnZXRUeE5vdGUiLCJzZXRUeE5vdGUiLCJub3RlIiwiY29ubmVjdFRvV2FsbGV0UnBjIiwidXJpT3JDb25maWciLCJub3JtYWxpemVDb25maWciLCJjbWQiLCJzdGFydFdhbGxldFJwY1Byb2Nlc3MiLCJjaGlsZF9wcm9jZXNzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aGVuIiwiY2hpbGRQcm9jZXNzIiwic3Bhd24iLCJlbnYiLCJMQU5HIiwic3Rkb3V0Iiwic2V0RW5jb2RpbmciLCJzdGRlcnIiLCJ0aGF0IiwicmVqZWN0Iiwib24iLCJsaW5lIiwiTGlicmFyeVV0aWxzIiwibG9nIiwidXJpTGluZUNvbnRhaW5zIiwidXJpTGluZUNvbnRhaW5zSWR4IiwiaG9zdCIsInN1YnN0cmluZyIsImxhc3RJbmRleE9mIiwidW5mb3JtYXR0ZWRMaW5lIiwicmVwbGFjZSIsInRyaW0iLCJwb3J0Iiwic3NsSWR4Iiwic3NsRW5hYmxlZCIsInRvTG93ZXJDYXNlIiwidXNlclBhc3NJZHgiLCJ1c2VyUGFzcyIsInJlamVjdFVuYXV0aG9yaXplZCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsIndhbGxldCIsImlzUmVzb2x2ZWQiLCJnZXRMb2dMZXZlbCIsImNvZGUiLCJvcmlnaW4iLCJnZXRBY2NvdW50SW5kaWNlcyIsInR4UXVlcnkiLCJjYW5CZUNvbmZpcm1lZCIsImdldEluVHhQb29sIiwiZ2V0SXNGYWlsZWQiLCJjYW5CZUluVHhQb29sIiwiZ2V0TWF4SGVpZ2h0IiwiZ2V0SXNMb2NrZWQiLCJjYW5CZUluY29taW5nIiwiZ2V0SXNJbmNvbWluZyIsImdldElzT3V0Z29pbmciLCJnZXRIYXNEZXN0aW5hdGlvbnMiLCJjYW5CZU91dGdvaW5nIiwiaW4iLCJvdXQiLCJwb29sIiwicGVuZGluZyIsImZhaWxlZCIsImdldE1pbkhlaWdodCIsIm1pbl9oZWlnaHQiLCJtYXhfaGVpZ2h0IiwiZmlsdGVyX2J5X2hlaWdodCIsImdldFN1YmFkZHJlc3NJbmRleCIsInNpemUiLCJmcm9tIiwicnBjVHgiLCJjb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIiLCJnZXRPdXRnb2luZ0Ftb3VudCIsIm91dGdvaW5nVHJhbnNmZXIiLCJ0cmFuc2ZlclRvdGFsIiwidmFsdWVzIiwic29ydCIsImNvbXBhcmVUeHNCeUhlaWdodCIsInNldElzSW5jb21pbmciLCJzZXRJc091dGdvaW5nIiwiY29tcGFyZUluY29taW5nVHJhbnNmZXJzIiwidHJhbnNmZXJfdHlwZSIsImdldElzU3BlbnQiLCJ2ZXJib3NlIiwicnBjT3V0cHV0IiwiY29udmVydFJwY1R4V2FsbGV0V2l0aE91dHB1dCIsImNvbXBhcmVPdXRwdXRzIiwicnBjSW1hZ2UiLCJNb25lcm9LZXlJbWFnZSIsImJlbG93X2Ftb3VudCIsImdldEJlbG93QW1vdW50Iiwic2V0SXNMb2NrZWQiLCJzZXRJc0NvbmZpcm1lZCIsInNldFJlbGF5Iiwic2V0SXNNaW5lclR4Iiwic2V0SXNGYWlsZWQiLCJNb25lcm9EZXN0aW5hdGlvbiIsInNldERlc3RpbmF0aW9ucyIsInNldE91dGdvaW5nVHJhbnNmZXIiLCJnZXRVbmxvY2tUaW1lIiwic2V0VW5sb2NrVGltZSIsImdldExhc3RSZWxheWVkVGltZXN0YW1wIiwic2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJEYXRlIiwiZ2V0VGltZSIsImdldElzRG91YmxlU3BlbmRTZWVuIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJsaXN0ZW5lcnMiLCJXYWxsZXRQb2xsZXIiLCJzZXRJc1BvbGxpbmciLCJpc1BvbGxpbmciLCJzZXJ2ZXIiLCJwcm94eVRvV29ya2VyIiwic2V0UHJpbWFyeUFkZHJlc3MiLCJzZXRUYWciLCJnZXRUYWciLCJzZXRSaW5nU2l6ZSIsIk1vbmVyb1V0aWxzIiwiUklOR19TSVpFIiwiTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciIsInNldFR4IiwiZGVzdENvcGllcyIsImRlc3QiLCJjb252ZXJ0UnBjVHhTZXQiLCJycGNNYXAiLCJNb25lcm9UeFNldCIsInNldE11bHRpc2lnVHhIZXgiLCJzZXRVbnNpZ25lZFR4SGV4Iiwic2V0U2lnbmVkVHhIZXgiLCJzaWduZWRfdHhzZXQiLCJnZXRTaWduZWRUeEhleCIsInJwY1R4cyIsInNldFR4cyIsInNldFR4U2V0Iiwic2V0SGFzaCIsInNldEtleSIsInNldEZ1bGxIZXgiLCJzZXRNZXRhZGF0YSIsInNldEZlZSIsInNldFdlaWdodCIsImlucHV0S2V5SW1hZ2VzTGlzdCIsImFzc2VydFRydWUiLCJnZXRJbnB1dHMiLCJzZXRJbnB1dHMiLCJpbnB1dEtleUltYWdlIiwiTW9uZXJvT3V0cHV0V2FsbGV0Iiwic2V0S2V5SW1hZ2UiLCJzZXRIZXgiLCJhbW91bnRzQnlEZXN0TGlzdCIsImRlc3RpbmF0aW9uSWR4IiwidHhJZHgiLCJhbW91bnRzQnlEZXN0IiwiaXNPdXRnb2luZyIsInR5cGUiLCJkZWNvZGVScGNUeXBlIiwiaGVhZGVyIiwic2V0U2l6ZSIsIk1vbmVyb0Jsb2NrSGVhZGVyIiwic2V0VGltZXN0YW1wIiwiTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsInNldE51bVN1Z2dlc3RlZENvbmZpcm1hdGlvbnMiLCJERUZBVUxUX1BBWU1FTlRfSUQiLCJycGNJbmRpY2VzIiwicnBjSW5kZXgiLCJzZXRTdWJhZGRyZXNzSW5kZXgiLCJycGNEZXN0aW5hdGlvbiIsImRlc3RpbmF0aW9uS2V5Iiwic2V0SW5wdXRTdW0iLCJzZXRPdXRwdXRTdW0iLCJzZXRDaGFuZ2VBZGRyZXNzIiwic2V0Q2hhbmdlQW1vdW50Iiwic2V0TnVtRHVtbXlPdXRwdXRzIiwic2V0RXh0cmFIZXgiLCJpbnB1dEtleUltYWdlcyIsImtleV9pbWFnZXMiLCJhbW91bnRzIiwic2V0QmxvY2siLCJNb25lcm9CbG9jayIsIm1lcmdlIiwic2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJzZXRJc1NwZW50Iiwic2V0SXNGcm96ZW4iLCJzZXRTdGVhbHRoUHVibGljS2V5Iiwic2V0T3V0cHV0cyIsInJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQiLCJycGNUeXBlIiwiYVR4IiwiYUJsb2NrIiwidHgxIiwidHgyIiwiZGlmZiIsInQxIiwidDIiLCJvMSIsIm8yIiwiaGVpZ2h0Q29tcGFyaXNvbiIsImNvbXBhcmUiLCJsb2NhbGVDb21wYXJlIiwiZXhwb3J0cyIsImxvb3BlciIsIlRhc2tMb29wZXIiLCJwcmV2TG9ja2VkVHhzIiwicHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucyIsInByZXZDb25maXJtZWROb3RpZmljYXRpb25zIiwidGhyZWFkUG9vbCIsIlRocmVhZFBvb2wiLCJudW1Qb2xsaW5nIiwic3RhcnQiLCJwZXJpb2RJbk1zIiwic3VibWl0IiwicHJldkJhbGFuY2VzIiwicHJldkhlaWdodCIsIk1vbmVyb1R4UXVlcnkiLCJvbk5ld0Jsb2NrIiwibWluSGVpZ2h0IiwibWF4IiwibG9ja2VkVHhzIiwic2V0TWluSGVpZ2h0Iiwic2V0SW5jbHVkZU91dHB1dHMiLCJub0xvbmdlckxvY2tlZEhhc2hlcyIsInByZXZMb2NrZWRUeCIsInVubG9ja2VkVHhzIiwic2V0SGFzaGVzIiwibG9ja2VkVHgiLCJzZWFyY2hTZXQiLCJ1bmFubm91bmNlZCIsIm5vdGlmeU91dHB1dHMiLCJ1bmxvY2tlZFR4IiwiZGVsZXRlIiwiY2hlY2tGb3JDaGFuZ2VkQmFsYW5jZXMiLCJhbm5vdW5jZU5ld0Jsb2NrIiwiZ2V0RmVlIiwiYW5ub3VuY2VPdXRwdXRTcGVudCIsImFubm91bmNlT3V0cHV0UmVjZWl2ZWQiLCJiYWxhbmNlcyIsImFubm91bmNlQmFsYW5jZXNDaGFuZ2VkIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldFJwYy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuLi9jb21tb24vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgVGFza0xvb3BlciBmcm9tIFwiLi4vY29tbW9uL1Rhc2tMb29wZXJcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50IGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50VGFnIGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRUYWdcIjtcbmltcG9ydCBNb25lcm9BZGRyZXNzQm9va0VudHJ5IGZyb20gXCIuL21vZGVsL01vbmVyb0FkZHJlc3NCb29rRW50cnlcIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tIZWFkZXIgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja0hlYWRlclwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrUmVzZXJ2ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1Jlc2VydmVcIjtcbmltcG9ydCBNb25lcm9DaGVja1R4IGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrVHhcIjtcbmltcG9ydCBNb25lcm9EZXN0aW5hdGlvbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EZXN0aW5hdGlvblwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbmNvbWluZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb0luY29taW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnU2lnblJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb091dGdvaW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0Z29pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvUnBjRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNFcnJvclwiO1xuaW1wb3J0IE1vbmVyb1N1YmFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHggZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9UeFwiO1xuaW1wb3J0IE1vbmVyb1R4Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvVHhQcmlvcml0eSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFByaW9yaXR5XCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuLi9jb21tb24vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdFwiO1xuaW1wb3J0IFRocmVhZFBvb2wgZnJvbSBcIi4uL2NvbW1vbi9UaHJlYWRQb29sXCI7XG5pbXBvcnQgU3NsT3B0aW9ucyBmcm9tIFwiLi4vY29tbW9uL1NzbE9wdGlvbnNcIjtcbmltcG9ydCB7IENoaWxkUHJvY2VzcyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5cbi8qKlxuICogQ29weXJpZ2h0IChjKSB3b29kc2VyXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9XYWxsZXQgYXMgYSBjbGllbnQgb2YgbW9uZXJvLXdhbGxldC1ycGMuXG4gKiBcbiAqIEBpbXBsZW1lbnRzIHtNb25lcm9XYWxsZXR9XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1dhbGxldFJwYyBleHRlbmRzIE1vbmVyb1dhbGxldCB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgPSAyMDAwMDsgLy8gZGVmYXVsdCBwZXJpb2QgYmV0d2VlbiBzeW5jcyBpbiBtcyAoZGVmaW5lZCBieSBERUZBVUxUX0FVVE9fUkVGUkVTSF9QRVJJT0QgaW4gd2FsbGV0X3JwY19zZXJ2ZXIuY3BwKVxuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz47XG4gIHByb3RlY3RlZCBhZGRyZXNzQ2FjaGU6IGFueTtcbiAgcHJvdGVjdGVkIHN5bmNQZXJpb2RJbk1zOiBudW1iZXI7XG4gIHByb3RlY3RlZCBsaXN0ZW5lcnM6IE1vbmVyb1dhbGxldExpc3RlbmVyW107XG4gIHByb3RlY3RlZCBwcm9jZXNzOiBhbnk7XG4gIHByb3RlY3RlZCBwYXRoOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBkYWVtb25Db25uZWN0aW9uOiBNb25lcm9ScGNDb25uZWN0aW9uO1xuICBwcm90ZWN0ZWQgd2FsbGV0UG9sbGVyOiBXYWxsZXRQb2xsZXI7XG4gIFxuICAvKiogQHByaXZhdGUgKi9cbiAgY29uc3RydWN0b3IoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307IC8vIGF2b2lkIHVuZWNlc3NhcnkgcmVxdWVzdHMgZm9yIGFkZHJlc3Nlc1xuICAgIHRoaXMuc3luY1BlcmlvZEluTXMgPSBNb25lcm9XYWxsZXRScGMuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUztcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFJQQyBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm8td2FsbGV0LXJwYy5cbiAgICogXG4gICAqIEByZXR1cm4ge0NoaWxkUHJvY2Vzc30gdGhlIHByb2Nlc3MgcnVubmluZyBtb25lcm8td2FsbGV0LXJwYywgdW5kZWZpbmVkIGlmIG5vdCBjcmVhdGVkIGZyb20gbmV3IHByb2Nlc3NcbiAgICovXG4gIGdldFByb2Nlc3MoKTogQ2hpbGRQcm9jZXNzIHtcbiAgICByZXR1cm4gdGhpcy5wcm9jZXNzO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RvcCB0aGUgaW50ZXJuYWwgcHJvY2VzcyBydW5uaW5nIG1vbmVyby13YWxsZXQtcnBjLCBpZiBhcHBsaWNhYmxlLlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBmb3JjZSBzcGVjaWZpZXMgaWYgdGhlIHByb2Nlc3Mgc2hvdWxkIGJlIGRlc3Ryb3llZCBmb3JjaWJseSAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+fSB0aGUgZXhpdCBjb2RlIGZyb20gc3RvcHBpbmcgdGhlIHByb2Nlc3NcbiAgICovXG4gIGFzeW5jIHN0b3BQcm9jZXNzKGZvcmNlID0gZmFsc2UpOiBQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD4gIHtcbiAgICBpZiAodGhpcy5wcm9jZXNzID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb1dhbGxldFJwYyBpbnN0YW5jZSBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXCIpO1xuICAgIGxldCBsaXN0ZW5lcnNDb3B5ID0gR2VuVXRpbHMuY29weUFycmF5KHRoaXMuZ2V0TGlzdGVuZXJzKCkpO1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIGxpc3RlbmVyc0NvcHkpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHJldHVybiBHZW5VdGlscy5raWxsUHJvY2Vzcyh0aGlzLnByb2Nlc3MsIGZvcmNlID8gXCJTSUdLSUxMXCIgOiB1bmRlZmluZWQpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBSUEMgY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEByZXR1cm4ge01vbmVyb1JwY0Nvbm5lY3Rpb24gfCB1bmRlZmluZWR9IHRoZSB3YWxsZXQncyBycGMgY29ubmVjdGlvblxuICAgKi9cbiAgZ2V0UnBjQ29ubmVjdGlvbigpOiBNb25lcm9ScGNDb25uZWN0aW9uIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5PcGVuIGFuIGV4aXN0aW5nIHdhbGxldCBvbiB0aGUgbW9uZXJvLXdhbGxldC1ycGMgc2VydmVyLjwvcD5cbiAgICogXG4gICAqIDxwPkV4YW1wbGU6PHA+XG4gICAqIFxuICAgKiA8Y29kZT5cbiAgICogbGV0IHdhbGxldCA9IG5ldyBNb25lcm9XYWxsZXRScGMoXCJodHRwOi8vbG9jYWxob3N0OjM4MDg0XCIsIFwicnBjX3VzZXJcIiwgXCJhYmMxMjNcIik7PGJyPlxuICAgKiBhd2FpdCB3YWxsZXQub3BlbldhbGxldChcIm15d2FsbGV0MVwiLCBcInN1cGVyc2VjcmV0cGFzc3dvcmRcIik7PGJyPlxuICAgKiA8YnI+XG4gICAqIGF3YWl0IHdhbGxldC5vcGVuV2FsbGV0KHs8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXRoOiBcIm15d2FsbGV0MlwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcInN1cGVyc2VjcmV0cGFzc3dvcmRcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBzZXJ2ZXI6IFwiaHR0cDovL2xvY2Fob3N0OjM4MDgxXCIsIC8vIG9yIG9iamVjdCB3aXRoIHVyaSwgdXNlcm5hbWUsIHBhc3N3b3JkLCBldGMgPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZTxicj5cbiAgICogfSk7PGJyPlxuICAgKiA8L2NvZGU+XG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ3xNb25lcm9XYWxsZXRDb25maWd9IHBhdGhPckNvbmZpZyAgLSB0aGUgd2FsbGV0J3MgbmFtZSBvciBjb25maWd1cmF0aW9uIHRvIG9wZW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhPckNvbmZpZy5wYXRoIC0gcGF0aCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIGluLW1lbW9yeSB3YWxsZXQgaWYgbm90IGdpdmVuKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aE9yQ29uZmlnLnBhc3N3b3JkIC0gcGFzc3dvcmQgb2YgdGhlIHdhbGxldCB0byBjcmVhdGVcbiAgICogQHBhcmFtIHtzdHJpbmd8UGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPn0gcGF0aE9yQ29uZmlnLnNlcnZlciAtIHVyaSBvciBNb25lcm9ScGNDb25uZWN0aW9uIG9mIGEgZGFlbW9uIHRvIHVzZSAob3B0aW9uYWwsIG1vbmVyby13YWxsZXQtcnBjIHVzdWFsbHkgc3RhcnRlZCB3aXRoIGRhZW1vbiBjb25maWcpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcGFzc3dvcmRdIHRoZSB3YWxsZXQncyBwYXNzd29yZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1dhbGxldFJwYz59IHRoaXMgd2FsbGV0IGNsaWVudFxuICAgKi9cbiAgYXN5bmMgb3BlbldhbGxldChwYXRoT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPiwgcGFzc3dvcmQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgbGV0IGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcodHlwZW9mIHBhdGhPckNvbmZpZyA9PT0gXCJzdHJpbmdcIiA/IHtwYXRoOiBwYXRoT3JDb25maWcsIHBhc3N3b3JkOiBwYXNzd29yZCA/IHBhc3N3b3JkIDogXCJcIn0gOiBwYXRoT3JDb25maWcpO1xuICAgIC8vIFRPRE86IGVuc3VyZSBvdGhlciBmaWVsZHMgdW5pbml0aWFsaXplZD9cbiAgICBcbiAgICAvLyBvcGVuIHdhbGxldCBvbiBycGMgc2VydmVyXG4gICAgaWYgKCFjb25maWcuZ2V0UGF0aCgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgbmFtZSBvZiB3YWxsZXQgdG8gb3BlblwiKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJvcGVuX3dhbGxldFwiLCB7ZmlsZW5hbWU6IGNvbmZpZy5nZXRQYXRoKCksIHBhc3N3b3JkOiBjb25maWcuZ2V0UGFzc3dvcmQoKX0pO1xuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuXG4gICAgLy8gc2V0IGNvbm5lY3Rpb24gbWFuYWdlciBvciBzZXJ2ZXJcbiAgICBpZiAoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkgIT0gbnVsbCkge1xuICAgICAgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBvcGVuZWQgd2l0aCBhIHNlcnZlciBvciBjb25uZWN0aW9uIG1hbmFnZXIgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgYXdhaXQgdGhpcy5zZXRDb25uZWN0aW9uTWFuYWdlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSk7XG4gICAgfSBlbHNlIGlmIChjb25maWcuZ2V0U2VydmVyKCkgIT0gbnVsbCkge1xuICAgICAgYXdhaXQgdGhpcy5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZy5nZXRTZXJ2ZXIoKSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+Q3JlYXRlIGFuZCBvcGVuIGEgd2FsbGV0IG9uIHRoZSBtb25lcm8td2FsbGV0LXJwYyBzZXJ2ZXIuPHA+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlOjxwPlxuICAgKiBcbiAgICogPGNvZGU+XG4gICAqICZzb2w7JnNvbDsgY29uc3RydWN0IGNsaWVudCB0byBtb25lcm8td2FsbGV0LXJwYzxicj5cbiAgICogbGV0IHdhbGxldFJwYyA9IG5ldyBNb25lcm9XYWxsZXRScGMoXCJodHRwOi8vbG9jYWxob3N0OjM4MDg0XCIsIFwicnBjX3VzZXJcIiwgXCJhYmMxMjNcIik7PGJyPjxicj5cbiAgICogXG4gICAqICZzb2w7JnNvbDsgY3JlYXRlIGFuZCBvcGVuIHdhbGxldCBvbiBtb25lcm8td2FsbGV0LXJwYzxicj5cbiAgICogYXdhaXQgd2FsbGV0UnBjLmNyZWF0ZVdhbGxldCh7PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGF0aDogXCJteXdhbGxldFwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImFiYzEyM1wiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHNlZWQ6IFwiY29leGlzdCBpZ2xvbyBwYW1waGxldCBsYWdvb24uLi5cIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyByZXN0b3JlSGVpZ2h0OiAxNTQzMjE4bDxicj5cbiAgICogfSk7XG4gICAqICA8L2NvZGU+XG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPn0gY29uZmlnIC0gTW9uZXJvV2FsbGV0Q29uZmlnIG9yIGVxdWl2YWxlbnQgSlMgb2JqZWN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhdGhdIC0gcGF0aCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIGluLW1lbW9yeSB3YWxsZXQgaWYgbm90IGdpdmVuKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXNzd29yZF0gLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZWVkXSAtIHNlZWQgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCByYW5kb20gd2FsbGV0IGNyZWF0ZWQgaWYgbmVpdGhlciBzZWVkIG5vciBrZXlzIGdpdmVuKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZWVkT2Zmc2V0XSAtIHRoZSBvZmZzZXQgdXNlZCB0byBkZXJpdmUgYSBuZXcgc2VlZCBmcm9tIHRoZSBnaXZlbiBzZWVkIHRvIHJlY292ZXIgYSBzZWNyZXQgd2FsbGV0IGZyb20gdGhlIHNlZWRcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLmlzTXVsdGlzaWddIC0gcmVzdG9yZSBtdWx0aXNpZyB3YWxsZXQgZnJvbSBzZWVkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaW1hcnlBZGRyZXNzXSAtIHByaW1hcnkgYWRkcmVzcyBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob25seSBwcm92aWRlIGlmIHJlc3RvcmluZyBmcm9tIGtleXMpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVWaWV3S2V5XSAtIHByaXZhdGUgdmlldyBrZXkgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlU3BlbmRLZXldIC0gcHJpdmF0ZSBzcGVuZCBrZXkgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5yZXN0b3JlSGVpZ2h0XSAtIGJsb2NrIGhlaWdodCB0byBzdGFydCBzY2FubmluZyBmcm9tIChkZWZhdWx0cyB0byAwIHVubGVzcyBnZW5lcmF0aW5nIHJhbmRvbSB3YWxsZXQpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmxhbmd1YWdlXSAtIGxhbmd1YWdlIG9mIHRoZSB3YWxsZXQncyBtbmVtb25pYyBwaHJhc2Ugb3Igc2VlZCAoZGVmYXVsdHMgdG8gXCJFbmdsaXNoXCIgb3IgYXV0by1kZXRlY3RlZClcbiAgICogQHBhcmFtIHtNb25lcm9ScGNDb25uZWN0aW9ufSBbY29uZmlnLnNlcnZlcl0gLSBNb25lcm9ScGNDb25uZWN0aW9uIHRvIGEgbW9uZXJvIGRhZW1vbiAob3B0aW9uYWwpPGJyPlxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZXJ2ZXJVcmldIC0gdXJpIG9mIGEgZGFlbW9uIHRvIHVzZSAob3B0aW9uYWwsIG1vbmVyby13YWxsZXQtcnBjIHVzdWFsbHkgc3RhcnRlZCB3aXRoIGRhZW1vbiBjb25maWcpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclVzZXJuYW1lXSAtIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBkYWVtb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZXJ2ZXJQYXNzd29yZF0gLSBwYXNzd29yZCB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgZGFlbW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9Db25uZWN0aW9uTWFuYWdlcn0gW2NvbmZpZy5jb25uZWN0aW9uTWFuYWdlcl0gLSBtYW5hZ2UgY29ubmVjdGlvbnMgdG8gbW9uZXJvZCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5yZWplY3RVbmF1dGhvcml6ZWRdIC0gcmVqZWN0IHNlbGYtc2lnbmVkIHNlcnZlciBjZXJ0aWZpY2F0ZXMgaWYgdHJ1ZSAoZGVmYXVsdHMgdG8gdHJ1ZSlcbiAgICogQHBhcmFtIHtNb25lcm9ScGNDb25uZWN0aW9ufSBbY29uZmlnLnNlcnZlcl0gLSBNb25lcm9ScGNDb25uZWN0aW9uIG9yIGVxdWl2YWxlbnQgSlMgb2JqZWN0IHByb3ZpZGluZyBkYWVtb24gY29uZmlndXJhdGlvbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5zYXZlQ3VycmVudF0gLSBzcGVjaWZpZXMgaWYgdGhlIGN1cnJlbnQgUlBDIHdhbGxldCBzaG91bGQgYmUgc2F2ZWQgYmVmb3JlIGJlaW5nIGNsb3NlZCAoZGVmYXVsdCB0cnVlKVxuICAgKiBAcmV0dXJuIHtNb25lcm9XYWxsZXRScGN9IHRoaXMgd2FsbGV0IGNsaWVudFxuICAgKi9cbiAgYXN5bmMgY3JlYXRlV2FsbGV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGNvbmZpZyB0byBjcmVhdGUgd2FsbGV0XCIpO1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQgJiYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpdmF0ZVZpZXdLZXkoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgaW5pdGlhbGl6ZWQgd2l0aCBhIHNlZWQgb3Iga2V5cyBidXQgbm90IGJvdGhcIik7XG4gICAgfVxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldE5ldHdvcmtUeXBlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgbmV0d29ya1R5cGUgd2hlbiBjcmVhdGluZyBSUEMgd2FsbGV0IGJlY2F1c2Ugc2VydmVyJ3MgbmV0d29yayB0eXBlIGlzIGFscmVhZHkgc2V0XCIpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRMb29rYWhlYWQoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0xvb2thaGVhZCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgY3JlYXRpbmcgd2FsbGV0cyB3aXRoIHN1YmFkZHJlc3MgbG9va2FoZWFkIG92ZXIgcnBjXCIpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFBhc3N3b3JkKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRQYXNzd29yZChcIlwiKTtcblxuICAgIC8vIHNldCBzZXJ2ZXIgZnJvbSBjb25uZWN0aW9uIG1hbmFnZXIgaWYgcHJvdmlkZWRcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBjcmVhdGVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGNvbmZpZ05vcm1hbGl6ZWQuc2V0U2VydmVyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpLmdldENvbm5lY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIHdhbGxldFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZ05vcm1hbGl6ZWQpO1xuICAgIGVsc2UgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWdOb3JtYWxpemVkKTtcbiAgICBlbHNlIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZ05vcm1hbGl6ZWQpO1xuXG4gICAgLy8gc2V0IGNvbm5lY3Rpb24gbWFuYWdlciBvciBzZXJ2ZXJcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSk7XG4gICAgfSBlbHNlIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlcnZlcigpKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldERhZW1vbkNvbm5lY3Rpb24oY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgcmVzdG9yZUhlaWdodCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSBmYWxzZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ3VycmVudCB3YWxsZXQgaXMgc2F2ZWQgYXV0b21hdGljYWxseSB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0UGF0aCgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOYW1lIGlzIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICBpZiAoIWNvbmZpZy5nZXRMYW5ndWFnZSgpKSBjb25maWcuc2V0TGFuZ3VhZ2UoTW9uZXJvV2FsbGV0LkRFRkFVTFRfTEFOR1VBR0UpO1xuICAgIGxldCBwYXJhbXMgPSB7IGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLCBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksIGxhbmd1YWdlOiBjb25maWcuZ2V0TGFuZ3VhZ2UoKSB9O1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfd2FsbGV0XCIsIHBhcmFtcyk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXN0b3JlX2RldGVybWluaXN0aWNfd2FsbGV0XCIsIHtcbiAgICAgICAgZmlsZW5hbWU6IGNvbmZpZy5nZXRQYXRoKCksXG4gICAgICAgIHBhc3N3b3JkOiBjb25maWcuZ2V0UGFzc3dvcmQoKSxcbiAgICAgICAgc2VlZDogY29uZmlnLmdldFNlZWQoKSxcbiAgICAgICAgc2VlZF9vZmZzZXQ6IGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCksXG4gICAgICAgIGVuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWw6IGNvbmZpZy5nZXRJc011bHRpc2lnKCksXG4gICAgICAgIHJlc3RvcmVfaGVpZ2h0OiBjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpLFxuICAgICAgICBsYW5ndWFnZTogY29uZmlnLmdldExhbmd1YWdlKCksXG4gICAgICAgIGF1dG9zYXZlX2N1cnJlbnQ6IGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhpcy5oYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihjb25maWcuZ2V0UGF0aCgpLCBlcnIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHdhbGxldCBmcm9tIGtleXNcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFJlc3RvcmVIZWlnaHQoMCk7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShNb25lcm9XYWxsZXQuREVGQVVMVF9MQU5HVUFHRSk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdlbmVyYXRlX2Zyb21fa2V5c1wiLCB7XG4gICAgICAgIGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLFxuICAgICAgICBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksXG4gICAgICAgIGFkZHJlc3M6IGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpLFxuICAgICAgICB2aWV3a2V5OiBjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSxcbiAgICAgICAgc3BlbmRrZXk6IGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSxcbiAgICAgICAgcmVzdG9yZV9oZWlnaHQ6IGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCksXG4gICAgICAgIGF1dG9zYXZlX2N1cnJlbnQ6IGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhpcy5oYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihjb25maWcuZ2V0UGF0aCgpLCBlcnIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKG5hbWUsIGVycikge1xuICAgIGlmIChlcnIubWVzc2FnZSA9PT0gXCJDYW5ub3QgY3JlYXRlIHdhbGxldC4gQWxyZWFkeSBleGlzdHMuXCIpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBuYW1lLCBlcnIuZ2V0Q29kZSgpLCBlcnIuZ2V0UnBjTWV0aG9kKCksIGVyci5nZXRScGNQYXJhbXMoKSk7XG4gICAgaWYgKGVyci5tZXNzYWdlID09PSBcIkVsZWN0cnVtLXN0eWxlIHdvcmQgbGlzdCBmYWlsZWQgdmVyaWZpY2F0aW9uXCIpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihcIkludmFsaWQgbW5lbW9uaWNcIiwgZXJyLmdldENvZGUoKSwgZXJyLmdldFJwY01ldGhvZCgpLCBlcnIuZ2V0UnBjUGFyYW1zKCkpO1xuICAgIHRocm93IGVycjtcbiAgfVxuICBcbiAgYXN5bmMgaXNWaWV3T25seSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHtrZXlfdHlwZTogXCJtbmVtb25pY1wifSk7XG4gICAgICByZXR1cm4gZmFsc2U7IC8vIGtleSByZXRyaWV2YWwgc3VjY2VlZHMgaWYgbm90IHZpZXcgb25seVxuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMjkpIHJldHVybiB0cnVlOyAgLy8gd2FsbGV0IGlzIHZpZXcgb25seVxuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMSkgcmV0dXJuIGZhbHNlOyAgLy8gd2FsbGV0IGlzIG9mZmxpbmUgYnV0IG5vdCB2aWV3IG9ubHlcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfE1vbmVyb1JwY0Nvbm5lY3Rpb259IFt1cmlPckNvbm5lY3Rpb25dIC0gdGhlIGRhZW1vbidzIFVSSSBvciBjb25uZWN0aW9uIChkZWZhdWx0cyB0byBvZmZsaW5lKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzVHJ1c3RlZCAtIGluZGljYXRlcyBpZiB0aGUgZGFlbW9uIGluIHRydXN0ZWRcbiAgICogQHBhcmFtIHtTc2xPcHRpb25zfSBzc2xPcHRpb25zIC0gY3VzdG9tIFNTTCBjb25maWd1cmF0aW9uXG4gICAqL1xuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbj86IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCBzdHJpbmcsIGlzVHJ1c3RlZD86IGJvb2xlYW4sIHNzbE9wdGlvbnM/OiBTc2xPcHRpb25zKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IGNvbm5lY3Rpb24gPSAhdXJpT3JDb25uZWN0aW9uID8gdW5kZWZpbmVkIDogdXJpT3JDb25uZWN0aW9uIGluc3RhbmNlb2YgTW9uZXJvUnBjQ29ubmVjdGlvbiA/IHVyaU9yQ29ubmVjdGlvbiA6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbik7XG4gICAgaWYgKCFzc2xPcHRpb25zKSBzc2xPcHRpb25zID0gbmV3IFNzbE9wdGlvbnMoKTtcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFVyaSgpIDogXCJiYWRfdXJpXCI7IC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IGJhZCBkYWVtb24gdXJpIG5lY2Vzc2FyeSBmb3Igb2ZmbGluZT9cbiAgICBwYXJhbXMudXNlcm5hbWUgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRVc2VybmFtZSgpIDogXCJcIjtcbiAgICBwYXJhbXMucGFzc3dvcmQgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRQYXNzd29yZCgpIDogXCJcIjtcbiAgICBwYXJhbXMudHJ1c3RlZCA9IGlzVHJ1c3RlZDtcbiAgICBwYXJhbXMuc3NsX3N1cHBvcnQgPSBcImF1dG9kZXRlY3RcIjtcbiAgICBwYXJhbXMuc3NsX3ByaXZhdGVfa2V5X3BhdGggPSBzc2xPcHRpb25zLmdldFByaXZhdGVLZXlQYXRoKCk7XG4gICAgcGFyYW1zLnNzbF9jZXJ0aWZpY2F0ZV9wYXRoICA9IHNzbE9wdGlvbnMuZ2V0Q2VydGlmaWNhdGVQYXRoKCk7XG4gICAgcGFyYW1zLnNzbF9jYV9maWxlID0gc3NsT3B0aW9ucy5nZXRDZXJ0aWZpY2F0ZUF1dGhvcml0eUZpbGUoKTtcbiAgICBwYXJhbXMuc3NsX2FsbG93ZWRfZmluZ2VycHJpbnRzID0gc3NsT3B0aW9ucy5nZXRBbGxvd2VkRmluZ2VycHJpbnRzKCk7XG4gICAgcGFyYW1zLnNzbF9hbGxvd19hbnlfY2VydCA9IHNzbE9wdGlvbnMuZ2V0QWxsb3dBbnlDZXJ0KCk7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2RhZW1vblwiLCBwYXJhbXMpO1xuICAgIHRoaXMuZGFlbW9uQ29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkNvbm5lY3Rpb24oKTogUHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPiB7XG4gICAgcmV0dXJuIHRoaXMuZGFlbW9uQ29ubmVjdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHRvdGFsIGFuZCB1bmxvY2tlZCBiYWxhbmNlcyBpbiBhIHNpbmdsZSByZXF1ZXN0LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFthY2NvdW50SWR4XSBhY2NvdW50IGluZGV4XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3ViYWRkcmVzc0lkeF0gc3ViYWRkcmVzcyBpbmRleFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJpZ2ludFtdPn0gaXMgdGhlIHRvdGFsIGFuZCB1bmxvY2tlZCBiYWxhbmNlcyBpbiBhbiBhcnJheSwgcmVzcGVjdGl2ZWx5XG4gICAqL1xuICBhc3luYyBnZXRCYWxhbmNlcyhhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnRbXT4ge1xuICAgIGlmIChhY2NvdW50SWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzSWR4LCB1bmRlZmluZWQsIFwiTXVzdCBwcm92aWRlIGFjY291bnQgaW5kZXggd2l0aCBzdWJhZGRyZXNzIGluZGV4XCIpO1xuICAgICAgbGV0IGJhbGFuY2UgPSBCaWdJbnQoMCk7XG4gICAgICBsZXQgdW5sb2NrZWRCYWxhbmNlID0gQmlnSW50KDApO1xuICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCB0aGlzLmdldEFjY291bnRzKCkpIHtcbiAgICAgICAgYmFsYW5jZSA9IGJhbGFuY2UgKyBhY2NvdW50LmdldEJhbGFuY2UoKTtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlID0gdW5sb2NrZWRCYWxhbmNlICsgYWNjb3VudC5nZXRVbmxvY2tlZEJhbGFuY2UoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBbYmFsYW5jZSwgdW5sb2NrZWRCYWxhbmNlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHBhcmFtcyA9IHthY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LCBhZGRyZXNzX2luZGljZXM6IHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IFtzdWJhZGRyZXNzSWR4XX07XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIsIHBhcmFtcyk7XG4gICAgICBpZiAoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gW0JpZ0ludChyZXNwLnJlc3VsdC5iYWxhbmNlKSwgQmlnSW50KHJlc3AucmVzdWx0LnVubG9ja2VkX2JhbGFuY2UpXTtcbiAgICAgIGVsc2UgcmV0dXJuIFtCaWdJbnQocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3NbMF0uYmFsYW5jZSksIEJpZ0ludChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzc1swXS51bmxvY2tlZF9iYWxhbmNlKV07XG4gICAgfVxuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBDT01NT04gV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb1dhbGxldExpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3VwZXIuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN1cGVyLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWRUb0RhZW1vbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jaGVja1Jlc2VydmVQcm9vZihhd2FpdCB0aGlzLmdldFByaW1hcnlBZGRyZXNzKCksIFwiXCIsIFwiXCIpOyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IHByb3ZpZGUgYmV0dGVyIHdheSB0byBrbm93IGlmIHdhbGxldCBycGMgaXMgY29ubmVjdGVkIHRvIGRhZW1vblxuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiY2hlY2sgcmVzZXJ2ZSBleHBlY3RlZCB0byBmYWlsXCIpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmV0dXJuIGUubWVzc2FnZS5pbmRleE9mKFwiRmFpbGVkIHRvIGNvbm5lY3QgdG8gZGFlbW9uXCIpIDwgMDtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFZlcnNpb24oKTogUHJvbWlzZTxNb25lcm9WZXJzaW9uPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdmVyc2lvblwiKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1ZlcnNpb24ocmVzcC5yZXN1bHQudmVyc2lvbiwgcmVzcC5yZXN1bHQucmVsZWFzZSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5wYXRoO1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwgeyBrZXlfdHlwZTogXCJtbmVtb25pY1wiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmIChhd2FpdCB0aGlzLmdldFNlZWQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb1dhbGxldFJwYy5nZXRTZWVkTGFuZ3VhZ2UoKSBub3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgYXZhaWxhYmxlIGxhbmd1YWdlcyBmb3IgdGhlIHdhbGxldCdzIHNlZWQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtzdHJpbmdbXX0gdGhlIGF2YWlsYWJsZSBsYW5ndWFnZXMgZm9yIHRoZSB3YWxsZXQncyBzZWVkLlxuICAgKi9cbiAgYXN5bmMgZ2V0U2VlZExhbmd1YWdlcygpIHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9sYW5ndWFnZXNcIikpLnJlc3VsdC5sYW5ndWFnZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFByaXZhdGVWaWV3S2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwgeyBrZXlfdHlwZTogXCJ2aWV3X2tleVwiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFByaXZhdGVTcGVuZEtleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwic3BlbmRfa2V5XCIgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmtleTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHN1YmFkZHJlc3NNYXAgPSB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XTtcbiAgICBpZiAoIXN1YmFkZHJlc3NNYXApIHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHVuZGVmaW5lZCwgdHJ1ZSk7ICAvLyBjYWNoZSdzIGFsbCBhZGRyZXNzZXMgYXQgdGhpcyBhY2NvdW50XG4gICAgICByZXR1cm4gdGhpcy5nZXRBZGRyZXNzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpOyAgICAgICAgLy8gcmVjdXJzaXZlIGNhbGwgdXNlcyBjYWNoZVxuICAgIH1cbiAgICBsZXQgYWRkcmVzcyA9IHN1YmFkZHJlc3NNYXBbc3ViYWRkcmVzc0lkeF07XG4gICAgaWYgKCFhZGRyZXNzKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHRydWUpOyAgLy8gY2FjaGUncyBhbGwgYWRkcmVzc2VzIGF0IHRoaXMgYWNjb3VudFxuICAgICAgcmV0dXJuIHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdW3N1YmFkZHJlc3NJZHhdO1xuICAgIH1cbiAgICByZXR1cm4gYWRkcmVzcztcbiAgfVxuICBcbiAgLy8gVE9ETzogdXNlIGNhY2hlXG4gIGFzeW5jIGdldEFkZHJlc3NJbmRleChhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBcbiAgICAvLyBmZXRjaCByZXN1bHQgYW5kIG5vcm1hbGl6ZSBlcnJvciBpZiBhZGRyZXNzIGRvZXMgbm90IGJlbG9uZyB0byB0aGUgd2FsbGV0XG4gICAgbGV0IHJlc3A7XG4gICAgdHJ5IHtcbiAgICAgIHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc19pbmRleFwiLCB7YWRkcmVzczogYWRkcmVzc30pO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGUubWVzc2FnZSk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICBcbiAgICAvLyBjb252ZXJ0IHJwYyByZXNwb25zZVxuICAgIGxldCBzdWJhZGRyZXNzID0gbmV3IE1vbmVyb1N1YmFkZHJlc3Moe2FkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICBzdWJhZGRyZXNzLnNldEFjY291bnRJbmRleChyZXNwLnJlc3VsdC5pbmRleC5tYWpvcik7XG4gICAgc3ViYWRkcmVzcy5zZXRJbmRleChyZXNwLnJlc3VsdC5pbmRleC5taW5vcik7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcz86IHN0cmluZywgcGF5bWVudElkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgaW50ZWdyYXRlZEFkZHJlc3NTdHIgPSAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibWFrZV9pbnRlZ3JhdGVkX2FkZHJlc3NcIiwge3N0YW5kYXJkX2FkZHJlc3M6IHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudF9pZDogcGF5bWVudElkfSkpLnJlc3VsdC5pbnRlZ3JhdGVkX2FkZHJlc3M7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5kZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzc1N0cik7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5tZXNzYWdlLmluY2x1ZGVzKFwiSW52YWxpZCBwYXltZW50IElEXCIpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIHBheW1lbnQgSUQ6IFwiICsgcGF5bWVudElkKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3BsaXRfaW50ZWdyYXRlZF9hZGRyZXNzXCIsIHtpbnRlZ3JhdGVkX2FkZHJlc3M6IGludGVncmF0ZWRBZGRyZXNzfSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcygpLnNldFN0YW5kYXJkQWRkcmVzcyhyZXNwLnJlc3VsdC5zdGFuZGFyZF9hZGRyZXNzKS5zZXRQYXltZW50SWQocmVzcC5yZXN1bHQucGF5bWVudF9pZCkuc2V0SW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3MpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9oZWlnaHRcIikpLnJlc3VsdC5oZWlnaHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGluZyB0aGUgY2hhaW4gaGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHRCeURhdGUoeWVhcjogbnVtYmVyLCBtb250aDogbnVtYmVyLCBkYXk6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3Qgc3VwcG9ydCBnZXR0aW5nIGEgaGVpZ2h0IGJ5IGRhdGVcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgYXNzZXJ0KCEobGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIpLCBcIk1vbmVybyBXYWxsZXQgUlBDIGRvZXMgbm90IHN1cHBvcnQgcmVwb3J0aW5nIHN5bmMgcHJvZ3Jlc3NcIik7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVmcmVzaFwiLCB7c3RhcnRfaGVpZ2h0OiBzdGFydEhlaWdodH0pO1xuICAgICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb1N5bmNSZXN1bHQocmVzcC5yZXN1bHQuYmxvY2tzX2ZldGNoZWQsIHJlc3AucmVzdWx0LnJlY2VpdmVkX21vbmV5KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgaWYgKGVyci5tZXNzYWdlID09PSBcIm5vIGNvbm5lY3Rpb24gdG8gZGFlbW9uXCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncz86IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIFxuICAgIC8vIGNvbnZlcnQgbXMgdG8gc2Vjb25kcyBmb3IgcnBjIHBhcmFtZXRlclxuICAgIGxldCBzeW5jUGVyaW9kSW5TZWNvbmRzID0gTWF0aC5yb3VuZCgoc3luY1BlcmlvZEluTXMgPT09IHVuZGVmaW5lZCA/IE1vbmVyb1dhbGxldFJwYy5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIDogc3luY1BlcmlvZEluTXMpIC8gMTAwMCk7XG4gICAgXG4gICAgLy8gc2VuZCBycGMgcmVxdWVzdFxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImF1dG9fcmVmcmVzaFwiLCB7XG4gICAgICBlbmFibGU6IHRydWUsXG4gICAgICBwZXJpb2Q6IHN5bmNQZXJpb2RJblNlY29uZHNcbiAgICB9KTtcbiAgICBcbiAgICAvLyB1cGRhdGUgc3luYyBwZXJpb2QgZm9yIHBvbGxlclxuICAgIHRoaXMuc3luY1BlcmlvZEluTXMgPSBzeW5jUGVyaW9kSW5TZWNvbmRzICogMTAwMDtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCkgdGhpcy53YWxsZXRQb2xsZXIuc2V0UGVyaW9kSW5Ncyh0aGlzLnN5bmNQZXJpb2RJbk1zKTtcbiAgICBcbiAgICAvLyBwb2xsIGlmIGxpc3RlbmluZ1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICB9XG5cbiAgZ2V0U3luY1BlcmlvZEluTXMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5zeW5jUGVyaW9kSW5NcztcbiAgfVxuICBcbiAgYXN5bmMgc3RvcFN5bmNpbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImF1dG9fcmVmcmVzaFwiLCB7IGVuYWJsZTogZmFsc2UgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0eEhhc2hlcyB8fCAhdHhIYXNoZXMubGVuZ3RoKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJObyB0eCBoYXNoZXMgZ2l2ZW4gdG8gc2NhblwiKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzY2FuX3R4XCIsIHt0eGlkczogdHhIYXNoZXN9KTtcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuU3BlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVzY2FuX3NwZW50XCIsIHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhbkJsb2NrY2hhaW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVzY2FuX2Jsb2NrY2hhaW5cIiwgdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0QmFsYW5jZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkpWzBdO1xuICB9XG4gIFxuICBhc3luYyBnZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbGFuY2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHRhZz86IHN0cmluZywgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvQWNjb3VudFtdPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggYWNjb3VudHMgZnJvbSBycGNcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hY2NvdW50c1wiLCB7dGFnOiB0YWd9KTtcbiAgICBcbiAgICAvLyBidWlsZCBhY2NvdW50IG9iamVjdHMgYW5kIGZldGNoIHN1YmFkZHJlc3NlcyBwZXIgYWNjb3VudCB1c2luZyBnZXRfYWRkcmVzc1xuICAgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IGdldF9hZGRyZXNzIHNob3VsZCBzdXBwb3J0IGFsbF9hY2NvdW50cyBzbyBub3QgY2FsbGVkIG9uY2UgcGVyIGFjY291bnRcbiAgICBsZXQgYWNjb3VudHM6IE1vbmVyb0FjY291bnRbXSA9IFtdO1xuICAgIGZvciAobGV0IHJwY0FjY291bnQgb2YgcmVzcC5yZXN1bHQuc3ViYWRkcmVzc19hY2NvdW50cykge1xuICAgICAgbGV0IGFjY291bnQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY0FjY291bnQocnBjQWNjb3VudCk7XG4gICAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcykgYWNjb3VudC5zZXRTdWJhZGRyZXNzZXMoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudC5nZXRJbmRleCgpLCB1bmRlZmluZWQsIHRydWUpKTtcbiAgICAgIGFjY291bnRzLnB1c2goYWNjb3VudCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGZldGNoIGFuZCBtZXJnZSBmaWVsZHMgZnJvbSBnZXRfYmFsYW5jZSBhY3Jvc3MgYWxsIGFjY291bnRzXG4gICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMgJiYgIXNraXBCYWxhbmNlcykge1xuICAgICAgXG4gICAgICAvLyB0aGVzZSBmaWVsZHMgYXJlIG5vdCBpbml0aWFsaXplZCBpZiBzdWJhZGRyZXNzIGlzIHVudXNlZCBhbmQgdGhlcmVmb3JlIG5vdCByZXR1cm5lZCBmcm9tIGBnZXRfYmFsYW5jZWBcbiAgICAgIGZvciAobGV0IGFjY291bnQgb2YgYWNjb3VudHMpIHtcbiAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpKSB7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKDApO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gZmV0Y2ggYW5kIG1lcmdlIGluZm8gZnJvbSBnZXRfYmFsYW5jZVxuICAgICAgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIsIHthbGxfYWNjb3VudHM6IHRydWV9KTtcbiAgICAgIGlmIChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICBmb3IgKGxldCBycGNTdWJhZGRyZXNzIG9mIHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3MgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gbWVyZ2UgaW5mb1xuICAgICAgICAgIGxldCBhY2NvdW50ID0gYWNjb3VudHNbc3ViYWRkcmVzcy5nZXRBY2NvdW50SW5kZXgoKV07XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsKHN1YmFkZHJlc3MuZ2V0QWNjb3VudEluZGV4KCksIGFjY291bnQuZ2V0SW5kZXgoKSwgXCJSUEMgYWNjb3VudHMgYXJlIG91dCBvZiBvcmRlclwiKTsgIC8vIHdvdWxkIG5lZWQgdG8gc3dpdGNoIGxvb2t1cCB0byBsb29wXG4gICAgICAgICAgbGV0IHRndFN1YmFkZHJlc3MgPSBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpW3N1YmFkZHJlc3MuZ2V0SW5kZXgoKV07XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSwgdGd0U3ViYWRkcmVzcy5nZXRJbmRleCgpLCBcIlJQQyBzdWJhZGRyZXNzZXMgYXJlIG91dCBvZiBvcmRlclwiKTtcbiAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpKTtcbiAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpKTtcbiAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gYWNjb3VudHM7XG4gIH1cbiAgXG4gIC8vIFRPRE86IGdldEFjY291bnRCeUluZGV4KCksIGdldEFjY291bnRCeVRhZygpXG4gIGFzeW5jIGdldEFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbiwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIGFzc2VydChhY2NvdW50SWR4ID49IDApO1xuICAgIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgdGhpcy5nZXRBY2NvdW50cygpKSB7XG4gICAgICBpZiAoYWNjb3VudC5nZXRJbmRleCgpID09PSBhY2NvdW50SWR4KSB7XG4gICAgICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzKSBhY2NvdW50LnNldFN1YmFkZHJlc3Nlcyhhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHNraXBCYWxhbmNlcykpO1xuICAgICAgICByZXR1cm4gYWNjb3VudDtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQWNjb3VudCB3aXRoIGluZGV4IFwiICsgYWNjb3VudElkeCArIFwiIGRvZXMgbm90IGV4aXN0XCIpO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlQWNjb3VudChsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIGxhYmVsID0gbGFiZWwgPyBsYWJlbCA6IHVuZGVmaW5lZDtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNyZWF0ZV9hY2NvdW50XCIsIHtsYWJlbDogbGFiZWx9KTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0FjY291bnQoe1xuICAgICAgaW5kZXg6IHJlc3AucmVzdWx0LmFjY291bnRfaW5kZXgsXG4gICAgICBwcmltYXJ5QWRkcmVzczogcmVzcC5yZXN1bHQuYWRkcmVzcyxcbiAgICAgIGxhYmVsOiBsYWJlbCxcbiAgICAgIGJhbGFuY2U6IEJpZ0ludCgwKSxcbiAgICAgIHVubG9ja2VkQmFsYW5jZTogQmlnSW50KDApXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBnZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSW5kaWNlcz86IG51bWJlcltdLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzW10+IHtcbiAgICBcbiAgICAvLyBmZXRjaCBzdWJhZGRyZXNzZXNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgaWYgKHN1YmFkZHJlc3NJbmRpY2VzKSBwYXJhbXMuYWRkcmVzc19pbmRleCA9IEdlblV0aWxzLmxpc3RpZnkoc3ViYWRkcmVzc0luZGljZXMpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NcIiwgcGFyYW1zKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHN1YmFkZHJlc3Nlc1xuICAgIGxldCBzdWJhZGRyZXNzZXMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNTdWJhZGRyZXNzIG9mIHJlc3AucmVzdWx0LmFkZHJlc3Nlcykge1xuICAgICAgbGV0IHN1YmFkZHJlc3MgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcyk7XG4gICAgICBzdWJhZGRyZXNzLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIHN1YmFkZHJlc3Nlcy5wdXNoKHN1YmFkZHJlc3MpO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgaW5pdGlhbGl6ZSBzdWJhZGRyZXNzIGJhbGFuY2VzXG4gICAgaWYgKCFza2lwQmFsYW5jZXMpIHtcbiAgICAgIFxuICAgICAgLy8gdGhlc2UgZmllbGRzIGFyZSBub3QgaW5pdGlhbGl6ZWQgaWYgc3ViYWRkcmVzcyBpcyB1bnVzZWQgYW5kIHRoZXJlZm9yZSBub3QgcmV0dXJuZWQgZnJvbSBgZ2V0X2JhbGFuY2VgXG4gICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIHN1YmFkZHJlc3Nlcykge1xuICAgICAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cygwKTtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jaygwKTtcbiAgICAgIH1cblxuICAgICAgLy8gZmV0Y2ggYW5kIGluaXRpYWxpemUgYmFsYW5jZXNcbiAgICAgIHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCBwYXJhbXMpO1xuICAgICAgaWYgKHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgIGZvciAobGV0IHJwY1N1YmFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzcyA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyB0cmFuc2ZlciBpbmZvIHRvIGV4aXN0aW5nIHN1YmFkZHJlc3Mgb2JqZWN0XG4gICAgICAgICAgZm9yIChsZXQgdGd0U3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgICAgICAgIGlmICh0Z3RTdWJhZGRyZXNzLmdldEluZGV4KCkgIT09IHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSkgY29udGludWU7IC8vIHNraXAgdG8gc3ViYWRkcmVzcyB3aXRoIHNhbWUgaW5kZXhcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldE51bUJsb2Nrc1RvVW5sb2NrKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jayhzdWJhZGRyZXNzLmdldE51bUJsb2Nrc1RvVW5sb2NrKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSBhZGRyZXNzZXNcbiAgICBsZXQgc3ViYWRkcmVzc01hcCA9IHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdO1xuICAgIGlmICghc3ViYWRkcmVzc01hcCkge1xuICAgICAgc3ViYWRkcmVzc01hcCA9IHt9O1xuICAgICAgdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF0gPSBzdWJhZGRyZXNzTWFwO1xuICAgIH1cbiAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIHN1YmFkZHJlc3Nlcykge1xuICAgICAgc3ViYWRkcmVzc01hcFtzdWJhZGRyZXNzLmdldEluZGV4KCldID0gc3ViYWRkcmVzcy5nZXRBZGRyZXNzKCk7XG4gICAgfVxuICAgIFxuICAgIC8vIHJldHVybiByZXN1bHRzXG4gICAgcmV0dXJuIHN1YmFkZHJlc3NlcztcbiAgfVxuXG4gIGFzeW5jIGdldFN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBhc3NlcnQoYWNjb3VudElkeCA+PSAwKTtcbiAgICBhc3NlcnQoc3ViYWRkcmVzc0lkeCA+PSAwKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIFtzdWJhZGRyZXNzSWR4XSwgc2tpcEJhbGFuY2VzKSlbMF07XG4gIH1cblxuICBhc3luYyBjcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNyZWF0ZV9hZGRyZXNzXCIsIHthY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LCBsYWJlbDogbGFiZWx9KTtcbiAgICBcbiAgICAvLyBidWlsZCBzdWJhZGRyZXNzIG9iamVjdFxuICAgIGxldCBzdWJhZGRyZXNzID0gbmV3IE1vbmVyb1N1YmFkZHJlc3MoKTtcbiAgICBzdWJhZGRyZXNzLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICBzdWJhZGRyZXNzLnNldEluZGV4KHJlc3AucmVzdWx0LmFkZHJlc3NfaW5kZXgpO1xuICAgIHN1YmFkZHJlc3Muc2V0QWRkcmVzcyhyZXNwLnJlc3VsdC5hZGRyZXNzKTtcbiAgICBzdWJhZGRyZXNzLnNldExhYmVsKGxhYmVsID8gbGFiZWwgOiB1bmRlZmluZWQpO1xuICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cygwKTtcbiAgICBzdWJhZGRyZXNzLnNldElzVXNlZChmYWxzZSk7XG4gICAgc3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jaygwKTtcbiAgICByZXR1cm4gc3ViYWRkcmVzcztcbiAgfVxuXG4gIGFzeW5jIHNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImxhYmVsX2FkZHJlc3NcIiwge2luZGV4OiB7bWFqb3I6IGFjY291bnRJZHgsIG1pbm9yOiBzdWJhZGRyZXNzSWR4fSwgbGFiZWw6IGxhYmVsfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyhxdWVyeT86IHN0cmluZ1tdIHwgUGFydGlhbDxNb25lcm9UeFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIGNvcHkgcXVlcnlcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHhRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gdGVtcG9yYXJpbHkgZGlzYWJsZSB0cmFuc2ZlciBhbmQgb3V0cHV0IHF1ZXJpZXMgaW4gb3JkZXIgdG8gY29sbGVjdCBhbGwgdHggaW5mb3JtYXRpb25cbiAgICBsZXQgdHJhbnNmZXJRdWVyeSA9IHF1ZXJ5Tm9ybWFsaXplZC5nZXRUcmFuc2ZlclF1ZXJ5KCk7XG4gICAgbGV0IGlucHV0UXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0SW5wdXRRdWVyeSgpO1xuICAgIGxldCBvdXRwdXRRdWVyeSA9IHF1ZXJ5Tm9ybWFsaXplZC5nZXRPdXRwdXRRdWVyeSgpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRUcmFuc2ZlclF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldElucHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0T3V0cHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICBcbiAgICAvLyBmZXRjaCBhbGwgdHJhbnNmZXJzIHRoYXQgbWVldCB0eCBxdWVyeVxuICAgIGxldCB0cmFuc2ZlcnMgPSBhd2FpdCB0aGlzLmdldFRyYW5zZmVyc0F1eChuZXcgTW9uZXJvVHJhbnNmZXJRdWVyeSgpLnNldFR4UXVlcnkoTW9uZXJvV2FsbGV0UnBjLmRlY29udGV4dHVhbGl6ZShxdWVyeU5vcm1hbGl6ZWQuY29weSgpKSkpO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdW5pcXVlIHR4cyBmcm9tIHRyYW5zZmVycyB3aGlsZSByZXRhaW5pbmcgb3JkZXJcbiAgICBsZXQgdHhzID0gW107XG4gICAgbGV0IHR4c1NldCA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0cmFuc2ZlcnMpIHtcbiAgICAgIGlmICghdHhzU2V0Lmhhcyh0cmFuc2Zlci5nZXRUeCgpKSkge1xuICAgICAgICB0eHMucHVzaCh0cmFuc2Zlci5nZXRUeCgpKTtcbiAgICAgICAgdHhzU2V0LmFkZCh0cmFuc2Zlci5nZXRUeCgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgdHlwZXMgaW50byBtYXBzIGZvciBtZXJnaW5nIGFuZCBsb29rdXBcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgbWVyZ2Ugb3V0cHV0cyBpZiByZXF1ZXN0ZWRcbiAgICBpZiAocXVlcnlOb3JtYWxpemVkLmdldEluY2x1ZGVPdXRwdXRzKCkgfHwgb3V0cHV0UXVlcnkpIHtcbiAgICAgICAgXG4gICAgICAvLyBmZXRjaCBvdXRwdXRzXG4gICAgICBsZXQgb3V0cHV0UXVlcnlBdXggPSAob3V0cHV0UXVlcnkgPyBvdXRwdXRRdWVyeS5jb3B5KCkgOiBuZXcgTW9uZXJvT3V0cHV0UXVlcnkoKSkuc2V0VHhRdWVyeShNb25lcm9XYWxsZXRScGMuZGVjb250ZXh0dWFsaXplKHF1ZXJ5Tm9ybWFsaXplZC5jb3B5KCkpKTtcbiAgICAgIGxldCBvdXRwdXRzID0gYXdhaXQgdGhpcy5nZXRPdXRwdXRzQXV4KG91dHB1dFF1ZXJ5QXV4KTtcbiAgICAgIFxuICAgICAgLy8gbWVyZ2Ugb3V0cHV0IHR4cyBvbmUgdGltZSB3aGlsZSByZXRhaW5pbmcgb3JkZXJcbiAgICAgIGxldCBvdXRwdXRUeHMgPSBbXTtcbiAgICAgIGZvciAobGV0IG91dHB1dCBvZiBvdXRwdXRzKSB7XG4gICAgICAgIGlmICghb3V0cHV0VHhzLmluY2x1ZGVzKG91dHB1dC5nZXRUeCgpKSkge1xuICAgICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KG91dHB1dC5nZXRUeCgpLCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgICAgIG91dHB1dFR4cy5wdXNoKG91dHB1dC5nZXRUeCgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyByZXN0b3JlIHRyYW5zZmVyIGFuZCBvdXRwdXQgcXVlcmllc1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRUcmFuc2ZlclF1ZXJ5KHRyYW5zZmVyUXVlcnkpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRJbnB1dFF1ZXJ5KGlucHV0UXVlcnkpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRPdXRwdXRRdWVyeShvdXRwdXRRdWVyeSk7XG4gICAgXG4gICAgLy8gZmlsdGVyIHR4cyB0aGF0IGRvbid0IG1lZXQgdHJhbnNmZXIgcXVlcnlcbiAgICBsZXQgdHhzUXVlcmllZCA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5tZWV0c0NyaXRlcmlhKHR4KSkgdHhzUXVlcmllZC5wdXNoKHR4KTtcbiAgICAgIGVsc2UgaWYgKHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCkgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgfVxuICAgIHR4cyA9IHR4c1F1ZXJpZWQ7XG4gICAgXG4gICAgLy8gc3BlY2lhbCBjYXNlOiByZS1mZXRjaCB0eHMgaWYgaW5jb25zaXN0ZW5jeSBjYXVzZWQgYnkgbmVlZGluZyB0byBtYWtlIG11bHRpcGxlIHJwYyBjYWxsc1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkgJiYgdHguZ2V0QmxvY2soKSA9PT0gdW5kZWZpbmVkIHx8ICF0eC5nZXRJc0NvbmZpcm1lZCgpICYmIHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiSW5jb25zaXN0ZW5jeSBkZXRlY3RlZCBidWlsZGluZyB0eHMgZnJvbSBtdWx0aXBsZSBycGMgY2FsbHMsIHJlLWZldGNoaW5nIHR4c1wiKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VHhzKHF1ZXJ5Tm9ybWFsaXplZCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIG9yZGVyIHR4cyBpZiB0eCBoYXNoZXMgZ2l2ZW4gdGhlbiByZXR1cm5cbiAgICBpZiAocXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpICYmIHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKS5sZW5ndGggPiAwKSB7XG4gICAgICBsZXQgdHhzQnlJZCA9IG5ldyBNYXAoKSAgLy8gc3RvcmUgdHhzIGluIHRlbXBvcmFyeSBtYXAgZm9yIHNvcnRpbmdcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykgdHhzQnlJZC5zZXQodHguZ2V0SGFzaCgpLCB0eCk7XG4gICAgICBsZXQgb3JkZXJlZFR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgaGFzaCBvZiBxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkpIGlmICh0eHNCeUlkLmdldChoYXNoKSkgb3JkZXJlZFR4cy5wdXNoKHR4c0J5SWQuZ2V0KGhhc2gpKTtcbiAgICAgIHR4cyA9IG9yZGVyZWRUeHM7XG4gICAgfVxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1RyYW5zZmVyW10+IHtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gZ2V0IHRyYW5zZmVycyBkaXJlY3RseSBpZiBxdWVyeSBkb2VzIG5vdCByZXF1aXJlIHR4IGNvbnRleHQgKG90aGVyIHRyYW5zZmVycywgb3V0cHV0cylcbiAgICBpZiAoIU1vbmVyb1dhbGxldFJwYy5pc0NvbnRleHR1YWwocXVlcnlOb3JtYWxpemVkKSkgcmV0dXJuIHRoaXMuZ2V0VHJhbnNmZXJzQXV4KHF1ZXJ5Tm9ybWFsaXplZCk7XG4gICAgXG4gICAgLy8gb3RoZXJ3aXNlIGdldCB0eHMgd2l0aCBmdWxsIG1vZGVscyB0byBmdWxmaWxsIHF1ZXJ5XG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMuZ2V0VHhzKHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkpKSB7XG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5maWx0ZXJUcmFuc2ZlcnMocXVlcnlOb3JtYWxpemVkKSkge1xuICAgICAgICB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb091dHB1dFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvT3V0cHV0V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplT3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIGdldCBvdXRwdXRzIGRpcmVjdGx5IGlmIHF1ZXJ5IGRvZXMgbm90IHJlcXVpcmUgdHggY29udGV4dCAob3RoZXIgb3V0cHV0cywgdHJhbnNmZXJzKVxuICAgIGlmICghTW9uZXJvV2FsbGV0UnBjLmlzQ29udGV4dHVhbChxdWVyeU5vcm1hbGl6ZWQpKSByZXR1cm4gdGhpcy5nZXRPdXRwdXRzQXV4KHF1ZXJ5Tm9ybWFsaXplZCk7XG4gICAgXG4gICAgLy8gb3RoZXJ3aXNlIGdldCB0eHMgd2l0aCBmdWxsIG1vZGVscyB0byBmdWxmaWxsIHF1ZXJ5XG4gICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLmdldFR4cyhxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpKSkge1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmZpbHRlck91dHB1dHMocXVlcnlOb3JtYWxpemVkKSkge1xuICAgICAgICBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dHB1dHM7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE91dHB1dHMoYWxsID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X291dHB1dHNcIiwge2FsbDogYWxsfSkpLnJlc3VsdC5vdXRwdXRzX2RhdGFfaGV4O1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXg6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbXBvcnRfb3V0cHV0c1wiLCB7b3V0cHV0c19kYXRhX2hleDogb3V0cHV0c0hleH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5udW1faW1wb3J0ZWQ7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydEtleUltYWdlcyhhbGwgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnJwY0V4cG9ydEtleUltYWdlcyhhbGwpO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzOiBNb25lcm9LZXlJbWFnZVtdKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD4ge1xuICAgIFxuICAgIC8vIGNvbnZlcnQga2V5IGltYWdlcyB0byBycGMgcGFyYW1ldGVyXG4gICAgbGV0IHJwY0tleUltYWdlcyA9IGtleUltYWdlcy5tYXAoa2V5SW1hZ2UgPT4gKHtrZXlfaW1hZ2U6IGtleUltYWdlLmdldEhleCgpLCBzaWduYXR1cmU6IGtleUltYWdlLmdldFNpZ25hdHVyZSgpfSkpO1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW1wb3J0X2tleV9pbWFnZXNcIiwge3NpZ25lZF9rZXlfaW1hZ2VzOiBycGNLZXlJbWFnZXN9KTtcbiAgICBcbiAgICAvLyBidWlsZCBhbmQgcmV0dXJuIHJlc3VsdFxuICAgIGxldCBpbXBvcnRSZXN1bHQgPSBuZXcgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQoKTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0SGVpZ2h0KHJlc3AucmVzdWx0LmhlaWdodCk7XG4gICAgaW1wb3J0UmVzdWx0LnNldFNwZW50QW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5zcGVudCkpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRVbnNwZW50QW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC51bnNwZW50KSk7XG4gICAgcmV0dXJuIGltcG9ydFJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucnBjRXhwb3J0S2V5SW1hZ2VzKGZhbHNlKTtcbiAgfVxuICBcbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZnJlZXplXCIsIHtrZXlfaW1hZ2U6IGtleUltYWdlfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRoYXdPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ0aGF3XCIsIHtrZXlfaW1hZ2U6IGtleUltYWdlfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzT3V0cHV0RnJvemVuKGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImZyb3plblwiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5mcm96ZW4gPT09IHRydWU7XG4gIH1cblxuICBhc3luYyBnZXREZWZhdWx0RmVlUHJpb3JpdHkoKTogUHJvbWlzZTxNb25lcm9UeFByaW9yaXR5PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfZGVmYXVsdF9mZWVfcHJpb3JpdHlcIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnByaW9yaXR5O1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlLCBjb3B5LCBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWdOb3JtYWxpemVkLnNldENhblNwbGl0KHRydWUpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkgPT09IHRydWUgJiYgYXdhaXQgdGhpcy5pc011bHRpc2lnKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCByZWxheSBtdWx0aXNpZyB0cmFuc2FjdGlvbiB1bnRpbCBjby1zaWduZWRcIik7XG5cbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzc2VzIHRvIHNlbmQgZnJvbVxuICAgIGxldCBhY2NvdW50SWR4ID0gY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgdGhlIGFjY291bnQgaW5kZXggdG8gc2VuZCBmcm9tXCIpO1xuICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnNsaWNlKDApOyAvLyBmZXRjaCBhbGwgb3IgY29weSBnaXZlbiBpbmRpY2VzXG4gICAgXG4gICAgLy8gYnVpbGQgY29uZmlnIHBhcmFtZXRlcnNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuZGVzdGluYXRpb25zID0gW107XG4gICAgZm9yIChsZXQgZGVzdGluYXRpb24gb2YgY29uZmlnTm9ybWFsaXplZC5nZXREZXN0aW5hdGlvbnMoKSkge1xuICAgICAgYXNzZXJ0KGRlc3RpbmF0aW9uLmdldEFkZHJlc3MoKSwgXCJEZXN0aW5hdGlvbiBhZGRyZXNzIGlzIG5vdCBkZWZpbmVkXCIpO1xuICAgICAgYXNzZXJ0KGRlc3RpbmF0aW9uLmdldEFtb3VudCgpLCBcIkRlc3RpbmF0aW9uIGFtb3VudCBpcyBub3QgZGVmaW5lZFwiKTtcbiAgICAgIHBhcmFtcy5kZXN0aW5hdGlvbnMucHVzaCh7IGFkZHJlc3M6IGRlc3RpbmF0aW9uLmdldEFkZHJlc3MoKSwgYW1vdW50OiBkZXN0aW5hdGlvbi5nZXRBbW91bnQoKS50b1N0cmluZygpIH0pO1xuICAgIH1cbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKSkgcGFyYW1zLnN1YnRyYWN0X2ZlZV9mcm9tX291dHB1dHMgPSBjb25maWdOb3JtYWxpemVkLmdldFN1YnRyYWN0RmVlRnJvbSgpO1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gYWNjb3VudElkeDtcbiAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gc3ViYWRkcmVzc0luZGljZXM7XG4gICAgcGFyYW1zLnBheW1lbnRfaWQgPSBjb25maWdOb3JtYWxpemVkLmdldFBheW1lbnRJZCgpO1xuICAgIHBhcmFtcy5kb19ub3RfcmVsYXkgPSBjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkgIT09IHRydWU7XG4gICAgYXNzZXJ0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKSA+PSAwICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCk7XG4gICAgcGFyYW1zLmdldF90eF9oZXggPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfbWV0YWRhdGEgPSB0cnVlO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkpIHBhcmFtcy5nZXRfdHhfa2V5cyA9IHRydWU7IC8vIHBhcmFtIHRvIGdldCB0eCBrZXkocykgZGVwZW5kcyBpZiBzcGxpdFxuICAgIGVsc2UgcGFyYW1zLmdldF90eF9rZXkgPSB0cnVlO1xuXG4gICAgLy8gY2Fubm90IGFwcGx5IHN1YnRyYWN0RmVlRnJvbSB3aXRoIGB0cmFuc2Zlcl9zcGxpdGAgY2FsbFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKSAmJiBjb25maWdOb3JtYWxpemVkLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcInN1YnRyYWN0ZmVlZnJvbSB0cmFuc2ZlcnMgY2Fubm90IGJlIHNwbGl0IG92ZXIgbXVsdGlwbGUgdHJhbnNhY3Rpb25zIHlldFwiKTtcbiAgICB9XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3VsdDtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpID8gXCJ0cmFuc2Zlcl9zcGxpdFwiIDogXCJ0cmFuc2ZlclwiLCBwYXJhbXMpO1xuICAgICAgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZS5pbmRleE9mKFwiV0FMTEVUX1JQQ19FUlJPUl9DT0RFX1dST05HX0FERFJFU1NcIikgPiAtMSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBkZXN0aW5hdGlvbiBhZGRyZXNzXCIpO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgICBcbiAgICAvLyBwcmUtaW5pdGlhbGl6ZSB0eHMgaWZmIHByZXNlbnQuIG11bHRpc2lnIGFuZCB2aWV3LW9ubHkgd2FsbGV0cyB3aWxsIGhhdmUgdHggc2V0IHdpdGhvdXQgdHJhbnNhY3Rpb25zXG4gICAgbGV0IHR4cztcbiAgICBsZXQgbnVtVHhzID0gY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpID8gKHJlc3VsdC5mZWVfbGlzdCAhPT0gdW5kZWZpbmVkID8gcmVzdWx0LmZlZV9saXN0Lmxlbmd0aCA6IDApIDogKHJlc3VsdC5mZWUgIT09IHVuZGVmaW5lZCA/IDEgOiAwKTtcbiAgICBpZiAobnVtVHhzID4gMCkgdHhzID0gW107XG4gICAgbGV0IGNvcHlEZXN0aW5hdGlvbnMgPSBudW1UeHMgPT09IDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UeHM7IGkrKykge1xuICAgICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgICBNb25lcm9XYWxsZXRScGMuaW5pdFNlbnRUeFdhbGxldChjb25maWdOb3JtYWxpemVkLCB0eCwgY29weURlc3RpbmF0aW9ucyk7XG4gICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJbmRpY2VzICE9PSB1bmRlZmluZWQgJiYgc3ViYWRkcmVzc0luZGljZXMubGVuZ3RoID09PSAxKSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0U3ViYWRkcmVzc0luZGljZXMoc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgdHhzLnB1c2godHgpO1xuICAgIH1cbiAgICBcbiAgICAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkpIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggc2V0IGZyb20gcnBjIHJlc3BvbnNlIHdpdGggcHJlLWluaXRpYWxpemVkIHR4c1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkpIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCwgdHhzLCBjb25maWdOb3JtYWxpemVkKS5nZXRUeHMoKTtcbiAgICBlbHNlIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4VG9UeFNldChyZXN1bHQsIHR4cyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdHhzWzBdLCB0cnVlLCBjb25maWdOb3JtYWxpemVkKS5nZXRUeHMoKTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBPdXRwdXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyhjb25maWcpO1xuICAgIFxuICAgIC8vIGJ1aWxkIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hZGRyZXNzID0gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCk7XG4gICAgcGFyYW1zLmtleV9pbWFnZSA9IGNvbmZpZy5nZXRLZXlJbWFnZSgpO1xuICAgIHBhcmFtcy5kb19ub3RfcmVsYXkgPSBjb25maWcuZ2V0UmVsYXkoKSAhPT0gdHJ1ZTtcbiAgICBhc3NlcnQoY29uZmlnLmdldFByaW9yaXR5KCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpb3JpdHkoKSA+PSAwICYmIGNvbmZpZy5nZXRQcmlvcml0eSgpIDw9IDMpO1xuICAgIHBhcmFtcy5wcmlvcml0eSA9IGNvbmZpZy5nZXRQcmlvcml0eSgpO1xuICAgIHBhcmFtcy5wYXltZW50X2lkID0gY29uZmlnLmdldFBheW1lbnRJZCgpO1xuICAgIHBhcmFtcy5nZXRfdHhfa2V5ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X2hleCA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9tZXRhZGF0YSA9IHRydWU7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzd2VlcF9zaW5nbGVcIiwgcGFyYW1zKTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnLmdldFJlbGF5KCkpIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIFxuICAgIC8vIGJ1aWxkIGFuZCByZXR1cm4gdHhcbiAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuaW5pdFNlbnRUeFdhbGxldChjb25maWcsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFRvVHhTZXQocmVzdWx0LCB0eCwgdHJ1ZSwgY29uZmlnKTtcbiAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKClbMF0uc2V0QW1vdW50KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBbW91bnQoKSk7IC8vIGluaXRpYWxpemUgZGVzdGluYXRpb24gYW1vdW50XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBhc3luYyBzd2VlcFVubG9ja2VkKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyhjb25maWcpO1xuICAgIFxuICAgIC8vIGRldGVybWluZSBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMgdG8gc3dlZXA7IGRlZmF1bHQgdG8gYWxsIHdpdGggdW5sb2NrZWQgYmFsYW5jZSBpZiBub3Qgc3BlY2lmaWVkXG4gICAgbGV0IGluZGljZXMgPSBuZXcgTWFwKCk7ICAvLyBtYXBzIGVhY2ggYWNjb3VudCBpbmRleCB0byBzdWJhZGRyZXNzIGluZGljZXMgdG8gc3dlZXBcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaW5kaWNlcy5zZXQoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSwgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzSW5kaWNlcygpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgICAgICBpbmRpY2VzLnNldChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpLCBzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSkpIHtcbiAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSA+IDBuKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGFjY291bnRzID0gYXdhaXQgdGhpcy5nZXRBY2NvdW50cyh0cnVlKTtcbiAgICAgIGZvciAobGV0IGFjY291bnQgb2YgYWNjb3VudHMpIHtcbiAgICAgICAgaWYgKGFjY291bnQuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgPiAwbikge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgICAgICAgIGluZGljZXMuc2V0KGFjY291bnQuZ2V0SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkge1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgPiAwbikgc3ViYWRkcmVzc0luZGljZXMucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzd2VlcCBmcm9tIGVhY2ggYWNjb3VudCBhbmQgY29sbGVjdCByZXN1bHRpbmcgdHggc2V0c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBmb3IgKGxldCBhY2NvdW50SWR4IG9mIGluZGljZXMua2V5cygpKSB7XG4gICAgICBcbiAgICAgIC8vIGNvcHkgYW5kIG1vZGlmeSB0aGUgb3JpZ2luYWwgY29uZmlnXG4gICAgICBsZXQgY29weSA9IGNvbmZpZ05vcm1hbGl6ZWQuY29weSgpO1xuICAgICAgY29weS5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgICBjb3B5LnNldFN3ZWVwRWFjaFN1YmFkZHJlc3MoZmFsc2UpO1xuICAgICAgXG4gICAgICAvLyBzd2VlcCBhbGwgc3ViYWRkcmVzc2VzIHRvZ2V0aGVyICAvLyBUT0RPIG1vbmVyby1wcm9qZWN0OiBjYW4gdGhpcyByZXZlYWwgb3V0cHV0cyBiZWxvbmcgdG8gdGhlIHNhbWUgd2FsbGV0P1xuICAgICAgaWYgKGNvcHkuZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcygpICE9PSB0cnVlKSB7XG4gICAgICAgIGNvcHkuc2V0U3ViYWRkcmVzc0luZGljZXMoaW5kaWNlcy5nZXQoYWNjb3VudElkeCkpO1xuICAgICAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLnJwY1N3ZWVwQWNjb3VudChjb3B5KSkgdHhzLnB1c2godHgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBvdGhlcndpc2Ugc3dlZXAgZWFjaCBzdWJhZGRyZXNzIGluZGl2aWR1YWxseVxuICAgICAgZWxzZSB7XG4gICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3NJZHggb2YgaW5kaWNlcy5nZXQoYWNjb3VudElkeCkpIHtcbiAgICAgICAgICBjb3B5LnNldFN1YmFkZHJlc3NJbmRpY2VzKFtzdWJhZGRyZXNzSWR4XSk7XG4gICAgICAgICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5ycGNTd2VlcEFjY291bnQoY29weSkpIHR4cy5wdXNoKHR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkpIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwRHVzdChyZWxheT86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAocmVsYXkgPT09IHVuZGVmaW5lZCkgcmVsYXkgPSBmYWxzZTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN3ZWVwX2R1c3RcIiwge2RvX25vdF9yZWxheTogIXJlbGF5fSk7XG4gICAgaWYgKHJlbGF5KSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQpO1xuICAgIGlmICh0eFNldC5nZXRUeHMoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhTZXQuZ2V0VHhzKCkpIHtcbiAgICAgIHR4LnNldElzUmVsYXllZCghcmVsYXkpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHguZ2V0SXNSZWxheWVkKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdHhTZXQuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzKHR4c09yTWV0YWRhdGFzOiAoTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhzT3JNZXRhZGF0YXMpLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0eHMgb3IgdGhlaXIgbWV0YWRhdGEgdG8gcmVsYXlcIik7XG4gICAgbGV0IHR4SGFzaGVzID0gW107XG4gICAgZm9yIChsZXQgdHhPck1ldGFkYXRhIG9mIHR4c09yTWV0YWRhdGFzKSB7XG4gICAgICBsZXQgbWV0YWRhdGEgPSB0eE9yTWV0YWRhdGEgaW5zdGFuY2VvZiBNb25lcm9UeFdhbGxldCA/IHR4T3JNZXRhZGF0YS5nZXRNZXRhZGF0YSgpIDogdHhPck1ldGFkYXRhO1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZWxheV90eFwiLCB7IGhleDogbWV0YWRhdGEgfSk7XG4gICAgICB0eEhhc2hlcy5wdXNoKHJlc3AucmVzdWx0LnR4X2hhc2gpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnBvbGwoKTsgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICByZXR1cm4gdHhIYXNoZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGRlc2NyaWJlVHhTZXQodHhTZXQ6IE1vbmVyb1R4U2V0KTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZGVzY3JpYmVfdHJhbnNmZXJcIiwge1xuICAgICAgdW5zaWduZWRfdHhzZXQ6IHR4U2V0LmdldFVuc2lnbmVkVHhIZXgoKSxcbiAgICAgIG11bHRpc2lnX3R4c2V0OiB0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KClcbiAgICB9KTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNEZXNjcmliZVRyYW5zZmVyKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnblR4cyh1bnNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzaWduX3RyYW5zZmVyXCIsIHtcbiAgICAgIHVuc2lnbmVkX3R4c2V0OiB1bnNpZ25lZFR4SGV4LFxuICAgICAgZXhwb3J0X3JhdzogZmFsc2VcbiAgICB9KTtcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4cyhzaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3VibWl0X3RyYW5zZmVyXCIsIHtcbiAgICAgIHR4X2RhdGFfaGV4OiBzaWduZWRUeEhleFxuICAgIH0pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC50eF9oYXNoX2xpc3Q7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgc2lnbmF0dXJlVHlwZSA9IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVksIGFjY291bnRJZHggPSAwLCBzdWJhZGRyZXNzSWR4ID0gMCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzaWduXCIsIHtcbiAgICAgICAgZGF0YTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlX3R5cGU6IHNpZ25hdHVyZVR5cGUgPT09IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVkgPyBcInNwZW5kXCIgOiBcInZpZXdcIixcbiAgICAgICAgYWNjb3VudF9pbmRleDogYWNjb3VudElkeCxcbiAgICAgICAgYWRkcmVzc19pbmRleDogc3ViYWRkcmVzc0lkeFxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gIH1cbiAgXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0PiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidmVyaWZ5XCIsIHtkYXRhOiBtZXNzYWdlLCBhZGRyZXNzOiBhZGRyZXNzLCBzaWduYXR1cmU6IHNpZ25hdHVyZX0pO1xuICAgICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KFxuICAgICAgICByZXN1bHQuZ29vZCA/IHtpc0dvb2Q6IHJlc3VsdC5nb29kLCBpc09sZDogcmVzdWx0Lm9sZCwgc2lnbmF0dXJlVHlwZTogcmVzdWx0LnNpZ25hdHVyZV90eXBlID09PSBcInZpZXdcIiA/IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9WSUVXX0tFWSA6IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVksIHZlcnNpb246IHJlc3VsdC52ZXJzaW9ufSA6IHtpc0dvb2Q6IGZhbHNlfVxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTIpIHJldHVybiBuZXcgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCh7aXNHb29kOiBmYWxzZX0pO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4S2V5KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHhfa2V5XCIsIHt0eGlkOiB0eEhhc2h9KSkucmVzdWx0LnR4X2tleTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2g6IHN0cmluZywgdHhLZXk6IHN0cmluZywgYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgdHJ5IHtcbiAgICAgIFxuICAgICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3R4X2tleVwiLCB7dHhpZDogdHhIYXNoLCB0eF9rZXk6IHR4S2V5LCBhZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgICBcbiAgICAgIC8vIGludGVycHJldCByZXN1bHRcbiAgICAgIGxldCBjaGVjayA9IG5ldyBNb25lcm9DaGVja1R4KCk7XG4gICAgICBjaGVjay5zZXRJc0dvb2QodHJ1ZSk7XG4gICAgICBjaGVjay5zZXROdW1Db25maXJtYXRpb25zKHJlc3AucmVzdWx0LmNvbmZpcm1hdGlvbnMpO1xuICAgICAgY2hlY2suc2V0SW5UeFBvb2wocmVzcC5yZXN1bHQuaW5fcG9vbCk7XG4gICAgICBjaGVjay5zZXRSZWNlaXZlZEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQucmVjZWl2ZWQpKTtcbiAgICAgIHJldHVybiBjaGVjaztcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHhfcHJvb2ZcIiwge3R4aWQ6IHR4SGFzaCwgYWRkcmVzczogYWRkcmVzcywgbWVzc2FnZTogbWVzc2FnZX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfdHhfcHJvb2ZcIiwge1xuICAgICAgICB0eGlkOiB0eEhhc2gsXG4gICAgICAgIGFkZHJlc3M6IGFkZHJlc3MsXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gaW50ZXJwcmV0IHJlc3BvbnNlXG4gICAgICBsZXQgaXNHb29kID0gcmVzcC5yZXN1bHQuZ29vZDtcbiAgICAgIGxldCBjaGVjayA9IG5ldyBNb25lcm9DaGVja1R4KCk7XG4gICAgICBjaGVjay5zZXRJc0dvb2QoaXNHb29kKTtcbiAgICAgIGlmIChpc0dvb2QpIHtcbiAgICAgICAgY2hlY2suc2V0TnVtQ29uZmlybWF0aW9ucyhyZXNwLnJlc3VsdC5jb25maXJtYXRpb25zKTtcbiAgICAgICAgY2hlY2suc2V0SW5UeFBvb2wocmVzcC5yZXN1bHQuaW5fcG9vbCk7XG4gICAgICAgIGNoZWNrLnNldFJlY2VpdmVkQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5yZWNlaXZlZCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNoZWNrO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTEgJiYgZS5tZXNzYWdlID09PSBcImJhc2ljX3N0cmluZ1wiKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiTXVzdCBwcm92aWRlIHNpZ25hdHVyZSB0byBjaGVjayB0eCBwcm9vZlwiLCAtMSk7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3NwZW5kX3Byb29mXCIsIHt0eGlkOiB0eEhhc2gsIG1lc3NhZ2U6IG1lc3NhZ2V9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrU3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3NwZW5kX3Byb29mXCIsIHtcbiAgICAgICAgdHhpZDogdHhIYXNoLFxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzaWduYXR1cmU6IHNpZ25hdHVyZVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuZ29vZDtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3Jlc2VydmVfcHJvb2ZcIiwge1xuICAgICAgYWxsOiB0cnVlLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBhbW91bnQ6IGJpZ2ludCwgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LFxuICAgICAgYW1vdW50OiBhbW91bnQudG9TdHJpbmcoKSxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICB9XG5cbiAgYXN5bmMgY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1Jlc2VydmU+IHtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3Jlc2VydmVfcHJvb2ZcIiwge1xuICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICBzaWduYXR1cmU6IHNpZ25hdHVyZVxuICAgIH0pO1xuICAgIFxuICAgIC8vIGludGVycHJldCByZXN1bHRzXG4gICAgbGV0IGlzR29vZCA9IHJlc3AucmVzdWx0Lmdvb2Q7XG4gICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrUmVzZXJ2ZSgpO1xuICAgIGNoZWNrLnNldElzR29vZChpc0dvb2QpO1xuICAgIGlmIChpc0dvb2QpIHtcbiAgICAgIGNoZWNrLnNldFVuY29uZmlybWVkU3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnNwZW50KSk7XG4gICAgICBjaGVjay5zZXRUb3RhbEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQudG90YWwpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoZWNrO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9ub3Rlc1wiLCB7dHhpZHM6IHR4SGFzaGVzfSkpLnJlc3VsdC5ub3RlcztcbiAgfVxuICBcbiAgYXN5bmMgc2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10sIG5vdGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF90eF9ub3Rlc1wiLCB7dHhpZHM6IHR4SGFzaGVzLCBub3Rlczogbm90ZXN9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9BZGRyZXNzQm9va0VudHJ5W10+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzX2Jvb2tcIiwge2VudHJpZXM6IGVudHJ5SW5kaWNlc30pO1xuICAgIGlmICghcmVzcC5yZXN1bHQuZW50cmllcykgcmV0dXJuIFtdO1xuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgZm9yIChsZXQgcnBjRW50cnkgb2YgcmVzcC5yZXN1bHQuZW50cmllcykge1xuICAgICAgZW50cmllcy5wdXNoKG5ldyBNb25lcm9BZGRyZXNzQm9va0VudHJ5KCkuc2V0SW5kZXgocnBjRW50cnkuaW5kZXgpLnNldEFkZHJlc3MocnBjRW50cnkuYWRkcmVzcykuc2V0RGVzY3JpcHRpb24ocnBjRW50cnkuZGVzY3JpcHRpb24pLnNldFBheW1lbnRJZChycGNFbnRyeS5wYXltZW50X2lkKSk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG4gIFxuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3M6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiYWRkX2FkZHJlc3NfYm9va1wiLCB7YWRkcmVzczogYWRkcmVzcywgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9ufSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmluZGV4O1xuICB9XG4gIFxuICBhc3luYyBlZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleDogbnVtYmVyLCBzZXRBZGRyZXNzOiBib29sZWFuLCBhZGRyZXNzOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNldERlc2NyaXB0aW9uOiBib29sZWFuLCBkZXNjcmlwdGlvbjogc3RyaW5nIHwgdW5kZWZpbmVkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJlZGl0X2FkZHJlc3NfYm9va1wiLCB7XG4gICAgICBpbmRleDogaW5kZXgsXG4gICAgICBzZXRfYWRkcmVzczogc2V0QWRkcmVzcyxcbiAgICAgIGFkZHJlc3M6IGFkZHJlc3MsXG4gICAgICBzZXRfZGVzY3JpcHRpb246IHNldERlc2NyaXB0aW9uLFxuICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uXG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHg6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImRlbGV0ZV9hZGRyZXNzX2Jvb2tcIiwge2luZGV4OiBlbnRyeUlkeH0pO1xuICB9XG4gIFxuICBhc3luYyB0YWdBY2NvdW50cyh0YWcsIGFjY291bnRJbmRpY2VzKSB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidGFnX2FjY291bnRzXCIsIHt0YWc6IHRhZywgYWNjb3VudHM6IGFjY291bnRJbmRpY2VzfSk7XG4gIH1cblxuICBhc3luYyB1bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInVudGFnX2FjY291bnRzXCIsIHthY2NvdW50czogYWNjb3VudEluZGljZXN9KTtcbiAgfVxuXG4gIGFzeW5jIGdldEFjY291bnRUYWdzKCk6IFByb21pc2U8TW9uZXJvQWNjb3VudFRhZ1tdPiB7XG4gICAgbGV0IHRhZ3MgPSBbXTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hY2NvdW50X3RhZ3NcIik7XG4gICAgaWYgKHJlc3AucmVzdWx0LmFjY291bnRfdGFncykge1xuICAgICAgZm9yIChsZXQgcnBjQWNjb3VudFRhZyBvZiByZXNwLnJlc3VsdC5hY2NvdW50X3RhZ3MpIHtcbiAgICAgICAgdGFncy5wdXNoKG5ldyBNb25lcm9BY2NvdW50VGFnKHtcbiAgICAgICAgICB0YWc6IHJwY0FjY291bnRUYWcudGFnID8gcnBjQWNjb3VudFRhZy50YWcgOiB1bmRlZmluZWQsXG4gICAgICAgICAgbGFiZWw6IHJwY0FjY291bnRUYWcubGFiZWwgPyBycGNBY2NvdW50VGFnLmxhYmVsIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGFjY291bnRJbmRpY2VzOiBycGNBY2NvdW50VGFnLmFjY291bnRzXG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhZ3M7XG4gIH1cblxuICBhc3luYyBzZXRBY2NvdW50VGFnTGFiZWwodGFnOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYWNjb3VudF90YWdfZGVzY3JpcHRpb25cIiwge3RhZzogdGFnLCBkZXNjcmlwdGlvbjogbGFiZWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWc6IE1vbmVyb1R4Q29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJtYWtlX3VyaVwiLCB7XG4gICAgICBhZGRyZXNzOiBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLFxuICAgICAgYW1vdW50OiBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QW1vdW50KCkgPyBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QW1vdW50KCkudG9TdHJpbmcoKSA6IHVuZGVmaW5lZCxcbiAgICAgIHBheW1lbnRfaWQ6IGNvbmZpZy5nZXRQYXltZW50SWQoKSxcbiAgICAgIHJlY2lwaWVudF9uYW1lOiBjb25maWcuZ2V0UmVjaXBpZW50TmFtZSgpLFxuICAgICAgdHhfZGVzY3JpcHRpb246IGNvbmZpZy5nZXROb3RlKClcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQudXJpO1xuICB9XG4gIFxuICBhc3luYyBwYXJzZVBheW1lbnRVcmkodXJpOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4Q29uZmlnPiB7XG4gICAgYXNzZXJ0KHVyaSwgXCJNdXN0IHByb3ZpZGUgVVJJIHRvIHBhcnNlXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicGFyc2VfdXJpXCIsIHt1cmk6IHVyaX0pO1xuICAgIGxldCBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoe2FkZHJlc3M6IHJlc3AucmVzdWx0LnVyaS5hZGRyZXNzLCBhbW91bnQ6IEJpZ0ludChyZXNwLnJlc3VsdC51cmkuYW1vdW50KX0pO1xuICAgIGNvbmZpZy5zZXRQYXltZW50SWQocmVzcC5yZXN1bHQudXJpLnBheW1lbnRfaWQpO1xuICAgIGNvbmZpZy5zZXRSZWNpcGllbnROYW1lKHJlc3AucmVzdWx0LnVyaS5yZWNpcGllbnRfbmFtZSk7XG4gICAgY29uZmlnLnNldE5vdGUocmVzcC5yZXN1bHQudXJpLnR4X2Rlc2NyaXB0aW9uKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSkgY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLnNldEFkZHJlc3ModW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldFBheW1lbnRJZCgpKSBjb25maWcuc2V0UGF5bWVudElkKHVuZGVmaW5lZCk7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXRSZWNpcGllbnROYW1lKCkpIGNvbmZpZy5zZXRSZWNpcGllbnROYW1lKHVuZGVmaW5lZCk7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXROb3RlKCkpIGNvbmZpZy5zZXROb3RlKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIGNvbmZpZztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QXR0cmlidXRlKGtleTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYXR0cmlidXRlXCIsIHtrZXk6IGtleX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnZhbHVlID09PSBcIlwiID8gdW5kZWZpbmVkIDogcmVzcC5yZXN1bHQudmFsdWU7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtNDUpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgc2V0QXR0cmlidXRlKGtleTogc3RyaW5nLCB2YWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9hdHRyaWJ1dGVcIiwge2tleToga2V5LCB2YWx1ZTogdmFsfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKG51bVRocmVhZHM6IG51bWJlciwgYmFja2dyb3VuZE1pbmluZz86IGJvb2xlYW4sIGlnbm9yZUJhdHRlcnk/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3RhcnRfbWluaW5nXCIsIHtcbiAgICAgIHRocmVhZHNfY291bnQ6IG51bVRocmVhZHMsXG4gICAgICBkb19iYWNrZ3JvdW5kX21pbmluZzogYmFja2dyb3VuZE1pbmluZyxcbiAgICAgIGlnbm9yZV9iYXR0ZXJ5OiBpZ25vcmVCYXR0ZXJ5XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3RvcF9taW5pbmdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiKTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQubXVsdGlzaWdfaW1wb3J0X25lZWRlZCA9PT0gdHJ1ZTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TXVsdGlzaWdJbmZvKCk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbmZvPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpc19tdWx0aXNpZ1wiKTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgbGV0IGluZm8gPSBuZXcgTW9uZXJvTXVsdGlzaWdJbmZvKCk7XG4gICAgaW5mby5zZXRJc011bHRpc2lnKHJlc3VsdC5tdWx0aXNpZyk7XG4gICAgaW5mby5zZXRJc1JlYWR5KHJlc3VsdC5yZWFkeSk7XG4gICAgaW5mby5zZXRUaHJlc2hvbGQocmVzdWx0LnRocmVzaG9sZCk7XG4gICAgaW5mby5zZXROdW1QYXJ0aWNpcGFudHMocmVzdWx0LnRvdGFsKTtcbiAgICByZXR1cm4gaW5mbztcbiAgfVxuICBcbiAgYXN5bmMgcHJlcGFyZU11bHRpc2lnKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJwcmVwYXJlX211bHRpc2lnXCIsIHtlbmFibGVfbXVsdGlzaWdfZXhwZXJpbWVudGFsOiB0cnVlfSk7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgcmV0dXJuIHJlc3VsdC5tdWx0aXNpZ19pbmZvO1xuICB9XG4gIFxuICBhc3luYyBtYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHRocmVzaG9sZDogbnVtYmVyLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfbXVsdGlzaWdcIiwge1xuICAgICAgbXVsdGlzaWdfaW5mbzogbXVsdGlzaWdIZXhlcyxcbiAgICAgIHRocmVzaG9sZDogdGhyZXNob2xkLFxuICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkXG4gICAgfSk7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQubXVsdGlzaWdfaW5mbztcbiAgfVxuICBcbiAgYXN5bmMgZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhjaGFuZ2VfbXVsdGlzaWdfa2V5c1wiLCB7bXVsdGlzaWdfaW5mbzogbXVsdGlzaWdIZXhlcywgcGFzc3dvcmQ6IHBhc3N3b3JkfSk7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICBsZXQgbXNSZXN1bHQgPSBuZXcgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0KCk7XG4gICAgbXNSZXN1bHQuc2V0QWRkcmVzcyhyZXNwLnJlc3VsdC5hZGRyZXNzKTtcbiAgICBtc1Jlc3VsdC5zZXRNdWx0aXNpZ0hleChyZXNwLnJlc3VsdC5tdWx0aXNpZ19pbmZvKTtcbiAgICBpZiAobXNSZXN1bHQuZ2V0QWRkcmVzcygpLmxlbmd0aCA9PT0gMCkgbXNSZXN1bHQuc2V0QWRkcmVzcyh1bmRlZmluZWQpO1xuICAgIGlmIChtc1Jlc3VsdC5nZXRNdWx0aXNpZ0hleCgpLmxlbmd0aCA9PT0gMCkgbXNSZXN1bHQuc2V0TXVsdGlzaWdIZXgodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gbXNSZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfbXVsdGlzaWdfaW5mb1wiKTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuaW5mbztcbiAgfVxuXG4gIGFzeW5jIGltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkobXVsdGlzaWdIZXhlcykpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBzdHJpbmdbXSB0byBpbXBvcnRNdWx0aXNpZ0hleCgpXCIpXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbXBvcnRfbXVsdGlzaWdfaW5mb1wiLCB7aW5mbzogbXVsdGlzaWdIZXhlc30pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5uX291dHB1dHM7XG4gIH1cblxuICBhc3luYyBzaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnU2lnblJlc3VsdD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnbl9tdWx0aXNpZ1wiLCB7dHhfZGF0YV9oZXg6IG11bHRpc2lnVHhIZXh9KTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgbGV0IHNpZ25SZXN1bHQgPSBuZXcgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0KCk7XG4gICAgc2lnblJlc3VsdC5zZXRTaWduZWRNdWx0aXNpZ1R4SGV4KHJlc3VsdC50eF9kYXRhX2hleCk7XG4gICAgc2lnblJlc3VsdC5zZXRUeEhhc2hlcyhyZXN1bHQudHhfaGFzaF9saXN0KTtcbiAgICByZXR1cm4gc2lnblJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3VibWl0X211bHRpc2lnXCIsIHt0eF9kYXRhX2hleDogc2lnbmVkTXVsdGlzaWdUeEhleH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC50eF9oYXNoX2xpc3Q7XG4gIH1cbiAgXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkOiBzdHJpbmcsIG5ld1Bhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hhbmdlX3dhbGxldF9wYXNzd29yZFwiLCB7b2xkX3Bhc3N3b3JkOiBvbGRQYXNzd29yZCB8fCBcIlwiLCBuZXdfcGFzc3dvcmQ6IG5ld1Bhc3N3b3JkIHx8IFwiXCJ9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2F2ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9yZVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgY2xvc2Uoc2F2ZSA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3VwZXIuY2xvc2Uoc2F2ZSk7XG4gICAgaWYgKHNhdmUgPT09IHVuZGVmaW5lZCkgc2F2ZSA9IGZhbHNlO1xuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjbG9zZV93YWxsZXRcIiwge2F1dG9zYXZlX2N1cnJlbnQ6IHNhdmV9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDbG9zZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0UHJpbWFyeUFkZHJlc3MoKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIHJldHVybiBlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC0xMyAmJiBlLm1lc3NhZ2UuaW5kZXhPZihcIk5vIHdhbGxldCBmaWxlXCIpID4gLTE7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNhdmUgYW5kIGNsb3NlIHRoZSBjdXJyZW50IHdhbGxldCBhbmQgc3RvcCB0aGUgUlBDIHNlcnZlci5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdG9wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9wX3dhbGxldFwiKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0gQUREIEpTRE9DIEZPUiBTVVBQT1JURUQgREVGQVVMVCBJTVBMRU1FTlRBVElPTlMgLS0tLS0tLS0tLS0tLS1cblxuICBhc3luYyBnZXROdW1CbG9ja3NUb1VubG9jaygpOiBQcm9taXNlPG51bWJlcltdfHVuZGVmaW5lZD4geyByZXR1cm4gc3VwZXIuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTsgfVxuICBhc3luYyBnZXRUeCh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhXYWxsZXR8dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gpOyB9XG4gIGFzeW5jIGdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBnZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5PikgeyByZXR1cm4gc3VwZXIuZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGNyZWF0ZVR4KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5jcmVhdGVUeChjb25maWcpOyB9XG4gIGFzeW5jIHJlbGF5VHgodHhPck1ldGFkYXRhOiBNb25lcm9UeFdhbGxldCB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5yZWxheVR4KHR4T3JNZXRhZGF0YSk7IH1cbiAgYXN5bmMgZ2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFR4Tm90ZSh0eEhhc2gpOyB9XG4gIGFzeW5jIHNldFR4Tm90ZSh0eEhhc2g6IHN0cmluZywgbm90ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zZXRUeE5vdGUodHhIYXNoLCBub3RlKTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzdGF0aWMgYXN5bmMgY29ubmVjdFRvV2FsbGV0UnBjKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgbGV0IGNvbmZpZyA9IE1vbmVyb1dhbGxldFJwYy5ub3JtYWxpemVDb25maWcodXJpT3JDb25maWcsIHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgaWYgKGNvbmZpZy5jbWQpIHJldHVybiBNb25lcm9XYWxsZXRScGMuc3RhcnRXYWxsZXRScGNQcm9jZXNzKGNvbmZpZyk7XG4gICAgZWxzZSByZXR1cm4gbmV3IE1vbmVyb1dhbGxldFJwYyhjb25maWcpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIHN0YXJ0V2FsbGV0UnBjUHJvY2Vzcyhjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzQXJyYXkoY29uZmlnLmNtZCksIFwiTXVzdCBwcm92aWRlIHN0cmluZyBhcnJheSB3aXRoIGNvbW1hbmQgbGluZSBwYXJhbWV0ZXJzXCIpO1xuICAgIFxuICAgIC8vIHN0YXJ0IHByb2Nlc3NcbiAgICBsZXQgY2hpbGRfcHJvY2VzcyA9IGF3YWl0IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIik7XG4gICAgY29uc3QgY2hpbGRQcm9jZXNzID0gY2hpbGRfcHJvY2Vzcy5zcGF3bihjb25maWcuY21kWzBdLCBjb25maWcuY21kLnNsaWNlKDEpLCB7XG4gICAgICBlbnY6IHsgLi4ucHJvY2Vzcy5lbnYsIExBTkc6ICdlbl9VUy5VVEYtOCcgfSAvLyBzY3JhcGUgb3V0cHV0IGluIGVuZ2xpc2hcbiAgICB9KTtcbiAgICBjaGlsZFByb2Nlc3Muc3Rkb3V0LnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIG1vbmVyby13YWxsZXQtcnBjXG4gICAgbGV0IHVyaTtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgbGV0IG91dHB1dCA9IFwiXCI7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3Rkb3V0XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQub24oJ2RhdGEnLCBhc3luYyBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgbGV0IGxpbmUgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICAgICAgTGlicmFyeVV0aWxzLmxvZygyLCBsaW5lKTtcbiAgICAgICAgICBvdXRwdXQgKz0gbGluZSArICdcXG4nOyAvLyBjYXB0dXJlIG91dHB1dCBpbiBjYXNlIG9mIGVycm9yXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gZXh0cmFjdCB1cmkgZnJvbSBlLmcuIFwiSSBCaW5kaW5nIG9uIDEyNy4wLjAuMSAoSVB2NCk6MzgwODVcIlxuICAgICAgICAgIGxldCB1cmlMaW5lQ29udGFpbnMgPSBcIkJpbmRpbmcgb24gXCI7XG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWluc0lkeCA9IGxpbmUuaW5kZXhPZih1cmlMaW5lQ29udGFpbnMpO1xuICAgICAgICAgIGlmICh1cmlMaW5lQ29udGFpbnNJZHggPj0gMCkge1xuICAgICAgICAgICAgbGV0IGhvc3QgPSBsaW5lLnN1YnN0cmluZyh1cmlMaW5lQ29udGFpbnNJZHggKyB1cmlMaW5lQ29udGFpbnMubGVuZ3RoLCBsaW5lLmxhc3RJbmRleE9mKCcgJykpO1xuICAgICAgICAgICAgbGV0IHVuZm9ybWF0dGVkTGluZSA9IGxpbmUucmVwbGFjZSgvXFx1MDAxYlxcWy4qP20vZywgJycpLnRyaW0oKTsgLy8gcmVtb3ZlIGNvbG9yIGZvcm1hdHRpbmdcbiAgICAgICAgICAgIGxldCBwb3J0ID0gdW5mb3JtYXR0ZWRMaW5lLnN1YnN0cmluZyh1bmZvcm1hdHRlZExpbmUubGFzdEluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgbGV0IHNzbElkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLXNzbFwiKTtcbiAgICAgICAgICAgIGxldCBzc2xFbmFibGVkID0gc3NsSWR4ID49IDAgPyBcImVuYWJsZWRcIiA9PSBjb25maWcuY21kW3NzbElkeCArIDFdLnRvTG93ZXJDYXNlKCkgOiBmYWxzZTtcbiAgICAgICAgICAgIHVyaSA9IChzc2xFbmFibGVkID8gXCJodHRwc1wiIDogXCJodHRwXCIpICsgXCI6Ly9cIiArIGhvc3QgKyBcIjpcIiArIHBvcnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlYWQgc3VjY2VzcyBtZXNzYWdlXG4gICAgICAgICAgaWYgKGxpbmUuaW5kZXhPZihcIlN0YXJ0aW5nIHdhbGxldCBSUEMgc2VydmVyXCIpID49IDApIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gZ2V0IHVzZXJuYW1lIGFuZCBwYXNzd29yZCBmcm9tIHBhcmFtc1xuICAgICAgICAgICAgbGV0IHVzZXJQYXNzSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtbG9naW5cIik7XG4gICAgICAgICAgICBsZXQgdXNlclBhc3MgPSB1c2VyUGFzc0lkeCA+PSAwID8gY29uZmlnLmNtZFt1c2VyUGFzc0lkeCArIDFdIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHVzZXJuYW1lID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZygwLCB1c2VyUGFzcy5pbmRleE9mKCc6JykpO1xuICAgICAgICAgICAgbGV0IHBhc3N3b3JkID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZyh1c2VyUGFzcy5pbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gY3JlYXRlIGNsaWVudCBjb25uZWN0ZWQgdG8gaW50ZXJuYWwgcHJvY2Vzc1xuICAgICAgICAgICAgY29uZmlnID0gY29uZmlnLmNvcHkoKS5zZXRTZXJ2ZXIoe3VyaTogdXJpLCB1c2VybmFtZTogdXNlcm5hbWUsIHBhc3N3b3JkOiBwYXNzd29yZCwgcmVqZWN0VW5hdXRob3JpemVkOiBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWR9KTtcbiAgICAgICAgICAgIGNvbmZpZy5jbWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0UnBjLmNvbm5lY3RUb1dhbGxldFJwYyhjb25maWcpO1xuICAgICAgICAgICAgd2FsbGV0LnByb2Nlc3MgPSBjaGlsZFByb2Nlc3M7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHJlc29sdmUgcHJvbWlzZSB3aXRoIGNsaWVudCBjb25uZWN0ZWQgdG8gaW50ZXJuYWwgcHJvY2VzcyBcbiAgICAgICAgICAgIHRoaXMuaXNSZXNvbHZlZCA9IHRydWU7XG4gICAgICAgICAgICByZXNvbHZlKHdhbGxldCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRlcnJcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5vbignZGF0YScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgY29uc29sZS5lcnJvcihkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXhpdFxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJleGl0XCIsIGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIHByb2Nlc3MgdGVybWluYXRlZCB3aXRoIGV4aXQgY29kZSBcIiArIGNvZGUgKyAob3V0cHV0ID8gXCI6XFxuXFxuXCIgKyBvdXRwdXQgOiBcIlwiKSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBlcnJvclxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJlcnJvclwiLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIkVOT0VOVFwiKSA+PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgZXhpc3QgYXQgcGF0aCAnXCIgKyBjb25maWcuY21kWzBdICsgXCInXCIpKTtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHVuY2F1Z2h0IGV4Y2VwdGlvblxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCBmdW5jdGlvbihlcnIsIG9yaWdpbikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmNhdWdodCBleGNlcHRpb24gaW4gbW9uZXJvLXdhbGxldC1ycGMgcHJvY2VzczogXCIgKyBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihvcmlnaW4pO1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjbGVhcigpIHtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgICBkZWxldGUgdGhpcy5hZGRyZXNzQ2FjaGU7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICB0aGlzLnBhdGggPSB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRBY2NvdW50SW5kaWNlcyhnZXRTdWJhZGRyZXNzSW5kaWNlcz86IGFueSkge1xuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpO1xuICAgIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgdGhpcy5nZXRBY2NvdW50cygpKSB7XG4gICAgICBpbmRpY2VzLnNldChhY2NvdW50LmdldEluZGV4KCksIGdldFN1YmFkZHJlc3NJbmRpY2VzID8gYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzSW5kaWNlcyhhY2NvdW50LmdldEluZGV4KCkpIDogdW5kZWZpbmVkKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZGljZXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRTdWJhZGRyZXNzSW5kaWNlcyhhY2NvdW50SWR4KSB7XG4gICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc1wiLCB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeH0pO1xuICAgIGZvciAobGV0IGFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQuYWRkcmVzc2VzKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKGFkZHJlc3MuYWRkcmVzc19pbmRleCk7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3NJbmRpY2VzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0VHJhbnNmZXJzQXV4KHF1ZXJ5OiBNb25lcm9UcmFuc2ZlclF1ZXJ5KSB7XG4gICAgXG4gICAgLy8gYnVpbGQgcGFyYW1zIGZvciBnZXRfdHJhbnNmZXJzIHJwYyBjYWxsXG4gICAgbGV0IHR4UXVlcnkgPSBxdWVyeS5nZXRUeFF1ZXJ5KCk7XG4gICAgbGV0IGNhbkJlQ29uZmlybWVkID0gdHhRdWVyeS5nZXRJc0NvbmZpcm1lZCgpICE9PSBmYWxzZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJc0ZhaWxlZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SXNSZWxheWVkKCkgIT09IGZhbHNlO1xuICAgIGxldCBjYW5CZUluVHhQb29sID0gdHhRdWVyeS5nZXRJc0NvbmZpcm1lZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJc0ZhaWxlZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCAmJiB0eFF1ZXJ5LmdldE1heEhlaWdodCgpID09PSB1bmRlZmluZWQgJiYgdHhRdWVyeS5nZXRJc0xvY2tlZCgpICE9PSBmYWxzZTtcbiAgICBsZXQgY2FuQmVJbmNvbWluZyA9IHF1ZXJ5LmdldElzSW5jb21pbmcoKSAhPT0gZmFsc2UgJiYgcXVlcnkuZ2V0SXNPdXRnb2luZygpICE9PSB0cnVlICYmIHF1ZXJ5LmdldEhhc0Rlc3RpbmF0aW9ucygpICE9PSB0cnVlO1xuICAgIGxldCBjYW5CZU91dGdvaW5nID0gcXVlcnkuZ2V0SXNPdXRnb2luZygpICE9PSBmYWxzZSAmJiBxdWVyeS5nZXRJc0luY29taW5nKCkgIT09IHRydWU7XG5cbiAgICAvLyBjaGVjayBpZiBmZXRjaGluZyBwb29sIHR4cyBjb250cmFkaWN0ZWQgYnkgY29uZmlndXJhdGlvblxuICAgIGlmICh0eFF1ZXJ5LmdldEluVHhQb29sKCkgPT09IHRydWUgJiYgIWNhbkJlSW5UeFBvb2wpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBmZXRjaCBwb29sIHRyYW5zYWN0aW9ucyBiZWNhdXNlIGl0IGNvbnRyYWRpY3RzIGNvbmZpZ3VyYXRpb25cIik7XG4gICAgfVxuXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmluID0gY2FuQmVJbmNvbWluZyAmJiBjYW5CZUNvbmZpcm1lZDtcbiAgICBwYXJhbXMub3V0ID0gY2FuQmVPdXRnb2luZyAmJiBjYW5CZUNvbmZpcm1lZDtcbiAgICBwYXJhbXMucG9vbCA9IGNhbkJlSW5jb21pbmcgJiYgY2FuQmVJblR4UG9vbDtcbiAgICBwYXJhbXMucGVuZGluZyA9IGNhbkJlT3V0Z29pbmcgJiYgY2FuQmVJblR4UG9vbDtcbiAgICBwYXJhbXMuZmFpbGVkID0gdHhRdWVyeS5nZXRJc0ZhaWxlZCgpICE9PSBmYWxzZSAmJiB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9IHRydWU7XG4gICAgaWYgKHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgPiAwKSBwYXJhbXMubWluX2hlaWdodCA9IHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgLSAxOyAvLyBUT0RPIG1vbmVyby1wcm9qZWN0OiB3YWxsZXQyOjpnZXRfcGF5bWVudHMoKSBtaW5faGVpZ2h0IGlzIGV4Y2x1c2l2ZSwgc28gbWFudWFsbHkgb2Zmc2V0IHRvIG1hdGNoIGludGVuZGVkIHJhbmdlIChpc3N1ZXMgIzU3NTEsICM1NTk4KVxuICAgICAgZWxzZSBwYXJhbXMubWluX2hlaWdodCA9IHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCk7XG4gICAgfVxuICAgIGlmICh0eFF1ZXJ5LmdldE1heEhlaWdodCgpICE9PSB1bmRlZmluZWQpIHBhcmFtcy5tYXhfaGVpZ2h0ID0gdHhRdWVyeS5nZXRNYXhIZWlnaHQoKTtcbiAgICBwYXJhbXMuZmlsdGVyX2J5X2hlaWdodCA9IHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCB8fCB0eFF1ZXJ5LmdldE1heEhlaWdodCgpICE9PSB1bmRlZmluZWQ7XG4gICAgaWYgKHF1ZXJ5LmdldEFjY291bnRJbmRleCgpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSA9PT0gdW5kZWZpbmVkICYmIHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCwgXCJRdWVyeSBzcGVjaWZpZXMgYSBzdWJhZGRyZXNzIGluZGV4IGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKTtcbiAgICAgIHBhcmFtcy5hbGxfYWNjb3VudHMgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IHF1ZXJ5LmdldEFjY291bnRJbmRleCgpO1xuICAgICAgXG4gICAgICAvLyBzZXQgc3ViYWRkcmVzcyBpbmRpY2VzIHBhcmFtXG4gICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBuZXcgU2V0KCk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkgIT09IHVuZGVmaW5lZCkgc3ViYWRkcmVzc0luZGljZXMuYWRkKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQpIHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubWFwKHN1YmFkZHJlc3NJZHggPT4gc3ViYWRkcmVzc0luZGljZXMuYWRkKHN1YmFkZHJlc3NJZHgpKTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcy5zaXplKSBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gQXJyYXkuZnJvbShzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHVuaXF1ZSB0eHMgYW5kIGJsb2Nrc1xuICAgIGxldCB0eE1hcCA9IHt9O1xuICAgIGxldCBibG9ja01hcCA9IHt9O1xuICAgIFxuICAgIC8vIGJ1aWxkIHR4cyB1c2luZyBgZ2V0X3RyYW5zZmVyc2BcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90cmFuc2ZlcnNcIiwgcGFyYW1zKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocmVzcC5yZXN1bHQpKSB7XG4gICAgICBmb3IgKGxldCBycGNUeCBvZiByZXNwLnJlc3VsdFtrZXldKSB7XG4gICAgICAgIC8vaWYgKHJwY1R4LnR4aWQgPT09IHF1ZXJ5LmRlYnVnVHhJZCkgY29uc29sZS5sb2cocnBjVHgpO1xuICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4KTtcbiAgICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIGFzc2VydCh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpID4gLTEpO1xuICAgICAgICBcbiAgICAgICAgLy8gcmVwbGFjZSB0cmFuc2ZlciBhbW91bnQgd2l0aCBkZXN0aW5hdGlvbiBzdW1cbiAgICAgICAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogY29uZmlybWVkIHR4IGZyb20vdG8gc2FtZSBhY2NvdW50IGhhcyBhbW91bnQgMCBidXQgY2FjaGVkIHRyYW5zZmVyc1xuICAgICAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICE9PSB1bmRlZmluZWQgJiYgdHguZ2V0SXNSZWxheWVkKCkgJiYgIXR4LmdldElzRmFpbGVkKCkgJiZcbiAgICAgICAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKSAmJiB0eC5nZXRPdXRnb2luZ0Ftb3VudCgpID09PSAwbikge1xuICAgICAgICAgIGxldCBvdXRnb2luZ1RyYW5zZmVyID0gdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpO1xuICAgICAgICAgIGxldCB0cmFuc2ZlclRvdGFsID0gQmlnSW50KDApO1xuICAgICAgICAgIGZvciAobGV0IGRlc3RpbmF0aW9uIG9mIG91dGdvaW5nVHJhbnNmZXIuZ2V0RGVzdGluYXRpb25zKCkpIHRyYW5zZmVyVG90YWwgPSB0cmFuc2ZlclRvdGFsICsgZGVzdGluYXRpb24uZ2V0QW1vdW50KCk7XG4gICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFtb3VudCh0cmFuc2ZlclRvdGFsKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gbWVyZ2UgdHhcbiAgICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHNvcnQgdHhzIGJ5IGJsb2NrIGhlaWdodFxuICAgIGxldCB0eHM6IE1vbmVyb1R4V2FsbGV0W10gPSBPYmplY3QudmFsdWVzKHR4TWFwKTtcbiAgICB0eHMuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KTtcbiAgICBcbiAgICAvLyBmaWx0ZXIgYW5kIHJldHVybiB0cmFuc2ZlcnNcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBcbiAgICAgIC8vIHR4IGlzIG5vdCBpbmNvbWluZy9vdXRnb2luZyB1bmxlc3MgYWxyZWFkeSBzZXRcbiAgICAgIGlmICh0eC5nZXRJc0luY29taW5nKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNJbmNvbWluZyhmYWxzZSk7XG4gICAgICBpZiAodHguZ2V0SXNPdXRnb2luZygpID09PSB1bmRlZmluZWQpIHR4LnNldElzT3V0Z29pbmcoZmFsc2UpO1xuICAgICAgXG4gICAgICAvLyBzb3J0IGluY29taW5nIHRyYW5zZmVyc1xuICAgICAgaWYgKHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgIT09IHVuZGVmaW5lZCkgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKS5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlSW5jb21pbmdUcmFuc2ZlcnMpO1xuICAgICAgXG4gICAgICAvLyBjb2xsZWN0IHF1ZXJpZWQgdHJhbnNmZXJzLCBlcmFzZSBpZiBleGNsdWRlZFxuICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZmlsdGVyVHJhbnNmZXJzKHF1ZXJ5KSkge1xuICAgICAgICB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIHJlbW92ZSB0eHMgd2l0aG91dCByZXF1ZXN0ZWQgdHJhbnNmZXJcbiAgICAgIGlmICh0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQgJiYgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpID09PSB1bmRlZmluZWQgJiYgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHJhbnNmZXJzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0T3V0cHV0c0F1eChxdWVyeSkge1xuICAgIFxuICAgIC8vIGRldGVybWluZSBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMgdG8gYmUgcXVlcmllZFxuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpO1xuICAgIGlmIChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBuZXcgU2V0KCk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkgIT09IHVuZGVmaW5lZCkgc3ViYWRkcmVzc0luZGljZXMuYWRkKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQpIHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubWFwKHN1YmFkZHJlc3NJZHggPT4gc3ViYWRkcmVzc0luZGljZXMuYWRkKHN1YmFkZHJlc3NJZHgpKTtcbiAgICAgIGluZGljZXMuc2V0KHF1ZXJ5LmdldEFjY291bnRJbmRleCgpLCBzdWJhZGRyZXNzSW5kaWNlcy5zaXplID8gQXJyYXkuZnJvbShzdWJhZGRyZXNzSW5kaWNlcykgOiB1bmRlZmluZWQpOyAgLy8gdW5kZWZpbmVkIHdpbGwgZmV0Y2ggZnJvbSBhbGwgc3ViYWRkcmVzc2VzXG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2VydC5lcXVhbChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSwgdW5kZWZpbmVkLCBcIlF1ZXJ5IHNwZWNpZmllcyBhIHN1YmFkZHJlc3MgaW5kZXggYnV0IG5vdCBhbiBhY2NvdW50IGluZGV4XCIpXG4gICAgICBhc3NlcnQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkIHx8IHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwLCBcIlF1ZXJ5IHNwZWNpZmllcyBzdWJhZGRyZXNzIGluZGljZXMgYnV0IG5vdCBhbiBhY2NvdW50IGluZGV4XCIpO1xuICAgICAgaW5kaWNlcyA9IGF3YWl0IHRoaXMuZ2V0QWNjb3VudEluZGljZXMoKTsgIC8vIGZldGNoIGFsbCBhY2NvdW50IGluZGljZXMgd2l0aG91dCBzdWJhZGRyZXNzZXNcbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgdW5pcXVlIHR4cyBhbmQgYmxvY2tzXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgXG4gICAgLy8gY29sbGVjdCB0eHMgd2l0aCBvdXRwdXRzIGZvciBlYWNoIGluZGljYXRlZCBhY2NvdW50IHVzaW5nIGBpbmNvbWluZ190cmFuc2ZlcnNgIHJwYyBjYWxsXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLnRyYW5zZmVyX3R5cGUgPSBxdWVyeS5nZXRJc1NwZW50KCkgPT09IHRydWUgPyBcInVuYXZhaWxhYmxlXCIgOiBxdWVyeS5nZXRJc1NwZW50KCkgPT09IGZhbHNlID8gXCJhdmFpbGFibGVcIiA6IFwiYWxsXCI7XG4gICAgcGFyYW1zLnZlcmJvc2UgPSB0cnVlO1xuICAgIGZvciAobGV0IGFjY291bnRJZHggb2YgaW5kaWNlcy5rZXlzKCkpIHtcbiAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBhY2NvdW50SWR4O1xuICAgICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGluZGljZXMuZ2V0KGFjY291bnRJZHgpO1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbmNvbWluZ190cmFuc2ZlcnNcIiwgcGFyYW1zKTtcbiAgICAgIFxuICAgICAgLy8gY29udmVydCByZXNwb25zZSB0byB0eHMgd2l0aCBvdXRwdXRzIGFuZCBtZXJnZVxuICAgICAgaWYgKHJlc3AucmVzdWx0LnRyYW5zZmVycyA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcbiAgICAgIGZvciAobGV0IHJwY091dHB1dCBvZiByZXNwLnJlc3VsdC50cmFuc2ZlcnMpIHtcbiAgICAgICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdhbGxldFdpdGhPdXRwdXQocnBjT3V0cHV0KTtcbiAgICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHNvcnQgdHhzIGJ5IGJsb2NrIGhlaWdodFxuICAgIGxldCB0eHM6IE1vbmVyb1R4V2FsbGV0W10gPSBPYmplY3QudmFsdWVzKHR4TWFwKTtcbiAgICB0eHMuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHF1ZXJpZWQgb3V0cHV0c1xuICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBcbiAgICAgIC8vIHNvcnQgb3V0cHV0c1xuICAgICAgaWYgKHR4LmdldE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0eC5nZXRPdXRwdXRzKCkuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZU91dHB1dHMpO1xuICAgICAgXG4gICAgICAvLyBjb2xsZWN0IHF1ZXJpZWQgb3V0cHV0cywgZXJhc2UgaWYgZXhjbHVkZWRcbiAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5maWx0ZXJPdXRwdXRzKHF1ZXJ5KSkgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgICBcbiAgICAgIC8vIHJlbW92ZSBleGNsdWRlZCB0eHMgZnJvbSBibG9ja1xuICAgICAgaWYgKHR4LmdldE91dHB1dHMoKSA9PT0gdW5kZWZpbmVkICYmIHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0eC5nZXRCbG9jaygpLmdldFR4cygpLnNwbGljZSh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dHM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21tb24gbWV0aG9kIHRvIGdldCBrZXkgaW1hZ2VzLlxuICAgKiBcbiAgICogQHBhcmFtIGFsbCAtIHBlY2lmaWVzIHRvIGdldCBhbGwgeG9yIG9ubHkgbmV3IGltYWdlcyBmcm9tIGxhc3QgaW1wb3J0XG4gICAqIEByZXR1cm4ge01vbmVyb0tleUltYWdlW119IGFyZSB0aGUga2V5IGltYWdlc1xuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIHJwY0V4cG9ydEtleUltYWdlcyhhbGwpIHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4cG9ydF9rZXlfaW1hZ2VzXCIsIHthbGw6IGFsbH0pO1xuICAgIGlmICghcmVzcC5yZXN1bHQuc2lnbmVkX2tleV9pbWFnZXMpIHJldHVybiBbXTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmVkX2tleV9pbWFnZXMubWFwKHJwY0ltYWdlID0+IG5ldyBNb25lcm9LZXlJbWFnZShycGNJbWFnZS5rZXlfaW1hZ2UsIHJwY0ltYWdlLnNpZ25hdHVyZSkpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgcnBjU3dlZXBBY2NvdW50KGNvbmZpZzogTW9uZXJvVHhDb25maWcpIHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBzd2VlcCBjb25maWdcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYW4gYWNjb3VudCBpbmRleCB0byBzd2VlcCBmcm9tXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoICE9IDEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBleGFjdGx5IG9uZSBkZXN0aW5hdGlvbiB0byBzd2VlcCB0b1wiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZGVzdGluYXRpb24gYWRkcmVzcyB0byBzd2VlcCB0b1wiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFtb3VudCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IGFtb3VudCBpbiBzd2VlcCBjb25maWdcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRLZXlJbWFnZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIktleSBpbWFnZSBkZWZpbmVkOyB1c2Ugc3dlZXBPdXRwdXQoKSB0byBzd2VlcCBhbiBvdXRwdXQgYnkgaXRzIGtleSBpbWFnZVwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCAmJiBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkVtcHR5IGxpc3QgZ2l2ZW4gZm9yIHN1YmFkZHJlc3NlcyBpbmRpY2VzIHRvIHN3ZWVwXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcygpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3dlZXAgZWFjaCBzdWJhZGRyZXNzIHdpdGggUlBDIGBzd2VlcF9hbGxgXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkgIT09IHVuZGVmaW5lZCAmJiBjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkubGVuZ3RoID4gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3dlZXBpbmcgb3V0cHV0IGRvZXMgbm90IHN1cHBvcnQgc3VidHJhY3RpbmcgZmVlcyBmcm9tIGRlc3RpbmF0aW9uc1wiKTtcbiAgICBcbiAgICAvLyBzd2VlcCBmcm9tIGFsbCBzdWJhZGRyZXNzZXMgaWYgbm90IG90aGVyd2lzZSBkZWZpbmVkXG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbmZpZy5zZXRTdWJhZGRyZXNzSW5kaWNlcyhbXSk7XG4gICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKSkpIHtcbiAgICAgICAgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJObyBzdWJhZGRyZXNzZXMgdG8gc3dlZXAgZnJvbVwiKTtcbiAgICBcbiAgICAvLyBjb21tb24gY29uZmlnIHBhcmFtc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIGxldCByZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpID09PSB0cnVlO1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gY29uZmlnLmdldEFjY291bnRJbmRleCgpO1xuICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCk7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWcuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWcuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZy5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gIXJlbGF5O1xuICAgIHBhcmFtcy5iZWxvd19hbW91bnQgPSBjb25maWcuZ2V0QmVsb3dBbW91bnQoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2tleXMgPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBpbnZva2Ugd2FsbGV0IHJwYyBgc3dlZXBfYWxsYFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfYWxsXCIsIHBhcmFtcyk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGZyb20gcmVzcG9uc2VcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCwgdW5kZWZpbmVkLCBjb25maWcpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgcmVtYWluaW5nIGtub3duIGZpZWxkc1xuICAgIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB7XG4gICAgICB0eC5zZXRJc0xvY2tlZCh0cnVlKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICB0eC5zZXRSZWxheShyZWxheSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChyZWxheSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQocmVsYXkpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIGxldCB0cmFuc2ZlciA9IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKTtcbiAgICAgIHRyYW5zZmVyLnNldEFjY291bnRJbmRleChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkpO1xuICAgICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSkgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkpO1xuICAgICAgbGV0IGRlc3RpbmF0aW9uID0gbmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksIEJpZ0ludCh0cmFuc2Zlci5nZXRBbW91bnQoKSkpO1xuICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKFtkZXN0aW5hdGlvbl0pO1xuICAgICAgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgICB0eC5zZXRQYXltZW50SWQoY29uZmlnLmdldFBheW1lbnRJZCgpKTtcbiAgICAgIGlmICh0eC5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0VW5sb2NrVGltZSgwbik7XG4gICAgICBpZiAodHguZ2V0UmVsYXkoKSkge1xuICAgICAgICBpZiAodHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgrbmV3IERhdGUoKS5nZXRUaW1lKCkpOyAgLy8gVE9ETyAobW9uZXJvLXdhbGxldC1ycGMpOiBwcm92aWRlIHRpbWVzdGFtcCBvbiByZXNwb25zZTsgdW5jb25maXJtZWQgdGltZXN0YW1wcyB2YXJ5XG4gICAgICAgIGlmICh0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbigpID09PSB1bmRlZmluZWQpIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0LmdldFR4cygpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgPT0gdW5kZWZpbmVkICYmIHRoaXMubGlzdGVuZXJzLmxlbmd0aCkgdGhpcy53YWxsZXRQb2xsZXIgPSBuZXcgV2FsbGV0UG9sbGVyKHRoaXMpO1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkKSB0aGlzLndhbGxldFBvbGxlci5zZXRJc1BvbGxpbmcodGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQb2xsIGlmIGxpc3RlbmluZy5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBwb2xsKCkge1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2FsbGV0UG9sbGVyLmlzUG9sbGluZykgYXdhaXQgdGhpcy53YWxsZXRQb2xsZXIucG9sbCgpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgU1RBVElDIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVDb25maWcodXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogTW9uZXJvV2FsbGV0Q29uZmlnIHtcbiAgICBsZXQgY29uZmlnOiB1bmRlZmluZWQgfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gPSB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbmZpZyA9PT0gXCJzdHJpbmdcIiB8fCAodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPikudXJpKSBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHtzZXJ2ZXI6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29uZmlnIGFzIHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4sIHVzZXJuYW1lLCBwYXNzd29yZCl9KTtcbiAgICBlbHNlIGlmIChHZW5VdGlscy5pc0FycmF5KHVyaU9yQ29uZmlnKSkgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh7Y21kOiB1cmlPckNvbmZpZyBhcyBzdHJpbmdbXX0pO1xuICAgIGVsc2UgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pO1xuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlciA9PT0gdW5kZWZpbmVkKSBjb25maWcucHJveHlUb1dvcmtlciA9IHRydWU7XG4gICAgcmV0dXJuIGNvbmZpZyBhcyBNb25lcm9XYWxsZXRDb25maWc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZW1vdmUgY3JpdGVyaWEgd2hpY2ggcmVxdWlyZXMgbG9va2luZyB1cCBvdGhlciB0cmFuc2ZlcnMvb3V0cHV0cyB0b1xuICAgKiBmdWxmaWxsIHF1ZXJ5LlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBxdWVyeSAtIHRoZSBxdWVyeSB0byBkZWNvbnRleHR1YWxpemVcbiAgICogQHJldHVybiB7TW9uZXJvVHhRdWVyeX0gYSByZWZlcmVuY2UgdG8gdGhlIHF1ZXJ5IGZvciBjb252ZW5pZW5jZVxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBkZWNvbnRleHR1YWxpemUocXVlcnkpIHtcbiAgICBxdWVyeS5zZXRJc0luY29taW5nKHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0SXNPdXRnb2luZyh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldFRyYW5zZmVyUXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRJbnB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0T3V0cHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gcXVlcnk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgaXNDb250ZXh0dWFsKHF1ZXJ5KSB7XG4gICAgaWYgKCFxdWVyeSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghcXVlcnkuZ2V0VHhRdWVyeSgpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRJc0luY29taW5nKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7IC8vIHJlcXVpcmVzIGdldHRpbmcgb3RoZXIgdHJhbnNmZXJzXG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRJc091dGdvaW5nKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKHF1ZXJ5IGluc3RhbmNlb2YgTW9uZXJvVHJhbnNmZXJRdWVyeSkge1xuICAgICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRPdXRwdXRRdWVyeSgpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIG91dHB1dHNcbiAgICB9IGVsc2UgaWYgKHF1ZXJ5IGluc3RhbmNlb2YgTW9uZXJvT3V0cHV0UXVlcnkpIHtcbiAgICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0VHJhbnNmZXJRdWVyeSgpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIHRyYW5zZmVyc1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJxdWVyeSBtdXN0IGJlIHR4IG9yIHRyYW5zZmVyIHF1ZXJ5XCIpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0FjY291bnQocnBjQWNjb3VudCkge1xuICAgIGxldCBhY2NvdW50ID0gbmV3IE1vbmVyb0FjY291bnQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQWNjb3VudCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNBY2NvdW50W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFjY291bnRfaW5kZXhcIikgYWNjb3VudC5zZXRJbmRleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhbGFuY2VcIikgYWNjb3VudC5zZXRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZF9iYWxhbmNlXCIpIGFjY291bnQuc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYXNlX2FkZHJlc3NcIikgYWNjb3VudC5zZXRQcmltYXJ5QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhZ1wiKSBhY2NvdW50LnNldFRhZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhYmVsXCIpIHsgfSAvLyBsYWJlbCBiZWxvbmdzIHRvIGZpcnN0IHN1YmFkZHJlc3NcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGFjY291bnQgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgaWYgKFwiXCIgPT09IGFjY291bnQuZ2V0VGFnKCkpIGFjY291bnQuc2V0VGFnKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIGFjY291bnQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcykge1xuICAgIGxldCBzdWJhZGRyZXNzID0gbmV3IE1vbmVyb1N1YmFkZHJlc3MoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjU3ViYWRkcmVzcykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNTdWJhZGRyZXNzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFjY291bnRfaW5kZXhcIikgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzX2luZGV4XCIpIHN1YmFkZHJlc3Muc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzXCIpIHN1YmFkZHJlc3Muc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhbGFuY2VcIikgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZF9iYWxhbmNlXCIpIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fdW5zcGVudF9vdXRwdXRzXCIpIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYWJlbFwiKSB7IGlmICh2YWwpIHN1YmFkZHJlc3Muc2V0TGFiZWwodmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVzZWRcIikgc3ViYWRkcmVzcy5zZXRJc1VzZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja3NfdG9fdW5sb2NrXCIpIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2sodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PSBcInRpbWVfdG9fdW5sb2NrXCIpIHt9ICAvLyBpZ25vcmluZ1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgc3ViYWRkcmVzcyBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gc3ViYWRkcmVzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgc2VudCB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIFRPRE86IHJlbW92ZSBjb3B5RGVzdGluYXRpb25zIGFmdGVyID4xOC4zLjEgd2hlbiBzdWJ0cmFjdEZlZUZyb20gZnVsbHkgc3VwcG9ydGVkXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4Q29uZmlnfSBjb25maWcgLSBzZW5kIGNvbmZpZ1xuICAgKiBAcGFyYW0ge01vbmVyb1R4V2FsbGV0fSBbdHhdIC0gZXhpc3RpbmcgdHJhbnNhY3Rpb24gdG8gaW5pdGlhbGl6ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gY29weURlc3RpbmF0aW9ucyAtIGNvcGllcyBjb25maWcgZGVzdGluYXRpb25zIGlmIHRydWVcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IGlzIHRoZSBpbml0aWFsaXplZCBzZW5kIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGluaXRTZW50VHhXYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPiwgdHgsIGNvcHlEZXN0aW5hdGlvbnMpIHtcbiAgICBpZiAoIXR4KSB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIGxldCByZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpID09PSB0cnVlO1xuICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgdHguc2V0SW5UeFBvb2wocmVsYXkpO1xuICAgIHR4LnNldFJlbGF5KHJlbGF5KTtcbiAgICB0eC5zZXRJc1JlbGF5ZWQocmVsYXkpO1xuICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIHR4LnNldElzTG9ja2VkKHRydWUpO1xuICAgIHR4LnNldFJpbmdTaXplKE1vbmVyb1V0aWxzLlJJTkdfU0laRSk7XG4gICAgbGV0IHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKTtcbiAgICB0cmFuc2Zlci5zZXRUeCh0eCk7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICYmIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSkgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkuc2xpY2UoMCkpOyAvLyB3ZSBrbm93IHNyYyBzdWJhZGRyZXNzIGluZGljZXMgaWZmIGNvbmZpZyBzcGVjaWZpZXMgMVxuICAgIGlmIChjb3B5RGVzdGluYXRpb25zKSB7XG4gICAgICBsZXQgZGVzdENvcGllcyA9IFtdO1xuICAgICAgZm9yIChsZXQgZGVzdCBvZiBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkpIGRlc3RDb3BpZXMucHVzaChkZXN0LmNvcHkoKSk7XG4gICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoZGVzdENvcGllcyk7XG4gICAgfVxuICAgIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgIHR4LnNldFBheW1lbnRJZChjb25maWcuZ2V0UGF5bWVudElkKCkpO1xuICAgIGlmICh0eC5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0VW5sb2NrVGltZSgwbik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZWxheSgpKSB7XG4gICAgICBpZiAodHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgrbmV3IERhdGUoKS5nZXRUaW1lKCkpOyAgLy8gVE9ETyAobW9uZXJvLXdhbGxldC1ycGMpOiBwcm92aWRlIHRpbWVzdGFtcCBvbiByZXNwb25zZTsgdW5jb25maXJtZWQgdGltZXN0YW1wcyB2YXJ5XG4gICAgICBpZiAodHguZ2V0SXNEb3VibGVTcGVuZFNlZW4oKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgdHggc2V0IGZyb20gYSBSUEMgbWFwIGV4Y2x1ZGluZyB0eHMuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjTWFwIC0gbWFwIHRvIGluaXRpYWxpemUgdGhlIHR4IHNldCBmcm9tXG4gICAqIEByZXR1cm4gTW9uZXJvVHhTZXQgLSBpbml0aWFsaXplZCB0eCBzZXRcbiAgICogQHJldHVybiB0aGUgcmVzdWx0aW5nIHR4IHNldFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhTZXQocnBjTWFwKSB7XG4gICAgbGV0IHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KCk7XG4gICAgdHhTZXQuc2V0TXVsdGlzaWdUeEhleChycGNNYXAubXVsdGlzaWdfdHhzZXQpO1xuICAgIHR4U2V0LnNldFVuc2lnbmVkVHhIZXgocnBjTWFwLnVuc2lnbmVkX3R4c2V0KTtcbiAgICB0eFNldC5zZXRTaWduZWRUeEhleChycGNNYXAuc2lnbmVkX3R4c2V0KTtcbiAgICBpZiAodHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0TXVsdGlzaWdUeEhleCh1bmRlZmluZWQpO1xuICAgIGlmICh0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCkubGVuZ3RoID09PSAwKSB0eFNldC5zZXRVbnNpZ25lZFR4SGV4KHVuZGVmaW5lZCk7XG4gICAgaWYgKHR4U2V0LmdldFNpZ25lZFR4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRTaWduZWRUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0U2lnbmVkVHhIZXgodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIE1vbmVyb1R4U2V0IGZyb20gYSBsaXN0IG9mIHJwYyB0eHMuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHhzIC0gcnBjIHR4cyB0byBpbml0aWFsaXplIHRoZSBzZXQgZnJvbVxuICAgKiBAcGFyYW0gdHhzIC0gZXhpc3RpbmcgdHhzIHRvIGZ1cnRoZXIgaW5pdGlhbGl6ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB0aGUgY29udmVydGVkIHR4IHNldFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocnBjVHhzOiBhbnksIHR4cz86IGFueSwgY29uZmlnPzogYW55KSB7XG4gICAgXG4gICAgLy8gYnVpbGQgc2hhcmVkIHR4IHNldFxuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhTZXQocnBjVHhzKTtcblxuICAgIC8vIGdldCBudW1iZXIgb2YgdHhzXG4gICAgbGV0IG51bVR4cyA9IHJwY1R4cy5mZWVfbGlzdCA/IHJwY1R4cy5mZWVfbGlzdC5sZW5ndGggOiBycGNUeHMudHhfaGFzaF9saXN0ID8gcnBjVHhzLnR4X2hhc2hfbGlzdC5sZW5ndGggOiAwO1xuICAgIFxuICAgIC8vIGRvbmUgaWYgcnBjIHJlc3BvbnNlIGNvbnRhaW5zIG5vIHR4c1xuICAgIGlmIChudW1UeHMgPT09IDApIHtcbiAgICAgIGFzc2VydC5lcXVhbCh0eHMsIHVuZGVmaW5lZCk7XG4gICAgICByZXR1cm4gdHhTZXQ7XG4gICAgfVxuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGlmIG5vbmUgZ2l2ZW5cbiAgICBpZiAodHhzKSB0eFNldC5zZXRUeHModHhzKTtcbiAgICBlbHNlIHtcbiAgICAgIHR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UeHM7IGkrKykgdHhzLnB1c2gobmV3IE1vbmVyb1R4V2FsbGV0KCkpO1xuICAgIH1cbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIHR4LnNldFR4U2V0KHR4U2V0KTtcbiAgICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgfVxuICAgIHR4U2V0LnNldFR4cyh0eHMpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGZyb20gcnBjIGxpc3RzXG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1R4cykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUeHNba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhfaGFzaF9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0SGFzaCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2tleV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0S2V5KHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfYmxvYl9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0RnVsbEhleCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X21ldGFkYXRhX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRNZXRhZGF0YSh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0RmVlKEJpZ0ludCh2YWxbaV0pKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldFdlaWdodCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9saXN0XCIpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAodHhzW2ldLmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PSB1bmRlZmluZWQpIHR4c1tpXS5zZXRPdXRnb2luZ1RyYW5zZmVyKG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHhzW2ldKSk7XG4gICAgICAgICAgdHhzW2ldLmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBbW91bnQoQmlnSW50KHZhbFtpXSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibXVsdGlzaWdfdHhzZXRcIiB8fCBrZXkgPT09IFwidW5zaWduZWRfdHhzZXRcIiB8fCBrZXkgPT09IFwic2lnbmVkX3R4c2V0XCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlbnRfa2V5X2ltYWdlc19saXN0XCIpIHtcbiAgICAgICAgbGV0IGlucHV0S2V5SW1hZ2VzTGlzdCA9IHZhbDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dEtleUltYWdlc0xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR4c1tpXS5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgICB0eHNbaV0uc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgICBmb3IgKGxldCBpbnB1dEtleUltYWdlIG9mIGlucHV0S2V5SW1hZ2VzTGlzdFtpXVtcImtleV9pbWFnZXNcIl0pIHtcbiAgICAgICAgICAgIHR4c1tpXS5nZXRJbnB1dHMoKS5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKS5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UoKS5zZXRIZXgoaW5wdXRLZXlJbWFnZSkpLnNldFR4KHR4c1tpXSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNfYnlfZGVzdF9saXN0XCIpIHtcbiAgICAgICAgbGV0IGFtb3VudHNCeURlc3RMaXN0ID0gdmFsO1xuICAgICAgICBsZXQgZGVzdGluYXRpb25JZHggPSAwO1xuICAgICAgICBmb3IgKGxldCB0eElkeCA9IDA7IHR4SWR4IDwgYW1vdW50c0J5RGVzdExpc3QubGVuZ3RoOyB0eElkeCsrKSB7XG4gICAgICAgICAgbGV0IGFtb3VudHNCeURlc3QgPSBhbW91bnRzQnlEZXN0TGlzdFt0eElkeF1bXCJhbW91bnRzXCJdO1xuICAgICAgICAgIGlmICh0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PT0gdW5kZWZpbmVkKSB0eHNbdHhJZHhdLnNldE91dGdvaW5nVHJhbnNmZXIobmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eHNbdHhJZHhdKSk7XG4gICAgICAgICAgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0RGVzdGluYXRpb25zKFtdKTtcbiAgICAgICAgICBmb3IgKGxldCBhbW91bnQgb2YgYW1vdW50c0J5RGVzdCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGggPT09IDEpIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnQpKSk7IC8vIHN3ZWVwaW5nIGNhbiBjcmVhdGUgbXVsdGlwbGUgdHhzIHdpdGggb25lIGFkZHJlc3NcbiAgICAgICAgICAgIGVsc2UgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpW2Rlc3RpbmF0aW9uSWR4KytdLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudCkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHRyYW5zYWN0aW9uIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgcnBjIHR4IHdpdGggYSB0cmFuc2ZlciB0byBhIHR4IHNldCB3aXRoIGEgdHggYW5kIHRyYW5zZmVyLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4IC0gcnBjIHR4IHRvIGJ1aWxkIGZyb21cbiAgICogQHBhcmFtIHR4IC0gZXhpc3RpbmcgdHggdG8gY29udGludWUgaW5pdGlhbGl6aW5nIChvcHRpb25hbClcbiAgICogQHBhcmFtIGlzT3V0Z29pbmcgLSBzcGVjaWZpZXMgaWYgdGhlIHR4IGlzIG91dGdvaW5nIGlmIHRydWUsIGluY29taW5nIGlmIGZhbHNlLCBvciBkZWNvZGVzIGZyb20gdHlwZSBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHRoZSBpbml0aWFsaXplZCB0eCBzZXQgd2l0aCBhIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFRvVHhTZXQocnBjVHgsIHR4LCBpc091dGdvaW5nLCBjb25maWcpIHtcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4U2V0KHJwY1R4KTtcbiAgICB0eFNldC5zZXRUeHMoW01vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHgsIHR4LCBpc091dGdvaW5nLCBjb25maWcpLnNldFR4U2V0KHR4U2V0KV0pO1xuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEJ1aWxkcyBhIE1vbmVyb1R4V2FsbGV0IGZyb20gYSBSUEMgdHguXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHggLSBycGMgdHggdG8gYnVpbGQgZnJvbVxuICAgKiBAcGFyYW0gdHggLSBleGlzdGluZyB0eCB0byBjb250aW51ZSBpbml0aWFsaXppbmcgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gaXNPdXRnb2luZyAtIHNwZWNpZmllcyBpZiB0aGUgdHggaXMgb3V0Z29pbmcgaWYgdHJ1ZSwgaW5jb21pbmcgaWYgZmFsc2UsIG9yIGRlY29kZXMgZnJvbSB0eXBlIGlmIHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSBpcyB0aGUgaW5pdGlhbGl6ZWQgdHhcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4OiBhbnksIHR4PzogYW55LCBpc091dGdvaW5nPzogYW55LCBjb25maWc/OiBhbnkpIHsgIC8vIFRPRE86IGNoYW5nZSBldmVyeXRoaW5nIHRvIHNhZmUgc2V0XG4gICAgICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggdG8gcmV0dXJuXG4gICAgaWYgKCF0eCkgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHN0YXRlIGZyb20gcnBjIHR5cGVcbiAgICBpZiAocnBjVHgudHlwZSAhPT0gdW5kZWZpbmVkKSBpc091dGdvaW5nID0gTW9uZXJvV2FsbGV0UnBjLmRlY29kZVJwY1R5cGUocnBjVHgudHlwZSwgdHgpO1xuICAgIGVsc2UgYXNzZXJ0LmVxdWFsKHR5cGVvZiBpc091dGdvaW5nLCBcImJvb2xlYW5cIiwgXCJNdXN0IGluZGljYXRlIGlmIHR4IGlzIG91dGdvaW5nICh0cnVlKSB4b3IgaW5jb21pbmcgKGZhbHNlKSBzaW5jZSB1bmtub3duXCIpO1xuICAgIFxuICAgIC8vIFRPRE86IHNhZmUgc2V0XG4gICAgLy8gaW5pdGlhbGl6ZSByZW1haW5pbmcgZmllbGRzICBUT0RPOiBzZWVtcyB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGNvbW1vbiBmdW5jdGlvbiB3aXRoIERhZW1vblJwYy5jb252ZXJ0UnBjVHhcbiAgICBsZXQgaGVhZGVyO1xuICAgIGxldCB0cmFuc2ZlcjtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVHgpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVHhba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhpZFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlXCIpIHR4LnNldEZlZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm90ZVwiKSB7IGlmICh2YWwpIHR4LnNldE5vdGUodmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2tleVwiKSB0eC5zZXRLZXkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eXBlXCIpIHsgfSAvLyB0eXBlIGFscmVhZHkgaGFuZGxlZFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X3NpemVcIikgdHguc2V0U2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja190aW1lXCIpIHR4LnNldFVubG9ja1RpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRcIikgdHguc2V0V2VpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9ja2VkXCIpIHR4LnNldElzTG9ja2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfYmxvYlwiKSB0eC5zZXRGdWxsSGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfbWV0YWRhdGFcIikgdHguc2V0TWV0YWRhdGEodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkb3VibGVfc3BlbmRfc2VlblwiKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2Vlbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiIHx8IGtleSA9PT0gXCJoZWlnaHRcIikge1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgICBoZWFkZXIuc2V0SGVpZ2h0KHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0aW1lc3RhbXBcIikge1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgICBoZWFkZXIuc2V0VGltZXN0YW1wKHZhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gdGltZXN0YW1wIG9mIHVuY29uZmlybWVkIHR4IGlzIGN1cnJlbnQgcmVxdWVzdCB0aW1lXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjb25maXJtYXRpb25zXCIpIHR4LnNldE51bUNvbmZpcm1hdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWdnZXN0ZWRfY29uZmlybWF0aW9uc190aHJlc2hvbGRcIikge1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIGlmICghaXNPdXRnb2luZykgdHJhbnNmZXIuc2V0TnVtU3VnZ2VzdGVkQ29uZmlybWF0aW9ucyh2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudFwiKSB7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzXCIpIHt9ICAvLyBpZ25vcmluZywgYW1vdW50cyBzdW0gdG8gYW1vdW50XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSB7XG4gICAgICAgIGlmICghaXNPdXRnb2luZykge1xuICAgICAgICAgIGlmICghdHJhbnNmZXIpIHRyYW5zZmVyID0gbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKS5zZXRUeCh0eCk7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGF5bWVudF9pZFwiKSB7XG4gICAgICAgIGlmIChcIlwiICE9PSB2YWwgJiYgTW9uZXJvVHhXYWxsZXQuREVGQVVMVF9QQVlNRU5UX0lEICE9PSB2YWwpIHR4LnNldFBheW1lbnRJZCh2YWwpOyAgLy8gZGVmYXVsdCBpcyB1bmRlZmluZWRcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGV4XCIpIGFzc2VydChycGNUeC5zdWJhZGRyX2luZGljZXMpOyAgLy8gaGFuZGxlZCBieSBzdWJhZGRyX2luZGljZXNcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGljZXNcIikge1xuICAgICAgICBpZiAoIXRyYW5zZmVyKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgbGV0IHJwY0luZGljZXMgPSB2YWw7XG4gICAgICAgIHRyYW5zZmVyLnNldEFjY291bnRJbmRleChycGNJbmRpY2VzWzBdLm1ham9yKTtcbiAgICAgICAgaWYgKGlzT3V0Z29pbmcpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgICBmb3IgKGxldCBycGNJbmRleCBvZiBycGNJbmRpY2VzKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKHJwY0luZGV4Lm1pbm9yKTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kaWNlcyhzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsKHJwY0luZGljZXMubGVuZ3RoLCAxKTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kZXgocnBjSW5kaWNlc1swXS5taW5vcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkZXN0aW5hdGlvbnNcIiB8fCBrZXkgPT0gXCJyZWNpcGllbnRzXCIpIHtcbiAgICAgICAgYXNzZXJ0KGlzT3V0Z29pbmcpO1xuICAgICAgICBsZXQgZGVzdGluYXRpb25zID0gW107XG4gICAgICAgIGZvciAobGV0IHJwY0Rlc3RpbmF0aW9uIG9mIHZhbCkge1xuICAgICAgICAgIGxldCBkZXN0aW5hdGlvbiA9IG5ldyBNb25lcm9EZXN0aW5hdGlvbigpO1xuICAgICAgICAgIGRlc3RpbmF0aW9ucy5wdXNoKGRlc3RpbmF0aW9uKTtcbiAgICAgICAgICBmb3IgKGxldCBkZXN0aW5hdGlvbktleSBvZiBPYmplY3Qua2V5cyhycGNEZXN0aW5hdGlvbikpIHtcbiAgICAgICAgICAgIGlmIChkZXN0aW5hdGlvbktleSA9PT0gXCJhZGRyZXNzXCIpIGRlc3RpbmF0aW9uLnNldEFkZHJlc3MocnBjRGVzdGluYXRpb25bZGVzdGluYXRpb25LZXldKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKGRlc3RpbmF0aW9uS2V5ID09PSBcImFtb3VudFwiKSBkZXN0aW5hdGlvbi5zZXRBbW91bnQoQmlnSW50KHJwY0Rlc3RpbmF0aW9uW2Rlc3RpbmF0aW9uS2V5XSkpO1xuICAgICAgICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNhY3Rpb24gZGVzdGluYXRpb24gZmllbGQ6IFwiICsgZGVzdGluYXRpb25LZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2Zlcih7dHg6IHR4fSk7XG4gICAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhkZXN0aW5hdGlvbnMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm11bHRpc2lnX3R4c2V0XCIgJiYgdmFsICE9PSB1bmRlZmluZWQpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlOyB0aGlzIG1ldGhvZCBvbmx5IGJ1aWxkcyBhIHR4IHdhbGxldFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVuc2lnbmVkX3R4c2V0XCIgJiYgdmFsICE9PSB1bmRlZmluZWQpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlOyB0aGlzIG1ldGhvZCBvbmx5IGJ1aWxkcyBhIHR4IHdhbGxldFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9pblwiKSB0eC5zZXRJbnB1dFN1bShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50X291dFwiKSB0eC5zZXRPdXRwdXRTdW0oQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNoYW5nZV9hZGRyZXNzXCIpIHR4LnNldENoYW5nZUFkZHJlc3ModmFsID09PSBcIlwiID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjaGFuZ2VfYW1vdW50XCIpIHR4LnNldENoYW5nZUFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZHVtbXlfb3V0cHV0c1wiKSB0eC5zZXROdW1EdW1teU91dHB1dHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJleHRyYVwiKSB0eC5zZXRFeHRyYUhleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJpbmdfc2l6ZVwiKSB0eC5zZXRSaW5nU2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50X2tleV9pbWFnZXNcIikge1xuICAgICAgICBsZXQgaW5wdXRLZXlJbWFnZXMgPSB2YWwua2V5X2ltYWdlcztcbiAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZSh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdHguc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgZm9yIChsZXQgaW5wdXRLZXlJbWFnZSBvZiBpbnB1dEtleUltYWdlcykge1xuICAgICAgICAgIHR4LmdldElucHV0cygpLnB1c2gobmV3IE1vbmVyb091dHB1dFdhbGxldCgpLnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSgpLnNldEhleChpbnB1dEtleUltYWdlKSkuc2V0VHgodHgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNfYnlfZGVzdFwiKSB7XG4gICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUoaXNPdXRnb2luZyk7XG4gICAgICAgIGxldCBhbW91bnRzQnlEZXN0ID0gdmFsLmFtb3VudHM7XG4gICAgICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoLCBhbW91bnRzQnlEZXN0Lmxlbmd0aCk7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHgpO1xuICAgICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoW10pO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHRyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVtpXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnRzQnlEZXN0W2ldKSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZCB3aXRoIHRyYW5zZmVyOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGxpbmsgYmxvY2sgYW5kIHR4XG4gICAgaWYgKGhlYWRlcikgdHguc2V0QmxvY2sobmV3IE1vbmVyb0Jsb2NrKGhlYWRlcikuc2V0VHhzKFt0eF0pKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIGZpbmFsIGZpZWxkc1xuICAgIGlmICh0cmFuc2Zlcikge1xuICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgaWYgKCF0cmFuc2Zlci5nZXRUeCgpLmdldElzQ29uZmlybWVkKCkpIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICBpZiAoaXNPdXRnb2luZykge1xuICAgICAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgICAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpKSB7XG4gICAgICAgICAgaWYgKHRyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpKSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0RGVzdGluYXRpb25zKHVuZGVmaW5lZCk7IC8vIG92ZXJ3cml0ZSB0byBhdm9pZCByZWNvbmNpbGUgZXJyb3IgVE9ETzogcmVtb3ZlIGFmdGVyID4xOC4zLjEgd2hlbiBhbW91bnRzX2J5X2Rlc3Qgc3VwcG9ydGVkXG4gICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLm1lcmdlKHRyYW5zZmVyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHguc2V0SXNJbmNvbWluZyh0cnVlKTtcbiAgICAgICAgdHguc2V0SW5jb21pbmdUcmFuc2ZlcnMoW3RyYW5zZmVyXSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHJldHVybiBpbml0aWFsaXplZCB0cmFuc2FjdGlvblxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhXYWxsZXRXaXRoT3V0cHV0KHJwY091dHB1dCkge1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhcbiAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoe3R4OiB0eH0pO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNPdXRwdXQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjT3V0cHV0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFtb3VudFwiKSBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGVudFwiKSBvdXRwdXQuc2V0SXNTcGVudCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImtleV9pbWFnZVwiKSB7IGlmIChcIlwiICE9PSB2YWwpIG91dHB1dC5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UodmFsKSk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJnbG9iYWxfaW5kZXhcIikgb3V0cHV0LnNldEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRcIikgdHguc2V0SXNMb2NrZWQoIXZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZnJvemVuXCIpIG91dHB1dC5zZXRJc0Zyb3plbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInB1YmtleVwiKSBvdXRwdXQuc2V0U3RlYWx0aFB1YmxpY0tleSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1YmFkZHJfaW5kZXhcIikge1xuICAgICAgICBvdXRwdXQuc2V0QWNjb3VudEluZGV4KHZhbC5tYWpvcik7XG4gICAgICAgIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgodmFsLm1pbm9yKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oZWlnaHRcIikgdHguc2V0QmxvY2soKG5ldyBNb25lcm9CbG9jaygpLnNldEhlaWdodCh2YWwpIGFzIE1vbmVyb0Jsb2NrKS5zZXRUeHMoW3R4IGFzIE1vbmVyb1R4XSkpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgdHJhbnNhY3Rpb24gZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCB3aXRoIG91dHB1dFxuICAgIHR4LnNldE91dHB1dHMoW291dHB1dF0pO1xuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlcihycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0KSB7XG4gICAgbGV0IHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJkZXNjXCIpIHtcbiAgICAgICAgdHhTZXQuc2V0VHhzKFtdKTtcbiAgICAgICAgZm9yIChsZXQgdHhNYXAgb2YgdmFsKSB7XG4gICAgICAgICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhUcmFuc2Zlcih0eE1hcCwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgICB0eC5zZXRUeFNldCh0eFNldCk7XG4gICAgICAgICAgdHhTZXQuZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdW1tYXJ5XCIpIHsgfSAvLyBUT0RPOiBzdXBwb3J0IHR4IHNldCBzdW1tYXJ5IGZpZWxkcz9cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGRlc2NkcmliZSB0cmFuc2ZlciBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZWNvZGVzIGEgXCJ0eXBlXCIgZnJvbSBtb25lcm8td2FsbGV0LXJwYyB0byBpbml0aWFsaXplIHR5cGUgYW5kIHN0YXRlXG4gICAqIGZpZWxkcyBpbiB0aGUgZ2l2ZW4gdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBUT0RPOiB0aGVzZSBzaG91bGQgYmUgc2FmZSBzZXRcbiAgICogXG4gICAqIEBwYXJhbSBycGNUeXBlIGlzIHRoZSB0eXBlIHRvIGRlY29kZVxuICAgKiBAcGFyYW0gdHggaXMgdGhlIHRyYW5zYWN0aW9uIHRvIGRlY29kZSBrbm93biBmaWVsZHMgdG9cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgcnBjIHR5cGUgaW5kaWNhdGVzIG91dGdvaW5nIHhvciBpbmNvbWluZ1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBkZWNvZGVScGNUeXBlKHJwY1R5cGUsIHR4KSB7XG4gICAgbGV0IGlzT3V0Z29pbmc7XG4gICAgaWYgKHJwY1R5cGUgPT09IFwiaW5cIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcIm91dFwiKSB7XG4gICAgICBpc091dGdvaW5nID0gdHJ1ZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJwb29sXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSBmYWxzZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKHRydWUpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpOyAgLy8gVE9ETzogYnV0IGNvdWxkIGl0IGJlP1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJwZW5kaW5nXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcImJsb2NrXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSBmYWxzZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgodHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcImZhaWxlZFwiKSB7XG4gICAgICBpc091dGdvaW5nID0gdHJ1ZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNmZXIgdHlwZTogXCIgKyBycGNUeXBlKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzT3V0Z29pbmc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNZXJnZXMgYSB0cmFuc2FjdGlvbiBpbnRvIGEgdW5pcXVlIHNldCBvZiB0cmFuc2FjdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhXYWxsZXR9IHR4IC0gdGhlIHRyYW5zYWN0aW9uIHRvIG1lcmdlIGludG8gdGhlIGV4aXN0aW5nIHR4c1xuICAgKiBAcGFyYW0ge09iamVjdH0gdHhNYXAgLSBtYXBzIHR4IGhhc2hlcyB0byB0eHNcbiAgICogQHBhcmFtIHtPYmplY3R9IGJsb2NrTWFwIC0gbWFwcyBibG9jayBoZWlnaHRzIHRvIGJsb2Nrc1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBtZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApIHtcbiAgICBhc3NlcnQodHguZ2V0SGFzaCgpICE9PSB1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIG1lcmdlIHR4XG4gICAgbGV0IGFUeCA9IHR4TWFwW3R4LmdldEhhc2goKV07XG4gICAgaWYgKGFUeCA9PT0gdW5kZWZpbmVkKSB0eE1hcFt0eC5nZXRIYXNoKCldID0gdHg7IC8vIGNhY2hlIG5ldyB0eFxuICAgIGVsc2UgYVR4Lm1lcmdlKHR4KTsgLy8gbWVyZ2Ugd2l0aCBleGlzdGluZyB0eFxuICAgIFxuICAgIC8vIG1lcmdlIHR4J3MgYmxvY2sgaWYgY29uZmlybWVkXG4gICAgaWYgKHR4LmdldEhlaWdodCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBhQmxvY2sgPSBibG9ja01hcFt0eC5nZXRIZWlnaHQoKV07XG4gICAgICBpZiAoYUJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrTWFwW3R4LmdldEhlaWdodCgpXSA9IHR4LmdldEJsb2NrKCk7IC8vIGNhY2hlIG5ldyBibG9ja1xuICAgICAgZWxzZSBhQmxvY2subWVyZ2UodHguZ2V0QmxvY2soKSk7IC8vIG1lcmdlIHdpdGggZXhpc3RpbmcgYmxvY2tcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNhY3Rpb25zIGJ5IHRoZWlyIGhlaWdodC5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29tcGFyZVR4c0J5SGVpZ2h0KHR4MSwgdHgyKSB7XG4gICAgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4Mi5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMDsgLy8gYm90aCB1bmNvbmZpcm1lZFxuICAgIGVsc2UgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMTsgICAvLyB0eDEgaXMgdW5jb25maXJtZWRcbiAgICBlbHNlIGlmICh0eDIuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIC0xOyAgLy8gdHgyIGlzIHVuY29uZmlybWVkXG4gICAgbGV0IGRpZmYgPSB0eDEuZ2V0SGVpZ2h0KCkgLSB0eDIuZ2V0SGVpZ2h0KCk7XG4gICAgaWYgKGRpZmYgIT09IDApIHJldHVybiBkaWZmO1xuICAgIHJldHVybiB0eDEuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4MSkgLSB0eDIuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4Mik7IC8vIHR4cyBhcmUgaW4gdGhlIHNhbWUgYmxvY2sgc28gcmV0YWluIHRoZWlyIG9yaWdpbmFsIG9yZGVyXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNmZXJzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBzdGF0aWMgY29tcGFyZUluY29taW5nVHJhbnNmZXJzKHQxLCB0Mikge1xuICAgIGlmICh0MS5nZXRBY2NvdW50SW5kZXgoKSA8IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gLTE7XG4gICAgZWxzZSBpZiAodDEuZ2V0QWNjb3VudEluZGV4KCkgPT09IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gdDEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSB0Mi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICByZXR1cm4gMTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byBvdXRwdXRzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbXBhcmVPdXRwdXRzKG8xLCBvMikge1xuICAgIFxuICAgIC8vIGNvbXBhcmUgYnkgaGVpZ2h0XG4gICAgbGV0IGhlaWdodENvbXBhcmlzb24gPSBNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KG8xLmdldFR4KCksIG8yLmdldFR4KCkpO1xuICAgIGlmIChoZWlnaHRDb21wYXJpc29uICE9PSAwKSByZXR1cm4gaGVpZ2h0Q29tcGFyaXNvbjtcbiAgICBcbiAgICAvLyBjb21wYXJlIGJ5IGFjY291bnQgaW5kZXgsIHN1YmFkZHJlc3MgaW5kZXgsIG91dHB1dCBpbmRleCwgdGhlbiBrZXkgaW1hZ2UgaGV4XG4gICAgbGV0IGNvbXBhcmUgPSBvMS5nZXRBY2NvdW50SW5kZXgoKSAtIG8yLmdldEFjY291bnRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICBjb21wYXJlID0gbzEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSBvMi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICBpZiAoY29tcGFyZSAhPT0gMCkgcmV0dXJuIGNvbXBhcmU7XG4gICAgY29tcGFyZSA9IG8xLmdldEluZGV4KCkgLSBvMi5nZXRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICByZXR1cm4gbzEuZ2V0S2V5SW1hZ2UoKS5nZXRIZXgoKS5sb2NhbGVDb21wYXJlKG8yLmdldEtleUltYWdlKCkuZ2V0SGV4KCkpO1xuICB9XG59XG5cbi8qKlxuICogUG9sbHMgbW9uZXJvLXdhbGxldC1ycGMgdG8gcHJvdmlkZSBsaXN0ZW5lciBub3RpZmljYXRpb25zLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRQb2xsZXIge1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBpc1BvbGxpbmc6IGJvb2xlYW47XG4gIHByb3RlY3RlZCB3YWxsZXQ6IE1vbmVyb1dhbGxldFJwYztcbiAgcHJvdGVjdGVkIGxvb3BlcjogVGFza0xvb3BlcjtcbiAgcHJvdGVjdGVkIHByZXZMb2NrZWRUeHM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZDb25maXJtZWROb3RpZmljYXRpb25zOiBhbnk7XG4gIHByb3RlY3RlZCB0aHJlYWRQb29sOiBhbnk7XG4gIHByb3RlY3RlZCBudW1Qb2xsaW5nOiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2SGVpZ2h0OiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2QmFsYW5jZXM6IGFueTtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICB0aGlzLndhbGxldCA9IHdhbGxldDtcbiAgICB0aGlzLmxvb3BlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jIGZ1bmN0aW9uKCkgeyBhd2FpdCB0aGF0LnBvbGwoKTsgfSk7XG4gICAgdGhpcy5wcmV2TG9ja2VkVHhzID0gW107XG4gICAgdGhpcy5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zID0gbmV3IFNldCgpOyAvLyB0eCBoYXNoZXMgb2YgcHJldmlvdXMgbm90aWZpY2F0aW9uc1xuICAgIHRoaXMucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMgPSBuZXcgU2V0KCk7IC8vIHR4IGhhc2hlcyBvZiBwcmV2aW91c2x5IGNvbmZpcm1lZCBidXQgbm90IHlldCB1bmxvY2tlZCBub3RpZmljYXRpb25zXG4gICAgdGhpcy50aHJlYWRQb29sID0gbmV3IFRocmVhZFBvb2woMSk7IC8vIHN5bmNocm9uaXplIHBvbGxzXG4gICAgdGhpcy5udW1Qb2xsaW5nID0gMDtcbiAgfVxuICBcbiAgc2V0SXNQb2xsaW5nKGlzUG9sbGluZykge1xuICAgIHRoaXMuaXNQb2xsaW5nID0gaXNQb2xsaW5nO1xuICAgIGlmIChpc1BvbGxpbmcpIHRoaXMubG9vcGVyLnN0YXJ0KHRoaXMud2FsbGV0LmdldFN5bmNQZXJpb2RJbk1zKCkpO1xuICAgIGVsc2UgdGhpcy5sb29wZXIuc3RvcCgpO1xuICB9XG4gIFxuICBzZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpIHtcbiAgICB0aGlzLmxvb3Blci5zZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpO1xuICB9XG4gIFxuICBhc3luYyBwb2xsKCkge1xuXG4gICAgLy8gc2tpcCBpZiBuZXh0IHBvbGwgaXMgcXVldWVkXG4gICAgaWYgKHRoaXMubnVtUG9sbGluZyA+IDEpIHJldHVybjtcbiAgICB0aGlzLm51bVBvbGxpbmcrKztcbiAgICBcbiAgICAvLyBzeW5jaHJvbml6ZSBwb2xsc1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICByZXR1cm4gdGhpcy50aHJlYWRQb29sLnN1Ym1pdChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIFxuICAgICAgICAvLyBza2lwIGlmIHdhbGxldCBpcyBjbG9zZWRcbiAgICAgICAgaWYgKGF3YWl0IHRoYXQud2FsbGV0LmlzQ2xvc2VkKCkpIHtcbiAgICAgICAgICB0aGF0Lm51bVBvbGxpbmctLTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHRha2UgaW5pdGlhbCBzbmFwc2hvdFxuICAgICAgICBpZiAodGhhdC5wcmV2QmFsYW5jZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEhlaWdodCgpO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpKTtcbiAgICAgICAgICB0aGF0LnByZXZCYWxhbmNlcyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBoZWlnaHQgY2hhbmdlc1xuICAgICAgICBsZXQgaGVpZ2h0ID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0SGVpZ2h0KCk7XG4gICAgICAgIGlmICh0aGF0LnByZXZIZWlnaHQgIT09IGhlaWdodCkge1xuICAgICAgICAgIGZvciAobGV0IGkgPSB0aGF0LnByZXZIZWlnaHQ7IGkgPCBoZWlnaHQ7IGkrKykgYXdhaXQgdGhhdC5vbk5ld0Jsb2NrKGkpO1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gZ2V0IGxvY2tlZCB0eHMgZm9yIGNvbXBhcmlzb24gdG8gcHJldmlvdXNcbiAgICAgICAgbGV0IG1pbkhlaWdodCA9IE1hdGgubWF4KDAsIGhlaWdodCAtIDcwKTsgLy8gb25seSBtb25pdG9yIHJlY2VudCB0eHNcbiAgICAgICAgbGV0IGxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEluY2x1ZGVPdXRwdXRzKHRydWUpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbGxlY3QgaGFzaGVzIG9mIHR4cyBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCBub0xvbmdlckxvY2tlZEhhc2hlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBwcmV2TG9ja2VkVHggb2YgdGhhdC5wcmV2TG9ja2VkVHhzKSB7XG4gICAgICAgICAgaWYgKHRoYXQuZ2V0VHgobG9ja2VkVHhzLCBwcmV2TG9ja2VkVHguZ2V0SGFzaCgpKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBub0xvbmdlckxvY2tlZEhhc2hlcy5wdXNoKHByZXZMb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gc2F2ZSBsb2NrZWQgdHhzIGZvciBuZXh0IGNvbXBhcmlzb25cbiAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzID0gbG9ja2VkVHhzO1xuICAgICAgICBcbiAgICAgICAgLy8gZmV0Y2ggdHhzIHdoaWNoIGFyZSBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCB1bmxvY2tlZFR4cyA9IG5vTG9uZ2VyTG9ja2VkSGFzaGVzLmxlbmd0aCA9PT0gMCA/IFtdIDogYXdhaXQgdGhhdC53YWxsZXQuZ2V0VHhzKG5ldyBNb25lcm9UeFF1ZXJ5KCkuc2V0SXNMb2NrZWQoZmFsc2UpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEhhc2hlcyhub0xvbmdlckxvY2tlZEhhc2hlcykuc2V0SW5jbHVkZU91dHB1dHModHJ1ZSkpO1xuICAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIG5ldyB1bmNvbmZpcm1lZCBhbmQgY29uZmlybWVkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgbG9ja2VkVHggb2YgbG9ja2VkVHhzKSB7XG4gICAgICAgICAgbGV0IHNlYXJjaFNldCA9IGxvY2tlZFR4LmdldElzQ29uZmlybWVkKCkgPyB0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zIDogdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zO1xuICAgICAgICAgIGxldCB1bmFubm91bmNlZCA9ICFzZWFyY2hTZXQuaGFzKGxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgc2VhcmNoU2V0LmFkZChsb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIGlmICh1bmFubm91bmNlZCkgYXdhaXQgdGhhdC5ub3RpZnlPdXRwdXRzKGxvY2tlZFR4KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgbmV3IHVubG9ja2VkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgdW5sb2NrZWRUeCBvZiB1bmxvY2tlZFR4cykge1xuICAgICAgICAgIHRoYXQucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucy5kZWxldGUodW5sb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIHRoYXQucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMuZGVsZXRlKHVubG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHModW5sb2NrZWRUeCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIGJhbGFuY2UgY2hhbmdlc1xuICAgICAgICBhd2FpdCB0aGF0LmNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzKCk7XG4gICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gYmFja2dyb3VuZCBwb2xsIHdhbGxldCAnXCIgKyBhd2FpdCB0aGF0LndhbGxldC5nZXRQYXRoKCkgKyBcIic6IFwiICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgb25OZXdCbG9jayhoZWlnaHQpIHtcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU5ld0Jsb2NrKGhlaWdodCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBub3RpZnlPdXRwdXRzKHR4KSB7XG4gIFxuICAgIC8vIG5vdGlmeSBzcGVudCBvdXRwdXRzIC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogbW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgYWxsb3cgc2NyYXBlIG9mIHR4IGlucHV0cyBzbyBwcm92aWRpbmcgb25lIGlucHV0IHdpdGggb3V0Z29pbmcgYW1vdW50XG4gICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQodHguZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCgpXG4gICAgICAgICAgLnNldEFtb3VudCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkgKyB0eC5nZXRGZWUoKSlcbiAgICAgICAgICAuc2V0QWNjb3VudEluZGV4KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBY2NvdW50SW5kZXgoKSlcbiAgICAgICAgICAuc2V0U3ViYWRkcmVzc0luZGV4KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSA/IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpWzBdIDogdW5kZWZpbmVkKSAvLyBpbml0aWFsaXplIGlmIHRyYW5zZmVyIHNvdXJjZWQgZnJvbSBzaW5nbGUgc3ViYWRkcmVzc1xuICAgICAgICAgIC5zZXRUeCh0eCk7XG4gICAgICB0eC5zZXRJbnB1dHMoW291dHB1dF0pO1xuICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRTcGVudChvdXRwdXQpO1xuICAgIH1cbiAgICBcbiAgICAvLyBub3RpZnkgcmVjZWl2ZWQgb3V0cHV0c1xuICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRPdXRwdXRzKCkubGVuZ3RoID4gMCkgeyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG91dHB1dHMgb25seSByZXR1cm5lZCBmb3IgY29uZmlybWVkIHR4c1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgeyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGFsbG93IHNjcmFwZSBvZiB1bmNvbmZpcm1lZCByZWNlaXZlZCBvdXRwdXRzIHNvIHVzaW5nIGluY29taW5nIHRyYW5zZmVyIHZhbHVlc1xuICAgICAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB7XG4gICAgICAgICAgb3V0cHV0cy5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKVxuICAgICAgICAgICAgICAuc2V0QWNjb3VudEluZGV4KHRyYW5zZmVyLmdldEFjY291bnRJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0U3ViYWRkcmVzc0luZGV4KHRyYW5zZmVyLmdldFN1YmFkZHJlc3NJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0QW1vdW50KHRyYW5zZmVyLmdldEFtb3VudCgpKVxuICAgICAgICAgICAgICAuc2V0VHgodHgpKTtcbiAgICAgICAgfVxuICAgICAgICB0eC5zZXRPdXRwdXRzKG91dHB1dHMpO1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgZ2V0VHgodHhzLCB0eEhhc2gpIHtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIGlmICh0eEhhc2ggPT09IHR4LmdldEhhc2goKSkgcmV0dXJuIHR4O1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjaGVja0ZvckNoYW5nZWRCYWxhbmNlcygpIHtcbiAgICBsZXQgYmFsYW5jZXMgPSBhd2FpdCB0aGlzLndhbGxldC5nZXRCYWxhbmNlcygpO1xuICAgIGlmIChiYWxhbmNlc1swXSAhPT0gdGhpcy5wcmV2QmFsYW5jZXNbMF0gfHwgYmFsYW5jZXNbMV0gIT09IHRoaXMucHJldkJhbGFuY2VzWzFdKSB7XG4gICAgICB0aGlzLnByZXZCYWxhbmNlcyA9IGJhbGFuY2VzO1xuICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQoYmFsYW5jZXNbMF0sIGJhbGFuY2VzWzFdKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGFBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFdBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLGNBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLGlCQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSx1QkFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sWUFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsa0JBQUEsR0FBQVQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFTLG1CQUFBLEdBQUFWLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVSxjQUFBLEdBQUFYLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVyxrQkFBQSxHQUFBWixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVksWUFBQSxHQUFBYixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWEs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