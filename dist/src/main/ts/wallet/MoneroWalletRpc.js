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
    try {
      return await new Promise(function (resolve, reject) {

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWNjb3VudCIsIl9Nb25lcm9BY2NvdW50VGFnIiwiX01vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQmxvY2tIZWFkZXIiLCJfTW9uZXJvQ2hlY2tSZXNlcnZlIiwiX01vbmVyb0NoZWNrVHgiLCJfTW9uZXJvRGVzdGluYXRpb24iLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ0luZm8iLCJfTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiX01vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFF1ZXJ5IiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1JwY0Vycm9yIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvU3luY1Jlc3VsdCIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldExpc3RlbmVyIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfVGhyZWFkUG9vbCIsIl9Tc2xPcHRpb25zIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwibm9kZUludGVyb3AiLCJXZWFrTWFwIiwiY2FjaGVCYWJlbEludGVyb3AiLCJjYWNoZU5vZGVJbnRlcm9wIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJvYmoiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNhY2hlIiwiaGFzIiwiZ2V0IiwibmV3T2JqIiwiaGFzUHJvcGVydHlEZXNjcmlwdG9yIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJrZXkiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJkZXNjIiwic2V0IiwiTW9uZXJvV2FsbGV0UnBjIiwiTW9uZXJvV2FsbGV0IiwiREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwiYWRkcmVzc0NhY2hlIiwic3luY1BlcmlvZEluTXMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRTZXJ2ZXIiLCJvcGVuV2FsbGV0IiwicGF0aE9yQ29uZmlnIiwicGFzc3dvcmQiLCJNb25lcm9XYWxsZXRDb25maWciLCJwYXRoIiwiZ2V0UGF0aCIsInNlbmRKc29uUmVxdWVzdCIsImZpbGVuYW1lIiwiZ2V0UGFzc3dvcmQiLCJjbGVhciIsImdldENvbm5lY3Rpb25NYW5hZ2VyIiwic2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJzZXREYWVtb25Db25uZWN0aW9uIiwiY3JlYXRlV2FsbGV0IiwiY29uZmlnTm9ybWFsaXplZCIsImdldFNlZWQiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0TmV0d29ya1R5cGUiLCJnZXRBY2NvdW50TG9va2FoZWFkIiwiZ2V0U3ViYWRkcmVzc0xvb2thaGVhZCIsInNldFBhc3N3b3JkIiwic2V0U2VydmVyIiwiZ2V0Q29ubmVjdGlvbiIsImNyZWF0ZVdhbGxldEZyb21TZWVkIiwiY3JlYXRlV2FsbGV0RnJvbUtleXMiLCJjcmVhdGVXYWxsZXRSYW5kb20iLCJnZXRTZWVkT2Zmc2V0IiwiZ2V0UmVzdG9yZUhlaWdodCIsImdldFNhdmVDdXJyZW50IiwiZ2V0TGFuZ3VhZ2UiLCJzZXRMYW5ndWFnZSIsIkRFRkFVTFRfTEFOR1VBR0UiLCJwYXJhbXMiLCJsYW5ndWFnZSIsImVyciIsImhhbmRsZUNyZWF0ZVdhbGxldEVycm9yIiwic2VlZCIsInNlZWRfb2Zmc2V0IiwiZW5hYmxlX211bHRpc2lnX2V4cGVyaW1lbnRhbCIsImdldElzTXVsdGlzaWciLCJyZXN0b3JlX2hlaWdodCIsImF1dG9zYXZlX2N1cnJlbnQiLCJzZXRSZXN0b3JlSGVpZ2h0IiwiYWRkcmVzcyIsInZpZXdrZXkiLCJzcGVuZGtleSIsIm5hbWUiLCJtZXNzYWdlIiwiTW9uZXJvUnBjRXJyb3IiLCJnZXRDb2RlIiwiZ2V0UnBjTWV0aG9kIiwiZ2V0UnBjUGFyYW1zIiwiaXNWaWV3T25seSIsImtleV90eXBlIiwiZSIsInVyaU9yQ29ubmVjdGlvbiIsImlzVHJ1c3RlZCIsInNzbE9wdGlvbnMiLCJjb25uZWN0aW9uIiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIlNzbE9wdGlvbnMiLCJnZXRVcmkiLCJ1c2VybmFtZSIsImdldFVzZXJuYW1lIiwidHJ1c3RlZCIsInNzbF9zdXBwb3J0Iiwic3NsX3ByaXZhdGVfa2V5X3BhdGgiLCJnZXRQcml2YXRlS2V5UGF0aCIsInNzbF9jZXJ0aWZpY2F0ZV9wYXRoIiwiZ2V0Q2VydGlmaWNhdGVQYXRoIiwic3NsX2NhX2ZpbGUiLCJnZXRDZXJ0aWZpY2F0ZUF1dGhvcml0eUZpbGUiLCJzc2xfYWxsb3dlZF9maW5nZXJwcmludHMiLCJnZXRBbGxvd2VkRmluZ2VycHJpbnRzIiwic3NsX2FsbG93X2FueV9jZXJ0IiwiZ2V0QWxsb3dBbnlDZXJ0IiwiZGFlbW9uQ29ubmVjdGlvbiIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJnZXRCYWxhbmNlcyIsImFjY291bnRJZHgiLCJzdWJhZGRyZXNzSWR4IiwiYXNzZXJ0IiwiZXF1YWwiLCJiYWxhbmNlIiwiQmlnSW50IiwidW5sb2NrZWRCYWxhbmNlIiwiYWNjb3VudCIsImdldEFjY291bnRzIiwiZ2V0QmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsImFjY291bnRfaW5kZXgiLCJhZGRyZXNzX2luZGljZXMiLCJyZXNwIiwicmVzdWx0IiwidW5sb2NrZWRfYmFsYW5jZSIsInBlcl9zdWJhZGRyZXNzIiwiYWRkTGlzdGVuZXIiLCJyZWZyZXNoTGlzdGVuaW5nIiwiaXNDb25uZWN0ZWRUb0RhZW1vbiIsImNoZWNrUmVzZXJ2ZVByb29mIiwiaW5kZXhPZiIsImdldFZlcnNpb24iLCJNb25lcm9WZXJzaW9uIiwidmVyc2lvbiIsInJlbGVhc2UiLCJnZXRTZWVkTGFuZ3VhZ2UiLCJnZXRTZWVkTGFuZ3VhZ2VzIiwibGFuZ3VhZ2VzIiwiZ2V0QWRkcmVzcyIsInN1YmFkZHJlc3NNYXAiLCJnZXRTdWJhZGRyZXNzZXMiLCJnZXRBZGRyZXNzSW5kZXgiLCJzdWJhZGRyZXNzIiwiTW9uZXJvU3ViYWRkcmVzcyIsInNldEFjY291bnRJbmRleCIsImluZGV4IiwibWFqb3IiLCJzZXRJbmRleCIsIm1pbm9yIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJpbnRlZ3JhdGVkQWRkcmVzc1N0ciIsInN0YW5kYXJkX2FkZHJlc3MiLCJwYXltZW50X2lkIiwiaW50ZWdyYXRlZF9hZGRyZXNzIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbmNsdWRlcyIsImludGVncmF0ZWRBZGRyZXNzIiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJzZXRTdGFuZGFyZEFkZHJlc3MiLCJzZXRQYXltZW50SWQiLCJzZXRJbnRlZ3JhdGVkQWRkcmVzcyIsImdldEhlaWdodCIsImhlaWdodCIsImdldERhZW1vbkhlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsInN5bmMiLCJsaXN0ZW5lck9yU3RhcnRIZWlnaHQiLCJzdGFydEhlaWdodCIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwic3RhcnRfaGVpZ2h0IiwicG9sbCIsIk1vbmVyb1N5bmNSZXN1bHQiLCJibG9ja3NfZmV0Y2hlZCIsInJlY2VpdmVkX21vbmV5Iiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluU2Vjb25kcyIsIk1hdGgiLCJyb3VuZCIsImVuYWJsZSIsInBlcmlvZCIsIndhbGxldFBvbGxlciIsInNldFBlcmlvZEluTXMiLCJnZXRTeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwibGVuZ3RoIiwidHhpZHMiLCJyZXNjYW5TcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwic2tpcEJhbGFuY2VzIiwiYWNjb3VudHMiLCJycGNBY2NvdW50Iiwic3ViYWRkcmVzc19hY2NvdW50cyIsImNvbnZlcnRScGNBY2NvdW50Iiwic2V0U3ViYWRkcmVzc2VzIiwiZ2V0SW5kZXgiLCJwdXNoIiwic2V0QmFsYW5jZSIsInNldFVubG9ja2VkQmFsYW5jZSIsInNldE51bVVuc3BlbnRPdXRwdXRzIiwic2V0TnVtQmxvY2tzVG9VbmxvY2siLCJhbGxfYWNjb3VudHMiLCJycGNTdWJhZGRyZXNzIiwiY29udmVydFJwY1N1YmFkZHJlc3MiLCJnZXRBY2NvdW50SW5kZXgiLCJ0Z3RTdWJhZGRyZXNzIiwiZ2V0TnVtVW5zcGVudE91dHB1dHMiLCJnZXRBY2NvdW50IiwiRXJyb3IiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJNb25lcm9BY2NvdW50IiwicHJpbWFyeUFkZHJlc3MiLCJzdWJhZGRyZXNzSW5kaWNlcyIsImFkZHJlc3NfaW5kZXgiLCJsaXN0aWZ5Iiwic3ViYWRkcmVzc2VzIiwiYWRkcmVzc2VzIiwiZ2V0TnVtQmxvY2tzVG9VbmxvY2siLCJnZXRTdWJhZGRyZXNzIiwiY3JlYXRlU3ViYWRkcmVzcyIsInNldEFkZHJlc3MiLCJzZXRMYWJlbCIsInNldElzVXNlZCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwicXVlcnlOb3JtYWxpemVkIiwibm9ybWFsaXplVHhRdWVyeSIsInRyYW5zZmVyUXVlcnkiLCJnZXRUcmFuc2ZlclF1ZXJ5IiwiaW5wdXRRdWVyeSIsImdldElucHV0UXVlcnkiLCJvdXRwdXRRdWVyeSIsImdldE91dHB1dFF1ZXJ5Iiwic2V0VHJhbnNmZXJRdWVyeSIsInNldElucHV0UXVlcnkiLCJzZXRPdXRwdXRRdWVyeSIsInRyYW5zZmVycyIsImdldFRyYW5zZmVyc0F1eCIsIk1vbmVyb1RyYW5zZmVyUXVlcnkiLCJzZXRUeFF1ZXJ5IiwiZGVjb250ZXh0dWFsaXplIiwiY29weSIsInR4cyIsInR4c1NldCIsIlNldCIsInRyYW5zZmVyIiwiZ2V0VHgiLCJhZGQiLCJ0eE1hcCIsImJsb2NrTWFwIiwidHgiLCJtZXJnZVR4IiwiZ2V0SW5jbHVkZU91dHB1dHMiLCJvdXRwdXRRdWVyeUF1eCIsIk1vbmVyb091dHB1dFF1ZXJ5Iiwib3V0cHV0cyIsImdldE91dHB1dHNBdXgiLCJvdXRwdXRUeHMiLCJvdXRwdXQiLCJ0eHNRdWVyaWVkIiwibWVldHNDcml0ZXJpYSIsImdldEJsb2NrIiwic3BsaWNlIiwiZ2V0SXNDb25maXJtZWQiLCJjb25zb2xlIiwiZXJyb3IiLCJnZXRIYXNoZXMiLCJ0eHNCeUlkIiwiTWFwIiwiZ2V0SGFzaCIsIm9yZGVyZWRUeHMiLCJoYXNoIiwiZ2V0VHJhbnNmZXJzIiwibm9ybWFsaXplVHJhbnNmZXJRdWVyeSIsImlzQ29udGV4dHVhbCIsImdldFR4UXVlcnkiLCJmaWx0ZXJUcmFuc2ZlcnMiLCJnZXRPdXRwdXRzIiwibm9ybWFsaXplT3V0cHV0UXVlcnkiLCJmaWx0ZXJPdXRwdXRzIiwiZXhwb3J0T3V0cHV0cyIsImFsbCIsIm91dHB1dHNfZGF0YV9oZXgiLCJpbXBvcnRPdXRwdXRzIiwib3V0cHV0c0hleCIsIm51bV9pbXBvcnRlZCIsImV4cG9ydEtleUltYWdlcyIsInJwY0V4cG9ydEtleUltYWdlcyIsImltcG9ydEtleUltYWdlcyIsImtleUltYWdlcyIsInJwY0tleUltYWdlcyIsIm1hcCIsImtleUltYWdlIiwia2V5X2ltYWdlIiwiZ2V0SGV4Iiwic2lnbmF0dXJlIiwiZ2V0U2lnbmF0dXJlIiwic2lnbmVkX2tleV9pbWFnZXMiLCJpbXBvcnRSZXN1bHQiLCJNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsInNldEhlaWdodCIsInNldFNwZW50QW1vdW50Iiwic3BlbnQiLCJzZXRVbnNwZW50QW1vdW50IiwidW5zcGVudCIsImdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0IiwiZnJlZXplT3V0cHV0IiwidGhhd091dHB1dCIsImlzT3V0cHV0RnJvemVuIiwiZnJvemVuIiwiY3JlYXRlVHhzIiwibm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnIiwiZ2V0Q2FuU3BsaXQiLCJzZXRDYW5TcGxpdCIsImdldFJlbGF5IiwiaXNNdWx0aXNpZyIsImdldFN1YmFkZHJlc3NJbmRpY2VzIiwic2xpY2UiLCJkZXN0aW5hdGlvbnMiLCJkZXN0aW5hdGlvbiIsImdldERlc3RpbmF0aW9ucyIsImdldEFtb3VudCIsImFtb3VudCIsInRvU3RyaW5nIiwiZ2V0U3VidHJhY3RGZWVGcm9tIiwic3VidHJhY3RfZmVlX2Zyb21fb3V0cHV0cyIsInN1YmFkZHJfaW5kaWNlcyIsImdldFBheW1lbnRJZCIsImdldFVubG9ja1RpbWUiLCJ1bmxvY2tfdGltZSIsImRvX25vdF9yZWxheSIsImdldFByaW9yaXR5IiwicHJpb3JpdHkiLCJnZXRfdHhfaGV4IiwiZ2V0X3R4X21ldGFkYXRhIiwiZ2V0X3R4X2tleXMiLCJnZXRfdHhfa2V5IiwibnVtVHhzIiwiZmVlX2xpc3QiLCJmZWUiLCJjb3B5RGVzdGluYXRpb25zIiwiaSIsIk1vbmVyb1R4V2FsbGV0IiwiaW5pdFNlbnRUeFdhbGxldCIsImdldE91dGdvaW5nVHJhbnNmZXIiLCJzZXRTdWJhZGRyZXNzSW5kaWNlcyIsImNvbnZlcnRScGNTZW50VHhzVG9UeFNldCIsImNvbnZlcnRScGNUeFRvVHhTZXQiLCJzd2VlcE91dHB1dCIsIm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnIiwiZ2V0S2V5SW1hZ2UiLCJzZXRBbW91bnQiLCJzd2VlcFVubG9ja2VkIiwibm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyIsImluZGljZXMiLCJrZXlzIiwic2V0U3dlZXBFYWNoU3ViYWRkcmVzcyIsImdldFN3ZWVwRWFjaFN1YmFkZHJlc3MiLCJycGNTd2VlcEFjY291bnQiLCJzd2VlcER1c3QiLCJyZWxheSIsInR4U2V0Iiwic2V0SXNSZWxheWVkIiwic2V0SW5UeFBvb2wiLCJnZXRJc1JlbGF5ZWQiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiQXJyYXkiLCJpc0FycmF5IiwidHhPck1ldGFkYXRhIiwibWV0YWRhdGEiLCJnZXRNZXRhZGF0YSIsImhleCIsInR4X2hhc2giLCJkZXNjcmliZVR4U2V0IiwidW5zaWduZWRfdHhzZXQiLCJnZXRVbnNpZ25lZFR4SGV4IiwibXVsdGlzaWdfdHhzZXQiLCJnZXRNdWx0aXNpZ1R4SGV4IiwiY29udmVydFJwY0Rlc2NyaWJlVHJhbnNmZXIiLCJzaWduVHhzIiwidW5zaWduZWRUeEhleCIsImV4cG9ydF9yYXciLCJzdWJtaXRUeHMiLCJzaWduZWRUeEhleCIsInR4X2RhdGFfaGV4IiwidHhfaGFzaF9saXN0Iiwic2lnbk1lc3NhZ2UiLCJzaWduYXR1cmVUeXBlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJTSUdOX1dJVEhfU1BFTkRfS0VZIiwiZGF0YSIsInNpZ25hdHVyZV90eXBlIiwidmVyaWZ5TWVzc2FnZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJnb29kIiwiaXNHb29kIiwiaXNPbGQiLCJvbGQiLCJTSUdOX1dJVEhfVklFV19LRVkiLCJnZXRUeEtleSIsInR4SGFzaCIsInR4aWQiLCJ0eF9rZXkiLCJjaGVja1R4S2V5IiwidHhLZXkiLCJjaGVjayIsIk1vbmVyb0NoZWNrVHgiLCJzZXRJc0dvb2QiLCJzZXROdW1Db25maXJtYXRpb25zIiwiY29uZmlybWF0aW9ucyIsImluX3Bvb2wiLCJzZXRSZWNlaXZlZEFtb3VudCIsInJlY2VpdmVkIiwiZ2V0VHhQcm9vZiIsImNoZWNrVHhQcm9vZiIsImdldFNwZW5kUHJvb2YiLCJjaGVja1NwZW5kUHJvb2YiLCJnZXRSZXNlcnZlUHJvb2ZXYWxsZXQiLCJnZXRSZXNlcnZlUHJvb2ZBY2NvdW50IiwiTW9uZXJvQ2hlY2tSZXNlcnZlIiwic2V0VW5jb25maXJtZWRTcGVudEFtb3VudCIsInNldFRvdGFsQW1vdW50IiwidG90YWwiLCJnZXRUeE5vdGVzIiwibm90ZXMiLCJzZXRUeE5vdGVzIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiZW50cmllcyIsInJwY0VudHJ5IiwiTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsInNldERlc2NyaXB0aW9uIiwiZGVzY3JpcHRpb24iLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJzZXRfYWRkcmVzcyIsInNldF9kZXNjcmlwdGlvbiIsImRlbGV0ZUFkZHJlc3NCb29rRW50cnkiLCJlbnRyeUlkeCIsInRhZ0FjY291bnRzIiwiYWNjb3VudEluZGljZXMiLCJ1bnRhZ0FjY291bnRzIiwiZ2V0QWNjb3VudFRhZ3MiLCJ0YWdzIiwiYWNjb3VudF90YWdzIiwicnBjQWNjb3VudFRhZyIsIk1vbmVyb0FjY291bnRUYWciLCJzZXRBY2NvdW50VGFnTGFiZWwiLCJnZXRQYXltZW50VXJpIiwicmVjaXBpZW50X25hbWUiLCJnZXRSZWNpcGllbnROYW1lIiwidHhfZGVzY3JpcHRpb24iLCJnZXROb3RlIiwidXJpIiwicGFyc2VQYXltZW50VXJpIiwiTW9uZXJvVHhDb25maWciLCJzZXRSZWNpcGllbnROYW1lIiwic2V0Tm90ZSIsImdldEF0dHJpYnV0ZSIsInZhbHVlIiwic2V0QXR0cmlidXRlIiwidmFsIiwic3RhcnRNaW5pbmciLCJudW1UaHJlYWRzIiwiYmFja2dyb3VuZE1pbmluZyIsImlnbm9yZUJhdHRlcnkiLCJ0aHJlYWRzX2NvdW50IiwiZG9fYmFja2dyb3VuZF9taW5pbmciLCJpZ25vcmVfYmF0dGVyeSIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwibXVsdGlzaWdfaW1wb3J0X25lZWRlZCIsImdldE11bHRpc2lnSW5mbyIsImluZm8iLCJNb25lcm9NdWx0aXNpZ0luZm8iLCJzZXRJc011bHRpc2lnIiwibXVsdGlzaWciLCJzZXRJc1JlYWR5IiwicmVhZHkiLCJzZXRUaHJlc2hvbGQiLCJ0aHJlc2hvbGQiLCJzZXROdW1QYXJ0aWNpcGFudHMiLCJwcmVwYXJlTXVsdGlzaWciLCJtdWx0aXNpZ19pbmZvIiwibWFrZU11bHRpc2lnIiwibXVsdGlzaWdIZXhlcyIsImV4Y2hhbmdlTXVsdGlzaWdLZXlzIiwibXNSZXN1bHQiLCJNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQiLCJzZXRNdWx0aXNpZ0hleCIsImdldE11bHRpc2lnSGV4IiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJpbXBvcnRNdWx0aXNpZ0hleCIsIm5fb3V0cHV0cyIsInNpZ25NdWx0aXNpZ1R4SGV4IiwibXVsdGlzaWdUeEhleCIsInNpZ25SZXN1bHQiLCJNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJzZXRTaWduZWRNdWx0aXNpZ1R4SGV4Iiwic2V0VHhIYXNoZXMiLCJzdWJtaXRNdWx0aXNpZ1R4SGV4Iiwic2lnbmVkTXVsdGlzaWdUeEhleCIsImNoYW5nZVBhc3N3b3JkIiwib2xkUGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsIm9sZF9wYXNzd29yZCIsIm5ld19wYXNzd29yZCIsInNhdmUiLCJjbG9zZSIsImlzQ2xvc2VkIiwic3RvcCIsImdldEluY29taW5nVHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlcnMiLCJjcmVhdGVUeCIsInJlbGF5VHgiLCJnZXRUeE5vdGUiLCJzZXRUeE5vdGUiLCJub3RlIiwiY29ubmVjdFRvV2FsbGV0UnBjIiwidXJpT3JDb25maWciLCJub3JtYWxpemVDb25maWciLCJjbWQiLCJzdGFydFdhbGxldFJwY1Byb2Nlc3MiLCJjaGlsZF9wcm9jZXNzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aGVuIiwic3Bhd24iLCJzdGRvdXQiLCJzZXRFbmNvZGluZyIsInN0ZGVyciIsInRoYXQiLCJyZWplY3QiLCJvbiIsImxpbmUiLCJMaWJyYXJ5VXRpbHMiLCJsb2ciLCJ1cmlMaW5lQ29udGFpbnMiLCJ1cmlMaW5lQ29udGFpbnNJZHgiLCJob3N0Iiwic3Vic3RyaW5nIiwibGFzdEluZGV4T2YiLCJ1bmZvcm1hdHRlZExpbmUiLCJyZXBsYWNlIiwidHJpbSIsInBvcnQiLCJzc2xJZHgiLCJzc2xFbmFibGVkIiwidG9Mb3dlckNhc2UiLCJ1c2VyUGFzc0lkeCIsInVzZXJQYXNzIiwicmVqZWN0VW5hdXRob3JpemVkIiwiZ2V0UmVqZWN0VW5hdXRob3JpemVkIiwid2FsbGV0IiwiaXNSZXNvbHZlZCIsImdldExvZ0xldmVsIiwiY29kZSIsIm9yaWdpbiIsImdldEFjY291bnRJbmRpY2VzIiwidHhRdWVyeSIsImNhbkJlQ29uZmlybWVkIiwiZ2V0SW5UeFBvb2wiLCJnZXRJc0ZhaWxlZCIsImNhbkJlSW5UeFBvb2wiLCJnZXRNYXhIZWlnaHQiLCJnZXRJc0xvY2tlZCIsImNhbkJlSW5jb21pbmciLCJnZXRJc0luY29taW5nIiwiZ2V0SXNPdXRnb2luZyIsImdldEhhc0Rlc3RpbmF0aW9ucyIsImNhbkJlT3V0Z29pbmciLCJpbiIsIm91dCIsInBvb2wiLCJwZW5kaW5nIiwiZmFpbGVkIiwiZ2V0TWluSGVpZ2h0IiwibWluX2hlaWdodCIsIm1heF9oZWlnaHQiLCJmaWx0ZXJfYnlfaGVpZ2h0IiwiZ2V0U3ViYWRkcmVzc0luZGV4Iiwic2l6ZSIsImZyb20iLCJycGNUeCIsImNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlciIsImdldE91dGdvaW5nQW1vdW50Iiwib3V0Z29pbmdUcmFuc2ZlciIsInRyYW5zZmVyVG90YWwiLCJ2YWx1ZXMiLCJzb3J0IiwiY29tcGFyZVR4c0J5SGVpZ2h0Iiwic2V0SXNJbmNvbWluZyIsInNldElzT3V0Z29pbmciLCJjb21wYXJlSW5jb21pbmdUcmFuc2ZlcnMiLCJ0cmFuc2Zlcl90eXBlIiwiZ2V0SXNTcGVudCIsInZlcmJvc2UiLCJycGNPdXRwdXQiLCJjb252ZXJ0UnBjVHhXYWxsZXRXaXRoT3V0cHV0IiwiY29tcGFyZU91dHB1dHMiLCJycGNJbWFnZSIsIk1vbmVyb0tleUltYWdlIiwiYmVsb3dfYW1vdW50IiwiZ2V0QmVsb3dBbW91bnQiLCJzZXRJc0xvY2tlZCIsInNldElzQ29uZmlybWVkIiwic2V0UmVsYXkiLCJzZXRJc01pbmVyVHgiLCJzZXRJc0ZhaWxlZCIsIk1vbmVyb0Rlc3RpbmF0aW9uIiwic2V0RGVzdGluYXRpb25zIiwic2V0T3V0Z29pbmdUcmFuc2ZlciIsInNldFVubG9ja1RpbWUiLCJnZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsInNldExhc3RSZWxheWVkVGltZXN0YW1wIiwiRGF0ZSIsImdldFRpbWUiLCJnZXRJc0RvdWJsZVNwZW5kU2VlbiIsInNldElzRG91YmxlU3BlbmRTZWVuIiwibGlzdGVuZXJzIiwiV2FsbGV0UG9sbGVyIiwic2V0SXNQb2xsaW5nIiwiaXNQb2xsaW5nIiwic2VydmVyIiwicHJveHlUb1dvcmtlciIsInNldFByaW1hcnlBZGRyZXNzIiwic2V0VGFnIiwiZ2V0VGFnIiwic2V0UmluZ1NpemUiLCJNb25lcm9VdGlscyIsIlJJTkdfU0laRSIsIk1vbmVyb091dGdvaW5nVHJhbnNmZXIiLCJzZXRUeCIsImRlc3RDb3BpZXMiLCJkZXN0IiwiY29udmVydFJwY1R4U2V0IiwicnBjTWFwIiwiTW9uZXJvVHhTZXQiLCJzZXRNdWx0aXNpZ1R4SGV4Iiwic2V0VW5zaWduZWRUeEhleCIsInNldFNpZ25lZFR4SGV4Iiwic2lnbmVkX3R4c2V0IiwiZ2V0U2lnbmVkVHhIZXgiLCJycGNUeHMiLCJzZXRUeHMiLCJzZXRUeFNldCIsInNldEhhc2giLCJzZXRLZXkiLCJzZXRGdWxsSGV4Iiwic2V0TWV0YWRhdGEiLCJzZXRGZWUiLCJzZXRXZWlnaHQiLCJpbnB1dEtleUltYWdlc0xpc3QiLCJhc3NlcnRUcnVlIiwiZ2V0SW5wdXRzIiwic2V0SW5wdXRzIiwiaW5wdXRLZXlJbWFnZSIsIk1vbmVyb091dHB1dFdhbGxldCIsInNldEtleUltYWdlIiwic2V0SGV4IiwiYW1vdW50c0J5RGVzdExpc3QiLCJkZXN0aW5hdGlvbklkeCIsInR4SWR4IiwiYW1vdW50c0J5RGVzdCIsImlzT3V0Z29pbmciLCJ0eXBlIiwiZGVjb2RlUnBjVHlwZSIsImhlYWRlciIsInNldFNpemUiLCJNb25lcm9CbG9ja0hlYWRlciIsInNldFRpbWVzdGFtcCIsIk1vbmVyb0luY29taW5nVHJhbnNmZXIiLCJzZXROdW1TdWdnZXN0ZWRDb25maXJtYXRpb25zIiwiREVGQVVMVF9QQVlNRU5UX0lEIiwicnBjSW5kaWNlcyIsInJwY0luZGV4Iiwic2V0U3ViYWRkcmVzc0luZGV4IiwicnBjRGVzdGluYXRpb24iLCJkZXN0aW5hdGlvbktleSIsInNldElucHV0U3VtIiwic2V0T3V0cHV0U3VtIiwic2V0Q2hhbmdlQWRkcmVzcyIsInNldENoYW5nZUFtb3VudCIsInNldE51bUR1bW15T3V0cHV0cyIsInNldEV4dHJhSGV4IiwiaW5wdXRLZXlJbWFnZXMiLCJrZXlfaW1hZ2VzIiwiYW1vdW50cyIsInNldEJsb2NrIiwiTW9uZXJvQmxvY2siLCJtZXJnZSIsInNldEluY29taW5nVHJhbnNmZXJzIiwic2V0SXNTcGVudCIsInNldElzRnJvemVuIiwic2V0U3RlYWx0aFB1YmxpY0tleSIsInNldE91dHB1dHMiLCJycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0IiwicnBjVHlwZSIsImFUeCIsImFCbG9jayIsInR4MSIsInR4MiIsImRpZmYiLCJ0MSIsInQyIiwibzEiLCJvMiIsImhlaWdodENvbXBhcmlzb24iLCJjb21wYXJlIiwibG9jYWxlQ29tcGFyZSIsImV4cG9ydHMiLCJsb29wZXIiLCJUYXNrTG9vcGVyIiwicHJldkxvY2tlZFR4cyIsInByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnMiLCJwcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucyIsInRocmVhZFBvb2wiLCJUaHJlYWRQb29sIiwibnVtUG9sbGluZyIsInN0YXJ0IiwicGVyaW9kSW5NcyIsInN1Ym1pdCIsInByZXZIZWlnaHQiLCJNb25lcm9UeFF1ZXJ5IiwicHJldkJhbGFuY2VzIiwib25OZXdCbG9jayIsIm1pbkhlaWdodCIsIm1heCIsImxvY2tlZFR4cyIsInNldE1pbkhlaWdodCIsInNldEluY2x1ZGVPdXRwdXRzIiwibm9Mb25nZXJMb2NrZWRIYXNoZXMiLCJwcmV2TG9ja2VkVHgiLCJ1bmxvY2tlZFR4cyIsInNldEhhc2hlcyIsImxvY2tlZFR4Iiwic2VhcmNoU2V0IiwidW5hbm5vdW5jZWQiLCJub3RpZnlPdXRwdXRzIiwidW5sb2NrZWRUeCIsImRlbGV0ZSIsImNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzIiwiYW5ub3VuY2VOZXdCbG9jayIsImdldEZlZSIsImFubm91bmNlT3V0cHV0U3BlbnQiLCJhbm5vdW5jZU91dHB1dFJlY2VpdmVkIiwiYmFsYW5jZXMiLCJhbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRScGMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4uL2NvbW1vbi9UYXNrTG9vcGVyXCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50XCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudFRhZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50VGFnXCI7XG5pbXBvcnQgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BZGRyZXNzQm9va0VudHJ5XCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrSGVhZGVyIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tIZWFkZXJcIjtcbmltcG9ydCBNb25lcm9DaGVja1Jlc2VydmUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tSZXNlcnZlXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvRGVzdGluYXRpb24gZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGVzdGluYXRpb25cIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbmNvbWluZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbmZvXCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5pdFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHRcIjtcbmltcG9ydCBNb25lcm9PdXRnb2luZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb091dGdvaW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1JwY0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjRXJyb3JcIjtcbmltcG9ydCBNb25lcm9TdWJhZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb1N1YmFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9TeW5jUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb1N5bmNSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyUXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVHhcIjtcbmltcG9ydCBNb25lcm9UeENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb1R4UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4U2V0XCI7XG5pbXBvcnQgTW9uZXJvVHhXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9VdGlscyBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1V0aWxzXCI7XG5pbXBvcnQgTW9uZXJvVmVyc2lvbiBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1ZlcnNpb25cIjtcbmltcG9ydCBNb25lcm9XYWxsZXQgZnJvbSBcIi4vTW9uZXJvV2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldExpc3RlbmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldExpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGVcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHRcIjtcbmltcG9ydCBUaHJlYWRQb29sIGZyb20gXCIuLi9jb21tb24vVGhyZWFkUG9vbFwiO1xuaW1wb3J0IFNzbE9wdGlvbnMgZnJvbSBcIi4uL2NvbW1vbi9Tc2xPcHRpb25zXCI7XG5pbXBvcnQgeyBDaGlsZFByb2Nlc3MgfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuXG4vKipcbiAqIENvcHlyaWdodCAoYykgd29vZHNlclxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvV2FsbGV0IGFzIGEgY2xpZW50IG9mIG1vbmVyby13YWxsZXQtcnBjLlxuICogXG4gKiBAaW1wbGVtZW50cyB7TW9uZXJvV2FsbGV0fVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9XYWxsZXRScGMgZXh0ZW5kcyBNb25lcm9XYWxsZXQge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TID0gMjAwMDA7IC8vIGRlZmF1bHQgcGVyaW9kIGJldHdlZW4gc3luY3MgaW4gbXMgKGRlZmluZWQgYnkgREVGQVVMVF9BVVRPX1JFRlJFU0hfUEVSSU9EIGluIHdhbGxldF9ycGNfc2VydmVyLmNwcClcblxuICAvLyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+O1xuICBwcm90ZWN0ZWQgYWRkcmVzc0NhY2hlOiBhbnk7XG4gIHByb3RlY3RlZCBzeW5jUGVyaW9kSW5NczogbnVtYmVyO1xuICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiBNb25lcm9XYWxsZXRMaXN0ZW5lcltdO1xuICBwcm90ZWN0ZWQgcHJvY2VzczogYW55O1xuICBwcm90ZWN0ZWQgcGF0aDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgZGFlbW9uQ29ubmVjdGlvbjogTW9uZXJvUnBjQ29ubmVjdGlvbjtcbiAgcHJvdGVjdGVkIHdhbGxldFBvbGxlcjogV2FsbGV0UG9sbGVyO1xuICBcbiAgLyoqIEBwcml2YXRlICovXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9OyAvLyBhdm9pZCB1bmVjZXNzYXJ5IHJlcXVlc3RzIGZvciBhZGRyZXNzZXNcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gTW9uZXJvV2FsbGV0UnBjLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVM7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBSUEMgV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtDaGlsZFByb2Nlc3N9IHRoZSBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvLXdhbGxldC1ycGMsIHVuZGVmaW5lZCBpZiBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXG4gICAqL1xuICBnZXRQcm9jZXNzKCk6IENoaWxkUHJvY2VzcyB7XG4gICAgcmV0dXJuIHRoaXMucHJvY2VzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3AgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm8td2FsbGV0LXJwYywgaWYgYXBwbGljYWJsZS5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2Ugc3BlY2lmaWVzIGlmIHRoZSBwcm9jZXNzIHNob3VsZCBiZSBkZXN0cm95ZWQgZm9yY2libHkgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPn0gdGhlIGV4aXQgY29kZSBmcm9tIHN0b3BwaW5nIHRoZSBwcm9jZXNzXG4gICAqL1xuICBhc3luYyBzdG9wUHJvY2Vzcyhmb3JjZSA9IGZhbHNlKTogUHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+ICB7XG4gICAgaWYgKHRoaXMucHJvY2VzcyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRScGMgaW5zdGFuY2Ugbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1wiKTtcbiAgICBsZXQgbGlzdGVuZXJzQ29weSA9IEdlblV0aWxzLmNvcHlBcnJheSh0aGlzLmdldExpc3RlbmVycygpKTtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnNDb3B5KSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gR2VuVXRpbHMua2lsbFByb2Nlc3ModGhpcy5wcm9jZXNzLCBmb3JjZSA/IFwiU0lHS0lMTFwiIDogdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgUlBDIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9uIHwgdW5kZWZpbmVkfSB0aGUgd2FsbGV0J3MgcnBjIGNvbm5lY3Rpb25cbiAgICovXG4gIGdldFJwY0Nvbm5lY3Rpb24oKTogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+T3BlbiBhbiBleGlzdGluZyB3YWxsZXQgb24gdGhlIG1vbmVyby13YWxsZXQtcnBjIHNlcnZlci48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlOjxwPlxuICAgKiBcbiAgICogPGNvZGU+XG4gICAqIGxldCB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0UnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4NFwiLCBcInJwY191c2VyXCIsIFwiYWJjMTIzXCIpOzxicj5cbiAgICogYXdhaXQgd2FsbGV0Lm9wZW5XYWxsZXQoXCJteXdhbGxldDFcIiwgXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIpOzxicj5cbiAgICogPGJyPlxuICAgKiBhd2FpdCB3YWxsZXQub3BlbldhbGxldCh7PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGF0aDogXCJteXdhbGxldDJcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VydmVyOiBcImh0dHA6Ly9sb2NhaG9zdDozODA4MVwiLCAvLyBvciBvYmplY3Qgd2l0aCB1cmksIHVzZXJuYW1lLCBwYXNzd29yZCwgZXRjIDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2U8YnI+XG4gICAqIH0pOzxicj5cbiAgICogPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvV2FsbGV0Q29uZmlnfSBwYXRoT3JDb25maWcgIC0gdGhlIHdhbGxldCdzIG5hbWUgb3IgY29uZmlndXJhdGlvbiB0byBvcGVuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoT3JDb25maWcucGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCBpbi1tZW1vcnkgd2FsbGV0IGlmIG5vdCBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhPckNvbmZpZy5wYXNzd29yZCAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IHBhdGhPckNvbmZpZy5zZXJ2ZXIgLSB1cmkgb3IgTW9uZXJvUnBjQ29ubmVjdGlvbiBvZiBhIGRhZW1vbiB0byB1c2UgKG9wdGlvbmFsLCBtb25lcm8td2FsbGV0LXJwYyB1c3VhbGx5IHN0YXJ0ZWQgd2l0aCBkYWVtb24gY29uZmlnKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3Bhc3N3b3JkXSB0aGUgd2FsbGV0J3MgcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9XYWxsZXRScGM+fSB0aGlzIHdhbGxldCBjbGllbnRcbiAgICovXG4gIGFzeW5jIG9wZW5XYWxsZXQocGF0aE9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4sIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHR5cGVvZiBwYXRoT3JDb25maWcgPT09IFwic3RyaW5nXCIgPyB7cGF0aDogcGF0aE9yQ29uZmlnLCBwYXNzd29yZDogcGFzc3dvcmQgPyBwYXNzd29yZCA6IFwiXCJ9IDogcGF0aE9yQ29uZmlnKTtcbiAgICAvLyBUT0RPOiBlbnN1cmUgb3RoZXIgZmllbGRzIHVuaW5pdGlhbGl6ZWQ/XG4gICAgXG4gICAgLy8gb3BlbiB3YWxsZXQgb24gcnBjIHNlcnZlclxuICAgIGlmICghY29uZmlnLmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIG5hbWUgb2Ygd2FsbGV0IHRvIG9wZW5cIik7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwib3Blbl93YWxsZXRcIiwge2ZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLCBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCl9KTtcbiAgICBhd2FpdCB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5wYXRoID0gY29uZmlnLmdldFBhdGgoKTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXIgb3Igc2VydmVyXG4gICAgaWYgKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpICE9IG51bGwpIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgb3BlbmVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGF3YWl0IHRoaXMuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIH0gZWxzZSBpZiAoY29uZmlnLmdldFNlcnZlcigpICE9IG51bGwpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2V0RGFlbW9uQ29ubmVjdGlvbihjb25maWcuZ2V0U2VydmVyKCkpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPkNyZWF0ZSBhbmQgb3BlbiBhIHdhbGxldCBvbiB0aGUgbW9uZXJvLXdhbGxldC1ycGMgc2VydmVyLjxwPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZTo8cD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiAmc29sOyZzb2w7IGNvbnN0cnVjdCBjbGllbnQgdG8gbW9uZXJvLXdhbGxldC1ycGM8YnI+XG4gICAqIGxldCB3YWxsZXRScGMgPSBuZXcgTW9uZXJvV2FsbGV0UnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4NFwiLCBcInJwY191c2VyXCIsIFwiYWJjMTIzXCIpOzxicj48YnI+XG4gICAqIFxuICAgKiAmc29sOyZzb2w7IGNyZWF0ZSBhbmQgb3BlbiB3YWxsZXQgb24gbW9uZXJvLXdhbGxldC1ycGM8YnI+XG4gICAqIGF3YWl0IHdhbGxldFJwYy5jcmVhdGVXYWxsZXQoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwibXl3YWxsZXRcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJhYmMxMjNcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBzZWVkOiBcImNvZXhpc3QgaWdsb28gcGFtcGhsZXQgbGFnb29uLi4uXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcmVzdG9yZUhlaWdodDogMTU0MzIxOGw8YnI+XG4gICAqIH0pO1xuICAgKiAgPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz59IGNvbmZpZyAtIE1vbmVyb1dhbGxldENvbmZpZyBvciBlcXVpdmFsZW50IEpTIG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXRoXSAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCBpbi1tZW1vcnkgd2FsbGV0IGlmIG5vdCBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGFzc3dvcmRdIC0gcGFzc3dvcmQgb2YgdGhlIHdhbGxldCB0byBjcmVhdGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZF0gLSBzZWVkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgcmFuZG9tIHdhbGxldCBjcmVhdGVkIGlmIG5laXRoZXIgc2VlZCBub3Iga2V5cyBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZE9mZnNldF0gLSB0aGUgb2Zmc2V0IHVzZWQgdG8gZGVyaXZlIGEgbmV3IHNlZWQgZnJvbSB0aGUgZ2l2ZW4gc2VlZCB0byByZWNvdmVyIGEgc2VjcmV0IHdhbGxldCBmcm9tIHRoZSBzZWVkXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5pc011bHRpc2lnXSAtIHJlc3RvcmUgbXVsdGlzaWcgd2FsbGV0IGZyb20gc2VlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcmltYXJ5QWRkcmVzc10gLSBwcmltYXJ5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9ubHkgcHJvdmlkZSBpZiByZXN0b3JpbmcgZnJvbSBrZXlzKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlVmlld0tleV0gLSBwcml2YXRlIHZpZXcga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVNwZW5kS2V5XSAtIHByaXZhdGUgc3BlbmQga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcucmVzdG9yZUhlaWdodF0gLSBibG9jayBoZWlnaHQgdG8gc3RhcnQgc2Nhbm5pbmcgZnJvbSAoZGVmYXVsdHMgdG8gMCB1bmxlc3MgZ2VuZXJhdGluZyByYW5kb20gd2FsbGV0KVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5sYW5ndWFnZV0gLSBsYW5ndWFnZSBvZiB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQgKGRlZmF1bHRzIHRvIFwiRW5nbGlzaFwiIG9yIGF1dG8tZGV0ZWN0ZWQpXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gW2NvbmZpZy5zZXJ2ZXJdIC0gTW9uZXJvUnBjQ29ubmVjdGlvbiB0byBhIG1vbmVybyBkYWVtb24gKG9wdGlvbmFsKTxicj5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyVXJpXSAtIHVyaSBvZiBhIGRhZW1vbiB0byB1c2UgKG9wdGlvbmFsLCBtb25lcm8td2FsbGV0LXJwYyB1c3VhbGx5IHN0YXJ0ZWQgd2l0aCBkYWVtb24gY29uZmlnKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZXJ2ZXJVc2VybmFtZV0gLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgZGFlbW9uIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VydmVyUGFzc3dvcmRdIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIGRhZW1vbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJ9IFtjb25maWcuY29ubmVjdGlvbk1hbmFnZXJdIC0gbWFuYWdlIGNvbm5lY3Rpb25zIHRvIG1vbmVyb2QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVqZWN0VW5hdXRob3JpemVkXSAtIHJlamVjdCBzZWxmLXNpZ25lZCBzZXJ2ZXIgY2VydGlmaWNhdGVzIGlmIHRydWUgKGRlZmF1bHRzIHRvIHRydWUpXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gW2NvbmZpZy5zZXJ2ZXJdIC0gTW9uZXJvUnBjQ29ubmVjdGlvbiBvciBlcXVpdmFsZW50IEpTIG9iamVjdCBwcm92aWRpbmcgZGFlbW9uIGNvbmZpZ3VyYXRpb24gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuc2F2ZUN1cnJlbnRdIC0gc3BlY2lmaWVzIGlmIHRoZSBjdXJyZW50IFJQQyB3YWxsZXQgc2hvdWxkIGJlIHNhdmVkIGJlZm9yZSBiZWluZyBjbG9zZWQgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHJldHVybiB7TW9uZXJvV2FsbGV0UnBjfSB0aGlzIHdhbGxldCBjbGllbnRcbiAgICovXG4gIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBjb25maWcgdG8gY3JlYXRlIHdhbGxldFwiKTtcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkICYmIChjb25maWdOb3JtYWxpemVkLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVWaWV3S2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIGluaXRpYWxpemVkIHdpdGggYSBzZWVkIG9yIGtleXMgYnV0IG5vdCBib3RoXCIpO1xuICAgIH1cbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXROZXR3b3JrVHlwZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIG5ldHdvcmtUeXBlIHdoZW4gY3JlYXRpbmcgUlBDIHdhbGxldCBiZWNhdXNlIHNlcnZlcidzIG5ldHdvcmsgdHlwZSBpcyBhbHJlYWR5IHNldFwiKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50TG9va2FoZWFkKCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NMb29rYWhlYWQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJtb25lcm8td2FsbGV0LXJwYyBkb2VzIG5vdCBzdXBwb3J0IGNyZWF0aW5nIHdhbGxldHMgd2l0aCBzdWJhZGRyZXNzIGxvb2thaGVhZCBvdmVyIHJwY1wiKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRQYXNzd29yZCgpID09PSB1bmRlZmluZWQpIGNvbmZpZ05vcm1hbGl6ZWQuc2V0UGFzc3dvcmQoXCJcIik7XG5cbiAgICAvLyBzZXQgc2VydmVyIGZyb20gY29ubmVjdGlvbiBtYW5hZ2VyIGlmIHByb3ZpZGVkXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgY3JlYXRlZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBjb25maWdOb3JtYWxpemVkLnNldFNlcnZlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKS5nZXRDb25uZWN0aW9uKCkpO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCkgYXdhaXQgdGhpcy5jcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWdOb3JtYWxpemVkKTtcbiAgICBlbHNlIGlmIChjb25maWdOb3JtYWxpemVkLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnTm9ybWFsaXplZC5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQpIGF3YWl0IHRoaXMuY3JlYXRlV2FsbGV0RnJvbUtleXMoY29uZmlnTm9ybWFsaXplZCk7XG4gICAgZWxzZSBhd2FpdCB0aGlzLmNyZWF0ZVdhbGxldFJhbmRvbShjb25maWdOb3JtYWxpemVkKTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXIgb3Igc2VydmVyXG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXRDb25uZWN0aW9uTWFuYWdlcihjb25maWdOb3JtYWxpemVkLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIH0gZWxzZSBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTZXJ2ZXIoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U2VydmVyKCkpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZVdhbGxldFJhbmRvbShjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHJlc3RvcmVIZWlnaHQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKSA9PT0gZmFsc2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkN1cnJlbnQgd2FsbGV0IGlzIHNhdmVkIGF1dG9tYXRpY2FsbHkgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmICghY29uZmlnLmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTmFtZSBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0TGFuZ3VhZ2UoKSkgY29uZmlnLnNldExhbmd1YWdlKE1vbmVyb1dhbGxldC5ERUZBVUxUX0xBTkdVQUdFKTtcbiAgICBsZXQgcGFyYW1zID0geyBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSwgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLCBsYW5ndWFnZTogY29uZmlnLmdldExhbmd1YWdlKCkgfTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY3JlYXRlX3dhbGxldFwiLCBwYXJhbXMpO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aGlzLmhhbmRsZUNyZWF0ZVdhbGxldEVycm9yKGNvbmZpZy5nZXRQYXRoKCksIGVycik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVzdG9yZV9kZXRlcm1pbmlzdGljX3dhbGxldFwiLCB7XG4gICAgICAgIGZpbGVuYW1lOiBjb25maWcuZ2V0UGF0aCgpLFxuICAgICAgICBwYXNzd29yZDogY29uZmlnLmdldFBhc3N3b3JkKCksXG4gICAgICAgIHNlZWQ6IGNvbmZpZy5nZXRTZWVkKCksXG4gICAgICAgIHNlZWRfb2Zmc2V0OiBjb25maWcuZ2V0U2VlZE9mZnNldCgpLFxuICAgICAgICBlbmFibGVfbXVsdGlzaWdfZXhwZXJpbWVudGFsOiBjb25maWcuZ2V0SXNNdWx0aXNpZygpLFxuICAgICAgICByZXN0b3JlX2hlaWdodDogY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSxcbiAgICAgICAgbGFuZ3VhZ2U6IGNvbmZpZy5nZXRMYW5ndWFnZSgpLFxuICAgICAgICBhdXRvc2F2ZV9jdXJyZW50OiBjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBrZXlzXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRSZXN0b3JlSGVpZ2h0KDApO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoTW9uZXJvV2FsbGV0LkRFRkFVTFRfTEFOR1VBR0UpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZW5lcmF0ZV9mcm9tX2tleXNcIiwge1xuICAgICAgICBmaWxlbmFtZTogY29uZmlnLmdldFBhdGgoKSxcbiAgICAgICAgcGFzc3dvcmQ6IGNvbmZpZy5nZXRQYXNzd29yZCgpLFxuICAgICAgICBhZGRyZXNzOiBjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSxcbiAgICAgICAgdmlld2tleTogY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCksXG4gICAgICAgIHNwZW5ka2V5OiBjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCksXG4gICAgICAgIHJlc3RvcmVfaGVpZ2h0OiBjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpLFxuICAgICAgICBhdXRvc2F2ZV9jdXJyZW50OiBjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRoaXMuaGFuZGxlQ3JlYXRlV2FsbGV0RXJyb3IoY29uZmlnLmdldFBhdGgoKSwgZXJyKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5jbGVhcigpO1xuICAgIHRoaXMucGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBoYW5kbGVDcmVhdGVXYWxsZXRFcnJvcihuYW1lLCBlcnIpIHtcbiAgICBpZiAoZXJyLm1lc3NhZ2UgPT09IFwiQ2Fubm90IGNyZWF0ZSB3YWxsZXQuIEFscmVhZHkgZXhpc3RzLlwiKSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoXCJXYWxsZXQgYWxyZWFkeSBleGlzdHM6IFwiICsgbmFtZSwgZXJyLmdldENvZGUoKSwgZXJyLmdldFJwY01ldGhvZCgpLCBlcnIuZ2V0UnBjUGFyYW1zKCkpO1xuICAgIGlmIChlcnIubWVzc2FnZSA9PT0gXCJFbGVjdHJ1bS1zdHlsZSB3b3JkIGxpc3QgZmFpbGVkIHZlcmlmaWNhdGlvblwiKSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoXCJJbnZhbGlkIG1uZW1vbmljXCIsIGVyci5nZXRDb2RlKCksIGVyci5nZXRScGNNZXRob2QoKSwgZXJyLmdldFJwY1BhcmFtcygpKTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbiAgXG4gIGFzeW5jIGlzVmlld09ubHkoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInF1ZXJ5X2tleVwiLCB7a2V5X3R5cGU6IFwibW5lbW9uaWNcIn0pO1xuICAgICAgcmV0dXJuIGZhbHNlOyAvLyBrZXkgcmV0cmlldmFsIHN1Y2NlZWRzIGlmIG5vdCB2aWV3IG9ubHlcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTI5KSByZXR1cm4gdHJ1ZTsgIC8vIHdhbGxldCBpcyB2aWV3IG9ubHlcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTEpIHJldHVybiBmYWxzZTsgIC8vIHdhbGxldCBpcyBvZmZsaW5lIGJ1dCBub3QgdmlldyBvbmx5XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgd2FsbGV0J3MgZGFlbW9uIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ3xNb25lcm9ScGNDb25uZWN0aW9ufSBbdXJpT3JDb25uZWN0aW9uXSAtIHRoZSBkYWVtb24ncyBVUkkgb3IgY29ubmVjdGlvbiAoZGVmYXVsdHMgdG8gb2ZmbGluZSlcbiAgICogQHBhcmFtIHtib29sZWFufSBpc1RydXN0ZWQgLSBpbmRpY2F0ZXMgaWYgdGhlIGRhZW1vbiBpbiB0cnVzdGVkXG4gICAqIEBwYXJhbSB7U3NsT3B0aW9uc30gc3NsT3B0aW9ucyAtIGN1c3RvbSBTU0wgY29uZmlndXJhdGlvblxuICAgKi9cbiAgYXN5bmMgc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24/OiBNb25lcm9ScGNDb25uZWN0aW9uIHwgc3RyaW5nLCBpc1RydXN0ZWQ/OiBib29sZWFuLCBzc2xPcHRpb25zPzogU3NsT3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCBjb25uZWN0aW9uID0gIXVyaU9yQ29ubmVjdGlvbiA/IHVuZGVmaW5lZCA6IHVyaU9yQ29ubmVjdGlvbiBpbnN0YW5jZW9mIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPyB1cmlPckNvbm5lY3Rpb24gOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24pO1xuICAgIGlmICghc3NsT3B0aW9ucykgc3NsT3B0aW9ucyA9IG5ldyBTc2xPcHRpb25zKCk7XG4gICAgbGV0IHBhcmFtczogYW55ID0ge307XG4gICAgcGFyYW1zLmFkZHJlc3MgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRVcmkoKSA6IFwiYmFkX3VyaVwiOyAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBiYWQgZGFlbW9uIHVyaSBuZWNlc3NhcnkgZm9yIG9mZmxpbmU/XG4gICAgcGFyYW1zLnVzZXJuYW1lID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA6IFwiXCI7XG4gICAgcGFyYW1zLnBhc3N3b3JkID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA6IFwiXCI7XG4gICAgcGFyYW1zLnRydXN0ZWQgPSBpc1RydXN0ZWQ7XG4gICAgcGFyYW1zLnNzbF9zdXBwb3J0ID0gXCJhdXRvZGV0ZWN0XCI7XG4gICAgcGFyYW1zLnNzbF9wcml2YXRlX2tleV9wYXRoID0gc3NsT3B0aW9ucy5nZXRQcml2YXRlS2V5UGF0aCgpO1xuICAgIHBhcmFtcy5zc2xfY2VydGlmaWNhdGVfcGF0aCAgPSBzc2xPcHRpb25zLmdldENlcnRpZmljYXRlUGF0aCgpO1xuICAgIHBhcmFtcy5zc2xfY2FfZmlsZSA9IHNzbE9wdGlvbnMuZ2V0Q2VydGlmaWNhdGVBdXRob3JpdHlGaWxlKCk7XG4gICAgcGFyYW1zLnNzbF9hbGxvd2VkX2ZpbmdlcnByaW50cyA9IHNzbE9wdGlvbnMuZ2V0QWxsb3dlZEZpbmdlcnByaW50cygpO1xuICAgIHBhcmFtcy5zc2xfYWxsb3dfYW55X2NlcnQgPSBzc2xPcHRpb25zLmdldEFsbG93QW55Q2VydCgpO1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9kYWVtb25cIiwgcGFyYW1zKTtcbiAgICB0aGlzLmRhZW1vbkNvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLmRhZW1vbkNvbm5lY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBsb2NrZWQgYW5kIHVubG9ja2VkIGJhbGFuY2VzIGluIGEgc2luZ2xlIHJlcXVlc3QuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2FjY291bnRJZHhdIGFjY291bnQgaW5kZXhcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdWJhZGRyZXNzSWR4XSBzdWJhZGRyZXNzIGluZGV4XG4gICAqIEByZXR1cm4ge1Byb21pc2U8YmlnaW50W10+fSBpcyB0aGUgbG9ja2VkIGFuZCB1bmxvY2tlZCBiYWxhbmNlcyBpbiBhbiBhcnJheSwgcmVzcGVjdGl2ZWx5XG4gICAqL1xuICBhc3luYyBnZXRCYWxhbmNlcyhhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnRbXT4ge1xuICAgIGlmIChhY2NvdW50SWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydC5lcXVhbChzdWJhZGRyZXNzSWR4LCB1bmRlZmluZWQsIFwiTXVzdCBwcm92aWRlIGFjY291bnQgaW5kZXggd2l0aCBzdWJhZGRyZXNzIGluZGV4XCIpO1xuICAgICAgbGV0IGJhbGFuY2UgPSBCaWdJbnQoMCk7XG4gICAgICBsZXQgdW5sb2NrZWRCYWxhbmNlID0gQmlnSW50KDApO1xuICAgICAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCB0aGlzLmdldEFjY291bnRzKCkpIHtcbiAgICAgICAgYmFsYW5jZSA9IGJhbGFuY2UgKyBhY2NvdW50LmdldEJhbGFuY2UoKTtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlID0gdW5sb2NrZWRCYWxhbmNlICsgYWNjb3VudC5nZXRVbmxvY2tlZEJhbGFuY2UoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBbYmFsYW5jZSwgdW5sb2NrZWRCYWxhbmNlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHBhcmFtcyA9IHthY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LCBhZGRyZXNzX2luZGljZXM6IHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IFtzdWJhZGRyZXNzSWR4XX07XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIsIHBhcmFtcyk7XG4gICAgICBpZiAoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gW0JpZ0ludChyZXNwLnJlc3VsdC5iYWxhbmNlKSwgQmlnSW50KHJlc3AucmVzdWx0LnVubG9ja2VkX2JhbGFuY2UpXTtcbiAgICAgIGVsc2UgcmV0dXJuIFtCaWdJbnQocmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3NbMF0uYmFsYW5jZSksIEJpZ0ludChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzc1swXS51bmxvY2tlZF9iYWxhbmNlKV07XG4gICAgfVxuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBDT01NT04gV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb1dhbGxldExpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3VwZXIuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN1cGVyLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWRUb0RhZW1vbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5jaGVja1Jlc2VydmVQcm9vZihhd2FpdCB0aGlzLmdldFByaW1hcnlBZGRyZXNzKCksIFwiXCIsIFwiXCIpOyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IHByb3ZpZGUgYmV0dGVyIHdheSB0byBrbm93IGlmIHdhbGxldCBycGMgaXMgY29ubmVjdGVkIHRvIGRhZW1vblxuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiY2hlY2sgcmVzZXJ2ZSBleHBlY3RlZCB0byBmYWlsXCIpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmV0dXJuIGUubWVzc2FnZS5pbmRleE9mKFwiRmFpbGVkIHRvIGNvbm5lY3QgdG8gZGFlbW9uXCIpIDwgMDtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFZlcnNpb24oKTogUHJvbWlzZTxNb25lcm9WZXJzaW9uPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdmVyc2lvblwiKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1ZlcnNpb24ocmVzcC5yZXN1bHQudmVyc2lvbiwgcmVzcC5yZXN1bHQucmVsZWFzZSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5wYXRoO1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwgeyBrZXlfdHlwZTogXCJtbmVtb25pY1wiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmIChhd2FpdCB0aGlzLmdldFNlZWQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb1dhbGxldFJwYy5nZXRTZWVkTGFuZ3VhZ2UoKSBub3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgYXZhaWxhYmxlIGxhbmd1YWdlcyBmb3IgdGhlIHdhbGxldCdzIHNlZWQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtzdHJpbmdbXX0gdGhlIGF2YWlsYWJsZSBsYW5ndWFnZXMgZm9yIHRoZSB3YWxsZXQncyBzZWVkLlxuICAgKi9cbiAgYXN5bmMgZ2V0U2VlZExhbmd1YWdlcygpIHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9sYW5ndWFnZXNcIikpLnJlc3VsdC5sYW5ndWFnZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFByaXZhdGVWaWV3S2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJxdWVyeV9rZXlcIiwgeyBrZXlfdHlwZTogXCJ2aWV3X2tleVwiIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5rZXk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFByaXZhdGVTcGVuZEtleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicXVlcnlfa2V5XCIsIHsga2V5X3R5cGU6IFwic3BlbmRfa2V5XCIgfSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmtleTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHN1YmFkZHJlc3NNYXAgPSB0aGlzLmFkZHJlc3NDYWNoZVthY2NvdW50SWR4XTtcbiAgICBpZiAoIXN1YmFkZHJlc3NNYXApIHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHVuZGVmaW5lZCwgdHJ1ZSk7ICAvLyBjYWNoZSdzIGFsbCBhZGRyZXNzZXMgYXQgdGhpcyBhY2NvdW50XG4gICAgICByZXR1cm4gdGhpcy5nZXRBZGRyZXNzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpOyAgICAgICAgLy8gcmVjdXJzaXZlIGNhbGwgdXNlcyBjYWNoZVxuICAgIH1cbiAgICBsZXQgYWRkcmVzcyA9IHN1YmFkZHJlc3NNYXBbc3ViYWRkcmVzc0lkeF07XG4gICAgaWYgKCFhZGRyZXNzKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHRydWUpOyAgLy8gY2FjaGUncyBhbGwgYWRkcmVzc2VzIGF0IHRoaXMgYWNjb3VudFxuICAgICAgcmV0dXJuIHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdW3N1YmFkZHJlc3NJZHhdO1xuICAgIH1cbiAgICByZXR1cm4gYWRkcmVzcztcbiAgfVxuICBcbiAgLy8gVE9ETzogdXNlIGNhY2hlXG4gIGFzeW5jIGdldEFkZHJlc3NJbmRleChhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBcbiAgICAvLyBmZXRjaCByZXN1bHQgYW5kIG5vcm1hbGl6ZSBlcnJvciBpZiBhZGRyZXNzIGRvZXMgbm90IGJlbG9uZyB0byB0aGUgd2FsbGV0XG4gICAgbGV0IHJlc3A7XG4gICAgdHJ5IHtcbiAgICAgIHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWRkcmVzc19pbmRleFwiLCB7YWRkcmVzczogYWRkcmVzc30pO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUuZ2V0Q29kZSgpID09PSAtMikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGUubWVzc2FnZSk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICBcbiAgICAvLyBjb252ZXJ0IHJwYyByZXNwb25zZVxuICAgIGxldCBzdWJhZGRyZXNzID0gbmV3IE1vbmVyb1N1YmFkZHJlc3Moe2FkZHJlc3M6IGFkZHJlc3N9KTtcbiAgICBzdWJhZGRyZXNzLnNldEFjY291bnRJbmRleChyZXNwLnJlc3VsdC5pbmRleC5tYWpvcik7XG4gICAgc3ViYWRkcmVzcy5zZXRJbmRleChyZXNwLnJlc3VsdC5pbmRleC5taW5vcik7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcz86IHN0cmluZywgcGF5bWVudElkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgaW50ZWdyYXRlZEFkZHJlc3NTdHIgPSAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwibWFrZV9pbnRlZ3JhdGVkX2FkZHJlc3NcIiwge3N0YW5kYXJkX2FkZHJlc3M6IHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudF9pZDogcGF5bWVudElkfSkpLnJlc3VsdC5pbnRlZ3JhdGVkX2FkZHJlc3M7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5kZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzc1N0cik7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5tZXNzYWdlLmluY2x1ZGVzKFwiSW52YWxpZCBwYXltZW50IElEXCIpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIHBheW1lbnQgSUQ6IFwiICsgcGF5bWVudElkKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3BsaXRfaW50ZWdyYXRlZF9hZGRyZXNzXCIsIHtpbnRlZ3JhdGVkX2FkZHJlc3M6IGludGVncmF0ZWRBZGRyZXNzfSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcygpLnNldFN0YW5kYXJkQWRkcmVzcyhyZXNwLnJlc3VsdC5zdGFuZGFyZF9hZGRyZXNzKS5zZXRQYXltZW50SWQocmVzcC5yZXN1bHQucGF5bWVudF9pZCkuc2V0SW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3MpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9oZWlnaHRcIikpLnJlc3VsdC5oZWlnaHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGluZyB0aGUgY2hhaW4gaGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHRCeURhdGUoeWVhcjogbnVtYmVyLCBtb250aDogbnVtYmVyLCBkYXk6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwibW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3Qgc3VwcG9ydCBnZXR0aW5nIGEgaGVpZ2h0IGJ5IGRhdGVcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgYXNzZXJ0KCEobGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIpLCBcIk1vbmVybyBXYWxsZXQgUlBDIGRvZXMgbm90IHN1cHBvcnQgcmVwb3J0aW5nIHN5bmMgcHJvZ3Jlc3NcIik7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVmcmVzaFwiLCB7c3RhcnRfaGVpZ2h0OiBzdGFydEhlaWdodH0sIDApO1xuICAgICAgYXdhaXQgdGhpcy5wb2xsKCk7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb1N5bmNSZXN1bHQocmVzcC5yZXN1bHQuYmxvY2tzX2ZldGNoZWQsIHJlc3AucmVzdWx0LnJlY2VpdmVkX21vbmV5KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgaWYgKGVyci5tZXNzYWdlID09PSBcIm5vIGNvbm5lY3Rpb24gdG8gZGFlbW9uXCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncz86IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIFxuICAgIC8vIGNvbnZlcnQgbXMgdG8gc2Vjb25kcyBmb3IgcnBjIHBhcmFtZXRlclxuICAgIGxldCBzeW5jUGVyaW9kSW5TZWNvbmRzID0gTWF0aC5yb3VuZCgoc3luY1BlcmlvZEluTXMgPT09IHVuZGVmaW5lZCA/IE1vbmVyb1dhbGxldFJwYy5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIDogc3luY1BlcmlvZEluTXMpIC8gMTAwMCk7XG4gICAgXG4gICAgLy8gc2VuZCBycGMgcmVxdWVzdFxuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImF1dG9fcmVmcmVzaFwiLCB7XG4gICAgICBlbmFibGU6IHRydWUsXG4gICAgICBwZXJpb2Q6IHN5bmNQZXJpb2RJblNlY29uZHNcbiAgICB9KTtcbiAgICBcbiAgICAvLyB1cGRhdGUgc3luYyBwZXJpb2QgZm9yIHBvbGxlclxuICAgIHRoaXMuc3luY1BlcmlvZEluTXMgPSBzeW5jUGVyaW9kSW5TZWNvbmRzICogMTAwMDtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgIT09IHVuZGVmaW5lZCkgdGhpcy53YWxsZXRQb2xsZXIuc2V0UGVyaW9kSW5Ncyh0aGlzLnN5bmNQZXJpb2RJbk1zKTtcbiAgICBcbiAgICAvLyBwb2xsIGlmIGxpc3RlbmluZ1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICB9XG5cbiAgZ2V0U3luY1BlcmlvZEluTXMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5zeW5jUGVyaW9kSW5NcztcbiAgfVxuICBcbiAgYXN5bmMgc3RvcFN5bmNpbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImF1dG9fcmVmcmVzaFwiLCB7IGVuYWJsZTogZmFsc2UgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0eEhhc2hlcyB8fCAhdHhIYXNoZXMubGVuZ3RoKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJObyB0eCBoYXNoZXMgZ2l2ZW4gdG8gc2NhblwiKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzY2FuX3R4XCIsIHt0eGlkczogdHhIYXNoZXN9KTtcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuU3BlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVzY2FuX3NwZW50XCIsIHVuZGVmaW5lZCwgMCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhbkJsb2NrY2hhaW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVzY2FuX2Jsb2NrY2hhaW5cIiwgdW5kZWZpbmVkLCAwKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0QmFsYW5jZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkpWzBdO1xuICB9XG4gIFxuICBhc3luYyBnZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbGFuY2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHRhZz86IHN0cmluZywgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvQWNjb3VudFtdPiB7XG4gICAgXG4gICAgLy8gZmV0Y2ggYWNjb3VudHMgZnJvbSBycGNcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hY2NvdW50c1wiLCB7dGFnOiB0YWd9KTtcbiAgICBcbiAgICAvLyBidWlsZCBhY2NvdW50IG9iamVjdHMgYW5kIGZldGNoIHN1YmFkZHJlc3NlcyBwZXIgYWNjb3VudCB1c2luZyBnZXRfYWRkcmVzc1xuICAgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IGdldF9hZGRyZXNzIHNob3VsZCBzdXBwb3J0IGFsbF9hY2NvdW50cyBzbyBub3QgY2FsbGVkIG9uY2UgcGVyIGFjY291bnRcbiAgICBsZXQgYWNjb3VudHM6IE1vbmVyb0FjY291bnRbXSA9IFtdO1xuICAgIGZvciAobGV0IHJwY0FjY291bnQgb2YgcmVzcC5yZXN1bHQuc3ViYWRkcmVzc19hY2NvdW50cykge1xuICAgICAgbGV0IGFjY291bnQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY0FjY291bnQocnBjQWNjb3VudCk7XG4gICAgICBpZiAoaW5jbHVkZVN1YmFkZHJlc3NlcykgYWNjb3VudC5zZXRTdWJhZGRyZXNzZXMoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudC5nZXRJbmRleCgpLCB1bmRlZmluZWQsIHRydWUpKTtcbiAgICAgIGFjY291bnRzLnB1c2goYWNjb3VudCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGZldGNoIGFuZCBtZXJnZSBmaWVsZHMgZnJvbSBnZXRfYmFsYW5jZSBhY3Jvc3MgYWxsIGFjY291bnRzXG4gICAgaWYgKGluY2x1ZGVTdWJhZGRyZXNzZXMgJiYgIXNraXBCYWxhbmNlcykge1xuICAgICAgXG4gICAgICAvLyB0aGVzZSBmaWVsZHMgYXJlIG5vdCBpbml0aWFsaXplZCBpZiBzdWJhZGRyZXNzIGlzIHVudXNlZCBhbmQgdGhlcmVmb3JlIG5vdCByZXR1cm5lZCBmcm9tIGBnZXRfYmFsYW5jZWBcbiAgICAgIGZvciAobGV0IGFjY291bnQgb2YgYWNjb3VudHMpIHtcbiAgICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpKSB7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgICAgICAgc3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgICBzdWJhZGRyZXNzLnNldE51bVVuc3BlbnRPdXRwdXRzKDApO1xuICAgICAgICAgIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2soMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gZmV0Y2ggYW5kIG1lcmdlIGluZm8gZnJvbSBnZXRfYmFsYW5jZVxuICAgICAgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYWxhbmNlXCIsIHthbGxfYWNjb3VudHM6IHRydWV9KTtcbiAgICAgIGlmIChyZXNwLnJlc3VsdC5wZXJfc3ViYWRkcmVzcykge1xuICAgICAgICBmb3IgKGxldCBycGNTdWJhZGRyZXNzIG9mIHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgICAgbGV0IHN1YmFkZHJlc3MgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gbWVyZ2UgaW5mb1xuICAgICAgICAgIGxldCBhY2NvdW50ID0gYWNjb3VudHNbc3ViYWRkcmVzcy5nZXRBY2NvdW50SW5kZXgoKV07XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsKHN1YmFkZHJlc3MuZ2V0QWNjb3VudEluZGV4KCksIGFjY291bnQuZ2V0SW5kZXgoKSwgXCJSUEMgYWNjb3VudHMgYXJlIG91dCBvZiBvcmRlclwiKTsgIC8vIHdvdWxkIG5lZWQgdG8gc3dpdGNoIGxvb2t1cCB0byBsb29wXG4gICAgICAgICAgbGV0IHRndFN1YmFkZHJlc3MgPSBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpW3N1YmFkZHJlc3MuZ2V0SW5kZXgoKV07XG4gICAgICAgICAgYXNzZXJ0LmVxdWFsKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSwgdGd0U3ViYWRkcmVzcy5nZXRJbmRleCgpLCBcIlJQQyBzdWJhZGRyZXNzZXMgYXJlIG91dCBvZiBvcmRlclwiKTtcbiAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRCYWxhbmNlKHN1YmFkZHJlc3MuZ2V0QmFsYW5jZSgpKTtcbiAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldFVubG9ja2VkQmFsYW5jZShzdWJhZGRyZXNzLmdldFVubG9ja2VkQmFsYW5jZSgpKTtcbiAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gYWNjb3VudHM7XG4gIH1cbiAgXG4gIC8vIFRPRE86IGdldEFjY291bnRCeUluZGV4KCksIGdldEFjY291bnRCeVRhZygpXG4gIGFzeW5jIGdldEFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbiwgc2tpcEJhbGFuY2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIGFzc2VydChhY2NvdW50SWR4ID49IDApO1xuICAgIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgdGhpcy5nZXRBY2NvdW50cygpKSB7XG4gICAgICBpZiAoYWNjb3VudC5nZXRJbmRleCgpID09PSBhY2NvdW50SWR4KSB7XG4gICAgICAgIGlmIChpbmNsdWRlU3ViYWRkcmVzc2VzKSBhY2NvdW50LnNldFN1YmFkZHJlc3Nlcyhhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCB1bmRlZmluZWQsIHNraXBCYWxhbmNlcykpO1xuICAgICAgICByZXR1cm4gYWNjb3VudDtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQWNjb3VudCB3aXRoIGluZGV4IFwiICsgYWNjb3VudElkeCArIFwiIGRvZXMgbm90IGV4aXN0XCIpO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlQWNjb3VudChsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIGxhYmVsID0gbGFiZWwgPyBsYWJlbCA6IHVuZGVmaW5lZDtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNyZWF0ZV9hY2NvdW50XCIsIHtsYWJlbDogbGFiZWx9KTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0FjY291bnQoe1xuICAgICAgaW5kZXg6IHJlc3AucmVzdWx0LmFjY291bnRfaW5kZXgsXG4gICAgICBwcmltYXJ5QWRkcmVzczogcmVzcC5yZXN1bHQuYWRkcmVzcyxcbiAgICAgIGxhYmVsOiBsYWJlbCxcbiAgICAgIGJhbGFuY2U6IEJpZ0ludCgwKSxcbiAgICAgIHVubG9ja2VkQmFsYW5jZTogQmlnSW50KDApXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBnZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSW5kaWNlcz86IG51bWJlcltdLCBza2lwQmFsYW5jZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzW10+IHtcbiAgICBcbiAgICAvLyBmZXRjaCBzdWJhZGRyZXNzZXNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgaWYgKHN1YmFkZHJlc3NJbmRpY2VzKSBwYXJhbXMuYWRkcmVzc19pbmRleCA9IEdlblV0aWxzLmxpc3RpZnkoc3ViYWRkcmVzc0luZGljZXMpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FkZHJlc3NcIiwgcGFyYW1zKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHN1YmFkZHJlc3Nlc1xuICAgIGxldCBzdWJhZGRyZXNzZXMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNTdWJhZGRyZXNzIG9mIHJlc3AucmVzdWx0LmFkZHJlc3Nlcykge1xuICAgICAgbGV0IHN1YmFkZHJlc3MgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcyk7XG4gICAgICBzdWJhZGRyZXNzLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIHN1YmFkZHJlc3Nlcy5wdXNoKHN1YmFkZHJlc3MpO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgaW5pdGlhbGl6ZSBzdWJhZGRyZXNzIGJhbGFuY2VzXG4gICAgaWYgKCFza2lwQmFsYW5jZXMpIHtcbiAgICAgIFxuICAgICAgLy8gdGhlc2UgZmllbGRzIGFyZSBub3QgaW5pdGlhbGl6ZWQgaWYgc3ViYWRkcmVzcyBpcyB1bnVzZWQgYW5kIHRoZXJlZm9yZSBub3QgcmV0dXJuZWQgZnJvbSBgZ2V0X2JhbGFuY2VgXG4gICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIHN1YmFkZHJlc3Nlcykge1xuICAgICAgICBzdWJhZGRyZXNzLnNldEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2UoQmlnSW50KDApKTtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cygwKTtcbiAgICAgICAgc3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jaygwKTtcbiAgICAgIH1cblxuICAgICAgLy8gZmV0Y2ggYW5kIGluaXRpYWxpemUgYmFsYW5jZXNcbiAgICAgIHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiLCBwYXJhbXMpO1xuICAgICAgaWYgKHJlc3AucmVzdWx0LnBlcl9zdWJhZGRyZXNzKSB7XG4gICAgICAgIGZvciAobGV0IHJwY1N1YmFkZHJlc3Mgb2YgcmVzcC5yZXN1bHQucGVyX3N1YmFkZHJlc3MpIHtcbiAgICAgICAgICBsZXQgc3ViYWRkcmVzcyA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjU3ViYWRkcmVzcyhycGNTdWJhZGRyZXNzKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyB0cmFuc2ZlciBpbmZvIHRvIGV4aXN0aW5nIHN1YmFkZHJlc3Mgb2JqZWN0XG4gICAgICAgICAgZm9yIChsZXQgdGd0U3ViYWRkcmVzcyBvZiBzdWJhZGRyZXNzZXMpIHtcbiAgICAgICAgICAgIGlmICh0Z3RTdWJhZGRyZXNzLmdldEluZGV4KCkgIT09IHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSkgY29udGludWU7IC8vIHNraXAgdG8gc3ViYWRkcmVzcyB3aXRoIHNhbWUgaW5kZXhcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldEJhbGFuY2UoKSAhPT0gdW5kZWZpbmVkKSB0Z3RTdWJhZGRyZXNzLnNldEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRCYWxhbmNlKCkpO1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXRVbmxvY2tlZEJhbGFuY2Uoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSk7XG4gICAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpICE9PSB1bmRlZmluZWQpIHRndFN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHMoc3ViYWRkcmVzcy5nZXROdW1VbnNwZW50T3V0cHV0cygpKTtcbiAgICAgICAgICAgIGlmIChzdWJhZGRyZXNzLmdldE51bUJsb2Nrc1RvVW5sb2NrKCkgIT09IHVuZGVmaW5lZCkgdGd0U3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jayhzdWJhZGRyZXNzLmdldE51bUJsb2Nrc1RvVW5sb2NrKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSBhZGRyZXNzZXNcbiAgICBsZXQgc3ViYWRkcmVzc01hcCA9IHRoaXMuYWRkcmVzc0NhY2hlW2FjY291bnRJZHhdO1xuICAgIGlmICghc3ViYWRkcmVzc01hcCkge1xuICAgICAgc3ViYWRkcmVzc01hcCA9IHt9O1xuICAgICAgdGhpcy5hZGRyZXNzQ2FjaGVbYWNjb3VudElkeF0gPSBzdWJhZGRyZXNzTWFwO1xuICAgIH1cbiAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIHN1YmFkZHJlc3Nlcykge1xuICAgICAgc3ViYWRkcmVzc01hcFtzdWJhZGRyZXNzLmdldEluZGV4KCldID0gc3ViYWRkcmVzcy5nZXRBZGRyZXNzKCk7XG4gICAgfVxuICAgIFxuICAgIC8vIHJldHVybiByZXN1bHRzXG4gICAgcmV0dXJuIHN1YmFkZHJlc3NlcztcbiAgfVxuXG4gIGFzeW5jIGdldFN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIHNraXBCYWxhbmNlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBhc3NlcnQoYWNjb3VudElkeCA+PSAwKTtcbiAgICBhc3NlcnQoc3ViYWRkcmVzc0lkeCA+PSAwKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIFtzdWJhZGRyZXNzSWR4XSwgc2tpcEJhbGFuY2VzKSlbMF07XG4gIH1cblxuICBhc3luYyBjcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNyZWF0ZV9hZGRyZXNzXCIsIHthY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LCBsYWJlbDogbGFiZWx9KTtcbiAgICBcbiAgICAvLyBidWlsZCBzdWJhZGRyZXNzIG9iamVjdFxuICAgIGxldCBzdWJhZGRyZXNzID0gbmV3IE1vbmVyb1N1YmFkZHJlc3MoKTtcbiAgICBzdWJhZGRyZXNzLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICBzdWJhZGRyZXNzLnNldEluZGV4KHJlc3AucmVzdWx0LmFkZHJlc3NfaW5kZXgpO1xuICAgIHN1YmFkZHJlc3Muc2V0QWRkcmVzcyhyZXNwLnJlc3VsdC5hZGRyZXNzKTtcbiAgICBzdWJhZGRyZXNzLnNldExhYmVsKGxhYmVsID8gbGFiZWwgOiB1bmRlZmluZWQpO1xuICAgIHN1YmFkZHJlc3Muc2V0QmFsYW5jZShCaWdJbnQoMCkpO1xuICAgIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCgwKSk7XG4gICAgc3ViYWRkcmVzcy5zZXROdW1VbnNwZW50T3V0cHV0cygwKTtcbiAgICBzdWJhZGRyZXNzLnNldElzVXNlZChmYWxzZSk7XG4gICAgc3ViYWRkcmVzcy5zZXROdW1CbG9ja3NUb1VubG9jaygwKTtcbiAgICByZXR1cm4gc3ViYWRkcmVzcztcbiAgfVxuXG4gIGFzeW5jIHNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImxhYmVsX2FkZHJlc3NcIiwge2luZGV4OiB7bWFqb3I6IGFjY291bnRJZHgsIG1pbm9yOiBzdWJhZGRyZXNzSWR4fSwgbGFiZWw6IGxhYmVsfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyhxdWVyeT86IHN0cmluZ1tdIHwgUGFydGlhbDxNb25lcm9UeFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIFxuICAgIC8vIGNvcHkgcXVlcnlcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHhRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gdGVtcG9yYXJpbHkgZGlzYWJsZSB0cmFuc2ZlciBhbmQgb3V0cHV0IHF1ZXJpZXMgaW4gb3JkZXIgdG8gY29sbGVjdCBhbGwgdHggaW5mb3JtYXRpb25cbiAgICBsZXQgdHJhbnNmZXJRdWVyeSA9IHF1ZXJ5Tm9ybWFsaXplZC5nZXRUcmFuc2ZlclF1ZXJ5KCk7XG4gICAgbGV0IGlucHV0UXVlcnkgPSBxdWVyeU5vcm1hbGl6ZWQuZ2V0SW5wdXRRdWVyeSgpO1xuICAgIGxldCBvdXRwdXRRdWVyeSA9IHF1ZXJ5Tm9ybWFsaXplZC5nZXRPdXRwdXRRdWVyeSgpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRUcmFuc2ZlclF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldElucHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0T3V0cHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICBcbiAgICAvLyBmZXRjaCBhbGwgdHJhbnNmZXJzIHRoYXQgbWVldCB0eCBxdWVyeVxuICAgIGxldCB0cmFuc2ZlcnMgPSBhd2FpdCB0aGlzLmdldFRyYW5zZmVyc0F1eChuZXcgTW9uZXJvVHJhbnNmZXJRdWVyeSgpLnNldFR4UXVlcnkoTW9uZXJvV2FsbGV0UnBjLmRlY29udGV4dHVhbGl6ZShxdWVyeU5vcm1hbGl6ZWQuY29weSgpKSkpO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdW5pcXVlIHR4cyBmcm9tIHRyYW5zZmVycyB3aGlsZSByZXRhaW5pbmcgb3JkZXJcbiAgICBsZXQgdHhzID0gW107XG4gICAgbGV0IHR4c1NldCA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0cmFuc2ZlcnMpIHtcbiAgICAgIGlmICghdHhzU2V0Lmhhcyh0cmFuc2Zlci5nZXRUeCgpKSkge1xuICAgICAgICB0eHMucHVzaCh0cmFuc2Zlci5nZXRUeCgpKTtcbiAgICAgICAgdHhzU2V0LmFkZCh0cmFuc2Zlci5nZXRUeCgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgdHlwZXMgaW50byBtYXBzIGZvciBtZXJnaW5nIGFuZCBsb29rdXBcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KHR4LCB0eE1hcCwgYmxvY2tNYXApO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgbWVyZ2Ugb3V0cHV0cyBpZiByZXF1ZXN0ZWRcbiAgICBpZiAocXVlcnlOb3JtYWxpemVkLmdldEluY2x1ZGVPdXRwdXRzKCkgfHwgb3V0cHV0UXVlcnkpIHtcbiAgICAgICAgXG4gICAgICAvLyBmZXRjaCBvdXRwdXRzXG4gICAgICBsZXQgb3V0cHV0UXVlcnlBdXggPSAob3V0cHV0UXVlcnkgPyBvdXRwdXRRdWVyeS5jb3B5KCkgOiBuZXcgTW9uZXJvT3V0cHV0UXVlcnkoKSkuc2V0VHhRdWVyeShNb25lcm9XYWxsZXRScGMuZGVjb250ZXh0dWFsaXplKHF1ZXJ5Tm9ybWFsaXplZC5jb3B5KCkpKTtcbiAgICAgIGxldCBvdXRwdXRzID0gYXdhaXQgdGhpcy5nZXRPdXRwdXRzQXV4KG91dHB1dFF1ZXJ5QXV4KTtcbiAgICAgIFxuICAgICAgLy8gbWVyZ2Ugb3V0cHV0IHR4cyBvbmUgdGltZSB3aGlsZSByZXRhaW5pbmcgb3JkZXJcbiAgICAgIGxldCBvdXRwdXRUeHMgPSBbXTtcbiAgICAgIGZvciAobGV0IG91dHB1dCBvZiBvdXRwdXRzKSB7XG4gICAgICAgIGlmICghb3V0cHV0VHhzLmluY2x1ZGVzKG91dHB1dC5nZXRUeCgpKSkge1xuICAgICAgICAgIE1vbmVyb1dhbGxldFJwYy5tZXJnZVR4KG91dHB1dC5nZXRUeCgpLCB0eE1hcCwgYmxvY2tNYXApO1xuICAgICAgICAgIG91dHB1dFR4cy5wdXNoKG91dHB1dC5nZXRUeCgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyByZXN0b3JlIHRyYW5zZmVyIGFuZCBvdXRwdXQgcXVlcmllc1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRUcmFuc2ZlclF1ZXJ5KHRyYW5zZmVyUXVlcnkpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRJbnB1dFF1ZXJ5KGlucHV0UXVlcnkpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRPdXRwdXRRdWVyeShvdXRwdXRRdWVyeSk7XG4gICAgXG4gICAgLy8gZmlsdGVyIHR4cyB0aGF0IGRvbid0IG1lZXQgdHJhbnNmZXIgcXVlcnlcbiAgICBsZXQgdHhzUXVlcmllZCA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5tZWV0c0NyaXRlcmlhKHR4KSkgdHhzUXVlcmllZC5wdXNoKHR4KTtcbiAgICAgIGVsc2UgaWYgKHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCkgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgfVxuICAgIHR4cyA9IHR4c1F1ZXJpZWQ7XG4gICAgXG4gICAgLy8gc3BlY2lhbCBjYXNlOiByZS1mZXRjaCB0eHMgaWYgaW5jb25zaXN0ZW5jeSBjYXVzZWQgYnkgbmVlZGluZyB0byBtYWtlIG11bHRpcGxlIHJwYyBjYWxsc1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkgJiYgdHguZ2V0QmxvY2soKSA9PT0gdW5kZWZpbmVkIHx8ICF0eC5nZXRJc0NvbmZpcm1lZCgpICYmIHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiSW5jb25zaXN0ZW5jeSBkZXRlY3RlZCBidWlsZGluZyB0eHMgZnJvbSBtdWx0aXBsZSBycGMgY2FsbHMsIHJlLWZldGNoaW5nIHR4c1wiKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VHhzKHF1ZXJ5Tm9ybWFsaXplZCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIG9yZGVyIHR4cyBpZiB0eCBoYXNoZXMgZ2l2ZW4gdGhlbiByZXR1cm5cbiAgICBpZiAocXVlcnlOb3JtYWxpemVkLmdldEhhc2hlcygpICYmIHF1ZXJ5Tm9ybWFsaXplZC5nZXRIYXNoZXMoKS5sZW5ndGggPiAwKSB7XG4gICAgICBsZXQgdHhzQnlJZCA9IG5ldyBNYXAoKSAgLy8gc3RvcmUgdHhzIGluIHRlbXBvcmFyeSBtYXAgZm9yIHNvcnRpbmdcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykgdHhzQnlJZC5zZXQodHguZ2V0SGFzaCgpLCB0eCk7XG4gICAgICBsZXQgb3JkZXJlZFR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgaGFzaCBvZiBxdWVyeU5vcm1hbGl6ZWQuZ2V0SGFzaGVzKCkpIGlmICh0eHNCeUlkLmdldChoYXNoKSkgb3JkZXJlZFR4cy5wdXNoKHR4c0J5SWQuZ2V0KGhhc2gpKTtcbiAgICAgIHR4cyA9IG9yZGVyZWRUeHM7XG4gICAgfVxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1RyYW5zZmVyW10+IHtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gZ2V0IHRyYW5zZmVycyBkaXJlY3RseSBpZiBxdWVyeSBkb2VzIG5vdCByZXF1aXJlIHR4IGNvbnRleHQgKG90aGVyIHRyYW5zZmVycywgb3V0cHV0cylcbiAgICBpZiAoIU1vbmVyb1dhbGxldFJwYy5pc0NvbnRleHR1YWwocXVlcnlOb3JtYWxpemVkKSkgcmV0dXJuIHRoaXMuZ2V0VHJhbnNmZXJzQXV4KHF1ZXJ5Tm9ybWFsaXplZCk7XG4gICAgXG4gICAgLy8gb3RoZXJ3aXNlIGdldCB0eHMgd2l0aCBmdWxsIG1vZGVscyB0byBmdWxmaWxsIHF1ZXJ5XG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMuZ2V0VHhzKHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkpKSB7XG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5maWx0ZXJUcmFuc2ZlcnMocXVlcnlOb3JtYWxpemVkKSkge1xuICAgICAgICB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb091dHB1dFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvT3V0cHV0V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplT3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIGdldCBvdXRwdXRzIGRpcmVjdGx5IGlmIHF1ZXJ5IGRvZXMgbm90IHJlcXVpcmUgdHggY29udGV4dCAob3RoZXIgb3V0cHV0cywgdHJhbnNmZXJzKVxuICAgIGlmICghTW9uZXJvV2FsbGV0UnBjLmlzQ29udGV4dHVhbChxdWVyeU5vcm1hbGl6ZWQpKSByZXR1cm4gdGhpcy5nZXRPdXRwdXRzQXV4KHF1ZXJ5Tm9ybWFsaXplZCk7XG4gICAgXG4gICAgLy8gb3RoZXJ3aXNlIGdldCB0eHMgd2l0aCBmdWxsIG1vZGVscyB0byBmdWxmaWxsIHF1ZXJ5XG4gICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLmdldFR4cyhxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpKSkge1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmZpbHRlck91dHB1dHMocXVlcnlOb3JtYWxpemVkKSkge1xuICAgICAgICBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dHB1dHM7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE91dHB1dHMoYWxsID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X291dHB1dHNcIiwge2FsbDogYWxsfSkpLnJlc3VsdC5vdXRwdXRzX2RhdGFfaGV4O1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXg6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbXBvcnRfb3V0cHV0c1wiLCB7b3V0cHV0c19kYXRhX2hleDogb3V0cHV0c0hleH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5udW1faW1wb3J0ZWQ7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydEtleUltYWdlcyhhbGwgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnJwY0V4cG9ydEtleUltYWdlcyhhbGwpO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzOiBNb25lcm9LZXlJbWFnZVtdKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD4ge1xuICAgIFxuICAgIC8vIGNvbnZlcnQga2V5IGltYWdlcyB0byBycGMgcGFyYW1ldGVyXG4gICAgbGV0IHJwY0tleUltYWdlcyA9IGtleUltYWdlcy5tYXAoa2V5SW1hZ2UgPT4gKHtrZXlfaW1hZ2U6IGtleUltYWdlLmdldEhleCgpLCBzaWduYXR1cmU6IGtleUltYWdlLmdldFNpZ25hdHVyZSgpfSkpO1xuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaW1wb3J0X2tleV9pbWFnZXNcIiwge3NpZ25lZF9rZXlfaW1hZ2VzOiBycGNLZXlJbWFnZXN9KTtcbiAgICBcbiAgICAvLyBidWlsZCBhbmQgcmV0dXJuIHJlc3VsdFxuICAgIGxldCBpbXBvcnRSZXN1bHQgPSBuZXcgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQoKTtcbiAgICBpbXBvcnRSZXN1bHQuc2V0SGVpZ2h0KHJlc3AucmVzdWx0LmhlaWdodCk7XG4gICAgaW1wb3J0UmVzdWx0LnNldFNwZW50QW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5zcGVudCkpO1xuICAgIGltcG9ydFJlc3VsdC5zZXRVbnNwZW50QW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC51bnNwZW50KSk7XG4gICAgcmV0dXJuIGltcG9ydFJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucnBjRXhwb3J0S2V5SW1hZ2VzKGZhbHNlKTtcbiAgfVxuICBcbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZnJlZXplXCIsIHtrZXlfaW1hZ2U6IGtleUltYWdlfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRoYXdPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJ0aGF3XCIsIHtrZXlfaW1hZ2U6IGtleUltYWdlfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzT3V0cHV0RnJvemVuKGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImZyb3plblwiLCB7a2V5X2ltYWdlOiBrZXlJbWFnZX0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5mcm96ZW4gPT09IHRydWU7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVR4cyhjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUsIGNvcHksIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpID09PSB1bmRlZmluZWQpIGNvbmZpZ05vcm1hbGl6ZWQuc2V0Q2FuU3BsaXQodHJ1ZSk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UmVsYXkoKSA9PT0gdHJ1ZSAmJiBhd2FpdCB0aGlzLmlzTXVsdGlzaWcoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHJlbGF5IG11bHRpc2lnIHRyYW5zYWN0aW9uIHVudGlsIGNvLXNpZ25lZFwiKTtcblxuICAgIC8vIGRldGVybWluZSBhY2NvdW50IGFuZCBzdWJhZGRyZXNzZXMgdG8gc2VuZCBmcm9tXG4gICAgbGV0IGFjY291bnRJZHggPSBjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpO1xuICAgIGlmIChhY2NvdW50SWR4ID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSB0aGUgYWNjb3VudCBpbmRleCB0byBzZW5kIGZyb21cIik7XG4gICAgbGV0IHN1YmFkZHJlc3NJbmRpY2VzID0gY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBjb25maWdOb3JtYWxpemVkLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkuc2xpY2UoMCk7IC8vIGZldGNoIGFsbCBvciBjb3B5IGdpdmVuIGluZGljZXNcbiAgICBcbiAgICAvLyBidWlsZCBjb25maWcgcGFyYW1ldGVyc1xuICAgIGxldCBwYXJhbXM6IGFueSA9IHt9O1xuICAgIHBhcmFtcy5kZXN0aW5hdGlvbnMgPSBbXTtcbiAgICBmb3IgKGxldCBkZXN0aW5hdGlvbiBvZiBjb25maWdOb3JtYWxpemVkLmdldERlc3RpbmF0aW9ucygpKSB7XG4gICAgICBhc3NlcnQoZGVzdGluYXRpb24uZ2V0QWRkcmVzcygpLCBcIkRlc3RpbmF0aW9uIGFkZHJlc3MgaXMgbm90IGRlZmluZWRcIik7XG4gICAgICBhc3NlcnQoZGVzdGluYXRpb24uZ2V0QW1vdW50KCksIFwiRGVzdGluYXRpb24gYW1vdW50IGlzIG5vdCBkZWZpbmVkXCIpO1xuICAgICAgcGFyYW1zLmRlc3RpbmF0aW9ucy5wdXNoKHsgYWRkcmVzczogZGVzdGluYXRpb24uZ2V0QWRkcmVzcygpLCBhbW91bnQ6IGRlc3RpbmF0aW9uLmdldEFtb3VudCgpLnRvU3RyaW5nKCkgfSk7XG4gICAgfVxuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFN1YnRyYWN0RmVlRnJvbSgpKSBwYXJhbXMuc3VidHJhY3RfZmVlX2Zyb21fb3V0cHV0cyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCk7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBhY2NvdW50SWR4O1xuICAgIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBzdWJhZGRyZXNzSW5kaWNlcztcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0UGF5bWVudElkKCk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0VW5sb2NrVGltZSgpICE9PSB1bmRlZmluZWQpIHBhcmFtcy51bmxvY2tfdGltZSA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0VW5sb2NrVGltZSgpLnRvU3RyaW5nKClcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpICE9PSB0cnVlO1xuICAgIGFzc2VydChjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPj0gMCAmJiBjb25maWdOb3JtYWxpemVkLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnTm9ybWFsaXplZC5nZXRQcmlvcml0eSgpO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSBwYXJhbXMuZ2V0X3R4X2tleXMgPSB0cnVlOyAvLyBwYXJhbSB0byBnZXQgdHgga2V5KHMpIGRlcGVuZHMgaWYgc3BsaXRcbiAgICBlbHNlIHBhcmFtcy5nZXRfdHhfa2V5ID0gdHJ1ZTtcblxuICAgIC8vIGNhbm5vdCBhcHBseSBzdWJ0cmFjdEZlZUZyb20gd2l0aCBgdHJhbnNmZXJfc3BsaXRgIGNhbGxcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpICYmIGNvbmZpZ05vcm1hbGl6ZWQuZ2V0U3VidHJhY3RGZWVGcm9tKCkgJiYgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJ0cmFjdEZlZUZyb20oKS5sZW5ndGggPiAwKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJzdWJ0cmFjdGZlZWZyb20gdHJhbnNmZXJzIGNhbm5vdCBiZSBzcGxpdCBvdmVyIG11bHRpcGxlIHRyYW5zYWN0aW9ucyB5ZXRcIik7XG4gICAgfVxuICAgIFxuICAgIC8vIHNlbmQgcmVxdWVzdFxuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IFwidHJhbnNmZXJfc3BsaXRcIiA6IFwidHJhbnNmZXJcIiwgcGFyYW1zKTtcbiAgICAgIHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIldBTExFVF9SUENfRVJST1JfQ09ERV9XUk9OR19BRERSRVNTXCIpID4gLTEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgZGVzdGluYXRpb24gYWRkcmVzc1wiKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gICAgXG4gICAgLy8gcHJlLWluaXRpYWxpemUgdHhzIGlmZiBwcmVzZW50LiBtdWx0aXNpZyBhbmQgdmlldy1vbmx5IHdhbGxldHMgd2lsbCBoYXZlIHR4IHNldCB3aXRob3V0IHRyYW5zYWN0aW9uc1xuICAgIGxldCB0eHM7XG4gICAgbGV0IG51bVR4cyA9IGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA/IChyZXN1bHQuZmVlX2xpc3QgIT09IHVuZGVmaW5lZCA/IHJlc3VsdC5mZWVfbGlzdC5sZW5ndGggOiAwKSA6IChyZXN1bHQuZmVlICE9PSB1bmRlZmluZWQgPyAxIDogMCk7XG4gICAgaWYgKG51bVR4cyA+IDApIHR4cyA9IFtdO1xuICAgIGxldCBjb3B5RGVzdGluYXRpb25zID0gbnVtVHhzID09PSAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtVHhzOyBpKyspIHtcbiAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgICAgTW9uZXJvV2FsbGV0UnBjLmluaXRTZW50VHhXYWxsZXQoY29uZmlnTm9ybWFsaXplZCwgdHgsIGNvcHlEZXN0aW5hdGlvbnMpO1xuICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICAgIGlmIChzdWJhZGRyZXNzSW5kaWNlcyAhPT0gdW5kZWZpbmVkICYmIHN1YmFkZHJlc3NJbmRpY2VzLmxlbmd0aCA9PT0gMSkgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldFN1YmFkZHJlc3NJbmRpY2VzKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRSZWxheSgpKSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHNldCBmcm9tIHJwYyByZXNwb25zZSB3aXRoIHByZS1pbml0aWFsaXplZCB0eHNcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpKSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQsIHR4cywgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gICAgZWxzZSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFRvVHhTZXQocmVzdWx0LCB0eHMgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHR4c1swXSwgdHJ1ZSwgY29uZmlnTm9ybWFsaXplZCkuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBidWlsZCByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuYWRkcmVzcyA9IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCk7XG4gICAgcGFyYW1zLmFjY291bnRfaW5kZXggPSBjb25maWcuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgcGFyYW1zLnN1YmFkZHJfaW5kaWNlcyA9IGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpO1xuICAgIHBhcmFtcy5rZXlfaW1hZ2UgPSBjb25maWcuZ2V0S2V5SW1hZ2UoKTtcbiAgICBpZiAoY29uZmlnLmdldFVubG9ja1RpbWUoKSAhPT0gdW5kZWZpbmVkKSBwYXJhbXMudW5sb2NrX3RpbWUgPSBjb25maWcuZ2V0VW5sb2NrVGltZSgpO1xuICAgIHBhcmFtcy5kb19ub3RfcmVsYXkgPSBjb25maWcuZ2V0UmVsYXkoKSAhPT0gdHJ1ZTtcbiAgICBhc3NlcnQoY29uZmlnLmdldFByaW9yaXR5KCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpb3JpdHkoKSA+PSAwICYmIGNvbmZpZy5nZXRQcmlvcml0eSgpIDw9IDMpO1xuICAgIHBhcmFtcy5wcmlvcml0eSA9IGNvbmZpZy5nZXRQcmlvcml0eSgpO1xuICAgIHBhcmFtcy5wYXltZW50X2lkID0gY29uZmlnLmdldFBheW1lbnRJZCgpO1xuICAgIHBhcmFtcy5nZXRfdHhfa2V5ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X2hleCA9IHRydWU7XG4gICAgcGFyYW1zLmdldF90eF9tZXRhZGF0YSA9IHRydWU7XG4gICAgXG4gICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzd2VlcF9zaW5nbGVcIiwgcGFyYW1zKTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgXG4gICAgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICBpZiAoY29uZmlnLmdldFJlbGF5KCkpIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIFxuICAgIC8vIGJ1aWxkIGFuZCByZXR1cm4gdHhcbiAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuaW5pdFNlbnRUeFdhbGxldChjb25maWcsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFRvVHhTZXQocmVzdWx0LCB0eCwgdHJ1ZSwgY29uZmlnKTtcbiAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKClbMF0uc2V0QW1vdW50KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBbW91bnQoKSk7IC8vIGluaXRpYWxpemUgZGVzdGluYXRpb24gYW1vdW50XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBhc3luYyBzd2VlcFVubG9ja2VkKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyhjb25maWcpO1xuICAgIFxuICAgIC8vIGRldGVybWluZSBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXMgdG8gc3dlZXA7IGRlZmF1bHQgdG8gYWxsIHdpdGggdW5sb2NrZWQgYmFsYW5jZSBpZiBub3Qgc3BlY2lmaWVkXG4gICAgbGV0IGluZGljZXMgPSBuZXcgTWFwKCk7ICAvLyBtYXBzIGVhY2ggYWNjb3VudCBpbmRleCB0byBzdWJhZGRyZXNzIGluZGljZXMgdG8gc3dlZXBcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaW5kaWNlcy5zZXQoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSwgY29uZmlnTm9ybWFsaXplZC5nZXRTdWJhZGRyZXNzSW5kaWNlcygpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgICAgICBpbmRpY2VzLnNldChjb25maWdOb3JtYWxpemVkLmdldEFjY291bnRJbmRleCgpLCBzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoY29uZmlnTm9ybWFsaXplZC5nZXRBY2NvdW50SW5kZXgoKSkpIHtcbiAgICAgICAgICBpZiAoc3ViYWRkcmVzcy5nZXRVbmxvY2tlZEJhbGFuY2UoKSA+IDBuKSBzdWJhZGRyZXNzSW5kaWNlcy5wdXNoKHN1YmFkZHJlc3MuZ2V0SW5kZXgoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGFjY291bnRzID0gYXdhaXQgdGhpcy5nZXRBY2NvdW50cyh0cnVlKTtcbiAgICAgIGZvciAobGV0IGFjY291bnQgb2YgYWNjb3VudHMpIHtcbiAgICAgICAgaWYgKGFjY291bnQuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgPiAwbikge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgICAgICAgIGluZGljZXMuc2V0KGFjY291bnQuZ2V0SW5kZXgoKSwgc3ViYWRkcmVzc0luZGljZXMpO1xuICAgICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkge1xuICAgICAgICAgICAgaWYgKHN1YmFkZHJlc3MuZ2V0VW5sb2NrZWRCYWxhbmNlKCkgPiAwbikgc3ViYWRkcmVzc0luZGljZXMucHVzaChzdWJhZGRyZXNzLmdldEluZGV4KCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzd2VlcCBmcm9tIGVhY2ggYWNjb3VudCBhbmQgY29sbGVjdCByZXN1bHRpbmcgdHggc2V0c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBmb3IgKGxldCBhY2NvdW50SWR4IG9mIGluZGljZXMua2V5cygpKSB7XG4gICAgICBcbiAgICAgIC8vIGNvcHkgYW5kIG1vZGlmeSB0aGUgb3JpZ2luYWwgY29uZmlnXG4gICAgICBsZXQgY29weSA9IGNvbmZpZ05vcm1hbGl6ZWQuY29weSgpO1xuICAgICAgY29weS5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgICBjb3B5LnNldFN3ZWVwRWFjaFN1YmFkZHJlc3MoZmFsc2UpO1xuICAgICAgXG4gICAgICAvLyBzd2VlcCBhbGwgc3ViYWRkcmVzc2VzIHRvZ2V0aGVyICAvLyBUT0RPIG1vbmVyby1wcm9qZWN0OiBjYW4gdGhpcyByZXZlYWwgb3V0cHV0cyBiZWxvbmcgdG8gdGhlIHNhbWUgd2FsbGV0P1xuICAgICAgaWYgKGNvcHkuZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcygpICE9PSB0cnVlKSB7XG4gICAgICAgIGNvcHkuc2V0U3ViYWRkcmVzc0luZGljZXMoaW5kaWNlcy5nZXQoYWNjb3VudElkeCkpO1xuICAgICAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLnJwY1N3ZWVwQWNjb3VudChjb3B5KSkgdHhzLnB1c2godHgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBvdGhlcndpc2Ugc3dlZXAgZWFjaCBzdWJhZGRyZXNzIGluZGl2aWR1YWxseVxuICAgICAgZWxzZSB7XG4gICAgICAgIGZvciAobGV0IHN1YmFkZHJlc3NJZHggb2YgaW5kaWNlcy5nZXQoYWNjb3VudElkeCkpIHtcbiAgICAgICAgICBjb3B5LnNldFN1YmFkZHJlc3NJbmRpY2VzKFtzdWJhZGRyZXNzSWR4XSk7XG4gICAgICAgICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5ycGNTd2VlcEFjY291bnQoY29weSkpIHR4cy5wdXNoKHR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBub3RpZnkgb2YgY2hhbmdlc1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldFJlbGF5KCkpIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwRHVzdChyZWxheT86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAocmVsYXkgPT09IHVuZGVmaW5lZCkgcmVsYXkgPSBmYWxzZTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN3ZWVwX2R1c3RcIiwge2RvX25vdF9yZWxheTogIXJlbGF5fSk7XG4gICAgaWYgKHJlbGF5KSBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXN1bHQpO1xuICAgIGlmICh0eFNldC5nZXRUeHMoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gW107XG4gICAgZm9yIChsZXQgdHggb2YgdHhTZXQuZ2V0VHhzKCkpIHtcbiAgICAgIHR4LnNldElzUmVsYXllZCghcmVsYXkpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHguZ2V0SXNSZWxheWVkKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdHhTZXQuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzKHR4c09yTWV0YWRhdGFzOiAoTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhzT3JNZXRhZGF0YXMpLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0eHMgb3IgdGhlaXIgbWV0YWRhdGEgdG8gcmVsYXlcIik7XG4gICAgbGV0IHR4SGFzaGVzID0gW107XG4gICAgZm9yIChsZXQgdHhPck1ldGFkYXRhIG9mIHR4c09yTWV0YWRhdGFzKSB7XG4gICAgICBsZXQgbWV0YWRhdGEgPSB0eE9yTWV0YWRhdGEgaW5zdGFuY2VvZiBNb25lcm9UeFdhbGxldCA/IHR4T3JNZXRhZGF0YS5nZXRNZXRhZGF0YSgpIDogdHhPck1ldGFkYXRhO1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZWxheV90eFwiLCB7IGhleDogbWV0YWRhdGEgfSk7XG4gICAgICB0eEhhc2hlcy5wdXNoKHJlc3AucmVzdWx0LnR4X2hhc2gpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnBvbGwoKTsgLy8gbm90aWZ5IG9mIGNoYW5nZXNcbiAgICByZXR1cm4gdHhIYXNoZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGRlc2NyaWJlVHhTZXQodHhTZXQ6IE1vbmVyb1R4U2V0KTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZGVzY3JpYmVfdHJhbnNmZXJcIiwge1xuICAgICAgdW5zaWduZWRfdHhzZXQ6IHR4U2V0LmdldFVuc2lnbmVkVHhIZXgoKSxcbiAgICAgIG11bHRpc2lnX3R4c2V0OiB0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KClcbiAgICB9KTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNEZXNjcmliZVRyYW5zZmVyKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnblR4cyh1bnNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzaWduX3RyYW5zZmVyXCIsIHtcbiAgICAgIHVuc2lnbmVkX3R4c2V0OiB1bnNpZ25lZFR4SGV4LFxuICAgICAgZXhwb3J0X3JhdzogZmFsc2VcbiAgICB9KTtcbiAgICBhd2FpdCB0aGlzLnBvbGwoKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNTZW50VHhzVG9UeFNldChyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4cyhzaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3VibWl0X3RyYW5zZmVyXCIsIHtcbiAgICAgIHR4X2RhdGFfaGV4OiBzaWduZWRUeEhleFxuICAgIH0pO1xuICAgIGF3YWl0IHRoaXMucG9sbCgpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC50eF9oYXNoX2xpc3Q7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgc2lnbmF0dXJlVHlwZSA9IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVksIGFjY291bnRJZHggPSAwLCBzdWJhZGRyZXNzSWR4ID0gMCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzaWduXCIsIHtcbiAgICAgICAgZGF0YTogbWVzc2FnZSxcbiAgICAgICAgc2lnbmF0dXJlX3R5cGU6IHNpZ25hdHVyZVR5cGUgPT09IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVkgPyBcInNwZW5kXCIgOiBcInZpZXdcIixcbiAgICAgICAgYWNjb3VudF9pbmRleDogYWNjb3VudElkeCxcbiAgICAgICAgYWRkcmVzc19pbmRleDogc3ViYWRkcmVzc0lkeFxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gIH1cbiAgXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0PiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidmVyaWZ5XCIsIHtkYXRhOiBtZXNzYWdlLCBhZGRyZXNzOiBhZGRyZXNzLCBzaWduYXR1cmU6IHNpZ25hdHVyZX0pO1xuICAgICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KFxuICAgICAgICByZXN1bHQuZ29vZCA/IHtpc0dvb2Q6IHJlc3VsdC5nb29kLCBpc09sZDogcmVzdWx0Lm9sZCwgc2lnbmF0dXJlVHlwZTogcmVzdWx0LnNpZ25hdHVyZV90eXBlID09PSBcInZpZXdcIiA/IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9WSUVXX0tFWSA6IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVksIHZlcnNpb246IHJlc3VsdC52ZXJzaW9ufSA6IHtpc0dvb2Q6IGZhbHNlfVxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLmdldENvZGUoKSA9PT0gLTIpIHJldHVybiBuZXcgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCh7aXNHb29kOiBmYWxzZX0pO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4S2V5KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHhfa2V5XCIsIHt0eGlkOiB0eEhhc2h9KSkucmVzdWx0LnR4X2tleTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2g6IHN0cmluZywgdHhLZXk6IHN0cmluZywgYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgdHJ5IHtcbiAgICAgIFxuICAgICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3R4X2tleVwiLCB7dHhpZDogdHhIYXNoLCB0eF9rZXk6IHR4S2V5LCBhZGRyZXNzOiBhZGRyZXNzfSk7XG4gICAgICBcbiAgICAgIC8vIGludGVycHJldCByZXN1bHRcbiAgICAgIGxldCBjaGVjayA9IG5ldyBNb25lcm9DaGVja1R4KCk7XG4gICAgICBjaGVjay5zZXRJc0dvb2QodHJ1ZSk7XG4gICAgICBjaGVjay5zZXROdW1Db25maXJtYXRpb25zKHJlc3AucmVzdWx0LmNvbmZpcm1hdGlvbnMpO1xuICAgICAgY2hlY2suc2V0SW5UeFBvb2wocmVzcC5yZXN1bHQuaW5fcG9vbCk7XG4gICAgICBjaGVjay5zZXRSZWNlaXZlZEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQucmVjZWl2ZWQpKTtcbiAgICAgIHJldHVybiBjaGVjaztcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdHhfcHJvb2ZcIiwge3R4aWQ6IHR4SGFzaCwgYWRkcmVzczogYWRkcmVzcywgbWVzc2FnZTogbWVzc2FnZX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnNpZ25hdHVyZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hlY2tfdHhfcHJvb2ZcIiwge1xuICAgICAgICB0eGlkOiB0eEhhc2gsXG4gICAgICAgIGFkZHJlc3M6IGFkZHJlc3MsXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIHNpZ25hdHVyZTogc2lnbmF0dXJlXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gaW50ZXJwcmV0IHJlc3BvbnNlXG4gICAgICBsZXQgaXNHb29kID0gcmVzcC5yZXN1bHQuZ29vZDtcbiAgICAgIGxldCBjaGVjayA9IG5ldyBNb25lcm9DaGVja1R4KCk7XG4gICAgICBjaGVjay5zZXRJc0dvb2QoaXNHb29kKTtcbiAgICAgIGlmIChpc0dvb2QpIHtcbiAgICAgICAgY2hlY2suc2V0TnVtQ29uZmlybWF0aW9ucyhyZXNwLnJlc3VsdC5jb25maXJtYXRpb25zKTtcbiAgICAgICAgY2hlY2suc2V0SW5UeFBvb2wocmVzcC5yZXN1bHQuaW5fcG9vbCk7XG4gICAgICAgIGNoZWNrLnNldFJlY2VpdmVkQW1vdW50KEJpZ0ludChyZXNwLnJlc3VsdC5yZWNlaXZlZCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNoZWNrO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvciAmJiBlLmdldENvZGUoKSA9PT0gLTEgJiYgZS5tZXNzYWdlID09PSBcImJhc2ljX3N0cmluZ1wiKSBlID0gbmV3IE1vbmVyb1JwY0Vycm9yKFwiTXVzdCBwcm92aWRlIHNpZ25hdHVyZSB0byBjaGVjayB0eCBwcm9vZlwiLCAtMSk7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3NwZW5kX3Byb29mXCIsIHt0eGlkOiB0eEhhc2gsIG1lc3NhZ2U6IG1lc3NhZ2V9KTtcbiAgICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtOCAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoXCJUWCBJRCBoYXMgaW52YWxpZCBmb3JtYXRcIikpIGUgPSBuZXcgTW9uZXJvUnBjRXJyb3IoXCJUWCBoYXNoIGhhcyBpbnZhbGlkIGZvcm1hdFwiLCBlLmdldENvZGUoKSwgZS5nZXRScGNNZXRob2QoKSwgZS5nZXRScGNQYXJhbXMoKSk7ICAvLyBub3JtYWxpemUgZXJyb3IgbWVzc2FnZVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrU3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3NwZW5kX3Byb29mXCIsIHtcbiAgICAgICAgdHhpZDogdHhIYXNoLFxuICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICBzaWduYXR1cmU6IHNpZ25hdHVyZVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzcC5yZXN1bHQuZ29vZDtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC04ICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcIlRYIElEIGhhcyBpbnZhbGlkIGZvcm1hdFwiKSkgZSA9IG5ldyBNb25lcm9ScGNFcnJvcihcIlRYIGhhc2ggaGFzIGludmFsaWQgZm9ybWF0XCIsIGUuZ2V0Q29kZSgpLCBlLmdldFJwY01ldGhvZCgpLCBlLmdldFJwY1BhcmFtcygpKTsgIC8vIG5vcm1hbGl6ZSBlcnJvciBtZXNzYWdlXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3Jlc2VydmVfcHJvb2ZcIiwge1xuICAgICAgYWxsOiB0cnVlLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduYXR1cmU7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBhbW91bnQ6IGJpZ2ludCwgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfcmVzZXJ2ZV9wcm9vZlwiLCB7XG4gICAgICBhY2NvdW50X2luZGV4OiBhY2NvdW50SWR4LFxuICAgICAgYW1vdW50OiBhbW91bnQudG9TdHJpbmcoKSxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuc2lnbmF0dXJlO1xuICB9XG5cbiAgYXN5bmMgY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1Jlc2VydmU+IHtcbiAgICBcbiAgICAvLyBzZW5kIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImNoZWNrX3Jlc2VydmVfcHJvb2ZcIiwge1xuICAgICAgYWRkcmVzczogYWRkcmVzcyxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICBzaWduYXR1cmU6IHNpZ25hdHVyZVxuICAgIH0pO1xuICAgIFxuICAgIC8vIGludGVycHJldCByZXN1bHRzXG4gICAgbGV0IGlzR29vZCA9IHJlc3AucmVzdWx0Lmdvb2Q7XG4gICAgbGV0IGNoZWNrID0gbmV3IE1vbmVyb0NoZWNrUmVzZXJ2ZSgpO1xuICAgIGNoZWNrLnNldElzR29vZChpc0dvb2QpO1xuICAgIGlmIChpc0dvb2QpIHtcbiAgICAgIGNoZWNrLnNldFVuY29uZmlybWVkU3BlbnRBbW91bnQoQmlnSW50KHJlc3AucmVzdWx0LnNwZW50KSk7XG4gICAgICBjaGVjay5zZXRUb3RhbEFtb3VudChCaWdJbnQocmVzcC5yZXN1bHQudG90YWwpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoZWNrO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF90eF9ub3Rlc1wiLCB7dHhpZHM6IHR4SGFzaGVzfSkpLnJlc3VsdC5ub3RlcztcbiAgfVxuICBcbiAgYXN5bmMgc2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10sIG5vdGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF90eF9ub3Rlc1wiLCB7dHhpZHM6IHR4SGFzaGVzLCBub3Rlczogbm90ZXN9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9BZGRyZXNzQm9va0VudHJ5W10+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzX2Jvb2tcIiwge2VudHJpZXM6IGVudHJ5SW5kaWNlc30pO1xuICAgIGlmICghcmVzcC5yZXN1bHQuZW50cmllcykgcmV0dXJuIFtdO1xuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgZm9yIChsZXQgcnBjRW50cnkgb2YgcmVzcC5yZXN1bHQuZW50cmllcykge1xuICAgICAgZW50cmllcy5wdXNoKG5ldyBNb25lcm9BZGRyZXNzQm9va0VudHJ5KCkuc2V0SW5kZXgocnBjRW50cnkuaW5kZXgpLnNldEFkZHJlc3MocnBjRW50cnkuYWRkcmVzcykuc2V0RGVzY3JpcHRpb24ocnBjRW50cnkuZGVzY3JpcHRpb24pLnNldFBheW1lbnRJZChycGNFbnRyeS5wYXltZW50X2lkKSk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG4gIFxuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3M6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiYWRkX2FkZHJlc3NfYm9va1wiLCB7YWRkcmVzczogYWRkcmVzcywgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9ufSk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmluZGV4O1xuICB9XG4gIFxuICBhc3luYyBlZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleDogbnVtYmVyLCBzZXRBZGRyZXNzOiBib29sZWFuLCBhZGRyZXNzOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNldERlc2NyaXB0aW9uOiBib29sZWFuLCBkZXNjcmlwdGlvbjogc3RyaW5nIHwgdW5kZWZpbmVkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJlZGl0X2FkZHJlc3NfYm9va1wiLCB7XG4gICAgICBpbmRleDogaW5kZXgsXG4gICAgICBzZXRfYWRkcmVzczogc2V0QWRkcmVzcyxcbiAgICAgIGFkZHJlc3M6IGFkZHJlc3MsXG4gICAgICBzZXRfZGVzY3JpcHRpb246IHNldERlc2NyaXB0aW9uLFxuICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uXG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHg6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImRlbGV0ZV9hZGRyZXNzX2Jvb2tcIiwge2luZGV4OiBlbnRyeUlkeH0pO1xuICB9XG4gIFxuICBhc3luYyB0YWdBY2NvdW50cyh0YWcsIGFjY291bnRJbmRpY2VzKSB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwidGFnX2FjY291bnRzXCIsIHt0YWc6IHRhZywgYWNjb3VudHM6IGFjY291bnRJbmRpY2VzfSk7XG4gIH1cblxuICBhc3luYyB1bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInVudGFnX2FjY291bnRzXCIsIHthY2NvdW50czogYWNjb3VudEluZGljZXN9KTtcbiAgfVxuXG4gIGFzeW5jIGdldEFjY291bnRUYWdzKCk6IFByb21pc2U8TW9uZXJvQWNjb3VudFRhZ1tdPiB7XG4gICAgbGV0IHRhZ3MgPSBbXTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hY2NvdW50X3RhZ3NcIik7XG4gICAgaWYgKHJlc3AucmVzdWx0LmFjY291bnRfdGFncykge1xuICAgICAgZm9yIChsZXQgcnBjQWNjb3VudFRhZyBvZiByZXNwLnJlc3VsdC5hY2NvdW50X3RhZ3MpIHtcbiAgICAgICAgdGFncy5wdXNoKG5ldyBNb25lcm9BY2NvdW50VGFnKHtcbiAgICAgICAgICB0YWc6IHJwY0FjY291bnRUYWcudGFnID8gcnBjQWNjb3VudFRhZy50YWcgOiB1bmRlZmluZWQsXG4gICAgICAgICAgbGFiZWw6IHJwY0FjY291bnRUYWcubGFiZWwgPyBycGNBY2NvdW50VGFnLmxhYmVsIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGFjY291bnRJbmRpY2VzOiBycGNBY2NvdW50VGFnLmFjY291bnRzXG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhZ3M7XG4gIH1cblxuICBhc3luYyBzZXRBY2NvdW50VGFnTGFiZWwodGFnOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYWNjb3VudF90YWdfZGVzY3JpcHRpb25cIiwge3RhZzogdGFnLCBkZXNjcmlwdGlvbjogbGFiZWx9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWc6IE1vbmVyb1R4Q29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJtYWtlX3VyaVwiLCB7XG4gICAgICBhZGRyZXNzOiBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpLFxuICAgICAgYW1vdW50OiBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QW1vdW50KCkgPyBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QW1vdW50KCkudG9TdHJpbmcoKSA6IHVuZGVmaW5lZCxcbiAgICAgIHBheW1lbnRfaWQ6IGNvbmZpZy5nZXRQYXltZW50SWQoKSxcbiAgICAgIHJlY2lwaWVudF9uYW1lOiBjb25maWcuZ2V0UmVjaXBpZW50TmFtZSgpLFxuICAgICAgdHhfZGVzY3JpcHRpb246IGNvbmZpZy5nZXROb3RlKClcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQudXJpO1xuICB9XG4gIFxuICBhc3luYyBwYXJzZVBheW1lbnRVcmkodXJpOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4Q29uZmlnPiB7XG4gICAgYXNzZXJ0KHVyaSwgXCJNdXN0IHByb3ZpZGUgVVJJIHRvIHBhcnNlXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicGFyc2VfdXJpXCIsIHt1cmk6IHVyaX0pO1xuICAgIGxldCBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoe2FkZHJlc3M6IHJlc3AucmVzdWx0LnVyaS5hZGRyZXNzLCBhbW91bnQ6IEJpZ0ludChyZXNwLnJlc3VsdC51cmkuYW1vdW50KX0pO1xuICAgIGNvbmZpZy5zZXRQYXltZW50SWQocmVzcC5yZXN1bHQudXJpLnBheW1lbnRfaWQpO1xuICAgIGNvbmZpZy5zZXRSZWNpcGllbnROYW1lKHJlc3AucmVzdWx0LnVyaS5yZWNpcGllbnRfbmFtZSk7XG4gICAgY29uZmlnLnNldE5vdGUocmVzcC5yZXN1bHQudXJpLnR4X2Rlc2NyaXB0aW9uKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSkgY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLnNldEFkZHJlc3ModW5kZWZpbmVkKTtcbiAgICBpZiAoXCJcIiA9PT0gY29uZmlnLmdldFBheW1lbnRJZCgpKSBjb25maWcuc2V0UGF5bWVudElkKHVuZGVmaW5lZCk7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXRSZWNpcGllbnROYW1lKCkpIGNvbmZpZy5zZXRSZWNpcGllbnROYW1lKHVuZGVmaW5lZCk7XG4gICAgaWYgKFwiXCIgPT09IGNvbmZpZy5nZXROb3RlKCkpIGNvbmZpZy5zZXROb3RlKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIGNvbmZpZztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QXR0cmlidXRlKGtleTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYXR0cmlidXRlXCIsIHtrZXk6IGtleX0pO1xuICAgICAgcmV0dXJuIHJlc3AucmVzdWx0LnZhbHVlID09PSBcIlwiID8gdW5kZWZpbmVkIDogcmVzcC5yZXN1bHQudmFsdWU7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yICYmIGUuZ2V0Q29kZSgpID09PSAtNDUpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgc2V0QXR0cmlidXRlKGtleTogc3RyaW5nLCB2YWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9hdHRyaWJ1dGVcIiwge2tleToga2V5LCB2YWx1ZTogdmFsfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKG51bVRocmVhZHM6IG51bWJlciwgYmFja2dyb3VuZE1pbmluZz86IGJvb2xlYW4sIGlnbm9yZUJhdHRlcnk/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3RhcnRfbWluaW5nXCIsIHtcbiAgICAgIHRocmVhZHNfY291bnQ6IG51bVRocmVhZHMsXG4gICAgICBkb19iYWNrZ3JvdW5kX21pbmluZzogYmFja2dyb3VuZE1pbmluZyxcbiAgICAgIGlnbm9yZV9iYXR0ZXJ5OiBpZ25vcmVCYXR0ZXJ5XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3RvcF9taW5pbmdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFsYW5jZVwiKTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQubXVsdGlzaWdfaW1wb3J0X25lZWRlZCA9PT0gdHJ1ZTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TXVsdGlzaWdJbmZvKCk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbmZvPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpc19tdWx0aXNpZ1wiKTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgbGV0IGluZm8gPSBuZXcgTW9uZXJvTXVsdGlzaWdJbmZvKCk7XG4gICAgaW5mby5zZXRJc011bHRpc2lnKHJlc3VsdC5tdWx0aXNpZyk7XG4gICAgaW5mby5zZXRJc1JlYWR5KHJlc3VsdC5yZWFkeSk7XG4gICAgaW5mby5zZXRUaHJlc2hvbGQocmVzdWx0LnRocmVzaG9sZCk7XG4gICAgaW5mby5zZXROdW1QYXJ0aWNpcGFudHMocmVzdWx0LnRvdGFsKTtcbiAgICByZXR1cm4gaW5mbztcbiAgfVxuICBcbiAgYXN5bmMgcHJlcGFyZU11bHRpc2lnKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJwcmVwYXJlX211bHRpc2lnXCIsIHtlbmFibGVfbXVsdGlzaWdfZXhwZXJpbWVudGFsOiB0cnVlfSk7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgcmV0dXJuIHJlc3VsdC5tdWx0aXNpZ19pbmZvO1xuICB9XG4gIFxuICBhc3luYyBtYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHRocmVzaG9sZDogbnVtYmVyLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm1ha2VfbXVsdGlzaWdcIiwge1xuICAgICAgbXVsdGlzaWdfaW5mbzogbXVsdGlzaWdIZXhlcyxcbiAgICAgIHRocmVzaG9sZDogdGhyZXNob2xkLFxuICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkXG4gICAgfSk7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQubXVsdGlzaWdfaW5mbztcbiAgfVxuICBcbiAgYXN5bmMgZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhjaGFuZ2VfbXVsdGlzaWdfa2V5c1wiLCB7bXVsdGlzaWdfaW5mbzogbXVsdGlzaWdIZXhlcywgcGFzc3dvcmQ6IHBhc3N3b3JkfSk7XG4gICAgdGhpcy5hZGRyZXNzQ2FjaGUgPSB7fTtcbiAgICBsZXQgbXNSZXN1bHQgPSBuZXcgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0KCk7XG4gICAgbXNSZXN1bHQuc2V0QWRkcmVzcyhyZXNwLnJlc3VsdC5hZGRyZXNzKTtcbiAgICBtc1Jlc3VsdC5zZXRNdWx0aXNpZ0hleChyZXNwLnJlc3VsdC5tdWx0aXNpZ19pbmZvKTtcbiAgICBpZiAobXNSZXN1bHQuZ2V0QWRkcmVzcygpLmxlbmd0aCA9PT0gMCkgbXNSZXN1bHQuc2V0QWRkcmVzcyh1bmRlZmluZWQpO1xuICAgIGlmIChtc1Jlc3VsdC5nZXRNdWx0aXNpZ0hleCgpLmxlbmd0aCA9PT0gMCkgbXNSZXN1bHQuc2V0TXVsdGlzaWdIZXgodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gbXNSZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJleHBvcnRfbXVsdGlzaWdfaW5mb1wiKTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuaW5mbztcbiAgfVxuXG4gIGFzeW5jIGltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkobXVsdGlzaWdIZXhlcykpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBzdHJpbmdbXSB0byBpbXBvcnRNdWx0aXNpZ0hleCgpXCIpXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJpbXBvcnRfbXVsdGlzaWdfaW5mb1wiLCB7aW5mbzogbXVsdGlzaWdIZXhlc30pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5uX291dHB1dHM7XG4gIH1cblxuICBhc3luYyBzaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnU2lnblJlc3VsdD4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2lnbl9tdWx0aXNpZ1wiLCB7dHhfZGF0YV9oZXg6IG11bHRpc2lnVHhIZXh9KTtcbiAgICBsZXQgcmVzdWx0ID0gcmVzcC5yZXN1bHQ7XG4gICAgbGV0IHNpZ25SZXN1bHQgPSBuZXcgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0KCk7XG4gICAgc2lnblJlc3VsdC5zZXRTaWduZWRNdWx0aXNpZ1R4SGV4KHJlc3VsdC50eF9kYXRhX2hleCk7XG4gICAgc2lnblJlc3VsdC5zZXRUeEhhc2hlcyhyZXN1bHQudHhfaGFzaF9saXN0KTtcbiAgICByZXR1cm4gc2lnblJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3VibWl0X211bHRpc2lnXCIsIHt0eF9kYXRhX2hleDogc2lnbmVkTXVsdGlzaWdUeEhleH0pO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC50eF9oYXNoX2xpc3Q7XG4gIH1cbiAgXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkOiBzdHJpbmcsIG5ld1Bhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiY2hhbmdlX3dhbGxldF9wYXNzd29yZFwiLCB7b2xkX3Bhc3N3b3JkOiBvbGRQYXNzd29yZCB8fCBcIlwiLCBuZXdfcGFzc3dvcmQ6IG5ld1Bhc3N3b3JkIHx8IFwiXCJ9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2F2ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9yZVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgY2xvc2Uoc2F2ZSA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3VwZXIuY2xvc2Uoc2F2ZSk7XG4gICAgaWYgKHNhdmUgPT09IHVuZGVmaW5lZCkgc2F2ZSA9IGZhbHNlO1xuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJjbG9zZV93YWxsZXRcIiwge2F1dG9zYXZlX2N1cnJlbnQ6IHNhdmV9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDbG9zZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0UHJpbWFyeUFkZHJlc3MoKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIHJldHVybiBlIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IgJiYgZS5nZXRDb2RlKCkgPT09IC0xMyAmJiBlLm1lc3NhZ2UuaW5kZXhPZihcIk5vIHdhbGxldCBmaWxlXCIpID4gLTE7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNhdmUgYW5kIGNsb3NlIHRoZSBjdXJyZW50IHdhbGxldCBhbmQgc3RvcCB0aGUgUlBDIHNlcnZlci5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdG9wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuY2xlYXIoKTtcbiAgICBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdG9wX3dhbGxldFwiKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0gQUREIEpTRE9DIEZPUiBTVVBQT1JURUQgREVGQVVMVCBJTVBMRU1FTlRBVElPTlMgLS0tLS0tLS0tLS0tLS1cblxuICBhc3luYyBnZXROdW1CbG9ja3NUb1VubG9jaygpOiBQcm9taXNlPG51bWJlcltdPiB7IHJldHVybiBzdXBlci5nZXROdW1CbG9ja3NUb1VubG9jaygpOyB9XG4gIGFzeW5jIGdldFR4KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4geyByZXR1cm4gc3VwZXIuZ2V0VHgodHhIYXNoKTsgfVxuICBhc3luYyBnZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdPiB7IHJldHVybiBzdXBlci5nZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeSk7IH1cbiAgYXN5bmMgZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pIHsgcmV0dXJuIHN1cGVyLmdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBjcmVhdGVUeChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4geyByZXR1cm4gc3VwZXIuY3JlYXRlVHgoY29uZmlnKTsgfVxuICBhc3luYyByZWxheVR4KHR4T3JNZXRhZGF0YTogTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIucmVsYXlUeCh0eE9yTWV0YWRhdGEpOyB9XG4gIGFzeW5jIGdldFR4Tm90ZSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5nZXRUeE5vdGUodHhIYXNoKTsgfVxuICBhc3luYyBzZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcsIG5vdGU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4geyByZXR1cm4gc3VwZXIuc2V0VHhOb3RlKHR4SGFzaCwgbm90ZSk7IH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgc3RhdGljIGFzeW5jIGNvbm5lY3RUb1dhbGxldFJwYyh1cmlPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPiB8IHN0cmluZ1tdLCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICAgIGxldCBjb25maWcgPSBNb25lcm9XYWxsZXRScGMubm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnLCB1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgIGlmIChjb25maWcuY21kKSByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLnN0YXJ0V2FsbGV0UnBjUHJvY2Vzcyhjb25maWcpO1xuICAgIGVsc2UgcmV0dXJuIG5ldyBNb25lcm9XYWxsZXRScGMoY29uZmlnKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBzdGFydFdhbGxldFJwY1Byb2Nlc3MoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICAgIGFzc2VydChHZW5VdGlscy5pc0FycmF5KGNvbmZpZy5jbWQpLCBcIk11c3QgcHJvdmlkZSBzdHJpbmcgYXJyYXkgd2l0aCBjb21tYW5kIGxpbmUgcGFyYW1ldGVyc1wiKTtcbiAgICBcbiAgICAvLyBzdGFydCBwcm9jZXNzXG4gICAgbGV0IGNoaWxkX3Byb2Nlc3MgPSBhd2FpdCBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpO1xuICAgIGNvbnN0IHByb2Nlc3MgPSBjaGlsZF9wcm9jZXNzLnNwYXduKGNvbmZpZy5jbWRbMF0sIGNvbmZpZy5jbWQuc2xpY2UoMSksIHt9KTtcbiAgICBwcm9jZXNzLnN0ZG91dC5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIHByb2Nlc3Muc3RkZXJyLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgYWZ0ZXIgc3RhcnRpbmcgbW9uZXJvLXdhbGxldC1ycGNcbiAgICBsZXQgdXJpO1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICBsZXQgb3V0cHV0ID0gXCJcIjtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRvdXRcbiAgICAgICAgcHJvY2Vzcy5zdGRvdXQub24oJ2RhdGEnLCBhc3luYyBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgbGV0IGxpbmUgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICAgICAgTGlicmFyeVV0aWxzLmxvZygyLCBsaW5lKTtcbiAgICAgICAgICBvdXRwdXQgKz0gbGluZSArICdcXG4nOyAvLyBjYXB0dXJlIG91dHB1dCBpbiBjYXNlIG9mIGVycm9yXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gZXh0cmFjdCB1cmkgZnJvbSBlLmcuIFwiSSBCaW5kaW5nIG9uIDEyNy4wLjAuMSAoSVB2NCk6MzgwODVcIlxuICAgICAgICAgIGxldCB1cmlMaW5lQ29udGFpbnMgPSBcIkJpbmRpbmcgb24gXCI7XG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWluc0lkeCA9IGxpbmUuaW5kZXhPZih1cmlMaW5lQ29udGFpbnMpO1xuICAgICAgICAgIGlmICh1cmlMaW5lQ29udGFpbnNJZHggPj0gMCkge1xuICAgICAgICAgICAgbGV0IGhvc3QgPSBsaW5lLnN1YnN0cmluZyh1cmlMaW5lQ29udGFpbnNJZHggKyB1cmlMaW5lQ29udGFpbnMubGVuZ3RoLCBsaW5lLmxhc3RJbmRleE9mKCcgJykpO1xuICAgICAgICAgICAgbGV0IHVuZm9ybWF0dGVkTGluZSA9IGxpbmUucmVwbGFjZSgvXFx1MDAxYlxcWy4qP20vZywgJycpLnRyaW0oKTsgLy8gcmVtb3ZlIGNvbG9yIGZvcm1hdHRpbmdcbiAgICAgICAgICAgIGxldCBwb3J0ID0gdW5mb3JtYXR0ZWRMaW5lLnN1YnN0cmluZyh1bmZvcm1hdHRlZExpbmUubGFzdEluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgbGV0IHNzbElkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLXNzbFwiKTtcbiAgICAgICAgICAgIGxldCBzc2xFbmFibGVkID0gc3NsSWR4ID49IDAgPyBcImVuYWJsZWRcIiA9PSBjb25maWcuY21kW3NzbElkeCArIDFdLnRvTG93ZXJDYXNlKCkgOiBmYWxzZTtcbiAgICAgICAgICAgIHVyaSA9IChzc2xFbmFibGVkID8gXCJodHRwc1wiIDogXCJodHRwXCIpICsgXCI6Ly9cIiArIGhvc3QgKyBcIjpcIiArIHBvcnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlYWQgc3VjY2VzcyBtZXNzYWdlXG4gICAgICAgICAgaWYgKGxpbmUuaW5kZXhPZihcIlN0YXJ0aW5nIHdhbGxldCBSUEMgc2VydmVyXCIpID49IDApIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gZ2V0IHVzZXJuYW1lIGFuZCBwYXNzd29yZCBmcm9tIHBhcmFtc1xuICAgICAgICAgICAgbGV0IHVzZXJQYXNzSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtbG9naW5cIik7XG4gICAgICAgICAgICBsZXQgdXNlclBhc3MgPSB1c2VyUGFzc0lkeCA+PSAwID8gY29uZmlnLmNtZFt1c2VyUGFzc0lkeCArIDFdIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHVzZXJuYW1lID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZygwLCB1c2VyUGFzcy5pbmRleE9mKCc6JykpO1xuICAgICAgICAgICAgbGV0IHBhc3N3b3JkID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZyh1c2VyUGFzcy5pbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gY3JlYXRlIGNsaWVudCBjb25uZWN0ZWQgdG8gaW50ZXJuYWwgcHJvY2Vzc1xuICAgICAgICAgICAgY29uZmlnID0gY29uZmlnLmNvcHkoKS5zZXRTZXJ2ZXIoe3VyaTogdXJpLCB1c2VybmFtZTogdXNlcm5hbWUsIHBhc3N3b3JkOiBwYXNzd29yZCwgcmVqZWN0VW5hdXRob3JpemVkOiBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWR9KTtcbiAgICAgICAgICAgIGNvbmZpZy5jbWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0UnBjLmNvbm5lY3RUb1dhbGxldFJwYyhjb25maWcpO1xuICAgICAgICAgICAgd2FsbGV0LnByb2Nlc3MgPSBwcm9jZXNzO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyByZXNvbHZlIHByb21pc2Ugd2l0aCBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3MgXG4gICAgICAgICAgICB0aGlzLmlzUmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZSh3YWxsZXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3RkZXJyXG4gICAgICAgIHByb2Nlc3Muc3RkZXJyLm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBjb25zb2xlLmVycm9yKGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBleGl0XG4gICAgICAgIHByb2Nlc3Mub24oXCJleGl0XCIsIGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIHByb2Nlc3MgdGVybWluYXRlZCB3aXRoIGV4aXQgY29kZSBcIiArIGNvZGUgKyAob3V0cHV0ID8gXCI6XFxuXFxuXCIgKyBvdXRwdXQgOiBcIlwiKSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBlcnJvclxuICAgICAgICBwcm9jZXNzLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgaWYgKGVyci5tZXNzYWdlLmluZGV4T2YoXCJFTk9FTlRcIikgPj0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihcIm1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGV4aXN0IGF0IHBhdGggJ1wiICsgY29uZmlnLmNtZFswXSArIFwiJ1wiKSk7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSB1bmNhdWdodCBleGNlcHRpb25cbiAgICAgICAgcHJvY2Vzcy5vbihcInVuY2F1Z2h0RXhjZXB0aW9uXCIsIGZ1bmN0aW9uKGVyciwgb3JpZ2luKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuY2F1Z2h0IGV4Y2VwdGlvbiBpbiBtb25lcm8td2FsbGV0LXJwYyBwcm9jZXNzOiBcIiArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKG9yaWdpbik7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNsZWFyKCkge1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICAgIGRlbGV0ZSB0aGlzLmFkZHJlc3NDYWNoZTtcbiAgICB0aGlzLmFkZHJlc3NDYWNoZSA9IHt9O1xuICAgIHRoaXMucGF0aCA9IHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldEFjY291bnRJbmRpY2VzKGdldFN1YmFkZHJlc3NJbmRpY2VzPzogYW55KSB7XG4gICAgbGV0IGluZGljZXMgPSBuZXcgTWFwKCk7XG4gICAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCB0aGlzLmdldEFjY291bnRzKCkpIHtcbiAgICAgIGluZGljZXMuc2V0KGFjY291bnQuZ2V0SW5kZXgoKSwgZ2V0U3ViYWRkcmVzc0luZGljZXMgPyBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NJbmRpY2VzKGFjY291bnQuZ2V0SW5kZXgoKSkgOiB1bmRlZmluZWQpO1xuICAgIH1cbiAgICByZXR1cm4gaW5kaWNlcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldFN1YmFkZHJlc3NJbmRpY2VzKGFjY291bnRJZHgpIHtcbiAgICBsZXQgc3ViYWRkcmVzc0luZGljZXMgPSBbXTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hZGRyZXNzXCIsIHthY2NvdW50X2luZGV4OiBhY2NvdW50SWR4fSk7XG4gICAgZm9yIChsZXQgYWRkcmVzcyBvZiByZXNwLnJlc3VsdC5hZGRyZXNzZXMpIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2goYWRkcmVzcy5hZGRyZXNzX2luZGV4KTtcbiAgICByZXR1cm4gc3ViYWRkcmVzc0luZGljZXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRUcmFuc2ZlcnNBdXgocXVlcnk6IE1vbmVyb1RyYW5zZmVyUXVlcnkpIHtcbiAgICBcbiAgICAvLyBidWlsZCBwYXJhbXMgZm9yIGdldF90cmFuc2ZlcnMgcnBjIGNhbGxcbiAgICBsZXQgdHhRdWVyeSA9IHF1ZXJ5LmdldFR4UXVlcnkoKTtcbiAgICBsZXQgY2FuQmVDb25maXJtZWQgPSB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SW5UeFBvb2woKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJc1JlbGF5ZWQoKSAhPT0gZmFsc2U7XG4gICAgbGV0IGNhbkJlSW5UeFBvb2wgPSB0eFF1ZXJ5LmdldElzQ29uZmlybWVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRJblR4UG9vbCgpICE9PSBmYWxzZSAmJiB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IHRydWUgJiYgdHhRdWVyeS5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkICYmIHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCAmJiB0eFF1ZXJ5LmdldElzTG9ja2VkKCkgIT09IGZhbHNlO1xuICAgIGxldCBjYW5CZUluY29taW5nID0gcXVlcnkuZ2V0SXNJbmNvbWluZygpICE9PSBmYWxzZSAmJiBxdWVyeS5nZXRJc091dGdvaW5nKCkgIT09IHRydWUgJiYgcXVlcnkuZ2V0SGFzRGVzdGluYXRpb25zKCkgIT09IHRydWU7XG4gICAgbGV0IGNhbkJlT3V0Z29pbmcgPSBxdWVyeS5nZXRJc091dGdvaW5nKCkgIT09IGZhbHNlICYmIHF1ZXJ5LmdldElzSW5jb21pbmcoKSAhPT0gdHJ1ZTtcblxuICAgIC8vIGNoZWNrIGlmIGZldGNoaW5nIHBvb2wgdHhzIGNvbnRyYWRpY3RlZCBieSBjb25maWd1cmF0aW9uXG4gICAgaWYgKHR4UXVlcnkuZ2V0SW5UeFBvb2woKSA9PT0gdHJ1ZSAmJiAhY2FuQmVJblR4UG9vbCkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IGZldGNoIHBvb2wgdHJhbnNhY3Rpb25zIGJlY2F1c2UgaXQgY29udHJhZGljdHMgY29uZmlndXJhdGlvblwiKTtcbiAgICB9XG5cbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMuaW4gPSBjYW5CZUluY29taW5nICYmIGNhbkJlQ29uZmlybWVkO1xuICAgIHBhcmFtcy5vdXQgPSBjYW5CZU91dGdvaW5nICYmIGNhbkJlQ29uZmlybWVkO1xuICAgIHBhcmFtcy5wb29sID0gY2FuQmVJbmNvbWluZyAmJiBjYW5CZUluVHhQb29sO1xuICAgIHBhcmFtcy5wZW5kaW5nID0gY2FuQmVPdXRnb2luZyAmJiBjYW5CZUluVHhQb29sO1xuICAgIHBhcmFtcy5mYWlsZWQgPSB0eFF1ZXJ5LmdldElzRmFpbGVkKCkgIT09IGZhbHNlICYmIHR4UXVlcnkuZ2V0SXNDb25maXJtZWQoKSAhPT0gdHJ1ZSAmJiB0eFF1ZXJ5LmdldEluVHhQb29sKCkgIT0gdHJ1ZTtcbiAgICBpZiAodHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHhRdWVyeS5nZXRNaW5IZWlnaHQoKSA+IDApIHBhcmFtcy5taW5faGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAtIDE7IC8vIFRPRE8gbW9uZXJvLXByb2plY3Q6IHdhbGxldDI6OmdldF9wYXltZW50cygpIG1pbl9oZWlnaHQgaXMgZXhjbHVzaXZlLCBzbyBtYW51YWxseSBvZmZzZXQgdG8gbWF0Y2ggaW50ZW5kZWQgcmFuZ2UgKGlzc3VlcyAjNTc1MSwgIzU1OTgpXG4gICAgICBlbHNlIHBhcmFtcy5taW5faGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKTtcbiAgICB9XG4gICAgaWYgKHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgcGFyYW1zLm1heF9oZWlnaHQgPSB0eFF1ZXJ5LmdldE1heEhlaWdodCgpO1xuICAgIHBhcmFtcy5maWx0ZXJfYnlfaGVpZ2h0ID0gdHhRdWVyeS5nZXRNaW5IZWlnaHQoKSAhPT0gdW5kZWZpbmVkIHx8IHR4UXVlcnkuZ2V0TWF4SGVpZ2h0KCkgIT09IHVuZGVmaW5lZDtcbiAgICBpZiAocXVlcnkuZ2V0QWNjb3VudEluZGV4KCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0KHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpID09PSB1bmRlZmluZWQgJiYgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkLCBcIlF1ZXJ5IHNwZWNpZmllcyBhIHN1YmFkZHJlc3MgaW5kZXggYnV0IG5vdCBhbiBhY2NvdW50IGluZGV4XCIpO1xuICAgICAgcGFyYW1zLmFsbF9hY2NvdW50cyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhcmFtcy5hY2NvdW50X2luZGV4ID0gcXVlcnkuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgICBcbiAgICAgIC8vIHNldCBzdWJhZGRyZXNzIGluZGljZXMgcGFyYW1cbiAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IG5ldyBTZXQoKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAhPT0gdW5kZWZpbmVkKSBzdWJhZGRyZXNzSW5kaWNlcy5hZGQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5tYXAoc3ViYWRkcmVzc0lkeCA9PiBzdWJhZGRyZXNzSW5kaWNlcy5hZGQoc3ViYWRkcmVzc0lkeCkpO1xuICAgICAgaWYgKHN1YmFkZHJlc3NJbmRpY2VzLnNpemUpIHBhcmFtcy5zdWJhZGRyX2luZGljZXMgPSBBcnJheS5mcm9tKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICB9XG4gICAgXG4gICAgLy8gY2FjaGUgdW5pcXVlIHR4cyBhbmQgYmxvY2tzXG4gICAgbGV0IHR4TWFwID0ge307XG4gICAgbGV0IGJsb2NrTWFwID0ge307XG4gICAgXG4gICAgLy8gYnVpbGQgdHhzIHVzaW5nIGBnZXRfdHJhbnNmZXJzYFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3RyYW5zZmVyc1wiLCBwYXJhbXMpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhyZXNwLnJlc3VsdCkpIHtcbiAgICAgIGZvciAobGV0IHJwY1R4IG9mIHJlc3AucmVzdWx0W2tleV0pIHtcbiAgICAgICAgLy9pZiAocnBjVHgudHhpZCA9PT0gcXVlcnkuZGVidWdUeElkKSBjb25zb2xlLmxvZyhycGNUeCk7XG4gICAgICAgIGxldCB0eCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHgpO1xuICAgICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkgYXNzZXJ0KHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCkgPiAtMSk7XG4gICAgICAgIFxuICAgICAgICAvLyByZXBsYWNlIHRyYW5zZmVyIGFtb3VudCB3aXRoIGRlc3RpbmF0aW9uIHN1bVxuICAgICAgICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBjb25maXJtZWQgdHggZnJvbS90byBzYW1lIGFjY291bnQgaGFzIGFtb3VudCAwIGJ1dCBjYWNoZWQgdHJhbnNmZXJzXG4gICAgICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRJc1JlbGF5ZWQoKSAmJiAhdHguZ2V0SXNGYWlsZWQoKSAmJlxuICAgICAgICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldERlc3RpbmF0aW9ucygpICYmIHR4LmdldE91dGdvaW5nQW1vdW50KCkgPT09IDBuKSB7XG4gICAgICAgICAgbGV0IG91dGdvaW5nVHJhbnNmZXIgPSB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCk7XG4gICAgICAgICAgbGV0IHRyYW5zZmVyVG90YWwgPSBCaWdJbnQoMCk7XG4gICAgICAgICAgZm9yIChsZXQgZGVzdGluYXRpb24gb2Ygb3V0Z29pbmdUcmFuc2Zlci5nZXREZXN0aW5hdGlvbnMoKSkgdHJhbnNmZXJUb3RhbCA9IHRyYW5zZmVyVG90YWwgKyBkZXN0aW5hdGlvbi5nZXRBbW91bnQoKTtcbiAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0QW1vdW50KHRyYW5zZmVyVG90YWwpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBtZXJnZSB0eFxuICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc29ydCB0eHMgYnkgYmxvY2sgaGVpZ2h0XG4gICAgbGV0IHR4czogTW9uZXJvVHhXYWxsZXRbXSA9IE9iamVjdC52YWx1ZXModHhNYXApO1xuICAgIHR4cy5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQpO1xuICAgIFxuICAgIC8vIGZpbHRlciBhbmQgcmV0dXJuIHRyYW5zZmVyc1xuICAgIGxldCB0cmFuc2ZlcnMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIFxuICAgICAgLy8gdHggaXMgbm90IGluY29taW5nL291dGdvaW5nIHVubGVzcyBhbHJlYWR5IHNldFxuICAgICAgaWYgKHR4LmdldElzSW5jb21pbmcoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0luY29taW5nKGZhbHNlKTtcbiAgICAgIGlmICh0eC5nZXRJc091dGdvaW5nKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNPdXRnb2luZyhmYWxzZSk7XG4gICAgICBcbiAgICAgIC8vIHNvcnQgaW5jb21pbmcgdHJhbnNmZXJzXG4gICAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpLnNvcnQoTW9uZXJvV2FsbGV0UnBjLmNvbXBhcmVJbmNvbWluZ1RyYW5zZmVycyk7XG4gICAgICBcbiAgICAgIC8vIGNvbGxlY3QgcXVlcmllZCB0cmFuc2ZlcnMsIGVyYXNlIGlmIGV4Y2x1ZGVkXG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5maWx0ZXJUcmFuc2ZlcnMocXVlcnkpKSB7XG4gICAgICAgIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcmVtb3ZlIHR4cyB3aXRob3V0IHJlcXVlc3RlZCB0cmFuc2ZlclxuICAgICAgaWYgKHR4LmdldEJsb2NrKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT09IHVuZGVmaW5lZCAmJiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHguZ2V0QmxvY2soKS5nZXRUeHMoKS5zcGxpY2UodHguZ2V0QmxvY2soKS5nZXRUeHMoKS5pbmRleE9mKHR4KSwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRPdXRwdXRzQXV4KHF1ZXJ5KSB7XG4gICAgXG4gICAgLy8gZGV0ZXJtaW5lIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBiZSBxdWVyaWVkXG4gICAgbGV0IGluZGljZXMgPSBuZXcgTWFwKCk7XG4gICAgaWYgKHF1ZXJ5LmdldEFjY291bnRJbmRleCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IG5ldyBTZXQoKTtcbiAgICAgIGlmIChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAhPT0gdW5kZWZpbmVkKSBzdWJhZGRyZXNzSW5kaWNlcy5hZGQocXVlcnkuZ2V0U3ViYWRkcmVzc0luZGV4KCkpO1xuICAgICAgaWYgKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5tYXAoc3ViYWRkcmVzc0lkeCA9PiBzdWJhZGRyZXNzSW5kaWNlcy5hZGQoc3ViYWRkcmVzc0lkeCkpO1xuICAgICAgaW5kaWNlcy5zZXQocXVlcnkuZ2V0QWNjb3VudEluZGV4KCksIHN1YmFkZHJlc3NJbmRpY2VzLnNpemUgPyBBcnJheS5mcm9tKHN1YmFkZHJlc3NJbmRpY2VzKSA6IHVuZGVmaW5lZCk7ICAvLyB1bmRlZmluZWQgd2lsbCBmZXRjaCBmcm9tIGFsbCBzdWJhZGRyZXNzZXNcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXJ0LmVxdWFsKHF1ZXJ5LmdldFN1YmFkZHJlc3NJbmRleCgpLCB1bmRlZmluZWQsIFwiUXVlcnkgc3BlY2lmaWVzIGEgc3ViYWRkcmVzcyBpbmRleCBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIilcbiAgICAgIGFzc2VydChxdWVyeS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpID09PSB1bmRlZmluZWQgfHwgcXVlcnkuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDAsIFwiUXVlcnkgc3BlY2lmaWVzIHN1YmFkZHJlc3MgaW5kaWNlcyBidXQgbm90IGFuIGFjY291bnQgaW5kZXhcIik7XG4gICAgICBpbmRpY2VzID0gYXdhaXQgdGhpcy5nZXRBY2NvdW50SW5kaWNlcygpOyAgLy8gZmV0Y2ggYWxsIGFjY291bnQgaW5kaWNlcyB3aXRob3V0IHN1YmFkZHJlc3Nlc1xuICAgIH1cbiAgICBcbiAgICAvLyBjYWNoZSB1bmlxdWUgdHhzIGFuZCBibG9ja3NcbiAgICBsZXQgdHhNYXAgPSB7fTtcbiAgICBsZXQgYmxvY2tNYXAgPSB7fTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IHR4cyB3aXRoIG91dHB1dHMgZm9yIGVhY2ggaW5kaWNhdGVkIGFjY291bnQgdXNpbmcgYGluY29taW5nX3RyYW5zZmVyc2AgcnBjIGNhbGxcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBwYXJhbXMudHJhbnNmZXJfdHlwZSA9IHF1ZXJ5LmdldElzU3BlbnQoKSA9PT0gdHJ1ZSA/IFwidW5hdmFpbGFibGVcIiA6IHF1ZXJ5LmdldElzU3BlbnQoKSA9PT0gZmFsc2UgPyBcImF2YWlsYWJsZVwiIDogXCJhbGxcIjtcbiAgICBwYXJhbXMudmVyYm9zZSA9IHRydWU7XG4gICAgZm9yIChsZXQgYWNjb3VudElkeCBvZiBpbmRpY2VzLmtleXMoKSkge1xuICAgIFxuICAgICAgLy8gc2VuZCByZXF1ZXN0XG4gICAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGFjY291bnRJZHg7XG4gICAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gaW5kaWNlcy5nZXQoYWNjb3VudElkeCk7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImluY29taW5nX3RyYW5zZmVyc1wiLCBwYXJhbXMpO1xuICAgICAgXG4gICAgICAvLyBjb252ZXJ0IHJlc3BvbnNlIHRvIHR4cyB3aXRoIG91dHB1dHMgYW5kIG1lcmdlXG4gICAgICBpZiAocmVzcC5yZXN1bHQudHJhbnNmZXJzID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuICAgICAgZm9yIChsZXQgcnBjT3V0cHV0IG9mIHJlc3AucmVzdWx0LnRyYW5zZmVycykge1xuICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2FsbGV0V2l0aE91dHB1dChycGNPdXRwdXQpO1xuICAgICAgICBNb25lcm9XYWxsZXRScGMubWVyZ2VUeCh0eCwgdHhNYXAsIGJsb2NrTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc29ydCB0eHMgYnkgYmxvY2sgaGVpZ2h0XG4gICAgbGV0IHR4czogTW9uZXJvVHhXYWxsZXRbXSA9IE9iamVjdC52YWx1ZXModHhNYXApO1xuICAgIHR4cy5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQpO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgcXVlcmllZCBvdXRwdXRzXG4gICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgIFxuICAgICAgLy8gc29ydCBvdXRwdXRzXG4gICAgICBpZiAodHguZ2V0T3V0cHV0cygpICE9PSB1bmRlZmluZWQpIHR4LmdldE91dHB1dHMoKS5zb3J0KE1vbmVyb1dhbGxldFJwYy5jb21wYXJlT3V0cHV0cyk7XG4gICAgICBcbiAgICAgIC8vIGNvbGxlY3QgcXVlcmllZCBvdXRwdXRzLCBlcmFzZSBpZiBleGNsdWRlZFxuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmZpbHRlck91dHB1dHMocXVlcnkpKSBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICAgIFxuICAgICAgLy8gcmVtb3ZlIGV4Y2x1ZGVkIHR4cyBmcm9tIGJsb2NrXG4gICAgICBpZiAodHguZ2V0T3V0cHV0cygpID09PSB1bmRlZmluZWQgJiYgdHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuc3BsaWNlKHR4LmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCksIDEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbW1vbiBtZXRob2QgdG8gZ2V0IGtleSBpbWFnZXMuXG4gICAqIFxuICAgKiBAcGFyYW0gYWxsIC0gcGVjaWZpZXMgdG8gZ2V0IGFsbCB4b3Igb25seSBuZXcgaW1hZ2VzIGZyb20gbGFzdCBpbXBvcnRcbiAgICogQHJldHVybiB7TW9uZXJvS2V5SW1hZ2VbXX0gYXJlIHRoZSBrZXkgaW1hZ2VzXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgcnBjRXhwb3J0S2V5SW1hZ2VzKGFsbCkge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZXhwb3J0X2tleV9pbWFnZXNcIiwge2FsbDogYWxsfSk7XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5zaWduZWRfa2V5X2ltYWdlcykgcmV0dXJuIFtdO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5zaWduZWRfa2V5X2ltYWdlcy5tYXAocnBjSW1hZ2UgPT4gbmV3IE1vbmVyb0tleUltYWdlKHJwY0ltYWdlLmtleV9pbWFnZSwgcnBjSW1hZ2Uuc2lnbmF0dXJlKSk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBycGNTd2VlcEFjY291bnQoY29uZmlnKSB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGFuIGFjY291bnQgaW5kZXggdG8gc3dlZXAgZnJvbVwiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCAhPSAxKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZXhhY3RseSBvbmUgZGVzdGluYXRpb24gdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGRlc3RpbmF0aW9uIGFkZHJlc3MgdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBhbW91bnQgaW4gc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0S2V5SW1hZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJLZXkgaW1hZ2UgZGVmaW5lZDsgdXNlIHN3ZWVwT3V0cHV0KCkgdG8gc3dlZXAgYW4gb3V0cHV0IGJ5IGl0cyBrZXkgaW1hZ2VcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJFbXB0eSBsaXN0IGdpdmVuIGZvciBzdWJhZGRyZXNzZXMgaW5kaWNlcyB0byBzd2VlcFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyB3aXRoIFJQQyBgc3dlZXBfYWxsYFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN3ZWVwaW5nIG91dHB1dCBkb2VzIG5vdCBzdXBwb3J0IHN1YnRyYWN0aW5nIGZlZXMgZnJvbSBkZXN0aW5hdGlvbnNcIik7XG4gICAgXG4gICAgLy8gc3dlZXAgZnJvbSBhbGwgc3ViYWRkcmVzc2VzIGlmIG5vdCBvdGhlcndpc2UgZGVmaW5lZFxuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25maWcuc2V0U3ViYWRkcmVzc0luZGljZXMoW10pO1xuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3Nlcyhjb25maWcuZ2V0QWNjb3VudEluZGV4KCkpKSB7XG4gICAgICAgIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLnB1c2goc3ViYWRkcmVzcy5nZXRJbmRleCgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gc3ViYWRkcmVzc2VzIHRvIHN3ZWVwIGZyb21cIik7XG4gICAgXG4gICAgLy8gY29tbW9uIGNvbmZpZyBwYXJhbXNcbiAgICBsZXQgcGFyYW1zOiBhbnkgPSB7fTtcbiAgICBsZXQgcmVsYXkgPSBjb25maWcuZ2V0UmVsYXkoKSA9PT0gdHJ1ZTtcbiAgICBwYXJhbXMuYWNjb3VudF9pbmRleCA9IGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKTtcbiAgICBwYXJhbXMuc3ViYWRkcl9pbmRpY2VzID0gY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCk7XG4gICAgcGFyYW1zLmFkZHJlc3MgPSBjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpO1xuICAgIGFzc2VydChjb25maWcuZ2V0UHJpb3JpdHkoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcmlvcml0eSgpID49IDAgJiYgY29uZmlnLmdldFByaW9yaXR5KCkgPD0gMyk7XG4gICAgcGFyYW1zLnByaW9yaXR5ID0gY29uZmlnLmdldFByaW9yaXR5KCk7XG4gICAgaWYgKGNvbmZpZy5nZXRVbmxvY2tUaW1lKCkgIT09IHVuZGVmaW5lZCkgcGFyYW1zLnVubG9ja190aW1lID0gY29uZmlnLmdldFVubG9ja1RpbWUoKTtcbiAgICBwYXJhbXMucGF5bWVudF9pZCA9IGNvbmZpZy5nZXRQYXltZW50SWQoKTtcbiAgICBwYXJhbXMuZG9fbm90X3JlbGF5ID0gIXJlbGF5O1xuICAgIHBhcmFtcy5iZWxvd19hbW91bnQgPSBjb25maWcuZ2V0QmVsb3dBbW91bnQoKTtcbiAgICBwYXJhbXMuZ2V0X3R4X2tleXMgPSB0cnVlO1xuICAgIHBhcmFtcy5nZXRfdHhfaGV4ID0gdHJ1ZTtcbiAgICBwYXJhbXMuZ2V0X3R4X21ldGFkYXRhID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBpbnZva2Ugd2FsbGV0IHJwYyBgc3dlZXBfYWxsYFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3dlZXBfYWxsXCIsIHBhcmFtcyk7XG4gICAgbGV0IHJlc3VsdCA9IHJlc3AucmVzdWx0O1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHhzIGZyb20gcmVzcG9uc2VcbiAgICBsZXQgdHhTZXQgPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1NlbnRUeHNUb1R4U2V0KHJlc3VsdCwgdW5kZWZpbmVkLCBjb25maWcpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgcmVtYWluaW5nIGtub3duIGZpZWxkc1xuICAgIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB7XG4gICAgICB0eC5zZXRJc0xvY2tlZCh0cnVlKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICB0eC5zZXRSZWxheShyZWxheSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChyZWxheSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQocmVsYXkpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIGxldCB0cmFuc2ZlciA9IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKTtcbiAgICAgIHRyYW5zZmVyLnNldEFjY291bnRJbmRleChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkpO1xuICAgICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSkgdHJhbnNmZXIuc2V0U3ViYWRkcmVzc0luZGljZXMoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkpO1xuICAgICAgbGV0IGRlc3RpbmF0aW9uID0gbmV3IE1vbmVyb0Rlc3RpbmF0aW9uKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCksIEJpZ0ludCh0cmFuc2Zlci5nZXRBbW91bnQoKSkpO1xuICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKFtkZXN0aW5hdGlvbl0pO1xuICAgICAgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgICB0eC5zZXRQYXltZW50SWQoY29uZmlnLmdldFBheW1lbnRJZCgpKTtcbiAgICAgIGlmICh0eC5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0VW5sb2NrVGltZShjb25maWcuZ2V0VW5sb2NrVGltZSgpID09PSB1bmRlZmluZWQgPyAwIDogY29uZmlnLmdldFVubG9ja1RpbWUoKSk7XG4gICAgICBpZiAodHguZ2V0UmVsYXkoKSkge1xuICAgICAgICBpZiAodHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgrbmV3IERhdGUoKS5nZXRUaW1lKCkpOyAgLy8gVE9ETyAobW9uZXJvLXdhbGxldC1ycGMpOiBwcm92aWRlIHRpbWVzdGFtcCBvbiByZXNwb25zZTsgdW5jb25maXJtZWQgdGltZXN0YW1wcyB2YXJ5XG4gICAgICAgIGlmICh0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbigpID09PSB1bmRlZmluZWQpIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHR4U2V0LmdldFR4cygpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBpZiAodGhpcy53YWxsZXRQb2xsZXIgPT0gdW5kZWZpbmVkICYmIHRoaXMubGlzdGVuZXJzLmxlbmd0aCkgdGhpcy53YWxsZXRQb2xsZXIgPSBuZXcgV2FsbGV0UG9sbGVyKHRoaXMpO1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkKSB0aGlzLndhbGxldFBvbGxlci5zZXRJc1BvbGxpbmcodGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQb2xsIGlmIGxpc3RlbmluZy5cbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBwb2xsKCkge1xuICAgIGlmICh0aGlzLndhbGxldFBvbGxlciAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2FsbGV0UG9sbGVyLmlzUG9sbGluZykgYXdhaXQgdGhpcy53YWxsZXRQb2xsZXIucG9sbCgpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgU1RBVElDIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVDb25maWcodXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogTW9uZXJvV2FsbGV0Q29uZmlnIHtcbiAgICBsZXQgY29uZmlnOiB1bmRlZmluZWQgfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gPSB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbmZpZyA9PT0gXCJzdHJpbmdcIiB8fCAodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPikudXJpKSBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKHtzZXJ2ZXI6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29uZmlnIGFzIHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4sIHVzZXJuYW1lLCBwYXNzd29yZCl9KTtcbiAgICBlbHNlIGlmIChHZW5VdGlscy5pc0FycmF5KHVyaU9yQ29uZmlnKSkgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh7Y21kOiB1cmlPckNvbmZpZyBhcyBzdHJpbmdbXX0pO1xuICAgIGVsc2UgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pO1xuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlciA9PT0gdW5kZWZpbmVkKSBjb25maWcucHJveHlUb1dvcmtlciA9IHRydWU7XG4gICAgcmV0dXJuIGNvbmZpZyBhcyBNb25lcm9XYWxsZXRDb25maWc7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZW1vdmUgY3JpdGVyaWEgd2hpY2ggcmVxdWlyZXMgbG9va2luZyB1cCBvdGhlciB0cmFuc2ZlcnMvb3V0cHV0cyB0b1xuICAgKiBmdWxmaWxsIHF1ZXJ5LlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBxdWVyeSAtIHRoZSBxdWVyeSB0byBkZWNvbnRleHR1YWxpemVcbiAgICogQHJldHVybiB7TW9uZXJvVHhRdWVyeX0gYSByZWZlcmVuY2UgdG8gdGhlIHF1ZXJ5IGZvciBjb252ZW5pZW5jZVxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBkZWNvbnRleHR1YWxpemUocXVlcnkpIHtcbiAgICBxdWVyeS5zZXRJc0luY29taW5nKHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0SXNPdXRnb2luZyh1bmRlZmluZWQpO1xuICAgIHF1ZXJ5LnNldFRyYW5zZmVyUXVlcnkodW5kZWZpbmVkKTtcbiAgICBxdWVyeS5zZXRJbnB1dFF1ZXJ5KHVuZGVmaW5lZCk7XG4gICAgcXVlcnkuc2V0T3V0cHV0UXVlcnkodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gcXVlcnk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgaXNDb250ZXh0dWFsKHF1ZXJ5KSB7XG4gICAgaWYgKCFxdWVyeSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghcXVlcnkuZ2V0VHhRdWVyeSgpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRJc0luY29taW5nKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7IC8vIHJlcXVpcmVzIGdldHRpbmcgb3RoZXIgdHJhbnNmZXJzXG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRJc091dGdvaW5nKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKHF1ZXJ5IGluc3RhbmNlb2YgTW9uZXJvVHJhbnNmZXJRdWVyeSkge1xuICAgICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRPdXRwdXRRdWVyeSgpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIG91dHB1dHNcbiAgICB9IGVsc2UgaWYgKHF1ZXJ5IGluc3RhbmNlb2YgTW9uZXJvT3V0cHV0UXVlcnkpIHtcbiAgICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0VHJhbnNmZXJRdWVyeSgpICE9PSB1bmRlZmluZWQpIHJldHVybiB0cnVlOyAvLyByZXF1aXJlcyBnZXR0aW5nIG90aGVyIHRyYW5zZmVyc1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJxdWVyeSBtdXN0IGJlIHR4IG9yIHRyYW5zZmVyIHF1ZXJ5XCIpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0FjY291bnQocnBjQWNjb3VudCkge1xuICAgIGxldCBhY2NvdW50ID0gbmV3IE1vbmVyb0FjY291bnQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQWNjb3VudCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNBY2NvdW50W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFjY291bnRfaW5kZXhcIikgYWNjb3VudC5zZXRJbmRleCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhbGFuY2VcIikgYWNjb3VudC5zZXRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZF9iYWxhbmNlXCIpIGFjY291bnQuc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJiYXNlX2FkZHJlc3NcIikgYWNjb3VudC5zZXRQcmltYXJ5QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhZ1wiKSBhY2NvdW50LnNldFRhZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhYmVsXCIpIHsgfSAvLyBsYWJlbCBiZWxvbmdzIHRvIGZpcnN0IHN1YmFkZHJlc3NcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGFjY291bnQgZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgaWYgKFwiXCIgPT09IGFjY291bnQuZ2V0VGFnKCkpIGFjY291bnQuc2V0VGFnKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIGFjY291bnQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1N1YmFkZHJlc3MocnBjU3ViYWRkcmVzcykge1xuICAgIGxldCBzdWJhZGRyZXNzID0gbmV3IE1vbmVyb1N1YmFkZHJlc3MoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjU3ViYWRkcmVzcykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNTdWJhZGRyZXNzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFjY291bnRfaW5kZXhcIikgc3ViYWRkcmVzcy5zZXRBY2NvdW50SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzX2luZGV4XCIpIHN1YmFkZHJlc3Muc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzXCIpIHN1YmFkZHJlc3Muc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJhbGFuY2VcIikgc3ViYWRkcmVzcy5zZXRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZF9iYWxhbmNlXCIpIHN1YmFkZHJlc3Muc2V0VW5sb2NrZWRCYWxhbmNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fdW5zcGVudF9vdXRwdXRzXCIpIHN1YmFkZHJlc3Muc2V0TnVtVW5zcGVudE91dHB1dHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYWJlbFwiKSB7IGlmICh2YWwpIHN1YmFkZHJlc3Muc2V0TGFiZWwodmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVzZWRcIikgc3ViYWRkcmVzcy5zZXRJc1VzZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja3NfdG9fdW5sb2NrXCIpIHN1YmFkZHJlc3Muc2V0TnVtQmxvY2tzVG9VbmxvY2sodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PSBcInRpbWVfdG9fdW5sb2NrXCIpIHt9ICAvLyBpZ25vcmluZ1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgc3ViYWRkcmVzcyBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gc3ViYWRkcmVzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgc2VudCB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIFRPRE86IHJlbW92ZSBjb3B5RGVzdGluYXRpb25zIGFmdGVyID4xOC4zLjEgd2hlbiBzdWJ0cmFjdEZlZUZyb20gZnVsbHkgc3VwcG9ydGVkXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4Q29uZmlnfSBjb25maWcgLSBzZW5kIGNvbmZpZ1xuICAgKiBAcGFyYW0ge01vbmVyb1R4V2FsbGV0fSBbdHhdIC0gZXhpc3RpbmcgdHJhbnNhY3Rpb24gdG8gaW5pdGlhbGl6ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gY29weURlc3RpbmF0aW9ucyAtIGNvcGllcyBjb25maWcgZGVzdGluYXRpb25zIGlmIHRydWVcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IGlzIHRoZSBpbml0aWFsaXplZCBzZW5kIHR4XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGluaXRTZW50VHhXYWxsZXQoY29uZmlnLCB0eCwgY29weURlc3RpbmF0aW9ucykge1xuICAgIGlmICghdHgpIHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgbGV0IHJlbGF5ID0gY29uZmlnLmdldFJlbGF5KCkgPT09IHRydWU7XG4gICAgdHguc2V0SXNPdXRnb2luZyh0cnVlKTtcbiAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICB0eC5zZXRJblR4UG9vbChyZWxheSk7XG4gICAgdHguc2V0UmVsYXkocmVsYXkpO1xuICAgIHR4LnNldElzUmVsYXllZChyZWxheSk7XG4gICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgdHguc2V0SXNMb2NrZWQodHJ1ZSk7XG4gICAgdHguc2V0UmluZ1NpemUoTW9uZXJvVXRpbHMuUklOR19TSVpFKTtcbiAgICBsZXQgdHJhbnNmZXIgPSBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpO1xuICAgIHRyYW5zZmVyLnNldFR4KHR4KTtcbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAxKSB0cmFuc2Zlci5zZXRTdWJhZGRyZXNzSW5kaWNlcyhjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5zbGljZSgwKSk7IC8vIHdlIGtub3cgc3JjIHN1YmFkZHJlc3MgaW5kaWNlcyBpZmYgY29uZmlnIHNwZWNpZmllcyAxXG4gICAgaWYgKGNvcHlEZXN0aW5hdGlvbnMpIHtcbiAgICAgIGxldCBkZXN0Q29waWVzID0gW107XG4gICAgICBmb3IgKGxldCBkZXN0IG9mIGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSkgZGVzdENvcGllcy5wdXNoKGRlc3QuY29weSgpKTtcbiAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhkZXN0Q29waWVzKTtcbiAgICB9XG4gICAgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgdHguc2V0UGF5bWVudElkKGNvbmZpZy5nZXRQYXltZW50SWQoKSk7XG4gICAgaWYgKHR4LmdldFVubG9ja1RpbWUoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRVbmxvY2tUaW1lKGNvbmZpZy5nZXRVbmxvY2tUaW1lKCkgPT09IHVuZGVmaW5lZCA/IDAgOiBjb25maWcuZ2V0VW5sb2NrVGltZSgpKTtcbiAgICBpZiAoY29uZmlnLmdldFJlbGF5KCkpIHtcbiAgICAgIGlmICh0eC5nZXRMYXN0UmVsYXllZFRpbWVzdGFtcCgpID09PSB1bmRlZmluZWQpIHR4LnNldExhc3RSZWxheWVkVGltZXN0YW1wKCtuZXcgRGF0ZSgpLmdldFRpbWUoKSk7ICAvLyBUT0RPIChtb25lcm8td2FsbGV0LXJwYyk6IHByb3ZpZGUgdGltZXN0YW1wIG9uIHJlc3BvbnNlOyB1bmNvbmZpcm1lZCB0aW1lc3RhbXBzIHZhcnlcbiAgICAgIGlmICh0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbigpID09PSB1bmRlZmluZWQpIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKGZhbHNlKTtcbiAgICB9XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSB0eCBzZXQgZnJvbSBhIFJQQyBtYXAgZXhjbHVkaW5nIHR4cy5cbiAgICogXG4gICAqIEBwYXJhbSBycGNNYXAgLSBtYXAgdG8gaW5pdGlhbGl6ZSB0aGUgdHggc2V0IGZyb21cbiAgICogQHJldHVybiBNb25lcm9UeFNldCAtIGluaXRpYWxpemVkIHR4IHNldFxuICAgKiBAcmV0dXJuIHRoZSByZXN1bHRpbmcgdHggc2V0XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFNldChycGNNYXApIHtcbiAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoKTtcbiAgICB0eFNldC5zZXRNdWx0aXNpZ1R4SGV4KHJwY01hcC5tdWx0aXNpZ190eHNldCk7XG4gICAgdHhTZXQuc2V0VW5zaWduZWRUeEhleChycGNNYXAudW5zaWduZWRfdHhzZXQpO1xuICAgIHR4U2V0LnNldFNpZ25lZFR4SGV4KHJwY01hcC5zaWduZWRfdHhzZXQpO1xuICAgIGlmICh0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KCkgIT09IHVuZGVmaW5lZCAmJiB0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KCkubGVuZ3RoID09PSAwKSB0eFNldC5zZXRNdWx0aXNpZ1R4SGV4KHVuZGVmaW5lZCk7XG4gICAgaWYgKHR4U2V0LmdldFVuc2lnbmVkVHhIZXgoKSAhPT0gdW5kZWZpbmVkICYmIHR4U2V0LmdldFVuc2lnbmVkVHhIZXgoKS5sZW5ndGggPT09IDApIHR4U2V0LnNldFVuc2lnbmVkVHhIZXgodW5kZWZpbmVkKTtcbiAgICBpZiAodHhTZXQuZ2V0U2lnbmVkVHhIZXgoKSAhPT0gdW5kZWZpbmVkICYmIHR4U2V0LmdldFNpZ25lZFR4SGV4KCkubGVuZ3RoID09PSAwKSB0eFNldC5zZXRTaWduZWRUeEhleCh1bmRlZmluZWQpO1xuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGEgTW9uZXJvVHhTZXQgZnJvbSBhIGxpc3Qgb2YgcnBjIHR4cy5cbiAgICogXG4gICAqIEBwYXJhbSBycGNUeHMgLSBycGMgdHhzIHRvIGluaXRpYWxpemUgdGhlIHNldCBmcm9tXG4gICAqIEBwYXJhbSB0eHMgLSBleGlzdGluZyB0eHMgdG8gZnVydGhlciBpbml0aWFsaXplIChvcHRpb25hbClcbiAgICogQHBhcmFtIGNvbmZpZyAtIHR4IGNvbmZpZ1xuICAgKiBAcmV0dXJuIHRoZSBjb252ZXJ0ZWQgdHggc2V0XG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTZW50VHhzVG9UeFNldChycGNUeHM6IGFueSwgdHhzPzogYW55LCBjb25maWc/OiBhbnkpIHtcbiAgICBcbiAgICAvLyBidWlsZCBzaGFyZWQgdHggc2V0XG4gICAgbGV0IHR4U2V0ID0gTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFNldChycGNUeHMpO1xuXG4gICAgLy8gZ2V0IG51bWJlciBvZiB0eHNcbiAgICBsZXQgbnVtVHhzID0gcnBjVHhzLmZlZV9saXN0ID8gcnBjVHhzLmZlZV9saXN0Lmxlbmd0aCA6IHJwY1R4cy50eF9oYXNoX2xpc3QgPyBycGNUeHMudHhfaGFzaF9saXN0Lmxlbmd0aCA6IDA7XG4gICAgXG4gICAgLy8gZG9uZSBpZiBycGMgcmVzcG9uc2UgY29udGFpbnMgbm8gdHhzXG4gICAgaWYgKG51bVR4cyA9PT0gMCkge1xuICAgICAgYXNzZXJ0LmVxdWFsKHR4cywgdW5kZWZpbmVkKTtcbiAgICAgIHJldHVybiB0eFNldDtcbiAgICB9XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eHMgaWYgbm9uZSBnaXZlblxuICAgIGlmICh0eHMpIHR4U2V0LnNldFR4cyh0eHMpO1xuICAgIGVsc2Uge1xuICAgICAgdHhzID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVR4czsgaSsrKSB0eHMucHVzaChuZXcgTW9uZXJvVHhXYWxsZXQoKSk7XG4gICAgfVxuICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgdHguc2V0VHhTZXQodHhTZXQpO1xuICAgICAgdHguc2V0SXNPdXRnb2luZyh0cnVlKTtcbiAgICB9XG4gICAgdHhTZXQuc2V0VHhzKHR4cyk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eHMgZnJvbSBycGMgbGlzdHNcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVHhzKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1R4c1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJ0eF9oYXNoX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRIYXNoKHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfa2V5X2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRLZXkodmFsW2ldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9ibG9iX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRGdWxsSGV4KHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfbWV0YWRhdGFfbGlzdFwiKSBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykgdHhzW2ldLnNldE1ldGFkYXRhKHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlX2xpc3RcIikgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHR4c1tpXS5zZXRGZWUoQmlnSW50KHZhbFtpXSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndlaWdodF9saXN0XCIpIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB0eHNbaV0uc2V0V2VpZ2h0KHZhbFtpXSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50X2xpc3RcIikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh0eHNbaV0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpID09IHVuZGVmaW5lZCkgdHhzW2ldLnNldE91dGdvaW5nVHJhbnNmZXIobmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eHNbaV0pKTtcbiAgICAgICAgICB0eHNbaV0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldEFtb3VudChCaWdJbnQodmFsW2ldKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtdWx0aXNpZ190eHNldFwiIHx8IGtleSA9PT0gXCJ1bnNpZ25lZF90eHNldFwiIHx8IGtleSA9PT0gXCJzaWduZWRfdHhzZXRcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGVudF9rZXlfaW1hZ2VzX2xpc3RcIikge1xuICAgICAgICBsZXQgaW5wdXRLZXlJbWFnZXNMaXN0ID0gdmFsO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0S2V5SW1hZ2VzTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIEdlblV0aWxzLmFzc2VydFRydWUodHhzW2ldLmdldElucHV0cygpID09PSB1bmRlZmluZWQpO1xuICAgICAgICAgIHR4c1tpXS5zZXRJbnB1dHMoW10pO1xuICAgICAgICAgIGZvciAobGV0IGlucHV0S2V5SW1hZ2Ugb2YgaW5wdXRLZXlJbWFnZXNMaXN0W2ldW1wia2V5X2ltYWdlc1wiXSkge1xuICAgICAgICAgICAgdHhzW2ldLmdldElucHV0cygpLnB1c2gobmV3IE1vbmVyb091dHB1dFdhbGxldCgpLnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSgpLnNldEhleChpbnB1dEtleUltYWdlKSkuc2V0VHgodHhzW2ldKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50c19ieV9kZXN0X2xpc3RcIikge1xuICAgICAgICBsZXQgYW1vdW50c0J5RGVzdExpc3QgPSB2YWw7XG4gICAgICAgIGxldCBkZXN0aW5hdGlvbklkeCA9IDA7XG4gICAgICAgIGZvciAobGV0IHR4SWR4ID0gMDsgdHhJZHggPCBhbW91bnRzQnlEZXN0TGlzdC5sZW5ndGg7IHR4SWR4KyspIHtcbiAgICAgICAgICBsZXQgYW1vdW50c0J5RGVzdCA9IGFtb3VudHNCeURlc3RMaXN0W3R4SWR4XVtcImFtb3VudHNcIl07XG4gICAgICAgICAgaWYgKHR4c1t0eElkeF0uZ2V0T3V0Z29pbmdUcmFuc2ZlcigpID09PSB1bmRlZmluZWQpIHR4c1t0eElkeF0uc2V0T3V0Z29pbmdUcmFuc2ZlcihuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHR4c1t0eElkeF0pKTtcbiAgICAgICAgICB0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXREZXN0aW5hdGlvbnMoW10pO1xuICAgICAgICAgIGZvciAobGV0IGFtb3VudCBvZiBhbW91bnRzQnlEZXN0KSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCA9PT0gMSkgdHhzW3R4SWR4XS5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudCkpKTsgLy8gc3dlZXBpbmcgY2FuIGNyZWF0ZSBtdWx0aXBsZSB0eHMgd2l0aCBvbmUgYWRkcmVzc1xuICAgICAgICAgICAgZWxzZSB0eHNbdHhJZHhdLmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXREZXN0aW5hdGlvbnMoKS5wdXNoKG5ldyBNb25lcm9EZXN0aW5hdGlvbihjb25maWcuZ2V0RGVzdGluYXRpb25zKClbZGVzdGluYXRpb25JZHgrK10uZ2V0QWRkcmVzcygpLCBCaWdJbnQoYW1vdW50KSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgdHJhbnNhY3Rpb24gZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydHMgYSBycGMgdHggd2l0aCBhIHRyYW5zZmVyIHRvIGEgdHggc2V0IHdpdGggYSB0eCBhbmQgdHJhbnNmZXIuXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHggLSBycGMgdHggdG8gYnVpbGQgZnJvbVxuICAgKiBAcGFyYW0gdHggLSBleGlzdGluZyB0eCB0byBjb250aW51ZSBpbml0aWFsaXppbmcgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gaXNPdXRnb2luZyAtIHNwZWNpZmllcyBpZiB0aGUgdHggaXMgb3V0Z29pbmcgaWYgdHJ1ZSwgaW5jb21pbmcgaWYgZmFsc2UsIG9yIGRlY29kZXMgZnJvbSB0eXBlIGlmIHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gY29uZmlnIC0gdHggY29uZmlnXG4gICAqIEByZXR1cm4gdGhlIGluaXRpYWxpemVkIHR4IHNldCB3aXRoIGEgdHhcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4VG9UeFNldChycGNUeCwgdHgsIGlzT3V0Z29pbmcsIGNvbmZpZykge1xuICAgIGxldCB0eFNldCA9IE1vbmVyb1dhbGxldFJwYy5jb252ZXJ0UnBjVHhTZXQocnBjVHgpO1xuICAgIHR4U2V0LnNldFR4cyhbTW9uZXJvV2FsbGV0UnBjLmNvbnZlcnRScGNUeFdpdGhUcmFuc2ZlcihycGNUeCwgdHgsIGlzT3V0Z29pbmcsIGNvbmZpZykuc2V0VHhTZXQodHhTZXQpXSk7XG4gICAgcmV0dXJuIHR4U2V0O1xuICB9XG4gIFxuICAvKipcbiAgICogQnVpbGRzIGEgTW9uZXJvVHhXYWxsZXQgZnJvbSBhIFJQQyB0eC5cbiAgICogXG4gICAqIEBwYXJhbSBycGNUeCAtIHJwYyB0eCB0byBidWlsZCBmcm9tXG4gICAqIEBwYXJhbSB0eCAtIGV4aXN0aW5nIHR4IHRvIGNvbnRpbnVlIGluaXRpYWxpemluZyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBpc091dGdvaW5nIC0gc3BlY2lmaWVzIGlmIHRoZSB0eCBpcyBvdXRnb2luZyBpZiB0cnVlLCBpbmNvbWluZyBpZiBmYWxzZSwgb3IgZGVjb2RlcyBmcm9tIHR5cGUgaWYgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBjb25maWcgLSB0eCBjb25maWdcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IGlzIHRoZSBpbml0aWFsaXplZCB0eFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhXaXRoVHJhbnNmZXIocnBjVHg6IGFueSwgdHg/OiBhbnksIGlzT3V0Z29pbmc/OiBhbnksIGNvbmZpZz86IGFueSkgeyAgLy8gVE9ETzogY2hhbmdlIGV2ZXJ5dGhpbmcgdG8gc2FmZSBzZXRcbiAgICAgICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eCB0byByZXR1cm5cbiAgICBpZiAoIXR4KSB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgdHggc3RhdGUgZnJvbSBycGMgdHlwZVxuICAgIGlmIChycGNUeC50eXBlICE9PSB1bmRlZmluZWQpIGlzT3V0Z29pbmcgPSBNb25lcm9XYWxsZXRScGMuZGVjb2RlUnBjVHlwZShycGNUeC50eXBlLCB0eCk7XG4gICAgZWxzZSBhc3NlcnQuZXF1YWwodHlwZW9mIGlzT3V0Z29pbmcsIFwiYm9vbGVhblwiLCBcIk11c3QgaW5kaWNhdGUgaWYgdHggaXMgb3V0Z29pbmcgKHRydWUpIHhvciBpbmNvbWluZyAoZmFsc2UpIHNpbmNlIHVua25vd25cIik7XG4gICAgXG4gICAgLy8gVE9ETzogc2FmZSBzZXRcbiAgICAvLyBpbml0aWFsaXplIHJlbWFpbmluZyBmaWVsZHMgIFRPRE86IHNlZW1zIHRoaXMgc2hvdWxkIGJlIHBhcnQgb2YgY29tbW9uIGZ1bmN0aW9uIHdpdGggRGFlbW9uUnBjLmNvbnZlcnRScGNUeFxuICAgIGxldCBoZWFkZXI7XG4gICAgbGV0IHRyYW5zZmVyO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUeCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUeFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJ0eGlkXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVcIikgdHguc2V0RmVlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJub3RlXCIpIHsgaWYgKHZhbCkgdHguc2V0Tm90ZSh2YWwpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfa2V5XCIpIHR4LnNldEtleSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR5cGVcIikgeyB9IC8vIHR5cGUgYWxyZWFkeSBoYW5kbGVkXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfc2l6ZVwiKSB0eC5zZXRTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrX3RpbWVcIikgdHguc2V0VW5sb2NrVGltZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndlaWdodFwiKSB0eC5zZXRXZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsb2NrZWRcIikgdHguc2V0SXNMb2NrZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9ibG9iXCIpIHR4LnNldEZ1bGxIZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9tZXRhZGF0YVwiKSB0eC5zZXRNZXRhZGF0YSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRvdWJsZV9zcGVuZF9zZWVuXCIpIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfaGVpZ2h0XCIgfHwga2V5ID09PSBcImhlaWdodFwiKSB7XG4gICAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSB7XG4gICAgICAgICAgaWYgKCFoZWFkZXIpIGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgICAgICAgIGhlYWRlci5zZXRIZWlnaHQodmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRpbWVzdGFtcFwiKSB7XG4gICAgICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSB7XG4gICAgICAgICAgaWYgKCFoZWFkZXIpIGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgICAgICAgIGhlYWRlci5zZXRUaW1lc3RhbXAodmFsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyB0aW1lc3RhbXAgb2YgdW5jb25maXJtZWQgdHggaXMgY3VycmVudCByZXF1ZXN0IHRpbWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNvbmZpcm1hdGlvbnNcIikgdHguc2V0TnVtQ29uZmlybWF0aW9ucyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1Z2dlc3RlZF9jb25maXJtYXRpb25zX3RocmVzaG9sZFwiKSB7XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IChpc091dGdvaW5nID8gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKSA6IG5ldyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyKCkpLnNldFR4KHR4KTtcbiAgICAgICAgaWYgKCFpc091dGdvaW5nKSB0cmFuc2Zlci5zZXROdW1TdWdnZXN0ZWRDb25maXJtYXRpb25zKHZhbCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIHtcbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gKGlzT3V0Z29pbmcgPyBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpIDogbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKSkuc2V0VHgodHgpO1xuICAgICAgICB0cmFuc2Zlci5zZXRBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudHNcIikge30gIC8vIGlnbm9yaW5nLCBhbW91bnRzIHN1bSB0byBhbW91bnRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzXCIpIHtcbiAgICAgICAgaWYgKCFpc091dGdvaW5nKSB7XG4gICAgICAgICAgaWYgKCF0cmFuc2ZlcikgdHJhbnNmZXIgPSBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcigpLnNldFR4KHR4KTtcbiAgICAgICAgICB0cmFuc2Zlci5zZXRBZGRyZXNzKHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwYXltZW50X2lkXCIpIHtcbiAgICAgICAgaWYgKFwiXCIgIT09IHZhbCAmJiBNb25lcm9UeFdhbGxldC5ERUZBVUxUX1BBWU1FTlRfSUQgIT09IHZhbCkgdHguc2V0UGF5bWVudElkKHZhbCk7ICAvLyBkZWZhdWx0IGlzIHVuZGVmaW5lZFxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1YmFkZHJfaW5kZXhcIikgYXNzZXJ0KHJwY1R4LnN1YmFkZHJfaW5kaWNlcyk7ICAvLyBoYW5kbGVkIGJ5IHN1YmFkZHJfaW5kaWNlc1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1YmFkZHJfaW5kaWNlc1wiKSB7XG4gICAgICAgIGlmICghdHJhbnNmZXIpIHRyYW5zZmVyID0gKGlzT3V0Z29pbmcgPyBuZXcgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcigpIDogbmV3IE1vbmVyb0luY29taW5nVHJhbnNmZXIoKSkuc2V0VHgodHgpO1xuICAgICAgICBsZXQgcnBjSW5kaWNlcyA9IHZhbDtcbiAgICAgICAgdHJhbnNmZXIuc2V0QWNjb3VudEluZGV4KHJwY0luZGljZXNbMF0ubWFqb3IpO1xuICAgICAgICBpZiAoaXNPdXRnb2luZykge1xuICAgICAgICAgIGxldCBzdWJhZGRyZXNzSW5kaWNlcyA9IFtdO1xuICAgICAgICAgIGZvciAobGV0IHJwY0luZGV4IG9mIHJwY0luZGljZXMpIHN1YmFkZHJlc3NJbmRpY2VzLnB1c2gocnBjSW5kZXgubWlub3IpO1xuICAgICAgICAgIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRpY2VzKHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhc3NlcnQuZXF1YWwocnBjSW5kaWNlcy5sZW5ndGgsIDEpO1xuICAgICAgICAgIHRyYW5zZmVyLnNldFN1YmFkZHJlc3NJbmRleChycGNJbmRpY2VzWzBdLm1pbm9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRlc3RpbmF0aW9uc1wiIHx8IGtleSA9PSBcInJlY2lwaWVudHNcIikge1xuICAgICAgICBhc3NlcnQoaXNPdXRnb2luZyk7XG4gICAgICAgIGxldCBkZXN0aW5hdGlvbnMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgcnBjRGVzdGluYXRpb24gb2YgdmFsKSB7XG4gICAgICAgICAgbGV0IGRlc3RpbmF0aW9uID0gbmV3IE1vbmVyb0Rlc3RpbmF0aW9uKCk7XG4gICAgICAgICAgZGVzdGluYXRpb25zLnB1c2goZGVzdGluYXRpb24pO1xuICAgICAgICAgIGZvciAobGV0IGRlc3RpbmF0aW9uS2V5IG9mIE9iamVjdC5rZXlzKHJwY0Rlc3RpbmF0aW9uKSkge1xuICAgICAgICAgICAgaWYgKGRlc3RpbmF0aW9uS2V5ID09PSBcImFkZHJlc3NcIikgZGVzdGluYXRpb24uc2V0QWRkcmVzcyhycGNEZXN0aW5hdGlvbltkZXN0aW5hdGlvbktleV0pO1xuICAgICAgICAgICAgZWxzZSBpZiAoZGVzdGluYXRpb25LZXkgPT09IFwiYW1vdW50XCIpIGRlc3RpbmF0aW9uLnNldEFtb3VudChCaWdJbnQocnBjRGVzdGluYXRpb25bZGVzdGluYXRpb25LZXldKSk7XG4gICAgICAgICAgICBlbHNlIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlVucmVjb2duaXplZCB0cmFuc2FjdGlvbiBkZXN0aW5hdGlvbiBmaWVsZDogXCIgKyBkZXN0aW5hdGlvbktleSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0cmFuc2ZlciA9PT0gdW5kZWZpbmVkKSB0cmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKHt0eDogdHh9KTtcbiAgICAgICAgdHJhbnNmZXIuc2V0RGVzdGluYXRpb25zKGRlc3RpbmF0aW9ucyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibXVsdGlzaWdfdHhzZXRcIiAmJiB2YWwgIT09IHVuZGVmaW5lZCkge30gLy8gaGFuZGxlZCBlbHNld2hlcmU7IHRoaXMgbWV0aG9kIG9ubHkgYnVpbGRzIGEgdHggd2FsbGV0XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5zaWduZWRfdHhzZXRcIiAmJiB2YWwgIT09IHVuZGVmaW5lZCkge30gLy8gaGFuZGxlZCBlbHNld2hlcmU7IHRoaXMgbWV0aG9kIG9ubHkgYnVpbGRzIGEgdHggd2FsbGV0XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50X2luXCIpIHR4LnNldElucHV0U3VtKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRfb3V0XCIpIHR4LnNldE91dHB1dFN1bShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY2hhbmdlX2FkZHJlc3NcIikgdHguc2V0Q2hhbmdlQWRkcmVzcyh2YWwgPT09IFwiXCIgPyB1bmRlZmluZWQgOiB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNoYW5nZV9hbW91bnRcIikgdHguc2V0Q2hhbmdlQW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkdW1teV9vdXRwdXRzXCIpIHR4LnNldE51bUR1bW15T3V0cHV0cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImV4dHJhXCIpIHR4LnNldEV4dHJhSGV4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmluZ19zaXplXCIpIHR4LnNldFJpbmdTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlbnRfa2V5X2ltYWdlc1wiKSB7XG4gICAgICAgIGxldCBpbnB1dEtleUltYWdlcyA9IHZhbC5rZXlfaW1hZ2VzO1xuICAgICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR4LmdldElucHV0cygpID09PSB1bmRlZmluZWQpO1xuICAgICAgICB0eC5zZXRJbnB1dHMoW10pO1xuICAgICAgICBmb3IgKGxldCBpbnB1dEtleUltYWdlIG9mIGlucHV0S2V5SW1hZ2VzKSB7XG4gICAgICAgICAgdHguZ2V0SW5wdXRzKCkucHVzaChuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCkuc2V0S2V5SW1hZ2UobmV3IE1vbmVyb0tleUltYWdlKCkuc2V0SGV4KGlucHV0S2V5SW1hZ2UpKS5zZXRUeCh0eCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50c19ieV9kZXN0XCIpIHtcbiAgICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShpc091dGdvaW5nKTtcbiAgICAgICAgbGV0IGFtb3VudHNCeURlc3QgPSB2YWwuYW1vdW50cztcbiAgICAgICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGgsIGFtb3VudHNCeURlc3QubGVuZ3RoKTtcbiAgICAgICAgaWYgKHRyYW5zZmVyID09PSB1bmRlZmluZWQpIHRyYW5zZmVyID0gbmV3IE1vbmVyb091dGdvaW5nVHJhbnNmZXIoKS5zZXRUeCh0eCk7XG4gICAgICAgIHRyYW5zZmVyLnNldERlc3RpbmF0aW9ucyhbXSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdHJhbnNmZXIuZ2V0RGVzdGluYXRpb25zKCkucHVzaChuZXcgTW9uZXJvRGVzdGluYXRpb24oY29uZmlnLmdldERlc3RpbmF0aW9ucygpW2ldLmdldEFkZHJlc3MoKSwgQmlnSW50KGFtb3VudHNCeURlc3RbaV0pKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIHRyYW5zYWN0aW9uIGZpZWxkIHdpdGggdHJhbnNmZXI6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbGluayBibG9jayBhbmQgdHhcbiAgICBpZiAoaGVhZGVyKSB0eC5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soaGVhZGVyKS5zZXRUeHMoW3R4XSkpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgZmluYWwgZmllbGRzXG4gICAgaWYgKHRyYW5zZmVyKSB7XG4gICAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICBpZiAoIXRyYW5zZmVyLmdldFR4KCkuZ2V0SXNDb25maXJtZWQoKSkgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICAgIGlmIChpc091dGdvaW5nKSB7XG4gICAgICAgIHR4LnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpIHtcbiAgICAgICAgICBpZiAodHJhbnNmZXIuZ2V0RGVzdGluYXRpb25zKCkpIHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5zZXREZXN0aW5hdGlvbnModW5kZWZpbmVkKTsgLy8gb3ZlcndyaXRlIHRvIGF2b2lkIHJlY29uY2lsZSBlcnJvciBUT0RPOiByZW1vdmUgYWZ0ZXIgPjE4LjMuMSB3aGVuIGFtb3VudHNfYnlfZGVzdCBzdXBwb3J0ZWRcbiAgICAgICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkubWVyZ2UodHJhbnNmZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgdHguc2V0T3V0Z29pbmdUcmFuc2Zlcih0cmFuc2Zlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0eC5zZXRJc0luY29taW5nKHRydWUpO1xuICAgICAgICB0eC5zZXRJbmNvbWluZ1RyYW5zZmVycyhbdHJhbnNmZXJdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gcmV0dXJuIGluaXRpYWxpemVkIHRyYW5zYWN0aW9uXG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFdhbGxldFdpdGhPdXRwdXQocnBjT3V0cHV0KSB7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB0eFxuICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBvdXRwdXRcbiAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCh7dHg6IHR4fSk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY091dHB1dCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNPdXRwdXRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIG91dHB1dC5zZXRBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZW50XCIpIG91dHB1dC5zZXRJc1NwZW50KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwia2V5X2ltYWdlXCIpIHsgaWYgKFwiXCIgIT09IHZhbCkgb3V0cHV0LnNldEtleUltYWdlKG5ldyBNb25lcm9LZXlJbWFnZSh2YWwpKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImdsb2JhbF9pbmRleFwiKSBvdXRwdXQuc2V0SW5kZXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIpIHR4LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZFwiKSB0eC5zZXRJc0xvY2tlZCghdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmcm96ZW5cIikgb3V0cHV0LnNldElzRnJvemVuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHVia2V5XCIpIG91dHB1dC5zZXRTdGVhbHRoUHVibGljS2V5KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3ViYWRkcl9pbmRleFwiKSB7XG4gICAgICAgIG91dHB1dC5zZXRBY2NvdW50SW5kZXgodmFsLm1ham9yKTtcbiAgICAgICAgb3V0cHV0LnNldFN1YmFkZHJlc3NJbmRleCh2YWwubWlub3IpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiKSB0eC5zZXRCbG9jaygobmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KHZhbCkgYXMgTW9uZXJvQmxvY2spLnNldFR4cyhbdHggYXMgTW9uZXJvVHhdKSk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCB0cmFuc2FjdGlvbiBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHR4IHdpdGggb3V0cHV0XG4gICAgdHguc2V0T3V0cHV0cyhbb3V0cHV0XSk7XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNEZXNjcmliZVRyYW5zZmVyKHJwY0Rlc2NyaWJlVHJhbnNmZXJSZXN1bHQpIHtcbiAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjRGVzY3JpYmVUcmFuc2ZlclJlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNEZXNjcmliZVRyYW5zZmVyUmVzdWx0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImRlc2NcIikge1xuICAgICAgICB0eFNldC5zZXRUeHMoW10pO1xuICAgICAgICBmb3IgKGxldCB0eE1hcCBvZiB2YWwpIHtcbiAgICAgICAgICBsZXQgdHggPSBNb25lcm9XYWxsZXRScGMuY29udmVydFJwY1R4V2l0aFRyYW5zZmVyKHR4TWFwLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgIHR4LnNldFR4U2V0KHR4U2V0KTtcbiAgICAgICAgICB0eFNldC5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1bW1hcnlcIikgeyB9IC8vIFRPRE86IHN1cHBvcnQgdHggc2V0IHN1bW1hcnkgZmllbGRzP1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZGVzY2RyaWJlIHRyYW5zZmVyIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiB0eFNldDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlY29kZXMgYSBcInR5cGVcIiBmcm9tIG1vbmVyby13YWxsZXQtcnBjIHRvIGluaXRpYWxpemUgdHlwZSBhbmQgc3RhdGVcbiAgICogZmllbGRzIGluIHRoZSBnaXZlbiB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIFRPRE86IHRoZXNlIHNob3VsZCBiZSBzYWZlIHNldFxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R5cGUgaXMgdGhlIHR5cGUgdG8gZGVjb2RlXG4gICAqIEBwYXJhbSB0eCBpcyB0aGUgdHJhbnNhY3Rpb24gdG8gZGVjb2RlIGtub3duIGZpZWxkcyB0b1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBycGMgdHlwZSBpbmRpY2F0ZXMgb3V0Z29pbmcgeG9yIGluY29taW5nXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGRlY29kZVJwY1R5cGUocnBjVHlwZSwgdHgpIHtcbiAgICBsZXQgaXNPdXRnb2luZztcbiAgICBpZiAocnBjVHlwZSA9PT0gXCJpblwiKSB7XG4gICAgICBpc091dGdvaW5nID0gZmFsc2U7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwib3V0XCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBvb2xcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7ICAvLyBUT0RPOiBidXQgY291bGQgaXQgYmU/XG4gICAgfSBlbHNlIGlmIChycGNUeXBlID09PSBcInBlbmRpbmdcIikge1xuICAgICAgaXNPdXRnb2luZyA9IHRydWU7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiYmxvY2tcIikge1xuICAgICAgaXNPdXRnb2luZyA9IGZhbHNlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeCh0cnVlKTtcbiAgICB9IGVsc2UgaWYgKHJwY1R5cGUgPT09IFwiZmFpbGVkXCIpIHtcbiAgICAgIGlzT3V0Z29pbmcgPSB0cnVlO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZCh0cnVlKTtcbiAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlVucmVjb2duaXplZCB0cmFuc2ZlciB0eXBlOiBcIiArIHJwY1R5cGUpO1xuICAgIH1cbiAgICByZXR1cm4gaXNPdXRnb2luZztcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1lcmdlcyBhIHRyYW5zYWN0aW9uIGludG8gYSB1bmlxdWUgc2V0IG9mIHRyYW5zYWN0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHtNb25lcm9UeFdhbGxldH0gdHggLSB0aGUgdHJhbnNhY3Rpb24gdG8gbWVyZ2UgaW50byB0aGUgZXhpc3RpbmcgdHhzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB0eE1hcCAtIG1hcHMgdHggaGFzaGVzIHRvIHR4c1xuICAgKiBAcGFyYW0ge09iamVjdH0gYmxvY2tNYXAgLSBtYXBzIGJsb2NrIGhlaWdodHMgdG8gYmxvY2tzXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIG1lcmdlVHgodHgsIHR4TWFwLCBibG9ja01hcCkge1xuICAgIGFzc2VydCh0eC5nZXRIYXNoKCkgIT09IHVuZGVmaW5lZCk7XG4gICAgXG4gICAgLy8gbWVyZ2UgdHhcbiAgICBsZXQgYVR4ID0gdHhNYXBbdHguZ2V0SGFzaCgpXTtcbiAgICBpZiAoYVR4ID09PSB1bmRlZmluZWQpIHR4TWFwW3R4LmdldEhhc2goKV0gPSB0eDsgLy8gY2FjaGUgbmV3IHR4XG4gICAgZWxzZSBhVHgubWVyZ2UodHgpOyAvLyBtZXJnZSB3aXRoIGV4aXN0aW5nIHR4XG4gICAgXG4gICAgLy8gbWVyZ2UgdHgncyBibG9jayBpZiBjb25maXJtZWRcbiAgICBpZiAodHguZ2V0SGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IGFCbG9jayA9IGJsb2NrTWFwW3R4LmdldEhlaWdodCgpXTtcbiAgICAgIGlmIChhQmxvY2sgPT09IHVuZGVmaW5lZCkgYmxvY2tNYXBbdHguZ2V0SGVpZ2h0KCldID0gdHguZ2V0QmxvY2soKTsgLy8gY2FjaGUgbmV3IGJsb2NrXG4gICAgICBlbHNlIGFCbG9jay5tZXJnZSh0eC5nZXRCbG9jaygpKTsgLy8gbWVyZ2Ugd2l0aCBleGlzdGluZyBibG9ja1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byB0cmFuc2FjdGlvbnMgYnkgdGhlaXIgaGVpZ2h0LlxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb21wYXJlVHhzQnlIZWlnaHQodHgxLCB0eDIpIHtcbiAgICBpZiAodHgxLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQgJiYgdHgyLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHJldHVybiAwOyAvLyBib3RoIHVuY29uZmlybWVkXG4gICAgZWxzZSBpZiAodHgxLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHJldHVybiAxOyAgIC8vIHR4MSBpcyB1bmNvbmZpcm1lZFxuICAgIGVsc2UgaWYgKHR4Mi5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gLTE7ICAvLyB0eDIgaXMgdW5jb25maXJtZWRcbiAgICBsZXQgZGlmZiA9IHR4MS5nZXRIZWlnaHQoKSAtIHR4Mi5nZXRIZWlnaHQoKTtcbiAgICBpZiAoZGlmZiAhPT0gMCkgcmV0dXJuIGRpZmY7XG4gICAgcmV0dXJuIHR4MS5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgxKSAtIHR4Mi5nZXRCbG9jaygpLmdldFR4cygpLmluZGV4T2YodHgyKTsgLy8gdHhzIGFyZSBpbiB0aGUgc2FtZSBibG9jayBzbyByZXRhaW4gdGhlaXIgb3JpZ2luYWwgb3JkZXJcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbXBhcmVzIHR3byB0cmFuc2ZlcnMgYnkgYXNjZW5kaW5nIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcy5cbiAgICovXG4gIHN0YXRpYyBjb21wYXJlSW5jb21pbmdUcmFuc2ZlcnModDEsIHQyKSB7XG4gICAgaWYgKHQxLmdldEFjY291bnRJbmRleCgpIDwgdDIuZ2V0QWNjb3VudEluZGV4KCkpIHJldHVybiAtMTtcbiAgICBlbHNlIGlmICh0MS5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdDIuZ2V0QWNjb3VudEluZGV4KCkpIHJldHVybiB0MS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAtIHQyLmdldFN1YmFkZHJlc3NJbmRleCgpO1xuICAgIHJldHVybiAxO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29tcGFyZXMgdHdvIG91dHB1dHMgYnkgYXNjZW5kaW5nIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlcy5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29tcGFyZU91dHB1dHMobzEsIG8yKSB7XG4gICAgXG4gICAgLy8gY29tcGFyZSBieSBoZWlnaHRcbiAgICBsZXQgaGVpZ2h0Q29tcGFyaXNvbiA9IE1vbmVyb1dhbGxldFJwYy5jb21wYXJlVHhzQnlIZWlnaHQobzEuZ2V0VHgoKSwgbzIuZ2V0VHgoKSk7XG4gICAgaWYgKGhlaWdodENvbXBhcmlzb24gIT09IDApIHJldHVybiBoZWlnaHRDb21wYXJpc29uO1xuICAgIFxuICAgIC8vIGNvbXBhcmUgYnkgYWNjb3VudCBpbmRleCwgc3ViYWRkcmVzcyBpbmRleCwgb3V0cHV0IGluZGV4LCB0aGVuIGtleSBpbWFnZSBoZXhcbiAgICBsZXQgY29tcGFyZSA9IG8xLmdldEFjY291bnRJbmRleCgpIC0gbzIuZ2V0QWNjb3VudEluZGV4KCk7XG4gICAgaWYgKGNvbXBhcmUgIT09IDApIHJldHVybiBjb21wYXJlO1xuICAgIGNvbXBhcmUgPSBvMS5nZXRTdWJhZGRyZXNzSW5kZXgoKSAtIG8yLmdldFN1YmFkZHJlc3NJbmRleCgpO1xuICAgIGlmIChjb21wYXJlICE9PSAwKSByZXR1cm4gY29tcGFyZTtcbiAgICBjb21wYXJlID0gbzEuZ2V0SW5kZXgoKSAtIG8yLmdldEluZGV4KCk7XG4gICAgaWYgKGNvbXBhcmUgIT09IDApIHJldHVybiBjb21wYXJlO1xuICAgIHJldHVybiBvMS5nZXRLZXlJbWFnZSgpLmdldEhleCgpLmxvY2FsZUNvbXBhcmUobzIuZ2V0S2V5SW1hZ2UoKS5nZXRIZXgoKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBQb2xscyBtb25lcm8td2FsbGV0LXJwYyB0byBwcm92aWRlIGxpc3RlbmVyIG5vdGlmaWNhdGlvbnMuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIFdhbGxldFBvbGxlciB7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIGlzUG9sbGluZzogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIHdhbGxldDogTW9uZXJvV2FsbGV0UnBjO1xuICBwcm90ZWN0ZWQgbG9vcGVyOiBUYXNrTG9vcGVyO1xuICBwcm90ZWN0ZWQgcHJldkxvY2tlZFR4czogYW55O1xuICBwcm90ZWN0ZWQgcHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9uczogYW55O1xuICBwcm90ZWN0ZWQgcHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnM6IGFueTtcbiAgcHJvdGVjdGVkIHRocmVhZFBvb2w6IGFueTtcbiAgcHJvdGVjdGVkIG51bVBvbGxpbmc6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZIZWlnaHQ6IGFueTtcbiAgcHJvdGVjdGVkIHByZXZCYWxhbmNlczogYW55O1xuICBcbiAgY29uc3RydWN0b3Iod2FsbGV0KSB7XG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIHRoaXMud2FsbGV0ID0gd2FsbGV0O1xuICAgIHRoaXMubG9vcGVyID0gbmV3IFRhc2tMb29wZXIoYXN5bmMgZnVuY3Rpb24oKSB7IGF3YWl0IHRoYXQucG9sbCgpOyB9KTtcbiAgICB0aGlzLnByZXZMb2NrZWRUeHMgPSBbXTtcbiAgICB0aGlzLnByZXZVbmNvbmZpcm1lZE5vdGlmaWNhdGlvbnMgPSBuZXcgU2V0KCk7IC8vIHR4IGhhc2hlcyBvZiBwcmV2aW91cyBub3RpZmljYXRpb25zXG4gICAgdGhpcy5wcmV2Q29uZmlybWVkTm90aWZpY2F0aW9ucyA9IG5ldyBTZXQoKTsgLy8gdHggaGFzaGVzIG9mIHByZXZpb3VzbHkgY29uZmlybWVkIGJ1dCBub3QgeWV0IHVubG9ja2VkIG5vdGlmaWNhdGlvbnNcbiAgICB0aGlzLnRocmVhZFBvb2wgPSBuZXcgVGhyZWFkUG9vbCgxKTsgLy8gc3luY2hyb25pemUgcG9sbHNcbiAgICB0aGlzLm51bVBvbGxpbmcgPSAwO1xuICB9XG4gIFxuICBzZXRJc1BvbGxpbmcoaXNQb2xsaW5nKSB7XG4gICAgdGhpcy5pc1BvbGxpbmcgPSBpc1BvbGxpbmc7XG4gICAgaWYgKGlzUG9sbGluZykgdGhpcy5sb29wZXIuc3RhcnQodGhpcy53YWxsZXQuZ2V0U3luY1BlcmlvZEluTXMoKSk7XG4gICAgZWxzZSB0aGlzLmxvb3Blci5zdG9wKCk7XG4gIH1cbiAgXG4gIHNldFBlcmlvZEluTXMocGVyaW9kSW5Ncykge1xuICAgIHRoaXMubG9vcGVyLnNldFBlcmlvZEluTXMocGVyaW9kSW5Ncyk7XG4gIH1cbiAgXG4gIGFzeW5jIHBvbGwoKSB7XG5cbiAgICAvLyBza2lwIGlmIG5leHQgcG9sbCBpcyBxdWV1ZWRcbiAgICBpZiAodGhpcy5udW1Qb2xsaW5nID4gMSkgcmV0dXJuO1xuICAgIHRoaXMubnVtUG9sbGluZysrO1xuICAgIFxuICAgIC8vIHN5bmNocm9uaXplIHBvbGxzXG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIHJldHVybiB0aGlzLnRocmVhZFBvb2wuc3VibWl0KGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHNraXAgaWYgd2FsbGV0IGlzIGNsb3NlZFxuICAgICAgICBpZiAoYXdhaXQgdGhhdC53YWxsZXQuaXNDbG9zZWQoKSkge1xuICAgICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gdGFrZSBpbml0aWFsIHNuYXBzaG90XG4gICAgICAgIGlmICh0aGF0LnByZXZIZWlnaHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEhlaWdodCgpO1xuICAgICAgICAgIHRoYXQucHJldkxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpKTtcbiAgICAgICAgICB0aGF0LnByZXZCYWxhbmNlcyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldEJhbGFuY2VzKCk7XG4gICAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBhbm5vdW5jZSBoZWlnaHQgY2hhbmdlc1xuICAgICAgICBsZXQgaGVpZ2h0ID0gYXdhaXQgdGhhdC53YWxsZXQuZ2V0SGVpZ2h0KCk7XG4gICAgICAgIGlmICh0aGF0LnByZXZIZWlnaHQgIT09IGhlaWdodCkge1xuICAgICAgICAgIGZvciAobGV0IGkgPSB0aGF0LnByZXZIZWlnaHQ7IGkgPCBoZWlnaHQ7IGkrKykgYXdhaXQgdGhhdC5vbk5ld0Jsb2NrKGkpO1xuICAgICAgICAgIHRoYXQucHJldkhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gZ2V0IGxvY2tlZCB0eHMgZm9yIGNvbXBhcmlzb24gdG8gcHJldmlvdXNcbiAgICAgICAgbGV0IG1pbkhlaWdodCA9IE1hdGgubWF4KDAsIGhlaWdodCAtIDcwKTsgLy8gb25seSBtb25pdG9yIHJlY2VudCB0eHNcbiAgICAgICAgbGV0IGxvY2tlZFR4cyA9IGF3YWl0IHRoYXQud2FsbGV0LmdldFR4cyhuZXcgTW9uZXJvVHhRdWVyeSgpLnNldElzTG9ja2VkKHRydWUpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEluY2x1ZGVPdXRwdXRzKHRydWUpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbGxlY3QgaGFzaGVzIG9mIHR4cyBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCBub0xvbmdlckxvY2tlZEhhc2hlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBwcmV2TG9ja2VkVHggb2YgdGhhdC5wcmV2TG9ja2VkVHhzKSB7XG4gICAgICAgICAgaWYgKHRoYXQuZ2V0VHgobG9ja2VkVHhzLCBwcmV2TG9ja2VkVHguZ2V0SGFzaCgpKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBub0xvbmdlckxvY2tlZEhhc2hlcy5wdXNoKHByZXZMb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gc2F2ZSBsb2NrZWQgdHhzIGZvciBuZXh0IGNvbXBhcmlzb25cbiAgICAgICAgdGhhdC5wcmV2TG9ja2VkVHhzID0gbG9ja2VkVHhzO1xuICAgICAgICBcbiAgICAgICAgLy8gZmV0Y2ggdHhzIHdoaWNoIGFyZSBubyBsb25nZXIgbG9ja2VkXG4gICAgICAgIGxldCB1bmxvY2tlZFR4cyA9IG5vTG9uZ2VyTG9ja2VkSGFzaGVzLmxlbmd0aCA9PT0gMCA/IFtdIDogYXdhaXQgdGhhdC53YWxsZXQuZ2V0VHhzKG5ldyBNb25lcm9UeFF1ZXJ5KCkuc2V0SXNMb2NrZWQoZmFsc2UpLnNldE1pbkhlaWdodChtaW5IZWlnaHQpLnNldEhhc2hlcyhub0xvbmdlckxvY2tlZEhhc2hlcykuc2V0SW5jbHVkZU91dHB1dHModHJ1ZSkpO1xuICAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIG5ldyB1bmNvbmZpcm1lZCBhbmQgY29uZmlybWVkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgbG9ja2VkVHggb2YgbG9ja2VkVHhzKSB7XG4gICAgICAgICAgbGV0IHNlYXJjaFNldCA9IGxvY2tlZFR4LmdldElzQ29uZmlybWVkKCkgPyB0aGF0LnByZXZDb25maXJtZWROb3RpZmljYXRpb25zIDogdGhhdC5wcmV2VW5jb25maXJtZWROb3RpZmljYXRpb25zO1xuICAgICAgICAgIGxldCB1bmFubm91bmNlZCA9ICFzZWFyY2hTZXQuaGFzKGxvY2tlZFR4LmdldEhhc2goKSk7XG4gICAgICAgICAgc2VhcmNoU2V0LmFkZChsb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIGlmICh1bmFubm91bmNlZCkgYXdhaXQgdGhhdC5ub3RpZnlPdXRwdXRzKGxvY2tlZFR4KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gYW5ub3VuY2UgbmV3IHVubG9ja2VkIG91dHB1dHNcbiAgICAgICAgZm9yIChsZXQgdW5sb2NrZWRUeCBvZiB1bmxvY2tlZFR4cykge1xuICAgICAgICAgIHRoYXQucHJldlVuY29uZmlybWVkTm90aWZpY2F0aW9ucy5kZWxldGUodW5sb2NrZWRUeC5nZXRIYXNoKCkpO1xuICAgICAgICAgIHRoYXQucHJldkNvbmZpcm1lZE5vdGlmaWNhdGlvbnMuZGVsZXRlKHVubG9ja2VkVHguZ2V0SGFzaCgpKTtcbiAgICAgICAgICBhd2FpdCB0aGF0Lm5vdGlmeU91dHB1dHModW5sb2NrZWRUeCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGFubm91bmNlIGJhbGFuY2UgY2hhbmdlc1xuICAgICAgICBhd2FpdCB0aGF0LmNoZWNrRm9yQ2hhbmdlZEJhbGFuY2VzKCk7XG4gICAgICAgIHRoYXQubnVtUG9sbGluZy0tO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgdGhhdC5udW1Qb2xsaW5nLS07XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gYmFja2dyb3VuZCBwb2xsIHdhbGxldCAnXCIgKyBhd2FpdCB0aGF0LndhbGxldC5nZXRQYXRoKCkgKyBcIic6IFwiICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgb25OZXdCbG9jayhoZWlnaHQpIHtcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU5ld0Jsb2NrKGhlaWdodCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBub3RpZnlPdXRwdXRzKHR4KSB7XG4gIFxuICAgIC8vIG5vdGlmeSBzcGVudCBvdXRwdXRzIC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogbW9uZXJvLXdhbGxldC1ycGMgZG9lcyBub3QgYWxsb3cgc2NyYXBlIG9mIHR4IGlucHV0cyBzbyBwcm92aWRpbmcgb25lIGlucHV0IHdpdGggb3V0Z29pbmcgYW1vdW50XG4gICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQodHguZ2V0SW5wdXRzKCkgPT09IHVuZGVmaW5lZCk7XG4gICAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCgpXG4gICAgICAgICAgLnNldEFtb3VudCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkgKyB0eC5nZXRGZWUoKSlcbiAgICAgICAgICAuc2V0QWNjb3VudEluZGV4KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRBY2NvdW50SW5kZXgoKSlcbiAgICAgICAgICAuc2V0U3ViYWRkcmVzc0luZGV4KHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMSA/IHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKS5nZXRTdWJhZGRyZXNzSW5kaWNlcygpWzBdIDogdW5kZWZpbmVkKSAvLyBpbml0aWFsaXplIGlmIHRyYW5zZmVyIHNvdXJjZWQgZnJvbSBzaW5nbGUgc3ViYWRkcmVzc1xuICAgICAgICAgIC5zZXRUeCh0eCk7XG4gICAgICB0eC5zZXRJbnB1dHMoW291dHB1dF0pO1xuICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRTcGVudChvdXRwdXQpO1xuICAgIH1cbiAgICBcbiAgICAvLyBub3RpZnkgcmVjZWl2ZWQgb3V0cHV0c1xuICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRPdXRwdXRzKCkubGVuZ3RoID4gMCkgeyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG91dHB1dHMgb25seSByZXR1cm5lZCBmb3IgY29uZmlybWVkIHR4c1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgeyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IG1vbmVyby13YWxsZXQtcnBjIGRvZXMgbm90IGFsbG93IHNjcmFwZSBvZiB1bmNvbmZpcm1lZCByZWNlaXZlZCBvdXRwdXRzIHNvIHVzaW5nIGluY29taW5nIHRyYW5zZmVyIHZhbHVlc1xuICAgICAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB7XG4gICAgICAgICAgb3V0cHV0cy5wdXNoKG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKVxuICAgICAgICAgICAgICAuc2V0QWNjb3VudEluZGV4KHRyYW5zZmVyLmdldEFjY291bnRJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0U3ViYWRkcmVzc0luZGV4KHRyYW5zZmVyLmdldFN1YmFkZHJlc3NJbmRleCgpKVxuICAgICAgICAgICAgICAuc2V0QW1vdW50KHRyYW5zZmVyLmdldEFtb3VudCgpKVxuICAgICAgICAgICAgICAuc2V0VHgodHgpKTtcbiAgICAgICAgfVxuICAgICAgICB0eC5zZXRPdXRwdXRzKG91dHB1dHMpO1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgZ2V0VHgodHhzLCB0eEhhc2gpIHtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIGlmICh0eEhhc2ggPT09IHR4LmdldEhhc2goKSkgcmV0dXJuIHR4O1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjaGVja0ZvckNoYW5nZWRCYWxhbmNlcygpIHtcbiAgICBsZXQgYmFsYW5jZXMgPSBhd2FpdCB0aGlzLndhbGxldC5nZXRCYWxhbmNlcygpO1xuICAgIGlmIChiYWxhbmNlc1swXSAhPT0gdGhpcy5wcmV2QmFsYW5jZXNbMF0gfHwgYmFsYW5jZXNbMV0gIT09IHRoaXMucHJldkJhbGFuY2VzWzFdKSB7XG4gICAgICB0aGlzLnByZXZCYWxhbmNlcyA9IGJhbGFuY2VzO1xuICAgICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQoYmFsYW5jZXNbMF0sIGJhbGFuY2VzWzFdKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGFBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFdBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLGNBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLGlCQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSx1QkFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sWUFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsa0JBQUEsR0FBQVQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFTLG1CQUFBLEdBQUFWLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVSxjQUFBLEdBQUFYLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVyxrQkFBQSxHQUFBWixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVksWUFBQSxHQUFBYixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWEsdUJBQUEsR0FBQWQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFjLHdCQUFB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