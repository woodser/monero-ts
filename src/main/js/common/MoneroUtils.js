const assert = require("assert");
const BigInteger = require("./biginteger").BigInteger;
const GenUtils = require("./GenUtils");
const LibraryUtils = require("./LibraryUtils");
const MoneroError = require("./MoneroError");
const MoneroIntegratedAddress = require("../wallet/model/MoneroIntegratedAddress");
const MoneroNetworkType = require("../daemon/model/MoneroNetworkType");

/**
 * Collection of Monero utilities. Runs in a worker thread by default.
 * 
 * @hideconstructor
 */
class MoneroUtils {
    
  /**
   * <p>Get the version of the monero-javascript library.<p>
   * 
   * @return {string} the version of this monero-javascript library
   */
  static getVersion() {
    return "0.7.11";
  }
  
  /**
   * Enable or disable proxying these utilities to a worker thread.
   * 
   * @param {boolean} proxyToWorker - specifies if utilities should be proxied to a worker
   */
  static setProxyToWorker(proxyToWorker) {
    MoneroUtils.PROXY_TO_WORKER = proxyToWorker || false;
  }
  
  /**
   * Validate the given mnemonic, throw an error if invalid.
   *
   * TODO: improve validation, use network type
   * 
   * @param {string} mnemonic - mnemonic to validate
   */
  static async validateMnemonic(mnemonic) {
    assert(mnemonic, "Mnemonic phrase is not initialized");
    let words = mnemonic.split(" ");
    if (words.length !== MoneroUtils.NUM_MNEMONIC_WORDS) throw new MoneroError("Mnemonic phrase is " + words.length + " words but must be " + MoneroUtils.NUM_MNEMONIC_WORDS);
  }
  
  /**
   * Indicates if a private view key is valid.
   * 
   * @param {string} privateViewKey is the private view key to validate
   * @return {Promise<bool>} true if the private view key is valid, false otherwise
   */
  static async isValidPrivateViewKey(privateViewKey) {
    try {
      await MoneroUtils.validatePrivateViewKey(privateViewKey);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Indicates if a public view key is valid.
   * 
   * @param {string} publicViewKey is the public view key to validate
   * @return {Promise<bool>} true if the public view key is valid, false otherwise
   */
  static async isValidPublicViewKey(publicViewKey) {
    try {
      await MoneroUtils.validatePublicViewKey(publicViewKey);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Indicates if a private spend key is valid.
   * 
   * @param {string} privateSpendKey is the private spend key to validate
   * @return {Promise<bool>} true if the private spend key is valid, false otherwise
   */
  static async isValidPrivateSpendKey(privateSpendKey) {
    try {
      await MoneroUtils.validatePrivateSpendKey(privateSpendKey);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Indicates if a public spend key is valid.
   * 
   * @param {string} publicSpendKey is the public spend key to validate
   * @return {Promise<bool>} true if the public spend key is valid, false otherwise
   */
  static async isValidPublicSpendKey(publicSpendKey) {
    try {
      await MoneroUtils.validatePublicSpendKey(publicSpendKey);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Validate the given private view key, throw an error if invalid.
   *
   * @param {string} privateViewKey - private view key to validate
   */
  static async validatePrivateViewKey(privateViewKey) {
    if (!MoneroUtils._isHex64(privateViewKey)) throw new MoneroError("private view key expected to be 64 hex characters");
  }
  
  /**
   * Validate the given public view key, throw an error if invalid.
   *
   * @param {string} publicViewKey - public view key to validate
   */
  static async validatePublicViewKey(publicViewKey) {
    if (!MoneroUtils._isHex64(publicViewKey)) throw new MoneroError("public view key expected to be 64 hex characters");
  }
  
  /**
   * Validate the given private spend key, throw an error if invalid.
   *
   * @param {string} privateSpendKey - private spend key to validate
   */
  static async validatePrivateSpendKey(privateSpendKey) {
    if (!MoneroUtils._isHex64(privateSpendKey)) throw new MoneroError("private spend key expected to be 64 hex characters");
  }
  
  /**
   * Validate the given public spend key, throw an error if invalid.
   *
   * @param {string} publicSpendKey - public spend key to validate
   */
  static async validatePublicSpendKey(publicSpendKey) {
    if (!MoneroUtils._isHex64(publicSpendKey)) throw new MoneroError("public spend key expected to be 64 hex characters");
  }
  
  /**
   * Get an integrated address.
   * 
   * @param {MoneroNetworkType} networkType - network type of the integrated address
   * @param {string} standardAddress - address to derive the integrated address from
   * @param {string} paymentId - optionally specifies the integrated address's payment id (defaults to random payment id)
   * @return {Promise<MoneroIntegratedAddress>} the integrated address
   */
  static async getIntegratedAddress(networkType, standardAddress, paymentId) {
    if (MoneroUtils.PROXY_TO_WORKER) return new MoneroIntegratedAddress(await LibraryUtils.invokeWorker(undefined, "moneroUtilsGetIntegratedAddress", Array.from(arguments)));
  
    // validate inputs
    MoneroNetworkType.validate(networkType);
    assert(typeof standardAddress === "string", "Address is not string");
    assert(standardAddress.length > 0, "Address is empty");
    assert(GenUtils.isBase58(standardAddress), "Address is not base 58");
    
    // load keys module by default
    if (LibraryUtils.getWasmModule() === undefined) await LibraryUtils.loadKeysModule();
    
    // get integrated address in queue
    return LibraryUtils.getWasmModule().queueTask(async function() {
      let integratedAddressJson = LibraryUtils.getWasmModule().get_integrated_address_util(networkType, standardAddress, paymentId ? paymentId : "");
      if (integratedAddressJson.charAt(0) !== '{') throw new MoneroError(integratedAddressJson);
      return new MoneroIntegratedAddress(JSON.parse(integratedAddressJson));
    });
  }
  
  /**
   * Determine if the given address is valid.
   * 
   * @param {string} address - address
   * @param {MoneroNetworkType} networkType - network type of the address to validate
   * @return {Promise<boolean>} true if the address is valid, false otherwise
   */
  static async isValidAddress(address, networkType) {
    try {
      await MoneroUtils.validateAddress(address, networkType);
      return true;
    } catch (err) {
      return false;
    }
  }
  
  /**
   * Validate the given address, throw an error if invalid.
   *
   * @param {string} address - address to validate
   * @param {MoneroNetworkType} networkType - network type of the address to validate
   */
  static async validateAddress(address, networkType) {
    if (MoneroUtils.PROXY_TO_WORKER) return LibraryUtils.invokeWorker(undefined, "moneroUtilsValidateAddress", Array.from(arguments));
    
    // validate inputs
    assert(typeof address === "string", "Address is not string");
    assert(address.length > 0, "Address is empty");
    assert(GenUtils.isBase58(address), "Address is not base 58");
    MoneroNetworkType.validate(networkType);
    
    // load keys module by default
    if (LibraryUtils.getWasmModule() === undefined) await LibraryUtils.loadKeysModule();
    
    // validate address in queue
    return LibraryUtils.getWasmModule().queueTask(async function() {
      let errMsg = LibraryUtils.getWasmModule().validate_address(address, networkType);
      if (errMsg) throw new MoneroError(errMsg);
    });
  }
  
  /**
   * Determine if the given payment id is valid.
   * 
   * @param {string} paymentId - payment id to determine if valid
   * @return {Promise<bool>} true if the payment id is valid, false otherwise
   */
  static async isValidPaymentId(paymentId) {
    try {
      await MoneroUtils.validatePaymentId(paymentId);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Validate the given payment id, throw an error if invalid.
   * 
   * TODO: improve validation
   * 
   * @param {string} paymentId - payment id to validate 
   */
  static async validatePaymentId(paymentId) {
    assert.equal(typeof paymentId, "string");
    assert(paymentId.length === 16 || paymentId.length === 64);
  }
    
  /**
   * Decode tx extra according to https://cryptonote.org/cns/cns005.txt and
   * returns the last tx pub key.
   * 
   * TODO: use c++ bridge for this
   * 
   * @param [byte[]] txExtra - array of tx extra bytes
   * @return {string} the last pub key as a hexidecimal string
   */
  static async getLastTxPubKey(txExtra) {
    let lastPubKeyIdx;
    for (let i = 0; i < txExtra.length; i++) {
      let tag = txExtra[i];
      if (tag === 0 || tag === 2) {
        i += 1 + txExtra[i + 1];  // advance to next tag
      } else if (tag === 1) {
        lastPubKeyIdx = i + 1;
        i += 1 + 32;              // advance to next tag
      } else throw new MoneroError("Invalid sub-field tag: " + tag);
    }
    return Buffer.from(new Uint8Array(txExtra.slice(lastPubKeyIdx, lastPubKeyIdx + 32))).toString("hex");
  }
  
  /**
   * Determines if two payment ids are functionally equal.
   * 
   * For example, 03284e41c342f032 and 03284e41c342f032000000000000000000000000000000000000000000000000 are considered equal.
   * 
   * @param {string} paymentId1 is a payment id to compare
   * @param {string} paymentId2 is a payment id to compare
   * @return {bool} true if the payment ids are equal, false otherwise
   */
  static paymentIdsEqual(paymentId1, paymentId2) {
    let maxLength = Math.max(paymentId1.length, paymentId2.length);
    for (let i = 0; i < maxLength; i++) {
      if (i < paymentId1.length && i < paymentId2.length && paymentId1[i] !== paymentId2[i]) return false;
      if (i >= paymentId1.length && paymentId2[i] !== '0') return false;
      if (i >= paymentId2.length && paymentId1[i] !== '0') return false;
    }
    return true;
  }
  
  /**
   * Merges a transaction into a list of existing transactions.
   * 
   * @param {MoneroTx[]} txs - existing transactions to merge into
   * @param {MoneroTx} tx - transaction to merge into the list
   */
  static mergeTx(txs, tx) {
    for (let aTx of txs) {
      if (aTx.getHash() === tx.getHash()) {
        aTx.merge(tx);
        return;
      }
    }
    txs.push(tx);
  }
  
  /**
   * Convert the given JSON to a binary Uint8Array using Monero's portable storage format.
   * 
   * @param {object} json - json to convert to binary
   * @return {Promise<Uint8Array>} the json converted to portable storage binary
   */
  static async jsonToBinary(json) {
    if (MoneroUtils.PROXY_TO_WORKER) return LibraryUtils.invokeWorker(undefined, "moneroUtilsJsonToBinary", Array.from(arguments));
    
    // load keys module by default
    if (LibraryUtils.getWasmModule() === undefined) await LibraryUtils.loadKeysModule();
    
    // use wasm in queue
    return LibraryUtils.getWasmModule().queueTask(async function() {
      
      // serialize json to binary which is stored in c++ heap
      let binMemInfoStr = LibraryUtils.getWasmModule().malloc_binary_from_json(JSON.stringify(json));
      
      // sanitize binary memory address info
      let binMemInfo = JSON.parse(binMemInfoStr);
      binMemInfo.ptr = parseInt(binMemInfo.ptr);
      binMemInfo.length = parseInt(binMemInfo.length);
      
      // read binary data from heap to Uint8Array
      let view = new Uint8Array(binMemInfo.length);
      for (let i = 0; i < binMemInfo.length; i++) {
        view[i] = LibraryUtils.getWasmModule().HEAPU8[binMemInfo.ptr / Uint8Array.BYTES_PER_ELEMENT + i];
      }
      
      // free binary on heap
      LibraryUtils.getWasmModule()._free(binMemInfo.ptr);
      
      // return json from binary data
      return view;
    });
  }
  
  /**
   * Convert the given portable storage binary to JSON.
   * 
   * @param {Uint8Array} uint8arr - binary data in Monero's portable storage format
   * @return {Promise<object>} JSON object converted from the binary data
   */
  static async binaryToJson(uint8arr) {
    if (MoneroUtils.PROXY_TO_WORKER) return LibraryUtils.invokeWorker(undefined, "moneroUtilsBinaryToJson", Array.from(arguments));
    
    // load keys module by default
    if (LibraryUtils.getWasmModule() === undefined) await LibraryUtils.loadKeysModule();
    
    // use wasm in queue
    return LibraryUtils.getWasmModule().queueTask(async function() {
      
      // allocate space in c++ heap for binary
      let ptr = LibraryUtils.getWasmModule()._malloc(uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
      let heap = new Uint8Array(LibraryUtils.getWasmModule().HEAPU8.buffer, ptr, uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
      if (ptr !== heap.byteOffset) throw new MoneroError("Memory ptr !== heap.byteOffset"); // should be equal
      
      // write binary to heap
      heap.set(new Uint8Array(uint8arr.buffer));
      
      // create object with binary memory address info
      let binMemInfo = { ptr: ptr, length: uint8arr.length };
      
      // convert binary to json str
      const ret_string = LibraryUtils.getWasmModule().binary_to_json(JSON.stringify(binMemInfo));
      
      // free binary on heap
      LibraryUtils.getWasmModule()._free(ptr);
      
      // parse and return json
      return JSON.parse(ret_string);
    });
  }
  
  /**
   * Convert the binary response from daemon RPC block retrieval to JSON.
   * 
   * @param {Uint8Array} uint8arr - binary response from daemon RPC when getting blocks
   * @return {Promise<object>} JSON object with the blocks data
   */
  static async binaryBlocksToJson(uint8arr) {
    if (MoneroUtils.PROXY_TO_WORKER) return LibraryUtils.invokeWorker(undefined, "moneroUtilsBinaryBlocksToJson", Array.from(arguments));
    
    // load keys module by default
    if (LibraryUtils.getWasmModule() === undefined) await LibraryUtils.loadKeysModule();
    
    // use wasm in queue
    return LibraryUtils.getWasmModule().queueTask(async function() {
      
      // allocate space in c++ heap for binary
      let ptr = LibraryUtils.getWasmModule()._malloc(uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
      let heap = new Uint8Array(LibraryUtils.getWasmModule().HEAPU8.buffer, ptr, uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
      if (ptr !== heap.byteOffset) throw new MoneroError("Memory ptr !== heap.byteOffset"); // should be equal
      
      // write binary to heap
      heap.set(new Uint8Array(uint8arr.buffer));
      
      // create object with binary memory address info
      let binMemInfo = { ptr: ptr, length: uint8arr.length  }

      // convert binary to json str
      const json_str = LibraryUtils.getWasmModule().binary_blocks_to_json(JSON.stringify(binMemInfo));
      
      // free memory
      LibraryUtils.getWasmModule()._free(ptr);
      
      // parse result to json
      let json = JSON.parse(json_str);                                          // parsing json gives arrays of block and tx strings
      json.blocks = json.blocks.map(blockStr => JSON.parse(blockStr));          // replace block strings with parsed blocks
      json.txs = json.txs.map(txs => txs ? txs.map(tx => JSON.parse(tx.replace(",", "{") + "}")) : []); // modify tx string to proper json and parse // TODO: more efficient way than this json manipulation?
      return json;
    });
  }
  
  /**
   * Convert XMR to atomic units.
   * 
   * @param {number|string} amountXmr - amount in XMR to convert to atomic units
   * @return {BigInteger} amount in atomic units
   */
  static xmrToAtomicUnits(amountXmr) {
    if (typeof amountXmr === "number") amountXmr = "" + amountXmr;
    else if (typeof amountXmr !== "string") throw new MoneroError("Must provide XMR amount as a string or js number to convert to atomic units");
    let decimalDivisor = 1;
    let decimalIdx = amountXmr.indexOf('.');
    if (decimalIdx > -1) {
      decimalDivisor = Math.pow(10, amountXmr.length - decimalIdx - 1);
      amountXmr = amountXmr.slice(0, decimalIdx) + amountXmr.slice(decimalIdx + 1);
    }
    return new BigInteger(amountXmr).multiply(new BigInteger(MoneroUtils.AU_PER_XMR)).divide(new BigInteger(decimalDivisor));
  }
  
  /**
   * Convert atomic units to XMR.
   * 
   * @param {BigInteger|string} amountAtomicUnits - amount in atomic units to convert to XMR
   * @return {number} amount in XMR 
   */
  static atomicUnitsToXmr(amountAtomicUnits) {
    if (typeof amountAtomicUnits === "string") amountAtomicUnits = new BigInteger(amountAtomicUnits);
    else if (!(amountAtomicUnits instanceof BigInteger)) throw new MoneroError("Must provide atomic units as BigInteger or string to convert to XMR");
    let quotientAndRemainder = amountAtomicUnits.divRem(new BigInteger(MoneroUtils.AU_PER_XMR));
    return Number(quotientAndRemainder[0].toJSValue() + quotientAndRemainder[1].toJSValue() / MoneroUtils.AU_PER_XMR);
  }
  
  static _isHex64(str) {
    return typeof str === "string" && str.length === 64 && GenUtils.isHex(str);
  }
}

MoneroUtils.PROXY_TO_WORKER = true;
MoneroUtils.NUM_MNEMONIC_WORDS = 25;
MoneroUtils.RING_SIZE = 12;
MoneroUtils.MAX_REQUESTS_PER_SECOND = 50;
MoneroUtils.AU_PER_XMR = 1000000000000;

module.exports = MoneroUtils;