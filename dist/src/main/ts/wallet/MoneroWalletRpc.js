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
    if (this.walletPoller !== undefined) this.walletPoller.setPeriodInMs(syncPeriodInMs);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiTW9uZXJvV2FsbGV0UnBjIiwiTW9uZXJvV2FsbGV0IiwiREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwiYWRkcmVzc0NhY2hlIiwic3luY1BlcmlvZEluTXMiLCJsaXN0ZW5lcnMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRTZXJ2ZXIiLCJvcGVuV2FsbGV0IiwicGF0aE9yQ29uZmlnIiwicGFzc3dvcmQiLCJNb25lcm9XYWxsZXRDb25maWciLCJwYXRoIiwiZ2V0UGF0aCIsInNlbmRKc29uUmVxdWVzdCIsImZpbGVuYW1lIiwiZ2V0UGFzc3dvcmQiLCJjbGVhciIsInNldERhZW1vbkNvbm5lY3Rpb24iLCJjcmVhdGVXYWxsZXQiLCJjb25maWdOb3JtYWxpemVkIiwiZ2V0U2VlZCIsImdldFByaW1hcnlBZGRyZXNzIiwiZ2V0UHJpdmF0ZVZpZXdLZXkiLCJnZXRQcml2YXRlU3BlbmRLZXkiLCJnZXROZXR3b3JrVHlwZSIsImdldEFjY291bnRMb29rYWhlYWQiLCJnZXRTdWJhZGRyZXNzTG9va2FoZWFkIiwic2V0UGFzc3dvcmQiLCJjcmVhdGVXYWxsZXRGcm9tU2VlZCIsImNyZWF0ZVdhbGxldEZyb21LZXlzIiwiY3JlYXRlV2FsbGV0UmFuZG9tIiwiZ2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJzZXRDb25uZWN0aW9uTWFuYWdlciIsImdldFNlZWRPZmZzZXQiLCJnZXRSZXN0b3JlSGVpZ2h0IiwiZ2V0U2F2ZUN1cnJlbnQiLCJnZXRMYW5ndWFnZSIsInNldExhbmd1YWdlIiwiREVGQVVMVF9MQU5HVUFHRSIsInBhcmFtcyIsImxhbmd1YWdlIiwiZXJyIiwiaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IiLCJzZWVkIiwic2VlZF9vZmZzZXQiLCJlbmFibGVfbXVsdGlzaWdfZXhwZXJpbWVudGFsIiwiZ2V0SXNNdWx0aXNpZyIsInJlc3RvcmVfaGVpZ2h0IiwiYXV0b3NhdmVfY3VycmVudCIsInNldFJlc3RvcmVIZWlnaHQiLCJhZGRyZXNzIiwidmlld2tleSIsInNwZW5ka2V5IiwibmFtZSIsIm1lc3NhZ2UiLCJNb25lcm9ScGNFcnJvciIsImdldENvZGUiLCJnZXRScGNNZXRob2QiLCJnZXRScGNQYXJhbXMiLCJpc1ZpZXdPbmx5Iiwia2V5X3R5cGUiLCJlIiwidXJpT3JDb25uZWN0aW9uIiwiaXNUcnVzdGVkIiwic3NsT3B0aW9ucyIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiU3NsT3B0aW9ucyIsImdldFVyaSIsInVzZXJuYW1lIiwiZ2V0VXNlcm5hbWUiLCJ0cnVzdGVkIiwic3NsX3N1cHBvcnQiLCJzc2xfcHJpdmF0ZV9rZXlfcGF0aCIsImdldFByaXZhdGVLZXlQYXRoIiwic3NsX2NlcnRpZmljYXRlX3BhdGgiLCJnZXRDZXJ0aWZpY2F0ZVBhdGgiLCJzc2xfY2FfZmlsZSIsImdldENlcnRpZmljYXRlQXV0aG9yaXR5RmlsZSIsInNzbF9hbGxvd2VkX2ZpbmdlcnByaW50cyIsImdldEFsbG93ZWRGaW5nZXJwcmludHMiLCJzc2xfYWxsb3dfYW55X2NlcnQiLCJnZXRBbGxvd0FueUNlcnQiLCJkYWVtb25Db25uZWN0aW9uIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImdldEJhbGFuY2VzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJhc3NlcnQiLCJlcXVhbCIsImJhbGFuY2UiLCJCaWdJbnQiLCJ1bmxvY2tlZEJhbGFuY2UiLCJhY2NvdW50IiwiZ2V0QWNjb3VudHMiLCJnZXRCYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudF9pbmRleCIsImFkZHJlc3NfaW5kaWNlcyIsInJlc3AiLCJyZXN1bHQiLCJ1bmxvY2tlZF9iYWxhbmNlIiwicGVyX3N1YmFkZHJlc3MiLCJhZGRMaXN0ZW5lciIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwicHVzaCIsInJlZnJlc2hMaXN0ZW5pbmciLCJpZHgiLCJpbmRleE9mIiwic3BsaWNlIiwiaXNDb25uZWN0ZWRUb0RhZW1vbiIsImNoZWNrUmVzZXJ2ZVByb29mIiwiZ2V0VmVyc2lvbiIsIk1vbmVyb1ZlcnNpb24iLCJ2ZXJzaW9uIiwicmVsZWFzZSIsImdldFNlZWRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJsYW5ndWFnZXMiLCJnZXRBZGRyZXNzIiwic3ViYWRkcmVzc01hcCIsImdldFN1YmFkZHJlc3NlcyIsImdldEFkZHJlc3NJbmRleCIsInN1YmFkZHJlc3MiLCJNb25lcm9TdWJhZGRyZXNzIiwic2V0QWNjb3VudEluZGV4IiwiaW5kZXgiLCJtYWpvciIsInNldEluZGV4IiwibWlub3IiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInN0YW5kYXJkQWRkcmVzcyIsInBheW1lbnRJZCIsImludGVncmF0ZWRBZGRyZXNzU3RyIiwic3RhbmRhcmRfYWRkcmVzcyIsInBheW1lbnRfaWQiLCJpbnRlZ3JhdGVkX2FkZHJlc3MiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImluY2x1ZGVzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsInNldFN0YW5kYXJkQWRkcmVzcyIsInNldFBheW1lbnRJZCIsInNldEludGVncmF0ZWRBZGRyZXNzIiwiZ2V0SGVpZ2h0IiwiaGVpZ2h0IiwiZ2V0RGFlbW9uSGVpZ2h0IiwiZ2V0SGVpZ2h0QnlEYXRlIiwieWVhciIsIm1vbnRoIiwiZGF5Iiwic3luYyIsImxpc3RlbmVyT3JTdGFydEhlaWdodCIsInN0YXJ0SGVpZ2h0Iiwic3RhcnRfaGVpZ2h0IiwicG9sbCIsIk1vbmVyb1N5bmNSZXN1bHQiLCJibG9ja3NfZmV0Y2hlZCIsInJlY2VpdmVkX21vbmV5Iiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluU2Vjb25kcyIsIk1hdGgiLCJyb3VuZCIsImVuYWJsZSIsInBlcmlvZCIsIndhbGxldFBvbGxlciIsInNldFBlcmlvZEluTXMiLCJnZXRTeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwibGVuZ3RoIiwidHhpZHMiLCJyZXNjYW5TcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwic2tpcEJhbGFuY2VzIiwiYWNjb3VudHMiLCJycGNBY2NvdW50Iiwic3ViYWRkcmVzc19hY2NvdW50cyIsImNvbnZlcnRScGNBY2NvdW50Iiwic2V0U3ViYWRkcmVzc2VzIiwiZ2V0SW5kZXgiLCJzZXRCYWxhbmNlIiwic2V0VW5sb2NrZWRCYWxhbmNlIiwic2V0TnVtVW5zcGVudE91dHB1dHMiLCJzZXROdW1CbG9ja3NUb1VubG9jayIsImFsbF9hY2NvdW50cyIsInJwY1N1YmFkZHJlc3MiLCJjb252ZXJ0UnBjU3ViYWRkcmVzcyIsImdldEFjY291bnRJbmRleCIsInRndFN1YmFkZHJlc3MiLCJnZXROdW1VbnNwZW50T3V0cHV0cyIsImdldEFjY291bnQiLCJFcnJvciIsImNyZWF0ZUFjY291bnQiLCJsYWJlbCIsIk1vbmVyb0FjY291bnQiLCJwcmltYXJ5QWRkcmVzcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwiYWRkcmVzc19pbmRleCIsImxpc3RpZnkiLCJzdWJhZGRyZXNzZXMiLCJhZGRyZXNzZXMiLCJnZXROdW1CbG9ja3NUb1VubG9jayIsImdldFN1YmFkZHJlc3MiLCJjcmVhdGVTdWJhZGRyZXNzIiwic2V0QWRkcmVzcyIsInNldExhYmVsIiwic2V0SXNVc2VkIiwic2V0U3ViYWRkcmVzc0xhYmVsIiwiZ2V0VHhzIiwicXVlcnkiLCJxdWVyeU5vcm1hbGl6ZWQiLCJub3JtYWxpemVUeFF1ZXJ5IiwidHJhbnNmZXJRdWVyeSIsImdldFRyYW5zZmVyUXVlcnkiLCJpbnB1dFF1ZXJ5IiwiZ2V0SW5wdXRRdWVyeSIsIm91dHB1dFF1ZXJ5IiwiZ2V0T3V0cHV0UXVlcnkiLCJzZXRUcmFuc2ZlclF1ZXJ5Iiwic2V0SW5wdXRRdWVyeSIsInNldE91dHB1dFF1ZXJ5IiwidHJhbnNmZXJzIiwiZ2V0VHJhbnNmZXJzQXV4IiwiTW9uZXJvVHJhbnNmZXJRdWVyeSIsInNldFR4UXVlcnkiLCJkZWNvbnRleHR1YWxpemUiLCJjb3B5IiwidHhzIiwidHhzU2V0IiwiU2V0IiwidHJhbnNmZXIiLCJnZXRUeCIsImFkZCIsInR4TWFwIiwiYmxvY2tNYXAiLCJ0eCIsIm1lcmdlVHgiLCJnZXRJbmNsdWRlT3V0cHV0cyIsIm91dHB1dFF1ZXJ5QXV4IiwiTW9uZXJvT3V0cHV0UXVlcnkiLCJvdXRwdXRzIiwiZ2V0T3V0cHV0c0F1eCIsIm91dHB1dFR4cyIsIm91dHB1dCIsInR4c1F1ZXJpZWQiLCJtZWV0c0NyaXRlcmlhIiwiZ2V0QmxvY2siLCJnZXRJc0NvbmZpcm1lZCIsImNvbnNvbGUiLCJlcnJvciIsImdldEhhc2hlcyIsInR4c0J5SWQiLCJNYXAiLCJnZXRIYXNoIiwib3JkZXJlZFR4cyIsImhhc2giLCJnZXRUcmFuc2ZlcnMiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiaXNDb250ZXh0dWFsIiwiZ2V0VHhRdWVyeSIsImZpbHRlclRyYW5zZmVycyIsImdldE91dHB1dHMiLCJub3JtYWxpemVPdXRwdXRRdWVyeSIsImZpbHRlck91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwib3V0cHV0c19kYXRhX2hleCIsImltcG9ydE91dHB1dHMiLCJvdXRwdXRzSGV4IiwibnVtX2ltcG9ydGVkIiwiZXhwb3J0S2V5SW1hZ2VzIiwicnBjRXhwb3J0S2V5SW1hZ2VzIiwiaW1wb3J0S2V5SW1hZ2VzIiwia2V5SW1hZ2VzIiwicnBjS2V5SW1hZ2VzIiwibWFwIiwia2V5SW1hZ2UiLCJrZXlfaW1hZ2UiLCJnZXRIZXgiLCJzaWduYXR1cmUiLCJnZXRTaWduYXR1cmUiLCJzaWduZWRfa2V5X2ltYWdlcyIsImltcG9ydFJlc3VsdCIsIk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0Iiwic2V0SGVpZ2h0Iiwic2V0U3BlbnRBbW91bnQiLCJzcGVudCIsInNldFVuc3BlbnRBbW91bnQiLCJ1bnNwZW50IiwiZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQiLCJmcmVlemVPdXRwdXQiLCJ0aGF3T3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJmcm96ZW4iLCJjcmVhdGVUeHMiLCJub3JtYWxpemVDcmVhdGVUeHNDb25maWciLCJnZXRDYW5TcGxpdCIsInNldENhblNwbGl0IiwiZ2V0UmVsYXkiLCJpc011bHRpc2lnIiwiZ2V0U3ViYWRkcmVzc0luZGljZXMiLCJzbGljZSIsImRlc3RpbmF0aW9ucyIsImRlc3RpbmF0aW9uIiwiZ2V0RGVzdGluYXRpb25zIiwiZ2V0QW1vdW50IiwiYW1vdW50IiwidG9TdHJpbmciLCJnZXRTdWJ0cmFjdEZlZUZyb20iLCJzdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzIiwic3ViYWRkcl9pbmRpY2VzIiwiZ2V0UGF5bWVudElkIiwiZ2V0VW5sb2NrVGltZSIsInVubG9ja190aW1lIiwiZG9fbm90X3JlbGF5IiwiZ2V0UHJpb3JpdHkiLCJwcmlvcml0eSIsImdldF90eF9oZXgiLCJnZXRfdHhfbWV0YWRhdGEiLCJnZXRfdHhfa2V5cyIsImdldF90eF9rZXkiLCJudW1UeHMiLCJmZWVfbGlzdCIsImZlZSIsImNvcHlEZXN0aW5hdGlvbnMiLCJpIiwiTW9uZXJvVHhXYWxsZXQiLCJpbml0U2VudFR4V2FsbGV0IiwiZ2V0T3V0Z29pbmdUcmFuc2ZlciIsInNldFN1YmFkZHJlc3NJbmRpY2VzIiwiY29udmVydFJwY1NlbnRUeHNUb1R4U2V0IiwiY29udmVydFJwY1R4VG9UeFNldCIsInN3ZWVwT3V0cHV0Iiwibm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWciLCJnZXRLZXlJbWFnZSIsInNldEFtb3VudCIsInN3ZWVwVW5sb2NrZWQiLCJub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnIiwiaW5kaWNlcyIsImtleXMiLCJzZXRTd2VlcEVhY2hTdWJhZGRyZXNzIiwiZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcyIsInJwY1N3ZWVwQWNjb3VudCIsInN3ZWVwRHVzdCIsInJlbGF5IiwidHhTZXQiLCJzZXRJc1JlbGF5ZWQiLCJzZXRJblR4UG9vbCIsImdldElzUmVsYXllZCIsInJlbGF5VHhzIiwidHhzT3JNZXRhZGF0YXMiLCJBcnJheSIsImlzQXJyYXkiLCJ0eE9yTWV0YWRhdGEiLCJtZXRhZGF0YSIsImdldE1ldGFkYXRhIiwiaGV4IiwidHhfaGFzaCIsImRlc2NyaWJlVHhTZXQiLCJ1bnNpZ25lZF90eHNldCIsImdldFVuc2lnbmVkVHhIZXgiLCJtdWx0aXNpZ190eHNldCIsImdldE11bHRpc2lnVHhIZXgiLCJjb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlciIsInNpZ25UeHMiLCJ1bnNpZ25lZFR4SGV4IiwiZXhwb3J0X3JhdyIsInN1Ym1pdFR4cyIsInNpZ25lZFR4SGV4IiwidHhfZGF0YV9oZXgiLCJ0eF9oYXNoX2xpc3QiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIlNJR05fV0lUSF9TUEVORF9LRVkiLCJkYXRhIiwic2lnbmF0dXJlX3R5cGUiLCJ2ZXJpZnlNZXNzYWdlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCIsImdvb2QiLCJpc0dvb2QiLCJpc09sZCIsIm9sZCIsIlNJR05fV0lUSF9WSUVXX0tFWSIsImdldFR4S2V5IiwidHhIYXNoIiwidHhpZCIsInR4X2tleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImNoZWNrIiwiTW9uZXJvQ2hlY2tUeCIsInNldElzR29vZCIsInNldE51bUNvbmZpcm1hdGlvbnMiLCJjb25maXJtYXRpb25zIiwiaW5fcG9vbCIsInNldFJlY2VpdmVkQW1vdW50IiwicmVjZWl2ZWQiLCJnZXRUeFByb29mIiwiY2hlY2tUeFByb29mIiwiZ2V0U3BlbmRQcm9vZiIsImNoZWNrU3BlbmRQcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJNb25lcm9DaGVja1Jlc2VydmUiLCJzZXRVbmNvbmZpcm1lZFNwZW50QW1vdW50Iiwic2V0VG90YWxBbW91bnQiLCJ0b3RhbCIsImdldFR4Tm90ZXMiLCJub3RlcyIsInNldFR4Tm90ZXMiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJlbnRyaWVzIiwicnBjRW50cnkiLCJNb25lcm9BZGRyZXNzQm9va0VudHJ5Iiwic2V0RGVzY3JpcHRpb24iLCJkZXNjcmlwdGlvbiIsImFkZEFkZHJlc3NCb29rRW50cnkiLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsInNldF9hZGRyZXNzIiwic2V0X2Rlc2NyaXB0aW9uIiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsInRhZ3MiLCJhY2NvdW50X3RhZ3MiLCJycGNBY2NvdW50VGFnIiwiTW9uZXJvQWNjb3VudFRhZyIsInNldEFjY291bnRUYWdMYWJlbCIsImdldFBheW1lbnRVcmkiLCJyZWNpcGllbnRfbmFtZSIsImdldFJlY2lwaWVudE5hbWUiLCJ0eF9kZXNjcmlwdGlvbiIsImdldE5vdGUiLCJ1cmkiLCJwYXJzZVBheW1lbnRVcmkiLCJNb25lcm9UeENvbmZpZyIsInNldFJlY2lwaWVudE5hbWUiLCJzZXROb3RlIiwiZ2V0QXR0cmlidXRlIiwidmFsdWUiLCJzZXRBdHRyaWJ1dGUiLCJ2YWwiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsInRocmVhZHNfY291bnQiLCJkb19iYWNrZ3JvdW5kX21pbmluZyIsImlnbm9yZV9iYXR0ZXJ5Iiwic3RvcE1pbmluZyIsImlzTXVsdGlzaWdJbXBvcnROZWVkZWQiLCJtdWx0aXNpZ19pbXBvcnRfbmVlZGVkIiwiZ2V0TXVsdGlzaWdJbmZvIiwiaW5mbyIsIk1vbmVyb011bHRpc2lnSW5mbyIsInNldElzTXVsdGlzaWciLCJtdWx0aXNpZyIsInNldElzUmVhZHkiLCJyZWFkeSIsInNldFRocmVzaG9sZCIsInRocmVzaG9sZCIsInNldE51bVBhcnRpY2lwYW50cyIsInByZXBhcmVNdWx0aXNpZyIsIm11bHRpc2lnX2luZm8iLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJtc1Jlc3VsdCIsIk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsInNldE11bHRpc2lnSGV4IiwiZ2V0TXVsdGlzaWdIZXgiLCJleHBvcnRNdWx0aXNpZ0hleCIsImltcG9ydE11bHRpc2lnSGV4Iiwibl9vdXRwdXRzIiwic2lnbk11bHRpc2lnVHhIZXgiLCJtdWx0aXNpZ1R4SGV4Iiwic2lnblJlc3VsdCIsIk1vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsInNldFNpZ25lZE11bHRpc2lnVHhIZXgiLCJzZXRUeEhhc2hlcyIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4IiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwib2xkX3Bhc3N3b3JkIiwibmV3X3Bhc3N3b3JkIiwic2F2ZSIsImNsb3NlIiwiaXNDbG9zZWQiLCJzdG9wIiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJnZXRPdXRnb2luZ1RyYW5zZmVycyIsImNyZWF0ZVR4IiwicmVsYXlUeCIsImdldFR4Tm90ZSIsInNldFR4Tm90ZSIsIm5vdGUiLCJjb25uZWN0VG9XYWxsZXRScGMiLCJ1cmlPckNvbmZpZyIsIm5vcm1hbGl6ZUNvbmZpZyIsImNtZCIsInN0YXJ0V2FsbGV0UnBjUHJvY2VzcyIsImNoaWxkX3Byb2Nlc3MiLCJQcm9taXNlIiwicmVzb2x2ZSIsInRoZW4iLCJzcGF3biIsInN0ZG91dCIsInNldEVuY29kaW5nIiwic3RkZXJyIiwidGhhdCIsInJlamVjdCIsIm9uIiwibGluZSIsIkxpYnJhcnlVdGlscyIsImxvZyIsInVyaUxpbmVDb250YWlucyIsInVyaUxpbmVDb250YWluc0lkeCIsImhvc3QiLCJzdWJzdHJpbmciLCJsYXN0SW5kZXhPZiIsInVuZm9ybWF0dGVkTGluZSIsInJlcGxhY2UiLCJ0cmltIiwicG9ydCIsInNzbElkeCIsInNzbEVuYWJsZWQiLCJ0b0xvd2VyQ2FzZSIsInVzZXJQYXNzSWR4IiwidXNlclBhc3MiLCJzZXRTZXJ2ZXIiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJnZXRSZWplY3RVbmF1dGhvcml6ZWQiLCJ3YWxsZXQiLCJpc1Jlc29sdmVkIiwiZ2V0TG9nTGV2ZWwiLCJjb2RlIiwib3JpZ2luIiwiZ2V0QWNjb3VudEluZGljZXMiLCJ0eFF1ZXJ5IiwiY2FuQmVDb25maXJtZWQiLCJnZXRJblR4UG9vbCIsImdldElzRmFpbGVkIiwiY2FuQmVJblR4UG9vbCIsImdldE1heEhlaWdodCIsImdldElzTG9ja2VkIiwiY2FuQmVJbmNvbWluZyIsImdldElzSW5jb21pbmciLCJnZXRJc091dGdvaW5nIiwiZ2V0SGFzRGVzdGluYXRpb25zIiwiY2FuQmVPdXRnb2luZyIsImluIiwib3V0IiwicG9vbCIsInBlbmRpbmciLCJmYWlsZWQiLCJnZXRNaW5IZWlnaHQiLCJtaW5faGVpZ2h0IiwibWF4X2hlaWdodCIsImZpbHRlcl9ieV9oZWlnaHQiLCJnZXRTdWJhZGRyZXNzSW5kZXgiLCJzaXplIiwiZnJvbSIsInJwY1R4IiwiY29udmVydFJwY1R4V2l0aFRyYW5zZmVyIiwiZ2V0T3V0Z29pbmdBbW91bnQiLCJvdXRnb2luZ1RyYW5zZmVyIiwidHJhbnNmZXJUb3RhbCIsInZhbHVlcyIsInNvcnQiLCJjb21wYXJlVHhzQnlIZWlnaHQiLCJzZXRJc0luY29taW5nIiwic2V0SXNPdXRnb2luZyIsImNvbXBhcmVJbmNvbWluZ1RyYW5zZmVycyIsInRyYW5zZmVyX3R5cGUiLCJnZXRJc1NwZW50IiwidmVyYm9zZSIsInJwY091dHB1dCIsImNvbnZlcnRScGNUeFdhbGxldFdpdGhPdXRwdXQiLCJjb21wYXJlT3V0cHV0cyIsInJwY0ltYWdlIiwiTW9uZXJvS2V5SW1hZ2UiLCJiZWxvd19hbW91bnQiLCJnZXRCZWxvd0Ftb3VudCIsInNldElzTG9ja2VkIiwic2V0SXNDb25maXJtZWQiLCJzZXRSZWxheSIsInNldElzTWluZXJUeCIsInNldElzRmFpbGVkIiwiTW9uZXJvRGVzdGluYXRpb24iLCJzZXREZXN0aW5hdGlvbnMiLCJzZXRPdXRnb2luZ1RyYW5zZmVyIiwic2V0VW5sb2NrVGltZSIsImdldExhc3RSZWxheWVkVGltZXN0YW1wIiwic2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJEYXRlIiwiZ2V0VGltZSIsImdldElzRG91YmxlU3BlbmRTZWVuIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJXYWxsZXRQb2xsZXIiLCJzZXRJc1BvbGxpbmciLCJpc1BvbGxpbmciLCJzZXJ2ZXIiLCJwcm94eVRvV29ya2VyIiwic2V0UHJpbWFyeUFkZHJlc3MiLCJzZXRUYWciLCJnZXRUYWciLCJzZXRSaW5nU2l6ZSIsIk1vbmVyb1V0aWxzIiwiUklOR19TSVpFIiwiTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciIsInNldFR4IiwiZGVzdENvcGllcyIsImRlc3QiLCJjb252ZXJ0UnBjVHhTZXQiLCJycGNNYXAiLCJNb25lcm9UeFNldCIsInNldE11bHRpc2lnVHhIZXgiLCJzZXRVbnNpZ25lZFR4SGV4Iiwic2V0U2lnbmVkVHhIZXgiLCJzaWduZWRfdHhzZXQiLCJnZXRTaWduZWRUeEhleCIsInJwY1R4cyIsInNldFR4cyIsInNldFR4U2V0Iiwic2V0SGFzaCIsInNldEtleSIsInNldEZ1bGxIZXgiLCJzZXRNZXRhZGF0YSIsInNldEZlZSIsInNldFdlaWdodCIsImlucHV0S2V5SW1hZ2VzTGlzdCIsImFzc2VydFRydWUiLCJnZXRJbnB1dHMiLCJzZXRJbnB1dHMiLCJpbnB1dEtleUltYWdlIiwiTW9uZXJvT3V0cHV0V2FsbGV0Iiwic2V0S2V5SW1hZ2UiLCJzZXRIZXgiLCJhbW91bnRzQnlEZXN0TGlzdCIsImRlc3RpbmF0aW9uSWR4IiwidHhJZHgiLCJhbW91bnRzQnlEZXN0IiwiaXNPdXRnb2luZyIsInR5cGUiLCJkZWNvZGVScGNUeXBlIiwiaGVhZGVyIiwic2V0U2l6ZSIsIk1vbmVyb0Jsb2NrSGVhZGVyIiwic2V0VGltZXN0YW1wIiwiTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsInNldE51bVN1Z2dlc3RlZENvbmZpcm1hdGlvbnMiLCJERUZBVUxUX1BBWU1FTlRfSUQiLCJycGNJbmRpY2VzIiwicnBjSW5kZXgiLCJzZXRTdWJhZGRyZXNzSW5kZXgiLCJycGNEZXN0aW5hdGlvbiIsImRlc3RpbmF0aW9uS2V5Iiwic2V0SW5wdXRTdW0iLCJzZXRPdXRwdXRTdW0iLCJzZXRDaGFuZ2VBZGRyZXNzIiwic2V0Q2hhbmdlQW1vdW50Iiwic2V0TnVtRHVtbXlPdXRwdXRzIiwic2V0RXh0cmFIZXgiLCJpbnB1dEtleUltYWdlcyIsImtleV9pbWFnZXMiLCJhbW91bnRzIiwic2V0QmxvY2siLCJNb25lcm9CbG9jayIsIm1lcmdlIiwic2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJzZXRJc1NwZW50Iiwic2V0SXNGcm96ZW4iLCJzZXRTdGVhbHRoUHVibGljS2V5Iiwic2V0T3V0cHV0cyIsInJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQiLCJycGNUeXBlIiwiYVR4IiwiYUJsb2NrIiwidHgxIiwidHgyIiwiZGlmZiIsInQxIiwidDIiLCJvMSIsIm8yIiwiaGVpZ2h0Q29tcGFyaXNvbiIsImNvbXBhcmUiLCJsb2NhbGVDb21wYXJlIiwiZXhwb3J0cyIsImxvb3BlciIsIlRhc2tMb29wZXIiLCJwcmV2TG9ja2VkVHhzIiwicHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucyIsInByZXZDb25maXJtZWROb3RpZmljYXRpb25zIiwidGhyZWFkUG9vbCIsIlRocmVhZFBvb2wiLCJudW1Qb2xsaW5nIiwic3RhcnQiLCJwZXJpb2RJbk1zIiwic3VibWl0IiwicHJldkhlaWdodCIsIk1vbmVyb1R4UXVlcnkiLCJwcmV2QmFsYW5jZXMiLCJvbk5ld0Jsb2NrIiwibWluSGVpZ2h0IiwibWF4IiwibG9ja2VkVHhzIiwic2V0TWluSGVpZ2h0Iiwic2V0SW5jbHVkZU91dHB1dHMiLCJub0xvbmdlckxvY2tlZEhhc2hlcyIsInByZXZMb2NrZWRUeCIsInVubG9ja2VkVHhzIiwic2V0SGFzaGVzIiwibG9ja2VkVHgiLCJzZWFyY2hTZXQiLCJ1bmFubm91bmNlZCIsIm5vdGlmeU91dHB1dHMiLCJ1bmxvY2tlZFR4IiwiZGVsZXRlIiwiY2hlY2tGb3JDaGFuZ2VkQmFsYW5jZXMiLCJnZXRGZWUiLCJvbk91dHB1dFNwZW50Iiwib25PdXRwdXRSZWNlaXZlZCIsImJhbGFuY2VzIiwib25CYWxhbmNlc0NoYW5nZWQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0UnBjLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuLi9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBUYXNrTG9vcGVyIGZyb20gXCIuLi9jb21tb24vVGFza0xvb3BlclwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnRUYWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFRhZ1wiO1xuaW1wb3J0IE1vbmVyb0FkZHJlc3NCb29rRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9CbG9ja0hlYWRlciBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrSGVhZGVyXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tSZXNlcnZlIGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrUmVzZXJ2ZVwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrVHggZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tUeFwiO1xuaW1wb3J0IE1vbmVyb0Rlc3RpbmF0aW9uIGZyb20gXCIuL21vZGVsL01vbmVyb0Rlc3RpbmF0aW9uXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0luY29taW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW5jb21pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5mb1wiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luaXRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0UXVlcnlcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9ScGNFcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvU3ViYWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJhZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvU3luY1Jlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TeW5jUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlclF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyUXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1R4V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0IGZyb20gXCIuL01vbmVyb1dhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRDb25maWdcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0XCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi4vY29tbW9uL1RocmVhZFBvb2xcIjtcbmltcG9ydCBTc2xPcHRpb25zIGZyb20gXCIuLi9jb21tb24vU3NsT3B0aW9uc1wiO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIHdvb2RzZXJcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb1dhbGxldCBhcyBhIGNsaWVudCBvZiBtb25lcm8td2FsbGV0LXJwYy5cbiAqIFxuICogQGltcGxlbWVudHMge01vbmVyb1dhbGxldH1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvV2FsbGV0UnBjIGV4dGVuZHMgTW9uZXJvV2FsbGV0IHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA9IDIwMDAwOyAvLyBkZWZhdWx0IHBlcmlvZCBiZXR3ZWVuIHN5bmNzIGluIG1zIChkZWZpbmVkIGJ5IERFRkFVTFRfQVVUT19SRUZSRVNIX1BFUklPRCBpbiB3YWxsZXRfcnBjX3NlcnZlci5jcHApXG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPjtcbiAgcHJvdGVjdGVkIGFkZHJlc3NDYWNoZTogYW55O1xuICBwcm90ZWN0ZWQgc3luY1BlcmlvZEluTXM6IG51bWJlcjtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXTtcbiAgcHJvdGVjdGVkIHByb2Nlc3M6IGFueTtcbiAgcHJvdGVjdGVkIHBhdGg6IHN0cmluZztcbiAgcHJvdGVjdGVkIGRhZW1vbkNvbm5lY3Rpb246IE1vbmVyb1JwY0Nvbm5lY3Rpb247XG4gIHByb3RlY3RlZCB3YWxsZXRQb2xsZXI6IFdhbGxldFBvbGxlcjtcbiAgXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTsgLy8gYXZvaWQgdW5lY2Vzc2FyeSByZXF1ZXN0cyBmb3IgYWRkcmVzc2VzXG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IE1vbmVyb1dhbGxldFJwYy5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBSUEMgV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtDaGlsZFByb2Nlc3N9IHRoZSBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMsIHVuZGVmaW5lZCBpZiBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXG4gICAqL1xuICBnZXRQcm9jZXNzKCk6IENoaWxkUHJvY2VzcyB7XG4gICAgcmV0dXJuIHRoaXMucHJvY2VzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3AgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm8td2FsbGV0LXJwYywgaWYgYXBwbGljYWJsZS5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2Ugc3BlY2lmaWVzIGlmIHRoZSBwcm9jZXNzIHNob3VsZCBiZSBkZXN0cm95ZWQgZm9yY2libHkgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPn0gdGhlIGV4aXQgY29kZSBmcm9tIHN0b3BwaW5nIHRoZSBwcm9jZXNzXG4gICAqL1xuICBhc3luYyBzdG9wUHJvY2Vzcyhmb3JjZSA9IGZhbHNlKTogUHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+ICB7XG4gICAgaWYgKHRoaXMucHJvY2VzcyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMgaW5zdGFuY2Ugbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1wiKTtcbiAgICBsZXQgbGlzdGVuZXJzQ29weSA9IEdlblV0aWxzLmNvcHlBcnJheSh0aGlzLmdldExpc3RlbmVycygpKTtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnNDb3B5KSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gR2VuVXRpbHMua2lsbFByb2Nlc3ModGhpcy5wcm9jZXNzLCBmb3JjZSA/IFwiU0lHS0lMTFwiIDogdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgUlBDIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9uIHwgdW5kZWZpbmVkfSB0aGUgd2FsbGV0J3MgcnBjIGNvbm5lY3Rpb25cbiAgICovXG4gIGdldFJwY0Nvbm5lY3Rpb24oKTogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+T3BlbiBhbiBleGlzdGluZyB3YWxsZXQgb24gdGhlIG1vbmVyby13YWxsZXQtcnBjIHNlcnZlci48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlOjxwPlxuICAgKiBcbiAgICogPGNvZGU+XG4gICAqIGxldCB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0UnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4NFwiLCBcInJwY191c2VyXCIsIFwiYWJjMTIzXCIpOzxicj5cbiAgICogYXdhaXQgd2FsbGV0Lm9wZW5XYWxsZXQoXCJteXdhbGxldDFcIiwgXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIpOzxicj5cbiAgICogPGJyPlxuICAgKiBhd2FpdCB3YWxsZXQub3BlbldhbGxldCh7PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGF0aDogXCJteXdhbGxldDJcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VydmVyOiBcImh0dHA6Ly9sb2NhaG9zdDozODA4MVwiLCAvLyBvciBvYmplY3Qgd2l0aCB1cmksIHVzZXJuYW1lLCBwYXNzd29yZCwgZXRjIDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2U8YnI+XG4gICAqIH0pOzxicj5cbiAgICogPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvV2FsbGV0Q29uZmlnfSBwYXRoT3JDb25maWcgIC0gdGhlIHdhbGxldCdzIG5hbWUgb3IgY29uZmlndXJhdGlvbiB0byBvcGVuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoT3JDb25maWcucGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCBpbi1tZW1vcnkgd2FsbGV0IGlmIG5vdCBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhPckNvbmZpZy5wYXNzd29yZCAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IHBhdGhPckNvbmZpZy5zZXJ2ZXIgLSB1cmkgb3IgTW9uZXJvUnBjQ29ubmVjdGlvbiBvZiBhIGRhZW1vbiB0byB1c2UgKG9wdGlvbmFsLCBtb25lcm8td2FsbGV0LXJwYyB1c3VhbGx5IHN0YXJ0ZWQgd2l0aCBkYWVtb24gY29uZmlnKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3Bhc3N3b3JkXSB0aGUgd2FsbGV0J3MgcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9XYWxsZXRScGM+fSB0aGlzIHdhbGxldCBjbGllbnRcbiAgICovXG4gIGFzeW5jIG9wZW5XYWxsZXQocGF0aE9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4sIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHR5cGVvZiBwYXRoT3JDb25maWcgPT09IFwic3RyaW5nXCIgPyB7cGF0aDogcGF0aE9yQ29uZmlnLCBwYXNzd29yZDogcGFzc3dvcmQgPyBwYXNzd29yZCA6IFwiXCJ9IDogcGF0aE9yQ29uZmlnKTtcbiAgICAvLyBUT0RPOiBlbnN1cmUgb3RoZXIgZmllbGRzIHVuaW5pdGlhbGl6ZWQ/XG4gICAgXG4gICAgLy8gb3BlbiB3YWxsZXQgb24gcnBjIHNlcnZlclxuICAgIGlmICghY29uZmlnLmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIG5hbWUgb2Ygd2FsbGV0IHRvIG9wZW5cIik7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwib3Blbl93YWxsZXRcIiwge2ZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLCBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCl9KTtcbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICBcbiAgICAvLyBzZXQgZGFlbW9uIGlmIHByb3ZpZGVkXG4gICAgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSkgYXdhaXQgdGhpcy5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZy5nZXRTZXJ2ZXIoKSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5DcmVhdGUgYW5kIG9wZW4gYSB3YWxsZXQgb24gdGhlIG1vbmVyby13YWxsZXQtcnBjIHNlcnZlci48cD5cbiAgICogXG4gICAqIDxwPkV4YW1wbGU6PHA+XG4gICAqIFxuICAgKiA8Y29kZT5cbiAgICogJnNvbDsmc29sOyBjb25zdHJ1Y3QgY2xpZW50IHRvIG1vbmVyby13YWxsZXQtcnBjPGJyPlxuICAgKiBsZXQgd2FsbGV0UnBjID0gbmV3IE1vbmVyb1dhbGxldFJwYyhcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODRcIiwgXCJycGNfdXNlclwiLCBcImFiYzEyM1wiKTs8YnI+PGJyPlxuICAgKiBcbiAgICogJnNvbDsmc29sOyBjcmVhdGUgYW5kIG9wZW4gd2FsbGV0IG9uIG1vbmVyby13YWxsZXQtcnBjPGJyPlxuICAgKiBhd2FpdCB3YWxsZXRScGMuY3JlYXRlV2FsbGV0KHs8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXRoOiBcIm15d2FsbGV0XCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiYWJjMTIzXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VlZDogXCJjb2V4aXN0IGlnbG9vIHBhbXBobGV0IGxhZ29vbi4uLlwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlc3RvcmVIZWlnaHQ6IDE1NDMyMThsPGJyPlxuICAgKiB9KTtcbiAgICogIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+fSBjb25maWcgLSBNb25lcm9XYWxsZXRDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF0aF0gLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhc3N3b3JkXSAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRdIC0gc2VlZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIHJhbmRvbSB3YWxsZXQgY3JlYXRlZCBpZiBuZWl0aGVyIHNlZWQgbm9yIGtleXMgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRPZmZzZXRdIC0gdGhlIG9mZnNldCB1c2VkIHRvIGRlcml2ZSBhIG5ldyBzZWVkIGZyb20gdGhlIGdpdmVuIHNlZWQgdG8gcmVjb3ZlciBhIHNlY3JldCB3YWxsZXQgZnJvbSB0aGUgc2VlZFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuaXNNdWx0aXNpZ10gLSByZXN0b3JlIG11bHRpc2lnIHdhbGxldCBmcm9tIHNlZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpbWFyeUFkZHJlc3NdIC0gcHJpbWFyeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmx5IHByb3ZpZGUgaWYgcmVzdG9yaW5nIGZyb20ga2V5cylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVZpZXdLZXldIC0gcHJpdmF0ZSB2aWV3IGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVTcGVuZEtleV0gLSBwcml2YXRlIHNwZW5kIGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnJlc3RvcmVIZWlnaHRdIC0gYmxvY2sgaGVpZ2h0IHRvIHN0YXJ0IHNjYW5uaW5nIGZyb20gKGRlZmF1bHRzIHRvIDAgdW5sZXNzIGdlbmVyYXRpbmcgcmFuZG9tIHdhbGxldClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcubGFuZ3VhZ2VdIC0gbGFuZ3VhZ2Ugb2YgdGhlIHdhbGxldCdzIG1uZW1vbmljIHBocmFzZSBvciBzZWVkIChkZWZhdWx0cyB0byBcIkVuZ2xpc2hcIiBvciBhdXRvLWRldGVjdGVkKVxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb259IFtjb25maWcuc2VydmVyXSAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gdG8gYSBtb25lcm8gZGFlbW9uIChvcHRpb25hbCk8YnI+XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclVyaV0gLSB1cmkgb2YgYSBkYWVtb24gdG8gdXNlIChvcHRpb25hbCwgbW9uZXJvLXdhbGxldC1ycGMgdXN1YWxseSBzdGFydGVkIHdpdGggZGFlbW9uIGNvbmZpZylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyVXNlcm5hbWVdIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIGRhZW1vbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlcnZlclBhc3N3b3JkXSAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBkYWVtb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSBbY29uZmlnLmNvbm5lY3Rpb25NYW5hZ2VyXSAtIG1hbmFnZSBjb25uZWN0aW9ucyB0byBtb25lcm9kIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlamVjdFVuYXV0aG9yaXplZF0gLSByZWplY3Qgc2VsZi1zaWduZWQgc2VydmVyIGNlcnRpZmljYXRlcyBpZiB0cnVlIChkZWZhdWx0cyB0byB0cnVlKVxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb259IFtjb25maWcuc2VydmVyXSAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb3IgZXF1aXZhbGVudCBKUyBvYmplY3QgcHJvdmlkaW5nIGRhZW1vbiBjb25maWd1cmF0aW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnNhdmVDdXJyZW50XSAtIHNwZWNpZmllcyBpZiB0aGUgY3VycmVudCBSUEMgd2FsbGV0IHNob3VsZCBiZSBzYXZlZCBiZWZvcmUgYmVpbmcgY2xvc2VkIChkZWZhdWx0IHRydWUpXG4gICAqIEByZXR1cm4ge01vbmVyb1dhbGxldFJwY30gdGhpcyB3YWxsZXQgY2xpZW50XG4gICAqL1xuICBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgY29uZmlnIHRvIGNyZWF0ZSB3YWxsZXRcIik7XG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCAmJiAoY29uZmlnTm9ybWFsaXplZC5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkKSkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBpbml0aWFsaXplZCB3aXRoIGEgc2VlZCBvciBrZXlzIGJ1dCBub3QgYm90aFwiKTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0TmV0d29ya1R5cGUoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBuZXR3b3JrVHlwZSB3aGVuIGNyZWF0aW5nIFJQQyB3YWxsZXQgYmVjYXVzZSBzZXJ2ZXIncyBuZXR3b3JrIHR5cGUgaXMgYWxyZWFkeSBzZXRcIik7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudExvb2thaGVhZCgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzTG9va2FoZWFkKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3Qgc3VwcG9ydCBjcmVhdGluZyB3YWxsZXRzIHdpdGggc3ViYWRkcmVzcyBsb29rYWhlYWQgb3ZlciBycGNcIik7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UGFzc3dvcmQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWdOb3JtYWxpemVkLnNldFBhc3N3b3JkKFwiXCIpO1xuXG4gICAgLy8gY3JlYXRlIHdhbGxldFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZ05vcm1hbGl6ZWQpO1xuICAgIGVsc2UgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWdOb3JtYWxpemVkKTtcbiAgICBlbHNlIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZ05vcm1hbGl6ZWQpO1xuXG4gICAgLy8gc2V0IGRhZW1vbiBvciBjb25uZWN0aW9uIG1hbmFnZXJcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBpbml0aWFsaXplZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBhd2FpdCB0aGlzLnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSk7XG4gICAgfSBlbHNlIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlcnZlcigpKSB7XG4gICAgICBhd2FpdCB0aGlzLnNldERhZW1vbkNvbm5lY3Rpb24oY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgcmVzdG9yZUhlaWdodCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSBmYWxzZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ3VycmVudCB3YWxsZXQgaXMgc2F2ZWQgYXV0b21hdGljYWxseSB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0UGF0aCgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOYW1lIGlzIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICBpZiAoIWNvbmZpZy5nZXRMYW5ndWFnZSgpKSBjb25maWcuc2V0TGFuZ3VhZ2UoTW9uZXJvV2FsbGV0LkRFRkFVTFRfTEFOR1VBR0UpO1xuICAgIGxldCBwYXJhbXMgPSB7IGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLCBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksIGxhbmd1YWdlOiBjb25maWcuZ2V0TGFuZ3VhZ2UoKSB9O1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjcmVhdGVfd2FsbGV0XCIsIHBhcmFtcyk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXN0b3JlX2RldGVybWluaXN0aWNfd2FsbGV0XCIsIHtcbiAgICAgICAgZmlsZW5hbWU6IGNvbmZpZy5nZXRQYXRoKCksXG4gICAgICAgIHBhc3N3b3JkOiBjb25maWcuZ2V0UGFzc3dvcmQoKSxcbiAgICAgICAgc2VlZDogY29uZmlnLmdldFNlZWQoKSxcbiAgICAgICAgc2VlZF9vZmZzZXQ6IGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCksXG4gICAgICAgIGVuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWw6IGNvbmZpZy5nZXRJc011bHRpc2lnKCksXG4gICAgICAgIHJlc3RvcmVfaGVpZ2h0OiBjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpLFxuICAgICAgICBsYW5ndWFnZTogY29uZmlnLmdldExhbmd1YWdlKCksXG4gICAgICAgIGF1dG9zYXZlX2N1cnJlbnQ6IGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhpcy5oYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihjb25maWcuZ2V0UGF0aCgpLCBlcnIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHdhbGxldCBmcm9tIGtleXNcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFJlc3RvcmVIZWlnaHQoMCk7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShNb25lcm9XYWxsZXQuREVGQVVMVF9MQU5HVUFHRSk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdlbmVyYXRlX2Zyb21fa2V5c1wiLCB7XG4gICAgICAgIGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLFxuICAgICAgICBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksXG4gICAgICAgIGFkZHJlc3M6IGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpLFxuICAgICAgICB2aWV3a2V5OiBjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSxcbiAgICAgICAgc3BlbmRrZXk6IGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSxcbiAgICAgICAgcmVzdG9yZV9oZWlnaHQ6IGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCksXG4gICAgICAgIGF1dG9zYXZlX2N1cnJlbnQ6IGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhpcy5oYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihjb25maWcuZ2V0UGF0aCgpLCBlcnIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKG5hbWUsIGVycikge1xuICAgIGlmIChlcnIubWVzc2FnZSA9PT0gXCJDYW5ub3QgY3JlYXRlIHdhbGxldC4gQWxyZWFkeSBleGlzdHMuXCIpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBuYW1lLCBlcnIuZ2V0Q29kZSgpLCBlcnIuZ2V0UnBjTWV0aG9kKCksIGVyci5nZXRScGNQYXJhbXMoKSk7XG4gICAgaWYgKGVyci5tZXNzYWdlID09PSBcIkVsZWN0cnVtLXN0eWxlIHdvcmQgbGlzdCBmYWlsZWQgdmVyaWZpY2F0aW9uXCIpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihcIkludmFsaWQgbW5lbW9uaWNcIiwgZXJyLmdldENvZGUoKSwgZXJyLmdldFJwY01ldGhvZCgpLCBlcnIuZ2V0UnBjUGFyYW1zKCkpO1xuICAgIHRocm93IGVycjtcbiAgfVxuICBcbiAgYXN5bmMgaXNWaWV3T25seSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHtrZXlfdHlwZTogXCJtbmVtb25pY1wifSk7XG4gICAgICByZXR1cm4gZmFsc2U7IC8vIGtleSByZXRyaWV2YWwgc3VjY2VlZHMgaWYgbm90IHZpZXcgb25seVxuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMjkpIHJldHVybiB0cnVlOyAgLy8gd2FsbGV0IGlzIHZpZXcgb25seVxuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMSkgcmV0dXJuIGZhbHNlOyAgLy8gd2FsbGV0IGlzIG9mZmxpbmUgYnV0IG5vdCB2aWV3IG9ubHlcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfE1vbmVyb1JwY0Nvbm5lY3Rpb259IFt1cmlPckNvbm5lY3Rpb25dIC0gdGhlIGRhZW1vbidzIFVSSSBvciBjb25uZWN0aW9uIChkZWZhdWx0cyB0byBvZmZsaW5lKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzVHJ1c3RlZCAtIGluZGljYXRlcyBpZiB0aGUgZGFlbW9uIGluIHRydXN0ZWRcbiAgICogQHBhcmFtIHtTc2xPcHRpb25zfSBzc2xPcHRpb25zIC0gY3VzdG9tIFNTTCBjb25maWd1cmF0aW9uXG4gICAqL1xuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbj86IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCBzdHJpbmcsIGlzVHJ1c3RlZD86IGJvb2xlYW4sIHNzbE9wdGlvbnM/OiBTc2xPcHRpb25zKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IGNvbm5lY3Rpb24gPSAhdXJpT3JDb25uZWN0aW9uID8gdW5kZWZpbmVkIDogdXJpT3JDb25uZWN0aW9uIGluc3RhbmNlb2YgTW9uZXJvUnBjQ29ubmVjdGlvbiA/IHVyaU9yQ29ubmVjdGlvbiA6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbik7XG4gICAgaWYgKCFzc2xPcHRpb25zKSBzc2xPcHRpb25zID0gbmV3IFNzbE9wdGlvbnMoKTtcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFVyaSgpIDogXCJiYWRfdXJpXCI7IC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IGJhZCBkYWVtb24gdXJpIG5lY2Vzc2FyeSBmb3Igb2ZmbGluZT9cbiAgICBwYXJhbXMudXNlcm5hbWUgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRVc2VybmFtZSgpIDogXCJcIjtcbiAgICBwYXJhbXMucGFzc3dvcmQgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRQYXNzd29yZCgpIDogXCJcIjtcbiAgICBwYXJhbXMudHJ1c3RlZCA9IGlzVHJ1c3RlZDtcbiAgICBwYXJhbXMuc3NsX3N1cHBvcnQgPSBcImF1dG9kZXRlY3RcIjtcbiAgICBwYXJhbXMuc3NsX3ByaXZhdGVfa2V5X3BhdGggPSBzc2xPcHRpb25zLmdldFByaXZhdGVLZXlQYXRoKCk7XG4gICAgcGFyYW1zLnNzbF9jZXJ0aWZpY2F0ZV9wYXRoICA9IHNzbE9wdGlvbnMuZ2V0Q2VydGlmaWNhdGVQYXRoKCk7XG4gICAgcGFyYW1zLnNzbF9jYV9maWxlID0gc3NsT3B0aW9ucy5nZXRDZXJ0aWZpY2F0ZUF1dGhvcml0eUZpbGUoKTtcbiAgICBwYXJhbXMuc3NsX2FsbG93ZWRfZmluZ2VycHJpbnRzID0gc3NsT3B0aW9ucy5nZXRBbGxvd2VkRmluZ2VycHJpbnRzKCk7XG4gICAgcGFyYW1zLnNzbF9hbGxvd19hbnlfY2VydCA9IHNzbE9wdGlvbnMuZ2V0QWxsb3dBbnlDZXJ0KCk7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2RhZW1vblwiLCBwYXJhbXMpO1xuICAgIHRoaXMuZGFlbW9uQ29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkNvbm5lY3Rpb24oKTogUHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPiB7XG4gICAgcmV0dXJuIHRoaXMuZGFlbW9uQ29ubmVjdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGxvY2tlZCBhbmQgdW5sb2NrZWQgYmFsYW5jZXMgaW4gYSBzaW5nbGUgcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbYWNjb3VudElkeF0gYWNjb3VudCBpbmRleFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N1YmFkZHJlc3NJZHhdIHN1YmFkZHJlc3MgaW5kZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxiaWdpbnRbXT59IGlzIHRoZSBsb2NrZWQgYW5kIHVubG9ja2VkIGJhbGFuY2VzIGluIGFuIGFycmF5LCByZXNwZWN0aXZlbHlcbiAgICovXG4gIGFzeW5jIGdldEJhbGFuY2VzKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludFtdPiB7XG4gICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0LmVxdWFsKHN1YmFkZHJlc3NJZHgsIHVuZGVmaW5lZCwgXCJNdXN0IHByb3ZpZGUgYWNjb3VudCBpbmRleCB3aXRoIHN1YmFkZHJlc3MgaW5kZXhcIik7XG4gICAgICBsZXQgYmFsYW5jZSA9IEJpZ0ludCgwKTtcbiAgICAgIGxldCB1bmxvY2tlZEJhbGFuY2UgPSBCaWdJbnQoMCk7XG4gICAgICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHRoaXMuZ2V0QWNjb3VudHMoKSkge1xuICAgICAgICBiYWxhbmNlID0gYmFsYW5jZSArIGFjY291bnQuZ2V0QmFsYW5jZSgpO1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2UgPSB1bmxvY2tlZEJhbGFuY2UgKyBhY2NvdW50LmdldFVubG9ja2VkQmFsYW5jZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFtiYWxhbmNlLCB1bmxvY2tlZEJhbGFuY2VdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcGFyYW1zID0ge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHgsIGFkZHJlc3NfaW5kaWNlczogc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogW3N1YmFkZHJlc3NJZHhdfTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwgcGFyYW1zKTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQpIHJldHVybiBbQmlnSW50KHJlc3AucmVzdWx0LmJhbGFuY2UpLCBCaWdJbnQocmVzcC5yZXN1bHQudW5sb2NrZWRfYmFsYW5jZSldO1xuICAgICAgZWxzZSByZXR1cm4gW0JpZ0ludChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzc1swXS5iYWxhbmNlKSwgQmlnSW50KHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzWzBdLnVubG9ja2VkX2JhbGFuY2UpXTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIENPTU1PTiBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvV2FsbGV0TGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhc3NlcnQobGlzdGVuZXIgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciwgXCJMaXN0ZW5lciBtdXN0IGJlIGluc3RhbmNlIG9mIE1vbmVyb1dhbGxldExpc3RlbmVyXCIpO1xuICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCBpZHggPSB0aGlzLmxpc3RlbmVycy5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICBpZiAoaWR4ID4gLTEpIHRoaXMubGlzdGVuZXJzLnNwbGljZShpZHgsIDEpO1xuICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB3YWxsZXRcIik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGdldExpc3RlbmVycygpOiBNb25lcm9XYWxsZXRMaXN0ZW5lcltdIHtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZXNlcnZlUHJvb2YoYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpLCBcIlwiLCBcIlwiKTsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBwcm92aWRlIGJldHRlciB3YXkgdG8ga25vdyBpZiB3YWxsZXQgcnBjIGlzIGNvbm5lY3RlZCB0byBkYWVtb25cbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcImNoZWNrIHJlc2VydmUgZXhwZWN0ZWQgdG8gZmFpbFwiKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIHJldHVybiBlLm1lc3NhZ2UuaW5kZXhPZihcIkZhaWxlZCB0byBjb25uZWN0IHRvIGRhZW1vblwiKSA8IDA7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3ZlcnNpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9WZXJzaW9uKHJlc3AucmVzdWx0LnZlcnNpb24sIHJlc3AucmVzdWx0LnJlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMucGF0aDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwibW5lbW9uaWNcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2UoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoYXdhaXQgdGhpcy5nZXRTZWVkKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMuZ2V0U2VlZExhbmd1YWdlKCkgbm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBsaXN0IG9mIGF2YWlsYWJsZSBsYW5ndWFnZXMgZm9yIHRoZSB3YWxsZXQncyBzZWVkLlxuICAgKiBcbiAgICogQHJldHVybiB7c3RyaW5nW119IHRoZSBhdmFpbGFibGUgbGFuZ3VhZ2VzIGZvciB0aGUgd2FsbGV0J3Mgc2VlZC5cbiAgICovXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZXMoKSB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfbGFuZ3VhZ2VzXCIpKS5yZXN1bHQubGFuZ3VhZ2VzO1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwidmlld19rZXlcIiB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQua2V5O1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7IGtleV90eXBlOiBcInNwZW5kX2tleVwiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBzdWJhZGRyZXNzTWFwID0gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF07XG4gICAgaWYgKCFzdWJhZGRyZXNzTWFwKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHRydWUpOyAgLy8gY2FjaGUncyBhbGwgYWRkcmVzc2VzIGF0IHRoaXMgYWNjb3VudFxuICAgICAgcmV0dXJuIHRoaXMuZ2V0QWRkcmVzcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTsgICAgICAgIC8vIHJlY3Vyc2l2ZSBjYWxsIHVzZXMgY2FjaGVcbiAgICB9XG4gICAgbGV0IGFkZHJlc3MgPSBzdWJhZGRyZXNzTWFwW3N1YmFkZHJlc3NJZHhdO1xuICAgIGlmICghYWRkcmVzcykge1xuICAgICAgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgdW5kZWZpbmVkLCB0cnVlKTsgIC8vIGNhY2hlJ3MgYWxsIGFkZHJlc3NlcyBhdCB0aGlzIGFjY291bnRcbiAgICAgIHJldHVybiB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XVtzdWJhZGRyZXNzSWR4XTtcbiAgICB9XG4gICAgcmV0dXJuIGFkZHJlc3M7XG4gIH1cbiAgXG4gIC8vIFRPRE86IHVzZSBjYWNoZVxuICBhc3luYyBnZXRBZGRyZXNzSW5kZXgoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggcmVzdWx0IGFuZCBub3JtYWxpemUgZXJyb3IgaWYgYWRkcmVzcyBkb2VzIG5vdCBiZWxvbmcgdG8gdGhlIHdhbGxldFxuICAgIGxldCByZXNwO1xuICAgIHRyeSB7XG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NfaW5kZXhcIiwge2FkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTIpIHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29udmVydCBycGMgcmVzcG9uc2VcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKHthZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWFqb3IpO1xuICAgIHN1YmFkZHJlc3Muc2V0SW5kZXgocmVzcC5yZXN1bHQuaW5kZXgubWlub3IpO1xuICAgIHJldHVybiBzdWJhZGRyZXNzO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3M/OiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IGludGVncmF0ZWRBZGRyZXNzU3RyID0gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfaW50ZWdyYXRlZF9hZGRyZXNzXCIsIHtzdGFuZGFyZF9hZGRyZXNzOiBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRfaWQ6IHBheW1lbnRJZH0pKS5yZXN1bHQuaW50ZWdyYXRlZF9hZGRyZXNzO1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3NTdHIpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUubWVzc2FnZS5pbmNsdWRlcyhcIkludmFsaWQgcGF5bWVudCBJRFwiKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBwYXltZW50IElEOiBcIiArIHBheW1lbnRJZCk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNwbGl0X2ludGVncmF0ZWRfYWRkcmVzc1wiLCB7aW50ZWdyYXRlZF9hZGRyZXNzOiBpbnRlZ3JhdGVkQWRkcmVzc30pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoKS5zZXRTdGFuZGFyZEFkZHJlc3MocmVzcC5yZXN1bHQuc3RhbmRhcmRfYWRkcmVzcykuc2V0UGF5bWVudElkKHJlc3AucmVzdWx0LnBheW1lbnRfaWQpLnNldEludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfaGVpZ2h0XCIpKS5yZXN1bHQuaGVpZ2h0O1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGdldHRpbmcgdGhlIGNoYWluIGhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF5OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGluZyBhIGhlaWdodCBieSBkYXRlXCIpO1xuICB9XG4gIFxuICBhc3luYyBzeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodD86IE1vbmVyb1dhbGxldExpc3RlbmVyIHwgbnVtYmVyLCBzdGFydEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvU3luY1Jlc3VsdD4ge1xuICAgIGFzc2VydCghKGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyKSwgXCJNb25lcm8gV2FsbGV0IFJQQyBkb2VzIG5vdCBzdXBwb3J0IHJlcG9ydGluZyBzeW5jIHByb2dyZXNzXCIpO1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlZnJlc2hcIiwge3N0YXJ0X2hlaWdodDogc3RhcnRIZWlnaHR9LCAwKTtcbiAgICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3AucmVzdWx0LmJsb2Nrc19mZXRjaGVkLCByZXNwLnJlc3VsdC5yZWNlaXZlZF9tb25leSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZSA9PT0gXCJubyBjb25uZWN0aW9uIHRvIGRhZW1vblwiKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXM/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBcbiAgICAvLyBjb252ZXJ0IG1zIHRvIHNlY29uZHMgZm9yIHJwYyBwYXJhbWV0ZXJcbiAgICBsZXQgc3luY1BlcmlvZEluU2Vjb25kcyA9IE1hdGgucm91bmQoKHN5bmNQZXJpb2RJbk1zID09PSB1bmRlZmluZWQgPyBNb25lcm9XYWxsZXRScGMuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA6IHN5bmNQZXJpb2RJbk1zKSAvIDEwMDApO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhdXRvX3JlZnJlc2hcIiwge1xuICAgICAgZW5hYmxlOiB0cnVlLFxuICAgICAgcGVyaW9kOiBzeW5jUGVyaW9kSW5TZWNvbmRzXG4gICAgfSk7XG4gICAgXG4gICAgLy8gdXBkYXRlIHN5bmMgcGVyaW9kIGZvciBwb2xsZXJcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gc3luY1BlcmlvZEluU2Vjb25kcyAqIDEwMDA7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyICE9PSB1bmRlZmluZWQpIHRoaXMud2FsbGV0UG9sbGVyLnNldFBlcmlvZEluTXMoc3luY1BlcmlvZEluTXMpO1xuICAgIFxuICAgIC8vIHBvbGwgaWYgbGlzdGVuaW5nXG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gIH1cblxuICBnZXRTeW5jUGVyaW9kSW5NcygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnN5bmNQZXJpb2RJbk1zO1xuICB9XG4gIFxuICBhc3luYyBzdG9wU3luY2luZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiYXV0b19yZWZyZXNoXCIsIHsgZW5hYmxlOiBmYWxzZSB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXR4SGFzaGVzIHx8ICF0eEhhc2hlcy5sZW5ndGgpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vIHR4IGhhc2hlcyBnaXZlbiB0byBzY2FuXCIpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNjYW5fdHhcIiwge3R4aWRzOiB0eEhhc2hlc30pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5TcGVudCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXNjYW5fc3BlbnRcIiwgdW5kZWZpbmVkLCAwKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZXNjYW5fYmxvY2tjaGFpblwiLCB1bmRlZmluZWQsIDApO1xuICB9XG4gIFxuICBhc3luYyBnZXRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYWxhbmNlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSlbMF07XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0QmFsYW5jZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkpWzFdO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbiwgdGFnPzogc3RyaW5nLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50W10+IHtcbiAgICBcbiAgICAvLyBmZXRjaCBhY2NvdW50cyBmcm9tIHJwY1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FjY291bnRzXCIsIHt0YWc6IHRhZ30pO1xuICAgIFxuICAgIC8vIGJ1aWxkIGFjY291bnQgb2JqZWN0cyBhbmQgZmV0Y2ggc3ViYWRkcmVzc2VzIHBlciBhY2NvdW50IHVzaW5nIGdldF9hZGRyZXNzXG4gICAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogZ2V0X2FkZHJlc3Mgc2hvdWxkIHN1cHBvcnQgYWxsX2FjY291bnRzIHNvIG5vdCBjYWxsZWQgb25jZSBwZXIgYWNjb3VudFxuICAgIGxldCBhY2NvdW50czogTW9uZXJvQWNjb3VudFtdID0gW107XG4gICAgZm9yIChsZXQgcnBjQWNjb3VudCBvZiByZXNwLnJlc3VsdC5zdWJhZGRyZXNzX2FjY291bnRzKSB7XG4gICAgICBsZXQgYWNjb3VudCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjQWNjb3VudChycGNBY2NvdW50KTtcbiAgICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzKSBhY2NvdW50LnNldFN1YmFkZHJlc3Nlcyhhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50LmdldEluZGV4KCksIHVuZGVmaW5lZCwgdHJ1ZSkpO1xuICAgICAgYWNjb3VudHMucHVzaChhY2NvdW50KTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIG1lcmdlIGZpZWxkcyBmcm9tIGdldF9iYWxhbmNlIGFjcm9zcyBhbGwgYWNjb3VudHNcbiAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcyAmJiAhc2tpcEJhbGFuY2VzKSB7XG4gICAgICBcbiAgICAgIC8vIHRoZXNlIGZpZWxkcyBhcmUgbm90IGluaXRpYWxpemVkIGlmIHN1YmFkZHJlc3MgaXMgdW51c2VkIGFuZCB0aGVyZWZvcmUgbm90IHJldHVybmVkIGZyb20gYGdldF9iYWxhbmNlYFxuICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiBhY2NvdW50cykge1xuICAgICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoMCk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jaygwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBmZXRjaCBhbmQgbWVyZ2UgaW5mbyBmcm9tIGdldF9iYWxhbmNlXG4gICAgICByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbGFuY2VcIiwge2FsbF9hY2NvdW50czogdHJ1ZX0pO1xuICAgICAgaWYgKHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgIGZvciAobGV0IHJwY1N1YmFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzcyA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBtZXJnZSBpbmZvXG4gICAgICAgICAgbGV0IGFjY291bnQgPSBhY2NvdW50c1tzdWJhZGRyZXNzLmdldEFjY291bnRJbmRleCgpXTtcbiAgICAgICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzcy5nZXRBY2NvdW50SW5kZXgoKSwgYWNjb3VudC5nZXRJbmRleCgpLCBcIlJQQyBhY2NvdW50cyBhcmUgb3V0IG9mIG9yZGVyXCIpOyAgLy8gd291bGQgbmVlZCB0byBzd2l0Y2ggbG9va3VwIHRvIGxvb3BcbiAgICAgICAgICBsZXQgdGd0U3ViYWRkcmVzcyA9IGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKClbc3ViYWRkcmVzcy5nZXRJbmRleCgpXTtcbiAgICAgICAgICBhc3NlcnQuZXF1YWwoc3ViYWRkcmVzcy5nZXRJbmRleCgpLCB0Z3RTdWJhZGRyZXNzLmdldEluZGV4KCksIFwiUlBDIHN1YmFkZHJlc3NlcyBhcmUgb3V0IG9mIG9yZGVyXCIpO1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkpO1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkpO1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cyhzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBhY2NvdW50cztcbiAgfVxuICBcbiAgLy8gVE9ETzogZ2V0QWNjb3VudEJ5SW5kZXgoKSwgZ2V0QWNjb3VudEJ5VGFnKClcbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgYXNzZXJ0KGFjY291bnRJZHggPj0gMCk7XG4gICAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCB0aGlzLmdldEFjY291bnRzKCkpIHtcbiAgICAgIGlmIChhY2NvdW50LmdldEluZGV4KCkgPT09IGFjY291bnRJZHgpIHtcbiAgICAgICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMpIGFjY291bnQuc2V0U3ViYWRkcmVzc2VzKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHVuZGVmaW5lZCwgc2tpcEJhbGFuY2VzKSk7XG4gICAgICAgIHJldHVybiBhY2NvdW50O1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBY2NvdW50IHdpdGggaW5kZXggXCIgKyBhY2NvdW50SWR4ICsgXCIgZG9lcyBub3QgZXhpc3RcIik7XG4gIH1cblxuICBhc3luYyBjcmVhdGVBY2NvdW50KGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgbGFiZWwgPSBsYWJlbCA/IGxhYmVsIDogdW5kZWZpbmVkO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX2FjY291bnRcIiwge2xhYmVsOiBsYWJlbH0pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvQWNjb3VudCh7XG4gICAgICBpbmRleDogcmVzcC5yZXN1bHQuYWNjb3VudF9pbmRleCxcbiAgICAgIHByaW1hcnlBZGRyZXNzOiByZXNwLnJlc3VsdC5hZGRyZXNzLFxuICAgICAgbGFiZWw6IGxhYmVsLFxuICAgICAgYmFsYW5jZTogQmlnSW50KDApLFxuICAgICAgdW5sb2NrZWRCYWxhbmNlOiBCaWdJbnQoMClcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJbmRpY2VzPzogbnVtYmVyW10sIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3NbXT4ge1xuICAgIFxuICAgIC8vIGZldGNoIHN1YmFkZHJlc3Nlc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gYWNjb3VudElkeDtcbiAgICBpZiAoc3ViYWRkcmVzc0luZGljZXMpIHBhcmFtcy5hZGRyZXNzX2luZGV4ID0gR2VuVXRpbHMubGlzdGlmeShzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc1wiLCBwYXJhbXMpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgc3ViYWRkcmVzc2VzXG4gICAgbGV0IHN1YmFkZHJlc3NlcyA9IFtdO1xuICAgIGZvciAobGV0IHJwY1N1YmFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQuYWRkcmVzc2VzKSB7XG4gICAgICBsZXQgc3ViYWRkcmVzcyA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKTtcbiAgICAgIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgc3ViYWRkcmVzc2VzLnB1c2goc3ViYWRkcmVzcyk7XG4gICAgfVxuICAgIFxuICAgIC8vIGZldGNoIGFuZCBpbml0aWFsaXplIHN1YmFkZHJlc3MgYmFsYW5jZXNcbiAgICBpZiAoIXNraXBCYWxhbmNlcykge1xuICAgICAgXG4gICAgICAvLyB0aGVzZSBmaWVsZHMgYXJlIG5vdCBpbml0aWFsaXplZCBpZiBzdWJhZGRyZXNzIGlzIHVudXNlZCBhbmQgdGhlcmVmb3JlIG5vdCByZXR1cm5lZCBmcm9tIGBnZXRfYmFsYW5jZWBcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQoMCkpO1xuICAgICAgICBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKDApO1xuICAgICAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgICAgfVxuXG4gICAgICAvLyBmZXRjaCBhbmQgaW5pdGlhbGl6ZSBiYWxhbmNlc1xuICAgICAgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIsIHBhcmFtcyk7XG4gICAgICBpZiAocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgZm9yIChsZXQgcnBjU3ViYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIHRyYW5zZmVyIGluZm8gdG8gZXhpc3Rpbmcgc3ViYWRkcmVzcyBvYmplY3RcbiAgICAgICAgICBmb3IgKGxldCB0Z3RTdWJhZGRyZXNzIG9mIHN1YmFkZHJlc3Nlcykge1xuICAgICAgICAgICAgaWYgKHRndFN1YmFkZHJlc3MuZ2V0SW5kZXgoKSAhPT0gc3ViYWRkcmVzcy5nZXRJbmRleCgpKSBjb250aW51ZTsgLy8gc2tpcCB0byBzdWJhZGRyZXNzIHdpdGggc2FtZSBpbmRleFxuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0QmFsYW5jZShzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cyhzdWJhZGRyZXNzLmdldE51bVVuc3BlbnRPdXRwdXRzKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKHN1YmFkZHJlc3MuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIGFkZHJlc3Nlc1xuICAgIGxldCBzdWJhZGRyZXNzTWFwID0gdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF07XG4gICAgaWYgKCFzdWJhZGRyZXNzTWFwKSB7XG4gICAgICBzdWJhZGRyZXNzTWFwID0ge307XG4gICAgICB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XSA9IHN1YmFkZHJlc3NNYXA7XG4gICAgfVxuICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2Ygc3ViYWRkcmVzc2VzKSB7XG4gICAgICBzdWJhZGRyZXNzTWFwW3N1YmFkZHJlc3MuZ2V0SW5kZXgoKV0gPSBzdWJhZGRyZXNzLmdldEFkZHJlc3MoKTtcbiAgICB9XG4gICAgXG4gICAgLy8gcmV0dXJuIHJlc3VsdHNcbiAgICByZXR1cm4gc3ViYWRkcmVzc2VzO1xuICB9XG5cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlciwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIGFzc2VydChhY2NvdW50SWR4ID49IDApO1xuICAgIGFzc2VydChzdWJhZGRyZXNzSWR4ID49IDApO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgW3N1YmFkZHJlc3NJZHhdLCBza2lwQmFsYW5jZXMpKVswXTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX2FkZHJlc3NcIiwge2FjY291bnRfaW5kZXg6IGFjY291bnRJZHgsIGxhYmVsOiBsYWJlbH0pO1xuICAgIFxuICAgIC8vIGJ1aWxkIHN1YmFkZHJlc3Mgb2JqZWN0XG4gICAgbGV0IHN1YmFkZHJlc3MgPSBuZXcgTW9uZXJvU3ViYWRkcmVzcygpO1xuICAgIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgIHN1YmFkZHJlc3Muc2V0SW5kZXgocmVzcC5yZXN1bHQuYWRkcmVzc19pbmRleCk7XG4gICAgc3ViYWRkcmVzcy5zZXRBZGRyZXNzKHJlc3AucmVzdWx0LmFkZHJlc3MpO1xuICAgIHN1YmFkZHJlc3Muc2V0TGFiZWwobGFiZWwgPyBsYWJlbCA6IHVuZGVmaW5lZCk7XG4gICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgc3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKDApO1xuICAgIHN1YmFkZHJlc3Muc2V0SXNVc2VkKGZhbHNlKTtcbiAgICBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKDApO1xuICAgIHJldHVybiBzdWJhZGRyZXNzO1xuICB9XG5cbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibGFiZWxfYWRkcmVzc1wiLCB7aW5kZXg6IHttYWpvcjogYWNjb3VudElkeCwgbWlub3I6IHN1YmFkZHJlc3NJZHh9LCBsYWJlbDogbGFiZWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5Pzogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gY29weSBxdWVyeVxuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyB0ZW1wb3JhcmlseSBkaXNhYmxlIHRyYW5zZmVyIGFuZCBvdXRwdXQgcXVlcmllcyBpbiBvcmRlciB0byBjb2xsZWN0IGFsbCB0eCBpbmZvcm1hdGlvblxuICAgIGxldCB0cmFuc2ZlclF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldFRyYW5zZmVyUXVlcnkoKTtcbiAgICBsZXQgaW5wdXRRdWVyeSA9IHF1ZXJ5Tm9ybWFsaXplZC5nZXRJbnB1dFF1ZXJ5KCk7XG4gICAgbGV0IG91dHB1dFF1ZXJ5ID0gcXVlcnlOb3JtYWxpemVkLmdldE91dHB1dFF1ZXJ5KCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldFRyYW5zZmVyUXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SW5wdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRPdXRwdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIGZldGNoIGFsbCB0cmFuc2ZlcnMgdGhhdCBtZWV0IHR4IHF1ZXJ5XG4gICAgbGV0IHRyYW5zZmVycyA9IGF3YWl0IHRoaXMuZ2V0VHJhbnNmZXJzQXV4KG5ldyBNb25lcm9UcmFuc2ZlclF1ZXJ5KCkuc2V0VHhRdWVyeShNb25lcm9XYWxsZXRScGMuZGVjb250ZXh0dWFsaXplKHF1ZXJ5Tm9ybWFsaXplZC5jb3B5KCkpKSk7XG4gICAgXG4gICAgLy8gY29sbGVjdCB1bmlxdWUgdHhzIGZyb20gdHJhbnNmZXJzIHdoaWxlIHJldGFpbmluZyBvcmRlclxuICAgIGxldCB0eHMgPSBbXTtcbiAgICBsZXQgdHhzU2V0ID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHRyYW5zZmVycykge1xuICAgICAgaWYgKCF0eHNTZXQuaGFzKHRyYW5zZmVyLmdldFR4KCkpKSB7XG4gICAgICAgIHR4cy5wdXNoKHRyYW5zZmVyLmdldFR4KCkpO1xuICAgICAgICB0eHNTZXQuYWRkKHRyYW5zZmVyLmdldFR4KCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB0eXBlcyBpbnRvIG1hcHMgZm9yIG1lcmdpbmcgYW5kIGxvb2t1cFxuICAgIGxldCB0eE1hcCA9IHt9O1xuICAgIGxldCBibG9ja01hcCA9IHt9O1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGZldGNoIGFuZCBtZXJnZSBvdXRwdXRzIGlmIHJlcXVlc3RlZFxuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SW5jbHVkZU91dHB1dHMoKSB8fCBvdXRwdXRRdWVyeSkge1xuICAgICAgICBcbiAgICAgIC8vIGZldGNoIG91dHB1dHNcbiAgICAgIGxldCBvdXRwdXRRdWVyeUF1eCA9IChvdXRwdXRRdWVyeSA/IG91dHB1dFF1ZXJ5LmNvcHkoKSA6IG5ldyBNb25lcm9PdXRwdXRRdWVyeSgpKS5zZXRUeFF1ZXJ5KE1vbmVyb1dhbGxldFJwYy5kZWNvbnRleHR1YWxpemUocXVlcnlOb3JtYWxpemVkLmNvcHkoKSkpO1xuICAgICAgbGV0IG91dHB1dHMgPSBhd2FpdCB0aGlzLmdldE91dHB1dHNBdXgob3V0cHV0UXVlcnlBdXgpO1xuICAgICAgXG4gICAgICAvLyBtZXJnZSBvdXRwdXQgdHhzIG9uZSB0aW1lIHdoaWxlIHJldGFpbmluZyBvcmRlclxuICAgICAgbGV0IG91dHB1dFR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIG91dHB1dHMpIHtcbiAgICAgICAgaWYgKCFvdXRwdXRUeHMuaW5jbHVkZXMob3V0cHV0LmdldFR4KCkpKSB7XG4gICAgICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgob3V0cHV0LmdldFR4KCksIHR4TWFwLCBibG9ja01hcCk7XG4gICAgICAgICAgb3V0cHV0VHhzLnB1c2gob3V0cHV0LmdldFR4KCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHJlc3RvcmUgdHJhbnNmZXIgYW5kIG91dHB1dCBxdWVyaWVzXG4gICAgcXVlcnlOb3JtYWxpemVkLnNldFRyYW5zZmVyUXVlcnkodHJhbnNmZXJRdWVyeSk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldElucHV0UXVlcnkoaW5wdXRRdWVyeSk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldE91dHB1dFF1ZXJ5KG91dHB1dFF1ZXJ5KTtcbiAgICBcbiAgICAvLyBmaWx0ZXIgdHhzIHRoYXQgZG9uJ3QgbWVldCB0cmFuc2ZlciBxdWVyeVxuICAgIGxldCB0eHNRdWVyaWVkID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBpZiAocXVlcnlOb3JtYWxpemVkLm1lZXRzQ3JpdGVyaWEodHgpKSB0eHNRdWVyaWVkLnB1c2godHgpO1xuICAgICAgZWxzZSBpZiAodHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB0eC5nZXRCbG9jaygpLmdldFR4cygpLnNwbGljZSh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpLCAxKTtcbiAgICB9XG4gICAgdHhzID0gdHhzUXVlcmllZDtcbiAgICBcbiAgICAvLyBzcGVjaWFsIGNhc2U6IHJlLWZldGNoIHR4cyBpZiBpbmNvbnNpc3RlbmN5IGNhdXNlZCBieSBuZWVkaW5nIHRvIG1ha2UgbXVsdGlwbGUgcnBjIGNhbGxzXG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSAmJiB0eC5nZXRCbG9jaygpID09PSB1bmRlZmluZWQgfHwgIXR4LmdldElzQ29uZmlybWVkKCkgJiYgdHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJJbmNvbnNpc3RlbmN5IGRldGVjdGVkIGJ1aWxkaW5nIHR4cyBmcm9tIG11bHRpcGxlIHJwYyBjYWxscywgcmUtZmV0Y2hpbmcgdHhzXCIpO1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRUeHMocXVlcnlOb3JtYWxpemVkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gb3JkZXIgdHhzIGlmIHR4IGhhc2hlcyBnaXZlbiB0aGVuIHJldHVyblxuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkgJiYgcXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpLmxlbmd0aCA+IDApIHtcbiAgICAgIGxldCB0eHNCeUlkID0gbmV3IE1hcCgpICAvLyBzdG9yZSB0eHMgaW4gdGVtcG9yYXJ5IG1hcCBmb3Igc29ydGluZ1xuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB0eHNCeUlkLnNldCh0eC5nZXRIYXNoKCksIHR4KTtcbiAgICAgIGxldCBvcmRlcmVkVHhzID0gW107XG4gICAgICBmb3IgKGxldCBoYXNoIG9mIHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKSkgaWYgKHR4c0J5SWQuZ2V0KGhhc2gpKSBvcmRlcmVkVHhzLnB1c2godHhzQnlJZC5nZXQoaGFzaCkpO1xuICAgICAgdHhzID0gb3JkZXJlZFR4cztcbiAgICB9XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHJhbnNmZXJbXT4ge1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBnZXQgdHJhbnNmZXJzIGRpcmVjdGx5IGlmIHF1ZXJ5IGRvZXMgbm90IHJlcXVpcmUgdHggY29udGV4dCAob3RoZXIgdHJhbnNmZXJzLCBvdXRwdXRzKVxuICAgIGlmICghTW9uZXJvV2FsbGV0UnBjLmlzQ29udGV4dHVhbChxdWVyeU5vcm1hbGl6ZWQpKSByZXR1cm4gdGhpcy5nZXRUcmFuc2ZlcnNBdXgocXVlcnlOb3JtYWxpemVkKTtcbiAgICBcbiAgICAvLyBvdGhlcndpc2UgZ2V0IHR4cyB3aXRoIGZ1bGwgbW9kZWxzIHRvIGZ1bGZpbGwgcXVlcnlcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5nZXRUeHMocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKSkpIHtcbiAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmZpbHRlclRyYW5zZmVycyhxdWVyeU5vcm1hbGl6ZWQpKSB7XG4gICAgICAgIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvT3V0cHV0UXVlcnk+KTogUHJvbWlzZTxNb25lcm9PdXRwdXRXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gZ2V0IG91dHB1dHMgZGlyZWN0bHkgaWYgcXVlcnkgZG9lcyBub3QgcmVxdWlyZSB0eCBjb250ZXh0IChvdGhlciBvdXRwdXRzLCB0cmFuc2ZlcnMpXG4gICAgaWYgKCFNb25lcm9XYWxsZXRScGMuaXNDb250ZXh0dWFsKHF1ZXJ5Tm9ybWFsaXplZCkpIHJldHVybiB0aGlzLmdldE91dHB1dHNBdXgocXVlcnlOb3JtYWxpemVkKTtcbiAgICBcbiAgICAvLyBvdGhlcndpc2UgZ2V0IHR4cyB3aXRoIGZ1bGwgbW9kZWxzIHRvIGZ1bGZpbGwgcXVlcnlcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMuZ2V0VHhzKHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkpKSB7XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZmlsdGVyT3V0cHV0cyhxdWVyeU5vcm1hbGl6ZWQpKSB7XG4gICAgICAgIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfb3V0cHV0c1wiLCB7YWxsOiBhbGx9KSkucmVzdWx0Lm91dHB1dHNfZGF0YV9oZXg7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE91dHB1dHMob3V0cHV0c0hleDogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9vdXRwdXRzXCIsIHtvdXRwdXRzX2RhdGFfaGV4OiBvdXRwdXRzSGV4fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm51bV9pbXBvcnRlZDtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucnBjRXhwb3J0S2V5SW1hZ2VzKGFsbCk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydEtleUltYWdlcyhrZXlJbWFnZXM6IE1vbmVyb0tleUltYWdlW10pOiBQcm9taXNlPE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0PiB7XG4gICAgXG4gICAgLy8gY29udmVydCBrZXkgaW1hZ2VzIHRvIHJwYyBwYXJhbWV0ZXJcbiAgICBsZXQgcnBjS2V5SW1hZ2VzID0ga2V5SW1hZ2VzLm1hcChrZXlJbWFnZSA9PiAoe2tleV9pbWFnZToga2V5SW1hZ2UuZ2V0SGV4KCksIHNpZ25hdHVyZToga2V5SW1hZ2UuZ2V0U2lnbmF0dXJlKCl9KSk7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbXBvcnRfa2V5X2ltYWdlc1wiLCB7c2lnbmVkX2tleV9pbWFnZXM6IHJwY0tleUltYWdlc30pO1xuICAgIFxuICAgIC8vIGJ1aWxkIGFuZCByZXR1cm4gcmVzdWx0XG4gICAgbGV0IGltcG9ydFJlc3VsdCA9IG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCgpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRIZWlnaHQocmVzcC5yZXN1bHQuaGVpZ2h0KTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0U3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnNwZW50KSk7XG4gICAgaW1wb3J0UmVzdWx0LnNldFVuc3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnVuc3BlbnQpKTtcbiAgICByZXR1cm4gaW1wb3J0UmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5ycGNFeHBvcnRLZXlJbWFnZXMoZmFsc2UpO1xuICB9XG4gIFxuICBhc3luYyBmcmVlemVPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmcmVlemVcIiwge2tleV9pbWFnZToga2V5SW1hZ2V9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGhhd091dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInRoYXdcIiwge2tleV9pbWFnZToga2V5SW1hZ2V9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZnJvemVuXCIsIHtrZXlfaW1hZ2U6IGtleUltYWdlfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmZyb3plbiA9PT0gdHJ1ZTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSwgY29weSwgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRDYW5TcGxpdCh0cnVlKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpID09PSB0cnVlICYmIGF3YWl0IHRoaXMuaXNNdWx0aXNpZygpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcmVsYXkgbXVsdGlzaWcgdHJhbnNhY3Rpb24gdW50aWwgY28tc2lnbmVkXCIpO1xuXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3NlcyB0byBzZW5kIGZyb21cbiAgICBsZXQgYWNjb3VudElkeCA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHRoZSBhY2NvdW50IGluZGV4IHRvIHNlbmQgZnJvbVwiKTtcbiAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5zbGljZSgwKTsgLy8gZmV0Y2ggYWxsIG9yIGNvcHkgZ2l2ZW4gaW5kaWNlc1xuICAgIFxuICAgIC8vIGJ1aWxkIGNvbmZpZyBwYXJhbWV0ZXJzXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmRlc3RpbmF0aW9ucyA9IFtdO1xuICAgIGZvciAobGV0IGRlc3RpbmF0aW9uIG9mIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0RGVzdGluYXRpb25zKCkpIHtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIFwiRGVzdGluYXRpb24gYWRkcmVzcyBpcyBub3QgZGVmaW5lZFwiKTtcbiAgICAgIGFzc2VydChkZXN0aW5hdGlvbi5nZXRBbW91bnQoKSwgXCJEZXN0aW5hdGlvbiBhbW91bnQgaXMgbm90IGRlZmluZWRcIik7XG4gICAgICBwYXJhbXMuZGVzdGluYXRpb25zLnB1c2goeyBhZGRyZXNzOiBkZXN0aW5hdGlvbi5nZXRBZGRyZXNzKCksIGFtb3VudDogZGVzdGluYXRpb24uZ2V0QW1vdW50KCkudG9TdHJpbmcoKSB9KTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkpIHBhcmFtcy5zdWJ0cmFjdF9mZWVfZnJvbV9vdXRwdXRzID0gY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IHN1YmFkZHJlc3NJbmRpY2VzO1xuICAgIHBhcmFtcy5wYXltZW50X2lkID0gY29uZmlnTm9ybWFsaXplZC5nZXRQYXltZW50SWQoKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRVbmxvY2tUaW1lKCkgIT09IHVuZGVmaW5lZCkgcGFyYW1zLnVubG9ja190aW1lID0gY29uZmlnTm9ybWFsaXplZC5nZXRVbmxvY2tUaW1lKCkudG9TdHJpbmcoKVxuICAgIHBhcmFtcy5kb19ub3RfcmVsYXkgPSBjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkgIT09IHRydWU7XG4gICAgYXNzZXJ0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKSA+PSAwICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UHJpb3JpdHkoKSA8PSAzKTtcbiAgICBwYXJhbXMucHJpb3JpdHkgPSBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCk7XG4gICAgcGFyYW1zLmdldF90eF9oZXggPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfbWV0YWRhdGEgPSB0cnVlO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkpIHBhcmFtcy5nZXRfdHhfa2V5cyA9IHRydWU7IC8vIHBhcmFtIHRvIGdldCB0eCBrZXkocykgZGVwZW5kcyBpZiBzcGxpdFxuICAgIGVsc2UgcGFyYW1zLmdldF90eF9rZXkgPSB0cnVlO1xuXG4gICAgLy8gY2Fubm90IGFwcGx5IHN1YnRyYWN0RmVlRnJvbSB3aXRoIGB0cmFuc2Zlcl9zcGxpdGAgY2FsbFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKSAmJiBjb25maWdOb3JtYWxpemVkLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcInN1YnRyYWN0ZmVlZnJvbSB0cmFuc2ZlcnMgY2Fubm90IGJlIHNwbGl0IG92ZXIgbXVsdGlwbGUgdHJhbnNhY3Rpb25zIHlldFwiKTtcbiAgICB9XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3VsdDtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpID8gXCJ0cmFuc2Zlcl9zcGxpdFwiIDogXCJ0cmFuc2ZlclwiLCBwYXJhbXMpO1xuICAgICAgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIubWVzc2FnZS5pbmRleE9mKFwiV0FMTEVUX1JQQ19FUlJPUl9DT0RFX1dST05HX0FERFJFU1NcIikgPiAtMSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBkZXN0aW5hdGlvbiBhZGRyZXNzXCIpO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgICBcbiAgICAvLyBwcmUtaW5pdGlhbGl6ZSB0eHMgaWZmIHByZXNlbnQuIG11bHRpc2lnIGFuZCB2aWV3LW9ubHkgd2FsbGV0cyB3aWxsIGhhdmUgdHggc2V0IHdpdGhvdXQgdHJhbnNhY3Rpb25zXG4gICAgbGV0IHR4cztcbiAgICBsZXQgbnVtVHhzID0gY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpID8gKHJlc3VsdC5mZWVfbGlzdCAhPT0gdW5kZWZpbmVkID8gcmVzdWx0LmZlZV9saXN0Lmxlbmd0aCA6IDApIDogKHJlc3VsdC5mZWUgIT09IHVuZGVmaW5lZCA/IDEgOiAwKTtcbiAgICBpZiAobnVtVHhzID4gMCkgdHhzID0gW107XG4gICAgbGV0IGNvcHlEZXN0aW5hdGlvbnMgPSBudW1UeHMgPT09IDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UeHM7IGkrKykge1xuICAgICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgICBNb25lcm9XYWxsZXRScGMuaW5pdFNlbnRUeFdhbGxldChjb25maWdOb3JtYWxpemVkLCB0eCwgY29weURlc3RpbmF0aW9ucyk7XG4gICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJbmRpY2VzICE9PSB1bmRlZmluZWQgJiYgc3ViYWRkcmVzc0luZGljZXMubGVuZ3RoID09PSAxKSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0U3ViYWRkcmVzc0luZGljZXMoc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgdHhzLnB1c2godHgpO1xuICAgIH1cbiAgICBcbiAgICAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkpIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggc2V0IGZyb20gcnBjIHJlc3BvbnNlIHdpdGggcHJlLWluaXRpYWxpemVkIHR4c1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkpIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCwgdHhzLCBjb25maWdOb3JtYWxpemVkKS5nZXRUeHMoKTtcbiAgICBlbHNlIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4VG9UeFNldChyZXN1bHQsIHR4cyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdHhzWzBdLCB0cnVlLCBjb25maWdOb3JtYWxpemVkKS5nZXRUeHMoKTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBPdXRwdXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyhjb25maWcpO1xuICAgIFxuICAgIC8vIGJ1aWxkIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5hZGRyZXNzID0gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCk7XG4gICAgcGFyYW1zLmtleV9pbWFnZSA9IGNvbmZpZy5nZXRLZXlJbWFnZSgpO1xuICAgIGlmIChjb25maWcuZ2V0VW5sb2NrVGltZSgpICE9PSB1bmRlZmluZWQpIHBhcmFtcy51bmxvY2tfdGltZSA9IGNvbmZpZy5nZXRVbmxvY2tUaW1lKCk7XG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpICE9PSB0cnVlO1xuICAgIGFzc2VydChjb25maWcuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnLmdldFByaW9yaXR5KCk7XG4gICAgcGFyYW1zLnBheW1lbnRfaWQgPSBjb25maWcuZ2V0UGF5bWVudElkKCk7XG4gICAgcGFyYW1zLmdldF90eF9rZXkgPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN3ZWVwX3NpbmdsZVwiLCBwYXJhbXMpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBcbiAgICAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIGlmIChjb25maWcuZ2V0UmVsYXkoKSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgXG4gICAgLy8gYnVpbGQgYW5kIHJldHVybiB0eFxuICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5pbml0U2VudFR4V2FsbGV0KGNvbmZpZywgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4VG9UeFNldChyZXN1bHQsIHR4LCB0cnVlLCBjb25maWcpO1xuICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKVswXS5zZXRBbW91bnQodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFtb3VudCgpKTsgLy8gaW5pdGlhbGl6ZSBkZXN0aW5hdGlvbiBhbW91bnRcbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwVW5sb2NrZWQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBzd2VlcDsgZGVmYXVsdCB0byBhbGwgd2l0aCB1bmxvY2tlZCBiYWxhbmNlIGlmIG5vdCBzcGVjaWZpZWRcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBNYXAoKTsgIC8vIG1hcHMgZWFjaCBhY2NvdW50IGluZGV4IHRvIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBzd2VlcFxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpbmRpY2VzLnNldChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpLCBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgICAgIGluZGljZXMuc2V0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0QWNjb3VudEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3Nlcyhjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpKSkge1xuICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpID4gMG4pIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgYWNjb3VudHMgPSBhd2FpdCB0aGlzLmdldEFjY291bnRzKHRydWUpO1xuICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiBhY2NvdW50cykge1xuICAgICAgICBpZiAoYWNjb3VudC5nZXRVbmxvY2tlZEJhbGFuY2UoKSA+IDBuKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgICAgICAgaW5kaWNlcy5zZXQoYWNjb3VudC5nZXRJbmRleCgpLCBzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpKSB7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSA+IDBuKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHN3ZWVwIGZyb20gZWFjaCBhY2NvdW50IGFuZCBjb2xsZWN0IHJlc3VsdGluZyB0eCBzZXRzXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGZvciAobGV0IGFjY291bnRJZHggb2YgaW5kaWNlcy5rZXlzKCkpIHtcbiAgICAgIFxuICAgICAgLy8gY29weSBhbmQgbW9kaWZ5IHRoZSBvcmlnaW5hbCBjb25maWdcbiAgICAgIGxldCBjb3B5ID0gY29uZmlnTm9ybWFsaXplZC5jb3B5KCk7XG4gICAgICBjb3B5LnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIGNvcHkuc2V0U3dlZXBFYWNoU3ViYWRkcmVzcyhmYWxzZSk7XG4gICAgICBcbiAgICAgIC8vIHN3ZWVwIGFsbCBzdWJhZGRyZXNzZXMgdG9nZXRoZXIgIC8vIFRPRE8gbW9uZXJvLXByb2plY3Q6IGNhbiB0aGlzIHJldmVhbCBvdXRwdXRzIGJlbG9uZyB0byB0aGUgc2FtZSB3YWxsZXQ/XG4gICAgICBpZiAoY29weS5nZXRTd2VlcEVhY2hTdWJhZGRyZXNzKCkgIT09IHRydWUpIHtcbiAgICAgICAgY29weS5zZXRTdWJhZGRyZXNzSW5kaWNlcyhpbmRpY2VzLmdldChhY2NvdW50SWR4KSk7XG4gICAgICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMucnBjU3dlZXBBY2NvdW50KGNvcHkpKSB0eHMucHVzaCh0eCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIG90aGVyd2lzZSBzd2VlcCBlYWNoIHN1YmFkZHJlc3MgaW5kaXZpZHVhbGx5XG4gICAgICBlbHNlIHtcbiAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzc0lkeCBvZiBpbmRpY2VzLmdldChhY2NvdW50SWR4KSkge1xuICAgICAgICAgIGNvcHkuc2V0U3ViYWRkcmVzc0luZGljZXMoW3N1YmFkZHJlc3NJZHhdKTtcbiAgICAgICAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLnJwY1N3ZWVwQWNjb3VudChjb3B5KSkgdHhzLnB1c2godHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSBvZiBjaGFuZ2VzXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSkgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5PzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmIChyZWxheSA9PT0gdW5kZWZpbmVkKSByZWxheSA9IGZhbHNlO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfZHVzdFwiLCB7ZG9fbm90X3JlbGF5OiAhcmVsYXl9KTtcbiAgICBpZiAocmVsYXkpIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCk7XG4gICAgaWYgKHR4U2V0LmdldFR4cygpID09PSB1bmRlZmluZWQpIHJldHVybiBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkge1xuICAgICAgdHguc2V0SXNSZWxheWVkKCFyZWxheSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0eC5nZXRJc1JlbGF5ZWQoKSk7XG4gICAgfVxuICAgIHJldHVybiB0eFNldC5nZXRUeHMoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHModHhzT3JNZXRhZGF0YXM6IChNb25lcm9UeFdhbGxldCB8IHN0cmluZylbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eHNPck1ldGFkYXRhcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBvciB0aGVpciBtZXRhZGF0YSB0byByZWxheVwiKTtcbiAgICBsZXQgdHhIYXNoZXMgPSBbXTtcbiAgICBmb3IgKGxldCB0eE9yTWV0YWRhdGEgb2YgdHhzT3JNZXRhZGF0YXMpIHtcbiAgICAgIGxldCBtZXRhZGF0YSA9IHR4T3JNZXRhZGF0YSBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0ID8gdHhPck1ldGFkYXRhLmdldE1ldGFkYXRhKCkgOiB0eE9yTWV0YWRhdGE7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlbGF5X3R4XCIsIHsgaGV4OiBtZXRhZGF0YSB9KTtcbiAgICAgIHR4SGFzaGVzLnB1c2gocmVzcC5yZXN1bHQudHhfaGFzaCk7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMucG9sbCgpOyAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIHJldHVybiB0eEhhc2hlcztcbiAgfVxuICBcbiAgYXN5bmMgZGVzY3JpYmVUeFNldCh0eFNldDogTW9uZXJvVHhTZXQpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJkZXNjcmliZV90cmFuc2ZlclwiLCB7XG4gICAgICB1bnNpZ25lZF90eHNldDogdHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpLFxuICAgICAgbXVsdGlzaWdfdHhzZXQ6IHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKVxuICAgIH0pO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY0Rlc2NyaWJlVHJhbnNmZXIocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25fdHJhbnNmZXJcIiwge1xuICAgICAgdW5zaWduZWRfdHhzZXQ6IHVuc2lnbmVkVHhIZXgsXG4gICAgICBleHBvcnRfcmF3OiBmYWxzZVxuICAgIH0pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfdHJhbnNmZXJcIiwge1xuICAgICAgdHhfZGF0YV9oZXg6IHNpZ25lZFR4SGV4XG4gICAgfSk7XG4gICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBzaWduYXR1cmVUeXBlID0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgYWNjb3VudElkeCA9IDAsIHN1YmFkZHJlc3NJZHggPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNpZ25cIiwge1xuICAgICAgICBkYXRhOiBtZXNzYWdlLFxuICAgICAgICBzaWduYXR1cmVfdHlwZTogc2lnbmF0dXJlVHlwZSA9PT0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA/IFwic3BlbmRcIiA6IFwidmlld1wiLFxuICAgICAgICBhY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LFxuICAgICAgICBhZGRyZXNzX2luZGV4OiBzdWJhZGRyZXNzSWR4XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQ+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ2ZXJpZnlcIiwge2RhdGE6IG1lc3NhZ2UsIGFkZHJlc3M6IGFkZHJlc3MsIHNpZ25hdHVyZTogc2lnbmF0dXJlfSk7XG4gICAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQoXG4gICAgICAgIHJlc3VsdC5nb29kID8ge2lzR29vZDogcmVzdWx0Lmdvb2QsIGlzT2xkOiByZXN1bHQub2xkLCBzaWduYXR1cmVUeXBlOiByZXN1bHQuc2lnbmF0dXJlX3R5cGUgPT09IFwidmlld1wiID8gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1ZJRVdfS0VZIDogTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgdmVyc2lvbjogcmVzdWx0LnZlcnNpb259IDoge2lzR29vZDogZmFsc2V9XG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMikgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KHtpc0dvb2Q6IGZhbHNlfSk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9rZXlcIiwge3R4aWQ6IHR4SGFzaH0pKS5yZXN1bHQudHhfa2V5O1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaDogc3RyaW5nLCB0eEtleTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfdHhfa2V5XCIsIHt0eGlkOiB0eEhhc2gsIHR4X2tleTogdHhLZXksIGFkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICAgIFxuICAgICAgLy8gaW50ZXJwcmV0IHJlc3VsdFxuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZCh0cnVlKTtcbiAgICAgIGNoZWNrLnNldE51bUNvbmZpcm1hdGlvbnMocmVzcC5yZXN1bHQuY29uZmlybWF0aW9ucyk7XG4gICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgIGNoZWNrLnNldFJlY2VpdmVkQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5yZWNlaXZlZCkpO1xuICAgICAgcmV0dXJuIGNoZWNrO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9wcm9vZlwiLCB7dHhpZDogdHhIYXNoLCBhZGRyZXNzOiBhZGRyZXNzLCBtZXNzYWdlOiBtZXNzYWdlfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGVja190eF9wcm9vZlwiLCB7XG4gICAgICAgIHR4aWQ6IHR4SGFzaCxcbiAgICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlOiBzaWduYXR1cmVcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBpbnRlcnByZXQgcmVzcG9uc2VcbiAgICAgIGxldCBpc0dvb2QgPSByZXNwLnJlc3VsdC5nb29kO1xuICAgICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrVHgoKTtcbiAgICAgIGNoZWNrLnNldElzR29vZChpc0dvb2QpO1xuICAgICAgaWYgKGlzR29vZCkge1xuICAgICAgICBjaGVjay5zZXROdW1Db25maXJtYXRpb25zKHJlc3AucmVzdWx0LmNvbmZpcm1hdGlvbnMpO1xuICAgICAgICBjaGVjay5zZXRJblR4UG9vbChyZXNwLnJlc3VsdC5pbl9wb29sKTtcbiAgICAgICAgY2hlY2suc2V0UmVjZWl2ZWRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnJlY2VpdmVkKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2hlY2s7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtMSAmJiBlLm1lc3NhZ2UgPT09IFwiYmFzaWNfc3RyaW5nXCIpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJNdXN0IHByb3ZpZGUgc2lnbmF0dXJlIHRvIGNoZWNrIHR4IHByb29mXCIsIC0xKTtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfc3BlbmRfcHJvb2ZcIiwge3R4aWQ6IHR4SGFzaCwgbWVzc2FnZTogbWVzc2FnZX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfc3BlbmRfcHJvb2ZcIiwge1xuICAgICAgICB0eGlkOiB0eEhhc2gsXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC5nb29kO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTggJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiVFggSUQgaGFzIGludmFsaWQgZm9ybWF0XCIpKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiVFggaGFzaCBoYXMgaW52YWxpZCBmb3JtYXRcIiwgZS5nZXRDb2RlKCksIGUuZ2V0UnBjTWV0aG9kKCksIGUuZ2V0UnBjUGFyYW1zKCkpOyAgLy8gbm9ybWFsaXplIGVycm9yIG1lc3NhZ2VcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhbGw6IHRydWUsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGFtb3VudDogYmlnaW50LCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9yZXNlcnZlX3Byb29mXCIsIHtcbiAgICAgIGFjY291bnRfaW5kZXg6IGFjY291bnRJZHgsXG4gICAgICBhbW91bnQ6IGFtb3VudC50b1N0cmluZygpLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gIH1cblxuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT4ge1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgfSk7XG4gICAgXG4gICAgLy8gaW50ZXJwcmV0IHJlc3VsdHNcbiAgICBsZXQgaXNHb29kID0gcmVzcC5yZXN1bHQuZ29vZDtcbiAgICBsZXQgY2hlY2sgPSBuZXcgTW9uZXJvQ2hlY2tSZXNlcnZlKCk7XG4gICAgY2hlY2suc2V0SXNHb29kKGlzR29vZCk7XG4gICAgaWYgKGlzR29vZCkge1xuICAgICAgY2hlY2suc2V0VW5jb25maXJtZWRTcGVudEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQuc3BlbnQpKTtcbiAgICAgIGNoZWNrLnNldFRvdGFsQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC50b3RhbCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hlY2s7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3R4X25vdGVzXCIsIHt0eGlkczogdHhIYXNoZXN9KSkucmVzdWx0Lm5vdGVzO1xuICB9XG4gIFxuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSwgbm90ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X3R4X25vdGVzXCIsIHt0eGlkczogdHhIYXNoZXMsIG5vdGVzOiBub3Rlc30pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb0FkZHJlc3NCb29rRW50cnlbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NfYm9va1wiLCB7ZW50cmllczogZW50cnlJbmRpY2VzfSk7XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5lbnRyaWVzKSByZXR1cm4gW107XG4gICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNFbnRyeSBvZiByZXNwLnJlc3VsdC5lbnRyaWVzKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb0FkZHJlc3NCb29rRW50cnkoKS5zZXRJbmRleChycGNFbnRyeS5pbmRleCkuc2V0QWRkcmVzcyhycGNFbnRyeS5hZGRyZXNzKS5zZXREZXNjcmlwdGlvbihycGNFbnRyeS5kZXNjcmlwdGlvbikuc2V0UGF5bWVudElkKHJwY0VudHJ5LnBheW1lbnRfaWQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzczogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJhZGRfYWRkcmVzc19ib29rXCIsIHthZGRyZXNzOiBhZGRyZXNzLCBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb259KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuaW5kZXg7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4OiBudW1iZXIsIHNldEFkZHJlc3M6IGJvb2xlYW4sIGFkZHJlc3M6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2V0RGVzY3JpcHRpb246IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImVkaXRfYWRkcmVzc19ib29rXCIsIHtcbiAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgIHNldF9hZGRyZXNzOiBzZXRBZGRyZXNzLFxuICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgIHNldF9kZXNjcmlwdGlvbjogc2V0RGVzY3JpcHRpb24sXG4gICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZGVsZXRlX2FkZHJlc3NfYm9va1wiLCB7aW5kZXg6IGVudHJ5SWR4fSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRhZ0FjY291bnRzKHRhZywgYWNjb3VudEluZGljZXMpIHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ0YWdfYWNjb3VudHNcIiwge3RhZzogdGFnLCBhY2NvdW50czogYWNjb3VudEluZGljZXN9KTtcbiAgfVxuXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidW50YWdfYWNjb3VudHNcIiwge2FjY291bnRzOiBhY2NvdW50SW5kaWNlc30pO1xuICB9XG5cbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICBsZXQgdGFncyA9IFtdO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FjY291bnRfdGFnc1wiKTtcbiAgICBpZiAocmVzcC5yZXN1bHQuYWNjb3VudF90YWdzKSB7XG4gICAgICBmb3IgKGxldCBycGNBY2NvdW50VGFnIG9mIHJlc3AucmVzdWx0LmFjY291bnRfdGFncykge1xuICAgICAgICB0YWdzLnB1c2gobmV3IE1vbmVyb0FjY291bnRUYWcoe1xuICAgICAgICAgIHRhZzogcnBjQWNjb3VudFRhZy50YWcgPyBycGNBY2NvdW50VGFnLnRhZyA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBsYWJlbDogcnBjQWNjb3VudFRhZy5sYWJlbCA/IHJwY0FjY291bnRUYWcubGFiZWwgOiB1bmRlZmluZWQsXG4gICAgICAgICAgYWNjb3VudEluZGljZXM6IHJwY0FjY291bnRUYWcuYWNjb3VudHNcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFncztcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9hY2NvdW50X3RhZ19kZXNjcmlwdGlvblwiLCB7dGFnOiB0YWcsIGRlc2NyaXB0aW9uOiBsYWJlbH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXltZW50VXJpKGNvbmZpZzogTW9uZXJvVHhDb25maWcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfdXJpXCIsIHtcbiAgICAgIGFkZHJlc3M6IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksXG4gICAgICBhbW91bnQ6IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSA/IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKS50b1N0cmluZygpIDogdW5kZWZpbmVkLFxuICAgICAgcGF5bWVudF9pZDogY29uZmlnLmdldFBheW1lbnRJZCgpLFxuICAgICAgcmVjaXBpZW50X25hbWU6IGNvbmZpZy5nZXRSZWNpcGllbnROYW1lKCksXG4gICAgICB0eF9kZXNjcmlwdGlvbjogY29uZmlnLmdldE5vdGUoKVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC51cmk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmk6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhDb25maWc+IHtcbiAgICBhc3NlcnQodXJpLCBcIk11c3QgcHJvdmlkZSBVUkkgdG8gcGFyc2VcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJwYXJzZV91cmlcIiwge3VyaTogdXJpfSk7XG4gICAgbGV0IGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyh7YWRkcmVzczogcmVzcC5yZXN1bHQudXJpLmFkZHJlc3MsIGFtb3VudDogQmlnSW50KHJlc3AucmVzdWx0LnVyaS5hbW91bnQpfSk7XG4gICAgY29uZmlnLnNldFBheW1lbnRJZChyZXNwLnJlc3VsdC51cmkucGF5bWVudF9pZCk7XG4gICAgY29uZmlnLnNldFJlY2lwaWVudE5hbWUocmVzcC5yZXN1bHQudXJpLnJlY2lwaWVudF9uYW1lKTtcbiAgICBjb25maWcuc2V0Tm90ZShyZXNwLnJlc3VsdC51cmkudHhfZGVzY3JpcHRpb24pO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpKSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uc2V0QWRkcmVzcyh1bmRlZmluZWQpO1xuICAgIGlmIChcIlwiID09PSBjb25maWcuZ2V0UGF5bWVudElkKCkpIGNvbmZpZy5zZXRQYXltZW50SWQodW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldFJlY2lwaWVudE5hbWUoKSkgY29uZmlnLnNldFJlY2lwaWVudE5hbWUodW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldE5vdGUoKSkgY29uZmlnLnNldE5vdGUodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gY29uZmlnO1xuICB9XG4gIFxuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hdHRyaWJ1dGVcIiwge2tleToga2V5fSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQudmFsdWUgPT09IFwiXCIgPyB1bmRlZmluZWQgOiByZXNwLnJlc3VsdC52YWx1ZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC00NSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBzZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcsIHZhbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2F0dHJpYnV0ZVwiLCB7a2V5OiBrZXksIHZhbHVlOiB2YWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcobnVtVGhyZWFkczogbnVtYmVyLCBiYWNrZ3JvdW5kTWluaW5nPzogYm9vbGVhbiwgaWdub3JlQmF0dGVyeT86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdGFydF9taW5pbmdcIiwge1xuICAgICAgdGhyZWFkc19jb3VudDogbnVtVGhyZWFkcyxcbiAgICAgIGRvX2JhY2tncm91bmRfbWluaW5nOiBiYWNrZ3JvdW5kTWluaW5nLFxuICAgICAgaWdub3JlX2JhdHRlcnk6IGlnbm9yZUJhdHRlcnlcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9wX21pbmluZ1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5tdWx0aXNpZ19pbXBvcnRfbmVlZGVkID09PSB0cnVlO1xuICB9XG4gIFxuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luZm8+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImlzX211bHRpc2lnXCIpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgaW5mbyA9IG5ldyBNb25lcm9NdWx0aXNpZ0luZm8oKTtcbiAgICBpbmZvLnNldElzTXVsdGlzaWcocmVzdWx0Lm11bHRpc2lnKTtcbiAgICBpbmZvLnNldElzUmVhZHkocmVzdWx0LnJlYWR5KTtcbiAgICBpbmZvLnNldFRocmVzaG9sZChyZXN1bHQudGhyZXNob2xkKTtcbiAgICBpbmZvLnNldE51bVBhcnRpY2lwYW50cyhyZXN1bHQudG90YWwpO1xuICAgIHJldHVybiBpbmZvO1xuICB9XG4gIFxuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInByZXBhcmVfbXVsdGlzaWdcIiwge2VuYWJsZV9tdWx0aXNpZ19leHBlcmltZW50YWw6IHRydWV9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICByZXR1cm4gcmVzdWx0Lm11bHRpc2lnX2luZm87XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgdGhyZXNob2xkOiBudW1iZXIsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibWFrZV9tdWx0aXNpZ1wiLCB7XG4gICAgICBtdWx0aXNpZ19pbmZvOiBtdWx0aXNpZ0hleGVzLFxuICAgICAgdGhyZXNob2xkOiB0aHJlc2hvbGQsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmRcbiAgICB9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5tdWx0aXNpZ19pbmZvO1xuICB9XG4gIFxuICBhc3luYyBleGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleGNoYW5nZV9tdWx0aXNpZ19rZXlzXCIsIHttdWx0aXNpZ19pbmZvOiBtdWx0aXNpZ0hleGVzLCBwYXNzd29yZDogcGFzc3dvcmR9KTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIGxldCBtc1Jlc3VsdCA9IG5ldyBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQoKTtcbiAgICBtc1Jlc3VsdC5zZXRBZGRyZXNzKHJlc3AucmVzdWx0LmFkZHJlc3MpO1xuICAgIG1zUmVzdWx0LnNldE11bHRpc2lnSGV4KHJlc3AucmVzdWx0Lm11bHRpc2lnX2luZm8pO1xuICAgIGlmIChtc1Jlc3VsdC5nZXRBZGRyZXNzKCkubGVuZ3RoID09PSAwKSBtc1Jlc3VsdC5zZXRBZGRyZXNzKHVuZGVmaW5lZCk7XG4gICAgaWYgKG1zUmVzdWx0LmdldE11bHRpc2lnSGV4KCkubGVuZ3RoID09PSAwKSBtc1Jlc3VsdC5zZXRNdWx0aXNpZ0hleCh1bmRlZmluZWQpO1xuICAgIHJldHVybiBtc1Jlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0TXVsdGlzaWdIZXgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4cG9ydF9tdWx0aXNpZ19pbmZvXCIpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5pbmZvO1xuICB9XG5cbiAgYXN5bmMgaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlczogc3RyaW5nW10pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShtdWx0aXNpZ0hleGVzKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN0cmluZ1tdIHRvIGltcG9ydE11bHRpc2lnSGV4KClcIilcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImltcG9ydF9tdWx0aXNpZ19pbmZvXCIsIHtpbmZvOiBtdWx0aXNpZ0hleGVzfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0Lm5fb3V0cHV0cztcbiAgfVxuXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzaWduX211bHRpc2lnXCIsIHt0eF9kYXRhX2hleDogbXVsdGlzaWdUeEhleH0pO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBsZXQgc2lnblJlc3VsdCA9IG5ldyBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQoKTtcbiAgICBzaWduUmVzdWx0LnNldFNpZ25lZE11bHRpc2lnVHhIZXgocmVzdWx0LnR4X2RhdGFfaGV4KTtcbiAgICBzaWduUmVzdWx0LnNldFR4SGFzaGVzKHJlc3VsdC50eF9oYXNoX2xpc3QpO1xuICAgIHJldHVybiBzaWduUmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfbXVsdGlzaWdcIiwge3R4X2RhdGFfaGV4OiBzaWduZWRNdWx0aXNpZ1R4SGV4fSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LnR4X2hhc2hfbGlzdDtcbiAgfVxuICBcbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQ6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkXCIsIHtvbGRfcGFzc3dvcmQ6IG9sZFBhc3N3b3JkIHx8IFwiXCIsIG5ld19wYXNzd29yZDogbmV3UGFzc3dvcmQgfHwgXCJcIn0pO1xuICB9XG4gIFxuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3JlXCIpO1xuICB9XG4gIFxuICBhc3luYyBjbG9zZShzYXZlID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzdXBlci5jbG9zZShzYXZlKTtcbiAgICBpZiAoc2F2ZSA9PT0gdW5kZWZpbmVkKSBzYXZlID0gZmFsc2U7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNsb3NlX3dhbGxldFwiLCB7YXV0b3NhdmVfY3VycmVudDogc2F2ZX0pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nsb3NlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmV0dXJuIGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTEzICYmIGUubWVzc2FnZS5pbmRleE9mKFwiTm8gd2FsbGV0IGZpbGVcIikgPiAtMTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICAvKipcbiAgICogU2F2ZSBhbmQgY2xvc2UgdGhlIGN1cnJlbnQgd2FsbGV0IGFuZCBzdG9wIHRoZSBSUEMgc2VydmVyLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN0b3Bfd2FsbGV0XCIpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuXG4gIGFzeW5jIGdldE51bUJsb2Nrc1RvVW5sb2NrKCk6IFByb21pc2U8bnVtYmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldE51bUJsb2Nrc1RvVW5sb2NrKCk7IH1cbiAgYXN5bmMgZ2V0VHgodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gpOyB9XG4gIGFzeW5jIGdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBnZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5PikgeyByZXR1cm4gc3VwZXIuZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGNyZWF0ZVR4KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5jcmVhdGVUeChjb25maWcpOyB9XG4gIGFzeW5jIHJlbGF5VHgodHhPck1ldGFkYXRhOiBNb25lcm9UeFdhbGxldCB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5yZWxheVR4KHR4T3JNZXRhZGF0YSk7IH1cbiAgYXN5bmMgZ2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFR4Tm90ZSh0eEhhc2gpOyB9XG4gIGFzeW5jIHNldFR4Tm90ZSh0eEhhc2g6IHN0cmluZywgbm90ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zZXRUeE5vdGUodHhIYXNoLCBub3RlKTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzdGF0aWMgYXN5bmMgY29ubmVjdFRvV2FsbGV0UnBjKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgbGV0IGNvbmZpZyA9IE1vbmVyb1dhbGxldFJwYy5ub3JtYWxpemVDb25maWcodXJpT3JDb25maWcsIHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgaWYgKGNvbmZpZy5jbWQpIHJldHVybiBNb25lcm9XYWxsZXRScGMuc3RhcnRXYWxsZXRScGNQcm9jZXNzKGNvbmZpZyk7XG4gICAgZWxzZSByZXR1cm4gbmV3IE1vbmVyb1dhbGxldFJwYyhjb25maWcpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIHN0YXJ0V2FsbGV0UnBjUHJvY2Vzcyhjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzQXJyYXkoY29uZmlnLmNtZCksIFwiTXVzdCBwcm92aWRlIHN0cmluZyBhcnJheSB3aXRoIGNvbW1hbmQgbGluZSBwYXJhbWV0ZXJzXCIpO1xuICAgIFxuICAgIC8vIHN0YXJ0IHByb2Nlc3NcbiAgICBsZXQgY2hpbGRfcHJvY2VzcyA9IGF3YWl0IGltcG9ydChcImNoaWxkX3Byb2Nlc3NcIik7XG4gICAgY29uc3QgcHJvY2VzcyA9IGNoaWxkX3Byb2Nlc3Muc3Bhd24oY29uZmlnLmNtZFswXSwgY29uZmlnLmNtZC5zbGljZSgxKSwge30pO1xuICAgIHByb2Nlc3Muc3Rkb3V0LnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgcHJvY2Vzcy5zdGRlcnIuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBcbiAgICAvLyByZXR1cm4gcHJvbWlzZSB3aGljaCByZXNvbHZlcyBhZnRlciBzdGFydGluZyBtb25lcm8td2FsbGV0LXJwY1xuICAgIGxldCB1cmk7XG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIGxldCBvdXRwdXQgPSBcIlwiO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIFxuICAgICAgLy8gaGFuZGxlIHN0ZG91dFxuICAgICAgcHJvY2Vzcy5zdGRvdXQub24oJ2RhdGEnLCBhc3luYyBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGxldCBsaW5lID0gZGF0YS50b1N0cmluZygpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDIsIGxpbmUpO1xuICAgICAgICBvdXRwdXQgKz0gbGluZSArICdcXG4nOyAvLyBjYXB0dXJlIG91dHB1dCBpbiBjYXNlIG9mIGVycm9yXG4gICAgICAgIFxuICAgICAgICAvLyBleHRyYWN0IHVyaSBmcm9tIGUuZy4gXCJJIEJpbmRpbmcgb24gMTI3LjAuMC4xIChJUHY0KTozODA4NVwiXG4gICAgICAgIGxldCB1cmlMaW5lQ29udGFpbnMgPSBcIkJpbmRpbmcgb24gXCI7XG4gICAgICAgIGxldCB1cmlMaW5lQ29udGFpbnNJZHggPSBsaW5lLmluZGV4T2YodXJpTGluZUNvbnRhaW5zKTtcbiAgICAgICAgaWYgKHVyaUxpbmVDb250YWluc0lkeCA+PSAwKSB7XG4gICAgICAgICAgbGV0IGhvc3QgPSBsaW5lLnN1YnN0cmluZyh1cmlMaW5lQ29udGFpbnNJZHggKyB1cmlMaW5lQ29udGFpbnMubGVuZ3RoLCBsaW5lLmxhc3RJbmRleE9mKCcgJykpO1xuICAgICAgICAgIGxldCB1bmZvcm1hdHRlZExpbmUgPSBsaW5lLnJlcGxhY2UoL1xcdTAwMWJcXFsuKj9tL2csICcnKS50cmltKCk7IC8vIHJlbW92ZSBjb2xvciBmb3JtYXR0aW5nXG4gICAgICAgICAgbGV0IHBvcnQgPSB1bmZvcm1hdHRlZExpbmUuc3Vic3RyaW5nKHVuZm9ybWF0dGVkTGluZS5sYXN0SW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgbGV0IHNzbElkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLXNzbFwiKTtcbiAgICAgICAgICBsZXQgc3NsRW5hYmxlZCA9IHNzbElkeCA+PSAwID8gXCJlbmFibGVkXCIgPT0gY29uZmlnLmNtZFtzc2xJZHggKyAxXS50b0xvd2VyQ2FzZSgpIDogZmFsc2U7XG4gICAgICAgICAgdXJpID0gKHNzbEVuYWJsZWQgPyBcImh0dHBzXCIgOiBcImh0dHBcIikgKyBcIjovL1wiICsgaG9zdCArIFwiOlwiICsgcG9ydDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gcmVhZCBzdWNjZXNzIG1lc3NhZ2VcbiAgICAgICAgaWYgKGxpbmUuaW5kZXhPZihcIlN0YXJ0aW5nIHdhbGxldCBSUEMgc2VydmVyXCIpID49IDApIHtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBnZXQgdXNlcm5hbWUgYW5kIHBhc3N3b3JkIGZyb20gcGFyYW1zXG4gICAgICAgICAgbGV0IHVzZXJQYXNzSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtbG9naW5cIik7XG4gICAgICAgICAgbGV0IHVzZXJQYXNzID0gdXNlclBhc3NJZHggPj0gMCA/IGNvbmZpZy5jbWRbdXNlclBhc3NJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICBsZXQgdXNlcm5hbWUgPSB1c2VyUGFzcyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdXNlclBhc3Muc3Vic3RyaW5nKDAsIHVzZXJQYXNzLmluZGV4T2YoJzonKSk7XG4gICAgICAgICAgbGV0IHBhc3N3b3JkID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZyh1c2VyUGFzcy5pbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBjcmVhdGUgY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzXG4gICAgICAgICAgY29uZmlnID0gY29uZmlnLmNvcHkoKS5zZXRTZXJ2ZXIoe3VyaTogdXJpLCB1c2VybmFtZTogdXNlcm5hbWUsIHBhc3N3b3JkOiBwYXNzd29yZCwgcmVqZWN0VW5hdXRob3JpemVkOiBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWR9KTtcbiAgICAgICAgICBjb25maWcuY21kID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGxldCB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRScGMuY29ubmVjdFRvV2FsbGV0UnBjKGNvbmZpZyk7XG4gICAgICAgICAgd2FsbGV0LnByb2Nlc3MgPSBwcm9jZXNzO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlc29sdmUgcHJvbWlzZSB3aXRoIGNsaWVudCBjb25uZWN0ZWQgdG8gaW50ZXJuYWwgcHJvY2VzcyBcbiAgICAgICAgICB0aGlzLmlzUmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICAgIHJlc29sdmUod2FsbGV0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIGhhbmRsZSBzdGRlcnJcbiAgICAgIHByb2Nlc3Muc3RkZXJyLm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgY29uc29sZS5lcnJvcihkYXRhKTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBoYW5kbGUgZXhpdFxuICAgICAgcHJvY2Vzcy5vbihcImV4aXRcIiwgZnVuY3Rpb24oY29kZSkge1xuICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIHByb2Nlc3MgdGVybWluYXRlZCB3aXRoIGV4aXQgY29kZSBcIiArIGNvZGUgKyAob3V0cHV0ID8gXCI6XFxuXFxuXCIgKyBvdXRwdXQgOiBcIlwiKSkpO1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIGhhbmRsZSBlcnJvclxuICAgICAgcHJvY2Vzcy5vbihcImVycm9yXCIsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIkVOT0VOVFwiKSA+PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgZXhpc3QgYXQgcGF0aCAnXCIgKyBjb25maWcuY21kWzBdICsgXCInXCIpKTtcbiAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIGhhbmRsZSB1bmNhdWdodCBleGNlcHRpb25cbiAgICAgIHByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCBmdW5jdGlvbihlcnIsIG9yaWdpbikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5jYXVnaHQgZXhjZXB0aW9uIGluIG1vbmVyby13YWxsZXQtcnBjIHByb2Nlc3M6IFwiICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgICBjb25zb2xlLmVycm9yKG9yaWdpbik7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjbGVhcigpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5zcGxpY2UoMCwgdGhpcy5saXN0ZW5lcnMubGVuZ3RoKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgICBkZWxldGUgdGhpcy5hZGRyZXNzQ2FjaGU7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICB0aGlzLnBhdGggPSB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRBY2NvdW50SW5kaWNlcyhnZXRTdWJhZGRyZXNzSW5kaWNlcz86IGFueSkge1xuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpO1xuICAgIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgdGhpcy5nZXRBY2NvdW50cygpKSB7XG4gICAgICBpbmRpY2VzLnNldChhY2NvdW50LmdldEluZGV4KCksIGdldFN1YmFkZHJlc3NJbmRpY2VzID8gYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzSW5kaWNlcyhhY2NvdW50LmdldEluZGV4KCkpIDogdW5kZWZpbmVkKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZGljZXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRTdWJhZGRyZXNzSW5kaWNlcyhhY2NvdW50SWR4KSB7XG4gICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gW107XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc1wiLCB7YWNjb3VudF9pbmRleDogYWNjb3VudElkeH0pO1xuICAgIGZvciAobGV0IGFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQuYWRkcmVzc2VzKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKGFkZHJlc3MuYWRkcmVzc19pbmRleCk7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3NJbmRpY2VzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0VHJhbnNmZXJzQXV4KHF1ZXJ5OiBNb25lcm9UcmFuc2ZlclF1ZXJ5KSB7XG4gICAgXG4gICAgLy8gYnVpbGQgcGFyYW1zIGZvciBnZXRfdHJhbnNmZXJzIHJwYyBjYWxsXG4gICAgbGV0IHR4UXVlcnkgPSBxdWVyeS5nZXRUeFF1ZXJ5KCk7XG4gICAgbGV0IGNhbkJlQ29uZmlybWVkID0gdHhRdWVyeS5nZXRJc0NvbmZpcm1lZCgpICE9PSBmYWxzZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJc0ZhaWxlZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SXNSZWxheWVkKCkgIT09IGZhbHNlO1xuICAgIGxldCBjYW5CZUluVHhQb29sID0gdHhRdWVyeS5nZXRJc0NvbmZpcm1lZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPT0gZmFsc2UgJiYgdHhRdWVyeS5nZXRJc0ZhaWxlZCgpICE9PSB0cnVlICYmIHR4UXVlcnkuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCAmJiB0eFF1ZXJ5LmdldE1heEhlaWdodCgpID09PSB1bmRlZmluZWQgJiYgdHhRdWVyeS5nZXRJc0xvY2tlZCgpICE9PSBmYWxzZTtcbiAgICBsZXQgY2FuQmVJbmNvbWluZyA9IHF1ZXJ5LmdldElzSW5jb21pbmcoKSAhPT0gZmFsc2UgJiYgcXVlcnkuZ2V0SXNPdXRnb2luZygpICE9PSB0cnVlICYmIHF1ZXJ5LmdldEhhc0Rlc3RpbmF0aW9ucygpICE9PSB0cnVlO1xuICAgIGxldCBjYW5CZU91dGdvaW5nID0gcXVlcnkuZ2V0SXNPdXRnb2luZygpICE9PSBmYWxzZSAmJiBxdWVyeS5nZXRJc0luY29taW5nKCkgIT09IHRydWU7XG5cbiAgICAvLyBjaGVjayBpZiBmZXRjaGluZyBwb29sIHR4cyBjb250cmFkaWN0ZWQgYnkgY29uZmlndXJhdGlvblxuICAgIGlmICh0eFF1ZXJ5LmdldEluVHhQb29sKCkgPT09IHRydWUgJiYgIWNhbkJlSW5UeFBvb2wpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBmZXRjaCBwb29sIHRyYW5zYWN0aW9ucyBiZWNhdXNlIGl0IGNvbnRyYWRpY3RzIGNvbmZpZ3VyYXRpb25cIik7XG4gICAgfVxuXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmluID0gY2FuQmVJbmNvbWluZyAmJiBjYW5CZUNvbmZpcm1lZDtcbiAgICBwYXJhbXMub3V0ID0gY2FuQmVPdXRnb2luZyAmJiBjYW5CZUNvbmZpcm1lZDtcbiAgICBwYXJhbXMucG9vbCA9IGNhbkJlSW5jb21pbmcgJiYgY2FuQmVJblR4UG9vbDtcbiAgICBwYXJhbXMucGVuZGluZyA9IGNhbkJlT3V0Z29pbmcgJiYgY2FuQmVJblR4UG9vbDtcbiAgICBwYXJhbXMuZmFpbGVkID0gdHhRdWVyeS5nZXRJc0ZhaWxlZCgpICE9PSBmYWxzZSAmJiB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9IHRydWU7XG4gICAgaWYgKHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgPiAwKSBwYXJhbXMubWluX2hlaWdodCA9IHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgLSAxOyAvLyBUT0RPIG1vbmVyby1wcm9qZWN0OiB3YWxsZXQyOjpnZXRfcGF5bWVudHMoKSBtaW5faGVpZ2h0IGlzIGV4Y2x1c2l2ZSwgc28gbWFudWFsbHkgb2Zmc2V0IHRvIG1hdGNoIGludGVuZGVkIHJhbmdlIChpc3N1ZXMgIzU3NTEsICM1NTk4KVxuICAgICAgZWxzZSBwYXJhbXMubWluX2hlaWdodCA9IHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCk7XG4gICAgfVxuICAgIGlmICh0eFF1ZXJ5LmdldE1heEhlaWdodCgpICE9PSB1bmRlZmluZWQpIHBhcmFtcy5tYXhfaGVpZ2h0ID0gdHhRdWVyeS5nZXRNYXhIZWlnaHQoKTtcbiAgICBwYXJhbXMuZmlsdGVyX2J5X2hlaWdodCA9IHR4UXVlcnkuZ2V0TWluSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCB8fCB0eFF1ZXJ5LmdldE1heEhlaWdodCgpICE9PSB1bmRlZmluZWQ7XG4gICAgaWYgKHF1ZXJ5LmdldEFjY291bnRJbmRleCgpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSA9PT0gdW5kZWZpbmVkICYmIHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCwgXCJRdWVyeSBzcGVjaWZpZXMgYSBzdWJhZGRyZXNzIGluZGV4IGJ1dCBub3QgYW4gYWNjb3VudCBpbmRleFwiKTtcbiAgICAgIHBhcmFtcy5hbGxfYWNjb3VudHMgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IHF1ZXJ5LmdldEFjY291bnRJbmRleCgpO1xuICAgICAgXG4gICAgICAvLyBzZXQgc3ViYWRkcmVzcyBpbmRpY2VzIHBhcmFtXG4gICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBuZXcgU2V0KCk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkgIT09IHVuZGVmaW5lZCkgc3ViYWRkcmVzc0luZGljZXMuYWRkKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQpIHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubWFwKHN1YmFkZHJlc3NJZHggPT4gc3ViYWRkcmVzc0luZGljZXMuYWRkKHN1YmFkZHJlc3NJZHgpKTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcy5zaXplKSBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gQXJyYXkuZnJvbShzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgfVxuICAgIFxuICAgIC8vIGNhY2hlIHVuaXF1ZSB0eHMgYW5kIGJsb2Nrc1xuICAgIGxldCB0eE1hcCA9IHt9O1xuICAgIGxldCBibG9ja01hcCA9IHt9O1xuICAgIFxuICAgIC8vIGJ1aWxkIHR4cyB1c2luZyBgZ2V0X3RyYW5zZmVyc2BcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90cmFuc2ZlcnNcIiwgcGFyYW1zKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocmVzcC5yZXN1bHQpKSB7XG4gICAgICBmb3IgKGxldCBycGNUeCBvZiByZXNwLnJlc3VsdFtrZXldKSB7XG4gICAgICAgIC8vaWYgKHJwY1R4LnR4aWQgPT09IHF1ZXJ5LmRlYnVnVHhJZCkgY29uc29sZS5sb2cocnBjVHgpO1xuICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4KTtcbiAgICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIGFzc2VydCh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpID4gLTEpO1xuICAgICAgICBcbiAgICAgICAgLy8gcmVwbGFjZSB0cmFuc2ZlciBhbW91bnQgd2l0aCBkZXN0aW5hdGlvbiBzdW1cbiAgICAgICAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogY29uZmlybWVkIHR4IGZyb20vdG8gc2FtZSBhY2NvdW50IGhhcyBhbW91bnQgMCBidXQgY2FjaGVkIHRyYW5zZmVyc1xuICAgICAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICE9PSB1bmRlZmluZWQgJiYgdHguZ2V0SXNSZWxheWVkKCkgJiYgIXR4LmdldElzRmFpbGVkKCkgJiZcbiAgICAgICAgICAgIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKSAmJiB0eC5nZXRPdXRnb2luZ0Ftb3VudCgpID09PSAwbikge1xuICAgICAgICAgIGxldCBvdXRnb2luZ1RyYW5zZmVyID0gdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpO1xuICAgICAgICAgIGxldCB0cmFuc2ZlclRvdGFsID0gQmlnSW50KDApO1xuICAgICAgICAgIGZvciAobGV0IGRlc3RpbmF0aW9uIG9mIG91dGdvaW5nVHJhbnNmZXIuZ2V0RGVzdGluYXRpb25zKCkpIHRyYW5zZmVyVG90YWwgPSB0cmFuc2ZlclRvdGFsICsgZGVzdGluYXRpb24uZ2V0QW1vdW50KCk7XG4gICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFtb3VudCh0cmFuc2ZlclRvdGFsKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gbWVyZ2UgdHhcbiAgICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHNvcnQgdHhzIGJ5IGJsb2NrIGhlaWdodFxuICAgIGxldCB0eHM6IE1vbmVyb1R4V2FsbGV0W10gPSBPYmplY3QudmFsdWVzKHR4TWFwKTtcbiAgICB0eHMuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KTtcbiAgICBcbiAgICAvLyBmaWx0ZXIgYW5kIHJldHVybiB0cmFuc2ZlcnNcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBcbiAgICAgIC8vIHR4IGlzIG5vdCBpbmNvbWluZy9vdXRnb2luZyB1bmxlc3MgYWxyZWFkeSBzZXRcbiAgICAgIGlmICh0eC5nZXRJc0luY29taW5nKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNJbmNvbWluZyhmYWxzZSk7XG4gICAgICBpZiAodHguZ2V0SXNPdXRnb2luZygpID09PSB1bmRlZmluZWQpIHR4LnNldElzT3V0Z29pbmcoZmFsc2UpO1xuICAgICAgXG4gICAgICAvLyBzb3J0IGluY29taW5nIHRyYW5zZmVyc1xuICAgICAgaWYgKHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgIT09IHVuZGVmaW5lZCkgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKS5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlSW5jb21pbmdUcmFuc2ZlcnMpO1xuICAgICAgXG4gICAgICAvLyBjb2xsZWN0IHF1ZXJpZWQgdHJhbnNmZXJzLCBlcmFzZSBpZiBleGNsdWRlZFxuICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZmlsdGVyVHJhbnNmZXJzKHF1ZXJ5KSkge1xuICAgICAgICB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIHJlbW92ZSB0eHMgd2l0aG91dCByZXF1ZXN0ZWQgdHJhbnNmZXJcbiAgICAgIGlmICh0eC5nZXRCbG9jaygpICE9PSB1bmRlZmluZWQgJiYgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpID09PSB1bmRlZmluZWQgJiYgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHJhbnNmZXJzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0T3V0cHV0c0F1eChxdWVyeSkge1xuICAgIFxuICAgIC8vIGRldGVybWluZSBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMgdG8gYmUgcXVlcmllZFxuICAgIGxldCBpbmRpY2VzID0gbmV3IE1hcCgpO1xuICAgIGlmIChxdWVyeS5nZXRBY2NvdW50SW5kZXgoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBuZXcgU2V0KCk7XG4gICAgICBpZiAocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkgIT09IHVuZGVmaW5lZCkgc3ViYWRkcmVzc0luZGljZXMuYWRkKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQpIHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubWFwKHN1YmFkZHJlc3NJZHggPT4gc3ViYWRkcmVzc0luZGljZXMuYWRkKHN1YmFkZHJlc3NJZHgpKTtcbiAgICAgIGluZGljZXMuc2V0KHF1ZXJ5LmdldEFjY291bnRJbmRleCgpLCBzdWJhZGRyZXNzSW5kaWNlcy5zaXplID8gQXJyYXkuZnJvbShzdWJhZGRyZXNzSW5kaWNlcykgOiB1bmRlZmluZWQpOyAgLy8gdW5kZWZpbmVkIHdpbGwgZmV0Y2ggZnJvbSBhbGwgc3ViYWRkcmVzc2VzXG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2VydC5lcXVhbChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSwgdW5kZWZpbmVkLCBcIlF1ZXJ5IHNwZWNpZmllcyBhIHN1YmFkZHJlc3MgaW5kZXggYnV0IG5vdCBhbiBhY2NvdW50IGluZGV4XCIpXG4gICAgICBhc3NlcnQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkIHx8IHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwLCBcIlF1ZXJ5IHNwZWNpZmllcyBzdWJhZGRyZXNzIGluZGljZXMgYnV0IG5vdCBhbiBhY2NvdW50IGluZGV4XCIpO1xuICAgICAgaW5kaWNlcyA9IGF3YWl0IHRoaXMuZ2V0QWNjb3VudEluZGljZXMoKTsgIC8vIGZldGNoIGFsbCBhY2NvdW50IGluZGljZXMgd2l0aG91dCBzdWJhZGRyZXNzZXNcbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgdW5pcXVlIHR4cyBhbmQgYmxvY2tzXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgXG4gICAgLy8gY29sbGVjdCB0eHMgd2l0aCBvdXRwdXRzIGZvciBlYWNoIGluZGljYXRlZCBhY2NvdW50IHVzaW5nIGBpbmNvbWluZ190cmFuc2ZlcnNgIHJwYyBjYWxsXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLnRyYW5zZmVyX3R5cGUgPSBxdWVyeS5nZXRJc1NwZW50KCkgPT09IHRydWUgPyBcInVuYXZhaWxhYmxlXCIgOiBxdWVyeS5nZXRJc1NwZW50KCkgPT09IGZhbHNlID8gXCJhdmFpbGFibGVcIiA6IFwiYWxsXCI7XG4gICAgcGFyYW1zLnZlcmJvc2UgPSB0cnVlO1xuICAgIGZvciAobGV0IGFjY291bnRJZHggb2YgaW5kaWNlcy5rZXlzKCkpIHtcbiAgICBcbiAgICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBhY2NvdW50SWR4O1xuICAgICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGluZGljZXMuZ2V0KGFjY291bnRJZHgpO1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbmNvbWluZ190cmFuc2ZlcnNcIiwgcGFyYW1zKTtcbiAgICAgIFxuICAgICAgLy8gY29udmVydCByZXNwb25zZSB0byB0eHMgd2l0aCBvdXRwdXRzIGFuZCBtZXJnZVxuICAgICAgaWYgKHJlc3AucmVzdWx0LnRyYW5zZmVycyA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcbiAgICAgIGZvciAobGV0IHJwY091dHB1dCBvZiByZXNwLnJlc3VsdC50cmFuc2ZlcnMpIHtcbiAgICAgICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdhbGxldFdpdGhPdXRwdXQocnBjT3V0cHV0KTtcbiAgICAgICAgTW9uZXJvV2FsbGV0UnBjLm1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHNvcnQgdHhzIGJ5IGJsb2NrIGhlaWdodFxuICAgIGxldCB0eHM6IE1vbmVyb1R4V2FsbGV0W10gPSBPYmplY3QudmFsdWVzKHR4TWFwKTtcbiAgICB0eHMuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHF1ZXJpZWQgb3V0cHV0c1xuICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICBcbiAgICAgIC8vIHNvcnQgb3V0cHV0c1xuICAgICAgaWYgKHR4LmdldE91dHB1dHMoKSAhPT0gdW5kZWZpbmVkKSB0eC5nZXRPdXRwdXRzKCkuc29ydChNb25lcm9XYWxsZXRScGMuY29tcGFyZU91dHB1dHMpO1xuICAgICAgXG4gICAgICAvLyBjb2xsZWN0IHF1ZXJpZWQgb3V0cHV0cywgZXJhc2UgaWYgZXhjbHVkZWRcbiAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5maWx0ZXJPdXRwdXRzKHF1ZXJ5KSkgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgICBcbiAgICAgIC8vIHJlbW92ZSBleGNsdWRlZCB0eHMgZnJvbSBibG9ja1xuICAgICAgaWYgKHR4LmdldE91dHB1dHMoKSA9PT0gdW5kZWZpbmVkICYmIHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0eC5nZXRCbG9jaygpLmdldFR4cygpLnNwbGljZSh0eC5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgpLCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dHM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21tb24gbWV0aG9kIHRvIGdldCBrZXkgaW1hZ2VzLlxuICAgKiBcbiAgICogQHBhcmFtIGFsbCAtIHBlY2lmaWVzIHRvIGdldCBhbGwgeG9yIG9ubHkgbmV3IGltYWdlcyBmcm9tIGxhc3QgaW1wb3J0XG4gICAqIEByZXR1cm4ge01vbmVyb0tleUltYWdlW119IGFyZSB0aGUga2V5IGltYWdlc1xuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIHJwY0V4cG9ydEtleUltYWdlcyhhbGwpIHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImV4cG9ydF9rZXlfaW1hZ2VzXCIsIHthbGw6IGFsbH0pO1xuICAgIGlmICghcmVzcC5yZXN1bHQuc2lnbmVkX2tleV9pbWFnZXMpIHJldHVybiBbXTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmVkX2tleV9pbWFnZXMubWFwKHJwY0ltYWdlID0+IG5ldyBNb25lcm9LZXlJbWFnZShycGNJbWFnZS5rZXlfaW1hZ2UsIHJwY0ltYWdlLnNpZ25hdHVyZSkpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgcnBjU3dlZXBBY2NvdW50KGNvbmZpZykge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN3ZWVwIGNvbmZpZ1wiKTtcbiAgICBpZiAoY29uZmlnLmdldEFjY291bnRJbmRleCgpID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBhbiBhY2NvdW50IGluZGV4IHRvIHN3ZWVwIGZyb21cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGggIT0gMSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGV4YWN0bHkgb25lIGRlc3RpbmF0aW9uIHRvIHN3ZWVwIHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBkZXN0aW5hdGlvbiBhZGRyZXNzIHRvIHN3ZWVwIHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QW1vdW50KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgYW1vdW50IGluIHN3ZWVwIGNvbmZpZ1wiKTtcbiAgICBpZiAoY29uZmlnLmdldEtleUltYWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiS2V5IGltYWdlIGRlZmluZWQ7IHVzZSBzd2VlcE91dHB1dCgpIHRvIHN3ZWVwIGFuIG91dHB1dCBieSBpdHMga2V5IGltYWdlXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkICYmIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiRW1wdHkgbGlzdCBnaXZlbiBmb3Igc3ViYWRkcmVzc2VzIGluZGljZXMgdG8gc3dlZXBcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTd2VlcEVhY2hTdWJhZGRyZXNzKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzd2VlcCBlYWNoIHN1YmFkZHJlc3Mgd2l0aCBSUEMgYHN3ZWVwX2FsbGBcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJ0cmFjdEZlZUZyb20oKSAhPT0gdW5kZWZpbmVkICYmIGNvbmZpZy5nZXRTdWJ0cmFjdEZlZUZyb20oKS5sZW5ndGggPiAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTd2VlcGluZyBvdXRwdXQgZG9lcyBub3Qgc3VwcG9ydCBzdWJ0cmFjdGluZyBmZWVzIGZyb20gZGVzdGluYXRpb25zXCIpO1xuICAgIFxuICAgIC8vIHN3ZWVwIGZyb20gYWxsIHN1YmFkZHJlc3NlcyBpZiBub3Qgb3RoZXJ3aXNlIGRlZmluZWRcbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uZmlnLnNldFN1YmFkZHJlc3NJbmRpY2VzKFtdKTtcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoY29uZmlnLmdldEFjY291bnRJbmRleCgpKSkge1xuICAgICAgICBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5wdXNoKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vIHN1YmFkZHJlc3NlcyB0byBzd2VlcCBmcm9tXCIpO1xuICAgIFxuICAgIC8vIGNvbW1vbiBjb25maWcgcGFyYW1zXG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgbGV0IHJlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgPT09IHRydWU7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBjb25maWcuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpO1xuICAgIHBhcmFtcy5hZGRyZXNzID0gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKTtcbiAgICBhc3NlcnQoY29uZmlnLmdldFByaW9yaXR5KCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpb3JpdHkoKSA+PSAwICYmIGNvbmZpZy5nZXRQcmlvcml0eSgpIDw9IDMpO1xuICAgIHBhcmFtcy5wcmlvcml0eSA9IGNvbmZpZy5nZXRQcmlvcml0eSgpO1xuICAgIGlmIChjb25maWcuZ2V0VW5sb2NrVGltZSgpICE9PSB1bmRlZmluZWQpIHBhcmFtcy51bmxvY2tfdGltZSA9IGNvbmZpZy5nZXRVbmxvY2tUaW1lKCk7XG4gICAgcGFyYW1zLnBheW1lbnRfaWQgPSBjb25maWcuZ2V0UGF5bWVudElkKCk7XG4gICAgcGFyYW1zLmRvX25vdF9yZWxheSA9ICFyZWxheTtcbiAgICBwYXJhbXMuYmVsb3dfYW1vdW50ID0gY29uZmlnLmdldEJlbG93QW1vdW50KCk7XG4gICAgcGFyYW1zLmdldF90eF9rZXlzID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X2hleCA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9tZXRhZGF0YSA9IHRydWU7XG4gICAgXG4gICAgLy8gaW52b2tlIHdhbGxldCBycGMgYHN3ZWVwX2FsbGBcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN3ZWVwX2FsbFwiLCBwYXJhbXMpO1xuICAgIGxldCByZXN1bHQgPSByZXNwLnJlc3VsdDtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4cyBmcm9tIHJlc3BvbnNlXG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQsIHVuZGVmaW5lZCwgY29uZmlnKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHJlbWFpbmluZyBrbm93biBmaWVsZHNcbiAgICBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkge1xuICAgICAgdHguc2V0SXNMb2NrZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgICAgdHguc2V0UmVsYXkocmVsYXkpO1xuICAgICAgdHguc2V0SW5UeFBvb2wocmVsYXkpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHJlbGF5KTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICBsZXQgdHJhbnNmZXIgPSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgICB0cmFuc2Zlci5zZXRBY2NvdW50SW5kZXgoY29uZmlnLmdldEFjY291bnRJbmRleCgpKTtcbiAgICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDEpIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpKTtcbiAgICAgIGxldCBkZXN0aW5hdGlvbiA9IG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLCBCaWdJbnQodHJhbnNmZXIuZ2V0QW1vdW50KCkpKTtcbiAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhbZGVzdGluYXRpb25dKTtcbiAgICAgIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgICAgdHguc2V0UGF5bWVudElkKGNvbmZpZy5nZXRQYXltZW50SWQoKSk7XG4gICAgICBpZiAodHguZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQpIHR4LnNldFVubG9ja1RpbWUoY29uZmlnLmdldFVubG9ja1RpbWUoKSA9PT0gdW5kZWZpbmVkID8gMCA6IGNvbmZpZy5nZXRVbmxvY2tUaW1lKCkpO1xuICAgICAgaWYgKHR4LmdldFJlbGF5KCkpIHtcbiAgICAgICAgaWYgKHR4LmdldExhc3RSZWxheWVkVGltZXN0YW1wKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoK25ldyBEYXRlKCkuZ2V0VGltZSgpKTsgIC8vIFRPRE8gKG1vbmVyby13YWxsZXQtcnBjKTogcHJvdmlkZSB0aW1lc3RhbXAgb24gcmVzcG9uc2U7IHVuY29uZmlybWVkIHRpbWVzdGFtcHMgdmFyeVxuICAgICAgICBpZiAodHguZ2V0SXNEb3VibGVTcGVuZFNlZW4oKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0eFNldC5nZXRUeHMoKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHJlZnJlc2hMaXN0ZW5pbmcoKSB7XG4gICAgaWYgKHRoaXMud2FsbGV0UG9sbGVyID09IHVuZGVmaW5lZCAmJiB0aGlzLmxpc3RlbmVycy5sZW5ndGgpIHRoaXMud2FsbGV0UG9sbGVyID0gbmV3IFdhbGxldFBvbGxlcih0aGlzKTtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCkgdGhpcy53YWxsZXRQb2xsZXIuc2V0SXNQb2xsaW5nKHRoaXMubGlzdGVuZXJzLmxlbmd0aCA+IDApO1xuICB9XG4gIFxuICAvKipcbiAgICogUG9sbCBpZiBsaXN0ZW5pbmcuXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgcG9sbCgpIHtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndhbGxldFBvbGxlci5pc1BvbGxpbmcpIGF3YWl0IHRoaXMud2FsbGV0UG9sbGVyLnBvbGwoKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIFNUQVRJQyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IE1vbmVyb1dhbGxldENvbmZpZyB7XG4gICAgbGV0IGNvbmZpZzogdW5kZWZpbmVkIHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+ID0gdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlb2YgdXJpT3JDb25maWcgPT09IFwic3RyaW5nXCIgfHwgKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pLnVyaSkgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh7c2VydmVyOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbmZpZyBhcyBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+LCB1c2VybmFtZSwgcGFzc3dvcmQpfSk7XG4gICAgZWxzZSBpZiAoR2VuVXRpbHMuaXNBcnJheSh1cmlPckNvbmZpZykpIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoe2NtZDogdXJpT3JDb25maWcgYXMgc3RyaW5nW119KTtcbiAgICBlbHNlIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIgPT09IHVuZGVmaW5lZCkgY29uZmlnLnByb3h5VG9Xb3JrZXIgPSB0cnVlO1xuICAgIHJldHVybiBjb25maWcgYXMgTW9uZXJvV2FsbGV0Q29uZmlnO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVtb3ZlIGNyaXRlcmlhIHdoaWNoIHJlcXVpcmVzIGxvb2tpbmcgdXAgb3RoZXIgdHJhbnNmZXJzL291dHB1dHMgdG9cbiAgICogZnVsZmlsbCBxdWVyeS5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gcXVlcnkgLSB0aGUgcXVlcnkgdG8gZGVjb250ZXh0dWFsaXplXG4gICAqIEByZXR1cm4ge01vbmVyb1R4UXVlcnl9IGEgcmVmZXJlbmNlIHRvIHRoZSBxdWVyeSBmb3IgY29udmVuaWVuY2VcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZGVjb250ZXh0dWFsaXplKHF1ZXJ5KSB7XG4gICAgcXVlcnkuc2V0SXNJbmNvbWluZyh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldElzT3V0Z29pbmcodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRUcmFuc2ZlclF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0SW5wdXRRdWVyeSh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldE91dHB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHF1ZXJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGlzQ29udGV4dHVhbChxdWVyeSkge1xuICAgIGlmICghcXVlcnkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIXF1ZXJ5LmdldFR4UXVlcnkoKSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0SXNJbmNvbWluZygpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIHRyYW5zZmVyc1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0SXNPdXRnb2luZygpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlO1xuICAgIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb1RyYW5zZmVyUXVlcnkpIHtcbiAgICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0T3V0cHV0UXVlcnkoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciBvdXRwdXRzXG4gICAgfSBlbHNlIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb091dHB1dFF1ZXJ5KSB7XG4gICAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldFRyYW5zZmVyUXVlcnkoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTsgLy8gcmVxdWlyZXMgZ2V0dGluZyBvdGhlciB0cmFuc2ZlcnNcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicXVlcnkgbXVzdCBiZSB0eCBvciB0cmFuc2ZlciBxdWVyeVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNBY2NvdW50KHJwY0FjY291bnQpIHtcbiAgICBsZXQgYWNjb3VudCA9IG5ldyBNb25lcm9BY2NvdW50KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0FjY291bnQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQWNjb3VudFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhY2NvdW50X2luZGV4XCIpIGFjY291bnQuc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYWxhbmNlXCIpIGFjY291bnQuc2V0QmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfYmFsYW5jZVwiKSBhY2NvdW50LnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmFzZV9hZGRyZXNzXCIpIGFjY291bnQuc2V0UHJpbWFyeUFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YWdcIikgYWNjb3VudC5zZXRUYWcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYWJlbFwiKSB7IH0gLy8gbGFiZWwgYmVsb25ncyB0byBmaXJzdCBzdWJhZGRyZXNzXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBhY2NvdW50IGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChcIlwiID09PSBhY2NvdW50LmdldFRhZygpKSBhY2NvdW50LnNldFRhZyh1bmRlZmluZWQpO1xuICAgIHJldHVybiBhY2NvdW50O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTdWJhZGRyZXNzKHJwY1N1YmFkZHJlc3MpIHtcbiAgICBsZXQgc3ViYWRkcmVzcyA9IG5ldyBNb25lcm9TdWJhZGRyZXNzKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N1YmFkZHJlc3MpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjU3ViYWRkcmVzc1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhY2NvdW50X2luZGV4XCIpIHN1YmFkZHJlc3Muc2V0QWNjb3VudEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc19pbmRleFwiKSBzdWJhZGRyZXNzLnNldEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSBzdWJhZGRyZXNzLnNldEFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYWxhbmNlXCIpIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfYmFsYW5jZVwiKSBzdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX3Vuc3BlbnRfb3V0cHV0c1wiKSBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFiZWxcIikgeyBpZiAodmFsKSBzdWJhZGRyZXNzLnNldExhYmVsKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1c2VkXCIpIHN1YmFkZHJlc3Muc2V0SXNVc2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tzX3RvX3VubG9ja1wiKSBzdWJhZGRyZXNzLnNldE51bUJsb2Nrc1RvVW5sb2NrKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT0gXCJ0aW1lX3RvX3VubG9ja1wiKSB7fSAgLy8gaWdub3JpbmdcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHN1YmFkZHJlc3MgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIHNlbnQgdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBUT0RPOiByZW1vdmUgY29weURlc3RpbmF0aW9ucyBhZnRlciA+MTguMy4xIHdoZW4gc3VidHJhY3RGZWVGcm9tIGZ1bGx5IHN1cHBvcnRlZFxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeENvbmZpZ30gY29uZmlnIC0gc2VuZCBjb25maWdcbiAgICogQHBhcmFtIHtNb25lcm9UeFdhbGxldH0gW3R4XSAtIGV4aXN0aW5nIHRyYW5zYWN0aW9uIHRvIGluaXRpYWxpemUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGNvcHlEZXN0aW5hdGlvbnMgLSBjb3BpZXMgY29uZmlnIGRlc3RpbmF0aW9ucyBpZiB0cnVlXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSBpcyB0aGUgaW5pdGlhbGl6ZWQgc2VuZCB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBpbml0U2VudFR4V2FsbGV0KGNvbmZpZywgdHgsIGNvcHlEZXN0aW5hdGlvbnMpIHtcbiAgICBpZiAoIXR4KSB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIGxldCByZWxheSA9IGNvbmZpZy5nZXRSZWxheSgpID09PSB0cnVlO1xuICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgdHguc2V0SW5UeFBvb2wocmVsYXkpO1xuICAgIHR4LnNldFJlbGF5KHJlbGF5KTtcbiAgICB0eC5zZXRJc1JlbGF5ZWQocmVsYXkpO1xuICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIHR4LnNldElzTG9ja2VkKHRydWUpO1xuICAgIHR4LnNldFJpbmdTaXplKE1vbmVyb1V0aWxzLlJJTkdfU0laRSk7XG4gICAgbGV0IHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKTtcbiAgICB0cmFuc2Zlci5zZXRUeCh0eCk7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICYmIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSkgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkuc2xpY2UoMCkpOyAvLyB3ZSBrbm93IHNyYyBzdWJhZGRyZXNzIGluZGljZXMgaWZmIGNvbmZpZyBzcGVjaWZpZXMgMVxuICAgIGlmIChjb3B5RGVzdGluYXRpb25zKSB7XG4gICAgICBsZXQgZGVzdENvcGllcyA9IFtdO1xuICAgICAgZm9yIChsZXQgZGVzdCBvZiBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkpIGRlc3RDb3BpZXMucHVzaChkZXN0LmNvcHkoKSk7XG4gICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoZGVzdENvcGllcyk7XG4gICAgfVxuICAgIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgIHR4LnNldFBheW1lbnRJZChjb25maWcuZ2V0UGF5bWVudElkKCkpO1xuICAgIGlmICh0eC5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0VW5sb2NrVGltZShjb25maWcuZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQgPyAwIDogY29uZmlnLmdldFVubG9ja1RpbWUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRSZWxheSgpKSB7XG4gICAgICBpZiAodHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgrbmV3IERhdGUoKS5nZXRUaW1lKCkpOyAgLy8gVE9ETyAobW9uZXJvLXdhbGxldC1ycGMpOiBwcm92aWRlIHRpbWVzdGFtcCBvbiByZXNwb25zZTsgdW5jb25maXJtZWQgdGltZXN0YW1wcyB2YXJ5XG4gICAgICBpZiAodHguZ2V0SXNEb3VibGVTcGVuZFNlZW4oKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgdHggc2V0IGZyb20gYSBSUEMgbWFwIGV4Y2x1ZGluZyB0eHMuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjTWFwIC0gbWFwIHRvIGluaXRpYWxpemUgdGhlIHR4IHNldCBmcm9tXG4gICAqIEByZXR1cm4gTW9uZXJvVHhTZXQgLSBpbml0aWFsaXplZCB0eCBzZXRcbiAgICogQHJldHVybiB0aGUgcmVzdWx0aW5nIHR4IHNldFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhTZXQocnBjTWFwKSB7XG4gICAgbGV0IHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KCk7XG4gICAgdHhTZXQuc2V0TXVsdGlzaWdUeEhleChycGNNYXAubXVsdGlzaWdfdHhzZXQpO1xuICAgIHR4U2V0LnNldFVuc2lnbmVkVHhIZXgocnBjTWFwLnVuc2lnbmVkX3R4c2V0KTtcbiAgICB0eFNldC5zZXRTaWduZWRUeEhleChycGNNYXAuc2lnbmVkX3R4c2V0KTtcbiAgICBpZiAodHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpICE9PSB1bmRlZmluZWQgJiYgdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0TXVsdGlzaWdUeEhleCh1bmRlZmluZWQpO1xuICAgIGlmICh0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCkubGVuZ3RoID09PSAwKSB0eFNldC5zZXRVbnNpZ25lZFR4SGV4KHVuZGVmaW5lZCk7XG4gICAgaWYgKHR4U2V0LmdldFNpZ25lZFR4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRTaWduZWRUeEhleCgpLmxlbmd0aCA9PT0gMCkgdHhTZXQuc2V0U2lnbmVkVHhIZXgodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBhIE1vbmVyb1R4U2V0IGZyb20gYSBsaXN0IG9mIHJwYyB0eHMuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHhzIC0gcnBjIHR4cyB0byBpbml0aWFsaXplIHRoZSBzZXQgZnJvbVxuICAgKiBAcGFyYW0gdHhzIC0gZXhpc3RpbmcgdHhzIHRvIGZ1cnRoZXIgaW5pdGlhbGl6ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB0aGUgY29udmVydGVkIHR4IHNldFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjU2VudFR4c1RvVHhTZXQocnBjVHhzOiBhbnksIHR4cz86IGFueSwgY29uZmlnPzogYW55KSB7XG4gICAgXG4gICAgLy8gYnVpbGQgc2hhcmVkIHR4IHNldFxuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhTZXQocnBjVHhzKTtcblxuICAgIC8vIGdldCBudW1iZXIgb2YgdHhzXG4gICAgbGV0IG51bVR4cyA9IHJwY1R4cy5mZWVfbGlzdCA/IHJwY1R4cy5mZWVfbGlzdC5sZW5ndGggOiBycGNUeHMudHhfaGFzaF9saXN0ID8gcnBjVHhzLnR4X2hhc2hfbGlzdC5sZW5ndGggOiAwO1xuICAgIFxuICAgIC8vIGRvbmUgaWYgcnBjIHJlc3BvbnNlIGNvbnRhaW5zIG5vIHR4c1xuICAgIGlmIChudW1UeHMgPT09IDApIHtcbiAgICAgIGFzc2VydC5lcXVhbCh0eHMsIHVuZGVmaW5lZCk7XG4gICAgICByZXR1cm4gdHhTZXQ7XG4gICAgfVxuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGlmIG5vbmUgZ2l2ZW5cbiAgICBpZiAodHhzKSB0eFNldC5zZXRUeHModHhzKTtcbiAgICBlbHNlIHtcbiAgICAgIHR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1UeHM7IGkrKykgdHhzLnB1c2gobmV3IE1vbmVyb1R4V2FsbGV0KCkpO1xuICAgIH1cbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIHR4LnNldFR4U2V0KHR4U2V0KTtcbiAgICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgfVxuICAgIHR4U2V0LnNldFR4cyh0eHMpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGZyb20gcnBjIGxpc3RzXG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1R4cykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUeHNba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhfaGFzaF9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0SGFzaCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2tleV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0S2V5KHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfYmxvYl9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0RnVsbEhleCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X21ldGFkYXRhX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRNZXRhZGF0YSh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZV9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0RmVlKEJpZ0ludCh2YWxbaV0pKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldFdlaWdodCh2YWxbaV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9saXN0XCIpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAodHhzW2ldLmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PSB1bmRlZmluZWQpIHR4c1tpXS5zZXRPdXRnb2luZ1RyYW5zZmVyKG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHhzW2ldKSk7XG4gICAgICAgICAgdHhzW2ldLmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXRBbW91bnQoQmlnSW50KHZhbFtpXSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibXVsdGlzaWdfdHhzZXRcIiB8fCBrZXkgPT09IFwidW5zaWduZWRfdHhzZXRcIiB8fCBrZXkgPT09IFwic2lnbmVkX3R4c2V0XCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlbnRfa2V5X2ltYWdlc19saXN0XCIpIHtcbiAgICAgICAgbGV0IGlucHV0S2V5SW1hZ2VzTGlzdCA9IHZhbDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dEtleUltYWdlc0xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR4c1tpXS5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgICB0eHNbaV0uc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgICBmb3IgKGxldCBpbnB1dEtleUltYWdlIG9mIGlucHV0S2V5SW1hZ2VzTGlzdFtpXVtcImtleV9pbWFnZXNcIl0pIHtcbiAgICAgICAgICAgIHR4c1tpXS5nZXRJbnB1dHMoKS5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKS5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UoKS5zZXRIZXgoaW5wdXRLZXlJbWFnZSkpLnNldFR4KHR4c1tpXSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNfYnlfZGVzdF9saXN0XCIpIHtcbiAgICAgICAgbGV0IGFtb3VudHNCeURlc3RMaXN0ID0gdmFsO1xuICAgICAgICBsZXQgZGVzdGluYXRpb25JZHggPSAwO1xuICAgICAgICBmb3IgKGxldCB0eElkeCA9IDA7IHR4SWR4IDwgYW1vdW50c0J5RGVzdExpc3QubGVuZ3RoOyB0eElkeCsrKSB7XG4gICAgICAgICAgbGV0IGFtb3VudHNCeURlc3QgPSBhbW91bnRzQnlEZXN0TGlzdFt0eElkeF1bXCJhbW91bnRzXCJdO1xuICAgICAgICAgIGlmICh0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKSA9PT0gdW5kZWZpbmVkKSB0eHNbdHhJZHhdLnNldE91dGdvaW5nVHJhbnNmZXIobmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eHNbdHhJZHhdKSk7XG4gICAgICAgICAgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0RGVzdGluYXRpb25zKFtdKTtcbiAgICAgICAgICBmb3IgKGxldCBhbW91bnQgb2YgYW1vdW50c0J5RGVzdCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGggPT09IDEpIHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnQpKSk7IC8vIHN3ZWVwaW5nIGNhbiBjcmVhdGUgbXVsdGlwbGUgdHhzIHdpdGggb25lIGFkZHJlc3NcbiAgICAgICAgICAgIGVsc2UgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpW2Rlc3RpbmF0aW9uSWR4KytdLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudCkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHRyYW5zYWN0aW9uIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgcnBjIHR4IHdpdGggYSB0cmFuc2ZlciB0byBhIHR4IHNldCB3aXRoIGEgdHggYW5kIHRyYW5zZmVyLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4IC0gcnBjIHR4IHRvIGJ1aWxkIGZyb21cbiAgICogQHBhcmFtIHR4IC0gZXhpc3RpbmcgdHggdG8gY29udGludWUgaW5pdGlhbGl6aW5nIChvcHRpb25hbClcbiAgICogQHBhcmFtIGlzT3V0Z29pbmcgLSBzcGVjaWZpZXMgaWYgdGhlIHR4IGlzIG91dGdvaW5nIGlmIHRydWUsIGluY29taW5nIGlmIGZhbHNlLCBvciBkZWNvZGVzIGZyb20gdHlwZSBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHRoZSBpbml0aWFsaXplZCB0eCBzZXQgd2l0aCBhIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFRvVHhTZXQocnBjVHgsIHR4LCBpc091dGdvaW5nLCBjb25maWcpIHtcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4U2V0KHJwY1R4KTtcbiAgICB0eFNldC5zZXRUeHMoW01vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHgsIHR4LCBpc091dGdvaW5nLCBjb25maWcpLnNldFR4U2V0KHR4U2V0KV0pO1xuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEJ1aWxkcyBhIE1vbmVyb1R4V2FsbGV0IGZyb20gYSBSUEMgdHguXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHggLSBycGMgdHggdG8gYnVpbGQgZnJvbVxuICAgKiBAcGFyYW0gdHggLSBleGlzdGluZyB0eCB0byBjb250aW51ZSBpbml0aWFsaXppbmcgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gaXNPdXRnb2luZyAtIHNwZWNpZmllcyBpZiB0aGUgdHggaXMgb3V0Z29pbmcgaWYgdHJ1ZSwgaW5jb21pbmcgaWYgZmFsc2UsIG9yIGRlY29kZXMgZnJvbSB0eXBlIGlmIHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSBpcyB0aGUgaW5pdGlhbGl6ZWQgdHhcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHJwY1R4OiBhbnksIHR4PzogYW55LCBpc091dGdvaW5nPzogYW55LCBjb25maWc/OiBhbnkpIHsgIC8vIFRPRE86IGNoYW5nZSBldmVyeXRoaW5nIHRvIHNhZmUgc2V0XG4gICAgICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggdG8gcmV0dXJuXG4gICAgaWYgKCF0eCkgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHN0YXRlIGZyb20gcnBjIHR5cGVcbiAgICBpZiAocnBjVHgudHlwZSAhPT0gdW5kZWZpbmVkKSBpc091dGdvaW5nID0gTW9uZXJvV2FsbGV0UnBjLmRlY29kZVJwY1R5cGUocnBjVHgudHlwZSwgdHgpO1xuICAgIGVsc2UgYXNzZXJ0LmVxdWFsKHR5cGVvZiBpc091dGdvaW5nLCBcImJvb2xlYW5cIiwgXCJNdXN0IGluZGljYXRlIGlmIHR4IGlzIG91dGdvaW5nICh0cnVlKSB4b3IgaW5jb21pbmcgKGZhbHNlKSBzaW5jZSB1bmtub3duXCIpO1xuICAgIFxuICAgIC8vIFRPRE86IHNhZmUgc2V0XG4gICAgLy8gaW5pdGlhbGl6ZSByZW1haW5pbmcgZmllbGRzICBUT0RPOiBzZWVtcyB0aGlzIHNob3VsZCBiZSBwYXJ0IG9mIGNvbW1vbiBmdW5jdGlvbiB3aXRoIERhZW1vblJwYy5jb252ZXJ0UnBjVHhcbiAgICBsZXQgaGVhZGVyO1xuICAgIGxldCB0cmFuc2ZlcjtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVHgpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVHhba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhpZFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlXCIpIHR4LnNldEZlZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm90ZVwiKSB7IGlmICh2YWwpIHR4LnNldE5vdGUodmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2tleVwiKSB0eC5zZXRLZXkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eXBlXCIpIHsgfSAvLyB0eXBlIGFscmVhZHkgaGFuZGxlZFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X3NpemVcIikgdHguc2V0U2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja190aW1lXCIpIHR4LnNldFVubG9ja1RpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRcIikgdHguc2V0V2VpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9ja2VkXCIpIHR4LnNldElzTG9ja2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfYmxvYlwiKSB0eC5zZXRGdWxsSGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfbWV0YWRhdGFcIikgdHguc2V0TWV0YWRhdGEodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkb3VibGVfc3BlbmRfc2VlblwiKSB0eC5zZXRJc0RvdWJsZVNwZW5kU2Vlbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiIHx8IGtleSA9PT0gXCJoZWlnaHRcIikge1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgICBoZWFkZXIuc2V0SGVpZ2h0KHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0aW1lc3RhbXBcIikge1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgICBoZWFkZXIuc2V0VGltZXN0YW1wKHZhbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gdGltZXN0YW1wIG9mIHVuY29uZmlybWVkIHR4IGlzIGN1cnJlbnQgcmVxdWVzdCB0aW1lXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjb25maXJtYXRpb25zXCIpIHR4LnNldE51bUNvbmZpcm1hdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWdnZXN0ZWRfY29uZmlybWF0aW9uc190aHJlc2hvbGRcIikge1xuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSAoaXNPdXRnb2luZyA/IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkgOiBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpKS5zZXRUeCh0eCk7XG4gICAgICAgIGlmICghaXNPdXRnb2luZykgdHJhbnNmZXIuc2V0TnVtU3VnZ2VzdGVkQ29uZmlybWF0aW9ucyh2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudFwiKSB7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRzXCIpIHt9ICAvLyBpZ25vcmluZywgYW1vdW50cyBzdW0gdG8gYW1vdW50XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSB7XG4gICAgICAgIGlmICghaXNPdXRnb2luZykge1xuICAgICAgICAgIGlmICghdHJhbnNmZXIpIHRyYW5zZmVyID0gbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKS5zZXRUeCh0eCk7XG4gICAgICAgICAgdHJhbnNmZXIuc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGF5bWVudF9pZFwiKSB7XG4gICAgICAgIGlmIChcIlwiICE9PSB2YWwgJiYgTW9uZXJvVHhXYWxsZXQuREVGQVVMVF9QQVlNRU5UX0lEICE9PSB2YWwpIHR4LnNldFBheW1lbnRJZCh2YWwpOyAgLy8gZGVmYXVsdCBpcyB1bmRlZmluZWRcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGV4XCIpIGFzc2VydChycGNUeC5zdWJhZGRyX2luZGljZXMpOyAgLy8gaGFuZGxlZCBieSBzdWJhZGRyX2luZGljZXNcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdWJhZGRyX2luZGljZXNcIikge1xuICAgICAgICBpZiAoIXRyYW5zZmVyKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgbGV0IHJwY0luZGljZXMgPSB2YWw7XG4gICAgICAgIHRyYW5zZmVyLnNldEFjY291bnRJbmRleChycGNJbmRpY2VzWzBdLm1ham9yKTtcbiAgICAgICAgaWYgKGlzT3V0Z29pbmcpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICAgICAgICBmb3IgKGxldCBycGNJbmRleCBvZiBycGNJbmRpY2VzKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKHJwY0luZGV4Lm1pbm9yKTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kaWNlcyhzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsKHJwY0luZGljZXMubGVuZ3RoLCAxKTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kZXgocnBjSW5kaWNlc1swXS5taW5vcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkZXN0aW5hdGlvbnNcIiB8fCBrZXkgPT0gXCJyZWNpcGllbnRzXCIpIHtcbiAgICAgICAgYXNzZXJ0KGlzT3V0Z29pbmcpO1xuICAgICAgICBsZXQgZGVzdGluYXRpb25zID0gW107XG4gICAgICAgIGZvciAobGV0IHJwY0Rlc3RpbmF0aW9uIG9mIHZhbCkge1xuICAgICAgICAgIGxldCBkZXN0aW5hdGlvbiA9IG5ldyBNb25lcm9EZXN0aW5hdGlvbigpO1xuICAgICAgICAgIGRlc3RpbmF0aW9ucy5wdXNoKGRlc3RpbmF0aW9uKTtcbiAgICAgICAgICBmb3IgKGxldCBkZXN0aW5hdGlvbktleSBvZiBPYmplY3Qua2V5cyhycGNEZXN0aW5hdGlvbikpIHtcbiAgICAgICAgICAgIGlmIChkZXN0aW5hdGlvbktleSA9PT0gXCJhZGRyZXNzXCIpIGRlc3RpbmF0aW9uLnNldEFkZHJlc3MocnBjRGVzdGluYXRpb25bZGVzdGluYXRpb25LZXldKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKGRlc3RpbmF0aW9uS2V5ID09PSBcImFtb3VudFwiKSBkZXN0aW5hdGlvbi5zZXRBbW91bnQoQmlnSW50KHJwY0Rlc3RpbmF0aW9uW2Rlc3RpbmF0aW9uS2V5XSkpO1xuICAgICAgICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNhY3Rpb24gZGVzdGluYXRpb24gZmllbGQ6IFwiICsgZGVzdGluYXRpb25LZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHJhbnNmZXIgPT09IHVuZGVmaW5lZCkgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2Zlcih7dHg6IHR4fSk7XG4gICAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhkZXN0aW5hdGlvbnMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm11bHRpc2lnX3R4c2V0XCIgJiYgdmFsICE9PSB1bmRlZmluZWQpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlOyB0aGlzIG1ldGhvZCBvbmx5IGJ1aWxkcyBhIHR4IHdhbGxldFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVuc2lnbmVkX3R4c2V0XCIgJiYgdmFsICE9PSB1bmRlZmluZWQpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlOyB0aGlzIG1ldGhvZCBvbmx5IGJ1aWxkcyBhIHR4IHdhbGxldFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudF9pblwiKSB0eC5zZXRJbnB1dFN1bShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50X291dFwiKSB0eC5zZXRPdXRwdXRTdW0oQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNoYW5nZV9hZGRyZXNzXCIpIHR4LnNldENoYW5nZUFkZHJlc3ModmFsID09PSBcIlwiID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjaGFuZ2VfYW1vdW50XCIpIHR4LnNldENoYW5nZUFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZHVtbXlfb3V0cHV0c1wiKSB0eC5zZXROdW1EdW1teU91dHB1dHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJleHRyYVwiKSB0eC5zZXRFeHRyYUhleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJpbmdfc2l6ZVwiKSB0eC5zZXRSaW5nU2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50X2tleV9pbWFnZXNcIikge1xuICAgICAgICBsZXQgaW5wdXRLZXlJbWFnZXMgPSB2YWwua2V5X2ltYWdlcztcbiAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZSh0eC5nZXRJbnB1dHMoKSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgdHguc2V0SW5wdXRzKFtdKTtcbiAgICAgICAgZm9yIChsZXQgaW5wdXRLZXlJbWFnZSBvZiBpbnB1dEtleUltYWdlcykge1xuICAgICAgICAgIHR4LmdldElucHV0cygpLnB1c2gobmV3IE1vbmVyb091dHB1dFdhbGxldCgpLnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSgpLnNldEhleChpbnB1dEtleUltYWdlKSkuc2V0VHgodHgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNfYnlfZGVzdFwiKSB7XG4gICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUoaXNPdXRnb2luZyk7XG4gICAgICAgIGxldCBhbW91bnRzQnlEZXN0ID0gdmFsLmFtb3VudHM7XG4gICAgICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoLCBhbW91bnRzQnlEZXN0Lmxlbmd0aCk7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodHgpO1xuICAgICAgICB0cmFuc2Zlci5zZXREZXN0aW5hdGlvbnMoW10pO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHRyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpLnB1c2gobmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVtpXS5nZXRBZGRyZXNzKCksIEJpZ0ludChhbW91bnRzQnlEZXN0W2ldKSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZCB3aXRoIHRyYW5zZmVyOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGxpbmsgYmxvY2sgYW5kIHR4XG4gICAgaWYgKGhlYWRlcikgdHguc2V0QmxvY2sobmV3IE1vbmVyb0Jsb2NrKGhlYWRlcikuc2V0VHhzKFt0eF0pKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIGZpbmFsIGZpZWxkc1xuICAgIGlmICh0cmFuc2Zlcikge1xuICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgaWYgKCF0cmFuc2Zlci5nZXRUeCgpLmdldElzQ29uZmlybWVkKCkpIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICBpZiAoaXNPdXRnb2luZykge1xuICAgICAgICB0eC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgICAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpKSB7XG4gICAgICAgICAgaWYgKHRyYW5zZmVyLmdldERlc3RpbmF0aW9ucygpKSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0RGVzdGluYXRpb25zKHVuZGVmaW5lZCk7IC8vIG92ZXJ3cml0ZSB0byBhdm9pZCByZWNvbmNpbGUgZXJyb3IgVE9ETzogcmVtb3ZlIGFmdGVyID4xOC4zLjEgd2hlbiBhbW91bnRzX2J5X2Rlc3Qgc3VwcG9ydGVkXG4gICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLm1lcmdlKHRyYW5zZmVyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHR4LnNldE91dGdvaW5nVHJhbnNmZXIodHJhbnNmZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHguc2V0SXNJbmNvbWluZyh0cnVlKTtcbiAgICAgICAgdHguc2V0SW5jb21pbmdUcmFuc2ZlcnMoW3RyYW5zZmVyXSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHJldHVybiBpbml0aWFsaXplZCB0cmFuc2FjdGlvblxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhXYWxsZXRXaXRoT3V0cHV0KHJwY091dHB1dCkge1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhcbiAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoe3R4OiB0eH0pO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNPdXRwdXQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjT3V0cHV0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFtb3VudFwiKSBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGVudFwiKSBvdXRwdXQuc2V0SXNTcGVudCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImtleV9pbWFnZVwiKSB7IGlmIChcIlwiICE9PSB2YWwpIG91dHB1dC5zZXRLZXlJbWFnZShuZXcgTW9uZXJvS2V5SW1hZ2UodmFsKSk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJnbG9iYWxfaW5kZXhcIikgb3V0cHV0LnNldEluZGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaFwiKSB0eC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRcIikgdHguc2V0SXNMb2NrZWQoIXZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZnJvemVuXCIpIG91dHB1dC5zZXRJc0Zyb3plbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInB1YmtleVwiKSBvdXRwdXQuc2V0U3RlYWx0aFB1YmxpY0tleSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1YmFkZHJfaW5kZXhcIikge1xuICAgICAgICBvdXRwdXQuc2V0QWNjb3VudEluZGV4KHZhbC5tYWpvcik7XG4gICAgICAgIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgodmFsLm1pbm9yKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oZWlnaHRcIikgdHguc2V0QmxvY2soKG5ldyBNb25lcm9CbG9jaygpLnNldEhlaWdodCh2YWwpIGFzIE1vbmVyb0Jsb2NrKS5zZXRUeHMoW3R4IGFzIE1vbmVyb1R4XSkpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgdHJhbnNhY3Rpb24gZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCB3aXRoIG91dHB1dFxuICAgIHR4LnNldE91dHB1dHMoW291dHB1dF0pO1xuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjRGVzY3JpYmVUcmFuc2ZlcihycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0KSB7XG4gICAgbGV0IHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJkZXNjXCIpIHtcbiAgICAgICAgdHhTZXQuc2V0VHhzKFtdKTtcbiAgICAgICAgZm9yIChsZXQgdHhNYXAgb2YgdmFsKSB7XG4gICAgICAgICAgbGV0IHR4ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhUcmFuc2Zlcih0eE1hcCwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgICB0eC5zZXRUeFNldCh0eFNldCk7XG4gICAgICAgICAgdHhTZXQuZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdW1tYXJ5XCIpIHsgfSAvLyBUT0RPOiBzdXBwb3J0IHR4IHNldCBzdW1tYXJ5IGZpZWxkcz9cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGRlc2NkcmliZSB0cmFuc2ZlciBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gdHhTZXQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZWNvZGVzIGEgXCJ0eXBlXCIgZnJvbSBtb25lcm8td2FsbGV0LXJwYyB0byBpbml0aWFsaXplIHR5cGUgYW5kIHN0YXRlXG4gICAqIGZpZWxkcyBpbiB0aGUgZ2l2ZW4gdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBUT0RPOiB0aGVzZSBzaG91bGQgYmUgc2FmZSBzZXRcbiAgICogXG4gICAqIEBwYXJhbSBycGNUeXBlIGlzIHRoZSB0eXBlIHRvIGRlY29kZVxuICAgKiBAcGFyYW0gdHggaXMgdGhlIHRyYW5zYWN0aW9uIHRvIGRlY29kZSBrbm93biBmaWVsZHMgdG9cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgcnBjIHR5cGUgaW5kaWNhdGVzIG91dGdvaW5nIHhvciBpbmNvbWluZ1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBkZWNvZGVScGNUeXBlKHJwY1R5cGUsIHR4KSB7XG4gICAgbGV0IGlzT3V0Z29pbmc7XG4gICAgaWYgKHJwY1R5cGUgPT09IFwiaW5cIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcIm91dFwiKSB7XG4gICAgICBpc091dGdvaW5nID0gdHJ1ZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJwb29sXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSBmYWxzZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKHRydWUpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpOyAgLy8gVE9ETzogYnV0IGNvdWxkIGl0IGJlP1xuICAgIH0gZWxzZSBpZiAocnBjVHlwZSA9PT0gXCJwZW5kaW5nXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcImJsb2NrXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSBmYWxzZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgodHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcImZhaWxlZFwiKSB7XG4gICAgICBpc091dGdvaW5nID0gdHJ1ZTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVbnJlY29nbml6ZWQgdHJhbnNmZXIgdHlwZTogXCIgKyBycGNUeXBlKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzT3V0Z29pbmc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNZXJnZXMgYSB0cmFuc2FjdGlvbiBpbnRvIGEgdW5pcXVlIHNldCBvZiB0cmFuc2FjdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhXYWxsZXR9IHR4IC0gdGhlIHRyYW5zYWN0aW9uIHRvIG1lcmdlIGludG8gdGhlIGV4aXN0aW5nIHR4c1xuICAgKiBAcGFyYW0ge09iamVjdH0gdHhNYXAgLSBtYXBzIHR4IGhhc2hlcyB0byB0eHNcbiAgICogQHBhcmFtIHtPYmplY3R9IGJsb2NrTWFwIC0gbWFwcyBibG9jayBoZWlnaHRzIHRvIGJsb2Nrc1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBtZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApIHtcbiAgICBhc3NlcnQodHguZ2V0SGFzaCgpICE9PSB1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIG1lcmdlIHR4XG4gICAgbGV0IGFUeCA9IHR4TWFwW3R4LmdldEhhc2goKV07XG4gICAgaWYgKGFUeCA9PT0gdW5kZWZpbmVkKSB0eE1hcFt0eC5nZXRIYXNoKCldID0gdHg7IC8vIGNhY2hlIG5ldyB0eFxuICAgIGVsc2UgYVR4Lm1lcmdlKHR4KTsgLy8gbWVyZ2Ugd2l0aCBleGlzdGluZyB0eFxuICAgIFxuICAgIC8vIG1lcmdlIHR4J3MgYmxvY2sgaWYgY29uZmlybWVkXG4gICAgaWYgKHR4LmdldEhlaWdodCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBhQmxvY2sgPSBibG9ja01hcFt0eC5nZXRIZWlnaHQoKV07XG4gICAgICBpZiAoYUJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrTWFwW3R4LmdldEhlaWdodCgpXSA9IHR4LmdldEJsb2NrKCk7IC8vIGNhY2hlIG5ldyBibG9ja1xuICAgICAgZWxzZSBhQmxvY2subWVyZ2UodHguZ2V0QmxvY2soKSk7IC8vIG1lcmdlIHdpdGggZXhpc3RpbmcgYmxvY2tcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNhY3Rpb25zIGJ5IHRoZWlyIGhlaWdodC5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29tcGFyZVR4c0J5SGVpZ2h0KHR4MSwgdHgyKSB7XG4gICAgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4Mi5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMDsgLy8gYm90aCB1bmNvbmZpcm1lZFxuICAgIGVsc2UgaWYgKHR4MS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMTsgICAvLyB0eDEgaXMgdW5jb25maXJtZWRcbiAgICBlbHNlIGlmICh0eDIuZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIC0xOyAgLy8gdHgyIGlzIHVuY29uZmlybWVkXG4gICAgbGV0IGRpZmYgPSB0eDEuZ2V0SGVpZ2h0KCkgLSB0eDIuZ2V0SGVpZ2h0KCk7XG4gICAgaWYgKGRpZmYgIT09IDApIHJldHVybiBkaWZmO1xuICAgIHJldHVybiB0eDEuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4MSkgLSB0eDIuZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4Mik7IC8vIHR4cyBhcmUgaW4gdGhlIHNhbWUgYmxvY2sgc28gcmV0YWluIHRoZWlyIG9yaWdpbmFsIG9yZGVyXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb21wYXJlcyB0d28gdHJhbnNmZXJzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBzdGF0aWMgY29tcGFyZUluY29taW5nVHJhbnNmZXJzKHQxLCB0Mikge1xuICAgIGlmICh0MS5nZXRBY2NvdW50SW5kZXgoKSA8IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gLTE7XG4gICAgZWxzZSBpZiAodDEuZ2V0QWNjb3VudEluZGV4KCkgPT09IHQyLmdldEFjY291bnRJbmRleCgpKSByZXR1cm4gdDEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSB0Mi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICByZXR1cm4gMTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byBvdXRwdXRzIGJ5IGFzY2VuZGluZyBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbXBhcmVPdXRwdXRzKG8xLCBvMikge1xuICAgIFxuICAgIC8vIGNvbXBhcmUgYnkgaGVpZ2h0XG4gICAgbGV0IGhlaWdodENvbXBhcmlzb24gPSBNb25lcm9XYWxsZXRScGMuY29tcGFyZVR4c0J5SGVpZ2h0KG8xLmdldFR4KCksIG8yLmdldFR4KCkpO1xuICAgIGlmIChoZWlnaHRDb21wYXJpc29uICE9PSAwKSByZXR1cm4gaGVpZ2h0Q29tcGFyaXNvbjtcbiAgICBcbiAgICAvLyBjb21wYXJlIGJ5IGFjY291bnQgaW5kZXgsIHN1YmFkZHJlc3MgaW5kZXgsIG91dHB1dCBpbmRleCwgdGhlbiBrZXkgaW1hZ2UgaGV4XG4gICAgbGV0IGNvbXBhcmUgPSBvMS5nZXRBY2NvdW50SW5kZXgoKSAtIG8yLmdldEFjY291bnRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICBjb21wYXJlID0gbzEuZ2V0U3ViYWRkcmVzc0luZGV4KCkgLSBvMi5nZXRTdWJhZGRyZXNzSW5kZXgoKTtcbiAgICBpZiAoY29tcGFyZSAhPT0gMCkgcmV0dXJuIGNvbXBhcmU7XG4gICAgY29tcGFyZSA9IG8xLmdldEluZGV4KCkgLSBvMi5nZXRJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICByZXR1cm4gbzEuZ2V0S2V5SW1hZ2UoKS5nZXRIZXgoKS5sb2NhbGVDb21wYXJlKG8yLmdldEtleUltYWdlKCkuZ2V0SGV4KCkpO1xuICB9XG59XG5cbi8qKlxuICogUG9sbHMgbW9uZXJvLXdhbGxldC1ycGMgdG8gcHJvdmlkZSBsaXN0ZW5lciBub3RpZmljYXRpb25zLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRQb2xsZXIge1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBpc1BvbGxpbmc6IGJvb2xlYW47XG4gIHByb3RlY3RlZCB3YWxsZXQ6IE1vbmVyb1dhbGxldFJwYztcbiAgcHJvdGVjdGVkIGxvb3BlcjogVGFza0xvb3BlcjtcbiAgcHJvdGVjdGVkIHByZXZMb2NrZWRUeHM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnM6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZDb25maXJtZWROb3RpZmljYXRpb25zOiBhbnk7XG4gIHByb3RlY3RlZCB0aHJlYWRQb29sOiBhbnk7XG4gIHByb3RlY3RlZCBudW1Qb2xsaW5nOiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2SGVpZ2h0OiBhbnk7XG4gIHByb3RlY3RlZCBwcmV2QmFsYW5jZXM6IGFueTtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICB0aGlzLndhbGxldCA9IHdhbGxldDtcbiAgICB0aGlzLmxvb3BlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jIGZ1bmN0aW9uKCkgeyBhd2FpdCB0aGF0LnBvbGwoKTsgfSk7XG4gICAgdGhpcy5wcmV2TG9ja2VkVHhzID0gW107XG4gICAgdGhpcy5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zID0gbmV3IFNldCgpOyAvLyB0eCBoYXNoZXMgb2YgcHJldmlvdXMgbm90aWZpY2F0aW9uc1xuICAgIHRoaXMucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMgPSBuZXcgU2V0KCk7IC8vIHR4IGhhc2hlcyBvZiBwcmV2aW91c2x5IGNvbmZpcm1lZCBidXQgbm90IHlldCB1bmxvY2tlZCBub3RpZmljYXRpb25zXG4gICAgdGhpcy50aHJlYWRQb29sID0gbmV3IFRocmVhZFBvb2woMSk7IC8vIHN5bmNocm9uaXplIHBvbGxzXG4gICAgdGhpcy5udW1Qb2xsaW5nID0gMDtcbiAgfVxuICBcbiAgc2V0SXNQb2xsaW5nKGlzUG9sbGluZykge1xuICAgIHRoaXMuaXNQb2xsaW5nID0gaXNQb2xsaW5nO1xuICAgIGlmIChpc1BvbGxpbmcpIHRoaXMubG9vcGVyLnN0YXJ0KHRoaXMud2FsbGV0LmdldFN5bmNQZXJpb2RJbk1zKCkpO1xuICAgIGVsc2UgdGhpcy5sb29wZXIuc3RvcCgpO1xuICB9XG4gIFxuICBzZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpIHtcbiAgICB0aGlzLmxvb3Blci5zZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpO1xuICB9XG4gIFxuICBhc3luYyBwb2xsKCkge1xuXG4gICAgLy8gc2tpcCBpZiBuZXh0IHBvbGwgaXMgcXVldWVkXG4gICAgaWYgKHRoaXMubnVtUG9sbGluZyA+IDEpIHJldHVybjtcbiAgICB0aGlzLm51bVBvbGxpbmcrKztcbiAgICBcbiAgICAvLyBzeW5jaHJvbml6ZSBwb2xsc1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICByZXR1cm4gdGhpcy50aHJlYWRQb29sLnN1Ym1pdChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIFxuICAgICAgICAvLyBza2lwIGlmIHdhbGxldCBpcyBjbG9zZWRcbiAgICAgICAgaWYgKGF3YWl0IHRoYXQud2FsbGV0LmlzQ2xvc2VkKCkpIHtcbiAgICAgICAgICB0aGF0Lm51bVBvbGxpbmctLTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHRha2UgaW5pdGlhbCBzbmFwc2hvdFxuICAgICAgICBpZiAodGhhdC5wcmV2SGVpZ2h0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGF0LnByZXZIZWlnaHQgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRIZWlnaHQoKTtcbiAgICAgICAgICB0aGF0LnByZXZMb2NrZWRUeHMgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRUeHMobmV3IE1vbmVyb1R4UXVlcnkoKS5zZXRJc0xvY2tlZCh0cnVlKSk7XG4gICAgICAgICAgdGhhdC5wcmV2QmFsYW5jZXMgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRCYWxhbmNlcygpO1xuICAgICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgaGVpZ2h0IGNoYW5nZXNcbiAgICAgICAgbGV0IGhlaWdodCA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEhlaWdodCgpO1xuICAgICAgICBpZiAodGhhdC5wcmV2SGVpZ2h0ICE9PSBoZWlnaHQpIHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gdGhhdC5wcmV2SGVpZ2h0OyBpIDwgaGVpZ2h0OyBpKyspIGF3YWl0IHRoYXQub25OZXdCbG9jayhpKTtcbiAgICAgICAgICB0aGF0LnByZXZIZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGdldCBsb2NrZWQgdHhzIGZvciBjb21wYXJpc29uIHRvIHByZXZpb3VzXG4gICAgICAgIGxldCBtaW5IZWlnaHQgPSBNYXRoLm1heCgwLCBoZWlnaHQgLSA3MCk7IC8vIG9ubHkgbW9uaXRvciByZWNlbnQgdHhzXG4gICAgICAgIGxldCBsb2NrZWRUeHMgPSBhd2FpdCB0aGF0LndhbGxldC5nZXRUeHMobmV3IE1vbmVyb1R4UXVlcnkoKS5zZXRJc0xvY2tlZCh0cnVlKS5zZXRNaW5IZWlnaHQobWluSGVpZ2h0KS5zZXRJbmNsdWRlT3V0cHV0cyh0cnVlKSk7XG4gICAgICAgIFxuICAgICAgICAvLyBjb2xsZWN0IGhhc2hlcyBvZiB0eHMgbm8gbG9uZ2VyIGxvY2tlZFxuICAgICAgICBsZXQgbm9Mb25nZXJMb2NrZWRIYXNoZXMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgcHJldkxvY2tlZFR4IG9mIHRoYXQucHJldkxvY2tlZFR4cykge1xuICAgICAgICAgIGlmICh0aGF0LmdldFR4KGxvY2tlZFR4cywgcHJldkxvY2tlZFR4LmdldEhhc2goKSkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbm9Mb25nZXJMb2NrZWRIYXNoZXMucHVzaChwcmV2TG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHNhdmUgbG9ja2VkIHR4cyBmb3IgbmV4dCBjb21wYXJpc29uXG4gICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGxvY2tlZFR4cztcbiAgICAgICAgXG4gICAgICAgIC8vIGZldGNoIHR4cyB3aGljaCBhcmUgbm8gbG9uZ2VyIGxvY2tlZFxuICAgICAgICBsZXQgdW5sb2NrZWRUeHMgPSBub0xvbmdlckxvY2tlZEhhc2hlcy5sZW5ndGggPT09IDAgPyBbXSA6IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKGZhbHNlKS5zZXRNaW5IZWlnaHQobWluSGVpZ2h0KS5zZXRIYXNoZXMobm9Mb25nZXJMb2NrZWRIYXNoZXMpLnNldEluY2x1ZGVPdXRwdXRzKHRydWUpKTtcbiAgICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBuZXcgdW5jb25maXJtZWQgYW5kIGNvbmZpcm1lZCBvdXRwdXRzXG4gICAgICAgIGZvciAobGV0IGxvY2tlZFR4IG9mIGxvY2tlZFR4cykge1xuICAgICAgICAgIGxldCBzZWFyY2hTZXQgPSBsb2NrZWRUeC5nZXRJc0NvbmZpcm1lZCgpID8gdGhhdC5wcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucyA6IHRoYXQucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucztcbiAgICAgICAgICBsZXQgdW5hbm5vdW5jZWQgPSAhc2VhcmNoU2V0Lmhhcyhsb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIHNlYXJjaFNldC5hZGQobG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICBpZiAodW5hbm5vdW5jZWQpIGF3YWl0IHRoYXQubm90aWZ5T3V0cHV0cyhsb2NrZWRUeCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIG5ldyB1bmxvY2tlZCBvdXRwdXRzXG4gICAgICAgIGZvciAobGV0IHVubG9ja2VkVHggb2YgdW5sb2NrZWRUeHMpIHtcbiAgICAgICAgICB0aGF0LnByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnMuZGVsZXRlKHVubG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICB0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zLmRlbGV0ZSh1bmxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgYXdhaXQgdGhhdC5ub3RpZnlPdXRwdXRzKHVubG9ja2VkVHgpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBiYWxhbmNlIGNoYW5nZXNcbiAgICAgICAgYXdhaXQgdGhhdC5jaGVja0ZvckNoYW5nZWRCYWxhbmNlcygpO1xuICAgICAgICB0aGF0Lm51bVBvbGxpbmctLTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGJhY2tncm91bmQgcG9sbCBcIiArIGF3YWl0IHRoYXQud2FsbGV0LmdldFBhdGgoKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkge1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMud2FsbGV0LmdldExpc3RlbmVycygpKSBhd2FpdCBsaXN0ZW5lci5vbk5ld0Jsb2NrKGhlaWdodCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBub3RpZnlPdXRwdXRzKHR4KSB7XG4gIFxuICAgIC8vIG5vdGlmeSBzcGVudCBvdXRwdXRzIC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogbW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgYWxsb3cgc2NyYXBlIG9mIHR4IGlucHV0cyBzbyBwcm92aWRpbmcgb25lIGlucHV0IHdpdGggb3V0Z29pbmcgYW1vdW50XG4gICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQodHguZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCgpXG4gICAgICAgICAgLnNldEFtb3VudCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkgKyB0eC5nZXRGZWUoKSlcbiAgICAgICAgICAuc2V0QWNjb3VudEluZGV4KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBY2NvdW50SW5kZXgoKSlcbiAgICAgICAgICAuc2V0U3ViYWRkcmVzc0luZGV4KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSA/IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpWzBdIDogdW5kZWZpbmVkKSAvLyBpbml0aWFsaXplIGlmIHRyYW5zZmVyIHNvdXJjZWQgZnJvbSBzaW5nbGUgc3ViYWRkcmVzc1xuICAgICAgICAgIC5zZXRUeCh0eCk7XG4gICAgICB0eC5zZXRJbnB1dHMoW291dHB1dF0pO1xuICAgICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy53YWxsZXQuZ2V0TGlzdGVuZXJzKCkpIGF3YWl0IGxpc3RlbmVyLm9uT3V0cHV0U3BlbnQob3V0cHV0KTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IHJlY2VpdmVkIG91dHB1dHNcbiAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHguZ2V0T3V0cHV0cygpICE9PSB1bmRlZmluZWQgJiYgdHguZ2V0T3V0cHV0cygpLmxlbmd0aCA+IDApIHsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiBvdXRwdXRzIG9ubHkgcmV0dXJuZWQgZm9yIGNvbmZpcm1lZCB0eHNcbiAgICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmdldE91dHB1dHMoKSkge1xuICAgICAgICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMud2FsbGV0LmdldExpc3RlbmVycygpKSBhd2FpdCBsaXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKG91dHB1dCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogbW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgYWxsb3cgc2NyYXBlIG9mIHVuY29uZmlybWVkIHJlY2VpdmVkIG91dHB1dHMgc28gdXNpbmcgaW5jb21pbmcgdHJhbnNmZXIgdmFsdWVzXG4gICAgICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkpIHtcbiAgICAgICAgICBvdXRwdXRzLnB1c2gobmV3IE1vbmVyb091dHB1dFdhbGxldCgpXG4gICAgICAgICAgICAgIC5zZXRBY2NvdW50SW5kZXgodHJhbnNmZXIuZ2V0QWNjb3VudEluZGV4KCkpXG4gICAgICAgICAgICAgIC5zZXRTdWJhZGRyZXNzSW5kZXgodHJhbnNmZXIuZ2V0U3ViYWRkcmVzc0luZGV4KCkpXG4gICAgICAgICAgICAgIC5zZXRBbW91bnQodHJhbnNmZXIuZ2V0QW1vdW50KCkpXG4gICAgICAgICAgICAgIC5zZXRUeCh0eCkpO1xuICAgICAgICB9XG4gICAgICAgIHR4LnNldE91dHB1dHMob3V0cHV0cyk7XG4gICAgICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMud2FsbGV0LmdldExpc3RlbmVycygpKSB7XG4gICAgICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmdldE91dHB1dHMoKSkgYXdhaXQgbGlzdGVuZXIub25PdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgZ2V0VHgodHhzLCB0eEhhc2gpIHtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIGlmICh0eEhhc2ggPT09IHR4LmdldEhhc2goKSkgcmV0dXJuIHR4O1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjaGVja0ZvckNoYW5nZWRCYWxhbmNlcygpIHtcbiAgICBsZXQgYmFsYW5jZXMgPSBhd2FpdCB0aGlzLndhbGxldC5nZXRCYWxhbmNlcygpO1xuICAgIGlmIChiYWxhbmNlc1swXSAhPT0gdGhpcy5wcmV2QmFsYW5jZXNbMF0gfHwgYmFsYW5jZXNbMV0gIT09IHRoaXMucHJldkJhbGFuY2VzWzFdKSB7XG4gICAgICB0aGlzLnByZXZCYWxhbmNlcyA9IGJhbGFuY2VzO1xuICAgICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgYXdhaXQgdGhpcy53YWxsZXQuZ2V0TGlzdGVuZXJzKCkpIGF3YWl0IGxpc3RlbmVyLm9uQmFsYW5jZXNDaGFuZ2VkKGJhbGFuY2VzWzBdLCBiYWxhbmNlc1sxXSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxhQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxXQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxjQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxpQkFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU0sdUJBQUEsR0FBQVAsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFPLFlBQUEsR0FBQVIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFRLGtCQUFBLEdBQUFULHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUyxtQkFBQSxHQUFBVixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVUsY0FBQSxHQUFBWCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVcsa0JBQUEsR0FBQVosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFZLFlBQUEsR0FBQWIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFhLHVCQUFBLEdBQUFkLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBYyx3QkFBQSxHQUFBZixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWUsZUFBQSxHQUFBaEIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFnQiwyQkFBQSxHQUFBakIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFpQixtQkFBQSxHQUFBbEIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFrQix5QkFBQSxHQUFBbkIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFtQix5QkFBQSxHQUFBcEIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFvQix1QkFBQSxHQUFBckIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFxQixrQkFBQSxHQUFBdEIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFzQixtQkFBQSxHQUFBdkIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUF1QixvQkFBQSxHQUFBeEIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUF3QixlQUFBLEdBQUF6QixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXlCLGlCQUFBLEdBQUExQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQTBCLGlCQUFBLEdBQUEzQixzQkFBQSxDQUFBQyxPQUFBOztBQUVBLElBQUEyQixvQkFBQSxHQUFBNUIsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBNEIsZUFBQSxHQUFBN0Isc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUE2QixjQUFBLEdBQUE5QixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQThCLFlBQUEsR0FBQS9CLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBK0IsZUFBQSxHQUFBaEMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFnQyxZQUFBLEdBQUFqQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWlDLGNBQUEsR0FBQWxDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBa0MsYUFBQSxHQUFBbkMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFtQyxtQkFBQSxHQUFBcEMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFvQyxxQkFBQSxHQUFBckMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFxQywyQkFBQSxHQUFBdEMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFzQyw2QkFBQSxHQUFBdkMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUF1QyxXQUFBLEdBQUF4QyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXdDLFdBQUEsR0FBQXpDLHNCQUFBLENBQUFDLE9BQUEsMEJBQThDLFNBQUF5Qyx5QkFBQUMsV0FBQSxjQUFBQyxPQUFBLGlDQUFBQyxpQkFBQSxPQUFBRCxPQUFBLE9BQUFFLGdCQUFBLE9BQUFGLE9BQUEsV0FBQUYsd0JBQUEsWUFBQUEsQ0FBQUMsV0FBQSxVQUFBQSxXQUFBLEdBQUFHLGdCQUFBLEdBQUFELGlCQUFBLElBQUFGLFdBQUEsWUFBQUksd0JBQUFDLEdBQUEsRUFBQUwsV0FBQSxRQUFBQSxXQUFBLElBQUFLLEdBQUEsSUFBQUEsR0FBQSxDQUFBQyxVQUFBLFVBQUFELEdBQUEsTUFBQUEsR0FBQSxvQkFBQUEsR0FBQSx3QkFBQUEsR0FBQSwyQkFBQUUsT0FBQSxFQUFBRixHQUFBLFFBQUFHLEtBQUEsR0FBQVQsd0JBQUEsQ0FBQUMsV0FBQSxNQUFBUSxLQUFBLElBQUFBLEtBQUEsQ0FBQUMsR0FBQSxDQUFBSixHQUFBLFdBQUFHLEtBQUEsQ0FBQUUsR0FBQSxDQUFBTCxHQUFBLE9BQUFNLE1BQUEsVUFBQUMscUJBQUEsR0FBQUMsTUFBQSxDQUFBQyxjQUFBLElBQUFELE1BQUEsQ0FBQUUsd0JBQUEsVUFBQUMsR0FBQSxJQUFBWCxHQUFBLE9BQUFXLEdBQUEsa0JBQUFILE1BQUEsQ0FBQUksU0FBQSxDQUFBQyxjQUFBLENBQUFDLElBQUEsQ0FBQWQsR0FBQSxFQUFBVyxHQUFBLFFBQUFJLElBQUEsR0FBQVIscUJBQUEsR0FBQUMsTUFBQSxDQUFBRSx3QkFBQSxDQUFBVixHQUFBLEVBQUFXLEdBQUEsYUFBQUksSUFBQSxLQUFBQSxJQUFBLENBQUFWLEdBQUEsSUFBQVUsSUFBQSxDQUFBQyxHQUFBLElBQUFSLE1BQUEsQ0FBQUMsY0FBQSxDQUFBSCxNQUFBLEVBQUFLLEdBQUEsRUFBQUksSUFBQSxVQUFBVCxNQUFBLENBQUFLLEdBQUEsSUFBQVgsR0FBQSxDQUFBVyxHQUFBLEtBQUFMLE1BQUEsQ0FBQUosT0FBQSxHQUFBRixHQUFBLEtBQUFHLEtBQUEsR0FBQUEsS0FBQSxDQUFBYSxHQUFBLENBQUFoQixHQUFBLEVBQUFNLE1BQUEsVUFBQUEsTUFBQTs7O0FBRzlDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ2UsTUFBTVcsZUFBZSxTQUFTQyxxQkFBWSxDQUFDOztFQUV4RDtFQUNBLE9BQTBCQyx5QkFBeUIsR0FBRyxLQUFLLENBQUMsQ0FBQzs7RUFFN0Q7Ozs7Ozs7Ozs7RUFVQTtFQUNBQyxXQUFXQSxDQUFDQyxNQUEwQixFQUFFO0lBQ3RDLEtBQUssQ0FBQyxDQUFDO0lBQ1AsSUFBSSxDQUFDQSxNQUFNLEdBQUdBLE1BQU07SUFDcEIsSUFBSSxDQUFDQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4QixJQUFJLENBQUNDLGNBQWMsR0FBR04sZUFBZSxDQUFDRSx5QkFBeUI7SUFDL0QsSUFBSSxDQUFDSyxTQUFTLEdBQUcsRUFBRTtFQUNyQjs7RUFFQTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0VDLFVBQVVBLENBQUEsRUFBaUI7SUFDekIsT0FBTyxJQUFJLENBQUNDLE9BQU87RUFDckI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTUMsV0FBV0EsQ0FBQ0MsS0FBSyxHQUFHLEtBQUssRUFBZ0M7SUFDN0QsSUFBSSxJQUFJLENBQUNGLE9BQU8sS0FBS0csU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyx1REFBdUQsQ0FBQztJQUM5RyxJQUFJQyxhQUFhLEdBQUdDLGlCQUFRLENBQUNDLFNBQVMsQ0FBQyxJQUFJLENBQUNDLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDM0QsS0FBSyxJQUFJQyxRQUFRLElBQUlKLGFBQWEsRUFBRSxNQUFNLElBQUksQ0FBQ0ssY0FBYyxDQUFDRCxRQUFRLENBQUM7SUFDdkUsT0FBT0gsaUJBQVEsQ0FBQ0ssV0FBVyxDQUFDLElBQUksQ0FBQ1gsT0FBTyxFQUFFRSxLQUFLLEdBQUcsU0FBUyxHQUFHQyxTQUFTLENBQUM7RUFDMUU7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFUyxnQkFBZ0JBLENBQUEsRUFBb0M7SUFDbEQsT0FBTyxJQUFJLENBQUNqQixNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQztFQUNoQzs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNQyxVQUFVQSxDQUFDQyxZQUFrRCxFQUFFQyxRQUFpQixFQUE0Qjs7SUFFaEg7SUFDQSxJQUFJckIsTUFBTSxHQUFHLElBQUlzQiwyQkFBa0IsQ0FBQyxPQUFPRixZQUFZLEtBQUssUUFBUSxHQUFHLEVBQUNHLElBQUksRUFBRUgsWUFBWSxFQUFFQyxRQUFRLEVBQUVBLFFBQVEsR0FBR0EsUUFBUSxHQUFHLEVBQUUsRUFBQyxHQUFHRCxZQUFZLENBQUM7SUFDL0k7O0lBRUE7SUFDQSxJQUFJLENBQUNwQixNQUFNLENBQUN3QixPQUFPLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSWYsb0JBQVcsQ0FBQyxxQ0FBcUMsQ0FBQztJQUNuRixNQUFNLElBQUksQ0FBQ1QsTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGFBQWEsRUFBRSxFQUFDQyxRQUFRLEVBQUUxQixNQUFNLENBQUN3QixPQUFPLENBQUMsQ0FBQyxFQUFFSCxRQUFRLEVBQUVyQixNQUFNLENBQUMyQixXQUFXLENBQUMsQ0FBQyxFQUFDLENBQUM7SUFDMUgsTUFBTSxJQUFJLENBQUNDLEtBQUssQ0FBQyxDQUFDO0lBQ2xCLElBQUksQ0FBQ0wsSUFBSSxHQUFHdkIsTUFBTSxDQUFDd0IsT0FBTyxDQUFDLENBQUM7O0lBRTVCO0lBQ0EsSUFBSXhCLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJLENBQUNXLG1CQUFtQixDQUFDN0IsTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUMxRSxPQUFPLElBQUk7RUFDYjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNWSxZQUFZQSxDQUFDOUIsTUFBbUMsRUFBNEI7O0lBRWhGO0lBQ0EsSUFBSUEsTUFBTSxLQUFLUSxTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLHNDQUFzQyxDQUFDO0lBQ3ZGLE1BQU1zQixnQkFBZ0IsR0FBRyxJQUFJVCwyQkFBa0IsQ0FBQ3RCLE1BQU0sQ0FBQztJQUN2RCxJQUFJK0IsZ0JBQWdCLENBQUNDLE9BQU8sQ0FBQyxDQUFDLEtBQUt4QixTQUFTLEtBQUt1QixnQkFBZ0IsQ0FBQ0UsaUJBQWlCLENBQUMsQ0FBQyxLQUFLekIsU0FBUyxJQUFJdUIsZ0JBQWdCLENBQUNHLGlCQUFpQixDQUFDLENBQUMsS0FBSzFCLFNBQVMsSUFBSXVCLGdCQUFnQixDQUFDSSxrQkFBa0IsQ0FBQyxDQUFDLEtBQUszQixTQUFTLENBQUMsRUFBRTtNQUNqTixNQUFNLElBQUlDLG9CQUFXLENBQUMsNERBQTRELENBQUM7SUFDckY7SUFDQSxJQUFJc0IsZ0JBQWdCLENBQUNLLGNBQWMsQ0FBQyxDQUFDLEtBQUs1QixTQUFTLEVBQUUsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLGtHQUFrRyxDQUFDO0lBQzlLLElBQUlzQixnQkFBZ0IsQ0FBQ00sbUJBQW1CLENBQUMsQ0FBQyxLQUFLN0IsU0FBUyxJQUFJdUIsZ0JBQWdCLENBQUNPLHNCQUFzQixDQUFDLENBQUMsS0FBSzlCLFNBQVMsRUFBRSxNQUFNLElBQUlDLG9CQUFXLENBQUMsd0ZBQXdGLENBQUM7SUFDcE8sSUFBSXNCLGdCQUFnQixDQUFDSixXQUFXLENBQUMsQ0FBQyxLQUFLbkIsU0FBUyxFQUFFdUIsZ0JBQWdCLENBQUNRLFdBQVcsQ0FBQyxFQUFFLENBQUM7O0lBRWxGO0lBQ0EsSUFBSVIsZ0JBQWdCLENBQUNDLE9BQU8sQ0FBQyxDQUFDLEtBQUt4QixTQUFTLEVBQUUsTUFBTSxJQUFJLENBQUNnQyxvQkFBb0IsQ0FBQ1QsZ0JBQWdCLENBQUMsQ0FBQztJQUMzRixJQUFJQSxnQkFBZ0IsQ0FBQ0ksa0JBQWtCLENBQUMsQ0FBQyxLQUFLM0IsU0FBUyxJQUFJdUIsZ0JBQWdCLENBQUNFLGlCQUFpQixDQUFDLENBQUMsS0FBS3pCLFNBQVMsRUFBRSxNQUFNLElBQUksQ0FBQ2lDLG9CQUFvQixDQUFDVixnQkFBZ0IsQ0FBQyxDQUFDO0lBQ2pLLE1BQU0sSUFBSSxDQUFDVyxrQkFBa0IsQ0FBQ1gsZ0JBQWdCLENBQUM7O0lBRXBEO0lBQ0EsSUFBSUEsZ0JBQWdCLENBQUNZLG9CQUFvQixDQUFDLENBQUMsRUFBRTtNQUMzQyxJQUFJWixnQkFBZ0IsQ0FBQ2IsU0FBUyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUlULG9CQUFXLENBQUMsNEVBQTRFLENBQUM7TUFDckksTUFBTSxJQUFJLENBQUNtQyxvQkFBb0IsQ0FBQ2IsZ0JBQWdCLENBQUNZLG9CQUFvQixDQUFDLENBQUMsQ0FBQztJQUMxRSxDQUFDLE1BQU0sSUFBSVosZ0JBQWdCLENBQUNiLFNBQVMsQ0FBQyxDQUFDLEVBQUU7TUFDdkMsTUFBTSxJQUFJLENBQUNXLG1CQUFtQixDQUFDRSxnQkFBZ0IsQ0FBQ2IsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUM5RDs7SUFFQSxPQUFPLElBQUk7RUFDYjs7RUFFQSxNQUFnQndCLGtCQUFrQkEsQ0FBQzFDLE1BQTBCLEVBQUU7SUFDN0QsSUFBSUEsTUFBTSxDQUFDNkMsYUFBYSxDQUFDLENBQUMsS0FBS3JDLFNBQVMsRUFBRSxNQUFNLElBQUlDLG9CQUFXLENBQUMsdURBQXVELENBQUM7SUFDeEgsSUFBSVQsTUFBTSxDQUFDOEMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLdEMsU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQywwREFBMEQsQ0FBQztJQUM5SCxJQUFJVCxNQUFNLENBQUMrQyxjQUFjLENBQUMsQ0FBQyxLQUFLLEtBQUssRUFBRSxNQUFNLElBQUl0QyxvQkFBVyxDQUFDLG1FQUFtRSxDQUFDO0lBQ2pJLElBQUksQ0FBQ1QsTUFBTSxDQUFDd0IsT0FBTyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUlmLG9CQUFXLENBQUMseUJBQXlCLENBQUM7SUFDdkUsSUFBSSxDQUFDVCxNQUFNLENBQUNnRCxXQUFXLENBQUMsQ0FBQyxFQUFFaEQsTUFBTSxDQUFDaUQsV0FBVyxDQUFDcEQscUJBQVksQ0FBQ3FELGdCQUFnQixDQUFDO0lBQzVFLElBQUlDLE1BQU0sR0FBRyxFQUFFekIsUUFBUSxFQUFFMUIsTUFBTSxDQUFDd0IsT0FBTyxDQUFDLENBQUMsRUFBRUgsUUFBUSxFQUFFckIsTUFBTSxDQUFDMkIsV0FBVyxDQUFDLENBQUMsRUFBRXlCLFFBQVEsRUFBRXBELE1BQU0sQ0FBQ2dELFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRyxJQUFJO01BQ0YsTUFBTSxJQUFJLENBQUNoRCxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsZUFBZSxFQUFFMEIsTUFBTSxDQUFDO0lBQ3hFLENBQUMsQ0FBQyxPQUFPRSxHQUFRLEVBQUU7TUFDakIsSUFBSSxDQUFDQyx1QkFBdUIsQ0FBQ3RELE1BQU0sQ0FBQ3dCLE9BQU8sQ0FBQyxDQUFDLEVBQUU2QixHQUFHLENBQUM7SUFDckQ7SUFDQSxNQUFNLElBQUksQ0FBQ3pCLEtBQUssQ0FBQyxDQUFDO0lBQ2xCLElBQUksQ0FBQ0wsSUFBSSxHQUFHdkIsTUFBTSxDQUFDd0IsT0FBTyxDQUFDLENBQUM7SUFDNUIsT0FBTyxJQUFJO0VBQ2I7O0VBRUEsTUFBZ0JnQixvQkFBb0JBLENBQUN4QyxNQUEwQixFQUFFO0lBQy9ELElBQUk7TUFDRixNQUFNLElBQUksQ0FBQ0EsTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLDhCQUE4QixFQUFFO1FBQzVFQyxRQUFRLEVBQUUxQixNQUFNLENBQUN3QixPQUFPLENBQUMsQ0FBQztRQUMxQkgsUUFBUSxFQUFFckIsTUFBTSxDQUFDMkIsV0FBVyxDQUFDLENBQUM7UUFDOUI0QixJQUFJLEVBQUV2RCxNQUFNLENBQUNnQyxPQUFPLENBQUMsQ0FBQztRQUN0QndCLFdBQVcsRUFBRXhELE1BQU0sQ0FBQzZDLGFBQWEsQ0FBQyxDQUFDO1FBQ25DWSw0QkFBNEIsRUFBRXpELE1BQU0sQ0FBQzBELGFBQWEsQ0FBQyxDQUFDO1FBQ3BEQyxjQUFjLEVBQUUzRCxNQUFNLENBQUM4QyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3pDTSxRQUFRLEVBQUVwRCxNQUFNLENBQUNnRCxXQUFXLENBQUMsQ0FBQztRQUM5QlksZ0JBQWdCLEVBQUU1RCxNQUFNLENBQUMrQyxjQUFjLENBQUM7TUFDMUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLE9BQU9NLEdBQVEsRUFBRTtNQUNqQixJQUFJLENBQUNDLHVCQUF1QixDQUFDdEQsTUFBTSxDQUFDd0IsT0FBTyxDQUFDLENBQUMsRUFBRTZCLEdBQUcsQ0FBQztJQUNyRDtJQUNBLE1BQU0sSUFBSSxDQUFDekIsS0FBSyxDQUFDLENBQUM7SUFDbEIsSUFBSSxDQUFDTCxJQUFJLEdBQUd2QixNQUFNLENBQUN3QixPQUFPLENBQUMsQ0FBQztJQUM1QixPQUFPLElBQUk7RUFDYjs7RUFFQSxNQUFnQmlCLG9CQUFvQkEsQ0FBQ3pDLE1BQTBCLEVBQUU7SUFDL0QsSUFBSUEsTUFBTSxDQUFDNkMsYUFBYSxDQUFDLENBQUMsS0FBS3JDLFNBQVMsRUFBRSxNQUFNLElBQUlDLG9CQUFXLENBQUMsMERBQTBELENBQUM7SUFDM0gsSUFBSVQsTUFBTSxDQUFDOEMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLdEMsU0FBUyxFQUFFUixNQUFNLENBQUM2RCxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7SUFDdkUsSUFBSTdELE1BQU0sQ0FBQ2dELFdBQVcsQ0FBQyxDQUFDLEtBQUt4QyxTQUFTLEVBQUVSLE1BQU0sQ0FBQ2lELFdBQVcsQ0FBQ3BELHFCQUFZLENBQUNxRCxnQkFBZ0IsQ0FBQztJQUN6RixJQUFJO01BQ0YsTUFBTSxJQUFJLENBQUNsRCxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsb0JBQW9CLEVBQUU7UUFDbEVDLFFBQVEsRUFBRTFCLE1BQU0sQ0FBQ3dCLE9BQU8sQ0FBQyxDQUFDO1FBQzFCSCxRQUFRLEVBQUVyQixNQUFNLENBQUMyQixXQUFXLENBQUMsQ0FBQztRQUM5Qm1DLE9BQU8sRUFBRTlELE1BQU0sQ0FBQ2lDLGlCQUFpQixDQUFDLENBQUM7UUFDbkM4QixPQUFPLEVBQUUvRCxNQUFNLENBQUNrQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ25DOEIsUUFBUSxFQUFFaEUsTUFBTSxDQUFDbUMsa0JBQWtCLENBQUMsQ0FBQztRQUNyQ3dCLGNBQWMsRUFBRTNELE1BQU0sQ0FBQzhDLGdCQUFnQixDQUFDLENBQUM7UUFDekNjLGdCQUFnQixFQUFFNUQsTUFBTSxDQUFDK0MsY0FBYyxDQUFDO01BQzFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxPQUFPTSxHQUFRLEVBQUU7TUFDakIsSUFBSSxDQUFDQyx1QkFBdUIsQ0FBQ3RELE1BQU0sQ0FBQ3dCLE9BQU8sQ0FBQyxDQUFDLEVBQUU2QixHQUFHLENBQUM7SUFDckQ7SUFDQSxNQUFNLElBQUksQ0FBQ3pCLEtBQUssQ0FBQyxDQUFDO0lBQ2xCLElBQUksQ0FBQ0wsSUFBSSxHQUFHdkIsTUFBTSxDQUFDd0IsT0FBTyxDQUFDLENBQUM7SUFDNUIsT0FBTyxJQUFJO0VBQ2I7O0VBRVU4Qix1QkFBdUJBLENBQUNXLElBQUksRUFBRVosR0FBRyxFQUFFO0lBQzNDLElBQUlBLEdBQUcsQ0FBQ2EsT0FBTyxLQUFLLHVDQUF1QyxFQUFFLE1BQU0sSUFBSUMsdUJBQWMsQ0FBQyx5QkFBeUIsR0FBR0YsSUFBSSxFQUFFWixHQUFHLENBQUNlLE9BQU8sQ0FBQyxDQUFDLEVBQUVmLEdBQUcsQ0FBQ2dCLFlBQVksQ0FBQyxDQUFDLEVBQUVoQixHQUFHLENBQUNpQixZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQzlLLElBQUlqQixHQUFHLENBQUNhLE9BQU8sS0FBSyw4Q0FBOEMsRUFBRSxNQUFNLElBQUlDLHVCQUFjLENBQUMsa0JBQWtCLEVBQUVkLEdBQUcsQ0FBQ2UsT0FBTyxDQUFDLENBQUMsRUFBRWYsR0FBRyxDQUFDZ0IsWUFBWSxDQUFDLENBQUMsRUFBRWhCLEdBQUcsQ0FBQ2lCLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDdkssTUFBTWpCLEdBQUc7RUFDWDs7RUFFQSxNQUFNa0IsVUFBVUEsQ0FBQSxFQUFxQjtJQUNuQyxJQUFJO01BQ0YsTUFBTSxJQUFJLENBQUN2RSxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUMrQyxRQUFRLEVBQUUsVUFBVSxFQUFDLENBQUM7TUFDbEYsT0FBTyxLQUFLLENBQUMsQ0FBQztJQUNoQixDQUFDLENBQUMsT0FBT0MsQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLE9BQU8sSUFBSSxDQUFDLENBQUU7TUFDdkMsSUFBSUssQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLE9BQU8sS0FBSyxDQUFDLENBQUU7TUFDdkMsTUFBTUssQ0FBQztJQUNUO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNNUMsbUJBQW1CQSxDQUFDNkMsZUFBOEMsRUFBRUMsU0FBbUIsRUFBRUMsVUFBdUIsRUFBaUI7SUFDckksSUFBSUMsVUFBVSxHQUFHLENBQUNILGVBQWUsR0FBR2xFLFNBQVMsR0FBR2tFLGVBQWUsWUFBWUksNEJBQW1CLEdBQUdKLGVBQWUsR0FBRyxJQUFJSSw0QkFBbUIsQ0FBQ0osZUFBZSxDQUFDO0lBQzNKLElBQUksQ0FBQ0UsVUFBVSxFQUFFQSxVQUFVLEdBQUcsSUFBSUcsbUJBQVUsQ0FBQyxDQUFDO0lBQzlDLElBQUk1QixNQUFXLEdBQUcsQ0FBQyxDQUFDO0lBQ3BCQSxNQUFNLENBQUNXLE9BQU8sR0FBR2UsVUFBVSxHQUFHQSxVQUFVLENBQUNHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUM7SUFDL0Q3QixNQUFNLENBQUM4QixRQUFRLEdBQUdKLFVBQVUsR0FBR0EsVUFBVSxDQUFDSyxXQUFXLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDNUQvQixNQUFNLENBQUM5QixRQUFRLEdBQUd3RCxVQUFVLEdBQUdBLFVBQVUsQ0FBQ2xELFdBQVcsQ0FBQyxDQUFDLEdBQUcsRUFBRTtJQUM1RHdCLE1BQU0sQ0FBQ2dDLE9BQU8sR0FBR1IsU0FBUztJQUMxQnhCLE1BQU0sQ0FBQ2lDLFdBQVcsR0FBRyxZQUFZO0lBQ2pDakMsTUFBTSxDQUFDa0Msb0JBQW9CLEdBQUdULFVBQVUsQ0FBQ1UsaUJBQWlCLENBQUMsQ0FBQztJQUM1RG5DLE1BQU0sQ0FBQ29DLG9CQUFvQixHQUFJWCxVQUFVLENBQUNZLGtCQUFrQixDQUFDLENBQUM7SUFDOURyQyxNQUFNLENBQUNzQyxXQUFXLEdBQUdiLFVBQVUsQ0FBQ2MsMkJBQTJCLENBQUMsQ0FBQztJQUM3RHZDLE1BQU0sQ0FBQ3dDLHdCQUF3QixHQUFHZixVQUFVLENBQUNnQixzQkFBc0IsQ0FBQyxDQUFDO0lBQ3JFekMsTUFBTSxDQUFDMEMsa0JBQWtCLEdBQUdqQixVQUFVLENBQUNrQixlQUFlLENBQUMsQ0FBQztJQUN4RCxNQUFNLElBQUksQ0FBQzlGLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxZQUFZLEVBQUUwQixNQUFNLENBQUM7SUFDbkUsSUFBSSxDQUFDNEMsZ0JBQWdCLEdBQUdsQixVQUFVO0VBQ3BDOztFQUVBLE1BQU1tQixtQkFBbUJBLENBQUEsRUFBaUM7SUFDeEQsT0FBTyxJQUFJLENBQUNELGdCQUFnQjtFQUM5Qjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU1FLFdBQVdBLENBQUNDLFVBQW1CLEVBQUVDLGFBQXNCLEVBQXFCO0lBQ2hGLElBQUlELFVBQVUsS0FBSzFGLFNBQVMsRUFBRTtNQUM1QjRGLGVBQU0sQ0FBQ0MsS0FBSyxDQUFDRixhQUFhLEVBQUUzRixTQUFTLEVBQUUsa0RBQWtELENBQUM7TUFDMUYsSUFBSThGLE9BQU8sR0FBR0MsTUFBTSxDQUFDLENBQUMsQ0FBQztNQUN2QixJQUFJQyxlQUFlLEdBQUdELE1BQU0sQ0FBQyxDQUFDLENBQUM7TUFDL0IsS0FBSyxJQUFJRSxPQUFPLElBQUksTUFBTSxJQUFJLENBQUNDLFdBQVcsQ0FBQyxDQUFDLEVBQUU7UUFDNUNKLE9BQU8sR0FBR0EsT0FBTyxHQUFHRyxPQUFPLENBQUNFLFVBQVUsQ0FBQyxDQUFDO1FBQ3hDSCxlQUFlLEdBQUdBLGVBQWUsR0FBR0MsT0FBTyxDQUFDRyxrQkFBa0IsQ0FBQyxDQUFDO01BQ2xFO01BQ0EsT0FBTyxDQUFDTixPQUFPLEVBQUVFLGVBQWUsQ0FBQztJQUNuQyxDQUFDLE1BQU07TUFDTCxJQUFJckQsTUFBTSxHQUFHLEVBQUMwRCxhQUFhLEVBQUVYLFVBQVUsRUFBRVksZUFBZSxFQUFFWCxhQUFhLEtBQUszRixTQUFTLEdBQUdBLFNBQVMsR0FBRyxDQUFDMkYsYUFBYSxDQUFDLEVBQUM7TUFDcEgsSUFBSVksSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGFBQWEsRUFBRTBCLE1BQU0sQ0FBQztNQUMvRSxJQUFJZ0QsYUFBYSxLQUFLM0YsU0FBUyxFQUFFLE9BQU8sQ0FBQytGLE1BQU0sQ0FBQ1EsSUFBSSxDQUFDQyxNQUFNLENBQUNWLE9BQU8sQ0FBQyxFQUFFQyxNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7TUFDdkcsT0FBTyxDQUFDVixNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDRSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUNaLE9BQU8sQ0FBQyxFQUFFQyxNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDRSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUNELGdCQUFnQixDQUFDLENBQUM7SUFDckg7RUFDRjs7RUFFQTs7RUFFQSxNQUFNRSxXQUFXQSxDQUFDckcsUUFBOEIsRUFBaUI7SUFDL0QsSUFBQXNGLGVBQU0sRUFBQ3RGLFFBQVEsWUFBWXNHLDZCQUFvQixFQUFFLG1EQUFtRCxDQUFDO0lBQ3JHLElBQUksQ0FBQ2pILFNBQVMsQ0FBQ2tILElBQUksQ0FBQ3ZHLFFBQVEsQ0FBQztJQUM3QixJQUFJLENBQUN3RyxnQkFBZ0IsQ0FBQyxDQUFDO0VBQ3pCOztFQUVBLE1BQU12RyxjQUFjQSxDQUFDRCxRQUFRLEVBQWlCO0lBQzVDLElBQUl5RyxHQUFHLEdBQUcsSUFBSSxDQUFDcEgsU0FBUyxDQUFDcUgsT0FBTyxDQUFDMUcsUUFBUSxDQUFDO0lBQzFDLElBQUl5RyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDcEgsU0FBUyxDQUFDc0gsTUFBTSxDQUFDRixHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDdkMsTUFBTSxJQUFJOUcsb0JBQVcsQ0FBQyx3Q0FBd0MsQ0FBQztJQUNwRSxJQUFJLENBQUM2RyxnQkFBZ0IsQ0FBQyxDQUFDO0VBQ3pCOztFQUVBekcsWUFBWUEsQ0FBQSxFQUEyQjtJQUNyQyxPQUFPLElBQUksQ0FBQ1YsU0FBUztFQUN2Qjs7RUFFQSxNQUFNdUgsbUJBQW1CQSxDQUFBLEVBQXFCO0lBQzVDLElBQUk7TUFDRixNQUFNLElBQUksQ0FBQ0MsaUJBQWlCLENBQUMsTUFBTSxJQUFJLENBQUMxRixpQkFBaUIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7TUFDdEUsTUFBTSxJQUFJeEIsb0JBQVcsQ0FBQyxnQ0FBZ0MsQ0FBQztJQUN6RCxDQUFDLENBQUMsT0FBT2dFLENBQU0sRUFBRTtNQUNmLE9BQU9BLENBQUMsQ0FBQ1AsT0FBTyxDQUFDc0QsT0FBTyxDQUFDLDZCQUE2QixDQUFDLEdBQUcsQ0FBQztJQUM3RDtFQUNGOztFQUVBLE1BQU1JLFVBQVVBLENBQUEsRUFBMkI7SUFDekMsSUFBSWIsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGFBQWEsQ0FBQztJQUN2RSxPQUFPLElBQUlvRyxzQkFBYSxDQUFDZCxJQUFJLENBQUNDLE1BQU0sQ0FBQ2MsT0FBTyxFQUFFZixJQUFJLENBQUNDLE1BQU0sQ0FBQ2UsT0FBTyxDQUFDO0VBQ3BFOztFQUVBLE1BQU12RyxPQUFPQSxDQUFBLEVBQW9CO0lBQy9CLE9BQU8sSUFBSSxDQUFDRCxJQUFJO0VBQ2xCOztFQUVBLE1BQU1TLE9BQU9BLENBQUEsRUFBb0I7SUFDL0IsSUFBSStFLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRStDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQy9GLE9BQU91QyxJQUFJLENBQUNDLE1BQU0sQ0FBQzFILEdBQUc7RUFDeEI7O0VBRUEsTUFBTTBJLGVBQWVBLENBQUEsRUFBb0I7SUFDdkMsSUFBSSxPQUFNLElBQUksQ0FBQ2hHLE9BQU8sQ0FBQyxDQUFDLE1BQUt4QixTQUFTLEVBQUUsT0FBT0EsU0FBUztJQUN4RCxNQUFNLElBQUlDLG9CQUFXLENBQUMsaURBQWlELENBQUM7RUFDMUU7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU13SCxnQkFBZ0JBLENBQUEsRUFBRztJQUN2QixPQUFPLENBQUMsTUFBTSxJQUFJLENBQUNqSSxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsZUFBZSxDQUFDLEVBQUV1RixNQUFNLENBQUNrQixTQUFTO0VBQzFGOztFQUVBLE1BQU1oRyxpQkFBaUJBLENBQUEsRUFBb0I7SUFDekMsSUFBSTZFLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRStDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQy9GLE9BQU91QyxJQUFJLENBQUNDLE1BQU0sQ0FBQzFILEdBQUc7RUFDeEI7O0VBRUEsTUFBTTZDLGtCQUFrQkEsQ0FBQSxFQUFvQjtJQUMxQyxJQUFJNEUsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLFdBQVcsRUFBRSxFQUFFK0MsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDaEcsT0FBT3VDLElBQUksQ0FBQ0MsTUFBTSxDQUFDMUgsR0FBRztFQUN4Qjs7RUFFQSxNQUFNNkksVUFBVUEsQ0FBQ2pDLFVBQWtCLEVBQUVDLGFBQXFCLEVBQW1CO0lBQzNFLElBQUlpQyxhQUFhLEdBQUcsSUFBSSxDQUFDbkksWUFBWSxDQUFDaUcsVUFBVSxDQUFDO0lBQ2pELElBQUksQ0FBQ2tDLGFBQWEsRUFBRTtNQUNsQixNQUFNLElBQUksQ0FBQ0MsZUFBZSxDQUFDbkMsVUFBVSxFQUFFMUYsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUU7TUFDMUQsT0FBTyxJQUFJLENBQUMySCxVQUFVLENBQUNqQyxVQUFVLEVBQUVDLGFBQWEsQ0FBQyxDQUFDLENBQVE7SUFDNUQ7SUFDQSxJQUFJckMsT0FBTyxHQUFHc0UsYUFBYSxDQUFDakMsYUFBYSxDQUFDO0lBQzFDLElBQUksQ0FBQ3JDLE9BQU8sRUFBRTtNQUNaLE1BQU0sSUFBSSxDQUFDdUUsZUFBZSxDQUFDbkMsVUFBVSxFQUFFMUYsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUU7TUFDMUQsT0FBTyxJQUFJLENBQUNQLFlBQVksQ0FBQ2lHLFVBQVUsQ0FBQyxDQUFDQyxhQUFhLENBQUM7SUFDckQ7SUFDQSxPQUFPckMsT0FBTztFQUNoQjs7RUFFQTtFQUNBLE1BQU13RSxlQUFlQSxDQUFDeEUsT0FBZSxFQUE2Qjs7SUFFaEU7SUFDQSxJQUFJaUQsSUFBSTtJQUNSLElBQUk7TUFDRkEsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLG1CQUFtQixFQUFFLEVBQUNxQyxPQUFPLEVBQUVBLE9BQU8sRUFBQyxDQUFDO0lBQy9GLENBQUMsQ0FBQyxPQUFPVyxDQUFNLEVBQUU7TUFDZixJQUFJQSxDQUFDLENBQUNMLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJM0Qsb0JBQVcsQ0FBQ2dFLENBQUMsQ0FBQ1AsT0FBTyxDQUFDO01BQ3hELE1BQU1PLENBQUM7SUFDVDs7SUFFQTtJQUNBLElBQUk4RCxVQUFVLEdBQUcsSUFBSUMseUJBQWdCLENBQUMsRUFBQzFFLE9BQU8sRUFBRUEsT0FBTyxFQUFDLENBQUM7SUFDekR5RSxVQUFVLENBQUNFLGVBQWUsQ0FBQzFCLElBQUksQ0FBQ0MsTUFBTSxDQUFDMEIsS0FBSyxDQUFDQyxLQUFLLENBQUM7SUFDbkRKLFVBQVUsQ0FBQ0ssUUFBUSxDQUFDN0IsSUFBSSxDQUFDQyxNQUFNLENBQUMwQixLQUFLLENBQUNHLEtBQUssQ0FBQztJQUM1QyxPQUFPTixVQUFVO0VBQ25COztFQUVBLE1BQU1PLG9CQUFvQkEsQ0FBQ0MsZUFBd0IsRUFBRUMsU0FBa0IsRUFBb0M7SUFDekcsSUFBSTtNQUNGLElBQUlDLG9CQUFvQixHQUFHLENBQUMsTUFBTSxJQUFJLENBQUNqSixNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMseUJBQXlCLEVBQUUsRUFBQ3lILGdCQUFnQixFQUFFSCxlQUFlLEVBQUVJLFVBQVUsRUFBRUgsU0FBUyxFQUFDLENBQUMsRUFBRWhDLE1BQU0sQ0FBQ29DLGtCQUFrQjtNQUMzTCxPQUFPLE1BQU0sSUFBSSxDQUFDQyx1QkFBdUIsQ0FBQ0osb0JBQW9CLENBQUM7SUFDakUsQ0FBQyxDQUFDLE9BQU94RSxDQUFNLEVBQUU7TUFDZixJQUFJQSxDQUFDLENBQUNQLE9BQU8sQ0FBQ29GLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLE1BQU0sSUFBSTdJLG9CQUFXLENBQUMsc0JBQXNCLEdBQUd1SSxTQUFTLENBQUM7TUFDdkcsTUFBTXZFLENBQUM7SUFDVDtFQUNGOztFQUVBLE1BQU00RSx1QkFBdUJBLENBQUNFLGlCQUF5QixFQUFvQztJQUN6RixJQUFJeEMsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLDBCQUEwQixFQUFFLEVBQUMySCxrQkFBa0IsRUFBRUcsaUJBQWlCLEVBQUMsQ0FBQztJQUM3SCxPQUFPLElBQUlDLGdDQUF1QixDQUFDLENBQUMsQ0FBQ0Msa0JBQWtCLENBQUMxQyxJQUFJLENBQUNDLE1BQU0sQ0FBQ2tDLGdCQUFnQixDQUFDLENBQUNRLFlBQVksQ0FBQzNDLElBQUksQ0FBQ0MsTUFBTSxDQUFDbUMsVUFBVSxDQUFDLENBQUNRLG9CQUFvQixDQUFDSixpQkFBaUIsQ0FBQztFQUNwSzs7RUFFQSxNQUFNSyxTQUFTQSxDQUFBLEVBQW9CO0lBQ2pDLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQzVKLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxZQUFZLENBQUMsRUFBRXVGLE1BQU0sQ0FBQzZDLE1BQU07RUFDcEY7O0VBRUEsTUFBTUMsZUFBZUEsQ0FBQSxFQUFvQjtJQUN2QyxNQUFNLElBQUlySixvQkFBVyxDQUFDLDZEQUE2RCxDQUFDO0VBQ3RGOztFQUVBLE1BQU1zSixlQUFlQSxDQUFDQyxJQUFZLEVBQUVDLEtBQWEsRUFBRUMsR0FBVyxFQUFtQjtJQUMvRSxNQUFNLElBQUl6SixvQkFBVyxDQUFDLDZEQUE2RCxDQUFDO0VBQ3RGOztFQUVBLE1BQU0wSixJQUFJQSxDQUFDQyxxQkFBcUQsRUFBRUMsV0FBb0IsRUFBNkI7SUFDakgsSUFBQWpFLGVBQU0sRUFBQyxFQUFFZ0UscUJBQXFCLFlBQVloRCw2QkFBb0IsQ0FBQyxFQUFFLDREQUE0RCxDQUFDO0lBQzlILElBQUk7TUFDRixJQUFJTCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMvRyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsU0FBUyxFQUFFLEVBQUM2SSxZQUFZLEVBQUVELFdBQVcsRUFBQyxFQUFFLENBQUMsQ0FBQztNQUNuRyxNQUFNLElBQUksQ0FBQ0UsSUFBSSxDQUFDLENBQUM7TUFDakIsT0FBTyxJQUFJQyx5QkFBZ0IsQ0FBQ3pELElBQUksQ0FBQ0MsTUFBTSxDQUFDeUQsY0FBYyxFQUFFMUQsSUFBSSxDQUFDQyxNQUFNLENBQUMwRCxjQUFjLENBQUM7SUFDckYsQ0FBQyxDQUFDLE9BQU9ySCxHQUFRLEVBQUU7TUFDakIsSUFBSUEsR0FBRyxDQUFDYSxPQUFPLEtBQUsseUJBQXlCLEVBQUUsTUFBTSxJQUFJekQsb0JBQVcsQ0FBQyxtQ0FBbUMsQ0FBQztNQUN6RyxNQUFNNEMsR0FBRztJQUNYO0VBQ0Y7O0VBRUEsTUFBTXNILFlBQVlBLENBQUN6SyxjQUF1QixFQUFpQjs7SUFFekQ7SUFDQSxJQUFJMEssbUJBQW1CLEdBQUdDLElBQUksQ0FBQ0MsS0FBSyxDQUFDLENBQUM1SyxjQUFjLEtBQUtNLFNBQVMsR0FBR1osZUFBZSxDQUFDRSx5QkFBeUIsR0FBR0ksY0FBYyxJQUFJLElBQUksQ0FBQzs7SUFFeEk7SUFDQSxNQUFNLElBQUksQ0FBQ0YsTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGNBQWMsRUFBRTtNQUM1RHNKLE1BQU0sRUFBRSxJQUFJO01BQ1pDLE1BQU0sRUFBRUo7SUFDVixDQUFDLENBQUM7O0lBRUY7SUFDQSxJQUFJLENBQUMxSyxjQUFjLEdBQUcwSyxtQkFBbUIsR0FBRyxJQUFJO0lBQ2hELElBQUksSUFBSSxDQUFDSyxZQUFZLEtBQUt6SyxTQUFTLEVBQUUsSUFBSSxDQUFDeUssWUFBWSxDQUFDQyxhQUFhLENBQUNoTCxjQUFjLENBQUM7O0lBRXBGO0lBQ0EsTUFBTSxJQUFJLENBQUNxSyxJQUFJLENBQUMsQ0FBQztFQUNuQjs7RUFFQVksaUJBQWlCQSxDQUFBLEVBQVc7SUFDMUIsT0FBTyxJQUFJLENBQUNqTCxjQUFjO0VBQzVCOztFQUVBLE1BQU1rTCxXQUFXQSxDQUFBLEVBQWtCO0lBQ2pDLE9BQU8sSUFBSSxDQUFDcEwsTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGNBQWMsRUFBRSxFQUFFc0osTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7RUFDbkY7O0VBRUEsTUFBTU0sT0FBT0EsQ0FBQ0MsUUFBa0IsRUFBaUI7SUFDL0MsSUFBSSxDQUFDQSxRQUFRLElBQUksQ0FBQ0EsUUFBUSxDQUFDQyxNQUFNLEVBQUUsTUFBTSxJQUFJOUssb0JBQVcsQ0FBQyw0QkFBNEIsQ0FBQztJQUN0RixNQUFNLElBQUksQ0FBQ1QsTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLFNBQVMsRUFBRSxFQUFDK0osS0FBSyxFQUFFRixRQUFRLEVBQUMsQ0FBQztJQUMzRSxNQUFNLElBQUksQ0FBQ2YsSUFBSSxDQUFDLENBQUM7RUFDbkI7O0VBRUEsTUFBTWtCLFdBQVdBLENBQUEsRUFBa0I7SUFDakMsTUFBTSxJQUFJLENBQUN6TCxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsY0FBYyxFQUFFakIsU0FBUyxFQUFFLENBQUMsQ0FBQztFQUM3RTs7RUFFQSxNQUFNa0wsZ0JBQWdCQSxDQUFBLEVBQWtCO0lBQ3RDLE1BQU0sSUFBSSxDQUFDMUwsTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLG1CQUFtQixFQUFFakIsU0FBUyxFQUFFLENBQUMsQ0FBQztFQUNsRjs7RUFFQSxNQUFNbUcsVUFBVUEsQ0FBQ1QsVUFBbUIsRUFBRUMsYUFBc0IsRUFBbUI7SUFDN0UsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDRixXQUFXLENBQUNDLFVBQVUsRUFBRUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQy9EOztFQUVBLE1BQU1TLGtCQUFrQkEsQ0FBQ1YsVUFBbUIsRUFBRUMsYUFBc0IsRUFBbUI7SUFDckYsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDRixXQUFXLENBQUNDLFVBQVUsRUFBRUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQy9EOztFQUVBLE1BQU1PLFdBQVdBLENBQUNpRixtQkFBNkIsRUFBRUMsR0FBWSxFQUFFQyxZQUFzQixFQUE0Qjs7SUFFL0c7SUFDQSxJQUFJOUUsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGNBQWMsRUFBRSxFQUFDbUssR0FBRyxFQUFFQSxHQUFHLEVBQUMsQ0FBQzs7SUFFcEY7SUFDQTtJQUNBLElBQUlFLFFBQXlCLEdBQUcsRUFBRTtJQUNsQyxLQUFLLElBQUlDLFVBQVUsSUFBSWhGLElBQUksQ0FBQ0MsTUFBTSxDQUFDZ0YsbUJBQW1CLEVBQUU7TUFDdEQsSUFBSXZGLE9BQU8sR0FBRzdHLGVBQWUsQ0FBQ3FNLGlCQUFpQixDQUFDRixVQUFVLENBQUM7TUFDM0QsSUFBSUosbUJBQW1CLEVBQUVsRixPQUFPLENBQUN5RixlQUFlLENBQUMsTUFBTSxJQUFJLENBQUM3RCxlQUFlLENBQUM1QixPQUFPLENBQUMwRixRQUFRLENBQUMsQ0FBQyxFQUFFM0wsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO01BQ2pIc0wsUUFBUSxDQUFDekUsSUFBSSxDQUFDWixPQUFPLENBQUM7SUFDeEI7O0lBRUE7SUFDQSxJQUFJa0YsbUJBQW1CLElBQUksQ0FBQ0UsWUFBWSxFQUFFOztNQUV4QztNQUNBLEtBQUssSUFBSXBGLE9BQU8sSUFBSXFGLFFBQVEsRUFBRTtRQUM1QixLQUFLLElBQUl2RCxVQUFVLElBQUk5QixPQUFPLENBQUM0QixlQUFlLENBQUMsQ0FBQyxFQUFFO1VBQ2hERSxVQUFVLENBQUM2RCxVQUFVLENBQUM3RixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDaENnQyxVQUFVLENBQUM4RCxrQkFBa0IsQ0FBQzlGLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztVQUN4Q2dDLFVBQVUsQ0FBQytELG9CQUFvQixDQUFDLENBQUMsQ0FBQztVQUNsQy9ELFVBQVUsQ0FBQ2dFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztRQUNwQztNQUNGOztNQUVBO01BQ0F4RixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMvRyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsYUFBYSxFQUFFLEVBQUMrSyxZQUFZLEVBQUUsSUFBSSxFQUFDLENBQUM7TUFDekYsSUFBSXpGLElBQUksQ0FBQ0MsTUFBTSxDQUFDRSxjQUFjLEVBQUU7UUFDOUIsS0FBSyxJQUFJdUYsYUFBYSxJQUFJMUYsSUFBSSxDQUFDQyxNQUFNLENBQUNFLGNBQWMsRUFBRTtVQUNwRCxJQUFJcUIsVUFBVSxHQUFHM0ksZUFBZSxDQUFDOE0sb0JBQW9CLENBQUNELGFBQWEsQ0FBQzs7VUFFcEU7VUFDQSxJQUFJaEcsT0FBTyxHQUFHcUYsUUFBUSxDQUFDdkQsVUFBVSxDQUFDb0UsZUFBZSxDQUFDLENBQUMsQ0FBQztVQUNwRHZHLGVBQU0sQ0FBQ0MsS0FBSyxDQUFDa0MsVUFBVSxDQUFDb0UsZUFBZSxDQUFDLENBQUMsRUFBRWxHLE9BQU8sQ0FBQzBGLFFBQVEsQ0FBQyxDQUFDLEVBQUUsK0JBQStCLENBQUMsQ0FBQyxDQUFFO1VBQ2xHLElBQUlTLGFBQWEsR0FBR25HLE9BQU8sQ0FBQzRCLGVBQWUsQ0FBQyxDQUFDLENBQUNFLFVBQVUsQ0FBQzRELFFBQVEsQ0FBQyxDQUFDLENBQUM7VUFDcEUvRixlQUFNLENBQUNDLEtBQUssQ0FBQ2tDLFVBQVUsQ0FBQzRELFFBQVEsQ0FBQyxDQUFDLEVBQUVTLGFBQWEsQ0FBQ1QsUUFBUSxDQUFDLENBQUMsRUFBRSxtQ0FBbUMsQ0FBQztVQUNsRyxJQUFJNUQsVUFBVSxDQUFDNUIsVUFBVSxDQUFDLENBQUMsS0FBS25HLFNBQVMsRUFBRW9NLGFBQWEsQ0FBQ1IsVUFBVSxDQUFDN0QsVUFBVSxDQUFDNUIsVUFBVSxDQUFDLENBQUMsQ0FBQztVQUM1RixJQUFJNEIsVUFBVSxDQUFDM0Isa0JBQWtCLENBQUMsQ0FBQyxLQUFLcEcsU0FBUyxFQUFFb00sYUFBYSxDQUFDUCxrQkFBa0IsQ0FBQzlELFVBQVUsQ0FBQzNCLGtCQUFrQixDQUFDLENBQUMsQ0FBQztVQUNwSCxJQUFJMkIsVUFBVSxDQUFDc0Usb0JBQW9CLENBQUMsQ0FBQyxLQUFLck0sU0FBUyxFQUFFb00sYUFBYSxDQUFDTixvQkFBb0IsQ0FBQy9ELFVBQVUsQ0FBQ3NFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztRQUM1SDtNQUNGO0lBQ0Y7O0lBRUEsT0FBT2YsUUFBUTtFQUNqQjs7RUFFQTtFQUNBLE1BQU1nQixVQUFVQSxDQUFDNUcsVUFBa0IsRUFBRXlGLG1CQUE2QixFQUFFRSxZQUFzQixFQUEwQjtJQUNsSCxJQUFBekYsZUFBTSxFQUFDRixVQUFVLElBQUksQ0FBQyxDQUFDO0lBQ3ZCLEtBQUssSUFBSU8sT0FBTyxJQUFJLE1BQU0sSUFBSSxDQUFDQyxXQUFXLENBQUMsQ0FBQyxFQUFFO01BQzVDLElBQUlELE9BQU8sQ0FBQzBGLFFBQVEsQ0FBQyxDQUFDLEtBQUtqRyxVQUFVLEVBQUU7UUFDckMsSUFBSXlGLG1CQUFtQixFQUFFbEYsT0FBTyxDQUFDeUYsZUFBZSxDQUFDLE1BQU0sSUFBSSxDQUFDN0QsZUFBZSxDQUFDbkMsVUFBVSxFQUFFMUYsU0FBUyxFQUFFcUwsWUFBWSxDQUFDLENBQUM7UUFDakgsT0FBT3BGLE9BQU87TUFDaEI7SUFDRjtJQUNBLE1BQU0sSUFBSXNHLEtBQUssQ0FBQyxxQkFBcUIsR0FBRzdHLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQztFQUN6RTs7RUFFQSxNQUFNOEcsYUFBYUEsQ0FBQ0MsS0FBYyxFQUEwQjtJQUMxREEsS0FBSyxHQUFHQSxLQUFLLEdBQUdBLEtBQUssR0FBR3pNLFNBQVM7SUFDakMsSUFBSXVHLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFDd0wsS0FBSyxFQUFFQSxLQUFLLEVBQUMsQ0FBQztJQUMxRixPQUFPLElBQUlDLHNCQUFhLENBQUM7TUFDdkJ4RSxLQUFLLEVBQUUzQixJQUFJLENBQUNDLE1BQU0sQ0FBQ0gsYUFBYTtNQUNoQ3NHLGNBQWMsRUFBRXBHLElBQUksQ0FBQ0MsTUFBTSxDQUFDbEQsT0FBTztNQUNuQ21KLEtBQUssRUFBRUEsS0FBSztNQUNaM0csT0FBTyxFQUFFQyxNQUFNLENBQUMsQ0FBQyxDQUFDO01BQ2xCQyxlQUFlLEVBQUVELE1BQU0sQ0FBQyxDQUFDO0lBQzNCLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU04QixlQUFlQSxDQUFDbkMsVUFBa0IsRUFBRWtILGlCQUE0QixFQUFFdkIsWUFBc0IsRUFBK0I7O0lBRTNIO0lBQ0EsSUFBSTFJLE1BQVcsR0FBRyxDQUFDLENBQUM7SUFDcEJBLE1BQU0sQ0FBQzBELGFBQWEsR0FBR1gsVUFBVTtJQUNqQyxJQUFJa0gsaUJBQWlCLEVBQUVqSyxNQUFNLENBQUNrSyxhQUFhLEdBQUcxTSxpQkFBUSxDQUFDMk0sT0FBTyxDQUFDRixpQkFBaUIsQ0FBQztJQUNqRixJQUFJckcsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGFBQWEsRUFBRTBCLE1BQU0sQ0FBQzs7SUFFL0U7SUFDQSxJQUFJb0ssWUFBWSxHQUFHLEVBQUU7SUFDckIsS0FBSyxJQUFJZCxhQUFhLElBQUkxRixJQUFJLENBQUNDLE1BQU0sQ0FBQ3dHLFNBQVMsRUFBRTtNQUMvQyxJQUFJakYsVUFBVSxHQUFHM0ksZUFBZSxDQUFDOE0sb0JBQW9CLENBQUNELGFBQWEsQ0FBQztNQUNwRWxFLFVBQVUsQ0FBQ0UsZUFBZSxDQUFDdkMsVUFBVSxDQUFDO01BQ3RDcUgsWUFBWSxDQUFDbEcsSUFBSSxDQUFDa0IsVUFBVSxDQUFDO0lBQy9COztJQUVBO0lBQ0EsSUFBSSxDQUFDc0QsWUFBWSxFQUFFOztNQUVqQjtNQUNBLEtBQUssSUFBSXRELFVBQVUsSUFBSWdGLFlBQVksRUFBRTtRQUNuQ2hGLFVBQVUsQ0FBQzZELFVBQVUsQ0FBQzdGLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoQ2dDLFVBQVUsQ0FBQzhELGtCQUFrQixDQUFDOUYsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hDZ0MsVUFBVSxDQUFDK0Qsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQ2xDL0QsVUFBVSxDQUFDZ0Usb0JBQW9CLENBQUMsQ0FBQyxDQUFDO01BQ3BDOztNQUVBO01BQ0F4RixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMvRyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsYUFBYSxFQUFFMEIsTUFBTSxDQUFDO01BQzNFLElBQUk0RCxJQUFJLENBQUNDLE1BQU0sQ0FBQ0UsY0FBYyxFQUFFO1FBQzlCLEtBQUssSUFBSXVGLGFBQWEsSUFBSTFGLElBQUksQ0FBQ0MsTUFBTSxDQUFDRSxjQUFjLEVBQUU7VUFDcEQsSUFBSXFCLFVBQVUsR0FBRzNJLGVBQWUsQ0FBQzhNLG9CQUFvQixDQUFDRCxhQUFhLENBQUM7O1VBRXBFO1VBQ0EsS0FBSyxJQUFJRyxhQUFhLElBQUlXLFlBQVksRUFBRTtZQUN0QyxJQUFJWCxhQUFhLENBQUNULFFBQVEsQ0FBQyxDQUFDLEtBQUs1RCxVQUFVLENBQUM0RCxRQUFRLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQztZQUNsRSxJQUFJNUQsVUFBVSxDQUFDNUIsVUFBVSxDQUFDLENBQUMsS0FBS25HLFNBQVMsRUFBRW9NLGFBQWEsQ0FBQ1IsVUFBVSxDQUFDN0QsVUFBVSxDQUFDNUIsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUM1RixJQUFJNEIsVUFBVSxDQUFDM0Isa0JBQWtCLENBQUMsQ0FBQyxLQUFLcEcsU0FBUyxFQUFFb00sYUFBYSxDQUFDUCxrQkFBa0IsQ0FBQzlELFVBQVUsQ0FBQzNCLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUNwSCxJQUFJMkIsVUFBVSxDQUFDc0Usb0JBQW9CLENBQUMsQ0FBQyxLQUFLck0sU0FBUyxFQUFFb00sYUFBYSxDQUFDTixvQkFBb0IsQ0FBQy9ELFVBQVUsQ0FBQ3NFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztZQUMxSCxJQUFJdEUsVUFBVSxDQUFDa0Ysb0JBQW9CLENBQUMsQ0FBQyxLQUFLak4sU0FBUyxFQUFFb00sYUFBYSxDQUFDTCxvQkFBb0IsQ0FBQ2hFLFVBQVUsQ0FBQ2tGLG9CQUFvQixDQUFDLENBQUMsQ0FBQztVQUM1SDtRQUNGO01BQ0Y7SUFDRjs7SUFFQTtJQUNBLElBQUlyRixhQUFhLEdBQUcsSUFBSSxDQUFDbkksWUFBWSxDQUFDaUcsVUFBVSxDQUFDO0lBQ2pELElBQUksQ0FBQ2tDLGFBQWEsRUFBRTtNQUNsQkEsYUFBYSxHQUFHLENBQUMsQ0FBQztNQUNsQixJQUFJLENBQUNuSSxZQUFZLENBQUNpRyxVQUFVLENBQUMsR0FBR2tDLGFBQWE7SUFDL0M7SUFDQSxLQUFLLElBQUlHLFVBQVUsSUFBSWdGLFlBQVksRUFBRTtNQUNuQ25GLGFBQWEsQ0FBQ0csVUFBVSxDQUFDNEQsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHNUQsVUFBVSxDQUFDSixVQUFVLENBQUMsQ0FBQztJQUNoRTs7SUFFQTtJQUNBLE9BQU9vRixZQUFZO0VBQ3JCOztFQUVBLE1BQU1HLGFBQWFBLENBQUN4SCxVQUFrQixFQUFFQyxhQUFxQixFQUFFMEYsWUFBc0IsRUFBNkI7SUFDaEgsSUFBQXpGLGVBQU0sRUFBQ0YsVUFBVSxJQUFJLENBQUMsQ0FBQztJQUN2QixJQUFBRSxlQUFNLEVBQUNELGFBQWEsSUFBSSxDQUFDLENBQUM7SUFDMUIsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDa0MsZUFBZSxDQUFDbkMsVUFBVSxFQUFFLENBQUNDLGFBQWEsQ0FBQyxFQUFFMEYsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQ25GOztFQUVBLE1BQU04QixnQkFBZ0JBLENBQUN6SCxVQUFrQixFQUFFK0csS0FBYyxFQUE2Qjs7SUFFcEY7SUFDQSxJQUFJbEcsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGdCQUFnQixFQUFFLEVBQUNvRixhQUFhLEVBQUVYLFVBQVUsRUFBRStHLEtBQUssRUFBRUEsS0FBSyxFQUFDLENBQUM7O0lBRXJIO0lBQ0EsSUFBSTFFLFVBQVUsR0FBRyxJQUFJQyx5QkFBZ0IsQ0FBQyxDQUFDO0lBQ3ZDRCxVQUFVLENBQUNFLGVBQWUsQ0FBQ3ZDLFVBQVUsQ0FBQztJQUN0Q3FDLFVBQVUsQ0FBQ0ssUUFBUSxDQUFDN0IsSUFBSSxDQUFDQyxNQUFNLENBQUNxRyxhQUFhLENBQUM7SUFDOUM5RSxVQUFVLENBQUNxRixVQUFVLENBQUM3RyxJQUFJLENBQUNDLE1BQU0sQ0FBQ2xELE9BQU8sQ0FBQztJQUMxQ3lFLFVBQVUsQ0FBQ3NGLFFBQVEsQ0FBQ1osS0FBSyxHQUFHQSxLQUFLLEdBQUd6TSxTQUFTLENBQUM7SUFDOUMrSCxVQUFVLENBQUM2RCxVQUFVLENBQUM3RixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDaENnQyxVQUFVLENBQUM4RCxrQkFBa0IsQ0FBQzlGLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4Q2dDLFVBQVUsQ0FBQytELG9CQUFvQixDQUFDLENBQUMsQ0FBQztJQUNsQy9ELFVBQVUsQ0FBQ3VGLFNBQVMsQ0FBQyxLQUFLLENBQUM7SUFDM0J2RixVQUFVLENBQUNnRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFDbEMsT0FBT2hFLFVBQVU7RUFDbkI7O0VBRUEsTUFBTXdGLGtCQUFrQkEsQ0FBQzdILFVBQWtCLEVBQUVDLGFBQXFCLEVBQUU4RyxLQUFhLEVBQWlCO0lBQ2hHLE1BQU0sSUFBSSxDQUFDak4sTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGVBQWUsRUFBRSxFQUFDaUgsS0FBSyxFQUFFLEVBQUNDLEtBQUssRUFBRXpDLFVBQVUsRUFBRTJDLEtBQUssRUFBRTFDLGFBQWEsRUFBQyxFQUFFOEcsS0FBSyxFQUFFQSxLQUFLLEVBQUMsQ0FBQztFQUNsSTs7RUFFQSxNQUFNZSxNQUFNQSxDQUFDQyxLQUF5QyxFQUE2Qjs7SUFFakY7SUFDQSxNQUFNQyxlQUFlLEdBQUdyTyxxQkFBWSxDQUFDc08sZ0JBQWdCLENBQUNGLEtBQUssQ0FBQzs7SUFFNUQ7SUFDQSxJQUFJRyxhQUFhLEdBQUdGLGVBQWUsQ0FBQ0csZ0JBQWdCLENBQUMsQ0FBQztJQUN0RCxJQUFJQyxVQUFVLEdBQUdKLGVBQWUsQ0FBQ0ssYUFBYSxDQUFDLENBQUM7SUFDaEQsSUFBSUMsV0FBVyxHQUFHTixlQUFlLENBQUNPLGNBQWMsQ0FBQyxDQUFDO0lBQ2xEUCxlQUFlLENBQUNRLGdCQUFnQixDQUFDbE8sU0FBUyxDQUFDO0lBQzNDME4sZUFBZSxDQUFDUyxhQUFhLENBQUNuTyxTQUFTLENBQUM7SUFDeEMwTixlQUFlLENBQUNVLGNBQWMsQ0FBQ3BPLFNBQVMsQ0FBQzs7SUFFekM7SUFDQSxJQUFJcU8sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDQyxlQUFlLENBQUMsSUFBSUMsNEJBQW1CLENBQUMsQ0FBQyxDQUFDQyxVQUFVLENBQUNwUCxlQUFlLENBQUNxUCxlQUFlLENBQUNmLGVBQWUsQ0FBQ2dCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztJQUV6STtJQUNBLElBQUlDLEdBQUcsR0FBRyxFQUFFO0lBQ1osSUFBSUMsTUFBTSxHQUFHLElBQUlDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLEtBQUssSUFBSUMsUUFBUSxJQUFJVCxTQUFTLEVBQUU7TUFDOUIsSUFBSSxDQUFDTyxNQUFNLENBQUNyUSxHQUFHLENBQUN1USxRQUFRLENBQUNDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNqQ0osR0FBRyxDQUFDOUgsSUFBSSxDQUFDaUksUUFBUSxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzFCSCxNQUFNLENBQUNJLEdBQUcsQ0FBQ0YsUUFBUSxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDO01BQzlCO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJRSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSUMsUUFBUSxHQUFHLENBQUMsQ0FBQztJQUNqQixLQUFLLElBQUlDLEVBQUUsSUFBSVIsR0FBRyxFQUFFO01BQ2xCdlAsZUFBZSxDQUFDZ1EsT0FBTyxDQUFDRCxFQUFFLEVBQUVGLEtBQUssRUFBRUMsUUFBUSxDQUFDO0lBQzlDOztJQUVBO0lBQ0EsSUFBSXhCLGVBQWUsQ0FBQzJCLGlCQUFpQixDQUFDLENBQUMsSUFBSXJCLFdBQVcsRUFBRTs7TUFFdEQ7TUFDQSxJQUFJc0IsY0FBYyxHQUFHLENBQUN0QixXQUFXLEdBQUdBLFdBQVcsQ0FBQ1UsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJYSwwQkFBaUIsQ0FBQyxDQUFDLEVBQUVmLFVBQVUsQ0FBQ3BQLGVBQWUsQ0FBQ3FQLGVBQWUsQ0FBQ2YsZUFBZSxDQUFDZ0IsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3JKLElBQUljLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQ0MsYUFBYSxDQUFDSCxjQUFjLENBQUM7O01BRXREO01BQ0EsSUFBSUksU0FBUyxHQUFHLEVBQUU7TUFDbEIsS0FBSyxJQUFJQyxNQUFNLElBQUlILE9BQU8sRUFBRTtRQUMxQixJQUFJLENBQUNFLFNBQVMsQ0FBQzVHLFFBQVEsQ0FBQzZHLE1BQU0sQ0FBQ1osS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1VBQ3ZDM1AsZUFBZSxDQUFDZ1EsT0FBTyxDQUFDTyxNQUFNLENBQUNaLEtBQUssQ0FBQyxDQUFDLEVBQUVFLEtBQUssRUFBRUMsUUFBUSxDQUFDO1VBQ3hEUSxTQUFTLENBQUM3SSxJQUFJLENBQUM4SSxNQUFNLENBQUNaLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDaEM7TUFDRjtJQUNGOztJQUVBO0lBQ0FyQixlQUFlLENBQUNRLGdCQUFnQixDQUFDTixhQUFhLENBQUM7SUFDL0NGLGVBQWUsQ0FBQ1MsYUFBYSxDQUFDTCxVQUFVLENBQUM7SUFDekNKLGVBQWUsQ0FBQ1UsY0FBYyxDQUFDSixXQUFXLENBQUM7O0lBRTNDO0lBQ0EsSUFBSTRCLFVBQVUsR0FBRyxFQUFFO0lBQ25CLEtBQUssSUFBSVQsRUFBRSxJQUFJUixHQUFHLEVBQUU7TUFDbEIsSUFBSWpCLGVBQWUsQ0FBQ21DLGFBQWEsQ0FBQ1YsRUFBRSxDQUFDLEVBQUVTLFVBQVUsQ0FBQy9JLElBQUksQ0FBQ3NJLEVBQUUsQ0FBQyxDQUFDO01BQ3RELElBQUlBLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsS0FBSzlQLFNBQVMsRUFBRW1QLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUN2RyxNQUFNLENBQUNrSSxFQUFFLENBQUNXLFFBQVEsQ0FBQyxDQUFDLENBQUN0QyxNQUFNLENBQUMsQ0FBQyxDQUFDeEcsT0FBTyxDQUFDbUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVHO0lBQ0FSLEdBQUcsR0FBR2lCLFVBQVU7O0lBRWhCO0lBQ0EsS0FBSyxJQUFJVCxFQUFFLElBQUlSLEdBQUcsRUFBRTtNQUNsQixJQUFJUSxFQUFFLENBQUNZLGNBQWMsQ0FBQyxDQUFDLElBQUlaLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsS0FBSzlQLFNBQVMsSUFBSSxDQUFDbVAsRUFBRSxDQUFDWSxjQUFjLENBQUMsQ0FBQyxJQUFJWixFQUFFLENBQUNXLFFBQVEsQ0FBQyxDQUFDLEtBQUs5UCxTQUFTLEVBQUU7UUFDN0dnUSxPQUFPLENBQUNDLEtBQUssQ0FBQyw4RUFBOEUsQ0FBQztRQUM3RixPQUFPLElBQUksQ0FBQ3pDLE1BQU0sQ0FBQ0UsZUFBZSxDQUFDO01BQ3JDO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJQSxlQUFlLENBQUN3QyxTQUFTLENBQUMsQ0FBQyxJQUFJeEMsZUFBZSxDQUFDd0MsU0FBUyxDQUFDLENBQUMsQ0FBQ25GLE1BQU0sR0FBRyxDQUFDLEVBQUU7TUFDekUsSUFBSW9GLE9BQU8sR0FBRyxJQUFJQyxHQUFHLENBQUMsQ0FBQyxFQUFFO01BQ3pCLEtBQUssSUFBSWpCLEVBQUUsSUFBSVIsR0FBRyxFQUFFd0IsT0FBTyxDQUFDaFIsR0FBRyxDQUFDZ1EsRUFBRSxDQUFDa0IsT0FBTyxDQUFDLENBQUMsRUFBRWxCLEVBQUUsQ0FBQztNQUNqRCxJQUFJbUIsVUFBVSxHQUFHLEVBQUU7TUFDbkIsS0FBSyxJQUFJQyxJQUFJLElBQUk3QyxlQUFlLENBQUN3QyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUlDLE9BQU8sQ0FBQzNSLEdBQUcsQ0FBQytSLElBQUksQ0FBQyxFQUFFRCxVQUFVLENBQUN6SixJQUFJLENBQUNzSixPQUFPLENBQUMzUixHQUFHLENBQUMrUixJQUFJLENBQUMsQ0FBQztNQUN2RzVCLEdBQUcsR0FBRzJCLFVBQVU7SUFDbEI7SUFDQSxPQUFPM0IsR0FBRztFQUNaOztFQUVBLE1BQU02QixZQUFZQSxDQUFDL0MsS0FBb0MsRUFBNkI7O0lBRWxGO0lBQ0EsTUFBTUMsZUFBZSxHQUFHck8scUJBQVksQ0FBQ29SLHNCQUFzQixDQUFDaEQsS0FBSyxDQUFDOztJQUVsRTtJQUNBLElBQUksQ0FBQ3JPLGVBQWUsQ0FBQ3NSLFlBQVksQ0FBQ2hELGVBQWUsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDWSxlQUFlLENBQUNaLGVBQWUsQ0FBQzs7SUFFaEc7SUFDQSxJQUFJVyxTQUFTLEdBQUcsRUFBRTtJQUNsQixLQUFLLElBQUljLEVBQUUsSUFBSSxNQUFNLElBQUksQ0FBQzNCLE1BQU0sQ0FBQ0UsZUFBZSxDQUFDaUQsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFO01BQzlELEtBQUssSUFBSTdCLFFBQVEsSUFBSUssRUFBRSxDQUFDeUIsZUFBZSxDQUFDbEQsZUFBZSxDQUFDLEVBQUU7UUFDeERXLFNBQVMsQ0FBQ3hILElBQUksQ0FBQ2lJLFFBQVEsQ0FBQztNQUMxQjtJQUNGOztJQUVBLE9BQU9ULFNBQVM7RUFDbEI7O0VBRUEsTUFBTXdDLFVBQVVBLENBQUNwRCxLQUFrQyxFQUFpQzs7SUFFbEY7SUFDQSxNQUFNQyxlQUFlLEdBQUdyTyxxQkFBWSxDQUFDeVIsb0JBQW9CLENBQUNyRCxLQUFLLENBQUM7O0lBRWhFO0lBQ0EsSUFBSSxDQUFDck8sZUFBZSxDQUFDc1IsWUFBWSxDQUFDaEQsZUFBZSxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUMrQixhQUFhLENBQUMvQixlQUFlLENBQUM7O0lBRTlGO0lBQ0EsSUFBSThCLE9BQU8sR0FBRyxFQUFFO0lBQ2hCLEtBQUssSUFBSUwsRUFBRSxJQUFJLE1BQU0sSUFBSSxDQUFDM0IsTUFBTSxDQUFDRSxlQUFlLENBQUNpRCxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUU7TUFDOUQsS0FBSyxJQUFJaEIsTUFBTSxJQUFJUixFQUFFLENBQUM0QixhQUFhLENBQUNyRCxlQUFlLENBQUMsRUFBRTtRQUNwRDhCLE9BQU8sQ0FBQzNJLElBQUksQ0FBQzhJLE1BQU0sQ0FBQztNQUN0QjtJQUNGOztJQUVBLE9BQU9ILE9BQU87RUFDaEI7O0VBRUEsTUFBTXdCLGFBQWFBLENBQUNDLEdBQUcsR0FBRyxLQUFLLEVBQW1CO0lBQ2hELE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQ3pSLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFDZ1EsR0FBRyxFQUFFQSxHQUFHLEVBQUMsQ0FBQyxFQUFFekssTUFBTSxDQUFDMEssZ0JBQWdCO0VBQzlHOztFQUVBLE1BQU1DLGFBQWFBLENBQUNDLFVBQWtCLEVBQW1CO0lBQ3ZELElBQUk3SyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMvRyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsZ0JBQWdCLEVBQUUsRUFBQ2lRLGdCQUFnQixFQUFFRSxVQUFVLEVBQUMsQ0FBQztJQUMxRyxPQUFPN0ssSUFBSSxDQUFDQyxNQUFNLENBQUM2SyxZQUFZO0VBQ2pDOztFQUVBLE1BQU1DLGVBQWVBLENBQUNMLEdBQUcsR0FBRyxLQUFLLEVBQTZCO0lBQzVELE9BQU8sTUFBTSxJQUFJLENBQUNNLGtCQUFrQixDQUFDTixHQUFHLENBQUM7RUFDM0M7O0VBRUEsTUFBTU8sZUFBZUEsQ0FBQ0MsU0FBMkIsRUFBdUM7O0lBRXRGO0lBQ0EsSUFBSUMsWUFBWSxHQUFHRCxTQUFTLENBQUNFLEdBQUcsQ0FBQyxDQUFBQyxRQUFRLE1BQUssRUFBQ0MsU0FBUyxFQUFFRCxRQUFRLENBQUNFLE1BQU0sQ0FBQyxDQUFDLEVBQUVDLFNBQVMsRUFBRUgsUUFBUSxDQUFDSSxZQUFZLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQzs7SUFFbEg7SUFDQSxJQUFJekwsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLG1CQUFtQixFQUFFLEVBQUNnUixpQkFBaUIsRUFBRVAsWUFBWSxFQUFDLENBQUM7O0lBRWhIO0lBQ0EsSUFBSVEsWUFBWSxHQUFHLElBQUlDLG1DQUEwQixDQUFDLENBQUM7SUFDbkRELFlBQVksQ0FBQ0UsU0FBUyxDQUFDN0wsSUFBSSxDQUFDQyxNQUFNLENBQUM2QyxNQUFNLENBQUM7SUFDMUM2SSxZQUFZLENBQUNHLGNBQWMsQ0FBQ3RNLE1BQU0sQ0FBQ1EsSUFBSSxDQUFDQyxNQUFNLENBQUM4TCxLQUFLLENBQUMsQ0FBQztJQUN0REosWUFBWSxDQUFDSyxnQkFBZ0IsQ0FBQ3hNLE1BQU0sQ0FBQ1EsSUFBSSxDQUFDQyxNQUFNLENBQUNnTSxPQUFPLENBQUMsQ0FBQztJQUMxRCxPQUFPTixZQUFZO0VBQ3JCOztFQUVBLE1BQU1PLDZCQUE2QkEsQ0FBQSxFQUE4QjtJQUMvRCxPQUFPLE1BQU0sSUFBSSxDQUFDbEIsa0JBQWtCLENBQUMsS0FBSyxDQUFDO0VBQzdDOztFQUVBLE1BQU1tQixZQUFZQSxDQUFDZCxRQUFnQixFQUFpQjtJQUNsRCxPQUFPLElBQUksQ0FBQ3BTLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxRQUFRLEVBQUUsRUFBQzRRLFNBQVMsRUFBRUQsUUFBUSxFQUFDLENBQUM7RUFDakY7O0VBRUEsTUFBTWUsVUFBVUEsQ0FBQ2YsUUFBZ0IsRUFBaUI7SUFDaEQsT0FBTyxJQUFJLENBQUNwUyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsTUFBTSxFQUFFLEVBQUM0USxTQUFTLEVBQUVELFFBQVEsRUFBQyxDQUFDO0VBQy9FOztFQUVBLE1BQU1nQixjQUFjQSxDQUFDaEIsUUFBZ0IsRUFBb0I7SUFDdkQsSUFBSXJMLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxRQUFRLEVBQUUsRUFBQzRRLFNBQVMsRUFBRUQsUUFBUSxFQUFDLENBQUM7SUFDekYsT0FBT3JMLElBQUksQ0FBQ0MsTUFBTSxDQUFDcU0sTUFBTSxLQUFLLElBQUk7RUFDcEM7O0VBRUEsTUFBTUMsU0FBU0EsQ0FBQ3RULE1BQStCLEVBQTZCOztJQUUxRTtJQUNBLE1BQU0rQixnQkFBZ0IsR0FBR2xDLHFCQUFZLENBQUMwVCx3QkFBd0IsQ0FBQ3ZULE1BQU0sQ0FBQztJQUN0RSxJQUFJK0IsZ0JBQWdCLENBQUN5UixXQUFXLENBQUMsQ0FBQyxLQUFLaFQsU0FBUyxFQUFFdUIsZ0JBQWdCLENBQUMwUixXQUFXLENBQUMsSUFBSSxDQUFDO0lBQ3BGLElBQUkxUixnQkFBZ0IsQ0FBQzJSLFFBQVEsQ0FBQyxDQUFDLEtBQUssSUFBSSxLQUFJLE1BQU0sSUFBSSxDQUFDQyxVQUFVLENBQUMsQ0FBQyxHQUFFLE1BQU0sSUFBSWxULG9CQUFXLENBQUMsbURBQW1ELENBQUM7O0lBRS9JO0lBQ0EsSUFBSXlGLFVBQVUsR0FBR25FLGdCQUFnQixDQUFDNEssZUFBZSxDQUFDLENBQUM7SUFDbkQsSUFBSXpHLFVBQVUsS0FBSzFGLFNBQVMsRUFBRSxNQUFNLElBQUlDLG9CQUFXLENBQUMsNkNBQTZDLENBQUM7SUFDbEcsSUFBSTJNLGlCQUFpQixHQUFHckwsZ0JBQWdCLENBQUM2UixvQkFBb0IsQ0FBQyxDQUFDLEtBQUtwVCxTQUFTLEdBQUdBLFNBQVMsR0FBR3VCLGdCQUFnQixDQUFDNlIsb0JBQW9CLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7SUFFOUk7SUFDQSxJQUFJMVEsTUFBVyxHQUFHLENBQUMsQ0FBQztJQUNwQkEsTUFBTSxDQUFDMlEsWUFBWSxHQUFHLEVBQUU7SUFDeEIsS0FBSyxJQUFJQyxXQUFXLElBQUloUyxnQkFBZ0IsQ0FBQ2lTLGVBQWUsQ0FBQyxDQUFDLEVBQUU7TUFDMUQsSUFBQTVOLGVBQU0sRUFBQzJOLFdBQVcsQ0FBQzVMLFVBQVUsQ0FBQyxDQUFDLEVBQUUsb0NBQW9DLENBQUM7TUFDdEUsSUFBQS9CLGVBQU0sRUFBQzJOLFdBQVcsQ0FBQ0UsU0FBUyxDQUFDLENBQUMsRUFBRSxtQ0FBbUMsQ0FBQztNQUNwRTlRLE1BQU0sQ0FBQzJRLFlBQVksQ0FBQ3pNLElBQUksQ0FBQyxFQUFFdkQsT0FBTyxFQUFFaVEsV0FBVyxDQUFDNUwsVUFBVSxDQUFDLENBQUMsRUFBRStMLE1BQU0sRUFBRUgsV0FBVyxDQUFDRSxTQUFTLENBQUMsQ0FBQyxDQUFDRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3RztJQUNBLElBQUlwUyxnQkFBZ0IsQ0FBQ3FTLGtCQUFrQixDQUFDLENBQUMsRUFBRWpSLE1BQU0sQ0FBQ2tSLHlCQUF5QixHQUFHdFMsZ0JBQWdCLENBQUNxUyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ25IalIsTUFBTSxDQUFDMEQsYUFBYSxHQUFHWCxVQUFVO0lBQ2pDL0MsTUFBTSxDQUFDbVIsZUFBZSxHQUFHbEgsaUJBQWlCO0lBQzFDakssTUFBTSxDQUFDZ0csVUFBVSxHQUFHcEgsZ0JBQWdCLENBQUN3UyxZQUFZLENBQUMsQ0FBQztJQUNuRCxJQUFJeFMsZ0JBQWdCLENBQUN5UyxhQUFhLENBQUMsQ0FBQyxLQUFLaFUsU0FBUyxFQUFFMkMsTUFBTSxDQUFDc1IsV0FBVyxHQUFHMVMsZ0JBQWdCLENBQUN5UyxhQUFhLENBQUMsQ0FBQyxDQUFDTCxRQUFRLENBQUMsQ0FBQztJQUNwSGhSLE1BQU0sQ0FBQ3VSLFlBQVksR0FBRzNTLGdCQUFnQixDQUFDMlIsUUFBUSxDQUFDLENBQUMsS0FBSyxJQUFJO0lBQzFELElBQUF0TixlQUFNLEVBQUNyRSxnQkFBZ0IsQ0FBQzRTLFdBQVcsQ0FBQyxDQUFDLEtBQUtuVSxTQUFTLElBQUl1QixnQkFBZ0IsQ0FBQzRTLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJNVMsZ0JBQWdCLENBQUM0UyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsSXhSLE1BQU0sQ0FBQ3lSLFFBQVEsR0FBRzdTLGdCQUFnQixDQUFDNFMsV0FBVyxDQUFDLENBQUM7SUFDaER4UixNQUFNLENBQUMwUixVQUFVLEdBQUcsSUFBSTtJQUN4QjFSLE1BQU0sQ0FBQzJSLGVBQWUsR0FBRyxJQUFJO0lBQzdCLElBQUkvUyxnQkFBZ0IsQ0FBQ3lSLFdBQVcsQ0FBQyxDQUFDLEVBQUVyUSxNQUFNLENBQUM0UixXQUFXLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFBQSxLQUMxRDVSLE1BQU0sQ0FBQzZSLFVBQVUsR0FBRyxJQUFJOztJQUU3QjtJQUNBLElBQUlqVCxnQkFBZ0IsQ0FBQ3lSLFdBQVcsQ0FBQyxDQUFDLElBQUl6UixnQkFBZ0IsQ0FBQ3FTLGtCQUFrQixDQUFDLENBQUMsSUFBSXJTLGdCQUFnQixDQUFDcVMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDN0ksTUFBTSxHQUFHLENBQUMsRUFBRTtNQUMvSCxNQUFNLElBQUk5SyxvQkFBVyxDQUFDLDBFQUEwRSxDQUFDO0lBQ25HOztJQUVBO0lBQ0EsSUFBSXVHLE1BQU07SUFDVixJQUFJO01BQ0YsSUFBSUQsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDTSxnQkFBZ0IsQ0FBQ3lSLFdBQVcsQ0FBQyxDQUFDLEdBQUcsZ0JBQWdCLEdBQUcsVUFBVSxFQUFFclEsTUFBTSxDQUFDO01BQ2hJNkQsTUFBTSxHQUFHRCxJQUFJLENBQUNDLE1BQU07SUFDdEIsQ0FBQyxDQUFDLE9BQU8zRCxHQUFRLEVBQUU7TUFDakIsSUFBSUEsR0FBRyxDQUFDYSxPQUFPLENBQUNzRCxPQUFPLENBQUMscUNBQXFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUkvRyxvQkFBVyxDQUFDLDZCQUE2QixDQUFDO01BQ3pILE1BQU00QyxHQUFHO0lBQ1g7O0lBRUE7SUFDQSxJQUFJOEwsR0FBRztJQUNQLElBQUk4RixNQUFNLEdBQUdsVCxnQkFBZ0IsQ0FBQ3lSLFdBQVcsQ0FBQyxDQUFDLEdBQUl4TSxNQUFNLENBQUNrTyxRQUFRLEtBQUsxVSxTQUFTLEdBQUd3RyxNQUFNLENBQUNrTyxRQUFRLENBQUMzSixNQUFNLEdBQUcsQ0FBQyxHQUFLdkUsTUFBTSxDQUFDbU8sR0FBRyxLQUFLM1UsU0FBUyxHQUFHLENBQUMsR0FBRyxDQUFFO0lBQy9JLElBQUl5VSxNQUFNLEdBQUcsQ0FBQyxFQUFFOUYsR0FBRyxHQUFHLEVBQUU7SUFDeEIsSUFBSWlHLGdCQUFnQixHQUFHSCxNQUFNLEtBQUssQ0FBQztJQUNuQyxLQUFLLElBQUlJLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR0osTUFBTSxFQUFFSSxDQUFDLEVBQUUsRUFBRTtNQUMvQixJQUFJMUYsRUFBRSxHQUFHLElBQUkyRix1QkFBYyxDQUFDLENBQUM7TUFDN0IxVixlQUFlLENBQUMyVixnQkFBZ0IsQ0FBQ3hULGdCQUFnQixFQUFFNE4sRUFBRSxFQUFFeUYsZ0JBQWdCLENBQUM7TUFDeEV6RixFQUFFLENBQUM2RixtQkFBbUIsQ0FBQyxDQUFDLENBQUMvTSxlQUFlLENBQUN2QyxVQUFVLENBQUM7TUFDcEQsSUFBSWtILGlCQUFpQixLQUFLNU0sU0FBUyxJQUFJNE0saUJBQWlCLENBQUM3QixNQUFNLEtBQUssQ0FBQyxFQUFFb0UsRUFBRSxDQUFDNkYsbUJBQW1CLENBQUMsQ0FBQyxDQUFDQyxvQkFBb0IsQ0FBQ3JJLGlCQUFpQixDQUFDO01BQ3ZJK0IsR0FBRyxDQUFDOUgsSUFBSSxDQUFDc0ksRUFBRSxDQUFDO0lBQ2Q7O0lBRUE7SUFDQSxJQUFJNU4sZ0JBQWdCLENBQUMyUixRQUFRLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSSxDQUFDbkosSUFBSSxDQUFDLENBQUM7O0lBRWxEO0lBQ0EsSUFBSXhJLGdCQUFnQixDQUFDeVIsV0FBVyxDQUFDLENBQUMsRUFBRSxPQUFPNVQsZUFBZSxDQUFDOFYsd0JBQXdCLENBQUMxTyxNQUFNLEVBQUVtSSxHQUFHLEVBQUVwTixnQkFBZ0IsQ0FBQyxDQUFDaU0sTUFBTSxDQUFDLENBQUMsQ0FBQztJQUN2SCxPQUFPcE8sZUFBZSxDQUFDK1YsbUJBQW1CLENBQUMzTyxNQUFNLEVBQUVtSSxHQUFHLEtBQUszTyxTQUFTLEdBQUdBLFNBQVMsR0FBRzJPLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUVwTixnQkFBZ0IsQ0FBQyxDQUFDaU0sTUFBTSxDQUFDLENBQUM7RUFDbEk7O0VBRUEsTUFBTTRILFdBQVdBLENBQUM1VixNQUErQixFQUEyQjs7SUFFMUU7SUFDQUEsTUFBTSxHQUFHSCxxQkFBWSxDQUFDZ1csMEJBQTBCLENBQUM3VixNQUFNLENBQUM7O0lBRXhEO0lBQ0EsSUFBSW1ELE1BQVcsR0FBRyxDQUFDLENBQUM7SUFDcEJBLE1BQU0sQ0FBQ1csT0FBTyxHQUFHOUQsTUFBTSxDQUFDZ1UsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzdMLFVBQVUsQ0FBQyxDQUFDO0lBQ3pEaEYsTUFBTSxDQUFDMEQsYUFBYSxHQUFHN0csTUFBTSxDQUFDMk0sZUFBZSxDQUFDLENBQUM7SUFDL0N4SixNQUFNLENBQUNtUixlQUFlLEdBQUd0VSxNQUFNLENBQUM0VCxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3REelEsTUFBTSxDQUFDa1AsU0FBUyxHQUFHclMsTUFBTSxDQUFDOFYsV0FBVyxDQUFDLENBQUM7SUFDdkMsSUFBSTlWLE1BQU0sQ0FBQ3dVLGFBQWEsQ0FBQyxDQUFDLEtBQUtoVSxTQUFTLEVBQUUyQyxNQUFNLENBQUNzUixXQUFXLEdBQUd6VSxNQUFNLENBQUN3VSxhQUFhLENBQUMsQ0FBQztJQUNyRnJSLE1BQU0sQ0FBQ3VSLFlBQVksR0FBRzFVLE1BQU0sQ0FBQzBULFFBQVEsQ0FBQyxDQUFDLEtBQUssSUFBSTtJQUNoRCxJQUFBdE4sZUFBTSxFQUFDcEcsTUFBTSxDQUFDMlUsV0FBVyxDQUFDLENBQUMsS0FBS25VLFNBQVMsSUFBSVIsTUFBTSxDQUFDMlUsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUkzVSxNQUFNLENBQUMyVSxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwR3hSLE1BQU0sQ0FBQ3lSLFFBQVEsR0FBRzVVLE1BQU0sQ0FBQzJVLFdBQVcsQ0FBQyxDQUFDO0lBQ3RDeFIsTUFBTSxDQUFDZ0csVUFBVSxHQUFHbkosTUFBTSxDQUFDdVUsWUFBWSxDQUFDLENBQUM7SUFDekNwUixNQUFNLENBQUM2UixVQUFVLEdBQUcsSUFBSTtJQUN4QjdSLE1BQU0sQ0FBQzBSLFVBQVUsR0FBRyxJQUFJO0lBQ3hCMVIsTUFBTSxDQUFDMlIsZUFBZSxHQUFHLElBQUk7O0lBRTdCO0lBQ0EsSUFBSS9OLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxjQUFjLEVBQUUwQixNQUFNLENBQUM7SUFDaEYsSUFBSTZELE1BQU0sR0FBR0QsSUFBSSxDQUFDQyxNQUFNOztJQUV4QjtJQUNBLElBQUloSCxNQUFNLENBQUMwVCxRQUFRLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSSxDQUFDbkosSUFBSSxDQUFDLENBQUM7O0lBRXhDO0lBQ0EsSUFBSW9GLEVBQUUsR0FBRy9QLGVBQWUsQ0FBQzJWLGdCQUFnQixDQUFDdlYsTUFBTSxFQUFFUSxTQUFTLEVBQUUsSUFBSSxDQUFDO0lBQ2xFWixlQUFlLENBQUMrVixtQkFBbUIsQ0FBQzNPLE1BQU0sRUFBRTJJLEVBQUUsRUFBRSxJQUFJLEVBQUUzUCxNQUFNLENBQUM7SUFDN0QyUCxFQUFFLENBQUM2RixtQkFBbUIsQ0FBQyxDQUFDLENBQUN4QixlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDK0IsU0FBUyxDQUFDcEcsRUFBRSxDQUFDNkYsbUJBQW1CLENBQUMsQ0FBQyxDQUFDdkIsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0YsT0FBT3RFLEVBQUU7RUFDWDs7RUFFQSxNQUFNcUcsYUFBYUEsQ0FBQ2hXLE1BQStCLEVBQTZCOztJQUU5RTtJQUNBLE1BQU0rQixnQkFBZ0IsR0FBR2xDLHFCQUFZLENBQUNvVyw0QkFBNEIsQ0FBQ2pXLE1BQU0sQ0FBQzs7SUFFMUU7SUFDQSxJQUFJa1csT0FBTyxHQUFHLElBQUl0RixHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUU7SUFDMUIsSUFBSTdPLGdCQUFnQixDQUFDNEssZUFBZSxDQUFDLENBQUMsS0FBS25NLFNBQVMsRUFBRTtNQUNwRCxJQUFJdUIsZ0JBQWdCLENBQUM2UixvQkFBb0IsQ0FBQyxDQUFDLEtBQUtwVCxTQUFTLEVBQUU7UUFDekQwVixPQUFPLENBQUN2VyxHQUFHLENBQUNvQyxnQkFBZ0IsQ0FBQzRLLGVBQWUsQ0FBQyxDQUFDLEVBQUU1SyxnQkFBZ0IsQ0FBQzZSLG9CQUFvQixDQUFDLENBQUMsQ0FBQztNQUMxRixDQUFDLE1BQU07UUFDTCxJQUFJeEcsaUJBQWlCLEdBQUcsRUFBRTtRQUMxQjhJLE9BQU8sQ0FBQ3ZXLEdBQUcsQ0FBQ29DLGdCQUFnQixDQUFDNEssZUFBZSxDQUFDLENBQUMsRUFBRVMsaUJBQWlCLENBQUM7UUFDbEUsS0FBSyxJQUFJN0UsVUFBVSxJQUFJLE1BQU0sSUFBSSxDQUFDRixlQUFlLENBQUN0RyxnQkFBZ0IsQ0FBQzRLLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRTtVQUNyRixJQUFJcEUsVUFBVSxDQUFDM0Isa0JBQWtCLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRXdHLGlCQUFpQixDQUFDL0YsSUFBSSxDQUFDa0IsVUFBVSxDQUFDNEQsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUN6RjtNQUNGO0lBQ0YsQ0FBQyxNQUFNO01BQ0wsSUFBSUwsUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDcEYsV0FBVyxDQUFDLElBQUksQ0FBQztNQUMzQyxLQUFLLElBQUlELE9BQU8sSUFBSXFGLFFBQVEsRUFBRTtRQUM1QixJQUFJckYsT0FBTyxDQUFDRyxrQkFBa0IsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1VBQ3JDLElBQUl3RyxpQkFBaUIsR0FBRyxFQUFFO1VBQzFCOEksT0FBTyxDQUFDdlcsR0FBRyxDQUFDOEcsT0FBTyxDQUFDMEYsUUFBUSxDQUFDLENBQUMsRUFBRWlCLGlCQUFpQixDQUFDO1VBQ2xELEtBQUssSUFBSTdFLFVBQVUsSUFBSTlCLE9BQU8sQ0FBQzRCLGVBQWUsQ0FBQyxDQUFDLEVBQUU7WUFDaEQsSUFBSUUsVUFBVSxDQUFDM0Isa0JBQWtCLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRXdHLGlCQUFpQixDQUFDL0YsSUFBSSxDQUFDa0IsVUFBVSxDQUFDNEQsUUFBUSxDQUFDLENBQUMsQ0FBQztVQUN6RjtRQUNGO01BQ0Y7SUFDRjs7SUFFQTtJQUNBLElBQUlnRCxHQUFHLEdBQUcsRUFBRTtJQUNaLEtBQUssSUFBSWpKLFVBQVUsSUFBSWdRLE9BQU8sQ0FBQ0MsSUFBSSxDQUFDLENBQUMsRUFBRTs7TUFFckM7TUFDQSxJQUFJakgsSUFBSSxHQUFHbk4sZ0JBQWdCLENBQUNtTixJQUFJLENBQUMsQ0FBQztNQUNsQ0EsSUFBSSxDQUFDekcsZUFBZSxDQUFDdkMsVUFBVSxDQUFDO01BQ2hDZ0osSUFBSSxDQUFDa0gsc0JBQXNCLENBQUMsS0FBSyxDQUFDOztNQUVsQztNQUNBLElBQUlsSCxJQUFJLENBQUNtSCxzQkFBc0IsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQzFDbkgsSUFBSSxDQUFDdUcsb0JBQW9CLENBQUNTLE9BQU8sQ0FBQ2xYLEdBQUcsQ0FBQ2tILFVBQVUsQ0FBQyxDQUFDO1FBQ2xELEtBQUssSUFBSXlKLEVBQUUsSUFBSSxNQUFNLElBQUksQ0FBQzJHLGVBQWUsQ0FBQ3BILElBQUksQ0FBQyxFQUFFQyxHQUFHLENBQUM5SCxJQUFJLENBQUNzSSxFQUFFLENBQUM7TUFDL0Q7O01BRUE7TUFBQSxLQUNLO1FBQ0gsS0FBSyxJQUFJeEosYUFBYSxJQUFJK1AsT0FBTyxDQUFDbFgsR0FBRyxDQUFDa0gsVUFBVSxDQUFDLEVBQUU7VUFDakRnSixJQUFJLENBQUN1RyxvQkFBb0IsQ0FBQyxDQUFDdFAsYUFBYSxDQUFDLENBQUM7VUFDMUMsS0FBSyxJQUFJd0osRUFBRSxJQUFJLE1BQU0sSUFBSSxDQUFDMkcsZUFBZSxDQUFDcEgsSUFBSSxDQUFDLEVBQUVDLEdBQUcsQ0FBQzlILElBQUksQ0FBQ3NJLEVBQUUsQ0FBQztRQUMvRDtNQUNGO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJNU4sZ0JBQWdCLENBQUMyUixRQUFRLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSSxDQUFDbkosSUFBSSxDQUFDLENBQUM7SUFDbEQsT0FBTzRFLEdBQUc7RUFDWjs7RUFFQSxNQUFNb0gsU0FBU0EsQ0FBQ0MsS0FBZSxFQUE2QjtJQUMxRCxJQUFJQSxLQUFLLEtBQUtoVyxTQUFTLEVBQUVnVyxLQUFLLEdBQUcsS0FBSztJQUN0QyxJQUFJelAsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLFlBQVksRUFBRSxFQUFDaVQsWUFBWSxFQUFFLENBQUM4QixLQUFLLEVBQUMsQ0FBQztJQUM5RixJQUFJQSxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUNqTSxJQUFJLENBQUMsQ0FBQztJQUM1QixJQUFJdkQsTUFBTSxHQUFHRCxJQUFJLENBQUNDLE1BQU07SUFDeEIsSUFBSXlQLEtBQUssR0FBRzdXLGVBQWUsQ0FBQzhWLHdCQUF3QixDQUFDMU8sTUFBTSxDQUFDO0lBQzVELElBQUl5UCxLQUFLLENBQUN6SSxNQUFNLENBQUMsQ0FBQyxLQUFLeE4sU0FBUyxFQUFFLE9BQU8sRUFBRTtJQUMzQyxLQUFLLElBQUltUCxFQUFFLElBQUk4RyxLQUFLLENBQUN6SSxNQUFNLENBQUMsQ0FBQyxFQUFFO01BQzdCMkIsRUFBRSxDQUFDK0csWUFBWSxDQUFDLENBQUNGLEtBQUssQ0FBQztNQUN2QjdHLEVBQUUsQ0FBQ2dILFdBQVcsQ0FBQ2hILEVBQUUsQ0FBQ2lILFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDbkM7SUFDQSxPQUFPSCxLQUFLLENBQUN6SSxNQUFNLENBQUMsQ0FBQztFQUN2Qjs7RUFFQSxNQUFNNkksUUFBUUEsQ0FBQ0MsY0FBMkMsRUFBcUI7SUFDN0UsSUFBQTFRLGVBQU0sRUFBQzJRLEtBQUssQ0FBQ0MsT0FBTyxDQUFDRixjQUFjLENBQUMsRUFBRSx5REFBeUQsQ0FBQztJQUNoRyxJQUFJeEwsUUFBUSxHQUFHLEVBQUU7SUFDakIsS0FBSyxJQUFJMkwsWUFBWSxJQUFJSCxjQUFjLEVBQUU7TUFDdkMsSUFBSUksUUFBUSxHQUFHRCxZQUFZLFlBQVkzQix1QkFBYyxHQUFHMkIsWUFBWSxDQUFDRSxXQUFXLENBQUMsQ0FBQyxHQUFHRixZQUFZO01BQ2pHLElBQUlsUSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMvRyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsVUFBVSxFQUFFLEVBQUUyVixHQUFHLEVBQUVGLFFBQVEsQ0FBQyxDQUFDLENBQUM7TUFDdkY1TCxRQUFRLENBQUNqRSxJQUFJLENBQUNOLElBQUksQ0FBQ0MsTUFBTSxDQUFDcVEsT0FBTyxDQUFDO0lBQ3BDO0lBQ0EsTUFBTSxJQUFJLENBQUM5TSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkIsT0FBT2UsUUFBUTtFQUNqQjs7RUFFQSxNQUFNZ00sYUFBYUEsQ0FBQ2IsS0FBa0IsRUFBd0I7SUFDNUQsSUFBSTFQLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRTtNQUM1RThWLGNBQWMsRUFBRWQsS0FBSyxDQUFDZSxnQkFBZ0IsQ0FBQyxDQUFDO01BQ3hDQyxjQUFjLEVBQUVoQixLQUFLLENBQUNpQixnQkFBZ0IsQ0FBQztJQUN6QyxDQUFDLENBQUM7SUFDRixPQUFPOVgsZUFBZSxDQUFDK1gsMEJBQTBCLENBQUM1USxJQUFJLENBQUNDLE1BQU0sQ0FBQztFQUNoRTs7RUFFQSxNQUFNNFEsT0FBT0EsQ0FBQ0MsYUFBcUIsRUFBd0I7SUFDekQsSUFBSTlRLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxlQUFlLEVBQUU7TUFDeEU4VixjQUFjLEVBQUVNLGFBQWE7TUFDN0JDLFVBQVUsRUFBRTtJQUNkLENBQUMsQ0FBQztJQUNGLE1BQU0sSUFBSSxDQUFDdk4sSUFBSSxDQUFDLENBQUM7SUFDakIsT0FBTzNLLGVBQWUsQ0FBQzhWLHdCQUF3QixDQUFDM08sSUFBSSxDQUFDQyxNQUFNLENBQUM7RUFDOUQ7O0VBRUEsTUFBTStRLFNBQVNBLENBQUNDLFdBQW1CLEVBQXFCO0lBQ3RELElBQUlqUixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMvRyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsaUJBQWlCLEVBQUU7TUFDMUV3VyxXQUFXLEVBQUVEO0lBQ2YsQ0FBQyxDQUFDO0lBQ0YsTUFBTSxJQUFJLENBQUN6TixJQUFJLENBQUMsQ0FBQztJQUNqQixPQUFPeEQsSUFBSSxDQUFDQyxNQUFNLENBQUNrUixZQUFZO0VBQ2pDOztFQUVBLE1BQU1DLFdBQVdBLENBQUNqVSxPQUFlLEVBQUVrVSxhQUFhLEdBQUdDLG1DQUEwQixDQUFDQyxtQkFBbUIsRUFBRXBTLFVBQVUsR0FBRyxDQUFDLEVBQUVDLGFBQWEsR0FBRyxDQUFDLEVBQW1CO0lBQ3JKLElBQUlZLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxNQUFNLEVBQUU7TUFDN0Q4VyxJQUFJLEVBQUVyVSxPQUFPO01BQ2JzVSxjQUFjLEVBQUVKLGFBQWEsS0FBS0MsbUNBQTBCLENBQUNDLG1CQUFtQixHQUFHLE9BQU8sR0FBRyxNQUFNO01BQ25HelIsYUFBYSxFQUFFWCxVQUFVO01BQ3pCbUgsYUFBYSxFQUFFbEg7SUFDbkIsQ0FBQyxDQUFDO0lBQ0YsT0FBT1ksSUFBSSxDQUFDQyxNQUFNLENBQUN1TCxTQUFTO0VBQzlCOztFQUVBLE1BQU1rRyxhQUFhQSxDQUFDdlUsT0FBZSxFQUFFSixPQUFlLEVBQUV5TyxTQUFpQixFQUF5QztJQUM5RyxJQUFJO01BQ0YsSUFBSXhMLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxRQUFRLEVBQUUsRUFBQzhXLElBQUksRUFBRXJVLE9BQU8sRUFBRUosT0FBTyxFQUFFQSxPQUFPLEVBQUV5TyxTQUFTLEVBQUVBLFNBQVMsRUFBQyxDQUFDO01BQzNILElBQUl2TCxNQUFNLEdBQUdELElBQUksQ0FBQ0MsTUFBTTtNQUN4QixPQUFPLElBQUkwUixxQ0FBNEI7UUFDckMxUixNQUFNLENBQUMyUixJQUFJLEdBQUcsRUFBQ0MsTUFBTSxFQUFFNVIsTUFBTSxDQUFDMlIsSUFBSSxFQUFFRSxLQUFLLEVBQUU3UixNQUFNLENBQUM4UixHQUFHLEVBQUVWLGFBQWEsRUFBRXBSLE1BQU0sQ0FBQ3dSLGNBQWMsS0FBSyxNQUFNLEdBQUdILG1DQUEwQixDQUFDVSxrQkFBa0IsR0FBR1YsbUNBQTBCLENBQUNDLG1CQUFtQixFQUFFeFEsT0FBTyxFQUFFZCxNQUFNLENBQUNjLE9BQU8sRUFBQyxHQUFHLEVBQUM4USxNQUFNLEVBQUUsS0FBSztNQUNwUCxDQUFDO0lBQ0gsQ0FBQyxDQUFDLE9BQU9uVSxDQUFNLEVBQUU7TUFDZixJQUFJQSxDQUFDLENBQUNMLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJc1UscUNBQTRCLENBQUMsRUFBQ0UsTUFBTSxFQUFFLEtBQUssRUFBQyxDQUFDO01BQ2hGLE1BQU1uVSxDQUFDO0lBQ1Q7RUFDRjs7RUFFQSxNQUFNdVUsUUFBUUEsQ0FBQ0MsTUFBYyxFQUFtQjtJQUM5QyxJQUFJO01BQ0YsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDalosTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLFlBQVksRUFBRSxFQUFDeVgsSUFBSSxFQUFFRCxNQUFNLEVBQUMsQ0FBQyxFQUFFalMsTUFBTSxDQUFDbVMsTUFBTTtJQUNwRyxDQUFDLENBQUMsT0FBTzFVLENBQU0sRUFBRTtNQUNmLElBQUlBLENBQUMsWUFBWU4sdUJBQWMsSUFBSU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJSyxDQUFDLENBQUNQLE9BQU8sQ0FBQ29GLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFN0UsQ0FBQyxHQUFHLElBQUlOLHVCQUFjLENBQUMsNEJBQTRCLEVBQUVNLENBQUMsQ0FBQ0wsT0FBTyxDQUFDLENBQUMsRUFBRUssQ0FBQyxDQUFDSixZQUFZLENBQUMsQ0FBQyxFQUFFSSxDQUFDLENBQUNILFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFO01BQ2pOLE1BQU1HLENBQUM7SUFDVDtFQUNGOztFQUVBLE1BQU0yVSxVQUFVQSxDQUFDSCxNQUFjLEVBQUVJLEtBQWEsRUFBRXZWLE9BQWUsRUFBMEI7SUFDdkYsSUFBSTs7TUFFRjtNQUNBLElBQUlpRCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMvRyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsY0FBYyxFQUFFLEVBQUN5WCxJQUFJLEVBQUVELE1BQU0sRUFBRUUsTUFBTSxFQUFFRSxLQUFLLEVBQUV2VixPQUFPLEVBQUVBLE9BQU8sRUFBQyxDQUFDOztNQUV6SDtNQUNBLElBQUl3VixLQUFLLEdBQUcsSUFBSUMsc0JBQWEsQ0FBQyxDQUFDO01BQy9CRCxLQUFLLENBQUNFLFNBQVMsQ0FBQyxJQUFJLENBQUM7TUFDckJGLEtBQUssQ0FBQ0csbUJBQW1CLENBQUMxUyxJQUFJLENBQUNDLE1BQU0sQ0FBQzBTLGFBQWEsQ0FBQztNQUNwREosS0FBSyxDQUFDM0MsV0FBVyxDQUFDNVAsSUFBSSxDQUFDQyxNQUFNLENBQUMyUyxPQUFPLENBQUM7TUFDdENMLEtBQUssQ0FBQ00saUJBQWlCLENBQUNyVCxNQUFNLENBQUNRLElBQUksQ0FBQ0MsTUFBTSxDQUFDNlMsUUFBUSxDQUFDLENBQUM7TUFDckQsT0FBT1AsS0FBSztJQUNkLENBQUMsQ0FBQyxPQUFPN1UsQ0FBTSxFQUFFO01BQ2YsSUFBSUEsQ0FBQyxZQUFZTix1QkFBYyxJQUFJTSxDQUFDLENBQUNMLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUlLLENBQUMsQ0FBQ1AsT0FBTyxDQUFDb0YsUUFBUSxDQUFDLDBCQUEwQixDQUFDLEVBQUU3RSxDQUFDLEdBQUcsSUFBSU4sdUJBQWMsQ0FBQyw0QkFBNEIsRUFBRU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxFQUFFSyxDQUFDLENBQUNKLFlBQVksQ0FBQyxDQUFDLEVBQUVJLENBQUMsQ0FBQ0gsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUU7TUFDak4sTUFBTUcsQ0FBQztJQUNUO0VBQ0Y7O0VBRUEsTUFBTXFWLFVBQVVBLENBQUNiLE1BQWMsRUFBRW5WLE9BQWUsRUFBRUksT0FBZ0IsRUFBbUI7SUFDbkYsSUFBSTtNQUNGLElBQUk2QyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMvRyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsY0FBYyxFQUFFLEVBQUN5WCxJQUFJLEVBQUVELE1BQU0sRUFBRW5WLE9BQU8sRUFBRUEsT0FBTyxFQUFFSSxPQUFPLEVBQUVBLE9BQU8sRUFBQyxDQUFDO01BQzVILE9BQU82QyxJQUFJLENBQUNDLE1BQU0sQ0FBQ3VMLFNBQVM7SUFDOUIsQ0FBQyxDQUFDLE9BQU85TixDQUFNLEVBQUU7TUFDZixJQUFJQSxDQUFDLFlBQVlOLHVCQUFjLElBQUlNLENBQUMsQ0FBQ0wsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSUssQ0FBQyxDQUFDUCxPQUFPLENBQUNvRixRQUFRLENBQUMsMEJBQTBCLENBQUMsRUFBRTdFLENBQUMsR0FBRyxJQUFJTix1QkFBYyxDQUFDLDRCQUE0QixFQUFFTSxDQUFDLENBQUNMLE9BQU8sQ0FBQyxDQUFDLEVBQUVLLENBQUMsQ0FBQ0osWUFBWSxDQUFDLENBQUMsRUFBRUksQ0FBQyxDQUFDSCxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtNQUNqTixNQUFNRyxDQUFDO0lBQ1Q7RUFDRjs7RUFFQSxNQUFNc1YsWUFBWUEsQ0FBQ2QsTUFBYyxFQUFFblYsT0FBZSxFQUFFSSxPQUEyQixFQUFFcU8sU0FBaUIsRUFBMEI7SUFDMUgsSUFBSTs7TUFFRjtNQUNBLElBQUl4TCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMvRyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsZ0JBQWdCLEVBQUU7UUFDekV5WCxJQUFJLEVBQUVELE1BQU07UUFDWm5WLE9BQU8sRUFBRUEsT0FBTztRQUNoQkksT0FBTyxFQUFFQSxPQUFPO1FBQ2hCcU8sU0FBUyxFQUFFQTtNQUNiLENBQUMsQ0FBQzs7TUFFRjtNQUNBLElBQUlxRyxNQUFNLEdBQUc3UixJQUFJLENBQUNDLE1BQU0sQ0FBQzJSLElBQUk7TUFDN0IsSUFBSVcsS0FBSyxHQUFHLElBQUlDLHNCQUFhLENBQUMsQ0FBQztNQUMvQkQsS0FBSyxDQUFDRSxTQUFTLENBQUNaLE1BQU0sQ0FBQztNQUN2QixJQUFJQSxNQUFNLEVBQUU7UUFDVlUsS0FBSyxDQUFDRyxtQkFBbUIsQ0FBQzFTLElBQUksQ0FBQ0MsTUFBTSxDQUFDMFMsYUFBYSxDQUFDO1FBQ3BESixLQUFLLENBQUMzQyxXQUFXLENBQUM1UCxJQUFJLENBQUNDLE1BQU0sQ0FBQzJTLE9BQU8sQ0FBQztRQUN0Q0wsS0FBSyxDQUFDTSxpQkFBaUIsQ0FBQ3JULE1BQU0sQ0FBQ1EsSUFBSSxDQUFDQyxNQUFNLENBQUM2UyxRQUFRLENBQUMsQ0FBQztNQUN2RDtNQUNBLE9BQU9QLEtBQUs7SUFDZCxDQUFDLENBQUMsT0FBTzdVLENBQU0sRUFBRTtNQUNmLElBQUlBLENBQUMsWUFBWU4sdUJBQWMsSUFBSU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJSyxDQUFDLENBQUNQLE9BQU8sS0FBSyxjQUFjLEVBQUVPLENBQUMsR0FBRyxJQUFJTix1QkFBYyxDQUFDLDBDQUEwQyxFQUFFLENBQUMsQ0FBQyxDQUFDO01BQzdKLElBQUlNLENBQUMsWUFBWU4sdUJBQWMsSUFBSU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJSyxDQUFDLENBQUNQLE9BQU8sQ0FBQ29GLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFN0UsQ0FBQyxHQUFHLElBQUlOLHVCQUFjLENBQUMsNEJBQTRCLEVBQUVNLENBQUMsQ0FBQ0wsT0FBTyxDQUFDLENBQUMsRUFBRUssQ0FBQyxDQUFDSixZQUFZLENBQUMsQ0FBQyxFQUFFSSxDQUFDLENBQUNILFlBQVksQ0FBQyxDQUFDLENBQUM7TUFDOU0sTUFBTUcsQ0FBQztJQUNUO0VBQ0Y7O0VBRUEsTUFBTXVWLGFBQWFBLENBQUNmLE1BQWMsRUFBRS9VLE9BQWdCLEVBQW1CO0lBQ3JFLElBQUk7TUFDRixJQUFJNkMsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGlCQUFpQixFQUFFLEVBQUN5WCxJQUFJLEVBQUVELE1BQU0sRUFBRS9VLE9BQU8sRUFBRUEsT0FBTyxFQUFDLENBQUM7TUFDN0csT0FBTzZDLElBQUksQ0FBQ0MsTUFBTSxDQUFDdUwsU0FBUztJQUM5QixDQUFDLENBQUMsT0FBTzlOLENBQU0sRUFBRTtNQUNmLElBQUlBLENBQUMsWUFBWU4sdUJBQWMsSUFBSU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJSyxDQUFDLENBQUNQLE9BQU8sQ0FBQ29GLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFN0UsQ0FBQyxHQUFHLElBQUlOLHVCQUFjLENBQUMsNEJBQTRCLEVBQUVNLENBQUMsQ0FBQ0wsT0FBTyxDQUFDLENBQUMsRUFBRUssQ0FBQyxDQUFDSixZQUFZLENBQUMsQ0FBQyxFQUFFSSxDQUFDLENBQUNILFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFO01BQ2pOLE1BQU1HLENBQUM7SUFDVDtFQUNGOztFQUVBLE1BQU13VixlQUFlQSxDQUFDaEIsTUFBYyxFQUFFL1UsT0FBMkIsRUFBRXFPLFNBQWlCLEVBQW9CO0lBQ3RHLElBQUk7TUFDRixJQUFJeEwsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLG1CQUFtQixFQUFFO1FBQzVFeVgsSUFBSSxFQUFFRCxNQUFNO1FBQ1ovVSxPQUFPLEVBQUVBLE9BQU87UUFDaEJxTyxTQUFTLEVBQUVBO01BQ2IsQ0FBQyxDQUFDO01BQ0YsT0FBT3hMLElBQUksQ0FBQ0MsTUFBTSxDQUFDMlIsSUFBSTtJQUN6QixDQUFDLENBQUMsT0FBT2xVLENBQU0sRUFBRTtNQUNmLElBQUlBLENBQUMsWUFBWU4sdUJBQWMsSUFBSU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJSyxDQUFDLENBQUNQLE9BQU8sQ0FBQ29GLFFBQVEsQ0FBQywwQkFBMEIsQ0FBQyxFQUFFN0UsQ0FBQyxHQUFHLElBQUlOLHVCQUFjLENBQUMsNEJBQTRCLEVBQUVNLENBQUMsQ0FBQ0wsT0FBTyxDQUFDLENBQUMsRUFBRUssQ0FBQyxDQUFDSixZQUFZLENBQUMsQ0FBQyxFQUFFSSxDQUFDLENBQUNILFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFO01BQ2pOLE1BQU1HLENBQUM7SUFDVDtFQUNGOztFQUVBLE1BQU15VixxQkFBcUJBLENBQUNoVyxPQUFnQixFQUFtQjtJQUM3RCxJQUFJNkMsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLG1CQUFtQixFQUFFO01BQzVFZ1EsR0FBRyxFQUFFLElBQUk7TUFDVHZOLE9BQU8sRUFBRUE7SUFDWCxDQUFDLENBQUM7SUFDRixPQUFPNkMsSUFBSSxDQUFDQyxNQUFNLENBQUN1TCxTQUFTO0VBQzlCOztFQUVBLE1BQU00SCxzQkFBc0JBLENBQUNqVSxVQUFrQixFQUFFZ08sTUFBYyxFQUFFaFEsT0FBZ0IsRUFBbUI7SUFDbEcsSUFBSTZDLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRTtNQUM1RW9GLGFBQWEsRUFBRVgsVUFBVTtNQUN6QmdPLE1BQU0sRUFBRUEsTUFBTSxDQUFDQyxRQUFRLENBQUMsQ0FBQztNQUN6QmpRLE9BQU8sRUFBRUE7SUFDWCxDQUFDLENBQUM7SUFDRixPQUFPNkMsSUFBSSxDQUFDQyxNQUFNLENBQUN1TCxTQUFTO0VBQzlCOztFQUVBLE1BQU01SyxpQkFBaUJBLENBQUM3RCxPQUFlLEVBQUVJLE9BQTJCLEVBQUVxTyxTQUFpQixFQUErQjs7SUFFcEg7SUFDQSxJQUFJeEwsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLHFCQUFxQixFQUFFO01BQzlFcUMsT0FBTyxFQUFFQSxPQUFPO01BQ2hCSSxPQUFPLEVBQUVBLE9BQU87TUFDaEJxTyxTQUFTLEVBQUVBO0lBQ2IsQ0FBQyxDQUFDOztJQUVGO0lBQ0EsSUFBSXFHLE1BQU0sR0FBRzdSLElBQUksQ0FBQ0MsTUFBTSxDQUFDMlIsSUFBSTtJQUM3QixJQUFJVyxLQUFLLEdBQUcsSUFBSWMsMkJBQWtCLENBQUMsQ0FBQztJQUNwQ2QsS0FBSyxDQUFDRSxTQUFTLENBQUNaLE1BQU0sQ0FBQztJQUN2QixJQUFJQSxNQUFNLEVBQUU7TUFDVlUsS0FBSyxDQUFDZSx5QkFBeUIsQ0FBQzlULE1BQU0sQ0FBQ1EsSUFBSSxDQUFDQyxNQUFNLENBQUM4TCxLQUFLLENBQUMsQ0FBQztNQUMxRHdHLEtBQUssQ0FBQ2dCLGNBQWMsQ0FBQy9ULE1BQU0sQ0FBQ1EsSUFBSSxDQUFDQyxNQUFNLENBQUN1VCxLQUFLLENBQUMsQ0FBQztJQUNqRDtJQUNBLE9BQU9qQixLQUFLO0VBQ2Q7O0VBRUEsTUFBTWtCLFVBQVVBLENBQUNsUCxRQUFrQixFQUFxQjtJQUN0RCxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUN0TCxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsY0FBYyxFQUFFLEVBQUMrSixLQUFLLEVBQUVGLFFBQVEsRUFBQyxDQUFDLEVBQUV0RSxNQUFNLENBQUN5VCxLQUFLO0VBQ3hHOztFQUVBLE1BQU1DLFVBQVVBLENBQUNwUCxRQUFrQixFQUFFbVAsS0FBZSxFQUFpQjtJQUNuRSxNQUFNLElBQUksQ0FBQ3phLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxjQUFjLEVBQUUsRUFBQytKLEtBQUssRUFBRUYsUUFBUSxFQUFFbVAsS0FBSyxFQUFFQSxLQUFLLEVBQUMsQ0FBQztFQUNoRzs7RUFFQSxNQUFNRSxxQkFBcUJBLENBQUNDLFlBQXVCLEVBQXFDO0lBQ3RGLElBQUk3VCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMvRyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsa0JBQWtCLEVBQUUsRUFBQ29aLE9BQU8sRUFBRUQsWUFBWSxFQUFDLENBQUM7SUFDckcsSUFBSSxDQUFDN1QsSUFBSSxDQUFDQyxNQUFNLENBQUM2VCxPQUFPLEVBQUUsT0FBTyxFQUFFO0lBQ25DLElBQUlBLE9BQU8sR0FBRyxFQUFFO0lBQ2hCLEtBQUssSUFBSUMsUUFBUSxJQUFJL1QsSUFBSSxDQUFDQyxNQUFNLENBQUM2VCxPQUFPLEVBQUU7TUFDeENBLE9BQU8sQ0FBQ3hULElBQUksQ0FBQyxJQUFJMFQsK0JBQXNCLENBQUMsQ0FBQyxDQUFDblMsUUFBUSxDQUFDa1MsUUFBUSxDQUFDcFMsS0FBSyxDQUFDLENBQUNrRixVQUFVLENBQUNrTixRQUFRLENBQUNoWCxPQUFPLENBQUMsQ0FBQ2tYLGNBQWMsQ0FBQ0YsUUFBUSxDQUFDRyxXQUFXLENBQUMsQ0FBQ3ZSLFlBQVksQ0FBQ29SLFFBQVEsQ0FBQzNSLFVBQVUsQ0FBQyxDQUFDO0lBQ3pLO0lBQ0EsT0FBTzBSLE9BQU87RUFDaEI7O0VBRUEsTUFBTUssbUJBQW1CQSxDQUFDcFgsT0FBZSxFQUFFbVgsV0FBb0IsRUFBbUI7SUFDaEYsSUFBSWxVLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxFQUFDcUMsT0FBTyxFQUFFQSxPQUFPLEVBQUVtWCxXQUFXLEVBQUVBLFdBQVcsRUFBQyxDQUFDO0lBQzFILE9BQU9sVSxJQUFJLENBQUNDLE1BQU0sQ0FBQzBCLEtBQUs7RUFDMUI7O0VBRUEsTUFBTXlTLG9CQUFvQkEsQ0FBQ3pTLEtBQWEsRUFBRWtGLFVBQW1CLEVBQUU5SixPQUEyQixFQUFFa1gsY0FBdUIsRUFBRUMsV0FBK0IsRUFBaUI7SUFDbkssSUFBSWxVLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRTtNQUM1RWlILEtBQUssRUFBRUEsS0FBSztNQUNaMFMsV0FBVyxFQUFFeE4sVUFBVTtNQUN2QjlKLE9BQU8sRUFBRUEsT0FBTztNQUNoQnVYLGVBQWUsRUFBRUwsY0FBYztNQUMvQkMsV0FBVyxFQUFFQTtJQUNmLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1LLHNCQUFzQkEsQ0FBQ0MsUUFBZ0IsRUFBaUI7SUFDNUQsTUFBTSxJQUFJLENBQUN2YixNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMscUJBQXFCLEVBQUUsRUFBQ2lILEtBQUssRUFBRTZTLFFBQVEsRUFBQyxDQUFDO0VBQ3pGOztFQUVBLE1BQU1DLFdBQVdBLENBQUM1UCxHQUFHLEVBQUU2UCxjQUFjLEVBQUU7SUFDckMsTUFBTSxJQUFJLENBQUN6YixNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsY0FBYyxFQUFFLEVBQUNtSyxHQUFHLEVBQUVBLEdBQUcsRUFBRUUsUUFBUSxFQUFFMlAsY0FBYyxFQUFDLENBQUM7RUFDckc7O0VBRUEsTUFBTUMsYUFBYUEsQ0FBQ0QsY0FBd0IsRUFBaUI7SUFDM0QsTUFBTSxJQUFJLENBQUN6YixNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsZ0JBQWdCLEVBQUUsRUFBQ3FLLFFBQVEsRUFBRTJQLGNBQWMsRUFBQyxDQUFDO0VBQzdGOztFQUVBLE1BQU1FLGNBQWNBLENBQUEsRUFBZ0M7SUFDbEQsSUFBSUMsSUFBSSxHQUFHLEVBQUU7SUFDYixJQUFJN1UsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGtCQUFrQixDQUFDO0lBQzVFLElBQUlzRixJQUFJLENBQUNDLE1BQU0sQ0FBQzZVLFlBQVksRUFBRTtNQUM1QixLQUFLLElBQUlDLGFBQWEsSUFBSS9VLElBQUksQ0FBQ0MsTUFBTSxDQUFDNlUsWUFBWSxFQUFFO1FBQ2xERCxJQUFJLENBQUN2VSxJQUFJLENBQUMsSUFBSTBVLHlCQUFnQixDQUFDO1VBQzdCblEsR0FBRyxFQUFFa1EsYUFBYSxDQUFDbFEsR0FBRyxHQUFHa1EsYUFBYSxDQUFDbFEsR0FBRyxHQUFHcEwsU0FBUztVQUN0RHlNLEtBQUssRUFBRTZPLGFBQWEsQ0FBQzdPLEtBQUssR0FBRzZPLGFBQWEsQ0FBQzdPLEtBQUssR0FBR3pNLFNBQVM7VUFDNURpYixjQUFjLEVBQUVLLGFBQWEsQ0FBQ2hRO1FBQ2hDLENBQUMsQ0FBQyxDQUFDO01BQ0w7SUFDRjtJQUNBLE9BQU84UCxJQUFJO0VBQ2I7O0VBRUEsTUFBTUksa0JBQWtCQSxDQUFDcFEsR0FBVyxFQUFFcUIsS0FBYSxFQUFpQjtJQUNsRSxNQUFNLElBQUksQ0FBQ2pOLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyw2QkFBNkIsRUFBRSxFQUFDbUssR0FBRyxFQUFFQSxHQUFHLEVBQUVxUCxXQUFXLEVBQUVoTyxLQUFLLEVBQUMsQ0FBQztFQUM5Rzs7RUFFQSxNQUFNZ1AsYUFBYUEsQ0FBQ2pjLE1BQXNCLEVBQW1CO0lBQzNEQSxNQUFNLEdBQUdILHFCQUFZLENBQUMwVCx3QkFBd0IsQ0FBQ3ZULE1BQU0sQ0FBQztJQUN0RCxJQUFJK0csSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLFVBQVUsRUFBRTtNQUNuRXFDLE9BQU8sRUFBRTlELE1BQU0sQ0FBQ2dVLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM3TCxVQUFVLENBQUMsQ0FBQztNQUNqRCtMLE1BQU0sRUFBRWxVLE1BQU0sQ0FBQ2dVLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNDLFNBQVMsQ0FBQyxDQUFDLEdBQUdqVSxNQUFNLENBQUNnVSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDQyxTQUFTLENBQUMsQ0FBQyxDQUFDRSxRQUFRLENBQUMsQ0FBQyxHQUFHM1QsU0FBUztNQUNoSDJJLFVBQVUsRUFBRW5KLE1BQU0sQ0FBQ3VVLFlBQVksQ0FBQyxDQUFDO01BQ2pDMkgsY0FBYyxFQUFFbGMsTUFBTSxDQUFDbWMsZ0JBQWdCLENBQUMsQ0FBQztNQUN6Q0MsY0FBYyxFQUFFcGMsTUFBTSxDQUFDcWMsT0FBTyxDQUFDO0lBQ2pDLENBQUMsQ0FBQztJQUNGLE9BQU90VixJQUFJLENBQUNDLE1BQU0sQ0FBQ3NWLEdBQUc7RUFDeEI7O0VBRUEsTUFBTUMsZUFBZUEsQ0FBQ0QsR0FBVyxFQUEyQjtJQUMxRCxJQUFBbFcsZUFBTSxFQUFDa1csR0FBRyxFQUFFLDJCQUEyQixDQUFDO0lBQ3hDLElBQUl2VixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMvRyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUM2YSxHQUFHLEVBQUVBLEdBQUcsRUFBQyxDQUFDO0lBQ2pGLElBQUl0YyxNQUFNLEdBQUcsSUFBSXdjLHVCQUFjLENBQUMsRUFBQzFZLE9BQU8sRUFBRWlELElBQUksQ0FBQ0MsTUFBTSxDQUFDc1YsR0FBRyxDQUFDeFksT0FBTyxFQUFFb1EsTUFBTSxFQUFFM04sTUFBTSxDQUFDUSxJQUFJLENBQUNDLE1BQU0sQ0FBQ3NWLEdBQUcsQ0FBQ3BJLE1BQU0sQ0FBQyxFQUFDLENBQUM7SUFDM0dsVSxNQUFNLENBQUMwSixZQUFZLENBQUMzQyxJQUFJLENBQUNDLE1BQU0sQ0FBQ3NWLEdBQUcsQ0FBQ25ULFVBQVUsQ0FBQztJQUMvQ25KLE1BQU0sQ0FBQ3ljLGdCQUFnQixDQUFDMVYsSUFBSSxDQUFDQyxNQUFNLENBQUNzVixHQUFHLENBQUNKLGNBQWMsQ0FBQztJQUN2RGxjLE1BQU0sQ0FBQzBjLE9BQU8sQ0FBQzNWLElBQUksQ0FBQ0MsTUFBTSxDQUFDc1YsR0FBRyxDQUFDRixjQUFjLENBQUM7SUFDOUMsSUFBSSxFQUFFLEtBQUtwYyxNQUFNLENBQUNnVSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDN0wsVUFBVSxDQUFDLENBQUMsRUFBRW5JLE1BQU0sQ0FBQ2dVLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNwRyxVQUFVLENBQUNwTixTQUFTLENBQUM7SUFDdEcsSUFBSSxFQUFFLEtBQUtSLE1BQU0sQ0FBQ3VVLFlBQVksQ0FBQyxDQUFDLEVBQUV2VSxNQUFNLENBQUMwSixZQUFZLENBQUNsSixTQUFTLENBQUM7SUFDaEUsSUFBSSxFQUFFLEtBQUtSLE1BQU0sQ0FBQ21jLGdCQUFnQixDQUFDLENBQUMsRUFBRW5jLE1BQU0sQ0FBQ3ljLGdCQUFnQixDQUFDamMsU0FBUyxDQUFDO0lBQ3hFLElBQUksRUFBRSxLQUFLUixNQUFNLENBQUNxYyxPQUFPLENBQUMsQ0FBQyxFQUFFcmMsTUFBTSxDQUFDMGMsT0FBTyxDQUFDbGMsU0FBUyxDQUFDO0lBQ3RELE9BQU9SLE1BQU07RUFDZjs7RUFFQSxNQUFNMmMsWUFBWUEsQ0FBQ3JkLEdBQVcsRUFBbUI7SUFDL0MsSUFBSTtNQUNGLElBQUl5SCxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMvRyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsZUFBZSxFQUFFLEVBQUNuQyxHQUFHLEVBQUVBLEdBQUcsRUFBQyxDQUFDO01BQ3JGLE9BQU95SCxJQUFJLENBQUNDLE1BQU0sQ0FBQzRWLEtBQUssS0FBSyxFQUFFLEdBQUdwYyxTQUFTLEdBQUd1RyxJQUFJLENBQUNDLE1BQU0sQ0FBQzRWLEtBQUs7SUFDakUsQ0FBQyxDQUFDLE9BQU9uWSxDQUFNLEVBQUU7TUFDZixJQUFJQSxDQUFDLFlBQVlOLHVCQUFjLElBQUlNLENBQUMsQ0FBQ0wsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxPQUFPNUQsU0FBUztNQUN4RSxNQUFNaUUsQ0FBQztJQUNUO0VBQ0Y7O0VBRUEsTUFBTW9ZLFlBQVlBLENBQUN2ZCxHQUFXLEVBQUV3ZCxHQUFXLEVBQWlCO0lBQzFELE1BQU0sSUFBSSxDQUFDOWMsTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGVBQWUsRUFBRSxFQUFDbkMsR0FBRyxFQUFFQSxHQUFHLEVBQUVzZCxLQUFLLEVBQUVFLEdBQUcsRUFBQyxDQUFDO0VBQ3hGOztFQUVBLE1BQU1DLFdBQVdBLENBQUNDLFVBQWtCLEVBQUVDLGdCQUEwQixFQUFFQyxhQUF1QixFQUFpQjtJQUN4RyxNQUFNLElBQUksQ0FBQ2xkLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxjQUFjLEVBQUU7TUFDNUQwYixhQUFhLEVBQUVILFVBQVU7TUFDekJJLG9CQUFvQixFQUFFSCxnQkFBZ0I7TUFDdENJLGNBQWMsRUFBRUg7SUFDbEIsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUksVUFBVUEsQ0FBQSxFQUFrQjtJQUNoQyxNQUFNLElBQUksQ0FBQ3RkLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxhQUFhLENBQUM7RUFDOUQ7O0VBRUEsTUFBTThiLHNCQUFzQkEsQ0FBQSxFQUFxQjtJQUMvQyxJQUFJeFcsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGFBQWEsQ0FBQztJQUN2RSxPQUFPc0YsSUFBSSxDQUFDQyxNQUFNLENBQUN3VyxzQkFBc0IsS0FBSyxJQUFJO0VBQ3BEOztFQUVBLE1BQU1DLGVBQWVBLENBQUEsRUFBZ0M7SUFDbkQsSUFBSTFXLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxhQUFhLENBQUM7SUFDdkUsSUFBSXVGLE1BQU0sR0FBR0QsSUFBSSxDQUFDQyxNQUFNO0lBQ3hCLElBQUkwVyxJQUFJLEdBQUcsSUFBSUMsMkJBQWtCLENBQUMsQ0FBQztJQUNuQ0QsSUFBSSxDQUFDRSxhQUFhLENBQUM1VyxNQUFNLENBQUM2VyxRQUFRLENBQUM7SUFDbkNILElBQUksQ0FBQ0ksVUFBVSxDQUFDOVcsTUFBTSxDQUFDK1csS0FBSyxDQUFDO0lBQzdCTCxJQUFJLENBQUNNLFlBQVksQ0FBQ2hYLE1BQU0sQ0FBQ2lYLFNBQVMsQ0FBQztJQUNuQ1AsSUFBSSxDQUFDUSxrQkFBa0IsQ0FBQ2xYLE1BQU0sQ0FBQ3VULEtBQUssQ0FBQztJQUNyQyxPQUFPbUQsSUFBSTtFQUNiOztFQUVBLE1BQU1TLGVBQWVBLENBQUEsRUFBb0I7SUFDdkMsSUFBSXBYLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxFQUFDZ0MsNEJBQTRCLEVBQUUsSUFBSSxFQUFDLENBQUM7SUFDbEgsSUFBSSxDQUFDeEQsWUFBWSxHQUFHLENBQUMsQ0FBQztJQUN0QixJQUFJK0csTUFBTSxHQUFHRCxJQUFJLENBQUNDLE1BQU07SUFDeEIsT0FBT0EsTUFBTSxDQUFDb1gsYUFBYTtFQUM3Qjs7RUFFQSxNQUFNQyxZQUFZQSxDQUFDQyxhQUF1QixFQUFFTCxTQUFpQixFQUFFNWMsUUFBZ0IsRUFBbUI7SUFDaEcsSUFBSTBGLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxlQUFlLEVBQUU7TUFDeEUyYyxhQUFhLEVBQUVFLGFBQWE7TUFDNUJMLFNBQVMsRUFBRUEsU0FBUztNQUNwQjVjLFFBQVEsRUFBRUE7SUFDWixDQUFDLENBQUM7SUFDRixJQUFJLENBQUNwQixZQUFZLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLE9BQU84RyxJQUFJLENBQUNDLE1BQU0sQ0FBQ29YLGFBQWE7RUFDbEM7O0VBRUEsTUFBTUcsb0JBQW9CQSxDQUFDRCxhQUF1QixFQUFFamQsUUFBZ0IsRUFBcUM7SUFDdkcsSUFBSTBGLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyx3QkFBd0IsRUFBRSxFQUFDMmMsYUFBYSxFQUFFRSxhQUFhLEVBQUVqZCxRQUFRLEVBQUVBLFFBQVEsRUFBQyxDQUFDO0lBQ3RJLElBQUksQ0FBQ3BCLFlBQVksR0FBRyxDQUFDLENBQUM7SUFDdEIsSUFBSXVlLFFBQVEsR0FBRyxJQUFJQyxpQ0FBd0IsQ0FBQyxDQUFDO0lBQzdDRCxRQUFRLENBQUM1USxVQUFVLENBQUM3RyxJQUFJLENBQUNDLE1BQU0sQ0FBQ2xELE9BQU8sQ0FBQztJQUN4QzBhLFFBQVEsQ0FBQ0UsY0FBYyxDQUFDM1gsSUFBSSxDQUFDQyxNQUFNLENBQUNvWCxhQUFhLENBQUM7SUFDbEQsSUFBSUksUUFBUSxDQUFDclcsVUFBVSxDQUFDLENBQUMsQ0FBQ29ELE1BQU0sS0FBSyxDQUFDLEVBQUVpVCxRQUFRLENBQUM1USxVQUFVLENBQUNwTixTQUFTLENBQUM7SUFDdEUsSUFBSWdlLFFBQVEsQ0FBQ0csY0FBYyxDQUFDLENBQUMsQ0FBQ3BULE1BQU0sS0FBSyxDQUFDLEVBQUVpVCxRQUFRLENBQUNFLGNBQWMsQ0FBQ2xlLFNBQVMsQ0FBQztJQUM5RSxPQUFPZ2UsUUFBUTtFQUNqQjs7RUFFQSxNQUFNSSxpQkFBaUJBLENBQUEsRUFBb0I7SUFDekMsSUFBSTdYLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxzQkFBc0IsQ0FBQztJQUNoRixPQUFPc0YsSUFBSSxDQUFDQyxNQUFNLENBQUMwVyxJQUFJO0VBQ3pCOztFQUVBLE1BQU1tQixpQkFBaUJBLENBQUNQLGFBQXVCLEVBQW1CO0lBQ2hFLElBQUksQ0FBQzNkLGlCQUFRLENBQUNxVyxPQUFPLENBQUNzSCxhQUFhLENBQUMsRUFBRSxNQUFNLElBQUk3ZCxvQkFBVyxDQUFDLDhDQUE4QyxDQUFDO0lBQzNHLElBQUlzRyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMvRyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsc0JBQXNCLEVBQUUsRUFBQ2ljLElBQUksRUFBRVksYUFBYSxFQUFDLENBQUM7SUFDdkcsT0FBT3ZYLElBQUksQ0FBQ0MsTUFBTSxDQUFDOFgsU0FBUztFQUM5Qjs7RUFFQSxNQUFNQyxpQkFBaUJBLENBQUNDLGFBQXFCLEVBQXFDO0lBQ2hGLElBQUlqWSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMvRyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsZUFBZSxFQUFFLEVBQUN3VyxXQUFXLEVBQUUrRyxhQUFhLEVBQUMsQ0FBQztJQUN2RyxJQUFJaFksTUFBTSxHQUFHRCxJQUFJLENBQUNDLE1BQU07SUFDeEIsSUFBSWlZLFVBQVUsR0FBRyxJQUFJQyxpQ0FBd0IsQ0FBQyxDQUFDO0lBQy9DRCxVQUFVLENBQUNFLHNCQUFzQixDQUFDblksTUFBTSxDQUFDaVIsV0FBVyxDQUFDO0lBQ3JEZ0gsVUFBVSxDQUFDRyxXQUFXLENBQUNwWSxNQUFNLENBQUNrUixZQUFZLENBQUM7SUFDM0MsT0FBTytHLFVBQVU7RUFDbkI7O0VBRUEsTUFBTUksbUJBQW1CQSxDQUFDQyxtQkFBMkIsRUFBcUI7SUFDeEUsSUFBSXZZLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxpQkFBaUIsRUFBRSxFQUFDd1csV0FBVyxFQUFFcUgsbUJBQW1CLEVBQUMsQ0FBQztJQUMvRyxPQUFPdlksSUFBSSxDQUFDQyxNQUFNLENBQUNrUixZQUFZO0VBQ2pDOztFQUVBLE1BQU1xSCxjQUFjQSxDQUFDQyxXQUFtQixFQUFFQyxXQUFtQixFQUFpQjtJQUM1RSxPQUFPLElBQUksQ0FBQ3pmLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyx3QkFBd0IsRUFBRSxFQUFDaWUsWUFBWSxFQUFFRixXQUFXLElBQUksRUFBRSxFQUFFRyxZQUFZLEVBQUVGLFdBQVcsSUFBSSxFQUFFLEVBQUMsQ0FBQztFQUM5STs7RUFFQSxNQUFNRyxJQUFJQSxDQUFBLEVBQWtCO0lBQzFCLE1BQU0sSUFBSSxDQUFDNWYsTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLE9BQU8sQ0FBQztFQUN4RDs7RUFFQSxNQUFNb2UsS0FBS0EsQ0FBQ0QsSUFBSSxHQUFHLEtBQUssRUFBaUI7SUFDdkMsTUFBTSxLQUFLLENBQUNDLEtBQUssQ0FBQ0QsSUFBSSxDQUFDO0lBQ3ZCLElBQUlBLElBQUksS0FBS3BmLFNBQVMsRUFBRW9mLElBQUksR0FBRyxLQUFLO0lBQ3BDLE1BQU0sSUFBSSxDQUFDaGUsS0FBSyxDQUFDLENBQUM7SUFDbEIsTUFBTSxJQUFJLENBQUM1QixNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsY0FBYyxFQUFFLEVBQUNtQyxnQkFBZ0IsRUFBRWdjLElBQUksRUFBQyxDQUFDO0VBQ3pGOztFQUVBLE1BQU1FLFFBQVFBLENBQUEsRUFBcUI7SUFDakMsSUFBSTtNQUNGLE1BQU0sSUFBSSxDQUFDN2QsaUJBQWlCLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQUMsT0FBT3dDLENBQU0sRUFBRTtNQUNmLE9BQU9BLENBQUMsWUFBWU4sdUJBQWMsSUFBSU0sQ0FBQyxDQUFDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJSyxDQUFDLENBQUNQLE9BQU8sQ0FBQ3NELE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2RztJQUNBLE9BQU8sS0FBSztFQUNkOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNdVksSUFBSUEsQ0FBQSxFQUFrQjtJQUMxQixNQUFNLElBQUksQ0FBQ25lLEtBQUssQ0FBQyxDQUFDO0lBQ2xCLE1BQU0sSUFBSSxDQUFDNUIsTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGFBQWEsQ0FBQztFQUM5RDs7RUFFQTs7RUFFQSxNQUFNZ00sb0JBQW9CQSxDQUFBLEVBQXNCLENBQUUsT0FBTyxLQUFLLENBQUNBLG9CQUFvQixDQUFDLENBQUMsQ0FBRTtFQUN2RixNQUFNOEIsS0FBS0EsQ0FBQzBKLE1BQWMsRUFBMkIsQ0FBRSxPQUFPLEtBQUssQ0FBQzFKLEtBQUssQ0FBQzBKLE1BQU0sQ0FBQyxDQUFFO0VBQ25GLE1BQU0rRyxvQkFBb0JBLENBQUMvUixLQUFtQyxFQUFxQyxDQUFFLE9BQU8sS0FBSyxDQUFDK1Isb0JBQW9CLENBQUMvUixLQUFLLENBQUMsQ0FBRTtFQUMvSSxNQUFNZ1Msb0JBQW9CQSxDQUFDaFMsS0FBbUMsRUFBRSxDQUFFLE9BQU8sS0FBSyxDQUFDZ1Msb0JBQW9CLENBQUNoUyxLQUFLLENBQUMsQ0FBRTtFQUM1RyxNQUFNaVMsUUFBUUEsQ0FBQ2xnQixNQUErQixFQUEyQixDQUFFLE9BQU8sS0FBSyxDQUFDa2dCLFFBQVEsQ0FBQ2xnQixNQUFNLENBQUMsQ0FBRTtFQUMxRyxNQUFNbWdCLE9BQU9BLENBQUNsSixZQUFxQyxFQUFtQixDQUFFLE9BQU8sS0FBSyxDQUFDa0osT0FBTyxDQUFDbEosWUFBWSxDQUFDLENBQUU7RUFDNUcsTUFBTW1KLFNBQVNBLENBQUNuSCxNQUFjLEVBQW1CLENBQUUsT0FBTyxLQUFLLENBQUNtSCxTQUFTLENBQUNuSCxNQUFNLENBQUMsQ0FBRTtFQUNuRixNQUFNb0gsU0FBU0EsQ0FBQ3BILE1BQWMsRUFBRXFILElBQVksRUFBaUIsQ0FBRSxPQUFPLEtBQUssQ0FBQ0QsU0FBUyxDQUFDcEgsTUFBTSxFQUFFcUgsSUFBSSxDQUFDLENBQUU7O0VBRXJHOztFQUVBLGFBQWFDLGtCQUFrQkEsQ0FBQ0MsV0FBMkYsRUFBRXZiLFFBQWlCLEVBQUU1RCxRQUFpQixFQUE0QjtJQUMzTCxJQUFJckIsTUFBTSxHQUFHSixlQUFlLENBQUM2Z0IsZUFBZSxDQUFDRCxXQUFXLEVBQUV2YixRQUFRLEVBQUU1RCxRQUFRLENBQUM7SUFDN0UsSUFBSXJCLE1BQU0sQ0FBQzBnQixHQUFHLEVBQUUsT0FBTzlnQixlQUFlLENBQUMrZ0IscUJBQXFCLENBQUMzZ0IsTUFBTSxDQUFDLENBQUM7SUFDaEUsT0FBTyxJQUFJSixlQUFlLENBQUNJLE1BQU0sQ0FBQztFQUN6Qzs7RUFFQSxhQUF1QjJnQixxQkFBcUJBLENBQUMzZ0IsTUFBbUMsRUFBNEI7SUFDMUcsSUFBQW9HLGVBQU0sRUFBQ3pGLGlCQUFRLENBQUNxVyxPQUFPLENBQUNoWCxNQUFNLENBQUMwZ0IsR0FBRyxDQUFDLEVBQUUsd0RBQXdELENBQUM7O0lBRTlGO0lBQ0EsSUFBSUUsYUFBYSxHQUFHLE1BQUFDLE9BQUEsQ0FBQUMsT0FBQSxHQUFBQyxJQUFBLE9BQUFyaUIsdUJBQUEsQ0FBQTlDLE9BQUEsQ0FBYSxlQUFlLEdBQUM7SUFDakQsTUFBTXlFLE9BQU8sR0FBR3VnQixhQUFhLENBQUNJLEtBQUssQ0FBQ2hoQixNQUFNLENBQUMwZ0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFMWdCLE1BQU0sQ0FBQzBnQixHQUFHLENBQUM3TSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDM0V4VCxPQUFPLENBQUM0Z0IsTUFBTSxDQUFDQyxXQUFXLENBQUMsTUFBTSxDQUFDO0lBQ2xDN2dCLE9BQU8sQ0FBQzhnQixNQUFNLENBQUNELFdBQVcsQ0FBQyxNQUFNLENBQUM7O0lBRWxDO0lBQ0EsSUFBSTVFLEdBQUc7SUFDUCxJQUFJOEUsSUFBSSxHQUFHLElBQUk7SUFDZixJQUFJalIsTUFBTSxHQUFHLEVBQUU7SUFDZixPQUFPLElBQUkwUSxPQUFPLENBQUMsVUFBU0MsT0FBTyxFQUFFTyxNQUFNLEVBQUU7O01BRTNDO01BQ0FoaEIsT0FBTyxDQUFDNGdCLE1BQU0sQ0FBQ0ssRUFBRSxDQUFDLE1BQU0sRUFBRSxnQkFBZS9JLElBQUksRUFBRTtRQUM3QyxJQUFJZ0osSUFBSSxHQUFHaEosSUFBSSxDQUFDcEUsUUFBUSxDQUFDLENBQUM7UUFDMUJxTixxQkFBWSxDQUFDQyxHQUFHLENBQUMsQ0FBQyxFQUFFRixJQUFJLENBQUM7UUFDekJwUixNQUFNLElBQUlvUixJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUM7O1FBRXZCO1FBQ0EsSUFBSUcsZUFBZSxHQUFHLGFBQWE7UUFDbkMsSUFBSUMsa0JBQWtCLEdBQUdKLElBQUksQ0FBQy9aLE9BQU8sQ0FBQ2thLGVBQWUsQ0FBQztRQUN0RCxJQUFJQyxrQkFBa0IsSUFBSSxDQUFDLEVBQUU7VUFDM0IsSUFBSUMsSUFBSSxHQUFHTCxJQUFJLENBQUNNLFNBQVMsQ0FBQ0Ysa0JBQWtCLEdBQUdELGVBQWUsQ0FBQ25XLE1BQU0sRUFBRWdXLElBQUksQ0FBQ08sV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1VBQzdGLElBQUlDLGVBQWUsR0FBR1IsSUFBSSxDQUFDUyxPQUFPLENBQUMsZUFBZSxFQUFFLEVBQUUsQ0FBQyxDQUFDQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDaEUsSUFBSUMsSUFBSSxHQUFHSCxlQUFlLENBQUNGLFNBQVMsQ0FBQ0UsZUFBZSxDQUFDRCxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1VBQzFFLElBQUlLLE1BQU0sR0FBR25pQixNQUFNLENBQUMwZ0IsR0FBRyxDQUFDbFosT0FBTyxDQUFDLFdBQVcsQ0FBQztVQUM1QyxJQUFJNGEsVUFBVSxHQUFHRCxNQUFNLElBQUksQ0FBQyxHQUFHLFNBQVMsSUFBSW5pQixNQUFNLENBQUMwZ0IsR0FBRyxDQUFDeUIsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDRSxXQUFXLENBQUMsQ0FBQyxHQUFHLEtBQUs7VUFDeEYvRixHQUFHLEdBQUcsQ0FBQzhGLFVBQVUsR0FBRyxPQUFPLEdBQUcsTUFBTSxJQUFJLEtBQUssR0FBR1IsSUFBSSxHQUFHLEdBQUcsR0FBR00sSUFBSTtRQUNuRTs7UUFFQTtRQUNBLElBQUlYLElBQUksQ0FBQy9aLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsRUFBRTs7VUFFbkQ7VUFDQSxJQUFJOGEsV0FBVyxHQUFHdGlCLE1BQU0sQ0FBQzBnQixHQUFHLENBQUNsWixPQUFPLENBQUMsYUFBYSxDQUFDO1VBQ25ELElBQUkrYSxRQUFRLEdBQUdELFdBQVcsSUFBSSxDQUFDLEdBQUd0aUIsTUFBTSxDQUFDMGdCLEdBQUcsQ0FBQzRCLFdBQVcsR0FBRyxDQUFDLENBQUMsR0FBRzloQixTQUFTO1VBQ3pFLElBQUl5RSxRQUFRLEdBQUdzZCxRQUFRLEtBQUsvaEIsU0FBUyxHQUFHQSxTQUFTLEdBQUcraEIsUUFBUSxDQUFDVixTQUFTLENBQUMsQ0FBQyxFQUFFVSxRQUFRLENBQUMvYSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7VUFDaEcsSUFBSW5HLFFBQVEsR0FBR2toQixRQUFRLEtBQUsvaEIsU0FBUyxHQUFHQSxTQUFTLEdBQUcraEIsUUFBUSxDQUFDVixTQUFTLENBQUNVLFFBQVEsQ0FBQy9hLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7O1VBRWpHO1VBQ0F4SCxNQUFNLEdBQUdBLE1BQU0sQ0FBQ2tQLElBQUksQ0FBQyxDQUFDLENBQUNzVCxTQUFTLENBQUMsRUFBQ2xHLEdBQUcsRUFBRUEsR0FBRyxFQUFFclgsUUFBUSxFQUFFQSxRQUFRLEVBQUU1RCxRQUFRLEVBQUVBLFFBQVEsRUFBRW9oQixrQkFBa0IsRUFBRXppQixNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxHQUFHbEIsTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ3doQixxQkFBcUIsQ0FBQyxDQUFDLEdBQUdsaUIsU0FBUyxFQUFDLENBQUM7VUFDckxSLE1BQU0sQ0FBQzBnQixHQUFHLEdBQUdsZ0IsU0FBUztVQUN0QixJQUFJbWlCLE1BQU0sR0FBRyxNQUFNL2lCLGVBQWUsQ0FBQzJnQixrQkFBa0IsQ0FBQ3ZnQixNQUFNLENBQUM7VUFDN0QyaUIsTUFBTSxDQUFDdGlCLE9BQU8sR0FBR0EsT0FBTzs7VUFFeEI7VUFDQSxJQUFJLENBQUN1aUIsVUFBVSxHQUFHLElBQUk7VUFDdEI5QixPQUFPLENBQUM2QixNQUFNLENBQUM7UUFDakI7TUFDRixDQUFDLENBQUM7O01BRUY7TUFDQXRpQixPQUFPLENBQUM4Z0IsTUFBTSxDQUFDRyxFQUFFLENBQUMsTUFBTSxFQUFFLFVBQVMvSSxJQUFJLEVBQUU7UUFDdkMsSUFBSWlKLHFCQUFZLENBQUNxQixXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRXJTLE9BQU8sQ0FBQ0MsS0FBSyxDQUFDOEgsSUFBSSxDQUFDO01BQzFELENBQUMsQ0FBQzs7TUFFRjtNQUNBbFksT0FBTyxDQUFDaWhCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsVUFBU3dCLElBQUksRUFBRTtRQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDRixVQUFVLEVBQUV2QixNQUFNLENBQUMsSUFBSTVnQixvQkFBVyxDQUFDLHNEQUFzRCxHQUFHcWlCLElBQUksSUFBSTNTLE1BQU0sR0FBRyxPQUFPLEdBQUdBLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO01BQ2pKLENBQUMsQ0FBQzs7TUFFRjtNQUNBOVAsT0FBTyxDQUFDaWhCLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBU2plLEdBQUcsRUFBRTtRQUNoQyxJQUFJQSxHQUFHLENBQUNhLE9BQU8sQ0FBQ3NELE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU2WixNQUFNLENBQUMsSUFBSTVnQixvQkFBVyxDQUFDLDRDQUE0QyxHQUFHVCxNQUFNLENBQUMwZ0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ25JLElBQUksQ0FBQyxJQUFJLENBQUNrQyxVQUFVLEVBQUV2QixNQUFNLENBQUNoZSxHQUFHLENBQUM7TUFDbkMsQ0FBQyxDQUFDOztNQUVGO01BQ0FoRCxPQUFPLENBQUNpaEIsRUFBRSxDQUFDLG1CQUFtQixFQUFFLFVBQVNqZSxHQUFHLEVBQUUwZixNQUFNLEVBQUU7UUFDcER2UyxPQUFPLENBQUNDLEtBQUssQ0FBQyxtREFBbUQsR0FBR3BOLEdBQUcsQ0FBQ2EsT0FBTyxDQUFDO1FBQ2hGc00sT0FBTyxDQUFDQyxLQUFLLENBQUNzUyxNQUFNLENBQUM7UUFDckIxQixNQUFNLENBQUNoZSxHQUFHLENBQUM7TUFDYixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFnQnpCLEtBQUtBLENBQUEsRUFBRztJQUN0QixJQUFJLENBQUN6QixTQUFTLENBQUNzSCxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQ3RILFNBQVMsQ0FBQ29MLE1BQU0sQ0FBQztJQUMvQyxJQUFJLENBQUNqRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3ZCLE9BQU8sSUFBSSxDQUFDckgsWUFBWTtJQUN4QixJQUFJLENBQUNBLFlBQVksR0FBRyxDQUFDLENBQUM7SUFDdEIsSUFBSSxDQUFDc0IsSUFBSSxHQUFHZixTQUFTO0VBQ3ZCOztFQUVBLE1BQWdCd2lCLGlCQUFpQkEsQ0FBQ3BQLG9CQUEwQixFQUFFO0lBQzVELElBQUlzQyxPQUFPLEdBQUcsSUFBSXRGLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCLEtBQUssSUFBSW5LLE9BQU8sSUFBSSxNQUFNLElBQUksQ0FBQ0MsV0FBVyxDQUFDLENBQUMsRUFBRTtNQUM1Q3dQLE9BQU8sQ0FBQ3ZXLEdBQUcsQ0FBQzhHLE9BQU8sQ0FBQzBGLFFBQVEsQ0FBQyxDQUFDLEVBQUV5SCxvQkFBb0IsR0FBRyxNQUFNLElBQUksQ0FBQ0Esb0JBQW9CLENBQUNuTixPQUFPLENBQUMwRixRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUczTCxTQUFTLENBQUM7SUFDekg7SUFDQSxPQUFPMFYsT0FBTztFQUNoQjs7RUFFQSxNQUFnQnRDLG9CQUFvQkEsQ0FBQzFOLFVBQVUsRUFBRTtJQUMvQyxJQUFJa0gsaUJBQWlCLEdBQUcsRUFBRTtJQUMxQixJQUFJckcsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGFBQWEsRUFBRSxFQUFDb0YsYUFBYSxFQUFFWCxVQUFVLEVBQUMsQ0FBQztJQUNwRyxLQUFLLElBQUlwQyxPQUFPLElBQUlpRCxJQUFJLENBQUNDLE1BQU0sQ0FBQ3dHLFNBQVMsRUFBRUosaUJBQWlCLENBQUMvRixJQUFJLENBQUN2RCxPQUFPLENBQUN1SixhQUFhLENBQUM7SUFDeEYsT0FBT0QsaUJBQWlCO0VBQzFCOztFQUVBLE1BQWdCMEIsZUFBZUEsQ0FBQ2IsS0FBMEIsRUFBRTs7SUFFMUQ7SUFDQSxJQUFJZ1YsT0FBTyxHQUFHaFYsS0FBSyxDQUFDa0QsVUFBVSxDQUFDLENBQUM7SUFDaEMsSUFBSStSLGNBQWMsR0FBR0QsT0FBTyxDQUFDMVMsY0FBYyxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUkwUyxPQUFPLENBQUNFLFdBQVcsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJRixPQUFPLENBQUNHLFdBQVcsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJSCxPQUFPLENBQUNyTSxZQUFZLENBQUMsQ0FBQyxLQUFLLEtBQUs7SUFDL0osSUFBSXlNLGFBQWEsR0FBR0osT0FBTyxDQUFDMVMsY0FBYyxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUkwUyxPQUFPLENBQUNFLFdBQVcsQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJRixPQUFPLENBQUNHLFdBQVcsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJSCxPQUFPLENBQUNyWixTQUFTLENBQUMsQ0FBQyxLQUFLcEosU0FBUyxJQUFJeWlCLE9BQU8sQ0FBQ0ssWUFBWSxDQUFDLENBQUMsS0FBSzlpQixTQUFTLElBQUl5aUIsT0FBTyxDQUFDTSxXQUFXLENBQUMsQ0FBQyxLQUFLLEtBQUs7SUFDMU8sSUFBSUMsYUFBYSxHQUFHdlYsS0FBSyxDQUFDd1YsYUFBYSxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUl4VixLQUFLLENBQUN5VixhQUFhLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSXpWLEtBQUssQ0FBQzBWLGtCQUFrQixDQUFDLENBQUMsS0FBSyxJQUFJO0lBQzVILElBQUlDLGFBQWEsR0FBRzNWLEtBQUssQ0FBQ3lWLGFBQWEsQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJelYsS0FBSyxDQUFDd1YsYUFBYSxDQUFDLENBQUMsS0FBSyxJQUFJOztJQUVyRjtJQUNBLElBQUlSLE9BQU8sQ0FBQ0UsV0FBVyxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQ0UsYUFBYSxFQUFFO01BQ3BELE1BQU0sSUFBSTVpQixvQkFBVyxDQUFDLHFFQUFxRSxDQUFDO0lBQzlGOztJQUVBLElBQUkwQyxNQUFXLEdBQUcsQ0FBQyxDQUFDO0lBQ3BCQSxNQUFNLENBQUMwZ0IsRUFBRSxHQUFHTCxhQUFhLElBQUlOLGNBQWM7SUFDM0MvZixNQUFNLENBQUMyZ0IsR0FBRyxHQUFHRixhQUFhLElBQUlWLGNBQWM7SUFDNUMvZixNQUFNLENBQUM0Z0IsSUFBSSxHQUFHUCxhQUFhLElBQUlILGFBQWE7SUFDNUNsZ0IsTUFBTSxDQUFDNmdCLE9BQU8sR0FBR0osYUFBYSxJQUFJUCxhQUFhO0lBQy9DbGdCLE1BQU0sQ0FBQzhnQixNQUFNLEdBQUdoQixPQUFPLENBQUNHLFdBQVcsQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJSCxPQUFPLENBQUMxUyxjQUFjLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSTBTLE9BQU8sQ0FBQ0UsV0FBVyxDQUFDLENBQUMsSUFBSSxJQUFJO0lBQ3JILElBQUlGLE9BQU8sQ0FBQ2lCLFlBQVksQ0FBQyxDQUFDLEtBQUsxakIsU0FBUyxFQUFFO01BQ3hDLElBQUl5aUIsT0FBTyxDQUFDaUIsWUFBWSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUvZ0IsTUFBTSxDQUFDZ2hCLFVBQVUsR0FBR2xCLE9BQU8sQ0FBQ2lCLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFBQSxLQUMzRS9nQixNQUFNLENBQUNnaEIsVUFBVSxHQUFHbEIsT0FBTyxDQUFDaUIsWUFBWSxDQUFDLENBQUM7SUFDakQ7SUFDQSxJQUFJakIsT0FBTyxDQUFDSyxZQUFZLENBQUMsQ0FBQyxLQUFLOWlCLFNBQVMsRUFBRTJDLE1BQU0sQ0FBQ2loQixVQUFVLEdBQUduQixPQUFPLENBQUNLLFlBQVksQ0FBQyxDQUFDO0lBQ3BGbmdCLE1BQU0sQ0FBQ2toQixnQkFBZ0IsR0FBR3BCLE9BQU8sQ0FBQ2lCLFlBQVksQ0FBQyxDQUFDLEtBQUsxakIsU0FBUyxJQUFJeWlCLE9BQU8sQ0FBQ0ssWUFBWSxDQUFDLENBQUMsS0FBSzlpQixTQUFTO0lBQ3RHLElBQUl5TixLQUFLLENBQUN0QixlQUFlLENBQUMsQ0FBQyxLQUFLbk0sU0FBUyxFQUFFO01BQ3pDLElBQUE0RixlQUFNLEVBQUM2SCxLQUFLLENBQUNxVyxrQkFBa0IsQ0FBQyxDQUFDLEtBQUs5akIsU0FBUyxJQUFJeU4sS0FBSyxDQUFDMkYsb0JBQW9CLENBQUMsQ0FBQyxLQUFLcFQsU0FBUyxFQUFFLDZEQUE2RCxDQUFDO01BQzdKMkMsTUFBTSxDQUFDcUosWUFBWSxHQUFHLElBQUk7SUFDNUIsQ0FBQyxNQUFNO01BQ0xySixNQUFNLENBQUMwRCxhQUFhLEdBQUdvSCxLQUFLLENBQUN0QixlQUFlLENBQUMsQ0FBQzs7TUFFOUM7TUFDQSxJQUFJUyxpQkFBaUIsR0FBRyxJQUFJaUMsR0FBRyxDQUFDLENBQUM7TUFDakMsSUFBSXBCLEtBQUssQ0FBQ3FXLGtCQUFrQixDQUFDLENBQUMsS0FBSzlqQixTQUFTLEVBQUU0TSxpQkFBaUIsQ0FBQ29DLEdBQUcsQ0FBQ3ZCLEtBQUssQ0FBQ3FXLGtCQUFrQixDQUFDLENBQUMsQ0FBQztNQUMvRixJQUFJclcsS0FBSyxDQUFDMkYsb0JBQW9CLENBQUMsQ0FBQyxLQUFLcFQsU0FBUyxFQUFFeU4sS0FBSyxDQUFDMkYsb0JBQW9CLENBQUMsQ0FBQyxDQUFDekIsR0FBRyxDQUFDLENBQUFoTSxhQUFhLEtBQUlpSCxpQkFBaUIsQ0FBQ29DLEdBQUcsQ0FBQ3JKLGFBQWEsQ0FBQyxDQUFDO01BQ3ZJLElBQUlpSCxpQkFBaUIsQ0FBQ21YLElBQUksRUFBRXBoQixNQUFNLENBQUNtUixlQUFlLEdBQUd5QyxLQUFLLENBQUN5TixJQUFJLENBQUNwWCxpQkFBaUIsQ0FBQztJQUNwRjs7SUFFQTtJQUNBLElBQUlxQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSUMsUUFBUSxHQUFHLENBQUMsQ0FBQzs7SUFFakI7SUFDQSxJQUFJM0ksSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLGVBQWUsRUFBRTBCLE1BQU0sQ0FBQztJQUNqRixLQUFLLElBQUk3RCxHQUFHLElBQUlILE1BQU0sQ0FBQ2dYLElBQUksQ0FBQ3BQLElBQUksQ0FBQ0MsTUFBTSxDQUFDLEVBQUU7TUFDeEMsS0FBSyxJQUFJeWQsS0FBSyxJQUFJMWQsSUFBSSxDQUFDQyxNQUFNLENBQUMxSCxHQUFHLENBQUMsRUFBRTtRQUNsQztRQUNBLElBQUlxUSxFQUFFLEdBQUcvUCxlQUFlLENBQUM4a0Isd0JBQXdCLENBQUNELEtBQUssQ0FBQztRQUN4RCxJQUFJOVUsRUFBRSxDQUFDWSxjQUFjLENBQUMsQ0FBQyxFQUFFLElBQUFuSyxlQUFNLEVBQUN1SixFQUFFLENBQUNXLFFBQVEsQ0FBQyxDQUFDLENBQUN0QyxNQUFNLENBQUMsQ0FBQyxDQUFDeEcsT0FBTyxDQUFDbUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7O1FBRXhFO1FBQ0E7UUFDQSxJQUFJQSxFQUFFLENBQUM2RixtQkFBbUIsQ0FBQyxDQUFDLEtBQUtoVixTQUFTLElBQUltUCxFQUFFLENBQUNpSCxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUNqSCxFQUFFLENBQUN5VCxXQUFXLENBQUMsQ0FBQztRQUNoRnpULEVBQUUsQ0FBQzZGLG1CQUFtQixDQUFDLENBQUMsQ0FBQ3hCLGVBQWUsQ0FBQyxDQUFDLElBQUlyRSxFQUFFLENBQUNnVixpQkFBaUIsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1VBQy9FLElBQUlDLGdCQUFnQixHQUFHalYsRUFBRSxDQUFDNkYsbUJBQW1CLENBQUMsQ0FBQztVQUMvQyxJQUFJcVAsYUFBYSxHQUFHdGUsTUFBTSxDQUFDLENBQUMsQ0FBQztVQUM3QixLQUFLLElBQUl3TixXQUFXLElBQUk2USxnQkFBZ0IsQ0FBQzVRLGVBQWUsQ0FBQyxDQUFDLEVBQUU2USxhQUFhLEdBQUdBLGFBQWEsR0FBRzlRLFdBQVcsQ0FBQ0UsU0FBUyxDQUFDLENBQUM7VUFDbkh0RSxFQUFFLENBQUM2RixtQkFBbUIsQ0FBQyxDQUFDLENBQUNPLFNBQVMsQ0FBQzhPLGFBQWEsQ0FBQztRQUNuRDs7UUFFQTtRQUNBamxCLGVBQWUsQ0FBQ2dRLE9BQU8sQ0FBQ0QsRUFBRSxFQUFFRixLQUFLLEVBQUVDLFFBQVEsQ0FBQztNQUM5QztJQUNGOztJQUVBO0lBQ0EsSUFBSVAsR0FBcUIsR0FBR2hRLE1BQU0sQ0FBQzJsQixNQUFNLENBQUNyVixLQUFLLENBQUM7SUFDaEROLEdBQUcsQ0FBQzRWLElBQUksQ0FBQ25sQixlQUFlLENBQUNvbEIsa0JBQWtCLENBQUM7O0lBRTVDO0lBQ0EsSUFBSW5XLFNBQVMsR0FBRyxFQUFFO0lBQ2xCLEtBQUssSUFBSWMsRUFBRSxJQUFJUixHQUFHLEVBQUU7O01BRWxCO01BQ0EsSUFBSVEsRUFBRSxDQUFDOFQsYUFBYSxDQUFDLENBQUMsS0FBS2pqQixTQUFTLEVBQUVtUCxFQUFFLENBQUNzVixhQUFhLENBQUMsS0FBSyxDQUFDO01BQzdELElBQUl0VixFQUFFLENBQUMrVCxhQUFhLENBQUMsQ0FBQyxLQUFLbGpCLFNBQVMsRUFBRW1QLEVBQUUsQ0FBQ3VWLGFBQWEsQ0FBQyxLQUFLLENBQUM7O01BRTdEO01BQ0EsSUFBSXZWLEVBQUUsQ0FBQ3FRLG9CQUFvQixDQUFDLENBQUMsS0FBS3hmLFNBQVMsRUFBRW1QLEVBQUUsQ0FBQ3FRLG9CQUFvQixDQUFDLENBQUMsQ0FBQytFLElBQUksQ0FBQ25sQixlQUFlLENBQUN1bEIsd0JBQXdCLENBQUM7O01BRXJIO01BQ0EsS0FBSyxJQUFJN1YsUUFBUSxJQUFJSyxFQUFFLENBQUN5QixlQUFlLENBQUNuRCxLQUFLLENBQUMsRUFBRTtRQUM5Q1ksU0FBUyxDQUFDeEgsSUFBSSxDQUFDaUksUUFBUSxDQUFDO01BQzFCOztNQUVBO01BQ0EsSUFBSUssRUFBRSxDQUFDVyxRQUFRLENBQUMsQ0FBQyxLQUFLOVAsU0FBUyxJQUFJbVAsRUFBRSxDQUFDNkYsbUJBQW1CLENBQUMsQ0FBQyxLQUFLaFYsU0FBUyxJQUFJbVAsRUFBRSxDQUFDcVEsb0JBQW9CLENBQUMsQ0FBQyxLQUFLeGYsU0FBUyxFQUFFO1FBQ3BIbVAsRUFBRSxDQUFDVyxRQUFRLENBQUMsQ0FBQyxDQUFDdEMsTUFBTSxDQUFDLENBQUMsQ0FBQ3ZHLE1BQU0sQ0FBQ2tJLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUN4RyxPQUFPLENBQUNtSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7TUFDdEU7SUFDRjs7SUFFQSxPQUFPZCxTQUFTO0VBQ2xCOztFQUVBLE1BQWdCb0IsYUFBYUEsQ0FBQ2hDLEtBQUssRUFBRTs7SUFFbkM7SUFDQSxJQUFJaUksT0FBTyxHQUFHLElBQUl0RixHQUFHLENBQUMsQ0FBQztJQUN2QixJQUFJM0MsS0FBSyxDQUFDdEIsZUFBZSxDQUFDLENBQUMsS0FBS25NLFNBQVMsRUFBRTtNQUN6QyxJQUFJNE0saUJBQWlCLEdBQUcsSUFBSWlDLEdBQUcsQ0FBQyxDQUFDO01BQ2pDLElBQUlwQixLQUFLLENBQUNxVyxrQkFBa0IsQ0FBQyxDQUFDLEtBQUs5akIsU0FBUyxFQUFFNE0saUJBQWlCLENBQUNvQyxHQUFHLENBQUN2QixLQUFLLENBQUNxVyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7TUFDL0YsSUFBSXJXLEtBQUssQ0FBQzJGLG9CQUFvQixDQUFDLENBQUMsS0FBS3BULFNBQVMsRUFBRXlOLEtBQUssQ0FBQzJGLG9CQUFvQixDQUFDLENBQUMsQ0FBQ3pCLEdBQUcsQ0FBQyxDQUFBaE0sYUFBYSxLQUFJaUgsaUJBQWlCLENBQUNvQyxHQUFHLENBQUNySixhQUFhLENBQUMsQ0FBQztNQUN2SStQLE9BQU8sQ0FBQ3ZXLEdBQUcsQ0FBQ3NPLEtBQUssQ0FBQ3RCLGVBQWUsQ0FBQyxDQUFDLEVBQUVTLGlCQUFpQixDQUFDbVgsSUFBSSxHQUFHeE4sS0FBSyxDQUFDeU4sSUFBSSxDQUFDcFgsaUJBQWlCLENBQUMsR0FBRzVNLFNBQVMsQ0FBQyxDQUFDLENBQUU7SUFDN0csQ0FBQyxNQUFNO01BQ0w0RixlQUFNLENBQUNDLEtBQUssQ0FBQzRILEtBQUssQ0FBQ3FXLGtCQUFrQixDQUFDLENBQUMsRUFBRTlqQixTQUFTLEVBQUUsNkRBQTZELENBQUM7TUFDbEgsSUFBQTRGLGVBQU0sRUFBQzZILEtBQUssQ0FBQzJGLG9CQUFvQixDQUFDLENBQUMsS0FBS3BULFNBQVMsSUFBSXlOLEtBQUssQ0FBQzJGLG9CQUFvQixDQUFDLENBQUMsQ0FBQ3JJLE1BQU0sS0FBSyxDQUFDLEVBQUUsNkRBQTZELENBQUM7TUFDOUoySyxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUM4TSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBRTtJQUM3Qzs7SUFFQTtJQUNBLElBQUl2VCxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSUMsUUFBUSxHQUFHLENBQUMsQ0FBQzs7SUFFakI7SUFDQSxJQUFJdk0sTUFBVyxHQUFHLENBQUMsQ0FBQztJQUNwQkEsTUFBTSxDQUFDaWlCLGFBQWEsR0FBR25YLEtBQUssQ0FBQ29YLFVBQVUsQ0FBQyxDQUFDLEtBQUssSUFBSSxHQUFHLGFBQWEsR0FBR3BYLEtBQUssQ0FBQ29YLFVBQVUsQ0FBQyxDQUFDLEtBQUssS0FBSyxHQUFHLFdBQVcsR0FBRyxLQUFLO0lBQ3ZIbGlCLE1BQU0sQ0FBQ21pQixPQUFPLEdBQUcsSUFBSTtJQUNyQixLQUFLLElBQUlwZixVQUFVLElBQUlnUSxPQUFPLENBQUNDLElBQUksQ0FBQyxDQUFDLEVBQUU7O01BRXJDO01BQ0FoVCxNQUFNLENBQUMwRCxhQUFhLEdBQUdYLFVBQVU7TUFDakMvQyxNQUFNLENBQUNtUixlQUFlLEdBQUc0QixPQUFPLENBQUNsWCxHQUFHLENBQUNrSCxVQUFVLENBQUM7TUFDaEQsSUFBSWEsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0csTUFBTSxDQUFDa0IsU0FBUyxDQUFDLENBQUMsQ0FBQ08sZUFBZSxDQUFDLG9CQUFvQixFQUFFMEIsTUFBTSxDQUFDOztNQUV0RjtNQUNBLElBQUk0RCxJQUFJLENBQUNDLE1BQU0sQ0FBQzZILFNBQVMsS0FBS3JPLFNBQVMsRUFBRTtNQUN6QyxLQUFLLElBQUkra0IsU0FBUyxJQUFJeGUsSUFBSSxDQUFDQyxNQUFNLENBQUM2SCxTQUFTLEVBQUU7UUFDM0MsSUFBSWMsRUFBRSxHQUFHL1AsZUFBZSxDQUFDNGxCLDRCQUE0QixDQUFDRCxTQUFTLENBQUM7UUFDaEUzbEIsZUFBZSxDQUFDZ1EsT0FBTyxDQUFDRCxFQUFFLEVBQUVGLEtBQUssRUFBRUMsUUFBUSxDQUFDO01BQzlDO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJUCxHQUFxQixHQUFHaFEsTUFBTSxDQUFDMmxCLE1BQU0sQ0FBQ3JWLEtBQUssQ0FBQztJQUNoRE4sR0FBRyxDQUFDNFYsSUFBSSxDQUFDbmxCLGVBQWUsQ0FBQ29sQixrQkFBa0IsQ0FBQzs7SUFFNUM7SUFDQSxJQUFJaFYsT0FBTyxHQUFHLEVBQUU7SUFDaEIsS0FBSyxJQUFJTCxFQUFFLElBQUlSLEdBQUcsRUFBRTs7TUFFbEI7TUFDQSxJQUFJUSxFQUFFLENBQUMwQixVQUFVLENBQUMsQ0FBQyxLQUFLN1EsU0FBUyxFQUFFbVAsRUFBRSxDQUFDMEIsVUFBVSxDQUFDLENBQUMsQ0FBQzBULElBQUksQ0FBQ25sQixlQUFlLENBQUM2bEIsY0FBYyxDQUFDOztNQUV2RjtNQUNBLEtBQUssSUFBSXRWLE1BQU0sSUFBSVIsRUFBRSxDQUFDNEIsYUFBYSxDQUFDdEQsS0FBSyxDQUFDLEVBQUUrQixPQUFPLENBQUMzSSxJQUFJLENBQUM4SSxNQUFNLENBQUM7O01BRWhFO01BQ0EsSUFBSVIsRUFBRSxDQUFDMEIsVUFBVSxDQUFDLENBQUMsS0FBSzdRLFNBQVMsSUFBSW1QLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsS0FBSzlQLFNBQVMsRUFBRTtRQUNoRW1QLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUN2RyxNQUFNLENBQUNrSSxFQUFFLENBQUNXLFFBQVEsQ0FBQyxDQUFDLENBQUN0QyxNQUFNLENBQUMsQ0FBQyxDQUFDeEcsT0FBTyxDQUFDbUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO01BQ3RFO0lBQ0Y7SUFDQSxPQUFPSyxPQUFPO0VBQ2hCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQWdCK0Isa0JBQWtCQSxDQUFDTixHQUFHLEVBQUU7SUFDdEMsSUFBSTFLLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQy9HLE1BQU0sQ0FBQ2tCLFNBQVMsQ0FBQyxDQUFDLENBQUNPLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRSxFQUFDZ1EsR0FBRyxFQUFFQSxHQUFHLEVBQUMsQ0FBQztJQUN6RixJQUFJLENBQUMxSyxJQUFJLENBQUNDLE1BQU0sQ0FBQ3lMLGlCQUFpQixFQUFFLE9BQU8sRUFBRTtJQUM3QyxPQUFPMUwsSUFBSSxDQUFDQyxNQUFNLENBQUN5TCxpQkFBaUIsQ0FBQ04sR0FBRyxDQUFDLENBQUF1VCxRQUFRLEtBQUksSUFBSUMsdUJBQWMsQ0FBQ0QsUUFBUSxDQUFDclQsU0FBUyxFQUFFcVQsUUFBUSxDQUFDblQsU0FBUyxDQUFDLENBQUM7RUFDbEg7O0VBRUEsTUFBZ0IrRCxlQUFlQSxDQUFDdFcsTUFBTSxFQUFFOztJQUV0QztJQUNBLElBQUlBLE1BQU0sS0FBS1EsU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQywyQkFBMkIsQ0FBQztJQUM1RSxJQUFJVCxNQUFNLENBQUMyTSxlQUFlLENBQUMsQ0FBQyxLQUFLbk0sU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyw2Q0FBNkMsQ0FBQztJQUNoSCxJQUFJVCxNQUFNLENBQUNnVSxlQUFlLENBQUMsQ0FBQyxLQUFLeFQsU0FBUyxJQUFJUixNQUFNLENBQUNnVSxlQUFlLENBQUMsQ0FBQyxDQUFDekksTUFBTSxJQUFJLENBQUMsRUFBRSxNQUFNLElBQUk5SyxvQkFBVyxDQUFDLGtEQUFrRCxDQUFDO0lBQzdKLElBQUlULE1BQU0sQ0FBQ2dVLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM3TCxVQUFVLENBQUMsQ0FBQyxLQUFLM0gsU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyw4Q0FBOEMsQ0FBQztJQUNqSSxJQUFJVCxNQUFNLENBQUNnVSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDQyxTQUFTLENBQUMsQ0FBQyxLQUFLelQsU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQyx1Q0FBdUMsQ0FBQztJQUN6SCxJQUFJVCxNQUFNLENBQUM4VixXQUFXLENBQUMsQ0FBQyxLQUFLdFYsU0FBUyxFQUFFLE1BQU0sSUFBSUMsb0JBQVcsQ0FBQywwRUFBMEUsQ0FBQztJQUN6SSxJQUFJVCxNQUFNLENBQUM0VCxvQkFBb0IsQ0FBQyxDQUFDLEtBQUtwVCxTQUFTLElBQUlSLE1BQU0sQ0FBQzRULG9CQUFvQixDQUFDLENBQUMsQ0FBQ3JJLE1BQU0sS0FBSyxDQUFDLEVBQUUsTUFBTSxJQUFJOUssb0JBQVcsQ0FBQyxvREFBb0QsQ0FBQztJQUMxSyxJQUFJVCxNQUFNLENBQUNxVyxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJNVYsb0JBQVcsQ0FBQyxtREFBbUQsQ0FBQztJQUMvRyxJQUFJVCxNQUFNLENBQUNvVSxrQkFBa0IsQ0FBQyxDQUFDLEtBQUs1VCxTQUFTLElBQUlSLE1BQU0sQ0FBQ29VLGtCQUFrQixDQUFDLENBQUMsQ0FBQzdJLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxJQUFJOUssb0JBQVcsQ0FBQyxxRUFBcUUsQ0FBQzs7SUFFckw7SUFDQSxJQUFJVCxNQUFNLENBQUM0VCxvQkFBb0IsQ0FBQyxDQUFDLEtBQUtwVCxTQUFTLEVBQUU7TUFDL0NSLE1BQU0sQ0FBQ3lWLG9CQUFvQixDQUFDLEVBQUUsQ0FBQztNQUMvQixLQUFLLElBQUlsTixVQUFVLElBQUksTUFBTSxJQUFJLENBQUNGLGVBQWUsQ0FBQ3JJLE1BQU0sQ0FBQzJNLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUMzRTNNLE1BQU0sQ0FBQzRULG9CQUFvQixDQUFDLENBQUMsQ0FBQ3ZNLElBQUksQ0FBQ2tCLFVBQVUsQ0FBQzRELFFBQVEsQ0FBQyxDQUFDLENBQUM7TUFDM0Q7SUFDRjtJQUNBLElBQUluTSxNQUFNLENBQUM0VCxvQkFBb0IsQ0FBQyxDQUFDLENBQUNySSxNQUFNLEtBQUssQ0FBQyxFQUFFLE1BQU0sSUFBSTlLLG9CQUFXLENBQUMsK0JBQStCLENBQUM7O0lBRXRHO0lBQ0EsSUFBSTBDLE1BQVcsR0FBRyxDQUFDLENBQUM7SUFDcEIsSUFBSXFULEtBQUssR0FBR3hXLE1BQU0sQ0FBQzBULFFBQVEsQ0FBQyxDQUFDLEtBQUssSUFBSTtJQUN0Q3ZRLE1BQU0sQ0FBQzBELGFBQWEsR0FBRzdHLE1BQU0sQ0FBQzJNLGVBQWUsQ0FBQyxDQUFDO0lBQy9DeEosTUFBTSxDQUFDbVIsZUFBZSxHQUFHdFUsTUFBTSxDQUFDNFQsb0JBQW9CLENBQUMsQ0FBQztJQUN0RHpRLE1BQU0sQ0FBQ1csT0FBTyxHQUFHOUQsTUFBTSxDQUFDZ1UsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzdMLFVBQVUsQ0FBQyxDQUFDO0lBQ3pELElBQUEvQixlQUFNLEVBQUNwRyxNQUFNLENBQUMyVSxXQUFXLENBQUMsQ0FBQyxLQUFLblUsU0FBUyxJQUFJUixNQUFNLENBQUMyVSxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSTNVLE1BQU0sQ0FBQzJVLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BHeFIsTUFBTSxDQUFDeVIsUUFBUSxHQUFHNVUsTUFBTSxDQUFDMlUsV0FBVyxDQUFDLENBQUM7SUFDdEMsSUFBSTNVLE1BQU0sQ0FBQ3dVLGFBQWEsQ0FBQyxDQUFDLEtBQUtoVSxTQUFTLEVBQUUyQyxNQUFNLENBQUNzUixXQUFXLEdBQUd6VSxNQUFNLENBQUN3VSxhQUFhLENBQUMsQ0FBQztJQUNyRnJSLE1BQU0sQ0FBQ2dHLFVBQVUsR0FBR25KLE1BQU0sQ0FBQ3VVLFlBQVksQ0FBQyxDQUFDO0lBQ3pDcFIsTUFBTSxDQUFDdVIsWUFBWSxHQUFHLENBQUM4QixLQUFLO0lBQzVCclQsTUFBTSxDQUFDeWlCLFlBQVksR0FBRzVsQixNQUFNLENBQUM2bEIsY0FBYyxDQUFDLENBQUM7SUFDN0MxaUIsTUFBTSxDQUFDNFIsV0FBVyxHQUFHLElBQUk7SUFDekI1UixNQUFNLENBQUMwUixVQUFVLEdBQUcsSUFBSTtJQUN4QjFSLE1BQU0sQ0FBQzJSLGVBQWUsR0FBRyxJQUFJOztJQUU3QjtJQUNBLElBQUkvTixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMvRyxNQUFNLENBQUNrQixTQUFTLENBQUMsQ0FBQyxDQUFDTyxlQUFlLENBQUMsV0FBVyxFQUFFMEIsTUFBTSxDQUFDO0lBQzdFLElBQUk2RCxNQUFNLEdBQUdELElBQUksQ0FBQ0MsTUFBTTs7SUFFeEI7SUFDQSxJQUFJeVAsS0FBSyxHQUFHN1csZUFBZSxDQUFDOFYsd0JBQXdCLENBQUMxTyxNQUFNLEVBQUV4RyxTQUFTLEVBQUVSLE1BQU0sQ0FBQzs7SUFFL0U7SUFDQSxLQUFLLElBQUkyUCxFQUFFLElBQUk4RyxLQUFLLENBQUN6SSxNQUFNLENBQUMsQ0FBQyxFQUFFO01BQzdCMkIsRUFBRSxDQUFDbVcsV0FBVyxDQUFDLElBQUksQ0FBQztNQUNwQm5XLEVBQUUsQ0FBQ29XLGNBQWMsQ0FBQyxLQUFLLENBQUM7TUFDeEJwVyxFQUFFLENBQUM4SixtQkFBbUIsQ0FBQyxDQUFDLENBQUM7TUFDekI5SixFQUFFLENBQUNxVyxRQUFRLENBQUN4UCxLQUFLLENBQUM7TUFDbEI3RyxFQUFFLENBQUNnSCxXQUFXLENBQUNILEtBQUssQ0FBQztNQUNyQjdHLEVBQUUsQ0FBQytHLFlBQVksQ0FBQ0YsS0FBSyxDQUFDO01BQ3RCN0csRUFBRSxDQUFDc1csWUFBWSxDQUFDLEtBQUssQ0FBQztNQUN0QnRXLEVBQUUsQ0FBQ3VXLFdBQVcsQ0FBQyxLQUFLLENBQUM7TUFDckIsSUFBSTVXLFFBQVEsR0FBR0ssRUFBRSxDQUFDNkYsbUJBQW1CLENBQUMsQ0FBQztNQUN2Q2xHLFFBQVEsQ0FBQzdHLGVBQWUsQ0FBQ3pJLE1BQU0sQ0FBQzJNLGVBQWUsQ0FBQyxDQUFDLENBQUM7TUFDbEQsSUFBSTNNLE1BQU0sQ0FBQzRULG9CQUFvQixDQUFDLENBQUMsQ0FBQ3JJLE1BQU0sS0FBSyxDQUFDLEVBQUUrRCxRQUFRLENBQUNtRyxvQkFBb0IsQ0FBQ3pWLE1BQU0sQ0FBQzRULG9CQUFvQixDQUFDLENBQUMsQ0FBQztNQUM1RyxJQUFJRyxXQUFXLEdBQUcsSUFBSW9TLDBCQUFpQixDQUFDbm1CLE1BQU0sQ0FBQ2dVLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM3TCxVQUFVLENBQUMsQ0FBQyxFQUFFNUIsTUFBTSxDQUFDK0ksUUFBUSxDQUFDMkUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQy9HM0UsUUFBUSxDQUFDOFcsZUFBZSxDQUFDLENBQUNyUyxXQUFXLENBQUMsQ0FBQztNQUN2Q3BFLEVBQUUsQ0FBQzBXLG1CQUFtQixDQUFDL1csUUFBUSxDQUFDO01BQ2hDSyxFQUFFLENBQUNqRyxZQUFZLENBQUMxSixNQUFNLENBQUN1VSxZQUFZLENBQUMsQ0FBQyxDQUFDO01BQ3RDLElBQUk1RSxFQUFFLENBQUM2RSxhQUFhLENBQUMsQ0FBQyxLQUFLaFUsU0FBUyxFQUFFbVAsRUFBRSxDQUFDMlcsYUFBYSxDQUFDdG1CLE1BQU0sQ0FBQ3dVLGFBQWEsQ0FBQyxDQUFDLEtBQUtoVSxTQUFTLEdBQUcsQ0FBQyxHQUFHUixNQUFNLENBQUN3VSxhQUFhLENBQUMsQ0FBQyxDQUFDO01BQ3pILElBQUk3RSxFQUFFLENBQUMrRCxRQUFRLENBQUMsQ0FBQyxFQUFFO1FBQ2pCLElBQUkvRCxFQUFFLENBQUM0Vyx1QkFBdUIsQ0FBQyxDQUFDLEtBQUsvbEIsU0FBUyxFQUFFbVAsRUFBRSxDQUFDNlcsdUJBQXVCLENBQUMsQ0FBQyxJQUFJQyxJQUFJLENBQUMsQ0FBQyxDQUFDQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtRQUNwRyxJQUFJL1csRUFBRSxDQUFDZ1gsb0JBQW9CLENBQUMsQ0FBQyxLQUFLbm1CLFNBQVMsRUFBRW1QLEVBQUUsQ0FBQ2lYLG9CQUFvQixDQUFDLEtBQUssQ0FBQztNQUM3RTtJQUNGO0lBQ0EsT0FBT25RLEtBQUssQ0FBQ3pJLE1BQU0sQ0FBQyxDQUFDO0VBQ3ZCOztFQUVVMUcsZ0JBQWdCQSxDQUFBLEVBQUc7SUFDM0IsSUFBSSxJQUFJLENBQUMyRCxZQUFZLElBQUl6SyxTQUFTLElBQUksSUFBSSxDQUFDTCxTQUFTLENBQUNvTCxNQUFNLEVBQUUsSUFBSSxDQUFDTixZQUFZLEdBQUcsSUFBSTRiLFlBQVksQ0FBQyxJQUFJLENBQUM7SUFDdkcsSUFBSSxJQUFJLENBQUM1YixZQUFZLEtBQUt6SyxTQUFTLEVBQUUsSUFBSSxDQUFDeUssWUFBWSxDQUFDNmIsWUFBWSxDQUFDLElBQUksQ0FBQzNtQixTQUFTLENBQUNvTCxNQUFNLEdBQUcsQ0FBQyxDQUFDO0VBQ2hHOztFQUVBO0FBQ0Y7QUFDQTtFQUNFLE1BQWdCaEIsSUFBSUEsQ0FBQSxFQUFHO0lBQ3JCLElBQUksSUFBSSxDQUFDVSxZQUFZLEtBQUt6SyxTQUFTLElBQUksSUFBSSxDQUFDeUssWUFBWSxDQUFDOGIsU0FBUyxFQUFFLE1BQU0sSUFBSSxDQUFDOWIsWUFBWSxDQUFDVixJQUFJLENBQUMsQ0FBQztFQUNwRzs7RUFFQTs7RUFFQSxPQUFpQmtXLGVBQWVBLENBQUNELFdBQTJGLEVBQUV2YixRQUFpQixFQUFFNUQsUUFBaUIsRUFBc0I7SUFDdEwsSUFBSXJCLE1BQStDLEdBQUdRLFNBQVM7SUFDL0QsSUFBSSxPQUFPZ2dCLFdBQVcsS0FBSyxRQUFRLElBQUtBLFdBQVcsQ0FBa0NsRSxHQUFHLEVBQUV0YyxNQUFNLEdBQUcsSUFBSXNCLDJCQUFrQixDQUFDLEVBQUMwbEIsTUFBTSxFQUFFLElBQUlsaUIsNEJBQW1CLENBQUMwYixXQUFXLEVBQTJDdmIsUUFBUSxFQUFFNUQsUUFBUSxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ2xPLElBQUlWLGlCQUFRLENBQUNxVyxPQUFPLENBQUN3SixXQUFXLENBQUMsRUFBRXhnQixNQUFNLEdBQUcsSUFBSXNCLDJCQUFrQixDQUFDLEVBQUNvZixHQUFHLEVBQUVGLFdBQXVCLEVBQUMsQ0FBQyxDQUFDO0lBQ25HeGdCLE1BQU0sR0FBRyxJQUFJc0IsMkJBQWtCLENBQUNrZixXQUEwQyxDQUFDO0lBQ2hGLElBQUl4Z0IsTUFBTSxDQUFDaW5CLGFBQWEsS0FBS3ptQixTQUFTLEVBQUVSLE1BQU0sQ0FBQ2luQixhQUFhLEdBQUcsSUFBSTtJQUNuRSxPQUFPam5CLE1BQU07RUFDZjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQWlCaVAsZUFBZUEsQ0FBQ2hCLEtBQUssRUFBRTtJQUN0Q0EsS0FBSyxDQUFDZ1gsYUFBYSxDQUFDemtCLFNBQVMsQ0FBQztJQUM5QnlOLEtBQUssQ0FBQ2lYLGFBQWEsQ0FBQzFrQixTQUFTLENBQUM7SUFDOUJ5TixLQUFLLENBQUNTLGdCQUFnQixDQUFDbE8sU0FBUyxDQUFDO0lBQ2pDeU4sS0FBSyxDQUFDVSxhQUFhLENBQUNuTyxTQUFTLENBQUM7SUFDOUJ5TixLQUFLLENBQUNXLGNBQWMsQ0FBQ3BPLFNBQVMsQ0FBQztJQUMvQixPQUFPeU4sS0FBSztFQUNkOztFQUVBLE9BQWlCaUQsWUFBWUEsQ0FBQ2pELEtBQUssRUFBRTtJQUNuQyxJQUFJLENBQUNBLEtBQUssRUFBRSxPQUFPLEtBQUs7SUFDeEIsSUFBSSxDQUFDQSxLQUFLLENBQUNrRCxVQUFVLENBQUMsQ0FBQyxFQUFFLE9BQU8sS0FBSztJQUNyQyxJQUFJbEQsS0FBSyxDQUFDa0QsVUFBVSxDQUFDLENBQUMsQ0FBQ3NTLGFBQWEsQ0FBQyxDQUFDLEtBQUtqakIsU0FBUyxFQUFFLE9BQU8sSUFBSSxDQUFDLENBQUM7SUFDbkUsSUFBSXlOLEtBQUssQ0FBQ2tELFVBQVUsQ0FBQyxDQUFDLENBQUN1UyxhQUFhLENBQUMsQ0FBQyxLQUFLbGpCLFNBQVMsRUFBRSxPQUFPLElBQUk7SUFDakUsSUFBSXlOLEtBQUssWUFBWWMsNEJBQW1CLEVBQUU7TUFDeEMsSUFBSWQsS0FBSyxDQUFDa0QsVUFBVSxDQUFDLENBQUMsQ0FBQzFDLGNBQWMsQ0FBQyxDQUFDLEtBQUtqTyxTQUFTLEVBQUUsT0FBTyxJQUFJLENBQUMsQ0FBQztJQUN0RSxDQUFDLE1BQU0sSUFBSXlOLEtBQUssWUFBWThCLDBCQUFpQixFQUFFO01BQzdDLElBQUk5QixLQUFLLENBQUNrRCxVQUFVLENBQUMsQ0FBQyxDQUFDOUMsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLN04sU0FBUyxFQUFFLE9BQU8sSUFBSSxDQUFDLENBQUM7SUFDeEUsQ0FBQyxNQUFNO01BQ0wsTUFBTSxJQUFJQyxvQkFBVyxDQUFDLG9DQUFvQyxDQUFDO0lBQzdEO0lBQ0EsT0FBTyxLQUFLO0VBQ2Q7O0VBRUEsT0FBaUJ3TCxpQkFBaUJBLENBQUNGLFVBQVUsRUFBRTtJQUM3QyxJQUFJdEYsT0FBTyxHQUFHLElBQUl5RyxzQkFBYSxDQUFDLENBQUM7SUFDakMsS0FBSyxJQUFJNU4sR0FBRyxJQUFJSCxNQUFNLENBQUNnWCxJQUFJLENBQUNwSyxVQUFVLENBQUMsRUFBRTtNQUN2QyxJQUFJK1EsR0FBRyxHQUFHL1EsVUFBVSxDQUFDek0sR0FBRyxDQUFDO01BQ3pCLElBQUlBLEdBQUcsS0FBSyxlQUFlLEVBQUVtSCxPQUFPLENBQUNtQyxRQUFRLENBQUNrVSxHQUFHLENBQUMsQ0FBQztNQUM5QyxJQUFJeGQsR0FBRyxLQUFLLFNBQVMsRUFBRW1ILE9BQU8sQ0FBQzJGLFVBQVUsQ0FBQzdGLE1BQU0sQ0FBQ3VXLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDdkQsSUFBSXhkLEdBQUcsS0FBSyxrQkFBa0IsRUFBRW1ILE9BQU8sQ0FBQzRGLGtCQUFrQixDQUFDOUYsTUFBTSxDQUFDdVcsR0FBRyxDQUFDLENBQUMsQ0FBQztNQUN4RSxJQUFJeGQsR0FBRyxLQUFLLGNBQWMsRUFBRW1ILE9BQU8sQ0FBQ3lnQixpQkFBaUIsQ0FBQ3BLLEdBQUcsQ0FBQyxDQUFDO01BQzNELElBQUl4ZCxHQUFHLEtBQUssS0FBSyxFQUFFbUgsT0FBTyxDQUFDMGdCLE1BQU0sQ0FBQ3JLLEdBQUcsQ0FBQyxDQUFDO01BQ3ZDLElBQUl4ZCxHQUFHLEtBQUssT0FBTyxFQUFFLENBQUUsQ0FBQyxDQUFDO01BQUEsS0FDekJrUixPQUFPLENBQUNpUixHQUFHLENBQUMsOENBQThDLEdBQUduaUIsR0FBRyxHQUFHLElBQUksR0FBR3dkLEdBQUcsQ0FBQztJQUNyRjtJQUNBLElBQUksRUFBRSxLQUFLclcsT0FBTyxDQUFDMmdCLE1BQU0sQ0FBQyxDQUFDLEVBQUUzZ0IsT0FBTyxDQUFDMGdCLE1BQU0sQ0FBQzNtQixTQUFTLENBQUM7SUFDdEQsT0FBT2lHLE9BQU87RUFDaEI7O0VBRUEsT0FBaUJpRyxvQkFBb0JBLENBQUNELGFBQWEsRUFBRTtJQUNuRCxJQUFJbEUsVUFBVSxHQUFHLElBQUlDLHlCQUFnQixDQUFDLENBQUM7SUFDdkMsS0FBSyxJQUFJbEosR0FBRyxJQUFJSCxNQUFNLENBQUNnWCxJQUFJLENBQUMxSixhQUFhLENBQUMsRUFBRTtNQUMxQyxJQUFJcVEsR0FBRyxHQUFHclEsYUFBYSxDQUFDbk4sR0FBRyxDQUFDO01BQzVCLElBQUlBLEdBQUcsS0FBSyxlQUFlLEVBQUVpSixVQUFVLENBQUNFLGVBQWUsQ0FBQ3FVLEdBQUcsQ0FBQyxDQUFDO01BQ3hELElBQUl4ZCxHQUFHLEtBQUssZUFBZSxFQUFFaUosVUFBVSxDQUFDSyxRQUFRLENBQUNrVSxHQUFHLENBQUMsQ0FBQztNQUN0RCxJQUFJeGQsR0FBRyxLQUFLLFNBQVMsRUFBRWlKLFVBQVUsQ0FBQ3FGLFVBQVUsQ0FBQ2tQLEdBQUcsQ0FBQyxDQUFDO01BQ2xELElBQUl4ZCxHQUFHLEtBQUssU0FBUyxFQUFFaUosVUFBVSxDQUFDNkQsVUFBVSxDQUFDN0YsTUFBTSxDQUFDdVcsR0FBRyxDQUFDLENBQUMsQ0FBQztNQUMxRCxJQUFJeGQsR0FBRyxLQUFLLGtCQUFrQixFQUFFaUosVUFBVSxDQUFDOEQsa0JBQWtCLENBQUM5RixNQUFNLENBQUN1VyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQzNFLElBQUl4ZCxHQUFHLEtBQUsscUJBQXFCLEVBQUVpSixVQUFVLENBQUMrRCxvQkFBb0IsQ0FBQ3dRLEdBQUcsQ0FBQyxDQUFDO01BQ3hFLElBQUl4ZCxHQUFHLEtBQUssT0FBTyxFQUFFLENBQUUsSUFBSXdkLEdBQUcsRUFBRXZVLFVBQVUsQ0FBQ3NGLFFBQVEsQ0FBQ2lQLEdBQUcsQ0FBQyxDQUFFLENBQUM7TUFDM0QsSUFBSXhkLEdBQUcsS0FBSyxNQUFNLEVBQUVpSixVQUFVLENBQUN1RixTQUFTLENBQUNnUCxHQUFHLENBQUMsQ0FBQztNQUM5QyxJQUFJeGQsR0FBRyxLQUFLLGtCQUFrQixFQUFFaUosVUFBVSxDQUFDZ0Usb0JBQW9CLENBQUN1USxHQUFHLENBQUMsQ0FBQztNQUNyRSxJQUFJeGQsR0FBRyxJQUFJLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFFO01BQUEsS0FDakNrUixPQUFPLENBQUNpUixHQUFHLENBQUMsaURBQWlELEdBQUduaUIsR0FBRyxHQUFHLElBQUksR0FBR3dkLEdBQUcsQ0FBQztJQUN4RjtJQUNBLE9BQU92VSxVQUFVO0VBQ25COztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBaUJnTixnQkFBZ0JBLENBQUN2VixNQUFNLEVBQUUyUCxFQUFFLEVBQUV5RixnQkFBZ0IsRUFBRTtJQUM5RCxJQUFJLENBQUN6RixFQUFFLEVBQUVBLEVBQUUsR0FBRyxJQUFJMkYsdUJBQWMsQ0FBQyxDQUFDO0lBQ2xDLElBQUlrQixLQUFLLEdBQUd4VyxNQUFNLENBQUMwVCxRQUFRLENBQUMsQ0FBQyxLQUFLLElBQUk7SUFDdEMvRCxFQUFFLENBQUN1VixhQUFhLENBQUMsSUFBSSxDQUFDO0lBQ3RCdlYsRUFBRSxDQUFDb1csY0FBYyxDQUFDLEtBQUssQ0FBQztJQUN4QnBXLEVBQUUsQ0FBQzhKLG1CQUFtQixDQUFDLENBQUMsQ0FBQztJQUN6QjlKLEVBQUUsQ0FBQ2dILFdBQVcsQ0FBQ0gsS0FBSyxDQUFDO0lBQ3JCN0csRUFBRSxDQUFDcVcsUUFBUSxDQUFDeFAsS0FBSyxDQUFDO0lBQ2xCN0csRUFBRSxDQUFDK0csWUFBWSxDQUFDRixLQUFLLENBQUM7SUFDdEI3RyxFQUFFLENBQUNzVyxZQUFZLENBQUMsS0FBSyxDQUFDO0lBQ3RCdFcsRUFBRSxDQUFDdVcsV0FBVyxDQUFDLEtBQUssQ0FBQztJQUNyQnZXLEVBQUUsQ0FBQ21XLFdBQVcsQ0FBQyxJQUFJLENBQUM7SUFDcEJuVyxFQUFFLENBQUMwWCxXQUFXLENBQUNDLG9CQUFXLENBQUNDLFNBQVMsQ0FBQztJQUNyQyxJQUFJalksUUFBUSxHQUFHLElBQUlrWSwrQkFBc0IsQ0FBQyxDQUFDO0lBQzNDbFksUUFBUSxDQUFDbVksS0FBSyxDQUFDOVgsRUFBRSxDQUFDO0lBQ2xCLElBQUkzUCxNQUFNLENBQUM0VCxvQkFBb0IsQ0FBQyxDQUFDLElBQUk1VCxNQUFNLENBQUM0VCxvQkFBb0IsQ0FBQyxDQUFDLENBQUNySSxNQUFNLEtBQUssQ0FBQyxFQUFFK0QsUUFBUSxDQUFDbUcsb0JBQW9CLENBQUN6VixNQUFNLENBQUM0VCxvQkFBb0IsQ0FBQyxDQUFDLENBQUNDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEosSUFBSXVCLGdCQUFnQixFQUFFO01BQ3BCLElBQUlzUyxVQUFVLEdBQUcsRUFBRTtNQUNuQixLQUFLLElBQUlDLElBQUksSUFBSTNuQixNQUFNLENBQUNnVSxlQUFlLENBQUMsQ0FBQyxFQUFFMFQsVUFBVSxDQUFDcmdCLElBQUksQ0FBQ3NnQixJQUFJLENBQUN6WSxJQUFJLENBQUMsQ0FBQyxDQUFDO01BQ3ZFSSxRQUFRLENBQUM4VyxlQUFlLENBQUNzQixVQUFVLENBQUM7SUFDdEM7SUFDQS9YLEVBQUUsQ0FBQzBXLG1CQUFtQixDQUFDL1csUUFBUSxDQUFDO0lBQ2hDSyxFQUFFLENBQUNqRyxZQUFZLENBQUMxSixNQUFNLENBQUN1VSxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLElBQUk1RSxFQUFFLENBQUM2RSxhQUFhLENBQUMsQ0FBQyxLQUFLaFUsU0FBUyxFQUFFbVAsRUFBRSxDQUFDMlcsYUFBYSxDQUFDdG1CLE1BQU0sQ0FBQ3dVLGFBQWEsQ0FBQyxDQUFDLEtBQUtoVSxTQUFTLEdBQUcsQ0FBQyxHQUFHUixNQUFNLENBQUN3VSxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBQ3pILElBQUl4VSxNQUFNLENBQUMwVCxRQUFRLENBQUMsQ0FBQyxFQUFFO01BQ3JCLElBQUkvRCxFQUFFLENBQUM0Vyx1QkFBdUIsQ0FBQyxDQUFDLEtBQUsvbEIsU0FBUyxFQUFFbVAsRUFBRSxDQUFDNlcsdUJBQXVCLENBQUMsQ0FBQyxJQUFJQyxJQUFJLENBQUMsQ0FBQyxDQUFDQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtNQUNwRyxJQUFJL1csRUFBRSxDQUFDZ1gsb0JBQW9CLENBQUMsQ0FBQyxLQUFLbm1CLFNBQVMsRUFBRW1QLEVBQUUsQ0FBQ2lYLG9CQUFvQixDQUFDLEtBQUssQ0FBQztJQUM3RTtJQUNBLE9BQU9qWCxFQUFFO0VBQ1g7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFpQmlZLGVBQWVBLENBQUNDLE1BQU0sRUFBRTtJQUN2QyxJQUFJcFIsS0FBSyxHQUFHLElBQUlxUixvQkFBVyxDQUFDLENBQUM7SUFDN0JyUixLQUFLLENBQUNzUixnQkFBZ0IsQ0FBQ0YsTUFBTSxDQUFDcFEsY0FBYyxDQUFDO0lBQzdDaEIsS0FBSyxDQUFDdVIsZ0JBQWdCLENBQUNILE1BQU0sQ0FBQ3RRLGNBQWMsQ0FBQztJQUM3Q2QsS0FBSyxDQUFDd1IsY0FBYyxDQUFDSixNQUFNLENBQUNLLFlBQVksQ0FBQztJQUN6QyxJQUFJelIsS0FBSyxDQUFDaUIsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLbFgsU0FBUyxJQUFJaVcsS0FBSyxDQUFDaUIsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDbk0sTUFBTSxLQUFLLENBQUMsRUFBRWtMLEtBQUssQ0FBQ3NSLGdCQUFnQixDQUFDdm5CLFNBQVMsQ0FBQztJQUN0SCxJQUFJaVcsS0FBSyxDQUFDZSxnQkFBZ0IsQ0FBQyxDQUFDLEtBQUtoWCxTQUFTLElBQUlpVyxLQUFLLENBQUNlLGdCQUFnQixDQUFDLENBQUMsQ0FBQ2pNLE1BQU0sS0FBSyxDQUFDLEVBQUVrTCxLQUFLLENBQUN1UixnQkFBZ0IsQ0FBQ3huQixTQUFTLENBQUM7SUFDdEgsSUFBSWlXLEtBQUssQ0FBQzBSLGNBQWMsQ0FBQyxDQUFDLEtBQUszbkIsU0FBUyxJQUFJaVcsS0FBSyxDQUFDMFIsY0FBYyxDQUFDLENBQUMsQ0FBQzVjLE1BQU0sS0FBSyxDQUFDLEVBQUVrTCxLQUFLLENBQUN3UixjQUFjLENBQUN6bkIsU0FBUyxDQUFDO0lBQ2hILE9BQU9pVyxLQUFLO0VBQ2Q7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQWlCZix3QkFBd0JBLENBQUMwUyxNQUFXLEVBQUVqWixHQUFTLEVBQUVuUCxNQUFZLEVBQUU7O0lBRTlFO0lBQ0EsSUFBSXlXLEtBQUssR0FBRzdXLGVBQWUsQ0FBQ2dvQixlQUFlLENBQUNRLE1BQU0sQ0FBQzs7SUFFbkQ7SUFDQSxJQUFJblQsTUFBTSxHQUFHbVQsTUFBTSxDQUFDbFQsUUFBUSxHQUFHa1QsTUFBTSxDQUFDbFQsUUFBUSxDQUFDM0osTUFBTSxHQUFHNmMsTUFBTSxDQUFDbFEsWUFBWSxHQUFHa1EsTUFBTSxDQUFDbFEsWUFBWSxDQUFDM00sTUFBTSxHQUFHLENBQUM7O0lBRTVHO0lBQ0EsSUFBSTBKLE1BQU0sS0FBSyxDQUFDLEVBQUU7TUFDaEI3TyxlQUFNLENBQUNDLEtBQUssQ0FBQzhJLEdBQUcsRUFBRTNPLFNBQVMsQ0FBQztNQUM1QixPQUFPaVcsS0FBSztJQUNkOztJQUVBO0lBQ0EsSUFBSXRILEdBQUcsRUFBRXNILEtBQUssQ0FBQzRSLE1BQU0sQ0FBQ2xaLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCO01BQ0hBLEdBQUcsR0FBRyxFQUFFO01BQ1IsS0FBSyxJQUFJa0csQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHSixNQUFNLEVBQUVJLENBQUMsRUFBRSxFQUFFbEcsR0FBRyxDQUFDOUgsSUFBSSxDQUFDLElBQUlpTyx1QkFBYyxDQUFDLENBQUMsQ0FBQztJQUNqRTtJQUNBLEtBQUssSUFBSTNGLEVBQUUsSUFBSVIsR0FBRyxFQUFFO01BQ2xCUSxFQUFFLENBQUMyWSxRQUFRLENBQUM3UixLQUFLLENBQUM7TUFDbEI5RyxFQUFFLENBQUN1VixhQUFhLENBQUMsSUFBSSxDQUFDO0lBQ3hCO0lBQ0F6TyxLQUFLLENBQUM0UixNQUFNLENBQUNsWixHQUFHLENBQUM7O0lBRWpCO0lBQ0EsS0FBSyxJQUFJN1AsR0FBRyxJQUFJSCxNQUFNLENBQUNnWCxJQUFJLENBQUNpUyxNQUFNLENBQUMsRUFBRTtNQUNuQyxJQUFJdEwsR0FBRyxHQUFHc0wsTUFBTSxDQUFDOW9CLEdBQUcsQ0FBQztNQUNyQixJQUFJQSxHQUFHLEtBQUssY0FBYyxFQUFFLEtBQUssSUFBSStWLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR3lILEdBQUcsQ0FBQ3ZSLE1BQU0sRUFBRThKLENBQUMsRUFBRSxFQUFFbEcsR0FBRyxDQUFDa0csQ0FBQyxDQUFDLENBQUNrVCxPQUFPLENBQUN6TCxHQUFHLENBQUN6SCxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ25GLElBQUkvVixHQUFHLEtBQUssYUFBYSxFQUFFLEtBQUssSUFBSStWLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR3lILEdBQUcsQ0FBQ3ZSLE1BQU0sRUFBRThKLENBQUMsRUFBRSxFQUFFbEcsR0FBRyxDQUFDa0csQ0FBQyxDQUFDLENBQUNtVCxNQUFNLENBQUMxTCxHQUFHLENBQUN6SCxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3RGLElBQUkvVixHQUFHLEtBQUssY0FBYyxFQUFFLEtBQUssSUFBSStWLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR3lILEdBQUcsQ0FBQ3ZSLE1BQU0sRUFBRThKLENBQUMsRUFBRSxFQUFFbEcsR0FBRyxDQUFDa0csQ0FBQyxDQUFDLENBQUNvVCxVQUFVLENBQUMzTCxHQUFHLENBQUN6SCxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQzNGLElBQUkvVixHQUFHLEtBQUssa0JBQWtCLEVBQUUsS0FBSyxJQUFJK1YsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHeUgsR0FBRyxDQUFDdlIsTUFBTSxFQUFFOEosQ0FBQyxFQUFFLEVBQUVsRyxHQUFHLENBQUNrRyxDQUFDLENBQUMsQ0FBQ3FULFdBQVcsQ0FBQzVMLEdBQUcsQ0FBQ3pILENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDaEcsSUFBSS9WLEdBQUcsS0FBSyxVQUFVLEVBQUUsS0FBSyxJQUFJK1YsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHeUgsR0FBRyxDQUFDdlIsTUFBTSxFQUFFOEosQ0FBQyxFQUFFLEVBQUVsRyxHQUFHLENBQUNrRyxDQUFDLENBQUMsQ0FBQ3NULE1BQU0sQ0FBQ3BpQixNQUFNLENBQUN1VyxHQUFHLENBQUN6SCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDM0YsSUFBSS9WLEdBQUcsS0FBSyxhQUFhLEVBQUUsS0FBSyxJQUFJK1YsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHeUgsR0FBRyxDQUFDdlIsTUFBTSxFQUFFOEosQ0FBQyxFQUFFLEVBQUVsRyxHQUFHLENBQUNrRyxDQUFDLENBQUMsQ0FBQ3VULFNBQVMsQ0FBQzlMLEdBQUcsQ0FBQ3pILENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDekYsSUFBSS9WLEdBQUcsS0FBSyxhQUFhLEVBQUU7UUFDOUIsS0FBSyxJQUFJK1YsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHeUgsR0FBRyxDQUFDdlIsTUFBTSxFQUFFOEosQ0FBQyxFQUFFLEVBQUU7VUFDbkMsSUFBSWxHLEdBQUcsQ0FBQ2tHLENBQUMsQ0FBQyxDQUFDRyxtQkFBbUIsQ0FBQyxDQUFDLElBQUloVixTQUFTLEVBQUUyTyxHQUFHLENBQUNrRyxDQUFDLENBQUMsQ0FBQ2dSLG1CQUFtQixDQUFDLElBQUltQiwrQkFBc0IsQ0FBQyxDQUFDLENBQUNDLEtBQUssQ0FBQ3RZLEdBQUcsQ0FBQ2tHLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDckhsRyxHQUFHLENBQUNrRyxDQUFDLENBQUMsQ0FBQ0csbUJBQW1CLENBQUMsQ0FBQyxDQUFDTyxTQUFTLENBQUN4UCxNQUFNLENBQUN1VyxHQUFHLENBQUN6SCxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hEO01BQ0YsQ0FBQztNQUNJLElBQUkvVixHQUFHLEtBQUssZ0JBQWdCLElBQUlBLEdBQUcsS0FBSyxnQkFBZ0IsSUFBSUEsR0FBRyxLQUFLLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztNQUFBLEtBQ3ZGLElBQUlBLEdBQUcsS0FBSyx1QkFBdUIsRUFBRTtRQUN4QyxJQUFJdXBCLGtCQUFrQixHQUFHL0wsR0FBRztRQUM1QixLQUFLLElBQUl6SCxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUd3VCxrQkFBa0IsQ0FBQ3RkLE1BQU0sRUFBRThKLENBQUMsRUFBRSxFQUFFO1VBQ2xEMVUsaUJBQVEsQ0FBQ21vQixVQUFVLENBQUMzWixHQUFHLENBQUNrRyxDQUFDLENBQUMsQ0FBQzBULFNBQVMsQ0FBQyxDQUFDLEtBQUt2b0IsU0FBUyxDQUFDO1VBQ3JEMk8sR0FBRyxDQUFDa0csQ0FBQyxDQUFDLENBQUMyVCxTQUFTLENBQUMsRUFBRSxDQUFDO1VBQ3BCLEtBQUssSUFBSUMsYUFBYSxJQUFJSixrQkFBa0IsQ0FBQ3hULENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxFQUFFO1lBQzdEbEcsR0FBRyxDQUFDa0csQ0FBQyxDQUFDLENBQUMwVCxTQUFTLENBQUMsQ0FBQyxDQUFDMWhCLElBQUksQ0FBQyxJQUFJNmhCLDJCQUFrQixDQUFDLENBQUMsQ0FBQ0MsV0FBVyxDQUFDLElBQUl4RCx1QkFBYyxDQUFDLENBQUMsQ0FBQ3lELE1BQU0sQ0FBQ0gsYUFBYSxDQUFDLENBQUMsQ0FBQ3hCLEtBQUssQ0FBQ3RZLEdBQUcsQ0FBQ2tHLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDekg7UUFDRjtNQUNGLENBQUM7TUFDSSxJQUFJL1YsR0FBRyxLQUFLLHNCQUFzQixFQUFFO1FBQ3ZDLElBQUkrcEIsaUJBQWlCLEdBQUd2TSxHQUFHO1FBQzNCLElBQUl3TSxjQUFjLEdBQUcsQ0FBQztRQUN0QixLQUFLLElBQUlDLEtBQUssR0FBRyxDQUFDLEVBQUVBLEtBQUssR0FBR0YsaUJBQWlCLENBQUM5ZCxNQUFNLEVBQUVnZSxLQUFLLEVBQUUsRUFBRTtVQUM3RCxJQUFJQyxhQUFhLEdBQUdILGlCQUFpQixDQUFDRSxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUM7VUFDdkQsSUFBSXBhLEdBQUcsQ0FBQ29hLEtBQUssQ0FBQyxDQUFDL1QsbUJBQW1CLENBQUMsQ0FBQyxLQUFLaFYsU0FBUyxFQUFFMk8sR0FBRyxDQUFDb2EsS0FBSyxDQUFDLENBQUNsRCxtQkFBbUIsQ0FBQyxJQUFJbUIsK0JBQXNCLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUN0WSxHQUFHLENBQUNvYSxLQUFLLENBQUMsQ0FBQyxDQUFDO1VBQ2xJcGEsR0FBRyxDQUFDb2EsS0FBSyxDQUFDLENBQUMvVCxtQkFBbUIsQ0FBQyxDQUFDLENBQUM0USxlQUFlLENBQUMsRUFBRSxDQUFDO1VBQ3BELEtBQUssSUFBSWxTLE1BQU0sSUFBSXNWLGFBQWEsRUFBRTtZQUNoQyxJQUFJeHBCLE1BQU0sQ0FBQ2dVLGVBQWUsQ0FBQyxDQUFDLENBQUN6SSxNQUFNLEtBQUssQ0FBQyxFQUFFNEQsR0FBRyxDQUFDb2EsS0FBSyxDQUFDLENBQUMvVCxtQkFBbUIsQ0FBQyxDQUFDLENBQUN4QixlQUFlLENBQUMsQ0FBQyxDQUFDM00sSUFBSSxDQUFDLElBQUk4ZSwwQkFBaUIsQ0FBQ25tQixNQUFNLENBQUNnVSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDN0wsVUFBVSxDQUFDLENBQUMsRUFBRTVCLE1BQU0sQ0FBQzJOLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUEsS0FDaEwvRSxHQUFHLENBQUNvYSxLQUFLLENBQUMsQ0FBQy9ULG1CQUFtQixDQUFDLENBQUMsQ0FBQ3hCLGVBQWUsQ0FBQyxDQUFDLENBQUMzTSxJQUFJLENBQUMsSUFBSThlLDBCQUFpQixDQUFDbm1CLE1BQU0sQ0FBQ2dVLGVBQWUsQ0FBQyxDQUFDLENBQUNzVixjQUFjLEVBQUUsQ0FBQyxDQUFDbmhCLFVBQVUsQ0FBQyxDQUFDLEVBQUU1QixNQUFNLENBQUMyTixNQUFNLENBQUMsQ0FBQyxDQUFDO1VBQzlKO1FBQ0Y7TUFDRixDQUFDO01BQ0kxRCxPQUFPLENBQUNpUixHQUFHLENBQUMsa0RBQWtELEdBQUduaUIsR0FBRyxHQUFHLElBQUksR0FBR3dkLEdBQUcsQ0FBQztJQUN6Rjs7SUFFQSxPQUFPckcsS0FBSztFQUNkOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQWlCZCxtQkFBbUJBLENBQUM4TyxLQUFLLEVBQUU5VSxFQUFFLEVBQUU4WixVQUFVLEVBQUV6cEIsTUFBTSxFQUFFO0lBQ2xFLElBQUl5VyxLQUFLLEdBQUc3VyxlQUFlLENBQUNnb0IsZUFBZSxDQUFDbkQsS0FBSyxDQUFDO0lBQ2xEaE8sS0FBSyxDQUFDNFIsTUFBTSxDQUFDLENBQUN6b0IsZUFBZSxDQUFDOGtCLHdCQUF3QixDQUFDRCxLQUFLLEVBQUU5VSxFQUFFLEVBQUU4WixVQUFVLEVBQUV6cEIsTUFBTSxDQUFDLENBQUNzb0IsUUFBUSxDQUFDN1IsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUN2RyxPQUFPQSxLQUFLO0VBQ2Q7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBaUJpTyx3QkFBd0JBLENBQUNELEtBQVUsRUFBRTlVLEVBQVEsRUFBRThaLFVBQWdCLEVBQUV6cEIsTUFBWSxFQUFFLENBQUc7O0lBRWpHO0lBQ0EsSUFBSSxDQUFDMlAsRUFBRSxFQUFFQSxFQUFFLEdBQUcsSUFBSTJGLHVCQUFjLENBQUMsQ0FBQzs7SUFFbEM7SUFDQSxJQUFJbVAsS0FBSyxDQUFDaUYsSUFBSSxLQUFLbHBCLFNBQVMsRUFBRWlwQixVQUFVLEdBQUc3cEIsZUFBZSxDQUFDK3BCLGFBQWEsQ0FBQ2xGLEtBQUssQ0FBQ2lGLElBQUksRUFBRS9aLEVBQUUsQ0FBQyxDQUFDO0lBQ3BGdkosZUFBTSxDQUFDQyxLQUFLLENBQUMsT0FBT29qQixVQUFVLEVBQUUsU0FBUyxFQUFFLDJFQUEyRSxDQUFDOztJQUU1SDtJQUNBO0lBQ0EsSUFBSUcsTUFBTTtJQUNWLElBQUl0YSxRQUFRO0lBQ1osS0FBSyxJQUFJaFEsR0FBRyxJQUFJSCxNQUFNLENBQUNnWCxJQUFJLENBQUNzTyxLQUFLLENBQUMsRUFBRTtNQUNsQyxJQUFJM0gsR0FBRyxHQUFHMkgsS0FBSyxDQUFDbmxCLEdBQUcsQ0FBQztNQUNwQixJQUFJQSxHQUFHLEtBQUssTUFBTSxFQUFFcVEsRUFBRSxDQUFDNFksT0FBTyxDQUFDekwsR0FBRyxDQUFDLENBQUM7TUFDL0IsSUFBSXhkLEdBQUcsS0FBSyxTQUFTLEVBQUVxUSxFQUFFLENBQUM0WSxPQUFPLENBQUN6TCxHQUFHLENBQUMsQ0FBQztNQUN2QyxJQUFJeGQsR0FBRyxLQUFLLEtBQUssRUFBRXFRLEVBQUUsQ0FBQ2daLE1BQU0sQ0FBQ3BpQixNQUFNLENBQUN1VyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQzFDLElBQUl4ZCxHQUFHLEtBQUssTUFBTSxFQUFFLENBQUUsSUFBSXdkLEdBQUcsRUFBRW5OLEVBQUUsQ0FBQytNLE9BQU8sQ0FBQ0ksR0FBRyxDQUFDLENBQUUsQ0FBQztNQUNqRCxJQUFJeGQsR0FBRyxLQUFLLFFBQVEsRUFBRXFRLEVBQUUsQ0FBQzZZLE1BQU0sQ0FBQzFMLEdBQUcsQ0FBQyxDQUFDO01BQ3JDLElBQUl4ZCxHQUFHLEtBQUssTUFBTSxFQUFFLENBQUUsQ0FBQyxDQUFDO01BQUEsS0FDeEIsSUFBSUEsR0FBRyxLQUFLLFNBQVMsRUFBRXFRLEVBQUUsQ0FBQ2thLE9BQU8sQ0FBQy9NLEdBQUcsQ0FBQyxDQUFDO01BQ3ZDLElBQUl4ZCxHQUFHLEtBQUssYUFBYSxFQUFFcVEsRUFBRSxDQUFDMlcsYUFBYSxDQUFDeEosR0FBRyxDQUFDLENBQUM7TUFDakQsSUFBSXhkLEdBQUcsS0FBSyxRQUFRLEVBQUVxUSxFQUFFLENBQUNpWixTQUFTLENBQUM5TCxHQUFHLENBQUMsQ0FBQztNQUN4QyxJQUFJeGQsR0FBRyxLQUFLLFFBQVEsRUFBRXFRLEVBQUUsQ0FBQ21XLFdBQVcsQ0FBQ2hKLEdBQUcsQ0FBQyxDQUFDO01BQzFDLElBQUl4ZCxHQUFHLEtBQUssU0FBUyxFQUFFcVEsRUFBRSxDQUFDOFksVUFBVSxDQUFDM0wsR0FBRyxDQUFDLENBQUM7TUFDMUMsSUFBSXhkLEdBQUcsS0FBSyxhQUFhLEVBQUVxUSxFQUFFLENBQUMrWSxXQUFXLENBQUM1TCxHQUFHLENBQUMsQ0FBQztNQUMvQyxJQUFJeGQsR0FBRyxLQUFLLG1CQUFtQixFQUFFcVEsRUFBRSxDQUFDaVgsb0JBQW9CLENBQUM5SixHQUFHLENBQUMsQ0FBQztNQUM5RCxJQUFJeGQsR0FBRyxLQUFLLGNBQWMsSUFBSUEsR0FBRyxLQUFLLFFBQVEsRUFBRTtRQUNuRCxJQUFJcVEsRUFBRSxDQUFDWSxjQUFjLENBQUMsQ0FBQyxFQUFFO1VBQ3ZCLElBQUksQ0FBQ3FaLE1BQU0sRUFBRUEsTUFBTSxHQUFHLElBQUlFLDBCQUFpQixDQUFDLENBQUM7VUFDN0NGLE1BQU0sQ0FBQ2hYLFNBQVMsQ0FBQ2tLLEdBQUcsQ0FBQztRQUN2QjtNQUNGLENBQUM7TUFDSSxJQUFJeGQsR0FBRyxLQUFLLFdBQVcsRUFBRTtRQUM1QixJQUFJcVEsRUFBRSxDQUFDWSxjQUFjLENBQUMsQ0FBQyxFQUFFO1VBQ3ZCLElBQUksQ0FBQ3FaLE1BQU0sRUFBRUEsTUFBTSxHQUFHLElBQUlFLDBCQUFpQixDQUFDLENBQUM7VUFDN0NGLE1BQU0sQ0FBQ0csWUFBWSxDQUFDak4sR0FBRyxDQUFDO1FBQzFCLENBQUMsTUFBTTs7VUFDTDtRQUFBLENBRUosQ0FBQztNQUNJLElBQUl4ZCxHQUFHLEtBQUssZUFBZSxFQUFFcVEsRUFBRSxDQUFDOEosbUJBQW1CLENBQUNxRCxHQUFHLENBQUMsQ0FBQztNQUN6RCxJQUFJeGQsR0FBRyxLQUFLLG1DQUFtQyxFQUFFO1FBQ3BELElBQUlnUSxRQUFRLEtBQUs5TyxTQUFTLEVBQUU4TyxRQUFRLEdBQUcsQ0FBQ21hLFVBQVUsR0FBRyxJQUFJakMsK0JBQXNCLENBQUMsQ0FBQyxHQUFHLElBQUl3QywrQkFBc0IsQ0FBQyxDQUFDLEVBQUV2QyxLQUFLLENBQUM5WCxFQUFFLENBQUM7UUFDM0gsSUFBSSxDQUFDOFosVUFBVSxFQUFFbmEsUUFBUSxDQUFDMmEsNEJBQTRCLENBQUNuTixHQUFHLENBQUM7TUFDN0QsQ0FBQztNQUNJLElBQUl4ZCxHQUFHLEtBQUssUUFBUSxFQUFFO1FBQ3pCLElBQUlnUSxRQUFRLEtBQUs5TyxTQUFTLEVBQUU4TyxRQUFRLEdBQUcsQ0FBQ21hLFVBQVUsR0FBRyxJQUFJakMsK0JBQXNCLENBQUMsQ0FBQyxHQUFHLElBQUl3QywrQkFBc0IsQ0FBQyxDQUFDLEVBQUV2QyxLQUFLLENBQUM5WCxFQUFFLENBQUM7UUFDM0hMLFFBQVEsQ0FBQ3lHLFNBQVMsQ0FBQ3hQLE1BQU0sQ0FBQ3VXLEdBQUcsQ0FBQyxDQUFDO01BQ2pDLENBQUM7TUFDSSxJQUFJeGQsR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBRTtNQUFBLEtBQzNCLElBQUlBLEdBQUcsS0FBSyxTQUFTLEVBQUU7UUFDMUIsSUFBSSxDQUFDbXFCLFVBQVUsRUFBRTtVQUNmLElBQUksQ0FBQ25hLFFBQVEsRUFBRUEsUUFBUSxHQUFHLElBQUkwYSwrQkFBc0IsQ0FBQyxDQUFDLENBQUN2QyxLQUFLLENBQUM5WCxFQUFFLENBQUM7VUFDaEVMLFFBQVEsQ0FBQzFCLFVBQVUsQ0FBQ2tQLEdBQUcsQ0FBQztRQUMxQjtNQUNGLENBQUM7TUFDSSxJQUFJeGQsR0FBRyxLQUFLLFlBQVksRUFBRTtRQUM3QixJQUFJLEVBQUUsS0FBS3dkLEdBQUcsSUFBSXhILHVCQUFjLENBQUM0VSxrQkFBa0IsS0FBS3BOLEdBQUcsRUFBRW5OLEVBQUUsQ0FBQ2pHLFlBQVksQ0FBQ29ULEdBQUcsQ0FBQyxDQUFDLENBQUU7TUFDdEYsQ0FBQztNQUNJLElBQUl4ZCxHQUFHLEtBQUssZUFBZSxFQUFFLElBQUE4RyxlQUFNLEVBQUNxZSxLQUFLLENBQUNuUSxlQUFlLENBQUMsQ0FBQyxDQUFFO01BQUEsS0FDN0QsSUFBSWhWLEdBQUcsS0FBSyxpQkFBaUIsRUFBRTtRQUNsQyxJQUFJLENBQUNnUSxRQUFRLEVBQUVBLFFBQVEsR0FBRyxDQUFDbWEsVUFBVSxHQUFHLElBQUlqQywrQkFBc0IsQ0FBQyxDQUFDLEdBQUcsSUFBSXdDLCtCQUFzQixDQUFDLENBQUMsRUFBRXZDLEtBQUssQ0FBQzlYLEVBQUUsQ0FBQztRQUM5RyxJQUFJd2EsVUFBVSxHQUFHck4sR0FBRztRQUNwQnhOLFFBQVEsQ0FBQzdHLGVBQWUsQ0FBQzBoQixVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUN4aEIsS0FBSyxDQUFDO1FBQzdDLElBQUk4Z0IsVUFBVSxFQUFFO1VBQ2QsSUFBSXJjLGlCQUFpQixHQUFHLEVBQUU7VUFDMUIsS0FBSyxJQUFJZ2QsUUFBUSxJQUFJRCxVQUFVLEVBQUUvYyxpQkFBaUIsQ0FBQy9GLElBQUksQ0FBQytpQixRQUFRLENBQUN2aEIsS0FBSyxDQUFDO1VBQ3ZFeUcsUUFBUSxDQUFDbUcsb0JBQW9CLENBQUNySSxpQkFBaUIsQ0FBQztRQUNsRCxDQUFDLE1BQU07VUFDTGhILGVBQU0sQ0FBQ0MsS0FBSyxDQUFDOGpCLFVBQVUsQ0FBQzVlLE1BQU0sRUFBRSxDQUFDLENBQUM7VUFDbEMrRCxRQUFRLENBQUMrYSxrQkFBa0IsQ0FBQ0YsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDdGhCLEtBQUssQ0FBQztRQUNsRDtNQUNGLENBQUM7TUFDSSxJQUFJdkosR0FBRyxLQUFLLGNBQWMsSUFBSUEsR0FBRyxJQUFJLFlBQVksRUFBRTtRQUN0RCxJQUFBOEcsZUFBTSxFQUFDcWpCLFVBQVUsQ0FBQztRQUNsQixJQUFJM1YsWUFBWSxHQUFHLEVBQUU7UUFDckIsS0FBSyxJQUFJd1csY0FBYyxJQUFJeE4sR0FBRyxFQUFFO1VBQzlCLElBQUkvSSxXQUFXLEdBQUcsSUFBSW9TLDBCQUFpQixDQUFDLENBQUM7VUFDekNyUyxZQUFZLENBQUN6TSxJQUFJLENBQUMwTSxXQUFXLENBQUM7VUFDOUIsS0FBSyxJQUFJd1csY0FBYyxJQUFJcHJCLE1BQU0sQ0FBQ2dYLElBQUksQ0FBQ21VLGNBQWMsQ0FBQyxFQUFFO1lBQ3RELElBQUlDLGNBQWMsS0FBSyxTQUFTLEVBQUV4VyxXQUFXLENBQUNuRyxVQUFVLENBQUMwYyxjQUFjLENBQUNDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDcEYsSUFBSUEsY0FBYyxLQUFLLFFBQVEsRUFBRXhXLFdBQVcsQ0FBQ2dDLFNBQVMsQ0FBQ3hQLE1BQU0sQ0FBQytqQixjQUFjLENBQUNDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRixNQUFNLElBQUk5cEIsb0JBQVcsQ0FBQyw4Q0FBOEMsR0FBRzhwQixjQUFjLENBQUM7VUFDN0Y7UUFDRjtRQUNBLElBQUlqYixRQUFRLEtBQUs5TyxTQUFTLEVBQUU4TyxRQUFRLEdBQUcsSUFBSWtZLCtCQUFzQixDQUFDLEVBQUM3WCxFQUFFLEVBQUVBLEVBQUUsRUFBQyxDQUFDO1FBQzNFTCxRQUFRLENBQUM4VyxlQUFlLENBQUN0UyxZQUFZLENBQUM7TUFDeEMsQ0FBQztNQUNJLElBQUl4VSxHQUFHLEtBQUssZ0JBQWdCLElBQUl3ZCxHQUFHLEtBQUt0YyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7TUFBQSxLQUN0RCxJQUFJbEIsR0FBRyxLQUFLLGdCQUFnQixJQUFJd2QsR0FBRyxLQUFLdGMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO01BQUEsS0FDdEQsSUFBSWxCLEdBQUcsS0FBSyxXQUFXLEVBQUVxUSxFQUFFLENBQUM2YSxXQUFXLENBQUNqa0IsTUFBTSxDQUFDdVcsR0FBRyxDQUFDLENBQUMsQ0FBQztNQUNyRCxJQUFJeGQsR0FBRyxLQUFLLFlBQVksRUFBRXFRLEVBQUUsQ0FBQzhhLFlBQVksQ0FBQ2xrQixNQUFNLENBQUN1VyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQ3ZELElBQUl4ZCxHQUFHLEtBQUssZ0JBQWdCLEVBQUVxUSxFQUFFLENBQUMrYSxnQkFBZ0IsQ0FBQzVOLEdBQUcsS0FBSyxFQUFFLEdBQUd0YyxTQUFTLEdBQUdzYyxHQUFHLENBQUMsQ0FBQztNQUNoRixJQUFJeGQsR0FBRyxLQUFLLGVBQWUsRUFBRXFRLEVBQUUsQ0FBQ2diLGVBQWUsQ0FBQ3BrQixNQUFNLENBQUN1VyxHQUFHLENBQUMsQ0FBQyxDQUFDO01BQzdELElBQUl4ZCxHQUFHLEtBQUssZUFBZSxFQUFFcVEsRUFBRSxDQUFDaWIsa0JBQWtCLENBQUM5TixHQUFHLENBQUMsQ0FBQztNQUN4RCxJQUFJeGQsR0FBRyxLQUFLLE9BQU8sRUFBRXFRLEVBQUUsQ0FBQ2tiLFdBQVcsQ0FBQy9OLEdBQUcsQ0FBQyxDQUFDO01BQ3pDLElBQUl4ZCxHQUFHLEtBQUssV0FBVyxFQUFFcVEsRUFBRSxDQUFDMFgsV0FBVyxDQUFDdkssR0FBRyxDQUFDLENBQUM7TUFDN0MsSUFBSXhkLEdBQUcsS0FBSyxrQkFBa0IsRUFBRTtRQUNuQyxJQUFJd3JCLGNBQWMsR0FBR2hPLEdBQUcsQ0FBQ2lPLFVBQVU7UUFDbkNwcUIsaUJBQVEsQ0FBQ21vQixVQUFVLENBQUNuWixFQUFFLENBQUNvWixTQUFTLENBQUMsQ0FBQyxLQUFLdm9CLFNBQVMsQ0FBQztRQUNqRG1QLEVBQUUsQ0FBQ3FaLFNBQVMsQ0FBQyxFQUFFLENBQUM7UUFDaEIsS0FBSyxJQUFJQyxhQUFhLElBQUk2QixjQUFjLEVBQUU7VUFDeENuYixFQUFFLENBQUNvWixTQUFTLENBQUMsQ0FBQyxDQUFDMWhCLElBQUksQ0FBQyxJQUFJNmhCLDJCQUFrQixDQUFDLENBQUMsQ0FBQ0MsV0FBVyxDQUFDLElBQUl4RCx1QkFBYyxDQUFDLENBQUMsQ0FBQ3lELE1BQU0sQ0FBQ0gsYUFBYSxDQUFDLENBQUMsQ0FBQ3hCLEtBQUssQ0FBQzlYLEVBQUUsQ0FBQyxDQUFDO1FBQ2pIO01BQ0YsQ0FBQztNQUNJLElBQUlyUSxHQUFHLEtBQUssaUJBQWlCLEVBQUU7UUFDbENxQixpQkFBUSxDQUFDbW9CLFVBQVUsQ0FBQ1csVUFBVSxDQUFDO1FBQy9CLElBQUlELGFBQWEsR0FBRzFNLEdBQUcsQ0FBQ2tPLE9BQU87UUFDL0I1a0IsZUFBTSxDQUFDQyxLQUFLLENBQUNyRyxNQUFNLENBQUNnVSxlQUFlLENBQUMsQ0FBQyxDQUFDekksTUFBTSxFQUFFaWUsYUFBYSxDQUFDamUsTUFBTSxDQUFDO1FBQ25FLElBQUkrRCxRQUFRLEtBQUs5TyxTQUFTLEVBQUU4TyxRQUFRLEdBQUcsSUFBSWtZLCtCQUFzQixDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFDOVgsRUFBRSxDQUFDO1FBQzdFTCxRQUFRLENBQUM4VyxlQUFlLENBQUMsRUFBRSxDQUFDO1FBQzVCLEtBQUssSUFBSS9RLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR3JWLE1BQU0sQ0FBQ2dVLGVBQWUsQ0FBQyxDQUFDLENBQUN6SSxNQUFNLEVBQUU4SixDQUFDLEVBQUUsRUFBRTtVQUN4RC9GLFFBQVEsQ0FBQzBFLGVBQWUsQ0FBQyxDQUFDLENBQUMzTSxJQUFJLENBQUMsSUFBSThlLDBCQUFpQixDQUFDbm1CLE1BQU0sQ0FBQ2dVLGVBQWUsQ0FBQyxDQUFDLENBQUNxQixDQUFDLENBQUMsQ0FBQ2xOLFVBQVUsQ0FBQyxDQUFDLEVBQUU1QixNQUFNLENBQUNpakIsYUFBYSxDQUFDblUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVIO01BQ0YsQ0FBQztNQUNJN0UsT0FBTyxDQUFDaVIsR0FBRyxDQUFDLGdFQUFnRSxHQUFHbmlCLEdBQUcsR0FBRyxJQUFJLEdBQUd3ZCxHQUFHLENBQUM7SUFDdkc7O0lBRUE7SUFDQSxJQUFJOE0sTUFBTSxFQUFFamEsRUFBRSxDQUFDc2IsUUFBUSxDQUFDLElBQUlDLG9CQUFXLENBQUN0QixNQUFNLENBQUMsQ0FBQ3ZCLE1BQU0sQ0FBQyxDQUFDMVksRUFBRSxDQUFDLENBQUMsQ0FBQzs7SUFFN0Q7SUFDQSxJQUFJTCxRQUFRLEVBQUU7TUFDWixJQUFJSyxFQUFFLENBQUNZLGNBQWMsQ0FBQyxDQUFDLEtBQUsvUCxTQUFTLEVBQUVtUCxFQUFFLENBQUNvVyxjQUFjLENBQUMsS0FBSyxDQUFDO01BQy9ELElBQUksQ0FBQ3pXLFFBQVEsQ0FBQ0MsS0FBSyxDQUFDLENBQUMsQ0FBQ2dCLGNBQWMsQ0FBQyxDQUFDLEVBQUVaLEVBQUUsQ0FBQzhKLG1CQUFtQixDQUFDLENBQUMsQ0FBQztNQUNqRSxJQUFJZ1EsVUFBVSxFQUFFO1FBQ2Q5WixFQUFFLENBQUN1VixhQUFhLENBQUMsSUFBSSxDQUFDO1FBQ3RCLElBQUl2VixFQUFFLENBQUM2RixtQkFBbUIsQ0FBQyxDQUFDLEVBQUU7VUFDNUIsSUFBSWxHLFFBQVEsQ0FBQzBFLGVBQWUsQ0FBQyxDQUFDLEVBQUVyRSxFQUFFLENBQUM2RixtQkFBbUIsQ0FBQyxDQUFDLENBQUM0USxlQUFlLENBQUM1bEIsU0FBUyxDQUFDLENBQUMsQ0FBQztVQUNyRm1QLEVBQUUsQ0FBQzZGLG1CQUFtQixDQUFDLENBQUMsQ0FBQzJWLEtBQUssQ0FBQzdiLFFBQVEsQ0FBQztRQUMxQyxDQUFDO1FBQ0lLLEVBQUUsQ0FBQzBXLG1CQUFtQixDQUFDL1csUUFBUSxDQUFDO01BQ3ZDLENBQUMsTUFBTTtRQUNMSyxFQUFFLENBQUNzVixhQUFhLENBQUMsSUFBSSxDQUFDO1FBQ3RCdFYsRUFBRSxDQUFDeWIsb0JBQW9CLENBQUMsQ0FBQzliLFFBQVEsQ0FBQyxDQUFDO01BQ3JDO0lBQ0Y7O0lBRUE7SUFDQSxPQUFPSyxFQUFFO0VBQ1g7O0VBRUEsT0FBaUI2Viw0QkFBNEJBLENBQUNELFNBQVMsRUFBRTs7SUFFdkQ7SUFDQSxJQUFJNVYsRUFBRSxHQUFHLElBQUkyRix1QkFBYyxDQUFDLENBQUM7SUFDN0IzRixFQUFFLENBQUNvVyxjQUFjLENBQUMsSUFBSSxDQUFDO0lBQ3ZCcFcsRUFBRSxDQUFDK0csWUFBWSxDQUFDLElBQUksQ0FBQztJQUNyQi9HLEVBQUUsQ0FBQ3VXLFdBQVcsQ0FBQyxLQUFLLENBQUM7O0lBRXJCO0lBQ0EsSUFBSS9WLE1BQU0sR0FBRyxJQUFJK1ksMkJBQWtCLENBQUMsRUFBQ3ZaLEVBQUUsRUFBRUEsRUFBRSxFQUFDLENBQUM7SUFDN0MsS0FBSyxJQUFJclEsR0FBRyxJQUFJSCxNQUFNLENBQUNnWCxJQUFJLENBQUNvUCxTQUFTLENBQUMsRUFBRTtNQUN0QyxJQUFJekksR0FBRyxHQUFHeUksU0FBUyxDQUFDam1CLEdBQUcsQ0FBQztNQUN4QixJQUFJQSxHQUFHLEtBQUssUUFBUSxFQUFFNlEsTUFBTSxDQUFDNEYsU0FBUyxDQUFDeFAsTUFBTSxDQUFDdVcsR0FBRyxDQUFDLENBQUMsQ0FBQztNQUMvQyxJQUFJeGQsR0FBRyxLQUFLLE9BQU8sRUFBRTZRLE1BQU0sQ0FBQ2tiLFVBQVUsQ0FBQ3ZPLEdBQUcsQ0FBQyxDQUFDO01BQzVDLElBQUl4ZCxHQUFHLEtBQUssV0FBVyxFQUFFLENBQUUsSUFBSSxFQUFFLEtBQUt3ZCxHQUFHLEVBQUUzTSxNQUFNLENBQUNnWixXQUFXLENBQUMsSUFBSXhELHVCQUFjLENBQUM3SSxHQUFHLENBQUMsQ0FBQyxDQUFFLENBQUM7TUFDekYsSUFBSXhkLEdBQUcsS0FBSyxjQUFjLEVBQUU2USxNQUFNLENBQUN2SCxRQUFRLENBQUNrVSxHQUFHLENBQUMsQ0FBQztNQUNqRCxJQUFJeGQsR0FBRyxLQUFLLFNBQVMsRUFBRXFRLEVBQUUsQ0FBQzRZLE9BQU8sQ0FBQ3pMLEdBQUcsQ0FBQyxDQUFDO01BQ3ZDLElBQUl4ZCxHQUFHLEtBQUssVUFBVSxFQUFFcVEsRUFBRSxDQUFDbVcsV0FBVyxDQUFDLENBQUNoSixHQUFHLENBQUMsQ0FBQztNQUM3QyxJQUFJeGQsR0FBRyxLQUFLLFFBQVEsRUFBRTZRLE1BQU0sQ0FBQ21iLFdBQVcsQ0FBQ3hPLEdBQUcsQ0FBQyxDQUFDO01BQzlDLElBQUl4ZCxHQUFHLEtBQUssUUFBUSxFQUFFNlEsTUFBTSxDQUFDb2IsbUJBQW1CLENBQUN6TyxHQUFHLENBQUMsQ0FBQztNQUN0RCxJQUFJeGQsR0FBRyxLQUFLLGVBQWUsRUFBRTtRQUNoQzZRLE1BQU0sQ0FBQzFILGVBQWUsQ0FBQ3FVLEdBQUcsQ0FBQ25VLEtBQUssQ0FBQztRQUNqQ3dILE1BQU0sQ0FBQ2thLGtCQUFrQixDQUFDdk4sR0FBRyxDQUFDalUsS0FBSyxDQUFDO01BQ3RDLENBQUM7TUFDSSxJQUFJdkosR0FBRyxLQUFLLGNBQWMsRUFBRXFRLEVBQUUsQ0FBQ3NiLFFBQVEsQ0FBRSxJQUFJQyxvQkFBVyxDQUFDLENBQUMsQ0FBQ3RZLFNBQVMsQ0FBQ2tLLEdBQUcsQ0FBQyxDQUFpQnVMLE1BQU0sQ0FBQyxDQUFDMVksRUFBRSxDQUFhLENBQUMsQ0FBQyxDQUFDO01BQ3BIYSxPQUFPLENBQUNpUixHQUFHLENBQUMsa0RBQWtELEdBQUduaUIsR0FBRyxHQUFHLElBQUksR0FBR3dkLEdBQUcsQ0FBQztJQUN6Rjs7SUFFQTtJQUNBbk4sRUFBRSxDQUFDNmIsVUFBVSxDQUFDLENBQUNyYixNQUFNLENBQUMsQ0FBQztJQUN2QixPQUFPUixFQUFFO0VBQ1g7O0VBRUEsT0FBaUJnSSwwQkFBMEJBLENBQUM4VCx5QkFBeUIsRUFBRTtJQUNyRSxJQUFJaFYsS0FBSyxHQUFHLElBQUlxUixvQkFBVyxDQUFDLENBQUM7SUFDN0IsS0FBSyxJQUFJeG9CLEdBQUcsSUFBSUgsTUFBTSxDQUFDZ1gsSUFBSSxDQUFDc1YseUJBQXlCLENBQUMsRUFBRTtNQUN0RCxJQUFJM08sR0FBRyxHQUFHMk8seUJBQXlCLENBQUNuc0IsR0FBRyxDQUFDO01BQ3hDLElBQUlBLEdBQUcsS0FBSyxNQUFNLEVBQUU7UUFDbEJtWCxLQUFLLENBQUM0UixNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ2hCLEtBQUssSUFBSTVZLEtBQUssSUFBSXFOLEdBQUcsRUFBRTtVQUNyQixJQUFJbk4sRUFBRSxHQUFHL1AsZUFBZSxDQUFDOGtCLHdCQUF3QixDQUFDalYsS0FBSyxFQUFFalAsU0FBUyxFQUFFLElBQUksQ0FBQztVQUN6RW1QLEVBQUUsQ0FBQzJZLFFBQVEsQ0FBQzdSLEtBQUssQ0FBQztVQUNsQkEsS0FBSyxDQUFDekksTUFBTSxDQUFDLENBQUMsQ0FBQzNHLElBQUksQ0FBQ3NJLEVBQUUsQ0FBQztRQUN6QjtNQUNGLENBQUM7TUFDSSxJQUFJclEsR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFFLENBQUMsQ0FBQztNQUFBLEtBQzNCa1IsT0FBTyxDQUFDaVIsR0FBRyxDQUFDLHlEQUF5RCxHQUFHbmlCLEdBQUcsR0FBRyxJQUFJLEdBQUd3ZCxHQUFHLENBQUM7SUFDaEc7SUFDQSxPQUFPckcsS0FBSztFQUNkOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBaUJrVCxhQUFhQSxDQUFDK0IsT0FBTyxFQUFFL2IsRUFBRSxFQUFFO0lBQzFDLElBQUk4WixVQUFVO0lBQ2QsSUFBSWlDLE9BQU8sS0FBSyxJQUFJLEVBQUU7TUFDcEJqQyxVQUFVLEdBQUcsS0FBSztNQUNsQjlaLEVBQUUsQ0FBQ29XLGNBQWMsQ0FBQyxJQUFJLENBQUM7TUFDdkJwVyxFQUFFLENBQUNnSCxXQUFXLENBQUMsS0FBSyxDQUFDO01BQ3JCaEgsRUFBRSxDQUFDK0csWUFBWSxDQUFDLElBQUksQ0FBQztNQUNyQi9HLEVBQUUsQ0FBQ3FXLFFBQVEsQ0FBQyxJQUFJLENBQUM7TUFDakJyVyxFQUFFLENBQUN1VyxXQUFXLENBQUMsS0FBSyxDQUFDO01BQ3JCdlcsRUFBRSxDQUFDc1csWUFBWSxDQUFDLEtBQUssQ0FBQztJQUN4QixDQUFDLE1BQU0sSUFBSXlGLE9BQU8sS0FBSyxLQUFLLEVBQUU7TUFDNUJqQyxVQUFVLEdBQUcsSUFBSTtNQUNqQjlaLEVBQUUsQ0FBQ29XLGNBQWMsQ0FBQyxJQUFJLENBQUM7TUFDdkJwVyxFQUFFLENBQUNnSCxXQUFXLENBQUMsS0FBSyxDQUFDO01BQ3JCaEgsRUFBRSxDQUFDK0csWUFBWSxDQUFDLElBQUksQ0FBQztNQUNyQi9HLEVBQUUsQ0FBQ3FXLFFBQVEsQ0FBQyxJQUFJLENBQUM7TUFDakJyVyxFQUFFLENBQUN1VyxXQUFXLENBQUMsS0FBSyxDQUFDO01BQ3JCdlcsRUFBRSxDQUFDc1csWUFBWSxDQUFDLEtBQUssQ0FBQztJQUN4QixDQUFDLE1BQU0sSUFBSXlGLE9BQU8sS0FBSyxNQUFNLEVBQUU7TUFDN0JqQyxVQUFVLEdBQUcsS0FBSztNQUNsQjlaLEVBQUUsQ0FBQ29XLGNBQWMsQ0FBQyxLQUFLLENBQUM7TUFDeEJwVyxFQUFFLENBQUNnSCxXQUFXLENBQUMsSUFBSSxDQUFDO01BQ3BCaEgsRUFBRSxDQUFDK0csWUFBWSxDQUFDLElBQUksQ0FBQztNQUNyQi9HLEVBQUUsQ0FBQ3FXLFFBQVEsQ0FBQyxJQUFJLENBQUM7TUFDakJyVyxFQUFFLENBQUN1VyxXQUFXLENBQUMsS0FBSyxDQUFDO01BQ3JCdlcsRUFBRSxDQUFDc1csWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUU7SUFDM0IsQ0FBQyxNQUFNLElBQUl5RixPQUFPLEtBQUssU0FBUyxFQUFFO01BQ2hDakMsVUFBVSxHQUFHLElBQUk7TUFDakI5WixFQUFFLENBQUNvVyxjQUFjLENBQUMsS0FBSyxDQUFDO01BQ3hCcFcsRUFBRSxDQUFDZ0gsV0FBVyxDQUFDLElBQUksQ0FBQztNQUNwQmhILEVBQUUsQ0FBQytHLFlBQVksQ0FBQyxJQUFJLENBQUM7TUFDckIvRyxFQUFFLENBQUNxVyxRQUFRLENBQUMsSUFBSSxDQUFDO01BQ2pCclcsRUFBRSxDQUFDdVcsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQnZXLEVBQUUsQ0FBQ3NXLFlBQVksQ0FBQyxLQUFLLENBQUM7SUFDeEIsQ0FBQyxNQUFNLElBQUl5RixPQUFPLEtBQUssT0FBTyxFQUFFO01BQzlCakMsVUFBVSxHQUFHLEtBQUs7TUFDbEI5WixFQUFFLENBQUNvVyxjQUFjLENBQUMsSUFBSSxDQUFDO01BQ3ZCcFcsRUFBRSxDQUFDZ0gsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQmhILEVBQUUsQ0FBQytHLFlBQVksQ0FBQyxJQUFJLENBQUM7TUFDckIvRyxFQUFFLENBQUNxVyxRQUFRLENBQUMsSUFBSSxDQUFDO01BQ2pCclcsRUFBRSxDQUFDdVcsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQnZXLEVBQUUsQ0FBQ3NXLFlBQVksQ0FBQyxJQUFJLENBQUM7SUFDdkIsQ0FBQyxNQUFNLElBQUl5RixPQUFPLEtBQUssUUFBUSxFQUFFO01BQy9CakMsVUFBVSxHQUFHLElBQUk7TUFDakI5WixFQUFFLENBQUNvVyxjQUFjLENBQUMsS0FBSyxDQUFDO01BQ3hCcFcsRUFBRSxDQUFDZ0gsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQmhILEVBQUUsQ0FBQytHLFlBQVksQ0FBQyxJQUFJLENBQUM7TUFDckIvRyxFQUFFLENBQUNxVyxRQUFRLENBQUMsSUFBSSxDQUFDO01BQ2pCclcsRUFBRSxDQUFDdVcsV0FBVyxDQUFDLElBQUksQ0FBQztNQUNwQnZXLEVBQUUsQ0FBQ3NXLFlBQVksQ0FBQyxLQUFLLENBQUM7SUFDeEIsQ0FBQyxNQUFNO01BQ0wsTUFBTSxJQUFJeGxCLG9CQUFXLENBQUMsOEJBQThCLEdBQUdpckIsT0FBTyxDQUFDO0lBQ2pFO0lBQ0EsT0FBT2pDLFVBQVU7RUFDbkI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFpQjdaLE9BQU9BLENBQUNELEVBQUUsRUFBRUYsS0FBSyxFQUFFQyxRQUFRLEVBQUU7SUFDNUMsSUFBQXRKLGVBQU0sRUFBQ3VKLEVBQUUsQ0FBQ2tCLE9BQU8sQ0FBQyxDQUFDLEtBQUtyUSxTQUFTLENBQUM7O0lBRWxDO0lBQ0EsSUFBSW1yQixHQUFHLEdBQUdsYyxLQUFLLENBQUNFLEVBQUUsQ0FBQ2tCLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDN0IsSUFBSThhLEdBQUcsS0FBS25yQixTQUFTLEVBQUVpUCxLQUFLLENBQUNFLEVBQUUsQ0FBQ2tCLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBR2xCLEVBQUUsQ0FBQyxDQUFDO0lBQUEsS0FDNUNnYyxHQUFHLENBQUNSLEtBQUssQ0FBQ3hiLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0lBRXBCO0lBQ0EsSUFBSUEsRUFBRSxDQUFDL0YsU0FBUyxDQUFDLENBQUMsS0FBS3BKLFNBQVMsRUFBRTtNQUNoQyxJQUFJb3JCLE1BQU0sR0FBR2xjLFFBQVEsQ0FBQ0MsRUFBRSxDQUFDL0YsU0FBUyxDQUFDLENBQUMsQ0FBQztNQUNyQyxJQUFJZ2lCLE1BQU0sS0FBS3ByQixTQUFTLEVBQUVrUCxRQUFRLENBQUNDLEVBQUUsQ0FBQy9GLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRytGLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQUEsS0FDL0RzYixNQUFNLENBQUNULEtBQUssQ0FBQ3hiLEVBQUUsQ0FBQ1csUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEM7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7RUFDRSxPQUFpQjBVLGtCQUFrQkEsQ0FBQzZHLEdBQUcsRUFBRUMsR0FBRyxFQUFFO0lBQzVDLElBQUlELEdBQUcsQ0FBQ2ppQixTQUFTLENBQUMsQ0FBQyxLQUFLcEosU0FBUyxJQUFJc3JCLEdBQUcsQ0FBQ2xpQixTQUFTLENBQUMsQ0FBQyxLQUFLcEosU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFBQSxLQUN6RSxJQUFJcXJCLEdBQUcsQ0FBQ2ppQixTQUFTLENBQUMsQ0FBQyxLQUFLcEosU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUc7SUFBQSxLQUMvQyxJQUFJc3JCLEdBQUcsQ0FBQ2xpQixTQUFTLENBQUMsQ0FBQyxLQUFLcEosU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBRTtJQUNwRCxJQUFJdXJCLElBQUksR0FBR0YsR0FBRyxDQUFDamlCLFNBQVMsQ0FBQyxDQUFDLEdBQUdraUIsR0FBRyxDQUFDbGlCLFNBQVMsQ0FBQyxDQUFDO0lBQzVDLElBQUltaUIsSUFBSSxLQUFLLENBQUMsRUFBRSxPQUFPQSxJQUFJO0lBQzNCLE9BQU9GLEdBQUcsQ0FBQ3ZiLFFBQVEsQ0FBQyxDQUFDLENBQUN0QyxNQUFNLENBQUMsQ0FBQyxDQUFDeEcsT0FBTyxDQUFDcWtCLEdBQUcsQ0FBQyxHQUFHQyxHQUFHLENBQUN4YixRQUFRLENBQUMsQ0FBQyxDQUFDdEMsTUFBTSxDQUFDLENBQUMsQ0FBQ3hHLE9BQU8sQ0FBQ3NrQixHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ3RGOztFQUVBO0FBQ0Y7QUFDQTtFQUNFLE9BQU8zRyx3QkFBd0JBLENBQUM2RyxFQUFFLEVBQUVDLEVBQUUsRUFBRTtJQUN0QyxJQUFJRCxFQUFFLENBQUNyZixlQUFlLENBQUMsQ0FBQyxHQUFHc2YsRUFBRSxDQUFDdGYsZUFBZSxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3RELElBQUlxZixFQUFFLENBQUNyZixlQUFlLENBQUMsQ0FBQyxLQUFLc2YsRUFBRSxDQUFDdGYsZUFBZSxDQUFDLENBQUMsRUFBRSxPQUFPcWYsRUFBRSxDQUFDMUgsa0JBQWtCLENBQUMsQ0FBQyxHQUFHMkgsRUFBRSxDQUFDM0gsa0JBQWtCLENBQUMsQ0FBQztJQUNoSCxPQUFPLENBQUM7RUFDVjs7RUFFQTtBQUNGO0FBQ0E7RUFDRSxPQUFpQm1CLGNBQWNBLENBQUN5RyxFQUFFLEVBQUVDLEVBQUUsRUFBRTs7SUFFdEM7SUFDQSxJQUFJQyxnQkFBZ0IsR0FBR3hzQixlQUFlLENBQUNvbEIsa0JBQWtCLENBQUNrSCxFQUFFLENBQUMzYyxLQUFLLENBQUMsQ0FBQyxFQUFFNGMsRUFBRSxDQUFDNWMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNqRixJQUFJNmMsZ0JBQWdCLEtBQUssQ0FBQyxFQUFFLE9BQU9BLGdCQUFnQjs7SUFFbkQ7SUFDQSxJQUFJQyxPQUFPLEdBQUdILEVBQUUsQ0FBQ3ZmLGVBQWUsQ0FBQyxDQUFDLEdBQUd3ZixFQUFFLENBQUN4ZixlQUFlLENBQUMsQ0FBQztJQUN6RCxJQUFJMGYsT0FBTyxLQUFLLENBQUMsRUFBRSxPQUFPQSxPQUFPO0lBQ2pDQSxPQUFPLEdBQUdILEVBQUUsQ0FBQzVILGtCQUFrQixDQUFDLENBQUMsR0FBRzZILEVBQUUsQ0FBQzdILGtCQUFrQixDQUFDLENBQUM7SUFDM0QsSUFBSStILE9BQU8sS0FBSyxDQUFDLEVBQUUsT0FBT0EsT0FBTztJQUNqQ0EsT0FBTyxHQUFHSCxFQUFFLENBQUMvZixRQUFRLENBQUMsQ0FBQyxHQUFHZ2dCLEVBQUUsQ0FBQ2hnQixRQUFRLENBQUMsQ0FBQztJQUN2QyxJQUFJa2dCLE9BQU8sS0FBSyxDQUFDLEVBQUUsT0FBT0EsT0FBTztJQUNqQyxPQUFPSCxFQUFFLENBQUNwVyxXQUFXLENBQUMsQ0FBQyxDQUFDeEQsTUFBTSxDQUFDLENBQUMsQ0FBQ2dhLGFBQWEsQ0FBQ0gsRUFBRSxDQUFDclcsV0FBVyxDQUFDLENBQUMsQ0FBQ3hELE1BQU0sQ0FBQyxDQUFDLENBQUM7RUFDM0U7QUFDRjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBSkFpYSxPQUFBLENBQUExdEIsT0FBQSxHQUFBZSxlQUFBO0FBS0EsTUFBTWluQixZQUFZLENBQUM7O0VBRWpCOzs7Ozs7Ozs7Ozs7RUFZQTltQixXQUFXQSxDQUFDNGlCLE1BQU0sRUFBRTtJQUNsQixJQUFJdkIsSUFBSSxHQUFHLElBQUk7SUFDZixJQUFJLENBQUN1QixNQUFNLEdBQUdBLE1BQU07SUFDcEIsSUFBSSxDQUFDNkosTUFBTSxHQUFHLElBQUlDLG1CQUFVLENBQUMsa0JBQWlCLENBQUUsTUFBTXJMLElBQUksQ0FBQzdXLElBQUksQ0FBQyxDQUFDLENBQUUsQ0FBQyxDQUFDO0lBQ3JFLElBQUksQ0FBQ21pQixhQUFhLEdBQUcsRUFBRTtJQUN2QixJQUFJLENBQUNDLDRCQUE0QixHQUFHLElBQUl0ZCxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0MsSUFBSSxDQUFDdWQsMEJBQTBCLEdBQUcsSUFBSXZkLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3QyxJQUFJLENBQUN3ZCxVQUFVLEdBQUcsSUFBSUMsbUJBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLElBQUksQ0FBQ0MsVUFBVSxHQUFHLENBQUM7RUFDckI7O0VBRUFqRyxZQUFZQSxDQUFDQyxTQUFTLEVBQUU7SUFDdEIsSUFBSSxDQUFDQSxTQUFTLEdBQUdBLFNBQVM7SUFDMUIsSUFBSUEsU0FBUyxFQUFFLElBQUksQ0FBQ3lGLE1BQU0sQ0FBQ1EsS0FBSyxDQUFDLElBQUksQ0FBQ3JLLE1BQU0sQ0FBQ3hYLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdELElBQUksQ0FBQ3FoQixNQUFNLENBQUN6TSxJQUFJLENBQUMsQ0FBQztFQUN6Qjs7RUFFQTdVLGFBQWFBLENBQUMraEIsVUFBVSxFQUFFO0lBQ3hCLElBQUksQ0FBQ1QsTUFBTSxDQUFDdGhCLGFBQWEsQ0FBQytoQixVQUFVLENBQUM7RUFDdkM7O0VBRUEsTUFBTTFpQixJQUFJQSxDQUFBLEVBQUc7O0lBRVg7SUFDQSxJQUFJLElBQUksQ0FBQ3dpQixVQUFVLEdBQUcsQ0FBQyxFQUFFO0lBQ3pCLElBQUksQ0FBQ0EsVUFBVSxFQUFFOztJQUVqQjtJQUNBLElBQUkzTCxJQUFJLEdBQUcsSUFBSTtJQUNmLE9BQU8sSUFBSSxDQUFDeUwsVUFBVSxDQUFDSyxNQUFNLENBQUMsa0JBQWlCO01BQzdDLElBQUk7O1FBRUY7UUFDQSxJQUFJLE1BQU05TCxJQUFJLENBQUN1QixNQUFNLENBQUM3QyxRQUFRLENBQUMsQ0FBQyxFQUFFO1VBQ2hDc0IsSUFBSSxDQUFDMkwsVUFBVSxFQUFFO1VBQ2pCO1FBQ0Y7O1FBRUE7UUFDQSxJQUFJM0wsSUFBSSxDQUFDK0wsVUFBVSxLQUFLM3NCLFNBQVMsRUFBRTtVQUNqQzRnQixJQUFJLENBQUMrTCxVQUFVLEdBQUcsTUFBTS9MLElBQUksQ0FBQ3VCLE1BQU0sQ0FBQy9ZLFNBQVMsQ0FBQyxDQUFDO1VBQy9Dd1gsSUFBSSxDQUFDc0wsYUFBYSxHQUFHLE1BQU10TCxJQUFJLENBQUN1QixNQUFNLENBQUMzVSxNQUFNLENBQUMsSUFBSW9mLHNCQUFhLENBQUMsQ0FBQyxDQUFDdEgsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1VBQ3BGMUUsSUFBSSxDQUFDaU0sWUFBWSxHQUFHLE1BQU1qTSxJQUFJLENBQUN1QixNQUFNLENBQUMxYyxXQUFXLENBQUMsQ0FBQztVQUNuRG1iLElBQUksQ0FBQzJMLFVBQVUsRUFBRTtVQUNqQjtRQUNGOztRQUVBO1FBQ0EsSUFBSWxqQixNQUFNLEdBQUcsTUFBTXVYLElBQUksQ0FBQ3VCLE1BQU0sQ0FBQy9ZLFNBQVMsQ0FBQyxDQUFDO1FBQzFDLElBQUl3WCxJQUFJLENBQUMrTCxVQUFVLEtBQUt0akIsTUFBTSxFQUFFO1VBQzlCLEtBQUssSUFBSXdMLENBQUMsR0FBRytMLElBQUksQ0FBQytMLFVBQVUsRUFBRTlYLENBQUMsR0FBR3hMLE1BQU0sRUFBRXdMLENBQUMsRUFBRSxFQUFFLE1BQU0rTCxJQUFJLENBQUNrTSxVQUFVLENBQUNqWSxDQUFDLENBQUM7VUFDdkUrTCxJQUFJLENBQUMrTCxVQUFVLEdBQUd0akIsTUFBTTtRQUMxQjs7UUFFQTtRQUNBLElBQUkwakIsU0FBUyxHQUFHMWlCLElBQUksQ0FBQzJpQixHQUFHLENBQUMsQ0FBQyxFQUFFM2pCLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFDLElBQUk0akIsU0FBUyxHQUFHLE1BQU1yTSxJQUFJLENBQUN1QixNQUFNLENBQUMzVSxNQUFNLENBQUMsSUFBSW9mLHNCQUFhLENBQUMsQ0FBQyxDQUFDdEgsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDNEgsWUFBWSxDQUFDSCxTQUFTLENBQUMsQ0FBQ0ksaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7O1FBRS9IO1FBQ0EsSUFBSUMsb0JBQW9CLEdBQUcsRUFBRTtRQUM3QixLQUFLLElBQUlDLFlBQVksSUFBSXpNLElBQUksQ0FBQ3NMLGFBQWEsRUFBRTtVQUMzQyxJQUFJdEwsSUFBSSxDQUFDN1IsS0FBSyxDQUFDa2UsU0FBUyxFQUFFSSxZQUFZLENBQUNoZCxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUtyUSxTQUFTLEVBQUU7WUFDL0RvdEIsb0JBQW9CLENBQUN2bUIsSUFBSSxDQUFDd21CLFlBQVksQ0FBQ2hkLE9BQU8sQ0FBQyxDQUFDLENBQUM7VUFDbkQ7UUFDRjs7UUFFQTtRQUNBdVEsSUFBSSxDQUFDc0wsYUFBYSxHQUFHZSxTQUFTOztRQUU5QjtRQUNBLElBQUlLLFdBQVcsR0FBR0Ysb0JBQW9CLENBQUNyaUIsTUFBTSxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsTUFBTTZWLElBQUksQ0FBQ3VCLE1BQU0sQ0FBQzNVLE1BQU0sQ0FBQyxJQUFJb2Ysc0JBQWEsQ0FBQyxDQUFDLENBQUN0SCxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM0SCxZQUFZLENBQUNILFNBQVMsQ0FBQyxDQUFDUSxTQUFTLENBQUNILG9CQUFvQixDQUFDLENBQUNELGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDOztRQUUzTTtRQUNBLEtBQUssSUFBSUssUUFBUSxJQUFJUCxTQUFTLEVBQUU7VUFDOUIsSUFBSVEsU0FBUyxHQUFHRCxRQUFRLENBQUN6ZCxjQUFjLENBQUMsQ0FBQyxHQUFHNlEsSUFBSSxDQUFDd0wsMEJBQTBCLEdBQUd4TCxJQUFJLENBQUN1TCw0QkFBNEI7VUFDL0csSUFBSXVCLFdBQVcsR0FBRyxDQUFDRCxTQUFTLENBQUNsdkIsR0FBRyxDQUFDaXZCLFFBQVEsQ0FBQ25kLE9BQU8sQ0FBQyxDQUFDLENBQUM7VUFDcERvZCxTQUFTLENBQUN6ZSxHQUFHLENBQUN3ZSxRQUFRLENBQUNuZCxPQUFPLENBQUMsQ0FBQyxDQUFDO1VBQ2pDLElBQUlxZCxXQUFXLEVBQUUsTUFBTTlNLElBQUksQ0FBQytNLGFBQWEsQ0FBQ0gsUUFBUSxDQUFDO1FBQ3JEOztRQUVBO1FBQ0EsS0FBSyxJQUFJSSxVQUFVLElBQUlOLFdBQVcsRUFBRTtVQUNsQzFNLElBQUksQ0FBQ3VMLDRCQUE0QixDQUFDMEIsTUFBTSxDQUFDRCxVQUFVLENBQUN2ZCxPQUFPLENBQUMsQ0FBQyxDQUFDO1VBQzlEdVEsSUFBSSxDQUFDd0wsMEJBQTBCLENBQUN5QixNQUFNLENBQUNELFVBQVUsQ0FBQ3ZkLE9BQU8sQ0FBQyxDQUFDLENBQUM7VUFDNUQsTUFBTXVRLElBQUksQ0FBQytNLGFBQWEsQ0FBQ0MsVUFBVSxDQUFDO1FBQ3RDOztRQUVBO1FBQ0EsTUFBTWhOLElBQUksQ0FBQ2tOLHVCQUF1QixDQUFDLENBQUM7UUFDcENsTixJQUFJLENBQUMyTCxVQUFVLEVBQUU7TUFDbkIsQ0FBQyxDQUFDLE9BQU8xcEIsR0FBUSxFQUFFO1FBQ2pCK2QsSUFBSSxDQUFDMkwsVUFBVSxFQUFFO1FBQ2pCdmMsT0FBTyxDQUFDQyxLQUFLLENBQUMsNEJBQTRCLElBQUcsTUFBTTJRLElBQUksQ0FBQ3VCLE1BQU0sQ0FBQ25oQixPQUFPLENBQUMsQ0FBQyxFQUFDO01BQzNFO0lBQ0YsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBZ0I4ckIsVUFBVUEsQ0FBQ3pqQixNQUFNLEVBQUU7SUFDakMsS0FBSyxJQUFJL0ksUUFBUSxJQUFJLElBQUksQ0FBQzZoQixNQUFNLENBQUM5aEIsWUFBWSxDQUFDLENBQUMsRUFBRSxNQUFNQyxRQUFRLENBQUN3c0IsVUFBVSxDQUFDempCLE1BQU0sQ0FBQztFQUNwRjs7RUFFQSxNQUFnQnNrQixhQUFhQSxDQUFDeGUsRUFBRSxFQUFFOztJQUVoQztJQUNBLElBQUlBLEVBQUUsQ0FBQzZGLG1CQUFtQixDQUFDLENBQUMsS0FBS2hWLFNBQVMsRUFBRTtNQUMxQyxJQUFBNEYsZUFBTSxFQUFDdUosRUFBRSxDQUFDb1osU0FBUyxDQUFDLENBQUMsS0FBS3ZvQixTQUFTLENBQUM7TUFDcEMsSUFBSTJQLE1BQU0sR0FBRyxJQUFJK1ksMkJBQWtCLENBQUMsQ0FBQztNQUNoQ25ULFNBQVMsQ0FBQ3BHLEVBQUUsQ0FBQzZGLG1CQUFtQixDQUFDLENBQUMsQ0FBQ3ZCLFNBQVMsQ0FBQyxDQUFDLEdBQUd0RSxFQUFFLENBQUM0ZSxNQUFNLENBQUMsQ0FBQyxDQUFDO01BQzdEOWxCLGVBQWUsQ0FBQ2tILEVBQUUsQ0FBQzZGLG1CQUFtQixDQUFDLENBQUMsQ0FBQzdJLGVBQWUsQ0FBQyxDQUFDLENBQUM7TUFDM0QwZCxrQkFBa0IsQ0FBQzFhLEVBQUUsQ0FBQzZGLG1CQUFtQixDQUFDLENBQUMsQ0FBQzVCLG9CQUFvQixDQUFDLENBQUMsQ0FBQ3JJLE1BQU0sS0FBSyxDQUFDLEdBQUdvRSxFQUFFLENBQUM2RixtQkFBbUIsQ0FBQyxDQUFDLENBQUM1QixvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUdwVCxTQUFTLENBQUMsQ0FBQztNQUFBLENBQ2xKaW5CLEtBQUssQ0FBQzlYLEVBQUUsQ0FBQztNQUNkQSxFQUFFLENBQUNxWixTQUFTLENBQUMsQ0FBQzdZLE1BQU0sQ0FBQyxDQUFDO01BQ3RCLEtBQUssSUFBSXJQLFFBQVEsSUFBSSxJQUFJLENBQUM2aEIsTUFBTSxDQUFDOWhCLFlBQVksQ0FBQyxDQUFDLEVBQUUsTUFBTUMsUUFBUSxDQUFDMHRCLGFBQWEsQ0FBQ3JlLE1BQU0sQ0FBQztJQUN2Rjs7SUFFQTtJQUNBLElBQUlSLEVBQUUsQ0FBQ3FRLG9CQUFvQixDQUFDLENBQUMsS0FBS3hmLFNBQVMsRUFBRTtNQUMzQyxJQUFJbVAsRUFBRSxDQUFDMEIsVUFBVSxDQUFDLENBQUMsS0FBSzdRLFNBQVMsSUFBSW1QLEVBQUUsQ0FBQzBCLFVBQVUsQ0FBQyxDQUFDLENBQUM5RixNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUU7UUFDakUsS0FBSyxJQUFJNEUsTUFBTSxJQUFJUixFQUFFLENBQUMwQixVQUFVLENBQUMsQ0FBQyxFQUFFO1VBQ2xDLEtBQUssSUFBSXZRLFFBQVEsSUFBSSxJQUFJLENBQUM2aEIsTUFBTSxDQUFDOWhCLFlBQVksQ0FBQyxDQUFDLEVBQUUsTUFBTUMsUUFBUSxDQUFDMnRCLGdCQUFnQixDQUFDdGUsTUFBTSxDQUFDO1FBQzFGO01BQ0YsQ0FBQyxNQUFNLENBQUU7UUFDUCxJQUFJSCxPQUFPLEdBQUcsRUFBRTtRQUNoQixLQUFLLElBQUlWLFFBQVEsSUFBSUssRUFBRSxDQUFDcVEsb0JBQW9CLENBQUMsQ0FBQyxFQUFFO1VBQzlDaFEsT0FBTyxDQUFDM0ksSUFBSSxDQUFDLElBQUk2aEIsMkJBQWtCLENBQUMsQ0FBQztVQUNoQ3pnQixlQUFlLENBQUM2RyxRQUFRLENBQUMzQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1VBQzNDMGQsa0JBQWtCLENBQUMvYSxRQUFRLENBQUNnVixrQkFBa0IsQ0FBQyxDQUFDLENBQUM7VUFDakR2TyxTQUFTLENBQUN6RyxRQUFRLENBQUMyRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1VBQy9Cd1QsS0FBSyxDQUFDOVgsRUFBRSxDQUFDLENBQUM7UUFDakI7UUFDQUEsRUFBRSxDQUFDNmIsVUFBVSxDQUFDeGIsT0FBTyxDQUFDO1FBQ3RCLEtBQUssSUFBSWxQLFFBQVEsSUFBSSxJQUFJLENBQUM2aEIsTUFBTSxDQUFDOWhCLFlBQVksQ0FBQyxDQUFDLEVBQUU7VUFDL0MsS0FBSyxJQUFJc1AsTUFBTSxJQUFJUixFQUFFLENBQUMwQixVQUFVLENBQUMsQ0FBQyxFQUFFLE1BQU12USxRQUFRLENBQUMydEIsZ0JBQWdCLENBQUN0ZSxNQUFNLENBQUM7UUFDN0U7TUFDRjtJQUNGO0VBQ0Y7O0VBRVVaLEtBQUtBLENBQUNKLEdBQUcsRUFBRThKLE1BQU0sRUFBRTtJQUMzQixLQUFLLElBQUl0SixFQUFFLElBQUlSLEdBQUcsRUFBRSxJQUFJOEosTUFBTSxLQUFLdEosRUFBRSxDQUFDa0IsT0FBTyxDQUFDLENBQUMsRUFBRSxPQUFPbEIsRUFBRTtJQUMxRCxPQUFPblAsU0FBUztFQUNsQjs7RUFFQSxNQUFnQjh0Qix1QkFBdUJBLENBQUEsRUFBRztJQUN4QyxJQUFJSSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMvTCxNQUFNLENBQUMxYyxXQUFXLENBQUMsQ0FBQztJQUM5QyxJQUFJeW9CLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUNyQixZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUlxQixRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDckIsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFO01BQ2hGLElBQUksQ0FBQ0EsWUFBWSxHQUFHcUIsUUFBUTtNQUM1QixLQUFLLElBQUk1dEIsUUFBUSxJQUFJLE1BQU0sSUFBSSxDQUFDNmhCLE1BQU0sQ0FBQzloQixZQUFZLENBQUMsQ0FBQyxFQUFFLE1BQU1DLFFBQVEsQ0FBQzZ0QixpQkFBaUIsQ0FBQ0QsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFQSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDakgsT0FBTyxJQUFJO0lBQ2I7SUFDQSxPQUFPLEtBQUs7RUFDZDtBQUNGIn0=