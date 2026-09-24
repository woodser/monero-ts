"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _assert = _interopRequireDefault(require("assert"));
var _path = _interopRequireDefault(require("path"));
var _GenUtils = _interopRequireDefault(require("../common/GenUtils"));
var _LibraryUtils = _interopRequireDefault(require("../common/LibraryUtils"));
var _TaskLooper = _interopRequireDefault(require("../common/TaskLooper"));
var _MoneroAccount = _interopRequireDefault(require("./model/MoneroAccount"));
var _MoneroAccountTag = _interopRequireDefault(require("./model/MoneroAccountTag"));
var _MoneroAddressBookEntry = _interopRequireDefault(require("./model/MoneroAddressBookEntry"));
var _MoneroBlock = _interopRequireDefault(require("../daemon/model/MoneroBlock"));
var _MoneroCheckTx = _interopRequireDefault(require("./model/MoneroCheckTx"));
var _MoneroCheckReserve = _interopRequireDefault(require("./model/MoneroCheckReserve"));
var _MoneroDaemonRpc = _interopRequireDefault(require("../daemon/MoneroDaemonRpc"));
var _MoneroError = _interopRequireDefault(require("../common/MoneroError"));

var _MoneroIntegratedAddress = _interopRequireDefault(require("./model/MoneroIntegratedAddress"));

var _MoneroKeyImageExportResult = _interopRequireDefault(require("./model/MoneroKeyImageExportResult"));
var _MoneroKeyImageImportResult = _interopRequireDefault(require("./model/MoneroKeyImageImportResult"));
var _MoneroMultisigInfo = _interopRequireDefault(require("./model/MoneroMultisigInfo"));
var _MoneroMultisigInitResult = _interopRequireDefault(require("./model/MoneroMultisigInitResult"));
var _MoneroMultisigSignResult = _interopRequireDefault(require("./model/MoneroMultisigSignResult"));
var _MoneroNetworkType = _interopRequireDefault(require("../daemon/model/MoneroNetworkType"));

var _MoneroOutputWallet = _interopRequireDefault(require("./model/MoneroOutputWallet"));
var _MoneroRpcConnection = _interopRequireDefault(require("../common/MoneroRpcConnection"));
var _MoneroSubaddress = _interopRequireDefault(require("./model/MoneroSubaddress"));
var _MoneroSyncResult = _interopRequireDefault(require("./model/MoneroSyncResult"));


var _MoneroTxConfig = _interopRequireDefault(require("./model/MoneroTxConfig"));


var _MoneroTxSet = _interopRequireDefault(require("./model/MoneroTxSet"));

var _MoneroTxWallet = _interopRequireDefault(require("./model/MoneroTxWallet"));
var _MoneroWallet = _interopRequireDefault(require("./MoneroWallet"));
var _MoneroWalletConfig = _interopRequireDefault(require("./model/MoneroWalletConfig"));
var _MoneroWalletKeys = require("./MoneroWalletKeys");
var _MoneroWalletListener = _interopRequireDefault(require("./model/MoneroWalletListener"));
var _MoneroMessageSignatureType = _interopRequireDefault(require("./model/MoneroMessageSignatureType"));
var _MoneroMessageSignatureResult = _interopRequireDefault(require("./model/MoneroMessageSignatureResult"));

var _fs = _interopRequireDefault(require("fs"));


/**
 * Implements a Monero wallet using client-side WebAssembly bindings to monero-project's wallet2 in C++.
 */
class MoneroWalletFull extends _MoneroWalletKeys.MoneroWalletKeys {

  // static variables
  static DEFAULT_SYNC_PERIOD_IN_MS = 20000;


  // instance variables











  syncCalls = new Set();

  /**
   * Internal constructor which is given the memory address of a C++ wallet instance.
   * 
   * This constructor should be called through static wallet creation utilities in this class.
   * 
   * @param {number} cppAddress - address of the wallet instance in C++
   * @param {string} path - path of the wallet instance
   * @param {string} password - password of the wallet instance
   * @param {FileSystem} fs - node.js-compatible file system to read/write wallet files
   * @param {boolean} rejectUnauthorized - specifies if unauthorized requests (e.g. self-signed certificates) should be rejected
   * @param {string} rejectUnauthorizedFnId - unique identifier for http_client_wasm to query rejectUnauthorized
   * @param {MoneroWalletFullProxy} walletProxy - proxy to invoke wallet operations in a web worker
   * 
   * @private
   */
  constructor(cppAddress, path, password, fs, rejectUnauthorized, rejectUnauthorizedFnId, walletProxy) {
    super(cppAddress, walletProxy);
    if (walletProxy) return;
    this.path = path;
    this.password = password;
    this.listeners = [];
    this.fs = fs ? fs : path ? MoneroWalletFull.getFs() : undefined;
    this._isClosed = false;
    this.wasmListener = new WalletWasmListener(this); // receives notifications from wasm c++
    this.wasmListenerHandle = 0; // memory address of the wallet listener in c++
    this.rejectUnauthorized = rejectUnauthorized;
    this.rejectUnauthorizedConfigId = rejectUnauthorizedFnId;
    this.syncPeriodInMs = MoneroWalletFull.DEFAULT_SYNC_PERIOD_IN_MS;
    _LibraryUtils.default.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => this.rejectUnauthorized); // register fn informing if unauthorized reqs should be rejected
  }

  // --------------------------- STATIC UTILITIES -----------------------------

  /**
   * Check if a wallet exists at a given path.
   * 
   * @param {string} path - path of the wallet on the file system
   * @param {any} fs - file system compatible with Node.js `fs.promises` API (defaults to disk or in-memory FS if browser)
   * @return {boolean} true if a wallet exists at the given path, false otherwise
   */
  static async walletExists(path, fs) {
    (0, _assert.default)(path, "Must provide a path to look for a wallet");
    if (!fs) fs = MoneroWalletFull.getFs();
    if (!fs) throw new _MoneroError.default("Must provide file system to check if wallet exists");
    let exists = await _LibraryUtils.default.exists(fs, path + ".keys");
    _LibraryUtils.default.log(1, "Wallet exists at " + path + ": " + exists);
    return exists;
  }

  static async openWallet(config) {

    // validate config
    config = new _MoneroWalletConfig.default(config);
    if (config.getProxyToWorker() === undefined) config.setProxyToWorker(true);
    if (config.getSeed() !== undefined) throw new _MoneroError.default("Cannot specify seed when opening wallet");
    if (config.getSeedOffset() !== undefined) throw new _MoneroError.default("Cannot specify seed offset when opening wallet");
    if (config.getPrimaryAddress() !== undefined) throw new _MoneroError.default("Cannot specify primary address when opening wallet");
    if (config.getPrivateViewKey() !== undefined) throw new _MoneroError.default("Cannot specify private view key when opening wallet");
    if (config.getPrivateSpendKey() !== undefined) throw new _MoneroError.default("Cannot specify private spend key when opening wallet");
    if (config.getRestoreHeight() !== undefined) throw new _MoneroError.default("Cannot specify restore height when opening wallet");
    if (config.getLanguage() !== undefined) throw new _MoneroError.default("Cannot specify language when opening wallet");
    if (config.getSaveCurrent() === true) throw new _MoneroError.default("Cannot save current wallet when opening full wallet");
    if (config.getFs() === undefined) config.setFs(MoneroWalletFull.getFs());

    // set server from connection manager if provided
    if (config.getConnectionManager()) {
      if (config.getServer()) throw new _MoneroError.default("Wallet can be opened with a server or connection manager but not both");
      config.setServer(config.getConnectionManager().getConnection());
    }

    // read wallet data from disk unless provided
    if (!config.getKeysData()) {
      let fs = config.getFs();
      if (!fs) throw new _MoneroError.default("Must provide file system to read wallet data from");
      if (!(await this.walletExists(config.getPath(), fs))) throw new _MoneroError.default("Wallet does not exist at path: " + config.getPath());
      config.setKeysData(await fs.readFile(config.getPath() + ".keys"));
      config.setCacheData((await _LibraryUtils.default.exists(fs, config.getPath())) ? await fs.readFile(config.getPath()) : "");
    }

    // open wallet from data
    const wallet = await MoneroWalletFull.openWalletData(config);

    // apply explicit daemon trust
    if (config.getIsTrustedDaemon() !== undefined && config.getServer()) await wallet.setDaemonConnection(config.getServer(), config.getIsTrustedDaemon());

    // set connection manager
    await wallet.setConnectionManager(config.getConnectionManager());
    return wallet;
  }

  static async createWallet(config) {

    // validate config
    if (config === undefined) throw new _MoneroError.default("Must provide config to create wallet");
    if (config.getSeed() !== undefined && (config.getPrimaryAddress() !== undefined || config.getPrivateViewKey() !== undefined || config.getPrivateSpendKey() !== undefined)) throw new _MoneroError.default("Wallet may be initialized with a seed or keys but not both");
    if (config.getNetworkType() === undefined) throw new _MoneroError.default("Must provide a networkType: 'mainnet', 'testnet' or 'stagenet'");
    _MoneroNetworkType.default.validate(config.getNetworkType());
    if (config.getSaveCurrent() === true) throw new _MoneroError.default("Cannot save current wallet when creating full WASM wallet");
    if (config.getPath() === undefined) config.setPath("");
    if (config.getPath() && (await MoneroWalletFull.walletExists(config.getPath(), config.getFs()))) throw new _MoneroError.default("Wallet already exists: " + config.getPath());
    if (config.getPassword() === undefined) config.setPassword("");

    // set server from connection manager if provided
    if (config.getConnectionManager()) {
      if (config.getServer()) throw new _MoneroError.default("Wallet can be created with a server or connection manager but not both");
      config.setServer(config.getConnectionManager().getConnection());
    }

    // create proxied or local wallet
    let wallet;
    if (config.getProxyToWorker() === undefined) config.setProxyToWorker(true);
    if (config.getProxyToWorker()) {
      let walletProxy = await MoneroWalletFullProxy.createWallet(config);
      wallet = new MoneroWalletFull(undefined, undefined, undefined, undefined, undefined, undefined, walletProxy);
    } else {
      if (config.getSeed() !== undefined) {
        if (config.getLanguage() !== undefined) throw new _MoneroError.default("Cannot provide language when creating wallet from seed");
        wallet = await MoneroWalletFull.createWalletFromSeed(config);
      } else if (config.getPrivateSpendKey() !== undefined || config.getPrimaryAddress() !== undefined) {
        if (config.getSeedOffset() !== undefined) throw new _MoneroError.default("Cannot provide seedOffset when creating wallet from keys");
        wallet = await MoneroWalletFull.createWalletFromKeys(config);
      } else {
        if (config.getSeedOffset() !== undefined) throw new _MoneroError.default("Cannot provide seedOffset when creating random wallet");
        if (config.getRestoreHeight() !== undefined) throw new _MoneroError.default("Cannot provide restoreHeight when creating random wallet");
        wallet = await MoneroWalletFull.createWalletRandom(config);
      }
    }

    // set connection manager
    await wallet.setConnectionManager(config.getConnectionManager());
    return wallet;
  }

  static async createWalletFromSeed(config) {

    // validate and normalize params
    let daemonConnection = config.getServer();
    let rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true;
    if (config.getRestoreHeight() === undefined) config.setRestoreHeight(0);
    if (config.getSeedOffset() === undefined) config.setSeedOffset("");

    // load full wasm module
    let module = await _LibraryUtils.default.loadWasmModule();

    // create wallet in queue
    let wallet = await module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // register fn informing if unauthorized reqs should be rejected
        let rejectUnauthorizedFnId = _GenUtils.default.getUUID();
        _LibraryUtils.default.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => rejectUnauthorized);

        // create wallet in wasm which invokes callback when done
        module.create_full_wallet(JSON.stringify(config.toJson()), rejectUnauthorizedFnId, async (cppAddress) => {
          if (typeof cppAddress === "string") reject(new _MoneroError.default(cppAddress));else
          resolve(new MoneroWalletFull(cppAddress, config.getPath(), config.getPassword(), config.getFs(), config.getServer() ? config.getServer().getRejectUnauthorized() : undefined, rejectUnauthorizedFnId));
        });
      });
    });

    // save wallet
    if (config.getPath()) await wallet.save();
    return wallet;
  }

  static async createWalletFromKeys(config) {

    // validate and normalize params
    _MoneroNetworkType.default.validate(config.getNetworkType());
    if (config.getPrimaryAddress() === undefined) config.setPrimaryAddress("");
    if (config.getPrivateViewKey() === undefined) config.setPrivateViewKey("");
    if (config.getPrivateSpendKey() === undefined) config.setPrivateSpendKey("");
    let daemonConnection = config.getServer();
    let rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true;
    if (config.getRestoreHeight() === undefined) config.setRestoreHeight(0);
    if (config.getLanguage() === undefined) config.setLanguage("English");

    // load full wasm module
    let module = await _LibraryUtils.default.loadWasmModule();

    // create wallet in queue
    let wallet = await module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // register fn informing if unauthorized reqs should be rejected
        let rejectUnauthorizedFnId = _GenUtils.default.getUUID();
        _LibraryUtils.default.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => rejectUnauthorized);

        // create wallet in wasm which invokes callback when done
        module.create_full_wallet(JSON.stringify(config.toJson()), rejectUnauthorizedFnId, async (cppAddress) => {
          if (typeof cppAddress === "string") reject(new _MoneroError.default(cppAddress));else
          resolve(new MoneroWalletFull(cppAddress, config.getPath(), config.getPassword(), config.getFs(), config.getServer() ? config.getServer().getRejectUnauthorized() : undefined, rejectUnauthorizedFnId));
        });
      });
    });

    // save wallet
    if (config.getPath()) await wallet.save();
    return wallet;
  }

  static async createWalletRandom(config) {

    // validate and normalize params
    if (config.getLanguage() === undefined) config.setLanguage("English");
    let daemonConnection = config.getServer();
    let rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true;

    // load wasm module
    let module = await _LibraryUtils.default.loadWasmModule();

    // create wallet in queue
    let wallet = await module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // register fn informing if unauthorized reqs should be rejected
        let rejectUnauthorizedFnId = _GenUtils.default.getUUID();
        _LibraryUtils.default.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => rejectUnauthorized);

        // create wallet in wasm which invokes callback when done
        module.create_full_wallet(JSON.stringify(config.toJson()), rejectUnauthorizedFnId, async (cppAddress) => {
          if (typeof cppAddress === "string") reject(new _MoneroError.default(cppAddress));else
          resolve(new MoneroWalletFull(cppAddress, config.getPath(), config.getPassword(), config.getFs(), config.getServer() ? config.getServer().getRejectUnauthorized() : undefined, rejectUnauthorizedFnId));
        });
      });
    });

    // save wallet
    if (config.getPath()) await wallet.save();
    return wallet;
  }

  static async getSeedLanguages() {
    let module = await _LibraryUtils.default.loadWasmModule();
    return module.queueTask(async () => {
      return JSON.parse(module.get_keys_wallet_seed_languages()).languages;
    });
  }

  static getFs() {
    if (!MoneroWalletFull.FS) MoneroWalletFull.FS = _fs.default.promises;
    return MoneroWalletFull.FS;
  }

  // ------------ WALLET METHODS SPECIFIC TO WASM IMPLEMENTATION --------------

  // TODO: move these to MoneroWallet.ts, others can be unsupported

  /**
   * Get the maximum height of the peers the wallet's daemon is connected to.
   *
   * @return {Promise<number>} the maximum height of the peers the wallet's daemon is connected to
   */
  async getDaemonMaxPeerHeight() {
    if (this.getWalletProxy()) return this.getWalletProxy().getDaemonMaxPeerHeight();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // call wasm which invokes callback when done
        this.module.get_daemon_max_peer_height(this.cppAddress, (resp) => {
          if (typeof resp === "string") reject(new _MoneroError.default(resp));else
          resolve(resp);
        });
      });
    });
  }

  /**
   * Indicates if the wallet's daemon is synced with the network.
   * 
   * @return {Promise<boolean>} true if the daemon is synced with the network, false otherwise
   */
  async isDaemonSynced() {
    if (this.getWalletProxy()) return this.getWalletProxy().isDaemonSynced();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // call wasm which invokes callback when done
        this.module.is_daemon_synced(this.cppAddress, (resp) => {
          if (typeof resp === "string") reject(new _MoneroError.default(resp));else
          resolve(resp);
        });
      });
    });
  }

  /**
   * Indicates if the wallet is synced with the daemon.
   * 
   * @return {Promise<boolean>} true if the wallet is synced with the daemon, false otherwise
   */
  async isSynced() {
    if (this.getWalletProxy()) return this.getWalletProxy().isSynced();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.is_synced(this.cppAddress, (resp) => {
          resolve(resp);
        });
      });
    });
  }

  /**
   * Get the wallet's network type (mainnet, testnet, or stagenet).
   * 
   * @return {Promise<MoneroNetworkType>} the wallet's network type
   */
  async getNetworkType() {
    if (this.getWalletProxy()) return this.getWalletProxy().getNetworkType();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.get_network_type(this.cppAddress);
    });
  }

  /**
   * Get the height of the first block that the wallet scans.
   * 
   * @return {Promise<number>} the height of the first block that the wallet scans
   */
  async getRestoreHeight() {
    if (this.getWalletProxy()) return this.getWalletProxy().getRestoreHeight();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.get_restore_height(this.cppAddress);
    });
  }

  /**
   * Set the height of the first block that the wallet scans.
   * 
   * @param {number} restoreHeight - height of the first block that the wallet scans
   * @return {Promise<void>}
   */
  async setRestoreHeight(restoreHeight) {
    if (this.getWalletProxy()) return this.getWalletProxy().setRestoreHeight(restoreHeight);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.set_restore_height(this.cppAddress, restoreHeight);
    });
  }

  /**
   * Move the wallet from its current path to the given path.
   * 
   * @param {string} path - the wallet's destination path
   * @return {Promise<void>}
   */
  async moveTo(path) {
    if (this.getWalletProxy()) return this.getWalletProxy().moveTo(path);
    return MoneroWalletFull.moveTo(path, this);
  }

  // -------------------------- COMMON WALLET METHODS -------------------------

  async addListener(listener) {
    if (this.getWalletProxy()) return this.getWalletProxy().addListener(listener);
    await super.addListener(listener);
    await this.refreshListening();
  }

  async removeListener(listener) {
    if (this.getWalletProxy()) return this.getWalletProxy().removeListener(listener);
    await super.removeListener(listener);
    await this.refreshListening();
  }

  getListeners() {
    if (this.getWalletProxy()) return this.getWalletProxy().getListeners();
    return super.getListeners();
  }

  async setConnectionManager(connectionManager) {
    this.assertNotClosed();
    return super.setConnectionManager(connectionManager);
  }

  async setDaemonConnection(uriOrConnection, isTrusted) {
    if (this.getWalletProxy()) return this.getWalletProxy().setDaemonConnection(uriOrConnection, isTrusted);

    // normalize connection
    let connection = !uriOrConnection ? undefined : uriOrConnection instanceof _MoneroRpcConnection.default ? uriOrConnection : new _MoneroRpcConnection.default(uriOrConnection);
    let uri = connection && connection.getUri() ? connection.getUri() : "";
    let username = connection && connection.getUsername() ? connection.getUsername() : "";
    let password = connection && connection.getPassword() ? connection.getPassword() : "";
    let proxyUri = connection && connection.getProxyUri() ? connection.getProxyUri() : "";
    let rejectUnauthorized = connection ? connection.getRejectUnauthorized() : undefined;
    let isTrustedArg = isTrusted === undefined ? -1 : isTrusted ? 1 : 0; // negative if unset
    this.rejectUnauthorized = rejectUnauthorized; // persist locally

    // set connection in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.set_daemon_connection(this.cppAddress, uri, username, password, proxyUri, isTrustedArg, (resp) => {
          resolve();
        });
      });
    });
  }

  /**
   * Indicates if the wallet's daemon is trusted.
   *
   * @return {Promise<boolean>} true if the daemon is trusted, false otherwise
   */
  async isDaemonTrusted() {
    if (this.getWalletProxy()) return this.getWalletProxy().isDaemonTrusted();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.is_daemon_trusted(this.cppAddress);
    });
  }

  async getDaemonConnection() {
    if (this.getWalletProxy()) return this.getWalletProxy().getDaemonConnection();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        let connectionContainerStr = this.module.get_daemon_connection(this.cppAddress);
        if (!connectionContainerStr) resolve(undefined);else
        {
          let jsonConnection = JSON.parse(connectionContainerStr);
          resolve(new _MoneroRpcConnection.default({ uri: jsonConnection.uri, username: jsonConnection.username, password: jsonConnection.password, proxyUri: jsonConnection.proxyUri, rejectUnauthorized: this.rejectUnauthorized }));
        }
      });
    });
  }

  async isConnectedToDaemon() {
    if (this.getWalletProxy()) return this.getWalletProxy().isConnectedToDaemon();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.is_connected_to_daemon(this.cppAddress, (resp) => {
          resolve(resp);
        });
      });
    });
  }

  async getVersion() {
    if (this.getWalletProxy()) return this.getWalletProxy().getVersion();
    throw new _MoneroError.default("Not implemented");
  }

  async getPath() {
    if (this.getWalletProxy()) return this.getWalletProxy().getPath();
    return this.path;
  }

  async getIntegratedAddress(standardAddress, paymentId) {
    if (this.getWalletProxy()) return this.getWalletProxy().getIntegratedAddress(standardAddress, paymentId);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {
        let result = this.module.get_integrated_address(this.cppAddress, standardAddress ? standardAddress : "", paymentId ? paymentId : "");
        if (result.charAt(0) !== '{') throw new _MoneroError.default(result);
        return new _MoneroIntegratedAddress.default(JSON.parse(result));
      } catch (err) {
        if (err.message.includes("Invalid payment ID")) throw new _MoneroError.default("Invalid payment ID: " + paymentId);
        throw new _MoneroError.default(err.message);
      }
    });
  }

  async decodeIntegratedAddress(integratedAddress) {
    if (this.getWalletProxy()) return this.getWalletProxy().decodeIntegratedAddress(integratedAddress);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {
        let result = this.module.decode_integrated_address(this.cppAddress, integratedAddress);
        if (result.charAt(0) !== '{') throw new _MoneroError.default(result);
        return new _MoneroIntegratedAddress.default(JSON.parse(result));
      } catch (err) {
        throw new _MoneroError.default(err.message);
      }
    });
  }

  async getHeight() {
    if (this.getWalletProxy()) return this.getWalletProxy().getHeight();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_height(this.cppAddress, (resp) => {
          resolve(resp);
        });
      });
    });
  }

  async getDaemonHeight() {
    if (this.getWalletProxy()) return this.getWalletProxy().getDaemonHeight();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_daemon_height(this.cppAddress, (resp) => {
          if (typeof resp === "string") reject(new _MoneroError.default(resp));else
          resolve(resp);
        });
      });
    });
  }

  async getHeightByDate(year, month, day) {
    if (this.getWalletProxy()) return this.getWalletProxy().getHeightByDate(year, month, day);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_height_by_date(this.cppAddress, year, month, day, (resp) => {
          if (typeof resp === "string") reject(new _MoneroError.default(resp));else
          resolve(resp);
        });
      });
    });
  }

  /**
   * Synchronize the wallet with the daemon as a one-time synchronous process.
   * 
   * @param {MoneroWalletListener|number} [listenerOrStartHeight] - listener xor start height (defaults to no sync listener, the last synced block)
   * @param {number} [startHeight] - startHeight if not given in first arg (defaults to last synced block)
   * @param {boolean} [allowConcurrentCalls] - allow other wallet methods to be processed simultaneously during sync (default false)<br><br><b>WARNING</b>: enabling this option will crash wallet execution if another call makes a simultaneous network request. TODO: possible to sync wasm network requests in http_client_wasm.cpp? 
   */
  async sync(listenerOrStartHeight, startHeight, allowConcurrentCalls = false) {
    if (this.getWalletProxy()) return this.getWalletProxy().sync(listenerOrStartHeight, startHeight, allowConcurrentCalls);

    // normalize params
    startHeight = listenerOrStartHeight === undefined || listenerOrStartHeight instanceof _MoneroWalletListener.default ? startHeight : listenerOrStartHeight;
    let listener = listenerOrStartHeight instanceof _MoneroWalletListener.default ? listenerOrStartHeight : undefined;
    if (startHeight === undefined) startHeight = Math.max(await this.getHeight(), await this.getRestoreHeight());

    // register listener if given
    if (listener) await this.addListener(listener);

    // sync wallet
    let err;
    let result;
    try {
      let that = this;
      result = await (allowConcurrentCalls ? syncWasm() : this.module.queueTask(async () => syncWasm()));
      function syncWasm() {
        that.assertNotClosed();
        let resolveCall;
        let rejectCall;
        const call = new Promise((resolve, reject) => {resolveCall = resolve;rejectCall = reject;});
        that.syncCalls.add(call);
        try {
          // sync wallet in wasm which invokes callback when done
          that.module.sync(that.cppAddress, startHeight, (resp) => {
            if (resp.charAt(0) !== '{') rejectCall(new _MoneroError.default(resp));else
            {
              let respJson = JSON.parse(resp);
              resolveCall(new _MoneroSyncResult.default(respJson.numBlocksFetched, respJson.receivedMoney));
            }
          });
        } catch (err) {
          rejectCall(err);
        }
        return call.finally(() => that.syncCalls.delete(call));
      }
    } catch (e) {
      err = e;
    }

    // unregister listener
    if (listener && !this._isClosed) await this.removeListener(listener);

    // throw error or return
    if (err) throw err;
    return result;
  }

  async startSyncing(syncPeriodInMs) {
    if (this.getWalletProxy()) return this.getWalletProxy().startSyncing(syncPeriodInMs);
    this.syncPeriodInMs = syncPeriodInMs === undefined ? MoneroWalletFull.DEFAULT_SYNC_PERIOD_IN_MS : syncPeriodInMs;
    if (!this.syncLooper) this.syncLooper = new _TaskLooper.default(async () => await this.backgroundSync());
    this.syncLooper.start(this.syncPeriodInMs);
  }

  async stopSyncing() {
    if (this.getWalletProxy()) return this.getWalletProxy().stopSyncing();
    this.assertNotClosed();
    if (this.syncLooper) this.syncLooper.stop();
    this.module.stop_syncing(this.cppAddress); // task is not queued so wallet stops immediately
  }

  async scanTxs(txHashes) {
    if (this.getWalletProxy()) return this.getWalletProxy().scanTxs(txHashes);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.scan_txs(this.cppAddress, JSON.stringify({ txHashes: txHashes }), (err) => {
          if (err) reject(new _MoneroError.default(err));else
          resolve();
        });
      });
    });
  }

  async rescanSpent() {
    if (this.getWalletProxy()) return this.getWalletProxy().rescanSpent();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.rescan_spent(this.cppAddress, (err) => {
          if (err) reject(new _MoneroError.default(err));else
          resolve();
        });
      });
    });
  }

  async rescanBlockchain() {
    if (this.getWalletProxy()) return this.getWalletProxy().rescanBlockchain();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.rescan_blockchain(this.cppAddress, (err) => {
          if (err) reject(new _MoneroError.default(err));else
          resolve();
        });
      });
    });
  }

  async getBalance(accountIdx, subaddressIdx) {
    if (this.getWalletProxy()) return this.getWalletProxy().getBalance(accountIdx, subaddressIdx);
    return this.module.queueTask(async () => {
      this.assertNotClosed();

      // get balance encoded in json string
      let balanceStr;
      if (accountIdx === undefined) {
        (0, _assert.default)(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
        balanceStr = this.module.get_balance_wallet(this.cppAddress);
      } else if (subaddressIdx === undefined) {
        balanceStr = this.module.get_balance_account(this.cppAddress, accountIdx);
      } else {
        balanceStr = this.module.get_balance_subaddress(this.cppAddress, accountIdx, subaddressIdx);
      }

      // parse json string to bigint
      return BigInt(JSON.parse(_GenUtils.default.stringifyBigInts(balanceStr)).balance);
    });
  }

  async getUnlockedBalance(accountIdx, subaddressIdx) {
    if (this.getWalletProxy()) return this.getWalletProxy().getUnlockedBalance(accountIdx, subaddressIdx);
    return this.module.queueTask(async () => {
      this.assertNotClosed();

      // get balance encoded in json string
      let unlockedBalanceStr;
      if (accountIdx === undefined) {
        (0, _assert.default)(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
        unlockedBalanceStr = this.module.get_unlocked_balance_wallet(this.cppAddress);
      } else if (subaddressIdx === undefined) {
        unlockedBalanceStr = this.module.get_unlocked_balance_account(this.cppAddress, accountIdx);
      } else {
        unlockedBalanceStr = this.module.get_unlocked_balance_subaddress(this.cppAddress, accountIdx, subaddressIdx);
      }

      // parse json string to bigint
      return BigInt(JSON.parse(_GenUtils.default.stringifyBigInts(unlockedBalanceStr)).unlockedBalance);
    });
  }

  async getAccounts(includeSubaddresses, tag) {
    if (this.getWalletProxy()) return this.getWalletProxy().getAccounts(includeSubaddresses, tag);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let accountsStr = this.module.get_accounts(this.cppAddress, includeSubaddresses ? true : false, tag ? tag : "");
      let accounts = [];
      for (let accountJson of JSON.parse(_GenUtils.default.stringifyBigInts(accountsStr)).accounts) {
        accounts.push(MoneroWalletFull.sanitizeAccount(new _MoneroAccount.default(accountJson)));
      }
      return accounts;
    });
  }

  async getAccount(accountIdx, includeSubaddresses) {
    if (this.getWalletProxy()) return this.getWalletProxy().getAccount(accountIdx, includeSubaddresses);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let accountStr = this.module.get_account(this.cppAddress, accountIdx, includeSubaddresses ? true : false);
      let accountJson = JSON.parse(_GenUtils.default.stringifyBigInts(accountStr));
      return MoneroWalletFull.sanitizeAccount(new _MoneroAccount.default(accountJson));
    });

  }

  async createAccount(label) {
    if (this.getWalletProxy()) return this.getWalletProxy().createAccount(label);
    if (label === undefined) label = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let accountStr = this.module.create_account(this.cppAddress, label);
      let accountJson = JSON.parse(_GenUtils.default.stringifyBigInts(accountStr));
      return MoneroWalletFull.sanitizeAccount(new _MoneroAccount.default(accountJson));
    });
  }

  async getSubaddresses(accountIdx, subaddressIndices) {
    if (this.getWalletProxy()) return this.getWalletProxy().getSubaddresses(accountIdx, subaddressIndices);
    let args = { accountIdx: accountIdx, subaddressIndices: subaddressIndices === undefined ? [] : _GenUtils.default.listify(subaddressIndices) };
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let subaddressesJson = JSON.parse(_GenUtils.default.stringifyBigInts(this.module.get_subaddresses(this.cppAddress, JSON.stringify(args)))).subaddresses;
      let subaddresses = [];
      for (let subaddressJson of subaddressesJson) subaddresses.push(_MoneroWalletKeys.MoneroWalletKeys.sanitizeSubaddress(new _MoneroSubaddress.default(subaddressJson)));
      return subaddresses;
    });
  }

  async createSubaddress(accountIdx, label) {
    if (this.getWalletProxy()) return this.getWalletProxy().createSubaddress(accountIdx, label);
    if (label === undefined) label = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let subaddressStr = this.module.create_subaddress(this.cppAddress, accountIdx, label);
      let subaddressJson = JSON.parse(_GenUtils.default.stringifyBigInts(subaddressStr));
      return _MoneroWalletKeys.MoneroWalletKeys.sanitizeSubaddress(new _MoneroSubaddress.default(subaddressJson));
    });
  }

  async setSubaddressLabel(accountIdx, subaddressIdx, label) {
    if (this.getWalletProxy()) return this.getWalletProxy().setSubaddressLabel(accountIdx, subaddressIdx, label);
    if (label === undefined) label = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.set_subaddress_label(this.cppAddress, accountIdx, subaddressIdx, label);
    });
  }

  async getTxs(query) {
    if (this.getWalletProxy()) return this.getWalletProxy().getTxs(query);

    // copy and normalize query up to block
    const queryNormalized = query = _MoneroWallet.default.normalizeTxQuery(query);

    // schedule task
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // call wasm which invokes callback
        this.module.get_txs(this.cppAddress, JSON.stringify(queryNormalized.getBlock().toJson()), (blocksJsonStr) => {

          // check for error
          if (blocksJsonStr.charAt(0) !== '{') {
            reject(new _MoneroError.default(blocksJsonStr));
            return;
          }

          // resolve with deserialized txs
          try {
            resolve(MoneroWalletFull.deserializeTxs(queryNormalized, blocksJsonStr));
          } catch (err) {
            reject(err);
          }
        });
      });
    });
  }

  async getTransfers(query) {
    if (this.getWalletProxy()) return this.getWalletProxy().getTransfers(query);

    // copy and normalize query up to block
    const queryNormalized = _MoneroWallet.default.normalizeTransferQuery(query);

    // return promise which resolves on callback
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // call wasm which invokes callback
        this.module.get_transfers(this.cppAddress, JSON.stringify(queryNormalized.getTxQuery().getBlock().toJson()), (blocksJsonStr) => {

          // check for error
          if (blocksJsonStr.charAt(0) !== '{') {
            reject(new _MoneroError.default(blocksJsonStr));
            return;
          }

          // resolve with deserialized transfers 
          try {
            resolve(MoneroWalletFull.deserializeTransfers(queryNormalized, blocksJsonStr));
          } catch (err) {
            reject(err);
          }
        });
      });
    });
  }

  async getOutputs(query) {
    if (this.getWalletProxy()) return this.getWalletProxy().getOutputs(query);

    // copy and normalize query up to block
    const queryNormalized = _MoneroWallet.default.normalizeOutputQuery(query);

    // return promise which resolves on callback
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // call wasm which invokes callback
        this.module.get_outputs(this.cppAddress, JSON.stringify(queryNormalized.getTxQuery().getBlock().toJson()), (blocksJsonStr) => {

          // check for error
          if (blocksJsonStr.charAt(0) !== '{') {
            reject(new _MoneroError.default(blocksJsonStr));
            return;
          }

          // resolve with deserialized outputs
          try {
            resolve(MoneroWalletFull.deserializeOutputs(queryNormalized, blocksJsonStr));
          } catch (err) {
            reject(err);
          }
        });
      });
    });
  }

  async exportOutputs(all = false) {
    if (this.getWalletProxy()) return this.getWalletProxy().exportOutputs(all);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.export_outputs(this.cppAddress, all, (outputsHex) => resolve(outputsHex));
      });
    });
  }

  async importOutputs(outputsHex) {
    if (this.getWalletProxy()) return this.getWalletProxy().importOutputs(outputsHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.import_outputs(this.cppAddress, outputsHex, (numImported) => resolve(numImported));
      });
    });
  }

  async exportKeyImages(all = false) {
    if (this.getWalletProxy()) return this.getWalletProxy().exportKeyImages(all);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.export_key_images(this.cppAddress, all, (resultStr) => {
          if (resultStr.charAt(0) !== '{') reject(new _MoneroError.default(resultStr)); // json expected, else error
          else {
            let resultJson = JSON.parse(_GenUtils.default.stringifyBigInts(resultStr));
            if (!resultJson.keyImages) resultJson.keyImages = [];
            resolve(new _MoneroKeyImageExportResult.default(resultJson));
          }
        });
      });
    });
  }

  async importKeyImages(keyImages, offset = 0) {
    if (this.getWalletProxy()) return this.getWalletProxy().importKeyImages(keyImages, offset);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.import_key_images(this.cppAddress, JSON.stringify({ offset: offset, keyImages: keyImages.map((keyImage) => keyImage.toJson()) }), (keyImageImportResultStr) => {
          if (keyImageImportResultStr.charAt(0) !== '{') reject(new _MoneroError.default(keyImageImportResultStr)); // json expected, else error
          else resolve(new _MoneroKeyImageImportResult.default(JSON.parse(_GenUtils.default.stringifyBigInts(keyImageImportResultStr))));
        });
      });
    });
  }

  async getNewKeyImagesFromLastImport() {
    if (this.getWalletProxy()) return this.getWalletProxy().getNewKeyImagesFromLastImport();
    throw new _MoneroError.default("Not implemented");
  }

  async freezeOutput(keyImage) {
    if (this.getWalletProxy()) return this.getWalletProxy().freezeOutput(keyImage);
    if (!keyImage) throw new _MoneroError.default("Must specify key image to freeze");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.freeze_output(this.cppAddress, keyImage, () => resolve());
      });
    });
  }

  async thawOutput(keyImage) {
    if (this.getWalletProxy()) return this.getWalletProxy().thawOutput(keyImage);
    if (!keyImage) throw new _MoneroError.default("Must specify key image to thaw");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.thaw_output(this.cppAddress, keyImage, () => resolve());
      });
    });
  }

  async isOutputFrozen(keyImage) {
    if (this.getWalletProxy()) return this.getWalletProxy().isOutputFrozen(keyImage);
    if (!keyImage) throw new _MoneroError.default("Must specify key image to check if frozen");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.is_output_frozen(this.cppAddress, keyImage, (result) => resolve(result));
      });
    });
  }

  async getDefaultFeePriority() {
    if (this.getWalletProxy()) return this.getWalletProxy().getDefaultFeePriority();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_default_fee_priority(this.cppAddress, (result) => resolve(result));
      });
    });
  }

  async createTxs(config) {
    if (this.getWalletProxy()) return this.getWalletProxy().createTxs(config);

    // validate, copy, and normalize config
    const configNormalized = _MoneroWallet.default.normalizeCreateTxsConfig(config);
    if (configNormalized.getCanSplit() === undefined) configNormalized.setCanSplit(true);

    // create txs in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // create txs in wasm which invokes callback when done
        this.module.create_txs(this.cppAddress, JSON.stringify(configNormalized.toJson()), (txSetJsonStr) => {
          if (txSetJsonStr.charAt(0) !== '{') reject(new _MoneroError.default(txSetJsonStr)); // json expected, else error
          else resolve(new _MoneroTxSet.default(JSON.parse(_GenUtils.default.stringifyBigInts(txSetJsonStr))).getTxs());
        });
      });
    });
  }

  async sweepOutput(config) {
    if (this.getWalletProxy()) return this.getWalletProxy().sweepOutput(config);

    // normalize and validate config
    const configNormalized = _MoneroWallet.default.normalizeSweepOutputConfig(config);

    // sweep output in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // sweep output in wasm which invokes callback when done
        this.module.sweep_output(this.cppAddress, JSON.stringify(configNormalized.toJson()), (txSetJsonStr) => {
          if (txSetJsonStr.charAt(0) !== '{') reject(new _MoneroError.default(txSetJsonStr)); // json expected, else error
          else resolve(new _MoneroTxSet.default(JSON.parse(_GenUtils.default.stringifyBigInts(txSetJsonStr))).getTxs()[0]);
        });
      });
    });
  }

  async sweepUnlocked(config) {
    if (this.getWalletProxy()) return this.getWalletProxy().sweepUnlocked(config);

    // validate and normalize config
    const configNormalized = _MoneroWallet.default.normalizeSweepUnlockedConfig(config);

    // sweep unlocked in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // sweep unlocked in wasm which invokes callback when done
        this.module.sweep_unlocked(this.cppAddress, JSON.stringify(configNormalized.toJson()), (txSetsJson) => {
          if (txSetsJson.charAt(0) !== '{') reject(new _MoneroError.default(txSetsJson)); // json expected, else error
          else {
            let txSets = [];
            for (let txSetJson of JSON.parse(_GenUtils.default.stringifyBigInts(txSetsJson)).txSets) txSets.push(new _MoneroTxSet.default(txSetJson));
            let txs = [];
            for (let txSet of txSets) for (let tx of txSet.getTxs()) txs.push(tx);
            resolve(txs);
          }
        });
      });
    });
  }

  async sweepDust(relay) {
    if (this.getWalletProxy()) return this.getWalletProxy().sweepDust(relay);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // call wasm which invokes callback when done
        this.module.sweep_dust(this.cppAddress, relay, (txSetJsonStr) => {
          if (txSetJsonStr.charAt(0) !== '{') reject(new _MoneroError.default(txSetJsonStr)); // json expected, else error
          else {
            let txSet = new _MoneroTxSet.default(JSON.parse(_GenUtils.default.stringifyBigInts(txSetJsonStr)));
            if (txSet.getTxs() === undefined) txSet.setTxs([]);
            resolve(txSet.getTxs());
          }
        });
      });
    });
  }

  async relayTxs(txsOrMetadatas) {
    if (this.getWalletProxy()) return this.getWalletProxy().relayTxs(txsOrMetadatas);
    (0, _assert.default)(Array.isArray(txsOrMetadatas), "Must provide an array of txs or their metadata to relay");
    let txMetadatas = [];
    for (let txOrMetadata of txsOrMetadatas) txMetadatas.push(txOrMetadata instanceof _MoneroTxWallet.default ? txOrMetadata.getMetadata() : txOrMetadata);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.relay_txs(this.cppAddress, JSON.stringify({ txMetadatas: txMetadatas }), (txHashesJson) => {
          if (txHashesJson.charAt(0) !== '{') reject(new _MoneroError.default(txHashesJson));else
          resolve(JSON.parse(txHashesJson).txHashes);
        });
      });
    });
  }

  async describeTxSet(txSet) {
    if (this.getWalletProxy()) return this.getWalletProxy().describeTxSet(txSet);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      txSet = new _MoneroTxSet.default({ unsignedTxHex: txSet.getUnsignedTxHex(), signedTxHex: txSet.getSignedTxHex(), multisigTxHex: txSet.getMultisigTxHex() });
      try {return new _MoneroTxSet.default(JSON.parse(_GenUtils.default.stringifyBigInts(this.module.describe_tx_set(this.cppAddress, JSON.stringify(txSet.toJson())))));}
      catch (err) {throw new _MoneroError.default(this.module.get_exception_message(err));}
    });
  }

  async signTxs(unsignedTxHex) {
    if (this.getWalletProxy()) return this.getWalletProxy().signTxs(unsignedTxHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {return new _MoneroTxSet.default(JSON.parse(_GenUtils.default.stringifyBigInts(this.module.sign_txs(this.cppAddress, unsignedTxHex))));}
      catch (err) {throw new _MoneroError.default(this.module.get_exception_message(err));}
    });
  }

  async submitTxs(signedTxHex) {
    if (this.getWalletProxy()) return this.getWalletProxy().submitTxs(signedTxHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.submit_txs(this.cppAddress, signedTxHex, (resp) => {
          if (resp.charAt(0) !== '{') reject(new _MoneroError.default(resp));else
          resolve(JSON.parse(resp).txHashes);
        });
      });
    });
  }

  async signMessage(message, signatureType = _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY, accountIdx = 0, subaddressIdx = 0) {
    if (this.getWalletProxy()) return this.getWalletProxy().signMessage(message, signatureType, accountIdx, subaddressIdx);

    // assign defaults
    signatureType = signatureType || _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY;
    accountIdx = accountIdx || 0;
    subaddressIdx = subaddressIdx || 0;

    // queue task to sign message
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {return this.module.sign_message(this.cppAddress, message, signatureType === _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY ? 0 : 1, accountIdx, subaddressIdx);}
      catch (err) {throw new _MoneroError.default(this.module.get_exception_message(err));}
    });
  }

  async verifyMessage(message, address, signature) {
    if (this.getWalletProxy()) return this.getWalletProxy().verifyMessage(message, address, signature);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let result;
      try {
        result = JSON.parse(this.module.verify_message(this.cppAddress, message, address, signature));
      } catch (err) {
        result = { isGood: false };
      }
      return new _MoneroMessageSignatureResult.default(result.isGood ?
      { isGood: result.isGood, isOld: result.isOld, signatureType: result.signatureType === "spend" ? _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY : _MoneroMessageSignatureType.default.SIGN_WITH_VIEW_KEY, version: result.version } :
      { isGood: false }
      );
    });
  }

  async getTxKey(txHash) {
    if (this.getWalletProxy()) return this.getWalletProxy().getTxKey(txHash);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {return this.module.get_tx_key(this.cppAddress, txHash);}
      catch (err) {throw new _MoneroError.default(this.module.get_exception_message(err));}
    });
  }

  async checkTxKey(txHash, txKey, address) {
    if (this.getWalletProxy()) return this.getWalletProxy().checkTxKey(txHash, txKey, address);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.check_tx_key(this.cppAddress, txHash, txKey, address, (respJsonStr) => {
          if (respJsonStr.charAt(0) !== '{') reject(new _MoneroError.default(respJsonStr));else
          resolve(new _MoneroCheckTx.default(JSON.parse(_GenUtils.default.stringifyBigInts(respJsonStr))));
        });
      });
    });
  }

  async getTxProof(txHash, address, message) {
    if (this.getWalletProxy()) return this.getWalletProxy().getTxProof(txHash, address, message);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_tx_proof(this.cppAddress, txHash || "", address || "", message || "", (signature) => {
          let errorKey = "error: ";
          if (signature.indexOf(errorKey) === 0) reject(new _MoneroError.default(signature.substring(errorKey.length)));else
          resolve(signature);
        });
      });
    });
  }

  async checkTxProof(txHash, address, message, signature) {
    if (this.getWalletProxy()) return this.getWalletProxy().checkTxProof(txHash, address, message, signature);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.check_tx_proof(this.cppAddress, txHash || "", address || "", message || "", signature || "", (respJsonStr) => {
          if (respJsonStr.charAt(0) !== '{') reject(new _MoneroError.default(respJsonStr));else
          resolve(new _MoneroCheckTx.default(JSON.parse(_GenUtils.default.stringifyBigInts(respJsonStr))));
        });
      });
    });
  }

  async getSpendProof(txHash, message) {
    if (this.getWalletProxy()) return this.getWalletProxy().getSpendProof(txHash, message);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_spend_proof(this.cppAddress, txHash || "", message || "", (signature) => {
          let errorKey = "error: ";
          if (signature.indexOf(errorKey) === 0) reject(new _MoneroError.default(signature.substring(errorKey.length)));else
          resolve(signature);
        });
      });
    });
  }

  async checkSpendProof(txHash, message, signature) {
    if (this.getWalletProxy()) return this.getWalletProxy().checkSpendProof(txHash, message, signature);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.check_spend_proof(this.cppAddress, txHash || "", message || "", signature || "", (resp) => {
          typeof resp === "string" ? reject(new _MoneroError.default(resp)) : resolve(resp);
        });
      });
    });
  }

  async getReserveProofWallet(message) {
    if (this.getWalletProxy()) return this.getWalletProxy().getReserveProofWallet(message);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_reserve_proof_wallet(this.cppAddress, message, (signature) => {
          let errorKey = "error: ";
          if (signature.indexOf(errorKey) === 0) reject(new _MoneroError.default(signature.substring(errorKey.length), -1));else
          resolve(signature);
        });
      });
    });
  }

  async getReserveProofAccount(accountIdx, amount, message) {
    if (this.getWalletProxy()) return this.getWalletProxy().getReserveProofAccount(accountIdx, amount, message);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_reserve_proof_account(this.cppAddress, accountIdx, amount.toString(), message, (signature) => {
          let errorKey = "error: ";
          if (signature.indexOf(errorKey) === 0) reject(new _MoneroError.default(signature.substring(errorKey.length), -1));else
          resolve(signature);
        });
      });
    });
  }

  async checkReserveProof(address, message, signature) {
    if (this.getWalletProxy()) return this.getWalletProxy().checkReserveProof(address, message, signature);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.check_reserve_proof(this.cppAddress, address, message, signature, (respJsonStr) => {
          if (respJsonStr.charAt(0) !== '{') reject(new _MoneroError.default(respJsonStr, -1));else
          resolve(new _MoneroCheckReserve.default(JSON.parse(_GenUtils.default.stringifyBigInts(respJsonStr))));
        });
      });
    });
  }

  async getTxNotes(txHashes) {
    if (this.getWalletProxy()) return this.getWalletProxy().getTxNotes(txHashes);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {return JSON.parse(this.module.get_tx_notes(this.cppAddress, JSON.stringify({ txHashes: txHashes }))).txNotes;}
      catch (err) {throw new _MoneroError.default(this.module.get_exception_message(err));}
    });
  }

  async setTxNotes(txHashes, notes) {
    if (this.getWalletProxy()) return this.getWalletProxy().setTxNotes(txHashes, notes);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {this.module.set_tx_notes(this.cppAddress, JSON.stringify({ txHashes: txHashes, txNotes: notes }));}
      catch (err) {throw new _MoneroError.default(this.module.get_exception_message(err));}
    });
  }

  async getAddressBookEntries(entryIndices) {
    if (this.getWalletProxy()) return this.getWalletProxy().getAddressBookEntries(entryIndices);
    if (!entryIndices) entryIndices = [];
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let entries = [];
      for (let entryJson of JSON.parse(this.module.get_address_book_entries(this.cppAddress, JSON.stringify({ entryIndices: entryIndices }))).entries) {
        entries.push(new _MoneroAddressBookEntry.default(entryJson));
      }
      return entries;
    });
  }

  async addAddressBookEntry(address, description) {
    if (this.getWalletProxy()) return this.getWalletProxy().addAddressBookEntry(address, description);
    if (!address) address = "";
    if (!description) description = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.add_address_book_entry(this.cppAddress, address, description);
    });
  }

  async editAddressBookEntry(index, setAddress, address, setDescription, description) {
    if (this.getWalletProxy()) return this.getWalletProxy().editAddressBookEntry(index, setAddress, address, setDescription, description);
    if (!setAddress) setAddress = false;
    if (!address) address = "";
    if (!setDescription) setDescription = false;
    if (!description) description = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.edit_address_book_entry(this.cppAddress, index, setAddress, address, setDescription, description);
    });
  }

  async deleteAddressBookEntry(entryIdx) {
    if (this.getWalletProxy()) return this.getWalletProxy().deleteAddressBookEntry(entryIdx);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.delete_address_book_entry(this.cppAddress, entryIdx);
    });
  }

  async tagAccounts(tag, accountIndices) {
    if (this.getWalletProxy()) return this.getWalletProxy().tagAccounts(tag, accountIndices);
    if (!tag) tag = "";
    if (!accountIndices) accountIndices = [];
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.tag_accounts(this.cppAddress, JSON.stringify({ tag: tag, accountIndices: accountIndices }));
    });
  }

  async untagAccounts(accountIndices) {
    if (this.getWalletProxy()) return this.getWalletProxy().untagAccounts(accountIndices);
    if (!accountIndices) accountIndices = [];
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.tag_accounts(this.cppAddress, JSON.stringify({ accountIndices: accountIndices }));
    });
  }

  async getAccountTags() {
    if (this.getWalletProxy()) return this.getWalletProxy().getAccountTags();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let accountTags = [];
      for (let accountTagJson of JSON.parse(this.module.get_account_tags(this.cppAddress)).accountTags) accountTags.push(new _MoneroAccountTag.default(accountTagJson));
      return accountTags;
    });
  }

  async setAccountTagLabel(tag, label) {
    if (this.getWalletProxy()) return this.getWalletProxy().setAccountTagLabel(tag, label);
    if (!tag) tag = "";
    if (!label) label = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.set_account_tag_label(this.cppAddress, tag, label);
    });
  }

  async getPaymentUri(config) {
    if (this.getWalletProxy()) return this.getWalletProxy().getPaymentUri(config);
    config = _MoneroWallet.default.normalizeCreateTxsConfig(config);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {
        return this.module.get_payment_uri(this.cppAddress, JSON.stringify(config.toJson()));
      } catch (err) {
        throw new _MoneroError.default("Cannot make URI from supplied parameters");
      }
    });
  }

  async parsePaymentUri(uri) {
    if (this.getWalletProxy()) return this.getWalletProxy().parsePaymentUri(uri);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {
        return new _MoneroTxConfig.default(JSON.parse(_GenUtils.default.stringifyBigInts(this.module.parse_payment_uri(this.cppAddress, uri))));
      } catch (err) {
        throw new _MoneroError.default(err.message);
      }
    });
  }

  async getAttribute(key) {
    if (this.getWalletProxy()) return this.getWalletProxy().getAttribute(key);
    this.assertNotClosed();
    (0, _assert.default)(typeof key === "string", "Attribute key must be a string");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let value = this.module.get_attribute(this.cppAddress, key);
      return value === "" ? null : value;
    });
  }

  async setAttribute(key, val) {
    if (this.getWalletProxy()) return this.getWalletProxy().setAttribute(key, val);
    this.assertNotClosed();
    (0, _assert.default)(typeof key === "string", "Attribute key must be a string");
    (0, _assert.default)(typeof val === "string", "Attribute value must be a string");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.set_attribute(this.cppAddress, key, val);
    });
  }

  async startMining(numThreads, backgroundMining, ignoreBattery) {
    if (this.getWalletProxy()) return this.getWalletProxy().startMining(numThreads, backgroundMining, ignoreBattery);
    this.assertNotClosed();
    let daemon = await _MoneroDaemonRpc.default.connectToDaemonRpc(await this.getDaemonConnection());
    await daemon.startMining(await this.getPrimaryAddress(), numThreads, backgroundMining, ignoreBattery);
  }

  async stopMining() {
    if (this.getWalletProxy()) return this.getWalletProxy().stopMining();
    this.assertNotClosed();
    let daemon = await _MoneroDaemonRpc.default.connectToDaemonRpc(await this.getDaemonConnection());
    await daemon.stopMining();
  }

  async isMultisigImportNeeded() {
    if (this.getWalletProxy()) return this.getWalletProxy().isMultisigImportNeeded();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.is_multisig_import_needed(this.cppAddress);
    });
  }

  async isMultisig() {
    if (this.getWalletProxy()) return this.getWalletProxy().isMultisig();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.is_multisig(this.cppAddress);
    });
  }

  async getMultisigInfo() {
    if (this.getWalletProxy()) return this.getWalletProxy().getMultisigInfo();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new _MoneroMultisigInfo.default(JSON.parse(this.module.get_multisig_info(this.cppAddress)));
    });
  }

  async prepareMultisig() {
    if (this.getWalletProxy()) return this.getWalletProxy().prepareMultisig();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.prepare_multisig(this.cppAddress);
    });
  }

  async makeMultisig(multisigHexes, threshold, password) {
    if (this.getWalletProxy()) return this.getWalletProxy().makeMultisig(multisigHexes, threshold, password);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.make_multisig(this.cppAddress, JSON.stringify({ multisigHexes: multisigHexes, threshold: threshold, password: password }), (resp) => {
          let errorKey = "error: ";
          if (resp.indexOf(errorKey) === 0) reject(new _MoneroError.default(resp.substring(errorKey.length)));else
          resolve(resp);
        });
      });
    });
  }

  async exchangeMultisigKeys(multisigHexes, password) {
    if (this.getWalletProxy()) return this.getWalletProxy().exchangeMultisigKeys(multisigHexes, password);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.exchange_multisig_keys(this.cppAddress, JSON.stringify({ multisigHexes: multisigHexes, password: password }), (resp) => {
          let errorKey = "error: ";
          if (resp.indexOf(errorKey) === 0) reject(new _MoneroError.default(resp.substring(errorKey.length)));else
          resolve(new _MoneroMultisigInitResult.default(JSON.parse(resp)));
        });
      });
    });
  }

  async exportMultisigHex() {
    if (this.getWalletProxy()) return this.getWalletProxy().exportMultisigHex();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.export_multisig_hex(this.cppAddress);
    });
  }

  async importMultisigHex(multisigHexes, refreshAfterImport) {
    if (refreshAfterImport === undefined) refreshAfterImport = true;
    if (this.getWalletProxy()) return this.getWalletProxy().importMultisigHex(multisigHexes, refreshAfterImport);
    if (!_GenUtils.default.isArray(multisigHexes)) throw new _MoneroError.default("Must provide string[] to importMultisigHex()");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.import_multisig_hex(this.cppAddress, JSON.stringify({ multisigHexes: multisigHexes, refreshAfterImport: refreshAfterImport }), (resp) => {
          if (typeof resp === "string") reject(new _MoneroError.default(resp));else
          resolve(resp);
        });
      });
    });
  }

  async signMultisigTxHex(multisigTxHex) {
    if (this.getWalletProxy()) return this.getWalletProxy().signMultisigTxHex(multisigTxHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.sign_multisig_tx_hex(this.cppAddress, multisigTxHex, (resp) => {
          if (resp.charAt(0) !== '{') reject(new _MoneroError.default(resp));else
          resolve(new _MoneroMultisigSignResult.default(JSON.parse(resp)));
        });
      });
    });
  }

  async submitMultisigTxHex(signedMultisigTxHex) {
    if (this.getWalletProxy()) return this.getWalletProxy().submitMultisigTxHex(signedMultisigTxHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.submit_multisig_tx_hex(this.cppAddress, signedMultisigTxHex, (resp) => {
          if (resp.charAt(0) !== '{') reject(new _MoneroError.default(resp));else
          resolve(JSON.parse(resp).txHashes);
        });
      });
    });
  }

  /**
   * Get the wallet's keys and cache data.
   * 
   * @return {Promise<DataView[]>} is the keys and cache data, respectively
   */
  async getData() {
    if (this.getWalletProxy()) return this.getWalletProxy().getData();

    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.getDataWasm();
    });
  }

  getDataWasm() {
    let viewOnly = this.module.is_view_only(this.cppAddress);

    // store views in array
    let views = [];

    // malloc cache buffer and get buffer location in c++ heap
    let cacheBufferLoc = JSON.parse(this.module.get_cache_file_buffer(this.cppAddress));

    // read binary data from heap to DataView
    let view = new DataView(new ArrayBuffer(cacheBufferLoc.length));
    for (let i = 0; i < cacheBufferLoc.length; i++) {
      view.setInt8(i, this.module.HEAPU8[cacheBufferLoc.pointer / Uint8Array.BYTES_PER_ELEMENT + i]);
    }

    // free binary on heap
    this.module._free(cacheBufferLoc.pointer);

    // write cache file
    views.push(Buffer.from(view.buffer));

    // malloc keys buffer and get buffer location in c++ heap
    let keysBufferLoc = JSON.parse(this.module.get_keys_file_buffer(this.cppAddress, this.password, viewOnly));

    // read binary data from heap to DataView
    view = new DataView(new ArrayBuffer(keysBufferLoc.length));
    for (let i = 0; i < keysBufferLoc.length; i++) {
      view.setInt8(i, this.module.HEAPU8[keysBufferLoc.pointer / Uint8Array.BYTES_PER_ELEMENT + i]);
    }

    // free binary on heap
    this.module._free(keysBufferLoc.pointer);

    // prepend keys file
    views.unshift(Buffer.from(view.buffer));
    return views;
  }

  async changePassword(oldPassword, newPassword) {
    if (this.getWalletProxy()) return this.getWalletProxy().changePassword(oldPassword, newPassword);
    if (oldPassword !== this.password) throw new _MoneroError.default("Invalid original password."); // wallet2 verify_password loads from disk so verify password here
    if (newPassword === undefined) newPassword = "";
    await this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.change_wallet_password(this.cppAddress, oldPassword, newPassword, (errMsg) => {
          if (errMsg) reject(new _MoneroError.default(errMsg));else
          resolve();
        });
      });
    });
    this.password = newPassword;
    if (this.path) await this.save(); // auto save
  }

  async save() {
    if (this.getWalletProxy()) return this.getWalletProxy().save();
    return MoneroWalletFull.save(this);
  }

  async closeInternal(save) {
    if (this.walletProxy) {
      await super.closeInternal(save);
      return;
    }
    await this.prepareClose();
    if (save) {
      await _LibraryUtils.default.queueTask(async () => {
        const snapshot = await this.getCloseData();
        await MoneroWalletFull.writeWalletData(this, snapshot.data, snapshot.primaryAddress);
      });
    }
    await super.closeInternal(false, this.wasmListenerHandle);
    this.wasmListenerHandle = 0;
    delete this.path;
    delete this.password;
    delete this.wasmListener;
    _LibraryUtils.default.setRejectUnauthorizedFn(this.rejectUnauthorizedConfigId, undefined); // unregister fn informing if unauthorized reqs should be rejected
  }

  // cancel outside the module queue so a blocked request can release it
  async prepareClose() {
    this._isClosed = true;
    if (this.syncLooper) this.syncLooper.stop();
    this.module._request_wallet_shutdown(this.cppAddress);
    if (this.connectionManager && this.connectionManager.getListeners().includes(this.connectionManagerListener)) this.connectionManager.removeListener(this.connectionManagerListener);
    this.connectionManager = undefined;
    this.connectionManagerListener = undefined;
    await Promise.all(Array.from(this.syncCalls, (call) => call.catch(() => {})));
    await this.module.queueTask(async () => {});
  }

  // serialize a stopped wallet for saving on this thread or the worker's caller
  async getCloseData() {
    return this.module.queueTask(async () => ({
      data: this.getDataWasm(),
      primaryAddress: this.module.get_address(this.cppAddress, 0, 0)
    }));
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

  // ---------------------------- PRIVATE HELPERS ----------------------------

  static async openWalletData(config) {
    if (config.proxyToWorker) {
      let walletProxy = await MoneroWalletFullProxy.openWalletData(config);
      return new MoneroWalletFull(undefined, undefined, undefined, undefined, undefined, undefined, walletProxy);
    }

    // validate and normalize parameters
    if (config.networkType === undefined) throw new _MoneroError.default("Must provide the wallet's network type");
    config.networkType = _MoneroNetworkType.default.from(config.networkType);
    let daemonConnection = config.getServer();
    let daemonUri = daemonConnection && daemonConnection.getUri() ? daemonConnection.getUri() : "";
    let daemonUsername = daemonConnection && daemonConnection.getUsername() ? daemonConnection.getUsername() : "";
    let daemonPassword = daemonConnection && daemonConnection.getPassword() ? daemonConnection.getPassword() : "";
    let rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true;

    // load wasm module
    let module = await _LibraryUtils.default.loadWasmModule();

    // open wallet in queue
    return module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // register fn informing if unauthorized reqs should be rejected
        let rejectUnauthorizedFnId = _GenUtils.default.getUUID();
        _LibraryUtils.default.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => rejectUnauthorized);

        // create wallet in wasm which invokes callback when done
        module.open_wallet_full(config.password, config.networkType, config.keysData ?? "", config.cacheData ?? "", daemonUri, daemonUsername, daemonPassword, rejectUnauthorizedFnId, config.getRegtest() === undefined ? false : config.getRegtest(), (cppAddress) => {
          if (typeof cppAddress === "string") reject(new _MoneroError.default(cppAddress));else
          resolve(new MoneroWalletFull(cppAddress, config.path, config.password, config.fs, rejectUnauthorized, rejectUnauthorizedFnId));
        });
      });
    });
  }

  getWalletProxy() {
    return super.getWalletProxy();
  }

  async backgroundSync() {
    let label = this.path ? this.path : this.browserMainPath ? this.browserMainPath : "in-memory wallet"; // label for log
    _LibraryUtils.default.log(1, "Background synchronizing " + label);
    try {await this.sync();}
    catch (err) {if (!this._isClosed) console.error("Failed to background synchronize " + label + ": " + err.message);}
  }

  async refreshListening() {
    if (this._isClosed) return;
    let isEnabled = this.listeners.length > 0;
    if (this.wasmListenerHandle === 0 && !isEnabled || this.wasmListenerHandle > 0 && isEnabled) return; // no difference
    return this.module.queueTask(async () => {
      if (this._isClosed) return;
      return new Promise((resolve, reject) => {
        this.module.set_listener(
          this.cppAddress,
          this.wasmListenerHandle,
          (newListenerHandle) => {
            if (typeof newListenerHandle === "string") reject(new _MoneroError.default(newListenerHandle));else
            {
              this.wasmListenerHandle = newListenerHandle;
              resolve();
            }
          },
          isEnabled ? async (height, startHeight, endHeight, percentDone, message) => await this.wasmListener.onSyncProgress(height, startHeight, endHeight, percentDone, message) : undefined,
          isEnabled ? async (height) => await this.wasmListener.onNewBlock(height) : undefined,
          isEnabled ? async (newBalanceStr, newUnlockedBalanceStr) => await this.wasmListener.onBalancesChanged(newBalanceStr, newUnlockedBalanceStr) : undefined,
          isEnabled ? async (height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockTime, isLocked) => await this.wasmListener.onOutputReceived(height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockTime, isLocked) : undefined,
          isEnabled ? async (height, txHash, amountStr, accountIdxStr, subaddressIdxStr, version, unlockTime, isLocked) => await this.wasmListener.onOutputSpent(height, txHash, amountStr, accountIdxStr, subaddressIdxStr, version, unlockTime, isLocked) : undefined
        );
      });
    });
  }

  static sanitizeBlock(block) {
    for (let tx of block.getTxs()) MoneroWalletFull.sanitizeTxWallet(tx);
    return block;
  }

  static sanitizeTxWallet(tx) {
    (0, _assert.default)(tx instanceof _MoneroTxWallet.default);
    return tx;
  }

  static sanitizeAccount(account) {
    if (account.getSubaddresses()) {
      for (let subaddress of account.getSubaddresses()) _MoneroWalletKeys.MoneroWalletKeys.sanitizeSubaddress(subaddress);
    }
    return account;
  }

  static deserializeBlocks(blocksJsonStr) {
    let blocksJson = JSON.parse(_GenUtils.default.stringifyBigInts(blocksJsonStr));
    let deserializedBlocks = {};
    deserializedBlocks.blocks = [];
    if (blocksJson.blocks) for (let blockJson of blocksJson.blocks) deserializedBlocks.blocks.push(MoneroWalletFull.sanitizeBlock(new _MoneroBlock.default(blockJson, _MoneroBlock.default.DeserializationType.TX_WALLET)));
    return deserializedBlocks;
  }

  static deserializeTxs(query, blocksJsonStr) {

    // deserialize blocks
    let deserializedBlocks = MoneroWalletFull.deserializeBlocks(blocksJsonStr);
    let blocks = deserializedBlocks.blocks;

    // collect txs
    let txs = [];
    for (let block of blocks) {
      MoneroWalletFull.sanitizeBlock(block);
      for (let tx of block.getTxs()) {
        if (block.getHeight() === undefined) tx.setBlock(undefined); // dereference placeholder block for unconfirmed txs
        txs.push(tx);
      }
    }

    // re-sort txs which is lost over wasm serialization  // TODO: confirm that order is lost
    if (query.getHashes() !== undefined) {
      let txMap = new Map();
      for (let tx of txs) txMap[tx.getHash()] = tx;
      let txsSorted = [];
      for (let txHash of query.getHashes()) if (txMap[txHash] !== undefined) txsSorted.push(txMap[txHash]);
      txs = txsSorted;
    }

    return txs;
  }

  static deserializeTransfers(query, blocksJsonStr) {

    // deserialize blocks
    let deserializedBlocks = MoneroWalletFull.deserializeBlocks(blocksJsonStr);
    let blocks = deserializedBlocks.blocks;

    // collect transfers
    let transfers = [];
    for (let block of blocks) {
      for (let tx of block.getTxs()) {
        if (block.getHeight() === undefined) tx.setBlock(undefined); // dereference placeholder block for unconfirmed txs
        if (tx.getOutgoingTransfer() !== undefined) transfers.push(tx.getOutgoingTransfer());
        if (tx.getIncomingTransfers() !== undefined) {
          for (let transfer of tx.getIncomingTransfers()) transfers.push(transfer);
        }
      }
    }

    return transfers;
  }

  static deserializeOutputs(query, blocksJsonStr) {

    // deserialize blocks
    let deserializedBlocks = MoneroWalletFull.deserializeBlocks(blocksJsonStr);
    let blocks = deserializedBlocks.blocks;

    // collect outputs
    let outputs = [];
    for (let block of blocks) {
      for (let tx of block.getTxs()) {
        for (let output of tx.getOutputs()) outputs.push(output);
      }
    }

    return outputs;
  }

  /**
   * Set the path of the wallet on the browser main thread if run as a worker.
   * 
   * @param {string} browserMainPath - path of the wallet on the browser main thread
   */
  setBrowserMainPath(browserMainPath) {
    this.browserMainPath = browserMainPath;
  }

  static async moveTo(path, wallet) {

    // save and return if same path
    if (_path.default.normalize(wallet.path) === _path.default.normalize(path)) {
      return wallet.save();
    }

    return _LibraryUtils.default.queueTask(async () => {
      if (await wallet.isClosed()) throw new _MoneroError.default("Wallet is closed");
      if (!path) throw new _MoneroError.default("Must provide path of destination wallet");

      // create destination directory if it doesn't exist
      let walletDir = _path.default.dirname(path);
      if (!(await _LibraryUtils.default.exists(wallet.fs, walletDir))) {
        try {await wallet.fs.mkdir(walletDir);}
        catch (err) {throw new _MoneroError.default("Destination path " + path + " does not exist and cannot be created: " + err.message);}
      }

      // get wallet data
      const data = await wallet.getData();

      // write wallet files
      await wallet.fs.writeFile(path + ".keys", data[0], "binary");
      await wallet.fs.writeFile(path, data[1], "binary");
      await wallet.fs.writeFile(path + ".address.txt", await wallet.getPrimaryAddress());
      let oldPath = wallet.path;
      wallet.path = path;

      // delete old wallet files
      if (oldPath) {
        await wallet.fs.unlink(oldPath + ".address.txt");
        await wallet.fs.unlink(oldPath + ".keys");
        await wallet.fs.unlink(oldPath);
      }
    });
  }

  static async save(wallet) {
    return _LibraryUtils.default.queueTask(async () => {
      if (await wallet.isClosed()) throw new _MoneroError.default("Wallet is closed");

      if (!(await wallet.getPath())) throw new _MoneroError.default("Cannot save wallet because path is not set");
      await MoneroWalletFull.writeWalletData(wallet, await wallet.getData(), await wallet.getPrimaryAddress());
    });
  }

  static async writeWalletData(wallet, data, primaryAddress) {
    let path = wallet.path;
    if (!path) throw new _MoneroError.default("Cannot save wallet because path is not set");

    // write wallet files to *.new
    let pathNew = path + ".new";
    await wallet.fs.writeFile(pathNew + ".keys", data[0], "binary");
    await wallet.fs.writeFile(pathNew, data[1], "binary");
    await wallet.fs.writeFile(pathNew + ".address.txt", primaryAddress);

    // replace old wallet files with new
    await wallet.fs.rename(pathNew + ".keys", path + ".keys");
    await wallet.fs.rename(pathNew, path);
    await wallet.fs.rename(pathNew + ".address.txt", path + ".address.txt");
  }
}

/**
 * Implements a MoneroWallet by proxying requests to a worker which runs a full wallet.
 * 
 * @private
 */exports.default = MoneroWalletFull;
class MoneroWalletFullProxy extends _MoneroWalletKeys.MoneroWalletKeysProxy {

  // instance variables




  // -------------------------- WALLET STATIC UTILS ---------------------------

  static async openWalletData(config) {
    let walletId = _GenUtils.default.getUUID();
    if (config.password === undefined) config.password = "";
    let daemonConnection = config.getServer();
    await _LibraryUtils.default.invokeWorker(walletId, "openWalletData", [config.path, config.password, config.networkType, config.keysData, config.cacheData, daemonConnection ? daemonConnection.toJson() : undefined]);
    let wallet = new MoneroWalletFullProxy(walletId, await _LibraryUtils.default.getWorker(), config.path, config.getFs());
    if (config.path) await wallet.save();
    return wallet;
  }

  static async createWallet(config) {
    if (config.getPath() && (await MoneroWalletFull.walletExists(config.getPath(), config.getFs()))) throw new _MoneroError.default("Wallet already exists: " + config.getPath());
    let walletId = _GenUtils.default.getUUID();
    await _LibraryUtils.default.invokeWorker(walletId, "createWalletFull", [config.toJson()]);
    let wallet = new MoneroWalletFullProxy(walletId, await _LibraryUtils.default.getWorker(), config.getPath(), config.getFs());
    if (config.getPath()) await wallet.save();
    return wallet;
  }

  // --------------------------- INSTANCE METHODS ----------------------------

  /**
   * Internal constructor which is given a worker to communicate with via messages.
   * 
   * This method should not be called externally but should be called through
   * static wallet creation utilities in this class.
   * 
   * @param {string} walletId - identifies the wallet with the worker
   * @param {Worker} worker - worker to communicate with via messages
   */
  constructor(walletId, worker, path, fs) {
    super(walletId, worker);
    this.path = path;
    this.fs = fs ? fs : path ? MoneroWalletFull.getFs() : undefined;
    this.wrappedListeners = [];
  }

  getPath() {
    return this.path;
  }

  async getNetworkType() {
    return this.invokeWorker("getNetworkType");
  }

  async setSubaddressLabel(accountIdx, subaddressIdx, label) {
    return this.invokeWorker("setSubaddressLabel", Array.from(arguments));
  }

  async setDaemonConnection(uriOrRpcConnection, isTrusted) {
    if (!uriOrRpcConnection) await this.invokeWorker("setDaemonConnection", [undefined, isTrusted]);else
    {
      let connection = !uriOrRpcConnection ? undefined : uriOrRpcConnection instanceof _MoneroRpcConnection.default ? uriOrRpcConnection : new _MoneroRpcConnection.default(uriOrRpcConnection);
      await this.invokeWorker("setDaemonConnection", [connection ? connection.getConfig() : undefined, isTrusted]);
    }
  }

  async isDaemonTrusted() {
    return this.invokeWorker("isDaemonTrusted");
  }

  async getDaemonConnection() {
    let rpcConfig = await this.invokeWorker("getDaemonConnection");
    return rpcConfig ? new _MoneroRpcConnection.default(rpcConfig) : undefined;
  }

  async isConnectedToDaemon() {
    return this.invokeWorker("isConnectedToDaemon");
  }

  async getRestoreHeight() {
    return this.invokeWorker("getRestoreHeight");
  }

  async setRestoreHeight(restoreHeight) {
    return this.invokeWorker("setRestoreHeight", [restoreHeight]);
  }

  async getDaemonHeight() {
    return this.invokeWorker("getDaemonHeight");
  }

  async getDaemonMaxPeerHeight() {
    return this.invokeWorker("getDaemonMaxPeerHeight");
  }

  async getHeightByDate(year, month, day) {
    return this.invokeWorker("getHeightByDate", [year, month, day]);
  }

  async isDaemonSynced() {
    return this.invokeWorker("isDaemonSynced");
  }

  async getHeight() {
    return this.invokeWorker("getHeight");
  }

  async addListener(listener) {
    let wrappedListener = new WalletWorkerListener(listener, () => this._isClosed);
    let listenerId = wrappedListener.getId();
    _LibraryUtils.default.addWorkerCallback(this.walletId, "onSyncProgress_" + listenerId, [wrappedListener.onSyncProgress, wrappedListener]);
    _LibraryUtils.default.addWorkerCallback(this.walletId, "onNewBlock_" + listenerId, [wrappedListener.onNewBlock, wrappedListener]);
    _LibraryUtils.default.addWorkerCallback(this.walletId, "onBalancesChanged_" + listenerId, [wrappedListener.onBalancesChanged, wrappedListener]);
    _LibraryUtils.default.addWorkerCallback(this.walletId, "onOutputReceived_" + listenerId, [wrappedListener.onOutputReceived, wrappedListener]);
    _LibraryUtils.default.addWorkerCallback(this.walletId, "onOutputSpent_" + listenerId, [wrappedListener.onOutputSpent, wrappedListener]);
    this.wrappedListeners.push(wrappedListener);
    return this.invokeWorker("addListener", [listenerId]);
  }

  async removeListener(listener) {
    for (let i = 0; i < this.wrappedListeners.length; i++) {
      if (this.wrappedListeners[i].getListener() === listener) {
        let listenerId = this.wrappedListeners[i].getId();
        await this.invokeWorker("removeListener", [listenerId]);
        _LibraryUtils.default.removeWorkerCallback(this.walletId, "onSyncProgress_" + listenerId);
        _LibraryUtils.default.removeWorkerCallback(this.walletId, "onNewBlock_" + listenerId);
        _LibraryUtils.default.removeWorkerCallback(this.walletId, "onBalancesChanged_" + listenerId);
        _LibraryUtils.default.removeWorkerCallback(this.walletId, "onOutputReceived_" + listenerId);
        _LibraryUtils.default.removeWorkerCallback(this.walletId, "onOutputSpent_" + listenerId);
        this.wrappedListeners.splice(i, 1);
        return;
      }
    }
    throw new _MoneroError.default("Listener is not registered with wallet");
  }

  getListeners() {
    let listeners = [];
    for (let wrappedListener of this.wrappedListeners) listeners.push(wrappedListener.getListener());
    return listeners;
  }

  async isSynced() {
    return this.invokeWorker("isSynced");
  }

  async sync(listenerOrStartHeight, startHeight, allowConcurrentCalls = false) {

    // normalize params
    startHeight = listenerOrStartHeight instanceof _MoneroWalletListener.default ? startHeight : listenerOrStartHeight;
    let listener = listenerOrStartHeight instanceof _MoneroWalletListener.default ? listenerOrStartHeight : undefined;
    if (startHeight === undefined) startHeight = Math.max(await this.getHeight(), await this.getRestoreHeight());

    // register listener if given
    if (listener) await this.addListener(listener);

    // sync wallet in worker 
    let err;
    let result;
    try {
      let resultJson = await this.invokeWorker("sync", [startHeight, allowConcurrentCalls]);
      result = new _MoneroSyncResult.default(resultJson.numBlocksFetched, resultJson.receivedMoney);
    } catch (e) {
      err = e;
    }

    // unregister listener
    if (listener && !this._isClosed) await this.removeListener(listener);

    // throw error or return
    if (err) throw err;
    return result;
  }

  async startSyncing(syncPeriodInMs) {
    return this.invokeWorker("startSyncing", Array.from(arguments));
  }

  async stopSyncing() {
    return this.invokeWorker("stopSyncing");
  }

  async scanTxs(txHashes) {
    (0, _assert.default)(Array.isArray(txHashes), "Must provide an array of txs hashes to scan");
    return this.invokeWorker("scanTxs", [txHashes]);
  }

  async rescanSpent() {
    return this.invokeWorker("rescanSpent");
  }

  async rescanBlockchain() {
    return this.invokeWorker("rescanBlockchain");
  }

  async getBalance(accountIdx, subaddressIdx) {
    return BigInt(await this.invokeWorker("getBalance", Array.from(arguments)));
  }

  async getUnlockedBalance(accountIdx, subaddressIdx) {
    let unlockedBalanceStr = await this.invokeWorker("getUnlockedBalance", Array.from(arguments));
    return BigInt(unlockedBalanceStr);
  }

  async getAccounts(includeSubaddresses, tag) {
    let accounts = [];
    for (let accountJson of await this.invokeWorker("getAccounts", Array.from(arguments))) {
      accounts.push(MoneroWalletFull.sanitizeAccount(new _MoneroAccount.default(accountJson)));
    }
    return accounts;
  }

  async getAccount(accountIdx, includeSubaddresses) {
    let accountJson = await this.invokeWorker("getAccount", Array.from(arguments));
    return MoneroWalletFull.sanitizeAccount(new _MoneroAccount.default(accountJson));
  }

  async createAccount(label) {
    let accountJson = await this.invokeWorker("createAccount", Array.from(arguments));
    return MoneroWalletFull.sanitizeAccount(new _MoneroAccount.default(accountJson));
  }

  async getSubaddresses(accountIdx, subaddressIndices) {
    let subaddresses = [];
    for (let subaddressJson of await this.invokeWorker("getSubaddresses", Array.from(arguments))) {
      subaddresses.push(_MoneroWalletKeys.MoneroWalletKeys.sanitizeSubaddress(new _MoneroSubaddress.default(subaddressJson)));
    }
    return subaddresses;
  }

  async createSubaddress(accountIdx, label) {
    let subaddressJson = await this.invokeWorker("createSubaddress", Array.from(arguments));
    return _MoneroWalletKeys.MoneroWalletKeys.sanitizeSubaddress(new _MoneroSubaddress.default(subaddressJson));
  }

  async getTxs(query) {
    query = _MoneroWallet.default.normalizeTxQuery(query);
    let respJson = await this.invokeWorker("getTxs", [query.getBlock().toJson()]);
    return MoneroWalletFull.deserializeTxs(query, JSON.stringify({ blocks: respJson.blocks })); // initialize txs from blocks json string TODO: this stringifies then utility parses, avoid
  }

  async getTransfers(query) {
    query = _MoneroWallet.default.normalizeTransferQuery(query);
    let blockJsons = await this.invokeWorker("getTransfers", [query.getTxQuery().getBlock().toJson()]);
    return MoneroWalletFull.deserializeTransfers(query, JSON.stringify({ blocks: blockJsons })); // initialize transfers from blocks json string TODO: this stringifies then utility parses, avoid
  }

  async getOutputs(query) {
    query = _MoneroWallet.default.normalizeOutputQuery(query);
    let blockJsons = await this.invokeWorker("getOutputs", [query.getTxQuery().getBlock().toJson()]);
    return MoneroWalletFull.deserializeOutputs(query, JSON.stringify({ blocks: blockJsons })); // initialize transfers from blocks json string TODO: this stringifies then utility parses, avoid
  }

  async exportOutputs(all) {
    return this.invokeWorker("exportOutputs", [all]);
  }

  async importOutputs(outputsHex) {
    return this.invokeWorker("importOutputs", [outputsHex]);
  }

  async exportKeyImages(all) {
    return new _MoneroKeyImageExportResult.default(await this.invokeWorker("getKeyImages", [all]));
  }

  async importKeyImages(keyImages, offset = 0) {
    let keyImagesJson = [];
    for (let keyImage of keyImages) keyImagesJson.push(keyImage.toJson());
    return new _MoneroKeyImageImportResult.default(await this.invokeWorker("importKeyImages", [keyImagesJson, offset]));
  }

  async getNewKeyImagesFromLastImport() {
    throw new _MoneroError.default("MoneroWalletFull.getNewKeyImagesFromLastImport() not implemented");
  }

  async freezeOutput(keyImage) {
    return this.invokeWorker("freezeOutput", [keyImage]);
  }

  async thawOutput(keyImage) {
    return this.invokeWorker("thawOutput", [keyImage]);
  }

  async isOutputFrozen(keyImage) {
    return this.invokeWorker("isOutputFrozen", [keyImage]);
  }

  async getDefaultFeePriority() {
    return this.invokeWorker("getDefaultFeePriority");
  }

  async createTxs(config) {
    config = _MoneroWallet.default.normalizeCreateTxsConfig(config);
    let txSetJson = await this.invokeWorker("createTxs", [config.toJson()]);
    return new _MoneroTxSet.default(txSetJson).getTxs();
  }

  async sweepOutput(config) {
    config = _MoneroWallet.default.normalizeSweepOutputConfig(config);
    let txSetJson = await this.invokeWorker("sweepOutput", [config.toJson()]);
    return new _MoneroTxSet.default(txSetJson).getTxs()[0];
  }

  async sweepUnlocked(config) {
    config = _MoneroWallet.default.normalizeSweepUnlockedConfig(config);
    let txSetsJson = await this.invokeWorker("sweepUnlocked", [config.toJson()]);
    let txs = [];
    for (let txSetJson of txSetsJson) for (let tx of new _MoneroTxSet.default(txSetJson).getTxs()) txs.push(tx);
    return txs;
  }

  async sweepDust(relay) {
    return new _MoneroTxSet.default(await this.invokeWorker("sweepDust", [relay])).getTxs() || [];
  }

  async relayTxs(txsOrMetadatas) {
    (0, _assert.default)(Array.isArray(txsOrMetadatas), "Must provide an array of txs or their metadata to relay");
    let txMetadatas = [];
    for (let txOrMetadata of txsOrMetadatas) txMetadatas.push(txOrMetadata instanceof _MoneroTxWallet.default ? txOrMetadata.getMetadata() : txOrMetadata);
    return this.invokeWorker("relayTxs", [txMetadatas]);
  }

  async describeTxSet(txSet) {
    return new _MoneroTxSet.default(await this.invokeWorker("describeTxSet", [txSet.toJson()]));
  }

  async signTxs(unsignedTxHex) {
    return new _MoneroTxSet.default(await this.invokeWorker("signTxs", Array.from(arguments)));
  }

  async submitTxs(signedTxHex) {
    return this.invokeWorker("submitTxs", Array.from(arguments));
  }

  async signMessage(message, signatureType, accountIdx, subaddressIdx) {
    return this.invokeWorker("signMessage", Array.from(arguments));
  }

  async verifyMessage(message, address, signature) {
    return new _MoneroMessageSignatureResult.default(await this.invokeWorker("verifyMessage", Array.from(arguments)));
  }

  async getTxKey(txHash) {
    return this.invokeWorker("getTxKey", Array.from(arguments));
  }

  async checkTxKey(txHash, txKey, address) {
    return new _MoneroCheckTx.default(await this.invokeWorker("checkTxKey", Array.from(arguments)));
  }

  async getTxProof(txHash, address, message) {
    return this.invokeWorker("getTxProof", Array.from(arguments));
  }

  async checkTxProof(txHash, address, message, signature) {
    return new _MoneroCheckTx.default(await this.invokeWorker("checkTxProof", Array.from(arguments)));
  }

  async getSpendProof(txHash, message) {
    return this.invokeWorker("getSpendProof", Array.from(arguments));
  }

  async checkSpendProof(txHash, message, signature) {
    return this.invokeWorker("checkSpendProof", Array.from(arguments));
  }

  async getReserveProofWallet(message) {
    return this.invokeWorker("getReserveProofWallet", Array.from(arguments));
  }

  async getReserveProofAccount(accountIdx, amount, message) {
    try {return await this.invokeWorker("getReserveProofAccount", [accountIdx, amount.toString(), message]);}
    catch (e) {throw new _MoneroError.default(e.message, -1);}
  }

  async checkReserveProof(address, message, signature) {
    try {return new _MoneroCheckReserve.default(await this.invokeWorker("checkReserveProof", Array.from(arguments)));}
    catch (e) {throw new _MoneroError.default(e.message, -1);}
  }

  async getTxNotes(txHashes) {
    return this.invokeWorker("getTxNotes", Array.from(arguments));
  }

  async setTxNotes(txHashes, notes) {
    return this.invokeWorker("setTxNotes", Array.from(arguments));
  }

  async getAddressBookEntries(entryIndices) {
    if (!entryIndices) entryIndices = [];
    let entries = [];
    for (let entryJson of await this.invokeWorker("getAddressBookEntries", Array.from(arguments))) {
      entries.push(new _MoneroAddressBookEntry.default(entryJson));
    }
    return entries;
  }

  async addAddressBookEntry(address, description) {
    return this.invokeWorker("addAddressBookEntry", Array.from(arguments));
  }

  async editAddressBookEntry(index, setAddress, address, setDescription, description) {
    return this.invokeWorker("editAddressBookEntry", Array.from(arguments));
  }

  async deleteAddressBookEntry(entryIdx) {
    return this.invokeWorker("deleteAddressBookEntry", Array.from(arguments));
  }

  async tagAccounts(tag, accountIndices) {
    return this.invokeWorker("tagAccounts", Array.from(arguments));
  }

  async untagAccounts(accountIndices) {
    return this.invokeWorker("untagAccounts", Array.from(arguments));
  }

  async getAccountTags() {
    return this.invokeWorker("getAccountTags", Array.from(arguments));
  }

  async setAccountTagLabel(tag, label) {
    return this.invokeWorker("setAccountTagLabel", Array.from(arguments));
  }

  async getPaymentUri(config) {
    config = _MoneroWallet.default.normalizeCreateTxsConfig(config);
    return this.invokeWorker("getPaymentUri", [config.toJson()]);
  }

  async parsePaymentUri(uri) {
    return new _MoneroTxConfig.default(await this.invokeWorker("parsePaymentUri", Array.from(arguments)));
  }

  async getAttribute(key) {
    return this.invokeWorker("getAttribute", Array.from(arguments));
  }

  async setAttribute(key, val) {
    return this.invokeWorker("setAttribute", Array.from(arguments));
  }

  async startMining(numThreads, backgroundMining, ignoreBattery) {
    return this.invokeWorker("startMining", Array.from(arguments));
  }

  async stopMining() {
    return this.invokeWorker("stopMining", Array.from(arguments));
  }

  async isMultisigImportNeeded() {
    return this.invokeWorker("isMultisigImportNeeded");
  }

  async isMultisig() {
    return this.invokeWorker("isMultisig");
  }

  async getMultisigInfo() {
    return new _MoneroMultisigInfo.default(await this.invokeWorker("getMultisigInfo"));
  }

  async prepareMultisig() {
    return this.invokeWorker("prepareMultisig");
  }

  async makeMultisig(multisigHexes, threshold, password) {
    return await this.invokeWorker("makeMultisig", Array.from(arguments));
  }

  async exchangeMultisigKeys(multisigHexes, password) {
    return new _MoneroMultisigInitResult.default(await this.invokeWorker("exchangeMultisigKeys", Array.from(arguments)));
  }

  async exportMultisigHex() {
    return this.invokeWorker("exportMultisigHex");
  }

  async importMultisigHex(multisigHexes, refreshAfterImport) {
    return this.invokeWorker("importMultisigHex", Array.from(arguments));
  }

  async signMultisigTxHex(multisigTxHex) {
    return new _MoneroMultisigSignResult.default(await this.invokeWorker("signMultisigTxHex", Array.from(arguments)));
  }

  async submitMultisigTxHex(signedMultisigTxHex) {
    return this.invokeWorker("submitMultisigTxHex", Array.from(arguments));
  }

  async getData() {
    return this.invokeWorker("getData");
  }

  async moveTo(path) {
    return MoneroWalletFull.moveTo(path, this);
  }

  async changePassword(oldPassword, newPassword) {
    await this.invokeWorker("changePassword", Array.from(arguments));
    if (this.path) await this.save(); // auto save
  }

  async save() {
    return MoneroWalletFull.save(this);
  }

  async isClosed() {
    return this._isClosed || super.isClosed();
  }

  async close(save) {
    this._isClosed = true;
    await this.invokeWorker("prepareClose");
    if (save) {
      await _LibraryUtils.default.queueTask(async () => {
        const snapshot = await this.invokeWorker("getCloseData");
        await MoneroWalletFull.writeWalletData(this, snapshot.data, snapshot.primaryAddress);
      });
    }
    await super.close(false);
    this.wrappedListeners.length = 0;
  }
}

// -------------------------------- LISTENING ---------------------------------

/**
 * Receives notifications directly from wasm c++.
 * 
 * @private
 */
class WalletWasmListener {



  constructor(wallet) {
    this.wallet = wallet;
  }

  async onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    await this.wallet.announceSyncProgress(height, startHeight, endHeight, percentDone, message);
  }

  async onNewBlock(height) {
    await this.wallet.announceNewBlock(height);
  }

  async onBalancesChanged(newBalanceStr, newUnlockedBalanceStr) {
    await this.wallet.announceBalancesChanged(newBalanceStr, newUnlockedBalanceStr);
  }

  async onOutputReceived(height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockTime, isLocked) {

    // build received output
    let output = new _MoneroOutputWallet.default();
    output.setAmount(BigInt(amountStr));
    output.setAccountIndex(accountIdx);
    output.setSubaddressIndex(subaddressIdx);
    let tx = new _MoneroTxWallet.default();
    tx.setHash(txHash);
    tx.setVersion(version);
    tx.setUnlockTime(unlockTime);
    output.setTx(tx);
    tx.setOutputs([output]);
    tx.setIsIncoming(true);
    tx.setIsLocked(isLocked);
    if (height > 0) {
      let block = new _MoneroBlock.default().setHeight(height);
      block.setTxs([tx]);
      tx.setBlock(block);
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsFailed(false);
    } else {
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
    }

    // announce output
    await this.wallet.announceOutputReceived(output);
  }

  async onOutputSpent(height, txHash, amountStr, accountIdxStr, subaddressIdxStr, version, unlockTime, isLocked) {

    // build spent output
    let output = new _MoneroOutputWallet.default();
    output.setAmount(BigInt(amountStr));
    if (accountIdxStr) output.setAccountIndex(parseInt(accountIdxStr));
    if (subaddressIdxStr) output.setSubaddressIndex(parseInt(subaddressIdxStr));
    let tx = new _MoneroTxWallet.default();
    tx.setHash(txHash);
    tx.setVersion(version);
    tx.setUnlockTime(unlockTime);
    tx.setIsLocked(isLocked);
    output.setTx(tx);
    tx.setInputs([output]);
    if (height > 0) {
      let block = new _MoneroBlock.default().setHeight(height);
      block.setTxs([tx]);
      tx.setBlock(block);
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsFailed(false);
    } else {
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
    }

    // announce output
    await this.wallet.announceOutputSpent(output);
  }
}

/**
 * Internal listener to bridge notifications to external listeners.
 * 
 * @private
 */
class WalletWorkerListener {





  constructor(listener, isClosed) {
    this.id = _GenUtils.default.getUUID();
    this.listener = listener;
    this.isClosed = isClosed;
  }

  getId() {
    return this.id;
  }

  getListener() {
    return this.listener;
  }

  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    if (this.isClosed()) return;
    this.listener.onSyncProgress(height, startHeight, endHeight, percentDone, message);
  }

  async onNewBlock(height) {
    if (this.isClosed()) return;
    await this.listener.onNewBlock(height);
  }

  async onBalancesChanged(newBalanceStr, newUnlockedBalanceStr) {
    if (this.isClosed()) return;
    await this.listener.onBalancesChanged(BigInt(newBalanceStr), BigInt(newUnlockedBalanceStr));
  }

  async onOutputReceived(blockJson) {
    if (this.isClosed()) return;
    let block = new _MoneroBlock.default(blockJson, _MoneroBlock.default.DeserializationType.TX_WALLET);
    await this.listener.onOutputReceived(block.getTxs()[0].getOutputs()[0]);
  }

  async onOutputSpent(blockJson) {
    if (this.isClosed()) return;
    let block = new _MoneroBlock.default(blockJson, _MoneroBlock.default.DeserializationType.TX_WALLET);
    await this.listener.onOutputSpent(block.getTxs()[0].getInputs()[0]);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfcGF0aCIsIl9HZW5VdGlscyIsIl9MaWJyYXJ5VXRpbHMiLCJfVGFza0xvb3BlciIsIl9Nb25lcm9BY2NvdW50IiwiX01vbmVyb0FjY291bnRUYWciLCJfTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJfTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQiLCJfTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1JwY0Nvbm5lY3Rpb24iLCJfTW9uZXJvU3ViYWRkcmVzcyIsIl9Nb25lcm9TeW5jUmVzdWx0IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4U2V0IiwiX01vbmVyb1R4V2FsbGV0IiwiX01vbmVyb1dhbGxldCIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRMaXN0ZW5lciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiX2ZzIiwiTW9uZXJvV2FsbGV0RnVsbCIsIk1vbmVyb1dhbGxldEtleXMiLCJERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIiwic3luY0NhbGxzIiwiU2V0IiwiY29uc3RydWN0b3IiLCJjcHBBZGRyZXNzIiwicGF0aCIsInBhc3N3b3JkIiwiZnMiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJyZWplY3RVbmF1dGhvcml6ZWRGbklkIiwid2FsbGV0UHJveHkiLCJsaXN0ZW5lcnMiLCJnZXRGcyIsInVuZGVmaW5lZCIsIl9pc0Nsb3NlZCIsIndhc21MaXN0ZW5lciIsIldhbGxldFdhc21MaXN0ZW5lciIsIndhc21MaXN0ZW5lckhhbmRsZSIsInJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkIiwic3luY1BlcmlvZEluTXMiLCJMaWJyYXJ5VXRpbHMiLCJzZXRSZWplY3RVbmF1dGhvcml6ZWRGbiIsIndhbGxldEV4aXN0cyIsImFzc2VydCIsIk1vbmVyb0Vycm9yIiwiZXhpc3RzIiwibG9nIiwib3BlbldhbGxldCIsImNvbmZpZyIsIk1vbmVyb1dhbGxldENvbmZpZyIsImdldFByb3h5VG9Xb3JrZXIiLCJzZXRQcm94eVRvV29ya2VyIiwiZ2V0U2VlZCIsImdldFNlZWRPZmZzZXQiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0UmVzdG9yZUhlaWdodCIsImdldExhbmd1YWdlIiwiZ2V0U2F2ZUN1cnJlbnQiLCJzZXRGcyIsImdldENvbm5lY3Rpb25NYW5hZ2VyIiwiZ2V0U2VydmVyIiwic2V0U2VydmVyIiwiZ2V0Q29ubmVjdGlvbiIsImdldEtleXNEYXRhIiwiZ2V0UGF0aCIsInNldEtleXNEYXRhIiwicmVhZEZpbGUiLCJzZXRDYWNoZURhdGEiLCJ3YWxsZXQiLCJvcGVuV2FsbGV0RGF0YSIsImdldElzVHJ1c3RlZERhZW1vbiIsInNldERhZW1vbkNvbm5lY3Rpb24iLCJzZXRDb25uZWN0aW9uTWFuYWdlciIsImNyZWF0ZVdhbGxldCIsImdldE5ldHdvcmtUeXBlIiwiTW9uZXJvTmV0d29ya1R5cGUiLCJ2YWxpZGF0ZSIsInNldFBhdGgiLCJnZXRQYXNzd29yZCIsInNldFBhc3N3b3JkIiwiTW9uZXJvV2FsbGV0RnVsbFByb3h5IiwiY3JlYXRlV2FsbGV0RnJvbVNlZWQiLCJjcmVhdGVXYWxsZXRGcm9tS2V5cyIsImNyZWF0ZVdhbGxldFJhbmRvbSIsImRhZW1vbkNvbm5lY3Rpb24iLCJnZXRSZWplY3RVbmF1dGhvcml6ZWQiLCJzZXRSZXN0b3JlSGVpZ2h0Iiwic2V0U2VlZE9mZnNldCIsIm1vZHVsZSIsImxvYWRXYXNtTW9kdWxlIiwicXVldWVUYXNrIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJHZW5VdGlscyIsImdldFVVSUQiLCJjcmVhdGVfZnVsbF93YWxsZXQiLCJKU09OIiwic3RyaW5naWZ5IiwidG9Kc29uIiwic2F2ZSIsInNldFByaW1hcnlBZGRyZXNzIiwic2V0UHJpdmF0ZVZpZXdLZXkiLCJzZXRQcml2YXRlU3BlbmRLZXkiLCJzZXRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJwYXJzZSIsImdldF9rZXlzX3dhbGxldF9zZWVkX2xhbmd1YWdlcyIsImxhbmd1YWdlcyIsIkZTIiwicHJvbWlzZXMiLCJnZXREYWVtb25NYXhQZWVySGVpZ2h0IiwiZ2V0V2FsbGV0UHJveHkiLCJhc3NlcnROb3RDbG9zZWQiLCJnZXRfZGFlbW9uX21heF9wZWVyX2hlaWdodCIsInJlc3AiLCJpc0RhZW1vblN5bmNlZCIsImlzX2RhZW1vbl9zeW5jZWQiLCJpc1N5bmNlZCIsImlzX3N5bmNlZCIsImdldF9uZXR3b3JrX3R5cGUiLCJnZXRfcmVzdG9yZV9oZWlnaHQiLCJyZXN0b3JlSGVpZ2h0Iiwic2V0X3Jlc3RvcmVfaGVpZ2h0IiwibW92ZVRvIiwiYWRkTGlzdGVuZXIiLCJsaXN0ZW5lciIsInJlZnJlc2hMaXN0ZW5pbmciLCJyZW1vdmVMaXN0ZW5lciIsImdldExpc3RlbmVycyIsImNvbm5lY3Rpb25NYW5hZ2VyIiwidXJpT3JDb25uZWN0aW9uIiwiaXNUcnVzdGVkIiwiY29ubmVjdGlvbiIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJ1cmkiLCJnZXRVcmkiLCJ1c2VybmFtZSIsImdldFVzZXJuYW1lIiwicHJveHlVcmkiLCJnZXRQcm94eVVyaSIsImlzVHJ1c3RlZEFyZyIsInNldF9kYWVtb25fY29ubmVjdGlvbiIsImlzRGFlbW9uVHJ1c3RlZCIsImlzX2RhZW1vbl90cnVzdGVkIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImNvbm5lY3Rpb25Db250YWluZXJTdHIiLCJnZXRfZGFlbW9uX2Nvbm5lY3Rpb24iLCJqc29uQ29ubmVjdGlvbiIsImlzQ29ubmVjdGVkVG9EYWVtb24iLCJpc19jb25uZWN0ZWRfdG9fZGFlbW9uIiwiZ2V0VmVyc2lvbiIsImdldEludGVncmF0ZWRBZGRyZXNzIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwicmVzdWx0IiwiZ2V0X2ludGVncmF0ZWRfYWRkcmVzcyIsImNoYXJBdCIsIk1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwiZXJyIiwibWVzc2FnZSIsImluY2x1ZGVzIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbnRlZ3JhdGVkQWRkcmVzcyIsImRlY29kZV9pbnRlZ3JhdGVkX2FkZHJlc3MiLCJnZXRIZWlnaHQiLCJnZXRfaGVpZ2h0IiwiZ2V0RGFlbW9uSGVpZ2h0IiwiZ2V0X2RhZW1vbl9oZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJnZXRfaGVpZ2h0X2J5X2RhdGUiLCJzeW5jIiwibGlzdGVuZXJPclN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJhbGxvd0NvbmN1cnJlbnRDYWxscyIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwiTWF0aCIsIm1heCIsInRoYXQiLCJzeW5jV2FzbSIsInJlc29sdmVDYWxsIiwicmVqZWN0Q2FsbCIsImNhbGwiLCJhZGQiLCJyZXNwSnNvbiIsIk1vbmVyb1N5bmNSZXN1bHQiLCJudW1CbG9ja3NGZXRjaGVkIiwicmVjZWl2ZWRNb25leSIsImZpbmFsbHkiLCJkZWxldGUiLCJlIiwic3RhcnRTeW5jaW5nIiwic3luY0xvb3BlciIsIlRhc2tMb29wZXIiLCJiYWNrZ3JvdW5kU3luYyIsInN0YXJ0Iiwic3RvcFN5bmNpbmciLCJzdG9wIiwic3RvcF9zeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwic2Nhbl90eHMiLCJyZXNjYW5TcGVudCIsInJlc2Nhbl9zcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJyZXNjYW5fYmxvY2tjaGFpbiIsImdldEJhbGFuY2UiLCJhY2NvdW50SWR4Iiwic3ViYWRkcmVzc0lkeCIsImJhbGFuY2VTdHIiLCJnZXRfYmFsYW5jZV93YWxsZXQiLCJnZXRfYmFsYW5jZV9hY2NvdW50IiwiZ2V0X2JhbGFuY2Vfc3ViYWRkcmVzcyIsIkJpZ0ludCIsInN0cmluZ2lmeUJpZ0ludHMiLCJiYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwidW5sb2NrZWRCYWxhbmNlU3RyIiwiZ2V0X3VubG9ja2VkX2JhbGFuY2Vfd2FsbGV0IiwiZ2V0X3VubG9ja2VkX2JhbGFuY2VfYWNjb3VudCIsImdldF91bmxvY2tlZF9iYWxhbmNlX3N1YmFkZHJlc3MiLCJ1bmxvY2tlZEJhbGFuY2UiLCJnZXRBY2NvdW50cyIsImluY2x1ZGVTdWJhZGRyZXNzZXMiLCJ0YWciLCJhY2NvdW50c1N0ciIsImdldF9hY2NvdW50cyIsImFjY291bnRzIiwiYWNjb3VudEpzb24iLCJwdXNoIiwic2FuaXRpemVBY2NvdW50IiwiTW9uZXJvQWNjb3VudCIsImdldEFjY291bnQiLCJhY2NvdW50U3RyIiwiZ2V0X2FjY291bnQiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJjcmVhdGVfYWNjb3VudCIsImdldFN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwiYXJncyIsImxpc3RpZnkiLCJzdWJhZGRyZXNzZXNKc29uIiwiZ2V0X3N1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NKc29uIiwic2FuaXRpemVTdWJhZGRyZXNzIiwiTW9uZXJvU3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJzdWJhZGRyZXNzU3RyIiwiY3JlYXRlX3N1YmFkZHJlc3MiLCJzZXRTdWJhZGRyZXNzTGFiZWwiLCJzZXRfc3ViYWRkcmVzc19sYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwicXVlcnlOb3JtYWxpemVkIiwiTW9uZXJvV2FsbGV0Iiwibm9ybWFsaXplVHhRdWVyeSIsImdldF90eHMiLCJnZXRCbG9jayIsImJsb2Nrc0pzb25TdHIiLCJkZXNlcmlhbGl6ZVR4cyIsImdldFRyYW5zZmVycyIsIm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkiLCJnZXRfdHJhbnNmZXJzIiwiZ2V0VHhRdWVyeSIsImRlc2VyaWFsaXplVHJhbnNmZXJzIiwiZ2V0T3V0cHV0cyIsIm5vcm1hbGl6ZU91dHB1dFF1ZXJ5IiwiZ2V0X291dHB1dHMiLCJkZXNlcmlhbGl6ZU91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwiZXhwb3J0X291dHB1dHMiLCJvdXRwdXRzSGV4IiwiaW1wb3J0T3V0cHV0cyIsImltcG9ydF9vdXRwdXRzIiwibnVtSW1wb3J0ZWQiLCJleHBvcnRLZXlJbWFnZXMiLCJleHBvcnRfa2V5X2ltYWdlcyIsInJlc3VsdFN0ciIsInJlc3VsdEpzb24iLCJrZXlJbWFnZXMiLCJNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCIsImltcG9ydEtleUltYWdlcyIsIm9mZnNldCIsImltcG9ydF9rZXlfaW1hZ2VzIiwibWFwIiwia2V5SW1hZ2UiLCJrZXlJbWFnZUltcG9ydFJlc3VsdFN0ciIsIk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IiwiZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQiLCJmcmVlemVPdXRwdXQiLCJmcmVlemVfb3V0cHV0IiwidGhhd091dHB1dCIsInRoYXdfb3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJpc19vdXRwdXRfZnJvemVuIiwiZ2V0RGVmYXVsdEZlZVByaW9yaXR5IiwiZ2V0X2RlZmF1bHRfZmVlX3ByaW9yaXR5IiwiY3JlYXRlVHhzIiwiY29uZmlnTm9ybWFsaXplZCIsIm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyIsImdldENhblNwbGl0Iiwic2V0Q2FuU3BsaXQiLCJjcmVhdGVfdHhzIiwidHhTZXRKc29uU3RyIiwiTW9uZXJvVHhTZXQiLCJzd2VlcE91dHB1dCIsIm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnIiwic3dlZXBfb3V0cHV0Iiwic3dlZXBVbmxvY2tlZCIsIm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWciLCJzd2VlcF91bmxvY2tlZCIsInR4U2V0c0pzb24iLCJ0eFNldHMiLCJ0eFNldEpzb24iLCJ0eHMiLCJ0eFNldCIsInR4Iiwic3dlZXBEdXN0IiwicmVsYXkiLCJzd2VlcF9kdXN0Iiwic2V0VHhzIiwicmVsYXlUeHMiLCJ0eHNPck1ldGFkYXRhcyIsIkFycmF5IiwiaXNBcnJheSIsInR4TWV0YWRhdGFzIiwidHhPck1ldGFkYXRhIiwiTW9uZXJvVHhXYWxsZXQiLCJnZXRNZXRhZGF0YSIsInJlbGF5X3R4cyIsInR4SGFzaGVzSnNvbiIsImRlc2NyaWJlVHhTZXQiLCJ1bnNpZ25lZFR4SGV4IiwiZ2V0VW5zaWduZWRUeEhleCIsInNpZ25lZFR4SGV4IiwiZ2V0U2lnbmVkVHhIZXgiLCJtdWx0aXNpZ1R4SGV4IiwiZ2V0TXVsdGlzaWdUeEhleCIsImRlc2NyaWJlX3R4X3NldCIsImdldF9leGNlcHRpb25fbWVzc2FnZSIsInNpZ25UeHMiLCJzaWduX3R4cyIsInN1Ym1pdFR4cyIsInN1Ym1pdF90eHMiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIlNJR05fV0lUSF9TUEVORF9LRVkiLCJzaWduX21lc3NhZ2UiLCJ2ZXJpZnlNZXNzYWdlIiwiYWRkcmVzcyIsInNpZ25hdHVyZSIsInZlcmlmeV9tZXNzYWdlIiwiaXNHb29kIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCIsImlzT2xkIiwiU0lHTl9XSVRIX1ZJRVdfS0VZIiwidmVyc2lvbiIsImdldFR4S2V5IiwidHhIYXNoIiwiZ2V0X3R4X2tleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImNoZWNrX3R4X2tleSIsInJlc3BKc29uU3RyIiwiTW9uZXJvQ2hlY2tUeCIsImdldFR4UHJvb2YiLCJnZXRfdHhfcHJvb2YiLCJlcnJvcktleSIsImluZGV4T2YiLCJzdWJzdHJpbmciLCJsZW5ndGgiLCJjaGVja1R4UHJvb2YiLCJjaGVja190eF9wcm9vZiIsImdldFNwZW5kUHJvb2YiLCJnZXRfc3BlbmRfcHJvb2YiLCJjaGVja1NwZW5kUHJvb2YiLCJjaGVja19zcGVuZF9wcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldF9yZXNlcnZlX3Byb29mX3dhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJhbW91bnQiLCJnZXRfcmVzZXJ2ZV9wcm9vZl9hY2NvdW50IiwidG9TdHJpbmciLCJjaGVja1Jlc2VydmVQcm9vZiIsImNoZWNrX3Jlc2VydmVfcHJvb2YiLCJNb25lcm9DaGVja1Jlc2VydmUiLCJnZXRUeE5vdGVzIiwiZ2V0X3R4X25vdGVzIiwidHhOb3RlcyIsInNldFR4Tm90ZXMiLCJub3RlcyIsInNldF90eF9ub3RlcyIsImdldEFkZHJlc3NCb29rRW50cmllcyIsImVudHJ5SW5kaWNlcyIsImVudHJpZXMiLCJlbnRyeUpzb24iLCJnZXRfYWRkcmVzc19ib29rX2VudHJpZXMiLCJNb25lcm9BZGRyZXNzQm9va0VudHJ5IiwiYWRkQWRkcmVzc0Jvb2tFbnRyeSIsImRlc2NyaXB0aW9uIiwiYWRkX2FkZHJlc3NfYm9va19lbnRyeSIsImVkaXRBZGRyZXNzQm9va0VudHJ5IiwiaW5kZXgiLCJzZXRBZGRyZXNzIiwic2V0RGVzY3JpcHRpb24iLCJlZGl0X2FkZHJlc3NfYm9va19lbnRyeSIsImRlbGV0ZUFkZHJlc3NCb29rRW50cnkiLCJlbnRyeUlkeCIsImRlbGV0ZV9hZGRyZXNzX2Jvb2tfZW50cnkiLCJ0YWdBY2NvdW50cyIsImFjY291bnRJbmRpY2VzIiwidGFnX2FjY291bnRzIiwidW50YWdBY2NvdW50cyIsImdldEFjY291bnRUYWdzIiwiYWNjb3VudFRhZ3MiLCJhY2NvdW50VGFnSnNvbiIsImdldF9hY2NvdW50X3RhZ3MiLCJNb25lcm9BY2NvdW50VGFnIiwic2V0QWNjb3VudFRhZ0xhYmVsIiwic2V0X2FjY291bnRfdGFnX2xhYmVsIiwiZ2V0UGF5bWVudFVyaSIsImdldF9wYXltZW50X3VyaSIsInBhcnNlUGF5bWVudFVyaSIsIk1vbmVyb1R4Q29uZmlnIiwicGFyc2VfcGF5bWVudF91cmkiLCJnZXRBdHRyaWJ1dGUiLCJrZXkiLCJ2YWx1ZSIsImdldF9hdHRyaWJ1dGUiLCJzZXRBdHRyaWJ1dGUiLCJ2YWwiLCJzZXRfYXR0cmlidXRlIiwic3RhcnRNaW5pbmciLCJudW1UaHJlYWRzIiwiYmFja2dyb3VuZE1pbmluZyIsImlnbm9yZUJhdHRlcnkiLCJkYWVtb24iLCJNb25lcm9EYWVtb25ScGMiLCJjb25uZWN0VG9EYWVtb25ScGMiLCJzdG9wTWluaW5nIiwiaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCIsImlzX211bHRpc2lnX2ltcG9ydF9uZWVkZWQiLCJpc011bHRpc2lnIiwiaXNfbXVsdGlzaWciLCJnZXRNdWx0aXNpZ0luZm8iLCJNb25lcm9NdWx0aXNpZ0luZm8iLCJnZXRfbXVsdGlzaWdfaW5mbyIsInByZXBhcmVNdWx0aXNpZyIsInByZXBhcmVfbXVsdGlzaWciLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwidGhyZXNob2xkIiwibWFrZV9tdWx0aXNpZyIsImV4Y2hhbmdlTXVsdGlzaWdLZXlzIiwiZXhjaGFuZ2VfbXVsdGlzaWdfa2V5cyIsIk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsImV4cG9ydE11bHRpc2lnSGV4IiwiZXhwb3J0X211bHRpc2lnX2hleCIsImltcG9ydE11bHRpc2lnSGV4IiwicmVmcmVzaEFmdGVySW1wb3J0IiwiaW1wb3J0X211bHRpc2lnX2hleCIsInNpZ25NdWx0aXNpZ1R4SGV4Iiwic2lnbl9tdWx0aXNpZ190eF9oZXgiLCJNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJzdWJtaXRNdWx0aXNpZ1R4SGV4Iiwic2lnbmVkTXVsdGlzaWdUeEhleCIsInN1Ym1pdF9tdWx0aXNpZ190eF9oZXgiLCJnZXREYXRhIiwiZ2V0RGF0YVdhc20iLCJ2aWV3T25seSIsImlzX3ZpZXdfb25seSIsInZpZXdzIiwiY2FjaGVCdWZmZXJMb2MiLCJnZXRfY2FjaGVfZmlsZV9idWZmZXIiLCJ2aWV3IiwiRGF0YVZpZXciLCJBcnJheUJ1ZmZlciIsImkiLCJzZXRJbnQ4IiwiSEVBUFU4IiwicG9pbnRlciIsIlVpbnQ4QXJyYXkiLCJCWVRFU19QRVJfRUxFTUVOVCIsIl9mcmVlIiwiQnVmZmVyIiwiZnJvbSIsImJ1ZmZlciIsImtleXNCdWZmZXJMb2MiLCJnZXRfa2V5c19maWxlX2J1ZmZlciIsInVuc2hpZnQiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJjaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkIiwiZXJyTXNnIiwiY2xvc2VJbnRlcm5hbCIsInByZXBhcmVDbG9zZSIsInNuYXBzaG90IiwiZ2V0Q2xvc2VEYXRhIiwid3JpdGVXYWxsZXREYXRhIiwiZGF0YSIsInByaW1hcnlBZGRyZXNzIiwiX3JlcXVlc3Rfd2FsbGV0X3NodXRkb3duIiwiY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsImNhdGNoIiwiZ2V0X2FkZHJlc3MiLCJnZXROdW1CbG9ja3NUb1VubG9jayIsImdldFR4IiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJnZXRPdXRnb2luZ1RyYW5zZmVycyIsImNyZWF0ZVR4IiwicmVsYXlUeCIsImdldFR4Tm90ZSIsInNldFR4Tm90ZSIsIm5vdGUiLCJwcm94eVRvV29ya2VyIiwibmV0d29ya1R5cGUiLCJkYWVtb25VcmkiLCJkYWVtb25Vc2VybmFtZSIsImRhZW1vblBhc3N3b3JkIiwib3Blbl93YWxsZXRfZnVsbCIsImtleXNEYXRhIiwiY2FjaGVEYXRhIiwiZ2V0UmVndGVzdCIsImJyb3dzZXJNYWluUGF0aCIsImNvbnNvbGUiLCJlcnJvciIsImlzRW5hYmxlZCIsInNldF9saXN0ZW5lciIsIm5ld0xpc3RlbmVySGFuZGxlIiwiaGVpZ2h0IiwiZW5kSGVpZ2h0IiwicGVyY2VudERvbmUiLCJvblN5bmNQcm9ncmVzcyIsIm9uTmV3QmxvY2siLCJuZXdCYWxhbmNlU3RyIiwibmV3VW5sb2NrZWRCYWxhbmNlU3RyIiwib25CYWxhbmNlc0NoYW5nZWQiLCJhbW91bnRTdHIiLCJ1bmxvY2tUaW1lIiwiaXNMb2NrZWQiLCJvbk91dHB1dFJlY2VpdmVkIiwiYWNjb3VudElkeFN0ciIsInN1YmFkZHJlc3NJZHhTdHIiLCJvbk91dHB1dFNwZW50Iiwic2FuaXRpemVCbG9jayIsImJsb2NrIiwic2FuaXRpemVUeFdhbGxldCIsImFjY291bnQiLCJzdWJhZGRyZXNzIiwiZGVzZXJpYWxpemVCbG9ja3MiLCJibG9ja3NKc29uIiwiZGVzZXJpYWxpemVkQmxvY2tzIiwiYmxvY2tzIiwiYmxvY2tKc29uIiwiTW9uZXJvQmxvY2siLCJEZXNlcmlhbGl6YXRpb25UeXBlIiwiVFhfV0FMTEVUIiwic2V0QmxvY2siLCJnZXRIYXNoZXMiLCJ0eE1hcCIsIk1hcCIsImdldEhhc2giLCJ0eHNTb3J0ZWQiLCJ0cmFuc2ZlcnMiLCJnZXRPdXRnb2luZ1RyYW5zZmVyIiwidHJhbnNmZXIiLCJvdXRwdXRzIiwib3V0cHV0Iiwic2V0QnJvd3Nlck1haW5QYXRoIiwiUGF0aCIsIm5vcm1hbGl6ZSIsImlzQ2xvc2VkIiwid2FsbGV0RGlyIiwiZGlybmFtZSIsIm1rZGlyIiwid3JpdGVGaWxlIiwib2xkUGF0aCIsInVubGluayIsInBhdGhOZXciLCJyZW5hbWUiLCJleHBvcnRzIiwiZGVmYXVsdCIsIk1vbmVyb1dhbGxldEtleXNQcm94eSIsIndhbGxldElkIiwiaW52b2tlV29ya2VyIiwiZ2V0V29ya2VyIiwid29ya2VyIiwid3JhcHBlZExpc3RlbmVycyIsImFyZ3VtZW50cyIsInVyaU9yUnBjQ29ubmVjdGlvbiIsImdldENvbmZpZyIsInJwY0NvbmZpZyIsIndyYXBwZWRMaXN0ZW5lciIsIldhbGxldFdvcmtlckxpc3RlbmVyIiwibGlzdGVuZXJJZCIsImdldElkIiwiYWRkV29ya2VyQ2FsbGJhY2siLCJnZXRMaXN0ZW5lciIsInJlbW92ZVdvcmtlckNhbGxiYWNrIiwic3BsaWNlIiwiYmxvY2tKc29ucyIsImtleUltYWdlc0pzb24iLCJjbG9zZSIsImFubm91bmNlU3luY1Byb2dyZXNzIiwiYW5ub3VuY2VOZXdCbG9jayIsImFubm91bmNlQmFsYW5jZXNDaGFuZ2VkIiwiTW9uZXJvT3V0cHV0V2FsbGV0Iiwic2V0QW1vdW50Iiwic2V0QWNjb3VudEluZGV4Iiwic2V0U3ViYWRkcmVzc0luZGV4Iiwic2V0SGFzaCIsInNldFZlcnNpb24iLCJzZXRVbmxvY2tUaW1lIiwic2V0VHgiLCJzZXRPdXRwdXRzIiwic2V0SXNJbmNvbWluZyIsInNldElzTG9ja2VkIiwic2V0SGVpZ2h0Iiwic2V0SXNDb25maXJtZWQiLCJzZXRJblR4UG9vbCIsInNldElzRmFpbGVkIiwiYW5ub3VuY2VPdXRwdXRSZWNlaXZlZCIsInBhcnNlSW50Iiwic2V0SW5wdXRzIiwiYW5ub3VuY2VPdXRwdXRTcGVudCIsImlkIiwiZ2V0SW5wdXRzIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldEZ1bGwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgUGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuLi9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBUYXNrTG9vcGVyIGZyb20gXCIuLi9jb21tb24vVGFza0xvb3BlclwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnRUYWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFRhZ1wiO1xuaW1wb3J0IE1vbmVyb0FkZHJlc3NCb29rRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9DaGVja1R4IGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrVHhcIjtcbmltcG9ydCBNb25lcm9DaGVja1Jlc2VydmUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tSZXNlcnZlXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uUnBjIGZyb20gXCIuLi9kYWVtb24vTW9uZXJvRGFlbW9uUnBjXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0luY29taW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW5jb21pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbmZvXCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5pdFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHRcIjtcbmltcG9ydCBNb25lcm9OZXR3b3JrVHlwZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb05ldHdvcmtUeXBlXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0UXVlcnlcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9TdWJhZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb1N1YmFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9TeW5jUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb1N5bmNSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyUXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvVHhQcmlvcml0eSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFByaW9yaXR5XCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXQgZnJvbSBcIi4vTW9uZXJvV2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldENvbmZpZ1wiO1xuaW1wb3J0IHsgTW9uZXJvV2FsbGV0S2V5cywgTW9uZXJvV2FsbGV0S2V5c1Byb3h5IH0gZnJvbSBcIi4vTW9uZXJvV2FsbGV0S2V5c1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldExpc3RlbmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldExpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGVcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIGZyb20gXCIuLi9jb21tb24vTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJcIjtcblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvIHdhbGxldCB1c2luZyBjbGllbnQtc2lkZSBXZWJBc3NlbWJseSBiaW5kaW5ncyB0byBtb25lcm8tcHJvamVjdCdzIHdhbGxldDIgaW4gQysrLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9XYWxsZXRGdWxsIGV4dGVuZHMgTW9uZXJvV2FsbGV0S2V5cyB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgPSAyMDAwMDtcbiAgcHJvdGVjdGVkIHN0YXRpYyBGUztcblxuICAvLyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHBhdGg6IHN0cmluZztcbiAgcHJvdGVjdGVkIHBhc3N3b3JkOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBsaXN0ZW5lcnM6IE1vbmVyb1dhbGxldExpc3RlbmVyW107XG4gIHByb3RlY3RlZCBmczogYW55O1xuICBwcm90ZWN0ZWQgd2FzbUxpc3RlbmVyOiBXYWxsZXRXYXNtTGlzdGVuZXI7XG4gIHByb3RlY3RlZCB3YXNtTGlzdGVuZXJIYW5kbGU6IG51bWJlcjtcbiAgcHJvdGVjdGVkIHJlamVjdFVuYXV0aG9yaXplZDogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIHJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBzeW5jUGVyaW9kSW5NczogbnVtYmVyO1xuICBwcm90ZWN0ZWQgc3luY0xvb3BlcjogVGFza0xvb3BlcjtcbiAgcHJvdGVjdGVkIGJyb3dzZXJNYWluUGF0aDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgc3luY0NhbGxzID0gbmV3IFNldDxQcm9taXNlPGFueT4+KCk7XG5cbiAgLyoqXG4gICAqIEludGVybmFsIGNvbnN0cnVjdG9yIHdoaWNoIGlzIGdpdmVuIHRoZSBtZW1vcnkgYWRkcmVzcyBvZiBhIEMrKyB3YWxsZXQgaW5zdGFuY2UuXG4gICAqIFxuICAgKiBUaGlzIGNvbnN0cnVjdG9yIHNob3VsZCBiZSBjYWxsZWQgdGhyb3VnaCBzdGF0aWMgd2FsbGV0IGNyZWF0aW9uIHV0aWxpdGllcyBpbiB0aGlzIGNsYXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNwcEFkZHJlc3MgLSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2UgaW4gQysrXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gcGF0aCBvZiB0aGUgd2FsbGV0IGluc3RhbmNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtGaWxlU3lzdGVtfSBmcyAtIG5vZGUuanMtY29tcGF0aWJsZSBmaWxlIHN5c3RlbSB0byByZWFkL3dyaXRlIHdhbGxldCBmaWxlc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHJlamVjdFVuYXV0aG9yaXplZCAtIHNwZWNpZmllcyBpZiB1bmF1dGhvcml6ZWQgcmVxdWVzdHMgKGUuZy4gc2VsZi1zaWduZWQgY2VydGlmaWNhdGVzKSBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgLSB1bmlxdWUgaWRlbnRpZmllciBmb3IgaHR0cF9jbGllbnRfd2FzbSB0byBxdWVyeSByZWplY3RVbmF1dGhvcml6ZWRcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRGdWxsUHJveHl9IHdhbGxldFByb3h5IC0gcHJveHkgdG8gaW52b2tlIHdhbGxldCBvcGVyYXRpb25zIGluIGEgd2ViIHdvcmtlclxuICAgKiBcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNwcEFkZHJlc3MsIHBhdGgsIHBhc3N3b3JkLCBmcywgcmVqZWN0VW5hdXRob3JpemVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCB3YWxsZXRQcm94eT86IE1vbmVyb1dhbGxldEZ1bGxQcm94eSkge1xuICAgIHN1cGVyKGNwcEFkZHJlc3MsIHdhbGxldFByb3h5KTtcbiAgICBpZiAod2FsbGV0UHJveHkpIHJldHVybjtcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgIHRoaXMucGFzc3dvcmQgPSBwYXNzd29yZDtcbiAgICB0aGlzLmxpc3RlbmVycyA9IFtdO1xuICAgIHRoaXMuZnMgPSBmcyA/IGZzIDogKHBhdGggPyBNb25lcm9XYWxsZXRGdWxsLmdldEZzKCkgOiB1bmRlZmluZWQpO1xuICAgIHRoaXMuX2lzQ2xvc2VkID0gZmFsc2U7XG4gICAgdGhpcy53YXNtTGlzdGVuZXIgPSBuZXcgV2FsbGV0V2FzbUxpc3RlbmVyKHRoaXMpOyAvLyByZWNlaXZlcyBub3RpZmljYXRpb25zIGZyb20gd2FzbSBjKytcbiAgICB0aGlzLndhc21MaXN0ZW5lckhhbmRsZSA9IDA7ICAgICAgICAgICAgICAgICAgICAgIC8vIG1lbW9yeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgbGlzdGVuZXIgaW4gYysrXG4gICAgdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQgPSByZWplY3RVbmF1dGhvcml6ZWQ7XG4gICAgdGhpcy5yZWplY3RVbmF1dGhvcml6ZWRDb25maWdJZCA9IHJlamVjdFVuYXV0aG9yaXplZEZuSWQ7XG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IE1vbmVyb1dhbGxldEZ1bGwuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUztcbiAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4ocmVqZWN0VW5hdXRob3JpemVkRm5JZCwgKCkgPT4gdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQpOyAvLyByZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIFVUSUxJVElFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgd2FsbGV0IGV4aXN0cyBhdCBhIGdpdmVuIHBhdGguXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCBvbiB0aGUgZmlsZSBzeXN0ZW1cbiAgICogQHBhcmFtIHthbnl9IGZzIC0gZmlsZSBzeXN0ZW0gY29tcGF0aWJsZSB3aXRoIE5vZGUuanMgYGZzLnByb21pc2VzYCBBUEkgKGRlZmF1bHRzIHRvIGRpc2sgb3IgaW4tbWVtb3J5IEZTIGlmIGJyb3dzZXIpXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgYSB3YWxsZXQgZXhpc3RzIGF0IHRoZSBnaXZlbiBwYXRoLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyB3YWxsZXRFeGlzdHMocGF0aCwgZnMpIHtcbiAgICBhc3NlcnQocGF0aCwgXCJNdXN0IHByb3ZpZGUgYSBwYXRoIHRvIGxvb2sgZm9yIGEgd2FsbGV0XCIpO1xuICAgIGlmICghZnMpIGZzID0gTW9uZXJvV2FsbGV0RnVsbC5nZXRGcygpO1xuICAgIGlmICghZnMpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBmaWxlIHN5c3RlbSB0byBjaGVjayBpZiB3YWxsZXQgZXhpc3RzXCIpO1xuICAgIGxldCBleGlzdHMgPSBhd2FpdCBMaWJyYXJ5VXRpbHMuZXhpc3RzKGZzLCBwYXRoICsgXCIua2V5c1wiKTtcbiAgICBMaWJyYXJ5VXRpbHMubG9nKDEsIFwiV2FsbGV0IGV4aXN0cyBhdCBcIiArIHBhdGggKyBcIjogXCIgKyBleGlzdHMpO1xuICAgIHJldHVybiBleGlzdHM7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBvcGVuV2FsbGV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG5cbiAgICAvLyB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZy5nZXRQcm94eVRvV29ya2VyKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIodHJ1ZSk7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgc2VlZCB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHNlZWQgb2Zmc2V0IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHByaW1hcnkgYWRkcmVzcyB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBwcml2YXRlIHZpZXcga2V5IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBwcml2YXRlIHNwZW5kIGtleSB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHJlc3RvcmUgaGVpZ2h0IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IGxhbmd1YWdlIHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSB0cnVlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSBjdXJyZW50IHdhbGxldCB3aGVuIG9wZW5pbmcgZnVsbCB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRGcygpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRGcyhNb25lcm9XYWxsZXRGdWxsLmdldEZzKCkpO1xuXG4gICAgLy8gc2V0IHNlcnZlciBmcm9tIGNvbm5lY3Rpb24gbWFuYWdlciBpZiBwcm92aWRlZFxuICAgIGlmIChjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBvcGVuZWQgd2l0aCBhIHNlcnZlciBvciBjb25uZWN0aW9uIG1hbmFnZXIgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgY29uZmlnLnNldFNlcnZlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKS5nZXRDb25uZWN0aW9uKCkpO1xuICAgIH1cblxuICAgIC8vIHJlYWQgd2FsbGV0IGRhdGEgZnJvbSBkaXNrIHVubGVzcyBwcm92aWRlZFxuICAgIGlmICghY29uZmlnLmdldEtleXNEYXRhKCkpIHtcbiAgICAgIGxldCBmcyA9IGNvbmZpZy5nZXRGcygpO1xuICAgICAgaWYgKCFmcykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGZpbGUgc3lzdGVtIHRvIHJlYWQgd2FsbGV0IGRhdGEgZnJvbVwiKTtcbiAgICAgIGlmICghYXdhaXQgdGhpcy53YWxsZXRFeGlzdHMoY29uZmlnLmdldFBhdGgoKSwgZnMpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgZG9lcyBub3QgZXhpc3QgYXQgcGF0aDogXCIgKyBjb25maWcuZ2V0UGF0aCgpKTtcbiAgICAgIGNvbmZpZy5zZXRLZXlzRGF0YShhd2FpdCBmcy5yZWFkRmlsZShjb25maWcuZ2V0UGF0aCgpICsgXCIua2V5c1wiKSk7XG4gICAgICBjb25maWcuc2V0Q2FjaGVEYXRhKGF3YWl0IExpYnJhcnlVdGlscy5leGlzdHMoZnMsIGNvbmZpZy5nZXRQYXRoKCkpID8gYXdhaXQgZnMucmVhZEZpbGUoY29uZmlnLmdldFBhdGgoKSkgOiBcIlwiKTtcbiAgICB9XG5cbiAgICAvLyBvcGVuIHdhbGxldCBmcm9tIGRhdGFcbiAgICBjb25zdCB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLm9wZW5XYWxsZXREYXRhKGNvbmZpZyk7XG5cbiAgICAvLyBhcHBseSBleHBsaWNpdCBkYWVtb24gdHJ1c3RcbiAgICBpZiAoY29uZmlnLmdldElzVHJ1c3RlZERhZW1vbigpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFNlcnZlcigpKSBhd2FpdCB3YWxsZXQuc2V0RGFlbW9uQ29ubmVjdGlvbihjb25maWcuZ2V0U2VydmVyKCksIGNvbmZpZy5nZXRJc1RydXN0ZWREYWVtb24oKSk7XG5cbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAgYXdhaXQgd2FsbGV0LnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0KGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG5cbiAgICAvLyB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBjb25maWcgdG8gY3JlYXRlIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkICYmIChjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgbWF5IGJlIGluaXRpYWxpemVkIHdpdGggYSBzZWVkIG9yIGtleXMgYnV0IG5vdCBib3RoXCIpO1xuICAgIGlmIChjb25maWcuZ2V0TmV0d29ya1R5cGUoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYSBuZXR3b3JrVHlwZTogJ21haW5uZXQnLCAndGVzdG5ldCcgb3IgJ3N0YWdlbmV0J1wiKTtcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSB0cnVlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSBjdXJyZW50IHdhbGxldCB3aGVuIGNyZWF0aW5nIGZ1bGwgV0FTTSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFBhdGgoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgJiYgYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC53YWxsZXRFeGlzdHMoY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldEZzKCkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgYWxyZWFkeSBleGlzdHM6IFwiICsgY29uZmlnLmdldFBhdGgoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXNzd29yZCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQYXNzd29yZChcIlwiKTtcblxuICAgIC8vIHNldCBzZXJ2ZXIgZnJvbSBjb25uZWN0aW9uIG1hbmFnZXIgaWYgcHJvdmlkZWRcbiAgICBpZiAoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgY3JlYXRlZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBjb25maWcuc2V0U2VydmVyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpLmdldENvbm5lY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIHByb3hpZWQgb3IgbG9jYWwgd2FsbGV0XG4gICAgbGV0IHdhbGxldDtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJveHlUb1dvcmtlcih0cnVlKTtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSkge1xuICAgICAgbGV0IHdhbGxldFByb3h5ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbFByb3h5LmNyZWF0ZVdhbGxldChjb25maWcpO1xuICAgICAgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldEZ1bGwodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgd2FsbGV0UHJveHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBsYW5ndWFnZSB3aGVuIGNyZWF0aW5nIHdhbGxldCBmcm9tIHNlZWRcIik7XG4gICAgICAgIHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwuY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnKTtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgd2FsbGV0IGZyb20ga2V5c1wiKTtcbiAgICAgICAgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHJlc3RvcmVIZWlnaHQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgICAgICB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldFJhbmRvbShjb25maWcpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAgYXdhaXQgd2FsbGV0LnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG5cbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtc1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFJlc3RvcmVIZWlnaHQoMCk7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFNlZWRPZmZzZXQoXCJcIik7XG4gICAgXG4gICAgLy8gbG9hZCBmdWxsIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gcXVldWVcbiAgICBsZXQgd2FsbGV0ID0gYXdhaXQgbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgYXN5bmMgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0UGFzc3dvcmQoKSwgY29uZmlnLmdldEZzKCksIGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHNhdmUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBwYXJhbXNcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcmltYXJ5QWRkcmVzcyhcIlwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaXZhdGVWaWV3S2V5KFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaXZhdGVTcGVuZEtleShcIlwiKTtcbiAgICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkID0gZGFlbW9uQ29ubmVjdGlvbiA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB0cnVlO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRSZXN0b3JlSGVpZ2h0KDApO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoXCJFbmdsaXNoXCIpO1xuICAgIFxuICAgIC8vIGxvYWQgZnVsbCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHF1ZXVlXG4gICAgbGV0IHdhbGxldCA9IGF3YWl0IG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgYXN5bmMgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0UGFzc3dvcmQoKSwgY29uZmlnLmdldEZzKCksIGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHNhdmUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRSYW5kb20oY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtc1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoXCJFbmdsaXNoXCIpO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgXG4gICAgLy8gbG9hZCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHF1ZXVlXG4gICAgbGV0IHdhbGxldCA9IGF3YWl0IG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUuY3JlYXRlX2Z1bGxfd2FsbGV0KEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSksIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIGFzeW5jIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEZ1bGwoY3BwQWRkcmVzcywgY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldFBhc3N3b3JkKCksIGNvbmZpZy5nZXRGcygpLCBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBzYXZlIHdhbGxldFxuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBnZXRTZWVkTGFuZ3VhZ2VzKCkge1xuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICByZXR1cm4gbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShtb2R1bGUuZ2V0X2tleXNfd2FsbGV0X3NlZWRfbGFuZ3VhZ2VzKCkpLmxhbmd1YWdlcztcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRGcygpIHtcbiAgICBpZiAoIU1vbmVyb1dhbGxldEZ1bGwuRlMpIE1vbmVyb1dhbGxldEZ1bGwuRlMgPSBmcy5wcm9taXNlcztcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5GUztcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tIFdBTExFVCBNRVRIT0RTIFNQRUNJRklDIFRPIFdBU00gSU1QTEVNRU5UQVRJT04gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBUT0RPOiBtb3ZlIHRoZXNlIHRvIE1vbmVyb1dhbGxldC50cywgb3RoZXJzIGNhbiBiZSB1bnN1cHBvcnRlZFxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbWF4aW11bSBoZWlnaHQgb2YgdGhlIHBlZXJzIHRoZSB3YWxsZXQncyBkYWVtb24gaXMgY29ubmVjdGVkIHRvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBtYXhpbXVtIGhlaWdodCBvZiB0aGUgcGVlcnMgdGhlIHdhbGxldCdzIGRhZW1vbiBpcyBjb25uZWN0ZWQgdG9cbiAgICovXG4gIGFzeW5jIGdldERhZW1vbk1heFBlZXJIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldERhZW1vbk1heFBlZXJIZWlnaHQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfZGFlbW9uX21heF9wZWVyX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIHdhbGxldCdzIGRhZW1vbiBpcyBzeW5jZWQgd2l0aCB0aGUgbmV0d29yay5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIGRhZW1vbiBpcyBzeW5jZWQgd2l0aCB0aGUgbmV0d29yaywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc0RhZW1vblN5bmNlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzRGFlbW9uU3luY2VkKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuaXNfZGFlbW9uX3N5bmNlZCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIHdhbGxldCBpcyBzeW5jZWQgd2l0aCB0aGUgZGFlbW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgd2FsbGV0IGlzIHN5bmNlZCB3aXRoIHRoZSBkYWVtb24sIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNTeW5jZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc1N5bmNlZCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmlzX3N5bmNlZCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgbmV0d29yayB0eXBlIChtYWlubmV0LCB0ZXN0bmV0LCBvciBzdGFnZW5ldCkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb05ldHdvcmtUeXBlPn0gdGhlIHdhbGxldCdzIG5ldHdvcmsgdHlwZVxuICAgKi9cbiAgYXN5bmMgZ2V0TmV0d29ya1R5cGUoKTogUHJvbWlzZTxNb25lcm9OZXR3b3JrVHlwZT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0TmV0d29ya1R5cGUoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuZ2V0X25ldHdvcmtfdHlwZSh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBoZWlnaHQgb2YgdGhlIGZpcnN0IGJsb2NrIHRoYXQgdGhlIHdhbGxldCBzY2Fucy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIGhlaWdodCBvZiB0aGUgZmlyc3QgYmxvY2sgdGhhdCB0aGUgd2FsbGV0IHNjYW5zXG4gICAqL1xuICBhc3luYyBnZXRSZXN0b3JlSGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRSZXN0b3JlSGVpZ2h0KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmdldF9yZXN0b3JlX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSBoZWlnaHQgb2YgdGhlIGZpcnN0IGJsb2NrIHRoYXQgdGhlIHdhbGxldCBzY2Fucy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZXN0b3JlSGVpZ2h0IC0gaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnNcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldFJlc3RvcmVIZWlnaHQocmVzdG9yZUhlaWdodDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnNldF9yZXN0b3JlX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIHJlc3RvcmVIZWlnaHQpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogTW92ZSB0aGUgd2FsbGV0IGZyb20gaXRzIGN1cnJlbnQgcGF0aCB0byB0aGUgZ2l2ZW4gcGF0aC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gdGhlIHdhbGxldCdzIGRlc3RpbmF0aW9uIHBhdGhcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIG1vdmVUbyhwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLm1vdmVUbyhwYXRoKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5tb3ZlVG8ocGF0aCwgdGhpcyk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIENPTU1PTiBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvV2FsbGV0TGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhd2FpdCBzdXBlci5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXdhaXQgc3VwZXIucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcnMoKTogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXSB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRMaXN0ZW5lcnMoKTtcbiAgICByZXR1cm4gc3VwZXIuZ2V0TGlzdGVuZXJzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbm5lY3Rpb25NYW5hZ2VyPzogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIHJldHVybiBzdXBlci5zZXRDb25uZWN0aW9uTWFuYWdlcihjb25uZWN0aW9uTWFuYWdlcik7XG4gIH1cblxuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbj86IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBzdHJpbmcsIGlzVHJ1c3RlZD86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uLCBpc1RydXN0ZWQpO1xuXG4gICAgLy8gbm9ybWFsaXplIGNvbm5lY3Rpb25cbiAgICBsZXQgY29ubmVjdGlvbiA9ICF1cmlPckNvbm5lY3Rpb24gPyB1bmRlZmluZWQgOiB1cmlPckNvbm5lY3Rpb24gaW5zdGFuY2VvZiBNb25lcm9ScGNDb25uZWN0aW9uID8gdXJpT3JDb25uZWN0aW9uIDogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uKTtcbiAgICBsZXQgdXJpID0gY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmdldFVyaSgpID8gY29ubmVjdGlvbi5nZXRVcmkoKSA6IFwiXCI7XG4gICAgbGV0IHVzZXJuYW1lID0gY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmdldFVzZXJuYW1lKCkgPyBjb25uZWN0aW9uLmdldFVzZXJuYW1lKCkgOiBcIlwiO1xuICAgIGxldCBwYXNzd29yZCA9IGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5nZXRQYXNzd29yZCgpID8gY29ubmVjdGlvbi5nZXRQYXNzd29yZCgpIDogXCJcIjtcbiAgICBsZXQgcHJveHlVcmkgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA/IGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA6IFwiXCI7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkO1xuICAgIGxldCBpc1RydXN0ZWRBcmcgPSBpc1RydXN0ZWQgPT09IHVuZGVmaW5lZCA/IC0xIDogKGlzVHJ1c3RlZCA/IDEgOiAwKTsgLy8gbmVnYXRpdmUgaWYgdW5zZXRcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCA9IHJlamVjdFVuYXV0aG9yaXplZDsgIC8vIHBlcnNpc3QgbG9jYWxseVxuXG4gICAgLy8gc2V0IGNvbm5lY3Rpb24gaW4gcXVldWVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zZXRfZGFlbW9uX2Nvbm5lY3Rpb24odGhpcy5jcHBBZGRyZXNzLCB1cmksIHVzZXJuYW1lLCBwYXNzd29yZCwgcHJveHlVcmksIGlzVHJ1c3RlZEFyZywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSB3YWxsZXQncyBkYWVtb24gaXMgdHJ1c3RlZC5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgZGFlbW9uIGlzIHRydXN0ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNEYWVtb25UcnVzdGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNEYWVtb25UcnVzdGVkKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmlzX2RhZW1vbl90cnVzdGVkKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGFlbW9uQ29ubmVjdGlvbigpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGxldCBjb25uZWN0aW9uQ29udGFpbmVyU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2RhZW1vbl9jb25uZWN0aW9uKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICAgIGlmICghY29ubmVjdGlvbkNvbnRhaW5lclN0cikgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBsZXQganNvbkNvbm5lY3Rpb24gPSBKU09OLnBhcnNlKGNvbm5lY3Rpb25Db250YWluZXJTdHIpO1xuICAgICAgICAgIHJlc29sdmUobmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oe3VyaToganNvbkNvbm5lY3Rpb24udXJpLCB1c2VybmFtZToganNvbkNvbm5lY3Rpb24udXNlcm5hbWUsIHBhc3N3b3JkOiBqc29uQ29ubmVjdGlvbi5wYXNzd29yZCwgcHJveHlVcmk6IGpzb25Db25uZWN0aW9uLnByb3h5VXJpLCByZWplY3RVbmF1dGhvcml6ZWQ6IHRoaXMucmVqZWN0VW5hdXRob3JpemVkfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWRUb0RhZW1vbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzQ29ubmVjdGVkVG9EYWVtb24oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pc19jb25uZWN0ZWRfdG9fZGFlbW9uKHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VmVyc2lvbigpO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF0aCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzLnBhdGg7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcz86IHN0cmluZywgcGF5bWVudElkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzLm1vZHVsZS5nZXRfaW50ZWdyYXRlZF9hZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgc3RhbmRhcmRBZGRyZXNzID8gc3RhbmRhcmRBZGRyZXNzIDogXCJcIiwgcGF5bWVudElkID8gcGF5bWVudElkIDogXCJcIik7XG4gICAgICAgIGlmIChyZXN1bHQuY2hhckF0KDApICE9PSAneycpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXN1bHQpO1xuICAgICAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKEpTT04ucGFyc2UocmVzdWx0KSk7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoXCJJbnZhbGlkIHBheW1lbnQgSURcIikpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgcGF5bWVudCBJRDogXCIgKyBwYXltZW50SWQpO1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3MpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzLm1vZHVsZS5kZWNvZGVfaW50ZWdyYXRlZF9hZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgaW50ZWdyYXRlZEFkZHJlc3MpO1xuICAgICAgICBpZiAocmVzdWx0LmNoYXJBdCgwKSAhPT0gJ3snKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyhKU09OLnBhcnNlKHJlc3VsdCkpO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRIZWlnaHQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfaGVpZ2h0KHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldERhZW1vbkhlaWdodCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9kYWVtb25faGVpZ2h0KHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF5OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0SGVpZ2h0QnlEYXRlKHllYXIsIG1vbnRoLCBkYXkpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9oZWlnaHRfYnlfZGF0ZSh0aGlzLmNwcEFkZHJlc3MsIHllYXIsIG1vbnRoLCBkYXksIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTeW5jaHJvbml6ZSB0aGUgd2FsbGV0IHdpdGggdGhlIGRhZW1vbiBhcyBhIG9uZS10aW1lIHN5bmNocm9ub3VzIHByb2Nlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldExpc3RlbmVyfG51bWJlcn0gW2xpc3RlbmVyT3JTdGFydEhlaWdodF0gLSBsaXN0ZW5lciB4b3Igc3RhcnQgaGVpZ2h0IChkZWZhdWx0cyB0byBubyBzeW5jIGxpc3RlbmVyLCB0aGUgbGFzdCBzeW5jZWQgYmxvY2spXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnRIZWlnaHRdIC0gc3RhcnRIZWlnaHQgaWYgbm90IGdpdmVuIGluIGZpcnN0IGFyZyAoZGVmYXVsdHMgdG8gbGFzdCBzeW5jZWQgYmxvY2spXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FsbG93Q29uY3VycmVudENhbGxzXSAtIGFsbG93IG90aGVyIHdhbGxldCBtZXRob2RzIHRvIGJlIHByb2Nlc3NlZCBzaW11bHRhbmVvdXNseSBkdXJpbmcgc3luYyAoZGVmYXVsdCBmYWxzZSk8YnI+PGJyPjxiPldBUk5JTkc8L2I+OiBlbmFibGluZyB0aGlzIG9wdGlvbiB3aWxsIGNyYXNoIHdhbGxldCBleGVjdXRpb24gaWYgYW5vdGhlciBjYWxsIG1ha2VzIGEgc2ltdWx0YW5lb3VzIG5ldHdvcmsgcmVxdWVzdC4gVE9ETzogcG9zc2libGUgdG8gc3luYyB3YXNtIG5ldHdvcmsgcmVxdWVzdHMgaW4gaHR0cF9jbGllbnRfd2FzbS5jcHA/IFxuICAgKi9cbiAgYXN5bmMgc3luYyhsaXN0ZW5lck9yU3RhcnRIZWlnaHQ/OiBNb25lcm9XYWxsZXRMaXN0ZW5lciB8IG51bWJlciwgc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGFsbG93Q29uY3VycmVudENhbGxzID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb1N5bmNSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0LCBzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHMpO1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBwYXJhbXNcbiAgICBzdGFydEhlaWdodCA9IGxpc3RlbmVyT3JTdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkIHx8IGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyID8gc3RhcnRIZWlnaHQgOiBsaXN0ZW5lck9yU3RhcnRIZWlnaHQ7XG4gICAgbGV0IGxpc3RlbmVyID0gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIgPyBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gTWF0aC5tYXgoYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSwgYXdhaXQgdGhpcy5nZXRSZXN0b3JlSGVpZ2h0KCkpO1xuICAgIFxuICAgIC8vIHJlZ2lzdGVyIGxpc3RlbmVyIGlmIGdpdmVuXG4gICAgaWYgKGxpc3RlbmVyKSBhd2FpdCB0aGlzLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBcbiAgICAvLyBzeW5jIHdhbGxldFxuICAgIGxldCBlcnI7XG4gICAgbGV0IHJlc3VsdDtcbiAgICB0cnkge1xuICAgICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgICAgcmVzdWx0ID0gYXdhaXQgKGFsbG93Q29uY3VycmVudENhbGxzID8gc3luY1dhc20oKSA6IHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiBzeW5jV2FzbSgpKSk7XG4gICAgICBmdW5jdGlvbiBzeW5jV2FzbSgpIHtcbiAgICAgICAgdGhhdC5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgICAgbGV0IHJlc29sdmVDYWxsO1xuICAgICAgICBsZXQgcmVqZWN0Q2FsbDtcbiAgICAgICAgY29uc3QgY2FsbCA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHsgcmVzb2x2ZUNhbGwgPSByZXNvbHZlOyByZWplY3RDYWxsID0gcmVqZWN0OyB9KTtcbiAgICAgICAgdGhhdC5zeW5jQ2FsbHMuYWRkKGNhbGwpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIHN5bmMgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgICB0aGF0Lm1vZHVsZS5zeW5jKHRoYXQuY3BwQWRkcmVzcywgc3RhcnRIZWlnaHQsIChyZXNwKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0Q2FsbChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGxldCByZXNwSnNvbiA9IEpTT04ucGFyc2UocmVzcCk7XG4gICAgICAgICAgICAgIHJlc29sdmVDYWxsKG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3BKc29uLm51bUJsb2Nrc0ZldGNoZWQsIHJlc3BKc29uLnJlY2VpdmVkTW9uZXkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgcmVqZWN0Q2FsbChlcnIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYWxsLmZpbmFsbHkoKCkgPT4gdGhhdC5zeW5jQ2FsbHMuZGVsZXRlKGNhbGwpKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlcnIgPSBlO1xuICAgIH1cbiAgICBcbiAgICAvLyB1bnJlZ2lzdGVyIGxpc3RlbmVyXG4gICAgaWYgKGxpc3RlbmVyICYmICF0aGlzLl9pc0Nsb3NlZCkgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gdGhyb3cgZXJyb3Igb3IgcmV0dXJuXG4gICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncz86IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zKTtcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gc3luY1BlcmlvZEluTXMgPT09IHVuZGVmaW5lZCA/IE1vbmVyb1dhbGxldEZ1bGwuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA6IHN5bmNQZXJpb2RJbk1zO1xuICAgIGlmICghdGhpcy5zeW5jTG9vcGVyKSB0aGlzLnN5bmNMb29wZXIgPSBuZXcgVGFza0xvb3Blcihhc3luYyAoKSA9PiBhd2FpdCB0aGlzLmJhY2tncm91bmRTeW5jKCkpXG4gICAgdGhpcy5zeW5jTG9vcGVyLnN0YXJ0KHRoaXMuc3luY1BlcmlvZEluTXMpO1xuICB9XG4gICAgXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RvcFN5bmNpbmcoKTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGlmICh0aGlzLnN5bmNMb29wZXIpIHRoaXMuc3luY0xvb3Blci5zdG9wKCk7XG4gICAgdGhpcy5tb2R1bGUuc3RvcF9zeW5jaW5nKHRoaXMuY3BwQWRkcmVzcyk7IC8vIHRhc2sgaXMgbm90IHF1ZXVlZCBzbyB3YWxsZXQgc3RvcHMgaW1tZWRpYXRlbHlcbiAgfVxuICBcbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNjYW5UeHModHhIYXNoZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNjYW5fdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3R4SGFzaGVzOiB0eEhhc2hlc30pLCAoZXJyKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihlcnIpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuU3BlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZXNjYW5TcGVudCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnJlc2Nhbl9zcGVudCh0aGlzLmNwcEFkZHJlc3MsIChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGVycikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVzY2FuQmxvY2tjaGFpbigpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnJlc2Nhbl9ibG9ja2NoYWluKHRoaXMuY3BwQWRkcmVzcywgKGVycikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoZXJyKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGJhbGFuY2UgZW5jb2RlZCBpbiBqc29uIHN0cmluZ1xuICAgICAgbGV0IGJhbGFuY2VTdHI7XG4gICAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFzc2VydChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQsIFwiU3ViYWRkcmVzcyBpbmRleCBtdXN0IGJlIHVuZGVmaW5lZCBpZiBhY2NvdW50IGluZGV4IGlzIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgYmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF9iYWxhbmNlX3dhbGxldCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgfSBlbHNlIGlmIChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF9iYWxhbmNlX2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYmFsYW5jZV9zdWJhZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIHBhcnNlIGpzb24gc3RyaW5nIHRvIGJpZ2ludFxuICAgICAgcmV0dXJuIEJpZ0ludChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYmFsYW5jZVN0cikpLmJhbGFuY2UpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgXG4gICAgICAvLyBnZXQgYmFsYW5jZSBlbmNvZGVkIGluIGpzb24gc3RyaW5nXG4gICAgICBsZXQgdW5sb2NrZWRCYWxhbmNlU3RyO1xuICAgICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhc3NlcnQoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkLCBcIlN1YmFkZHJlc3MgaW5kZXggbXVzdCBiZSB1bmRlZmluZWQgaWYgYWNjb3VudCBpbmRleCBpcyB1bmRlZmluZWRcIik7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF91bmxvY2tlZF9iYWxhbmNlX3dhbGxldCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgfSBlbHNlIGlmIChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X3VubG9ja2VkX2JhbGFuY2VfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X3VubG9ja2VkX2JhbGFuY2Vfc3ViYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBwYXJzZSBqc29uIHN0cmluZyB0byBiaWdpbnRcbiAgICAgIHJldHVybiBCaWdJbnQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHVubG9ja2VkQmFsYW5jZVN0cikpLnVubG9ja2VkQmFsYW5jZSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCB0YWc/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgYWNjb3VudHNTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYWNjb3VudHModGhpcy5jcHBBZGRyZXNzLCBpbmNsdWRlU3ViYWRkcmVzc2VzID8gdHJ1ZSA6IGZhbHNlLCB0YWcgPyB0YWcgOiBcIlwiKTtcbiAgICAgIGxldCBhY2NvdW50cyA9IFtdO1xuICAgICAgZm9yIChsZXQgYWNjb3VudEpzb24gb2YgSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGFjY291bnRzU3RyKSkuYWNjb3VudHMpIHtcbiAgICAgICAgYWNjb3VudHMucHVzaChNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2NvdW50cztcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBY2NvdW50KGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBhY2NvdW50U3RyID0gdGhpcy5tb2R1bGUuZ2V0X2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzID8gdHJ1ZSA6IGZhbHNlKTtcbiAgICAgIGxldCBhY2NvdW50SnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhhY2NvdW50U3RyKSk7XG4gICAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgICB9KTtcblxuICB9XG4gIFxuICBhc3luYyBjcmVhdGVBY2NvdW50KGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jcmVhdGVBY2NvdW50KGxhYmVsKTtcbiAgICBpZiAobGFiZWwgPT09IHVuZGVmaW5lZCkgbGFiZWwgPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBhY2NvdW50U3RyID0gdGhpcy5tb2R1bGUuY3JlYXRlX2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBsYWJlbCk7XG4gICAgICBsZXQgYWNjb3VudEpzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYWNjb3VudFN0cikpO1xuICAgICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3NbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICBsZXQgYXJncyA9IHthY2NvdW50SWR4OiBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlczogc3ViYWRkcmVzc0luZGljZXMgPT09IHVuZGVmaW5lZCA/IFtdIDogR2VuVXRpbHMubGlzdGlmeShzdWJhZGRyZXNzSW5kaWNlcyl9O1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBzdWJhZGRyZXNzZXNKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHRoaXMubW9kdWxlLmdldF9zdWJhZGRyZXNzZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShhcmdzKSkpKS5zdWJhZGRyZXNzZXM7XG4gICAgICBsZXQgc3ViYWRkcmVzc2VzID0gW107XG4gICAgICBmb3IgKGxldCBzdWJhZGRyZXNzSnNvbiBvZiBzdWJhZGRyZXNzZXNKc29uKSBzdWJhZGRyZXNzZXMucHVzaChNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhuZXcgTW9uZXJvU3ViYWRkcmVzcyhzdWJhZGRyZXNzSnNvbikpKTtcbiAgICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4LCBsYWJlbCk7XG4gICAgaWYgKGxhYmVsID09PSB1bmRlZmluZWQpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgc3ViYWRkcmVzc1N0ciA9IHRoaXMubW9kdWxlLmNyZWF0ZV9zdWJhZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgbGFiZWwpO1xuICAgICAgbGV0IHN1YmFkZHJlc3NKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHN1YmFkZHJlc3NTdHIpKTtcbiAgICAgIHJldHVybiBNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhuZXcgTW9uZXJvU3ViYWRkcmVzcyhzdWJhZGRyZXNzSnNvbikpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpO1xuICAgIGlmIChsYWJlbCA9PT0gdW5kZWZpbmVkKSBsYWJlbCA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuc2V0X3N1YmFkZHJlc3NfbGFiZWwodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyhxdWVyeT86IHN0cmluZ1tdIHwgUGFydGlhbDxNb25lcm9UeFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHhzKHF1ZXJ5KTtcblxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHNjaGVkdWxlIHRhc2tcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2tcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHF1ZXJ5Tm9ybWFsaXplZC5nZXRCbG9jaygpLnRvSnNvbigpKSwgKGJsb2Nrc0pzb25TdHIpID0+IHtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBjaGVjayBmb3IgZXJyb3JcbiAgICAgICAgICBpZiAoYmxvY2tzSnNvblN0ci5jaGFyQXQoMCkgIT09ICd7Jykge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlc29sdmUgd2l0aCBkZXNlcmlhbGl6ZWQgdHhzXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc29sdmUoTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZVR4cyhxdWVyeU5vcm1hbGl6ZWQsIGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHJhbnNmZXJbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHJhbnNmZXJzKHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgb24gY2FsbGJhY2tcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2tcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3RyYW5zZmVycyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKS50b0pzb24oKSksIChibG9ja3NKc29uU3RyKSA9PiB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAvLyBjaGVjayBmb3IgZXJyb3JcbiAgICAgICAgICBpZiAoYmxvY2tzSnNvblN0ci5jaGFyQXQoMCkgIT09ICd7Jykge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgICBcbiAgICAgICAgICAvLyByZXNvbHZlIHdpdGggZGVzZXJpYWxpemVkIHRyYW5zZmVycyBcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb2x2ZShNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplVHJhbnNmZXJzKHF1ZXJ5Tm9ybWFsaXplZCwgYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9PdXRwdXRRdWVyeT4pOiBQcm9taXNlPE1vbmVyb091dHB1dFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRPdXRwdXRzKHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplT3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIG9uIGNhbGxiYWNrXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+e1xuICAgICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2tcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X291dHB1dHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkudG9Kc29uKCkpLCAoYmxvY2tzSnNvblN0cikgPT4ge1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIGNoZWNrIGZvciBlcnJvclxuICAgICAgICAgIGlmIChibG9ja3NKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IE1vbmVyb0Vycm9yKGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVzb2x2ZSB3aXRoIGRlc2VyaWFsaXplZCBvdXRwdXRzXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc29sdmUoTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZU91dHB1dHMocXVlcnlOb3JtYWxpemVkLCBibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE91dHB1dHMoYWxsID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZXhwb3J0T3V0cHV0cyhhbGwpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmV4cG9ydF9vdXRwdXRzKHRoaXMuY3BwQWRkcmVzcywgYWxsLCAob3V0cHV0c0hleCkgPT4gcmVzb2x2ZShvdXRwdXRzSGV4KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pbXBvcnRfb3V0cHV0cyh0aGlzLmNwcEFkZHJlc3MsIG91dHB1dHNIZXgsIChudW1JbXBvcnRlZCkgPT4gcmVzb2x2ZShudW1JbXBvcnRlZCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydEtleUltYWdlcyhhbGwgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmV4cG9ydEtleUltYWdlcyhhbGwpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmV4cG9ydF9rZXlfaW1hZ2VzKHRoaXMuY3BwQWRkcmVzcywgYWxsLCAocmVzdWx0U3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3VsdFN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXN1bHRTdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV0IHJlc3VsdEpzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMocmVzdWx0U3RyKSk7XG4gICAgICAgICAgICBpZiAoIXJlc3VsdEpzb24ua2V5SW1hZ2VzKSByZXN1bHRKc29uLmtleUltYWdlcyA9IFtdO1xuICAgICAgICAgICAgcmVzb2x2ZShuZXcgTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQocmVzdWx0SnNvbikpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlczogTW9uZXJvS2V5SW1hZ2VbXSwgb2Zmc2V0ID0gMCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmltcG9ydEtleUltYWdlcyhrZXlJbWFnZXMsIG9mZnNldCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaW1wb3J0X2tleV9pbWFnZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7b2Zmc2V0OiBvZmZzZXQsIGtleUltYWdlczoga2V5SW1hZ2VzLm1hcChrZXlJbWFnZSA9PiBrZXlJbWFnZS50b0pzb24oKSl9KSwgKGtleUltYWdlSW1wb3J0UmVzdWx0U3RyKSA9PiB7XG4gICAgICAgICAgaWYgKGtleUltYWdlSW1wb3J0UmVzdWx0U3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGtleUltYWdlSW1wb3J0UmVzdWx0U3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhrZXlJbWFnZUltcG9ydFJlc3VsdFN0cikpKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5mcmVlemVPdXRwdXQoa2V5SW1hZ2UpO1xuICAgIGlmICgha2V5SW1hZ2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3Qgc3BlY2lmeSBrZXkgaW1hZ2UgdG8gZnJlZXplXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmZyZWV6ZV9vdXRwdXQodGhpcy5jcHBBZGRyZXNzLCBrZXlJbWFnZSwgKCkgPT4gcmVzb2x2ZSgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnRoYXdPdXRwdXQoa2V5SW1hZ2UpO1xuICAgIGlmICgha2V5SW1hZ2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3Qgc3BlY2lmeSBrZXkgaW1hZ2UgdG8gdGhhd1wiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS50aGF3X291dHB1dCh0aGlzLmNwcEFkZHJlc3MsIGtleUltYWdlLCAoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzT3V0cHV0RnJvemVuKGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzT3V0cHV0RnJvemVuKGtleUltYWdlKTtcbiAgICBpZiAoIWtleUltYWdlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHNwZWNpZnkga2V5IGltYWdlIHRvIGNoZWNrIGlmIGZyb3plblwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pc19vdXRwdXRfZnJvemVuKHRoaXMuY3BwQWRkcmVzcywga2V5SW1hZ2UsIChyZXN1bHQpID0+IHJlc29sdmUocmVzdWx0KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGdldERlZmF1bHRGZWVQcmlvcml0eSgpOiBQcm9taXNlPE1vbmVyb1R4UHJpb3JpdHk+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldERlZmF1bHRGZWVQcmlvcml0eSgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9kZWZhdWx0X2ZlZV9wcmlvcml0eSh0aGlzLmNwcEFkZHJlc3MsIChyZXN1bHQpID0+IHJlc29sdmUocmVzdWx0KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNyZWF0ZVR4cyhjb25maWcpO1xuICAgIFxuICAgIC8vIHZhbGlkYXRlLCBjb3B5LCBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWdOb3JtYWxpemVkLnNldENhblNwbGl0KHRydWUpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB0eHMgaW4gcXVldWVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHR4cyBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLmNyZWF0ZV90eHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShjb25maWdOb3JtYWxpemVkLnRvSnNvbigpKSwgKHR4U2V0SnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmICh0eFNldEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhTZXRKc29uU3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0eFNldEpzb25TdHIpKSkuZ2V0VHhzKCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcE91dHB1dChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3dlZXBPdXRwdXQoY29uZmlnKTtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBzd2VlcCBvdXRwdXQgaW4gcXVldWVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gc3dlZXAgb3V0cHV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuc3dlZXBfb3V0cHV0KHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoY29uZmlnTm9ybWFsaXplZC50b0pzb24oKSksICh0eFNldEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAodHhTZXRKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4U2V0SnNvblN0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModHhTZXRKc29uU3RyKSkpLmdldFR4cygpWzBdKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHN3ZWVwVW5sb2NrZWQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3dlZXBVbmxvY2tlZChjb25maWcpO1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gc3dlZXAgdW5sb2NrZWQgaW4gcXVldWVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gc3dlZXAgdW5sb2NrZWQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5zd2VlcF91bmxvY2tlZCh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZ05vcm1hbGl6ZWQudG9Kc29uKCkpLCAodHhTZXRzSnNvbikgPT4ge1xuICAgICAgICAgIGlmICh0eFNldHNKc29uLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4U2V0c0pzb24pKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV0IHR4U2V0cyA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgdHhTZXRKc29uIG9mIEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0eFNldHNKc29uKSkudHhTZXRzKSB0eFNldHMucHVzaChuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKSk7XG4gICAgICAgICAgICBsZXQgdHhzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCB0eFNldCBvZiB0eFNldHMpIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB0eHMucHVzaCh0eCk7XG4gICAgICAgICAgICByZXNvbHZlKHR4cyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcER1c3QocmVsYXk/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zd2VlcER1c3QocmVsYXkpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuc3dlZXBfZHVzdCh0aGlzLmNwcEFkZHJlc3MsIHJlbGF5LCAodHhTZXRKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHR4U2V0SnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eFNldEpzb25TdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV0IHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0eFNldEpzb25TdHIpKSk7XG4gICAgICAgICAgICBpZiAodHhTZXQuZ2V0VHhzKCkgPT09IHVuZGVmaW5lZCkgdHhTZXQuc2V0VHhzKFtdKTtcbiAgICAgICAgICAgIHJlc29sdmUodHhTZXQuZ2V0VHhzKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHModHhzT3JNZXRhZGF0YXM6IChNb25lcm9UeFdhbGxldCB8IHN0cmluZylbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnJlbGF5VHhzKHR4c09yTWV0YWRhdGFzKTtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eHNPck1ldGFkYXRhcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBvciB0aGVpciBtZXRhZGF0YSB0byByZWxheVwiKTtcbiAgICBsZXQgdHhNZXRhZGF0YXMgPSBbXTtcbiAgICBmb3IgKGxldCB0eE9yTWV0YWRhdGEgb2YgdHhzT3JNZXRhZGF0YXMpIHR4TWV0YWRhdGFzLnB1c2godHhPck1ldGFkYXRhIGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQgPyB0eE9yTWV0YWRhdGEuZ2V0TWV0YWRhdGEoKSA6IHR4T3JNZXRhZGF0YSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUucmVsYXlfdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3R4TWV0YWRhdGFzOiB0eE1ldGFkYXRhc30pLCAodHhIYXNoZXNKc29uKSA9PiB7XG4gICAgICAgICAgaWYgKHR4SGFzaGVzSnNvbi5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eEhhc2hlc0pzb24pKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoSlNPTi5wYXJzZSh0eEhhc2hlc0pzb24pLnR4SGFzaGVzKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVzY3JpYmVUeFNldCh0eFNldDogTW9uZXJvVHhTZXQpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5kZXNjcmliZVR4U2V0KHR4U2V0KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0eFNldCA9IG5ldyBNb25lcm9UeFNldCh7dW5zaWduZWRUeEhleDogdHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpLCBzaWduZWRUeEhleDogdHhTZXQuZ2V0U2lnbmVkVHhIZXgoKSwgbXVsdGlzaWdUeEhleDogdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpfSk7XG4gICAgICB0cnkgeyByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0aGlzLm1vZHVsZS5kZXNjcmliZV90eF9zZXQodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh0eFNldC50b0pzb24oKSkpKSkpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnblR4cyh1bnNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zaWduVHhzKHVuc2lnbmVkVHhIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7IHJldHVybiBuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHRoaXMubW9kdWxlLnNpZ25fdHhzKHRoaXMuY3BwQWRkcmVzcywgdW5zaWduZWRUeEhleCkpKSk7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHRoaXMubW9kdWxlLmdldF9leGNlcHRpb25fbWVzc2FnZShlcnIpKTsgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeHMoc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN1Ym1pdFR4cyhzaWduZWRUeEhleCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuc3VibWl0X3R4cyh0aGlzLmNwcEFkZHJlc3MsIHNpZ25lZFR4SGV4LCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmIChyZXNwLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoSlNPTi5wYXJzZShyZXNwKS50eEhhc2hlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgc2lnbmF0dXJlVHlwZSA9IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVksIGFjY291bnRJZHggPSAwLCBzdWJhZGRyZXNzSWR4ID0gMCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zaWduTWVzc2FnZShtZXNzYWdlLCBzaWduYXR1cmVUeXBlLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICBcbiAgICAvLyBhc3NpZ24gZGVmYXVsdHNcbiAgICBzaWduYXR1cmVUeXBlID0gc2lnbmF0dXJlVHlwZSB8fCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZO1xuICAgIGFjY291bnRJZHggPSBhY2NvdW50SWR4IHx8IDA7XG4gICAgc3ViYWRkcmVzc0lkeCA9IHN1YmFkZHJlc3NJZHggfHwgMDtcbiAgICBcbiAgICAvLyBxdWV1ZSB0YXNrIHRvIHNpZ24gbWVzc2FnZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7IHJldHVybiB0aGlzLm1vZHVsZS5zaWduX21lc3NhZ2UodGhpcy5jcHBBZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmVUeXBlID09PSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZID8gMCA6IDEsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnZlcmlmeU1lc3NhZ2UobWVzc2FnZSwgYWRkcmVzcywgc2lnbmF0dXJlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzdWx0O1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS52ZXJpZnlfbWVzc2FnZSh0aGlzLmNwcEFkZHJlc3MsIG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSkpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlc3VsdCA9IHtpc0dvb2Q6IGZhbHNlfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdChyZXN1bHQuaXNHb29kID9cbiAgICAgICAge2lzR29vZDogcmVzdWx0LmlzR29vZCwgaXNPbGQ6IHJlc3VsdC5pc09sZCwgc2lnbmF0dXJlVHlwZTogcmVzdWx0LnNpZ25hdHVyZVR5cGUgPT09IFwic3BlbmRcIiA/IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVkgOiBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfVklFV19LRVksIHZlcnNpb246IHJlc3VsdC52ZXJzaW9ufSA6XG4gICAgICAgIHtpc0dvb2Q6IGZhbHNlfVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHhLZXkodHhIYXNoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gdGhpcy5tb2R1bGUuZ2V0X3R4X2tleSh0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCk7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHRoaXMubW9kdWxlLmdldF9leGNlcHRpb25fbWVzc2FnZShlcnIpKTsgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaDogc3RyaW5nLCB0eEtleTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoZWNrVHhLZXkodHhIYXNoLCB0eEtleSwgYWRkcmVzcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpOyBcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoZWNrX3R4X2tleSh0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCwgdHhLZXksIGFkZHJlc3MsIChyZXNwSnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmIChyZXNwSnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwSnNvblN0cikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvQ2hlY2tUeChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMocmVzcEpzb25TdHIpKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF90eF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBhZGRyZXNzIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgKHNpZ25hdHVyZSkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChzaWduYXR1cmUuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioc2lnbmF0dXJlLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1R4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja190eF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBhZGRyZXNzIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgc2lnbmF0dXJlIHx8IFwiXCIsIChyZXNwSnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmIChyZXNwSnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwSnNvblN0cikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvQ2hlY2tUeChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMocmVzcEpzb25TdHIpKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFNwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfc3BlbmRfcHJvb2YodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2ggfHwgXCJcIiwgbWVzc2FnZSB8fCBcIlwiLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoc2lnbmF0dXJlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1NwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja19zcGVuZF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBtZXNzYWdlIHx8IFwiXCIsIHNpZ25hdHVyZSB8fCBcIlwiLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiID8gcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSkgOiByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3Jlc2VydmVfcHJvb2Zfd2FsbGV0KHRoaXMuY3BwQWRkcmVzcywgbWVzc2FnZSwgKHNpZ25hdHVyZSkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChzaWduYXR1cmUuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioc2lnbmF0dXJlLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpLCAtMSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShzaWduYXR1cmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgYW1vdW50OiBiaWdpbnQsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4LCBhbW91bnQsIG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9yZXNlcnZlX3Byb29mX2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBhbW91bnQudG9TdHJpbmcoKSwgbWVzc2FnZSwgKHNpZ25hdHVyZSkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChzaWduYXR1cmUuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioc2lnbmF0dXJlLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpLCAtMSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShzaWduYXR1cmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1Jlc2VydmU+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpOyBcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoZWNrX3Jlc2VydmVfcHJvb2YodGhpcy5jcHBBZGRyZXNzLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUsIChyZXNwSnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmIChyZXNwSnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwSnNvblN0ciwgLTEpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb0NoZWNrUmVzZXJ2ZShKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMocmVzcEpzb25TdHIpKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFR4Tm90ZXModHhIYXNoZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7IHJldHVybiBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF90eF9ub3Rlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eEhhc2hlczogdHhIYXNoZXN9KSkpLnR4Tm90ZXM7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHRoaXMubW9kdWxlLmdldF9leGNlcHRpb25fbWVzc2FnZShlcnIpKTsgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSwgbm90ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXRUeE5vdGVzKHR4SGFzaGVzLCBub3Rlcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgdGhpcy5tb2R1bGUuc2V0X3R4X25vdGVzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3R4SGFzaGVzOiB0eEhhc2hlcywgdHhOb3Rlczogbm90ZXN9KSk7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHRoaXMubW9kdWxlLmdldF9leGNlcHRpb25fbWVzc2FnZShlcnIpKTsgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb0FkZHJlc3NCb29rRW50cnlbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcyk7XG4gICAgaWYgKCFlbnRyeUluZGljZXMpIGVudHJ5SW5kaWNlcyA9IFtdO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgICBmb3IgKGxldCBlbnRyeUpzb24gb2YgSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfYWRkcmVzc19ib29rX2VudHJpZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7ZW50cnlJbmRpY2VzOiBlbnRyeUluZGljZXN9KSkpLmVudHJpZXMpIHtcbiAgICAgICAgZW50cmllcy5wdXNoKG5ldyBNb25lcm9BZGRyZXNzQm9va0VudHJ5KGVudHJ5SnNvbikpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVudHJpZXM7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzczogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5hZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3MsIGRlc2NyaXB0aW9uKTtcbiAgICBpZiAoIWFkZHJlc3MpIGFkZHJlc3MgPSBcIlwiO1xuICAgIGlmICghZGVzY3JpcHRpb24pIGRlc2NyaXB0aW9uID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuYWRkX2FkZHJlc3NfYm9va19lbnRyeSh0aGlzLmNwcEFkZHJlc3MsIGFkZHJlc3MsIGRlc2NyaXB0aW9uKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXg6IG51bWJlciwgc2V0QWRkcmVzczogYm9vbGVhbiwgYWRkcmVzczogc3RyaW5nIHwgdW5kZWZpbmVkLCBzZXREZXNjcmlwdGlvbjogYm9vbGVhbiwgZGVzY3JpcHRpb246IHN0cmluZyB8IHVuZGVmaW5lZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXgsIHNldEFkZHJlc3MsIGFkZHJlc3MsIHNldERlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbik7XG4gICAgaWYgKCFzZXRBZGRyZXNzKSBzZXRBZGRyZXNzID0gZmFsc2U7XG4gICAgaWYgKCFhZGRyZXNzKSBhZGRyZXNzID0gXCJcIjtcbiAgICBpZiAoIXNldERlc2NyaXB0aW9uKSBzZXREZXNjcmlwdGlvbiA9IGZhbHNlO1xuICAgIGlmICghZGVzY3JpcHRpb24pIGRlc2NyaXB0aW9uID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5lZGl0X2FkZHJlc3NfYm9va19lbnRyeSh0aGlzLmNwcEFkZHJlc3MsIGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLmRlbGV0ZV9hZGRyZXNzX2Jvb2tfZW50cnkodGhpcy5jcHBBZGRyZXNzLCBlbnRyeUlkeCk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRhZ0FjY291bnRzKHRhZzogc3RyaW5nLCBhY2NvdW50SW5kaWNlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnRhZ0FjY291bnRzKHRhZywgYWNjb3VudEluZGljZXMpO1xuICAgIGlmICghdGFnKSB0YWcgPSBcIlwiO1xuICAgIGlmICghYWNjb3VudEluZGljZXMpIGFjY291bnRJbmRpY2VzID0gW107XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUudGFnX2FjY291bnRzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3RhZzogdGFnLCBhY2NvdW50SW5kaWNlczogYWNjb3VudEluZGljZXN9KSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyB1bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkudW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlcyk7XG4gICAgaWYgKCFhY2NvdW50SW5kaWNlcykgYWNjb3VudEluZGljZXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS50YWdfYWNjb3VudHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7YWNjb3VudEluZGljZXM6IGFjY291bnRJbmRpY2VzfSkpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50VGFncygpOiBQcm9taXNlPE1vbmVyb0FjY291bnRUYWdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWNjb3VudFRhZ3MoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgYWNjb3VudFRhZ3MgPSBbXTtcbiAgICAgIGZvciAobGV0IGFjY291bnRUYWdKc29uIG9mIEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X2FjY291bnRfdGFncyh0aGlzLmNwcEFkZHJlc3MpKS5hY2NvdW50VGFncykgYWNjb3VudFRhZ3MucHVzaChuZXcgTW9uZXJvQWNjb3VudFRhZyhhY2NvdW50VGFnSnNvbikpO1xuICAgICAgcmV0dXJuIGFjY291bnRUYWdzO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc2V0QWNjb3VudFRhZ0xhYmVsKHRhZzogc3RyaW5nLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXRBY2NvdW50VGFnTGFiZWwodGFnLCBsYWJlbCk7XG4gICAgaWYgKCF0YWcpIHRhZyA9IFwiXCI7XG4gICAgaWYgKCFsYWJlbCkgbGFiZWwgPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnNldF9hY2NvdW50X3RhZ19sYWJlbCh0aGlzLmNwcEFkZHJlc3MsIHRhZywgbGFiZWwpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXltZW50VXJpKGNvbmZpZzogTW9uZXJvVHhDb25maWcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UGF5bWVudFVyaShjb25maWcpO1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2R1bGUuZ2V0X3BheW1lbnRfdXJpKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IG1ha2UgVVJJIGZyb20gc3VwcGxpZWQgcGFyYW1ldGVyc1wiKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcGFyc2VQYXltZW50VXJpKHVyaTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeENvbmZpZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucGFyc2VQYXltZW50VXJpKHVyaSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIG5ldyBNb25lcm9UeENvbmZpZyhKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModGhpcy5tb2R1bGUucGFyc2VfcGF5bWVudF91cmkodGhpcy5jcHBBZGRyZXNzLCB1cmkpKSkpO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QXR0cmlidXRlKGtleTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEF0dHJpYnV0ZShrZXkpO1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgYXNzZXJ0KHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIsIFwiQXR0cmlidXRlIGtleSBtdXN0IGJlIGEgc3RyaW5nXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCB2YWx1ZSA9IHRoaXMubW9kdWxlLmdldF9hdHRyaWJ1dGUodGhpcy5jcHBBZGRyZXNzLCBrZXkpO1xuICAgICAgcmV0dXJuIHZhbHVlID09PSBcIlwiID8gbnVsbCA6IHZhbHVlO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcsIHZhbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXRBdHRyaWJ1dGUoa2V5LCB2YWwpO1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgYXNzZXJ0KHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIsIFwiQXR0cmlidXRlIGtleSBtdXN0IGJlIGEgc3RyaW5nXCIpO1xuICAgIGFzc2VydCh0eXBlb2YgdmFsID09PSBcInN0cmluZ1wiLCBcIkF0dHJpYnV0ZSB2YWx1ZSBtdXN0IGJlIGEgc3RyaW5nXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnNldF9hdHRyaWJ1dGUodGhpcy5jcHBBZGRyZXNzLCBrZXksIHZhbCk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKG51bVRocmVhZHM6IG51bWJlciwgYmFja2dyb3VuZE1pbmluZz86IGJvb2xlYW4sIGlnbm9yZUJhdHRlcnk/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdGFydE1pbmluZyhudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGxldCBkYWVtb24gPSBhd2FpdCBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKGF3YWl0IHRoaXMuZ2V0RGFlbW9uQ29ubmVjdGlvbigpKTtcbiAgICBhd2FpdCBkYWVtb24uc3RhcnRNaW5pbmcoYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpLCBudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN0b3BNaW5pbmcoKTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGxldCBkYWVtb24gPSBhd2FpdCBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKGF3YWl0IHRoaXMuZ2V0RGFlbW9uQ29ubmVjdGlvbigpKTtcbiAgICBhd2FpdCBkYWVtb24uc3RvcE1pbmluZygpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnSW1wb3J0TmVlZGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5pc19tdWx0aXNpZ19pbXBvcnRfbmVlZGVkKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWcoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc011bHRpc2lnKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmlzX211bHRpc2lnKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE11bHRpc2lnSW5mbygpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5mbz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0TXVsdGlzaWdJbmZvKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9NdWx0aXNpZ0luZm8oSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfbXVsdGlzaWdfaW5mbyh0aGlzLmNwcEFkZHJlc3MpKSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucHJlcGFyZU11bHRpc2lnKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLnByZXBhcmVfbXVsdGlzaWcodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgbWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCB0aHJlc2hvbGQ6IG51bWJlciwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5tYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlcywgdGhyZXNob2xkLCBwYXNzd29yZCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUubWFrZV9tdWx0aXNpZyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHttdWx0aXNpZ0hleGVzOiBtdWx0aXNpZ0hleGVzLCB0aHJlc2hvbGQ6IHRocmVzaG9sZCwgcGFzc3dvcmQ6IHBhc3N3b3JkfSksIChyZXNwKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHJlc3AuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcC5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlcywgcGFzc3dvcmQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmV4Y2hhbmdlX211bHRpc2lnX2tleXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7bXVsdGlzaWdIZXhlczogbXVsdGlzaWdIZXhlcywgcGFzc3dvcmQ6IHBhc3N3b3JkfSksIChyZXNwKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHJlc3AuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcC5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0KEpTT04ucGFyc2UocmVzcCkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0TXVsdGlzaWdIZXgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmV4cG9ydE11bHRpc2lnSGV4KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmV4cG9ydF9tdWx0aXNpZ19oZXgodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHJlZnJlc2hBZnRlckltcG9ydD86IGJvb2xlYW4pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmIChyZWZyZXNoQWZ0ZXJJbXBvcnQgPT09IHVuZGVmaW5lZCkgcmVmcmVzaEFmdGVySW1wb3J0ID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXMsIHJlZnJlc2hBZnRlckltcG9ydCk7XG4gICAgaWYgKCFHZW5VdGlscy5pc0FycmF5KG11bHRpc2lnSGV4ZXMpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgc3RyaW5nW10gdG8gaW1wb3J0TXVsdGlzaWdIZXgoKVwiKVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmltcG9ydF9tdWx0aXNpZ19oZXgodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7bXVsdGlzaWdIZXhlczogbXVsdGlzaWdIZXhlcywgcmVmcmVzaEFmdGVySW1wb3J0OiByZWZyZXNoQWZ0ZXJJbXBvcnR9KSwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNpZ25fbXVsdGlzaWdfdHhfaGV4KHRoaXMuY3BwQWRkcmVzcywgbXVsdGlzaWdUeEhleCwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQoSlNPTi5wYXJzZShyZXNwKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuc3VibWl0X211bHRpc2lnX3R4X2hleCh0aGlzLmNwcEFkZHJlc3MsIHNpZ25lZE11bHRpc2lnVHhIZXgsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShKU09OLnBhcnNlKHJlc3ApLnR4SGFzaGVzKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3Mga2V5cyBhbmQgY2FjaGUgZGF0YS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8RGF0YVZpZXdbXT59IGlzIHRoZSBrZXlzIGFuZCBjYWNoZSBkYXRhLCByZXNwZWN0aXZlbHlcbiAgICovXG4gIGFzeW5jIGdldERhdGEoKTogUHJvbWlzZTxEYXRhVmlld1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXREYXRhKCk7XG4gICAgXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0RGF0YVdhc20oKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXREYXRhV2FzbSgpOiBEYXRhVmlld1tdIHtcbiAgICBsZXQgdmlld09ubHkgPSB0aGlzLm1vZHVsZS5pc192aWV3X29ubHkodGhpcy5jcHBBZGRyZXNzKTtcblxuICAgIC8vIHN0b3JlIHZpZXdzIGluIGFycmF5XG4gICAgbGV0IHZpZXdzID0gW107XG5cbiAgICAvLyBtYWxsb2MgY2FjaGUgYnVmZmVyIGFuZCBnZXQgYnVmZmVyIGxvY2F0aW9uIGluIGMrKyBoZWFwXG4gICAgbGV0IGNhY2hlQnVmZmVyTG9jID0gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfY2FjaGVfZmlsZV9idWZmZXIodGhpcy5jcHBBZGRyZXNzKSk7XG5cbiAgICAvLyByZWFkIGJpbmFyeSBkYXRhIGZyb20gaGVhcCB0byBEYXRhVmlld1xuICAgIGxldCB2aWV3ID0gbmV3IERhdGFWaWV3KG5ldyBBcnJheUJ1ZmZlcihjYWNoZUJ1ZmZlckxvYy5sZW5ndGgpKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNhY2hlQnVmZmVyTG9jLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2aWV3LnNldEludDgoaSwgdGhpcy5tb2R1bGUuSEVBUFU4W2NhY2hlQnVmZmVyTG9jLnBvaW50ZXIgLyBVaW50OEFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICsgaV0pO1xuICAgIH1cblxuICAgIC8vIGZyZWUgYmluYXJ5IG9uIGhlYXBcbiAgICB0aGlzLm1vZHVsZS5fZnJlZShjYWNoZUJ1ZmZlckxvYy5wb2ludGVyKTtcblxuICAgIC8vIHdyaXRlIGNhY2hlIGZpbGVcbiAgICB2aWV3cy5wdXNoKEJ1ZmZlci5mcm9tKHZpZXcuYnVmZmVyKSk7XG5cbiAgICAvLyBtYWxsb2Mga2V5cyBidWZmZXIgYW5kIGdldCBidWZmZXIgbG9jYXRpb24gaW4gYysrIGhlYXBcbiAgICBsZXQga2V5c0J1ZmZlckxvYyA9IEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X2tleXNfZmlsZV9idWZmZXIodGhpcy5jcHBBZGRyZXNzLCB0aGlzLnBhc3N3b3JkLCB2aWV3T25seSkpO1xuXG4gICAgLy8gcmVhZCBiaW5hcnkgZGF0YSBmcm9tIGhlYXAgdG8gRGF0YVZpZXdcbiAgICB2aWV3ID0gbmV3IERhdGFWaWV3KG5ldyBBcnJheUJ1ZmZlcihrZXlzQnVmZmVyTG9jLmxlbmd0aCkpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5c0J1ZmZlckxvYy5sZW5ndGg7IGkrKykge1xuICAgICAgdmlldy5zZXRJbnQ4KGksIHRoaXMubW9kdWxlLkhFQVBVOFtrZXlzQnVmZmVyTG9jLnBvaW50ZXIgLyBVaW50OEFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICsgaV0pO1xuICAgIH1cblxuICAgIC8vIGZyZWUgYmluYXJ5IG9uIGhlYXBcbiAgICB0aGlzLm1vZHVsZS5fZnJlZShrZXlzQnVmZmVyTG9jLnBvaW50ZXIpO1xuXG4gICAgLy8gcHJlcGVuZCBrZXlzIGZpbGVcbiAgICB2aWV3cy51bnNoaWZ0KEJ1ZmZlci5mcm9tKHZpZXcuYnVmZmVyKSk7XG4gICAgcmV0dXJuIHZpZXdzO1xuICB9XG5cbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQ6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkKTtcbiAgICBpZiAob2xkUGFzc3dvcmQgIT09IHRoaXMucGFzc3dvcmQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgb3JpZ2luYWwgcGFzc3dvcmQuXCIpOyAvLyB3YWxsZXQyIHZlcmlmeV9wYXNzd29yZCBsb2FkcyBmcm9tIGRpc2sgc28gdmVyaWZ5IHBhc3N3b3JkIGhlcmVcbiAgICBpZiAobmV3UGFzc3dvcmQgPT09IHVuZGVmaW5lZCkgbmV3UGFzc3dvcmQgPSBcIlwiO1xuICAgIGF3YWl0IHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hhbmdlX3dhbGxldF9wYXNzd29yZCh0aGlzLmNwcEFkZHJlc3MsIG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCwgKGVyck1zZykgPT4ge1xuICAgICAgICAgIGlmIChlcnJNc2cpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoZXJyTXNnKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgdGhpcy5wYXNzd29yZCA9IG5ld1Bhc3N3b3JkO1xuICAgIGlmICh0aGlzLnBhdGgpIGF3YWl0IHRoaXMuc2F2ZSgpOyAvLyBhdXRvIHNhdmVcbiAgfVxuICBcbiAgYXN5bmMgc2F2ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNhdmUoKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYXZlKHRoaXMpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgY2xvc2VJbnRlcm5hbChzYXZlOiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMud2FsbGV0UHJveHkpIHtcbiAgICAgIGF3YWl0IHN1cGVyLmNsb3NlSW50ZXJuYWwoc2F2ZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IHRoaXMucHJlcGFyZUNsb3NlKCk7XG4gICAgaWYgKHNhdmUpIHtcbiAgICAgIGF3YWl0IExpYnJhcnlVdGlscy5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBzbmFwc2hvdCA9IGF3YWl0IHRoaXMuZ2V0Q2xvc2VEYXRhKCk7XG4gICAgICAgIGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwud3JpdGVXYWxsZXREYXRhKHRoaXMsIHNuYXBzaG90LmRhdGEsIHNuYXBzaG90LnByaW1hcnlBZGRyZXNzKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBhd2FpdCBzdXBlci5jbG9zZUludGVybmFsKGZhbHNlLCB0aGlzLndhc21MaXN0ZW5lckhhbmRsZSk7XG4gICAgdGhpcy53YXNtTGlzdGVuZXJIYW5kbGUgPSAwO1xuICAgIGRlbGV0ZSB0aGlzLnBhdGg7XG4gICAgZGVsZXRlIHRoaXMucGFzc3dvcmQ7XG4gICAgZGVsZXRlIHRoaXMud2FzbUxpc3RlbmVyO1xuICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbih0aGlzLnJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkLCB1bmRlZmluZWQpOyAvLyB1bnJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgfVxuXG4gIC8vIGNhbmNlbCBvdXRzaWRlIHRoZSBtb2R1bGUgcXVldWUgc28gYSBibG9ja2VkIHJlcXVlc3QgY2FuIHJlbGVhc2UgaXRcbiAgcHJvdGVjdGVkIGFzeW5jIHByZXBhcmVDbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLl9pc0Nsb3NlZCA9IHRydWU7XG4gICAgaWYgKHRoaXMuc3luY0xvb3BlcikgdGhpcy5zeW5jTG9vcGVyLnN0b3AoKTtcbiAgICB0aGlzLm1vZHVsZS5fcmVxdWVzdF93YWxsZXRfc2h1dGRvd24odGhpcy5jcHBBZGRyZXNzKTtcbiAgICBpZiAodGhpcy5jb25uZWN0aW9uTWFuYWdlciAmJiB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyLmdldExpc3RlbmVycygpLmluY2x1ZGVzKHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcikpIHRoaXMuY29ubmVjdGlvbk1hbmFnZXIucmVtb3ZlTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyKTtcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciA9IHVuZGVmaW5lZDtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChBcnJheS5mcm9tKHRoaXMuc3luY0NhbGxzLCBjYWxsID0+IGNhbGwuY2F0Y2goKCkgPT4ge30pKSk7XG4gICAgYXdhaXQgdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHt9KTtcbiAgfVxuXG4gIC8vIHNlcmlhbGl6ZSBhIHN0b3BwZWQgd2FsbGV0IGZvciBzYXZpbmcgb24gdGhpcyB0aHJlYWQgb3IgdGhlIHdvcmtlcidzIGNhbGxlclxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0Q2xvc2VEYXRhKCkge1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4gKHtcbiAgICAgIGRhdGE6IHRoaXMuZ2V0RGF0YVdhc20oKSxcbiAgICAgIHByaW1hcnlBZGRyZXNzOiB0aGlzLm1vZHVsZS5nZXRfYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIDAsIDApXG4gICAgfSkpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0gQUREIEpTRE9DIEZPUiBTVVBQT1JURUQgREVGQVVMVCBJTVBMRU1FTlRBVElPTlMgLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGdldE51bUJsb2Nrc1RvVW5sb2NrKCk6IFByb21pc2U8bnVtYmVyW118dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXROdW1CbG9ja3NUb1VubG9jaygpOyB9XG4gIGFzeW5jIGdldFR4KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldHx1bmRlZmluZWQ+IHsgcmV0dXJuIHN1cGVyLmdldFR4KHR4SGFzaCk7IH1cbiAgYXN5bmMgZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb0luY29taW5nVHJhbnNmZXJbXT4geyByZXR1cm4gc3VwZXIuZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KSB7IHJldHVybiBzdXBlci5nZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeSk7IH1cbiAgYXN5bmMgY3JlYXRlVHgoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHsgcmV0dXJuIHN1cGVyLmNyZWF0ZVR4KGNvbmZpZyk7IH1cbiAgYXN5bmMgcmVsYXlUeCh0eE9yTWV0YWRhdGE6IE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLnJlbGF5VHgodHhPck1ldGFkYXRhKTsgfVxuICBhc3luYyBnZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIuZ2V0VHhOb3RlKHR4SGFzaCk7IH1cbiAgYXN5bmMgc2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nLCBub3RlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHN1cGVyLnNldFR4Tm90ZSh0eEhhc2gsIG5vdGUpOyB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgSEVMUEVSUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBvcGVuV2FsbGV0RGF0YShjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPikge1xuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlcikge1xuICAgICAgbGV0IHdhbGxldFByb3h5ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbFByb3h5Lm9wZW5XYWxsZXREYXRhKGNvbmZpZyk7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb1dhbGxldEZ1bGwodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgd2FsbGV0UHJveHkpO1xuICAgIH1cbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtZXRlcnNcbiAgICBpZiAoY29uZmlnLm5ldHdvcmtUeXBlID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSB0aGUgd2FsbGV0J3MgbmV0d29yayB0eXBlXCIpO1xuICAgIGNvbmZpZy5uZXR3b3JrVHlwZSA9IE1vbmVyb05ldHdvcmtUeXBlLmZyb20oY29uZmlnLm5ldHdvcmtUeXBlKTtcbiAgICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgICBsZXQgZGFlbW9uVXJpID0gZGFlbW9uQ29ubmVjdGlvbiAmJiBkYWVtb25Db25uZWN0aW9uLmdldFVyaSgpID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRVcmkoKSA6IFwiXCI7XG4gICAgbGV0IGRhZW1vblVzZXJuYW1lID0gZGFlbW9uQ29ubmVjdGlvbiAmJiBkYWVtb25Db25uZWN0aW9uLmdldFVzZXJuYW1lKCkgPyBkYWVtb25Db25uZWN0aW9uLmdldFVzZXJuYW1lKCkgOiBcIlwiO1xuICAgIGxldCBkYWVtb25QYXNzd29yZCA9IGRhZW1vbkNvbm5lY3Rpb24gJiYgZGFlbW9uQ29ubmVjdGlvbi5nZXRQYXNzd29yZCgpID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRQYXNzd29yZCgpIDogXCJcIjtcbiAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkID0gZGFlbW9uQ29ubmVjdGlvbiA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB0cnVlO1xuICAgIFxuICAgIC8vIGxvYWQgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gb3BlbiB3YWxsZXQgaW4gcXVldWVcbiAgICByZXR1cm4gbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICAgICAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkRm5JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHJlamVjdFVuYXV0aG9yaXplZCk7XG4gICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5vcGVuX3dhbGxldF9mdWxsKGNvbmZpZy5wYXNzd29yZCwgY29uZmlnLm5ldHdvcmtUeXBlLCBjb25maWcua2V5c0RhdGEgPz8gXCJcIiwgY29uZmlnLmNhY2hlRGF0YSA/PyBcIlwiLCBkYWVtb25VcmksIGRhZW1vblVzZXJuYW1lLCBkYWVtb25QYXNzd29yZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgY29uZmlnLmdldFJlZ3Rlc3QoKSA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBjb25maWcuZ2V0UmVndGVzdCgpLCAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRGdWxsKGNwcEFkZHJlc3MsIGNvbmZpZy5wYXRoLCBjb25maWcucGFzc3dvcmQsIGNvbmZpZy5mcywgcmVqZWN0VW5hdXRob3JpemVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0V2FsbGV0UHJveHkoKTogTW9uZXJvV2FsbGV0RnVsbFByb3h5IHtcbiAgICByZXR1cm4gc3VwZXIuZ2V0V2FsbGV0UHJveHkoKSBhcyBNb25lcm9XYWxsZXRGdWxsUHJveHk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBiYWNrZ3JvdW5kU3luYygpIHtcbiAgICBsZXQgbGFiZWwgPSB0aGlzLnBhdGggPyB0aGlzLnBhdGggOiAodGhpcy5icm93c2VyTWFpblBhdGggPyB0aGlzLmJyb3dzZXJNYWluUGF0aCA6IFwiaW4tbWVtb3J5IHdhbGxldFwiKTsgLy8gbGFiZWwgZm9yIGxvZ1xuICAgIExpYnJhcnlVdGlscy5sb2coMSwgXCJCYWNrZ3JvdW5kIHN5bmNocm9uaXppbmcgXCIgKyBsYWJlbCk7XG4gICAgdHJ5IHsgYXdhaXQgdGhpcy5zeW5jKCk7IH1cbiAgICBjYXRjaCAoZXJyOiBhbnkpIHsgaWYgKCF0aGlzLl9pc0Nsb3NlZCkgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBiYWNrZ3JvdW5kIHN5bmNocm9uaXplIFwiICsgbGFiZWwgKyBcIjogXCIgKyBlcnIubWVzc2FnZSk7IH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIHJlZnJlc2hMaXN0ZW5pbmcoKSB7XG4gICAgaWYgKHRoaXMuX2lzQ2xvc2VkKSByZXR1cm47XG4gICAgbGV0IGlzRW5hYmxlZCA9IHRoaXMubGlzdGVuZXJzLmxlbmd0aCA+IDA7XG4gICAgaWYgKHRoaXMud2FzbUxpc3RlbmVySGFuZGxlID09PSAwICYmICFpc0VuYWJsZWQgfHwgdGhpcy53YXNtTGlzdGVuZXJIYW5kbGUgPiAwICYmIGlzRW5hYmxlZCkgcmV0dXJuOyAvLyBubyBkaWZmZXJlbmNlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5faXNDbG9zZWQpIHJldHVybjtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNldF9saXN0ZW5lcihcbiAgICAgICAgICB0aGlzLmNwcEFkZHJlc3MsXG4gICAgICAgICAgdGhpcy53YXNtTGlzdGVuZXJIYW5kbGUsXG4gICAgICAgICAgICBuZXdMaXN0ZW5lckhhbmRsZSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgbmV3TGlzdGVuZXJIYW5kbGUgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IobmV3TGlzdGVuZXJIYW5kbGUpKTtcbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy53YXNtTGlzdGVuZXJIYW5kbGUgPSBuZXdMaXN0ZW5lckhhbmRsZTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkgPT4gYXdhaXQgdGhpcy53YXNtTGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0KSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vbk5ld0Jsb2NrKGhlaWdodCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAobmV3QmFsYW5jZVN0ciwgbmV3VW5sb2NrZWRCYWxhbmNlU3RyKSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaXNFbmFibGVkID8gYXN5bmMgKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4U3RyLCBzdWJhZGRyZXNzSWR4U3RyLCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgPT4gYXdhaXQgdGhpcy53YXNtTGlzdGVuZXIub25PdXRwdXRTcGVudChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4U3RyLCBzdWJhZGRyZXNzSWR4U3RyLCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgOiB1bmRlZmluZWQsXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgc3RhdGljIHNhbml0aXplQmxvY2soYmxvY2spIHtcbiAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkgTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZVR4V2FsbGV0KHR4KTtcbiAgICByZXR1cm4gYmxvY2s7XG4gIH1cbiAgXG4gIHN0YXRpYyBzYW5pdGl6ZVR4V2FsbGV0KHR4KSB7XG4gICAgYXNzZXJ0KHR4IGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQpO1xuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgc3RhdGljIHNhbml0aXplQWNjb3VudChhY2NvdW50KSB7XG4gICAgaWYgKGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkgTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3Moc3ViYWRkcmVzcyk7XG4gICAgfVxuICAgIHJldHVybiBhY2NvdW50O1xuICB9XG4gIFxuICBzdGF0aWMgZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cikge1xuICAgIGxldCBibG9ja3NKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGJsb2Nrc0pzb25TdHIpKTtcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzOiBhbnkgPSB7fTtcbiAgICBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzID0gW107XG4gICAgaWYgKGJsb2Nrc0pzb24uYmxvY2tzKSBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbi5ibG9ja3MpIGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3MucHVzaChNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQmxvY2sobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9XQUxMRVQpKSk7XG4gICAgcmV0dXJuIGRlc2VyaWFsaXplZEJsb2NrcztcbiAgfVxuICBcbiAgc3RhdGljIGRlc2VyaWFsaXplVHhzKHF1ZXJ5LCBibG9ja3NKc29uU3RyKSB7XG4gICAgXG4gICAgLy8gZGVzZXJpYWxpemUgYmxvY2tzXG4gICAgbGV0IGRlc2VyaWFsaXplZEJsb2NrcyA9IE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cik7XG4gICAgbGV0IGJsb2NrcyA9IGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3M7XG4gICAgXG4gICAgLy8gY29sbGVjdCB0eHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQmxvY2soYmxvY2spO1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgaWYgKGJsb2NrLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7IC8vIGRlcmVmZXJlbmNlIHBsYWNlaG9sZGVyIGJsb2NrIGZvciB1bmNvbmZpcm1lZCB0eHNcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyByZS1zb3J0IHR4cyB3aGljaCBpcyBsb3N0IG92ZXIgd2FzbSBzZXJpYWxpemF0aW9uICAvLyBUT0RPOiBjb25maXJtIHRoYXQgb3JkZXIgaXMgbG9zdFxuICAgIGlmIChxdWVyeS5nZXRIYXNoZXMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgdHhNYXAgPSBuZXcgTWFwKCk7XG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4TWFwW3R4LmdldEhhc2goKV0gPSB0eDtcbiAgICAgIGxldCB0eHNTb3J0ZWQgPSBbXTtcbiAgICAgIGZvciAobGV0IHR4SGFzaCBvZiBxdWVyeS5nZXRIYXNoZXMoKSkgaWYgKHR4TWFwW3R4SGFzaF0gIT09IHVuZGVmaW5lZCkgdHhzU29ydGVkLnB1c2godHhNYXBbdHhIYXNoXSk7XG4gICAgICB0eHMgPSB0eHNTb3J0ZWQ7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZVRyYW5zZmVycyhxdWVyeSwgYmxvY2tzSnNvblN0cikge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIGJsb2Nrc1xuICAgIGxldCBkZXNlcmlhbGl6ZWRCbG9ja3MgPSBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplQmxvY2tzKGJsb2Nrc0pzb25TdHIpO1xuICAgIGxldCBibG9ja3MgPSBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdHJhbnNmZXJzXG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgaWYgKGJsb2NrLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7IC8vIGRlcmVmZXJlbmNlIHBsYWNlaG9sZGVyIGJsb2NrIGZvciB1bmNvbmZpcm1lZCB0eHNcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkKSB0cmFuc2ZlcnMucHVzaCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpO1xuICAgICAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZU91dHB1dHMocXVlcnksIGJsb2Nrc0pzb25TdHIpIHtcbiAgICBcbiAgICAvLyBkZXNlcmlhbGl6ZSBibG9ja3NcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzID0gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZUJsb2NrcyhibG9ja3NKc29uU3RyKTtcbiAgICBsZXQgYmxvY2tzID0gZGVzZXJpYWxpemVkQmxvY2tzLmJsb2NrcztcbiAgICBcbiAgICAvLyBjb2xsZWN0IG91dHB1dHNcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmdldE91dHB1dHMoKSkgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSBwYXRoIG9mIHRoZSB3YWxsZXQgb24gdGhlIGJyb3dzZXIgbWFpbiB0aHJlYWQgaWYgcnVuIGFzIGEgd29ya2VyLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGJyb3dzZXJNYWluUGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCBvbiB0aGUgYnJvd3NlciBtYWluIHRocmVhZFxuICAgKi9cbiAgcHJvdGVjdGVkIHNldEJyb3dzZXJNYWluUGF0aChicm93c2VyTWFpblBhdGgpIHtcbiAgICB0aGlzLmJyb3dzZXJNYWluUGF0aCA9IGJyb3dzZXJNYWluUGF0aDtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIG1vdmVUbyhwYXRoLCB3YWxsZXQpIHtcblxuICAgIC8vIHNhdmUgYW5kIHJldHVybiBpZiBzYW1lIHBhdGhcbiAgICBpZiAoUGF0aC5ub3JtYWxpemUod2FsbGV0LnBhdGgpID09PSBQYXRoLm5vcm1hbGl6ZShwYXRoKSkge1xuICAgICAgcmV0dXJuIHdhbGxldC5zYXZlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKGF3YWl0IHdhbGxldC5pc0Nsb3NlZCgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgY2xvc2VkXCIpO1xuICAgICAgaWYgKCFwYXRoKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgcGF0aCBvZiBkZXN0aW5hdGlvbiB3YWxsZXRcIik7XG5cbiAgICAgIC8vIGNyZWF0ZSBkZXN0aW5hdGlvbiBkaXJlY3RvcnkgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgICAgbGV0IHdhbGxldERpciA9IFBhdGguZGlybmFtZShwYXRoKTtcbiAgICAgIGlmICghYXdhaXQgTGlicmFyeVV0aWxzLmV4aXN0cyh3YWxsZXQuZnMsIHdhbGxldERpcikpIHtcbiAgICAgICAgdHJ5IHsgYXdhaXQgd2FsbGV0LmZzLm1rZGlyKHdhbGxldERpcik7IH1cbiAgICAgICAgY2F0Y2ggKGVycjogYW55KSB7IHRocm93IG5ldyBNb25lcm9FcnJvcihcIkRlc3RpbmF0aW9uIHBhdGggXCIgKyBwYXRoICsgXCIgZG9lcyBub3QgZXhpc3QgYW5kIGNhbm5vdCBiZSBjcmVhdGVkOiBcIiArIGVyci5tZXNzYWdlKTsgfVxuICAgICAgfVxuXG4gICAgICAvLyBnZXQgd2FsbGV0IGRhdGFcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB3YWxsZXQuZ2V0RGF0YSgpO1xuXG4gICAgICAvLyB3cml0ZSB3YWxsZXQgZmlsZXNcbiAgICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aCArIFwiLmtleXNcIiwgZGF0YVswXSwgXCJiaW5hcnlcIik7XG4gICAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGgsIGRhdGFbMV0sIFwiYmluYXJ5XCIpO1xuICAgICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoICsgXCIuYWRkcmVzcy50eHRcIiwgYXdhaXQgd2FsbGV0LmdldFByaW1hcnlBZGRyZXNzKCkpO1xuICAgICAgbGV0IG9sZFBhdGggPSB3YWxsZXQucGF0aDtcbiAgICAgIHdhbGxldC5wYXRoID0gcGF0aDtcblxuICAgICAgLy8gZGVsZXRlIG9sZCB3YWxsZXQgZmlsZXNcbiAgICAgIGlmIChvbGRQYXRoKSB7XG4gICAgICAgIGF3YWl0IHdhbGxldC5mcy51bmxpbmsob2xkUGF0aCArIFwiLmFkZHJlc3MudHh0XCIpO1xuICAgICAgICBhd2FpdCB3YWxsZXQuZnMudW5saW5rKG9sZFBhdGggKyBcIi5rZXlzXCIpO1xuICAgICAgICBhd2FpdCB3YWxsZXQuZnMudW5saW5rKG9sZFBhdGgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgc2F2ZSh3YWxsZXQ6IGFueSkge1xuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIGlmIChhd2FpdCB3YWxsZXQuaXNDbG9zZWQoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIGNsb3NlZFwiKTtcblxuICAgICAgaWYgKCFhd2FpdCB3YWxsZXQuZ2V0UGF0aCgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSB3YWxsZXQgYmVjYXVzZSBwYXRoIGlzIG5vdCBzZXRcIik7XG4gICAgICBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLndyaXRlV2FsbGV0RGF0YSh3YWxsZXQsIGF3YWl0IHdhbGxldC5nZXREYXRhKCksIGF3YWl0IHdhbGxldC5nZXRQcmltYXJ5QWRkcmVzcygpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyB3cml0ZVdhbGxldERhdGEod2FsbGV0OiBhbnksIGRhdGE6IERhdGFWaWV3W10sIHByaW1hcnlBZGRyZXNzOiBzdHJpbmcpIHtcbiAgICBsZXQgcGF0aCA9IHdhbGxldC5wYXRoO1xuICAgIGlmICghcGF0aCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNhdmUgd2FsbGV0IGJlY2F1c2UgcGF0aCBpcyBub3Qgc2V0XCIpO1xuXG4gICAgLy8gd3JpdGUgd2FsbGV0IGZpbGVzIHRvICoubmV3XG4gICAgbGV0IHBhdGhOZXcgPSBwYXRoICsgXCIubmV3XCI7XG4gICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoTmV3ICsgXCIua2V5c1wiLCBkYXRhWzBdLCBcImJpbmFyeVwiKTtcbiAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGhOZXcsIGRhdGFbMV0sIFwiYmluYXJ5XCIpO1xuICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aE5ldyArIFwiLmFkZHJlc3MudHh0XCIsIHByaW1hcnlBZGRyZXNzKTtcblxuICAgIC8vIHJlcGxhY2Ugb2xkIHdhbGxldCBmaWxlcyB3aXRoIG5ld1xuICAgIGF3YWl0IHdhbGxldC5mcy5yZW5hbWUocGF0aE5ldyArIFwiLmtleXNcIiwgcGF0aCArIFwiLmtleXNcIik7XG4gICAgYXdhaXQgd2FsbGV0LmZzLnJlbmFtZShwYXRoTmV3LCBwYXRoKTtcbiAgICBhd2FpdCB3YWxsZXQuZnMucmVuYW1lKHBhdGhOZXcgKyBcIi5hZGRyZXNzLnR4dFwiLCBwYXRoICsgXCIuYWRkcmVzcy50eHRcIik7XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvV2FsbGV0IGJ5IHByb3h5aW5nIHJlcXVlc3RzIHRvIGEgd29ya2VyIHdoaWNoIHJ1bnMgYSBmdWxsIHdhbGxldC5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgTW9uZXJvV2FsbGV0RnVsbFByb3h5IGV4dGVuZHMgTW9uZXJvV2FsbGV0S2V5c1Byb3h5IHtcblxuICAvLyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHBhdGg6IGFueTtcbiAgcHJvdGVjdGVkIGZzOiBhbnk7XG4gIHByb3RlY3RlZCB3cmFwcGVkTGlzdGVuZXJzOiBhbnk7XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBXQUxMRVQgU1RBVElDIFVUSUxTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgc3RhdGljIGFzeW5jIG9wZW5XYWxsZXREYXRhKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG4gICAgbGV0IHdhbGxldElkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgIGlmIChjb25maWcucGFzc3dvcmQgPT09IHVuZGVmaW5lZCkgY29uZmlnLnBhc3N3b3JkID0gXCJcIjtcbiAgICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgICBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHdhbGxldElkLCBcIm9wZW5XYWxsZXREYXRhXCIsIFtjb25maWcucGF0aCwgY29uZmlnLnBhc3N3b3JkLCBjb25maWcubmV0d29ya1R5cGUsIGNvbmZpZy5rZXlzRGF0YSwgY29uZmlnLmNhY2hlRGF0YSwgZGFlbW9uQ29ubmVjdGlvbiA/IGRhZW1vbkNvbm5lY3Rpb24udG9Kc29uKCkgOiB1bmRlZmluZWRdKTtcbiAgICBsZXQgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldEZ1bGxQcm94eSh3YWxsZXRJZCwgYXdhaXQgTGlicmFyeVV0aWxzLmdldFdvcmtlcigpLCBjb25maWcucGF0aCwgY29uZmlnLmdldEZzKCkpO1xuICAgIGlmIChjb25maWcucGF0aCkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0KGNvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpICYmIGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwud2FsbGV0RXhpc3RzKGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRGcygpKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGFscmVhZHkgZXhpc3RzOiBcIiArIGNvbmZpZy5nZXRQYXRoKCkpO1xuICAgIGxldCB3YWxsZXRJZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHdhbGxldElkLCBcImNyZWF0ZVdhbGxldEZ1bGxcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIGxldCB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0RnVsbFByb3h5KHdhbGxldElkLCBhd2FpdCBMaWJyYXJ5VXRpbHMuZ2V0V29ya2VyKCksIGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRGcygpKTtcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSU5TVEFOQ0UgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogSW50ZXJuYWwgY29uc3RydWN0b3Igd2hpY2ggaXMgZ2l2ZW4gYSB3b3JrZXIgdG8gY29tbXVuaWNhdGUgd2l0aCB2aWEgbWVzc2FnZXMuXG4gICAqIFxuICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgbm90IGJlIGNhbGxlZCBleHRlcm5hbGx5IGJ1dCBzaG91bGQgYmUgY2FsbGVkIHRocm91Z2hcbiAgICogc3RhdGljIHdhbGxldCBjcmVhdGlvbiB1dGlsaXRpZXMgaW4gdGhpcyBjbGFzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB3YWxsZXRJZCAtIGlkZW50aWZpZXMgdGhlIHdhbGxldCB3aXRoIHRoZSB3b3JrZXJcbiAgICogQHBhcmFtIHtXb3JrZXJ9IHdvcmtlciAtIHdvcmtlciB0byBjb21tdW5pY2F0ZSB3aXRoIHZpYSBtZXNzYWdlc1xuICAgKi9cbiAgY29uc3RydWN0b3Iod2FsbGV0SWQsIHdvcmtlciwgcGF0aCwgZnMpIHtcbiAgICBzdXBlcih3YWxsZXRJZCwgd29ya2VyKTtcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgIHRoaXMuZnMgPSBmcyA/IGZzIDogKHBhdGggPyBNb25lcm9XYWxsZXRGdWxsLmdldEZzKCkgOiB1bmRlZmluZWQpO1xuICAgIHRoaXMud3JhcHBlZExpc3RlbmVycyA9IFtdO1xuICB9XG5cbiAgZ2V0UGF0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5wYXRoO1xuICB9XG5cbiAgYXN5bmMgZ2V0TmV0d29ya1R5cGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0TmV0d29ya1R5cGVcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldFN1YmFkZHJlc3NMYWJlbFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIFByb21pc2U8dm9pZD47XG4gIH1cbiAgXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JScGNDb25uZWN0aW9uLCBpc1RydXN0ZWQ/KSB7XG4gICAgaWYgKCF1cmlPclJwY0Nvbm5lY3Rpb24pIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2V0RGFlbW9uQ29ubmVjdGlvblwiLCBbdW5kZWZpbmVkLCBpc1RydXN0ZWRdKTtcbiAgICBlbHNlIHtcbiAgICAgIGxldCBjb25uZWN0aW9uID0gIXVyaU9yUnBjQ29ubmVjdGlvbiA/IHVuZGVmaW5lZCA6IHVyaU9yUnBjQ29ubmVjdGlvbiBpbnN0YW5jZW9mIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPyB1cmlPclJwY0Nvbm5lY3Rpb24gOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPclJwY0Nvbm5lY3Rpb24pO1xuICAgICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzZXREYWVtb25Db25uZWN0aW9uXCIsIFtjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRDb25maWcoKSA6IHVuZGVmaW5lZCwgaXNUcnVzdGVkXSk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgaXNEYWVtb25UcnVzdGVkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzRGFlbW9uVHJ1c3RlZFwiKSBhcyBQcm9taXNlPGJvb2xlYW4+O1xuICB9XG5cbiAgYXN5bmMgZ2V0RGFlbW9uQ29ubmVjdGlvbigpIHtcbiAgICBsZXQgcnBjQ29uZmlnID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYWVtb25Db25uZWN0aW9uXCIpO1xuICAgIHJldHVybiBycGNDb25maWcgPyBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbihycGNDb25maWcpIDogdW5kZWZpbmVkO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZFRvRGFlbW9uKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzQ29ubmVjdGVkVG9EYWVtb25cIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc3RvcmVIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UmVzdG9yZUhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0UmVzdG9yZUhlaWdodFwiLCBbcmVzdG9yZUhlaWdodF0pO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGFlbW9uSGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25NYXhQZWVySGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldERhZW1vbk1heFBlZXJIZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodEJ5RGF0ZSh5ZWFyLCBtb250aCwgZGF5KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0SGVpZ2h0QnlEYXRlXCIsIFt5ZWFyLCBtb250aCwgZGF5XSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzRGFlbW9uU3luY2VkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzRGFlbW9uU3luY2VkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0SGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGxldCB3cmFwcGVkTGlzdGVuZXIgPSBuZXcgV2FsbGV0V29ya2VyTGlzdGVuZXIobGlzdGVuZXIsICgpID0+IHRoaXMuX2lzQ2xvc2VkKTtcbiAgICBsZXQgbGlzdGVuZXJJZCA9IHdyYXBwZWRMaXN0ZW5lci5nZXRJZCgpO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uU3luY1Byb2dyZXNzX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vblN5bmNQcm9ncmVzcywgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25OZXdCbG9ja19cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25OZXdCbG9jaywgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25CYWxhbmNlc0NoYW5nZWRfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uQmFsYW5jZXNDaGFuZ2VkLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFJlY2VpdmVkX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFNwZW50X1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbk91dHB1dFNwZW50LCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMucHVzaCh3cmFwcGVkTGlzdGVuZXIpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImFkZExpc3RlbmVyXCIsIFtsaXN0ZW5lcklkXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndyYXBwZWRMaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0TGlzdGVuZXIoKSA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgbGV0IGxpc3RlbmVySWQgPSB0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0SWQoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJyZW1vdmVMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvblN5bmNQcm9ncmVzc19cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk5ld0Jsb2NrX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uQmFsYW5jZXNDaGFuZ2VkX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0UmVjZWl2ZWRfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRTcGVudF9cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggd2FsbGV0XCIpO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcnMoKSB7XG4gICAgbGV0IGxpc3RlbmVycyA9IFtdO1xuICAgIGZvciAobGV0IHdyYXBwZWRMaXN0ZW5lciBvZiB0aGlzLndyYXBwZWRMaXN0ZW5lcnMpIGxpc3RlbmVycy5wdXNoKHdyYXBwZWRMaXN0ZW5lci5nZXRMaXN0ZW5lcigpKTtcbiAgICByZXR1cm4gbGlzdGVuZXJzO1xuICB9XG4gIFxuICBhc3luYyBpc1N5bmNlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc1N5bmNlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc3luYyhsaXN0ZW5lck9yU3RhcnRIZWlnaHQ/OiBNb25lcm9XYWxsZXRMaXN0ZW5lciB8IG51bWJlciwgc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGFsbG93Q29uY3VycmVudENhbGxzID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb1N5bmNSZXN1bHQ+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgcGFyYW1zXG4gICAgc3RhcnRIZWlnaHQgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IHN0YXJ0SGVpZ2h0IDogbGlzdGVuZXJPclN0YXJ0SGVpZ2h0O1xuICAgIGxldCBsaXN0ZW5lciA9IGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyID8gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IDogdW5kZWZpbmVkO1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IE1hdGgubWF4KGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCksIGF3YWl0IHRoaXMuZ2V0UmVzdG9yZUhlaWdodCgpKTtcbiAgICBcbiAgICAvLyByZWdpc3RlciBsaXN0ZW5lciBpZiBnaXZlblxuICAgIGlmIChsaXN0ZW5lcikgYXdhaXQgdGhpcy5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gc3luYyB3YWxsZXQgaW4gd29ya2VyIFxuICAgIGxldCBlcnI7XG4gICAgbGV0IHJlc3VsdDtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3VsdEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInN5bmNcIiwgW3N0YXJ0SGVpZ2h0LCBhbGxvd0NvbmN1cnJlbnRDYWxsc10pO1xuICAgICAgcmVzdWx0ID0gbmV3IE1vbmVyb1N5bmNSZXN1bHQocmVzdWx0SnNvbi5udW1CbG9ja3NGZXRjaGVkLCByZXN1bHRKc29uLnJlY2VpdmVkTW9uZXkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGVyciA9IGU7XG4gICAgfVxuICAgIFxuICAgIC8vIHVucmVnaXN0ZXIgbGlzdGVuZXJcbiAgICBpZiAobGlzdGVuZXIgJiYgIXRoaXMuX2lzQ2xvc2VkKSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBcbiAgICAvLyB0aHJvdyBlcnJvciBvciByZXR1cm5cbiAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RhcnRTeW5jaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgICBcbiAgYXN5bmMgc3RvcFN5bmNpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RvcFN5bmNpbmdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eEhhc2hlcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBoYXNoZXMgdG8gc2NhblwiKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzY2FuVHhzXCIsIFt0eEhhc2hlc10pO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5TcGVudCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJyZXNjYW5TcGVudFwiKTtcbiAgfVxuICAgIFxuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInJlc2NhbkJsb2NrY2hhaW5cIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICAgIHJldHVybiBCaWdJbnQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRCYWxhbmNlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICAgIGxldCB1bmxvY2tlZEJhbGFuY2VTdHIgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFVubG9ja2VkQmFsYW5jZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIHJldHVybiBCaWdJbnQodW5sb2NrZWRCYWxhbmNlU3RyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKSB7XG4gICAgbGV0IGFjY291bnRzID0gW107XG4gICAgZm9yIChsZXQgYWNjb3VudEpzb24gb2YgKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWNjb3VudHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSkpIHtcbiAgICAgIGFjY291bnRzLnB1c2goTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKSk7XG4gICAgfVxuICAgIHJldHVybiBhY2NvdW50cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKSB7XG4gICAgbGV0IGFjY291bnRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBY2NvdW50XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWwpIHtcbiAgICBsZXQgYWNjb3VudEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNyZWF0ZUFjY291bnRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzKSB7XG4gICAgbGV0IHN1YmFkZHJlc3NlcyA9IFtdO1xuICAgIGZvciAobGV0IHN1YmFkZHJlc3NKc29uIG9mIChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFN1YmFkZHJlc3Nlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKSkge1xuICAgICAgc3ViYWRkcmVzc2VzLnB1c2goTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKSk7XG4gICAgfVxuICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeCwgbGFiZWwpIHtcbiAgICBsZXQgc3ViYWRkcmVzc0pzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNyZWF0ZVN1YmFkZHJlc3NcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHhRdWVyeShxdWVyeSk7XG4gICAgbGV0IHJlc3BKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeHNcIiwgW3F1ZXJ5LmdldEJsb2NrKCkudG9Kc29uKCldKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZVR4cyhxdWVyeSwgSlNPTi5zdHJpbmdpZnkoe2Jsb2NrczogcmVzcEpzb24uYmxvY2tzfSkpOyAvLyBpbml0aWFsaXplIHR4cyBmcm9tIGJsb2NrcyBqc29uIHN0cmluZyBUT0RPOiB0aGlzIHN0cmluZ2lmaWVzIHRoZW4gdXRpbGl0eSBwYXJzZXMsIGF2b2lkXG4gIH1cbiAgXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeSkge1xuICAgIHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGxldCBibG9ja0pzb25zID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUcmFuc2ZlcnNcIiwgW3F1ZXJ5LmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVUcmFuc2ZlcnMocXVlcnksIEpTT04uc3RyaW5naWZ5KHtibG9ja3M6IGJsb2NrSnNvbnN9KSk7IC8vIGluaXRpYWxpemUgdHJhbnNmZXJzIGZyb20gYmxvY2tzIGpzb24gc3RyaW5nIFRPRE86IHRoaXMgc3RyaW5naWZpZXMgdGhlbiB1dGlsaXR5IHBhcnNlcywgYXZvaWRcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeSkge1xuICAgIHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZU91dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBsZXQgYmxvY2tKc29ucyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0T3V0cHV0c1wiLCBbcXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkudG9Kc29uKCldKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZU91dHB1dHMocXVlcnksIEpTT04uc3RyaW5naWZ5KHtibG9ja3M6IGJsb2NrSnNvbnN9KSk7IC8vIGluaXRpYWxpemUgdHJhbnNmZXJzIGZyb20gYmxvY2tzIGpzb24gc3RyaW5nIFRPRE86IHRoaXMgc3RyaW5naWZpZXMgdGhlbiB1dGlsaXR5IHBhcnNlcywgYXZvaWRcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJleHBvcnRPdXRwdXRzXCIsIFthbGxdKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaW1wb3J0T3V0cHV0c1wiLCBbb3V0cHV0c0hleF0pO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRLZXlJbWFnZXMoYWxsKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEtleUltYWdlc1wiLCBbYWxsXSkpO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzLCBvZmZzZXQgPSAwKSB7XG4gICAgbGV0IGtleUltYWdlc0pzb24gPSBbXTtcbiAgICBmb3IgKGxldCBrZXlJbWFnZSBvZiBrZXlJbWFnZXMpIGtleUltYWdlc0pzb24ucHVzaChrZXlJbWFnZS50b0pzb24oKSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImltcG9ydEtleUltYWdlc1wiLCBba2V5SW1hZ2VzSnNvbiwgb2Zmc2V0XSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRGdWxsLmdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCkgbm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBmcmVlemVPdXRwdXQoa2V5SW1hZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJmcmVlemVPdXRwdXRcIiwgW2tleUltYWdlXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRoYXdPdXRwdXQoa2V5SW1hZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJ0aGF3T3V0cHV0XCIsIFtrZXlJbWFnZV0pO1xuICB9XG4gIFxuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzT3V0cHV0RnJvemVuXCIsIFtrZXlJbWFnZV0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldERlZmF1bHRGZWVQcmlvcml0eVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZykge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBsZXQgdHhTZXRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjcmVhdGVUeHNcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKS5nZXRUeHMoKTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBPdXRwdXQoY29uZmlnKSB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZyk7XG4gICAgbGV0IHR4U2V0SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic3dlZXBPdXRwdXRcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKS5nZXRUeHMoKVswXTtcbiAgfVxuXG4gIGFzeW5jIHN3ZWVwVW5sb2NrZWQoY29uZmlnKSB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBsZXQgdHhTZXRzSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic3dlZXBVbmxvY2tlZFwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGZvciAobGV0IHR4U2V0SnNvbiBvZiB0eFNldHNKc29uKSBmb3IgKGxldCB0eCBvZiBuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKS5nZXRUeHMoKSkgdHhzLnB1c2godHgpO1xuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwRHVzdChyZWxheSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzd2VlcER1c3RcIiwgW3JlbGF5XSkpLmdldFR4cygpIHx8IFtdO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhcykge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eE1ldGFkYXRhcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykgdHhNZXRhZGF0YXMucHVzaCh0eE9yTWV0YWRhdGEgaW5zdGFuY2VvZiBNb25lcm9UeFdhbGxldCA/IHR4T3JNZXRhZGF0YS5nZXRNZXRhZGF0YSgpIDogdHhPck1ldGFkYXRhKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJyZWxheVR4c1wiLCBbdHhNZXRhZGF0YXNdKTtcbiAgfVxuICBcbiAgYXN5bmMgZGVzY3JpYmVUeFNldCh0eFNldCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkZXNjcmliZVR4U2V0XCIsIFt0eFNldC50b0pzb24oKV0pKTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnblR4cyh1bnNpZ25lZFR4SGV4KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInNpZ25UeHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4cyhzaWduZWRUeEhleCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN1Ym1pdFR4c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlLCBzaWduYXR1cmVUeXBlLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2lnbk1lc3NhZ2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJ2ZXJpZnlNZXNzYWdlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeEtleSh0eEhhc2gpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeEtleVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0NoZWNrVHgoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGVja1R4S2V5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFR4UHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9DaGVja1R4KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2hlY2tUeFByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFNwZW5kUHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiY2hlY2tTcGVuZFByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeCwgYW1vdW50LCBtZXNzYWdlKSB7XG4gICAgdHJ5IHsgcmV0dXJuIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudFwiLCBbYWNjb3VudElkeCwgYW1vdW50LnRvU3RyaW5nKCksIG1lc3NhZ2VdKTsgfVxuICAgIGNhdGNoIChlOiBhbnkpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGUubWVzc2FnZSwgLTEpOyB9XG4gIH1cblxuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgICB0cnkgeyByZXR1cm4gbmV3IE1vbmVyb0NoZWNrUmVzZXJ2ZShhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNoZWNrUmVzZXJ2ZVByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpOyB9XG4gICAgY2F0Y2ggKGU6IGFueSkgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZS5tZXNzYWdlLCAtMSk7IH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhOb3Rlcyh0eEhhc2hlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFR4Tm90ZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VHhOb3Rlcyh0eEhhc2hlcywgbm90ZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRUeE5vdGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXMpIHtcbiAgICBpZiAoIWVudHJ5SW5kaWNlcykgZW50cnlJbmRpY2VzID0gW107XG4gICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICBmb3IgKGxldCBlbnRyeUpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBZGRyZXNzQm9va0VudHJpZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSkge1xuICAgICAgZW50cmllcy5wdXNoKG5ldyBNb25lcm9BZGRyZXNzQm9va0VudHJ5KGVudHJ5SnNvbikpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzLCBkZXNjcmlwdGlvbikge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImFkZEFkZHJlc3NCb29rRW50cnlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXgsIHNldEFkZHJlc3MsIGFkZHJlc3MsIHNldERlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbikge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImVkaXRBZGRyZXNzQm9va0VudHJ5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkZWxldGVBZGRyZXNzQm9va0VudHJ5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRhZ0FjY291bnRzKHRhZywgYWNjb3VudEluZGljZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJ0YWdBY2NvdW50c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG5cbiAgYXN5bmMgdW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInVudGFnQWNjb3VudHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWNjb3VudFRhZ3NcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWcsIGxhYmVsKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0QWNjb3VudFRhZ0xhYmVsXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBheW1lbnRVcmkoY29uZmlnKSB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFBheW1lbnRVcmlcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICB9XG4gIFxuICBhc3luYyBwYXJzZVBheW1lbnRVcmkodXJpKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeENvbmZpZyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInBhcnNlUGF5bWVudFVyaVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QXR0cmlidXRlKGtleSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldEF0dHJpYnV0ZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzZXRBdHRyaWJ1dGUoa2V5LCB2YWwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRBdHRyaWJ1dGVcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcobnVtVGhyZWFkcywgYmFja2dyb3VuZE1pbmluZywgaWdub3JlQmF0dGVyeSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN0YXJ0TWluaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RvcE1pbmluZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnSW1wb3J0TmVlZGVkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzTXVsdGlzaWdJbXBvcnROZWVkZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNNdWx0aXNpZ1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TXVsdGlzaWdJbmZvKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdJbmZvKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0TXVsdGlzaWdJbmZvXCIpKTtcbiAgfVxuICBcbiAgYXN5bmMgcHJlcGFyZU11bHRpc2lnKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInByZXBhcmVNdWx0aXNpZ1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgbWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJtYWtlTXVsdGlzaWdcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlcywgcGFzc3dvcmQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImV4Y2hhbmdlTXVsdGlzaWdLZXlzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRNdWx0aXNpZ0hleCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJleHBvcnRNdWx0aXNpZ0hleFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlcywgcmVmcmVzaEFmdGVySW1wb3J0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaW1wb3J0TXVsdGlzaWdIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2lnbk11bHRpc2lnVHhIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN1Ym1pdE11bHRpc2lnVHhIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYXRhXCIpO1xuICB9XG4gIFxuICBhc3luYyBtb3ZlVG8ocGF0aCkge1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLm1vdmVUbyhwYXRoLCB0aGlzKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkKSB7XG4gICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGFuZ2VQYXNzd29yZFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIGlmICh0aGlzLnBhdGgpIGF3YWl0IHRoaXMuc2F2ZSgpOyAvLyBhdXRvIHNhdmVcbiAgfVxuICBcbiAgYXN5bmMgc2F2ZSgpIHtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYXZlKHRoaXMpO1xuICB9XG5cbiAgYXN5bmMgaXNDbG9zZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzQ2xvc2VkIHx8IHN1cGVyLmlzQ2xvc2VkKCk7XG4gIH1cblxuICBhc3luYyBjbG9zZShzYXZlKSB7XG4gICAgdGhpcy5faXNDbG9zZWQgPSB0cnVlO1xuICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwicHJlcGFyZUNsb3NlXCIpO1xuICAgIGlmIChzYXZlKSB7XG4gICAgICBhd2FpdCBMaWJyYXJ5VXRpbHMucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qgc25hcHNob3QgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldENsb3NlRGF0YVwiKTtcbiAgICAgICAgYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC53cml0ZVdhbGxldERhdGEodGhpcywgc25hcHNob3QuZGF0YSwgc25hcHNob3QucHJpbWFyeUFkZHJlc3MpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGF3YWl0IHN1cGVyLmNsb3NlKGZhbHNlKTtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMubGVuZ3RoID0gMDtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBMSVNURU5JTkcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8qKlxuICogUmVjZWl2ZXMgbm90aWZpY2F0aW9ucyBkaXJlY3RseSBmcm9tIHdhc20gYysrLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRXYXNtTGlzdGVuZXIge1xuXG4gIHByb3RlY3RlZCB3YWxsZXQ6IE1vbmVyb1dhbGxldDtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIHRoaXMud2FsbGV0ID0gd2FsbGV0O1xuICB9XG4gIFxuICBhc3luYyBvblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VTeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VOZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIHtcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFJlY2VpdmVkKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgcmVjZWl2ZWQgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKTtcbiAgICBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludChhbW91bnRTdHIpKTtcbiAgICBvdXRwdXQuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgoc3ViYWRkcmVzc0lkeCk7XG4gICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgdHguc2V0SGFzaCh0eEhhc2gpO1xuICAgIHR4LnNldFZlcnNpb24odmVyc2lvbik7XG4gICAgdHguc2V0VW5sb2NrVGltZSh1bmxvY2tUaW1lKTtcbiAgICBvdXRwdXQuc2V0VHgodHgpO1xuICAgIHR4LnNldE91dHB1dHMoW291dHB1dF0pO1xuICAgIHR4LnNldElzSW5jb21pbmcodHJ1ZSk7XG4gICAgdHguc2V0SXNMb2NrZWQoaXNMb2NrZWQpO1xuICAgIGlmIChoZWlnaHQgPiAwKSB7XG4gICAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRIZWlnaHQoaGVpZ2h0KTtcbiAgICAgIGJsb2NrLnNldFR4cyhbdHggYXMgTW9uZXJvVHhdKTtcbiAgICAgIHR4LnNldEJsb2NrKGJsb2NrKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gYW5ub3VuY2Ugb3V0cHV0XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFNwZW50KGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHhTdHIsIHN1YmFkZHJlc3NJZHhTdHIsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgc3BlbnQgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKTtcbiAgICBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludChhbW91bnRTdHIpKTtcbiAgICBpZiAoYWNjb3VudElkeFN0cikgb3V0cHV0LnNldEFjY291bnRJbmRleChwYXJzZUludChhY2NvdW50SWR4U3RyKSk7XG4gICAgaWYgKHN1YmFkZHJlc3NJZHhTdHIpIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgocGFyc2VJbnQoc3ViYWRkcmVzc0lkeFN0cikpO1xuICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIHR4LnNldEhhc2godHhIYXNoKTtcbiAgICB0eC5zZXRWZXJzaW9uKHZlcnNpb24pO1xuICAgIHR4LnNldFVubG9ja1RpbWUodW5sb2NrVGltZSk7XG4gICAgdHguc2V0SXNMb2NrZWQoaXNMb2NrZWQpO1xuICAgIG91dHB1dC5zZXRUeCh0eCk7XG4gICAgdHguc2V0SW5wdXRzKFtvdXRwdXRdKTtcbiAgICBpZiAoaGVpZ2h0ID4gMCkge1xuICAgICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KGhlaWdodCk7XG4gICAgICBibG9jay5zZXRUeHMoW3R4XSk7XG4gICAgICB0eC5zZXRCbG9jayhibG9jayk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIGFubm91bmNlIG91dHB1dFxuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlT3V0cHV0U3BlbnQob3V0cHV0KTtcbiAgfVxufVxuXG4vKipcbiAqIEludGVybmFsIGxpc3RlbmVyIHRvIGJyaWRnZSBub3RpZmljYXRpb25zIHRvIGV4dGVybmFsIGxpc3RlbmVycy5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgV2FsbGV0V29ya2VyTGlzdGVuZXIge1xuXG4gIHByb3RlY3RlZCBpZDogYW55O1xuICBwcm90ZWN0ZWQgbGlzdGVuZXI6IGFueTtcbiAgcHJvdGVjdGVkIGlzQ2xvc2VkOiAoKSA9PiBib29sZWFuO1xuICBcbiAgY29uc3RydWN0b3IobGlzdGVuZXIsIGlzQ2xvc2VkKSB7XG4gICAgdGhpcy5pZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gICAgdGhpcy5pc0Nsb3NlZCA9IGlzQ2xvc2VkO1xuICB9XG4gIFxuICBnZXRJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pZDtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXI7XG4gIH1cbiAgXG4gIG9uU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpIHtcbiAgICBpZiAodGhpcy5pc0Nsb3NlZCgpKSByZXR1cm47XG4gICAgdGhpcy5saXN0ZW5lci5vblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKTtcbiAgfVxuXG4gIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7XG4gICAgaWYgKHRoaXMuaXNDbG9zZWQoKSkgcmV0dXJuO1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25OZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIHtcbiAgICBpZiAodGhpcy5pc0Nsb3NlZCgpKSByZXR1cm47XG4gICAgYXdhaXQgdGhpcy5saXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZChCaWdJbnQobmV3QmFsYW5jZVN0ciksIEJpZ0ludChuZXdVbmxvY2tlZEJhbGFuY2VTdHIpKTtcbiAgfVxuXG4gIGFzeW5jIG9uT3V0cHV0UmVjZWl2ZWQoYmxvY2tKc29uKSB7XG4gICAgaWYgKHRoaXMuaXNDbG9zZWQoKSkgcmV0dXJuO1xuICAgIGxldCBibG9jayA9IG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfV0FMTEVUKTtcbiAgICBhd2FpdCB0aGlzLmxpc3RlbmVyLm9uT3V0cHV0UmVjZWl2ZWQoYmxvY2suZ2V0VHhzKClbMF0uZ2V0T3V0cHV0cygpWzBdKTtcbiAgfVxuICBcbiAgYXN5bmMgb25PdXRwdXRTcGVudChibG9ja0pzb24pIHtcbiAgICBpZiAodGhpcy5pc0Nsb3NlZCgpKSByZXR1cm47XG4gICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9XQUxMRVQpO1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25PdXRwdXRTcGVudChibG9jay5nZXRUeHMoKVswXS5nZXRJbnB1dHMoKVswXSk7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLEtBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFNBQUEs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