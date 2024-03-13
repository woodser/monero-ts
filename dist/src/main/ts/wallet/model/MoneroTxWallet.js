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
   * @return {boolean} true if the tx is locked, false otherwise
   */
  getIsLocked() {
    return this.isLocked;
  }

  /**
   * @param {boolean} isLocked - true if the tx is locked, false otherwise
   * @return {MoneroTxWallet} this tx for chaining
   */
  setIsLocked(isLocked) {
    this.isLocked = isLocked;
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
    this.setIsLocked(_GenUtils.default.reconcile(this.getIsLocked(), tx.getIsLocked(), { resolveTrue: false })); // tx can become unlocked
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
    str += _GenUtils.default.kvLine("Is locked", this.getIsLocked(), indent);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9UeCIsIl9Nb25lcm9UeFNldCIsIk1vbmVyb1R4V2FsbGV0IiwiTW9uZXJvVHgiLCJjb25zdHJ1Y3RvciIsInR4Iiwic2V0VHhTZXQiLCJnZXRUeFNldCIsImluY29taW5nVHJhbnNmZXJzIiwic2xpY2UiLCJpIiwibGVuZ3RoIiwiTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsInNldFR4Iiwib3V0Z29pbmdUcmFuc2ZlciIsIk1vbmVyb091dGdvaW5nVHJhbnNmZXIiLCJpbnB1dHMiLCJNb25lcm9PdXRwdXRXYWxsZXQiLCJvdXRwdXRzIiwiaW5wdXRTdW0iLCJ1bmRlZmluZWQiLCJCaWdJbnQiLCJvdXRwdXRTdW0iLCJjaGFuZ2VBbW91bnQiLCJ0b0pzb24iLCJqc29uIiwiT2JqZWN0IiwiYXNzaWduIiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJpbmNvbWluZ1RyYW5zZmVyIiwicHVzaCIsImdldE91dGdvaW5nVHJhbnNmZXIiLCJnZXRJbnB1dFN1bSIsInRvU3RyaW5nIiwiZ2V0T3V0cHV0U3VtIiwiZ2V0Q2hhbmdlQW1vdW50IiwiYmxvY2siLCJ0eFNldCIsImdldElzSW5jb21pbmciLCJpc0luY29taW5nIiwic2V0SXNJbmNvbWluZyIsImdldElzT3V0Z29pbmciLCJpc091dGdvaW5nIiwic2V0SXNPdXRnb2luZyIsImdldEluY29taW5nQW1vdW50IiwiaW5jb21pbmdBbXQiLCJ0cmFuc2ZlciIsImdldEFtb3VudCIsImdldE91dGdvaW5nQW1vdW50IiwiZ2V0VHJhbnNmZXJzIiwidHJhbnNmZXJRdWVyeSIsInRyYW5zZmVycyIsIm1lZXRzQ3JpdGVyaWEiLCJmaWx0ZXJUcmFuc2ZlcnMiLCJzZXRPdXRnb2luZ1RyYW5zZmVyIiwidG9SZW1vdmVzIiwic2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJmaWx0ZXIiLCJpbmNsdWRlcyIsImdldElucHV0c1dhbGxldCIsIm91dHB1dFF1ZXJ5Iiwib3V0cHV0IiwiZ2V0SW5wdXRzIiwic2V0SW5wdXRzV2FsbGV0IiwiTW9uZXJvRXJyb3IiLCJzZXRJbnB1dHMiLCJnZXRPdXRwdXRzV2FsbGV0IiwiZ2V0T3V0cHV0cyIsInNldE91dHB1dHNXYWxsZXQiLCJzZXRPdXRwdXRzIiwiZmlsdGVyT3V0cHV0cyIsImdldE5vdGUiLCJub3RlIiwic2V0Tm90ZSIsImdldElzTG9ja2VkIiwiaXNMb2NrZWQiLCJzZXRJc0xvY2tlZCIsInNldElucHV0U3VtIiwic2V0T3V0cHV0U3VtIiwiZ2V0Q2hhbmdlQWRkcmVzcyIsImNoYW5nZUFkZHJlc3MiLCJzZXRDaGFuZ2VBZGRyZXNzIiwic2V0Q2hhbmdlQW1vdW50IiwiZ2V0TnVtRHVtbXlPdXRwdXRzIiwibnVtRHVtbXlPdXRwdXRzIiwic2V0TnVtRHVtbXlPdXRwdXRzIiwiZ2V0RXh0cmFIZXgiLCJleHRyYUhleCIsInNldEV4dHJhSGV4IiwiY29weSIsIm1lcmdlIiwiYXNzZXJ0IiwiTW9uZXJvVHhTZXQiLCJzZXRUeHMiLCJtZXJnZUluY29taW5nVHJhbnNmZXIiLCJHZW5VdGlscyIsInJlY29uY2lsZSIsInJlc29sdmVUcnVlIiwiaW5kZW50Iiwib25lTGluZSIsInN0ciIsImdldEhhc2giLCJnZXRJc0NvbmZpcm1lZCIsImdldEJsb2NrIiwiZ2V0VGltZXN0YW1wIiwiZ2V0UmVjZWl2ZWRUaW1lc3RhbXAiLCJrdkxpbmUiLCJhVHJhbnNmZXIiLCJnZXRBY2NvdW50SW5kZXgiLCJnZXRTdWJhZGRyZXNzSW5kZXgiLCJzZXRCbG9jayIsInNldEhhc2giLCJoYXNoIiwic2V0VmVyc2lvbiIsInZlcnNpb24iLCJzZXRJc01pbmVyVHgiLCJpc01pbmVyVHgiLCJzZXRQYXltZW50SWQiLCJwYXltZW50SWQiLCJzZXRGZWUiLCJmZWUiLCJzZXRSaW5nU2l6ZSIsInJpbmdTaXplIiwic2V0UmVsYXkiLCJyZWxheSIsInNldElzUmVsYXllZCIsImlzUmVsYXllZCIsInNldElzQ29uZmlybWVkIiwiaXNDb25maXJtZWQiLCJzZXRJblR4UG9vbCIsImluVHhQb29sIiwic2V0TnVtQ29uZmlybWF0aW9ucyIsIm51bUNvbmZpcm1hdGlvbnMiLCJzZXRVbmxvY2tUaW1lIiwidW5sb2NrVGltZSIsInNldExhc3RSZWxheWVkVGltZXN0YW1wIiwibGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJzZXRSZWNlaXZlZFRpbWVzdGFtcCIsInJlY2VpdmVkVGltZXN0YW1wIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJpc0RvdWJsZVNwZW5kU2VlbiIsInNldEtleSIsImtleSIsInNldEZ1bGxIZXgiLCJmdWxsSGV4Iiwic2V0UHJ1bmVkSGV4IiwicHJ1bmVkSGV4Iiwic2V0UHJ1bmFibGVIZXgiLCJwcnVuYWJsZUhleCIsInNldFBydW5hYmxlSGFzaCIsInBydW5hYmxlSGFzaCIsInNldFNpemUiLCJzaXplIiwic2V0V2VpZ2h0Iiwid2VpZ2h0Iiwic2V0T3V0cHV0SW5kaWNlcyIsIm91dHB1dEluZGljZXMiLCJzZXRNZXRhZGF0YSIsIm1ldGFkYXRhIiwic2V0RXh0cmEiLCJleHRyYSIsInNldFJjdFNpZ25hdHVyZXMiLCJyY3RTaWduYXR1cmVzIiwic2V0UmN0U2lnUHJ1bmFibGUiLCJyY3RTaWdQcnVuYWJsZSIsInNldElzS2VwdEJ5QmxvY2siLCJpc0tlcHRCeUJsb2NrIiwic2V0SXNGYWlsZWQiLCJpc0ZhaWxlZCIsInNldExhc3RGYWlsZWRIZWlnaHQiLCJsYXN0RmFpbGVkSGVpZ2h0Iiwic2V0TGFzdEZhaWxlZEhhc2giLCJsYXN0RmFpbGVkSGFzaCIsInNldE1heFVzZWRCbG9ja0hlaWdodCIsIm1heFVzZWRCbG9ja0hlaWdodCIsInNldE1heFVzZWRCbG9ja0hhc2giLCJtYXhVc2VkQmxvY2tIYXNoIiwic2V0U2lnbmF0dXJlcyIsInNpZ25hdHVyZXMiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9UeFdhbGxldC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vLi4vY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uLy4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi8uLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbmNvbWluZ1RyYW5zZmVyIGZyb20gXCIuL01vbmVyb0luY29taW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9PdXRnb2luZ1RyYW5zZmVyIGZyb20gXCIuL01vbmVyb091dGdvaW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dCBmcm9tIFwiLi4vLi4vZGFlbW9uL21vZGVsL01vbmVyb091dHB1dFwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFdhbGxldCBmcm9tIFwiLi9Nb25lcm9PdXRwdXRXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlciBmcm9tIFwiLi9Nb25lcm9UcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyUXVlcnkgZnJvbSBcIi4vTW9uZXJvVHJhbnNmZXJRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuLi8uLi9kYWVtb24vbW9kZWwvTW9uZXJvVHhcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9Nb25lcm9UeFNldFwiO1xuXG4vKipcbiAqIE1vZGVscyBhIE1vbmVybyB0cmFuc2FjdGlvbiB3aXRoIHdhbGxldCBleHRlbnNpb25zLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9UeFdhbGxldCBleHRlbmRzIE1vbmVyb1R4IHtcblxuICB0eFNldDogTW9uZXJvVHhTZXQ7XG4gIGlzSW5jb21pbmc6IGJvb2xlYW47XG4gIGlzT3V0Z29pbmc6IGJvb2xlYW47XG4gIGluY29taW5nVHJhbnNmZXJzOiBNb25lcm9JbmNvbWluZ1RyYW5zZmVyW107XG4gIG91dGdvaW5nVHJhbnNmZXI6IE1vbmVyb091dGdvaW5nVHJhbnNmZXI7XG4gIG5vdGU6IHN0cmluZztcbiAgaXNMb2NrZWQ6IGJvb2xlYW47XG4gIGlucHV0U3VtOiBiaWdpbnQ7XG4gIG91dHB1dFN1bTogYmlnaW50O1xuICBjaGFuZ2VBZGRyZXNzOiBzdHJpbmc7XG4gIGNoYW5nZUFtb3VudDogYmlnaW50O1xuICBudW1EdW1teU91dHB1dHM6IG51bWJlcjtcbiAgZXh0cmFIZXg6IHN0cmluZztcbiAgXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgdGhlIG1vZGVsLlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1R4V2FsbGV0Pn0gW3R4XSBpcyBleGlzdGluZyBzdGF0ZSB0byBpbml0aWFsaXplIGZyb20gKG9wdGlvbmFsKVxuICAgKi9cbiAgY29uc3RydWN0b3IodHg/OiBQYXJ0aWFsPE1vbmVyb1R4V2FsbGV0Pikge1xuICAgIHN1cGVyKHR4KTtcbiAgICB0aGlzLnNldFR4U2V0KHRoaXMuZ2V0VHhTZXQoKSk7IC8vIHByZXNlcnZlIHJlZmVyZW5jZSB0byB0eCBzZXRcbiAgICBcbiAgICAvLyBjb3B5IGluY29taW5nIHRyYW5zZmVyc1xuICAgIGlmICh0aGlzLmluY29taW5nVHJhbnNmZXJzKSB7XG4gICAgICB0aGlzLmluY29taW5nVHJhbnNmZXJzID0gdGhpcy5pbmNvbWluZ1RyYW5zZmVycy5zbGljZSgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmluY29taW5nVHJhbnNmZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuaW5jb21pbmdUcmFuc2ZlcnNbaV0gPSBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2Zlcih0aGlzLmluY29taW5nVHJhbnNmZXJzW2ldKS5zZXRUeCh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY29weSBvdXRnb2luZyB0cmFuc2ZlclxuICAgIGlmICh0aGlzLm91dGdvaW5nVHJhbnNmZXIpIHtcbiAgICAgIHRoaXMub3V0Z29pbmdUcmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKHRoaXMub3V0Z29pbmdUcmFuc2Zlcikuc2V0VHgodGhpcyk7XG4gICAgfVxuICAgIFxuICAgIC8vIGNvcHkgaW5wdXRzXG4gICAgaWYgKHRoaXMuaW5wdXRzKSB7XG4gICAgICB0aGlzLmlucHV0cyA9IHRoaXMuaW5wdXRzLnNsaWNlKCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuaW5wdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuaW5wdXRzW2ldID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCh0aGlzLmlucHV0c1tpXSBhcyBNb25lcm9PdXRwdXRXYWxsZXQpLnNldFR4KHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjb3B5IG91dHB1dHNcbiAgICBpZiAodGhpcy5vdXRwdXRzKSB7XG4gICAgICB0aGlzLm91dHB1dHMgPSB0aGlzLm91dHB1dHMuc2xpY2UoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5vdXRwdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMub3V0cHV0c1tpXSA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQodGhpcy5vdXRwdXRzW2ldIGFzIE1vbmVyb091dHB1dFdhbGxldCkuc2V0VHgodGhpcyk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIGJpZ2ludHNcbiAgICBpZiAodGhpcy5pbnB1dFN1bSAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiB0aGlzLmlucHV0U3VtICE9PSBcImJpZ2ludFwiKSB0aGlzLmlucHV0U3VtID0gQmlnSW50KHRoaXMuaW5wdXRTdW0pO1xuICAgIGlmICh0aGlzLm91dHB1dFN1bSAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiB0aGlzLm91dHB1dFN1bSAhPT0gXCJiaWdpbnRcIikgdGhpcy5vdXRwdXRTdW0gPSBCaWdJbnQodGhpcy5vdXRwdXRTdW0pO1xuICAgIGlmICh0aGlzLmNoYW5nZUFtb3VudCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiB0aGlzLmNoYW5nZUFtb3VudCAhPT0gXCJiaWdpbnRcIikgdGhpcy5jaGFuZ2VBbW91bnQgPSBCaWdJbnQodGhpcy5jaGFuZ2VBbW91bnQpO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7YW55fSBqc29uIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgdHhcbiAgICovXG4gIHRvSnNvbigpOiBhbnkge1xuICAgIGxldCBqc29uID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcywgc3VwZXIudG9Kc29uKCkpOyAvLyBtZXJnZSBqc29uIG9udG8gaW5oZXJpdGVkIHN0YXRlXG4gICAgaWYgKHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBqc29uLmluY29taW5nVHJhbnNmZXJzID0gW107XG4gICAgICBmb3IgKGxldCBpbmNvbWluZ1RyYW5zZmVyIG9mIHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkganNvbi5pbmNvbWluZ1RyYW5zZmVycy5wdXNoKGluY29taW5nVHJhbnNmZXIudG9Kc29uKCkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgIT09IHVuZGVmaW5lZCkganNvbi5vdXRnb2luZ1RyYW5zZmVyID0gdGhpcy5nZXRPdXRnb2luZ1RyYW5zZmVyKCkudG9Kc29uKCk7XG4gICAgaWYgKHRoaXMuZ2V0SW5wdXRTdW0oKSAhPT0gdW5kZWZpbmVkKSBqc29uLmlucHV0U3VtID0gdGhpcy5nZXRJbnB1dFN1bSgpLnRvU3RyaW5nKCk7XG4gICAgaWYgKHRoaXMuZ2V0T3V0cHV0U3VtKCkgIT09IHVuZGVmaW5lZCkganNvbi5vdXRwdXRTdW0gPSB0aGlzLmdldE91dHB1dFN1bSgpLnRvU3RyaW5nKCk7XG4gICAgaWYgKHRoaXMuZ2V0Q2hhbmdlQW1vdW50KCkgIT09IHVuZGVmaW5lZCkganNvbi5jaGFuZ2VBbW91bnQgPSB0aGlzLmdldENoYW5nZUFtb3VudCgpLnRvU3RyaW5nKCk7XG4gICAgZGVsZXRlIGpzb24uYmxvY2s7ICAvLyBkbyBub3Qgc2VyaWFsaXplIHBhcmVudCBibG9ja1xuICAgIGRlbGV0ZSBqc29uLnR4U2V0OyAgLy8gZG8gbm90IHNlcmlhbGl6ZSBwYXJlbnQgdHggc2V0XG4gICAgcmV0dXJuIGpzb247XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtNb25lcm9UeFNldH0gdHggc2V0IGNvbnRhaW5pbmcgdHhzXG4gICAqL1xuICBnZXRUeFNldCgpOiBNb25lcm9UeFNldCB7XG4gICAgcmV0dXJuIHRoaXMudHhTZXQ7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9UeFNldH0gdHhTZXQgLSB0eCBzZXQgY29udGFpbmluZyB0eHNcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRUeFNldCh0eFNldDogTW9uZXJvVHhTZXQpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy50eFNldCA9IHR4U2V0O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIHR4IGhhcyBpbmNvbWluZyBmdW5kcywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXRJc0luY29taW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzSW5jb21pbmc7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtib29sZWFufSBpc0luY29taW5nIC0gdHJ1ZSBpZiB0aGUgdHggaGFzIGluY29taW5nIGZ1bmRzLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRJc0luY29taW5nKGlzSW5jb21pbmc6IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5pc0luY29taW5nID0gaXNJbmNvbWluZztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSB0eCBoYXMgb3V0Z29pbmcgZnVuZHMsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0SXNPdXRnb2luZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc091dGdvaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNPdXRnb2luZyAtIHRydWUgaWYgdGhlIHR4IGhhcyBvdXRnb2luZyBmdW5kcywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0SXNPdXRnb2luZyhpc091dGdvaW5nOiBib29sZWFuKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHRoaXMuaXNPdXRnb2luZyA9IGlzT3V0Z29pbmc7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7YmlnaW50fSBhbW91bnQgcmVjZWl2ZWQgaW4gdGhlIHR4XG4gICAqL1xuICBnZXRJbmNvbWluZ0Ftb3VudCgpOiBiaWdpbnQge1xuICAgIGlmICh0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBsZXQgaW5jb21pbmdBbXQgPSAwbjtcbiAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKCkpIGluY29taW5nQW10ID0gaW5jb21pbmdBbXQgKyB0cmFuc2Zlci5nZXRBbW91bnQoKTtcbiAgICByZXR1cm4gaW5jb21pbmdBbXQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7YmlnaW50fSBhbW91bnQgc3BlbnQgaW4gdGhlIHR4XG4gICAqL1xuICBnZXRPdXRnb2luZ0Ftb3VudCgpOiBiaWdpbnQge1xuICAgIHJldHVybiB0aGlzLmdldE91dGdvaW5nVHJhbnNmZXIoKSA/IHRoaXMuZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLmdldEFtb3VudCgpIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7TW9uZXJvVHJhbnNmZXJRdWVyeX0gW3RyYW5zZmVyUXVlcnldIC0gcXVlcnkgdG8gZ2V0IHNwZWNpZmljIHRyYW5zZmVyc1xuICAgKiBAcmV0dXJuIHtNb25lcm9UcmFuc2ZlcltdfSB0cmFuc2ZlcnMgbWF0Y2hpbmcgdGhlIHF1ZXJ5XG4gICAqL1xuICBnZXRUcmFuc2ZlcnModHJhbnNmZXJRdWVyeT86IE1vbmVyb1RyYW5zZmVyUXVlcnkpOiBNb25lcm9UcmFuc2ZlcltdIHtcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgaWYgKHRoaXMuZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICYmICghdHJhbnNmZXJRdWVyeSB8fCB0cmFuc2ZlclF1ZXJ5Lm1lZXRzQ3JpdGVyaWEodGhpcy5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpKSkgdHJhbnNmZXJzLnB1c2godGhpcy5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpO1xuICAgIGlmICh0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdGhpcy5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB7XG4gICAgICAgIGlmICghdHJhbnNmZXJRdWVyeSB8fCB0cmFuc2ZlclF1ZXJ5Lm1lZXRzQ3JpdGVyaWEodHJhbnNmZXIpKSB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9UcmFuc2ZlclF1ZXJ5fSB0cmFuc2ZlclF1ZXJ5IC0gcXVlcnkgdG8ga2VlcCBvbmx5IHNwZWNpZmljIHRyYW5zZmVyc1xuICAgKiBAcmV0dXJuIHtNb25lcm9UcmFuc2ZlcltdfSByZW1haW5pbmcgdHJhbnNmZXJzIG1hdGNoaW5nIHRoZSBxdWVyeVxuICAgKi9cbiAgZmlsdGVyVHJhbnNmZXJzKHRyYW5zZmVyUXVlcnk6IE1vbmVyb1RyYW5zZmVyUXVlcnkpOiBNb25lcm9UcmFuc2ZlcltdIHtcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgXG4gICAgLy8gY29sbGVjdCBvdXRnb2luZyB0cmFuc2ZlciBvciBlcmFzZSBpZiBmaWx0ZXJlZFxuICAgIGlmICh0aGlzLmdldE91dGdvaW5nVHJhbnNmZXIoKSAmJiAoIXRyYW5zZmVyUXVlcnkgfHwgdHJhbnNmZXJRdWVyeS5tZWV0c0NyaXRlcmlhKHRoaXMuZ2V0T3V0Z29pbmdUcmFuc2ZlcigpKSkpIHRyYW5zZmVycy5wdXNoKHRoaXMuZ2V0T3V0Z29pbmdUcmFuc2ZlcigpKTtcbiAgICBlbHNlIHRoaXMuc2V0T3V0Z29pbmdUcmFuc2Zlcih1bmRlZmluZWQpO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgaW5jb21pbmcgdHJhbnNmZXJzIG9yIGVyYXNlIGlmIGZpbHRlcmVkXG4gICAgaWYgKHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgdG9SZW1vdmVzID0gW107XG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKCkpIHtcbiAgICAgICAgaWYgKHRyYW5zZmVyUXVlcnkubWVldHNDcml0ZXJpYSh0cmFuc2ZlcikpIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgICAgZWxzZSB0b1JlbW92ZXMucHVzaCh0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgICB0aGlzLnNldEluY29taW5nVHJhbnNmZXJzKHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKS5maWx0ZXIoZnVuY3Rpb24odHJhbnNmZXIpIHtcbiAgICAgICAgcmV0dXJuICF0b1JlbW92ZXMuaW5jbHVkZXModHJhbnNmZXIpO1xuICAgICAgfSkpO1xuICAgICAgaWYgKHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKS5sZW5ndGggPT09IDApIHRoaXMuc2V0SW5jb21pbmdUcmFuc2ZlcnModW5kZWZpbmVkKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge01vbmVyb0luY29taW5nVHJhbnNmZXJbXX0gaW5jb21pbmcgdHJhbnNmZXJzXG4gICAqL1xuICBnZXRJbmNvbWluZ1RyYW5zZmVycygpOiBNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10ge1xuICAgIHJldHVybiB0aGlzLmluY29taW5nVHJhbnNmZXJzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9JbmNvbWluZ1RyYW5zZmVyW119IGluY29taW5nVHJhbnNmZXJzIC0gaW5jb21pbmcgdHJhbnNmZXJzXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0SW5jb21pbmdUcmFuc2ZlcnMoaW5jb21pbmdUcmFuc2ZlcnM6IE1vbmVyb0luY29taW5nVHJhbnNmZXJbXSk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICB0aGlzLmluY29taW5nVHJhbnNmZXJzID0gaW5jb21pbmdUcmFuc2ZlcnM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtNb25lcm9PdXRnb2luZ1RyYW5zZmVyfSBvdXRnb2luZyB0cmFuc2ZlcnNcbiAgICovXG4gIGdldE91dGdvaW5nVHJhbnNmZXIoKTogTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciB7XG4gICAgcmV0dXJuIHRoaXMub3V0Z29pbmdUcmFuc2ZlcjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7TW9uZXJvT3V0Z29pbmdUcmFuc2Zlcn0gb3V0Z29pbmdUcmFuc2ZlciAtIG91dGdvaW5nIHRyYW5zZmVyXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0T3V0Z29pbmdUcmFuc2ZlcihvdXRnb2luZ1RyYW5zZmVyOiBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHRoaXMub3V0Z29pbmdUcmFuc2ZlciA9IG91dGdvaW5nVHJhbnNmZXI7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9PdXRwdXRXYWxsZXRbXX0gb3V0cHV0UXVlcnkgLSBxdWVyeSB0byBnZXQgc3BlY2lmaWMgaW5wdXRzXG4gICAqIEByZXR1cm4ge01vbmVyb091dHB1dFdhbGxldFtdfSBpbnB1dHMgbWF0Y2hpbmcgdGhlIHF1ZXJ5XG4gICAqL1xuICBnZXRJbnB1dHNXYWxsZXQob3V0cHV0UXVlcnk/OiBNb25lcm9PdXRwdXRRdWVyeSk6IE1vbmVyb091dHB1dFdhbGxldFtdIHtcbiAgICBsZXQgaW5wdXRzOiBNb25lcm9PdXRwdXRXYWxsZXRbXSA9IFtdO1xuICAgIGZvciAobGV0IG91dHB1dCBvZiBzdXBlci5nZXRJbnB1dHMoKSkgaWYgKCFvdXRwdXRRdWVyeSB8fCBvdXRwdXRRdWVyeS5tZWV0c0NyaXRlcmlhKG91dHB1dCBhcyBNb25lcm9PdXRwdXRXYWxsZXQpKSBpbnB1dHMucHVzaChvdXRwdXQgYXMgTW9uZXJvT3V0cHV0V2FsbGV0KTtcbiAgICByZXR1cm4gaW5wdXRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7TW9uZXJvT3V0cHV0V2FsbGV0W119IGlucHV0cyAtIHR4IGlucHV0c1xuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldElucHV0c1dhbGxldChpbnB1dHM6IE1vbmVyb091dHB1dFdhbGxldFtdKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIHRoYXQgYWxsIGlucHV0cyBhcmUgd2FsbGV0IGlucHV0c1xuICAgIGlmIChpbnB1dHMpIHtcbiAgICAgIGZvciAobGV0IG91dHB1dCBvZiBpbnB1dHMpIHtcbiAgICAgICAgaWYgKCEob3V0cHV0IGluc3RhbmNlb2YgTW9uZXJvT3V0cHV0V2FsbGV0KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IHRyYW5zYWN0aW9uIGlucHV0cyBtdXN0IGJlIG9mIHR5cGUgTW9uZXJvT3V0cHV0V2FsbGV0XCIpO1xuICAgICAgfVxuICAgIH1cbiAgICBzdXBlci5zZXRJbnB1dHMoaW5wdXRzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7TW9uZXJvT3V0cHV0UXVlcnl9IFtvdXRwdXRRdWVyeV0gLSBxdWVyeSB0byBnZXQgc3BlY2lmaWMgb3V0cHV0c1xuICAgKiBAcmV0dXJuIHtNb25lcm9PdXRwdXRXYWxsZXRbXX0gb3V0cHV0cyBtYXRjaGluZyB0aGUgcXVlcnlcbiAgICovXG4gIGdldE91dHB1dHNXYWxsZXQob3V0cHV0UXVlcnk/OiBNb25lcm9PdXRwdXRRdWVyeSk6IE1vbmVyb091dHB1dFdhbGxldFtdIHtcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IG91dHB1dCBvZiBzdXBlci5nZXRPdXRwdXRzKCkpIGlmICghb3V0cHV0UXVlcnkgfHwgb3V0cHV0UXVlcnkubWVldHNDcml0ZXJpYShvdXRwdXQgYXMgTW9uZXJvT3V0cHV0V2FsbGV0KSkgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgcmV0dXJuIG91dHB1dHM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge01vbmVyb091dHB1dFdhbGxldFtdfSBvdXRwdXRzIC0gdHggb3V0cHV0c1xuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldE91dHB1dHNXYWxsZXQob3V0cHV0czogTW9uZXJvT3V0cHV0V2FsbGV0W10pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgdGhhdCBhbGwgb3V0cHV0cyBhcmUgd2FsbGV0IG91dHB1dHNcbiAgICBpZiAob3V0cHV0cykge1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIG91dHB1dHMpIHtcbiAgICAgICAgaWYgKCEob3V0cHV0IGluc3RhbmNlb2YgTW9uZXJvT3V0cHV0V2FsbGV0KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IHRyYW5zYWN0aW9uIG91dHB1dHMgbXVzdCBiZSBvZiB0eXBlIE1vbmVyb091dHB1dFdhbGxldFwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgc3VwZXIuc2V0T3V0cHV0cyhvdXRwdXRzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7TW9uZXJvT3V0cHV0UXVlcnl9IG91dHB1dFF1ZXJ5IC0gcXVlcnkgdG8ga2VlcCBvbmx5IHNwZWNpZmljIG91dHB1dHNcbiAgICogQHJldHVybiB7TW9uZXJvVHJhbnNmZXJbXX0gcmVtYWluaW5nIG91dHB1dHMgbWF0Y2hpbmcgdGhlIHF1ZXJ5XG4gICAqL1xuICBmaWx0ZXJPdXRwdXRzKG91dHB1dFF1ZXJ5OiBNb25lcm9PdXRwdXRRdWVyeSk6IE1vbmVyb1RyYW5zZmVyW10ge1xuICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgaWYgKHN1cGVyLmdldE91dHB1dHMoKSkge1xuICAgICAgbGV0IHRvUmVtb3ZlcyA9IFtdO1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHN1cGVyLmdldE91dHB1dHMoKSkge1xuICAgICAgICBpZiAoIW91dHB1dFF1ZXJ5IHx8IG91dHB1dFF1ZXJ5Lm1lZXRzQ3JpdGVyaWEob3V0cHV0IGFzIE1vbmVyb091dHB1dFdhbGxldCkpIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgICBlbHNlIHRvUmVtb3Zlcy5wdXNoKG91dHB1dCk7XG4gICAgICB9XG4gICAgICB0aGlzLnNldE91dHB1dHMoc3VwZXIuZ2V0T3V0cHV0cygpLmZpbHRlcihmdW5jdGlvbihvdXRwdXQpIHtcbiAgICAgICAgcmV0dXJuICF0b1JlbW92ZXMuaW5jbHVkZXMob3V0cHV0KTtcbiAgICAgIH0pKTtcbiAgICAgIGlmICh0aGlzLmdldE91dHB1dHMoKS5sZW5ndGggPT09IDApIHRoaXMuc2V0T3V0cHV0cyh1bmRlZmluZWQpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ30gdHggbm90ZVxuICAgKi9cbiAgZ2V0Tm90ZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLm5vdGU7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbm90ZSAtIHR4IG5vdGVcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXROb3RlKG5vdGU6IHN0cmluZyk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICB0aGlzLm5vdGUgPSBub3RlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgdHggaXMgbG9ja2VkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldElzTG9ja2VkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzTG9ja2VkO1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtib29sZWFufSBpc0xvY2tlZCAtIHRydWUgaWYgdGhlIHR4IGlzIGxvY2tlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0SXNMb2NrZWQoaXNMb2NrZWQ6IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5pc0xvY2tlZCA9IGlzTG9ja2VkO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7YmlnaW50fSBzdW0gb2YgdHggaW5wdXRzXG4gICAqL1xuICBnZXRJbnB1dFN1bSgpOiBiaWdpbnQge1xuICAgIHJldHVybiB0aGlzLmlucHV0U3VtO1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtiaWdpbnR9IGlucHV0U3VtIC0gc3VtIG9mIHR4IGlucHV0c1xuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldElucHV0U3VtKGlucHV0U3VtOiBiaWdpbnQpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5pbnB1dFN1bSA9IGlucHV0U3VtO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7YmlnaW50fSBzdW0gb2YgdHggb3V0cHV0c1xuICAgKi9cbiAgZ2V0T3V0cHV0U3VtKCk6IGJpZ2ludCB7XG4gICAgcmV0dXJuIHRoaXMub3V0cHV0U3VtO1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtiaWdpbnR9IG91dHB1dFN1bSAtIHN1bSBvZiB0eCBvdXRwdXRzXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0T3V0cHV0U3VtKG91dHB1dFN1bTogYmlnaW50KTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHRoaXMub3V0cHV0U3VtID0gb3V0cHV0U3VtO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfSBjaGFuZ2UgYWRkcmVzc1xuICAgKi9cbiAgZ2V0Q2hhbmdlQWRkcmVzcygpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmNoYW5nZUFkZHJlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY2hhbmdlQWRkcmVzcyAtIGNoYW5nZSBhZGRyZXNzXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0Q2hhbmdlQWRkcmVzcyhjaGFuZ2VBZGRyZXNzOiBzdHJpbmcpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5jaGFuZ2VBZGRyZXNzID0gY2hhbmdlQWRkcmVzcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge2JpZ2ludH0gY2hhbmdlIGFtb3VudFxuICAgKi9cbiAgZ2V0Q2hhbmdlQW1vdW50KCk6IGJpZ2ludCB7XG4gICAgcmV0dXJuIHRoaXMuY2hhbmdlQW1vdW50O1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtiaWdpbnR9IGNoYW5nZUFtb3VudCAtIGNoYW5nZSBhbW91bnRcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRDaGFuZ2VBbW91bnQoY2hhbmdlQW1vdW50OiBiaWdpbnQpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5jaGFuZ2VBbW91bnQgPSBjaGFuZ2VBbW91bnQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IG51bWJlciBvZiBkdW1teSBvdXRwdXRzXG4gICAqL1xuICBnZXROdW1EdW1teU91dHB1dHMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5udW1EdW1teU91dHB1dHM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gbnVtRHVtbXlPdXRwdXRzIC0gbnVtYmVyIG9mIGR1bW15IG91dHB1dHNcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXROdW1EdW1teU91dHB1dHMobnVtRHVtbXlPdXRwdXRzOiBudW1iZXIpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5udW1EdW1teU91dHB1dHMgPSBudW1EdW1teU91dHB1dHM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHR4IGV4dHJhIGFzIGhleFxuICAgKi9cbiAgZ2V0RXh0cmFIZXgoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5leHRyYUhleDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBleHRyYUhleCAtIHR4IGV4dHJhIGFzIGhleFxuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldEV4dHJhSGV4KGV4dHJhSGV4OiBzdHJpbmcpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5leHRyYUhleCA9IGV4dHJhSGV4O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IGEgY29weSBvZiB0aGlzIHR4XG4gICAqL1xuICBjb3B5KCk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4V2FsbGV0KHRoaXMpO1xuICB9XG4gIFxuICAvKipcbiAgICogVXBkYXRlcyB0aGlzIHRyYW5zYWN0aW9uIGJ5IG1lcmdpbmcgdGhlIGxhdGVzdCBpbmZvcm1hdGlvbiBmcm9tIHRoZSBnaXZlblxuICAgKiB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIE1lcmdpbmcgY2FuIG1vZGlmeSBvciBidWlsZCByZWZlcmVuY2VzIHRvIHRoZSB0cmFuc2FjdGlvbiBnaXZlbiBzbyBpdFxuICAgKiBzaG91bGQgbm90IGJlIHJlLXVzZWQgb3IgaXQgc2hvdWxkIGJlIGNvcGllZCBiZWZvcmUgY2FsbGluZyB0aGlzIG1ldGhvZC5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhXYWxsZXR9IHR4IC0gdGhlIHRyYW5zYWN0aW9uIHRvIG1lcmdlIGludG8gdGhpcyB0cmFuc2FjdGlvblxuICAgKi9cbiAgbWVyZ2UodHg6IE1vbmVyb1R4V2FsbGV0KTogTW9uZXJvVHhXYWxsZXQge1xuICAgIGFzc2VydCh0eCBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0KTtcbiAgICBpZiAodGhpcyA9PT0gdHgpIHJldHVybiB0aGlzO1xuICAgIFxuICAgIC8vIG1lcmdlIGJhc2UgY2xhc3Nlc1xuICAgIHN1cGVyLm1lcmdlKHR4KTtcbiAgICBcbiAgICAvLyBtZXJnZSB0eCBzZXQgaWYgdGhleSdyZSBkaWZmZXJlbnQgd2hpY2ggY29tZXMgYmFjayB0byBtZXJnaW5nIHR4c1xuICAgIC8vaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuL01vbmVyb1R4U2V0XCI7XG4gICAgaWYgKHRoaXMuZ2V0VHhTZXQoKSAhPT0gdHguZ2V0VHhTZXQoKSkge1xuICAgICAgaWYgKHRoaXMuZ2V0VHhTZXQoKSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5zZXRUeFNldChuZXcgTW9uZXJvVHhTZXQoKS5zZXRUeHMoW3RoaXNdKSk7XG4gICAgICB9XG4gICAgICBpZiAodHguZ2V0VHhTZXQoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHR4LnNldFR4U2V0KG5ldyBNb25lcm9UeFNldCgpLnNldFR4cyhbdHhdKSk7XG4gICAgICB9XG4gICAgICB0aGlzLmdldFR4U2V0KCkubWVyZ2UodHguZ2V0VHhTZXQoKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLy8gbWVyZ2UgaW5jb21pbmcgdHJhbnNmZXJzXG4gICAgaWYgKHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkpIHtcbiAgICAgIGlmICh0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKCkgPT09IHVuZGVmaW5lZCkgdGhpcy5zZXRJbmNvbWluZ1RyYW5zZmVycyhbXSk7XG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB7XG4gICAgICAgIHRyYW5zZmVyLnNldFR4KHRoaXMpO1xuICAgICAgICBNb25lcm9UeFdhbGxldC5tZXJnZUluY29taW5nVHJhbnNmZXIodGhpcy5nZXRJbmNvbWluZ1RyYW5zZmVycygpLCB0cmFuc2Zlcik7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIG1lcmdlIG91dGdvaW5nIHRyYW5zZmVyXG4gICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSkge1xuICAgICAgdHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnNldFR4KHRoaXMpO1xuICAgICAgaWYgKHRoaXMuZ2V0T3V0Z29pbmdUcmFuc2ZlcigpID09PSB1bmRlZmluZWQpIHRoaXMuc2V0T3V0Z29pbmdUcmFuc2Zlcih0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpO1xuICAgICAgZWxzZSB0aGlzLmdldE91dGdvaW5nVHJhbnNmZXIoKS5tZXJnZSh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpO1xuICAgIH1cbiAgICBcbiAgICAvLyBtZXJnZSBzaW1wbGUgZXh0ZW5zaW9uc1xuICAgIHRoaXMuc2V0SXNJbmNvbWluZyhHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRJc0luY29taW5nKCksIHR4LmdldElzSW5jb21pbmcoKSwge3Jlc29sdmVUcnVlOiB0cnVlfSkpOyAgLy8gb3V0cHV0cyBzZWVuIG9uIGNvbmZpcm1hdGlvblxuICAgIHRoaXMuc2V0SXNPdXRnb2luZyhHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRJc091dGdvaW5nKCksIHR4LmdldElzT3V0Z29pbmcoKSkpO1xuICAgIHRoaXMuc2V0Tm90ZShHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXROb3RlKCksIHR4LmdldE5vdGUoKSkpO1xuICAgIHRoaXMuc2V0SXNMb2NrZWQoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0SXNMb2NrZWQoKSwgdHguZ2V0SXNMb2NrZWQoKSwge3Jlc29sdmVUcnVlOiBmYWxzZX0pKTsgLy8gdHggY2FuIGJlY29tZSB1bmxvY2tlZFxuICAgIHRoaXMuc2V0SW5wdXRTdW0oR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0SW5wdXRTdW0oKSwgdHguZ2V0SW5wdXRTdW0oKSkpO1xuICAgIHRoaXMuc2V0T3V0cHV0U3VtKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldE91dHB1dFN1bSgpLCB0eC5nZXRPdXRwdXRTdW0oKSkpO1xuICAgIHRoaXMuc2V0Q2hhbmdlQWRkcmVzcyhHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRDaGFuZ2VBZGRyZXNzKCksIHR4LmdldENoYW5nZUFkZHJlc3MoKSkpO1xuICAgIHRoaXMuc2V0Q2hhbmdlQW1vdW50KEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldENoYW5nZUFtb3VudCgpLCB0eC5nZXRDaGFuZ2VBbW91bnQoKSkpO1xuICAgIHRoaXMuc2V0TnVtRHVtbXlPdXRwdXRzKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldE51bUR1bW15T3V0cHV0cygpLCB0eC5nZXROdW1EdW1teU91dHB1dHMoKSkpO1xuICAgIHRoaXMuc2V0RXh0cmFIZXgoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0RXh0cmFIZXgoKSwgdHguZ2V0RXh0cmFIZXgoKSkpO1xuICAgIFxuICAgIHJldHVybiB0aGlzOyAgLy8gZm9yIGNoYWluaW5nXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gW2luZGVudF0gLSBzdGFydGluZyBpbmRlbnRhdGlvblxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvbmVMaW5lXSAtIHN0cmluZyBpcyBvbmUgbGluZSBpZiB0cnVlLCBtdWx0aXBsZSBsaW5lcyBpZiBmYWxzZVxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGlzIHR4XG4gICAqL1xuICB0b1N0cmluZyhpbmRlbnQgPSAwLCBvbmVMaW5lID0gZmFsc2UpOiBzdHJpbmcge1xuICAgIGxldCBzdHIgPSBcIlwiO1xuICAgIFxuICAgIC8vIHJlcHJlc2VudCB0eCB3aXRoIG9uZSBsaW5lIHN0cmluZ1xuICAgIC8vIFRPRE86IHByb3BlciBjc3YgZXhwb3J0XG4gICAgaWYgKG9uZUxpbmUpIHtcbiAgICAgIHN0ciArPSB0aGlzLmdldEhhc2goKSArIFwiLCBcIjtcbiAgICAgIHN0ciArPSAodGhpcy5nZXRJc0NvbmZpcm1lZCgpID8gdGhpcy5nZXRCbG9jaygpLmdldFRpbWVzdGFtcCgpIDogdGhpcy5nZXRSZWNlaXZlZFRpbWVzdGFtcCgpKSArIFwiLCBcIjtcbiAgICAgIHN0ciArPSB0aGlzLmdldElzQ29uZmlybWVkKCkgKyBcIiwgXCI7XG4gICAgICBzdHIgKz0gKHRoaXMuZ2V0T3V0Z29pbmdBbW91bnQoKSA/IHRoaXMuZ2V0T3V0Z29pbmdBbW91bnQoKS50b1N0cmluZygpIDogXCJcIikgKyBcIiwgXCI7XG4gICAgICBzdHIgKz0gdGhpcy5nZXRJbmNvbWluZ0Ftb3VudCgpID8gdGhpcy5nZXRJbmNvbWluZ0Ftb3VudCgpLnRvU3RyaW5nKCkgOiBcIlwiO1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgXG4gICAgLy8gb3RoZXJ3aXNlIHN0cmluZ2lmeSBhbGwgZmllbGRzXG4gICAgc3RyICs9IHN1cGVyLnRvU3RyaW5nKGluZGVudCkgKyBcIlxcblwiO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJJcyBpbmNvbWluZ1wiLCB0aGlzLmdldElzSW5jb21pbmcoKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiSW5jb21pbmcgYW1vdW50XCIsIHRoaXMuZ2V0SW5jb21pbmdBbW91bnQoKSwgaW5kZW50KTtcbiAgICBpZiAodGhpcy5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJJbmNvbWluZyB0cmFuc2ZlcnNcIiwgXCJcIiwgaW5kZW50KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5nZXRJbmNvbWluZ1RyYW5zZmVycygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoaSArIDEsIFwiXCIsIGluZGVudCArIDEpO1xuICAgICAgICBzdHIgKz0gdGhpcy5nZXRJbmNvbWluZ1RyYW5zZmVycygpW2ldLnRvU3RyaW5nKGluZGVudCArIDIpICsgXCJcXG5cIjtcbiAgICAgIH1cbiAgICB9XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIklzIG91dGdvaW5nXCIsIHRoaXMuZ2V0SXNPdXRnb2luZygpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJPdXRnb2luZyBhbW91bnRcIiwgdGhpcy5nZXRPdXRnb2luZ0Ftb3VudCgpLCBpbmRlbnQpO1xuICAgIGlmICh0aGlzLmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiT3V0Z29pbmcgdHJhbnNmZXJcIiwgXCJcIiwgaW5kZW50KTtcbiAgICAgIHN0ciArPSB0aGlzLmdldE91dGdvaW5nVHJhbnNmZXIoKS50b1N0cmluZyhpbmRlbnQgKyAxKSArIFwiXFxuXCI7XG4gICAgfVxuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJOb3RlXCIsIHRoaXMuZ2V0Tm90ZSgpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJJcyBsb2NrZWRcIiwgdGhpcy5nZXRJc0xvY2tlZCgpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJJbnB1dCBzdW1cIiwgdGhpcy5nZXRJbnB1dFN1bSgpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJPdXRwdXQgc3VtXCIsIHRoaXMuZ2V0T3V0cHV0U3VtKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIkNoYW5nZSBhZGRyZXNzXCIsIHRoaXMuZ2V0Q2hhbmdlQWRkcmVzcygpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJDaGFuZ2UgYW1vdW50XCIsIHRoaXMuZ2V0Q2hhbmdlQW1vdW50KCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIk51bSBkdW1teSBvdXRwdXRzXCIsIHRoaXMuZ2V0TnVtRHVtbXlPdXRwdXRzKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIkV4dHJhIGhleFwiLCB0aGlzLmdldEV4dHJhSGV4KCksIGluZGVudCk7XG4gICAgcmV0dXJuIHN0ci5zbGljZSgwLCBzdHIubGVuZ3RoIC0gMSk7ICAvLyBzdHJpcCBsYXN0IG5ld2xpbmVcbiAgfVxuICBcbiAgLy8gcHJpdmF0ZSBoZWxwZXIgdG8gbWVyZ2UgdHJhbnNmZXJzXG4gIHByb3RlY3RlZCBzdGF0aWMgbWVyZ2VJbmNvbWluZ1RyYW5zZmVyKHRyYW5zZmVycywgdHJhbnNmZXIpIHtcbiAgICBmb3IgKGxldCBhVHJhbnNmZXIgb2YgdHJhbnNmZXJzKSB7XG4gICAgICBpZiAoYVRyYW5zZmVyLmdldEFjY291bnRJbmRleCgpID09PSB0cmFuc2Zlci5nZXRBY2NvdW50SW5kZXgoKSAmJiBhVHJhbnNmZXIuZ2V0U3ViYWRkcmVzc0luZGV4KCkgPT09IHRyYW5zZmVyLmdldFN1YmFkZHJlc3NJbmRleCgpKSB7XG4gICAgICAgIGFUcmFuc2Zlci5tZXJnZSh0cmFuc2Zlcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0gT1ZFUlJJREUgQ09WQVJJQU5UIFJFVFVSTiBUWVBFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzZXRCbG9jayhibG9jazogTW9uZXJvQmxvY2spOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0QmxvY2soYmxvY2spO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0SGFzaChoYXNoOiBzdHJpbmcpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0SGFzaChoYXNoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFZlcnNpb24odmVyc2lvbjogbnVtYmVyKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFZlcnNpb24odmVyc2lvbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRJc01pbmVyVHgoaXNNaW5lclR4OiBib29sZWFuKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldElzTWluZXJUeChpc01pbmVyVHgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UGF5bWVudElkKHBheW1lbnRJZDogc3RyaW5nKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFBheW1lbnRJZChwYXltZW50SWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0RmVlKGZlZTogYmlnaW50KTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldEZlZShmZWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UmluZ1NpemUocmluZ1NpemU6IG51bWJlcik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRSaW5nU2l6ZShyaW5nU2l6ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRSZWxheShyZWxheTogYm9vbGVhbik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRSZWxheShyZWxheSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRJc1JlbGF5ZWQoaXNSZWxheWVkOiBib29sZWFuKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldElzUmVsYXllZChpc1JlbGF5ZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0SXNDb25maXJtZWQoaXNDb25maXJtZWQ6IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0SXNDb25maXJtZWQoaXNDb25maXJtZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0SW5UeFBvb2woaW5UeFBvb2w6IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0SW5UeFBvb2woaW5UeFBvb2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0TnVtQ29uZmlybWF0aW9ucyhudW1Db25maXJtYXRpb25zOiBudW1iZXIpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0TnVtQ29uZmlybWF0aW9ucyhudW1Db25maXJtYXRpb25zKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFVubG9ja1RpbWUodW5sb2NrVGltZTogYmlnaW50KTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFVubG9ja1RpbWUodW5sb2NrVGltZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRMYXN0UmVsYXllZFRpbWVzdGFtcChsYXN0UmVsYXllZFRpbWVzdGFtcDogbnVtYmVyKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldExhc3RSZWxheWVkVGltZXN0YW1wKGxhc3RSZWxheWVkVGltZXN0YW1wKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFJlY2VpdmVkVGltZXN0YW1wKHJlY2VpdmVkVGltZXN0YW1wOiBudW1iZXIpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0UmVjZWl2ZWRUaW1lc3RhbXAocmVjZWl2ZWRUaW1lc3RhbXApO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0SXNEb3VibGVTcGVuZFNlZW4oaXNEb3VibGVTcGVuZFNlZW46IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0SXNEb3VibGVTcGVuZFNlZW4oaXNEb3VibGVTcGVuZFNlZW4pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0S2V5KGtleTogc3RyaW5nKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldEtleShrZXkpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0RnVsbEhleChmdWxsSGV4OiBzdHJpbmcpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0RnVsbEhleChmdWxsSGV4KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFBydW5lZEhleChwcnVuZWRIZXg6IHN0cmluZyk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRQcnVuZWRIZXgocHJ1bmVkSGV4KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFBydW5hYmxlSGV4KHBydW5hYmxlSGV4OiBzdHJpbmcpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0UHJ1bmFibGVIZXgocHJ1bmFibGVIZXgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UHJ1bmFibGVIYXNoKHBydW5hYmxlSGFzaDogc3RyaW5nKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFBydW5hYmxlSGFzaChwcnVuYWJsZUhhc2gpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0U2l6ZShzaXplOiBudW1iZXIpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0U2l6ZShzaXplKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFdlaWdodCh3ZWlnaHQ6IG51bWJlcik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRXZWlnaHQod2VpZ2h0KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldElucHV0cyhpbnB1dHM6IE1vbmVyb091dHB1dFtdKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldElucHV0cyhpbnB1dHMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0T3V0cHV0cyhvdXRwdXRzOiBNb25lcm9PdXRwdXRbXSk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRPdXRwdXRzKG91dHB1dHMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0T3V0cHV0SW5kaWNlcyhvdXRwdXRJbmRpY2VzOiBudW1iZXJbXSk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRPdXRwdXRJbmRpY2VzKG91dHB1dEluZGljZXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0TWV0YWRhdGEobWV0YWRhdGE6IHN0cmluZyk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRNZXRhZGF0YShtZXRhZGF0YSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRFeHRyYShleHRyYTogVWludDhBcnJheSk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRFeHRyYShleHRyYSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRSY3RTaWduYXR1cmVzKHJjdFNpZ25hdHVyZXM6IGFueSk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRSY3RTaWduYXR1cmVzKHJjdFNpZ25hdHVyZXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UmN0U2lnUHJ1bmFibGUocmN0U2lnUHJ1bmFibGU6IGFueSk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRSY3RTaWdQcnVuYWJsZShyY3RTaWdQcnVuYWJsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRJc0tlcHRCeUJsb2NrKGlzS2VwdEJ5QmxvY2s6IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0SXNLZXB0QnlCbG9jayhpc0tlcHRCeUJsb2NrKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldElzRmFpbGVkKGlzRmFpbGVkOiBib29sZWFuKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldElzRmFpbGVkKGlzRmFpbGVkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldExhc3RGYWlsZWRIZWlnaHQobGFzdEZhaWxlZEhlaWdodDogbnVtYmVyKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldExhc3RGYWlsZWRIZWlnaHQobGFzdEZhaWxlZEhlaWdodCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRMYXN0RmFpbGVkSGFzaChsYXN0RmFpbGVkSGFzaDogc3RyaW5nKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldExhc3RGYWlsZWRIYXNoKGxhc3RGYWlsZWRIYXNoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldE1heFVzZWRCbG9ja0hlaWdodChtYXhVc2VkQmxvY2tIZWlnaHQ6IG51bWJlcik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRNYXhVc2VkQmxvY2tIZWlnaHQobWF4VXNlZEJsb2NrSGVpZ2h0KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldE1heFVzZWRCbG9ja0hhc2gobWF4VXNlZEJsb2NrSGFzaDogc3RyaW5nKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldE1heFVzZWRCbG9ja0hhc2gobWF4VXNlZEJsb2NrSGFzaCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRTaWduYXR1cmVzKHNpZ25hdHVyZXM6IHN0cmluZ1tdKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFNpZ25hdHVyZXMoc2lnbmF0dXJlcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBRSxZQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7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