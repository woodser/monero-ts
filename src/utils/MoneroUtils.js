const assert = require("assert");
const GenUtils = require("./GenUtils");
const BigInteger = require("../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;

/**
 * Collection of Monero utilitlies.
 */
class MoneroUtils {
  
  /**
   * Get Monero Core utils for client-side crypto and binary requests.
   */
  static async getCoreUtils() {
    if (MoneroUtils.coreUtils === undefined) MoneroUtils.coreUtils = await require('../submodules/mymonero-core-js/monero_utils/MyMoneroCoreBridge')();
    return MoneroUtils.coreUtils;
  }
  
  /**
   * Sets the given value ensuring a previous value is not overwritten.
   * 
   * TODO: remove for portability because function passing not supported in other languages, use reconcile only
   * 
   * @param obj is the object to invoke the getter and setter on
   * @param getFn gets the current value
   * @param setFn sets the current value
   * @param val is the value to set iff it does not overwrite a previous value
   * @param config specifies reconciliation configuration
   *        config.resolveDefined uses defined value if true or undefined, undefined if false
   *        config.resolveTrue uses true over false if true, false over true if false, must be equal if undefined
   *        config.resolveMax uses max over min if true, min over max if false, must be equal if undefined
   * @param errMsg is the error message to throw if the values cannot be reconciled (optional)
   */
  static safeSet(obj, getFn, setFn, val, config, errMsg) {
    let curVal = getFn.call(obj);
    let reconciledVal = MoneroUtils.reconcile(curVal, val, config, errMsg);
    if (curVal !== reconciledVal) setFn.call(obj, reconciledVal);
  }
  
  /**
   * Reconciles two values.
   * 
   * TODO: remove custom error message
   * 
   * @param val1 is a value to reconcile
   * @param val2 is a value to reconcile
   * @param config specifies reconciliation configuration
   *        config.resolveDefined uses defined value if true or undefined, undefined if false
   *        config.resolveTrue uses true over false if true, false over true if false, must be equal if undefined
   *        config.resolveMax uses max over min if true, min over max if false, must be equal if undefined
   * @param errMsg is the error message to throw if the values cannot be reconciled (optional)
   * @returns the reconciled value if reconcilable
   * @throws {Error} if the values cannot be reconciled
   */
  static reconcile(val1, val2, config, errMsg) {
    
    // check for equality
    if (val1 === val2) return val1;
    
    // check for BigInteger equality
    let comparison; // save comparison for later if applicable
    if (val1 instanceof BigInteger && val2 instanceof BigInteger) {
      comparison = val1.compare(val2);  
      if (comparison === 0) return val1;
    }
    
    // resolve one value defined
    if (val1 === undefined || val2 === undefined) {
      if (config && config.resolveDefined === false) return undefined;  // use undefined
      else return val1 === undefined ? val2 : val1;  // use defined value
    }
    
    // resolve different booleans
    if (config && config.resolveTrue !== undefined && typeof val1 === "boolean" && typeof val2 === "boolean") {
      assert.equal(typeof config.resolveTrue, "boolean");
      return config.resolveTrue;
    }
    
    // resolve different numbers
    if (config && config.resolveMax !== undefined) {
      assert.equal(typeof config.resolveMax, "boolean");
      
      // resolve js numbers
      if (typeof val1 === "number" && typeof val2 === "number") {
        return config.resolveMax ? Math.max(val1, val2) : Math.min(val1, val2);
      }
      
      // resolve BigIntegers
      if (val1 instanceof BigInteger && val2 instanceof BigInteger) {
        return config.resolveMax ? (comparison < 0 ? val2 : val1) : (comparison < 0 ? val1 : val2);
      }
    }
    
    // assert deep equality
    assert.deepEqual(val1, val2, errMsg ? errMsg : "Cannot reconcile values " + val1 + " and " + val2 + " with config: " + JSON.stringify(config));
    return val1;
  }
  
  // TODO: beef this up
  static validateSeed(seed) {
    assert(typeof seed === "string");
    assert(seed.length === 64);
  }
  
  // TODO: beef this up
  static validateMnemonic(mnemonic) {
    assert(mnemonic, "Mnemonic phrase is not initialized");
    let words = mnemonic.split(" ");
    if (words.length !== MoneroUtils.NUM_MNEMONIC_WORDS) throw new Error("Mnemonic phrase is " + words.length + " words but must be " + MoneroUtils.NUM_MNEMONIC_WORDS);
  }
  
  // TODO: beef this up
  static validatePrivateViewKey(privateViewKey) {
    assert(typeof privateViewKey === "string");
    assert(privateViewKey.length === 64);
  }
  
  // TODO: beef this up
  static validatePrivateSpendKey(privateSpendKey) {
    assert(typeof privateSpendKey === "string");
    assert(privateSpendKey.length === 64);
  }
  
  // TODO: beef this up, will require knowing network type
  static validateAddress(address) {
    assert(address);
    assert(address.length > 0);
  }
  
  static isValidPaymentId(paymentId) {
    try {
      MoneroUtils.validatePaymentId(paymentId);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  
  // TODO: beef this up
  static validatePaymentId(paymentId) {
    assert.equal(typeof paymentId, "string");
    assert(paymentId.length === 16 || paymentId.length === 64);
  }
    
  /**
   * Decodes tx extra according to https://cryptonote.org/cns/cns005.txt and
   * returns the last tx pub key.
   * 
   * TODO: use c++ bridge for this
   * 
   * @param txExtra is an array of tx extra bytes
   * @return the last pub key as a hexidecimal string
   */
  static getLastTxPubKey(txExtra) {
    let lastPubKeyIdx;
    for (let i = 0; i < txExtra.length; i++) {
      let tag = txExtra[i];
      if (tag === 0 || tag === 2) {
        i += 1 + txExtra[i + 1];  // advance to next tag
      } else if (tag === 1) {
        lastPubKeyIdx = i + 1;
        i += 1 + 32;              // advance to next tag
      } else throw new Error("Invalid sub-field tag: " + tag);
    }
    return Buffer.from(new Uint8Array(txExtra.slice(lastPubKeyIdx, lastPubKeyIdx + 32))).toString("hex");
  }
  
  /**
   * Returns a human-friendly key value line.
   * 
   * @param key is the key
   * @param value is the value
   * @param indent indents the line
   * @param newline specifies if the string should be terminated with a newline or not
   * @param ignoreUndefined specifies if undefined values should return an empty string
   * @returns {string} is the human-friendly key value line
   */
  static kvLine(key, value, indent = 0, newline = true, ignoreUndefined = true) {
    if (value === undefined && ignoreUndefined) return "";
    return GenUtils.getIndent(indent) + key + ": " + value + (newline ? '\n' : "");
  }
  
  /**
   * Determines if two payment ids are functionally equal.
   * 
   * For example, 03284e41c342f032 and 03284e41c342f032000000000000000000000000000000000000000000000000 are considered equal.
   * 
   * @param paymentId1 is a payment id to compare
   * @param paymentId2 is a payment id to compare
   * @return true if the payment ids are equal, false otherwise
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
}

MoneroUtils.NUM_MNEMONIC_WORDS = 25;

module.exports = MoneroUtils;