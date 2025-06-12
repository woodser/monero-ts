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
var _MoneroKeyImage = _interopRequireDefault(require("../daemon/model/MoneroKeyImage"));
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

  async setDaemonConnection(uriOrConnection) {
    if (this.getWalletProxy()) return this.getWalletProxy().setDaemonConnection(uriOrConnection);

    // normalize connection
    let connection = !uriOrConnection ? undefined : uriOrConnection instanceof _MoneroRpcConnection.default ? uriOrConnection : new _MoneroRpcConnection.default(uriOrConnection);
    let uri = connection && connection.getUri() ? connection.getUri() : "";
    let username = connection && connection.getUsername() ? connection.getUsername() : "";
    let password = connection && connection.getPassword() ? connection.getPassword() : "";
    let rejectUnauthorized = connection ? connection.getRejectUnauthorized() : undefined;
    this.rejectUnauthorized = rejectUnauthorized; // persist locally

    // set connection in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.set_daemon_connection(this.cppAddress, uri, username, password, (resp) => {
          resolve();
        });
      });
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
          resolve(new _MoneroRpcConnection.default({ uri: jsonConnection.uri, username: jsonConnection.username, password: jsonConnection.password, rejectUnauthorized: this.rejectUnauthorized }));
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
    if (!(await this.isConnectedToDaemon())) throw new _MoneroError.default("Wallet is not connected to daemon");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_daemon_height(this.cppAddress, (resp) => {
          resolve(resp);
        });
      });
    });
  }

  async getHeightByDate(year, month, day) {
    if (this.getWalletProxy()) return this.getWalletProxy().getHeightByDate(year, month, day);
    if (!(await this.isConnectedToDaemon())) throw new _MoneroError.default("Wallet is not connected to daemon");
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
    if (!(await this.isConnectedToDaemon())) throw new _MoneroError.default("Wallet is not connected to daemon");

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
        return new Promise((resolve, reject) => {

          // sync wallet in wasm which invokes callback when done
          that.module.sync(that.cppAddress, startHeight, async (resp) => {
            if (resp.charAt(0) !== '{') reject(new _MoneroError.default(resp));else
            {
              let respJson = JSON.parse(resp);
              resolve(new _MoneroSyncResult.default(respJson.numBlocksFetched, respJson.receivedMoney));
            }
          });
        });
      }
    } catch (e) {
      err = e;
    }

    // unregister listener
    if (listener) await this.removeListener(listener);

    // throw error or return
    if (err) throw err;
    return result;
  }

  async startSyncing(syncPeriodInMs) {
    if (this.getWalletProxy()) return this.getWalletProxy().startSyncing(syncPeriodInMs);
    if (!(await this.isConnectedToDaemon())) throw new _MoneroError.default("Wallet is not connected to daemon");
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
        this.module.rescan_spent(this.cppAddress, () => resolve());
      });
    });
  }

  async rescanBlockchain() {
    if (this.getWalletProxy()) return this.getWalletProxy().rescanBlockchain();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.rescan_blockchain(this.cppAddress, () => resolve());
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
        this.module.export_key_images(this.cppAddress, all, (keyImagesStr) => {
          if (keyImagesStr.charAt(0) !== '{') reject(new _MoneroError.default(keyImagesStr)); // json expected, else error
          else {
            let keyImages = [];
            for (let keyImageJson of JSON.parse(_GenUtils.default.stringifyBigInts(keyImagesStr)).keyImages) keyImages.push(new _MoneroKeyImage.default(keyImageJson));
            resolve(keyImages);
          }
        });
      });
    });
  }

  async importKeyImages(keyImages) {
    if (this.getWalletProxy()) return this.getWalletProxy().importKeyImages(keyImages);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.import_key_images(this.cppAddress, JSON.stringify({ keyImages: keyImages.map((keyImage) => keyImage.toJson()) }), (keyImageImportResultStr) => {
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

  async importMultisigHex(multisigHexes) {
    if (this.getWalletProxy()) return this.getWalletProxy().importMultisigHex(multisigHexes);
    if (!_GenUtils.default.isArray(multisigHexes)) throw new _MoneroError.default("Must provide string[] to importMultisigHex()");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.import_multisig_hex(this.cppAddress, JSON.stringify({ multisigHexes: multisigHexes }), (resp) => {
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

    // queue call to wasm module
    let viewOnly = await this.isViewOnly();
    return this.module.queueTask(async () => {
      this.assertNotClosed();

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
    });
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

  async close(save = false) {
    if (this._isClosed) return; // no effect if closed
    if (save) await this.save();
    if (this.getWalletProxy()) {
      await this.getWalletProxy().close(false);
      await super.close();
      return;
    }
    await this.refreshListening();
    await this.stopSyncing();
    await super.close();
    delete this.path;
    delete this.password;
    delete this.wasmListener;
    _LibraryUtils.default.setRejectUnauthorizedFn(this.rejectUnauthorizedConfigId, undefined); // unregister fn informing if unauthorized reqs should be rejected
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
        module.open_wallet_full(config.password, config.networkType, config.keysData ?? "", config.cacheData ?? "", daemonUri, daemonUsername, daemonPassword, rejectUnauthorizedFnId, (cppAddress) => {
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
    let isEnabled = this.listeners.length > 0;
    if (this.wasmListenerHandle === 0 && !isEnabled || this.wasmListenerHandle > 0 && isEnabled) return; // no difference
    return this.module.queueTask(async () => {
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

      // path must be set
      let path = await wallet.getPath();
      if (!path) throw new _MoneroError.default("Cannot save wallet because path is not set");

      // get wallet data
      const data = await wallet.getData();

      // write wallet files to *.new
      let pathNew = path + ".new";
      await wallet.fs.writeFile(pathNew + ".keys", data[0], "binary");
      await wallet.fs.writeFile(pathNew, data[1], "binary");
      await wallet.fs.writeFile(pathNew + ".address.txt", await wallet.getPrimaryAddress());

      // replace old wallet files with new
      await wallet.fs.rename(pathNew + ".keys", path + ".keys");
      await wallet.fs.rename(pathNew, path);
      await wallet.fs.rename(pathNew + ".address.txt", path + ".address.txt");
    });
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

  async setDaemonConnection(uriOrRpcConnection) {
    if (!uriOrRpcConnection) await this.invokeWorker("setDaemonConnection");else
    {
      let connection = !uriOrRpcConnection ? undefined : uriOrRpcConnection instanceof _MoneroRpcConnection.default ? uriOrRpcConnection : new _MoneroRpcConnection.default(uriOrRpcConnection);
      await this.invokeWorker("setDaemonConnection", connection ? connection.getConfig() : undefined);
    }
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
    let wrappedListener = new WalletWorkerListener(listener);
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
    if (listener) await this.removeListener(listener);

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
    let keyImages = [];
    for (let keyImageJson of await this.invokeWorker("getKeyImages", [all])) keyImages.push(new _MoneroKeyImage.default(keyImageJson));
    return keyImages;
  }

  async importKeyImages(keyImages) {
    let keyImagesJson = [];
    for (let keyImage of keyImages) keyImagesJson.push(keyImage.toJson());
    return new _MoneroKeyImageImportResult.default(await this.invokeWorker("importKeyImages", [keyImagesJson]));
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

  async importMultisigHex(multisigHexes) {
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

  async close(save) {
    if (await this.isClosed()) return;
    if (save) await this.save();
    while (this.wrappedListeners.length) await this.removeListener(this.wrappedListeners[0].getListener());
    await super.close(false);
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




  constructor(listener) {
    this.id = _GenUtils.default.getUUID();
    this.listener = listener;
  }

  getId() {
    return this.id;
  }

  getListener() {
    return this.listener;
  }

  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    this.listener.onSyncProgress(height, startHeight, endHeight, percentDone, message);
  }

  async onNewBlock(height) {
    await this.listener.onNewBlock(height);
  }

  async onBalancesChanged(newBalanceStr, newUnlockedBalanceStr) {
    await this.listener.onBalancesChanged(BigInt(newBalanceStr), BigInt(newUnlockedBalanceStr));
  }

  async onOutputReceived(blockJson) {
    let block = new _MoneroBlock.default(blockJson, _MoneroBlock.default.DeserializationType.TX_WALLET);
    await this.listener.onOutputReceived(block.getTxs()[0].getOutputs()[0]);
  }

  async onOutputSpent(blockJson) {
    let block = new _MoneroBlock.default(blockJson, _MoneroBlock.default.DeserializationType.TX_WALLET);
    await this.listener.onOutputSpent(block.getTxs()[0].getInputs()[0]);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfcGF0aCIsIl9HZW5VdGlscyIsIl9MaWJyYXJ5VXRpbHMiLCJfVGFza0xvb3BlciIsIl9Nb25lcm9BY2NvdW50IiwiX01vbmVyb0FjY291bnRUYWciLCJfTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1JwY0Nvbm5lY3Rpb24iLCJfTW9uZXJvU3ViYWRkcmVzcyIsIl9Nb25lcm9TeW5jUmVzdWx0IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4U2V0IiwiX01vbmVyb1R4V2FsbGV0IiwiX01vbmVyb1dhbGxldCIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRMaXN0ZW5lciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiX2ZzIiwiTW9uZXJvV2FsbGV0RnVsbCIsIk1vbmVyb1dhbGxldEtleXMiLCJERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIiwiY29uc3RydWN0b3IiLCJjcHBBZGRyZXNzIiwicGF0aCIsInBhc3N3b3JkIiwiZnMiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJyZWplY3RVbmF1dGhvcml6ZWRGbklkIiwid2FsbGV0UHJveHkiLCJsaXN0ZW5lcnMiLCJnZXRGcyIsInVuZGVmaW5lZCIsIl9pc0Nsb3NlZCIsIndhc21MaXN0ZW5lciIsIldhbGxldFdhc21MaXN0ZW5lciIsIndhc21MaXN0ZW5lckhhbmRsZSIsInJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkIiwic3luY1BlcmlvZEluTXMiLCJMaWJyYXJ5VXRpbHMiLCJzZXRSZWplY3RVbmF1dGhvcml6ZWRGbiIsIndhbGxldEV4aXN0cyIsImFzc2VydCIsIk1vbmVyb0Vycm9yIiwiZXhpc3RzIiwibG9nIiwib3BlbldhbGxldCIsImNvbmZpZyIsIk1vbmVyb1dhbGxldENvbmZpZyIsImdldFByb3h5VG9Xb3JrZXIiLCJzZXRQcm94eVRvV29ya2VyIiwiZ2V0U2VlZCIsImdldFNlZWRPZmZzZXQiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0UmVzdG9yZUhlaWdodCIsImdldExhbmd1YWdlIiwiZ2V0U2F2ZUN1cnJlbnQiLCJzZXRGcyIsImdldENvbm5lY3Rpb25NYW5hZ2VyIiwiZ2V0U2VydmVyIiwic2V0U2VydmVyIiwiZ2V0Q29ubmVjdGlvbiIsImdldEtleXNEYXRhIiwiZ2V0UGF0aCIsInNldEtleXNEYXRhIiwicmVhZEZpbGUiLCJzZXRDYWNoZURhdGEiLCJ3YWxsZXQiLCJvcGVuV2FsbGV0RGF0YSIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwiY3JlYXRlV2FsbGV0IiwiZ2V0TmV0d29ya1R5cGUiLCJNb25lcm9OZXR3b3JrVHlwZSIsInZhbGlkYXRlIiwic2V0UGF0aCIsImdldFBhc3N3b3JkIiwic2V0UGFzc3dvcmQiLCJNb25lcm9XYWxsZXRGdWxsUHJveHkiLCJjcmVhdGVXYWxsZXRGcm9tU2VlZCIsImNyZWF0ZVdhbGxldEZyb21LZXlzIiwiY3JlYXRlV2FsbGV0UmFuZG9tIiwiZGFlbW9uQ29ubmVjdGlvbiIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFJlc3RvcmVIZWlnaHQiLCJzZXRTZWVkT2Zmc2V0IiwibW9kdWxlIiwibG9hZFdhc21Nb2R1bGUiLCJxdWV1ZVRhc2siLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIkdlblV0aWxzIiwiZ2V0VVVJRCIsImNyZWF0ZV9mdWxsX3dhbGxldCIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0b0pzb24iLCJzYXZlIiwic2V0UHJpbWFyeUFkZHJlc3MiLCJzZXRQcml2YXRlVmlld0tleSIsInNldFByaXZhdGVTcGVuZEtleSIsInNldExhbmd1YWdlIiwiZ2V0U2VlZExhbmd1YWdlcyIsInBhcnNlIiwiZ2V0X2tleXNfd2FsbGV0X3NlZWRfbGFuZ3VhZ2VzIiwibGFuZ3VhZ2VzIiwiRlMiLCJwcm9taXNlcyIsImdldERhZW1vbk1heFBlZXJIZWlnaHQiLCJnZXRXYWxsZXRQcm94eSIsImFzc2VydE5vdENsb3NlZCIsImdldF9kYWVtb25fbWF4X3BlZXJfaGVpZ2h0IiwicmVzcCIsImlzRGFlbW9uU3luY2VkIiwiaXNfZGFlbW9uX3N5bmNlZCIsImlzU3luY2VkIiwiaXNfc3luY2VkIiwiZ2V0X25ldHdvcmtfdHlwZSIsImdldF9yZXN0b3JlX2hlaWdodCIsInJlc3RvcmVIZWlnaHQiLCJzZXRfcmVzdG9yZV9oZWlnaHQiLCJtb3ZlVG8iLCJhZGRMaXN0ZW5lciIsImxpc3RlbmVyIiwicmVmcmVzaExpc3RlbmluZyIsInJlbW92ZUxpc3RlbmVyIiwiZ2V0TGlzdGVuZXJzIiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsInVyaU9yQ29ubmVjdGlvbiIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwidXJpIiwiZ2V0VXJpIiwidXNlcm5hbWUiLCJnZXRVc2VybmFtZSIsInNldF9kYWVtb25fY29ubmVjdGlvbiIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJjb25uZWN0aW9uQ29udGFpbmVyU3RyIiwiZ2V0X2RhZW1vbl9jb25uZWN0aW9uIiwianNvbkNvbm5lY3Rpb24iLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiaXNfY29ubmVjdGVkX3RvX2RhZW1vbiIsImdldFZlcnNpb24iLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInN0YW5kYXJkQWRkcmVzcyIsInBheW1lbnRJZCIsInJlc3VsdCIsImdldF9pbnRlZ3JhdGVkX2FkZHJlc3MiLCJjaGFyQXQiLCJNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsImVyciIsIm1lc3NhZ2UiLCJpbmNsdWRlcyIsImRlY29kZUludGVncmF0ZWRBZGRyZXNzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJkZWNvZGVfaW50ZWdyYXRlZF9hZGRyZXNzIiwiZ2V0SGVpZ2h0IiwiZ2V0X2hlaWdodCIsImdldERhZW1vbkhlaWdodCIsImdldF9kYWVtb25faGVpZ2h0IiwiZ2V0SGVpZ2h0QnlEYXRlIiwieWVhciIsIm1vbnRoIiwiZGF5IiwiZ2V0X2hlaWdodF9ieV9kYXRlIiwic3luYyIsImxpc3RlbmVyT3JTdGFydEhlaWdodCIsInN0YXJ0SGVpZ2h0IiwiYWxsb3dDb25jdXJyZW50Q2FsbHMiLCJNb25lcm9XYWxsZXRMaXN0ZW5lciIsIk1hdGgiLCJtYXgiLCJ0aGF0Iiwic3luY1dhc20iLCJyZXNwSnNvbiIsIk1vbmVyb1N5bmNSZXN1bHQiLCJudW1CbG9ja3NGZXRjaGVkIiwicmVjZWl2ZWRNb25leSIsImUiLCJzdGFydFN5bmNpbmciLCJzeW5jTG9vcGVyIiwiVGFza0xvb3BlciIsImJhY2tncm91bmRTeW5jIiwic3RhcnQiLCJzdG9wU3luY2luZyIsInN0b3AiLCJzdG9wX3N5bmNpbmciLCJzY2FuVHhzIiwidHhIYXNoZXMiLCJzY2FuX3R4cyIsInJlc2NhblNwZW50IiwicmVzY2FuX3NwZW50IiwicmVzY2FuQmxvY2tjaGFpbiIsInJlc2Nhbl9ibG9ja2NoYWluIiwiZ2V0QmFsYW5jZSIsImFjY291bnRJZHgiLCJzdWJhZGRyZXNzSWR4IiwiYmFsYW5jZVN0ciIsImdldF9iYWxhbmNlX3dhbGxldCIsImdldF9iYWxhbmNlX2FjY291bnQiLCJnZXRfYmFsYW5jZV9zdWJhZGRyZXNzIiwiQmlnSW50Iiwic3RyaW5naWZ5QmlnSW50cyIsImJhbGFuY2UiLCJnZXRVbmxvY2tlZEJhbGFuY2UiLCJ1bmxvY2tlZEJhbGFuY2VTdHIiLCJnZXRfdW5sb2NrZWRfYmFsYW5jZV93YWxsZXQiLCJnZXRfdW5sb2NrZWRfYmFsYW5jZV9hY2NvdW50IiwiZ2V0X3VubG9ja2VkX2JhbGFuY2Vfc3ViYWRkcmVzcyIsInVubG9ja2VkQmFsYW5jZSIsImdldEFjY291bnRzIiwiaW5jbHVkZVN1YmFkZHJlc3NlcyIsInRhZyIsImFjY291bnRzU3RyIiwiZ2V0X2FjY291bnRzIiwiYWNjb3VudHMiLCJhY2NvdW50SnNvbiIsInB1c2giLCJzYW5pdGl6ZUFjY291bnQiLCJNb25lcm9BY2NvdW50IiwiZ2V0QWNjb3VudCIsImFjY291bnRTdHIiLCJnZXRfYWNjb3VudCIsImNyZWF0ZUFjY291bnQiLCJsYWJlbCIsImNyZWF0ZV9hY2NvdW50IiwiZ2V0U3ViYWRkcmVzc2VzIiwic3ViYWRkcmVzc0luZGljZXMiLCJhcmdzIiwibGlzdGlmeSIsInN1YmFkZHJlc3Nlc0pzb24iLCJnZXRfc3ViYWRkcmVzc2VzIiwic3ViYWRkcmVzc2VzIiwic3ViYWRkcmVzc0pzb24iLCJzYW5pdGl6ZVN1YmFkZHJlc3MiLCJNb25lcm9TdWJhZGRyZXNzIiwiY3JlYXRlU3ViYWRkcmVzcyIsInN1YmFkZHJlc3NTdHIiLCJjcmVhdGVfc3ViYWRkcmVzcyIsInNldFN1YmFkZHJlc3NMYWJlbCIsInNldF9zdWJhZGRyZXNzX2xhYmVsIiwiZ2V0VHhzIiwicXVlcnkiLCJxdWVyeU5vcm1hbGl6ZWQiLCJNb25lcm9XYWxsZXQiLCJub3JtYWxpemVUeFF1ZXJ5IiwiZ2V0X3R4cyIsImdldEJsb2NrIiwiYmxvY2tzSnNvblN0ciIsImRlc2VyaWFsaXplVHhzIiwiZ2V0VHJhbnNmZXJzIiwibm9ybWFsaXplVHJhbnNmZXJRdWVyeSIsImdldF90cmFuc2ZlcnMiLCJnZXRUeFF1ZXJ5IiwiZGVzZXJpYWxpemVUcmFuc2ZlcnMiLCJnZXRPdXRwdXRzIiwibm9ybWFsaXplT3V0cHV0UXVlcnkiLCJnZXRfb3V0cHV0cyIsImRlc2VyaWFsaXplT3V0cHV0cyIsImV4cG9ydE91dHB1dHMiLCJhbGwiLCJleHBvcnRfb3V0cHV0cyIsIm91dHB1dHNIZXgiLCJpbXBvcnRPdXRwdXRzIiwiaW1wb3J0X291dHB1dHMiLCJudW1JbXBvcnRlZCIsImV4cG9ydEtleUltYWdlcyIsImV4cG9ydF9rZXlfaW1hZ2VzIiwia2V5SW1hZ2VzU3RyIiwia2V5SW1hZ2VzIiwia2V5SW1hZ2VKc29uIiwiTW9uZXJvS2V5SW1hZ2UiLCJpbXBvcnRLZXlJbWFnZXMiLCJpbXBvcnRfa2V5X2ltYWdlcyIsIm1hcCIsImtleUltYWdlIiwia2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIiLCJNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsImdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0IiwiZnJlZXplT3V0cHV0IiwiZnJlZXplX291dHB1dCIsInRoYXdPdXRwdXQiLCJ0aGF3X291dHB1dCIsImlzT3V0cHV0RnJvemVuIiwiaXNfb3V0cHV0X2Zyb3plbiIsImdldERlZmF1bHRGZWVQcmlvcml0eSIsImdldF9kZWZhdWx0X2ZlZV9wcmlvcml0eSIsImNyZWF0ZVR4cyIsImNvbmZpZ05vcm1hbGl6ZWQiLCJub3JtYWxpemVDcmVhdGVUeHNDb25maWciLCJnZXRDYW5TcGxpdCIsInNldENhblNwbGl0IiwiY3JlYXRlX3R4cyIsInR4U2V0SnNvblN0ciIsIk1vbmVyb1R4U2V0Iiwic3dlZXBPdXRwdXQiLCJub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyIsInN3ZWVwX291dHB1dCIsInN3ZWVwVW5sb2NrZWQiLCJub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnIiwic3dlZXBfdW5sb2NrZWQiLCJ0eFNldHNKc29uIiwidHhTZXRzIiwidHhTZXRKc29uIiwidHhzIiwidHhTZXQiLCJ0eCIsInN3ZWVwRHVzdCIsInJlbGF5Iiwic3dlZXBfZHVzdCIsInNldFR4cyIsInJlbGF5VHhzIiwidHhzT3JNZXRhZGF0YXMiLCJBcnJheSIsImlzQXJyYXkiLCJ0eE1ldGFkYXRhcyIsInR4T3JNZXRhZGF0YSIsIk1vbmVyb1R4V2FsbGV0IiwiZ2V0TWV0YWRhdGEiLCJyZWxheV90eHMiLCJ0eEhhc2hlc0pzb24iLCJkZXNjcmliZVR4U2V0IiwidW5zaWduZWRUeEhleCIsImdldFVuc2lnbmVkVHhIZXgiLCJzaWduZWRUeEhleCIsImdldFNpZ25lZFR4SGV4IiwibXVsdGlzaWdUeEhleCIsImdldE11bHRpc2lnVHhIZXgiLCJkZXNjcmliZV90eF9zZXQiLCJnZXRfZXhjZXB0aW9uX21lc3NhZ2UiLCJzaWduVHhzIiwic2lnbl90eHMiLCJzdWJtaXRUeHMiLCJzdWJtaXRfdHhzIiwic2lnbk1lc3NhZ2UiLCJzaWduYXR1cmVUeXBlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJTSUdOX1dJVEhfU1BFTkRfS0VZIiwic2lnbl9tZXNzYWdlIiwidmVyaWZ5TWVzc2FnZSIsImFkZHJlc3MiLCJzaWduYXR1cmUiLCJ2ZXJpZnlfbWVzc2FnZSIsImlzR29vZCIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJpc09sZCIsIlNJR05fV0lUSF9WSUVXX0tFWSIsInZlcnNpb24iLCJnZXRUeEtleSIsInR4SGFzaCIsImdldF90eF9rZXkiLCJjaGVja1R4S2V5IiwidHhLZXkiLCJjaGVja190eF9rZXkiLCJyZXNwSnNvblN0ciIsIk1vbmVyb0NoZWNrVHgiLCJnZXRUeFByb29mIiwiZ2V0X3R4X3Byb29mIiwiZXJyb3JLZXkiLCJpbmRleE9mIiwic3Vic3RyaW5nIiwibGVuZ3RoIiwiY2hlY2tUeFByb29mIiwiY2hlY2tfdHhfcHJvb2YiLCJnZXRTcGVuZFByb29mIiwiZ2V0X3NwZW5kX3Byb29mIiwiY2hlY2tTcGVuZFByb29mIiwiY2hlY2tfc3BlbmRfcHJvb2YiLCJnZXRSZXNlcnZlUHJvb2ZXYWxsZXQiLCJnZXRfcmVzZXJ2ZV9wcm9vZl93YWxsZXQiLCJnZXRSZXNlcnZlUHJvb2ZBY2NvdW50IiwiYW1vdW50IiwiZ2V0X3Jlc2VydmVfcHJvb2ZfYWNjb3VudCIsInRvU3RyaW5nIiwiY2hlY2tSZXNlcnZlUHJvb2YiLCJjaGVja19yZXNlcnZlX3Byb29mIiwiTW9uZXJvQ2hlY2tSZXNlcnZlIiwiZ2V0VHhOb3RlcyIsImdldF90eF9ub3RlcyIsInR4Tm90ZXMiLCJzZXRUeE5vdGVzIiwibm90ZXMiLCJzZXRfdHhfbm90ZXMiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJlbnRyaWVzIiwiZW50cnlKc29uIiwiZ2V0X2FkZHJlc3NfYm9va19lbnRyaWVzIiwiTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsImFkZEFkZHJlc3NCb29rRW50cnkiLCJkZXNjcmlwdGlvbiIsImFkZF9hZGRyZXNzX2Jvb2tfZW50cnkiLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsImluZGV4Iiwic2V0QWRkcmVzcyIsInNldERlc2NyaXB0aW9uIiwiZWRpdF9hZGRyZXNzX2Jvb2tfZW50cnkiLCJkZWxldGVBZGRyZXNzQm9va0VudHJ5IiwiZW50cnlJZHgiLCJkZWxldGVfYWRkcmVzc19ib29rX2VudHJ5IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInRhZ19hY2NvdW50cyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsImFjY291bnRUYWdzIiwiYWNjb3VudFRhZ0pzb24iLCJnZXRfYWNjb3VudF90YWdzIiwiTW9uZXJvQWNjb3VudFRhZyIsInNldEFjY291bnRUYWdMYWJlbCIsInNldF9hY2NvdW50X3RhZ19sYWJlbCIsImdldFBheW1lbnRVcmkiLCJnZXRfcGF5bWVudF91cmkiLCJwYXJzZVBheW1lbnRVcmkiLCJNb25lcm9UeENvbmZpZyIsInBhcnNlX3BheW1lbnRfdXJpIiwiZ2V0QXR0cmlidXRlIiwia2V5IiwidmFsdWUiLCJnZXRfYXR0cmlidXRlIiwic2V0QXR0cmlidXRlIiwidmFsIiwic2V0X2F0dHJpYnV0ZSIsInN0YXJ0TWluaW5nIiwibnVtVGhyZWFkcyIsImJhY2tncm91bmRNaW5pbmciLCJpZ25vcmVCYXR0ZXJ5IiwiZGFlbW9uIiwiTW9uZXJvRGFlbW9uUnBjIiwiY29ubmVjdFRvRGFlbW9uUnBjIiwic3RvcE1pbmluZyIsImlzTXVsdGlzaWdJbXBvcnROZWVkZWQiLCJpc19tdWx0aXNpZ19pbXBvcnRfbmVlZGVkIiwiaXNNdWx0aXNpZyIsImlzX211bHRpc2lnIiwiZ2V0TXVsdGlzaWdJbmZvIiwiTW9uZXJvTXVsdGlzaWdJbmZvIiwiZ2V0X211bHRpc2lnX2luZm8iLCJwcmVwYXJlTXVsdGlzaWciLCJwcmVwYXJlX211bHRpc2lnIiwibWFrZU11bHRpc2lnIiwibXVsdGlzaWdIZXhlcyIsInRocmVzaG9sZCIsIm1ha2VfbXVsdGlzaWciLCJleGNoYW5nZU11bHRpc2lnS2V5cyIsImV4Y2hhbmdlX211bHRpc2lnX2tleXMiLCJNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQiLCJleHBvcnRNdWx0aXNpZ0hleCIsImV4cG9ydF9tdWx0aXNpZ19oZXgiLCJpbXBvcnRNdWx0aXNpZ0hleCIsImltcG9ydF9tdWx0aXNpZ19oZXgiLCJzaWduTXVsdGlzaWdUeEhleCIsInNpZ25fbXVsdGlzaWdfdHhfaGV4IiwiTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0Iiwic3VibWl0TXVsdGlzaWdUeEhleCIsInNpZ25lZE11bHRpc2lnVHhIZXgiLCJzdWJtaXRfbXVsdGlzaWdfdHhfaGV4IiwiZ2V0RGF0YSIsInZpZXdPbmx5IiwiaXNWaWV3T25seSIsInZpZXdzIiwiY2FjaGVCdWZmZXJMb2MiLCJnZXRfY2FjaGVfZmlsZV9idWZmZXIiLCJ2aWV3IiwiRGF0YVZpZXciLCJBcnJheUJ1ZmZlciIsImkiLCJzZXRJbnQ4IiwiSEVBUFU4IiwicG9pbnRlciIsIlVpbnQ4QXJyYXkiLCJCWVRFU19QRVJfRUxFTUVOVCIsIl9mcmVlIiwiQnVmZmVyIiwiZnJvbSIsImJ1ZmZlciIsImtleXNCdWZmZXJMb2MiLCJnZXRfa2V5c19maWxlX2J1ZmZlciIsInVuc2hpZnQiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJjaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkIiwiZXJyTXNnIiwiY2xvc2UiLCJnZXROdW1CbG9ja3NUb1VubG9jayIsImdldFR4IiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJnZXRPdXRnb2luZ1RyYW5zZmVycyIsImNyZWF0ZVR4IiwicmVsYXlUeCIsImdldFR4Tm90ZSIsInNldFR4Tm90ZSIsIm5vdGUiLCJwcm94eVRvV29ya2VyIiwibmV0d29ya1R5cGUiLCJkYWVtb25VcmkiLCJkYWVtb25Vc2VybmFtZSIsImRhZW1vblBhc3N3b3JkIiwib3Blbl93YWxsZXRfZnVsbCIsImtleXNEYXRhIiwiY2FjaGVEYXRhIiwiYnJvd3Nlck1haW5QYXRoIiwiY29uc29sZSIsImVycm9yIiwiaXNFbmFibGVkIiwic2V0X2xpc3RlbmVyIiwibmV3TGlzdGVuZXJIYW5kbGUiLCJoZWlnaHQiLCJlbmRIZWlnaHQiLCJwZXJjZW50RG9uZSIsIm9uU3luY1Byb2dyZXNzIiwib25OZXdCbG9jayIsIm5ld0JhbGFuY2VTdHIiLCJuZXdVbmxvY2tlZEJhbGFuY2VTdHIiLCJvbkJhbGFuY2VzQ2hhbmdlZCIsImFtb3VudFN0ciIsInVubG9ja1RpbWUiLCJpc0xvY2tlZCIsIm9uT3V0cHV0UmVjZWl2ZWQiLCJhY2NvdW50SWR4U3RyIiwic3ViYWRkcmVzc0lkeFN0ciIsIm9uT3V0cHV0U3BlbnQiLCJzYW5pdGl6ZUJsb2NrIiwiYmxvY2siLCJzYW5pdGl6ZVR4V2FsbGV0IiwiYWNjb3VudCIsInN1YmFkZHJlc3MiLCJkZXNlcmlhbGl6ZUJsb2NrcyIsImJsb2Nrc0pzb24iLCJkZXNlcmlhbGl6ZWRCbG9ja3MiLCJibG9ja3MiLCJibG9ja0pzb24iLCJNb25lcm9CbG9jayIsIkRlc2VyaWFsaXphdGlvblR5cGUiLCJUWF9XQUxMRVQiLCJzZXRCbG9jayIsImdldEhhc2hlcyIsInR4TWFwIiwiTWFwIiwiZ2V0SGFzaCIsInR4c1NvcnRlZCIsInRyYW5zZmVycyIsImdldE91dGdvaW5nVHJhbnNmZXIiLCJ0cmFuc2ZlciIsIm91dHB1dHMiLCJvdXRwdXQiLCJzZXRCcm93c2VyTWFpblBhdGgiLCJQYXRoIiwibm9ybWFsaXplIiwiaXNDbG9zZWQiLCJ3YWxsZXREaXIiLCJkaXJuYW1lIiwibWtkaXIiLCJkYXRhIiwid3JpdGVGaWxlIiwib2xkUGF0aCIsInVubGluayIsInBhdGhOZXciLCJyZW5hbWUiLCJleHBvcnRzIiwiZGVmYXVsdCIsIk1vbmVyb1dhbGxldEtleXNQcm94eSIsIndhbGxldElkIiwiaW52b2tlV29ya2VyIiwiZ2V0V29ya2VyIiwid29ya2VyIiwid3JhcHBlZExpc3RlbmVycyIsImFyZ3VtZW50cyIsInVyaU9yUnBjQ29ubmVjdGlvbiIsImdldENvbmZpZyIsInJwY0NvbmZpZyIsIndyYXBwZWRMaXN0ZW5lciIsIldhbGxldFdvcmtlckxpc3RlbmVyIiwibGlzdGVuZXJJZCIsImdldElkIiwiYWRkV29ya2VyQ2FsbGJhY2siLCJnZXRMaXN0ZW5lciIsInJlbW92ZVdvcmtlckNhbGxiYWNrIiwic3BsaWNlIiwicmVzdWx0SnNvbiIsImJsb2NrSnNvbnMiLCJrZXlJbWFnZXNKc29uIiwiYW5ub3VuY2VTeW5jUHJvZ3Jlc3MiLCJhbm5vdW5jZU5ld0Jsb2NrIiwiYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQiLCJNb25lcm9PdXRwdXRXYWxsZXQiLCJzZXRBbW91bnQiLCJzZXRBY2NvdW50SW5kZXgiLCJzZXRTdWJhZGRyZXNzSW5kZXgiLCJzZXRIYXNoIiwic2V0VmVyc2lvbiIsInNldFVubG9ja1RpbWUiLCJzZXRUeCIsInNldE91dHB1dHMiLCJzZXRJc0luY29taW5nIiwic2V0SXNMb2NrZWQiLCJzZXRIZWlnaHQiLCJzZXRJc0NvbmZpcm1lZCIsInNldEluVHhQb29sIiwic2V0SXNGYWlsZWQiLCJhbm5vdW5jZU91dHB1dFJlY2VpdmVkIiwicGFyc2VJbnQiLCJzZXRJbnB1dHMiLCJhbm5vdW5jZU91dHB1dFNwZW50IiwiaWQiLCJnZXRJbnB1dHMiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0RnVsbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBQYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4uL2NvbW1vbi9UYXNrTG9vcGVyXCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50XCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudFRhZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50VGFnXCI7XG5pbXBvcnQgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BZGRyZXNzQm9va0VudHJ5XCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0NoZWNrVHggZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tUeFwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrUmVzZXJ2ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1Jlc2VydmVcIjtcbmltcG9ydCBNb25lcm9EYWVtb25ScGMgZnJvbSBcIi4uL2RhZW1vbi9Nb25lcm9EYWVtb25ScGNcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbmNvbWluZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbmZvXCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5pdFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHRcIjtcbmltcG9ydCBNb25lcm9OZXR3b3JrVHlwZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb05ldHdvcmtUeXBlXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0UXVlcnlcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9TdWJhZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb1N1YmFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9TeW5jUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb1N5bmNSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyUXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvVHhQcmlvcml0eSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFByaW9yaXR5XCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXQgZnJvbSBcIi4vTW9uZXJvV2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldENvbmZpZ1wiO1xuaW1wb3J0IHsgTW9uZXJvV2FsbGV0S2V5cywgTW9uZXJvV2FsbGV0S2V5c1Byb3h5IH0gZnJvbSBcIi4vTW9uZXJvV2FsbGV0S2V5c1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldExpc3RlbmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldExpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGVcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm8gd2FsbGV0IHVzaW5nIGNsaWVudC1zaWRlIFdlYkFzc2VtYmx5IGJpbmRpbmdzIHRvIG1vbmVyby1wcm9qZWN0J3Mgd2FsbGV0MiBpbiBDKysuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1dhbGxldEZ1bGwgZXh0ZW5kcyBNb25lcm9XYWxsZXRLZXlzIHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA9IDIwMDAwO1xuICBwcm90ZWN0ZWQgc3RhdGljIEZTO1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgcGF0aDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgcGFzc3dvcmQ6IHN0cmluZztcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXTtcbiAgcHJvdGVjdGVkIGZzOiBhbnk7XG4gIHByb3RlY3RlZCB3YXNtTGlzdGVuZXI6IFdhbGxldFdhc21MaXN0ZW5lcjtcbiAgcHJvdGVjdGVkIHdhc21MaXN0ZW5lckhhbmRsZTogbnVtYmVyO1xuICBwcm90ZWN0ZWQgcmVqZWN0VW5hdXRob3JpemVkOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgcmVqZWN0VW5hdXRob3JpemVkQ29uZmlnSWQ6IHN0cmluZztcbiAgcHJvdGVjdGVkIHN5bmNQZXJpb2RJbk1zOiBudW1iZXI7XG4gIHByb3RlY3RlZCBzeW5jTG9vcGVyOiBUYXNrTG9vcGVyO1xuICBwcm90ZWN0ZWQgYnJvd3Nlck1haW5QYXRoOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEludGVybmFsIGNvbnN0cnVjdG9yIHdoaWNoIGlzIGdpdmVuIHRoZSBtZW1vcnkgYWRkcmVzcyBvZiBhIEMrKyB3YWxsZXQgaW5zdGFuY2UuXG4gICAqIFxuICAgKiBUaGlzIGNvbnN0cnVjdG9yIHNob3VsZCBiZSBjYWxsZWQgdGhyb3VnaCBzdGF0aWMgd2FsbGV0IGNyZWF0aW9uIHV0aWxpdGllcyBpbiB0aGlzIGNsYXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNwcEFkZHJlc3MgLSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2UgaW4gQysrXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gcGF0aCBvZiB0aGUgd2FsbGV0IGluc3RhbmNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtGaWxlU3lzdGVtfSBmcyAtIG5vZGUuanMtY29tcGF0aWJsZSBmaWxlIHN5c3RlbSB0byByZWFkL3dyaXRlIHdhbGxldCBmaWxlc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHJlamVjdFVuYXV0aG9yaXplZCAtIHNwZWNpZmllcyBpZiB1bmF1dGhvcml6ZWQgcmVxdWVzdHMgKGUuZy4gc2VsZi1zaWduZWQgY2VydGlmaWNhdGVzKSBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgLSB1bmlxdWUgaWRlbnRpZmllciBmb3IgaHR0cF9jbGllbnRfd2FzbSB0byBxdWVyeSByZWplY3RVbmF1dGhvcml6ZWRcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRGdWxsUHJveHl9IHdhbGxldFByb3h5IC0gcHJveHkgdG8gaW52b2tlIHdhbGxldCBvcGVyYXRpb25zIGluIGEgd2ViIHdvcmtlclxuICAgKiBcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNwcEFkZHJlc3MsIHBhdGgsIHBhc3N3b3JkLCBmcywgcmVqZWN0VW5hdXRob3JpemVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCB3YWxsZXRQcm94eT86IE1vbmVyb1dhbGxldEZ1bGxQcm94eSkge1xuICAgIHN1cGVyKGNwcEFkZHJlc3MsIHdhbGxldFByb3h5KTtcbiAgICBpZiAod2FsbGV0UHJveHkpIHJldHVybjtcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgIHRoaXMucGFzc3dvcmQgPSBwYXNzd29yZDtcbiAgICB0aGlzLmxpc3RlbmVycyA9IFtdO1xuICAgIHRoaXMuZnMgPSBmcyA/IGZzIDogKHBhdGggPyBNb25lcm9XYWxsZXRGdWxsLmdldEZzKCkgOiB1bmRlZmluZWQpO1xuICAgIHRoaXMuX2lzQ2xvc2VkID0gZmFsc2U7XG4gICAgdGhpcy53YXNtTGlzdGVuZXIgPSBuZXcgV2FsbGV0V2FzbUxpc3RlbmVyKHRoaXMpOyAvLyByZWNlaXZlcyBub3RpZmljYXRpb25zIGZyb20gd2FzbSBjKytcbiAgICB0aGlzLndhc21MaXN0ZW5lckhhbmRsZSA9IDA7ICAgICAgICAgICAgICAgICAgICAgIC8vIG1lbW9yeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgbGlzdGVuZXIgaW4gYysrXG4gICAgdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQgPSByZWplY3RVbmF1dGhvcml6ZWQ7XG4gICAgdGhpcy5yZWplY3RVbmF1dGhvcml6ZWRDb25maWdJZCA9IHJlamVjdFVuYXV0aG9yaXplZEZuSWQ7XG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IE1vbmVyb1dhbGxldEZ1bGwuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUztcbiAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4ocmVqZWN0VW5hdXRob3JpemVkRm5JZCwgKCkgPT4gdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQpOyAvLyByZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIFVUSUxJVElFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgd2FsbGV0IGV4aXN0cyBhdCBhIGdpdmVuIHBhdGguXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCBvbiB0aGUgZmlsZSBzeXN0ZW1cbiAgICogQHBhcmFtIHthbnl9IGZzIC0gZmlsZSBzeXN0ZW0gY29tcGF0aWJsZSB3aXRoIE5vZGUuanMgYGZzLnByb21pc2VzYCBBUEkgKGRlZmF1bHRzIHRvIGRpc2sgb3IgaW4tbWVtb3J5IEZTIGlmIGJyb3dzZXIpXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgYSB3YWxsZXQgZXhpc3RzIGF0IHRoZSBnaXZlbiBwYXRoLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyB3YWxsZXRFeGlzdHMocGF0aCwgZnMpIHtcbiAgICBhc3NlcnQocGF0aCwgXCJNdXN0IHByb3ZpZGUgYSBwYXRoIHRvIGxvb2sgZm9yIGEgd2FsbGV0XCIpO1xuICAgIGlmICghZnMpIGZzID0gTW9uZXJvV2FsbGV0RnVsbC5nZXRGcygpO1xuICAgIGlmICghZnMpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBmaWxlIHN5c3RlbSB0byBjaGVjayBpZiB3YWxsZXQgZXhpc3RzXCIpO1xuICAgIGxldCBleGlzdHMgPSBhd2FpdCBMaWJyYXJ5VXRpbHMuZXhpc3RzKGZzLCBwYXRoICsgXCIua2V5c1wiKTtcbiAgICBMaWJyYXJ5VXRpbHMubG9nKDEsIFwiV2FsbGV0IGV4aXN0cyBhdCBcIiArIHBhdGggKyBcIjogXCIgKyBleGlzdHMpO1xuICAgIHJldHVybiBleGlzdHM7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBvcGVuV2FsbGV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG5cbiAgICAvLyB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZy5nZXRQcm94eVRvV29ya2VyKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIodHJ1ZSk7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgc2VlZCB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHNlZWQgb2Zmc2V0IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHByaW1hcnkgYWRkcmVzcyB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBwcml2YXRlIHZpZXcga2V5IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBwcml2YXRlIHNwZW5kIGtleSB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHJlc3RvcmUgaGVpZ2h0IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IGxhbmd1YWdlIHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSB0cnVlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSBjdXJyZW50IHdhbGxldCB3aGVuIG9wZW5pbmcgZnVsbCB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRGcygpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRGcyhNb25lcm9XYWxsZXRGdWxsLmdldEZzKCkpO1xuXG4gICAgLy8gc2V0IHNlcnZlciBmcm9tIGNvbm5lY3Rpb24gbWFuYWdlciBpZiBwcm92aWRlZFxuICAgIGlmIChjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBvcGVuZWQgd2l0aCBhIHNlcnZlciBvciBjb25uZWN0aW9uIG1hbmFnZXIgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgY29uZmlnLnNldFNlcnZlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKS5nZXRDb25uZWN0aW9uKCkpO1xuICAgIH1cblxuICAgIC8vIHJlYWQgd2FsbGV0IGRhdGEgZnJvbSBkaXNrIHVubGVzcyBwcm92aWRlZFxuICAgIGlmICghY29uZmlnLmdldEtleXNEYXRhKCkpIHtcbiAgICAgIGxldCBmcyA9IGNvbmZpZy5nZXRGcygpO1xuICAgICAgaWYgKCFmcykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGZpbGUgc3lzdGVtIHRvIHJlYWQgd2FsbGV0IGRhdGEgZnJvbVwiKTtcbiAgICAgIGlmICghYXdhaXQgdGhpcy53YWxsZXRFeGlzdHMoY29uZmlnLmdldFBhdGgoKSwgZnMpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgZG9lcyBub3QgZXhpc3QgYXQgcGF0aDogXCIgKyBjb25maWcuZ2V0UGF0aCgpKTtcbiAgICAgIGNvbmZpZy5zZXRLZXlzRGF0YShhd2FpdCBmcy5yZWFkRmlsZShjb25maWcuZ2V0UGF0aCgpICsgXCIua2V5c1wiKSk7XG4gICAgICBjb25maWcuc2V0Q2FjaGVEYXRhKGF3YWl0IExpYnJhcnlVdGlscy5leGlzdHMoZnMsIGNvbmZpZy5nZXRQYXRoKCkpID8gYXdhaXQgZnMucmVhZEZpbGUoY29uZmlnLmdldFBhdGgoKSkgOiBcIlwiKTtcbiAgICB9XG5cbiAgICAvLyBvcGVuIHdhbGxldCBmcm9tIGRhdGFcbiAgICBjb25zdCB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLm9wZW5XYWxsZXREYXRhKGNvbmZpZyk7XG5cbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAgYXdhaXQgd2FsbGV0LnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0KGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG5cbiAgICAvLyB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBjb25maWcgdG8gY3JlYXRlIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkICYmIChjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgbWF5IGJlIGluaXRpYWxpemVkIHdpdGggYSBzZWVkIG9yIGtleXMgYnV0IG5vdCBib3RoXCIpO1xuICAgIGlmIChjb25maWcuZ2V0TmV0d29ya1R5cGUoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYSBuZXR3b3JrVHlwZTogJ21haW5uZXQnLCAndGVzdG5ldCcgb3IgJ3N0YWdlbmV0J1wiKTtcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSB0cnVlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSBjdXJyZW50IHdhbGxldCB3aGVuIGNyZWF0aW5nIGZ1bGwgV0FTTSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFBhdGgoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgJiYgYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC53YWxsZXRFeGlzdHMoY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldEZzKCkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgYWxyZWFkeSBleGlzdHM6IFwiICsgY29uZmlnLmdldFBhdGgoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXNzd29yZCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQYXNzd29yZChcIlwiKTtcblxuICAgIC8vIHNldCBzZXJ2ZXIgZnJvbSBjb25uZWN0aW9uIG1hbmFnZXIgaWYgcHJvdmlkZWRcbiAgICBpZiAoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgY3JlYXRlZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBjb25maWcuc2V0U2VydmVyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpLmdldENvbm5lY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIHByb3hpZWQgb3IgbG9jYWwgd2FsbGV0XG4gICAgbGV0IHdhbGxldDtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJveHlUb1dvcmtlcih0cnVlKTtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSkge1xuICAgICAgbGV0IHdhbGxldFByb3h5ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbFByb3h5LmNyZWF0ZVdhbGxldChjb25maWcpO1xuICAgICAgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldEZ1bGwodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgd2FsbGV0UHJveHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBsYW5ndWFnZSB3aGVuIGNyZWF0aW5nIHdhbGxldCBmcm9tIHNlZWRcIik7XG4gICAgICAgIHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwuY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnKTtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgd2FsbGV0IGZyb20ga2V5c1wiKTtcbiAgICAgICAgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHJlc3RvcmVIZWlnaHQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgICAgICB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldFJhbmRvbShjb25maWcpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAgYXdhaXQgd2FsbGV0LnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG5cbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtc1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFJlc3RvcmVIZWlnaHQoMCk7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFNlZWRPZmZzZXQoXCJcIik7XG4gICAgXG4gICAgLy8gbG9hZCBmdWxsIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gcXVldWVcbiAgICBsZXQgd2FsbGV0ID0gYXdhaXQgbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgYXN5bmMgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0UGFzc3dvcmQoKSwgY29uZmlnLmdldEZzKCksIGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHNhdmUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBwYXJhbXNcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcmltYXJ5QWRkcmVzcyhcIlwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaXZhdGVWaWV3S2V5KFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaXZhdGVTcGVuZEtleShcIlwiKTtcbiAgICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkID0gZGFlbW9uQ29ubmVjdGlvbiA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB0cnVlO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRSZXN0b3JlSGVpZ2h0KDApO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoXCJFbmdsaXNoXCIpO1xuICAgIFxuICAgIC8vIGxvYWQgZnVsbCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHF1ZXVlXG4gICAgbGV0IHdhbGxldCA9IGF3YWl0IG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgYXN5bmMgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0UGFzc3dvcmQoKSwgY29uZmlnLmdldEZzKCksIGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHNhdmUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRSYW5kb20oY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtc1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoXCJFbmdsaXNoXCIpO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgXG4gICAgLy8gbG9hZCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHF1ZXVlXG4gICAgbGV0IHdhbGxldCA9IGF3YWl0IG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUuY3JlYXRlX2Z1bGxfd2FsbGV0KEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSksIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIGFzeW5jIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEZ1bGwoY3BwQWRkcmVzcywgY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldFBhc3N3b3JkKCksIGNvbmZpZy5nZXRGcygpLCBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBzYXZlIHdhbGxldFxuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBnZXRTZWVkTGFuZ3VhZ2VzKCkge1xuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICByZXR1cm4gbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShtb2R1bGUuZ2V0X2tleXNfd2FsbGV0X3NlZWRfbGFuZ3VhZ2VzKCkpLmxhbmd1YWdlcztcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRGcygpIHtcbiAgICBpZiAoIU1vbmVyb1dhbGxldEZ1bGwuRlMpIE1vbmVyb1dhbGxldEZ1bGwuRlMgPSBmcy5wcm9taXNlcztcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5GUztcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tIFdBTExFVCBNRVRIT0RTIFNQRUNJRklDIFRPIFdBU00gSU1QTEVNRU5UQVRJT04gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBUT0RPOiBtb3ZlIHRoZXNlIHRvIE1vbmVyb1dhbGxldC50cywgb3RoZXJzIGNhbiBiZSB1bnN1cHBvcnRlZFxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbWF4aW11bSBoZWlnaHQgb2YgdGhlIHBlZXJzIHRoZSB3YWxsZXQncyBkYWVtb24gaXMgY29ubmVjdGVkIHRvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBtYXhpbXVtIGhlaWdodCBvZiB0aGUgcGVlcnMgdGhlIHdhbGxldCdzIGRhZW1vbiBpcyBjb25uZWN0ZWQgdG9cbiAgICovXG4gIGFzeW5jIGdldERhZW1vbk1heFBlZXJIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldERhZW1vbk1heFBlZXJIZWlnaHQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfZGFlbW9uX21heF9wZWVyX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0J3MgZGFlbW9uIGlzIHN5bmNlZCB3aXRoIHRoZSBuZXR3b3JrLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgZGFlbW9uIGlzIHN5bmNlZCB3aXRoIHRoZSBuZXR3b3JrLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzRGFlbW9uU3luY2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNEYWVtb25TeW5jZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5pc19kYWVtb25fc3luY2VkKHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSB3YWxsZXQgaXMgc3luY2VkIHdpdGggdGhlIGRhZW1vbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIHdhbGxldCBpcyBzeW5jZWQgd2l0aCB0aGUgZGFlbW9uLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzU3luY2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNTeW5jZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pc19zeW5jZWQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIG5ldHdvcmsgdHlwZSAobWFpbm5ldCwgdGVzdG5ldCwgb3Igc3RhZ2VuZXQpLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9OZXR3b3JrVHlwZT59IHRoZSB3YWxsZXQncyBuZXR3b3JrIHR5cGVcbiAgICovXG4gIGFzeW5jIGdldE5ldHdvcmtUeXBlKCk6IFByb21pc2U8TW9uZXJvTmV0d29ya1R5cGU+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE5ldHdvcmtUeXBlKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmdldF9uZXR3b3JrX3R5cGUodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBoZWlnaHQgb2YgdGhlIGZpcnN0IGJsb2NrIHRoYXQgdGhlIHdhbGxldCBzY2Fuc1xuICAgKi9cbiAgYXN5bmMgZ2V0UmVzdG9yZUhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UmVzdG9yZUhlaWdodCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5nZXRfcmVzdG9yZV9oZWlnaHQodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gcmVzdG9yZUhlaWdodCAtIGhlaWdodCBvZiB0aGUgZmlyc3QgYmxvY2sgdGhhdCB0aGUgd2FsbGV0IHNjYW5zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfcmVzdG9yZV9oZWlnaHQodGhpcy5jcHBBZGRyZXNzLCByZXN0b3JlSGVpZ2h0KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1vdmUgdGhlIHdhbGxldCBmcm9tIGl0cyBjdXJyZW50IHBhdGggdG8gdGhlIGdpdmVuIHBhdGguXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHRoZSB3YWxsZXQncyBkZXN0aW5hdGlvbiBwYXRoXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBtb3ZlVG8ocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5tb3ZlVG8ocGF0aCk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwubW92ZVRvKHBhdGgsIHRoaXMpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBDT01NT04gV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb1dhbGxldExpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXdhaXQgc3VwZXIuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGF3YWl0IHN1cGVyLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXJzKCk6IE1vbmVyb1dhbGxldExpc3RlbmVyW10ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0TGlzdGVuZXJzKCk7XG4gICAgcmV0dXJuIHN1cGVyLmdldExpc3RlbmVycygpO1xuICB9XG4gIFxuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbj86IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uKTtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgY29ubmVjdGlvblxuICAgIGxldCBjb25uZWN0aW9uID0gIXVyaU9yQ29ubmVjdGlvbiA/IHVuZGVmaW5lZCA6IHVyaU9yQ29ubmVjdGlvbiBpbnN0YW5jZW9mIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPyB1cmlPckNvbm5lY3Rpb24gOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24pO1xuICAgIGxldCB1cmkgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0VXJpKCkgPyBjb25uZWN0aW9uLmdldFVyaSgpIDogXCJcIjtcbiAgICBsZXQgdXNlcm5hbWUgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA/IGNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA6IFwiXCI7XG4gICAgbGV0IHBhc3N3b3JkID0gY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgPyBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZDtcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCA9IHJlamVjdFVuYXV0aG9yaXplZDsgIC8vIHBlcnNpc3QgbG9jYWxseVxuICAgIFxuICAgIC8vIHNldCBjb25uZWN0aW9uIGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuc2V0X2RhZW1vbl9jb25uZWN0aW9uKHRoaXMuY3BwQWRkcmVzcywgdXJpLCB1c2VybmFtZSwgcGFzc3dvcmQsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGFlbW9uQ29ubmVjdGlvbigpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGxldCBjb25uZWN0aW9uQ29udGFpbmVyU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2RhZW1vbl9jb25uZWN0aW9uKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICAgIGlmICghY29ubmVjdGlvbkNvbnRhaW5lclN0cikgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBsZXQganNvbkNvbm5lY3Rpb24gPSBKU09OLnBhcnNlKGNvbm5lY3Rpb25Db250YWluZXJTdHIpO1xuICAgICAgICAgIHJlc29sdmUobmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oe3VyaToganNvbkNvbm5lY3Rpb24udXJpLCB1c2VybmFtZToganNvbkNvbm5lY3Rpb24udXNlcm5hbWUsIHBhc3N3b3JkOiBqc29uQ29ubmVjdGlvbi5wYXNzd29yZCwgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc0Nvbm5lY3RlZFRvRGFlbW9uKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaXNfY29ubmVjdGVkX3RvX2RhZW1vbih0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFZlcnNpb24oKTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcy5wYXRoO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3M/OiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5tb2R1bGUuZ2V0X2ludGVncmF0ZWRfYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIHN0YW5kYXJkQWRkcmVzcyA/IHN0YW5kYXJkQWRkcmVzcyA6IFwiXCIsIHBheW1lbnRJZCA/IHBheW1lbnRJZCA6IFwiXCIpO1xuICAgICAgICBpZiAocmVzdWx0LmNoYXJBdCgwKSAhPT0gJ3snKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyhKU09OLnBhcnNlKHJlc3VsdCkpO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgaWYgKGVyci5tZXNzYWdlLmluY2x1ZGVzKFwiSW52YWxpZCBwYXltZW50IElEXCIpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIHBheW1lbnQgSUQ6IFwiICsgcGF5bWVudElkKTtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5tb2R1bGUuZGVjb2RlX2ludGVncmF0ZWRfYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIGludGVncmF0ZWRBZGRyZXNzKTtcbiAgICAgICAgaWYgKHJlc3VsdC5jaGFyQXQoMCkgIT09ICd7JykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3VsdCk7XG4gICAgICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoSlNPTi5wYXJzZShyZXN1bHQpKTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0SGVpZ2h0KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uSGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXREYWVtb25IZWlnaHQoKTtcbiAgICBpZiAoIWF3YWl0IHRoaXMuaXNDb25uZWN0ZWRUb0RhZW1vbigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X2RhZW1vbl9oZWlnaHQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodEJ5RGF0ZSh5ZWFyOiBudW1iZXIsIG1vbnRoOiBudW1iZXIsIGRheTogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEhlaWdodEJ5RGF0ZSh5ZWFyLCBtb250aCwgZGF5KTtcbiAgICBpZiAoIWF3YWl0IHRoaXMuaXNDb25uZWN0ZWRUb0RhZW1vbigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X2hlaWdodF9ieV9kYXRlKHRoaXMuY3BwQWRkcmVzcywgeWVhciwgbW9udGgsIGRheSwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN5bmNocm9uaXplIHRoZSB3YWxsZXQgd2l0aCB0aGUgZGFlbW9uIGFzIGEgb25lLXRpbWUgc3luY2hyb25vdXMgcHJvY2Vzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvV2FsbGV0TGlzdGVuZXJ8bnVtYmVyfSBbbGlzdGVuZXJPclN0YXJ0SGVpZ2h0XSAtIGxpc3RlbmVyIHhvciBzdGFydCBoZWlnaHQgKGRlZmF1bHRzIHRvIG5vIHN5bmMgbGlzdGVuZXIsIHRoZSBsYXN0IHN5bmNlZCBibG9jaylcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdGFydEhlaWdodF0gLSBzdGFydEhlaWdodCBpZiBub3QgZ2l2ZW4gaW4gZmlyc3QgYXJnIChkZWZhdWx0cyB0byBsYXN0IHN5bmNlZCBibG9jaylcbiAgICogQHBhcmFtIHtib29sZWFufSBbYWxsb3dDb25jdXJyZW50Q2FsbHNdIC0gYWxsb3cgb3RoZXIgd2FsbGV0IG1ldGhvZHMgdG8gYmUgcHJvY2Vzc2VkIHNpbXVsdGFuZW91c2x5IGR1cmluZyBzeW5jIChkZWZhdWx0IGZhbHNlKTxicj48YnI+PGI+V0FSTklORzwvYj46IGVuYWJsaW5nIHRoaXMgb3B0aW9uIHdpbGwgY3Jhc2ggd2FsbGV0IGV4ZWN1dGlvbiBpZiBhbm90aGVyIGNhbGwgbWFrZXMgYSBzaW11bHRhbmVvdXMgbmV0d29yayByZXF1ZXN0LiBUT0RPOiBwb3NzaWJsZSB0byBzeW5jIHdhc20gbmV0d29yayByZXF1ZXN0cyBpbiBodHRwX2NsaWVudF93YXNtLmNwcD8gXG4gICAqL1xuICBhc3luYyBzeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodD86IE1vbmVyb1dhbGxldExpc3RlbmVyIHwgbnVtYmVyLCBzdGFydEhlaWdodD86IG51bWJlciwgYWxsb3dDb25jdXJyZW50Q2FsbHMgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvU3luY1Jlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3luYyhsaXN0ZW5lck9yU3RhcnRIZWlnaHQsIHN0YXJ0SGVpZ2h0LCBhbGxvd0NvbmN1cnJlbnRDYWxscyk7XG4gICAgaWYgKCFhd2FpdCB0aGlzLmlzQ29ubmVjdGVkVG9EYWVtb24oKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIG5vdCBjb25uZWN0ZWQgdG8gZGFlbW9uXCIpO1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBwYXJhbXNcbiAgICBzdGFydEhlaWdodCA9IGxpc3RlbmVyT3JTdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkIHx8IGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyID8gc3RhcnRIZWlnaHQgOiBsaXN0ZW5lck9yU3RhcnRIZWlnaHQ7XG4gICAgbGV0IGxpc3RlbmVyID0gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIgPyBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gTWF0aC5tYXgoYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSwgYXdhaXQgdGhpcy5nZXRSZXN0b3JlSGVpZ2h0KCkpO1xuICAgIFxuICAgIC8vIHJlZ2lzdGVyIGxpc3RlbmVyIGlmIGdpdmVuXG4gICAgaWYgKGxpc3RlbmVyKSBhd2FpdCB0aGlzLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBcbiAgICAvLyBzeW5jIHdhbGxldFxuICAgIGxldCBlcnI7XG4gICAgbGV0IHJlc3VsdDtcbiAgICB0cnkge1xuICAgICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgICAgcmVzdWx0ID0gYXdhaXQgKGFsbG93Q29uY3VycmVudENhbGxzID8gc3luY1dhc20oKSA6IHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiBzeW5jV2FzbSgpKSk7XG4gICAgICBmdW5jdGlvbiBzeW5jV2FzbSgpIHtcbiAgICAgICAgdGhhdC5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgICAgLy8gc3luYyB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICAgIHRoYXQubW9kdWxlLnN5bmModGhhdC5jcHBBZGRyZXNzLCBzdGFydEhlaWdodCwgYXN5bmMgKHJlc3ApID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNwLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBsZXQgcmVzcEpzb24gPSBKU09OLnBhcnNlKHJlc3ApO1xuICAgICAgICAgICAgICByZXNvbHZlKG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3BKc29uLm51bUJsb2Nrc0ZldGNoZWQsIHJlc3BKc29uLnJlY2VpdmVkTW9uZXkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyID0gZTtcbiAgICB9XG4gICAgXG4gICAgLy8gdW5yZWdpc3RlciBsaXN0ZW5lclxuICAgIGlmIChsaXN0ZW5lcikgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gdGhyb3cgZXJyb3Igb3IgcmV0dXJuXG4gICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncz86IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zKTtcbiAgICBpZiAoIWF3YWl0IHRoaXMuaXNDb25uZWN0ZWRUb0RhZW1vbigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IHN5bmNQZXJpb2RJbk1zID09PSB1bmRlZmluZWQgPyBNb25lcm9XYWxsZXRGdWxsLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgOiBzeW5jUGVyaW9kSW5NcztcbiAgICBpZiAoIXRoaXMuc3luY0xvb3BlcikgdGhpcy5zeW5jTG9vcGVyID0gbmV3IFRhc2tMb29wZXIoYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5iYWNrZ3JvdW5kU3luYygpKVxuICAgIHRoaXMuc3luY0xvb3Blci5zdGFydCh0aGlzLnN5bmNQZXJpb2RJbk1zKTtcbiAgfVxuICAgIFxuICBhc3luYyBzdG9wU3luY2luZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN0b3BTeW5jaW5nKCk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBpZiAodGhpcy5zeW5jTG9vcGVyKSB0aGlzLnN5bmNMb29wZXIuc3RvcCgpO1xuICAgIHRoaXMubW9kdWxlLnN0b3Bfc3luY2luZyh0aGlzLmNwcEFkZHJlc3MpOyAvLyB0YXNrIGlzIG5vdCBxdWV1ZWQgc28gd2FsbGV0IHN0b3BzIGltbWVkaWF0ZWx5XG4gIH1cbiAgXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zY2FuVHhzKHR4SGFzaGVzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zY2FuX3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eEhhc2hlczogdHhIYXNoZXN9KSwgKGVycikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoZXJyKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhblNwZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVzY2FuU3BlbnQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5yZXNjYW5fc3BlbnQodGhpcy5jcHBBZGRyZXNzLCAoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhbkJsb2NrY2hhaW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZXNjYW5CbG9ja2NoYWluKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUucmVzY2FuX2Jsb2NrY2hhaW4odGhpcy5jcHBBZGRyZXNzLCAoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGJhbGFuY2UgZW5jb2RlZCBpbiBqc29uIHN0cmluZ1xuICAgICAgbGV0IGJhbGFuY2VTdHI7XG4gICAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFzc2VydChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQsIFwiU3ViYWRkcmVzcyBpbmRleCBtdXN0IGJlIHVuZGVmaW5lZCBpZiBhY2NvdW50IGluZGV4IGlzIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgYmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF9iYWxhbmNlX3dhbGxldCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgfSBlbHNlIGlmIChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF9iYWxhbmNlX2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYmFsYW5jZV9zdWJhZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIHBhcnNlIGpzb24gc3RyaW5nIHRvIGJpZ2ludFxuICAgICAgcmV0dXJuIEJpZ0ludChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYmFsYW5jZVN0cikpLmJhbGFuY2UpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgXG4gICAgICAvLyBnZXQgYmFsYW5jZSBlbmNvZGVkIGluIGpzb24gc3RyaW5nXG4gICAgICBsZXQgdW5sb2NrZWRCYWxhbmNlU3RyO1xuICAgICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhc3NlcnQoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkLCBcIlN1YmFkZHJlc3MgaW5kZXggbXVzdCBiZSB1bmRlZmluZWQgaWYgYWNjb3VudCBpbmRleCBpcyB1bmRlZmluZWRcIik7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF91bmxvY2tlZF9iYWxhbmNlX3dhbGxldCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgfSBlbHNlIGlmIChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X3VubG9ja2VkX2JhbGFuY2VfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X3VubG9ja2VkX2JhbGFuY2Vfc3ViYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBwYXJzZSBqc29uIHN0cmluZyB0byBiaWdpbnRcbiAgICAgIHJldHVybiBCaWdJbnQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHVubG9ja2VkQmFsYW5jZVN0cikpLnVubG9ja2VkQmFsYW5jZSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCB0YWc/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgYWNjb3VudHNTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYWNjb3VudHModGhpcy5jcHBBZGRyZXNzLCBpbmNsdWRlU3ViYWRkcmVzc2VzID8gdHJ1ZSA6IGZhbHNlLCB0YWcgPyB0YWcgOiBcIlwiKTtcbiAgICAgIGxldCBhY2NvdW50cyA9IFtdO1xuICAgICAgZm9yIChsZXQgYWNjb3VudEpzb24gb2YgSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGFjY291bnRzU3RyKSkuYWNjb3VudHMpIHtcbiAgICAgICAgYWNjb3VudHMucHVzaChNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2NvdW50cztcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBY2NvdW50KGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBhY2NvdW50U3RyID0gdGhpcy5tb2R1bGUuZ2V0X2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzID8gdHJ1ZSA6IGZhbHNlKTtcbiAgICAgIGxldCBhY2NvdW50SnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhhY2NvdW50U3RyKSk7XG4gICAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgICB9KTtcblxuICB9XG4gIFxuICBhc3luYyBjcmVhdGVBY2NvdW50KGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jcmVhdGVBY2NvdW50KGxhYmVsKTtcbiAgICBpZiAobGFiZWwgPT09IHVuZGVmaW5lZCkgbGFiZWwgPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBhY2NvdW50U3RyID0gdGhpcy5tb2R1bGUuY3JlYXRlX2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBsYWJlbCk7XG4gICAgICBsZXQgYWNjb3VudEpzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYWNjb3VudFN0cikpO1xuICAgICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3NbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICBsZXQgYXJncyA9IHthY2NvdW50SWR4OiBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlczogc3ViYWRkcmVzc0luZGljZXMgPT09IHVuZGVmaW5lZCA/IFtdIDogR2VuVXRpbHMubGlzdGlmeShzdWJhZGRyZXNzSW5kaWNlcyl9O1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBzdWJhZGRyZXNzZXNKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHRoaXMubW9kdWxlLmdldF9zdWJhZGRyZXNzZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShhcmdzKSkpKS5zdWJhZGRyZXNzZXM7XG4gICAgICBsZXQgc3ViYWRkcmVzc2VzID0gW107XG4gICAgICBmb3IgKGxldCBzdWJhZGRyZXNzSnNvbiBvZiBzdWJhZGRyZXNzZXNKc29uKSBzdWJhZGRyZXNzZXMucHVzaChNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhuZXcgTW9uZXJvU3ViYWRkcmVzcyhzdWJhZGRyZXNzSnNvbikpKTtcbiAgICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4LCBsYWJlbCk7XG4gICAgaWYgKGxhYmVsID09PSB1bmRlZmluZWQpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgc3ViYWRkcmVzc1N0ciA9IHRoaXMubW9kdWxlLmNyZWF0ZV9zdWJhZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgbGFiZWwpO1xuICAgICAgbGV0IHN1YmFkZHJlc3NKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHN1YmFkZHJlc3NTdHIpKTtcbiAgICAgIHJldHVybiBNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhuZXcgTW9uZXJvU3ViYWRkcmVzcyhzdWJhZGRyZXNzSnNvbikpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpO1xuICAgIGlmIChsYWJlbCA9PT0gdW5kZWZpbmVkKSBsYWJlbCA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuc2V0X3N1YmFkZHJlc3NfbGFiZWwodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyhxdWVyeT86IHN0cmluZ1tdIHwgUGFydGlhbDxNb25lcm9UeFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHhzKHF1ZXJ5KTtcblxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHNjaGVkdWxlIHRhc2tcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2tcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHF1ZXJ5Tm9ybWFsaXplZC5nZXRCbG9jaygpLnRvSnNvbigpKSwgKGJsb2Nrc0pzb25TdHIpID0+IHtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBjaGVjayBmb3IgZXJyb3JcbiAgICAgICAgICBpZiAoYmxvY2tzSnNvblN0ci5jaGFyQXQoMCkgIT09ICd7Jykge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlc29sdmUgd2l0aCBkZXNlcmlhbGl6ZWQgdHhzXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc29sdmUoTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZVR4cyhxdWVyeU5vcm1hbGl6ZWQsIGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHJhbnNmZXJbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHJhbnNmZXJzKHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgb24gY2FsbGJhY2tcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2tcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3RyYW5zZmVycyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKS50b0pzb24oKSksIChibG9ja3NKc29uU3RyKSA9PiB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAvLyBjaGVjayBmb3IgZXJyb3JcbiAgICAgICAgICBpZiAoYmxvY2tzSnNvblN0ci5jaGFyQXQoMCkgIT09ICd7Jykge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgICBcbiAgICAgICAgICAvLyByZXNvbHZlIHdpdGggZGVzZXJpYWxpemVkIHRyYW5zZmVycyBcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb2x2ZShNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplVHJhbnNmZXJzKHF1ZXJ5Tm9ybWFsaXplZCwgYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9PdXRwdXRRdWVyeT4pOiBQcm9taXNlPE1vbmVyb091dHB1dFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRPdXRwdXRzKHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplT3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIG9uIGNhbGxiYWNrXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+e1xuICAgICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2tcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X291dHB1dHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkudG9Kc29uKCkpLCAoYmxvY2tzSnNvblN0cikgPT4ge1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIGNoZWNrIGZvciBlcnJvclxuICAgICAgICAgIGlmIChibG9ja3NKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IE1vbmVyb0Vycm9yKGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVzb2x2ZSB3aXRoIGRlc2VyaWFsaXplZCBvdXRwdXRzXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc29sdmUoTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZU91dHB1dHMocXVlcnlOb3JtYWxpemVkLCBibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE91dHB1dHMoYWxsID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZXhwb3J0T3V0cHV0cyhhbGwpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmV4cG9ydF9vdXRwdXRzKHRoaXMuY3BwQWRkcmVzcywgYWxsLCAob3V0cHV0c0hleCkgPT4gcmVzb2x2ZShvdXRwdXRzSGV4KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pbXBvcnRfb3V0cHV0cyh0aGlzLmNwcEFkZHJlc3MsIG91dHB1dHNIZXgsIChudW1JbXBvcnRlZCkgPT4gcmVzb2x2ZShudW1JbXBvcnRlZCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydEtleUltYWdlcyhhbGwgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZXhwb3J0S2V5SW1hZ2VzKGFsbCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZXhwb3J0X2tleV9pbWFnZXModGhpcy5jcHBBZGRyZXNzLCBhbGwsIChrZXlJbWFnZXNTdHIpID0+IHtcbiAgICAgICAgICBpZiAoa2V5SW1hZ2VzU3RyLmNoYXJBdCgwKSAhPT0gJ3snKXJlamVjdChuZXcgTW9uZXJvRXJyb3Ioa2V5SW1hZ2VzU3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCBrZXlJbWFnZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IGtleUltYWdlSnNvbiBvZiBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoa2V5SW1hZ2VzU3RyKSkua2V5SW1hZ2VzKSBrZXlJbWFnZXMucHVzaChuZXcgTW9uZXJvS2V5SW1hZ2Uoa2V5SW1hZ2VKc29uKSk7XG4gICAgICAgICAgICByZXNvbHZlKGtleUltYWdlcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzOiBNb25lcm9LZXlJbWFnZVtdKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaW1wb3J0X2tleV9pbWFnZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7a2V5SW1hZ2VzOiBrZXlJbWFnZXMubWFwKGtleUltYWdlID0+IGtleUltYWdlLnRvSnNvbigpKX0pLCAoa2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIpID0+IHtcbiAgICAgICAgICBpZiAoa2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioa2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGtleUltYWdlSW1wb3J0UmVzdWx0U3RyKSkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmZyZWV6ZU91dHB1dChrZXlJbWFnZSk7XG4gICAgaWYgKCFrZXlJbWFnZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBzcGVjaWZ5IGtleSBpbWFnZSB0byBmcmVlemVcIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZnJlZXplX291dHB1dCh0aGlzLmNwcEFkZHJlc3MsIGtleUltYWdlLCAoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRoYXdPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkudGhhd091dHB1dChrZXlJbWFnZSk7XG4gICAgaWYgKCFrZXlJbWFnZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBzcGVjaWZ5IGtleSBpbWFnZSB0byB0aGF3XCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnRoYXdfb3V0cHV0KHRoaXMuY3BwQWRkcmVzcywga2V5SW1hZ2UsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2UpO1xuICAgIGlmICgha2V5SW1hZ2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3Qgc3BlY2lmeSBrZXkgaW1hZ2UgdG8gY2hlY2sgaWYgZnJvemVuXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmlzX291dHB1dF9mcm96ZW4odGhpcy5jcHBBZGRyZXNzLCBrZXlJbWFnZSwgKHJlc3VsdCkgPT4gcmVzb2x2ZShyZXN1bHQpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCk6IFByb21pc2U8TW9uZXJvVHhQcmlvcml0eT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X2RlZmF1bHRfZmVlX3ByaW9yaXR5KHRoaXMuY3BwQWRkcmVzcywgKHJlc3VsdCkgPT4gcmVzb2x2ZShyZXN1bHQpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY3JlYXRlVHhzKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUsIGNvcHksIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpID09PSB1bmRlZmluZWQpIGNvbmZpZ05vcm1hbGl6ZWQuc2V0Q2FuU3BsaXQodHJ1ZSk7XG4gICAgXG4gICAgLy8gY3JlYXRlIHR4cyBpbiBxdWV1ZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgdHhzIGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuY3JlYXRlX3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZ05vcm1hbGl6ZWQudG9Kc29uKCkpLCAodHhTZXRKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHR4U2V0SnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eFNldEpzb25TdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0SnNvblN0cikpKS5nZXRUeHMoKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zd2VlcE91dHB1dChjb25maWcpO1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyhjb25maWcpO1xuICAgIFxuICAgIC8vIHN3ZWVwIG91dHB1dCBpbiBxdWV1ZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBzd2VlcCBvdXRwdXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5zd2VlcF9vdXRwdXQodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShjb25maWdOb3JtYWxpemVkLnRvSnNvbigpKSwgKHR4U2V0SnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmICh0eFNldEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhTZXRKc29uU3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0eFNldEpzb25TdHIpKSkuZ2V0VHhzKClbMF0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zd2VlcFVubG9ja2VkKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBzd2VlcCB1bmxvY2tlZCBpbiBxdWV1ZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBzd2VlcCB1bmxvY2tlZCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLnN3ZWVwX3VubG9ja2VkKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoY29uZmlnTm9ybWFsaXplZC50b0pzb24oKSksICh0eFNldHNKc29uKSA9PiB7XG4gICAgICAgICAgaWYgKHR4U2V0c0pzb24uY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhTZXRzSnNvbikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgdHhTZXRzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCB0eFNldEpzb24gb2YgSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0c0pzb24pKS50eFNldHMpIHR4U2V0cy5wdXNoKG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pKTtcbiAgICAgICAgICAgIGxldCB0eHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IHR4U2V0IG9mIHR4U2V0cykgZm9yIChsZXQgdHggb2YgdHhTZXQuZ2V0VHhzKCkpIHR4cy5wdXNoKHR4KTtcbiAgICAgICAgICAgIHJlc29sdmUodHhzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwRHVzdChyZWxheT86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN3ZWVwRHVzdChyZWxheSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5zd2VlcF9kdXN0KHRoaXMuY3BwQWRkcmVzcywgcmVsYXksICh0eFNldEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAodHhTZXRKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4U2V0SnNvblN0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0SnNvblN0cikpKTtcbiAgICAgICAgICAgIGlmICh0eFNldC5nZXRUeHMoKSA9PT0gdW5kZWZpbmVkKSB0eFNldC5zZXRUeHMoW10pO1xuICAgICAgICAgICAgcmVzb2x2ZSh0eFNldC5nZXRUeHMoKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhczogKE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKVtdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVsYXlUeHModHhzT3JNZXRhZGF0YXMpO1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eE1ldGFkYXRhcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykgdHhNZXRhZGF0YXMucHVzaCh0eE9yTWV0YWRhdGEgaW5zdGFuY2VvZiBNb25lcm9UeFdhbGxldCA/IHR4T3JNZXRhZGF0YS5nZXRNZXRhZGF0YSgpIDogdHhPck1ldGFkYXRhKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5yZWxheV90eHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dHhNZXRhZGF0YXM6IHR4TWV0YWRhdGFzfSksICh0eEhhc2hlc0pzb24pID0+IHtcbiAgICAgICAgICBpZiAodHhIYXNoZXNKc29uLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4SGFzaGVzSnNvbikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShKU09OLnBhcnNlKHR4SGFzaGVzSnNvbikudHhIYXNoZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmRlc2NyaWJlVHhTZXQodHhTZXQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KHt1bnNpZ25lZFR4SGV4OiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCksIHNpZ25lZFR4SGV4OiB0eFNldC5nZXRTaWduZWRUeEhleCgpLCBtdWx0aXNpZ1R4SGV4OiB0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KCl9KTtcbiAgICAgIHRyeSB7IHJldHVybiBuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHRoaXMubW9kdWxlLmRlc2NyaWJlX3R4X3NldCh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHR4U2V0LnRvSnNvbigpKSkpKSk7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHRoaXMubW9kdWxlLmdldF9leGNlcHRpb25fbWVzc2FnZShlcnIpKTsgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNpZ25UeHModW5zaWduZWRUeEhleCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgcmV0dXJuIG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModGhpcy5tb2R1bGUuc2lnbl90eHModGhpcy5jcHBBZGRyZXNzLCB1bnNpZ25lZFR4SGV4KSkpKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4cyhzaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3VibWl0VHhzKHNpZ25lZFR4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zdWJtaXRfdHhzKHRoaXMuY3BwQWRkcmVzcywgc2lnbmVkVHhIZXgsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShKU09OLnBhcnNlKHJlc3ApLnR4SGFzaGVzKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBzaWduYXR1cmVUeXBlID0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgYWNjb3VudElkeCA9IDAsIHN1YmFkZHJlc3NJZHggPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNpZ25NZXNzYWdlKG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgIFxuICAgIC8vIGFzc2lnbiBkZWZhdWx0c1xuICAgIHNpZ25hdHVyZVR5cGUgPSBzaWduYXR1cmVUeXBlIHx8IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVk7XG4gICAgYWNjb3VudElkeCA9IGFjY291bnRJZHggfHwgMDtcbiAgICBzdWJhZGRyZXNzSWR4ID0gc3ViYWRkcmVzc0lkeCB8fCAwO1xuICAgIFxuICAgIC8vIHF1ZXVlIHRhc2sgdG8gc2lnbiBtZXNzYWdlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgcmV0dXJuIHRoaXMubW9kdWxlLnNpZ25fbWVzc2FnZSh0aGlzLmNwcEFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUgPT09IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVkgPyAwIDogMSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHRoaXMubW9kdWxlLmdldF9leGNlcHRpb25fbWVzc2FnZShlcnIpKTsgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyB2ZXJpZnlNZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkudmVyaWZ5TWVzc2FnZShtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCByZXN1bHQ7XG4gICAgICB0cnkge1xuICAgICAgICByZXN1bHQgPSBKU09OLnBhcnNlKHRoaXMubW9kdWxlLnZlcmlmeV9tZXNzYWdlKHRoaXMuY3BwQWRkcmVzcywgbWVzc2FnZSwgYWRkcmVzcywgc2lnbmF0dXJlKSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVzdWx0ID0ge2lzR29vZDogZmFsc2V9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KHJlc3VsdC5pc0dvb2QgP1xuICAgICAgICB7aXNHb29kOiByZXN1bHQuaXNHb29kLCBpc09sZDogcmVzdWx0LmlzT2xkLCBzaWduYXR1cmVUeXBlOiByZXN1bHQuc2lnbmF0dXJlVHlwZSA9PT0gXCJzcGVuZFwiID8gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA6IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9WSUVXX0tFWSwgdmVyc2lvbjogcmVzdWx0LnZlcnNpb259IDpcbiAgICAgICAge2lzR29vZDogZmFsc2V9XG4gICAgICApO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeEtleSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeEtleSh0eEhhc2gpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7IHJldHVybiB0aGlzLm1vZHVsZS5nZXRfdHhfa2V5KHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhLZXkodHhIYXNoOiBzdHJpbmcsIHR4S2V5OiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hlY2tUeEtleSh0eEhhc2gsIHR4S2V5LCBhZGRyZXNzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7IFxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hlY2tfdHhfa2V5KHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoLCB0eEtleSwgYWRkcmVzcywgKHJlc3BKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3BKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3BKc29uU3RyKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9DaGVja1R4KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhyZXNwSnNvblN0cikpKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3R4X3Byb29mKHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoIHx8IFwiXCIsIGFkZHJlc3MgfHwgXCJcIiwgbWVzc2FnZSB8fCBcIlwiLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoc2lnbmF0dXJlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoZWNrVHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpOyBcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoZWNrX3R4X3Byb29mKHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoIHx8IFwiXCIsIGFkZHJlc3MgfHwgXCJcIiwgbWVzc2FnZSB8fCBcIlwiLCBzaWduYXR1cmUgfHwgXCJcIiwgKHJlc3BKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3BKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3BKc29uU3RyKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9DaGVja1R4KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhyZXNwSnNvblN0cikpKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0U3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9zcGVuZF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBtZXNzYWdlIHx8IFwiXCIsIChzaWduYXR1cmUpID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAoc2lnbmF0dXJlLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHNpZ25hdHVyZS5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShzaWduYXR1cmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoZWNrU3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpOyBcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoZWNrX3NwZW5kX3Byb29mKHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgc2lnbmF0dXJlIHx8IFwiXCIsIChyZXNwKSA9PiB7XG4gICAgICAgICAgdHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIgPyByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKSA6IHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfcmVzZXJ2ZV9wcm9vZl93YWxsZXQodGhpcy5jcHBBZGRyZXNzLCBtZXNzYWdlLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCksIC0xKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBhbW91bnQ6IGJpZ2ludCwgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHgsIGFtb3VudCwgbWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3Jlc2VydmVfcHJvb2ZfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIGFtb3VudC50b1N0cmluZygpLCBtZXNzYWdlLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCksIC0xKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7IFxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hlY2tfcmVzZXJ2ZV9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSwgKHJlc3BKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3BKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3BKc29uU3RyLCAtMSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvQ2hlY2tSZXNlcnZlKEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhyZXNwSnNvblN0cikpKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHhOb3Rlcyh0eEhhc2hlcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgcmV0dXJuIEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X3R4X25vdGVzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3R4SGFzaGVzOiB0eEhhc2hlc30pKSkudHhOb3RlczsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdLCBub3Rlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldFR4Tm90ZXModHhIYXNoZXMsIG5vdGVzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyB0aGlzLm1vZHVsZS5zZXRfdHhfbm90ZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dHhIYXNoZXM6IHR4SGFzaGVzLCB0eE5vdGVzOiBub3Rlc30pKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzKTtcbiAgICBpZiAoIWVudHJ5SW5kaWNlcykgZW50cnlJbmRpY2VzID0gW107XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IGVudHJ5SnNvbiBvZiBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9hZGRyZXNzX2Jvb2tfZW50cmllcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHtlbnRyeUluZGljZXM6IGVudHJ5SW5kaWNlc30pKSkuZW50cmllcykge1xuICAgICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb0FkZHJlc3NCb29rRW50cnkoZW50cnlKc29uKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZW50cmllcztcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzOiBzdHJpbmcsIGRlc2NyaXB0aW9uPzogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzcywgZGVzY3JpcHRpb24pO1xuICAgIGlmICghYWRkcmVzcykgYWRkcmVzcyA9IFwiXCI7XG4gICAgaWYgKCFkZXNjcmlwdGlvbikgZGVzY3JpcHRpb24gPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5hZGRfYWRkcmVzc19ib29rX2VudHJ5KHRoaXMuY3BwQWRkcmVzcywgYWRkcmVzcywgZGVzY3JpcHRpb24pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBlZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleDogbnVtYmVyLCBzZXRBZGRyZXNzOiBib29sZWFuLCBhZGRyZXNzOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNldERlc2NyaXB0aW9uOiBib29sZWFuLCBkZXNjcmlwdGlvbjogc3RyaW5nIHwgdW5kZWZpbmVkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5lZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKTtcbiAgICBpZiAoIXNldEFkZHJlc3MpIHNldEFkZHJlc3MgPSBmYWxzZTtcbiAgICBpZiAoIWFkZHJlc3MpIGFkZHJlc3MgPSBcIlwiO1xuICAgIGlmICghc2V0RGVzY3JpcHRpb24pIHNldERlc2NyaXB0aW9uID0gZmFsc2U7XG4gICAgaWYgKCFkZXNjcmlwdGlvbikgZGVzY3JpcHRpb24gPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLmVkaXRfYWRkcmVzc19ib29rX2VudHJ5KHRoaXMuY3BwQWRkcmVzcywgaW5kZXgsIHNldEFkZHJlc3MsIGFkZHJlc3MsIHNldERlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbik7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHg6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuZGVsZXRlX2FkZHJlc3NfYm9va19lbnRyeSh0aGlzLmNwcEFkZHJlc3MsIGVudHJ5SWR4KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGFnQWNjb3VudHModGFnOiBzdHJpbmcsIGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkudGFnQWNjb3VudHModGFnLCBhY2NvdW50SW5kaWNlcyk7XG4gICAgaWYgKCF0YWcpIHRhZyA9IFwiXCI7XG4gICAgaWYgKCFhY2NvdW50SW5kaWNlcykgYWNjb3VudEluZGljZXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS50YWdfYWNjb3VudHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dGFnOiB0YWcsIGFjY291bnRJbmRpY2VzOiBhY2NvdW50SW5kaWNlc30pKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS51bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzKTtcbiAgICBpZiAoIWFjY291bnRJbmRpY2VzKSBhY2NvdW50SW5kaWNlcyA9IFtdO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnRhZ19hY2NvdW50cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHthY2NvdW50SW5kaWNlczogYWNjb3VudEluZGljZXN9KSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRUYWdzKCk6IFByb21pc2U8TW9uZXJvQWNjb3VudFRhZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBY2NvdW50VGFncygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBhY2NvdW50VGFncyA9IFtdO1xuICAgICAgZm9yIChsZXQgYWNjb3VudFRhZ0pzb24gb2YgSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfYWNjb3VudF90YWdzKHRoaXMuY3BwQWRkcmVzcykpLmFjY291bnRUYWdzKSBhY2NvdW50VGFncy5wdXNoKG5ldyBNb25lcm9BY2NvdW50VGFnKGFjY291bnRUYWdKc29uKSk7XG4gICAgICByZXR1cm4gYWNjb3VudFRhZ3M7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzZXRBY2NvdW50VGFnTGFiZWwodGFnOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldEFjY291bnRUYWdMYWJlbCh0YWcsIGxhYmVsKTtcbiAgICBpZiAoIXRhZykgdGFnID0gXCJcIjtcbiAgICBpZiAoIWxhYmVsKSBsYWJlbCA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuc2V0X2FjY291bnRfdGFnX2xhYmVsKHRoaXMuY3BwQWRkcmVzcywgdGFnLCBsYWJlbCk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBheW1lbnRVcmkoY29uZmlnOiBNb25lcm9UeENvbmZpZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRQYXltZW50VXJpKGNvbmZpZyk7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5nZXRfcGF5bWVudF91cmkodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgbWFrZSBVUkkgZnJvbSBzdXBwbGllZCBwYXJhbWV0ZXJzXCIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBwYXJzZVBheW1lbnRVcmkodXJpOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4Q29uZmlnPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5wYXJzZVBheW1lbnRVcmkodXJpKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gbmV3IE1vbmVyb1R4Q29uZmlnKEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0aGlzLm1vZHVsZS5wYXJzZV9wYXltZW50X3VyaSh0aGlzLmNwcEFkZHJlc3MsIHVyaSkpKSk7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QXR0cmlidXRlKGtleSk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBhc3NlcnQodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiwgXCJBdHRyaWJ1dGUga2V5IG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHZhbHVlID0gdGhpcy5tb2R1bGUuZ2V0X2F0dHJpYnV0ZSh0aGlzLmNwcEFkZHJlc3MsIGtleSk7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IFwiXCIgPyBudWxsIDogdmFsdWU7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXk6IHN0cmluZywgdmFsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldEF0dHJpYnV0ZShrZXksIHZhbCk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBhc3NlcnQodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiwgXCJBdHRyaWJ1dGUga2V5IG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgYXNzZXJ0KHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIsIFwiQXR0cmlidXRlIHZhbHVlIG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuc2V0X2F0dHJpYnV0ZSh0aGlzLmNwcEFkZHJlc3MsIGtleSwgdmFsKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcobnVtVGhyZWFkczogbnVtYmVyLCBiYWNrZ3JvdW5kTWluaW5nPzogYm9vbGVhbiwgaWdub3JlQmF0dGVyeT86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN0YXJ0TWluaW5nKG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpO1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgbGV0IGRhZW1vbiA9IGF3YWl0IE1vbmVyb0RhZW1vblJwYy5jb25uZWN0VG9EYWVtb25ScGMoYXdhaXQgdGhpcy5nZXREYWVtb25Db25uZWN0aW9uKCkpO1xuICAgIGF3YWl0IGRhZW1vbi5zdGFydE1pbmluZyhhd2FpdCB0aGlzLmdldFByaW1hcnlBZGRyZXNzKCksIG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RvcE1pbmluZygpO1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgbGV0IGRhZW1vbiA9IGF3YWl0IE1vbmVyb0RhZW1vblJwYy5jb25uZWN0VG9EYWVtb25ScGMoYXdhaXQgdGhpcy5nZXREYWVtb25Db25uZWN0aW9uKCkpO1xuICAgIGF3YWl0IGRhZW1vbi5zdG9wTWluaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc011bHRpc2lnSW1wb3J0TmVlZGVkKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmlzX211bHRpc2lnX2ltcG9ydF9uZWVkZWQodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZygpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzTXVsdGlzaWcoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuaXNfbXVsdGlzaWcodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TXVsdGlzaWdJbmZvKCk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbmZvPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRNdWx0aXNpZ0luZm8oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb011bHRpc2lnSW5mbyhKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9tdWx0aXNpZ19pbmZvKHRoaXMuY3BwQWRkcmVzcykpKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcHJlcGFyZU11bHRpc2lnKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5wcmVwYXJlTXVsdGlzaWcoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUucHJlcGFyZV9tdWx0aXNpZyh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBtYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHRocmVzaG9sZDogbnVtYmVyLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLm1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzLCB0aHJlc2hvbGQsIHBhc3N3b3JkKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5tYWtlX211bHRpc2lnKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe211bHRpc2lnSGV4ZXM6IG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZDogdGhyZXNob2xkLCBwYXNzd29yZDogcGFzc3dvcmR9KSwgKHJlc3ApID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAocmVzcC5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBleGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzLCBwYXNzd29yZCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZXhjaGFuZ2VfbXVsdGlzaWdfa2V5cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHttdWx0aXNpZ0hleGVzOiBtdWx0aXNpZ0hleGVzLCBwYXNzd29yZDogcGFzc3dvcmR9KSwgKHJlc3ApID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAocmVzcC5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQoSlNPTi5wYXJzZShyZXNwKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRNdWx0aXNpZ0hleCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZXhwb3J0TXVsdGlzaWdIZXgoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuZXhwb3J0X211bHRpc2lnX2hleCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzKTtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkobXVsdGlzaWdIZXhlcykpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBzdHJpbmdbXSB0byBpbXBvcnRNdWx0aXNpZ0hleCgpXCIpXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaW1wb3J0X211bHRpc2lnX2hleCh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHttdWx0aXNpZ0hleGVzOiBtdWx0aXNpZ0hleGVzfSksIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zaWduX211bHRpc2lnX3R4X2hleCh0aGlzLmNwcEFkZHJlc3MsIG11bHRpc2lnVHhIZXgsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0KEpTT04ucGFyc2UocmVzcCkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnN1Ym1pdF9tdWx0aXNpZ190eF9oZXgodGhpcy5jcHBBZGRyZXNzLCBzaWduZWRNdWx0aXNpZ1R4SGV4LCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmIChyZXNwLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoSlNPTi5wYXJzZShyZXNwKS50eEhhc2hlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIGtleXMgYW5kIGNhY2hlIGRhdGEuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPERhdGFWaWV3W10+fSBpcyB0aGUga2V5cyBhbmQgY2FjaGUgZGF0YSwgcmVzcGVjdGl2ZWx5XG4gICAqL1xuICBhc3luYyBnZXREYXRhKCk6IFByb21pc2U8RGF0YVZpZXdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGF0YSgpO1xuICAgIFxuICAgIC8vIHF1ZXVlIGNhbGwgdG8gd2FzbSBtb2R1bGVcbiAgICBsZXQgdmlld09ubHkgPSBhd2FpdCB0aGlzLmlzVmlld09ubHkoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBcbiAgICAgIC8vIHN0b3JlIHZpZXdzIGluIGFycmF5XG4gICAgICBsZXQgdmlld3MgPSBbXTtcbiAgICAgIFxuICAgICAgLy8gbWFsbG9jIGNhY2hlIGJ1ZmZlciBhbmQgZ2V0IGJ1ZmZlciBsb2NhdGlvbiBpbiBjKysgaGVhcFxuICAgICAgbGV0IGNhY2hlQnVmZmVyTG9jID0gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfY2FjaGVfZmlsZV9idWZmZXIodGhpcy5jcHBBZGRyZXNzKSk7XG4gICAgICBcbiAgICAgIC8vIHJlYWQgYmluYXJ5IGRhdGEgZnJvbSBoZWFwIHRvIERhdGFWaWV3XG4gICAgICBsZXQgdmlldyA9IG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoY2FjaGVCdWZmZXJMb2MubGVuZ3RoKSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNhY2hlQnVmZmVyTG9jLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZpZXcuc2V0SW50OChpLCB0aGlzLm1vZHVsZS5IRUFQVThbY2FjaGVCdWZmZXJMb2MucG9pbnRlciAvIFVpbnQ4QXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKyBpXSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGZyZWUgYmluYXJ5IG9uIGhlYXBcbiAgICAgIHRoaXMubW9kdWxlLl9mcmVlKGNhY2hlQnVmZmVyTG9jLnBvaW50ZXIpO1xuICAgICAgXG4gICAgICAvLyB3cml0ZSBjYWNoZSBmaWxlXG4gICAgICB2aWV3cy5wdXNoKEJ1ZmZlci5mcm9tKHZpZXcuYnVmZmVyKSk7XG4gICAgICBcbiAgICAgIC8vIG1hbGxvYyBrZXlzIGJ1ZmZlciBhbmQgZ2V0IGJ1ZmZlciBsb2NhdGlvbiBpbiBjKysgaGVhcFxuICAgICAgbGV0IGtleXNCdWZmZXJMb2MgPSBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9rZXlzX2ZpbGVfYnVmZmVyKHRoaXMuY3BwQWRkcmVzcywgdGhpcy5wYXNzd29yZCwgdmlld09ubHkpKTtcbiAgICAgIFxuICAgICAgLy8gcmVhZCBiaW5hcnkgZGF0YSBmcm9tIGhlYXAgdG8gRGF0YVZpZXdcbiAgICAgIHZpZXcgPSBuZXcgRGF0YVZpZXcobmV3IEFycmF5QnVmZmVyKGtleXNCdWZmZXJMb2MubGVuZ3RoKSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXNCdWZmZXJMb2MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmlldy5zZXRJbnQ4KGksIHRoaXMubW9kdWxlLkhFQVBVOFtrZXlzQnVmZmVyTG9jLnBvaW50ZXIgLyBVaW50OEFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICsgaV0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBmcmVlIGJpbmFyeSBvbiBoZWFwXG4gICAgICB0aGlzLm1vZHVsZS5fZnJlZShrZXlzQnVmZmVyTG9jLnBvaW50ZXIpO1xuICAgICAgXG4gICAgICAvLyBwcmVwZW5kIGtleXMgZmlsZVxuICAgICAgdmlld3MudW5zaGlmdChCdWZmZXIuZnJvbSh2aWV3LmJ1ZmZlcikpO1xuICAgICAgcmV0dXJuIHZpZXdzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZDogc3RyaW5nLCBuZXdQYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpO1xuICAgIGlmIChvbGRQYXNzd29yZCAhPT0gdGhpcy5wYXNzd29yZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBvcmlnaW5hbCBwYXNzd29yZC5cIik7IC8vIHdhbGxldDIgdmVyaWZ5X3Bhc3N3b3JkIGxvYWRzIGZyb20gZGlzayBzbyB2ZXJpZnkgcGFzc3dvcmQgaGVyZVxuICAgIGlmIChuZXdQYXNzd29yZCA9PT0gdW5kZWZpbmVkKSBuZXdQYXNzd29yZCA9IFwiXCI7XG4gICAgYXdhaXQgdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkKHRoaXMuY3BwQWRkcmVzcywgb2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkLCAoZXJyTXNnKSA9PiB7XG4gICAgICAgICAgaWYgKGVyck1zZykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihlcnJNc2cpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICB0aGlzLnBhc3N3b3JkID0gbmV3UGFzc3dvcmQ7XG4gICAgaWYgKHRoaXMucGF0aCkgYXdhaXQgdGhpcy5zYXZlKCk7IC8vIGF1dG8gc2F2ZVxuICB9XG4gIFxuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2F2ZSgpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhdmUodGhpcyk7XG4gIH1cbiAgXG4gIGFzeW5jIGNsb3NlKHNhdmUgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLl9pc0Nsb3NlZCkgcmV0dXJuOyAvLyBubyBlZmZlY3QgaWYgY2xvc2VkXG4gICAgaWYgKHNhdmUpIGF3YWl0IHRoaXMuc2F2ZSgpO1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jbG9zZShmYWxzZSk7XG4gICAgICBhd2FpdCBzdXBlci5jbG9zZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgICBhd2FpdCB0aGlzLnN0b3BTeW5jaW5nKCk7XG4gICAgYXdhaXQgc3VwZXIuY2xvc2UoKTtcbiAgICBkZWxldGUgdGhpcy5wYXRoO1xuICAgIGRlbGV0ZSB0aGlzLnBhc3N3b3JkO1xuICAgIGRlbGV0ZSB0aGlzLndhc21MaXN0ZW5lcjtcbiAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4odGhpcy5yZWplY3RVbmF1dGhvcml6ZWRDb25maWdJZCwgdW5kZWZpbmVkKTsgLy8gdW5yZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tIEFERCBKU0RPQyBGT1IgU1VQUE9SVEVEIERFRkFVTFQgSU1QTEVNRU5UQVRJT05TIC0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBnZXROdW1CbG9ja3NUb1VubG9jaygpOiBQcm9taXNlPG51bWJlcltdfHVuZGVmaW5lZD4geyByZXR1cm4gc3VwZXIuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTsgfVxuICBhc3luYyBnZXRUeCh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhXYWxsZXR8dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gpOyB9XG4gIGFzeW5jIGdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBnZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5PikgeyByZXR1cm4gc3VwZXIuZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGNyZWF0ZVR4KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5jcmVhdGVUeChjb25maWcpOyB9XG4gIGFzeW5jIHJlbGF5VHgodHhPck1ldGFkYXRhOiBNb25lcm9UeFdhbGxldCB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5yZWxheVR4KHR4T3JNZXRhZGF0YSk7IH1cbiAgYXN5bmMgZ2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFR4Tm90ZSh0eEhhc2gpOyB9XG4gIGFzeW5jIHNldFR4Tm90ZSh0eEhhc2g6IHN0cmluZywgbm90ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zZXRUeE5vdGUodHhIYXNoLCBub3RlKTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgb3BlbldhbGxldERhdGEoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIpIHtcbiAgICAgIGxldCB3YWxsZXRQcm94eSA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGxQcm94eS5vcGVuV2FsbGV0RGF0YShjb25maWcpO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9XYWxsZXRGdWxsKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHdhbGxldFByb3h5KTtcbiAgICB9XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBwYXJhbWV0ZXJzXG4gICAgaWYgKGNvbmZpZy5uZXR3b3JrVHlwZSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgdGhlIHdhbGxldCdzIG5ldHdvcmsgdHlwZVwiKTtcbiAgICBjb25maWcubmV0d29ya1R5cGUgPSBNb25lcm9OZXR3b3JrVHlwZS5mcm9tKGNvbmZpZy5uZXR3b3JrVHlwZSk7XG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgbGV0IGRhZW1vblVyaSA9IGRhZW1vbkNvbm5lY3Rpb24gJiYgZGFlbW9uQ29ubmVjdGlvbi5nZXRVcmkoKSA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXJpKCkgOiBcIlwiO1xuICAgIGxldCBkYWVtb25Vc2VybmFtZSA9IGRhZW1vbkNvbm5lY3Rpb24gJiYgZGFlbW9uQ29ubmVjdGlvbi5nZXRVc2VybmFtZSgpID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRVc2VybmFtZSgpIDogXCJcIjtcbiAgICBsZXQgZGFlbW9uUGFzc3dvcmQgPSBkYWVtb25Db25uZWN0aW9uICYmIGRhZW1vbkNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA6IFwiXCI7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdHJ1ZTtcbiAgICBcbiAgICAvLyBsb2FkIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIG9wZW4gd2FsbGV0IGluIHF1ZXVlXG4gICAgcmV0dXJuIG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUub3Blbl93YWxsZXRfZnVsbChjb25maWcucGFzc3dvcmQsIGNvbmZpZy5uZXR3b3JrVHlwZSwgY29uZmlnLmtleXNEYXRhID8/IFwiXCIsIGNvbmZpZy5jYWNoZURhdGEgPz8gXCJcIiwgZGFlbW9uVXJpLCBkYWVtb25Vc2VybmFtZSwgZGFlbW9uUGFzc3dvcmQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEZ1bGwoY3BwQWRkcmVzcywgY29uZmlnLnBhdGgsIGNvbmZpZy5wYXNzd29yZCwgY29uZmlnLmZzLCByZWplY3RVbmF1dGhvcml6ZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXRXYWxsZXRQcm94eSgpOiBNb25lcm9XYWxsZXRGdWxsUHJveHkge1xuICAgIHJldHVybiBzdXBlci5nZXRXYWxsZXRQcm94eSgpIGFzIE1vbmVyb1dhbGxldEZ1bGxQcm94eTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGJhY2tncm91bmRTeW5jKCkge1xuICAgIGxldCBsYWJlbCA9IHRoaXMucGF0aCA/IHRoaXMucGF0aCA6ICh0aGlzLmJyb3dzZXJNYWluUGF0aCA/IHRoaXMuYnJvd3Nlck1haW5QYXRoIDogXCJpbi1tZW1vcnkgd2FsbGV0XCIpOyAvLyBsYWJlbCBmb3IgbG9nXG4gICAgTGlicmFyeVV0aWxzLmxvZygxLCBcIkJhY2tncm91bmQgc3luY2hyb25pemluZyBcIiArIGxhYmVsKTtcbiAgICB0cnkgeyBhd2FpdCB0aGlzLnN5bmMoKTsgfVxuICAgIGNhdGNoIChlcnI6IGFueSkgeyBpZiAoIXRoaXMuX2lzQ2xvc2VkKSBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGJhY2tncm91bmQgc3luY2hyb25pemUgXCIgKyBsYWJlbCArIFwiOiBcIiArIGVyci5tZXNzYWdlKTsgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBsZXQgaXNFbmFibGVkID0gdGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMDtcbiAgICBpZiAodGhpcy53YXNtTGlzdGVuZXJIYW5kbGUgPT09IDAgJiYgIWlzRW5hYmxlZCB8fCB0aGlzLndhc21MaXN0ZW5lckhhbmRsZSA+IDAgJiYgaXNFbmFibGVkKSByZXR1cm47IC8vIG5vIGRpZmZlcmVuY2VcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNldF9saXN0ZW5lcihcbiAgICAgICAgICB0aGlzLmNwcEFkZHJlc3MsXG4gICAgICAgICAgdGhpcy53YXNtTGlzdGVuZXJIYW5kbGUsXG4gICAgICAgICAgICBuZXdMaXN0ZW5lckhhbmRsZSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgbmV3TGlzdGVuZXJIYW5kbGUgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IobmV3TGlzdGVuZXJIYW5kbGUpKTtcbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy53YXNtTGlzdGVuZXJIYW5kbGUgPSBuZXdMaXN0ZW5lckhhbmRsZTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkgPT4gYXdhaXQgdGhpcy53YXNtTGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0KSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vbk5ld0Jsb2NrKGhlaWdodCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAobmV3QmFsYW5jZVN0ciwgbmV3VW5sb2NrZWRCYWxhbmNlU3RyKSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaXNFbmFibGVkID8gYXN5bmMgKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4U3RyLCBzdWJhZGRyZXNzSWR4U3RyLCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgPT4gYXdhaXQgdGhpcy53YXNtTGlzdGVuZXIub25PdXRwdXRTcGVudChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4U3RyLCBzdWJhZGRyZXNzSWR4U3RyLCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgOiB1bmRlZmluZWQsXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgc3RhdGljIHNhbml0aXplQmxvY2soYmxvY2spIHtcbiAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkgTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZVR4V2FsbGV0KHR4KTtcbiAgICByZXR1cm4gYmxvY2s7XG4gIH1cbiAgXG4gIHN0YXRpYyBzYW5pdGl6ZVR4V2FsbGV0KHR4KSB7XG4gICAgYXNzZXJ0KHR4IGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQpO1xuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgc3RhdGljIHNhbml0aXplQWNjb3VudChhY2NvdW50KSB7XG4gICAgaWYgKGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkgTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3Moc3ViYWRkcmVzcyk7XG4gICAgfVxuICAgIHJldHVybiBhY2NvdW50O1xuICB9XG4gIFxuICBzdGF0aWMgZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cikge1xuICAgIGxldCBibG9ja3NKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGJsb2Nrc0pzb25TdHIpKTtcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzOiBhbnkgPSB7fTtcbiAgICBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzID0gW107XG4gICAgaWYgKGJsb2Nrc0pzb24uYmxvY2tzKSBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbi5ibG9ja3MpIGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3MucHVzaChNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQmxvY2sobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9XQUxMRVQpKSk7XG4gICAgcmV0dXJuIGRlc2VyaWFsaXplZEJsb2NrcztcbiAgfVxuICBcbiAgc3RhdGljIGRlc2VyaWFsaXplVHhzKHF1ZXJ5LCBibG9ja3NKc29uU3RyKSB7XG4gICAgXG4gICAgLy8gZGVzZXJpYWxpemUgYmxvY2tzXG4gICAgbGV0IGRlc2VyaWFsaXplZEJsb2NrcyA9IE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cik7XG4gICAgbGV0IGJsb2NrcyA9IGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3M7XG4gICAgXG4gICAgLy8gY29sbGVjdCB0eHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQmxvY2soYmxvY2spO1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgaWYgKGJsb2NrLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7IC8vIGRlcmVmZXJlbmNlIHBsYWNlaG9sZGVyIGJsb2NrIGZvciB1bmNvbmZpcm1lZCB0eHNcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyByZS1zb3J0IHR4cyB3aGljaCBpcyBsb3N0IG92ZXIgd2FzbSBzZXJpYWxpemF0aW9uICAvLyBUT0RPOiBjb25maXJtIHRoYXQgb3JkZXIgaXMgbG9zdFxuICAgIGlmIChxdWVyeS5nZXRIYXNoZXMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgdHhNYXAgPSBuZXcgTWFwKCk7XG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4TWFwW3R4LmdldEhhc2goKV0gPSB0eDtcbiAgICAgIGxldCB0eHNTb3J0ZWQgPSBbXTtcbiAgICAgIGZvciAobGV0IHR4SGFzaCBvZiBxdWVyeS5nZXRIYXNoZXMoKSkgaWYgKHR4TWFwW3R4SGFzaF0gIT09IHVuZGVmaW5lZCkgdHhzU29ydGVkLnB1c2godHhNYXBbdHhIYXNoXSk7XG4gICAgICB0eHMgPSB0eHNTb3J0ZWQ7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZVRyYW5zZmVycyhxdWVyeSwgYmxvY2tzSnNvblN0cikge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIGJsb2Nrc1xuICAgIGxldCBkZXNlcmlhbGl6ZWRCbG9ja3MgPSBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplQmxvY2tzKGJsb2Nrc0pzb25TdHIpO1xuICAgIGxldCBibG9ja3MgPSBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdHJhbnNmZXJzXG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgaWYgKGJsb2NrLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7IC8vIGRlcmVmZXJlbmNlIHBsYWNlaG9sZGVyIGJsb2NrIGZvciB1bmNvbmZpcm1lZCB0eHNcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkKSB0cmFuc2ZlcnMucHVzaCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpO1xuICAgICAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZU91dHB1dHMocXVlcnksIGJsb2Nrc0pzb25TdHIpIHtcbiAgICBcbiAgICAvLyBkZXNlcmlhbGl6ZSBibG9ja3NcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzID0gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZUJsb2NrcyhibG9ja3NKc29uU3RyKTtcbiAgICBsZXQgYmxvY2tzID0gZGVzZXJpYWxpemVkQmxvY2tzLmJsb2NrcztcbiAgICBcbiAgICAvLyBjb2xsZWN0IG91dHB1dHNcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmdldE91dHB1dHMoKSkgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSBwYXRoIG9mIHRoZSB3YWxsZXQgb24gdGhlIGJyb3dzZXIgbWFpbiB0aHJlYWQgaWYgcnVuIGFzIGEgd29ya2VyLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGJyb3dzZXJNYWluUGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCBvbiB0aGUgYnJvd3NlciBtYWluIHRocmVhZFxuICAgKi9cbiAgcHJvdGVjdGVkIHNldEJyb3dzZXJNYWluUGF0aChicm93c2VyTWFpblBhdGgpIHtcbiAgICB0aGlzLmJyb3dzZXJNYWluUGF0aCA9IGJyb3dzZXJNYWluUGF0aDtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIG1vdmVUbyhwYXRoLCB3YWxsZXQpIHtcblxuICAgIC8vIHNhdmUgYW5kIHJldHVybiBpZiBzYW1lIHBhdGhcbiAgICBpZiAoUGF0aC5ub3JtYWxpemUod2FsbGV0LnBhdGgpID09PSBQYXRoLm5vcm1hbGl6ZShwYXRoKSkge1xuICAgICAgcmV0dXJuIHdhbGxldC5zYXZlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKGF3YWl0IHdhbGxldC5pc0Nsb3NlZCgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgY2xvc2VkXCIpO1xuICAgICAgaWYgKCFwYXRoKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgcGF0aCBvZiBkZXN0aW5hdGlvbiB3YWxsZXRcIik7XG5cbiAgICAgIC8vIGNyZWF0ZSBkZXN0aW5hdGlvbiBkaXJlY3RvcnkgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgICAgbGV0IHdhbGxldERpciA9IFBhdGguZGlybmFtZShwYXRoKTtcbiAgICAgIGlmICghYXdhaXQgTGlicmFyeVV0aWxzLmV4aXN0cyh3YWxsZXQuZnMsIHdhbGxldERpcikpIHtcbiAgICAgICAgdHJ5IHsgYXdhaXQgd2FsbGV0LmZzLm1rZGlyKHdhbGxldERpcik7IH1cbiAgICAgICAgY2F0Y2ggKGVycjogYW55KSB7IHRocm93IG5ldyBNb25lcm9FcnJvcihcIkRlc3RpbmF0aW9uIHBhdGggXCIgKyBwYXRoICsgXCIgZG9lcyBub3QgZXhpc3QgYW5kIGNhbm5vdCBiZSBjcmVhdGVkOiBcIiArIGVyci5tZXNzYWdlKTsgfVxuICAgICAgfVxuXG4gICAgICAvLyBnZXQgd2FsbGV0IGRhdGFcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB3YWxsZXQuZ2V0RGF0YSgpO1xuXG4gICAgICAvLyB3cml0ZSB3YWxsZXQgZmlsZXNcbiAgICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aCArIFwiLmtleXNcIiwgZGF0YVswXSwgXCJiaW5hcnlcIik7XG4gICAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGgsIGRhdGFbMV0sIFwiYmluYXJ5XCIpO1xuICAgICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoICsgXCIuYWRkcmVzcy50eHRcIiwgYXdhaXQgd2FsbGV0LmdldFByaW1hcnlBZGRyZXNzKCkpO1xuICAgICAgbGV0IG9sZFBhdGggPSB3YWxsZXQucGF0aDtcbiAgICAgIHdhbGxldC5wYXRoID0gcGF0aDtcblxuICAgICAgLy8gZGVsZXRlIG9sZCB3YWxsZXQgZmlsZXNcbiAgICAgIGlmIChvbGRQYXRoKSB7XG4gICAgICAgIGF3YWl0IHdhbGxldC5mcy51bmxpbmsob2xkUGF0aCArIFwiLmFkZHJlc3MudHh0XCIpO1xuICAgICAgICBhd2FpdCB3YWxsZXQuZnMudW5saW5rKG9sZFBhdGggKyBcIi5rZXlzXCIpO1xuICAgICAgICBhd2FpdCB3YWxsZXQuZnMudW5saW5rKG9sZFBhdGgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgc2F2ZSh3YWxsZXQ6IGFueSkge1xuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIGlmIChhd2FpdCB3YWxsZXQuaXNDbG9zZWQoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIGNsb3NlZFwiKTtcblxuICAgICAgLy8gcGF0aCBtdXN0IGJlIHNldFxuICAgICAgbGV0IHBhdGggPSBhd2FpdCB3YWxsZXQuZ2V0UGF0aCgpO1xuICAgICAgaWYgKCFwYXRoKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSB3YWxsZXQgYmVjYXVzZSBwYXRoIGlzIG5vdCBzZXRcIik7XG5cbiAgICAgIC8vIGdldCB3YWxsZXQgZGF0YVxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHdhbGxldC5nZXREYXRhKCk7XG5cbiAgICAgIC8vIHdyaXRlIHdhbGxldCBmaWxlcyB0byAqLm5ld1xuICAgICAgbGV0IHBhdGhOZXcgPSBwYXRoICsgXCIubmV3XCI7XG4gICAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGhOZXcgKyBcIi5rZXlzXCIsIGRhdGFbMF0sIFwiYmluYXJ5XCIpO1xuICAgICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoTmV3LCBkYXRhWzFdLCBcImJpbmFyeVwiKTtcbiAgICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aE5ldyArIFwiLmFkZHJlc3MudHh0XCIsIGF3YWl0IHdhbGxldC5nZXRQcmltYXJ5QWRkcmVzcygpKTtcblxuICAgICAgLy8gcmVwbGFjZSBvbGQgd2FsbGV0IGZpbGVzIHdpdGggbmV3XG4gICAgICBhd2FpdCB3YWxsZXQuZnMucmVuYW1lKHBhdGhOZXcgKyBcIi5rZXlzXCIsIHBhdGggKyBcIi5rZXlzXCIpO1xuICAgICAgYXdhaXQgd2FsbGV0LmZzLnJlbmFtZShwYXRoTmV3LCBwYXRoKTtcbiAgICAgIGF3YWl0IHdhbGxldC5mcy5yZW5hbWUocGF0aE5ldyArIFwiLmFkZHJlc3MudHh0XCIsIHBhdGggKyBcIi5hZGRyZXNzLnR4dFwiKTtcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9XYWxsZXQgYnkgcHJveHlpbmcgcmVxdWVzdHMgdG8gYSB3b3JrZXIgd2hpY2ggcnVucyBhIGZ1bGwgd2FsbGV0LlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBNb25lcm9XYWxsZXRGdWxsUHJveHkgZXh0ZW5kcyBNb25lcm9XYWxsZXRLZXlzUHJveHkge1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgcGF0aDogYW55O1xuICBwcm90ZWN0ZWQgZnM6IGFueTtcbiAgcHJvdGVjdGVkIHdyYXBwZWRMaXN0ZW5lcnM6IGFueTtcbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFdBTExFVCBTVEFUSUMgVVRJTFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBzdGF0aWMgYXN5bmMgb3BlbldhbGxldERhdGEoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcbiAgICBsZXQgd2FsbGV0SWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgaWYgKGNvbmZpZy5wYXNzd29yZCA9PT0gdW5kZWZpbmVkKSBjb25maWcucGFzc3dvcmQgPSBcIlwiO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIod2FsbGV0SWQsIFwib3BlbldhbGxldERhdGFcIiwgW2NvbmZpZy5wYXRoLCBjb25maWcucGFzc3dvcmQsIGNvbmZpZy5uZXR3b3JrVHlwZSwgY29uZmlnLmtleXNEYXRhLCBjb25maWcuY2FjaGVEYXRhLCBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi50b0pzb24oKSA6IHVuZGVmaW5lZF0pO1xuICAgIGxldCB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0RnVsbFByb3h5KHdhbGxldElkLCBhd2FpdCBMaWJyYXJ5VXRpbHMuZ2V0V29ya2VyKCksIGNvbmZpZy5wYXRoLCBjb25maWcuZ2V0RnMoKSk7XG4gICAgaWYgKGNvbmZpZy5wYXRoKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgJiYgYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC53YWxsZXRFeGlzdHMoY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldEZzKCkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgYWxyZWFkeSBleGlzdHM6IFwiICsgY29uZmlnLmdldFBhdGgoKSk7XG4gICAgbGV0IHdhbGxldElkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIod2FsbGV0SWQsIFwiY3JlYXRlV2FsbGV0RnVsbFwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgbGV0IHdhbGxldCA9IG5ldyBNb25lcm9XYWxsZXRGdWxsUHJveHkod2FsbGV0SWQsIGF3YWl0IExpYnJhcnlVdGlscy5nZXRXb3JrZXIoKSwgY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldEZzKCkpO1xuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJTlNUQU5DRSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBjb25zdHJ1Y3RvciB3aGljaCBpcyBnaXZlbiBhIHdvcmtlciB0byBjb21tdW5pY2F0ZSB3aXRoIHZpYSBtZXNzYWdlcy5cbiAgICogXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBub3QgYmUgY2FsbGVkIGV4dGVybmFsbHkgYnV0IHNob3VsZCBiZSBjYWxsZWQgdGhyb3VnaFxuICAgKiBzdGF0aWMgd2FsbGV0IGNyZWF0aW9uIHV0aWxpdGllcyBpbiB0aGlzIGNsYXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHdhbGxldElkIC0gaWRlbnRpZmllcyB0aGUgd2FsbGV0IHdpdGggdGhlIHdvcmtlclxuICAgKiBAcGFyYW0ge1dvcmtlcn0gd29ya2VyIC0gd29ya2VyIHRvIGNvbW11bmljYXRlIHdpdGggdmlhIG1lc3NhZ2VzXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih3YWxsZXRJZCwgd29ya2VyLCBwYXRoLCBmcykge1xuICAgIHN1cGVyKHdhbGxldElkLCB3b3JrZXIpO1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5mcyA9IGZzID8gZnMgOiAocGF0aCA/IE1vbmVyb1dhbGxldEZ1bGwuZ2V0RnMoKSA6IHVuZGVmaW5lZCk7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzID0gW107XG4gIH1cblxuICBnZXRQYXRoKCkge1xuICAgIHJldHVybiB0aGlzLnBhdGg7XG4gIH1cblxuICBhc3luYyBnZXROZXR3b3JrVHlwZSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXROZXR3b3JrVHlwZVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0U3ViYWRkcmVzc0xhYmVsXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgUHJvbWlzZTx2b2lkPjtcbiAgfVxuICBcbiAgYXN5bmMgc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPclJwY0Nvbm5lY3Rpb24pIHtcbiAgICBpZiAoIXVyaU9yUnBjQ29ubmVjdGlvbikgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzZXREYWVtb25Db25uZWN0aW9uXCIpO1xuICAgIGVsc2Uge1xuICAgICAgbGV0IGNvbm5lY3Rpb24gPSAhdXJpT3JScGNDb25uZWN0aW9uID8gdW5kZWZpbmVkIDogdXJpT3JScGNDb25uZWN0aW9uIGluc3RhbmNlb2YgTW9uZXJvUnBjQ29ubmVjdGlvbiA/IHVyaU9yUnBjQ29ubmVjdGlvbiA6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yUnBjQ29ubmVjdGlvbik7XG4gICAgICBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInNldERhZW1vbkNvbm5lY3Rpb25cIiwgY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0Q29uZmlnKCkgOiB1bmRlZmluZWQpO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uQ29ubmVjdGlvbigpIHtcbiAgICBsZXQgcnBjQ29uZmlnID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYWVtb25Db25uZWN0aW9uXCIpO1xuICAgIHJldHVybiBycGNDb25maWcgPyBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbihycGNDb25maWcpIDogdW5kZWZpbmVkO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZFRvRGFlbW9uKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzQ29ubmVjdGVkVG9EYWVtb25cIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc3RvcmVIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UmVzdG9yZUhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0UmVzdG9yZUhlaWdodFwiLCBbcmVzdG9yZUhlaWdodF0pO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGFlbW9uSGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25NYXhQZWVySGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldERhZW1vbk1heFBlZXJIZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodEJ5RGF0ZSh5ZWFyLCBtb250aCwgZGF5KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0SGVpZ2h0QnlEYXRlXCIsIFt5ZWFyLCBtb250aCwgZGF5XSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzRGFlbW9uU3luY2VkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzRGFlbW9uU3luY2VkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0SGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGxldCB3cmFwcGVkTGlzdGVuZXIgPSBuZXcgV2FsbGV0V29ya2VyTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGxldCBsaXN0ZW5lcklkID0gd3JhcHBlZExpc3RlbmVyLmdldElkKCk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25TeW5jUHJvZ3Jlc3NfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uU3luY1Byb2dyZXNzLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk5ld0Jsb2NrX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbk5ld0Jsb2NrLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbkJhbGFuY2VzQ2hhbmdlZF9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25CYWxhbmNlc0NoYW5nZWQsIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0UmVjZWl2ZWRfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uT3V0cHV0UmVjZWl2ZWQsIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0U3BlbnRfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uT3V0cHV0U3BlbnQsIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIHRoaXMud3JhcHBlZExpc3RlbmVycy5wdXNoKHdyYXBwZWRMaXN0ZW5lcik7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiYWRkTGlzdGVuZXJcIiwgW2xpc3RlbmVySWRdKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud3JhcHBlZExpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMud3JhcHBlZExpc3RlbmVyc1tpXS5nZXRMaXN0ZW5lcigpID09PSBsaXN0ZW5lcikge1xuICAgICAgICBsZXQgbGlzdGVuZXJJZCA9IHRoaXMud3JhcHBlZExpc3RlbmVyc1tpXS5nZXRJZCgpO1xuICAgICAgICBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInJlbW92ZUxpc3RlbmVyXCIsIFtsaXN0ZW5lcklkXSk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uU3luY1Byb2dyZXNzX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uTmV3QmxvY2tfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25CYWxhbmNlc0NoYW5nZWRfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRSZWNlaXZlZF9cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFNwZW50X1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIHRoaXMud3JhcHBlZExpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB3YWxsZXRcIik7XG4gIH1cbiAgXG4gIGdldExpc3RlbmVycygpIHtcbiAgICBsZXQgbGlzdGVuZXJzID0gW107XG4gICAgZm9yIChsZXQgd3JhcHBlZExpc3RlbmVyIG9mIHRoaXMud3JhcHBlZExpc3RlbmVycykgbGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyLmdldExpc3RlbmVyKCkpO1xuICAgIHJldHVybiBsaXN0ZW5lcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGlzU3luY2VkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzU3luY2VkXCIpO1xuICB9XG4gIFxuICBhc3luYyBzeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodD86IE1vbmVyb1dhbGxldExpc3RlbmVyIHwgbnVtYmVyLCBzdGFydEhlaWdodD86IG51bWJlciwgYWxsb3dDb25jdXJyZW50Q2FsbHMgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvU3luY1Jlc3VsdD4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBwYXJhbXNcbiAgICBzdGFydEhlaWdodCA9IGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyID8gc3RhcnRIZWlnaHQgOiBsaXN0ZW5lck9yU3RhcnRIZWlnaHQ7XG4gICAgbGV0IGxpc3RlbmVyID0gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIgPyBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gTWF0aC5tYXgoYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSwgYXdhaXQgdGhpcy5nZXRSZXN0b3JlSGVpZ2h0KCkpO1xuICAgIFxuICAgIC8vIHJlZ2lzdGVyIGxpc3RlbmVyIGlmIGdpdmVuXG4gICAgaWYgKGxpc3RlbmVyKSBhd2FpdCB0aGlzLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBcbiAgICAvLyBzeW5jIHdhbGxldCBpbiB3b3JrZXIgXG4gICAgbGV0IGVycjtcbiAgICBsZXQgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzdWx0SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic3luY1wiLCBbc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzXSk7XG4gICAgICByZXN1bHQgPSBuZXcgTW9uZXJvU3luY1Jlc3VsdChyZXN1bHRKc29uLm51bUJsb2Nrc0ZldGNoZWQsIHJlc3VsdEpzb24ucmVjZWl2ZWRNb25leSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyID0gZTtcbiAgICB9XG4gICAgXG4gICAgLy8gdW5yZWdpc3RlciBsaXN0ZW5lclxuICAgIGlmIChsaXN0ZW5lcikgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gdGhyb3cgZXJyb3Igb3IgcmV0dXJuXG4gICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN0YXJ0U3luY2luZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gICAgXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN0b3BTeW5jaW5nXCIpO1xuICB9XG4gIFxuICBhc3luYyBzY2FuVHhzKHR4SGFzaGVzKSB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhIYXNoZXMpLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0eHMgaGFzaGVzIHRvIHNjYW5cIik7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2NhblR4c1wiLCBbdHhIYXNoZXNdKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuU3BlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwicmVzY2FuU3BlbnRcIik7XG4gIH1cbiAgICBcbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJyZXNjYW5CbG9ja2NoYWluXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgICByZXR1cm4gQmlnSW50KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QmFsYW5jZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgICBsZXQgdW5sb2NrZWRCYWxhbmNlU3RyID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRVbmxvY2tlZEJhbGFuY2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gQmlnSW50KHVubG9ja2VkQmFsYW5jZVN0cik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXMsIHRhZykge1xuICAgIGxldCBhY2NvdW50cyA9IFtdO1xuICAgIGZvciAobGV0IGFjY291bnRKc29uIG9mIChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEFjY291bnRzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpKSB7XG4gICAgICBhY2NvdW50cy5wdXNoKE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSkpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjb3VudHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnQoYWNjb3VudElkeCwgaW5jbHVkZVN1YmFkZHJlc3Nlcykge1xuICAgIGxldCBhY2NvdW50SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWNjb3VudFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVBY2NvdW50KGxhYmVsKSB7XG4gICAgbGV0IGFjY291bnRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjcmVhdGVBY2NvdW50XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlcykge1xuICAgIGxldCBzdWJhZGRyZXNzZXMgPSBbXTtcbiAgICBmb3IgKGxldCBzdWJhZGRyZXNzSnNvbiBvZiAoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRTdWJhZGRyZXNzZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSkpIHtcbiAgICAgIHN1YmFkZHJlc3Nlcy5wdXNoKE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSkpO1xuICAgIH1cbiAgICByZXR1cm4gc3ViYWRkcmVzc2VzO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHgsIGxhYmVsKSB7XG4gICAgbGV0IHN1YmFkZHJlc3NKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjcmVhdGVTdWJhZGRyZXNzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyhxdWVyeSkge1xuICAgIHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpO1xuICAgIGxldCByZXNwSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHhzXCIsIFtxdWVyeS5nZXRCbG9jaygpLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVUeHMocXVlcnksIEpTT04uc3RyaW5naWZ5KHtibG9ja3M6IHJlc3BKc29uLmJsb2Nrc30pKTsgLy8gaW5pdGlhbGl6ZSB0eHMgZnJvbSBibG9ja3MganNvbiBzdHJpbmcgVE9ETzogdGhpcyBzdHJpbmdpZmllcyB0aGVuIHV0aWxpdHkgcGFyc2VzLCBhdm9pZFxuICB9XG4gIFxuICBhc3luYyBnZXRUcmFuc2ZlcnMocXVlcnkpIHtcbiAgICBxdWVyeSA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBsZXQgYmxvY2tKc29ucyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHJhbnNmZXJzXCIsIFtxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKS50b0pzb24oKV0pO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplVHJhbnNmZXJzKHF1ZXJ5LCBKU09OLnN0cmluZ2lmeSh7YmxvY2tzOiBibG9ja0pzb25zfSkpOyAvLyBpbml0aWFsaXplIHRyYW5zZmVycyBmcm9tIGJsb2NrcyBqc29uIHN0cmluZyBUT0RPOiB0aGlzIHN0cmluZ2lmaWVzIHRoZW4gdXRpbGl0eSBwYXJzZXMsIGF2b2lkXG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMocXVlcnkpIHtcbiAgICBxdWVyeSA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgbGV0IGJsb2NrSnNvbnMgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldE91dHB1dHNcIiwgW3F1ZXJ5LmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVPdXRwdXRzKHF1ZXJ5LCBKU09OLnN0cmluZ2lmeSh7YmxvY2tzOiBibG9ja0pzb25zfSkpOyAvLyBpbml0aWFsaXplIHRyYW5zZmVycyBmcm9tIGJsb2NrcyBqc29uIHN0cmluZyBUT0RPOiB0aGlzIHN0cmluZ2lmaWVzIHRoZW4gdXRpbGl0eSBwYXJzZXMsIGF2b2lkXG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE91dHB1dHMoYWxsKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZXhwb3J0T3V0cHV0c1wiLCBbYWxsXSk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE91dHB1dHMob3V0cHV0c0hleCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImltcG9ydE91dHB1dHNcIiwgW291dHB1dHNIZXhdKTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCkge1xuICAgIGxldCBrZXlJbWFnZXMgPSBbXTtcbiAgICBmb3IgKGxldCBrZXlJbWFnZUpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRLZXlJbWFnZXNcIiwgW2FsbF0pKSBrZXlJbWFnZXMucHVzaChuZXcgTW9uZXJvS2V5SW1hZ2Uoa2V5SW1hZ2VKc29uKSk7XG4gICAgcmV0dXJuIGtleUltYWdlcztcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlcykge1xuICAgIGxldCBrZXlJbWFnZXNKc29uID0gW107XG4gICAgZm9yIChsZXQga2V5SW1hZ2Ugb2Yga2V5SW1hZ2VzKSBrZXlJbWFnZXNKc29uLnB1c2goa2V5SW1hZ2UudG9Kc29uKCkpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJpbXBvcnRLZXlJbWFnZXNcIiwgW2tleUltYWdlc0pzb25dKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb1dhbGxldEZ1bGwuZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKSBub3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImZyZWV6ZU91dHB1dFwiLCBba2V5SW1hZ2VdKTtcbiAgfVxuICBcbiAgYXN5bmMgdGhhd091dHB1dChrZXlJbWFnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInRoYXdPdXRwdXRcIiwgW2tleUltYWdlXSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzT3V0cHV0RnJvemVuKGtleUltYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNPdXRwdXRGcm96ZW5cIiwgW2tleUltYWdlXSk7XG4gIH1cblxuICBhc3luYyBnZXREZWZhdWx0RmVlUHJpb3JpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGVmYXVsdEZlZVByaW9yaXR5XCIpO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnKSB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGxldCB0eFNldEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNyZWF0ZVR4c1wiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pLmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcE91dHB1dChjb25maWcpIHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWcoY29uZmlnKTtcbiAgICBsZXQgdHhTZXRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzd2VlcE91dHB1dFwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pLmdldFR4cygpWzBdO1xuICB9XG5cbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWcpIHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyhjb25maWcpO1xuICAgIGxldCB0eFNldHNKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzd2VlcFVubG9ja2VkXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgdHhTZXRKc29uIG9mIHR4U2V0c0pzb24pIGZvciAobGV0IHR4IG9mIG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pLmdldFR4cygpKSB0eHMucHVzaCh0eCk7XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInN3ZWVwRHVzdFwiLCBbcmVsYXldKSkuZ2V0VHhzKCkgfHwgW107XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzKHR4c09yTWV0YWRhdGFzKSB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhzT3JNZXRhZGF0YXMpLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0eHMgb3IgdGhlaXIgbWV0YWRhdGEgdG8gcmVsYXlcIik7XG4gICAgbGV0IHR4TWV0YWRhdGFzID0gW107XG4gICAgZm9yIChsZXQgdHhPck1ldGFkYXRhIG9mIHR4c09yTWV0YWRhdGFzKSB0eE1ldGFkYXRhcy5wdXNoKHR4T3JNZXRhZGF0YSBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0ID8gdHhPck1ldGFkYXRhLmdldE1ldGFkYXRhKCkgOiB0eE9yTWV0YWRhdGEpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInJlbGF5VHhzXCIsIFt0eE1ldGFkYXRhc10pO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRlc2NyaWJlVHhTZXRcIiwgW3R4U2V0LnRvSnNvbigpXSkpO1xuICB9XG4gIFxuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXgpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2lnblR4c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3VibWl0VHhzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzaWduTWVzc2FnZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyB2ZXJpZnlNZXNzYWdlKG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInZlcmlmeU1lc3NhZ2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4S2V5KHR4SGFzaCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFR4S2V5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhLZXkodHhIYXNoLCB0eEtleSwgYWRkcmVzcykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQ2hlY2tUeChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNoZWNrVHhLZXlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHhQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0NoZWNrVHgoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGVja1R4UHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0U3BlbmRQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJjaGVja1NwZW5kUHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRSZXNlcnZlUHJvb2ZXYWxsZXRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4LCBhbW91bnQsIG1lc3NhZ2UpIHtcbiAgICB0cnkgeyByZXR1cm4gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRSZXNlcnZlUHJvb2ZBY2NvdW50XCIsIFthY2NvdW50SWR4LCBhbW91bnQudG9TdHJpbmcoKSwgbWVzc2FnZV0pOyB9XG4gICAgY2F0Y2ggKGU6IGFueSkgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZS5tZXNzYWdlLCAtMSk7IH1cbiAgfVxuXG4gIGFzeW5jIGNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICAgIHRyeSB7IHJldHVybiBuZXcgTW9uZXJvQ2hlY2tSZXNlcnZlKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2hlY2tSZXNlcnZlUHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7IH1cbiAgICBjYXRjaCAoZTogYW55KSB7IHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UsIC0xKTsgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeE5vdGVzKHR4SGFzaGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHhOb3Rlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzLCBub3Rlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldFR4Tm90ZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcykge1xuICAgIGlmICghZW50cnlJbmRpY2VzKSBlbnRyeUluZGljZXMgPSBbXTtcbiAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgIGZvciAobGV0IGVudHJ5SnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEFkZHJlc3NCb29rRW50cmllc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb0FkZHJlc3NCb29rRW50cnkoZW50cnlKc29uKSk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG4gIFxuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3MsIGRlc2NyaXB0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiYWRkQWRkcmVzc0Jvb2tFbnRyeVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBlZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZWRpdEFkZHJlc3NCb29rRW50cnlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRlbGV0ZUFkZHJlc3NCb29rRW50cnlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgdGFnQWNjb3VudHModGFnLCBhY2NvdW50SW5kaWNlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInRhZ0FjY291bnRzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cblxuICBhc3luYyB1bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwidW50YWdBY2NvdW50c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50VGFncygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBY2NvdW50VGFnc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG5cbiAgYXN5bmMgc2V0QWNjb3VudFRhZ0xhYmVsKHRhZywgbGFiZWwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRBY2NvdW50VGFnTGFiZWxcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWcpIHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UGF5bWVudFVyaVwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmkpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4Q29uZmlnKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwicGFyc2VQYXltZW50VXJpXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QXR0cmlidXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXksIHZhbCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldEF0dHJpYnV0ZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RhcnRNaW5pbmdcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdG9wTWluaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc011bHRpc2lnXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NdWx0aXNpZ0luZm8oYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRNdWx0aXNpZ0luZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwicHJlcGFyZU11bHRpc2lnXCIpO1xuICB9XG4gIFxuICBhc3luYyBtYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlcywgdGhyZXNob2xkLCBwYXNzd29yZCkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcIm1ha2VNdWx0aXNpZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBleGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzLCBwYXNzd29yZCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZXhjaGFuZ2VNdWx0aXNpZ0tleXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImV4cG9ydE11bHRpc2lnSGV4XCIpO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaW1wb3J0TXVsdGlzaWdIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2lnbk11bHRpc2lnVHhIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN1Ym1pdE11bHRpc2lnVHhIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYXRhXCIpO1xuICB9XG4gIFxuICBhc3luYyBtb3ZlVG8ocGF0aCkge1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLm1vdmVUbyhwYXRoLCB0aGlzKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkKSB7XG4gICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGFuZ2VQYXNzd29yZFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIGlmICh0aGlzLnBhdGgpIGF3YWl0IHRoaXMuc2F2ZSgpOyAvLyBhdXRvIHNhdmVcbiAgfVxuICBcbiAgYXN5bmMgc2F2ZSgpIHtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYXZlKHRoaXMpO1xuICB9XG5cbiAgYXN5bmMgY2xvc2Uoc2F2ZSkge1xuICAgIGlmIChhd2FpdCB0aGlzLmlzQ2xvc2VkKCkpIHJldHVybjtcbiAgICBpZiAoc2F2ZSkgYXdhaXQgdGhpcy5zYXZlKCk7XG4gICAgd2hpbGUgKHRoaXMud3JhcHBlZExpc3RlbmVycy5sZW5ndGgpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIodGhpcy53cmFwcGVkTGlzdGVuZXJzWzBdLmdldExpc3RlbmVyKCkpO1xuICAgIGF3YWl0IHN1cGVyLmNsb3NlKGZhbHNlKTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBMSVNURU5JTkcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8qKlxuICogUmVjZWl2ZXMgbm90aWZpY2F0aW9ucyBkaXJlY3RseSBmcm9tIHdhc20gYysrLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRXYXNtTGlzdGVuZXIge1xuXG4gIHByb3RlY3RlZCB3YWxsZXQ6IE1vbmVyb1dhbGxldDtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIHRoaXMud2FsbGV0ID0gd2FsbGV0O1xuICB9XG4gIFxuICBhc3luYyBvblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VTeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VOZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIHtcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFJlY2VpdmVkKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgcmVjZWl2ZWQgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKTtcbiAgICBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludChhbW91bnRTdHIpKTtcbiAgICBvdXRwdXQuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgoc3ViYWRkcmVzc0lkeCk7XG4gICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgdHguc2V0SGFzaCh0eEhhc2gpO1xuICAgIHR4LnNldFZlcnNpb24odmVyc2lvbik7XG4gICAgdHguc2V0VW5sb2NrVGltZSh1bmxvY2tUaW1lKTtcbiAgICBvdXRwdXQuc2V0VHgodHgpO1xuICAgIHR4LnNldE91dHB1dHMoW291dHB1dF0pO1xuICAgIHR4LnNldElzSW5jb21pbmcodHJ1ZSk7XG4gICAgdHguc2V0SXNMb2NrZWQoaXNMb2NrZWQpO1xuICAgIGlmIChoZWlnaHQgPiAwKSB7XG4gICAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRIZWlnaHQoaGVpZ2h0KTtcbiAgICAgIGJsb2NrLnNldFR4cyhbdHggYXMgTW9uZXJvVHhdKTtcbiAgICAgIHR4LnNldEJsb2NrKGJsb2NrKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gYW5ub3VuY2Ugb3V0cHV0XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFNwZW50KGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHhTdHIsIHN1YmFkZHJlc3NJZHhTdHIsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgc3BlbnQgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKTtcbiAgICBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludChhbW91bnRTdHIpKTtcbiAgICBpZiAoYWNjb3VudElkeFN0cikgb3V0cHV0LnNldEFjY291bnRJbmRleChwYXJzZUludChhY2NvdW50SWR4U3RyKSk7XG4gICAgaWYgKHN1YmFkZHJlc3NJZHhTdHIpIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgocGFyc2VJbnQoc3ViYWRkcmVzc0lkeFN0cikpO1xuICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIHR4LnNldEhhc2godHhIYXNoKTtcbiAgICB0eC5zZXRWZXJzaW9uKHZlcnNpb24pO1xuICAgIHR4LnNldFVubG9ja1RpbWUodW5sb2NrVGltZSk7XG4gICAgdHguc2V0SXNMb2NrZWQoaXNMb2NrZWQpO1xuICAgIG91dHB1dC5zZXRUeCh0eCk7XG4gICAgdHguc2V0SW5wdXRzKFtvdXRwdXRdKTtcbiAgICBpZiAoaGVpZ2h0ID4gMCkge1xuICAgICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KGhlaWdodCk7XG4gICAgICBibG9jay5zZXRUeHMoW3R4XSk7XG4gICAgICB0eC5zZXRCbG9jayhibG9jayk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIGFubm91bmNlIG91dHB1dFxuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlT3V0cHV0U3BlbnQob3V0cHV0KTtcbiAgfVxufVxuXG4vKipcbiAqIEludGVybmFsIGxpc3RlbmVyIHRvIGJyaWRnZSBub3RpZmljYXRpb25zIHRvIGV4dGVybmFsIGxpc3RlbmVycy5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgV2FsbGV0V29ya2VyTGlzdGVuZXIge1xuXG4gIHByb3RlY3RlZCBpZDogYW55O1xuICBwcm90ZWN0ZWQgbGlzdGVuZXI6IGFueTtcbiAgXG4gIGNvbnN0cnVjdG9yKGxpc3RlbmVyKSB7XG4gICAgdGhpcy5pZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIH1cbiAgXG4gIGdldElkKCkge1xuICAgIHJldHVybiB0aGlzLmlkO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcjtcbiAgfVxuICBcbiAgb25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkge1xuICAgIHRoaXMubGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSk7XG4gIH1cblxuICBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkge1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25OZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIHtcbiAgICBhd2FpdCB0aGlzLmxpc3RlbmVyLm9uQmFsYW5jZXNDaGFuZ2VkKEJpZ0ludChuZXdCYWxhbmNlU3RyKSwgQmlnSW50KG5ld1VubG9ja2VkQmFsYW5jZVN0cikpO1xuICB9XG5cbiAgYXN5bmMgb25PdXRwdXRSZWNlaXZlZChibG9ja0pzb24pIHtcbiAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1dBTExFVCk7XG4gICAgYXdhaXQgdGhpcy5saXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKGJsb2NrLmdldFR4cygpWzBdLmdldE91dHB1dHMoKVswXSk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uT3V0cHV0U3BlbnQoYmxvY2tKc29uKSB7XG4gICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9XQUxMRVQpO1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25PdXRwdXRTcGVudChibG9jay5nZXRUeHMoKVswXS5nZXRJbnB1dHMoKVswXSk7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLEtBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFNBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLGFBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLFdBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLGNBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLGlCQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyx1QkFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsWUFBQSxHQUFBVCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVMsY0FBQSxHQUFBVixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVUsbUJBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFXLGdCQUFBLEdBQUFaLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBWSxZQUFBLEdBQUFiLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQWEsd0JBQUEsR0FBQWQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFjLGVBQUEsR0FBQWYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFlLDJCQUFBLEdBQUFoQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWdCLG1CQUFBLEdBQUFqQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWlCLHlCQUFBLEdBQUFsQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWtCLHlCQUFB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