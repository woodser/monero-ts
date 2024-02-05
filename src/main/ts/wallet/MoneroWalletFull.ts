import assert from "assert";
import Path from "path";
import GenUtils from "../common/GenUtils";
import LibraryUtils from "../common/LibraryUtils";
import TaskLooper from "../common/TaskLooper";
import MoneroAccount from "./model/MoneroAccount";
import MoneroAccountTag from "./model/MoneroAccountTag";
import MoneroAddressBookEntry from "./model/MoneroAddressBookEntry";
import MoneroBlock from "../daemon/model/MoneroBlock";
import MoneroCheckTx from "./model/MoneroCheckTx";
import MoneroCheckReserve from "./model/MoneroCheckReserve";
import MoneroDaemonRpc from "../daemon/MoneroDaemonRpc";
import MoneroError from "../common/MoneroError";
import MoneroIncomingTransfer from "./model/MoneroIncomingTransfer";
import MoneroIntegratedAddress from "./model/MoneroIntegratedAddress";
import MoneroKeyImage from "../daemon/model/MoneroKeyImage";
import MoneroKeyImageImportResult from "./model/MoneroKeyImageImportResult";
import MoneroMultisigInfo from "./model/MoneroMultisigInfo";
import MoneroMultisigInitResult from "./model/MoneroMultisigInitResult";
import MoneroMultisigSignResult from "./model/MoneroMultisigSignResult";
import MoneroNetworkType from "../daemon/model/MoneroNetworkType";
import MoneroOutputQuery from "./model/MoneroOutputQuery";
import MoneroOutputWallet from "./model/MoneroOutputWallet";
import MoneroRpcConnection from "../common/MoneroRpcConnection";
import MoneroSubaddress from "./model/MoneroSubaddress";
import MoneroSyncResult from "./model/MoneroSyncResult";
import MoneroTransfer from "./model/MoneroTransfer";
import MoneroTransferQuery from "./model/MoneroTransferQuery";
import MoneroTxConfig from "./model/MoneroTxConfig";
import MoneroTxQuery from "./model/MoneroTxQuery";
import MoneroTxSet from "./model/MoneroTxSet";
import MoneroTx from "../daemon/model/MoneroTx";
import MoneroTxWallet from "./model/MoneroTxWallet";
import MoneroWallet from "./MoneroWallet";
import MoneroWalletConfig from "./model/MoneroWalletConfig";
import { MoneroWalletKeys, MoneroWalletKeysProxy } from "./MoneroWalletKeys";
import MoneroWalletListener from "./model/MoneroWalletListener";
import MoneroMessageSignatureType from "./model/MoneroMessageSignatureType";
import MoneroMessageSignatureResult from "./model/MoneroMessageSignatureResult";
import MoneroVersion from "../daemon/model/MoneroVersion";
import fs from "fs";

/**
 * Implements a Monero wallet using client-side WebAssembly bindings to monero-project's wallet2 in C++.
 */
export default class MoneroWalletFull extends MoneroWalletKeys {

  // static variables
  protected static readonly DEFAULT_SYNC_PERIOD_IN_MS = 20000;
  protected static FS;

  // instance variables
  protected path: string;
  protected password: string;
  protected listeners: MoneroWalletListener[];
  protected fs: any;
  protected wasmListener: WalletWasmListener;
  protected wasmListenerHandle: number;
  protected rejectUnauthorized: boolean;
  protected rejectUnauthorizedConfigId: string;
  protected syncPeriodInMs: number;
  protected syncLooper: TaskLooper;
  protected browserMainPath: string;

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
  constructor(cppAddress, path, password, fs, rejectUnauthorized, rejectUnauthorizedFnId, walletProxy?: MoneroWalletFullProxy) {
    super(cppAddress, walletProxy);
    if (walletProxy) return;
    this.path = path;
    this.password = password;
    this.listeners = [];
    this.fs = fs ? fs : (path ? MoneroWalletFull.getFs() : undefined);
    this._isClosed = false;
    this.wasmListener = new WalletWasmListener(this); // receives notifications from wasm c++
    this.wasmListenerHandle = 0;                      // memory address of the wallet listener in c++
    this.rejectUnauthorized = rejectUnauthorized;
    this.rejectUnauthorizedConfigId = rejectUnauthorizedFnId;
    this.syncPeriodInMs = MoneroWalletFull.DEFAULT_SYNC_PERIOD_IN_MS;
    LibraryUtils.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => this.rejectUnauthorized); // register fn informing if unauthorized reqs should be rejected
  }

  // --------------------------- STATIC UTILITIES -----------------------------
  
  /**
   * Check if a wallet exists at a given path.
   * 
   * @param {string} path - path of the wallet on the file system
   * @param {fs} - Node.js compatible file system to use (optional, defaults to disk if nodejs)
   * @return {boolean} true if a wallet exists at the given path, false otherwise
   */
  static walletExists(path, fs) {
    assert(path, "Must provide a path to look for a wallet");
    if (!fs) fs = MoneroWalletFull.getFs();
    if (!fs) throw new MoneroError("Must provide file system to check if wallet exists");
    let exists = fs.existsSync(path + ".keys");
    LibraryUtils.log(1, "Wallet exists at " + path + ": " + exists);
    return exists;
  }
  
  static async openWallet(config: Partial<MoneroWalletConfig>) {

    // validate config
    config = new MoneroWalletConfig(config);
    if (config.getProxyToWorker() === undefined) config.setProxyToWorker(true);
    if (config.getSeed() !== undefined) throw new MoneroError("Cannot specify seed when opening wallet");
    if (config.getSeedOffset() !== undefined) throw new MoneroError("Cannot specify seed offset when opening wallet");
    if (config.getPrimaryAddress() !== undefined) throw new MoneroError("Cannot specify primary address when opening wallet");
    if (config.getPrivateViewKey() !== undefined) throw new MoneroError("Cannot specify private view key when opening wallet");
    if (config.getPrivateSpendKey() !== undefined) throw new MoneroError("Cannot specify private spend key when opening wallet");
    if (config.getRestoreHeight() !== undefined) throw new MoneroError("Cannot specify restore height when opening wallet");
    if (config.getLanguage() !== undefined) throw new MoneroError("Cannot specify language when opening wallet");
    if (config.getSaveCurrent() === true) throw new MoneroError("Cannot save current wallet when opening full wallet");

    // set server from connection manager if provided
    if (config.getConnectionManager()) {
      if (config.getServer()) throw new MoneroError("Wallet can be opened with a server or connection manager but not both");
      config.setServer(config.getConnectionManager().getConnection());
    }

    // read wallet data from disk unless provided
    if (!config.getKeysData()) {
      let fs = config.getFs() ? config.getFs() : MoneroWalletFull.getFs();
      if (!fs) throw new MoneroError("Must provide file system to read wallet data from");
      if (!this.walletExists(config.getPath(), fs)) throw new MoneroError("Wallet does not exist at path: " + config.getPath());
      config.setKeysData(fs.readFileSync(config.getPath() + ".keys"));
      config.setCacheData(fs.existsSync(config.getPath()) ? fs.readFileSync(config.getPath()) : "");
    }

    // open wallet from data
    const wallet = await MoneroWalletFull.openWalletData(config);

    // set connection manager
    await wallet.setConnectionManager(config.getConnectionManager());
    return wallet;
  }
  
  static async createWallet(config: MoneroWalletConfig): Promise<MoneroWalletFull> {

    // validate config
    if (config === undefined) throw new MoneroError("Must provide config to create wallet");
    if (config.getSeed() !== undefined && (config.getPrimaryAddress() !== undefined || config.getPrivateViewKey() !== undefined || config.getPrivateSpendKey() !== undefined)) throw new MoneroError("Wallet may be initialized with a seed or keys but not both");
    if (config.getNetworkType() === undefined) throw new MoneroError("Must provide a networkType: 'mainnet', 'testnet' or 'stagenet'");
    MoneroNetworkType.validate(config.getNetworkType());
    if (config.getSaveCurrent() === true) throw new MoneroError("Cannot save current wallet when creating full WASM wallet");
    if (config.getPath() === undefined) config.setPath("");
    if (config.getPath() && MoneroWalletFull.walletExists(config.getPath(), config.getFs())) throw new MoneroError("Wallet already exists: " + config.getPath());
    if (config.getPassword() === undefined) config.setPassword("");

    // set server from connection manager if provided
    if (config.getConnectionManager()) {
      if (config.getServer()) throw new MoneroError("Wallet can be created with a server or connection manager but not both");
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
        if (config.getLanguage() !== undefined) throw new MoneroError("Cannot provide language when creating wallet from seed");
        wallet = await MoneroWalletFull.createWalletFromSeed(config);
      } else if (config.getPrivateSpendKey() !== undefined || config.getPrimaryAddress() !== undefined) {
        if (config.getSeedOffset() !== undefined) throw new MoneroError("Cannot provide seedOffset when creating wallet from keys");
        wallet = await MoneroWalletFull.createWalletFromKeys(config);
      } else {
        if (config.getSeedOffset() !== undefined) throw new MoneroError("Cannot provide seedOffset when creating random wallet");
        if (config.getRestoreHeight() !== undefined) throw new MoneroError("Cannot provide restoreHeight when creating random wallet");
        wallet = await MoneroWalletFull.createWalletRandom(config);
      }
    }
    
    // set connection manager
    await wallet.setConnectionManager(config.getConnectionManager());
    return wallet;
  }
  
  protected static async createWalletFromSeed(config: MoneroWalletConfig): Promise<MoneroWalletFull> {

    // validate and normalize params
    let daemonConnection = config.getServer();
    let rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true;
    if (config.getRestoreHeight() === undefined) config.setRestoreHeight(0);
    if (config.getSeedOffset() === undefined) config.setSeedOffset("");
    
    // load full wasm module
    let module = await LibraryUtils.loadFullModule();
    
    // create wallet in queue
    let wallet = await module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // register fn informing if unauthorized reqs should be rejected
        let rejectUnauthorizedFnId = GenUtils.getUUID();
        LibraryUtils.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => rejectUnauthorized);
        
        // create wallet in wasm which invokes callback when done
        module.create_full_wallet(JSON.stringify(config.toJson()), rejectUnauthorizedFnId, async (cppAddress) => {
          if (typeof cppAddress === "string") reject(new MoneroError(cppAddress));
          else resolve(new MoneroWalletFull(cppAddress, config.getPath(), config.getPassword(), config.getFs(), config.getServer() ? config.getServer().getRejectUnauthorized() : undefined, rejectUnauthorizedFnId));
        });
      });
    });
    
    // save wallet
    if (config.getPath()) await wallet.save();
    return wallet;
  }
  
  protected static async createWalletFromKeys(config: MoneroWalletConfig): Promise<MoneroWalletFull> {

    // validate and normalize params
    MoneroNetworkType.validate(config.getNetworkType());
    if (config.getPrimaryAddress() === undefined) config.setPrimaryAddress("");
    if (config.getPrivateViewKey() === undefined) config.setPrivateViewKey("");
    if (config.getPrivateSpendKey() === undefined) config.setPrivateSpendKey("");
    let daemonConnection = config.getServer();
    let rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true;
    if (config.getRestoreHeight() === undefined) config.setRestoreHeight(0);
    if (config.getLanguage() === undefined) config.setLanguage("English");
    
    // load full wasm module
    let module = await LibraryUtils.loadFullModule();
    
    // create wallet in queue
    let wallet = await module.queueTask(async () => {
      return new Promise((resolve, reject) => {
        
        // register fn informing if unauthorized reqs should be rejected
        let rejectUnauthorizedFnId = GenUtils.getUUID();
        LibraryUtils.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => rejectUnauthorized);
        
        // create wallet in wasm which invokes callback when done
        module.create_full_wallet(JSON.stringify(config.toJson()), rejectUnauthorizedFnId, async (cppAddress) => {
          if (typeof cppAddress === "string") reject(new MoneroError(cppAddress));
          else resolve(new MoneroWalletFull(cppAddress, config.getPath(), config.getPassword(), config.getFs(), config.getServer() ? config.getServer().getRejectUnauthorized() : undefined, rejectUnauthorizedFnId));
        });
      });
    });
    
    // save wallet
    if (config.getPath()) await wallet.save();
    return wallet;
  }
  
  protected static async createWalletRandom(config: MoneroWalletConfig): Promise<MoneroWalletFull> {
    
    // validate and normalize params
    if (config.getLanguage() === undefined) config.setLanguage("English");
    let daemonConnection = config.getServer();
    let rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true;
    
    // load wasm module
    let module = await LibraryUtils.loadFullModule();
    
    // create wallet in queue
    let wallet = await module.queueTask(async () => {
      return new Promise((resolve, reject) => {
        
        // register fn informing if unauthorized reqs should be rejected
        let rejectUnauthorizedFnId = GenUtils.getUUID();
        LibraryUtils.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => rejectUnauthorized);
      
        // create wallet in wasm which invokes callback when done
        module.create_full_wallet(JSON.stringify(config.toJson()), rejectUnauthorizedFnId, async (cppAddress) => {
          if (typeof cppAddress === "string") reject(new MoneroError(cppAddress));
          else resolve(new MoneroWalletFull(cppAddress, config.getPath(), config.getPassword(), config.getFs(), config.getServer() ? config.getServer().getRejectUnauthorized() : undefined, rejectUnauthorizedFnId));
        });
      });
    });
    
    // save wallet
    if (config.getPath()) await wallet.save();
    return wallet;
  }
  
  static async getSeedLanguages() {
    let module = await LibraryUtils.loadFullModule();
    return module.queueTask(async () => {
      return JSON.parse(module.get_keys_wallet_seed_languages()).languages;
    });
  }

  static getFs() {
    if (!MoneroWalletFull.FS) MoneroWalletFull.FS = GenUtils.isBrowser() ? undefined : fs;
    return MoneroWalletFull.FS;
  }
  
  // ------------ WALLET METHODS SPECIFIC TO WASM IMPLEMENTATION --------------

  // TODO: move these to MoneroWallet.ts, others can be unsupported
  
  /**
   * Get the maximum height of the peers the wallet's daemon is connected to.
   *
   * @return {Promise<number>} the maximum height of the peers the wallet's daemon is connected to
   */
  async getDaemonMaxPeerHeight(): Promise<number> {
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
  async isDaemonSynced(): Promise<boolean> {
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
  async isSynced(): Promise<boolean> {
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
  async getNetworkType(): Promise<MoneroNetworkType> {
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
  async getRestoreHeight(): Promise<number> {
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
  async setRestoreHeight(restoreHeight: number): Promise<void> {
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
  async moveTo(path: string): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().moveTo(path);
    return MoneroWalletFull.moveTo(path, this);
  }
  
  // -------------------------- COMMON WALLET METHODS -------------------------
  
  async addListener(listener: MoneroWalletListener): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().addListener(listener);
    await super.addListener(listener);
    await this.refreshListening();
  }
  
  async removeListener(listener): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().removeListener(listener);
    await super.removeListener(listener);
    await this.refreshListening();
  }
  
  getListeners(): MoneroWalletListener[] {
    if (this.getWalletProxy()) return this.getWalletProxy().getListeners();
    return super.getListeners();
  }
  
  async setDaemonConnection(uriOrConnection?: MoneroRpcConnection | string): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().setDaemonConnection(uriOrConnection);
    
    // normalize connection
    let connection = !uriOrConnection ? undefined : uriOrConnection instanceof MoneroRpcConnection ? uriOrConnection : new MoneroRpcConnection(uriOrConnection);
    let uri = connection && connection.getUri() ? connection.getUri() : "";
    let username = connection && connection.getUsername() ? connection.getUsername() : "";
    let password = connection && connection.getPassword() ? connection.getPassword() : "";
    let rejectUnauthorized = connection ? connection.getRejectUnauthorized() : undefined;
    this.rejectUnauthorized = rejectUnauthorized;  // persist locally
    
    // set connection in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise<void>((resolve, reject) => {
        this.module.set_daemon_connection(this.cppAddress, uri, username, password, (resp) => {
          resolve();
        });
      });
    });
  }
  
  async getDaemonConnection(): Promise<MoneroRpcConnection> {
    if (this.getWalletProxy()) return this.getWalletProxy().getDaemonConnection();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        let connectionContainerStr = this.module.get_daemon_connection(this.cppAddress);
        if (!connectionContainerStr) resolve(undefined);
        else {
          let jsonConnection = JSON.parse(connectionContainerStr);
          resolve(new MoneroRpcConnection({uri: jsonConnection.uri, username: jsonConnection.username, password: jsonConnection.password, rejectUnauthorized: this.rejectUnauthorized}));
        }
      });
    });
  }
  
  async isConnectedToDaemon(): Promise<boolean> {
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
  
  async getVersion(): Promise<MoneroVersion> {
    if (this.getWalletProxy()) return this.getWalletProxy().getVersion();
    throw new MoneroError("Not implemented");
  }
  
  async getPath(): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().getPath();
    return this.path;
  }
  
  async getIntegratedAddress(standardAddress?: string, paymentId?: string): Promise<MoneroIntegratedAddress> {
    if (this.getWalletProxy()) return this.getWalletProxy().getIntegratedAddress(standardAddress, paymentId);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {
        let result = this.module.get_integrated_address(this.cppAddress, standardAddress ? standardAddress : "", paymentId ? paymentId : "");
        if (result.charAt(0) !== "{") throw new MoneroError(result);
        return new MoneroIntegratedAddress(JSON.parse(result));
      } catch (err: any) {
        if (err.message.includes("Invalid payment ID")) throw new MoneroError("Invalid payment ID: " + paymentId);
        throw new MoneroError(err.message);
      }
    });
  }
  
  async decodeIntegratedAddress(integratedAddress: string): Promise<MoneroIntegratedAddress> {
    if (this.getWalletProxy()) return this.getWalletProxy().decodeIntegratedAddress(integratedAddress);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {
        let result = this.module.decode_integrated_address(this.cppAddress, integratedAddress);
        if (result.charAt(0) !== "{") throw new MoneroError(result);
        return new MoneroIntegratedAddress(JSON.parse(result));
      } catch (err: any) {
        throw new MoneroError(err.message);
      }
    });
  }
  
  async getHeight(): Promise<number> {
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
  
  async getDaemonHeight(): Promise<number> {
    if (this.getWalletProxy()) return this.getWalletProxy().getDaemonHeight();
    if (!(await this.isConnectedToDaemon())) throw new MoneroError("Wallet is not connected to daemon");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_daemon_height(this.cppAddress, (resp) => {
          resolve(resp);
        });
      });
    });
  }
  
  async getHeightByDate(year: number, month: number, day: number): Promise<number> {
    if (this.getWalletProxy()) return this.getWalletProxy().getHeightByDate(year, month, day);
    if (!(await this.isConnectedToDaemon())) throw new MoneroError("Wallet is not connected to daemon");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_height_by_date(this.cppAddress, year, month, day, (resp) => {
          if (typeof resp === "string") reject(new MoneroError(resp));
          else resolve(resp);
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
  async sync(listenerOrStartHeight?: MoneroWalletListener | number, startHeight?: number, allowConcurrentCalls = false): Promise<MoneroSyncResult> {
    if (this.getWalletProxy()) return this.getWalletProxy().sync(listenerOrStartHeight, startHeight, allowConcurrentCalls);
    if (!(await this.isConnectedToDaemon())) throw new MoneroError("Wallet is not connected to daemon");
    
    // normalize params
    startHeight = listenerOrStartHeight === undefined || listenerOrStartHeight instanceof MoneroWalletListener ? startHeight : listenerOrStartHeight;
    let listener = listenerOrStartHeight instanceof MoneroWalletListener ? listenerOrStartHeight : undefined;
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
            if (resp.charAt(0) !== "{") reject(new MoneroError(resp));
            else {
              let respJson = JSON.parse(resp);
              resolve(new MoneroSyncResult(respJson.numBlocksFetched, respJson.receivedMoney));
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
  
  async startSyncing(syncPeriodInMs?: number): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().startSyncing(syncPeriodInMs);
    if (!(await this.isConnectedToDaemon())) throw new MoneroError("Wallet is not connected to daemon");
    this.syncPeriodInMs = syncPeriodInMs === undefined ? MoneroWalletFull.DEFAULT_SYNC_PERIOD_IN_MS : syncPeriodInMs;
    if (!this.syncLooper) this.syncLooper = new TaskLooper(async () => await this.backgroundSync())
    this.syncLooper.start(this.syncPeriodInMs);
  }
    
  async stopSyncing(): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().stopSyncing();
    this.assertNotClosed();
    if (this.syncLooper) this.syncLooper.stop();
    this.module.stop_syncing(this.cppAddress); // task is not queued so wallet stops immediately
  }
  
  async scanTxs(txHashes: string[]): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().scanTxs(txHashes);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise<void>((resolve, reject) => {
        this.module.scan_txs(this.cppAddress, JSON.stringify({txHashes: txHashes}), (err) => {
          if (err) reject(new MoneroError(err));
          else resolve();
        });
      });
    });
  }
  
  async rescanSpent(): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().rescanSpent();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise<void>((resolve, reject) => {
        this.module.rescan_spent(this.cppAddress, () => resolve());
      });
    });
  }
  
  async rescanBlockchain(): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().rescanBlockchain();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise<void>((resolve, reject) => {
        this.module.rescan_blockchain(this.cppAddress, () => resolve());
      });
    });
  }
  
  async getBalance(accountIdx?: number, subaddressIdx?: number): Promise<bigint> {
    if (this.getWalletProxy()) return this.getWalletProxy().getBalance(accountIdx, subaddressIdx);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      
      // get balance encoded in json string
      let balanceStr;
      if (accountIdx === undefined) {
        assert(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
        balanceStr = this.module.get_balance_wallet(this.cppAddress);
      } else if (subaddressIdx === undefined) {
        balanceStr = this.module.get_balance_account(this.cppAddress, accountIdx);
      } else {
        balanceStr = this.module.get_balance_subaddress(this.cppAddress, accountIdx, subaddressIdx);
      }
      
      // parse json string to bigint
      return BigInt(JSON.parse(GenUtils.stringifyBigInts(balanceStr)).balance);
    });
  }
  
  async getUnlockedBalance(accountIdx?: number, subaddressIdx?: number): Promise<bigint> {
    if (this.getWalletProxy()) return this.getWalletProxy().getUnlockedBalance(accountIdx, subaddressIdx);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      
      // get balance encoded in json string
      let unlockedBalanceStr;
      if (accountIdx === undefined) {
        assert(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
        unlockedBalanceStr = this.module.get_unlocked_balance_wallet(this.cppAddress);
      } else if (subaddressIdx === undefined) {
        unlockedBalanceStr = this.module.get_unlocked_balance_account(this.cppAddress, accountIdx);
      } else {
        unlockedBalanceStr = this.module.get_unlocked_balance_subaddress(this.cppAddress, accountIdx, subaddressIdx);
      }
      
      // parse json string to bigint
      return BigInt(JSON.parse(GenUtils.stringifyBigInts(unlockedBalanceStr)).unlockedBalance);
    });
  }
  
  async getAccounts(includeSubaddresses?: boolean, tag?: string): Promise<MoneroAccount[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().getAccounts(includeSubaddresses, tag);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let accountsStr = this.module.get_accounts(this.cppAddress, includeSubaddresses ? true : false, tag ? tag : "");
      let accounts = [];
      for (let accountJson of JSON.parse(GenUtils.stringifyBigInts(accountsStr)).accounts) {
        accounts.push(MoneroWalletFull.sanitizeAccount(new MoneroAccount(accountJson)));
      }
      return accounts;
    });
  }
  
  async getAccount(accountIdx: number, includeSubaddresses?: boolean): Promise<MoneroAccount> {
    if (this.getWalletProxy()) return this.getWalletProxy().getAccount(accountIdx, includeSubaddresses);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let accountStr = this.module.get_account(this.cppAddress, accountIdx, includeSubaddresses ? true : false);
      let accountJson = JSON.parse(GenUtils.stringifyBigInts(accountStr));
      return MoneroWalletFull.sanitizeAccount(new MoneroAccount(accountJson));
    });

  }
  
  async createAccount(label?: string): Promise<MoneroAccount> {
    if (this.getWalletProxy()) return this.getWalletProxy().createAccount(label);
    if (label === undefined) label = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let accountStr = this.module.create_account(this.cppAddress, label);
      let accountJson = JSON.parse(GenUtils.stringifyBigInts(accountStr));
      return MoneroWalletFull.sanitizeAccount(new MoneroAccount(accountJson));
    });
  }
  
  async getSubaddresses(accountIdx: number, subaddressIndices?: number[]): Promise<MoneroSubaddress[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().getSubaddresses(accountIdx, subaddressIndices);
    let args = {accountIdx: accountIdx, subaddressIndices: subaddressIndices === undefined ? [] : GenUtils.listify(subaddressIndices)};
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let subaddressesJson = JSON.parse(GenUtils.stringifyBigInts(this.module.get_subaddresses(this.cppAddress, JSON.stringify(args)))).subaddresses;
      let subaddresses = [];
      for (let subaddressJson of subaddressesJson) subaddresses.push(MoneroWalletKeys.sanitizeSubaddress(new MoneroSubaddress(subaddressJson)));
      return subaddresses;
    });
  }
  
  async createSubaddress(accountIdx: number, label?: string): Promise<MoneroSubaddress> {
    if (this.getWalletProxy()) return this.getWalletProxy().createSubaddress(accountIdx, label);
    if (label === undefined) label = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let subaddressStr = this.module.create_subaddress(this.cppAddress, accountIdx, label);
      let subaddressJson = JSON.parse(GenUtils.stringifyBigInts(subaddressStr));
      return MoneroWalletKeys.sanitizeSubaddress(new MoneroSubaddress(subaddressJson));
    });
  }

  async setSubaddressLabel(accountIdx: number, subaddressIdx: number, label: string): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().setSubaddressLabel(accountIdx, subaddressIdx, label);
    if (label === undefined) label = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.set_subaddress_label(this.cppAddress, accountIdx, subaddressIdx, label);
    });
  }
  
  async getTxs(query?: string[] | Partial<MoneroTxQuery>): Promise<MoneroTxWallet[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().getTxs(query);

    // copy and normalize query up to block
    const queryNormalized = query = MoneroWallet.normalizeTxQuery(query);
    
    // schedule task
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        
        // call wasm which invokes callback
        this.module.get_txs(this.cppAddress, JSON.stringify(queryNormalized.getBlock().toJson()), (blocksJsonStr) => {
          
          // check for error
          if (blocksJsonStr.charAt(0) !== "{") {
            reject(new MoneroError(blocksJsonStr));
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
  
  async getTransfers(query?: Partial<MoneroTransferQuery>): Promise<MoneroTransfer[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().getTransfers(query);
    
    // copy and normalize query up to block
    const queryNormalized = MoneroWallet.normalizeTransferQuery(query);
    
    // return promise which resolves on callback
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        
        // call wasm which invokes callback
        this.module.get_transfers(this.cppAddress, JSON.stringify(queryNormalized.getTxQuery().getBlock().toJson()), (blocksJsonStr) => {
            
          // check for error
          if (blocksJsonStr.charAt(0) !== "{") {
            reject(new MoneroError(blocksJsonStr));
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
  
  async getOutputs(query?: Partial<MoneroOutputQuery>): Promise<MoneroOutputWallet[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().getOutputs(query);
    
    // copy and normalize query up to block
    const queryNormalized = MoneroWallet.normalizeOutputQuery(query);
    
    // return promise which resolves on callback
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) =>{
        
        // call wasm which invokes callback
        this.module.get_outputs(this.cppAddress, JSON.stringify(queryNormalized.getTxQuery().getBlock().toJson()), (blocksJsonStr) => {
          
          // check for error
          if (blocksJsonStr.charAt(0) !== "{") {
            reject(new MoneroError(blocksJsonStr));
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
  
  async exportOutputs(all = false): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().exportOutputs(all);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.export_outputs(this.cppAddress, all, (outputsHex) => resolve(outputsHex));
      });
    });
  }
  
  async importOutputs(outputsHex: string): Promise<number> {
    if (this.getWalletProxy()) return this.getWalletProxy().importOutputs(outputsHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.import_outputs(this.cppAddress, outputsHex, (numImported) => resolve(numImported));
      });
    });
  }
  
  async exportKeyImages(all = false): Promise<MoneroKeyImage[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().exportKeyImages(all);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.export_key_images(this.cppAddress, all, (keyImagesStr) => {
          if (keyImagesStr.charAt(0) !== '{') reject(new MoneroError(keyImagesStr)); // json expected, else error
          let keyImages = [];
          for (let keyImageJson of JSON.parse(GenUtils.stringifyBigInts(keyImagesStr)).keyImages) keyImages.push(new MoneroKeyImage(keyImageJson));
          resolve(keyImages);
        });
      });
    });
  }
  
  async importKeyImages(keyImages: MoneroKeyImage[]): Promise<MoneroKeyImageImportResult> {
    if (this.getWalletProxy()) return this.getWalletProxy().importKeyImages(keyImages);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.import_key_images(this.cppAddress, JSON.stringify({keyImages: keyImages.map(keyImage => keyImage.toJson())}), (keyImageImportResultStr) => {
          resolve(new MoneroKeyImageImportResult(JSON.parse(GenUtils.stringifyBigInts(keyImageImportResultStr))));
        });
      });
    });
  }
  
  async getNewKeyImagesFromLastImport(): Promise<MoneroKeyImage[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().getNewKeyImagesFromLastImport();
    throw new MoneroError("Not implemented");
  }
  
  async freezeOutput(keyImage: string): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().freezeOutput(keyImage);
    if (!keyImage) throw new MoneroError("Must specify key image to freeze");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise<void>((resolve, reject) => {
        this.module.freeze_output(this.cppAddress, keyImage, () => resolve());
      });
    });
  }
  
  async thawOutput(keyImage: string): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().thawOutput(keyImage);
    if (!keyImage) throw new MoneroError("Must specify key image to thaw");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise<void>((resolve, reject) => {
        this.module.thaw_output(this.cppAddress, keyImage, () => resolve());
      });
    });
  }
  
  async isOutputFrozen(keyImage: string): Promise<boolean> {
    if (this.getWalletProxy()) return this.getWalletProxy().isOutputFrozen(keyImage);
    if (!keyImage) throw new MoneroError("Must specify key image to check if frozen");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.is_output_frozen(this.cppAddress, keyImage, (result) => resolve(result));
      });
    });
  }
  
  async createTxs(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().createTxs(config);
    
    // validate, copy, and normalize config
    const configNormalized = MoneroWallet.normalizeCreateTxsConfig(config);
    if (configNormalized.getCanSplit() === undefined) configNormalized.setCanSplit(true);
    
    // create txs in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        
        // create txs in wasm which invokes callback when done
        this.module.create_txs(this.cppAddress, JSON.stringify(configNormalized.toJson()), (txSetJsonStr) => {
          if (txSetJsonStr.charAt(0) !== '{') reject(new MoneroError(txSetJsonStr)); // json expected, else error
          else resolve(new MoneroTxSet(JSON.parse(GenUtils.stringifyBigInts(txSetJsonStr))).getTxs());
        });
      });
    });
  }
  
  async sweepOutput(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet> {
    if (this.getWalletProxy()) return this.getWalletProxy().sweepOutput(config);
    
    // normalize and validate config
    const configNormalized = MoneroWallet.normalizeSweepOutputConfig(config);
    
    // sweep output in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        
        // sweep output in wasm which invokes callback when done
        this.module.sweep_output(this.cppAddress, JSON.stringify(configNormalized.toJson()), (txSetJsonStr) => {
          if (txSetJsonStr.charAt(0) !== '{') reject(new MoneroError(txSetJsonStr)); // json expected, else error
          else resolve(new MoneroTxSet(JSON.parse(GenUtils.stringifyBigInts(txSetJsonStr))).getTxs()[0]);
        });
      });
    });
  }

  async sweepUnlocked(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().sweepUnlocked(config);
    
    // validate and normalize config
    const configNormalized = MoneroWallet.normalizeSweepUnlockedConfig(config);
    
    // sweep unlocked in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        
        // sweep unlocked in wasm which invokes callback when done
        this.module.sweep_unlocked(this.cppAddress, JSON.stringify(configNormalized.toJson()), (txSetsJson) => {
          if (txSetsJson.charAt(0) !== '{') reject(new MoneroError(txSetsJson)); // json expected, else error
          else {
            let txSets = [];
            for (let txSetJson of JSON.parse(GenUtils.stringifyBigInts(txSetsJson)).txSets) txSets.push(new MoneroTxSet(txSetJson));
            let txs = [];
            for (let txSet of txSets) for (let tx of txSet.getTxs()) txs.push(tx);
            resolve(txs);
          }
        });
      });
    });
  }
  
  async sweepDust(relay?: boolean): Promise<MoneroTxWallet[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().sweepDust(relay);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        
        // call wasm which invokes callback when done
        this.module.sweep_dust(this.cppAddress, relay, (txSetJsonStr) => {
          if (txSetJsonStr.charAt(0) !== '{') reject(new MoneroError(txSetJsonStr)); // json expected, else error
          else {
            let txSet = new MoneroTxSet(JSON.parse(GenUtils.stringifyBigInts(txSetJsonStr)));
            if (txSet.getTxs() === undefined) txSet.setTxs([]);
            resolve(txSet.getTxs());
          }
        });
      });
    });
  }
  
  async relayTxs(txsOrMetadatas: (MoneroTxWallet | string)[]): Promise<string[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().relayTxs(txsOrMetadatas);
    assert(Array.isArray(txsOrMetadatas), "Must provide an array of txs or their metadata to relay");
    let txMetadatas = [];
    for (let txOrMetadata of txsOrMetadatas) txMetadatas.push(txOrMetadata instanceof MoneroTxWallet ? txOrMetadata.getMetadata() : txOrMetadata);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.relay_txs(this.cppAddress, JSON.stringify({txMetadatas: txMetadatas}), (txHashesJson) => {
          if (txHashesJson.charAt(0) !== "{") reject(new MoneroError(txHashesJson));
          else resolve(JSON.parse(txHashesJson).txHashes);
        });
      });
    });
  }
  
  async describeTxSet(txSet: MoneroTxSet): Promise<MoneroTxSet> {
    if (this.getWalletProxy()) return this.getWalletProxy().describeTxSet(txSet);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      txSet = new MoneroTxSet({unsignedTxHex: txSet.getUnsignedTxHex(), signedTxHex: txSet.getSignedTxHex(), multisigTxHex: txSet.getMultisigTxHex()});
      try { return new MoneroTxSet(JSON.parse(GenUtils.stringifyBigInts(this.module.describe_tx_set(this.cppAddress, JSON.stringify(txSet.toJson()))))); }
      catch (err) { throw new MoneroError(this.module.get_exception_message(err)); }
    });
  }
  
  async signTxs(unsignedTxHex: string): Promise<MoneroTxSet> {
    if (this.getWalletProxy()) return this.getWalletProxy().signTxs(unsignedTxHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try { return new MoneroTxSet(JSON.parse(GenUtils.stringifyBigInts(this.module.sign_txs(this.cppAddress, unsignedTxHex)))); }
      catch (err) { throw new MoneroError(this.module.get_exception_message(err)); }
    });
  }
  
  async submitTxs(signedTxHex: string): Promise<string[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().submitTxs(signedTxHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.submit_txs(this.cppAddress, signedTxHex, (resp) => {
          if (resp.charAt(0) !== "{") reject(new MoneroError(resp));
          else resolve(JSON.parse(resp).txHashes);
        });
      });
    });
  }
  
  async signMessage(message: string, signatureType = MoneroMessageSignatureType.SIGN_WITH_SPEND_KEY, accountIdx = 0, subaddressIdx = 0): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().signMessage(message, signatureType, accountIdx, subaddressIdx);
    
    // assign defaults
    signatureType = signatureType || MoneroMessageSignatureType.SIGN_WITH_SPEND_KEY;
    accountIdx = accountIdx || 0;
    subaddressIdx = subaddressIdx || 0;
    
    // queue task to sign message
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try { return this.module.sign_message(this.cppAddress, message, signatureType === MoneroMessageSignatureType.SIGN_WITH_SPEND_KEY ? 0 : 1, accountIdx, subaddressIdx); }
      catch (err) { throw new MoneroError(this.module.get_exception_message(err)); }
    });
  }
  
  async verifyMessage(message: string, address: string, signature: string): Promise<MoneroMessageSignatureResult> {
    if (this.getWalletProxy()) return this.getWalletProxy().verifyMessage(message, address, signature);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let result;
      try {
        result = JSON.parse(this.module.verify_message(this.cppAddress, message, address, signature));
      } catch (err) {
        result = {isGood: false};
      }
      return new MoneroMessageSignatureResult(result.isGood ?
        {isGood: result.isGood, isOld: result.isOld, signatureType: result.signatureType === "spend" ? MoneroMessageSignatureType.SIGN_WITH_SPEND_KEY : MoneroMessageSignatureType.SIGN_WITH_VIEW_KEY, version: result.version} :
        {isGood: false}
      );
    });
  }
  
  async getTxKey(txHash: string): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().getTxKey(txHash);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try { return this.module.get_tx_key(this.cppAddress, txHash); }
      catch (err) { throw new MoneroError(this.module.get_exception_message(err)); }
    });
  }
  
  async checkTxKey(txHash: string, txKey: string, address: string): Promise<MoneroCheckTx> {
    if (this.getWalletProxy()) return this.getWalletProxy().checkTxKey(txHash, txKey, address);
    return this.module.queueTask(async () => {
      this.assertNotClosed(); 
      return new Promise((resolve, reject) => {
        this.module.check_tx_key(this.cppAddress, txHash, txKey, address, (respJsonStr) => {
          if (respJsonStr.charAt(0) !== "{") reject(new MoneroError(respJsonStr));
          else resolve(new MoneroCheckTx(JSON.parse(GenUtils.stringifyBigInts(respJsonStr))));
        });
      });
    });
  }
  
  async getTxProof(txHash: string, address: string, message?: string): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().getTxProof(txHash, address, message);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_tx_proof(this.cppAddress, txHash || "", address || "", message || "", (signature) => {
          let errorKey = "error: ";
          if (signature.indexOf(errorKey) === 0) reject(new MoneroError(signature.substring(errorKey.length)));
          else resolve(signature);
        });
      });
    });
  }
  
  async checkTxProof(txHash: string, address: string, message: string | undefined, signature: string): Promise<MoneroCheckTx> {
    if (this.getWalletProxy()) return this.getWalletProxy().checkTxProof(txHash, address, message, signature);
    return this.module.queueTask(async () => {
      this.assertNotClosed(); 
      return new Promise((resolve, reject) => {
        this.module.check_tx_proof(this.cppAddress, txHash || "", address || "", message || "", signature || "", (respJsonStr) => {
          if (respJsonStr.charAt(0) !== "{") reject(new MoneroError(respJsonStr));
          else resolve(new MoneroCheckTx(JSON.parse(GenUtils.stringifyBigInts(respJsonStr))));
        });
      });
    });
  }
  
  async getSpendProof(txHash: string, message?: string): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().getSpendProof(txHash, message);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_spend_proof(this.cppAddress, txHash || "", message || "", (signature) => {
          let errorKey = "error: ";
          if (signature.indexOf(errorKey) === 0) reject(new MoneroError(signature.substring(errorKey.length)));
          else resolve(signature);
        });
      });
    });
  }
  
  async checkSpendProof(txHash: string, message: string | undefined, signature: string): Promise<boolean> {
    if (this.getWalletProxy()) return this.getWalletProxy().checkSpendProof(txHash, message, signature);
    return this.module.queueTask(async () => {
      this.assertNotClosed(); 
      return new Promise((resolve, reject) => {
        this.module.check_spend_proof(this.cppAddress, txHash || "", message || "", signature || "", (resp) => {
          typeof resp === "string" ? reject(new MoneroError(resp)) : resolve(resp);
        });
      });
    });
  }
  
  async getReserveProofWallet(message?: string): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().getReserveProofWallet(message);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_reserve_proof_wallet(this.cppAddress, message, (signature) => {
          let errorKey = "error: ";
          if (signature.indexOf(errorKey) === 0) reject(new MoneroError(signature.substring(errorKey.length), -1));
          else resolve(signature);
        });
      });
    });
  }
  
  async getReserveProofAccount(accountIdx: number, amount: bigint, message?: string): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().getReserveProofAccount(accountIdx, amount, message);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_reserve_proof_account(this.cppAddress, accountIdx, amount.toString(), message, (signature) => {
          let errorKey = "error: ";
          if (signature.indexOf(errorKey) === 0) reject(new MoneroError(signature.substring(errorKey.length), -1));
          else resolve(signature);
        });
      });
    });
  }

  async checkReserveProof(address: string, message: string | undefined, signature: string): Promise<MoneroCheckReserve> {
    if (this.getWalletProxy()) return this.getWalletProxy().checkReserveProof(address, message, signature);
    return this.module.queueTask(async () => {
      this.assertNotClosed(); 
      return new Promise((resolve, reject) => {
        this.module.check_reserve_proof(this.cppAddress, address, message, signature, (respJsonStr) => {
          if (respJsonStr.charAt(0) !== "{") reject(new MoneroError(respJsonStr, -1));
          else resolve(new MoneroCheckReserve(JSON.parse(GenUtils.stringifyBigInts(respJsonStr))));
        });
      });
    });
  }
  
  async getTxNotes(txHashes: string[]): Promise<string[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().getTxNotes(txHashes);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try { return JSON.parse(this.module.get_tx_notes(this.cppAddress, JSON.stringify({txHashes: txHashes}))).txNotes; }
      catch (err) { throw new MoneroError(this.module.get_exception_message(err)); }
    });
  }
  
  async setTxNotes(txHashes: string[], notes: string[]): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().setTxNotes(txHashes, notes);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try { this.module.set_tx_notes(this.cppAddress, JSON.stringify({txHashes: txHashes, txNotes: notes})); }
      catch (err) { throw new MoneroError(this.module.get_exception_message(err)); }
    });
  }
  
  async getAddressBookEntries(entryIndices?: number[]): Promise<MoneroAddressBookEntry[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().getAddressBookEntries(entryIndices);
    if (!entryIndices) entryIndices = [];
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let entries = [];
      for (let entryJson of JSON.parse(this.module.get_address_book_entries(this.cppAddress, JSON.stringify({entryIndices: entryIndices}))).entries) {
        entries.push(new MoneroAddressBookEntry(entryJson));
      }
      return entries;
    });
  }
  
  async addAddressBookEntry(address: string, description?: string): Promise<number> {
    if (this.getWalletProxy()) return this.getWalletProxy().addAddressBookEntry(address, description);
    if (!address) address = "";
    if (!description) description = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.add_address_book_entry(this.cppAddress, address, description);
    });
  }
  
  async editAddressBookEntry(index: number, setAddress: boolean, address: string | undefined, setDescription: boolean, description: string | undefined): Promise<void> {
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
  
  async deleteAddressBookEntry(entryIdx: number): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().deleteAddressBookEntry(entryIdx);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.delete_address_book_entry(this.cppAddress, entryIdx);
    });
  }
  
  async tagAccounts(tag: string, accountIndices: number[]): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().tagAccounts(tag, accountIndices);
    if (!tag) tag = "";
    if (!accountIndices) accountIndices = [];
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.tag_accounts(this.cppAddress, JSON.stringify({tag: tag, accountIndices: accountIndices}));
    });
  }

  async untagAccounts(accountIndices: number[]): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().untagAccounts(accountIndices);
    if (!accountIndices) accountIndices = [];
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.tag_accounts(this.cppAddress, JSON.stringify({accountIndices: accountIndices}));
    });
  }
  
  async getAccountTags(): Promise<MoneroAccountTag[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().getAccountTags();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let accountTags = [];
      for (let accountTagJson of JSON.parse(this.module.get_account_tags(this.cppAddress)).accountTags) accountTags.push(new MoneroAccountTag(accountTagJson));
      return accountTags;
    });
  }

  async setAccountTagLabel(tag: string, label: string): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().setAccountTagLabel(tag, label);
    if (!tag) tag = "";
    if (!label) label = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.set_account_tag_label(this.cppAddress, tag, label);
    });
  }
  
  async getPaymentUri(config: MoneroTxConfig): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().getPaymentUri(config);
    config = MoneroWallet.normalizeCreateTxsConfig(config);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {
        return this.module.get_payment_uri(this.cppAddress, JSON.stringify(config.toJson()));
      } catch (err) {
        throw new MoneroError("Cannot make URI from supplied parameters");
      }
    });
  }
  
  async parsePaymentUri(uri: string): Promise<MoneroTxConfig> {
    if (this.getWalletProxy()) return this.getWalletProxy().parsePaymentUri(uri);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {
        return new MoneroTxConfig(JSON.parse(GenUtils.stringifyBigInts(this.module.parse_payment_uri(this.cppAddress, uri))));
      } catch (err: any) {
        throw new MoneroError(err.message);
      }
    });
  }
  
  async getAttribute(key: string): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().getAttribute(key);
    this.assertNotClosed();
    assert(typeof key === "string", "Attribute key must be a string");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let value = this.module.get_attribute(this.cppAddress, key);
      return value === "" ? null : value;
    });
  }
  
  async setAttribute(key: string, val: string): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().setAttribute(key, val);
    this.assertNotClosed();
    assert(typeof key === "string", "Attribute key must be a string");
    assert(typeof val === "string", "Attribute value must be a string");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.set_attribute(this.cppAddress, key, val);
    });
  }
  
  async startMining(numThreads: number, backgroundMining?: boolean, ignoreBattery?: boolean): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().startMining(numThreads, backgroundMining, ignoreBattery);
    this.assertNotClosed();
    let daemon = await MoneroDaemonRpc.connectToDaemonRpc(await this.getDaemonConnection());
    await daemon.startMining(await this.getPrimaryAddress(), numThreads, backgroundMining, ignoreBattery);
  }
  
  async stopMining(): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().stopMining();
    this.assertNotClosed();
    let daemon = await MoneroDaemonRpc.connectToDaemonRpc(await this.getDaemonConnection());
    await daemon.stopMining();
  }
  
  async isMultisigImportNeeded(): Promise<boolean> {
    if (this.getWalletProxy()) return this.getWalletProxy().isMultisigImportNeeded();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.is_multisig_import_needed(this.cppAddress);
    });
  }
  
  async isMultisig(): Promise<boolean> {
    if (this.getWalletProxy()) return this.getWalletProxy().isMultisig();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.is_multisig(this.cppAddress);
    });
  }
  
  async getMultisigInfo(): Promise<MoneroMultisigInfo> {
    if (this.getWalletProxy()) return this.getWalletProxy().getMultisigInfo();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new MoneroMultisigInfo(JSON.parse(this.module.get_multisig_info(this.cppAddress)));
    });
  }
  
  async prepareMultisig(): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().prepareMultisig();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.prepare_multisig(this.cppAddress);
    });
  }
  
  async makeMultisig(multisigHexes: string[], threshold: number, password: string): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().makeMultisig(multisigHexes, threshold, password);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.make_multisig(this.cppAddress, JSON.stringify({multisigHexes: multisigHexes, threshold: threshold, password: password}), (resp) => {
          let errorKey = "error: ";
          if (resp.indexOf(errorKey) === 0) reject(new MoneroError(resp.substring(errorKey.length)));
          else resolve(resp);
        });
      });
    });
  }
  
  async exchangeMultisigKeys(multisigHexes: string[], password: string): Promise<MoneroMultisigInitResult> {
    if (this.getWalletProxy()) return this.getWalletProxy().exchangeMultisigKeys(multisigHexes, password);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.exchange_multisig_keys(this.cppAddress, JSON.stringify({multisigHexes: multisigHexes, password: password}), (resp) => {
          let errorKey = "error: ";
          if (resp.indexOf(errorKey) === 0) reject(new MoneroError(resp.substring(errorKey.length)));
          else resolve(new MoneroMultisigInitResult(JSON.parse(resp)));
        });
      });
    });
  }
  
  async exportMultisigHex(): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().exportMultisigHex();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.export_multisig_hex(this.cppAddress);
    });
  }
  
  async importMultisigHex(multisigHexes: string[]): Promise<number> {
    if (this.getWalletProxy()) return this.getWalletProxy().importMultisigHex(multisigHexes);
    if (!GenUtils.isArray(multisigHexes)) throw new MoneroError("Must provide string[] to importMultisigHex()")
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.import_multisig_hex(this.cppAddress, JSON.stringify({multisigHexes: multisigHexes}), (resp) => {
          if (typeof resp === "string") reject(new MoneroError(resp));
          else resolve(resp);
        });
      });
    });
  }
  
  async signMultisigTxHex(multisigTxHex: string): Promise<MoneroMultisigSignResult> {
    if (this.getWalletProxy()) return this.getWalletProxy().signMultisigTxHex(multisigTxHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.sign_multisig_tx_hex(this.cppAddress, multisigTxHex, (resp) => {
          if (resp.charAt(0) !== "{") reject(new MoneroError(resp));
          else resolve(new MoneroMultisigSignResult(JSON.parse(resp)));
        });
      });
    });
  }
  
  async submitMultisigTxHex(signedMultisigTxHex: string): Promise<string[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().submitMultisigTxHex(signedMultisigTxHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.submit_multisig_tx_hex(this.cppAddress, signedMultisigTxHex, (resp) => {
          if (resp.charAt(0) !== "{") reject(new MoneroError(resp));
          else resolve(JSON.parse(resp).txHashes);
        });
      });
    });
  }
  
  /**
   * Get the wallet's keys and cache data.
   * 
   * @return {Promise<DataView[]>} is the keys and cache data, respectively
   */
  async getData(): Promise<DataView[]> {
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
  
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().changePassword(oldPassword, newPassword);
    if (oldPassword !== this.password) throw new MoneroError("Invalid original password."); // wallet2 verify_password loads from disk so verify password here
    if (newPassword === undefined) newPassword = "";
    await this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise<void>((resolve, reject) => {
        this.module.change_wallet_password(this.cppAddress, oldPassword, newPassword, (errMsg) => {
          if (errMsg) reject(new MoneroError(errMsg));
          else resolve();
        });
      });
    });
    this.password = newPassword;
    if (this.path) await this.save(); // auto save
  }
  
  async save(): Promise<void> {
    if (this.getWalletProxy()) return this.getWalletProxy().save();
    return MoneroWalletFull.save(this);
  }
  
  async close(save = false): Promise<void> {
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
    LibraryUtils.setRejectUnauthorizedFn(this.rejectUnauthorizedConfigId, undefined); // unregister fn informing if unauthorized reqs should be rejected
  }
  
  // ----------- ADD JSDOC FOR SUPPORTED DEFAULT IMPLEMENTATIONS --------------
  
  async getNumBlocksToUnlock(): Promise<number[]> { return super.getNumBlocksToUnlock(); }
  async getTx(txHash: string): Promise<MoneroTxWallet> { return super.getTx(txHash); }
  async getIncomingTransfers(query: Partial<MoneroTransferQuery>): Promise<MoneroIncomingTransfer[]> { return super.getIncomingTransfers(query); }
  async getOutgoingTransfers(query: Partial<MoneroTransferQuery>) { return super.getOutgoingTransfers(query); }
  async createTx(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet> { return super.createTx(config); }
  async relayTx(txOrMetadata: MoneroTxWallet | string): Promise<string> { return super.relayTx(txOrMetadata); }
  async getTxNote(txHash: string): Promise<string> { return super.getTxNote(txHash); }
  async setTxNote(txHash: string, note: string): Promise<void> { return super.setTxNote(txHash, note); }
  
  // ---------------------------- PRIVATE HELPERS ----------------------------

  protected static async openWalletData(config: Partial<MoneroWalletConfig>) {
    if (config.proxyToWorker) {
      let walletProxy = await MoneroWalletFullProxy.openWalletData(config);
      return new MoneroWalletFull(undefined, undefined, undefined, undefined, undefined, undefined, walletProxy);
    }
    
    // validate and normalize parameters
    if (config.networkType === undefined) throw new MoneroError("Must provide the wallet's network type");
    config.networkType = MoneroNetworkType.from(config.networkType);
    let daemonConnection = config.getServer();
    let daemonUri = daemonConnection && daemonConnection.getUri() ? daemonConnection.getUri() : "";
    let daemonUsername = daemonConnection && daemonConnection.getUsername() ? daemonConnection.getUsername() : "";
    let daemonPassword = daemonConnection && daemonConnection.getPassword() ? daemonConnection.getPassword() : "";
    let rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true;
    
    // load wasm module
    let module = await LibraryUtils.loadFullModule();
    
    // open wallet in queue
    return module.queueTask(async () => {
      return new Promise((resolve, reject) => {
        
        // register fn informing if unauthorized reqs should be rejected
        let rejectUnauthorizedFnId = GenUtils.getUUID();
        LibraryUtils.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => rejectUnauthorized);
      
        // create wallet in wasm which invokes callback when done
        module.open_wallet_full(config.password, config.networkType, config.keysData ?? "", config.cacheData ?? "", daemonUri, daemonUsername, daemonPassword, rejectUnauthorizedFnId, (cppAddress) => {
          if (typeof cppAddress === "string") reject(new MoneroError(cppAddress));
          else resolve(new MoneroWalletFull(cppAddress, config.path, config.password, fs, rejectUnauthorized, rejectUnauthorizedFnId));
        });
      });
    });
  }

  protected getWalletProxy(): MoneroWalletFullProxy {
    return super.getWalletProxy() as MoneroWalletFullProxy;
  }
  
  protected async backgroundSync() {
    let label = this.path ? this.path : (this.browserMainPath ? this.browserMainPath : "in-memory wallet"); // label for log
    LibraryUtils.log(1, "Background synchronizing " + label);
    try { await this.sync(); }
    catch (err: any) { if (!this._isClosed) console.error("Failed to background synchronize " + label + ": " + err.message); }
  }
  
  protected async refreshListening() {
    let isEnabled = this.listeners.length > 0;
    if (this.wasmListenerHandle === 0 && !isEnabled || this.wasmListenerHandle > 0 && isEnabled) return; // no difference
    return this.module.queueTask(async () => {
      return new Promise<void>((resolve, reject) => {
        this.module.set_listener(
          this.cppAddress,
          this.wasmListenerHandle,
            newListenerHandle => {
              if (typeof newListenerHandle === "string") reject(new MoneroError(newListenerHandle));
              else {
                this.wasmListenerHandle = newListenerHandle;
                resolve();
              }
            },
            isEnabled ? async (height, startHeight, endHeight, percentDone, message) => await this.wasmListener.onSyncProgress(height, startHeight, endHeight, percentDone, message) : undefined,
            isEnabled ? async (height) => await this.wasmListener.onNewBlock(height) : undefined,
            isEnabled ? async (newBalanceStr, newUnlockedBalanceStr) => await this.wasmListener.onBalancesChanged(newBalanceStr, newUnlockedBalanceStr) : undefined,
            isEnabled ? async (height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockTime, isLocked) => await this.wasmListener.onOutputReceived(height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockTime, isLocked) : undefined,
            isEnabled ? async (height, txHash, amountStr, accountIdxStr, subaddressIdxStr, version, unlockTime, isLocked) => await this.wasmListener.onOutputSpent(height, txHash, amountStr, accountIdxStr, subaddressIdxStr, version, unlockTime, isLocked) : undefined,
        );
      });
    });
  }
  
  static sanitizeBlock(block) {
    for (let tx of block.getTxs()) MoneroWalletFull.sanitizeTxWallet(tx);
    return block;
  }
  
  static sanitizeTxWallet(tx) {
    assert(tx instanceof MoneroTxWallet);
    return tx;
  }
  
  static sanitizeAccount(account) {
    if (account.getSubaddresses()) {
      for (let subaddress of account.getSubaddresses()) MoneroWalletKeys.sanitizeSubaddress(subaddress);
    }
    return account;
  }
  
  static deserializeBlocks(blocksJsonStr) {
    let blocksJson = JSON.parse(GenUtils.stringifyBigInts(blocksJsonStr));
    let deserializedBlocks: any = {};
    deserializedBlocks.blocks = [];
    if (blocksJson.blocks) for (let blockJson of blocksJson.blocks) deserializedBlocks.blocks.push(MoneroWalletFull.sanitizeBlock(new MoneroBlock(blockJson, MoneroBlock.DeserializationType.TX_WALLET)));
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
  protected setBrowserMainPath(browserMainPath) {
    this.browserMainPath = browserMainPath;
  }
  
  static async moveTo(path, wallet) {
    if (await wallet.isClosed()) throw new MoneroError("Wallet is closed");
    if (!path) throw new MoneroError("Must provide path of destination wallet");
    
    // save and return if same path
    if (Path.normalize(wallet.path) === Path.normalize(path)) {
      await wallet.save();
      return;
    }
    
    // create destination directory if it doesn't exist
    let walletDir = Path.dirname(path);
    if (!wallet.fs.existsSync(walletDir)) {
      try { wallet.fs.mkdirSync(walletDir); }
      catch (err: any) { throw new MoneroError("Destination path " + path + " does not exist and cannot be created: " + err.message); }
    }
    
    // write wallet files
    let data = await wallet.getData();
    wallet.fs.writeFileSync(path + ".keys", data[0], "binary");
    wallet.fs.writeFileSync(path, data[1], "binary");
    wallet.fs.writeFileSync(path + ".address.txt", await wallet.getPrimaryAddress());
    let oldPath = wallet.path;
    wallet.path = path;
    
    // delete old wallet files
    if (oldPath) {
      wallet.fs.unlinkSync(oldPath + ".address.txt");
      wallet.fs.unlinkSync(oldPath + ".keys");
      wallet.fs.unlinkSync(oldPath);
    }
  }
  
  static async save(wallet: any) {
    if (await wallet.isClosed()) throw new MoneroError("Wallet is closed");
        
    // path must be set
    let path = await wallet.getPath();
    if (!path) throw new MoneroError("Cannot save wallet because path is not set");
    
    // write wallet files to *.new
    let pathNew = path + ".new";
    let data = await wallet.getData();
    wallet.fs.writeFileSync(pathNew + ".keys", data[0], "binary");
    wallet.fs.writeFileSync(pathNew, data[1], "binary");
    wallet.fs.writeFileSync(pathNew + ".address.txt", await wallet.getPrimaryAddress());
    
    // replace old wallet files with new
    wallet.fs.renameSync(pathNew + ".keys", path + ".keys");
    wallet.fs.renameSync(pathNew, path, path + ".keys");
    wallet.fs.renameSync(pathNew + ".address.txt", path + ".address.txt", path + ".keys");
  }
}

/**
 * Implements a MoneroWallet by proxying requests to a worker which runs a full wallet.
 * 
 * @private
 */
class MoneroWalletFullProxy extends MoneroWalletKeysProxy {

  // instance variables
  protected path: any;
  protected fs: any;
  protected wrappedListeners: any;
  
  // -------------------------- WALLET STATIC UTILS ---------------------------
  
  static async openWalletData(config: Partial<MoneroWalletConfig>) {
    let walletId = GenUtils.getUUID();
    if (config.password === undefined) config.password = "";
    let daemonConnection = config.getServer();
    await LibraryUtils.invokeWorker(walletId, "openWalletData", [config.path, config.password, config.networkType, config.keysData, config.cacheData, daemonConnection ? daemonConnection.toJson() : undefined]);
    let wallet = new MoneroWalletFullProxy(walletId, await LibraryUtils.getWorker(), config.path, config.getFs());
    if (config.path) await wallet.save();
    return wallet;
  }
  
  static async createWallet(config) {
    if (config.getPath() && MoneroWalletFull.walletExists(config.getPath(), config.getFs())) throw new MoneroError("Wallet already exists: " + config.getPath());
    let walletId = GenUtils.getUUID();
    await LibraryUtils.invokeWorker(walletId, "createWalletFull", [config.toJson()]);
    let wallet = new MoneroWalletFullProxy(walletId, await LibraryUtils.getWorker(), config.getPath(), config.getFs());
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
    this.fs = fs ? fs : (path ? MoneroWalletFull.getFs() : undefined);
    this.wrappedListeners = [];
  }

  getPath() {
    return this.path;
  }

  async getNetworkType() {
    return this.invokeWorker("getNetworkType");
  }
  
  async setSubaddressLabel(accountIdx, subaddressIdx, label) {
    return this.invokeWorker("setSubaddressLabel", Array.from(arguments)) as Promise<void>;
  }
  
  async setDaemonConnection(uriOrRpcConnection) {
    if (!uriOrRpcConnection) await this.invokeWorker("setDaemonConnection");
    else {
      let connection = !uriOrRpcConnection ? undefined : uriOrRpcConnection instanceof MoneroRpcConnection ? uriOrRpcConnection : new MoneroRpcConnection(uriOrRpcConnection);
      await this.invokeWorker("setDaemonConnection", connection ? connection.getConfig() : undefined);
    }
  }
  
  async getDaemonConnection() {
    let rpcConfig = await this.invokeWorker("getDaemonConnection");
    return rpcConfig ? new MoneroRpcConnection(rpcConfig) : undefined;
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
    LibraryUtils.addWorkerCallback(this.walletId, "onSyncProgress_" + listenerId, [wrappedListener.onSyncProgress, wrappedListener]);
    LibraryUtils.addWorkerCallback(this.walletId, "onNewBlock_" + listenerId, [wrappedListener.onNewBlock, wrappedListener]);
    LibraryUtils.addWorkerCallback(this.walletId, "onBalancesChanged_" + listenerId, [wrappedListener.onBalancesChanged, wrappedListener]);
    LibraryUtils.addWorkerCallback(this.walletId, "onOutputReceived_" + listenerId, [wrappedListener.onOutputReceived, wrappedListener]);
    LibraryUtils.addWorkerCallback(this.walletId, "onOutputSpent_" + listenerId, [wrappedListener.onOutputSpent, wrappedListener]);
    this.wrappedListeners.push(wrappedListener);
    return this.invokeWorker("addListener", [listenerId]);
  }
  
  async removeListener(listener) {
    for (let i = 0; i < this.wrappedListeners.length; i++) {
      if (this.wrappedListeners[i].getListener() === listener) {
        let listenerId = this.wrappedListeners[i].getId();
        await this.invokeWorker("removeListener", [listenerId]);
        LibraryUtils.removeWorkerCallback(this.walletId, "onSyncProgress_" + listenerId);
        LibraryUtils.removeWorkerCallback(this.walletId, "onNewBlock_" + listenerId);
        LibraryUtils.removeWorkerCallback(this.walletId, "onBalancesChanged_" + listenerId);
        LibraryUtils.removeWorkerCallback(this.walletId, "onOutputReceived_" + listenerId);
        LibraryUtils.removeWorkerCallback(this.walletId, "onOutputSpent_" + listenerId);
        this.wrappedListeners.splice(i, 1);
        return;
      }
    }
    throw new MoneroError("Listener is not registered with wallet");
  }
  
  getListeners() {
    let listeners = [];
    for (let wrappedListener of this.wrappedListeners) listeners.push(wrappedListener.getListener());
    return listeners;
  }
  
  async isSynced() {
    return this.invokeWorker("isSynced");
  }
  
  async sync(listenerOrStartHeight?: MoneroWalletListener | number, startHeight?: number, allowConcurrentCalls = false): Promise<MoneroSyncResult> {
    
    // normalize params
    startHeight = listenerOrStartHeight instanceof MoneroWalletListener ? startHeight : listenerOrStartHeight;
    let listener = listenerOrStartHeight instanceof MoneroWalletListener ? listenerOrStartHeight : undefined;
    if (startHeight === undefined) startHeight = Math.max(await this.getHeight(), await this.getRestoreHeight());
    
    // register listener if given
    if (listener) await this.addListener(listener);
    
    // sync wallet in worker 
    let err;
    let result;
    try {
      let resultJson = await this.invokeWorker("sync", [startHeight, allowConcurrentCalls]);
      result = new MoneroSyncResult(resultJson.numBlocksFetched, resultJson.receivedMoney);
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
    assert(Array.isArray(txHashes), "Must provide an array of txs hashes to scan");
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
    for (let accountJson of (await this.invokeWorker("getAccounts", Array.from(arguments)))) {
      accounts.push(MoneroWalletFull.sanitizeAccount(new MoneroAccount(accountJson)));
    }
    return accounts;
  }
  
  async getAccount(accountIdx, includeSubaddresses) {
    let accountJson = await this.invokeWorker("getAccount", Array.from(arguments));
    return MoneroWalletFull.sanitizeAccount(new MoneroAccount(accountJson));
  }
  
  async createAccount(label) {
    let accountJson = await this.invokeWorker("createAccount", Array.from(arguments));
    return MoneroWalletFull.sanitizeAccount(new MoneroAccount(accountJson));
  }
  
  async getSubaddresses(accountIdx, subaddressIndices) {
    let subaddresses = [];
    for (let subaddressJson of (await this.invokeWorker("getSubaddresses", Array.from(arguments)))) {
      subaddresses.push(MoneroWalletKeys.sanitizeSubaddress(new MoneroSubaddress(subaddressJson)));
    }
    return subaddresses;
  }
  
  async createSubaddress(accountIdx, label) {
    let subaddressJson = await this.invokeWorker("createSubaddress", Array.from(arguments));
    return MoneroWalletKeys.sanitizeSubaddress(new MoneroSubaddress(subaddressJson));
  }
  
  async getTxs(query) {
    query = MoneroWallet.normalizeTxQuery(query);
    let respJson = await this.invokeWorker("getTxs", [query.getBlock().toJson()]);
    return MoneroWalletFull.deserializeTxs(query, JSON.stringify({blocks: respJson.blocks})); // initialize txs from blocks json string TODO: this stringifies then utility parses, avoid
  }
  
  async getTransfers(query) {
    query = MoneroWallet.normalizeTransferQuery(query);
    let blockJsons = await this.invokeWorker("getTransfers", [query.getTxQuery().getBlock().toJson()]);
    return MoneroWalletFull.deserializeTransfers(query, JSON.stringify({blocks: blockJsons})); // initialize transfers from blocks json string TODO: this stringifies then utility parses, avoid
  }
  
  async getOutputs(query) {
    query = MoneroWallet.normalizeOutputQuery(query);
    let blockJsons = await this.invokeWorker("getOutputs", [query.getTxQuery().getBlock().toJson()]);
    return MoneroWalletFull.deserializeOutputs(query, JSON.stringify({blocks: blockJsons})); // initialize transfers from blocks json string TODO: this stringifies then utility parses, avoid
  }
  
  async exportOutputs(all) {
    return this.invokeWorker("exportOutputs", [all]);
  }
  
  async importOutputs(outputsHex) {
    return this.invokeWorker("importOutputs", [outputsHex]);
  }
  
  async exportKeyImages(all) {
    let keyImages = [];
    for (let keyImageJson of await this.invokeWorker("getKeyImages", [all])) keyImages.push(new MoneroKeyImage(keyImageJson));
    return keyImages;
  }
  
  async importKeyImages(keyImages) {
    let keyImagesJson = [];
    for (let keyImage of keyImages) keyImagesJson.push(keyImage.toJson());
    return new MoneroKeyImageImportResult(await this.invokeWorker("importKeyImages", [keyImagesJson]));
  }
  
  async getNewKeyImagesFromLastImport(): Promise<MoneroKeyImage[]> {
    throw new MoneroError("MoneroWalletFull.getNewKeyImagesFromLastImport() not implemented");
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
    config = MoneroWallet.normalizeCreateTxsConfig(config);
    let txSetJson = await this.invokeWorker("createTxs", [config.toJson()]);
    return new MoneroTxSet(txSetJson).getTxs();
  }
  
  async sweepOutput(config) {
    config = MoneroWallet.normalizeSweepOutputConfig(config);
    let txSetJson = await this.invokeWorker("sweepOutput", [config.toJson()]);
    return new MoneroTxSet(txSetJson).getTxs()[0];
  }

  async sweepUnlocked(config) {
    config = MoneroWallet.normalizeSweepUnlockedConfig(config);
    let txSetsJson = await this.invokeWorker("sweepUnlocked", [config.toJson()]);
    let txs = [];
    for (let txSetJson of txSetsJson) for (let tx of new MoneroTxSet(txSetJson).getTxs()) txs.push(tx);
    return txs;
  }
  
  async sweepDust(relay) {
    return new MoneroTxSet(await this.invokeWorker("sweepDust", [relay])).getTxs() || [];
  }
  
  async relayTxs(txsOrMetadatas) {
    assert(Array.isArray(txsOrMetadatas), "Must provide an array of txs or their metadata to relay");
    let txMetadatas = [];
    for (let txOrMetadata of txsOrMetadatas) txMetadatas.push(txOrMetadata instanceof MoneroTxWallet ? txOrMetadata.getMetadata() : txOrMetadata);
    return this.invokeWorker("relayTxs", [txMetadatas]);
  }
  
  async describeTxSet(txSet) {
    return new MoneroTxSet(await this.invokeWorker("describeTxSet", [txSet.toJson()]));
  }
  
  async signTxs(unsignedTxHex) {
    return new MoneroTxSet(await this.invokeWorker("signTxs", Array.from(arguments)));
  }
  
  async submitTxs(signedTxHex) {
    return this.invokeWorker("submitTxs", Array.from(arguments));
  }
  
  async signMessage(message, signatureType, accountIdx, subaddressIdx) {
    return this.invokeWorker("signMessage", Array.from(arguments));
  }
  
  async verifyMessage(message, address, signature) {
    return new MoneroMessageSignatureResult(await this.invokeWorker("verifyMessage", Array.from(arguments)));
  }
  
  async getTxKey(txHash) {
    return this.invokeWorker("getTxKey", Array.from(arguments));
  }
  
  async checkTxKey(txHash, txKey, address) {
    return new MoneroCheckTx(await this.invokeWorker("checkTxKey", Array.from(arguments)));
  }
  
  async getTxProof(txHash, address, message) {
    return this.invokeWorker("getTxProof", Array.from(arguments));
  }
  
  async checkTxProof(txHash, address, message, signature) {
    return new MoneroCheckTx(await this.invokeWorker("checkTxProof", Array.from(arguments)));
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
    try { return await this.invokeWorker("getReserveProofAccount", [accountIdx, amount.toString(), message]); }
    catch (e: any) { throw new MoneroError(e.message, -1); }
  }

  async checkReserveProof(address, message, signature) {
    try { return new MoneroCheckReserve(await this.invokeWorker("checkReserveProof", Array.from(arguments))); }
    catch (e: any) { throw new MoneroError(e.message, -1); }
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
      entries.push(new MoneroAddressBookEntry(entryJson));
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
    config = MoneroWallet.normalizeCreateTxsConfig(config);
    return this.invokeWorker("getPaymentUri", [config.toJson()]);
  }
  
  async parsePaymentUri(uri) {
    return new MoneroTxConfig(await this.invokeWorker("parsePaymentUri", Array.from(arguments)));
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
    return new MoneroMultisigInfo(await this.invokeWorker("getMultisigInfo"));
  }
  
  async prepareMultisig() {
    return this.invokeWorker("prepareMultisig");
  }
  
  async makeMultisig(multisigHexes, threshold, password) {
    return await this.invokeWorker("makeMultisig", Array.from(arguments));
  }
  
  async exchangeMultisigKeys(multisigHexes, password) {
    return new MoneroMultisigInitResult(await this.invokeWorker("exchangeMultisigKeys", Array.from(arguments)));
  }
  
  async exportMultisigHex() {
    return this.invokeWorker("exportMultisigHex");
  }
  
  async importMultisigHex(multisigHexes) {
    return this.invokeWorker("importMultisigHex", Array.from(arguments));
  }
  
  async signMultisigTxHex(multisigTxHex) {
    return new MoneroMultisigSignResult(await this.invokeWorker("signMultisigTxHex", Array.from(arguments)));
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

  protected wallet: MoneroWallet;
  
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
    let output = new MoneroOutputWallet();
    output.setAmount(BigInt(amountStr));
    output.setAccountIndex(accountIdx);
    output.setSubaddressIndex(subaddressIdx);
    let tx = new MoneroTxWallet();
    tx.setHash(txHash);
    tx.setVersion(version);
    tx.setUnlockTime(unlockTime);
    output.setTx(tx);
    tx.setOutputs([output]);
    tx.setIsIncoming(true);
    tx.setIsLocked(isLocked);
    if (height > 0) {
      let block = new MoneroBlock().setHeight(height);
      block.setTxs([tx as MoneroTx]);
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
    let output = new MoneroOutputWallet();
    output.setAmount(BigInt(amountStr));
    if (accountIdxStr) output.setAccountIndex(parseInt(accountIdxStr));
    if (subaddressIdxStr) output.setSubaddressIndex(parseInt(subaddressIdxStr));
    let tx = new MoneroTxWallet();
    tx.setHash(txHash);
    tx.setVersion(version);
    tx.setUnlockTime(unlockTime);
    tx.setIsLocked(isLocked);
    output.setTx(tx);
    tx.setInputs([output]);
    if (height > 0) {
      let block = new MoneroBlock().setHeight(height);
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

  protected id: any;
  protected listener: any;
  
  constructor(listener) {
    this.id = GenUtils.getUUID();
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
    let block = new MoneroBlock(blockJson, MoneroBlock.DeserializationType.TX_WALLET);
    await this.listener.onOutputReceived(block.getTxs()[0].getOutputs()[0]);
  }
  
  async onOutputSpent(blockJson) {
    let block = new MoneroBlock(blockJson, MoneroBlock.DeserializationType.TX_WALLET);
    await this.listener.onOutputSpent(block.getTxs()[0].getInputs()[0]);
  }
}
