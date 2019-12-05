const MoneroWallet = require("./MoneroWallet");
const FS = require('fs'); 

/**
 * Implements a Monero wallet which only manages keys using WebAssembly.
 */
class MoneroWalletKeys extends MoneroWallet {
  
  // --------------------------- STATIC UTILITIES -----------------------------
  
  static async createWalletRandom(networkType, language) {

    // validate and sanitize params
    MoneroNetworkType.validate(networkType);
    if (language === undefined) language = "English";
    
    // return promise which is resolved on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = async function(cppAddress) {
        resolve(new MoneroWalletKeys(cppAddress));
      };
      
      // create wallet in wasm and invoke callback when done
      MoneroWalletKeys.WASM_MODULE.create_keys_wallet_random(networkType, language, callbackFn);
    });
  }
  
  static async createWalletFromMnemonic(networkType, mnemonic) {
    
    // validate and sanitize params
    MoneroNetworkType.validate(networkType);
    
    // return promise which is resolved on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = async function(cppAddress) {
        resolve(new MoneroWalletKeys(cppAddress));
      };
      
      // create wallet in wasm and invoke callback when done
      MoneroWalletKeys.WASM_MODULE.create_keys_wallet_from_mnemonic(networkType, mnemonic, callbackFn);
    });
  }
  
  static async createWalletFromKeys(networkType, address, privateViewKey, privateSpendKey, language) {
    
    // validate and sanitize params
    MoneroNetworkType.validate(networkType);
    if (address === undefined) address = "";
    if (privateViewKey === undefined) privateViewKey = "";
    if (privateSpendKey === undefined) privateSpendKey = "";
    if (language === undefined) language = "English";
    
    // return promise which is resolved on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = async function(cppAddress) {
        let wallet = new MoneroWalletKeys(cppAddress);
        resolve(wallet);
      };
      
      // create wallet in wasm and invoke callback when done
      MoneroWalletKeys.WASM_MODULE.create_keys_wallet_from_keys(networkType, address, privateViewKey, privateSpendKey, language, callbackFn);
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
    this.cppAddress = cppAddress;
  }
  
  async getMnemonic() {
    return MoneroWalletKeys.WASM_MODULE.get_mnemonic(this.cppAddress);
  }
  
  async getLanguage() {
    return MoneroWalletKeys.WASM_MODULE.get_language(this.cppAddress);
  }
  
  async getLanguages() {
    return JSON.parse(MoneroWalletKeys.WASM_MODULE.get_languages(this.cppAddress)); // TODO: return native vector<string> in c++
  }
  
  async getPublicViewKey() {
    return MoneroWalletKeys.WASM_MODULE.get_public_view_key(this.cppAddress);
  }
  
  async getPrivateViewKey() {
    return MoneroWalletKeys.WASM_MODULE.get_private_view_key(this.cppAddress);
  }
  
  async getPublicSpendKey() {
    return MoneroWalletKeys.WASM_MODULE.get_public_spend_key(this.cppAddress);
  }
  
  async getPrivateSpendKey() {
    let privateSpendKey = MoneroWalletKeys.WASM_MODULE.get_private_spend_key(this.cppAddress);
    return privateSpendKey ? privateSpendKey : undefined;
  }
  
  async getAddress(accountIdx, subaddressIdx) {
    assert(typeof accountIdx === "number");
    return MoneroWalletKeys.WASM_MODULE.get_address(this.cppAddress, accountIdx, subaddressIdx);
  }
  
  async getAddressIndex(address) {
    let subaddressJson = JSON.parse(MoneroWalletKeys.WASM_MODULE.get_address_index(this.cppAddress, address));
    return new MoneroSubaddress(subaddressJson);
  }
  
  // getIntegratedAddress(paymentId)
  // decodeIntegratedAddress
  
  async getAccounts(includeSubaddresses, tag) {
    let accountsStr = MoneroWalletKeys.WASM_MODULE.get_accounts(this.cppAddress, includeSubaddresses ? true : false, tag ? tag : "");
    let accounts = [];
    for (let accountJson of JSON.parse(accountsStr).accounts) {
      accounts.push(MoneroWalletKeys._sanitizeAccount(new MoneroAccount(accountJson)));
//      console.log("Account balance: " + accountJson.balance);
//      console.log("Account unlocked balance: " + accountJson.unlockedBalance);
//      console.log("Account balance BI: " + new BigInteger(accountJson.balance));
//      console.log("Account unlocked balance BI: " + new BigInteger(accountJson.unlockedBalance));
    }
    return accounts;
  }
  
  async getAccount(accountIdx, includeSubaddresses) {
    let accountStr = MoneroWalletKeys.WASM_MODULE.get_account(this.cppAddress, accountIdx, includeSubaddresses ? true : false);
    let accountJson = JSON.parse(accountStr);
    return MoneroWalletKeys._sanitizeAccount(new MoneroAccount(accountJson));
  }
  
  async createAccount(label) {
    throw new MoneroError("Not implemented");
  }
  
  async getSubaddresses(accountIdx, subaddressIndices) {
    let args = {accountIdx: accountIdx, subaddressIndices: subaddressIndices === undefined ? [] : GenUtils.listify(subaddressIndices)};
    let subaddressesJson = JSON.parse(MoneroWalletKeys.WASM_MODULE.get_subaddresses(this.cppAddress, JSON.stringify(args))).subaddresses;
    let subaddresses = [];
    for (let subaddressJson of subaddressesJson) subaddresses.push(MoneroWalletKeys._sanitizeSubaddress(new MoneroSubaddress(subaddressJson)));
    return subaddresses;
  }
  
  async createSubaddress(accountIdx, label) {
    throw new MoneroError("Not implemented");
  }
  
  async sign(message) {
    throw new MoneroError("Not implemented");
  }
  
  async verify(message, address, signature) {
    throw new MoneroError("Not implemented");
  }

  async close(save) {
    MoneroWalletKeys.WASM_MODULE.close(this.cppAddress);
    delete this.cppAddress;
  }
  
  // ---------------------------- PRIVATE HELPERS ----------------------------
  
  static _sanitizeAccount(account) {
    if (account.getSubaddresses()) {
      for (let subaddress of account.getSubaddresses()) MoneroWalletKeys._sanitizeSubaddress(subaddress);
    }
    return account;
  }
  
  static _sanitizeSubaddress(subaddress) {
    if (subaddress.getLabel() === "") subaddress.setLabel(undefined);
    return subaddress
  }
}

/**
 * Exports a promise which resolves with a wallet class which uses a
 * WebAssembly module.
 */
module.exports = async function() {
  return new Promise(function(resolve, reject) {
    require("../../../monero_cpp_library_WASM")().ready.then(function(module) {
      MoneroWalletKeys.WASM_MODULE = module;
      resolve(MoneroWalletKeys);
    }).catch(function(e) {
      console.log("Error loading monero_cpp_library_WASM:", e);
      reject(e);
    });
  });
}