import assert from "assert";
import GenUtils from "../../common/GenUtils";
import MoneroBlock from "../../daemon/model/MoneroBlock";
import MoneroError from "../../common/MoneroError";
import MoneroIncomingTransfer from "./MoneroIncomingTransfer";
import MoneroOutgoingTransfer from "./MoneroOutgoingTransfer";
import MoneroOutputQuery from "./MoneroOutputQuery";
import MoneroOutput from "../../daemon/model/MoneroOutput";
import MoneroOutputWallet from "./MoneroOutputWallet";
import MoneroTransfer from "./MoneroTransfer";
import MoneroTransferQuery from "./MoneroTransferQuery";
import MoneroTx from "../../daemon/model/MoneroTx";
import MoneroTxSet from "./MoneroTxSet";

/**
 * Models a Monero transaction with wallet extensions.
 */
export default class MoneroTxWallet extends MoneroTx {

  txSet: MoneroTxSet;
  isIncoming: boolean;
  isOutgoing: boolean;
  incomingTransfers: MoneroIncomingTransfer[];
  outgoingTransfer: MoneroOutgoingTransfer;
  note: string;
  isLocked: boolean;
  inputSum: bigint;
  outputSum: bigint;
  changeAddress: string;
  changeAmount: bigint;
  numDummyOutputs: number;
  extraHex: string;
  
  /**
   * Construct the model.
   * 
   * @param {Partial<MoneroTxWallet>} [tx] is existing state to initialize from (optional)
   */
  constructor(tx?: Partial<MoneroTxWallet>) {
    super(tx);
    this.setTxSet(this.getTxSet()); // preserve reference to tx set
    
    // copy incoming transfers
    if (this.incomingTransfers) {
      this.incomingTransfers = this.incomingTransfers.slice();
      for (let i = 0; i < this.incomingTransfers.length; i++) {
        this.incomingTransfers[i] = new MoneroIncomingTransfer(this.incomingTransfers[i]).setTx(this);
      }
    }
    
    // copy outgoing transfer
    if (this.outgoingTransfer) {
      this.outgoingTransfer = new MoneroOutgoingTransfer(this.outgoingTransfer).setTx(this);
    }
    
    // copy inputs
    if (this.inputs) {
      this.inputs = this.inputs.slice();
      for (let i = 0; i < this.inputs.length; i++) {
        this.inputs[i] = new MoneroOutputWallet(this.inputs[i] as MoneroOutputWallet).setTx(this);
      }
    }
    
    // copy outputs
    if (this.outputs) {
      this.outputs = this.outputs.slice();
      for (let i = 0; i < this.outputs.length; i++) {
        this.outputs[i] = new MoneroOutputWallet(this.outputs[i] as MoneroOutputWallet).setTx(this);
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
  toJson(): any {
    let json = Object.assign({}, this, super.toJson()); // merge json onto inherited state
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
   * @return {MoneroTxSet} tx set containing txs
   */
  getTxSet(): MoneroTxSet {
    return this.txSet;
  }

  /**
   * @param {MoneroTxSet} txSet - tx set containing txs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setTxSet(txSet: MoneroTxSet): MoneroTxWallet {
    this.txSet = txSet;
    return this;
  }

  /**
   * @return {boolean} true if the tx has incoming funds, false otherwise
   */
  getIsIncoming(): boolean {
    return this.isIncoming;
  }

  /**
   * @param {boolean} isIncoming - true if the tx has incoming funds, false otherwise
   * @return {MoneroTxWallet} this tx for chaining
   */
  setIsIncoming(isIncoming: boolean): MoneroTxWallet {
    this.isIncoming = isIncoming;
    return this;
  }

  /**
   * @return {boolean} true if the tx has outgoing funds, false otherwise
   */
  getIsOutgoing(): boolean {
    return this.isOutgoing;
  }

  /**
   * @param {boolean} isOutgoing - true if the tx has outgoing funds, false otherwise
   * @return {MoneroTxWallet} this tx for chaining
   */
  setIsOutgoing(isOutgoing: boolean): MoneroTxWallet {
    this.isOutgoing = isOutgoing;
    return this;
  }

  /**
   * @return {bigint} amount received in the tx
   */
  getIncomingAmount(): bigint {
    if (this.getIncomingTransfers() === undefined) return undefined;
    let incomingAmt = BigInt("0");
    for (let transfer of this.getIncomingTransfers()) incomingAmt = incomingAmt + transfer.getAmount();
    return incomingAmt;
  }

  /**
   * @return {bigint} amount spent in the tx
   */
  getOutgoingAmount(): bigint {
    return this.getOutgoingTransfer() ? this.getOutgoingTransfer().getAmount() : undefined;
  }

  /**
   * @param {MoneroTransferQuery} [transferQuery] - query to get specific transfers
   * @return {MoneroTransfer[]} transfers matching the query
   */
  getTransfers(transferQuery?: MoneroTransferQuery): MoneroTransfer[] {
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
  filterTransfers(transferQuery: MoneroTransferQuery): MoneroTransfer[] {
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
  getIncomingTransfers(): MoneroIncomingTransfer[] {
    return this.incomingTransfers;
  }
  
  /**
   * @param {MoneroIncomingTransfer[]} incomingTransfers - incoming transfers
   * @return {MoneroTxWallet} this tx for chaining
   */
  setIncomingTransfers(incomingTransfers: MoneroIncomingTransfer[]): MoneroTxWallet {
    this.incomingTransfers = incomingTransfers;
    return this;
  }
  
  /**
   * @return {MoneroOutgoingTransfer} outgoing transfers
   */
  getOutgoingTransfer(): MoneroOutgoingTransfer {
    return this.outgoingTransfer;
  }
  
  /**
   * @param {MoneroOutgoingTransfer} outgoingTransfer - outgoing transfer
   * @return {MoneroTxWallet} this tx for chaining
   */
  setOutgoingTransfer(outgoingTransfer: MoneroOutgoingTransfer): MoneroTxWallet {
    this.outgoingTransfer = outgoingTransfer;
    return this;
  }

  /**
   * @param {MoneroOutputWallet[]} outputQuery - query to get specific inputs
   * @return {MoneroOutputWallet[]} inputs matching the query
   */
  getInputsWallet(outputQuery?: MoneroOutputQuery): MoneroOutputWallet[] {
    let inputs: MoneroOutputWallet[] = [];
    for (let output of super.getInputs()) if (!outputQuery || outputQuery.meetsCriteria(output as MoneroOutputWallet)) inputs.push(output as MoneroOutputWallet);
    return inputs;
  }

  /**
   * @param {MoneroOutputWallet[]} inputs - tx inputs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setInputsWallet(inputs: MoneroOutputWallet[]): MoneroTxWallet {
    
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
  getOutputsWallet(outputQuery?: MoneroOutputQuery): MoneroOutputWallet[] {
    let outputs = [];
    for (let output of super.getOutputs()) if (!outputQuery || outputQuery.meetsCriteria(output as MoneroOutputWallet)) outputs.push(output);
    return outputs;
  }
  
  /**
   * @param {MoneroOutputWallet[]} outputs - tx outputs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setOutputsWallet(outputs: MoneroOutputWallet[]): MoneroTxWallet {
    
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
  filterOutputs(outputQuery: MoneroOutputQuery): MoneroTransfer[] {
    let outputs = [];
    if (super.getOutputs()) {
      let toRemoves = [];
      for (let output of super.getOutputs()) {
        if (!outputQuery || outputQuery.meetsCriteria(output as MoneroOutputWallet)) outputs.push(output);
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
  getNote(): string {
    return this.note;
  }
  
  /**
   * @param {string} note - tx note
   * @return {MoneroTxWallet} this tx for chaining
   */
  setNote(note: string): MoneroTxWallet {
    this.note = note;
    return this;
  }
  
  /**
   * @return {boolean} true if the tx is locked, false otherwise
   */
  getIsLocked(): boolean {
    return this.isLocked;
  }
  
  /**
   * @param {boolean} isLocked - true if the tx is locked, false otherwise
   * @return {MoneroTxWallet} this tx for chaining
   */
  setIsLocked(isLocked: boolean): MoneroTxWallet {
    this.isLocked = isLocked;
    return this;
  }
  
  /**
   * @return {bigint} sum of tx inputs
   */
  getInputSum(): bigint {
    return this.inputSum;
  }
  
  /**
   * @param {bigint} inputSum - sum of tx inputs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setInputSum(inputSum: bigint): MoneroTxWallet {
    this.inputSum = inputSum;
    return this;
  }
  
  /**
   * @return {bigint} sum of tx outputs
   */
  getOutputSum(): bigint {
    return this.outputSum;
  }
  
  /**
   * @param {bigint} outputSum - sum of tx outputs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setOutputSum(outputSum: bigint): MoneroTxWallet {
    this.outputSum = outputSum;
    return this;
  }
  
  /**
   * @return {string} change address
   */
  getChangeAddress(): string {
    return this.changeAddress;
  }
  
  /**
   * @param {string} changeAddress - change address
   * @return {MoneroTxWallet} this tx for chaining
   */
  setChangeAddress(changeAddress: string): MoneroTxWallet {
    this.changeAddress = changeAddress;
    return this;
  }
  
  /**
   * @return {bigint} change amount
   */
  getChangeAmount(): bigint {
    return this.changeAmount;
  }
  
  /**
   * @param {bigint} changeAmount - change amount
   * @return {MoneroTxWallet} this tx for chaining
   */
  setChangeAmount(changeAmount: bigint): MoneroTxWallet {
    this.changeAmount = changeAmount;
    return this;
  }
  
  /**
   * @return {number} number of dummy outputs
   */
  getNumDummyOutputs(): number {
    return this.numDummyOutputs;
  }
  
  /**
   * @param {number} numDummyOutputs - number of dummy outputs
   * @return {MoneroTxWallet} this tx for chaining
   */
  setNumDummyOutputs(numDummyOutputs: number): MoneroTxWallet {
    this.numDummyOutputs = numDummyOutputs;
    return this;
  }
  
  /**
   * @return {string} tx extra as hex
   */
  getExtraHex(): string {
    return this.extraHex;
  }
  
  /**
   * @param {string} extraHex - tx extra as hex
   * @return {MoneroTxWallet} this tx for chaining
   */
  setExtraHex(extraHex: string): MoneroTxWallet {
    this.extraHex = extraHex;
    return this;
  }
  
  /**
   * @return {MoneroTxWallet} a copy of this tx
   */
  copy(): MoneroTxWallet {
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
  merge(tx: MoneroTxWallet): MoneroTxWallet {
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
        MoneroTxWallet.mergeIncomingTransfer(this.getIncomingTransfers(), transfer);
      }
    }
    
    // merge outgoing transfer
    if (tx.getOutgoingTransfer()) {
      tx.getOutgoingTransfer().setTx(this);
      if (this.getOutgoingTransfer() === undefined) this.setOutgoingTransfer(tx.getOutgoingTransfer());
      else this.getOutgoingTransfer().merge(tx.getOutgoingTransfer());
    }
    
    // merge simple extensions
    this.setIsIncoming(GenUtils.reconcile(this.getIsIncoming(), tx.getIsIncoming(), {resolveTrue: true}));  // outputs seen on confirmation
    this.setIsOutgoing(GenUtils.reconcile(this.getIsOutgoing(), tx.getIsOutgoing()));
    this.setNote(GenUtils.reconcile(this.getNote(), tx.getNote()));
    this.setIsLocked(GenUtils.reconcile(this.getIsLocked(), tx.getIsLocked(), {resolveTrue: false})); // tx can become unlocked
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
  toString(indent = 0, oneLine = false): string {
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
    str += GenUtils.kvLine("Is incoming", this.getIsIncoming(), indent);
    str += GenUtils.kvLine("Incoming amount", this.getIncomingAmount(), indent);
    if (this.getIncomingTransfers() !== undefined) {
      str += GenUtils.kvLine("Incoming transfers", "", indent);
      for (let i = 0; i < this.getIncomingTransfers().length; i++) {
        str += GenUtils.kvLine(i + 1, "", indent + 1);
        str += this.getIncomingTransfers()[i].toString(indent + 2) + "\n";
      }
    }
    str += GenUtils.kvLine("Is outgoing", this.getIsOutgoing(), indent);
    str += GenUtils.kvLine("Outgoing amount", this.getOutgoingAmount(), indent);
    if (this.getOutgoingTransfer() !== undefined) {
      str += GenUtils.kvLine("Outgoing transfer", "", indent);
      str += this.getOutgoingTransfer().toString(indent + 1) + "\n";
    }
    str += GenUtils.kvLine("Note", this.getNote(), indent);
    str += GenUtils.kvLine("Is locked", this.getIsLocked(), indent);
    str += GenUtils.kvLine("Input sum", this.getInputSum(), indent);
    str += GenUtils.kvLine("Output sum", this.getOutputSum(), indent);
    str += GenUtils.kvLine("Change address", this.getChangeAddress(), indent);
    str += GenUtils.kvLine("Change amount", this.getChangeAmount(), indent);
    str += GenUtils.kvLine("Num dummy outputs", this.getNumDummyOutputs(), indent);
    str += GenUtils.kvLine("Extra hex", this.getExtraHex(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
  
  // private helper to merge transfers
  protected static mergeIncomingTransfer(transfers, transfer) {
    for (let aTransfer of transfers) {
      if (aTransfer.getAccountIndex() === transfer.getAccountIndex() && aTransfer.getSubaddressIndex() === transfer.getSubaddressIndex()) {
        aTransfer.merge(transfer);
        return;
      }
    }
    transfers.push(transfer);
  }

  // -------------------- OVERRIDE COVARIANT RETURN TYPES ---------------------

  setBlock(block: MoneroBlock): MoneroTxWallet {
    super.setBlock(block);
    return this;
  }

  setHash(hash: string): MoneroTxWallet {
    super.setHash(hash);
    return this;
  }

  setVersion(version: number): MoneroTxWallet {
    super.setVersion(version);
    return this;
  }

  setIsMinerTx(isMinerTx: boolean): MoneroTxWallet {
    super.setIsMinerTx(isMinerTx);
    return this;
  }

  setPaymentId(paymentId: string): MoneroTxWallet {
    super.setPaymentId(paymentId);
    return this;
  }

  setFee(fee: bigint): MoneroTxWallet {
    super.setFee(fee);
    return this;
  }

  setRingSize(ringSize: number): MoneroTxWallet {
    super.setRingSize(ringSize);
    return this;
  }

  setRelay(relay: boolean): MoneroTxWallet {
    super.setRelay(relay);
    return this;
  }

  setIsRelayed(isRelayed: boolean): MoneroTxWallet {
    super.setIsRelayed(isRelayed);
    return this;
  }

  setIsConfirmed(isConfirmed: boolean): MoneroTxWallet {
    super.setIsConfirmed(isConfirmed);
    return this;
  }

  setInTxPool(inTxPool: boolean): MoneroTxWallet {
    super.setInTxPool(inTxPool);
    return this;
  }

  setNumConfirmations(numConfirmations: number): MoneroTxWallet {
    super.setNumConfirmations(numConfirmations);
    return this;
  }

  setUnlockTime(unlockTime: bigint): MoneroTxWallet {
    super.setUnlockTime(unlockTime);
    return this;
  }

  setLastRelayedTimestamp(lastRelayedTimestamp: number): MoneroTxWallet {
    super.setLastRelayedTimestamp(lastRelayedTimestamp);
    return this;
  }

  setReceivedTimestamp(receivedTimestamp: number): MoneroTxWallet {
    super.setReceivedTimestamp(receivedTimestamp);
    return this;
  }

  setIsDoubleSpendSeen(isDoubleSpendSeen: boolean): MoneroTxWallet {
    super.setIsDoubleSpendSeen(isDoubleSpendSeen);
    return this;
  }

  setKey(key: string): MoneroTxWallet {
    super.setKey(key);
    return this;
  }

  setFullHex(fullHex: string): MoneroTxWallet {
    super.setFullHex(fullHex);
    return this;
  }

  setPrunedHex(prunedHex: string): MoneroTxWallet {
    super.setPrunedHex(prunedHex);
    return this;
  }

  setPrunableHex(prunableHex: string): MoneroTxWallet {
    super.setPrunableHex(prunableHex);
    return this;
  }

  setPrunableHash(prunableHash: string): MoneroTxWallet {
    super.setPrunableHash(prunableHash);
    return this;
  }

  setSize(size: number): MoneroTxWallet {
    super.setSize(size);
    return this;
  }

  setWeight(weight: number): MoneroTxWallet {
    super.setWeight(weight);
    return this;
  }

  setInputs(inputs: MoneroOutput[]): MoneroTxWallet {
    super.setInputs(inputs);
    return this;
  }

  setOutputs(outputs: MoneroOutput[]): MoneroTxWallet {
    super.setOutputs(outputs);
    return this;
  }

  setOutputIndices(outputIndices: number[]): MoneroTxWallet {
    super.setOutputIndices(outputIndices);
    return this;
  }

  setMetadata(metadata: string): MoneroTxWallet {
    super.setMetadata(metadata);
    return this;
  }

  setExtra(extra: Uint8Array): MoneroTxWallet {
    super.setExtra(extra);
    return this;
  }

  setRctSignatures(rctSignatures: any): MoneroTxWallet {
    super.setRctSignatures(rctSignatures);
    return this;
  }

  setRctSigPrunable(rctSigPrunable: any): MoneroTxWallet {
    super.setRctSigPrunable(rctSigPrunable);
    return this;
  }

  setIsKeptByBlock(isKeptByBlock: boolean): MoneroTxWallet {
    super.setIsKeptByBlock(isKeptByBlock);
    return this;
  }

  setIsFailed(isFailed: boolean): MoneroTxWallet {
    super.setIsFailed(isFailed);
    return this;
  }

  setLastFailedHeight(lastFailedHeight: number): MoneroTxWallet {
    super.setLastFailedHeight(lastFailedHeight);
    return this;
  }

  setLastFailedHash(lastFailedHash: string): MoneroTxWallet {
    super.setLastFailedHash(lastFailedHash);
    return this;
  }

  setMaxUsedBlockHeight(maxUsedBlockHeight: number): MoneroTxWallet {
    super.setMaxUsedBlockHeight(maxUsedBlockHeight);
    return this;
  }

  setMaxUsedBlockHash(maxUsedBlockHash: string): MoneroTxWallet {
    super.setMaxUsedBlockHash(maxUsedBlockHash);
    return this;
  }

  setSignatures(signatures: string[]): MoneroTxWallet {
    super.setSignatures(signatures);
    return this;
  }
}
