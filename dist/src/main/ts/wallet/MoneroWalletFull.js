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

    // set connection in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.set_daemon_connection(this.cppAddress, uri, username, password, proxyUri, isTrustedArg, (resp) => {
          if (resp) return reject(new _MoneroError.default(resp));
          this.rejectUnauthorized = rejectUnauthorized; // persist locally
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
      if (accountsStr.charAt(0) !== '{') throw new _MoneroError.default(accountsStr);
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
      if (subaddressStr.charAt(0) !== '{') throw new _MoneroError.default(subaddressStr);
      let subaddressJson = JSON.parse(_GenUtils.default.stringifyBigInts(subaddressStr));
      return _MoneroWalletKeys.MoneroWalletKeys.sanitizeSubaddress(new _MoneroSubaddress.default(subaddressJson));
    });
  }

  async setSubaddressLabel(accountIdx, subaddressIdx, label) {
    if (this.getWalletProxy()) return this.getWalletProxy().setSubaddressLabel(accountIdx, subaddressIdx, label);
    if (label === undefined) label = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let errMsg = this.module.set_subaddress_label(this.cppAddress, accountIdx, subaddressIdx, label);
      if (errMsg) throw new _MoneroError.default(errMsg);
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
      let resp = this.module.describe_tx_set(this.cppAddress, JSON.stringify(txSet.toJson()));
      if (resp.charAt(0) !== '{') throw new _MoneroError.default(resp);
      return new _MoneroTxSet.default(JSON.parse(_GenUtils.default.stringifyBigInts(resp)));
    });
  }

  async signTxs(unsignedTxHex) {
    if (this.getWalletProxy()) return this.getWalletProxy().signTxs(unsignedTxHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.sign_txs(this.cppAddress, unsignedTxHex);
      if (resp.charAt(0) !== '{') throw new _MoneroError.default(resp);
      return new _MoneroTxSet.default(JSON.parse(_GenUtils.default.stringifyBigInts(resp)));
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
      let signature = this.module.sign_message(this.cppAddress, message, signatureType === _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY ? 0 : 1, accountIdx, subaddressIdx);
      let errorKey = "error: ";
      if (signature.indexOf(errorKey) === 0) throw new _MoneroError.default(signature.substring(errorKey.length));
      return signature;
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
      let txKey = this.module.get_tx_key(this.cppAddress, txHash);
      let errorKey = "error: ";
      if (txKey.indexOf(errorKey) === 0) throw new _MoneroError.default(txKey.substring(errorKey.length));
      return txKey;
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
      let resp = this.module.get_tx_notes(this.cppAddress, JSON.stringify({ txHashes: txHashes }));
      if (resp.charAt(0) !== '{') throw new _MoneroError.default(resp);
      return JSON.parse(resp).txNotes;
    });
  }

  async setTxNotes(txHashes, notes) {
    if (this.getWalletProxy()) return this.getWalletProxy().setTxNotes(txHashes, notes);
    notes = notes.map((note) => _GenUtils.default.isInitialized(note) ? note : ""); // the bridge would store json null as text
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let errMsg = this.module.set_tx_notes(this.cppAddress, JSON.stringify({ txHashes: txHashes, txNotes: notes }));
      if (errMsg) throw new _MoneroError.default(errMsg);
    });
  }

  async getAddressBookEntries(entryIndices) {
    if (this.getWalletProxy()) return this.getWalletProxy().getAddressBookEntries(entryIndices);
    if (!entryIndices) entryIndices = [];
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let entries = [];
      let resp = this.module.get_address_book_entries(this.cppAddress, JSON.stringify({ entryIndices: entryIndices }));
      if (resp.charAt(0) !== '{') throw new _MoneroError.default(resp);
      for (let entryJson of JSON.parse(resp).entries) {
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
      let resp = this.module.add_address_book_entry(this.cppAddress, address, description);
      if (typeof resp === "string") throw new _MoneroError.default(resp);
      return resp;
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
      let errMsg = this.module.edit_address_book_entry(this.cppAddress, index, setAddress, address, setDescription, description);
      if (errMsg) throw new _MoneroError.default(errMsg);
    });
  }

  async deleteAddressBookEntry(entryIdx) {
    if (this.getWalletProxy()) return this.getWalletProxy().deleteAddressBookEntry(entryIdx);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let errMsg = this.module.delete_address_book_entry(this.cppAddress, entryIdx);
      if (errMsg) throw new _MoneroError.default(errMsg);
    });
  }

  async tagAccounts(tag, accountIndices) {
    if (this.getWalletProxy()) return this.getWalletProxy().tagAccounts(tag, accountIndices);
    if (!tag) tag = "";
    if (!accountIndices) accountIndices = [];
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let errMsg = this.module.tag_accounts(this.cppAddress, JSON.stringify({ tag: tag, accountIndices: accountIndices }));
      if (errMsg) throw new _MoneroError.default(errMsg);
    });
  }

  async untagAccounts(accountIndices) {
    if (this.getWalletProxy()) return this.getWalletProxy().untagAccounts(accountIndices);
    if (!accountIndices) accountIndices = [];
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let errMsg = this.module.untag_accounts(this.cppAddress, JSON.stringify({ accountIndices: accountIndices }));
      if (errMsg) throw new _MoneroError.default(errMsg);
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
      let errMsg = this.module.set_account_tag_label(this.cppAddress, tag, label);
      if (errMsg) throw new _MoneroError.default(errMsg);
    });
  }

  async getPaymentUri(config) {
    if (this.getWalletProxy()) return this.getWalletProxy().getPaymentUri(config);
    config = _MoneroWallet.default.normalizeCreateTxsConfig(config);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let uri = this.module.get_payment_uri(this.cppAddress, JSON.stringify(config.toJson()));
      let errorKey = "error: ";
      if (uri.indexOf(errorKey) === 0) throw new _MoneroError.default(uri.substring(errorKey.length));
      return uri;
    });
  }

  async parsePaymentUri(uri) {
    if (this.getWalletProxy()) return this.getWalletProxy().parsePaymentUri(uri);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {
        let resp = this.module.parse_payment_uri(this.cppAddress, uri);
        if (resp.charAt(0) !== '{') throw new _MoneroError.default(resp);
        return new _MoneroTxConfig.default(JSON.parse(_GenUtils.default.stringifyBigInts(resp)));
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
      let multisigHex = this.module.prepare_multisig(this.cppAddress);
      let errorKey = "error: ";
      if (multisigHex.indexOf(errorKey) === 0) throw new _MoneroError.default(multisigHex.substring(errorKey.length));
      return multisigHex;
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
      let multisigHex = this.module.export_multisig_hex(this.cppAddress);
      let errorKey = "error: ";
      if (multisigHex.indexOf(errorKey) === 0) throw new _MoneroError.default(multisigHex.substring(errorKey.length));
      return multisigHex;
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
    await _LibraryUtils.default.invokeWorker(walletId, "openWalletData", [config.path, config.password, config.networkType, config.keysData, config.cacheData, daemonConnection ? daemonConnection.toJson() : undefined, config.getRegtest()]);
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
    let accountTags = [];
    for (let accountTagJson of await this.invokeWorker("getAccountTags", Array.from(arguments))) {
      accountTags.push(new _MoneroAccountTag.default(accountTagJson));
    }
    return accountTags;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfcGF0aCIsIl9HZW5VdGlscyIsIl9MaWJyYXJ5VXRpbHMiLCJfVGFza0xvb3BlciIsIl9Nb25lcm9BY2NvdW50IiwiX01vbmVyb0FjY291bnRUYWciLCJfTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJfTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQiLCJfTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1JwY0Nvbm5lY3Rpb24iLCJfTW9uZXJvU3ViYWRkcmVzcyIsIl9Nb25lcm9TeW5jUmVzdWx0IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4U2V0IiwiX01vbmVyb1R4V2FsbGV0IiwiX01vbmVyb1dhbGxldCIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRMaXN0ZW5lciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiX2ZzIiwiTW9uZXJvV2FsbGV0RnVsbCIsIk1vbmVyb1dhbGxldEtleXMiLCJERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIiwic3luY0NhbGxzIiwiU2V0IiwiY29uc3RydWN0b3IiLCJjcHBBZGRyZXNzIiwicGF0aCIsInBhc3N3b3JkIiwiZnMiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJyZWplY3RVbmF1dGhvcml6ZWRGbklkIiwid2FsbGV0UHJveHkiLCJsaXN0ZW5lcnMiLCJnZXRGcyIsInVuZGVmaW5lZCIsIl9pc0Nsb3NlZCIsIndhc21MaXN0ZW5lciIsIldhbGxldFdhc21MaXN0ZW5lciIsIndhc21MaXN0ZW5lckhhbmRsZSIsInJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkIiwic3luY1BlcmlvZEluTXMiLCJMaWJyYXJ5VXRpbHMiLCJzZXRSZWplY3RVbmF1dGhvcml6ZWRGbiIsIndhbGxldEV4aXN0cyIsImFzc2VydCIsIk1vbmVyb0Vycm9yIiwiZXhpc3RzIiwibG9nIiwib3BlbldhbGxldCIsImNvbmZpZyIsIk1vbmVyb1dhbGxldENvbmZpZyIsImdldFByb3h5VG9Xb3JrZXIiLCJzZXRQcm94eVRvV29ya2VyIiwiZ2V0U2VlZCIsImdldFNlZWRPZmZzZXQiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0UmVzdG9yZUhlaWdodCIsImdldExhbmd1YWdlIiwiZ2V0U2F2ZUN1cnJlbnQiLCJzZXRGcyIsImdldENvbm5lY3Rpb25NYW5hZ2VyIiwiZ2V0U2VydmVyIiwic2V0U2VydmVyIiwiZ2V0Q29ubmVjdGlvbiIsImdldEtleXNEYXRhIiwiZ2V0UGF0aCIsInNldEtleXNEYXRhIiwicmVhZEZpbGUiLCJzZXRDYWNoZURhdGEiLCJ3YWxsZXQiLCJvcGVuV2FsbGV0RGF0YSIsImdldElzVHJ1c3RlZERhZW1vbiIsInNldERhZW1vbkNvbm5lY3Rpb24iLCJzZXRDb25uZWN0aW9uTWFuYWdlciIsImNyZWF0ZVdhbGxldCIsImdldE5ldHdvcmtUeXBlIiwiTW9uZXJvTmV0d29ya1R5cGUiLCJ2YWxpZGF0ZSIsInNldFBhdGgiLCJnZXRQYXNzd29yZCIsInNldFBhc3N3b3JkIiwiTW9uZXJvV2FsbGV0RnVsbFByb3h5IiwiY3JlYXRlV2FsbGV0RnJvbVNlZWQiLCJjcmVhdGVXYWxsZXRGcm9tS2V5cyIsImNyZWF0ZVdhbGxldFJhbmRvbSIsImRhZW1vbkNvbm5lY3Rpb24iLCJnZXRSZWplY3RVbmF1dGhvcml6ZWQiLCJzZXRSZXN0b3JlSGVpZ2h0Iiwic2V0U2VlZE9mZnNldCIsIm1vZHVsZSIsImxvYWRXYXNtTW9kdWxlIiwicXVldWVUYXNrIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJHZW5VdGlscyIsImdldFVVSUQiLCJjcmVhdGVfZnVsbF93YWxsZXQiLCJKU09OIiwic3RyaW5naWZ5IiwidG9Kc29uIiwic2F2ZSIsInNldFByaW1hcnlBZGRyZXNzIiwic2V0UHJpdmF0ZVZpZXdLZXkiLCJzZXRQcml2YXRlU3BlbmRLZXkiLCJzZXRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJwYXJzZSIsImdldF9rZXlzX3dhbGxldF9zZWVkX2xhbmd1YWdlcyIsImxhbmd1YWdlcyIsIkZTIiwicHJvbWlzZXMiLCJnZXREYWVtb25NYXhQZWVySGVpZ2h0IiwiZ2V0V2FsbGV0UHJveHkiLCJhc3NlcnROb3RDbG9zZWQiLCJnZXRfZGFlbW9uX21heF9wZWVyX2hlaWdodCIsInJlc3AiLCJpc0RhZW1vblN5bmNlZCIsImlzX2RhZW1vbl9zeW5jZWQiLCJpc1N5bmNlZCIsImlzX3N5bmNlZCIsImdldF9uZXR3b3JrX3R5cGUiLCJnZXRfcmVzdG9yZV9oZWlnaHQiLCJyZXN0b3JlSGVpZ2h0Iiwic2V0X3Jlc3RvcmVfaGVpZ2h0IiwibW92ZVRvIiwiYWRkTGlzdGVuZXIiLCJsaXN0ZW5lciIsInJlZnJlc2hMaXN0ZW5pbmciLCJyZW1vdmVMaXN0ZW5lciIsImdldExpc3RlbmVycyIsImNvbm5lY3Rpb25NYW5hZ2VyIiwidXJpT3JDb25uZWN0aW9uIiwiaXNUcnVzdGVkIiwiY29ubmVjdGlvbiIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJ1cmkiLCJnZXRVcmkiLCJ1c2VybmFtZSIsImdldFVzZXJuYW1lIiwicHJveHlVcmkiLCJnZXRQcm94eVVyaSIsImlzVHJ1c3RlZEFyZyIsInNldF9kYWVtb25fY29ubmVjdGlvbiIsImlzRGFlbW9uVHJ1c3RlZCIsImlzX2RhZW1vbl90cnVzdGVkIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImNvbm5lY3Rpb25Db250YWluZXJTdHIiLCJnZXRfZGFlbW9uX2Nvbm5lY3Rpb24iLCJqc29uQ29ubmVjdGlvbiIsImlzQ29ubmVjdGVkVG9EYWVtb24iLCJpc19jb25uZWN0ZWRfdG9fZGFlbW9uIiwiZ2V0VmVyc2lvbiIsImdldEludGVncmF0ZWRBZGRyZXNzIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwicmVzdWx0IiwiZ2V0X2ludGVncmF0ZWRfYWRkcmVzcyIsImNoYXJBdCIsIk1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwiZXJyIiwibWVzc2FnZSIsImluY2x1ZGVzIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbnRlZ3JhdGVkQWRkcmVzcyIsImRlY29kZV9pbnRlZ3JhdGVkX2FkZHJlc3MiLCJnZXRIZWlnaHQiLCJnZXRfaGVpZ2h0IiwiZ2V0RGFlbW9uSGVpZ2h0IiwiZ2V0X2RhZW1vbl9oZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJnZXRfaGVpZ2h0X2J5X2RhdGUiLCJzeW5jIiwibGlzdGVuZXJPclN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJhbGxvd0NvbmN1cnJlbnRDYWxscyIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwiTWF0aCIsIm1heCIsInRoYXQiLCJzeW5jV2FzbSIsInJlc29sdmVDYWxsIiwicmVqZWN0Q2FsbCIsImNhbGwiLCJhZGQiLCJyZXNwSnNvbiIsIk1vbmVyb1N5bmNSZXN1bHQiLCJudW1CbG9ja3NGZXRjaGVkIiwicmVjZWl2ZWRNb25leSIsImZpbmFsbHkiLCJkZWxldGUiLCJlIiwic3RhcnRTeW5jaW5nIiwic3luY0xvb3BlciIsIlRhc2tMb29wZXIiLCJiYWNrZ3JvdW5kU3luYyIsInN0YXJ0Iiwic3RvcFN5bmNpbmciLCJzdG9wIiwic3RvcF9zeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwic2Nhbl90eHMiLCJyZXNjYW5TcGVudCIsInJlc2Nhbl9zcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJyZXNjYW5fYmxvY2tjaGFpbiIsImdldEJhbGFuY2UiLCJhY2NvdW50SWR4Iiwic3ViYWRkcmVzc0lkeCIsImJhbGFuY2VTdHIiLCJnZXRfYmFsYW5jZV93YWxsZXQiLCJnZXRfYmFsYW5jZV9hY2NvdW50IiwiZ2V0X2JhbGFuY2Vfc3ViYWRkcmVzcyIsIkJpZ0ludCIsInN0cmluZ2lmeUJpZ0ludHMiLCJiYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwidW5sb2NrZWRCYWxhbmNlU3RyIiwiZ2V0X3VubG9ja2VkX2JhbGFuY2Vfd2FsbGV0IiwiZ2V0X3VubG9ja2VkX2JhbGFuY2VfYWNjb3VudCIsImdldF91bmxvY2tlZF9iYWxhbmNlX3N1YmFkZHJlc3MiLCJ1bmxvY2tlZEJhbGFuY2UiLCJnZXRBY2NvdW50cyIsImluY2x1ZGVTdWJhZGRyZXNzZXMiLCJ0YWciLCJhY2NvdW50c1N0ciIsImdldF9hY2NvdW50cyIsImFjY291bnRzIiwiYWNjb3VudEpzb24iLCJwdXNoIiwic2FuaXRpemVBY2NvdW50IiwiTW9uZXJvQWNjb3VudCIsImdldEFjY291bnQiLCJhY2NvdW50U3RyIiwiZ2V0X2FjY291bnQiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJjcmVhdGVfYWNjb3VudCIsImdldFN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwiYXJncyIsImxpc3RpZnkiLCJzdWJhZGRyZXNzZXNKc29uIiwiZ2V0X3N1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NKc29uIiwic2FuaXRpemVTdWJhZGRyZXNzIiwiTW9uZXJvU3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJzdWJhZGRyZXNzU3RyIiwiY3JlYXRlX3N1YmFkZHJlc3MiLCJzZXRTdWJhZGRyZXNzTGFiZWwiLCJlcnJNc2ciLCJzZXRfc3ViYWRkcmVzc19sYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwicXVlcnlOb3JtYWxpemVkIiwiTW9uZXJvV2FsbGV0Iiwibm9ybWFsaXplVHhRdWVyeSIsImdldF90eHMiLCJnZXRCbG9jayIsImJsb2Nrc0pzb25TdHIiLCJkZXNlcmlhbGl6ZVR4cyIsImdldFRyYW5zZmVycyIsIm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkiLCJnZXRfdHJhbnNmZXJzIiwiZ2V0VHhRdWVyeSIsImRlc2VyaWFsaXplVHJhbnNmZXJzIiwiZ2V0T3V0cHV0cyIsIm5vcm1hbGl6ZU91dHB1dFF1ZXJ5IiwiZ2V0X291dHB1dHMiLCJkZXNlcmlhbGl6ZU91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwiZXhwb3J0X291dHB1dHMiLCJvdXRwdXRzSGV4IiwiaW1wb3J0T3V0cHV0cyIsImltcG9ydF9vdXRwdXRzIiwibnVtSW1wb3J0ZWQiLCJleHBvcnRLZXlJbWFnZXMiLCJleHBvcnRfa2V5X2ltYWdlcyIsInJlc3VsdFN0ciIsInJlc3VsdEpzb24iLCJrZXlJbWFnZXMiLCJNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCIsImltcG9ydEtleUltYWdlcyIsIm9mZnNldCIsImltcG9ydF9rZXlfaW1hZ2VzIiwibWFwIiwia2V5SW1hZ2UiLCJrZXlJbWFnZUltcG9ydFJlc3VsdFN0ciIsIk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IiwiZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQiLCJmcmVlemVPdXRwdXQiLCJmcmVlemVfb3V0cHV0IiwidGhhd091dHB1dCIsInRoYXdfb3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJpc19vdXRwdXRfZnJvemVuIiwiZ2V0RGVmYXVsdEZlZVByaW9yaXR5IiwiZ2V0X2RlZmF1bHRfZmVlX3ByaW9yaXR5IiwiY3JlYXRlVHhzIiwiY29uZmlnTm9ybWFsaXplZCIsIm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyIsImdldENhblNwbGl0Iiwic2V0Q2FuU3BsaXQiLCJjcmVhdGVfdHhzIiwidHhTZXRKc29uU3RyIiwiTW9uZXJvVHhTZXQiLCJzd2VlcE91dHB1dCIsIm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnIiwic3dlZXBfb3V0cHV0Iiwic3dlZXBVbmxvY2tlZCIsIm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWciLCJzd2VlcF91bmxvY2tlZCIsInR4U2V0c0pzb24iLCJ0eFNldHMiLCJ0eFNldEpzb24iLCJ0eHMiLCJ0eFNldCIsInR4Iiwic3dlZXBEdXN0IiwicmVsYXkiLCJzd2VlcF9kdXN0Iiwic2V0VHhzIiwicmVsYXlUeHMiLCJ0eHNPck1ldGFkYXRhcyIsIkFycmF5IiwiaXNBcnJheSIsInR4TWV0YWRhdGFzIiwidHhPck1ldGFkYXRhIiwiTW9uZXJvVHhXYWxsZXQiLCJnZXRNZXRhZGF0YSIsInJlbGF5X3R4cyIsInR4SGFzaGVzSnNvbiIsImRlc2NyaWJlVHhTZXQiLCJ1bnNpZ25lZFR4SGV4IiwiZ2V0VW5zaWduZWRUeEhleCIsInNpZ25lZFR4SGV4IiwiZ2V0U2lnbmVkVHhIZXgiLCJtdWx0aXNpZ1R4SGV4IiwiZ2V0TXVsdGlzaWdUeEhleCIsImRlc2NyaWJlX3R4X3NldCIsInNpZ25UeHMiLCJzaWduX3R4cyIsInN1Ym1pdFR4cyIsInN1Ym1pdF90eHMiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIlNJR05fV0lUSF9TUEVORF9LRVkiLCJzaWduYXR1cmUiLCJzaWduX21lc3NhZ2UiLCJlcnJvcktleSIsImluZGV4T2YiLCJzdWJzdHJpbmciLCJsZW5ndGgiLCJ2ZXJpZnlNZXNzYWdlIiwiYWRkcmVzcyIsInZlcmlmeV9tZXNzYWdlIiwiaXNHb29kIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCIsImlzT2xkIiwiU0lHTl9XSVRIX1ZJRVdfS0VZIiwidmVyc2lvbiIsImdldFR4S2V5IiwidHhIYXNoIiwidHhLZXkiLCJnZXRfdHhfa2V5IiwiY2hlY2tUeEtleSIsImNoZWNrX3R4X2tleSIsInJlc3BKc29uU3RyIiwiTW9uZXJvQ2hlY2tUeCIsImdldFR4UHJvb2YiLCJnZXRfdHhfcHJvb2YiLCJjaGVja1R4UHJvb2YiLCJjaGVja190eF9wcm9vZiIsImdldFNwZW5kUHJvb2YiLCJnZXRfc3BlbmRfcHJvb2YiLCJjaGVja1NwZW5kUHJvb2YiLCJjaGVja19zcGVuZF9wcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldF9yZXNlcnZlX3Byb29mX3dhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJhbW91bnQiLCJnZXRfcmVzZXJ2ZV9wcm9vZl9hY2NvdW50IiwidG9TdHJpbmciLCJjaGVja1Jlc2VydmVQcm9vZiIsImNoZWNrX3Jlc2VydmVfcHJvb2YiLCJNb25lcm9DaGVja1Jlc2VydmUiLCJnZXRUeE5vdGVzIiwiZ2V0X3R4X25vdGVzIiwidHhOb3RlcyIsInNldFR4Tm90ZXMiLCJub3RlcyIsIm5vdGUiLCJpc0luaXRpYWxpemVkIiwic2V0X3R4X25vdGVzIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiZW50cmllcyIsImdldF9hZGRyZXNzX2Jvb2tfZW50cmllcyIsImVudHJ5SnNvbiIsIk1vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZGVzY3JpcHRpb24iLCJhZGRfYWRkcmVzc19ib29rX2VudHJ5IiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJpbmRleCIsInNldEFkZHJlc3MiLCJzZXREZXNjcmlwdGlvbiIsImVkaXRfYWRkcmVzc19ib29rX2VudHJ5IiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwiZGVsZXRlX2FkZHJlc3NfYm9va19lbnRyeSIsInRhZ0FjY291bnRzIiwiYWNjb3VudEluZGljZXMiLCJ0YWdfYWNjb3VudHMiLCJ1bnRhZ0FjY291bnRzIiwidW50YWdfYWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsImFjY291bnRUYWdzIiwiYWNjb3VudFRhZ0pzb24iLCJnZXRfYWNjb3VudF90YWdzIiwiTW9uZXJvQWNjb3VudFRhZyIsInNldEFjY291bnRUYWdMYWJlbCIsInNldF9hY2NvdW50X3RhZ19sYWJlbCIsImdldFBheW1lbnRVcmkiLCJnZXRfcGF5bWVudF91cmkiLCJwYXJzZVBheW1lbnRVcmkiLCJwYXJzZV9wYXltZW50X3VyaSIsIk1vbmVyb1R4Q29uZmlnIiwiZ2V0QXR0cmlidXRlIiwia2V5IiwidmFsdWUiLCJnZXRfYXR0cmlidXRlIiwic2V0QXR0cmlidXRlIiwidmFsIiwic2V0X2F0dHJpYnV0ZSIsInN0YXJ0TWluaW5nIiwibnVtVGhyZWFkcyIsImJhY2tncm91bmRNaW5pbmciLCJpZ25vcmVCYXR0ZXJ5IiwiZGFlbW9uIiwiTW9uZXJvRGFlbW9uUnBjIiwiY29ubmVjdFRvRGFlbW9uUnBjIiwic3RvcE1pbmluZyIsImlzTXVsdGlzaWdJbXBvcnROZWVkZWQiLCJpc19tdWx0aXNpZ19pbXBvcnRfbmVlZGVkIiwiaXNNdWx0aXNpZyIsImlzX211bHRpc2lnIiwiZ2V0TXVsdGlzaWdJbmZvIiwiTW9uZXJvTXVsdGlzaWdJbmZvIiwiZ2V0X211bHRpc2lnX2luZm8iLCJwcmVwYXJlTXVsdGlzaWciLCJtdWx0aXNpZ0hleCIsInByZXBhcmVfbXVsdGlzaWciLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwidGhyZXNob2xkIiwibWFrZV9tdWx0aXNpZyIsImV4Y2hhbmdlTXVsdGlzaWdLZXlzIiwiZXhjaGFuZ2VfbXVsdGlzaWdfa2V5cyIsIk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsImV4cG9ydE11bHRpc2lnSGV4IiwiZXhwb3J0X211bHRpc2lnX2hleCIsImltcG9ydE11bHRpc2lnSGV4IiwicmVmcmVzaEFmdGVySW1wb3J0IiwiaW1wb3J0X211bHRpc2lnX2hleCIsInNpZ25NdWx0aXNpZ1R4SGV4Iiwic2lnbl9tdWx0aXNpZ190eF9oZXgiLCJNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJzdWJtaXRNdWx0aXNpZ1R4SGV4Iiwic2lnbmVkTXVsdGlzaWdUeEhleCIsInN1Ym1pdF9tdWx0aXNpZ190eF9oZXgiLCJnZXREYXRhIiwiZ2V0RGF0YVdhc20iLCJ2aWV3T25seSIsImlzX3ZpZXdfb25seSIsInZpZXdzIiwiY2FjaGVCdWZmZXJMb2MiLCJnZXRfY2FjaGVfZmlsZV9idWZmZXIiLCJ2aWV3IiwiRGF0YVZpZXciLCJBcnJheUJ1ZmZlciIsImkiLCJzZXRJbnQ4IiwiSEVBUFU4IiwicG9pbnRlciIsIlVpbnQ4QXJyYXkiLCJCWVRFU19QRVJfRUxFTUVOVCIsIl9mcmVlIiwiQnVmZmVyIiwiZnJvbSIsImJ1ZmZlciIsImtleXNCdWZmZXJMb2MiLCJnZXRfa2V5c19maWxlX2J1ZmZlciIsInVuc2hpZnQiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJjaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkIiwiY2xvc2VJbnRlcm5hbCIsInByZXBhcmVDbG9zZSIsInNuYXBzaG90IiwiZ2V0Q2xvc2VEYXRhIiwid3JpdGVXYWxsZXREYXRhIiwiZGF0YSIsInByaW1hcnlBZGRyZXNzIiwiX3JlcXVlc3Rfd2FsbGV0X3NodXRkb3duIiwiY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsImNhdGNoIiwiZ2V0X2FkZHJlc3MiLCJnZXROdW1CbG9ja3NUb1VubG9jayIsImdldFR4IiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJnZXRPdXRnb2luZ1RyYW5zZmVycyIsImNyZWF0ZVR4IiwicmVsYXlUeCIsImdldFR4Tm90ZSIsInNldFR4Tm90ZSIsInByb3h5VG9Xb3JrZXIiLCJuZXR3b3JrVHlwZSIsImRhZW1vblVyaSIsImRhZW1vblVzZXJuYW1lIiwiZGFlbW9uUGFzc3dvcmQiLCJvcGVuX3dhbGxldF9mdWxsIiwia2V5c0RhdGEiLCJjYWNoZURhdGEiLCJnZXRSZWd0ZXN0IiwiYnJvd3Nlck1haW5QYXRoIiwiY29uc29sZSIsImVycm9yIiwiaXNFbmFibGVkIiwic2V0X2xpc3RlbmVyIiwibmV3TGlzdGVuZXJIYW5kbGUiLCJoZWlnaHQiLCJlbmRIZWlnaHQiLCJwZXJjZW50RG9uZSIsIm9uU3luY1Byb2dyZXNzIiwib25OZXdCbG9jayIsIm5ld0JhbGFuY2VTdHIiLCJuZXdVbmxvY2tlZEJhbGFuY2VTdHIiLCJvbkJhbGFuY2VzQ2hhbmdlZCIsImFtb3VudFN0ciIsInVubG9ja1RpbWUiLCJpc0xvY2tlZCIsIm9uT3V0cHV0UmVjZWl2ZWQiLCJhY2NvdW50SWR4U3RyIiwic3ViYWRkcmVzc0lkeFN0ciIsIm9uT3V0cHV0U3BlbnQiLCJzYW5pdGl6ZUJsb2NrIiwiYmxvY2siLCJzYW5pdGl6ZVR4V2FsbGV0IiwiYWNjb3VudCIsInN1YmFkZHJlc3MiLCJkZXNlcmlhbGl6ZUJsb2NrcyIsImJsb2Nrc0pzb24iLCJkZXNlcmlhbGl6ZWRCbG9ja3MiLCJibG9ja3MiLCJibG9ja0pzb24iLCJNb25lcm9CbG9jayIsIkRlc2VyaWFsaXphdGlvblR5cGUiLCJUWF9XQUxMRVQiLCJzZXRCbG9jayIsImdldEhhc2hlcyIsInR4TWFwIiwiTWFwIiwiZ2V0SGFzaCIsInR4c1NvcnRlZCIsInRyYW5zZmVycyIsImdldE91dGdvaW5nVHJhbnNmZXIiLCJ0cmFuc2ZlciIsIm91dHB1dHMiLCJvdXRwdXQiLCJzZXRCcm93c2VyTWFpblBhdGgiLCJQYXRoIiwibm9ybWFsaXplIiwiaXNDbG9zZWQiLCJ3YWxsZXREaXIiLCJkaXJuYW1lIiwibWtkaXIiLCJ3cml0ZUZpbGUiLCJvbGRQYXRoIiwidW5saW5rIiwicGF0aE5ldyIsInJlbmFtZSIsImV4cG9ydHMiLCJkZWZhdWx0IiwiTW9uZXJvV2FsbGV0S2V5c1Byb3h5Iiwid2FsbGV0SWQiLCJpbnZva2VXb3JrZXIiLCJnZXRXb3JrZXIiLCJ3b3JrZXIiLCJ3cmFwcGVkTGlzdGVuZXJzIiwiYXJndW1lbnRzIiwidXJpT3JScGNDb25uZWN0aW9uIiwiZ2V0Q29uZmlnIiwicnBjQ29uZmlnIiwid3JhcHBlZExpc3RlbmVyIiwiV2FsbGV0V29ya2VyTGlzdGVuZXIiLCJsaXN0ZW5lcklkIiwiZ2V0SWQiLCJhZGRXb3JrZXJDYWxsYmFjayIsImdldExpc3RlbmVyIiwicmVtb3ZlV29ya2VyQ2FsbGJhY2siLCJzcGxpY2UiLCJibG9ja0pzb25zIiwia2V5SW1hZ2VzSnNvbiIsImNsb3NlIiwiYW5ub3VuY2VTeW5jUHJvZ3Jlc3MiLCJhbm5vdW5jZU5ld0Jsb2NrIiwiYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQiLCJNb25lcm9PdXRwdXRXYWxsZXQiLCJzZXRBbW91bnQiLCJzZXRBY2NvdW50SW5kZXgiLCJzZXRTdWJhZGRyZXNzSW5kZXgiLCJzZXRIYXNoIiwic2V0VmVyc2lvbiIsInNldFVubG9ja1RpbWUiLCJzZXRUeCIsInNldE91dHB1dHMiLCJzZXRJc0luY29taW5nIiwic2V0SXNMb2NrZWQiLCJzZXRIZWlnaHQiLCJzZXRJc0NvbmZpcm1lZCIsInNldEluVHhQb29sIiwic2V0SXNGYWlsZWQiLCJhbm5vdW5jZU91dHB1dFJlY2VpdmVkIiwicGFyc2VJbnQiLCJzZXRJbnB1dHMiLCJhbm5vdW5jZU91dHB1dFNwZW50IiwiaWQiLCJnZXRJbnB1dHMiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0RnVsbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBQYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4uL2NvbW1vbi9UYXNrTG9vcGVyXCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50XCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudFRhZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50VGFnXCI7XG5pbXBvcnQgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BZGRyZXNzQm9va0VudHJ5XCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0NoZWNrVHggZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tUeFwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrUmVzZXJ2ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1Jlc2VydmVcIjtcbmltcG9ydCBNb25lcm9EYWVtb25ScGMgZnJvbSBcIi4uL2RhZW1vbi9Nb25lcm9EYWVtb25ScGNcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbmNvbWluZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnU2lnblJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1N1YmFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFByaW9yaXR5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UHJpb3JpdHlcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVHhcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgeyBNb25lcm9XYWxsZXRLZXlzLCBNb25lcm9XYWxsZXRLZXlzUHJveHkgfSBmcm9tIFwiLi9Nb25lcm9XYWxsZXRLZXlzXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9Db25uZWN0aW9uTWFuYWdlclwiO1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm8gd2FsbGV0IHVzaW5nIGNsaWVudC1zaWRlIFdlYkFzc2VtYmx5IGJpbmRpbmdzIHRvIG1vbmVyby1wcm9qZWN0J3Mgd2FsbGV0MiBpbiBDKysuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1dhbGxldEZ1bGwgZXh0ZW5kcyBNb25lcm9XYWxsZXRLZXlzIHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA9IDIwMDAwO1xuICBwcm90ZWN0ZWQgc3RhdGljIEZTO1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgcGF0aDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgcGFzc3dvcmQ6IHN0cmluZztcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXTtcbiAgcHJvdGVjdGVkIGZzOiBhbnk7XG4gIHByb3RlY3RlZCB3YXNtTGlzdGVuZXI6IFdhbGxldFdhc21MaXN0ZW5lcjtcbiAgcHJvdGVjdGVkIHdhc21MaXN0ZW5lckhhbmRsZTogbnVtYmVyO1xuICBwcm90ZWN0ZWQgcmVqZWN0VW5hdXRob3JpemVkOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgcmVqZWN0VW5hdXRob3JpemVkQ29uZmlnSWQ6IHN0cmluZztcbiAgcHJvdGVjdGVkIHN5bmNQZXJpb2RJbk1zOiBudW1iZXI7XG4gIHByb3RlY3RlZCBzeW5jTG9vcGVyOiBUYXNrTG9vcGVyO1xuICBwcm90ZWN0ZWQgYnJvd3Nlck1haW5QYXRoOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBzeW5jQ2FsbHMgPSBuZXcgU2V0PFByb21pc2U8YW55Pj4oKTtcblxuICAvKipcbiAgICogSW50ZXJuYWwgY29uc3RydWN0b3Igd2hpY2ggaXMgZ2l2ZW4gdGhlIG1lbW9yeSBhZGRyZXNzIG9mIGEgQysrIHdhbGxldCBpbnN0YW5jZS5cbiAgICogXG4gICAqIFRoaXMgY29uc3RydWN0b3Igc2hvdWxkIGJlIGNhbGxlZCB0aHJvdWdoIHN0YXRpYyB3YWxsZXQgY3JlYXRpb24gdXRpbGl0aWVzIGluIHRoaXMgY2xhc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gY3BwQWRkcmVzcyAtIGFkZHJlc3Mgb2YgdGhlIHdhbGxldCBpbnN0YW5jZSBpbiBDKytcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBwYXRoIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3N3b3JkIC0gcGFzc3dvcmQgb2YgdGhlIHdhbGxldCBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge0ZpbGVTeXN0ZW19IGZzIC0gbm9kZS5qcy1jb21wYXRpYmxlIGZpbGUgc3lzdGVtIHRvIHJlYWQvd3JpdGUgd2FsbGV0IGZpbGVzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gcmVqZWN0VW5hdXRob3JpemVkIC0gc3BlY2lmaWVzIGlmIHVuYXV0aG9yaXplZCByZXF1ZXN0cyAoZS5nLiBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMpIHNob3VsZCBiZSByZWplY3RlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVqZWN0VW5hdXRob3JpemVkRm5JZCAtIHVuaXF1ZSBpZGVudGlmaWVyIGZvciBodHRwX2NsaWVudF93YXNtIHRvIHF1ZXJ5IHJlamVjdFVuYXV0aG9yaXplZFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldEZ1bGxQcm94eX0gd2FsbGV0UHJveHkgLSBwcm94eSB0byBpbnZva2Ugd2FsbGV0IG9wZXJhdGlvbnMgaW4gYSB3ZWIgd29ya2VyXG4gICAqIFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY29uc3RydWN0b3IoY3BwQWRkcmVzcywgcGF0aCwgcGFzc3dvcmQsIGZzLCByZWplY3RVbmF1dGhvcml6ZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIHdhbGxldFByb3h5PzogTW9uZXJvV2FsbGV0RnVsbFByb3h5KSB7XG4gICAgc3VwZXIoY3BwQWRkcmVzcywgd2FsbGV0UHJveHkpO1xuICAgIGlmICh3YWxsZXRQcm94eSkgcmV0dXJuO1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5wYXNzd29yZCA9IHBhc3N3b3JkO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gICAgdGhpcy5mcyA9IGZzID8gZnMgOiAocGF0aCA/IE1vbmVyb1dhbGxldEZ1bGwuZ2V0RnMoKSA6IHVuZGVmaW5lZCk7XG4gICAgdGhpcy5faXNDbG9zZWQgPSBmYWxzZTtcbiAgICB0aGlzLndhc21MaXN0ZW5lciA9IG5ldyBXYWxsZXRXYXNtTGlzdGVuZXIodGhpcyk7IC8vIHJlY2VpdmVzIG5vdGlmaWNhdGlvbnMgZnJvbSB3YXNtIGMrK1xuICAgIHRoaXMud2FzbUxpc3RlbmVySGFuZGxlID0gMDsgICAgICAgICAgICAgICAgICAgICAgLy8gbWVtb3J5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCBsaXN0ZW5lciBpbiBjKytcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCA9IHJlamVjdFVuYXV0aG9yaXplZDtcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkID0gcmVqZWN0VW5hdXRob3JpemVkRm5JZDtcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gTW9uZXJvV2FsbGV0RnVsbC5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TO1xuICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCk7IC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgVVRJTElUSUVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogQ2hlY2sgaWYgYSB3YWxsZXQgZXhpc3RzIGF0IGEgZ2l2ZW4gcGF0aC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gcGF0aCBvZiB0aGUgd2FsbGV0IG9uIHRoZSBmaWxlIHN5c3RlbVxuICAgKiBAcGFyYW0ge2FueX0gZnMgLSBmaWxlIHN5c3RlbSBjb21wYXRpYmxlIHdpdGggTm9kZS5qcyBgZnMucHJvbWlzZXNgIEFQSSAoZGVmYXVsdHMgdG8gZGlzayBvciBpbi1tZW1vcnkgRlMgaWYgYnJvd3NlcilcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBhIHdhbGxldCBleGlzdHMgYXQgdGhlIGdpdmVuIHBhdGgsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHdhbGxldEV4aXN0cyhwYXRoLCBmcykge1xuICAgIGFzc2VydChwYXRoLCBcIk11c3QgcHJvdmlkZSBhIHBhdGggdG8gbG9vayBmb3IgYSB3YWxsZXRcIik7XG4gICAgaWYgKCFmcykgZnMgPSBNb25lcm9XYWxsZXRGdWxsLmdldEZzKCk7XG4gICAgaWYgKCFmcykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGZpbGUgc3lzdGVtIHRvIGNoZWNrIGlmIHdhbGxldCBleGlzdHNcIik7XG4gICAgbGV0IGV4aXN0cyA9IGF3YWl0IExpYnJhcnlVdGlscy5leGlzdHMoZnMsIHBhdGggKyBcIi5rZXlzXCIpO1xuICAgIExpYnJhcnlVdGlscy5sb2coMSwgXCJXYWxsZXQgZXhpc3RzIGF0IFwiICsgcGF0aCArIFwiOiBcIiArIGV4aXN0cyk7XG4gICAgcmV0dXJuIGV4aXN0cztcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIG9wZW5XYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcblxuICAgIC8vIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJveHlUb1dvcmtlcih0cnVlKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBzZWVkIHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgc2VlZCBvZmZzZXQgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcHJpbWFyeSBhZGRyZXNzIHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHByaXZhdGUgdmlldyBrZXkgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHByaXZhdGUgc3BlbmQga2V5IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcmVzdG9yZSBoZWlnaHQgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgbGFuZ3VhZ2Ugd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNhdmVDdXJyZW50KCkgPT09IHRydWUpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIGN1cnJlbnQgd2FsbGV0IHdoZW4gb3BlbmluZyBmdWxsIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldEZzKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldEZzKE1vbmVyb1dhbGxldEZ1bGwuZ2V0RnMoKSk7XG5cbiAgICAvLyBzZXQgc2VydmVyIGZyb20gY29ubmVjdGlvbiBtYW5hZ2VyIGlmIHByb3ZpZGVkXG4gICAgaWYgKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBpZiAoY29uZmlnLmdldFNlcnZlcigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIG9wZW5lZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBjb25maWcuc2V0U2VydmVyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpLmdldENvbm5lY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgLy8gcmVhZCB3YWxsZXQgZGF0YSBmcm9tIGRpc2sgdW5sZXNzIHByb3ZpZGVkXG4gICAgaWYgKCFjb25maWcuZ2V0S2V5c0RhdGEoKSkge1xuICAgICAgbGV0IGZzID0gY29uZmlnLmdldEZzKCk7XG4gICAgICBpZiAoIWZzKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZmlsZSBzeXN0ZW0gdG8gcmVhZCB3YWxsZXQgZGF0YSBmcm9tXCIpO1xuICAgICAgaWYgKCFhd2FpdCB0aGlzLndhbGxldEV4aXN0cyhjb25maWcuZ2V0UGF0aCgpLCBmcykpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBkb2VzIG5vdCBleGlzdCBhdCBwYXRoOiBcIiArIGNvbmZpZy5nZXRQYXRoKCkpO1xuICAgICAgY29uZmlnLnNldEtleXNEYXRhKGF3YWl0IGZzLnJlYWRGaWxlKGNvbmZpZy5nZXRQYXRoKCkgKyBcIi5rZXlzXCIpKTtcbiAgICAgIGNvbmZpZy5zZXRDYWNoZURhdGEoYXdhaXQgTGlicmFyeVV0aWxzLmV4aXN0cyhmcywgY29uZmlnLmdldFBhdGgoKSkgPyBhd2FpdCBmcy5yZWFkRmlsZShjb25maWcuZ2V0UGF0aCgpKSA6IFwiXCIpO1xuICAgIH1cblxuICAgIC8vIG9wZW4gd2FsbGV0IGZyb20gZGF0YVxuICAgIGNvbnN0IHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwub3BlbldhbGxldERhdGEoY29uZmlnKTtcblxuICAgIC8vIGFwcGx5IGV4cGxpY2l0IGRhZW1vbiB0cnVzdFxuICAgIGlmIChjb25maWcuZ2V0SXNUcnVzdGVkRGFlbW9uKCkgIT09IHVuZGVmaW5lZCAmJiBjb25maWcuZ2V0U2VydmVyKCkpIGF3YWl0IHdhbGxldC5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZy5nZXRTZXJ2ZXIoKSwgY29uZmlnLmdldElzVHJ1c3RlZERhZW1vbigpKTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXJcbiAgICBhd2FpdCB3YWxsZXQuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcblxuICAgIC8vIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGNvbmZpZyB0byBjcmVhdGUgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQgJiYgKGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBtYXkgYmUgaW5pdGlhbGl6ZWQgd2l0aCBhIHNlZWQgb3Iga2V5cyBidXQgbm90IGJvdGhcIik7XG4gICAgaWYgKGNvbmZpZy5nZXROZXR3b3JrVHlwZSgpID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBhIG5ldHdvcmtUeXBlOiAnbWFpbm5ldCcsICd0ZXN0bmV0JyBvciAnc3RhZ2VuZXQnXCIpO1xuICAgIE1vbmVyb05ldHdvcmtUeXBlLnZhbGlkYXRlKGNvbmZpZy5nZXROZXR3b3JrVHlwZSgpKTtcbiAgICBpZiAoY29uZmlnLmdldFNhdmVDdXJyZW50KCkgPT09IHRydWUpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIGN1cnJlbnQgd2FsbGV0IHdoZW4gY3JlYXRpbmcgZnVsbCBXQVNNIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UGF0aChcIlwiKTtcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSAmJiBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLndhbGxldEV4aXN0cyhjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0RnMoKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBjb25maWcuZ2V0UGF0aCgpKTtcbiAgICBpZiAoY29uZmlnLmdldFBhc3N3b3JkKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFBhc3N3b3JkKFwiXCIpO1xuXG4gICAgLy8gc2V0IHNlcnZlciBmcm9tIGNvbm5lY3Rpb24gbWFuYWdlciBpZiBwcm92aWRlZFxuICAgIGlmIChjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBjcmVhdGVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGNvbmZpZy5zZXRTZXJ2ZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkuZ2V0Q29ubmVjdGlvbigpKTtcbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgcHJveGllZCBvciBsb2NhbCB3YWxsZXRcbiAgICBsZXQgd2FsbGV0O1xuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKHRydWUpO1xuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpKSB7XG4gICAgICBsZXQgd2FsbGV0UHJveHkgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsUHJveHkuY3JlYXRlV2FsbGV0KGNvbmZpZyk7XG4gICAgICB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0RnVsbCh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB3YWxsZXRQcm94eSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIGxhbmd1YWdlIHdoZW4gY3JlYXRpbmcgd2FsbGV0IGZyb20gc2VlZFwiKTtcbiAgICAgICAgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWcpO1xuICAgICAgfSBlbHNlIGlmIChjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBrZXlzXCIpO1xuICAgICAgICB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICAgICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgcmVzdG9yZUhlaWdodCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgICAgIHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwuY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZyk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXJcbiAgICBhd2FpdCB3YWxsZXQuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcblxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgcGFyYW1zXG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdHJ1ZTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UmVzdG9yZUhlaWdodCgwKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0U2VlZE9mZnNldChcIlwiKTtcbiAgICBcbiAgICAvLyBsb2FkIGZ1bGwgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gY3JlYXRlIHdhbGxldCBpbiBxdWV1ZVxuICAgIGxldCB3YWxsZXQgPSBhd2FpdCBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICAgICAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkRm5JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHJlamVjdFVuYXV0aG9yaXplZCk7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLmNyZWF0ZV9mdWxsX3dhbGxldChKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCBhc3luYyAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRGdWxsKGNwcEFkZHJlc3MsIGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRQYXNzd29yZCgpLCBjb25maWcuZ2V0RnMoKSwgY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgXG4gICAgLy8gc2F2ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG5cbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtc1xuICAgIE1vbmVyb05ldHdvcmtUeXBlLnZhbGlkYXRlKGNvbmZpZy5nZXROZXR3b3JrVHlwZSgpKTtcbiAgICBpZiAoY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaW1hcnlBZGRyZXNzKFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpdmF0ZVZpZXdLZXkoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpdmF0ZVNwZW5kS2V5KFwiXCIpO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFJlc3RvcmVIZWlnaHQoMCk7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShcIkVuZ2xpc2hcIik7XG4gICAgXG4gICAgLy8gbG9hZCBmdWxsIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gcXVldWVcbiAgICBsZXQgd2FsbGV0ID0gYXdhaXQgbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICAgICAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkRm5JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHJlamVjdFVuYXV0aG9yaXplZCk7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLmNyZWF0ZV9mdWxsX3dhbGxldChKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCBhc3luYyAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRGdWxsKGNwcEFkZHJlc3MsIGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRQYXNzd29yZCgpLCBjb25maWcuZ2V0RnMoKSwgY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgXG4gICAgLy8gc2F2ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldFJhbmRvbShjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgcGFyYW1zXG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShcIkVuZ2xpc2hcIik7XG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdHJ1ZTtcbiAgICBcbiAgICAvLyBsb2FkIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gcXVldWVcbiAgICBsZXQgd2FsbGV0ID0gYXdhaXQgbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICAgICAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkRm5JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHJlamVjdFVuYXV0aG9yaXplZCk7XG4gICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgYXN5bmMgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0UGFzc3dvcmQoKSwgY29uZmlnLmdldEZzKCksIGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHNhdmUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIGdldFNlZWRMYW5ndWFnZXMoKSB7XG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIHJldHVybiBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKG1vZHVsZS5nZXRfa2V5c193YWxsZXRfc2VlZF9sYW5ndWFnZXMoKSkubGFuZ3VhZ2VzO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGdldEZzKCkge1xuICAgIGlmICghTW9uZXJvV2FsbGV0RnVsbC5GUykgTW9uZXJvV2FsbGV0RnVsbC5GUyA9IGZzLnByb21pc2VzO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLkZTO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0gV0FMTEVUIE1FVEhPRFMgU1BFQ0lGSUMgVE8gV0FTTSBJTVBMRU1FTlRBVElPTiAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFRPRE86IG1vdmUgdGhlc2UgdG8gTW9uZXJvV2FsbGV0LnRzLCBvdGhlcnMgY2FuIGJlIHVuc3VwcG9ydGVkXG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBtYXhpbXVtIGhlaWdodCBvZiB0aGUgcGVlcnMgdGhlIHdhbGxldCdzIGRhZW1vbiBpcyBjb25uZWN0ZWQgdG8uXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIG1heGltdW0gaGVpZ2h0IG9mIHRoZSBwZWVycyB0aGUgd2FsbGV0J3MgZGFlbW9uIGlzIGNvbm5lY3RlZCB0b1xuICAgKi9cbiAgYXN5bmMgZ2V0RGFlbW9uTWF4UGVlckhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGFlbW9uTWF4UGVlckhlaWdodCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9kYWVtb25fbWF4X3BlZXJfaGVpZ2h0KHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0J3MgZGFlbW9uIGlzIHN5bmNlZCB3aXRoIHRoZSBuZXR3b3JrLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgZGFlbW9uIGlzIHN5bmNlZCB3aXRoIHRoZSBuZXR3b3JrLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzRGFlbW9uU3luY2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNEYWVtb25TeW5jZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5pc19kYWVtb25fc3luY2VkKHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0IGlzIHN5bmNlZCB3aXRoIHRoZSBkYWVtb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSB3YWxsZXQgaXMgc3luY2VkIHdpdGggdGhlIGRhZW1vbiwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc1N5bmNlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzU3luY2VkKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaXNfc3luY2VkKHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBuZXR3b3JrIHR5cGUgKG1haW5uZXQsIHRlc3RuZXQsIG9yIHN0YWdlbmV0KS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvTmV0d29ya1R5cGU+fSB0aGUgd2FsbGV0J3MgbmV0d29yayB0eXBlXG4gICAqL1xuICBhc3luYyBnZXROZXR3b3JrVHlwZSgpOiBQcm9taXNlPE1vbmVyb05ldHdvcmtUeXBlPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXROZXR3b3JrVHlwZSgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5nZXRfbmV0d29ya190eXBlKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGhlaWdodCBvZiB0aGUgZmlyc3QgYmxvY2sgdGhhdCB0aGUgd2FsbGV0IHNjYW5zLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnNcbiAgICovXG4gIGFzeW5jIGdldFJlc3RvcmVIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFJlc3RvcmVIZWlnaHQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuZ2V0X3Jlc3RvcmVfaGVpZ2h0KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIGhlaWdodCBvZiB0aGUgZmlyc3QgYmxvY2sgdGhhdCB0aGUgd2FsbGV0IHNjYW5zLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHJlc3RvcmVIZWlnaHQgLSBoZWlnaHQgb2YgdGhlIGZpcnN0IGJsb2NrIHRoYXQgdGhlIHdhbGxldCBzY2Fuc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldFJlc3RvcmVIZWlnaHQocmVzdG9yZUhlaWdodCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuc2V0X3Jlc3RvcmVfaGVpZ2h0KHRoaXMuY3BwQWRkcmVzcywgcmVzdG9yZUhlaWdodCk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNb3ZlIHRoZSB3YWxsZXQgZnJvbSBpdHMgY3VycmVudCBwYXRoIHRvIHRoZSBnaXZlbiBwYXRoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSB0aGUgd2FsbGV0J3MgZGVzdGluYXRpb24gcGF0aFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgbW92ZVRvKHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkubW92ZVRvKHBhdGgpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLm1vdmVUbyhwYXRoLCB0aGlzKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ09NTU9OIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9XYWxsZXRMaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGF3YWl0IHN1cGVyLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhd2FpdCBzdXBlci5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGdldExpc3RlbmVycygpOiBNb25lcm9XYWxsZXRMaXN0ZW5lcltdIHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldExpc3RlbmVycygpO1xuICAgIHJldHVybiBzdXBlci5nZXRMaXN0ZW5lcnMoKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29ubmVjdGlvbk1hbmFnZXI/OiBNb25lcm9Db25uZWN0aW9uTWFuYWdlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgcmV0dXJuIHN1cGVyLnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbm5lY3Rpb25NYW5hZ2VyKTtcbiAgfVxuXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uPzogUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IHN0cmluZywgaXNUcnVzdGVkPzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24sIGlzVHJ1c3RlZCk7XG5cbiAgICAvLyBub3JtYWxpemUgY29ubmVjdGlvblxuICAgIGxldCBjb25uZWN0aW9uID0gIXVyaU9yQ29ubmVjdGlvbiA/IHVuZGVmaW5lZCA6IHVyaU9yQ29ubmVjdGlvbiBpbnN0YW5jZW9mIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPyB1cmlPckNvbm5lY3Rpb24gOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24pO1xuICAgIGxldCB1cmkgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0VXJpKCkgPyBjb25uZWN0aW9uLmdldFVyaSgpIDogXCJcIjtcbiAgICBsZXQgdXNlcm5hbWUgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA/IGNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA6IFwiXCI7XG4gICAgbGV0IHBhc3N3b3JkID0gY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgPyBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIGxldCBwcm94eVVyaSA9IGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5nZXRQcm94eVVyaSgpID8gY29ubmVjdGlvbi5nZXRQcm94eVVyaSgpIDogXCJcIjtcbiAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWQ7XG4gICAgbGV0IGlzVHJ1c3RlZEFyZyA9IGlzVHJ1c3RlZCA9PT0gdW5kZWZpbmVkID8gLTEgOiAoaXNUcnVzdGVkID8gMSA6IDApOyAvLyBuZWdhdGl2ZSBpZiB1bnNldFxuXG4gICAgLy8gc2V0IGNvbm5lY3Rpb24gaW4gcXVldWVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zZXRfZGFlbW9uX2Nvbm5lY3Rpb24odGhpcy5jcHBBZGRyZXNzLCB1cmksIHVzZXJuYW1lLCBwYXNzd29yZCwgcHJveHlVcmksIGlzVHJ1c3RlZEFyZywgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAocmVzcCkgcmV0dXJuIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIHRoaXMucmVqZWN0VW5hdXRob3JpemVkID0gcmVqZWN0VW5hdXRob3JpemVkOyAgLy8gcGVyc2lzdCBsb2NhbGx5XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0J3MgZGFlbW9uIGlzIHRydXN0ZWQuXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIGRhZW1vbiBpcyB0cnVzdGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzRGFlbW9uVHJ1c3RlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzRGFlbW9uVHJ1c3RlZCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5pc19kYWVtb25fdHJ1c3RlZCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0RGFlbW9uQ29ubmVjdGlvbigpOiBQcm9taXNlPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldERhZW1vbkNvbm5lY3Rpb24oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBsZXQgY29ubmVjdGlvbkNvbnRhaW5lclN0ciA9IHRoaXMubW9kdWxlLmdldF9kYWVtb25fY29ubmVjdGlvbih0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgICBpZiAoIWNvbm5lY3Rpb25Db250YWluZXJTdHIpIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgbGV0IGpzb25Db25uZWN0aW9uID0gSlNPTi5wYXJzZShjb25uZWN0aW9uQ29udGFpbmVyU3RyKTtcbiAgICAgICAgICByZXNvbHZlKG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHt1cmk6IGpzb25Db25uZWN0aW9uLnVyaSwgdXNlcm5hbWU6IGpzb25Db25uZWN0aW9uLnVzZXJuYW1lLCBwYXNzd29yZDoganNvbkNvbm5lY3Rpb24ucGFzc3dvcmQsIHByb3h5VXJpOiBqc29uQ29ubmVjdGlvbi5wcm94eVVyaSwgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc0Nvbm5lY3RlZFRvRGFlbW9uKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaXNfY29ubmVjdGVkX3RvX2RhZW1vbih0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFZlcnNpb24oKTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcy5wYXRoO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3M/OiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5tb2R1bGUuZ2V0X2ludGVncmF0ZWRfYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIHN0YW5kYXJkQWRkcmVzcyA/IHN0YW5kYXJkQWRkcmVzcyA6IFwiXCIsIHBheW1lbnRJZCA/IHBheW1lbnRJZCA6IFwiXCIpO1xuICAgICAgICBpZiAocmVzdWx0LmNoYXJBdCgwKSAhPT0gJ3snKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyhKU09OLnBhcnNlKHJlc3VsdCkpO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgaWYgKGVyci5tZXNzYWdlLmluY2x1ZGVzKFwiSW52YWxpZCBwYXltZW50IElEXCIpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIHBheW1lbnQgSUQ6IFwiICsgcGF5bWVudElkKTtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5tb2R1bGUuZGVjb2RlX2ludGVncmF0ZWRfYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIGludGVncmF0ZWRBZGRyZXNzKTtcbiAgICAgICAgaWYgKHJlc3VsdC5jaGFyQXQoMCkgIT09ICd7JykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3VsdCk7XG4gICAgICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoSlNPTi5wYXJzZShyZXN1bHQpKTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0SGVpZ2h0KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uSGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXREYWVtb25IZWlnaHQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfZGFlbW9uX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodEJ5RGF0ZSh5ZWFyOiBudW1iZXIsIG1vbnRoOiBudW1iZXIsIGRheTogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEhlaWdodEJ5RGF0ZSh5ZWFyLCBtb250aCwgZGF5KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfaGVpZ2h0X2J5X2RhdGUodGhpcy5jcHBBZGRyZXNzLCB5ZWFyLCBtb250aCwgZGF5LCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogU3luY2hyb25pemUgdGhlIHdhbGxldCB3aXRoIHRoZSBkYWVtb24gYXMgYSBvbmUtdGltZSBzeW5jaHJvbm91cyBwcm9jZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRMaXN0ZW5lcnxudW1iZXJ9IFtsaXN0ZW5lck9yU3RhcnRIZWlnaHRdIC0gbGlzdGVuZXIgeG9yIHN0YXJ0IGhlaWdodCAoZGVmYXVsdHMgdG8gbm8gc3luYyBsaXN0ZW5lciwgdGhlIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0SGVpZ2h0IGlmIG5vdCBnaXZlbiBpbiBmaXJzdCBhcmcgKGRlZmF1bHRzIHRvIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthbGxvd0NvbmN1cnJlbnRDYWxsc10gLSBhbGxvdyBvdGhlciB3YWxsZXQgbWV0aG9kcyB0byBiZSBwcm9jZXNzZWQgc2ltdWx0YW5lb3VzbHkgZHVyaW5nIHN5bmMgKGRlZmF1bHQgZmFsc2UpPGJyPjxicj48Yj5XQVJOSU5HPC9iPjogZW5hYmxpbmcgdGhpcyBvcHRpb24gd2lsbCBjcmFzaCB3YWxsZXQgZXhlY3V0aW9uIGlmIGFub3RoZXIgY2FsbCBtYWtlcyBhIHNpbXVsdGFuZW91cyBuZXR3b3JrIHJlcXVlc3QuIFRPRE86IHBvc3NpYmxlIHRvIHN5bmMgd2FzbSBuZXR3b3JrIHJlcXVlc3RzIGluIGh0dHBfY2xpZW50X3dhc20uY3BwPyBcbiAgICovXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBhbGxvd0NvbmN1cnJlbnRDYWxscyA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodCwgc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzKTtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgcGFyYW1zXG4gICAgc3RhcnRIZWlnaHQgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCB8fCBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IHN0YXJ0SGVpZ2h0IDogbGlzdGVuZXJPclN0YXJ0SGVpZ2h0O1xuICAgIGxldCBsaXN0ZW5lciA9IGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyID8gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IDogdW5kZWZpbmVkO1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IE1hdGgubWF4KGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCksIGF3YWl0IHRoaXMuZ2V0UmVzdG9yZUhlaWdodCgpKTtcbiAgICBcbiAgICAvLyByZWdpc3RlciBsaXN0ZW5lciBpZiBnaXZlblxuICAgIGlmIChsaXN0ZW5lcikgYXdhaXQgdGhpcy5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gc3luYyB3YWxsZXRcbiAgICBsZXQgZXJyO1xuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICAgIHJlc3VsdCA9IGF3YWl0IChhbGxvd0NvbmN1cnJlbnRDYWxscyA/IHN5bmNXYXNtKCkgOiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4gc3luY1dhc20oKSkpO1xuICAgICAgZnVuY3Rpb24gc3luY1dhc20oKSB7XG4gICAgICAgIHRoYXQuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICAgIGxldCByZXNvbHZlQ2FsbDtcbiAgICAgICAgbGV0IHJlamVjdENhbGw7XG4gICAgICAgIGNvbnN0IGNhbGwgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7IHJlc29sdmVDYWxsID0gcmVzb2x2ZTsgcmVqZWN0Q2FsbCA9IHJlamVjdDsgfSk7XG4gICAgICAgIHRoYXQuc3luY0NhbGxzLmFkZChjYWxsKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBzeW5jIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgICAgdGhhdC5tb2R1bGUuc3luYyh0aGF0LmNwcEFkZHJlc3MsIHN0YXJ0SGVpZ2h0LCAocmVzcCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSAneycpIHJlamVjdENhbGwobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBsZXQgcmVzcEpzb24gPSBKU09OLnBhcnNlKHJlc3ApO1xuICAgICAgICAgICAgICByZXNvbHZlQ2FsbChuZXcgTW9uZXJvU3luY1Jlc3VsdChyZXNwSnNvbi5udW1CbG9ja3NGZXRjaGVkLCByZXNwSnNvbi5yZWNlaXZlZE1vbmV5KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHJlamVjdENhbGwoZXJyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2FsbC5maW5hbGx5KCgpID0+IHRoYXQuc3luY0NhbGxzLmRlbGV0ZShjYWxsKSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyID0gZTtcbiAgICB9XG4gICAgXG4gICAgLy8gdW5yZWdpc3RlciBsaXN0ZW5lclxuICAgIGlmIChsaXN0ZW5lciAmJiAhdGhpcy5faXNDbG9zZWQpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIFxuICAgIC8vIHRocm93IGVycm9yIG9yIHJldHVyblxuICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXM/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncyk7XG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IHN5bmNQZXJpb2RJbk1zID09PSB1bmRlZmluZWQgPyBNb25lcm9XYWxsZXRGdWxsLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgOiBzeW5jUGVyaW9kSW5NcztcbiAgICBpZiAoIXRoaXMuc3luY0xvb3BlcikgdGhpcy5zeW5jTG9vcGVyID0gbmV3IFRhc2tMb29wZXIoYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5iYWNrZ3JvdW5kU3luYygpKVxuICAgIHRoaXMuc3luY0xvb3Blci5zdGFydCh0aGlzLnN5bmNQZXJpb2RJbk1zKTtcbiAgfVxuICAgIFxuICBhc3luYyBzdG9wU3luY2luZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN0b3BTeW5jaW5nKCk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBpZiAodGhpcy5zeW5jTG9vcGVyKSB0aGlzLnN5bmNMb29wZXIuc3RvcCgpO1xuICAgIHRoaXMubW9kdWxlLnN0b3Bfc3luY2luZyh0aGlzLmNwcEFkZHJlc3MpOyAvLyB0YXNrIGlzIG5vdCBxdWV1ZWQgc28gd2FsbGV0IHN0b3BzIGltbWVkaWF0ZWx5XG4gIH1cbiAgXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zY2FuVHhzKHR4SGFzaGVzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zY2FuX3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eEhhc2hlczogdHhIYXNoZXN9KSwgKGVycikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoZXJyKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhblNwZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVzY2FuU3BlbnQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5yZXNjYW5fc3BlbnQodGhpcy5jcHBBZGRyZXNzLCAoZXJyKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihlcnIpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnJlc2NhbkJsb2NrY2hhaW4oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5yZXNjYW5fYmxvY2tjaGFpbih0aGlzLmNwcEFkZHJlc3MsIChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGVycikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBcbiAgICAgIC8vIGdldCBiYWxhbmNlIGVuY29kZWQgaW4ganNvbiBzdHJpbmdcbiAgICAgIGxldCBiYWxhbmNlU3RyO1xuICAgICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhc3NlcnQoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkLCBcIlN1YmFkZHJlc3MgaW5kZXggbXVzdCBiZSB1bmRlZmluZWQgaWYgYWNjb3VudCBpbmRleCBpcyB1bmRlZmluZWRcIik7XG4gICAgICAgIGJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYmFsYW5jZV93YWxsZXQodGhpcy5jcHBBZGRyZXNzKTtcbiAgICAgIH0gZWxzZSBpZiAoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYmFsYW5jZV9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBiYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2JhbGFuY2Vfc3ViYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBwYXJzZSBqc29uIHN0cmluZyB0byBiaWdpbnRcbiAgICAgIHJldHVybiBCaWdJbnQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGJhbGFuY2VTdHIpKS5iYWxhbmNlKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGJhbGFuY2UgZW5jb2RlZCBpbiBqc29uIHN0cmluZ1xuICAgICAgbGV0IHVubG9ja2VkQmFsYW5jZVN0cjtcbiAgICAgIGlmIChhY2NvdW50SWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCwgXCJTdWJhZGRyZXNzIGluZGV4IG11c3QgYmUgdW5kZWZpbmVkIGlmIGFjY291bnQgaW5kZXggaXMgdW5kZWZpbmVkXCIpO1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfdW5sb2NrZWRfYmFsYW5jZV93YWxsZXQodGhpcy5jcHBBZGRyZXNzKTtcbiAgICAgIH0gZWxzZSBpZiAoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF91bmxvY2tlZF9iYWxhbmNlX2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF91bmxvY2tlZF9iYWxhbmNlX3N1YmFkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcGFyc2UganNvbiBzdHJpbmcgdG8gYmlnaW50XG4gICAgICByZXR1cm4gQmlnSW50KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh1bmxvY2tlZEJhbGFuY2VTdHIpKS51bmxvY2tlZEJhbGFuY2UpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbiwgdGFnPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXMsIHRhZyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRzU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2FjY291bnRzKHRoaXMuY3BwQWRkcmVzcywgaW5jbHVkZVN1YmFkZHJlc3NlcyA/IHRydWUgOiBmYWxzZSwgdGFnID8gdGFnIDogXCJcIik7XG4gICAgICBpZiAoYWNjb3VudHNTdHIuY2hhckF0KDApICE9PSAneycpIHRocm93IG5ldyBNb25lcm9FcnJvcihhY2NvdW50c1N0cik7XG4gICAgICBsZXQgYWNjb3VudHMgPSBbXTtcbiAgICAgIGZvciAobGV0IGFjY291bnRKc29uIG9mIEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhhY2NvdW50c1N0cikpLmFjY291bnRzKSB7XG4gICAgICAgIGFjY291bnRzLnB1c2goTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWNjb3VudHM7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWNjb3VudChhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgYWNjb3VudFN0ciA9IHRoaXMubW9kdWxlLmdldF9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgaW5jbHVkZVN1YmFkZHJlc3NlcyA/IHRydWUgOiBmYWxzZSk7XG4gICAgICBsZXQgYWNjb3VudEpzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYWNjb3VudFN0cikpO1xuICAgICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSk7XG4gICAgfSk7XG5cbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlQWNjb3VudChsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY3JlYXRlQWNjb3VudChsYWJlbCk7XG4gICAgaWYgKGxhYmVsID09PSB1bmRlZmluZWQpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgYWNjb3VudFN0ciA9IHRoaXMubW9kdWxlLmNyZWF0ZV9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgbGFiZWwpO1xuICAgICAgbGV0IGFjY291bnRKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGFjY291bnRTdHIpKTtcbiAgICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgbGV0IGFyZ3MgPSB7YWNjb3VudElkeDogYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXM6IHN1YmFkZHJlc3NJbmRpY2VzID09PSB1bmRlZmluZWQgPyBbXSA6IEdlblV0aWxzLmxpc3RpZnkoc3ViYWRkcmVzc0luZGljZXMpfTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgc3ViYWRkcmVzc2VzSnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0aGlzLm1vZHVsZS5nZXRfc3ViYWRkcmVzc2VzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoYXJncykpKSkuc3ViYWRkcmVzc2VzO1xuICAgICAgbGV0IHN1YmFkZHJlc3NlcyA9IFtdO1xuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzc0pzb24gb2Ygc3ViYWRkcmVzc2VzSnNvbikgc3ViYWRkcmVzc2VzLnB1c2goTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKSk7XG4gICAgICByZXR1cm4gc3ViYWRkcmVzc2VzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeCwgbGFiZWwpO1xuICAgIGlmIChsYWJlbCA9PT0gdW5kZWZpbmVkKSBsYWJlbCA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHN1YmFkZHJlc3NTdHIgPSB0aGlzLm1vZHVsZS5jcmVhdGVfc3ViYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIGxhYmVsKTtcbiAgICAgIGlmIChzdWJhZGRyZXNzU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3Ioc3ViYWRkcmVzc1N0cik7XG4gICAgICBsZXQgc3ViYWRkcmVzc0pzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoc3ViYWRkcmVzc1N0cikpO1xuICAgICAgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCk7XG4gICAgaWYgKGxhYmVsID09PSB1bmRlZmluZWQpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgZXJyTXNnID0gdGhpcy5tb2R1bGUuc2V0X3N1YmFkZHJlc3NfbGFiZWwodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCk7XG4gICAgICBpZiAoZXJyTXNnKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyTXNnKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5Pzogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeHMocXVlcnkpO1xuXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHhRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gc2NoZWR1bGUgdGFza1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFja1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkocXVlcnlOb3JtYWxpemVkLmdldEJsb2NrKCkudG9Kc29uKCkpLCAoYmxvY2tzSnNvblN0cikgPT4ge1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIGNoZWNrIGZvciBlcnJvclxuICAgICAgICAgIGlmIChibG9ja3NKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IE1vbmVyb0Vycm9yKGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVzb2x2ZSB3aXRoIGRlc2VyaWFsaXplZCB0eHNcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb2x2ZShNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplVHhzKHF1ZXJ5Tm9ybWFsaXplZCwgYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9UcmFuc2ZlcltdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUcmFuc2ZlcnMocXVlcnkpO1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyByZXR1cm4gcHJvbWlzZSB3aGljaCByZXNvbHZlcyBvbiBjYWxsYmFja1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFja1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfdHJhbnNmZXJzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpKSwgKGJsb2Nrc0pzb25TdHIpID0+IHtcbiAgICAgICAgICAgIFxuICAgICAgICAgIC8vIGNoZWNrIGZvciBlcnJvclxuICAgICAgICAgIGlmIChibG9ja3NKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IE1vbmVyb0Vycm9yKGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlc29sdmUgd2l0aCBkZXNlcmlhbGl6ZWQgdHJhbnNmZXJzIFxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXNvbHZlKE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVUcmFuc2ZlcnMocXVlcnlOb3JtYWxpemVkLCBibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb091dHB1dFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvT3V0cHV0V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE91dHB1dHMocXVlcnkpO1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgb24gY2FsbGJhY2tcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT57XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFja1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfb3V0cHV0cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKS50b0pzb24oKSksIChibG9ja3NKc29uU3RyKSA9PiB7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gY2hlY2sgZm9yIGVycm9yXG4gICAgICAgICAgaWYgKGJsb2Nrc0pzb25TdHIuY2hhckF0KDApICE9PSAneycpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyByZXNvbHZlIHdpdGggZGVzZXJpYWxpemVkIG91dHB1dHNcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb2x2ZShNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplT3V0cHV0cyhxdWVyeU5vcm1hbGl6ZWQsIGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leHBvcnRPdXRwdXRzKGFsbCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZXhwb3J0X291dHB1dHModGhpcy5jcHBBZGRyZXNzLCBhbGwsIChvdXRwdXRzSGV4KSA9PiByZXNvbHZlKG91dHB1dHNIZXgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXg6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pbXBvcnRPdXRwdXRzKG91dHB1dHNIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmltcG9ydF9vdXRwdXRzKHRoaXMuY3BwQWRkcmVzcywgb3V0cHV0c0hleCwgKG51bUltcG9ydGVkKSA9PiByZXNvbHZlKG51bUltcG9ydGVkKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZXhwb3J0S2V5SW1hZ2VzKGFsbCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZXhwb3J0X2tleV9pbWFnZXModGhpcy5jcHBBZGRyZXNzLCBhbGwsIChyZXN1bHRTdHIpID0+IHtcbiAgICAgICAgICBpZiAocmVzdWx0U3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3VsdFN0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgcmVzdWx0SnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhyZXN1bHRTdHIpKTtcbiAgICAgICAgICAgIGlmICghcmVzdWx0SnNvbi5rZXlJbWFnZXMpIHJlc3VsdEpzb24ua2V5SW1hZ2VzID0gW107XG4gICAgICAgICAgICByZXNvbHZlKG5ldyBNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdChyZXN1bHRKc29uKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzOiBNb25lcm9LZXlJbWFnZVtdLCBvZmZzZXQgPSAwKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlcywgb2Zmc2V0KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pbXBvcnRfa2V5X2ltYWdlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHtvZmZzZXQ6IG9mZnNldCwga2V5SW1hZ2VzOiBrZXlJbWFnZXMubWFwKGtleUltYWdlID0+IGtleUltYWdlLnRvSnNvbigpKX0pLCAoa2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIpID0+IHtcbiAgICAgICAgICBpZiAoa2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioa2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGtleUltYWdlSW1wb3J0UmVzdWx0U3RyKSkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmZyZWV6ZU91dHB1dChrZXlJbWFnZSk7XG4gICAgaWYgKCFrZXlJbWFnZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBzcGVjaWZ5IGtleSBpbWFnZSB0byBmcmVlemVcIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZnJlZXplX291dHB1dCh0aGlzLmNwcEFkZHJlc3MsIGtleUltYWdlLCAoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRoYXdPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkudGhhd091dHB1dChrZXlJbWFnZSk7XG4gICAgaWYgKCFrZXlJbWFnZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBzcGVjaWZ5IGtleSBpbWFnZSB0byB0aGF3XCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnRoYXdfb3V0cHV0KHRoaXMuY3BwQWRkcmVzcywga2V5SW1hZ2UsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2UpO1xuICAgIGlmICgha2V5SW1hZ2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3Qgc3BlY2lmeSBrZXkgaW1hZ2UgdG8gY2hlY2sgaWYgZnJvemVuXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmlzX291dHB1dF9mcm96ZW4odGhpcy5jcHBBZGRyZXNzLCBrZXlJbWFnZSwgKHJlc3VsdCkgPT4gcmVzb2x2ZShyZXN1bHQpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCk6IFByb21pc2U8TW9uZXJvVHhQcmlvcml0eT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X2RlZmF1bHRfZmVlX3ByaW9yaXR5KHRoaXMuY3BwQWRkcmVzcywgKHJlc3VsdCkgPT4gcmVzb2x2ZShyZXN1bHQpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY3JlYXRlVHhzKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUsIGNvcHksIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpID09PSB1bmRlZmluZWQpIGNvbmZpZ05vcm1hbGl6ZWQuc2V0Q2FuU3BsaXQodHJ1ZSk7XG4gICAgXG4gICAgLy8gY3JlYXRlIHR4cyBpbiBxdWV1ZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgdHhzIGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuY3JlYXRlX3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZ05vcm1hbGl6ZWQudG9Kc29uKCkpLCAodHhTZXRKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHR4U2V0SnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eFNldEpzb25TdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0SnNvblN0cikpKS5nZXRUeHMoKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zd2VlcE91dHB1dChjb25maWcpO1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyhjb25maWcpO1xuICAgIFxuICAgIC8vIHN3ZWVwIG91dHB1dCBpbiBxdWV1ZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBzd2VlcCBvdXRwdXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5zd2VlcF9vdXRwdXQodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShjb25maWdOb3JtYWxpemVkLnRvSnNvbigpKSwgKHR4U2V0SnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmICh0eFNldEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhTZXRKc29uU3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0eFNldEpzb25TdHIpKSkuZ2V0VHhzKClbMF0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zd2VlcFVubG9ja2VkKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBzd2VlcCB1bmxvY2tlZCBpbiBxdWV1ZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBzd2VlcCB1bmxvY2tlZCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLnN3ZWVwX3VubG9ja2VkKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoY29uZmlnTm9ybWFsaXplZC50b0pzb24oKSksICh0eFNldHNKc29uKSA9PiB7XG4gICAgICAgICAgaWYgKHR4U2V0c0pzb24uY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhTZXRzSnNvbikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgdHhTZXRzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCB0eFNldEpzb24gb2YgSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0c0pzb24pKS50eFNldHMpIHR4U2V0cy5wdXNoKG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pKTtcbiAgICAgICAgICAgIGxldCB0eHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IHR4U2V0IG9mIHR4U2V0cykgZm9yIChsZXQgdHggb2YgdHhTZXQuZ2V0VHhzKCkpIHR4cy5wdXNoKHR4KTtcbiAgICAgICAgICAgIHJlc29sdmUodHhzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwRHVzdChyZWxheT86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN3ZWVwRHVzdChyZWxheSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5zd2VlcF9kdXN0KHRoaXMuY3BwQWRkcmVzcywgcmVsYXksICh0eFNldEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAodHhTZXRKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4U2V0SnNvblN0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0SnNvblN0cikpKTtcbiAgICAgICAgICAgIGlmICh0eFNldC5nZXRUeHMoKSA9PT0gdW5kZWZpbmVkKSB0eFNldC5zZXRUeHMoW10pO1xuICAgICAgICAgICAgcmVzb2x2ZSh0eFNldC5nZXRUeHMoKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhczogKE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKVtdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVsYXlUeHModHhzT3JNZXRhZGF0YXMpO1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eE1ldGFkYXRhcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykgdHhNZXRhZGF0YXMucHVzaCh0eE9yTWV0YWRhdGEgaW5zdGFuY2VvZiBNb25lcm9UeFdhbGxldCA/IHR4T3JNZXRhZGF0YS5nZXRNZXRhZGF0YSgpIDogdHhPck1ldGFkYXRhKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5yZWxheV90eHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dHhNZXRhZGF0YXM6IHR4TWV0YWRhdGFzfSksICh0eEhhc2hlc0pzb24pID0+IHtcbiAgICAgICAgICBpZiAodHhIYXNoZXNKc29uLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4SGFzaGVzSnNvbikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShKU09OLnBhcnNlKHR4SGFzaGVzSnNvbikudHhIYXNoZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmRlc2NyaWJlVHhTZXQodHhTZXQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KHt1bnNpZ25lZFR4SGV4OiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCksIHNpZ25lZFR4SGV4OiB0eFNldC5nZXRTaWduZWRUeEhleCgpLCBtdWx0aXNpZ1R4SGV4OiB0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KCl9KTtcbiAgICAgIGxldCByZXNwID0gdGhpcy5tb2R1bGUuZGVzY3JpYmVfdHhfc2V0KHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkodHhTZXQudG9Kc29uKCkpKTtcbiAgICAgIGlmIChyZXNwLmNoYXJBdCgwKSAhPT0gJ3snKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcCk7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhyZXNwKSkpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNpZ25UeHModW5zaWduZWRUeEhleCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHJlc3AgPSB0aGlzLm1vZHVsZS5zaWduX3R4cyh0aGlzLmNwcEFkZHJlc3MsIHVuc2lnbmVkVHhIZXgpO1xuICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSAneycpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXNwKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHJlc3ApKSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4cyhzaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3VibWl0VHhzKHNpZ25lZFR4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zdWJtaXRfdHhzKHRoaXMuY3BwQWRkcmVzcywgc2lnbmVkVHhIZXgsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShKU09OLnBhcnNlKHJlc3ApLnR4SGFzaGVzKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBzaWduYXR1cmVUeXBlID0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgYWNjb3VudElkeCA9IDAsIHN1YmFkZHJlc3NJZHggPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNpZ25NZXNzYWdlKG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgIFxuICAgIC8vIGFzc2lnbiBkZWZhdWx0c1xuICAgIHNpZ25hdHVyZVR5cGUgPSBzaWduYXR1cmVUeXBlIHx8IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVk7XG4gICAgYWNjb3VudElkeCA9IGFjY291bnRJZHggfHwgMDtcbiAgICBzdWJhZGRyZXNzSWR4ID0gc3ViYWRkcmVzc0lkeCB8fCAwO1xuICAgIFxuICAgIC8vIHF1ZXVlIHRhc2sgdG8gc2lnbiBtZXNzYWdlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHNpZ25hdHVyZSA9IHRoaXMubW9kdWxlLnNpZ25fbWVzc2FnZSh0aGlzLmNwcEFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUgPT09IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVkgPyAwIDogMSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgIGlmIChzaWduYXR1cmUuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpO1xuICAgICAgcmV0dXJuIHNpZ25hdHVyZTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnZlcmlmeU1lc3NhZ2UobWVzc2FnZSwgYWRkcmVzcywgc2lnbmF0dXJlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzdWx0O1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS52ZXJpZnlfbWVzc2FnZSh0aGlzLmNwcEFkZHJlc3MsIG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSkpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlc3VsdCA9IHtpc0dvb2Q6IGZhbHNlfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdChyZXN1bHQuaXNHb29kID9cbiAgICAgICAge2lzR29vZDogcmVzdWx0LmlzR29vZCwgaXNPbGQ6IHJlc3VsdC5pc09sZCwgc2lnbmF0dXJlVHlwZTogcmVzdWx0LnNpZ25hdHVyZVR5cGUgPT09IFwic3BlbmRcIiA/IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVkgOiBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfVklFV19LRVksIHZlcnNpb246IHJlc3VsdC52ZXJzaW9ufSA6XG4gICAgICAgIHtpc0dvb2Q6IGZhbHNlfVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHhLZXkodHhIYXNoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgdHhLZXkgPSB0aGlzLm1vZHVsZS5nZXRfdHhfa2V5KHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoKTtcbiAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgaWYgKHR4S2V5LmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodHhLZXkuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpO1xuICAgICAgcmV0dXJuIHR4S2V5O1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaDogc3RyaW5nLCB0eEtleTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoZWNrVHhLZXkodHhIYXNoLCB0eEtleSwgYWRkcmVzcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpOyBcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoZWNrX3R4X2tleSh0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCwgdHhLZXksIGFkZHJlc3MsIChyZXNwSnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmIChyZXNwSnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwSnNvblN0cikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvQ2hlY2tUeChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMocmVzcEpzb25TdHIpKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF90eF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBhZGRyZXNzIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgKHNpZ25hdHVyZSkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChzaWduYXR1cmUuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioc2lnbmF0dXJlLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1R4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja190eF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBhZGRyZXNzIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgc2lnbmF0dXJlIHx8IFwiXCIsIChyZXNwSnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmIChyZXNwSnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwSnNvblN0cikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvQ2hlY2tUeChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMocmVzcEpzb25TdHIpKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFNwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfc3BlbmRfcHJvb2YodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2ggfHwgXCJcIiwgbWVzc2FnZSB8fCBcIlwiLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoc2lnbmF0dXJlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1NwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja19zcGVuZF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBtZXNzYWdlIHx8IFwiXCIsIHNpZ25hdHVyZSB8fCBcIlwiLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiID8gcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSkgOiByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3Jlc2VydmVfcHJvb2Zfd2FsbGV0KHRoaXMuY3BwQWRkcmVzcywgbWVzc2FnZSwgKHNpZ25hdHVyZSkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChzaWduYXR1cmUuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioc2lnbmF0dXJlLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpLCAtMSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShzaWduYXR1cmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgYW1vdW50OiBiaWdpbnQsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4LCBhbW91bnQsIG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9yZXNlcnZlX3Byb29mX2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBhbW91bnQudG9TdHJpbmcoKSwgbWVzc2FnZSwgKHNpZ25hdHVyZSkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChzaWduYXR1cmUuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioc2lnbmF0dXJlLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpLCAtMSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShzaWduYXR1cmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1Jlc2VydmU+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpOyBcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoZWNrX3Jlc2VydmVfcHJvb2YodGhpcy5jcHBBZGRyZXNzLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUsIChyZXNwSnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmIChyZXNwSnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwSnNvblN0ciwgLTEpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb0NoZWNrUmVzZXJ2ZShKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMocmVzcEpzb25TdHIpKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFR4Tm90ZXModHhIYXNoZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCByZXNwID0gdGhpcy5tb2R1bGUuZ2V0X3R4X25vdGVzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3R4SGFzaGVzOiB0eEhhc2hlc30pKTtcbiAgICAgIGlmIChyZXNwLmNoYXJBdCgwKSAhPT0gJ3snKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcCk7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShyZXNwKS50eE5vdGVzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSwgbm90ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXRUeE5vdGVzKHR4SGFzaGVzLCBub3Rlcyk7XG4gICAgbm90ZXMgPSBub3Rlcy5tYXAobm90ZSA9PiBHZW5VdGlscy5pc0luaXRpYWxpemVkKG5vdGUpID8gbm90ZSA6IFwiXCIpOyAvLyB0aGUgYnJpZGdlIHdvdWxkIHN0b3JlIGpzb24gbnVsbCBhcyB0ZXh0XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGVyck1zZyA9IHRoaXMubW9kdWxlLnNldF90eF9ub3Rlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eEhhc2hlczogdHhIYXNoZXMsIHR4Tm90ZXM6IG5vdGVzfSkpO1xuICAgICAgaWYgKGVyck1zZykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyck1zZyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzKTtcbiAgICBpZiAoIWVudHJ5SW5kaWNlcykgZW50cnlJbmRpY2VzID0gW107XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICAgIGxldCByZXNwID0gdGhpcy5tb2R1bGUuZ2V0X2FkZHJlc3NfYm9va19lbnRyaWVzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe2VudHJ5SW5kaWNlczogZW50cnlJbmRpY2VzfSkpO1xuICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSAneycpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXNwKTtcbiAgICAgIGZvciAobGV0IGVudHJ5SnNvbiBvZiBKU09OLnBhcnNlKHJlc3ApLmVudHJpZXMpIHtcbiAgICAgICAgZW50cmllcy5wdXNoKG5ldyBNb25lcm9BZGRyZXNzQm9va0VudHJ5KGVudHJ5SnNvbikpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVudHJpZXM7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzczogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5hZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3MsIGRlc2NyaXB0aW9uKTtcbiAgICBpZiAoIWFkZHJlc3MpIGFkZHJlc3MgPSBcIlwiO1xuICAgIGlmICghZGVzY3JpcHRpb24pIGRlc2NyaXB0aW9uID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzcCA9IHRoaXMubW9kdWxlLmFkZF9hZGRyZXNzX2Jvb2tfZW50cnkodGhpcy5jcHBBZGRyZXNzLCBhZGRyZXNzLCBkZXNjcmlwdGlvbik7XG4gICAgICBpZiAodHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXNwKTtcbiAgICAgIHJldHVybiByZXNwO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBlZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleDogbnVtYmVyLCBzZXRBZGRyZXNzOiBib29sZWFuLCBhZGRyZXNzOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNldERlc2NyaXB0aW9uOiBib29sZWFuLCBkZXNjcmlwdGlvbjogc3RyaW5nIHwgdW5kZWZpbmVkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5lZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKTtcbiAgICBpZiAoIXNldEFkZHJlc3MpIHNldEFkZHJlc3MgPSBmYWxzZTtcbiAgICBpZiAoIWFkZHJlc3MpIGFkZHJlc3MgPSBcIlwiO1xuICAgIGlmICghc2V0RGVzY3JpcHRpb24pIHNldERlc2NyaXB0aW9uID0gZmFsc2U7XG4gICAgaWYgKCFkZXNjcmlwdGlvbikgZGVzY3JpcHRpb24gPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBlcnJNc2cgPSB0aGlzLm1vZHVsZS5lZGl0X2FkZHJlc3NfYm9va19lbnRyeSh0aGlzLmNwcEFkZHJlc3MsIGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pO1xuICAgICAgaWYgKGVyck1zZykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyck1zZyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHg6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGVyck1zZyA9IHRoaXMubW9kdWxlLmRlbGV0ZV9hZGRyZXNzX2Jvb2tfZW50cnkodGhpcy5jcHBBZGRyZXNzLCBlbnRyeUlkeCk7XG4gICAgICBpZiAoZXJyTXNnKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyTXNnKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGFnQWNjb3VudHModGFnOiBzdHJpbmcsIGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkudGFnQWNjb3VudHModGFnLCBhY2NvdW50SW5kaWNlcyk7XG4gICAgaWYgKCF0YWcpIHRhZyA9IFwiXCI7XG4gICAgaWYgKCFhY2NvdW50SW5kaWNlcykgYWNjb3VudEluZGljZXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgZXJyTXNnID0gdGhpcy5tb2R1bGUudGFnX2FjY291bnRzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3RhZzogdGFnLCBhY2NvdW50SW5kaWNlczogYWNjb3VudEluZGljZXN9KSk7XG4gICAgICBpZiAoZXJyTXNnKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyTXNnKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS51bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzKTtcbiAgICBpZiAoIWFjY291bnRJbmRpY2VzKSBhY2NvdW50SW5kaWNlcyA9IFtdO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBlcnJNc2cgPSB0aGlzLm1vZHVsZS51bnRhZ19hY2NvdW50cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHthY2NvdW50SW5kaWNlczogYWNjb3VudEluZGljZXN9KSk7XG4gICAgICBpZiAoZXJyTXNnKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyTXNnKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFjY291bnRUYWdzKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRUYWdzID0gW107XG4gICAgICBmb3IgKGxldCBhY2NvdW50VGFnSnNvbiBvZiBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9hY2NvdW50X3RhZ3ModGhpcy5jcHBBZGRyZXNzKSkuYWNjb3VudFRhZ3MpIGFjY291bnRUYWdzLnB1c2gobmV3IE1vbmVyb0FjY291bnRUYWcoYWNjb3VudFRhZ0pzb24pKTtcbiAgICAgIHJldHVybiBhY2NvdW50VGFncztcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0QWNjb3VudFRhZ0xhYmVsKHRhZywgbGFiZWwpO1xuICAgIGlmICghdGFnKSB0YWcgPSBcIlwiO1xuICAgIGlmICghbGFiZWwpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgZXJyTXNnID0gdGhpcy5tb2R1bGUuc2V0X2FjY291bnRfdGFnX2xhYmVsKHRoaXMuY3BwQWRkcmVzcywgdGFnLCBsYWJlbCk7XG4gICAgICBpZiAoZXJyTXNnKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyTXNnKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWc6IE1vbmVyb1R4Q29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFBheW1lbnRVcmkoY29uZmlnKTtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHVyaSA9IHRoaXMubW9kdWxlLmdldF9wYXltZW50X3VyaSh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSkpO1xuICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICBpZiAodXJpLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodXJpLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKTtcbiAgICAgIHJldHVybiB1cmk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmk6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhDb25maWc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnBhcnNlUGF5bWVudFVyaSh1cmkpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCByZXNwID0gdGhpcy5tb2R1bGUucGFyc2VfcGF5bWVudF91cmkodGhpcy5jcHBBZGRyZXNzLCB1cmkpO1xuICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09ICd7JykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3ApO1xuICAgICAgICByZXR1cm4gbmV3IE1vbmVyb1R4Q29uZmlnKEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhyZXNwKSkpO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QXR0cmlidXRlKGtleTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEF0dHJpYnV0ZShrZXkpO1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgYXNzZXJ0KHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIsIFwiQXR0cmlidXRlIGtleSBtdXN0IGJlIGEgc3RyaW5nXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCB2YWx1ZSA9IHRoaXMubW9kdWxlLmdldF9hdHRyaWJ1dGUodGhpcy5jcHBBZGRyZXNzLCBrZXkpO1xuICAgICAgcmV0dXJuIHZhbHVlID09PSBcIlwiID8gbnVsbCA6IHZhbHVlO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcsIHZhbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXRBdHRyaWJ1dGUoa2V5LCB2YWwpO1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgYXNzZXJ0KHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIsIFwiQXR0cmlidXRlIGtleSBtdXN0IGJlIGEgc3RyaW5nXCIpO1xuICAgIGFzc2VydCh0eXBlb2YgdmFsID09PSBcInN0cmluZ1wiLCBcIkF0dHJpYnV0ZSB2YWx1ZSBtdXN0IGJlIGEgc3RyaW5nXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnNldF9hdHRyaWJ1dGUodGhpcy5jcHBBZGRyZXNzLCBrZXksIHZhbCk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKG51bVRocmVhZHM6IG51bWJlciwgYmFja2dyb3VuZE1pbmluZz86IGJvb2xlYW4sIGlnbm9yZUJhdHRlcnk/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdGFydE1pbmluZyhudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGxldCBkYWVtb24gPSBhd2FpdCBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKGF3YWl0IHRoaXMuZ2V0RGFlbW9uQ29ubmVjdGlvbigpKTtcbiAgICBhd2FpdCBkYWVtb24uc3RhcnRNaW5pbmcoYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpLCBudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN0b3BNaW5pbmcoKTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGxldCBkYWVtb24gPSBhd2FpdCBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKGF3YWl0IHRoaXMuZ2V0RGFlbW9uQ29ubmVjdGlvbigpKTtcbiAgICBhd2FpdCBkYWVtb24uc3RvcE1pbmluZygpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnSW1wb3J0TmVlZGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5pc19tdWx0aXNpZ19pbXBvcnRfbmVlZGVkKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWcoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc011bHRpc2lnKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmlzX211bHRpc2lnKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE11bHRpc2lnSW5mbygpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5mbz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0TXVsdGlzaWdJbmZvKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9NdWx0aXNpZ0luZm8oSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfbXVsdGlzaWdfaW5mbyh0aGlzLmNwcEFkZHJlc3MpKSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucHJlcGFyZU11bHRpc2lnKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IG11bHRpc2lnSGV4ID0gdGhpcy5tb2R1bGUucHJlcGFyZV9tdWx0aXNpZyh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICBpZiAobXVsdGlzaWdIZXguaW5kZXhPZihlcnJvcktleSkgPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihtdWx0aXNpZ0hleC5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSk7XG4gICAgICByZXR1cm4gbXVsdGlzaWdIZXg7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgdGhyZXNob2xkOiBudW1iZXIsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkubWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLm1ha2VfbXVsdGlzaWcodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7bXVsdGlzaWdIZXhlczogbXVsdGlzaWdIZXhlcywgdGhyZXNob2xkOiB0aHJlc2hvbGQsIHBhc3N3b3JkOiBwYXNzd29yZH0pLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5leGNoYW5nZV9tdWx0aXNpZ19rZXlzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe211bHRpc2lnSGV4ZXM6IG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkOiBwYXNzd29yZH0pLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdChKU09OLnBhcnNlKHJlc3ApKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leHBvcnRNdWx0aXNpZ0hleCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBtdWx0aXNpZ0hleCA9IHRoaXMubW9kdWxlLmV4cG9ydF9tdWx0aXNpZ19oZXgodGhpcy5jcHBBZGRyZXNzKTtcbiAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgaWYgKG11bHRpc2lnSGV4LmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IobXVsdGlzaWdIZXguc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpO1xuICAgICAgcmV0dXJuIG11bHRpc2lnSGV4O1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcmVmcmVzaEFmdGVySW1wb3J0PzogYm9vbGVhbik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHJlZnJlc2hBZnRlckltcG9ydCA9PT0gdW5kZWZpbmVkKSByZWZyZXNoQWZ0ZXJJbXBvcnQgPSB0cnVlO1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlcywgcmVmcmVzaEFmdGVySW1wb3J0KTtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkobXVsdGlzaWdIZXhlcykpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBzdHJpbmdbXSB0byBpbXBvcnRNdWx0aXNpZ0hleCgpXCIpXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaW1wb3J0X211bHRpc2lnX2hleCh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHttdWx0aXNpZ0hleGVzOiBtdWx0aXNpZ0hleGVzLCByZWZyZXNoQWZ0ZXJJbXBvcnQ6IHJlZnJlc2hBZnRlckltcG9ydH0pLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnU2lnblJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuc2lnbl9tdWx0aXNpZ190eF9oZXgodGhpcy5jcHBBZGRyZXNzLCBtdWx0aXNpZ1R4SGV4LCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmIChyZXNwLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdChKU09OLnBhcnNlKHJlc3ApKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zdWJtaXRfbXVsdGlzaWdfdHhfaGV4KHRoaXMuY3BwQWRkcmVzcywgc2lnbmVkTXVsdGlzaWdUeEhleCwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKEpTT04ucGFyc2UocmVzcCkudHhIYXNoZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBrZXlzIGFuZCBjYWNoZSBkYXRhLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxEYXRhVmlld1tdPn0gaXMgdGhlIGtleXMgYW5kIGNhY2hlIGRhdGEsIHJlc3BlY3RpdmVseVxuICAgKi9cbiAgYXN5bmMgZ2V0RGF0YSgpOiBQcm9taXNlPERhdGFWaWV3W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldERhdGEoKTtcbiAgICBcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5nZXREYXRhV2FzbSgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldERhdGFXYXNtKCk6IERhdGFWaWV3W10ge1xuICAgIGxldCB2aWV3T25seSA9IHRoaXMubW9kdWxlLmlzX3ZpZXdfb25seSh0aGlzLmNwcEFkZHJlc3MpO1xuXG4gICAgLy8gc3RvcmUgdmlld3MgaW4gYXJyYXlcbiAgICBsZXQgdmlld3MgPSBbXTtcblxuICAgIC8vIG1hbGxvYyBjYWNoZSBidWZmZXIgYW5kIGdldCBidWZmZXIgbG9jYXRpb24gaW4gYysrIGhlYXBcbiAgICBsZXQgY2FjaGVCdWZmZXJMb2MgPSBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9jYWNoZV9maWxlX2J1ZmZlcih0aGlzLmNwcEFkZHJlc3MpKTtcblxuICAgIC8vIHJlYWQgYmluYXJ5IGRhdGEgZnJvbSBoZWFwIHRvIERhdGFWaWV3XG4gICAgbGV0IHZpZXcgPSBuZXcgRGF0YVZpZXcobmV3IEFycmF5QnVmZmVyKGNhY2hlQnVmZmVyTG9jLmxlbmd0aCkpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2FjaGVCdWZmZXJMb2MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZpZXcuc2V0SW50OChpLCB0aGlzLm1vZHVsZS5IRUFQVThbY2FjaGVCdWZmZXJMb2MucG9pbnRlciAvIFVpbnQ4QXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKyBpXSk7XG4gICAgfVxuXG4gICAgLy8gZnJlZSBiaW5hcnkgb24gaGVhcFxuICAgIHRoaXMubW9kdWxlLl9mcmVlKGNhY2hlQnVmZmVyTG9jLnBvaW50ZXIpO1xuXG4gICAgLy8gd3JpdGUgY2FjaGUgZmlsZVxuICAgIHZpZXdzLnB1c2goQnVmZmVyLmZyb20odmlldy5idWZmZXIpKTtcblxuICAgIC8vIG1hbGxvYyBrZXlzIGJ1ZmZlciBhbmQgZ2V0IGJ1ZmZlciBsb2NhdGlvbiBpbiBjKysgaGVhcFxuICAgIGxldCBrZXlzQnVmZmVyTG9jID0gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfa2V5c19maWxlX2J1ZmZlcih0aGlzLmNwcEFkZHJlc3MsIHRoaXMucGFzc3dvcmQsIHZpZXdPbmx5KSk7XG5cbiAgICAvLyByZWFkIGJpbmFyeSBkYXRhIGZyb20gaGVhcCB0byBEYXRhVmlld1xuICAgIHZpZXcgPSBuZXcgRGF0YVZpZXcobmV3IEFycmF5QnVmZmVyKGtleXNCdWZmZXJMb2MubGVuZ3RoKSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzQnVmZmVyTG9jLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2aWV3LnNldEludDgoaSwgdGhpcy5tb2R1bGUuSEVBUFU4W2tleXNCdWZmZXJMb2MucG9pbnRlciAvIFVpbnQ4QXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKyBpXSk7XG4gICAgfVxuXG4gICAgLy8gZnJlZSBiaW5hcnkgb24gaGVhcFxuICAgIHRoaXMubW9kdWxlLl9mcmVlKGtleXNCdWZmZXJMb2MucG9pbnRlcik7XG5cbiAgICAvLyBwcmVwZW5kIGtleXMgZmlsZVxuICAgIHZpZXdzLnVuc2hpZnQoQnVmZmVyLmZyb20odmlldy5idWZmZXIpKTtcbiAgICByZXR1cm4gdmlld3M7XG4gIH1cblxuICBhc3luYyBjaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZDogc3RyaW5nLCBuZXdQYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpO1xuICAgIGlmIChvbGRQYXNzd29yZCAhPT0gdGhpcy5wYXNzd29yZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBvcmlnaW5hbCBwYXNzd29yZC5cIik7IC8vIHdhbGxldDIgdmVyaWZ5X3Bhc3N3b3JkIGxvYWRzIGZyb20gZGlzayBzbyB2ZXJpZnkgcGFzc3dvcmQgaGVyZVxuICAgIGlmIChuZXdQYXNzd29yZCA9PT0gdW5kZWZpbmVkKSBuZXdQYXNzd29yZCA9IFwiXCI7XG4gICAgYXdhaXQgdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkKHRoaXMuY3BwQWRkcmVzcywgb2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkLCAoZXJyTXNnKSA9PiB7XG4gICAgICAgICAgaWYgKGVyck1zZykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihlcnJNc2cpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICB0aGlzLnBhc3N3b3JkID0gbmV3UGFzc3dvcmQ7XG4gICAgaWYgKHRoaXMucGF0aCkgYXdhaXQgdGhpcy5zYXZlKCk7IC8vIGF1dG8gc2F2ZVxuICB9XG4gIFxuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2F2ZSgpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhdmUodGhpcyk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBjbG9zZUludGVybmFsKHNhdmU6IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy53YWxsZXRQcm94eSkge1xuICAgICAgYXdhaXQgc3VwZXIuY2xvc2VJbnRlcm5hbChzYXZlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5wcmVwYXJlQ2xvc2UoKTtcbiAgICBpZiAoc2F2ZSkge1xuICAgICAgYXdhaXQgTGlicmFyeVV0aWxzLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNuYXBzaG90ID0gYXdhaXQgdGhpcy5nZXRDbG9zZURhdGEoKTtcbiAgICAgICAgYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC53cml0ZVdhbGxldERhdGEodGhpcywgc25hcHNob3QuZGF0YSwgc25hcHNob3QucHJpbWFyeUFkZHJlc3MpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGF3YWl0IHN1cGVyLmNsb3NlSW50ZXJuYWwoZmFsc2UsIHRoaXMud2FzbUxpc3RlbmVySGFuZGxlKTtcbiAgICB0aGlzLndhc21MaXN0ZW5lckhhbmRsZSA9IDA7XG4gICAgZGVsZXRlIHRoaXMucGF0aDtcbiAgICBkZWxldGUgdGhpcy5wYXNzd29yZDtcbiAgICBkZWxldGUgdGhpcy53YXNtTGlzdGVuZXI7XG4gICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHRoaXMucmVqZWN0VW5hdXRob3JpemVkQ29uZmlnSWQsIHVuZGVmaW5lZCk7IC8vIHVucmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICB9XG5cbiAgLy8gY2FuY2VsIG91dHNpZGUgdGhlIG1vZHVsZSBxdWV1ZSBzbyBhIGJsb2NrZWQgcmVxdWVzdCBjYW4gcmVsZWFzZSBpdFxuICBwcm90ZWN0ZWQgYXN5bmMgcHJlcGFyZUNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuX2lzQ2xvc2VkID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5zeW5jTG9vcGVyKSB0aGlzLnN5bmNMb29wZXIuc3RvcCgpO1xuICAgIHRoaXMubW9kdWxlLl9yZXF1ZXN0X3dhbGxldF9zaHV0ZG93bih0aGlzLmNwcEFkZHJlc3MpO1xuICAgIGlmICh0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyICYmIHRoaXMuY29ubmVjdGlvbk1hbmFnZXIuZ2V0TGlzdGVuZXJzKCkuaW5jbHVkZXModGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyKSkgdGhpcy5jb25uZWN0aW9uTWFuYWdlci5yZW1vdmVMaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIpO1xuICAgIHRoaXMuY29ubmVjdGlvbk1hbmFnZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyID0gdW5kZWZpbmVkO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKEFycmF5LmZyb20odGhpcy5zeW5jQ2FsbHMsIGNhbGwgPT4gY2FsbC5jYXRjaCgoKSA9PiB7fSkpKTtcbiAgICBhd2FpdCB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge30pO1xuICB9XG5cbiAgLy8gc2VyaWFsaXplIGEgc3RvcHBlZCB3YWxsZXQgZm9yIHNhdmluZyBvbiB0aGlzIHRocmVhZCBvciB0aGUgd29ya2VyJ3MgY2FsbGVyXG4gIHByb3RlY3RlZCBhc3luYyBnZXRDbG9zZURhdGEoKSB7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiAoe1xuICAgICAgZGF0YTogdGhpcy5nZXREYXRhV2FzbSgpLFxuICAgICAgcHJpbWFyeUFkZHJlc3M6IHRoaXMubW9kdWxlLmdldF9hZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgMCwgMClcbiAgICB9KSk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuICBcbiAgYXN5bmMgZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTogUHJvbWlzZTxudW1iZXJbXXx1bmRlZmluZWQ+IHsgcmV0dXJuIHN1cGVyLmdldE51bUJsb2Nrc1RvVW5sb2NrKCk7IH1cbiAgYXN5bmMgZ2V0VHgodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0fHVuZGVmaW5lZD4geyByZXR1cm4gc3VwZXIuZ2V0VHgodHhIYXNoKTsgfVxuICBhc3luYyBnZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdPiB7IHJldHVybiBzdXBlci5nZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeSk7IH1cbiAgYXN5bmMgZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pIHsgcmV0dXJuIHN1cGVyLmdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBjcmVhdGVUeChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4geyByZXR1cm4gc3VwZXIuY3JlYXRlVHgoY29uZmlnKTsgfVxuICBhc3luYyByZWxheVR4KHR4T3JNZXRhZGF0YTogTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIucmVsYXlUeCh0eE9yTWV0YWRhdGEpOyB9XG4gIGFzeW5jIGdldFR4Tm90ZSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5nZXRUeE5vdGUodHhIYXNoKTsgfVxuICBhc3luYyBzZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcsIG5vdGU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4geyByZXR1cm4gc3VwZXIuc2V0VHhOb3RlKHR4SGFzaCwgbm90ZSk7IH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBIRUxQRVJTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIG9wZW5XYWxsZXREYXRhKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG4gICAgaWYgKGNvbmZpZy5wcm94eVRvV29ya2VyKSB7XG4gICAgICBsZXQgd2FsbGV0UHJveHkgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsUHJveHkub3BlbldhbGxldERhdGEoY29uZmlnKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvV2FsbGV0RnVsbCh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB3YWxsZXRQcm94eSk7XG4gICAgfVxuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgcGFyYW1ldGVyc1xuICAgIGlmIChjb25maWcubmV0d29ya1R5cGUgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHRoZSB3YWxsZXQncyBuZXR3b3JrIHR5cGVcIik7XG4gICAgY29uZmlnLm5ldHdvcmtUeXBlID0gTW9uZXJvTmV0d29ya1R5cGUuZnJvbShjb25maWcubmV0d29ya1R5cGUpO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCBkYWVtb25VcmkgPSBkYWVtb25Db25uZWN0aW9uICYmIGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXJpKCkgPyBkYWVtb25Db25uZWN0aW9uLmdldFVyaSgpIDogXCJcIjtcbiAgICBsZXQgZGFlbW9uVXNlcm5hbWUgPSBkYWVtb25Db25uZWN0aW9uICYmIGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA6IFwiXCI7XG4gICAgbGV0IGRhZW1vblBhc3N3b3JkID0gZGFlbW9uQ29ubmVjdGlvbiAmJiBkYWVtb25Db25uZWN0aW9uLmdldFBhc3N3b3JkKCkgPyBkYWVtb25Db25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgXG4gICAgLy8gbG9hZCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyBvcGVuIHdhbGxldCBpbiBxdWV1ZVxuICAgIHJldHVybiBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyByZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gICAgICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWRGbklkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4ocmVqZWN0VW5hdXRob3JpemVkRm5JZCwgKCkgPT4gcmVqZWN0VW5hdXRob3JpemVkKTtcbiAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLm9wZW5fd2FsbGV0X2Z1bGwoY29uZmlnLnBhc3N3b3JkLCBjb25maWcubmV0d29ya1R5cGUsIGNvbmZpZy5rZXlzRGF0YSA/PyBcIlwiLCBjb25maWcuY2FjaGVEYXRhID8/IFwiXCIsIGRhZW1vblVyaSwgZGFlbW9uVXNlcm5hbWUsIGRhZW1vblBhc3N3b3JkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCBjb25maWcuZ2V0UmVndGVzdCgpID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGNvbmZpZy5nZXRSZWd0ZXN0KCksIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEZ1bGwoY3BwQWRkcmVzcywgY29uZmlnLnBhdGgsIGNvbmZpZy5wYXNzd29yZCwgY29uZmlnLmZzLCByZWplY3RVbmF1dGhvcml6ZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXRXYWxsZXRQcm94eSgpOiBNb25lcm9XYWxsZXRGdWxsUHJveHkge1xuICAgIHJldHVybiBzdXBlci5nZXRXYWxsZXRQcm94eSgpIGFzIE1vbmVyb1dhbGxldEZ1bGxQcm94eTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGJhY2tncm91bmRTeW5jKCkge1xuICAgIGxldCBsYWJlbCA9IHRoaXMucGF0aCA/IHRoaXMucGF0aCA6ICh0aGlzLmJyb3dzZXJNYWluUGF0aCA/IHRoaXMuYnJvd3Nlck1haW5QYXRoIDogXCJpbi1tZW1vcnkgd2FsbGV0XCIpOyAvLyBsYWJlbCBmb3IgbG9nXG4gICAgTGlicmFyeVV0aWxzLmxvZygxLCBcIkJhY2tncm91bmQgc3luY2hyb25pemluZyBcIiArIGxhYmVsKTtcbiAgICB0cnkgeyBhd2FpdCB0aGlzLnN5bmMoKTsgfVxuICAgIGNhdGNoIChlcnI6IGFueSkgeyBpZiAoIXRoaXMuX2lzQ2xvc2VkKSBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGJhY2tncm91bmQgc3luY2hyb25pemUgXCIgKyBsYWJlbCArIFwiOiBcIiArIGVyci5tZXNzYWdlKTsgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBpZiAodGhpcy5faXNDbG9zZWQpIHJldHVybjtcbiAgICBsZXQgaXNFbmFibGVkID0gdGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMDtcbiAgICBpZiAodGhpcy53YXNtTGlzdGVuZXJIYW5kbGUgPT09IDAgJiYgIWlzRW5hYmxlZCB8fCB0aGlzLndhc21MaXN0ZW5lckhhbmRsZSA+IDAgJiYgaXNFbmFibGVkKSByZXR1cm47IC8vIG5vIGRpZmZlcmVuY2VcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIGlmICh0aGlzLl9pc0Nsb3NlZCkgcmV0dXJuO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuc2V0X2xpc3RlbmVyKFxuICAgICAgICAgIHRoaXMuY3BwQWRkcmVzcyxcbiAgICAgICAgICB0aGlzLndhc21MaXN0ZW5lckhhbmRsZSxcbiAgICAgICAgICAgIG5ld0xpc3RlbmVySGFuZGxlID0+IHtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBuZXdMaXN0ZW5lckhhbmRsZSA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihuZXdMaXN0ZW5lckhhbmRsZSkpO1xuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLndhc21MaXN0ZW5lckhhbmRsZSA9IG5ld0xpc3RlbmVySGFuZGxlO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChoZWlnaHQpID0+IGF3YWl0IHRoaXMud2FzbUxpc3RlbmVyLm9uTmV3QmxvY2soaGVpZ2h0KSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpID0+IGF3YWl0IHRoaXMud2FzbUxpc3RlbmVyLm9uQmFsYW5jZXNDaGFuZ2VkKG5ld0JhbGFuY2VTdHIsIG5ld1VubG9ja2VkQmFsYW5jZVN0cikgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0LCB0eEhhc2gsIGFtb3VudFN0ciwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgdmVyc2lvbiwgdW5sb2NrVGltZSwgaXNMb2NrZWQpID0+IGF3YWl0IHRoaXMud2FzbUxpc3RlbmVyLm9uT3V0cHV0UmVjZWl2ZWQoaGVpZ2h0LCB0eEhhc2gsIGFtb3VudFN0ciwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgdmVyc2lvbiwgdW5sb2NrVGltZSwgaXNMb2NrZWQpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaXNFbmFibGVkID8gYXN5bmMgKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHhTdHIsIHN1YmFkZHJlc3NJZHhTdHIsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vbk91dHB1dFNwZW50KGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHhTdHIsIHN1YmFkZHJlc3NJZHhTdHIsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBzdGF0aWMgc2FuaXRpemVCbG9jayhibG9jaykge1xuICAgIGZvciAobGV0IHR4IG9mIGJsb2NrLmdldFR4cygpKSBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplVHhXYWxsZXQodHgpO1xuICAgIHJldHVybiBibG9jaztcbiAgfVxuICBcbiAgc3RhdGljIHNhbml0aXplVHhXYWxsZXQodHgpIHtcbiAgICBhc3NlcnQodHggaW5zdGFuY2VvZiBNb25lcm9UeFdhbGxldCk7XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBzdGF0aWMgc2FuaXRpemVBY2NvdW50KGFjY291bnQpIHtcbiAgICBpZiAoYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkge1xuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpKSBNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhzdWJhZGRyZXNzKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY291bnQ7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZUJsb2NrcyhibG9ja3NKc29uU3RyKSB7XG4gICAgbGV0IGJsb2Nrc0pzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYmxvY2tzSnNvblN0cikpO1xuICAgIGxldCBkZXNlcmlhbGl6ZWRCbG9ja3M6IGFueSA9IHt9O1xuICAgIGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3MgPSBbXTtcbiAgICBpZiAoYmxvY2tzSnNvbi5ibG9ja3MpIGZvciAobGV0IGJsb2NrSnNvbiBvZiBibG9ja3NKc29uLmJsb2NrcykgZGVzZXJpYWxpemVkQmxvY2tzLmJsb2Nrcy5wdXNoKE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVCbG9jayhuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1dBTExFVCkpKTtcbiAgICByZXR1cm4gZGVzZXJpYWxpemVkQmxvY2tzO1xuICB9XG4gIFxuICBzdGF0aWMgZGVzZXJpYWxpemVUeHMocXVlcnksIGJsb2Nrc0pzb25TdHIpIHtcbiAgICBcbiAgICAvLyBkZXNlcmlhbGl6ZSBibG9ja3NcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzID0gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZUJsb2NrcyhibG9ja3NKc29uU3RyKTtcbiAgICBsZXQgYmxvY2tzID0gZGVzZXJpYWxpemVkQmxvY2tzLmJsb2NrcztcbiAgICBcbiAgICAvLyBjb2xsZWN0IHR4c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVCbG9jayhibG9jayk7XG4gICAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkge1xuICAgICAgICBpZiAoYmxvY2suZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgdHguc2V0QmxvY2sodW5kZWZpbmVkKTsgLy8gZGVyZWZlcmVuY2UgcGxhY2Vob2xkZXIgYmxvY2sgZm9yIHVuY29uZmlybWVkIHR4c1xuICAgICAgICB0eHMucHVzaCh0eCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHJlLXNvcnQgdHhzIHdoaWNoIGlzIGxvc3Qgb3ZlciB3YXNtIHNlcmlhbGl6YXRpb24gIC8vIFRPRE86IGNvbmZpcm0gdGhhdCBvcmRlciBpcyBsb3N0XG4gICAgaWYgKHF1ZXJ5LmdldEhhc2hlcygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCB0eE1hcCA9IG5ldyBNYXAoKTtcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykgdHhNYXBbdHguZ2V0SGFzaCgpXSA9IHR4O1xuICAgICAgbGV0IHR4c1NvcnRlZCA9IFtdO1xuICAgICAgZm9yIChsZXQgdHhIYXNoIG9mIHF1ZXJ5LmdldEhhc2hlcygpKSBpZiAodHhNYXBbdHhIYXNoXSAhPT0gdW5kZWZpbmVkKSB0eHNTb3J0ZWQucHVzaCh0eE1hcFt0eEhhc2hdKTtcbiAgICAgIHR4cyA9IHR4c1NvcnRlZDtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgc3RhdGljIGRlc2VyaWFsaXplVHJhbnNmZXJzKHF1ZXJ5LCBibG9ja3NKc29uU3RyKSB7XG4gICAgXG4gICAgLy8gZGVzZXJpYWxpemUgYmxvY2tzXG4gICAgbGV0IGRlc2VyaWFsaXplZEJsb2NrcyA9IE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cik7XG4gICAgbGV0IGJsb2NrcyA9IGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3M7XG4gICAgXG4gICAgLy8gY29sbGVjdCB0cmFuc2ZlcnNcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkge1xuICAgICAgICBpZiAoYmxvY2suZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgdHguc2V0QmxvY2sodW5kZWZpbmVkKTsgLy8gZGVyZWZlcmVuY2UgcGxhY2Vob2xkZXIgYmxvY2sgZm9yIHVuY29uZmlybWVkIHR4c1xuICAgICAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICE9PSB1bmRlZmluZWQpIHRyYW5zZmVycy5wdXNoKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSk7XG4gICAgICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgc3RhdGljIGRlc2VyaWFsaXplT3V0cHV0cyhxdWVyeSwgYmxvY2tzSnNvblN0cikge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIGJsb2Nrc1xuICAgIGxldCBkZXNlcmlhbGl6ZWRCbG9ja3MgPSBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplQmxvY2tzKGJsb2Nrc0pzb25TdHIpO1xuICAgIGxldCBibG9ja3MgPSBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzO1xuICAgIFxuICAgIC8vIGNvbGxlY3Qgb3V0cHV0c1xuICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkge1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dHB1dHM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIHBhdGggb2YgdGhlIHdhbGxldCBvbiB0aGUgYnJvd3NlciBtYWluIHRocmVhZCBpZiBydW4gYXMgYSB3b3JrZXIuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gYnJvd3Nlck1haW5QYXRoIC0gcGF0aCBvZiB0aGUgd2FsbGV0IG9uIHRoZSBicm93c2VyIG1haW4gdGhyZWFkXG4gICAqL1xuICBwcm90ZWN0ZWQgc2V0QnJvd3Nlck1haW5QYXRoKGJyb3dzZXJNYWluUGF0aCkge1xuICAgIHRoaXMuYnJvd3Nlck1haW5QYXRoID0gYnJvd3Nlck1haW5QYXRoO1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgbW92ZVRvKHBhdGgsIHdhbGxldCkge1xuXG4gICAgLy8gc2F2ZSBhbmQgcmV0dXJuIGlmIHNhbWUgcGF0aFxuICAgIGlmIChQYXRoLm5vcm1hbGl6ZSh3YWxsZXQucGF0aCkgPT09IFBhdGgubm9ybWFsaXplKHBhdGgpKSB7XG4gICAgICByZXR1cm4gd2FsbGV0LnNhdmUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICBpZiAoYXdhaXQgd2FsbGV0LmlzQ2xvc2VkKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBjbG9zZWRcIik7XG4gICAgICBpZiAoIXBhdGgpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBwYXRoIG9mIGRlc3RpbmF0aW9uIHdhbGxldFwiKTtcblxuICAgICAgLy8gY3JlYXRlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeSBpZiBpdCBkb2Vzbid0IGV4aXN0XG4gICAgICBsZXQgd2FsbGV0RGlyID0gUGF0aC5kaXJuYW1lKHBhdGgpO1xuICAgICAgaWYgKCFhd2FpdCBMaWJyYXJ5VXRpbHMuZXhpc3RzKHdhbGxldC5mcywgd2FsbGV0RGlyKSkge1xuICAgICAgICB0cnkgeyBhd2FpdCB3YWxsZXQuZnMubWtkaXIod2FsbGV0RGlyKTsgfVxuICAgICAgICBjYXRjaCAoZXJyOiBhbnkpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiRGVzdGluYXRpb24gcGF0aCBcIiArIHBhdGggKyBcIiBkb2VzIG5vdCBleGlzdCBhbmQgY2Fubm90IGJlIGNyZWF0ZWQ6IFwiICsgZXJyLm1lc3NhZ2UpOyB9XG4gICAgICB9XG5cbiAgICAgIC8vIGdldCB3YWxsZXQgZGF0YVxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHdhbGxldC5nZXREYXRhKCk7XG5cbiAgICAgIC8vIHdyaXRlIHdhbGxldCBmaWxlc1xuICAgICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoICsgXCIua2V5c1wiLCBkYXRhWzBdLCBcImJpbmFyeVwiKTtcbiAgICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aCwgZGF0YVsxXSwgXCJiaW5hcnlcIik7XG4gICAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGggKyBcIi5hZGRyZXNzLnR4dFwiLCBhd2FpdCB3YWxsZXQuZ2V0UHJpbWFyeUFkZHJlc3MoKSk7XG4gICAgICBsZXQgb2xkUGF0aCA9IHdhbGxldC5wYXRoO1xuICAgICAgd2FsbGV0LnBhdGggPSBwYXRoO1xuXG4gICAgICAvLyBkZWxldGUgb2xkIHdhbGxldCBmaWxlc1xuICAgICAgaWYgKG9sZFBhdGgpIHtcbiAgICAgICAgYXdhaXQgd2FsbGV0LmZzLnVubGluayhvbGRQYXRoICsgXCIuYWRkcmVzcy50eHRcIik7XG4gICAgICAgIGF3YWl0IHdhbGxldC5mcy51bmxpbmsob2xkUGF0aCArIFwiLmtleXNcIik7XG4gICAgICAgIGF3YWl0IHdhbGxldC5mcy51bmxpbmsob2xkUGF0aCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBzYXZlKHdhbGxldDogYW55KSB7XG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKGF3YWl0IHdhbGxldC5pc0Nsb3NlZCgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgY2xvc2VkXCIpO1xuXG4gICAgICBpZiAoIWF3YWl0IHdhbGxldC5nZXRQYXRoKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIHdhbGxldCBiZWNhdXNlIHBhdGggaXMgbm90IHNldFwiKTtcbiAgICAgIGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwud3JpdGVXYWxsZXREYXRhKHdhbGxldCwgYXdhaXQgd2FsbGV0LmdldERhdGEoKSwgYXdhaXQgd2FsbGV0LmdldFByaW1hcnlBZGRyZXNzKCkpO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIHdyaXRlV2FsbGV0RGF0YSh3YWxsZXQ6IGFueSwgZGF0YTogRGF0YVZpZXdbXSwgcHJpbWFyeUFkZHJlc3M6IHN0cmluZykge1xuICAgIGxldCBwYXRoID0gd2FsbGV0LnBhdGg7XG4gICAgaWYgKCFwYXRoKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSB3YWxsZXQgYmVjYXVzZSBwYXRoIGlzIG5vdCBzZXRcIik7XG5cbiAgICAvLyB3cml0ZSB3YWxsZXQgZmlsZXMgdG8gKi5uZXdcbiAgICBsZXQgcGF0aE5ldyA9IHBhdGggKyBcIi5uZXdcIjtcbiAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGhOZXcgKyBcIi5rZXlzXCIsIGRhdGFbMF0sIFwiYmluYXJ5XCIpO1xuICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aE5ldywgZGF0YVsxXSwgXCJiaW5hcnlcIik7XG4gICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoTmV3ICsgXCIuYWRkcmVzcy50eHRcIiwgcHJpbWFyeUFkZHJlc3MpO1xuXG4gICAgLy8gcmVwbGFjZSBvbGQgd2FsbGV0IGZpbGVzIHdpdGggbmV3XG4gICAgYXdhaXQgd2FsbGV0LmZzLnJlbmFtZShwYXRoTmV3ICsgXCIua2V5c1wiLCBwYXRoICsgXCIua2V5c1wiKTtcbiAgICBhd2FpdCB3YWxsZXQuZnMucmVuYW1lKHBhdGhOZXcsIHBhdGgpO1xuICAgIGF3YWl0IHdhbGxldC5mcy5yZW5hbWUocGF0aE5ldyArIFwiLmFkZHJlc3MudHh0XCIsIHBhdGggKyBcIi5hZGRyZXNzLnR4dFwiKTtcbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9XYWxsZXQgYnkgcHJveHlpbmcgcmVxdWVzdHMgdG8gYSB3b3JrZXIgd2hpY2ggcnVucyBhIGZ1bGwgd2FsbGV0LlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBNb25lcm9XYWxsZXRGdWxsUHJveHkgZXh0ZW5kcyBNb25lcm9XYWxsZXRLZXlzUHJveHkge1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgcGF0aDogYW55O1xuICBwcm90ZWN0ZWQgZnM6IGFueTtcbiAgcHJvdGVjdGVkIHdyYXBwZWRMaXN0ZW5lcnM6IGFueTtcbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFdBTExFVCBTVEFUSUMgVVRJTFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBzdGF0aWMgYXN5bmMgb3BlbldhbGxldERhdGEoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcbiAgICBsZXQgd2FsbGV0SWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgaWYgKGNvbmZpZy5wYXNzd29yZCA9PT0gdW5kZWZpbmVkKSBjb25maWcucGFzc3dvcmQgPSBcIlwiO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIod2FsbGV0SWQsIFwib3BlbldhbGxldERhdGFcIiwgW2NvbmZpZy5wYXRoLCBjb25maWcucGFzc3dvcmQsIGNvbmZpZy5uZXR3b3JrVHlwZSwgY29uZmlnLmtleXNEYXRhLCBjb25maWcuY2FjaGVEYXRhLCBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi50b0pzb24oKSA6IHVuZGVmaW5lZCwgY29uZmlnLmdldFJlZ3Rlc3QoKV0pO1xuICAgIGxldCB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0RnVsbFByb3h5KHdhbGxldElkLCBhd2FpdCBMaWJyYXJ5VXRpbHMuZ2V0V29ya2VyKCksIGNvbmZpZy5wYXRoLCBjb25maWcuZ2V0RnMoKSk7XG4gICAgaWYgKGNvbmZpZy5wYXRoKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgJiYgYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC53YWxsZXRFeGlzdHMoY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldEZzKCkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgYWxyZWFkeSBleGlzdHM6IFwiICsgY29uZmlnLmdldFBhdGgoKSk7XG4gICAgbGV0IHdhbGxldElkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIod2FsbGV0SWQsIFwiY3JlYXRlV2FsbGV0RnVsbFwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgbGV0IHdhbGxldCA9IG5ldyBNb25lcm9XYWxsZXRGdWxsUHJveHkod2FsbGV0SWQsIGF3YWl0IExpYnJhcnlVdGlscy5nZXRXb3JrZXIoKSwgY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldEZzKCkpO1xuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJTlNUQU5DRSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBjb25zdHJ1Y3RvciB3aGljaCBpcyBnaXZlbiBhIHdvcmtlciB0byBjb21tdW5pY2F0ZSB3aXRoIHZpYSBtZXNzYWdlcy5cbiAgICogXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBub3QgYmUgY2FsbGVkIGV4dGVybmFsbHkgYnV0IHNob3VsZCBiZSBjYWxsZWQgdGhyb3VnaFxuICAgKiBzdGF0aWMgd2FsbGV0IGNyZWF0aW9uIHV0aWxpdGllcyBpbiB0aGlzIGNsYXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHdhbGxldElkIC0gaWRlbnRpZmllcyB0aGUgd2FsbGV0IHdpdGggdGhlIHdvcmtlclxuICAgKiBAcGFyYW0ge1dvcmtlcn0gd29ya2VyIC0gd29ya2VyIHRvIGNvbW11bmljYXRlIHdpdGggdmlhIG1lc3NhZ2VzXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih3YWxsZXRJZCwgd29ya2VyLCBwYXRoLCBmcykge1xuICAgIHN1cGVyKHdhbGxldElkLCB3b3JrZXIpO1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5mcyA9IGZzID8gZnMgOiAocGF0aCA/IE1vbmVyb1dhbGxldEZ1bGwuZ2V0RnMoKSA6IHVuZGVmaW5lZCk7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzID0gW107XG4gIH1cblxuICBnZXRQYXRoKCkge1xuICAgIHJldHVybiB0aGlzLnBhdGg7XG4gIH1cblxuICBhc3luYyBnZXROZXR3b3JrVHlwZSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXROZXR3b3JrVHlwZVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0U3ViYWRkcmVzc0xhYmVsXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgUHJvbWlzZTx2b2lkPjtcbiAgfVxuICBcbiAgYXN5bmMgc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPclJwY0Nvbm5lY3Rpb24sIGlzVHJ1c3RlZD8pIHtcbiAgICBpZiAoIXVyaU9yUnBjQ29ubmVjdGlvbikgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzZXREYWVtb25Db25uZWN0aW9uXCIsIFt1bmRlZmluZWQsIGlzVHJ1c3RlZF0pO1xuICAgIGVsc2Uge1xuICAgICAgbGV0IGNvbm5lY3Rpb24gPSAhdXJpT3JScGNDb25uZWN0aW9uID8gdW5kZWZpbmVkIDogdXJpT3JScGNDb25uZWN0aW9uIGluc3RhbmNlb2YgTW9uZXJvUnBjQ29ubmVjdGlvbiA/IHVyaU9yUnBjQ29ubmVjdGlvbiA6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yUnBjQ29ubmVjdGlvbik7XG4gICAgICBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInNldERhZW1vbkNvbm5lY3Rpb25cIiwgW2Nvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldENvbmZpZygpIDogdW5kZWZpbmVkLCBpc1RydXN0ZWRdKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBpc0RhZW1vblRydXN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNEYWVtb25UcnVzdGVkXCIpIGFzIFByb21pc2U8Ym9vbGVhbj47XG4gIH1cblxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCkge1xuICAgIGxldCBycGNDb25maWcgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldERhZW1vbkNvbm5lY3Rpb25cIik7XG4gICAgcmV0dXJuIHJwY0NvbmZpZyA/IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHJwY0NvbmZpZykgOiB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNDb25uZWN0ZWRUb0RhZW1vblwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzdG9yZUhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRSZXN0b3JlSGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRSZXN0b3JlSGVpZ2h0XCIsIFtyZXN0b3JlSGVpZ2h0XSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYWVtb25IZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbk1heFBlZXJIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGFlbW9uTWF4UGVlckhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXIsIG1vbnRoLCBkYXkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRIZWlnaHRCeURhdGVcIiwgW3llYXIsIG1vbnRoLCBkYXldKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNEYWVtb25TeW5jZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNEYWVtb25TeW5jZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRIZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgbGV0IHdyYXBwZWRMaXN0ZW5lciA9IG5ldyBXYWxsZXRXb3JrZXJMaXN0ZW5lcihsaXN0ZW5lciwgKCkgPT4gdGhpcy5faXNDbG9zZWQpO1xuICAgIGxldCBsaXN0ZW5lcklkID0gd3JhcHBlZExpc3RlbmVyLmdldElkKCk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25TeW5jUHJvZ3Jlc3NfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uU3luY1Byb2dyZXNzLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk5ld0Jsb2NrX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbk5ld0Jsb2NrLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbkJhbGFuY2VzQ2hhbmdlZF9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25CYWxhbmNlc0NoYW5nZWQsIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0UmVjZWl2ZWRfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uT3V0cHV0UmVjZWl2ZWQsIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0U3BlbnRfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uT3V0cHV0U3BlbnQsIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIHRoaXMud3JhcHBlZExpc3RlbmVycy5wdXNoKHdyYXBwZWRMaXN0ZW5lcik7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiYWRkTGlzdGVuZXJcIiwgW2xpc3RlbmVySWRdKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud3JhcHBlZExpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMud3JhcHBlZExpc3RlbmVyc1tpXS5nZXRMaXN0ZW5lcigpID09PSBsaXN0ZW5lcikge1xuICAgICAgICBsZXQgbGlzdGVuZXJJZCA9IHRoaXMud3JhcHBlZExpc3RlbmVyc1tpXS5nZXRJZCgpO1xuICAgICAgICBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInJlbW92ZUxpc3RlbmVyXCIsIFtsaXN0ZW5lcklkXSk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uU3luY1Byb2dyZXNzX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uTmV3QmxvY2tfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25CYWxhbmNlc0NoYW5nZWRfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRSZWNlaXZlZF9cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFNwZW50X1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIHRoaXMud3JhcHBlZExpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB3YWxsZXRcIik7XG4gIH1cbiAgXG4gIGdldExpc3RlbmVycygpIHtcbiAgICBsZXQgbGlzdGVuZXJzID0gW107XG4gICAgZm9yIChsZXQgd3JhcHBlZExpc3RlbmVyIG9mIHRoaXMud3JhcHBlZExpc3RlbmVycykgbGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyLmdldExpc3RlbmVyKCkpO1xuICAgIHJldHVybiBsaXN0ZW5lcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGlzU3luY2VkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzU3luY2VkXCIpO1xuICB9XG4gIFxuICBhc3luYyBzeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodD86IE1vbmVyb1dhbGxldExpc3RlbmVyIHwgbnVtYmVyLCBzdGFydEhlaWdodD86IG51bWJlciwgYWxsb3dDb25jdXJyZW50Q2FsbHMgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvU3luY1Jlc3VsdD4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBwYXJhbXNcbiAgICBzdGFydEhlaWdodCA9IGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyID8gc3RhcnRIZWlnaHQgOiBsaXN0ZW5lck9yU3RhcnRIZWlnaHQ7XG4gICAgbGV0IGxpc3RlbmVyID0gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIgPyBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gTWF0aC5tYXgoYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSwgYXdhaXQgdGhpcy5nZXRSZXN0b3JlSGVpZ2h0KCkpO1xuICAgIFxuICAgIC8vIHJlZ2lzdGVyIGxpc3RlbmVyIGlmIGdpdmVuXG4gICAgaWYgKGxpc3RlbmVyKSBhd2FpdCB0aGlzLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBcbiAgICAvLyBzeW5jIHdhbGxldCBpbiB3b3JrZXIgXG4gICAgbGV0IGVycjtcbiAgICBsZXQgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzdWx0SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic3luY1wiLCBbc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzXSk7XG4gICAgICByZXN1bHQgPSBuZXcgTW9uZXJvU3luY1Jlc3VsdChyZXN1bHRKc29uLm51bUJsb2Nrc0ZldGNoZWQsIHJlc3VsdEpzb24ucmVjZWl2ZWRNb25leSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyID0gZTtcbiAgICB9XG4gICAgXG4gICAgLy8gdW5yZWdpc3RlciBsaXN0ZW5lclxuICAgIGlmIChsaXN0ZW5lciAmJiAhdGhpcy5faXNDbG9zZWQpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIFxuICAgIC8vIHRocm93IGVycm9yIG9yIHJldHVyblxuICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdGFydFN5bmNpbmdcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICAgIFxuICBhc3luYyBzdG9wU3luY2luZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdG9wU3luY2luZ1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlcykge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4SGFzaGVzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIGhhc2hlcyB0byBzY2FuXCIpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNjYW5UeHNcIiwgW3R4SGFzaGVzXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhblNwZW50KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInJlc2NhblNwZW50XCIpO1xuICB9XG4gICAgXG4gIGFzeW5jIHJlc2NhbkJsb2NrY2hhaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwicmVzY2FuQmxvY2tjaGFpblwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gICAgcmV0dXJuIEJpZ0ludChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEJhbGFuY2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gICAgbGV0IHVubG9ja2VkQmFsYW5jZVN0ciA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VW5sb2NrZWRCYWxhbmNlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIEJpZ0ludCh1bmxvY2tlZEJhbGFuY2VTdHIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzLCB0YWcpIHtcbiAgICBsZXQgYWNjb3VudHMgPSBbXTtcbiAgICBmb3IgKGxldCBhY2NvdW50SnNvbiBvZiAoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBY2NvdW50c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKSkge1xuICAgICAgYWNjb3VudHMucHVzaChNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY291bnRzO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMpIHtcbiAgICBsZXQgYWNjb3VudEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEFjY291bnRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlQWNjb3VudChsYWJlbCkge1xuICAgIGxldCBhY2NvdW50SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY3JlYXRlQWNjb3VudFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXMpIHtcbiAgICBsZXQgc3ViYWRkcmVzc2VzID0gW107XG4gICAgZm9yIChsZXQgc3ViYWRkcmVzc0pzb24gb2YgKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0U3ViYWRkcmVzc2VzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpKSB7XG4gICAgICBzdWJhZGRyZXNzZXMucHVzaChNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhuZXcgTW9uZXJvU3ViYWRkcmVzcyhzdWJhZGRyZXNzSnNvbikpKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1YmFkZHJlc3NlcztcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4LCBsYWJlbCkge1xuICAgIGxldCBzdWJhZGRyZXNzSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY3JlYXRlU3ViYWRkcmVzc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhuZXcgTW9uZXJvU3ViYWRkcmVzcyhzdWJhZGRyZXNzSnNvbikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHMocXVlcnkpIHtcbiAgICBxdWVyeSA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICBsZXQgcmVzcEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFR4c1wiLCBbcXVlcnkuZ2V0QmxvY2soKS50b0pzb24oKV0pO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplVHhzKHF1ZXJ5LCBKU09OLnN0cmluZ2lmeSh7YmxvY2tzOiByZXNwSnNvbi5ibG9ja3N9KSk7IC8vIGluaXRpYWxpemUgdHhzIGZyb20gYmxvY2tzIGpzb24gc3RyaW5nIFRPRE86IHRoaXMgc3RyaW5naWZpZXMgdGhlbiB1dGlsaXR5IHBhcnNlcywgYXZvaWRcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHJhbnNmZXJzKHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgbGV0IGJsb2NrSnNvbnMgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFRyYW5zZmVyc1wiLCBbcXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkudG9Kc29uKCldKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZVRyYW5zZmVycyhxdWVyeSwgSlNPTi5zdHJpbmdpZnkoe2Jsb2NrczogYmxvY2tKc29uc30pKTsgLy8gaW5pdGlhbGl6ZSB0cmFuc2ZlcnMgZnJvbSBibG9ja3MganNvbiBzdHJpbmcgVE9ETzogdGhpcyBzdHJpbmdpZmllcyB0aGVuIHV0aWxpdHkgcGFyc2VzLCBhdm9pZFxuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRzKHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplT3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIGxldCBibG9ja0pzb25zID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRPdXRwdXRzXCIsIFtxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKS50b0pzb24oKV0pO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplT3V0cHV0cyhxdWVyeSwgSlNPTi5zdHJpbmdpZnkoe2Jsb2NrczogYmxvY2tKc29uc30pKTsgLy8gaW5pdGlhbGl6ZSB0cmFuc2ZlcnMgZnJvbSBibG9ja3MganNvbiBzdHJpbmcgVE9ETzogdGhpcyBzdHJpbmdpZmllcyB0aGVuIHV0aWxpdHkgcGFyc2VzLCBhdm9pZFxuICB9XG4gIFxuICBhc3luYyBleHBvcnRPdXRwdXRzKGFsbCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImV4cG9ydE91dHB1dHNcIiwgW2FsbF0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpbXBvcnRPdXRwdXRzXCIsIFtvdXRwdXRzSGV4XSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydEtleUltYWdlcyhhbGwpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0S2V5SW1hZ2VzXCIsIFthbGxdKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydEtleUltYWdlcyhrZXlJbWFnZXMsIG9mZnNldCA9IDApIHtcbiAgICBsZXQga2V5SW1hZ2VzSnNvbiA9IFtdO1xuICAgIGZvciAobGV0IGtleUltYWdlIG9mIGtleUltYWdlcykga2V5SW1hZ2VzSnNvbi5wdXNoKGtleUltYWdlLnRvSnNvbigpKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiaW1wb3J0S2V5SW1hZ2VzXCIsIFtrZXlJbWFnZXNKc29uLCBvZmZzZXRdKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb1dhbGxldEZ1bGwuZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKSBub3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImZyZWV6ZU91dHB1dFwiLCBba2V5SW1hZ2VdKTtcbiAgfVxuICBcbiAgYXN5bmMgdGhhd091dHB1dChrZXlJbWFnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInRoYXdPdXRwdXRcIiwgW2tleUltYWdlXSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzT3V0cHV0RnJvemVuKGtleUltYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNPdXRwdXRGcm96ZW5cIiwgW2tleUltYWdlXSk7XG4gIH1cblxuICBhc3luYyBnZXREZWZhdWx0RmVlUHJpb3JpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGVmYXVsdEZlZVByaW9yaXR5XCIpO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnKSB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGxldCB0eFNldEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNyZWF0ZVR4c1wiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pLmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcE91dHB1dChjb25maWcpIHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWcoY29uZmlnKTtcbiAgICBsZXQgdHhTZXRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzd2VlcE91dHB1dFwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pLmdldFR4cygpWzBdO1xuICB9XG5cbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWcpIHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyhjb25maWcpO1xuICAgIGxldCB0eFNldHNKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzd2VlcFVubG9ja2VkXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgdHhTZXRKc29uIG9mIHR4U2V0c0pzb24pIGZvciAobGV0IHR4IG9mIG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pLmdldFR4cygpKSB0eHMucHVzaCh0eCk7XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInN3ZWVwRHVzdFwiLCBbcmVsYXldKSkuZ2V0VHhzKCkgfHwgW107XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzKHR4c09yTWV0YWRhdGFzKSB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhzT3JNZXRhZGF0YXMpLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0eHMgb3IgdGhlaXIgbWV0YWRhdGEgdG8gcmVsYXlcIik7XG4gICAgbGV0IHR4TWV0YWRhdGFzID0gW107XG4gICAgZm9yIChsZXQgdHhPck1ldGFkYXRhIG9mIHR4c09yTWV0YWRhdGFzKSB0eE1ldGFkYXRhcy5wdXNoKHR4T3JNZXRhZGF0YSBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0ID8gdHhPck1ldGFkYXRhLmdldE1ldGFkYXRhKCkgOiB0eE9yTWV0YWRhdGEpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInJlbGF5VHhzXCIsIFt0eE1ldGFkYXRhc10pO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRlc2NyaWJlVHhTZXRcIiwgW3R4U2V0LnRvSnNvbigpXSkpO1xuICB9XG4gIFxuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXgpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2lnblR4c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3VibWl0VHhzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzaWduTWVzc2FnZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyB2ZXJpZnlNZXNzYWdlKG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInZlcmlmeU1lc3NhZ2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4S2V5KHR4SGFzaCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFR4S2V5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhLZXkodHhIYXNoLCB0eEtleSwgYWRkcmVzcykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQ2hlY2tUeChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNoZWNrVHhLZXlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHhQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0NoZWNrVHgoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGVja1R4UHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0U3BlbmRQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJjaGVja1NwZW5kUHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRSZXNlcnZlUHJvb2ZXYWxsZXRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4LCBhbW91bnQsIG1lc3NhZ2UpIHtcbiAgICB0cnkgeyByZXR1cm4gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRSZXNlcnZlUHJvb2ZBY2NvdW50XCIsIFthY2NvdW50SWR4LCBhbW91bnQudG9TdHJpbmcoKSwgbWVzc2FnZV0pOyB9XG4gICAgY2F0Y2ggKGU6IGFueSkgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZS5tZXNzYWdlLCAtMSk7IH1cbiAgfVxuXG4gIGFzeW5jIGNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICAgIHRyeSB7IHJldHVybiBuZXcgTW9uZXJvQ2hlY2tSZXNlcnZlKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2hlY2tSZXNlcnZlUHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7IH1cbiAgICBjYXRjaCAoZTogYW55KSB7IHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UsIC0xKTsgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeE5vdGVzKHR4SGFzaGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHhOb3Rlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzLCBub3Rlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldFR4Tm90ZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcykge1xuICAgIGlmICghZW50cnlJbmRpY2VzKSBlbnRyeUluZGljZXMgPSBbXTtcbiAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgIGZvciAobGV0IGVudHJ5SnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEFkZHJlc3NCb29rRW50cmllc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb0FkZHJlc3NCb29rRW50cnkoZW50cnlKc29uKSk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG4gIFxuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3MsIGRlc2NyaXB0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiYWRkQWRkcmVzc0Jvb2tFbnRyeVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBlZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZWRpdEFkZHJlc3NCb29rRW50cnlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRlbGV0ZUFkZHJlc3NCb29rRW50cnlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgdGFnQWNjb3VudHModGFnLCBhY2NvdW50SW5kaWNlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInRhZ0FjY291bnRzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cblxuICBhc3luYyB1bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwidW50YWdBY2NvdW50c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50VGFncygpIHtcbiAgICBsZXQgYWNjb3VudFRhZ3MgPSBbXTtcbiAgICBmb3IgKGxldCBhY2NvdW50VGFnSnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEFjY291bnRUYWdzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpIHtcbiAgICAgIGFjY291bnRUYWdzLnB1c2gobmV3IE1vbmVyb0FjY291bnRUYWcoYWNjb3VudFRhZ0pzb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY291bnRUYWdzO1xuICB9XG5cbiAgYXN5bmMgc2V0QWNjb3VudFRhZ0xhYmVsKHRhZywgbGFiZWwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRBY2NvdW50VGFnTGFiZWxcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWcpIHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UGF5bWVudFVyaVwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmkpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4Q29uZmlnKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwicGFyc2VQYXltZW50VXJpXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QXR0cmlidXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXksIHZhbCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldEF0dHJpYnV0ZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RhcnRNaW5pbmdcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdG9wTWluaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc011bHRpc2lnXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NdWx0aXNpZ0luZm8oYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRNdWx0aXNpZ0luZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwicHJlcGFyZU11bHRpc2lnXCIpO1xuICB9XG4gIFxuICBhc3luYyBtYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlcywgdGhyZXNob2xkLCBwYXNzd29yZCkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcIm1ha2VNdWx0aXNpZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBleGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzLCBwYXNzd29yZCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZXhjaGFuZ2VNdWx0aXNpZ0tleXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImV4cG9ydE11bHRpc2lnSGV4XCIpO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzLCByZWZyZXNoQWZ0ZXJJbXBvcnQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpbXBvcnRNdWx0aXNpZ0hleFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzaWduTXVsdGlzaWdUeEhleFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3VibWl0TXVsdGlzaWdUeEhleFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXREYXRhKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldERhdGFcIik7XG4gIH1cbiAgXG4gIGFzeW5jIG1vdmVUbyhwYXRoKSB7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwubW92ZVRvKHBhdGgsIHRoaXMpO1xuICB9XG4gIFxuICBhc3luYyBjaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpIHtcbiAgICBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNoYW5nZVBhc3N3b3JkXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgaWYgKHRoaXMucGF0aCkgYXdhaXQgdGhpcy5zYXZlKCk7IC8vIGF1dG8gc2F2ZVxuICB9XG4gIFxuICBhc3luYyBzYXZlKCkge1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhdmUodGhpcyk7XG4gIH1cblxuICBhc3luYyBpc0Nsb3NlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5faXNDbG9zZWQgfHwgc3VwZXIuaXNDbG9zZWQoKTtcbiAgfVxuXG4gIGFzeW5jIGNsb3NlKHNhdmUpIHtcbiAgICB0aGlzLl9pc0Nsb3NlZCA9IHRydWU7XG4gICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJwcmVwYXJlQ2xvc2VcIik7XG4gICAgaWYgKHNhdmUpIHtcbiAgICAgIGF3YWl0IExpYnJhcnlVdGlscy5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBzbmFwc2hvdCA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0Q2xvc2VEYXRhXCIpO1xuICAgICAgICBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLndyaXRlV2FsbGV0RGF0YSh0aGlzLCBzbmFwc2hvdC5kYXRhLCBzbmFwc2hvdC5wcmltYXJ5QWRkcmVzcyk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgYXdhaXQgc3VwZXIuY2xvc2UoZmFsc2UpO1xuICAgIHRoaXMud3JhcHBlZExpc3RlbmVycy5sZW5ndGggPSAwO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIExJU1RFTklORyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLyoqXG4gKiBSZWNlaXZlcyBub3RpZmljYXRpb25zIGRpcmVjdGx5IGZyb20gd2FzbSBjKysuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIFdhbGxldFdhc21MaXN0ZW5lciB7XG5cbiAgcHJvdGVjdGVkIHdhbGxldDogTW9uZXJvV2FsbGV0O1xuICBcbiAgY29uc3RydWN0b3Iod2FsbGV0KSB7XG4gICAgdGhpcy53YWxsZXQgPSB3YWxsZXQ7XG4gIH1cbiAgXG4gIGFzeW5jIG9uU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpIHtcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZVN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKTtcbiAgfVxuICBcbiAgYXN5bmMgb25OZXdCbG9jayhoZWlnaHQpIHtcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU5ld0Jsb2NrKGhlaWdodCk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uQmFsYW5jZXNDaGFuZ2VkKG5ld0JhbGFuY2VTdHIsIG5ld1VubG9ja2VkQmFsYW5jZVN0cikge1xuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlQmFsYW5jZXNDaGFuZ2VkKG5ld0JhbGFuY2VTdHIsIG5ld1VubG9ja2VkQmFsYW5jZVN0cik7XG4gIH1cbiAgXG4gIGFzeW5jIG9uT3V0cHV0UmVjZWl2ZWQoaGVpZ2h0LCB0eEhhc2gsIGFtb3VudFN0ciwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgdmVyc2lvbiwgdW5sb2NrVGltZSwgaXNMb2NrZWQpIHtcbiAgICBcbiAgICAvLyBidWlsZCByZWNlaXZlZCBvdXRwdXRcbiAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCgpO1xuICAgIG91dHB1dC5zZXRBbW91bnQoQmlnSW50KGFtb3VudFN0cikpO1xuICAgIG91dHB1dC5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgb3V0cHV0LnNldFN1YmFkZHJlc3NJbmRleChzdWJhZGRyZXNzSWR4KTtcbiAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICB0eC5zZXRIYXNoKHR4SGFzaCk7XG4gICAgdHguc2V0VmVyc2lvbih2ZXJzaW9uKTtcbiAgICB0eC5zZXRVbmxvY2tUaW1lKHVubG9ja1RpbWUpO1xuICAgIG91dHB1dC5zZXRUeCh0eCk7XG4gICAgdHguc2V0T3V0cHV0cyhbb3V0cHV0XSk7XG4gICAgdHguc2V0SXNJbmNvbWluZyh0cnVlKTtcbiAgICB0eC5zZXRJc0xvY2tlZChpc0xvY2tlZCk7XG4gICAgaWYgKGhlaWdodCA+IDApIHtcbiAgICAgIGxldCBibG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldEhlaWdodChoZWlnaHQpO1xuICAgICAgYmxvY2suc2V0VHhzKFt0eCBhcyBNb25lcm9UeF0pO1xuICAgICAgdHguc2V0QmxvY2soYmxvY2spO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKHRydWUpO1xuICAgIH1cbiAgICBcbiAgICAvLyBhbm5vdW5jZSBvdXRwdXRcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFJlY2VpdmVkKG91dHB1dCk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uT3V0cHV0U3BlbnQoaGVpZ2h0LCB0eEhhc2gsIGFtb3VudFN0ciwgYWNjb3VudElkeFN0ciwgc3ViYWRkcmVzc0lkeFN0ciwgdmVyc2lvbiwgdW5sb2NrVGltZSwgaXNMb2NrZWQpIHtcbiAgICBcbiAgICAvLyBidWlsZCBzcGVudCBvdXRwdXRcbiAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCgpO1xuICAgIG91dHB1dC5zZXRBbW91bnQoQmlnSW50KGFtb3VudFN0cikpO1xuICAgIGlmIChhY2NvdW50SWR4U3RyKSBvdXRwdXQuc2V0QWNjb3VudEluZGV4KHBhcnNlSW50KGFjY291bnRJZHhTdHIpKTtcbiAgICBpZiAoc3ViYWRkcmVzc0lkeFN0cikgb3V0cHV0LnNldFN1YmFkZHJlc3NJbmRleChwYXJzZUludChzdWJhZGRyZXNzSWR4U3RyKSk7XG4gICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgdHguc2V0SGFzaCh0eEhhc2gpO1xuICAgIHR4LnNldFZlcnNpb24odmVyc2lvbik7XG4gICAgdHguc2V0VW5sb2NrVGltZSh1bmxvY2tUaW1lKTtcbiAgICB0eC5zZXRJc0xvY2tlZChpc0xvY2tlZCk7XG4gICAgb3V0cHV0LnNldFR4KHR4KTtcbiAgICB0eC5zZXRJbnB1dHMoW291dHB1dF0pO1xuICAgIGlmIChoZWlnaHQgPiAwKSB7XG4gICAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRIZWlnaHQoaGVpZ2h0KTtcbiAgICAgIGJsb2NrLnNldFR4cyhbdHhdKTtcbiAgICAgIHR4LnNldEJsb2NrKGJsb2NrKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gYW5ub3VuY2Ugb3V0cHV0XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRTcGVudChvdXRwdXQpO1xuICB9XG59XG5cbi8qKlxuICogSW50ZXJuYWwgbGlzdGVuZXIgdG8gYnJpZGdlIG5vdGlmaWNhdGlvbnMgdG8gZXh0ZXJuYWwgbGlzdGVuZXJzLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRXb3JrZXJMaXN0ZW5lciB7XG5cbiAgcHJvdGVjdGVkIGlkOiBhbnk7XG4gIHByb3RlY3RlZCBsaXN0ZW5lcjogYW55O1xuICBwcm90ZWN0ZWQgaXNDbG9zZWQ6ICgpID0+IGJvb2xlYW47XG4gIFxuICBjb25zdHJ1Y3RvcihsaXN0ZW5lciwgaXNDbG9zZWQpIHtcbiAgICB0aGlzLmlkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgIHRoaXMubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgICB0aGlzLmlzQ2xvc2VkID0gaXNDbG9zZWQ7XG4gIH1cbiAgXG4gIGdldElkKCkge1xuICAgIHJldHVybiB0aGlzLmlkO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcjtcbiAgfVxuICBcbiAgb25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkge1xuICAgIGlmICh0aGlzLmlzQ2xvc2VkKCkpIHJldHVybjtcbiAgICB0aGlzLmxpc3RlbmVyLm9uU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpO1xuICB9XG5cbiAgYXN5bmMgb25OZXdCbG9jayhoZWlnaHQpIHtcbiAgICBpZiAodGhpcy5pc0Nsb3NlZCgpKSByZXR1cm47XG4gICAgYXdhaXQgdGhpcy5saXN0ZW5lci5vbk5ld0Jsb2NrKGhlaWdodCk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uQmFsYW5jZXNDaGFuZ2VkKG5ld0JhbGFuY2VTdHIsIG5ld1VubG9ja2VkQmFsYW5jZVN0cikge1xuICAgIGlmICh0aGlzLmlzQ2xvc2VkKCkpIHJldHVybjtcbiAgICBhd2FpdCB0aGlzLmxpc3RlbmVyLm9uQmFsYW5jZXNDaGFuZ2VkKEJpZ0ludChuZXdCYWxhbmNlU3RyKSwgQmlnSW50KG5ld1VubG9ja2VkQmFsYW5jZVN0cikpO1xuICB9XG5cbiAgYXN5bmMgb25PdXRwdXRSZWNlaXZlZChibG9ja0pzb24pIHtcbiAgICBpZiAodGhpcy5pc0Nsb3NlZCgpKSByZXR1cm47XG4gICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9XQUxMRVQpO1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25PdXRwdXRSZWNlaXZlZChibG9jay5nZXRUeHMoKVswXS5nZXRPdXRwdXRzKClbMF0pO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFNwZW50KGJsb2NrSnNvbikge1xuICAgIGlmICh0aGlzLmlzQ2xvc2VkKCkpIHJldHVybjtcbiAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1dBTExFVCk7XG4gICAgYXdhaXQgdGhpcy5saXN0ZW5lci5vbk91dHB1dFNwZW50KGJsb2NrLmdldFR4cygpWzBdLmdldElucHV0cygpWzBdKTtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsS0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsU0FBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsYUFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksV0FBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssY0FB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