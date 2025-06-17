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
  static RING_SIZE = 12;

  /**
   * <p>Get the version of the monero-ts library.<p>
   * 
   * @return {string} the version of this monero-ts library
   */
  static getVersion() {
    return "0.11.5";
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfZGVjaW1hbCIsIl9HZW5VdGlscyIsIl9MaWJyYXJ5VXRpbHMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJNb25lcm9VdGlscyIsIlBST1hZX1RPX1dPUktFUiIsIk5VTV9NTkVNT05JQ19XT1JEUyIsIkFVX1BFUl9YTVIiLCJSSU5HX1NJWkUiLCJnZXRWZXJzaW9uIiwic2V0UHJveHlUb1dvcmtlciIsInByb3h5VG9Xb3JrZXIiLCJ2YWxpZGF0ZU1uZW1vbmljIiwibW5lbW9uaWMiLCJhc3NlcnQiLCJ3b3JkcyIsInNwbGl0IiwibGVuZ3RoIiwiTW9uZXJvRXJyb3IiLCJpc1ZhbGlkUHJpdmF0ZVZpZXdLZXkiLCJwcml2YXRlVmlld0tleSIsInZhbGlkYXRlUHJpdmF0ZVZpZXdLZXkiLCJlIiwiaXNWYWxpZFB1YmxpY1ZpZXdLZXkiLCJwdWJsaWNWaWV3S2V5IiwidmFsaWRhdGVQdWJsaWNWaWV3S2V5IiwiaXNWYWxpZFByaXZhdGVTcGVuZEtleSIsInByaXZhdGVTcGVuZEtleSIsInZhbGlkYXRlUHJpdmF0ZVNwZW5kS2V5IiwiaXNWYWxpZFB1YmxpY1NwZW5kS2V5IiwicHVibGljU3BlbmRLZXkiLCJ2YWxpZGF0ZVB1YmxpY1NwZW5kS2V5IiwiaXNIZXg2NCIsImdldEludGVncmF0ZWRBZGRyZXNzIiwibmV0d29ya1R5cGUiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIkxpYnJhcnlVdGlscyIsImludm9rZVdvcmtlciIsInVuZGVmaW5lZCIsIkFycmF5IiwiZnJvbSIsImFyZ3VtZW50cyIsIk1vbmVyb05ldHdvcmtUeXBlIiwidmFsaWRhdGUiLCJHZW5VdGlscyIsImlzQmFzZTU4IiwiZ2V0V2FzbU1vZHVsZSIsImxvYWRXYXNtTW9kdWxlIiwicXVldWVUYXNrIiwiaW50ZWdyYXRlZEFkZHJlc3NKc29uIiwiZ2V0X2ludGVncmF0ZWRfYWRkcmVzc191dGlsIiwiY2hhckF0IiwiSlNPTiIsInBhcnNlIiwiaXNWYWxpZEFkZHJlc3MiLCJhZGRyZXNzIiwidmFsaWRhdGVBZGRyZXNzIiwiZXJyIiwiZXJyTXNnIiwidmFsaWRhdGVfYWRkcmVzcyIsImlzVmFsaWRQYXltZW50SWQiLCJ2YWxpZGF0ZVBheW1lbnRJZCIsImVxdWFsIiwiZ2V0TGFzdFR4UHViS2V5IiwidHhFeHRyYSIsImxhc3RQdWJLZXlJZHgiLCJpIiwidGFnIiwiQnVmZmVyIiwiVWludDhBcnJheSIsInNsaWNlIiwidG9TdHJpbmciLCJwYXltZW50SWRzRXF1YWwiLCJwYXltZW50SWQxIiwicGF5bWVudElkMiIsIm1heExlbmd0aCIsIk1hdGgiLCJtYXgiLCJtZXJnZVR4IiwidHhzIiwidHgiLCJhVHgiLCJnZXRIYXNoIiwibWVyZ2UiLCJwdXNoIiwianNvblRvQmluYXJ5IiwianNvbiIsImJpbk1lbUluZm9TdHIiLCJtYWxsb2NfYmluYXJ5X2Zyb21fanNvbiIsInN0cmluZ2lmeSIsImJpbk1lbUluZm8iLCJwdHIiLCJwYXJzZUludCIsInZpZXciLCJIRUFQVTgiLCJCWVRFU19QRVJfRUxFTUVOVCIsIl9mcmVlIiwiYmluYXJ5VG9Kc29uIiwidWludDhhcnIiLCJfbWFsbG9jIiwiaGVhcCIsImJ1ZmZlciIsImJ5dGVPZmZzZXQiLCJzZXQiLCJyZXRfc3RyaW5nIiwiYmluYXJ5X3RvX2pzb24iLCJiaW5hcnlCbG9ja3NUb0pzb24iLCJqc29uX3N0ciIsImJpbmFyeV9ibG9ja3NfdG9fanNvbiIsImJsb2NrcyIsIm1hcCIsImJsb2NrU3RyIiwicmVwbGFjZSIsInhtclRvQXRvbWljVW5pdHMiLCJhbW91bnRYbXIiLCJCaWdJbnQiLCJEZWNpbWFsIiwibXVsIiwidG9EZWNpbWFsUGxhY2VzIiwiUk9VTkRfSEFMRl9VUCIsInRvRml4ZWQiLCJhdG9taWNVbml0c1RvWG1yIiwiYW1vdW50QXRvbWljVW5pdHMiLCJkaXYiLCJ0b051bWJlciIsImRpdmlkZSIsImF1MSIsImF1MiIsIm11bHRpcGx5IiwiYSIsImIiLCJzdHIiLCJpc0hleCIsImlzVGltZXN0YW1wIiwidW5sb2NrVGltZSIsInRocmVzaG9sZCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb1V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IERlY2ltYWwgZnJvbSAnZGVjaW1hbC5qcyc7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvTmV0d29ya1R5cGUgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9OZXR3b3JrVHlwZVwiO1xuaW1wb3J0IENvbm5lY3Rpb25UeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvQ29ubmVjdGlvblR5cGVcIjtcblxuLyoqXG4gKiBDb2xsZWN0aW9uIG9mIE1vbmVybyB1dGlsaXRpZXMuIFJ1bnMgaW4gYSB3b3JrZXIgdGhyZWFkIGJ5IGRlZmF1bHQuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1V0aWxzIHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHN0YXRpYyBQUk9YWV9UT19XT1JLRVIgPSBmYWxzZTtcbiAgc3RhdGljIE5VTV9NTkVNT05JQ19XT1JEUyA9IDI1O1xuICBzdGF0aWMgQVVfUEVSX1hNUiA9IDEwMDAwMDAwMDAwMDBuO1xuICBzdGF0aWMgUklOR19TSVpFID0gMTI7XG5cbiAgLyoqXG4gICAqIDxwPkdldCB0aGUgdmVyc2lvbiBvZiB0aGUgbW9uZXJvLXRzIGxpYnJhcnkuPHA+XG4gICAqIFxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSB2ZXJzaW9uIG9mIHRoaXMgbW9uZXJvLXRzIGxpYnJhcnlcbiAgICovXG4gIHN0YXRpYyBnZXRWZXJzaW9uKCkge1xuICAgIHJldHVybiBcIjAuMTEuNVwiO1xuICB9XG4gIFxuICAvKipcbiAgICogRW5hYmxlIG9yIGRpc2FibGUgcHJveHlpbmcgdGhlc2UgdXRpbGl0aWVzIHRvIGEgd29ya2VyIHRocmVhZC5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gcHJveHlUb1dvcmtlciAtIHNwZWNpZmllcyBpZiB1dGlsaXRpZXMgc2hvdWxkIGJlIHByb3hpZWQgdG8gYSB3b3JrZXJcbiAgICovXG4gIHN0YXRpYyBzZXRQcm94eVRvV29ya2VyKHByb3h5VG9Xb3JrZXIpIHtcbiAgICBNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIgPSBwcm94eVRvV29ya2VyIHx8IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBtbmVtb25pYywgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogVE9ETzogaW1wcm92ZSB2YWxpZGF0aW9uLCB1c2UgbmV0d29yayB0eXBlXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbW5lbW9uaWMgLSBtbmVtb25pYyB0byB2YWxpZGF0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlTW5lbW9uaWMobW5lbW9uaWMpIHtcbiAgICBhc3NlcnQobW5lbW9uaWMsIFwiTW5lbW9uaWMgcGhyYXNlIGlzIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICBsZXQgd29yZHMgPSBtbmVtb25pYy5zcGxpdChcIiBcIik7XG4gICAgaWYgKHdvcmRzLmxlbmd0aCAhPT0gTW9uZXJvVXRpbHMuTlVNX01ORU1PTklDX1dPUkRTKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNbmVtb25pYyBwaHJhc2UgaXMgXCIgKyB3b3Jkcy5sZW5ndGggKyBcIiB3b3JkcyBidXQgbXVzdCBiZSBcIiArIE1vbmVyb1V0aWxzLk5VTV9NTkVNT05JQ19XT1JEUyk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgYSBwcml2YXRlIHZpZXcga2V5IGlzIHZhbGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByaXZhdGVWaWV3S2V5IGlzIHRoZSBwcml2YXRlIHZpZXcga2V5IHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbD59IHRydWUgaWYgdGhlIHByaXZhdGUgdmlldyBrZXkgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlzVmFsaWRQcml2YXRlVmlld0tleShwcml2YXRlVmlld0tleSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZVByaXZhdGVWaWV3S2V5KHByaXZhdGVWaWV3S2V5KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgYSBwdWJsaWMgdmlldyBrZXkgaXMgdmFsaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVibGljVmlld0tleSBpcyB0aGUgcHVibGljIHZpZXcga2V5IHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbD59IHRydWUgaWYgdGhlIHB1YmxpYyB2aWV3IGtleSBpcyB2YWxpZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaXNWYWxpZFB1YmxpY1ZpZXdLZXkocHVibGljVmlld0tleSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZVB1YmxpY1ZpZXdLZXkocHVibGljVmlld0tleSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIGEgcHJpdmF0ZSBzcGVuZCBrZXkgaXMgdmFsaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJpdmF0ZVNwZW5kS2V5IGlzIHRoZSBwcml2YXRlIHNwZW5kIGtleSB0byB2YWxpZGF0ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2w+fSB0cnVlIGlmIHRoZSBwcml2YXRlIHNwZW5kIGtleSBpcyB2YWxpZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaXNWYWxpZFByaXZhdGVTcGVuZEtleShwcml2YXRlU3BlbmRLZXkpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgTW9uZXJvVXRpbHMudmFsaWRhdGVQcml2YXRlU3BlbmRLZXkocHJpdmF0ZVNwZW5kS2V5KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgYSBwdWJsaWMgc3BlbmQga2V5IGlzIHZhbGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1YmxpY1NwZW5kS2V5IGlzIHRoZSBwdWJsaWMgc3BlbmQga2V5IHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbD59IHRydWUgaWYgdGhlIHB1YmxpYyBzcGVuZCBrZXkgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlzVmFsaWRQdWJsaWNTcGVuZEtleShwdWJsaWNTcGVuZEtleSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZVB1YmxpY1NwZW5kS2V5KHB1YmxpY1NwZW5kS2V5KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gcHJpdmF0ZSB2aWV3IGtleSwgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByaXZhdGVWaWV3S2V5IC0gcHJpdmF0ZSB2aWV3IGtleSB0byB2YWxpZGF0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlUHJpdmF0ZVZpZXdLZXkocHJpdmF0ZVZpZXdLZXkpIHtcbiAgICBpZiAoIU1vbmVyb1V0aWxzLmlzSGV4NjQocHJpdmF0ZVZpZXdLZXkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJwcml2YXRlIHZpZXcga2V5IGV4cGVjdGVkIHRvIGJlIDY0IGhleCBjaGFyYWN0ZXJzXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIHB1YmxpYyB2aWV3IGtleSwgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1YmxpY1ZpZXdLZXkgLSBwdWJsaWMgdmlldyBrZXkgdG8gdmFsaWRhdGVcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZVB1YmxpY1ZpZXdLZXkocHVibGljVmlld0tleSkge1xuICAgIGlmICghTW9uZXJvVXRpbHMuaXNIZXg2NChwdWJsaWNWaWV3S2V5KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicHVibGljIHZpZXcga2V5IGV4cGVjdGVkIHRvIGJlIDY0IGhleCBjaGFyYWN0ZXJzXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIHByaXZhdGUgc3BlbmQga2V5LCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJpdmF0ZVNwZW5kS2V5IC0gcHJpdmF0ZSBzcGVuZCBrZXkgdG8gdmFsaWRhdGVcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZVByaXZhdGVTcGVuZEtleShwcml2YXRlU3BlbmRLZXkpIHtcbiAgICBpZiAoIU1vbmVyb1V0aWxzLmlzSGV4NjQocHJpdmF0ZVNwZW5kS2V5KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicHJpdmF0ZSBzcGVuZCBrZXkgZXhwZWN0ZWQgdG8gYmUgNjQgaGV4IGNoYXJhY3RlcnNcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gcHVibGljIHNwZW5kIGtleSwgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1YmxpY1NwZW5kS2V5IC0gcHVibGljIHNwZW5kIGtleSB0byB2YWxpZGF0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlUHVibGljU3BlbmRLZXkocHVibGljU3BlbmRLZXkpIHtcbiAgICBpZiAoIU1vbmVyb1V0aWxzLmlzSGV4NjQocHVibGljU3BlbmRLZXkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJwdWJsaWMgc3BlbmQga2V5IGV4cGVjdGVkIHRvIGJlIDY0IGhleCBjaGFyYWN0ZXJzXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGFuIGludGVncmF0ZWQgYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvTmV0d29ya1R5cGV9IG5ldHdvcmtUeXBlIC0gbmV0d29yayB0eXBlIG9mIHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3NcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0YW5kYXJkQWRkcmVzcyAtIGFkZHJlc3MgdG8gZGVyaXZlIHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3MgZnJvbVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3BheW1lbnRJZF0gLSBvcHRpb25hbGx5IHNwZWNpZmllcyB0aGUgaW50ZWdyYXRlZCBhZGRyZXNzJ3MgcGF5bWVudCBpZCAoZGVmYXVsdHMgdG8gcmFuZG9tIHBheW1lbnQgaWQpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+fSB0aGUgaW50ZWdyYXRlZCBhZGRyZXNzXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgZ2V0SW50ZWdyYXRlZEFkZHJlc3MobmV0d29ya1R5cGU6IE1vbmVyb05ldHdvcmtUeXBlLCBzdGFuZGFyZEFkZHJlc3M6IHN0cmluZywgcGF5bWVudElkPzogc3RyaW5nKSB7XG4gICAgaWYgKE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUikgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyhhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJtb25lcm9VdGlsc0dldEludGVncmF0ZWRBZGRyZXNzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICBcbiAgICAvLyB2YWxpZGF0ZSBpbnB1dHNcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShuZXR3b3JrVHlwZSk7XG4gICAgYXNzZXJ0KHR5cGVvZiBzdGFuZGFyZEFkZHJlc3MgPT09IFwic3RyaW5nXCIsIFwiQWRkcmVzcyBpcyBub3Qgc3RyaW5nXCIpO1xuICAgIGFzc2VydChzdGFuZGFyZEFkZHJlc3MubGVuZ3RoID4gMCwgXCJBZGRyZXNzIGlzIGVtcHR5XCIpO1xuICAgIGFzc2VydChHZW5VdGlscy5pc0Jhc2U1OChzdGFuZGFyZEFkZHJlc3MpLCBcIkFkZHJlc3MgaXMgbm90IGJhc2UgNThcIik7XG4gICAgXG4gICAgLy8gbG9hZCBrZXlzIG1vZHVsZSBieSBkZWZhdWx0XG4gICAgaWYgKExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkgPT09IHVuZGVmaW5lZCkgYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gZ2V0IGludGVncmF0ZWQgYWRkcmVzcyBpbiBxdWV1ZVxuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICBsZXQgaW50ZWdyYXRlZEFkZHJlc3NKc29uID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5nZXRfaW50ZWdyYXRlZF9hZGRyZXNzX3V0aWwobmV0d29ya1R5cGUsIHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkID8gcGF5bWVudElkIDogXCJcIik7XG4gICAgICBpZiAoaW50ZWdyYXRlZEFkZHJlc3NKc29uLmNoYXJBdCgwKSAhPT0gJ3snKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoaW50ZWdyYXRlZEFkZHJlc3NKc29uKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoSlNPTi5wYXJzZShpbnRlZ3JhdGVkQWRkcmVzc0pzb24pKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERldGVybWluZSBpZiB0aGUgZ2l2ZW4gYWRkcmVzcyBpcyB2YWxpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gYWRkcmVzc1xuICAgKiBAcGFyYW0ge01vbmVyb05ldHdvcmtUeXBlfSBuZXR3b3JrVHlwZSAtIG5ldHdvcmsgdHlwZSBvZiB0aGUgYWRkcmVzcyB0byB2YWxpZGF0ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSBhZGRyZXNzIGlzIHZhbGlkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpc1ZhbGlkQWRkcmVzcyhhZGRyZXNzLCBuZXR3b3JrVHlwZSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZUFkZHJlc3MoYWRkcmVzcywgbmV0d29ya1R5cGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIGFkZHJlc3MsIHRocm93IGFuIGVycm9yIGlmIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gYWRkcmVzcyB0byB2YWxpZGF0ZVxuICAgKiBAcGFyYW0ge01vbmVyb05ldHdvcmtUeXBlfSBuZXR3b3JrVHlwZSAtIG5ldHdvcmsgdHlwZSBvZiB0aGUgYWRkcmVzcyB0byB2YWxpZGF0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlQWRkcmVzcyhhZGRyZXNzLCBuZXR3b3JrVHlwZSkge1xuICAgIGlmIChNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIpIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJtb25lcm9VdGlsc1ZhbGlkYXRlQWRkcmVzc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGlucHV0c1xuICAgIGFzc2VydCh0eXBlb2YgYWRkcmVzcyA9PT0gXCJzdHJpbmdcIiwgXCJBZGRyZXNzIGlzIG5vdCBzdHJpbmdcIik7XG4gICAgYXNzZXJ0KGFkZHJlc3MubGVuZ3RoID4gMCwgXCJBZGRyZXNzIGlzIGVtcHR5XCIpO1xuICAgIGFzc2VydChHZW5VdGlscy5pc0Jhc2U1OChhZGRyZXNzKSwgXCJBZGRyZXNzIGlzIG5vdCBiYXNlIDU4XCIpO1xuICAgIG5ldHdvcmtUeXBlID0gTW9uZXJvTmV0d29ya1R5cGUuZnJvbShuZXR3b3JrVHlwZSk7XG4gICAgXG4gICAgLy8gbG9hZCBrZXlzIG1vZHVsZSBieSBkZWZhdWx0XG4gICAgaWYgKExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkgPT09IHVuZGVmaW5lZCkgYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYWRkcmVzcyBpbiBxdWV1ZVxuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLnF1ZXVlVGFzayhhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIGxldCBlcnJNc2cgPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLnZhbGlkYXRlX2FkZHJlc3MoYWRkcmVzcywgbmV0d29ya1R5cGUpO1xuICAgICAgaWYgKGVyck1zZykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyck1zZyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgaWYgdGhlIGdpdmVuIHBheW1lbnQgaWQgaXMgdmFsaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF5bWVudElkIC0gcGF5bWVudCBpZCB0byBkZXRlcm1pbmUgaWYgdmFsaWRcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sPn0gdHJ1ZSBpZiB0aGUgcGF5bWVudCBpZCBpcyB2YWxpZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaXNWYWxpZFBheW1lbnRJZChwYXltZW50SWQpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgTW9uZXJvVXRpbHMudmFsaWRhdGVQYXltZW50SWQocGF5bWVudElkKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gcGF5bWVudCBpZCwgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICogXG4gICAqIFRPRE86IGltcHJvdmUgdmFsaWRhdGlvblxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBheW1lbnRJZCAtIHBheW1lbnQgaWQgdG8gdmFsaWRhdGUgXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVQYXltZW50SWQocGF5bWVudElkKSB7XG4gICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiBwYXltZW50SWQsIFwic3RyaW5nXCIpO1xuICAgIGFzc2VydChwYXltZW50SWQubGVuZ3RoID09PSAxNiB8fCBwYXltZW50SWQubGVuZ3RoID09PSA2NCk7XG4gIH1cbiAgICBcbiAgLyoqXG4gICAqIERlY29kZSB0eCBleHRyYSBhY2NvcmRpbmcgdG8gaHR0cHM6Ly9jcnlwdG9ub3RlLm9yZy9jbnMvY25zMDA1LnR4dCBhbmRcbiAgICogcmV0dXJucyB0aGUgbGFzdCB0eCBwdWIga2V5LlxuICAgKiBcbiAgICogVE9ETzogdXNlIGMrKyBicmlkZ2UgZm9yIHRoaXNcbiAgICogXG4gICAqIEBwYXJhbSBbYnl0ZVtdXSB0eEV4dHJhIC0gYXJyYXkgb2YgdHggZXh0cmEgYnl0ZXNcbiAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgbGFzdCBwdWIga2V5IGFzIGEgaGV4aWRlY2ltYWwgc3RyaW5nXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgZ2V0TGFzdFR4UHViS2V5KHR4RXh0cmEpIHtcbiAgICBsZXQgbGFzdFB1YktleUlkeDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHR4RXh0cmEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCB0YWcgPSB0eEV4dHJhW2ldO1xuICAgICAgaWYgKHRhZyA9PT0gMCB8fCB0YWcgPT09IDIpIHtcbiAgICAgICAgaSArPSAxICsgdHhFeHRyYVtpICsgMV07ICAvLyBhZHZhbmNlIHRvIG5leHQgdGFnXG4gICAgICB9IGVsc2UgaWYgKHRhZyA9PT0gMSkge1xuICAgICAgICBsYXN0UHViS2V5SWR4ID0gaSArIDE7XG4gICAgICAgIGkgKz0gMSArIDMyOyAgICAgICAgICAgICAgLy8gYWR2YW5jZSB0byBuZXh0IHRhZ1xuICAgICAgfSBlbHNlIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgc3ViLWZpZWxkIHRhZzogXCIgKyB0YWcpO1xuICAgIH1cbiAgICByZXR1cm4gQnVmZmVyLmZyb20obmV3IFVpbnQ4QXJyYXkodHhFeHRyYS5zbGljZShsYXN0UHViS2V5SWR4LCBsYXN0UHViS2V5SWR4ICsgMzIpKSkudG9TdHJpbmcoXCJoZXhcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHR3byBwYXltZW50IGlkcyBhcmUgZnVuY3Rpb25hbGx5IGVxdWFsLlxuICAgKiBcbiAgICogRm9yIGV4YW1wbGUsIDAzMjg0ZTQxYzM0MmYwMzIgYW5kIDAzMjg0ZTQxYzM0MmYwMzIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAgYXJlIGNvbnNpZGVyZWQgZXF1YWwuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF5bWVudElkMSBpcyBhIHBheW1lbnQgaWQgdG8gY29tcGFyZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF5bWVudElkMiBpcyBhIHBheW1lbnQgaWQgdG8gY29tcGFyZVxuICAgKiBAcmV0dXJuIHtib29sfSB0cnVlIGlmIHRoZSBwYXltZW50IGlkcyBhcmUgZXF1YWwsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIHBheW1lbnRJZHNFcXVhbChwYXltZW50SWQxLCBwYXltZW50SWQyKSB7XG4gICAgbGV0IG1heExlbmd0aCA9IE1hdGgubWF4KHBheW1lbnRJZDEubGVuZ3RoLCBwYXltZW50SWQyLmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXhMZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGkgPCBwYXltZW50SWQxLmxlbmd0aCAmJiBpIDwgcGF5bWVudElkMi5sZW5ndGggJiYgcGF5bWVudElkMVtpXSAhPT0gcGF5bWVudElkMltpXSkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKGkgPj0gcGF5bWVudElkMS5sZW5ndGggJiYgcGF5bWVudElkMltpXSAhPT0gJzAnKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoaSA+PSBwYXltZW50SWQyLmxlbmd0aCAmJiBwYXltZW50SWQxW2ldICE9PSAnMCcpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNZXJnZXMgYSB0cmFuc2FjdGlvbiBpbnRvIGEgbGlzdCBvZiBleGlzdGluZyB0cmFuc2FjdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4W119IHR4cyAtIGV4aXN0aW5nIHRyYW5zYWN0aW9ucyB0byBtZXJnZSBpbnRvXG4gICAqIEBwYXJhbSB7TW9uZXJvVHh9IHR4IC0gdHJhbnNhY3Rpb24gdG8gbWVyZ2UgaW50byB0aGUgbGlzdFxuICAgKi9cbiAgc3RhdGljIG1lcmdlVHgodHhzLCB0eCkge1xuICAgIGZvciAobGV0IGFUeCBvZiB0eHMpIHtcbiAgICAgIGlmIChhVHguZ2V0SGFzaCgpID09PSB0eC5nZXRIYXNoKCkpIHtcbiAgICAgICAgYVR4Lm1lcmdlKHR4KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB0eHMucHVzaCh0eCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0IHRoZSBnaXZlbiBKU09OIHRvIGEgYmluYXJ5IFVpbnQ4QXJyYXkgdXNpbmcgTW9uZXJvJ3MgcG9ydGFibGUgc3RvcmFnZSBmb3JtYXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge29iamVjdH0ganNvbiAtIGpzb24gdG8gY29udmVydCB0byBiaW5hcnlcbiAgICogQHJldHVybiB7UHJvbWlzZTxVaW50OEFycmF5Pn0gdGhlIGpzb24gY29udmVydGVkIHRvIHBvcnRhYmxlIHN0b3JhZ2UgYmluYXJ5XG4gICAqL1xuICBzdGF0aWMgYXN5bmMganNvblRvQmluYXJ5KGpzb24pIHtcbiAgICBpZiAoTW9uZXJvVXRpbHMuUFJPWFlfVE9fV09SS0VSKSByZXR1cm4gTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih1bmRlZmluZWQsIFwibW9uZXJvVXRpbHNKc29uVG9CaW5hcnlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICBcbiAgICAvLyBsb2FkIGtleXMgbW9kdWxlIGJ5IGRlZmF1bHRcbiAgICBpZiAoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSA9PT0gdW5kZWZpbmVkKSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyB1c2Ugd2FzbSBpbiBxdWV1ZVxuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLnF1ZXVlVGFzayhhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIFxuICAgICAgLy8gc2VyaWFsaXplIGpzb24gdG8gYmluYXJ5IHdoaWNoIGlzIHN0b3JlZCBpbiBjKysgaGVhcFxuICAgICAgbGV0IGJpbk1lbUluZm9TdHIgPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLm1hbGxvY19iaW5hcnlfZnJvbV9qc29uKEpTT04uc3RyaW5naWZ5KGpzb24pKTtcbiAgICAgIFxuICAgICAgLy8gc2FuaXRpemUgYmluYXJ5IG1lbW9yeSBhZGRyZXNzIGluZm9cbiAgICAgIGxldCBiaW5NZW1JbmZvID0gSlNPTi5wYXJzZShiaW5NZW1JbmZvU3RyKTtcbiAgICAgIGJpbk1lbUluZm8ucHRyID0gcGFyc2VJbnQoYmluTWVtSW5mby5wdHIpO1xuICAgICAgYmluTWVtSW5mby5sZW5ndGggPSBwYXJzZUludChiaW5NZW1JbmZvLmxlbmd0aCk7XG4gICAgICBcbiAgICAgIC8vIHJlYWQgYmluYXJ5IGRhdGEgZnJvbSBoZWFwIHRvIFVpbnQ4QXJyYXlcbiAgICAgIGxldCB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYmluTWVtSW5mby5sZW5ndGgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5NZW1JbmZvLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZpZXdbaV0gPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLkhFQVBVOFtiaW5NZW1JbmZvLnB0ciAvIFVpbnQ4QXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKyBpXTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gZnJlZSBiaW5hcnkgb24gaGVhcFxuICAgICAgTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fZnJlZShiaW5NZW1JbmZvLnB0cik7XG4gICAgICBcbiAgICAgIC8vIHJldHVybiBqc29uIGZyb20gYmluYXJ5IGRhdGFcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydCB0aGUgZ2l2ZW4gcG9ydGFibGUgc3RvcmFnZSBiaW5hcnkgdG8gSlNPTi5cbiAgICogXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhhcnIgLSBiaW5hcnkgZGF0YSBpbiBNb25lcm8ncyBwb3J0YWJsZSBzdG9yYWdlIGZvcm1hdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG9iamVjdD59IEpTT04gb2JqZWN0IGNvbnZlcnRlZCBmcm9tIHRoZSBiaW5hcnkgZGF0YVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGJpbmFyeVRvSnNvbih1aW50OGFycikge1xuICAgIGlmIChNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIpIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJtb25lcm9VdGlsc0JpbmFyeVRvSnNvblwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIFxuICAgIC8vIGxvYWQga2V5cyBtb2R1bGUgYnkgZGVmYXVsdFxuICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpID09PSB1bmRlZmluZWQpIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIHVzZSB3YXNtIGluIHF1ZXVlXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgXG4gICAgICAvLyBhbGxvY2F0ZSBzcGFjZSBpbiBjKysgaGVhcCBmb3IgYmluYXJ5XG4gICAgICBsZXQgcHRyID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fbWFsbG9jKHVpbnQ4YXJyLmxlbmd0aCAqIHVpbnQ4YXJyLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIGxldCBoZWFwID0gbmV3IFVpbnQ4QXJyYXkoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQVTguYnVmZmVyLCBwdHIsIHVpbnQ4YXJyLmxlbmd0aCAqIHVpbnQ4YXJyLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIGlmIChwdHIgIT09IGhlYXAuYnl0ZU9mZnNldCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTWVtb3J5IHB0ciAhPT0gaGVhcC5ieXRlT2Zmc2V0XCIpOyAvLyBzaG91bGQgYmUgZXF1YWxcbiAgICAgIFxuICAgICAgLy8gd3JpdGUgYmluYXJ5IHRvIGhlYXBcbiAgICAgIGhlYXAuc2V0KG5ldyBVaW50OEFycmF5KHVpbnQ4YXJyLmJ1ZmZlcikpO1xuICAgICAgXG4gICAgICAvLyBjcmVhdGUgb2JqZWN0IHdpdGggYmluYXJ5IG1lbW9yeSBhZGRyZXNzIGluZm9cbiAgICAgIGxldCBiaW5NZW1JbmZvID0geyBwdHI6IHB0ciwgbGVuZ3RoOiB1aW50OGFyci5sZW5ndGggfTtcbiAgICAgIFxuICAgICAgLy8gY29udmVydCBiaW5hcnkgdG8ganNvbiBzdHJcbiAgICAgIGNvbnN0IHJldF9zdHJpbmcgPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLmJpbmFyeV90b19qc29uKEpTT04uc3RyaW5naWZ5KGJpbk1lbUluZm8pKTtcbiAgICAgIFxuICAgICAgLy8gZnJlZSBiaW5hcnkgb24gaGVhcFxuICAgICAgTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fZnJlZShwdHIpO1xuICAgICAgXG4gICAgICAvLyBwYXJzZSBhbmQgcmV0dXJuIGpzb25cbiAgICAgIHJldHVybiBKU09OLnBhcnNlKHJldF9zdHJpbmcpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydCB0aGUgYmluYXJ5IHJlc3BvbnNlIGZyb20gZGFlbW9uIFJQQyBibG9jayByZXRyaWV2YWwgdG8gSlNPTi5cbiAgICogXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhhcnIgLSBiaW5hcnkgcmVzcG9uc2UgZnJvbSBkYWVtb24gUlBDIHdoZW4gZ2V0dGluZyBibG9ja3NcbiAgICogQHJldHVybiB7UHJvbWlzZTxvYmplY3Q+fSBKU09OIG9iamVjdCB3aXRoIHRoZSBibG9ja3MgZGF0YVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGJpbmFyeUJsb2Nrc1RvSnNvbih1aW50OGFycikge1xuICAgIGlmIChNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIpIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJtb25lcm9VdGlsc0JpbmFyeUJsb2Nrc1RvSnNvblwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIFxuICAgIC8vIGxvYWQga2V5cyBtb2R1bGUgYnkgZGVmYXVsdFxuICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpID09PSB1bmRlZmluZWQpIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIHVzZSB3YXNtIGluIHF1ZXVlXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgXG4gICAgICAvLyBhbGxvY2F0ZSBzcGFjZSBpbiBjKysgaGVhcCBmb3IgYmluYXJ5XG4gICAgICBsZXQgcHRyID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fbWFsbG9jKHVpbnQ4YXJyLmxlbmd0aCAqIHVpbnQ4YXJyLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIGxldCBoZWFwID0gbmV3IFVpbnQ4QXJyYXkoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQVTguYnVmZmVyLCBwdHIsIHVpbnQ4YXJyLmxlbmd0aCAqIHVpbnQ4YXJyLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIGlmIChwdHIgIT09IGhlYXAuYnl0ZU9mZnNldCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTWVtb3J5IHB0ciAhPT0gaGVhcC5ieXRlT2Zmc2V0XCIpOyAvLyBzaG91bGQgYmUgZXF1YWxcbiAgICAgIFxuICAgICAgLy8gd3JpdGUgYmluYXJ5IHRvIGhlYXBcbiAgICAgIGhlYXAuc2V0KG5ldyBVaW50OEFycmF5KHVpbnQ4YXJyLmJ1ZmZlcikpO1xuICAgICAgXG4gICAgICAvLyBjcmVhdGUgb2JqZWN0IHdpdGggYmluYXJ5IG1lbW9yeSBhZGRyZXNzIGluZm9cbiAgICAgIGxldCBiaW5NZW1JbmZvID0geyBwdHI6IHB0ciwgbGVuZ3RoOiB1aW50OGFyci5sZW5ndGggIH1cblxuICAgICAgLy8gY29udmVydCBiaW5hcnkgdG8ganNvbiBzdHJcbiAgICAgIGNvbnN0IGpzb25fc3RyID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5iaW5hcnlfYmxvY2tzX3RvX2pzb24oSlNPTi5zdHJpbmdpZnkoYmluTWVtSW5mbykpO1xuICAgICAgXG4gICAgICAvLyBmcmVlIG1lbW9yeVxuICAgICAgTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fZnJlZShwdHIpO1xuICAgICAgXG4gICAgICAvLyBwYXJzZSByZXN1bHQgdG8ganNvblxuICAgICAgbGV0IGpzb24gPSBKU09OLnBhcnNlKGpzb25fc3RyKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJzaW5nIGpzb24gZ2l2ZXMgYXJyYXlzIG9mIGJsb2NrIGFuZCB0eCBzdHJpbmdzXG4gICAgICBqc29uLmJsb2NrcyA9IGpzb24uYmxvY2tzLm1hcChibG9ja1N0ciA9PiBKU09OLnBhcnNlKGJsb2NrU3RyKSk7ICAgICAgICAgIC8vIHJlcGxhY2UgYmxvY2sgc3RyaW5ncyB3aXRoIHBhcnNlZCBibG9ja3NcbiAgICAgIGpzb24udHhzID0ganNvbi50eHMubWFwKHR4cyA9PiB0eHMgPyB0eHMubWFwKHR4ID0+IEpTT04ucGFyc2UodHgucmVwbGFjZShcIixcIiwgXCJ7XCIpICsgXCJ9XCIpKSA6IFtdKTsgLy8gbW9kaWZ5IHR4IHN0cmluZyB0byBwcm9wZXIganNvbiBhbmQgcGFyc2UgLy8gVE9ETzogbW9yZSBlZmZpY2llbnQgd2F5IHRoYW4gdGhpcyBqc29uIG1hbmlwdWxhdGlvbj9cbiAgICAgIHJldHVybiBqc29uO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydCBYTVIgdG8gYXRvbWljIHVuaXRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXIgfCBzdHJpbmd9IGFtb3VudFhtciAtIGFtb3VudCBpbiBYTVIgdG8gY29udmVydCB0byBhdG9taWMgdW5pdHNcbiAgICogQHJldHVybiB7YmlnaW50fSBhbW91bnQgaW4gYXRvbWljIHVuaXRzXG4gICAqL1xuICBzdGF0aWMgeG1yVG9BdG9taWNVbml0cyhhbW91bnRYbXI6IG51bWJlciB8IHN0cmluZyk6IGJpZ2ludCB7XG4gICAgcmV0dXJuIEJpZ0ludChuZXcgRGVjaW1hbChhbW91bnRYbXIpLm11bChNb25lcm9VdGlscy5BVV9QRVJfWE1SLnRvU3RyaW5nKCkpLnRvRGVjaW1hbFBsYWNlcygwLCBEZWNpbWFsLlJPVU5EX0hBTEZfVVApLnRvRml4ZWQoMCkpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydCBhdG9taWMgdW5pdHMgdG8gWE1SLlxuICAgKiBcbiAgICogQHBhcmFtIHtiaWdpbnQgfCBzdHJpbmd9IGFtb3VudEF0b21pY1VuaXRzIC0gYW1vdW50IGluIGF0b21pYyB1bml0cyB0byBjb252ZXJ0IHRvIFhNUlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IGFtb3VudCBpbiBYTVIgXG4gICAqL1xuICBzdGF0aWMgYXRvbWljVW5pdHNUb1htcihhbW91bnRBdG9taWNVbml0czogYmlnaW50IHwgc3RyaW5nKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbmV3IERlY2ltYWwoYW1vdW50QXRvbWljVW5pdHMudG9TdHJpbmcoKSkuZGl2KE1vbmVyb1V0aWxzLkFVX1BFUl9YTVIudG9TdHJpbmcoKSkudG9EZWNpbWFsUGxhY2VzKDEyLCBEZWNpbWFsLlJPVU5EX0hBTEZfVVApLnRvTnVtYmVyKCk7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlIG9uZSBhdG9taWMgdW5pdHMgYnkgYW5vdGhlci5cbiAgICogXG4gICAqIEBwYXJhbSB7YmlnaW50fSBhdTEgZGl2aWRlbmRcbiAgICogQHBhcmFtIHtiaWdpbnR9IGF1MiBkaXZpc29yXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IHRoZSByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBkaXZpZGUoYXUxOiBiaWdpbnQsIGF1MjogYmlnaW50KTogbnVtYmVyIHtcbiAgICByZXR1cm4gbmV3IERlY2ltYWwoYXUxLnRvU3RyaW5nKCkpLmRpdihuZXcgRGVjaW1hbChhdTIudG9TdHJpbmcoKSkpLnRvRGVjaW1hbFBsYWNlcygxMiwgRGVjaW1hbC5ST1VORF9IQUxGX1VQKS50b051bWJlcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGx5IGEgYmlnaW50IGJ5IGEgbnVtYmVyIG9yIGJpZ2ludC5cbiAgICogXG4gICAqIEBwYXJhbSBhIGJpZ2ludCB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gYiBiaWdpbnQgb3IgbnVtYmVyIHRvIG11bHRpcGx5IGJ5XG4gICAqIEByZXR1cm5zIHRoZSBwcm9kdWN0IGFzIGEgYmlnaW50XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHkoYTogYmlnaW50LCBiOiBudW1iZXIgfCBiaWdpbnQpOiBiaWdpbnQge1xuICAgIHJldHVybiBCaWdJbnQobmV3IERlY2ltYWwoYS50b1N0cmluZygpKS5tdWwobmV3IERlY2ltYWwoYi50b1N0cmluZygpKSkudG9EZWNpbWFsUGxhY2VzKDAsIERlY2ltYWwuUk9VTkRfSEFMRl9VUCkudG9TdHJpbmcoKSk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgaXNIZXg2NChzdHIpIHtcbiAgICByZXR1cm4gdHlwZW9mIHN0ciA9PT0gXCJzdHJpbmdcIiAmJiBzdHIubGVuZ3RoID09PSA2NCAmJiBHZW5VdGlscy5pc0hleChzdHIpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZSBpZiB0aGUgZ2l2ZW4gdW5sb2NrIHRpbWUgaXMgYSB0aW1lc3RhbXAgb3IgYmxvY2sgaGVpZ2h0LlxuICAgKiBcbiAgICogQHBhcmFtIHVubG9ja1RpbWUgaXMgdGhlIHVubG9jayB0aW1lIHRvIGNoZWNrXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIHVubG9jayB0aW1lIGlzIGEgdGltZXN0YW1wLCBmYWxzZSBpZiBhIGJsb2NrIGhlaWdodFxuICAgKi9cbiAgc3RhdGljIGlzVGltZXN0YW1wKHVubG9ja1RpbWU6IGJpZ2ludCkge1xuICAgICAgXG4gICAgLy8gdGhyZXNob2xkIGZvciBkaXN0aW5ndWlzaGluZyBiZXR3ZWVuIHRpbWVzdGFtcCBhbmQgYmxvY2sgaGVpZ2h0XG4gICAgLy8gY3VycmVudCBibG9jayBoZWlnaHQgaXMgYXJvdW5kIDMgbWlsbGlvbiwgY3VycmVudCB1bml4IHRpbWVzdGFtcCBpcyBhcm91bmQgMS43IGJpbGxpb25cbiAgICBjb25zdCB0aHJlc2hvbGQgPSA1MDAwMDAwMDBuO1xuXG4gICAgcmV0dXJuIHVubG9ja1RpbWUgPj0gdGhyZXNob2xkO1xuICB9XG59XG5cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFFBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFNBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLGFBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLFlBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLHdCQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSxrQkFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDZSxNQUFNTyxXQUFXLENBQUM7O0VBRS9CO0VBQ0EsT0FBT0MsZUFBZSxHQUFHLEtBQUs7RUFDOUIsT0FBT0Msa0JBQWtCLEdBQUcsRUFBRTtFQUM5QixPQUFPQyxVQUFVLEdB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