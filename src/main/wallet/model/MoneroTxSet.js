/**
 * Groups transactions who share common hex data which is needed in order to
 * sign and submit the transactions.
 * 
 * For example, multisig transactions created from sendSplit() share a common
 * hex string which is needed in order to sign and submit the multisig
 * transactions.
 */
class MoneroTxSet {
  
  constructor() {
    this.state = {};
  }

  getTxs() {
    return this.state.txs;
  }

  setTxs(txs) {
    this.state.txs = txs;
    return this;
  }
  
  getMultisigTxHex() {
    return this.state.multisigTxHex;
  }
  
  setMultisigTxHex(multisigTxHex) {
    this.state.multisigTxHex = multisigTxHex;
    return this;
  }
  
  getUnsignedTxHex() {
    return this.state.unsignedTxHex;
  }
  
  setUnsignedTxHex(unsignedTxHex) {
    this.state.unsignedTxHex = unsignedTxHex;
    return this;
  }
  
  getSignedTxHex() {
    return this.state.signedTxHex;
  }
  
  setSignedTxHex(signedTxHex) {
    this.state.signedTxHex = signedTxHex;
    return this;
  }
  
  merge(txSet) {
    assert(txSet instanceof MoneroTxSet);
    if (this === txSet) return this;
    
    // merge sets
    this.setMultisigTxHex(MoneroUtils.reconcile(this.getMultisigTxHex(), txSet.getMultisigTxHex()));
    this.setUnsignedTxHex(MoneroUtils.reconcile(this.getUnsignedTxHex(), txSet.getUnsignedTxHex()));
    this.setSignedTxHex(MoneroUtils.reconcile(this.getSignedTxHex(), txSet.getSignedTxHex()));
    
    // merge txs
    if (txSet.getTxs() !== undefined) {
      for (let tx of txSet.getTxs()) {
        tx.setTxSet(this);
        MoneroUtils.mergeTx(this.getTxs(), tx);
      }
    }

    return this;
  }
  
  toString(indent = 0) {
    let str = "";
    str += MoneroUtils.kvLine("Multisig tx hex: ", getMultisigTxHex(), indent);
    str += MoneroUtils.kvLine("Unsigned tx hex: ", getUnsignedTxHex(), indent);
    str += MoneroUtils.kvLine("Signed tx hex: ", getSignedTxHex(), indent);
    if (getTxs() !== undefined) {
      str += MoneroUtils.kvLine("Txs", "", indent);
      for (let tx of getTxs()) {
        str += tx.toString(indent + 1) + "\n";
      }
    }
    return str;
  }
}

module.exports = MoneroTxSet;