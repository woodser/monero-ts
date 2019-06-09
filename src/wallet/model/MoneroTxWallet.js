const assert = require("assert");
const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroError = require("../../utils/MoneroError");
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroTx = require("../../daemon/model/MoneroTx");
const MoneroIncomingTransfer = require("./MoneroIncomingTransfer");
const MoneroOutgoingTransfer = require("./MoneroOutgoingTransfer");
const MoneroOutputWallet = require("./MoneroOutputWallet");

/**
 * Models a Monero transaction with wallet extensions.
 */
class MoneroTxWallet extends MoneroTx {
  
  /**
   * Construct the model.
   * 
   * @param {MoneroTxWallet|object} state is existing state to initialize from (optional)
   */
  constructor(state) {
    super(state);
    state = this.state;
    
    // deserialize incoming transfers
    if (state.incomingTransfers) {
      for (let i = 0; i < state.incomingTransfers.length; i++) {
        if (!(state.incomingTransfers[i] instanceof MoneroIncomingTransfer)) {
          state.incomingTransfers[i] = new MoneroIncomingTransfer(Object.assign(state.incomingTransfers[i], {tx: this}));
        }
      }
    }
    
    // deserialize outgoing transfer
    if (state.outgoingTransfer && !(state.outgoingTransfer instanceof MoneroOutgoingTransfer)) {
      this.setOutgoingTransfer(new MoneroOutgoingTransfer(Object.assign(state.outgoingTransfer, {tx: this})));
    }
    
    // deserialize vouts
    if (state.vouts) {
      for (let i = 0; i < state.vouts.length; i++) {
        if (!(state.vouts[i] instanceof MoneroOutputWallet)) {
          state.vouts[i] = new MoneroOutputWallet(Object.assign(state.vouts[i].toJson(), {tx: this}));
        }
      }
    }
  }
  
  getIsOutgoing() {
    return this.getOutgoingTransfer() !== undefined;
  }
  
  getIsIncoming() {
    return this.getIncomingTransfers() != undefined && this.getIncomingTransfers().length > 0;
  }
  
  getIncomingAmount() {
    if (this.getIncomingTransfers() === undefined) return undefined;
    let incomingAmt = new BigInteger(0);
    for (let transfer of this.getIncomingTransfers()) incomingAmt = incomingAmt.add(transfer.getAmount());
    return incomingAmt;
  }
  
  getOutgoingAmount() {
    return this.getOutgoingTransfer() ? this.getOutgoingTransfer().getAmount() : undefined;
  }
  
  getIncomingTransfers() {
    return this.state.incomingTransfers;
  }
  
  setIncomingTransfers(incomingTransfers) {
    this.state.incomingTransfers = incomingTransfers;
    return this;
  }
  
  getOutgoingTransfer() {
    return this.state.outgoingTransfer;
  }
  
  setOutgoingTransfer(outgoingTransfer) {
    this.state.outgoingTransfer = outgoingTransfer;
    return this;
  }
  
  setVouts(vouts) {
    
    // validate that all vouts are wallet outputs
    if (vouts) {
      for (let vout of vouts) {
        if (!(vout instanceof MoneroOutputWallet)) throw new MoneroError("Wallet transaction vouts must be of type MoneroOutputWallet");
      }
    }
    super.setVouts(vouts);
    return this;
  }
  
  getNote() {
    return this.state.note;
  }
  
  setNote(note) {
    this.state.note = note;
    return this;
  }
  
  copy() {
    return new MoneroTxWallet(this);
  }
  
  toJson() {
    let json = Object.assign({}, this.state, super.toJson()); // merge json onto inherited state
    if (this.getIncomingTransfers()) {
      json.incomingTransfers = [];
      for (let incomingTransfer of this.getIncomingTransfers()) json.incomingTransfers.push(incomingTransfer.toJson());
    }
    if (this.getOutgoingTransfer()) json.outgoingTransfer = this.getOutgoingTransfer().toJson();
    return json;
  }
  
  /**
   * Updates this transaction by merging the latest information from the given
   * transaction.
   * 
   * Merging can modify or build references to the transaction given so it
   * should not be re-used or it should be copied before calling this method.
   * 
   * @param tx is the transaction to merge into this transaction
   */
  merge(tx) {
    assert(tx instanceof MoneroTxWallet);
    if (this === tx) return this;
    super.merge(tx);
    
    // merge wallet extensions
    this.setNote(MoneroUtils.reconcile(this.getNote(), tx.getNote()));
    
    // merge incoming transfers
    if (tx.getIncomingTransfers()) {
      if (this.getIncomingTransfers() === undefined) this.setIncomingTransfers([]);
      for (let transfer of tx.getIncomingTransfers()) {
        transfer.setTx(this);
        MoneroTxWallet._mergeIncomingTransfer(this.getIncomingTransfers(), transfer);
      }
    }
    
    // merge outgoing transfer
    if (tx.getOutgoingTransfer()) {
      tx.getOutgoingTransfer().setTx(this);
      if (this.getOutgoingTransfer() === undefined) this.setOutgoingTransfer(tx.getOutgoingTransfer());
      else this.getOutgoingTransfer().merge(tx.getOutgoingTransfer());
    }
    
    return this;  // for chaining
  }
  
  toString(indent = 0, oneLine) {
    let str = "";
    
    // represent tx with one line string
    // TODO: proper csv export
    if (oneLine) {
      str += this.getId() + ", ";
      str += (this.getIsConfirmed() ? this.getBlock().getTimestamp() : this.getReceivedTimestamp()) + ", ";
      str += this.getIsConfirmed() + ", ";
      str += (this.getOutgoingAmount() ? this.getOutgoingAmount().toString() : "") + ", ";
      str += this.getIncomingAmount() ? this.getIncomingAmount().toString() : "";
      return str;
    }
    
    // otherwise stringify all fields
    str += super.toString(indent) + "\n";
    str += MoneroUtils.kvLine("Is incoming", this.getIsIncoming(), indent);
    str += MoneroUtils.kvLine("Incoming amount", this.getIncomingAmount(), indent);
    if (this.getIncomingTransfers()) {
      str += MoneroUtils.kvLine("Incoming transfers", "", indent);
      for (let i = 0; i < this.getIncomingTransfers().length; i++) {
        str += MoneroUtils.kvLine(i + 1, "", indent + 1);
        str += this.getIncomingTransfers()[i].toString(indent + 2) + "\n";
      }
    }
    str += MoneroUtils.kvLine("Is outgoing", this.getIsOutgoing(), indent);
    str += MoneroUtils.kvLine("Outgoing amount", this.getOutgoingAmount(), indent);
    if (this.getOutgoingTransfer()) {
      str += MoneroUtils.kvLine("Outgoing transfer", "", indent);
      str += this.getOutgoingTransfer().toString(indent + 1) + "\n";
    }
    str += MoneroUtils.kvLine("Note: ", this.getNote(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
  
  // private helper to merge transfers
  static _mergeIncomingTransfer(transfers, transfer) {
    for (let aTransfer of transfers) {
      if (aTransfer.getAccountIndex() === transfer.getAccountIndex() && aTransfer.getSubaddressIndex() === transfer.getSubaddressIndex()) {
        aTransfer.merge(transfer);
        return;
      }
    }
    transfers.push(transfer);
  }
}

module.exports = MoneroTxWallet;