const MoneroWalletWasmBase = require("./MoneroWalletWasmBase");
const FS = require('fs'); 

/**
 * Implements a MoneroWallet using WebAssembly to bridge to monero-project's wallet2.
 * 
 * TODO: add assertNotClosed() per JNI
 */
class MoneroWalletCore extends MoneroWalletWasmBase {
  
  // --------------------------- STATIC UTILITIES -----------------------------
  
  static async walletExists(path) {
    let temp = FS.existsSync(path);
    console.log("Wallet exists at " + path + ": " + temp);
    return FS.existsSync(path);
  }
  
  // TODO: openWith(<file/zip buffers>)
  
  static async openWallet(path, password, networkType, daemonUriOrConnection) {
    
    // validate and sanitize parameters
    if (!(await MoneroWalletWasm.walletExists(path))) throw new MoneroError("Wallet does not exist at path: " + path);
    if (networkType === undefined) throw new MoneroError("Must provide a network type");
    MoneroNetworkType.validate(networkType);
    let daemonConnection = daemonUriOrConnection ? (typeof daemonUriOrConnection === "string" ? new MoneroRpcConnection(daemonUriOrConnection) : daemonUriOrConnection) : undefined;
    let daemonUri = daemonConnection ? daemonConnection.getUri() : "";
    let daemonUsername = daemonConnection ? daemonConnection.getUsername() : "";
    let daemonPassword = daemonConnection ? daemonConnection.getPassword() : "";
    
    // read wallet files
    let keysData = FS.readFileSync(path + ".keys");
    let cacheData = FS.readFileSync(path);
    
    // return promise which is resolved on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = async function(cppAddress) {
        let wallet = new MoneroWalletWasm(cppAddress, path, password);
        resolve(wallet);
      };
      
      // create wallet in wasm and invoke callback when done
      MoneroWalletWasm.WASM_MODULE.open_wallet("", password === undefined ? "" : password, networkType, keysData, cacheData, daemonUri, daemonUsername, daemonPassword, callbackFn);    // empty path is provided so disk writes only happen from JS
    });
  }
  
  static async createWalletRandom(path, password, networkType, daemonConnection, language) {
    
    // validate and sanitize params
    if (path === undefined) path = "";
    MoneroNetworkType.validate(networkType);
    if (language === undefined) language = "English";
    let daemonUri = daemonConnection ? daemonConnection.getUri() : "";
    let daemonUsername = daemonConnection ? daemonConnection.getUsername() : "";
    let daemonPassword = daemonConnection ? daemonConnection.getPassword() : "";
    
    // return promise which is resolved on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = async function(cppAddress) {
        let wallet = new MoneroWalletWasm(cppAddress, path, password);
        //await wallet.save();  // TODO
        resolve(wallet);
      };
      
      // create wallet in wasm and invoke callback when done
      MoneroWalletWasm.WASM_MODULE.create_wallet_random("", password === undefined ? "" : password, networkType, daemonUri, daemonUsername, daemonPassword, language, callbackFn);    // empty path is provided so disk writes only happen from JS
    });
  }
  
  // TODO: update to be consistent with createWalletRandom()
  static async createWalletFromMnemonic(path, password, networkType, mnemonic, daemonConnection, restoreHeight) {
    
    // return promise which is resolved on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = async function(cppAddress) {
        let wallet = new MoneroWalletWasm(cppAddress, path, password);
        //await wallet.save();  // TODO
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
    super(MoneroWalletCore.WASM_MODULE, cppAddress);
    this.path = path;
    this.password = password;
  }
  
  async getPath() {
    return this.path;
  }
}

/**
 * Exports a promise which resolves with a wallet class which uses a
 * WebAssembly module.
 */
module.exports = async function() {
  return new Promise(function(resolve, reject) {
    require("../../../monero_cpp_library_WASM")().ready.then(function(module) {
      MoneroWalletCore.WASM_MODULE = module;
      resolve(MoneroWalletCore);
    }).catch(function(e) {
      console.log("Error loading monero_cpp_library_WASM:", e);
      reject(e);
    });
  });
}