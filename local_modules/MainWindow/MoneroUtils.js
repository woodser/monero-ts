/**
 * Collection of Monero utilitlies.
 */
class MoneroUtils {
    
    /**
     * Decodes tx extra according to https://cryptonote.org/cns/cns005.txt and
     * returns the last tx pub key.
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