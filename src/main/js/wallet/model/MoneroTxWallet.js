const MoneroTx = require("../../daemon/model/MoneroTx");

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
  
  getTxSet() {
    return this.state.txSet;
  }
  
  setTxSet(txSet) {
    this.state.txSet = txSet;
    return this;
  }
  
  isOutgoing() {
    return this.getOutgoingTransfer() !== undefined;
  }
  
  isIncoming() {
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
    delete json.block;  // do not serialize parent block
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
    
    // merge base classes
    super.merge(tx);
    
    // merge tx set if they're different which comes back to merging txs
    if (this.getTxSet() !== tx.getTxSet()) {
      if (this.getTxSet() == undefined) {
        this.setTxSet(new MoneroTxSet().setTxs([this]));
      }
      if (tx.getTxSet() === undefined) {
        tx.setTxSet(new MoneroTxSet().setTxs([tx]));
      }
      this.getTxSet().merge(tx.getTxSet());
      return this;
    }
    
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
    
    // merge simple extensions
    this.setNote(GenUtils.reconcile(this.getNote(), tx.getNote()));
    
    return this;  // for chaining
  }
  
  toString(indent = 0, oneLine) {
    let str = "";
    
    // represent tx with one line string
    // TODO: proper csv export
    if (oneLine) {
      str += this.getId() + ", ";
      str += (this.isConfirmed() ? this.getBlock().getTimestamp() : this.getReceivedTimestamp()) + ", ";
      str += this.isConfirmed() + ", ";
      str += (this.getOutgoingAmount() ? this.getOutgoingAmount().toString() : "") + ", ";
      str += this.getIncomingAmount() ? this.getIncomingAmount().toString() : "";
      return str;
    }
    
    // otherwise stringify all fields
    str += super.toString(indent) + "\n";
    str += GenUtils.kvLine("Is incoming", this.isIncoming(), indent);
    str += GenUtils.kvLine("Incoming amount", this.getIncomingAmount(), indent);
    if (this.getIncomingTransfers()) {
      str += GenUtils.kvLine("Incoming transfers", "", indent);
      for (let i = 0; i < this.getIncomingTransfers().length; i++) {
        str += GenUtils.kvLine(i + 1, "", indent + 1);
        str += this.getIncomingTransfers()[i].toString(indent + 2) + "\n";
      }
    }
    str += GenUtils.kvLine("Is outgoing", this.isOutgoing(), indent);
    str += GenUtils.kvLine("Outgoing amount", this.getOutgoingAmount(), indent);
    if (this.getOutgoingTransfer()) {
      str += GenUtils.kvLine("Outgoing transfer", "", indent);
      str += this.getOutgoingTransfer().toString(indent + 1) + "\n";
    }
    str += GenUtils.kvLine("Note: ", this.getNote(), indent);
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