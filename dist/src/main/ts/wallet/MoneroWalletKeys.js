"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.MoneroWalletKeysProxy = exports.MoneroWalletKeys = void 0;var _assert = _interopRequireDefault(require("assert"));
var _GenUtils = _interopRequireDefault(require("../common/GenUtils"));
var _LibraryUtils = _interopRequireDefault(require("../common/LibraryUtils"));

var _MoneroError = _interopRequireDefault(require("../common/MoneroError"));
var _MoneroIntegratedAddress = _interopRequireDefault(require("./model/MoneroIntegratedAddress"));
var _MoneroNetworkType = _interopRequireDefault(require("../daemon/model/MoneroNetworkType"));
var _MoneroSubaddress = _interopRequireDefault(require("./model/MoneroSubaddress"));
var _MoneroVersion = _interopRequireDefault(require("../daemon/model/MoneroVersion"));
var _MoneroWallet = _interopRequireDefault(require("./MoneroWallet"));
var _MoneroWalletConfig = _interopRequireDefault(require("./model/MoneroWalletConfig"));


/**
 * Implements a MoneroWallet which only manages keys using WebAssembly.
 */
class MoneroWalletKeys extends _MoneroWallet.default {

  // instance variables




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
  static async createWallet(config) {

    // normalize and validate config
    if (config === undefined) throw new _MoneroError.default("Must provide config to create wallet");
    config = config instanceof _MoneroWalletConfig.default ? config : new _MoneroWalletConfig.default(config);
    if (config.getSeed() !== undefined && (config.getPrimaryAddress() !== undefined || config.getPrivateViewKey() !== undefined || config.getPrivateSpendKey() !== undefined)) {
      throw new _MoneroError.default("Wallet may be initialized with a seed or keys but not both");
    }
    if (config.getNetworkType() === undefined) throw new _MoneroError.default("Must provide a networkType: 'mainnet', 'testnet' or 'stagenet'");
    if (config.getSaveCurrent() === true) throw new _MoneroError.default("Cannot save current wallet when creating keys-only wallet");

    // initialize proxied wallet if configured
    if (config.getProxyToWorker() === undefined) config.setProxyToWorker(true);
    if (config.getProxyToWorker()) {
      let walletProxy = await MoneroWalletKeysProxy.createWallet(config);;
      return new MoneroWalletKeys(undefined, walletProxy);
    }

    // disallow server connection
    if (config.getServer() !== undefined) throw new _MoneroError.default("Cannot initialize keys wallet with server connection");

    // create wallet
    if (config.getSeed() !== undefined) return MoneroWalletKeys.createWalletFromSeed(config);else
    if (config.getPrivateSpendKey() !== undefined || config.getPrimaryAddress() !== undefined) return MoneroWalletKeys.createWalletFromKeys(config);else
    return MoneroWalletKeys.createWalletRandom(config);
  }

  static async createWalletRandom(config) {

    // validate and sanitize params
    config = config.copy();
    if (config.getSeedOffset() !== undefined) throw new _MoneroError.default("Cannot provide seedOffset when creating random wallet");
    if (config.getRestoreHeight() !== undefined) throw new _MoneroError.default("Cannot provide restoreHeight when creating random wallet");
    _MoneroNetworkType.default.validate(config.getNetworkType());
    if (config.getLanguage() === undefined) config.setLanguage("English");

    // load wasm module
    let module = await _LibraryUtils.default.loadWasmModule();

    // queue call to wasm module
    return module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // create wallet in wasm which invokes callback when done
        module.create_keys_wallet_random(JSON.stringify(config.toJson()), (cppAddress) => {
          if (typeof cppAddress === "string") reject(new _MoneroError.default(cppAddress));else
          resolve(new MoneroWalletKeys(cppAddress));
        });
      });
    });
  }

  static async createWalletFromSeed(config) {

    // validate and sanitize params
    _MoneroNetworkType.default.validate(config.getNetworkType());
    if (config.getSeed() === undefined) throw Error("Must define seed to create wallet from");
    if (config.getSeedOffset() === undefined) config.setSeedOffset("");
    if (config.getLanguage() !== undefined) throw new _MoneroError.default("Cannot provide language when creating wallet from seed");

    // load wasm module
    let module = await _LibraryUtils.default.loadWasmModule();

    // queue call to wasm module
    return module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // create wallet in wasm which invokes callback when done
        module.create_keys_wallet_from_seed(JSON.stringify(config.toJson()), (cppAddress) => {
          if (typeof cppAddress === "string") reject(new _MoneroError.default(cppAddress));else
          resolve(new MoneroWalletKeys(cppAddress));
        });
      });
    });
  }

  static async createWalletFromKeys(config) {

    // validate and sanitize params
    if (config.getSeedOffset() !== undefined) throw new _MoneroError.default("Cannot provide seedOffset when creating wallet from keys");
    _MoneroNetworkType.default.validate(config.getNetworkType());
    if (config.getPrimaryAddress() === undefined) config.setPrimaryAddress("");
    if (config.getPrivateViewKey() === undefined) config.setPrivateViewKey("");
    if (config.getPrivateSpendKey() === undefined) config.setPrivateSpendKey("");
    if (config.getLanguage() === undefined) config.setLanguage("English");

    // load wasm module
    let module = await _LibraryUtils.default.loadWasmModule();

    // queue call to wasm module
    return module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // create wallet in wasm which invokes callback when done
        module.create_keys_wallet_from_keys(JSON.stringify(config.toJson()), (cppAddress) => {
          if (typeof cppAddress === "string") reject(new _MoneroError.default(cppAddress));else
          resolve(new MoneroWalletKeys(cppAddress));
        });
      });
    });
  }

  static async getSeedLanguages() {
    let module = await _LibraryUtils.default.loadWasmModule();
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
  constructor(cppAddress, walletProxy) {
    super();
    if (!cppAddress && !walletProxy) throw new _MoneroError.default("Must provide cppAddress or walletProxy");
    if (walletProxy) this.walletProxy = walletProxy;else
    {
      this.cppAddress = cppAddress;
      this.module = _LibraryUtils.default.getWasmModule();
      if (!this.module.create_full_wallet) throw new _MoneroError.default("WASM module not loaded - create wallet instance using static utilities"); // static utilites pre-load wasm module
    }
  }

  async isViewOnly() {
    if (this.getWalletProxy()) return this.getWalletProxy().isViewOnly();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.is_view_only(this.cppAddress);
    });
  }

  async isConnectedToDaemon() {
    if (this.getWalletProxy()) return this.getWalletProxy().isConnectedToDaemon();
    return false;
  }

  async getVersion() {
    if (this.getWalletProxy()) return this.getWalletProxy().getVersion();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let versionStr = this.module.get_version(this.cppAddress);
      let versionJson = JSON.parse(versionStr);
      return new _MoneroVersion.default(versionJson.number, versionJson.isRelease);
    });
  }

  /**
   * @ignore
   */
  getPath() {
    throw new _MoneroError.default("MoneroWalletKeys does not support a persisted path");
  }

  async getSeed() {
    if (this.getWalletProxy()) return this.getWalletProxy().getSeed();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_seed(this.cppAddress);
      const errorStr = "error: ";
      if (resp.indexOf(errorStr) === 0) throw new _MoneroError.default(resp.substring(errorStr.length));
      return resp ? resp : undefined;
    });
  }

  async getSeedLanguage() {
    if (this.getWalletProxy()) return this.getWalletProxy().getSeedLanguage();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_seed_language(this.cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new _MoneroError.default(resp.substring(errorKey.length));
      return resp ? resp : undefined;
    });
  }

  async getPrivateSpendKey() {
    if (this.getWalletProxy()) return this.getWalletProxy().getPrivateSpendKey();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_private_spend_key(this.cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new _MoneroError.default(resp.substring(errorKey.length));
      return resp ? resp : undefined;
    });
  }

  async getPrivateViewKey() {
    if (this.getWalletProxy()) return this.getWalletProxy().getPrivateViewKey();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_private_view_key(this.cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new _MoneroError.default(resp.substring(errorKey.length));
      return resp ? resp : undefined;
    });
  }

  async getPublicViewKey() {
    if (this.getWalletProxy()) return this.getWalletProxy().getPublicViewKey();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_public_view_key(this.cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new _MoneroError.default(resp.substring(errorKey.length));
      return resp ? resp : undefined;
    });
  }

  async getPublicSpendKey() {
    if (this.getWalletProxy()) return this.getWalletProxy().getPublicSpendKey();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_public_spend_key(this.cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new _MoneroError.default(resp.substring(errorKey.length));
      return resp ? resp : undefined;
    });
  }

  async getAddress(accountIdx, subaddressIdx) {
    if (this.getWalletProxy()) return this.getWalletProxy().getAddress(accountIdx, subaddressIdx);
    (0, _assert.default)(typeof accountIdx === "number");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.get_address(this.cppAddress, accountIdx, subaddressIdx);
    });
  }

  async getAddressIndex(address) {
    if (this.getWalletProxy()) return this.getWalletProxy().getAddressIndex(address);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_address_index(this.cppAddress, address);
      if (resp.charAt(0) !== '{') throw new _MoneroError.default(resp);
      return new _MoneroSubaddress.default(JSON.parse(resp));
    });
  }

  async getAccounts(includeSubaddresses, tag) {
    if (this.getWalletProxy()) return this.getWalletProxy().getAccounts();
    throw new _MoneroError.default("MoneroWalletKeys does not support getting an enumerable set of accounts; query specific accounts");
  }

  // getIntegratedAddress(paymentId)  // TODO
  // decodeIntegratedAddress

  async close(save = false) {
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
      return new Promise((resolve, reject) => {
        if (this._isClosed) {
          resolve(undefined);
          return;
        }

        // close wallet in wasm and invoke callback when done
        this.module.close(this.cppAddress, false, async () => {// saving handled external to webassembly
          delete this.cppAddress;
          this._isClosed = true;
          resolve();
        });
      });
    });
  }

  async isClosed() {
    return this._isClosed;
  }

  // ----------- ADD JSDOC FOR SUPPORTED DEFAULT IMPLEMENTATIONS --------------

  async getPrimaryAddress() {return super.getPrimaryAddress();}
  async getSubaddress(accountIdx, subaddressIdx) {return super.getSubaddress(accountIdx, subaddressIdx);}

  // ----------------------------- PRIVATE HELPERS ----------------------------

  static sanitizeSubaddress(subaddress) {
    if (subaddress.getLabel() === "") subaddress.setLabel(undefined);
    return subaddress;
  }

  assertNotClosed() {
    if (this._isClosed) throw new _MoneroError.default("Wallet is closed");
  }

  getWalletProxy() {
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
 */exports.MoneroWalletKeys = MoneroWalletKeys;
class MoneroWalletKeysProxy extends _MoneroWallet.default {

  // state variables



  // -------------------------- WALLET STATIC UTILS ---------------------------

  static async createWallet(config) {
    let walletId = _GenUtils.default.getUUID();
    await _LibraryUtils.default.invokeWorker(walletId, "createWalletKeys", [config.toJson()]);
    return new MoneroWalletKeysProxy(walletId, await _LibraryUtils.default.getWorker());
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

  async isViewOnly() {
    return this.invokeWorker("isViewOnly");
  }

  async getVersion() {
    throw new _MoneroError.default("Not implemented");
  }

  async getSeed() {
    return this.invokeWorker("getSeed");
  }

  async getSeedLanguage() {
    return this.invokeWorker("getSeedLanguage");
  }

  async getSeedLanguages() {
    return this.invokeWorker("getSeedLanguages");
  }

  async getPrivateSpendKey() {
    return this.invokeWorker("getPrivateSpendKey");
  }

  async getPrivateViewKey() {
    return this.invokeWorker("getPrivateViewKey");
  }

  async getPublicViewKey() {
    return this.invokeWorker("getPublicViewKey");
  }

  async getPublicSpendKey() {
    return this.invokeWorker("getPublicSpendKey");
  }

  async getAddress(accountIdx, subaddressIdx) {
    return this.invokeWorker("getAddress", Array.from(arguments));
  }

  async getAddressIndex(address) {
    let subaddressJson = await this.invokeWorker("getAddressIndex", Array.from(arguments));
    return MoneroWalletKeys.sanitizeSubaddress(new _MoneroSubaddress.default(subaddressJson));
  }

  async getIntegratedAddress(standardAddress, paymentId) {
    return new _MoneroIntegratedAddress.default(await this.invokeWorker("getIntegratedAddress", Array.from(arguments)));
  }

  async decodeIntegratedAddress(integratedAddress) {
    return new _MoneroIntegratedAddress.default(await this.invokeWorker("decodeIntegratedAddress", Array.from(arguments)));
  }

  async close(save) {
    await this.invokeWorker("close", Array.from(arguments));
    _LibraryUtils.default.removeWorkerObject(this.walletId);
  }

  async isClosed() {
    return this.invokeWorker("isClosed");
  }

  async invokeWorker(fnName, args) {
    return await _LibraryUtils.default.invokeWorker(this.walletId, fnName, args);
  }
}exports.MoneroWalletKeysProxy = MoneroWalletKeysProxy;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwiX01vbmVyb05ldHdvcmtUeXBlIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiTW9uZXJvV2FsbGV0S2V5cyIsIk1vbmVyb1dhbGxldCIsImNyZWF0ZVdhbGxldCIsImNvbmZpZyIsInVuZGVmaW5lZCIsIk1vbmVyb0Vycm9yIiwiTW9uZXJvV2FsbGV0Q29uZmlnIiwiZ2V0U2VlZCIsImdldFByaW1hcnlBZGRyZXNzIiwiZ2V0UHJpdmF0ZVZpZXdLZXkiLCJnZXRQcml2YXRlU3BlbmRLZXkiLCJnZXROZXR3b3JrVHlwZSIsImdldFNhdmVDdXJyZW50IiwiZ2V0UHJveHlUb1dvcmtlciIsInNldFByb3h5VG9Xb3JrZXIiLCJ3YWxsZXRQcm94eSIsIk1vbmVyb1dhbGxldEtleXNQcm94eSIsImdldFNlcnZlciIsImNyZWF0ZVdhbGxldEZyb21TZWVkIiwiY3JlYXRlV2FsbGV0RnJvbUtleXMiLCJjcmVhdGVXYWxsZXRSYW5kb20iLCJjb3B5IiwiZ2V0U2VlZE9mZnNldCIsImdldFJlc3RvcmVIZWlnaHQiLCJNb25lcm9OZXR3b3JrVHlwZSIsInZhbGlkYXRlIiwiZ2V0TGFuZ3VhZ2UiLCJzZXRMYW5ndWFnZSIsIm1vZHVsZSIsIkxpYnJhcnlVdGlscyIsImxvYWRXYXNtTW9kdWxlIiwicXVldWVUYXNrIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJjcmVhdGVfa2V5c193YWxsZXRfcmFuZG9tIiwiSlNPTiIsInN0cmluZ2lmeSIsInRvSnNvbiIsImNwcEFkZHJlc3MiLCJFcnJvciIsInNldFNlZWRPZmZzZXQiLCJjcmVhdGVfa2V5c193YWxsZXRfZnJvbV9zZWVkIiwic2V0UHJpbWFyeUFkZHJlc3MiLCJzZXRQcml2YXRlVmlld0tleSIsInNldFByaXZhdGVTcGVuZEtleSIsImNyZWF0ZV9rZXlzX3dhbGxldF9mcm9tX2tleXMiLCJnZXRTZWVkTGFuZ3VhZ2VzIiwicGFyc2UiLCJnZXRfa2V5c193YWxsZXRfc2VlZF9sYW5ndWFnZXMiLCJsYW5ndWFnZXMiLCJjb25zdHJ1Y3RvciIsImdldFdhc21Nb2R1bGUiLCJjcmVhdGVfZnVsbF93YWxsZXQiLCJpc1ZpZXdPbmx5IiwiZ2V0V2FsbGV0UHJveHkiLCJhc3NlcnROb3RDbG9zZWQiLCJpc192aWV3X29ubHkiLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiZ2V0VmVyc2lvbiIsInZlcnNpb25TdHIiLCJnZXRfdmVyc2lvbiIsInZlcnNpb25Kc29uIiwiTW9uZXJvVmVyc2lvbiIsIm51bWJlciIsImlzUmVsZWFzZSIsImdldFBhdGgiLCJyZXNwIiwiZ2V0X3NlZWQiLCJlcnJvclN0ciIsImluZGV4T2YiLCJzdWJzdHJpbmciLCJsZW5ndGgiLCJnZXRTZWVkTGFuZ3VhZ2UiLCJnZXRfc2VlZF9sYW5ndWFnZSIsImVycm9yS2V5IiwiZ2V0X3ByaXZhdGVfc3BlbmRfa2V5IiwiZ2V0X3ByaXZhdGVfdmlld19rZXkiLCJnZXRQdWJsaWNWaWV3S2V5IiwiZ2V0X3B1YmxpY192aWV3X2tleSIsImdldFB1YmxpY1NwZW5kS2V5IiwiZ2V0X3B1YmxpY19zcGVuZF9rZXkiLCJnZXRBZGRyZXNzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJhc3NlcnQiLCJnZXRfYWRkcmVzcyIsImdldEFkZHJlc3NJbmRleCIsImFkZHJlc3MiLCJnZXRfYWRkcmVzc19pbmRleCIsImNoYXJBdCIsIk1vbmVyb1N1YmFkZHJlc3MiLCJnZXRBY2NvdW50cyIsImluY2x1ZGVTdWJhZGRyZXNzZXMiLCJ0YWciLCJjbG9zZSIsInNhdmUiLCJfaXNDbG9zZWQiLCJpc0Nsb3NlZCIsImdldFN1YmFkZHJlc3MiLCJzYW5pdGl6ZVN1YmFkZHJlc3MiLCJzdWJhZGRyZXNzIiwiZ2V0TGFiZWwiLCJzZXRMYWJlbCIsImV4cG9ydHMiLCJ3YWxsZXRJZCIsIkdlblV0aWxzIiwiZ2V0VVVJRCIsImludm9rZVdvcmtlciIsImdldFdvcmtlciIsIndvcmtlciIsIkFycmF5IiwiZnJvbSIsImFyZ3VtZW50cyIsInN1YmFkZHJlc3NKc29uIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsImRlY29kZUludGVncmF0ZWRBZGRyZXNzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJyZW1vdmVXb3JrZXJPYmplY3QiLCJmbk5hbWUiLCJhcmdzIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldEtleXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBNb25lcm9TdWJhZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb1N1YmFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvV2FsbGV0IHdoaWNoIG9ubHkgbWFuYWdlcyBrZXlzIHVzaW5nIFdlYkFzc2VtYmx5LlxuICovXG5leHBvcnQgY2xhc3MgTW9uZXJvV2FsbGV0S2V5cyBleHRlbmRzIE1vbmVyb1dhbGxldCB7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjcHBBZGRyZXNzOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBtb2R1bGU6IGFueTtcbiAgcHJvdGVjdGVkIHdhbGxldFByb3h5OiBNb25lcm9XYWxsZXRLZXlzUHJveHk7XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIFVUSUxJVElFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIDxwPkNyZWF0ZSBhIHdhbGxldCB1c2luZyBXZWJBc3NlbWJseSBiaW5kaW5ncyB0byBtb25lcm8tcHJvamVjdC48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlOjwvcD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiBsZXQgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0S2V5cy5jcmVhdGVXYWxsZXQoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImFiYzEyM1wiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IG5ldHdvcmtUeXBlOiBNb25lcm9OZXR3b3JrVHlwZS5TVEFHRU5FVCw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBzZWVkOiBcImNvZXhpc3QgaWdsb28gcGFtcGhsZXQgbGFnb29uLi4uXCI8YnI+XG4gICAqIH0pO1xuICAgKiA8L2NvZGU+XG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldENvbmZpZ30gY29uZmlnIC0gTW9uZXJvV2FsbGV0Q29uZmlnIG9yIGVxdWl2YWxlbnQgY29uZmlnIG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGNvbmZpZy5uZXR3b3JrVHlwZSAtIG5ldHdvcmsgdHlwZSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob25lIG9mIFwibWFpbm5ldFwiLCBcInRlc3RuZXRcIiwgXCJzdGFnZW5ldFwiIG9yIE1vbmVyb05ldHdvcmtUeXBlLk1BSU5ORVR8VEVTVE5FVHxTVEFHRU5FVClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZF0gLSBzZWVkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgcmFuZG9tIHdhbGxldCBjcmVhdGVkIGlmIG5laXRoZXIgc2VlZCBub3Iga2V5cyBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZE9mZnNldF0gLSB0aGUgb2Zmc2V0IHVzZWQgdG8gZGVyaXZlIGEgbmV3IHNlZWQgZnJvbSB0aGUgZ2l2ZW4gc2VlZCB0byByZWNvdmVyIGEgc2VjcmV0IHdhbGxldCBmcm9tIHRoZSBzZWVkIHBocmFzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcmltYXJ5QWRkcmVzc10gLSBwcmltYXJ5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9ubHkgcHJvdmlkZSBpZiByZXN0b3JpbmcgZnJvbSBrZXlzKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlVmlld0tleV0gLSBwcml2YXRlIHZpZXcga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVNwZW5kS2V5XSAtIHByaXZhdGUgc3BlbmQga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcubGFuZ3VhZ2VdIC0gbGFuZ3VhZ2Ugb2YgdGhlIHdhbGxldCdzIHNlZWQgKGRlZmF1bHRzIHRvIFwiRW5nbGlzaFwiIG9yIGF1dG8tZGV0ZWN0ZWQpXG4gICAqIEByZXR1cm4ge01vbmVyb1dhbGxldEtleXN9IHRoZSBjcmVhdGVkIHdhbGxldFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPikge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgY29uZmlnIHRvIGNyZWF0ZSB3YWxsZXRcIik7XG4gICAgY29uZmlnID0gY29uZmlnIGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0Q29uZmlnID8gY29uZmlnIDogbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQgJiYgKGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBtYXkgYmUgaW5pdGlhbGl6ZWQgd2l0aCBhIHNlZWQgb3Iga2V5cyBidXQgbm90IGJvdGhcIik7XG4gICAgfVxuICAgIGlmIChjb25maWcuZ2V0TmV0d29ya1R5cGUoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYSBuZXR3b3JrVHlwZTogJ21haW5uZXQnLCAndGVzdG5ldCcgb3IgJ3N0YWdlbmV0J1wiKTtcbiAgICBpZiAoY29uZmlnLmdldFNhdmVDdXJyZW50KCkgPT09IHRydWUpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIGN1cnJlbnQgd2FsbGV0IHdoZW4gY3JlYXRpbmcga2V5cy1vbmx5IHdhbGxldFwiKTtcblxuICAgIC8vIGluaXRpYWxpemUgcHJveGllZCB3YWxsZXQgaWYgY29uZmlndXJlZFxuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKHRydWUpO1xuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpKSB7XG4gICAgICBsZXQgd2FsbGV0UHJveHkgPSBhd2FpdCBNb25lcm9XYWxsZXRLZXlzUHJveHkuY3JlYXRlV2FsbGV0KGNvbmZpZyk7O1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9XYWxsZXRLZXlzKHVuZGVmaW5lZCwgd2FsbGV0UHJveHkpO1xuICAgIH1cblxuICAgIC8vIGRpc2FsbG93IHNlcnZlciBjb25uZWN0aW9uXG4gICAgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgaW5pdGlhbGl6ZSBrZXlzIHdhbGxldCB3aXRoIHNlcnZlciBjb25uZWN0aW9uXCIpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gTW9uZXJvV2FsbGV0S2V5cy5jcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWcpO1xuICAgIGVsc2UgaWYgKGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQpIHJldHVybiBNb25lcm9XYWxsZXRLZXlzLmNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZyk7XG4gICAgZWxzZSByZXR1cm4gTW9uZXJvV2FsbGV0S2V5cy5jcmVhdGVXYWxsZXRSYW5kb20oY29uZmlnKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRSYW5kb20oY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcblxuICAgIC8vIHZhbGlkYXRlIGFuZCBzYW5pdGl6ZSBwYXJhbXNcbiAgICBjb25maWcgPSBjb25maWcuY29weSgpO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHJlc3RvcmVIZWlnaHQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgIE1vbmVyb05ldHdvcmtUeXBlLnZhbGlkYXRlKGNvbmZpZy5nZXROZXR3b3JrVHlwZSgpKTtcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldExhbmd1YWdlKFwiRW5nbGlzaFwiKTtcbiAgICBcbiAgICAvLyBsb2FkIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIHF1ZXVlIGNhbGwgdG8gd2FzbSBtb2R1bGVcbiAgICByZXR1cm4gbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfa2V5c193YWxsZXRfcmFuZG9tKEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSksIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEtleXMoY3BwQWRkcmVzcykpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIHNhbml0aXplIHBhcmFtc1xuICAgIE1vbmVyb05ldHdvcmtUeXBlLnZhbGlkYXRlKGNvbmZpZy5nZXROZXR3b3JrVHlwZSgpKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWQoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBFcnJvcihcIk11c3QgZGVmaW5lIHNlZWQgdG8gY3JlYXRlIHdhbGxldCBmcm9tXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRTZWVkT2Zmc2V0KFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBsYW5ndWFnZSB3aGVuIGNyZWF0aW5nIHdhbGxldCBmcm9tIHNlZWRcIik7XG4gICAgXG4gICAgLy8gbG9hZCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyBxdWV1ZSBjYWxsIHRvIHdhc20gbW9kdWxlXG4gICAgcmV0dXJuIG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLmNyZWF0ZV9rZXlzX3dhbGxldF9mcm9tX3NlZWQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0S2V5cyhjcHBBZGRyZXNzKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbUtleXMoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgc2FuaXRpemUgcGFyYW1zXG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHdhbGxldCBmcm9tIGtleXNcIik7XG4gICAgTW9uZXJvTmV0d29ya1R5cGUudmFsaWRhdGUoY29uZmlnLmdldE5ldHdvcmtUeXBlKCkpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpbWFyeUFkZHJlc3MoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcml2YXRlVmlld0tleShcIlwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcml2YXRlU3BlbmRLZXkoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShcIkVuZ2xpc2hcIik7XG4gICAgXG4gICAgLy8gbG9hZCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyBxdWV1ZSBjYWxsIHRvIHdhc20gbW9kdWxlXG4gICAgcmV0dXJuIG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUuY3JlYXRlX2tleXNfd2FsbGV0X2Zyb21fa2V5cyhKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpLCAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRLZXlzKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIGdldFNlZWRMYW5ndWFnZXMoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICByZXR1cm4gbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShtb2R1bGUuZ2V0X2tleXNfd2FsbGV0X3NlZWRfbGFuZ3VhZ2VzKCkpLmxhbmd1YWdlcztcbiAgICB9KTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIElOU1RBTkNFIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBjb25zdHJ1Y3RvciB3aGljaCBpcyBnaXZlbiB0aGUgbWVtb3J5IGFkZHJlc3Mgb2YgYSBDKysgd2FsbGV0XG4gICAqIGluc3RhbmNlLlxuICAgKiBcbiAgICogVGhpcyBtZXRob2Qgc2hvdWxkIG5vdCBiZSBjYWxsZWQgZXh0ZXJuYWxseSBidXQgc2hvdWxkIGJlIGNhbGxlZCB0aHJvdWdoXG4gICAqIHN0YXRpYyB3YWxsZXQgY3JlYXRpb24gdXRpbGl0aWVzIGluIHRoaXMgY2xhc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gY3BwQWRkcmVzcyAtIGFkZHJlc3Mgb2YgdGhlIHdhbGxldCBpbnN0YW5jZSBpbiBDKytcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRLZXlzUHJveHl9IHdhbGxldFByb3h5IC0gcHJveHlcbiAgICogXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjcHBBZGRyZXNzLCB3YWxsZXRQcm94eT86IE1vbmVyb1dhbGxldEtleXNQcm94eSkge1xuICAgIHN1cGVyKCk7XG4gICAgaWYgKCFjcHBBZGRyZXNzICYmICF3YWxsZXRQcm94eSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGNwcEFkZHJlc3Mgb3Igd2FsbGV0UHJveHlcIik7XG4gICAgaWYgKHdhbGxldFByb3h5KSB0aGlzLndhbGxldFByb3h5ID0gd2FsbGV0UHJveHk7XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmNwcEFkZHJlc3MgPSBjcHBBZGRyZXNzO1xuICAgICAgdGhpcy5tb2R1bGUgPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpO1xuICAgICAgaWYgKCF0aGlzLm1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldBU00gbW9kdWxlIG5vdCBsb2FkZWQgLSBjcmVhdGUgd2FsbGV0IGluc3RhbmNlIHVzaW5nIHN0YXRpYyB1dGlsaXRpZXNcIik7ICAvLyBzdGF0aWMgdXRpbGl0ZXMgcHJlLWxvYWQgd2FzbSBtb2R1bGVcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGlzVmlld09ubHkoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc1ZpZXdPbmx5KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmlzX3ZpZXdfb25seSh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZFRvRGFlbW9uKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNDb25uZWN0ZWRUb0RhZW1vbigpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGFzeW5jIGdldFZlcnNpb24oKTogUHJvbWlzZTxNb25lcm9WZXJzaW9uPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRWZXJzaW9uKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHZlcnNpb25TdHIgPSB0aGlzLm1vZHVsZS5nZXRfdmVyc2lvbih0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgbGV0IHZlcnNpb25Kc29uID0gSlNPTi5wYXJzZSh2ZXJzaW9uU3RyKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvVmVyc2lvbih2ZXJzaW9uSnNvbi5udW1iZXIsIHZlcnNpb25Kc29uLmlzUmVsZWFzZSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBnZXRQYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0S2V5cyBkb2VzIG5vdCBzdXBwb3J0IGEgcGVyc2lzdGVkIHBhdGhcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNlZWQoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFNlZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzcCA9IHRoaXMubW9kdWxlLmdldF9zZWVkKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICBjb25zdCBlcnJvclN0ciA9IFwiZXJyb3I6IFwiO1xuICAgICAgaWYgKHJlc3AuaW5kZXhPZihlcnJvclN0cikgPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXNwLnN1YnN0cmluZyhlcnJvclN0ci5sZW5ndGgpKTtcbiAgICAgIHJldHVybiByZXNwID8gcmVzcCA6IHVuZGVmaW5lZDtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZExhbmd1YWdlKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRTZWVkTGFuZ3VhZ2UoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzcCA9IHRoaXMubW9kdWxlLmdldF9zZWVkX2xhbmd1YWdlKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcC5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSk7XG4gICAgICByZXR1cm4gcmVzcCA/IHJlc3AgOiB1bmRlZmluZWQ7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBnZXRQcml2YXRlU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFByaXZhdGVTcGVuZEtleSgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCByZXNwID0gdGhpcy5tb2R1bGUuZ2V0X3ByaXZhdGVfc3BlbmRfa2V5KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcC5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSk7XG4gICAgICByZXR1cm4gcmVzcCA/IHJlc3AgOiB1bmRlZmluZWQ7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFByaXZhdGVWaWV3S2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRQcml2YXRlVmlld0tleSgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCByZXNwID0gdGhpcy5tb2R1bGUuZ2V0X3ByaXZhdGVfdmlld19rZXkodGhpcy5jcHBBZGRyZXNzKTtcbiAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgaWYgKHJlc3AuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXNwLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKTtcbiAgICAgIHJldHVybiByZXNwID8gcmVzcCA6IHVuZGVmaW5lZDtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHVibGljVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UHVibGljVmlld0tleSgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCByZXNwID0gdGhpcy5tb2R1bGUuZ2V0X3B1YmxpY192aWV3X2tleSh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICBpZiAocmVzcC5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpO1xuICAgICAgcmV0dXJuIHJlc3AgPyByZXNwIDogdW5kZWZpbmVkO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRQdWJsaWNTcGVuZEtleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UHVibGljU3BlbmRLZXkoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzcCA9IHRoaXMubW9kdWxlLmdldF9wdWJsaWNfc3BlbmRfa2V5KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcC5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSk7XG4gICAgICByZXR1cm4gcmVzcCA/IHJlc3AgOiB1bmRlZmluZWQ7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWRkcmVzcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICBhc3NlcnQodHlwZW9mIGFjY291bnRJZHggPT09IFwibnVtYmVyXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5nZXRfYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzSW5kZXgoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBZGRyZXNzSW5kZXgoYWRkcmVzcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHJlc3AgPSB0aGlzLm1vZHVsZS5nZXRfYWRkcmVzc19pbmRleCh0aGlzLmNwcEFkZHJlc3MsIGFkZHJlc3MpO1xuICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSAneycpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXNwKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvU3ViYWRkcmVzcyhKU09OLnBhcnNlKHJlc3ApKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHRhZz86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBY2NvdW50cygpO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb1dhbGxldEtleXMgZG9lcyBub3Qgc3VwcG9ydCBnZXR0aW5nIGFuIGVudW1lcmFibGUgc2V0IG9mIGFjY291bnRzOyBxdWVyeSBzcGVjaWZpYyBhY2NvdW50c1wiKTtcbiAgfVxuICBcbiAgLy8gZ2V0SW50ZWdyYXRlZEFkZHJlc3MocGF5bWVudElkKSAgLy8gVE9ET1xuICAvLyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzc1xuICBcbiAgYXN5bmMgY2xvc2Uoc2F2ZSA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuX2lzQ2xvc2VkKSByZXR1cm47IC8vIG5vIGVmZmVjdCBpZiBjbG9zZWRcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFdhbGxldFByb3h5KCkuY2xvc2Uoc2F2ZSk7XG4gICAgICBhd2FpdCBzdXBlci5jbG9zZSgpO1xuICAgICAgdGhpcy5faXNDbG9zZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICAvLyBzYXZlIHdhbGxldCBpZiByZXF1ZXN0ZWRcbiAgICBpZiAoc2F2ZSkgYXdhaXQgdGhpcy5zYXZlKCk7XG5cbiAgICAvLyBjbG9zZSBzdXBlclxuICAgIGF3YWl0IHN1cGVyLmNsb3NlKCk7XG4gICAgdGhpcy5faXNDbG9zZWQgPSB0cnVlO1xuXG4gICAgLy8gcXVldWUgdGFzayB0byB1c2Ugd2FzbSBtb2R1bGVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9pc0Nsb3NlZCkge1xuICAgICAgICAgIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGNsb3NlIHdhbGxldCBpbiB3YXNtIGFuZCBpbnZva2UgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLmNsb3NlKHRoaXMuY3BwQWRkcmVzcywgZmFsc2UsIGFzeW5jICgpID0+IHsgLy8gc2F2aW5nIGhhbmRsZWQgZXh0ZXJuYWwgdG8gd2ViYXNzZW1ibHlcbiAgICAgICAgICBkZWxldGUgdGhpcy5jcHBBZGRyZXNzO1xuICAgICAgICAgIHRoaXMuX2lzQ2xvc2VkID0gdHJ1ZTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ2xvc2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLl9pc0Nsb3NlZDtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0gQUREIEpTRE9DIEZPUiBTVVBQT1JURUQgREVGQVVMVCBJTVBMRU1FTlRBVElPTlMgLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGdldFByaW1hcnlBZGRyZXNzKCk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5nZXRQcmltYXJ5QWRkcmVzcygpOyB9XG4gIGFzeW5jIGdldFN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHsgcmV0dXJuIHN1cGVyLmdldFN1YmFkZHJlc3MoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7IH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgSEVMUEVSUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgc3RhdGljIHNhbml0aXplU3ViYWRkcmVzcyhzdWJhZGRyZXNzKSB7XG4gICAgaWYgKHN1YmFkZHJlc3MuZ2V0TGFiZWwoKSA9PT0gXCJcIikgc3ViYWRkcmVzcy5zZXRMYWJlbCh1bmRlZmluZWQpO1xuICAgIHJldHVybiBzdWJhZGRyZXNzXG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3NlcnROb3RDbG9zZWQoKSB7XG4gICAgaWYgKHRoaXMuX2lzQ2xvc2VkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgY2xvc2VkXCIpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldFdhbGxldFByb3h5KCk6IE1vbmVyb1dhbGxldEtleXNQcm94eSB7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICByZXR1cm4gdGhpcy53YWxsZXRQcm94eTtcbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9XYWxsZXQgYnkgcHJveHlpbmcgcmVxdWVzdHMgdG8gYSB3b3JrZXIgd2hpY2ggcnVucyBhIGtleXMtb25seSB3YWxsZXQuXG4gKiBcbiAqIFRPRE86IHNvcnQgdGhlc2UgbWV0aG9kcyBhY2NvcmRpbmcgdG8gbWFzdGVyIHNvcnQgaW4gTW9uZXJvV2FsbGV0LnRzXG4gKiBUT0RPOiBwcm9iYWJseSBvbmx5IGFsbG93IG9uZSBsaXN0ZW5lciB0byB3b3JrZXIgdGhlbiBwcm9wb2dhdGUgdG8gcmVnaXN0ZXJlZCBsaXN0ZW5lcnMgZm9yIHBlcmZvcm1hbmNlXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBjbGFzcyBNb25lcm9XYWxsZXRLZXlzUHJveHkgZXh0ZW5kcyBNb25lcm9XYWxsZXQge1xuXG4gIC8vIHN0YXRlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgd2FsbGV0SWQ6IHN0cmluZztcbiAgcHJvdGVjdGVkIHdvcmtlcjogV29ya2VyO1xuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gV0FMTEVUIFNUQVRJQyBVVElMUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnKSB7XG4gICAgbGV0IHdhbGxldElkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIod2FsbGV0SWQsIFwiY3JlYXRlV2FsbGV0S2V5c1wiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9XYWxsZXRLZXlzUHJveHkod2FsbGV0SWQsIGF3YWl0IExpYnJhcnlVdGlscy5nZXRXb3JrZXIoKSk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJTlNUQU5DRSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBjb25zdHJ1Y3RvciB3aGljaCBpcyBnaXZlbiBhIHdvcmtlciB0byBjb21tdW5pY2F0ZSB3aXRoIHZpYSBtZXNzYWdlcy5cbiAgICogXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBub3QgYmUgY2FsbGVkIGV4dGVybmFsbHkgYnV0IHNob3VsZCBiZSBjYWxsZWQgdGhyb3VnaFxuICAgKiBzdGF0aWMgd2FsbGV0IGNyZWF0aW9uIHV0aWxpdGllcyBpbiB0aGlzIGNsYXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHdhbGxldElkIC0gaWRlbnRpZmllcyB0aGUgd2FsbGV0IHdpdGggdGhlIHdvcmtlclxuICAgKiBAcGFyYW0ge1dvcmtlcn0gd29ya2VyIC0gd29ya2VyIHRvIGNvbW11bmljYXRlIHdpdGggdmlhIG1lc3NhZ2VzXG4gICAqIFxuICAgKiBAcHJvdGVjdGVkXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih3YWxsZXRJZCwgd29ya2VyKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLndhbGxldElkID0gd2FsbGV0SWQ7XG4gICAgdGhpcy53b3JrZXIgPSB3b3JrZXI7XG4gIH1cbiAgXG4gIGFzeW5jIGlzVmlld09ubHkoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNWaWV3T25seVwiKTtcbiAgfVxuXG4gIGFzeW5jIGdldFZlcnNpb24oKTogUHJvbWlzZTxNb25lcm9WZXJzaW9uPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG5cbiAgYXN5bmMgZ2V0U2VlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRTZWVkXCIpIGFzIFByb21pc2U8c3RyaW5nPjtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZExhbmd1YWdlKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFNlZWRMYW5ndWFnZVwiKSBhcyBQcm9taXNlPHN0cmluZz47XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0U2VlZExhbmd1YWdlc1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHJpdmF0ZVNwZW5kS2V5KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFByaXZhdGVTcGVuZEtleVwiKSBhcyBQcm9taXNlPHN0cmluZz47XG4gIH1cbiAgXG4gIGFzeW5jIGdldFByaXZhdGVWaWV3S2V5KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFByaXZhdGVWaWV3S2V5XCIpIGFzIFByb21pc2U8c3RyaW5nPjtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHVibGljVmlld0tleSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRQdWJsaWNWaWV3S2V5XCIpIGFzIFByb21pc2U8c3RyaW5nPjtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHVibGljU3BlbmRLZXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UHVibGljU3BlbmRLZXlcIikgYXMgUHJvbWlzZTxzdHJpbmc+O1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBZGRyZXNzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgUHJvbWlzZTxzdHJpbmc+O1xuICB9XG5cbiAgYXN5bmMgZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3MpIHtcbiAgICBsZXQgc3ViYWRkcmVzc0pzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEFkZHJlc3NJbmRleFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhuZXcgTW9uZXJvU3ViYWRkcmVzcyhzdWJhZGRyZXNzSnNvbikpO1xuICB9XG5cbiAgYXN5bmMgZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0SW50ZWdyYXRlZEFkZHJlc3NcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRlY29kZUludGVncmF0ZWRBZGRyZXNzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG5cbiAgYXN5bmMgY2xvc2Uoc2F2ZSkge1xuICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2xvc2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyT2JqZWN0KHRoaXMud2FsbGV0SWQpO1xuICB9XG4gIFxuICBhc3luYyBpc0Nsb3NlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc0Nsb3NlZFwiKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBpbnZva2VXb3JrZXIoZm5OYW1lOiBzdHJpbmcsIGFyZ3M/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHRoaXMud2FsbGV0SWQsIGZuTmFtZSwgYXJncyk7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6ImtPQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGFBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBRyxZQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSx3QkFBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssa0JB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