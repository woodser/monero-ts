const MoneroTx = require("../daemon/model/MoneroTx");

/**
 * Collection of Monero utilitlies.
 */
class MoneroUtils {
  
  /**
   * Builds a MoneroTx from a daemon RPC transaction map.
   * 
   * @param txMap are transaction key/values from the RPC API
   */
  static daemonTxMapToTx(txMap) {
    
    // root level fields
    let tx = new MoneroTx();
    tx.setHex(txMap.as_hex);
    tx.setHeight(txMap.block_height);
    tx.setTimestamp(txMap.block_timestamp);
    tx.setIsDoubleSpend(txMap.double_spend_seen);
    tx.setIsConfirmed(!txMap.in_pool);
    tx.setId(txMap.tx_hash);
    
    // parse from json
    if (txMap.as_json) {
      let json = JSON.parse(txMap.as_json);
      tx.setVersion(json.version);
      tx.setExtra(json.extra);
      tx.setVin(json.vin);
      tx.setVout(json.vout);
      tx.setRctSignatures(json.rct_signatures);
      tx.setRctSigPrunable(json.rctsig_prunable);
    } else {
      tx.setVout([txMap.output_indices.length]);
    }
    
    // assign output indices
    for (let i = 0; i < txMap.output_indices.length; i++) {
      tx.getVout()[i].index = txMap.output_indices[i];
    }
    return tx;
  }
    
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