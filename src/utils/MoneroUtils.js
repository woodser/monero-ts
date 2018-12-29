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
   * Initializes the given value ensuring a previous value is not overwritten.
   * 
   * @param obj is the object to invoke the getter and setter on
   * @param getFn gets the current value
   * @param setFn sets the current value
   * @param val is the value to set iff it does not overwrite a previous value
   */
  static safeInit(obj, getFn, setFn, val) {
    if (val === undefined) return;
    let curVal = getFn.call(obj);
    if (curVal === undefined) setFn.call(obj, val);
    else {
      if (curVal instanceof BigInteger && val instanceof BigInteger && curVal.compare(val) === 0) { } // check for equality of BigIntegers
      else if (curVal !== val) throw new Error("Cannot overwrite existing value " + curVal + " with new value " + val);
    }
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