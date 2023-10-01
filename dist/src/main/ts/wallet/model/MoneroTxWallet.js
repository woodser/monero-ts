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
    let incomingAmt = BigInt("0");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiX01vbmVyb091dHB1dFdhbGxldCIsIl9Nb25lcm9UeCIsIl9Nb25lcm9UeFNldCIsIk1vbmVyb1R4V2FsbGV0IiwiTW9uZXJvVHgiLCJjb25zdHJ1Y3RvciIsInR4Iiwic2V0VHhTZXQiLCJnZXRUeFNldCIsImluY29taW5nVHJhbnNmZXJzIiwic2xpY2UiLCJpIiwibGVuZ3RoIiwiTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsInNldFR4Iiwib3V0Z29pbmdUcmFuc2ZlciIsIk1vbmVyb091dGdvaW5nVHJhbnNmZXIiLCJpbnB1dHMiLCJNb25lcm9PdXRwdXRXYWxsZXQiLCJvdXRwdXRzIiwiaW5wdXRTdW0iLCJ1bmRlZmluZWQiLCJCaWdJbnQiLCJvdXRwdXRTdW0iLCJjaGFuZ2VBbW91bnQiLCJ0b0pzb24iLCJqc29uIiwiT2JqZWN0IiwiYXNzaWduIiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJpbmNvbWluZ1RyYW5zZmVyIiwicHVzaCIsImdldE91dGdvaW5nVHJhbnNmZXIiLCJnZXRJbnB1dFN1bSIsInRvU3RyaW5nIiwiZ2V0T3V0cHV0U3VtIiwiZ2V0Q2hhbmdlQW1vdW50IiwiYmxvY2siLCJ0eFNldCIsImdldElzSW5jb21pbmciLCJpc0luY29taW5nIiwic2V0SXNJbmNvbWluZyIsImdldElzT3V0Z29pbmciLCJpc091dGdvaW5nIiwic2V0SXNPdXRnb2luZyIsImdldEluY29taW5nQW1vdW50IiwiaW5jb21pbmdBbXQiLCJ0cmFuc2ZlciIsImdldEFtb3VudCIsImdldE91dGdvaW5nQW1vdW50IiwiZ2V0VHJhbnNmZXJzIiwidHJhbnNmZXJRdWVyeSIsInRyYW5zZmVycyIsIm1lZXRzQ3JpdGVyaWEiLCJmaWx0ZXJUcmFuc2ZlcnMiLCJzZXRPdXRnb2luZ1RyYW5zZmVyIiwidG9SZW1vdmVzIiwic2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJmaWx0ZXIiLCJpbmNsdWRlcyIsImdldElucHV0c1dhbGxldCIsIm91dHB1dFF1ZXJ5Iiwib3V0cHV0IiwiZ2V0SW5wdXRzIiwic2V0SW5wdXRzV2FsbGV0IiwiTW9uZXJvRXJyb3IiLCJzZXRJbnB1dHMiLCJnZXRPdXRwdXRzV2FsbGV0IiwiZ2V0T3V0cHV0cyIsInNldE91dHB1dHNXYWxsZXQiLCJzZXRPdXRwdXRzIiwiZmlsdGVyT3V0cHV0cyIsImdldE5vdGUiLCJub3RlIiwic2V0Tm90ZSIsImdldElzTG9ja2VkIiwiaXNMb2NrZWQiLCJzZXRJc0xvY2tlZCIsInNldElucHV0U3VtIiwic2V0T3V0cHV0U3VtIiwiZ2V0Q2hhbmdlQWRkcmVzcyIsImNoYW5nZUFkZHJlc3MiLCJzZXRDaGFuZ2VBZGRyZXNzIiwic2V0Q2hhbmdlQW1vdW50IiwiZ2V0TnVtRHVtbXlPdXRwdXRzIiwibnVtRHVtbXlPdXRwdXRzIiwic2V0TnVtRHVtbXlPdXRwdXRzIiwiZ2V0RXh0cmFIZXgiLCJleHRyYUhleCIsInNldEV4dHJhSGV4IiwiY29weSIsIm1lcmdlIiwiYXNzZXJ0IiwiTW9uZXJvVHhTZXQiLCJzZXRUeHMiLCJtZXJnZUluY29taW5nVHJhbnNmZXIiLCJHZW5VdGlscyIsInJlY29uY2lsZSIsInJlc29sdmVUcnVlIiwiaW5kZW50Iiwib25lTGluZSIsInN0ciIsImdldEhhc2giLCJnZXRJc0NvbmZpcm1lZCIsImdldEJsb2NrIiwiZ2V0VGltZXN0YW1wIiwiZ2V0UmVjZWl2ZWRUaW1lc3RhbXAiLCJrdkxpbmUiLCJhVHJhbnNmZXIiLCJnZXRBY2NvdW50SW5kZXgiLCJnZXRTdWJhZGRyZXNzSW5kZXgiLCJzZXRCbG9jayIsInNldEhhc2giLCJoYXNoIiwic2V0VmVyc2lvbiIsInZlcnNpb24iLCJzZXRJc01pbmVyVHgiLCJpc01pbmVyVHgiLCJzZXRQYXltZW50SWQiLCJwYXltZW50SWQiLCJzZXRGZWUiLCJmZWUiLCJzZXRSaW5nU2l6ZSIsInJpbmdTaXplIiwic2V0UmVsYXkiLCJyZWxheSIsInNldElzUmVsYXllZCIsImlzUmVsYXllZCIsInNldElzQ29uZmlybWVkIiwiaXNDb25maXJtZWQiLCJzZXRJblR4UG9vbCIsImluVHhQb29sIiwic2V0TnVtQ29uZmlybWF0aW9ucyIsIm51bUNvbmZpcm1hdGlvbnMiLCJzZXRVbmxvY2tUaW1lIiwidW5sb2NrVGltZSIsInNldExhc3RSZWxheWVkVGltZXN0YW1wIiwibGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJzZXRSZWNlaXZlZFRpbWVzdGFtcCIsInJlY2VpdmVkVGltZXN0YW1wIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJpc0RvdWJsZVNwZW5kU2VlbiIsInNldEtleSIsImtleSIsInNldEZ1bGxIZXgiLCJmdWxsSGV4Iiwic2V0UHJ1bmVkSGV4IiwicHJ1bmVkSGV4Iiwic2V0UHJ1bmFibGVIZXgiLCJwcnVuYWJsZUhleCIsInNldFBydW5hYmxlSGFzaCIsInBydW5hYmxlSGFzaCIsInNldFNpemUiLCJzaXplIiwic2V0V2VpZ2h0Iiwid2VpZ2h0Iiwic2V0T3V0cHV0SW5kaWNlcyIsIm91dHB1dEluZGljZXMiLCJzZXRNZXRhZGF0YSIsIm1ldGFkYXRhIiwic2V0RXh0cmEiLCJleHRyYSIsInNldFJjdFNpZ25hdHVyZXMiLCJyY3RTaWduYXR1cmVzIiwic2V0UmN0U2lnUHJ1bmFibGUiLCJyY3RTaWdQcnVuYWJsZSIsInNldElzS2VwdEJ5QmxvY2siLCJpc0tlcHRCeUJsb2NrIiwic2V0SXNGYWlsZWQiLCJpc0ZhaWxlZCIsInNldExhc3RGYWlsZWRIZWlnaHQiLCJsYXN0RmFpbGVkSGVpZ2h0Iiwic2V0TGFzdEZhaWxlZEhhc2giLCJsYXN0RmFpbGVkSGFzaCIsInNldE1heFVzZWRCbG9ja0hlaWdodCIsIm1heFVzZWRCbG9ja0hlaWdodCIsInNldE1heFVzZWRCbG9ja0hhc2giLCJtYXhVc2VkQmxvY2tIYXNoIiwic2V0U2lnbmF0dXJlcyIsInNpZ25hdHVyZXMiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9UeFdhbGxldC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vLi4vY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uLy4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi8uLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbmNvbWluZ1RyYW5zZmVyIGZyb20gXCIuL01vbmVyb0luY29taW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9PdXRnb2luZ1RyYW5zZmVyIGZyb20gXCIuL01vbmVyb091dGdvaW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dCBmcm9tIFwiLi4vLi4vZGFlbW9uL21vZGVsL01vbmVyb091dHB1dFwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFdhbGxldCBmcm9tIFwiLi9Nb25lcm9PdXRwdXRXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlciBmcm9tIFwiLi9Nb25lcm9UcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyUXVlcnkgZnJvbSBcIi4vTW9uZXJvVHJhbnNmZXJRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuLi8uLi9kYWVtb24vbW9kZWwvTW9uZXJvVHhcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9Nb25lcm9UeFNldFwiO1xuXG4vKipcbiAqIE1vZGVscyBhIE1vbmVybyB0cmFuc2FjdGlvbiB3aXRoIHdhbGxldCBleHRlbnNpb25zLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9UeFdhbGxldCBleHRlbmRzIE1vbmVyb1R4IHtcblxuICB0eFNldDogTW9uZXJvVHhTZXQ7XG4gIGlzSW5jb21pbmc6IGJvb2xlYW47XG4gIGlzT3V0Z29pbmc6IGJvb2xlYW47XG4gIGluY29taW5nVHJhbnNmZXJzOiBNb25lcm9JbmNvbWluZ1RyYW5zZmVyW107XG4gIG91dGdvaW5nVHJhbnNmZXI6IE1vbmVyb091dGdvaW5nVHJhbnNmZXI7XG4gIG5vdGU6IHN0cmluZztcbiAgaXNMb2NrZWQ6IGJvb2xlYW47XG4gIGlucHV0U3VtOiBiaWdpbnQ7XG4gIG91dHB1dFN1bTogYmlnaW50O1xuICBjaGFuZ2VBZGRyZXNzOiBzdHJpbmc7XG4gIGNoYW5nZUFtb3VudDogYmlnaW50O1xuICBudW1EdW1teU91dHB1dHM6IG51bWJlcjtcbiAgZXh0cmFIZXg6IHN0cmluZztcbiAgXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgdGhlIG1vZGVsLlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1R4V2FsbGV0Pn0gW3R4XSBpcyBleGlzdGluZyBzdGF0ZSB0byBpbml0aWFsaXplIGZyb20gKG9wdGlvbmFsKVxuICAgKi9cbiAgY29uc3RydWN0b3IodHg/OiBQYXJ0aWFsPE1vbmVyb1R4V2FsbGV0Pikge1xuICAgIHN1cGVyKHR4KTtcbiAgICB0aGlzLnNldFR4U2V0KHRoaXMuZ2V0VHhTZXQoKSk7IC8vIHByZXNlcnZlIHJlZmVyZW5jZSB0byB0eCBzZXRcbiAgICBcbiAgICAvLyBjb3B5IGluY29taW5nIHRyYW5zZmVyc1xuICAgIGlmICh0aGlzLmluY29taW5nVHJhbnNmZXJzKSB7XG4gICAgICB0aGlzLmluY29taW5nVHJhbnNmZXJzID0gdGhpcy5pbmNvbWluZ1RyYW5zZmVycy5zbGljZSgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmluY29taW5nVHJhbnNmZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuaW5jb21pbmdUcmFuc2ZlcnNbaV0gPSBuZXcgTW9uZXJvSW5jb21pbmdUcmFuc2Zlcih0aGlzLmluY29taW5nVHJhbnNmZXJzW2ldKS5zZXRUeCh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY29weSBvdXRnb2luZyB0cmFuc2ZlclxuICAgIGlmICh0aGlzLm91dGdvaW5nVHJhbnNmZXIpIHtcbiAgICAgIHRoaXMub3V0Z29pbmdUcmFuc2ZlciA9IG5ldyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyKHRoaXMub3V0Z29pbmdUcmFuc2Zlcikuc2V0VHgodGhpcyk7XG4gICAgfVxuICAgIFxuICAgIC8vIGNvcHkgaW5wdXRzXG4gICAgaWYgKHRoaXMuaW5wdXRzKSB7XG4gICAgICB0aGlzLmlucHV0cyA9IHRoaXMuaW5wdXRzLnNsaWNlKCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuaW5wdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuaW5wdXRzW2ldID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCh0aGlzLmlucHV0c1tpXSBhcyBNb25lcm9PdXRwdXRXYWxsZXQpLnNldFR4KHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjb3B5IG91dHB1dHNcbiAgICBpZiAodGhpcy5vdXRwdXRzKSB7XG4gICAgICB0aGlzLm91dHB1dHMgPSB0aGlzLm91dHB1dHMuc2xpY2UoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5vdXRwdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMub3V0cHV0c1tpXSA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQodGhpcy5vdXRwdXRzW2ldIGFzIE1vbmVyb091dHB1dFdhbGxldCkuc2V0VHgodGhpcyk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIGJpZ2ludHNcbiAgICBpZiAodGhpcy5pbnB1dFN1bSAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiB0aGlzLmlucHV0U3VtICE9PSBcImJpZ2ludFwiKSB0aGlzLmlucHV0U3VtID0gQmlnSW50KHRoaXMuaW5wdXRTdW0pO1xuICAgIGlmICh0aGlzLm91dHB1dFN1bSAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiB0aGlzLm91dHB1dFN1bSAhPT0gXCJiaWdpbnRcIikgdGhpcy5vdXRwdXRTdW0gPSBCaWdJbnQodGhpcy5vdXRwdXRTdW0pO1xuICAgIGlmICh0aGlzLmNoYW5nZUFtb3VudCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiB0aGlzLmNoYW5nZUFtb3VudCAhPT0gXCJiaWdpbnRcIikgdGhpcy5jaGFuZ2VBbW91bnQgPSBCaWdJbnQodGhpcy5jaGFuZ2VBbW91bnQpO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7YW55fSBqc29uIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgdHhcbiAgICovXG4gIHRvSnNvbigpOiBhbnkge1xuICAgIGxldCBqc29uID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcywgc3VwZXIudG9Kc29uKCkpOyAvLyBtZXJnZSBqc29uIG9udG8gaW5oZXJpdGVkIHN0YXRlXG4gICAgaWYgKHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBqc29uLmluY29taW5nVHJhbnNmZXJzID0gW107XG4gICAgICBmb3IgKGxldCBpbmNvbWluZ1RyYW5zZmVyIG9mIHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkganNvbi5pbmNvbWluZ1RyYW5zZmVycy5wdXNoKGluY29taW5nVHJhbnNmZXIudG9Kc29uKCkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgIT09IHVuZGVmaW5lZCkganNvbi5vdXRnb2luZ1RyYW5zZmVyID0gdGhpcy5nZXRPdXRnb2luZ1RyYW5zZmVyKCkudG9Kc29uKCk7XG4gICAgaWYgKHRoaXMuZ2V0SW5wdXRTdW0oKSAhPT0gdW5kZWZpbmVkKSBqc29uLmlucHV0U3VtID0gdGhpcy5nZXRJbnB1dFN1bSgpLnRvU3RyaW5nKCk7XG4gICAgaWYgKHRoaXMuZ2V0T3V0cHV0U3VtKCkgIT09IHVuZGVmaW5lZCkganNvbi5vdXRwdXRTdW0gPSB0aGlzLmdldE91dHB1dFN1bSgpLnRvU3RyaW5nKCk7XG4gICAgaWYgKHRoaXMuZ2V0Q2hhbmdlQW1vdW50KCkgIT09IHVuZGVmaW5lZCkganNvbi5jaGFuZ2VBbW91bnQgPSB0aGlzLmdldENoYW5nZUFtb3VudCgpLnRvU3RyaW5nKCk7XG4gICAgZGVsZXRlIGpzb24uYmxvY2s7ICAvLyBkbyBub3Qgc2VyaWFsaXplIHBhcmVudCBibG9ja1xuICAgIGRlbGV0ZSBqc29uLnR4U2V0OyAgLy8gZG8gbm90IHNlcmlhbGl6ZSBwYXJlbnQgdHggc2V0XG4gICAgcmV0dXJuIGpzb247XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtNb25lcm9UeFNldH0gdHggc2V0IGNvbnRhaW5pbmcgdHhzXG4gICAqL1xuICBnZXRUeFNldCgpOiBNb25lcm9UeFNldCB7XG4gICAgcmV0dXJuIHRoaXMudHhTZXQ7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9UeFNldH0gdHhTZXQgLSB0eCBzZXQgY29udGFpbmluZyB0eHNcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRUeFNldCh0eFNldDogTW9uZXJvVHhTZXQpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy50eFNldCA9IHR4U2V0O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIHR4IGhhcyBpbmNvbWluZyBmdW5kcywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXRJc0luY29taW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzSW5jb21pbmc7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtib29sZWFufSBpc0luY29taW5nIC0gdHJ1ZSBpZiB0aGUgdHggaGFzIGluY29taW5nIGZ1bmRzLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRJc0luY29taW5nKGlzSW5jb21pbmc6IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5pc0luY29taW5nID0gaXNJbmNvbWluZztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSB0eCBoYXMgb3V0Z29pbmcgZnVuZHMsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0SXNPdXRnb2luZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc091dGdvaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNPdXRnb2luZyAtIHRydWUgaWYgdGhlIHR4IGhhcyBvdXRnb2luZyBmdW5kcywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0SXNPdXRnb2luZyhpc091dGdvaW5nOiBib29sZWFuKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHRoaXMuaXNPdXRnb2luZyA9IGlzT3V0Z29pbmc7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7YmlnaW50fSBhbW91bnQgcmVjZWl2ZWQgaW4gdGhlIHR4XG4gICAqL1xuICBnZXRJbmNvbWluZ0Ftb3VudCgpOiBiaWdpbnQge1xuICAgIGlmICh0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBsZXQgaW5jb21pbmdBbXQgPSBCaWdJbnQoXCIwXCIpO1xuICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkgaW5jb21pbmdBbXQgPSBpbmNvbWluZ0FtdCArIHRyYW5zZmVyLmdldEFtb3VudCgpO1xuICAgIHJldHVybiBpbmNvbWluZ0FtdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtiaWdpbnR9IGFtb3VudCBzcGVudCBpbiB0aGUgdHhcbiAgICovXG4gIGdldE91dGdvaW5nQW1vdW50KCk6IGJpZ2ludCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0T3V0Z29pbmdUcmFuc2ZlcigpID8gdGhpcy5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuZ2V0QW1vdW50KCkgOiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9UcmFuc2ZlclF1ZXJ5fSBbdHJhbnNmZXJRdWVyeV0gLSBxdWVyeSB0byBnZXQgc3BlY2lmaWMgdHJhbnNmZXJzXG4gICAqIEByZXR1cm4ge01vbmVyb1RyYW5zZmVyW119IHRyYW5zZmVycyBtYXRjaGluZyB0aGUgcXVlcnlcbiAgICovXG4gIGdldFRyYW5zZmVycyh0cmFuc2ZlclF1ZXJ5PzogTW9uZXJvVHJhbnNmZXJRdWVyeSk6IE1vbmVyb1RyYW5zZmVyW10ge1xuICAgIGxldCB0cmFuc2ZlcnMgPSBbXTtcbiAgICBpZiAodGhpcy5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgJiYgKCF0cmFuc2ZlclF1ZXJ5IHx8IHRyYW5zZmVyUXVlcnkubWVldHNDcml0ZXJpYSh0aGlzLmdldE91dGdvaW5nVHJhbnNmZXIoKSkpKSB0cmFuc2ZlcnMucHVzaCh0aGlzLmdldE91dGdvaW5nVHJhbnNmZXIoKSk7XG4gICAgaWYgKHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKCkpIHtcbiAgICAgICAgaWYgKCF0cmFuc2ZlclF1ZXJ5IHx8IHRyYW5zZmVyUXVlcnkubWVldHNDcml0ZXJpYSh0cmFuc2ZlcikpIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge01vbmVyb1RyYW5zZmVyUXVlcnl9IHRyYW5zZmVyUXVlcnkgLSBxdWVyeSB0byBrZWVwIG9ubHkgc3BlY2lmaWMgdHJhbnNmZXJzXG4gICAqIEByZXR1cm4ge01vbmVyb1RyYW5zZmVyW119IHJlbWFpbmluZyB0cmFuc2ZlcnMgbWF0Y2hpbmcgdGhlIHF1ZXJ5XG4gICAqL1xuICBmaWx0ZXJUcmFuc2ZlcnModHJhbnNmZXJRdWVyeTogTW9uZXJvVHJhbnNmZXJRdWVyeSk6IE1vbmVyb1RyYW5zZmVyW10ge1xuICAgIGxldCB0cmFuc2ZlcnMgPSBbXTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IG91dGdvaW5nIHRyYW5zZmVyIG9yIGVyYXNlIGlmIGZpbHRlcmVkXG4gICAgaWYgKHRoaXMuZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICYmICghdHJhbnNmZXJRdWVyeSB8fCB0cmFuc2ZlclF1ZXJ5Lm1lZXRzQ3JpdGVyaWEodGhpcy5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpKSkgdHJhbnNmZXJzLnB1c2godGhpcy5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpO1xuICAgIGVsc2UgdGhpcy5zZXRPdXRnb2luZ1RyYW5zZmVyKHVuZGVmaW5lZCk7XG4gICAgXG4gICAgLy8gY29sbGVjdCBpbmNvbWluZyB0cmFuc2ZlcnMgb3IgZXJhc2UgaWYgZmlsdGVyZWRcbiAgICBpZiAodGhpcy5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCB0b1JlbW92ZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkge1xuICAgICAgICBpZiAodHJhbnNmZXJRdWVyeS5tZWV0c0NyaXRlcmlhKHRyYW5zZmVyKSkgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgICBlbHNlIHRvUmVtb3Zlcy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0SW5jb21pbmdUcmFuc2ZlcnModGhpcy5nZXRJbmNvbWluZ1RyYW5zZmVycygpLmZpbHRlcihmdW5jdGlvbih0cmFuc2Zlcikge1xuICAgICAgICByZXR1cm4gIXRvUmVtb3Zlcy5pbmNsdWRlcyh0cmFuc2Zlcik7XG4gICAgICB9KSk7XG4gICAgICBpZiAodGhpcy5nZXRJbmNvbWluZ1RyYW5zZmVycygpLmxlbmd0aCA9PT0gMCkgdGhpcy5zZXRJbmNvbWluZ1RyYW5zZmVycyh1bmRlZmluZWQpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHJhbnNmZXJzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7TW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdfSBpbmNvbWluZyB0cmFuc2ZlcnNcbiAgICovXG4gIGdldEluY29taW5nVHJhbnNmZXJzKCk6IE1vbmVyb0luY29taW5nVHJhbnNmZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuaW5jb21pbmdUcmFuc2ZlcnM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge01vbmVyb0luY29taW5nVHJhbnNmZXJbXX0gaW5jb21pbmdUcmFuc2ZlcnMgLSBpbmNvbWluZyB0cmFuc2ZlcnNcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRJbmNvbWluZ1RyYW5zZmVycyhpbmNvbWluZ1RyYW5zZmVyczogTW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHRoaXMuaW5jb21pbmdUcmFuc2ZlcnMgPSBpbmNvbWluZ1RyYW5zZmVycztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge01vbmVyb091dGdvaW5nVHJhbnNmZXJ9IG91dGdvaW5nIHRyYW5zZmVyc1xuICAgKi9cbiAgZ2V0T3V0Z29pbmdUcmFuc2ZlcigpOiBNb25lcm9PdXRnb2luZ1RyYW5zZmVyIHtcbiAgICByZXR1cm4gdGhpcy5vdXRnb2luZ1RyYW5zZmVyO1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9PdXRnb2luZ1RyYW5zZmVyfSBvdXRnb2luZ1RyYW5zZmVyIC0gb3V0Z29pbmcgdHJhbnNmZXJcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRPdXRnb2luZ1RyYW5zZmVyKG91dGdvaW5nVHJhbnNmZXI6IE1vbmVyb091dGdvaW5nVHJhbnNmZXIpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5vdXRnb2luZ1RyYW5zZmVyID0gb3V0Z29pbmdUcmFuc2ZlcjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge01vbmVyb091dHB1dFdhbGxldFtdfSBvdXRwdXRRdWVyeSAtIHF1ZXJ5IHRvIGdldCBzcGVjaWZpYyBpbnB1dHNcbiAgICogQHJldHVybiB7TW9uZXJvT3V0cHV0V2FsbGV0W119IGlucHV0cyBtYXRjaGluZyB0aGUgcXVlcnlcbiAgICovXG4gIGdldElucHV0c1dhbGxldChvdXRwdXRRdWVyeT86IE1vbmVyb091dHB1dFF1ZXJ5KTogTW9uZXJvT3V0cHV0V2FsbGV0W10ge1xuICAgIGxldCBpbnB1dHM6IE1vbmVyb091dHB1dFdhbGxldFtdID0gW107XG4gICAgZm9yIChsZXQgb3V0cHV0IG9mIHN1cGVyLmdldElucHV0cygpKSBpZiAoIW91dHB1dFF1ZXJ5IHx8IG91dHB1dFF1ZXJ5Lm1lZXRzQ3JpdGVyaWEob3V0cHV0IGFzIE1vbmVyb091dHB1dFdhbGxldCkpIGlucHV0cy5wdXNoKG91dHB1dCBhcyBNb25lcm9PdXRwdXRXYWxsZXQpO1xuICAgIHJldHVybiBpbnB1dHM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9PdXRwdXRXYWxsZXRbXX0gaW5wdXRzIC0gdHggaW5wdXRzXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0SW5wdXRzV2FsbGV0KGlucHV0czogTW9uZXJvT3V0cHV0V2FsbGV0W10pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgdGhhdCBhbGwgaW5wdXRzIGFyZSB3YWxsZXQgaW5wdXRzXG4gICAgaWYgKGlucHV0cykge1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIGlucHV0cykge1xuICAgICAgICBpZiAoIShvdXRwdXQgaW5zdGFuY2VvZiBNb25lcm9PdXRwdXRXYWxsZXQpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgdHJhbnNhY3Rpb24gaW5wdXRzIG11c3QgYmUgb2YgdHlwZSBNb25lcm9PdXRwdXRXYWxsZXRcIik7XG4gICAgICB9XG4gICAgfVxuICAgIHN1cGVyLnNldElucHV0cyhpbnB1dHMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9PdXRwdXRRdWVyeX0gW291dHB1dFF1ZXJ5XSAtIHF1ZXJ5IHRvIGdldCBzcGVjaWZpYyBvdXRwdXRzXG4gICAqIEByZXR1cm4ge01vbmVyb091dHB1dFdhbGxldFtdfSBvdXRwdXRzIG1hdGNoaW5nIHRoZSBxdWVyeVxuICAgKi9cbiAgZ2V0T3V0cHV0c1dhbGxldChvdXRwdXRRdWVyeT86IE1vbmVyb091dHB1dFF1ZXJ5KTogTW9uZXJvT3V0cHV0V2FsbGV0W10ge1xuICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgZm9yIChsZXQgb3V0cHV0IG9mIHN1cGVyLmdldE91dHB1dHMoKSkgaWYgKCFvdXRwdXRRdWVyeSB8fCBvdXRwdXRRdWVyeS5tZWV0c0NyaXRlcmlhKG91dHB1dCBhcyBNb25lcm9PdXRwdXRXYWxsZXQpKSBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7TW9uZXJvT3V0cHV0V2FsbGV0W119IG91dHB1dHMgLSB0eCBvdXRwdXRzXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0T3V0cHV0c1dhbGxldChvdXRwdXRzOiBNb25lcm9PdXRwdXRXYWxsZXRbXSk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSB0aGF0IGFsbCBvdXRwdXRzIGFyZSB3YWxsZXQgb3V0cHV0c1xuICAgIGlmIChvdXRwdXRzKSB7XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2Ygb3V0cHV0cykge1xuICAgICAgICBpZiAoIShvdXRwdXQgaW5zdGFuY2VvZiBNb25lcm9PdXRwdXRXYWxsZXQpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgdHJhbnNhY3Rpb24gb3V0cHV0cyBtdXN0IGJlIG9mIHR5cGUgTW9uZXJvT3V0cHV0V2FsbGV0XCIpO1xuICAgICAgfVxuICAgIH1cbiAgICBzdXBlci5zZXRPdXRwdXRzKG91dHB1dHMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9PdXRwdXRRdWVyeX0gb3V0cHV0UXVlcnkgLSBxdWVyeSB0byBrZWVwIG9ubHkgc3BlY2lmaWMgb3V0cHV0c1xuICAgKiBAcmV0dXJuIHtNb25lcm9UcmFuc2ZlcltdfSByZW1haW5pbmcgb3V0cHV0cyBtYXRjaGluZyB0aGUgcXVlcnlcbiAgICovXG4gIGZpbHRlck91dHB1dHMob3V0cHV0UXVlcnk6IE1vbmVyb091dHB1dFF1ZXJ5KTogTW9uZXJvVHJhbnNmZXJbXSB7XG4gICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICBpZiAoc3VwZXIuZ2V0T3V0cHV0cygpKSB7XG4gICAgICBsZXQgdG9SZW1vdmVzID0gW107XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2Ygc3VwZXIuZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgIGlmICghb3V0cHV0UXVlcnkgfHwgb3V0cHV0UXVlcnkubWVldHNDcml0ZXJpYShvdXRwdXQgYXMgTW9uZXJvT3V0cHV0V2FsbGV0KSkgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgICAgIGVsc2UgdG9SZW1vdmVzLnB1c2gob3V0cHV0KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0T3V0cHV0cyhzdXBlci5nZXRPdXRwdXRzKCkuZmlsdGVyKGZ1bmN0aW9uKG91dHB1dCkge1xuICAgICAgICByZXR1cm4gIXRvUmVtb3Zlcy5pbmNsdWRlcyhvdXRwdXQpO1xuICAgICAgfSkpO1xuICAgICAgaWYgKHRoaXMuZ2V0T3V0cHV0cygpLmxlbmd0aCA9PT0gMCkgdGhpcy5zZXRPdXRwdXRzKHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfSB0eCBub3RlXG4gICAqL1xuICBnZXROb3RlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMubm90ZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBub3RlIC0gdHggbm90ZVxuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldE5vdGUobm90ZTogc3RyaW5nKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHRoaXMubm90ZSA9IG5vdGU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSB0eCBpcyBsb2NrZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0SXNMb2NrZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaXNMb2NrZWQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzTG9ja2VkIC0gdHJ1ZSBpZiB0aGUgdHggaXMgbG9ja2VkLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRJc0xvY2tlZChpc0xvY2tlZDogYm9vbGVhbik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICB0aGlzLmlzTG9ja2VkID0gaXNMb2NrZWQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtiaWdpbnR9IHN1bSBvZiB0eCBpbnB1dHNcbiAgICovXG4gIGdldElucHV0U3VtKCk6IGJpZ2ludCB7XG4gICAgcmV0dXJuIHRoaXMuaW5wdXRTdW07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge2JpZ2ludH0gaW5wdXRTdW0gLSBzdW0gb2YgdHggaW5wdXRzXG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0SW5wdXRTdW0oaW5wdXRTdW06IGJpZ2ludCk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICB0aGlzLmlucHV0U3VtID0gaW5wdXRTdW07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtiaWdpbnR9IHN1bSBvZiB0eCBvdXRwdXRzXG4gICAqL1xuICBnZXRPdXRwdXRTdW0oKTogYmlnaW50IHtcbiAgICByZXR1cm4gdGhpcy5vdXRwdXRTdW07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge2JpZ2ludH0gb3V0cHV0U3VtIC0gc3VtIG9mIHR4IG91dHB1dHNcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRPdXRwdXRTdW0ob3V0cHV0U3VtOiBiaWdpbnQpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgdGhpcy5vdXRwdXRTdW0gPSBvdXRwdXRTdW07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IGNoYW5nZSBhZGRyZXNzXG4gICAqL1xuICBnZXRDaGFuZ2VBZGRyZXNzKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuY2hhbmdlQWRkcmVzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjaGFuZ2VBZGRyZXNzIC0gY2hhbmdlIGFkZHJlc3NcbiAgICogQHJldHVybiB7TW9uZXJvVHhXYWxsZXR9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRDaGFuZ2VBZGRyZXNzKGNoYW5nZUFkZHJlc3M6IHN0cmluZyk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICB0aGlzLmNoYW5nZUFkZHJlc3MgPSBjaGFuZ2VBZGRyZXNzO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7YmlnaW50fSBjaGFuZ2UgYW1vdW50XG4gICAqL1xuICBnZXRDaGFuZ2VBbW91bnQoKTogYmlnaW50IHtcbiAgICByZXR1cm4gdGhpcy5jaGFuZ2VBbW91bnQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge2JpZ2ludH0gY2hhbmdlQW1vdW50IC0gY2hhbmdlIGFtb3VudFxuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldENoYW5nZUFtb3VudChjaGFuZ2VBbW91bnQ6IGJpZ2ludCk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICB0aGlzLmNoYW5nZUFtb3VudCA9IGNoYW5nZUFtb3VudDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn0gbnVtYmVyIG9mIGR1bW15IG91dHB1dHNcbiAgICovXG4gIGdldE51bUR1bW15T3V0cHV0cygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLm51bUR1bW15T3V0cHV0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBudW1EdW1teU91dHB1dHMgLSBudW1iZXIgb2YgZHVtbXkgb3V0cHV0c1xuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldE51bUR1bW15T3V0cHV0cyhudW1EdW1teU91dHB1dHM6IG51bWJlcik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICB0aGlzLm51bUR1bW15T3V0cHV0cyA9IG51bUR1bW15T3V0cHV0cztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ30gdHggZXh0cmEgYXMgaGV4XG4gICAqL1xuICBnZXRFeHRyYUhleCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmV4dHJhSGV4O1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV4dHJhSGV4IC0gdHggZXh0cmEgYXMgaGV4XG4gICAqIEByZXR1cm4ge01vbmVyb1R4V2FsbGV0fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0RXh0cmFIZXgoZXh0cmFIZXg6IHN0cmluZyk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICB0aGlzLmV4dHJhSGV4ID0gZXh0cmFIZXg7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtNb25lcm9UeFdhbGxldH0gYSBjb3B5IG9mIHRoaXMgdHhcbiAgICovXG4gIGNvcHkoKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhXYWxsZXQodGhpcyk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoaXMgdHJhbnNhY3Rpb24gYnkgbWVyZ2luZyB0aGUgbGF0ZXN0IGluZm9ybWF0aW9uIGZyb20gdGhlIGdpdmVuXG4gICAqIHRyYW5zYWN0aW9uLlxuICAgKiBcbiAgICogTWVyZ2luZyBjYW4gbW9kaWZ5IG9yIGJ1aWxkIHJlZmVyZW5jZXMgdG8gdGhlIHRyYW5zYWN0aW9uIGdpdmVuIHNvIGl0XG4gICAqIHNob3VsZCBub3QgYmUgcmUtdXNlZCBvciBpdCBzaG91bGQgYmUgY29waWVkIGJlZm9yZSBjYWxsaW5nIHRoaXMgbWV0aG9kLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeFdhbGxldH0gdHggLSB0aGUgdHJhbnNhY3Rpb24gdG8gbWVyZ2UgaW50byB0aGlzIHRyYW5zYWN0aW9uXG4gICAqL1xuICBtZXJnZSh0eDogTW9uZXJvVHhXYWxsZXQpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgYXNzZXJ0KHR4IGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQpO1xuICAgIGlmICh0aGlzID09PSB0eCkgcmV0dXJuIHRoaXM7XG4gICAgXG4gICAgLy8gbWVyZ2UgYmFzZSBjbGFzc2VzXG4gICAgc3VwZXIubWVyZ2UodHgpO1xuICAgIFxuICAgIC8vIG1lcmdlIHR4IHNldCBpZiB0aGV5J3JlIGRpZmZlcmVudCB3aGljaCBjb21lcyBiYWNrIHRvIG1lcmdpbmcgdHhzXG4gICAgLy9pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vTW9uZXJvVHhTZXRcIjtcbiAgICBpZiAodGhpcy5nZXRUeFNldCgpICE9PSB0eC5nZXRUeFNldCgpKSB7XG4gICAgICBpZiAodGhpcy5nZXRUeFNldCgpID09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLnNldFR4U2V0KG5ldyBNb25lcm9UeFNldCgpLnNldFR4cyhbdGhpc10pKTtcbiAgICAgIH1cbiAgICAgIGlmICh0eC5nZXRUeFNldCgpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdHguc2V0VHhTZXQobmV3IE1vbmVyb1R4U2V0KCkuc2V0VHhzKFt0eF0pKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZ2V0VHhTZXQoKS5tZXJnZSh0eC5nZXRUeFNldCgpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICAvLyBtZXJnZSBpbmNvbWluZyB0cmFuc2ZlcnNcbiAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkge1xuICAgICAgaWYgKHRoaXMuZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSA9PT0gdW5kZWZpbmVkKSB0aGlzLnNldEluY29taW5nVHJhbnNmZXJzKFtdKTtcbiAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkpIHtcbiAgICAgICAgdHJhbnNmZXIuc2V0VHgodGhpcyk7XG4gICAgICAgIE1vbmVyb1R4V2FsbGV0Lm1lcmdlSW5jb21pbmdUcmFuc2Zlcih0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKCksIHRyYW5zZmVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gbWVyZ2Ugb3V0Z29pbmcgdHJhbnNmZXJcbiAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpKSB7XG4gICAgICB0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkuc2V0VHgodGhpcyk7XG4gICAgICBpZiAodGhpcy5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgPT09IHVuZGVmaW5lZCkgdGhpcy5zZXRPdXRnb2luZ1RyYW5zZmVyKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSk7XG4gICAgICBlbHNlIHRoaXMuZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLm1lcmdlKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSk7XG4gICAgfVxuICAgIFxuICAgIC8vIG1lcmdlIHNpbXBsZSBleHRlbnNpb25zXG4gICAgdGhpcy5zZXRJc0luY29taW5nKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldElzSW5jb21pbmcoKSwgdHguZ2V0SXNJbmNvbWluZygpLCB7cmVzb2x2ZVRydWU6IHRydWV9KSk7ICAvLyBvdXRwdXRzIHNlZW4gb24gY29uZmlybWF0aW9uXG4gICAgdGhpcy5zZXRJc091dGdvaW5nKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldElzT3V0Z29pbmcoKSwgdHguZ2V0SXNPdXRnb2luZygpKSk7XG4gICAgdGhpcy5zZXROb3RlKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldE5vdGUoKSwgdHguZ2V0Tm90ZSgpKSk7XG4gICAgdGhpcy5zZXRJc0xvY2tlZChHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRJc0xvY2tlZCgpLCB0eC5nZXRJc0xvY2tlZCgpLCB7cmVzb2x2ZVRydWU6IGZhbHNlfSkpOyAvLyB0eCBjYW4gYmVjb21lIHVubG9ja2VkXG4gICAgdGhpcy5zZXRJbnB1dFN1bShHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRJbnB1dFN1bSgpLCB0eC5nZXRJbnB1dFN1bSgpKSk7XG4gICAgdGhpcy5zZXRPdXRwdXRTdW0oR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0T3V0cHV0U3VtKCksIHR4LmdldE91dHB1dFN1bSgpKSk7XG4gICAgdGhpcy5zZXRDaGFuZ2VBZGRyZXNzKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldENoYW5nZUFkZHJlc3MoKSwgdHguZ2V0Q2hhbmdlQWRkcmVzcygpKSk7XG4gICAgdGhpcy5zZXRDaGFuZ2VBbW91bnQoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0Q2hhbmdlQW1vdW50KCksIHR4LmdldENoYW5nZUFtb3VudCgpKSk7XG4gICAgdGhpcy5zZXROdW1EdW1teU91dHB1dHMoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0TnVtRHVtbXlPdXRwdXRzKCksIHR4LmdldE51bUR1bW15T3V0cHV0cygpKSk7XG4gICAgdGhpcy5zZXRFeHRyYUhleChHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRFeHRyYUhleCgpLCB0eC5nZXRFeHRyYUhleCgpKSk7XG4gICAgXG4gICAgcmV0dXJuIHRoaXM7ICAvLyBmb3IgY2hhaW5pbmdcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbaW5kZW50XSAtIHN0YXJ0aW5nIGluZGVudGF0aW9uXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29uZUxpbmVdIC0gc3RyaW5nIGlzIG9uZSBsaW5lIGlmIHRydWUsIG11bHRpcGxlIGxpbmVzIGlmIGZhbHNlXG4gICAqIEByZXR1cm4ge3N0cmluZ30gc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgdHhcbiAgICovXG4gIHRvU3RyaW5nKGluZGVudCA9IDAsIG9uZUxpbmUgPSBmYWxzZSk6IHN0cmluZyB7XG4gICAgbGV0IHN0ciA9IFwiXCI7XG4gICAgXG4gICAgLy8gcmVwcmVzZW50IHR4IHdpdGggb25lIGxpbmUgc3RyaW5nXG4gICAgLy8gVE9ETzogcHJvcGVyIGNzdiBleHBvcnRcbiAgICBpZiAob25lTGluZSkge1xuICAgICAgc3RyICs9IHRoaXMuZ2V0SGFzaCgpICsgXCIsIFwiO1xuICAgICAgc3RyICs9ICh0aGlzLmdldElzQ29uZmlybWVkKCkgPyB0aGlzLmdldEJsb2NrKCkuZ2V0VGltZXN0YW1wKCkgOiB0aGlzLmdldFJlY2VpdmVkVGltZXN0YW1wKCkpICsgXCIsIFwiO1xuICAgICAgc3RyICs9IHRoaXMuZ2V0SXNDb25maXJtZWQoKSArIFwiLCBcIjtcbiAgICAgIHN0ciArPSAodGhpcy5nZXRPdXRnb2luZ0Ftb3VudCgpID8gdGhpcy5nZXRPdXRnb2luZ0Ftb3VudCgpLnRvU3RyaW5nKCkgOiBcIlwiKSArIFwiLCBcIjtcbiAgICAgIHN0ciArPSB0aGlzLmdldEluY29taW5nQW1vdW50KCkgPyB0aGlzLmdldEluY29taW5nQW1vdW50KCkudG9TdHJpbmcoKSA6IFwiXCI7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBcbiAgICAvLyBvdGhlcndpc2Ugc3RyaW5naWZ5IGFsbCBmaWVsZHNcbiAgICBzdHIgKz0gc3VwZXIudG9TdHJpbmcoaW5kZW50KSArIFwiXFxuXCI7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIklzIGluY29taW5nXCIsIHRoaXMuZ2V0SXNJbmNvbWluZygpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJJbmNvbWluZyBhbW91bnRcIiwgdGhpcy5nZXRJbmNvbWluZ0Ftb3VudCgpLCBpbmRlbnQpO1xuICAgIGlmICh0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIkluY29taW5nIHRyYW5zZmVyc1wiLCBcIlwiLCBpbmRlbnQpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShpICsgMSwgXCJcIiwgaW5kZW50ICsgMSk7XG4gICAgICAgIHN0ciArPSB0aGlzLmdldEluY29taW5nVHJhbnNmZXJzKClbaV0udG9TdHJpbmcoaW5kZW50ICsgMikgKyBcIlxcblwiO1xuICAgICAgfVxuICAgIH1cbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiSXMgb3V0Z29pbmdcIiwgdGhpcy5nZXRJc091dGdvaW5nKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIk91dGdvaW5nIGFtb3VudFwiLCB0aGlzLmdldE91dGdvaW5nQW1vdW50KCksIGluZGVudCk7XG4gICAgaWYgKHRoaXMuZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJPdXRnb2luZyB0cmFuc2ZlclwiLCBcIlwiLCBpbmRlbnQpO1xuICAgICAgc3RyICs9IHRoaXMuZ2V0T3V0Z29pbmdUcmFuc2ZlcigpLnRvU3RyaW5nKGluZGVudCArIDEpICsgXCJcXG5cIjtcbiAgICB9XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIk5vdGVcIiwgdGhpcy5nZXROb3RlKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIklzIGxvY2tlZFwiLCB0aGlzLmdldElzTG9ja2VkKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIklucHV0IHN1bVwiLCB0aGlzLmdldElucHV0U3VtKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIk91dHB1dCBzdW1cIiwgdGhpcy5nZXRPdXRwdXRTdW0oKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiQ2hhbmdlIGFkZHJlc3NcIiwgdGhpcy5nZXRDaGFuZ2VBZGRyZXNzKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIkNoYW5nZSBhbW91bnRcIiwgdGhpcy5nZXRDaGFuZ2VBbW91bnQoKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiTnVtIGR1bW15IG91dHB1dHNcIiwgdGhpcy5nZXROdW1EdW1teU91dHB1dHMoKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiRXh0cmEgaGV4XCIsIHRoaXMuZ2V0RXh0cmFIZXgoKSwgaW5kZW50KTtcbiAgICByZXR1cm4gc3RyLnNsaWNlKDAsIHN0ci5sZW5ndGggLSAxKTsgIC8vIHN0cmlwIGxhc3QgbmV3bGluZVxuICB9XG4gIFxuICAvLyBwcml2YXRlIGhlbHBlciB0byBtZXJnZSB0cmFuc2ZlcnNcbiAgcHJvdGVjdGVkIHN0YXRpYyBtZXJnZUluY29taW5nVHJhbnNmZXIodHJhbnNmZXJzLCB0cmFuc2Zlcikge1xuICAgIGZvciAobGV0IGFUcmFuc2ZlciBvZiB0cmFuc2ZlcnMpIHtcbiAgICAgIGlmIChhVHJhbnNmZXIuZ2V0QWNjb3VudEluZGV4KCkgPT09IHRyYW5zZmVyLmdldEFjY291bnRJbmRleCgpICYmIGFUcmFuc2Zlci5nZXRTdWJhZGRyZXNzSW5kZXgoKSA9PT0gdHJhbnNmZXIuZ2V0U3ViYWRkcmVzc0luZGV4KCkpIHtcbiAgICAgICAgYVRyYW5zZmVyLm1lcmdlKHRyYW5zZmVyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLSBPVkVSUklERSBDT1ZBUklBTlQgUkVUVVJOIFRZUEVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHNldEJsb2NrKGJsb2NrOiBNb25lcm9CbG9jayk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRCbG9jayhibG9jayk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRIYXNoKGhhc2g6IHN0cmluZyk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRIYXNoKGhhc2gpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0VmVyc2lvbih2ZXJzaW9uOiBudW1iZXIpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0VmVyc2lvbih2ZXJzaW9uKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldElzTWluZXJUeChpc01pbmVyVHg6IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0SXNNaW5lclR4KGlzTWluZXJUeCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRQYXltZW50SWQocGF5bWVudElkOiBzdHJpbmcpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0UGF5bWVudElkKHBheW1lbnRJZCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRGZWUoZmVlOiBiaWdpbnQpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0RmVlKGZlZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRSaW5nU2l6ZShyaW5nU2l6ZTogbnVtYmVyKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFJpbmdTaXplKHJpbmdTaXplKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFJlbGF5KHJlbGF5OiBib29sZWFuKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFJlbGF5KHJlbGF5KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldElzUmVsYXllZChpc1JlbGF5ZWQ6IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0SXNSZWxheWVkKGlzUmVsYXllZCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRJc0NvbmZpcm1lZChpc0NvbmZpcm1lZDogYm9vbGVhbik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRJc0NvbmZpcm1lZChpc0NvbmZpcm1lZCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRJblR4UG9vbChpblR4UG9vbDogYm9vbGVhbik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRJblR4UG9vbChpblR4UG9vbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXROdW1Db25maXJtYXRpb25zKG51bUNvbmZpcm1hdGlvbnM6IG51bWJlcik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXROdW1Db25maXJtYXRpb25zKG51bUNvbmZpcm1hdGlvbnMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0VW5sb2NrVGltZSh1bmxvY2tUaW1lOiBiaWdpbnQpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0VW5sb2NrVGltZSh1bmxvY2tUaW1lKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldExhc3RSZWxheWVkVGltZXN0YW1wKGxhc3RSZWxheWVkVGltZXN0YW1wOiBudW1iZXIpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAobGFzdFJlbGF5ZWRUaW1lc3RhbXApO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UmVjZWl2ZWRUaW1lc3RhbXAocmVjZWl2ZWRUaW1lc3RhbXA6IG51bWJlcik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRSZWNlaXZlZFRpbWVzdGFtcChyZWNlaXZlZFRpbWVzdGFtcCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRJc0RvdWJsZVNwZW5kU2Vlbihpc0RvdWJsZVNwZW5kU2VlbjogYm9vbGVhbik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRJc0RvdWJsZVNwZW5kU2Vlbihpc0RvdWJsZVNwZW5kU2Vlbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRLZXkoa2V5OiBzdHJpbmcpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0S2V5KGtleSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRGdWxsSGV4KGZ1bGxIZXg6IHN0cmluZyk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRGdWxsSGV4KGZ1bGxIZXgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UHJ1bmVkSGV4KHBydW5lZEhleDogc3RyaW5nKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFBydW5lZEhleChwcnVuZWRIZXgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UHJ1bmFibGVIZXgocHJ1bmFibGVIZXg6IHN0cmluZyk6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRQcnVuYWJsZUhleChwcnVuYWJsZUhleCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRQcnVuYWJsZUhhc2gocHJ1bmFibGVIYXNoOiBzdHJpbmcpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0UHJ1bmFibGVIYXNoKHBydW5hYmxlSGFzaCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRTaXplKHNpemU6IG51bWJlcik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRTaXplKHNpemUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0V2VpZ2h0KHdlaWdodDogbnVtYmVyKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFdlaWdodCh3ZWlnaHQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0SW5wdXRzKGlucHV0czogTW9uZXJvT3V0cHV0W10pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0SW5wdXRzKGlucHV0cyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRPdXRwdXRzKG91dHB1dHM6IE1vbmVyb091dHB1dFtdKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldE91dHB1dHMob3V0cHV0cyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRPdXRwdXRJbmRpY2VzKG91dHB1dEluZGljZXM6IG51bWJlcltdKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldE91dHB1dEluZGljZXMob3V0cHV0SW5kaWNlcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRNZXRhZGF0YShtZXRhZGF0YTogc3RyaW5nKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldE1ldGFkYXRhKG1ldGFkYXRhKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldEV4dHJhKGV4dHJhOiBVaW50OEFycmF5KTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldEV4dHJhKGV4dHJhKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFJjdFNpZ25hdHVyZXMocmN0U2lnbmF0dXJlczogYW55KTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFJjdFNpZ25hdHVyZXMocmN0U2lnbmF0dXJlcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRSY3RTaWdQcnVuYWJsZShyY3RTaWdQcnVuYWJsZTogYW55KTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldFJjdFNpZ1BydW5hYmxlKHJjdFNpZ1BydW5hYmxlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldElzS2VwdEJ5QmxvY2soaXNLZXB0QnlCbG9jazogYm9vbGVhbik6IE1vbmVyb1R4V2FsbGV0IHtcbiAgICBzdXBlci5zZXRJc0tlcHRCeUJsb2NrKGlzS2VwdEJ5QmxvY2spO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0SXNGYWlsZWQoaXNGYWlsZWQ6IGJvb2xlYW4pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0SXNGYWlsZWQoaXNGYWlsZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0TGFzdEZhaWxlZEhlaWdodChsYXN0RmFpbGVkSGVpZ2h0OiBudW1iZXIpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0TGFzdEZhaWxlZEhlaWdodChsYXN0RmFpbGVkSGVpZ2h0KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldExhc3RGYWlsZWRIYXNoKGxhc3RGYWlsZWRIYXNoOiBzdHJpbmcpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0TGFzdEZhaWxlZEhhc2gobGFzdEZhaWxlZEhhc2gpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0TWF4VXNlZEJsb2NrSGVpZ2h0KG1heFVzZWRCbG9ja0hlaWdodDogbnVtYmVyKTogTW9uZXJvVHhXYWxsZXQge1xuICAgIHN1cGVyLnNldE1heFVzZWRCbG9ja0hlaWdodChtYXhVc2VkQmxvY2tIZWlnaHQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0TWF4VXNlZEJsb2NrSGFzaChtYXhVc2VkQmxvY2tIYXNoOiBzdHJpbmcpOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0TWF4VXNlZEJsb2NrSGFzaChtYXhVc2VkQmxvY2tIYXNoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFNpZ25hdHVyZXMoc2lnbmF0dXJlczogc3RyaW5nW10pOiBNb25lcm9UeFdhbGxldCB7XG4gICAgc3VwZXIuc2V0U2lnbmF0dXJlcyhzaWduYXR1cmVzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsU0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBOztBQUVBLElBQUFFLFlBQUEsR0FBQUgsc0JBQUEs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