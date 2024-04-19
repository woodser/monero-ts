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
   * @param {fs} - Node.js compatible file system to use (optional, defaults to disk if nodejs)
   * @return {boolean} true if a wallet exists at the given path, false otherwise
   */
  static async walletExists(path, fs) {
    (0, _assert.default)(path, "Must provide a path to look for a wallet");
    if (!fs) fs = MoneroWalletFull.getFs();
    if (!fs) throw new _MoneroError.default("Must provide file system to check if wallet exists");
    const exists = await fs.exists(path + ".keys");
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

    // set server from connection manager if provided
    if (config.getConnectionManager()) {
      if (config.getServer()) throw new _MoneroError.default("Wallet can be opened with a server or connection manager but not both");
      config.setServer(config.getConnectionManager().getConnection());
    }

    // read wallet data from disk unless provided
    if (!config.getKeysData()) {
      let fs = config.getFs() ? config.getFs() : MoneroWalletFull.getFs();
      if (!fs) throw new _MoneroError.default("Must provide file system to read wallet data from");
      if (!(await this.walletExists(config.getPath(), fs))) throw new _MoneroError.default("Wallet does not exist at path: " + config.getPath());
      config.setKeysData(await fs.readFile(config.getPath() + ".keys"));
      config.setCacheData((await fs.exists(config.getPath())) ? await fs.readFile(config.getPath()) : "");
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
    let module = await _LibraryUtils.default.loadFullModule();

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
    let module = await _LibraryUtils.default.loadFullModule();

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
    let module = await _LibraryUtils.default.loadFullModule();

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
    let module = await _LibraryUtils.default.loadFullModule();
    return module.queueTask(async () => {
      return JSON.parse(module.get_keys_wallet_seed_languages()).languages;
    });
  }

  static getFs() {
    if (!MoneroWalletFull.FS) MoneroWalletFull.FS = _fs.default;
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
    await this.module.queueTask(async () => {
      if (this.getWalletProxy()) return this.getWalletProxy().moveTo(path);
      return MoneroWalletFull.moveTo(path, this);
    });
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
        if (result.charAt(0) !== "{") throw new _MoneroError.default(result);
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
        if (result.charAt(0) !== "{") throw new _MoneroError.default(result);
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
            if (resp.charAt(0) !== "{") reject(new _MoneroError.default(resp));else
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
          if (blocksJsonStr.charAt(0) !== "{") {
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
          if (blocksJsonStr.charAt(0) !== "{") {
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
          if (blocksJsonStr.charAt(0) !== "{") {
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
          let keyImages = [];
          for (let keyImageJson of JSON.parse(_GenUtils.default.stringifyBigInts(keyImagesStr)).keyImages) keyImages.push(new _MoneroKeyImage.default(keyImageJson));
          resolve(keyImages);
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
          resolve(new _MoneroKeyImageImportResult.default(JSON.parse(_GenUtils.default.stringifyBigInts(keyImageImportResultStr))));
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
          if (txHashesJson.charAt(0) !== "{") reject(new _MoneroError.default(txHashesJson));else
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
          if (resp.charAt(0) !== "{") reject(new _MoneroError.default(resp));else
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
          if (respJsonStr.charAt(0) !== "{") reject(new _MoneroError.default(respJsonStr));else
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
          if (respJsonStr.charAt(0) !== "{") reject(new _MoneroError.default(respJsonStr));else
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
          if (respJsonStr.charAt(0) !== "{") reject(new _MoneroError.default(respJsonStr, -1));else
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
          if (resp.charAt(0) !== "{") reject(new _MoneroError.default(resp));else
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
          if (resp.charAt(0) !== "{") reject(new _MoneroError.default(resp));else
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
    await this.module.queueTask(async () => {
      if (this.getWalletProxy()) return this.getWalletProxy().save();
      return MoneroWalletFull.save(this);
    });
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
    let module = await _LibraryUtils.default.loadFullModule();

    // open wallet in queue
    return module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // register fn informing if unauthorized reqs should be rejected
        let rejectUnauthorizedFnId = _GenUtils.default.getUUID();
        _LibraryUtils.default.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => rejectUnauthorized);

        // create wallet in wasm which invokes callback when done
        module.open_wallet_full(config.password, config.networkType, config.keysData ?? "", config.cacheData ?? "", daemonUri, daemonUsername, daemonPassword, rejectUnauthorizedFnId, (cppAddress) => {
          if (typeof cppAddress === "string") reject(new _MoneroError.default(cppAddress));else
          resolve(new MoneroWalletFull(cppAddress, config.path, config.password, _fs.default, rejectUnauthorized, rejectUnauthorizedFnId));
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
    if (await wallet.isClosed()) throw new _MoneroError.default("Wallet is closed");
    if (!path) throw new _MoneroError.default("Must provide path of destination wallet");

    // save and return if same path
    if (_path.default.normalize(wallet.path) === _path.default.normalize(path)) {
      await wallet.save();
      return;
    }

    // create destination directory if it doesn't exist
    let walletDir = _path.default.dirname(path);
    if (!(await wallet.fs.exists(walletDir))) {
      try {await wallet.fs.mkdir(walletDir);}
      catch (err) {throw new _MoneroError.default("Destination path " + path + " does not exist and cannot be created: " + err.message);}
    }

    // write wallet files
    let data = await wallet.getData();
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
  }

  static async save(wallet) {
    if (await wallet.isClosed()) throw new _MoneroError.default("Wallet is closed");

    // path must be set
    let path = await wallet.getPath();
    if (!path) throw new _MoneroError.default("Cannot save wallet because path is not set");

    // write wallet files to *.new
    let pathNew = path + ".new";
    let data = await wallet.getData();
    await wallet.fs.writeFile(pathNew + ".keys", data[0], "binary");
    await wallet.fs.writeFile(pathNew, data[1], "binary");
    await wallet.fs.writeFile(pathNew + ".address.txt", await wallet.getPrimaryAddress());

    // remove old wallet files
    await wallet.fs.unlink(path + ".keys");
    await wallet.fs.unlink(path);
    await wallet.fs.unlink(path + ".address.txt");

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
    await _LibraryUtils.default.queueTask(async () => {
      return MoneroWalletFull.moveTo(path, this);
    });
  }

  async changePassword(oldPassword, newPassword) {
    await this.invokeWorker("changePassword", Array.from(arguments));
    if (this.path) await this.save(); // auto save
  }

  async save() {
    await _LibraryUtils.default.queueTask(async () => {
      return MoneroWalletFull.save(this);
    });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfcGF0aCIsIl9HZW5VdGlscyIsIl9MaWJyYXJ5VXRpbHMiLCJfVGFza0xvb3BlciIsIl9Nb25lcm9BY2NvdW50IiwiX01vbmVyb0FjY291bnRUYWciLCJfTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1JwY0Nvbm5lY3Rpb24iLCJfTW9uZXJvU3ViYWRkcmVzcyIsIl9Nb25lcm9TeW5jUmVzdWx0IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4U2V0IiwiX01vbmVyb1R4V2FsbGV0IiwiX01vbmVyb1dhbGxldCIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRMaXN0ZW5lciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiX2ZzIiwiTW9uZXJvV2FsbGV0RnVsbCIsIk1vbmVyb1dhbGxldEtleXMiLCJERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIiwiY29uc3RydWN0b3IiLCJjcHBBZGRyZXNzIiwicGF0aCIsInBhc3N3b3JkIiwiZnMiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJyZWplY3RVbmF1dGhvcml6ZWRGbklkIiwid2FsbGV0UHJveHkiLCJsaXN0ZW5lcnMiLCJnZXRGcyIsInVuZGVmaW5lZCIsIl9pc0Nsb3NlZCIsIndhc21MaXN0ZW5lciIsIldhbGxldFdhc21MaXN0ZW5lciIsIndhc21MaXN0ZW5lckhhbmRsZSIsInJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkIiwic3luY1BlcmlvZEluTXMiLCJMaWJyYXJ5VXRpbHMiLCJzZXRSZWplY3RVbmF1dGhvcml6ZWRGbiIsIndhbGxldEV4aXN0cyIsImFzc2VydCIsIk1vbmVyb0Vycm9yIiwiZXhpc3RzIiwibG9nIiwib3BlbldhbGxldCIsImNvbmZpZyIsIk1vbmVyb1dhbGxldENvbmZpZyIsImdldFByb3h5VG9Xb3JrZXIiLCJzZXRQcm94eVRvV29ya2VyIiwiZ2V0U2VlZCIsImdldFNlZWRPZmZzZXQiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0UmVzdG9yZUhlaWdodCIsImdldExhbmd1YWdlIiwiZ2V0U2F2ZUN1cnJlbnQiLCJnZXRDb25uZWN0aW9uTWFuYWdlciIsImdldFNlcnZlciIsInNldFNlcnZlciIsImdldENvbm5lY3Rpb24iLCJnZXRLZXlzRGF0YSIsImdldFBhdGgiLCJzZXRLZXlzRGF0YSIsInJlYWRGaWxlIiwic2V0Q2FjaGVEYXRhIiwid2FsbGV0Iiwib3BlbldhbGxldERhdGEiLCJzZXRDb25uZWN0aW9uTWFuYWdlciIsImNyZWF0ZVdhbGxldCIsImdldE5ldHdvcmtUeXBlIiwiTW9uZXJvTmV0d29ya1R5cGUiLCJ2YWxpZGF0ZSIsInNldFBhdGgiLCJnZXRQYXNzd29yZCIsInNldFBhc3N3b3JkIiwiTW9uZXJvV2FsbGV0RnVsbFByb3h5IiwiY3JlYXRlV2FsbGV0RnJvbVNlZWQiLCJjcmVhdGVXYWxsZXRGcm9tS2V5cyIsImNyZWF0ZVdhbGxldFJhbmRvbSIsImRhZW1vbkNvbm5lY3Rpb24iLCJnZXRSZWplY3RVbmF1dGhvcml6ZWQiLCJzZXRSZXN0b3JlSGVpZ2h0Iiwic2V0U2VlZE9mZnNldCIsIm1vZHVsZSIsImxvYWRGdWxsTW9kdWxlIiwicXVldWVUYXNrIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJHZW5VdGlscyIsImdldFVVSUQiLCJjcmVhdGVfZnVsbF93YWxsZXQiLCJKU09OIiwic3RyaW5naWZ5IiwidG9Kc29uIiwic2F2ZSIsInNldFByaW1hcnlBZGRyZXNzIiwic2V0UHJpdmF0ZVZpZXdLZXkiLCJzZXRQcml2YXRlU3BlbmRLZXkiLCJzZXRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJwYXJzZSIsImdldF9rZXlzX3dhbGxldF9zZWVkX2xhbmd1YWdlcyIsImxhbmd1YWdlcyIsIkZTIiwiZ2V0RGFlbW9uTWF4UGVlckhlaWdodCIsImdldFdhbGxldFByb3h5IiwiYXNzZXJ0Tm90Q2xvc2VkIiwiZ2V0X2RhZW1vbl9tYXhfcGVlcl9oZWlnaHQiLCJyZXNwIiwiaXNEYWVtb25TeW5jZWQiLCJpc19kYWVtb25fc3luY2VkIiwiaXNTeW5jZWQiLCJpc19zeW5jZWQiLCJnZXRfbmV0d29ya190eXBlIiwiZ2V0X3Jlc3RvcmVfaGVpZ2h0IiwicmVzdG9yZUhlaWdodCIsInNldF9yZXN0b3JlX2hlaWdodCIsIm1vdmVUbyIsImFkZExpc3RlbmVyIiwibGlzdGVuZXIiLCJyZWZyZXNoTGlzdGVuaW5nIiwicmVtb3ZlTGlzdGVuZXIiLCJnZXRMaXN0ZW5lcnMiLCJzZXREYWVtb25Db25uZWN0aW9uIiwidXJpT3JDb25uZWN0aW9uIiwiY29ubmVjdGlvbiIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJ1cmkiLCJnZXRVcmkiLCJ1c2VybmFtZSIsImdldFVzZXJuYW1lIiwic2V0X2RhZW1vbl9jb25uZWN0aW9uIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImNvbm5lY3Rpb25Db250YWluZXJTdHIiLCJnZXRfZGFlbW9uX2Nvbm5lY3Rpb24iLCJqc29uQ29ubmVjdGlvbiIsImlzQ29ubmVjdGVkVG9EYWVtb24iLCJpc19jb25uZWN0ZWRfdG9fZGFlbW9uIiwiZ2V0VmVyc2lvbiIsImdldEludGVncmF0ZWRBZGRyZXNzIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwicmVzdWx0IiwiZ2V0X2ludGVncmF0ZWRfYWRkcmVzcyIsImNoYXJBdCIsIk1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwiZXJyIiwibWVzc2FnZSIsImluY2x1ZGVzIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbnRlZ3JhdGVkQWRkcmVzcyIsImRlY29kZV9pbnRlZ3JhdGVkX2FkZHJlc3MiLCJnZXRIZWlnaHQiLCJnZXRfaGVpZ2h0IiwiZ2V0RGFlbW9uSGVpZ2h0IiwiZ2V0X2RhZW1vbl9oZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJnZXRfaGVpZ2h0X2J5X2RhdGUiLCJzeW5jIiwibGlzdGVuZXJPclN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJhbGxvd0NvbmN1cnJlbnRDYWxscyIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwiTWF0aCIsIm1heCIsInRoYXQiLCJzeW5jV2FzbSIsInJlc3BKc29uIiwiTW9uZXJvU3luY1Jlc3VsdCIsIm51bUJsb2Nrc0ZldGNoZWQiLCJyZWNlaXZlZE1vbmV5IiwiZSIsInN0YXJ0U3luY2luZyIsInN5bmNMb29wZXIiLCJUYXNrTG9vcGVyIiwiYmFja2dyb3VuZFN5bmMiLCJzdGFydCIsInN0b3BTeW5jaW5nIiwic3RvcCIsInN0b3Bfc3luY2luZyIsInNjYW5UeHMiLCJ0eEhhc2hlcyIsInNjYW5fdHhzIiwicmVzY2FuU3BlbnQiLCJyZXNjYW5fc3BlbnQiLCJyZXNjYW5CbG9ja2NoYWluIiwicmVzY2FuX2Jsb2NrY2hhaW4iLCJnZXRCYWxhbmNlIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJiYWxhbmNlU3RyIiwiZ2V0X2JhbGFuY2Vfd2FsbGV0IiwiZ2V0X2JhbGFuY2VfYWNjb3VudCIsImdldF9iYWxhbmNlX3N1YmFkZHJlc3MiLCJCaWdJbnQiLCJzdHJpbmdpZnlCaWdJbnRzIiwiYmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsInVubG9ja2VkQmFsYW5jZVN0ciIsImdldF91bmxvY2tlZF9iYWxhbmNlX3dhbGxldCIsImdldF91bmxvY2tlZF9iYWxhbmNlX2FjY291bnQiLCJnZXRfdW5sb2NrZWRfYmFsYW5jZV9zdWJhZGRyZXNzIiwidW5sb2NrZWRCYWxhbmNlIiwiZ2V0QWNjb3VudHMiLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwiYWNjb3VudHNTdHIiLCJnZXRfYWNjb3VudHMiLCJhY2NvdW50cyIsImFjY291bnRKc29uIiwicHVzaCIsInNhbml0aXplQWNjb3VudCIsIk1vbmVyb0FjY291bnQiLCJnZXRBY2NvdW50IiwiYWNjb3VudFN0ciIsImdldF9hY2NvdW50IiwiY3JlYXRlQWNjb3VudCIsImxhYmVsIiwiY3JlYXRlX2FjY291bnQiLCJnZXRTdWJhZGRyZXNzZXMiLCJzdWJhZGRyZXNzSW5kaWNlcyIsImFyZ3MiLCJsaXN0aWZ5Iiwic3ViYWRkcmVzc2VzSnNvbiIsImdldF9zdWJhZGRyZXNzZXMiLCJzdWJhZGRyZXNzZXMiLCJzdWJhZGRyZXNzSnNvbiIsInNhbml0aXplU3ViYWRkcmVzcyIsIk1vbmVyb1N1YmFkZHJlc3MiLCJjcmVhdGVTdWJhZGRyZXNzIiwic3ViYWRkcmVzc1N0ciIsImNyZWF0ZV9zdWJhZGRyZXNzIiwic2V0U3ViYWRkcmVzc0xhYmVsIiwic2V0X3N1YmFkZHJlc3NfbGFiZWwiLCJnZXRUeHMiLCJxdWVyeSIsInF1ZXJ5Tm9ybWFsaXplZCIsIk1vbmVyb1dhbGxldCIsIm5vcm1hbGl6ZVR4UXVlcnkiLCJnZXRfdHhzIiwiZ2V0QmxvY2siLCJibG9ja3NKc29uU3RyIiwiZGVzZXJpYWxpemVUeHMiLCJnZXRUcmFuc2ZlcnMiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiZ2V0X3RyYW5zZmVycyIsImdldFR4UXVlcnkiLCJkZXNlcmlhbGl6ZVRyYW5zZmVycyIsImdldE91dHB1dHMiLCJub3JtYWxpemVPdXRwdXRRdWVyeSIsImdldF9vdXRwdXRzIiwiZGVzZXJpYWxpemVPdXRwdXRzIiwiZXhwb3J0T3V0cHV0cyIsImFsbCIsImV4cG9ydF9vdXRwdXRzIiwib3V0cHV0c0hleCIsImltcG9ydE91dHB1dHMiLCJpbXBvcnRfb3V0cHV0cyIsIm51bUltcG9ydGVkIiwiZXhwb3J0S2V5SW1hZ2VzIiwiZXhwb3J0X2tleV9pbWFnZXMiLCJrZXlJbWFnZXNTdHIiLCJrZXlJbWFnZXMiLCJrZXlJbWFnZUpzb24iLCJNb25lcm9LZXlJbWFnZSIsImltcG9ydEtleUltYWdlcyIsImltcG9ydF9rZXlfaW1hZ2VzIiwibWFwIiwia2V5SW1hZ2UiLCJrZXlJbWFnZUltcG9ydFJlc3VsdFN0ciIsIk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IiwiZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQiLCJmcmVlemVPdXRwdXQiLCJmcmVlemVfb3V0cHV0IiwidGhhd091dHB1dCIsInRoYXdfb3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJpc19vdXRwdXRfZnJvemVuIiwiY3JlYXRlVHhzIiwiY29uZmlnTm9ybWFsaXplZCIsIm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyIsImdldENhblNwbGl0Iiwic2V0Q2FuU3BsaXQiLCJjcmVhdGVfdHhzIiwidHhTZXRKc29uU3RyIiwiTW9uZXJvVHhTZXQiLCJzd2VlcE91dHB1dCIsIm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnIiwic3dlZXBfb3V0cHV0Iiwic3dlZXBVbmxvY2tlZCIsIm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWciLCJzd2VlcF91bmxvY2tlZCIsInR4U2V0c0pzb24iLCJ0eFNldHMiLCJ0eFNldEpzb24iLCJ0eHMiLCJ0eFNldCIsInR4Iiwic3dlZXBEdXN0IiwicmVsYXkiLCJzd2VlcF9kdXN0Iiwic2V0VHhzIiwicmVsYXlUeHMiLCJ0eHNPck1ldGFkYXRhcyIsIkFycmF5IiwiaXNBcnJheSIsInR4TWV0YWRhdGFzIiwidHhPck1ldGFkYXRhIiwiTW9uZXJvVHhXYWxsZXQiLCJnZXRNZXRhZGF0YSIsInJlbGF5X3R4cyIsInR4SGFzaGVzSnNvbiIsImRlc2NyaWJlVHhTZXQiLCJ1bnNpZ25lZFR4SGV4IiwiZ2V0VW5zaWduZWRUeEhleCIsInNpZ25lZFR4SGV4IiwiZ2V0U2lnbmVkVHhIZXgiLCJtdWx0aXNpZ1R4SGV4IiwiZ2V0TXVsdGlzaWdUeEhleCIsImRlc2NyaWJlX3R4X3NldCIsImdldF9leGNlcHRpb25fbWVzc2FnZSIsInNpZ25UeHMiLCJzaWduX3R4cyIsInN1Ym1pdFR4cyIsInN1Ym1pdF90eHMiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIlNJR05fV0lUSF9TUEVORF9LRVkiLCJzaWduX21lc3NhZ2UiLCJ2ZXJpZnlNZXNzYWdlIiwiYWRkcmVzcyIsInNpZ25hdHVyZSIsInZlcmlmeV9tZXNzYWdlIiwiaXNHb29kIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCIsImlzT2xkIiwiU0lHTl9XSVRIX1ZJRVdfS0VZIiwidmVyc2lvbiIsImdldFR4S2V5IiwidHhIYXNoIiwiZ2V0X3R4X2tleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImNoZWNrX3R4X2tleSIsInJlc3BKc29uU3RyIiwiTW9uZXJvQ2hlY2tUeCIsImdldFR4UHJvb2YiLCJnZXRfdHhfcHJvb2YiLCJlcnJvcktleSIsImluZGV4T2YiLCJzdWJzdHJpbmciLCJsZW5ndGgiLCJjaGVja1R4UHJvb2YiLCJjaGVja190eF9wcm9vZiIsImdldFNwZW5kUHJvb2YiLCJnZXRfc3BlbmRfcHJvb2YiLCJjaGVja1NwZW5kUHJvb2YiLCJjaGVja19zcGVuZF9wcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldF9yZXNlcnZlX3Byb29mX3dhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJhbW91bnQiLCJnZXRfcmVzZXJ2ZV9wcm9vZl9hY2NvdW50IiwidG9TdHJpbmciLCJjaGVja1Jlc2VydmVQcm9vZiIsImNoZWNrX3Jlc2VydmVfcHJvb2YiLCJNb25lcm9DaGVja1Jlc2VydmUiLCJnZXRUeE5vdGVzIiwiZ2V0X3R4X25vdGVzIiwidHhOb3RlcyIsInNldFR4Tm90ZXMiLCJub3RlcyIsInNldF90eF9ub3RlcyIsImdldEFkZHJlc3NCb29rRW50cmllcyIsImVudHJ5SW5kaWNlcyIsImVudHJpZXMiLCJlbnRyeUpzb24iLCJnZXRfYWRkcmVzc19ib29rX2VudHJpZXMiLCJNb25lcm9BZGRyZXNzQm9va0VudHJ5IiwiYWRkQWRkcmVzc0Jvb2tFbnRyeSIsImRlc2NyaXB0aW9uIiwiYWRkX2FkZHJlc3NfYm9va19lbnRyeSIsImVkaXRBZGRyZXNzQm9va0VudHJ5IiwiaW5kZXgiLCJzZXRBZGRyZXNzIiwic2V0RGVzY3JpcHRpb24iLCJlZGl0X2FkZHJlc3NfYm9va19lbnRyeSIsImRlbGV0ZUFkZHJlc3NCb29rRW50cnkiLCJlbnRyeUlkeCIsImRlbGV0ZV9hZGRyZXNzX2Jvb2tfZW50cnkiLCJ0YWdBY2NvdW50cyIsImFjY291bnRJbmRpY2VzIiwidGFnX2FjY291bnRzIiwidW50YWdBY2NvdW50cyIsImdldEFjY291bnRUYWdzIiwiYWNjb3VudFRhZ3MiLCJhY2NvdW50VGFnSnNvbiIsImdldF9hY2NvdW50X3RhZ3MiLCJNb25lcm9BY2NvdW50VGFnIiwic2V0QWNjb3VudFRhZ0xhYmVsIiwic2V0X2FjY291bnRfdGFnX2xhYmVsIiwiZ2V0UGF5bWVudFVyaSIsImdldF9wYXltZW50X3VyaSIsInBhcnNlUGF5bWVudFVyaSIsIk1vbmVyb1R4Q29uZmlnIiwicGFyc2VfcGF5bWVudF91cmkiLCJnZXRBdHRyaWJ1dGUiLCJrZXkiLCJ2YWx1ZSIsImdldF9hdHRyaWJ1dGUiLCJzZXRBdHRyaWJ1dGUiLCJ2YWwiLCJzZXRfYXR0cmlidXRlIiwic3RhcnRNaW5pbmciLCJudW1UaHJlYWRzIiwiYmFja2dyb3VuZE1pbmluZyIsImlnbm9yZUJhdHRlcnkiLCJkYWVtb24iLCJNb25lcm9EYWVtb25ScGMiLCJjb25uZWN0VG9EYWVtb25ScGMiLCJzdG9wTWluaW5nIiwiaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCIsImlzX211bHRpc2lnX2ltcG9ydF9uZWVkZWQiLCJpc011bHRpc2lnIiwiaXNfbXVsdGlzaWciLCJnZXRNdWx0aXNpZ0luZm8iLCJNb25lcm9NdWx0aXNpZ0luZm8iLCJnZXRfbXVsdGlzaWdfaW5mbyIsInByZXBhcmVNdWx0aXNpZyIsInByZXBhcmVfbXVsdGlzaWciLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwidGhyZXNob2xkIiwibWFrZV9tdWx0aXNpZyIsImV4Y2hhbmdlTXVsdGlzaWdLZXlzIiwiZXhjaGFuZ2VfbXVsdGlzaWdfa2V5cyIsIk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsImV4cG9ydE11bHRpc2lnSGV4IiwiZXhwb3J0X211bHRpc2lnX2hleCIsImltcG9ydE11bHRpc2lnSGV4IiwiaW1wb3J0X211bHRpc2lnX2hleCIsInNpZ25NdWx0aXNpZ1R4SGV4Iiwic2lnbl9tdWx0aXNpZ190eF9oZXgiLCJNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJzdWJtaXRNdWx0aXNpZ1R4SGV4Iiwic2lnbmVkTXVsdGlzaWdUeEhleCIsInN1Ym1pdF9tdWx0aXNpZ190eF9oZXgiLCJnZXREYXRhIiwidmlld09ubHkiLCJpc1ZpZXdPbmx5Iiwidmlld3MiLCJjYWNoZUJ1ZmZlckxvYyIsImdldF9jYWNoZV9maWxlX2J1ZmZlciIsInZpZXciLCJEYXRhVmlldyIsIkFycmF5QnVmZmVyIiwiaSIsInNldEludDgiLCJIRUFQVTgiLCJwb2ludGVyIiwiVWludDhBcnJheSIsIkJZVEVTX1BFUl9FTEVNRU5UIiwiX2ZyZWUiLCJCdWZmZXIiLCJmcm9tIiwiYnVmZmVyIiwia2V5c0J1ZmZlckxvYyIsImdldF9rZXlzX2ZpbGVfYnVmZmVyIiwidW5zaGlmdCIsImNoYW5nZVBhc3N3b3JkIiwib2xkUGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsImNoYW5nZV93YWxsZXRfcGFzc3dvcmQiLCJlcnJNc2ciLCJjbG9zZSIsImdldE51bUJsb2Nrc1RvVW5sb2NrIiwiZ2V0VHgiLCJnZXRJbmNvbWluZ1RyYW5zZmVycyIsImdldE91dGdvaW5nVHJhbnNmZXJzIiwiY3JlYXRlVHgiLCJyZWxheVR4IiwiZ2V0VHhOb3RlIiwic2V0VHhOb3RlIiwibm90ZSIsInByb3h5VG9Xb3JrZXIiLCJuZXR3b3JrVHlwZSIsImRhZW1vblVyaSIsImRhZW1vblVzZXJuYW1lIiwiZGFlbW9uUGFzc3dvcmQiLCJvcGVuX3dhbGxldF9mdWxsIiwia2V5c0RhdGEiLCJjYWNoZURhdGEiLCJicm93c2VyTWFpblBhdGgiLCJjb25zb2xlIiwiZXJyb3IiLCJpc0VuYWJsZWQiLCJzZXRfbGlzdGVuZXIiLCJuZXdMaXN0ZW5lckhhbmRsZSIsImhlaWdodCIsImVuZEhlaWdodCIsInBlcmNlbnREb25lIiwib25TeW5jUHJvZ3Jlc3MiLCJvbk5ld0Jsb2NrIiwibmV3QmFsYW5jZVN0ciIsIm5ld1VubG9ja2VkQmFsYW5jZVN0ciIsIm9uQmFsYW5jZXNDaGFuZ2VkIiwiYW1vdW50U3RyIiwidW5sb2NrVGltZSIsImlzTG9ja2VkIiwib25PdXRwdXRSZWNlaXZlZCIsImFjY291bnRJZHhTdHIiLCJzdWJhZGRyZXNzSWR4U3RyIiwib25PdXRwdXRTcGVudCIsInNhbml0aXplQmxvY2siLCJibG9jayIsInNhbml0aXplVHhXYWxsZXQiLCJhY2NvdW50Iiwic3ViYWRkcmVzcyIsImRlc2VyaWFsaXplQmxvY2tzIiwiYmxvY2tzSnNvbiIsImRlc2VyaWFsaXplZEJsb2NrcyIsImJsb2NrcyIsImJsb2NrSnNvbiIsIk1vbmVyb0Jsb2NrIiwiRGVzZXJpYWxpemF0aW9uVHlwZSIsIlRYX1dBTExFVCIsInNldEJsb2NrIiwiZ2V0SGFzaGVzIiwidHhNYXAiLCJNYXAiLCJnZXRIYXNoIiwidHhzU29ydGVkIiwidHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlciIsInRyYW5zZmVyIiwib3V0cHV0cyIsIm91dHB1dCIsInNldEJyb3dzZXJNYWluUGF0aCIsImlzQ2xvc2VkIiwiUGF0aCIsIm5vcm1hbGl6ZSIsIndhbGxldERpciIsImRpcm5hbWUiLCJta2RpciIsImRhdGEiLCJ3cml0ZUZpbGUiLCJvbGRQYXRoIiwidW5saW5rIiwicGF0aE5ldyIsInJlbmFtZSIsImV4cG9ydHMiLCJkZWZhdWx0IiwiTW9uZXJvV2FsbGV0S2V5c1Byb3h5Iiwid2FsbGV0SWQiLCJpbnZva2VXb3JrZXIiLCJnZXRXb3JrZXIiLCJ3b3JrZXIiLCJ3cmFwcGVkTGlzdGVuZXJzIiwiYXJndW1lbnRzIiwidXJpT3JScGNDb25uZWN0aW9uIiwiZ2V0Q29uZmlnIiwicnBjQ29uZmlnIiwid3JhcHBlZExpc3RlbmVyIiwiV2FsbGV0V29ya2VyTGlzdGVuZXIiLCJsaXN0ZW5lcklkIiwiZ2V0SWQiLCJhZGRXb3JrZXJDYWxsYmFjayIsImdldExpc3RlbmVyIiwicmVtb3ZlV29ya2VyQ2FsbGJhY2siLCJzcGxpY2UiLCJyZXN1bHRKc29uIiwiYmxvY2tKc29ucyIsImtleUltYWdlc0pzb24iLCJhbm5vdW5jZVN5bmNQcm9ncmVzcyIsImFubm91bmNlTmV3QmxvY2siLCJhbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZCIsIk1vbmVyb091dHB1dFdhbGxldCIsInNldEFtb3VudCIsInNldEFjY291bnRJbmRleCIsInNldFN1YmFkZHJlc3NJbmRleCIsInNldEhhc2giLCJzZXRWZXJzaW9uIiwic2V0VW5sb2NrVGltZSIsInNldFR4Iiwic2V0T3V0cHV0cyIsInNldElzSW5jb21pbmciLCJzZXRJc0xvY2tlZCIsInNldEhlaWdodCIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc0ZhaWxlZCIsImFubm91bmNlT3V0cHV0UmVjZWl2ZWQiLCJwYXJzZUludCIsInNldElucHV0cyIsImFubm91bmNlT3V0cHV0U3BlbnQiLCJpZCIsImdldElucHV0cyJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRGdWxsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IFBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuLi9jb21tb24vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgVGFza0xvb3BlciBmcm9tIFwiLi4vY29tbW9uL1Rhc2tMb29wZXJcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50IGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50VGFnIGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRUYWdcIjtcbmltcG9ydCBNb25lcm9BZGRyZXNzQm9va0VudHJ5IGZyb20gXCIuL21vZGVsL01vbmVyb0FkZHJlc3NCb29rRW50cnlcIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tSZXNlcnZlIGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrUmVzZXJ2ZVwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblJwYyBmcm9tIFwiLi4vZGFlbW9uL01vbmVyb0RhZW1vblJwY1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbmNvbWluZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb0luY29taW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnU2lnblJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1N1YmFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVHhcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgeyBNb25lcm9XYWxsZXRLZXlzLCBNb25lcm9XYWxsZXRLZXlzUHJveHkgfSBmcm9tIFwiLi9Nb25lcm9XYWxsZXRLZXlzXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVybyB3YWxsZXQgdXNpbmcgY2xpZW50LXNpZGUgV2ViQXNzZW1ibHkgYmluZGluZ3MgdG8gbW9uZXJvLXByb2plY3QncyB3YWxsZXQyIGluIEMrKy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvV2FsbGV0RnVsbCBleHRlbmRzIE1vbmVyb1dhbGxldEtleXMge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TID0gMjAwMDA7XG4gIHByb3RlY3RlZCBzdGF0aWMgRlM7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBwYXRoOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBwYXNzd29yZDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiBNb25lcm9XYWxsZXRMaXN0ZW5lcltdO1xuICBwcm90ZWN0ZWQgZnM6IGFueTtcbiAgcHJvdGVjdGVkIHdhc21MaXN0ZW5lcjogV2FsbGV0V2FzbUxpc3RlbmVyO1xuICBwcm90ZWN0ZWQgd2FzbUxpc3RlbmVySGFuZGxlOiBudW1iZXI7XG4gIHByb3RlY3RlZCByZWplY3RVbmF1dGhvcml6ZWQ6IGJvb2xlYW47XG4gIHByb3RlY3RlZCByZWplY3RVbmF1dGhvcml6ZWRDb25maWdJZDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgc3luY1BlcmlvZEluTXM6IG51bWJlcjtcbiAgcHJvdGVjdGVkIHN5bmNMb29wZXI6IFRhc2tMb29wZXI7XG4gIHByb3RlY3RlZCBicm93c2VyTWFpblBhdGg6IHN0cmluZztcblxuICAvKipcbiAgICogSW50ZXJuYWwgY29uc3RydWN0b3Igd2hpY2ggaXMgZ2l2ZW4gdGhlIG1lbW9yeSBhZGRyZXNzIG9mIGEgQysrIHdhbGxldCBpbnN0YW5jZS5cbiAgICogXG4gICAqIFRoaXMgY29uc3RydWN0b3Igc2hvdWxkIGJlIGNhbGxlZCB0aHJvdWdoIHN0YXRpYyB3YWxsZXQgY3JlYXRpb24gdXRpbGl0aWVzIGluIHRoaXMgY2xhc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gY3BwQWRkcmVzcyAtIGFkZHJlc3Mgb2YgdGhlIHdhbGxldCBpbnN0YW5jZSBpbiBDKytcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBwYXRoIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3N3b3JkIC0gcGFzc3dvcmQgb2YgdGhlIHdhbGxldCBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge0ZpbGVTeXN0ZW19IGZzIC0gbm9kZS5qcy1jb21wYXRpYmxlIGZpbGUgc3lzdGVtIHRvIHJlYWQvd3JpdGUgd2FsbGV0IGZpbGVzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gcmVqZWN0VW5hdXRob3JpemVkIC0gc3BlY2lmaWVzIGlmIHVuYXV0aG9yaXplZCByZXF1ZXN0cyAoZS5nLiBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMpIHNob3VsZCBiZSByZWplY3RlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVqZWN0VW5hdXRob3JpemVkRm5JZCAtIHVuaXF1ZSBpZGVudGlmaWVyIGZvciBodHRwX2NsaWVudF93YXNtIHRvIHF1ZXJ5IHJlamVjdFVuYXV0aG9yaXplZFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldEZ1bGxQcm94eX0gd2FsbGV0UHJveHkgLSBwcm94eSB0byBpbnZva2Ugd2FsbGV0IG9wZXJhdGlvbnMgaW4gYSB3ZWIgd29ya2VyXG4gICAqIFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY29uc3RydWN0b3IoY3BwQWRkcmVzcywgcGF0aCwgcGFzc3dvcmQsIGZzLCByZWplY3RVbmF1dGhvcml6ZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIHdhbGxldFByb3h5PzogTW9uZXJvV2FsbGV0RnVsbFByb3h5KSB7XG4gICAgc3VwZXIoY3BwQWRkcmVzcywgd2FsbGV0UHJveHkpO1xuICAgIGlmICh3YWxsZXRQcm94eSkgcmV0dXJuO1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5wYXNzd29yZCA9IHBhc3N3b3JkO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gICAgdGhpcy5mcyA9IGZzID8gZnMgOiAocGF0aCA/IE1vbmVyb1dhbGxldEZ1bGwuZ2V0RnMoKSA6IHVuZGVmaW5lZCk7XG4gICAgdGhpcy5faXNDbG9zZWQgPSBmYWxzZTtcbiAgICB0aGlzLndhc21MaXN0ZW5lciA9IG5ldyBXYWxsZXRXYXNtTGlzdGVuZXIodGhpcyk7IC8vIHJlY2VpdmVzIG5vdGlmaWNhdGlvbnMgZnJvbSB3YXNtIGMrK1xuICAgIHRoaXMud2FzbUxpc3RlbmVySGFuZGxlID0gMDsgICAgICAgICAgICAgICAgICAgICAgLy8gbWVtb3J5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCBsaXN0ZW5lciBpbiBjKytcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCA9IHJlamVjdFVuYXV0aG9yaXplZDtcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkID0gcmVqZWN0VW5hdXRob3JpemVkRm5JZDtcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gTW9uZXJvV2FsbGV0RnVsbC5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TO1xuICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCk7IC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgVVRJTElUSUVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogQ2hlY2sgaWYgYSB3YWxsZXQgZXhpc3RzIGF0IGEgZ2l2ZW4gcGF0aC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gcGF0aCBvZiB0aGUgd2FsbGV0IG9uIHRoZSBmaWxlIHN5c3RlbVxuICAgKiBAcGFyYW0ge2ZzfSAtIE5vZGUuanMgY29tcGF0aWJsZSBmaWxlIHN5c3RlbSB0byB1c2UgKG9wdGlvbmFsLCBkZWZhdWx0cyB0byBkaXNrIGlmIG5vZGVqcylcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBhIHdhbGxldCBleGlzdHMgYXQgdGhlIGdpdmVuIHBhdGgsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHdhbGxldEV4aXN0cyhwYXRoLCBmcykge1xuICAgIGFzc2VydChwYXRoLCBcIk11c3QgcHJvdmlkZSBhIHBhdGggdG8gbG9vayBmb3IgYSB3YWxsZXRcIik7XG4gICAgaWYgKCFmcykgZnMgPSBNb25lcm9XYWxsZXRGdWxsLmdldEZzKCk7XG4gICAgaWYgKCFmcykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGZpbGUgc3lzdGVtIHRvIGNoZWNrIGlmIHdhbGxldCBleGlzdHNcIik7XG4gICAgY29uc3QgZXhpc3RzID0gYXdhaXQgZnMuZXhpc3RzKHBhdGggKyBcIi5rZXlzXCIpO1xuICAgIExpYnJhcnlVdGlscy5sb2coMSwgXCJXYWxsZXQgZXhpc3RzIGF0IFwiICsgcGF0aCArIFwiOiBcIiArIGV4aXN0cyk7XG4gICAgcmV0dXJuIGV4aXN0cztcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIG9wZW5XYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcblxuICAgIC8vIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJveHlUb1dvcmtlcih0cnVlKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBzZWVkIHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgc2VlZCBvZmZzZXQgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcHJpbWFyeSBhZGRyZXNzIHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHByaXZhdGUgdmlldyBrZXkgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHByaXZhdGUgc3BlbmQga2V5IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcmVzdG9yZSBoZWlnaHQgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgbGFuZ3VhZ2Ugd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNhdmVDdXJyZW50KCkgPT09IHRydWUpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIGN1cnJlbnQgd2FsbGV0IHdoZW4gb3BlbmluZyBmdWxsIHdhbGxldFwiKTtcblxuICAgIC8vIHNldCBzZXJ2ZXIgZnJvbSBjb25uZWN0aW9uIG1hbmFnZXIgaWYgcHJvdmlkZWRcbiAgICBpZiAoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgb3BlbmVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGNvbmZpZy5zZXRTZXJ2ZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkuZ2V0Q29ubmVjdGlvbigpKTtcbiAgICB9XG5cbiAgICAvLyByZWFkIHdhbGxldCBkYXRhIGZyb20gZGlzayB1bmxlc3MgcHJvdmlkZWRcbiAgICBpZiAoIWNvbmZpZy5nZXRLZXlzRGF0YSgpKSB7XG4gICAgICBsZXQgZnMgPSBjb25maWcuZ2V0RnMoKSA/IGNvbmZpZy5nZXRGcygpIDogTW9uZXJvV2FsbGV0RnVsbC5nZXRGcygpO1xuICAgICAgaWYgKCFmcykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGZpbGUgc3lzdGVtIHRvIHJlYWQgd2FsbGV0IGRhdGEgZnJvbVwiKTtcbiAgICAgIGlmICghKGF3YWl0IHRoaXMud2FsbGV0RXhpc3RzKGNvbmZpZy5nZXRQYXRoKCksIGZzKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBkb2VzIG5vdCBleGlzdCBhdCBwYXRoOiBcIiArIGNvbmZpZy5nZXRQYXRoKCkpO1xuICAgICAgY29uZmlnLnNldEtleXNEYXRhKGF3YWl0IGZzLnJlYWRGaWxlKGNvbmZpZy5nZXRQYXRoKCkgKyBcIi5rZXlzXCIpKTtcbiAgICAgIGNvbmZpZy5zZXRDYWNoZURhdGEoYXdhaXQgZnMuZXhpc3RzKGNvbmZpZy5nZXRQYXRoKCkpID8gYXdhaXQgZnMucmVhZEZpbGUoY29uZmlnLmdldFBhdGgoKSkgOiBcIlwiKTtcbiAgICB9XG5cbiAgICAvLyBvcGVuIHdhbGxldCBmcm9tIGRhdGFcbiAgICBjb25zdCB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLm9wZW5XYWxsZXREYXRhKGNvbmZpZyk7XG5cbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAgYXdhaXQgd2FsbGV0LnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0KGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG5cbiAgICAvLyB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBjb25maWcgdG8gY3JlYXRlIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkICYmIChjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgbWF5IGJlIGluaXRpYWxpemVkIHdpdGggYSBzZWVkIG9yIGtleXMgYnV0IG5vdCBib3RoXCIpO1xuICAgIGlmIChjb25maWcuZ2V0TmV0d29ya1R5cGUoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYSBuZXR3b3JrVHlwZTogJ21haW5uZXQnLCAndGVzdG5ldCcgb3IgJ3N0YWdlbmV0J1wiKTtcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSB0cnVlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSBjdXJyZW50IHdhbGxldCB3aGVuIGNyZWF0aW5nIGZ1bGwgV0FTTSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFBhdGgoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgJiYgYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC53YWxsZXRFeGlzdHMoY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldEZzKCkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgYWxyZWFkeSBleGlzdHM6IFwiICsgY29uZmlnLmdldFBhdGgoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXNzd29yZCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQYXNzd29yZChcIlwiKTtcblxuICAgIC8vIHNldCBzZXJ2ZXIgZnJvbSBjb25uZWN0aW9uIG1hbmFnZXIgaWYgcHJvdmlkZWRcbiAgICBpZiAoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgY3JlYXRlZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBjb25maWcuc2V0U2VydmVyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpLmdldENvbm5lY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIHByb3hpZWQgb3IgbG9jYWwgd2FsbGV0XG4gICAgbGV0IHdhbGxldDtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJveHlUb1dvcmtlcih0cnVlKTtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSkge1xuICAgICAgbGV0IHdhbGxldFByb3h5ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbFByb3h5LmNyZWF0ZVdhbGxldChjb25maWcpO1xuICAgICAgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldEZ1bGwodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgd2FsbGV0UHJveHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBsYW5ndWFnZSB3aGVuIGNyZWF0aW5nIHdhbGxldCBmcm9tIHNlZWRcIik7XG4gICAgICAgIHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwuY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnKTtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgd2FsbGV0IGZyb20ga2V5c1wiKTtcbiAgICAgICAgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHJlc3RvcmVIZWlnaHQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgICAgICB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldFJhbmRvbShjb25maWcpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAgYXdhaXQgd2FsbGV0LnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG5cbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtc1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFJlc3RvcmVIZWlnaHQoMCk7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFNlZWRPZmZzZXQoXCJcIik7XG4gICAgXG4gICAgLy8gbG9hZCBmdWxsIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkRnVsbE1vZHVsZSgpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gcXVldWVcbiAgICBsZXQgd2FsbGV0ID0gYXdhaXQgbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgYXN5bmMgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0UGFzc3dvcmQoKSwgY29uZmlnLmdldEZzKCksIGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHNhdmUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBwYXJhbXNcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcmltYXJ5QWRkcmVzcyhcIlwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaXZhdGVWaWV3S2V5KFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaXZhdGVTcGVuZEtleShcIlwiKTtcbiAgICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkID0gZGFlbW9uQ29ubmVjdGlvbiA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB0cnVlO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRSZXN0b3JlSGVpZ2h0KDApO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoXCJFbmdsaXNoXCIpO1xuICAgIFxuICAgIC8vIGxvYWQgZnVsbCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEZ1bGxNb2R1bGUoKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHF1ZXVlXG4gICAgbGV0IHdhbGxldCA9IGF3YWl0IG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgYXN5bmMgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0UGFzc3dvcmQoKSwgY29uZmlnLmdldEZzKCksIGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHNhdmUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRSYW5kb20oY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtc1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoXCJFbmdsaXNoXCIpO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgXG4gICAgLy8gbG9hZCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEZ1bGxNb2R1bGUoKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHF1ZXVlXG4gICAgbGV0IHdhbGxldCA9IGF3YWl0IG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUuY3JlYXRlX2Z1bGxfd2FsbGV0KEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSksIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIGFzeW5jIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEZ1bGwoY3BwQWRkcmVzcywgY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldFBhc3N3b3JkKCksIGNvbmZpZy5nZXRGcygpLCBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBzYXZlIHdhbGxldFxuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBnZXRTZWVkTGFuZ3VhZ2VzKCkge1xuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEZ1bGxNb2R1bGUoKTtcbiAgICByZXR1cm4gbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShtb2R1bGUuZ2V0X2tleXNfd2FsbGV0X3NlZWRfbGFuZ3VhZ2VzKCkpLmxhbmd1YWdlcztcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRGcygpIHtcbiAgICBpZiAoIU1vbmVyb1dhbGxldEZ1bGwuRlMpIE1vbmVyb1dhbGxldEZ1bGwuRlMgPSBmcztcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5GUztcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tIFdBTExFVCBNRVRIT0RTIFNQRUNJRklDIFRPIFdBU00gSU1QTEVNRU5UQVRJT04gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBUT0RPOiBtb3ZlIHRoZXNlIHRvIE1vbmVyb1dhbGxldC50cywgb3RoZXJzIGNhbiBiZSB1bnN1cHBvcnRlZFxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbWF4aW11bSBoZWlnaHQgb2YgdGhlIHBlZXJzIHRoZSB3YWxsZXQncyBkYWVtb24gaXMgY29ubmVjdGVkIHRvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBtYXhpbXVtIGhlaWdodCBvZiB0aGUgcGVlcnMgdGhlIHdhbGxldCdzIGRhZW1vbiBpcyBjb25uZWN0ZWQgdG9cbiAgICovXG4gIGFzeW5jIGdldERhZW1vbk1heFBlZXJIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldERhZW1vbk1heFBlZXJIZWlnaHQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfZGFlbW9uX21heF9wZWVyX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0J3MgZGFlbW9uIGlzIHN5bmNlZCB3aXRoIHRoZSBuZXR3b3JrLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgZGFlbW9uIGlzIHN5bmNlZCB3aXRoIHRoZSBuZXR3b3JrLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzRGFlbW9uU3luY2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNEYWVtb25TeW5jZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5pc19kYWVtb25fc3luY2VkKHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSB3YWxsZXQgaXMgc3luY2VkIHdpdGggdGhlIGRhZW1vbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIHdhbGxldCBpcyBzeW5jZWQgd2l0aCB0aGUgZGFlbW9uLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzU3luY2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNTeW5jZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pc19zeW5jZWQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIG5ldHdvcmsgdHlwZSAobWFpbm5ldCwgdGVzdG5ldCwgb3Igc3RhZ2VuZXQpLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9OZXR3b3JrVHlwZT59IHRoZSB3YWxsZXQncyBuZXR3b3JrIHR5cGVcbiAgICovXG4gIGFzeW5jIGdldE5ldHdvcmtUeXBlKCk6IFByb21pc2U8TW9uZXJvTmV0d29ya1R5cGU+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE5ldHdvcmtUeXBlKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmdldF9uZXR3b3JrX3R5cGUodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBoZWlnaHQgb2YgdGhlIGZpcnN0IGJsb2NrIHRoYXQgdGhlIHdhbGxldCBzY2Fuc1xuICAgKi9cbiAgYXN5bmMgZ2V0UmVzdG9yZUhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UmVzdG9yZUhlaWdodCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5nZXRfcmVzdG9yZV9oZWlnaHQodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gcmVzdG9yZUhlaWdodCAtIGhlaWdodCBvZiB0aGUgZmlyc3QgYmxvY2sgdGhhdCB0aGUgd2FsbGV0IHNjYW5zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfcmVzdG9yZV9oZWlnaHQodGhpcy5jcHBBZGRyZXNzLCByZXN0b3JlSGVpZ2h0KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1vdmUgdGhlIHdhbGxldCBmcm9tIGl0cyBjdXJyZW50IHBhdGggdG8gdGhlIGdpdmVuIHBhdGguXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHRoZSB3YWxsZXQncyBkZXN0aW5hdGlvbiBwYXRoXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBtb3ZlVG8ocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkubW92ZVRvKHBhdGgpO1xuICAgICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwubW92ZVRvKHBhdGgsIHRoaXMpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBDT01NT04gV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb1dhbGxldExpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXdhaXQgc3VwZXIuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGF3YWl0IHN1cGVyLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXJzKCk6IE1vbmVyb1dhbGxldExpc3RlbmVyW10ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0TGlzdGVuZXJzKCk7XG4gICAgcmV0dXJuIHN1cGVyLmdldExpc3RlbmVycygpO1xuICB9XG4gIFxuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbj86IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uKTtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgY29ubmVjdGlvblxuICAgIGxldCBjb25uZWN0aW9uID0gIXVyaU9yQ29ubmVjdGlvbiA/IHVuZGVmaW5lZCA6IHVyaU9yQ29ubmVjdGlvbiBpbnN0YW5jZW9mIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPyB1cmlPckNvbm5lY3Rpb24gOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24pO1xuICAgIGxldCB1cmkgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0VXJpKCkgPyBjb25uZWN0aW9uLmdldFVyaSgpIDogXCJcIjtcbiAgICBsZXQgdXNlcm5hbWUgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA/IGNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA6IFwiXCI7XG4gICAgbGV0IHBhc3N3b3JkID0gY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgPyBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZDtcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCA9IHJlamVjdFVuYXV0aG9yaXplZDsgIC8vIHBlcnNpc3QgbG9jYWxseVxuICAgIFxuICAgIC8vIHNldCBjb25uZWN0aW9uIGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuc2V0X2RhZW1vbl9jb25uZWN0aW9uKHRoaXMuY3BwQWRkcmVzcywgdXJpLCB1c2VybmFtZSwgcGFzc3dvcmQsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGFlbW9uQ29ubmVjdGlvbigpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGxldCBjb25uZWN0aW9uQ29udGFpbmVyU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2RhZW1vbl9jb25uZWN0aW9uKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICAgIGlmICghY29ubmVjdGlvbkNvbnRhaW5lclN0cikgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBsZXQganNvbkNvbm5lY3Rpb24gPSBKU09OLnBhcnNlKGNvbm5lY3Rpb25Db250YWluZXJTdHIpO1xuICAgICAgICAgIHJlc29sdmUobmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oe3VyaToganNvbkNvbm5lY3Rpb24udXJpLCB1c2VybmFtZToganNvbkNvbm5lY3Rpb24udXNlcm5hbWUsIHBhc3N3b3JkOiBqc29uQ29ubmVjdGlvbi5wYXNzd29yZCwgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc0Nvbm5lY3RlZFRvRGFlbW9uKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaXNfY29ubmVjdGVkX3RvX2RhZW1vbih0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFZlcnNpb24oKTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcy5wYXRoO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3M/OiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5tb2R1bGUuZ2V0X2ludGVncmF0ZWRfYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIHN0YW5kYXJkQWRkcmVzcyA/IHN0YW5kYXJkQWRkcmVzcyA6IFwiXCIsIHBheW1lbnRJZCA/IHBheW1lbnRJZCA6IFwiXCIpO1xuICAgICAgICBpZiAocmVzdWx0LmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXN1bHQpO1xuICAgICAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKEpTT04ucGFyc2UocmVzdWx0KSk7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoXCJJbnZhbGlkIHBheW1lbnQgSURcIikpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgcGF5bWVudCBJRDogXCIgKyBwYXltZW50SWQpO1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3MpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzLm1vZHVsZS5kZWNvZGVfaW50ZWdyYXRlZF9hZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgaW50ZWdyYXRlZEFkZHJlc3MpO1xuICAgICAgICBpZiAocmVzdWx0LmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXN1bHQpO1xuICAgICAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKEpTT04ucGFyc2UocmVzdWx0KSk7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEhlaWdodCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9oZWlnaHQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGFlbW9uSGVpZ2h0KCk7XG4gICAgaWYgKCEoYXdhaXQgdGhpcy5pc0Nvbm5lY3RlZFRvRGFlbW9uKCkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X2RhZW1vbl9oZWlnaHQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodEJ5RGF0ZSh5ZWFyOiBudW1iZXIsIG1vbnRoOiBudW1iZXIsIGRheTogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEhlaWdodEJ5RGF0ZSh5ZWFyLCBtb250aCwgZGF5KTtcbiAgICBpZiAoIShhd2FpdCB0aGlzLmlzQ29ubmVjdGVkVG9EYWVtb24oKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfaGVpZ2h0X2J5X2RhdGUodGhpcy5jcHBBZGRyZXNzLCB5ZWFyLCBtb250aCwgZGF5LCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogU3luY2hyb25pemUgdGhlIHdhbGxldCB3aXRoIHRoZSBkYWVtb24gYXMgYSBvbmUtdGltZSBzeW5jaHJvbm91cyBwcm9jZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRMaXN0ZW5lcnxudW1iZXJ9IFtsaXN0ZW5lck9yU3RhcnRIZWlnaHRdIC0gbGlzdGVuZXIgeG9yIHN0YXJ0IGhlaWdodCAoZGVmYXVsdHMgdG8gbm8gc3luYyBsaXN0ZW5lciwgdGhlIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0SGVpZ2h0IGlmIG5vdCBnaXZlbiBpbiBmaXJzdCBhcmcgKGRlZmF1bHRzIHRvIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthbGxvd0NvbmN1cnJlbnRDYWxsc10gLSBhbGxvdyBvdGhlciB3YWxsZXQgbWV0aG9kcyB0byBiZSBwcm9jZXNzZWQgc2ltdWx0YW5lb3VzbHkgZHVyaW5nIHN5bmMgKGRlZmF1bHQgZmFsc2UpPGJyPjxicj48Yj5XQVJOSU5HPC9iPjogZW5hYmxpbmcgdGhpcyBvcHRpb24gd2lsbCBjcmFzaCB3YWxsZXQgZXhlY3V0aW9uIGlmIGFub3RoZXIgY2FsbCBtYWtlcyBhIHNpbXVsdGFuZW91cyBuZXR3b3JrIHJlcXVlc3QuIFRPRE86IHBvc3NpYmxlIHRvIHN5bmMgd2FzbSBuZXR3b3JrIHJlcXVlc3RzIGluIGh0dHBfY2xpZW50X3dhc20uY3BwPyBcbiAgICovXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBhbGxvd0NvbmN1cnJlbnRDYWxscyA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodCwgc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzKTtcbiAgICBpZiAoIShhd2FpdCB0aGlzLmlzQ29ubmVjdGVkVG9EYWVtb24oKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgcGFyYW1zXG4gICAgc3RhcnRIZWlnaHQgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCB8fCBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IHN0YXJ0SGVpZ2h0IDogbGlzdGVuZXJPclN0YXJ0SGVpZ2h0O1xuICAgIGxldCBsaXN0ZW5lciA9IGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyID8gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IDogdW5kZWZpbmVkO1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IE1hdGgubWF4KGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCksIGF3YWl0IHRoaXMuZ2V0UmVzdG9yZUhlaWdodCgpKTtcbiAgICBcbiAgICAvLyByZWdpc3RlciBsaXN0ZW5lciBpZiBnaXZlblxuICAgIGlmIChsaXN0ZW5lcikgYXdhaXQgdGhpcy5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gc3luYyB3YWxsZXRcbiAgICBsZXQgZXJyO1xuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICAgIHJlc3VsdCA9IGF3YWl0IChhbGxvd0NvbmN1cnJlbnRDYWxscyA/IHN5bmNXYXNtKCkgOiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4gc3luY1dhc20oKSkpO1xuICAgICAgZnVuY3Rpb24gc3luY1dhc20oKSB7XG4gICAgICAgIHRoYXQuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAgIC8vIHN5bmMgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgICB0aGF0Lm1vZHVsZS5zeW5jKHRoYXQuY3BwQWRkcmVzcywgc3RhcnRIZWlnaHQsIGFzeW5jIChyZXNwKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBsZXQgcmVzcEpzb24gPSBKU09OLnBhcnNlKHJlc3ApO1xuICAgICAgICAgICAgICByZXNvbHZlKG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3BKc29uLm51bUJsb2Nrc0ZldGNoZWQsIHJlc3BKc29uLnJlY2VpdmVkTW9uZXkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyID0gZTtcbiAgICB9XG4gICAgXG4gICAgLy8gdW5yZWdpc3RlciBsaXN0ZW5lclxuICAgIGlmIChsaXN0ZW5lcikgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gdGhyb3cgZXJyb3Igb3IgcmV0dXJuXG4gICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncz86IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zKTtcbiAgICBpZiAoIShhd2FpdCB0aGlzLmlzQ29ubmVjdGVkVG9EYWVtb24oKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gc3luY1BlcmlvZEluTXMgPT09IHVuZGVmaW5lZCA/IE1vbmVyb1dhbGxldEZ1bGwuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA6IHN5bmNQZXJpb2RJbk1zO1xuICAgIGlmICghdGhpcy5zeW5jTG9vcGVyKSB0aGlzLnN5bmNMb29wZXIgPSBuZXcgVGFza0xvb3Blcihhc3luYyAoKSA9PiBhd2FpdCB0aGlzLmJhY2tncm91bmRTeW5jKCkpXG4gICAgdGhpcy5zeW5jTG9vcGVyLnN0YXJ0KHRoaXMuc3luY1BlcmlvZEluTXMpO1xuICB9XG4gICAgXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RvcFN5bmNpbmcoKTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGlmICh0aGlzLnN5bmNMb29wZXIpIHRoaXMuc3luY0xvb3Blci5zdG9wKCk7XG4gICAgdGhpcy5tb2R1bGUuc3RvcF9zeW5jaW5nKHRoaXMuY3BwQWRkcmVzcyk7IC8vIHRhc2sgaXMgbm90IHF1ZXVlZCBzbyB3YWxsZXQgc3RvcHMgaW1tZWRpYXRlbHlcbiAgfVxuICBcbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNjYW5UeHModHhIYXNoZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNjYW5fdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3R4SGFzaGVzOiB0eEhhc2hlc30pLCAoZXJyKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihlcnIpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuU3BlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZXNjYW5TcGVudCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnJlc2Nhbl9zcGVudCh0aGlzLmNwcEFkZHJlc3MsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnJlc2NhbkJsb2NrY2hhaW4oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5yZXNjYW5fYmxvY2tjaGFpbih0aGlzLmNwcEFkZHJlc3MsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgXG4gICAgICAvLyBnZXQgYmFsYW5jZSBlbmNvZGVkIGluIGpzb24gc3RyaW5nXG4gICAgICBsZXQgYmFsYW5jZVN0cjtcbiAgICAgIGlmIChhY2NvdW50SWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCwgXCJTdWJhZGRyZXNzIGluZGV4IG11c3QgYmUgdW5kZWZpbmVkIGlmIGFjY291bnQgaW5kZXggaXMgdW5kZWZpbmVkXCIpO1xuICAgICAgICBiYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2JhbGFuY2Vfd2FsbGV0KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICB9IGVsc2UgaWYgKHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBiYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2JhbGFuY2VfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF9iYWxhbmNlX3N1YmFkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcGFyc2UganNvbiBzdHJpbmcgdG8gYmlnaW50XG4gICAgICByZXR1cm4gQmlnSW50KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhiYWxhbmNlU3RyKSkuYmFsYW5jZSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBcbiAgICAgIC8vIGdldCBiYWxhbmNlIGVuY29kZWQgaW4ganNvbiBzdHJpbmdcbiAgICAgIGxldCB1bmxvY2tlZEJhbGFuY2VTdHI7XG4gICAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFzc2VydChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQsIFwiU3ViYWRkcmVzcyBpbmRleCBtdXN0IGJlIHVuZGVmaW5lZCBpZiBhY2NvdW50IGluZGV4IGlzIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X3VubG9ja2VkX2JhbGFuY2Vfd2FsbGV0KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICB9IGVsc2UgaWYgKHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfdW5sb2NrZWRfYmFsYW5jZV9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfdW5sb2NrZWRfYmFsYW5jZV9zdWJhZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIHBhcnNlIGpzb24gc3RyaW5nIHRvIGJpZ2ludFxuICAgICAgcmV0dXJuIEJpZ0ludChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModW5sb2NrZWRCYWxhbmNlU3RyKSkudW5sb2NrZWRCYWxhbmNlKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHRhZz86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzLCB0YWcpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBhY2NvdW50c1N0ciA9IHRoaXMubW9kdWxlLmdldF9hY2NvdW50cyh0aGlzLmNwcEFkZHJlc3MsIGluY2x1ZGVTdWJhZGRyZXNzZXMgPyB0cnVlIDogZmFsc2UsIHRhZyA/IHRhZyA6IFwiXCIpO1xuICAgICAgbGV0IGFjY291bnRzID0gW107XG4gICAgICBmb3IgKGxldCBhY2NvdW50SnNvbiBvZiBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYWNjb3VudHNTdHIpKS5hY2NvdW50cykge1xuICAgICAgICBhY2NvdW50cy5wdXNoKE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjY291bnRzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFjY291bnQoYWNjb3VudElkeCwgaW5jbHVkZVN1YmFkZHJlc3Nlcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMgPyB0cnVlIDogZmFsc2UpO1xuICAgICAgbGV0IGFjY291bnRKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGFjY291bnRTdHIpKTtcbiAgICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpO1xuICAgIH0pO1xuXG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNyZWF0ZUFjY291bnQobGFiZWwpO1xuICAgIGlmIChsYWJlbCA9PT0gdW5kZWZpbmVkKSBsYWJlbCA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRTdHIgPSB0aGlzLm1vZHVsZS5jcmVhdGVfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGxhYmVsKTtcbiAgICAgIGxldCBhY2NvdW50SnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhhY2NvdW50U3RyKSk7XG4gICAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0luZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXMpO1xuICAgIGxldCBhcmdzID0ge2FjY291bnRJZHg6IGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzOiBzdWJhZGRyZXNzSW5kaWNlcyA9PT0gdW5kZWZpbmVkID8gW10gOiBHZW5VdGlscy5saXN0aWZ5KHN1YmFkZHJlc3NJbmRpY2VzKX07XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHN1YmFkZHJlc3Nlc0pzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModGhpcy5tb2R1bGUuZ2V0X3N1YmFkZHJlc3Nlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGFyZ3MpKSkpLnN1YmFkZHJlc3NlcztcbiAgICAgIGxldCBzdWJhZGRyZXNzZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3NKc29uIG9mIHN1YmFkZHJlc3Nlc0pzb24pIHN1YmFkZHJlc3Nlcy5wdXNoKE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSkpO1xuICAgICAgcmV0dXJuIHN1YmFkZHJlc3NlcztcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHgsIGxhYmVsKTtcbiAgICBpZiAobGFiZWwgPT09IHVuZGVmaW5lZCkgbGFiZWwgPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBzdWJhZGRyZXNzU3RyID0gdGhpcy5tb2R1bGUuY3JlYXRlX3N1YmFkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBsYWJlbCk7XG4gICAgICBsZXQgc3ViYWRkcmVzc0pzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoc3ViYWRkcmVzc1N0cikpO1xuICAgICAgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCk7XG4gICAgaWYgKGxhYmVsID09PSB1bmRlZmluZWQpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfc3ViYWRkcmVzc19sYWJlbCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5Pzogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeHMocXVlcnkpO1xuXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHhRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gc2NoZWR1bGUgdGFza1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFja1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkocXVlcnlOb3JtYWxpemVkLmdldEJsb2NrKCkudG9Kc29uKCkpLCAoYmxvY2tzSnNvblN0cikgPT4ge1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIGNoZWNrIGZvciBlcnJvclxuICAgICAgICAgIGlmIChibG9ja3NKc29uU3RyLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyByZXNvbHZlIHdpdGggZGVzZXJpYWxpemVkIHR4c1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXNvbHZlKE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVUeHMocXVlcnlOb3JtYWxpemVkLCBibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1RyYW5zZmVyW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFRyYW5zZmVycyhxdWVyeSk7XG4gICAgXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIG9uIGNhbGxiYWNrXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrXG4gICAgICAgIHRoaXMubW9kdWxlLmdldF90cmFuc2ZlcnModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkudG9Kc29uKCkpLCAoYmxvY2tzSnNvblN0cikgPT4ge1xuICAgICAgICAgICAgXG4gICAgICAgICAgLy8gY2hlY2sgZm9yIGVycm9yXG4gICAgICAgICAgaWYgKGJsb2Nrc0pzb25TdHIuY2hhckF0KDApICE9PSBcIntcIikge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgICBcbiAgICAgICAgICAvLyByZXNvbHZlIHdpdGggZGVzZXJpYWxpemVkIHRyYW5zZmVycyBcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb2x2ZShNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplVHJhbnNmZXJzKHF1ZXJ5Tm9ybWFsaXplZCwgYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9PdXRwdXRRdWVyeT4pOiBQcm9taXNlPE1vbmVyb091dHB1dFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRPdXRwdXRzKHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplT3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIG9uIGNhbGxiYWNrXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+e1xuICAgICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2tcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X291dHB1dHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkudG9Kc29uKCkpLCAoYmxvY2tzSnNvblN0cikgPT4ge1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIGNoZWNrIGZvciBlcnJvclxuICAgICAgICAgIGlmIChibG9ja3NKc29uU3RyLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyByZXNvbHZlIHdpdGggZGVzZXJpYWxpemVkIG91dHB1dHNcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb2x2ZShNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplT3V0cHV0cyhxdWVyeU5vcm1hbGl6ZWQsIGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leHBvcnRPdXRwdXRzKGFsbCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZXhwb3J0X291dHB1dHModGhpcy5jcHBBZGRyZXNzLCBhbGwsIChvdXRwdXRzSGV4KSA9PiByZXNvbHZlKG91dHB1dHNIZXgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXg6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pbXBvcnRPdXRwdXRzKG91dHB1dHNIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmltcG9ydF9vdXRwdXRzKHRoaXMuY3BwQWRkcmVzcywgb3V0cHV0c0hleCwgKG51bUltcG9ydGVkKSA9PiByZXNvbHZlKG51bUltcG9ydGVkKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leHBvcnRLZXlJbWFnZXMoYWxsKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5leHBvcnRfa2V5X2ltYWdlcyh0aGlzLmNwcEFkZHJlc3MsIGFsbCwgKGtleUltYWdlc1N0cikgPT4ge1xuICAgICAgICAgIGlmIChrZXlJbWFnZXNTdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioa2V5SW1hZ2VzU3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBsZXQga2V5SW1hZ2VzID0gW107XG4gICAgICAgICAgZm9yIChsZXQga2V5SW1hZ2VKc29uIG9mIEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhrZXlJbWFnZXNTdHIpKS5rZXlJbWFnZXMpIGtleUltYWdlcy5wdXNoKG5ldyBNb25lcm9LZXlJbWFnZShrZXlJbWFnZUpzb24pKTtcbiAgICAgICAgICByZXNvbHZlKGtleUltYWdlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydEtleUltYWdlcyhrZXlJbWFnZXM6IE1vbmVyb0tleUltYWdlW10pOiBQcm9taXNlPE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pbXBvcnRfa2V5X2ltYWdlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHtrZXlJbWFnZXM6IGtleUltYWdlcy5tYXAoa2V5SW1hZ2UgPT4ga2V5SW1hZ2UudG9Kc29uKCkpfSksIChrZXlJbWFnZUltcG9ydFJlc3VsdFN0cikgPT4ge1xuICAgICAgICAgIHJlc29sdmUobmV3IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhrZXlJbWFnZUltcG9ydFJlc3VsdFN0cikpKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5mcmVlemVPdXRwdXQoa2V5SW1hZ2UpO1xuICAgIGlmICgha2V5SW1hZ2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3Qgc3BlY2lmeSBrZXkgaW1hZ2UgdG8gZnJlZXplXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmZyZWV6ZV9vdXRwdXQodGhpcy5jcHBBZGRyZXNzLCBrZXlJbWFnZSwgKCkgPT4gcmVzb2x2ZSgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnRoYXdPdXRwdXQoa2V5SW1hZ2UpO1xuICAgIGlmICgha2V5SW1hZ2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3Qgc3BlY2lmeSBrZXkgaW1hZ2UgdG8gdGhhd1wiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS50aGF3X291dHB1dCh0aGlzLmNwcEFkZHJlc3MsIGtleUltYWdlLCAoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzT3V0cHV0RnJvemVuKGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzT3V0cHV0RnJvemVuKGtleUltYWdlKTtcbiAgICBpZiAoIWtleUltYWdlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHNwZWNpZnkga2V5IGltYWdlIHRvIGNoZWNrIGlmIGZyb3plblwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pc19vdXRwdXRfZnJvemVuKHRoaXMuY3BwQWRkcmVzcywga2V5SW1hZ2UsIChyZXN1bHQpID0+IHJlc29sdmUocmVzdWx0KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNyZWF0ZVR4cyhjb25maWcpO1xuICAgIFxuICAgIC8vIHZhbGlkYXRlLCBjb3B5LCBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWdOb3JtYWxpemVkLnNldENhblNwbGl0KHRydWUpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB0eHMgaW4gcXVldWVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHR4cyBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLmNyZWF0ZV90eHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShjb25maWdOb3JtYWxpemVkLnRvSnNvbigpKSwgKHR4U2V0SnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmICh0eFNldEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhTZXRKc29uU3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0eFNldEpzb25TdHIpKSkuZ2V0VHhzKCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcE91dHB1dChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3dlZXBPdXRwdXQoY29uZmlnKTtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBzd2VlcCBvdXRwdXQgaW4gcXVldWVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gc3dlZXAgb3V0cHV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuc3dlZXBfb3V0cHV0KHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoY29uZmlnTm9ybWFsaXplZC50b0pzb24oKSksICh0eFNldEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAodHhTZXRKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4U2V0SnNvblN0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModHhTZXRKc29uU3RyKSkpLmdldFR4cygpWzBdKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHN3ZWVwVW5sb2NrZWQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3dlZXBVbmxvY2tlZChjb25maWcpO1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gc3dlZXAgdW5sb2NrZWQgaW4gcXVldWVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gc3dlZXAgdW5sb2NrZWQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5zd2VlcF91bmxvY2tlZCh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZ05vcm1hbGl6ZWQudG9Kc29uKCkpLCAodHhTZXRzSnNvbikgPT4ge1xuICAgICAgICAgIGlmICh0eFNldHNKc29uLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4U2V0c0pzb24pKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV0IHR4U2V0cyA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgdHhTZXRKc29uIG9mIEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0eFNldHNKc29uKSkudHhTZXRzKSB0eFNldHMucHVzaChuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKSk7XG4gICAgICAgICAgICBsZXQgdHhzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCB0eFNldCBvZiB0eFNldHMpIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB0eHMucHVzaCh0eCk7XG4gICAgICAgICAgICByZXNvbHZlKHR4cyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcER1c3QocmVsYXk/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zd2VlcER1c3QocmVsYXkpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuc3dlZXBfZHVzdCh0aGlzLmNwcEFkZHJlc3MsIHJlbGF5LCAodHhTZXRKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHR4U2V0SnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eFNldEpzb25TdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV0IHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0eFNldEpzb25TdHIpKSk7XG4gICAgICAgICAgICBpZiAodHhTZXQuZ2V0VHhzKCkgPT09IHVuZGVmaW5lZCkgdHhTZXQuc2V0VHhzKFtdKTtcbiAgICAgICAgICAgIHJlc29sdmUodHhTZXQuZ2V0VHhzKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHModHhzT3JNZXRhZGF0YXM6IChNb25lcm9UeFdhbGxldCB8IHN0cmluZylbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnJlbGF5VHhzKHR4c09yTWV0YWRhdGFzKTtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eHNPck1ldGFkYXRhcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBvciB0aGVpciBtZXRhZGF0YSB0byByZWxheVwiKTtcbiAgICBsZXQgdHhNZXRhZGF0YXMgPSBbXTtcbiAgICBmb3IgKGxldCB0eE9yTWV0YWRhdGEgb2YgdHhzT3JNZXRhZGF0YXMpIHR4TWV0YWRhdGFzLnB1c2godHhPck1ldGFkYXRhIGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQgPyB0eE9yTWV0YWRhdGEuZ2V0TWV0YWRhdGEoKSA6IHR4T3JNZXRhZGF0YSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUucmVsYXlfdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3R4TWV0YWRhdGFzOiB0eE1ldGFkYXRhc30pLCAodHhIYXNoZXNKc29uKSA9PiB7XG4gICAgICAgICAgaWYgKHR4SGFzaGVzSnNvbi5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4SGFzaGVzSnNvbikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShKU09OLnBhcnNlKHR4SGFzaGVzSnNvbikudHhIYXNoZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmRlc2NyaWJlVHhTZXQodHhTZXQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KHt1bnNpZ25lZFR4SGV4OiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCksIHNpZ25lZFR4SGV4OiB0eFNldC5nZXRTaWduZWRUeEhleCgpLCBtdWx0aXNpZ1R4SGV4OiB0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KCl9KTtcbiAgICAgIHRyeSB7IHJldHVybiBuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHRoaXMubW9kdWxlLmRlc2NyaWJlX3R4X3NldCh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHR4U2V0LnRvSnNvbigpKSkpKSk7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHRoaXMubW9kdWxlLmdldF9leGNlcHRpb25fbWVzc2FnZShlcnIpKTsgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNpZ25UeHModW5zaWduZWRUeEhleCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgcmV0dXJuIG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModGhpcy5tb2R1bGUuc2lnbl90eHModGhpcy5jcHBBZGRyZXNzLCB1bnNpZ25lZFR4SGV4KSkpKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4cyhzaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3VibWl0VHhzKHNpZ25lZFR4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zdWJtaXRfdHhzKHRoaXMuY3BwQWRkcmVzcywgc2lnbmVkVHhIZXgsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSBcIntcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKEpTT04ucGFyc2UocmVzcCkudHhIYXNoZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIHNpZ25hdHVyZVR5cGUgPSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCBhY2NvdW50SWR4ID0gMCwgc3ViYWRkcmVzc0lkeCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2lnbk1lc3NhZ2UobWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgXG4gICAgLy8gYXNzaWduIGRlZmF1bHRzXG4gICAgc2lnbmF0dXJlVHlwZSA9IHNpZ25hdHVyZVR5cGUgfHwgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWTtcbiAgICBhY2NvdW50SWR4ID0gYWNjb3VudElkeCB8fCAwO1xuICAgIHN1YmFkZHJlc3NJZHggPSBzdWJhZGRyZXNzSWR4IHx8IDA7XG4gICAgXG4gICAgLy8gcXVldWUgdGFzayB0byBzaWduIG1lc3NhZ2VcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gdGhpcy5tb2R1bGUuc2lnbl9tZXNzYWdlKHRoaXMuY3BwQWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlVHlwZSA9PT0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA/IDAgOiAxLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS52ZXJpZnlNZXNzYWdlKG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHJlc3VsdDtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UodGhpcy5tb2R1bGUudmVyaWZ5X21lc3NhZ2UodGhpcy5jcHBBZGRyZXNzLCBtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXN1bHQgPSB7aXNHb29kOiBmYWxzZX07XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQocmVzdWx0LmlzR29vZCA/XG4gICAgICAgIHtpc0dvb2Q6IHJlc3VsdC5pc0dvb2QsIGlzT2xkOiByZXN1bHQuaXNPbGQsIHNpZ25hdHVyZVR5cGU6IHJlc3VsdC5zaWduYXR1cmVUeXBlID09PSBcInNwZW5kXCIgPyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZIDogTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1ZJRVdfS0VZLCB2ZXJzaW9uOiByZXN1bHQudmVyc2lvbn0gOlxuICAgICAgICB7aXNHb29kOiBmYWxzZX1cbiAgICAgICk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4S2V5KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFR4S2V5KHR4SGFzaCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgcmV0dXJuIHRoaXMubW9kdWxlLmdldF90eF9rZXkodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2gpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2g6IHN0cmluZywgdHhLZXk6IHN0cmluZywgYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1R4S2V5KHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja190eF9rZXkodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2gsIHR4S2V5LCBhZGRyZXNzLCAocmVzcEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAocmVzcEpzb25TdHIuY2hhckF0KDApICE9PSBcIntcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwSnNvblN0cikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvQ2hlY2tUeChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMocmVzcEpzb25TdHIpKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF90eF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBhZGRyZXNzIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgKHNpZ25hdHVyZSkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChzaWduYXR1cmUuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioc2lnbmF0dXJlLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1R4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja190eF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBhZGRyZXNzIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgc2lnbmF0dXJlIHx8IFwiXCIsIChyZXNwSnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmIChyZXNwSnNvblN0ci5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3BKc29uU3RyKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9DaGVja1R4KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhyZXNwSnNvblN0cikpKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0U3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9zcGVuZF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBtZXNzYWdlIHx8IFwiXCIsIChzaWduYXR1cmUpID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAoc2lnbmF0dXJlLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHNpZ25hdHVyZS5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShzaWduYXR1cmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoZWNrU3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpOyBcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoZWNrX3NwZW5kX3Byb29mKHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgc2lnbmF0dXJlIHx8IFwiXCIsIChyZXNwKSA9PiB7XG4gICAgICAgICAgdHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIgPyByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKSA6IHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfcmVzZXJ2ZV9wcm9vZl93YWxsZXQodGhpcy5jcHBBZGRyZXNzLCBtZXNzYWdlLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCksIC0xKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBhbW91bnQ6IGJpZ2ludCwgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHgsIGFtb3VudCwgbWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3Jlc2VydmVfcHJvb2ZfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIGFtb3VudC50b1N0cmluZygpLCBtZXNzYWdlLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCksIC0xKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7IFxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hlY2tfcmVzZXJ2ZV9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSwgKHJlc3BKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3BKc29uU3RyLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcEpzb25TdHIsIC0xKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9DaGVja1Jlc2VydmUoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHJlc3BKc29uU3RyKSkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeE5vdGVzKHR4SGFzaGVzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfdHhfbm90ZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dHhIYXNoZXM6IHR4SGFzaGVzfSkpKS50eE5vdGVzOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10sIG5vdGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0VHhOb3Rlcyh0eEhhc2hlcywgbm90ZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7IHRoaXMubW9kdWxlLnNldF90eF9ub3Rlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eEhhc2hlczogdHhIYXNoZXMsIHR4Tm90ZXM6IG5vdGVzfSkpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9BZGRyZXNzQm9va0VudHJ5W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXMpO1xuICAgIGlmICghZW50cnlJbmRpY2VzKSBlbnRyeUluZGljZXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgICAgZm9yIChsZXQgZW50cnlKc29uIG9mIEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X2FkZHJlc3NfYm9va19lbnRyaWVzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe2VudHJ5SW5kaWNlczogZW50cnlJbmRpY2VzfSkpKS5lbnRyaWVzKSB7XG4gICAgICAgIGVudHJpZXMucHVzaChuZXcgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUpzb24pKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbnRyaWVzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3M6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzLCBkZXNjcmlwdGlvbik7XG4gICAgaWYgKCFhZGRyZXNzKSBhZGRyZXNzID0gXCJcIjtcbiAgICBpZiAoIWRlc2NyaXB0aW9uKSBkZXNjcmlwdGlvbiA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmFkZF9hZGRyZXNzX2Jvb2tfZW50cnkodGhpcy5jcHBBZGRyZXNzLCBhZGRyZXNzLCBkZXNjcmlwdGlvbik7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4OiBudW1iZXIsIHNldEFkZHJlc3M6IGJvb2xlYW4sIGFkZHJlc3M6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2V0RGVzY3JpcHRpb246IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pO1xuICAgIGlmICghc2V0QWRkcmVzcykgc2V0QWRkcmVzcyA9IGZhbHNlO1xuICAgIGlmICghYWRkcmVzcykgYWRkcmVzcyA9IFwiXCI7XG4gICAgaWYgKCFzZXREZXNjcmlwdGlvbikgc2V0RGVzY3JpcHRpb24gPSBmYWxzZTtcbiAgICBpZiAoIWRlc2NyaXB0aW9uKSBkZXNjcmlwdGlvbiA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuZWRpdF9hZGRyZXNzX2Jvb2tfZW50cnkodGhpcy5jcHBBZGRyZXNzLCBpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5kZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5kZWxldGVfYWRkcmVzc19ib29rX2VudHJ5KHRoaXMuY3BwQWRkcmVzcywgZW50cnlJZHgpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyB0YWdBY2NvdW50cyh0YWc6IHN0cmluZywgYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS50YWdBY2NvdW50cyh0YWcsIGFjY291bnRJbmRpY2VzKTtcbiAgICBpZiAoIXRhZykgdGFnID0gXCJcIjtcbiAgICBpZiAoIWFjY291bnRJbmRpY2VzKSBhY2NvdW50SW5kaWNlcyA9IFtdO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnRhZ19hY2NvdW50cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0YWc6IHRhZywgYWNjb3VudEluZGljZXM6IGFjY291bnRJbmRpY2VzfSkpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXMpO1xuICAgIGlmICghYWNjb3VudEluZGljZXMpIGFjY291bnRJbmRpY2VzID0gW107XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUudGFnX2FjY291bnRzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe2FjY291bnRJbmRpY2VzOiBhY2NvdW50SW5kaWNlc30pKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFjY291bnRUYWdzKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRUYWdzID0gW107XG4gICAgICBmb3IgKGxldCBhY2NvdW50VGFnSnNvbiBvZiBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9hY2NvdW50X3RhZ3ModGhpcy5jcHBBZGRyZXNzKSkuYWNjb3VudFRhZ3MpIGFjY291bnRUYWdzLnB1c2gobmV3IE1vbmVyb0FjY291bnRUYWcoYWNjb3VudFRhZ0pzb24pKTtcbiAgICAgIHJldHVybiBhY2NvdW50VGFncztcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0QWNjb3VudFRhZ0xhYmVsKHRhZywgbGFiZWwpO1xuICAgIGlmICghdGFnKSB0YWcgPSBcIlwiO1xuICAgIGlmICghbGFiZWwpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfYWNjb3VudF90YWdfbGFiZWwodGhpcy5jcHBBZGRyZXNzLCB0YWcsIGxhYmVsKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWc6IE1vbmVyb1R4Q29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFBheW1lbnRVcmkoY29uZmlnKTtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmdldF9wYXltZW50X3VyaSh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSkpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBtYWtlIFVSSSBmcm9tIHN1cHBsaWVkIHBhcmFtZXRlcnNcIik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmk6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhDb25maWc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnBhcnNlUGF5bWVudFVyaSh1cmkpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBuZXcgTW9uZXJvVHhDb25maWcoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHRoaXMubW9kdWxlLnBhcnNlX3BheW1lbnRfdXJpKHRoaXMuY3BwQWRkcmVzcywgdXJpKSkpKTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBdHRyaWJ1dGUoa2V5KTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGFzc2VydCh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiLCBcIkF0dHJpYnV0ZSBrZXkgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgdmFsdWUgPSB0aGlzLm1vZHVsZS5nZXRfYXR0cmlidXRlKHRoaXMuY3BwQWRkcmVzcywga2V5KTtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gXCJcIiA/IG51bGwgOiB2YWx1ZTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0QXR0cmlidXRlKGtleTogc3RyaW5nLCB2YWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0QXR0cmlidXRlKGtleSwgdmFsKTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGFzc2VydCh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiLCBcIkF0dHJpYnV0ZSBrZXkgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICBhc3NlcnQodHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIiwgXCJBdHRyaWJ1dGUgdmFsdWUgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfYXR0cmlidXRlKHRoaXMuY3BwQWRkcmVzcywga2V5LCB2YWwpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzOiBudW1iZXIsIGJhY2tncm91bmRNaW5pbmc/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RhcnRNaW5pbmcobnVtVGhyZWFkcywgYmFja2dyb3VuZE1pbmluZywgaWdub3JlQmF0dGVyeSk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBsZXQgZGFlbW9uID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhhd2FpdCB0aGlzLmdldERhZW1vbkNvbm5lY3Rpb24oKSk7XG4gICAgYXdhaXQgZGFlbW9uLnN0YXJ0TWluaW5nKGF3YWl0IHRoaXMuZ2V0UHJpbWFyeUFkZHJlc3MoKSwgbnVtVGhyZWFkcywgYmFja2dyb3VuZE1pbmluZywgaWdub3JlQmF0dGVyeSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdG9wTWluaW5nKCk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBsZXQgZGFlbW9uID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhhd2FpdCB0aGlzLmdldERhZW1vbkNvbm5lY3Rpb24oKSk7XG4gICAgYXdhaXQgZGFlbW9uLnN0b3BNaW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuaXNfbXVsdGlzaWdfaW1wb3J0X25lZWRlZCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNNdWx0aXNpZygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5pc19tdWx0aXNpZyh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luZm8+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE11bHRpc2lnSW5mbygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdJbmZvKEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X211bHRpc2lnX2luZm8odGhpcy5jcHBBZGRyZXNzKSkpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnByZXBhcmVNdWx0aXNpZygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5wcmVwYXJlX211bHRpc2lnKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgdGhyZXNob2xkOiBudW1iZXIsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkubWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLm1ha2VfbXVsdGlzaWcodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7bXVsdGlzaWdIZXhlczogbXVsdGlzaWdIZXhlcywgdGhyZXNob2xkOiB0aHJlc2hvbGQsIHBhc3N3b3JkOiBwYXNzd29yZH0pLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5leGNoYW5nZV9tdWx0aXNpZ19rZXlzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe211bHRpc2lnSGV4ZXM6IG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkOiBwYXNzd29yZH0pLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdChKU09OLnBhcnNlKHJlc3ApKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leHBvcnRNdWx0aXNpZ0hleCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5leHBvcnRfbXVsdGlzaWdfaGV4KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXMpO1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShtdWx0aXNpZ0hleGVzKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN0cmluZ1tdIHRvIGltcG9ydE11bHRpc2lnSGV4KClcIilcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pbXBvcnRfbXVsdGlzaWdfaGV4KHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe211bHRpc2lnSGV4ZXM6IG11bHRpc2lnSGV4ZXN9KSwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNpZ25fbXVsdGlzaWdfdHhfaGV4KHRoaXMuY3BwQWRkcmVzcywgbXVsdGlzaWdUeEhleCwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdChKU09OLnBhcnNlKHJlc3ApKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zdWJtaXRfbXVsdGlzaWdfdHhfaGV4KHRoaXMuY3BwQWRkcmVzcywgc2lnbmVkTXVsdGlzaWdUeEhleCwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoSlNPTi5wYXJzZShyZXNwKS50eEhhc2hlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIGtleXMgYW5kIGNhY2hlIGRhdGEuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPERhdGFWaWV3W10+fSBpcyB0aGUga2V5cyBhbmQgY2FjaGUgZGF0YSwgcmVzcGVjdGl2ZWx5XG4gICAqL1xuICBhc3luYyBnZXREYXRhKCk6IFByb21pc2U8RGF0YVZpZXdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGF0YSgpO1xuICAgIFxuICAgIC8vIHF1ZXVlIGNhbGwgdG8gd2FzbSBtb2R1bGVcbiAgICBsZXQgdmlld09ubHkgPSBhd2FpdCB0aGlzLmlzVmlld09ubHkoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBcbiAgICAgIC8vIHN0b3JlIHZpZXdzIGluIGFycmF5XG4gICAgICBsZXQgdmlld3MgPSBbXTtcbiAgICAgIFxuICAgICAgLy8gbWFsbG9jIGNhY2hlIGJ1ZmZlciBhbmQgZ2V0IGJ1ZmZlciBsb2NhdGlvbiBpbiBjKysgaGVhcFxuICAgICAgbGV0IGNhY2hlQnVmZmVyTG9jID0gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfY2FjaGVfZmlsZV9idWZmZXIodGhpcy5jcHBBZGRyZXNzKSk7XG4gICAgICBcbiAgICAgIC8vIHJlYWQgYmluYXJ5IGRhdGEgZnJvbSBoZWFwIHRvIERhdGFWaWV3XG4gICAgICBsZXQgdmlldyA9IG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoY2FjaGVCdWZmZXJMb2MubGVuZ3RoKSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNhY2hlQnVmZmVyTG9jLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZpZXcuc2V0SW50OChpLCB0aGlzLm1vZHVsZS5IRUFQVThbY2FjaGVCdWZmZXJMb2MucG9pbnRlciAvIFVpbnQ4QXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKyBpXSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGZyZWUgYmluYXJ5IG9uIGhlYXBcbiAgICAgIHRoaXMubW9kdWxlLl9mcmVlKGNhY2hlQnVmZmVyTG9jLnBvaW50ZXIpO1xuICAgICAgXG4gICAgICAvLyB3cml0ZSBjYWNoZSBmaWxlXG4gICAgICB2aWV3cy5wdXNoKEJ1ZmZlci5mcm9tKHZpZXcuYnVmZmVyKSk7XG4gICAgICBcbiAgICAgIC8vIG1hbGxvYyBrZXlzIGJ1ZmZlciBhbmQgZ2V0IGJ1ZmZlciBsb2NhdGlvbiBpbiBjKysgaGVhcFxuICAgICAgbGV0IGtleXNCdWZmZXJMb2MgPSBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9rZXlzX2ZpbGVfYnVmZmVyKHRoaXMuY3BwQWRkcmVzcywgdGhpcy5wYXNzd29yZCwgdmlld09ubHkpKTtcbiAgICAgIFxuICAgICAgLy8gcmVhZCBiaW5hcnkgZGF0YSBmcm9tIGhlYXAgdG8gRGF0YVZpZXdcbiAgICAgIHZpZXcgPSBuZXcgRGF0YVZpZXcobmV3IEFycmF5QnVmZmVyKGtleXNCdWZmZXJMb2MubGVuZ3RoKSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXNCdWZmZXJMb2MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmlldy5zZXRJbnQ4KGksIHRoaXMubW9kdWxlLkhFQVBVOFtrZXlzQnVmZmVyTG9jLnBvaW50ZXIgLyBVaW50OEFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICsgaV0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBmcmVlIGJpbmFyeSBvbiBoZWFwXG4gICAgICB0aGlzLm1vZHVsZS5fZnJlZShrZXlzQnVmZmVyTG9jLnBvaW50ZXIpO1xuICAgICAgXG4gICAgICAvLyBwcmVwZW5kIGtleXMgZmlsZVxuICAgICAgdmlld3MudW5zaGlmdChCdWZmZXIuZnJvbSh2aWV3LmJ1ZmZlcikpO1xuICAgICAgcmV0dXJuIHZpZXdzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZDogc3RyaW5nLCBuZXdQYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpO1xuICAgIGlmIChvbGRQYXNzd29yZCAhPT0gdGhpcy5wYXNzd29yZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBvcmlnaW5hbCBwYXNzd29yZC5cIik7IC8vIHdhbGxldDIgdmVyaWZ5X3Bhc3N3b3JkIGxvYWRzIGZyb20gZGlzayBzbyB2ZXJpZnkgcGFzc3dvcmQgaGVyZVxuICAgIGlmIChuZXdQYXNzd29yZCA9PT0gdW5kZWZpbmVkKSBuZXdQYXNzd29yZCA9IFwiXCI7XG4gICAgYXdhaXQgdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkKHRoaXMuY3BwQWRkcmVzcywgb2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkLCAoZXJyTXNnKSA9PiB7XG4gICAgICAgICAgaWYgKGVyck1zZykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihlcnJNc2cpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICB0aGlzLnBhc3N3b3JkID0gbmV3UGFzc3dvcmQ7XG4gICAgaWYgKHRoaXMucGF0aCkgYXdhaXQgdGhpcy5zYXZlKCk7IC8vIGF1dG8gc2F2ZVxuICB9XG4gIFxuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNhdmUoKTtcbiAgICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhdmUodGhpcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNsb3NlKHNhdmUgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLl9pc0Nsb3NlZCkgcmV0dXJuOyAvLyBubyBlZmZlY3QgaWYgY2xvc2VkXG4gICAgaWYgKHNhdmUpIGF3YWl0IHRoaXMuc2F2ZSgpO1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jbG9zZShmYWxzZSk7XG4gICAgICBhd2FpdCBzdXBlci5jbG9zZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgICBhd2FpdCB0aGlzLnN0b3BTeW5jaW5nKCk7XG4gICAgYXdhaXQgc3VwZXIuY2xvc2UoKTtcbiAgICBkZWxldGUgdGhpcy5wYXRoO1xuICAgIGRlbGV0ZSB0aGlzLnBhc3N3b3JkO1xuICAgIGRlbGV0ZSB0aGlzLndhc21MaXN0ZW5lcjtcbiAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4odGhpcy5yZWplY3RVbmF1dGhvcml6ZWRDb25maWdJZCwgdW5kZWZpbmVkKTsgLy8gdW5yZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tIEFERCBKU0RPQyBGT1IgU1VQUE9SVEVEIERFRkFVTFQgSU1QTEVNRU5UQVRJT05TIC0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBnZXROdW1CbG9ja3NUb1VubG9jaygpOiBQcm9taXNlPG51bWJlcltdPiB7IHJldHVybiBzdXBlci5nZXROdW1CbG9ja3NUb1VubG9jaygpOyB9XG4gIGFzeW5jIGdldFR4KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4geyByZXR1cm4gc3VwZXIuZ2V0VHgodHhIYXNoKTsgfVxuICBhc3luYyBnZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdPiB7IHJldHVybiBzdXBlci5nZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeSk7IH1cbiAgYXN5bmMgZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pIHsgcmV0dXJuIHN1cGVyLmdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBjcmVhdGVUeChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4geyByZXR1cm4gc3VwZXIuY3JlYXRlVHgoY29uZmlnKTsgfVxuICBhc3luYyByZWxheVR4KHR4T3JNZXRhZGF0YTogTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIucmVsYXlUeCh0eE9yTWV0YWRhdGEpOyB9XG4gIGFzeW5jIGdldFR4Tm90ZSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5nZXRUeE5vdGUodHhIYXNoKTsgfVxuICBhc3luYyBzZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcsIG5vdGU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4geyByZXR1cm4gc3VwZXIuc2V0VHhOb3RlKHR4SGFzaCwgbm90ZSk7IH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBIRUxQRVJTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIG9wZW5XYWxsZXREYXRhKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG4gICAgaWYgKGNvbmZpZy5wcm94eVRvV29ya2VyKSB7XG4gICAgICBsZXQgd2FsbGV0UHJveHkgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsUHJveHkub3BlbldhbGxldERhdGEoY29uZmlnKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvV2FsbGV0RnVsbCh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB3YWxsZXRQcm94eSk7XG4gICAgfVxuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgcGFyYW1ldGVyc1xuICAgIGlmIChjb25maWcubmV0d29ya1R5cGUgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHRoZSB3YWxsZXQncyBuZXR3b3JrIHR5cGVcIik7XG4gICAgY29uZmlnLm5ldHdvcmtUeXBlID0gTW9uZXJvTmV0d29ya1R5cGUuZnJvbShjb25maWcubmV0d29ya1R5cGUpO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCBkYWVtb25VcmkgPSBkYWVtb25Db25uZWN0aW9uICYmIGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXJpKCkgPyBkYWVtb25Db25uZWN0aW9uLmdldFVyaSgpIDogXCJcIjtcbiAgICBsZXQgZGFlbW9uVXNlcm5hbWUgPSBkYWVtb25Db25uZWN0aW9uICYmIGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA6IFwiXCI7XG4gICAgbGV0IGRhZW1vblBhc3N3b3JkID0gZGFlbW9uQ29ubmVjdGlvbiAmJiBkYWVtb25Db25uZWN0aW9uLmdldFBhc3N3b3JkKCkgPyBkYWVtb25Db25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgXG4gICAgLy8gbG9hZCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEZ1bGxNb2R1bGUoKTtcbiAgICBcbiAgICAvLyBvcGVuIHdhbGxldCBpbiBxdWV1ZVxuICAgIHJldHVybiBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyByZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gICAgICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWRGbklkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4ocmVqZWN0VW5hdXRob3JpemVkRm5JZCwgKCkgPT4gcmVqZWN0VW5hdXRob3JpemVkKTtcbiAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLm9wZW5fd2FsbGV0X2Z1bGwoY29uZmlnLnBhc3N3b3JkLCBjb25maWcubmV0d29ya1R5cGUsIGNvbmZpZy5rZXlzRGF0YSA/PyBcIlwiLCBjb25maWcuY2FjaGVEYXRhID8/IFwiXCIsIGRhZW1vblVyaSwgZGFlbW9uVXNlcm5hbWUsIGRhZW1vblBhc3N3b3JkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRGdWxsKGNwcEFkZHJlc3MsIGNvbmZpZy5wYXRoLCBjb25maWcucGFzc3dvcmQsIGZzLCByZWplY3RVbmF1dGhvcml6ZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXRXYWxsZXRQcm94eSgpOiBNb25lcm9XYWxsZXRGdWxsUHJveHkge1xuICAgIHJldHVybiBzdXBlci5nZXRXYWxsZXRQcm94eSgpIGFzIE1vbmVyb1dhbGxldEZ1bGxQcm94eTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGJhY2tncm91bmRTeW5jKCkge1xuICAgIGxldCBsYWJlbCA9IHRoaXMucGF0aCA/IHRoaXMucGF0aCA6ICh0aGlzLmJyb3dzZXJNYWluUGF0aCA/IHRoaXMuYnJvd3Nlck1haW5QYXRoIDogXCJpbi1tZW1vcnkgd2FsbGV0XCIpOyAvLyBsYWJlbCBmb3IgbG9nXG4gICAgTGlicmFyeVV0aWxzLmxvZygxLCBcIkJhY2tncm91bmQgc3luY2hyb25pemluZyBcIiArIGxhYmVsKTtcbiAgICB0cnkgeyBhd2FpdCB0aGlzLnN5bmMoKTsgfVxuICAgIGNhdGNoIChlcnI6IGFueSkgeyBpZiAoIXRoaXMuX2lzQ2xvc2VkKSBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGJhY2tncm91bmQgc3luY2hyb25pemUgXCIgKyBsYWJlbCArIFwiOiBcIiArIGVyci5tZXNzYWdlKTsgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBsZXQgaXNFbmFibGVkID0gdGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMDtcbiAgICBpZiAodGhpcy53YXNtTGlzdGVuZXJIYW5kbGUgPT09IDAgJiYgIWlzRW5hYmxlZCB8fCB0aGlzLndhc21MaXN0ZW5lckhhbmRsZSA+IDAgJiYgaXNFbmFibGVkKSByZXR1cm47IC8vIG5vIGRpZmZlcmVuY2VcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNldF9saXN0ZW5lcihcbiAgICAgICAgICB0aGlzLmNwcEFkZHJlc3MsXG4gICAgICAgICAgdGhpcy53YXNtTGlzdGVuZXJIYW5kbGUsXG4gICAgICAgICAgICBuZXdMaXN0ZW5lckhhbmRsZSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgbmV3TGlzdGVuZXJIYW5kbGUgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IobmV3TGlzdGVuZXJIYW5kbGUpKTtcbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy53YXNtTGlzdGVuZXJIYW5kbGUgPSBuZXdMaXN0ZW5lckhhbmRsZTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkgPT4gYXdhaXQgdGhpcy53YXNtTGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0KSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vbk5ld0Jsb2NrKGhlaWdodCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAobmV3QmFsYW5jZVN0ciwgbmV3VW5sb2NrZWRCYWxhbmNlU3RyKSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaXNFbmFibGVkID8gYXN5bmMgKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4U3RyLCBzdWJhZGRyZXNzSWR4U3RyLCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgPT4gYXdhaXQgdGhpcy53YXNtTGlzdGVuZXIub25PdXRwdXRTcGVudChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4U3RyLCBzdWJhZGRyZXNzSWR4U3RyLCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgOiB1bmRlZmluZWQsXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgc3RhdGljIHNhbml0aXplQmxvY2soYmxvY2spIHtcbiAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkgTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZVR4V2FsbGV0KHR4KTtcbiAgICByZXR1cm4gYmxvY2s7XG4gIH1cbiAgXG4gIHN0YXRpYyBzYW5pdGl6ZVR4V2FsbGV0KHR4KSB7XG4gICAgYXNzZXJ0KHR4IGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQpO1xuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgc3RhdGljIHNhbml0aXplQWNjb3VudChhY2NvdW50KSB7XG4gICAgaWYgKGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkgTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3Moc3ViYWRkcmVzcyk7XG4gICAgfVxuICAgIHJldHVybiBhY2NvdW50O1xuICB9XG4gIFxuICBzdGF0aWMgZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cikge1xuICAgIGxldCBibG9ja3NKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGJsb2Nrc0pzb25TdHIpKTtcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzOiBhbnkgPSB7fTtcbiAgICBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzID0gW107XG4gICAgaWYgKGJsb2Nrc0pzb24uYmxvY2tzKSBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbi5ibG9ja3MpIGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3MucHVzaChNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQmxvY2sobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9XQUxMRVQpKSk7XG4gICAgcmV0dXJuIGRlc2VyaWFsaXplZEJsb2NrcztcbiAgfVxuICBcbiAgc3RhdGljIGRlc2VyaWFsaXplVHhzKHF1ZXJ5LCBibG9ja3NKc29uU3RyKSB7XG4gICAgXG4gICAgLy8gZGVzZXJpYWxpemUgYmxvY2tzXG4gICAgbGV0IGRlc2VyaWFsaXplZEJsb2NrcyA9IE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cik7XG4gICAgbGV0IGJsb2NrcyA9IGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3M7XG4gICAgXG4gICAgLy8gY29sbGVjdCB0eHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQmxvY2soYmxvY2spO1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgaWYgKGJsb2NrLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7IC8vIGRlcmVmZXJlbmNlIHBsYWNlaG9sZGVyIGJsb2NrIGZvciB1bmNvbmZpcm1lZCB0eHNcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyByZS1zb3J0IHR4cyB3aGljaCBpcyBsb3N0IG92ZXIgd2FzbSBzZXJpYWxpemF0aW9uICAvLyBUT0RPOiBjb25maXJtIHRoYXQgb3JkZXIgaXMgbG9zdFxuICAgIGlmIChxdWVyeS5nZXRIYXNoZXMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgdHhNYXAgPSBuZXcgTWFwKCk7XG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4TWFwW3R4LmdldEhhc2goKV0gPSB0eDtcbiAgICAgIGxldCB0eHNTb3J0ZWQgPSBbXTtcbiAgICAgIGZvciAobGV0IHR4SGFzaCBvZiBxdWVyeS5nZXRIYXNoZXMoKSkgaWYgKHR4TWFwW3R4SGFzaF0gIT09IHVuZGVmaW5lZCkgdHhzU29ydGVkLnB1c2godHhNYXBbdHhIYXNoXSk7XG4gICAgICB0eHMgPSB0eHNTb3J0ZWQ7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZVRyYW5zZmVycyhxdWVyeSwgYmxvY2tzSnNvblN0cikge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIGJsb2Nrc1xuICAgIGxldCBkZXNlcmlhbGl6ZWRCbG9ja3MgPSBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplQmxvY2tzKGJsb2Nrc0pzb25TdHIpO1xuICAgIGxldCBibG9ja3MgPSBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdHJhbnNmZXJzXG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgaWYgKGJsb2NrLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7IC8vIGRlcmVmZXJlbmNlIHBsYWNlaG9sZGVyIGJsb2NrIGZvciB1bmNvbmZpcm1lZCB0eHNcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkKSB0cmFuc2ZlcnMucHVzaCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpO1xuICAgICAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZU91dHB1dHMocXVlcnksIGJsb2Nrc0pzb25TdHIpIHtcbiAgICBcbiAgICAvLyBkZXNlcmlhbGl6ZSBibG9ja3NcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzID0gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZUJsb2NrcyhibG9ja3NKc29uU3RyKTtcbiAgICBsZXQgYmxvY2tzID0gZGVzZXJpYWxpemVkQmxvY2tzLmJsb2NrcztcbiAgICBcbiAgICAvLyBjb2xsZWN0IG91dHB1dHNcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmdldE91dHB1dHMoKSkgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSBwYXRoIG9mIHRoZSB3YWxsZXQgb24gdGhlIGJyb3dzZXIgbWFpbiB0aHJlYWQgaWYgcnVuIGFzIGEgd29ya2VyLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGJyb3dzZXJNYWluUGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCBvbiB0aGUgYnJvd3NlciBtYWluIHRocmVhZFxuICAgKi9cbiAgcHJvdGVjdGVkIHNldEJyb3dzZXJNYWluUGF0aChicm93c2VyTWFpblBhdGgpIHtcbiAgICB0aGlzLmJyb3dzZXJNYWluUGF0aCA9IGJyb3dzZXJNYWluUGF0aDtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIG1vdmVUbyhwYXRoLCB3YWxsZXQpIHtcbiAgICBpZiAoYXdhaXQgd2FsbGV0LmlzQ2xvc2VkKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBjbG9zZWRcIik7XG4gICAgaWYgKCFwYXRoKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgcGF0aCBvZiBkZXN0aW5hdGlvbiB3YWxsZXRcIik7XG4gICAgXG4gICAgLy8gc2F2ZSBhbmQgcmV0dXJuIGlmIHNhbWUgcGF0aFxuICAgIGlmIChQYXRoLm5vcm1hbGl6ZSh3YWxsZXQucGF0aCkgPT09IFBhdGgubm9ybWFsaXplKHBhdGgpKSB7XG4gICAgICBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICAvLyBjcmVhdGUgZGVzdGluYXRpb24gZGlyZWN0b3J5IGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICBsZXQgd2FsbGV0RGlyID0gUGF0aC5kaXJuYW1lKHBhdGgpO1xuICAgIGlmICghYXdhaXQgd2FsbGV0LmZzLmV4aXN0cyh3YWxsZXREaXIpKSB7XG4gICAgICB0cnkgeyBhd2FpdCB3YWxsZXQuZnMubWtkaXIod2FsbGV0RGlyKTsgfVxuICAgICAgY2F0Y2ggKGVycjogYW55KSB7IHRocm93IG5ldyBNb25lcm9FcnJvcihcIkRlc3RpbmF0aW9uIHBhdGggXCIgKyBwYXRoICsgXCIgZG9lcyBub3QgZXhpc3QgYW5kIGNhbm5vdCBiZSBjcmVhdGVkOiBcIiArIGVyci5tZXNzYWdlKTsgfVxuICAgIH1cbiAgICBcbiAgICAvLyB3cml0ZSB3YWxsZXQgZmlsZXNcbiAgICBsZXQgZGF0YSA9IGF3YWl0IHdhbGxldC5nZXREYXRhKCk7XG4gICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoICsgXCIua2V5c1wiLCBkYXRhWzBdLCBcImJpbmFyeVwiKTtcbiAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGgsIGRhdGFbMV0sIFwiYmluYXJ5XCIpO1xuICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aCArIFwiLmFkZHJlc3MudHh0XCIsIGF3YWl0IHdhbGxldC5nZXRQcmltYXJ5QWRkcmVzcygpKTtcbiAgICBsZXQgb2xkUGF0aCA9IHdhbGxldC5wYXRoO1xuICAgIHdhbGxldC5wYXRoID0gcGF0aDtcbiAgICBcbiAgICAvLyBkZWxldGUgb2xkIHdhbGxldCBmaWxlc1xuICAgIGlmIChvbGRQYXRoKSB7XG4gICAgICBhd2FpdCB3YWxsZXQuZnMudW5saW5rKG9sZFBhdGggKyBcIi5hZGRyZXNzLnR4dFwiKTtcbiAgICAgIGF3YWl0IHdhbGxldC5mcy51bmxpbmsob2xkUGF0aCArIFwiLmtleXNcIik7XG4gICAgICBhd2FpdCB3YWxsZXQuZnMudW5saW5rKG9sZFBhdGgpO1xuICAgIH1cbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIHNhdmUod2FsbGV0OiBhbnkpIHtcbiAgICBpZiAoYXdhaXQgd2FsbGV0LmlzQ2xvc2VkKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBjbG9zZWRcIik7XG4gICAgICAgIFxuICAgIC8vIHBhdGggbXVzdCBiZSBzZXRcbiAgICBsZXQgcGF0aCA9IGF3YWl0IHdhbGxldC5nZXRQYXRoKCk7XG4gICAgaWYgKCFwYXRoKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSB3YWxsZXQgYmVjYXVzZSBwYXRoIGlzIG5vdCBzZXRcIik7XG4gICAgXG4gICAgLy8gd3JpdGUgd2FsbGV0IGZpbGVzIHRvICoubmV3XG4gICAgbGV0IHBhdGhOZXcgPSBwYXRoICsgXCIubmV3XCI7XG4gICAgbGV0IGRhdGEgPSBhd2FpdCB3YWxsZXQuZ2V0RGF0YSgpO1xuICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aE5ldyArIFwiLmtleXNcIiwgZGF0YVswXSwgXCJiaW5hcnlcIik7XG4gICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoTmV3LCBkYXRhWzFdLCBcImJpbmFyeVwiKTtcbiAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGhOZXcgKyBcIi5hZGRyZXNzLnR4dFwiLCBhd2FpdCB3YWxsZXQuZ2V0UHJpbWFyeUFkZHJlc3MoKSk7XG4gICAgXG4gICAgLy8gcmVtb3ZlIG9sZCB3YWxsZXQgZmlsZXNcbiAgICBhd2FpdCB3YWxsZXQuZnMudW5saW5rKHBhdGggKyBcIi5rZXlzXCIpO1xuICAgIGF3YWl0IHdhbGxldC5mcy51bmxpbmsocGF0aCk7XG4gICAgYXdhaXQgd2FsbGV0LmZzLnVubGluayhwYXRoICsgXCIuYWRkcmVzcy50eHRcIik7XG5cbiAgICAvLyByZXBsYWNlIG9sZCB3YWxsZXQgZmlsZXMgd2l0aCBuZXdcbiAgICBhd2FpdCB3YWxsZXQuZnMucmVuYW1lKHBhdGhOZXcgKyBcIi5rZXlzXCIsIHBhdGggKyBcIi5rZXlzXCIpO1xuICAgIGF3YWl0IHdhbGxldC5mcy5yZW5hbWUocGF0aE5ldywgcGF0aCk7XG4gICAgYXdhaXQgd2FsbGV0LmZzLnJlbmFtZShwYXRoTmV3ICsgXCIuYWRkcmVzcy50eHRcIiwgcGF0aCArIFwiLmFkZHJlc3MudHh0XCIpO1xuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb1dhbGxldCBieSBwcm94eWluZyByZXF1ZXN0cyB0byBhIHdvcmtlciB3aGljaCBydW5zIGEgZnVsbCB3YWxsZXQuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIE1vbmVyb1dhbGxldEZ1bGxQcm94eSBleHRlbmRzIE1vbmVyb1dhbGxldEtleXNQcm94eSB7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBwYXRoOiBhbnk7XG4gIHByb3RlY3RlZCBmczogYW55O1xuICBwcm90ZWN0ZWQgd3JhcHBlZExpc3RlbmVyczogYW55O1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFdBTExFVCBTVEFUSUMgVVRJTFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBzdGF0aWMgYXN5bmMgb3BlbldhbGxldERhdGEoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcbiAgICBsZXQgd2FsbGV0SWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgaWYgKGNvbmZpZy5wYXNzd29yZCA9PT0gdW5kZWZpbmVkKSBjb25maWcucGFzc3dvcmQgPSBcIlwiO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIod2FsbGV0SWQsIFwib3BlbldhbGxldERhdGFcIiwgW2NvbmZpZy5wYXRoLCBjb25maWcucGFzc3dvcmQsIGNvbmZpZy5uZXR3b3JrVHlwZSwgY29uZmlnLmtleXNEYXRhLCBjb25maWcuY2FjaGVEYXRhLCBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi50b0pzb24oKSA6IHVuZGVmaW5lZF0pO1xuICAgIGxldCB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0RnVsbFByb3h5KHdhbGxldElkLCBhd2FpdCBMaWJyYXJ5VXRpbHMuZ2V0V29ya2VyKCksIGNvbmZpZy5wYXRoLCBjb25maWcuZ2V0RnMoKSk7XG4gICAgaWYgKGNvbmZpZy5wYXRoKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgJiYgYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC53YWxsZXRFeGlzdHMoY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldEZzKCkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgYWxyZWFkeSBleGlzdHM6IFwiICsgY29uZmlnLmdldFBhdGgoKSk7XG4gICAgbGV0IHdhbGxldElkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIod2FsbGV0SWQsIFwiY3JlYXRlV2FsbGV0RnVsbFwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgbGV0IHdhbGxldCA9IG5ldyBNb25lcm9XYWxsZXRGdWxsUHJveHkod2FsbGV0SWQsIGF3YWl0IExpYnJhcnlVdGlscy5nZXRXb3JrZXIoKSwgY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldEZzKCkpO1xuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJTlNUQU5DRSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBjb25zdHJ1Y3RvciB3aGljaCBpcyBnaXZlbiBhIHdvcmtlciB0byBjb21tdW5pY2F0ZSB3aXRoIHZpYSBtZXNzYWdlcy5cbiAgICogXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBub3QgYmUgY2FsbGVkIGV4dGVybmFsbHkgYnV0IHNob3VsZCBiZSBjYWxsZWQgdGhyb3VnaFxuICAgKiBzdGF0aWMgd2FsbGV0IGNyZWF0aW9uIHV0aWxpdGllcyBpbiB0aGlzIGNsYXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHdhbGxldElkIC0gaWRlbnRpZmllcyB0aGUgd2FsbGV0IHdpdGggdGhlIHdvcmtlclxuICAgKiBAcGFyYW0ge1dvcmtlcn0gd29ya2VyIC0gd29ya2VyIHRvIGNvbW11bmljYXRlIHdpdGggdmlhIG1lc3NhZ2VzXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih3YWxsZXRJZCwgd29ya2VyLCBwYXRoLCBmcykge1xuICAgIHN1cGVyKHdhbGxldElkLCB3b3JrZXIpO1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5mcyA9IGZzID8gZnMgOiAocGF0aCA/IE1vbmVyb1dhbGxldEZ1bGwuZ2V0RnMoKSA6IHVuZGVmaW5lZCk7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzID0gW107XG4gIH1cblxuICBnZXRQYXRoKCkge1xuICAgIHJldHVybiB0aGlzLnBhdGg7XG4gIH1cblxuICBhc3luYyBnZXROZXR3b3JrVHlwZSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXROZXR3b3JrVHlwZVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0U3ViYWRkcmVzc0xhYmVsXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgUHJvbWlzZTx2b2lkPjtcbiAgfVxuICBcbiAgYXN5bmMgc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPclJwY0Nvbm5lY3Rpb24pIHtcbiAgICBpZiAoIXVyaU9yUnBjQ29ubmVjdGlvbikgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzZXREYWVtb25Db25uZWN0aW9uXCIpO1xuICAgIGVsc2Uge1xuICAgICAgbGV0IGNvbm5lY3Rpb24gPSAhdXJpT3JScGNDb25uZWN0aW9uID8gdW5kZWZpbmVkIDogdXJpT3JScGNDb25uZWN0aW9uIGluc3RhbmNlb2YgTW9uZXJvUnBjQ29ubmVjdGlvbiA/IHVyaU9yUnBjQ29ubmVjdGlvbiA6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yUnBjQ29ubmVjdGlvbik7XG4gICAgICBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInNldERhZW1vbkNvbm5lY3Rpb25cIiwgY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0Q29uZmlnKCkgOiB1bmRlZmluZWQpO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uQ29ubmVjdGlvbigpIHtcbiAgICBsZXQgcnBjQ29uZmlnID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYWVtb25Db25uZWN0aW9uXCIpO1xuICAgIHJldHVybiBycGNDb25maWcgPyBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbihycGNDb25maWcpIDogdW5kZWZpbmVkO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZFRvRGFlbW9uKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzQ29ubmVjdGVkVG9EYWVtb25cIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc3RvcmVIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UmVzdG9yZUhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0UmVzdG9yZUhlaWdodFwiLCBbcmVzdG9yZUhlaWdodF0pO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGFlbW9uSGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25NYXhQZWVySGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldERhZW1vbk1heFBlZXJIZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodEJ5RGF0ZSh5ZWFyLCBtb250aCwgZGF5KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0SGVpZ2h0QnlEYXRlXCIsIFt5ZWFyLCBtb250aCwgZGF5XSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzRGFlbW9uU3luY2VkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzRGFlbW9uU3luY2VkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0SGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGxldCB3cmFwcGVkTGlzdGVuZXIgPSBuZXcgV2FsbGV0V29ya2VyTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGxldCBsaXN0ZW5lcklkID0gd3JhcHBlZExpc3RlbmVyLmdldElkKCk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25TeW5jUHJvZ3Jlc3NfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uU3luY1Byb2dyZXNzLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk5ld0Jsb2NrX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbk5ld0Jsb2NrLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbkJhbGFuY2VzQ2hhbmdlZF9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25CYWxhbmNlc0NoYW5nZWQsIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0UmVjZWl2ZWRfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uT3V0cHV0UmVjZWl2ZWQsIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0U3BlbnRfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uT3V0cHV0U3BlbnQsIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIHRoaXMud3JhcHBlZExpc3RlbmVycy5wdXNoKHdyYXBwZWRMaXN0ZW5lcik7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiYWRkTGlzdGVuZXJcIiwgW2xpc3RlbmVySWRdKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud3JhcHBlZExpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMud3JhcHBlZExpc3RlbmVyc1tpXS5nZXRMaXN0ZW5lcigpID09PSBsaXN0ZW5lcikge1xuICAgICAgICBsZXQgbGlzdGVuZXJJZCA9IHRoaXMud3JhcHBlZExpc3RlbmVyc1tpXS5nZXRJZCgpO1xuICAgICAgICBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInJlbW92ZUxpc3RlbmVyXCIsIFtsaXN0ZW5lcklkXSk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uU3luY1Byb2dyZXNzX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uTmV3QmxvY2tfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25CYWxhbmNlc0NoYW5nZWRfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRSZWNlaXZlZF9cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFNwZW50X1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIHRoaXMud3JhcHBlZExpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB3YWxsZXRcIik7XG4gIH1cbiAgXG4gIGdldExpc3RlbmVycygpIHtcbiAgICBsZXQgbGlzdGVuZXJzID0gW107XG4gICAgZm9yIChsZXQgd3JhcHBlZExpc3RlbmVyIG9mIHRoaXMud3JhcHBlZExpc3RlbmVycykgbGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyLmdldExpc3RlbmVyKCkpO1xuICAgIHJldHVybiBsaXN0ZW5lcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGlzU3luY2VkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzU3luY2VkXCIpO1xuICB9XG4gIFxuICBhc3luYyBzeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodD86IE1vbmVyb1dhbGxldExpc3RlbmVyIHwgbnVtYmVyLCBzdGFydEhlaWdodD86IG51bWJlciwgYWxsb3dDb25jdXJyZW50Q2FsbHMgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvU3luY1Jlc3VsdD4ge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBwYXJhbXNcbiAgICBzdGFydEhlaWdodCA9IGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyID8gc3RhcnRIZWlnaHQgOiBsaXN0ZW5lck9yU3RhcnRIZWlnaHQ7XG4gICAgbGV0IGxpc3RlbmVyID0gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIgPyBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gTWF0aC5tYXgoYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSwgYXdhaXQgdGhpcy5nZXRSZXN0b3JlSGVpZ2h0KCkpO1xuICAgIFxuICAgIC8vIHJlZ2lzdGVyIGxpc3RlbmVyIGlmIGdpdmVuXG4gICAgaWYgKGxpc3RlbmVyKSBhd2FpdCB0aGlzLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBcbiAgICAvLyBzeW5jIHdhbGxldCBpbiB3b3JrZXIgXG4gICAgbGV0IGVycjtcbiAgICBsZXQgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzdWx0SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic3luY1wiLCBbc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzXSk7XG4gICAgICByZXN1bHQgPSBuZXcgTW9uZXJvU3luY1Jlc3VsdChyZXN1bHRKc29uLm51bUJsb2Nrc0ZldGNoZWQsIHJlc3VsdEpzb24ucmVjZWl2ZWRNb25leSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyID0gZTtcbiAgICB9XG4gICAgXG4gICAgLy8gdW5yZWdpc3RlciBsaXN0ZW5lclxuICAgIGlmIChsaXN0ZW5lcikgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gdGhyb3cgZXJyb3Igb3IgcmV0dXJuXG4gICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN0YXJ0U3luY2luZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gICAgXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN0b3BTeW5jaW5nXCIpO1xuICB9XG4gIFxuICBhc3luYyBzY2FuVHhzKHR4SGFzaGVzKSB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhIYXNoZXMpLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0eHMgaGFzaGVzIHRvIHNjYW5cIik7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2NhblR4c1wiLCBbdHhIYXNoZXNdKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuU3BlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwicmVzY2FuU3BlbnRcIik7XG4gIH1cbiAgICBcbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJyZXNjYW5CbG9ja2NoYWluXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgICByZXR1cm4gQmlnSW50KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QmFsYW5jZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgICBsZXQgdW5sb2NrZWRCYWxhbmNlU3RyID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRVbmxvY2tlZEJhbGFuY2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gQmlnSW50KHVubG9ja2VkQmFsYW5jZVN0cik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXMsIHRhZykge1xuICAgIGxldCBhY2NvdW50cyA9IFtdO1xuICAgIGZvciAobGV0IGFjY291bnRKc29uIG9mIChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEFjY291bnRzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpKSB7XG4gICAgICBhY2NvdW50cy5wdXNoKE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSkpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjb3VudHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnQoYWNjb3VudElkeCwgaW5jbHVkZVN1YmFkZHJlc3Nlcykge1xuICAgIGxldCBhY2NvdW50SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWNjb3VudFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVBY2NvdW50KGxhYmVsKSB7XG4gICAgbGV0IGFjY291bnRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjcmVhdGVBY2NvdW50XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlcykge1xuICAgIGxldCBzdWJhZGRyZXNzZXMgPSBbXTtcbiAgICBmb3IgKGxldCBzdWJhZGRyZXNzSnNvbiBvZiAoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRTdWJhZGRyZXNzZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSkpIHtcbiAgICAgIHN1YmFkZHJlc3Nlcy5wdXNoKE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSkpO1xuICAgIH1cbiAgICByZXR1cm4gc3ViYWRkcmVzc2VzO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHgsIGxhYmVsKSB7XG4gICAgbGV0IHN1YmFkZHJlc3NKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjcmVhdGVTdWJhZGRyZXNzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyhxdWVyeSkge1xuICAgIHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpO1xuICAgIGxldCByZXNwSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHhzXCIsIFtxdWVyeS5nZXRCbG9jaygpLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVUeHMocXVlcnksIEpTT04uc3RyaW5naWZ5KHtibG9ja3M6IHJlc3BKc29uLmJsb2Nrc30pKTsgLy8gaW5pdGlhbGl6ZSB0eHMgZnJvbSBibG9ja3MganNvbiBzdHJpbmcgVE9ETzogdGhpcyBzdHJpbmdpZmllcyB0aGVuIHV0aWxpdHkgcGFyc2VzLCBhdm9pZFxuICB9XG4gIFxuICBhc3luYyBnZXRUcmFuc2ZlcnMocXVlcnkpIHtcbiAgICBxdWVyeSA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBsZXQgYmxvY2tKc29ucyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHJhbnNmZXJzXCIsIFtxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKS50b0pzb24oKV0pO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplVHJhbnNmZXJzKHF1ZXJ5LCBKU09OLnN0cmluZ2lmeSh7YmxvY2tzOiBibG9ja0pzb25zfSkpOyAvLyBpbml0aWFsaXplIHRyYW5zZmVycyBmcm9tIGJsb2NrcyBqc29uIHN0cmluZyBUT0RPOiB0aGlzIHN0cmluZ2lmaWVzIHRoZW4gdXRpbGl0eSBwYXJzZXMsIGF2b2lkXG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMocXVlcnkpIHtcbiAgICBxdWVyeSA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgbGV0IGJsb2NrSnNvbnMgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldE91dHB1dHNcIiwgW3F1ZXJ5LmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVPdXRwdXRzKHF1ZXJ5LCBKU09OLnN0cmluZ2lmeSh7YmxvY2tzOiBibG9ja0pzb25zfSkpOyAvLyBpbml0aWFsaXplIHRyYW5zZmVycyBmcm9tIGJsb2NrcyBqc29uIHN0cmluZyBUT0RPOiB0aGlzIHN0cmluZ2lmaWVzIHRoZW4gdXRpbGl0eSBwYXJzZXMsIGF2b2lkXG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE91dHB1dHMoYWxsKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZXhwb3J0T3V0cHV0c1wiLCBbYWxsXSk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE91dHB1dHMob3V0cHV0c0hleCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImltcG9ydE91dHB1dHNcIiwgW291dHB1dHNIZXhdKTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCkge1xuICAgIGxldCBrZXlJbWFnZXMgPSBbXTtcbiAgICBmb3IgKGxldCBrZXlJbWFnZUpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRLZXlJbWFnZXNcIiwgW2FsbF0pKSBrZXlJbWFnZXMucHVzaChuZXcgTW9uZXJvS2V5SW1hZ2Uoa2V5SW1hZ2VKc29uKSk7XG4gICAgcmV0dXJuIGtleUltYWdlcztcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlcykge1xuICAgIGxldCBrZXlJbWFnZXNKc29uID0gW107XG4gICAgZm9yIChsZXQga2V5SW1hZ2Ugb2Yga2V5SW1hZ2VzKSBrZXlJbWFnZXNKc29uLnB1c2goa2V5SW1hZ2UudG9Kc29uKCkpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJpbXBvcnRLZXlJbWFnZXNcIiwgW2tleUltYWdlc0pzb25dKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb1dhbGxldEZ1bGwuZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKSBub3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImZyZWV6ZU91dHB1dFwiLCBba2V5SW1hZ2VdKTtcbiAgfVxuICBcbiAgYXN5bmMgdGhhd091dHB1dChrZXlJbWFnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInRoYXdPdXRwdXRcIiwgW2tleUltYWdlXSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzT3V0cHV0RnJvemVuKGtleUltYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNPdXRwdXRGcm96ZW5cIiwgW2tleUltYWdlXSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVR4cyhjb25maWcpIHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgbGV0IHR4U2V0SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY3JlYXRlVHhzXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZykge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyhjb25maWcpO1xuICAgIGxldCB0eFNldEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInN3ZWVwT3V0cHV0XCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikuZ2V0VHhzKClbMF07XG4gIH1cblxuICBhc3luYyBzd2VlcFVubG9ja2VkKGNvbmZpZykge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZyk7XG4gICAgbGV0IHR4U2V0c0pzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInN3ZWVwVW5sb2NrZWRcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBmb3IgKGxldCB0eFNldEpzb24gb2YgdHhTZXRzSnNvbikgZm9yIChsZXQgdHggb2YgbmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikuZ2V0VHhzKCkpIHR4cy5wdXNoKHR4KTtcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcER1c3QocmVsYXkpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic3dlZXBEdXN0XCIsIFtyZWxheV0pKS5nZXRUeHMoKSB8fCBbXTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHModHhzT3JNZXRhZGF0YXMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eHNPck1ldGFkYXRhcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBvciB0aGVpciBtZXRhZGF0YSB0byByZWxheVwiKTtcbiAgICBsZXQgdHhNZXRhZGF0YXMgPSBbXTtcbiAgICBmb3IgKGxldCB0eE9yTWV0YWRhdGEgb2YgdHhzT3JNZXRhZGF0YXMpIHR4TWV0YWRhdGFzLnB1c2godHhPck1ldGFkYXRhIGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQgPyB0eE9yTWV0YWRhdGEuZ2V0TWV0YWRhdGEoKSA6IHR4T3JNZXRhZGF0YSk7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwicmVsYXlUeHNcIiwgW3R4TWV0YWRhdGFzXSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlc2NyaWJlVHhTZXQodHhTZXQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGVzY3JpYmVUeFNldFwiLCBbdHhTZXQudG9Kc29uKCldKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzaWduVHhzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeHMoc2lnbmVkVHhIZXgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdWJtaXRUeHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNpZ25NZXNzYWdlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZSwgYWRkcmVzcywgc2lnbmF0dXJlKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwidmVyaWZ5TWVzc2FnZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHhLZXlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2gsIHR4S2V5LCBhZGRyZXNzKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9DaGVja1R4KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2hlY2tUeEtleVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeFByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQ2hlY2tUeChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNoZWNrVHhQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRTcGVuZFByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrU3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImNoZWNrU3BlbmRQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFJlc2VydmVQcm9vZldhbGxldFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHgsIGFtb3VudCwgbWVzc2FnZSkge1xuICAgIHRyeSB7IHJldHVybiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFJlc2VydmVQcm9vZkFjY291bnRcIiwgW2FjY291bnRJZHgsIGFtb3VudC50b1N0cmluZygpLCBtZXNzYWdlXSk7IH1cbiAgICBjYXRjaCAoZTogYW55KSB7IHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UsIC0xKTsgfVxuICB9XG5cbiAgYXN5bmMgY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gICAgdHJ5IHsgcmV0dXJuIG5ldyBNb25lcm9DaGVja1Jlc2VydmUoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGVja1Jlc2VydmVQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTsgfVxuICAgIGNhdGNoIChlOiBhbnkpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGUubWVzc2FnZSwgLTEpOyB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeE5vdGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFR4Tm90ZXModHhIYXNoZXMsIG5vdGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0VHhOb3Rlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzKSB7XG4gICAgaWYgKCFlbnRyeUluZGljZXMpIGVudHJ5SW5kaWNlcyA9IFtdO1xuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgZm9yIChsZXQgZW50cnlKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpIHtcbiAgICAgIGVudHJpZXMucHVzaChuZXcgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUpzb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzcywgZGVzY3JpcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJhZGRBZGRyZXNzQm9va0VudHJ5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJlZGl0QWRkcmVzc0Jvb2tFbnRyeVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBkZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyB0YWdBY2NvdW50cyh0YWcsIGFjY291bnRJbmRpY2VzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwidGFnQWNjb3VudHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJ1bnRhZ0FjY291bnRzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRUYWdzKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldEFjY291bnRUYWdzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cblxuICBhc3luYyBzZXRBY2NvdW50VGFnTGFiZWwodGFnLCBsYWJlbCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldEFjY291bnRUYWdMYWJlbFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXltZW50VXJpKGNvbmZpZykge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRQYXltZW50VXJpXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgfVxuICBcbiAgYXN5bmMgcGFyc2VQYXltZW50VXJpKHVyaSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhDb25maWcoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJwYXJzZVBheW1lbnRVcmlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBdHRyaWJ1dGVcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0QXR0cmlidXRlKGtleSwgdmFsKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0QXR0cmlidXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdGFydE1pbmluZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN0b3BNaW5pbmdcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc011bHRpc2lnSW1wb3J0TmVlZGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzTXVsdGlzaWdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE11bHRpc2lnSW5mbygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb011bHRpc2lnSW5mbyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldE11bHRpc2lnSW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJwcmVwYXJlTXVsdGlzaWdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzLCB0aHJlc2hvbGQsIHBhc3N3b3JkKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwibWFrZU11bHRpc2lnXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJleGNoYW5nZU11bHRpc2lnS2V5c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0TXVsdGlzaWdIZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZXhwb3J0TXVsdGlzaWdIZXhcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpbXBvcnRNdWx0aXNpZ0hleFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzaWduTXVsdGlzaWdUeEhleFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3VibWl0TXVsdGlzaWdUeEhleFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXREYXRhKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldERhdGFcIik7XG4gIH1cbiAgXG4gIGFzeW5jIG1vdmVUbyhwYXRoKSB7XG4gICAgYXdhaXQgTGlicmFyeVV0aWxzLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5tb3ZlVG8ocGF0aCwgdGhpcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCkge1xuICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2hhbmdlUGFzc3dvcmRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICBpZiAodGhpcy5wYXRoKSBhd2FpdCB0aGlzLnNhdmUoKTsgLy8gYXV0byBzYXZlXG4gIH1cbiAgXG4gIGFzeW5jIHNhdmUoKSB7XG4gICAgYXdhaXQgTGlicmFyeVV0aWxzLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYXZlKHRoaXMpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgY2xvc2Uoc2F2ZSkge1xuICAgIGlmIChhd2FpdCB0aGlzLmlzQ2xvc2VkKCkpIHJldHVybjtcbiAgICBpZiAoc2F2ZSkgYXdhaXQgdGhpcy5zYXZlKCk7XG4gICAgd2hpbGUgKHRoaXMud3JhcHBlZExpc3RlbmVycy5sZW5ndGgpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIodGhpcy53cmFwcGVkTGlzdGVuZXJzWzBdLmdldExpc3RlbmVyKCkpO1xuICAgIGF3YWl0IHN1cGVyLmNsb3NlKGZhbHNlKTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBMSVNURU5JTkcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8qKlxuICogUmVjZWl2ZXMgbm90aWZpY2F0aW9ucyBkaXJlY3RseSBmcm9tIHdhc20gYysrLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRXYXNtTGlzdGVuZXIge1xuXG4gIHByb3RlY3RlZCB3YWxsZXQ6IE1vbmVyb1dhbGxldDtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIHRoaXMud2FsbGV0ID0gd2FsbGV0O1xuICB9XG4gIFxuICBhc3luYyBvblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VTeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VOZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIHtcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFJlY2VpdmVkKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgcmVjZWl2ZWQgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKTtcbiAgICBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludChhbW91bnRTdHIpKTtcbiAgICBvdXRwdXQuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgoc3ViYWRkcmVzc0lkeCk7XG4gICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgdHguc2V0SGFzaCh0eEhhc2gpO1xuICAgIHR4LnNldFZlcnNpb24odmVyc2lvbik7XG4gICAgdHguc2V0VW5sb2NrVGltZSh1bmxvY2tUaW1lKTtcbiAgICBvdXRwdXQuc2V0VHgodHgpO1xuICAgIHR4LnNldE91dHB1dHMoW291dHB1dF0pO1xuICAgIHR4LnNldElzSW5jb21pbmcodHJ1ZSk7XG4gICAgdHguc2V0SXNMb2NrZWQoaXNMb2NrZWQpO1xuICAgIGlmIChoZWlnaHQgPiAwKSB7XG4gICAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRIZWlnaHQoaGVpZ2h0KTtcbiAgICAgIGJsb2NrLnNldFR4cyhbdHggYXMgTW9uZXJvVHhdKTtcbiAgICAgIHR4LnNldEJsb2NrKGJsb2NrKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gYW5ub3VuY2Ugb3V0cHV0XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFNwZW50KGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHhTdHIsIHN1YmFkZHJlc3NJZHhTdHIsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgc3BlbnQgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKTtcbiAgICBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludChhbW91bnRTdHIpKTtcbiAgICBpZiAoYWNjb3VudElkeFN0cikgb3V0cHV0LnNldEFjY291bnRJbmRleChwYXJzZUludChhY2NvdW50SWR4U3RyKSk7XG4gICAgaWYgKHN1YmFkZHJlc3NJZHhTdHIpIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgocGFyc2VJbnQoc3ViYWRkcmVzc0lkeFN0cikpO1xuICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIHR4LnNldEhhc2godHhIYXNoKTtcbiAgICB0eC5zZXRWZXJzaW9uKHZlcnNpb24pO1xuICAgIHR4LnNldFVubG9ja1RpbWUodW5sb2NrVGltZSk7XG4gICAgdHguc2V0SXNMb2NrZWQoaXNMb2NrZWQpO1xuICAgIG91dHB1dC5zZXRUeCh0eCk7XG4gICAgdHguc2V0SW5wdXRzKFtvdXRwdXRdKTtcbiAgICBpZiAoaGVpZ2h0ID4gMCkge1xuICAgICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KGhlaWdodCk7XG4gICAgICBibG9jay5zZXRUeHMoW3R4XSk7XG4gICAgICB0eC5zZXRCbG9jayhibG9jayk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIGFubm91bmNlIG91dHB1dFxuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlT3V0cHV0U3BlbnQob3V0cHV0KTtcbiAgfVxufVxuXG4vKipcbiAqIEludGVybmFsIGxpc3RlbmVyIHRvIGJyaWRnZSBub3RpZmljYXRpb25zIHRvIGV4dGVybmFsIGxpc3RlbmVycy5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgV2FsbGV0V29ya2VyTGlzdGVuZXIge1xuXG4gIHByb3RlY3RlZCBpZDogYW55O1xuICBwcm90ZWN0ZWQgbGlzdGVuZXI6IGFueTtcbiAgXG4gIGNvbnN0cnVjdG9yKGxpc3RlbmVyKSB7XG4gICAgdGhpcy5pZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIH1cbiAgXG4gIGdldElkKCkge1xuICAgIHJldHVybiB0aGlzLmlkO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcjtcbiAgfVxuICBcbiAgb25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkge1xuICAgIHRoaXMubGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSk7XG4gIH1cblxuICBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkge1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25OZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIHtcbiAgICBhd2FpdCB0aGlzLmxpc3RlbmVyLm9uQmFsYW5jZXNDaGFuZ2VkKEJpZ0ludChuZXdCYWxhbmNlU3RyKSwgQmlnSW50KG5ld1VubG9ja2VkQmFsYW5jZVN0cikpO1xuICB9XG5cbiAgYXN5bmMgb25PdXRwdXRSZWNlaXZlZChibG9ja0pzb24pIHtcbiAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1dBTExFVCk7XG4gICAgYXdhaXQgdGhpcy5saXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKGJsb2NrLmdldFR4cygpWzBdLmdldE91dHB1dHMoKVswXSk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uT3V0cHV0U3BlbnQoYmxvY2tKc29uKSB7XG4gICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9XQUxMRVQpO1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25PdXRwdXRTcGVudChibG9jay5nZXRUeHMoKVswXS5nZXRJbnB1dHMoKVswXSk7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLEtBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFNBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLGFBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLFdBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLGNBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLGlCQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyx1QkFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsWUFBQSxHQUFBVCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVMsY0FBQSxHQUFBVixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVUsbUJBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFXLGdCQUFBLEdBQUFaLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBWSxZQUFBLEdBQUFiLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQWEsd0JBQUEsR0FBQWQs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