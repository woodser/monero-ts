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
    return "0.11.23";
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
      if (binMemInfoStr.charAt(0) !== '{') throw new _MoneroError.default(binMemInfoStr);

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
      heap.set(new Uint8Array(uint8arr.buffer, uint8arr.byteOffset, uint8arr.byteLength));

      // create object with binary memory address info
      let binMemInfo = { ptr: ptr, length: uint8arr.length };

      // convert binary to json str
      let ret_string;
      try {ret_string = _LibraryUtils.default.getWasmModule().binary_to_json(JSON.stringify(binMemInfo));} finally
      {_LibraryUtils.default.getWasmModule()._free(ptr);} // free binary on heap
      if (ret_string.charAt(0) !== '{') throw new _MoneroError.default(ret_string);

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
      heap.set(new Uint8Array(uint8arr.buffer, uint8arr.byteOffset, uint8arr.byteLength));

      // create object with binary memory address info
      let binMemInfo = { ptr: ptr, length: uint8arr.length };

      // convert binary to json str
      let json_str;
      try {json_str = _LibraryUtils.default.getWasmModule().binary_blocks_to_json(JSON.stringify(binMemInfo));} finally
      {_LibraryUtils.default.getWasmModule()._free(ptr);} // free memory
      if (json_str.charAt(0) !== '{') throw new _MoneroError.default(json_str);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfZGVjaW1hbCIsIl9HZW5VdGlscyIsIl9MaWJyYXJ5VXRpbHMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJNb25lcm9VdGlscyIsIlBST1hZX1RPX1dPUktFUiIsIk5VTV9NTkVNT05JQ19XT1JEUyIsIkFVX1BFUl9YTVIiLCJSSU5HX1NJWkUiLCJnZXRWZXJzaW9uIiwic2V0UHJveHlUb1dvcmtlciIsInByb3h5VG9Xb3JrZXIiLCJ2YWxpZGF0ZU1uZW1vbmljIiwibW5lbW9uaWMiLCJhc3NlcnQiLCJ3b3JkcyIsInNwbGl0IiwibGVuZ3RoIiwiTW9uZXJvRXJyb3IiLCJpc1ZhbGlkUHJpdmF0ZVZpZXdLZXkiLCJwcml2YXRlVmlld0tleSIsInZhbGlkYXRlUHJpdmF0ZVZpZXdLZXkiLCJlIiwiaXNWYWxpZFB1YmxpY1ZpZXdLZXkiLCJwdWJsaWNWaWV3S2V5IiwidmFsaWRhdGVQdWJsaWNWaWV3S2V5IiwiaXNWYWxpZFByaXZhdGVTcGVuZEtleSIsInByaXZhdGVTcGVuZEtleSIsInZhbGlkYXRlUHJpdmF0ZVNwZW5kS2V5IiwiaXNWYWxpZFB1YmxpY1NwZW5kS2V5IiwicHVibGljU3BlbmRLZXkiLCJ2YWxpZGF0ZVB1YmxpY1NwZW5kS2V5IiwiaXNIZXg2NCIsImdldEludGVncmF0ZWRBZGRyZXNzIiwibmV0d29ya1R5cGUiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIkxpYnJhcnlVdGlscyIsImludm9rZVdvcmtlciIsInVuZGVmaW5lZCIsIkFycmF5IiwiZnJvbSIsImFyZ3VtZW50cyIsIk1vbmVyb05ldHdvcmtUeXBlIiwidmFsaWRhdGUiLCJHZW5VdGlscyIsImlzQmFzZTU4IiwiZ2V0V2FzbU1vZHVsZSIsImxvYWRXYXNtTW9kdWxlIiwicXVldWVUYXNrIiwiaW50ZWdyYXRlZEFkZHJlc3NKc29uIiwiZ2V0X2ludGVncmF0ZWRfYWRkcmVzc191dGlsIiwiY2hhckF0IiwiSlNPTiIsInBhcnNlIiwiaXNWYWxpZEFkZHJlc3MiLCJhZGRyZXNzIiwidmFsaWRhdGVBZGRyZXNzIiwiZXJyIiwiZXJyTXNnIiwidmFsaWRhdGVfYWRkcmVzcyIsImlzVmFsaWRQYXltZW50SWQiLCJ2YWxpZGF0ZVBheW1lbnRJZCIsImVxdWFsIiwiZ2V0TGFzdFR4UHViS2V5IiwidHhFeHRyYSIsImxhc3RQdWJLZXlJZHgiLCJpIiwidGFnIiwiQnVmZmVyIiwiVWludDhBcnJheSIsInNsaWNlIiwidG9TdHJpbmciLCJwYXltZW50SWRzRXF1YWwiLCJwYXltZW50SWQxIiwicGF5bWVudElkMiIsIm1heExlbmd0aCIsIk1hdGgiLCJtYXgiLCJtZXJnZVR4IiwidHhzIiwidHgiLCJhVHgiLCJnZXRIYXNoIiwibWVyZ2UiLCJwdXNoIiwianNvblRvQmluYXJ5IiwianNvbiIsImJpbk1lbUluZm9TdHIiLCJtYWxsb2NfYmluYXJ5X2Zyb21fanNvbiIsInN0cmluZ2lmeSIsImJpbk1lbUluZm8iLCJwdHIiLCJwYXJzZUludCIsInZpZXciLCJIRUFQVTgiLCJCWVRFU19QRVJfRUxFTUVOVCIsIl9mcmVlIiwiYmluYXJ5VG9Kc29uIiwidWludDhhcnIiLCJfbWFsbG9jIiwiaGVhcCIsImJ1ZmZlciIsImJ5dGVPZmZzZXQiLCJzZXQiLCJieXRlTGVuZ3RoIiwicmV0X3N0cmluZyIsImJpbmFyeV90b19qc29uIiwiYmluYXJ5QmxvY2tzVG9Kc29uIiwianNvbl9zdHIiLCJiaW5hcnlfYmxvY2tzX3RvX2pzb24iLCJibG9ja3MiLCJtYXAiLCJibG9ja1N0ciIsInJlcGxhY2UiLCJ4bXJUb0F0b21pY1VuaXRzIiwiYW1vdW50WG1yIiwiQmlnSW50IiwiRGVjaW1hbCIsIm11bCIsInRvRGVjaW1hbFBsYWNlcyIsIlJPVU5EX0hBTEZfVVAiLCJ0b0ZpeGVkIiwiYXRvbWljVW5pdHNUb1htciIsImFtb3VudEF0b21pY1VuaXRzIiwiZGl2IiwidG9OdW1iZXIiLCJkaXZpZGUiLCJhdTEiLCJhdTIiLCJtdWx0aXBseSIsImEiLCJiIiwic3RyIiwiaXNIZXgiLCJpc1RpbWVzdGFtcCIsInVubG9ja1RpbWUiLCJ0aHJlc2hvbGQiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9VdGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBEZWNpbWFsIGZyb20gJ2RlY2ltYWwuanMnO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBDb25uZWN0aW9uVHlwZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL0Nvbm5lY3Rpb25UeXBlXCI7XG5cbi8qKlxuICogQ29sbGVjdGlvbiBvZiBNb25lcm8gdXRpbGl0aWVzLiBSdW5zIGluIGEgd29ya2VyIHRocmVhZCBieSBkZWZhdWx0LlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9VdGlscyB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBzdGF0aWMgUFJPWFlfVE9fV09SS0VSID0gZmFsc2U7XG4gIHN0YXRpYyBOVU1fTU5FTU9OSUNfV09SRFMgPSAyNTtcbiAgc3RhdGljIEFVX1BFUl9YTVIgPSAxMDAwMDAwMDAwMDAwbjtcbiAgc3RhdGljIFJJTkdfU0laRSA9IDE2O1xuXG4gIC8qKlxuICAgKiA8cD5HZXQgdGhlIHZlcnNpb24gb2YgdGhlIG1vbmVyby10cyBsaWJyYXJ5LjxwPlxuICAgKiBcbiAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgdmVyc2lvbiBvZiB0aGlzIG1vbmVyby10cyBsaWJyYXJ5XG4gICAqL1xuICBzdGF0aWMgZ2V0VmVyc2lvbigpIHtcbiAgICByZXR1cm4gXCIwLjExLjIzXCI7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFbmFibGUgb3IgZGlzYWJsZSBwcm94eWluZyB0aGVzZSB1dGlsaXRpZXMgdG8gYSB3b3JrZXIgdGhyZWFkLlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBwcm94eVRvV29ya2VyIC0gc3BlY2lmaWVzIGlmIHV0aWxpdGllcyBzaG91bGQgYmUgcHJveGllZCB0byBhIHdvcmtlclxuICAgKi9cbiAgc3RhdGljIHNldFByb3h5VG9Xb3JrZXIocHJveHlUb1dvcmtlcikge1xuICAgIE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUiA9IHByb3h5VG9Xb3JrZXIgfHwgZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIG1uZW1vbmljLCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKlxuICAgKiBUT0RPOiBpbXByb3ZlIHZhbGlkYXRpb24sIHVzZSBuZXR3b3JrIHR5cGVcbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtbmVtb25pYyAtIG1uZW1vbmljIHRvIHZhbGlkYXRlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVNbmVtb25pYyhtbmVtb25pYykge1xuICAgIGFzc2VydChtbmVtb25pYywgXCJNbmVtb25pYyBwaHJhc2UgaXMgbm90IGluaXRpYWxpemVkXCIpO1xuICAgIGxldCB3b3JkcyA9IG1uZW1vbmljLnNwbGl0KFwiIFwiKTtcbiAgICBpZiAod29yZHMubGVuZ3RoICE9PSBNb25lcm9VdGlscy5OVU1fTU5FTU9OSUNfV09SRFMpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1uZW1vbmljIHBocmFzZSBpcyBcIiArIHdvcmRzLmxlbmd0aCArIFwiIHdvcmRzIGJ1dCBtdXN0IGJlIFwiICsgTW9uZXJvVXRpbHMuTlVNX01ORU1PTklDX1dPUkRTKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiBhIHByaXZhdGUgdmlldyBrZXkgaXMgdmFsaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJpdmF0ZVZpZXdLZXkgaXMgdGhlIHByaXZhdGUgdmlldyBrZXkgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sPn0gdHJ1ZSBpZiB0aGUgcHJpdmF0ZSB2aWV3IGtleSBpcyB2YWxpZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaXNWYWxpZFByaXZhdGVWaWV3S2V5KHByaXZhdGVWaWV3S2V5KSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IE1vbmVyb1V0aWxzLnZhbGlkYXRlUHJpdmF0ZVZpZXdLZXkocHJpdmF0ZVZpZXdLZXkpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiBhIHB1YmxpYyB2aWV3IGtleSBpcyB2YWxpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdWJsaWNWaWV3S2V5IGlzIHRoZSBwdWJsaWMgdmlldyBrZXkgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sPn0gdHJ1ZSBpZiB0aGUgcHVibGljIHZpZXcga2V5IGlzIHZhbGlkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpc1ZhbGlkUHVibGljVmlld0tleShwdWJsaWNWaWV3S2V5KSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IE1vbmVyb1V0aWxzLnZhbGlkYXRlUHVibGljVmlld0tleShwdWJsaWNWaWV3S2V5KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgYSBwcml2YXRlIHNwZW5kIGtleSBpcyB2YWxpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcml2YXRlU3BlbmRLZXkgaXMgdGhlIHByaXZhdGUgc3BlbmQga2V5IHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbD59IHRydWUgaWYgdGhlIHByaXZhdGUgc3BlbmQga2V5IGlzIHZhbGlkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpc1ZhbGlkUHJpdmF0ZVNwZW5kS2V5KHByaXZhdGVTcGVuZEtleSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZVByaXZhdGVTcGVuZEtleShwcml2YXRlU3BlbmRLZXkpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiBhIHB1YmxpYyBzcGVuZCBrZXkgaXMgdmFsaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVibGljU3BlbmRLZXkgaXMgdGhlIHB1YmxpYyBzcGVuZCBrZXkgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sPn0gdHJ1ZSBpZiB0aGUgcHVibGljIHNwZW5kIGtleSBpcyB2YWxpZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaXNWYWxpZFB1YmxpY1NwZW5kS2V5KHB1YmxpY1NwZW5kS2V5KSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IE1vbmVyb1V0aWxzLnZhbGlkYXRlUHVibGljU3BlbmRLZXkocHVibGljU3BlbmRLZXkpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBwcml2YXRlIHZpZXcga2V5LCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJpdmF0ZVZpZXdLZXkgLSBwcml2YXRlIHZpZXcga2V5IHRvIHZhbGlkYXRlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVQcml2YXRlVmlld0tleShwcml2YXRlVmlld0tleSkge1xuICAgIGlmICghTW9uZXJvVXRpbHMuaXNIZXg2NChwcml2YXRlVmlld0tleSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcInByaXZhdGUgdmlldyBrZXkgZXhwZWN0ZWQgdG8gYmUgNjQgaGV4IGNoYXJhY3RlcnNcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gcHVibGljIHZpZXcga2V5LCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVibGljVmlld0tleSAtIHB1YmxpYyB2aWV3IGtleSB0byB2YWxpZGF0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlUHVibGljVmlld0tleShwdWJsaWNWaWV3S2V5KSB7XG4gICAgaWYgKCFNb25lcm9VdGlscy5pc0hleDY0KHB1YmxpY1ZpZXdLZXkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJwdWJsaWMgdmlldyBrZXkgZXhwZWN0ZWQgdG8gYmUgNjQgaGV4IGNoYXJhY3RlcnNcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gcHJpdmF0ZSBzcGVuZCBrZXksIHRocm93IGFuIGVycm9yIGlmIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcml2YXRlU3BlbmRLZXkgLSBwcml2YXRlIHNwZW5kIGtleSB0byB2YWxpZGF0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlUHJpdmF0ZVNwZW5kS2V5KHByaXZhdGVTcGVuZEtleSkge1xuICAgIGlmICghTW9uZXJvVXRpbHMuaXNIZXg2NChwcml2YXRlU3BlbmRLZXkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJwcml2YXRlIHNwZW5kIGtleSBleHBlY3RlZCB0byBiZSA2NCBoZXggY2hhcmFjdGVyc1wiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBwdWJsaWMgc3BlbmQga2V5LCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVibGljU3BlbmRLZXkgLSBwdWJsaWMgc3BlbmQga2V5IHRvIHZhbGlkYXRlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVQdWJsaWNTcGVuZEtleShwdWJsaWNTcGVuZEtleSkge1xuICAgIGlmICghTW9uZXJvVXRpbHMuaXNIZXg2NChwdWJsaWNTcGVuZEtleSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcInB1YmxpYyBzcGVuZCBrZXkgZXhwZWN0ZWQgdG8gYmUgNjQgaGV4IGNoYXJhY3RlcnNcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYW4gaW50ZWdyYXRlZCBhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9OZXR3b3JrVHlwZX0gbmV0d29ya1R5cGUgLSBuZXR3b3JrIHR5cGUgb2YgdGhlIGludGVncmF0ZWQgYWRkcmVzc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhbmRhcmRBZGRyZXNzIC0gYWRkcmVzcyB0byBkZXJpdmUgdGhlIGludGVncmF0ZWQgYWRkcmVzcyBmcm9tXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcGF5bWVudElkXSAtIG9wdGlvbmFsbHkgc3BlY2lmaWVzIHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3MncyBwYXltZW50IGlkIChkZWZhdWx0cyB0byByYW5kb20gcGF5bWVudCBpZClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz59IHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3NcbiAgICovXG4gIHN0YXRpYyBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhuZXR3b3JrVHlwZTogTW9uZXJvTmV0d29ya1R5cGUsIHN0YW5kYXJkQWRkcmVzczogc3RyaW5nLCBwYXltZW50SWQ/OiBzdHJpbmcpIHtcbiAgICBpZiAoTW9uZXJvVXRpbHMuUFJPWFlfVE9fV09SS0VSKSByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodW5kZWZpbmVkLCBcIm1vbmVyb1V0aWxzR2V0SW50ZWdyYXRlZEFkZHJlc3NcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIFxuICAgIC8vIHZhbGlkYXRlIGlucHV0c1xuICAgIE1vbmVyb05ldHdvcmtUeXBlLnZhbGlkYXRlKG5ldHdvcmtUeXBlKTtcbiAgICBhc3NlcnQodHlwZW9mIHN0YW5kYXJkQWRkcmVzcyA9PT0gXCJzdHJpbmdcIiwgXCJBZGRyZXNzIGlzIG5vdCBzdHJpbmdcIik7XG4gICAgYXNzZXJ0KHN0YW5kYXJkQWRkcmVzcy5sZW5ndGggPiAwLCBcIkFkZHJlc3MgaXMgZW1wdHlcIik7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzQmFzZTU4KHN0YW5kYXJkQWRkcmVzcyksIFwiQWRkcmVzcyBpcyBub3QgYmFzZSA1OFwiKTtcbiAgICBcbiAgICAvLyBsb2FkIGtleXMgbW9kdWxlIGJ5IGRlZmF1bHRcbiAgICBpZiAoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSA9PT0gdW5kZWZpbmVkKSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyBnZXQgaW50ZWdyYXRlZCBhZGRyZXNzIGluIHF1ZXVlXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIGxldCBpbnRlZ3JhdGVkQWRkcmVzc0pzb24gPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLmdldF9pbnRlZ3JhdGVkX2FkZHJlc3NfdXRpbChuZXR3b3JrVHlwZSwgc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQgPyBwYXltZW50SWQgOiBcIlwiKTtcbiAgICAgIGlmIChpbnRlZ3JhdGVkQWRkcmVzc0pzb24uY2hhckF0KDApICE9PSAneycpIHRocm93IG5ldyBNb25lcm9FcnJvcihpbnRlZ3JhdGVkQWRkcmVzc0pzb24pO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyhKU09OLnBhcnNlKGludGVncmF0ZWRBZGRyZXNzSnNvbikpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogRGV0ZXJtaW5lIGlmIHRoZSBnaXZlbiBhZGRyZXNzIGlzIHZhbGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBhZGRyZXNzXG4gICAqIEBwYXJhbSB7TW9uZXJvTmV0d29ya1R5cGV9IG5ldHdvcmtUeXBlIC0gbmV0d29yayB0eXBlIG9mIHRoZSBhZGRyZXNzIHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIGFkZHJlc3MgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlzVmFsaWRBZGRyZXNzKGFkZHJlc3MsIG5ldHdvcmtUeXBlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IE1vbmVyb1V0aWxzLnZhbGlkYXRlQWRkcmVzcyhhZGRyZXNzLCBuZXR3b3JrVHlwZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gYWRkcmVzcywgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBhZGRyZXNzIHRvIHZhbGlkYXRlXG4gICAqIEBwYXJhbSB7TW9uZXJvTmV0d29ya1R5cGV9IG5ldHdvcmtUeXBlIC0gbmV0d29yayB0eXBlIG9mIHRoZSBhZGRyZXNzIHRvIHZhbGlkYXRlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVBZGRyZXNzKGFkZHJlc3MsIG5ldHdvcmtUeXBlKSB7XG4gICAgaWYgKE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUikgcmV0dXJuIExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodW5kZWZpbmVkLCBcIm1vbmVyb1V0aWxzVmFsaWRhdGVBZGRyZXNzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgaW5wdXRzXG4gICAgYXNzZXJ0KHR5cGVvZiBhZGRyZXNzID09PSBcInN0cmluZ1wiLCBcIkFkZHJlc3MgaXMgbm90IHN0cmluZ1wiKTtcbiAgICBhc3NlcnQoYWRkcmVzcy5sZW5ndGggPiAwLCBcIkFkZHJlc3MgaXMgZW1wdHlcIik7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzQmFzZTU4KGFkZHJlc3MpLCBcIkFkZHJlc3MgaXMgbm90IGJhc2UgNThcIik7XG4gICAgbmV0d29ya1R5cGUgPSBNb25lcm9OZXR3b3JrVHlwZS5mcm9tKG5ldHdvcmtUeXBlKTtcbiAgICBcbiAgICAvLyBsb2FkIGtleXMgbW9kdWxlIGJ5IGRlZmF1bHRcbiAgICBpZiAoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSA9PT0gdW5kZWZpbmVkKSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhZGRyZXNzIGluIHF1ZXVlXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgbGV0IGVyck1zZyA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkudmFsaWRhdGVfYWRkcmVzcyhhZGRyZXNzLCBuZXR3b3JrVHlwZSk7XG4gICAgICBpZiAoZXJyTXNnKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyTXNnKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERldGVybWluZSBpZiB0aGUgZ2l2ZW4gcGF5bWVudCBpZCBpcyB2YWxpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXltZW50SWQgLSBwYXltZW50IGlkIHRvIGRldGVybWluZSBpZiB2YWxpZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2w+fSB0cnVlIGlmIHRoZSBwYXltZW50IGlkIGlzIHZhbGlkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpc1ZhbGlkUGF5bWVudElkKHBheW1lbnRJZCkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZVBheW1lbnRJZChwYXltZW50SWQpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBwYXltZW50IGlkLCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKiBcbiAgICogVE9ETzogaW1wcm92ZSB2YWxpZGF0aW9uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF5bWVudElkIC0gcGF5bWVudCBpZCB0byB2YWxpZGF0ZSBcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZVBheW1lbnRJZChwYXltZW50SWQpIHtcbiAgICBhc3NlcnQuZXF1YWwodHlwZW9mIHBheW1lbnRJZCwgXCJzdHJpbmdcIik7XG4gICAgYXNzZXJ0KHBheW1lbnRJZC5sZW5ndGggPT09IDE2IHx8IHBheW1lbnRJZC5sZW5ndGggPT09IDY0KTtcbiAgfVxuICAgIFxuICAvKipcbiAgICogRGVjb2RlIHR4IGV4dHJhIGFjY29yZGluZyB0byBodHRwczovL2NyeXB0b25vdGUub3JnL2Nucy9jbnMwMDUudHh0IGFuZFxuICAgKiByZXR1cm5zIHRoZSBsYXN0IHR4IHB1YiBrZXkuXG4gICAqIFxuICAgKiBUT0RPOiB1c2UgYysrIGJyaWRnZSBmb3IgdGhpc1xuICAgKiBcbiAgICogQHBhcmFtIFtieXRlW11dIHR4RXh0cmEgLSBhcnJheSBvZiB0eCBleHRyYSBieXRlc1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBsYXN0IHB1YiBrZXkgYXMgYSBoZXhpZGVjaW1hbCBzdHJpbmdcbiAgICovXG4gIHN0YXRpYyBhc3luYyBnZXRMYXN0VHhQdWJLZXkodHhFeHRyYSkge1xuICAgIGxldCBsYXN0UHViS2V5SWR4O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdHhFeHRyYS5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IHRhZyA9IHR4RXh0cmFbaV07XG4gICAgICBpZiAodGFnID09PSAwIHx8IHRhZyA9PT0gMikge1xuICAgICAgICBpICs9IDEgKyB0eEV4dHJhW2kgKyAxXTsgIC8vIGFkdmFuY2UgdG8gbmV4dCB0YWdcbiAgICAgIH0gZWxzZSBpZiAodGFnID09PSAxKSB7XG4gICAgICAgIGxhc3RQdWJLZXlJZHggPSBpICsgMTtcbiAgICAgICAgaSArPSAxICsgMzI7ICAgICAgICAgICAgICAvLyBhZHZhbmNlIHRvIG5leHQgdGFnXG4gICAgICB9IGVsc2UgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBzdWItZmllbGQgdGFnOiBcIiArIHRhZyk7XG4gICAgfVxuICAgIHJldHVybiBCdWZmZXIuZnJvbShuZXcgVWludDhBcnJheSh0eEV4dHJhLnNsaWNlKGxhc3RQdWJLZXlJZHgsIGxhc3RQdWJLZXlJZHggKyAzMikpKS50b1N0cmluZyhcImhleFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdHdvIHBheW1lbnQgaWRzIGFyZSBmdW5jdGlvbmFsbHkgZXF1YWwuXG4gICAqIFxuICAgKiBGb3IgZXhhbXBsZSwgMDMyODRlNDFjMzQyZjAzMiBhbmQgMDMyODRlNDFjMzQyZjAzMjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCBhcmUgY29uc2lkZXJlZCBlcXVhbC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXltZW50SWQxIGlzIGEgcGF5bWVudCBpZCB0byBjb21wYXJlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXltZW50SWQyIGlzIGEgcGF5bWVudCBpZCB0byBjb21wYXJlXG4gICAqIEByZXR1cm4ge2Jvb2x9IHRydWUgaWYgdGhlIHBheW1lbnQgaWRzIGFyZSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgcGF5bWVudElkc0VxdWFsKHBheW1lbnRJZDEsIHBheW1lbnRJZDIpIHtcbiAgICBsZXQgbWF4TGVuZ3RoID0gTWF0aC5tYXgocGF5bWVudElkMS5sZW5ndGgsIHBheW1lbnRJZDIubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1heExlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoaSA8IHBheW1lbnRJZDEubGVuZ3RoICYmIGkgPCBwYXltZW50SWQyLmxlbmd0aCAmJiBwYXltZW50SWQxW2ldICE9PSBwYXltZW50SWQyW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoaSA+PSBwYXltZW50SWQxLmxlbmd0aCAmJiBwYXltZW50SWQyW2ldICE9PSAnMCcpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmIChpID49IHBheW1lbnRJZDIubGVuZ3RoICYmIHBheW1lbnRJZDFbaV0gIT09ICcwJykgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1lcmdlcyBhIHRyYW5zYWN0aW9uIGludG8gYSBsaXN0IG9mIGV4aXN0aW5nIHRyYW5zYWN0aW9ucy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhbXX0gdHhzIC0gZXhpc3RpbmcgdHJhbnNhY3Rpb25zIHRvIG1lcmdlIGludG9cbiAgICogQHBhcmFtIHtNb25lcm9UeH0gdHggLSB0cmFuc2FjdGlvbiB0byBtZXJnZSBpbnRvIHRoZSBsaXN0XG4gICAqL1xuICBzdGF0aWMgbWVyZ2VUeCh0eHMsIHR4KSB7XG4gICAgZm9yIChsZXQgYVR4IG9mIHR4cykge1xuICAgICAgaWYgKGFUeC5nZXRIYXNoKCkgPT09IHR4LmdldEhhc2goKSkge1xuICAgICAgICBhVHgubWVyZ2UodHgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHR4cy5wdXNoKHR4KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnQgdGhlIGdpdmVuIEpTT04gdG8gYSBiaW5hcnkgVWludDhBcnJheSB1c2luZyBNb25lcm8ncyBwb3J0YWJsZSBzdG9yYWdlIGZvcm1hdC5cbiAgICogXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBqc29uIC0ganNvbiB0byBjb252ZXJ0IHRvIGJpbmFyeVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFVpbnQ4QXJyYXk+fSB0aGUganNvbiBjb252ZXJ0ZWQgdG8gcG9ydGFibGUgc3RvcmFnZSBiaW5hcnlcbiAgICovXG4gIHN0YXRpYyBhc3luYyBqc29uVG9CaW5hcnkoanNvbikge1xuICAgIGlmIChNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIpIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJtb25lcm9VdGlsc0pzb25Ub0JpbmFyeVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIFxuICAgIC8vIGxvYWQga2V5cyBtb2R1bGUgYnkgZGVmYXVsdFxuICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpID09PSB1bmRlZmluZWQpIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIHVzZSB3YXNtIGluIHF1ZXVlXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgXG4gICAgICAvLyBzZXJpYWxpemUganNvbiB0byBiaW5hcnkgd2hpY2ggaXMgc3RvcmVkIGluIGMrKyBoZWFwXG4gICAgICBsZXQgYmluTWVtSW5mb1N0ciA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkubWFsbG9jX2JpbmFyeV9mcm9tX2pzb24oSlNPTi5zdHJpbmdpZnkoanNvbikpO1xuICAgICAgaWYgKGJpbk1lbUluZm9TdHIuY2hhckF0KDApICE9PSAneycpIHRocm93IG5ldyBNb25lcm9FcnJvcihiaW5NZW1JbmZvU3RyKTtcbiAgICAgIFxuICAgICAgLy8gc2FuaXRpemUgYmluYXJ5IG1lbW9yeSBhZGRyZXNzIGluZm9cbiAgICAgIGxldCBiaW5NZW1JbmZvID0gSlNPTi5wYXJzZShiaW5NZW1JbmZvU3RyKTtcbiAgICAgIGJpbk1lbUluZm8ucHRyID0gcGFyc2VJbnQoYmluTWVtSW5mby5wdHIpO1xuICAgICAgYmluTWVtSW5mby5sZW5ndGggPSBwYXJzZUludChiaW5NZW1JbmZvLmxlbmd0aCk7XG4gICAgICBcbiAgICAgIC8vIHJlYWQgYmluYXJ5IGRhdGEgZnJvbSBoZWFwIHRvIFVpbnQ4QXJyYXlcbiAgICAgIGxldCB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYmluTWVtSW5mby5sZW5ndGgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5NZW1JbmZvLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZpZXdbaV0gPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLkhFQVBVOFtiaW5NZW1JbmZvLnB0ciAvIFVpbnQ4QXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKyBpXTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gZnJlZSBiaW5hcnkgb24gaGVhcFxuICAgICAgTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fZnJlZShiaW5NZW1JbmZvLnB0cik7XG4gICAgICBcbiAgICAgIC8vIHJldHVybiBqc29uIGZyb20gYmluYXJ5IGRhdGFcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydCB0aGUgZ2l2ZW4gcG9ydGFibGUgc3RvcmFnZSBiaW5hcnkgdG8gSlNPTi5cbiAgICogXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhhcnIgLSBiaW5hcnkgZGF0YSBpbiBNb25lcm8ncyBwb3J0YWJsZSBzdG9yYWdlIGZvcm1hdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG9iamVjdD59IEpTT04gb2JqZWN0IGNvbnZlcnRlZCBmcm9tIHRoZSBiaW5hcnkgZGF0YVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGJpbmFyeVRvSnNvbih1aW50OGFycikge1xuICAgIGlmIChNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIpIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJtb25lcm9VdGlsc0JpbmFyeVRvSnNvblwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIFxuICAgIC8vIGxvYWQga2V5cyBtb2R1bGUgYnkgZGVmYXVsdFxuICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpID09PSB1bmRlZmluZWQpIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIHVzZSB3YXNtIGluIHF1ZXVlXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgXG4gICAgICAvLyBhbGxvY2F0ZSBzcGFjZSBpbiBjKysgaGVhcCBmb3IgYmluYXJ5XG4gICAgICBsZXQgcHRyID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fbWFsbG9jKHVpbnQ4YXJyLmxlbmd0aCAqIHVpbnQ4YXJyLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIGxldCBoZWFwID0gbmV3IFVpbnQ4QXJyYXkoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQVTguYnVmZmVyLCBwdHIsIHVpbnQ4YXJyLmxlbmd0aCAqIHVpbnQ4YXJyLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIGlmIChwdHIgIT09IGhlYXAuYnl0ZU9mZnNldCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTWVtb3J5IHB0ciAhPT0gaGVhcC5ieXRlT2Zmc2V0XCIpOyAvLyBzaG91bGQgYmUgZXF1YWxcbiAgICAgIFxuICAgICAgLy8gd3JpdGUgYmluYXJ5IHRvIGhlYXBcbiAgICAgIGhlYXAuc2V0KG5ldyBVaW50OEFycmF5KHVpbnQ4YXJyLmJ1ZmZlciwgdWludDhhcnIuYnl0ZU9mZnNldCwgdWludDhhcnIuYnl0ZUxlbmd0aCkpO1xuICAgICAgXG4gICAgICAvLyBjcmVhdGUgb2JqZWN0IHdpdGggYmluYXJ5IG1lbW9yeSBhZGRyZXNzIGluZm9cbiAgICAgIGxldCBiaW5NZW1JbmZvID0geyBwdHI6IHB0ciwgbGVuZ3RoOiB1aW50OGFyci5sZW5ndGggfTtcbiAgICAgIFxuICAgICAgLy8gY29udmVydCBiaW5hcnkgdG8ganNvbiBzdHJcbiAgICAgIGxldCByZXRfc3RyaW5nO1xuICAgICAgdHJ5IHsgcmV0X3N0cmluZyA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuYmluYXJ5X3RvX2pzb24oSlNPTi5zdHJpbmdpZnkoYmluTWVtSW5mbykpOyB9XG4gICAgICBmaW5hbGx5IHsgTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fZnJlZShwdHIpOyB9IC8vIGZyZWUgYmluYXJ5IG9uIGhlYXBcbiAgICAgIGlmIChyZXRfc3RyaW5nLmNoYXJBdCgwKSAhPT0gJ3snKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmV0X3N0cmluZyk7XG4gICAgICBcbiAgICAgIC8vIHBhcnNlIGFuZCByZXR1cm4ganNvblxuICAgICAgcmV0dXJuIEpTT04ucGFyc2UocmV0X3N0cmluZyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0IHRoZSBiaW5hcnkgcmVzcG9uc2UgZnJvbSBkYWVtb24gUlBDIGJsb2NrIHJldHJpZXZhbCB0byBKU09OLlxuICAgKiBcbiAgICogQHBhcmFtIHtVaW50OEFycmF5fSB1aW50OGFyciAtIGJpbmFyeSByZXNwb25zZSBmcm9tIGRhZW1vbiBSUEMgd2hlbiBnZXR0aW5nIGJsb2Nrc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPG9iamVjdD59IEpTT04gb2JqZWN0IHdpdGggdGhlIGJsb2NrcyBkYXRhXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgYmluYXJ5QmxvY2tzVG9Kc29uKHVpbnQ4YXJyKSB7XG4gICAgaWYgKE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUikgcmV0dXJuIExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodW5kZWZpbmVkLCBcIm1vbmVyb1V0aWxzQmluYXJ5QmxvY2tzVG9Kc29uXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgXG4gICAgLy8gbG9hZCBrZXlzIG1vZHVsZSBieSBkZWZhdWx0XG4gICAgaWYgKExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkgPT09IHVuZGVmaW5lZCkgYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gdXNlIHdhc20gaW4gcXVldWVcbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5xdWV1ZVRhc2soYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICBcbiAgICAgIC8vIGFsbG9jYXRlIHNwYWNlIGluIGMrKyBoZWFwIGZvciBiaW5hcnlcbiAgICAgIGxldCBwdHIgPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLl9tYWxsb2ModWludDhhcnIubGVuZ3RoICogdWludDhhcnIuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgbGV0IGhlYXAgPSBuZXcgVWludDhBcnJheShMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLkhFQVBVOC5idWZmZXIsIHB0ciwgdWludDhhcnIubGVuZ3RoICogdWludDhhcnIuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgaWYgKHB0ciAhPT0gaGVhcC5ieXRlT2Zmc2V0KSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNZW1vcnkgcHRyICE9PSBoZWFwLmJ5dGVPZmZzZXRcIik7IC8vIHNob3VsZCBiZSBlcXVhbFxuICAgICAgXG4gICAgICAvLyB3cml0ZSBiaW5hcnkgdG8gaGVhcFxuICAgICAgaGVhcC5zZXQobmV3IFVpbnQ4QXJyYXkodWludDhhcnIuYnVmZmVyLCB1aW50OGFyci5ieXRlT2Zmc2V0LCB1aW50OGFyci5ieXRlTGVuZ3RoKSk7XG4gICAgICBcbiAgICAgIC8vIGNyZWF0ZSBvYmplY3Qgd2l0aCBiaW5hcnkgbWVtb3J5IGFkZHJlc3MgaW5mb1xuICAgICAgbGV0IGJpbk1lbUluZm8gPSB7IHB0cjogcHRyLCBsZW5ndGg6IHVpbnQ4YXJyLmxlbmd0aCAgfVxuXG4gICAgICAvLyBjb252ZXJ0IGJpbmFyeSB0byBqc29uIHN0clxuICAgICAgbGV0IGpzb25fc3RyO1xuICAgICAgdHJ5IHsganNvbl9zdHIgPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLmJpbmFyeV9ibG9ja3NfdG9fanNvbihKU09OLnN0cmluZ2lmeShiaW5NZW1JbmZvKSk7IH1cbiAgICAgIGZpbmFsbHkgeyBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLl9mcmVlKHB0cik7IH0gLy8gZnJlZSBtZW1vcnlcbiAgICAgIGlmIChqc29uX3N0ci5jaGFyQXQoMCkgIT09ICd7JykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGpzb25fc3RyKTtcbiAgICAgIFxuICAgICAgLy8gcGFyc2UgcmVzdWx0IHRvIGpzb25cbiAgICAgIGxldCBqc29uID0gSlNPTi5wYXJzZShqc29uX3N0cik7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyc2luZyBqc29uIGdpdmVzIGFycmF5cyBvZiBibG9jayBhbmQgdHggc3RyaW5nc1xuICAgICAganNvbi5ibG9ja3MgPSBqc29uLmJsb2Nrcy5tYXAoYmxvY2tTdHIgPT4gSlNPTi5wYXJzZShibG9ja1N0cikpOyAgICAgICAgICAvLyByZXBsYWNlIGJsb2NrIHN0cmluZ3Mgd2l0aCBwYXJzZWQgYmxvY2tzXG4gICAgICBqc29uLnR4cyA9IGpzb24udHhzLm1hcCh0eHMgPT4gdHhzID8gdHhzLm1hcCh0eCA9PiBKU09OLnBhcnNlKHR4LnJlcGxhY2UoXCIsXCIsIFwie1wiKSArIFwifVwiKSkgOiBbXSk7IC8vIG1vZGlmeSB0eCBzdHJpbmcgdG8gcHJvcGVyIGpzb24gYW5kIHBhcnNlIC8vIFRPRE86IG1vcmUgZWZmaWNpZW50IHdheSB0aGFuIHRoaXMganNvbiBtYW5pcHVsYXRpb24/XG4gICAgICByZXR1cm4ganNvbjtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnQgWE1SIHRvIGF0b21pYyB1bml0cy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyIHwgc3RyaW5nfSBhbW91bnRYbXIgLSBhbW91bnQgaW4gWE1SIHRvIGNvbnZlcnQgdG8gYXRvbWljIHVuaXRzXG4gICAqIEByZXR1cm4ge2JpZ2ludH0gYW1vdW50IGluIGF0b21pYyB1bml0c1xuICAgKi9cbiAgc3RhdGljIHhtclRvQXRvbWljVW5pdHMoYW1vdW50WG1yOiBudW1iZXIgfCBzdHJpbmcpOiBiaWdpbnQge1xuICAgIHJldHVybiBCaWdJbnQobmV3IERlY2ltYWwoYW1vdW50WG1yKS5tdWwoTW9uZXJvVXRpbHMuQVVfUEVSX1hNUi50b1N0cmluZygpKS50b0RlY2ltYWxQbGFjZXMoMCwgRGVjaW1hbC5ST1VORF9IQUxGX1VQKS50b0ZpeGVkKDApKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnQgYXRvbWljIHVuaXRzIHRvIFhNUi5cbiAgICogXG4gICAqIEBwYXJhbSB7YmlnaW50IHwgc3RyaW5nfSBhbW91bnRBdG9taWNVbml0cyAtIGFtb3VudCBpbiBhdG9taWMgdW5pdHMgdG8gY29udmVydCB0byBYTVJcbiAgICogQHJldHVybiB7bnVtYmVyfSBhbW91bnQgaW4gWE1SIFxuICAgKi9cbiAgc3RhdGljIGF0b21pY1VuaXRzVG9YbXIoYW1vdW50QXRvbWljVW5pdHM6IGJpZ2ludCB8IHN0cmluZyk6IG51bWJlciB7XG4gICAgcmV0dXJuIG5ldyBEZWNpbWFsKGFtb3VudEF0b21pY1VuaXRzLnRvU3RyaW5nKCkpLmRpdihNb25lcm9VdGlscy5BVV9QRVJfWE1SLnRvU3RyaW5nKCkpLnRvRGVjaW1hbFBsYWNlcygxMiwgRGVjaW1hbC5ST1VORF9IQUxGX1VQKS50b051bWJlcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZSBvbmUgYXRvbWljIHVuaXRzIGJ5IGFub3RoZXIuXG4gICAqIFxuICAgKiBAcGFyYW0ge2JpZ2ludH0gYXUxIGRpdmlkZW5kXG4gICAqIEBwYXJhbSB7YmlnaW50fSBhdTIgZGl2aXNvclxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSB0aGUgcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgZGl2aWRlKGF1MTogYmlnaW50LCBhdTI6IGJpZ2ludCk6IG51bWJlciB7XG4gICAgcmV0dXJuIG5ldyBEZWNpbWFsKGF1MS50b1N0cmluZygpKS5kaXYobmV3IERlY2ltYWwoYXUyLnRvU3RyaW5nKCkpKS50b0RlY2ltYWxQbGFjZXMoMTIsIERlY2ltYWwuUk9VTkRfSEFMRl9VUCkudG9OdW1iZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBseSBhIGJpZ2ludCBieSBhIG51bWJlciBvciBiaWdpbnQuXG4gICAqIFxuICAgKiBAcGFyYW0gYSBiaWdpbnQgdG8gbXVsdGlwbHlcbiAgICogQHBhcmFtIGIgYmlnaW50IG9yIG51bWJlciB0byBtdWx0aXBseSBieVxuICAgKiBAcmV0dXJucyB0aGUgcHJvZHVjdCBhcyBhIGJpZ2ludFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5KGE6IGJpZ2ludCwgYjogbnVtYmVyIHwgYmlnaW50KTogYmlnaW50IHtcbiAgICByZXR1cm4gQmlnSW50KG5ldyBEZWNpbWFsKGEudG9TdHJpbmcoKSkubXVsKG5ldyBEZWNpbWFsKGIudG9TdHJpbmcoKSkpLnRvRGVjaW1hbFBsYWNlcygwLCBEZWNpbWFsLlJPVU5EX0hBTEZfVVApLnRvU3RyaW5nKCkpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGlzSGV4NjQoc3RyKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzdHIgPT09IFwic3RyaW5nXCIgJiYgc3RyLmxlbmd0aCA9PT0gNjQgJiYgR2VuVXRpbHMuaXNIZXgoc3RyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgaWYgdGhlIGdpdmVuIHVubG9jayB0aW1lIGlzIGEgdGltZXN0YW1wIG9yIGJsb2NrIGhlaWdodC5cbiAgICogXG4gICAqIEBwYXJhbSB1bmxvY2tUaW1lIGlzIHRoZSB1bmxvY2sgdGltZSB0byBjaGVja1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSB1bmxvY2sgdGltZSBpcyBhIHRpbWVzdGFtcCwgZmFsc2UgaWYgYSBibG9jayBoZWlnaHRcbiAgICovXG4gIHN0YXRpYyBpc1RpbWVzdGFtcCh1bmxvY2tUaW1lOiBiaWdpbnQpIHtcbiAgICAgIFxuICAgIC8vIHRocmVzaG9sZCBmb3IgZGlzdGluZ3Vpc2hpbmcgYmV0d2VlbiB0aW1lc3RhbXAgYW5kIGJsb2NrIGhlaWdodFxuICAgIC8vIGN1cnJlbnQgYmxvY2sgaGVpZ2h0IGlzIGFyb3VuZCAzIG1pbGxpb24sIGN1cnJlbnQgdW5peCB0aW1lc3RhbXAgaXMgYXJvdW5kIDEuNyBiaWxsaW9uXG4gICAgY29uc3QgdGhyZXNob2xkID0gNTAwMDAwMDAwbjtcblxuICAgIHJldHVybiB1bmxvY2tUaW1lID49IHRocmVzaG9sZDtcbiAgfVxufVxuXG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNC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