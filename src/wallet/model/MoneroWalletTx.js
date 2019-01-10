const assert = require("assert");
const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroTx = require("../../daemon/model/MoneroTx");
const MoneroTransfer = require("./MoneroTransfer");

/**
 * Models a Monero transaction with additional fields in the context of a wallet.
 */
class MoneroWalletTx extends MoneroTx {
  
  /**
   * Constructs the model.
   * 
   * @param json is JSON to construct the model (optional)
   */
  constructor(json) {
    super(json);
    
    // deserialize json
    if (json) {
      
      // deserialize transfers
      if (json.outgoingTransfer) this.setOutgoingTransfer(new MoneroTransfer(this, json.outgoingTransfer));
      if (json.incomingTransfers) {
        let incomingTransfers = [];
        for (let jsonIncomingTransfer of json.incomingTransfers) incomingTransfers.push(new MoneroTransfer(this, jsonIncomingTransfer));
        this.setIncomingTransfers(incomingTransfers);
      }
    }
  }
  
  getIsOutgoing() {
    return this.getOutgoingTransfer() !== undefined;
  }
  
  getIsIncoming() {
    return this.getIncomingTransfers() !== undefined;
  }
  
  getOutgoingAmount() {
    return this.getOutgoingTransfer() === undefined ? undefined : this.getOutgoingTransfer().getAmount();
  }
  
  getIncomingAmount() {
    if (this.getIncomingTransfers() === undefined) return undefined;
    let incomingAmt = new BigInteger(0);
    for (let transfer of this.getIncomingTransfers()) incomingAmt = incomingAmt.add(transfer.getAmount());
    return incomingAmt;
  }
  
  getOutgoingTransfer() {
    return this.state.outgoingTransfer;
  }
  
  setOutgoingTransfer(outgoingTransfer) {
    this.state.outgoingTransfer = outgoingTransfer;
  }
  
  getIncomingTransfers() {
    return this.state.incomingTransfers;
  }
  
  setIncomingTransfers(incomingTransfers) {
    this.state.incomingTransfers = incomingTransfers;
  }
  
  getNote() {
    return this.state.note;
  }
  
  setNote(note) {
    this.state.note = note;
  }
  
  copy() {
    return new MoneroWalletTx(this.toJson());
  }
  
  toJson() {
    let json = Object.assign({}, this.state, super.toJson()); // merge json onto native state
    if (this.getOutgoingTransfer()) json.outgoingTransfer = this.getOutgoingTransfer().toJson();
    if (this.getIncomingTransfers()) {
      json.incomingTransfers = [];
      for (let incomingTransfer of this.getIncomingTransfers()) json.incomingTransfers.push(incomingTransfer.toJson());
    }
    return json;
  }
  
  toString(indent = 0, oneLine) {
    let str = "";
    
    // represent tx with one line string
    // TODO: proper csv export
    if (oneLine) {
      str += this.getId() + ", ";
      str += (this.getIsConfirmed() ? this.getBlockTimestamp() : this.getReceivedTime()) + ", ";
      str += this.getIsConfirmed() + ", ";
      str += (this.getOutgoingAmount() ? this.getOutgoingAmount().toString() : "") + ", "
      str += this.getIncomingAmount() ? this.getIncomingAmount().toString() : "";
      return str;
    }
    
    // otherwise stringify all fields
    str += super.toString(indent) + "\n";
    str += MoneroUtils.kvLine("Is outgoing", this.getIsOutgoing(), indent);
    str += MoneroUtils.kvLine("Outgoing amount", this.getOutgoingAmount(), indent);
    if (this.getOutgoingTransfer()) {
      str += MoneroUtils.kvLine("Outgoing transfer", "", indent);
      str += this.getOutgoingTransfer().toString(indent + 1) + "\n";
    }
    str += MoneroUtils.kvLine("Is incoming", this.getIsIncoming(), indent);
    str += MoneroUtils.kvLine("Incoming amount", this.getIncomingAmount(), indent);
    if (this.getIncomingTransfers()) {
      str += MoneroUtils.kvLine("Incoming transfers", "", indent);
      for (let i = 0; i < this.getIncomingTransfers().length; i++) {
        str += MoneroUtils.kvLine(i + 1, "", indent + 1);
        str += this.getIncomingTransfers()[i].toString(indent + 2) + "\n";
      }
    }
    str += MoneroUtils.kvLine("Note: ", this.getNote(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
  
  /**
   * Updates this transaction by merging the latest information from the given
   * transaction.
   * 
   * @param tx is the transaction to update this transaction with
   * @returns {this} for method chaining
   */
  merge(tx) {
    
    // merge base transaction
    super.merge(tx);
    
    // merge wallet extensions
    this.setNote(MoneroUtils.reconcile(this.getNote(), tx.getNote()));
    
    // merge outgoing transfer
    if (this.getOutgoingTransfer() === undefined) this.setOutgoingTransfer(tx.getOutgoingTransfer());
    else if (tx.getOutgoingTransfer()) this.getOutgoingTransfer().merge(tx.getOutgoingTransfer());
    
    // merge incoming transfers
    if (tx.getIncomingTransfers()) {
      if (this.getIncomingTransfers() === undefined) this.setIncomingTransfers([]);
      for (let transfer of tx.getIncomingTransfers()) {
        mergeTransfer(this.getIncomingTransfers(), transfer);
      }
    }
    
    // helper function to merge transfers
    function mergeTransfer(transfers, transfer) {
      for (let aTransfer of transfers) {
        if (aTransfer.getAccountIndex() === transfer.getAccountIndex() && aTransfer.getSubaddressIndex() === transfer.getSubaddressIndex()) {
          aTransfer.merge(transfer);
          return;
        }
      }
      transfers.push(transfer);
    }
    
    return this;  // for chaining
  }
}

module.exports = MoneroWalletTx;