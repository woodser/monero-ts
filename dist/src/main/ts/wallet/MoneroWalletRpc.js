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
    this.listeners = [];
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

    // set daemon if provided
    if (config.getServer()) await this.setDaemonConnection(config.getServer());
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

    // create wallet
    if (configNormalized.getSeed() !== undefined) await this.createWalletFromSeed(configNormalized);else
    if (configNormalized.getPrivateSpendKey() !== undefined || configNormalized.getPrimaryAddress() !== undefined) await this.createWalletFromKeys(configNormalized);else
    await this.createWalletRandom(configNormalized);

    // set daemon or connection manager
    if (configNormalized.getConnectionManager()) {
      if (configNormalized.getServer()) throw new _MoneroError.default("Wallet can be initialized with a server or connection manager but not both");
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
   * Get the locked and unlocked balances in a single request.
   * 
   * @param {number} [accountIdx] account index
   * @param {number} [subaddressIdx] subaddress index
   * @return {Promise<bigint[]>} is the locked and unlocked balances in an array, respectively
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
    (0, _assert.default)(listener instanceof _MoneroWalletListener.default, "Listener must be instance of MoneroWalletListener");
    this.listeners.push(listener);
    this.refreshListening();
  }

  async removeListener(listener) {
    let idx = this.listeners.indexOf(listener);
    if (idx > -1) this.listeners.splice(idx, 1);else
    throw new _MoneroError.default("Listener is not registered with wallet");
    this.refreshListening();
  }

  getListeners() {
    return this.listeners;
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
      let resp = await this.config.getServer().sendJsonRequest("refresh", { start_height: startHeight }, 0);
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
    await this.config.getServer().sendJsonRequest("rescan_spent", undefined, 0);
  }

  async rescanBlockchain() {
    await this.config.getServer().sendJsonRequest("rescan_blockchain", undefined, 0);
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
    const process = child_process.spawn(config.cmd[0], config.cmd.slice(1), {});
    process.stdout.setEncoding('utf8');
    process.stderr.setEncoding('utf8');

    // return promise which resolves after starting monero-wallet-rpc
    let uri;
    let that = this;
    let output = "";
    return new Promise(function (resolve, reject) {

      // handle stdout
      process.stdout.on('data', async function (data) {
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
          wallet.process = process;

          // resolve promise with client connected to internal process 
          this.isResolved = true;
          resolve(wallet);
        }
      });

      // handle stderr
      process.stderr.on('data', function (data) {
        if (_LibraryUtils.default.getLogLevel() >= 2) console.error(data);
      });

      // handle exit
      process.on("exit", function (code) {
        if (!this.isResolved) reject(new _MoneroError.default("monero-wallet-rpc process terminated with exit code " + code + (output ? ":\n\n" + output : "")));
      });

      // handle error
      process.on("error", function (err) {
        if (err.message.indexOf("ENOENT") >= 0) reject(new _MoneroError.default("monero-wallet-rpc does not exist at path '" + config.cmd[0] + "'"));
        if (!this.isResolved) reject(err);
      });

      // handle uncaught exception
      process.on("uncaughtException", function (err, origin) {
        console.error("Uncaught exception in monero-wallet-rpc process: " + err.message);
        console.error(origin);
        reject(err);
      });
    });
  }

  async clear() {
    this.listeners.splice(0, this.listeners.length);
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
        if (that.prevHeight === undefined) {
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
        console.error("Failed to background poll " + (await that.wallet.getPath()));
      }
    });
  }

  async onNewBlock(height) {
    for (let listener of this.wallet.getListeners()) await listener.onNewBlock(height);
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
      for (let listener of this.wallet.getListeners()) await listener.onOutputSpent(output);
    }

    // notify received outputs
    if (tx.getIncomingTransfers() !== undefined) {
      if (tx.getOutputs() !== undefined && tx.getOutputs().length > 0) {// TODO (monero-project): outputs only returned for confirmed txs
        for (let output of tx.getOutputs()) {
          for (let listener of this.wallet.getListeners()) await listener.onOutputReceived(output);
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
        for (let listener of this.wallet.getListeners()) {
          for (let output of tx.getOutputs()) await listener.onOutputReceived(output);
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
      for (let listener of await this.wallet.getListeners()) await listener.onBalancesChanged(balances[0], balances[1]);
      return true;
    }
    return false;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiTW9uZXJvV2FsbGV0UnBjIiwiTW9uZXJvV2FsbGV0IiwiREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwiYWRkcmVzc0NhY2hlIiwic3luY1BlcmlvZEluTXMiLCJsaXN0ZW5lcnMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRTZXJ2ZXIiLCJvcGVuV2FsbGV0IiwicGF0aE9yQ29uZmlnIiwicGFzc3dvcmQiLCJNb25lcm9XYWxsZXRDb25maWciLCJwYXRoIiwiZ2V0UGF0aCIsInNlbmRKc29uUmVxdWVzdCIsImZpbGVuYW1lIiwiZ2V0UGFzc3dvcmQiLCJjbGVhciIsInNldERhZW1vbkNvbm5lY3Rpb24iLCJjcmVhdGVXYWxsZXQiLCJjb25maWdOb3JtYWxpemVkIiwiZ2V0U2VlZCIsImdldFByaW1hcnlBZGRyZXNzIiwiZ2V0UHJpdmF0ZVZpZXdLZXkiLCJnZXRQcml2YXRlU3BlbmRLZXkiLCJnZXROZXR3b3JrVHlwZSIsImdldEFjY291bnRMb29rYWhlYWQiLCJnZXRTdWJhZGRyZXNzTG9va2FoZWFkIiwic2V0UGFzc3dvcmQiLCJjcmVhdGVXYWxsZXRGcm9tU2VlZCIsImNyZWF0ZVdhbGxldEZyb21LZXlzIiwiY3JlYXRlV2FsbGV0UmFuZG9tIiwiZ2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJzZXRDb25uZWN0aW9uTWFuYWdlciIsImdldFNlZWRPZmZzZXQiLCJnZXRSZXN0b3JlSGVpZ2h0IiwiZ2V0U2F2ZUN1cnJlbnQiLCJnZXRMYW5ndWFnZSIsInNldExhbmd1YWdlIiwiREVGQVVMVF9MQU5HVUFHRSIsInBhcmFtcyIsImxhbmd1YWdlIiwiZXJyIiwiaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IiLCJzZWVkIiwic2VlZF9vZmZzZXQiLCJlbmFibGVfbXVsdGlzaWdfZXhwZXJpbWVudGFsIiwiZ2V0SXNNdWx0aXNpZyIsInJlc3RvcmVfaGVpZ2h0IiwiYXV0b3NhdmVfY3VycmVudCIsInNldFJlc3RvcmVIZWlnaHQiLCJhZGRyZXNzIiwidmlld2tleSIsInNwZW5ka2V5IiwibmFtZSIsIm1lc3NhZ2UiLCJNb25lcm9ScGNFcnJvciIsImdldENvZGUiLCJnZXRScGNNZXRob2QiLCJnZXRScGNQYXJhbXMiLCJpc1ZpZXdPbmx5Iiwia2V5X3R5cGUiLCJlIiwidXJpT3JDb25uZWN0aW9uIiwiaXNUcnVzdGVkIiwic3NsT3B0aW9ucyIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiU3NsT3B0aW9ucyIsImdldFVyaSIsInVzZXJuYW1lIiwiZ2V0VXNlcm5hbWUiLCJ0cnVzdGVkIiwic3NsX3N1cHBvcnQiLCJzc2xfcHJpdmF0ZV9rZXlfcGF0aCIsImdldFByaXZhdGVLZXlQYXRoIiwic3NsX2NlcnRpZmljYXRlX3BhdGgiLCJnZXRDZXJ0aWZpY2F0ZVBhdGgiLCJzc2xfY2FfZmlsZSIsImdldENlcnRpZmljYXRlQXV0aG9yaXR5RmlsZSIsInNzbF9hbGxvd2VkX2ZpbmdlcnByaW50cyIsImdldEFsbG93ZWRGaW5nZXJwcmludHMiLCJzc2xfYWxsb3dfYW55X2NlcnQiLCJnZXRBbGxvd0FueUNlcnQiLCJkYWVtb25Db25uZWN0aW9uIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImdldEJhbGFuY2VzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJhc3NlcnQiLCJlcXVhbCIsImJhbGFuY2UiLCJCaWdJbnQiLCJ1bmxvY2tlZEJhbGFuY2UiLCJhY2NvdW50IiwiZ2V0QWNjb3VudHMiLCJnZXRCYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudF9pbmRleCIsImFkZHJlc3NfaW5kaWNlcyIsInJlc3AiLCJyZXN1bHQiLCJ1bmxvY2tlZF9iYWxhbmNlIiwicGVyX3N1YmFkZHJlc3MiLCJhZGRMaXN0ZW5lciIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwicHVzaCIsInJlZnJlc2hMaXN0ZW5pbmciLCJpZHgiLCJpbmRleE9mIiwic3BsaWNlIiwiaXNDb25uZWN0ZWRUb0RhZW1vbiIsImNoZWNrUmVzZXJ2ZVByb29mIiwiZ2V0VmVyc2lvbiIsIk1vbmVyb1ZlcnNpb24iLCJ2ZXJzaW9uIiwicmVsZWFzZSIsImdldFNlZWRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJsYW5ndWFnZXMiLCJnZXRBZGRyZXNzIiwic3ViYWRkcmVzc01hcCIsImdldFN1YmFkZHJlc3NlcyIsImdldEFkZHJlc3NJbmRleCIsInN1YmFkZHJlc3MiLCJNb25lcm9TdWJhZGRyZXNzIiwic2V0QWNjb3VudEluZGV4IiwiaW5kZXgiLCJtYWpvciIsInNldEluZGV4IiwibWlub3IiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInN0YW5kYXJkQWRkcmVzcyIsInBheW1lbnRJZCIsImludGVncmF0ZWRBZGRyZXNzU3RyIiwic3RhbmRhcmRfYWRkcmVzcyIsInBheW1lbnRfaWQiLCJpbnRlZ3JhdGVkX2FkZHJlc3MiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImluY2x1ZGVzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsInNldFN0YW5kYXJkQWRkcmVzcyIsInNldFBheW1lbnRJZCIsInNldEludGVncmF0ZWRBZGRyZXNzIiwiZ2V0SGVpZ2h0IiwiaGVpZ2h0IiwiZ2V0RGFlbW9uSGVpZ2h0IiwiZ2V0SGVpZ2h0QnlEYXRlIiwieWVhciIsIm1vbnRoIiwiZGF5Iiwic3luYyIsImxpc3RlbmVyT3JTdGFydEhlaWdodCIsInN0YXJ0SGVpZ2h0Iiwic3RhcnRfaGVpZ2h0IiwicG9sbCIsIk1vbmVyb1N5bmNSZXN1bHQiLCJibG9ja3NfZmV0Y2hlZCIsInJlY2VpdmVkX21vbmV5Iiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluU2Vjb25kcyIsIk1hdGgiLCJyb3VuZCIsImVuYWJsZSIsInBlcmlvZCIsIndhbGxldFBvbGxlciIsInNldFBlcmlvZEluTXMiLCJnZXRTeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwibGVuZ3RoIiwidHhpZHMiLCJyZXNjYW5TcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwic2tpcEJhbGFuY2VzIiwiYWNjb3VudHMiLCJycGNBY2NvdW50Iiwic3ViYWRkcmVzc19hY2NvdW50cyIsImNvbnZlcnRScGNBY2NvdW50Iiwic2V0U3ViYWRkcmVzc2VzIiwiZ2V0SW5kZXgiLCJzZXRCYWxhbmNlIiwic2V0VW5sb2NrZWRCYWxhbmNlIiwic2V0TnVtVW5zcGVudE91dHB1dHMiLCJzZXROdW1CbG9ja3NUb1VubG9jayIsImFsbF9hY2NvdW50cyIsInJwY1N1YmFkZHJlc3MiLCJjb252ZXJ0UnBjU3ViYWRkcmVzcyIsImdldEFjY291bnRJbmRleCIsInRndFN1YmFkZHJlc3MiLCJnZXROdW1VbnNwZW50T3V0cHV0cyIsImdldEFjY291bnQiLCJFcnJvciIsImNyZWF0ZUFjY291bnQiLCJsYWJlbCIsIk1vbmVyb0FjY291bnQiLCJwcmltYXJ5QWRkcmVzcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwiYWRkcmVzc19pbmRleCIsImxpc3RpZnkiLCJzdWJhZGRyZXNzZXMiLCJhZGRyZXNzZXMiLCJnZXROdW1CbG9ja3NUb1VubG9jayIsImdldFN1YmFkZHJlc3MiLCJjcmVhdGVTdWJhZGRyZXNzIiwic2V0QWRkcmVzcyIsInNldExhYmVsIiwic2V0SXNVc2VkIiwic2V0U3ViYWRkcmVzc0xhYmVsIiwiZ2V0VHhzIiwicXVlcnkiLCJxdWVyeU5vcm1hbGl6ZWQiLCJub3JtYWxpemVUeFF1ZXJ5IiwidHJhbnNmZXJRdWVyeSIsImdldFRyYW5zZmVyUXVlcnkiLCJpbnB1dFF1ZXJ5IiwiZ2V0SW5wdXRRdWVyeSIsIm91dHB1dFF1ZXJ5IiwiZ2V0T3V0cHV0UXVlcnkiLCJzZXRUcmFuc2ZlclF1ZXJ5Iiwic2V0SW5wdXRRdWVyeSIsInNldE91dHB1dFF1ZXJ5IiwidHJhbnNmZXJzIiwiZ2V0VHJhbnNmZXJzQXV4IiwiTW9uZXJvVHJhbnNmZXJRdWVyeSIsInNldFR4UXVlcnkiLCJkZWNvbnRleHR1YWxpemUiLCJjb3B5IiwidHhzIiwidHhzU2V0IiwiU2V0IiwidHJhbnNmZXIiLCJnZXRUeCIsImFkZCIsInR4TWFwIiwiYmxvY2tNYXAiLCJ0eCIsIm1lcmdlVHgiLCJnZXRJbmNsdWRlT3V0cHV0cyIsIm91dHB1dFF1ZXJ5QXV4IiwiTW9uZXJvT3V0cHV0UXVlcnkiLCJvdXRwdXRzIiwiZ2V0T3V0cHV0c0F1eCIsIm91dHB1dFR4cyIsIm91dHB1dCIsInR4c1F1ZXJpZWQiLCJtZWV0c0NyaXRlcmlhIiwiZ2V0QmxvY2siLCJnZXRJc0NvbmZpcm1lZCIsImNvbnNvbGUiLCJlcnJvciIsImdldEhhc2hlcyIsInR4c0J5SWQiLCJNYXAiLCJnZXRIYXNoIiwib3JkZXJlZFR4cyIsImhhc2giLCJnZXRUcmFuc2ZlcnMiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiaXNDb250ZXh0dWFsIiwiZ2V0VHhRdWVyeSIsImZpbHRlclRyYW5zZmVycyIsImdldE91dHB1dHMiLCJub3JtYWxpemVPdXRwdXRRdWVyeSIsImZpbHRlck91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwib3V0cHV0c19kYXRhX2hleCIsImltcG9ydE91dHB1dHMiLCJvdXRwdXRzSGV4IiwibnVtX2ltcG9ydGVkIiwiZXhwb3J0S2V5SW1hZ2VzIiwicnBjRXhwb3J0S2V5SW1hZ2VzIiwiaW1wb3J0S2V5SW1hZ2VzIiwia2V5SW1hZ2VzIiwicnBjS2V5SW1hZ2VzIiwibWFwIiwia2V5SW1hZ2UiLCJrZXlfaW1hZ2UiLCJnZXRIZXgiLCJzaWduYXR1cmUiLCJnZXRTaWduYXR1cmUiLCJzaWduZWRfa2V5X2ltYWdlcyIsImltcG9ydFJlc3VsdCIsIk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0Iiwic2V0SGVpZ2h0Iiwic2V0U3BlbnRBbW91bnQiLCJzcGVudCIsInNldFVuc3BlbnRBbW91bnQiLCJ1bnNwZW50IiwiZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQiLCJmcmVlemVPdXRwdXQiLCJ0aGF3T3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJmcm96ZW4iLCJjcmVhdGVUeHMiLCJub3JtYWxpemVDcmVhdGVUeHNDb25maWciLCJnZXRDYW5TcGxpdCIsInNldENhblNwbGl0IiwiZ2V0UmVsYXkiLCJpc011bHRpc2lnIiwiZ2V0U3ViYWRkcmVzc0luZGljZXMiLCJzbGljZSIsImRlc3RpbmF0aW9ucyIsImRlc3RpbmF0aW9uIiwiZ2V0RGVzdGluYXRpb25zIiwiZ2V0QW1vdW50IiwiYW1vdW50IiwidG9TdHJpbmciLCJnZXRTdWJ0cmFjdEZlZUZyb20iLCJzdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzIiwic3ViYWRkcl9pbmRpY2VzIiwiZ2V0UGF5bWVudElkIiwiZ2V0VW5sb2NrVGltZSIsInVubG9ja190aW1lIiwiZG9fbm90X3JlbGF5IiwiZ2V0UHJpb3JpdHkiLCJwcmlvcml0eSIsImdldF90eF9oZXgiLCJnZXRfdHhfbWV0YWRhdGEiLCJnZXRfdHhfa2V5cyIsImdldF90eF9rZXkiLCJudW1UeHMiLCJmZWVfbGlzdCIsImZlZSIsImNvcHlEZXN0aW5hdGlvbnMiLCJpIiwiTW9uZXJvVHhXYWxsZXQiLCJpbml0U2VudFR4V2FsbGV0IiwiZ2V0T3V0Z29pbmdUcmFuc2ZlciIsInNldFN1YmFkZHJlc3NJbmRpY2VzIiwiY29udmVydFJwY1NlbnRUeHNUb1R4U2V0IiwiY29udmVydFJwY1R4VG9UeFNldCIsInN3ZWVwT3V0cHV0Iiwibm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWciLCJnZXRLZXlJbWFnZSIsInNldEFtb3VudCIsInN3ZWVwVW5sb2NrZWQiLCJub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnIiwiaW5kaWNlcyIsImtleXMiLCJzZXRTd2VlcEVhY2hTdWJhZGRyZXNzIiwiZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcyIsInJwY1N3ZWVwQWNjb3VudCIsInN3ZWVwRHVzdCIsInJlbGF5IiwidHhTZXQiLCJzZXRJc1JlbGF5ZWQiLCJzZXRJblR4UG9vbCIsImdldElzUmVsYXllZCIsInJlbGF5VHhzIiwidHhzT3JNZXRhZGF0YXMiLCJBcnJheSIsImlzQXJyYXkiLCJ0eE9yTWV0YWRhdGEiLCJtZXRhZGF0YSIsImdldE1ldGFkYXRhIiwiaGV4IiwidHhfaGFzaCIsImRlc2NyaWJlVHhTZXQiLCJ1bnNpZ25lZF90eHNldCIsImdldFVuc2lnbmVkVHhIZXgiLCJtdWx0aXNpZ190eHNldCIsImdldE11bHRpc2lnVHhIZXgiLCJjb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlciIsInNpZ25UeHMiLCJ1bnNpZ25lZFR4SGV4IiwiZXhwb3J0X3JhdyIsInN1Ym1pdFR4cyIsInNpZ25lZFR4SGV4IiwidHhfZGF0YV9oZXgiLCJ0eF9oYXNoX2xpc3QiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIlNJR05fV0lUSF9TUEVORF9LRVkiLCJkYXRhIiwic2lnbmF0dXJlX3R5cGUiLCJ2ZXJpZnlNZXNzYWdlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCIsImdvb2QiLCJpc0dvb2QiLCJpc09sZCIsIm9sZCIsIlNJR05fV0lUSF9WSUVXX0tFWSIsImdldFR4S2V5IiwidHhIYXNoIiwidHhpZCIsInR4X2tleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImNoZWNrIiwiTW9uZXJvQ2hlY2tUeCIsInNldElzR29vZCIsInNldE51bUNvbmZpcm1hdGlvbnMiLCJjb25maXJtYXRpb25zIiwiaW5fcG9vbCIsInNldFJlY2VpdmVkQW1vdW50IiwicmVjZWl2ZWQiLCJnZXRUeFByb29mIiwiY2hlY2tUeFByb29mIiwiZ2V0U3BlbmRQcm9vZiIsImNoZWNrU3BlbmRQcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJNb25lcm9DaGVja1Jlc2VydmUiLCJzZXRVbmNvbmZpcm1lZFNwZW50QW1vdW50Iiwic2V0VG90YWxBbW91bnQiLCJ0b3RhbCIsImdldFR4Tm90ZXMiLCJub3RlcyIsInNldFR4Tm90ZXMiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJlbnRyaWVzIiwicnBjRW50cnkiLCJNb25lcm9BZGRyZXNzQm9va0VudHJ5Iiwic2V0RGVzY3JpcHRpb24iLCJkZXNjcmlwdGlvbiIsImFkZEFkZHJlc3NCb29rRW50cnkiLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsInNldF9hZGRyZXNzIiwic2V0X2Rlc2NyaXB0aW9uIiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsInRhZ3MiLCJhY2NvdW50X3RhZ3MiLCJycGNBY2NvdW50VGFnIiwiTW9uZXJvQWNjb3VudFRhZyIsInNldEFjY291bnRUYWdMYWJlbCIsImdldFBheW1lbnRVcmkiLCJyZWNpcGllbnRfbmFtZSIsImdldFJlY2lwaWVudE5hbWUiLCJ0eF9kZXNjcmlwdGlvbiIsImdldE5vdGUiLCJ1cmkiLCJwYXJzZVBheW1lbnRVcmkiLCJNb25lcm9UeENvbmZpZyIsInNldFJlY2lwaWVudE5hbWUiLCJzZXROb3RlIiwiZ2V0QXR0cmlidXRlIiwidmFsdWUiLCJzZXRBdHRyaWJ1dGUiLCJ2YWwiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsInRocmVhZHNfY291bnQiLCJkb19iYWNrZ3JvdW5kX21pbmluZyIsImlnbm9yZV9iYXR0ZXJ5Iiwic3RvcE1pbmluZyIsImlzTXVsdGlzaWdJbXBvcnROZWVkZWQiLCJtdWx0aXNpZ19pbXBvcnRfbmVlZGVkIiwiZ2V0TXVsdGlzaWdJbmZvIiwiaW5mbyIsIk1vbmVyb011bHRpc2lnSW5mbyIsInNldElzTXVsdGlzaWciLCJtdWx0aXNpZyIsInNldElzUmVhZHkiLCJyZWFkeSIsInNldFRocmVzaG9sZCIsInRocmVzaG9sZCIsInNldE51bVBhcnRpY2lwYW50cyIsInByZXBhcmVNdWx0aXNpZyIsIm11bHRpc2lnX2luZm8iLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJtc1Jlc3VsdCIsIk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsInNldE11bHRpc2lnSGV4IiwiZ2V0TXVsdGlzaWdIZXgiLCJleHBvcnRNdWx0aXNpZ0hleCIsImltcG9ydE11bHRpc2lnSGV4Iiwibl9vdXRwdXRzIiwic2lnbk11bHRpc2lnVHhIZXgiLCJtdWx0aXNpZ1R4SGV4Iiwic2lnblJlc3VsdCIsIk1vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsInNldFNpZ25lZE11bHRpc2lnVHhIZXgiLCJzZXRUeEhhc2hlcyIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4IiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwib2xkX3Bhc3N3b3JkIiwibmV3X3Bhc3N3b3JkIiwic2F2ZSIsImNsb3NlIiwiaXNDbG9zZWQiLCJzdG9wIiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJnZXRPdXRnb2luZ1RyYW5zZmVycyIsImNyZWF0ZVR4IiwicmVsYXlUeCIsImdldFR4Tm90ZSIsInNldFR4Tm90ZSIsIm5vdGUiLCJjb25uZWN0VG9XYWxsZXRScGMiLCJ1cmlPckNvbmZpZyIsIm5vcm1hbGl6ZUNvbmZpZyIsImNtZCIsInN0YXJ0V2FsbGV0UnBjUHJvY2VzcyIsImNoaWxkX3Byb2Nlc3MiLCJQcm9taXNlIiwicmVzb2x2ZSIsInRoZW4iLCJzcGF3biIsInN0ZG91dCIsInNldEVuY29kaW5nIiwic3RkZXJyIiwidGhhdCIsInJlamVjdCIsIm9uIiwibGluZSIsIkxpYnJhcnlVdGlscyIsImxvZyIsInVyaUxpbmVDb250YWlucyIsInVyaUxpbmVDb250YWluc0lkeCIsImhvc3QiLCJzdWJzdHJpbmciLCJsYXN0SW5kZXhPZiIsInVuZm9ybWF0dGVkTGluZSIsInJlcGxhY2UiLCJ0cmltIiwicG9ydCIsInNzbElkeCIsInNzbEVuYWJsZWQiLCJ0b0xvd2VyQ2FzZSIsInVzZXJQYXNzSWR4IiwidXNlclBhc3MiLCJzZXRTZXJ2ZXIiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJnZXRSZWplY3RVbmF1dGhvcml6ZWQiLCJ3YWxsZXQiLCJpc1Jlc29sdmVkIiwiZ2V0TG9nTGV2ZWwiLCJjb2RlIiwib3JpZ2luIiwiZ2V0QWNjb3VudEluZGljZXMiLCJ0eFF1ZXJ5IiwiY2FuQmVDb25maXJtZWQiLCJnZXRJblR4UG9vbCIsImdldElzRmFpbGVkIiwiY2FuQmVJblR4UG9vbCIsImdldE1heEhlaWdodCIsImdldElzTG9ja2VkIiwiY2FuQmVJbmNvbWluZyIsImdldElzSW5jb21pbmciLCJnZXRJc091dGdvaW5nIiwiZ2V0SGFzRGVzdGluYXRpb25zIiwiY2FuQmVPdXRnb2luZyIsImluIiwib3V0IiwicG9vbCIsInBlbmRpbmciLCJmYWlsZWQiLCJnZXRNaW5IZWlnaHQiLCJtaW5faGVpZ2h0IiwibWF4X2hlaWdodCIsImZpbHRlcl9ieV9oZWlnaHQiLCJnZXRTdWJhZGRyZXNzSW5kZXgiLCJzaXplIiwiZnJvbSIsInJwY1R4IiwiY29udmVydFJwY1R4V2l0aFRyYW5zZmVyIiwiZ2V0T3V0Z29pbmdBbW91bnQiLCJvdXRnb2luZ1RyYW5zZmVyIiwidHJhbnNmZXJUb3RhbCIsInZhbHVlcyIsInNvcnQiLCJjb21wYXJlVHhzQnlIZWlnaHQiLCJzZXRJc0luY29taW5nIiwic2V0SXNPdXRnb2luZyIsImNvbXBhcmVJbmNvbWluZ1RyYW5zZmVycyIsInRyYW5zZmVyX3R5cGUiLCJnZXRJc1NwZW50IiwidmVyYm9zZSIsInJwY091dHB1dCIsImNvbnZlcnRScGNUeFdhbGxldFdpdGhPdXRwdXQiLCJjb21wYXJlT3V0cHV0cyIsInJwY0ltYWdlIiwiTW9uZXJvS2V5SW1hZ2UiLCJiZWxvd19hbW91bnQiLCJnZXRCZWxvd0Ftb3VudCIsInNldElzTG9ja2VkIiwic2V0SXNDb25maXJtZWQiLCJzZXRSZWxheSIsInNldElzTWluZXJUeCIsInNldElzRmFpbGVkIiwiTW9uZXJvRGVzdGluYXRpb24iLCJzZXREZXN0aW5hdGlvbnMiLCJzZXRPdXRnb2luZ1RyYW5zZmVyIiwic2V0VW5sb2NrVGltZSIsImdldExhc3RSZWxheWVkVGltZXN0YW1wIiwic2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJEYXRlIiwiZ2V0VGltZSIsImdldElzRG91YmxlU3BlbmRTZWVuIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJXYWxsZXRQb2xsZXIiLCJzZXRJc1BvbGxpbmciLCJpc1BvbGxpbmciLCJzZXJ2ZXIiLCJwcm94eVRvV29ya2VyIiwic2V0UHJpbWFyeUFkZHJlc3MiLCJzZXRUYWciLCJnZXRUYWciLCJzZXRSaW5nU2l6ZSIsIk1vbmVyb1V0aWxzIiwiUklOR19TSVpFIiwiTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciIsInNldFR4IiwiZGVzdENvcGllcyIsImRlc3QiLCJjb252ZXJ0UnBjVHhTZXQiLCJycGNNYXAiLCJNb25lcm9UeFNldCIsInNldE11bHRpc2lnVHhIZXgiLCJzZXRVbnNpZ25lZFR4SGV4Iiwic2V0U2lnbmVkVHhIZXgiLCJzaWduZWRfdHhzZXQiLCJnZXRTaWduZWRUeEhleCIsInJwY1R4cyIsInNldFR4cyIsInNldFR4U2V0Iiwic2V0SGFzaCIsInNldEtleSIsInNldEZ1bGxIZXgiLCJzZXRNZXRhZGF0YSIsInNldEZlZSIsInNldFdlaWdodCIsImlucHV0S2V5SW1hZ2VzTGlzdCIsImFzc2VydFRydWUiLCJnZXRJbnB1dHMiLCJzZXRJbnB1dHMiLCJpbnB1dEtleUltYWdlIiwiTW9uZXJvT3V0cHV0V2FsbGV0Iiwic2V0S2V5SW1hZ2UiLCJzZXRIZXgiLCJhbW91bnRzQnlEZXN0TGlzdCIsImRlc3RpbmF0aW9uSWR4IiwidHhJZHgiLCJhbW91bnRzQnlEZXN0IiwiaXNPdXRnb2luZyIsInR5cGUiLCJkZWNvZGVScGNUeXBlIiwiaGVhZGVyIiwic2V0U2l6ZSIsIk1vbmVyb0Jsb2NrSGVhZGVyIiwic2V0VGltZXN0YW1wIiwiTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsInNldE51bVN1Z2dlc3RlZENvbmZpcm1hdGlvbnMiLCJERUZBVUxUX1BBWU1FTlRfSUQiLCJycGNJbmRpY2VzIiwicnBjSW5kZXgiLCJzZXRTdWJhZGRyZXNzSW5kZXgiLCJycGNEZXN0aW5hdGlvbiIsImRlc3RpbmF0aW9uS2V5Iiwic2V0SW5wdXRTdW0iLCJzZXRPdXRwdXRTdW0iLCJzZXRDaGFuZ2VBZGRyZXNzIiwic2V0Q2hhbmdlQW1vdW50Iiwic2V0TnVtRHVtbXlPdXRwdXRzIiwic2V0RXh0cmFIZXgiLCJpbnB1dEtleUltYWdlcyIsImtleV9pbWFnZXMiLCJhbW91bnRzIiwic2V0QmxvY2siLCJNb25lcm9CbG9jayIsIm1lcmdlIiwic2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJzZXRJc1NwZW50Iiwic2V0SXNGcm96ZW4iLCJzZXRTdGVhbHRoUHVibGljS2V5Iiwic2V0T3V0cHV0cyIsInJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQiLCJycGNUeXBlIiwiYVR4IiwiYUJsb2NrIiwidHgxIiwidHgyIiwiZGlmZiIsInQxIiwidDIiLCJvMSIsIm8yIiwiaGVpZ2h0Q29tcGFyaXNvbiIsImNvbXBhcmUiLCJsb2NhbGVDb21wYXJlIiwiZXhwb3J0cyIsImxvb3BlciIsIlRhc2tMb29wZXIiLCJwcmV2TG9ja2VkVHhzIiwicHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucyIsInByZXZDb25maXJtZWROb3RpZmljYXRpb25zIiwidGhyZWFkUG9vbCIsIlRocmVhZFBvb2wiLCJudW1Qb2xsaW5nIiwic3RhcnQiLCJwZXJpb2RJbk1zIiwic3VibWl0IiwicHJldkhlaWdodCIsIk1vbmVyb1R4UXVlcnkiLCJwcmV2QmFsYW5jZXMiLCJvbk5ld0Jsb2NrIiwibWluSGVpZ2h0IiwibWF4IiwibG9ja2VkVHhzIiwic2V0TWluSGVpZ2h0Iiwic2V0SW5jbHVkZU91dHB1dHMiLCJub0xvbmdlckxvY2tlZEhhc2hlcyIsInByZXZMb2NrZWRUeCIsInVubG9ja2VkVHhzIiwic2V0SGFzaGVzIiwibG9ja2VkVHgiLCJzZWFyY2hTZXQiLCJ1bmFubm91bmNlZCIsIm5vdGlmeU91dHB1dHMiLCJ1bmxvY2tlZFR4IiwiZGVsZXRlIiwiY2hlY2tGb3JDaGFuZ2VkQmFsYW5jZXMiLCJnZXRGZWUiLCJvbk91dHB1dFNwZW50Iiwib25PdXRwdXRSZWNlaXZlZCIsImJhbGFuY2VzIiwib25CYWxhbmNlc0NoYW5nZWQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0UnBjLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuLi9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBUYXNrTG9vcGVyIGZyb20gXCIuLi9jb21tb24vVGFza0xvb3BlclwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnRUYWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFRhZ1wiO1xuaW1wb3J0IE1vbmVyb0FkZHJlc3NCb29rRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9CbG9ja0hlYWRlciBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrSGVhZGVyXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tSZXNlcnZlIGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrUmVzZXJ2ZVwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrVHggZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tUeFwiO1xuaW1wb3J0IE1vbmVyb0Rlc3RpbmF0aW9uIGZyb20gXCIuL21vZGVsL01vbmVyb0Rlc3RpbmF0aW9uXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0luY29taW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW5jb21pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5mb1wiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luaXRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0UXVlcnlcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9ScGNFcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvU3ViYWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJhZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvU3luY1Jlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TeW5jUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlclF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyUXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1R4V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0IGZyb20gXCIuL01vbmVyb1dhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRDb25maWdcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0XCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi4vY29tbW9uL1RocmVhZFBvb2xcIjtcbmltcG9ydCBTc2xPcHRpb25zIGZyb20gXCIuLi9jb21tb24vU3NsT3B0aW9uc1wiO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIHdvb2RzZXJcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb1dhbGxldCBhcyBhIGNsaWVudCBvZiBtb25lcm8td2FsbGV0LXJwYy5cbiAqIFxuICogQGltcGxlbWVudHMge01vbmVyb1dhbGxldH1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvV2FsbGV0UnBjIGV4dGVuZHMgTW9uZXJvV2FsbGV0IHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA9IDIwMDAwOyAvLyBkZWZhdWx0IHBlcmlvZCBiZXR3ZWVuIHN5bmNzIGluIG1zIChkZWZpbmVkIGJ5IERFRkFVTFRfQVVUT19SRUZSRVNIX1BFUklPRCBpbiB3YWxsZXRfcnBjX3NlcnZlci5jcHApXG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPjtcbiAgcHJvdGVjdGVkIGFkZHJlc3NDYWNoZTogYW55O1xuICBwcm90ZWN0ZWQgc3luY1BlcmlvZEluTXM6IG51bWJlcjtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXTtcbiAgcHJvdGVjdGVkIHByb2Nlc3M6IGFueTtcbiAgcHJvdGVjdGVkIHBhdGg6IHN0cmluZztcbiAgcHJvdGVjdGVkIGRhZW1vbkNvbm5lY3Rpb246IE1vbmVyb1JwY0Nvbm5lY3Rpb247XG4gIHByb3RlY3RlZCB3YWxsZXRQb2xsZXI6IFdhbGxldFBvbGxlcjtcbiAgXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTsgLy8gYXZvaWQgdW5lY2Vzc2FyeSByZXF1ZXN0cyBmb3IgYWRkcmVzc2VzXG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IE1vbmVyb1dhbGxldFJwYy5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBSUEMgV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtDaGlsZFByb2Nlc3N9IHRoZSBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMsIHVuZGVmaW5lZCBpZiBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXG4gICAqL1xuICBnZXRQcm9jZXNzKCk6IENoaWxkUHJvY2VzcyB7XG4gICAgcmV0dXJuIHRoaXMucHJvY2VzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3AgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm8td2FsbGV0LXJwYywgaWYgYXBwbGljYWJsZS5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2Ugc3BlY2lmaWVzIGlmIHRoZSBwcm9jZXNzIHNob3VsZCBiZSBkZXN0cm95ZWQgZm9yY2libHkgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPn0gdGhlIGV4aXQgY29kZSBmcm9tIHN0b3BwaW5nIHRoZSBwcm9jZXNzXG4gICAqL1xuICBhc3luYyBzdG9wUHJvY2Vzcyhmb3JjZSA9IGZhbHNlKTogUHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+ICB7XG4gICAgaWYgKHRoaXMucHJvY2VzcyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMgaW5zdGFuY2Ugbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1wiKTtcbiAgICBsZXQgbGlzdGVuZXJzQ29weSA9IEdlblV0aWxzLmNvcHlBcnJheSh0aGlzLmdldExpc3RlbmVycygpKTtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnNDb3B5KSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gR2VuVXRpbHMua2lsbFByb2Nlc3ModGhpcy5wcm9jZXNzLCBmb3JjZSA/IFwiU0lHS0lMTFwiIDogdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgUlBDIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9uIHwgdW5kZWZpbmVkfSB0aGUgd2FsbGV0J3MgcnBjIGNvbm5lY3Rpb25cbiAgICovXG4gIGdldFJwY0Nvbm5lY3Rpb24oKTogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+T3BlbiBhbiBleGlzdGluZyB3YWxsZXQgb24gdGhlIG1vbmVyby13YWxsZXQtcnBjIHNlcnZlci48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlOjxwPlxuICAgKiBcbiAgICogPGNvZGU+XG4gICAqIGxldCB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0UnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4NFwiLCBcInJwY191c2VyXCIsIFwiYWJjMTIzXCIpOzxicj5cbiAgICogYXdhaXQgd2FsbGV0Lm9wZW5XYWxsZXQoXCJteXdhbGxldDFcIiwgXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIpOzxicj5cbiAgICogPGJyPlxuICAgKiBhd2FpdCB3YWxsZXQub3BlbldhbGxldCh7PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGF0aDogXCJteXdhbGxldDJcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VydmVyOiBcImh0dHA6Ly9sb2NhaG9zdDozODA4MVwiLCAvLyBvciBvYmplY3Qgd2l0aCB1cmksIHVzZXJuYW1lLCBwYXNzd29yZCwgZXRjIDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2U8YnI+XG4gICAqIH0pOzxicj5cbiAgICogPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvV2FsbGV0Q29uZmlnfSBwYXRoT3JDb25maWcgIC0gdGhlIHdhbGxldCdzIG5hbWUgb3IgY29uZmlndXJhdGlvbiB0byBvcGVuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoT3JDb25maWcucGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCBpbi1tZW1vcnkgd2FsbGV0IGlmIG5vdCBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhPckNvbmZpZy5wYXNzd29yZCAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IHBhdGhPckNvbmZpZy5zZXJ2ZXIgLSB1cmkgb3IgTW9uZXJvUnBjQ29ubmVjdGlvbiBvZiBhIGRhZW1vbiB0byB1c2UgKG9wdGlvbmFsLCBtb25lcm8td2FsbGV0LXJwYyB1c3VhbGx5IHN0YXJ0ZWQgd2l0aCBkYWVtb24gY29uZmlnKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3Bhc3N3b3JkXSB0aGUgd2FsbGV0J3MgcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9XYWxsZXRScGM+fSB0aGlzIHdhbGxldCBjbGllbnRcbiAgICovXG4gIGFzeW5jIG9wZW5XYWxsZXQocGF0aE9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4sIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHR5cGVvZiBwYXRoT3JDb25maWcgPT09IFwic3RyaW5nXCIgPyB7cGF0aDogcGF0aE9yQ29uZmlnLCBwYXNzd29yZDogcGFzc3dvcmQgPyBwYXNzd29yZCA6IFwiXCJ9IDogcGF0aE9yQ29uZmlnKTtcbiAgICAvLyBUT0RPOiBlbnN1cmUgb3RoZXIgZmllbGRzIHVuaW5pdGlhbGl6ZWQ/XG4gICAgXG4gICAgLy8gb3BlbiB3YWxsZXQgb24gcnBjIHNlcnZlclxuICAgIGlmICghY29uZmlnLmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIG5hbWUgb2Ygd2FsbGV0IHRvIG9wZW5cIik7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwib3Blbl93YWxsZXRcIiwge2ZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLCBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCl9KTtcbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICBcbiAgICAvLyBzZXQgZGFlbW9uIGlmIHByb3ZpZGVkXG4gICAgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSkgYXdhaXQgdGhpcy5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZy5nZXRTZXJ2ZXIoKSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5DcmVhdGUgYW5kIG9wZW4gYSB3YWxsZXQgb24gdGhlIG1vbmVyby13YWxsZXQtcnBjIHNlcnZlci48cD5cbiAgICogXG4gICAqIDxwPkV4YW1wbGU6PHA+XG4gICAqIFxuICAgKiA8Y29kZT5cbiAgICogJnNvbDsmc29sOyBjb25zdHJ1Y3QgY2xpZW50IHRvIG1vbmVyby13YWxsZXQtcnBjPGJyPlxuICAgKiBsZXQgd2FsbGV0UnBjID0gbmV3IE1vbmVyb1dhbGxldFJwYyhcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODRcIiwgXCJycGNfdXNlclwiLCBcImFiYzEyM1wiKTs8YnI+PGJyPlxuICAgKiBcbiAgICogJnNvbDsmc29sOyBjcmVhdGUgYW5kIG9wZW4gd2FsbGV0IG9uIG1vbmVyby13YWxsZXQtcnBjPGJyPlxuICAgKiBhd2FpdCB3YWxsZXRScGMuY3JlYXRlV2FsbGV0KHs8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXRoOiBcIm15d2FsbGV0XCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiYWJjMTIzXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VlZDogXCJjb2V4aXN0IGlnbG9vIHBhbXBobGV0IGxhZ29vbi4uLlwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlc3RvcmVIZWlnaHQ6IDE1NDMyMThsPGJyPlxuICAgKiB9KTtcbiAgICogIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+fSBjb25maWcgLSBNb25lcm9XYWxsZXRDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF0aF0gLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhc3N3b3JkXSAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRdIC0gc2VlZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIHJhbmRvbSB3YWxsZXQgY3JlYXRlZCBpZiBuZWl0aGVyIHNlZWQgbm9yIGtleXMgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRPZmZzZXRdIC0gdGhlIG9mZnNldCB1c2VkIHRvIGRlcml2ZSBhIG5ldyBzZWVkIGZyb20gdGhlIGdpdmVuIHNlZWQgdG8gcmVjb3ZlciBhIHNlY3JldCB3YWxsZXQgZnJvbSB0aGUgc2VlZFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuaXNNdWx0aXNpZ10gLSByZXN0b3JlIG11bHRpc2lnIHdhbGxldCBmcm9tIHNlZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpbWFyeUFkZHJlc3NdIC0gcHJpbWFyeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmx5IHByb3ZpZGUgaWYgcmVzdG9yaW5nIGZyb20ga2V5cylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVZpZXdLZXldIC0gcHJpdmF0ZSB2aWV3IGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVTcGVuZEtleV0gLSBwcml2YXRlIHNwZW5kIGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnJlc3RvcmVIZWlnaHRdIC0gYmxvY2sgaGVpZ2h0IHRvIHN0YXJ0IHNjYW5uaW5nIGZyb20gKGRlZmF1bHRzIHRvIDAgdW5sZXNzIGdlbmVyYXRpbmcgcmFuZG9tIHdhbGxldClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcubGFuZ3VhZ2VdIC0gbGFuZ3VhZ2Ugb2YgdGhlIHdhbGxldCdzIG1uZW1vbmljIHBocmFzZSBvciBzZWVkIChkZWZhdWx0cyB0byBcIkVuZ2xpc2hcIiBvciBhdXRvLWRldGVjdGVkKVxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb259IFtjb25maWcuc2VydmVyXSAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gdG8gYSBtb25lcm8gZGFlbW9uIChvcHRpb25hbCk8YnI+XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclVyaV0gLSB1cmkgb2YgYSBkYWVtb24gdG8gdXNlIChvcHRpb25hbCwgbW9uZXJvLXdhbGxldC1ycGMgdXN1YWxseSBzdGFydGVkIHdpdGggZGFlbW9uIGNvbmZpZylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyVXNlcm5hbWVdIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIGRhZW1vbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclBhc3N3b3JkXSAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBkYWVtb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSBbY29uZmlnLmNvbm5lY3Rpb25NYW5hZ2VyXSAtIG1hbmFnZSBjb25uZWN0aW9ucyB0byBtb25lcm9kIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlamVjdFVuYXV0aG9yaXplZF0gLSByZWplY3Qgc2VsZi1zaWduZWQgc2VydmVyIGNlcnRpZmljYXRlcyBpZiB0cnVlIChkZWZhdWx0cyB0byB0cnVlKVxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb259IFtjb25maWcuc2VydmVyXSAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb3IgZXF1aXZhbGVudCBKUyBvYmplY3QgcHJvdmlkaW5nIGRhZW1vbiBjb25maWd1cmF0aW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnNhdmVDdXJyZW50XSAtIHNwZWNpZmllcyBpZiB0aGUgY3VycmVudCBSUEMgd2FsbGV0IHNob3VsZCBiZSBzYXZlZCBiZWZvcmUgYmVpbmcgY2xvc2VkIChkZWZhdWx0IHRydWUpXG4gICAqIEByZXR1cm4ge01vbmVyb1dhbGxldFJwY30gdGhpcyB3YWxsZXQgY2xpZW50XG4gICAqL1xuICBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgY29uZmlnIHRvIGNyZWF0ZSB3YWxsZXRcIik7XG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCAmJiAoY29uZmlnTm9ybWFsaXplZC5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBpbml0aWFsaXplZCB3aXRoIGEgc2VlZCBvciBrZXlzIGJ1dCBub3QgYm90aFwiKTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0TmV0d29ya1R5cGUoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBuZXR3b3JrVHlwZSB3aGVuIGNyZWF0aW5nIFJQQyB3YWxsZXQgYmVjYXVzZSBzZXJ2ZXIncyBuZXR3b3JrIHR5cGUgaXMgYWxyZWFkeSBzZXRcIik7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudExvb2thaGVhZCgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzTG9va2FoZWFkKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3Qgc3VwcG9ydCBjcmVhdGluZyB3YWxsZXRzIHdpdGggc3ViYWRkcmVzcyBsb29rYWhlYWQgb3ZlciBycGNcIik7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UGFzc3dvcmQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWdOb3JtYWxpemVkLnNldFBhc3N3b3JkKFwiXCIpO1xuXG4gICAgLy8gY3JlYXRlIHdhbGxldFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZ05vcm1hbGl6ZWQpO1xuICAgIGVsc2UgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWdOb3JtYWxpemVkKTtcbiAgICBlbHNlIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZ05vcm1hbGl6ZWQpO1xuXG4gICAgLy8gc2V0IGRhZW1vbiBvciBjb25uZWN0aW9uIG1hbmFnZXJcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBpbml0aWFsaXplZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBhd2FpdCB0aGlzLnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSk7XG4gICAgfSBlbHNlIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlcnZlcigpKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldERhZW1vbkNvbm5lY3Rpb24oY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgcmVzdG9yZUhlaWdodCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSBmYWxzZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ3VycmVudCB3YWxsZXQgaXMgc2F2ZWQgYXV0b21hdGljYWxseSB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0UGF0aCgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOYW1lIGlzIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICBpZiAoIWNvbmZpZy5nZXRMYW5ndWFnZSgpKSBjb25maWcuc2V0TGFuZ3VhZ2UoTW9uZXJvV2FsbGV0LkRFRkFVTFRfTEFOR1VBR0UpO1xuICAgIGxldCBwYXJhbXMgPSB7IGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLCBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksIGxhbmd1YWdlOiBjb25maWcuZ2V0TGFuZ3VhZ2UoKSB9O1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfd2FsbGV0XCIsIHBhcmFtcyk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXN0b3JlX2RldGVybWluaXN0aWNfd2FsbGV0XCIsIHtcbiAgICAgICAgZmlsZW5hbWU6IGNvbmZpZy5nZXRQYXRoKCksXG4gICAgICAgIHBhc3N3b3JkOiBjb25maWcuZ2V0UGFzc3dvcmQoKSxcbiAgICAgICAgc2VlZDogY29uZmlnLmdldFNlZWQoKSxcbiAgICAgICAgc2VlZF9vZmZzZXQ6IGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCksXG4gICAgICAgIGVuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWw6IGNvbmZpZy5nZXRJc011bHRpc2lnKCksXG4gICAgICAgIHJlc3RvcmVfaGVpZ2h0OiBjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpLFxuICAgICAgICBsYW5ndWFnZTogY29uZmlnLmdldExhbmd1YWdlKCksXG4gICAgICAgIGF1dG9zYXZlX2N1cnJlbnQ6IGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhpcy5oYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihjb25maWcuZ2V0UGF0aCgpLCBlcnIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHdhbGxldCBmcm9tIGtleXNcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFJlc3RvcmVIZWlnaHQoMCk7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShNb25lcm9XYWxsZXQuREVGQVVMVF9MQU5HVUFHRSk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdlbmVyYXRlX2Zyb21fa2V5c1wiLCB7XG4gICAgICAgIGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLFxuICAgICAgICBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksXG4gICAgICAgIGFkZHJlc3M6IGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpLFxuICAgICAgICB2aWV3a2V5OiBjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSxcbiAgICAgICAgc3BlbmRrZXk6IGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSxcbiAgICAgICAgcmVzdG9yZV9oZWlnaHQ6IGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCksXG4gICAgICAgIGF1dG9zYXZlX2N1cnJlbnQ6IGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhpcy5oYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihjb25maWcuZ2V0UGF0aCgpLCBlcnIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKG5hbWUsIGVycikge1xuICAgIGlmIChlcnIubWVzc2FnZSA9PT0gXCJDYW5ub3QgY3JlYXRlIHdhbGxldC4gQWxyZWFkeSBleGlzdHMuXCIpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBuYW1lLCBlcnIuZ2V0Q29kZSgpLCBlcnIuZ2V0UnBjTWV0aG9kKCksIGVyci5nZXRScGNQYXJhbXMoKSk7XG4gICAgaWYgKGVyci5tZXNzYWdlID09PSBcIkVsZWN0cnVtLXN0eWxlIHdvcmQgbGlzdCBmYWlsZWQgdmVyaWZpY2F0aW9uXCIpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihcIkludmFsaWQgbW5lbW9uaWNcIiwgZXJyLmdldENvZGUoKSwgZXJyLmdldFJwY01ldGhvZCgpLCBlcnIuZ2V0UnBjUGFyYW1zKCkpO1xuICAgIHRocm93IGVycjtcbiAgfVxuICBcbiAgYXN5bmMgaXNWaWV3T25seSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHtrZXlfdHlwZTogXCJtbmVtb25pY1wifSk7XG4gICAgICByZXR1cm4gZmFsc2U7IC8vIGtleSByZXRyaWV2YWwgc3VjY2VlZHMgaWYgbm90IHZpZXcgb25seVxuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMjkpIHJldHVybiB0cnVlOyAgLy8gd2FsbGV0IGlzIHZpZXcgb25seVxuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMSkgcmV0dXJuIGZhbHNlOyAgLy8gd2FsbGV0IGlzIG9mZmxpbmUgYnV0IG5vdCB2aWV3IG9ubHlcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfE1vbmVyb1JwY0Nvbm5lY3Rpb259IFt1cmlPckNvbm5lY3Rpb25dIC0gdGhlIGRhZW1vbidzIFVSSSBvciBjb25uZWN0aW9uIChkZWZhdWx0cyB0byBvZmZsaW5lKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzVHJ1c3RlZCAtIGluZGljYXRlcyBpZiB0aGUgZGFlbW9uIGluIHRydXN0ZWRcbiAgICogQHBhcmFtIHtTc2xPcHRpb25zfSBzc2xPcHRpb25zIC0gY3VzdG9tIFNTTCBjb25maWd1cmF0aW9uXG4gICAqL1xuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbj86IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCBzdHJpbmcsIGlzVHJ1c3RlZD86IGJvb2xlYW4sIHNzbE9wdGlvbnM/OiBTc2xPcHRpb25zKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IGNvbm5lY3Rpb24gPSAhdXJpT3JDb25uZWN0aW9uID8gdW5kZWZpbmVkIDogdXJpT3JDb25uZWN0aW9uIGluc3RhbmNlb2YgTW9uZXJvUnBjQ29ubmVjdGlvbiA/IHVyaU9yQ29ubmVjdGlvbiA6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbik7XG4gICAgaWYgKCFzc2xPcHRpb25zKSBzc2xPcHRpb25zID0gbmV3IFNzbE9wdGlvbnMoKTtcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFVyaSgpIDogXCJiYWRfdXJpXCI7IC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IGJhZCBkYWVtb24gdXJpIG5lY2Vzc2FyeSBmb3Igb2ZmbGluZT9cbiAgICBwYXJhbXMudXNlcm5hbWUgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRVc2VybmFtZSgpIDogXCJcIjtcbiAgICBwYXJhbXMucGFzc3dvcmQgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRQYXNzd29yZCgpIDogXCJcIjtcbiAgICBwYXJhbXMudHJ1c3RlZCA9IGlzVHJ1c3RlZDtcbiAgICBwYXJhbXMuc3NsX3N1cHBvcnQgPSBcImF1dG9kZXRlY3RcIjtcbiAgICBwYXJhbXMuc3NsX3ByaXZhdGVfa2V5X3BhdGggPSBzc2xPcHRpb25zLmdldFByaXZhdGVLZXlQYXRoKCk7XG4gICAgcGFyYW1zLnNzbF9jZXJ0aWZpY2F0ZV9wYXRoICA9IHNzbE9wdGlvbnMuZ2V0Q2VydGlmaWNhdGVQYXRoKCk7XG4gICAgcGFyYW1zLnNzbF9jYV9maWxlID0gc3NsT3B0aW9ucy5nZXRDZXJ0aWZpY2F0ZUF1dGhvcml0eUZpbGUoKTtcbiAgICBwYXJhbXMuc3NsX2FsbG93ZWRfZmluZ2VycHJpbnRzID0gc3NsT3B0aW9ucy5nZXRBbGxvd2VkRmluZ2VycHJpbnRzKCk7XG4gICAgcGFyYW1zLnNzbF9hbGxvd19hbnlfY2VydCA9IHNzbE9wdGlvbnMuZ2V0QWxsb3dBbnlDZXJ0KCk7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2RhZW1vblwiLCBwYXJhbXMpO1xuICAgIHRoaXMuZGFlbW9uQ29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkNvbm5lY3Rpb24oKTogUHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPiB7XG4gICAgcmV0dXJuIHRoaXMuZGFlbW9uQ29ubmVjdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGxvY2tlZCBhbmQgdW5sb2NrZWQgYmFsYW5jZXMgaW4gYSBzaW5nbGUgcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbYWNjb3VudElkeF0gYWNjb3VudCBpbmRleFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N1YmFkZHJlc3NJZHhdIHN1YmFkZHJlc3MgaW5kZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxiaWdpbnRbXT59IGlzIHRoZSBsb2NrZWQgYW5kIHVubG9ja2VkIGJhbGFuY2VzIGluIGFuIGFycmF5LCByZXNwZWN0aXZlbHlcbiAgICovXG4gIGFzeW5jIGdldEJhbGFuY2VzKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludFtdPiB7XG4gICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0LmVxdWFsKHN1YmFkZHJlc3NJZHgsIHVuZGVmaW5lZCwgXCJNdXN0IHByb3ZpZGUgYWNjb3VudCBpbmRleCB3aXRoIHN1YmFkZHJlc3MgaW5kZXhcIik7XG4gICAgICBsZXQgYmFsYW5jZSA9IEJpZ0ludCgwKTtcbiAgICAgIGxldCB1bmxvY2tlZEJhbGFuY2UgPSBCaWdJbnQoMCk7XG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgICBiYWxhbmNlID0gYmFsYW5jZSArIGFjY291bnQuZ2V0QmFsYW5jZSgpO1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2UgPSB1bmxvY2tlZEJhbGFuY2UgKyBhY2NvdW50LmdldFVubG9ja2VkQmFsYW5jZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFtiYWxhbmNlLCB1bmxvY2tlZEJhbGFuY2VdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcGFyYW1zID0ge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHgsIGFkZHJlc3NfaW5kaWNlczogc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogW3N1YmFkZHJlc3NJZHhdfTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwgcGFyYW1zKTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQpIHJldHVybiBbQmlnSW50KHJlc3AucmVzdWx0LmJhbGFuY2UpLCBCaWdJbnQocmVzcC5yZXN1bHQudW5sb2NrZWRfYmFsYW5jZSldO1xuICAgICAgZWxzZSByZXR1cm4gW0JpZ0ludChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzc1swXS5iYWxhbmNlKSwgQmlnSW50KHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzWzBdLnVubG9ja2VkX2JhbGFuY2UpXTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIENPTU1PTiBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvV2FsbGV0TGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhc3NlcnQobGlzdGVuZXIgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciwgXCJMaXN0ZW5lciBtdXN0IGJlIGluc3RhbmNlIG9mIE1vbmVyb1dhbGxldExpc3RlbmVyXCIpO1xuICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCBpZHggPSB0aGlzLmxpc3RlbmVycy5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICBpZiAoaWR4ID4gLTEpIHRoaXMubGlzdGVuZXJzLnNwbGljZShpZHgsIDEpO1xuICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB3YWxsZXRcIik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGdldExpc3RlbmVycygpOiBNb25lcm9XYWxsZXRMaXN0ZW5lcltdIHtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZXNlcnZlUHJvb2YoYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpLCBcIlwiLCBcIlwiKTsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBwcm92aWRlIGJldHRlciB3YXkgdG8ga25vdyBpZiB3YWxsZXQgcnBjIGlzIGNvbm5lY3RlZCB0byBkYWVtb25cbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcImNoZWNrIHJlc2VydmUgZXhwZWN0ZWQgdG8gZmFpbFwiKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIHJldHVybiBlLm1lc3NhZ2UuaW5kZXhPZihcIkZhaWxlZCB0byBjb25uZWN0IHRvIGRhZW1vblwiKSA8IDA7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3ZlcnNpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9WZXJzaW9uKHJlc3AucmVzdWx0LnZlcnNpb24sIHJlc3AucmVzdWx0LnJlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMucGF0aDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwibW5lbW9uaWNcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2UoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoYXdhaXQgdGhpcy5nZXRTZWVkKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMuZ2V0U2VlZExhbmd1YWdlKCkgbm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBsaXN0IG9mIGF2YWlsYWJsZSBsYW5ndWFnZXMgZm9yIHRoZSB3YWxsZXQncyBzZWVkLlxuICAgKiBcbiAgICogQHJldHVybiB7c3RyaW5nW119IHRoZSBhdmFpbGFibGUgbGFuZ3VhZ2VzIGZvciB0aGUgd2FsbGV0J3Mgc2VlZC5cbiAgICovXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZXMoKSB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfbGFuZ3VhZ2VzXCIpKS5yZXN1bHQubGFuZ3VhZ2VzO1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwidmlld19rZXlcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcInNwZW5kX2tleVwiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBzdWJhZGRyZXNzTWFwID0gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF07XG4gICAgaWYgKCFzdWJhZGRyZXNzTWFwKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHRydWUpOyAgLy8gY2FjaGUncyBhbGwgYWRkcmVzc2VzIGF0IHRoaXMgYWNjb3VudFxuICAgICAgcmV0dXJuIHRoaXMuZ2V0QWRkcmVzcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTsgICAgICAgIC8vIHJlY3Vyc2l2ZSBjYWxsIHVzZXMgY2FjaGVcbiAgICB9XG4gICAgbGV0IGFkZHJlc3MgPSBzdWJhZGRyZXNzTWFwW3N1YmFkZHJlc3NJZHhdO1xuICAgIGlmICghYWRkcmVzcykge1xuICAgICAgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCB0cnVlKTsgIC8vIGNhY2hlJ3MgYWxsIGFkZHJlc3NlcyBhdCB0aGlzIGFjY291bnRcbiAgICAgIHJldHVybiB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XVtzdWJhZGRyZXNzSWR4XTtcbiAgICB9XG4gICAgcmV0dXJuIGFkZHJlc3M7XG4gIH1cbiAgXG4gIC8vIFRPRE86IHVzZSBjYWNoZVxuICBhc3luYyBnZXRBZGRyZXNzSW5kZXgoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggcmVzdWx0IGFuZCBub3JtYWxpemUgZXJyb3IgaWYgYWRkcmVzcyBkb2VzIG5vdCBiZWxvbmcgdG8gdGhlIHdhbGxldFxuICAgIGxldCByZXNwO1xuICAgIHRyeSB7XG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NfaW5kZXhcIiwge2FkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTIpIHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29udmVydCBycGMgcmVzcG9uc2VcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKHthZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWFqb3IpO1xuICAgIHN1YmFkZHJlc3Muc2V0SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWlub3IpO1xuICAgIHJldHVybiBzdWJhZGRyZXNzO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3M/OiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IGludGVncmF0ZWRBZGRyZXNzU3RyID0gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfaW50ZWdyYXRlZF9hZGRyZXNzXCIsIHtzdGFuZGFyZF9hZGRyZXNzOiBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRfaWQ6IHBheW1lbnRJZH0pKS5yZXN1bHQuaW50ZWdyYXRlZF9hZGRyZXNzO1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3NTdHIpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUubWVzc2FnZS5pbmNsdWRlcyhcIkludmFsaWQgcGF5bWVudCBJRFwiKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBwYXltZW50IElEOiBcIiArIHBheW1lbnRJZCk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNwbGl0X2ludGVncmF0ZWRfYWRkcmVzc1wiLCB7aW50ZWdyYXRlZF9hZGRyZXNzOiBpbnRlZ3JhdGVkQWRkcmVzc30pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoKS5zZXRTdGFuZGFyZEFkZHJlc3MocmVzcC5yZXN1bHQuc3RhbmRhcmRfYWRkcmVzcykuc2V0UGF5bWVudElkKHJlc3AucmVzdWx0LnBheW1lbnRfaWQpLnNldEludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfaGVpZ2h0XCIpKS5yZXN1bHQuaGVpZ2h0O1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGdldHRpbmcgdGhlIGNoYWluIGhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF5OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGluZyBhIGhlaWdodCBieSBkYXRlXCIpO1xuICB9XG4gIFxuICBhc3luYyBzeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodD86IE1vbmVyb1dhbGxldExpc3RlbmVyIHwgbnVtYmVyLCBzdGFydEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvU3luY1Jlc3VsdD4ge1xuICAgIGFzc2VydCghKGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyKSwgXCJNb25lcm8gV2FsbGV0IFJQQyBkb2VzIG5vdCBzdXBwb3J0IHJlcG9ydGluZyBzeW5jIHByb2dyZXNzXCIpO1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlZnJlc2hcIiwge3N0YXJ0X2hlaWdodDogc3RhcnRIZWlnaHR9LCAwKTtcbiAgICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3AucmVzdWx0LmJsb2Nrc19mZXRjaGVkLCByZXNwLnJlc3VsdC5yZWNlaXZlZF9tb25leSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZSA9PT0gXCJubyBjb25uZWN0aW9uIHRvIGRhZW1vblwiKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXM/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBcbiAgICAvLyBjb252ZXJ0IG1zIHRvIHNlY29uZHMgZm9yIHJwYyBwYXJhbWV0ZXJcbiAgICBsZXQgc3luY1BlcmlvZEluU2Vjb25kcyA9IE1hdGgucm91bmQoKHN5bmNQZXJpb2RJbk1zID09PSB1bmRlZmluZWQgPyBNb25lcm9XYWxsZXRScGMuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA6IHN5bmNQZXJpb2RJbk1zKSAvIDEwMDApO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhdXRvX3JlZnJlc2hcIiwge1xuICAgICAgZW5hYmxlOiB0cnVlLFxuICAgICAgcGVyaW9kOiBzeW5jUGVyaW9kSW5TZWNvbmRzXG4gICAgfSk7XG4gICAgXG4gICAgLy8gdXBkYXRlIHN5bmMgcGVyaW9kIGZvciBwb2xsZXJcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gc3luY1BlcmlvZEluU2Vjb25kcyAqIDEwMDA7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyICE9PSB1bmRlZmluZWQpIHRoaXMud2FsbGV0UG9sbGVyLnNldFBlcmlvZEluTXModGhpcy5zeW5jUGVyaW9kSW5Ncyk7XG4gICAgXG4gICAgLy8gcG9sbCBpZiBsaXN0ZW5pbmdcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgfVxuXG4gIGdldFN5bmNQZXJpb2RJbk1zKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuc3luY1BlcmlvZEluTXM7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhdXRvX3JlZnJlc2hcIiwgeyBlbmFibGU6IGZhbHNlIH0pO1xuICB9XG4gIFxuICBhc3luYyBzY2FuVHhzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdHhIYXNoZXMgfHwgIXR4SGFzaGVzLmxlbmd0aCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gdHggaGFzaGVzIGdpdmVuIHRvIHNjYW5cIik7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2Nhbl90eFwiLCB7dHhpZHM6IHR4SGFzaGVzfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhblNwZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc2Nhbl9zcGVudFwiLCB1bmRlZmluZWQsIDApO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlc2Nhbl9ibG9ja2NoYWluXCIsIHVuZGVmaW5lZCwgMCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbGFuY2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYWxhbmNlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCB0YWc/OiBzdHJpbmcsIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnRbXT4ge1xuICAgIFxuICAgIC8vIGZldGNoIGFjY291bnRzIGZyb20gcnBjXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWNjb3VudHNcIiwge3RhZzogdGFnfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgYWNjb3VudCBvYmplY3RzIGFuZCBmZXRjaCBzdWJhZGRyZXNzZXMgcGVyIGFjY291bnQgdXNpbmcgZ2V0X2FkZHJlc3NcbiAgICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBnZXRfYWRkcmVzcyBzaG91bGQgc3VwcG9ydCBhbGxfYWNjb3VudHMgc28gbm90IGNhbGxlZCBvbmNlIHBlciBhY2NvdW50XG4gICAgbGV0IGFjY291bnRzOiBNb25lcm9BY2NvdW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBycGNBY2NvdW50IG9mIHJlc3AucmVzdWx0LnN1YmFkZHJlc3NfYWNjb3VudHMpIHtcbiAgICAgIGxldCBhY2NvdW50ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNBY2NvdW50KHJwY0FjY291bnQpO1xuICAgICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMpIGFjY291bnQuc2V0U3ViYWRkcmVzc2VzKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnQuZ2V0SW5kZXgoKSwgdW5kZWZpbmVkLCB0cnVlKSk7XG4gICAgICBhY2NvdW50cy5wdXNoKGFjY291bnQpO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgbWVyZ2UgZmllbGRzIGZyb20gZ2V0X2JhbGFuY2UgYWNyb3NzIGFsbCBhY2NvdW50c1xuICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzICYmICFza2lwQmFsYW5jZXMpIHtcbiAgICAgIFxuICAgICAgLy8gdGhlc2UgZmllbGRzIGFyZSBub3QgaW5pdGlhbGl6ZWQgaWYgc3ViYWRkcmVzcyBpcyB1bnVzZWQgYW5kIHRoZXJlZm9yZSBub3QgcmV0dXJuZWQgZnJvbSBgZ2V0X2JhbGFuY2VgXG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkge1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cygwKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGZldGNoIGFuZCBtZXJnZSBpbmZvIGZyb20gZ2V0X2JhbGFuY2VcbiAgICAgIHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCB7YWxsX2FjY291bnRzOiB0cnVlfSk7XG4gICAgICBpZiAocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIG1lcmdlIGluZm9cbiAgICAgICAgICBsZXQgYWNjb3VudCA9IGFjY291bnRzW3N1YmFkZHJlc3MuZ2V0QWNjb3VudEluZGV4KCldO1xuICAgICAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzLmdldEFjY291bnRJbmRleCgpLCBhY2NvdW50LmdldEluZGV4KCksIFwiUlBDIGFjY291bnRzIGFyZSBvdXQgb2Ygb3JkZXJcIik7ICAvLyB3b3VsZCBuZWVkIHRvIHN3aXRjaCBsb29rdXAgdG8gbG9vcFxuICAgICAgICAgIGxldCB0Z3RTdWJhZGRyZXNzID0gYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKVtzdWJhZGRyZXNzLmdldEluZGV4KCldO1xuICAgICAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzLmdldEluZGV4KCksIHRndFN1YmFkZHJlc3MuZ2V0SW5kZXgoKSwgXCJSUEMgc3ViYWRkcmVzc2VzIGFyZSBvdXQgb2Ygb3JkZXJcIik7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0QmFsYW5jZShzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSk7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSk7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGFjY291bnRzO1xuICB9XG4gIFxuICAvLyBUT0RPOiBnZXRBY2NvdW50QnlJbmRleCgpLCBnZXRBY2NvdW50QnlUYWcoKVxuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBhc3NlcnQoYWNjb3VudElkeCA+PSAwKTtcbiAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgaWYgKGFjY291bnQuZ2V0SW5kZXgoKSA9PT0gYWNjb3VudElkeCkge1xuICAgICAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcykgYWNjb3VudC5zZXRTdWJhZGRyZXNzZXMoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCBza2lwQmFsYW5jZXMpKTtcbiAgICAgICAgcmV0dXJuIGFjY291bnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIkFjY291bnQgd2l0aCBpbmRleCBcIiArIGFjY291bnRJZHggKyBcIiBkb2VzIG5vdCBleGlzdFwiKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBsYWJlbCA9IGxhYmVsID8gbGFiZWwgOiB1bmRlZmluZWQ7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfYWNjb3VudFwiLCB7bGFiZWw6IGxhYmVsfSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9BY2NvdW50KHtcbiAgICAgIGluZGV4OiByZXNwLnJlc3VsdC5hY2NvdW50X2luZGV4LFxuICAgICAgcHJpbWFyeUFkZHJlc3M6IHJlc3AucmVzdWx0LmFkZHJlc3MsXG4gICAgICBsYWJlbDogbGFiZWwsXG4gICAgICBiYWxhbmNlOiBCaWdJbnQoMCksXG4gICAgICB1bmxvY2tlZEJhbGFuY2U6IEJpZ0ludCgwKVxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0luZGljZXM/OiBudW1iZXJbXSwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggc3ViYWRkcmVzc2VzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBhY2NvdW50SWR4O1xuICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcykgcGFyYW1zLmFkZHJlc3NfaW5kZXggPSBHZW5VdGlscy5saXN0aWZ5KHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzXCIsIHBhcmFtcyk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBzdWJhZGRyZXNzZXNcbiAgICBsZXQgc3ViYWRkcmVzc2VzID0gW107XG4gICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5hZGRyZXNzZXMpIHtcbiAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgICBzdWJhZGRyZXNzZXMucHVzaChzdWJhZGRyZXNzKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIGluaXRpYWxpemUgc3ViYWRkcmVzcyBiYWxhbmNlc1xuICAgIGlmICghc2tpcEJhbGFuY2VzKSB7XG4gICAgICBcbiAgICAgIC8vIHRoZXNlIGZpZWxkcyBhcmUgbm90IGluaXRpYWxpemVkIGlmIHN1YmFkZHJlc3MgaXMgdW51c2VkIGFuZCB0aGVyZWZvcmUgbm90IHJldHVybmVkIGZyb20gYGdldF9iYWxhbmNlYFxuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGZldGNoIGFuZCBpbml0aWFsaXplIGJhbGFuY2VzXG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwgcGFyYW1zKTtcbiAgICAgIGlmIChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICBmb3IgKGxldCBycGNTdWJhZGRyZXNzIG9mIHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3MgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gdHJhbnNmZXIgaW5mbyB0byBleGlzdGluZyBzdWJhZGRyZXNzIG9iamVjdFxuICAgICAgICAgIGZvciAobGV0IHRndFN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICAgICAgICBpZiAodGd0U3ViYWRkcmVzcy5nZXRJbmRleCgpICE9PSBzdWJhZGRyZXNzLmdldEluZGV4KCkpIGNvbnRpbnVlOyAvLyBza2lwIHRvIHN1YmFkZHJlc3Mgd2l0aCBzYW1lIGluZGV4XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHN1YmFkZHJlc3MuZ2V0TnVtVW5zcGVudE91dHB1dHMoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXROdW1CbG9ja3NUb1VubG9jaygpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soc3ViYWRkcmVzcy5nZXROdW1CbG9ja3NUb1VubG9jaygpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgYWRkcmVzc2VzXG4gICAgbGV0IHN1YmFkZHJlc3NNYXAgPSB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XTtcbiAgICBpZiAoIXN1YmFkZHJlc3NNYXApIHtcbiAgICAgIHN1YmFkZHJlc3NNYXAgPSB7fTtcbiAgICAgIHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdID0gc3ViYWRkcmVzc01hcDtcbiAgICB9XG4gICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgIHN1YmFkZHJlc3NNYXBbc3ViYWRkcmVzcy5nZXRJbmRleCgpXSA9IHN1YmFkZHJlc3MuZ2V0QWRkcmVzcygpO1xuICAgIH1cbiAgICBcbiAgICAvLyByZXR1cm4gcmVzdWx0c1xuICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gIH1cblxuICBhc3luYyBnZXRTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgYXNzZXJ0KGFjY291bnRJZHggPj0gMCk7XG4gICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPj0gMCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBbc3ViYWRkcmVzc0lkeF0sIHNraXBCYWxhbmNlcykpWzBdO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfYWRkcmVzc1wiLCB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeCwgbGFiZWw6IGxhYmVsfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgc3ViYWRkcmVzcyBvYmplY3RcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKCk7XG4gICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgc3ViYWRkcmVzcy5zZXRJbmRleChyZXNwLnJlc3VsdC5hZGRyZXNzX2luZGV4KTtcbiAgICBzdWJhZGRyZXNzLnNldEFkZHJlc3MocmVzcC5yZXN1bHQuYWRkcmVzcyk7XG4gICAgc3ViYWRkcmVzcy5zZXRMYWJlbChsYWJlbCA/IGxhYmVsIDogdW5kZWZpbmVkKTtcbiAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgc3ViYWRkcmVzcy5zZXRJc1VzZWQoZmFsc2UpO1xuICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cblxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJsYWJlbF9hZGRyZXNzXCIsIHtpbmRleDoge21ham9yOiBhY2NvdW50SWR4LCBtaW5vcjogc3ViYWRkcmVzc0lkeH0sIGxhYmVsOiBsYWJlbH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHMocXVlcnk/OiBzdHJpbmdbXSB8IFBhcnRpYWw8TW9uZXJvVHhRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyBjb3B5IHF1ZXJ5XG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHRlbXBvcmFyaWx5IGRpc2FibGUgdHJhbnNmZXIgYW5kIG91dHB1dCBxdWVyaWVzIGluIG9yZGVyIHRvIGNvbGxlY3QgYWxsIHR4IGluZm9ybWF0aW9uXG4gICAgbGV0IHRyYW5zZmVyUXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0VHJhbnNmZXJRdWVyeSgpO1xuICAgIGxldCBpbnB1dFF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldElucHV0UXVlcnkoKTtcbiAgICBsZXQgb3V0cHV0UXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0T3V0cHV0UXVlcnkoKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0VHJhbnNmZXJRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRJbnB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldE91dHB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgXG4gICAgLy8gZmV0Y2ggYWxsIHRyYW5zZmVycyB0aGF0IG1lZXQgdHggcXVlcnlcbiAgICBsZXQgdHJhbnNmZXJzID0gYXdhaXQgdGhpcy5nZXRUcmFuc2ZlcnNBdXgobmV3IE1vbmVyb1RyYW5zZmVyUXVlcnkoKS5zZXRUeFF1ZXJ5KE1vbmVyb1dhbGxldFJwYy5kZWNvbnRleHR1YWxpemUocXVlcnlOb3JtYWxpemVkLmNvcHkoKSkpKTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHVuaXF1ZSB0eHMgZnJvbSB0cmFuc2ZlcnMgd2hpbGUgcmV0YWluaW5nIG9yZGVyXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGxldCB0eHNTZXQgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHJhbnNmZXJzKSB7XG4gICAgICBpZiAoIXR4c1NldC5oYXModHJhbnNmZXIuZ2V0VHgoKSkpIHtcbiAgICAgICAgdHhzLnB1c2godHJhbnNmZXIuZ2V0VHgoKSk7XG4gICAgICAgIHR4c1NldC5hZGQodHJhbnNmZXIuZ2V0VHgoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHR5cGVzIGludG8gbWFwcyBmb3IgbWVyZ2luZyBhbmQgbG9va3VwXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIG1lcmdlIG91dHB1dHMgaWYgcmVxdWVzdGVkXG4gICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5nZXRJbmNsdWRlT3V0cHV0cygpIHx8IG91dHB1dFF1ZXJ5KSB7XG4gICAgICAgIFxuICAgICAgLy8gZmV0Y2ggb3V0cHV0c1xuICAgICAgbGV0IG91dHB1dFF1ZXJ5QXV4ID0gKG91dHB1dFF1ZXJ5ID8gb3V0cHV0UXVlcnkuY29weSgpIDogbmV3IE1vbmVyb091dHB1dFF1ZXJ5KCkpLnNldFR4UXVlcnkoTW9uZXJvV2FsbGV0UnBjLmRlY29udGV4dHVhbGl6ZShxdWVyeU5vcm1hbGl6ZWQuY29weSgpKSk7XG4gICAgICBsZXQgb3V0cHV0cyA9IGF3YWl0IHRoaXMuZ2V0T3V0cHV0c0F1eChvdXRwdXRRdWVyeUF1eCk7XG4gICAgICBcbiAgICAgIC8vIG1lcmdlIG91dHB1dCB0eHMgb25lIHRpbWUgd2hpbGUgcmV0YWluaW5nIG9yZGVyXG4gICAgICBsZXQgb3V0cHV0VHhzID0gW107XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2Ygb3V0cHV0cykge1xuICAgICAgICBpZiAoIW91dHB1dFR4cy5pbmNsdWRlcyhvdXRwdXQuZ2V0VHgoKSkpIHtcbiAgICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeChvdXRwdXQuZ2V0VHgoKSwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgICAgICBvdXRwdXRUeHMucHVzaChvdXRwdXQuZ2V0VHgoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gcmVzdG9yZSB0cmFuc2ZlciBhbmQgb3V0cHV0IHF1ZXJpZXNcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0VHJhbnNmZXJRdWVyeSh0cmFuc2ZlclF1ZXJ5KTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SW5wdXRRdWVyeShpbnB1dFF1ZXJ5KTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0T3V0cHV0UXVlcnkob3V0cHV0UXVlcnkpO1xuICAgIFxuICAgIC8vIGZpbHRlciB0eHMgdGhhdCBkb24ndCBtZWV0IHRyYW5zZmVyIHF1ZXJ5XG4gICAgbGV0IHR4c1F1ZXJpZWQgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQubWVldHNDcml0ZXJpYSh0eCkpIHR4c1F1ZXJpZWQucHVzaCh0eCk7XG4gICAgICBlbHNlIGlmICh0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgIH1cbiAgICB0eHMgPSB0eHNRdWVyaWVkO1xuICAgIFxuICAgIC8vIHNwZWNpYWwgY2FzZTogcmUtZmV0Y2ggdHhzIGlmIGluY29uc2lzdGVuY3kgY2F1c2VkIGJ5IG5lZWRpbmcgdG8gbWFrZSBtdWx0aXBsZSBycGMgY2FsbHNcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpICYmIHR4LmdldEJsb2NrKCkgPT09IHVuZGVmaW5lZCB8fCAhdHguZ2V0SXNDb25maXJtZWQoKSAmJiB0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkluY29uc2lzdGVuY3kgZGV0ZWN0ZWQgYnVpbGRpbmcgdHhzIGZyb20gbXVsdGlwbGUgcnBjIGNhbGxzLCByZS1mZXRjaGluZyB0eHNcIik7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFR4cyhxdWVyeU5vcm1hbGl6ZWQpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBvcmRlciB0eHMgaWYgdHggaGFzaGVzIGdpdmVuIHRoZW4gcmV0dXJuXG4gICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKSAmJiBxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkubGVuZ3RoID4gMCkge1xuICAgICAgbGV0IHR4c0J5SWQgPSBuZXcgTWFwKCkgIC8vIHN0b3JlIHR4cyBpbiB0ZW1wb3JhcnkgbWFwIGZvciBzb3J0aW5nXG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4c0J5SWQuc2V0KHR4LmdldEhhc2goKSwgdHgpO1xuICAgICAgbGV0IG9yZGVyZWRUeHMgPSBbXTtcbiAgICAgIGZvciAobGV0IGhhc2ggb2YgcXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpKSBpZiAodHhzQnlJZC5nZXQoaGFzaCkpIG9yZGVyZWRUeHMucHVzaCh0eHNCeUlkLmdldChoYXNoKSk7XG4gICAgICB0eHMgPSBvcmRlcmVkVHhzO1xuICAgIH1cbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9UcmFuc2ZlcltdPiB7XG4gICAgXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIGdldCB0cmFuc2ZlcnMgZGlyZWN0bHkgaWYgcXVlcnkgZG9lcyBub3QgcmVxdWlyZSB0eCBjb250ZXh0IChvdGhlciB0cmFuc2ZlcnMsIG91dHB1dHMpXG4gICAgaWYgKCFNb25lcm9XYWxsZXRScGMuaXNDb250ZXh0dWFsKHF1ZXJ5Tm9ybWFsaXplZCkpIHJldHVybiB0aGlzLmdldFRyYW5zZmVyc0F1eChxdWVyeU5vcm1hbGl6ZWQpO1xuICAgIFxuICAgIC8vIG90aGVyd2lzZSBnZXQgdHhzIHdpdGggZnVsbCBtb2RlbHMgdG8gZnVsZmlsbCBxdWVyeVxuICAgIGxldCB0cmFuc2ZlcnMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLmdldFR4cyhxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpKSkge1xuICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZmlsdGVyVHJhbnNmZXJzKHF1ZXJ5Tm9ybWFsaXplZCkpIHtcbiAgICAgICAgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHJhbnNmZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9PdXRwdXRRdWVyeT4pOiBQcm9taXNlPE1vbmVyb091dHB1dFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZU91dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBnZXQgb3V0cHV0cyBkaXJlY3RseSBpZiBxdWVyeSBkb2VzIG5vdCByZXF1aXJlIHR4IGNvbnRleHQgKG90aGVyIG91dHB1dHMsIHRyYW5zZmVycylcbiAgICBpZiAoIU1vbmVyb1dhbGxldFJwYy5pc0NvbnRleHR1YWwocXVlcnlOb3JtYWxpemVkKSkgcmV0dXJuIHRoaXMuZ2V0T3V0cHV0c0F1eChxdWVyeU5vcm1hbGl6ZWQpO1xuICAgIFxuICAgIC8vIG90aGVyd2lzZSBnZXQgdHhzIHdpdGggZnVsbCBtb2RlbHMgdG8gZnVsZmlsbCBxdWVyeVxuICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5nZXRUeHMocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKSkpIHtcbiAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5maWx0ZXJPdXRwdXRzKHF1ZXJ5Tm9ybWFsaXplZCkpIHtcbiAgICAgICAgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRPdXRwdXRzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4cG9ydF9vdXRwdXRzXCIsIHthbGw6IGFsbH0pKS5yZXN1bHQub3V0cHV0c19kYXRhX2hleDtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW1wb3J0X291dHB1dHNcIiwge291dHB1dHNfZGF0YV9oZXg6IG91dHB1dHNIZXh9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQubnVtX2ltcG9ydGVkO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRLZXlJbWFnZXMoYWxsID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5ycGNFeHBvcnRLZXlJbWFnZXMoYWxsKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlczogTW9uZXJvS2V5SW1hZ2VbXSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQ+IHtcbiAgICBcbiAgICAvLyBjb252ZXJ0IGtleSBpbWFnZXMgdG8gcnBjIHBhcmFtZXRlclxuICAgIGxldCBycGNLZXlJbWFnZXMgPSBrZXlJbWFnZXMubWFwKGtleUltYWdlID0+ICh7a2V5X2ltYWdlOiBrZXlJbWFnZS5nZXRIZXgoKSwgc2lnbmF0dXJlOiBrZXlJbWFnZS5nZXRTaWduYXR1cmUoKX0pKTtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9rZXlfaW1hZ2VzXCIsIHtzaWduZWRfa2V5X2ltYWdlczogcnBjS2V5SW1hZ2VzfSk7XG4gICAgXG4gICAgLy8gYnVpbGQgYW5kIHJldHVybiByZXN1bHRcbiAgICBsZXQgaW1wb3J0UmVzdWx0ID0gbmV3IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0KCk7XG4gICAgaW1wb3J0UmVzdWx0LnNldEhlaWdodChyZXNwLnJlc3VsdC5oZWlnaHQpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRTcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQuc3BlbnQpKTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0VW5zcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQudW5zcGVudCkpO1xuICAgIHJldHVybiBpbXBvcnRSZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnJwY0V4cG9ydEtleUltYWdlcyhmYWxzZSk7XG4gIH1cbiAgXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImZyZWV6ZVwiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICB9XG4gIFxuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidGhhd1wiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICB9XG4gIFxuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmcm96ZW5cIiwge2tleV9pbWFnZToga2V5SW1hZ2V9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuZnJvemVuID09PSB0cnVlO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlLCBjb3B5LCBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWdOb3JtYWxpemVkLnNldENhblNwbGl0KHRydWUpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkgPT09IHRydWUgJiYgYXdhaXQgdGhpcy5pc011bHRpc2lnKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCByZWxheSBtdWx0aXNpZyB0cmFuc2FjdGlvbiB1bnRpbCBjby1zaWduZWRcIik7XG5cbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzc2VzIHRvIHNlbmQgZnJvbVxuICAgIGxldCBhY2NvdW50SWR4ID0gY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgdGhlIGFjY291bnQgaW5kZXggdG8gc2VuZCBmcm9tXCIpO1xuICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnNsaWNlKDApOyAvLyBmZXRjaCBhbGwgb3IgY29weSBnaXZlbiBpbmRpY2VzXG4gICAgXG4gICAgLy8gYnVpbGQgY29uZmlnIHBhcmFtZXRlcnNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuZGVzdGluYXRpb25zID0gW107XG4gICAgZm9yIChsZXQgZGVzdGluYXRpb24gb2YgY29uZmlnTm9ybWFsaXplZC5nZXREZXN0aW5hdGlvbnMoKSkge1xuICAgICAgYXNzZXJ0KGRlc3RpbmF0aW9uLmdldEFkZHJlc3MoKSwgXCJEZXN0aW5hdGlvbiBhZGRyZXNzIGlzIG5vdCBkZWZpbmVkXCIpO1xuICAgICAgYXNzZXJ0KGRlc3RpbmF0aW9uLmdldEFtb3VudCgpLCBcIkRlc3RpbmF0aW9uIGFtb3VudCBpcyBub3QgZGVmaW5lZFwiKTtcbiAgICAgIHBhcmFtcy5kZXN0aW5hdGlvbnMucHVzaCh7IGFkZHJlc3M6IGRlc3RpbmF0aW9uLmdldEFkZHJlc3MoKSwgYW1vdW50OiBkZXN0aW5hdGlvbi5nZXRBbW91bnQoKS50b1N0cmluZygpIH0pO1xuICAgIH1cbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKSkgcGFyYW1zLnN1YnRyYWN0X2ZlZV9mcm9tX291dHB1dHMgPSBjb25maWdOb3JtYWxpemVkLmdldFN1YnRyYWN0RmVlRnJvbSgpO1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gYWNjb3VudElkeDtcbiAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gc3ViYWRkcmVzc0luZGljZXM7XG4gICAgcGFyYW1zLnBheW1lbnRfaWQgPSBjb25maWdOb3JtYWxpemVkLmdldFBheW1lbnRJZCgpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFVubG9ja1RpbWUoKSAhPT0gdW5kZWZpbmVkKSBwYXJhbXMudW5sb2NrX3RpbWUgPSBjb25maWdOb3JtYWxpemVkLmdldFVubG9ja1RpbWUoKS50b1N0cmluZygpXG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSAhPT0gdHJ1ZTtcbiAgICBhc3NlcnQoY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpIDw9IDMpO1xuICAgIHBhcmFtcy5wcmlvcml0eSA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2hleCA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9tZXRhZGF0YSA9IHRydWU7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSkgcGFyYW1zLmdldF90eF9rZXlzID0gdHJ1ZTsgLy8gcGFyYW0gdG8gZ2V0IHR4IGtleShzKSBkZXBlbmRzIGlmIHNwbGl0XG4gICAgZWxzZSBwYXJhbXMuZ2V0X3R4X2tleSA9IHRydWU7XG5cbiAgICAvLyBjYW5ub3QgYXBwbHkgc3VidHJhY3RGZWVGcm9tIHdpdGggYHRyYW5zZmVyX3NwbGl0YCBjYWxsXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSAmJiBjb25maWdOb3JtYWxpemVkLmdldFN1YnRyYWN0RmVlRnJvbSgpICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkubGVuZ3RoID4gMCkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwic3VidHJhY3RmZWVmcm9tIHRyYW5zZmVycyBjYW5ub3QgYmUgc3BsaXQgb3ZlciBtdWx0aXBsZSB0cmFuc2FjdGlvbnMgeWV0XCIpO1xuICAgIH1cbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPyBcInRyYW5zZmVyX3NwbGl0XCIgOiBcInRyYW5zZmVyXCIsIHBhcmFtcyk7XG4gICAgICByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgaWYgKGVyci5tZXNzYWdlLmluZGV4T2YoXCJXQUxMRVRfUlBDX0VSUk9SX0NPREVfV1JPTkdfQUREUkVTU1wiKSA+IC0xKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIGRlc3RpbmF0aW9uIGFkZHJlc3NcIik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICAgIFxuICAgIC8vIHByZS1pbml0aWFsaXplIHR4cyBpZmYgcHJlc2VudC4gbXVsdGlzaWcgYW5kIHZpZXctb25seSB3YWxsZXRzIHdpbGwgaGF2ZSB0eCBzZXQgd2l0aG91dCB0cmFuc2FjdGlvbnNcbiAgICBsZXQgdHhzO1xuICAgIGxldCBudW1UeHMgPSBjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPyAocmVzdWx0LmZlZV9saXN0ICE9PSB1bmRlZmluZWQgPyByZXN1bHQuZmVlX2xpc3QubGVuZ3RoIDogMCkgOiAocmVzdWx0LmZlZSAhPT0gdW5kZWZpbmVkID8gMSA6IDApO1xuICAgIGlmIChudW1UeHMgPiAwKSB0eHMgPSBbXTtcbiAgICBsZXQgY29weURlc3RpbmF0aW9ucyA9IG51bVR4cyA9PT0gMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVR4czsgaSsrKSB7XG4gICAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICAgIE1vbmVyb1dhbGxldFJwYy5pbml0U2VudFR4V2FsbGV0KGNvbmZpZ05vcm1hbGl6ZWQsIHR4LCBjb3B5RGVzdGluYXRpb25zKTtcbiAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgICBpZiAoc3ViYWRkcmVzc0luZGljZXMgIT09IHVuZGVmaW5lZCAmJiBzdWJhZGRyZXNzSW5kaWNlcy5sZW5ndGggPT09IDEpIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICB0eHMucHVzaCh0eCk7XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCBzZXQgZnJvbSBycGMgcmVzcG9uc2Ugd2l0aCBwcmUtaW5pdGlhbGl6ZWQgdHhzXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSkgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzdWx0LCB0eHMsIGNvbmZpZ05vcm1hbGl6ZWQpLmdldFR4cygpO1xuICAgIGVsc2UgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhUb1R4U2V0KHJlc3VsdCwgdHhzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0eHNbMF0sIHRydWUsIGNvbmZpZ05vcm1hbGl6ZWQpLmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcE91dHB1dChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gYnVpbGQgcmVxdWVzdCBwYXJhbWV0ZXJzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmFkZHJlc3MgPSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpO1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gY29uZmlnLmdldEFjY291bnRJbmRleCgpO1xuICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKTtcbiAgICBwYXJhbXMua2V5X2ltYWdlID0gY29uZmlnLmdldEtleUltYWdlKCk7XG4gICAgaWYgKGNvbmZpZy5nZXRVbmxvY2tUaW1lKCkgIT09IHVuZGVmaW5lZCkgcGFyYW1zLnVubG9ja190aW1lID0gY29uZmlnLmdldFVubG9ja1RpbWUoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgIT09IHRydWU7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXRQcmlvcml0eSgpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWcuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWcuZ2V0UHJpb3JpdHkoKTtcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZy5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2tleSA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9oZXggPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfbWV0YWRhdGEgPSB0cnVlO1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfc2luZ2xlXCIsIHBhcmFtcyk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZy5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBidWlsZCBhbmQgcmV0dXJuIHR4XG4gICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnLCB1bmRlZmluZWQsIHRydWUpO1xuICAgIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhUb1R4U2V0KHJlc3VsdCwgdHgsIHRydWUsIGNvbmZpZyk7XG4gICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpWzBdLnNldEFtb3VudCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkpOyAvLyBpbml0aWFsaXplIGRlc3RpbmF0aW9uIGFtb3VudFxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwOyBkZWZhdWx0IHRvIGFsbCB3aXRoIHVubG9ja2VkIGJhbGFuY2UgaWYgbm90IHNwZWNpZmllZFxuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpOyAgLy8gbWFwcyBlYWNoIGFjY291bnQgaW5kZXggdG8gc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGluZGljZXMuc2V0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCksIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgaW5kaWNlcy5zZXQoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCkpKSB7XG4gICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgPiAwbikgc3ViYWRkcmVzc0luZGljZXMucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBhY2NvdW50cyA9IGF3YWl0IHRoaXMuZ2V0QWNjb3VudHModHJ1ZSk7XG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICAgIGlmIChhY2NvdW50LmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgICBpbmRpY2VzLnNldChhY2NvdW50LmdldEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc3dlZXAgZnJvbSBlYWNoIGFjY291bnQgYW5kIGNvbGxlY3QgcmVzdWx0aW5nIHR4IHNldHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYWNjb3VudElkeCBvZiBpbmRpY2VzLmtleXMoKSkge1xuICAgICAgXG4gICAgICAvLyBjb3B5IGFuZCBtb2RpZnkgdGhlIG9yaWdpbmFsIGNvbmZpZ1xuICAgICAgbGV0IGNvcHkgPSBjb25maWdOb3JtYWxpemVkLmNvcHkoKTtcbiAgICAgIGNvcHkuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgY29weS5zZXRTd2VlcEVhY2hTdWJhZGRyZXNzKGZhbHNlKTtcbiAgICAgIFxuICAgICAgLy8gc3dlZXAgYWxsIHN1YmFkZHJlc3NlcyB0b2dldGhlciAgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogY2FuIHRoaXMgcmV2ZWFsIG91dHB1dHMgYmVsb25nIHRvIHRoZSBzYW1lIHdhbGxldD9cbiAgICAgIGlmIChjb3B5LmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSAhPT0gdHJ1ZSkge1xuICAgICAgICBjb3B5LnNldFN1YmFkZHJlc3NJbmRpY2VzKGluZGljZXMuZ2V0KGFjY291bnRJZHgpKTtcbiAgICAgICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5ycGNTd2VlcEFjY291bnQoY29weSkpIHR4cy5wdXNoKHR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gb3RoZXJ3aXNlIHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyBpbmRpdmlkdWFsbHlcbiAgICAgIGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzSWR4IG9mIGluZGljZXMuZ2V0KGFjY291bnRJZHgpKSB7XG4gICAgICAgICAgY29weS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhbc3ViYWRkcmVzc0lkeF0pO1xuICAgICAgICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMucnBjU3dlZXBBY2NvdW50KGNvcHkpKSB0eHMucHVzaCh0eCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcER1c3QocmVsYXk/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHJlbGF5ID09PSB1bmRlZmluZWQpIHJlbGF5ID0gZmFsc2U7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzd2VlcF9kdXN0XCIsIHtkb19ub3RfcmVsYXk6ICFyZWxheX0pO1xuICAgIGlmIChyZWxheSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzdWx0KTtcbiAgICBpZiAodHhTZXQuZ2V0VHhzKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQoIXJlbGF5KTtcbiAgICAgIHR4LnNldEluVHhQb29sKHR4LmdldElzUmVsYXllZCgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0LmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhczogKE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKVtdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eEhhc2hlcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykge1xuICAgICAgbGV0IG1ldGFkYXRhID0gdHhPck1ldGFkYXRhIGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQgPyB0eE9yTWV0YWRhdGEuZ2V0TWV0YWRhdGEoKSA6IHR4T3JNZXRhZGF0YTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVsYXlfdHhcIiwgeyBoZXg6IG1ldGFkYXRhIH0pO1xuICAgICAgdHhIYXNoZXMucHVzaChyZXNwLnJlc3VsdC50eF9oYXNoKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7IC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgcmV0dXJuIHR4SGFzaGVzO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImRlc2NyaWJlX3RyYW5zZmVyXCIsIHtcbiAgICAgIHVuc2lnbmVkX3R4c2V0OiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCksXG4gICAgICBtdWx0aXNpZ190eHNldDogdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpXG4gICAgfSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlcihyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnbl90cmFuc2ZlclwiLCB7XG4gICAgICB1bnNpZ25lZF90eHNldDogdW5zaWduZWRUeEhleCxcbiAgICAgIGV4cG9ydF9yYXc6IGZhbHNlXG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeHMoc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN1Ym1pdF90cmFuc2ZlclwiLCB7XG4gICAgICB0eF9kYXRhX2hleDogc2lnbmVkVHhIZXhcbiAgICB9KTtcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQudHhfaGFzaF9saXN0O1xuICB9XG4gIFxuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIHNpZ25hdHVyZVR5cGUgPSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCBhY2NvdW50SWR4ID0gMCwgc3ViYWRkcmVzc0lkeCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnblwiLCB7XG4gICAgICAgIGRhdGE6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZV90eXBlOiBzaWduYXR1cmVUeXBlID09PSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZID8gXCJzcGVuZFwiIDogXCJ2aWV3XCIsXG4gICAgICAgIGFjY291bnRfaW5kZXg6IGFjY291bnRJZHgsXG4gICAgICAgIGFkZHJlc3NfaW5kZXg6IHN1YmFkZHJlc3NJZHhcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICB9XG4gIFxuICBhc3luYyB2ZXJpZnlNZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdD4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInZlcmlmeVwiLCB7ZGF0YTogbWVzc2FnZSwgYWRkcmVzczogYWRkcmVzcywgc2lnbmF0dXJlOiBzaWduYXR1cmV9KTtcbiAgICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdChcbiAgICAgICAgcmVzdWx0Lmdvb2QgPyB7aXNHb29kOiByZXN1bHQuZ29vZCwgaXNPbGQ6IHJlc3VsdC5vbGQsIHNpZ25hdHVyZVR5cGU6IHJlc3VsdC5zaWduYXR1cmVfdHlwZSA9PT0gXCJ2aWV3XCIgPyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfVklFV19LRVkgOiBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCB2ZXJzaW9uOiByZXN1bHQudmVyc2lvbn0gOiB7aXNHb29kOiBmYWxzZX1cbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5nZXRDb2RlKCkgPT09IC0yKSByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQoe2lzR29vZDogZmFsc2V9KTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeEtleSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3R4X2tleVwiLCB7dHhpZDogdHhIYXNofSkpLnJlc3VsdC50eF9rZXk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhLZXkodHhIYXNoOiBzdHJpbmcsIHR4S2V5OiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja190eF9rZXlcIiwge3R4aWQ6IHR4SGFzaCwgdHhfa2V5OiB0eEtleSwgYWRkcmVzczogYWRkcmVzc30pO1xuICAgICAgXG4gICAgICAvLyBpbnRlcnByZXQgcmVzdWx0XG4gICAgICBsZXQgY2hlY2sgPSBuZXcgTW9uZXJvQ2hlY2tUeCgpO1xuICAgICAgY2hlY2suc2V0SXNHb29kKHRydWUpO1xuICAgICAgY2hlY2suc2V0TnVtQ29uZmlybWF0aW9ucyhyZXNwLnJlc3VsdC5jb25maXJtYXRpb25zKTtcbiAgICAgIGNoZWNrLnNldEluVHhQb29sKHJlc3AucmVzdWx0LmluX3Bvb2wpO1xuICAgICAgY2hlY2suc2V0UmVjZWl2ZWRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnJlY2VpdmVkKSk7XG4gICAgICByZXR1cm4gY2hlY2s7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3R4X3Byb29mXCIsIHt0eGlkOiB0eEhhc2gsIGFkZHJlc3M6IGFkZHJlc3MsIG1lc3NhZ2U6IG1lc3NhZ2V9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgdHJ5IHtcbiAgICAgIFxuICAgICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3R4X3Byb29mXCIsIHtcbiAgICAgICAgdHhpZDogdHhIYXNoLFxuICAgICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzaWduYXR1cmU6IHNpZ25hdHVyZVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIGludGVycHJldCByZXNwb25zZVxuICAgICAgbGV0IGlzR29vZCA9IHJlc3AucmVzdWx0Lmdvb2Q7XG4gICAgICBsZXQgY2hlY2sgPSBuZXcgTW9uZXJvQ2hlY2tUeCgpO1xuICAgICAgY2hlY2suc2V0SXNHb29kKGlzR29vZCk7XG4gICAgICBpZiAoaXNHb29kKSB7XG4gICAgICAgIGNoZWNrLnNldE51bUNvbmZpcm1hdGlvbnMocmVzcC5yZXN1bHQuY29uZmlybWF0aW9ucyk7XG4gICAgICAgIGNoZWNrLnNldEluVHhQb29sKHJlc3AucmVzdWx0LmluX3Bvb2wpO1xuICAgICAgICBjaGVjay5zZXRSZWNlaXZlZEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQucmVjZWl2ZWQpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjaGVjaztcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC0xICYmIGUubWVzc2FnZSA9PT0gXCJiYXNpY19zdHJpbmdcIikgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIk11c3QgcHJvdmlkZSBzaWduYXR1cmUgdG8gY2hlY2sgdHggcHJvb2ZcIiwgLTEpO1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9zcGVuZF9wcm9vZlwiLCB7dHhpZDogdHhIYXNoLCBtZXNzYWdlOiBtZXNzYWdlfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja19zcGVuZF9wcm9vZlwiLCB7XG4gICAgICAgIHR4aWQ6IHR4SGFzaCxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0Lmdvb2Q7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFsbDogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgYW1vdW50OiBiaWdpbnQsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3Jlc2VydmVfcHJvb2ZcIiwge1xuICAgICAgYWNjb3VudF9pbmRleDogYWNjb3VudElkeCxcbiAgICAgIGFtb3VudDogYW1vdW50LnRvU3RyaW5nKCksXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuXG4gIGFzeW5jIGNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tSZXNlcnZlPiB7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja19yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFkZHJlc3M6IGFkZHJlc3MsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICB9KTtcbiAgICBcbiAgICAvLyBpbnRlcnByZXQgcmVzdWx0c1xuICAgIGxldCBpc0dvb2QgPSByZXNwLnJlc3VsdC5nb29kO1xuICAgIGxldCBjaGVjayA9IG5ldyBNb25lcm9DaGVja1Jlc2VydmUoKTtcbiAgICBjaGVjay5zZXRJc0dvb2QoaXNHb29kKTtcbiAgICBpZiAoaXNHb29kKSB7XG4gICAgICBjaGVjay5zZXRVbmNvbmZpcm1lZFNwZW50QW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5zcGVudCkpO1xuICAgICAgY2hlY2suc2V0VG90YWxBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnRvdGFsKSk7XG4gICAgfVxuICAgIHJldHVybiBjaGVjaztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHhfbm90ZXNcIiwge3R4aWRzOiB0eEhhc2hlc30pKS5yZXN1bHQubm90ZXM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdLCBub3Rlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfdHhfbm90ZXNcIiwge3R4aWRzOiB0eEhhc2hlcywgbm90ZXM6IG5vdGVzfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVtdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc19ib29rXCIsIHtlbnRyaWVzOiBlbnRyeUluZGljZXN9KTtcbiAgICBpZiAoIXJlc3AucmVzdWx0LmVudHJpZXMpIHJldHVybiBbXTtcbiAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0LmVudHJpZXMpIHtcbiAgICAgIGVudHJpZXMucHVzaChuZXcgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSgpLnNldEluZGV4KHJwY0VudHJ5LmluZGV4KS5zZXRBZGRyZXNzKHJwY0VudHJ5LmFkZHJlc3MpLnNldERlc2NyaXB0aW9uKHJwY0VudHJ5LmRlc2NyaXB0aW9uKS5zZXRQYXltZW50SWQocnBjRW50cnkucGF5bWVudF9pZCkpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzOiBzdHJpbmcsIGRlc2NyaXB0aW9uPzogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImFkZF9hZGRyZXNzX2Jvb2tcIiwge2FkZHJlc3M6IGFkZHJlc3MsIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbn0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5pbmRleDtcbiAgfVxuICBcbiAgYXN5bmMgZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXg6IG51bWJlciwgc2V0QWRkcmVzczogYm9vbGVhbiwgYWRkcmVzczogc3RyaW5nIHwgdW5kZWZpbmVkLCBzZXREZXNjcmlwdGlvbjogYm9vbGVhbiwgZGVzY3JpcHRpb246IHN0cmluZyB8IHVuZGVmaW5lZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZWRpdF9hZGRyZXNzX2Jvb2tcIiwge1xuICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgc2V0X2FkZHJlc3M6IHNldEFkZHJlc3MsXG4gICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgc2V0X2Rlc2NyaXB0aW9uOiBzZXREZXNjcmlwdGlvbixcbiAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJkZWxldGVfYWRkcmVzc19ib29rXCIsIHtpbmRleDogZW50cnlJZHh9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGFnQWNjb3VudHModGFnLCBhY2NvdW50SW5kaWNlcykge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInRhZ19hY2NvdW50c1wiLCB7dGFnOiB0YWcsIGFjY291bnRzOiBhY2NvdW50SW5kaWNlc30pO1xuICB9XG5cbiAgYXN5bmMgdW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ1bnRhZ19hY2NvdW50c1wiLCB7YWNjb3VudHM6IGFjY291bnRJbmRpY2VzfSk7XG4gIH1cblxuICBhc3luYyBnZXRBY2NvdW50VGFncygpOiBQcm9taXNlPE1vbmVyb0FjY291bnRUYWdbXT4ge1xuICAgIGxldCB0YWdzID0gW107XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWNjb3VudF90YWdzXCIpO1xuICAgIGlmIChyZXNwLnJlc3VsdC5hY2NvdW50X3RhZ3MpIHtcbiAgICAgIGZvciAobGV0IHJwY0FjY291bnRUYWcgb2YgcmVzcC5yZXN1bHQuYWNjb3VudF90YWdzKSB7XG4gICAgICAgIHRhZ3MucHVzaChuZXcgTW9uZXJvQWNjb3VudFRhZyh7XG4gICAgICAgICAgdGFnOiBycGNBY2NvdW50VGFnLnRhZyA/IHJwY0FjY291bnRUYWcudGFnIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGxhYmVsOiBycGNBY2NvdW50VGFnLmxhYmVsID8gcnBjQWNjb3VudFRhZy5sYWJlbCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBhY2NvdW50SW5kaWNlczogcnBjQWNjb3VudFRhZy5hY2NvdW50c1xuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YWdzO1xuICB9XG5cbiAgYXN5bmMgc2V0QWNjb3VudFRhZ0xhYmVsKHRhZzogc3RyaW5nLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2FjY291bnRfdGFnX2Rlc2NyaXB0aW9uXCIsIHt0YWc6IHRhZywgZGVzY3JpcHRpb246IGxhYmVsfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBheW1lbnRVcmkoY29uZmlnOiBNb25lcm9UeENvbmZpZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibWFrZV91cmlcIiwge1xuICAgICAgYWRkcmVzczogY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSxcbiAgICAgIGFtb3VudDogY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFtb3VudCgpID8gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFtb3VudCgpLnRvU3RyaW5nKCkgOiB1bmRlZmluZWQsXG4gICAgICBwYXltZW50X2lkOiBjb25maWcuZ2V0UGF5bWVudElkKCksXG4gICAgICByZWNpcGllbnRfbmFtZTogY29uZmlnLmdldFJlY2lwaWVudE5hbWUoKSxcbiAgICAgIHR4X2Rlc2NyaXB0aW9uOiBjb25maWcuZ2V0Tm90ZSgpXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnVyaTtcbiAgfVxuICBcbiAgYXN5bmMgcGFyc2VQYXltZW50VXJpKHVyaTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeENvbmZpZz4ge1xuICAgIGFzc2VydCh1cmksIFwiTXVzdCBwcm92aWRlIFVSSSB0byBwYXJzZVwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInBhcnNlX3VyaVwiLCB7dXJpOiB1cml9KTtcbiAgICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKHthZGRyZXNzOiByZXNwLnJlc3VsdC51cmkuYWRkcmVzcywgYW1vdW50OiBCaWdJbnQocmVzcC5yZXN1bHQudXJpLmFtb3VudCl9KTtcbiAgICBjb25maWcuc2V0UGF5bWVudElkKHJlc3AucmVzdWx0LnVyaS5wYXltZW50X2lkKTtcbiAgICBjb25maWcuc2V0UmVjaXBpZW50TmFtZShyZXNwLnJlc3VsdC51cmkucmVjaXBpZW50X25hbWUpO1xuICAgIGNvbmZpZy5zZXROb3RlKHJlc3AucmVzdWx0LnVyaS50eF9kZXNjcmlwdGlvbik7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkpIGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5zZXRBZGRyZXNzKHVuZGVmaW5lZCk7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXRQYXltZW50SWQoKSkgY29uZmlnLnNldFBheW1lbnRJZCh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0UmVjaXBpZW50TmFtZSgpKSBjb25maWcuc2V0UmVjaXBpZW50TmFtZSh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0Tm90ZSgpKSBjb25maWcuc2V0Tm90ZSh1bmRlZmluZWQpO1xuICAgIHJldHVybiBjb25maWc7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2F0dHJpYnV0ZVwiLCB7a2V5OiBrZXl9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC52YWx1ZSA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHJlc3AucmVzdWx0LnZhbHVlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTQ1KSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXk6IHN0cmluZywgdmFsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYXR0cmlidXRlXCIsIHtrZXk6IGtleSwgdmFsdWU6IHZhbH0pO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzOiBudW1iZXIsIGJhY2tncm91bmRNaW5pbmc/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0YXJ0X21pbmluZ1wiLCB7XG4gICAgICB0aHJlYWRzX2NvdW50OiBudW1UaHJlYWRzLFxuICAgICAgZG9fYmFja2dyb3VuZF9taW5pbmc6IGJhY2tncm91bmRNaW5pbmcsXG4gICAgICBpZ25vcmVfYmF0dGVyeTogaWdub3JlQmF0dGVyeVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3BfbWluaW5nXCIpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnSW1wb3J0TmVlZGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm11bHRpc2lnX2ltcG9ydF9uZWVkZWQgPT09IHRydWU7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE11bHRpc2lnSW5mbygpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5mbz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaXNfbXVsdGlzaWdcIik7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCBpbmZvID0gbmV3IE1vbmVyb011bHRpc2lnSW5mbygpO1xuICAgIGluZm8uc2V0SXNNdWx0aXNpZyhyZXN1bHQubXVsdGlzaWcpO1xuICAgIGluZm8uc2V0SXNSZWFkeShyZXN1bHQucmVhZHkpO1xuICAgIGluZm8uc2V0VGhyZXNob2xkKHJlc3VsdC50aHJlc2hvbGQpO1xuICAgIGluZm8uc2V0TnVtUGFydGljaXBhbnRzKHJlc3VsdC50b3RhbCk7XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbiAgXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicHJlcGFyZV9tdWx0aXNpZ1wiLCB7ZW5hYmxlX211bHRpc2lnX2V4cGVyaW1lbnRhbDogdHJ1ZX0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIHJldHVybiByZXN1bHQubXVsdGlzaWdfaW5mbztcbiAgfVxuICBcbiAgYXN5bmMgbWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCB0aHJlc2hvbGQ6IG51bWJlciwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJtYWtlX211bHRpc2lnXCIsIHtcbiAgICAgIG11bHRpc2lnX2luZm86IG11bHRpc2lnSGV4ZXMsXG4gICAgICB0aHJlc2hvbGQ6IHRocmVzaG9sZCxcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZFxuICAgIH0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm11bHRpc2lnX2luZm87XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4Y2hhbmdlX211bHRpc2lnX2tleXNcIiwge211bHRpc2lnX2luZm86IG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkOiBwYXNzd29yZH0pO1xuICAgIHRoaXMuYWRkcmVzc0NhY2hlID0ge307XG4gICAgbGV0IG1zUmVzdWx0ID0gbmV3IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCgpO1xuICAgIG1zUmVzdWx0LnNldEFkZHJlc3MocmVzcC5yZXN1bHQuYWRkcmVzcyk7XG4gICAgbXNSZXN1bHQuc2V0TXVsdGlzaWdIZXgocmVzcC5yZXN1bHQubXVsdGlzaWdfaW5mbyk7XG4gICAgaWYgKG1zUmVzdWx0LmdldEFkZHJlc3MoKS5sZW5ndGggPT09IDApIG1zUmVzdWx0LnNldEFkZHJlc3ModW5kZWZpbmVkKTtcbiAgICBpZiAobXNSZXN1bHQuZ2V0TXVsdGlzaWdIZXgoKS5sZW5ndGggPT09IDApIG1zUmVzdWx0LnNldE11bHRpc2lnSGV4KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIG1zUmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRNdWx0aXNpZ0hleCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X211bHRpc2lnX2luZm9cIik7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmluZm87XG4gIH1cblxuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKCFHZW5VdGlscy5pc0FycmF5KG11bHRpc2lnSGV4ZXMpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgc3RyaW5nW10gdG8gaW1wb3J0TXVsdGlzaWdIZXgoKVwiKVxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW1wb3J0X211bHRpc2lnX2luZm9cIiwge2luZm86IG11bHRpc2lnSGV4ZXN9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQubl9vdXRwdXRzO1xuICB9XG5cbiAgYXN5bmMgc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25fbXVsdGlzaWdcIiwge3R4X2RhdGFfaGV4OiBtdWx0aXNpZ1R4SGV4fSk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIGxldCBzaWduUmVzdWx0ID0gbmV3IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCgpO1xuICAgIHNpZ25SZXN1bHQuc2V0U2lnbmVkTXVsdGlzaWdUeEhleChyZXN1bHQudHhfZGF0YV9oZXgpO1xuICAgIHNpZ25SZXN1bHQuc2V0VHhIYXNoZXMocmVzdWx0LnR4X2hhc2hfbGlzdCk7XG4gICAgcmV0dXJuIHNpZ25SZXN1bHQ7XG4gIH1cblxuICBhc3luYyBzdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN1Ym1pdF9tdWx0aXNpZ1wiLCB7dHhfZGF0YV9oZXg6IHNpZ25lZE11bHRpc2lnVHhIZXh9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQudHhfaGFzaF9saXN0O1xuICB9XG4gIFxuICBhc3luYyBjaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZDogc3RyaW5nLCBuZXdQYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoYW5nZV93YWxsZXRfcGFzc3dvcmRcIiwge29sZF9wYXNzd29yZDogb2xkUGFzc3dvcmQgfHwgXCJcIiwgbmV3X3Bhc3N3b3JkOiBuZXdQYXNzd29yZCB8fCBcIlwifSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNhdmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3RvcmVcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGNsb3NlKHNhdmUgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN1cGVyLmNsb3NlKHNhdmUpO1xuICAgIGlmIChzYXZlID09PSB1bmRlZmluZWQpIHNhdmUgPSBmYWxzZTtcbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2xvc2Vfd2FsbGV0XCIsIHthdXRvc2F2ZV9jdXJyZW50OiBzYXZlfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ2xvc2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFByaW1hcnlBZGRyZXNzKCk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICByZXR1cm4gZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtMTMgJiYgZS5tZXNzYWdlLmluZGV4T2YoXCJObyB3YWxsZXQgZmlsZVwiKSA+IC0xO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTYXZlIGFuZCBjbG9zZSB0aGUgY3VycmVudCB3YWxsZXQgYW5kIHN0b3AgdGhlIFJQQyBzZXJ2ZXIuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3RvcF93YWxsZXRcIik7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tIEFERCBKU0RPQyBGT1IgU1VQUE9SVEVEIERFRkFVTFQgSU1QTEVNRU5UQVRJT05TIC0tLS0tLS0tLS0tLS0tXG5cbiAgYXN5bmMgZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTogUHJvbWlzZTxudW1iZXJbXT4geyByZXR1cm4gc3VwZXIuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTsgfVxuICBhc3luYyBnZXRUeCh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHsgcmV0dXJuIHN1cGVyLmdldFR4KHR4SGFzaCk7IH1cbiAgYXN5bmMgZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb0luY29taW5nVHJhbnNmZXJbXT4geyByZXR1cm4gc3VwZXIuZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KSB7IHJldHVybiBzdXBlci5nZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeSk7IH1cbiAgYXN5bmMgY3JlYXRlVHgoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHsgcmV0dXJuIHN1cGVyLmNyZWF0ZVR4KGNvbmZpZyk7IH1cbiAgYXN5bmMgcmVsYXlUeCh0eE9yTWV0YWRhdGE6IE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLnJlbGF5VHgodHhPck1ldGFkYXRhKTsgfVxuICBhc3luYyBnZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIuZ2V0VHhOb3RlKHR4SGFzaCk7IH1cbiAgYXN5bmMgc2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nLCBub3RlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHN1cGVyLnNldFR4Tm90ZSh0eEhhc2gsIG5vdGUpOyB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHN0YXRpYyBhc3luYyBjb25uZWN0VG9XYWxsZXRScGModXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBsZXQgY29uZmlnID0gTW9uZXJvV2FsbGV0UnBjLm5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZywgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICBpZiAoY29uZmlnLmNtZCkgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5zdGFydFdhbGxldFJwY1Byb2Nlc3MoY29uZmlnKTtcbiAgICBlbHNlIHJldHVybiBuZXcgTW9uZXJvV2FsbGV0UnBjKGNvbmZpZyk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgc3RhcnRXYWxsZXRScGNQcm9jZXNzKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNBcnJheShjb25maWcuY21kKSwgXCJNdXN0IHByb3ZpZGUgc3RyaW5nIGFycmF5IHdpdGggY29tbWFuZCBsaW5lIHBhcmFtZXRlcnNcIik7XG4gICAgXG4gICAgLy8gc3RhcnQgcHJvY2Vzc1xuICAgIGxldCBjaGlsZF9wcm9jZXNzID0gYXdhaXQgaW1wb3J0KFwiY2hpbGRfcHJvY2Vzc1wiKTtcbiAgICBjb25zdCBwcm9jZXNzID0gY2hpbGRfcHJvY2Vzcy5zcGF3bihjb25maWcuY21kWzBdLCBjb25maWcuY21kLnNsaWNlKDEpLCB7fSk7XG4gICAgcHJvY2Vzcy5zdGRvdXQuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBwcm9jZXNzLnN0ZGVyci5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIG1vbmVyby13YWxsZXQtcnBjXG4gICAgbGV0IHVyaTtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgbGV0IG91dHB1dCA9IFwiXCI7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgXG4gICAgICAvLyBoYW5kbGUgc3Rkb3V0XG4gICAgICBwcm9jZXNzLnN0ZG91dC5vbignZGF0YScsIGFzeW5jIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgbGV0IGxpbmUgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5sb2coMiwgbGluZSk7XG4gICAgICAgIG91dHB1dCArPSBsaW5lICsgJ1xcbic7IC8vIGNhcHR1cmUgb3V0cHV0IGluIGNhc2Ugb2YgZXJyb3JcbiAgICAgICAgXG4gICAgICAgIC8vIGV4dHJhY3QgdXJpIGZyb20gZS5nLiBcIkkgQmluZGluZyBvbiAxMjcuMC4wLjEgKElQdjQpOjM4MDg1XCJcbiAgICAgICAgbGV0IHVyaUxpbmVDb250YWlucyA9IFwiQmluZGluZyBvbiBcIjtcbiAgICAgICAgbGV0IHVyaUxpbmVDb250YWluc0lkeCA9IGxpbmUuaW5kZXhPZih1cmlMaW5lQ29udGFpbnMpO1xuICAgICAgICBpZiAodXJpTGluZUNvbnRhaW5zSWR4ID49IDApIHtcbiAgICAgICAgICBsZXQgaG9zdCA9IGxpbmUuc3Vic3RyaW5nKHVyaUxpbmVDb250YWluc0lkeCArIHVyaUxpbmVDb250YWlucy5sZW5ndGgsIGxpbmUubGFzdEluZGV4T2YoJyAnKSk7XG4gICAgICAgICAgbGV0IHVuZm9ybWF0dGVkTGluZSA9IGxpbmUucmVwbGFjZSgvXFx1MDAxYlxcWy4qP20vZywgJycpLnRyaW0oKTsgLy8gcmVtb3ZlIGNvbG9yIGZvcm1hdHRpbmdcbiAgICAgICAgICBsZXQgcG9ydCA9IHVuZm9ybWF0dGVkTGluZS5zdWJzdHJpbmcodW5mb3JtYXR0ZWRMaW5lLmxhc3RJbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICBsZXQgc3NsSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtc3NsXCIpO1xuICAgICAgICAgIGxldCBzc2xFbmFibGVkID0gc3NsSWR4ID49IDAgPyBcImVuYWJsZWRcIiA9PSBjb25maWcuY21kW3NzbElkeCArIDFdLnRvTG93ZXJDYXNlKCkgOiBmYWxzZTtcbiAgICAgICAgICB1cmkgPSAoc3NsRW5hYmxlZCA/IFwiaHR0cHNcIiA6IFwiaHR0cFwiKSArIFwiOi8vXCIgKyBob3N0ICsgXCI6XCIgKyBwb3J0O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyByZWFkIHN1Y2Nlc3MgbWVzc2FnZVxuICAgICAgICBpZiAobGluZS5pbmRleE9mKFwiU3RhcnRpbmcgd2FsbGV0IFJQQyBzZXJ2ZXJcIikgPj0gMCkge1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIGdldCB1c2VybmFtZSBhbmQgcGFzc3dvcmQgZnJvbSBwYXJhbXNcbiAgICAgICAgICBsZXQgdXNlclBhc3NJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXJwYy1sb2dpblwiKTtcbiAgICAgICAgICBsZXQgdXNlclBhc3MgPSB1c2VyUGFzc0lkeCA+PSAwID8gY29uZmlnLmNtZFt1c2VyUGFzc0lkeCArIDFdIDogdW5kZWZpbmVkO1xuICAgICAgICAgIGxldCB1c2VybmFtZSA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcoMCwgdXNlclBhc3MuaW5kZXhPZignOicpKTtcbiAgICAgICAgICBsZXQgcGFzc3dvcmQgPSB1c2VyUGFzcyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdXNlclBhc3Muc3Vic3RyaW5nKHVzZXJQYXNzLmluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIGNyZWF0ZSBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3NcbiAgICAgICAgICBjb25maWcgPSBjb25maWcuY29weSgpLnNldFNlcnZlcih7dXJpOiB1cmksIHVzZXJuYW1lOiB1c2VybmFtZSwgcGFzc3dvcmQ6IHBhc3N3b3JkLCByZWplY3RVbmF1dGhvcml6ZWQ6IGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZH0pO1xuICAgICAgICAgIGNvbmZpZy5jbWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgbGV0IHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldFJwYy5jb25uZWN0VG9XYWxsZXRScGMoY29uZmlnKTtcbiAgICAgICAgICB3YWxsZXQucHJvY2VzcyA9IHByb2Nlc3M7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVzb2x2ZSBwcm9taXNlIHdpdGggY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzIFxuICAgICAgICAgIHRoaXMuaXNSZXNvbHZlZCA9IHRydWU7XG4gICAgICAgICAgcmVzb2x2ZSh3YWxsZXQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gaGFuZGxlIHN0ZGVyclxuICAgICAgcHJvY2Vzcy5zdGRlcnIub24oJ2RhdGEnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBjb25zb2xlLmVycm9yKGRhdGEpO1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIGhhbmRsZSBleGl0XG4gICAgICBwcm9jZXNzLm9uKFwiZXhpdFwiLCBmdW5jdGlvbihjb2RlKSB7XG4gICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgcHJvY2VzcyB0ZXJtaW5hdGVkIHdpdGggZXhpdCBjb2RlIFwiICsgY29kZSArIChvdXRwdXQgPyBcIjpcXG5cXG5cIiArIG91dHB1dCA6IFwiXCIpKSk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gaGFuZGxlIGVycm9yXG4gICAgICBwcm9jZXNzLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGlmIChlcnIubWVzc2FnZS5pbmRleE9mKFwiRU5PRU5UXCIpID49IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBleGlzdCBhdCBwYXRoICdcIiArIGNvbmZpZy5jbWRbMF0gKyBcIidcIikpO1xuICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gaGFuZGxlIHVuY2F1Z2h0IGV4Y2VwdGlvblxuICAgICAgcHJvY2Vzcy5vbihcInVuY2F1Z2h0RXhjZXB0aW9uXCIsIGZ1bmN0aW9uKGVyciwgb3JpZ2luKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmNhdWdodCBleGNlcHRpb24gaW4gbW9uZXJvLXdhbGxldC1ycGMgcHJvY2VzczogXCIgKyBlcnIubWVzc2FnZSk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3Iob3JpZ2luKTtcbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNsZWFyKCkge1xuICAgIHRoaXMubGlzdGVuZXJzLnNwbGljZSgwLCB0aGlzLmxpc3RlbmVycy5sZW5ndGgpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICAgIGRlbGV0ZSB0aGlzLmFkZHJlc3NDYWNoZTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIHRoaXMucGF0aCA9IHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldEFjY291bnRJbmRpY2VzKGdldFN1YmFkZHJlc3NJbmRpY2VzPzogYW55KSB7XG4gICAgbGV0IGluZGljZXMgPSBuZXcgTWFwKCk7XG4gICAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCB0aGlzLmdldEFjY291bnRzKCkpIHtcbiAgICAgIGluZGljZXMuc2V0KGFjY291bnQuZ2V0SW5kZXgoKSwgZ2V0U3ViYWRkcmVzc0luZGljZXMgPyBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NJbmRpY2VzKGFjY291bnQuZ2V0SW5kZXgoKSkgOiB1bmRlZmluZWQpO1xuICAgIH1cbiAgICByZXR1cm4gaW5kaWNlcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldFN1YmFkZHJlc3NJbmRpY2VzKGFjY291bnRJZHgpIHtcbiAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzXCIsIHthY2NvdW50X2luZGV4OiBhY2NvdW50SWR4fSk7XG4gICAgZm9yIChsZXQgYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5hZGRyZXNzZXMpIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goYWRkcmVzcy5hZGRyZXNzX2luZGV4KTtcbiAgICByZXR1cm4gc3ViYWRkcmVzc0luZGljZXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRUcmFuc2ZlcnNBdXgocXVlcnk6IE1vbmVyb1RyYW5zZmVyUXVlcnkpIHtcbiAgICBcbiAgICAvLyBidWlsZCBwYXJhbXMgZm9yIGdldF90cmFuc2ZlcnMgcnBjIGNhbGxcbiAgICBsZXQgdHhRdWVyeSA9IHF1ZXJ5LmdldFR4UXVlcnkoKTtcbiAgICBsZXQgY2FuQmVDb25maXJtZWQgPSB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJc1JlbGF5ZWQoKSAhPT0gZmFsc2U7XG4gICAgbGV0IGNhbkJlSW5UeFBvb2wgPSB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9PSBmYWxzZSAmJiB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCAmJiB0eFF1ZXJ5LmdldElzTG9ja2VkKCkgIT09IGZhbHNlO1xuICAgIGxldCBjYW5CZUluY29taW5nID0gcXVlcnkuZ2V0SXNJbmNvbWluZygpICE9PSBmYWxzZSAmJiBxdWVyeS5nZXRJc091dGdvaW5nKCkgIT09IHRydWUgJiYgcXVlcnkuZ2V0SGFzRGVzdGluYXRpb25zKCkgIT09IHRydWU7XG4gICAgbGV0IGNhbkJlT3V0Z29pbmcgPSBxdWVyeS5nZXRJc091dGdvaW5nKCkgIT09IGZhbHNlICYmIHF1ZXJ5LmdldElzSW5jb21pbmcoKSAhPT0gdHJ1ZTtcblxuICAgIC8vIGNoZWNrIGlmIGZldGNoaW5nIHBvb2wgdHhzIGNvbnRyYWRpY3RlZCBieSBjb25maWd1cmF0aW9uXG4gICAgaWYgKHR4UXVlcnkuZ2V0SW5UeFBvb2woKSA9PT0gdHJ1ZSAmJiAhY2FuQmVJblR4UG9vbCkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IGZldGNoIHBvb2wgdHJhbnNhY3Rpb25zIGJlY2F1c2UgaXQgY29udHJhZGljdHMgY29uZmlndXJhdGlvblwiKTtcbiAgICB9XG5cbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuaW4gPSBjYW5CZUluY29taW5nICYmIGNhbkJlQ29uZmlybWVkO1xuICAgIHBhcmFtcy5vdXQgPSBjYW5CZU91dGdvaW5nICYmIGNhbkJlQ29uZmlybWVkO1xuICAgIHBhcmFtcy5wb29sID0gY2FuQmVJbmNvbWluZyAmJiBjYW5CZUluVHhQb29sO1xuICAgIHBhcmFtcy5wZW5kaW5nID0gY2FuQmVPdXRnb2luZyAmJiBjYW5CZUluVHhQb29sO1xuICAgIHBhcmFtcy5mYWlsZWQgPSB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT0gdHJ1ZTtcbiAgICBpZiAodHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHhRdWVyeS5nZXRNaW5IZWlnaHQoKSA+IDApIHBhcmFtcy5taW5faGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAtIDE7IC8vIFRPRE8gbW9uZXJvLXByb2plY3Q6IHdhbGxldDI6OmdldF9wYXltZW50cygpIG1pbl9oZWlnaHQgaXMgZXhjbHVzaXZlLCBzbyBtYW51YWxseSBvZmZzZXQgdG8gbWF0Y2ggaW50ZW5kZWQgcmFuZ2UgKGlzc3VlcyAjNTc1MSwgIzU1OTgpXG4gICAgICBlbHNlIHBhcmFtcy5taW5faGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKTtcbiAgICB9XG4gICAgaWYgKHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgcGFyYW1zLm1heF9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1heEhlaWdodCgpO1xuICAgIHBhcmFtcy5maWx0ZXJfYnlfaGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAhPT0gdW5kZWZpbmVkIHx8IHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgIT09IHVuZGVmaW5lZDtcbiAgICBpZiAocXVlcnkuZ2V0QWNjb3VudEluZGV4KCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0KHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpID09PSB1bmRlZmluZWQgJiYgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkLCBcIlF1ZXJ5IHNwZWNpZmllcyBhIHN1YmFkZHJlc3MgaW5kZXggYnV0IG5vdCBhbiBhY2NvdW50IGluZGV4XCIpO1xuICAgICAgcGFyYW1zLmFsbF9hY2NvdW50cyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gcXVlcnkuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgICBcbiAgICAgIC8vIHNldCBzdWJhZGRyZXNzIGluZGljZXMgcGFyYW1cbiAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IG5ldyBTZXQoKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAhPT0gdW5kZWZpbmVkKSBzdWJhZGRyZXNzSW5kaWNlcy5hZGQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5tYXAoc3ViYWRkcmVzc0lkeCA9PiBzdWJhZGRyZXNzSW5kaWNlcy5hZGQoc3ViYWRkcmVzc0lkeCkpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJbmRpY2VzLnNpemUpIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBBcnJheS5mcm9tKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgdW5pcXVlIHR4cyBhbmQgYmxvY2tzXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgXG4gICAgLy8gYnVpbGQgdHhzIHVzaW5nIGBnZXRfdHJhbnNmZXJzYFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3RyYW5zZmVyc1wiLCBwYXJhbXMpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhyZXNwLnJlc3VsdCkpIHtcbiAgICAgIGZvciAobGV0IHJwY1R4IG9mIHJlc3AucmVzdWx0W2tleV0pIHtcbiAgICAgICAgLy9pZiAocnBjVHgudHhpZCA9PT0gcXVlcnkuZGVidWdUeElkKSBjb25zb2xlLmxvZyhycGNUeCk7XG4gICAgICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHgpO1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkgYXNzZXJ0KHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCkgPiAtMSk7XG4gICAgICAgIFxuICAgICAgICAvLyByZXBsYWNlIHRyYW5zZmVyIGFtb3VudCB3aXRoIGRlc3RpbmF0aW9uIHN1bVxuICAgICAgICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBjb25maXJtZWQgdHggZnJvbS90byBzYW1lIGFjY291bnQgaGFzIGFtb3VudCAwIGJ1dCBjYWNoZWQgdHJhbnNmZXJzXG4gICAgICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRJc1JlbGF5ZWQoKSAmJiAhdHguZ2V0SXNGYWlsZWQoKSAmJlxuICAgICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpICYmIHR4LmdldE91dGdvaW5nQW1vdW50KCkgPT09IDBuKSB7XG4gICAgICAgICAgbGV0IG91dGdvaW5nVHJhbnNmZXIgPSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgICAgICAgbGV0IHRyYW5zZmVyVG90YWwgPSBCaWdJbnQoMCk7XG4gICAgICAgICAgZm9yIChsZXQgZGVzdGluYXRpb24gb2Ygb3V0Z29pbmdUcmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKSkgdHJhbnNmZXJUb3RhbCA9IHRyYW5zZmVyVG90YWwgKyBkZXN0aW5hdGlvbi5nZXRBbW91bnQoKTtcbiAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0QW1vdW50KHRyYW5zZmVyVG90YWwpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBtZXJnZSB0eFxuICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc29ydCB0eHMgYnkgYmxvY2sgaGVpZ2h0XG4gICAgbGV0IHR4czogTW9uZXJvVHhXYWxsZXRbXSA9IE9iamVjdC52YWx1ZXModHhNYXApO1xuICAgIHR4cy5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQpO1xuICAgIFxuICAgIC8vIGZpbHRlciBhbmQgcmV0dXJuIHRyYW5zZmVyc1xuICAgIGxldCB0cmFuc2ZlcnMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIFxuICAgICAgLy8gdHggaXMgbm90IGluY29taW5nL291dGdvaW5nIHVubGVzcyBhbHJlYWR5IHNldFxuICAgICAgaWYgKHR4LmdldElzSW5jb21pbmcoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0luY29taW5nKGZhbHNlKTtcbiAgICAgIGlmICh0eC5nZXRJc091dGdvaW5nKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNPdXRnb2luZyhmYWxzZSk7XG4gICAgICBcbiAgICAgIC8vIHNvcnQgaW5jb21pbmcgdHJhbnNmZXJzXG4gICAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVJbmNvbWluZ1RyYW5zZmVycyk7XG4gICAgICBcbiAgICAgIC8vIGNvbGxlY3QgcXVlcmllZCB0cmFuc2ZlcnMsIGVyYXNlIGlmIGV4Y2x1ZGVkXG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5maWx0ZXJUcmFuc2ZlcnMocXVlcnkpKSB7XG4gICAgICAgIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcmVtb3ZlIHR4cyB3aXRob3V0IHJlcXVlc3RlZCB0cmFuc2ZlclxuICAgICAgaWYgKHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT09IHVuZGVmaW5lZCAmJiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRPdXRwdXRzQXV4KHF1ZXJ5KSB7XG4gICAgXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBiZSBxdWVyaWVkXG4gICAgbGV0IGluZGljZXMgPSBuZXcgTWFwKCk7XG4gICAgaWYgKHF1ZXJ5LmdldEFjY291bnRJbmRleCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IG5ldyBTZXQoKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAhPT0gdW5kZWZpbmVkKSBzdWJhZGRyZXNzSW5kaWNlcy5hZGQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5tYXAoc3ViYWRkcmVzc0lkeCA9PiBzdWJhZGRyZXNzSW5kaWNlcy5hZGQoc3ViYWRkcmVzc0lkeCkpO1xuICAgICAgaW5kaWNlcy5zZXQocXVlcnkuZ2V0QWNjb3VudEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzLnNpemUgPyBBcnJheS5mcm9tKHN1YmFkZHJlc3NJbmRpY2VzKSA6IHVuZGVmaW5lZCk7ICAvLyB1bmRlZmluZWQgd2lsbCBmZXRjaCBmcm9tIGFsbCBzdWJhZGRyZXNzZXNcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXJ0LmVxdWFsKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpLCB1bmRlZmluZWQsIFwiUXVlcnkgc3BlY2lmaWVzIGEgc3ViYWRkcmVzcyBpbmRleCBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIilcbiAgICAgIGFzc2VydChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQgfHwgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDAsIFwiUXVlcnkgc3BlY2lmaWVzIHN1YmFkZHJlc3MgaW5kaWNlcyBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIik7XG4gICAgICBpbmRpY2VzID0gYXdhaXQgdGhpcy5nZXRBY2NvdW50SW5kaWNlcygpOyAgLy8gZmV0Y2ggYWxsIGFjY291bnQgaW5kaWNlcyB3aXRob3V0IHN1YmFkZHJlc3Nlc1xuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB1bmlxdWUgdHhzIGFuZCBibG9ja3NcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHR4cyB3aXRoIG91dHB1dHMgZm9yIGVhY2ggaW5kaWNhdGVkIGFjY291bnQgdXNpbmcgYGluY29taW5nX3RyYW5zZmVyc2AgcnBjIGNhbGxcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMudHJhbnNmZXJfdHlwZSA9IHF1ZXJ5LmdldElzU3BlbnQoKSA9PT0gdHJ1ZSA/IFwidW5hdmFpbGFibGVcIiA6IHF1ZXJ5LmdldElzU3BlbnQoKSA9PT0gZmFsc2UgPyBcImF2YWlsYWJsZVwiIDogXCJhbGxcIjtcbiAgICBwYXJhbXMudmVyYm9zZSA9IHRydWU7XG4gICAgZm9yIChsZXQgYWNjb3VudElkeCBvZiBpbmRpY2VzLmtleXMoKSkge1xuICAgIFxuICAgICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gaW5kaWNlcy5nZXQoYWNjb3VudElkeCk7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImluY29taW5nX3RyYW5zZmVyc1wiLCBwYXJhbXMpO1xuICAgICAgXG4gICAgICAvLyBjb252ZXJ0IHJlc3BvbnNlIHRvIHR4cyB3aXRoIG91dHB1dHMgYW5kIG1lcmdlXG4gICAgICBpZiAocmVzcC5yZXN1bHQudHJhbnNmZXJzID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuICAgICAgZm9yIChsZXQgcnBjT3V0cHV0IG9mIHJlc3AucmVzdWx0LnRyYW5zZmVycykge1xuICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2FsbGV0V2l0aE91dHB1dChycGNPdXRwdXQpO1xuICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc29ydCB0eHMgYnkgYmxvY2sgaGVpZ2h0XG4gICAgbGV0IHR4czogTW9uZXJvVHhXYWxsZXRbXSA9IE9iamVjdC52YWx1ZXModHhNYXApO1xuICAgIHR4cy5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQpO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgcXVlcmllZCBvdXRwdXRzXG4gICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIFxuICAgICAgLy8gc29ydCBvdXRwdXRzXG4gICAgICBpZiAodHguZ2V0T3V0cHV0cygpICE9PSB1bmRlZmluZWQpIHR4LmdldE91dHB1dHMoKS5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlT3V0cHV0cyk7XG4gICAgICBcbiAgICAgIC8vIGNvbGxlY3QgcXVlcmllZCBvdXRwdXRzLCBlcmFzZSBpZiBleGNsdWRlZFxuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmZpbHRlck91dHB1dHMocXVlcnkpKSBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICAgIFxuICAgICAgLy8gcmVtb3ZlIGV4Y2x1ZGVkIHR4cyBmcm9tIGJsb2NrXG4gICAgICBpZiAodHguZ2V0T3V0cHV0cygpID09PSB1bmRlZmluZWQgJiYgdHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbW1vbiBtZXRob2QgdG8gZ2V0IGtleSBpbWFnZXMuXG4gICAqIFxuICAgKiBAcGFyYW0gYWxsIC0gcGVjaWZpZXMgdG8gZ2V0IGFsbCB4b3Igb25seSBuZXcgaW1hZ2VzIGZyb20gbGFzdCBpbXBvcnRcbiAgICogQHJldHVybiB7TW9uZXJvS2V5SW1hZ2VbXX0gYXJlIHRoZSBrZXkgaW1hZ2VzXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgcnBjRXhwb3J0S2V5SW1hZ2VzKGFsbCkge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X2tleV9pbWFnZXNcIiwge2FsbDogYWxsfSk7XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5zaWduZWRfa2V5X2ltYWdlcykgcmV0dXJuIFtdO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduZWRfa2V5X2ltYWdlcy5tYXAocnBjSW1hZ2UgPT4gbmV3IE1vbmVyb0tleUltYWdlKHJwY0ltYWdlLmtleV9pbWFnZSwgcnBjSW1hZ2Uuc2lnbmF0dXJlKSk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBycGNTd2VlcEFjY291bnQoY29uZmlnKSB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGFuIGFjY291bnQgaW5kZXggdG8gc3dlZXAgZnJvbVwiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCAhPSAxKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZXhhY3RseSBvbmUgZGVzdGluYXRpb24gdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGRlc3RpbmF0aW9uIGFkZHJlc3MgdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBhbW91bnQgaW4gc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0S2V5SW1hZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJLZXkgaW1hZ2UgZGVmaW5lZDsgdXNlIHN3ZWVwT3V0cHV0KCkgdG8gc3dlZXAgYW4gb3V0cHV0IGJ5IGl0cyBrZXkgaW1hZ2VcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJFbXB0eSBsaXN0IGdpdmVuIGZvciBzdWJhZGRyZXNzZXMgaW5kaWNlcyB0byBzd2VlcFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyB3aXRoIFJQQyBgc3dlZXBfYWxsYFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN3ZWVwaW5nIG91dHB1dCBkb2VzIG5vdCBzdXBwb3J0IHN1YnRyYWN0aW5nIGZlZXMgZnJvbSBkZXN0aW5hdGlvbnNcIik7XG4gICAgXG4gICAgLy8gc3dlZXAgZnJvbSBhbGwgc3ViYWRkcmVzc2VzIGlmIG5vdCBvdGhlcndpc2UgZGVmaW5lZFxuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25maWcuc2V0U3ViYWRkcmVzc0luZGljZXMoW10pO1xuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3Nlcyhjb25maWcuZ2V0QWNjb3VudEluZGV4KCkpKSB7XG4gICAgICAgIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gc3ViYWRkcmVzc2VzIHRvIHN3ZWVwIGZyb21cIik7XG4gICAgXG4gICAgLy8gY29tbW9uIGNvbmZpZyBwYXJhbXNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBsZXQgcmVsYXkgPSBjb25maWcuZ2V0UmVsYXkoKSA9PT0gdHJ1ZTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCk7XG4gICAgcGFyYW1zLmFkZHJlc3MgPSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpO1xuICAgIGFzc2VydChjb25maWcuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnLmdldFByaW9yaXR5KCk7XG4gICAgaWYgKGNvbmZpZy5nZXRVbmxvY2tUaW1lKCkgIT09IHVuZGVmaW5lZCkgcGFyYW1zLnVubG9ja190aW1lID0gY29uZmlnLmdldFVubG9ja1RpbWUoKTtcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZy5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gIXJlbGF5O1xuICAgIHBhcmFtcy5iZWxvd19hbW91bnQgPSBjb25maWcuZ2V0QmVsb3dBbW91bnQoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2tleXMgPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBpbnZva2Ugd2FsbGV0IHJwYyBgc3dlZXBfYWxsYFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfYWxsXCIsIHBhcmFtcyk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGZyb20gcmVzcG9uc2VcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCwgdW5kZWZpbmVkLCBjb25maWcpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgcmVtYWluaW5nIGtub3duIGZpZWxkc1xuICAgIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB7XG4gICAgICB0eC5zZXRJc0xvY2tlZCh0cnVlKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICB0eC5zZXRSZWxheShyZWxheSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChyZWxheSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQocmVsYXkpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIGxldCB0cmFuc2ZlciA9IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKTtcbiAgICAgIHRyYW5zZmVyLnNldEFjY291bnRJbmRleChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkpO1xuICAgICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSkgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkpO1xuICAgICAgbGV0IGRlc3RpbmF0aW9uID0gbmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksIEJpZ0ludCh0cmFuc2Zlci5nZXRBbW91bnQoKSkpO1xuICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKFtkZXN0aW5hdGlvbl0pO1xuICAgICAgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgICB0eC5zZXRQYXltZW50SWQoY29uZmlnLmdldFBheW1lbnRJZCgpKTtcbiAgICAgIGlmICh0eC5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0VW5sb2NrVGltZShjb25maWcuZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQgPyAwIDogY29uZmlnLmdldFVubG9ja1RpbWUoKSk7XG4gICAgICBpZiAodHguZ2V0UmVsYXkoKSkge1xuICAgICAgICBpZiAodHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgrbmV3IERhdGUoKS5nZXRUaW1lKCkpOyAgLy8gVE9ETyAobW9uZXJvLXdhbGxldC1ycGMpOiBwcm92aWRlIHRpbWVzdGFtcCBvbiByZXNwb25zZTsgdW5jb25maXJtZWQgdGltZXN0YW1wcyB2YXJ5XG4gICAgICAgIGlmICh0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbigpID09PSB1bmRlZmluZWQpIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0LmdldFR4cygpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgPT0gdW5kZWZpbmVkICYmIHRoaXMubGlzdGVuZXJzLmxlbmd0aCkgdGhpcy53YWxsZXRQb2xsZXIgPSBuZXcgV2FsbGV0UG9sbGVyKHRoaXMpO1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkKSB0aGlzLndhbGxldFBvbGxlci5zZXRJc1BvbGxpbmcodGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQb2xsIGlmIGxpc3RlbmluZy5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBwb2xsKCkge1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2FsbGV0UG9sbGVyLmlzUG9sbGluZykgYXdhaXQgdGhpcy53YWxsZXRQb2xsZXIucG9sbCgpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgU1RBVElDIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVDb25maWcodXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogTW9uZXJvV2FsbGV0Q29uZmlnIHtcbiAgICBsZXQgY29uZmlnOiB1bmRlZmluZWQgfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gPSB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbmZpZyA9PT0gXCJzdHJpbmdcIiB8fCAodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPikudXJpKSBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHtzZXJ2ZXI6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29uZmlnIGFzIHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4sIHVzZXJuYW1lLCBwYXNzd29yZCl9KTtcbiAgICBlbHNlIGlmIChHZW5VdGlscy5pc0FycmF5KHVyaU9yQ29uZmlnKSkgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh7Y21kOiB1cmlPckNvbmZpZyBhcyBzdHJpbmdbXX0pO1xuICAgIGVsc2UgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pO1xuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlciA9PT0gdW5kZWZpbmVkKSBjb25maWcucHJveHlUb1dvcmtlciA9IHRydWU7XG4gICAgcmV0dXJuIGNvbmZpZyBhcyBNb25lcm9XYWxsZXRDb25maWc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZW1vdmUgY3JpdGVyaWEgd2hpY2ggcmVxdWlyZXMgbG9va2luZyB1cCBvdGhlciB0cmFuc2ZlcnMvb3V0cHV0cyB0b1xuICAgKiBmdWxmaWxsIHF1ZXJ5LlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBxdWVyeSAtIHRoZSBxdWVyeSB0byBkZWNvbnRleHR1YWxpemVcbiAgICogQHJldHVybiB7TW9uZXJvVHhRdWVyeX0gYSByZWZlcmVuY2UgdG8gdGhlIHF1ZXJ5IGZvciBjb252ZW5pZW5jZVxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBkZWNvbnRleHR1YWxpemUocXVlcnkpIHtcbiAgICBxdWVyeS5zZXRJc0luY29taW5nKHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0SXNPdXRnb2luZyh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldFRyYW5zZmVyUXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRJbnB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0T3V0cHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gcXVlcnk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgaXNDb250ZXh0dWFsKHF1ZXJ5KSB7XG4gICAgaWYgKCFxdWVyeSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghcXVlcnkuZ2V0VHhRdWVyeSgpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRJc0luY29taW5nKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7IC8vIHJlcXVpcmVzIGdldHRpbmcgb3RoZXIgdHJhbnNmZXJzXG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRJc091dGdvaW5nKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKHF1ZXJ5IGluc3RhbmNlb2YgTW9uZXJvVHJhbnNmZXJRdWVyeSkge1xuICAgICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRPdXRwdXRRdWVyeSgpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIG91dHB1dHNcbiAgICB9IGVsc2UgaWYgKHF1ZXJ5IGluc3RhbmNlb2YgTW9uZXJvT3V0cHV0UXVlcnkpIHtcbiAgICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0VHJhbnNmZXJRdWVyeSgpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIHRyYW5zZmVyc1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJxdWVyeSBtdXN0IGJlIHR4IG9yIHRyYW5zZmVyIHF1ZXJ5XCIpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0FjY291bnQocnBjQWNjb3VudCkge1xuICAgIGxldCBhY2NvdW50ID0gbmV3IE1vbmVyb0FjY291bnQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQWNjb3VudCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNBY2NvdW50W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFjY291bnRfaW5kZXhcIikgYWNjb3VudC5zZXRJbmRleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhbGFuY2VcIikgYWNjb3VudC5zZXRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZF9iYWxhbmNlXCIpIGFjY291bnQuc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYXNlX2FkZHJlc3NcIikgYWNjb3VudC5zZXRQcmltYXJ5QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhZ1wiKSBhY2NvdW50LnNldFRhZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhYmVsXCIpIHsgfSAvLyBsYWJlbCBiZWxvbmdzIHRvIGZpcnN0IHN1YmFkZHJlc3NcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGFjY291bnQgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgaWYgKFwiXCIgPT09IGFjY291bnQuZ2V0VGFnKCkpIGFjY291bnQuc2V0VGFnKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIGFjY291bnQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcykge1xuICAgIGxldCBzdWJhZGRyZXNzID0gbmV3IE1vbmVyb1N1YmFkZHJlc3MoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjU3ViYWRkcmVzcykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNTdWJhZGRyZXNzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFjY291bnRfaW5kZXhcIikgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzX2luZGV4XCIpIHN1YmFkZHJlc3Muc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzXCIpIHN1YmFkZHJlc3Muc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhbGFuY2VcIikgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZF9iYWxhbmNlXCIpIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fdW5zcGVudF9vdXRwdXRzXCIpIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYWJlbFwiKSB7IGlmICh2YWwpIHN1YmFkZHJlc3Muc2V0TGFiZWwodmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVzZWRcIikgc3ViYWRkcmVzcy5zZXRJc1VzZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja3NfdG9fdW5sb2NrXCIpIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2sodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PSBcInRpbWVfdG9fdW5sb2NrXCIpIHt9ICAvLyBpZ25vcmluZ1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgc3ViYWRkcmVzcyBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gc3ViYWRkcmVzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgc2VudCB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIFRPRE86IHJlbW92ZSBjb3B5RGVzdGluYXRpb25zIGFmdGVyID4xOC4zLjEgd2hlbiBzdWJ0cmFjdEZlZUZyb20gZnVsbHkgc3VwcG9ydGVkXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4Q29uZmlnfSBjb25maWcgLSBzZW5kIGNvbmZpZ1xuICAgKiBAcGFyYW0ge01vbmVyb1R4V2FsbGV0fSBbdHhdIC0gZXhpc3RpbmcgdHJhbnNhY3Rpb24gdG8gaW5pdGlhbGl6ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gY29weURlc3RpbmF0aW9ucyAtIGNvcGllcyBjb25maWcgZGVzdGluYXRpb25zIGlmIHRydWVcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IGlzIHRoZSBpbml0aWFsaXplZCBzZW5kIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGluaXRTZW50VHhXYWxsZXQoY29uZmlnLCB0eCwgY29weURlc3RpbmF0aW9ucykge1xuICAgIGlmICghdHgpIHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgbGV0IHJlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgPT09IHRydWU7XG4gICAgdHguc2V0SXNPdXRnb2luZyh0cnVlKTtcbiAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICB0eC5zZXRJblR4UG9vbChyZWxheSk7XG4gICAgdHguc2V0UmVsYXkocmVsYXkpO1xuICAgIHR4LnNldElzUmVsYXllZChyZWxheSk7XG4gICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgdHguc2V0SXNMb2NrZWQodHJ1ZSk7XG4gICAgdHguc2V0UmluZ1NpemUoTW9uZXJvVXRpbHMuUklOR19TSVpFKTtcbiAgICBsZXQgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpO1xuICAgIHRyYW5zZmVyLnNldFR4KHR4KTtcbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAxKSB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kaWNlcyhjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5zbGljZSgwKSk7IC8vIHdlIGtub3cgc3JjIHN1YmFkZHJlc3MgaW5kaWNlcyBpZmYgY29uZmlnIHNwZWNpZmllcyAxXG4gICAgaWYgKGNvcHlEZXN0aW5hdGlvbnMpIHtcbiAgICAgIGxldCBkZXN0Q29waWVzID0gW107XG4gICAgICBmb3IgKGxldCBkZXN0IG9mIGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSkgZGVzdENvcGllcy5wdXNoKGRlc3QuY29weSgpKTtcbiAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhkZXN0Q29waWVzKTtcbiAgICB9XG4gICAgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgdHguc2V0UGF5bWVudElkKGNvbmZpZy5nZXRQYXltZW50SWQoKSk7XG4gICAgaWYgKHR4LmdldFVubG9ja1RpbWUoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRVbmxvY2tUaW1lKGNvbmZpZy5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCA/IDAgOiBjb25maWcuZ2V0VW5sb2NrVGltZSgpKTtcbiAgICBpZiAoY29uZmlnLmdldFJlbGF5KCkpIHtcbiAgICAgIGlmICh0eC5nZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgpID09PSB1bmRlZmluZWQpIHR4LnNldExhc3RSZWxheWVkVGltZXN0YW1wKCtuZXcgRGF0ZSgpLmdldFRpbWUoKSk7ICAvLyBUT0RPIChtb25lcm8td2FsbGV0LXJwYyk6IHByb3ZpZGUgdGltZXN0YW1wIG9uIHJlc3BvbnNlOyB1bmNvbmZpcm1lZCB0aW1lc3RhbXBzIHZhcnlcbiAgICAgIGlmICh0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbigpID09PSB1bmRlZmluZWQpIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKGZhbHNlKTtcbiAgICB9XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSB0eCBzZXQgZnJvbSBhIFJQQyBtYXAgZXhjbHVkaW5nIHR4cy5cbiAgICogXG4gICAqIEBwYXJhbSBycGNNYXAgLSBtYXAgdG8gaW5pdGlhbGl6ZSB0aGUgdHggc2V0IGZyb21cbiAgICogQHJldHVybiBNb25lcm9UeFNldCAtIGluaXRpYWxpemVkIHR4IHNldFxuICAgKiBAcmV0dXJuIHRoZSByZXN1bHRpbmcgdHggc2V0XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFNldChycGNNYXApIHtcbiAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoKTtcbiAgICB0eFNldC5zZXRNdWx0aXNpZ1R4SGV4KHJwY01hcC5tdWx0aXNpZ190eHNldCk7XG4gICAgdHhTZXQuc2V0VW5zaWduZWRUeEhleChycGNNYXAudW5zaWduZWRfdHhzZXQpO1xuICAgIHR4U2V0LnNldFNpZ25lZFR4SGV4KHJwY01hcC5zaWduZWRfdHhzZXQpO1xuICAgIGlmICh0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KCkubGVuZ3RoID09PSAwKSB0eFNldC5zZXRNdWx0aXNpZ1R4SGV4KHVuZGVmaW5lZCk7XG4gICAgaWYgKHR4U2V0LmdldFVuc2lnbmVkVHhIZXgoKSAhPT0gdW5kZWZpbmVkICYmIHR4U2V0LmdldFVuc2lnbmVkVHhIZXgoKS5sZW5ndGggPT09IDApIHR4U2V0LnNldFVuc2lnbmVkVHhIZXgodW5kZWZpbmVkKTtcbiAgICBpZiAodHhTZXQuZ2V0U2lnbmVkVHhIZXgoKSAhPT0gdW5kZWZpbmVkICYmIHR4U2V0LmdldFNpZ25lZFR4SGV4KCkubGVuZ3RoID09PSAwKSB0eFNldC5zZXRTaWduZWRUeEhleCh1bmRlZmluZWQpO1xuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgTW9uZXJvVHhTZXQgZnJvbSBhIGxpc3Qgb2YgcnBjIHR4cy5cbiAgICogXG4gICAqIEBwYXJhbSBycGNUeHMgLSBycGMgdHhzIHRvIGluaXRpYWxpemUgdGhlIHNldCBmcm9tXG4gICAqIEBwYXJhbSB0eHMgLSBleGlzdGluZyB0eHMgdG8gZnVydGhlciBpbml0aWFsaXplIChvcHRpb25hbClcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHRoZSBjb252ZXJ0ZWQgdHggc2V0XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTZW50VHhzVG9UeFNldChycGNUeHM6IGFueSwgdHhzPzogYW55LCBjb25maWc/OiBhbnkpIHtcbiAgICBcbiAgICAvLyBidWlsZCBzaGFyZWQgdHggc2V0XG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFNldChycGNUeHMpO1xuXG4gICAgLy8gZ2V0IG51bWJlciBvZiB0eHNcbiAgICBsZXQgbnVtVHhzID0gcnBjVHhzLmZlZV9saXN0ID8gcnBjVHhzLmZlZV9saXN0Lmxlbmd0aCA6IHJwY1R4cy50eF9oYXNoX2xpc3QgPyBycGNUeHMudHhfaGFzaF9saXN0Lmxlbmd0aCA6IDA7XG4gICAgXG4gICAgLy8gZG9uZSBpZiBycGMgcmVzcG9uc2UgY29udGFpbnMgbm8gdHhzXG4gICAgaWYgKG51bVR4cyA9PT0gMCkge1xuICAgICAgYXNzZXJ0LmVxdWFsKHR4cywgdW5kZWZpbmVkKTtcbiAgICAgIHJldHVybiB0eFNldDtcbiAgICB9XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eHMgaWYgbm9uZSBnaXZlblxuICAgIGlmICh0eHMpIHR4U2V0LnNldFR4cyh0eHMpO1xuICAgIGVsc2Uge1xuICAgICAgdHhzID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVR4czsgaSsrKSB0eHMucHVzaChuZXcgTW9uZXJvVHhXYWxsZXQoKSk7XG4gICAgfVxuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgdHguc2V0VHhTZXQodHhTZXQpO1xuICAgICAgdHguc2V0SXNPdXRnb2luZyh0cnVlKTtcbiAgICB9XG4gICAgdHhTZXQuc2V0VHhzKHR4cyk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eHMgZnJvbSBycGMgbGlzdHNcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVHhzKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1R4c1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJ0eF9oYXNoX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRIYXNoKHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfa2V5X2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRLZXkodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9ibG9iX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRGdWxsSGV4KHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfbWV0YWRhdGFfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldE1ldGFkYXRhKHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRGZWUoQmlnSW50KHZhbFtpXSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndlaWdodF9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0V2VpZ2h0KHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50X2xpc3RcIikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh0eHNbaV0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpID09IHVuZGVmaW5lZCkgdHhzW2ldLnNldE91dGdvaW5nVHJhbnNmZXIobmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eHNbaV0pKTtcbiAgICAgICAgICB0eHNbaV0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFtb3VudChCaWdJbnQodmFsW2ldKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtdWx0aXNpZ190eHNldFwiIHx8IGtleSA9PT0gXCJ1bnNpZ25lZF90eHNldFwiIHx8IGtleSA9PT0gXCJzaWduZWRfdHhzZXRcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGVudF9rZXlfaW1hZ2VzX2xpc3RcIikge1xuICAgICAgICBsZXQgaW5wdXRLZXlJbWFnZXNMaXN0ID0gdmFsO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0S2V5SW1hZ2VzTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUodHhzW2ldLmdldElucHV0cygpID09PSB1bmRlZmluZWQpO1xuICAgICAgICAgIHR4c1tpXS5zZXRJbnB1dHMoW10pO1xuICAgICAgICAgIGZvciAobGV0IGlucHV0S2V5SW1hZ2Ugb2YgaW5wdXRLZXlJbWFnZXNMaXN0W2ldW1wia2V5X2ltYWdlc1wiXSkge1xuICAgICAgICAgICAgdHhzW2ldLmdldElucHV0cygpLnB1c2gobmV3IE1vbmVyb091dHB1dFdhbGxldCgpLnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSgpLnNldEhleChpbnB1dEtleUltYWdlKSkuc2V0VHgodHhzW2ldKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50c19ieV9kZXN0X2xpc3RcIikge1xuICAgICAgICBsZXQgYW1vdW50c0J5RGVzdExpc3QgPSB2YWw7XG4gICAgICAgIGxldCBkZXN0aW5hdGlvbklkeCA9IDA7XG4gICAgICAgIGZvciAobGV0IHR4SWR4ID0gMDsgdHhJZHggPCBhbW91bnRzQnlEZXN0TGlzdC5sZW5ndGg7IHR4SWR4KyspIHtcbiAgICAgICAgICBsZXQgYW1vdW50c0J5RGVzdCA9IGFtb3VudHNCeURlc3RMaXN0W3R4SWR4XVtcImFtb3VudHNcIl07XG4gICAgICAgICAgaWYgKHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpID09PSB1bmRlZmluZWQpIHR4c1t0eElkeF0uc2V0T3V0Z29pbmdUcmFuc2ZlcihuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHR4c1t0eElkeF0pKTtcbiAgICAgICAgICB0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXREZXN0aW5hdGlvbnMoW10pO1xuICAgICAgICAgIGZvciAobGV0IGFtb3VudCBvZiBhbW91bnRzQnlEZXN0KSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCA9PT0gMSkgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudCkpKTsgLy8gc3dlZXBpbmcgY2FuIGNyZWF0ZSBtdWx0aXBsZSB0eHMgd2l0aCBvbmUgYWRkcmVzc1xuICAgICAgICAgICAgZWxzZSB0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKS5wdXNoKG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbZGVzdGluYXRpb25JZHgrK10uZ2V0QWRkcmVzcygpLCBCaWdJbnQoYW1vdW50KSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgdHJhbnNhY3Rpb24gZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydHMgYSBycGMgdHggd2l0aCBhIHRyYW5zZmVyIHRvIGEgdHggc2V0IHdpdGggYSB0eCBhbmQgdHJhbnNmZXIuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHggLSBycGMgdHggdG8gYnVpbGQgZnJvbVxuICAgKiBAcGFyYW0gdHggLSBleGlzdGluZyB0eCB0byBjb250aW51ZSBpbml0aWFsaXppbmcgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gaXNPdXRnb2luZyAtIHNwZWNpZmllcyBpZiB0aGUgdHggaXMgb3V0Z29pbmcgaWYgdHJ1ZSwgaW5jb21pbmcgaWYgZmFsc2UsIG9yIGRlY29kZXMgZnJvbSB0eXBlIGlmIHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4gdGhlIGluaXRpYWxpemVkIHR4IHNldCB3aXRoIGEgdHhcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4VG9UeFNldChycGNUeCwgdHgsIGlzT3V0Z29pbmcsIGNvbmZpZykge1xuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhTZXQocnBjVHgpO1xuICAgIHR4U2V0LnNldFR4cyhbTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlcihycGNUeCwgdHgsIGlzT3V0Z29pbmcsIGNvbmZpZykuc2V0VHhTZXQodHhTZXQpXSk7XG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogQnVpbGRzIGEgTW9uZXJvVHhXYWxsZXQgZnJvbSBhIFJQQyB0eC5cbiAgICogXG4gICAqIEBwYXJhbSBycGNUeCAtIHJwYyB0eCB0byBidWlsZCBmcm9tXG4gICAqIEBwYXJhbSB0eCAtIGV4aXN0aW5nIHR4IHRvIGNvbnRpbnVlIGluaXRpYWxpemluZyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBpc091dGdvaW5nIC0gc3BlY2lmaWVzIGlmIHRoZSB0eCBpcyBvdXRnb2luZyBpZiB0cnVlLCBpbmNvbWluZyBpZiBmYWxzZSwgb3IgZGVjb2RlcyBmcm9tIHR5cGUgaWYgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IGlzIHRoZSBpbml0aWFsaXplZCB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHg6IGFueSwgdHg/OiBhbnksIGlzT3V0Z29pbmc/OiBhbnksIGNvbmZpZz86IGFueSkgeyAgLy8gVE9ETzogY2hhbmdlIGV2ZXJ5dGhpbmcgdG8gc2FmZSBzZXRcbiAgICAgICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCB0byByZXR1cm5cbiAgICBpZiAoIXR4KSB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggc3RhdGUgZnJvbSBycGMgdHlwZVxuICAgIGlmIChycGNUeC50eXBlICE9PSB1bmRlZmluZWQpIGlzT3V0Z29pbmcgPSBNb25lcm9XYWxsZXRScGMuZGVjb2RlUnBjVHlwZShycGNUeC50eXBlLCB0eCk7XG4gICAgZWxzZSBhc3NlcnQuZXF1YWwodHlwZW9mIGlzT3V0Z29pbmcsIFwiYm9vbGVhblwiLCBcIk11c3QgaW5kaWNhdGUgaWYgdHggaXMgb3V0Z29pbmcgKHRydWUpIHhvciBpbmNvbWluZyAoZmFsc2UpIHNpbmNlIHVua25vd25cIik7XG4gICAgXG4gICAgLy8gVE9ETzogc2FmZSBzZXRcbiAgICAvLyBpbml0aWFsaXplIHJlbWFpbmluZyBmaWVsZHMgIFRPRE86IHNlZW1zIHRoaXMgc2hvdWxkIGJlIHBhcnQgb2YgY29tbW9uIGZ1bmN0aW9uIHdpdGggRGFlbW9uUnBjLmNvbnZlcnRScGNUeFxuICAgIGxldCBoZWFkZXI7XG4gICAgbGV0IHRyYW5zZmVyO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUeCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUeFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJ0eGlkXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVcIikgdHguc2V0RmVlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJub3RlXCIpIHsgaWYgKHZhbCkgdHguc2V0Tm90ZSh2YWwpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfa2V5XCIpIHR4LnNldEtleSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR5cGVcIikgeyB9IC8vIHR5cGUgYWxyZWFkeSBoYW5kbGVkXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfc2l6ZVwiKSB0eC5zZXRTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrX3RpbWVcIikgdHguc2V0VW5sb2NrVGltZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndlaWdodFwiKSB0eC5zZXRXZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsb2NrZWRcIikgdHguc2V0SXNMb2NrZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9ibG9iXCIpIHR4LnNldEZ1bGxIZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9tZXRhZGF0YVwiKSB0eC5zZXRNZXRhZGF0YSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRvdWJsZV9zcGVuZF9zZWVuXCIpIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfaGVpZ2h0XCIgfHwga2V5ID09PSBcImhlaWdodFwiKSB7XG4gICAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSB7XG4gICAgICAgICAgaWYgKCFoZWFkZXIpIGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgICAgICAgIGhlYWRlci5zZXRIZWlnaHQodmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRpbWVzdGFtcFwiKSB7XG4gICAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSB7XG4gICAgICAgICAgaWYgKCFoZWFkZXIpIGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgICAgICAgIGhlYWRlci5zZXRUaW1lc3RhbXAodmFsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyB0aW1lc3RhbXAgb2YgdW5jb25maXJtZWQgdHggaXMgY3VycmVudCByZXF1ZXN0IHRpbWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNvbmZpcm1hdGlvbnNcIikgdHguc2V0TnVtQ29uZmlybWF0aW9ucyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1Z2dlc3RlZF9jb25maXJtYXRpb25zX3RocmVzaG9sZFwiKSB7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgaWYgKCFpc091dGdvaW5nKSB0cmFuc2Zlci5zZXROdW1TdWdnZXN0ZWRDb25maXJtYXRpb25zKHZhbCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIHtcbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gKGlzT3V0Z29pbmcgPyBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpIDogbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKSkuc2V0VHgodHgpO1xuICAgICAgICB0cmFuc2Zlci5zZXRBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNcIikge30gIC8vIGlnbm9yaW5nLCBhbW91bnRzIHN1bSB0byBhbW91bnRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzXCIpIHtcbiAgICAgICAgaWYgKCFpc091dGdvaW5nKSB7XG4gICAgICAgICAgaWYgKCF0cmFuc2ZlcikgdHJhbnNmZXIgPSBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpLnNldFR4KHR4KTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRBZGRyZXNzKHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwYXltZW50X2lkXCIpIHtcbiAgICAgICAgaWYgKFwiXCIgIT09IHZhbCAmJiBNb25lcm9UeFdhbGxldC5ERUZBVUxUX1BBWU1FTlRfSUQgIT09IHZhbCkgdHguc2V0UGF5bWVudElkKHZhbCk7ICAvLyBkZWZhdWx0IGlzIHVuZGVmaW5lZFxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1YmFkZHJfaW5kZXhcIikgYXNzZXJ0KHJwY1R4LnN1YmFkZHJfaW5kaWNlcyk7ICAvLyBoYW5kbGVkIGJ5IHN1YmFkZHJfaW5kaWNlc1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1YmFkZHJfaW5kaWNlc1wiKSB7XG4gICAgICAgIGlmICghdHJhbnNmZXIpIHRyYW5zZmVyID0gKGlzT3V0Z29pbmcgPyBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpIDogbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKSkuc2V0VHgodHgpO1xuICAgICAgICBsZXQgcnBjSW5kaWNlcyA9IHZhbDtcbiAgICAgICAgdHJhbnNmZXIuc2V0QWNjb3VudEluZGV4KHJwY0luZGljZXNbMF0ubWFqb3IpO1xuICAgICAgICBpZiAoaXNPdXRnb2luZykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgICAgICAgIGZvciAobGV0IHJwY0luZGV4IG9mIHJwY0luZGljZXMpIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2gocnBjSW5kZXgubWlub3IpO1xuICAgICAgICAgIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhc3NlcnQuZXF1YWwocnBjSW5kaWNlcy5sZW5ndGgsIDEpO1xuICAgICAgICAgIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRleChycGNJbmRpY2VzWzBdLm1pbm9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRlc3RpbmF0aW9uc1wiIHx8IGtleSA9PSBcInJlY2lwaWVudHNcIikge1xuICAgICAgICBhc3NlcnQoaXNPdXRnb2luZyk7XG4gICAgICAgIGxldCBkZXN0aW5hdGlvbnMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgcnBjRGVzdGluYXRpb24gb2YgdmFsKSB7XG4gICAgICAgICAgbGV0IGRlc3RpbmF0aW9uID0gbmV3IE1vbmVyb0Rlc3RpbmF0aW9uKCk7XG4gICAgICAgICAgZGVzdGluYXRpb25zLnB1c2goZGVzdGluYXRpb24pO1xuICAgICAgICAgIGZvciAobGV0IGRlc3RpbmF0aW9uS2V5IG9mIE9iamVjdC5rZXlzKHJwY0Rlc3RpbmF0aW9uKSkge1xuICAgICAgICAgICAgaWYgKGRlc3RpbmF0aW9uS2V5ID09PSBcImFkZHJlc3NcIikgZGVzdGluYXRpb24uc2V0QWRkcmVzcyhycGNEZXN0aW5hdGlvbltkZXN0aW5hdGlvbktleV0pO1xuICAgICAgICAgICAgZWxzZSBpZiAoZGVzdGluYXRpb25LZXkgPT09IFwiYW1vdW50XCIpIGRlc3RpbmF0aW9uLnNldEFtb3VudChCaWdJbnQocnBjRGVzdGluYXRpb25bZGVzdGluYXRpb25LZXldKSk7XG4gICAgICAgICAgICBlbHNlIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlVucmVjb2duaXplZCB0cmFuc2FjdGlvbiBkZXN0aW5hdGlvbiBmaWVsZDogXCIgKyBkZXN0aW5hdGlvbktleSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKHt0eDogdHh9KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKGRlc3RpbmF0aW9ucyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibXVsdGlzaWdfdHhzZXRcIiAmJiB2YWwgIT09IHVuZGVmaW5lZCkge30gLy8gaGFuZGxlZCBlbHNld2hlcmU7IHRoaXMgbWV0aG9kIG9ubHkgYnVpbGRzIGEgdHggd2FsbGV0XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5zaWduZWRfdHhzZXRcIiAmJiB2YWwgIT09IHVuZGVmaW5lZCkge30gLy8gaGFuZGxlZCBlbHNld2hlcmU7IHRoaXMgbWV0aG9kIG9ubHkgYnVpbGRzIGEgdHggd2FsbGV0XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50X2luXCIpIHR4LnNldElucHV0U3VtKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRfb3V0XCIpIHR4LnNldE91dHB1dFN1bShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY2hhbmdlX2FkZHJlc3NcIikgdHguc2V0Q2hhbmdlQWRkcmVzcyh2YWwgPT09IFwiXCIgPyB1bmRlZmluZWQgOiB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNoYW5nZV9hbW91bnRcIikgdHguc2V0Q2hhbmdlQW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkdW1teV9vdXRwdXRzXCIpIHR4LnNldE51bUR1bW15T3V0cHV0cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImV4dHJhXCIpIHR4LnNldEV4dHJhSGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmluZ19zaXplXCIpIHR4LnNldFJpbmdTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlbnRfa2V5X2ltYWdlc1wiKSB7XG4gICAgICAgIGxldCBpbnB1dEtleUltYWdlcyA9IHZhbC5rZXlfaW1hZ2VzO1xuICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR4LmdldElucHV0cygpID09PSB1bmRlZmluZWQpO1xuICAgICAgICB0eC5zZXRJbnB1dHMoW10pO1xuICAgICAgICBmb3IgKGxldCBpbnB1dEtleUltYWdlIG9mIGlucHV0S2V5SW1hZ2VzKSB7XG4gICAgICAgICAgdHguZ2V0SW5wdXRzKCkucHVzaChuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCkuc2V0S2V5SW1hZ2UobmV3IE1vbmVyb0tleUltYWdlKCkuc2V0SGV4KGlucHV0S2V5SW1hZ2UpKS5zZXRUeCh0eCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50c19ieV9kZXN0XCIpIHtcbiAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShpc091dGdvaW5nKTtcbiAgICAgICAgbGV0IGFtb3VudHNCeURlc3QgPSB2YWwuYW1vdW50cztcbiAgICAgICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGgsIGFtb3VudHNCeURlc3QubGVuZ3RoKTtcbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eCk7XG4gICAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhbXSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdHJhbnNmZXIuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpW2ldLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudHNCeURlc3RbaV0pKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHRyYW5zYWN0aW9uIGZpZWxkIHdpdGggdHJhbnNmZXI6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbGluayBibG9jayBhbmQgdHhcbiAgICBpZiAoaGVhZGVyKSB0eC5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soaGVhZGVyKS5zZXRUeHMoW3R4XSkpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgZmluYWwgZmllbGRzXG4gICAgaWYgKHRyYW5zZmVyKSB7XG4gICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICBpZiAoIXRyYW5zZmVyLmdldFR4KCkuZ2V0SXNDb25maXJtZWQoKSkgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICAgIGlmIChpc091dGdvaW5nKSB7XG4gICAgICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpIHtcbiAgICAgICAgICBpZiAodHJhbnNmZXIuZ2V0RGVzdGluYXRpb25zKCkpIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXREZXN0aW5hdGlvbnModW5kZWZpbmVkKTsgLy8gb3ZlcndyaXRlIHRvIGF2b2lkIHJlY29uY2lsZSBlcnJvciBUT0RPOiByZW1vdmUgYWZ0ZXIgPjE4LjMuMSB3aGVuIGFtb3VudHNfYnlfZGVzdCBzdXBwb3J0ZWRcbiAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkubWVyZ2UodHJhbnNmZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0eC5zZXRJc0luY29taW5nKHRydWUpO1xuICAgICAgICB0eC5zZXRJbmNvbWluZ1RyYW5zZmVycyhbdHJhbnNmZXJdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gcmV0dXJuIGluaXRpYWxpemVkIHRyYW5zYWN0aW9uXG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFdhbGxldFdpdGhPdXRwdXQocnBjT3V0cHV0KSB7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eFxuICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBvdXRwdXRcbiAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCh7dHg6IHR4fSk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY091dHB1dCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNPdXRwdXRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIG91dHB1dC5zZXRBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50XCIpIG91dHB1dC5zZXRJc1NwZW50KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwia2V5X2ltYWdlXCIpIHsgaWYgKFwiXCIgIT09IHZhbCkgb3V0cHV0LnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSh2YWwpKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImdsb2JhbF9pbmRleFwiKSBvdXRwdXQuc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZFwiKSB0eC5zZXRJc0xvY2tlZCghdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmcm96ZW5cIikgb3V0cHV0LnNldElzRnJvemVuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHVia2V5XCIpIG91dHB1dC5zZXRTdGVhbHRoUHVibGljS2V5KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRleFwiKSB7XG4gICAgICAgIG91dHB1dC5zZXRBY2NvdW50SW5kZXgodmFsLm1ham9yKTtcbiAgICAgICAgb3V0cHV0LnNldFN1YmFkZHJlc3NJbmRleCh2YWwubWlub3IpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiKSB0eC5zZXRCbG9jaygobmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KHZhbCkgYXMgTW9uZXJvQmxvY2spLnNldFR4cyhbdHggYXMgTW9uZXJvVHhdKSk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHdpdGggb3V0cHV0XG4gICAgdHguc2V0T3V0cHV0cyhbb3V0cHV0XSk7XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNEZXNjcmliZVRyYW5zZmVyKHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQpIHtcbiAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImRlc2NcIikge1xuICAgICAgICB0eFNldC5zZXRUeHMoW10pO1xuICAgICAgICBmb3IgKGxldCB0eE1hcCBvZiB2YWwpIHtcbiAgICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHR4TWFwLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgIHR4LnNldFR4U2V0KHR4U2V0KTtcbiAgICAgICAgICB0eFNldC5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1bW1hcnlcIikgeyB9IC8vIFRPRE86IHN1cHBvcnQgdHggc2V0IHN1bW1hcnkgZmllbGRzP1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZGVzY2RyaWJlIHRyYW5zZmVyIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlY29kZXMgYSBcInR5cGVcIiBmcm9tIG1vbmVyby13YWxsZXQtcnBjIHRvIGluaXRpYWxpemUgdHlwZSBhbmQgc3RhdGVcbiAgICogZmllbGRzIGluIHRoZSBnaXZlbiB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIFRPRE86IHRoZXNlIHNob3VsZCBiZSBzYWZlIHNldFxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R5cGUgaXMgdGhlIHR5cGUgdG8gZGVjb2RlXG4gICAqIEBwYXJhbSB0eCBpcyB0aGUgdHJhbnNhY3Rpb24gdG8gZGVjb2RlIGtub3duIGZpZWxkcyB0b1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBycGMgdHlwZSBpbmRpY2F0ZXMgb3V0Z29pbmcgeG9yIGluY29taW5nXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGRlY29kZVJwY1R5cGUocnBjVHlwZSwgdHgpIHtcbiAgICBsZXQgaXNPdXRnb2luZztcbiAgICBpZiAocnBjVHlwZSA9PT0gXCJpblwiKSB7XG4gICAgICBpc091dGdvaW5nID0gZmFsc2U7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwib3V0XCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBvb2xcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7ICAvLyBUT0RPOiBidXQgY291bGQgaXQgYmU/XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBlbmRpbmdcIikge1xuICAgICAgaXNPdXRnb2luZyA9IHRydWU7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiYmxvY2tcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeCh0cnVlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiZmFpbGVkXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZCh0cnVlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlVucmVjb2duaXplZCB0cmFuc2ZlciB0eXBlOiBcIiArIHJwY1R5cGUpO1xuICAgIH1cbiAgICByZXR1cm4gaXNPdXRnb2luZztcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1lcmdlcyBhIHRyYW5zYWN0aW9uIGludG8gYSB1bmlxdWUgc2V0IG9mIHRyYW5zYWN0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHtNb25lcm9UeFdhbGxldH0gdHggLSB0aGUgdHJhbnNhY3Rpb24gdG8gbWVyZ2UgaW50byB0aGUgZXhpc3RpbmcgdHhzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB0eE1hcCAtIG1hcHMgdHggaGFzaGVzIHRvIHR4c1xuICAgKiBAcGFyYW0ge09iamVjdH0gYmxvY2tNYXAgLSBtYXBzIGJsb2NrIGhlaWdodHMgdG8gYmxvY2tzXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIG1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCkge1xuICAgIGFzc2VydCh0eC5nZXRIYXNoKCkgIT09IHVuZGVmaW5lZCk7XG4gICAgXG4gICAgLy8gbWVyZ2UgdHhcbiAgICBsZXQgYVR4ID0gdHhNYXBbdHguZ2V0SGFzaCgpXTtcbiAgICBpZiAoYVR4ID09PSB1bmRlZmluZWQpIHR4TWFwW3R4LmdldEhhc2goKV0gPSB0eDsgLy8gY2FjaGUgbmV3IHR4XG4gICAgZWxzZSBhVHgubWVyZ2UodHgpOyAvLyBtZXJnZSB3aXRoIGV4aXN0aW5nIHR4XG4gICAgXG4gICAgLy8gbWVyZ2UgdHgncyBibG9jayBpZiBjb25maXJtZWRcbiAgICBpZiAodHguZ2V0SGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IGFCbG9jayA9IGJsb2NrTWFwW3R4LmdldEhlaWdodCgpXTtcbiAgICAgIGlmIChhQmxvY2sgPT09IHVuZGVmaW5lZCkgYmxvY2tNYXBbdHguZ2V0SGVpZ2h0KCldID0gdHguZ2V0QmxvY2soKTsgLy8gY2FjaGUgbmV3IGJsb2NrXG4gICAgICBlbHNlIGFCbG9jay5tZXJnZSh0eC5nZXRCbG9jaygpKTsgLy8gbWVyZ2Ugd2l0aCBleGlzdGluZyBibG9ja1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byB0cmFuc2FjdGlvbnMgYnkgdGhlaXIgaGVpZ2h0LlxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb21wYXJlVHhzQnlIZWlnaHQodHgxLCB0eDIpIHtcbiAgICBpZiAodHgxLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQgJiYgdHgyLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHJldHVybiAwOyAvLyBib3RoIHVuY29uZmlybWVkXG4gICAgZWxzZSBpZiAodHgxLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHJldHVybiAxOyAgIC8vIHR4MSBpcyB1bmNvbmZpcm1lZFxuICAgIGVsc2UgaWYgKHR4Mi5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gLTE7ICAvLyB0eDIgaXMgdW5jb25maXJtZWRcbiAgICBsZXQgZGlmZiA9IHR4MS5nZXRIZWlnaHQoKSAtIHR4Mi5nZXRIZWlnaHQoKTtcbiAgICBpZiAoZGlmZiAhPT0gMCkgcmV0dXJuIGRpZmY7XG4gICAgcmV0dXJuIHR4MS5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgxKSAtIHR4Mi5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgyKTsgLy8gdHhzIGFyZSBpbiB0aGUgc2FtZSBibG9jayBzbyByZXRhaW4gdGhlaXIgb3JpZ2luYWwgb3JkZXJcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byB0cmFuc2ZlcnMgYnkgYXNjZW5kaW5nIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcy5cbiAgICovXG4gIHN0YXRpYyBjb21wYXJlSW5jb21pbmdUcmFuc2ZlcnModDEsIHQyKSB7XG4gICAgaWYgKHQxLmdldEFjY291bnRJbmRleCgpIDwgdDIuZ2V0QWNjb3VudEluZGV4KCkpIHJldHVybiAtMTtcbiAgICBlbHNlIGlmICh0MS5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdDIuZ2V0QWNjb3VudEluZGV4KCkpIHJldHVybiB0MS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAtIHQyLmdldFN1YmFkZHJlc3NJbmRleCgpO1xuICAgIHJldHVybiAxO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29tcGFyZXMgdHdvIG91dHB1dHMgYnkgYXNjZW5kaW5nIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcy5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29tcGFyZU91dHB1dHMobzEsIG8yKSB7XG4gICAgXG4gICAgLy8gY29tcGFyZSBieSBoZWlnaHRcbiAgICBsZXQgaGVpZ2h0Q29tcGFyaXNvbiA9IE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQobzEuZ2V0VHgoKSwgbzIuZ2V0VHgoKSk7XG4gICAgaWYgKGhlaWdodENvbXBhcmlzb24gIT09IDApIHJldHVybiBoZWlnaHRDb21wYXJpc29uO1xuICAgIFxuICAgIC8vIGNvbXBhcmUgYnkgYWNjb3VudCBpbmRleCwgc3ViYWRkcmVzcyBpbmRleCwgb3V0cHV0IGluZGV4LCB0aGVuIGtleSBpbWFnZSBoZXhcbiAgICBsZXQgY29tcGFyZSA9IG8xLmdldEFjY291bnRJbmRleCgpIC0gbzIuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgaWYgKGNvbXBhcmUgIT09IDApIHJldHVybiBjb21wYXJlO1xuICAgIGNvbXBhcmUgPSBvMS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAtIG8yLmdldFN1YmFkZHJlc3NJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICBjb21wYXJlID0gbzEuZ2V0SW5kZXgoKSAtIG8yLmdldEluZGV4KCk7XG4gICAgaWYgKGNvbXBhcmUgIT09IDApIHJldHVybiBjb21wYXJlO1xuICAgIHJldHVybiBvMS5nZXRLZXlJbWFnZSgpLmdldEhleCgpLmxvY2FsZUNvbXBhcmUobzIuZ2V0S2V5SW1hZ2UoKS5nZXRIZXgoKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBQb2xscyBtb25lcm8td2FsbGV0LXJwYyB0byBwcm92aWRlIGxpc3RlbmVyIG5vdGlmaWNhdGlvbnMuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIFdhbGxldFBvbGxlciB7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIGlzUG9sbGluZzogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIHdhbGxldDogTW9uZXJvV2FsbGV0UnBjO1xuICBwcm90ZWN0ZWQgbG9vcGVyOiBUYXNrTG9vcGVyO1xuICBwcm90ZWN0ZWQgcHJldkxvY2tlZFR4czogYW55O1xuICBwcm90ZWN0ZWQgcHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9uczogYW55O1xuICBwcm90ZWN0ZWQgcHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnM6IGFueTtcbiAgcHJvdGVjdGVkIHRocmVhZFBvb2w6IGFueTtcbiAgcHJvdGVjdGVkIG51bVBvbGxpbmc6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZIZWlnaHQ6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZCYWxhbmNlczogYW55O1xuICBcbiAgY29uc3RydWN0b3Iod2FsbGV0KSB7XG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIHRoaXMud2FsbGV0ID0gd2FsbGV0O1xuICAgIHRoaXMubG9vcGVyID0gbmV3IFRhc2tMb29wZXIoYXN5bmMgZnVuY3Rpb24oKSB7IGF3YWl0IHRoYXQucG9sbCgpOyB9KTtcbiAgICB0aGlzLnByZXZMb2NrZWRUeHMgPSBbXTtcbiAgICB0aGlzLnByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnMgPSBuZXcgU2V0KCk7IC8vIHR4IGhhc2hlcyBvZiBwcmV2aW91cyBub3RpZmljYXRpb25zXG4gICAgdGhpcy5wcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucyA9IG5ldyBTZXQoKTsgLy8gdHggaGFzaGVzIG9mIHByZXZpb3VzbHkgY29uZmlybWVkIGJ1dCBub3QgeWV0IHVubG9ja2VkIG5vdGlmaWNhdGlvbnNcbiAgICB0aGlzLnRocmVhZFBvb2wgPSBuZXcgVGhyZWFkUG9vbCgxKTsgLy8gc3luY2hyb25pemUgcG9sbHNcbiAgICB0aGlzLm51bVBvbGxpbmcgPSAwO1xuICB9XG4gIFxuICBzZXRJc1BvbGxpbmcoaXNQb2xsaW5nKSB7XG4gICAgdGhpcy5pc1BvbGxpbmcgPSBpc1BvbGxpbmc7XG4gICAgaWYgKGlzUG9sbGluZykgdGhpcy5sb29wZXIuc3RhcnQodGhpcy53YWxsZXQuZ2V0U3luY1BlcmlvZEluTXMoKSk7XG4gICAgZWxzZSB0aGlzLmxvb3Blci5zdG9wKCk7XG4gIH1cbiAgXG4gIHNldFBlcmlvZEluTXMocGVyaW9kSW5Ncykge1xuICAgIHRoaXMubG9vcGVyLnNldFBlcmlvZEluTXMocGVyaW9kSW5Ncyk7XG4gIH1cbiAgXG4gIGFzeW5jIHBvbGwoKSB7XG5cbiAgICAvLyBza2lwIGlmIG5leHQgcG9sbCBpcyBxdWV1ZWRcbiAgICBpZiAodGhpcy5udW1Qb2xsaW5nID4gMSkgcmV0dXJuO1xuICAgIHRoaXMubnVtUG9sbGluZysrO1xuICAgIFxuICAgIC8vIHN5bmNocm9uaXplIHBvbGxzXG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIHJldHVybiB0aGlzLnRocmVhZFBvb2wuc3VibWl0KGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHNraXAgaWYgd2FsbGV0IGlzIGNsb3NlZFxuICAgICAgICBpZiAoYXdhaXQgdGhhdC53YWxsZXQuaXNDbG9zZWQoKSkge1xuICAgICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gdGFrZSBpbml0aWFsIHNuYXBzaG90XG4gICAgICAgIGlmICh0aGF0LnByZXZIZWlnaHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEhlaWdodCgpO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpKTtcbiAgICAgICAgICB0aGF0LnByZXZCYWxhbmNlcyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBoZWlnaHQgY2hhbmdlc1xuICAgICAgICBsZXQgaGVpZ2h0ID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0SGVpZ2h0KCk7XG4gICAgICAgIGlmICh0aGF0LnByZXZIZWlnaHQgIT09IGhlaWdodCkge1xuICAgICAgICAgIGZvciAobGV0IGkgPSB0aGF0LnByZXZIZWlnaHQ7IGkgPCBoZWlnaHQ7IGkrKykgYXdhaXQgdGhhdC5vbk5ld0Jsb2NrKGkpO1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gZ2V0IGxvY2tlZCB0eHMgZm9yIGNvbXBhcmlzb24gdG8gcHJldmlvdXNcbiAgICAgICAgbGV0IG1pbkhlaWdodCA9IE1hdGgubWF4KDAsIGhlaWdodCAtIDcwKTsgLy8gb25seSBtb25pdG9yIHJlY2VudCB0eHNcbiAgICAgICAgbGV0IGxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEluY2x1ZGVPdXRwdXRzKHRydWUpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbGxlY3QgaGFzaGVzIG9mIHR4cyBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCBub0xvbmdlckxvY2tlZEhhc2hlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBwcmV2TG9ja2VkVHggb2YgdGhhdC5wcmV2TG9ja2VkVHhzKSB7XG4gICAgICAgICAgaWYgKHRoYXQuZ2V0VHgobG9ja2VkVHhzLCBwcmV2TG9ja2VkVHguZ2V0SGFzaCgpKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBub0xvbmdlckxvY2tlZEhhc2hlcy5wdXNoKHByZXZMb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gc2F2ZSBsb2NrZWQgdHhzIGZvciBuZXh0IGNvbXBhcmlzb25cbiAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzID0gbG9ja2VkVHhzO1xuICAgICAgICBcbiAgICAgICAgLy8gZmV0Y2ggdHhzIHdoaWNoIGFyZSBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCB1bmxvY2tlZFR4cyA9IG5vTG9uZ2VyTG9ja2VkSGFzaGVzLmxlbmd0aCA9PT0gMCA/IFtdIDogYXdhaXQgdGhhdC53YWxsZXQuZ2V0VHhzKG5ldyBNb25lcm9UeFF1ZXJ5KCkuc2V0SXNMb2NrZWQoZmFsc2UpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEhhc2hlcyhub0xvbmdlckxvY2tlZEhhc2hlcykuc2V0SW5jbHVkZU91dHB1dHModHJ1ZSkpO1xuICAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIG5ldyB1bmNvbmZpcm1lZCBhbmQgY29uZmlybWVkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgbG9ja2VkVHggb2YgbG9ja2VkVHhzKSB7XG4gICAgICAgICAgbGV0IHNlYXJjaFNldCA9IGxvY2tlZFR4LmdldElzQ29uZmlybWVkKCkgPyB0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zIDogdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zO1xuICAgICAgICAgIGxldCB1bmFubm91bmNlZCA9ICFzZWFyY2hTZXQuaGFzKGxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgc2VhcmNoU2V0LmFkZChsb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIGlmICh1bmFubm91bmNlZCkgYXdhaXQgdGhhdC5ub3RpZnlPdXRwdXRzKGxvY2tlZFR4KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgbmV3IHVubG9ja2VkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgdW5sb2NrZWRUeCBvZiB1bmxvY2tlZFR4cykge1xuICAgICAgICAgIHRoYXQucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucy5kZWxldGUodW5sb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIHRoYXQucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMuZGVsZXRlKHVubG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHModW5sb2NrZWRUeCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIGJhbGFuY2UgY2hhbmdlc1xuICAgICAgICBhd2FpdCB0aGF0LmNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzKCk7XG4gICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gYmFja2dyb3VuZCBwb2xsIFwiICsgYXdhaXQgdGhhdC53YWxsZXQuZ2V0UGF0aCgpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy53YWxsZXQuZ2V0TGlzdGVuZXJzKCkpIGF3YWl0IGxpc3RlbmVyLm9uTmV3QmxvY2soaGVpZ2h0KTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIG5vdGlmeU91dHB1dHModHgpIHtcbiAgXG4gICAgLy8gbm90aWZ5IHNwZW50IG91dHB1dHMgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBhbGxvdyBzY3JhcGUgb2YgdHggaW5wdXRzIHNvIHByb3ZpZGluZyBvbmUgaW5wdXQgd2l0aCBvdXRnb2luZyBhbW91bnRcbiAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydCh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KClcbiAgICAgICAgICAuc2V0QW1vdW50KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBbW91bnQoKSArIHR4LmdldEZlZSgpKVxuICAgICAgICAgIC5zZXRBY2NvdW50SW5kZXgodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFjY291bnRJbmRleCgpKVxuICAgICAgICAgIC5zZXRTdWJhZGRyZXNzSW5kZXgodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAxID8gdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldFN1YmFkZHJlc3NJbmRpY2VzKClbMF0gOiB1bmRlZmluZWQpIC8vIGluaXRpYWxpemUgaWYgdHJhbnNmZXIgc291cmNlZCBmcm9tIHNpbmdsZSBzdWJhZGRyZXNzXG4gICAgICAgICAgLnNldFR4KHR4KTtcbiAgICAgIHR4LnNldElucHV0cyhbb3V0cHV0XSk7XG4gICAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLndhbGxldC5nZXRMaXN0ZW5lcnMoKSkgYXdhaXQgbGlzdGVuZXIub25PdXRwdXRTcGVudChvdXRwdXQpO1xuICAgIH1cbiAgICBcbiAgICAvLyBub3RpZnkgcmVjZWl2ZWQgb3V0cHV0c1xuICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRPdXRwdXRzKCkubGVuZ3RoID4gMCkgeyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG91dHB1dHMgb25seSByZXR1cm5lZCBmb3IgY29uZmlybWVkIHR4c1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy53YWxsZXQuZ2V0TGlzdGVuZXJzKCkpIGF3YWl0IGxpc3RlbmVyLm9uT3V0cHV0UmVjZWl2ZWQob3V0cHV0KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBhbGxvdyBzY3JhcGUgb2YgdW5jb25maXJtZWQgcmVjZWl2ZWQgb3V0cHV0cyBzbyB1c2luZyBpbmNvbWluZyB0cmFuc2ZlciB2YWx1ZXNcbiAgICAgICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkge1xuICAgICAgICAgIG91dHB1dHMucHVzaChuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KClcbiAgICAgICAgICAgICAgLnNldEFjY291bnRJbmRleCh0cmFuc2Zlci5nZXRBY2NvdW50SW5kZXgoKSlcbiAgICAgICAgICAgICAgLnNldFN1YmFkZHJlc3NJbmRleCh0cmFuc2Zlci5nZXRTdWJhZGRyZXNzSW5kZXgoKSlcbiAgICAgICAgICAgICAgLnNldEFtb3VudCh0cmFuc2Zlci5nZXRBbW91bnQoKSlcbiAgICAgICAgICAgICAgLnNldFR4KHR4KSk7XG4gICAgICAgIH1cbiAgICAgICAgdHguc2V0T3V0cHV0cyhvdXRwdXRzKTtcbiAgICAgICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy53YWxsZXQuZ2V0TGlzdGVuZXJzKCkpIHtcbiAgICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSBhd2FpdCBsaXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKG91dHB1dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBnZXRUeCh0eHMsIHR4SGFzaCkge1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykgaWYgKHR4SGFzaCA9PT0gdHguZ2V0SGFzaCgpKSByZXR1cm4gdHg7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzKCkge1xuICAgIGxldCBiYWxhbmNlcyA9IGF3YWl0IHRoaXMud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgaWYgKGJhbGFuY2VzWzBdICE9PSB0aGlzLnByZXZCYWxhbmNlc1swXSB8fCBiYWxhbmNlc1sxXSAhPT0gdGhpcy5wcmV2QmFsYW5jZXNbMV0pIHtcbiAgICAgIHRoaXMucHJldkJhbGFuY2VzID0gYmFsYW5jZXM7XG4gICAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBhd2FpdCB0aGlzLndhbGxldC5nZXRMaXN0ZW5lcnMoKSkgYXdhaXQgbGlzdGVuZXIub25CYWxhbmNlc0NoYW5nZWQoYmFsYW5jZXNbMF0sIGJhbGFuY2VzWzFdKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGFBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFdBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLGNBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLGlCQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSx1QkFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sWUFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsa0JBQUEsR0FBQVQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFTLG1CQUFBLEdBQUFWLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVSxjQUFBLEdBQUFYLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVyxrQkFBQSxHQUFBWixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVksWUFBQSxHQUFBYixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWEsdUJBQUEsR0FBQWQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFjLHdCQUFBLEdBQUFmLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZSxlQUFBLEdBQUFoQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWdCLDJCQUFBLEdBQUFqQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWlCLG1CQUFBLEdBQUFsQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWtCLHlCQUFBLEdBQUFuQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQW1C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