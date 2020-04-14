/**
 * Implements a MoneroWallet which only manages keys using WebAssembly.
 */
class MoneroWalletKeys extends MoneroWallet {
  
  // --------------------------- STATIC UTILITIES -----------------------------
  
  static async createWalletRandom(networkType, language) {

    // validate and sanitize params
    MoneroNetworkType.validate(networkType);
    if (language === undefined) language = "English";
    
    // load wasm module
    let module = await MoneroUtils.loadKeysModule();
    
    // queue call to wasm module
    return module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
        
        // define callback for wasm
        let callbackFn = async function(cppAddress) {
          resolve(new MoneroWalletKeys(cppAddress));
        };
        
        // create wallet in wasm and invoke callback when done
        module.create_keys_wallet_random(networkType, language, callbackFn);
      });
    });
  }
  
  static async createWalletFromMnemonic(networkType, mnemonic, seedOffset) {
    
    // validate and sanitize params
    MoneroNetworkType.validate(networkType);
    if (mnemonic === undefined) throw Error("Must define mnemonic phrase to create wallet from");
    if (seedOffset === undefined) seedOffset = "";
    
    // load wasm module
    let module = await MoneroUtils.loadKeysModule();
    
    // queue call to wasm module
    return module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
        
        // define callback for wasm
        let callbackFn = async function(cppAddress) {
          resolve(new MoneroWalletKeys(cppAddress));
        };
        
        // create wallet in wasm and invoke callback when done
        module.create_keys_wallet_from_mnemonic(networkType, mnemonic, seedOffset, callbackFn);
      });
    });
  }
  
  static async createWalletFromKeys(networkType, address, privateViewKey, privateSpendKey, language) {
    
    // validate and sanitize params
    MoneroNetworkType.validate(networkType);
    if (address === undefined) address = "";
    if (privateViewKey === undefined) privateViewKey = "";
    if (privateSpendKey === undefined) privateSpendKey = "";
    if (language === undefined) language = "English";
    
    // load wasm module
    let module = await MoneroUtils.loadKeysModule();
    
    // queue call to wasm module
    return module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
        
        // define callback for wasm
        let callbackFn = async function(cppAddress) {
          let wallet = new MoneroWalletKeys(cppAddress);
          resolve(wallet);
        };
        
        // create wallet in wasm and invoke callback when done
        module.create_keys_wallet_from_keys(networkType, address, privateViewKey, privateSpendKey, language, callbackFn);
      });
    });
  }
  
  static async getMnemonicLanguages() {
    let module = await MoneroUtils.loadKeysModule();
    return module.queueTask(async function() {
      return JSON.parse(module.get_keys_wallet_mnemonic_languages()).languages;
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
   * @param {int} cppAddress is the address of the wallet instance in C++
   */
  constructor(cppAddress) {
    super();
    this._cppAddress = cppAddress;
    this._module = MoneroUtils.WASM_MODULE;
    if (!this._module.create_core_wallet_from_mnemonic) throw new Error("WASM module not loaded - create wallet instance using static utilities");  // static utilites pre-load wasm module
  }
  
  async isWatchOnly() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      return that._module.is_watch_only(that._cppAddress);
    });
  }
  
  async isConnected() {
    return false;
  }
  
  async getVersion() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      let versionStr = that._module.get_version(that._cppAddress);
      let versionJson = JSON.parse(versionStr);
      return new MoneroVersion(versionJson.number, versionJson.isRelease);
    });
  }
  
  getPath() {
    this._assertNotClosed();
    throw new Error("MoneroWalletKeys does not support a persisted path");
  }
  
  async getMnemonic() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      let mnemonic = that._module.get_mnemonic(that._cppAddress);
      return mnemonic ? mnemonic : undefined;
    });
  }
  
  async getMnemonicLanguage() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      let mnemonicLanguage = that._module.get_mnemonic_language(that._cppAddress);
      return mnemonicLanguage ? mnemonicLanguage : undefined;
    });
  }
  
  async getPrivateSpendKey() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      let privateSpendKey = that._module.get_private_spend_key(that._cppAddress);
      return privateSpendKey ? privateSpendKey : undefined;
    });
  }
  
  async getPrivateViewKey() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      return that._module.get_private_view_key(that._cppAddress);
    });
  }
  
  async getPublicViewKey() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      return that._module.get_public_view_key(that._cppAddress);
    });
  }
  
  async getPublicSpendKey() {
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      return that._module.get_public_spend_key(that._cppAddress);
    });
  }
  
  async getAddress(accountIdx, subaddressIdx) {
    this._assertNotClosed();
    assert(typeof accountIdx === "number");
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      return that._module.get_address(that._cppAddress, accountIdx, subaddressIdx);
    });
  }
  
  async getAddressIndex(address) {
    this._assertNotClosed();
    if (!MoneroUtils.isValidAddress(address)) throw new MoneroError("Invalid address");
    let that = this;
    return that._module.queueTask(async function() {
      that._assertNotClosed();
      try {
        let subaddressJson = JSON.parse(that._module.get_address_index(that._cppAddress, address));
        return new MoneroSubaddress(subaddressJson);
      } catch (e) {
        throw new Error("Address doesn't belong to the wallet");
      }
    });
  }
  
  getAccounts() {
    this._assertNotClosed();
    throw new Error("MoneroWalletKeys does not support getting an enumerable set of accounts; query specific accounts");
  }
  
  // getIntegratedAddress(paymentId)  // TODO
  // decodeIntegratedAddress
  
  async close(save) {
    if (this._isClosed) return; // closing a closed wallet has no effect
    
    // save wallet if requested
    if (save) await this.save();
    
    // queue task to use wasm module
    let that = this;
    return that._module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
        if (that._isClosed) {
          resolve();
          return;
        }
        
        // define callback for wasm
        let callbackFn = async function() {
          delete that._cppAddress;
          that._isClosed = true;
          resolve();
        };
        
        // close wallet in wasm and invoke callback when done
        that._module.close(that._cppAddress, false, callbackFn);  // saving handled external to webassembly
      });
    });
  }
  
  async isClosed() {
    return this._isClosed;
  }
  
  // ----------------------------- PRIVATE HELPERS ----------------------------
  
  _assertNotClosed() {
    if (this._isClosed) throw new MoneroError("Wallet is closed");
  }
}

module.exports = MoneroWalletKeys;