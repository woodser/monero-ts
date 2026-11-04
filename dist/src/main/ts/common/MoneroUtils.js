"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _assert = _interopRequireDefault(require("assert"));
var _decimal = _interopRequireDefault(require("decimal.js"));
var _GenUtils = _interopRequireDefault(require("./GenUtils"));
var _LibraryUtils = _interopRequireDefault(require("./LibraryUtils"));
var _MoneroError = _interopRequireDefault(require("./MoneroError"));
var _MoneroIntegratedAddress = _interopRequireDefault(require("../wallet/model/MoneroIntegratedAddress"));
var _MoneroNetworkType = _interopRequireDefault(require("../daemon/model/MoneroNetworkType"));


/**
 * Collection of Monero utilities. Runs in a worker thread by default.
 */
class MoneroUtils {

  // static variables
  static PROXY_TO_WORKER = false;
  static NUM_MNEMONIC_WORDS = 25;
  static AU_PER_XMR = 1000000000000n;
  static RING_SIZE = 16;

  /**
   * <p>Get the version of the monero-ts library.<p>
   * 
   * @return {string} the version of this monero-ts library
   */
  static getVersion() {
    return "0.11.21";
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
    (0, _assert.default)(mnemonic, "Mnemonic phrase is not initialized");
    let words = mnemonic.split(" ");
    if (words.length !== MoneroUtils.NUM_MNEMONIC_WORDS) throw new _MoneroError.default("Mnemonic phrase is " + words.length + " words but must be " + MoneroUtils.NUM_MNEMONIC_WORDS);
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
    if (!MoneroUtils.isHex64(privateViewKey)) throw new _MoneroError.default("private view key expected to be 64 hex characters");
  }

  /**
   * Validate the given public view key, throw an error if invalid.
   *
   * @param {string} publicViewKey - public view key to validate
   */
  static async validatePublicViewKey(publicViewKey) {
    if (!MoneroUtils.isHex64(publicViewKey)) throw new _MoneroError.default("public view key expected to be 64 hex characters");
  }

  /**
   * Validate the given private spend key, throw an error if invalid.
   *
   * @param {string} privateSpendKey - private spend key to validate
   */
  static async validatePrivateSpendKey(privateSpendKey) {
    if (!MoneroUtils.isHex64(privateSpendKey)) throw new _MoneroError.default("private spend key expected to be 64 hex characters");
  }

  /**
   * Validate the given public spend key, throw an error if invalid.
   *
   * @param {string} publicSpendKey - public spend key to validate
   */
  static async validatePublicSpendKey(publicSpendKey) {
    if (!MoneroUtils.isHex64(publicSpendKey)) throw new _MoneroError.default("public spend key expected to be 64 hex characters");
  }

  /**
   * Get an integrated address.
   * 
   * @param {MoneroNetworkType} networkType - network type of the integrated address
   * @param {string} standardAddress - address to derive the integrated address from
   * @param {string} [paymentId] - optionally specifies the integrated address's payment id (defaults to random payment id)
   * @return {Promise<MoneroIntegratedAddress>} the integrated address
   */
  static async getIntegratedAddress(networkType, standardAddress, paymentId) {
    if (MoneroUtils.PROXY_TO_WORKER) return new _MoneroIntegratedAddress.default(await _LibraryUtils.default.invokeWorker(undefined, "moneroUtilsGetIntegratedAddress", Array.from(arguments)));

    // validate inputs
    _MoneroNetworkType.default.validate(networkType);
    (0, _assert.default)(typeof standardAddress === "string", "Address is not string");
    (0, _assert.default)(standardAddress.length > 0, "Address is empty");
    (0, _assert.default)(_GenUtils.default.isBase58(standardAddress), "Address is not base 58");

    // load keys module by default
    if (_LibraryUtils.default.getWasmModule() === undefined) await _LibraryUtils.default.loadWasmModule();

    // get integrated address in queue
    return _LibraryUtils.default.getWasmModule().queueTask(async () => {
      let integratedAddressJson = _LibraryUtils.default.getWasmModule().get_integrated_address_util(networkType, standardAddress, paymentId ? paymentId : "");
      if (integratedAddressJson.charAt(0) !== '{') throw new _MoneroError.default(integratedAddressJson);
      return new _MoneroIntegratedAddress.default(JSON.parse(integratedAddressJson));
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
    if (MoneroUtils.PROXY_TO_WORKER) return _LibraryUtils.default.invokeWorker(undefined, "moneroUtilsValidateAddress", Array.from(arguments));

    // validate inputs
    (0, _assert.default)(typeof address === "string", "Address is not string");
    (0, _assert.default)(address.length > 0, "Address is empty");
    (0, _assert.default)(_GenUtils.default.isBase58(address), "Address is not base 58");
    networkType = _MoneroNetworkType.default.from(networkType);

    // load keys module by default
    if (_LibraryUtils.default.getWasmModule() === undefined) await _LibraryUtils.default.loadWasmModule();

    // validate address in queue
    return _LibraryUtils.default.getWasmModule().queueTask(async function () {
      let errMsg = _LibraryUtils.default.getWasmModule().validate_address(address, networkType);
      if (errMsg) throw new _MoneroError.default(errMsg);
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
    _assert.default.equal(typeof paymentId, "string");
    (0, _assert.default)(paymentId.length === 16 || paymentId.length === 64);
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
        i += 1 + txExtra[i + 1]; // advance to next tag
      } else if (tag === 1) {
        lastPubKeyIdx = i + 1;
        i += 1 + 32; // advance to next tag
      } else throw new _MoneroError.default("Invalid sub-field tag: " + tag);
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
    if (MoneroUtils.PROXY_TO_WORKER) return _LibraryUtils.default.invokeWorker(undefined, "moneroUtilsJsonToBinary", Array.from(arguments));

    // load keys module by default
    if (_LibraryUtils.default.getWasmModule() === undefined) await _LibraryUtils.default.loadWasmModule();

    // use wasm in queue
    return _LibraryUtils.default.getWasmModule().queueTask(async function () {

      // serialize json to binary which is stored in c++ heap
      let binMemInfoStr = _LibraryUtils.default.getWasmModule().malloc_binary_from_json(JSON.stringify(json));

      // sanitize binary memory address info
      let binMemInfo = JSON.parse(binMemInfoStr);
      binMemInfo.ptr = parseInt(binMemInfo.ptr);
      binMemInfo.length = parseInt(binMemInfo.length);

      // read binary data from heap to Uint8Array
      let view = new Uint8Array(binMemInfo.length);
      for (let i = 0; i < binMemInfo.length; i++) {
        view[i] = _LibraryUtils.default.getWasmModule().HEAPU8[binMemInfo.ptr / Uint8Array.BYTES_PER_ELEMENT + i];
      }

      // free binary on heap
      _LibraryUtils.default.getWasmModule()._free(binMemInfo.ptr);

      // return json from binary data
      return view;
    });
  }

  /**
   * Serialize a get_hashes.bin request using Monero Core's binary serialization.
   *
   * @param {string[]} blockHashes - known block hashes in hexadecimal format
   * @param {number} startHeight - starting block height
   * @return {Promise<Uint8Array>} request serialized to portable storage binary
   */
  static async getHashesRequestToBinary(
  blockHashes,
  startHeight)
  {
    if (!Number.isSafeInteger(startHeight) || startHeight < 0) {
      throw new _MoneroError.default("Invalid start height");
    }

    if (_LibraryUtils.default.getWasmModule() === undefined) {
      await _LibraryUtils.default.loadWasmModule();
    }

    return _LibraryUtils.default.getWasmModule().queueTask(async function () {
      const wasm = _LibraryUtils.default.getWasmModule();

      const memInfoStr = wasm.malloc_binary_get_hashes_request(
        JSON.stringify({
          block_hashes: blockHashes,
          start_height: startHeight
        })
      );

      const memInfo = JSON.parse(memInfoStr);
      const ptr = Number(memInfo.ptr);
      const length = Number(memInfo.length);

      try {
        // Copy the binary data before freeing the WASM allocation.
        return new Uint8Array(
          wasm.HEAPU8.subarray(ptr, ptr + length)
        );
      } finally {
        wasm._free(ptr);
      }
    });
  }

  /**
   * Convert the given portable storage binary to JSON.
   * 
   * @param {Uint8Array} uint8arr - binary data in Monero's portable storage format
   * @return {Promise<object>} JSON object converted from the binary data
   */
  static async binaryToJson(uint8arr) {
    if (MoneroUtils.PROXY_TO_WORKER) return _LibraryUtils.default.invokeWorker(undefined, "moneroUtilsBinaryToJson", Array.from(arguments));

    // load keys module by default
    if (_LibraryUtils.default.getWasmModule() === undefined) await _LibraryUtils.default.loadWasmModule();

    // use wasm in queue
    return _LibraryUtils.default.getWasmModule().queueTask(async function () {

      // allocate space in c++ heap for binary
      let ptr = _LibraryUtils.default.getWasmModule()._malloc(uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
      let heap = new Uint8Array(_LibraryUtils.default.getWasmModule().HEAPU8.buffer, ptr, uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
      if (ptr !== heap.byteOffset) throw new _MoneroError.default("Memory ptr !== heap.byteOffset"); // should be equal

      // write binary to heap
      heap.set(new Uint8Array(uint8arr.buffer));

      // create object with binary memory address info
      let binMemInfo = { ptr: ptr, length: uint8arr.length };

      // convert binary to json str
      const ret_string = _LibraryUtils.default.getWasmModule().binary_to_json(JSON.stringify(binMemInfo));

      // free binary on heap
      _LibraryUtils.default.getWasmModule()._free(ptr);

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
    if (MoneroUtils.PROXY_TO_WORKER) return _LibraryUtils.default.invokeWorker(undefined, "moneroUtilsBinaryBlocksToJson", Array.from(arguments));

    // load keys module by default
    if (_LibraryUtils.default.getWasmModule() === undefined) await _LibraryUtils.default.loadWasmModule();

    // use wasm in queue
    return _LibraryUtils.default.getWasmModule().queueTask(async function () {

      // allocate space in c++ heap for binary
      let ptr = _LibraryUtils.default.getWasmModule()._malloc(uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
      let heap = new Uint8Array(_LibraryUtils.default.getWasmModule().HEAPU8.buffer, ptr, uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
      if (ptr !== heap.byteOffset) throw new _MoneroError.default("Memory ptr !== heap.byteOffset"); // should be equal

      // write binary to heap
      heap.set(new Uint8Array(uint8arr.buffer));

      // create object with binary memory address info
      let binMemInfo = { ptr: ptr, length: uint8arr.length };

      // convert binary to json str
      const json_str = _LibraryUtils.default.getWasmModule().binary_blocks_to_json(JSON.stringify(binMemInfo));

      // free memory
      _LibraryUtils.default.getWasmModule()._free(ptr);

      // parse result to json
      let json = JSON.parse(json_str); // parsing json gives arrays of block and tx strings
      json.blocks = json.blocks.map((blockStr) => JSON.parse(blockStr)); // replace block strings with parsed blocks
      json.txs = json.txs.map((txs) => txs ? txs.map((tx) => JSON.parse(tx.replace(",", "{") + "}")) : []); // modify tx string to proper json and parse // TODO: more efficient way than this json manipulation?
      return json;
    });
  }

  /**
   * Deserialize a get_hashes.bin response using Monero Core.
   *
   * @param {Uint8Array} binary - binary response in portable storage format
   * @return {Promise<object>} decoded response with hexadecimal block hashes
   */
  static async binaryHashesToJson(
  binary)





  {
    if (_LibraryUtils.default.getWasmModule() === undefined) {
      await _LibraryUtils.default.loadWasmModule();
    }

    return _LibraryUtils.default.getWasmModule().queueTask(async function () {
      const wasm = _LibraryUtils.default.getWasmModule();

      const ptr = wasm._malloc(binary.byteLength);
      if (!ptr) throw new _MoneroError.default("Failed to allocate binary response");

      try {
        // Copy the binary response to WASM memory.
        wasm.HEAPU8.set(binary, ptr);

        const memInfo = {
          ptr: ptr,
          length: binary.byteLength
        };

        const json = wasm.binary_hashes_to_json(
          JSON.stringify(memInfo)
        );

        return JSON.parse(json);
      } finally {
        wasm._free(ptr);
      }
    });
  }

  /**
   * Convert XMR to atomic units.
   * 
   * @param {number | string} amountXmr - amount in XMR to convert to atomic units
   * @return {bigint} amount in atomic units
   */
  static xmrToAtomicUnits(amountXmr) {
    return BigInt(new _decimal.default(amountXmr).mul(MoneroUtils.AU_PER_XMR.toString()).toDecimalPlaces(0, _decimal.default.ROUND_HALF_UP).toFixed(0));
  }

  /**
   * Convert atomic units to XMR.
   * 
   * @param {bigint | string} amountAtomicUnits - amount in atomic units to convert to XMR
   * @return {number} amount in XMR 
   */
  static atomicUnitsToXmr(amountAtomicUnits) {
    return new _decimal.default(amountAtomicUnits.toString()).div(MoneroUtils.AU_PER_XMR.toString()).toDecimalPlaces(12, _decimal.default.ROUND_HALF_UP).toNumber();
  }

  /**
   * Divide one atomic units by another.
   * 
   * @param {bigint} au1 dividend
   * @param {bigint} au2 divisor
   * @returns {number} the result
   */
  static divide(au1, au2) {
    return new _decimal.default(au1.toString()).div(new _decimal.default(au2.toString())).toDecimalPlaces(12, _decimal.default.ROUND_HALF_UP).toNumber();
  }

  /**
   * Multiply a bigint by a number or bigint.
   * 
   * @param a bigint to multiply
   * @param b bigint or number to multiply by
   * @returns the product as a bigint
   */
  static multiply(a, b) {
    return BigInt(new _decimal.default(a.toString()).mul(new _decimal.default(b.toString())).toDecimalPlaces(0, _decimal.default.ROUND_HALF_UP).toString());
  }

  static isHex64(str) {
    return typeof str === "string" && str.length === 64 && _GenUtils.default.isHex(str);
  }

  /**
   * Determine if the given unlock time is a timestamp or block height.
   * 
   * @param unlockTime is the unlock time to check
   * @return {boolean} true if the unlock time is a timestamp, false if a block height
   */
  static isTimestamp(unlockTime) {

    // threshold for distinguishing between timestamp and block height
    // current block height is around 3 million, current unix timestamp is around 1.7 billion
    const threshold = 500000000n;

    return unlockTime >= threshold;
  }
}exports.default = MoneroUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfZGVjaW1hbCIsIl9HZW5VdGlscyIsIl9MaWJyYXJ5VXRpbHMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJNb25lcm9VdGlscyIsIlBST1hZX1RPX1dPUktFUiIsIk5VTV9NTkVNT05JQ19XT1JEUyIsIkFVX1BFUl9YTVIiLCJSSU5HX1NJWkUiLCJnZXRWZXJzaW9uIiwic2V0UHJveHlUb1dvcmtlciIsInByb3h5VG9Xb3JrZXIiLCJ2YWxpZGF0ZU1uZW1vbmljIiwibW5lbW9uaWMiLCJhc3NlcnQiLCJ3b3JkcyIsInNwbGl0IiwibGVuZ3RoIiwiTW9uZXJvRXJyb3IiLCJpc1ZhbGlkUHJpdmF0ZVZpZXdLZXkiLCJwcml2YXRlVmlld0tleSIsInZhbGlkYXRlUHJpdmF0ZVZpZXdLZXkiLCJlIiwiaXNWYWxpZFB1YmxpY1ZpZXdLZXkiLCJwdWJsaWNWaWV3S2V5IiwidmFsaWRhdGVQdWJsaWNWaWV3S2V5IiwiaXNWYWxpZFByaXZhdGVTcGVuZEtleSIsInByaXZhdGVTcGVuZEtleSIsInZhbGlkYXRlUHJpdmF0ZVNwZW5kS2V5IiwiaXNWYWxpZFB1YmxpY1NwZW5kS2V5IiwicHVibGljU3BlbmRLZXkiLCJ2YWxpZGF0ZVB1YmxpY1NwZW5kS2V5IiwiaXNIZXg2NCIsImdldEludGVncmF0ZWRBZGRyZXNzIiwibmV0d29ya1R5cGUiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIkxpYnJhcnlVdGlscyIsImludm9rZVdvcmtlciIsInVuZGVmaW5lZCIsIkFycmF5IiwiZnJvbSIsImFyZ3VtZW50cyIsIk1vbmVyb05ldHdvcmtUeXBlIiwidmFsaWRhdGUiLCJHZW5VdGlscyIsImlzQmFzZTU4IiwiZ2V0V2FzbU1vZHVsZSIsImxvYWRXYXNtTW9kdWxlIiwicXVldWVUYXNrIiwiaW50ZWdyYXRlZEFkZHJlc3NKc29uIiwiZ2V0X2ludGVncmF0ZWRfYWRkcmVzc191dGlsIiwiY2hhckF0IiwiSlNPTiIsInBhcnNlIiwiaXNWYWxpZEFkZHJlc3MiLCJhZGRyZXNzIiwidmFsaWRhdGVBZGRyZXNzIiwiZXJyIiwiZXJyTXNnIiwidmFsaWRhdGVfYWRkcmVzcyIsImlzVmFsaWRQYXltZW50SWQiLCJ2YWxpZGF0ZVBheW1lbnRJZCIsImVxdWFsIiwiZ2V0TGFzdFR4UHViS2V5IiwidHhFeHRyYSIsImxhc3RQdWJLZXlJZHgiLCJpIiwidGFnIiwiQnVmZmVyIiwiVWludDhBcnJheSIsInNsaWNlIiwidG9TdHJpbmciLCJwYXltZW50SWRzRXF1YWwiLCJwYXltZW50SWQxIiwicGF5bWVudElkMiIsIm1heExlbmd0aCIsIk1hdGgiLCJtYXgiLCJtZXJnZVR4IiwidHhzIiwidHgiLCJhVHgiLCJnZXRIYXNoIiwibWVyZ2UiLCJwdXNoIiwianNvblRvQmluYXJ5IiwianNvbiIsImJpbk1lbUluZm9TdHIiLCJtYWxsb2NfYmluYXJ5X2Zyb21fanNvbiIsInN0cmluZ2lmeSIsImJpbk1lbUluZm8iLCJwdHIiLCJwYXJzZUludCIsInZpZXciLCJIRUFQVTgiLCJCWVRFU19QRVJfRUxFTUVOVCIsIl9mcmVlIiwiZ2V0SGFzaGVzUmVxdWVzdFRvQmluYXJ5IiwiYmxvY2tIYXNoZXMiLCJzdGFydEhlaWdodCIsIk51bWJlciIsImlzU2FmZUludGVnZXIiLCJ3YXNtIiwibWVtSW5mb1N0ciIsIm1hbGxvY19iaW5hcnlfZ2V0X2hhc2hlc19yZXF1ZXN0IiwiYmxvY2tfaGFzaGVzIiwic3RhcnRfaGVpZ2h0IiwibWVtSW5mbyIsInN1YmFycmF5IiwiYmluYXJ5VG9Kc29uIiwidWludDhhcnIiLCJfbWFsbG9jIiwiaGVhcCIsImJ1ZmZlciIsImJ5dGVPZmZzZXQiLCJzZXQiLCJyZXRfc3RyaW5nIiwiYmluYXJ5X3RvX2pzb24iLCJiaW5hcnlCbG9ja3NUb0pzb24iLCJqc29uX3N0ciIsImJpbmFyeV9ibG9ja3NfdG9fanNvbiIsImJsb2NrcyIsIm1hcCIsImJsb2NrU3RyIiwicmVwbGFjZSIsImJpbmFyeUhhc2hlc1RvSnNvbiIsImJpbmFyeSIsImJ5dGVMZW5ndGgiLCJiaW5hcnlfaGFzaGVzX3RvX2pzb24iLCJ4bXJUb0F0b21pY1VuaXRzIiwiYW1vdW50WG1yIiwiQmlnSW50IiwiRGVjaW1hbCIsIm11bCIsInRvRGVjaW1hbFBsYWNlcyIsIlJPVU5EX0hBTEZfVVAiLCJ0b0ZpeGVkIiwiYXRvbWljVW5pdHNUb1htciIsImFtb3VudEF0b21pY1VuaXRzIiwiZGl2IiwidG9OdW1iZXIiLCJkaXZpZGUiLCJhdTEiLCJhdTIiLCJtdWx0aXBseSIsImEiLCJiIiwic3RyIiwiaXNIZXgiLCJpc1RpbWVzdGFtcCIsInVubG9ja1RpbWUiLCJ0aHJlc2hvbGQiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9VdGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBEZWNpbWFsIGZyb20gJ2RlY2ltYWwuanMnO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBDb25uZWN0aW9uVHlwZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL0Nvbm5lY3Rpb25UeXBlXCI7XG5cbi8qKlxuICogQ29sbGVjdGlvbiBvZiBNb25lcm8gdXRpbGl0aWVzLiBSdW5zIGluIGEgd29ya2VyIHRocmVhZCBieSBkZWZhdWx0LlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9VdGlscyB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBzdGF0aWMgUFJPWFlfVE9fV09SS0VSID0gZmFsc2U7XG4gIHN0YXRpYyBOVU1fTU5FTU9OSUNfV09SRFMgPSAyNTtcbiAgc3RhdGljIEFVX1BFUl9YTVIgPSAxMDAwMDAwMDAwMDAwbjtcbiAgc3RhdGljIFJJTkdfU0laRSA9IDE2O1xuXG4gIC8qKlxuICAgKiA8cD5HZXQgdGhlIHZlcnNpb24gb2YgdGhlIG1vbmVyby10cyBsaWJyYXJ5LjxwPlxuICAgKiBcbiAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgdmVyc2lvbiBvZiB0aGlzIG1vbmVyby10cyBsaWJyYXJ5XG4gICAqL1xuICBzdGF0aWMgZ2V0VmVyc2lvbigpIHtcbiAgICByZXR1cm4gXCIwLjExLjIxXCI7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFbmFibGUgb3IgZGlzYWJsZSBwcm94eWluZyB0aGVzZSB1dGlsaXRpZXMgdG8gYSB3b3JrZXIgdGhyZWFkLlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBwcm94eVRvV29ya2VyIC0gc3BlY2lmaWVzIGlmIHV0aWxpdGllcyBzaG91bGQgYmUgcHJveGllZCB0byBhIHdvcmtlclxuICAgKi9cbiAgc3RhdGljIHNldFByb3h5VG9Xb3JrZXIocHJveHlUb1dvcmtlcikge1xuICAgIE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUiA9IHByb3h5VG9Xb3JrZXIgfHwgZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIG1uZW1vbmljLCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKlxuICAgKiBUT0RPOiBpbXByb3ZlIHZhbGlkYXRpb24sIHVzZSBuZXR3b3JrIHR5cGVcbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtbmVtb25pYyAtIG1uZW1vbmljIHRvIHZhbGlkYXRlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVNbmVtb25pYyhtbmVtb25pYykge1xuICAgIGFzc2VydChtbmVtb25pYywgXCJNbmVtb25pYyBwaHJhc2UgaXMgbm90IGluaXRpYWxpemVkXCIpO1xuICAgIGxldCB3b3JkcyA9IG1uZW1vbmljLnNwbGl0KFwiIFwiKTtcbiAgICBpZiAod29yZHMubGVuZ3RoICE9PSBNb25lcm9VdGlscy5OVU1fTU5FTU9OSUNfV09SRFMpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1uZW1vbmljIHBocmFzZSBpcyBcIiArIHdvcmRzLmxlbmd0aCArIFwiIHdvcmRzIGJ1dCBtdXN0IGJlIFwiICsgTW9uZXJvVXRpbHMuTlVNX01ORU1PTklDX1dPUkRTKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiBhIHByaXZhdGUgdmlldyBrZXkgaXMgdmFsaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJpdmF0ZVZpZXdLZXkgaXMgdGhlIHByaXZhdGUgdmlldyBrZXkgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sPn0gdHJ1ZSBpZiB0aGUgcHJpdmF0ZSB2aWV3IGtleSBpcyB2YWxpZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaXNWYWxpZFByaXZhdGVWaWV3S2V5KHByaXZhdGVWaWV3S2V5KSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IE1vbmVyb1V0aWxzLnZhbGlkYXRlUHJpdmF0ZVZpZXdLZXkocHJpdmF0ZVZpZXdLZXkpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiBhIHB1YmxpYyB2aWV3IGtleSBpcyB2YWxpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdWJsaWNWaWV3S2V5IGlzIHRoZSBwdWJsaWMgdmlldyBrZXkgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sPn0gdHJ1ZSBpZiB0aGUgcHVibGljIHZpZXcga2V5IGlzIHZhbGlkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpc1ZhbGlkUHVibGljVmlld0tleShwdWJsaWNWaWV3S2V5KSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IE1vbmVyb1V0aWxzLnZhbGlkYXRlUHVibGljVmlld0tleShwdWJsaWNWaWV3S2V5KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgYSBwcml2YXRlIHNwZW5kIGtleSBpcyB2YWxpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcml2YXRlU3BlbmRLZXkgaXMgdGhlIHByaXZhdGUgc3BlbmQga2V5IHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbD59IHRydWUgaWYgdGhlIHByaXZhdGUgc3BlbmQga2V5IGlzIHZhbGlkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpc1ZhbGlkUHJpdmF0ZVNwZW5kS2V5KHByaXZhdGVTcGVuZEtleSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZVByaXZhdGVTcGVuZEtleShwcml2YXRlU3BlbmRLZXkpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiBhIHB1YmxpYyBzcGVuZCBrZXkgaXMgdmFsaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVibGljU3BlbmRLZXkgaXMgdGhlIHB1YmxpYyBzcGVuZCBrZXkgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sPn0gdHJ1ZSBpZiB0aGUgcHVibGljIHNwZW5kIGtleSBpcyB2YWxpZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaXNWYWxpZFB1YmxpY1NwZW5kS2V5KHB1YmxpY1NwZW5kS2V5KSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IE1vbmVyb1V0aWxzLnZhbGlkYXRlUHVibGljU3BlbmRLZXkocHVibGljU3BlbmRLZXkpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBwcml2YXRlIHZpZXcga2V5LCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJpdmF0ZVZpZXdLZXkgLSBwcml2YXRlIHZpZXcga2V5IHRvIHZhbGlkYXRlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVQcml2YXRlVmlld0tleShwcml2YXRlVmlld0tleSkge1xuICAgIGlmICghTW9uZXJvVXRpbHMuaXNIZXg2NChwcml2YXRlVmlld0tleSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcInByaXZhdGUgdmlldyBrZXkgZXhwZWN0ZWQgdG8gYmUgNjQgaGV4IGNoYXJhY3RlcnNcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gcHVibGljIHZpZXcga2V5LCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVibGljVmlld0tleSAtIHB1YmxpYyB2aWV3IGtleSB0byB2YWxpZGF0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlUHVibGljVmlld0tleShwdWJsaWNWaWV3S2V5KSB7XG4gICAgaWYgKCFNb25lcm9VdGlscy5pc0hleDY0KHB1YmxpY1ZpZXdLZXkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJwdWJsaWMgdmlldyBrZXkgZXhwZWN0ZWQgdG8gYmUgNjQgaGV4IGNoYXJhY3RlcnNcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gcHJpdmF0ZSBzcGVuZCBrZXksIHRocm93IGFuIGVycm9yIGlmIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcml2YXRlU3BlbmRLZXkgLSBwcml2YXRlIHNwZW5kIGtleSB0byB2YWxpZGF0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlUHJpdmF0ZVNwZW5kS2V5KHByaXZhdGVTcGVuZEtleSkge1xuICAgIGlmICghTW9uZXJvVXRpbHMuaXNIZXg2NChwcml2YXRlU3BlbmRLZXkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJwcml2YXRlIHNwZW5kIGtleSBleHBlY3RlZCB0byBiZSA2NCBoZXggY2hhcmFjdGVyc1wiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBwdWJsaWMgc3BlbmQga2V5LCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVibGljU3BlbmRLZXkgLSBwdWJsaWMgc3BlbmQga2V5IHRvIHZhbGlkYXRlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVQdWJsaWNTcGVuZEtleShwdWJsaWNTcGVuZEtleSkge1xuICAgIGlmICghTW9uZXJvVXRpbHMuaXNIZXg2NChwdWJsaWNTcGVuZEtleSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcInB1YmxpYyBzcGVuZCBrZXkgZXhwZWN0ZWQgdG8gYmUgNjQgaGV4IGNoYXJhY3RlcnNcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYW4gaW50ZWdyYXRlZCBhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9OZXR3b3JrVHlwZX0gbmV0d29ya1R5cGUgLSBuZXR3b3JrIHR5cGUgb2YgdGhlIGludGVncmF0ZWQgYWRkcmVzc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhbmRhcmRBZGRyZXNzIC0gYWRkcmVzcyB0byBkZXJpdmUgdGhlIGludGVncmF0ZWQgYWRkcmVzcyBmcm9tXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcGF5bWVudElkXSAtIG9wdGlvbmFsbHkgc3BlY2lmaWVzIHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3MncyBwYXltZW50IGlkIChkZWZhdWx0cyB0byByYW5kb20gcGF5bWVudCBpZClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz59IHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3NcbiAgICovXG4gIHN0YXRpYyBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhuZXR3b3JrVHlwZTogTW9uZXJvTmV0d29ya1R5cGUsIHN0YW5kYXJkQWRkcmVzczogc3RyaW5nLCBwYXltZW50SWQ/OiBzdHJpbmcpIHtcbiAgICBpZiAoTW9uZXJvVXRpbHMuUFJPWFlfVE9fV09SS0VSKSByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodW5kZWZpbmVkLCBcIm1vbmVyb1V0aWxzR2V0SW50ZWdyYXRlZEFkZHJlc3NcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIFxuICAgIC8vIHZhbGlkYXRlIGlucHV0c1xuICAgIE1vbmVyb05ldHdvcmtUeXBlLnZhbGlkYXRlKG5ldHdvcmtUeXBlKTtcbiAgICBhc3NlcnQodHlwZW9mIHN0YW5kYXJkQWRkcmVzcyA9PT0gXCJzdHJpbmdcIiwgXCJBZGRyZXNzIGlzIG5vdCBzdHJpbmdcIik7XG4gICAgYXNzZXJ0KHN0YW5kYXJkQWRkcmVzcy5sZW5ndGggPiAwLCBcIkFkZHJlc3MgaXMgZW1wdHlcIik7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzQmFzZTU4KHN0YW5kYXJkQWRkcmVzcyksIFwiQWRkcmVzcyBpcyBub3QgYmFzZSA1OFwiKTtcbiAgICBcbiAgICAvLyBsb2FkIGtleXMgbW9kdWxlIGJ5IGRlZmF1bHRcbiAgICBpZiAoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSA9PT0gdW5kZWZpbmVkKSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyBnZXQgaW50ZWdyYXRlZCBhZGRyZXNzIGluIHF1ZXVlXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIGxldCBpbnRlZ3JhdGVkQWRkcmVzc0pzb24gPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLmdldF9pbnRlZ3JhdGVkX2FkZHJlc3NfdXRpbChuZXR3b3JrVHlwZSwgc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQgPyBwYXltZW50SWQgOiBcIlwiKTtcbiAgICAgIGlmIChpbnRlZ3JhdGVkQWRkcmVzc0pzb24uY2hhckF0KDApICE9PSAneycpIHRocm93IG5ldyBNb25lcm9FcnJvcihpbnRlZ3JhdGVkQWRkcmVzc0pzb24pO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyhKU09OLnBhcnNlKGludGVncmF0ZWRBZGRyZXNzSnNvbikpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogRGV0ZXJtaW5lIGlmIHRoZSBnaXZlbiBhZGRyZXNzIGlzIHZhbGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBhZGRyZXNzXG4gICAqIEBwYXJhbSB7TW9uZXJvTmV0d29ya1R5cGV9IG5ldHdvcmtUeXBlIC0gbmV0d29yayB0eXBlIG9mIHRoZSBhZGRyZXNzIHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIGFkZHJlc3MgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlzVmFsaWRBZGRyZXNzKGFkZHJlc3MsIG5ldHdvcmtUeXBlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IE1vbmVyb1V0aWxzLnZhbGlkYXRlQWRkcmVzcyhhZGRyZXNzLCBuZXR3b3JrVHlwZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gYWRkcmVzcywgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBhZGRyZXNzIHRvIHZhbGlkYXRlXG4gICAqIEBwYXJhbSB7TW9uZXJvTmV0d29ya1R5cGV9IG5ldHdvcmtUeXBlIC0gbmV0d29yayB0eXBlIG9mIHRoZSBhZGRyZXNzIHRvIHZhbGlkYXRlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVBZGRyZXNzKGFkZHJlc3MsIG5ldHdvcmtUeXBlKSB7XG4gICAgaWYgKE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUikgcmV0dXJuIExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodW5kZWZpbmVkLCBcIm1vbmVyb1V0aWxzVmFsaWRhdGVBZGRyZXNzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgaW5wdXRzXG4gICAgYXNzZXJ0KHR5cGVvZiBhZGRyZXNzID09PSBcInN0cmluZ1wiLCBcIkFkZHJlc3MgaXMgbm90IHN0cmluZ1wiKTtcbiAgICBhc3NlcnQoYWRkcmVzcy5sZW5ndGggPiAwLCBcIkFkZHJlc3MgaXMgZW1wdHlcIik7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzQmFzZTU4KGFkZHJlc3MpLCBcIkFkZHJlc3MgaXMgbm90IGJhc2UgNThcIik7XG4gICAgbmV0d29ya1R5cGUgPSBNb25lcm9OZXR3b3JrVHlwZS5mcm9tKG5ldHdvcmtUeXBlKTtcbiAgICBcbiAgICAvLyBsb2FkIGtleXMgbW9kdWxlIGJ5IGRlZmF1bHRcbiAgICBpZiAoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSA9PT0gdW5kZWZpbmVkKSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhZGRyZXNzIGluIHF1ZXVlXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgbGV0IGVyck1zZyA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkudmFsaWRhdGVfYWRkcmVzcyhhZGRyZXNzLCBuZXR3b3JrVHlwZSk7XG4gICAgICBpZiAoZXJyTXNnKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyTXNnKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERldGVybWluZSBpZiB0aGUgZ2l2ZW4gcGF5bWVudCBpZCBpcyB2YWxpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXltZW50SWQgLSBwYXltZW50IGlkIHRvIGRldGVybWluZSBpZiB2YWxpZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2w+fSB0cnVlIGlmIHRoZSBwYXltZW50IGlkIGlzIHZhbGlkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpc1ZhbGlkUGF5bWVudElkKHBheW1lbnRJZCkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZVBheW1lbnRJZChwYXltZW50SWQpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBwYXltZW50IGlkLCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKiBcbiAgICogVE9ETzogaW1wcm92ZSB2YWxpZGF0aW9uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF5bWVudElkIC0gcGF5bWVudCBpZCB0byB2YWxpZGF0ZSBcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZVBheW1lbnRJZChwYXltZW50SWQpIHtcbiAgICBhc3NlcnQuZXF1YWwodHlwZW9mIHBheW1lbnRJZCwgXCJzdHJpbmdcIik7XG4gICAgYXNzZXJ0KHBheW1lbnRJZC5sZW5ndGggPT09IDE2IHx8IHBheW1lbnRJZC5sZW5ndGggPT09IDY0KTtcbiAgfVxuICAgIFxuICAvKipcbiAgICogRGVjb2RlIHR4IGV4dHJhIGFjY29yZGluZyB0byBodHRwczovL2NyeXB0b25vdGUub3JnL2Nucy9jbnMwMDUudHh0IGFuZFxuICAgKiByZXR1cm5zIHRoZSBsYXN0IHR4IHB1YiBrZXkuXG4gICAqIFxuICAgKiBUT0RPOiB1c2UgYysrIGJyaWRnZSBmb3IgdGhpc1xuICAgKiBcbiAgICogQHBhcmFtIFtieXRlW11dIHR4RXh0cmEgLSBhcnJheSBvZiB0eCBleHRyYSBieXRlc1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBsYXN0IHB1YiBrZXkgYXMgYSBoZXhpZGVjaW1hbCBzdHJpbmdcbiAgICovXG4gIHN0YXRpYyBhc3luYyBnZXRMYXN0VHhQdWJLZXkodHhFeHRyYSkge1xuICAgIGxldCBsYXN0UHViS2V5SWR4O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdHhFeHRyYS5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IHRhZyA9IHR4RXh0cmFbaV07XG4gICAgICBpZiAodGFnID09PSAwIHx8IHRhZyA9PT0gMikge1xuICAgICAgICBpICs9IDEgKyB0eEV4dHJhW2kgKyAxXTsgIC8vIGFkdmFuY2UgdG8gbmV4dCB0YWdcbiAgICAgIH0gZWxzZSBpZiAodGFnID09PSAxKSB7XG4gICAgICAgIGxhc3RQdWJLZXlJZHggPSBpICsgMTtcbiAgICAgICAgaSArPSAxICsgMzI7ICAgICAgICAgICAgICAvLyBhZHZhbmNlIHRvIG5leHQgdGFnXG4gICAgICB9IGVsc2UgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBzdWItZmllbGQgdGFnOiBcIiArIHRhZyk7XG4gICAgfVxuICAgIHJldHVybiBCdWZmZXIuZnJvbShuZXcgVWludDhBcnJheSh0eEV4dHJhLnNsaWNlKGxhc3RQdWJLZXlJZHgsIGxhc3RQdWJLZXlJZHggKyAzMikpKS50b1N0cmluZyhcImhleFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdHdvIHBheW1lbnQgaWRzIGFyZSBmdW5jdGlvbmFsbHkgZXF1YWwuXG4gICAqIFxuICAgKiBGb3IgZXhhbXBsZSwgMDMyODRlNDFjMzQyZjAzMiBhbmQgMDMyODRlNDFjMzQyZjAzMjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCBhcmUgY29uc2lkZXJlZCBlcXVhbC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXltZW50SWQxIGlzIGEgcGF5bWVudCBpZCB0byBjb21wYXJlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXltZW50SWQyIGlzIGEgcGF5bWVudCBpZCB0byBjb21wYXJlXG4gICAqIEByZXR1cm4ge2Jvb2x9IHRydWUgaWYgdGhlIHBheW1lbnQgaWRzIGFyZSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgcGF5bWVudElkc0VxdWFsKHBheW1lbnRJZDEsIHBheW1lbnRJZDIpIHtcbiAgICBsZXQgbWF4TGVuZ3RoID0gTWF0aC5tYXgocGF5bWVudElkMS5sZW5ndGgsIHBheW1lbnRJZDIubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1heExlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoaSA8IHBheW1lbnRJZDEubGVuZ3RoICYmIGkgPCBwYXltZW50SWQyLmxlbmd0aCAmJiBwYXltZW50SWQxW2ldICE9PSBwYXltZW50SWQyW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoaSA+PSBwYXltZW50SWQxLmxlbmd0aCAmJiBwYXltZW50SWQyW2ldICE9PSAnMCcpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmIChpID49IHBheW1lbnRJZDIubGVuZ3RoICYmIHBheW1lbnRJZDFbaV0gIT09ICcwJykgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1lcmdlcyBhIHRyYW5zYWN0aW9uIGludG8gYSBsaXN0IG9mIGV4aXN0aW5nIHRyYW5zYWN0aW9ucy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhbXX0gdHhzIC0gZXhpc3RpbmcgdHJhbnNhY3Rpb25zIHRvIG1lcmdlIGludG9cbiAgICogQHBhcmFtIHtNb25lcm9UeH0gdHggLSB0cmFuc2FjdGlvbiB0byBtZXJnZSBpbnRvIHRoZSBsaXN0XG4gICAqL1xuICBzdGF0aWMgbWVyZ2VUeCh0eHMsIHR4KSB7XG4gICAgZm9yIChsZXQgYVR4IG9mIHR4cykge1xuICAgICAgaWYgKGFUeC5nZXRIYXNoKCkgPT09IHR4LmdldEhhc2goKSkge1xuICAgICAgICBhVHgubWVyZ2UodHgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHR4cy5wdXNoKHR4KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnQgdGhlIGdpdmVuIEpTT04gdG8gYSBiaW5hcnkgVWludDhBcnJheSB1c2luZyBNb25lcm8ncyBwb3J0YWJsZSBzdG9yYWdlIGZvcm1hdC5cbiAgICogXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBqc29uIC0ganNvbiB0byBjb252ZXJ0IHRvIGJpbmFyeVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFVpbnQ4QXJyYXk+fSB0aGUganNvbiBjb252ZXJ0ZWQgdG8gcG9ydGFibGUgc3RvcmFnZSBiaW5hcnlcbiAgICovXG4gIHN0YXRpYyBhc3luYyBqc29uVG9CaW5hcnkoanNvbikge1xuICAgIGlmIChNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIpIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJtb25lcm9VdGlsc0pzb25Ub0JpbmFyeVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIFxuICAgIC8vIGxvYWQga2V5cyBtb2R1bGUgYnkgZGVmYXVsdFxuICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpID09PSB1bmRlZmluZWQpIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIHVzZSB3YXNtIGluIHF1ZXVlXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgXG4gICAgICAvLyBzZXJpYWxpemUganNvbiB0byBiaW5hcnkgd2hpY2ggaXMgc3RvcmVkIGluIGMrKyBoZWFwXG4gICAgICBsZXQgYmluTWVtSW5mb1N0ciA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkubWFsbG9jX2JpbmFyeV9mcm9tX2pzb24oSlNPTi5zdHJpbmdpZnkoanNvbikpO1xuICAgICAgXG4gICAgICAvLyBzYW5pdGl6ZSBiaW5hcnkgbWVtb3J5IGFkZHJlc3MgaW5mb1xuICAgICAgbGV0IGJpbk1lbUluZm8gPSBKU09OLnBhcnNlKGJpbk1lbUluZm9TdHIpO1xuICAgICAgYmluTWVtSW5mby5wdHIgPSBwYXJzZUludChiaW5NZW1JbmZvLnB0cik7XG4gICAgICBiaW5NZW1JbmZvLmxlbmd0aCA9IHBhcnNlSW50KGJpbk1lbUluZm8ubGVuZ3RoKTtcbiAgICAgIFxuICAgICAgLy8gcmVhZCBiaW5hcnkgZGF0YSBmcm9tIGhlYXAgdG8gVWludDhBcnJheVxuICAgICAgbGV0IHZpZXcgPSBuZXcgVWludDhBcnJheShiaW5NZW1JbmZvLmxlbmd0aCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbk1lbUluZm8ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmlld1tpXSA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuSEVBUFU4W2Jpbk1lbUluZm8ucHRyIC8gVWludDhBcnJheS5CWVRFU19QRVJfRUxFTUVOVCArIGldO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBmcmVlIGJpbmFyeSBvbiBoZWFwXG4gICAgICBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLl9mcmVlKGJpbk1lbUluZm8ucHRyKTtcbiAgICAgIFxuICAgICAgLy8gcmV0dXJuIGpzb24gZnJvbSBiaW5hcnkgZGF0YVxuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2VyaWFsaXplIGEgZ2V0X2hhc2hlcy5iaW4gcmVxdWVzdCB1c2luZyBNb25lcm8gQ29yZSdzIGJpbmFyeSBzZXJpYWxpemF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBibG9ja0hhc2hlcyAtIGtub3duIGJsb2NrIGhhc2hlcyBpbiBoZXhhZGVjaW1hbCBmb3JtYXRcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0SGVpZ2h0IC0gc3RhcnRpbmcgYmxvY2sgaGVpZ2h0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8VWludDhBcnJheT59IHJlcXVlc3Qgc2VyaWFsaXplZCB0byBwb3J0YWJsZSBzdG9yYWdlIGJpbmFyeVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGdldEhhc2hlc1JlcXVlc3RUb0JpbmFyeShcbiAgICBibG9ja0hhc2hlczogc3RyaW5nW10sXG4gICAgc3RhcnRIZWlnaHQ6IG51bWJlclxuICApOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgICBpZiAoIU51bWJlci5pc1NhZmVJbnRlZ2VyKHN0YXJ0SGVpZ2h0KSB8fCBzdGFydEhlaWdodCA8IDApIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgc3RhcnQgaGVpZ2h0XCIpO1xuICAgIH1cblxuICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLnF1ZXVlVGFzayhhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IHdhc20gPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpO1xuXG4gICAgICBjb25zdCBtZW1JbmZvU3RyID0gd2FzbS5tYWxsb2NfYmluYXJ5X2dldF9oYXNoZXNfcmVxdWVzdChcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIGJsb2NrX2hhc2hlczogYmxvY2tIYXNoZXMsXG4gICAgICAgICAgc3RhcnRfaGVpZ2h0OiBzdGFydEhlaWdodFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgY29uc3QgbWVtSW5mbyA9IEpTT04ucGFyc2UobWVtSW5mb1N0cik7XG4gICAgICBjb25zdCBwdHIgPSBOdW1iZXIobWVtSW5mby5wdHIpO1xuICAgICAgY29uc3QgbGVuZ3RoID0gTnVtYmVyKG1lbUluZm8ubGVuZ3RoKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gQ29weSB0aGUgYmluYXJ5IGRhdGEgYmVmb3JlIGZyZWVpbmcgdGhlIFdBU00gYWxsb2NhdGlvbi5cbiAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KFxuICAgICAgICAgIHdhc20uSEVBUFU4LnN1YmFycmF5KHB0ciwgcHRyICsgbGVuZ3RoKVxuICAgICAgICApO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgd2FzbS5fZnJlZShwdHIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydCB0aGUgZ2l2ZW4gcG9ydGFibGUgc3RvcmFnZSBiaW5hcnkgdG8gSlNPTi5cbiAgICogXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhhcnIgLSBiaW5hcnkgZGF0YSBpbiBNb25lcm8ncyBwb3J0YWJsZSBzdG9yYWdlIGZvcm1hdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG9iamVjdD59IEpTT04gb2JqZWN0IGNvbnZlcnRlZCBmcm9tIHRoZSBiaW5hcnkgZGF0YVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGJpbmFyeVRvSnNvbih1aW50OGFycikge1xuICAgIGlmIChNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIpIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJtb25lcm9VdGlsc0JpbmFyeVRvSnNvblwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIFxuICAgIC8vIGxvYWQga2V5cyBtb2R1bGUgYnkgZGVmYXVsdFxuICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpID09PSB1bmRlZmluZWQpIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIHVzZSB3YXNtIGluIHF1ZXVlXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgXG4gICAgICAvLyBhbGxvY2F0ZSBzcGFjZSBpbiBjKysgaGVhcCBmb3IgYmluYXJ5XG4gICAgICBsZXQgcHRyID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fbWFsbG9jKHVpbnQ4YXJyLmxlbmd0aCAqIHVpbnQ4YXJyLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIGxldCBoZWFwID0gbmV3IFVpbnQ4QXJyYXkoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQVTguYnVmZmVyLCBwdHIsIHVpbnQ4YXJyLmxlbmd0aCAqIHVpbnQ4YXJyLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIGlmIChwdHIgIT09IGhlYXAuYnl0ZU9mZnNldCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTWVtb3J5IHB0ciAhPT0gaGVhcC5ieXRlT2Zmc2V0XCIpOyAvLyBzaG91bGQgYmUgZXF1YWxcbiAgICAgIFxuICAgICAgLy8gd3JpdGUgYmluYXJ5IHRvIGhlYXBcbiAgICAgIGhlYXAuc2V0KG5ldyBVaW50OEFycmF5KHVpbnQ4YXJyLmJ1ZmZlcikpO1xuICAgICAgXG4gICAgICAvLyBjcmVhdGUgb2JqZWN0IHdpdGggYmluYXJ5IG1lbW9yeSBhZGRyZXNzIGluZm9cbiAgICAgIGxldCBiaW5NZW1JbmZvID0geyBwdHI6IHB0ciwgbGVuZ3RoOiB1aW50OGFyci5sZW5ndGggfTtcbiAgICAgIFxuICAgICAgLy8gY29udmVydCBiaW5hcnkgdG8ganNvbiBzdHJcbiAgICAgIGNvbnN0IHJldF9zdHJpbmcgPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLmJpbmFyeV90b19qc29uKEpTT04uc3RyaW5naWZ5KGJpbk1lbUluZm8pKTtcbiAgICAgIFxuICAgICAgLy8gZnJlZSBiaW5hcnkgb24gaGVhcFxuICAgICAgTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fZnJlZShwdHIpO1xuICAgICAgXG4gICAgICAvLyBwYXJzZSBhbmQgcmV0dXJuIGpzb25cbiAgICAgIHJldHVybiBKU09OLnBhcnNlKHJldF9zdHJpbmcpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydCB0aGUgYmluYXJ5IHJlc3BvbnNlIGZyb20gZGFlbW9uIFJQQyBibG9jayByZXRyaWV2YWwgdG8gSlNPTi5cbiAgICogXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhhcnIgLSBiaW5hcnkgcmVzcG9uc2UgZnJvbSBkYWVtb24gUlBDIHdoZW4gZ2V0dGluZyBibG9ja3NcbiAgICogQHJldHVybiB7UHJvbWlzZTxvYmplY3Q+fSBKU09OIG9iamVjdCB3aXRoIHRoZSBibG9ja3MgZGF0YVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGJpbmFyeUJsb2Nrc1RvSnNvbih1aW50OGFycikge1xuICAgIGlmIChNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIpIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJtb25lcm9VdGlsc0JpbmFyeUJsb2Nrc1RvSnNvblwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIFxuICAgIC8vIGxvYWQga2V5cyBtb2R1bGUgYnkgZGVmYXVsdFxuICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpID09PSB1bmRlZmluZWQpIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIHVzZSB3YXNtIGluIHF1ZXVlXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgXG4gICAgICAvLyBhbGxvY2F0ZSBzcGFjZSBpbiBjKysgaGVhcCBmb3IgYmluYXJ5XG4gICAgICBsZXQgcHRyID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fbWFsbG9jKHVpbnQ4YXJyLmxlbmd0aCAqIHVpbnQ4YXJyLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIGxldCBoZWFwID0gbmV3IFVpbnQ4QXJyYXkoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQVTguYnVmZmVyLCBwdHIsIHVpbnQ4YXJyLmxlbmd0aCAqIHVpbnQ4YXJyLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIGlmIChwdHIgIT09IGhlYXAuYnl0ZU9mZnNldCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTWVtb3J5IHB0ciAhPT0gaGVhcC5ieXRlT2Zmc2V0XCIpOyAvLyBzaG91bGQgYmUgZXF1YWxcbiAgICAgIFxuICAgICAgLy8gd3JpdGUgYmluYXJ5IHRvIGhlYXBcbiAgICAgIGhlYXAuc2V0KG5ldyBVaW50OEFycmF5KHVpbnQ4YXJyLmJ1ZmZlcikpO1xuICAgICAgXG4gICAgICAvLyBjcmVhdGUgb2JqZWN0IHdpdGggYmluYXJ5IG1lbW9yeSBhZGRyZXNzIGluZm9cbiAgICAgIGxldCBiaW5NZW1JbmZvID0geyBwdHI6IHB0ciwgbGVuZ3RoOiB1aW50OGFyci5sZW5ndGggIH1cblxuICAgICAgLy8gY29udmVydCBiaW5hcnkgdG8ganNvbiBzdHJcbiAgICAgIGNvbnN0IGpzb25fc3RyID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5iaW5hcnlfYmxvY2tzX3RvX2pzb24oSlNPTi5zdHJpbmdpZnkoYmluTWVtSW5mbykpO1xuICAgICAgXG4gICAgICAvLyBmcmVlIG1lbW9yeVxuICAgICAgTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fZnJlZShwdHIpO1xuICAgICAgXG4gICAgICAvLyBwYXJzZSByZXN1bHQgdG8ganNvblxuICAgICAgbGV0IGpzb24gPSBKU09OLnBhcnNlKGpzb25fc3RyKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJzaW5nIGpzb24gZ2l2ZXMgYXJyYXlzIG9mIGJsb2NrIGFuZCB0eCBzdHJpbmdzXG4gICAgICBqc29uLmJsb2NrcyA9IGpzb24uYmxvY2tzLm1hcChibG9ja1N0ciA9PiBKU09OLnBhcnNlKGJsb2NrU3RyKSk7ICAgICAgICAgIC8vIHJlcGxhY2UgYmxvY2sgc3RyaW5ncyB3aXRoIHBhcnNlZCBibG9ja3NcbiAgICAgIGpzb24udHhzID0ganNvbi50eHMubWFwKHR4cyA9PiB0eHMgPyB0eHMubWFwKHR4ID0+IEpTT04ucGFyc2UodHgucmVwbGFjZShcIixcIiwgXCJ7XCIpICsgXCJ9XCIpKSA6IFtdKTsgLy8gbW9kaWZ5IHR4IHN0cmluZyB0byBwcm9wZXIganNvbiBhbmQgcGFyc2UgLy8gVE9ETzogbW9yZSBlZmZpY2llbnQgd2F5IHRoYW4gdGhpcyBqc29uIG1hbmlwdWxhdGlvbj9cbiAgICAgIHJldHVybiBqc29uO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc2VyaWFsaXplIGEgZ2V0X2hhc2hlcy5iaW4gcmVzcG9uc2UgdXNpbmcgTW9uZXJvIENvcmUuXG4gICAqXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gYmluYXJ5IC0gYmluYXJ5IHJlc3BvbnNlIGluIHBvcnRhYmxlIHN0b3JhZ2UgZm9ybWF0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8b2JqZWN0Pn0gZGVjb2RlZCByZXNwb25zZSB3aXRoIGhleGFkZWNpbWFsIGJsb2NrIGhhc2hlc1xuICAgKi9cbiAgc3RhdGljIGFzeW5jIGJpbmFyeUhhc2hlc1RvSnNvbihcbiAgICBiaW5hcnk6IFVpbnQ4QXJyYXlcbiAgKTogUHJvbWlzZTx7XG4gICAgaGFzaGVzOiBzdHJpbmdbXTtcbiAgICBzdGFydF9oZWlnaHQ6IG51bWJlcjtcbiAgICBjdXJyZW50X2hlaWdodDogbnVtYmVyO1xuICAgIHN0YXR1czogc3RyaW5nO1xuICB9PiB7XG4gICAgaWYgKExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3Qgd2FzbSA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCk7XG5cbiAgICAgIGNvbnN0IHB0ciA9IHdhc20uX21hbGxvYyhiaW5hcnkuYnl0ZUxlbmd0aCk7XG4gICAgICBpZiAoIXB0cikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiRmFpbGVkIHRvIGFsbG9jYXRlIGJpbmFyeSByZXNwb25zZVwiKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gQ29weSB0aGUgYmluYXJ5IHJlc3BvbnNlIHRvIFdBU00gbWVtb3J5LlxuICAgICAgICB3YXNtLkhFQVBVOC5zZXQoYmluYXJ5LCBwdHIpO1xuXG4gICAgICAgIGNvbnN0IG1lbUluZm8gPSB7XG4gICAgICAgICAgcHRyOiBwdHIsXG4gICAgICAgICAgbGVuZ3RoOiBiaW5hcnkuYnl0ZUxlbmd0aFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGpzb24gPSB3YXNtLmJpbmFyeV9oYXNoZXNfdG9fanNvbihcbiAgICAgICAgICBKU09OLnN0cmluZ2lmeShtZW1JbmZvKVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKGpzb24pO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgd2FzbS5fZnJlZShwdHIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydCBYTVIgdG8gYXRvbWljIHVuaXRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXIgfCBzdHJpbmd9IGFtb3VudFhtciAtIGFtb3VudCBpbiBYTVIgdG8gY29udmVydCB0byBhdG9taWMgdW5pdHNcbiAgICogQHJldHVybiB7YmlnaW50fSBhbW91bnQgaW4gYXRvbWljIHVuaXRzXG4gICAqL1xuICBzdGF0aWMgeG1yVG9BdG9taWNVbml0cyhhbW91bnRYbXI6IG51bWJlciB8IHN0cmluZyk6IGJpZ2ludCB7XG4gICAgcmV0dXJuIEJpZ0ludChuZXcgRGVjaW1hbChhbW91bnRYbXIpLm11bChNb25lcm9VdGlscy5BVV9QRVJfWE1SLnRvU3RyaW5nKCkpLnRvRGVjaW1hbFBsYWNlcygwLCBEZWNpbWFsLlJPVU5EX0hBTEZfVVApLnRvRml4ZWQoMCkpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydCBhdG9taWMgdW5pdHMgdG8gWE1SLlxuICAgKiBcbiAgICogQHBhcmFtIHtiaWdpbnQgfCBzdHJpbmd9IGFtb3VudEF0b21pY1VuaXRzIC0gYW1vdW50IGluIGF0b21pYyB1bml0cyB0byBjb252ZXJ0IHRvIFhNUlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IGFtb3VudCBpbiBYTVIgXG4gICAqL1xuICBzdGF0aWMgYXRvbWljVW5pdHNUb1htcihhbW91bnRBdG9taWNVbml0czogYmlnaW50IHwgc3RyaW5nKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbmV3IERlY2ltYWwoYW1vdW50QXRvbWljVW5pdHMudG9TdHJpbmcoKSkuZGl2KE1vbmVyb1V0aWxzLkFVX1BFUl9YTVIudG9TdHJpbmcoKSkudG9EZWNpbWFsUGxhY2VzKDEyLCBEZWNpbWFsLlJPVU5EX0hBTEZfVVApLnRvTnVtYmVyKCk7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlIG9uZSBhdG9taWMgdW5pdHMgYnkgYW5vdGhlci5cbiAgICogXG4gICAqIEBwYXJhbSB7YmlnaW50fSBhdTEgZGl2aWRlbmRcbiAgICogQHBhcmFtIHtiaWdpbnR9IGF1MiBkaXZpc29yXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IHRoZSByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBkaXZpZGUoYXUxOiBiaWdpbnQsIGF1MjogYmlnaW50KTogbnVtYmVyIHtcbiAgICByZXR1cm4gbmV3IERlY2ltYWwoYXUxLnRvU3RyaW5nKCkpLmRpdihuZXcgRGVjaW1hbChhdTIudG9TdHJpbmcoKSkpLnRvRGVjaW1hbFBsYWNlcygxMiwgRGVjaW1hbC5ST1VORF9IQUxGX1VQKS50b051bWJlcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGx5IGEgYmlnaW50IGJ5IGEgbnVtYmVyIG9yIGJpZ2ludC5cbiAgICogXG4gICAqIEBwYXJhbSBhIGJpZ2ludCB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gYiBiaWdpbnQgb3IgbnVtYmVyIHRvIG11bHRpcGx5IGJ5XG4gICAqIEByZXR1cm5zIHRoZSBwcm9kdWN0IGFzIGEgYmlnaW50XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHkoYTogYmlnaW50LCBiOiBudW1iZXIgfCBiaWdpbnQpOiBiaWdpbnQge1xuICAgIHJldHVybiBCaWdJbnQobmV3IERlY2ltYWwoYS50b1N0cmluZygpKS5tdWwobmV3IERlY2ltYWwoYi50b1N0cmluZygpKSkudG9EZWNpbWFsUGxhY2VzKDAsIERlY2ltYWwuUk9VTkRfSEFMRl9VUCkudG9TdHJpbmcoKSk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgaXNIZXg2NChzdHIpIHtcbiAgICByZXR1cm4gdHlwZW9mIHN0ciA9PT0gXCJzdHJpbmdcIiAmJiBzdHIubGVuZ3RoID09PSA2NCAmJiBHZW5VdGlscy5pc0hleChzdHIpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZSBpZiB0aGUgZ2l2ZW4gdW5sb2NrIHRpbWUgaXMgYSB0aW1lc3RhbXAgb3IgYmxvY2sgaGVpZ2h0LlxuICAgKiBcbiAgICogQHBhcmFtIHVubG9ja1RpbWUgaXMgdGhlIHVubG9jayB0aW1lIHRvIGNoZWNrXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIHVubG9jayB0aW1lIGlzIGEgdGltZXN0YW1wLCBmYWxzZSBpZiBhIGJsb2NrIGhlaWdodFxuICAgKi9cbiAgc3RhdGljIGlzVGltZXN0YW1wKHVubG9ja1RpbWU6IGJpZ2ludCkge1xuICAgICAgXG4gICAgLy8gdGhyZXNob2xkIGZvciBkaXN0aW5ndWlzaGluZyBiZXR3ZWVuIHRpbWVzdGFtcCBhbmQgYmxvY2sgaGVpZ2h0XG4gICAgLy8gY3VycmVudCBibG9jayBoZWlnaHQgaXMgYXJvdW5kIDMgbWlsbGlvbiwgY3VycmVudCB1bml4IHRpbWVzdGFtcCBpcyBhcm91bmQgMS43IGJpbGxpb25cbiAgICBjb25zdCB0aHJlc2hvbGQgPSA1MDAwMDAwMDBuO1xuXG4gICAgcmV0dXJuIHVubG9ja1RpbWUgPj0gdGhyZXNob2xkO1xuICB9XG59XG5cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFFBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFNBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLGFBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLFlBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLHdCQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSxrQkFBQSxHQUFBUCxzQkFBQSxD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