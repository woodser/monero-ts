const assert = require("assert");
const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroTx = require("../../daemon/model/MoneroTx");
const MoneroTransfer = require("./MoneroTransfer");
const MoneroWalletOutput = require("./MoneroWalletOutput");

/**
 * Models a Monero transaction with wallet extensions.
 */
class MoneroWalletTx extends MoneroTx {
  
  /**
   * Constructs the model.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super(state);
    state = this.state;
    
    // deserialize outgoing transfer
    if (state.outgoingTransfer && !(state.outgoingTransfer instanceof MoneroTransfer)) {
      this.setOutgoingTransfer(new MoneroTransfer(Object.assign(state.outgoingTransfer, {tx: this})));
    }
    
    // deserialize incoming transfers
    if (state.incomingTransfers) {
      for (let i = 0; i < state.incomingTransfers.length; i++) {
        if (!(state.incomingTransfers[i] instanceof MoneroTransfer)) {
          state.incomingTransfers[i] = new MoneroTransfer(Object.assign(state.incomingTransfers[i], {tx: this}));
        }
      }
    }
    
    // deserialize vouts
    if (state.vouts) {
      for (let i = 0; i < state.vouts.length; i++) {
        if (!(state.vouts[i] instanceof MoneroWalletOutput)) {
          state.vouts[i] = new MoneroWalletOutput(Object.assign(state.vouts[i], {tx: this})); // TODO: TEST WITHOUT .state!  accessing internal state object; better way?
        }
      }
    }
  }
  
  getOutgoingAmount() {
    return this.getOutgoingTransfer() ? this.getOutgoingTransfer().getAmount() : undefined;
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
    return this;
  }
  
  getIncomingTransfers() {
    return this.state.incomingTransfers;
  }
  
  setIncomingTransfers(incomingTransfers) {
    this.state.incomingTransfers = incomingTransfers;
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
    str += MoneroUtils.kvLine("Outgoing amount", this.getOutgoingAmount(), indent);
    if (this.getOutgoingTransfer()) {
      str += MoneroUtils.kvLine("Outgoing transfer", "", indent);
      str += this.getOutgoingTransfer().toString(indent + 1) + "\n";
    }
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
   * Merging can modify or build references to the transaction given so it
   * should not be re-used or it should be copied before calling this method.
   * 
   * @parm tx is the transaction to merge into this transaction
   */
  merge(tx) {
    assert(tx instanceof MoneroWalletTx);
    if (this === tx) return;
    super.merge(tx);
    
    // merge wallet extensions
    this.setNote(MoneroUtils.reconcile(this.getNote(), tx.getNote()));
    
    // merge outgoing transfer
    if (tx.getOutgoingTransfer()) {
      tx.getOutgoingTransfer().setTx(this);
      if (this.getOutgoingTransfer() === undefined) this.setOutgoingTransfer(tx.getOutgoingTransfer());
      else this.getOutgoingTransfer().merge(tx.getOutgoingTransfer());
    }
    
    // merge incoming transfers
    if (tx.getIncomingTransfers()) {
      if (this.getIncomingTransfers() === undefined) this.setIncomingTransfers([]);
      for (let transfer of tx.getIncomingTransfers()) {
        transfer.setTx(this);
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