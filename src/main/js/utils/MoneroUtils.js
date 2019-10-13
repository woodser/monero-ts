const assert = require("assert");
const GenUtils = require("./GenUtils");
const BigInteger = require("../../../../external/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;

/**
 * Collection of Monero utilities.
 */
class MoneroUtils {
  
  /**
   * Get Monero Core utils for client-side crypto and binary requests.
   */
  static async getMyMoneroUtils() {
    if (MoneroUtils.MyMoneroUtils === undefined) MoneroUtils.MyMoneroUtils = await require('../../../../external/mymonero-core-js/monero_utils/MyMoneroCoreBridge')();
    return MoneroUtils.MyMoneroUtils;
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
  
  /**
   * Merges a transaction into a list of existing transactions.
   * 
   * @param txs are existing transactions to merge into
   * @param tx is the transaction to merge into the list
   */
  static mergeTx(txs, tx) {
    for (let aTx of txs) {
      if (aTx.getId() === tx.getId()) {
        aTx.merge(tx);
        return;
      }
    }
    txs.push(tx);
  }
}

MoneroUtils.NUM_MNEMONIC_WORDS = 25;

MoneroUtils.WALLET_REFRESH_RATE = 10000;  // 10 seconds

module.exports = MoneroUtils;