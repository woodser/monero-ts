const assert = require("assert");
const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroTx = require("../../daemon/model/MoneroTx");
const MoneroTransfer = require("../../wallet/model/MoneroTransfer");

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
      
      // deserialize outgoing amount and transfers
      if (json.outgoingAmount) this.setOutgoingAmount(BigInteger.parse(json.outgoingAmount));
      if (json.OutgoingTransfers) {
        let OutgoingTransfers = [];
        for (let jsonOutgoingTransfer of json.OutgoingTransfers) OutgoingTransfers.push(new MoneroTransfer(jsonOutgoingTransfer));
        this.setOutgoingTransfers(OutgoingTransfers);
      }
      
      // deserialize incoming amound transfers
      if (json.incomingAmount) this.setIncomingAmount(BigInteger.parse(json.incomingAmount));
      if (json.incomingTransfers) {
        let incomingTransfers = [];
        for (let jsonIncomingTransfer of json.incomingTransfers) incomingTransfers.push(new MoneroTransfer(jsonIncomingTransfer));
        this.setIncomingTransfers(incomingTransfers);
      }
    }
  }
  
  getIsOutgoing() {
    return this.getOutgoingAmount() !== undefined;
  }
  
  getIsIncoming() {
    return this.getIncomingAmount() !== undefined;
  }
  
  getOutgoingAmount() {
    return this.outgoingAmount;
  }
  
  setOutgoingAmount(outgoingAmount) {
    this.outgoingAmount = outgoingAmount;
  }
  
  getIncomingAmount() {
    return this.incomingAmount;
  }
  
  setIncomingAmount(incomingAmount) {
    this.incomingAmount = incomingAmount;
  }
  
  getOutgoingTransfers() {
    return this.state.OutgoingTransfers;
  }
  
  setOutgoingTransfers(OutgoingTransfers) {
    this.state.OutgoingTransfers = OutgoingTransfers;
  }
  
  getIncomingTransfers() {
    return this.state.incomingTransfers;
  }
  
  setIncomingTransfers(incomingTransfers) {
    this.state.incomingTransfers = incomingTransfers;
  }
  
  getSrcAccountIndex() {
    return this.state.srcAccountIndex;
  }
  
  setSrcAccountIndex(srcAccountIndex) {
    this.state.srcAccountIndex = srcAccountIndex;
  }
  
  getSrcSubaddressIndex() {
    return this.state.srcSubaddrIndex;
  }
  
  setSrcSubaddressIndex(srcSubaddrIndex) {
    this.state.srcSubaddrIndex = srcSubaddrIndex;
  }
  
  getSrcAddress() {
    return this.state.srcAddress;
  }
  
  setSrcAddress(srcAddress) {
    this.state.srcAddress = srcAddress;
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
    if (this.getOutgoingAmount()) json.outgoingAmount = this.getOutgoingAmount().toString();
    if (this.getIncomingAmount()) json.incomingAmount = this.getIncomingAmount().toString();
    if (this.getOutgoingTransfers()) {
      json.OutgoingTransfers = [];
      for (let outgoingTransfer of this.getOutgoingTransfers()) json.OutgoingTransfers.push(outgoingTransfer.toJson());
    }
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
    str += MoneroUtils.kvLine("Source account index", this.getSrcAccountIndex(), indent);
    str += MoneroUtils.kvLine("Source subaddress index", this.getSrcSubaddressIndex(), indent);
    str += MoneroUtils.kvLine("Source address", this.getSrcAddress(), indent);
    if (this.getOutgoingTransfers()) {
      str += MoneroUtils.kvLine("Outgoing transfers", "", indent);
      for (let i = 0; i < this.getOutgoingTransfers().length; i++) {
        str += MoneroUtils.kvLine(i + 1, "", indent + 1);
        str += this.getOutgoingTransfers()[i].toString(indent + 2) + "\n";
        if (i < this.getOutgoingTransfers().length - 1) str += '\n'
      }
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
    this.setOutgoingAmount(MoneroUtils.reconcile(this.getOutgoingAmount(), tx.getOutgoingAmount()));
    this.setSrcAccountIndex(MoneroUtils.reconcile(this.getSrcAccountIndex(), tx.getSrcAccountIndex()));
    this.setSrcSubaddressIndex(MoneroUtils.reconcile(this.getSrcSubaddressIndex(), tx.getSrcSubaddressIndex()));
    this.setSrcAddress(MoneroUtils.reconcile(this.getSrcAddress(), tx.getSrcAddress()));
    this.setNote(MoneroUtils.reconcile(this.getNote(), tx.getNote()));
    
    // merge outgoing transfers
    if (this.getOutgoingTransfers() === undefined) this.setOutgoingTransfers(tx.getOutgoingTransfers());
    else if (tx.getOutgoingTransfers()) {
      assert.deepEqual(this.getOutgoingTransfers(), tx.getOutgoingTransfers(), "Outgoing transfers are different so tx cannot be merged");
    }
    
    // merge incoming transfers
    if (tx.getIncomingTransfers()) {
      if (this.getIncomingTransfers() === undefined) this.setIncomingTransfers([]);
      for (let transfer of tx.getIncomingTransfers()) {
        mergeTransfer(this.getIncomingTransfers(), transfer);
      }
    }
    
    // incoming amount is sum of incoming transfers
    if (this.getIncomingTransfers()) {
      let incomingAmt = new BigInteger(0);
      for (let transfer of this.getIncomingTransfers()) incomingAmt = incomingAmt.add(transfer.getAmount());
      this.setIncomingAmount(incomingAmt);
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