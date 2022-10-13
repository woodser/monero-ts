import assert from "assert";
import GenUtils from "../../common/GenUtils";
import MoneroOutput from "./MoneroOutput";

/**
 * Represents a transaction on the Monero network.
 * 
 * @class
 */
class MoneroTx {
  
  /**
   * Construct the model.
   * 
   * @param {MoneroTx|object} [state] is existing state to initialize from (optional)
   */
  constructor(state) {
    
    // initialize internal state
    if (!state) state = {};
    else if (state instanceof MoneroTx) state = state.toJson();
    else if (typeof state === "object") state = Object.assign({}, state);
    else throw new MoneroError("state must be a MoneroTx or JavaScript object");
    this.state = state;
    
    // deserialize fee
    if (state.fee !== undefined && !(state.fee instanceof BigInt)) state.fee = BigInt(state.fee);
    
    // deserialize inputs
    if (state.inputs) {
      for (let i = 0; i < state.inputs.length; i++) {
        if (!(state.inputs[i] instanceof MoneroOutput)) {
          state.inputs[i] = new MoneroOutput(Object.assign(state.inputs[i], {tx: this}));
        }
      }
    }
    
    // deserialize outputs
    if (state.outputs) {
      for (let i = 0; i < state.outputs.length; i++) {
        if (!(state.outputs[i] instanceof MoneroOutput)) {
          state.outputs[i] = new MoneroOutput(Object.assign(state.outputs[i], {tx: this}));
        }
      }
    }
  }
  
  /**
   * @return {MoneroBlock} tx block
   */
  getBlock() {
    return this.state.block;
  }
  
  /**
   * @param {MoneroBlock} block - tx block
   * @return {MoneroTx} this tx for chaining
   */
  setBlock(block) {
    this.state.block = block;
    return this;
  }
  
  /**
   * @return {number} tx height
   */
  getHeight() {
    return this.getBlock() === undefined ? undefined : this.getBlock().getHeight();
  }
  
  /**
   * @return {string} tx hash
   */
  getHash() {
    return this.state.hash;
  }
  
  /**
   * @param {string} hash - tx hash
   * @return {MoneroTx} this tx for chaining
   */
  setHash(hash) {
    this.state.hash = hash;
    return this;
  }
  
  /**
   * @return {number} tx version
   */
  getVersion() {
    return this.state.version;
  }
  
  /**
   * @param {number} version - tx version
   * @return {MoneroTx} this tx for chaining
   */
  setVersion(version) {
    this.state.version = version;
    return this;
  }
  
  /**
   * @return {boolean} true if the tx is a miner tx, false otherwise
   */
  isMinerTx() {
    return this.state.isMinerTx;
  }
  
  /**
   * @param {boolean} miner - true if the tx is a miner tx, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setIsMinerTx(miner) {
    this.state.isMinerTx = miner;
    return this;
  }
  
  /**
   * @return {string} tx payment id
   */
  getPaymentId() {
    return this.state.paymentId;
  }
  
  /**
   * @param {string} paymentId - tx payment id
   * @return {MoneroTx} this tx for chaining
   */
  setPaymentId(paymentId) {
    this.state.paymentId = paymentId;
    return this;
  }
  
  /**
   * @return {BigInt} tx fee
   */
  getFee() {
    return this.state.fee;
  }
  
  /**
   * @param {BigInt} fee - tx fee
   * @return {MoneroTx} this tx for chaining
   */
  setFee(fee) {
    this.state.fee = fee;
    return this;
  }
  
  /**
   * @return {number} tx ring size
   */
  getRingSize() {
    return this.state.ringSize;
  }
  
  /**
   * @param {number} ringSize - tx ring size
   * @return {MoneroTx} this tx for chaining
   */
  setRingSize(ringSize) {
    this.state.ringSize = ringSize;
    return this;
  }
  
  /**
   * @return {boolean} true if the tx is set to be relayed, false otherwise
   */
  getRelay() {
    return this.state.relay;
  }
  
  /**
   * @param {boolean} relay - true if the tx is set to be relayed, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setRelay(relay) {
    this.state.relay = relay;
    return this;
  }
  
  /**
   * @return {boolean} true if the tx is relayed, false otherwise
   */
  isRelayed() {
    return this.state.isRelayed;
  }
  
  /**
   * @param {boolean} isRelayed - true if the tx is relayed, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setIsRelayed(isRelayed) {
    this.state.isRelayed = isRelayed;
    return this;
  }
  
  /**
   * @return {boolean} true if the tx is confirmed, false otherwise
   */
  isConfirmed() {
    return this.state.isConfirmed;
  }
  
  /**
   * @param {boolean} isConfirmed - true if the tx is confirmed, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setIsConfirmed(isConfirmed) {
    this.state.isConfirmed = isConfirmed;
    return this;
  }
  
  /**
   * @return {boolean} true if the tx is in the memory pool, false otherwise
   */
  inTxPool() {
    return this.state.inTxPool;
  }
  
  /**
   * @param {boolean} inTxPool - true if the tx is in the memory pool, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setInTxPool(inTxPool) {
    this.state.inTxPool = inTxPool;
    return this;
  }
  
  /**
   * @return {number} number of block confirmations
   */
  getNumConfirmations() {
    return this.state.numConfirmations;
  }
  
  /**
   * @param {number} numConfirmations - number of block confirmations
   * @return {MoneroTx} this tx for chaining
   */
  setNumConfirmations(numConfirmations) {
    this.state.numConfirmations = numConfirmations;
    return this;
  }
  
  /**
   * @return {number} tx unlock height
   */
  getUnlockHeight() {
    return this.state.unlockHeight;
  }
  
  /**
   * @param {number} unlockHeight - tx unlock height
   * @return {MoneroTx} this tx for chaining
   */
  setUnlockHeight(unlockHeight) {
    this.state.unlockHeight = unlockHeight;
    return this;
  }
  
  /**
   * @return {number} timestamp the tx was last relayed from the node
   */
  getLastRelayedTimestamp() {
    return this.state.lastRelayedTimestamp;
  }
  
  /**
   * @param {number} lastRelayedTimestamp - timestamp the tx was last relayed from the node
   * @return {MoneroTx} this tx for chaining
   */
  setLastRelayedTimestamp(lastRelayedTimestamp) {
    this.state.lastRelayedTimestamp = lastRelayedTimestamp;
    return this;
  }
  
  /**
   * @return {number} timestamp the tx was received at the node
   */
  getReceivedTimestamp() {
    return this.state.receivedTimestamp;
  }
  
  /**
   * @param {number} receivedTimestamp - timestamp the tx was received at the node
   * @return {MoneroTx} this tx for chaining
   */
  setReceivedTimestamp(receivedTimestamp) {
    this.state.receivedTimestamp = receivedTimestamp;
    return this;
  }
  
  /**
   * @return {boolean} true if a double spend has been seen, false otherwise
   */
  isDoubleSpendSeen() {
    return this.state.isDoubleSpendSeen;
  }
  
  /**
   * @param {boolean} isDoubleSpendSeen - true if a double spend has been seen, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setIsDoubleSpend(isDoubleSpendSeen) {
    this.state.isDoubleSpendSeen = isDoubleSpendSeen;
    return this;
  }
  
  /**
   * @return {string} tx key
   */
  getKey() {
    return this.state.key;
  }
  
  /**
   * @param {string} key - tx key
   * @return {MoneroTx} this tx for chaining
   */
  setKey(key) {
    this.state.key = key;
    return this;
  }
  
  /**
   * Get full transaction hex. Full hex = pruned hex + prunable hex.
   * 
   * @return {string} full tx hex
   */
  getFullHex() {
    return this.state.fullHex;
  }
  
  /**
   * @param {string} fullHex - full tx hex
   * @return {MoneroTx} this tx for chaining
   */
  setFullHex(fullHex) {
    this.state.fullHex = fullHex;
    return this;
  }
  
  /**
   * Get pruned transaction hex. Full hex = pruned hex + prunable hex.
   * 
   * @return {string} pruned tx hex
   */
  getPrunedHex() {
    return this.state.prunedHex;
  }
  
  /**
   * @param {string} prunedHex - pruned tx hex
   * @return {MoneroTx} this tx for chaining
   */
  setPrunedHex(prunedHex) {
    this.state.prunedHex = prunedHex;
    return this;
  }
  
  /**
   * Get prunable transaction hex which is hex that is removed from a pruned
   * transaction. Full hex = pruned hex + prunable hex.
   * 
   * @return {string} prunable tx hex
   */
  getPrunableHex() {
    return this.state.prunableHex;
  }
  
  /**
   * @param {string} prunableHex - prunable tx hex
   * @return {MoneroTx} this tx for chaining
   */
  setPrunableHex(prunableHex) {
    this.state.prunableHex = prunableHex;
    return this;
  }
  
  /**
   * @return {string} prunable tx hash
   */
  getPrunableHash() {
    return this.state.prunableHash;
  }
  
  /**
   * @param {string} prunableHash - prunable tx hash
   * @return {MoneroTx} this tx for chaining
   */
  setPrunableHash(prunableHash) {
    this.state.prunableHash = prunableHash;
    return this;
  }
  
  /**
   * @return {number} tx size
   */
  getSize() {
    return this.state.size;
  }
  
  /**
   * @param {number} size - tx size
   * @return {MoneroTx} this tx for chaining
   */
  setSize(size) {
    this.state.size = size;
    return this;
  }
  
  /**
   * @return {number} tx weight
   */
  getWeight() {
    return this.state.weight;
  }
  
  /**
   * @param {number} weight - tx weight
   * @return {MoneroTx} this tx for chaining
   */
  setWeight(weight) {
    this.state.weight = weight;
    return this;
  }
  
  /**
   * @return {MoneroOutput[]} tx inputs
   */
  getInputs() {
    return this.state.inputs;
  }
  
  /**
   * @param {MoneroOutput[]} - tx inputs
   * @return {MoneroTx} this tx for chaining
   */
  setInputs(inputs) {
    this.state.inputs = inputs;
    return this;
  }
  
  /**
   * @return {MoneroOutput[]} tx outputs
   */
  getOutputs() {
    return this.state.outputs;
  }
  
  /**
   * @param {MoneroOutput[]} outputs - tx outputs
   * @return {MoneroTx} this tx for chaining
   */
  setOutputs(outputs) {
    this.state.outputs = outputs;
    return this;
  }
  
  /**
   * @return {number[]} tx output indices
   */
  getOutputIndices() {
    return this.state.outputIndices;
  }
  
  /**
   * @param {number[]} outputIndices - tx output indices
   * @return {MoneroTx} this tx for chaining
   */
  setOutputIndices(outputIndices) {
    this.state.outputIndices = outputIndices;
    return this;
  }
  
  /**
   * @return {string} tx metadata
   */
  getMetadata() {
    return this.state.metadata;
  }
  
  /**
   * @param {string} metadata - tx metadata
   * @return {MoneroTx} this tx for chaining
   */
  setMetadata(metadata) {
    this.state.metadata = metadata;
    return this;
  }
  
  /**
   * @return {number[]} tx extra
   */
  getExtra() {
    return this.state.extra;
  }
  
  /**
   * @param {number[]} extra - tx extra
   * @return {MoneroTx} this tx for chaining
   */
  setExtra(extra) {
    this.state.extra = extra;
    return this;
  }
  
  /**
   * @return {object} RCT signatures
   */
  getRctSignatures() {
    return this.state.rctSignatures;
  }
  
  /**
   * @param {object} rctSignatures - RCT signatures
   * @return {MoneroTx} this tx for chaining
   */
  setRctSignatures(rctSignatures) {
    this.state.rctSignatures = rctSignatures;
    return this;
  }
  
  /**
   * @return {object} prunable RCT signature data
   */
  getRctSigPrunable() {
    return this.state.rctSigPrunable;
  }
  
  /**
   * @param {object} rctSigPrunable - prunable RCT signature data
   * @return {MoneroTx} this tx for chaining
   */
  setRctSigPrunable(rctSigPrunable) {
    this.state.rctSigPrunable = rctSigPrunable;
    return this;
  }
  
  /**
   * @return {boolean} true if kept by a block, false otherwise
   */
  isKeptByBlock() {
    return  this.state.isKeptByBlock;
  }
  
  /**
   * @param {boolean} isKeptByBlock - true if kept by a block, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setIsKeptByBlock(isKeptByBlock) {
    this.state.isKeptByBlock = isKeptByBlock;
    return this;
  }
  
  /**
   * @return {boolean} true if the tx failed, false otherwise
   */
  isFailed() {
    return this.state.isFailed;
  }
  
  /**
   * @param {boolean} isFailed - true if the tx failed, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setIsFailed(isFailed) {
    this.state.isFailed = isFailed;
    return this;
  }
  
  /**
   * @return {number} block height of the last tx failure
   */
  getLastFailedHeight() {
    return this.state.lastFailedHeight;
  }
  
  /**
   * @param {number} lastFailedHeight - block height of the last tx failure
   * @return {MoneroTx} this tx for chaining
   */
  setLastFailedHeight(lastFailedHeight) {
    this.state.lastFailedHeight = lastFailedHeight;
    return this;
  }
  
  /**
   * @return {string} block hash of the last tx failure
   */
  getLastFailedHash() {
    return this.state.lastFailedHash;
  }
  
  /**
   * @param {string} lastFailedHash - block hash of the last tx failure
   * @return {MoneroTx} this tx for chaining
   */
  setLastFailedHash(lastFailedHash) {
    this.state.lastFailedHash = lastFailedHash;
    return this;
  }
  
  /**
   * @return {number} max used block height
   */
  getMaxUsedBlockHeight() {
    return this.state.maxUsedBlockHeight;
  }
  
  /**
   * @param {number} maxUsedBlockHeight - max used block height
   * @return {MoneroTx} this tx for chaining
   */
  setMaxUsedBlockHeight(maxUsedBlockHeight) {
    this.state.maxUsedBlockHeight = maxUsedBlockHeight;
    return this;
  }
  
  /**
   * @return {string} max used block hash
   */
  getMaxUsedBlockHash() {
    return this.state.maxUsedBlockHash;
  }
  
  /**
   * @param {string} maxUsedBlockHash - max used block hash
   * @return {MoneroTx} this tx for chaining
   */
  setMaxUsedBlockHash(maxUsedBlockHash) {
    this.state.maxUsedBlockHash = maxUsedBlockHash;
    return this;
  }
  
  /**
   * @return {string[]} tx signatures
   */
  getSignatures() {
    return this.state.signatures;
  }
  
  /**
   * @param {string[]} signatures - tx signatures
   * @return {MoneroTx} this tx for chaining
   */
  setSignatures(signatures) {
    this.state.signatures = signatures;
    return this;
  }
  
  /**
   * @return {MoneroTx} a copy of this tx
   */
  copy() {
    return new MoneroTx(this);
  }
  
  /**
   * @return {object} json representation of this tx
   */
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getFee() !== undefined) json.fee = this.getFee().toString();
    if (this.getInputs() !== undefined) {
      json.inputs = [];
      for (let input of this.getInputs()) json.inputs.push(input.toJson());
    }
    if (this.getOutputs() !== undefined) {
      json.outputs = [];
      for (let output of this.getOutputs()) json.outputs.push(output.toJson());
    }
    if (this.getExtra() !== undefined) json.extra = this.getExtra().slice();
    delete json.block;  // do not serialize parent block
    return json;
  }
  
  /**
   * Updates this transaction by merging the latest information from the given
   * transaction.
   * 
   * @param {MoneroTx} tx - the transaction to update this transaction with
   * @return {MoneroTx} this for method chaining
   */
  merge(tx) {
    assert(tx instanceof MoneroTx);
    if (this === tx) return this;
    
    // merge blocks if they're different
    if (this.getBlock() !== tx.getBlock()) {
      if (this.getBlock() === undefined) {
        this.setBlock(tx.getBlock());
        this.getBlock().getTxs[this.getBlock().getTxs().indexOf(tx)] = this; // update block to point to this tx
      } else if (tx.getBlock() !== undefined) {
        this.getBlock().merge(tx.getBlock()); // comes back to merging txs
        return this;
      }
    }
    
    // otherwise merge tx fields
    this.setHash(GenUtils.reconcile(this.getHash(), tx.getHash()));
    this.setVersion(GenUtils.reconcile(this.getVersion(), tx.getVersion()));
    this.setPaymentId(GenUtils.reconcile(this.getPaymentId(), tx.getPaymentId()));
    this.setFee(GenUtils.reconcile(this.getFee(), tx.getFee()));
    this.setRingSize(GenUtils.reconcile(this.getRingSize(), tx.getRingSize()));
    this.setIsConfirmed(GenUtils.reconcile(this.isConfirmed(), tx.isConfirmed(), {resolveTrue: true})); // tx can become confirmed
    this.setIsMinerTx(GenUtils.reconcile(this.isMinerTx(), tx.isMinerTx(), null, null, null));
    this.setRelay(GenUtils.reconcile(this.getRelay(), tx.getRelay(), {resolveTrue: true}));       // tx can become relayed
    this.setIsRelayed(GenUtils.reconcile(this.isRelayed(), tx.isRelayed(), {resolveTrue: true})); // tx can become relayed
    this.setIsDoubleSpend(GenUtils.reconcile(this.isDoubleSpendSeen(), tx.isDoubleSpendSeen(), {resolveTrue: true})); // double spend can become seen
    this.setKey(GenUtils.reconcile(this.getKey(), tx.getKey()));
    this.setFullHex(GenUtils.reconcile(this.getFullHex(), tx.getFullHex()));
    this.setPrunedHex(GenUtils.reconcile(this.getPrunedHex(), tx.getPrunedHex()));
    this.setPrunableHex(GenUtils.reconcile(this.getPrunableHex(), tx.getPrunableHex()));
    this.setPrunableHash(GenUtils.reconcile(this.getPrunableHash(), tx.getPrunableHash()));
    this.setSize(GenUtils.reconcile(this.getSize(), tx.getSize()));
    this.setWeight(GenUtils.reconcile(this.getWeight(), tx.getWeight()));
    this.setOutputIndices(GenUtils.reconcile(this.getOutputIndices(), tx.getOutputIndices()));
    this.setMetadata(GenUtils.reconcile(this.getMetadata(), tx.getMetadata()));
    this.setExtra(GenUtils.reconcile(this.getExtra(), tx.getExtra()));
    this.setRctSignatures(GenUtils.reconcile(this.getRctSignatures(), tx.getRctSignatures()));
    this.setRctSigPrunable(GenUtils.reconcile(this.getRctSigPrunable(), tx.getRctSigPrunable()));
    this.setIsKeptByBlock(GenUtils.reconcile(this.isKeptByBlock(), tx.isKeptByBlock()));
    this.setIsFailed(GenUtils.reconcile(this.isFailed(), tx.isFailed()));
    this.setLastFailedHeight(GenUtils.reconcile(this.getLastFailedHeight(), tx.getLastFailedHeight()));
    this.setLastFailedHash(GenUtils.reconcile(this.getLastFailedHash(), tx.getLastFailedHash()));
    this.setMaxUsedBlockHeight(GenUtils.reconcile(this.getMaxUsedBlockHeight(), tx.getMaxUsedBlockHeight()));
    this.setMaxUsedBlockHash(GenUtils.reconcile(this.getMaxUsedBlockHash(), tx.getMaxUsedBlockHash()));
    this.setSignatures(GenUtils.reconcile(this.getSignatures(), tx.getSignatures()));
    this.setUnlockHeight(GenUtils.reconcile(this.getUnlockHeight(), tx.getUnlockHeight()));
    this.setNumConfirmations(GenUtils.reconcile(this.getNumConfirmations(), tx.getNumConfirmations(), {resolveMax: true})); // num confirmations can increase
    
    // merge inputs
    if (tx.getInputs()) {
      for (let merger of tx.getInputs()) {
        let merged = false;
        merger.setTx(this);
        if (!this.getInputs()) this.setInputs([]);
        for (let mergee of this.getInputs()) {
          if (mergee.getKeyImage().getHex() === merger.getKeyImage().getHex()) {
            mergee.merge(merger);
            merged = true;
            break;
          }
        }
        if (!merged) this.getInputs().push(merger);
      }
    }
    
    // merge outputs
    if (tx.getOutputs()) {
      for (let output of tx.getOutputs()) output.setTx(this);
      if (!this.getOutputs()) this.setOutputs(tx.getOutputs());
      else {
        
        // merge outputs if key image or stealth public key present, otherwise append
        for (let merger of tx.getOutputs()) {
          let merged = false;
          merger.setTx(this);
          for (let mergee of this.getOutputs()) {
            if ((merger.getKeyImage() && mergee.getKeyImage().getHex() === merger.getKeyImage().getHex()) ||
                (merger.getStealthPublicKey() && mergee.getStealthPublicKey() === merger.getStealthPublicKey())) {
             mergee.merge(merger);
             merged = true;
             break;
            }
          }
          if (!merged) this.getOutputs().push(merger); // append output
        }
      }
    }
    
    // handle unrelayed -> relayed -> confirmed
    if (this.isConfirmed() !== undefined) {
      this.setInTxPool(false);
      this.setReceivedTimestamp(undefined);
      this.setLastRelayedTimestamp(undefined);
    } else {
      this.setInTxPool(GenUtils.reconcile(this.inTxPool(), tx.inTxPool(), {resolveTrue: true})); // unrelayed -> tx pool
      this.setReceivedTimestamp(GenUtils.reconcile(this.getReceivedTimestamp(), tx.getReceivedTimestamp(), {resolveMax: false})); // take earliest receive time
      this.setLastRelayedTimestamp(GenUtils.reconcile(this.getLastRelayedTimestamp(), tx.getLastRelayedTimestamp(), {resolveMax: true}));  // take latest relay time
    }
    
    return this;  // for chaining
  }
  
  /**
   * @param {number} [indent] - starting indentation
   * @return {string} string representation of this tx
   */
  toString(indent = 0) {
    let str = "";
    str += GenUtils.getIndent(indent) + "=== TX ===\n";
    str += GenUtils.kvLine("Tx hash", this.getHash(), indent);
    str += GenUtils.kvLine("Height", this.getHeight(), indent);
    str += GenUtils.kvLine("Version", this.getVersion(), indent);
    str += GenUtils.kvLine("Is miner tx", this.isMinerTx(), indent);
    str += GenUtils.kvLine("Payment ID", this.getPaymentId(), indent);
    str += GenUtils.kvLine("Fee", this.getFee(), indent);
    str += GenUtils.kvLine("Ring size", this.getRingSize(), indent);
    str += GenUtils.kvLine("Relay", this.getRelay(), indent);
    str += GenUtils.kvLine("Is relayed", this.isRelayed(), indent);
    str += GenUtils.kvLine("Is confirmed", this.isConfirmed(), indent);
    str += GenUtils.kvLine("In tx pool", this.inTxPool(), indent);
    str += GenUtils.kvLine("Num confirmations", this.getNumConfirmations(), indent);
    str += GenUtils.kvLine("Unlock height", this.getUnlockHeight(), indent);
    str += GenUtils.kvLine("Last relayed time", this.getLastRelayedTimestamp(), indent);
    str += GenUtils.kvLine("Received time", this.getReceivedTimestamp(), indent);
    str += GenUtils.kvLine("Is double spend", this.isDoubleSpendSeen(), indent);
    str += GenUtils.kvLine("Key", this.getKey(), indent);
    str += GenUtils.kvLine("Full hex", this.getFullHex(), indent);
    str += GenUtils.kvLine("Pruned hex", this.getPrunedHex(), indent);
    str += GenUtils.kvLine("Prunable hex", this.getPrunableHex(), indent);
    str += GenUtils.kvLine("Prunable hash", this.getPrunableHash(), indent);
    str += GenUtils.kvLine("Size", this.getSize(), indent);
    str += GenUtils.kvLine("Weight", this.getWeight(), indent);
    str += GenUtils.kvLine("Output indices", this.getOutputIndices(), indent);
    str += GenUtils.kvLine("Metadata", this.getMetadata(), indent);
    str += GenUtils.kvLine("Extra", this.getExtra(), indent);
    str += GenUtils.kvLine("RCT signatures", this.getRctSignatures(), indent);
    str += GenUtils.kvLine("RCT sig prunable", this.getRctSigPrunable(), indent);
    str += GenUtils.kvLine("Kept by block", this.isKeptByBlock(), indent);
    str += GenUtils.kvLine("Is failed", this.isFailed(), indent);
    str += GenUtils.kvLine("Last failed height", this.getLastFailedHeight(), indent);
    str += GenUtils.kvLine("Last failed hash", this.getLastFailedHash(), indent);
    str += GenUtils.kvLine("Max used block height", this.getMaxUsedBlockHeight(), indent);
    str += GenUtils.kvLine("Max used block hash", this.getMaxUsedBlockHash(), indent);
    str += GenUtils.kvLine("Signatures", this.getSignatures(), indent);
    if (this.getInputs() !== undefined) {
      str += GenUtils.kvLine("Inputs", "", indent);
      for (let i = 0; i < this.getInputs().length; i++) {
        str += GenUtils.kvLine(i + 1, "", indent + 1);
        str += this.getInputs()[i].toString(indent + 2);
        str += '\n'
      }
    }
    if (this.getOutputs() !== undefined) {
      str += GenUtils.kvLine("Outputs", "", indent);
      for (let i = 0; i < this.getOutputs().length; i++) {
        str += GenUtils.kvLine(i + 1, "", indent + 1);
        str += this.getOutputs()[i].toString(indent + 2);
        str += '\n'
      }
    }
    return str.slice(0, str.length - 1);  // strip last newline
  }
}

// default payment id
MoneroTx.DEFAULT_PAYMENT_ID = "0000000000000000";

export default MoneroTx;
