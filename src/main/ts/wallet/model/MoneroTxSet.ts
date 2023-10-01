import assert from "assert";
import GenUtils from "../../common/GenUtils";
import MoneroTxWallet from "./MoneroTxWallet";
import MoneroUtils from "../../common/MoneroUtils";

/**
 * Groups transactions who share common hex data which is needed in order to
 * sign and submit the transactions.
 * 
 * For example, multisig transactions created from createTxs() share a common
 * hex string which is needed in order to sign and submit the multisig
 * transactions.
 */
export default class MoneroTxSet {

  txs: MoneroTxWallet[];
  multisigTxHex: string;
  unsignedTxHex: string;
  signedTxHex: string;
  
  constructor(txSet?: Partial<MoneroTxSet>) {
    Object.assign(this, txSet);
    
    // copy txs
    if (this.txs) {
      for (let i = 0; i < this.txs.length; i++) {
        this.txs[i] = new MoneroTxWallet(this.txs[i]);
        this.txs[i].setTxSet(this);
      }
    }
  }
  
  toJson() {
    let json = Object.assign({}, this); // copy state
    if (this.getTxs() !== undefined) {
      json.txs = [];
      for (let tx of this.getTxs()) json.txs.push(tx.toJson());
    }
    return json;
  }

  getTxs() {
    return this.txs;
  }

  setTxs(txs) {
    this.txs = txs;
    return this;
  }
  
  getMultisigTxHex() {
    return this.multisigTxHex;
  }
  
  setMultisigTxHex(multisigTxHex) {
    this.multisigTxHex = multisigTxHex;
    return this;
  }
  
  getUnsignedTxHex() {
    return this.unsignedTxHex;
  }
  
  setUnsignedTxHex(unsignedTxHex) {
    this.unsignedTxHex = unsignedTxHex;
    return this;
  }
  
  getSignedTxHex() {
    return this.signedTxHex;
  }
  
  setSignedTxHex(signedTxHex) {
    this.signedTxHex = signedTxHex;
    return this;
  }
  
  merge(txSet) {
    assert(txSet instanceof MoneroTxSet);
    if (this === txSet) return this;
    
    // merge sets
    this.setMultisigTxHex(GenUtils.reconcile(this.getMultisigTxHex(), txSet.getMultisigTxHex()));
    this.setUnsignedTxHex(GenUtils.reconcile(this.getUnsignedTxHex(), txSet.getUnsignedTxHex()));
    this.setSignedTxHex(GenUtils.reconcile(this.getSignedTxHex(), txSet.getSignedTxHex()));
    
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
    str += GenUtils.kvLine("Multisig tx hex: ", this.getMultisigTxHex(), indent);
    str += GenUtils.kvLine("Unsigned tx hex: ", this.getUnsignedTxHex(), indent);
    str += GenUtils.kvLine("Signed tx hex: ", this.getSignedTxHex(), indent);
    if (this.getTxs() !== undefined) {
      str += GenUtils.kvLine("Txs", "", indent);
      for (let tx of this.getTxs()) {
        str += tx.toString(indent + 1) + "\n";
      }
    }
    return str;
  }
}