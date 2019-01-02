const assert = require("assert");
const BigInteger = require("../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;

/**
 * Collection of Monero utilitlies.
 */
class MoneroUtils {
  
  /**
   * Get Monero Core utils for client-side crypto and binary requests.
   */
  static async getCoreUtils() {
    if (MoneroUtils.coreUtils === undefined) MoneroUtils.coreUtils = await require('../submodules/mymonero-core-js/monero_utils/monero_utils')();
    return MoneroUtils.coreUtils;
  }
  
  /**
   * Sets the given value ensuring a previous value is not overwritten.
   * 
   * @param obj is the object to invoke the getter and setter on
   * @param getFn gets the current value
   * @param setFn sets the current value
   * @param val is the value to set iff it does not overwrite a previous value
   * @param undefinedIsDominant specifies if undefined overwrites existing values (true) or is overwritten (false/default)
   */
  static safeSet(obj, getFn, setFn, val, undefinedIsDominant) {
    if (val === undefined) {
      if (undefinedIsDominant) {
        setFn.call(obj, undefined);
      }
    } else {
      let curVal = getFn.call(obj);
      if (curVal === undefined) setFn.call(obj, val);
      else {
        if (curVal instanceof BigInteger && val instanceof BigInteger && curVal.compare(val) === 0) { } // check for equality of BigIntegers
        else if (curVal !== val) throw new Error("Cannot overwrite existing value " + curVal + " with new value " + val);
      }
    }
  }
  
  /**
   * Reconciles two values.
   * 
   * @param val1 is a value to reconcile
   * @param val2 is a value to reconcile
   * @param config specifies reconciliation configuration
   *        config.resolveDefined uses defined value if true or undefined, undefined if false
   *        config.resolveTrue uses true over false if true, false over true if false, must be equal if undefined
   *        config.resolveMax uses max over min if true, min over max if false, must be equal if undefined
   * @returns the reconciled value if reconcilable
   * @throws {Error} if the values cannot be reconciled
   */
  static reconcile(val1, val2, config) {
    
    // check for direct equality
    if (val1 === val2) return val1;
    
    // check for BigInteger equality
    let comparison; // save comparison for later if applicable
    if (val1 instanceof BigInteger && val2 instanceof BigInteger) {
      comparison = val1.compare(val2);  
      if (comparison === 0) return val1;
    }
    
    // resolve one value undefined
    if (val1 === undefined || val2 === undefined) {
      if (config && config.resolveDefined === false) return undefined;  // use undefined
      else return val1 === undefined ? val2 : val1;  // use defined value
    }
    
    // resolve different booleans
    if (config && config.resolveTrue !== undefined && typeof val1 === "boolean" && typeof val2 === "boolean") {
      assert.equal("boolean", typeof config.resolveTrue);
      return config.resolveTrue;
    }
    
    // resolve different numbers
    if (config && config.resolveMax !== undefined) {
      assert.equal("boolean", typeof config.resolveMax);
      
      // resolve js numbers
      if (typeof val1 === "number" && typeof val2 === "number") {
        return config.resolveMax ? Math.max(val1, val2) : Math.min(val1, val2);
      }
      
      // resolve BigIntegers
      if (val1 instanceof BigInteger && val2 instanceof BigInteger) {
        return config.resolveMax ? (comparison < 0 ? val2 : val1) : (comparison < 0 ? val1 : val2);
      }
    }
    
    // otherwise cannot reconcile
    throw new Error("Cannot reconcile values " + val1 + " and " + val2 + " with config " + JSON.stringify(config));
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
  
  // TODO: implement this, will require knowing network type
  static validateAddress(address) {
    
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
    assert.equal("string", typeof paymentId);
    assert(paymentId.length === 16);
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
}

MoneroUtils.NUM_MNEMONIC_WORDS = 25;

module.exports = MoneroUtils;