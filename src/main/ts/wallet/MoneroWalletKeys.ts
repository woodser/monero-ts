import assert from "assert";
import GenUtils from "../common/GenUtils";
import LibraryUtils from "../common/LibraryUtils";
import MoneroAccount from "./model/MoneroAccount";
import MoneroError from "../common/MoneroError";
import MoneroIntegratedAddress from "./model/MoneroIntegratedAddress";
import MoneroNetworkType from "../daemon/model/MoneroNetworkType";
import MoneroSubaddress from "./model/MoneroSubaddress";
import MoneroVersion from "../daemon/model/MoneroVersion";
import MoneroWallet from "./MoneroWallet";
import MoneroWalletConfig from "./model/MoneroWalletConfig";
import MoneroWalletListener from "./model/MoneroWalletListener";

/**
 * Implements a MoneroWallet which only manages keys using WebAssembly.
 */
export class MoneroWalletKeys extends MoneroWallet {

  // instance variables
  protected cppAddress: string;
  protected module: any;
  protected walletProxy: MoneroWalletKeysProxy;
  
  // --------------------------- STATIC UTILITIES -----------------------------
  
  /**
   * <p>Create a wallet using WebAssembly bindings to monero-project.</p>
   * 
   * <p>Example:</p>
   * 
   * <code>
   * let wallet = await MoneroWalletKeys.createWallet({<br>
   * &nbsp;&nbsp; password: "abc123",<br>
   * &nbsp;&nbsp; networkType: MoneroNetworkType.STAGENET,<br>
   * &nbsp;&nbsp; seed: "coexist igloo pamphlet lagoon..."<br>
   * });
   * </code>
   * 
   * @param {MoneroWalletConfig} config - MoneroWalletConfig or equivalent config object
   * @param {string|number} config.networkType - network type of the wallet to create (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
   * @param {string} [config.seed] - seed of the wallet to create (optional, random wallet created if neither seed nor keys given)
   * @param {string} [config.seedOffset] - the offset used to derive a new seed from the given seed to recover a secret wallet from the seed phrase
   * @param {string} [config.primaryAddress] - primary address of the wallet to create (only provide if restoring from keys)
   * @param {string} [config.privateViewKey] - private view key of the wallet to create (optional)
   * @param {string} [config.privateSpendKey] - private spend key of the wallet to create (optional)
   * @param {string} [config.language] - language of the wallet's seed (defaults to "English" or auto-detected)
   * @return {MoneroWalletKeys} the created wallet
   */
  static async createWallet(config: Partial<MoneroWalletConfig>) {
    
    // normalize and validate config
    if (config === undefined) throw new MoneroError("Must provide config to create wallet");
    config = config instanceof MoneroWalletConfig ? config : new MoneroWalletConfig(config);
    if (config.getSeed() !== undefined && (config.getPrimaryAddress() !== undefined || config.getPrivateViewKey() !== undefined || config.getPrivateSpendKey() !== undefined)) {
      throw new MoneroError("Wallet may be initialized with a seed or keys but not both");
    }
    if (config.getNetworkType() === undefined) throw new MoneroError("Must provide a networkType: 'mainnet', 'testnet' or 'stagenet'");
    if (config.getSaveCurrent() === true) throw new MoneroError("Cannot save current wallet when creating keys-only wallet");

    // initialize proxied wallet if configured
    if (config.getProxyToWorker() === undefined) config.setProxyToWorker(true);
    if (config.getProxyToWorker()) {
      let walletProxy = await MoneroWalletKeysProxy.createWallet(config);;
      return new MoneroWalletKeys(undefined, walletProxy);
    }

    // disallow server connection
    if (config.getServer() !== undefined) throw new MoneroError("Cannot initialize keys wallet with server connection");
    
    // create wallet
    if (config.getSeed() !== undefined) return MoneroWalletKeys.createWalletFromSeed(config);
    else if (config.getPrivateSpendKey() !== undefined || config.getPrimaryAddress() !== undefined) return MoneroWalletKeys.createWalletFromKeys(config);
    else return MoneroWalletKeys.createWalletRandom(config);
  }
  
  protected static async createWalletRandom(config: Partial<MoneroWalletConfig>) {

    // validate and sanitize params
    config = config.copy();
    if (config.getSeedOffset() !== undefined) throw new MoneroError("Cannot provide seedOffset when creating random wallet");
    if (config.getRestoreHeight() !== undefined) throw new MoneroError("Cannot provide restoreHeight when creating random wallet");
    MoneroNetworkType.validate(config.getNetworkType());
    if (config.getLanguage() === undefined) config.setLanguage("English");
    
    // load wasm module
    let module = await LibraryUtils.loadKeysModule();
    
    // queue call to wasm module
    return module.queueTask(async () => {
      return new Promise((resolve, reject) => {
        
        // create wallet in wasm which invokes callback when done
        module.create_keys_wallet_random(JSON.stringify(config.toJson()), (cppAddress) => {
          if (typeof cppAddress === "string") reject(new MoneroError(cppAddress));
          else resolve(new MoneroWalletKeys(cppAddress));
        });
      });
    });
  }
  
  protected static async createWalletFromSeed(config: Partial<MoneroWalletConfig>) {
    
    // validate and sanitize params
    MoneroNetworkType.validate(config.getNetworkType());
    if (config.getSeed() === undefined) throw Error("Must define seed to create wallet from");
    if (config.getSeedOffset() === undefined) config.setSeedOffset("");
    if (config.getLanguage() !== undefined) throw new MoneroError("Cannot provide language when creating wallet from seed");
    
    // load wasm module
    let module = await LibraryUtils.loadKeysModule();
    
    // queue call to wasm module
    return module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // create wallet in wasm which invokes callback when done
        module.create_keys_wallet_from_seed(JSON.stringify(config.toJson()), (cppAddress) => {
          if (typeof cppAddress === "string") reject(new MoneroError(cppAddress));
          else resolve(new MoneroWalletKeys(cppAddress));
        });
      });
    });
  }
  
  protected static async createWalletFromKeys(config: Partial<MoneroWalletConfig>) {
    
    // validate and sanitize params
    if (config.getSeedOffset() !== undefined) throw new MoneroError("Cannot provide seedOffset when creating wallet from keys");
    MoneroNetworkType.validate(config.getNetworkType());
    if (config.getPrimaryAddress() === undefined) config.setPrimaryAddress("");
    if (config.getPrivateViewKey() === undefined) config.setPrivateViewKey("");
    if (config.getPrivateSpendKey() === undefined) config.setPrivateSpendKey("");
    if (config.getLanguage() === undefined) config.setLanguage("English");
    
    // load wasm module
    let module = await LibraryUtils.loadKeysModule();
    
    // queue call to wasm module
    return module.queueTask(async () => {
      return new Promise((resolve, reject) => {
        
        // create wallet in wasm which invokes callback when done
        module.create_keys_wallet_from_keys(JSON.stringify(config.toJson()), (cppAddress) => {
          if (typeof cppAddress === "string") reject(new MoneroError(cppAddress));
          else resolve(new MoneroWalletKeys(cppAddress));
        });
      });
    });
  }
  
  static async getSeedLanguages(): Promise<string[]> {
    let module = await LibraryUtils.loadKeysModule();
    return module.queueTask(async () => {
      return JSON.parse(module.get_keys_wallet_seed_languages()).languages;
    });
  }
  
  // --------------------------- INSTANCE METHODS -----------------------------
  
  /**
   * Internal constructor which is given the memory address of a C++ wallet
   * instance.
   * 
   * This method should not be called externally but should be called through
   * static wallet creation utilities in this class.
   * 
   * @param {number} cppAddress - address of the wallet instance in C++
   * @param {MoneroWalletKeysProxy} walletProxy - proxy
   * 
   * @private
   */
  constructor(cppAddress, walletProxy?: MoneroWalletKeysProxy) {
    super();
    if (!cppAddress && !walletProxy) throw new MoneroError("Must provide cppAddress or walletProxy");
    if (walletProxy) this.walletProxy = walletProxy;
    else {
      this.cppAddress = cppAddress;
      this.module = LibraryUtils.getWasmModule();
      if (!this.module.create_full_wallet) throw new MoneroError("WASM module not loaded - create wallet instance using static utilities");  // static utilites pre-load wasm module
    }
  }
  
  async isViewOnly(): Promise<boolean> {
    if (this.getWalletProxy()) return this.getWalletProxy().isViewOnly();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.is_view_only(this.cppAddress);
    });
  }
  
  async isConnectedToDaemon(): Promise<boolean> {
    if (this.getWalletProxy()) return this.getWalletProxy().isConnectedToDaemon();
    return false;
  }

  async getVersion(): Promise<MoneroVersion> {
    if (this.getWalletProxy()) return this.getWalletProxy().getVersion();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let versionStr = this.module.get_version(this.cppAddress);
      let versionJson = JSON.parse(versionStr);
      return new MoneroVersion(versionJson.number, versionJson.isRelease);
    });
  }
  
  /**
   * @ignore
   */
  getPath(): Promise<string> {
    throw new MoneroError("MoneroWalletKeys does not support a persisted path");
  }
  
  async getSeed(): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().getSeed();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_seed(this.cppAddress);
      const errorStr = "error: ";
      if (resp.indexOf(errorStr) === 0) throw new MoneroError(resp.substring(errorStr.length));
      return resp ? resp : undefined;
    });
  }
  
  async getSeedLanguage(): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().getSeedLanguage();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_seed_language(this.cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new MoneroError(resp.substring(errorKey.length));
      return resp ? resp : undefined;
    });
  }

  async getPrivateSpendKey(): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().getPrivateSpendKey();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_private_spend_key(this.cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new MoneroError(resp.substring(errorKey.length));
      return resp ? resp : undefined;
    });
  }
  
  async getPrivateViewKey(): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().getPrivateViewKey();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_private_view_key(this.cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new MoneroError(resp.substring(errorKey.length));
      return resp ? resp : undefined;
    });
  }
  
  async getPublicViewKey(): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().getPublicViewKey();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_public_view_key(this.cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new MoneroError(resp.substring(errorKey.length));
      return resp ? resp : undefined;
    });
  }
  
  async getPublicSpendKey(): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().getPublicSpendKey();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_public_spend_key(this.cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new MoneroError(resp.substring(errorKey.length));
      return resp ? resp : undefined;
    });
  }
  
  async getAddress(accountIdx: number, subaddressIdx: number): Promise<string> {
    if (this.getWalletProxy()) return this.getWalletProxy().getAddress(accountIdx, subaddressIdx);
    assert(typeof accountIdx === "number");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.get_address(this.cppAddress, accountIdx, subaddressIdx);
    });
  }
  
  async getAddressIndex(address: string): Promise<MoneroSubaddress> {
    if (this.getWalletProxy()) return this.getWalletProxy().getAddressIndex(address);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_address_index(this.cppAddress, address);
      if (resp.charAt(0) !== '{') throw new MoneroError(resp);
      return new MoneroSubaddress(JSON.parse(resp));
    });
  }
  
  async getAccounts(includeSubaddresses?: boolean, tag?: string): Promise<MoneroAccount[]> {
    if (this.getWalletProxy()) return this.getWalletProxy().getAccounts();
    throw new MoneroError("MoneroWalletKeys does not support getting an enumerable set of accounts; query specific accounts");
  }
  
  // getIntegratedAddress(paymentId)  // TODO
  // decodeIntegratedAddress
  
  async close(save = false): Promise<void> {
    if (this._isClosed) return; // no effect if closed
    if (this.getWalletProxy()) {
      await this.getWalletProxy().close(save);
      await super.close();
      this._isClosed = true;
      return;
    }
    
    // save wallet if requested
    if (save) await this.save();

    // close super
    await super.close();
    this._isClosed = true;

    // queue task to use wasm module
    return this.module.queueTask(async () => {
      return new Promise<void>((resolve, reject) => {
        if (this._isClosed) {
          resolve(undefined);
          return;
        }
        
        // close wallet in wasm and invoke callback when done
        this.module.close(this.cppAddress, false, async () => { // saving handled external to webassembly
          delete this.cppAddress;
          this._isClosed = true;
          resolve();
        });
      });
    });
  }
  
  async isClosed(): Promise<boolean> {
    return this._isClosed;
  }
  
  // ----------- ADD JSDOC FOR SUPPORTED DEFAULT IMPLEMENTATIONS --------------
  
  async getPrimaryAddress(): Promise<string> { return super.getPrimaryAddress(); }
  async getSubaddress(accountIdx: number, subaddressIdx: number): Promise<MoneroSubaddress> { return super.getSubaddress(accountIdx, subaddressIdx); }
  
  // ----------------------------- PRIVATE HELPERS ----------------------------

  static sanitizeSubaddress(subaddress) {
    if (subaddress.getLabel() === "") subaddress.setLabel(undefined);
    return subaddress
  }
  
  protected assertNotClosed() {
    if (this._isClosed) throw new MoneroError("Wallet is closed");
  }

  protected getWalletProxy(): MoneroWalletKeysProxy {
    this.assertNotClosed();
    return this.walletProxy;
  }
}

/**
 * Implements a MoneroWallet by proxying requests to a worker which runs a keys-only wallet.
 * 
 * TODO: sort these methods according to master sort in MoneroWallet.ts
 * TODO: probably only allow one listener to worker then propogate to registered listeners for performance
 * 
 * @private
 */
export class MoneroWalletKeysProxy extends MoneroWallet {

  // state variables
  protected walletId: string;
  protected worker: Worker;
  
  // -------------------------- WALLET STATIC UTILS ---------------------------
  
  static async createWallet(config) {
    let walletId = GenUtils.getUUID();
    await LibraryUtils.invokeWorker(walletId, "createWalletKeys", [config.toJson()]);
    return new MoneroWalletKeysProxy(walletId, await LibraryUtils.getWorker());
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
   * 
   * @protected
   */
  constructor(walletId, worker) {
    super();
    this.walletId = walletId;
    this.worker = worker;
  }
  
  async isViewOnly(): Promise<boolean> {
    return this.invokeWorker("isViewOnly");
  }

  async getVersion(): Promise<MoneroVersion> {
    throw new MoneroError("Not implemented");
  }

  async getSeed() {
    return this.invokeWorker("getSeed") as Promise<string>;
  }
  
  async getSeedLanguage() {
    return this.invokeWorker("getSeedLanguage") as Promise<string>;
  }
  
  async getSeedLanguages() {
    return this.invokeWorker("getSeedLanguages");
  }
  
  async getPrivateSpendKey() {
    return this.invokeWorker("getPrivateSpendKey") as Promise<string>;
  }
  
  async getPrivateViewKey() {
    return this.invokeWorker("getPrivateViewKey") as Promise<string>;
  }
  
  async getPublicViewKey() {
    return this.invokeWorker("getPublicViewKey") as Promise<string>;
  }
  
  async getPublicSpendKey() {
    return this.invokeWorker("getPublicSpendKey") as Promise<string>;
  }
  
  async getAddress(accountIdx, subaddressIdx) {
    return this.invokeWorker("getAddress", Array.from(arguments)) as Promise<string>;
  }

  async getAddressIndex(address) {
    let subaddressJson = await this.invokeWorker("getAddressIndex", Array.from(arguments));
    return MoneroWalletKeys.sanitizeSubaddress(new MoneroSubaddress(subaddressJson));
  }

  async getIntegratedAddress(standardAddress, paymentId) {
    return new MoneroIntegratedAddress(await this.invokeWorker("getIntegratedAddress", Array.from(arguments)));
  }
  
  async decodeIntegratedAddress(integratedAddress) {
    return new MoneroIntegratedAddress(await this.invokeWorker("decodeIntegratedAddress", Array.from(arguments)));
  }

  async close(save) {
    await this.invokeWorker("close", Array.from(arguments));
    LibraryUtils.removeWorkerObject(this.walletId);
  }
  
  async isClosed() {
    return this.invokeWorker("isClosed");
  }

  protected async invokeWorker(fnName: string, args?: any): Promise<any> {
    return await LibraryUtils.invokeWorker(this.walletId, fnName, args);
  }
}
