import assert from "assert";
import GenUtils from "../../common/GenUtils";
import MoneroIncomingTransfer from "./MoneroIncomingTransfer";
import MoneroOutgoingTransfer from "./MoneroOutgoingTransfer";
import MoneroOutputWallet from "./MoneroOutputWallet";
import MoneroTx from "../../daemon/model/MoneroTx";
import MoneroTxSet from "./MoneroTxSet";

/**
 * Models a Monero transaction with wallet extensions.
 * 
 * @class
 * @extends {MoneroTx}
 */
class MoneroTxWallet extends MoneroTx {
  
  /**
   * Construct the model.
   * 
   * @param {MoneroTxWallet|object} [state] is existing state to initialize from (optional)
   */
  constructor(state) {
    super(state);
    if (state instanceof MoneroTxWallet && state.getTxSet()) this.setTxSet(state.getTxSet()); // preserve reference to tx set
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
    
    // deserialize inputs
    if (state.inputs) {
      for (let i = 0; i < state.inputs.length; i++) {
        if (!(state.inputs[i] instanceof MoneroOutputWallet)) {
          state.inputs[i] = new MoneroOutputWallet(Object.assign(state.inputs[i].toJson(), {tx: this}));
        }
      }
    }
    
    // deserialize outputs
    if (state.outputs) {
      for (let i = 0; i < state.outputs.length; i++) {
        if (!(state.outputs[i] instanceof MoneroOutputWallet)) {
          state.outputs[i] = new MoneroOutputWallet(Object.assign(state.outputs[i].toJson(), {tx: this}));
        }
      }
    }
    
    // deserialize BigInts
    if (state.inputSum !== undefined && !(state.inputSum instanceof BigInt)) state.inputSum = BigInt(state.inputSum);
    if (state.outputSum !== undefined && !(state.outputSum instanceof BigInt)) state.outputSum = BigInt(state.outputSum);
    if (state.changeAmount !== undefined && !(state.changeAmount instanceof BigInt)) state.changeAmount = BigInt(state.changeAmount);
  }
  
  /**
   * @return {object} json representation of this tx
   */
  toJson() {
    let json = Object.assign({}, this.state, super.toJson()); // merge json onto inherited state
    if (this.getIncomingTransfers() !== undefined) {
      json.incomingTransfers = [];
      for (let incomingTransfer of this.getIncomingTransfers()) json.incomingTransfers.push(incomingTransfer.toJson());
    }
    if (this.getOutgoingTransfer() !== undefined) json.outgoingTransfer = this.getOutgoingTransfer().toJson();
    if (this.getInputSum() !== undefined) json.inputSum = this.getInputSum().toString();
    if (this.getOutputSum() !== undefined) json.outputSum = this.getOutputSum().toString();
    if (this.getChangeAmount() !== undefined) json.changeAmount = this.getChangeAmount().toString();
    delete json.block;  // do not serialize parent block
    delete json.txSet;  // do not serialize parent tx set
    return json;
  }
  
  /**
   @return {MoneroTxSet} tx set containing txs
   */
  getTxSet() {
    return this.state.txSet;
  }
  
  /**
   * @param {MoneroTxSet} txSet - tx set containing txs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setTxSet(txSet) {
    this.state.txSet = txSet;
    return this;
  }
  
  /**
   * @return {boolean} true if the tx has incoming funds, false otherwise
   */
  isIncoming() {
    return this.state.isIncoming;
  }
  
  /**
   * @param {boolean} isIncoming - true if the tx has incoming funds, false otherwise
   * @return {MoneroTxWallet} this tx for chaining
   */
  setIsIncoming(isIncoming) {
    this.state.isIncoming = isIncoming;
    return this;
  }
  
  /**
   * @return {boolean} true if the tx has outgoing funds, false otherwise
   */
  isOutgoing() {
    return this.state.isOutgoing;
  }
  
  /**
   * @param {boolean} isOutgoing - true if the tx has outgoing funds, false otherwise
   * @return {MoneroTxWallet} this tx for chaining
   */
  setIsOutgoing(isOutgoing) {
    this.state.isOutgoing = isOutgoing;
    return this;
  }
  
  /**
   * @return {BigInt} amount received in the tx
   */
  getIncomingAmount() {
    if (this.getIncomingTransfers() === undefined) return undefined;
    let incomingAmt = BigInt("0");
    for (let transfer of this.getIncomingTransfers()) incomingAmt = incomingAmt + transfer.getAmount();
    return incomingAmt;
  }
  
  /**
   * @return {BigInt} amount spent in the tx
   */
  getOutgoingAmount() {
    return this.getOutgoingTransfer() ? this.getOutgoingTransfer().getAmount() : undefined;
  }
  
  /**
   * @param {MoneroTransferQuery} [transferQuery] - query to get specific transfers
   * @return {MoneroTransfer[]} transfers matching the query
   */
  getTransfers(transferQuery) {
    let transfers = [];
    if (this.getOutgoingTransfer() && (!transferQuery || transferQuery.meetsCriteria(this.getOutgoingTransfer()))) transfers.push(this.getOutgoingTransfer());
    if (this.getIncomingTransfers() !== undefined) {
      for (let transfer of this.getIncomingTransfers()) {
        if (!transferQuery || transferQuery.meetsCriteria(transfer)) transfers.push(transfer);
      }
    }
    return transfers;
  }
  
  /**
   * @param {MoneroTransferQuery} transferQuery - query to keep only specific transfers
   * @return {MoneroTransfer[]} remaining transfers matching the query
   */
  filterTransfers(transferQuery) {
    let transfers = [];
    
    // collect outgoing transfer or erase if filtered
    if (this.getOutgoingTransfer() && (!transferQuery || transferQuery.meetsCriteria(this.getOutgoingTransfer()))) transfers.push(this.getOutgoingTransfer());
    else this.setOutgoingTransfer(undefined);
    
    // collect incoming transfers or erase if filtered
    if (this.getIncomingTransfers() !== undefined) {
      let toRemoves = [];
      for (let transfer of this.getIncomingTransfers()) {
        if (transferQuery.meetsCriteria(transfer)) transfers.push(transfer);
        else toRemoves.push(transfer);
      }
      this.setIncomingTransfers(this.getIncomingTransfers().filter(function(transfer) {
        return !toRemoves.includes(transfer);
      }));
      if (this.getIncomingTransfers().length === 0) this.setIncomingTransfers(undefined);
    }
    
    return transfers;
  }
  
  /**
   * @return {MoneroIncomingTransfer[]} incoming transfers
   */
  getIncomingTransfers() {
    return this.state.incomingTransfers;
  }
  
  /**
   * @param {MoneroIncomingTransfer[]} incomingTransfers - incoming transfers
   * @return {MoneroTxWallet} this tx for chaining
   */
  setIncomingTransfers(incomingTransfers) {
    this.state.incomingTransfers = incomingTransfers;
    return this;
  }
  
  /**
   * @return {MoneroOutgoingTransfer[]} outgoing transfers
   */
  getOutgoingTransfer() {
    return this.state.outgoingTransfer;
  }
  
  /**
   * @param {MoneroOutgoingTransfer[]} outgoingTransfer - outgoing transfers
   * @return {MoneroTxWallet} this tx for chaining
   */
  setOutgoingTransfer(outgoingTransfer) {
    this.state.outgoingTransfer = outgoingTransfer;
    return this;
  }
  
  /**
   * @param {MoneroOutputWallet[]} outputQuery - query to get specific inputs
   * @return {MoneroOutputWallet[]} inputs matching the query
   */
  getInputs(outputQuery) {
    if (!outputQuery || !super.getInputs()) return super.getInputs();
    let inputs = [];
    for (let output of super.getInputs()) if (!outputQuery || outputQuery.meetsCriteria(output)) inputs.push(output);
    return inputs;
  }
  
  /**
   * @param {MoneroOutputWallet[]} inputs - tx inputs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setInputs(inputs) {
    
    // validate that all inputs are wallet inputs
    if (inputs) {
      for (let output of inputs) {
        if (!(output instanceof MoneroOutputWallet)) throw new MoneroError("Wallet transaction inputs must be of type MoneroOutputWallet");
      }
    }
    super.setInputs(inputs);
    return this;
  }
  
  /**
   * @param {MoneroOutputQuery} [outputQuery] - query to get specific outputs
   * @return {MoneroOutputWallet[]} outputs matching the query
   */
  getOutputs(outputQuery) {
    if (!outputQuery || !super.getOutputs()) return super.getOutputs();
    let outputs = [];
    for (let output of super.getOutputs()) if (!outputQuery || outputQuery.meetsCriteria(output)) outputs.push(output);
    return outputs;
  }
  
  /**
   * @param {MoneroOutputWallet[]} outputs - tx outputs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setOutputs(outputs) {
    
    // validate that all outputs are wallet outputs
    if (outputs) {
      for (let output of outputs) {
        if (!(output instanceof MoneroOutputWallet)) throw new MoneroError("Wallet transaction outputs must be of type MoneroOutputWallet");
      }
    }
    super.setOutputs(outputs);
    return this;
  }
  
  /**
   * @param {MoneroOutputQuery} outputQuery - query to keep only specific outputs
   * @return {MoneroTransfer[]} remaining outputs matching the query
   */
  filterOutputs(outputQuery) {
    let outputs = [];
    if (super.getOutputs()) {
      let toRemoves = [];
      for (let output of super.getOutputs()) {
        if (!outputQuery || outputQuery.meetsCriteria(output)) outputs.push(output);
        else toRemoves.push(output);
      }
      this.setOutputs(super.getOutputs().filter(function(output) {
        return !toRemoves.includes(output);
      }));
      if (this.getOutputs().length === 0) this.setOutputs(undefined);
    }
    return outputs;
  }
  
  /**
   * @return {string} tx note
   */
  getNote() {
    return this.state.note;
  }
  
  /**
   * @param {string} note - tx note
   * @return {MoneroTxWallet} this tx for chaining
   */
  setNote(note) {
    this.state.note = note;
    return this;
  }
  
  /**
   * @return {boolean} true if the tx is locked, false otherwise
   */
  isLocked() {
    return this.state.isLocked;
  }
  
  /**
   * @param {boolean} isLocked - true if the tx is locked, false otherwise
   * @return {MoneroTxWallet} this tx for chaining
   */
  setIsLocked(isLocked) {
    this.state.isLocked = isLocked;
    return this;
  }
  
  /**
   * @return {BigInt} sum of tx inputs
   */
  getInputSum() {
    return this.state.inputSum;
  }
  
  /**
   * @param {BigInt} inputSum - sum of tx inputs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setInputSum(inputSum) {
    this.state.inputSum = inputSum;
    return this;
  }
  
  /**
   * @return {BigInt} sum of tx outputs
   */
  getOutputSum() {
    return this.state.outputSum;
  }
  
  /**
   * @param {BigInt} outputSum - sum of tx outputs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setOutputSum(outputSum) {
    this.state.outputSum = outputSum;
    return this;
  }
  
  /**
   * @return {string} change address
   */
  getChangeAddress() {
    return this.state.changeAddress;
  }
  
  /**
   * @param {string} changeAddress - change address
   * @return {MoneroTxWallet} this tx for chaining
   */
  setChangeAddress(changeAddress) {
    this.state.changeAddress = changeAddress;
    return this;
  }
  
  /**
   * @return {BigInt} change amount
   */
  getChangeAmount() {
    return this.state.changeAmount;
  }
  
  /**
   * @param {BigInt} changeAmount - change amount
   * @return {MoneroTxWallet} this tx for chaining
   */
  setChangeAmount(changeAmount) {
    this.state.changeAmount = changeAmount;
    return this;
  }
  
  /**
   * @return {number} number of dummy outputs
   */
  getNumDummyOutputs() {
    return this.state.numDummyOutputs;
  }
  
  /**
   * @param {number} numDummyOutputs - number of dummy outputs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setNumDummyOutputs(numDummyOutputs) {
    this.state.numDummyOutputs = numDummyOutputs;
    return this;
  }
  
  /**
   * @return {string} tx extra as hex
   */
  getExtraHex() {
    return this.state.extraHex;
  }
  
  /**
   * @param {string} extraHex - tx extra as hex
   * @return {MoneroTxWallet} this tx for chaining
   */
  setExtraHex(extraHex) {
    this.state.extraHex = extraHex;
    return this;
  }
  
  /**
   * @return {MoneroTxWallet} a copy of this tx
   */
  copy() {
    return new MoneroTxWallet(this);
  }
  
  /**
   * Updates this transaction by merging the latest information from the given
   * transaction.
   * 
   * Merging can modify or build references to the transaction given so it
   * should not be re-used or it should be copied before calling this method.
   * 
   * @param {MoneroTxWallet} tx - the transaction to merge into this transaction
   */
  merge(tx) {
    assert(tx instanceof MoneroTxWallet);
    if (this === tx) return this;
    
    // merge base classes
    super.merge(tx);
    
    // merge tx set if they're different which comes back to merging txs
    //import MoneroTxSet from "./MoneroTxSet";
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
    this.setIsIncoming(GenUtils.reconcile(this.isIncoming(), tx.isIncoming()));
    this.setIsOutgoing(GenUtils.reconcile(this.isOutgoing(), tx.isOutgoing()));
    this.setNote(GenUtils.reconcile(this.getNote(), tx.getNote()));
    this.setIsLocked(GenUtils.reconcile(this.isLocked(), tx.isLocked(), {resolveTrue: false})); // tx can become unlocked
    this.setInputSum(GenUtils.reconcile(this.getInputSum(), tx.getInputSum()));
    this.setOutputSum(GenUtils.reconcile(this.getOutputSum(), tx.getOutputSum()));
    this.setChangeAddress(GenUtils.reconcile(this.getChangeAddress(), tx.getChangeAddress()));
    this.setChangeAmount(GenUtils.reconcile(this.getChangeAmount(), tx.getChangeAmount()));
    this.setNumDummyOutputs(GenUtils.reconcile(this.getNumDummyOutputs(), tx.getNumDummyOutputs()));
    this.setExtraHex(GenUtils.reconcile(this.getExtraHex(), tx.getExtraHex()));
    
    return this;  // for chaining
  }
  
  /**
   * @param {number} [indent] - starting indentation
   * @param {boolean} [oneLine] - string is one line if true, multiple lines if false
   * @return {string} string representation of this tx
   */
  toString(indent = 0, oneLine = false) {
    let str = "";
    
    // represent tx with one line string
    // TODO: proper csv export
    if (oneLine) {
      str += this.getHash() + ", ";
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
    if (this.getIncomingTransfers() !== undefined) {
      str += GenUtils.kvLine("Incoming transfers", "", indent);
      for (let i = 0; i < this.getIncomingTransfers().length; i++) {
        str += GenUtils.kvLine(i + 1, "", indent + 1);
        str += this.getIncomingTransfers()[i].toString(indent + 2) + "\n";
      }
    }
    str += GenUtils.kvLine("Is outgoing", this.isOutgoing(), indent);
    str += GenUtils.kvLine("Outgoing amount", this.getOutgoingAmount(), indent);
    if (this.getOutgoingTransfer() !== undefined) {
      str += GenUtils.kvLine("Outgoing transfer", "", indent);
      str += this.getOutgoingTransfer().toString(indent + 1) + "\n";
    }
    str += GenUtils.kvLine("Note", this.getNote(), indent);
    str += GenUtils.kvLine("Is locked", this.isLocked(), indent);
    str += GenUtils.kvLine("Input sum", this.getInputSum(), indent);
    str += GenUtils.kvLine("Output sum", this.getOutputSum(), indent);
    str += GenUtils.kvLine("Change address", this.getChangeAddress(), indent);
    str += GenUtils.kvLine("Change amount", this.getChangeAmount(), indent);
    str += GenUtils.kvLine("Num dummy outputs", this.getNumDummyOutputs(), indent);
    str += GenUtils.kvLine("Extra hex", this.getExtraHex(), indent);
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

export default MoneroTxWallet;
