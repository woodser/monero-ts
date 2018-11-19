const assert = require("assert");
const MoneroTx = require("../daemon/model/MoneroTx");

/**
 * Collection of Monero utilitlies.
 */
class MoneroUtils {
  
  /**
   * Get Monero Core utils for client-side wallet crypto and making binary requests.
   */
  static async getCoreUtils() {
    
    // cache and return core utils
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
   */
  static safeSet(obj, getFn, setFn, val) {
    if (val === undefined) return;
    let curVal = getFn.call(obj);
    if (curVal === undefined) setFn.call(obj, val);
    else if (curVal !== val) throw new Error("Cannot overwrite existing value " + curVal + " with new value " + val);
  }
  
  /**
   * Validates the given mnemonic phrase.
   */
  static validateMnemonic(mnemonic) {
    throw new Error("Not implemented");
  }
  
  /**
   * Validates the given seed.
   */
  static validateSeed(seed) {
    assert(typeof seed === "string");
    assert(seed.length === 64);
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

module.exports = MoneroUtils;