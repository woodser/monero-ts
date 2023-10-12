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
    return "0.9.3";
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
    return _LibraryUtils.default.getWasmModule().queueTask(async function () {
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
}exports.default = MoneroUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwiX01vbmVyb05ldHdvcmtUeXBlIiwiTW9uZXJvVXRpbHMiLCJQUk9YWV9UT19XT1JLRVIiLCJOVU1fTU5FTU9OSUNfV09SRFMiLCJBVV9QRVJfWE1SIiwiUklOR19TSVpFIiwiZ2V0VmVyc2lvbiIsInNldFByb3h5VG9Xb3JrZXIiLCJwcm94eVRvV29ya2VyIiwidmFsaWRhdGVNbmVtb25pYyIsIm1uZW1vbmljIiwiYXNzZXJ0Iiwid29yZHMiLCJzcGxpdCIsImxlbmd0aCIsIk1vbmVyb0Vycm9yIiwiaXNWYWxpZFByaXZhdGVWaWV3S2V5IiwicHJpdmF0ZVZpZXdLZXkiLCJ2YWxpZGF0ZVByaXZhdGVWaWV3S2V5IiwiZSIsImlzVmFsaWRQdWJsaWNWaWV3S2V5IiwicHVibGljVmlld0tleSIsInZhbGlkYXRlUHVibGljVmlld0tleSIsImlzVmFsaWRQcml2YXRlU3BlbmRLZXkiLCJwcml2YXRlU3BlbmRLZXkiLCJ2YWxpZGF0ZVByaXZhdGVTcGVuZEtleSIsImlzVmFsaWRQdWJsaWNTcGVuZEtleSIsInB1YmxpY1NwZW5kS2V5IiwidmFsaWRhdGVQdWJsaWNTcGVuZEtleSIsImlzSGV4NjQiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsIm5ldHdvcmtUeXBlIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJMaWJyYXJ5VXRpbHMiLCJpbnZva2VXb3JrZXIiLCJ1bmRlZmluZWQiLCJBcnJheSIsImZyb20iLCJhcmd1bWVudHMiLCJNb25lcm9OZXR3b3JrVHlwZSIsInZhbGlkYXRlIiwiR2VuVXRpbHMiLCJpc0Jhc2U1OCIsImdldFdhc21Nb2R1bGUiLCJsb2FkS2V5c01vZHVsZSIsInF1ZXVlVGFzayIsImludGVncmF0ZWRBZGRyZXNzSnNvbiIsImdldF9pbnRlZ3JhdGVkX2FkZHJlc3NfdXRpbCIsImNoYXJBdCIsIkpTT04iLCJwYXJzZSIsImlzVmFsaWRBZGRyZXNzIiwiYWRkcmVzcyIsInZhbGlkYXRlQWRkcmVzcyIsImVyciIsImVyck1zZyIsInZhbGlkYXRlX2FkZHJlc3MiLCJpc1ZhbGlkUGF5bWVudElkIiwidmFsaWRhdGVQYXltZW50SWQiLCJlcXVhbCIsImdldExhc3RUeFB1YktleSIsInR4RXh0cmEiLCJsYXN0UHViS2V5SWR4IiwiaSIsInRhZyIsIkJ1ZmZlciIsIlVpbnQ4QXJyYXkiLCJzbGljZSIsInRvU3RyaW5nIiwicGF5bWVudElkc0VxdWFsIiwicGF5bWVudElkMSIsInBheW1lbnRJZDIiLCJtYXhMZW5ndGgiLCJNYXRoIiwibWF4IiwibWVyZ2VUeCIsInR4cyIsInR4IiwiYVR4IiwiZ2V0SGFzaCIsIm1lcmdlIiwicHVzaCIsImpzb25Ub0JpbmFyeSIsImpzb24iLCJiaW5NZW1JbmZvU3RyIiwibWFsbG9jX2JpbmFyeV9mcm9tX2pzb24iLCJzdHJpbmdpZnkiLCJiaW5NZW1JbmZvIiwicHRyIiwicGFyc2VJbnQiLCJ2aWV3IiwiSEVBUFU4IiwiQllURVNfUEVSX0VMRU1FTlQiLCJfZnJlZSIsImJpbmFyeVRvSnNvbiIsInVpbnQ4YXJyIiwiX21hbGxvYyIsImhlYXAiLCJidWZmZXIiLCJieXRlT2Zmc2V0Iiwic2V0IiwicmV0X3N0cmluZyIsImJpbmFyeV90b19qc29uIiwiYmluYXJ5QmxvY2tzVG9Kc29uIiwianNvbl9zdHIiLCJiaW5hcnlfYmxvY2tzX3RvX2pzb24iLCJibG9ja3MiLCJtYXAiLCJibG9ja1N0ciIsInJlcGxhY2UiLCJ4bXJUb0F0b21pY1VuaXRzIiwiYW1vdW50WG1yIiwiZGVjaW1hbERpdmlzb3IiLCJkZWNpbWFsSWR4IiwiaW5kZXhPZiIsInBvdyIsIkJpZ0ludCIsImF0b21pY1VuaXRzVG9YbXIiLCJhbW91bnRBdG9taWNVbml0cyIsIkVycm9yIiwicXVvdGllbnQiLCJyZW1haW5kZXIiLCJOdW1iZXIiLCJzdHIiLCJpc0hleCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb1V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBDb25uZWN0aW9uVHlwZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL0Nvbm5lY3Rpb25UeXBlXCI7XG5cbi8qKlxuICogQ29sbGVjdGlvbiBvZiBNb25lcm8gdXRpbGl0aWVzLiBSdW5zIGluIGEgd29ya2VyIHRocmVhZCBieSBkZWZhdWx0LlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9VdGlscyB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBzdGF0aWMgUFJPWFlfVE9fV09SS0VSID0gZmFsc2U7XG4gIHN0YXRpYyBOVU1fTU5FTU9OSUNfV09SRFMgPSAyNTtcbiAgc3RhdGljIEFVX1BFUl9YTVIgPSAxMDAwMDAwMDAwMDAwbjtcbiAgc3RhdGljIFJJTkdfU0laRSA9IDEyO1xuXG4gIC8qKlxuICAgKiA8cD5HZXQgdGhlIHZlcnNpb24gb2YgdGhlIG1vbmVyby10cyBsaWJyYXJ5LjxwPlxuICAgKiBcbiAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgdmVyc2lvbiBvZiB0aGlzIG1vbmVyby10cyBsaWJyYXJ5XG4gICAqL1xuICBzdGF0aWMgZ2V0VmVyc2lvbigpIHtcbiAgICByZXR1cm4gXCIwLjkuM1wiO1xuICB9XG4gIFxuICAvKipcbiAgICogRW5hYmxlIG9yIGRpc2FibGUgcHJveHlpbmcgdGhlc2UgdXRpbGl0aWVzIHRvIGEgd29ya2VyIHRocmVhZC5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gcHJveHlUb1dvcmtlciAtIHNwZWNpZmllcyBpZiB1dGlsaXRpZXMgc2hvdWxkIGJlIHByb3hpZWQgdG8gYSB3b3JrZXJcbiAgICovXG4gIHN0YXRpYyBzZXRQcm94eVRvV29ya2VyKHByb3h5VG9Xb3JrZXIpIHtcbiAgICBNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIgPSBwcm94eVRvV29ya2VyIHx8IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBtbmVtb25pYywgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogVE9ETzogaW1wcm92ZSB2YWxpZGF0aW9uLCB1c2UgbmV0d29yayB0eXBlXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbW5lbW9uaWMgLSBtbmVtb25pYyB0byB2YWxpZGF0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlTW5lbW9uaWMobW5lbW9uaWMpIHtcbiAgICBhc3NlcnQobW5lbW9uaWMsIFwiTW5lbW9uaWMgcGhyYXNlIGlzIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICBsZXQgd29yZHMgPSBtbmVtb25pYy5zcGxpdChcIiBcIik7XG4gICAgaWYgKHdvcmRzLmxlbmd0aCAhPT0gTW9uZXJvVXRpbHMuTlVNX01ORU1PTklDX1dPUkRTKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNbmVtb25pYyBwaHJhc2UgaXMgXCIgKyB3b3Jkcy5sZW5ndGggKyBcIiB3b3JkcyBidXQgbXVzdCBiZSBcIiArIE1vbmVyb1V0aWxzLk5VTV9NTkVNT05JQ19XT1JEUyk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgYSBwcml2YXRlIHZpZXcga2V5IGlzIHZhbGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByaXZhdGVWaWV3S2V5IGlzIHRoZSBwcml2YXRlIHZpZXcga2V5IHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbD59IHRydWUgaWYgdGhlIHByaXZhdGUgdmlldyBrZXkgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlzVmFsaWRQcml2YXRlVmlld0tleShwcml2YXRlVmlld0tleSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZVByaXZhdGVWaWV3S2V5KHByaXZhdGVWaWV3S2V5KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgYSBwdWJsaWMgdmlldyBrZXkgaXMgdmFsaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVibGljVmlld0tleSBpcyB0aGUgcHVibGljIHZpZXcga2V5IHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbD59IHRydWUgaWYgdGhlIHB1YmxpYyB2aWV3IGtleSBpcyB2YWxpZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaXNWYWxpZFB1YmxpY1ZpZXdLZXkocHVibGljVmlld0tleSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZVB1YmxpY1ZpZXdLZXkocHVibGljVmlld0tleSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIGEgcHJpdmF0ZSBzcGVuZCBrZXkgaXMgdmFsaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJpdmF0ZVNwZW5kS2V5IGlzIHRoZSBwcml2YXRlIHNwZW5kIGtleSB0byB2YWxpZGF0ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2w+fSB0cnVlIGlmIHRoZSBwcml2YXRlIHNwZW5kIGtleSBpcyB2YWxpZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaXNWYWxpZFByaXZhdGVTcGVuZEtleShwcml2YXRlU3BlbmRLZXkpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgTW9uZXJvVXRpbHMudmFsaWRhdGVQcml2YXRlU3BlbmRLZXkocHJpdmF0ZVNwZW5kS2V5KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgYSBwdWJsaWMgc3BlbmQga2V5IGlzIHZhbGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1YmxpY1NwZW5kS2V5IGlzIHRoZSBwdWJsaWMgc3BlbmQga2V5IHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbD59IHRydWUgaWYgdGhlIHB1YmxpYyBzcGVuZCBrZXkgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlzVmFsaWRQdWJsaWNTcGVuZEtleShwdWJsaWNTcGVuZEtleSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZVB1YmxpY1NwZW5kS2V5KHB1YmxpY1NwZW5kS2V5KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gcHJpdmF0ZSB2aWV3IGtleSwgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByaXZhdGVWaWV3S2V5IC0gcHJpdmF0ZSB2aWV3IGtleSB0byB2YWxpZGF0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlUHJpdmF0ZVZpZXdLZXkocHJpdmF0ZVZpZXdLZXkpIHtcbiAgICBpZiAoIU1vbmVyb1V0aWxzLmlzSGV4NjQocHJpdmF0ZVZpZXdLZXkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJwcml2YXRlIHZpZXcga2V5IGV4cGVjdGVkIHRvIGJlIDY0IGhleCBjaGFyYWN0ZXJzXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIHB1YmxpYyB2aWV3IGtleSwgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1YmxpY1ZpZXdLZXkgLSBwdWJsaWMgdmlldyBrZXkgdG8gdmFsaWRhdGVcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZVB1YmxpY1ZpZXdLZXkocHVibGljVmlld0tleSkge1xuICAgIGlmICghTW9uZXJvVXRpbHMuaXNIZXg2NChwdWJsaWNWaWV3S2V5KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicHVibGljIHZpZXcga2V5IGV4cGVjdGVkIHRvIGJlIDY0IGhleCBjaGFyYWN0ZXJzXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIHByaXZhdGUgc3BlbmQga2V5LCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJpdmF0ZVNwZW5kS2V5IC0gcHJpdmF0ZSBzcGVuZCBrZXkgdG8gdmFsaWRhdGVcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZVByaXZhdGVTcGVuZEtleShwcml2YXRlU3BlbmRLZXkpIHtcbiAgICBpZiAoIU1vbmVyb1V0aWxzLmlzSGV4NjQocHJpdmF0ZVNwZW5kS2V5KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicHJpdmF0ZSBzcGVuZCBrZXkgZXhwZWN0ZWQgdG8gYmUgNjQgaGV4IGNoYXJhY3RlcnNcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gcHVibGljIHNwZW5kIGtleSwgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1YmxpY1NwZW5kS2V5IC0gcHVibGljIHNwZW5kIGtleSB0byB2YWxpZGF0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlUHVibGljU3BlbmRLZXkocHVibGljU3BlbmRLZXkpIHtcbiAgICBpZiAoIU1vbmVyb1V0aWxzLmlzSGV4NjQocHVibGljU3BlbmRLZXkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJwdWJsaWMgc3BlbmQga2V5IGV4cGVjdGVkIHRvIGJlIDY0IGhleCBjaGFyYWN0ZXJzXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGFuIGludGVncmF0ZWQgYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvTmV0d29ya1R5cGV9IG5ldHdvcmtUeXBlIC0gbmV0d29yayB0eXBlIG9mIHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3NcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0YW5kYXJkQWRkcmVzcyAtIGFkZHJlc3MgdG8gZGVyaXZlIHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3MgZnJvbVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3BheW1lbnRJZF0gLSBvcHRpb25hbGx5IHNwZWNpZmllcyB0aGUgaW50ZWdyYXRlZCBhZGRyZXNzJ3MgcGF5bWVudCBpZCAoZGVmYXVsdHMgdG8gcmFuZG9tIHBheW1lbnQgaWQpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+fSB0aGUgaW50ZWdyYXRlZCBhZGRyZXNzXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgZ2V0SW50ZWdyYXRlZEFkZHJlc3MobmV0d29ya1R5cGU6IE1vbmVyb05ldHdvcmtUeXBlLCBzdGFuZGFyZEFkZHJlc3M6IHN0cmluZywgcGF5bWVudElkPzogc3RyaW5nKSB7XG4gICAgaWYgKE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUikgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyhhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJtb25lcm9VdGlsc0dldEludGVncmF0ZWRBZGRyZXNzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICBcbiAgICAvLyB2YWxpZGF0ZSBpbnB1dHNcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShuZXR3b3JrVHlwZSk7XG4gICAgYXNzZXJ0KHR5cGVvZiBzdGFuZGFyZEFkZHJlc3MgPT09IFwic3RyaW5nXCIsIFwiQWRkcmVzcyBpcyBub3Qgc3RyaW5nXCIpO1xuICAgIGFzc2VydChzdGFuZGFyZEFkZHJlc3MubGVuZ3RoID4gMCwgXCJBZGRyZXNzIGlzIGVtcHR5XCIpO1xuICAgIGFzc2VydChHZW5VdGlscy5pc0Jhc2U1OChzdGFuZGFyZEFkZHJlc3MpLCBcIkFkZHJlc3MgaXMgbm90IGJhc2UgNThcIik7XG4gICAgXG4gICAgLy8gbG9hZCBrZXlzIG1vZHVsZSBieSBkZWZhdWx0XG4gICAgaWYgKExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkgPT09IHVuZGVmaW5lZCkgYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRLZXlzTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gZ2V0IGludGVncmF0ZWQgYWRkcmVzcyBpbiBxdWV1ZVxuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLnF1ZXVlVGFzayhhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIGxldCBpbnRlZ3JhdGVkQWRkcmVzc0pzb24gPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLmdldF9pbnRlZ3JhdGVkX2FkZHJlc3NfdXRpbChuZXR3b3JrVHlwZSwgc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQgPyBwYXltZW50SWQgOiBcIlwiKTtcbiAgICAgIGlmIChpbnRlZ3JhdGVkQWRkcmVzc0pzb24uY2hhckF0KDApICE9PSAneycpIHRocm93IG5ldyBNb25lcm9FcnJvcihpbnRlZ3JhdGVkQWRkcmVzc0pzb24pO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyhKU09OLnBhcnNlKGludGVncmF0ZWRBZGRyZXNzSnNvbikpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogRGV0ZXJtaW5lIGlmIHRoZSBnaXZlbiBhZGRyZXNzIGlzIHZhbGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBhZGRyZXNzXG4gICAqIEBwYXJhbSB7TW9uZXJvTmV0d29ya1R5cGV9IG5ldHdvcmtUeXBlIC0gbmV0d29yayB0eXBlIG9mIHRoZSBhZGRyZXNzIHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIGFkZHJlc3MgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlzVmFsaWRBZGRyZXNzKGFkZHJlc3MsIG5ldHdvcmtUeXBlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IE1vbmVyb1V0aWxzLnZhbGlkYXRlQWRkcmVzcyhhZGRyZXNzLCBuZXR3b3JrVHlwZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gYWRkcmVzcywgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBhZGRyZXNzIHRvIHZhbGlkYXRlXG4gICAqIEBwYXJhbSB7TW9uZXJvTmV0d29ya1R5cGV9IG5ldHdvcmtUeXBlIC0gbmV0d29yayB0eXBlIG9mIHRoZSBhZGRyZXNzIHRvIHZhbGlkYXRlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVBZGRyZXNzKGFkZHJlc3MsIG5ldHdvcmtUeXBlKSB7XG4gICAgaWYgKE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUikgcmV0dXJuIExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodW5kZWZpbmVkLCBcIm1vbmVyb1V0aWxzVmFsaWRhdGVBZGRyZXNzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgaW5wdXRzXG4gICAgYXNzZXJ0KHR5cGVvZiBhZGRyZXNzID09PSBcInN0cmluZ1wiLCBcIkFkZHJlc3MgaXMgbm90IHN0cmluZ1wiKTtcbiAgICBhc3NlcnQoYWRkcmVzcy5sZW5ndGggPiAwLCBcIkFkZHJlc3MgaXMgZW1wdHlcIik7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzQmFzZTU4KGFkZHJlc3MpLCBcIkFkZHJlc3MgaXMgbm90IGJhc2UgNThcIik7XG4gICAgbmV0d29ya1R5cGUgPSBNb25lcm9OZXR3b3JrVHlwZS5mcm9tKG5ldHdvcmtUeXBlKTtcbiAgICBcbiAgICAvLyBsb2FkIGtleXMgbW9kdWxlIGJ5IGRlZmF1bHRcbiAgICBpZiAoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSA9PT0gdW5kZWZpbmVkKSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEtleXNNb2R1bGUoKTtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhZGRyZXNzIGluIHF1ZXVlXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgbGV0IGVyck1zZyA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkudmFsaWRhdGVfYWRkcmVzcyhhZGRyZXNzLCBuZXR3b3JrVHlwZSk7XG4gICAgICBpZiAoZXJyTXNnKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyTXNnKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERldGVybWluZSBpZiB0aGUgZ2l2ZW4gcGF5bWVudCBpZCBpcyB2YWxpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXltZW50SWQgLSBwYXltZW50IGlkIHRvIGRldGVybWluZSBpZiB2YWxpZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2w+fSB0cnVlIGlmIHRoZSBwYXltZW50IGlkIGlzIHZhbGlkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpc1ZhbGlkUGF5bWVudElkKHBheW1lbnRJZCkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZVBheW1lbnRJZChwYXltZW50SWQpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBwYXltZW50IGlkLCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKiBcbiAgICogVE9ETzogaW1wcm92ZSB2YWxpZGF0aW9uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF5bWVudElkIC0gcGF5bWVudCBpZCB0byB2YWxpZGF0ZSBcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZVBheW1lbnRJZChwYXltZW50SWQpIHtcbiAgICBhc3NlcnQuZXF1YWwodHlwZW9mIHBheW1lbnRJZCwgXCJzdHJpbmdcIik7XG4gICAgYXNzZXJ0KHBheW1lbnRJZC5sZW5ndGggPT09IDE2IHx8IHBheW1lbnRJZC5sZW5ndGggPT09IDY0KTtcbiAgfVxuICAgIFxuICAvKipcbiAgICogRGVjb2RlIHR4IGV4dHJhIGFjY29yZGluZyB0byBodHRwczovL2NyeXB0b25vdGUub3JnL2Nucy9jbnMwMDUudHh0IGFuZFxuICAgKiByZXR1cm5zIHRoZSBsYXN0IHR4IHB1YiBrZXkuXG4gICAqIFxuICAgKiBUT0RPOiB1c2UgYysrIGJyaWRnZSBmb3IgdGhpc1xuICAgKiBcbiAgICogQHBhcmFtIFtieXRlW11dIHR4RXh0cmEgLSBhcnJheSBvZiB0eCBleHRyYSBieXRlc1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBsYXN0IHB1YiBrZXkgYXMgYSBoZXhpZGVjaW1hbCBzdHJpbmdcbiAgICovXG4gIHN0YXRpYyBhc3luYyBnZXRMYXN0VHhQdWJLZXkodHhFeHRyYSkge1xuICAgIGxldCBsYXN0UHViS2V5SWR4O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdHhFeHRyYS5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IHRhZyA9IHR4RXh0cmFbaV07XG4gICAgICBpZiAodGFnID09PSAwIHx8IHRhZyA9PT0gMikge1xuICAgICAgICBpICs9IDEgKyB0eEV4dHJhW2kgKyAxXTsgIC8vIGFkdmFuY2UgdG8gbmV4dCB0YWdcbiAgICAgIH0gZWxzZSBpZiAodGFnID09PSAxKSB7XG4gICAgICAgIGxhc3RQdWJLZXlJZHggPSBpICsgMTtcbiAgICAgICAgaSArPSAxICsgMzI7ICAgICAgICAgICAgICAvLyBhZHZhbmNlIHRvIG5leHQgdGFnXG4gICAgICB9IGVsc2UgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBzdWItZmllbGQgdGFnOiBcIiArIHRhZyk7XG4gICAgfVxuICAgIHJldHVybiBCdWZmZXIuZnJvbShuZXcgVWludDhBcnJheSh0eEV4dHJhLnNsaWNlKGxhc3RQdWJLZXlJZHgsIGxhc3RQdWJLZXlJZHggKyAzMikpKS50b1N0cmluZyhcImhleFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdHdvIHBheW1lbnQgaWRzIGFyZSBmdW5jdGlvbmFsbHkgZXF1YWwuXG4gICAqIFxuICAgKiBGb3IgZXhhbXBsZSwgMDMyODRlNDFjMzQyZjAzMiBhbmQgMDMyODRlNDFjMzQyZjAzMjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCBhcmUgY29uc2lkZXJlZCBlcXVhbC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXltZW50SWQxIGlzIGEgcGF5bWVudCBpZCB0byBjb21wYXJlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXltZW50SWQyIGlzIGEgcGF5bWVudCBpZCB0byBjb21wYXJlXG4gICAqIEByZXR1cm4ge2Jvb2x9IHRydWUgaWYgdGhlIHBheW1lbnQgaWRzIGFyZSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgcGF5bWVudElkc0VxdWFsKHBheW1lbnRJZDEsIHBheW1lbnRJZDIpIHtcbiAgICBsZXQgbWF4TGVuZ3RoID0gTWF0aC5tYXgocGF5bWVudElkMS5sZW5ndGgsIHBheW1lbnRJZDIubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1heExlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoaSA8IHBheW1lbnRJZDEubGVuZ3RoICYmIGkgPCBwYXltZW50SWQyLmxlbmd0aCAmJiBwYXltZW50SWQxW2ldICE9PSBwYXltZW50SWQyW2ldKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoaSA+PSBwYXltZW50SWQxLmxlbmd0aCAmJiBwYXltZW50SWQyW2ldICE9PSAnMCcpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmIChpID49IHBheW1lbnRJZDIubGVuZ3RoICYmIHBheW1lbnRJZDFbaV0gIT09ICcwJykgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1lcmdlcyBhIHRyYW5zYWN0aW9uIGludG8gYSBsaXN0IG9mIGV4aXN0aW5nIHRyYW5zYWN0aW9ucy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhbXX0gdHhzIC0gZXhpc3RpbmcgdHJhbnNhY3Rpb25zIHRvIG1lcmdlIGludG9cbiAgICogQHBhcmFtIHtNb25lcm9UeH0gdHggLSB0cmFuc2FjdGlvbiB0byBtZXJnZSBpbnRvIHRoZSBsaXN0XG4gICAqL1xuICBzdGF0aWMgbWVyZ2VUeCh0eHMsIHR4KSB7XG4gICAgZm9yIChsZXQgYVR4IG9mIHR4cykge1xuICAgICAgaWYgKGFUeC5nZXRIYXNoKCkgPT09IHR4LmdldEhhc2goKSkge1xuICAgICAgICBhVHgubWVyZ2UodHgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHR4cy5wdXNoKHR4KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnQgdGhlIGdpdmVuIEpTT04gdG8gYSBiaW5hcnkgVWludDhBcnJheSB1c2luZyBNb25lcm8ncyBwb3J0YWJsZSBzdG9yYWdlIGZvcm1hdC5cbiAgICogXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBqc29uIC0ganNvbiB0byBjb252ZXJ0IHRvIGJpbmFyeVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFVpbnQ4QXJyYXk+fSB0aGUganNvbiBjb252ZXJ0ZWQgdG8gcG9ydGFibGUgc3RvcmFnZSBiaW5hcnlcbiAgICovXG4gIHN0YXRpYyBhc3luYyBqc29uVG9CaW5hcnkoanNvbikge1xuICAgIGlmIChNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIpIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJtb25lcm9VdGlsc0pzb25Ub0JpbmFyeVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIFxuICAgIC8vIGxvYWQga2V5cyBtb2R1bGUgYnkgZGVmYXVsdFxuICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpID09PSB1bmRlZmluZWQpIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkS2V5c01vZHVsZSgpO1xuICAgIFxuICAgIC8vIHVzZSB3YXNtIGluIHF1ZXVlXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgXG4gICAgICAvLyBzZXJpYWxpemUganNvbiB0byBiaW5hcnkgd2hpY2ggaXMgc3RvcmVkIGluIGMrKyBoZWFwXG4gICAgICBsZXQgYmluTWVtSW5mb1N0ciA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkubWFsbG9jX2JpbmFyeV9mcm9tX2pzb24oSlNPTi5zdHJpbmdpZnkoanNvbikpO1xuICAgICAgXG4gICAgICAvLyBzYW5pdGl6ZSBiaW5hcnkgbWVtb3J5IGFkZHJlc3MgaW5mb1xuICAgICAgbGV0IGJpbk1lbUluZm8gPSBKU09OLnBhcnNlKGJpbk1lbUluZm9TdHIpO1xuICAgICAgYmluTWVtSW5mby5wdHIgPSBwYXJzZUludChiaW5NZW1JbmZvLnB0cik7XG4gICAgICBiaW5NZW1JbmZvLmxlbmd0aCA9IHBhcnNlSW50KGJpbk1lbUluZm8ubGVuZ3RoKTtcbiAgICAgIFxuICAgICAgLy8gcmVhZCBiaW5hcnkgZGF0YSBmcm9tIGhlYXAgdG8gVWludDhBcnJheVxuICAgICAgbGV0IHZpZXcgPSBuZXcgVWludDhBcnJheShiaW5NZW1JbmZvLmxlbmd0aCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbk1lbUluZm8ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmlld1tpXSA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuSEVBUFU4W2Jpbk1lbUluZm8ucHRyIC8gVWludDhBcnJheS5CWVRFU19QRVJfRUxFTUVOVCArIGldO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBmcmVlIGJpbmFyeSBvbiBoZWFwXG4gICAgICBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLl9mcmVlKGJpbk1lbUluZm8ucHRyKTtcbiAgICAgIFxuICAgICAgLy8gcmV0dXJuIGpzb24gZnJvbSBiaW5hcnkgZGF0YVxuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0IHRoZSBnaXZlbiBwb3J0YWJsZSBzdG9yYWdlIGJpbmFyeSB0byBKU09OLlxuICAgKiBcbiAgICogQHBhcmFtIHtVaW50OEFycmF5fSB1aW50OGFyciAtIGJpbmFyeSBkYXRhIGluIE1vbmVybydzIHBvcnRhYmxlIHN0b3JhZ2UgZm9ybWF0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8b2JqZWN0Pn0gSlNPTiBvYmplY3QgY29udmVydGVkIGZyb20gdGhlIGJpbmFyeSBkYXRhXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgYmluYXJ5VG9Kc29uKHVpbnQ4YXJyKSB7XG4gICAgaWYgKE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUikgcmV0dXJuIExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodW5kZWZpbmVkLCBcIm1vbmVyb1V0aWxzQmluYXJ5VG9Kc29uXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgXG4gICAgLy8gbG9hZCBrZXlzIG1vZHVsZSBieSBkZWZhdWx0XG4gICAgaWYgKExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkgPT09IHVuZGVmaW5lZCkgYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRLZXlzTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gdXNlIHdhc20gaW4gcXVldWVcbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5xdWV1ZVRhc2soYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICBcbiAgICAgIC8vIGFsbG9jYXRlIHNwYWNlIGluIGMrKyBoZWFwIGZvciBiaW5hcnlcbiAgICAgIGxldCBwdHIgPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLl9tYWxsb2ModWludDhhcnIubGVuZ3RoICogdWludDhhcnIuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgbGV0IGhlYXAgPSBuZXcgVWludDhBcnJheShMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLkhFQVBVOC5idWZmZXIsIHB0ciwgdWludDhhcnIubGVuZ3RoICogdWludDhhcnIuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgaWYgKHB0ciAhPT0gaGVhcC5ieXRlT2Zmc2V0KSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNZW1vcnkgcHRyICE9PSBoZWFwLmJ5dGVPZmZzZXRcIik7IC8vIHNob3VsZCBiZSBlcXVhbFxuICAgICAgXG4gICAgICAvLyB3cml0ZSBiaW5hcnkgdG8gaGVhcFxuICAgICAgaGVhcC5zZXQobmV3IFVpbnQ4QXJyYXkodWludDhhcnIuYnVmZmVyKSk7XG4gICAgICBcbiAgICAgIC8vIGNyZWF0ZSBvYmplY3Qgd2l0aCBiaW5hcnkgbWVtb3J5IGFkZHJlc3MgaW5mb1xuICAgICAgbGV0IGJpbk1lbUluZm8gPSB7IHB0cjogcHRyLCBsZW5ndGg6IHVpbnQ4YXJyLmxlbmd0aCB9O1xuICAgICAgXG4gICAgICAvLyBjb252ZXJ0IGJpbmFyeSB0byBqc29uIHN0clxuICAgICAgY29uc3QgcmV0X3N0cmluZyA9IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuYmluYXJ5X3RvX2pzb24oSlNPTi5zdHJpbmdpZnkoYmluTWVtSW5mbykpO1xuICAgICAgXG4gICAgICAvLyBmcmVlIGJpbmFyeSBvbiBoZWFwXG4gICAgICBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLl9mcmVlKHB0cik7XG4gICAgICBcbiAgICAgIC8vIHBhcnNlIGFuZCByZXR1cm4ganNvblxuICAgICAgcmV0dXJuIEpTT04ucGFyc2UocmV0X3N0cmluZyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0IHRoZSBiaW5hcnkgcmVzcG9uc2UgZnJvbSBkYWVtb24gUlBDIGJsb2NrIHJldHJpZXZhbCB0byBKU09OLlxuICAgKiBcbiAgICogQHBhcmFtIHtVaW50OEFycmF5fSB1aW50OGFyciAtIGJpbmFyeSByZXNwb25zZSBmcm9tIGRhZW1vbiBSUEMgd2hlbiBnZXR0aW5nIGJsb2Nrc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPG9iamVjdD59IEpTT04gb2JqZWN0IHdpdGggdGhlIGJsb2NrcyBkYXRhXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgYmluYXJ5QmxvY2tzVG9Kc29uKHVpbnQ4YXJyKSB7XG4gICAgaWYgKE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUikgcmV0dXJuIExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodW5kZWZpbmVkLCBcIm1vbmVyb1V0aWxzQmluYXJ5QmxvY2tzVG9Kc29uXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgXG4gICAgLy8gbG9hZCBrZXlzIG1vZHVsZSBieSBkZWZhdWx0XG4gICAgaWYgKExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkgPT09IHVuZGVmaW5lZCkgYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRLZXlzTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gdXNlIHdhc20gaW4gcXVldWVcbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5xdWV1ZVRhc2soYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICBcbiAgICAgIC8vIGFsbG9jYXRlIHNwYWNlIGluIGMrKyBoZWFwIGZvciBiaW5hcnlcbiAgICAgIGxldCBwdHIgPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLl9tYWxsb2ModWludDhhcnIubGVuZ3RoICogdWludDhhcnIuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgbGV0IGhlYXAgPSBuZXcgVWludDhBcnJheShMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLkhFQVBVOC5idWZmZXIsIHB0ciwgdWludDhhcnIubGVuZ3RoICogdWludDhhcnIuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgaWYgKHB0ciAhPT0gaGVhcC5ieXRlT2Zmc2V0KSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNZW1vcnkgcHRyICE9PSBoZWFwLmJ5dGVPZmZzZXRcIik7IC8vIHNob3VsZCBiZSBlcXVhbFxuICAgICAgXG4gICAgICAvLyB3cml0ZSBiaW5hcnkgdG8gaGVhcFxuICAgICAgaGVhcC5zZXQobmV3IFVpbnQ4QXJyYXkodWludDhhcnIuYnVmZmVyKSk7XG4gICAgICBcbiAgICAgIC8vIGNyZWF0ZSBvYmplY3Qgd2l0aCBiaW5hcnkgbWVtb3J5IGFkZHJlc3MgaW5mb1xuICAgICAgbGV0IGJpbk1lbUluZm8gPSB7IHB0cjogcHRyLCBsZW5ndGg6IHVpbnQ4YXJyLmxlbmd0aCAgfVxuXG4gICAgICAvLyBjb252ZXJ0IGJpbmFyeSB0byBqc29uIHN0clxuICAgICAgY29uc3QganNvbl9zdHIgPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLmJpbmFyeV9ibG9ja3NfdG9fanNvbihKU09OLnN0cmluZ2lmeShiaW5NZW1JbmZvKSk7XG4gICAgICBcbiAgICAgIC8vIGZyZWUgbWVtb3J5XG4gICAgICBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLl9mcmVlKHB0cik7XG4gICAgICBcbiAgICAgIC8vIHBhcnNlIHJlc3VsdCB0byBqc29uXG4gICAgICBsZXQganNvbiA9IEpTT04ucGFyc2UoanNvbl9zdHIpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhcnNpbmcganNvbiBnaXZlcyBhcnJheXMgb2YgYmxvY2sgYW5kIHR4IHN0cmluZ3NcbiAgICAgIGpzb24uYmxvY2tzID0ganNvbi5ibG9ja3MubWFwKGJsb2NrU3RyID0+IEpTT04ucGFyc2UoYmxvY2tTdHIpKTsgICAgICAgICAgLy8gcmVwbGFjZSBibG9jayBzdHJpbmdzIHdpdGggcGFyc2VkIGJsb2Nrc1xuICAgICAganNvbi50eHMgPSBqc29uLnR4cy5tYXAodHhzID0+IHR4cyA/IHR4cy5tYXAodHggPT4gSlNPTi5wYXJzZSh0eC5yZXBsYWNlKFwiLFwiLCBcIntcIikgKyBcIn1cIikpIDogW10pOyAvLyBtb2RpZnkgdHggc3RyaW5nIHRvIHByb3BlciBqc29uIGFuZCBwYXJzZSAvLyBUT0RPOiBtb3JlIGVmZmljaWVudCB3YXkgdGhhbiB0aGlzIGpzb24gbWFuaXB1bGF0aW9uP1xuICAgICAgcmV0dXJuIGpzb247XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0IFhNUiB0byBhdG9taWMgdW5pdHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlciB8IHN0cmluZ30gYW1vdW50WG1yIC0gYW1vdW50IGluIFhNUiB0byBjb252ZXJ0IHRvIGF0b21pYyB1bml0c1xuICAgKiBAcmV0dXJuIHtiaWdpbnR9IGFtb3VudCBpbiBhdG9taWMgdW5pdHNcbiAgICovXG4gIHN0YXRpYyB4bXJUb0F0b21pY1VuaXRzKGFtb3VudFhtcjogbnVtYmVyIHwgc3RyaW5nKTogYmlnaW50IHtcbiAgICBpZiAodHlwZW9mIGFtb3VudFhtciA9PT0gXCJudW1iZXJcIikgYW1vdW50WG1yID0gXCJcIiArIGFtb3VudFhtcjtcbiAgICBsZXQgZGVjaW1hbERpdmlzb3IgPSAxO1xuICAgIGxldCBkZWNpbWFsSWR4ID0gYW1vdW50WG1yLmluZGV4T2YoJy4nKTtcbiAgICBpZiAoZGVjaW1hbElkeCA+IC0xKSB7XG4gICAgICBkZWNpbWFsRGl2aXNvciA9IE1hdGgucG93KDEwLCBhbW91bnRYbXIubGVuZ3RoIC0gZGVjaW1hbElkeCAtIDEpO1xuICAgICAgYW1vdW50WG1yID0gYW1vdW50WG1yLnNsaWNlKDAsIGRlY2ltYWxJZHgpICsgYW1vdW50WG1yLnNsaWNlKGRlY2ltYWxJZHggKyAxKTtcbiAgICB9XG4gICAgcmV0dXJuIEJpZ0ludChhbW91bnRYbXIpICogQmlnSW50KE1vbmVyb1V0aWxzLkFVX1BFUl9YTVIpIC8gQmlnSW50KGRlY2ltYWxEaXZpc29yKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnZlcnQgYXRvbWljIHVuaXRzIHRvIFhNUi5cbiAgICogXG4gICAqIEBwYXJhbSB7YmlnaW50IHwgc3RyaW5nfSBhbW91bnRBdG9taWNVbml0cyAtIGFtb3VudCBpbiBhdG9taWMgdW5pdHMgdG8gY29udmVydCB0byBYTVJcbiAgICogQHJldHVybiB7bnVtYmVyfSBhbW91bnQgaW4gWE1SIFxuICAgKi9cbiAgc3RhdGljIGF0b21pY1VuaXRzVG9YbXIoYW1vdW50QXRvbWljVW5pdHM6IGJpZ2ludCB8IHN0cmluZykge1xuICAgIGlmICh0eXBlb2YgYW1vdW50QXRvbWljVW5pdHMgPT09IFwic3RyaW5nXCIpIGFtb3VudEF0b21pY1VuaXRzID0gQmlnSW50KGFtb3VudEF0b21pY1VuaXRzKTtcbiAgICBlbHNlIGlmICh0eXBlb2YgYW1vdW50QXRvbWljVW5pdHMgIT09IFwiYmlnaW50XCIpIHRocm93IG5ldyBFcnJvcihcIk11c3QgcHJvdmlkZSBhdG9taWMgdW5pdHMgYXMgYmlnaW50IG9yIHN0cmluZyB0byBjb252ZXJ0IHRvIFhNUlwiKTtcbiAgICBjb25zdCBxdW90aWVudDogYmlnaW50ID0gYW1vdW50QXRvbWljVW5pdHMgLyBNb25lcm9VdGlscy5BVV9QRVJfWE1SO1xuICAgIGNvbnN0IHJlbWFpbmRlcjogYmlnaW50ID0gYW1vdW50QXRvbWljVW5pdHMgJSBNb25lcm9VdGlscy5BVV9QRVJfWE1SO1xuICAgIHJldHVybiBOdW1iZXIocXVvdGllbnQpICsgTnVtYmVyKHJlbWFpbmRlcikgLyBOdW1iZXIoTW9uZXJvVXRpbHMuQVVfUEVSX1hNUik7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgaXNIZXg2NChzdHIpIHtcbiAgICByZXR1cm4gdHlwZW9mIHN0ciA9PT0gXCJzdHJpbmdcIiAmJiBzdHIubGVuZ3RoID09PSA2NCAmJiBHZW5VdGlscy5pc0hleChzdHIpO1xuICB9XG59XG5cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGFBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFlBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLHdCQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxrQkFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDZSxNQUFNTSxXQUFXLENBQUM7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