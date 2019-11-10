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
    
    // validate and sanitize params
    MoneroNetworkType.validateNetworkType(networkType);
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
    super();
    this.cppAddress = cppAddress;
    this.path = path;
    this.password = password;
  }
  
  async getPath() {
    return this.path;
  }
  
  async getSeed() {
    return MoneroWalletWasm.WASM_MODULE.get_seed(this.cppAddress);
  }
  
  async getMnemonic() {
    return MoneroWalletWasm.WASM_MODULE.get_mnemonic(this.cppAddress);
  }
  
  async getLanguages() {
    return JSON.parse(MoneroWalletWasm.WASM_MODULE.get_languages(this.cppAddress)); // TODO: return native vector<string> in c++
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
        let respJson = JSON.parse(resp);
        let result = new MoneroSyncResult(respJson.numBlocksFetched, respJson.receivedMoney);
        resolve(result);
      }
      
      // sync wallet in wasm and invoke callback when done
      MoneroWalletWasm.WASM_MODULE.sync(cppAddress, callbackFn);
    });
  }
  
  // startSyncing
  // rescanSpent
  // rescanBlockchain
  
  async getBalance(accountIdx, subaddressIdx) {
    
    // get low bits of balance
    let lowBits;
    if (accountIdx === undefined) {
      assert(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
      lowBits = MoneroWalletWasm.WASM_MODULE.get_balance_wallet(this.cppAddress);
    } else if (subaddressIdx === undefined) {
      lowBits = MoneroWalletWasm.WASM_MODULE.get_balance_account(this.cppAddress, accountIdx);
    } else {
      lowBits = MoneroWalletWasm.WASM_MODULE.get_balance_subaddress(this.cppAddress, accountIdx, subaddressIdx);
    }
    
    // emscripten returns high bits separately
    let highBits = MoneroWalletWasm.WASM_MODULE.getTempRet0();
    
    // return unsigned big integer from low and high bits
    return MoneroWalletWasm.WASM_MODULE.makeBigInt(lowBits, highBits, true);
  }
  
  async getUnlockedBalance(accountIdx, subaddressIdx) {
    
    // get low bits of unlocked balance
    let lowBits;
    if (accountIdx === undefined) {
      assert(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
      lowBits = MoneroWalletWasm.WASM_MODULE.get_unlocked_balance_wallet(this.cppAddress);
    } else if (subaddressIdx === undefined) {
      lowBits = MoneroWalletWasm.WASM_MODULE.get_unlocked_balance_account(this.cppAddress, accountIdx);
    } else {
      lowBits = MoneroWalletWasm.WASM_MODULE.get_unlocked_balance_subaddress(this.cppAddress, accountIdx, subaddressIdx);
    }
    
    // emscripten returns high bits separately
    let highBits = MoneroWalletWasm.WASM_MODULE.getTempRet0();
    
    // return big integer from low and high bits
    return MoneroWalletWasm.WASM_MODULE.makeBigInt(lowBits, highBits, true);
  }
  
  async getAccounts(includeSubaddresses, tag) {
    let accountsStr = MoneroWalletWasm.WASM_MODULE.get_accounts(this.cppAddress, includeSubaddresses ? true : false, tag ? tag : "");
    let accounts = [];
    for (let accountJson of JSON.parse(accountsStr).accounts) {
      let subaddresses = undefined;
      if (accountJson.subaddresses) {
        subaddresses = [];
        for (let subaddressJson of accountJson.subaddresses) {
          subaddressJson.balance = new BigInteger(subaddressJson.balance);  // TODO: can this lose precision?
          subaddressJson.unlockedBalance = new BigInteger(subaddressJson.unlockedBalance);
          subaddresses.push(new MoneroSubaddress(subaddressJson));
        }
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
  
  async createAccount(label) {
    throw new MoneroError("Not implemented");
  }
  
  async getSubaddresses(accountIdx, subaddressIndices) {
    let argsStr = JSON.stringify({accountIdx: accountIdx, subaddressIndices: GenUtils.listify(subaddressIndices)});
    let subaddressesJson = JSON.parse(MoneroWalletWasm.WASM_MODULE.get_subaddresses(this.cppAddress, argsStr)).subaddresses;
    let subaddresses = [];
    for (let subaddressJson of subaddressesJson) subaddresses.push(new MoneroSubaddress(subaddressJson));
    return subaddresses;
  }
  
  async createSubaddress(accountIdx, label) {
    throw new MoneroError("Not implemented");
  }
  
  async getTxs(config) {
    throw new MoneroError("Not implemented");
  }

  async getTransfers(config) {
    throw new MoneroError("Not implemented");
  }
  
  async getIncomingTransfers(config) {
    throw new MoneroError("Not implemented");
  }
  
  async getOutgoingTransfers(config) {
    throw new MoneroError("Not implemented");
  }
  
  async getOutputs(config) {
    throw new MoneroError("Not implemented");
  }
  
  async getOutputsHex() {
    throw new MoneroError("Not implemented");
  }
  
  async importOutputsHex(outputsHex) {
    throw new MoneroError("Not implemented");
  }
  
  async getKeyImages() {
    throw new MoneroError("Not implemented");
  }
  
  async importKeyImages(keyImages) {
    throw new MoneroError("Not implemented");
  }
  
  async getNewKeyImagesFromLastImport() {
    throw new MoneroError("Not implemented");
  }
  
  async relayTxs(txsOrMetadatas) {
    throw new MoneroError("Not implemented");
  }
  
  async sendSplit(requestOrAccountIndex, address, amount, priority) {
    throw new MoneroError("Not implemented");
  }
  
  async sweepOutput(requestOrAddress, keyImage, priority) {
    throw new MoneroError("Not implemented");
  }

  async sweepUnlocked(request) {
    throw new MoneroError("Not implemented");
  }
  
  async sweepDust() {
    throw new MoneroError("Not implemented");
  }
  
  async sweepDust(doNotRelay) {
    throw new MoneroError("Not implemented");
  }
  
  async sign(message) {
    throw new MoneroError("Not implemented");
  }
  
  async verify(message, address, signature) {
    throw new MoneroError("Not implemented");
  }
  
  async getTxKey(txId) {
    throw new MoneroError("Not implemented");
  }
  
  async checkTxKey(txId, txKey, address) {
    throw new MoneroError("Not implemented");
  }
  
  async getTxProof(txId, address, message) {
    throw new MoneroError("Not implemented");
  }
  
  async checkTxProof(txId, address, message, signature) {
    throw new MoneroError("Not implemented");
  }
  
  async getSpendProof(txId, message) {
    throw new MoneroError("Not implemented");
  }
  
  async checkSpendProof(txId, message, signature) {
    throw new MoneroError("Not implemented");
  }
  
  async getReserveProofWallet(message) {
    throw new MoneroError("Not implemented");
  }
  
  async getReserveProofAccount(accountIdx, amount, message) {
    throw new MoneroError("Not implemented");
  }

  async checkReserveProof(address, message, signature) {
    throw new MoneroError("Not implemented");
  }
  
  async getTxNotes(txIds) {
    throw new MoneroError("Not implemented");
  }
  
  async setTxNotes(txIds, notes) {
    throw new MoneroError("Not implemented");
  }
  
  async getAddressBookEntries() {
    throw new MoneroError("Not implemented");
  }
  
  async getAddressBookEntries(entryIndices) {
    throw new MoneroError("Not implemented");
  }
  
  async addAddressBookEntry(address, description) {
    throw new MoneroError("Not implemented");
  }
  
  async addAddressBookEntry(address, description, paymentId) {
    throw new MoneroError("Not implemented");
  }
  
  async deleteAddressBookEntry(entryIdx) {
    throw new MoneroError("Not implemented");
  }
  
  async tagAccounts(tag, accountIndices) {
    throw new MoneroError("Not implemented");
  }

  async untagAccounts(accountIndices) {
    throw new MoneroError("Not implemented");
  }
  
  async getAccountTags() {
    throw new MoneroError("Not implemented");
  }

  async setAccountTagLabel(tag, label) {
    throw new MoneroError("Not implemented");
  }
  
  async createPaymentUri(request) {
    throw new MoneroError("Not implemented");
  }
  
  async parsePaymentUri(uri) {
    throw new MoneroError("Not implemented");
  }
  
  async getAttribute(key) {
    throw new MoneroError("Not implemented");
  }
  
  async setAttribute(key, val) {
    assert(typeof key === "string", "Attribute key must be a string");
    assert(typeof val === "string", "Attribute value must be a string");
    MoneroWalletWasm.WASM_MODULE.set_attribute(this.cppAddress, key, val);
  }
  
  async startMining(numThreads, backgroundMining, ignoreBattery) {
    throw new MoneroError("Not implemented");
  }
  
  async stopMining() {
    throw new MoneroError("Not implemented");
  }
  
  async isMultisigImportNeeded() {
    throw new MoneroError("Not implemented");
  }
  
  async isMultisig() {
    throw new MoneroError("Not implemented");
  }
  
  async getMultisigInfo() {
    throw new MoneroError("Not implemented");
  }
  
  async prepareMultisig() {
    throw new MoneroError("Not implemented");
  }
  
  async makeMultisig(multisigHexes, threshold, password) {
    throw new MoneroError("Not implemented");
  }
  
  async exchangeMultisigKeys(multisigHexes, password) {
    throw new MoneroError("Not implemented");
  }
  
  async getMultisigHex() {
    throw new MoneroError("Not implemented");
  }
  
  async importMultisigHex(multisigHexes) {
    throw new MoneroError("Not implemented");
  }
  
  async signMultisigTxHex(multisigTxHex) {
    throw new MoneroError("Not implemented");
  }
  
  async submitMultisigTxHex(signedMultisigTxHex) {
    throw new MoneroError("Not implemented");
  }

  save() {
    throw new MoneroError("Not implemented");
  }
  
  async close(save) {
    throw new MoneroError("Not implemented");
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