const MoneroWallet = require("./MoneroWallet");
const FS = require('fs'); 

/**
 * Implements a Monero wallet using WebAssembly to bridge to monero-project's wallet2.
 */
class MoneroWalletWasm extends MoneroWallet {
  
  // --------------------------- STATIC UTILITIES -----------------------------
  
  static createWalletDummy() {
    console.log("MoneroWalletWasm.js::createWalletDummy();");
    let cppAddress = MoneroWalletWasm.WASM_MODULE.create_wallet_dummy();
    return new MoneroWalletWasm(cppAddress);
  }
  
  static async walletExists(path) {
    let temp = FS.existsSync(path);
    console.log("Wallet exists at " + path + ": " + temp);
    return FS.existsSync(path);
  }
  
  static async createWalletRandom(path, password, networkType, daemonConnection, language) {
    
    // return promise which is resolved on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = async function(cppAddress) {
        console.log("Received callback argument!!! " + cppAddress);
        let wallet = new MoneroWalletWasm(cppAddress, path, password);
        //await wallet.save();
        resolve(wallet);
      };
      
      // create wallet in wasm and invoke callback when done
      let daemonUri = daemonConnection ? daemonConnection.getUri() : "";
      let daemonUsername = daemonConnection ? daemonConnection.getUsername() : "";
      let daemonPassword = daemonConnection ? daemonConnection.getPassword() : "";
      MoneroWalletWasm.WASM_MODULE.create_wallet_random("", password, networkType, daemonUri, daemonUsername, daemonPassword, language, callbackFn);    // empty path is provided so disk writes only happen from JS
    });
  }
  
  static async createWalletFromMnemonic(path, password, networkType, mnemonic, daemonConnection, restoreHeight) {
    
    // return promise which is resolved on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = async function(cppAddress) {
        console.log("Received callback argument!!! " + cppAddress);
        let wallet = new MoneroWalletWasm(cppAddress, path, password);
        //await wallet.save();
        resolve(wallet);
      };
      
      // create wallet in wasm and invoke callback when done
      let daemonUri = daemonConnection ? daemonConnection.getUri() : "";
      let daemonUsername = daemonConnection ? daemonConnection.getUsername() : "";
      let daemonPassword = daemonConnection ? daemonConnection.getPassword() : "";
      MoneroWalletWasm.WASM_MODULE.create_wallet_from_mnemonic("", password, networkType, mnemonic, daemonUri, daemonUsername, daemonPassword, restoreHeight, callbackFn);  // empty path is provided so disk writes only happen from JS
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
   * @param {string} path is the path of the wallet instance
   * @param {string} password is the password of the wallet instance
   */
  constructor(cppAddress, path, password) {
    super();
    this.cppAddress = cppAddress;
    this.path = path;
    this.password = password;
  }
  
  async getPath() {
    throw new MoneroError("Not implemented");
  }
  
  async getSeed() {
    return MoneroWalletWasm.WASM_MODULE.get_seed(this.cppAddress);
  }
  
  async getMnemonic() {
    return MoneroWalletWasm.WASM_MODULE.get_mnemonic(this.cppAddress);
  }
  
  async getLanguages() {
    return JSON.parse(MoneroWalletWasm.WASM_MODULE.get_languages(this.cppAddress));
  }
  
  async getPublicViewKey() {
    return MoneroWalletWasm.WASM_MODULE.get_public_view_key(this.cppAddress);
  }
  
  async getPrivateViewKey() {
    return MoneroWalletWasm.WASM_MODULE.get_private_view_key(this.cppAddress);
  }
  
  async getPublicSpendKey() {
    return MoneroWalletWasm.WASM_MODULE.get_public_spend_key(this.cppAddress);
  }
  
  async getPrivateSpendKey() {
    return MoneroWalletWasm.WASM_MODULE.get_private_spend_key(this.cppAddress);
  }
  
  async getAddress(accountIdx, subaddressIdx) {
    assert(typeof accountIdx === "number");
    return MoneroWalletWasm.WASM_MODULE.get_address(this.cppAddress, accountIdx, subaddressIdx);
  }
  
  async getAddressIndex(address) {
    let subaddressJson = JSON.parse(MoneroWalletWasm.WASM_MODULE.get_address_index(this.cppAddress, address));
    return new MoneroSubaddress(subaddressJson);
  }
  
  // getIntegratedAddress(paymentId)
  // decodeIntegratedAddress
  
  async getHeight() {
    let cppAddress = this.cppAddress;
    
    // return promise which resolves on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = function(resp) {
        console.log("Received response from get_height!");
        console.log("height: " + resp);
        resolve(resp);
      }
      
      // sync wallet in wasm and invoke callback when done
      MoneroWalletWasm.WASM_MODULE.get_height(cppAddress, callbackFn);
    });
  }
  
  // getDaemonHeight
  
  async sync() {
    let cppAddress = this.cppAddress;
    
    // return promise which resolves on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = function(resp) {
        console.log("Received response from synchronizing!");
        console.log(resp);
        resolve("...wait for it...");
      }
      
      // sync wallet in wasm and invoke callback when done
      MoneroWalletWasm.WASM_MODULE.sync(cppAddress, callbackFn);
    });
  }
  
  // startSyncing
  // rescanSpent
  // rescanBlockchain
  
  async getBalance(accountIdx, subaddressIdx) {
    throw new Error("getBalance() not implemented");
  }
  
  async getUnlockedBalance(accountIdx, subaddressIdx) {
    throw new Error("getUnlockedBalance() not implemented");
  }
  
  async getAccounts(includeSubaddresses, tag) {
    let accountsStr = MoneroWalletWasm.WASM_MODULE.get_accounts(this.cppAddress, includeSubaddresses ? true : false, tag ? tag : "");
    let accounts = [];
    for (let accountJson of JSON.parse(accountsStr).accounts) {
      let subaddresses = undefined;
      if (accountJson.subaddresses) {
        subaddresses = [];
        for (let subaddressJson of accountJson.subaddresses) subaddresses.push(new MoneroSubaddress(subaddressJson));
      }
      accounts.push(new MoneroAccount(accountJson.index, accountJson.primaryAddress, new BigInteger(accountJson.balance), new BigInteger(accountJson.unlockedBalance), subaddresses));
    }
    return accounts;
  }
  
  async getAccount(accountIdx, includeSubaddresses) {
    let accountStr = MoneroWalletWasm.WASM_MODULE.get_account(this.cppAddress, accountIdx, includeSubaddresses ? true : false);
    let accountJson = JSON.parse(accountStr);
    let subaddresses = undefined;
    if (accountJson.subaddresses) {
      subaddresses = [];
      for (let subaddressJson of accountJson.subaddresses) subaddresses.push(new MoneroSubaddress(subaddressJson));
    }
    return new MoneroAccount(accountJson.index, accountJson.primaryAddress, new BigInteger(accountJson.balance), new BigInteger(accountJson.unlockedBalance), subaddresses);
  }
  
  async getSubaddresses(accountIdx, subaddressIndices) {
    let argsStr = JSON.stringify({accountIdx: accountIdx, subaddressIndices: GenUtils.listify(subaddressIndices)});
    let subaddressesJson = JSON.parse(MoneroWalletWasm.WASM_MODULE.get_subaddresses(this.cppAddress, argsStr)).subaddresses;
    let subaddresses = [];
    for (let subaddressJson of subaddressesJson) subaddresses.push(new MoneroSubaddress(subaddressJson));
    return subaddresses;
  }
  
  async getEncryptedText() {
    
    // return promise which resolves on callback
    let that = this;
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = function(resp) {
        console.log("Received response from to_encrypted_text()!");
        console.log(resp);
        resolve(resp);
      }
      
      // sync wallet in wasm and invoke callback when done
      MoneroWalletWasm.WASM_MODULE.get_encrypted_text(that.cppAddress, callbackFn);
    });
  }
  
  async save() {
    // TODO
//    let encryptedText = await this.getEncryptedText();
//    console.log("Saving encrypted text: " + encryptedText);
//    throw Error("Save to disk not implemented");
  }
  
  dummyMethod() {
    return MoneroWalletWasm.WASM_MODULE.dummy_method(this.cppAddress);
  }
}

/**
 * Exports a promise which resolves with a wallet class which uses a
 * WebAssembly module .
 */
module.exports = async function() {
  return new Promise(function(resolve, reject) {
    require("../../../monero_cpp_library_WASM")().ready.then(function(module) {
      MoneroWalletWasm.WASM_MODULE = module;
      resolve(MoneroWalletWasm);
    }).catch(function(e) {
      console.log("Error loading monero_cpp_library_WASM:", e);
      reject(e);
    });
  });
}