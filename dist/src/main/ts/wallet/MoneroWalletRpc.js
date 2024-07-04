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
    if (configNormalized.getUnlockTime() !== undefined) params.unlock_time = configNormalized.getUnlockTime().toString();
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
    if (config.getUnlockTime() !== undefined) params.unlock_time = config.getUnlockTime();
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
    if (config.getUnlockTime() !== undefined) params.unlock_time = config.getUnlockTime();
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
      if (tx.getUnlockTime() === undefined) tx.setUnlockTime(config.getUnlockTime() === undefined ? 0 : config.getUnlockTime());
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
    if (tx.getUnlockTime() === undefined) tx.setUnlockTime(config.getUnlockTime() === undefined ? 0 : config.getUnlockTime());
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiTW9uZXJvV2FsbGV0UnBjIiwiTW9uZXJvV2FsbGV0IiwiREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwiYWRkcmVzc0NhY2hlIiwic3luY1BlcmlvZEluTXMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRTZXJ2ZXIiLCJvcGVuV2FsbGV0IiwicGF0aE9yQ29uZmlnIiwicGFzc3dvcmQiLCJNb25lcm9XYWxsZXRDb25maWciLCJwYXRoIiwiZ2V0UGF0aCIsInNlbmRKc29uUmVxdWVzdCIsImZpbGVuYW1lIiwiZ2V0UGFzc3dvcmQiLCJjbGVhciIsImdldENvbm5lY3Rpb25NYW5hZ2VyIiwic2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJzZXREYWVtb25Db25uZWN0aW9uIiwiY3JlYXRlV2FsbGV0IiwiY29uZmlnTm9ybWFsaXplZCIsImdldFNlZWQiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0TmV0d29ya1R5cGUiLCJnZXRBY2NvdW50TG9va2FoZWFkIiwiZ2V0U3ViYWRkcmVzc0xvb2thaGVhZCIsInNldFBhc3N3b3JkIiwic2V0U2VydmVyIiwiZ2V0Q29ubmVjdGlvbiIsImNyZWF0ZVdhbGxldEZyb21TZWVkIiwiY3JlYXRlV2FsbGV0RnJvbUtleXMiLCJjcmVhdGVXYWxsZXRSYW5kb20iLCJnZXRTZWVkT2Zmc2V0IiwiZ2V0UmVzdG9yZUhlaWdodCIsImdldFNhdmVDdXJyZW50IiwiZ2V0TGFuZ3VhZ2UiLCJzZXRMYW5ndWFnZSIsIkRFRkFVTFRfTEFOR1VBR0UiLCJwYXJhbXMiLCJsYW5ndWFnZSIsImVyciIsImhhbmRsZUNyZWF0ZVdhbGxldEVycm9yIiwic2VlZCIsInNlZWRfb2Zmc2V0IiwiZW5hYmxlX211bHRpc2lnX2V4cGVyaW1lbnRhbCIsImdldElzTXVsdGlzaWciLCJyZXN0b3JlX2hlaWdodCIsImF1dG9zYXZlX2N1cnJlbnQiLCJzZXRSZXN0b3JlSGVpZ2h0IiwiYWRkcmVzcyIsInZpZXdrZXkiLCJzcGVuZGtleSIsIm5hbWUiLCJtZXNzYWdlIiwiTW9uZXJvUnBjRXJyb3IiLCJnZXRDb2RlIiwiZ2V0UnBjTWV0aG9kIiwiZ2V0UnBjUGFyYW1zIiwiaXNWaWV3T25seSIsImtleV90eXBlIiwiZSIsInVyaU9yQ29ubmVjdGlvbiIsImlzVHJ1c3RlZCIsInNzbE9wdGlvbnMiLCJjb25uZWN0aW9uIiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIlNzbE9wdGlvbnMiLCJnZXRVcmkiLCJ1c2VybmFtZSIsImdldFVzZXJuYW1lIiwidHJ1c3RlZCIsInNzbF9zdXBwb3J0Iiwic3NsX3ByaXZhdGVfa2V5X3BhdGgiLCJnZXRQcml2YXRlS2V5UGF0aCIsInNzbF9jZXJ0aWZpY2F0ZV9wYXRoIiwiZ2V0Q2VydGlmaWNhdGVQYXRoIiwic3NsX2NhX2ZpbGUiLCJnZXRDZXJ0aWZpY2F0ZUF1dGhvcml0eUZpbGUiLCJzc2xfYWxsb3dlZF9maW5nZXJwcmludHMiLCJnZXRBbGxvd2VkRmluZ2VycHJpbnRzIiwic3NsX2FsbG93X2FueV9jZXJ0IiwiZ2V0QWxsb3dBbnlDZXJ0IiwiZGFlbW9uQ29ubmVjdGlvbiIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJnZXRCYWxhbmNlcyIsImFjY291bnRJZHgiLCJzdWJhZGRyZXNzSWR4IiwiYXNzZXJ0IiwiZXF1YWwiLCJiYWxhbmNlIiwiQmlnSW50IiwidW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudCIsImdldEFjY291bnRzIiwiZ2V0QmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsImFjY291bnRfaW5kZXgiLCJhZGRyZXNzX2luZGljZXMiLCJyZXNwIiwicmVzdWx0IiwidW5sb2NrZWRfYmFsYW5jZSIsInBlcl9zdWJhZGRyZXNzIiwiYWRkTGlzdGVuZXIiLCJyZWZyZXNoTGlzdGVuaW5nIiwiaXNDb25uZWN0ZWRUb0RhZW1vbiIsImNoZWNrUmVzZXJ2ZVByb29mIiwiaW5kZXhPZiIsImdldFZlcnNpb24iLCJNb25lcm9WZXJzaW9uIiwidmVyc2lvbiIsInJlbGVhc2UiLCJnZXRTZWVkTGFuZ3VhZ2UiLCJnZXRTZWVkTGFuZ3VhZ2VzIiwibGFuZ3VhZ2VzIiwiZ2V0QWRkcmVzcyIsInN1YmFkZHJlc3NNYXAiLCJnZXRTdWJhZGRyZXNzZXMiLCJnZXRBZGRyZXNzSW5kZXgiLCJzdWJhZGRyZXNzIiwiTW9uZXJvU3ViYWRkcmVzcyIsInNldEFjY291bnRJbmRleCIsImluZGV4IiwibWFqb3IiLCJzZXRJbmRleCIsIm1pbm9yIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJpbnRlZ3JhdGVkQWRkcmVzc1N0ciIsInN0YW5kYXJkX2FkZHJlc3MiLCJwYXltZW50X2lkIiwiaW50ZWdyYXRlZF9hZGRyZXNzIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbmNsdWRlcyIsImludGVncmF0ZWRBZGRyZXNzIiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJzZXRTdGFuZGFyZEFkZHJlc3MiLCJzZXRQYXltZW50SWQiLCJzZXRJbnRlZ3JhdGVkQWRkcmVzcyIsImdldEhlaWdodCIsImhlaWdodCIsImdldERhZW1vbkhlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsInN5bmMiLCJsaXN0ZW5lck9yU3RhcnRIZWlnaHQiLCJzdGFydEhlaWdodCIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwic3RhcnRfaGVpZ2h0IiwicG9sbCIsIk1vbmVyb1N5bmNSZXN1bHQiLCJibG9ja3NfZmV0Y2hlZCIsInJlY2VpdmVkX21vbmV5Iiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluU2Vjb25kcyIsIk1hdGgiLCJyb3VuZCIsImVuYWJsZSIsInBlcmlvZCIsIndhbGxldFBvbGxlciIsInNldFBlcmlvZEluTXMiLCJnZXRTeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwibGVuZ3RoIiwidHhpZHMiLCJyZXNjYW5TcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwic2tpcEJhbGFuY2VzIiwiYWNjb3VudHMiLCJycGNBY2NvdW50Iiwic3ViYWRkcmVzc19hY2NvdW50cyIsImNvbnZlcnRScGNBY2NvdW50Iiwic2V0U3ViYWRkcmVzc2VzIiwiZ2V0SW5kZXgiLCJwdXNoIiwic2V0QmFsYW5jZSIsInNldFVubG9ja2VkQmFsYW5jZSIsInNldE51bVVuc3BlbnRPdXRwdXRzIiwic2V0TnVtQmxvY2tzVG9VbmxvY2siLCJhbGxfYWNjb3VudHMiLCJycGNTdWJhZGRyZXNzIiwiY29udmVydFJwY1N1YmFkZHJlc3MiLCJnZXRBY2NvdW50SW5kZXgiLCJ0Z3RTdWJhZGRyZXNzIiwiZ2V0TnVtVW5zcGVudE91dHB1dHMiLCJnZXRBY2NvdW50IiwiRXJyb3IiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJNb25lcm9BY2NvdW50IiwicHJpbWFyeUFkZHJlc3MiLCJzdWJhZGRyZXNzSW5kaWNlcyIsImFkZHJlc3NfaW5kZXgiLCJsaXN0aWZ5Iiwic3ViYWRkcmVzc2VzIiwiYWRkcmVzc2VzIiwiZ2V0TnVtQmxvY2tzVG9VbmxvY2siLCJnZXRTdWJhZGRyZXNzIiwiY3JlYXRlU3ViYWRkcmVzcyIsInNldEFkZHJlc3MiLCJzZXRMYWJlbCIsInNldElzVXNlZCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwicXVlcnlOb3JtYWxpemVkIiwibm9ybWFsaXplVHhRdWVyeSIsInRyYW5zZmVyUXVlcnkiLCJnZXRUcmFuc2ZlclF1ZXJ5IiwiaW5wdXRRdWVyeSIsImdldElucHV0UXVlcnkiLCJvdXRwdXRRdWVyeSIsImdldE91dHB1dFF1ZXJ5Iiwic2V0VHJhbnNmZXJRdWVyeSIsInNldElucHV0UXVlcnkiLCJzZXRPdXRwdXRRdWVyeSIsInRyYW5zZmVycyIsImdldFRyYW5zZmVyc0F1eCIsIk1vbmVyb1RyYW5zZmVyUXVlcnkiLCJzZXRUeFF1ZXJ5IiwiZGVjb250ZXh0dWFsaXplIiwiY29weSIsInR4cyIsInR4c1NldCIsIlNldCIsInRyYW5zZmVyIiwiZ2V0VHgiLCJhZGQiLCJ0eE1hcCIsImJsb2NrTWFwIiwidHgiLCJtZXJnZVR4IiwiZ2V0SW5jbHVkZU91dHB1dHMiLCJvdXRwdXRRdWVyeUF1eCIsIk1vbmVyb091dHB1dFF1ZXJ5Iiwib3V0cHV0cyIsImdldE91dHB1dHNBdXgiLCJvdXRwdXRUeHMiLCJvdXRwdXQiLCJ0eHNRdWVyaWVkIiwibWVldHNDcml0ZXJpYSIsImdldEJsb2NrIiwic3BsaWNlIiwiZ2V0SXNDb25maXJtZWQiLCJjb25zb2xlIiwiZXJyb3IiLCJnZXRIYXNoZXMiLCJ0eHNCeUlkIiwiTWFwIiwiZ2V0SGFzaCIsIm9yZGVyZWRUeHMiLCJoYXNoIiwiZ2V0VHJhbnNmZXJzIiwibm9ybWFsaXplVHJhbnNmZXJRdWVyeSIsImlzQ29udGV4dHVhbCIsImdldFR4UXVlcnkiLCJmaWx0ZXJUcmFuc2ZlcnMiLCJnZXRPdXRwdXRzIiwibm9ybWFsaXplT3V0cHV0UXVlcnkiLCJmaWx0ZXJPdXRwdXRzIiwiZXhwb3J0T3V0cHV0cyIsImFsbCIsIm91dHB1dHNfZGF0YV9oZXgiLCJpbXBvcnRPdXRwdXRzIiwib3V0cHV0c0hleCIsIm51bV9pbXBvcnRlZCIsImV4cG9ydEtleUltYWdlcyIsInJwY0V4cG9ydEtleUltYWdlcyIsImltcG9ydEtleUltYWdlcyIsImtleUltYWdlcyIsInJwY0tleUltYWdlcyIsIm1hcCIsImtleUltYWdlIiwia2V5X2ltYWdlIiwiZ2V0SGV4Iiwic2lnbmF0dXJlIiwiZ2V0U2lnbmF0dXJlIiwic2lnbmVkX2tleV9pbWFnZXMiLCJpbXBvcnRSZXN1bHQiLCJNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsInNldEhlaWdodCIsInNldFNwZW50QW1vdW50Iiwic3BlbnQiLCJzZXRVbnNwZW50QW1vdW50IiwidW5zcGVudCIsImdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0IiwiZnJlZXplT3V0cHV0IiwidGhhd091dHB1dCIsImlzT3V0cHV0RnJvemVuIiwiZnJvemVuIiwiY3JlYXRlVHhzIiwibm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnIiwiZ2V0Q2FuU3BsaXQiLCJzZXRDYW5TcGxpdCIsImdldFJlbGF5IiwiaXNNdWx0aXNpZyIsImdldFN1YmFkZHJlc3NJbmRpY2VzIiwic2xpY2UiLCJkZXN0aW5hdGlvbnMiLCJkZXN0aW5hdGlvbiIsImdldERlc3RpbmF0aW9ucyIsImdldEFtb3VudCIsImFtb3VudCIsInRvU3RyaW5nIiwiZ2V0U3VidHJhY3RGZWVGcm9tIiwic3VidHJhY3RfZmVlX2Zyb21fb3V0cHV0cyIsInN1YmFkZHJfaW5kaWNlcyIsImdldFBheW1lbnRJZCIsImdldFVubG9ja1RpbWUiLCJ1bmxvY2tfdGltZSIsImRvX25vdF9yZWxheSIsImdldFByaW9yaXR5IiwicHJpb3JpdHkiLCJnZXRfdHhfaGV4IiwiZ2V0X3R4X21ldGFkYXRhIiwiZ2V0X3R4X2tleXMiLCJnZXRfdHhfa2V5IiwibnVtVHhzIiwiZmVlX2xpc3QiLCJmZWUiLCJjb3B5RGVzdGluYXRpb25zIiwiaSIsIk1vbmVyb1R4V2FsbGV0IiwiaW5pdFNlbnRUeFdhbGxldCIsImdldE91dGdvaW5nVHJhbnNmZXIiLCJzZXRTdWJhZGRyZXNzSW5kaWNlcyIsImNvbnZlcnRScGNTZW50VHhzVG9UeFNldCIsImNvbnZlcnRScGNUeFRvVHhTZXQiLCJzd2VlcE91dHB1dCIsIm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnIiwiZ2V0S2V5SW1hZ2UiLCJzZXRBbW91bnQiLCJzd2VlcFVubG9ja2VkIiwibm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyIsImluZGljZXMiLCJrZXlzIiwic2V0U3dlZXBFYWNoU3ViYWRkcmVzcyIsImdldFN3ZWVwRWFjaFN1YmFkZHJlc3MiLCJycGNTd2VlcEFjY291bnQiLCJzd2VlcER1c3QiLCJyZWxheSIsInR4U2V0Iiwic2V0SXNSZWxheWVkIiwic2V0SW5UeFBvb2wiLCJnZXRJc1JlbGF5ZWQiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiQXJyYXkiLCJpc0FycmF5IiwidHhPck1ldGFkYXRhIiwibWV0YWRhdGEiLCJnZXRNZXRhZGF0YSIsImhleCIsInR4X2hhc2giLCJkZXNjcmliZVR4U2V0IiwidW5zaWduZWRfdHhzZXQiLCJnZXRVbnNpZ25lZFR4SGV4IiwibXVsdGlzaWdfdHhzZXQiLCJnZXRNdWx0aXNpZ1R4SGV4IiwiY29udmVydFJwY0Rlc2NyaWJlVHJhbnNmZXIiLCJzaWduVHhzIiwidW5zaWduZWRUeEhleCIsImV4cG9ydF9yYXciLCJzdWJtaXRUeHMiLCJzaWduZWRUeEhleCIsInR4X2RhdGFfaGV4IiwidHhfaGFzaF9saXN0Iiwic2lnbk1lc3NhZ2UiLCJzaWduYXR1cmVUeXBlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJTSUdOX1dJVEhfU1BFTkRfS0VZIiwiZGF0YSIsInNpZ25hdHVyZV90eXBlIiwidmVyaWZ5TWVzc2FnZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJnb29kIiwiaXNHb29kIiwiaXNPbGQiLCJvbGQiLCJTSUdOX1dJVEhfVklFV19LRVkiLCJnZXRUeEtleSIsInR4SGFzaCIsInR4aWQiLCJ0eF9rZXkiLCJjaGVja1R4S2V5IiwidHhLZXkiLCJjaGVjayIsIk1vbmVyb0NoZWNrVHgiLCJzZXRJc0dvb2QiLCJzZXROdW1Db25maXJtYXRpb25zIiwiY29uZmlybWF0aW9ucyIsImluX3Bvb2wiLCJzZXRSZWNlaXZlZEFtb3VudCIsInJlY2VpdmVkIiwiZ2V0VHhQcm9vZiIsImNoZWNrVHhQcm9vZiIsImdldFNwZW5kUHJvb2YiLCJjaGVja1NwZW5kUHJvb2YiLCJnZXRSZXNlcnZlUHJvb2ZXYWxsZXQiLCJnZXRSZXNlcnZlUHJvb2ZBY2NvdW50IiwiTW9uZXJvQ2hlY2tSZXNlcnZlIiwic2V0VW5jb25maXJtZWRTcGVudEFtb3VudCIsInNldFRvdGFsQW1vdW50IiwidG90YWwiLCJnZXRUeE5vdGVzIiwibm90ZXMiLCJzZXRUeE5vdGVzIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiZW50cmllcyIsInJwY0VudHJ5IiwiTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsInNldERlc2NyaXB0aW9uIiwiZGVzY3JpcHRpb24iLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJzZXRfYWRkcmVzcyIsInNldF9kZXNjcmlwdGlvbiIsImRlbGV0ZUFkZHJlc3NCb29rRW50cnkiLCJlbnRyeUlkeCIsInRhZ0FjY291bnRzIiwiYWNjb3VudEluZGljZXMiLCJ1bnRhZ0FjY291bnRzIiwiZ2V0QWNjb3VudFRhZ3MiLCJ0YWdzIiwiYWNjb3VudF90YWdzIiwicnBjQWNjb3VudFRhZyIsIk1vbmVyb0FjY291bnRUYWciLCJzZXRBY2NvdW50VGFnTGFiZWwiLCJnZXRQYXltZW50VXJpIiwicmVjaXBpZW50X25hbWUiLCJnZXRSZWNpcGllbnROYW1lIiwidHhfZGVzY3JpcHRpb24iLCJnZXROb3RlIiwidXJpIiwicGFyc2VQYXltZW50VXJpIiwiTW9uZXJvVHhDb25maWciLCJzZXRSZWNpcGllbnROYW1lIiwic2V0Tm90ZSIsImdldEF0dHJpYnV0ZSIsInZhbHVlIiwic2V0QXR0cmlidXRlIiwidmFsIiwic3RhcnRNaW5pbmciLCJudW1UaHJlYWRzIiwiYmFja2dyb3VuZE1pbmluZyIsImlnbm9yZUJhdHRlcnkiLCJ0aHJlYWRzX2NvdW50IiwiZG9fYmFja2dyb3VuZF9taW5pbmciLCJpZ25vcmVfYmF0dGVyeSIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwibXVsdGlzaWdfaW1wb3J0X25lZWRlZCIsImdldE11bHRpc2lnSW5mbyIsImluZm8iLCJNb25lcm9NdWx0aXNpZ0luZm8iLCJzZXRJc011bHRpc2lnIiwibXVsdGlzaWciLCJzZXRJc1JlYWR5IiwicmVhZHkiLCJzZXRUaHJlc2hvbGQiLCJ0aHJlc2hvbGQiLCJzZXROdW1QYXJ0aWNpcGFudHMiLCJwcmVwYXJlTXVsdGlzaWciLCJtdWx0aXNpZ19pbmZvIiwibWFrZU11bHRpc2lnIiwibXVsdGlzaWdIZXhlcyIsImV4Y2hhbmdlTXVsdGlzaWdLZXlzIiwibXNSZXN1bHQiLCJNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQiLCJzZXRNdWx0aXNpZ0hleCIsImdldE11bHRpc2lnSGV4IiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJpbXBvcnRNdWx0aXNpZ0hleCIsIm5fb3V0cHV0cyIsInNpZ25NdWx0aXNpZ1R4SGV4IiwibXVsdGlzaWdUeEhleCIsInNpZ25SZXN1bHQiLCJNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJzZXRTaWduZWRNdWx0aXNpZ1R4SGV4Iiwic2V0VHhIYXNoZXMiLCJzdWJtaXRNdWx0aXNpZ1R4SGV4Iiwic2lnbmVkTXVsdGlzaWdUeEhleCIsImNoYW5nZVBhc3N3b3JkIiwib2xkUGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsIm9sZF9wYXNzd29yZCIsIm5ld19wYXNzd29yZCIsInNhdmUiLCJjbG9zZSIsImlzQ2xvc2VkIiwic3RvcCIsImdldEluY29taW5nVHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlcnMiLCJjcmVhdGVUeCIsInJlbGF5VHgiLCJnZXRUeE5vdGUiLCJzZXRUeE5vdGUiLCJub3RlIiwiY29ubmVjdFRvV2FsbGV0UnBjIiwidXJpT3JDb25maWciLCJub3JtYWxpemVDb25maWciLCJjbWQiLCJzdGFydFdhbGxldFJwY1Byb2Nlc3MiLCJjaGlsZF9wcm9jZXNzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aGVuIiwiY2hpbGRQcm9jZXNzIiwic3Bhd24iLCJlbnYiLCJMQU5HIiwic3Rkb3V0Iiwic2V0RW5jb2RpbmciLCJzdGRlcnIiLCJ0aGF0IiwicmVqZWN0Iiwib24iLCJsaW5lIiwiTGlicmFyeVV0aWxzIiwibG9nIiwidXJpTGluZUNvbnRhaW5zIiwidXJpTGluZUNvbnRhaW5zSWR4IiwiaG9zdCIsInN1YnN0cmluZyIsImxhc3RJbmRleE9mIiwidW5mb3JtYXR0ZWRMaW5lIiwicmVwbGFjZSIsInRyaW0iLCJwb3J0Iiwic3NsSWR4Iiwic3NsRW5hYmxlZCIsInRvTG93ZXJDYXNlIiwidXNlclBhc3NJZHgiLCJ1c2VyUGFzcyIsInJlamVjdFVuYXV0aG9yaXplZCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsIndhbGxldCIsImlzUmVzb2x2ZWQiLCJnZXRMb2dMZXZlbCIsImNvZGUiLCJvcmlnaW4iLCJnZXRBY2NvdW50SW5kaWNlcyIsInR4UXVlcnkiLCJjYW5CZUNvbmZpcm1lZCIsImdldEluVHhQb29sIiwiZ2V0SXNGYWlsZWQiLCJjYW5CZUluVHhQb29sIiwiZ2V0TWF4SGVpZ2h0IiwiZ2V0SXNMb2NrZWQiLCJjYW5CZUluY29taW5nIiwiZ2V0SXNJbmNvbWluZyIsImdldElzT3V0Z29pbmciLCJnZXRIYXNEZXN0aW5hdGlvbnMiLCJjYW5CZU91dGdvaW5nIiwiaW4iLCJvdXQiLCJwb29sIiwicGVuZGluZyIsImZhaWxlZCIsImdldE1pbkhlaWdodCIsIm1pbl9oZWlnaHQiLCJtYXhfaGVpZ2h0IiwiZmlsdGVyX2J5X2hlaWdodCIsImdldFN1YmFkZHJlc3NJbmRleCIsInNpemUiLCJmcm9tIiwicnBjVHgiLCJjb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIiLCJnZXRPdXRnb2luZ0Ftb3VudCIsIm91dGdvaW5nVHJhbnNmZXIiLCJ0cmFuc2ZlclRvdGFsIiwidmFsdWVzIiwic29ydCIsImNvbXBhcmVUeHNCeUhlaWdodCIsInNldElzSW5jb21pbmciLCJzZXRJc091dGdvaW5nIiwiY29tcGFyZUluY29taW5nVHJhbnNmZXJzIiwidHJhbnNmZXJfdHlwZSIsImdldElzU3BlbnQiLCJ2ZXJib3NlIiwicnBjT3V0cHV0IiwiY29udmVydFJwY1R4V2FsbGV0V2l0aE91dHB1dCIsImNvbXBhcmVPdXRwdXRzIiwicnBjSW1hZ2UiLCJNb25lcm9LZXlJbWFnZSIsImJlbG93X2Ftb3VudCIsImdldEJlbG93QW1vdW50Iiwic2V0SXNMb2NrZWQiLCJzZXRJc0NvbmZpcm1lZCIsInNldFJlbGF5Iiwic2V0SXNNaW5lclR4Iiwic2V0SXNGYWlsZWQiLCJNb25lcm9EZXN0aW5hdGlvbiIsInNldERlc3RpbmF0aW9ucyIsInNldE91dGdvaW5nVHJhbnNmZXIiLCJzZXRVbmxvY2tUaW1lIiwiZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJzZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsIkRhdGUiLCJnZXRUaW1lIiwiZ2V0SXNEb3VibGVTcGVuZFNlZW4iLCJzZXRJc0RvdWJsZVNwZW5kU2VlbiIsImxpc3RlbmVycyIsIldhbGxldFBvbGxlciIsInNldElzUG9sbGluZyIsImlzUG9sbGluZyIsInNlcnZlciIsInByb3h5VG9Xb3JrZXIiLCJzZXRQcmltYXJ5QWRkcmVzcyIsInNldFRhZyIsImdldFRhZyIsInNldFJpbmdTaXplIiwiTW9uZXJvVXRpbHMiLCJSSU5HX1NJWkUiLCJNb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwic2V0VHgiLCJkZXN0Q29waWVzIiwiZGVzdCIsImNvbnZlcnRScGNUeFNldCIsInJwY01hcCIsIk1vbmVyb1R4U2V0Iiwic2V0TXVsdGlzaWdUeEhleCIsInNldFVuc2lnbmVkVHhIZXgiLCJzZXRTaWduZWRUeEhleCIsInNpZ25lZF90eHNldCIsImdldFNpZ25lZFR4SGV4IiwicnBjVHhzIiwic2V0VHhzIiwic2V0VHhTZXQiLCJzZXRIYXNoIiwic2V0S2V5Iiwic2V0RnVsbEhleCIsInNldE1ldGFkYXRhIiwic2V0RmVlIiwic2V0V2VpZ2h0IiwiaW5wdXRLZXlJbWFnZXNMaXN0IiwiYXNzZXJ0VHJ1ZSIsImdldElucHV0cyIsInNldElucHV0cyIsImlucHV0S2V5SW1hZ2UiLCJNb25lcm9PdXRwdXRXYWxsZXQiLCJzZXRLZXlJbWFnZSIsInNldEhleCIsImFtb3VudHNCeURlc3RMaXN0IiwiZGVzdGluYXRpb25JZHgiLCJ0eElkeCIsImFtb3VudHNCeURlc3QiLCJpc091dGdvaW5nIiwidHlwZSIsImRlY29kZVJwY1R5cGUiLCJoZWFkZXIiLCJzZXRTaXplIiwiTW9uZXJvQmxvY2tIZWFkZXIiLCJzZXRUaW1lc3RhbXAiLCJNb25lcm9JbmNvbWluZ1RyYW5zZmVyIiwic2V0TnVtU3VnZ2VzdGVkQ29uZmlybWF0aW9ucyIsIkRFRkFVTFRfUEFZTUVOVF9JRCIsInJwY0luZGljZXMiLCJycGNJbmRleCIsInNldFN1YmFkZHJlc3NJbmRleCIsInJwY0Rlc3RpbmF0aW9uIiwiZGVzdGluYXRpb25LZXkiLCJzZXRJbnB1dFN1bSIsInNldE91dHB1dFN1bSIsInNldENoYW5nZUFkZHJlc3MiLCJzZXRDaGFuZ2VBbW91bnQiLCJzZXROdW1EdW1teU91dHB1dHMiLCJzZXRFeHRyYUhleCIsImlucHV0S2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsImFtb3VudHMiLCJzZXRCbG9jayIsIk1vbmVyb0Jsb2NrIiwibWVyZ2UiLCJzZXRJbmNvbWluZ1RyYW5zZmVycyIsInNldElzU3BlbnQiLCJzZXRJc0Zyb3plbiIsInNldFN0ZWFsdGhQdWJsaWNLZXkiLCJzZXRPdXRwdXRzIiwicnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdCIsInJwY1R5cGUiLCJhVHgiLCJhQmxvY2siLCJ0eDEiLCJ0eDIiLCJkaWZmIiwidDEiLCJ0MiIsIm8xIiwibzIiLCJoZWlnaHRDb21wYXJpc29uIiwiY29tcGFyZSIsImxvY2FsZUNvbXBhcmUiLCJleHBvcnRzIiwibG9vcGVyIiwiVGFza0xvb3BlciIsInByZXZMb2NrZWRUeHMiLCJwcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zIiwicHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMiLCJ0aHJlYWRQb29sIiwiVGhyZWFkUG9vbCIsIm51bVBvbGxpbmciLCJzdGFydCIsInBlcmlvZEluTXMiLCJzdWJtaXQiLCJwcmV2QmFsYW5jZXMiLCJwcmV2SGVpZ2h0IiwiTW9uZXJvVHhRdWVyeSIsIm9uTmV3QmxvY2siLCJtaW5IZWlnaHQiLCJtYXgiLCJsb2NrZWRUeHMiLCJzZXRNaW5IZWlnaHQiLCJzZXRJbmNsdWRlT3V0cHV0cyIsIm5vTG9uZ2VyTG9ja2VkSGFzaGVzIiwicHJldkxvY2tlZFR4IiwidW5sb2NrZWRUeHMiLCJzZXRIYXNoZXMiLCJsb2NrZWRUeCIsInNlYXJjaFNldCIsInVuYW5ub3VuY2VkIiwibm90aWZ5T3V0cHV0cyIsInVubG9ja2VkVHgiLCJkZWxldGUiLCJjaGVja0ZvckNoYW5nZWRCYWxhbmNlcyIsImFubm91bmNlTmV3QmxvY2siLCJnZXRGZWUiLCJhbm5vdW5jZU91dHB1dFNwZW50IiwiYW5ub3VuY2VPdXRwdXRSZWNlaXZlZCIsImJhbGFuY2VzIiwiYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0UnBjLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuLi9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBUYXNrTG9vcGVyIGZyb20gXCIuLi9jb21tb24vVGFza0xvb3BlclwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnRUYWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFRhZ1wiO1xuaW1wb3J0IE1vbmVyb0FkZHJlc3NCb29rRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9CbG9ja0hlYWRlciBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrSGVhZGVyXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tSZXNlcnZlIGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrUmVzZXJ2ZVwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrVHggZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tUeFwiO1xuaW1wb3J0IE1vbmVyb0Rlc3RpbmF0aW9uIGZyb20gXCIuL21vZGVsL01vbmVyb0Rlc3RpbmF0aW9uXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0luY29taW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW5jb21pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5mb1wiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luaXRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0UXVlcnlcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9ScGNFcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvU3ViYWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJhZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvU3luY1Jlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TeW5jUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlclF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyUXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1R4V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0IGZyb20gXCIuL01vbmVyb1dhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRDb25maWdcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0XCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi4vY29tbW9uL1RocmVhZFBvb2xcIjtcbmltcG9ydCBTc2xPcHRpb25zIGZyb20gXCIuLi9jb21tb24vU3NsT3B0aW9uc1wiO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIHdvb2RzZXJcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb1dhbGxldCBhcyBhIGNsaWVudCBvZiBtb25lcm8td2FsbGV0LXJwYy5cbiAqIFxuICogQGltcGxlbWVudHMge01vbmVyb1dhbGxldH1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvV2FsbGV0UnBjIGV4dGVuZHMgTW9uZXJvV2FsbGV0IHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA9IDIwMDAwOyAvLyBkZWZhdWx0IHBlcmlvZCBiZXR3ZWVuIHN5bmNzIGluIG1zIChkZWZpbmVkIGJ5IERFRkFVTFRfQVVUT19SRUZSRVNIX1BFUklPRCBpbiB3YWxsZXRfcnBjX3NlcnZlci5jcHApXG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPjtcbiAgcHJvdGVjdGVkIGFkZHJlc3NDYWNoZTogYW55O1xuICBwcm90ZWN0ZWQgc3luY1BlcmlvZEluTXM6IG51bWJlcjtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXTtcbiAgcHJvdGVjdGVkIHByb2Nlc3M6IGFueTtcbiAgcHJvdGVjdGVkIHBhdGg6IHN0cmluZztcbiAgcHJvdGVjdGVkIGRhZW1vbkNvbm5lY3Rpb246IE1vbmVyb1JwY0Nvbm5lY3Rpb247XG4gIHByb3RlY3RlZCB3YWxsZXRQb2xsZXI6IFdhbGxldFBvbGxlcjtcbiAgXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTsgLy8gYXZvaWQgdW5lY2Vzc2FyeSByZXF1ZXN0cyBmb3IgYWRkcmVzc2VzXG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IE1vbmVyb1dhbGxldFJwYy5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUlBDIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaW50ZXJuYWwgcHJvY2VzcyBydW5uaW5nIG1vbmVyby13YWxsZXQtcnBjLlxuICAgKiBcbiAgICogQHJldHVybiB7Q2hpbGRQcm9jZXNzfSB0aGUgcHJvY2VzcyBydW5uaW5nIG1vbmVyby13YWxsZXQtcnBjLCB1bmRlZmluZWQgaWYgbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1xuICAgKi9cbiAgZ2V0UHJvY2VzcygpOiBDaGlsZFByb2Nlc3Mge1xuICAgIHJldHVybiB0aGlzLnByb2Nlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9wIHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMsIGlmIGFwcGxpY2FibGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZvcmNlIHNwZWNpZmllcyBpZiB0aGUgcHJvY2VzcyBzaG91bGQgYmUgZGVzdHJveWVkIGZvcmNpYmx5IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD59IHRoZSBleGl0IGNvZGUgZnJvbSBzdG9wcGluZyB0aGUgcHJvY2Vzc1xuICAgKi9cbiAgYXN5bmMgc3RvcFByb2Nlc3MoZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPiAge1xuICAgIGlmICh0aGlzLnByb2Nlc3MgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0UnBjIGluc3RhbmNlIG5vdCBjcmVhdGVkIGZyb20gbmV3IHByb2Nlc3NcIik7XG4gICAgbGV0IGxpc3RlbmVyc0NvcHkgPSBHZW5VdGlscy5jb3B5QXJyYXkodGhpcy5nZXRMaXN0ZW5lcnMoKSk7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgbGlzdGVuZXJzQ29weSkgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgcmV0dXJuIEdlblV0aWxzLmtpbGxQcm9jZXNzKHRoaXMucHJvY2VzcywgZm9yY2UgPyBcIlNJR0tJTExcIiA6IHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIFJQQyBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZH0gdGhlIHdhbGxldCdzIHJwYyBjb25uZWN0aW9uXG4gICAqL1xuICBnZXRScGNDb25uZWN0aW9uKCk6IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPk9wZW4gYW4gZXhpc3Rpbmcgd2FsbGV0IG9uIHRoZSBtb25lcm8td2FsbGV0LXJwYyBzZXJ2ZXIuPC9wPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZTo8cD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiBsZXQgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldFJwYyhcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODRcIiwgXCJycGNfdXNlclwiLCBcImFiYzEyM1wiKTs8YnI+XG4gICAqIGF3YWl0IHdhbGxldC5vcGVuV2FsbGV0KFwibXl3YWxsZXQxXCIsIFwic3VwZXJzZWNyZXRwYXNzd29yZFwiKTs8YnI+XG4gICAqIDxicj5cbiAgICogYXdhaXQgd2FsbGV0Lm9wZW5XYWxsZXQoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwibXl3YWxsZXQyXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwic3VwZXJzZWNyZXRwYXNzd29yZFwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHNlcnZlcjogXCJodHRwOi8vbG9jYWhvc3Q6MzgwODFcIiwgLy8gb3Igb2JqZWN0IHdpdGggdXJpLCB1c2VybmFtZSwgcGFzc3dvcmQsIGV0YyA8YnI+XG4gICAqICZuYnNwOyZuYnNwOyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlPGJyPlxuICAgKiB9KTs8YnI+XG4gICAqIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfE1vbmVyb1dhbGxldENvbmZpZ30gcGF0aE9yQ29uZmlnICAtIHRoZSB3YWxsZXQncyBuYW1lIG9yIGNvbmZpZ3VyYXRpb24gdG8gb3BlblxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aE9yQ29uZmlnLnBhdGggLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoT3JDb25maWcucGFzc3dvcmQgLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ3xQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fSBwYXRoT3JDb25maWcuc2VydmVyIC0gdXJpIG9yIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb2YgYSBkYWVtb24gdG8gdXNlIChvcHRpb25hbCwgbW9uZXJvLXdhbGxldC1ycGMgdXN1YWxseSBzdGFydGVkIHdpdGggZGFlbW9uIGNvbmZpZylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtwYXNzd29yZF0gdGhlIHdhbGxldCdzIHBhc3N3b3JkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvV2FsbGV0UnBjPn0gdGhpcyB3YWxsZXQgY2xpZW50XG4gICAqL1xuICBhc3luYyBvcGVuV2FsbGV0KHBhdGhPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+LCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh0eXBlb2YgcGF0aE9yQ29uZmlnID09PSBcInN0cmluZ1wiID8ge3BhdGg6IHBhdGhPckNvbmZpZywgcGFzc3dvcmQ6IHBhc3N3b3JkID8gcGFzc3dvcmQgOiBcIlwifSA6IHBhdGhPckNvbmZpZyk7XG4gICAgLy8gVE9ETzogZW5zdXJlIG90aGVyIGZpZWxkcyB1bmluaXRpYWxpemVkP1xuICAgIFxuICAgIC8vIG9wZW4gd2FsbGV0IG9uIHJwYyBzZXJ2ZXJcbiAgICBpZiAoIWNvbmZpZy5nZXRQYXRoKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBuYW1lIG9mIHdhbGxldCB0byBvcGVuXCIpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm9wZW5fd2FsbGV0XCIsIHtmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSwgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpfSk7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG5cbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyIG9yIHNlcnZlclxuICAgIGlmIChjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSAhPSBudWxsKSB7XG4gICAgICBpZiAoY29uZmlnLmdldFNlcnZlcigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIG9wZW5lZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBhd2FpdCB0aGlzLnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICB9IGVsc2UgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSAhPSBudWxsKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldERhZW1vbkNvbm5lY3Rpb24oY29uZmlnLmdldFNlcnZlcigpKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5DcmVhdGUgYW5kIG9wZW4gYSB3YWxsZXQgb24gdGhlIG1vbmVyby13YWxsZXQtcnBjIHNlcnZlci48cD5cbiAgICogXG4gICAqIDxwPkV4YW1wbGU6PHA+XG4gICAqIFxuICAgKiA8Y29kZT5cbiAgICogJnNvbDsmc29sOyBjb25zdHJ1Y3QgY2xpZW50IHRvIG1vbmVyby13YWxsZXQtcnBjPGJyPlxuICAgKiBsZXQgd2FsbGV0UnBjID0gbmV3IE1vbmVyb1dhbGxldFJwYyhcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODRcIiwgXCJycGNfdXNlclwiLCBcImFiYzEyM1wiKTs8YnI+PGJyPlxuICAgKiBcbiAgICogJnNvbDsmc29sOyBjcmVhdGUgYW5kIG9wZW4gd2FsbGV0IG9uIG1vbmVyby13YWxsZXQtcnBjPGJyPlxuICAgKiBhd2FpdCB3YWxsZXRScGMuY3JlYXRlV2FsbGV0KHs8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXRoOiBcIm15d2FsbGV0XCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiYWJjMTIzXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VlZDogXCJjb2V4aXN0IGlnbG9vIHBhbXBobGV0IGxhZ29vbi4uLlwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlc3RvcmVIZWlnaHQ6IDE1NDMyMThsPGJyPlxuICAgKiB9KTtcbiAgICogIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+fSBjb25maWcgLSBNb25lcm9XYWxsZXRDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF0aF0gLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhc3N3b3JkXSAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRdIC0gc2VlZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIHJhbmRvbSB3YWxsZXQgY3JlYXRlZCBpZiBuZWl0aGVyIHNlZWQgbm9yIGtleXMgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRPZmZzZXRdIC0gdGhlIG9mZnNldCB1c2VkIHRvIGRlcml2ZSBhIG5ldyBzZWVkIGZyb20gdGhlIGdpdmVuIHNlZWQgdG8gcmVjb3ZlciBhIHNlY3JldCB3YWxsZXQgZnJvbSB0aGUgc2VlZFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuaXNNdWx0aXNpZ10gLSByZXN0b3JlIG11bHRpc2lnIHdhbGxldCBmcm9tIHNlZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpbWFyeUFkZHJlc3NdIC0gcHJpbWFyeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmx5IHByb3ZpZGUgaWYgcmVzdG9yaW5nIGZyb20ga2V5cylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVZpZXdLZXldIC0gcHJpdmF0ZSB2aWV3IGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVTcGVuZEtleV0gLSBwcml2YXRlIHNwZW5kIGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnJlc3RvcmVIZWlnaHRdIC0gYmxvY2sgaGVpZ2h0IHRvIHN0YXJ0IHNjYW5uaW5nIGZyb20gKGRlZmF1bHRzIHRvIDAgdW5sZXNzIGdlbmVyYXRpbmcgcmFuZG9tIHdhbGxldClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcubGFuZ3VhZ2VdIC0gbGFuZ3VhZ2Ugb2YgdGhlIHdhbGxldCdzIG1uZW1vbmljIHBocmFzZSBvciBzZWVkIChkZWZhdWx0cyB0byBcIkVuZ2xpc2hcIiBvciBhdXRvLWRldGVjdGVkKVxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb259IFtjb25maWcuc2VydmVyXSAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gdG8gYSBtb25lcm8gZGFlbW9uIChvcHRpb25hbCk8YnI+XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclVyaV0gLSB1cmkgb2YgYSBkYWVtb24gdG8gdXNlIChvcHRpb25hbCwgbW9uZXJvLXdhbGxldC1ycGMgdXN1YWxseSBzdGFydGVkIHdpdGggZGFlbW9uIGNvbmZpZylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyVXNlcm5hbWVdIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIGRhZW1vbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclBhc3N3b3JkXSAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBkYWVtb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSBbY29uZmlnLmNvbm5lY3Rpb25NYW5hZ2VyXSAtIG1hbmFnZSBjb25uZWN0aW9ucyB0byBtb25lcm9kIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlamVjdFVuYXV0aG9yaXplZF0gLSByZWplY3Qgc2VsZi1zaWduZWQgc2VydmVyIGNlcnRpZmljYXRlcyBpZiB0cnVlIChkZWZhdWx0cyB0byB0cnVlKVxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb259IFtjb25maWcuc2VydmVyXSAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb3IgZXF1aXZhbGVudCBKUyBvYmplY3QgcHJvdmlkaW5nIGRhZW1vbiBjb25maWd1cmF0aW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnNhdmVDdXJyZW50XSAtIHNwZWNpZmllcyBpZiB0aGUgY3VycmVudCBSUEMgd2FsbGV0IHNob3VsZCBiZSBzYXZlZCBiZWZvcmUgYmVpbmcgY2xvc2VkIChkZWZhdWx0IHRydWUpXG4gICAqIEByZXR1cm4ge01vbmVyb1dhbGxldFJwY30gdGhpcyB3YWxsZXQgY2xpZW50XG4gICAqL1xuICBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgY29uZmlnIHRvIGNyZWF0ZSB3YWxsZXRcIik7XG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCAmJiAoY29uZmlnTm9ybWFsaXplZC5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBpbml0aWFsaXplZCB3aXRoIGEgc2VlZCBvciBrZXlzIGJ1dCBub3QgYm90aFwiKTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0TmV0d29ya1R5cGUoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBuZXR3b3JrVHlwZSB3aGVuIGNyZWF0aW5nIFJQQyB3YWxsZXQgYmVjYXVzZSBzZXJ2ZXIncyBuZXR3b3JrIHR5cGUgaXMgYWxyZWFkeSBzZXRcIik7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudExvb2thaGVhZCgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzTG9va2FoZWFkKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3Qgc3VwcG9ydCBjcmVhdGluZyB3YWxsZXRzIHdpdGggc3ViYWRkcmVzcyBsb29rYWhlYWQgb3ZlciBycGNcIik7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UGFzc3dvcmQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWdOb3JtYWxpemVkLnNldFBhc3N3b3JkKFwiXCIpO1xuXG4gICAgLy8gc2V0IHNlcnZlciBmcm9tIGNvbm5lY3Rpb24gbWFuYWdlciBpZiBwcm92aWRlZFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpIHtcbiAgICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlcnZlcigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIGNyZWF0ZWQgd2l0aCBhIHNlcnZlciBvciBjb25uZWN0aW9uIG1hbmFnZXIgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgY29uZmlnTm9ybWFsaXplZC5zZXRTZXJ2ZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkuZ2V0Q29ubmVjdGlvbigpKTtcbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQpIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnTm9ybWFsaXplZCk7XG4gICAgZWxzZSBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkKSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZ05vcm1hbGl6ZWQpO1xuICAgIGVsc2UgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRSYW5kb20oY29uZmlnTm9ybWFsaXplZCk7XG5cbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyIG9yIHNlcnZlclxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnTm9ybWFsaXplZC5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICB9IGVsc2UgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2V0RGFlbW9uQ29ubmVjdGlvbihjb25maWdOb3JtYWxpemVkLmdldFNlcnZlcigpKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRSYW5kb20oY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpIHtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSByZXN0b3JlSGVpZ2h0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNhdmVDdXJyZW50KCkgPT09IGZhbHNlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDdXJyZW50IHdhbGxldCBpcyBzYXZlZCBhdXRvbWF0aWNhbGx5IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICBpZiAoIWNvbmZpZy5nZXRQYXRoKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5hbWUgaXMgbm90IGluaXRpYWxpemVkXCIpO1xuICAgIGlmICghY29uZmlnLmdldExhbmd1YWdlKCkpIGNvbmZpZy5zZXRMYW5ndWFnZShNb25lcm9XYWxsZXQuREVGQVVMVF9MQU5HVUFHRSk7XG4gICAgbGV0IHBhcmFtcyA9IHsgZmlsZW5hbWU6IGNvbmZpZy5nZXRQYXRoKCksIHBhc3N3b3JkOiBjb25maWcuZ2V0UGFzc3dvcmQoKSwgbGFuZ3VhZ2U6IGNvbmZpZy5nZXRMYW5ndWFnZSgpIH07XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNyZWF0ZV93YWxsZXRcIiwgcGFyYW1zKTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhpcy5oYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihjb25maWcuZ2V0UGF0aCgpLCBlcnIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc3RvcmVfZGV0ZXJtaW5pc3RpY193YWxsZXRcIiwge1xuICAgICAgICBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSxcbiAgICAgICAgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLFxuICAgICAgICBzZWVkOiBjb25maWcuZ2V0U2VlZCgpLFxuICAgICAgICBzZWVkX29mZnNldDogY29uZmlnLmdldFNlZWRPZmZzZXQoKSxcbiAgICAgICAgZW5hYmxlX211bHRpc2lnX2V4cGVyaW1lbnRhbDogY29uZmlnLmdldElzTXVsdGlzaWcoKSxcbiAgICAgICAgcmVzdG9yZV9oZWlnaHQ6IGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCksXG4gICAgICAgIGxhbmd1YWdlOiBjb25maWcuZ2V0TGFuZ3VhZ2UoKSxcbiAgICAgICAgYXV0b3NhdmVfY3VycmVudDogY29uZmlnLmdldFNhdmVDdXJyZW50KClcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aGlzLmhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKGNvbmZpZy5nZXRQYXRoKCksIGVycik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbUtleXMoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpIHtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgd2FsbGV0IGZyb20ga2V5c1wiKTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UmVzdG9yZUhlaWdodCgwKTtcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldExhbmd1YWdlKE1vbmVyb1dhbGxldC5ERUZBVUxUX0xBTkdVQUdFKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2VuZXJhdGVfZnJvbV9rZXlzXCIsIHtcbiAgICAgICAgZmlsZW5hbWU6IGNvbmZpZy5nZXRQYXRoKCksXG4gICAgICAgIHBhc3N3b3JkOiBjb25maWcuZ2V0UGFzc3dvcmQoKSxcbiAgICAgICAgYWRkcmVzczogY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCksXG4gICAgICAgIHZpZXdrZXk6IGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpLFxuICAgICAgICBzcGVuZGtleTogY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpLFxuICAgICAgICByZXN0b3JlX2hlaWdodDogY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSxcbiAgICAgICAgYXV0b3NhdmVfY3VycmVudDogY29uZmlnLmdldFNhdmVDdXJyZW50KClcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aGlzLmhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKGNvbmZpZy5nZXRQYXRoKCksIGVycik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IobmFtZSwgZXJyKSB7XG4gICAgaWYgKGVyci5tZXNzYWdlID09PSBcIkNhbm5vdCBjcmVhdGUgd2FsbGV0LiBBbHJlYWR5IGV4aXN0cy5cIikgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKFwiV2FsbGV0IGFscmVhZHkgZXhpc3RzOiBcIiArIG5hbWUsIGVyci5nZXRDb2RlKCksIGVyci5nZXRScGNNZXRob2QoKSwgZXJyLmdldFJwY1BhcmFtcygpKTtcbiAgICBpZiAoZXJyLm1lc3NhZ2UgPT09IFwiRWxlY3RydW0tc3R5bGUgd29yZCBsaXN0IGZhaWxlZCB2ZXJpZmljYXRpb25cIikgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKFwiSW52YWxpZCBtbmVtb25pY1wiLCBlcnIuZ2V0Q29kZSgpLCBlcnIuZ2V0UnBjTWV0aG9kKCksIGVyci5nZXRScGNQYXJhbXMoKSk7XG4gICAgdGhyb3cgZXJyO1xuICB9XG4gIFxuICBhc3luYyBpc1ZpZXdPbmx5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwge2tleV90eXBlOiBcIm1uZW1vbmljXCJ9KTtcbiAgICAgIHJldHVybiBmYWxzZTsgLy8ga2V5IHJldHJpZXZhbCBzdWNjZWVkcyBpZiBub3QgdmlldyBvbmx5XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0yOSkgcmV0dXJuIHRydWU7ICAvLyB3YWxsZXQgaXMgdmlldyBvbmx5XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0xKSByZXR1cm4gZmFsc2U7ICAvLyB3YWxsZXQgaXMgb2ZmbGluZSBidXQgbm90IHZpZXcgb25seVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvUnBjQ29ubmVjdGlvbn0gW3VyaU9yQ29ubmVjdGlvbl0gLSB0aGUgZGFlbW9uJ3MgVVJJIG9yIGNvbm5lY3Rpb24gKGRlZmF1bHRzIHRvIG9mZmxpbmUpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNUcnVzdGVkIC0gaW5kaWNhdGVzIGlmIHRoZSBkYWVtb24gaW4gdHJ1c3RlZFxuICAgKiBAcGFyYW0ge1NzbE9wdGlvbnN9IHNzbE9wdGlvbnMgLSBjdXN0b20gU1NMIGNvbmZpZ3VyYXRpb25cbiAgICovXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uPzogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHN0cmluZywgaXNUcnVzdGVkPzogYm9vbGVhbiwgc3NsT3B0aW9ucz86IFNzbE9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgY29ubmVjdGlvbiA9ICF1cmlPckNvbm5lY3Rpb24gPyB1bmRlZmluZWQgOiB1cmlPckNvbm5lY3Rpb24gaW5zdGFuY2VvZiBNb25lcm9ScGNDb25uZWN0aW9uID8gdXJpT3JDb25uZWN0aW9uIDogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uKTtcbiAgICBpZiAoIXNzbE9wdGlvbnMpIHNzbE9wdGlvbnMgPSBuZXcgU3NsT3B0aW9ucygpO1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hZGRyZXNzID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0VXJpKCkgOiBcImJhZF91cmlcIjsgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogYmFkIGRhZW1vbiB1cmkgbmVjZXNzYXJ5IGZvciBvZmZsaW5lP1xuICAgIHBhcmFtcy51c2VybmFtZSA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFVzZXJuYW1lKCkgOiBcIlwiO1xuICAgIHBhcmFtcy5wYXNzd29yZCA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIHBhcmFtcy50cnVzdGVkID0gaXNUcnVzdGVkO1xuICAgIHBhcmFtcy5zc2xfc3VwcG9ydCA9IFwiYXV0b2RldGVjdFwiO1xuICAgIHBhcmFtcy5zc2xfcHJpdmF0ZV9rZXlfcGF0aCA9IHNzbE9wdGlvbnMuZ2V0UHJpdmF0ZUtleVBhdGgoKTtcbiAgICBwYXJhbXMuc3NsX2NlcnRpZmljYXRlX3BhdGggID0gc3NsT3B0aW9ucy5nZXRDZXJ0aWZpY2F0ZVBhdGgoKTtcbiAgICBwYXJhbXMuc3NsX2NhX2ZpbGUgPSBzc2xPcHRpb25zLmdldENlcnRpZmljYXRlQXV0aG9yaXR5RmlsZSgpO1xuICAgIHBhcmFtcy5zc2xfYWxsb3dlZF9maW5nZXJwcmludHMgPSBzc2xPcHRpb25zLmdldEFsbG93ZWRGaW5nZXJwcmludHMoKTtcbiAgICBwYXJhbXMuc3NsX2FsbG93X2FueV9jZXJ0ID0gc3NsT3B0aW9ucy5nZXRBbGxvd0FueUNlcnQoKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfZGFlbW9uXCIsIHBhcmFtcyk7XG4gICAgdGhpcy5kYWVtb25Db25uZWN0aW9uID0gY29ubmVjdGlvbjtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uQ29ubmVjdGlvbigpOiBQcm9taXNlPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHtcbiAgICByZXR1cm4gdGhpcy5kYWVtb25Db25uZWN0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdG90YWwgYW5kIHVubG9ja2VkIGJhbGFuY2VzIGluIGEgc2luZ2xlIHJlcXVlc3QuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2FjY291bnRJZHhdIGFjY291bnQgaW5kZXhcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdWJhZGRyZXNzSWR4XSBzdWJhZGRyZXNzIGluZGV4XG4gICAqIEByZXR1cm4ge1Byb21pc2U8YmlnaW50W10+fSBpcyB0aGUgdG90YWwgYW5kIHVubG9ja2VkIGJhbGFuY2VzIGluIGFuIGFycmF5LCByZXNwZWN0aXZlbHlcbiAgICovXG4gIGFzeW5jIGdldEJhbGFuY2VzKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludFtdPiB7XG4gICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0LmVxdWFsKHN1YmFkZHJlc3NJZHgsIHVuZGVmaW5lZCwgXCJNdXN0IHByb3ZpZGUgYWNjb3VudCBpbmRleCB3aXRoIHN1YmFkZHJlc3MgaW5kZXhcIik7XG4gICAgICBsZXQgYmFsYW5jZSA9IEJpZ0ludCgwKTtcbiAgICAgIGxldCB1bmxvY2tlZEJhbGFuY2UgPSBCaWdJbnQoMCk7XG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgICBiYWxhbmNlID0gYmFsYW5jZSArIGFjY291bnQuZ2V0QmFsYW5jZSgpO1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2UgPSB1bmxvY2tlZEJhbGFuY2UgKyBhY2NvdW50LmdldFVubG9ja2VkQmFsYW5jZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFtiYWxhbmNlLCB1bmxvY2tlZEJhbGFuY2VdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcGFyYW1zID0ge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHgsIGFkZHJlc3NfaW5kaWNlczogc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogW3N1YmFkZHJlc3NJZHhdfTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwgcGFyYW1zKTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQpIHJldHVybiBbQmlnSW50KHJlc3AucmVzdWx0LmJhbGFuY2UpLCBCaWdJbnQocmVzcC5yZXN1bHQudW5sb2NrZWRfYmFsYW5jZSldO1xuICAgICAgZWxzZSByZXR1cm4gW0JpZ0ludChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzc1swXS5iYWxhbmNlKSwgQmlnSW50KHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzWzBdLnVubG9ja2VkX2JhbGFuY2UpXTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIENPTU1PTiBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvV2FsbGV0TGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3VwZXIucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZFRvRGFlbW9uKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNoZWNrUmVzZXJ2ZVByb29mKGF3YWl0IHRoaXMuZ2V0UHJpbWFyeUFkZHJlc3MoKSwgXCJcIiwgXCJcIik7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogcHJvdmlkZSBiZXR0ZXIgd2F5IHRvIGtub3cgaWYgd2FsbGV0IHJwYyBpcyBjb25uZWN0ZWQgdG8gZGFlbW9uXG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJjaGVjayByZXNlcnZlIGV4cGVjdGVkIHRvIGZhaWxcIik7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICByZXR1cm4gZS5tZXNzYWdlLmluZGV4T2YoXCJGYWlsZWQgdG8gY29ubmVjdCB0byBkYWVtb25cIikgPCAwO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF92ZXJzaW9uXCIpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVmVyc2lvbihyZXNwLnJlc3VsdC52ZXJzaW9uLCByZXNwLnJlc3VsdC5yZWxlYXNlKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF0aCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLnBhdGg7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNlZWQoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcIm1uZW1vbmljXCIgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmtleTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZExhbmd1YWdlKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKGF3YWl0IHRoaXMuZ2V0U2VlZCgpID09PSB1bmRlZmluZWQpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0UnBjLmdldFNlZWRMYW5ndWFnZSgpIG5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgbGlzdCBvZiBhdmFpbGFibGUgbGFuZ3VhZ2VzIGZvciB0aGUgd2FsbGV0J3Mgc2VlZC5cbiAgICogXG4gICAqIEByZXR1cm4ge3N0cmluZ1tdfSB0aGUgYXZhaWxhYmxlIGxhbmd1YWdlcyBmb3IgdGhlIHdhbGxldCdzIHNlZWQuXG4gICAqL1xuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2VzKCkge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2xhbmd1YWdlc1wiKSkucmVzdWx0Lmxhbmd1YWdlcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHJpdmF0ZVZpZXdLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcInZpZXdfa2V5XCIgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmtleTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHJpdmF0ZVNwZW5kS2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwgeyBrZXlfdHlwZTogXCJzcGVuZF9rZXlcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgc3ViYWRkcmVzc01hcCA9IHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdO1xuICAgIGlmICghc3ViYWRkcmVzc01hcCkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCB0cnVlKTsgIC8vIGNhY2hlJ3MgYWxsIGFkZHJlc3NlcyBhdCB0aGlzIGFjY291bnRcbiAgICAgIHJldHVybiB0aGlzLmdldEFkZHJlc3MoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7ICAgICAgICAvLyByZWN1cnNpdmUgY2FsbCB1c2VzIGNhY2hlXG4gICAgfVxuICAgIGxldCBhZGRyZXNzID0gc3ViYWRkcmVzc01hcFtzdWJhZGRyZXNzSWR4XTtcbiAgICBpZiAoIWFkZHJlc3MpIHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHVuZGVmaW5lZCwgdHJ1ZSk7ICAvLyBjYWNoZSdzIGFsbCBhZGRyZXNzZXMgYXQgdGhpcyBhY2NvdW50XG4gICAgICByZXR1cm4gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF1bc3ViYWRkcmVzc0lkeF07XG4gICAgfVxuICAgIHJldHVybiBhZGRyZXNzO1xuICB9XG4gIFxuICAvLyBUT0RPOiB1c2UgY2FjaGVcbiAgYXN5bmMgZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIFxuICAgIC8vIGZldGNoIHJlc3VsdCBhbmQgbm9ybWFsaXplIGVycm9yIGlmIGFkZHJlc3MgZG9lcyBub3QgYmVsb25nIHRvIHRoZSB3YWxsZXRcbiAgICBsZXQgcmVzcDtcbiAgICB0cnkge1xuICAgICAgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzX2luZGV4XCIsIHthZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0yKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZS5tZXNzYWdlKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICAgIFxuICAgIC8vIGNvbnZlcnQgcnBjIHJlc3BvbnNlXG4gICAgbGV0IHN1YmFkZHJlc3MgPSBuZXcgTW9uZXJvU3ViYWRkcmVzcyh7YWRkcmVzczogYWRkcmVzc30pO1xuICAgIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KHJlc3AucmVzdWx0LmluZGV4Lm1ham9yKTtcbiAgICBzdWJhZGRyZXNzLnNldEluZGV4KHJlc3AucmVzdWx0LmluZGV4Lm1pbm9yKTtcbiAgICByZXR1cm4gc3ViYWRkcmVzcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzPzogc3RyaW5nLCBwYXltZW50SWQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBpbnRlZ3JhdGVkQWRkcmVzc1N0ciA9IChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJtYWtlX2ludGVncmF0ZWRfYWRkcmVzc1wiLCB7c3RhbmRhcmRfYWRkcmVzczogc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50X2lkOiBwYXltZW50SWR9KSkucmVzdWx0LmludGVncmF0ZWRfYWRkcmVzcztcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzU3RyKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLm1lc3NhZ2UuaW5jbHVkZXMoXCJJbnZhbGlkIHBheW1lbnQgSURcIikpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgcGF5bWVudCBJRDogXCIgKyBwYXltZW50SWQpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzcGxpdF9pbnRlZ3JhdGVkX2FkZHJlc3NcIiwge2ludGVncmF0ZWRfYWRkcmVzczogaW50ZWdyYXRlZEFkZHJlc3N9KTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKCkuc2V0U3RhbmRhcmRBZGRyZXNzKHJlc3AucmVzdWx0LnN0YW5kYXJkX2FkZHJlc3MpLnNldFBheW1lbnRJZChyZXNwLnJlc3VsdC5wYXltZW50X2lkKS5zZXRJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzcyk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2hlaWdodFwiKSkucmVzdWx0LmhlaWdodDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uSGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3Qgc3VwcG9ydCBnZXR0aW5nIHRoZSBjaGFpbiBoZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodEJ5RGF0ZSh5ZWFyOiBudW1iZXIsIG1vbnRoOiBudW1iZXIsIGRheTogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGdldHRpbmcgYSBoZWlnaHQgYnkgZGF0ZVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc3luYyhsaXN0ZW5lck9yU3RhcnRIZWlnaHQ/OiBNb25lcm9XYWxsZXRMaXN0ZW5lciB8IG51bWJlciwgc3RhcnRIZWlnaHQ/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb1N5bmNSZXN1bHQ+IHtcbiAgICBhc3NlcnQoIShsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciksIFwiTW9uZXJvIFdhbGxldCBSUEMgZG9lcyBub3Qgc3VwcG9ydCByZXBvcnRpbmcgc3luYyBwcm9ncmVzc1wiKTtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZWZyZXNoXCIsIHtzdGFydF9oZWlnaHQ6IHN0YXJ0SGVpZ2h0fSk7XG4gICAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvU3luY1Jlc3VsdChyZXNwLnJlc3VsdC5ibG9ja3NfZmV0Y2hlZCwgcmVzcC5yZXN1bHQucmVjZWl2ZWRfbW9uZXkpO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UgPT09IFwibm8gY29ubmVjdGlvbiB0byBkYWVtb25cIikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIG5vdCBjb25uZWN0ZWQgdG8gZGFlbW9uXCIpO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgXG4gICAgLy8gY29udmVydCBtcyB0byBzZWNvbmRzIGZvciBycGMgcGFyYW1ldGVyXG4gICAgbGV0IHN5bmNQZXJpb2RJblNlY29uZHMgPSBNYXRoLnJvdW5kKChzeW5jUGVyaW9kSW5NcyA9PT0gdW5kZWZpbmVkID8gTW9uZXJvV2FsbGV0UnBjLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgOiBzeW5jUGVyaW9kSW5NcykgLyAxMDAwKTtcbiAgICBcbiAgICAvLyBzZW5kIHJwYyByZXF1ZXN0XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiYXV0b19yZWZyZXNoXCIsIHtcbiAgICAgIGVuYWJsZTogdHJ1ZSxcbiAgICAgIHBlcmlvZDogc3luY1BlcmlvZEluU2Vjb25kc1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHVwZGF0ZSBzeW5jIHBlcmlvZCBmb3IgcG9sbGVyXG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IHN5bmNQZXJpb2RJblNlY29uZHMgKiAxMDAwO1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkKSB0aGlzLndhbGxldFBvbGxlci5zZXRQZXJpb2RJbk1zKHRoaXMuc3luY1BlcmlvZEluTXMpO1xuICAgIFxuICAgIC8vIHBvbGwgaWYgbGlzdGVuaW5nXG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gIH1cblxuICBnZXRTeW5jUGVyaW9kSW5NcygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnN5bmNQZXJpb2RJbk1zO1xuICB9XG4gIFxuICBhc3luYyBzdG9wU3luY2luZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiYXV0b19yZWZyZXNoXCIsIHsgZW5hYmxlOiBmYWxzZSB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXR4SGFzaGVzIHx8ICF0eEhhc2hlcy5sZW5ndGgpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vIHR4IGhhc2hlcyBnaXZlbiB0byBzY2FuXCIpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNjYW5fdHhcIiwge3R4aWRzOiB0eEhhc2hlc30pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5TcGVudCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXNjYW5fc3BlbnRcIiwgdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXNjYW5fYmxvY2tjaGFpblwiLCB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYWxhbmNlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSlbMF07XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0QmFsYW5jZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkpWzFdO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbiwgdGFnPzogc3RyaW5nLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50W10+IHtcbiAgICBcbiAgICAvLyBmZXRjaCBhY2NvdW50cyBmcm9tIHJwY1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FjY291bnRzXCIsIHt0YWc6IHRhZ30pO1xuICAgIFxuICAgIC8vIGJ1aWxkIGFjY291bnQgb2JqZWN0cyBhbmQgZmV0Y2ggc3ViYWRkcmVzc2VzIHBlciBhY2NvdW50IHVzaW5nIGdldF9hZGRyZXNzXG4gICAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogZ2V0X2FkZHJlc3Mgc2hvdWxkIHN1cHBvcnQgYWxsX2FjY291bnRzIHNvIG5vdCBjYWxsZWQgb25jZSBwZXIgYWNjb3VudFxuICAgIGxldCBhY2NvdW50czogTW9uZXJvQWNjb3VudFtdID0gW107XG4gICAgZm9yIChsZXQgcnBjQWNjb3VudCBvZiByZXNwLnJlc3VsdC5zdWJhZGRyZXNzX2FjY291bnRzKSB7XG4gICAgICBsZXQgYWNjb3VudCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjQWNjb3VudChycGNBY2NvdW50KTtcbiAgICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzKSBhY2NvdW50LnNldFN1YmFkZHJlc3Nlcyhhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50LmdldEluZGV4KCksIHVuZGVmaW5lZCwgdHJ1ZSkpO1xuICAgICAgYWNjb3VudHMucHVzaChhY2NvdW50KTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIG1lcmdlIGZpZWxkcyBmcm9tIGdldF9iYWxhbmNlIGFjcm9zcyBhbGwgYWNjb3VudHNcbiAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcyAmJiAhc2tpcEJhbGFuY2VzKSB7XG4gICAgICBcbiAgICAgIC8vIHRoZXNlIGZpZWxkcyBhcmUgbm90IGluaXRpYWxpemVkIGlmIHN1YmFkZHJlc3MgaXMgdW51c2VkIGFuZCB0aGVyZWZvcmUgbm90IHJldHVybmVkIGZyb20gYGdldF9iYWxhbmNlYFxuICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiBhY2NvdW50cykge1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jaygwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBmZXRjaCBhbmQgbWVyZ2UgaW5mbyBmcm9tIGdldF9iYWxhbmNlXG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwge2FsbF9hY2NvdW50czogdHJ1ZX0pO1xuICAgICAgaWYgKHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgIGZvciAobGV0IHJwY1N1YmFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzcyA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBtZXJnZSBpbmZvXG4gICAgICAgICAgbGV0IGFjY291bnQgPSBhY2NvdW50c1tzdWJhZGRyZXNzLmdldEFjY291bnRJbmRleCgpXTtcbiAgICAgICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzcy5nZXRBY2NvdW50SW5kZXgoKSwgYWNjb3VudC5nZXRJbmRleCgpLCBcIlJQQyBhY2NvdW50cyBhcmUgb3V0IG9mIG9yZGVyXCIpOyAgLy8gd291bGQgbmVlZCB0byBzd2l0Y2ggbG9va3VwIHRvIGxvb3BcbiAgICAgICAgICBsZXQgdGd0U3ViYWRkcmVzcyA9IGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKClbc3ViYWRkcmVzcy5nZXRJbmRleCgpXTtcbiAgICAgICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzcy5nZXRJbmRleCgpLCB0Z3RTdWJhZGRyZXNzLmdldEluZGV4KCksIFwiUlBDIHN1YmFkZHJlc3NlcyBhcmUgb3V0IG9mIG9yZGVyXCIpO1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkpO1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkpO1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cyhzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBhY2NvdW50cztcbiAgfVxuICBcbiAgLy8gVE9ETzogZ2V0QWNjb3VudEJ5SW5kZXgoKSwgZ2V0QWNjb3VudEJ5VGFnKClcbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgYXNzZXJ0KGFjY291bnRJZHggPj0gMCk7XG4gICAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCB0aGlzLmdldEFjY291bnRzKCkpIHtcbiAgICAgIGlmIChhY2NvdW50LmdldEluZGV4KCkgPT09IGFjY291bnRJZHgpIHtcbiAgICAgICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMpIGFjY291bnQuc2V0U3ViYWRkcmVzc2VzKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHVuZGVmaW5lZCwgc2tpcEJhbGFuY2VzKSk7XG4gICAgICAgIHJldHVybiBhY2NvdW50O1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBY2NvdW50IHdpdGggaW5kZXggXCIgKyBhY2NvdW50SWR4ICsgXCIgZG9lcyBub3QgZXhpc3RcIik7XG4gIH1cblxuICBhc3luYyBjcmVhdGVBY2NvdW50KGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgbGFiZWwgPSBsYWJlbCA/IGxhYmVsIDogdW5kZWZpbmVkO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX2FjY291bnRcIiwge2xhYmVsOiBsYWJlbH0pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvQWNjb3VudCh7XG4gICAgICBpbmRleDogcmVzcC5yZXN1bHQuYWNjb3VudF9pbmRleCxcbiAgICAgIHByaW1hcnlBZGRyZXNzOiByZXNwLnJlc3VsdC5hZGRyZXNzLFxuICAgICAgbGFiZWw6IGxhYmVsLFxuICAgICAgYmFsYW5jZTogQmlnSW50KDApLFxuICAgICAgdW5sb2NrZWRCYWxhbmNlOiBCaWdJbnQoMClcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJbmRpY2VzPzogbnVtYmVyW10sIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3NbXT4ge1xuICAgIFxuICAgIC8vIGZldGNoIHN1YmFkZHJlc3Nlc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gYWNjb3VudElkeDtcbiAgICBpZiAoc3ViYWRkcmVzc0luZGljZXMpIHBhcmFtcy5hZGRyZXNzX2luZGV4ID0gR2VuVXRpbHMubGlzdGlmeShzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc1wiLCBwYXJhbXMpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgc3ViYWRkcmVzc2VzXG4gICAgbGV0IHN1YmFkZHJlc3NlcyA9IFtdO1xuICAgIGZvciAobGV0IHJwY1N1YmFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQuYWRkcmVzc2VzKSB7XG4gICAgICBsZXQgc3ViYWRkcmVzcyA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKTtcbiAgICAgIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgc3ViYWRkcmVzc2VzLnB1c2goc3ViYWRkcmVzcyk7XG4gICAgfVxuICAgIFxuICAgIC8vIGZldGNoIGFuZCBpbml0aWFsaXplIHN1YmFkZHJlc3MgYmFsYW5jZXNcbiAgICBpZiAoIXNraXBCYWxhbmNlcykge1xuICAgICAgXG4gICAgICAvLyB0aGVzZSBmaWVsZHMgYXJlIG5vdCBpbml0aWFsaXplZCBpZiBzdWJhZGRyZXNzIGlzIHVudXNlZCBhbmQgdGhlcmVmb3JlIG5vdCByZXR1cm5lZCBmcm9tIGBnZXRfYmFsYW5jZWBcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKDApO1xuICAgICAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgICAgfVxuXG4gICAgICAvLyBmZXRjaCBhbmQgaW5pdGlhbGl6ZSBiYWxhbmNlc1xuICAgICAgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIsIHBhcmFtcyk7XG4gICAgICBpZiAocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIHRyYW5zZmVyIGluZm8gdG8gZXhpc3Rpbmcgc3ViYWRkcmVzcyBvYmplY3RcbiAgICAgICAgICBmb3IgKGxldCB0Z3RTdWJhZGRyZXNzIG9mIHN1YmFkZHJlc3Nlcykge1xuICAgICAgICAgICAgaWYgKHRndFN1YmFkZHJlc3MuZ2V0SW5kZXgoKSAhPT0gc3ViYWRkcmVzcy5nZXRJbmRleCgpKSBjb250aW51ZTsgLy8gc2tpcCB0byBzdWJhZGRyZXNzIHdpdGggc2FtZSBpbmRleFxuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0QmFsYW5jZShzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cyhzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKHN1YmFkZHJlc3MuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIGFkZHJlc3Nlc1xuICAgIGxldCBzdWJhZGRyZXNzTWFwID0gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF07XG4gICAgaWYgKCFzdWJhZGRyZXNzTWFwKSB7XG4gICAgICBzdWJhZGRyZXNzTWFwID0ge307XG4gICAgICB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XSA9IHN1YmFkZHJlc3NNYXA7XG4gICAgfVxuICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICBzdWJhZGRyZXNzTWFwW3N1YmFkZHJlc3MuZ2V0SW5kZXgoKV0gPSBzdWJhZGRyZXNzLmdldEFkZHJlc3MoKTtcbiAgICB9XG4gICAgXG4gICAgLy8gcmV0dXJuIHJlc3VsdHNcbiAgICByZXR1cm4gc3ViYWRkcmVzc2VzO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlciwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIGFzc2VydChhY2NvdW50SWR4ID49IDApO1xuICAgIGFzc2VydChzdWJhZGRyZXNzSWR4ID49IDApO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgW3N1YmFkZHJlc3NJZHhdLCBza2lwQmFsYW5jZXMpKVswXTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX2FkZHJlc3NcIiwge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHgsIGxhYmVsOiBsYWJlbH0pO1xuICAgIFxuICAgIC8vIGJ1aWxkIHN1YmFkZHJlc3Mgb2JqZWN0XG4gICAgbGV0IHN1YmFkZHJlc3MgPSBuZXcgTW9uZXJvU3ViYWRkcmVzcygpO1xuICAgIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgIHN1YmFkZHJlc3Muc2V0SW5kZXgocmVzcC5yZXN1bHQuYWRkcmVzc19pbmRleCk7XG4gICAgc3ViYWRkcmVzcy5zZXRBZGRyZXNzKHJlc3AucmVzdWx0LmFkZHJlc3MpO1xuICAgIHN1YmFkZHJlc3Muc2V0TGFiZWwobGFiZWwgPyBsYWJlbCA6IHVuZGVmaW5lZCk7XG4gICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgc3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKDApO1xuICAgIHN1YmFkZHJlc3Muc2V0SXNVc2VkKGZhbHNlKTtcbiAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgIHJldHVybiBzdWJhZGRyZXNzO1xuICB9XG5cbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibGFiZWxfYWRkcmVzc1wiLCB7aW5kZXg6IHttYWpvcjogYWNjb3VudElkeCwgbWlub3I6IHN1YmFkZHJlc3NJZHh9LCBsYWJlbDogbGFiZWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5Pzogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gY29weSBxdWVyeVxuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyB0ZW1wb3JhcmlseSBkaXNhYmxlIHRyYW5zZmVyIGFuZCBvdXRwdXQgcXVlcmllcyBpbiBvcmRlciB0byBjb2xsZWN0IGFsbCB0eCBpbmZvcm1hdGlvblxuICAgIGxldCB0cmFuc2ZlclF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldFRyYW5zZmVyUXVlcnkoKTtcbiAgICBsZXQgaW5wdXRRdWVyeSA9IHF1ZXJ5Tm9ybWFsaXplZC5nZXRJbnB1dFF1ZXJ5KCk7XG4gICAgbGV0IG91dHB1dFF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldE91dHB1dFF1ZXJ5KCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldFRyYW5zZmVyUXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SW5wdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRPdXRwdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIGZldGNoIGFsbCB0cmFuc2ZlcnMgdGhhdCBtZWV0IHR4IHF1ZXJ5XG4gICAgbGV0IHRyYW5zZmVycyA9IGF3YWl0IHRoaXMuZ2V0VHJhbnNmZXJzQXV4KG5ldyBNb25lcm9UcmFuc2ZlclF1ZXJ5KCkuc2V0VHhRdWVyeShNb25lcm9XYWxsZXRScGMuZGVjb250ZXh0dWFsaXplKHF1ZXJ5Tm9ybWFsaXplZC5jb3B5KCkpKSk7XG4gICAgXG4gICAgLy8gY29sbGVjdCB1bmlxdWUgdHhzIGZyb20gdHJhbnNmZXJzIHdoaWxlIHJldGFpbmluZyBvcmRlclxuICAgIGxldCB0eHMgPSBbXTtcbiAgICBsZXQgdHhzU2V0ID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHRyYW5zZmVycykge1xuICAgICAgaWYgKCF0eHNTZXQuaGFzKHRyYW5zZmVyLmdldFR4KCkpKSB7XG4gICAgICAgIHR4cy5wdXNoKHRyYW5zZmVyLmdldFR4KCkpO1xuICAgICAgICB0eHNTZXQuYWRkKHRyYW5zZmVyLmdldFR4KCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB0eXBlcyBpbnRvIG1hcHMgZm9yIG1lcmdpbmcgYW5kIGxvb2t1cFxuICAgIGxldCB0eE1hcCA9IHt9O1xuICAgIGxldCBibG9ja01hcCA9IHt9O1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGZldGNoIGFuZCBtZXJnZSBvdXRwdXRzIGlmIHJlcXVlc3RlZFxuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SW5jbHVkZU91dHB1dHMoKSB8fCBvdXRwdXRRdWVyeSkge1xuICAgICAgICBcbiAgICAgIC8vIGZldGNoIG91dHB1dHNcbiAgICAgIGxldCBvdXRwdXRRdWVyeUF1eCA9IChvdXRwdXRRdWVyeSA/IG91dHB1dFF1ZXJ5LmNvcHkoKSA6IG5ldyBNb25lcm9PdXRwdXRRdWVyeSgpKS5zZXRUeFF1ZXJ5KE1vbmVyb1dhbGxldFJwYy5kZWNvbnRleHR1YWxpemUocXVlcnlOb3JtYWxpemVkLmNvcHkoKSkpO1xuICAgICAgbGV0IG91dHB1dHMgPSBhd2FpdCB0aGlzLmdldE91dHB1dHNBdXgob3V0cHV0UXVlcnlBdXgpO1xuICAgICAgXG4gICAgICAvLyBtZXJnZSBvdXRwdXQgdHhzIG9uZSB0aW1lIHdoaWxlIHJldGFpbmluZyBvcmRlclxuICAgICAgbGV0IG91dHB1dFR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIG91dHB1dHMpIHtcbiAgICAgICAgaWYgKCFvdXRwdXRUeHMuaW5jbHVkZXMob3V0cHV0LmdldFR4KCkpKSB7XG4gICAgICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgob3V0cHV0LmdldFR4KCksIHR4TWFwLCBibG9ja01hcCk7XG4gICAgICAgICAgb3V0cHV0VHhzLnB1c2gob3V0cHV0LmdldFR4KCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHJlc3RvcmUgdHJhbnNmZXIgYW5kIG91dHB1dCBxdWVyaWVzXG4gICAgcXVlcnlOb3JtYWxpemVkLnNldFRyYW5zZmVyUXVlcnkodHJhbnNmZXJRdWVyeSk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldElucHV0UXVlcnkoaW5wdXRRdWVyeSk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldE91dHB1dFF1ZXJ5KG91dHB1dFF1ZXJ5KTtcbiAgICBcbiAgICAvLyBmaWx0ZXIgdHhzIHRoYXQgZG9uJ3QgbWVldCB0cmFuc2ZlciBxdWVyeVxuICAgIGxldCB0eHNRdWVyaWVkID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBpZiAocXVlcnlOb3JtYWxpemVkLm1lZXRzQ3JpdGVyaWEodHgpKSB0eHNRdWVyaWVkLnB1c2godHgpO1xuICAgICAgZWxzZSBpZiAodHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB0eC5nZXRCbG9jaygpLmdldFR4cygpLnNwbGljZSh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpLCAxKTtcbiAgICB9XG4gICAgdHhzID0gdHhzUXVlcmllZDtcbiAgICBcbiAgICAvLyBzcGVjaWFsIGNhc2U6IHJlLWZldGNoIHR4cyBpZiBpbmNvbnNpc3RlbmN5IGNhdXNlZCBieSBuZWVkaW5nIHRvIG1ha2UgbXVsdGlwbGUgcnBjIGNhbGxzXG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSAmJiB0eC5nZXRCbG9jaygpID09PSB1bmRlZmluZWQgfHwgIXR4LmdldElzQ29uZmlybWVkKCkgJiYgdHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJJbmNvbnNpc3RlbmN5IGRldGVjdGVkIGJ1aWxkaW5nIHR4cyBmcm9tIG11bHRpcGxlIHJwYyBjYWxscywgcmUtZmV0Y2hpbmcgdHhzXCIpO1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRUeHMocXVlcnlOb3JtYWxpemVkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gb3JkZXIgdHhzIGlmIHR4IGhhc2hlcyBnaXZlbiB0aGVuIHJldHVyblxuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkgJiYgcXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpLmxlbmd0aCA+IDApIHtcbiAgICAgIGxldCB0eHNCeUlkID0gbmV3IE1hcCgpICAvLyBzdG9yZSB0eHMgaW4gdGVtcG9yYXJ5IG1hcCBmb3Igc29ydGluZ1xuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB0eHNCeUlkLnNldCh0eC5nZXRIYXNoKCksIHR4KTtcbiAgICAgIGxldCBvcmRlcmVkVHhzID0gW107XG4gICAgICBmb3IgKGxldCBoYXNoIG9mIHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKSkgaWYgKHR4c0J5SWQuZ2V0KGhhc2gpKSBvcmRlcmVkVHhzLnB1c2godHhzQnlJZC5nZXQoaGFzaCkpO1xuICAgICAgdHhzID0gb3JkZXJlZFR4cztcbiAgICB9XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHJhbnNmZXJbXT4ge1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBnZXQgdHJhbnNmZXJzIGRpcmVjdGx5IGlmIHF1ZXJ5IGRvZXMgbm90IHJlcXVpcmUgdHggY29udGV4dCAob3RoZXIgdHJhbnNmZXJzLCBvdXRwdXRzKVxuICAgIGlmICghTW9uZXJvV2FsbGV0UnBjLmlzQ29udGV4dHVhbChxdWVyeU5vcm1hbGl6ZWQpKSByZXR1cm4gdGhpcy5nZXRUcmFuc2ZlcnNBdXgocXVlcnlOb3JtYWxpemVkKTtcbiAgICBcbiAgICAvLyBvdGhlcndpc2UgZ2V0IHR4cyB3aXRoIGZ1bGwgbW9kZWxzIHRvIGZ1bGZpbGwgcXVlcnlcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5nZXRUeHMocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKSkpIHtcbiAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmZpbHRlclRyYW5zZmVycyhxdWVyeU5vcm1hbGl6ZWQpKSB7XG4gICAgICAgIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvT3V0cHV0UXVlcnk+KTogUHJvbWlzZTxNb25lcm9PdXRwdXRXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gZ2V0IG91dHB1dHMgZGlyZWN0bHkgaWYgcXVlcnkgZG9lcyBub3QgcmVxdWlyZSB0eCBjb250ZXh0IChvdGhlciBvdXRwdXRzLCB0cmFuc2ZlcnMpXG4gICAgaWYgKCFNb25lcm9XYWxsZXRScGMuaXNDb250ZXh0dWFsKHF1ZXJ5Tm9ybWFsaXplZCkpIHJldHVybiB0aGlzLmdldE91dHB1dHNBdXgocXVlcnlOb3JtYWxpemVkKTtcbiAgICBcbiAgICAvLyBvdGhlcndpc2UgZ2V0IHR4cyB3aXRoIGZ1bGwgbW9kZWxzIHRvIGZ1bGZpbGwgcXVlcnlcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMuZ2V0VHhzKHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkpKSB7XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZmlsdGVyT3V0cHV0cyhxdWVyeU5vcm1hbGl6ZWQpKSB7XG4gICAgICAgIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfb3V0cHV0c1wiLCB7YWxsOiBhbGx9KSkucmVzdWx0Lm91dHB1dHNfZGF0YV9oZXg7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE91dHB1dHMob3V0cHV0c0hleDogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9vdXRwdXRzXCIsIHtvdXRwdXRzX2RhdGFfaGV4OiBvdXRwdXRzSGV4fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm51bV9pbXBvcnRlZDtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucnBjRXhwb3J0S2V5SW1hZ2VzKGFsbCk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydEtleUltYWdlcyhrZXlJbWFnZXM6IE1vbmVyb0tleUltYWdlW10pOiBQcm9taXNlPE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0PiB7XG4gICAgXG4gICAgLy8gY29udmVydCBrZXkgaW1hZ2VzIHRvIHJwYyBwYXJhbWV0ZXJcbiAgICBsZXQgcnBjS2V5SW1hZ2VzID0ga2V5SW1hZ2VzLm1hcChrZXlJbWFnZSA9PiAoe2tleV9pbWFnZToga2V5SW1hZ2UuZ2V0SGV4KCksIHNpZ25hdHVyZToga2V5SW1hZ2UuZ2V0U2lnbmF0dXJlKCl9KSk7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbXBvcnRfa2V5X2ltYWdlc1wiLCB7c2lnbmVkX2tleV9pbWFnZXM6IHJwY0tleUltYWdlc30pO1xuICAgIFxuICAgIC8vIGJ1aWxkIGFuZCByZXR1cm4gcmVzdWx0XG4gICAgbGV0IGltcG9ydFJlc3VsdCA9IG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCgpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRIZWlnaHQocmVzcC5yZXN1bHQuaGVpZ2h0KTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0U3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnNwZW50KSk7XG4gICAgaW1wb3J0UmVzdWx0LnNldFVuc3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnVuc3BlbnQpKTtcbiAgICByZXR1cm4gaW1wb3J0UmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5ycGNFeHBvcnRLZXlJbWFnZXMoZmFsc2UpO1xuICB9XG4gIFxuICBhc3luYyBmcmVlemVPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmcmVlemVcIiwge2tleV9pbWFnZToga2V5SW1hZ2V9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGhhd091dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInRoYXdcIiwge2tleV9pbWFnZToga2V5SW1hZ2V9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZnJvemVuXCIsIHtrZXlfaW1hZ2U6IGtleUltYWdlfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmZyb3plbiA9PT0gdHJ1ZTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSwgY29weSwgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRDYW5TcGxpdCh0cnVlKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpID09PSB0cnVlICYmIGF3YWl0IHRoaXMuaXNNdWx0aXNpZygpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcmVsYXkgbXVsdGlzaWcgdHJhbnNhY3Rpb24gdW50aWwgY28tc2lnbmVkXCIpO1xuXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3NlcyB0byBzZW5kIGZyb21cbiAgICBsZXQgYWNjb3VudElkeCA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHRoZSBhY2NvdW50IGluZGV4IHRvIHNlbmQgZnJvbVwiKTtcbiAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5zbGljZSgwKTsgLy8gZmV0Y2ggYWxsIG9yIGNvcHkgZ2l2ZW4gaW5kaWNlc1xuICAgIFxuICAgIC8vIGJ1aWxkIGNvbmZpZyBwYXJhbWV0ZXJzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmRlc3RpbmF0aW9ucyA9IFtdO1xuICAgIGZvciAobGV0IGRlc3RpbmF0aW9uIG9mIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0RGVzdGluYXRpb25zKCkpIHtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIFwiRGVzdGluYXRpb24gYWRkcmVzcyBpcyBub3QgZGVmaW5lZFwiKTtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBbW91bnQoKSwgXCJEZXN0aW5hdGlvbiBhbW91bnQgaXMgbm90IGRlZmluZWRcIik7XG4gICAgICBwYXJhbXMuZGVzdGluYXRpb25zLnB1c2goeyBhZGRyZXNzOiBkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIGFtb3VudDogZGVzdGluYXRpb24uZ2V0QW1vdW50KCkudG9TdHJpbmcoKSB9KTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkpIHBhcmFtcy5zdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzID0gY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IHN1YmFkZHJlc3NJbmRpY2VzO1xuICAgIHBhcmFtcy5wYXltZW50X2lkID0gY29uZmlnTm9ybWFsaXplZC5nZXRQYXltZW50SWQoKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRVbmxvY2tUaW1lKCkgIT09IHVuZGVmaW5lZCkgcGFyYW1zLnVubG9ja190aW1lID0gY29uZmlnTm9ybWFsaXplZC5nZXRVbmxvY2tUaW1lKCkudG9TdHJpbmcoKVxuICAgIHBhcmFtcy5kb19ub3RfcmVsYXkgPSBjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkgIT09IHRydWU7XG4gICAgYXNzZXJ0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKSA+PSAwICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCk7XG4gICAgcGFyYW1zLmdldF90eF9oZXggPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfbWV0YWRhdGEgPSB0cnVlO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkpIHBhcmFtcy5nZXRfdHhfa2V5cyA9IHRydWU7IC8vIHBhcmFtIHRvIGdldCB0eCBrZXkocykgZGVwZW5kcyBpZiBzcGxpdFxuICAgIGVsc2UgcGFyYW1zLmdldF90eF9rZXkgPSB0cnVlO1xuXG4gICAgLy8gY2Fubm90IGFwcGx5IHN1YnRyYWN0RmVlRnJvbSB3aXRoIGB0cmFuc2Zlcl9zcGxpdGAgY2FsbFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKSAmJiBjb25maWdOb3JtYWxpemVkLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcInN1YnRyYWN0ZmVlZnJvbSB0cmFuc2ZlcnMgY2Fubm90IGJlIHNwbGl0IG92ZXIgbXVsdGlwbGUgdHJhbnNhY3Rpb25zIHlldFwiKTtcbiAgICB9XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3VsdDtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpID8gXCJ0cmFuc2Zlcl9zcGxpdFwiIDogXCJ0cmFuc2ZlclwiLCBwYXJhbXMpO1xuICAgICAgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZS5pbmRleE9mKFwiV0FMTEVUX1JQQ19FUlJPUl9DT0RFX1dST05HX0FERFJFU1NcIikgPiAtMSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBkZXN0aW5hdGlvbiBhZGRyZXNzXCIpO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgICBcbiAgICAvLyBwcmUtaW5pdGlhbGl6ZSB0eHMgaWZmIHByZXNlbnQuIG11bHRpc2lnIGFuZCB2aWV3LW9ubHkgd2FsbGV0cyB3aWxsIGhhdmUgdHggc2V0IHdpdGhvdXQgdHJhbnNhY3Rpb25zXG4gICAgbGV0IHR4cztcbiAgICBsZXQgbnVtVHhzID0gY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpID8gKHJlc3VsdC5mZWVfbGlzdCAhPT0gdW5kZWZpbmVkID8gcmVzdWx0LmZlZV9saXN0Lmxlbmd0aCA6IDApIDogKHJlc3VsdC5mZWUgIT09IHVuZGVmaW5lZCA/IDEgOiAwKTtcbiAgICBpZiAobnVtVHhzID4gMCkgdHhzID0gW107XG4gICAgbGV0IGNvcHlEZXN0aW5hdGlvbnMgPSBudW1UeHMgPT09IDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UeHM7IGkrKykge1xuICAgICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgICBNb25lcm9XYWxsZXRScGMuaW5pdFNlbnRUeFdhbGxldChjb25maWdOb3JtYWxpemVkLCB0eCwgY29weURlc3RpbmF0aW9ucyk7XG4gICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJbmRpY2VzICE9PSB1bmRlZmluZWQgJiYgc3ViYWRkcmVzc0luZGljZXMubGVuZ3RoID09PSAxKSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0U3ViYWRkcmVzc0luZGljZXMoc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgdHhzLnB1c2godHgpO1xuICAgIH1cbiAgICBcbiAgICAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkpIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggc2V0IGZyb20gcnBjIHJlc3BvbnNlIHdpdGggcHJlLWluaXRpYWxpemVkIHR4c1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkpIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCwgdHhzLCBjb25maWdOb3JtYWxpemVkKS5nZXRUeHMoKTtcbiAgICBlbHNlIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4VG9UeFNldChyZXN1bHQsIHR4cyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdHhzWzBdLCB0cnVlLCBjb25maWdOb3JtYWxpemVkKS5nZXRUeHMoKTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBPdXRwdXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyhjb25maWcpO1xuICAgIFxuICAgIC8vIGJ1aWxkIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hZGRyZXNzID0gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCk7XG4gICAgcGFyYW1zLmtleV9pbWFnZSA9IGNvbmZpZy5nZXRLZXlJbWFnZSgpO1xuICAgIGlmIChjb25maWcuZ2V0VW5sb2NrVGltZSgpICE9PSB1bmRlZmluZWQpIHBhcmFtcy51bmxvY2tfdGltZSA9IGNvbmZpZy5nZXRVbmxvY2tUaW1lKCk7XG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpICE9PSB0cnVlO1xuICAgIGFzc2VydChjb25maWcuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnLmdldFByaW9yaXR5KCk7XG4gICAgcGFyYW1zLnBheW1lbnRfaWQgPSBjb25maWcuZ2V0UGF5bWVudElkKCk7XG4gICAgcGFyYW1zLmdldF90eF9rZXkgPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN3ZWVwX3NpbmdsZVwiLCBwYXJhbXMpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBcbiAgICAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIGlmIChjb25maWcuZ2V0UmVsYXkoKSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgXG4gICAgLy8gYnVpbGQgYW5kIHJldHVybiB0eFxuICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5pbml0U2VudFR4V2FsbGV0KGNvbmZpZywgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4VG9UeFNldChyZXN1bHQsIHR4LCB0cnVlLCBjb25maWcpO1xuICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKVswXS5zZXRBbW91bnQodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFtb3VudCgpKTsgLy8gaW5pdGlhbGl6ZSBkZXN0aW5hdGlvbiBhbW91bnRcbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwVW5sb2NrZWQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBzd2VlcDsgZGVmYXVsdCB0byBhbGwgd2l0aCB1bmxvY2tlZCBiYWxhbmNlIGlmIG5vdCBzcGVjaWZpZWRcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTsgIC8vIG1hcHMgZWFjaCBhY2NvdW50IGluZGV4IHRvIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBzd2VlcFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpbmRpY2VzLnNldChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpLCBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgICAgIGluZGljZXMuc2V0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3Nlcyhjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpKSkge1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgYWNjb3VudHMgPSBhd2FpdCB0aGlzLmdldEFjY291bnRzKHRydWUpO1xuICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiBhY2NvdW50cykge1xuICAgICAgICBpZiAoYWNjb3VudC5nZXRVbmxvY2tlZEJhbGFuY2UoKSA+IDBuKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgICAgICAgaW5kaWNlcy5zZXQoYWNjb3VudC5nZXRJbmRleCgpLCBzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpKSB7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSA+IDBuKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHN3ZWVwIGZyb20gZWFjaCBhY2NvdW50IGFuZCBjb2xsZWN0IHJlc3VsdGluZyB0eCBzZXRzXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGZvciAobGV0IGFjY291bnRJZHggb2YgaW5kaWNlcy5rZXlzKCkpIHtcbiAgICAgIFxuICAgICAgLy8gY29weSBhbmQgbW9kaWZ5IHRoZSBvcmlnaW5hbCBjb25maWdcbiAgICAgIGxldCBjb3B5ID0gY29uZmlnTm9ybWFsaXplZC5jb3B5KCk7XG4gICAgICBjb3B5LnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIGNvcHkuc2V0U3dlZXBFYWNoU3ViYWRkcmVzcyhmYWxzZSk7XG4gICAgICBcbiAgICAgIC8vIHN3ZWVwIGFsbCBzdWJhZGRyZXNzZXMgdG9nZXRoZXIgIC8vIFRPRE8gbW9uZXJvLXByb2plY3Q6IGNhbiB0aGlzIHJldmVhbCBvdXRwdXRzIGJlbG9uZyB0byB0aGUgc2FtZSB3YWxsZXQ/XG4gICAgICBpZiAoY29weS5nZXRTd2VlcEVhY2hTdWJhZGRyZXNzKCkgIT09IHRydWUpIHtcbiAgICAgICAgY29weS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhpbmRpY2VzLmdldChhY2NvdW50SWR4KSk7XG4gICAgICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMucnBjU3dlZXBBY2NvdW50KGNvcHkpKSB0eHMucHVzaCh0eCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIG90aGVyd2lzZSBzd2VlcCBlYWNoIHN1YmFkZHJlc3MgaW5kaXZpZHVhbGx5XG4gICAgICBlbHNlIHtcbiAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzc0lkeCBvZiBpbmRpY2VzLmdldChhY2NvdW50SWR4KSkge1xuICAgICAgICAgIGNvcHkuc2V0U3ViYWRkcmVzc0luZGljZXMoW3N1YmFkZHJlc3NJZHhdKTtcbiAgICAgICAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLnJwY1N3ZWVwQWNjb3VudChjb3B5KSkgdHhzLnB1c2godHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5PzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmIChyZWxheSA9PT0gdW5kZWZpbmVkKSByZWxheSA9IGZhbHNlO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfZHVzdFwiLCB7ZG9fbm90X3JlbGF5OiAhcmVsYXl9KTtcbiAgICBpZiAocmVsYXkpIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCk7XG4gICAgaWYgKHR4U2V0LmdldFR4cygpID09PSB1bmRlZmluZWQpIHJldHVybiBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkge1xuICAgICAgdHguc2V0SXNSZWxheWVkKCFyZWxheSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0eC5nZXRJc1JlbGF5ZWQoKSk7XG4gICAgfVxuICAgIHJldHVybiB0eFNldC5nZXRUeHMoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHModHhzT3JNZXRhZGF0YXM6IChNb25lcm9UeFdhbGxldCB8IHN0cmluZylbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eHNPck1ldGFkYXRhcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBvciB0aGVpciBtZXRhZGF0YSB0byByZWxheVwiKTtcbiAgICBsZXQgdHhIYXNoZXMgPSBbXTtcbiAgICBmb3IgKGxldCB0eE9yTWV0YWRhdGEgb2YgdHhzT3JNZXRhZGF0YXMpIHtcbiAgICAgIGxldCBtZXRhZGF0YSA9IHR4T3JNZXRhZGF0YSBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0ID8gdHhPck1ldGFkYXRhLmdldE1ldGFkYXRhKCkgOiB0eE9yTWV0YWRhdGE7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlbGF5X3R4XCIsIHsgaGV4OiBtZXRhZGF0YSB9KTtcbiAgICAgIHR4SGFzaGVzLnB1c2gocmVzcC5yZXN1bHQudHhfaGFzaCk7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMucG9sbCgpOyAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIHJldHVybiB0eEhhc2hlcztcbiAgfVxuICBcbiAgYXN5bmMgZGVzY3JpYmVUeFNldCh0eFNldDogTW9uZXJvVHhTZXQpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJkZXNjcmliZV90cmFuc2ZlclwiLCB7XG4gICAgICB1bnNpZ25lZF90eHNldDogdHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpLFxuICAgICAgbXVsdGlzaWdfdHhzZXQ6IHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKVxuICAgIH0pO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY0Rlc2NyaWJlVHJhbnNmZXIocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25fdHJhbnNmZXJcIiwge1xuICAgICAgdW5zaWduZWRfdHhzZXQ6IHVuc2lnbmVkVHhIZXgsXG4gICAgICBleHBvcnRfcmF3OiBmYWxzZVxuICAgIH0pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfdHJhbnNmZXJcIiwge1xuICAgICAgdHhfZGF0YV9oZXg6IHNpZ25lZFR4SGV4XG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBzaWduYXR1cmVUeXBlID0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgYWNjb3VudElkeCA9IDAsIHN1YmFkZHJlc3NJZHggPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25cIiwge1xuICAgICAgICBkYXRhOiBtZXNzYWdlLFxuICAgICAgICBzaWduYXR1cmVfdHlwZTogc2lnbmF0dXJlVHlwZSA9PT0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA/IFwic3BlbmRcIiA6IFwidmlld1wiLFxuICAgICAgICBhY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LFxuICAgICAgICBhZGRyZXNzX2luZGV4OiBzdWJhZGRyZXNzSWR4XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQ+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ2ZXJpZnlcIiwge2RhdGE6IG1lc3NhZ2UsIGFkZHJlc3M6IGFkZHJlc3MsIHNpZ25hdHVyZTogc2lnbmF0dXJlfSk7XG4gICAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQoXG4gICAgICAgIHJlc3VsdC5nb29kID8ge2lzR29vZDogcmVzdWx0Lmdvb2QsIGlzT2xkOiByZXN1bHQub2xkLCBzaWduYXR1cmVUeXBlOiByZXN1bHQuc2lnbmF0dXJlX3R5cGUgPT09IFwidmlld1wiID8gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1ZJRVdfS0VZIDogTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgdmVyc2lvbjogcmVzdWx0LnZlcnNpb259IDoge2lzR29vZDogZmFsc2V9XG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMikgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KHtpc0dvb2Q6IGZhbHNlfSk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9rZXlcIiwge3R4aWQ6IHR4SGFzaH0pKS5yZXN1bHQudHhfa2V5O1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaDogc3RyaW5nLCB0eEtleTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfdHhfa2V5XCIsIHt0eGlkOiB0eEhhc2gsIHR4X2tleTogdHhLZXksIGFkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICAgIFxuICAgICAgLy8gaW50ZXJwcmV0IHJlc3VsdFxuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZCh0cnVlKTtcbiAgICAgIGNoZWNrLnNldE51bUNvbmZpcm1hdGlvbnMocmVzcC5yZXN1bHQuY29uZmlybWF0aW9ucyk7XG4gICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgIGNoZWNrLnNldFJlY2VpdmVkQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5yZWNlaXZlZCkpO1xuICAgICAgcmV0dXJuIGNoZWNrO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9wcm9vZlwiLCB7dHhpZDogdHhIYXNoLCBhZGRyZXNzOiBhZGRyZXNzLCBtZXNzYWdlOiBtZXNzYWdlfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja190eF9wcm9vZlwiLCB7XG4gICAgICAgIHR4aWQ6IHR4SGFzaCxcbiAgICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBpbnRlcnByZXQgcmVzcG9uc2VcbiAgICAgIGxldCBpc0dvb2QgPSByZXNwLnJlc3VsdC5nb29kO1xuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZChpc0dvb2QpO1xuICAgICAgaWYgKGlzR29vZCkge1xuICAgICAgICBjaGVjay5zZXROdW1Db25maXJtYXRpb25zKHJlc3AucmVzdWx0LmNvbmZpcm1hdGlvbnMpO1xuICAgICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgICAgY2hlY2suc2V0UmVjZWl2ZWRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnJlY2VpdmVkKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2hlY2s7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtMSAmJiBlLm1lc3NhZ2UgPT09IFwiYmFzaWNfc3RyaW5nXCIpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJNdXN0IHByb3ZpZGUgc2lnbmF0dXJlIHRvIGNoZWNrIHR4IHByb29mXCIsIC0xKTtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfc3BlbmRfcHJvb2ZcIiwge3R4aWQ6IHR4SGFzaCwgbWVzc2FnZTogbWVzc2FnZX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfc3BlbmRfcHJvb2ZcIiwge1xuICAgICAgICB0eGlkOiB0eEhhc2gsXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC5nb29kO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhbGw6IHRydWUsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGFtb3VudDogYmlnaW50LCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFjY291bnRfaW5kZXg6IGFjY291bnRJZHgsXG4gICAgICBhbW91bnQ6IGFtb3VudC50b1N0cmluZygpLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gIH1cblxuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT4ge1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgfSk7XG4gICAgXG4gICAgLy8gaW50ZXJwcmV0IHJlc3VsdHNcbiAgICBsZXQgaXNHb29kID0gcmVzcC5yZXN1bHQuZ29vZDtcbiAgICBsZXQgY2hlY2sgPSBuZXcgTW9uZXJvQ2hlY2tSZXNlcnZlKCk7XG4gICAgY2hlY2suc2V0SXNHb29kKGlzR29vZCk7XG4gICAgaWYgKGlzR29vZCkge1xuICAgICAgY2hlY2suc2V0VW5jb25maXJtZWRTcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQuc3BlbnQpKTtcbiAgICAgIGNoZWNrLnNldFRvdGFsQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC50b3RhbCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hlY2s7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3R4X25vdGVzXCIsIHt0eGlkczogdHhIYXNoZXN9KSkucmVzdWx0Lm5vdGVzO1xuICB9XG4gIFxuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSwgbm90ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X3R4X25vdGVzXCIsIHt0eGlkczogdHhIYXNoZXMsIG5vdGVzOiBub3Rlc30pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb0FkZHJlc3NCb29rRW50cnlbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NfYm9va1wiLCB7ZW50cmllczogZW50cnlJbmRpY2VzfSk7XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5lbnRyaWVzKSByZXR1cm4gW107XG4gICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNFbnRyeSBvZiByZXNwLnJlc3VsdC5lbnRyaWVzKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb0FkZHJlc3NCb29rRW50cnkoKS5zZXRJbmRleChycGNFbnRyeS5pbmRleCkuc2V0QWRkcmVzcyhycGNFbnRyeS5hZGRyZXNzKS5zZXREZXNjcmlwdGlvbihycGNFbnRyeS5kZXNjcmlwdGlvbikuc2V0UGF5bWVudElkKHJwY0VudHJ5LnBheW1lbnRfaWQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzczogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhZGRfYWRkcmVzc19ib29rXCIsIHthZGRyZXNzOiBhZGRyZXNzLCBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb259KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuaW5kZXg7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4OiBudW1iZXIsIHNldEFkZHJlc3M6IGJvb2xlYW4sIGFkZHJlc3M6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2V0RGVzY3JpcHRpb246IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImVkaXRfYWRkcmVzc19ib29rXCIsIHtcbiAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgIHNldF9hZGRyZXNzOiBzZXRBZGRyZXNzLFxuICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgIHNldF9kZXNjcmlwdGlvbjogc2V0RGVzY3JpcHRpb24sXG4gICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZGVsZXRlX2FkZHJlc3NfYm9va1wiLCB7aW5kZXg6IGVudHJ5SWR4fSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRhZ0FjY291bnRzKHRhZywgYWNjb3VudEluZGljZXMpIHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ0YWdfYWNjb3VudHNcIiwge3RhZzogdGFnLCBhY2NvdW50czogYWNjb3VudEluZGljZXN9KTtcbiAgfVxuXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidW50YWdfYWNjb3VudHNcIiwge2FjY291bnRzOiBhY2NvdW50SW5kaWNlc30pO1xuICB9XG5cbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICBsZXQgdGFncyA9IFtdO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FjY291bnRfdGFnc1wiKTtcbiAgICBpZiAocmVzcC5yZXN1bHQuYWNjb3VudF90YWdzKSB7XG4gICAgICBmb3IgKGxldCBycGNBY2NvdW50VGFnIG9mIHJlc3AucmVzdWx0LmFjY291bnRfdGFncykge1xuICAgICAgICB0YWdzLnB1c2gobmV3IE1vbmVyb0FjY291bnRUYWcoe1xuICAgICAgICAgIHRhZzogcnBjQWNjb3VudFRhZy50YWcgPyBycGNBY2NvdW50VGFnLnRhZyA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBsYWJlbDogcnBjQWNjb3VudFRhZy5sYWJlbCA/IHJwY0FjY291bnRUYWcubGFiZWwgOiB1bmRlZmluZWQsXG4gICAgICAgICAgYWNjb3VudEluZGljZXM6IHJwY0FjY291bnRUYWcuYWNjb3VudHNcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFncztcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9hY2NvdW50X3RhZ19kZXNjcmlwdGlvblwiLCB7dGFnOiB0YWcsIGRlc2NyaXB0aW9uOiBsYWJlbH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXltZW50VXJpKGNvbmZpZzogTW9uZXJvVHhDb25maWcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfdXJpXCIsIHtcbiAgICAgIGFkZHJlc3M6IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksXG4gICAgICBhbW91bnQ6IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSA/IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKS50b1N0cmluZygpIDogdW5kZWZpbmVkLFxuICAgICAgcGF5bWVudF9pZDogY29uZmlnLmdldFBheW1lbnRJZCgpLFxuICAgICAgcmVjaXBpZW50X25hbWU6IGNvbmZpZy5nZXRSZWNpcGllbnROYW1lKCksXG4gICAgICB0eF9kZXNjcmlwdGlvbjogY29uZmlnLmdldE5vdGUoKVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC51cmk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmk6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhDb25maWc+IHtcbiAgICBhc3NlcnQodXJpLCBcIk11c3QgcHJvdmlkZSBVUkkgdG8gcGFyc2VcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJwYXJzZV91cmlcIiwge3VyaTogdXJpfSk7XG4gICAgbGV0IGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyh7YWRkcmVzczogcmVzcC5yZXN1bHQudXJpLmFkZHJlc3MsIGFtb3VudDogQmlnSW50KHJlc3AucmVzdWx0LnVyaS5hbW91bnQpfSk7XG4gICAgY29uZmlnLnNldFBheW1lbnRJZChyZXNwLnJlc3VsdC51cmkucGF5bWVudF9pZCk7XG4gICAgY29uZmlnLnNldFJlY2lwaWVudE5hbWUocmVzcC5yZXN1bHQudXJpLnJlY2lwaWVudF9uYW1lKTtcbiAgICBjb25maWcuc2V0Tm90ZShyZXNwLnJlc3VsdC51cmkudHhfZGVzY3JpcHRpb24pO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpKSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uc2V0QWRkcmVzcyh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0UGF5bWVudElkKCkpIGNvbmZpZy5zZXRQYXltZW50SWQodW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldFJlY2lwaWVudE5hbWUoKSkgY29uZmlnLnNldFJlY2lwaWVudE5hbWUodW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldE5vdGUoKSkgY29uZmlnLnNldE5vdGUodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gY29uZmlnO1xuICB9XG4gIFxuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hdHRyaWJ1dGVcIiwge2tleToga2V5fSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQudmFsdWUgPT09IFwiXCIgPyB1bmRlZmluZWQgOiByZXNwLnJlc3VsdC52YWx1ZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC00NSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBzZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcsIHZhbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2F0dHJpYnV0ZVwiLCB7a2V5OiBrZXksIHZhbHVlOiB2YWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcobnVtVGhyZWFkczogbnVtYmVyLCBiYWNrZ3JvdW5kTWluaW5nPzogYm9vbGVhbiwgaWdub3JlQmF0dGVyeT86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdGFydF9taW5pbmdcIiwge1xuICAgICAgdGhyZWFkc19jb3VudDogbnVtVGhyZWFkcyxcbiAgICAgIGRvX2JhY2tncm91bmRfbWluaW5nOiBiYWNrZ3JvdW5kTWluaW5nLFxuICAgICAgaWdub3JlX2JhdHRlcnk6IGlnbm9yZUJhdHRlcnlcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9wX21pbmluZ1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5tdWx0aXNpZ19pbXBvcnRfbmVlZGVkID09PSB0cnVlO1xuICB9XG4gIFxuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luZm8+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImlzX211bHRpc2lnXCIpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgaW5mbyA9IG5ldyBNb25lcm9NdWx0aXNpZ0luZm8oKTtcbiAgICBpbmZvLnNldElzTXVsdGlzaWcocmVzdWx0Lm11bHRpc2lnKTtcbiAgICBpbmZvLnNldElzUmVhZHkocmVzdWx0LnJlYWR5KTtcbiAgICBpbmZvLnNldFRocmVzaG9sZChyZXN1bHQudGhyZXNob2xkKTtcbiAgICBpbmZvLnNldE51bVBhcnRpY2lwYW50cyhyZXN1bHQudG90YWwpO1xuICAgIHJldHVybiBpbmZvO1xuICB9XG4gIFxuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInByZXBhcmVfbXVsdGlzaWdcIiwge2VuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWw6IHRydWV9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICByZXR1cm4gcmVzdWx0Lm11bHRpc2lnX2luZm87XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgdGhyZXNob2xkOiBudW1iZXIsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibWFrZV9tdWx0aXNpZ1wiLCB7XG4gICAgICBtdWx0aXNpZ19pbmZvOiBtdWx0aXNpZ0hleGVzLFxuICAgICAgdGhyZXNob2xkOiB0aHJlc2hvbGQsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmRcbiAgICB9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5tdWx0aXNpZ19pbmZvO1xuICB9XG4gIFxuICBhc3luYyBleGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleGNoYW5nZV9tdWx0aXNpZ19rZXlzXCIsIHttdWx0aXNpZ19pbmZvOiBtdWx0aXNpZ0hleGVzLCBwYXNzd29yZDogcGFzc3dvcmR9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIGxldCBtc1Jlc3VsdCA9IG5ldyBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQoKTtcbiAgICBtc1Jlc3VsdC5zZXRBZGRyZXNzKHJlc3AucmVzdWx0LmFkZHJlc3MpO1xuICAgIG1zUmVzdWx0LnNldE11bHRpc2lnSGV4KHJlc3AucmVzdWx0Lm11bHRpc2lnX2luZm8pO1xuICAgIGlmIChtc1Jlc3VsdC5nZXRBZGRyZXNzKCkubGVuZ3RoID09PSAwKSBtc1Jlc3VsdC5zZXRBZGRyZXNzKHVuZGVmaW5lZCk7XG4gICAgaWYgKG1zUmVzdWx0LmdldE11bHRpc2lnSGV4KCkubGVuZ3RoID09PSAwKSBtc1Jlc3VsdC5zZXRNdWx0aXNpZ0hleCh1bmRlZmluZWQpO1xuICAgIHJldHVybiBtc1Jlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0TXVsdGlzaWdIZXgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4cG9ydF9tdWx0aXNpZ19pbmZvXCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5pbmZvO1xuICB9XG5cbiAgYXN5bmMgaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlczogc3RyaW5nW10pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShtdWx0aXNpZ0hleGVzKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN0cmluZ1tdIHRvIGltcG9ydE11bHRpc2lnSGV4KClcIilcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9tdWx0aXNpZ19pbmZvXCIsIHtpbmZvOiBtdWx0aXNpZ0hleGVzfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm5fb3V0cHV0cztcbiAgfVxuXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzaWduX211bHRpc2lnXCIsIHt0eF9kYXRhX2hleDogbXVsdGlzaWdUeEhleH0pO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgc2lnblJlc3VsdCA9IG5ldyBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQoKTtcbiAgICBzaWduUmVzdWx0LnNldFNpZ25lZE11bHRpc2lnVHhIZXgocmVzdWx0LnR4X2RhdGFfaGV4KTtcbiAgICBzaWduUmVzdWx0LnNldFR4SGFzaGVzKHJlc3VsdC50eF9oYXNoX2xpc3QpO1xuICAgIHJldHVybiBzaWduUmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfbXVsdGlzaWdcIiwge3R4X2RhdGFfaGV4OiBzaWduZWRNdWx0aXNpZ1R4SGV4fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQ6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkXCIsIHtvbGRfcGFzc3dvcmQ6IG9sZFBhc3N3b3JkIHx8IFwiXCIsIG5ld19wYXNzd29yZDogbmV3UGFzc3dvcmQgfHwgXCJcIn0pO1xuICB9XG4gIFxuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3JlXCIpO1xuICB9XG4gIFxuICBhc3luYyBjbG9zZShzYXZlID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5jbG9zZShzYXZlKTtcbiAgICBpZiAoc2F2ZSA9PT0gdW5kZWZpbmVkKSBzYXZlID0gZmFsc2U7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNsb3NlX3dhbGxldFwiLCB7YXV0b3NhdmVfY3VycmVudDogc2F2ZX0pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nsb3NlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmV0dXJuIGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTEzICYmIGUubWVzc2FnZS5pbmRleE9mKFwiTm8gd2FsbGV0IGZpbGVcIikgPiAtMTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICAvKipcbiAgICogU2F2ZSBhbmQgY2xvc2UgdGhlIGN1cnJlbnQgd2FsbGV0IGFuZCBzdG9wIHRoZSBSUEMgc2VydmVyLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3Bfd2FsbGV0XCIpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuXG4gIGFzeW5jIGdldE51bUJsb2Nrc1RvVW5sb2NrKCk6IFByb21pc2U8bnVtYmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldE51bUJsb2Nrc1RvVW5sb2NrKCk7IH1cbiAgYXN5bmMgZ2V0VHgodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gpOyB9XG4gIGFzeW5jIGdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBnZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5PikgeyByZXR1cm4gc3VwZXIuZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGNyZWF0ZVR4KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5jcmVhdGVUeChjb25maWcpOyB9XG4gIGFzeW5jIHJlbGF5VHgodHhPck1ldGFkYXRhOiBNb25lcm9UeFdhbGxldCB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5yZWxheVR4KHR4T3JNZXRhZGF0YSk7IH1cbiAgYXN5bmMgZ2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFR4Tm90ZSh0eEhhc2gpOyB9XG4gIGFzeW5jIHNldFR4Tm90ZSh0eEhhc2g6IHN0cmluZywgbm90ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zZXRUeE5vdGUodHhIYXNoLCBub3RlKTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzdGF0aWMgYXN5bmMgY29ubmVjdFRvV2FsbGV0UnBjKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgbGV0IGNvbmZpZyA9IE1vbmVyb1dhbGxldFJwYy5ub3JtYWxpemVDb25maWcodXJpT3JDb25maWcsIHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgaWYgKGNvbmZpZy5jbWQpIHJldHVybiBNb25lcm9XYWxsZXRScGMuc3RhcnRXYWxsZXRScGNQcm9jZXNzKGNvbmZpZyk7XG4gICAgZWxzZSByZXR1cm4gbmV3IE1vbmVyb1dhbGxldFJwYyhjb25maWcpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIHN0YXJ0V2FsbGV0UnBjUHJvY2Vzcyhjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzQXJyYXkoY29uZmlnLmNtZCksIFwiTXVzdCBwcm92aWRlIHN0cmluZyBhcnJheSB3aXRoIGNvbW1hbmQgbGluZSBwYXJhbWV0ZXJzXCIpO1xuICAgIFxuICAgIC8vIHN0YXJ0IHByb2Nlc3NcbiAgICBsZXQgY2hpbGRfcHJvY2VzcyA9IGF3YWl0IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIik7XG4gICAgY29uc3QgY2hpbGRQcm9jZXNzID0gY2hpbGRfcHJvY2Vzcy5zcGF3bihjb25maWcuY21kWzBdLCBjb25maWcuY21kLnNsaWNlKDEpLCB7XG4gICAgICBlbnY6IHsgLi4ucHJvY2Vzcy5lbnYsIExBTkc6ICdlbl9VUy5VVEYtOCcgfSAvLyBzY3JhcGUgb3V0cHV0IGluIGVuZ2xpc2hcbiAgICB9KTtcbiAgICBjaGlsZFByb2Nlc3Muc3Rkb3V0LnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIG1vbmVyby13YWxsZXQtcnBjXG4gICAgbGV0IHVyaTtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgbGV0IG91dHB1dCA9IFwiXCI7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3Rkb3V0XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQub24oJ2RhdGEnLCBhc3luYyBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgbGV0IGxpbmUgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICAgICAgTGlicmFyeVV0aWxzLmxvZygyLCBsaW5lKTtcbiAgICAgICAgICBvdXRwdXQgKz0gbGluZSArICdcXG4nOyAvLyBjYXB0dXJlIG91dHB1dCBpbiBjYXNlIG9mIGVycm9yXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gZXh0cmFjdCB1cmkgZnJvbSBlLmcuIFwiSSBCaW5kaW5nIG9uIDEyNy4wLjAuMSAoSVB2NCk6MzgwODVcIlxuICAgICAgICAgIGxldCB1cmlMaW5lQ29udGFpbnMgPSBcIkJpbmRpbmcgb24gXCI7XG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWluc0lkeCA9IGxpbmUuaW5kZXhPZih1cmlMaW5lQ29udGFpbnMpO1xuICAgICAgICAgIGlmICh1cmlMaW5lQ29udGFpbnNJZHggPj0gMCkge1xuICAgICAgICAgICAgbGV0IGhvc3QgPSBsaW5lLnN1YnN0cmluZyh1cmlMaW5lQ29udGFpbnNJZHggKyB1cmlMaW5lQ29udGFpbnMubGVuZ3RoLCBsaW5lLmxhc3RJbmRleE9mKCcgJykpO1xuICAgICAgICAgICAgbGV0IHVuZm9ybWF0dGVkTGluZSA9IGxpbmUucmVwbGFjZSgvXFx1MDAxYlxcWy4qP20vZywgJycpLnRyaW0oKTsgLy8gcmVtb3ZlIGNvbG9yIGZvcm1hdHRpbmdcbiAgICAgICAgICAgIGxldCBwb3J0ID0gdW5mb3JtYXR0ZWRMaW5lLnN1YnN0cmluZyh1bmZvcm1hdHRlZExpbmUubGFzdEluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgbGV0IHNzbElkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLXNzbFwiKTtcbiAgICAgICAgICAgIGxldCBzc2xFbmFibGVkID0gc3NsSWR4ID49IDAgPyBcImVuYWJsZWRcIiA9PSBjb25maWcuY21kW3NzbElkeCArIDFdLnRvTG93ZXJDYXNlKCkgOiBmYWxzZTtcbiAgICAgICAgICAgIHVyaSA9IChzc2xFbmFibGVkID8gXCJodHRwc1wiIDogXCJodHRwXCIpICsgXCI6Ly9cIiArIGhvc3QgKyBcIjpcIiArIHBvcnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlYWQgc3VjY2VzcyBtZXNzYWdlXG4gICAgICAgICAgaWYgKGxpbmUuaW5kZXhPZihcIlN0YXJ0aW5nIHdhbGxldCBSUEMgc2VydmVyXCIpID49IDApIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gZ2V0IHVzZXJuYW1lIGFuZCBwYXNzd29yZCBmcm9tIHBhcmFtc1xuICAgICAgICAgICAgbGV0IHVzZXJQYXNzSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtbG9naW5cIik7XG4gICAgICAgICAgICBsZXQgdXNlclBhc3MgPSB1c2VyUGFzc0lkeCA+PSAwID8gY29uZmlnLmNtZFt1c2VyUGFzc0lkeCArIDFdIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHVzZXJuYW1lID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZygwLCB1c2VyUGFzcy5pbmRleE9mKCc6JykpO1xuICAgICAgICAgICAgbGV0IHBhc3N3b3JkID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZyh1c2VyUGFzcy5pbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gY3JlYXRlIGNsaWVudCBjb25uZWN0ZWQgdG8gaW50ZXJuYWwgcHJvY2Vzc1xuICAgICAgICAgICAgY29uZmlnID0gY29uZmlnLmNvcHkoKS5zZXRTZXJ2ZXIoe3VyaTogdXJpLCB1c2VybmFtZTogdXNlcm5hbWUsIHBhc3N3b3JkOiBwYXNzd29yZCwgcmVqZWN0VW5hdXRob3JpemVkOiBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWR9KTtcbiAgICAgICAgICAgIGNvbmZpZy5jbWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0UnBjLmNvbm5lY3RUb1dhbGxldFJwYyhjb25maWcpO1xuICAgICAgICAgICAgd2FsbGV0LnByb2Nlc3MgPSBjaGlsZFByb2Nlc3M7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHJlc29sdmUgcHJvbWlzZSB3aXRoIGNsaWVudCBjb25uZWN0ZWQgdG8gaW50ZXJuYWwgcHJvY2VzcyBcbiAgICAgICAgICAgIHRoaXMuaXNSZXNvbHZlZCA9IHRydWU7XG4gICAgICAgICAgICByZXNvbHZlKHdhbGxldCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRlcnJcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5vbignZGF0YScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgY29uc29sZS5lcnJvcihkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXhpdFxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJleGl0XCIsIGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIHByb2Nlc3MgdGVybWluYXRlZCB3aXRoIGV4aXQgY29kZSBcIiArIGNvZGUgKyAob3V0cHV0ID8gXCI6XFxuXFxuXCIgKyBvdXRwdXQgOiBcIlwiKSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBlcnJvclxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJlcnJvclwiLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIkVOT0VOVFwiKSA+PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgZXhpc3QgYXQgcGF0aCAnXCIgKyBjb25maWcuY21kWzBdICsgXCInXCIpKTtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHVuY2F1Z2h0IGV4Y2VwdGlvblxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCBmdW5jdGlvbihlcnIsIG9yaWdpbikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmNhdWdodCBleGNlcHRpb24gaW4gbW9uZXJvLXdhbGxldC1ycGMgcHJvY2VzczogXCIgKyBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihvcmlnaW4pO1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjbGVhcigpIHtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgICBkZWxldGUgdGhpcy5hZGRyZXNzQ2FjaGU7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICB0aGlzLnBhdGggPSB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRBY2NvdW50SW5kaWNlcyhnZXRTdWJhZGRyZXNzSW5kaWNlcz86IGFueSkge1xuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpO1xuICAgIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgdGhpcy5nZXRBY2NvdW50cygpKSB7XG4gICAgICBpbmRpY2VzLnNldChhY2NvdW50LmdldEluZGV4KCksIGdldFN1YmFkZHJlc3NJbmRpY2VzID8gYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzSW5kaWNlcyhhY2NvdW50LmdldEluZGV4KCkpIDogdW5kZWZpbmVkKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZGljZXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRTdWJhZGRyZXNzSW5kaWNlcyhhY2NvdW50SWR4KSB7XG4gICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc1wiLCB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeH0pO1xuICAgIGZvciAobGV0IGFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQuYWRkcmVzc2VzKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKGFkZHJlc3MuYWRkcmVzc19pbmRleCk7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3NJbmRpY2VzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0VHJhbnNmZXJzQXV4KHF1ZXJ5OiBNb25lcm9UcmFuc2ZlclF1ZXJ5KSB7XG4gICAgXG4gICAgLy8gYnVpbGQgcGFyYW1zIGZvciBnZXRfdHJhbnNmZXJzIHJwYyBjYWxsXG4gICAgbGV0IHR4UXVlcnkgPSBxdWVyeS5nZXRUeFF1ZXJ5KCk7XG4gICAgbGV0IGNhbkJlQ29uZmlybWVkID0gdHhRdWVyeS5nZXRJc0NvbmZpcm1lZCgpICE9PSBmYWxzZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJc0ZhaWxlZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SXNSZWxheWVkKCkgIT09IGZhbHNlO1xuICAgIGxldCBjYW5CZUluVHhQb29sID0gdHhRdWVyeS5nZXRJc0NvbmZpcm1lZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJc0ZhaWxlZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCAmJiB0eFF1ZXJ5LmdldE1heEhlaWdodCgpID09PSB1bmRlZmluZWQgJiYgdHhRdWVyeS5nZXRJc0xvY2tlZCgpICE9PSBmYWxzZTtcbiAgICBsZXQgY2FuQmVJbmNvbWluZyA9IHF1ZXJ5LmdldElzSW5jb21pbmcoKSAhPT0gZmFsc2UgJiYgcXVlcnkuZ2V0SXNPdXRnb2luZygpICE9PSB0cnVlICYmIHF1ZXJ5LmdldEhhc0Rlc3RpbmF0aW9ucygpICE9PSB0cnVlO1xuICAgIGxldCBjYW5CZU91dGdvaW5nID0gcXVlcnkuZ2V0SXNPdXRnb2luZygpICE9PSBmYWxzZSAmJiBxdWVyeS5nZXRJc0luY29taW5nKCkgIT09IHRydWU7XG5cbiAgICAvLyBjaGVjayBpZiBmZXRjaGluZyBwb29sIHR4cyBjb250cmFkaWN0ZWQgYnkgY29uZmlndXJhdGlvblxuICAgIGlmICh0eFF1ZXJ5LmdldEluVHhQb29sKCkgPT09IHRydWUgJiYgIWNhbkJlSW5UeFBvb2wpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBmZXRjaCBwb29sIHRyYW5zYWN0aW9ucyBiZWNhdXNlIGl0IGNvbnRyYWRpY3RzIGNvbmZpZ3VyYXRpb25cIik7XG4gICAgfVxuXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmluID0gY2FuQmVJbmNvbWluZyAmJiBjYW5CZUNvbmZpcm1lZDtcbiAgICBwYXJhbXMub3V0ID0gY2FuQmVPdXRnb2luZyAmJiBjYW5CZUNvbmZpcm1lZDtcbiAgICBwYXJhbXMucG9vbCA9IGNhbkJlSW5jb21pbmcgJiYgY2FuQmVJblR4UG9vbDtcbiAgICBwYXJhbXMucGVuZGluZyA9IGNhbkJlT3V0Z29pbmcgJiYgY2FuQmVJblR4UG9vbDtcbiAgICBwYXJhbXMuZmFpbGVkID0gdHhRdWVyeS5nZXRJc0ZhaWxlZCgpICE9PSBmYWxzZSAmJiB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9IHRydWU7XG4gICAgaWYgKHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgPiAwKSBwYXJhbXMubWluX2hlaWdodCA9IHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgLSAxOyAvLyBUT0RPIG1vbmVyby1wcm9qZWN0OiB3YWxsZXQyOjpnZXRfcGF5bWVudHMoKSBtaW5faGVpZ2h0IGlzIGV4Y2x1c2l2ZSwgc28gbWFudWFsbHkgb2Zmc2V0IHRvIG1hdGNoIGludGVuZGVkIHJhbmdlIChpc3N1ZXMgIzU3NTEsICM1NTk4KVxuICAgICAgZWxzZSBwYXJhbXMubWluX2hlaWdodCA9IHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCk7XG4gICAgfVxuICAgIGlmICh0eFF1ZXJ5LmdldE1heEhlaWdodCgpICE9PSB1bmRlZmluZWQpIHBhcmFtcy5tYXhfaGVpZ2h0ID0gdHhRdWVyeS5nZXRNYXhIZWlnaHQoKTtcbiAgICBwYXJhbXMuZmlsdGVyX2J5X2hlaWdodCA9IHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCB8fCB0eFF1ZXJ5LmdldE1heEhlaWdodCgpICE9PSB1bmRlZmluZWQ7XG4gICAgaWYgKHF1ZXJ5LmdldEFjY291bnRJbmRleCgpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSA9PT0gdW5kZWZpbmVkICYmIHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCwgXCJRdWVyeSBzcGVjaWZpZXMgYSBzdWJhZGRyZXNzIGluZGV4IGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKTtcbiAgICAgIHBhcmFtcy5hbGxfYWNjb3VudHMgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IHF1ZXJ5LmdldEFjY291bnRJbmRleCgpO1xuICAgICAgXG4gICAgICAvLyBzZXQgc3ViYWRkcmVzcyBpbmRpY2VzIHBhcmFtXG4gICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBuZXcgU2V0KCk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkgIT09IHVuZGVmaW5lZCkgc3ViYWRkcmVzc0luZGljZXMuYWRkKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQpIHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubWFwKHN1YmFkZHJlc3NJZHggPT4gc3ViYWRkcmVzc0luZGljZXMuYWRkKHN1YmFkZHJlc3NJZHgpKTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcy5zaXplKSBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gQXJyYXkuZnJvbShzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHVuaXF1ZSB0eHMgYW5kIGJsb2Nrc1xuICAgIGxldCB0eE1hcCA9IHt9O1xuICAgIGxldCBibG9ja01hcCA9IHt9O1xuICAgIFxuICAgIC8vIGJ1aWxkIHR4cyB1c2luZyBgZ2V0X3RyYW5zZmVyc2BcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90cmFuc2ZlcnNcIiwgcGFyYW1zKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocmVzcC5yZXN1bHQpKSB7XG4gICAgICBmb3IgKGxldCBycGNUeCBvZiByZXNwLnJlc3VsdFtrZXldKSB7XG4gICAgICAgIC8vaWYgKHJwY1R4LnR4aWQgPT09IHF1ZXJ5LmRlYnVnVHhJZCkgY29uc29sZS5sb2cocnBjVHgpO1xuICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4KTtcbiAgICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIGFzc2VydCh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpID4gLTEpO1xuICAgICAgICBcbiAgICAgICAgLy8gcmVwbGFjZSB0cmFuc2ZlciBhbW91bnQgd2l0aCBkZXN0aW5hdGlvbiBzdW1cbiAgICAgICAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogY29uZmlybWVkIHR4IGZyb20vdG8gc2FtZSBhY2NvdW50IGhhcyBhbW91bnQgMCBidXQgY2FjaGVkIHRyYW5zZmVyc1xuICAgICAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICE9PSB1bmRlZmluZWQgJiYgdHguZ2V0SXNSZWxheWVkKCkgJiYgIXR4LmdldElzRmFpbGVkKCkgJiZcbiAgICAgICAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKSAmJiB0eC5nZXRPdXRnb2luZ0Ftb3VudCgpID09PSAwbikge1xuICAgICAgICAgIGxldCBvdXRnb2luZ1RyYW5zZmVyID0gdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpO1xuICAgICAgICAgIGxldCB0cmFuc2ZlclRvdGFsID0gQmlnSW50KDApO1xuICAgICAgICAgIGZvciAobGV0IGRlc3RpbmF0aW9uIG9mIG91dGdvaW5nVHJhbnNmZXIuZ2V0RGVzdGluYXRpb25zKCkpIHRyYW5zZmVyVG90YWwgPSB0cmFuc2ZlclRvdGFsICsgZGVzdGluYXRpb24uZ2V0QW1vdW50KCk7XG4gICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFtb3VudCh0cmFuc2ZlclRvdGFsKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gbWVyZ2UgdHhcbiAgICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHNvcnQgdHhzIGJ5IGJsb2NrIGhlaWdodFxuICAgIGxldCB0eHM6IE1vbmVyb1R4V2FsbGV0W10gPSBPYmplY3QudmFsdWVzKHR4TWFwKTtcbiAgICB0eHMuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KTtcbiAgICBcbiAgICAvLyBmaWx0ZXIgYW5kIHJldHVybiB0cmFuc2ZlcnNcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBcbiAgICAgIC8vIHR4IGlzIG5vdCBpbmNvbWluZy9vdXRnb2luZyB1bmxlc3MgYWxyZWFkeSBzZXRcbiAgICAgIGlmICh0eC5nZXRJc0luY29taW5nKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNJbmNvbWluZyhmYWxzZSk7XG4gICAgICBpZiAodHguZ2V0SXNPdXRnb2luZygpID09PSB1bmRlZmluZWQpIHR4LnNldElzT3V0Z29pbmcoZmFsc2UpO1xuICAgICAgXG4gICAgICAvLyBzb3J0IGluY29taW5nIHRyYW5zZmVyc1xuICAgICAgaWYgKHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgIT09IHVuZGVmaW5lZCkgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKS5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlSW5jb21pbmdUcmFuc2ZlcnMpO1xuICAgICAgXG4gICAgICAvLyBjb2xsZWN0IHF1ZXJpZWQgdHJhbnNmZXJzLCBlcmFzZSBpZiBleGNsdWRlZFxuICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZmlsdGVyVHJhbnNmZXJzKHF1ZXJ5KSkge1xuICAgICAgICB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIHJlbW92ZSB0eHMgd2l0aG91dCByZXF1ZXN0ZWQgdHJhbnNmZXJcbiAgICAgIGlmICh0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQgJiYgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpID09PSB1bmRlZmluZWQgJiYgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHJhbnNmZXJzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0T3V0cHV0c0F1eChxdWVyeSkge1xuICAgIFxuICAgIC8vIGRldGVybWluZSBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMgdG8gYmUgcXVlcmllZFxuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpO1xuICAgIGlmIChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBuZXcgU2V0KCk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkgIT09IHVuZGVmaW5lZCkgc3ViYWRkcmVzc0luZGljZXMuYWRkKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQpIHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubWFwKHN1YmFkZHJlc3NJZHggPT4gc3ViYWRkcmVzc0luZGljZXMuYWRkKHN1YmFkZHJlc3NJZHgpKTtcbiAgICAgIGluZGljZXMuc2V0KHF1ZXJ5LmdldEFjY291bnRJbmRleCgpLCBzdWJhZGRyZXNzSW5kaWNlcy5zaXplID8gQXJyYXkuZnJvbShzdWJhZGRyZXNzSW5kaWNlcykgOiB1bmRlZmluZWQpOyAgLy8gdW5kZWZpbmVkIHdpbGwgZmV0Y2ggZnJvbSBhbGwgc3ViYWRkcmVzc2VzXG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2VydC5lcXVhbChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSwgdW5kZWZpbmVkLCBcIlF1ZXJ5IHNwZWNpZmllcyBhIHN1YmFkZHJlc3MgaW5kZXggYnV0IG5vdCBhbiBhY2NvdW50IGluZGV4XCIpXG4gICAgICBhc3NlcnQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkIHx8IHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwLCBcIlF1ZXJ5IHNwZWNpZmllcyBzdWJhZGRyZXNzIGluZGljZXMgYnV0IG5vdCBhbiBhY2NvdW50IGluZGV4XCIpO1xuICAgICAgaW5kaWNlcyA9IGF3YWl0IHRoaXMuZ2V0QWNjb3VudEluZGljZXMoKTsgIC8vIGZldGNoIGFsbCBhY2NvdW50IGluZGljZXMgd2l0aG91dCBzdWJhZGRyZXNzZXNcbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgdW5pcXVlIHR4cyBhbmQgYmxvY2tzXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgXG4gICAgLy8gY29sbGVjdCB0eHMgd2l0aCBvdXRwdXRzIGZvciBlYWNoIGluZGljYXRlZCBhY2NvdW50IHVzaW5nIGBpbmNvbWluZ190cmFuc2ZlcnNgIHJwYyBjYWxsXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLnRyYW5zZmVyX3R5cGUgPSBxdWVyeS5nZXRJc1NwZW50KCkgPT09IHRydWUgPyBcInVuYXZhaWxhYmxlXCIgOiBxdWVyeS5nZXRJc1NwZW50KCkgPT09IGZhbHNlID8gXCJhdmFpbGFibGVcIiA6IFwiYWxsXCI7XG4gICAgcGFyYW1zLnZlcmJvc2UgPSB0cnVlO1xuICAgIGZvciAobGV0IGFjY291bnRJZHggb2YgaW5kaWNlcy5rZXlzKCkpIHtcbiAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBhY2NvdW50SWR4O1xuICAgICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGluZGljZXMuZ2V0KGFjY291bnRJZHgpO1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbmNvbWluZ190cmFuc2ZlcnNcIiwgcGFyYW1zKTtcbiAgICAgIFxuICAgICAgLy8gY29udmVydCByZXNwb25zZSB0byB0eHMgd2l0aCBvdXRwdXRzIGFuZCBtZXJnZVxuICAgICAgaWYgKHJlc3AucmVzdWx0LnRyYW5zZmVycyA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcbiAgICAgIGZvciAobGV0IHJwY091dHB1dCBvZiByZXNwLnJlc3VsdC50cmFuc2ZlcnMpIHtcbiAgICAgICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdhbGxldFdpdGhPdXRwdXQocnBjT3V0cHV0KTtcbiAgICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHNvcnQgdHhzIGJ5IGJsb2NrIGhlaWdodFxuICAgIGxldCB0eHM6IE1vbmVyb1R4V2FsbGV0W10gPSBPYmplY3QudmFsdWVzKHR4TWFwKTtcbiAgICB0eHMuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHF1ZXJpZWQgb3V0cHV0c1xuICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBcbiAgICAgIC8vIHNvcnQgb3V0cHV0c1xuICAgICAgaWYgKHR4LmdldE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0eC5nZXRPdXRwdXRzKCkuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZU91dHB1dHMpO1xuICAgICAgXG4gICAgICAvLyBjb2xsZWN0IHF1ZXJpZWQgb3V0cHV0cywgZXJhc2UgaWYgZXhjbHVkZWRcbiAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5maWx0ZXJPdXRwdXRzKHF1ZXJ5KSkgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgICBcbiAgICAgIC8vIHJlbW92ZSBleGNsdWRlZCB0eHMgZnJvbSBibG9ja1xuICAgICAgaWYgKHR4LmdldE91dHB1dHMoKSA9PT0gdW5kZWZpbmVkICYmIHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0eC5nZXRCbG9jaygpLmdldFR4cygpLnNwbGljZSh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dHM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21tb24gbWV0aG9kIHRvIGdldCBrZXkgaW1hZ2VzLlxuICAgKiBcbiAgICogQHBhcmFtIGFsbCAtIHBlY2lmaWVzIHRvIGdldCBhbGwgeG9yIG9ubHkgbmV3IGltYWdlcyBmcm9tIGxhc3QgaW1wb3J0XG4gICAqIEByZXR1cm4ge01vbmVyb0tleUltYWdlW119IGFyZSB0aGUga2V5IGltYWdlc1xuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIHJwY0V4cG9ydEtleUltYWdlcyhhbGwpIHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4cG9ydF9rZXlfaW1hZ2VzXCIsIHthbGw6IGFsbH0pO1xuICAgIGlmICghcmVzcC5yZXN1bHQuc2lnbmVkX2tleV9pbWFnZXMpIHJldHVybiBbXTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmVkX2tleV9pbWFnZXMubWFwKHJwY0ltYWdlID0+IG5ldyBNb25lcm9LZXlJbWFnZShycGNJbWFnZS5rZXlfaW1hZ2UsIHJwY0ltYWdlLnNpZ25hdHVyZSkpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgcnBjU3dlZXBBY2NvdW50KGNvbmZpZykge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN3ZWVwIGNvbmZpZ1wiKTtcbiAgICBpZiAoY29uZmlnLmdldEFjY291bnRJbmRleCgpID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBhbiBhY2NvdW50IGluZGV4IHRvIHN3ZWVwIGZyb21cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGggIT0gMSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGV4YWN0bHkgb25lIGRlc3RpbmF0aW9uIHRvIHN3ZWVwIHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBkZXN0aW5hdGlvbiBhZGRyZXNzIHRvIHN3ZWVwIHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QW1vdW50KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgYW1vdW50IGluIHN3ZWVwIGNvbmZpZ1wiKTtcbiAgICBpZiAoY29uZmlnLmdldEtleUltYWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiS2V5IGltYWdlIGRlZmluZWQ7IHVzZSBzd2VlcE91dHB1dCgpIHRvIHN3ZWVwIGFuIG91dHB1dCBieSBpdHMga2V5IGltYWdlXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkICYmIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiRW1wdHkgbGlzdCBnaXZlbiBmb3Igc3ViYWRkcmVzc2VzIGluZGljZXMgdG8gc3dlZXBcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTd2VlcEVhY2hTdWJhZGRyZXNzKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzd2VlcCBlYWNoIHN1YmFkZHJlc3Mgd2l0aCBSUEMgYHN3ZWVwX2FsbGBcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJ0cmFjdEZlZUZyb20oKSAhPT0gdW5kZWZpbmVkICYmIGNvbmZpZy5nZXRTdWJ0cmFjdEZlZUZyb20oKS5sZW5ndGggPiAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTd2VlcGluZyBvdXRwdXQgZG9lcyBub3Qgc3VwcG9ydCBzdWJ0cmFjdGluZyBmZWVzIGZyb20gZGVzdGluYXRpb25zXCIpO1xuICAgIFxuICAgIC8vIHN3ZWVwIGZyb20gYWxsIHN1YmFkZHJlc3NlcyBpZiBub3Qgb3RoZXJ3aXNlIGRlZmluZWRcbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uZmlnLnNldFN1YmFkZHJlc3NJbmRpY2VzKFtdKTtcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoY29uZmlnLmdldEFjY291bnRJbmRleCgpKSkge1xuICAgICAgICBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5wdXNoKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vIHN1YmFkZHJlc3NlcyB0byBzd2VlcCBmcm9tXCIpO1xuICAgIFxuICAgIC8vIGNvbW1vbiBjb25maWcgcGFyYW1zXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgbGV0IHJlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgPT09IHRydWU7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBjb25maWcuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpO1xuICAgIHBhcmFtcy5hZGRyZXNzID0gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKTtcbiAgICBhc3NlcnQoY29uZmlnLmdldFByaW9yaXR5KCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpb3JpdHkoKSA+PSAwICYmIGNvbmZpZy5nZXRQcmlvcml0eSgpIDw9IDMpO1xuICAgIHBhcmFtcy5wcmlvcml0eSA9IGNvbmZpZy5nZXRQcmlvcml0eSgpO1xuICAgIGlmIChjb25maWcuZ2V0VW5sb2NrVGltZSgpICE9PSB1bmRlZmluZWQpIHBhcmFtcy51bmxvY2tfdGltZSA9IGNvbmZpZy5nZXRVbmxvY2tUaW1lKCk7XG4gICAgcGFyYW1zLnBheW1lbnRfaWQgPSBjb25maWcuZ2V0UGF5bWVudElkKCk7XG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9ICFyZWxheTtcbiAgICBwYXJhbXMuYmVsb3dfYW1vdW50ID0gY29uZmlnLmdldEJlbG93QW1vdW50KCk7XG4gICAgcGFyYW1zLmdldF90eF9rZXlzID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X2hleCA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9tZXRhZGF0YSA9IHRydWU7XG4gICAgXG4gICAgLy8gaW52b2tlIHdhbGxldCBycGMgYHN3ZWVwX2FsbGBcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN3ZWVwX2FsbFwiLCBwYXJhbXMpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBmcm9tIHJlc3BvbnNlXG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQsIHVuZGVmaW5lZCwgY29uZmlnKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHJlbWFpbmluZyBrbm93biBmaWVsZHNcbiAgICBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkge1xuICAgICAgdHguc2V0SXNMb2NrZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgICAgdHguc2V0UmVsYXkocmVsYXkpO1xuICAgICAgdHguc2V0SW5UeFBvb2wocmVsYXkpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHJlbGF5KTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICBsZXQgdHJhbnNmZXIgPSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgICB0cmFuc2Zlci5zZXRBY2NvdW50SW5kZXgoY29uZmlnLmdldEFjY291bnRJbmRleCgpKTtcbiAgICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDEpIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpKTtcbiAgICAgIGxldCBkZXN0aW5hdGlvbiA9IG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLCBCaWdJbnQodHJhbnNmZXIuZ2V0QW1vdW50KCkpKTtcbiAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhbZGVzdGluYXRpb25dKTtcbiAgICAgIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgICAgdHguc2V0UGF5bWVudElkKGNvbmZpZy5nZXRQYXltZW50SWQoKSk7XG4gICAgICBpZiAodHguZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQpIHR4LnNldFVubG9ja1RpbWUoY29uZmlnLmdldFVubG9ja1RpbWUoKSA9PT0gdW5kZWZpbmVkID8gMCA6IGNvbmZpZy5nZXRVbmxvY2tUaW1lKCkpO1xuICAgICAgaWYgKHR4LmdldFJlbGF5KCkpIHtcbiAgICAgICAgaWYgKHR4LmdldExhc3RSZWxheWVkVGltZXN0YW1wKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoK25ldyBEYXRlKCkuZ2V0VGltZSgpKTsgIC8vIFRPRE8gKG1vbmVyby13YWxsZXQtcnBjKTogcHJvdmlkZSB0aW1lc3RhbXAgb24gcmVzcG9uc2U7IHVuY29uZmlybWVkIHRpbWVzdGFtcHMgdmFyeVxuICAgICAgICBpZiAodHguZ2V0SXNEb3VibGVTcGVuZFNlZW4oKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0eFNldC5nZXRUeHMoKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHJlZnJlc2hMaXN0ZW5pbmcoKSB7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyID09IHVuZGVmaW5lZCAmJiB0aGlzLmxpc3RlbmVycy5sZW5ndGgpIHRoaXMud2FsbGV0UG9sbGVyID0gbmV3IFdhbGxldFBvbGxlcih0aGlzKTtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCkgdGhpcy53YWxsZXRQb2xsZXIuc2V0SXNQb2xsaW5nKHRoaXMubGlzdGVuZXJzLmxlbmd0aCA+IDApO1xuICB9XG4gIFxuICAvKipcbiAgICogUG9sbCBpZiBsaXN0ZW5pbmcuXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgcG9sbCgpIHtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndhbGxldFBvbGxlci5pc1BvbGxpbmcpIGF3YWl0IHRoaXMud2FsbGV0UG9sbGVyLnBvbGwoKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIFNUQVRJQyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IE1vbmVyb1dhbGxldENvbmZpZyB7XG4gICAgbGV0IGNvbmZpZzogdW5kZWZpbmVkIHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+ID0gdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlb2YgdXJpT3JDb25maWcgPT09IFwic3RyaW5nXCIgfHwgKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pLnVyaSkgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh7c2VydmVyOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbmZpZyBhcyBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+LCB1c2VybmFtZSwgcGFzc3dvcmQpfSk7XG4gICAgZWxzZSBpZiAoR2VuVXRpbHMuaXNBcnJheSh1cmlPckNvbmZpZykpIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoe2NtZDogdXJpT3JDb25maWcgYXMgc3RyaW5nW119KTtcbiAgICBlbHNlIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIgPT09IHVuZGVmaW5lZCkgY29uZmlnLnByb3h5VG9Xb3JrZXIgPSB0cnVlO1xuICAgIHJldHVybiBjb25maWcgYXMgTW9uZXJvV2FsbGV0Q29uZmlnO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVtb3ZlIGNyaXRlcmlhIHdoaWNoIHJlcXVpcmVzIGxvb2tpbmcgdXAgb3RoZXIgdHJhbnNmZXJzL291dHB1dHMgdG9cbiAgICogZnVsZmlsbCBxdWVyeS5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gcXVlcnkgLSB0aGUgcXVlcnkgdG8gZGVjb250ZXh0dWFsaXplXG4gICAqIEByZXR1cm4ge01vbmVyb1R4UXVlcnl9IGEgcmVmZXJlbmNlIHRvIHRoZSBxdWVyeSBmb3IgY29udmVuaWVuY2VcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZGVjb250ZXh0dWFsaXplKHF1ZXJ5KSB7XG4gICAgcXVlcnkuc2V0SXNJbmNvbWluZyh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldElzT3V0Z29pbmcodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRUcmFuc2ZlclF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0SW5wdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldE91dHB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHF1ZXJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGlzQ29udGV4dHVhbChxdWVyeSkge1xuICAgIGlmICghcXVlcnkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIXF1ZXJ5LmdldFR4UXVlcnkoKSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0SXNJbmNvbWluZygpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIHRyYW5zZmVyc1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0SXNPdXRnb2luZygpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlO1xuICAgIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb1RyYW5zZmVyUXVlcnkpIHtcbiAgICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0T3V0cHV0UXVlcnkoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciBvdXRwdXRzXG4gICAgfSBlbHNlIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb091dHB1dFF1ZXJ5KSB7XG4gICAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldFRyYW5zZmVyUXVlcnkoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciB0cmFuc2ZlcnNcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicXVlcnkgbXVzdCBiZSB0eCBvciB0cmFuc2ZlciBxdWVyeVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNBY2NvdW50KHJwY0FjY291bnQpIHtcbiAgICBsZXQgYWNjb3VudCA9IG5ldyBNb25lcm9BY2NvdW50KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0FjY291bnQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQWNjb3VudFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhY2NvdW50X2luZGV4XCIpIGFjY291bnQuc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYWxhbmNlXCIpIGFjY291bnQuc2V0QmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfYmFsYW5jZVwiKSBhY2NvdW50LnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmFzZV9hZGRyZXNzXCIpIGFjY291bnQuc2V0UHJpbWFyeUFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YWdcIikgYWNjb3VudC5zZXRUYWcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYWJlbFwiKSB7IH0gLy8gbGFiZWwgYmVsb25ncyB0byBmaXJzdCBzdWJhZGRyZXNzXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBhY2NvdW50IGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChcIlwiID09PSBhY2NvdW50LmdldFRhZygpKSBhY2NvdW50LnNldFRhZyh1bmRlZmluZWQpO1xuICAgIHJldHVybiBhY2NvdW50O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpIHtcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N1YmFkZHJlc3MpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjU3ViYWRkcmVzc1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhY2NvdW50X2luZGV4XCIpIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc19pbmRleFwiKSBzdWJhZGRyZXNzLnNldEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSBzdWJhZGRyZXNzLnNldEFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYWxhbmNlXCIpIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfYmFsYW5jZVwiKSBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX3Vuc3BlbnRfb3V0cHV0c1wiKSBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFiZWxcIikgeyBpZiAodmFsKSBzdWJhZGRyZXNzLnNldExhYmVsKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1c2VkXCIpIHN1YmFkZHJlc3Muc2V0SXNVc2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tzX3RvX3VubG9ja1wiKSBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT0gXCJ0aW1lX3RvX3VubG9ja1wiKSB7fSAgLy8gaWdub3JpbmdcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHN1YmFkZHJlc3MgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIHNlbnQgdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBUT0RPOiByZW1vdmUgY29weURlc3RpbmF0aW9ucyBhZnRlciA+MTguMy4xIHdoZW4gc3VidHJhY3RGZWVGcm9tIGZ1bGx5IHN1cHBvcnRlZFxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeENvbmZpZ30gY29uZmlnIC0gc2VuZCBjb25maWdcbiAgICogQHBhcmFtIHtNb25lcm9UeFdhbGxldH0gW3R4XSAtIGV4aXN0aW5nIHRyYW5zYWN0aW9uIHRvIGluaXRpYWxpemUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGNvcHlEZXN0aW5hdGlvbnMgLSBjb3BpZXMgY29uZmlnIGRlc3RpbmF0aW9ucyBpZiB0cnVlXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSBpcyB0aGUgaW5pdGlhbGl6ZWQgc2VuZCB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBpbml0U2VudFR4V2FsbGV0KGNvbmZpZywgdHgsIGNvcHlEZXN0aW5hdGlvbnMpIHtcbiAgICBpZiAoIXR4KSB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIGxldCByZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpID09PSB0cnVlO1xuICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgdHguc2V0SW5UeFBvb2wocmVsYXkpO1xuICAgIHR4LnNldFJlbGF5KHJlbGF5KTtcbiAgICB0eC5zZXRJc1JlbGF5ZWQocmVsYXkpO1xuICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIHR4LnNldElzTG9ja2VkKHRydWUpO1xuICAgIHR4LnNldFJpbmdTaXplKE1vbmVyb1V0aWxzLlJJTkdfU0laRSk7XG4gICAgbGV0IHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKTtcbiAgICB0cmFuc2Zlci5zZXRUeCh0eCk7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICYmIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSkgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkuc2xpY2UoMCkpOyAvLyB3ZSBrbm93IHNyYyBzdWJhZGRyZXNzIGluZGljZXMgaWZmIGNvbmZpZyBzcGVjaWZpZXMgMVxuICAgIGlmIChjb3B5RGVzdGluYXRpb25zKSB7XG4gICAgICBsZXQgZGVzdENvcGllcyA9IFtdO1xuICAgICAgZm9yIChsZXQgZGVzdCBvZiBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkpIGRlc3RDb3BpZXMucHVzaChkZXN0LmNvcHkoKSk7XG4gICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoZGVzdENvcGllcyk7XG4gICAgfVxuICAgIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgIHR4LnNldFBheW1lbnRJZChjb25maWcuZ2V0UGF5bWVudElkKCkpO1xuICAgIGlmICh0eC5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0VW5sb2NrVGltZShjb25maWcuZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQgPyAwIDogY29uZmlnLmdldFVubG9ja1RpbWUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRSZWxheSgpKSB7XG4gICAgICBpZiAodHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgrbmV3IERhdGUoKS5nZXRUaW1lKCkpOyAgLy8gVE9ETyAobW9uZXJvLXdhbGxldC1ycGMpOiBwcm92aWRlIHRpbWVzdGFtcCBvbiByZXNwb25zZTsgdW5jb25maXJtZWQgdGltZXN0YW1wcyB2YXJ5XG4gICAgICBpZiAodHguZ2V0SXNEb3VibGVTcGVuZFNlZW4oKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgdHggc2V0IGZyb20gYSBSUEMgbWFwIGV4Y2x1ZGluZyB0eHMuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjTWFwIC0gbWFwIHRvIGluaXRpYWxpemUgdGhlIHR4IHNldCBmcm9tXG4gICAqIEByZXR1cm4gTW9uZXJvVHhTZXQgLSBpbml0aWFsaXplZCB0eCBzZXRcbiAgICogQHJldHVybiB0aGUgcmVzdWx0aW5nIHR4IHNldFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhTZXQocnBjTWFwKSB7XG4gICAgbGV0IHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KCk7XG4gICAgdHhTZXQuc2V0TXVsdGlzaWdUeEhleChycGNNYXAubXVsdGlzaWdfdHhzZXQpO1xuICAgIHR4U2V0LnNldFVuc2lnbmVkVHhIZXgocnBjTWFwLnVuc2lnbmVkX3R4c2V0KTtcbiAgICB0eFNldC5zZXRTaWduZWRUeEhleChycGNNYXAuc2lnbmVkX3R4c2V0KTtcbiAgICBpZiAodHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0TXVsdGlzaWdUeEhleCh1bmRlZmluZWQpO1xuICAgIGlmICh0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCkubGVuZ3RoID09PSAwKSB0eFNldC5zZXRVbnNpZ25lZFR4SGV4KHVuZGVmaW5lZCk7XG4gICAgaWYgKHR4U2V0LmdldFNpZ25lZFR4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRTaWduZWRUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0U2lnbmVkVHhIZXgodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIE1vbmVyb1R4U2V0IGZyb20gYSBsaXN0IG9mIHJwYyB0eHMuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHhzIC0gcnBjIHR4cyB0byBpbml0aWFsaXplIHRoZSBzZXQgZnJvbVxuICAgKiBAcGFyYW0gdHhzIC0gZXhpc3RpbmcgdHhzIHRvIGZ1cnRoZXIgaW5pdGlhbGl6ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB0aGUgY29udmVydGVkIHR4IHNldFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocnBjVHhzOiBhbnksIHR4cz86IGFueSwgY29uZmlnPzogYW55KSB7XG4gICAgXG4gICAgLy8gYnVpbGQgc2hhcmVkIHR4IHNldFxuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhTZXQocnBjVHhzKTtcblxuICAgIC8vIGdldCBudW1iZXIgb2YgdHhzXG4gICAgbGV0IG51bVR4cyA9IHJwY1R4cy5mZWVfbGlzdCA/IHJwY1R4cy5mZWVfbGlzdC5sZW5ndGggOiBycGNUeHMudHhfaGFzaF9saXN0ID8gcnBjVHhzLnR4X2hhc2hfbGlzdC5sZW5ndGggOiAwO1xuICAgIFxuICAgIC8vIGRvbmUgaWYgcnBjIHJlc3BvbnNlIGNvbnRhaW5zIG5vIHR4c1xuICAgIGlmIChudW1UeHMgPT09IDApIHtcbiAgICAgIGFzc2VydC5lcXVhbCh0eHMsIHVuZGVmaW5lZCk7XG4gICAgICByZXR1cm4gdHhTZXQ7XG4gICAgfVxuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGlmIG5vbmUgZ2l2ZW5cbiAgICBpZiAodHhzKSB0eFNldC5zZXRUeHModHhzKTtcbiAgICBlbHNlIHtcbiAgICAgIHR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UeHM7IGkrKykgdHhzLnB1c2gobmV3IE1vbmVyb1R4V2FsbGV0KCkpO1xuICAgIH1cbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIHR4LnNldFR4U2V0KHR4U2V0KTtcbiAgICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgfVxuICAgIHR4U2V0LnNldFR4cyh0eHMpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGZyb20gcnBjIGxpc3RzXG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1R4cykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUeHNba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhfaGFzaF9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0SGFzaCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2tleV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0S2V5KHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfYmxvYl9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0RnVsbEhleCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X21ldGFkYXRhX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRNZXRhZGF0YSh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0RmVlKEJpZ0ludCh2YWxbaV0pKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldFdlaWdodCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9saXN0XCIpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAodHhzW2ldLmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PSB1bmRlZmluZWQpIHR4c1tpXS5zZXRPdXRnb2luZ1RyYW5zZmVyKG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHhzW2ldKSk7XG4gICAgICAgICAgdHhzW2ldLmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBbW91bnQoQmlnSW50KHZhbFtpXSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibXVsdGlzaWdfdHhzZXRcIiB8fCBrZXkgPT09IFwidW5zaWduZWRfdHhzZXRcIiB8fCBrZXkgPT09IFwic2lnbmVkX3R4c2V0XCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlbnRfa2V5X2ltYWdlc19saXN0XCIpIHtcbiAgICAgICAgbGV0IGlucHV0S2V5SW1hZ2VzTGlzdCA9IHZhbDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dEtleUltYWdlc0xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR4c1tpXS5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgICB0eHNbaV0uc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgICBmb3IgKGxldCBpbnB1dEtleUltYWdlIG9mIGlucHV0S2V5SW1hZ2VzTGlzdFtpXVtcImtleV9pbWFnZXNcIl0pIHtcbiAgICAgICAgICAgIHR4c1tpXS5nZXRJbnB1dHMoKS5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKS5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UoKS5zZXRIZXgoaW5wdXRLZXlJbWFnZSkpLnNldFR4KHR4c1tpXSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNfYnlfZGVzdF9saXN0XCIpIHtcbiAgICAgICAgbGV0IGFtb3VudHNCeURlc3RMaXN0ID0gdmFsO1xuICAgICAgICBsZXQgZGVzdGluYXRpb25JZHggPSAwO1xuICAgICAgICBmb3IgKGxldCB0eElkeCA9IDA7IHR4SWR4IDwgYW1vdW50c0J5RGVzdExpc3QubGVuZ3RoOyB0eElkeCsrKSB7XG4gICAgICAgICAgbGV0IGFtb3VudHNCeURlc3QgPSBhbW91bnRzQnlEZXN0TGlzdFt0eElkeF1bXCJhbW91bnRzXCJdO1xuICAgICAgICAgIGlmICh0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PT0gdW5kZWZpbmVkKSB0eHNbdHhJZHhdLnNldE91dGdvaW5nVHJhbnNmZXIobmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eHNbdHhJZHhdKSk7XG4gICAgICAgICAgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0RGVzdGluYXRpb25zKFtdKTtcbiAgICAgICAgICBmb3IgKGxldCBhbW91bnQgb2YgYW1vdW50c0J5RGVzdCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGggPT09IDEpIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnQpKSk7IC8vIHN3ZWVwaW5nIGNhbiBjcmVhdGUgbXVsdGlwbGUgdHhzIHdpdGggb25lIGFkZHJlc3NcbiAgICAgICAgICAgIGVsc2UgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpW2Rlc3RpbmF0aW9uSWR4KytdLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudCkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHRyYW5zYWN0aW9uIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgcnBjIHR4IHdpdGggYSB0cmFuc2ZlciB0byBhIHR4IHNldCB3aXRoIGEgdHggYW5kIHRyYW5zZmVyLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4IC0gcnBjIHR4IHRvIGJ1aWxkIGZyb21cbiAgICogQHBhcmFtIHR4IC0gZXhpc3RpbmcgdHggdG8gY29udGludWUgaW5pdGlhbGl6aW5nIChvcHRpb25hbClcbiAgICogQHBhcmFtIGlzT3V0Z29pbmcgLSBzcGVjaWZpZXMgaWYgdGhlIHR4IGlzIG91dGdvaW5nIGlmIHRydWUsIGluY29taW5nIGlmIGZhbHNlLCBvciBkZWNvZGVzIGZyb20gdHlwZSBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHRoZSBpbml0aWFsaXplZCB0eCBzZXQgd2l0aCBhIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFRvVHhTZXQocnBjVHgsIHR4LCBpc091dGdvaW5nLCBjb25maWcpIHtcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4U2V0KHJwY1R4KTtcbiAgICB0eFNldC5zZXRUeHMoW01vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHgsIHR4LCBpc091dGdvaW5nLCBjb25maWcpLnNldFR4U2V0KHR4U2V0KV0pO1xuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEJ1aWxkcyBhIE1vbmVyb1R4V2FsbGV0IGZyb20gYSBSUEMgdHguXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHggLSBycGMgdHggdG8gYnVpbGQgZnJvbVxuICAgKiBAcGFyYW0gdHggLSBleGlzdGluZyB0eCB0byBjb250aW51ZSBpbml0aWFsaXppbmcgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gaXNPdXRnb2luZyAtIHNwZWNpZmllcyBpZiB0aGUgdHggaXMgb3V0Z29pbmcgaWYgdHJ1ZSwgaW5jb21pbmcgaWYgZmFsc2UsIG9yIGRlY29kZXMgZnJvbSB0eXBlIGlmIHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSBpcyB0aGUgaW5pdGlhbGl6ZWQgdHhcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4OiBhbnksIHR4PzogYW55LCBpc091dGdvaW5nPzogYW55LCBjb25maWc/OiBhbnkpIHsgIC8vIFRPRE86IGNoYW5nZSBldmVyeXRoaW5nIHRvIHNhZmUgc2V0XG4gICAgICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggdG8gcmV0dXJuXG4gICAgaWYgKCF0eCkgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHN0YXRlIGZyb20gcnBjIHR5cGVcbiAgICBpZiAocnBjVHgudHlwZSAhPT0gdW5kZWZpbmVkKSBpc091dGdvaW5nID0gTW9uZXJvV2FsbGV0UnBjLmRlY29kZVJwY1R5cGUocnBjVHgudHlwZSwgdHgpO1xuICAgIGVsc2UgYXNzZXJ0LmVxdWFsKHR5cGVvZiBpc091dGdvaW5nLCBcImJvb2xlYW5cIiwgXCJNdXN0IGluZGljYXRlIGlmIHR4IGlzIG91dGdvaW5nICh0cnVlKSB4b3IgaW5jb21pbmcgKGZhbHNlKSBzaW5jZSB1bmtub3duXCIpO1xuICAgIFxuICAgIC8vIFRPRE86IHNhZmUgc2V0XG4gICAgLy8gaW5pdGlhbGl6ZSByZW1haW5pbmcgZmllbGRzICBUT0RPOiBzZWVtcyB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGNvbW1vbiBmdW5jdGlvbiB3aXRoIERhZW1vblJwYy5jb252ZXJ0UnBjVHhcbiAgICBsZXQgaGVhZGVyO1xuICAgIGxldCB0cmFuc2ZlcjtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVHgpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVHhba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhpZFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlXCIpIHR4LnNldEZlZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm90ZVwiKSB7IGlmICh2YWwpIHR4LnNldE5vdGUodmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2tleVwiKSB0eC5zZXRLZXkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eXBlXCIpIHsgfSAvLyB0eXBlIGFscmVhZHkgaGFuZGxlZFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X3NpemVcIikgdHguc2V0U2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja190aW1lXCIpIHR4LnNldFVubG9ja1RpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRcIikgdHguc2V0V2VpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9ja2VkXCIpIHR4LnNldElzTG9ja2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfYmxvYlwiKSB0eC5zZXRGdWxsSGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfbWV0YWRhdGFcIikgdHguc2V0TWV0YWRhdGEodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkb3VibGVfc3BlbmRfc2VlblwiKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2Vlbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiIHx8IGtleSA9PT0gXCJoZWlnaHRcIikge1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgICBoZWFkZXIuc2V0SGVpZ2h0KHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0aW1lc3RhbXBcIikge1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgICBoZWFkZXIuc2V0VGltZXN0YW1wKHZhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gdGltZXN0YW1wIG9mIHVuY29uZmlybWVkIHR4IGlzIGN1cnJlbnQgcmVxdWVzdCB0aW1lXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjb25maXJtYXRpb25zXCIpIHR4LnNldE51bUNvbmZpcm1hdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWdnZXN0ZWRfY29uZmlybWF0aW9uc190aHJlc2hvbGRcIikge1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIGlmICghaXNPdXRnb2luZykgdHJhbnNmZXIuc2V0TnVtU3VnZ2VzdGVkQ29uZmlybWF0aW9ucyh2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudFwiKSB7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzXCIpIHt9ICAvLyBpZ25vcmluZywgYW1vdW50cyBzdW0gdG8gYW1vdW50XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSB7XG4gICAgICAgIGlmICghaXNPdXRnb2luZykge1xuICAgICAgICAgIGlmICghdHJhbnNmZXIpIHRyYW5zZmVyID0gbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKS5zZXRUeCh0eCk7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGF5bWVudF9pZFwiKSB7XG4gICAgICAgIGlmIChcIlwiICE9PSB2YWwgJiYgTW9uZXJvVHhXYWxsZXQuREVGQVVMVF9QQVlNRU5UX0lEICE9PSB2YWwpIHR4LnNldFBheW1lbnRJZCh2YWwpOyAgLy8gZGVmYXVsdCBpcyB1bmRlZmluZWRcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGV4XCIpIGFzc2VydChycGNUeC5zdWJhZGRyX2luZGljZXMpOyAgLy8gaGFuZGxlZCBieSBzdWJhZGRyX2luZGljZXNcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGljZXNcIikge1xuICAgICAgICBpZiAoIXRyYW5zZmVyKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgbGV0IHJwY0luZGljZXMgPSB2YWw7XG4gICAgICAgIHRyYW5zZmVyLnNldEFjY291bnRJbmRleChycGNJbmRpY2VzWzBdLm1ham9yKTtcbiAgICAgICAgaWYgKGlzT3V0Z29pbmcpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgICBmb3IgKGxldCBycGNJbmRleCBvZiBycGNJbmRpY2VzKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKHJwY0luZGV4Lm1pbm9yKTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kaWNlcyhzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsKHJwY0luZGljZXMubGVuZ3RoLCAxKTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kZXgocnBjSW5kaWNlc1swXS5taW5vcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkZXN0aW5hdGlvbnNcIiB8fCBrZXkgPT0gXCJyZWNpcGllbnRzXCIpIHtcbiAgICAgICAgYXNzZXJ0KGlzT3V0Z29pbmcpO1xuICAgICAgICBsZXQgZGVzdGluYXRpb25zID0gW107XG4gICAgICAgIGZvciAobGV0IHJwY0Rlc3RpbmF0aW9uIG9mIHZhbCkge1xuICAgICAgICAgIGxldCBkZXN0aW5hdGlvbiA9IG5ldyBNb25lcm9EZXN0aW5hdGlvbigpO1xuICAgICAgICAgIGRlc3RpbmF0aW9ucy5wdXNoKGRlc3RpbmF0aW9uKTtcbiAgICAgICAgICBmb3IgKGxldCBkZXN0aW5hdGlvbktleSBvZiBPYmplY3Qua2V5cyhycGNEZXN0aW5hdGlvbikpIHtcbiAgICAgICAgICAgIGlmIChkZXN0aW5hdGlvbktleSA9PT0gXCJhZGRyZXNzXCIpIGRlc3RpbmF0aW9uLnNldEFkZHJlc3MocnBjRGVzdGluYXRpb25bZGVzdGluYXRpb25LZXldKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKGRlc3RpbmF0aW9uS2V5ID09PSBcImFtb3VudFwiKSBkZXN0aW5hdGlvbi5zZXRBbW91bnQoQmlnSW50KHJwY0Rlc3RpbmF0aW9uW2Rlc3RpbmF0aW9uS2V5XSkpO1xuICAgICAgICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNhY3Rpb24gZGVzdGluYXRpb24gZmllbGQ6IFwiICsgZGVzdGluYXRpb25LZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2Zlcih7dHg6IHR4fSk7XG4gICAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhkZXN0aW5hdGlvbnMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm11bHRpc2lnX3R4c2V0XCIgJiYgdmFsICE9PSB1bmRlZmluZWQpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlOyB0aGlzIG1ldGhvZCBvbmx5IGJ1aWxkcyBhIHR4IHdhbGxldFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVuc2lnbmVkX3R4c2V0XCIgJiYgdmFsICE9PSB1bmRlZmluZWQpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlOyB0aGlzIG1ldGhvZCBvbmx5IGJ1aWxkcyBhIHR4IHdhbGxldFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9pblwiKSB0eC5zZXRJbnB1dFN1bShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50X291dFwiKSB0eC5zZXRPdXRwdXRTdW0oQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNoYW5nZV9hZGRyZXNzXCIpIHR4LnNldENoYW5nZUFkZHJlc3ModmFsID09PSBcIlwiID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjaGFuZ2VfYW1vdW50XCIpIHR4LnNldENoYW5nZUFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZHVtbXlfb3V0cHV0c1wiKSB0eC5zZXROdW1EdW1teU91dHB1dHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJleHRyYVwiKSB0eC5zZXRFeHRyYUhleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJpbmdfc2l6ZVwiKSB0eC5zZXRSaW5nU2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50X2tleV9pbWFnZXNcIikge1xuICAgICAgICBsZXQgaW5wdXRLZXlJbWFnZXMgPSB2YWwua2V5X2ltYWdlcztcbiAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZSh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdHguc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgZm9yIChsZXQgaW5wdXRLZXlJbWFnZSBvZiBpbnB1dEtleUltYWdlcykge1xuICAgICAgICAgIHR4LmdldElucHV0cygpLnB1c2gobmV3IE1vbmVyb091dHB1dFdhbGxldCgpLnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSgpLnNldEhleChpbnB1dEtleUltYWdlKSkuc2V0VHgodHgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNfYnlfZGVzdFwiKSB7XG4gICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUoaXNPdXRnb2luZyk7XG4gICAgICAgIGxldCBhbW91bnRzQnlEZXN0ID0gdmFsLmFtb3VudHM7XG4gICAgICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoLCBhbW91bnRzQnlEZXN0Lmxlbmd0aCk7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHgpO1xuICAgICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoW10pO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHRyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVtpXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnRzQnlEZXN0W2ldKSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZCB3aXRoIHRyYW5zZmVyOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGxpbmsgYmxvY2sgYW5kIHR4XG4gICAgaWYgKGhlYWRlcikgdHguc2V0QmxvY2sobmV3IE1vbmVyb0Jsb2NrKGhlYWRlcikuc2V0VHhzKFt0eF0pKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIGZpbmFsIGZpZWxkc1xuICAgIGlmICh0cmFuc2Zlcikge1xuICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgaWYgKCF0cmFuc2Zlci5nZXRUeCgpLmdldElzQ29uZmlybWVkKCkpIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICBpZiAoaXNPdXRnb2luZykge1xuICAgICAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgICAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpKSB7XG4gICAgICAgICAgaWYgKHRyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpKSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0RGVzdGluYXRpb25zKHVuZGVmaW5lZCk7IC8vIG92ZXJ3cml0ZSB0byBhdm9pZCByZWNvbmNpbGUgZXJyb3IgVE9ETzogcmVtb3ZlIGFmdGVyID4xOC4zLjEgd2hlbiBhbW91bnRzX2J5X2Rlc3Qgc3VwcG9ydGVkXG4gICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLm1lcmdlKHRyYW5zZmVyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHguc2V0SXNJbmNvbWluZyh0cnVlKTtcbiAgICAgICAgdHguc2V0SW5jb21pbmdUcmFuc2ZlcnMoW3RyYW5zZmVyXSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHJldHVybiBpbml0aWFsaXplZCB0cmFuc2FjdGlvblxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhXYWxsZXRXaXRoT3V0cHV0KHJwY091dHB1dCkge1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhcbiAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoe3R4OiB0eH0pO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNPdXRwdXQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjT3V0cHV0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFtb3VudFwiKSBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGVudFwiKSBvdXRwdXQuc2V0SXNTcGVudCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImtleV9pbWFnZVwiKSB7IGlmIChcIlwiICE9PSB2YWwpIG91dHB1dC5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UodmFsKSk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJnbG9iYWxfaW5kZXhcIikgb3V0cHV0LnNldEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRcIikgdHguc2V0SXNMb2NrZWQoIXZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZnJvemVuXCIpIG91dHB1dC5zZXRJc0Zyb3plbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInB1YmtleVwiKSBvdXRwdXQuc2V0U3RlYWx0aFB1YmxpY0tleSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1YmFkZHJfaW5kZXhcIikge1xuICAgICAgICBvdXRwdXQuc2V0QWNjb3VudEluZGV4KHZhbC5tYWpvcik7XG4gICAgICAgIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgodmFsLm1pbm9yKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oZWlnaHRcIikgdHguc2V0QmxvY2soKG5ldyBNb25lcm9CbG9jaygpLnNldEhlaWdodCh2YWwpIGFzIE1vbmVyb0Jsb2NrKS5zZXRUeHMoW3R4IGFzIE1vbmVyb1R4XSkpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgdHJhbnNhY3Rpb24gZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCB3aXRoIG91dHB1dFxuICAgIHR4LnNldE91dHB1dHMoW291dHB1dF0pO1xuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlcihycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0KSB7XG4gICAgbGV0IHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJkZXNjXCIpIHtcbiAgICAgICAgdHhTZXQuc2V0VHhzKFtdKTtcbiAgICAgICAgZm9yIChsZXQgdHhNYXAgb2YgdmFsKSB7XG4gICAgICAgICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhUcmFuc2Zlcih0eE1hcCwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgICB0eC5zZXRUeFNldCh0eFNldCk7XG4gICAgICAgICAgdHhTZXQuZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdW1tYXJ5XCIpIHsgfSAvLyBUT0RPOiBzdXBwb3J0IHR4IHNldCBzdW1tYXJ5IGZpZWxkcz9cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGRlc2NkcmliZSB0cmFuc2ZlciBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZWNvZGVzIGEgXCJ0eXBlXCIgZnJvbSBtb25lcm8td2FsbGV0LXJwYyB0byBpbml0aWFsaXplIHR5cGUgYW5kIHN0YXRlXG4gICAqIGZpZWxkcyBpbiB0aGUgZ2l2ZW4gdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBUT0RPOiB0aGVzZSBzaG91bGQgYmUgc2FmZSBzZXRcbiAgICogXG4gICAqIEBwYXJhbSBycGNUeXBlIGlzIHRoZSB0eXBlIHRvIGRlY29kZVxuICAgKiBAcGFyYW0gdHggaXMgdGhlIHRyYW5zYWN0aW9uIHRvIGRlY29kZSBrbm93biBmaWVsZHMgdG9cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgcnBjIHR5cGUgaW5kaWNhdGVzIG91dGdvaW5nIHhvciBpbmNvbWluZ1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBkZWNvZGVScGNUeXBlKHJwY1R5cGUsIHR4KSB7XG4gICAgbGV0IGlzT3V0Z29pbmc7XG4gICAgaWYgKHJwY1R5cGUgPT09IFwiaW5cIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcIm91dFwiKSB7XG4gICAgICBpc091dGdvaW5nID0gdHJ1ZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJwb29sXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSBmYWxzZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKHRydWUpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpOyAgLy8gVE9ETzogYnV0IGNvdWxkIGl0IGJlP1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJwZW5kaW5nXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcImJsb2NrXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSBmYWxzZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgodHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcImZhaWxlZFwiKSB7XG4gICAgICBpc091dGdvaW5nID0gdHJ1ZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNmZXIgdHlwZTogXCIgKyBycGNUeXBlKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzT3V0Z29pbmc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNZXJnZXMgYSB0cmFuc2FjdGlvbiBpbnRvIGEgdW5pcXVlIHNldCBvZiB0cmFuc2FjdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhXYWxsZXR9IHR4IC0gdGhlIHRyYW5zYWN0aW9uIHRvIG1lcmdlIGludG8gdGhlIGV4aXN0aW5nIHR4c1xuICAgKiBAcGFyYW0ge09iamVjdH0gdHhNYXAgLSBtYXBzIHR4IGhhc2hlcyB0byB0eHNcbiAgICogQHBhcmFtIHtPYmplY3R9IGJsb2NrTWFwIC0gbWFwcyBibG9jayBoZWlnaHRzIHRvIGJsb2Nrc1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBtZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApIHtcbiAgICBhc3NlcnQodHguZ2V0SGFzaCgpICE9PSB1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIG1lcmdlIHR4XG4gICAgbGV0IGFUeCA9IHR4TWFwW3R4LmdldEhhc2goKV07XG4gICAgaWYgKGFUeCA9PT0gdW5kZWZpbmVkKSB0eE1hcFt0eC5nZXRIYXNoKCldID0gdHg7IC8vIGNhY2hlIG5ldyB0eFxuICAgIGVsc2UgYVR4Lm1lcmdlKHR4KTsgLy8gbWVyZ2Ugd2l0aCBleGlzdGluZyB0eFxuICAgIFxuICAgIC8vIG1lcmdlIHR4J3MgYmxvY2sgaWYgY29uZmlybWVkXG4gICAgaWYgKHR4LmdldEhlaWdodCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBhQmxvY2sgPSBibG9ja01hcFt0eC5nZXRIZWlnaHQoKV07XG4gICAgICBpZiAoYUJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrTWFwW3R4LmdldEhlaWdodCgpXSA9IHR4LmdldEJsb2NrKCk7IC8vIGNhY2hlIG5ldyBibG9ja1xuICAgICAgZWxzZSBhQmxvY2subWVyZ2UodHguZ2V0QmxvY2soKSk7IC8vIG1lcmdlIHdpdGggZXhpc3RpbmcgYmxvY2tcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNhY3Rpb25zIGJ5IHRoZWlyIGhlaWdodC5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29tcGFyZVR4c0J5SGVpZ2h0KHR4MSwgdHgyKSB7XG4gICAgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4Mi5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMDsgLy8gYm90aCB1bmNvbmZpcm1lZFxuICAgIGVsc2UgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMTsgICAvLyB0eDEgaXMgdW5jb25maXJtZWRcbiAgICBlbHNlIGlmICh0eDIuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIC0xOyAgLy8gdHgyIGlzIHVuY29uZmlybWVkXG4gICAgbGV0IGRpZmYgPSB0eDEuZ2V0SGVpZ2h0KCkgLSB0eDIuZ2V0SGVpZ2h0KCk7XG4gICAgaWYgKGRpZmYgIT09IDApIHJldHVybiBkaWZmO1xuICAgIHJldHVybiB0eDEuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4MSkgLSB0eDIuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4Mik7IC8vIHR4cyBhcmUgaW4gdGhlIHNhbWUgYmxvY2sgc28gcmV0YWluIHRoZWlyIG9yaWdpbmFsIG9yZGVyXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNmZXJzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBzdGF0aWMgY29tcGFyZUluY29taW5nVHJhbnNmZXJzKHQxLCB0Mikge1xuICAgIGlmICh0MS5nZXRBY2NvdW50SW5kZXgoKSA8IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gLTE7XG4gICAgZWxzZSBpZiAodDEuZ2V0QWNjb3VudEluZGV4KCkgPT09IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gdDEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSB0Mi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICByZXR1cm4gMTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byBvdXRwdXRzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbXBhcmVPdXRwdXRzKG8xLCBvMikge1xuICAgIFxuICAgIC8vIGNvbXBhcmUgYnkgaGVpZ2h0XG4gICAgbGV0IGhlaWdodENvbXBhcmlzb24gPSBNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KG8xLmdldFR4KCksIG8yLmdldFR4KCkpO1xuICAgIGlmIChoZWlnaHRDb21wYXJpc29uICE9PSAwKSByZXR1cm4gaGVpZ2h0Q29tcGFyaXNvbjtcbiAgICBcbiAgICAvLyBjb21wYXJlIGJ5IGFjY291bnQgaW5kZXgsIHN1YmFkZHJlc3MgaW5kZXgsIG91dHB1dCBpbmRleCwgdGhlbiBrZXkgaW1hZ2UgaGV4XG4gICAgbGV0IGNvbXBhcmUgPSBvMS5nZXRBY2NvdW50SW5kZXgoKSAtIG8yLmdldEFjY291bnRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICBjb21wYXJlID0gbzEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSBvMi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICBpZiAoY29tcGFyZSAhPT0gMCkgcmV0dXJuIGNvbXBhcmU7XG4gICAgY29tcGFyZSA9IG8xLmdldEluZGV4KCkgLSBvMi5nZXRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICByZXR1cm4gbzEuZ2V0S2V5SW1hZ2UoKS5nZXRIZXgoKS5sb2NhbGVDb21wYXJlKG8yLmdldEtleUltYWdlKCkuZ2V0SGV4KCkpO1xuICB9XG59XG5cbi8qKlxuICogUG9sbHMgbW9uZXJvLXdhbGxldC1ycGMgdG8gcHJvdmlkZSBsaXN0ZW5lciBub3RpZmljYXRpb25zLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRQb2xsZXIge1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBpc1BvbGxpbmc6IGJvb2xlYW47XG4gIHByb3RlY3RlZCB3YWxsZXQ6IE1vbmVyb1dhbGxldFJwYztcbiAgcHJvdGVjdGVkIGxvb3BlcjogVGFza0xvb3BlcjtcbiAgcHJvdGVjdGVkIHByZXZMb2NrZWRUeHM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZDb25maXJtZWROb3RpZmljYXRpb25zOiBhbnk7XG4gIHByb3RlY3RlZCB0aHJlYWRQb29sOiBhbnk7XG4gIHByb3RlY3RlZCBudW1Qb2xsaW5nOiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2SGVpZ2h0OiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2QmFsYW5jZXM6IGFueTtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICB0aGlzLndhbGxldCA9IHdhbGxldDtcbiAgICB0aGlzLmxvb3BlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jIGZ1bmN0aW9uKCkgeyBhd2FpdCB0aGF0LnBvbGwoKTsgfSk7XG4gICAgdGhpcy5wcmV2TG9ja2VkVHhzID0gW107XG4gICAgdGhpcy5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zID0gbmV3IFNldCgpOyAvLyB0eCBoYXNoZXMgb2YgcHJldmlvdXMgbm90aWZpY2F0aW9uc1xuICAgIHRoaXMucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMgPSBuZXcgU2V0KCk7IC8vIHR4IGhhc2hlcyBvZiBwcmV2aW91c2x5IGNvbmZpcm1lZCBidXQgbm90IHlldCB1bmxvY2tlZCBub3RpZmljYXRpb25zXG4gICAgdGhpcy50aHJlYWRQb29sID0gbmV3IFRocmVhZFBvb2woMSk7IC8vIHN5bmNocm9uaXplIHBvbGxzXG4gICAgdGhpcy5udW1Qb2xsaW5nID0gMDtcbiAgfVxuICBcbiAgc2V0SXNQb2xsaW5nKGlzUG9sbGluZykge1xuICAgIHRoaXMuaXNQb2xsaW5nID0gaXNQb2xsaW5nO1xuICAgIGlmIChpc1BvbGxpbmcpIHRoaXMubG9vcGVyLnN0YXJ0KHRoaXMud2FsbGV0LmdldFN5bmNQZXJpb2RJbk1zKCkpO1xuICAgIGVsc2UgdGhpcy5sb29wZXIuc3RvcCgpO1xuICB9XG4gIFxuICBzZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpIHtcbiAgICB0aGlzLmxvb3Blci5zZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpO1xuICB9XG4gIFxuICBhc3luYyBwb2xsKCkge1xuXG4gICAgLy8gc2tpcCBpZiBuZXh0IHBvbGwgaXMgcXVldWVkXG4gICAgaWYgKHRoaXMubnVtUG9sbGluZyA+IDEpIHJldHVybjtcbiAgICB0aGlzLm51bVBvbGxpbmcrKztcbiAgICBcbiAgICAvLyBzeW5jaHJvbml6ZSBwb2xsc1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICByZXR1cm4gdGhpcy50aHJlYWRQb29sLnN1Ym1pdChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIFxuICAgICAgICAvLyBza2lwIGlmIHdhbGxldCBpcyBjbG9zZWRcbiAgICAgICAgaWYgKGF3YWl0IHRoYXQud2FsbGV0LmlzQ2xvc2VkKCkpIHtcbiAgICAgICAgICB0aGF0Lm51bVBvbGxpbmctLTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHRha2UgaW5pdGlhbCBzbmFwc2hvdFxuICAgICAgICBpZiAodGhhdC5wcmV2QmFsYW5jZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEhlaWdodCgpO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpKTtcbiAgICAgICAgICB0aGF0LnByZXZCYWxhbmNlcyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBoZWlnaHQgY2hhbmdlc1xuICAgICAgICBsZXQgaGVpZ2h0ID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0SGVpZ2h0KCk7XG4gICAgICAgIGlmICh0aGF0LnByZXZIZWlnaHQgIT09IGhlaWdodCkge1xuICAgICAgICAgIGZvciAobGV0IGkgPSB0aGF0LnByZXZIZWlnaHQ7IGkgPCBoZWlnaHQ7IGkrKykgYXdhaXQgdGhhdC5vbk5ld0Jsb2NrKGkpO1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gZ2V0IGxvY2tlZCB0eHMgZm9yIGNvbXBhcmlzb24gdG8gcHJldmlvdXNcbiAgICAgICAgbGV0IG1pbkhlaWdodCA9IE1hdGgubWF4KDAsIGhlaWdodCAtIDcwKTsgLy8gb25seSBtb25pdG9yIHJlY2VudCB0eHNcbiAgICAgICAgbGV0IGxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEluY2x1ZGVPdXRwdXRzKHRydWUpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbGxlY3QgaGFzaGVzIG9mIHR4cyBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCBub0xvbmdlckxvY2tlZEhhc2hlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBwcmV2TG9ja2VkVHggb2YgdGhhdC5wcmV2TG9ja2VkVHhzKSB7XG4gICAgICAgICAgaWYgKHRoYXQuZ2V0VHgobG9ja2VkVHhzLCBwcmV2TG9ja2VkVHguZ2V0SGFzaCgpKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBub0xvbmdlckxvY2tlZEhhc2hlcy5wdXNoKHByZXZMb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gc2F2ZSBsb2NrZWQgdHhzIGZvciBuZXh0IGNvbXBhcmlzb25cbiAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzID0gbG9ja2VkVHhzO1xuICAgICAgICBcbiAgICAgICAgLy8gZmV0Y2ggdHhzIHdoaWNoIGFyZSBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCB1bmxvY2tlZFR4cyA9IG5vTG9uZ2VyTG9ja2VkSGFzaGVzLmxlbmd0aCA9PT0gMCA/IFtdIDogYXdhaXQgdGhhdC53YWxsZXQuZ2V0VHhzKG5ldyBNb25lcm9UeFF1ZXJ5KCkuc2V0SXNMb2NrZWQoZmFsc2UpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEhhc2hlcyhub0xvbmdlckxvY2tlZEhhc2hlcykuc2V0SW5jbHVkZU91dHB1dHModHJ1ZSkpO1xuICAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIG5ldyB1bmNvbmZpcm1lZCBhbmQgY29uZmlybWVkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgbG9ja2VkVHggb2YgbG9ja2VkVHhzKSB7XG4gICAgICAgICAgbGV0IHNlYXJjaFNldCA9IGxvY2tlZFR4LmdldElzQ29uZmlybWVkKCkgPyB0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zIDogdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zO1xuICAgICAgICAgIGxldCB1bmFubm91bmNlZCA9ICFzZWFyY2hTZXQuaGFzKGxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgc2VhcmNoU2V0LmFkZChsb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIGlmICh1bmFubm91bmNlZCkgYXdhaXQgdGhhdC5ub3RpZnlPdXRwdXRzKGxvY2tlZFR4KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgbmV3IHVubG9ja2VkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgdW5sb2NrZWRUeCBvZiB1bmxvY2tlZFR4cykge1xuICAgICAgICAgIHRoYXQucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucy5kZWxldGUodW5sb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIHRoYXQucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMuZGVsZXRlKHVubG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHModW5sb2NrZWRUeCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIGJhbGFuY2UgY2hhbmdlc1xuICAgICAgICBhd2FpdCB0aGF0LmNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzKCk7XG4gICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gYmFja2dyb3VuZCBwb2xsIHdhbGxldCAnXCIgKyBhd2FpdCB0aGF0LndhbGxldC5nZXRQYXRoKCkgKyBcIic6IFwiICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgb25OZXdCbG9jayhoZWlnaHQpIHtcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU5ld0Jsb2NrKGhlaWdodCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBub3RpZnlPdXRwdXRzKHR4KSB7XG4gIFxuICAgIC8vIG5vdGlmeSBzcGVudCBvdXRwdXRzIC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogbW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgYWxsb3cgc2NyYXBlIG9mIHR4IGlucHV0cyBzbyBwcm92aWRpbmcgb25lIGlucHV0IHdpdGggb3V0Z29pbmcgYW1vdW50XG4gICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQodHguZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCgpXG4gICAgICAgICAgLnNldEFtb3VudCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkgKyB0eC5nZXRGZWUoKSlcbiAgICAgICAgICAuc2V0QWNjb3VudEluZGV4KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBY2NvdW50SW5kZXgoKSlcbiAgICAgICAgICAuc2V0U3ViYWRkcmVzc0luZGV4KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSA/IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpWzBdIDogdW5kZWZpbmVkKSAvLyBpbml0aWFsaXplIGlmIHRyYW5zZmVyIHNvdXJjZWQgZnJvbSBzaW5nbGUgc3ViYWRkcmVzc1xuICAgICAgICAgIC5zZXRUeCh0eCk7XG4gICAgICB0eC5zZXRJbnB1dHMoW291dHB1dF0pO1xuICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRTcGVudChvdXRwdXQpO1xuICAgIH1cbiAgICBcbiAgICAvLyBub3RpZnkgcmVjZWl2ZWQgb3V0cHV0c1xuICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRPdXRwdXRzKCkubGVuZ3RoID4gMCkgeyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG91dHB1dHMgb25seSByZXR1cm5lZCBmb3IgY29uZmlybWVkIHR4c1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgeyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGFsbG93IHNjcmFwZSBvZiB1bmNvbmZpcm1lZCByZWNlaXZlZCBvdXRwdXRzIHNvIHVzaW5nIGluY29taW5nIHRyYW5zZmVyIHZhbHVlc1xuICAgICAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB7XG4gICAgICAgICAgb3V0cHV0cy5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKVxuICAgICAgICAgICAgICAuc2V0QWNjb3VudEluZGV4KHRyYW5zZmVyLmdldEFjY291bnRJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0U3ViYWRkcmVzc0luZGV4KHRyYW5zZmVyLmdldFN1YmFkZHJlc3NJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0QW1vdW50KHRyYW5zZmVyLmdldEFtb3VudCgpKVxuICAgICAgICAgICAgICAuc2V0VHgodHgpKTtcbiAgICAgICAgfVxuICAgICAgICB0eC5zZXRPdXRwdXRzKG91dHB1dHMpO1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgZ2V0VHgodHhzLCB0eEhhc2gpIHtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIGlmICh0eEhhc2ggPT09IHR4LmdldEhhc2goKSkgcmV0dXJuIHR4O1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjaGVja0ZvckNoYW5nZWRCYWxhbmNlcygpIHtcbiAgICBsZXQgYmFsYW5jZXMgPSBhd2FpdCB0aGlzLndhbGxldC5nZXRCYWxhbmNlcygpO1xuICAgIGlmIChiYWxhbmNlc1swXSAhPT0gdGhpcy5wcmV2QmFsYW5jZXNbMF0gfHwgYmFsYW5jZXNbMV0gIT09IHRoaXMucHJldkJhbGFuY2VzWzFdKSB7XG4gICAgICB0aGlzLnByZXZCYWxhbmNlcyA9IGJhbGFuY2VzO1xuICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQoYmFsYW5jZXNbMF0sIGJhbGFuY2VzWzFdKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGFBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFdBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLGNBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLGlCQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSx1QkFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sWUFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsa0JBQUEsR0FBQVQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFTLG1CQUFBLEdBQUFWLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVSxjQUFBLEdBQUFYLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVyxrQkFBQSxHQUFBWixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVksWUFBQSxHQUFBYixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWEsdUJBQUEsR0FBQWQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFjLHdCQUFBLEdBQUFmLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZSxlQUFBLEdBQUFoQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWdCLDJCQUFBLEdBQUFqQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWlCLG1CQUFBLEdBQUFsQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWtCLHlCQUFBLEdBQUFuQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQW1CLHlCQUFBLEdBQUFwQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQW9CLHVCQUFBLEdBQUFyQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXFCLGtCQUFBLEdBQUF0QixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXNCLG1CQUFBLEdBQUF2QixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXVCLG9CQUFBLEdBQUF4QixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXdCLGVBQUEsR0FBQXpCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBeUIsaUJBQUEsR0FBQTFCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBMEIsaUJBQUEsR0FBQTNCLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQTJCLG9CQUFBLEdBQUE1QixzQkFBQSxDQUFBQyxPQUFBOztBQUVBLElBQUE0QixlQUFBLEdBQUE3QixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQTZCLGNBQUEsR0FBQTlCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBOEIsWUFBQSxHQUFBL0Isc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUErQixlQUFBLEdBQUFoQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWdDLFlBQUEsR0FBQWpDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBaUMsY0FBQSxHQUFBbEMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFrQyxhQUFBLEdBQUFuQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQW1DLG1CQUFBLEdBQUFwQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQW9DLHFCQUFBLEdBQUFyQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXFDLDJCQUFBLEdBQUF0QyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXNDLDZCQUFBLEdBQUF2QyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXVDLFdBQUEsR0FBQXhDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBd0MsV0FBQSxHQUFBekMsc0JBQUEsQ0FBQUMsT0FBQSwwQkFBOEMsU0FBQXlDLHlCQUFBQyxXQUFBLGNBQUFDLE9BQUEsaUNBQUFDLGlCQUFBLE9BQUFELE9BQUEsT0FBQUUsZ0JBQUEsT0FBQUYsT0FBQSxXQUFBRix3QkFBQSxZQUFBQSxDQUFBQyxXQUFBLFVBQUFBLFdBQUEsR0FBQUcsZ0JBQUEsR0FBQUQsaUJBQUEsSUFBQUYsV0FBQSxZQUFBSSx3QkFBQUMsR0FBQSxFQUFBTCxXQUFBLFFBQUFBLFdBQUEsSUFBQUssR0FBQSxJQUFBQSxHQUFBLENBQUFDLFVBQUEsVUFBQUQsR0FBQSxNQUFBQSxHQUFBLG9CQUFBQSxHQUFBLHdCQUFBQSxHQUFBLDJCQUFBRSxPQUFBLEVBQUFGLEdBQUEsUUFBQUcsS0FBQSxHQUFBVCx3QkFBQSxDQUFBQyxXQUFBLE1BQUFRLEtBQUEsSUFBQUEsS0FBQSxDQUFBQyxHQUFBLENBQUFKLEdBQUEsV0FBQUcsS0FBQSxDQUFBRSxHQUFBLENBQUFMLEdBQUEsT0FBQU0sTUFBQSxVQUFBQyxxQkFBQSxHQUFBQyxNQUFBLENBQUFDLGNBQUEsSUFBQUQsTUFBQSxDQUFBRSx3QkFBQSxVQUFBQyxHQUFBLElBQUFYLEdBQUEsT0FBQVcsR0FBQSxrQkFBQUgsTUFBQSxDQUFBSSxTQUFBLENBQUFDLGNBQUEsQ0FBQUMsSUFBQSxDQUFBZCxHQUFBLEVBQUFXLEdBQUEsUUFBQUksSUFBQSxHQUFBUixxQkFBQSxHQUFBQyxNQUFBLENBQUFFLHdCQUFBLENBQUFWLEdBQUEsRUFBQVcsR0FBQSxhQUFBSSxJQUFBLEtBQUFBLElBQUEsQ0FBQVYsR0FBQSxJQUFBVSxJQUFBLENBQUFDLEdBQUEsSUFBQVIsTUFBQSxDQUFBQyxjQUFBLENBQUFILE1BQUEsRUFBQUssR0FBQSxFQUFBSSxJQUFBLFVBQUFULE1BQUEsQ0FBQUssR0FBQSxJQUFBWCxHQUFBLENBQUFXLEdBQUEsS0FBQUwsTUFBQSxDQUFBSixPQUFBLEdBQUFGLEdBQUEsS0FBQUcsS0FBQSxHQUFBQSxLQUFBLENBQUFhLEdBQUEsQ0FBQWhCLEdBQUEsRUFBQU0sTUFBQSxVQUFBQSxNQUFBOzs7QUFHOUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDZSxNQUFNVyxlQUFlLFNBQVNDLHFCQUFZLENBQUM7O0VBRXhEO0VBQ0EsT0FBMEJDLHlCQUF5QixHQUFHLEtBQUssQ0FBQyxDQUFDOztFQUU3RDs7Ozs7Ozs7OztFQVVBO0VBQ0FDLFdBQVdBLENBQUNDLE1BQTBCLEVBQUU7SUFDdEMsS0FBSyxDQUFDLENBQUM7SUFDUCxJQUFJLENBQUNBLE1BQU0sR0FBR0EsTUFBTTtJQUNwQixJQUFJLENBQUNDLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hCLElBQUksQ0FBQ0MsY0FBYyxHQUFHTixlQUFlLENBQUNFLHlCQUF5QjtFQUNqRTs7RUFFQTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0VLLFVBQVVBLENBQUEsRUFBaUI7SUFDekIsT0FBTyxJQUFJLENBQUNDLE9BQU87RUFDckI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTUMsV0FBV0EsQ0FBQ0MsS0FBSyxHQUFHLEtBQUssRUFBZ0M7SUFDN0QsSUFBSSxJQUFJLENBQUNGLE9BQU8sS0FBS0csU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyx1REFBdUQsQ0FBQztJQUM5RyxJQUFJQyxhQUFhLEdBQUdDLGlCQUFRLENBQUNDLFNBQVMsQ0FBQyxJQUFJLENBQUNDLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDM0QsS0FBSyxJQUFJQyxRQUFRLElBQUlKLGFBQWEsRUFBRSxNQUFNLElBQUksQ0FBQ0ssY0FBYyxDQUFDRCxRQUFRLENBQUM7SUFDdkUsT0FBT0gsaUJBQVEsQ0FBQ0ssV0FBVyxDQUFDLElBQUksQ0FBQ1gsT0FBTyxFQUFFRSxLQUFLLEdBQUcsU0FBUyxHQUFHQyxTQUFTLENBQUM7RUFDMUU7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFUyxnQkFBZ0JBLENBQUEsRUFBb0M7SUFDbEQsT0FBTyxJQUFJLENBQUNoQixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQztFQUNoQzs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNQyxVQUFVQSxDQUFDQyxZQUFrRCxFQUFFQyxRQUFpQixFQUE0Qjs7SUFFaEg7SUFDQSxJQUFJcEIsTUFBTSxHQUFHLElBQUlxQiwyQkFBa0IsQ0FBQyxPQUFPRixZQUFZLEtBQUssUUFBUSxHQUFHLEVBQUNHLElBQUksRUFBRUgsWUFBWSxFQUFFQyxRQUFRLEVBQUVBLFFBQVEsR0FBR0EsUUFBUSxHQUFHLEVBQUUsRUFBQyxHQUFHRCxZQUFZLENBQUM7SUFDL0k7O0lBRUE7SUFDQSxJQUFJLENBQUNuQixNQUFNLENBQUN1QixPQUFPLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSWYsb0JBQVcsQ0FBQyxxQ0FBcUMsQ0FBQztJQUNuRixNQUFNLElBQUksQ0FBQ1IsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGFBQWEsRUFBRSxFQUFDQyxRQUFRLEVBQUV6QixNQUFNLENBQUN1QixPQUFPLENBQUMsQ0FBQyxFQUFFSCxRQUFRLEVBQUVwQixNQUFNLENBQUMwQixXQUFXLENBQUMsQ0FBQyxFQUFDLENBQUM7SUFDMUgsTUFBTSxJQUFJLENBQUNDLEtBQUssQ0FBQyxDQUFDO0lBQ2xCLElBQUksQ0FBQ0wsSUFBSSxHQUFHdEIsTUFBTSxDQUFDdUIsT0FBTyxDQUFDLENBQUM7O0lBRTVCO0lBQ0EsSUFBSXZCLE1BQU0sQ0FBQzRCLG9CQUFvQixDQUFDLENBQUMsSUFBSSxJQUFJLEVBQUU7TUFDekMsSUFBSTVCLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJVCxvQkFBVyxDQUFDLHVFQUF1RSxDQUFDO01BQ3RILE1BQU0sSUFBSSxDQUFDcUIsb0JBQW9CLENBQUM3QixNQUFNLENBQUM0QixvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFDaEUsQ0FBQyxNQUFNLElBQUk1QixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRTtNQUNyQyxNQUFNLElBQUksQ0FBQ2EsbUJBQW1CLENBQUM5QixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQ3BEOztJQUVBLE9BQU8sSUFBSTtFQUNiOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU1jLFlBQVlBLENBQUMvQixNQUFtQyxFQUE0Qjs7SUFFaEY7SUFDQSxJQUFJQSxNQUFNLEtBQUtPLFNBQVMsRUFBRSxNQUFNLElBQUlDLG9CQUFXLENBQUMsc0NBQXNDLENBQUM7SUFDdkYsTUFBTXdCLGdCQUFnQixHQUFHLElBQUlYLDJCQUFrQixDQUFDckIsTUFBTSxDQUFDO0lBQ3ZELElBQUlnQyxnQkFBZ0IsQ0FBQ0MsT0FBTyxDQUFDLENBQUMsS0FBSzFCLFNBQVMsS0FBS3lCLGdCQUFnQixDQUFDRSxpQkFBaUIsQ0FBQyxDQUFDLEtBQUszQixTQUFTLElBQUl5QixnQkFBZ0IsQ0FBQ0csaUJBQWlCLENBQUMsQ0FBQyxLQUFLNUIsU0FBUyxJQUFJeUIsZ0JBQWdCLENBQUNJLGtCQUFrQixDQUFDLENBQUMsS0FBSzdCLFNBQVMsQ0FBQyxFQUFFO01BQ2pOLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyw0REFBNEQsQ0FBQztJQUNyRjtJQUNBLElBQUl3QixnQkFBZ0IsQ0FBQ0ssY0FBYyxDQUFDLENBQUMsS0FBSzlCLFNBQVMsRUFBRSxNQUFNLElBQUlDLG9CQUFXLENBQUMsa0dBQWtHLENBQUM7SUFDOUssSUFBSXdCLGdCQUFnQixDQUFDTSxtQkFBbUIsQ0FBQyxDQUFDLEtBQUsvQixTQUFTLElBQUl5QixnQkFBZ0IsQ0FBQ08sc0JBQXNCLENBQUMsQ0FBQyxLQUFLaEMsU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyx3RkFBd0YsQ0FBQztJQUNwTyxJQUFJd0IsZ0JBQWdCLENBQUNOLFdBQVcsQ0FBQyxDQUFDLEtBQUtuQixTQUFTLEVBQUV5QixnQkFBZ0IsQ0FBQ1EsV0FBVyxDQUFDLEVBQUUsQ0FBQzs7SUFFbEY7SUFDQSxJQUFJUixnQkFBZ0IsQ0FBQ0osb0JBQW9CLENBQUMsQ0FBQyxFQUFFO01BQzNDLElBQUlJLGdCQUFnQixDQUFDZixTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSVQsb0JBQVcsQ0FBQyx3RUFBd0UsQ0FBQztNQUNqSXdCLGdCQUFnQixDQUFDUyxTQUFTLENBQUN6QyxNQUFNLENBQUM0QixvQkFBb0IsQ0FBQyxDQUFDLENBQUNjLGFBQWEsQ0FBQyxDQUFDLENBQUM7SUFDM0U7O0lBRUE7SUFDQSxJQUFJVixnQkFBZ0IsQ0FBQ0MsT0FBTyxDQUFDLENBQUMsS0FBSzFCLFNBQVMsRUFBRSxNQUFNLElBQUksQ0FBQ29DLG9CQUFvQixDQUFDWCxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzNGLElBQUlBLGdCQUFnQixDQUFDSSxrQkFBa0IsQ0FBQyxDQUFDLEtBQUs3QixTQUFTLElBQUl5QixnQkFBZ0IsQ0FBQ0UsaUJBQWlCLENBQUMsQ0FBQyxLQUFLM0IsU0FBUyxFQUFFLE1BQU0sSUFBSSxDQUFDcUMsb0JBQW9CLENBQUNaLGdCQUFnQixDQUFDLENBQUM7SUFDakssTUFBTSxJQUFJLENBQUNhLGtCQUFrQixDQUFDYixnQkFBZ0IsQ0FBQzs7SUFFcEQ7SUFDQSxJQUFJQSxnQkFBZ0IsQ0FBQ0osb0JBQW9CLENBQUMsQ0FBQyxFQUFFO01BQzNDLE1BQU0sSUFBSSxDQUFDQyxvQkFBb0IsQ0FBQ0csZ0JBQWdCLENBQUNKLG9CQUFvQixDQUFDLENBQUMsQ0FBQztJQUMxRSxDQUFDLE1BQU0sSUFBSUksZ0JBQWdCLENBQUNmLFNBQVMsQ0FBQyxDQUFDLEVBQUU7TUFDdkMsTUFBTSxJQUFJLENBQUNhLG1CQUFtQixDQUFDRSxnQkFBZ0IsQ0FBQ2YsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUM5RDs7SUFFQSxPQUFPLElBQUk7RUFDYjs7RUFFQSxNQUFnQjRCLGtCQUFrQkEsQ0FBQzdDLE1BQTBCLEVBQUU7SUFDN0QsSUFBSUEsTUFBTSxDQUFDOEMsYUFBYSxDQUFDLENBQUMsS0FBS3ZDLFNBQVMsRUFBRSxNQUFNLElBQUlDLG9CQUFXLENBQUMsdURBQXVELENBQUM7SUFDeEgsSUFBSVIsTUFBTSxDQUFDK0MsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLeEMsU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQywwREFBMEQsQ0FBQztJQUM5SCxJQUFJUixNQUFNLENBQUNnRCxjQUFjLENBQUMsQ0FBQyxLQUFLLEtBQUssRUFBRSxNQUFNLElBQUl4QyxvQkFBVyxDQUFDLG1FQUFtRSxDQUFDO0lBQ2pJLElBQUksQ0FBQ1IsTUFBTSxDQUFDdUIsT0FBTyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUlmLG9CQUFXLENBQUMseUJBQXlCLENBQUM7SUFDdkUsSUFBSSxDQUFDUixNQUFNLENBQUNpRCxXQUFXLENBQUMsQ0FBQyxFQUFFakQsTUFBTSxDQUFDa0QsV0FBVyxDQUFDckQscUJBQVksQ0FBQ3NELGdCQUFnQixDQUFDO0lBQzVFLElBQUlDLE1BQU0sR0FBRyxFQUFFM0IsUUFBUSxFQUFFekIsTUFBTSxDQUFDdUIsT0FBTyxDQUFDLENBQUMsRUFBRUgsUUFBUSxFQUFFcEIsTUFBTSxDQUFDMEIsV0FBVyxDQUFDLENBQUMsRUFBRTJCLFFBQVEsRUFBRXJELE1BQU0sQ0FBQ2lELFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRyxJQUFJO01BQ0YsTUFBTSxJQUFJLENBQUNqRCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsZUFBZSxFQUFFNEIsTUFBTSxDQUFDO0lBQ3hFLENBQUMsQ0FBQyxPQUFPRSxHQUFRLEVBQUU7TUFDakIsSUFBSSxDQUFDQyx1QkFBdUIsQ0FBQ3ZELE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDLEVBQUUrQixHQUFHLENBQUM7SUFDckQ7SUFDQSxNQUFNLElBQUksQ0FBQzNCLEtBQUssQ0FBQyxDQUFDO0lBQ2xCLElBQUksQ0FBQ0wsSUFBSSxHQUFHdEIsTUFBTSxDQUFDdUIsT0FBTyxDQUFDLENBQUM7SUFDNUIsT0FBTyxJQUFJO0VBQ2I7O0VBRUEsTUFBZ0JvQixvQkFBb0JBLENBQUMzQyxNQUEwQixFQUFFO0lBQy9ELElBQUk7TUFDRixNQUFNLElBQUksQ0FBQ0EsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLDhCQUE4QixFQUFFO1FBQzVFQyxRQUFRLEVBQUV6QixNQUFNLENBQUN1QixPQUFPLENBQUMsQ0FBQztRQUMxQkgsUUFBUSxFQUFFcEIsTUFBTSxDQUFDMEIsV0FBVyxDQUFDLENBQUM7UUFDOUI4QixJQUFJLEVBQUV4RCxNQUFNLENBQUNpQyxPQUFPLENBQUMsQ0FBQztRQUN0QndCLFdBQVcsRUFBRXpELE1BQU0sQ0FBQzhDLGFBQWEsQ0FBQyxDQUFDO1FBQ25DWSw0QkFBNEIsRUFBRTFELE1BQU0sQ0FBQzJELGFBQWEsQ0FBQyxDQUFDO1FBQ3BEQyxjQUFjLEVBQUU1RCxNQUFNLENBQUMrQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3pDTSxRQUFRLEVBQUVyRCxNQUFNLENBQUNpRCxXQUFXLENBQUMsQ0FBQztRQUM5QlksZ0JBQWdCLEVBQUU3RCxNQUFNLENBQUNnRCxjQUFjLENBQUM7TUFDMUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLE9BQU9NLEdBQVEsRUFBRTtNQUNqQixJQUFJLENBQUNDLHVCQUF1QixDQUFDdkQsTUFBTSxDQUFDdUIsT0FBTyxDQUFDLENBQUMsRUFBRStCLEdBQUcsQ0FBQztJQUNyRDtJQUNBLE1BQU0sSUFBSSxDQUFDM0IsS0FBSyxDQUFDLENBQUM7SUFDbEIsSUFBSSxDQUFDTCxJQUFJLEdBQUd0QixNQUFNLENBQUN1QixPQUFPLENBQUMsQ0FBQztJQUM1QixPQUFPLElBQUk7RUFDYjs7RUFFQSxNQUFnQnFCLG9CQUFvQkEsQ0FBQzVDLE1BQTBCLEVBQUU7SUFDL0QsSUFBSUEsTUFBTSxDQUFDOEMsYUFBYSxDQUFDLENBQUMsS0FBS3ZDLFNBQVMsRUFBRSxNQUFNLElBQUlDLG9CQUFXLENBQUMsMERBQTBELENBQUM7SUFDM0gsSUFBSVIsTUFBTSxDQUFDK0MsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLeEMsU0FBUyxFQUFFUCxNQUFNLENBQUM4RCxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7SUFDdkUsSUFBSTlELE1BQU0sQ0FBQ2lELFdBQVcsQ0FBQyxDQUFDLEtBQUsxQyxTQUFTLEVBQUVQLE1BQU0sQ0FBQ2tELFdBQVcsQ0FBQ3JELHFCQUFZLENBQUNzRCxnQkFBZ0IsQ0FBQztJQUN6RixJQUFJO01BQ0YsTUFBTSxJQUFJLENBQUNuRCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsb0JBQW9CLEVBQUU7UUFDbEVDLFFBQVEsRUFBRXpCLE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDO1FBQzFCSCxRQUFRLEVBQUVwQixNQUFNLENBQUMwQixXQUFXLENBQUMsQ0FBQztRQUM5QnFDLE9BQU8sRUFBRS9ELE1BQU0sQ0FBQ2tDLGlCQUFpQixDQUFDLENBQUM7UUFDbkM4QixPQUFPLEVBQUVoRSxNQUFNLENBQUNtQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ25DOEIsUUFBUSxFQUFFakUsTUFBTSxDQUFDb0Msa0JBQWtCLENBQUMsQ0FBQztRQUNyQ3dCLGNBQWMsRUFBRTVELE1BQU0sQ0FBQytDLGdCQUFnQixDQUFDLENBQUM7UUFDekNjLGdCQUFnQixFQUFFN0QsTUFBTSxDQUFDZ0QsY0FBYyxDQUFDO01BQzFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxPQUFPTSxHQUFRLEVBQUU7TUFDakIsSUFBSSxDQUFDQyx1QkFBdUIsQ0FBQ3ZELE1BQU0sQ0FBQ3VCLE9BQU8sQ0FBQyxDQUFDLEVBQUUrQixHQUFHLENBQUM7SUFDckQ7SUFDQSxNQUFNLElBQUksQ0FBQzNCLEtBQUssQ0FBQyxDQUFDO0lBQ2xCLElBQUksQ0FBQ0wsSUFBSSxHQUFHdEIsTUFBTSxDQUFDdUIsT0FBTyxDQUFDLENBQUM7SUFDNUIsT0FBTyxJQUFJO0VBQ2I7O0VBRVVnQyx1QkFBdUJBLENBQUNXLElBQUksRUFBRVosR0FBRyxFQUFFO0lBQzNDLElBQUlBLEdBQUcsQ0FBQ2EsT0FBTyxLQUFLLHVDQUF1QyxFQUFFLE1BQU0sSUFBSUMsdUJBQWMsQ0FBQyx5QkFBeUIsR0FBR0YsSUFBSSxFQUFFWixHQUFHLENBQUNlLE9BQU8sQ0FBQyxDQUFDLEVBQUVmLEdBQUcsQ0FBQ2dCLFlBQVksQ0FBQyxDQUFDLEVBQUVoQixHQUFHLENBQUNpQixZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQzlLLElBQUlqQixHQUFHLENBQUNhLE9BQU8sS0FBSyw4Q0FBOEMsRUFBRSxNQUFNLElBQUlDLHVCQUFjLENBQUMsa0JBQWtCLEVBQUVkLEdBQUcsQ0FBQ2UsT0FBTyxDQUFDLENBQUMsRUFBRWYsR0FBRyxDQUFDZ0IsWUFBWSxDQUFDLENBQUMsRUFBRWhCLEdBQUcsQ0FBQ2lCLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDdkssTUFBTWpCLEdBQUc7RUFDWDs7RUFFQSxNQUFNa0IsVUFBVUEsQ0FBQSxFQUFxQjtJQUNuQyxJQUFJO01BQ0YsTUFBTSxJQUFJLENBQUN4RSxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUNpRCxRQUFRLEVBQUUsVUFBVSxFQUFDLENBQUM7TUFDbEYsT0FBTyxLQUFLLENBQUMsQ0FBQztJQUNoQixDQUFDLENBQUMsT0FBT0MsQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLE9BQU8sSUFBSSxDQUFDLENBQUU7TUFDdkMsSUFBSUssQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLE9BQU8sS0FBSyxDQUFDLENBQUU7TUFDdkMsTUFBTUssQ0FBQztJQUNUO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNNUMsbUJBQW1CQSxDQUFDNkMsZUFBOEMsRUFBRUMsU0FBbUIsRUFBRUMsVUFBdUIsRUFBaUI7SUFDckksSUFBSUMsVUFBVSxHQUFHLENBQUNILGVBQWUsR0FBR3BFLFNBQVMsR0FBR29FLGVBQWUsWUFBWUksNEJBQW1CLEdBQUdKLGVBQWUsR0FBRyxJQUFJSSw0QkFBbUIsQ0FBQ0osZUFBZSxDQUFDO0lBQzNKLElBQUksQ0FBQ0UsVUFBVSxFQUFFQSxVQUFVLEdBQUcsSUFBSUcsbUJBQVUsQ0FBQyxDQUFDO0lBQzlDLElBQUk1QixNQUFXLEdBQUcsQ0FBQyxDQUFDO0lBQ3BCQSxNQUFNLENBQUNXLE9BQU8sR0FBR2UsVUFBVSxHQUFHQSxVQUFVLENBQUNHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUM7SUFDL0Q3QixNQUFNLENBQUM4QixRQUFRLEdBQUdKLFVBQVUsR0FBR0EsVUFBVSxDQUFDSyxXQUFXLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDNUQvQixNQUFNLENBQUNoQyxRQUFRLEdBQUcwRCxVQUFVLEdBQUdBLFVBQVUsQ0FBQ3BELFdBQVcsQ0FBQyxDQUFDLEdBQUcsRUFBRTtJQUM1RDBCLE1BQU0sQ0FBQ2dDLE9BQU8sR0FBR1IsU0FBUztJQUMxQnhCLE1BQU0sQ0FBQ2lDLFdBQVcsR0FBRyxZQUFZO0lBQ2pDakMsTUFBTSxDQUFDa0Msb0JBQW9CLEdBQUdULFVBQVUsQ0FBQ1UsaUJBQWlCLENBQUMsQ0FBQztJQUM1RG5DLE1BQU0sQ0FBQ29DLG9CQUFvQixHQUFJWCxVQUFVLENBQUNZLGtCQUFrQixDQUFDLENBQUM7SUFDOURyQyxNQUFNLENBQUNzQyxXQUFXLEdBQUdiLFVBQVUsQ0FBQ2MsMkJBQTJCLENBQUMsQ0FBQztJQUM3RHZDLE1BQU0sQ0FBQ3dDLHdCQUF3QixHQUFHZixVQUFVLENBQUNnQixzQkFBc0IsQ0FBQyxDQUFDO0lBQ3JFekMsTUFBTSxDQUFDMEMsa0JBQWtCLEdBQUdqQixVQUFVLENBQUNrQixlQUFlLENBQUMsQ0FBQztJQUN4RCxNQUFNLElBQUksQ0FBQy9GLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxZQUFZLEVBQUU0QixNQUFNLENBQUM7SUFDbkUsSUFBSSxDQUFDNEMsZ0JBQWdCLEdBQUdsQixVQUFVO0VBQ3BDOztFQUVBLE1BQU1tQixtQkFBbUJBLENBQUEsRUFBaUM7SUFDeEQsT0FBTyxJQUFJLENBQUNELGdCQUFnQjtFQUM5Qjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU1FLFdBQVdBLENBQUNDLFVBQW1CLEVBQUVDLGFBQXNCLEVBQXFCO0lBQ2hGLElBQUlELFVBQVUsS0FBSzVGLFNBQVMsRUFBRTtNQUM1QjhGLGVBQU0sQ0FBQ0MsS0FBSyxDQUFDRixhQUFhLEVBQUU3RixTQUFTLEVBQUUsa0RBQWtELENBQUM7TUFDMUYsSUFBSWdHLE9BQU8sR0FBR0MsTUFBTSxDQUFDLENBQUMsQ0FBQztNQUN2QixJQUFJQyxlQUFlLEdBQUdELE1BQU0sQ0FBQyxDQUFDLENBQUM7TUFDL0IsS0FBSyxJQUFJRSxPQUFPLElBQUksTUFBTSxJQUFJLENBQUNDLFdBQVcsQ0FBQyxDQUFDLEVBQUU7UUFDNUNKLE9BQU8sR0FBR0EsT0FBTyxHQUFHRyxPQUFPLENBQUNFLFVBQVUsQ0FBQyxDQUFDO1FBQ3hDSCxlQUFlLEdBQUdBLGVBQWUsR0FBR0MsT0FBTyxDQUFDRyxrQkFBa0IsQ0FBQyxDQUFDO01BQ2xFO01BQ0EsT0FBTyxDQUFDTixPQUFPLEVBQUVFLGVBQWUsQ0FBQztJQUNuQyxDQUFDLE1BQU07TUFDTCxJQUFJckQsTUFBTSxHQUFHLEVBQUMwRCxhQUFhLEVBQUVYLFVBQVUsRUFBRVksZUFBZSxFQUFFWCxhQUFhLEtBQUs3RixTQUFTLEdBQUdBLFNBQVMsR0FBRyxDQUFDNkYsYUFBYSxDQUFDLEVBQUM7TUFDcEgsSUFBSVksSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGFBQWEsRUFBRTRCLE1BQU0sQ0FBQztNQUMvRSxJQUFJZ0QsYUFBYSxLQUFLN0YsU0FBUyxFQUFFLE9BQU8sQ0FBQ2lHLE1BQU0sQ0FBQ1EsSUFBSSxDQUFDQyxNQUFNLENBQUNWLE9BQU8sQ0FBQyxFQUFFQyxNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7TUFDdkcsT0FBTyxDQUFDVixNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDRSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUNaLE9BQU8sQ0FBQyxFQUFFQyxNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDRSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUNELGdCQUFnQixDQUFDLENBQUM7SUFDckg7RUFDRjs7RUFFQTs7RUFFQSxNQUFNRSxXQUFXQSxDQUFDdkcsUUFBOEIsRUFBaUI7SUFDL0QsTUFBTSxLQUFLLENBQUN1RyxXQUFXLENBQUN2RyxRQUFRLENBQUM7SUFDakMsSUFBSSxDQUFDd0csZ0JBQWdCLENBQUMsQ0FBQztFQUN6Qjs7RUFFQSxNQUFNdkcsY0FBY0EsQ0FBQ0QsUUFBUSxFQUFpQjtJQUM1QyxNQUFNLEtBQUssQ0FBQ0MsY0FBYyxDQUFDRCxRQUFRLENBQUM7SUFDcEMsSUFBSSxDQUFDd0csZ0JBQWdCLENBQUMsQ0FBQztFQUN6Qjs7RUFFQSxNQUFNQyxtQkFBbUJBLENBQUEsRUFBcUI7SUFDNUMsSUFBSTtNQUNGLE1BQU0sSUFBSSxDQUFDQyxpQkFBaUIsQ0FBQyxNQUFNLElBQUksQ0FBQ3JGLGlCQUFpQixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztNQUN0RSxNQUFNLElBQUkxQixvQkFBVyxDQUFDLGdDQUFnQyxDQUFDO0lBQ3pELENBQUMsQ0FBQyxPQUFPa0UsQ0FBTSxFQUFFO01BQ2YsT0FBT0EsQ0FBQyxDQUFDUCxPQUFPLENBQUNxRCxPQUFPLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDO0lBQzdEO0VBQ0Y7O0VBRUEsTUFBTUMsVUFBVUEsQ0FBQSxFQUEyQjtJQUN6QyxJQUFJVCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUNoSCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsYUFBYSxDQUFDO0lBQ3ZFLE9BQU8sSUFBSWtHLHNCQUFhLENBQUNWLElBQUksQ0FBQ0MsTUFBTSxDQUFDVSxPQUFPLEVBQUVYLElBQUksQ0FBQ0MsTUFBTSxDQUFDVyxPQUFPLENBQUM7RUFDcEU7O0VBRUEsTUFBTXJHLE9BQU9BLENBQUEsRUFBb0I7SUFDL0IsT0FBTyxJQUFJLENBQUNELElBQUk7RUFDbEI7O0VBRUEsTUFBTVcsT0FBT0EsQ0FBQSxFQUFvQjtJQUMvQixJQUFJK0UsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFaUQsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDL0YsT0FBT3VDLElBQUksQ0FBQ0MsTUFBTSxDQUFDM0gsR0FBRztFQUN4Qjs7RUFFQSxNQUFNdUksZUFBZUEsQ0FBQSxFQUFvQjtJQUN2QyxJQUFJLE9BQU0sSUFBSSxDQUFDNUYsT0FBTyxDQUFDLENBQUMsTUFBSzFCLFNBQVMsRUFBRSxPQUFPQSxTQUFTO0lBQ3hELE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyxpREFBaUQsQ0FBQztFQUMxRTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTXNILGdCQUFnQkEsQ0FBQSxFQUFHO0lBQ3ZCLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQzlILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxlQUFlLENBQUMsRUFBRXlGLE1BQU0sQ0FBQ2MsU0FBUztFQUMxRjs7RUFFQSxNQUFNNUYsaUJBQWlCQSxDQUFBLEVBQW9CO0lBQ3pDLElBQUk2RSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUNoSCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUVpRCxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUMvRixPQUFPdUMsSUFBSSxDQUFDQyxNQUFNLENBQUMzSCxHQUFHO0VBQ3hCOztFQUVBLE1BQU04QyxrQkFBa0JBLENBQUEsRUFBb0I7SUFDMUMsSUFBSTRFLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRWlELFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQ2hHLE9BQU91QyxJQUFJLENBQUNDLE1BQU0sQ0FBQzNILEdBQUc7RUFDeEI7O0VBRUEsTUFBTTBJLFVBQVVBLENBQUM3QixVQUFrQixFQUFFQyxhQUFxQixFQUFtQjtJQUMzRSxJQUFJNkIsYUFBYSxHQUFHLElBQUksQ0FBQ2hJLFlBQVksQ0FBQ2tHLFVBQVUsQ0FBQztJQUNqRCxJQUFJLENBQUM4QixhQUFhLEVBQUU7TUFDbEIsTUFBTSxJQUFJLENBQUNDLGVBQWUsQ0FBQy9CLFVBQVUsRUFBRTVGLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFFO01BQzFELE9BQU8sSUFBSSxDQUFDeUgsVUFBVSxDQUFDN0IsVUFBVSxFQUFFQyxhQUFhLENBQUMsQ0FBQyxDQUFRO0lBQzVEO0lBQ0EsSUFBSXJDLE9BQU8sR0FBR2tFLGFBQWEsQ0FBQzdCLGFBQWEsQ0FBQztJQUMxQyxJQUFJLENBQUNyQyxPQUFPLEVBQUU7TUFDWixNQUFNLElBQUksQ0FBQ21FLGVBQWUsQ0FBQy9CLFVBQVUsRUFBRTVGLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFFO01BQzFELE9BQU8sSUFBSSxDQUFDTixZQUFZLENBQUNrRyxVQUFVLENBQUMsQ0FBQ0MsYUFBYSxDQUFDO0lBQ3JEO0lBQ0EsT0FBT3JDLE9BQU87RUFDaEI7O0VBRUE7RUFDQSxNQUFNb0UsZUFBZUEsQ0FBQ3BFLE9BQWUsRUFBNkI7O0lBRWhFO0lBQ0EsSUFBSWlELElBQUk7SUFDUixJQUFJO01BQ0ZBLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRSxFQUFDdUMsT0FBTyxFQUFFQSxPQUFPLEVBQUMsQ0FBQztJQUMvRixDQUFDLENBQUMsT0FBT1csQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSTdELG9CQUFXLENBQUNrRSxDQUFDLENBQUNQLE9BQU8sQ0FBQztNQUN4RCxNQUFNTyxDQUFDO0lBQ1Q7O0lBRUE7SUFDQSxJQUFJMEQsVUFBVSxHQUFHLElBQUlDLHlCQUFnQixDQUFDLEVBQUN0RSxPQUFPLEVBQUVBLE9BQU8sRUFBQyxDQUFDO0lBQ3pEcUUsVUFBVSxDQUFDRSxlQUFlLENBQUN0QixJQUFJLENBQUNDLE1BQU0sQ0FBQ3NCLEtBQUssQ0FBQ0MsS0FBSyxDQUFDO0lBQ25ESixVQUFVLENBQUNLLFFBQVEsQ0FBQ3pCLElBQUksQ0FBQ0MsTUFBTSxDQUFDc0IsS0FBSyxDQUFDRyxLQUFLLENBQUM7SUFDNUMsT0FBT04sVUFBVTtFQUNuQjs7RUFFQSxNQUFNTyxvQkFBb0JBLENBQUNDLGVBQXdCLEVBQUVDLFNBQWtCLEVBQW9DO0lBQ3pHLElBQUk7TUFDRixJQUFJQyxvQkFBb0IsR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDOUksTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLHlCQUF5QixFQUFFLEVBQUN1SCxnQkFBZ0IsRUFBRUgsZUFBZSxFQUFFSSxVQUFVLEVBQUVILFNBQVMsRUFBQyxDQUFDLEVBQUU1QixNQUFNLENBQUNnQyxrQkFBa0I7TUFDM0wsT0FBTyxNQUFNLElBQUksQ0FBQ0MsdUJBQXVCLENBQUNKLG9CQUFvQixDQUFDO0lBQ2pFLENBQUMsQ0FBQyxPQUFPcEUsQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxDQUFDUCxPQUFPLENBQUNnRixRQUFRLENBQUMsb0JBQW9CLENBQUMsRUFBRSxNQUFNLElBQUkzSSxvQkFBVyxDQUFDLHNCQUFzQixHQUFHcUksU0FBUyxDQUFDO01BQ3ZHLE1BQU1uRSxDQUFDO0lBQ1Q7RUFDRjs7RUFFQSxNQUFNd0UsdUJBQXVCQSxDQUFDRSxpQkFBeUIsRUFBb0M7SUFDekYsSUFBSXBDLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQywwQkFBMEIsRUFBRSxFQUFDeUgsa0JBQWtCLEVBQUVHLGlCQUFpQixFQUFDLENBQUM7SUFDN0gsT0FBTyxJQUFJQyxnQ0FBdUIsQ0FBQyxDQUFDLENBQUNDLGtCQUFrQixDQUFDdEMsSUFBSSxDQUFDQyxNQUFNLENBQUM4QixnQkFBZ0IsQ0FBQyxDQUFDUSxZQUFZLENBQUN2QyxJQUFJLENBQUNDLE1BQU0sQ0FBQytCLFVBQVUsQ0FBQyxDQUFDUSxvQkFBb0IsQ0FBQ0osaUJBQWlCLENBQUM7RUFDcEs7O0VBRUEsTUFBTUssU0FBU0EsQ0FBQSxFQUFvQjtJQUNqQyxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUN6SixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsWUFBWSxDQUFDLEVBQUV5RixNQUFNLENBQUN5QyxNQUFNO0VBQ3BGOztFQUVBLE1BQU1DLGVBQWVBLENBQUEsRUFBb0I7SUFDdkMsTUFBTSxJQUFJbkosb0JBQVcsQ0FBQyw2REFBNkQsQ0FBQztFQUN0Rjs7RUFFQSxNQUFNb0osZUFBZUEsQ0FBQ0MsSUFBWSxFQUFFQyxLQUFhLEVBQUVDLEdBQVcsRUFBbUI7SUFDL0UsTUFBTSxJQUFJdkosb0JBQVcsQ0FBQyw2REFBNkQsQ0FBQztFQUN0Rjs7RUFFQSxNQUFNd0osSUFBSUEsQ0FBQ0MscUJBQXFELEVBQUVDLFdBQW9CLEVBQTZCO0lBQ2pILElBQUE3RCxlQUFNLEVBQUMsRUFBRTRELHFCQUFxQixZQUFZRSw2QkFBb0IsQ0FBQyxFQUFFLDREQUE0RCxDQUFDO0lBQzlILElBQUk7TUFDRixJQUFJbkQsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLFNBQVMsRUFBRSxFQUFDNEksWUFBWSxFQUFFRixXQUFXLEVBQUMsQ0FBQztNQUNoRyxNQUFNLElBQUksQ0FBQ0csSUFBSSxDQUFDLENBQUM7TUFDakIsT0FBTyxJQUFJQyx5QkFBZ0IsQ0FBQ3RELElBQUksQ0FBQ0MsTUFBTSxDQUFDc0QsY0FBYyxFQUFFdkQsSUFBSSxDQUFDQyxNQUFNLENBQUN1RCxjQUFjLENBQUM7SUFDckYsQ0FBQyxDQUFDLE9BQU9sSCxHQUFRLEVBQUU7TUFDakIsSUFBSUEsR0FBRyxDQUFDYSxPQUFPLEtBQUsseUJBQXlCLEVBQUUsTUFBTSxJQUFJM0Qsb0JBQVcsQ0FBQyxtQ0FBbUMsQ0FBQztNQUN6RyxNQUFNOEMsR0FBRztJQUNYO0VBQ0Y7O0VBRUEsTUFBTW1ILFlBQVlBLENBQUN2SyxjQUF1QixFQUFpQjs7SUFFekQ7SUFDQSxJQUFJd0ssbUJBQW1CLEdBQUdDLElBQUksQ0FBQ0MsS0FBSyxDQUFDLENBQUMxSyxjQUFjLEtBQUtLLFNBQVMsR0FBR1gsZUFBZSxDQUFDRSx5QkFBeUIsR0FBR0ksY0FBYyxJQUFJLElBQUksQ0FBQzs7SUFFeEk7SUFDQSxNQUFNLElBQUksQ0FBQ0YsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGNBQWMsRUFBRTtNQUM1RHFKLE1BQU0sRUFBRSxJQUFJO01BQ1pDLE1BQU0sRUFBRUo7SUFDVixDQUFDLENBQUM7O0lBRUY7SUFDQSxJQUFJLENBQUN4SyxjQUFjLEdBQUd3SyxtQkFBbUIsR0FBRyxJQUFJO0lBQ2hELElBQUksSUFBSSxDQUFDSyxZQUFZLEtBQUt4SyxTQUFTLEVBQUUsSUFBSSxDQUFDd0ssWUFBWSxDQUFDQyxhQUFhLENBQUMsSUFBSSxDQUFDOUssY0FBYyxDQUFDOztJQUV6RjtJQUNBLE1BQU0sSUFBSSxDQUFDbUssSUFBSSxDQUFDLENBQUM7RUFDbkI7O0VBRUFZLGlCQUFpQkEsQ0FBQSxFQUFXO0lBQzFCLE9BQU8sSUFBSSxDQUFDL0ssY0FBYztFQUM1Qjs7RUFFQSxNQUFNZ0wsV0FBV0EsQ0FBQSxFQUFrQjtJQUNqQyxPQUFPLElBQUksQ0FBQ2xMLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxjQUFjLEVBQUUsRUFBRXFKLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0VBQ25GOztFQUVBLE1BQU1NLE9BQU9BLENBQUNDLFFBQWtCLEVBQWlCO0lBQy9DLElBQUksQ0FBQ0EsUUFBUSxJQUFJLENBQUNBLFFBQVEsQ0FBQ0MsTUFBTSxFQUFFLE1BQU0sSUFBSTdLLG9CQUFXLENBQUMsNEJBQTRCLENBQUM7SUFDdEYsTUFBTSxJQUFJLENBQUNSLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxTQUFTLEVBQUUsRUFBQzhKLEtBQUssRUFBRUYsUUFBUSxFQUFDLENBQUM7SUFDM0UsTUFBTSxJQUFJLENBQUNmLElBQUksQ0FBQyxDQUFDO0VBQ25COztFQUVBLE1BQU1rQixXQUFXQSxDQUFBLEVBQWtCO0lBQ2pDLE1BQU0sSUFBSSxDQUFDdkwsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGNBQWMsRUFBRWpCLFNBQVMsQ0FBQztFQUMxRTs7RUFFQSxNQUFNaUwsZ0JBQWdCQSxDQUFBLEVBQWtCO0lBQ3RDLE1BQU0sSUFBSSxDQUFDeEwsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLG1CQUFtQixFQUFFakIsU0FBUyxDQUFDO0VBQy9FOztFQUVBLE1BQU1xRyxVQUFVQSxDQUFDVCxVQUFtQixFQUFFQyxhQUFzQixFQUFtQjtJQUM3RSxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUNGLFdBQVcsQ0FBQ0MsVUFBVSxFQUFFQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDL0Q7O0VBRUEsTUFBTVMsa0JBQWtCQSxDQUFDVixVQUFtQixFQUFFQyxhQUFzQixFQUFtQjtJQUNyRixPQUFPLENBQUMsTUFBTSxJQUFJLENBQUNGLFdBQVcsQ0FBQ0MsVUFBVSxFQUFFQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDL0Q7O0VBRUEsTUFBTU8sV0FBV0EsQ0FBQzhFLG1CQUE2QixFQUFFQyxHQUFZLEVBQUVDLFlBQXNCLEVBQTRCOztJQUUvRztJQUNBLElBQUkzRSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUNoSCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsY0FBYyxFQUFFLEVBQUNrSyxHQUFHLEVBQUVBLEdBQUcsRUFBQyxDQUFDOztJQUVwRjtJQUNBO0lBQ0EsSUFBSUUsUUFBeUIsR0FBRyxFQUFFO0lBQ2xDLEtBQUssSUFBSUMsVUFBVSxJQUFJN0UsSUFBSSxDQUFDQyxNQUFNLENBQUM2RSxtQkFBbUIsRUFBRTtNQUN0RCxJQUFJcEYsT0FBTyxHQUFHOUcsZUFBZSxDQUFDbU0saUJBQWlCLENBQUNGLFVBQVUsQ0FBQztNQUMzRCxJQUFJSixtQkFBbUIsRUFBRS9FLE9BQU8sQ0FBQ3NGLGVBQWUsQ0FBQyxNQUFNLElBQUksQ0FBQzlELGVBQWUsQ0FBQ3hCLE9BQU8sQ0FBQ3VGLFFBQVEsQ0FBQyxDQUFDLEVBQUUxTCxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7TUFDakhxTCxRQUFRLENBQUNNLElBQUksQ0FBQ3hGLE9BQU8sQ0FBQztJQUN4Qjs7SUFFQTtJQUNBLElBQUkrRSxtQkFBbUIsSUFBSSxDQUFDRSxZQUFZLEVBQUU7O01BRXhDO01BQ0EsS0FBSyxJQUFJakYsT0FBTyxJQUFJa0YsUUFBUSxFQUFFO1FBQzVCLEtBQUssSUFBSXhELFVBQVUsSUFBSTFCLE9BQU8sQ0FBQ3dCLGVBQWUsQ0FBQyxDQUFDLEVBQUU7VUFDaERFLFVBQVUsQ0FBQytELFVBQVUsQ0FBQzNGLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztVQUNoQzRCLFVBQVUsQ0FBQ2dFLGtCQUFrQixDQUFDNUYsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQ3hDNEIsVUFBVSxDQUFDaUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1VBQ2xDakUsVUFBVSxDQUFDa0Usb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQ3BDO01BQ0Y7O01BRUE7TUFDQXRGLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxhQUFhLEVBQUUsRUFBQytLLFlBQVksRUFBRSxJQUFJLEVBQUMsQ0FBQztNQUN6RixJQUFJdkYsSUFBSSxDQUFDQyxNQUFNLENBQUNFLGNBQWMsRUFBRTtRQUM5QixLQUFLLElBQUlxRixhQUFhLElBQUl4RixJQUFJLENBQUNDLE1BQU0sQ0FBQ0UsY0FBYyxFQUFFO1VBQ3BELElBQUlpQixVQUFVLEdBQUd4SSxlQUFlLENBQUM2TSxvQkFBb0IsQ0FBQ0QsYUFBYSxDQUFDOztVQUVwRTtVQUNBLElBQUk5RixPQUFPLEdBQUdrRixRQUFRLENBQUN4RCxVQUFVLENBQUNzRSxlQUFlLENBQUMsQ0FBQyxDQUFDO1VBQ3BEckcsZUFBTSxDQUFDQyxLQUFLLENBQUM4QixVQUFVLENBQUNzRSxlQUFlLENBQUMsQ0FBQyxFQUFFaEcsT0FBTyxDQUFDdUYsUUFBUSxDQUFDLENBQUMsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDLENBQUU7VUFDbEcsSUFBSVUsYUFBYSxHQUFHakcsT0FBTyxDQUFDd0IsZUFBZSxDQUFDLENBQUMsQ0FBQ0UsVUFBVSxDQUFDNkQsUUFBUSxDQUFDLENBQUMsQ0FBQztVQUNwRTVGLGVBQU0sQ0FBQ0MsS0FBSyxDQUFDOEIsVUFBVSxDQUFDNkQsUUFBUSxDQUFDLENBQUMsRUFBRVUsYUFBYSxDQUFDVixRQUFRLENBQUMsQ0FBQyxFQUFFLG1DQUFtQyxDQUFDO1VBQ2xHLElBQUk3RCxVQUFVLENBQUN4QixVQUFVLENBQUMsQ0FBQyxLQUFLckcsU0FBUyxFQUFFb00sYUFBYSxDQUFDUixVQUFVLENBQUMvRCxVQUFVLENBQUN4QixVQUFVLENBQUMsQ0FBQyxDQUFDO1VBQzVGLElBQUl3QixVQUFVLENBQUN2QixrQkFBa0IsQ0FBQyxDQUFDLEtBQUt0RyxTQUFTLEVBQUVvTSxhQUFhLENBQUNQLGtCQUFrQixDQUFDaEUsVUFBVSxDQUFDdkIsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1VBQ3BILElBQUl1QixVQUFVLENBQUN3RSxvQkFBb0IsQ0FBQyxDQUFDLEtBQUtyTSxTQUFTLEVBQUVvTSxhQUFhLENBQUNOLG9CQUFvQixDQUFDakUsVUFBVSxDQUFDd0Usb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQzVIO01BQ0Y7SUFDRjs7SUFFQSxPQUFPaEIsUUFBUTtFQUNqQjs7RUFFQTtFQUNBLE1BQU1pQixVQUFVQSxDQUFDMUcsVUFBa0IsRUFBRXNGLG1CQUE2QixFQUFFRSxZQUFzQixFQUEwQjtJQUNsSCxJQUFBdEYsZUFBTSxFQUFDRixVQUFVLElBQUksQ0FBQyxDQUFDO0lBQ3ZCLEtBQUssSUFBSU8sT0FBTyxJQUFJLE1BQU0sSUFBSSxDQUFDQyxXQUFXLENBQUMsQ0FBQyxFQUFFO01BQzVDLElBQUlELE9BQU8sQ0FBQ3VGLFFBQVEsQ0FBQyxDQUFDLEtBQUs5RixVQUFVLEVBQUU7UUFDckMsSUFBSXNGLG1CQUFtQixFQUFFL0UsT0FBTyxDQUFDc0YsZUFBZSxDQUFDLE1BQU0sSUFBSSxDQUFDOUQsZUFBZSxDQUFDL0IsVUFBVSxFQUFFNUYsU0FBUyxFQUFFb0wsWUFBWSxDQUFDLENBQUM7UUFDakgsT0FBT2pGLE9BQU87TUFDaEI7SUFDRjtJQUNBLE1BQU0sSUFBSW9HLEtBQUssQ0FBQyxxQkFBcUIsR0FBRzNHLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQztFQUN6RTs7RUFFQSxNQUFNNEcsYUFBYUEsQ0FBQ0MsS0FBYyxFQUEwQjtJQUMxREEsS0FBSyxHQUFHQSxLQUFLLEdBQUdBLEtBQUssR0FBR3pNLFNBQVM7SUFDakMsSUFBSXlHLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFDd0wsS0FBSyxFQUFFQSxLQUFLLEVBQUMsQ0FBQztJQUMxRixPQUFPLElBQUlDLHNCQUFhLENBQUM7TUFDdkIxRSxLQUFLLEVBQUV2QixJQUFJLENBQUNDLE1BQU0sQ0FBQ0gsYUFBYTtNQUNoQ29HLGNBQWMsRUFBRWxHLElBQUksQ0FBQ0MsTUFBTSxDQUFDbEQsT0FBTztNQUNuQ2lKLEtBQUssRUFBRUEsS0FBSztNQUNaekcsT0FBTyxFQUFFQyxNQUFNLENBQUMsQ0FBQyxDQUFDO01BQ2xCQyxlQUFlLEVBQUVELE1BQU0sQ0FBQyxDQUFDO0lBQzNCLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU0wQixlQUFlQSxDQUFDL0IsVUFBa0IsRUFBRWdILGlCQUE0QixFQUFFeEIsWUFBc0IsRUFBK0I7O0lBRTNIO0lBQ0EsSUFBSXZJLE1BQVcsR0FBRyxDQUFDLENBQUM7SUFDcEJBLE1BQU0sQ0FBQzBELGFBQWEsR0FBR1gsVUFBVTtJQUNqQyxJQUFJZ0gsaUJBQWlCLEVBQUUvSixNQUFNLENBQUNnSyxhQUFhLEdBQUcxTSxpQkFBUSxDQUFDMk0sT0FBTyxDQUFDRixpQkFBaUIsQ0FBQztJQUNqRixJQUFJbkcsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGFBQWEsRUFBRTRCLE1BQU0sQ0FBQzs7SUFFL0U7SUFDQSxJQUFJa0ssWUFBWSxHQUFHLEVBQUU7SUFDckIsS0FBSyxJQUFJZCxhQUFhLElBQUl4RixJQUFJLENBQUNDLE1BQU0sQ0FBQ3NHLFNBQVMsRUFBRTtNQUMvQyxJQUFJbkYsVUFBVSxHQUFHeEksZUFBZSxDQUFDNk0sb0JBQW9CLENBQUNELGFBQWEsQ0FBQztNQUNwRXBFLFVBQVUsQ0FBQ0UsZUFBZSxDQUFDbkMsVUFBVSxDQUFDO01BQ3RDbUgsWUFBWSxDQUFDcEIsSUFBSSxDQUFDOUQsVUFBVSxDQUFDO0lBQy9COztJQUVBO0lBQ0EsSUFBSSxDQUFDdUQsWUFBWSxFQUFFOztNQUVqQjtNQUNBLEtBQUssSUFBSXZELFVBQVUsSUFBSWtGLFlBQVksRUFBRTtRQUNuQ2xGLFVBQVUsQ0FBQytELFVBQVUsQ0FBQzNGLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoQzRCLFVBQVUsQ0FBQ2dFLGtCQUFrQixDQUFDNUYsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hDNEIsVUFBVSxDQUFDaUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQ2xDakUsVUFBVSxDQUFDa0Usb0JBQW9CLENBQUMsQ0FBQyxDQUFDO01BQ3BDOztNQUVBO01BQ0F0RixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUNoSCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsYUFBYSxFQUFFNEIsTUFBTSxDQUFDO01BQzNFLElBQUk0RCxJQUFJLENBQUNDLE1BQU0sQ0FBQ0UsY0FBYyxFQUFFO1FBQzlCLEtBQUssSUFBSXFGLGFBQWEsSUFBSXhGLElBQUksQ0FBQ0MsTUFBTSxDQUFDRSxjQUFjLEVBQUU7VUFDcEQsSUFBSWlCLFVBQVUsR0FBR3hJLGVBQWUsQ0FBQzZNLG9CQUFvQixDQUFDRCxhQUFhLENBQUM7O1VBRXBFO1VBQ0EsS0FBSyxJQUFJRyxhQUFhLElBQUlXLFlBQVksRUFBRTtZQUN0QyxJQUFJWCxhQUFhLENBQUNWLFFBQVEsQ0FBQyxDQUFDLEtBQUs3RCxVQUFVLENBQUM2RCxRQUFRLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQztZQUNsRSxJQUFJN0QsVUFBVSxDQUFDeEIsVUFBVSxDQUFDLENBQUMsS0FBS3JHLFNBQVMsRUFBRW9NLGFBQWEsQ0FBQ1IsVUFBVSxDQUFDL0QsVUFBVSxDQUFDeEIsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUM1RixJQUFJd0IsVUFBVSxDQUFDdkIsa0JBQWtCLENBQUMsQ0FBQyxLQUFLdEcsU0FBUyxFQUFFb00sYUFBYSxDQUFDUCxrQkFBa0IsQ0FBQ2hFLFVBQVUsQ0FBQ3ZCLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUNwSCxJQUFJdUIsVUFBVSxDQUFDd0Usb0JBQW9CLENBQUMsQ0FBQyxLQUFLck0sU0FBUyxFQUFFb00sYUFBYSxDQUFDTixvQkFBb0IsQ0FBQ2pFLFVBQVUsQ0FBQ3dFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztZQUMxSCxJQUFJeEUsVUFBVSxDQUFDb0Ysb0JBQW9CLENBQUMsQ0FBQyxLQUFLak4sU0FBUyxFQUFFb00sYUFBYSxDQUFDTCxvQkFBb0IsQ0FBQ2xFLFVBQVUsQ0FBQ29GLG9CQUFvQixDQUFDLENBQUMsQ0FBQztVQUM1SDtRQUNGO01BQ0Y7SUFDRjs7SUFFQTtJQUNBLElBQUl2RixhQUFhLEdBQUcsSUFBSSxDQUFDaEksWUFBWSxDQUFDa0csVUFBVSxDQUFDO0lBQ2pELElBQUksQ0FBQzhCLGFBQWEsRUFBRTtNQUNsQkEsYUFBYSxHQUFHLENBQUMsQ0FBQztNQUNsQixJQUFJLENBQUNoSSxZQUFZLENBQUNrRyxVQUFVLENBQUMsR0FBRzhCLGFBQWE7SUFDL0M7SUFDQSxLQUFLLElBQUlHLFVBQVUsSUFBSWtGLFlBQVksRUFBRTtNQUNuQ3JGLGFBQWEsQ0FBQ0csVUFBVSxDQUFDNkQsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHN0QsVUFBVSxDQUFDSixVQUFVLENBQUMsQ0FBQztJQUNoRTs7SUFFQTtJQUNBLE9BQU9zRixZQUFZO0VBQ3JCOztFQUVBLE1BQU1HLGFBQWFBLENBQUN0SCxVQUFrQixFQUFFQyxhQUFxQixFQUFFdUYsWUFBc0IsRUFBNkI7SUFDaEgsSUFBQXRGLGVBQU0sRUFBQ0YsVUFBVSxJQUFJLENBQUMsQ0FBQztJQUN2QixJQUFBRSxlQUFNLEVBQUNELGFBQWEsSUFBSSxDQUFDLENBQUM7SUFDMUIsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDOEIsZUFBZSxDQUFDL0IsVUFBVSxFQUFFLENBQUNDLGFBQWEsQ0FBQyxFQUFFdUYsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ25GOztFQUVBLE1BQU0rQixnQkFBZ0JBLENBQUN2SCxVQUFrQixFQUFFNkcsS0FBYyxFQUE2Qjs7SUFFcEY7SUFDQSxJQUFJaEcsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGdCQUFnQixFQUFFLEVBQUNzRixhQUFhLEVBQUVYLFVBQVUsRUFBRTZHLEtBQUssRUFBRUEsS0FBSyxFQUFDLENBQUM7O0lBRXJIO0lBQ0EsSUFBSTVFLFVBQVUsR0FBRyxJQUFJQyx5QkFBZ0IsQ0FBQyxDQUFDO0lBQ3ZDRCxVQUFVLENBQUNFLGVBQWUsQ0FBQ25DLFVBQVUsQ0FBQztJQUN0Q2lDLFVBQVUsQ0FBQ0ssUUFBUSxDQUFDekIsSUFBSSxDQUFDQyxNQUFNLENBQUNtRyxhQUFhLENBQUM7SUFDOUNoRixVQUFVLENBQUN1RixVQUFVLENBQUMzRyxJQUFJLENBQUNDLE1BQU0sQ0FBQ2xELE9BQU8sQ0FBQztJQUMxQ3FFLFVBQVUsQ0FBQ3dGLFFBQVEsQ0FBQ1osS0FBSyxHQUFHQSxLQUFLLEdBQUd6TSxTQUFTLENBQUM7SUFDOUM2SCxVQUFVLENBQUMrRCxVQUFVLENBQUMzRixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDaEM0QixVQUFVLENBQUNnRSxrQkFBa0IsQ0FBQzVGLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4QzRCLFVBQVUsQ0FBQ2lFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztJQUNsQ2pFLFVBQVUsQ0FBQ3lGLFNBQVMsQ0FBQyxLQUFLLENBQUM7SUFDM0J6RixVQUFVLENBQUNrRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFDbEMsT0FBT2xFLFVBQVU7RUFDbkI7O0VBRUEsTUFBTTBGLGtCQUFrQkEsQ0FBQzNILFVBQWtCLEVBQUVDLGFBQXFCLEVBQUU0RyxLQUFhLEVBQWlCO0lBQ2hHLE1BQU0sSUFBSSxDQUFDaE4sTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGVBQWUsRUFBRSxFQUFDK0csS0FBSyxFQUFFLEVBQUNDLEtBQUssRUFBRXJDLFVBQVUsRUFBRXVDLEtBQUssRUFBRXRDLGFBQWEsRUFBQyxFQUFFNEcsS0FBSyxFQUFFQSxLQUFLLEVBQUMsQ0FBQztFQUNsSTs7RUFFQSxNQUFNZSxNQUFNQSxDQUFDQyxLQUF5QyxFQUE2Qjs7SUFFakY7SUFDQSxNQUFNQyxlQUFlLEdBQUdwTyxxQkFBWSxDQUFDcU8sZ0JBQWdCLENBQUNGLEtBQUssQ0FBQzs7SUFFNUQ7SUFDQSxJQUFJRyxhQUFhLEdBQUdGLGVBQWUsQ0FBQ0csZ0JBQWdCLENBQUMsQ0FBQztJQUN0RCxJQUFJQyxVQUFVLEdBQUdKLGVBQWUsQ0FBQ0ssYUFBYSxDQUFDLENBQUM7SUFDaEQsSUFBSUMsV0FBVyxHQUFHTixlQUFlLENBQUNPLGNBQWMsQ0FBQyxDQUFDO0lBQ2xEUCxlQUFlLENBQUNRLGdCQUFnQixDQUFDbE8sU0FBUyxDQUFDO0lBQzNDME4sZUFBZSxDQUFDUyxhQUFhLENBQUNuTyxTQUFTLENBQUM7SUFDeEMwTixlQUFlLENBQUNVLGNBQWMsQ0FBQ3BPLFNBQVMsQ0FBQzs7SUFFekM7SUFDQSxJQUFJcU8sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDQyxlQUFlLENBQUMsSUFBSUMsNEJBQW1CLENBQUMsQ0FBQyxDQUFDQyxVQUFVLENBQUNuUCxlQUFlLENBQUNvUCxlQUFlLENBQUNmLGVBQWUsQ0FBQ2dCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztJQUV6STtJQUNBLElBQUlDLEdBQUcsR0FBRyxFQUFFO0lBQ1osSUFBSUMsTUFBTSxHQUFHLElBQUlDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLEtBQUssSUFBSUMsUUFBUSxJQUFJVCxTQUFTLEVBQUU7TUFDOUIsSUFBSSxDQUFDTyxNQUFNLENBQUNwUSxHQUFHLENBQUNzUSxRQUFRLENBQUNDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNqQ0osR0FBRyxDQUFDaEQsSUFBSSxDQUFDbUQsUUFBUSxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzFCSCxNQUFNLENBQUNJLEdBQUcsQ0FBQ0YsUUFBUSxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDO01BQzlCO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJRSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSUMsUUFBUSxHQUFHLENBQUMsQ0FBQztJQUNqQixLQUFLLElBQUlDLEVBQUUsSUFBSVIsR0FBRyxFQUFFO01BQ2xCdFAsZUFBZSxDQUFDK1AsT0FBTyxDQUFDRCxFQUFFLEVBQUVGLEtBQUssRUFBRUMsUUFBUSxDQUFDO0lBQzlDOztJQUVBO0lBQ0EsSUFBSXhCLGVBQWUsQ0FBQzJCLGlCQUFpQixDQUFDLENBQUMsSUFBSXJCLFdBQVcsRUFBRTs7TUFFdEQ7TUFDQSxJQUFJc0IsY0FBYyxHQUFHLENBQUN0QixXQUFXLEdBQUdBLFdBQVcsQ0FBQ1UsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJYSwwQkFBaUIsQ0FBQyxDQUFDLEVBQUVmLFVBQVUsQ0FBQ25QLGVBQWUsQ0FBQ29QLGVBQWUsQ0FBQ2YsZUFBZSxDQUFDZ0IsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3JKLElBQUljLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQ0MsYUFBYSxDQUFDSCxjQUFjLENBQUM7O01BRXREO01BQ0EsSUFBSUksU0FBUyxHQUFHLEVBQUU7TUFDbEIsS0FBSyxJQUFJQyxNQUFNLElBQUlILE9BQU8sRUFBRTtRQUMxQixJQUFJLENBQUNFLFNBQVMsQ0FBQzlHLFFBQVEsQ0FBQytHLE1BQU0sQ0FBQ1osS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1VBQ3ZDMVAsZUFBZSxDQUFDK1AsT0FBTyxDQUFDTyxNQUFNLENBQUNaLEtBQUssQ0FBQyxDQUFDLEVBQUVFLEtBQUssRUFBRUMsUUFBUSxDQUFDO1VBQ3hEUSxTQUFTLENBQUMvRCxJQUFJLENBQUNnRSxNQUFNLENBQUNaLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDaEM7TUFDRjtJQUNGOztJQUVBO0lBQ0FyQixlQUFlLENBQUNRLGdCQUFnQixDQUFDTixhQUFhLENBQUM7SUFDL0NGLGVBQWUsQ0FBQ1MsYUFBYSxDQUFDTCxVQUFVLENBQUM7SUFDekNKLGVBQWUsQ0FBQ1UsY0FBYyxDQUFDSixXQUFXLENBQUM7O0lBRTNDO0lBQ0EsSUFBSTRCLFVBQVUsR0FBRyxFQUFFO0lBQ25CLEtBQUssSUFBSVQsRUFBRSxJQUFJUixHQUFHLEVBQUU7TUFDbEIsSUFBSWpCLGVBQWUsQ0FBQ21DLGFBQWEsQ0FBQ1YsRUFBRSxDQUFDLEVBQUVTLFVBQVUsQ0FBQ2pFLElBQUksQ0FBQ3dELEVBQUUsQ0FBQyxDQUFDO01BQ3RELElBQUlBLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsS0FBSzlQLFNBQVMsRUFBRW1QLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUN1QyxNQUFNLENBQUNaLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUN2RyxPQUFPLENBQUNrSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDNUc7SUFDQVIsR0FBRyxHQUFHaUIsVUFBVTs7SUFFaEI7SUFDQSxLQUFLLElBQUlULEVBQUUsSUFBSVIsR0FBRyxFQUFFO01BQ2xCLElBQUlRLEVBQUUsQ0FBQ2EsY0FBYyxDQUFDLENBQUMsSUFBSWIsRUFBRSxDQUFDVyxRQUFRLENBQUMsQ0FBQyxLQUFLOVAsU0FBUyxJQUFJLENBQUNtUCxFQUFFLENBQUNhLGNBQWMsQ0FBQyxDQUFDLElBQUliLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsS0FBSzlQLFNBQVMsRUFBRTtRQUM3R2lRLE9BQU8sQ0FBQ0MsS0FBSyxDQUFDLDhFQUE4RSxDQUFDO1FBQzdGLE9BQU8sSUFBSSxDQUFDMUMsTUFBTSxDQUFDRSxlQUFlLENBQUM7TUFDckM7SUFDRjs7SUFFQTtJQUNBLElBQUlBLGVBQWUsQ0FBQ3lDLFNBQVMsQ0FBQyxDQUFDLElBQUl6QyxlQUFlLENBQUN5QyxTQUFTLENBQUMsQ0FBQyxDQUFDckYsTUFBTSxHQUFHLENBQUMsRUFBRTtNQUN6RSxJQUFJc0YsT0FBTyxHQUFHLElBQUlDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7TUFDekIsS0FBSyxJQUFJbEIsRUFBRSxJQUFJUixHQUFHLEVBQUV5QixPQUFPLENBQUNoUixHQUFHLENBQUMrUCxFQUFFLENBQUNtQixPQUFPLENBQUMsQ0FBQyxFQUFFbkIsRUFBRSxDQUFDO01BQ2pELElBQUlvQixVQUFVLEdBQUcsRUFBRTtNQUNuQixLQUFLLElBQUlDLElBQUksSUFBSTlDLGVBQWUsQ0FBQ3lDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSUMsT0FBTyxDQUFDM1IsR0FBRyxDQUFDK1IsSUFBSSxDQUFDLEVBQUVELFVBQVUsQ0FBQzVFLElBQUksQ0FBQ3lFLE9BQU8sQ0FBQzNSLEdBQUcsQ0FBQytSLElBQUksQ0FBQyxDQUFDO01BQ3ZHN0IsR0FBRyxHQUFHNEIsVUFBVTtJQUNsQjtJQUNBLE9BQU81QixHQUFHO0VBQ1o7O0VBRUEsTUFBTThCLFlBQVlBLENBQUNoRCxLQUFvQyxFQUE2Qjs7SUFFbEY7SUFDQSxNQUFNQyxlQUFlLEdBQUdwTyxxQkFBWSxDQUFDb1Isc0JBQXNCLENBQUNqRCxLQUFLLENBQUM7O0lBRWxFO0lBQ0EsSUFBSSxDQUFDcE8sZUFBZSxDQUFDc1IsWUFBWSxDQUFDakQsZUFBZSxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNZLGVBQWUsQ0FBQ1osZUFBZSxDQUFDOztJQUVoRztJQUNBLElBQUlXLFNBQVMsR0FBRyxFQUFFO0lBQ2xCLEtBQUssSUFBSWMsRUFBRSxJQUFJLE1BQU0sSUFBSSxDQUFDM0IsTUFBTSxDQUFDRSxlQUFlLENBQUNrRCxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUU7TUFDOUQsS0FBSyxJQUFJOUIsUUFBUSxJQUFJSyxFQUFFLENBQUMwQixlQUFlLENBQUNuRCxlQUFlLENBQUMsRUFBRTtRQUN4RFcsU0FBUyxDQUFDMUMsSUFBSSxDQUFDbUQsUUFBUSxDQUFDO01BQzFCO0lBQ0Y7O0lBRUEsT0FBT1QsU0FBUztFQUNsQjs7RUFFQSxNQUFNeUMsVUFBVUEsQ0FBQ3JELEtBQWtDLEVBQWlDOztJQUVsRjtJQUNBLE1BQU1DLGVBQWUsR0FBR3BPLHFCQUFZLENBQUN5UixvQkFBb0IsQ0FBQ3RELEtBQUssQ0FBQzs7SUFFaEU7SUFDQSxJQUFJLENBQUNwTyxlQUFlLENBQUNzUixZQUFZLENBQUNqRCxlQUFlLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQytCLGFBQWEsQ0FBQy9CLGVBQWUsQ0FBQzs7SUFFOUY7SUFDQSxJQUFJOEIsT0FBTyxHQUFHLEVBQUU7SUFDaEIsS0FBSyxJQUFJTCxFQUFFLElBQUksTUFBTSxJQUFJLENBQUMzQixNQUFNLENBQUNFLGVBQWUsQ0FBQ2tELFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUM5RCxLQUFLLElBQUlqQixNQUFNLElBQUlSLEVBQUUsQ0FBQzZCLGFBQWEsQ0FBQ3RELGVBQWUsQ0FBQyxFQUFFO1FBQ3BEOEIsT0FBTyxDQUFDN0QsSUFBSSxDQUFDZ0UsTUFBTSxDQUFDO01BQ3RCO0lBQ0Y7O0lBRUEsT0FBT0gsT0FBTztFQUNoQjs7RUFFQSxNQUFNeUIsYUFBYUEsQ0FBQ0MsR0FBRyxHQUFHLEtBQUssRUFBbUI7SUFDaEQsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDelIsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGdCQUFnQixFQUFFLEVBQUNpUSxHQUFHLEVBQUVBLEdBQUcsRUFBQyxDQUFDLEVBQUV4SyxNQUFNLENBQUN5SyxnQkFBZ0I7RUFDOUc7O0VBRUEsTUFBTUMsYUFBYUEsQ0FBQ0MsVUFBa0IsRUFBbUI7SUFDdkQsSUFBSTVLLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFDa1EsZ0JBQWdCLEVBQUVFLFVBQVUsRUFBQyxDQUFDO0lBQzFHLE9BQU81SyxJQUFJLENBQUNDLE1BQU0sQ0FBQzRLLFlBQVk7RUFDakM7O0VBRUEsTUFBTUMsZUFBZUEsQ0FBQ0wsR0FBRyxHQUFHLEtBQUssRUFBNkI7SUFDNUQsT0FBTyxNQUFNLElBQUksQ0FBQ00sa0JBQWtCLENBQUNOLEdBQUcsQ0FBQztFQUMzQzs7RUFFQSxNQUFNTyxlQUFlQSxDQUFDQyxTQUEyQixFQUF1Qzs7SUFFdEY7SUFDQSxJQUFJQyxZQUFZLEdBQUdELFNBQVMsQ0FBQ0UsR0FBRyxDQUFDLENBQUFDLFFBQVEsTUFBSyxFQUFDQyxTQUFTLEVBQUVELFFBQVEsQ0FBQ0UsTUFBTSxDQUFDLENBQUMsRUFBRUMsU0FBUyxFQUFFSCxRQUFRLENBQUNJLFlBQVksQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDOztJQUVsSDtJQUNBLElBQUl4TCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUNoSCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsbUJBQW1CLEVBQUUsRUFBQ2lSLGlCQUFpQixFQUFFUCxZQUFZLEVBQUMsQ0FBQzs7SUFFaEg7SUFDQSxJQUFJUSxZQUFZLEdBQUcsSUFBSUMsbUNBQTBCLENBQUMsQ0FBQztJQUNuREQsWUFBWSxDQUFDRSxTQUFTLENBQUM1TCxJQUFJLENBQUNDLE1BQU0sQ0FBQ3lDLE1BQU0sQ0FBQztJQUMxQ2dKLFlBQVksQ0FBQ0csY0FBYyxDQUFDck0sTUFBTSxDQUFDUSxJQUFJLENBQUNDLE1BQU0sQ0FBQzZMLEtBQUssQ0FBQyxDQUFDO0lBQ3RESixZQUFZLENBQUNLLGdCQUFnQixDQUFDdk0sTUFBTSxDQUFDUSxJQUFJLENBQUNDLE1BQU0sQ0FBQytMLE9BQU8sQ0FBQyxDQUFDO0lBQzFELE9BQU9OLFlBQVk7RUFDckI7O0VBRUEsTUFBTU8sNkJBQTZCQSxDQUFBLEVBQThCO0lBQy9ELE9BQU8sTUFBTSxJQUFJLENBQUNsQixrQkFBa0IsQ0FBQyxLQUFLLENBQUM7RUFDN0M7O0VBRUEsTUFBTW1CLFlBQVlBLENBQUNkLFFBQWdCLEVBQWlCO0lBQ2xELE9BQU8sSUFBSSxDQUFDcFMsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLFFBQVEsRUFBRSxFQUFDNlEsU0FBUyxFQUFFRCxRQUFRLEVBQUMsQ0FBQztFQUNqRjs7RUFFQSxNQUFNZSxVQUFVQSxDQUFDZixRQUFnQixFQUFpQjtJQUNoRCxPQUFPLElBQUksQ0FBQ3BTLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxNQUFNLEVBQUUsRUFBQzZRLFNBQVMsRUFBRUQsUUFBUSxFQUFDLENBQUM7RUFDL0U7O0VBRUEsTUFBTWdCLGNBQWNBLENBQUNoQixRQUFnQixFQUFvQjtJQUN2RCxJQUFJcEwsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLFFBQVEsRUFBRSxFQUFDNlEsU0FBUyxFQUFFRCxRQUFRLEVBQUMsQ0FBQztJQUN6RixPQUFPcEwsSUFBSSxDQUFDQyxNQUFNLENBQUNvTSxNQUFNLEtBQUssSUFBSTtFQUNwQzs7RUFFQSxNQUFNQyxTQUFTQSxDQUFDdFQsTUFBK0IsRUFBNkI7O0lBRTFFO0lBQ0EsTUFBTWdDLGdCQUFnQixHQUFHbkMscUJBQVksQ0FBQzBULHdCQUF3QixDQUFDdlQsTUFBTSxDQUFDO0lBQ3RFLElBQUlnQyxnQkFBZ0IsQ0FBQ3dSLFdBQVcsQ0FBQyxDQUFDLEtBQUtqVCxTQUFTLEVBQUV5QixnQkFBZ0IsQ0FBQ3lSLFdBQVcsQ0FBQyxJQUFJLENBQUM7SUFDcEYsSUFBSXpSLGdCQUFnQixDQUFDMFIsUUFBUSxDQUFDLENBQUMsS0FBSyxJQUFJLEtBQUksTUFBTSxJQUFJLENBQUNDLFVBQVUsQ0FBQyxDQUFDLEdBQUUsTUFBTSxJQUFJblQsb0JBQVcsQ0FBQyxtREFBbUQsQ0FBQzs7SUFFL0k7SUFDQSxJQUFJMkYsVUFBVSxHQUFHbkUsZ0JBQWdCLENBQUMwSyxlQUFlLENBQUMsQ0FBQztJQUNuRCxJQUFJdkcsVUFBVSxLQUFLNUYsU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyw2Q0FBNkMsQ0FBQztJQUNsRyxJQUFJMk0saUJBQWlCLEdBQUduTCxnQkFBZ0IsQ0FBQzRSLG9CQUFvQixDQUFDLENBQUMsS0FBS3JULFNBQVMsR0FBR0EsU0FBUyxHQUFHeUIsZ0JBQWdCLENBQUM0UixvQkFBb0IsQ0FBQyxDQUFDLENBQUNDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztJQUU5STtJQUNBLElBQUl6USxNQUFXLEdBQUcsQ0FBQyxDQUFDO0lBQ3BCQSxNQUFNLENBQUMwUSxZQUFZLEdBQUcsRUFBRTtJQUN4QixLQUFLLElBQUlDLFdBQVcsSUFBSS9SLGdCQUFnQixDQUFDZ1MsZUFBZSxDQUFDLENBQUMsRUFBRTtNQUMxRCxJQUFBM04sZUFBTSxFQUFDME4sV0FBVyxDQUFDL0wsVUFBVSxDQUFDLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQztNQUN0RSxJQUFBM0IsZUFBTSxFQUFDME4sV0FBVyxDQUFDRSxTQUFTLENBQUMsQ0FBQyxFQUFFLG1DQUFtQyxDQUFDO01BQ3BFN1EsTUFBTSxDQUFDMFEsWUFBWSxDQUFDNUgsSUFBSSxDQUFDLEVBQUVuSSxPQUFPLEVBQUVnUSxXQUFXLENBQUMvTCxVQUFVLENBQUMsQ0FBQyxFQUFFa00sTUFBTSxFQUFFSCxXQUFXLENBQUNFLFNBQVMsQ0FBQyxDQUFDLENBQUNFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdHO0lBQ0EsSUFBSW5TLGdCQUFnQixDQUFDb1Msa0JBQWtCLENBQUMsQ0FBQyxFQUFFaFIsTUFBTSxDQUFDaVIseUJBQXlCLEdBQUdyUyxnQkFBZ0IsQ0FBQ29TLGtCQUFrQixDQUFDLENBQUM7SUFDbkhoUixNQUFNLENBQUMwRCxhQUFhLEdBQUdYLFVBQVU7SUFDakMvQyxNQUFNLENBQUNrUixlQUFlLEdBQUduSCxpQkFBaUI7SUFDMUMvSixNQUFNLENBQUM0RixVQUFVLEdBQUdoSCxnQkFBZ0IsQ0FBQ3VTLFlBQVksQ0FBQyxDQUFDO0lBQ25ELElBQUl2UyxnQkFBZ0IsQ0FBQ3dTLGFBQWEsQ0FBQyxDQUFDLEtBQUtqVSxTQUFTLEVBQUU2QyxNQUFNLENBQUNxUixXQUFXLEdBQUd6UyxnQkFBZ0IsQ0FBQ3dTLGFBQWEsQ0FBQyxDQUFDLENBQUNMLFFBQVEsQ0FBQyxDQUFDO0lBQ3BIL1EsTUFBTSxDQUFDc1IsWUFBWSxHQUFHMVMsZ0JBQWdCLENBQUMwUixRQUFRLENBQUMsQ0FBQyxLQUFLLElBQUk7SUFDMUQsSUFBQXJOLGVBQU0sRUFBQ3JFLGdCQUFnQixDQUFDMlMsV0FBVyxDQUFDLENBQUMsS0FBS3BVLFNBQVMsSUFBSXlCLGdCQUFnQixDQUFDMlMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUkzUyxnQkFBZ0IsQ0FBQzJTLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xJdlIsTUFBTSxDQUFDd1IsUUFBUSxHQUFHNVMsZ0JBQWdCLENBQUMyUyxXQUFXLENBQUMsQ0FBQztJQUNoRHZSLE1BQU0sQ0FBQ3lSLFVBQVUsR0FBRyxJQUFJO0lBQ3hCelIsTUFBTSxDQUFDMFIsZUFBZSxHQUFHLElBQUk7SUFDN0IsSUFBSTlTLGdCQUFnQixDQUFDd1IsV0FBVyxDQUFDLENBQUMsRUFBRXBRLE1BQU0sQ0FBQzJSLFdBQVcsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUFBLEtBQzFEM1IsTUFBTSxDQUFDNFIsVUFBVSxHQUFHLElBQUk7O0lBRTdCO0lBQ0EsSUFBSWhULGdCQUFnQixDQUFDd1IsV0FBVyxDQUFDLENBQUMsSUFBSXhSLGdCQUFnQixDQUFDb1Msa0JBQWtCLENBQUMsQ0FBQyxJQUFJcFMsZ0JBQWdCLENBQUNvUyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMvSSxNQUFNLEdBQUcsQ0FBQyxFQUFFO01BQy9ILE1BQU0sSUFBSTdLLG9CQUFXLENBQUMsMEVBQTBFLENBQUM7SUFDbkc7O0lBRUE7SUFDQSxJQUFJeUcsTUFBTTtJQUNWLElBQUk7TUFDRixJQUFJRCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUNoSCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUNRLGdCQUFnQixDQUFDd1IsV0FBVyxDQUFDLENBQUMsR0FBRyxnQkFBZ0IsR0FBRyxVQUFVLEVBQUVwUSxNQUFNLENBQUM7TUFDaEk2RCxNQUFNLEdBQUdELElBQUksQ0FBQ0MsTUFBTTtJQUN0QixDQUFDLENBQUMsT0FBTzNELEdBQVEsRUFBRTtNQUNqQixJQUFJQSxHQUFHLENBQUNhLE9BQU8sQ0FBQ3FELE9BQU8sQ0FBQyxxQ0FBcUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSWhILG9CQUFXLENBQUMsNkJBQTZCLENBQUM7TUFDekgsTUFBTThDLEdBQUc7SUFDWDs7SUFFQTtJQUNBLElBQUk0TCxHQUFHO0lBQ1AsSUFBSStGLE1BQU0sR0FBR2pULGdCQUFnQixDQUFDd1IsV0FBVyxDQUFDLENBQUMsR0FBSXZNLE1BQU0sQ0FBQ2lPLFFBQVEsS0FBSzNVLFNBQVMsR0FBRzBHLE1BQU0sQ0FBQ2lPLFFBQVEsQ0FBQzdKLE1BQU0sR0FBRyxDQUFDLEdBQUtwRSxNQUFNLENBQUNrTyxHQUFHLEtBQUs1VSxTQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUU7SUFDL0ksSUFBSTBVLE1BQU0sR0FBRyxDQUFDLEVBQUUvRixHQUFHLEdBQUcsRUFBRTtJQUN4QixJQUFJa0csZ0JBQWdCLEdBQUdILE1BQU0sS0FBSyxDQUFDO0lBQ25DLEtBQUssSUFBSUksQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHSixNQUFNLEVBQUVJLENBQUMsRUFBRSxFQUFFO01BQy9CLElBQUkzRixFQUFFLEdBQUcsSUFBSTRGLHVCQUFjLENBQUMsQ0FBQztNQUM3QjFWLGVBQWUsQ0FBQzJWLGdCQUFnQixDQUFDdlQsZ0JBQWdCLEVBQUUwTixFQUFFLEVBQUUwRixnQkFBZ0IsQ0FBQztNQUN4RTFGLEVBQUUsQ0FBQzhGLG1CQUFtQixDQUFDLENBQUMsQ0FBQ2xOLGVBQWUsQ0FBQ25DLFVBQVUsQ0FBQztNQUNwRCxJQUFJZ0gsaUJBQWlCLEtBQUs1TSxTQUFTLElBQUk0TSxpQkFBaUIsQ0FBQzlCLE1BQU0sS0FBSyxDQUFDLEVBQUVxRSxFQUFFLENBQUM4RixtQkFBbUIsQ0FBQyxDQUFDLENBQUNDLG9CQUFvQixDQUFDdEksaUJBQWlCLENBQUM7TUFDdkkrQixHQUFHLENBQUNoRCxJQUFJLENBQUN3RCxFQUFFLENBQUM7SUFDZDs7SUFFQTtJQUNBLElBQUkxTixnQkFBZ0IsQ0FBQzBSLFFBQVEsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJLENBQUNySixJQUFJLENBQUMsQ0FBQzs7SUFFbEQ7SUFDQSxJQUFJckksZ0JBQWdCLENBQUN3UixXQUFXLENBQUMsQ0FBQyxFQUFFLE9BQU81VCxlQUFlLENBQUM4Vix3QkFBd0IsQ0FBQ3pPLE1BQU0sRUFBRWlJLEdBQUcsRUFBRWxOLGdCQUFnQixDQUFDLENBQUMrTCxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3ZILE9BQU9uTyxlQUFlLENBQUMrVixtQkFBbUIsQ0FBQzFPLE1BQU0sRUFBRWlJLEdBQUcsS0FBSzNPLFNBQVMsR0FBR0EsU0FBUyxHQUFHMk8sR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRWxOLGdCQUFnQixDQUFDLENBQUMrTCxNQUFNLENBQUMsQ0FBQztFQUNsSTs7RUFFQSxNQUFNNkgsV0FBV0EsQ0FBQzVWLE1BQStCLEVBQTJCOztJQUUxRTtJQUNBQSxNQUFNLEdBQUdILHFCQUFZLENBQUNnVywwQkFBMEIsQ0FBQzdWLE1BQU0sQ0FBQzs7SUFFeEQ7SUFDQSxJQUFJb0QsTUFBVyxHQUFHLENBQUMsQ0FBQztJQUNwQkEsTUFBTSxDQUFDVyxPQUFPLEdBQUcvRCxNQUFNLENBQUNnVSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDaE0sVUFBVSxDQUFDLENBQUM7SUFDekQ1RSxNQUFNLENBQUMwRCxhQUFhLEdBQUc5RyxNQUFNLENBQUMwTSxlQUFlLENBQUMsQ0FBQztJQUMvQ3RKLE1BQU0sQ0FBQ2tSLGVBQWUsR0FBR3RVLE1BQU0sQ0FBQzRULG9CQUFvQixDQUFDLENBQUM7SUFDdER4USxNQUFNLENBQUNpUCxTQUFTLEdBQUdyUyxNQUFNLENBQUM4VixXQUFXLENBQUMsQ0FBQztJQUN2QyxJQUFJOVYsTUFBTSxDQUFDd1UsYUFBYSxDQUFDLENBQUMsS0FBS2pVLFNBQVMsRUFBRTZDLE1BQU0sQ0FBQ3FSLFdBQVcsR0FBR3pVLE1BQU0sQ0FBQ3dVLGFBQWEsQ0FBQyxDQUFDO0lBQ3JGcFIsTUFBTSxDQUFDc1IsWUFBWSxHQUFHMVUsTUFBTSxDQUFDMFQsUUFBUSxDQUFDLENBQUMsS0FBSyxJQUFJO0lBQ2hELElBQUFyTixlQUFNLEVBQUNyRyxNQUFNLENBQUMyVSxXQUFXLENBQUMsQ0FBQyxLQUFLcFUsU0FBUyxJQUFJUCxNQUFNLENBQUMyVSxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSTNVLE1BQU0sQ0FBQzJVLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BHdlIsTUFBTSxDQUFDd1IsUUFBUSxHQUFHNVUsTUFBTSxDQUFDMlUsV0FBVyxDQUFDLENBQUM7SUFDdEN2UixNQUFNLENBQUM0RixVQUFVLEdBQUdoSixNQUFNLENBQUN1VSxZQUFZLENBQUMsQ0FBQztJQUN6Q25SLE1BQU0sQ0FBQzRSLFVBQVUsR0FBRyxJQUFJO0lBQ3hCNVIsTUFBTSxDQUFDeVIsVUFBVSxHQUFHLElBQUk7SUFDeEJ6UixNQUFNLENBQUMwUixlQUFlLEdBQUcsSUFBSTs7SUFFN0I7SUFDQSxJQUFJOU4sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGNBQWMsRUFBRTRCLE1BQU0sQ0FBQztJQUNoRixJQUFJNkQsTUFBTSxHQUFHRCxJQUFJLENBQUNDLE1BQU07O0lBRXhCO0lBQ0EsSUFBSWpILE1BQU0sQ0FBQzBULFFBQVEsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJLENBQUNySixJQUFJLENBQUMsQ0FBQzs7SUFFeEM7SUFDQSxJQUFJcUYsRUFBRSxHQUFHOVAsZUFBZSxDQUFDMlYsZ0JBQWdCLENBQUN2VixNQUFNLEVBQUVPLFNBQVMsRUFBRSxJQUFJLENBQUM7SUFDbEVYLGVBQWUsQ0FBQytWLG1CQUFtQixDQUFDMU8sTUFBTSxFQUFFeUksRUFBRSxFQUFFLElBQUksRUFBRTFQLE1BQU0sQ0FBQztJQUM3RDBQLEVBQUUsQ0FBQzhGLG1CQUFtQixDQUFDLENBQUMsQ0FBQ3hCLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMrQixTQUFTLENBQUNyRyxFQUFFLENBQUM4RixtQkFBbUIsQ0FBQyxDQUFDLENBQUN2QixTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvRixPQUFPdkUsRUFBRTtFQUNYOztFQUVBLE1BQU1zRyxhQUFhQSxDQUFDaFcsTUFBK0IsRUFBNkI7O0lBRTlFO0lBQ0EsTUFBTWdDLGdCQUFnQixHQUFHbkMscUJBQVksQ0FBQ29XLDRCQUE0QixDQUFDalcsTUFBTSxDQUFDOztJQUUxRTtJQUNBLElBQUlrVyxPQUFPLEdBQUcsSUFBSXRGLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBRTtJQUMxQixJQUFJNU8sZ0JBQWdCLENBQUMwSyxlQUFlLENBQUMsQ0FBQyxLQUFLbk0sU0FBUyxFQUFFO01BQ3BELElBQUl5QixnQkFBZ0IsQ0FBQzRSLG9CQUFvQixDQUFDLENBQUMsS0FBS3JULFNBQVMsRUFBRTtRQUN6RDJWLE9BQU8sQ0FBQ3ZXLEdBQUcsQ0FBQ3FDLGdCQUFnQixDQUFDMEssZUFBZSxDQUFDLENBQUMsRUFBRTFLLGdCQUFnQixDQUFDNFIsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO01BQzFGLENBQUMsTUFBTTtRQUNMLElBQUl6RyxpQkFBaUIsR0FBRyxFQUFFO1FBQzFCK0ksT0FBTyxDQUFDdlcsR0FBRyxDQUFDcUMsZ0JBQWdCLENBQUMwSyxlQUFlLENBQUMsQ0FBQyxFQUFFUyxpQkFBaUIsQ0FBQztRQUNsRSxLQUFLLElBQUkvRSxVQUFVLElBQUksTUFBTSxJQUFJLENBQUNGLGVBQWUsQ0FBQ2xHLGdCQUFnQixDQUFDMEssZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFO1VBQ3JGLElBQUl0RSxVQUFVLENBQUN2QixrQkFBa0IsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFc0csaUJBQWlCLENBQUNqQixJQUFJLENBQUM5RCxVQUFVLENBQUM2RCxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3pGO01BQ0Y7SUFDRixDQUFDLE1BQU07TUFDTCxJQUFJTCxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUNqRixXQUFXLENBQUMsSUFBSSxDQUFDO01BQzNDLEtBQUssSUFBSUQsT0FBTyxJQUFJa0YsUUFBUSxFQUFFO1FBQzVCLElBQUlsRixPQUFPLENBQUNHLGtCQUFrQixDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7VUFDckMsSUFBSXNHLGlCQUFpQixHQUFHLEVBQUU7VUFDMUIrSSxPQUFPLENBQUN2VyxHQUFHLENBQUMrRyxPQUFPLENBQUN1RixRQUFRLENBQUMsQ0FBQyxFQUFFa0IsaUJBQWlCLENBQUM7VUFDbEQsS0FBSyxJQUFJL0UsVUFBVSxJQUFJMUIsT0FBTyxDQUFDd0IsZUFBZSxDQUFDLENBQUMsRUFBRTtZQUNoRCxJQUFJRSxVQUFVLENBQUN2QixrQkFBa0IsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFc0csaUJBQWlCLENBQUNqQixJQUFJLENBQUM5RCxVQUFVLENBQUM2RCxRQUFRLENBQUMsQ0FBQyxDQUFDO1VBQ3pGO1FBQ0Y7TUFDRjtJQUNGOztJQUVBO0lBQ0EsSUFBSWlELEdBQUcsR0FBRyxFQUFFO0lBQ1osS0FBSyxJQUFJL0ksVUFBVSxJQUFJK1AsT0FBTyxDQUFDQyxJQUFJLENBQUMsQ0FBQyxFQUFFOztNQUVyQztNQUNBLElBQUlsSCxJQUFJLEdBQUdqTixnQkFBZ0IsQ0FBQ2lOLElBQUksQ0FBQyxDQUFDO01BQ2xDQSxJQUFJLENBQUMzRyxlQUFlLENBQUNuQyxVQUFVLENBQUM7TUFDaEM4SSxJQUFJLENBQUNtSCxzQkFBc0IsQ0FBQyxLQUFLLENBQUM7O01BRWxDO01BQ0EsSUFBSW5ILElBQUksQ0FBQ29ILHNCQUFzQixDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDMUNwSCxJQUFJLENBQUN3RyxvQkFBb0IsQ0FBQ1MsT0FBTyxDQUFDbFgsR0FBRyxDQUFDbUgsVUFBVSxDQUFDLENBQUM7UUFDbEQsS0FBSyxJQUFJdUosRUFBRSxJQUFJLE1BQU0sSUFBSSxDQUFDNEcsZUFBZSxDQUFDckgsSUFBSSxDQUFDLEVBQUVDLEdBQUcsQ0FBQ2hELElBQUksQ0FBQ3dELEVBQUUsQ0FBQztNQUMvRDs7TUFFQTtNQUFBLEtBQ0s7UUFDSCxLQUFLLElBQUl0SixhQUFhLElBQUk4UCxPQUFPLENBQUNsWCxHQUFHLENBQUNtSCxVQUFVLENBQUMsRUFBRTtVQUNqRDhJLElBQUksQ0FBQ3dHLG9CQUFvQixDQUFDLENBQUNyUCxhQUFhLENBQUMsQ0FBQztVQUMxQyxLQUFLLElBQUlzSixFQUFFLElBQUksTUFBTSxJQUFJLENBQUM0RyxlQUFlLENBQUNySCxJQUFJLENBQUMsRUFBRUMsR0FBRyxDQUFDaEQsSUFBSSxDQUFDd0QsRUFBRSxDQUFDO1FBQy9EO01BQ0Y7SUFDRjs7SUFFQTtJQUNBLElBQUkxTixnQkFBZ0IsQ0FBQzBSLFFBQVEsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJLENBQUNySixJQUFJLENBQUMsQ0FBQztJQUNsRCxPQUFPNkUsR0FBRztFQUNaOztFQUVBLE1BQU1xSCxTQUFTQSxDQUFDQyxLQUFlLEVBQTZCO0lBQzFELElBQUlBLEtBQUssS0FBS2pXLFNBQVMsRUFBRWlXLEtBQUssR0FBRyxLQUFLO0lBQ3RDLElBQUl4UCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUNoSCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsWUFBWSxFQUFFLEVBQUNrVCxZQUFZLEVBQUUsQ0FBQzhCLEtBQUssRUFBQyxDQUFDO0lBQzlGLElBQUlBLEtBQUssRUFBRSxNQUFNLElBQUksQ0FBQ25NLElBQUksQ0FBQyxDQUFDO0lBQzVCLElBQUlwRCxNQUFNLEdBQUdELElBQUksQ0FBQ0MsTUFBTTtJQUN4QixJQUFJd1AsS0FBSyxHQUFHN1csZUFBZSxDQUFDOFYsd0JBQXdCLENBQUN6TyxNQUFNLENBQUM7SUFDNUQsSUFBSXdQLEtBQUssQ0FBQzFJLE1BQU0sQ0FBQyxDQUFDLEtBQUt4TixTQUFTLEVBQUUsT0FBTyxFQUFFO0lBQzNDLEtBQUssSUFBSW1QLEVBQUUsSUFBSStHLEtBQUssQ0FBQzFJLE1BQU0sQ0FBQyxDQUFDLEVBQUU7TUFDN0IyQixFQUFFLENBQUNnSCxZQUFZLENBQUMsQ0FBQ0YsS0FBSyxDQUFDO01BQ3ZCOUcsRUFBRSxDQUFDaUgsV0FBVyxDQUFDakgsRUFBRSxDQUFDa0gsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUNuQztJQUNBLE9BQU9ILEtBQUssQ0FBQzFJLE1BQU0sQ0FBQyxDQUFDO0VBQ3ZCOztFQUVBLE1BQU04SSxRQUFRQSxDQUFDQyxjQUEyQyxFQUFxQjtJQUM3RSxJQUFBelEsZUFBTSxFQUFDMFEsS0FBSyxDQUFDQyxPQUFPLENBQUNGLGNBQWMsQ0FBQyxFQUFFLHlEQUF5RCxDQUFDO0lBQ2hHLElBQUkxTCxRQUFRLEdBQUcsRUFBRTtJQUNqQixLQUFLLElBQUk2TCxZQUFZLElBQUlILGNBQWMsRUFBRTtNQUN2QyxJQUFJSSxRQUFRLEdBQUdELFlBQVksWUFBWTNCLHVCQUFjLEdBQUcyQixZQUFZLENBQUNFLFdBQVcsQ0FBQyxDQUFDLEdBQUdGLFlBQVk7TUFDakcsSUFBSWpRLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxVQUFVLEVBQUUsRUFBRTRWLEdBQUcsRUFBRUYsUUFBUSxDQUFDLENBQUMsQ0FBQztNQUN2RjlMLFFBQVEsQ0FBQ2MsSUFBSSxDQUFDbEYsSUFBSSxDQUFDQyxNQUFNLENBQUNvUSxPQUFPLENBQUM7SUFDcEM7SUFDQSxNQUFNLElBQUksQ0FBQ2hOLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQixPQUFPZSxRQUFRO0VBQ2pCOztFQUVBLE1BQU1rTSxhQUFhQSxDQUFDYixLQUFrQixFQUF3QjtJQUM1RCxJQUFJelAsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLG1CQUFtQixFQUFFO01BQzVFK1YsY0FBYyxFQUFFZCxLQUFLLENBQUNlLGdCQUFnQixDQUFDLENBQUM7TUFDeENDLGNBQWMsRUFBRWhCLEtBQUssQ0FBQ2lCLGdCQUFnQixDQUFDO0lBQ3pDLENBQUMsQ0FBQztJQUNGLE9BQU85WCxlQUFlLENBQUMrWCwwQkFBMEIsQ0FBQzNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDO0VBQ2hFOztFQUVBLE1BQU0yUSxPQUFPQSxDQUFDQyxhQUFxQixFQUF3QjtJQUN6RCxJQUFJN1EsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGVBQWUsRUFBRTtNQUN4RStWLGNBQWMsRUFBRU0sYUFBYTtNQUM3QkMsVUFBVSxFQUFFO0lBQ2QsQ0FBQyxDQUFDO0lBQ0YsTUFBTSxJQUFJLENBQUN6TixJQUFJLENBQUMsQ0FBQztJQUNqQixPQUFPekssZUFBZSxDQUFDOFYsd0JBQXdCLENBQUMxTyxJQUFJLENBQUNDLE1BQU0sQ0FBQztFQUM5RDs7RUFFQSxNQUFNOFEsU0FBU0EsQ0FBQ0MsV0FBbUIsRUFBcUI7SUFDdEQsSUFBSWhSLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxpQkFBaUIsRUFBRTtNQUMxRXlXLFdBQVcsRUFBRUQ7SUFDZixDQUFDLENBQUM7SUFDRixNQUFNLElBQUksQ0FBQzNOLElBQUksQ0FBQyxDQUFDO0lBQ2pCLE9BQU9yRCxJQUFJLENBQUNDLE1BQU0sQ0FBQ2lSLFlBQVk7RUFDakM7O0VBRUEsTUFBTUMsV0FBV0EsQ0FBQ2hVLE9BQWUsRUFBRWlVLGFBQWEsR0FBR0MsbUNBQTBCLENBQUNDLG1CQUFtQixFQUFFblMsVUFBVSxHQUFHLENBQUMsRUFBRUMsYUFBYSxHQUFHLENBQUMsRUFBbUI7SUFDckosSUFBSVksSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLE1BQU0sRUFBRTtNQUM3RCtXLElBQUksRUFBRXBVLE9BQU87TUFDYnFVLGNBQWMsRUFBRUosYUFBYSxLQUFLQyxtQ0FBMEIsQ0FBQ0MsbUJBQW1CLEdBQUcsT0FBTyxHQUFHLE1BQU07TUFDbkd4UixhQUFhLEVBQUVYLFVBQVU7TUFDekJpSCxhQUFhLEVBQUVoSDtJQUNuQixDQUFDLENBQUM7SUFDRixPQUFPWSxJQUFJLENBQUNDLE1BQU0sQ0FBQ3NMLFNBQVM7RUFDOUI7O0VBRUEsTUFBTWtHLGFBQWFBLENBQUN0VSxPQUFlLEVBQUVKLE9BQWUsRUFBRXdPLFNBQWlCLEVBQXlDO0lBQzlHLElBQUk7TUFDRixJQUFJdkwsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLFFBQVEsRUFBRSxFQUFDK1csSUFBSSxFQUFFcFUsT0FBTyxFQUFFSixPQUFPLEVBQUVBLE9BQU8sRUFBRXdPLFNBQVMsRUFBRUEsU0FBUyxFQUFDLENBQUM7TUFDM0gsSUFBSXRMLE1BQU0sR0FBR0QsSUFBSSxDQUFDQyxNQUFNO01BQ3hCLE9BQU8sSUFBSXlSLHFDQUE0QjtRQUNyQ3pSLE1BQU0sQ0FBQzBSLElBQUksR0FBRyxFQUFDQyxNQUFNLEVBQUUzUixNQUFNLENBQUMwUixJQUFJLEVBQUVFLEtBQUssRUFBRTVSLE1BQU0sQ0FBQzZSLEdBQUcsRUFBRVYsYUFBYSxFQUFFblIsTUFBTSxDQUFDdVIsY0FBYyxLQUFLLE1BQU0sR0FBR0gsbUNBQTBCLENBQUNVLGtCQUFrQixHQUFHVixtQ0FBMEIsQ0FBQ0MsbUJBQW1CLEVBQUUzUSxPQUFPLEVBQUVWLE1BQU0sQ0FBQ1UsT0FBTyxFQUFDLEdBQUcsRUFBQ2lSLE1BQU0sRUFBRSxLQUFLO01BQ3BQLENBQUM7SUFDSCxDQUFDLENBQUMsT0FBT2xVLENBQU0sRUFBRTtNQUNmLElBQUlBLENBQUMsQ0FBQ0wsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUlxVSxxQ0FBNEIsQ0FBQyxFQUFDRSxNQUFNLEVBQUUsS0FBSyxFQUFDLENBQUM7TUFDaEYsTUFBTWxVLENBQUM7SUFDVDtFQUNGOztFQUVBLE1BQU1zVSxRQUFRQSxDQUFDQyxNQUFjLEVBQW1CO0lBQzlDLElBQUk7TUFDRixPQUFPLENBQUMsTUFBTSxJQUFJLENBQUNqWixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsWUFBWSxFQUFFLEVBQUMwWCxJQUFJLEVBQUVELE1BQU0sRUFBQyxDQUFDLEVBQUVoUyxNQUFNLENBQUNrUyxNQUFNO0lBQ3BHLENBQUMsQ0FBQyxPQUFPelUsQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxZQUFZTix1QkFBYyxJQUFJTSxDQUFDLENBQUNMLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUlLLENBQUMsQ0FBQ1AsT0FBTyxDQUFDZ0YsUUFBUSxDQUFDLDBCQUEwQixDQUFDLEVBQUV6RSxDQUFDLEdBQUcsSUFBSU4sdUJBQWMsQ0FBQyw0QkFBNEIsRUFBRU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxFQUFFSyxDQUFDLENBQUNKLFlBQVksQ0FBQyxDQUFDLEVBQUVJLENBQUMsQ0FBQ0gsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUU7TUFDak4sTUFBTUcsQ0FBQztJQUNUO0VBQ0Y7O0VBRUEsTUFBTTBVLFVBQVVBLENBQUNILE1BQWMsRUFBRUksS0FBYSxFQUFFdFYsT0FBZSxFQUEwQjtJQUN2RixJQUFJOztNQUVGO01BQ0EsSUFBSWlELElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxjQUFjLEVBQUUsRUFBQzBYLElBQUksRUFBRUQsTUFBTSxFQUFFRSxNQUFNLEVBQUVFLEtBQUssRUFBRXRWLE9BQU8sRUFBRUEsT0FBTyxFQUFDLENBQUM7O01BRXpIO01BQ0EsSUFBSXVWLEtBQUssR0FBRyxJQUFJQyxzQkFBYSxDQUFDLENBQUM7TUFDL0JELEtBQUssQ0FBQ0UsU0FBUyxDQUFDLElBQUksQ0FBQztNQUNyQkYsS0FBSyxDQUFDRyxtQkFBbUIsQ0FBQ3pTLElBQUksQ0FBQ0MsTUFBTSxDQUFDeVMsYUFBYSxDQUFDO01BQ3BESixLQUFLLENBQUMzQyxXQUFXLENBQUMzUCxJQUFJLENBQUNDLE1BQU0sQ0FBQzBTLE9BQU8sQ0FBQztNQUN0Q0wsS0FBSyxDQUFDTSxpQkFBaUIsQ0FBQ3BULE1BQU0sQ0FBQ1EsSUFBSSxDQUFDQyxNQUFNLENBQUM0UyxRQUFRLENBQUMsQ0FBQztNQUNyRCxPQUFPUCxLQUFLO0lBQ2QsQ0FBQyxDQUFDLE9BQU81VSxDQUFNLEVBQUU7TUFDZixJQUFJQSxDQUFDLFlBQVlOLHVCQUFjLElBQUlNLENBQUMsQ0FBQ0wsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSUssQ0FBQyxDQUFDUCxPQUFPLENBQUNnRixRQUFRLENBQUMsMEJBQTBCLENBQUMsRUFBRXpFLENBQUMsR0FBRyxJQUFJTix1QkFBYyxDQUFDLDRCQUE0QixFQUFFTSxDQUFDLENBQUNMLE9BQU8sQ0FBQyxDQUFDLEVBQUVLLENBQUMsQ0FBQ0osWUFBWSxDQUFDLENBQUMsRUFBRUksQ0FBQyxDQUFDSCxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtNQUNqTixNQUFNRyxDQUFDO0lBQ1Q7RUFDRjs7RUFFQSxNQUFNb1YsVUFBVUEsQ0FBQ2IsTUFBYyxFQUFFbFYsT0FBZSxFQUFFSSxPQUFnQixFQUFtQjtJQUNuRixJQUFJO01BQ0YsSUFBSTZDLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxjQUFjLEVBQUUsRUFBQzBYLElBQUksRUFBRUQsTUFBTSxFQUFFbFYsT0FBTyxFQUFFQSxPQUFPLEVBQUVJLE9BQU8sRUFBRUEsT0FBTyxFQUFDLENBQUM7TUFDNUgsT0FBTzZDLElBQUksQ0FBQ0MsTUFBTSxDQUFDc0wsU0FBUztJQUM5QixDQUFDLENBQUMsT0FBTzdOLENBQU0sRUFBRTtNQUNmLElBQUlBLENBQUMsWUFBWU4sdUJBQWMsSUFBSU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJSyxDQUFDLENBQUNQLE9BQU8sQ0FBQ2dGLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFekUsQ0FBQyxHQUFHLElBQUlOLHVCQUFjLENBQUMsNEJBQTRCLEVBQUVNLENBQUMsQ0FBQ0wsT0FBTyxDQUFDLENBQUMsRUFBRUssQ0FBQyxDQUFDSixZQUFZLENBQUMsQ0FBQyxFQUFFSSxDQUFDLENBQUNILFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFO01BQ2pOLE1BQU1HLENBQUM7SUFDVDtFQUNGOztFQUVBLE1BQU1xVixZQUFZQSxDQUFDZCxNQUFjLEVBQUVsVixPQUFlLEVBQUVJLE9BQTJCLEVBQUVvTyxTQUFpQixFQUEwQjtJQUMxSCxJQUFJOztNQUVGO01BQ0EsSUFBSXZMLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRTtRQUN6RTBYLElBQUksRUFBRUQsTUFBTTtRQUNabFYsT0FBTyxFQUFFQSxPQUFPO1FBQ2hCSSxPQUFPLEVBQUVBLE9BQU87UUFDaEJvTyxTQUFTLEVBQUVBO01BQ2IsQ0FBQyxDQUFDOztNQUVGO01BQ0EsSUFBSXFHLE1BQU0sR0FBRzVSLElBQUksQ0FBQ0MsTUFBTSxDQUFDMFIsSUFBSTtNQUM3QixJQUFJVyxLQUFLLEdBQUcsSUFBSUMsc0JBQWEsQ0FBQyxDQUFDO01BQy9CRCxLQUFLLENBQUNFLFNBQVMsQ0FBQ1osTUFBTSxDQUFDO01BQ3ZCLElBQUlBLE1BQU0sRUFBRTtRQUNWVSxLQUFLLENBQUNHLG1CQUFtQixDQUFDelMsSUFBSSxDQUFDQyxNQUFNLENBQUN5UyxhQUFhLENBQUM7UUFDcERKLEtBQUssQ0FBQzNDLFdBQVcsQ0FBQzNQLElBQUksQ0FBQ0MsTUFBTSxDQUFDMFMsT0FBTyxDQUFDO1FBQ3RDTCxLQUFLLENBQUNNLGlCQUFpQixDQUFDcFQsTUFBTSxDQUFDUSxJQUFJLENBQUNDLE1BQU0sQ0FBQzRTLFFBQVEsQ0FBQyxDQUFDO01BQ3ZEO01BQ0EsT0FBT1AsS0FBSztJQUNkLENBQUMsQ0FBQyxPQUFPNVUsQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxZQUFZTix1QkFBYyxJQUFJTSxDQUFDLENBQUNMLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUlLLENBQUMsQ0FBQ1AsT0FBTyxLQUFLLGNBQWMsRUFBRU8sQ0FBQyxHQUFHLElBQUlOLHVCQUFjLENBQUMsMENBQTBDLEVBQUUsQ0FBQyxDQUFDLENBQUM7TUFDN0osSUFBSU0sQ0FBQyxZQUFZTix1QkFBYyxJQUFJTSxDQUFDLENBQUNMLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUlLLENBQUMsQ0FBQ1AsT0FBTyxDQUFDZ0YsUUFBUSxDQUFDLDBCQUEwQixDQUFDLEVBQUV6RSxDQUFDLEdBQUcsSUFBSU4sdUJBQWMsQ0FBQyw0QkFBNEIsRUFBRU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxFQUFFSyxDQUFDLENBQUNKLFlBQVksQ0FBQyxDQUFDLEVBQUVJLENBQUMsQ0FBQ0gsWUFBWSxDQUFDLENBQUMsQ0FBQztNQUM5TSxNQUFNRyxDQUFDO0lBQ1Q7RUFDRjs7RUFFQSxNQUFNc1YsYUFBYUEsQ0FBQ2YsTUFBYyxFQUFFOVUsT0FBZ0IsRUFBbUI7SUFDckUsSUFBSTtNQUNGLElBQUk2QyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUNoSCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsaUJBQWlCLEVBQUUsRUFBQzBYLElBQUksRUFBRUQsTUFBTSxFQUFFOVUsT0FBTyxFQUFFQSxPQUFPLEVBQUMsQ0FBQztNQUM3RyxPQUFPNkMsSUFBSSxDQUFDQyxNQUFNLENBQUNzTCxTQUFTO0lBQzlCLENBQUMsQ0FBQyxPQUFPN04sQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxZQUFZTix1QkFBYyxJQUFJTSxDQUFDLENBQUNMLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUlLLENBQUMsQ0FBQ1AsT0FBTyxDQUFDZ0YsUUFBUSxDQUFDLDBCQUEwQixDQUFDLEVBQUV6RSxDQUFDLEdBQUcsSUFBSU4sdUJBQWMsQ0FBQyw0QkFBNEIsRUFBRU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxFQUFFSyxDQUFDLENBQUNKLFlBQVksQ0FBQyxDQUFDLEVBQUVJLENBQUMsQ0FBQ0gsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUU7TUFDak4sTUFBTUcsQ0FBQztJQUNUO0VBQ0Y7O0VBRUEsTUFBTXVWLGVBQWVBLENBQUNoQixNQUFjLEVBQUU5VSxPQUEyQixFQUFFb08sU0FBaUIsRUFBb0I7SUFDdEcsSUFBSTtNQUNGLElBQUl2TCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUNoSCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsbUJBQW1CLEVBQUU7UUFDNUUwWCxJQUFJLEVBQUVELE1BQU07UUFDWjlVLE9BQU8sRUFBRUEsT0FBTztRQUNoQm9PLFNBQVMsRUFBRUE7TUFDYixDQUFDLENBQUM7TUFDRixPQUFPdkwsSUFBSSxDQUFDQyxNQUFNLENBQUMwUixJQUFJO0lBQ3pCLENBQUMsQ0FBQyxPQUFPalUsQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxZQUFZTix1QkFBYyxJQUFJTSxDQUFDLENBQUNMLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUlLLENBQUMsQ0FBQ1AsT0FBTyxDQUFDZ0YsUUFBUSxDQUFDLDBCQUEwQixDQUFDLEVBQUV6RSxDQUFDLEdBQUcsSUFBSU4sdUJBQWMsQ0FBQyw0QkFBNEIsRUFBRU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxFQUFFSyxDQUFDLENBQUNKLFlBQVksQ0FBQyxDQUFDLEVBQUVJLENBQUMsQ0FBQ0gsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUU7TUFDak4sTUFBTUcsQ0FBQztJQUNUO0VBQ0Y7O0VBRUEsTUFBTXdWLHFCQUFxQkEsQ0FBQy9WLE9BQWdCLEVBQW1CO0lBQzdELElBQUk2QyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUNoSCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsbUJBQW1CLEVBQUU7TUFDNUVpUSxHQUFHLEVBQUUsSUFBSTtNQUNUdE4sT0FBTyxFQUFFQTtJQUNYLENBQUMsQ0FBQztJQUNGLE9BQU82QyxJQUFJLENBQUNDLE1BQU0sQ0FBQ3NMLFNBQVM7RUFDOUI7O0VBRUEsTUFBTTRILHNCQUFzQkEsQ0FBQ2hVLFVBQWtCLEVBQUUrTixNQUFjLEVBQUUvUCxPQUFnQixFQUFtQjtJQUNsRyxJQUFJNkMsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLG1CQUFtQixFQUFFO01BQzVFc0YsYUFBYSxFQUFFWCxVQUFVO01BQ3pCK04sTUFBTSxFQUFFQSxNQUFNLENBQUNDLFFBQVEsQ0FBQyxDQUFDO01BQ3pCaFEsT0FBTyxFQUFFQTtJQUNYLENBQUMsQ0FBQztJQUNGLE9BQU82QyxJQUFJLENBQUNDLE1BQU0sQ0FBQ3NMLFNBQVM7RUFDOUI7O0VBRUEsTUFBTWhMLGlCQUFpQkEsQ0FBQ3hELE9BQWUsRUFBRUksT0FBMkIsRUFBRW9PLFNBQWlCLEVBQStCOztJQUVwSDtJQUNBLElBQUl2TCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUNoSCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMscUJBQXFCLEVBQUU7TUFDOUV1QyxPQUFPLEVBQUVBLE9BQU87TUFDaEJJLE9BQU8sRUFBRUEsT0FBTztNQUNoQm9PLFNBQVMsRUFBRUE7SUFDYixDQUFDLENBQUM7O0lBRUY7SUFDQSxJQUFJcUcsTUFBTSxHQUFHNVIsSUFBSSxDQUFDQyxNQUFNLENBQUMwUixJQUFJO0lBQzdCLElBQUlXLEtBQUssR0FBRyxJQUFJYywyQkFBa0IsQ0FBQyxDQUFDO0lBQ3BDZCxLQUFLLENBQUNFLFNBQVMsQ0FBQ1osTUFBTSxDQUFDO0lBQ3ZCLElBQUlBLE1BQU0sRUFBRTtNQUNWVSxLQUFLLENBQUNlLHlCQUF5QixDQUFDN1QsTUFBTSxDQUFDUSxJQUFJLENBQUNDLE1BQU0sQ0FBQzZMLEtBQUssQ0FBQyxDQUFDO01BQzFEd0csS0FBSyxDQUFDZ0IsY0FBYyxDQUFDOVQsTUFBTSxDQUFDUSxJQUFJLENBQUNDLE1BQU0sQ0FBQ3NULEtBQUssQ0FBQyxDQUFDO0lBQ2pEO0lBQ0EsT0FBT2pCLEtBQUs7RUFDZDs7RUFFQSxNQUFNa0IsVUFBVUEsQ0FBQ3BQLFFBQWtCLEVBQXFCO0lBQ3RELE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQ3BMLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxjQUFjLEVBQUUsRUFBQzhKLEtBQUssRUFBRUYsUUFBUSxFQUFDLENBQUMsRUFBRW5FLE1BQU0sQ0FBQ3dULEtBQUs7RUFDeEc7O0VBRUEsTUFBTUMsVUFBVUEsQ0FBQ3RQLFFBQWtCLEVBQUVxUCxLQUFlLEVBQWlCO0lBQ25FLE1BQU0sSUFBSSxDQUFDemEsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGNBQWMsRUFBRSxFQUFDOEosS0FBSyxFQUFFRixRQUFRLEVBQUVxUCxLQUFLLEVBQUVBLEtBQUssRUFBQyxDQUFDO0VBQ2hHOztFQUVBLE1BQU1FLHFCQUFxQkEsQ0FBQ0MsWUFBdUIsRUFBcUM7SUFDdEYsSUFBSTVULElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxFQUFDcVosT0FBTyxFQUFFRCxZQUFZLEVBQUMsQ0FBQztJQUNyRyxJQUFJLENBQUM1VCxJQUFJLENBQUNDLE1BQU0sQ0FBQzRULE9BQU8sRUFBRSxPQUFPLEVBQUU7SUFDbkMsSUFBSUEsT0FBTyxHQUFHLEVBQUU7SUFDaEIsS0FBSyxJQUFJQyxRQUFRLElBQUk5VCxJQUFJLENBQUNDLE1BQU0sQ0FBQzRULE9BQU8sRUFBRTtNQUN4Q0EsT0FBTyxDQUFDM08sSUFBSSxDQUFDLElBQUk2TywrQkFBc0IsQ0FBQyxDQUFDLENBQUN0UyxRQUFRLENBQUNxUyxRQUFRLENBQUN2UyxLQUFLLENBQUMsQ0FBQ29GLFVBQVUsQ0FBQ21OLFFBQVEsQ0FBQy9XLE9BQU8sQ0FBQyxDQUFDaVgsY0FBYyxDQUFDRixRQUFRLENBQUNHLFdBQVcsQ0FBQyxDQUFDMVIsWUFBWSxDQUFDdVIsUUFBUSxDQUFDOVIsVUFBVSxDQUFDLENBQUM7SUFDeks7SUFDQSxPQUFPNlIsT0FBTztFQUNoQjs7RUFFQSxNQUFNSyxtQkFBbUJBLENBQUNuWCxPQUFlLEVBQUVrWCxXQUFvQixFQUFtQjtJQUNoRixJQUFJalUsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGtCQUFrQixFQUFFLEVBQUN1QyxPQUFPLEVBQUVBLE9BQU8sRUFBRWtYLFdBQVcsRUFBRUEsV0FBVyxFQUFDLENBQUM7SUFDMUgsT0FBT2pVLElBQUksQ0FBQ0MsTUFBTSxDQUFDc0IsS0FBSztFQUMxQjs7RUFFQSxNQUFNNFMsb0JBQW9CQSxDQUFDNVMsS0FBYSxFQUFFb0YsVUFBbUIsRUFBRTVKLE9BQTJCLEVBQUVpWCxjQUF1QixFQUFFQyxXQUErQixFQUFpQjtJQUNuSyxJQUFJalUsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLG1CQUFtQixFQUFFO01BQzVFK0csS0FBSyxFQUFFQSxLQUFLO01BQ1o2UyxXQUFXLEVBQUV6TixVQUFVO01BQ3ZCNUosT0FBTyxFQUFFQSxPQUFPO01BQ2hCc1gsZUFBZSxFQUFFTCxjQUFjO01BQy9CQyxXQUFXLEVBQUVBO0lBQ2YsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUssc0JBQXNCQSxDQUFDQyxRQUFnQixFQUFpQjtJQUM1RCxNQUFNLElBQUksQ0FBQ3ZiLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxxQkFBcUIsRUFBRSxFQUFDK0csS0FBSyxFQUFFZ1QsUUFBUSxFQUFDLENBQUM7RUFDekY7O0VBRUEsTUFBTUMsV0FBV0EsQ0FBQzlQLEdBQUcsRUFBRStQLGNBQWMsRUFBRTtJQUNyQyxNQUFNLElBQUksQ0FBQ3piLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxjQUFjLEVBQUUsRUFBQ2tLLEdBQUcsRUFBRUEsR0FBRyxFQUFFRSxRQUFRLEVBQUU2UCxjQUFjLEVBQUMsQ0FBQztFQUNyRzs7RUFFQSxNQUFNQyxhQUFhQSxDQUFDRCxjQUF3QixFQUFpQjtJQUMzRCxNQUFNLElBQUksQ0FBQ3piLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFDb0ssUUFBUSxFQUFFNlAsY0FBYyxFQUFDLENBQUM7RUFDN0Y7O0VBRUEsTUFBTUUsY0FBY0EsQ0FBQSxFQUFnQztJQUNsRCxJQUFJQyxJQUFJLEdBQUcsRUFBRTtJQUNiLElBQUk1VSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUNoSCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsa0JBQWtCLENBQUM7SUFDNUUsSUFBSXdGLElBQUksQ0FBQ0MsTUFBTSxDQUFDNFUsWUFBWSxFQUFFO01BQzVCLEtBQUssSUFBSUMsYUFBYSxJQUFJOVUsSUFBSSxDQUFDQyxNQUFNLENBQUM0VSxZQUFZLEVBQUU7UUFDbERELElBQUksQ0FBQzFQLElBQUksQ0FBQyxJQUFJNlAseUJBQWdCLENBQUM7VUFDN0JyUSxHQUFHLEVBQUVvUSxhQUFhLENBQUNwUSxHQUFHLEdBQUdvUSxhQUFhLENBQUNwUSxHQUFHLEdBQUduTCxTQUFTO1VBQ3REeU0sS0FBSyxFQUFFOE8sYUFBYSxDQUFDOU8sS0FBSyxHQUFHOE8sYUFBYSxDQUFDOU8sS0FBSyxHQUFHek0sU0FBUztVQUM1RGtiLGNBQWMsRUFBRUssYUFBYSxDQUFDbFE7UUFDaEMsQ0FBQyxDQUFDLENBQUM7TUFDTDtJQUNGO0lBQ0EsT0FBT2dRLElBQUk7RUFDYjs7RUFFQSxNQUFNSSxrQkFBa0JBLENBQUN0USxHQUFXLEVBQUVzQixLQUFhLEVBQWlCO0lBQ2xFLE1BQU0sSUFBSSxDQUFDaE4sTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLDZCQUE2QixFQUFFLEVBQUNrSyxHQUFHLEVBQUVBLEdBQUcsRUFBRXVQLFdBQVcsRUFBRWpPLEtBQUssRUFBQyxDQUFDO0VBQzlHOztFQUVBLE1BQU1pUCxhQUFhQSxDQUFDamMsTUFBc0IsRUFBbUI7SUFDM0RBLE1BQU0sR0FBR0gscUJBQVksQ0FBQzBULHdCQUF3QixDQUFDdlQsTUFBTSxDQUFDO0lBQ3RELElBQUlnSCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUNoSCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsVUFBVSxFQUFFO01BQ25FdUMsT0FBTyxFQUFFL0QsTUFBTSxDQUFDZ1UsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ2hNLFVBQVUsQ0FBQyxDQUFDO01BQ2pEa00sTUFBTSxFQUFFbFUsTUFBTSxDQUFDZ1UsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ0MsU0FBUyxDQUFDLENBQUMsR0FBR2pVLE1BQU0sQ0FBQ2dVLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNDLFNBQVMsQ0FBQyxDQUFDLENBQUNFLFFBQVEsQ0FBQyxDQUFDLEdBQUc1VCxTQUFTO01BQ2hIeUksVUFBVSxFQUFFaEosTUFBTSxDQUFDdVUsWUFBWSxDQUFDLENBQUM7TUFDakMySCxjQUFjLEVBQUVsYyxNQUFNLENBQUNtYyxnQkFBZ0IsQ0FBQyxDQUFDO01BQ3pDQyxjQUFjLEVBQUVwYyxNQUFNLENBQUNxYyxPQUFPLENBQUM7SUFDakMsQ0FBQyxDQUFDO0lBQ0YsT0FBT3JWLElBQUksQ0FBQ0MsTUFBTSxDQUFDcVYsR0FBRztFQUN4Qjs7RUFFQSxNQUFNQyxlQUFlQSxDQUFDRCxHQUFXLEVBQTJCO0lBQzFELElBQUFqVyxlQUFNLEVBQUNpVyxHQUFHLEVBQUUsMkJBQTJCLENBQUM7SUFDeEMsSUFBSXRWLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBQzhhLEdBQUcsRUFBRUEsR0FBRyxFQUFDLENBQUM7SUFDakYsSUFBSXRjLE1BQU0sR0FBRyxJQUFJd2MsdUJBQWMsQ0FBQyxFQUFDelksT0FBTyxFQUFFaUQsSUFBSSxDQUFDQyxNQUFNLENBQUNxVixHQUFHLENBQUN2WSxPQUFPLEVBQUVtUSxNQUFNLEVBQUUxTixNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDcVYsR0FBRyxDQUFDcEksTUFBTSxDQUFDLEVBQUMsQ0FBQztJQUMzR2xVLE1BQU0sQ0FBQ3VKLFlBQVksQ0FBQ3ZDLElBQUksQ0FBQ0MsTUFBTSxDQUFDcVYsR0FBRyxDQUFDdFQsVUFBVSxDQUFDO0lBQy9DaEosTUFBTSxDQUFDeWMsZ0JBQWdCLENBQUN6VixJQUFJLENBQUNDLE1BQU0sQ0FBQ3FWLEdBQUcsQ0FBQ0osY0FBYyxDQUFDO0lBQ3ZEbGMsTUFBTSxDQUFDMGMsT0FBTyxDQUFDMVYsSUFBSSxDQUFDQyxNQUFNLENBQUNxVixHQUFHLENBQUNGLGNBQWMsQ0FBQztJQUM5QyxJQUFJLEVBQUUsS0FBS3BjLE1BQU0sQ0FBQ2dVLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNoTSxVQUFVLENBQUMsQ0FBQyxFQUFFaEksTUFBTSxDQUFDZ1UsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ3JHLFVBQVUsQ0FBQ3BOLFNBQVMsQ0FBQztJQUN0RyxJQUFJLEVBQUUsS0FBS1AsTUFBTSxDQUFDdVUsWUFBWSxDQUFDLENBQUMsRUFBRXZVLE1BQU0sQ0FBQ3VKLFlBQVksQ0FBQ2hKLFNBQVMsQ0FBQztJQUNoRSxJQUFJLEVBQUUsS0FBS1AsTUFBTSxDQUFDbWMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFbmMsTUFBTSxDQUFDeWMsZ0JBQWdCLENBQUNsYyxTQUFTLENBQUM7SUFDeEUsSUFBSSxFQUFFLEtBQUtQLE1BQU0sQ0FBQ3FjLE9BQU8sQ0FBQyxDQUFDLEVBQUVyYyxNQUFNLENBQUMwYyxPQUFPLENBQUNuYyxTQUFTLENBQUM7SUFDdEQsT0FBT1AsTUFBTTtFQUNmOztFQUVBLE1BQU0yYyxZQUFZQSxDQUFDcmQsR0FBVyxFQUFtQjtJQUMvQyxJQUFJO01BQ0YsSUFBSTBILElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxlQUFlLEVBQUUsRUFBQ2xDLEdBQUcsRUFBRUEsR0FBRyxFQUFDLENBQUM7TUFDckYsT0FBTzBILElBQUksQ0FBQ0MsTUFBTSxDQUFDMlYsS0FBSyxLQUFLLEVBQUUsR0FBR3JjLFNBQVMsR0FBR3lHLElBQUksQ0FBQ0MsTUFBTSxDQUFDMlYsS0FBSztJQUNqRSxDQUFDLENBQUMsT0FBT2xZLENBQU0sRUFBRTtNQUNmLElBQUlBLENBQUMsWUFBWU4sdUJBQWMsSUFBSU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLE9BQU85RCxTQUFTO01BQ3hFLE1BQU1tRSxDQUFDO0lBQ1Q7RUFDRjs7RUFFQSxNQUFNbVksWUFBWUEsQ0FBQ3ZkLEdBQVcsRUFBRXdkLEdBQVcsRUFBaUI7SUFDMUQsTUFBTSxJQUFJLENBQUM5YyxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsZUFBZSxFQUFFLEVBQUNsQyxHQUFHLEVBQUVBLEdBQUcsRUFBRXNkLEtBQUssRUFBRUUsR0FBRyxFQUFDLENBQUM7RUFDeEY7O0VBRUEsTUFBTUMsV0FBV0EsQ0FBQ0MsVUFBa0IsRUFBRUMsZ0JBQTBCLEVBQUVDLGFBQXVCLEVBQWlCO0lBQ3hHLE1BQU0sSUFBSSxDQUFDbGQsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGNBQWMsRUFBRTtNQUM1RDJiLGFBQWEsRUFBRUgsVUFBVTtNQUN6Qkksb0JBQW9CLEVBQUVILGdCQUFnQjtNQUN0Q0ksY0FBYyxFQUFFSDtJQUNsQixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNSSxVQUFVQSxDQUFBLEVBQWtCO0lBQ2hDLE1BQU0sSUFBSSxDQUFDdGQsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGFBQWEsQ0FBQztFQUM5RDs7RUFFQSxNQUFNK2Isc0JBQXNCQSxDQUFBLEVBQXFCO0lBQy9DLElBQUl2VyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUNoSCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsYUFBYSxDQUFDO0lBQ3ZFLE9BQU93RixJQUFJLENBQUNDLE1BQU0sQ0FBQ3VXLHNCQUFzQixLQUFLLElBQUk7RUFDcEQ7O0VBRUEsTUFBTUMsZUFBZUEsQ0FBQSxFQUFnQztJQUNuRCxJQUFJelcsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGFBQWEsQ0FBQztJQUN2RSxJQUFJeUYsTUFBTSxHQUFHRCxJQUFJLENBQUNDLE1BQU07SUFDeEIsSUFBSXlXLElBQUksR0FBRyxJQUFJQywyQkFBa0IsQ0FBQyxDQUFDO0lBQ25DRCxJQUFJLENBQUNFLGFBQWEsQ0FBQzNXLE1BQU0sQ0FBQzRXLFFBQVEsQ0FBQztJQUNuQ0gsSUFBSSxDQUFDSSxVQUFVLENBQUM3VyxNQUFNLENBQUM4VyxLQUFLLENBQUM7SUFDN0JMLElBQUksQ0FBQ00sWUFBWSxDQUFDL1csTUFBTSxDQUFDZ1gsU0FBUyxDQUFDO0lBQ25DUCxJQUFJLENBQUNRLGtCQUFrQixDQUFDalgsTUFBTSxDQUFDc1QsS0FBSyxDQUFDO0lBQ3JDLE9BQU9tRCxJQUFJO0VBQ2I7O0VBRUEsTUFBTVMsZUFBZUEsQ0FBQSxFQUFvQjtJQUN2QyxJQUFJblgsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGtCQUFrQixFQUFFLEVBQUNrQyw0QkFBNEIsRUFBRSxJQUFJLEVBQUMsQ0FBQztJQUNsSCxJQUFJLENBQUN6RCxZQUFZLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLElBQUlnSCxNQUFNLEdBQUdELElBQUksQ0FBQ0MsTUFBTTtJQUN4QixPQUFPQSxNQUFNLENBQUNtWCxhQUFhO0VBQzdCOztFQUVBLE1BQU1DLFlBQVlBLENBQUNDLGFBQXVCLEVBQUVMLFNBQWlCLEVBQUU3YyxRQUFnQixFQUFtQjtJQUNoRyxJQUFJNEYsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGVBQWUsRUFBRTtNQUN4RTRjLGFBQWEsRUFBRUUsYUFBYTtNQUM1QkwsU0FBUyxFQUFFQSxTQUFTO01BQ3BCN2MsUUFBUSxFQUFFQTtJQUNaLENBQUMsQ0FBQztJQUNGLElBQUksQ0FBQ25CLFlBQVksR0FBRyxDQUFDLENBQUM7SUFDdEIsT0FBTytHLElBQUksQ0FBQ0MsTUFBTSxDQUFDbVgsYUFBYTtFQUNsQzs7RUFFQSxNQUFNRyxvQkFBb0JBLENBQUNELGFBQXVCLEVBQUVsZCxRQUFnQixFQUFxQztJQUN2RyxJQUFJNEYsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLHdCQUF3QixFQUFFLEVBQUM0YyxhQUFhLEVBQUVFLGFBQWEsRUFBRWxkLFFBQVEsRUFBRUEsUUFBUSxFQUFDLENBQUM7SUFDdEksSUFBSSxDQUFDbkIsWUFBWSxHQUFHLENBQUMsQ0FBQztJQUN0QixJQUFJdWUsUUFBUSxHQUFHLElBQUlDLGlDQUF3QixDQUFDLENBQUM7SUFDN0NELFFBQVEsQ0FBQzdRLFVBQVUsQ0FBQzNHLElBQUksQ0FBQ0MsTUFBTSxDQUFDbEQsT0FBTyxDQUFDO0lBQ3hDeWEsUUFBUSxDQUFDRSxjQUFjLENBQUMxWCxJQUFJLENBQUNDLE1BQU0sQ0FBQ21YLGFBQWEsQ0FBQztJQUNsRCxJQUFJSSxRQUFRLENBQUN4VyxVQUFVLENBQUMsQ0FBQyxDQUFDcUQsTUFBTSxLQUFLLENBQUMsRUFBRW1ULFFBQVEsQ0FBQzdRLFVBQVUsQ0FBQ3BOLFNBQVMsQ0FBQztJQUN0RSxJQUFJaWUsUUFBUSxDQUFDRyxjQUFjLENBQUMsQ0FBQyxDQUFDdFQsTUFBTSxLQUFLLENBQUMsRUFBRW1ULFFBQVEsQ0FBQ0UsY0FBYyxDQUFDbmUsU0FBUyxDQUFDO0lBQzlFLE9BQU9pZSxRQUFRO0VBQ2pCOztFQUVBLE1BQU1JLGlCQUFpQkEsQ0FBQSxFQUFvQjtJQUN6QyxJQUFJNVgsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLHNCQUFzQixDQUFDO0lBQ2hGLE9BQU93RixJQUFJLENBQUNDLE1BQU0sQ0FBQ3lXLElBQUk7RUFDekI7O0VBRUEsTUFBTW1CLGlCQUFpQkEsQ0FBQ1AsYUFBdUIsRUFBbUI7SUFDaEUsSUFBSSxDQUFDNWQsaUJBQVEsQ0FBQ3NXLE9BQU8sQ0FBQ3NILGFBQWEsQ0FBQyxFQUFFLE1BQU0sSUFBSTlkLG9CQUFXLENBQUMsOENBQThDLENBQUM7SUFDM0csSUFBSXdHLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxzQkFBc0IsRUFBRSxFQUFDa2MsSUFBSSxFQUFFWSxhQUFhLEVBQUMsQ0FBQztJQUN2RyxPQUFPdFgsSUFBSSxDQUFDQyxNQUFNLENBQUM2WCxTQUFTO0VBQzlCOztFQUVBLE1BQU1DLGlCQUFpQkEsQ0FBQ0MsYUFBcUIsRUFBcUM7SUFDaEYsSUFBSWhZLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxlQUFlLEVBQUUsRUFBQ3lXLFdBQVcsRUFBRStHLGFBQWEsRUFBQyxDQUFDO0lBQ3ZHLElBQUkvWCxNQUFNLEdBQUdELElBQUksQ0FBQ0MsTUFBTTtJQUN4QixJQUFJZ1ksVUFBVSxHQUFHLElBQUlDLGlDQUF3QixDQUFDLENBQUM7SUFDL0NELFVBQVUsQ0FBQ0Usc0JBQXNCLENBQUNsWSxNQUFNLENBQUNnUixXQUFXLENBQUM7SUFDckRnSCxVQUFVLENBQUNHLFdBQVcsQ0FBQ25ZLE1BQU0sQ0FBQ2lSLFlBQVksQ0FBQztJQUMzQyxPQUFPK0csVUFBVTtFQUNuQjs7RUFFQSxNQUFNSSxtQkFBbUJBLENBQUNDLG1CQUEyQixFQUFxQjtJQUN4RSxJQUFJdFksSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGlCQUFpQixFQUFFLEVBQUN5VyxXQUFXLEVBQUVxSCxtQkFBbUIsRUFBQyxDQUFDO0lBQy9HLE9BQU90WSxJQUFJLENBQUNDLE1BQU0sQ0FBQ2lSLFlBQVk7RUFDakM7O0VBRUEsTUFBTXFILGNBQWNBLENBQUNDLFdBQW1CLEVBQUVDLFdBQW1CLEVBQWlCO0lBQzVFLE9BQU8sSUFBSSxDQUFDemYsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLHdCQUF3QixFQUFFLEVBQUNrZSxZQUFZLEVBQUVGLFdBQVcsSUFBSSxFQUFFLEVBQUVHLFlBQVksRUFBRUYsV0FBVyxJQUFJLEVBQUUsRUFBQyxDQUFDO0VBQzlJOztFQUVBLE1BQU1HLElBQUlBLENBQUEsRUFBa0I7SUFDMUIsTUFBTSxJQUFJLENBQUM1ZixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsT0FBTyxDQUFDO0VBQ3hEOztFQUVBLE1BQU1xZSxLQUFLQSxDQUFDRCxJQUFJLEdBQUcsS0FBSyxFQUFpQjtJQUN2QyxNQUFNLEtBQUssQ0FBQ0MsS0FBSyxDQUFDRCxJQUFJLENBQUM7SUFDdkIsSUFBSUEsSUFBSSxLQUFLcmYsU0FBUyxFQUFFcWYsSUFBSSxHQUFHLEtBQUs7SUFDcEMsTUFBTSxJQUFJLENBQUNqZSxLQUFLLENBQUMsQ0FBQztJQUNsQixNQUFNLElBQUksQ0FBQzNCLE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxjQUFjLEVBQUUsRUFBQ3FDLGdCQUFnQixFQUFFK2IsSUFBSSxFQUFDLENBQUM7RUFDekY7O0VBRUEsTUFBTUUsUUFBUUEsQ0FBQSxFQUFxQjtJQUNqQyxJQUFJO01BQ0YsTUFBTSxJQUFJLENBQUM1ZCxpQkFBaUIsQ0FBQyxDQUFDO0lBQ2hDLENBQUMsQ0FBQyxPQUFPd0MsQ0FBTSxFQUFFO01BQ2YsT0FBT0EsQ0FBQyxZQUFZTix1QkFBYyxJQUFJTSxDQUFDLENBQUNMLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUlLLENBQUMsQ0FBQ1AsT0FBTyxDQUFDcUQsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZHO0lBQ0EsT0FBTyxLQUFLO0VBQ2Q7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU11WSxJQUFJQSxDQUFBLEVBQWtCO0lBQzFCLE1BQU0sSUFBSSxDQUFDcGUsS0FBSyxDQUFDLENBQUM7SUFDbEIsTUFBTSxJQUFJLENBQUMzQixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsYUFBYSxDQUFDO0VBQzlEOztFQUVBOztFQUVBLE1BQU1nTSxvQkFBb0JBLENBQUEsRUFBc0IsQ0FBRSxPQUFPLEtBQUssQ0FBQ0Esb0JBQW9CLENBQUMsQ0FBQyxDQUFFO0VBQ3ZGLE1BQU04QixLQUFLQSxDQUFDMkosTUFBYyxFQUEyQixDQUFFLE9BQU8sS0FBSyxDQUFDM0osS0FBSyxDQUFDMkosTUFBTSxDQUFDLENBQUU7RUFDbkYsTUFBTStHLG9CQUFvQkEsQ0FBQ2hTLEtBQW1DLEVBQXFDLENBQUUsT0FBTyxLQUFLLENBQUNnUyxvQkFBb0IsQ0FBQ2hTLEtBQUssQ0FBQyxDQUFFO0VBQy9JLE1BQU1pUyxvQkFBb0JBLENBQUNqUyxLQUFtQyxFQUFFLENBQUUsT0FBTyxLQUFLLENBQUNpUyxvQkFBb0IsQ0FBQ2pTLEtBQUssQ0FBQyxDQUFFO0VBQzVHLE1BQU1rUyxRQUFRQSxDQUFDbGdCLE1BQStCLEVBQTJCLENBQUUsT0FBTyxLQUFLLENBQUNrZ0IsUUFBUSxDQUFDbGdCLE1BQU0sQ0FBQyxDQUFFO0VBQzFHLE1BQU1tZ0IsT0FBT0EsQ0FBQ2xKLFlBQXFDLEVBQW1CLENBQUUsT0FBTyxLQUFLLENBQUNrSixPQUFPLENBQUNsSixZQUFZLENBQUMsQ0FBRTtFQUM1RyxNQUFNbUosU0FBU0EsQ0FBQ25ILE1BQWMsRUFBbUIsQ0FBRSxPQUFPLEtBQUssQ0FBQ21ILFNBQVMsQ0FBQ25ILE1BQU0sQ0FBQyxDQUFFO0VBQ25GLE1BQU1vSCxTQUFTQSxDQUFDcEgsTUFBYyxFQUFFcUgsSUFBWSxFQUFpQixDQUFFLE9BQU8sS0FBSyxDQUFDRCxTQUFTLENBQUNwSCxNQUFNLEVBQUVxSCxJQUFJLENBQUMsQ0FBRTs7RUFFckc7O0VBRUEsYUFBYUMsa0JBQWtCQSxDQUFDQyxXQUEyRixFQUFFdGIsUUFBaUIsRUFBRTlELFFBQWlCLEVBQTRCO0lBQzNMLElBQUlwQixNQUFNLEdBQUdKLGVBQWUsQ0FBQzZnQixlQUFlLENBQUNELFdBQVcsRUFBRXRiLFFBQVEsRUFBRTlELFFBQVEsQ0FBQztJQUM3RSxJQUFJcEIsTUFBTSxDQUFDMGdCLEdBQUcsRUFBRSxPQUFPOWdCLGVBQWUsQ0FBQytnQixxQkFBcUIsQ0FBQzNnQixNQUFNLENBQUMsQ0FBQztJQUNoRSxPQUFPLElBQUlKLGVBQWUsQ0FBQ0ksTUFBTSxDQUFDO0VBQ3pDOztFQUVBLGFBQXVCMmdCLHFCQUFxQkEsQ0FBQzNnQixNQUFtQyxFQUE0QjtJQUMxRyxJQUFBcUcsZUFBTSxFQUFDM0YsaUJBQVEsQ0FBQ3NXLE9BQU8sQ0FBQ2hYLE1BQU0sQ0FBQzBnQixHQUFHLENBQUMsRUFBRSx3REFBd0QsQ0FBQzs7SUFFOUY7SUFDQSxJQUFJRSxhQUFhLEdBQUcsTUFBQUMsT0FBQSxDQUFBQyxPQUFBLEdBQUFDLElBQUEsT0FBQXJpQix1QkFBQSxDQUFBOUMsT0FBQSxDQUFhLGVBQWUsR0FBQztJQUNqRCxNQUFNb2xCLFlBQVksR0FBR0osYUFBYSxDQUFDSyxLQUFLLENBQUNqaEIsTUFBTSxDQUFDMGdCLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTFnQixNQUFNLENBQUMwZ0IsR0FBRyxDQUFDN00sS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO01BQzNFcU4sR0FBRyxFQUFFLEVBQUUsR0FBRzlnQixPQUFPLENBQUM4Z0IsR0FBRyxFQUFFQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUMvQyxDQUFDLENBQUM7SUFDRkgsWUFBWSxDQUFDSSxNQUFNLENBQUNDLFdBQVcsQ0FBQyxNQUFNLENBQUM7SUFDdkNMLFlBQVksQ0FBQ00sTUFBTSxDQUFDRCxXQUFXLENBQUMsTUFBTSxDQUFDOztJQUV2QztJQUNBLElBQUkvRSxHQUFHO0lBQ1AsSUFBSWlGLElBQUksR0FBRyxJQUFJO0lBQ2YsSUFBSXJSLE1BQU0sR0FBRyxFQUFFO0lBQ2YsSUFBSTtNQUNGLE9BQU8sTUFBTSxJQUFJMlEsT0FBTyxDQUFDLFVBQVNDLE9BQU8sRUFBRVUsTUFBTSxFQUFFOztRQUVqRDtRQUNBUixZQUFZLENBQUNJLE1BQU0sQ0FBQ0ssRUFBRSxDQUFDLE1BQU0sRUFBRSxnQkFBZWxKLElBQUksRUFBRTtVQUNsRCxJQUFJbUosSUFBSSxHQUFHbkosSUFBSSxDQUFDcEUsUUFBUSxDQUFDLENBQUM7VUFDMUJ3TixxQkFBWSxDQUFDQyxHQUFHLENBQUMsQ0FBQyxFQUFFRixJQUFJLENBQUM7VUFDekJ4UixNQUFNLElBQUl3UixJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUM7O1VBRXZCO1VBQ0EsSUFBSUcsZUFBZSxHQUFHLGFBQWE7VUFDbkMsSUFBSUMsa0JBQWtCLEdBQUdKLElBQUksQ0FBQ2xhLE9BQU8sQ0FBQ3FhLGVBQWUsQ0FBQztVQUN0RCxJQUFJQyxrQkFBa0IsSUFBSSxDQUFDLEVBQUU7WUFDM0IsSUFBSUMsSUFBSSxHQUFHTCxJQUFJLENBQUNNLFNBQVMsQ0FBQ0Ysa0JBQWtCLEdBQUdELGVBQWUsQ0FBQ3hXLE1BQU0sRUFBRXFXLElBQUksQ0FBQ08sV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdGLElBQUlDLGVBQWUsR0FBR1IsSUFBSSxDQUFDUyxPQUFPLENBQUMsZUFBZSxFQUFFLEVBQUUsQ0FBQyxDQUFDQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEUsSUFBSUMsSUFBSSxHQUFHSCxlQUFlLENBQUNGLFNBQVMsQ0FBQ0UsZUFBZSxDQUFDRCxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFFLElBQUlLLE1BQU0sR0FBR3RpQixNQUFNLENBQUMwZ0IsR0FBRyxDQUFDbFosT0FBTyxDQUFDLFdBQVcsQ0FBQztZQUM1QyxJQUFJK2EsVUFBVSxHQUFHRCxNQUFNLElBQUksQ0FBQyxHQUFHLFNBQVMsSUFBSXRpQixNQUFNLENBQUMwZ0IsR0FBRyxDQUFDNEIsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDRSxXQUFXLENBQUMsQ0FBQyxHQUFHLEtBQUs7WUFDeEZsRyxHQUFHLEdBQUcsQ0FBQ2lHLFVBQVUsR0FBRyxPQUFPLEdBQUcsTUFBTSxJQUFJLEtBQUssR0FBR1IsSUFBSSxHQUFHLEdBQUcsR0FBR00sSUFBSTtVQUNuRTs7VUFFQTtVQUNBLElBQUlYLElBQUksQ0FBQ2xhLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsRUFBRTs7WUFFbkQ7WUFDQSxJQUFJaWIsV0FBVyxHQUFHemlCLE1BQU0sQ0FBQzBnQixHQUFHLENBQUNsWixPQUFPLENBQUMsYUFBYSxDQUFDO1lBQ25ELElBQUlrYixRQUFRLEdBQUdELFdBQVcsSUFBSSxDQUFDLEdBQUd6aUIsTUFBTSxDQUFDMGdCLEdBQUcsQ0FBQytCLFdBQVcsR0FBRyxDQUFDLENBQUMsR0FBR2xpQixTQUFTO1lBQ3pFLElBQUkyRSxRQUFRLEdBQUd3ZCxRQUFRLEtBQUtuaUIsU0FBUyxHQUFHQSxTQUFTLEdBQUdtaUIsUUFBUSxDQUFDVixTQUFTLENBQUMsQ0FBQyxFQUFFVSxRQUFRLENBQUNsYixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEcsSUFBSXBHLFFBQVEsR0FBR3NoQixRQUFRLEtBQUtuaUIsU0FBUyxHQUFHQSxTQUFTLEdBQUdtaUIsUUFBUSxDQUFDVixTQUFTLENBQUNVLFFBQVEsQ0FBQ2xiLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7O1lBRWpHO1lBQ0F4SCxNQUFNLEdBQUdBLE1BQU0sQ0FBQ2lQLElBQUksQ0FBQyxDQUFDLENBQUN4TSxTQUFTLENBQUMsRUFBQzZaLEdBQUcsRUFBRUEsR0FBRyxFQUFFcFgsUUFBUSxFQUFFQSxRQUFRLEVBQUU5RCxRQUFRLEVBQUVBLFFBQVEsRUFBRXVoQixrQkFBa0IsRUFBRTNpQixNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxHQUFHakIsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQzJoQixxQkFBcUIsQ0FBQyxDQUFDLEdBQUdyaUIsU0FBUyxFQUFDLENBQUM7WUFDckxQLE1BQU0sQ0FBQzBnQixHQUFHLEdBQUduZ0IsU0FBUztZQUN0QixJQUFJc2lCLE1BQU0sR0FBRyxNQUFNampCLGVBQWUsQ0FBQzJnQixrQkFBa0IsQ0FBQ3ZnQixNQUFNLENBQUM7WUFDN0Q2aUIsTUFBTSxDQUFDemlCLE9BQU8sR0FBRzRnQixZQUFZOztZQUU3QjtZQUNBLElBQUksQ0FBQzhCLFVBQVUsR0FBRyxJQUFJO1lBQ3RCaEMsT0FBTyxDQUFDK0IsTUFBTSxDQUFDO1VBQ2pCO1FBQ0YsQ0FBQyxDQUFDOztRQUVGO1FBQ0E3QixZQUFZLENBQUNNLE1BQU0sQ0FBQ0csRUFBRSxDQUFDLE1BQU0sRUFBRSxVQUFTbEosSUFBSSxFQUFFO1VBQzVDLElBQUlvSixxQkFBWSxDQUFDb0IsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUV2UyxPQUFPLENBQUNDLEtBQUssQ0FBQzhILElBQUksQ0FBQztRQUMxRCxDQUFDLENBQUM7O1FBRUY7UUFDQXlJLFlBQVksQ0FBQ1MsRUFBRSxDQUFDLE1BQU0sRUFBRSxVQUFTdUIsSUFBSSxFQUFFO1VBQ3JDLElBQUksQ0FBQyxJQUFJLENBQUNGLFVBQVUsRUFBRXRCLE1BQU0sQ0FBQyxJQUFJaGhCLG9CQUFXLENBQUMsc0RBQXNELEdBQUd3aUIsSUFBSSxJQUFJOVMsTUFBTSxHQUFHLE9BQU8sR0FBR0EsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakosQ0FBQyxDQUFDOztRQUVGO1FBQ0E4USxZQUFZLENBQUNTLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBU25lLEdBQUcsRUFBRTtVQUNyQyxJQUFJQSxHQUFHLENBQUNhLE9BQU8sQ0FBQ3FELE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUVnYSxNQUFNLENBQUMsSUFBSWhoQixvQkFBVyxDQUFDLDRDQUE0QyxHQUFHUixNQUFNLENBQUMwZ0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1VBQ25JLElBQUksQ0FBQyxJQUFJLENBQUNvQyxVQUFVLEVBQUV0QixNQUFNLENBQUNsZSxHQUFHLENBQUM7UUFDbkMsQ0FBQyxDQUFDOztRQUVGO1FBQ0EwZCxZQUFZLENBQUNTLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxVQUFTbmUsR0FBRyxFQUFFMmYsTUFBTSxFQUFFO1VBQ3pEelMsT0FBTyxDQUFDQyxLQUFLLENBQUMsbURBQW1ELEdBQUduTixHQUFHLENBQUNhLE9BQU8sQ0FBQztVQUNoRnFNLE9BQU8sQ0FBQ0MsS0FBSyxDQUFDd1MsTUFBTSxDQUFDO1VBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUNILFVBQVUsRUFBRXRCLE1BQU0sQ0FBQ2xlLEdBQUcsQ0FBQztRQUNuQyxDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsT0FBT0EsR0FBUSxFQUFFO01BQ2pCLE1BQU0sSUFBSTlDLG9CQUFXLENBQUM4QyxHQUFHLENBQUNhLE9BQU8sQ0FBQztJQUNwQztFQUNGOztFQUVBLE1BQWdCeEMsS0FBS0EsQ0FBQSxFQUFHO0lBQ3RCLElBQUksQ0FBQzBGLGdCQUFnQixDQUFDLENBQUM7SUFDdkIsT0FBTyxJQUFJLENBQUNwSCxZQUFZO0lBQ3hCLElBQUksQ0FBQ0EsWUFBWSxHQUFHLENBQUMsQ0FBQztJQUN0QixJQUFJLENBQUNxQixJQUFJLEdBQUdmLFNBQVM7RUFDdkI7O0VBRUEsTUFBZ0IyaUIsaUJBQWlCQSxDQUFDdFAsb0JBQTBCLEVBQUU7SUFDNUQsSUFBSXNDLE9BQU8sR0FBRyxJQUFJdEYsR0FBRyxDQUFDLENBQUM7SUFDdkIsS0FBSyxJQUFJbEssT0FBTyxJQUFJLE1BQU0sSUFBSSxDQUFDQyxXQUFXLENBQUMsQ0FBQyxFQUFFO01BQzVDdVAsT0FBTyxDQUFDdlcsR0FBRyxDQUFDK0csT0FBTyxDQUFDdUYsUUFBUSxDQUFDLENBQUMsRUFBRTJILG9CQUFvQixHQUFHLE1BQU0sSUFBSSxDQUFDQSxvQkFBb0IsQ0FBQ2xOLE9BQU8sQ0FBQ3VGLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRzFMLFNBQVMsQ0FBQztJQUN6SDtJQUNBLE9BQU8yVixPQUFPO0VBQ2hCOztFQUVBLE1BQWdCdEMsb0JBQW9CQSxDQUFDek4sVUFBVSxFQUFFO0lBQy9DLElBQUlnSCxpQkFBaUIsR0FBRyxFQUFFO0lBQzFCLElBQUluRyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUNoSCxNQUFNLENBQUNpQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsYUFBYSxFQUFFLEVBQUNzRixhQUFhLEVBQUVYLFVBQVUsRUFBQyxDQUFDO0lBQ3BHLEtBQUssSUFBSXBDLE9BQU8sSUFBSWlELElBQUksQ0FBQ0MsTUFBTSxDQUFDc0csU0FBUyxFQUFFSixpQkFBaUIsQ0FBQ2pCLElBQUksQ0FBQ25JLE9BQU8sQ0FBQ3FKLGFBQWEsQ0FBQztJQUN4RixPQUFPRCxpQkFBaUI7RUFDMUI7O0VBRUEsTUFBZ0IwQixlQUFlQSxDQUFDYixLQUEwQixFQUFFOztJQUUxRDtJQUNBLElBQUltVixPQUFPLEdBQUduVixLQUFLLENBQUNtRCxVQUFVLENBQUMsQ0FBQztJQUNoQyxJQUFJaVMsY0FBYyxHQUFHRCxPQUFPLENBQUM1UyxjQUFjLENBQUMsQ0FBQyxLQUFLLEtBQUssSUFBSTRTLE9BQU8sQ0FBQ0UsV0FBVyxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUlGLE9BQU8sQ0FBQ0csV0FBVyxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUlILE9BQU8sQ0FBQ3ZNLFlBQVksQ0FBQyxDQUFDLEtBQUssS0FBSztJQUMvSixJQUFJMk0sYUFBYSxHQUFHSixPQUFPLENBQUM1UyxjQUFjLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSTRTLE9BQU8sQ0FBQ0UsV0FBVyxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUlGLE9BQU8sQ0FBQ0csV0FBVyxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUlILE9BQU8sQ0FBQzFaLFNBQVMsQ0FBQyxDQUFDLEtBQUtsSixTQUFTLElBQUk0aUIsT0FBTyxDQUFDSyxZQUFZLENBQUMsQ0FBQyxLQUFLampCLFNBQVMsSUFBSTRpQixPQUFPLENBQUNNLFdBQVcsQ0FBQyxDQUFDLEtBQUssS0FBSztJQUMxTyxJQUFJQyxhQUFhLEdBQUcxVixLQUFLLENBQUMyVixhQUFhLENBQUMsQ0FBQyxLQUFLLEtBQUssSUFBSTNWLEtBQUssQ0FBQzRWLGFBQWEsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJNVYsS0FBSyxDQUFDNlYsa0JBQWtCLENBQUMsQ0FBQyxLQUFLLElBQUk7SUFDNUgsSUFBSUMsYUFBYSxHQUFHOVYsS0FBSyxDQUFDNFYsYUFBYSxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUk1VixLQUFLLENBQUMyVixhQUFhLENBQUMsQ0FBQyxLQUFLLElBQUk7O0lBRXJGO0lBQ0EsSUFBSVIsT0FBTyxDQUFDRSxXQUFXLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDRSxhQUFhLEVBQUU7TUFDcEQsTUFBTSxJQUFJL2lCLG9CQUFXLENBQUMscUVBQXFFLENBQUM7SUFDOUY7O0lBRUEsSUFBSTRDLE1BQVcsR0FBRyxDQUFDLENBQUM7SUFDcEJBLE1BQU0sQ0FBQzJnQixFQUFFLEdBQUdMLGFBQWEsSUFBSU4sY0FBYztJQUMzQ2hnQixNQUFNLENBQUM0Z0IsR0FBRyxHQUFHRixhQUFhLElBQUlWLGNBQWM7SUFDNUNoZ0IsTUFBTSxDQUFDNmdCLElBQUksR0FBR1AsYUFBYSxJQUFJSCxhQUFhO0lBQzVDbmdCLE1BQU0sQ0FBQzhnQixPQUFPLEdBQUdKLGFBQWEsSUFBSVAsYUFBYTtJQUMvQ25nQixNQUFNLENBQUMrZ0IsTUFBTSxHQUFHaEIsT0FBTyxDQUFDRyxXQUFXLENBQUMsQ0FBQyxLQUFLLEtBQUssSUFBSUgsT0FBTyxDQUFDNVMsY0FBYyxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUk0UyxPQUFPLENBQUNFLFdBQVcsQ0FBQyxDQUFDLElBQUksSUFBSTtJQUNySCxJQUFJRixPQUFPLENBQUNpQixZQUFZLENBQUMsQ0FBQyxLQUFLN2pCLFNBQVMsRUFBRTtNQUN4QyxJQUFJNGlCLE9BQU8sQ0FBQ2lCLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFaGhCLE1BQU0sQ0FBQ2loQixVQUFVLEdBQUdsQixPQUFPLENBQUNpQixZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQUEsS0FDM0VoaEIsTUFBTSxDQUFDaWhCLFVBQVUsR0FBR2xCLE9BQU8sQ0FBQ2lCLFlBQVksQ0FBQyxDQUFDO0lBQ2pEO0lBQ0EsSUFBSWpCLE9BQU8sQ0FBQ0ssWUFBWSxDQUFDLENBQUMsS0FBS2pqQixTQUFTLEVBQUU2QyxNQUFNLENBQUNraEIsVUFBVSxHQUFHbkIsT0FBTyxDQUFDSyxZQUFZLENBQUMsQ0FBQztJQUNwRnBnQixNQUFNLENBQUNtaEIsZ0JBQWdCLEdBQUdwQixPQUFPLENBQUNpQixZQUFZLENBQUMsQ0FBQyxLQUFLN2pCLFNBQVMsSUFBSTRpQixPQUFPLENBQUNLLFlBQVksQ0FBQyxDQUFDLEtBQUtqakIsU0FBUztJQUN0RyxJQUFJeU4sS0FBSyxDQUFDdEIsZUFBZSxDQUFDLENBQUMsS0FBS25NLFNBQVMsRUFBRTtNQUN6QyxJQUFBOEYsZUFBTSxFQUFDMkgsS0FBSyxDQUFDd1csa0JBQWtCLENBQUMsQ0FBQyxLQUFLamtCLFNBQVMsSUFBSXlOLEtBQUssQ0FBQzRGLG9CQUFvQixDQUFDLENBQUMsS0FBS3JULFNBQVMsRUFBRSw2REFBNkQsQ0FBQztNQUM3SjZDLE1BQU0sQ0FBQ21KLFlBQVksR0FBRyxJQUFJO0lBQzVCLENBQUMsTUFBTTtNQUNMbkosTUFBTSxDQUFDMEQsYUFBYSxHQUFHa0gsS0FBSyxDQUFDdEIsZUFBZSxDQUFDLENBQUM7O01BRTlDO01BQ0EsSUFBSVMsaUJBQWlCLEdBQUcsSUFBSWlDLEdBQUcsQ0FBQyxDQUFDO01BQ2pDLElBQUlwQixLQUFLLENBQUN3VyxrQkFBa0IsQ0FBQyxDQUFDLEtBQUtqa0IsU0FBUyxFQUFFNE0saUJBQWlCLENBQUNvQyxHQUFHLENBQUN2QixLQUFLLENBQUN3VyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7TUFDL0YsSUFBSXhXLEtBQUssQ0FBQzRGLG9CQUFvQixDQUFDLENBQUMsS0FBS3JULFNBQVMsRUFBRXlOLEtBQUssQ0FBQzRGLG9CQUFvQixDQUFDLENBQUMsQ0FBQ3pCLEdBQUcsQ0FBQyxDQUFBL0wsYUFBYSxLQUFJK0csaUJBQWlCLENBQUNvQyxHQUFHLENBQUNuSixhQUFhLENBQUMsQ0FBQztNQUN2SSxJQUFJK0csaUJBQWlCLENBQUNzWCxJQUFJLEVBQUVyaEIsTUFBTSxDQUFDa1IsZUFBZSxHQUFHeUMsS0FBSyxDQUFDMk4sSUFBSSxDQUFDdlgsaUJBQWlCLENBQUM7SUFDcEY7O0lBRUE7SUFDQSxJQUFJcUMsS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNkLElBQUlDLFFBQVEsR0FBRyxDQUFDLENBQUM7O0lBRWpCO0lBQ0EsSUFBSXpJLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxlQUFlLEVBQUU0QixNQUFNLENBQUM7SUFDakYsS0FBSyxJQUFJOUQsR0FBRyxJQUFJSCxNQUFNLENBQUNnWCxJQUFJLENBQUNuUCxJQUFJLENBQUNDLE1BQU0sQ0FBQyxFQUFFO01BQ3hDLEtBQUssSUFBSTBkLEtBQUssSUFBSTNkLElBQUksQ0FBQ0MsTUFBTSxDQUFDM0gsR0FBRyxDQUFDLEVBQUU7UUFDbEM7UUFDQSxJQUFJb1EsRUFBRSxHQUFHOVAsZUFBZSxDQUFDZ2xCLHdCQUF3QixDQUFDRCxLQUFLLENBQUM7UUFDeEQsSUFBSWpWLEVBQUUsQ0FBQ2EsY0FBYyxDQUFDLENBQUMsRUFBRSxJQUFBbEssZUFBTSxFQUFDcUosRUFBRSxDQUFDVyxRQUFRLENBQUMsQ0FBQyxDQUFDdEMsTUFBTSxDQUFDLENBQUMsQ0FBQ3ZHLE9BQU8sQ0FBQ2tJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDOztRQUV4RTtRQUNBO1FBQ0EsSUFBSUEsRUFBRSxDQUFDOEYsbUJBQW1CLENBQUMsQ0FBQyxLQUFLalYsU0FBUyxJQUFJbVAsRUFBRSxDQUFDa0gsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDbEgsRUFBRSxDQUFDNFQsV0FBVyxDQUFDLENBQUM7UUFDaEY1VCxFQUFFLENBQUM4RixtQkFBbUIsQ0FBQyxDQUFDLENBQUN4QixlQUFlLENBQUMsQ0FBQyxJQUFJdEUsRUFBRSxDQUFDbVYsaUJBQWlCLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtVQUMvRSxJQUFJQyxnQkFBZ0IsR0FBR3BWLEVBQUUsQ0FBQzhGLG1CQUFtQixDQUFDLENBQUM7VUFDL0MsSUFBSXVQLGFBQWEsR0FBR3ZlLE1BQU0sQ0FBQyxDQUFDLENBQUM7VUFDN0IsS0FBSyxJQUFJdU4sV0FBVyxJQUFJK1EsZ0JBQWdCLENBQUM5USxlQUFlLENBQUMsQ0FBQyxFQUFFK1EsYUFBYSxHQUFHQSxhQUFhLEdBQUdoUixXQUFXLENBQUNFLFNBQVMsQ0FBQyxDQUFDO1VBQ25IdkUsRUFBRSxDQUFDOEYsbUJBQW1CLENBQUMsQ0FBQyxDQUFDTyxTQUFTLENBQUNnUCxhQUFhLENBQUM7UUFDbkQ7O1FBRUE7UUFDQW5sQixlQUFlLENBQUMrUCxPQUFPLENBQUNELEVBQUUsRUFBRUYsS0FBSyxFQUFFQyxRQUFRLENBQUM7TUFDOUM7SUFDRjs7SUFFQTtJQUNBLElBQUlQLEdBQXFCLEdBQUcvUCxNQUFNLENBQUM2bEIsTUFBTSxDQUFDeFYsS0FBSyxDQUFDO0lBQ2hETixHQUFHLENBQUMrVixJQUFJLENBQUNybEIsZUFBZSxDQUFDc2xCLGtCQUFrQixDQUFDOztJQUU1QztJQUNBLElBQUl0VyxTQUFTLEdBQUcsRUFBRTtJQUNsQixLQUFLLElBQUljLEVBQUUsSUFBSVIsR0FBRyxFQUFFOztNQUVsQjtNQUNBLElBQUlRLEVBQUUsQ0FBQ2lVLGFBQWEsQ0FBQyxDQUFDLEtBQUtwakIsU0FBUyxFQUFFbVAsRUFBRSxDQUFDeVYsYUFBYSxDQUFDLEtBQUssQ0FBQztNQUM3RCxJQUFJelYsRUFBRSxDQUFDa1UsYUFBYSxDQUFDLENBQUMsS0FBS3JqQixTQUFTLEVBQUVtUCxFQUFFLENBQUMwVixhQUFhLENBQUMsS0FBSyxDQUFDOztNQUU3RDtNQUNBLElBQUkxVixFQUFFLENBQUNzUSxvQkFBb0IsQ0FBQyxDQUFDLEtBQUt6ZixTQUFTLEVBQUVtUCxFQUFFLENBQUNzUSxvQkFBb0IsQ0FBQyxDQUFDLENBQUNpRixJQUFJLENBQUNybEIsZUFBZSxDQUFDeWxCLHdCQUF3QixDQUFDOztNQUVySDtNQUNBLEtBQUssSUFBSWhXLFFBQVEsSUFBSUssRUFBRSxDQUFDMEIsZUFBZSxDQUFDcEQsS0FBSyxDQUFDLEVBQUU7UUFDOUNZLFNBQVMsQ0FBQzFDLElBQUksQ0FBQ21ELFFBQVEsQ0FBQztNQUMxQjs7TUFFQTtNQUNBLElBQUlLLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsS0FBSzlQLFNBQVMsSUFBSW1QLEVBQUUsQ0FBQzhGLG1CQUFtQixDQUFDLENBQUMsS0FBS2pWLFNBQVMsSUFBSW1QLEVBQUUsQ0FBQ3NRLG9CQUFvQixDQUFDLENBQUMsS0FBS3pmLFNBQVMsRUFBRTtRQUNwSG1QLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUN1QyxNQUFNLENBQUNaLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUN2RyxPQUFPLENBQUNrSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7TUFDdEU7SUFDRjs7SUFFQSxPQUFPZCxTQUFTO0VBQ2xCOztFQUVBLE1BQWdCb0IsYUFBYUEsQ0FBQ2hDLEtBQUssRUFBRTs7SUFFbkM7SUFDQSxJQUFJa0ksT0FBTyxHQUFHLElBQUl0RixHQUFHLENBQUMsQ0FBQztJQUN2QixJQUFJNUMsS0FBSyxDQUFDdEIsZUFBZSxDQUFDLENBQUMsS0FBS25NLFNBQVMsRUFBRTtNQUN6QyxJQUFJNE0saUJBQWlCLEdBQUcsSUFBSWlDLEdBQUcsQ0FBQyxDQUFDO01BQ2pDLElBQUlwQixLQUFLLENBQUN3VyxrQkFBa0IsQ0FBQyxDQUFDLEtBQUtqa0IsU0FBUyxFQUFFNE0saUJBQWlCLENBQUNvQyxHQUFHLENBQUN2QixLQUFLLENBQUN3VyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7TUFDL0YsSUFBSXhXLEtBQUssQ0FBQzRGLG9CQUFvQixDQUFDLENBQUMsS0FBS3JULFNBQVMsRUFBRXlOLEtBQUssQ0FBQzRGLG9CQUFvQixDQUFDLENBQUMsQ0FBQ3pCLEdBQUcsQ0FBQyxDQUFBL0wsYUFBYSxLQUFJK0csaUJBQWlCLENBQUNvQyxHQUFHLENBQUNuSixhQUFhLENBQUMsQ0FBQztNQUN2SThQLE9BQU8sQ0FBQ3ZXLEdBQUcsQ0FBQ3FPLEtBQUssQ0FBQ3RCLGVBQWUsQ0FBQyxDQUFDLEVBQUVTLGlCQUFpQixDQUFDc1gsSUFBSSxHQUFHMU4sS0FBSyxDQUFDMk4sSUFBSSxDQUFDdlgsaUJBQWlCLENBQUMsR0FBRzVNLFNBQVMsQ0FBQyxDQUFDLENBQUU7SUFDN0csQ0FBQyxNQUFNO01BQ0w4RixlQUFNLENBQUNDLEtBQUssQ0FBQzBILEtBQUssQ0FBQ3dXLGtCQUFrQixDQUFDLENBQUMsRUFBRWprQixTQUFTLEVBQUUsNkRBQTZELENBQUM7TUFDbEgsSUFBQThGLGVBQU0sRUFBQzJILEtBQUssQ0FBQzRGLG9CQUFvQixDQUFDLENBQUMsS0FBS3JULFNBQVMsSUFBSXlOLEtBQUssQ0FBQzRGLG9CQUFvQixDQUFDLENBQUMsQ0FBQ3ZJLE1BQU0sS0FBSyxDQUFDLEVBQUUsNkRBQTZELENBQUM7TUFDOUo2SyxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUNnTixpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBRTtJQUM3Qzs7SUFFQTtJQUNBLElBQUkxVCxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSUMsUUFBUSxHQUFHLENBQUMsQ0FBQzs7SUFFakI7SUFDQSxJQUFJck0sTUFBVyxHQUFHLENBQUMsQ0FBQztJQUNwQkEsTUFBTSxDQUFDa2lCLGFBQWEsR0FBR3RYLEtBQUssQ0FBQ3VYLFVBQVUsQ0FBQyxDQUFDLEtBQUssSUFBSSxHQUFHLGFBQWEsR0FBR3ZYLEtBQUssQ0FBQ3VYLFVBQVUsQ0FBQyxDQUFDLEtBQUssS0FBSyxHQUFHLFdBQVcsR0FBRyxLQUFLO0lBQ3ZIbmlCLE1BQU0sQ0FBQ29pQixPQUFPLEdBQUcsSUFBSTtJQUNyQixLQUFLLElBQUlyZixVQUFVLElBQUkrUCxPQUFPLENBQUNDLElBQUksQ0FBQyxDQUFDLEVBQUU7O01BRXJDO01BQ0EvUyxNQUFNLENBQUMwRCxhQUFhLEdBQUdYLFVBQVU7TUFDakMvQyxNQUFNLENBQUNrUixlQUFlLEdBQUc0QixPQUFPLENBQUNsWCxHQUFHLENBQUNtSCxVQUFVLENBQUM7TUFDaEQsSUFBSWEsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLG9CQUFvQixFQUFFNEIsTUFBTSxDQUFDOztNQUV0RjtNQUNBLElBQUk0RCxJQUFJLENBQUNDLE1BQU0sQ0FBQzJILFNBQVMsS0FBS3JPLFNBQVMsRUFBRTtNQUN6QyxLQUFLLElBQUlrbEIsU0FBUyxJQUFJemUsSUFBSSxDQUFDQyxNQUFNLENBQUMySCxTQUFTLEVBQUU7UUFDM0MsSUFBSWMsRUFBRSxHQUFHOVAsZUFBZSxDQUFDOGxCLDRCQUE0QixDQUFDRCxTQUFTLENBQUM7UUFDaEU3bEIsZUFBZSxDQUFDK1AsT0FBTyxDQUFDRCxFQUFFLEVBQUVGLEtBQUssRUFBRUMsUUFBUSxDQUFDO01BQzlDO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJUCxHQUFxQixHQUFHL1AsTUFBTSxDQUFDNmxCLE1BQU0sQ0FBQ3hWLEtBQUssQ0FBQztJQUNoRE4sR0FBRyxDQUFDK1YsSUFBSSxDQUFDcmxCLGVBQWUsQ0FBQ3NsQixrQkFBa0IsQ0FBQzs7SUFFNUM7SUFDQSxJQUFJblYsT0FBTyxHQUFHLEVBQUU7SUFDaEIsS0FBSyxJQUFJTCxFQUFFLElBQUlSLEdBQUcsRUFBRTs7TUFFbEI7TUFDQSxJQUFJUSxFQUFFLENBQUMyQixVQUFVLENBQUMsQ0FBQyxLQUFLOVEsU0FBUyxFQUFFbVAsRUFBRSxDQUFDMkIsVUFBVSxDQUFDLENBQUMsQ0FBQzRULElBQUksQ0FBQ3JsQixlQUFlLENBQUMrbEIsY0FBYyxDQUFDOztNQUV2RjtNQUNBLEtBQUssSUFBSXpWLE1BQU0sSUFBSVIsRUFBRSxDQUFDNkIsYUFBYSxDQUFDdkQsS0FBSyxDQUFDLEVBQUUrQixPQUFPLENBQUM3RCxJQUFJLENBQUNnRSxNQUFNLENBQUM7O01BRWhFO01BQ0EsSUFBSVIsRUFBRSxDQUFDMkIsVUFBVSxDQUFDLENBQUMsS0FBSzlRLFNBQVMsSUFBSW1QLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsS0FBSzlQLFNBQVMsRUFBRTtRQUNoRW1QLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUN1QyxNQUFNLENBQUNaLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUN2RyxPQUFPLENBQUNrSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7TUFDdEU7SUFDRjtJQUNBLE9BQU9LLE9BQU87RUFDaEI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBZ0JnQyxrQkFBa0JBLENBQUNOLEdBQUcsRUFBRTtJQUN0QyxJQUFJekssSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDaEgsTUFBTSxDQUFDaUIsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLG1CQUFtQixFQUFFLEVBQUNpUSxHQUFHLEVBQUVBLEdBQUcsRUFBQyxDQUFDO0lBQ3pGLElBQUksQ0FBQ3pLLElBQUksQ0FBQ0MsTUFBTSxDQUFDd0wsaUJBQWlCLEVBQUUsT0FBTyxFQUFFO0lBQzdDLE9BQU96TCxJQUFJLENBQUNDLE1BQU0sQ0FBQ3dMLGlCQUFpQixDQUFDTixHQUFHLENBQUMsQ0FBQXlULFFBQVEsS0FBSSxJQUFJQyx1QkFBYyxDQUFDRCxRQUFRLENBQUN2VCxTQUFTLEVBQUV1VCxRQUFRLENBQUNyVCxTQUFTLENBQUMsQ0FBQztFQUNsSDs7RUFFQSxNQUFnQitELGVBQWVBLENBQUN0VyxNQUFNLEVBQUU7O0lBRXRDO0lBQ0EsSUFBSUEsTUFBTSxLQUFLTyxTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLDJCQUEyQixDQUFDO0lBQzVFLElBQUlSLE1BQU0sQ0FBQzBNLGVBQWUsQ0FBQyxDQUFDLEtBQUtuTSxTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLDZDQUE2QyxDQUFDO0lBQ2hILElBQUlSLE1BQU0sQ0FBQ2dVLGVBQWUsQ0FBQyxDQUFDLEtBQUt6VCxTQUFTLElBQUlQLE1BQU0sQ0FBQ2dVLGVBQWUsQ0FBQyxDQUFDLENBQUMzSSxNQUFNLElBQUksQ0FBQyxFQUFFLE1BQU0sSUFBSTdLLG9CQUFXLENBQUMsa0RBQWtELENBQUM7SUFDN0osSUFBSVIsTUFBTSxDQUFDZ1UsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ2hNLFVBQVUsQ0FBQyxDQUFDLEtBQUt6SCxTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLDhDQUE4QyxDQUFDO0lBQ2pJLElBQUlSLE1BQU0sQ0FBQ2dVLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNDLFNBQVMsQ0FBQyxDQUFDLEtBQUsxVCxTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLHVDQUF1QyxDQUFDO0lBQ3pILElBQUlSLE1BQU0sQ0FBQzhWLFdBQVcsQ0FBQyxDQUFDLEtBQUt2VixTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLDBFQUEwRSxDQUFDO0lBQ3pJLElBQUlSLE1BQU0sQ0FBQzRULG9CQUFvQixDQUFDLENBQUMsS0FBS3JULFNBQVMsSUFBSVAsTUFBTSxDQUFDNFQsb0JBQW9CLENBQUMsQ0FBQyxDQUFDdkksTUFBTSxLQUFLLENBQUMsRUFBRSxNQUFNLElBQUk3SyxvQkFBVyxDQUFDLG9EQUFvRCxDQUFDO0lBQzFLLElBQUlSLE1BQU0sQ0FBQ3FXLHNCQUFzQixDQUFDLENBQUMsRUFBRSxNQUFNLElBQUk3VixvQkFBVyxDQUFDLG1EQUFtRCxDQUFDO0lBQy9HLElBQUlSLE1BQU0sQ0FBQ29VLGtCQUFrQixDQUFDLENBQUMsS0FBSzdULFNBQVMsSUFBSVAsTUFBTSxDQUFDb1Usa0JBQWtCLENBQUMsQ0FBQyxDQUFDL0ksTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLElBQUk3SyxvQkFBVyxDQUFDLHFFQUFxRSxDQUFDOztJQUVyTDtJQUNBLElBQUlSLE1BQU0sQ0FBQzRULG9CQUFvQixDQUFDLENBQUMsS0FBS3JULFNBQVMsRUFBRTtNQUMvQ1AsTUFBTSxDQUFDeVYsb0JBQW9CLENBQUMsRUFBRSxDQUFDO01BQy9CLEtBQUssSUFBSXJOLFVBQVUsSUFBSSxNQUFNLElBQUksQ0FBQ0YsZUFBZSxDQUFDbEksTUFBTSxDQUFDME0sZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFO1FBQzNFMU0sTUFBTSxDQUFDNFQsb0JBQW9CLENBQUMsQ0FBQyxDQUFDMUgsSUFBSSxDQUFDOUQsVUFBVSxDQUFDNkQsUUFBUSxDQUFDLENBQUMsQ0FBQztNQUMzRDtJQUNGO0lBQ0EsSUFBSWpNLE1BQU0sQ0FBQzRULG9CQUFvQixDQUFDLENBQUMsQ0FBQ3ZJLE1BQU0sS0FBSyxDQUFDLEVBQUUsTUFBTSxJQUFJN0ssb0JBQVcsQ0FBQywrQkFBK0IsQ0FBQzs7SUFFdEc7SUFDQSxJQUFJNEMsTUFBVyxHQUFHLENBQUMsQ0FBQztJQUNwQixJQUFJb1QsS0FBSyxHQUFHeFcsTUFBTSxDQUFDMFQsUUFBUSxDQUFDLENBQUMsS0FBSyxJQUFJO0lBQ3RDdFEsTUFBTSxDQUFDMEQsYUFBYSxHQUFHOUcsTUFBTSxDQUFDME0sZUFBZSxDQUFDLENBQUM7SUFDL0N0SixNQUFNLENBQUNrUixlQUFlLEdBQUd0VSxNQUFNLENBQUM0VCxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3REeFEsTUFBTSxDQUFDVyxPQUFPLEdBQUcvRCxNQUFNLENBQUNnVSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDaE0sVUFBVSxDQUFDLENBQUM7SUFDekQsSUFBQTNCLGVBQU0sRUFBQ3JHLE1BQU0sQ0FBQzJVLFdBQVcsQ0FBQyxDQUFDLEtBQUtwVSxTQUFTLElBQUlQLE1BQU0sQ0FBQzJVLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJM1UsTUFBTSxDQUFDMlUsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEd2UixNQUFNLENBQUN3UixRQUFRLEdBQUc1VSxNQUFNLENBQUMyVSxXQUFXLENBQUMsQ0FBQztJQUN0QyxJQUFJM1UsTUFBTSxDQUFDd1UsYUFBYSxDQUFDLENBQUMsS0FBS2pVLFNBQVMsRUFBRTZDLE1BQU0sQ0FBQ3FSLFdBQVcsR0FBR3pVLE1BQU0sQ0FBQ3dVLGFBQWEsQ0FBQyxDQUFDO0lBQ3JGcFIsTUFBTSxDQUFDNEYsVUFBVSxHQUFHaEosTUFBTSxDQUFDdVUsWUFBWSxDQUFDLENBQUM7SUFDekNuUixNQUFNLENBQUNzUixZQUFZLEdBQUcsQ0FBQzhCLEtBQUs7SUFDNUJwVCxNQUFNLENBQUMwaUIsWUFBWSxHQUFHOWxCLE1BQU0sQ0FBQytsQixjQUFjLENBQUMsQ0FBQztJQUM3QzNpQixNQUFNLENBQUMyUixXQUFXLEdBQUcsSUFBSTtJQUN6QjNSLE1BQU0sQ0FBQ3lSLFVBQVUsR0FBRyxJQUFJO0lBQ3hCelIsTUFBTSxDQUFDMFIsZUFBZSxHQUFHLElBQUk7O0lBRTdCO0lBQ0EsSUFBSTlOLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQ2hILE1BQU0sQ0FBQ2lCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxXQUFXLEVBQUU0QixNQUFNLENBQUM7SUFDN0UsSUFBSTZELE1BQU0sR0FBR0QsSUFBSSxDQUFDQyxNQUFNOztJQUV4QjtJQUNBLElBQUl3UCxLQUFLLEdBQUc3VyxlQUFlLENBQUM4Vix3QkFBd0IsQ0FBQ3pPLE1BQU0sRUFBRTFHLFNBQVMsRUFBRVAsTUFBTSxDQUFDOztJQUUvRTtJQUNBLEtBQUssSUFBSTBQLEVBQUUsSUFBSStHLEtBQUssQ0FBQzFJLE1BQU0sQ0FBQyxDQUFDLEVBQUU7TUFDN0IyQixFQUFFLENBQUNzVyxXQUFXLENBQUMsSUFBSSxDQUFDO01BQ3BCdFcsRUFBRSxDQUFDdVcsY0FBYyxDQUFDLEtBQUssQ0FBQztNQUN4QnZXLEVBQUUsQ0FBQytKLG1CQUFtQixDQUFDLENBQUMsQ0FBQztNQUN6Qi9KLEVBQUUsQ0FBQ3dXLFFBQVEsQ0FBQzFQLEtBQUssQ0FBQztNQUNsQjlHLEVBQUUsQ0FBQ2lILFdBQVcsQ0FBQ0gsS0FBSyxDQUFDO01BQ3JCOUcsRUFBRSxDQUFDZ0gsWUFBWSxDQUFDRixLQUFLLENBQUM7TUFDdEI5RyxFQUFFLENBQUN5VyxZQUFZLENBQUMsS0FBSyxDQUFDO01BQ3RCelcsRUFBRSxDQUFDMFcsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQixJQUFJL1csUUFBUSxHQUFHSyxFQUFFLENBQUM4RixtQkFBbUIsQ0FBQyxDQUFDO01BQ3ZDbkcsUUFBUSxDQUFDL0csZUFBZSxDQUFDdEksTUFBTSxDQUFDME0sZUFBZSxDQUFDLENBQUMsQ0FBQztNQUNsRCxJQUFJMU0sTUFBTSxDQUFDNFQsb0JBQW9CLENBQUMsQ0FBQyxDQUFDdkksTUFBTSxLQUFLLENBQUMsRUFBRWdFLFFBQVEsQ0FBQ29HLG9CQUFvQixDQUFDelYsTUFBTSxDQUFDNFQsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO01BQzVHLElBQUlHLFdBQVcsR0FBRyxJQUFJc1MsMEJBQWlCLENBQUNybUIsTUFBTSxDQUFDZ1UsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ2hNLFVBQVUsQ0FBQyxDQUFDLEVBQUV4QixNQUFNLENBQUM2SSxRQUFRLENBQUM0RSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDL0c1RSxRQUFRLENBQUNpWCxlQUFlLENBQUMsQ0FBQ3ZTLFdBQVcsQ0FBQyxDQUFDO01BQ3ZDckUsRUFBRSxDQUFDNlcsbUJBQW1CLENBQUNsWCxRQUFRLENBQUM7TUFDaENLLEVBQUUsQ0FBQ25HLFlBQVksQ0FBQ3ZKLE1BQU0sQ0FBQ3VVLFlBQVksQ0FBQyxDQUFDLENBQUM7TUFDdEMsSUFBSTdFLEVBQUUsQ0FBQzhFLGFBQWEsQ0FBQyxDQUFDLEtBQUtqVSxTQUFTLEVBQUVtUCxFQUFFLENBQUM4VyxhQUFhLENBQUN4bUIsTUFBTSxDQUFDd1UsYUFBYSxDQUFDLENBQUMsS0FBS2pVLFNBQVMsR0FBRyxDQUFDLEdBQUdQLE1BQU0sQ0FBQ3dVLGFBQWEsQ0FBQyxDQUFDLENBQUM7TUFDekgsSUFBSTlFLEVBQUUsQ0FBQ2dFLFFBQVEsQ0FBQyxDQUFDLEVBQUU7UUFDakIsSUFBSWhFLEVBQUUsQ0FBQytXLHVCQUF1QixDQUFDLENBQUMsS0FBS2xtQixTQUFTLEVBQUVtUCxFQUFFLENBQUNnWCx1QkFBdUIsQ0FBQyxDQUFDLElBQUlDLElBQUksQ0FBQyxDQUFDLENBQUNDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFO1FBQ3BHLElBQUlsWCxFQUFFLENBQUNtWCxvQkFBb0IsQ0FBQyxDQUFDLEtBQUt0bUIsU0FBUyxFQUFFbVAsRUFBRSxDQUFDb1gsb0JBQW9CLENBQUMsS0FBSyxDQUFDO01BQzdFO0lBQ0Y7SUFDQSxPQUFPclEsS0FBSyxDQUFDMUksTUFBTSxDQUFDLENBQUM7RUFDdkI7O0VBRVUxRyxnQkFBZ0JBLENBQUEsRUFBRztJQUMzQixJQUFJLElBQUksQ0FBQzBELFlBQVksSUFBSXhLLFNBQVMsSUFBSSxJQUFJLENBQUN3bUIsU0FBUyxDQUFDMWIsTUFBTSxFQUFFLElBQUksQ0FBQ04sWUFBWSxHQUFHLElBQUlpYyxZQUFZLENBQUMsSUFBSSxDQUFDO0lBQ3ZHLElBQUksSUFBSSxDQUFDamMsWUFBWSxLQUFLeEssU0FBUyxFQUFFLElBQUksQ0FBQ3dLLFlBQVksQ0FBQ2tjLFlBQVksQ0FBQyxJQUFJLENBQUNGLFNBQVMsQ0FBQzFiLE1BQU0sR0FBRyxDQUFDLENBQUM7RUFDaEc7O0VBRUE7QUFDRjtBQUNBO0VBQ0UsTUFBZ0JoQixJQUFJQSxDQUFBLEVBQUc7SUFDckIsSUFBSSxJQUFJLENBQUNVLFlBQVksS0FBS3hLLFNBQVMsSUFBSSxJQUFJLENBQUN3SyxZQUFZLENBQUNtYyxTQUFTLEVBQUUsTUFBTSxJQUFJLENBQUNuYyxZQUFZLENBQUNWLElBQUksQ0FBQyxDQUFDO0VBQ3BHOztFQUVBOztFQUVBLE9BQWlCb1csZUFBZUEsQ0FBQ0QsV0FBMkYsRUFBRXRiLFFBQWlCLEVBQUU5RCxRQUFpQixFQUFzQjtJQUN0TCxJQUFJcEIsTUFBK0MsR0FBR08sU0FBUztJQUMvRCxJQUFJLE9BQU9pZ0IsV0FBVyxLQUFLLFFBQVEsSUFBS0EsV0FBVyxDQUFrQ2xFLEdBQUcsRUFBRXRjLE1BQU0sR0FBRyxJQUFJcUIsMkJBQWtCLENBQUMsRUFBQzhsQixNQUFNLEVBQUUsSUFBSXBpQiw0QkFBbUIsQ0FBQ3liLFdBQVcsRUFBMkN0YixRQUFRLEVBQUU5RCxRQUFRLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDbE8sSUFBSVYsaUJBQVEsQ0FBQ3NXLE9BQU8sQ0FBQ3dKLFdBQVcsQ0FBQyxFQUFFeGdCLE1BQU0sR0FBRyxJQUFJcUIsMkJBQWtCLENBQUMsRUFBQ3FmLEdBQUcsRUFBRUYsV0FBdUIsRUFBQyxDQUFDLENBQUM7SUFDbkd4Z0IsTUFBTSxHQUFHLElBQUlxQiwyQkFBa0IsQ0FBQ21mLFdBQTBDLENBQUM7SUFDaEYsSUFBSXhnQixNQUFNLENBQUNvbkIsYUFBYSxLQUFLN21CLFNBQVMsRUFBRVAsTUFBTSxDQUFDb25CLGFBQWEsR0FBRyxJQUFJO0lBQ25FLE9BQU9wbkIsTUFBTTtFQUNmOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBaUJnUCxlQUFlQSxDQUFDaEIsS0FBSyxFQUFFO0lBQ3RDQSxLQUFLLENBQUNtWCxhQUFhLENBQUM1a0IsU0FBUyxDQUFDO0lBQzlCeU4sS0FBSyxDQUFDb1gsYUFBYSxDQUFDN2tCLFNBQVMsQ0FBQztJQUM5QnlOLEtBQUssQ0FBQ1MsZ0JBQWdCLENBQUNsTyxTQUFTLENBQUM7SUFDakN5TixLQUFLLENBQUNVLGFBQWEsQ0FBQ25PLFNBQVMsQ0FBQztJQUM5QnlOLEtBQUssQ0FBQ1csY0FBYyxDQUFDcE8sU0FBUyxDQUFDO0lBQy9CLE9BQU95TixLQUFLO0VBQ2Q7O0VBRUEsT0FBaUJrRCxZQUFZQSxDQUFDbEQsS0FBSyxFQUFFO0lBQ25DLElBQUksQ0FBQ0EsS0FBSyxFQUFFLE9BQU8sS0FBSztJQUN4QixJQUFJLENBQUNBLEtBQUssQ0FBQ21ELFVBQVUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxLQUFLO0lBQ3JDLElBQUluRCxLQUFLLENBQUNtRCxVQUFVLENBQUMsQ0FBQyxDQUFDd1MsYUFBYSxDQUFDLENBQUMsS0FBS3BqQixTQUFTLEVBQUUsT0FBTyxJQUFJLENBQUMsQ0FBQztJQUNuRSxJQUFJeU4sS0FBSyxDQUFDbUQsVUFBVSxDQUFDLENBQUMsQ0FBQ3lTLGFBQWEsQ0FBQyxDQUFDLEtBQUtyakIsU0FBUyxFQUFFLE9BQU8sSUFBSTtJQUNqRSxJQUFJeU4sS0FBSyxZQUFZYyw0QkFBbUIsRUFBRTtNQUN4QyxJQUFJZCxLQUFLLENBQUNtRCxVQUFVLENBQUMsQ0FBQyxDQUFDM0MsY0FBYyxDQUFDLENBQUMsS0FBS2pPLFNBQVMsRUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDO0lBQ3RFLENBQUMsTUFBTSxJQUFJeU4sS0FBSyxZQUFZOEIsMEJBQWlCLEVBQUU7TUFDN0MsSUFBSTlCLEtBQUssQ0FBQ21ELFVBQVUsQ0FBQyxDQUFDLENBQUMvQyxnQkFBZ0IsQ0FBQyxDQUFDLEtBQUs3TixTQUFTLEVBQUUsT0FBTyxJQUFJLENBQUMsQ0FBQztJQUN4RSxDQUFDLE1BQU07TUFDTCxNQUFNLElBQUlDLG9CQUFXLENBQUMsb0NBQW9DLENBQUM7SUFDN0Q7SUFDQSxPQUFPLEtBQUs7RUFDZDs7RUFFQSxPQUFpQnVMLGlCQUFpQkEsQ0FBQ0YsVUFBVSxFQUFFO0lBQzdDLElBQUluRixPQUFPLEdBQUcsSUFBSXVHLHNCQUFhLENBQUMsQ0FBQztJQUNqQyxLQUFLLElBQUkzTixHQUFHLElBQUlILE1BQU0sQ0FBQ2dYLElBQUksQ0FBQ3RLLFVBQVUsQ0FBQyxFQUFFO01BQ3ZDLElBQUlpUixHQUFHLEdBQUdqUixVQUFVLENBQUN2TSxHQUFHLENBQUM7TUFDekIsSUFBSUEsR0FBRyxLQUFLLGVBQWUsRUFBRW9ILE9BQU8sQ0FBQytCLFFBQVEsQ0FBQ3FVLEdBQUcsQ0FBQyxDQUFDO01BQzlDLElBQUl4ZCxHQUFHLEtBQUssU0FBUyxFQUFFb0gsT0FBTyxDQUFDeUYsVUFBVSxDQUFDM0YsTUFBTSxDQUFDc1csR0FBRyxDQUFDLENBQUMsQ0FBQztNQUN2RCxJQUFJeGQsR0FBRyxLQUFLLGtCQUFrQixFQUFFb0gsT0FBTyxDQUFDMEYsa0JBQWtCLENBQUM1RixNQUFNLENBQUNzVyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQ3hFLElBQUl4ZCxHQUFHLEtBQUssY0FBYyxFQUFFb0gsT0FBTyxDQUFDMmdCLGlCQUFpQixDQUFDdkssR0FBRyxDQUFDLENBQUM7TUFDM0QsSUFBSXhkLEdBQUcsS0FBSyxLQUFLLEVBQUVvSCxPQUFPLENBQUM0Z0IsTUFBTSxDQUFDeEssR0FBRyxDQUFDLENBQUM7TUFDdkMsSUFBSXhkLEdBQUcsS0FBSyxPQUFPLEVBQUUsQ0FBRSxDQUFDLENBQUM7TUFBQSxLQUN6QmtSLE9BQU8sQ0FBQ29SLEdBQUcsQ0FBQyw4Q0FBOEMsR0FBR3RpQixHQUFHLEdBQUcsSUFBSSxHQUFHd2QsR0FBRyxDQUFDO0lBQ3JGO0lBQ0EsSUFBSSxFQUFFLEtBQUtwVyxPQUFPLENBQUM2Z0IsTUFBTSxDQUFDLENBQUMsRUFBRTdnQixPQUFPLENBQUM0Z0IsTUFBTSxDQUFDL21CLFNBQVMsQ0FBQztJQUN0RCxPQUFPbUcsT0FBTztFQUNoQjs7RUFFQSxPQUFpQitGLG9CQUFvQkEsQ0FBQ0QsYUFBYSxFQUFFO0lBQ25ELElBQUlwRSxVQUFVLEdBQUcsSUFBSUMseUJBQWdCLENBQUMsQ0FBQztJQUN2QyxLQUFLLElBQUkvSSxHQUFHLElBQUlILE1BQU0sQ0FBQ2dYLElBQUksQ0FBQzNKLGFBQWEsQ0FBQyxFQUFFO01BQzFDLElBQUlzUSxHQUFHLEdBQUd0USxhQUFhLENBQUNsTixHQUFHLENBQUM7TUFDNUIsSUFBSUEsR0FBRyxLQUFLLGVBQWUsRUFBRThJLFVBQVUsQ0FBQ0UsZUFBZSxDQUFDd1UsR0FBRyxDQUFDLENBQUM7TUFDeEQsSUFBSXhkLEdBQUcsS0FBSyxlQUFlLEVBQUU4SSxVQUFVLENBQUNLLFFBQVEsQ0FBQ3FVLEdBQUcsQ0FBQyxDQUFDO01BQ3RELElBQUl4ZCxHQUFHLEtBQUssU0FBUyxFQUFFOEksVUFBVSxDQUFDdUYsVUFBVSxDQUFDbVAsR0FBRyxDQUFDLENBQUM7TUFDbEQsSUFBSXhkLEdBQUcsS0FBSyxTQUFTLEVBQUU4SSxVQUFVLENBQUMrRCxVQUFVLENBQUMzRixNQUFNLENBQUNzVyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQzFELElBQUl4ZCxHQUFHLEtBQUssa0JBQWtCLEVBQUU4SSxVQUFVLENBQUNnRSxrQkFBa0IsQ0FBQzVGLE1BQU0sQ0FBQ3NXLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDM0UsSUFBSXhkLEdBQUcsS0FBSyxxQkFBcUIsRUFBRThJLFVBQVUsQ0FBQ2lFLG9CQUFvQixDQUFDeVEsR0FBRyxDQUFDLENBQUM7TUFDeEUsSUFBSXhkLEdBQUcsS0FBSyxPQUFPLEVBQUUsQ0FBRSxJQUFJd2QsR0FBRyxFQUFFMVUsVUFBVSxDQUFDd0YsUUFBUSxDQUFDa1AsR0FBRyxDQUFDLENBQUUsQ0FBQztNQUMzRCxJQUFJeGQsR0FBRyxLQUFLLE1BQU0sRUFBRThJLFVBQVUsQ0FBQ3lGLFNBQVMsQ0FBQ2lQLEdBQUcsQ0FBQyxDQUFDO01BQzlDLElBQUl4ZCxHQUFHLEtBQUssa0JBQWtCLEVBQUU4SSxVQUFVLENBQUNrRSxvQkFBb0IsQ0FBQ3dRLEdBQUcsQ0FBQyxDQUFDO01BQ3JFLElBQUl4ZCxHQUFHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUU7TUFBQSxLQUNqQ2tSLE9BQU8sQ0FBQ29SLEdBQUcsQ0FBQyxpREFBaUQsR0FBR3RpQixHQUFHLEdBQUcsSUFBSSxHQUFHd2QsR0FBRyxDQUFDO0lBQ3hGO0lBQ0EsT0FBTzFVLFVBQVU7RUFDbkI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFpQm1OLGdCQUFnQkEsQ0FBQ3ZWLE1BQU0sRUFBRTBQLEVBQUUsRUFBRTBGLGdCQUFnQixFQUFFO0lBQzlELElBQUksQ0FBQzFGLEVBQUUsRUFBRUEsRUFBRSxHQUFHLElBQUk0Rix1QkFBYyxDQUFDLENBQUM7SUFDbEMsSUFBSWtCLEtBQUssR0FBR3hXLE1BQU0sQ0FBQzBULFFBQVEsQ0FBQyxDQUFDLEtBQUssSUFBSTtJQUN0Q2hFLEVBQUUsQ0FBQzBWLGFBQWEsQ0FBQyxJQUFJLENBQUM7SUFDdEIxVixFQUFFLENBQUN1VyxjQUFjLENBQUMsS0FBSyxDQUFDO0lBQ3hCdlcsRUFBRSxDQUFDK0osbUJBQW1CLENBQUMsQ0FBQyxDQUFDO0lBQ3pCL0osRUFBRSxDQUFDaUgsV0FBVyxDQUFDSCxLQUFLLENBQUM7SUFDckI5RyxFQUFFLENBQUN3VyxRQUFRLENBQUMxUCxLQUFLLENBQUM7SUFDbEI5RyxFQUFFLENBQUNnSCxZQUFZLENBQUNGLEtBQUssQ0FBQztJQUN0QjlHLEVBQUUsQ0FBQ3lXLFlBQVksQ0FBQyxLQUFLLENBQUM7SUFDdEJ6VyxFQUFFLENBQUMwVyxXQUFXLENBQUMsS0FBSyxDQUFDO0lBQ3JCMVcsRUFBRSxDQUFDc1csV0FBVyxDQUFDLElBQUksQ0FBQztJQUNwQnRXLEVBQUUsQ0FBQzhYLFdBQVcsQ0FBQ0Msb0JBQVcsQ0FBQ0MsU0FBUyxDQUFDO0lBQ3JDLElBQUlyWSxRQUFRLEdBQUcsSUFBSXNZLCtCQUFzQixDQUFDLENBQUM7SUFDM0N0WSxRQUFRLENBQUN1WSxLQUFLLENBQUNsWSxFQUFFLENBQUM7SUFDbEIsSUFBSTFQLE1BQU0sQ0FBQzRULG9CQUFvQixDQUFDLENBQUMsSUFBSTVULE1BQU0sQ0FBQzRULG9CQUFvQixDQUFDLENBQUMsQ0FBQ3ZJLE1BQU0sS0FBSyxDQUFDLEVBQUVnRSxRQUFRLENBQUNvRyxvQkFBb0IsQ0FBQ3pWLE1BQU0sQ0FBQzRULG9CQUFvQixDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4SixJQUFJdUIsZ0JBQWdCLEVBQUU7TUFDcEIsSUFBSXlTLFVBQVUsR0FBRyxFQUFFO01BQ25CLEtBQUssSUFBSUMsSUFBSSxJQUFJOW5CLE1BQU0sQ0FBQ2dVLGVBQWUsQ0FBQyxDQUFDLEVBQUU2VCxVQUFVLENBQUMzYixJQUFJLENBQUM0YixJQUFJLENBQUM3WSxJQUFJLENBQUMsQ0FBQyxDQUFDO01BQ3ZFSSxRQUFRLENBQUNpWCxlQUFlLENBQUN1QixVQUFVLENBQUM7SUFDdEM7SUFDQW5ZLEVBQUUsQ0FBQzZXLG1CQUFtQixDQUFDbFgsUUFBUSxDQUFDO0lBQ2hDSyxFQUFFLENBQUNuRyxZQUFZLENBQUN2SixNQUFNLENBQUN1VSxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLElBQUk3RSxFQUFFLENBQUM4RSxhQUFhLENBQUMsQ0FBQyxLQUFLalUsU0FBUyxFQUFFbVAsRUFBRSxDQUFDOFcsYUFBYSxDQUFDeG1CLE1BQU0sQ0FBQ3dVLGFBQWEsQ0FBQyxDQUFDLEtBQUtqVSxTQUFTLEdBQUcsQ0FBQyxHQUFHUCxNQUFNLENBQUN3VSxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBQ3pILElBQUl4VSxNQUFNLENBQUMwVCxRQUFRLENBQUMsQ0FBQyxFQUFFO01BQ3JCLElBQUloRSxFQUFFLENBQUMrVyx1QkFBdUIsQ0FBQyxDQUFDLEtBQUtsbUIsU0FBUyxFQUFFbVAsRUFBRSxDQUFDZ1gsdUJBQXVCLENBQUMsQ0FBQyxJQUFJQyxJQUFJLENBQUMsQ0FBQyxDQUFDQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtNQUNwRyxJQUFJbFgsRUFBRSxDQUFDbVgsb0JBQW9CLENBQUMsQ0FBQyxLQUFLdG1CLFNBQVMsRUFBRW1QLEVBQUUsQ0FBQ29YLG9CQUFvQixDQUFDLEtBQUssQ0FBQztJQUM3RTtJQUNBLE9BQU9wWCxFQUFFO0VBQ1g7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFpQnFZLGVBQWVBLENBQUNDLE1BQU0sRUFBRTtJQUN2QyxJQUFJdlIsS0FBSyxHQUFHLElBQUl3UixvQkFBVyxDQUFDLENBQUM7SUFDN0J4UixLQUFLLENBQUN5UixnQkFBZ0IsQ0FBQ0YsTUFBTSxDQUFDdlEsY0FBYyxDQUFDO0lBQzdDaEIsS0FBSyxDQUFDMFIsZ0JBQWdCLENBQUNILE1BQU0sQ0FBQ3pRLGNBQWMsQ0FBQztJQUM3Q2QsS0FBSyxDQUFDMlIsY0FBYyxDQUFDSixNQUFNLENBQUNLLFlBQVksQ0FBQztJQUN6QyxJQUFJNVIsS0FBSyxDQUFDaUIsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLblgsU0FBUyxJQUFJa1csS0FBSyxDQUFDaUIsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDck0sTUFBTSxLQUFLLENBQUMsRUFBRW9MLEtBQUssQ0FBQ3lSLGdCQUFnQixDQUFDM25CLFNBQVMsQ0FBQztJQUN0SCxJQUFJa1csS0FBSyxDQUFDZSxnQkFBZ0IsQ0FBQyxDQUFDLEtBQUtqWCxTQUFTLElBQUlrVyxLQUFLLENBQUNlLGdCQUFnQixDQUFDLENBQUMsQ0FBQ25NLE1BQU0sS0FBSyxDQUFDLEVBQUVvTCxLQUFLLENBQUMwUixnQkFBZ0IsQ0FBQzVuQixTQUFTLENBQUM7SUFDdEgsSUFBSWtXLEtBQUssQ0FBQzZSLGNBQWMsQ0FBQyxDQUFDLEtBQUsvbkIsU0FBUyxJQUFJa1csS0FBSyxDQUFDNlIsY0FBYyxDQUFDLENBQUMsQ0FBQ2pkLE1BQU0sS0FBSyxDQUFDLEVBQUVvTCxLQUFLLENBQUMyUixjQUFjLENBQUM3bkIsU0FBUyxDQUFDO0lBQ2hILE9BQU9rVyxLQUFLO0VBQ2Q7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQWlCZix3QkFBd0JBLENBQUM2UyxNQUFXLEVBQUVyWixHQUFTLEVBQUVsUCxNQUFZLEVBQUU7O0lBRTlFO0lBQ0EsSUFBSXlXLEtBQUssR0FBRzdXLGVBQWUsQ0FBQ21vQixlQUFlLENBQUNRLE1BQU0sQ0FBQzs7SUFFbkQ7SUFDQSxJQUFJdFQsTUFBTSxHQUFHc1QsTUFBTSxDQUFDclQsUUFBUSxHQUFHcVQsTUFBTSxDQUFDclQsUUFBUSxDQUFDN0osTUFBTSxHQUFHa2QsTUFBTSxDQUFDclEsWUFBWSxHQUFHcVEsTUFBTSxDQUFDclEsWUFBWSxDQUFDN00sTUFBTSxHQUFHLENBQUM7O0lBRTVHO0lBQ0EsSUFBSTRKLE1BQU0sS0FBSyxDQUFDLEVBQUU7TUFDaEI1TyxlQUFNLENBQUNDLEtBQUssQ0FBQzRJLEdBQUcsRUFBRTNPLFNBQVMsQ0FBQztNQUM1QixPQUFPa1csS0FBSztJQUNkOztJQUVBO0lBQ0EsSUFBSXZILEdBQUcsRUFBRXVILEtBQUssQ0FBQytSLE1BQU0sQ0FBQ3RaLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCO01BQ0hBLEdBQUcsR0FBRyxFQUFFO01BQ1IsS0FBSyxJQUFJbUcsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHSixNQUFNLEVBQUVJLENBQUMsRUFBRSxFQUFFbkcsR0FBRyxDQUFDaEQsSUFBSSxDQUFDLElBQUlvSix1QkFBYyxDQUFDLENBQUMsQ0FBQztJQUNqRTtJQUNBLEtBQUssSUFBSTVGLEVBQUUsSUFBSVIsR0FBRyxFQUFFO01BQ2xCUSxFQUFFLENBQUMrWSxRQUFRLENBQUNoUyxLQUFLLENBQUM7TUFDbEIvRyxFQUFFLENBQUMwVixhQUFhLENBQUMsSUFBSSxDQUFDO0lBQ3hCO0lBQ0EzTyxLQUFLLENBQUMrUixNQUFNLENBQUN0WixHQUFHLENBQUM7O0lBRWpCO0lBQ0EsS0FBSyxJQUFJNVAsR0FBRyxJQUFJSCxNQUFNLENBQUNnWCxJQUFJLENBQUNvUyxNQUFNLENBQUMsRUFBRTtNQUNuQyxJQUFJekwsR0FBRyxHQUFHeUwsTUFBTSxDQUFDanBCLEdBQUcsQ0FBQztNQUNyQixJQUFJQSxHQUFHLEtBQUssY0FBYyxFQUFFLEtBQUssSUFBSStWLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR3lILEdBQUcsQ0FBQ3pSLE1BQU0sRUFBRWdLLENBQUMsRUFBRSxFQUFFbkcsR0FBRyxDQUFDbUcsQ0FBQyxDQUFDLENBQUNxVCxPQUFPLENBQUM1TCxHQUFHLENBQUN6SCxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ25GLElBQUkvVixHQUFHLEtBQUssYUFBYSxFQUFFLEtBQUssSUFBSStWLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR3lILEdBQUcsQ0FBQ3pSLE1BQU0sRUFBRWdLLENBQUMsRUFBRSxFQUFFbkcsR0FBRyxDQUFDbUcsQ0FBQyxDQUFDLENBQUNzVCxNQUFNLENBQUM3TCxHQUFHLENBQUN6SCxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3RGLElBQUkvVixHQUFHLEtBQUssY0FBYyxFQUFFLEtBQUssSUFBSStWLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR3lILEdBQUcsQ0FBQ3pSLE1BQU0sRUFBRWdLLENBQUMsRUFBRSxFQUFFbkcsR0FBRyxDQUFDbUcsQ0FBQyxDQUFDLENBQUN1VCxVQUFVLENBQUM5TCxHQUFHLENBQUN6SCxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQzNGLElBQUkvVixHQUFHLEtBQUssa0JBQWtCLEVBQUUsS0FBSyxJQUFJK1YsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHeUgsR0FBRyxDQUFDelIsTUFBTSxFQUFFZ0ssQ0FBQyxFQUFFLEVBQUVuRyxHQUFHLENBQUNtRyxDQUFDLENBQUMsQ0FBQ3dULFdBQVcsQ0FBQy9MLEdBQUcsQ0FBQ3pILENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDaEcsSUFBSS9WLEdBQUcsS0FBSyxVQUFVLEVBQUUsS0FBSyxJQUFJK1YsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHeUgsR0FBRyxDQUFDelIsTUFBTSxFQUFFZ0ssQ0FBQyxFQUFFLEVBQUVuRyxHQUFHLENBQUNtRyxDQUFDLENBQUMsQ0FBQ3lULE1BQU0sQ0FBQ3RpQixNQUFNLENBQUNzVyxHQUFHLENBQUN6SCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDM0YsSUFBSS9WLEdBQUcsS0FBSyxhQUFhLEVBQUUsS0FBSyxJQUFJK1YsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHeUgsR0FBRyxDQUFDelIsTUFBTSxFQUFFZ0ssQ0FBQyxFQUFFLEVBQUVuRyxHQUFHLENBQUNtRyxDQUFDLENBQUMsQ0FBQzBULFNBQVMsQ0FBQ2pNLEdBQUcsQ0FBQ3pILENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDekYsSUFBSS9WLEdBQUcsS0FBSyxhQUFhLEVBQUU7UUFDOUIsS0FBSyxJQUFJK1YsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHeUgsR0FBRyxDQUFDelIsTUFBTSxFQUFFZ0ssQ0FBQyxFQUFFLEVBQUU7VUFDbkMsSUFBSW5HLEdBQUcsQ0FBQ21HLENBQUMsQ0FBQyxDQUFDRyxtQkFBbUIsQ0FBQyxDQUFDLElBQUlqVixTQUFTLEVBQUUyTyxHQUFHLENBQUNtRyxDQUFDLENBQUMsQ0FBQ2tSLG1CQUFtQixDQUFDLElBQUlvQiwrQkFBc0IsQ0FBQyxDQUFDLENBQUNDLEtBQUssQ0FBQzFZLEdBQUcsQ0FBQ21HLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDckhuRyxHQUFHLENBQUNtRyxDQUFDLENBQUMsQ0FBQ0csbUJBQW1CLENBQUMsQ0FBQyxDQUFDTyxTQUFTLENBQUN2UCxNQUFNLENBQUNzVyxHQUFHLENBQUN6SCxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hEO01BQ0YsQ0FBQztNQUNJLElBQUkvVixHQUFHLEtBQUssZ0JBQWdCLElBQUlBLEdBQUcsS0FBSyxnQkFBZ0IsSUFBSUEsR0FBRyxLQUFLLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztNQUFBLEtBQ3ZGLElBQUlBLEdBQUcsS0FBSyx1QkFBdUIsRUFBRTtRQUN4QyxJQUFJMHBCLGtCQUFrQixHQUFHbE0sR0FBRztRQUM1QixLQUFLLElBQUl6SCxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUcyVCxrQkFBa0IsQ0FBQzNkLE1BQU0sRUFBRWdLLENBQUMsRUFBRSxFQUFFO1VBQ2xEM1UsaUJBQVEsQ0FBQ3VvQixVQUFVLENBQUMvWixHQUFHLENBQUNtRyxDQUFDLENBQUMsQ0FBQzZULFNBQVMsQ0FBQyxDQUFDLEtBQUszb0IsU0FBUyxDQUFDO1VBQ3JEMk8sR0FBRyxDQUFDbUcsQ0FBQyxDQUFDLENBQUM4VCxTQUFTLENBQUMsRUFBRSxDQUFDO1VBQ3BCLEtBQUssSUFBSUMsYUFBYSxJQUFJSixrQkFBa0IsQ0FBQzNULENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxFQUFFO1lBQzdEbkcsR0FBRyxDQUFDbUcsQ0FBQyxDQUFDLENBQUM2VCxTQUFTLENBQUMsQ0FBQyxDQUFDaGQsSUFBSSxDQUFDLElBQUltZCwyQkFBa0IsQ0FBQyxDQUFDLENBQUNDLFdBQVcsQ0FBQyxJQUFJekQsdUJBQWMsQ0FBQyxDQUFDLENBQUMwRCxNQUFNLENBQUNILGFBQWEsQ0FBQyxDQUFDLENBQUN4QixLQUFLLENBQUMxWSxHQUFHLENBQUNtRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQ3pIO1FBQ0Y7TUFDRixDQUFDO01BQ0ksSUFBSS9WLEdBQUcsS0FBSyxzQkFBc0IsRUFBRTtRQUN2QyxJQUFJa3FCLGlCQUFpQixHQUFHMU0sR0FBRztRQUMzQixJQUFJMk0sY0FBYyxHQUFHLENBQUM7UUFDdEIsS0FBSyxJQUFJQyxLQUFLLEdBQUcsQ0FBQyxFQUFFQSxLQUFLLEdBQUdGLGlCQUFpQixDQUFDbmUsTUFBTSxFQUFFcWUsS0FBSyxFQUFFLEVBQUU7VUFDN0QsSUFBSUMsYUFBYSxHQUFHSCxpQkFBaUIsQ0FBQ0UsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDO1VBQ3ZELElBQUl4YSxHQUFHLENBQUN3YSxLQUFLLENBQUMsQ0FBQ2xVLG1CQUFtQixDQUFDLENBQUMsS0FBS2pWLFNBQVMsRUFBRTJPLEdBQUcsQ0FBQ3dhLEtBQUssQ0FBQyxDQUFDbkQsbUJBQW1CLENBQUMsSUFBSW9CLCtCQUFzQixDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFDMVksR0FBRyxDQUFDd2EsS0FBSyxDQUFDLENBQUMsQ0FBQztVQUNsSXhhLEdBQUcsQ0FBQ3dhLEtBQUssQ0FBQyxDQUFDbFUsbUJBQW1CLENBQUMsQ0FBQyxDQUFDOFEsZUFBZSxDQUFDLEVBQUUsQ0FBQztVQUNwRCxLQUFLLElBQUlwUyxNQUFNLElBQUl5VixhQUFhLEVBQUU7WUFDaEMsSUFBSTNwQixNQUFNLENBQUNnVSxlQUFlLENBQUMsQ0FBQyxDQUFDM0ksTUFBTSxLQUFLLENBQUMsRUFBRTZELEdBQUcsQ0FBQ3dhLEtBQUssQ0FBQyxDQUFDbFUsbUJBQW1CLENBQUMsQ0FBQyxDQUFDeEIsZUFBZSxDQUFDLENBQUMsQ0FBQzlILElBQUksQ0FBQyxJQUFJbWEsMEJBQWlCLENBQUNybUIsTUFBTSxDQUFDZ1UsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ2hNLFVBQVUsQ0FBQyxDQUFDLEVBQUV4QixNQUFNLENBQUMwTixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFBLEtBQ2hMaEYsR0FBRyxDQUFDd2EsS0FBSyxDQUFDLENBQUNsVSxtQkFBbUIsQ0FBQyxDQUFDLENBQUN4QixlQUFlLENBQUMsQ0FBQyxDQUFDOUgsSUFBSSxDQUFDLElBQUltYSwwQkFBaUIsQ0FBQ3JtQixNQUFNLENBQUNnVSxlQUFlLENBQUMsQ0FBQyxDQUFDeVYsY0FBYyxFQUFFLENBQUMsQ0FBQ3poQixVQUFVLENBQUMsQ0FBQyxFQUFFeEIsTUFBTSxDQUFDME4sTUFBTSxDQUFDLENBQUMsQ0FBQztVQUM5SjtRQUNGO01BQ0YsQ0FBQztNQUNJMUQsT0FBTyxDQUFDb1IsR0FBRyxDQUFDLGtEQUFrRCxHQUFHdGlCLEdBQUcsR0FBRyxJQUFJLEdBQUd3ZCxHQUFHLENBQUM7SUFDekY7O0lBRUEsT0FBT3JHLEtBQUs7RUFDZDs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFpQmQsbUJBQW1CQSxDQUFDZ1AsS0FBSyxFQUFFalYsRUFBRSxFQUFFa2EsVUFBVSxFQUFFNXBCLE1BQU0sRUFBRTtJQUNsRSxJQUFJeVcsS0FBSyxHQUFHN1csZUFBZSxDQUFDbW9CLGVBQWUsQ0FBQ3BELEtBQUssQ0FBQztJQUNsRGxPLEtBQUssQ0FBQytSLE1BQU0sQ0FBQyxDQUFDNW9CLGVBQWUsQ0FBQ2dsQix3QkFBd0IsQ0FBQ0QsS0FBSyxFQUFFalYsRUFBRSxFQUFFa2EsVUFBVSxFQUFFNXBCLE1BQU0sQ0FBQyxDQUFDeW9CLFFBQVEsQ0FBQ2hTLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDdkcsT0FBT0EsS0FBSztFQUNkOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQWlCbU8sd0JBQXdCQSxDQUFDRCxLQUFVLEVBQUVqVixFQUFRLEVBQUVrYSxVQUFnQixFQUFFNXBCLE1BQVksRUFBRSxDQUFHOztJQUVqRztJQUNBLElBQUksQ0FBQzBQLEVBQUUsRUFBRUEsRUFBRSxHQUFHLElBQUk0Rix1QkFBYyxDQUFDLENBQUM7O0lBRWxDO0lBQ0EsSUFBSXFQLEtBQUssQ0FBQ2tGLElBQUksS0FBS3RwQixTQUFTLEVBQUVxcEIsVUFBVSxHQUFHaHFCLGVBQWUsQ0FBQ2txQixhQUFhLENBQUNuRixLQUFLLENBQUNrRixJQUFJLEVBQUVuYSxFQUFFLENBQUMsQ0FBQztJQUNwRnJKLGVBQU0sQ0FBQ0MsS0FBSyxDQUFDLE9BQU9zakIsVUFBVSxFQUFFLFNBQVMsRUFBRSwyRUFBMkUsQ0FBQzs7SUFFNUg7SUFDQTtJQUNBLElBQUlHLE1BQU07SUFDVixJQUFJMWEsUUFBUTtJQUNaLEtBQUssSUFBSS9QLEdBQUcsSUFBSUgsTUFBTSxDQUFDZ1gsSUFBSSxDQUFDd08sS0FBSyxDQUFDLEVBQUU7TUFDbEMsSUFBSTdILEdBQUcsR0FBRzZILEtBQUssQ0FBQ3JsQixHQUFHLENBQUM7TUFDcEIsSUFBSUEsR0FBRyxLQUFLLE1BQU0sRUFBRW9RLEVBQUUsQ0FBQ2daLE9BQU8sQ0FBQzVMLEdBQUcsQ0FBQyxDQUFDO01BQy9CLElBQUl4ZCxHQUFHLEtBQUssU0FBUyxFQUFFb1EsRUFBRSxDQUFDZ1osT0FBTyxDQUFDNUwsR0FBRyxDQUFDLENBQUM7TUFDdkMsSUFBSXhkLEdBQUcsS0FBSyxLQUFLLEVBQUVvUSxFQUFFLENBQUNvWixNQUFNLENBQUN0aUIsTUFBTSxDQUFDc1csR0FBRyxDQUFDLENBQUMsQ0FBQztNQUMxQyxJQUFJeGQsR0FBRyxLQUFLLE1BQU0sRUFBRSxDQUFFLElBQUl3ZCxHQUFHLEVBQUVwTixFQUFFLENBQUNnTixPQUFPLENBQUNJLEdBQUcsQ0FBQyxDQUFFLENBQUM7TUFDakQsSUFBSXhkLEdBQUcsS0FBSyxRQUFRLEVBQUVvUSxFQUFFLENBQUNpWixNQUFNLENBQUM3TCxHQUFHLENBQUMsQ0FBQztNQUNyQyxJQUFJeGQsR0FBRyxLQUFLLE1BQU0sRUFBRSxDQUFFLENBQUMsQ0FBQztNQUFBLEtBQ3hCLElBQUlBLEdBQUcsS0FBSyxTQUFTLEVBQUVvUSxFQUFFLENBQUNzYSxPQUFPLENBQUNsTixHQUFHLENBQUMsQ0FBQztNQUN2QyxJQUFJeGQsR0FBRyxLQUFLLGFBQWEsRUFBRW9RLEVBQUUsQ0FBQzhXLGFBQWEsQ0FBQzFKLEdBQUcsQ0FBQyxDQUFDO01BQ2pELElBQUl4ZCxHQUFHLEtBQUssUUFBUSxFQUFFb1EsRUFBRSxDQUFDcVosU0FBUyxDQUFDak0sR0FBRyxDQUFDLENBQUM7TUFDeEMsSUFBSXhkLEdBQUcsS0FBSyxRQUFRLEVBQUVvUSxFQUFFLENBQUNzVyxXQUFXLENBQUNsSixHQUFHLENBQUMsQ0FBQztNQUMxQyxJQUFJeGQsR0FBRyxLQUFLLFNBQVMsRUFBRW9RLEVBQUUsQ0FBQ2taLFVBQVUsQ0FBQzlMLEdBQUcsQ0FBQyxDQUFDO01BQzFDLElBQUl4ZCxHQUFHLEtBQUssYUFBYSxFQUFFb1EsRUFBRSxDQUFDbVosV0FBVyxDQUFDL0wsR0FBRyxDQUFDLENBQUM7TUFDL0MsSUFBSXhkLEdBQUcsS0FBSyxtQkFBbUIsRUFBRW9RLEVBQUUsQ0FBQ29YLG9CQUFvQixDQUFDaEssR0FBRyxDQUFDLENBQUM7TUFDOUQsSUFBSXhkLEdBQUcsS0FBSyxjQUFjLElBQUlBLEdBQUcsS0FBSyxRQUFRLEVBQUU7UUFDbkQsSUFBSW9RLEVBQUUsQ0FBQ2EsY0FBYyxDQUFDLENBQUMsRUFBRTtVQUN2QixJQUFJLENBQUN3WixNQUFNLEVBQUVBLE1BQU0sR0FBRyxJQUFJRSwwQkFBaUIsQ0FBQyxDQUFDO1VBQzdDRixNQUFNLENBQUNuWCxTQUFTLENBQUNrSyxHQUFHLENBQUM7UUFDdkI7TUFDRixDQUFDO01BQ0ksSUFBSXhkLEdBQUcsS0FBSyxXQUFXLEVBQUU7UUFDNUIsSUFBSW9RLEVBQUUsQ0FBQ2EsY0FBYyxDQUFDLENBQUMsRUFBRTtVQUN2QixJQUFJLENBQUN3WixNQUFNLEVBQUVBLE1BQU0sR0FBRyxJQUFJRSwwQkFBaUIsQ0FBQyxDQUFDO1VBQzdDRixNQUFNLENBQUNHLFlBQVksQ0FBQ3BOLEdBQUcsQ0FBQztRQUMxQixDQUFDLE1BQU07O1VBQ0w7UUFBQSxDQUVKLENBQUM7TUFDSSxJQUFJeGQsR0FBRyxLQUFLLGVBQWUsRUFBRW9RLEVBQUUsQ0FBQytKLG1CQUFtQixDQUFDcUQsR0FBRyxDQUFDLENBQUM7TUFDekQsSUFBSXhkLEdBQUcsS0FBSyxtQ0FBbUMsRUFBRTtRQUNwRCxJQUFJK1AsUUFBUSxLQUFLOU8sU0FBUyxFQUFFOE8sUUFBUSxHQUFHLENBQUN1YSxVQUFVLEdBQUcsSUFBSWpDLCtCQUFzQixDQUFDLENBQUMsR0FBRyxJQUFJd0MsK0JBQXNCLENBQUMsQ0FBQyxFQUFFdkMsS0FBSyxDQUFDbFksRUFBRSxDQUFDO1FBQzNILElBQUksQ0FBQ2thLFVBQVUsRUFBRXZhLFFBQVEsQ0FBQythLDRCQUE0QixDQUFDdE4sR0FBRyxDQUFDO01BQzdELENBQUM7TUFDSSxJQUFJeGQsR0FBRyxLQUFLLFFBQVEsRUFBRTtRQUN6QixJQUFJK1AsUUFBUSxLQUFLOU8sU0FBUyxFQUFFOE8sUUFBUSxHQUFHLENBQUN1YSxVQUFVLEdBQUcsSUFBSWpDLCtCQUFzQixDQUFDLENBQUMsR0FBRyxJQUFJd0MsK0JBQXNCLENBQUMsQ0FBQyxFQUFFdkMsS0FBSyxDQUFDbFksRUFBRSxDQUFDO1FBQzNITCxRQUFRLENBQUMwRyxTQUFTLENBQUN2UCxNQUFNLENBQUNzVyxHQUFHLENBQUMsQ0FBQztNQUNqQyxDQUFDO01BQ0ksSUFBSXhkLEdBQUcsS0FBSyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUU7TUFBQSxLQUMzQixJQUFJQSxHQUFHLEtBQUssU0FBUyxFQUFFO1FBQzFCLElBQUksQ0FBQ3NxQixVQUFVLEVBQUU7VUFDZixJQUFJLENBQUN2YSxRQUFRLEVBQUVBLFFBQVEsR0FBRyxJQUFJOGEsK0JBQXNCLENBQUMsQ0FBQyxDQUFDdkMsS0FBSyxDQUFDbFksRUFBRSxDQUFDO1VBQ2hFTCxRQUFRLENBQUMxQixVQUFVLENBQUNtUCxHQUFHLENBQUM7UUFDMUI7TUFDRixDQUFDO01BQ0ksSUFBSXhkLEdBQUcsS0FBSyxZQUFZLEVBQUU7UUFDN0IsSUFBSSxFQUFFLEtBQUt3ZCxHQUFHLElBQUl4SCx1QkFBYyxDQUFDK1Usa0JBQWtCLEtBQUt2TixHQUFHLEVBQUVwTixFQUFFLENBQUNuRyxZQUFZLENBQUN1VCxHQUFHLENBQUMsQ0FBQyxDQUFFO01BQ3RGLENBQUM7TUFDSSxJQUFJeGQsR0FBRyxLQUFLLGVBQWUsRUFBRSxJQUFBK0csZUFBTSxFQUFDc2UsS0FBSyxDQUFDclEsZUFBZSxDQUFDLENBQUMsQ0FBRTtNQUFBLEtBQzdELElBQUloVixHQUFHLEtBQUssaUJBQWlCLEVBQUU7UUFDbEMsSUFBSSxDQUFDK1AsUUFBUSxFQUFFQSxRQUFRLEdBQUcsQ0FBQ3VhLFVBQVUsR0FBRyxJQUFJakMsK0JBQXNCLENBQUMsQ0FBQyxHQUFHLElBQUl3QywrQkFBc0IsQ0FBQyxDQUFDLEVBQUV2QyxLQUFLLENBQUNsWSxFQUFFLENBQUM7UUFDOUcsSUFBSTRhLFVBQVUsR0FBR3hOLEdBQUc7UUFDcEJ6TixRQUFRLENBQUMvRyxlQUFlLENBQUNnaUIsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDOWhCLEtBQUssQ0FBQztRQUM3QyxJQUFJb2hCLFVBQVUsRUFBRTtVQUNkLElBQUl6YyxpQkFBaUIsR0FBRyxFQUFFO1VBQzFCLEtBQUssSUFBSW9kLFFBQVEsSUFBSUQsVUFBVSxFQUFFbmQsaUJBQWlCLENBQUNqQixJQUFJLENBQUNxZSxRQUFRLENBQUM3aEIsS0FBSyxDQUFDO1VBQ3ZFMkcsUUFBUSxDQUFDb0csb0JBQW9CLENBQUN0SSxpQkFBaUIsQ0FBQztRQUNsRCxDQUFDLE1BQU07VUFDTDlHLGVBQU0sQ0FBQ0MsS0FBSyxDQUFDZ2tCLFVBQVUsQ0FBQ2pmLE1BQU0sRUFBRSxDQUFDLENBQUM7VUFDbENnRSxRQUFRLENBQUNtYixrQkFBa0IsQ0FBQ0YsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDNWhCLEtBQUssQ0FBQztRQUNsRDtNQUNGLENBQUM7TUFDSSxJQUFJcEosR0FBRyxLQUFLLGNBQWMsSUFBSUEsR0FBRyxJQUFJLFlBQVksRUFBRTtRQUN0RCxJQUFBK0csZUFBTSxFQUFDdWpCLFVBQVUsQ0FBQztRQUNsQixJQUFJOVYsWUFBWSxHQUFHLEVBQUU7UUFDckIsS0FBSyxJQUFJMlcsY0FBYyxJQUFJM04sR0FBRyxFQUFFO1VBQzlCLElBQUkvSSxXQUFXLEdBQUcsSUFBSXNTLDBCQUFpQixDQUFDLENBQUM7VUFDekN2UyxZQUFZLENBQUM1SCxJQUFJLENBQUM2SCxXQUFXLENBQUM7VUFDOUIsS0FBSyxJQUFJMlcsY0FBYyxJQUFJdnJCLE1BQU0sQ0FBQ2dYLElBQUksQ0FBQ3NVLGNBQWMsQ0FBQyxFQUFFO1lBQ3RELElBQUlDLGNBQWMsS0FBSyxTQUFTLEVBQUUzVyxXQUFXLENBQUNwRyxVQUFVLENBQUM4YyxjQUFjLENBQUNDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDcEYsSUFBSUEsY0FBYyxLQUFLLFFBQVEsRUFBRTNXLFdBQVcsQ0FBQ2dDLFNBQVMsQ0FBQ3ZQLE1BQU0sQ0FBQ2lrQixjQUFjLENBQUNDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRixNQUFNLElBQUlscUIsb0JBQVcsQ0FBQyw4Q0FBOEMsR0FBR2txQixjQUFjLENBQUM7VUFDN0Y7UUFDRjtRQUNBLElBQUlyYixRQUFRLEtBQUs5TyxTQUFTLEVBQUU4TyxRQUFRLEdBQUcsSUFBSXNZLCtCQUFzQixDQUFDLEVBQUNqWSxFQUFFLEVBQUVBLEVBQUUsRUFBQyxDQUFDO1FBQzNFTCxRQUFRLENBQUNpWCxlQUFlLENBQUN4UyxZQUFZLENBQUM7TUFDeEMsQ0FBQztNQUNJLElBQUl4VSxHQUFHLEtBQUssZ0JBQWdCLElBQUl3ZCxHQUFHLEtBQUt2YyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7TUFBQSxLQUN0RCxJQUFJakIsR0FBRyxLQUFLLGdCQUFnQixJQUFJd2QsR0FBRyxLQUFLdmMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO01BQUEsS0FDdEQsSUFBSWpCLEdBQUcsS0FBSyxXQUFXLEVBQUVvUSxFQUFFLENBQUNpYixXQUFXLENBQUNua0IsTUFBTSxDQUFDc1csR0FBRyxDQUFDLENBQUMsQ0FBQztNQUNyRCxJQUFJeGQsR0FBRyxLQUFLLFlBQVksRUFBRW9RLEVBQUUsQ0FBQ2tiLFlBQVksQ0FBQ3BrQixNQUFNLENBQUNzVyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQ3ZELElBQUl4ZCxHQUFHLEtBQUssZ0JBQWdCLEVBQUVvUSxFQUFFLENBQUNtYixnQkFBZ0IsQ0FBQy9OLEdBQUcsS0FBSyxFQUFFLEdBQUd2YyxTQUFTLEdBQUd1YyxHQUFHLENBQUMsQ0FBQztNQUNoRixJQUFJeGQsR0FBRyxLQUFLLGVBQWUsRUFBRW9RLEVBQUUsQ0FBQ29iLGVBQWUsQ0FBQ3RrQixNQUFNLENBQUNzVyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQzdELElBQUl4ZCxHQUFHLEtBQUssZUFBZSxFQUFFb1EsRUFBRSxDQUFDcWIsa0JBQWtCLENBQUNqTyxHQUFHLENBQUMsQ0FBQztNQUN4RCxJQUFJeGQsR0FBRyxLQUFLLE9BQU8sRUFBRW9RLEVBQUUsQ0FBQ3NiLFdBQVcsQ0FBQ2xPLEdBQUcsQ0FBQyxDQUFDO01BQ3pDLElBQUl4ZCxHQUFHLEtBQUssV0FBVyxFQUFFb1EsRUFBRSxDQUFDOFgsV0FBVyxDQUFDMUssR0FBRyxDQUFDLENBQUM7TUFDN0MsSUFBSXhkLEdBQUcsS0FBSyxrQkFBa0IsRUFBRTtRQUNuQyxJQUFJMnJCLGNBQWMsR0FBR25PLEdBQUcsQ0FBQ29PLFVBQVU7UUFDbkN4cUIsaUJBQVEsQ0FBQ3VvQixVQUFVLENBQUN2WixFQUFFLENBQUN3WixTQUFTLENBQUMsQ0FBQyxLQUFLM29CLFNBQVMsQ0FBQztRQUNqRG1QLEVBQUUsQ0FBQ3laLFNBQVMsQ0FBQyxFQUFFLENBQUM7UUFDaEIsS0FBSyxJQUFJQyxhQUFhLElBQUk2QixjQUFjLEVBQUU7VUFDeEN2YixFQUFFLENBQUN3WixTQUFTLENBQUMsQ0FBQyxDQUFDaGQsSUFBSSxDQUFDLElBQUltZCwyQkFBa0IsQ0FBQyxDQUFDLENBQUNDLFdBQVcsQ0FBQyxJQUFJekQsdUJBQWMsQ0FBQyxDQUFDLENBQUMwRCxNQUFNLENBQUNILGFBQWEsQ0FBQyxDQUFDLENBQUN4QixLQUFLLENBQUNsWSxFQUFFLENBQUMsQ0FBQztRQUNqSDtNQUNGLENBQUM7TUFDSSxJQUFJcFEsR0FBRyxLQUFLLGlCQUFpQixFQUFFO1FBQ2xDb0IsaUJBQVEsQ0FBQ3VvQixVQUFVLENBQUNXLFVBQVUsQ0FBQztRQUMvQixJQUFJRCxhQUFhLEdBQUc3TSxHQUFHLENBQUNxTyxPQUFPO1FBQy9COWtCLGVBQU0sQ0FBQ0MsS0FBSyxDQUFDdEcsTUFBTSxDQUFDZ1UsZUFBZSxDQUFDLENBQUMsQ0FBQzNJLE1BQU0sRUFBRXNlLGFBQWEsQ0FBQ3RlLE1BQU0sQ0FBQztRQUNuRSxJQUFJZ0UsUUFBUSxLQUFLOU8sU0FBUyxFQUFFOE8sUUFBUSxHQUFHLElBQUlzWSwrQkFBc0IsQ0FBQyxDQUFDLENBQUNDLEtBQUssQ0FBQ2xZLEVBQUUsQ0FBQztRQUM3RUwsUUFBUSxDQUFDaVgsZUFBZSxDQUFDLEVBQUUsQ0FBQztRQUM1QixLQUFLLElBQUlqUixDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdyVixNQUFNLENBQUNnVSxlQUFlLENBQUMsQ0FBQyxDQUFDM0ksTUFBTSxFQUFFZ0ssQ0FBQyxFQUFFLEVBQUU7VUFDeERoRyxRQUFRLENBQUMyRSxlQUFlLENBQUMsQ0FBQyxDQUFDOUgsSUFBSSxDQUFDLElBQUltYSwwQkFBaUIsQ0FBQ3JtQixNQUFNLENBQUNnVSxlQUFlLENBQUMsQ0FBQyxDQUFDcUIsQ0FBQyxDQUFDLENBQUNyTixVQUFVLENBQUMsQ0FBQyxFQUFFeEIsTUFBTSxDQUFDbWpCLGFBQWEsQ0FBQ3RVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1SDtNQUNGLENBQUM7TUFDSTdFLE9BQU8sQ0FBQ29SLEdBQUcsQ0FBQyxnRUFBZ0UsR0FBR3RpQixHQUFHLEdBQUcsSUFBSSxHQUFHd2QsR0FBRyxDQUFDO0lBQ3ZHOztJQUVBO0lBQ0EsSUFBSWlOLE1BQU0sRUFBRXJhLEVBQUUsQ0FBQzBiLFFBQVEsQ0FBQyxJQUFJQyxvQkFBVyxDQUFDdEIsTUFBTSxDQUFDLENBQUN2QixNQUFNLENBQUMsQ0FBQzlZLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0lBRTdEO0lBQ0EsSUFBSUwsUUFBUSxFQUFFO01BQ1osSUFBSUssRUFBRSxDQUFDYSxjQUFjLENBQUMsQ0FBQyxLQUFLaFEsU0FBUyxFQUFFbVAsRUFBRSxDQUFDdVcsY0FBYyxDQUFDLEtBQUssQ0FBQztNQUMvRCxJQUFJLENBQUM1VyxRQUFRLENBQUNDLEtBQUssQ0FBQyxDQUFDLENBQUNpQixjQUFjLENBQUMsQ0FBQyxFQUFFYixFQUFFLENBQUMrSixtQkFBbUIsQ0FBQyxDQUFDLENBQUM7TUFDakUsSUFBSW1RLFVBQVUsRUFBRTtRQUNkbGEsRUFBRSxDQUFDMFYsYUFBYSxDQUFDLElBQUksQ0FBQztRQUN0QixJQUFJMVYsRUFBRSxDQUFDOEYsbUJBQW1CLENBQUMsQ0FBQyxFQUFFO1VBQzVCLElBQUluRyxRQUFRLENBQUMyRSxlQUFlLENBQUMsQ0FBQyxFQUFFdEUsRUFBRSxDQUFDOEYsbUJBQW1CLENBQUMsQ0FBQyxDQUFDOFEsZUFBZSxDQUFDL2xCLFNBQVMsQ0FBQyxDQUFDLENBQUM7VUFDckZtUCxFQUFFLENBQUM4RixtQkFBbUIsQ0FBQyxDQUFDLENBQUM4VixLQUFLLENBQUNqYyxRQUFRLENBQUM7UUFDMUMsQ0FBQztRQUNJSyxFQUFFLENBQUM2VyxtQkFBbUIsQ0FBQ2xYLFFBQVEsQ0FBQztNQUN2QyxDQUFDLE1BQU07UUFDTEssRUFBRSxDQUFDeVYsYUFBYSxDQUFDLElBQUksQ0FBQztRQUN0QnpWLEVBQUUsQ0FBQzZiLG9CQUFvQixDQUFDLENBQUNsYyxRQUFRLENBQUMsQ0FBQztNQUNyQztJQUNGOztJQUVBO0lBQ0EsT0FBT0ssRUFBRTtFQUNYOztFQUVBLE9BQWlCZ1csNEJBQTRCQSxDQUFDRCxTQUFTLEVBQUU7O0lBRXZEO0lBQ0EsSUFBSS9WLEVBQUUsR0FBRyxJQUFJNEYsdUJBQWMsQ0FBQyxDQUFDO0lBQzdCNUYsRUFBRSxDQUFDdVcsY0FBYyxDQUFDLElBQUksQ0FBQztJQUN2QnZXLEVBQUUsQ0FBQ2dILFlBQVksQ0FBQyxJQUFJLENBQUM7SUFDckJoSCxFQUFFLENBQUMwVyxXQUFXLENBQUMsS0FBSyxDQUFDOztJQUVyQjtJQUNBLElBQUlsVyxNQUFNLEdBQUcsSUFBSW1aLDJCQUFrQixDQUFDLEVBQUMzWixFQUFFLEVBQUVBLEVBQUUsRUFBQyxDQUFDO0lBQzdDLEtBQUssSUFBSXBRLEdBQUcsSUFBSUgsTUFBTSxDQUFDZ1gsSUFBSSxDQUFDc1AsU0FBUyxDQUFDLEVBQUU7TUFDdEMsSUFBSTNJLEdBQUcsR0FBRzJJLFNBQVMsQ0FBQ25tQixHQUFHLENBQUM7TUFDeEIsSUFBSUEsR0FBRyxLQUFLLFFBQVEsRUFBRTRRLE1BQU0sQ0FBQzZGLFNBQVMsQ0FBQ3ZQLE1BQU0sQ0FBQ3NXLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDL0MsSUFBSXhkLEdBQUcsS0FBSyxPQUFPLEVBQUU0USxNQUFNLENBQUNzYixVQUFVLENBQUMxTyxHQUFHLENBQUMsQ0FBQztNQUM1QyxJQUFJeGQsR0FBRyxLQUFLLFdBQVcsRUFBRSxDQUFFLElBQUksRUFBRSxLQUFLd2QsR0FBRyxFQUFFNU0sTUFBTSxDQUFDb1osV0FBVyxDQUFDLElBQUl6RCx1QkFBYyxDQUFDL0ksR0FBRyxDQUFDLENBQUMsQ0FBRSxDQUFDO01BQ3pGLElBQUl4ZCxHQUFHLEtBQUssY0FBYyxFQUFFNFEsTUFBTSxDQUFDekgsUUFBUSxDQUFDcVUsR0FBRyxDQUFDLENBQUM7TUFDakQsSUFBSXhkLEdBQUcsS0FBSyxTQUFTLEVBQUVvUSxFQUFFLENBQUNnWixPQUFPLENBQUM1TCxHQUFHLENBQUMsQ0FBQztNQUN2QyxJQUFJeGQsR0FBRyxLQUFLLFVBQVUsRUFBRW9RLEVBQUUsQ0FBQ3NXLFdBQVcsQ0FBQyxDQUFDbEosR0FBRyxDQUFDLENBQUM7TUFDN0MsSUFBSXhkLEdBQUcsS0FBSyxRQUFRLEVBQUU0USxNQUFNLENBQUN1YixXQUFXLENBQUMzTyxHQUFHLENBQUMsQ0FBQztNQUM5QyxJQUFJeGQsR0FBRyxLQUFLLFFBQVEsRUFBRTRRLE1BQU0sQ0FBQ3diLG1CQUFtQixDQUFDNU8sR0FBRyxDQUFDLENBQUM7TUFDdEQsSUFBSXhkLEdBQUcsS0FBSyxlQUFlLEVBQUU7UUFDaEM0USxNQUFNLENBQUM1SCxlQUFlLENBQUN3VSxHQUFHLENBQUN0VSxLQUFLLENBQUM7UUFDakMwSCxNQUFNLENBQUNzYSxrQkFBa0IsQ0FBQzFOLEdBQUcsQ0FBQ3BVLEtBQUssQ0FBQztNQUN0QyxDQUFDO01BQ0ksSUFBSXBKLEdBQUcsS0FBSyxjQUFjLEVBQUVvUSxFQUFFLENBQUMwYixRQUFRLENBQUUsSUFBSUMsb0JBQVcsQ0FBQyxDQUFDLENBQUN6WSxTQUFTLENBQUNrSyxHQUFHLENBQUMsQ0FBaUIwTCxNQUFNLENBQUMsQ0FBQzlZLEVBQUUsQ0FBYSxDQUFDLENBQUMsQ0FBQztNQUNwSGMsT0FBTyxDQUFDb1IsR0FBRyxDQUFDLGtEQUFrRCxHQUFHdGlCLEdBQUcsR0FBRyxJQUFJLEdBQUd3ZCxHQUFHLENBQUM7SUFDekY7O0lBRUE7SUFDQXBOLEVBQUUsQ0FBQ2ljLFVBQVUsQ0FBQyxDQUFDemIsTUFBTSxDQUFDLENBQUM7SUFDdkIsT0FBT1IsRUFBRTtFQUNYOztFQUVBLE9BQWlCaUksMEJBQTBCQSxDQUFDaVUseUJBQXlCLEVBQUU7SUFDckUsSUFBSW5WLEtBQUssR0FBRyxJQUFJd1Isb0JBQVcsQ0FBQyxDQUFDO0lBQzdCLEtBQUssSUFBSTNvQixHQUFHLElBQUlILE1BQU0sQ0FBQ2dYLElBQUksQ0FBQ3lWLHlCQUF5QixDQUFDLEVBQUU7TUFDdEQsSUFBSTlPLEdBQUcsR0FBRzhPLHlCQUF5QixDQUFDdHNCLEdBQUcsQ0FBQztNQUN4QyxJQUFJQSxHQUFHLEtBQUssTUFBTSxFQUFFO1FBQ2xCbVgsS0FBSyxDQUFDK1IsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUNoQixLQUFLLElBQUloWixLQUFLLElBQUlzTixHQUFHLEVBQUU7VUFDckIsSUFBSXBOLEVBQUUsR0FBRzlQLGVBQWUsQ0FBQ2dsQix3QkFBd0IsQ0FBQ3BWLEtBQUssRUFBRWpQLFNBQVMsRUFBRSxJQUFJLENBQUM7VUFDekVtUCxFQUFFLENBQUMrWSxRQUFRLENBQUNoUyxLQUFLLENBQUM7VUFDbEJBLEtBQUssQ0FBQzFJLE1BQU0sQ0FBQyxDQUFDLENBQUM3QixJQUFJLENBQUN3RCxFQUFFLENBQUM7UUFDekI7TUFDRixDQUFDO01BQ0ksSUFBSXBRLEdBQUcsS0FBSyxTQUFTLEVBQUUsQ0FBRSxDQUFDLENBQUM7TUFBQSxLQUMzQmtSLE9BQU8sQ0FBQ29SLEdBQUcsQ0FBQyx5REFBeUQsR0FBR3RpQixHQUFHLEdBQUcsSUFBSSxHQUFHd2QsR0FBRyxDQUFDO0lBQ2hHO0lBQ0EsT0FBT3JHLEtBQUs7RUFDZDs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQWlCcVQsYUFBYUEsQ0FBQytCLE9BQU8sRUFBRW5jLEVBQUUsRUFBRTtJQUMxQyxJQUFJa2EsVUFBVTtJQUNkLElBQUlpQyxPQUFPLEtBQUssSUFBSSxFQUFFO01BQ3BCakMsVUFBVSxHQUFHLEtBQUs7TUFDbEJsYSxFQUFFLENBQUN1VyxjQUFjLENBQUMsSUFBSSxDQUFDO01BQ3ZCdlcsRUFBRSxDQUFDaUgsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQmpILEVBQUUsQ0FBQ2dILFlBQVksQ0FBQyxJQUFJLENBQUM7TUFDckJoSCxFQUFFLENBQUN3VyxRQUFRLENBQUMsSUFBSSxDQUFDO01BQ2pCeFcsRUFBRSxDQUFDMFcsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQjFXLEVBQUUsQ0FBQ3lXLFlBQVksQ0FBQyxLQUFLLENBQUM7SUFDeEIsQ0FBQyxNQUFNLElBQUkwRixPQUFPLEtBQUssS0FBSyxFQUFFO01BQzVCakMsVUFBVSxHQUFHLElBQUk7TUFDakJsYSxFQUFFLENBQUN1VyxjQUFjLENBQUMsSUFBSSxDQUFDO01BQ3ZCdlcsRUFBRSxDQUFDaUgsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQmpILEVBQUUsQ0FBQ2dILFlBQVksQ0FBQyxJQUFJLENBQUM7TUFDckJoSCxFQUFFLENBQUN3VyxRQUFRLENBQUMsSUFBSSxDQUFDO01BQ2pCeFcsRUFBRSxDQUFDMFcsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQjFXLEVBQUUsQ0FBQ3lXLFlBQVksQ0FBQyxLQUFLLENBQUM7SUFDeEIsQ0FBQyxNQUFNLElBQUkwRixPQUFPLEtBQUssTUFBTSxFQUFFO01BQzdCakMsVUFBVSxHQUFHLEtBQUs7TUFDbEJsYSxFQUFFLENBQUN1VyxjQUFjLENBQUMsS0FBSyxDQUFDO01BQ3hCdlcsRUFBRSxDQUFDaUgsV0FBVyxDQUFDLElBQUksQ0FBQztNQUNwQmpILEVBQUUsQ0FBQ2dILFlBQVksQ0FBQyxJQUFJLENBQUM7TUFDckJoSCxFQUFFLENBQUN3VyxRQUFRLENBQUMsSUFBSSxDQUFDO01BQ2pCeFcsRUFBRSxDQUFDMFcsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQjFXLEVBQUUsQ0FBQ3lXLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFFO0lBQzNCLENBQUMsTUFBTSxJQUFJMEYsT0FBTyxLQUFLLFNBQVMsRUFBRTtNQUNoQ2pDLFVBQVUsR0FBRyxJQUFJO01BQ2pCbGEsRUFBRSxDQUFDdVcsY0FBYyxDQUFDLEtBQUssQ0FBQztNQUN4QnZXLEVBQUUsQ0FBQ2lILFdBQVcsQ0FBQyxJQUFJLENBQUM7TUFDcEJqSCxFQUFFLENBQUNnSCxZQUFZLENBQUMsSUFBSSxDQUFDO01BQ3JCaEgsRUFBRSxDQUFDd1csUUFBUSxDQUFDLElBQUksQ0FBQztNQUNqQnhXLEVBQUUsQ0FBQzBXLFdBQVcsQ0FBQyxLQUFLLENBQUM7TUFDckIxVyxFQUFFLENBQUN5VyxZQUFZLENBQUMsS0FBSyxDQUFDO0lBQ3hCLENBQUMsTUFBTSxJQUFJMEYsT0FBTyxLQUFLLE9BQU8sRUFBRTtNQUM5QmpDLFVBQVUsR0FBRyxLQUFLO01BQ2xCbGEsRUFBRSxDQUFDdVcsY0FBYyxDQUFDLElBQUksQ0FBQztNQUN2QnZXLEVBQUUsQ0FBQ2lILFdBQVcsQ0FBQyxLQUFLLENBQUM7TUFDckJqSCxFQUFFLENBQUNnSCxZQUFZLENBQUMsSUFBSSxDQUFDO01BQ3JCaEgsRUFBRSxDQUFDd1csUUFBUSxDQUFDLElBQUksQ0FBQztNQUNqQnhXLEVBQUUsQ0FBQzBXLFdBQVcsQ0FBQyxLQUFLLENBQUM7TUFDckIxVyxFQUFFLENBQUN5VyxZQUFZLENBQUMsSUFBSSxDQUFDO0lBQ3ZCLENBQUMsTUFBTSxJQUFJMEYsT0FBTyxLQUFLLFFBQVEsRUFBRTtNQUMvQmpDLFVBQVUsR0FBRyxJQUFJO01BQ2pCbGEsRUFBRSxDQUFDdVcsY0FBYyxDQUFDLEtBQUssQ0FBQztNQUN4QnZXLEVBQUUsQ0FBQ2lILFdBQVcsQ0FBQyxLQUFLLENBQUM7TUFDckJqSCxFQUFFLENBQUNnSCxZQUFZLENBQUMsSUFBSSxDQUFDO01BQ3JCaEgsRUFBRSxDQUFDd1csUUFBUSxDQUFDLElBQUksQ0FBQztNQUNqQnhXLEVBQUUsQ0FBQzBXLFdBQVcsQ0FBQyxJQUFJLENBQUM7TUFDcEIxVyxFQUFFLENBQUN5VyxZQUFZLENBQUMsS0FBSyxDQUFDO0lBQ3hCLENBQUMsTUFBTTtNQUNMLE1BQU0sSUFBSTNsQixvQkFBVyxDQUFDLDhCQUE4QixHQUFHcXJCLE9BQU8sQ0FBQztJQUNqRTtJQUNBLE9BQU9qQyxVQUFVO0VBQ25COztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBaUJqYSxPQUFPQSxDQUFDRCxFQUFFLEVBQUVGLEtBQUssRUFBRUMsUUFBUSxFQUFFO0lBQzVDLElBQUFwSixlQUFNLEVBQUNxSixFQUFFLENBQUNtQixPQUFPLENBQUMsQ0FBQyxLQUFLdFEsU0FBUyxDQUFDOztJQUVsQztJQUNBLElBQUl1ckIsR0FBRyxHQUFHdGMsS0FBSyxDQUFDRSxFQUFFLENBQUNtQixPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzdCLElBQUlpYixHQUFHLEtBQUt2ckIsU0FBUyxFQUFFaVAsS0FBSyxDQUFDRSxFQUFFLENBQUNtQixPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUduQixFQUFFLENBQUMsQ0FBQztJQUFBLEtBQzVDb2MsR0FBRyxDQUFDUixLQUFLLENBQUM1YixFQUFFLENBQUMsQ0FBQyxDQUFDOztJQUVwQjtJQUNBLElBQUlBLEVBQUUsQ0FBQ2pHLFNBQVMsQ0FBQyxDQUFDLEtBQUtsSixTQUFTLEVBQUU7TUFDaEMsSUFBSXdyQixNQUFNLEdBQUd0YyxRQUFRLENBQUNDLEVBQUUsQ0FBQ2pHLFNBQVMsQ0FBQyxDQUFDLENBQUM7TUFDckMsSUFBSXNpQixNQUFNLEtBQUt4ckIsU0FBUyxFQUFFa1AsUUFBUSxDQUFDQyxFQUFFLENBQUNqRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUdpRyxFQUFFLENBQUNXLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUFBLEtBQy9EMGIsTUFBTSxDQUFDVCxLQUFLLENBQUM1YixFQUFFLENBQUNXLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BDO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0VBQ0UsT0FBaUI2VSxrQkFBa0JBLENBQUM4RyxHQUFHLEVBQUVDLEdBQUcsRUFBRTtJQUM1QyxJQUFJRCxHQUFHLENBQUN2aUIsU0FBUyxDQUFDLENBQUMsS0FBS2xKLFNBQVMsSUFBSTByQixHQUFHLENBQUN4aUIsU0FBUyxDQUFDLENBQUMsS0FBS2xKLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQUEsS0FDekUsSUFBSXlyQixHQUFHLENBQUN2aUIsU0FBUyxDQUFDLENBQUMsS0FBS2xKLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFHO0lBQUEsS0FDL0MsSUFBSTByQixHQUFHLENBQUN4aUIsU0FBUyxDQUFDLENBQUMsS0FBS2xKLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUU7SUFDcEQsSUFBSTJyQixJQUFJLEdBQUdGLEdBQUcsQ0FBQ3ZpQixTQUFTLENBQUMsQ0FBQyxHQUFHd2lCLEdBQUcsQ0FBQ3hpQixTQUFTLENBQUMsQ0FBQztJQUM1QyxJQUFJeWlCLElBQUksS0FBSyxDQUFDLEVBQUUsT0FBT0EsSUFBSTtJQUMzQixPQUFPRixHQUFHLENBQUMzYixRQUFRLENBQUMsQ0FBQyxDQUFDdEMsTUFBTSxDQUFDLENBQUMsQ0FBQ3ZHLE9BQU8sQ0FBQ3drQixHQUFHLENBQUMsR0FBR0MsR0FBRyxDQUFDNWIsUUFBUSxDQUFDLENBQUMsQ0FBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUN2RyxPQUFPLENBQUN5a0IsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN0Rjs7RUFFQTtBQUNGO0FBQ0E7RUFDRSxPQUFPNUcsd0JBQXdCQSxDQUFDOEcsRUFBRSxFQUFFQyxFQUFFLEVBQUU7SUFDdEMsSUFBSUQsRUFBRSxDQUFDemYsZUFBZSxDQUFDLENBQUMsR0FBRzBmLEVBQUUsQ0FBQzFmLGVBQWUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUN0RCxJQUFJeWYsRUFBRSxDQUFDemYsZUFBZSxDQUFDLENBQUMsS0FBSzBmLEVBQUUsQ0FBQzFmLGVBQWUsQ0FBQyxDQUFDLEVBQUUsT0FBT3lmLEVBQUUsQ0FBQzNILGtCQUFrQixDQUFDLENBQUMsR0FBRzRILEVBQUUsQ0FBQzVILGtCQUFrQixDQUFDLENBQUM7SUFDaEgsT0FBTyxDQUFDO0VBQ1Y7O0VBRUE7QUFDRjtBQUNBO0VBQ0UsT0FBaUJtQixjQUFjQSxDQUFDMEcsRUFBRSxFQUFFQyxFQUFFLEVBQUU7O0lBRXRDO0lBQ0EsSUFBSUMsZ0JBQWdCLEdBQUczc0IsZUFBZSxDQUFDc2xCLGtCQUFrQixDQUFDbUgsRUFBRSxDQUFDL2MsS0FBSyxDQUFDLENBQUMsRUFBRWdkLEVBQUUsQ0FBQ2hkLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDakYsSUFBSWlkLGdCQUFnQixLQUFLLENBQUMsRUFBRSxPQUFPQSxnQkFBZ0I7O0lBRW5EO0lBQ0EsSUFBSUMsT0FBTyxHQUFHSCxFQUFFLENBQUMzZixlQUFlLENBQUMsQ0FBQyxHQUFHNGYsRUFBRSxDQUFDNWYsZUFBZSxDQUFDLENBQUM7SUFDekQsSUFBSThmLE9BQU8sS0FBSyxDQUFDLEVBQUUsT0FBT0EsT0FBTztJQUNqQ0EsT0FBTyxHQUFHSCxFQUFFLENBQUM3SCxrQkFBa0IsQ0FBQyxDQUFDLEdBQUc4SCxFQUFFLENBQUM5SCxrQkFBa0IsQ0FBQyxDQUFDO0lBQzNELElBQUlnSSxPQUFPLEtBQUssQ0FBQyxFQUFFLE9BQU9BLE9BQU87SUFDakNBLE9BQU8sR0FBR0gsRUFBRSxDQUFDcGdCLFFBQVEsQ0FBQyxDQUFDLEdBQUdxZ0IsRUFBRSxDQUFDcmdCLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZDLElBQUl1Z0IsT0FBTyxLQUFLLENBQUMsRUFBRSxPQUFPQSxPQUFPO0lBQ2pDLE9BQU9ILEVBQUUsQ0FBQ3ZXLFdBQVcsQ0FBQyxDQUFDLENBQUN4RCxNQUFNLENBQUMsQ0FBQyxDQUFDbWEsYUFBYSxDQUFDSCxFQUFFLENBQUN4VyxXQUFXLENBQUMsQ0FBQyxDQUFDeEQsTUFBTSxDQUFDLENBQUMsQ0FBQztFQUMzRTtBQUNGOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FKQW9hLE9BQUEsQ0FBQTd0QixPQUFBLEdBQUFlLGVBQUE7QUFLQSxNQUFNb25CLFlBQVksQ0FBQzs7RUFFakI7Ozs7Ozs7Ozs7OztFQVlBam5CLFdBQVdBLENBQUM4aUIsTUFBTSxFQUFFO0lBQ2xCLElBQUl0QixJQUFJLEdBQUcsSUFBSTtJQUNmLElBQUksQ0FBQ3NCLE1BQU0sR0FBR0EsTUFBTTtJQUNwQixJQUFJLENBQUM4SixNQUFNLEdBQUcsSUFBSUMsbUJBQVUsQ0FBQyxrQkFBaUIsQ0FBRSxNQUFNckwsSUFBSSxDQUFDbFgsSUFBSSxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUM7SUFDckUsSUFBSSxDQUFDd2lCLGFBQWEsR0FBRyxFQUFFO0lBQ3ZCLElBQUksQ0FBQ0MsNEJBQTRCLEdBQUcsSUFBSTFkLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvQyxJQUFJLENBQUMyZCwwQkFBMEIsR0FBRyxJQUFJM2QsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdDLElBQUksQ0FBQzRkLFVBQVUsR0FBRyxJQUFJQyxtQkFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckMsSUFBSSxDQUFDQyxVQUFVLEdBQUcsQ0FBQztFQUNyQjs7RUFFQWpHLFlBQVlBLENBQUNDLFNBQVMsRUFBRTtJQUN0QixJQUFJLENBQUNBLFNBQVMsR0FBR0EsU0FBUztJQUMxQixJQUFJQSxTQUFTLEVBQUUsSUFBSSxDQUFDeUYsTUFBTSxDQUFDUSxLQUFLLENBQUMsSUFBSSxDQUFDdEssTUFBTSxDQUFDNVgsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0QsSUFBSSxDQUFDMGhCLE1BQU0sQ0FBQzVNLElBQUksQ0FBQyxDQUFDO0VBQ3pCOztFQUVBL1UsYUFBYUEsQ0FBQ29pQixVQUFVLEVBQUU7SUFDeEIsSUFBSSxDQUFDVCxNQUFNLENBQUMzaEIsYUFBYSxDQUFDb2lCLFVBQVUsQ0FBQztFQUN2Qzs7RUFFQSxNQUFNL2lCLElBQUlBLENBQUEsRUFBRzs7SUFFWDtJQUNBLElBQUksSUFBSSxDQUFDNmlCLFVBQVUsR0FBRyxDQUFDLEVBQUU7SUFDekIsSUFBSSxDQUFDQSxVQUFVLEVBQUU7O0lBRWpCO0lBQ0EsSUFBSTNMLElBQUksR0FBRyxJQUFJO0lBQ2YsT0FBTyxJQUFJLENBQUN5TCxVQUFVLENBQUNLLE1BQU0sQ0FBQyxrQkFBaUI7TUFDN0MsSUFBSTs7UUFFRjtRQUNBLElBQUksTUFBTTlMLElBQUksQ0FBQ3NCLE1BQU0sQ0FBQy9DLFFBQVEsQ0FBQyxDQUFDLEVBQUU7VUFDaEN5QixJQUFJLENBQUMyTCxVQUFVLEVBQUU7VUFDakI7UUFDRjs7UUFFQTtRQUNBLElBQUkzTCxJQUFJLENBQUMrTCxZQUFZLEtBQUsvc0IsU0FBUyxFQUFFO1VBQ25DZ2hCLElBQUksQ0FBQ2dNLFVBQVUsR0FBRyxNQUFNaE0sSUFBSSxDQUFDc0IsTUFBTSxDQUFDcFosU0FBUyxDQUFDLENBQUM7VUFDL0M4WCxJQUFJLENBQUNzTCxhQUFhLEdBQUcsTUFBTXRMLElBQUksQ0FBQ3NCLE1BQU0sQ0FBQzlVLE1BQU0sQ0FBQyxJQUFJeWYsc0JBQWEsQ0FBQyxDQUFDLENBQUN4SCxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7VUFDcEZ6RSxJQUFJLENBQUMrTCxZQUFZLEdBQUcsTUFBTS9MLElBQUksQ0FBQ3NCLE1BQU0sQ0FBQzNjLFdBQVcsQ0FBQyxDQUFDO1VBQ25EcWIsSUFBSSxDQUFDMkwsVUFBVSxFQUFFO1VBQ2pCO1FBQ0Y7O1FBRUE7UUFDQSxJQUFJeGpCLE1BQU0sR0FBRyxNQUFNNlgsSUFBSSxDQUFDc0IsTUFBTSxDQUFDcFosU0FBUyxDQUFDLENBQUM7UUFDMUMsSUFBSThYLElBQUksQ0FBQ2dNLFVBQVUsS0FBSzdqQixNQUFNLEVBQUU7VUFDOUIsS0FBSyxJQUFJMkwsQ0FBQyxHQUFHa00sSUFBSSxDQUFDZ00sVUFBVSxFQUFFbFksQ0FBQyxHQUFHM0wsTUFBTSxFQUFFMkwsQ0FBQyxFQUFFLEVBQUUsTUFBTWtNLElBQUksQ0FBQ2tNLFVBQVUsQ0FBQ3BZLENBQUMsQ0FBQztVQUN2RWtNLElBQUksQ0FBQ2dNLFVBQVUsR0FBRzdqQixNQUFNO1FBQzFCOztRQUVBO1FBQ0EsSUFBSWdrQixTQUFTLEdBQUcvaUIsSUFBSSxDQUFDZ2pCLEdBQUcsQ0FBQyxDQUFDLEVBQUVqa0IsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUMsSUFBSWtrQixTQUFTLEdBQUcsTUFBTXJNLElBQUksQ0FBQ3NCLE1BQU0sQ0FBQzlVLE1BQU0sQ0FBQyxJQUFJeWYsc0JBQWEsQ0FBQyxDQUFDLENBQUN4SCxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM2SCxZQUFZLENBQUNILFNBQVMsQ0FBQyxDQUFDSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7UUFFL0g7UUFDQSxJQUFJQyxvQkFBb0IsR0FBRyxFQUFFO1FBQzdCLEtBQUssSUFBSUMsWUFBWSxJQUFJek0sSUFBSSxDQUFDc0wsYUFBYSxFQUFFO1VBQzNDLElBQUl0TCxJQUFJLENBQUNqUyxLQUFLLENBQUNzZSxTQUFTLEVBQUVJLFlBQVksQ0FBQ25kLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBS3RRLFNBQVMsRUFBRTtZQUMvRHd0QixvQkFBb0IsQ0FBQzdoQixJQUFJLENBQUM4aEIsWUFBWSxDQUFDbmQsT0FBTyxDQUFDLENBQUMsQ0FBQztVQUNuRDtRQUNGOztRQUVBO1FBQ0EwUSxJQUFJLENBQUNzTCxhQUFhLEdBQUdlLFNBQVM7O1FBRTlCO1FBQ0EsSUFBSUssV0FBVyxHQUFHRixvQkFBb0IsQ0FBQzFpQixNQUFNLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxNQUFNa1csSUFBSSxDQUFDc0IsTUFBTSxDQUFDOVUsTUFBTSxDQUFDLElBQUl5ZixzQkFBYSxDQUFDLENBQUMsQ0FBQ3hILFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQzZILFlBQVksQ0FBQ0gsU0FBUyxDQUFDLENBQUNRLFNBQVMsQ0FBQ0gsb0JBQW9CLENBQUMsQ0FBQ0QsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7O1FBRTNNO1FBQ0EsS0FBSyxJQUFJSyxRQUFRLElBQUlQLFNBQVMsRUFBRTtVQUM5QixJQUFJUSxTQUFTLEdBQUdELFFBQVEsQ0FBQzVkLGNBQWMsQ0FBQyxDQUFDLEdBQUdnUixJQUFJLENBQUN3TCwwQkFBMEIsR0FBR3hMLElBQUksQ0FBQ3VMLDRCQUE0QjtVQUMvRyxJQUFJdUIsV0FBVyxHQUFHLENBQUNELFNBQVMsQ0FBQ3J2QixHQUFHLENBQUNvdkIsUUFBUSxDQUFDdGQsT0FBTyxDQUFDLENBQUMsQ0FBQztVQUNwRHVkLFNBQVMsQ0FBQzdlLEdBQUcsQ0FBQzRlLFFBQVEsQ0FBQ3RkLE9BQU8sQ0FBQyxDQUFDLENBQUM7VUFDakMsSUFBSXdkLFdBQVcsRUFBRSxNQUFNOU0sSUFBSSxDQUFDK00sYUFBYSxDQUFDSCxRQUFRLENBQUM7UUFDckQ7O1FBRUE7UUFDQSxLQUFLLElBQUlJLFVBQVUsSUFBSU4sV0FBVyxFQUFFO1VBQ2xDMU0sSUFBSSxDQUFDdUwsNEJBQTRCLENBQUMwQixNQUFNLENBQUNELFVBQVUsQ0FBQzFkLE9BQU8sQ0FBQyxDQUFDLENBQUM7VUFDOUQwUSxJQUFJLENBQUN3TCwwQkFBMEIsQ0FBQ3lCLE1BQU0sQ0FBQ0QsVUFBVSxDQUFDMWQsT0FBTyxDQUFDLENBQUMsQ0FBQztVQUM1RCxNQUFNMFEsSUFBSSxDQUFDK00sYUFBYSxDQUFDQyxVQUFVLENBQUM7UUFDdEM7O1FBRUE7UUFDQSxNQUFNaE4sSUFBSSxDQUFDa04sdUJBQXVCLENBQUMsQ0FBQztRQUNwQ2xOLElBQUksQ0FBQzJMLFVBQVUsRUFBRTtNQUNuQixDQUFDLENBQUMsT0FBTzVwQixHQUFRLEVBQUU7UUFDakJpZSxJQUFJLENBQUMyTCxVQUFVLEVBQUU7UUFDakIxYyxPQUFPLENBQUNDLEtBQUssQ0FBQyxvQ0FBb0MsSUFBRyxNQUFNOFEsSUFBSSxDQUFDc0IsTUFBTSxDQUFDdGhCLE9BQU8sQ0FBQyxDQUFDLElBQUcsS0FBSyxHQUFHK0IsR0FBRyxDQUFDYSxPQUFPLENBQUM7TUFDekc7SUFDRixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFnQnNwQixVQUFVQSxDQUFDL2pCLE1BQU0sRUFBRTtJQUNqQyxNQUFNLElBQUksQ0FBQ21aLE1BQU0sQ0FBQzZMLGdCQUFnQixDQUFDaGxCLE1BQU0sQ0FBQztFQUM1Qzs7RUFFQSxNQUFnQjRrQixhQUFhQSxDQUFDNWUsRUFBRSxFQUFFOztJQUVoQztJQUNBLElBQUlBLEVBQUUsQ0FBQzhGLG1CQUFtQixDQUFDLENBQUMsS0FBS2pWLFNBQVMsRUFBRTtNQUMxQyxJQUFBOEYsZUFBTSxFQUFDcUosRUFBRSxDQUFDd1osU0FBUyxDQUFDLENBQUMsS0FBSzNvQixTQUFTLENBQUM7TUFDcEMsSUFBSTJQLE1BQU0sR0FBRyxJQUFJbVosMkJBQWtCLENBQUMsQ0FBQztNQUNoQ3RULFNBQVMsQ0FBQ3JHLEVBQUUsQ0FBQzhGLG1CQUFtQixDQUFDLENBQUMsQ0FBQ3ZCLFNBQVMsQ0FBQyxDQUFDLEdBQUd2RSxFQUFFLENBQUNpZixNQUFNLENBQUMsQ0FBQyxDQUFDO01BQzdEcm1CLGVBQWUsQ0FBQ29ILEVBQUUsQ0FBQzhGLG1CQUFtQixDQUFDLENBQUMsQ0FBQzlJLGVBQWUsQ0FBQyxDQUFDLENBQUM7TUFDM0Q4ZCxrQkFBa0IsQ0FBQzlhLEVBQUUsQ0FBQzhGLG1CQUFtQixDQUFDLENBQUMsQ0FBQzVCLG9CQUFvQixDQUFDLENBQUMsQ0FBQ3ZJLE1BQU0sS0FBSyxDQUFDLEdBQUdxRSxFQUFFLENBQUM4RixtQkFBbUIsQ0FBQyxDQUFDLENBQUM1QixvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUdyVCxTQUFTLENBQUMsQ0FBQztNQUFBLENBQ2xKcW5CLEtBQUssQ0FBQ2xZLEVBQUUsQ0FBQztNQUNkQSxFQUFFLENBQUN5WixTQUFTLENBQUMsQ0FBQ2paLE1BQU0sQ0FBQyxDQUFDO01BQ3RCLE1BQU0sSUFBSSxDQUFDMlMsTUFBTSxDQUFDK0wsbUJBQW1CLENBQUMxZSxNQUFNLENBQUM7SUFDL0M7O0lBRUE7SUFDQSxJQUFJUixFQUFFLENBQUNzUSxvQkFBb0IsQ0FBQyxDQUFDLEtBQUt6ZixTQUFTLEVBQUU7TUFDM0MsSUFBSW1QLEVBQUUsQ0FBQzJCLFVBQVUsQ0FBQyxDQUFDLEtBQUs5USxTQUFTLElBQUltUCxFQUFFLENBQUMyQixVQUFVLENBQUMsQ0FBQyxDQUFDaEcsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFFO1FBQ2pFLEtBQUssSUFBSTZFLE1BQU0sSUFBSVIsRUFBRSxDQUFDMkIsVUFBVSxDQUFDLENBQUMsRUFBRTtVQUNsQyxNQUFNLElBQUksQ0FBQ3dSLE1BQU0sQ0FBQ2dNLHNCQUFzQixDQUFDM2UsTUFBTSxDQUFDO1FBQ2xEO01BQ0YsQ0FBQyxNQUFNLENBQUU7UUFDUCxJQUFJSCxPQUFPLEdBQUcsRUFBRTtRQUNoQixLQUFLLElBQUlWLFFBQVEsSUFBSUssRUFBRSxDQUFDc1Esb0JBQW9CLENBQUMsQ0FBQyxFQUFFO1VBQzlDalEsT0FBTyxDQUFDN0QsSUFBSSxDQUFDLElBQUltZCwyQkFBa0IsQ0FBQyxDQUFDO1VBQ2hDL2dCLGVBQWUsQ0FBQytHLFFBQVEsQ0FBQzNDLGVBQWUsQ0FBQyxDQUFDLENBQUM7VUFDM0M4ZCxrQkFBa0IsQ0FBQ25iLFFBQVEsQ0FBQ21WLGtCQUFrQixDQUFDLENBQUMsQ0FBQztVQUNqRHpPLFNBQVMsQ0FBQzFHLFFBQVEsQ0FBQzRFLFNBQVMsQ0FBQyxDQUFDLENBQUM7VUFDL0IyVCxLQUFLLENBQUNsWSxFQUFFLENBQUMsQ0FBQztRQUNqQjtRQUNBQSxFQUFFLENBQUNpYyxVQUFVLENBQUM1YixPQUFPLENBQUM7UUFDdEIsS0FBSyxJQUFJRyxNQUFNLElBQUlSLEVBQUUsQ0FBQzJCLFVBQVUsQ0FBQyxDQUFDLEVBQUU7VUFDbEMsTUFBTSxJQUFJLENBQUN3UixNQUFNLENBQUNnTSxzQkFBc0IsQ0FBQzNlLE1BQU0sQ0FBQztRQUNsRDtNQUNGO0lBQ0Y7RUFDRjs7RUFFVVosS0FBS0EsQ0FBQ0osR0FBRyxFQUFFK0osTUFBTSxFQUFFO0lBQzNCLEtBQUssSUFBSXZKLEVBQUUsSUFBSVIsR0FBRyxFQUFFLElBQUkrSixNQUFNLEtBQUt2SixFQUFFLENBQUNtQixPQUFPLENBQUMsQ0FBQyxFQUFFLE9BQU9uQixFQUFFO0lBQzFELE9BQU9uUCxTQUFTO0VBQ2xCOztFQUVBLE1BQWdCa3VCLHVCQUF1QkEsQ0FBQSxFQUFHO0lBQ3hDLElBQUlLLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQ2pNLE1BQU0sQ0FBQzNjLFdBQVcsQ0FBQyxDQUFDO0lBQzlDLElBQUk0b0IsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQ3hCLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSXdCLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUN4QixZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUU7TUFDaEYsSUFBSSxDQUFDQSxZQUFZLEdBQUd3QixRQUFRO01BQzVCLE1BQU0sSUFBSSxDQUFDak0sTUFBTSxDQUFDa00sdUJBQXVCLENBQUNELFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRUEsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ25FLE9BQU8sSUFBSTtJQUNiO0lBQ0EsT0FBTyxLQUFLO0VBQ2Q7QUFDRiJ9