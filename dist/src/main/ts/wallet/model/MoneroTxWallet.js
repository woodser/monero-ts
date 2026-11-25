"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _assert = _interopRequireDefault(require("assert"));
var _GenUtils = _interopRequireDefault(require("../../common/GenUtils"));

var _MoneroError = _interopRequireDefault(require("../../common/MoneroError"));
var _MoneroIncomingTransfer = _interopRequireDefault(require("./MoneroIncomingTransfer"));
var _MoneroOutgoingTransfer = _interopRequireDefault(require("./MoneroOutgoingTransfer"));


var _MoneroOutputWallet = _interopRequireDefault(require("./MoneroOutputWallet"));


var _MoneroTx = _interopRequireDefault(require("../../daemon/model/MoneroTx"));
var _MoneroTxSet = _interopRequireDefault(require("./MoneroTxSet"));

/**
 * Models a Monero transaction with wallet extensions.
 */
class MoneroTxWallet extends _MoneroTx.default {














  /**
   * Construct the model.
   * 
   * @param {Partial<MoneroTxWallet>} [tx] is existing state to initialize from (optional)
   */
  constructor(tx) {
    super(tx);
    this.setTxSet(this.getTxSet()); // preserve reference to tx set

    // copy incoming transfers
    if (this.incomingTransfers) {
      this.incomingTransfers = this.incomingTransfers.slice();
      for (let i = 0; i < this.incomingTransfers.length; i++) {
        this.incomingTransfers[i] = new _MoneroIncomingTransfer.default(this.incomingTransfers[i]).setTx(this);
      }
    }

    // copy outgoing transfer
    if (this.outgoingTransfer) {
      this.outgoingTransfer = new _MoneroOutgoingTransfer.default(this.outgoingTransfer).setTx(this);
    }

    // copy inputs
    if (this.inputs) {
      this.inputs = this.inputs.slice();
      for (let i = 0; i < this.inputs.length; i++) {
        this.inputs[i] = new _MoneroOutputWallet.default(this.inputs[i]).setTx(this);
      }
    }

    // copy outputs
    if (this.outputs) {
      this.outputs = this.outputs.slice();
      for (let i = 0; i < this.outputs.length; i++) {
        this.outputs[i] = new _MoneroOutputWallet.default(this.outputs[i]).setTx(this);
      }
    }

    // deserialize bigints
    if (this.inputSum !== undefined && typeof this.inputSum !== "bigint") this.inputSum = BigInt(this.inputSum);
    if (this.outputSum !== undefined && typeof this.outputSum !== "bigint") this.outputSum = BigInt(this.outputSum);
    if (this.changeAmount !== undefined && typeof this.changeAmount !== "bigint") this.changeAmount = BigInt(this.changeAmount);
  }

  /**
   * @return {any} json representation of this tx
   */
  toJson() {
    let json = Object.assign({}, this, super.toJson()); // merge json onto inherited state
    if (this.getIncomingTransfers() !== undefined) {
      json.incomingTransfers = [];
      for (let incomingTransfer of this.getIncomingTransfers()) json.incomingTransfers.push(incomingTransfer.toJson());
    }
    if (this.getOutgoingTransfer() !== undefined) json.outgoingTransfer = this.getOutgoingTransfer().toJson();
    if (this.getInputSum() !== undefined) json.inputSum = this.getInputSum().toString();
    if (this.getOutputSum() !== undefined) json.outputSum = this.getOutputSum().toString();
    if (this.getChangeAmount() !== undefined) json.changeAmount = this.getChangeAmount().toString();
    delete json.block; // do not serialize parent block
    delete json.txSet; // do not serialize parent tx set
    return json;
  }

  /**
   * @return {MoneroTxSet} tx set containing txs
   */
  getTxSet() {
    return this.txSet;
  }

  /**
   * @param {MoneroTxSet} txSet - tx set containing txs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setTxSet(txSet) {
    this.txSet = txSet;
    return this;
  }

  /**
   * @return {boolean} true if the tx has incoming funds, false otherwise
   */
  getIsIncoming() {
    return this.isIncoming;
  }

  /**
   * @param {boolean} isIncoming - true if the tx has incoming funds, false otherwise
   * @return {MoneroTxWallet} this tx for chaining
   */
  setIsIncoming(isIncoming) {
    this.isIncoming = isIncoming;
    return this;
  }

  /**
   * @return {boolean} true if the tx has outgoing funds, false otherwise
   */
  getIsOutgoing() {
    return this.isOutgoing;
  }

  /**
   * @param {boolean} isOutgoing - true if the tx has outgoing funds, false otherwise
   * @return {MoneroTxWallet} this tx for chaining
   */
  setIsOutgoing(isOutgoing) {
    this.isOutgoing = isOutgoing;
    return this;
  }

  /**
   * @return {bigint} amount received in the tx
   */
  getIncomingAmount() {
    if (this.getIncomingTransfers() === undefined) return undefined;
    let incomingAmt = 0n;
    for (let transfer of this.getIncomingTransfers()) incomingAmt = incomingAmt + transfer.getAmount();
    return incomingAmt;
  }

  /**
   * @return {bigint} amount spent in the tx
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
    if (this.getOutgoingTransfer() && (!transferQuery || transferQuery.meetsCriteria(this.getOutgoingTransfer()))) transfers.push(this.getOutgoingTransfer());else
    this.setOutgoingTransfer(undefined);

    // collect incoming transfers or erase if filtered
    if (this.getIncomingTransfers() !== undefined) {
      let toRemoves = [];
      for (let transfer of this.getIncomingTransfers()) {
        if (transferQuery.meetsCriteria(transfer)) transfers.push(transfer);else
        toRemoves.push(transfer);
      }
      this.setIncomingTransfers(this.getIncomingTransfers().filter(function (transfer) {
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
    return this.incomingTransfers;
  }

  /**
   * @param {MoneroIncomingTransfer[]} incomingTransfers - incoming transfers
   * @return {MoneroTxWallet} this tx for chaining
   */
  setIncomingTransfers(incomingTransfers) {
    this.incomingTransfers = incomingTransfers;
    return this;
  }

  /**
   * @return {MoneroOutgoingTransfer} outgoing transfers
   */
  getOutgoingTransfer() {
    return this.outgoingTransfer;
  }

  /**
   * @param {MoneroOutgoingTransfer} outgoingTransfer - outgoing transfer
   * @return {MoneroTxWallet} this tx for chaining
   */
  setOutgoingTransfer(outgoingTransfer) {
    this.outgoingTransfer = outgoingTransfer;
    return this;
  }

  /**
   * @param {MoneroOutputWallet[]} outputQuery - query to get specific inputs
   * @return {MoneroOutputWallet[]} inputs matching the query
   */
  getInputsWallet(outputQuery) {
    let inputs = [];
    for (let output of super.getInputs()) if (!outputQuery || outputQuery.meetsCriteria(output)) inputs.push(output);
    return inputs;
  }

  /**
   * @param {MoneroOutputWallet[]} inputs - tx inputs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setInputsWallet(inputs) {

    // validate that all inputs are wallet inputs
    if (inputs) {
      for (let output of inputs) {
        if (!(output instanceof _MoneroOutputWallet.default)) throw new _MoneroError.default("Wallet transaction inputs must be of type MoneroOutputWallet");
      }
    }
    super.setInputs(inputs);
    return this;
  }

  /**
   * @param {MoneroOutputQuery} [outputQuery] - query to get specific outputs
   * @return {MoneroOutputWallet[]} outputs matching the query
   */
  getOutputsWallet(outputQuery) {
    let outputs = [];
    for (let output of super.getOutputs()) if (!outputQuery || outputQuery.meetsCriteria(output)) outputs.push(output);
    return outputs;
  }

  /**
   * @param {MoneroOutputWallet[]} outputs - tx outputs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setOutputsWallet(outputs) {

    // validate that all outputs are wallet outputs
    if (outputs) {
      for (let output of outputs) {
        if (!(output instanceof _MoneroOutputWallet.default)) throw new _MoneroError.default("Wallet transaction outputs must be of type MoneroOutputWallet");
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
        if (!outputQuery || outputQuery.meetsCriteria(output)) outputs.push(output);else
        toRemoves.push(output);
      }
      this.setOutputs(super.getOutputs().filter(function (output) {
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
    return this.note;
  }

  /**
   * @param {string} note - tx note
   * @return {MoneroTxWallet} this tx for chaining
   */
  setNote(note) {
    this.note = note;
    return this;
  }

  /**
   * @return {bigint} sum of tx inputs
   */
  getInputSum() {
    return this.inputSum;
  }

  /**
   * @param {bigint} inputSum - sum of tx inputs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setInputSum(inputSum) {
    this.inputSum = inputSum;
    return this;
  }

  /**
   * @return {bigint} sum of tx outputs
   */
  getOutputSum() {
    return this.outputSum;
  }

  /**
   * @param {bigint} outputSum - sum of tx outputs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setOutputSum(outputSum) {
    this.outputSum = outputSum;
    return this;
  }

  /**
   * @return {string} change address
   */
  getChangeAddress() {
    return this.changeAddress;
  }

  /**
   * @param {string} changeAddress - change address
   * @return {MoneroTxWallet} this tx for chaining
   */
  setChangeAddress(changeAddress) {
    this.changeAddress = changeAddress;
    return this;
  }

  /**
   * @return {bigint} change amount
   */
  getChangeAmount() {
    return this.changeAmount;
  }

  /**
   * @param {bigint} changeAmount - change amount
   * @return {MoneroTxWallet} this tx for chaining
   */
  setChangeAmount(changeAmount) {
    this.changeAmount = changeAmount;
    return this;
  }

  /**
   * @return {number} number of dummy outputs
   */
  getNumDummyOutputs() {
    return this.numDummyOutputs;
  }

  /**
   * @param {number} numDummyOutputs - number of dummy outputs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setNumDummyOutputs(numDummyOutputs) {
    this.numDummyOutputs = numDummyOutputs;
    return this;
  }

  /**
   * @return {string} tx extra as hex
   */
  getExtraHex() {
    return this.extraHex;
  }

  /**
   * @param {string} extraHex - tx extra as hex
   * @return {MoneroTxWallet} this tx for chaining
   */
  setExtraHex(extraHex) {
    this.extraHex = extraHex;
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
    (0, _assert.default)(tx instanceof MoneroTxWallet);
    if (this === tx) return this;

    // merge base classes
    super.merge(tx);

    // merge tx set if they're different which comes back to merging txs
    //import MoneroTxSet from "./MoneroTxSet";
    if (this.getTxSet() !== tx.getTxSet()) {
      if (this.getTxSet() == undefined) {
        this.setTxSet(new _MoneroTxSet.default().setTxs([this]));
      }
      if (tx.getTxSet() === undefined) {
        tx.setTxSet(new _MoneroTxSet.default().setTxs([tx]));
      }
      this.getTxSet().merge(tx.getTxSet());
      return this;
    }

    // merge incoming transfers
    if (tx.getIncomingTransfers()) {
      if (this.getIncomingTransfers() === undefined) this.setIncomingTransfers([]);
      for (let transfer of tx.getIncomingTransfers()) {
        transfer.setTx(this);
        MoneroTxWallet.mergeIncomingTransfer(this.getIncomingTransfers(), transfer);
      }
    }

    // merge outgoing transfer
    if (tx.getOutgoingTransfer()) {
      tx.getOutgoingTransfer().setTx(this);
      if (this.getOutgoingTransfer() === undefined) this.setOutgoingTransfer(tx.getOutgoingTransfer());else
      this.getOutgoingTransfer().merge(tx.getOutgoingTransfer());
    }

    // merge simple extensions
    this.setIsIncoming(_GenUtils.default.reconcile(this.getIsIncoming(), tx.getIsIncoming(), { resolveTrue: true })); // outputs seen on confirmation
    this.setIsOutgoing(_GenUtils.default.reconcile(this.getIsOutgoing(), tx.getIsOutgoing()));
    this.setNote(_GenUtils.default.reconcile(this.getNote(), tx.getNote()));
    this.setInputSum(_GenUtils.default.reconcile(this.getInputSum(), tx.getInputSum()));
    this.setOutputSum(_GenUtils.default.reconcile(this.getOutputSum(), tx.getOutputSum()));
    this.setChangeAddress(_GenUtils.default.reconcile(this.getChangeAddress(), tx.getChangeAddress()));
    this.setChangeAmount(_GenUtils.default.reconcile(this.getChangeAmount(), tx.getChangeAmount()));
    this.setNumDummyOutputs(_GenUtils.default.reconcile(this.getNumDummyOutputs(), tx.getNumDummyOutputs()));
    this.setExtraHex(_GenUtils.default.reconcile(this.getExtraHex(), tx.getExtraHex()));

    return this; // for chaining
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
      str += (this.getIsConfirmed() ? this.getBlock().getTimestamp() : this.getReceivedTimestamp()) + ", ";
      str += this.getIsConfirmed() + ", ";
      str += (this.getOutgoingAmount() ? this.getOutgoingAmount().toString() : "") + ", ";
      str += this.getIncomingAmount() ? this.getIncomingAmount().toString() : "";
      return str;
    }

    // otherwise stringify all fields
    str += super.toString(indent) + "\n";
    str += _GenUtils.default.kvLine("Is incoming", this.getIsIncoming(), indent);
    str += _GenUtils.default.kvLine("Incoming amount", this.getIncomingAmount(), indent);
    if (this.getIncomingTransfers() !== undefined) {
      str += _GenUtils.default.kvLine("Incoming transfers", "", indent);
      for (let i = 0; i < this.getIncomingTransfers().length; i++) {
        str += _GenUtils.default.kvLine(i + 1, "", indent + 1);
        str += this.getIncomingTransfers()[i].toString(indent + 2) + "\n";
      }
    }
    str += _GenUtils.default.kvLine("Is outgoing", this.getIsOutgoing(), indent);
    str += _GenUtils.default.kvLine("Outgoing amount", this.getOutgoingAmount(), indent);
    if (this.getOutgoingTransfer() !== undefined) {
      str += _GenUtils.default.kvLine("Outgoing transfer", "", indent);
      str += this.getOutgoingTransfer().toString(indent + 1) + "\n";
    }
    str += _GenUtils.default.kvLine("Note", this.getNote(), indent);
    str += _GenUtils.default.kvLine("Input sum", this.getInputSum(), indent);
    str += _GenUtils.default.kvLine("Output sum", this.getOutputSum(), indent);
    str += _GenUtils.default.kvLine("Change address", this.getChangeAddress(), indent);
    str += _GenUtils.default.kvLine("Change amount", this.getChangeAmount(), indent);
    str += _GenUtils.default.kvLine("Num dummy outputs", this.getNumDummyOutputs(), indent);
    str += _GenUtils.default.kvLine("Extra hex", this.getExtraHex(), indent);
    return str.slice(0, str.length - 1); // strip last newline
  }

  // private helper to merge transfers
  static mergeIncomingTransfer(transfers, transfer) {
    for (let aTransfer of transfers) {
      if (aTransfer.getAccountIndex() === transfer.getAccountIndex() && aTransfer.getSubaddressIndex() === transfer.getSubaddressIndex()) {
        aTransfer.merge(transfer);
        return;
      }
    }
    transfers.push(transfer);
  }

  // -------------------- OVERRIDE COVARIANT RETURN TYPES ---------------------

  setBlock(block) {
    super.setBlock(block);
    return this;
  }

  setHash(hash) {
    super.setHash(hash);
    return this;
  }

  setVersion(version) {
    super.setVersion(version);
    return this;
  }

  setIsMinerTx(isMinerTx) {
    super.setIsMinerTx(isMinerTx);
    return this;
  }

  setPaymentId(paymentId) {
    super.setPaymentId(paymentId);
    return this;
  }

  setFee(fee) {
    super.setFee(fee);
    return this;
  }

  setRingSize(ringSize) {
    super.setRingSize(ringSize);
    return this;
  }

  setRelay(relay) {
    super.setRelay(relay);
    return this;
  }

  setIsRelayed(isRelayed) {
    super.setIsRelayed(isRelayed);
    return this;
  }

  setIsConfirmed(isConfirmed) {
    super.setIsConfirmed(isConfirmed);
    return this;
  }

  setInTxPool(inTxPool) {
    super.setInTxPool(inTxPool);
    return this;
  }

  setIsLocked(isLocked) {
    super.setIsLocked(isLocked);
    return this;
  }

  setNumConfirmations(numConfirmations) {
    super.setNumConfirmations(numConfirmations);
    return this;
  }

  setUnlockTime(unlockTime) {
    super.setUnlockTime(unlockTime);
    return this;
  }

  setLastRelayedTimestamp(lastRelayedTimestamp) {
    super.setLastRelayedTimestamp(lastRelayedTimestamp);
    return this;
  }

  setReceivedTimestamp(receivedTimestamp) {
    super.setReceivedTimestamp(receivedTimestamp);
    return this;
  }

  setIsDoubleSpendSeen(isDoubleSpendSeen) {
    super.setIsDoubleSpendSeen(isDoubleSpendSeen);
    return this;
  }

  setKey(key) {
    super.setKey(key);
    return this;
  }

  setFullHex(fullHex) {
    super.setFullHex(fullHex);
    return this;
  }

  setPrunedHex(prunedHex) {
    super.setPrunedHex(prunedHex);
    return this;
  }

  setPrunableHex(prunableHex) {
    super.setPrunableHex(prunableHex);
    return this;
  }

  setPrunableHash(prunableHash) {
    super.setPrunableHash(prunableHash);
    return this;
  }

  setSize(size) {
    super.setSize(size);
    return this;
  }

  setWeight(weight) {
    super.setWeight(weight);
    return this;
  }

  setInputs(inputs) {
    super.setInputs(inputs);
    return this;
  }

  setOutputs(outputs) {
    super.setOutputs(outputs);
    return this;
  }

  setOutputIndices(outputIndices) {
    super.setOutputIndices(outputIndices);
    return this;
  }

  setMetadata(metadata) {
    super.setMetadata(metadata);
    return this;
  }

  setExtra(extra) {
    super.setExtra(extra);
    return this;
  }

  setRctSignatures(rctSignatures) {
    super.setRctSignatures(rctSignatures);
    return this;
  }

  setRctSigPrunable(rctSigPrunable) {
    super.setRctSigPrunable(rctSigPrunable);
    return this;
  }

  setIsKeptByBlock(isKeptByBlock) {
    super.setIsKeptByBlock(isKeptByBlock);
    return this;
  }

  setIsFailed(isFailed) {
    super.setIsFailed(isFailed);
    return this;
  }

  setLastFailedHeight(lastFailedHeight) {
    super.setLastFailedHeight(lastFailedHeight);
    return this;
  }

  setLastFailedHash(lastFailedHash) {
    super.setLastFailedHash(lastFailedHash);
    return this;
  }

  setMaxUsedBlockHeight(maxUsedBlockHeight) {
    super.setMaxUsedBlockHeight(maxUsedBlockHeight);
    return this;
  }

  setMaxUsedBlockHash(maxUsedBlockHash) {
    super.setMaxUsedBlockHash(maxUsedBlockHash);
    return this;
  }

  setSignatures(signatures) {
    super.setSignatures(signatures);
    return this;
  }
}exports.default = MoneroTxWallet;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9UeCIsIl9Nb25lcm9UeFNldCIsIk1vbmVyb1R4V2FsbGV0IiwiTW9uZXJvVHgiLCJjb25zdHJ1Y3RvciIsInR4Iiwic2V0VHhTZXQiLCJnZXRUeFNldCIsImluY29taW5nVHJhbnNmZXJzIiwic2xpY2UiLCJpIiwibGVuZ3RoIiwiTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsInNldFR4Iiwib3V0Z29pbmdUcmFuc2ZlciIsIk1vbmVyb091dGdvaW5nVHJhbnNmZXIiLCJpbnB1dHMiLCJNb25lcm9PdXRwdXRXYWxsZXQiLCJvdXRwdXRzIiwiaW5wdXRTdW0iLCJ1bmRlZmluZWQiLCJCaWdJbnQiLCJvdXRwdXRTdW0iLCJjaGFuZ2VBbW91bnQiLCJ0b0pzb24iLCJqc29uIiwiT2JqZWN0IiwiYXNzaWduIiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJpbmNvbWluZ1RyYW5zZmVyIiwicHVzaCIsImdldE91dGdvaW5nVHJhbnNmZXIiLCJnZXRJbnB1dFN1bSIsInRvU3RyaW5nIiwiZ2V0T3V0cHV0U3VtIiwiZ2V0Q2hhbmdlQW1vdW50IiwiYmxvY2siLCJ0eFNldCIsImdldElzSW5jb21pbmciLCJpc0luY29taW5nIiwic2V0SXNJbmNvbWluZyIsImdldElzT3V0Z29pbmciLCJpc091dGdvaW5nIiwic2V0SXNPdXRnb2luZyIsImdldEluY29taW5nQW1vdW50IiwiaW5jb21pbmdBbXQiLCJ0cmFuc2ZlciIsImdldEFtb3VudCIsImdldE91dGdvaW5nQW1vdW50IiwiZ2V0VHJhbnNmZXJzIiwidHJhbnNmZXJRdWVyeSIsInRyYW5zZmVycyIsIm1lZXRzQ3JpdGVyaWEiLCJmaWx0ZXJUcmFuc2ZlcnMiLCJzZXRPdXRnb2luZ1RyYW5zZmVyIiwidG9SZW1vdmVzIiwic2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJmaWx0ZXIiLCJpbmNsdWRlcyIsImdldElucHV0c1dhbGxldCIsIm91dHB1dFF1ZXJ5Iiwib3V0cHV0IiwiZ2V0SW5wdXRzIiwic2V0SW5wdXRzV2FsbGV0IiwiTW9uZXJvRXJyb3IiLCJzZXRJbnB1dHMiLCJnZXRPdXRwdXRzV2FsbGV0IiwiZ2V0T3V0cHV0cyIsInNldE91dHB1dHNXYWxsZXQiLCJzZXRPdXRwdXRzIiwiZmlsdGVyT3V0cHV0cyIsImdldE5vdGUiLCJub3RlIiwic2V0Tm90ZSIsInNldElucHV0U3VtIiwic2V0T3V0cHV0U3VtIiwiZ2V0Q2hhbmdlQWRkcmVzcyIsImNoYW5nZUFkZHJlc3MiLCJzZXRDaGFuZ2VBZGRyZXNzIiwic2V0Q2hhbmdlQW1vdW50IiwiZ2V0TnVtRHVtbXlPdXRwdXRzIiwibnVtRHVtbXlPdXRwdXRzIiwic2V0TnVtRHVtbXlPdXRwdXRzIiwiZ2V0RXh0cmFIZXgiLCJleHRyYUhleCIsInNldEV4dHJhSGV4IiwiY29weSIsIm1lcmdlIiwiYXNzZXJ0IiwiTW9uZXJvVHhTZXQiLCJzZXRUeHMiLCJtZXJnZUluY29taW5nVHJhbnNmZXIiLCJHZW5VdGlscyIsInJlY29uY2lsZSIsInJlc29sdmVUcnVlIiwiaW5kZW50Iiwib25lTGluZSIsInN0ciIsImdldEhhc2giLCJnZXRJc0NvbmZpcm1lZCIsImdldEJsb2NrIiwiZ2V0VGltZXN0YW1wIiwiZ2V0UmVjZWl2ZWRUaW1lc3RhbXAiLCJrdkxpbmUiLCJhVHJhbnNmZXIiLCJnZXRBY2NvdW50SW5kZXgiLCJnZXRTdWJhZGRyZXNzSW5kZXgiLCJzZXRCbG9jayIsInNldEhhc2giLCJoYXNoIiwic2V0VmVyc2lvbiIsInZlcnNpb24iLCJzZXRJc01pbmVyVHgiLCJpc01pbmVyVHgiLCJzZXRQYXltZW50SWQiLCJwYXltZW50SWQiLCJzZXRGZWUiLCJmZWUiLCJzZXRSaW5nU2l6ZSIsInJpbmdTaXplIiwic2V0UmVsYXkiLCJyZWxheSIsInNldElzUmVsYXllZCIsImlzUmVsYXllZCIsInNldElzQ29uZmlybWVkIiwiaXNDb25maXJtZWQiLCJzZXRJblR4UG9vbCIsImluVHhQb29sIiwic2V0SXNMb2NrZWQiLCJpc0xvY2tlZCIsInNldE51bUNvbmZpcm1hdGlvbnMiLCJudW1Db25maXJtYXRpb25zIiwic2V0VW5sb2NrVGltZSIsInVubG9ja1RpbWUiLCJzZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsImxhc3RSZWxheWVkVGltZXN0YW1wIiwic2V0UmVjZWl2ZWRUaW1lc3RhbXAiLCJyZWNlaXZlZFRpbWVzdGFtcCIsInNldElzRG91YmxlU3BlbmRTZWVuIiwiaXNEb3VibGVTcGVuZFNlZW4iLCJzZXRLZXkiLCJrZXkiLCJzZXRGdWxsSGV4IiwiZnVsbEhleCIsInNldFBydW5lZEhleCIsInBydW5lZEhleCIsInNldFBydW5hYmxlSGV4IiwicHJ1bmFibGVIZXgiLCJzZXRQcnVuYWJsZUhhc2giLCJwcnVuYWJsZUhhc2giLCJzZXRTaXplIiwic2l6ZSIsInNldFdlaWdodCIsIndlaWdodCIsInNldE91dHB1dEluZGljZXMiLCJvdXRwdXRJbmRpY2VzIiwic2V0TWV0YWRhdGEiLCJtZXRhZGF0YSIsInNldEV4dHJhIiwiZXh0cmEiLCJzZXRSY3RTaWduYXR1cmVzIiwicmN0U2lnbmF0dXJlcyIsInNldFJjdFNpZ1BydW5hYmxlIiwicmN0U2lnUHJ1bmFibGUiLCJzZXRJc0tlcHRCeUJsb2NrIiwiaXNLZXB0QnlCbG9jayIsInNldElzRmFpbGVkIiwiaXNGYWlsZWQiLCJzZXRMYXN0RmFpbGVkSGVpZ2h0IiwibGFzdEZhaWxlZEhlaWdodCIsInNldExhc3RGYWlsZWRIYXNoIiwibGFzdEZhaWxlZEhhc2giLCJzZXRNYXhVc2VkQmxvY2tIZWlnaHQiLCJtYXhVc2VkQmxvY2tIZWlnaHQiLCJzZXRNYXhVc2VkQmxvY2tIYXNoIiwibWF4VXNlZEJsb2NrSGFzaCIsInNldFNpZ25hdHVyZXMiLCJzaWduYXR1cmVzIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvVHhXYWxsZXQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uLy4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi8uLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciBmcm9tIFwiLi9Nb25lcm9JbmNvbWluZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciBmcm9tIFwiLi9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0UXVlcnkgZnJvbSBcIi4vTW9uZXJvT3V0cHV0UXVlcnlcIjtcbmltcG9ydCBNb25lcm9PdXRwdXQgZnJvbSBcIi4uLy4uL2RhZW1vbi9tb2RlbC9Nb25lcm9PdXRwdXRcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRXYWxsZXQgZnJvbSBcIi4vTW9uZXJvT3V0cHV0V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXIgZnJvbSBcIi4vTW9uZXJvVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlclF1ZXJ5IGZyb20gXCIuL01vbmVyb1RyYW5zZmVyUXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi4vLi4vZGFlbW9uL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vTW9uZXJvVHhTZXRcIjtcblxuLyoqXG4gKiBNb2RlbHMgYSBNb25lcm8gdHJhbnNhY3Rpb24gd2l0aCB3YWxsZXQgZXh0ZW5zaW9ucy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvVHhXYWxsZXQgZXh0ZW5kcyBNb25lcm9UeCB7XG5cbiAgdHhTZXQ6IE1vbmVyb1R4U2V0O1xuICBpc0luY29taW5nOiBib29sZWFuO1xuICBpc091dGdvaW5nOiBib29sZWFuO1xuICBpbmNvbWluZ1RyYW5zZmVyczogTW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdO1xuICBvdXRnb2luZ1RyYW5zZmVyOiBNb25lcm9PdXRnb2luZ1RyYW5zZmVyO1xuICBub3RlOiBzdHJpbmc7XG4gIGlucHV0U3VtOiBiaWdpbnQ7XG4gIG91dHB1dFN1bTogYmlnaW50O1xuICBjaGFuZ2VBZGRyZXNzOiBzdHJpbmc7XG4gIGNoYW5nZUFtb3VudDogYmlnaW50O1xuICBudW1EdW1teU91dHB1dHM6IG51bWJlcjtcbiAgZXh0cmFIZXg6IHN0cmluZztcbiAgXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgdGhlIG1vZGVsLlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1R4V2FsbGV0Pn0gW3R4XSBpcyBleGlzdGluZyBzdGF0ZSB0byBpbml0aWFsaXplIGZyb20gKG9wdGlvbmFsKVxuICAgKi9cbiAgY29uc3RydWN0b3IodHg/OiBQYXJ0aWFsPE1vbmVyb1R4V2FsbGV0Pikge1xuICAgIHN1cGVyKHR4KTtcbiAgICB0aGlzLnNldFR4U2V0KHRoaXMuZ2V0VHhTZXQoKSk7IC8vIHByZXNlcnZlIHJlZmVyZW5jZSB0byB0eCBzZXRcbiAgICBcbiAgICAvLyBjb3B5IGluY29taW5nIHRyYW5zZmVyc1xuICAgIGlmICh0aGlzLmluY29taW5nVHJhbnNmZXJzKSB7XG4gICAgICB0aGlzLmluY29taW5nVHJhbnNmZXJzID0gdGhpcy5pbmNvbWluZ1RyYW5zZmVycy5zbGljZSgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmluY29taW5nVHJhbnNmZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuaW5jb21pbmdUcmFuc2ZlcnNbaV0gPSBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2Zlcih0aGlzLmluY29taW5nVHJhbnNmZXJzW2ldKS5zZXRUeCh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY29weSBvdXRnb2luZyB0cmFuc2ZlclxuICAgIGlmICh0aGlzLm91dGdvaW5nVHJhbnNmZXIpIHtcbiAgICAgIHRoaXMub3V0Z29pbmdUcmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKHRoaXMub3V0Z29pbmdUcmFuc2Zlcikuc2V0VHgodGhpcyk7XG4gICAgfVxuICAgIFxuICAgIC8vIGNvcHkgaW5wdXRzXG4gICAgaWYgKHRoaXMuaW5wdXRzKSB7XG4gICAgICB0aGlzLmlucHV0cyA9IHRoaXMuaW5wdXRzLnNsaWNlKCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuaW5wdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuaW5wdXRzW2ldID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCh0aGlzLmlucHV0c1tpXSBhcyBNb25lcm9PdXRwdXRXYWxsZXQpLnNldFR4KHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjb3B5IG91dHB1dHNcbiAgICBpZiAodGhpcy5vdXRwdXRzKSB7XG4gICAgICB0aGlzLm91dHB1dHMgPSB0aGlzLm91dHB1dHMuc2xpY2UoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5vdXRwdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMub3V0cHV0c1tpXSA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQodGhpcy5vdXRwdXRzW2ldIGFzIE1vbmVyb091dHB1dFdhbGxldCkuc2V0VHgodGhpcyk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIGJpZ2ludHNcbiAgICBpZiAodGhpcy5pbnB1dFN1bSAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiB0aGlzLmlucHV0U3VtICE9PSBcImJpZ2ludFwiKSB0aGlzLmlucHV0U3VtID0gQmlnSW50KHRoaXMuaW5wdXRTdW0pO1xuICAgIGlmICh0aGlzLm91dHB1dFN1bSAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiB0aGlzLm91dHB1dFN1bSAhPT0gXCJiaWdpbnRcIikgdGhpcy5vdXRwdXRTdW0gPSBCaWdJbnQodGhpcy5vdXRwdXRTdW0pO1xuICAgIGlmICh0aGlzLmNoYW5nZUFtb3VudCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiB0aGlzLmNoYW5nZUFtb3VudCAhPT0gXCJiaWdpbnRcIikgdGhpcy5jaGFuZ2VBbW91bnQgPSBCaWdJbnQodGhpcy5jaGFuZ2VBbW91bnQpO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7YW55fSBqc29uIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgdHhcbiAgICovXG4gIHRvSnNvbigpOiBhbnkge1xuICAgIGxldCBqc29uID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcywgc3VwZXIudG9Kc29uKCkpOyAvLyBtZXJnZSBqc29uIG9udG8gaW5oZXJpdGVkIHN0YXRlXG4gICAgaWYgKHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBqc29uLmluY29taW5nVHJhbnNmZXJzID0gW107XG4gICAgICBmb3IgKGxldCBpbmNvbWluZ1RyYW5zZmVyIG9mIHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkganNvbi5pbmNvbWluZ1RyYW5zZmVycy5wdXNoKGluY29taW5nVHJhbnNmZXIudG9Kc29uKCkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgIT09IHVuZGVmaW5lZCkganNvbi5vdXRnb2luZ1RyYW5zZmVyID0gdGhpcy5nZXRPdXRnb2luZ1RyYW5zZmVyKCkudG9Kc29uKCk7XG4gICAgaWYgKHRoaXMuZ2V0SW5wdXRTdW0oKSAhPT0gdW5kZWZpbmVkKSBqc29uLmlucHV0U3VtID0gdGhpcy5nZXRJbnB1dFN1bSgpLnRvU3RyaW5nKCk7XG4gICAgaWYgKHRoaXMuZ2V0T3V0cHV0U3VtKCkgIT09IHVuZGVmaW5lZCkganNvbi5vdXRwdXRTdW0gPSB0aGlzLmdldE91dHB1dFN1bSgpLnRvU3RyaW5nKCk7XG4gICAgaWYgKHRoaXMuZ2V0Q2hhbmdlQW1vdW50KCkgIT09IHVuZGVmaW5lZCkganNvbi5jaGFuZ2VBbW91bnQgPSB0aGlzLmdldENoYW5nZUFtb3VudCgpLnRvU3RyaW5nKCk7XG4gICAgZGVsZXRlIGpzb24uYmxvY2s7ICAvLyBkbyBub3Qgc2VyaWFsaXplIHBhcmVudCBibG9ja1xuICAgIGRlbGV0ZSBqc29uLnR4U2V0OyAgLy8gZG8gbm90IHNlcmlhbGl6ZSBwYXJlbnQgdHggc2V0XG4gICAgcmV0dXJuIGpzb247XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtNb25lcm9UeFNldH0gdHggc2V0IGNvbnRhaW5pbmcgdHhzXG4gICAqL1xuICBnZXRUeFNldCgpOiBNb25lcm9UeFNldCB7XG4gICAgcmV0dXJuIHRoaXMudHhTZXQ7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9UeFNldH0gdHhTZXQgLSB0eCBzZXQgY29udGFpbmluZyB0eHNcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRUeFNldCh0eFNldDogTW9uZXJvVHhTZXQpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy50eFNldCA9IHR4U2V0O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIHR4IGhhcyBpbmNvbWluZyBmdW5kcywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXRJc0luY29taW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzSW5jb21pbmc7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtib29sZWFufSBpc0luY29taW5nIC0gdHJ1ZSBpZiB0aGUgdHggaGFzIGluY29taW5nIGZ1bmRzLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRJc0luY29taW5nKGlzSW5jb21pbmc6IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5pc0luY29taW5nID0gaXNJbmNvbWluZztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSB0eCBoYXMgb3V0Z29pbmcgZnVuZHMsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0SXNPdXRnb2luZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc091dGdvaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNPdXRnb2luZyAtIHRydWUgaWYgdGhlIHR4IGhhcyBvdXRnb2luZyBmdW5kcywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0SXNPdXRnb2luZyhpc091dGdvaW5nOiBib29sZWFuKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHRoaXMuaXNPdXRnb2luZyA9IGlzT3V0Z29pbmc7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7YmlnaW50fSBhbW91bnQgcmVjZWl2ZWQgaW4gdGhlIHR4XG4gICAqL1xuICBnZXRJbmNvbWluZ0Ftb3VudCgpOiBiaWdpbnQge1xuICAgIGlmICh0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBsZXQgaW5jb21pbmdBbXQgPSAwbjtcbiAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKCkpIGluY29taW5nQW10ID0gaW5jb21pbmdBbXQgKyB0cmFuc2Zlci5nZXRBbW91bnQoKTtcbiAgICByZXR1cm4gaW5jb21pbmdBbXQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7YmlnaW50fSBhbW91bnQgc3BlbnQgaW4gdGhlIHR4XG4gICAqL1xuICBnZXRPdXRnb2luZ0Ftb3VudCgpOiBiaWdpbnQge1xuICAgIHJldHVybiB0aGlzLmdldE91dGdvaW5nVHJhbnNmZXIoKSA/IHRoaXMuZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFtb3VudCgpIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7TW9uZXJvVHJhbnNmZXJRdWVyeX0gW3RyYW5zZmVyUXVlcnldIC0gcXVlcnkgdG8gZ2V0IHNwZWNpZmljIHRyYW5zZmVyc1xuICAgKiBAcmV0dXJuIHtNb25lcm9UcmFuc2ZlcltdfSB0cmFuc2ZlcnMgbWF0Y2hpbmcgdGhlIHF1ZXJ5XG4gICAqL1xuICBnZXRUcmFuc2ZlcnModHJhbnNmZXJRdWVyeT86IE1vbmVyb1RyYW5zZmVyUXVlcnkpOiBNb25lcm9UcmFuc2ZlcltdIHtcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgaWYgKHRoaXMuZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICYmICghdHJhbnNmZXJRdWVyeSB8fCB0cmFuc2ZlclF1ZXJ5Lm1lZXRzQ3JpdGVyaWEodGhpcy5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpKSkgdHJhbnNmZXJzLnB1c2godGhpcy5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpO1xuICAgIGlmICh0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdGhpcy5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB7XG4gICAgICAgIGlmICghdHJhbnNmZXJRdWVyeSB8fCB0cmFuc2ZlclF1ZXJ5Lm1lZXRzQ3JpdGVyaWEodHJhbnNmZXIpKSB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9UcmFuc2ZlclF1ZXJ5fSB0cmFuc2ZlclF1ZXJ5IC0gcXVlcnkgdG8ga2VlcCBvbmx5IHNwZWNpZmljIHRyYW5zZmVyc1xuICAgKiBAcmV0dXJuIHtNb25lcm9UcmFuc2ZlcltdfSByZW1haW5pbmcgdHJhbnNmZXJzIG1hdGNoaW5nIHRoZSBxdWVyeVxuICAgKi9cbiAgZmlsdGVyVHJhbnNmZXJzKHRyYW5zZmVyUXVlcnk6IE1vbmVyb1RyYW5zZmVyUXVlcnkpOiBNb25lcm9UcmFuc2ZlcltdIHtcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgXG4gICAgLy8gY29sbGVjdCBvdXRnb2luZyB0cmFuc2ZlciBvciBlcmFzZSBpZiBmaWx0ZXJlZFxuICAgIGlmICh0aGlzLmdldE91dGdvaW5nVHJhbnNmZXIoKSAmJiAoIXRyYW5zZmVyUXVlcnkgfHwgdHJhbnNmZXJRdWVyeS5tZWV0c0NyaXRlcmlhKHRoaXMuZ2V0T3V0Z29pbmdUcmFuc2ZlcigpKSkpIHRyYW5zZmVycy5wdXNoKHRoaXMuZ2V0T3V0Z29pbmdUcmFuc2ZlcigpKTtcbiAgICBlbHNlIHRoaXMuc2V0T3V0Z29pbmdUcmFuc2Zlcih1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgaW5jb21pbmcgdHJhbnNmZXJzIG9yIGVyYXNlIGlmIGZpbHRlcmVkXG4gICAgaWYgKHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgdG9SZW1vdmVzID0gW107XG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKCkpIHtcbiAgICAgICAgaWYgKHRyYW5zZmVyUXVlcnkubWVldHNDcml0ZXJpYSh0cmFuc2ZlcikpIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgICAgZWxzZSB0b1JlbW92ZXMucHVzaCh0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgICB0aGlzLnNldEluY29taW5nVHJhbnNmZXJzKHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKS5maWx0ZXIoZnVuY3Rpb24odHJhbnNmZXIpIHtcbiAgICAgICAgcmV0dXJuICF0b1JlbW92ZXMuaW5jbHVkZXModHJhbnNmZXIpO1xuICAgICAgfSkpO1xuICAgICAgaWYgKHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKS5sZW5ndGggPT09IDApIHRoaXMuc2V0SW5jb21pbmdUcmFuc2ZlcnModW5kZWZpbmVkKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge01vbmVyb0luY29taW5nVHJhbnNmZXJbXX0gaW5jb21pbmcgdHJhbnNmZXJzXG4gICAqL1xuICBnZXRJbmNvbWluZ1RyYW5zZmVycygpOiBNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10ge1xuICAgIHJldHVybiB0aGlzLmluY29taW5nVHJhbnNmZXJzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9JbmNvbWluZ1RyYW5zZmVyW119IGluY29taW5nVHJhbnNmZXJzIC0gaW5jb21pbmcgdHJhbnNmZXJzXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0SW5jb21pbmdUcmFuc2ZlcnMoaW5jb21pbmdUcmFuc2ZlcnM6IE1vbmVyb0luY29taW5nVHJhbnNmZXJbXSk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICB0aGlzLmluY29taW5nVHJhbnNmZXJzID0gaW5jb21pbmdUcmFuc2ZlcnM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtNb25lcm9PdXRnb2luZ1RyYW5zZmVyfSBvdXRnb2luZyB0cmFuc2ZlcnNcbiAgICovXG4gIGdldE91dGdvaW5nVHJhbnNmZXIoKTogTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciB7XG4gICAgcmV0dXJuIHRoaXMub3V0Z29pbmdUcmFuc2ZlcjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7TW9uZXJvT3V0Z29pbmdUcmFuc2Zlcn0gb3V0Z29pbmdUcmFuc2ZlciAtIG91dGdvaW5nIHRyYW5zZmVyXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0T3V0Z29pbmdUcmFuc2ZlcihvdXRnb2luZ1RyYW5zZmVyOiBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHRoaXMub3V0Z29pbmdUcmFuc2ZlciA9IG91dGdvaW5nVHJhbnNmZXI7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9PdXRwdXRXYWxsZXRbXX0gb3V0cHV0UXVlcnkgLSBxdWVyeSB0byBnZXQgc3BlY2lmaWMgaW5wdXRzXG4gICAqIEByZXR1cm4ge01vbmVyb091dHB1dFdhbGxldFtdfSBpbnB1dHMgbWF0Y2hpbmcgdGhlIHF1ZXJ5XG4gICAqL1xuICBnZXRJbnB1dHNXYWxsZXQob3V0cHV0UXVlcnk/OiBNb25lcm9PdXRwdXRRdWVyeSk6IE1vbmVyb091dHB1dFdhbGxldFtdIHtcbiAgICBsZXQgaW5wdXRzOiBNb25lcm9PdXRwdXRXYWxsZXRbXSA9IFtdO1xuICAgIGZvciAobGV0IG91dHB1dCBvZiBzdXBlci5nZXRJbnB1dHMoKSkgaWYgKCFvdXRwdXRRdWVyeSB8fCBvdXRwdXRRdWVyeS5tZWV0c0NyaXRlcmlhKG91dHB1dCBhcyBNb25lcm9PdXRwdXRXYWxsZXQpKSBpbnB1dHMucHVzaChvdXRwdXQgYXMgTW9uZXJvT3V0cHV0V2FsbGV0KTtcbiAgICByZXR1cm4gaW5wdXRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7TW9uZXJvT3V0cHV0V2FsbGV0W119IGlucHV0cyAtIHR4IGlucHV0c1xuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldElucHV0c1dhbGxldChpbnB1dHM6IE1vbmVyb091dHB1dFdhbGxldFtdKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIHRoYXQgYWxsIGlucHV0cyBhcmUgd2FsbGV0IGlucHV0c1xuICAgIGlmIChpbnB1dHMpIHtcbiAgICAgIGZvciAobGV0IG91dHB1dCBvZiBpbnB1dHMpIHtcbiAgICAgICAgaWYgKCEob3V0cHV0IGluc3RhbmNlb2YgTW9uZXJvT3V0cHV0V2FsbGV0KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IHRyYW5zYWN0aW9uIGlucHV0cyBtdXN0IGJlIG9mIHR5cGUgTW9uZXJvT3V0cHV0V2FsbGV0XCIpO1xuICAgICAgfVxuICAgIH1cbiAgICBzdXBlci5zZXRJbnB1dHMoaW5wdXRzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7TW9uZXJvT3V0cHV0UXVlcnl9IFtvdXRwdXRRdWVyeV0gLSBxdWVyeSB0byBnZXQgc3BlY2lmaWMgb3V0cHV0c1xuICAgKiBAcmV0dXJuIHtNb25lcm9PdXRwdXRXYWxsZXRbXX0gb3V0cHV0cyBtYXRjaGluZyB0aGUgcXVlcnlcbiAgICovXG4gIGdldE91dHB1dHNXYWxsZXQob3V0cHV0UXVlcnk/OiBNb25lcm9PdXRwdXRRdWVyeSk6IE1vbmVyb091dHB1dFdhbGxldFtdIHtcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IG91dHB1dCBvZiBzdXBlci5nZXRPdXRwdXRzKCkpIGlmICghb3V0cHV0UXVlcnkgfHwgb3V0cHV0UXVlcnkubWVldHNDcml0ZXJpYShvdXRwdXQgYXMgTW9uZXJvT3V0cHV0V2FsbGV0KSkgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgcmV0dXJuIG91dHB1dHM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge01vbmVyb091dHB1dFdhbGxldFtdfSBvdXRwdXRzIC0gdHggb3V0cHV0c1xuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldE91dHB1dHNXYWxsZXQob3V0cHV0czogTW9uZXJvT3V0cHV0V2FsbGV0W10pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgdGhhdCBhbGwgb3V0cHV0cyBhcmUgd2FsbGV0IG91dHB1dHNcbiAgICBpZiAob3V0cHV0cykge1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIG91dHB1dHMpIHtcbiAgICAgICAgaWYgKCEob3V0cHV0IGluc3RhbmNlb2YgTW9uZXJvT3V0cHV0V2FsbGV0KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IHRyYW5zYWN0aW9uIG91dHB1dHMgbXVzdCBiZSBvZiB0eXBlIE1vbmVyb091dHB1dFdhbGxldFwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgc3VwZXIuc2V0T3V0cHV0cyhvdXRwdXRzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7TW9uZXJvT3V0cHV0UXVlcnl9IG91dHB1dFF1ZXJ5IC0gcXVlcnkgdG8ga2VlcCBvbmx5IHNwZWNpZmljIG91dHB1dHNcbiAgICogQHJldHVybiB7TW9uZXJvVHJhbnNmZXJbXX0gcmVtYWluaW5nIG91dHB1dHMgbWF0Y2hpbmcgdGhlIHF1ZXJ5XG4gICAqL1xuICBmaWx0ZXJPdXRwdXRzKG91dHB1dFF1ZXJ5OiBNb25lcm9PdXRwdXRRdWVyeSk6IE1vbmVyb1RyYW5zZmVyW10ge1xuICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgaWYgKHN1cGVyLmdldE91dHB1dHMoKSkge1xuICAgICAgbGV0IHRvUmVtb3ZlcyA9IFtdO1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHN1cGVyLmdldE91dHB1dHMoKSkge1xuICAgICAgICBpZiAoIW91dHB1dFF1ZXJ5IHx8IG91dHB1dFF1ZXJ5Lm1lZXRzQ3JpdGVyaWEob3V0cHV0IGFzIE1vbmVyb091dHB1dFdhbGxldCkpIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgICBlbHNlIHRvUmVtb3Zlcy5wdXNoKG91dHB1dCk7XG4gICAgICB9XG4gICAgICB0aGlzLnNldE91dHB1dHMoc3VwZXIuZ2V0T3V0cHV0cygpLmZpbHRlcihmdW5jdGlvbihvdXRwdXQpIHtcbiAgICAgICAgcmV0dXJuICF0b1JlbW92ZXMuaW5jbHVkZXMob3V0cHV0KTtcbiAgICAgIH0pKTtcbiAgICAgIGlmICh0aGlzLmdldE91dHB1dHMoKS5sZW5ndGggPT09IDApIHRoaXMuc2V0T3V0cHV0cyh1bmRlZmluZWQpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ30gdHggbm90ZVxuICAgKi9cbiAgZ2V0Tm90ZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLm5vdGU7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbm90ZSAtIHR4IG5vdGVcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXROb3RlKG5vdGU6IHN0cmluZyk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICB0aGlzLm5vdGUgPSBub3RlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7YmlnaW50fSBzdW0gb2YgdHggaW5wdXRzXG4gICAqL1xuICBnZXRJbnB1dFN1bSgpOiBiaWdpbnQge1xuICAgIHJldHVybiB0aGlzLmlucHV0U3VtO1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtiaWdpbnR9IGlucHV0U3VtIC0gc3VtIG9mIHR4IGlucHV0c1xuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldElucHV0U3VtKGlucHV0U3VtOiBiaWdpbnQpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5pbnB1dFN1bSA9IGlucHV0U3VtO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7YmlnaW50fSBzdW0gb2YgdHggb3V0cHV0c1xuICAgKi9cbiAgZ2V0T3V0cHV0U3VtKCk6IGJpZ2ludCB7XG4gICAgcmV0dXJuIHRoaXMub3V0cHV0U3VtO1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtiaWdpbnR9IG91dHB1dFN1bSAtIHN1bSBvZiB0eCBvdXRwdXRzXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0T3V0cHV0U3VtKG91dHB1dFN1bTogYmlnaW50KTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHRoaXMub3V0cHV0U3VtID0gb3V0cHV0U3VtO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfSBjaGFuZ2UgYWRkcmVzc1xuICAgKi9cbiAgZ2V0Q2hhbmdlQWRkcmVzcygpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmNoYW5nZUFkZHJlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY2hhbmdlQWRkcmVzcyAtIGNoYW5nZSBhZGRyZXNzXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0Q2hhbmdlQWRkcmVzcyhjaGFuZ2VBZGRyZXNzOiBzdHJpbmcpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5jaGFuZ2VBZGRyZXNzID0gY2hhbmdlQWRkcmVzcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge2JpZ2ludH0gY2hhbmdlIGFtb3VudFxuICAgKi9cbiAgZ2V0Q2hhbmdlQW1vdW50KCk6IGJpZ2ludCB7XG4gICAgcmV0dXJuIHRoaXMuY2hhbmdlQW1vdW50O1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtiaWdpbnR9IGNoYW5nZUFtb3VudCAtIGNoYW5nZSBhbW91bnRcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRDaGFuZ2VBbW91bnQoY2hhbmdlQW1vdW50OiBiaWdpbnQpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5jaGFuZ2VBbW91bnQgPSBjaGFuZ2VBbW91bnQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IG51bWJlciBvZiBkdW1teSBvdXRwdXRzXG4gICAqL1xuICBnZXROdW1EdW1teU91dHB1dHMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5udW1EdW1teU91dHB1dHM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gbnVtRHVtbXlPdXRwdXRzIC0gbnVtYmVyIG9mIGR1bW15IG91dHB1dHNcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXROdW1EdW1teU91dHB1dHMobnVtRHVtbXlPdXRwdXRzOiBudW1iZXIpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5udW1EdW1teU91dHB1dHMgPSBudW1EdW1teU91dHB1dHM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHR4IGV4dHJhIGFzIGhleFxuICAgKi9cbiAgZ2V0RXh0cmFIZXgoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5leHRyYUhleDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBleHRyYUhleCAtIHR4IGV4dHJhIGFzIGhleFxuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldEV4dHJhSGV4KGV4dHJhSGV4OiBzdHJpbmcpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5leHRyYUhleCA9IGV4dHJhSGV4O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IGEgY29weSBvZiB0aGlzIHR4XG4gICAqL1xuICBjb3B5KCk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4V2FsbGV0KHRoaXMpO1xuICB9XG4gIFxuICAvKipcbiAgICogVXBkYXRlcyB0aGlzIHRyYW5zYWN0aW9uIGJ5IG1lcmdpbmcgdGhlIGxhdGVzdCBpbmZvcm1hdGlvbiBmcm9tIHRoZSBnaXZlblxuICAgKiB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIE1lcmdpbmcgY2FuIG1vZGlmeSBvciBidWlsZCByZWZlcmVuY2VzIHRvIHRoZSB0cmFuc2FjdGlvbiBnaXZlbiBzbyBpdFxuICAgKiBzaG91bGQgbm90IGJlIHJlLXVzZWQgb3IgaXQgc2hvdWxkIGJlIGNvcGllZCBiZWZvcmUgY2FsbGluZyB0aGlzIG1ldGhvZC5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhXYWxsZXR9IHR4IC0gdGhlIHRyYW5zYWN0aW9uIHRvIG1lcmdlIGludG8gdGhpcyB0cmFuc2FjdGlvblxuICAgKi9cbiAgbWVyZ2UodHg6IE1vbmVyb1R4V2FsbGV0KTogTW9uZXJvVHhXYWxsZXQge1xuICAgIGFzc2VydCh0eCBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0KTtcbiAgICBpZiAodGhpcyA9PT0gdHgpIHJldHVybiB0aGlzO1xuICAgIFxuICAgIC8vIG1lcmdlIGJhc2UgY2xhc3Nlc1xuICAgIHN1cGVyLm1lcmdlKHR4KTtcbiAgICBcbiAgICAvLyBtZXJnZSB0eCBzZXQgaWYgdGhleSdyZSBkaWZmZXJlbnQgd2hpY2ggY29tZXMgYmFjayB0byBtZXJnaW5nIHR4c1xuICAgIC8vaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuL01vbmVyb1R4U2V0XCI7XG4gICAgaWYgKHRoaXMuZ2V0VHhTZXQoKSAhPT0gdHguZ2V0VHhTZXQoKSkge1xuICAgICAgaWYgKHRoaXMuZ2V0VHhTZXQoKSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5zZXRUeFNldChuZXcgTW9uZXJvVHhTZXQoKS5zZXRUeHMoW3RoaXNdKSk7XG4gICAgICB9XG4gICAgICBpZiAodHguZ2V0VHhTZXQoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHR4LnNldFR4U2V0KG5ldyBNb25lcm9UeFNldCgpLnNldFR4cyhbdHhdKSk7XG4gICAgICB9XG4gICAgICB0aGlzLmdldFR4U2V0KCkubWVyZ2UodHguZ2V0VHhTZXQoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLy8gbWVyZ2UgaW5jb21pbmcgdHJhbnNmZXJzXG4gICAgaWYgKHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkpIHtcbiAgICAgIGlmICh0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKCkgPT09IHVuZGVmaW5lZCkgdGhpcy5zZXRJbmNvbWluZ1RyYW5zZmVycyhbXSk7XG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB7XG4gICAgICAgIHRyYW5zZmVyLnNldFR4KHRoaXMpO1xuICAgICAgICBNb25lcm9UeFdhbGxldC5tZXJnZUluY29taW5nVHJhbnNmZXIodGhpcy5nZXRJbmNvbWluZ1RyYW5zZmVycygpLCB0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIG1lcmdlIG91dGdvaW5nIHRyYW5zZmVyXG4gICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSkge1xuICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHRoaXMpO1xuICAgICAgaWYgKHRoaXMuZ2V0T3V0Z29pbmdUcmFuc2ZlcigpID09PSB1bmRlZmluZWQpIHRoaXMuc2V0T3V0Z29pbmdUcmFuc2Zlcih0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpO1xuICAgICAgZWxzZSB0aGlzLmdldE91dGdvaW5nVHJhbnNmZXIoKS5tZXJnZSh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpO1xuICAgIH1cbiAgICBcbiAgICAvLyBtZXJnZSBzaW1wbGUgZXh0ZW5zaW9uc1xuICAgIHRoaXMuc2V0SXNJbmNvbWluZyhHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRJc0luY29taW5nKCksIHR4LmdldElzSW5jb21pbmcoKSwge3Jlc29sdmVUcnVlOiB0cnVlfSkpOyAgLy8gb3V0cHV0cyBzZWVuIG9uIGNvbmZpcm1hdGlvblxuICAgIHRoaXMuc2V0SXNPdXRnb2luZyhHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRJc091dGdvaW5nKCksIHR4LmdldElzT3V0Z29pbmcoKSkpO1xuICAgIHRoaXMuc2V0Tm90ZShHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXROb3RlKCksIHR4LmdldE5vdGUoKSkpO1xuICAgIHRoaXMuc2V0SW5wdXRTdW0oR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0SW5wdXRTdW0oKSwgdHguZ2V0SW5wdXRTdW0oKSkpO1xuICAgIHRoaXMuc2V0T3V0cHV0U3VtKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldE91dHB1dFN1bSgpLCB0eC5nZXRPdXRwdXRTdW0oKSkpO1xuICAgIHRoaXMuc2V0Q2hhbmdlQWRkcmVzcyhHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRDaGFuZ2VBZGRyZXNzKCksIHR4LmdldENoYW5nZUFkZHJlc3MoKSkpO1xuICAgIHRoaXMuc2V0Q2hhbmdlQW1vdW50KEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldENoYW5nZUFtb3VudCgpLCB0eC5nZXRDaGFuZ2VBbW91bnQoKSkpO1xuICAgIHRoaXMuc2V0TnVtRHVtbXlPdXRwdXRzKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldE51bUR1bW15T3V0cHV0cygpLCB0eC5nZXROdW1EdW1teU91dHB1dHMoKSkpO1xuICAgIHRoaXMuc2V0RXh0cmFIZXgoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0RXh0cmFIZXgoKSwgdHguZ2V0RXh0cmFIZXgoKSkpO1xuICAgIFxuICAgIHJldHVybiB0aGlzOyAgLy8gZm9yIGNoYWluaW5nXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gW2luZGVudF0gLSBzdGFydGluZyBpbmRlbnRhdGlvblxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvbmVMaW5lXSAtIHN0cmluZyBpcyBvbmUgbGluZSBpZiB0cnVlLCBtdWx0aXBsZSBsaW5lcyBpZiBmYWxzZVxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGlzIHR4XG4gICAqL1xuICB0b1N0cmluZyhpbmRlbnQgPSAwLCBvbmVMaW5lID0gZmFsc2UpOiBzdHJpbmcge1xuICAgIGxldCBzdHIgPSBcIlwiO1xuICAgIFxuICAgIC8vIHJlcHJlc2VudCB0eCB3aXRoIG9uZSBsaW5lIHN0cmluZ1xuICAgIC8vIFRPRE86IHByb3BlciBjc3YgZXhwb3J0XG4gICAgaWYgKG9uZUxpbmUpIHtcbiAgICAgIHN0ciArPSB0aGlzLmdldEhhc2goKSArIFwiLCBcIjtcbiAgICAgIHN0ciArPSAodGhpcy5nZXRJc0NvbmZpcm1lZCgpID8gdGhpcy5nZXRCbG9jaygpLmdldFRpbWVzdGFtcCgpIDogdGhpcy5nZXRSZWNlaXZlZFRpbWVzdGFtcCgpKSArIFwiLCBcIjtcbiAgICAgIHN0ciArPSB0aGlzLmdldElzQ29uZmlybWVkKCkgKyBcIiwgXCI7XG4gICAgICBzdHIgKz0gKHRoaXMuZ2V0T3V0Z29pbmdBbW91bnQoKSA/IHRoaXMuZ2V0T3V0Z29pbmdBbW91bnQoKS50b1N0cmluZygpIDogXCJcIikgKyBcIiwgXCI7XG4gICAgICBzdHIgKz0gdGhpcy5nZXRJbmNvbWluZ0Ftb3VudCgpID8gdGhpcy5nZXRJbmNvbWluZ0Ftb3VudCgpLnRvU3RyaW5nKCkgOiBcIlwiO1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgXG4gICAgLy8gb3RoZXJ3aXNlIHN0cmluZ2lmeSBhbGwgZmllbGRzXG4gICAgc3RyICs9IHN1cGVyLnRvU3RyaW5nKGluZGVudCkgKyBcIlxcblwiO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJJcyBpbmNvbWluZ1wiLCB0aGlzLmdldElzSW5jb21pbmcoKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiSW5jb21pbmcgYW1vdW50XCIsIHRoaXMuZ2V0SW5jb21pbmdBbW91bnQoKSwgaW5kZW50KTtcbiAgICBpZiAodGhpcy5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJJbmNvbWluZyB0cmFuc2ZlcnNcIiwgXCJcIiwgaW5kZW50KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5nZXRJbmNvbWluZ1RyYW5zZmVycygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoaSArIDEsIFwiXCIsIGluZGVudCArIDEpO1xuICAgICAgICBzdHIgKz0gdGhpcy5nZXRJbmNvbWluZ1RyYW5zZmVycygpW2ldLnRvU3RyaW5nKGluZGVudCArIDIpICsgXCJcXG5cIjtcbiAgICAgIH1cbiAgICB9XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIklzIG91dGdvaW5nXCIsIHRoaXMuZ2V0SXNPdXRnb2luZygpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJPdXRnb2luZyBhbW91bnRcIiwgdGhpcy5nZXRPdXRnb2luZ0Ftb3VudCgpLCBpbmRlbnQpO1xuICAgIGlmICh0aGlzLmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiT3V0Z29pbmcgdHJhbnNmZXJcIiwgXCJcIiwgaW5kZW50KTtcbiAgICAgIHN0ciArPSB0aGlzLmdldE91dGdvaW5nVHJhbnNmZXIoKS50b1N0cmluZyhpbmRlbnQgKyAxKSArIFwiXFxuXCI7XG4gICAgfVxuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJOb3RlXCIsIHRoaXMuZ2V0Tm90ZSgpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJJbnB1dCBzdW1cIiwgdGhpcy5nZXRJbnB1dFN1bSgpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJPdXRwdXQgc3VtXCIsIHRoaXMuZ2V0T3V0cHV0U3VtKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIkNoYW5nZSBhZGRyZXNzXCIsIHRoaXMuZ2V0Q2hhbmdlQWRkcmVzcygpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJDaGFuZ2UgYW1vdW50XCIsIHRoaXMuZ2V0Q2hhbmdlQW1vdW50KCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIk51bSBkdW1teSBvdXRwdXRzXCIsIHRoaXMuZ2V0TnVtRHVtbXlPdXRwdXRzKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIkV4dHJhIGhleFwiLCB0aGlzLmdldEV4dHJhSGV4KCksIGluZGVudCk7XG4gICAgcmV0dXJuIHN0ci5zbGljZSgwLCBzdHIubGVuZ3RoIC0gMSk7ICAvLyBzdHJpcCBsYXN0IG5ld2xpbmVcbiAgfVxuICBcbiAgLy8gcHJpdmF0ZSBoZWxwZXIgdG8gbWVyZ2UgdHJhbnNmZXJzXG4gIHByb3RlY3RlZCBzdGF0aWMgbWVyZ2VJbmNvbWluZ1RyYW5zZmVyKHRyYW5zZmVycywgdHJhbnNmZXIpIHtcbiAgICBmb3IgKGxldCBhVHJhbnNmZXIgb2YgdHJhbnNmZXJzKSB7XG4gICAgICBpZiAoYVRyYW5zZmVyLmdldEFjY291bnRJbmRleCgpID09PSB0cmFuc2Zlci5nZXRBY2NvdW50SW5kZXgoKSAmJiBhVHJhbnNmZXIuZ2V0U3ViYWRkcmVzc0luZGV4KCkgPT09IHRyYW5zZmVyLmdldFN1YmFkZHJlc3NJbmRleCgpKSB7XG4gICAgICAgIGFUcmFuc2Zlci5tZXJnZSh0cmFuc2Zlcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0gT1ZFUlJJREUgQ09WQVJJQU5UIFJFVFVSTiBUWVBFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzZXRCbG9jayhibG9jazogTW9uZXJvQmxvY2spOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0QmxvY2soYmxvY2spO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0SGFzaChoYXNoOiBzdHJpbmcpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0SGFzaChoYXNoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFZlcnNpb24odmVyc2lvbjogbnVtYmVyKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFZlcnNpb24odmVyc2lvbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRJc01pbmVyVHgoaXNNaW5lclR4OiBib29sZWFuKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldElzTWluZXJUeChpc01pbmVyVHgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UGF5bWVudElkKHBheW1lbnRJZDogc3RyaW5nKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFBheW1lbnRJZChwYXltZW50SWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0RmVlKGZlZTogYmlnaW50KTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldEZlZShmZWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UmluZ1NpemUocmluZ1NpemU6IG51bWJlcik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRSaW5nU2l6ZShyaW5nU2l6ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRSZWxheShyZWxheTogYm9vbGVhbik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRSZWxheShyZWxheSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRJc1JlbGF5ZWQoaXNSZWxheWVkOiBib29sZWFuKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldElzUmVsYXllZChpc1JlbGF5ZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0SXNDb25maXJtZWQoaXNDb25maXJtZWQ6IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0SXNDb25maXJtZWQoaXNDb25maXJtZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0SW5UeFBvb2woaW5UeFBvb2w6IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0SW5UeFBvb2woaW5UeFBvb2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0SXNMb2NrZWQoaXNMb2NrZWQ6IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0SXNMb2NrZWQoaXNMb2NrZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0TnVtQ29uZmlybWF0aW9ucyhudW1Db25maXJtYXRpb25zOiBudW1iZXIpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0TnVtQ29uZmlybWF0aW9ucyhudW1Db25maXJtYXRpb25zKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFVubG9ja1RpbWUodW5sb2NrVGltZTogYmlnaW50KTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFVubG9ja1RpbWUodW5sb2NrVGltZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRMYXN0UmVsYXllZFRpbWVzdGFtcChsYXN0UmVsYXllZFRpbWVzdGFtcDogbnVtYmVyKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldExhc3RSZWxheWVkVGltZXN0YW1wKGxhc3RSZWxheWVkVGltZXN0YW1wKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFJlY2VpdmVkVGltZXN0YW1wKHJlY2VpdmVkVGltZXN0YW1wOiBudW1iZXIpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0UmVjZWl2ZWRUaW1lc3RhbXAocmVjZWl2ZWRUaW1lc3RhbXApO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0SXNEb3VibGVTcGVuZFNlZW4oaXNEb3VibGVTcGVuZFNlZW46IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0SXNEb3VibGVTcGVuZFNlZW4oaXNEb3VibGVTcGVuZFNlZW4pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0S2V5KGtleTogc3RyaW5nKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldEtleShrZXkpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0RnVsbEhleChmdWxsSGV4OiBzdHJpbmcpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0RnVsbEhleChmdWxsSGV4KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFBydW5lZEhleChwcnVuZWRIZXg6IHN0cmluZyk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRQcnVuZWRIZXgocHJ1bmVkSGV4KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFBydW5hYmxlSGV4KHBydW5hYmxlSGV4OiBzdHJpbmcpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0UHJ1bmFibGVIZXgocHJ1bmFibGVIZXgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UHJ1bmFibGVIYXNoKHBydW5hYmxlSGFzaDogc3RyaW5nKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFBydW5hYmxlSGFzaChwcnVuYWJsZUhhc2gpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0U2l6ZShzaXplOiBudW1iZXIpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0U2l6ZShzaXplKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFdlaWdodCh3ZWlnaHQ6IG51bWJlcik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRXZWlnaHQod2VpZ2h0KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldElucHV0cyhpbnB1dHM6IE1vbmVyb091dHB1dFtdKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldElucHV0cyhpbnB1dHMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0T3V0cHV0cyhvdXRwdXRzOiBNb25lcm9PdXRwdXRbXSk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRPdXRwdXRzKG91dHB1dHMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0T3V0cHV0SW5kaWNlcyhvdXRwdXRJbmRpY2VzOiBudW1iZXJbXSk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRPdXRwdXRJbmRpY2VzKG91dHB1dEluZGljZXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0TWV0YWRhdGEobWV0YWRhdGE6IHN0cmluZyk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRNZXRhZGF0YShtZXRhZGF0YSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRFeHRyYShleHRyYTogVWludDhBcnJheSk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRFeHRyYShleHRyYSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRSY3RTaWduYXR1cmVzKHJjdFNpZ25hdHVyZXM6IGFueSk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRSY3RTaWduYXR1cmVzKHJjdFNpZ25hdHVyZXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UmN0U2lnUHJ1bmFibGUocmN0U2lnUHJ1bmFibGU6IGFueSk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRSY3RTaWdQcnVuYWJsZShyY3RTaWdQcnVuYWJsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRJc0tlcHRCeUJsb2NrKGlzS2VwdEJ5QmxvY2s6IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0SXNLZXB0QnlCbG9jayhpc0tlcHRCeUJsb2NrKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldElzRmFpbGVkKGlzRmFpbGVkOiBib29sZWFuKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldElzRmFpbGVkKGlzRmFpbGVkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldExhc3RGYWlsZWRIZWlnaHQobGFzdEZhaWxlZEhlaWdodDogbnVtYmVyKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldExhc3RGYWlsZWRIZWlnaHQobGFzdEZhaWxlZEhlaWdodCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRMYXN0RmFpbGVkSGFzaChsYXN0RmFpbGVkSGFzaDogc3RyaW5nKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldExhc3RGYWlsZWRIYXNoKGxhc3RGYWlsZWRIYXNoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldE1heFVzZWRCbG9ja0hlaWdodChtYXhVc2VkQmxvY2tIZWlnaHQ6IG51bWJlcik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRNYXhVc2VkQmxvY2tIZWlnaHQobWF4VXNlZEJsb2NrSGVpZ2h0KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldE1heFVzZWRCbG9ja0hhc2gobWF4VXNlZEJsb2NrSGFzaDogc3RyaW5nKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldE1heFVzZWRCbG9ja0hhc2gobWF4VXNlZEJsb2NrSGFzaCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRTaWduYXR1cmVzKHNpZ25hdHVyZXM6IHN0cmluZ1tdKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFNpZ25hdHVyZXMoc2lnbmF0dXJlcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBRSxZQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyx1QkFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksdUJBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTs7O0FBR0EsSUFBQUssbUJBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTs7O0FBR0EsSUFBQU0sU0FBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sWUFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNlLE1BQU1RLGNBQWMsU0FBU0MsaUJBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O0VBZW5EO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRUMsV0FBV0EsQ0FBQ0MsRUFBNEIsRUFBRTtJQUN4QyxLQUFLLENBQUNBLEVBQUUsQ0FBQztJQUNULElBQUksQ0FBQ0MsUUFBUSxDQUFDLElBQUksQ0FBQ0MsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0lBRWhDO0lBQ0EsSUFBSSxJQUFJLENBQUNDLGlCQUFpQixFQUFFO01BQzFCLElBQUksQ0FBQ0EsaUJBQWlCLEdBQUcsSUFBSSxDQUFDQSxpQkFBaUIsQ0FBQ0MsS0FBSyxDQUFDLENBQUM7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