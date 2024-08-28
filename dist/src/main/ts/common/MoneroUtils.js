"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _assert = _interopRequireDefault(require("assert"));
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
    return "0.10.2";
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
    if (_LibraryUtils.default.getWasmModule() === undefined) await _LibraryUtils.default.loadKeysModule();

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
    if (_LibraryUtils.default.getWasmModule() === undefined) await _LibraryUtils.default.loadKeysModule();

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
    if (_LibraryUtils.default.getWasmModule() === undefined) await _LibraryUtils.default.loadKeysModule();

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
    if (_LibraryUtils.default.getWasmModule() === undefined) await _LibraryUtils.default.loadKeysModule();

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
    if (_LibraryUtils.default.getWasmModule() === undefined) await _LibraryUtils.default.loadKeysModule();

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
    if (typeof amountXmr === "number") amountXmr = "" + amountXmr;
    let decimalDivisor = 1;
    let decimalIdx = amountXmr.indexOf('.');
    if (decimalIdx > -1) {
      decimalDivisor = Math.pow(10, amountXmr.length - decimalIdx - 1);
      amountXmr = amountXmr.slice(0, decimalIdx) + amountXmr.slice(decimalIdx + 1);
    }
    return BigInt(amountXmr) * BigInt(MoneroUtils.AU_PER_XMR) / BigInt(decimalDivisor);
  }

  /**
   * Convert atomic units to XMR.
   * 
   * @param {bigint | string} amountAtomicUnits - amount in atomic units to convert to XMR
   * @return {number} amount in XMR 
   */
  static atomicUnitsToXmr(amountAtomicUnits) {
    if (typeof amountAtomicUnits === "string") amountAtomicUnits = BigInt(amountAtomicUnits);else
    if (typeof amountAtomicUnits !== "bigint") throw new Error("Must provide atomic units as bigint or string to convert to XMR");
    const quotient = amountAtomicUnits / MoneroUtils.AU_PER_XMR;
    const remainder = amountAtomicUnits % MoneroUtils.AU_PER_XMR;
    return Number(quotient) + Number(remainder) / Number(MoneroUtils.AU_PER_XMR);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwiX01vbmVyb05ldHdvcmtUeXBlIiwiTW9uZXJvVXRpbHMiLCJQUk9YWV9UT19XT1JLRVIiLCJOVU1fTU5FTU9OSUNfV09SRFMiLCJBVV9QRVJfWE1SIiwiUklOR19TSVpFIiwiZ2V0VmVyc2lvbiIsInNldFByb3h5VG9Xb3JrZXIiLCJwcm94eVRvV29ya2VyIiwidmFsaWRhdGVNbmVtb25pYyIsIm1uZW1vbmljIiwiYXNzZXJ0Iiwid29yZHMiLCJzcGxpdCIsImxlbmd0aCIsIk1vbmVyb0Vycm9yIiwiaXNWYWxpZFByaXZhdGVWaWV3S2V5IiwicHJpdmF0ZVZpZXdLZXkiLCJ2YWxpZGF0ZVByaXZhdGVWaWV3S2V5IiwiZSIsImlzVmFsaWRQdWJsaWNWaWV3S2V5IiwicHVibGljVmlld0tleSIsInZhbGlkYXRlUHVibGljVmlld0tleSIsImlzVmFsaWRQcml2YXRlU3BlbmRLZXkiLCJwcml2YXRlU3BlbmRLZXkiLCJ2YWxpZGF0ZVByaXZhdGVTcGVuZEtleSIsImlzVmFsaWRQdWJsaWNTcGVuZEtleSIsInB1YmxpY1NwZW5kS2V5IiwidmFsaWRhdGVQdWJsaWNTcGVuZEtleSIsImlzSGV4NjQiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsIm5ldHdvcmtUeXBlIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJMaWJyYXJ5VXRpbHMiLCJpbnZva2VXb3JrZXIiLCJ1bmRlZmluZWQiLCJBcnJheSIsImZyb20iLCJhcmd1bWVudHMiLCJNb25lcm9OZXR3b3JrVHlwZSIsInZhbGlkYXRlIiwiR2VuVXRpbHMiLCJpc0Jhc2U1OCIsImdldFdhc21Nb2R1bGUiLCJsb2FkS2V5c01vZHVsZSIsInF1ZXVlVGFzayIsImludGVncmF0ZWRBZGRyZXNzSnNvbiIsImdldF9pbnRlZ3JhdGVkX2FkZHJlc3NfdXRpbCIsImNoYXJBdCIsIkpTT04iLCJwYXJzZSIsImlzVmFsaWRBZGRyZXNzIiwiYWRkcmVzcyIsInZhbGlkYXRlQWRkcmVzcyIsImVyciIsImVyck1zZyIsInZhbGlkYXRlX2FkZHJlc3MiLCJpc1ZhbGlkUGF5bWVudElkIiwidmFsaWRhdGVQYXltZW50SWQiLCJlcXVhbCIsImdldExhc3RUeFB1YktleSIsInR4RXh0cmEiLCJsYXN0UHViS2V5SWR4IiwiaSIsInRhZyIsIkJ1ZmZlciIsIlVpbnQ4QXJyYXkiLCJzbGljZSIsInRvU3RyaW5nIiwicGF5bWVudElkc0VxdWFsIiwicGF5bWVudElkMSIsInBheW1lbnRJZDIiLCJtYXhMZW5ndGgiLCJNYXRoIiwibWF4IiwibWVyZ2VUeCIsInR4cyIsInR4IiwiYVR4IiwiZ2V0SGFzaCIsIm1lcmdlIiwicHVzaCIsImpzb25Ub0JpbmFyeSIsImpzb24iLCJiaW5NZW1JbmZvU3RyIiwibWFsbG9jX2JpbmFyeV9mcm9tX2pzb24iLCJzdHJpbmdpZnkiLCJiaW5NZW1JbmZvIiwicHRyIiwicGFyc2VJbnQiLCJ2aWV3IiwiSEVBUFU4IiwiQllURVNfUEVSX0VMRU1FTlQiLCJfZnJlZSIsImJpbmFyeVRvSnNvbiIsInVpbnQ4YXJyIiwiX21hbGxvYyIsImhlYXAiLCJidWZmZXIiLCJieXRlT2Zmc2V0Iiwic2V0IiwicmV0X3N0cmluZyIsImJpbmFyeV90b19qc29uIiwiYmluYXJ5QmxvY2tzVG9Kc29uIiwianNvbl9zdHIiLCJiaW5hcnlfYmxvY2tzX3RvX2pzb24iLCJibG9ja3MiLCJtYXAiLCJibG9ja1N0ciIsInJlcGxhY2UiLCJ4bXJUb0F0b21pY1VuaXRzIiwiYW1vdW50WG1yIiwiZGVjaW1hbERpdmlzb3IiLCJkZWNpbWFsSWR4IiwiaW5kZXhPZiIsInBvdyIsIkJpZ0ludCIsImF0b21pY1VuaXRzVG9YbXIiLCJhbW91bnRBdG9taWNVbml0cyIsIkVycm9yIiwicXVvdGllbnQiLCJyZW1haW5kZXIiLCJOdW1iZXIiLCJzdHIiLCJpc0hleCIsImlzVGltZXN0YW1wIiwidW5sb2NrVGltZSIsInRocmVzaG9sZCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb1V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBDb25uZWN0aW9uVHlwZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL0Nvbm5lY3Rpb25UeXBlXCI7XG5cbi8qKlxuICogQ29sbGVjdGlvbiBvZiBNb25lcm8gdXRpbGl0aWVzLiBSdW5zIGluIGEgd29ya2VyIHRocmVhZCBieSBkZWZhdWx0LlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9VdGlscyB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBzdGF0aWMgUFJPWFlfVE9fV09SS0VSID0gZmFsc2U7XG4gIHN0YXRpYyBOVU1fTU5FTU9OSUNfV09SRFMgPSAyNTtcbiAgc3RhdGljIEFVX1BFUl9YTVIgPSAxMDAwMDAwMDAwMDAwbjtcbiAgc3RhdGljIFJJTkdfU0laRSA9IDEyO1xuXG4gIC8qKlxuICAgKiA8cD5HZXQgdGhlIHZlcnNpb24gb2YgdGhlIG1vbmVyby10cyBsaWJyYXJ5LjxwPlxuICAgKiBcbiAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgdmVyc2lvbiBvZiB0aGlzIG1vbmVyby10cyBsaWJyYXJ5XG4gICAqL1xuICBzdGF0aWMgZ2V0VmVyc2lvbigpIHtcbiAgICByZXR1cm4gXCIwLjEwLjJcIjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEVuYWJsZSBvciBkaXNhYmxlIHByb3h5aW5nIHRoZXNlIHV0aWxpdGllcyB0byBhIHdvcmtlciB0aHJlYWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHByb3h5VG9Xb3JrZXIgLSBzcGVjaWZpZXMgaWYgdXRpbGl0aWVzIHNob3VsZCBiZSBwcm94aWVkIHRvIGEgd29ya2VyXG4gICAqL1xuICBzdGF0aWMgc2V0UHJveHlUb1dvcmtlcihwcm94eVRvV29ya2VyKSB7XG4gICAgTW9uZXJvVXRpbHMuUFJPWFlfVE9fV09SS0VSID0gcHJveHlUb1dvcmtlciB8fCBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gbW5lbW9uaWMsIHRocm93IGFuIGVycm9yIGlmIGludmFsaWQuXG4gICAqXG4gICAqIFRPRE86IGltcHJvdmUgdmFsaWRhdGlvbiwgdXNlIG5ldHdvcmsgdHlwZVxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1uZW1vbmljIC0gbW5lbW9uaWMgdG8gdmFsaWRhdGVcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZU1uZW1vbmljKG1uZW1vbmljKSB7XG4gICAgYXNzZXJ0KG1uZW1vbmljLCBcIk1uZW1vbmljIHBocmFzZSBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgbGV0IHdvcmRzID0gbW5lbW9uaWMuc3BsaXQoXCIgXCIpO1xuICAgIGlmICh3b3Jkcy5sZW5ndGggIT09IE1vbmVyb1V0aWxzLk5VTV9NTkVNT05JQ19XT1JEUykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW5lbW9uaWMgcGhyYXNlIGlzIFwiICsgd29yZHMubGVuZ3RoICsgXCIgd29yZHMgYnV0IG11c3QgYmUgXCIgKyBNb25lcm9VdGlscy5OVU1fTU5FTU9OSUNfV09SRFMpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIGEgcHJpdmF0ZSB2aWV3IGtleSBpcyB2YWxpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcml2YXRlVmlld0tleSBpcyB0aGUgcHJpdmF0ZSB2aWV3IGtleSB0byB2YWxpZGF0ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2w+fSB0cnVlIGlmIHRoZSBwcml2YXRlIHZpZXcga2V5IGlzIHZhbGlkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpc1ZhbGlkUHJpdmF0ZVZpZXdLZXkocHJpdmF0ZVZpZXdLZXkpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgTW9uZXJvVXRpbHMudmFsaWRhdGVQcml2YXRlVmlld0tleShwcml2YXRlVmlld0tleSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIGEgcHVibGljIHZpZXcga2V5IGlzIHZhbGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1YmxpY1ZpZXdLZXkgaXMgdGhlIHB1YmxpYyB2aWV3IGtleSB0byB2YWxpZGF0ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2w+fSB0cnVlIGlmIHRoZSBwdWJsaWMgdmlldyBrZXkgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlzVmFsaWRQdWJsaWNWaWV3S2V5KHB1YmxpY1ZpZXdLZXkpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgTW9uZXJvVXRpbHMudmFsaWRhdGVQdWJsaWNWaWV3S2V5KHB1YmxpY1ZpZXdLZXkpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiBhIHByaXZhdGUgc3BlbmQga2V5IGlzIHZhbGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByaXZhdGVTcGVuZEtleSBpcyB0aGUgcHJpdmF0ZSBzcGVuZCBrZXkgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sPn0gdHJ1ZSBpZiB0aGUgcHJpdmF0ZSBzcGVuZCBrZXkgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlzVmFsaWRQcml2YXRlU3BlbmRLZXkocHJpdmF0ZVNwZW5kS2V5KSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IE1vbmVyb1V0aWxzLnZhbGlkYXRlUHJpdmF0ZVNwZW5kS2V5KHByaXZhdGVTcGVuZEtleSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIGEgcHVibGljIHNwZW5kIGtleSBpcyB2YWxpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdWJsaWNTcGVuZEtleSBpcyB0aGUgcHVibGljIHNwZW5kIGtleSB0byB2YWxpZGF0ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2w+fSB0cnVlIGlmIHRoZSBwdWJsaWMgc3BlbmQga2V5IGlzIHZhbGlkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpc1ZhbGlkUHVibGljU3BlbmRLZXkocHVibGljU3BlbmRLZXkpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgTW9uZXJvVXRpbHMudmFsaWRhdGVQdWJsaWNTcGVuZEtleShwdWJsaWNTcGVuZEtleSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIHByaXZhdGUgdmlldyBrZXksIHRocm93IGFuIGVycm9yIGlmIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcml2YXRlVmlld0tleSAtIHByaXZhdGUgdmlldyBrZXkgdG8gdmFsaWRhdGVcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZVByaXZhdGVWaWV3S2V5KHByaXZhdGVWaWV3S2V5KSB7XG4gICAgaWYgKCFNb25lcm9VdGlscy5pc0hleDY0KHByaXZhdGVWaWV3S2V5KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicHJpdmF0ZSB2aWV3IGtleSBleHBlY3RlZCB0byBiZSA2NCBoZXggY2hhcmFjdGVyc1wiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBwdWJsaWMgdmlldyBrZXksIHRocm93IGFuIGVycm9yIGlmIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdWJsaWNWaWV3S2V5IC0gcHVibGljIHZpZXcga2V5IHRvIHZhbGlkYXRlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVQdWJsaWNWaWV3S2V5KHB1YmxpY1ZpZXdLZXkpIHtcbiAgICBpZiAoIU1vbmVyb1V0aWxzLmlzSGV4NjQocHVibGljVmlld0tleSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcInB1YmxpYyB2aWV3IGtleSBleHBlY3RlZCB0byBiZSA2NCBoZXggY2hhcmFjdGVyc1wiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBwcml2YXRlIHNwZW5kIGtleSwgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByaXZhdGVTcGVuZEtleSAtIHByaXZhdGUgc3BlbmQga2V5IHRvIHZhbGlkYXRlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVQcml2YXRlU3BlbmRLZXkocHJpdmF0ZVNwZW5kS2V5KSB7XG4gICAgaWYgKCFNb25lcm9VdGlscy5pc0hleDY0KHByaXZhdGVTcGVuZEtleSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcInByaXZhdGUgc3BlbmQga2V5IGV4cGVjdGVkIHRvIGJlIDY0IGhleCBjaGFyYWN0ZXJzXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIHB1YmxpYyBzcGVuZCBrZXksIHRocm93IGFuIGVycm9yIGlmIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdWJsaWNTcGVuZEtleSAtIHB1YmxpYyBzcGVuZCBrZXkgdG8gdmFsaWRhdGVcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZVB1YmxpY1NwZW5kS2V5KHB1YmxpY1NwZW5kS2V5KSB7XG4gICAgaWYgKCFNb25lcm9VdGlscy5pc0hleDY0KHB1YmxpY1NwZW5kS2V5KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicHVibGljIHNwZW5kIGtleSBleHBlY3RlZCB0byBiZSA2NCBoZXggY2hhcmFjdGVyc1wiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhbiBpbnRlZ3JhdGVkIGFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb05ldHdvcmtUeXBlfSBuZXR3b3JrVHlwZSAtIG5ldHdvcmsgdHlwZSBvZiB0aGUgaW50ZWdyYXRlZCBhZGRyZXNzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdGFuZGFyZEFkZHJlc3MgLSBhZGRyZXNzIHRvIGRlcml2ZSB0aGUgaW50ZWdyYXRlZCBhZGRyZXNzIGZyb21cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtwYXltZW50SWRdIC0gb3B0aW9uYWxseSBzcGVjaWZpZXMgdGhlIGludGVncmF0ZWQgYWRkcmVzcydzIHBheW1lbnQgaWQgKGRlZmF1bHRzIHRvIHJhbmRvbSBwYXltZW50IGlkKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPn0gdGhlIGludGVncmF0ZWQgYWRkcmVzc1xuICAgKi9cbiAgc3RhdGljIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKG5ldHdvcmtUeXBlOiBNb25lcm9OZXR3b3JrVHlwZSwgc3RhbmRhcmRBZGRyZXNzOiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZykge1xuICAgIGlmIChNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIpIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoYXdhaXQgTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih1bmRlZmluZWQsIFwibW9uZXJvVXRpbHNHZXRJbnRlZ3JhdGVkQWRkcmVzc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgXG4gICAgLy8gdmFsaWRhdGUgaW5wdXRzXG4gICAgTW9uZXJvTmV0d29ya1R5cGUudmFsaWRhdGUobmV0d29ya1R5cGUpO1xuICAgIGFzc2VydCh0eXBlb2Ygc3RhbmRhcmRBZGRyZXNzID09PSBcInN0cmluZ1wiLCBcIkFkZHJlc3MgaXMgbm90IHN0cmluZ1wiKTtcbiAgICBhc3NlcnQoc3RhbmRhcmRBZGRyZXNzLmxlbmd0aCA+IDAsIFwiQWRkcmVzcyBpcyBlbXB0eVwiKTtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNCYXNlNTgoc3RhbmRhcmRBZGRyZXNzKSwgXCJBZGRyZXNzIGlzIG5vdCBiYXNlIDU4XCIpO1xuICAgIFxuICAgIC8vIGxvYWQga2V5cyBtb2R1bGUgYnkgZGVmYXVsdFxuICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpID09PSB1bmRlZmluZWQpIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkS2V5c01vZHVsZSgpO1xuICAgIFxuICAgIC8vIGdldCBpbnRlZ3JhdGVkIGFkZHJlc3MgaW4gcXVldWVcbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgbGV0IGludGVncmF0ZWRBZGRyZXNzSnNvbiA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuZ2V0X2ludGVncmF0ZWRfYWRkcmVzc191dGlsKG5ldHdvcmtUeXBlLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCA/IHBheW1lbnRJZCA6IFwiXCIpO1xuICAgICAgaWYgKGludGVncmF0ZWRBZGRyZXNzSnNvbi5jaGFyQXQoMCkgIT09ICd7JykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGludGVncmF0ZWRBZGRyZXNzSnNvbik7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKEpTT04ucGFyc2UoaW50ZWdyYXRlZEFkZHJlc3NKc29uKSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgaWYgdGhlIGdpdmVuIGFkZHJlc3MgaXMgdmFsaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGFkZHJlc3NcbiAgICogQHBhcmFtIHtNb25lcm9OZXR3b3JrVHlwZX0gbmV0d29ya1R5cGUgLSBuZXR3b3JrIHR5cGUgb2YgdGhlIGFkZHJlc3MgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgYWRkcmVzcyBpcyB2YWxpZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaXNWYWxpZEFkZHJlc3MoYWRkcmVzcywgbmV0d29ya1R5cGUpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgTW9uZXJvVXRpbHMudmFsaWRhdGVBZGRyZXNzKGFkZHJlc3MsIG5ldHdvcmtUeXBlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBhZGRyZXNzLCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGFkZHJlc3MgdG8gdmFsaWRhdGVcbiAgICogQHBhcmFtIHtNb25lcm9OZXR3b3JrVHlwZX0gbmV0d29ya1R5cGUgLSBuZXR3b3JrIHR5cGUgb2YgdGhlIGFkZHJlc3MgdG8gdmFsaWRhdGVcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZUFkZHJlc3MoYWRkcmVzcywgbmV0d29ya1R5cGUpIHtcbiAgICBpZiAoTW9uZXJvVXRpbHMuUFJPWFlfVE9fV09SS0VSKSByZXR1cm4gTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih1bmRlZmluZWQsIFwibW9uZXJvVXRpbHNWYWxpZGF0ZUFkZHJlc3NcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBpbnB1dHNcbiAgICBhc3NlcnQodHlwZW9mIGFkZHJlc3MgPT09IFwic3RyaW5nXCIsIFwiQWRkcmVzcyBpcyBub3Qgc3RyaW5nXCIpO1xuICAgIGFzc2VydChhZGRyZXNzLmxlbmd0aCA+IDAsIFwiQWRkcmVzcyBpcyBlbXB0eVwiKTtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNCYXNlNTgoYWRkcmVzcyksIFwiQWRkcmVzcyBpcyBub3QgYmFzZSA1OFwiKTtcbiAgICBuZXR3b3JrVHlwZSA9IE1vbmVyb05ldHdvcmtUeXBlLmZyb20obmV0d29ya1R5cGUpO1xuICAgIFxuICAgIC8vIGxvYWQga2V5cyBtb2R1bGUgYnkgZGVmYXVsdFxuICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpID09PSB1bmRlZmluZWQpIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkS2V5c01vZHVsZSgpO1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFkZHJlc3MgaW4gcXVldWVcbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5xdWV1ZVRhc2soYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICBsZXQgZXJyTXNnID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS52YWxpZGF0ZV9hZGRyZXNzKGFkZHJlc3MsIG5ldHdvcmtUeXBlKTtcbiAgICAgIGlmIChlcnJNc2cpIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnJNc2cpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogRGV0ZXJtaW5lIGlmIHRoZSBnaXZlbiBwYXltZW50IGlkIGlzIHZhbGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBheW1lbnRJZCAtIHBheW1lbnQgaWQgdG8gZGV0ZXJtaW5lIGlmIHZhbGlkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbD59IHRydWUgaWYgdGhlIHBheW1lbnQgaWQgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlzVmFsaWRQYXltZW50SWQocGF5bWVudElkKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IE1vbmVyb1V0aWxzLnZhbGlkYXRlUGF5bWVudElkKHBheW1lbnRJZCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIHBheW1lbnQgaWQsIHRocm93IGFuIGVycm9yIGlmIGludmFsaWQuXG4gICAqIFxuICAgKiBUT0RPOiBpbXByb3ZlIHZhbGlkYXRpb25cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXltZW50SWQgLSBwYXltZW50IGlkIHRvIHZhbGlkYXRlIFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlUGF5bWVudElkKHBheW1lbnRJZCkge1xuICAgIGFzc2VydC5lcXVhbCh0eXBlb2YgcGF5bWVudElkLCBcInN0cmluZ1wiKTtcbiAgICBhc3NlcnQocGF5bWVudElkLmxlbmd0aCA9PT0gMTYgfHwgcGF5bWVudElkLmxlbmd0aCA9PT0gNjQpO1xuICB9XG4gICAgXG4gIC8qKlxuICAgKiBEZWNvZGUgdHggZXh0cmEgYWNjb3JkaW5nIHRvIGh0dHBzOi8vY3J5cHRvbm90ZS5vcmcvY25zL2NuczAwNS50eHQgYW5kXG4gICAqIHJldHVybnMgdGhlIGxhc3QgdHggcHViIGtleS5cbiAgICogXG4gICAqIFRPRE86IHVzZSBjKysgYnJpZGdlIGZvciB0aGlzXG4gICAqIFxuICAgKiBAcGFyYW0gW2J5dGVbXV0gdHhFeHRyYSAtIGFycmF5IG9mIHR4IGV4dHJhIGJ5dGVzXG4gICAqIEByZXR1cm4ge3N0cmluZ30gdGhlIGxhc3QgcHViIGtleSBhcyBhIGhleGlkZWNpbWFsIHN0cmluZ1xuICAgKi9cbiAgc3RhdGljIGFzeW5jIGdldExhc3RUeFB1YktleSh0eEV4dHJhKSB7XG4gICAgbGV0IGxhc3RQdWJLZXlJZHg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eEV4dHJhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgdGFnID0gdHhFeHRyYVtpXTtcbiAgICAgIGlmICh0YWcgPT09IDAgfHwgdGFnID09PSAyKSB7XG4gICAgICAgIGkgKz0gMSArIHR4RXh0cmFbaSArIDFdOyAgLy8gYWR2YW5jZSB0byBuZXh0IHRhZ1xuICAgICAgfSBlbHNlIGlmICh0YWcgPT09IDEpIHtcbiAgICAgICAgbGFzdFB1YktleUlkeCA9IGkgKyAxO1xuICAgICAgICBpICs9IDEgKyAzMjsgICAgICAgICAgICAgIC8vIGFkdmFuY2UgdG8gbmV4dCB0YWdcbiAgICAgIH0gZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIHN1Yi1maWVsZCB0YWc6IFwiICsgdGFnKTtcbiAgICB9XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKG5ldyBVaW50OEFycmF5KHR4RXh0cmEuc2xpY2UobGFzdFB1YktleUlkeCwgbGFzdFB1YktleUlkeCArIDMyKSkpLnRvU3RyaW5nKFwiaGV4XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0d28gcGF5bWVudCBpZHMgYXJlIGZ1bmN0aW9uYWxseSBlcXVhbC5cbiAgICogXG4gICAqIEZvciBleGFtcGxlLCAwMzI4NGU0MWMzNDJmMDMyIGFuZCAwMzI4NGU0MWMzNDJmMDMyMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIGFyZSBjb25zaWRlcmVkIGVxdWFsLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBheW1lbnRJZDEgaXMgYSBwYXltZW50IGlkIHRvIGNvbXBhcmVcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBheW1lbnRJZDIgaXMgYSBwYXltZW50IGlkIHRvIGNvbXBhcmVcbiAgICogQHJldHVybiB7Ym9vbH0gdHJ1ZSBpZiB0aGUgcGF5bWVudCBpZHMgYXJlIGVxdWFsLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBwYXltZW50SWRzRXF1YWwocGF5bWVudElkMSwgcGF5bWVudElkMikge1xuICAgIGxldCBtYXhMZW5ndGggPSBNYXRoLm1heChwYXltZW50SWQxLmxlbmd0aCwgcGF5bWVudElkMi5sZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF4TGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChpIDwgcGF5bWVudElkMS5sZW5ndGggJiYgaSA8IHBheW1lbnRJZDIubGVuZ3RoICYmIHBheW1lbnRJZDFbaV0gIT09IHBheW1lbnRJZDJbaV0pIHJldHVybiBmYWxzZTtcbiAgICAgIGlmIChpID49IHBheW1lbnRJZDEubGVuZ3RoICYmIHBheW1lbnRJZDJbaV0gIT09ICcwJykgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKGkgPj0gcGF5bWVudElkMi5sZW5ndGggJiYgcGF5bWVudElkMVtpXSAhPT0gJzAnKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIFxuICAvKipcbiAgICogTWVyZ2VzIGEgdHJhbnNhY3Rpb24gaW50byBhIGxpc3Qgb2YgZXhpc3RpbmcgdHJhbnNhY3Rpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeFtdfSB0eHMgLSBleGlzdGluZyB0cmFuc2FjdGlvbnMgdG8gbWVyZ2UgaW50b1xuICAgKiBAcGFyYW0ge01vbmVyb1R4fSB0eCAtIHRyYW5zYWN0aW9uIHRvIG1lcmdlIGludG8gdGhlIGxpc3RcbiAgICovXG4gIHN0YXRpYyBtZXJnZVR4KHR4cywgdHgpIHtcbiAgICBmb3IgKGxldCBhVHggb2YgdHhzKSB7XG4gICAgICBpZiAoYVR4LmdldEhhc2goKSA9PT0gdHguZ2V0SGFzaCgpKSB7XG4gICAgICAgIGFUeC5tZXJnZSh0eCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdHhzLnB1c2godHgpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydCB0aGUgZ2l2ZW4gSlNPTiB0byBhIGJpbmFyeSBVaW50OEFycmF5IHVzaW5nIE1vbmVybydzIHBvcnRhYmxlIHN0b3JhZ2UgZm9ybWF0LlxuICAgKiBcbiAgICogQHBhcmFtIHtvYmplY3R9IGpzb24gLSBqc29uIHRvIGNvbnZlcnQgdG8gYmluYXJ5XG4gICAqIEByZXR1cm4ge1Byb21pc2U8VWludDhBcnJheT59IHRoZSBqc29uIGNvbnZlcnRlZCB0byBwb3J0YWJsZSBzdG9yYWdlIGJpbmFyeVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGpzb25Ub0JpbmFyeShqc29uKSB7XG4gICAgaWYgKE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUikgcmV0dXJuIExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodW5kZWZpbmVkLCBcIm1vbmVyb1V0aWxzSnNvblRvQmluYXJ5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgXG4gICAgLy8gbG9hZCBrZXlzIG1vZHVsZSBieSBkZWZhdWx0XG4gICAgaWYgKExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkgPT09IHVuZGVmaW5lZCkgYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRLZXlzTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gdXNlIHdhc20gaW4gcXVldWVcbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5xdWV1ZVRhc2soYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICBcbiAgICAgIC8vIHNlcmlhbGl6ZSBqc29uIHRvIGJpbmFyeSB3aGljaCBpcyBzdG9yZWQgaW4gYysrIGhlYXBcbiAgICAgIGxldCBiaW5NZW1JbmZvU3RyID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5tYWxsb2NfYmluYXJ5X2Zyb21fanNvbihKU09OLnN0cmluZ2lmeShqc29uKSk7XG4gICAgICBcbiAgICAgIC8vIHNhbml0aXplIGJpbmFyeSBtZW1vcnkgYWRkcmVzcyBpbmZvXG4gICAgICBsZXQgYmluTWVtSW5mbyA9IEpTT04ucGFyc2UoYmluTWVtSW5mb1N0cik7XG4gICAgICBiaW5NZW1JbmZvLnB0ciA9IHBhcnNlSW50KGJpbk1lbUluZm8ucHRyKTtcbiAgICAgIGJpbk1lbUluZm8ubGVuZ3RoID0gcGFyc2VJbnQoYmluTWVtSW5mby5sZW5ndGgpO1xuICAgICAgXG4gICAgICAvLyByZWFkIGJpbmFyeSBkYXRhIGZyb20gaGVhcCB0byBVaW50OEFycmF5XG4gICAgICBsZXQgdmlldyA9IG5ldyBVaW50OEFycmF5KGJpbk1lbUluZm8ubGVuZ3RoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmluTWVtSW5mby5sZW5ndGg7IGkrKykge1xuICAgICAgICB2aWV3W2ldID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQVThbYmluTWVtSW5mby5wdHIgLyBVaW50OEFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICsgaV07XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGZyZWUgYmluYXJ5IG9uIGhlYXBcbiAgICAgIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuX2ZyZWUoYmluTWVtSW5mby5wdHIpO1xuICAgICAgXG4gICAgICAvLyByZXR1cm4ganNvbiBmcm9tIGJpbmFyeSBkYXRhXG4gICAgICByZXR1cm4gdmlldztcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnQgdGhlIGdpdmVuIHBvcnRhYmxlIHN0b3JhZ2UgYmluYXJ5IHRvIEpTT04uXG4gICAqIFxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4YXJyIC0gYmluYXJ5IGRhdGEgaW4gTW9uZXJvJ3MgcG9ydGFibGUgc3RvcmFnZSBmb3JtYXRcbiAgICogQHJldHVybiB7UHJvbWlzZTxvYmplY3Q+fSBKU09OIG9iamVjdCBjb252ZXJ0ZWQgZnJvbSB0aGUgYmluYXJ5IGRhdGFcbiAgICovXG4gIHN0YXRpYyBhc3luYyBiaW5hcnlUb0pzb24odWludDhhcnIpIHtcbiAgICBpZiAoTW9uZXJvVXRpbHMuUFJPWFlfVE9fV09SS0VSKSByZXR1cm4gTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih1bmRlZmluZWQsIFwibW9uZXJvVXRpbHNCaW5hcnlUb0pzb25cIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICBcbiAgICAvLyBsb2FkIGtleXMgbW9kdWxlIGJ5IGRlZmF1bHRcbiAgICBpZiAoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSA9PT0gdW5kZWZpbmVkKSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEtleXNNb2R1bGUoKTtcbiAgICBcbiAgICAvLyB1c2Ugd2FzbSBpbiBxdWV1ZVxuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLnF1ZXVlVGFzayhhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIFxuICAgICAgLy8gYWxsb2NhdGUgc3BhY2UgaW4gYysrIGhlYXAgZm9yIGJpbmFyeVxuICAgICAgbGV0IHB0ciA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuX21hbGxvYyh1aW50OGFyci5sZW5ndGggKiB1aW50OGFyci5CWVRFU19QRVJfRUxFTUVOVCk7XG4gICAgICBsZXQgaGVhcCA9IG5ldyBVaW50OEFycmF5KExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuSEVBUFU4LmJ1ZmZlciwgcHRyLCB1aW50OGFyci5sZW5ndGggKiB1aW50OGFyci5CWVRFU19QRVJfRUxFTUVOVCk7XG4gICAgICBpZiAocHRyICE9PSBoZWFwLmJ5dGVPZmZzZXQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1lbW9yeSBwdHIgIT09IGhlYXAuYnl0ZU9mZnNldFwiKTsgLy8gc2hvdWxkIGJlIGVxdWFsXG4gICAgICBcbiAgICAgIC8vIHdyaXRlIGJpbmFyeSB0byBoZWFwXG4gICAgICBoZWFwLnNldChuZXcgVWludDhBcnJheSh1aW50OGFyci5idWZmZXIpKTtcbiAgICAgIFxuICAgICAgLy8gY3JlYXRlIG9iamVjdCB3aXRoIGJpbmFyeSBtZW1vcnkgYWRkcmVzcyBpbmZvXG4gICAgICBsZXQgYmluTWVtSW5mbyA9IHsgcHRyOiBwdHIsIGxlbmd0aDogdWludDhhcnIubGVuZ3RoIH07XG4gICAgICBcbiAgICAgIC8vIGNvbnZlcnQgYmluYXJ5IHRvIGpzb24gc3RyXG4gICAgICBjb25zdCByZXRfc3RyaW5nID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5iaW5hcnlfdG9fanNvbihKU09OLnN0cmluZ2lmeShiaW5NZW1JbmZvKSk7XG4gICAgICBcbiAgICAgIC8vIGZyZWUgYmluYXJ5IG9uIGhlYXBcbiAgICAgIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuX2ZyZWUocHRyKTtcbiAgICAgIFxuICAgICAgLy8gcGFyc2UgYW5kIHJldHVybiBqc29uXG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShyZXRfc3RyaW5nKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnQgdGhlIGJpbmFyeSByZXNwb25zZSBmcm9tIGRhZW1vbiBSUEMgYmxvY2sgcmV0cmlldmFsIHRvIEpTT04uXG4gICAqIFxuICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IHVpbnQ4YXJyIC0gYmluYXJ5IHJlc3BvbnNlIGZyb20gZGFlbW9uIFJQQyB3aGVuIGdldHRpbmcgYmxvY2tzXG4gICAqIEByZXR1cm4ge1Byb21pc2U8b2JqZWN0Pn0gSlNPTiBvYmplY3Qgd2l0aCB0aGUgYmxvY2tzIGRhdGFcbiAgICovXG4gIHN0YXRpYyBhc3luYyBiaW5hcnlCbG9ja3NUb0pzb24odWludDhhcnIpIHtcbiAgICBpZiAoTW9uZXJvVXRpbHMuUFJPWFlfVE9fV09SS0VSKSByZXR1cm4gTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih1bmRlZmluZWQsIFwibW9uZXJvVXRpbHNCaW5hcnlCbG9ja3NUb0pzb25cIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICBcbiAgICAvLyBsb2FkIGtleXMgbW9kdWxlIGJ5IGRlZmF1bHRcbiAgICBpZiAoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSA9PT0gdW5kZWZpbmVkKSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEtleXNNb2R1bGUoKTtcbiAgICBcbiAgICAvLyB1c2Ugd2FzbSBpbiBxdWV1ZVxuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLnF1ZXVlVGFzayhhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIFxuICAgICAgLy8gYWxsb2NhdGUgc3BhY2UgaW4gYysrIGhlYXAgZm9yIGJpbmFyeVxuICAgICAgbGV0IHB0ciA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuX21hbGxvYyh1aW50OGFyci5sZW5ndGggKiB1aW50OGFyci5CWVRFU19QRVJfRUxFTUVOVCk7XG4gICAgICBsZXQgaGVhcCA9IG5ldyBVaW50OEFycmF5KExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuSEVBUFU4LmJ1ZmZlciwgcHRyLCB1aW50OGFyci5sZW5ndGggKiB1aW50OGFyci5CWVRFU19QRVJfRUxFTUVOVCk7XG4gICAgICBpZiAocHRyICE9PSBoZWFwLmJ5dGVPZmZzZXQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1lbW9yeSBwdHIgIT09IGhlYXAuYnl0ZU9mZnNldFwiKTsgLy8gc2hvdWxkIGJlIGVxdWFsXG4gICAgICBcbiAgICAgIC8vIHdyaXRlIGJpbmFyeSB0byBoZWFwXG4gICAgICBoZWFwLnNldChuZXcgVWludDhBcnJheSh1aW50OGFyci5idWZmZXIpKTtcbiAgICAgIFxuICAgICAgLy8gY3JlYXRlIG9iamVjdCB3aXRoIGJpbmFyeSBtZW1vcnkgYWRkcmVzcyBpbmZvXG4gICAgICBsZXQgYmluTWVtSW5mbyA9IHsgcHRyOiBwdHIsIGxlbmd0aDogdWludDhhcnIubGVuZ3RoICB9XG5cbiAgICAgIC8vIGNvbnZlcnQgYmluYXJ5IHRvIGpzb24gc3RyXG4gICAgICBjb25zdCBqc29uX3N0ciA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuYmluYXJ5X2Jsb2Nrc190b19qc29uKEpTT04uc3RyaW5naWZ5KGJpbk1lbUluZm8pKTtcbiAgICAgIFxuICAgICAgLy8gZnJlZSBtZW1vcnlcbiAgICAgIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuX2ZyZWUocHRyKTtcbiAgICAgIFxuICAgICAgLy8gcGFyc2UgcmVzdWx0IHRvIGpzb25cbiAgICAgIGxldCBqc29uID0gSlNPTi5wYXJzZShqc29uX3N0cik7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyc2luZyBqc29uIGdpdmVzIGFycmF5cyBvZiBibG9jayBhbmQgdHggc3RyaW5nc1xuICAgICAganNvbi5ibG9ja3MgPSBqc29uLmJsb2Nrcy5tYXAoYmxvY2tTdHIgPT4gSlNPTi5wYXJzZShibG9ja1N0cikpOyAgICAgICAgICAvLyByZXBsYWNlIGJsb2NrIHN0cmluZ3Mgd2l0aCBwYXJzZWQgYmxvY2tzXG4gICAgICBqc29uLnR4cyA9IGpzb24udHhzLm1hcCh0eHMgPT4gdHhzID8gdHhzLm1hcCh0eCA9PiBKU09OLnBhcnNlKHR4LnJlcGxhY2UoXCIsXCIsIFwie1wiKSArIFwifVwiKSkgOiBbXSk7IC8vIG1vZGlmeSB0eCBzdHJpbmcgdG8gcHJvcGVyIGpzb24gYW5kIHBhcnNlIC8vIFRPRE86IG1vcmUgZWZmaWNpZW50IHdheSB0aGFuIHRoaXMganNvbiBtYW5pcHVsYXRpb24/XG4gICAgICByZXR1cm4ganNvbjtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnQgWE1SIHRvIGF0b21pYyB1bml0cy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyIHwgc3RyaW5nfSBhbW91bnRYbXIgLSBhbW91bnQgaW4gWE1SIHRvIGNvbnZlcnQgdG8gYXRvbWljIHVuaXRzXG4gICAqIEByZXR1cm4ge2JpZ2ludH0gYW1vdW50IGluIGF0b21pYyB1bml0c1xuICAgKi9cbiAgc3RhdGljIHhtclRvQXRvbWljVW5pdHMoYW1vdW50WG1yOiBudW1iZXIgfCBzdHJpbmcpOiBiaWdpbnQge1xuICAgIGlmICh0eXBlb2YgYW1vdW50WG1yID09PSBcIm51bWJlclwiKSBhbW91bnRYbXIgPSBcIlwiICsgYW1vdW50WG1yO1xuICAgIGxldCBkZWNpbWFsRGl2aXNvciA9IDE7XG4gICAgbGV0IGRlY2ltYWxJZHggPSBhbW91bnRYbXIuaW5kZXhPZignLicpO1xuICAgIGlmIChkZWNpbWFsSWR4ID4gLTEpIHtcbiAgICAgIGRlY2ltYWxEaXZpc29yID0gTWF0aC5wb3coMTAsIGFtb3VudFhtci5sZW5ndGggLSBkZWNpbWFsSWR4IC0gMSk7XG4gICAgICBhbW91bnRYbXIgPSBhbW91bnRYbXIuc2xpY2UoMCwgZGVjaW1hbElkeCkgKyBhbW91bnRYbXIuc2xpY2UoZGVjaW1hbElkeCArIDEpO1xuICAgIH1cbiAgICByZXR1cm4gQmlnSW50KGFtb3VudFhtcikgKiBCaWdJbnQoTW9uZXJvVXRpbHMuQVVfUEVSX1hNUikgLyBCaWdJbnQoZGVjaW1hbERpdmlzb3IpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydCBhdG9taWMgdW5pdHMgdG8gWE1SLlxuICAgKiBcbiAgICogQHBhcmFtIHtiaWdpbnQgfCBzdHJpbmd9IGFtb3VudEF0b21pY1VuaXRzIC0gYW1vdW50IGluIGF0b21pYyB1bml0cyB0byBjb252ZXJ0IHRvIFhNUlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IGFtb3VudCBpbiBYTVIgXG4gICAqL1xuICBzdGF0aWMgYXRvbWljVW5pdHNUb1htcihhbW91bnRBdG9taWNVbml0czogYmlnaW50IHwgc3RyaW5nKSB7XG4gICAgaWYgKHR5cGVvZiBhbW91bnRBdG9taWNVbml0cyA9PT0gXCJzdHJpbmdcIikgYW1vdW50QXRvbWljVW5pdHMgPSBCaWdJbnQoYW1vdW50QXRvbWljVW5pdHMpO1xuICAgIGVsc2UgaWYgKHR5cGVvZiBhbW91bnRBdG9taWNVbml0cyAhPT0gXCJiaWdpbnRcIikgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBwcm92aWRlIGF0b21pYyB1bml0cyBhcyBiaWdpbnQgb3Igc3RyaW5nIHRvIGNvbnZlcnQgdG8gWE1SXCIpO1xuICAgIGNvbnN0IHF1b3RpZW50OiBiaWdpbnQgPSBhbW91bnRBdG9taWNVbml0cyAvIE1vbmVyb1V0aWxzLkFVX1BFUl9YTVI7XG4gICAgY29uc3QgcmVtYWluZGVyOiBiaWdpbnQgPSBhbW91bnRBdG9taWNVbml0cyAlIE1vbmVyb1V0aWxzLkFVX1BFUl9YTVI7XG4gICAgcmV0dXJuIE51bWJlcihxdW90aWVudCkgKyBOdW1iZXIocmVtYWluZGVyKSAvIE51bWJlcihNb25lcm9VdGlscy5BVV9QRVJfWE1SKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBpc0hleDY0KHN0cikge1xuICAgIHJldHVybiB0eXBlb2Ygc3RyID09PSBcInN0cmluZ1wiICYmIHN0ci5sZW5ndGggPT09IDY0ICYmIEdlblV0aWxzLmlzSGV4KHN0cik7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lIGlmIHRoZSBnaXZlbiB1bmxvY2sgdGltZSBpcyBhIHRpbWVzdGFtcCBvciBibG9jayBoZWlnaHQuXG4gICAqIFxuICAgKiBAcGFyYW0gdW5sb2NrVGltZSBpcyB0aGUgdW5sb2NrIHRpbWUgdG8gY2hlY2tcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgdW5sb2NrIHRpbWUgaXMgYSB0aW1lc3RhbXAsIGZhbHNlIGlmIGEgYmxvY2sgaGVpZ2h0XG4gICAqL1xuICBzdGF0aWMgaXNUaW1lc3RhbXAodW5sb2NrVGltZTogYmlnaW50KSB7XG4gICAgICBcbiAgICAvLyB0aHJlc2hvbGQgZm9yIGRpc3Rpbmd1aXNoaW5nIGJldHdlZW4gdGltZXN0YW1wIGFuZCBibG9jayBoZWlnaHRcbiAgICAvLyBjdXJyZW50IGJsb2NrIGhlaWdodCBpcyBhcm91bmQgMyBtaWxsaW9uLCBjdXJyZW50IHVuaXggdGltZXN0YW1wIGlzIGFyb3VuZCAxLjcgYmlsbGlvblxuICAgIGNvbnN0IHRocmVzaG9sZCA9IDUwMDAwMDAwMG47XG5cbiAgICByZXR1cm4gdW5sb2NrVGltZSA+PSB0aHJlc2hvbGQ7XG4gIH1cbn1cblxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsU0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsYUFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsWUFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksd0JBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLGtCQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7OztBQUdBO0FBQ0E7QUFDQTtBQUNlLE1BQU1NLFdBQVcsQ0FBQzs7RUFFL0I7RUFDQSxPQUFPQyxlQUFlLEdBQUcsS0FBSztFQUM5QixPQUFPQyxrQkFBa0IsR0FBRyxFQUFFO0VBQzlCLE9BQU9DLFVBQVUsR0FBRyxjQUFjO0VBQ2xDLE9BQU9DLFNBQVMsR0FBRyxFQUFFOztFQUVyQjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBT0MsVUFBVUEsQ0FBQSxFQUFHO0lBQ2xCLE9BQU8sUUFBUTtFQUNqQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBT0MsZ0JBQWdCQSxDQUFDQyxhQUFhLEVBQUU7SUFDckNQLFdBQVcsQ0FBQ0MsZUFBZSxHQUFHTSxhQUFhLElBQUksS0FBSztFQUN0RDs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FB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