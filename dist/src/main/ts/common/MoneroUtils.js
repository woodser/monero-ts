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
    return "0.9.6";
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
}exports.default = MoneroUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwiX01vbmVyb05ldHdvcmtUeXBlIiwiTW9uZXJvVXRpbHMiLCJQUk9YWV9UT19XT1JLRVIiLCJOVU1fTU5FTU9OSUNfV09SRFMiLCJBVV9QRVJfWE1SIiwiUklOR19TSVpFIiwiZ2V0VmVyc2lvbiIsInNldFByb3h5VG9Xb3JrZXIiLCJwcm94eVRvV29ya2VyIiwidmFsaWRhdGVNbmVtb25pYyIsIm1uZW1vbmljIiwiYXNzZXJ0Iiwid29yZHMiLCJzcGxpdCIsImxlbmd0aCIsIk1vbmVyb0Vycm9yIiwiaXNWYWxpZFByaXZhdGVWaWV3S2V5IiwicHJpdmF0ZVZpZXdLZXkiLCJ2YWxpZGF0ZVByaXZhdGVWaWV3S2V5IiwiZSIsImlzVmFsaWRQdWJsaWNWaWV3S2V5IiwicHVibGljVmlld0tleSIsInZhbGlkYXRlUHVibGljVmlld0tleSIsImlzVmFsaWRQcml2YXRlU3BlbmRLZXkiLCJwcml2YXRlU3BlbmRLZXkiLCJ2YWxpZGF0ZVByaXZhdGVTcGVuZEtleSIsImlzVmFsaWRQdWJsaWNTcGVuZEtleSIsInB1YmxpY1NwZW5kS2V5IiwidmFsaWRhdGVQdWJsaWNTcGVuZEtleSIsImlzSGV4NjQiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsIm5ldHdvcmtUeXBlIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJMaWJyYXJ5VXRpbHMiLCJpbnZva2VXb3JrZXIiLCJ1bmRlZmluZWQiLCJBcnJheSIsImZyb20iLCJhcmd1bWVudHMiLCJNb25lcm9OZXR3b3JrVHlwZSIsInZhbGlkYXRlIiwiR2VuVXRpbHMiLCJpc0Jhc2U1OCIsImdldFdhc21Nb2R1bGUiLCJsb2FkS2V5c01vZHVsZSIsInF1ZXVlVGFzayIsImludGVncmF0ZWRBZGRyZXNzSnNvbiIsImdldF9pbnRlZ3JhdGVkX2FkZHJlc3NfdXRpbCIsImNoYXJBdCIsIkpTT04iLCJwYXJzZSIsImlzVmFsaWRBZGRyZXNzIiwiYWRkcmVzcyIsInZhbGlkYXRlQWRkcmVzcyIsImVyciIsImVyck1zZyIsInZhbGlkYXRlX2FkZHJlc3MiLCJpc1ZhbGlkUGF5bWVudElkIiwidmFsaWRhdGVQYXltZW50SWQiLCJlcXVhbCIsImdldExhc3RUeFB1YktleSIsInR4RXh0cmEiLCJsYXN0UHViS2V5SWR4IiwiaSIsInRhZyIsIkJ1ZmZlciIsIlVpbnQ4QXJyYXkiLCJzbGljZSIsInRvU3RyaW5nIiwicGF5bWVudElkc0VxdWFsIiwicGF5bWVudElkMSIsInBheW1lbnRJZDIiLCJtYXhMZW5ndGgiLCJNYXRoIiwibWF4IiwibWVyZ2VUeCIsInR4cyIsInR4IiwiYVR4IiwiZ2V0SGFzaCIsIm1lcmdlIiwicHVzaCIsImpzb25Ub0JpbmFyeSIsImpzb24iLCJiaW5NZW1JbmZvU3RyIiwibWFsbG9jX2JpbmFyeV9mcm9tX2pzb24iLCJzdHJpbmdpZnkiLCJiaW5NZW1JbmZvIiwicHRyIiwicGFyc2VJbnQiLCJ2aWV3IiwiSEVBUFU4IiwiQllURVNfUEVSX0VMRU1FTlQiLCJfZnJlZSIsImJpbmFyeVRvSnNvbiIsInVpbnQ4YXJyIiwiX21hbGxvYyIsImhlYXAiLCJidWZmZXIiLCJieXRlT2Zmc2V0Iiwic2V0IiwicmV0X3N0cmluZyIsImJpbmFyeV90b19qc29uIiwiYmluYXJ5QmxvY2tzVG9Kc29uIiwianNvbl9zdHIiLCJiaW5hcnlfYmxvY2tzX3RvX2pzb24iLCJibG9ja3MiLCJtYXAiLCJibG9ja1N0ciIsInJlcGxhY2UiLCJ4bXJUb0F0b21pY1VuaXRzIiwiYW1vdW50WG1yIiwiZGVjaW1hbERpdmlzb3IiLCJkZWNpbWFsSWR4IiwiaW5kZXhPZiIsInBvdyIsIkJpZ0ludCIsImF0b21pY1VuaXRzVG9YbXIiLCJhbW91bnRBdG9taWNVbml0cyIsIkVycm9yIiwicXVvdGllbnQiLCJyZW1haW5kZXIiLCJOdW1iZXIiLCJzdHIiLCJpc0hleCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb1V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBDb25uZWN0aW9uVHlwZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL0Nvbm5lY3Rpb25UeXBlXCI7XG5cbi8qKlxuICogQ29sbGVjdGlvbiBvZiBNb25lcm8gdXRpbGl0aWVzLiBSdW5zIGluIGEgd29ya2VyIHRocmVhZCBieSBkZWZhdWx0LlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9VdGlscyB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBzdGF0aWMgUFJPWFlfVE9fV09SS0VSID0gZmFsc2U7XG4gIHN0YXRpYyBOVU1fTU5FTU9OSUNfV09SRFMgPSAyNTtcbiAgc3RhdGljIEFVX1BFUl9YTVIgPSAxMDAwMDAwMDAwMDAwbjtcbiAgc3RhdGljIFJJTkdfU0laRSA9IDEyO1xuXG4gIC8qKlxuICAgKiA8cD5HZXQgdGhlIHZlcnNpb24gb2YgdGhlIG1vbmVyby10cyBsaWJyYXJ5LjxwPlxuICAgKiBcbiAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgdmVyc2lvbiBvZiB0aGlzIG1vbmVyby10cyBsaWJyYXJ5XG4gICAqL1xuICBzdGF0aWMgZ2V0VmVyc2lvbigpIHtcbiAgICByZXR1cm4gXCIwLjkuNlwiO1xuICB9XG4gIFxuICAvKipcbiAgICogRW5hYmxlIG9yIGRpc2FibGUgcHJveHlpbmcgdGhlc2UgdXRpbGl0aWVzIHRvIGEgd29ya2VyIHRocmVhZC5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gcHJveHlUb1dvcmtlciAtIHNwZWNpZmllcyBpZiB1dGlsaXRpZXMgc2hvdWxkIGJlIHByb3hpZWQgdG8gYSB3b3JrZXJcbiAgICovXG4gIHN0YXRpYyBzZXRQcm94eVRvV29ya2VyKHByb3h5VG9Xb3JrZXIpIHtcbiAgICBNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIgPSBwcm94eVRvV29ya2VyIHx8IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoZSBnaXZlbiBtbmVtb25pYywgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogVE9ETzogaW1wcm92ZSB2YWxpZGF0aW9uLCB1c2UgbmV0d29yayB0eXBlXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbW5lbW9uaWMgLSBtbmVtb25pYyB0byB2YWxpZGF0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlTW5lbW9uaWMobW5lbW9uaWMpIHtcbiAgICBhc3NlcnQobW5lbW9uaWMsIFwiTW5lbW9uaWMgcGhyYXNlIGlzIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICBsZXQgd29yZHMgPSBtbmVtb25pYy5zcGxpdChcIiBcIik7XG4gICAgaWYgKHdvcmRzLmxlbmd0aCAhPT0gTW9uZXJvVXRpbHMuTlVNX01ORU1PTklDX1dPUkRTKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNbmVtb25pYyBwaHJhc2UgaXMgXCIgKyB3b3Jkcy5sZW5ndGggKyBcIiB3b3JkcyBidXQgbXVzdCBiZSBcIiArIE1vbmVyb1V0aWxzLk5VTV9NTkVNT05JQ19XT1JEUyk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgYSBwcml2YXRlIHZpZXcga2V5IGlzIHZhbGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByaXZhdGVWaWV3S2V5IGlzIHRoZSBwcml2YXRlIHZpZXcga2V5IHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbD59IHRydWUgaWYgdGhlIHByaXZhdGUgdmlldyBrZXkgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlzVmFsaWRQcml2YXRlVmlld0tleShwcml2YXRlVmlld0tleSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZVByaXZhdGVWaWV3S2V5KHByaXZhdGVWaWV3S2V5KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgYSBwdWJsaWMgdmlldyBrZXkgaXMgdmFsaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVibGljVmlld0tleSBpcyB0aGUgcHVibGljIHZpZXcga2V5IHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbD59IHRydWUgaWYgdGhlIHB1YmxpYyB2aWV3IGtleSBpcyB2YWxpZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaXNWYWxpZFB1YmxpY1ZpZXdLZXkocHVibGljVmlld0tleSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZVB1YmxpY1ZpZXdLZXkocHVibGljVmlld0tleSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIGEgcHJpdmF0ZSBzcGVuZCBrZXkgaXMgdmFsaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJpdmF0ZVNwZW5kS2V5IGlzIHRoZSBwcml2YXRlIHNwZW5kIGtleSB0byB2YWxpZGF0ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2w+fSB0cnVlIGlmIHRoZSBwcml2YXRlIHNwZW5kIGtleSBpcyB2YWxpZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaXNWYWxpZFByaXZhdGVTcGVuZEtleShwcml2YXRlU3BlbmRLZXkpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgTW9uZXJvVXRpbHMudmFsaWRhdGVQcml2YXRlU3BlbmRLZXkocHJpdmF0ZVNwZW5kS2V5KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgYSBwdWJsaWMgc3BlbmQga2V5IGlzIHZhbGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1YmxpY1NwZW5kS2V5IGlzIHRoZSBwdWJsaWMgc3BlbmQga2V5IHRvIHZhbGlkYXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbD59IHRydWUgaWYgdGhlIHB1YmxpYyBzcGVuZCBrZXkgaXMgdmFsaWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlzVmFsaWRQdWJsaWNTcGVuZEtleShwdWJsaWNTcGVuZEtleSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZVB1YmxpY1NwZW5kS2V5KHB1YmxpY1NwZW5kS2V5KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gcHJpdmF0ZSB2aWV3IGtleSwgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHByaXZhdGVWaWV3S2V5IC0gcHJpdmF0ZSB2aWV3IGtleSB0byB2YWxpZGF0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlUHJpdmF0ZVZpZXdLZXkocHJpdmF0ZVZpZXdLZXkpIHtcbiAgICBpZiAoIU1vbmVyb1V0aWxzLmlzSGV4NjQocHJpdmF0ZVZpZXdLZXkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJwcml2YXRlIHZpZXcga2V5IGV4cGVjdGVkIHRvIGJlIDY0IGhleCBjaGFyYWN0ZXJzXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIHB1YmxpYyB2aWV3IGtleSwgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1YmxpY1ZpZXdLZXkgLSBwdWJsaWMgdmlldyBrZXkgdG8gdmFsaWRhdGVcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZVB1YmxpY1ZpZXdLZXkocHVibGljVmlld0tleSkge1xuICAgIGlmICghTW9uZXJvVXRpbHMuaXNIZXg2NChwdWJsaWNWaWV3S2V5KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicHVibGljIHZpZXcga2V5IGV4cGVjdGVkIHRvIGJlIDY0IGhleCBjaGFyYWN0ZXJzXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIHByaXZhdGUgc3BlbmQga2V5LCB0aHJvdyBhbiBlcnJvciBpZiBpbnZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJpdmF0ZVNwZW5kS2V5IC0gcHJpdmF0ZSBzcGVuZCBrZXkgdG8gdmFsaWRhdGVcbiAgICovXG4gIHN0YXRpYyBhc3luYyB2YWxpZGF0ZVByaXZhdGVTcGVuZEtleShwcml2YXRlU3BlbmRLZXkpIHtcbiAgICBpZiAoIU1vbmVyb1V0aWxzLmlzSGV4NjQocHJpdmF0ZVNwZW5kS2V5KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicHJpdmF0ZSBzcGVuZCBrZXkgZXhwZWN0ZWQgdG8gYmUgNjQgaGV4IGNoYXJhY3RlcnNcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gcHVibGljIHNwZW5kIGtleSwgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1YmxpY1NwZW5kS2V5IC0gcHVibGljIHNwZW5kIGtleSB0byB2YWxpZGF0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlUHVibGljU3BlbmRLZXkocHVibGljU3BlbmRLZXkpIHtcbiAgICBpZiAoIU1vbmVyb1V0aWxzLmlzSGV4NjQocHVibGljU3BlbmRLZXkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJwdWJsaWMgc3BlbmQga2V5IGV4cGVjdGVkIHRvIGJlIDY0IGhleCBjaGFyYWN0ZXJzXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGFuIGludGVncmF0ZWQgYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvTmV0d29ya1R5cGV9IG5ldHdvcmtUeXBlIC0gbmV0d29yayB0eXBlIG9mIHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3NcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0YW5kYXJkQWRkcmVzcyAtIGFkZHJlc3MgdG8gZGVyaXZlIHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3MgZnJvbVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3BheW1lbnRJZF0gLSBvcHRpb25hbGx5IHNwZWNpZmllcyB0aGUgaW50ZWdyYXRlZCBhZGRyZXNzJ3MgcGF5bWVudCBpZCAoZGVmYXVsdHMgdG8gcmFuZG9tIHBheW1lbnQgaWQpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+fSB0aGUgaW50ZWdyYXRlZCBhZGRyZXNzXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgZ2V0SW50ZWdyYXRlZEFkZHJlc3MobmV0d29ya1R5cGU6IE1vbmVyb05ldHdvcmtUeXBlLCBzdGFuZGFyZEFkZHJlc3M6IHN0cmluZywgcGF5bWVudElkPzogc3RyaW5nKSB7XG4gICAgaWYgKE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUikgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyhhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJtb25lcm9VdGlsc0dldEludGVncmF0ZWRBZGRyZXNzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICBcbiAgICAvLyB2YWxpZGF0ZSBpbnB1dHNcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShuZXR3b3JrVHlwZSk7XG4gICAgYXNzZXJ0KHR5cGVvZiBzdGFuZGFyZEFkZHJlc3MgPT09IFwic3RyaW5nXCIsIFwiQWRkcmVzcyBpcyBub3Qgc3RyaW5nXCIpO1xuICAgIGFzc2VydChzdGFuZGFyZEFkZHJlc3MubGVuZ3RoID4gMCwgXCJBZGRyZXNzIGlzIGVtcHR5XCIpO1xuICAgIGFzc2VydChHZW5VdGlscy5pc0Jhc2U1OChzdGFuZGFyZEFkZHJlc3MpLCBcIkFkZHJlc3MgaXMgbm90IGJhc2UgNThcIik7XG4gICAgXG4gICAgLy8gbG9hZCBrZXlzIG1vZHVsZSBieSBkZWZhdWx0XG4gICAgaWYgKExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkgPT09IHVuZGVmaW5lZCkgYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRLZXlzTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gZ2V0IGludGVncmF0ZWQgYWRkcmVzcyBpbiBxdWV1ZVxuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICBsZXQgaW50ZWdyYXRlZEFkZHJlc3NKc29uID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5nZXRfaW50ZWdyYXRlZF9hZGRyZXNzX3V0aWwobmV0d29ya1R5cGUsIHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkID8gcGF5bWVudElkIDogXCJcIik7XG4gICAgICBpZiAoaW50ZWdyYXRlZEFkZHJlc3NKc29uLmNoYXJBdCgwKSAhPT0gJ3snKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoaW50ZWdyYXRlZEFkZHJlc3NKc29uKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoSlNPTi5wYXJzZShpbnRlZ3JhdGVkQWRkcmVzc0pzb24pKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERldGVybWluZSBpZiB0aGUgZ2l2ZW4gYWRkcmVzcyBpcyB2YWxpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gYWRkcmVzc1xuICAgKiBAcGFyYW0ge01vbmVyb05ldHdvcmtUeXBlfSBuZXR3b3JrVHlwZSAtIG5ldHdvcmsgdHlwZSBvZiB0aGUgYWRkcmVzcyB0byB2YWxpZGF0ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSBhZGRyZXNzIGlzIHZhbGlkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpc1ZhbGlkQWRkcmVzcyhhZGRyZXNzLCBuZXR3b3JrVHlwZSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBNb25lcm9VdGlscy52YWxpZGF0ZUFkZHJlc3MoYWRkcmVzcywgbmV0d29ya1R5cGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogVmFsaWRhdGUgdGhlIGdpdmVuIGFkZHJlc3MsIHRocm93IGFuIGVycm9yIGlmIGludmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gYWRkcmVzcyB0byB2YWxpZGF0ZVxuICAgKiBAcGFyYW0ge01vbmVyb05ldHdvcmtUeXBlfSBuZXR3b3JrVHlwZSAtIG5ldHdvcmsgdHlwZSBvZiB0aGUgYWRkcmVzcyB0byB2YWxpZGF0ZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlQWRkcmVzcyhhZGRyZXNzLCBuZXR3b3JrVHlwZSkge1xuICAgIGlmIChNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIpIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJtb25lcm9VdGlsc1ZhbGlkYXRlQWRkcmVzc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGlucHV0c1xuICAgIGFzc2VydCh0eXBlb2YgYWRkcmVzcyA9PT0gXCJzdHJpbmdcIiwgXCJBZGRyZXNzIGlzIG5vdCBzdHJpbmdcIik7XG4gICAgYXNzZXJ0KGFkZHJlc3MubGVuZ3RoID4gMCwgXCJBZGRyZXNzIGlzIGVtcHR5XCIpO1xuICAgIGFzc2VydChHZW5VdGlscy5pc0Jhc2U1OChhZGRyZXNzKSwgXCJBZGRyZXNzIGlzIG5vdCBiYXNlIDU4XCIpO1xuICAgIG5ldHdvcmtUeXBlID0gTW9uZXJvTmV0d29ya1R5cGUuZnJvbShuZXR3b3JrVHlwZSk7XG4gICAgXG4gICAgLy8gbG9hZCBrZXlzIG1vZHVsZSBieSBkZWZhdWx0XG4gICAgaWYgKExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkgPT09IHVuZGVmaW5lZCkgYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRLZXlzTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYWRkcmVzcyBpbiBxdWV1ZVxuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLnF1ZXVlVGFzayhhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIGxldCBlcnJNc2cgPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLnZhbGlkYXRlX2FkZHJlc3MoYWRkcmVzcywgbmV0d29ya1R5cGUpO1xuICAgICAgaWYgKGVyck1zZykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyck1zZyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgaWYgdGhlIGdpdmVuIHBheW1lbnQgaWQgaXMgdmFsaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF5bWVudElkIC0gcGF5bWVudCBpZCB0byBkZXRlcm1pbmUgaWYgdmFsaWRcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sPn0gdHJ1ZSBpZiB0aGUgcGF5bWVudCBpZCBpcyB2YWxpZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaXNWYWxpZFBheW1lbnRJZChwYXltZW50SWQpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgTW9uZXJvVXRpbHMudmFsaWRhdGVQYXltZW50SWQocGF5bWVudElkKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGUgZ2l2ZW4gcGF5bWVudCBpZCwgdGhyb3cgYW4gZXJyb3IgaWYgaW52YWxpZC5cbiAgICogXG4gICAqIFRPRE86IGltcHJvdmUgdmFsaWRhdGlvblxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBheW1lbnRJZCAtIHBheW1lbnQgaWQgdG8gdmFsaWRhdGUgXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVQYXltZW50SWQocGF5bWVudElkKSB7XG4gICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiBwYXltZW50SWQsIFwic3RyaW5nXCIpO1xuICAgIGFzc2VydChwYXltZW50SWQubGVuZ3RoID09PSAxNiB8fCBwYXltZW50SWQubGVuZ3RoID09PSA2NCk7XG4gIH1cbiAgICBcbiAgLyoqXG4gICAqIERlY29kZSB0eCBleHRyYSBhY2NvcmRpbmcgdG8gaHR0cHM6Ly9jcnlwdG9ub3RlLm9yZy9jbnMvY25zMDA1LnR4dCBhbmRcbiAgICogcmV0dXJucyB0aGUgbGFzdCB0eCBwdWIga2V5LlxuICAgKiBcbiAgICogVE9ETzogdXNlIGMrKyBicmlkZ2UgZm9yIHRoaXNcbiAgICogXG4gICAqIEBwYXJhbSBbYnl0ZVtdXSB0eEV4dHJhIC0gYXJyYXkgb2YgdHggZXh0cmEgYnl0ZXNcbiAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgbGFzdCBwdWIga2V5IGFzIGEgaGV4aWRlY2ltYWwgc3RyaW5nXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgZ2V0TGFzdFR4UHViS2V5KHR4RXh0cmEpIHtcbiAgICBsZXQgbGFzdFB1YktleUlkeDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHR4RXh0cmEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCB0YWcgPSB0eEV4dHJhW2ldO1xuICAgICAgaWYgKHRhZyA9PT0gMCB8fCB0YWcgPT09IDIpIHtcbiAgICAgICAgaSArPSAxICsgdHhFeHRyYVtpICsgMV07ICAvLyBhZHZhbmNlIHRvIG5leHQgdGFnXG4gICAgICB9IGVsc2UgaWYgKHRhZyA9PT0gMSkge1xuICAgICAgICBsYXN0UHViS2V5SWR4ID0gaSArIDE7XG4gICAgICAgIGkgKz0gMSArIDMyOyAgICAgICAgICAgICAgLy8gYWR2YW5jZSB0byBuZXh0IHRhZ1xuICAgICAgfSBlbHNlIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgc3ViLWZpZWxkIHRhZzogXCIgKyB0YWcpO1xuICAgIH1cbiAgICByZXR1cm4gQnVmZmVyLmZyb20obmV3IFVpbnQ4QXJyYXkodHhFeHRyYS5zbGljZShsYXN0UHViS2V5SWR4LCBsYXN0UHViS2V5SWR4ICsgMzIpKSkudG9TdHJpbmcoXCJoZXhcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHR3byBwYXltZW50IGlkcyBhcmUgZnVuY3Rpb25hbGx5IGVxdWFsLlxuICAgKiBcbiAgICogRm9yIGV4YW1wbGUsIDAzMjg0ZTQxYzM0MmYwMzIgYW5kIDAzMjg0ZTQxYzM0MmYwMzIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAgYXJlIGNvbnNpZGVyZWQgZXF1YWwuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF5bWVudElkMSBpcyBhIHBheW1lbnQgaWQgdG8gY29tcGFyZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF5bWVudElkMiBpcyBhIHBheW1lbnQgaWQgdG8gY29tcGFyZVxuICAgKiBAcmV0dXJuIHtib29sfSB0cnVlIGlmIHRoZSBwYXltZW50IGlkcyBhcmUgZXF1YWwsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIHBheW1lbnRJZHNFcXVhbChwYXltZW50SWQxLCBwYXltZW50SWQyKSB7XG4gICAgbGV0IG1heExlbmd0aCA9IE1hdGgubWF4KHBheW1lbnRJZDEubGVuZ3RoLCBwYXltZW50SWQyLmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXhMZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGkgPCBwYXltZW50SWQxLmxlbmd0aCAmJiBpIDwgcGF5bWVudElkMi5sZW5ndGggJiYgcGF5bWVudElkMVtpXSAhPT0gcGF5bWVudElkMltpXSkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKGkgPj0gcGF5bWVudElkMS5sZW5ndGggJiYgcGF5bWVudElkMltpXSAhPT0gJzAnKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoaSA+PSBwYXltZW50SWQyLmxlbmd0aCAmJiBwYXltZW50SWQxW2ldICE9PSAnMCcpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNZXJnZXMgYSB0cmFuc2FjdGlvbiBpbnRvIGEgbGlzdCBvZiBleGlzdGluZyB0cmFuc2FjdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4W119IHR4cyAtIGV4aXN0aW5nIHRyYW5zYWN0aW9ucyB0byBtZXJnZSBpbnRvXG4gICAqIEBwYXJhbSB7TW9uZXJvVHh9IHR4IC0gdHJhbnNhY3Rpb24gdG8gbWVyZ2UgaW50byB0aGUgbGlzdFxuICAgKi9cbiAgc3RhdGljIG1lcmdlVHgodHhzLCB0eCkge1xuICAgIGZvciAobGV0IGFUeCBvZiB0eHMpIHtcbiAgICAgIGlmIChhVHguZ2V0SGFzaCgpID09PSB0eC5nZXRIYXNoKCkpIHtcbiAgICAgICAgYVR4Lm1lcmdlKHR4KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB0eHMucHVzaCh0eCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0IHRoZSBnaXZlbiBKU09OIHRvIGEgYmluYXJ5IFVpbnQ4QXJyYXkgdXNpbmcgTW9uZXJvJ3MgcG9ydGFibGUgc3RvcmFnZSBmb3JtYXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge29iamVjdH0ganNvbiAtIGpzb24gdG8gY29udmVydCB0byBiaW5hcnlcbiAgICogQHJldHVybiB7UHJvbWlzZTxVaW50OEFycmF5Pn0gdGhlIGpzb24gY29udmVydGVkIHRvIHBvcnRhYmxlIHN0b3JhZ2UgYmluYXJ5XG4gICAqL1xuICBzdGF0aWMgYXN5bmMganNvblRvQmluYXJ5KGpzb24pIHtcbiAgICBpZiAoTW9uZXJvVXRpbHMuUFJPWFlfVE9fV09SS0VSKSByZXR1cm4gTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih1bmRlZmluZWQsIFwibW9uZXJvVXRpbHNKc29uVG9CaW5hcnlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICBcbiAgICAvLyBsb2FkIGtleXMgbW9kdWxlIGJ5IGRlZmF1bHRcbiAgICBpZiAoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSA9PT0gdW5kZWZpbmVkKSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEtleXNNb2R1bGUoKTtcbiAgICBcbiAgICAvLyB1c2Ugd2FzbSBpbiBxdWV1ZVxuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLnF1ZXVlVGFzayhhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIFxuICAgICAgLy8gc2VyaWFsaXplIGpzb24gdG8gYmluYXJ5IHdoaWNoIGlzIHN0b3JlZCBpbiBjKysgaGVhcFxuICAgICAgbGV0IGJpbk1lbUluZm9TdHIgPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLm1hbGxvY19iaW5hcnlfZnJvbV9qc29uKEpTT04uc3RyaW5naWZ5KGpzb24pKTtcbiAgICAgIFxuICAgICAgLy8gc2FuaXRpemUgYmluYXJ5IG1lbW9yeSBhZGRyZXNzIGluZm9cbiAgICAgIGxldCBiaW5NZW1JbmZvID0gSlNPTi5wYXJzZShiaW5NZW1JbmZvU3RyKTtcbiAgICAgIGJpbk1lbUluZm8ucHRyID0gcGFyc2VJbnQoYmluTWVtSW5mby5wdHIpO1xuICAgICAgYmluTWVtSW5mby5sZW5ndGggPSBwYXJzZUludChiaW5NZW1JbmZvLmxlbmd0aCk7XG4gICAgICBcbiAgICAgIC8vIHJlYWQgYmluYXJ5IGRhdGEgZnJvbSBoZWFwIHRvIFVpbnQ4QXJyYXlcbiAgICAgIGxldCB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYmluTWVtSW5mby5sZW5ndGgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5NZW1JbmZvLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZpZXdbaV0gPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLkhFQVBVOFtiaW5NZW1JbmZvLnB0ciAvIFVpbnQ4QXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKyBpXTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gZnJlZSBiaW5hcnkgb24gaGVhcFxuICAgICAgTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fZnJlZShiaW5NZW1JbmZvLnB0cik7XG4gICAgICBcbiAgICAgIC8vIHJldHVybiBqc29uIGZyb20gYmluYXJ5IGRhdGFcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydCB0aGUgZ2l2ZW4gcG9ydGFibGUgc3RvcmFnZSBiaW5hcnkgdG8gSlNPTi5cbiAgICogXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhhcnIgLSBiaW5hcnkgZGF0YSBpbiBNb25lcm8ncyBwb3J0YWJsZSBzdG9yYWdlIGZvcm1hdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG9iamVjdD59IEpTT04gb2JqZWN0IGNvbnZlcnRlZCBmcm9tIHRoZSBiaW5hcnkgZGF0YVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGJpbmFyeVRvSnNvbih1aW50OGFycikge1xuICAgIGlmIChNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIpIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJtb25lcm9VdGlsc0JpbmFyeVRvSnNvblwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIFxuICAgIC8vIGxvYWQga2V5cyBtb2R1bGUgYnkgZGVmYXVsdFxuICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpID09PSB1bmRlZmluZWQpIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkS2V5c01vZHVsZSgpO1xuICAgIFxuICAgIC8vIHVzZSB3YXNtIGluIHF1ZXVlXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgXG4gICAgICAvLyBhbGxvY2F0ZSBzcGFjZSBpbiBjKysgaGVhcCBmb3IgYmluYXJ5XG4gICAgICBsZXQgcHRyID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fbWFsbG9jKHVpbnQ4YXJyLmxlbmd0aCAqIHVpbnQ4YXJyLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIGxldCBoZWFwID0gbmV3IFVpbnQ4QXJyYXkoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQVTguYnVmZmVyLCBwdHIsIHVpbnQ4YXJyLmxlbmd0aCAqIHVpbnQ4YXJyLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIGlmIChwdHIgIT09IGhlYXAuYnl0ZU9mZnNldCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTWVtb3J5IHB0ciAhPT0gaGVhcC5ieXRlT2Zmc2V0XCIpOyAvLyBzaG91bGQgYmUgZXF1YWxcbiAgICAgIFxuICAgICAgLy8gd3JpdGUgYmluYXJ5IHRvIGhlYXBcbiAgICAgIGhlYXAuc2V0KG5ldyBVaW50OEFycmF5KHVpbnQ4YXJyLmJ1ZmZlcikpO1xuICAgICAgXG4gICAgICAvLyBjcmVhdGUgb2JqZWN0IHdpdGggYmluYXJ5IG1lbW9yeSBhZGRyZXNzIGluZm9cbiAgICAgIGxldCBiaW5NZW1JbmZvID0geyBwdHI6IHB0ciwgbGVuZ3RoOiB1aW50OGFyci5sZW5ndGggfTtcbiAgICAgIFxuICAgICAgLy8gY29udmVydCBiaW5hcnkgdG8ganNvbiBzdHJcbiAgICAgIGNvbnN0IHJldF9zdHJpbmcgPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLmJpbmFyeV90b19qc29uKEpTT04uc3RyaW5naWZ5KGJpbk1lbUluZm8pKTtcbiAgICAgIFxuICAgICAgLy8gZnJlZSBiaW5hcnkgb24gaGVhcFxuICAgICAgTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fZnJlZShwdHIpO1xuICAgICAgXG4gICAgICAvLyBwYXJzZSBhbmQgcmV0dXJuIGpzb25cbiAgICAgIHJldHVybiBKU09OLnBhcnNlKHJldF9zdHJpbmcpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydCB0aGUgYmluYXJ5IHJlc3BvbnNlIGZyb20gZGFlbW9uIFJQQyBibG9jayByZXRyaWV2YWwgdG8gSlNPTi5cbiAgICogXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gdWludDhhcnIgLSBiaW5hcnkgcmVzcG9uc2UgZnJvbSBkYWVtb24gUlBDIHdoZW4gZ2V0dGluZyBibG9ja3NcbiAgICogQHJldHVybiB7UHJvbWlzZTxvYmplY3Q+fSBKU09OIG9iamVjdCB3aXRoIHRoZSBibG9ja3MgZGF0YVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGJpbmFyeUJsb2Nrc1RvSnNvbih1aW50OGFycikge1xuICAgIGlmIChNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIpIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJtb25lcm9VdGlsc0JpbmFyeUJsb2Nrc1RvSnNvblwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIFxuICAgIC8vIGxvYWQga2V5cyBtb2R1bGUgYnkgZGVmYXVsdFxuICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpID09PSB1bmRlZmluZWQpIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkS2V5c01vZHVsZSgpO1xuICAgIFxuICAgIC8vIHVzZSB3YXNtIGluIHF1ZXVlXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkucXVldWVUYXNrKGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgXG4gICAgICAvLyBhbGxvY2F0ZSBzcGFjZSBpbiBjKysgaGVhcCBmb3IgYmluYXJ5XG4gICAgICBsZXQgcHRyID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fbWFsbG9jKHVpbnQ4YXJyLmxlbmd0aCAqIHVpbnQ4YXJyLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIGxldCBoZWFwID0gbmV3IFVpbnQ4QXJyYXkoTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQVTguYnVmZmVyLCBwdHIsIHVpbnQ4YXJyLmxlbmd0aCAqIHVpbnQ4YXJyLkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIGlmIChwdHIgIT09IGhlYXAuYnl0ZU9mZnNldCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTWVtb3J5IHB0ciAhPT0gaGVhcC5ieXRlT2Zmc2V0XCIpOyAvLyBzaG91bGQgYmUgZXF1YWxcbiAgICAgIFxuICAgICAgLy8gd3JpdGUgYmluYXJ5IHRvIGhlYXBcbiAgICAgIGhlYXAuc2V0KG5ldyBVaW50OEFycmF5KHVpbnQ4YXJyLmJ1ZmZlcikpO1xuICAgICAgXG4gICAgICAvLyBjcmVhdGUgb2JqZWN0IHdpdGggYmluYXJ5IG1lbW9yeSBhZGRyZXNzIGluZm9cbiAgICAgIGxldCBiaW5NZW1JbmZvID0geyBwdHI6IHB0ciwgbGVuZ3RoOiB1aW50OGFyci5sZW5ndGggIH1cblxuICAgICAgLy8gY29udmVydCBiaW5hcnkgdG8ganNvbiBzdHJcbiAgICAgIGNvbnN0IGpzb25fc3RyID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5iaW5hcnlfYmxvY2tzX3RvX2pzb24oSlNPTi5zdHJpbmdpZnkoYmluTWVtSW5mbykpO1xuICAgICAgXG4gICAgICAvLyBmcmVlIG1lbW9yeVxuICAgICAgTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5fZnJlZShwdHIpO1xuICAgICAgXG4gICAgICAvLyBwYXJzZSByZXN1bHQgdG8ganNvblxuICAgICAgbGV0IGpzb24gPSBKU09OLnBhcnNlKGpzb25fc3RyKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJzaW5nIGpzb24gZ2l2ZXMgYXJyYXlzIG9mIGJsb2NrIGFuZCB0eCBzdHJpbmdzXG4gICAgICBqc29uLmJsb2NrcyA9IGpzb24uYmxvY2tzLm1hcChibG9ja1N0ciA9PiBKU09OLnBhcnNlKGJsb2NrU3RyKSk7ICAgICAgICAgIC8vIHJlcGxhY2UgYmxvY2sgc3RyaW5ncyB3aXRoIHBhcnNlZCBibG9ja3NcbiAgICAgIGpzb24udHhzID0ganNvbi50eHMubWFwKHR4cyA9PiB0eHMgPyB0eHMubWFwKHR4ID0+IEpTT04ucGFyc2UodHgucmVwbGFjZShcIixcIiwgXCJ7XCIpICsgXCJ9XCIpKSA6IFtdKTsgLy8gbW9kaWZ5IHR4IHN0cmluZyB0byBwcm9wZXIganNvbiBhbmQgcGFyc2UgLy8gVE9ETzogbW9yZSBlZmZpY2llbnQgd2F5IHRoYW4gdGhpcyBqc29uIG1hbmlwdWxhdGlvbj9cbiAgICAgIHJldHVybiBqc29uO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29udmVydCBYTVIgdG8gYXRvbWljIHVuaXRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXIgfCBzdHJpbmd9IGFtb3VudFhtciAtIGFtb3VudCBpbiBYTVIgdG8gY29udmVydCB0byBhdG9taWMgdW5pdHNcbiAgICogQHJldHVybiB7YmlnaW50fSBhbW91bnQgaW4gYXRvbWljIHVuaXRzXG4gICAqL1xuICBzdGF0aWMgeG1yVG9BdG9taWNVbml0cyhhbW91bnRYbXI6IG51bWJlciB8IHN0cmluZyk6IGJpZ2ludCB7XG4gICAgaWYgKHR5cGVvZiBhbW91bnRYbXIgPT09IFwibnVtYmVyXCIpIGFtb3VudFhtciA9IFwiXCIgKyBhbW91bnRYbXI7XG4gICAgbGV0IGRlY2ltYWxEaXZpc29yID0gMTtcbiAgICBsZXQgZGVjaW1hbElkeCA9IGFtb3VudFhtci5pbmRleE9mKCcuJyk7XG4gICAgaWYgKGRlY2ltYWxJZHggPiAtMSkge1xuICAgICAgZGVjaW1hbERpdmlzb3IgPSBNYXRoLnBvdygxMCwgYW1vdW50WG1yLmxlbmd0aCAtIGRlY2ltYWxJZHggLSAxKTtcbiAgICAgIGFtb3VudFhtciA9IGFtb3VudFhtci5zbGljZSgwLCBkZWNpbWFsSWR4KSArIGFtb3VudFhtci5zbGljZShkZWNpbWFsSWR4ICsgMSk7XG4gICAgfVxuICAgIHJldHVybiBCaWdJbnQoYW1vdW50WG1yKSAqIEJpZ0ludChNb25lcm9VdGlscy5BVV9QRVJfWE1SKSAvIEJpZ0ludChkZWNpbWFsRGl2aXNvcik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb252ZXJ0IGF0b21pYyB1bml0cyB0byBYTVIuXG4gICAqIFxuICAgKiBAcGFyYW0ge2JpZ2ludCB8IHN0cmluZ30gYW1vdW50QXRvbWljVW5pdHMgLSBhbW91bnQgaW4gYXRvbWljIHVuaXRzIHRvIGNvbnZlcnQgdG8gWE1SXG4gICAqIEByZXR1cm4ge251bWJlcn0gYW1vdW50IGluIFhNUiBcbiAgICovXG4gIHN0YXRpYyBhdG9taWNVbml0c1RvWG1yKGFtb3VudEF0b21pY1VuaXRzOiBiaWdpbnQgfCBzdHJpbmcpIHtcbiAgICBpZiAodHlwZW9mIGFtb3VudEF0b21pY1VuaXRzID09PSBcInN0cmluZ1wiKSBhbW91bnRBdG9taWNVbml0cyA9IEJpZ0ludChhbW91bnRBdG9taWNVbml0cyk7XG4gICAgZWxzZSBpZiAodHlwZW9mIGFtb3VudEF0b21pY1VuaXRzICE9PSBcImJpZ2ludFwiKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHByb3ZpZGUgYXRvbWljIHVuaXRzIGFzIGJpZ2ludCBvciBzdHJpbmcgdG8gY29udmVydCB0byBYTVJcIik7XG4gICAgY29uc3QgcXVvdGllbnQ6IGJpZ2ludCA9IGFtb3VudEF0b21pY1VuaXRzIC8gTW9uZXJvVXRpbHMuQVVfUEVSX1hNUjtcbiAgICBjb25zdCByZW1haW5kZXI6IGJpZ2ludCA9IGFtb3VudEF0b21pY1VuaXRzICUgTW9uZXJvVXRpbHMuQVVfUEVSX1hNUjtcbiAgICByZXR1cm4gTnVtYmVyKHF1b3RpZW50KSArIE51bWJlcihyZW1haW5kZXIpIC8gTnVtYmVyKE1vbmVyb1V0aWxzLkFVX1BFUl9YTVIpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGlzSGV4NjQoc3RyKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzdHIgPT09IFwic3RyaW5nXCIgJiYgc3RyLmxlbmd0aCA9PT0gNjQgJiYgR2VuVXRpbHMuaXNIZXgoc3RyKTtcbiAgfVxufVxuXG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxhQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxZQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSx3QkFBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssa0JBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ2UsTUFBTU0sV0FBVyxDQUFDOztFQUUv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