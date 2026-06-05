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
    return "0.11.10";
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfZGVjaW1hbCIsIl9HZW5VdGlscyIsIl9MaWJyYXJ5VXRpbHMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJNb25lcm9VdGlscyIsIlBST1hZX1RPX1dPUktFUiIsIk5VTV9NTkVNT05JQ19XT1JEUyIsIkFVX1BFUl9YTVIiLCJSSU5HX1NJWkUiLCJnZXRWZXJzaW9uIiwic2V0UHJveHlUb1dvcmtlciIsInByb3h5VG9Xb3JrZXIiLCJ2YWxpZGF0ZU1uZW1vbmljIiwibW5lbW9uaWMiLCJhc3NlcnQiLCJ3b3JkcyIsInNwbGl0IiwibGVuZ3RoIiwiTW9uZXJvRXJyb3IiLCJpc1ZhbGlkUHJpdmF0ZVZpZXdLZXkiLCJwcml2YXRlVmlld0tleSIsInZhbGlkYXRlUHJpdmF0ZVZpZXdLZXkiLCJlIiwiaXNWYWxpZFB1YmxpY1ZpZXdLZXkiLCJwdWJsaWNWaWV3S2V5IiwidmFsaWRhdGVQdWJsaWNWaWV3S2V5IiwiaXNWYWxpZFByaXZhdGVTcGVuZEtleSIsInByaXZhdGVTcGVuZEtleSIsInZhbGlkYXRlUHJpdmF0ZVNwZW5kS2V5IiwiaXNWYWxpZFB1YmxpY1NwZW5kS2V5IiwicHVibGljU3BlbmRLZXkiLCJ2YWxpZGF0ZVB1YmxpY1NwZW5kS2V5IiwiaXNIZXg2NCIsImdldEludGVncmF0ZWRBZGRyZXNzIiwibmV0d29ya1R5cGUiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIkxpYnJhcnlVdGlscyIsImludm9rZVdvcmtlciIsInVuZGVmaW5lZCIsIkFycmF5IiwiZnJvbSIsImFyZ3VtZW50cyIsIk1vbmVyb05ldHdvcmtUeXBlIiwidmFsaWRhdGUiLCJHZW5VdGlscyIsImlzQmFzZTU4IiwiZ2V0V2FzbU1vZHVsZSIsImxvYWRXYXNtTW9kdWxlIiwicXVldWVUYXNrIiwiaW50ZWdyYXRlZEFkZHJlc3NKc29uIiwiZ2V0X2ludGVncmF0ZWRfYWRkcmVzc191dGlsIiwiY2hhckF0IiwiSlNPTiIsInBhcnNlIiwiaXNWYWxpZEFkZHJlc3MiLCJhZGRyZXNzIiwidmFsaWRhdGVBZGRyZXNzIiwiZXJyIiwiZXJyTXNnIiwidmFsaWRhdGVfYWRkcmVzcyIsImlzVmFsaWRQYXltZW50SWQiLCJ2YWxpZGF0ZVBheW1lbnRJZCIsImVxdWFsIiwiZ2V0TGFzdFR4UHViS2V5IiwidHhFeHRyYSIsImxhc3RQdWJLZXlJZHgiLCJpIiwidGFnIiwiQnVmZmVyIiwiVWludDhBcnJheSIsInNsaWNlIiwidG9TdHJpbmciLCJwYXltZW50SWRzRXF1YWwiLCJwYXltZW50SWQxIiwicGF5bWVudElkMiIsIm1heExlbmd0aCIsIk1hdGgiLCJtYXgiLCJtZXJnZVR4IiwidHhzIiwidHgiLCJhVHgiLCJnZXRIYXNoIiwibWVyZ2UiLCJwdXNoIiwianNvblRvQmluYXJ5IiwianNvbiIsImJpbk1lbUluZm9TdHIiLCJtYWxsb2NfYmluYXJ5X2Zyb21fanNvbiIsInN0cmluZ2lmeSIsImJpbk1lbUluZm8iLCJwdHIiLCJwYXJzZUludCIsInZpZXciLCJIRUFQVTgiLCJCWVRFU19QRVJfRUxFTUVOVCIsIl9mcmVlIiwiYmluYXJ5VG9Kc29uIiwidWludDhhcnIiLCJfbWFsbG9jIiwiaGVhcCIsImJ1ZmZlciIsImJ5dGVPZmZzZXQiLCJzZXQiLCJyZXRfc3RyaW5nIiwiYmluYXJ5X3RvX2pzb24iLCJiaW5hcnlCbG9ja3NUb0pzb24iLCJqc29uX3N0ciIsImJpbmFyeV9ibG9ja3NfdG9fanNvbiIsImJsb2NrcyIsIm1hcCIsImJsb2NrU3RyIiwicmVwbGFjZSIsInhtclRvQXRvbWljVW5pdHMiLCJhbW91bnRYbXIiLCJCaWdJbnQiLCJEZWNpbWFsIiwibXVsIiwidG9EZWNpbWFsUGxhY2VzIiwiUk9VTkRfSEFMRl9VUCIsInRvRml4ZWQiLCJhdG9taWNVbml0c1RvWG1yIiwiYW1vdW50QXRvbWljVW5pdHMiLCJkaXYiLCJ0b051bWJlciIsImRpdmlkZSIsImF1MSIsImF1MiIsIm11bHRpcGx5IiwiYSIsImIiLCJzdHIiLCJpc0hleCIsImlzVGltZXN0YW1wIiwidW5sb2NrVGltZSIsInRocmVzaG9sZCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb1V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IERlY2ltYWwgZnJvbSAnZGVjaW1hbC5qcyc7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvTmV0d29ya1R5cGUgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9OZXR3b3JrVHlwZVwiO1xuaW1wb3J0IENvbm5lY3Rpb25UeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvQ29ubmVjdGlvblR5cGVcIjtcblxuLyoqXG4gKiBDb2xsZWN0aW9uIG9mIE1vbmVybyB1dGlsaXRpZXMuIFJ1bnMgaW4gYSB3b3JrZXIgdGhyZWFkIGJ5IGRlZmF1bHQuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1V0aWxzIHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHN0YXRpYyBQUk9YWV9UT19XT1JLRVIgPSBmYWxzZTtcbiAgc3RhdGljIE5VTV9NTkVNT05JQ19XT1JEUyA9IDI1O1xuICBzdGF0aWMgQVVfUEVSX1hNUiA9IDEwMDAwMDAwMDAwMDBuO1xuICBzdGF0aWMgUklOR19TSVpFID0gMTI7XG5cbiAgLyoqXG4gICAqIDxwPkdldCB0aGUgdmVyc2lvbiBvZiB0aGUgbW9uZXJvLXRzIGxpYnJhcnkuPHA+XG4gICAqIFxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSB2ZXJzaW9uIG9mIHRoaXMgbW9uZXJvLXRzIGxpYnJhcnlcbiAgICovXG4gIHN0YXRpYyBnZXRWZXJzaW9uKCkge1xuICAgIHJldHVybiBcIjAuMTEuMTBcIjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEVuYWJsZSBvciBkaXNhYmxlIHByb3h5aW5nIHRoZXNlIHV0aWxpdGllcyB0byBhIHdvcmtlciB0aHJlYWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHByb3h5VG9Xb3JrZXIgLSBzcGVjaWZpZXMgaWYgdXRpbGl0aWVzIHNob3VsZCBiZSBwcm94aWVkIHRvIGEgd29ya2VyXG4gICAqL1xuICBzdGF0aWMgc2V0UHJveHlUb1dvcmtlcihwcm94eVRvV29ya2VyKSB7XG4gICAgTW9uZXJvVXRpbHMuUFJPWFlfVE9fV09SS0VSID0gcHJveHlUb1dvcmtlciB8fCBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gbW5lbW9uaWMsIHRocm93IGFuIGVycm9yIGlmIGludmFsaWQuXG4gICAqXG4gICAqIFRPRE86IGltcHJvdmUgdmFsaWRhdGlvbiwgdXNlIG5ldHdvcmsgdHlwZVxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1uZW1vbmljIC0gbW5lbW9uaWMgdG8gdmFsaWRhdGVcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZU1uZW1vbmljKG1uZW1vbmljKSB7XG4gICAgYXNzZXJ0KG1uZW1vbmljLCBcIk1uZW1vbmljIHBocmFzZSBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgbGV0IHdvcmRzID0gbW5lbW9uaWMuc3BsaXQoXCIgXCIpO1xuICAgIGlmICh3b3Jkcy5sZW5ndGggIT09IE1vbmVyb1V0aWxzLk5VTV9NTkVNT05JQ19XT1JEUykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW5lbW9uaWMgcGhyYXNlIGlzIFwiICsgd29yZHMubGVuZ3RoICsgXCIgd29yZHMgYnV0IG11c3QgYmUgXCIgKyBNb25lcm9VdGlscy5OVU1fTU5FTU9OSUNfV09SRFMpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIGEgcHJpdmF0ZSB2aWV3IGtleSBpcyB2YWxpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcml2YXRlVmlld0tleSBpcyB0aGUgcHJpdmF0ZSB2aWV3IGtleSB0byB2YWxpZGF0ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2w+fSB0cnVlIGlmIHRoZSBwcml2YXRlIHZpZXcga2V5IGlzIHZhbGlkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpc1ZhbGlkUHJpdmF0ZVZpZXdLZXkocHJpdmF0ZVZpZXdLZXkpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgTW9uZXJvVXRpbHMudmFsaWRhdGVQcml2YXRlVmlld0tleShwcml2YXRlVmlld0tleSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIGEgcHVibGljIHZpZXcga2V5IGlzIHZhbGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1YmxpY1ZpZXdLZXkgaXMgdGhlIHB1YmxpYyB2aWV3IGtleSB0byB2YWxpZGF0ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2w+fSB0cnVlIGlmIHRoZSBwdWJsaWMgdmlldyBrZXkgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlzVmFsaWRQdWJsaWNWaWV3S2V5KHB1YmxpY1ZpZXdLZXkpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgTW9uZXJvVXRpbHMudmFsaWRhdGVQdWJsaWNWaWV3S2V5KHB1YmxpY1ZpZXdLZXkpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiBhIHByaXZhdGUgc3BlbmQga2V5IGlzIHZhbGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByaXZhdGVTcGVuZEtleSBpcyB0aGUgcHJpdmF0ZSBzcGVuZCBrZXkgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sPn0gdHJ1ZSBpZiB0aGUgcHJpdmF0ZSBzcGVuZCBrZXkgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlzVmFsaWRQcml2YXRlU3BlbmRLZXkocHJpdmF0ZVNwZW5kS2V5KSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IE1vbmVyb1V0aWxzLnZhbGlkYXRlUHJpdmF0ZVNwZW5kS2V5KHByaXZhdGVTcGVuZEtleSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIGEgcHVibGljIHNwZW5kIGtleSBpcyB2YWxpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdWJsaWNTcGVuZEtleSBpcyB0aGUgcHVibGljIHNwZW5kIGtleSB0byB2YWxpZGF0ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2w+fSB0cnVlIGlmIHRoZSBwdWJsaWMgc3BlbmQga2V5IGlzIHZhbGlkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpc1ZhbGlkUHVibGljU3BlbmRLZXkocHVibGljU3BlbmRLZXkpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgTW9uZXJvVXRpbHMudmFsaWRhdGVQdWJsaWNTcGVuZEtleShwdWJsaWNTcGVuZEtleSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIHByaXZhdGUgdmlldyBrZXksIHRocm93IGFuIGVycm9yIGlmIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcml2YXRlVmlld0tleSAtIHByaXZhdGUgdmlldyBrZXkgdG8gdmFsaWRhdGVcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZVByaXZhdGVWaWV3S2V5KHByaXZhdGVWaWV3S2V5KSB7XG4gICAgaWYgKCFNb25lcm9VdGlscy5pc0hleDY0KHByaXZhdGVWaWV3S2V5KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicHJpdmF0ZSB2aWV3IGtleSBleHBlY3RlZCB0byBiZSA2NCBoZXggY2hhcmFjdGVyc1wiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBwdWJsaWMgdmlldyBrZXksIHRocm93IGFuIGVycm9yIGlmIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdWJsaWNWaWV3S2V5IC0gcHVibGljIHZpZXcga2V5IHRvIHZhbGlkYXRlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVQdWJsaWNWaWV3S2V5KHB1YmxpY1ZpZXdLZXkpIHtcbiAgICBpZiAoIU1vbmVyb1V0aWxzLmlzSGV4NjQocHVibGljVmlld0tleSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcInB1YmxpYyB2aWV3IGtleSBleHBlY3RlZCB0byBiZSA2NCBoZXggY2hhcmFjdGVyc1wiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBwcml2YXRlIHNwZW5kIGtleSwgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByaXZhdGVTcGVuZEtleSAtIHByaXZhdGUgc3BlbmQga2V5IHRvIHZhbGlkYXRlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVQcml2YXRlU3BlbmRLZXkocHJpdmF0ZVNwZW5kS2V5KSB7XG4gICAgaWYgKCFNb25lcm9VdGlscy5pc0hleDY0KHByaXZhdGVTcGVuZEtleSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcInByaXZhdGUgc3BlbmQga2V5IGV4cGVjdGVkIHRvIGJlIDY0IGhleCBjaGFyYWN0ZXJzXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIHB1YmxpYyBzcGVuZCBrZXksIHRocm93IGFuIGVycm9yIGlmIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdWJsaWNTcGVuZEtleSAtIHB1YmxpYyBzcGVuZCBrZXkgdG8gdmFsaWRhdGVcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZVB1YmxpY1NwZW5kS2V5KHB1YmxpY1NwZW5kS2V5KSB7XG4gICAgaWYgKCFNb25lcm9VdGlscy5pc0hleDY0KHB1YmxpY1NwZW5kS2V5KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicHVibGljIHNwZW5kIGtleSBleHBlY3RlZCB0byBiZSA2NCBoZXggY2hhcmFjdGVyc1wiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhbiBpbnRlZ3JhdGVkIGFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb05ldHdvcmtUeXBlfSBuZXR3b3JrVHlwZSAtIG5ldHdvcmsgdHlwZSBvZiB0aGUgaW50ZWdyYXRlZCBhZGRyZXNzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdGFuZGFyZEFkZHJlc3MgLSBhZGRyZXNzIHRvIGRlcml2ZSB0aGUgaW50ZWdyYXRlZCBhZGRyZXNzIGZyb21cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtwYXltZW50SWRdIC0gb3B0aW9uYWxseSBzcGVjaWZpZXMgdGhlIGludGVncmF0ZWQgYWRkcmVzcydzIHBheW1lbnQgaWQgKGRlZmF1bHRzIHRvIHJhbmRvbSBwYXltZW50IGlkKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPn0gdGhlIGludGVncmF0ZWQgYWRkcmVzc1xuICAgKi9cbiAgc3RhdGljIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKG5ldHdvcmtUeXBlOiBNb25lcm9OZXR3b3JrVHlwZSwgc3RhbmRhcmRBZGRyZXNzOiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZykge1xuICAgIGlmIChNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIpIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoYXdhaXQgTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih1bmRlZmluZWQsIFwibW9uZXJvVXRpbHNHZXRJbnRlZ3JhdGVkQWRkcmVzc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgXG4gICAgLy8gdmFsaWRhdGUgaW5wdXRzXG4gICAgTW9uZXJvTmV0d29ya1R5cGUudmFsaWRhdGUobmV0d29ya1R5cGUpO1xuICAgIGFzc2VydCh0eXBlb2Ygc3RhbmRhcmRBZGRyZXNzID09PSBcInN0cmluZ1wiLCBcIkFkZHJlc3MgaXMgbm90IHN0cmluZ1wiKTtcbiAgICBhc3NlcnQoc3RhbmRhcmRBZGRyZXNzLmxlbmd0aCA+IDAsIFwiQWRkcmVzcyBpcyBlbXB0eVwiKTtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNCYXNlNTgoc3RhbmRhcmRBZGRyZXNzKSwgXCJBZGRyZXNzIGlzIG5vdCBiYXNlIDU4XCIpO1xuICAgIFxuICAgIC8vIGxvYWQga2V5cyBtb2R1bGUgYnkgZGVmYXVsdFxuICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpID09PSB1bmRlZmluZWQpIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIGdldCBpbnRlZ3JhdGVkIGFkZHJlc3MgaW4gcXVldWVcbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgbGV0IGludGVncmF0ZWRBZGRyZXNzSnNvbiA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuZ2V0X2ludGVncmF0ZWRfYWRkcmVzc191dGlsKG5ldHdvcmtUeXBlLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCA/IHBheW1lbnRJZCA6IFwiXCIpO1xuICAgICAgaWYgKGludGVncmF0ZWRBZGRyZXNzSnNvbi5jaGFyQXQoMCkgIT09ICd7JykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGludGVncmF0ZWRBZGRyZXNzSnNvbik7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKEpTT04ucGFyc2UoaW50ZWdyYXRlZEFkZHJlc3NKc29uKSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgaWYgdGhlIGdpdmVuIGFkZHJlc3MgaXMgdmFsaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGFkZHJlc3NcbiAgICogQHBhcmFtIHtNb25lcm9OZXR3b3JrVHlwZX0gbmV0d29ya1R5cGUgLSBuZXR3b3JrIHR5cGUgb2YgdGhlIGFkZHJlc3MgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgYWRkcmVzcyBpcyB2YWxpZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaXNWYWxpZEFkZHJlc3MoYWRkcmVzcywgbmV0d29ya1R5cGUpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgTW9uZXJvVXRpbHMudmFsaWRhdGVBZGRyZXNzKGFkZHJlc3MsIG5ldHdvcmtUeXBlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBhZGRyZXNzLCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGFkZHJlc3MgdG8gdmFsaWRhdGVcbiAgICogQHBhcmFtIHtNb25lcm9OZXR3b3JrVHlwZX0gbmV0d29ya1R5cGUgLSBuZXR3b3JrIHR5cGUgb2YgdGhlIGFkZHJlc3MgdG8gdmFsaWRhdGVcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZUFkZHJlc3MoYWRkcmVzcywgbmV0d29ya1R5cGUpIHtcbiAgICBpZiAoTW9uZXJvVXRpbHMuUFJPWFlfVE9fV09SS0VSKSByZXR1cm4gTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih1bmRlZmluZWQsIFwibW9uZXJvVXRpbHNWYWxpZGF0ZUFkZHJlc3NcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBpbnB1dHNcbiAgICBhc3NlcnQodHlwZW9mIGFkZHJlc3MgPT09IFwic3RyaW5nXCIsIFwiQWRkcmVzcyBpcyBub3Qgc3RyaW5nXCIpO1xuICAgIGFzc2VydChhZGRyZXNzLmxlbmd0aCA+IDAsIFwiQWRkcmVzcyBpcyBlbXB0eVwiKTtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNCYXNlNTgoYWRkcmVzcyksIFwiQWRkcmVzcyBpcyBub3QgYmFzZSA1OFwiKTtcbiAgICBuZXR3b3JrVHlwZSA9IE1vbmVyb05ldHdvcmtUeXBlLmZyb20obmV0d29ya1R5cGUpO1xuICAgIFxuICAgIC8vIGxvYWQga2V5cyBtb2R1bGUgYnkgZGVmYXVsdFxuICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpID09PSB1bmRlZmluZWQpIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFkZHJlc3MgaW4gcXVldWVcbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5xdWV1ZVRhc2soYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICBsZXQgZXJyTXNnID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS52YWxpZGF0ZV9hZGRyZXNzKGFkZHJlc3MsIG5ldHdvcmtUeXBlKTtcbiAgICAgIGlmIChlcnJNc2cpIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnJNc2cpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogRGV0ZXJtaW5lIGlmIHRoZSBnaXZlbiBwYXltZW50IGlkIGlzIHZhbGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBheW1lbnRJZCAtIHBheW1lbnQgaWQgdG8gZGV0ZXJtaW5lIGlmIHZhbGlkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbD59IHRydWUgaWYgdGhlIHBheW1lbnQgaWQgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlzVmFsaWRQYXltZW50SWQocGF5bWVudElkKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IE1vbmVyb1V0aWxzLnZhbGlkYXRlUGF5bWVudElkKHBheW1lbnRJZCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIHBheW1lbnQgaWQsIHRocm93IGFuIGVycm9yIGlmIGludmFsaWQuXG4gICAqIFxuICAgKiBUT0RPOiBpbXByb3ZlIHZhbGlkYXRpb25cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXltZW50SWQgLSBwYXltZW50IGlkIHRvIHZhbGlkYXRlIFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlUGF5bWVudElkKHBheW1lbnRJZCkge1xuICAgIGFzc2VydC5lcXVhbCh0eXBlb2YgcGF5bWVudElkLCBcInN0cmluZ1wiKTtcbiAgICBhc3NlcnQocGF5bWVudElkLmxlbmd0aCA9PT0gMTYgfHwgcGF5bWVudElkLmxlbmd0aCA9PT0gNjQpO1xuICB9XG4gICAgXG4gIC8qKlxuICAgKiBEZWNvZGUgdHggZXh0cmEgYWNjb3JkaW5nIHRvIGh0dHBzOi8vY3J5cHRvbm90ZS5vcmcvY25zL2NuczAwNS50eHQgYW5kXG4gICAqIHJldHVybnMgdGhlIGxhc3QgdHggcHViIGtleS5cbiAgICogXG4gICAqIFRPRE86IHVzZSBjKysgYnJpZGdlIGZvciB0aGlzXG4gICAqIFxuICAgKiBAcGFyYW0gW2J5dGVbXV0gdHhFeHRyYSAtIGFycmF5IG9mIHR4IGV4dHJhIGJ5dGVzXG4gICAqIEByZXR1cm4ge3N0cmluZ30gdGhlIGxhc3QgcHViIGtleSBhcyBhIGhleGlkZWNpbWFsIHN0cmluZ1xuICAgKi9cbiAgc3RhdGljIGFzeW5jIGdldExhc3RUeFB1YktleSh0eEV4dHJhKSB7XG4gICAgbGV0IGxhc3RQdWJLZXlJZHg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eEV4dHJhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgdGFnID0gdHhFeHRyYVtpXTtcbiAgICAgIGlmICh0YWcgPT09IDAgfHwgdGFnID09PSAyKSB7XG4gICAgICAgIGkgKz0gMSArIHR4RXh0cmFbaSArIDFdOyAgLy8gYWR2YW5jZSB0byBuZXh0IHRhZ1xuICAgICAgfSBlbHNlIGlmICh0YWcgPT09IDEpIHtcbiAgICAgICAgbGFzdFB1YktleUlkeCA9IGkgKyAxO1xuICAgICAgICBpICs9IDEgKyAzMjsgICAgICAgICAgICAgIC8vIGFkdmFuY2UgdG8gbmV4dCB0YWdcbiAgICAgIH0gZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIHN1Yi1maWVsZCB0YWc6IFwiICsgdGFnKTtcbiAgICB9XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKG5ldyBVaW50OEFycmF5KHR4RXh0cmEuc2xpY2UobGFzdFB1YktleUlkeCwgbGFzdFB1YktleUlkeCArIDMyKSkpLnRvU3RyaW5nKFwiaGV4XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0d28gcGF5bWVudCBpZHMgYXJlIGZ1bmN0aW9uYWxseSBlcXVhbC5cbiAgICogXG4gICAqIEZvciBleGFtcGxlLCAwMzI4NGU0MWMzNDJmMDMyIGFuZCAwMzI4NGU0MWMzNDJmMDMyMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIGFyZSBjb25zaWRlcmVkIGVxdWFsLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBheW1lbnRJZDEgaXMgYSBwYXltZW50IGlkIHRvIGNvbXBhcmVcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBheW1lbnRJZDIgaXMgYSBwYXltZW50IGlkIHRvIGNvbXBhcmVcbiAgICogQHJldHVybiB7Ym9vbH0gdHJ1ZSBpZiB0aGUgcGF5bWVudCBpZHMgYXJlIGVxdWFsLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBwYXltZW50SWRzRXF1YWwocGF5bWVudElkMSwgcGF5bWVudElkMikge1xuICAgIGxldCBtYXhMZW5ndGggPSBNYXRoLm1heChwYXltZW50SWQxLmxlbmd0aCwgcGF5bWVudElkMi5sZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4TGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChpIDwgcGF5bWVudElkMS5sZW5ndGggJiYgaSA8IHBheW1lbnRJZDIubGVuZ3RoICYmIHBheW1lbnRJZDFbaV0gIT09IHBheW1lbnRJZDJbaV0pIHJldHVybiBmYWxzZTtcbiAgICAgIGlmIChpID49IHBheW1lbnRJZDEubGVuZ3RoICYmIHBheW1lbnRJZDJbaV0gIT09ICcwJykgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKGkgPj0gcGF5bWVudElkMi5sZW5ndGggJiYgcGF5bWVudElkMVtpXSAhPT0gJzAnKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIFxuICAvKipcbiAgICogTWVyZ2VzIGEgdHJhbnNhY3Rpb24gaW50byBhIGxpc3Qgb2YgZXhpc3RpbmcgdHJhbnNhY3Rpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeFtdfSB0eHMgLSBleGlzdGluZyB0cmFuc2FjdGlvbnMgdG8gbWVyZ2UgaW50b1xuICAgKiBAcGFyYW0ge01vbmVyb1R4fSB0eCAtIHRyYW5zYWN0aW9uIHRvIG1lcmdlIGludG8gdGhlIGxpc3RcbiAgICovXG4gIHN0YXRpYyBtZXJnZVR4KHR4cywgdHgpIHtcbiAgICBmb3IgKGxldCBhVHggb2YgdHhzKSB7XG4gICAgICBpZiAoYVR4LmdldEhhc2goKSA9PT0gdHguZ2V0SGFzaCgpKSB7XG4gICAgICAgIGFUeC5tZXJnZSh0eCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdHhzLnB1c2godHgpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydCB0aGUgZ2l2ZW4gSlNPTiB0byBhIGJpbmFyeSBVaW50OEFycmF5IHVzaW5nIE1vbmVybydzIHBvcnRhYmxlIHN0b3JhZ2UgZm9ybWF0LlxuICAgKiBcbiAgICogQHBhcmFtIHtvYmplY3R9IGpzb24gLSBqc29uIHRvIGNvbnZlcnQgdG8gYmluYXJ5XG4gICAqIEByZXR1cm4ge1Byb21pc2U8VWludDhBcnJheT59IHRoZSBqc29uIGNvbnZlcnRlZCB0byBwb3J0YWJsZSBzdG9yYWdlIGJpbmFyeVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGpzb25Ub0JpbmFyeShqc29uKSB7XG4gICAgaWYgKE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUikgcmV0dXJuIExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodW5kZWZpbmVkLCBcIm1vbmVyb1V0aWxzSnNvblRvQmluYXJ5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgXG4gICAgLy8gbG9hZCBrZXlzIG1vZHVsZSBieSBkZWZhdWx0XG4gICAgaWYgKExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkgPT09IHVuZGVmaW5lZCkgYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gdXNlIHdhc20gaW4gcXVldWVcbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5xdWV1ZVRhc2soYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICBcbiAgICAgIC8vIHNlcmlhbGl6ZSBqc29uIHRvIGJpbmFyeSB3aGljaCBpcyBzdG9yZWQgaW4gYysrIGhlYXBcbiAgICAgIGxldCBiaW5NZW1JbmZvU3RyID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5tYWxsb2NfYmluYXJ5X2Zyb21fanNvbihKU09OLnN0cmluZ2lmeShqc29uKSk7XG4gICAgICBcbiAgICAgIC8vIHNhbml0aXplIGJpbmFyeSBtZW1vcnkgYWRkcmVzcyBpbmZvXG4gICAgICBsZXQgYmluTWVtSW5mbyA9IEpTT04ucGFyc2UoYmluTWVtSW5mb1N0cik7XG4gICAgICBiaW5NZW1JbmZvLnB0ciA9IHBhcnNlSW50KGJpbk1lbUluZm8ucHRyKTtcbiAgICAgIGJpbk1lbUluZm8ubGVuZ3RoID0gcGFyc2VJbnQoYmluTWVtSW5mby5sZW5ndGgpO1xuICAgICAgXG4gICAgICAvLyByZWFkIGJpbmFyeSBkYXRhIGZyb20gaGVhcCB0byBVaW50OEFycmF5XG4gICAgICBsZXQgdmlldyA9IG5ldyBVaW50OEFycmF5KGJpbk1lbUluZm8ubGVuZ3RoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmluTWVtSW5mby5sZW5ndGg7IGkrKykge1xuICAgICAgICB2aWV3W2ldID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQVThbYmluTWVtSW5mby5wdHIgLyBVaW50OEFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICsgaV07XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGZyZWUgYmluYXJ5IG9uIGhlYXBcbiAgICAgIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuX2ZyZWUoYmluTWVtSW5mby5wdHIpO1xuICAgICAgXG4gICAgICAvLyByZXR1cm4ganNvbiBmcm9tIGJpbmFyeSBkYXRhXG4gICAgICByZXR1cm4gdmlldztcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnQgdGhlIGdpdmVuIHBvcnRhYmxlIHN0b3JhZ2UgYmluYXJ5IHRvIEpTT04uXG4gICAqIFxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4YXJyIC0gYmluYXJ5IGRhdGEgaW4gTW9uZXJvJ3MgcG9ydGFibGUgc3RvcmFnZSBmb3JtYXRcbiAgICogQHJldHVybiB7UHJvbWlzZTxvYmplY3Q+fSBKU09OIG9iamVjdCBjb252ZXJ0ZWQgZnJvbSB0aGUgYmluYXJ5IGRhdGFcbiAgICovXG4gIHN0YXRpYyBhc3luYyBiaW5hcnlUb0pzb24odWludDhhcnIpIHtcbiAgICBpZiAoTW9uZXJvVXRpbHMuUFJPWFlfVE9fV09SS0VSKSByZXR1cm4gTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih1bmRlZmluZWQsIFwibW9uZXJvVXRpbHNCaW5hcnlUb0pzb25cIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICBcbiAgICAvLyBsb2FkIGtleXMgbW9kdWxlIGJ5IGRlZmF1bHRcbiAgICBpZiAoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSA9PT0gdW5kZWZpbmVkKSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyB1c2Ugd2FzbSBpbiBxdWV1ZVxuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLnF1ZXVlVGFzayhhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIFxuICAgICAgLy8gYWxsb2NhdGUgc3BhY2UgaW4gYysrIGhlYXAgZm9yIGJpbmFyeVxuICAgICAgbGV0IHB0ciA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuX21hbGxvYyh1aW50OGFyci5sZW5ndGggKiB1aW50OGFyci5CWVRFU19QRVJfRUxFTUVOVCk7XG4gICAgICBsZXQgaGVhcCA9IG5ldyBVaW50OEFycmF5KExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuSEVBUFU4LmJ1ZmZlciwgcHRyLCB1aW50OGFyci5sZW5ndGggKiB1aW50OGFyci5CWVRFU19QRVJfRUxFTUVOVCk7XG4gICAgICBpZiAocHRyICE9PSBoZWFwLmJ5dGVPZmZzZXQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1lbW9yeSBwdHIgIT09IGhlYXAuYnl0ZU9mZnNldFwiKTsgLy8gc2hvdWxkIGJlIGVxdWFsXG4gICAgICBcbiAgICAgIC8vIHdyaXRlIGJpbmFyeSB0byBoZWFwXG4gICAgICBoZWFwLnNldChuZXcgVWludDhBcnJheSh1aW50OGFyci5idWZmZXIpKTtcbiAgICAgIFxuICAgICAgLy8gY3JlYXRlIG9iamVjdCB3aXRoIGJpbmFyeSBtZW1vcnkgYWRkcmVzcyBpbmZvXG4gICAgICBsZXQgYmluTWVtSW5mbyA9IHsgcHRyOiBwdHIsIGxlbmd0aDogdWludDhhcnIubGVuZ3RoIH07XG4gICAgICBcbiAgICAgIC8vIGNvbnZlcnQgYmluYXJ5IHRvIGpzb24gc3RyXG4gICAgICBjb25zdCByZXRfc3RyaW5nID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5iaW5hcnlfdG9fanNvbihKU09OLnN0cmluZ2lmeShiaW5NZW1JbmZvKSk7XG4gICAgICBcbiAgICAgIC8vIGZyZWUgYmluYXJ5IG9uIGhlYXBcbiAgICAgIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuX2ZyZWUocHRyKTtcbiAgICAgIFxuICAgICAgLy8gcGFyc2UgYW5kIHJldHVybiBqc29uXG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShyZXRfc3RyaW5nKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnQgdGhlIGJpbmFyeSByZXNwb25zZSBmcm9tIGRhZW1vbiBSUEMgYmxvY2sgcmV0cmlldmFsIHRvIEpTT04uXG4gICAqIFxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4YXJyIC0gYmluYXJ5IHJlc3BvbnNlIGZyb20gZGFlbW9uIFJQQyB3aGVuIGdldHRpbmcgYmxvY2tzXG4gICAqIEByZXR1cm4ge1Byb21pc2U8b2JqZWN0Pn0gSlNPTiBvYmplY3Qgd2l0aCB0aGUgYmxvY2tzIGRhdGFcbiAgICovXG4gIHN0YXRpYyBhc3luYyBiaW5hcnlCbG9ja3NUb0pzb24odWludDhhcnIpIHtcbiAgICBpZiAoTW9uZXJvVXRpbHMuUFJPWFlfVE9fV09SS0VSKSByZXR1cm4gTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih1bmRlZmluZWQsIFwibW9uZXJvVXRpbHNCaW5hcnlCbG9ja3NUb0pzb25cIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICBcbiAgICAvLyBsb2FkIGtleXMgbW9kdWxlIGJ5IGRlZmF1bHRcbiAgICBpZiAoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSA9PT0gdW5kZWZpbmVkKSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyB1c2Ugd2FzbSBpbiBxdWV1ZVxuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLnF1ZXVlVGFzayhhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIFxuICAgICAgLy8gYWxsb2NhdGUgc3BhY2UgaW4gYysrIGhlYXAgZm9yIGJpbmFyeVxuICAgICAgbGV0IHB0ciA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuX21hbGxvYyh1aW50OGFyci5sZW5ndGggKiB1aW50OGFyci5CWVRFU19QRVJfRUxFTUVOVCk7XG4gICAgICBsZXQgaGVhcCA9IG5ldyBVaW50OEFycmF5KExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuSEVBUFU4LmJ1ZmZlciwgcHRyLCB1aW50OGFyci5sZW5ndGggKiB1aW50OGFyci5CWVRFU19QRVJfRUxFTUVOVCk7XG4gICAgICBpZiAocHRyICE9PSBoZWFwLmJ5dGVPZmZzZXQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1lbW9yeSBwdHIgIT09IGhlYXAuYnl0ZU9mZnNldFwiKTsgLy8gc2hvdWxkIGJlIGVxdWFsXG4gICAgICBcbiAgICAgIC8vIHdyaXRlIGJpbmFyeSB0byBoZWFwXG4gICAgICBoZWFwLnNldChuZXcgVWludDhBcnJheSh1aW50OGFyci5idWZmZXIpKTtcbiAgICAgIFxuICAgICAgLy8gY3JlYXRlIG9iamVjdCB3aXRoIGJpbmFyeSBtZW1vcnkgYWRkcmVzcyBpbmZvXG4gICAgICBsZXQgYmluTWVtSW5mbyA9IHsgcHRyOiBwdHIsIGxlbmd0aDogdWludDhhcnIubGVuZ3RoICB9XG5cbiAgICAgIC8vIGNvbnZlcnQgYmluYXJ5IHRvIGpzb24gc3RyXG4gICAgICBjb25zdCBqc29uX3N0ciA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuYmluYXJ5X2Jsb2Nrc190b19qc29uKEpTT04uc3RyaW5naWZ5KGJpbk1lbUluZm8pKTtcbiAgICAgIFxuICAgICAgLy8gZnJlZSBtZW1vcnlcbiAgICAgIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuX2ZyZWUocHRyKTtcbiAgICAgIFxuICAgICAgLy8gcGFyc2UgcmVzdWx0IHRvIGpzb25cbiAgICAgIGxldCBqc29uID0gSlNPTi5wYXJzZShqc29uX3N0cik7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyc2luZyBqc29uIGdpdmVzIGFycmF5cyBvZiBibG9jayBhbmQgdHggc3RyaW5nc1xuICAgICAganNvbi5ibG9ja3MgPSBqc29uLmJsb2Nrcy5tYXAoYmxvY2tTdHIgPT4gSlNPTi5wYXJzZShibG9ja1N0cikpOyAgICAgICAgICAvLyByZXBsYWNlIGJsb2NrIHN0cmluZ3Mgd2l0aCBwYXJzZWQgYmxvY2tzXG4gICAgICBqc29uLnR4cyA9IGpzb24udHhzLm1hcCh0eHMgPT4gdHhzID8gdHhzLm1hcCh0eCA9PiBKU09OLnBhcnNlKHR4LnJlcGxhY2UoXCIsXCIsIFwie1wiKSArIFwifVwiKSkgOiBbXSk7IC8vIG1vZGlmeSB0eCBzdHJpbmcgdG8gcHJvcGVyIGpzb24gYW5kIHBhcnNlIC8vIFRPRE86IG1vcmUgZWZmaWNpZW50IHdheSB0aGFuIHRoaXMganNvbiBtYW5pcHVsYXRpb24/XG4gICAgICByZXR1cm4ganNvbjtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnQgWE1SIHRvIGF0b21pYyB1bml0cy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyIHwgc3RyaW5nfSBhbW91bnRYbXIgLSBhbW91bnQgaW4gWE1SIHRvIGNvbnZlcnQgdG8gYXRvbWljIHVuaXRzXG4gICAqIEByZXR1cm4ge2JpZ2ludH0gYW1vdW50IGluIGF0b21pYyB1bml0c1xuICAgKi9cbiAgc3RhdGljIHhtclRvQXRvbWljVW5pdHMoYW1vdW50WG1yOiBudW1iZXIgfCBzdHJpbmcpOiBiaWdpbnQge1xuICAgIHJldHVybiBCaWdJbnQobmV3IERlY2ltYWwoYW1vdW50WG1yKS5tdWwoTW9uZXJvVXRpbHMuQVVfUEVSX1hNUi50b1N0cmluZygpKS50b0RlY2ltYWxQbGFjZXMoMCwgRGVjaW1hbC5ST1VORF9IQUxGX1VQKS50b0ZpeGVkKDApKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnQgYXRvbWljIHVuaXRzIHRvIFhNUi5cbiAgICogXG4gICAqIEBwYXJhbSB7YmlnaW50IHwgc3RyaW5nfSBhbW91bnRBdG9taWNVbml0cyAtIGFtb3VudCBpbiBhdG9taWMgdW5pdHMgdG8gY29udmVydCB0byBYTVJcbiAgICogQHJldHVybiB7bnVtYmVyfSBhbW91bnQgaW4gWE1SIFxuICAgKi9cbiAgc3RhdGljIGF0b21pY1VuaXRzVG9YbXIoYW1vdW50QXRvbWljVW5pdHM6IGJpZ2ludCB8IHN0cmluZyk6IG51bWJlciB7XG4gICAgcmV0dXJuIG5ldyBEZWNpbWFsKGFtb3VudEF0b21pY1VuaXRzLnRvU3RyaW5nKCkpLmRpdihNb25lcm9VdGlscy5BVV9QRVJfWE1SLnRvU3RyaW5nKCkpLnRvRGVjaW1hbFBsYWNlcygxMiwgRGVjaW1hbC5ST1VORF9IQUxGX1VQKS50b051bWJlcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZSBvbmUgYXRvbWljIHVuaXRzIGJ5IGFub3RoZXIuXG4gICAqIFxuICAgKiBAcGFyYW0ge2JpZ2ludH0gYXUxIGRpdmlkZW5kXG4gICAqIEBwYXJhbSB7YmlnaW50fSBhdTIgZGl2aXNvclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSB0aGUgcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgZGl2aWRlKGF1MTogYmlnaW50LCBhdTI6IGJpZ2ludCk6IG51bWJlciB7XG4gICAgcmV0dXJuIG5ldyBEZWNpbWFsKGF1MS50b1N0cmluZygpKS5kaXYobmV3IERlY2ltYWwoYXUyLnRvU3RyaW5nKCkpKS50b0RlY2ltYWxQbGFjZXMoMTIsIERlY2ltYWwuUk9VTkRfSEFMRl9VUCkudG9OdW1iZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBseSBhIGJpZ2ludCBieSBhIG51bWJlciBvciBiaWdpbnQuXG4gICAqIFxuICAgKiBAcGFyYW0gYSBiaWdpbnQgdG8gbXVsdGlwbHlcbiAgICogQHBhcmFtIGIgYmlnaW50IG9yIG51bWJlciB0byBtdWx0aXBseSBieVxuICAgKiBAcmV0dXJucyB0aGUgcHJvZHVjdCBhcyBhIGJpZ2ludFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5KGE6IGJpZ2ludCwgYjogbnVtYmVyIHwgYmlnaW50KTogYmlnaW50IHtcbiAgICByZXR1cm4gQmlnSW50KG5ldyBEZWNpbWFsKGEudG9TdHJpbmcoKSkubXVsKG5ldyBEZWNpbWFsKGIudG9TdHJpbmcoKSkpLnRvRGVjaW1hbFBsYWNlcygwLCBEZWNpbWFsLlJPVU5EX0hBTEZfVVApLnRvU3RyaW5nKCkpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGlzSGV4NjQoc3RyKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzdHIgPT09IFwic3RyaW5nXCIgJiYgc3RyLmxlbmd0aCA9PT0gNjQgJiYgR2VuVXRpbHMuaXNIZXgoc3RyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgaWYgdGhlIGdpdmVuIHVubG9jayB0aW1lIGlzIGEgdGltZXN0YW1wIG9yIGJsb2NrIGhlaWdodC5cbiAgICogXG4gICAqIEBwYXJhbSB1bmxvY2tUaW1lIGlzIHRoZSB1bmxvY2sgdGltZSB0byBjaGVja1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSB1bmxvY2sgdGltZSBpcyBhIHRpbWVzdGFtcCwgZmFsc2UgaWYgYSBibG9jayBoZWlnaHRcbiAgICovXG4gIHN0YXRpYyBpc1RpbWVzdGFtcCh1bmxvY2tUaW1lOiBiaWdpbnQpIHtcbiAgICAgIFxuICAgIC8vIHRocmVzaG9sZCBmb3IgZGlzdGluZ3Vpc2hpbmcgYmV0d2VlbiB0aW1lc3RhbXAgYW5kIGJsb2NrIGhlaWdodFxuICAgIC8vIGN1cnJlbnQgYmxvY2sgaGVpZ2h0IGlzIGFyb3VuZCAzIG1pbGxpb24sIGN1cnJlbnQgdW5peCB0aW1lc3RhbXAgaXMgYXJvdW5kIDEuNyBiaWxsaW9uXG4gICAgY29uc3QgdGhyZXNob2xkID0gNTAwMDAwMDAwbjtcblxuICAgIHJldHVybiB1bmxvY2tUaW1lID49IHRocmVzaG9sZDtcbiAgfVxufVxuXG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxRQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxTQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxhQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxZQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyx3QkFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU0sa0JBQUEsR0FBQVAsc0JBQUEsQ0FBQUMsT0FBQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ2UsTUFBTU8sV0FBVyxDQUFDOztFQUUvQjtFQUNBLE9BQU9DLGVBQWUsR0FBRyxLQUFLO0VBQzlCLE9BQU9DLGtCQUFrQixHQUFHLEVBQUU7RUFDOUIsT0FBT0MsVUFBVSxH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