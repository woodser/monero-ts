const MoneroWallet = require("./MoneroWallet");
const FS = require('fs'); 

/**
 * Implements a Monero wallet using WebAssembly to bridge to monero-project's wallet2.
 * 
 * TODO: add assertNotClosed() per JNI
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
  
  // TODO: openWith(<file/zip buffers>)
  
  static async openWallet(path, password, networkType, daemonUriOrConnection) {
    
    // validate and sanitize parameters
    if (!(await MoneroWalletWasm.walletExists(path))) throw new MoneroError("Wallet does not exist at path: " + path);
    if (networkType === undefined) throw new MoneroError("Must provide a network type");
    MoneroNetworkType.validateNetworkType(networkType);
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
    
    // get balance encoded in json string
    let balanceStr;
    if (accountIdx === undefined) {
      assert(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
      balanceStr = MoneroWalletWasm.WASM_MODULE.get_balance_wallet(this.cppAddress);
    } else if (subaddressIdx === undefined) {
      balanceStr = MoneroWalletWasm.WASM_MODULE.get_balance_account(this.cppAddress, accountIdx);
    } else {
      balanceStr = MoneroWalletWasm.WASM_MODULE.get_balance_subaddress(this.cppAddress, accountIdx, subaddressIdx);
    }
    
    // parse json string to BigInteger
    return new BigInteger(JSON.parse(balanceStr).balance);
  }
  
  async getUnlockedBalance(accountIdx, subaddressIdx) {
    
    // get balance encoded in json string
    let unlockedBalanceStr;
    if (accountIdx === undefined) {
      assert(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
      unlockedBalanceStr = MoneroWalletWasm.WASM_MODULE.get_unlocked_balance_wallet(this.cppAddress);
    } else if (subaddressIdx === undefined) {
      unlockedBalanceStr = MoneroWalletWasm.WASM_MODULE.get_unlocked_balance_account(this.cppAddress, accountIdx);
    } else {
      unlockedBalanceStr = MoneroWalletWasm.WASM_MODULE.get_unlocked_balance_subaddress(this.cppAddress, accountIdx, subaddressIdx);
    }
    
    // parse json string to BigInteger
    return new BigInteger(JSON.parse(unlockedBalanceStr).unlockedBalance);
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
//      console.log("Account balance: " + accountJson.balance);
//      console.log("Account unlocked balance: " + accountJson.unlockedBalance);
//      console.log("Account balance BI: " + new BigInteger(accountJson.balance));
//      console.log("Account unlocked balance BI: " + new BigInteger(accountJson.unlockedBalance));
      accounts.push(MoneroWalletWasm._sanitizeAccount(new MoneroAccount(accountJson.index, accountJson.primaryAddress, new BigInteger(accountJson.balance), new BigInteger(accountJson.unlockedBalance), subaddresses)));
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
    return MoneroWalletWasm._sanitizeAccount(new MoneroAccount(accountJson.index, accountJson.primaryAddress, new BigInteger(accountJson.balance), new BigInteger(accountJson.unlockedBalance), subaddresses));
  }
  
  async createAccount(label) {
    throw new MoneroError("Not implemented");
  }
  
  async getSubaddresses(accountIdx, subaddressIndices) {
    let argsStr = JSON.stringify({accountIdx: accountIdx, subaddressIndices: GenUtils.listify(subaddressIndices)});
    let subaddressesJson = JSON.parse(MoneroWalletWasm.WASM_MODULE.get_subaddresses(this.cppAddress, argsStr)).subaddresses;
    let subaddresses = [];
    for (let subaddressJson of subaddressesJson) subaddresses.push(MoneroWalletWasm._sanitizeSubaddress(new MoneroSubaddress(subaddressJson)));
    return subaddresses;
  }
  
  async createSubaddress(accountIdx, label) {
    throw new MoneroError("Not implemented");
  }
  
  async getTxs(query) {
    
    // copy and normalize tx query up to block
    if (query instanceof MoneroTxQuery) query = query.copy();
    else if (Array.isArray(query)) query = new MoneroTxQuery().setTxIds(query);
    else {
      query = Object.assign({}, query);
      query = new MoneroTxQuery(query);
    }
    if (query.getBlock() === undefined) query.setBlock(new MoneroBlock().setTxs([query]));
    if (query.getTransferQuery() === undefined) query.setTransferQuery(new MoneroTransferQuery());
    if (query.getOutputQuery() === undefined) query.setOutputQuery(new MoneroOutputQuery());
    
    console.log("Calling get txs with query:");
    console.log(JSON.stringify(query.getBlock().toJson()));
    
    // fetch txs from wasm using query serialized from block
    let blocksJsonStr;
    try {
      blocksJsonStr = MoneroWalletWasm.WASM_MODULE.get_txs(this.cppAddress, JSON.stringify(query.getBlock().toJson()));
    } catch (e) {
      throw e;
    }
    
    // deserialize blocks
    let blocksJson = JSON.parse(blocksJsonStr);
    console.log("Deserialized blocks");
    console.log(blocksJson);
    
    // collect txs
    throw new Error("Not implemented!");
//    
//    
//    
//    
//    
//    
//    // deserialize blocks
//    List<MoneroBlock> blocks = deserializeBlocks(blocksJson);
//    
//    // collect txs
//    List<MoneroTxWallet> txs = new ArrayList<MoneroTxWallet>();
//    for (MoneroBlock block : blocks) {
//      sanitizeBlock(block);
//      for (MoneroTx tx : block.getTxs()) {
//        if (block.getHeight() == null) tx.setBlock(null); // dereference placeholder block for unconfirmed txs
//        txs.add((MoneroTxWallet) tx);
//      }
//    }
//    
//    // re-sort txs which is lost over jni serialization
//    if (query.getTxIds() != null) {
//      Map<String, MoneroTxWallet> txMap = new HashMap<String, MoneroTxWallet>();
//      for (MoneroTxWallet tx : txs) txMap.put(tx.getId(), tx);
//      List<MoneroTxWallet> txsSorted = new ArrayList<MoneroTxWallet>();
//      for (String txId : query.getTxIds()) txsSorted.add(txMap.get(txId));
//      txs = txsSorted;
//    }
//    LOGGER.fine("getTxs() returning " + txs.size() + " transactions");
//    return txs;
//    
//    
//    throw new MoneroError("Not implemented");
  }
  
//  ////////////////////
//  async getTxs(query) {
//    
//    // copy and normalize tx query up to block
//    if (query instanceof MoneroTxQuery) query = query.copy();
//    else if (Array.isArray(query)) query = new MoneroTxQuery().setTxIds(query);
//    else {
//      query = Object.assign({}, query);
//      query = new MoneroTxQuery(query);
//    }
//    if (query.getBlock() === undefined) query.setBlock(new MoneroBlock().setTxs([query]));
//    if (query.getTransferQuery() === undefined) query.setTransferQuery(new MoneroTransferQuery());
//    if (query.getOutputQuery() === undefined) query.setOutputQuery(new MoneroOutputQuery());
//    
//    // temporarily disable transfer and output queries in order to collect all tx information
//    let transferQuery = query.getTransferQuery();
//    let outputQuery = query.getOutputQuery();
//    query.setTransferQuery(undefined);
//    query.setOutputQuery(undefined);
//    
//    // fetch all transfers that meet tx query
//    let transfers = await this.getTransfers(new MoneroTransferQuery().setTxQuery(query));
//    
//    // collect unique txs from transfers while retaining order
//    let txs = [];
//    let txsSet = new Set();
//    for (let transfer of transfers) {
//      if (!txsSet.has(transfer.getTx())) {
//        txs.push(transfer.getTx());
//        txsSet.add(transfer.getTx());
//      }
//    }
//    
//    // cache types into maps for merging and lookup
//    let txMap = new Map();
//    let blockMap = new Map();
//    for (let tx of txs) {
//      MoneroWalletRpc._mergeTx(tx, txMap, blockMap, false);
//    }
//    
//    // fetch and merge outputs if requested
//    if (query.getIncludeOutputs() || !outputQuery.isDefault()) {
//      let outputs = await this.getOutputs(new MoneroOutputQuery().setTxQuery(query));
//      
//      // merge output txs one time while retaining order
//      let outputTxs = [];
//      for (let output of outputs) {
//        if (!outputTxs.includes(output.getTx())) {
//          MoneroWalletRpc._mergeTx(output.getTx(), txMap, blockMap, true);
//          outputTxs.push(output.getTx());
//        }
//      }
//    }
//    
//    // restore transfer and output queries
//    query.setTransferQuery(transferQuery);
//    query.setOutputQuery(outputQuery);
//    
//    // filter txs that don't meet transfer query
//    query.setTransferQuery(transferQuery);
//    let txsQueried = [];
//    for (let tx of txs) {
//      if (query.meetsCriteria(tx)) txsQueried.push(tx);
//      else if (tx.getBlock() !== undefined) tx.getBlock().getTxs().splice(tx.getBlock().getTxs().indexOf(tx), 1);
//    }
//    txs = txsQueried;
//    
//    // verify all specified tx ids found
//    if (query.getTxIds()) {
//      for (let txId of query.getTxIds()) {
//        let found = false;
//        for (let tx of txs) {
//          if (txId === tx.getId()) {
//            found = true;
//            break;
//          }
//        }
//        if (!found) throw new MoneroError("Tx not found in wallet: " + txId);
//      }
//    }
//    
//    // special case: re-fetch txs if inconsistency caused by needing to make multiple rpc calls
//    for (let tx of txs) {
//      if (tx.isConfirmed() && tx.getBlock() === undefined) return this.getTxs(query);
//    }
//    
//    // order txs if tx ids given then return
//    if (query.getTxIds() && query.getTxIds().length > 0) {
//      let txsById = new Map()  // store txs in temporary map for sorting
//      for (let tx of txs) txsById.set(tx.getId(), tx);
//      let orderedTxs = [];
//      for (let txId of query.getTxIds()) if (txsById.get(txId)) orderedTxs.push(txsById.get(txId));
//      txs = orderedTxs;
//    }
//    return txs;
//  }
//  
//  
//  @Override
//  public List<MoneroTxWallet> getTxs(MoneroTxQuery query) {
//    assertNotClosed();
//    
//    // copy and normalize tx query up to block
//    query = query == null ? new MoneroTxQuery() : query.copy();
//    if (query.getBlock() == null) query.setBlock(new MoneroBlock().setTxs(query));
//    
//    // serialize query from block and fetch txs from jni
//    String blocksJson;
//    try {
//      blocksJson = getTxsJni(JsonUtils.serialize(query.getBlock()));
//    } catch (Exception e) {
//      throw new MoneroException(e.getMessage());
//    }
//    
//    // deserialize blocks
//    List<MoneroBlock> blocks = deserializeBlocks(blocksJson);
//    
//    // collect txs
//    List<MoneroTxWallet> txs = new ArrayList<MoneroTxWallet>();
//    for (MoneroBlock block : blocks) {
//      sanitizeBlock(block);
//      for (MoneroTx tx : block.getTxs()) {
//        if (block.getHeight() == null) tx.setBlock(null); // dereference placeholder block for unconfirmed txs
//        txs.add((MoneroTxWallet) tx);
//      }
//    }
//    
//    // re-sort txs which is lost over jni serialization
//    if (query.getTxIds() != null) {
//      Map<String, MoneroTxWallet> txMap = new HashMap<String, MoneroTxWallet>();
//      for (MoneroTxWallet tx : txs) txMap.put(tx.getId(), tx);
//      List<MoneroTxWallet> txsSorted = new ArrayList<MoneroTxWallet>();
//      for (String txId : query.getTxIds()) txsSorted.add(txMap.get(txId));
//      txs = txsSorted;
//    }
//    LOGGER.fine("getTxs() returning " + txs.size() + " transactions");
//    return txs;
//  }

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
    assert(typeof key === "string", "Attribute key must be a string");
    return MoneroWalletWasm.WASM_MODULE.get_attribute(this.cppAddress, key);
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

  async save() {
    
    // path must be set
    let path = await this.getPath();
    if (path === "") throw new MoneroError("Wallet path is not set");
    
    // write address file
    FS.writeFileSync(path + "_address.txt", MoneroWalletWasm.WASM_MODULE.get_address_file_buffer(this.cppAddress));
    
    // malloc keys buffer and get buffer location in c++ heap
    let keysBufferLoc = JSON.parse(MoneroWalletWasm.WASM_MODULE.get_keys_file_buffer(this.cppAddress, this.password, false));
    
    // read binary data from heap to DataView
    let view = new DataView(new ArrayBuffer(keysBufferLoc.length)); // TODO: improve performance using DataView instead of Uint8Array?, TODO: rename to length
    for (let i = 0; i < keysBufferLoc.length; i++) {
      view.setInt8(i, MoneroWalletWasm.WASM_MODULE.HEAPU8[keysBufferLoc.pointer / Uint8Array.BYTES_PER_ELEMENT + i]);
    }
    
    // free binary on heap
    MoneroWalletWasm.WASM_MODULE._free(keysBufferLoc.pointer);
    
    // write keys file
    FS.writeFileSync(path + ".keys", view, "binary"); // TODO: make async with callback?
    
    // malloc cache buffer and get buffer location in c++ heap
    let cacheBufferLoc = JSON.parse(MoneroWalletWasm.WASM_MODULE.get_cache_file_buffer(this.cppAddress, this.password));
    
    // read binary data from heap to DataView
    view = new DataView(new ArrayBuffer(cacheBufferLoc.length));
    for (let i = 0; i < cacheBufferLoc.length; i++) {
      view.setInt8(i, MoneroWalletWasm.WASM_MODULE.HEAPU8[cacheBufferLoc.pointer / Uint8Array.BYTES_PER_ELEMENT + i]);
    }
    
    // free binary on heap
    MoneroWalletWasm.WASM_MODULE._free(cacheBufferLoc.pointer);
    
    // write cache file
    FS.writeFileSync(path, view, "binary");
  }
  
  async close(save) {
    if (save) await this.save();
    delete this.path;
    delete this.password;
    MoneroWalletWasm.WASM_MODULE.close(this.cppAddress);
    delete this.cppAddress;
  }
  
  dummyMethod() {
    return MoneroWalletWasm.WASM_MODULE.dummy_method(this.cppAddress);
  }
  
  // ---------------------------- PRIVATE HELPERS ----------------------------
  
  static _sanitizeAccount(account) {
    if (account.getSubaddresses()) {
      for (let subaddress of account.getSubaddresses()) MoneroWalletWasm._sanitizeSubaddress(subaddress);
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
      MoneroWalletWasm.WASM_MODULE = module;
      resolve(MoneroWalletWasm);
    }).catch(function(e) {
      console.log("Error loading monero_cpp_library_WASM:", e);
      reject(e);
    });
  });
}