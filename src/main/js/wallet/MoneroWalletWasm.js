
/**
 * Implements a Monero wallet using WebAssembly to bridge to a C++ wallet.
 */
class MoneroWalletWasm {
  
  // --------------------------- STATIC UTILITIES -----------------------------
  
  static createWalletDummy() {
    console.log("MoneroWalletWasm.js::createWalletDummy();");
    let cppAddress = MoneroWalletWasm.WASM_MODULE.create_wallet_dummy();
    return new MoneroWalletWasm(cppAddress);
  }
  
  // TODO: use daemon rpc connection instead of individual daemon uri, usernmae, password
  static async createWalletRandom(path, password, networkType, daemonUri, daemonUsername, daemonPassword, language) {
    console.log("MoneroWalletWasm.js::createWalletRandom(" + path + ", " + password + ", " + networkType + ", " + daemonUsername + ", " + daemonPassword + ", " + language + ")");
    
    // return promise which is resolved on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = function(cppAddress) {
        console.log("Received callback argument!!! " + cppAddress);
        resolve(new MoneroWalletWasm(cppAddress));
      };
      
      // create wallet in wasm and invoke callback when done
      MoneroWalletWasm.WASM_MODULE.create_wallet_random(path, password, networkType, daemonUri, daemonUsername, daemonPassword, language, callbackFn);
    });
  }
  
  static async createWalletFromMnemonic(path, password, networkType, mnemonic, daemonUri, daemonUsername, daemonPassword, restoreHeight) {
    console.log("MoneroWalletWasm.js::createWalletFromMnemonic(" + path + ", " + password + ", " + networkType + ", " + mnemonic + ", " + daemonUri + ", " + daemonUsername + ", " + daemonPassword + ", " + restoreHeight + ")");
    
    // return promise which is resolved on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = function(cppAddress) {
        console.log("Received callback argument!!! " + cppAddress);
        resolve(new MoneroWalletWasm(cppAddress));
      };
      
      // create wallet in wasm and invoke callback when done
      MoneroWalletWasm.WASM_MODULE.create_wallet_from_mnemonic(path, password, networkType, mnemonic, daemonUri, daemonUsername, daemonPassword, restoreHeight, callbackFn);
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
    this.cppAddress = cppAddress;
  }
  
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