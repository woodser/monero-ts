
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
  
  static async createWalletRandom(path, password, networkType, daemonUri, daemonUsername, daemonPassword, language) {
    console.log("MoneroWalletWasm.js::createWalletRandom(" + path + ", " + password + ", " + networkType + ", " + daemonUsername + ", " + daemonPassword + ", " + language + ")");
    console.log(MoneroWalletWasm.WASM_MODULE);
    
//    // Invoke external methods on the WASM using the `.call(name, ...args, cb)` method.
//    MoneroWalletWasm.WASM_MODULE.call('create_wallet_random', path, password, networkType, daemonUri, daemonUsername, daemonPassword, language, function (err, val) {
//      console.log('done', err, val)
//      aw.destroy()
//    });
    
    
    let cppAddress = MoneroWalletWasm.WASM_MODULE.create_wallet_random(path, password, networkType, daemonUri, daemonUsername, daemonPassword, language);
    console.log("Received initialized wallet cppAddress: " + cppAddress);
    return new MoneroWalletWasm(cppAddress);
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