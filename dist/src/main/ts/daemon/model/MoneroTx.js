"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _assert = _interopRequireDefault(require("assert"));
var _GenUtils = _interopRequireDefault(require("../../common/GenUtils"));

var _MoneroOutput = _interopRequireDefault(require("./MoneroOutput"));

/**
 * Represents a transaction on the Monero network.
 */
class MoneroTx {

  static DEFAULT_PAYMENT_ID = "0000000000000000";







































  constructor(tx) {
    Object.assign(this, tx);
    this.block = undefined;

    // deserialize extra
    if (this.extra !== undefined) this.extra = new Uint8Array(this.extra);

    // deserialize bigints
    if (this.fee !== undefined && typeof this.fee !== "bigint") this.fee = BigInt(this.fee);
    if (this.unlockTime !== undefined && typeof this.unlockTime !== "bigint") this.unlockTime = BigInt(this.unlockTime);

    // copy inputs
    if (this.inputs) {
      this.inputs = this.inputs.slice();
      for (let i = 0; i < this.inputs.length; i++) {
        this.inputs[i] = new _MoneroOutput.default(this.inputs[i]).setTx(this);
      }
    }

    // copy outputs
    if (this.outputs) {
      this.outputs = this.outputs.slice();
      for (let i = 0; i < this.outputs.length; i++) {
        this.outputs[i] = new _MoneroOutput.default(this.outputs[i]).setTx(this);
      }
    }
  }

  /**
   * @return {MoneroBlock} tx block
   */
  getBlock() {
    return this.block;
  }

  /**
   * @param {MoneroBlock} block - tx block
   * @return {MoneroTx} this tx for chaining
   */
  setBlock(block) {
    this.block = block;
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
    return this.hash;
  }

  /**
   * @param {string} hash - tx hash
   * @return {MoneroTx} this tx for chaining
   */
  setHash(hash) {
    this.hash = hash;
    return this;
  }

  /**
   * @return {number} tx version
   */
  getVersion() {
    return this.version;
  }

  /**
   * @param {number} version - tx version
   * @return {MoneroTx} this tx for chaining
   */
  setVersion(version) {
    this.version = version;
    return this;
  }

  /**
   * @return {boolean} true if the tx is a miner tx, false otherwise
   */
  getIsMinerTx() {
    return this.isMinerTx;
  }

  /**
   * @param {boolean} miner - true if the tx is a miner tx, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setIsMinerTx(miner) {
    this.isMinerTx = miner;
    return this;
  }

  /**
   * @return {string} tx payment id
   */
  getPaymentId() {
    return this.paymentId;
  }

  /**
   * @param {string} paymentId - tx payment id
   * @return {MoneroTx} this tx for chaining
   */
  setPaymentId(paymentId) {
    this.paymentId = paymentId;
    return this;
  }

  /**
   * @return {bigint} tx fee
   */
  getFee() {
    return this.fee;
  }

  /**
   * @param {bigint} fee - tx fee
   * @return {MoneroTx} this tx for chaining
   */
  setFee(fee) {
    this.fee = fee;
    return this;
  }

  /**
   * @return {number} tx ring size
   */
  getRingSize() {
    return this.ringSize;
  }

  /**
   * @param {number} ringSize - tx ring size
   * @return {MoneroTx} this tx for chaining
   */
  setRingSize(ringSize) {
    this.ringSize = ringSize;
    return this;
  }

  /**
   * @return {boolean} true if the tx is set to be relayed, false otherwise
   */
  getRelay() {
    return this.relay;
  }

  /**
   * @param {boolean} relay - true if the tx is set to be relayed, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setRelay(relay) {
    this.relay = relay;
    return this;
  }

  /**
   * @return {boolean} true if the tx is relayed, false otherwise
   */
  getIsRelayed() {
    return this.isRelayed;
  }

  /**
   * @param {boolean} isRelayed - true if the tx is relayed, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setIsRelayed(isRelayed) {
    this.isRelayed = isRelayed;
    return this;
  }

  /**
   * @return {boolean} true if the tx is confirmed, false otherwise
   */
  getIsConfirmed() {
    return this.isConfirmed;
  }

  /**
   * @param {boolean} isConfirmed - true if the tx is confirmed, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setIsConfirmed(isConfirmed) {
    this.isConfirmed = isConfirmed;
    return this;
  }

  /**
   * @return {boolean} true if the tx is in the memory pool, false otherwise
   */
  getInTxPool() {
    return this.inTxPool;
  }

  /**
   * @param {boolean} inTxPool - true if the tx is in the memory pool, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setInTxPool(inTxPool) {
    this.inTxPool = inTxPool;
    return this;
  }

  /**
   * @return {number} number of block confirmations
   */
  getNumConfirmations() {
    return this.numConfirmations;
  }

  /**
   * @param {number} numConfirmations - number of block confirmations
   * @return {MoneroTx} this tx for chaining
   */
  setNumConfirmations(numConfirmations) {
    this.numConfirmations = numConfirmations;
    return this;
  }

  /**
   * Get the minimum height or timestamp for the transactions to unlock.
   * 
   * @return {bigint} the minimum height or timestamp for the transactin to unlock
   */
  getUnlockTime() {
    return this.unlockTime;
  }

  setUnlockTime(unlockTime) {
    if (unlockTime !== undefined && typeof unlockTime !== "bigint") unlockTime = BigInt(unlockTime);
    this.unlockTime = unlockTime;
    return this;
  }

  /**
   * @return {number} timestamp the tx was last relayed from the node
   */
  getLastRelayedTimestamp() {
    return this.lastRelayedTimestamp;
  }

  /**
   * @param {number} lastRelayedTimestamp - timestamp the tx was last relayed from the node
   * @return {MoneroTx} this tx for chaining
   */
  setLastRelayedTimestamp(lastRelayedTimestamp) {
    this.lastRelayedTimestamp = lastRelayedTimestamp;
    return this;
  }

  /**
   * @return {number} timestamp the tx was received at the node
   */
  getReceivedTimestamp() {
    return this.receivedTimestamp;
  }

  /**
   * @param {number} receivedTimestamp - timestamp the tx was received at the node
   * @return {MoneroTx} this tx for chaining
   */
  setReceivedTimestamp(receivedTimestamp) {
    this.receivedTimestamp = receivedTimestamp;
    return this;
  }

  /**
   * @return {boolean} true if a double spend has been seen, false otherwise
   */
  getIsDoubleSpendSeen() {
    return this.isDoubleSpendSeen;
  }

  /**
   * @param {boolean} isDoubleSpendSeen - true if a double spend has been seen, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setIsDoubleSpendSeen(isDoubleSpendSeen) {
    this.isDoubleSpendSeen = isDoubleSpendSeen;
    return this;
  }

  /**
   * @return {string} tx key
   */
  getKey() {
    return this.key;
  }

  /**
   * @param {string} key - tx key
   * @return {MoneroTx} this tx for chaining
   */
  setKey(key) {
    this.key = key;
    return this;
  }

  /**
   * Get full transaction hex. Full hex = pruned hex + prunable hex.
   * 
   * @return {string} full tx hex
   */
  getFullHex() {
    return this.fullHex;
  }

  /**
   * @param {string} fullHex - full tx hex
   * @return {MoneroTx} this tx for chaining
   */
  setFullHex(fullHex) {
    this.fullHex = fullHex;
    return this;
  }

  /**
   * Get pruned transaction hex. Full hex = pruned hex + prunable hex.
   * 
   * @return {string} pruned tx hex
   */
  getPrunedHex() {
    return this.prunedHex;
  }

  /**
   * @param {string} prunedHex - pruned tx hex
   * @return {MoneroTx} this tx for chaining
   */
  setPrunedHex(prunedHex) {
    this.prunedHex = prunedHex;
    return this;
  }

  /**
   * Get prunable transaction hex which is hex that is removed from a pruned
   * transaction. Full hex = pruned hex + prunable hex.
   * 
   * @return {string} prunable tx hex
   */
  getPrunableHex() {
    return this.prunableHex;
  }

  /**
   * @param {string} prunableHex - prunable tx hex
   * @return {MoneroTx} this tx for chaining
   */
  setPrunableHex(prunableHex) {
    this.prunableHex = prunableHex;
    return this;
  }

  /**
   * @return {string} prunable tx hash
   */
  getPrunableHash() {
    return this.prunableHash;
  }

  /**
   * @param {string} prunableHash - prunable tx hash
   * @return {MoneroTx} this tx for chaining
   */
  setPrunableHash(prunableHash) {
    this.prunableHash = prunableHash;
    return this;
  }

  /**
   * @return {number} tx size
   */
  getSize() {
    return this.size;
  }

  /**
   * @param {number} size - tx size
   * @return {MoneroTx} this tx for chaining
   */
  setSize(size) {
    this.size = size;
    return this;
  }

  /**
   * @return {number} tx weight
   */
  getWeight() {
    return this.weight;
  }

  /**
   * @param {number} weight - tx weight
   * @return {MoneroTx} this tx for chaining
   */
  setWeight(weight) {
    this.weight = weight;
    return this;
  }

  /**
   * @return {MoneroOutput[]} tx inputs
   */
  getInputs() {
    return this.inputs;
  }

  /**
   * @param {MoneroOutput[]} - tx inputs
   * @return {MoneroTx} this tx for chaining
   */
  setInputs(inputs) {
    this.inputs = inputs;
    return this;
  }

  /**
   * @return {MoneroOutput[]} tx outputs
   */
  getOutputs() {
    return this.outputs;
  }

  /**
   * @param {MoneroOutput[]} outputs - tx outputs
   * @return {MoneroTx} this tx for chaining
   */
  setOutputs(outputs) {
    this.outputs = outputs;
    return this;
  }

  /**
   * @return {number[]} tx output indices
   */
  getOutputIndices() {
    return this.outputIndices;
  }

  /**
   * @param {number[]} outputIndices - tx output indices
   * @return {MoneroTx} this tx for chaining
   */
  setOutputIndices(outputIndices) {
    this.outputIndices = outputIndices;
    return this;
  }

  /**
   * @return {string} tx metadata
   */
  getMetadata() {
    return this.metadata;
  }

  /**
   * @param {string} metadata - tx metadata
   * @return {MoneroTx} this tx for chaining
   */
  setMetadata(metadata) {
    this.metadata = metadata;
    return this;
  }

  /**
   * @return {Uint8Array} tx extra
   */
  getExtra() {
    return this.extra;
  }

  /**
   * @param {Uint8Array} extra - tx extra
   * @return {MoneroTx} this tx for chaining
   */
  setExtra(extra) {
    this.extra = extra;
    return this;
  }

  /**
   * @return {any} RCT signatures
   */
  getRctSignatures() {
    return this.rctSignatures;
  }

  /**
   * @param {any} rctSignatures - RCT signatures
   * @return {MoneroTx} this tx for chaining
   */
  setRctSignatures(rctSignatures) {
    this.rctSignatures = rctSignatures;
    return this;
  }

  /**
   * @return {any} prunable RCT signature data
   */
  getRctSigPrunable() {
    return this.rctSigPrunable;
  }

  /**
   * @param {any} rctSigPrunable - prunable RCT signature data
   * @return {MoneroTx} this tx for chaining
   */
  setRctSigPrunable(rctSigPrunable) {
    this.rctSigPrunable = rctSigPrunable;
    return this;
  }

  /**
   * @return {boolean} true if kept by a block, false otherwise
   */
  getIsKeptByBlock() {
    return this.isKeptByBlock;
  }

  /**
   * @param {boolean} isKeptByBlock - true if kept by a block, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setIsKeptByBlock(isKeptByBlock) {
    this.isKeptByBlock = isKeptByBlock;
    return this;
  }

  /**
   * @return {boolean} true if the tx failed, false otherwise
   */
  getIsFailed() {
    return this.isFailed;
  }

  /**
   * @param {boolean} isFailed - true if the tx failed, false otherwise
   * @return {MoneroTx} this tx for chaining
   */
  setIsFailed(isFailed) {
    this.isFailed = isFailed;
    return this;
  }

  /**
   * @return {number} block height of the last tx failure
   */
  getLastFailedHeight() {
    return this.lastFailedHeight;
  }

  /**
   * @param {number} lastFailedHeight - block height of the last tx failure
   * @return {MoneroTx} this tx for chaining
   */
  setLastFailedHeight(lastFailedHeight) {
    this.lastFailedHeight = lastFailedHeight;
    return this;
  }

  /**
   * @return {string} block hash of the last tx failure
   */
  getLastFailedHash() {
    return this.lastFailedHash;
  }

  /**
   * @param {string} lastFailedHash - block hash of the last tx failure
   * @return {MoneroTx} this tx for chaining
   */
  setLastFailedHash(lastFailedHash) {
    this.lastFailedHash = lastFailedHash;
    return this;
  }

  /**
   * @return {number} max used block height
   */
  getMaxUsedBlockHeight() {
    return this.maxUsedBlockHeight;
  }

  /**
   * @param {number} maxUsedBlockHeight - max used block height
   * @return {MoneroTx} this tx for chaining
   */
  setMaxUsedBlockHeight(maxUsedBlockHeight) {
    this.maxUsedBlockHeight = maxUsedBlockHeight;
    return this;
  }

  /**
   * @return {string} max used block hash
   */
  getMaxUsedBlockHash() {
    return this.maxUsedBlockHash;
  }

  /**
   * @param {string} maxUsedBlockHash - max used block hash
   * @return {MoneroTx} this tx for chaining
   */
  setMaxUsedBlockHash(maxUsedBlockHash) {
    this.maxUsedBlockHash = maxUsedBlockHash;
    return this;
  }

  /**
   * @return {string[]} tx signatures
   */
  getSignatures() {
    return this.signatures;
  }

  /**
   * @param {string[]} signatures - tx signatures
   * @return {MoneroTx} this tx for chaining
   */
  setSignatures(signatures) {
    this.signatures = signatures;
    return this;
  }

  /**
   * @return {MoneroTx} a copy of this tx
   */
  copy() {
    return new MoneroTx(this);
  }

  /**
   * @return {any} json representation of this tx
   */
  toJson() {
    let json = Object.assign({}, this);
    if (this.getFee() !== undefined) json.fee = this.getFee().toString();
    if (this.getUnlockTime() !== undefined) json.unlockTime = this.getUnlockTime().toString();
    if (this.getInputs()) {
      json.inputs = [];
      for (let input of this.getInputs()) json.inputs.push(input.toJson());
    }
    if (this.getOutputs()) {
      json.outputs = [];
      for (let output of this.getOutputs()) json.outputs.push(output.toJson());
    }
    if (this.getExtra() !== undefined) json.extra = Array.from(this.getExtra(), (byte) => byte);
    delete json.block; // do not serialize parent block
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
    (0, _assert.default)(tx instanceof MoneroTx);
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
    this.setHash(_GenUtils.default.reconcile(this.getHash(), tx.getHash()));
    this.setVersion(_GenUtils.default.reconcile(this.getVersion(), tx.getVersion()));
    this.setPaymentId(_GenUtils.default.reconcile(this.getPaymentId(), tx.getPaymentId()));
    this.setFee(_GenUtils.default.reconcile(this.getFee(), tx.getFee()));
    this.setRingSize(_GenUtils.default.reconcile(this.getRingSize(), tx.getRingSize()));
    this.setIsConfirmed(_GenUtils.default.reconcile(this.getIsConfirmed(), tx.getIsConfirmed(), { resolveTrue: true })); // tx can become confirmed
    this.setIsMinerTx(_GenUtils.default.reconcile(this.getIsMinerTx(), tx.getIsMinerTx()));
    this.setRelay(_GenUtils.default.reconcile(this.getRelay(), tx.getRelay(), { resolveTrue: true })); // tx can become relayed
    this.setIsRelayed(_GenUtils.default.reconcile(this.getIsRelayed(), tx.getIsRelayed(), { resolveTrue: true })); // tx can become relayed
    this.setIsDoubleSpendSeen(_GenUtils.default.reconcile(this.getIsDoubleSpendSeen(), tx.getIsDoubleSpendSeen(), { resolveTrue: true })); // double spend can become seen
    this.setKey(_GenUtils.default.reconcile(this.getKey(), tx.getKey()));
    this.setFullHex(_GenUtils.default.reconcile(this.getFullHex(), tx.getFullHex()));
    this.setPrunedHex(_GenUtils.default.reconcile(this.getPrunedHex(), tx.getPrunedHex()));
    this.setPrunableHex(_GenUtils.default.reconcile(this.getPrunableHex(), tx.getPrunableHex()));
    this.setPrunableHash(_GenUtils.default.reconcile(this.getPrunableHash(), tx.getPrunableHash()));
    this.setSize(_GenUtils.default.reconcile(this.getSize(), tx.getSize()));
    this.setWeight(_GenUtils.default.reconcile(this.getWeight(), tx.getWeight()));
    this.setOutputIndices(_GenUtils.default.reconcile(this.getOutputIndices(), tx.getOutputIndices()));
    this.setMetadata(_GenUtils.default.reconcile(this.getMetadata(), tx.getMetadata()));
    this.setExtra(_GenUtils.default.reconcile(this.getExtra(), tx.getExtra()));
    this.setRctSignatures(_GenUtils.default.reconcile(this.getRctSignatures(), tx.getRctSignatures()));
    this.setRctSigPrunable(_GenUtils.default.reconcile(this.getRctSigPrunable(), tx.getRctSigPrunable()));
    this.setIsKeptByBlock(_GenUtils.default.reconcile(this.getIsKeptByBlock(), tx.getIsKeptByBlock()));
    this.setIsFailed(_GenUtils.default.reconcile(this.getIsFailed(), tx.getIsFailed(), { resolveTrue: true }));
    this.setLastFailedHeight(_GenUtils.default.reconcile(this.getLastFailedHeight(), tx.getLastFailedHeight()));
    this.setLastFailedHash(_GenUtils.default.reconcile(this.getLastFailedHash(), tx.getLastFailedHash()));
    this.setMaxUsedBlockHeight(_GenUtils.default.reconcile(this.getMaxUsedBlockHeight(), tx.getMaxUsedBlockHeight()));
    this.setMaxUsedBlockHash(_GenUtils.default.reconcile(this.getMaxUsedBlockHash(), tx.getMaxUsedBlockHash()));
    this.setSignatures(_GenUtils.default.reconcile(this.getSignatures(), tx.getSignatures()));
    this.setUnlockTime(_GenUtils.default.reconcile(this.getUnlockTime(), tx.getUnlockTime()));
    this.setNumConfirmations(_GenUtils.default.reconcile(this.getNumConfirmations(), tx.getNumConfirmations(), { resolveMax: true })); // num confirmations can increase

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
      if (!this.getOutputs()) this.setOutputs(tx.getOutputs());else
      {

        // merge outputs if key image or stealth public key present, otherwise append
        for (let merger of tx.getOutputs()) {
          let merged = false;
          merger.setTx(this);
          for (let mergee of this.getOutputs()) {
            if (merger.getKeyImage() && mergee.getKeyImage().getHex() === merger.getKeyImage().getHex() ||
            merger.getStealthPublicKey() && mergee.getStealthPublicKey() === merger.getStealthPublicKey()) {
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
    if (this.getIsConfirmed()) {
      this.setInTxPool(false);
      this.setReceivedTimestamp(undefined);
      this.setLastRelayedTimestamp(undefined);
    } else {
      this.setInTxPool(_GenUtils.default.reconcile(this.getInTxPool(), tx.getInTxPool(), { resolveTrue: true })); // unrelayed -> tx pool
      this.setReceivedTimestamp(_GenUtils.default.reconcile(this.getReceivedTimestamp(), tx.getReceivedTimestamp(), { resolveMax: false })); // take earliest receive time
      this.setLastRelayedTimestamp(_GenUtils.default.reconcile(this.getLastRelayedTimestamp(), tx.getLastRelayedTimestamp(), { resolveMax: true })); // take latest relay time
    }

    return this; // for chaining
  }

  /**
   * @param {number} [indent] - starting indentation
   * @return {string} string representation of this tx
   */
  toString(indent = 0) {
    let str = "";
    str += _GenUtils.default.getIndent(indent) + "=== TX ===\n";
    str += _GenUtils.default.kvLine("Tx hash", this.getHash(), indent);
    str += _GenUtils.default.kvLine("Height", this.getHeight(), indent);
    str += _GenUtils.default.kvLine("Version", this.getVersion(), indent);
    str += _GenUtils.default.kvLine("Is miner tx", this.getIsMinerTx(), indent);
    str += _GenUtils.default.kvLine("Payment ID", this.getPaymentId(), indent);
    str += _GenUtils.default.kvLine("Fee", this.getFee(), indent);
    str += _GenUtils.default.kvLine("Ring size", this.getRingSize(), indent);
    str += _GenUtils.default.kvLine("Relay", this.getRelay(), indent);
    str += _GenUtils.default.kvLine("Is relayed", this.getIsRelayed(), indent);
    str += _GenUtils.default.kvLine("Is confirmed", this.getIsConfirmed(), indent);
    str += _GenUtils.default.kvLine("In tx pool", this.getInTxPool(), indent);
    str += _GenUtils.default.kvLine("Num confirmations", this.getNumConfirmations(), indent);
    str += _GenUtils.default.kvLine("Unlock time", this.getUnlockTime(), indent);
    str += _GenUtils.default.kvLine("Last relayed time", this.getLastRelayedTimestamp(), indent);
    str += _GenUtils.default.kvLine("Received time", this.getReceivedTimestamp(), indent);
    str += _GenUtils.default.kvLine("Is double spend", this.getIsDoubleSpendSeen(), indent);
    str += _GenUtils.default.kvLine("Key", this.getKey(), indent);
    str += _GenUtils.default.kvLine("Full hex", this.getFullHex(), indent);
    str += _GenUtils.default.kvLine("Pruned hex", this.getPrunedHex(), indent);
    str += _GenUtils.default.kvLine("Prunable hex", this.getPrunableHex(), indent);
    str += _GenUtils.default.kvLine("Prunable hash", this.getPrunableHash(), indent);
    str += _GenUtils.default.kvLine("Size", this.getSize(), indent);
    str += _GenUtils.default.kvLine("Weight", this.getWeight(), indent);
    str += _GenUtils.default.kvLine("Output indices", this.getOutputIndices(), indent);
    str += _GenUtils.default.kvLine("Metadata", this.getMetadata(), indent);
    str += _GenUtils.default.kvLine("Extra", this.getExtra(), indent);
    str += _GenUtils.default.kvLine("RCT signatures", this.getRctSignatures(), indent);
    str += _GenUtils.default.kvLine("RCT sig prunable", this.getRctSigPrunable(), indent);
    str += _GenUtils.default.kvLine("Kept by block", this.getIsKeptByBlock(), indent);
    str += _GenUtils.default.kvLine("Is failed", this.getIsFailed(), indent);
    str += _GenUtils.default.kvLine("Last failed height", this.getLastFailedHeight(), indent);
    str += _GenUtils.default.kvLine("Last failed hash", this.getLastFailedHash(), indent);
    str += _GenUtils.default.kvLine("Max used block height", this.getMaxUsedBlockHeight(), indent);
    str += _GenUtils.default.kvLine("Max used block hash", this.getMaxUsedBlockHash(), indent);
    str += _GenUtils.default.kvLine("Signatures", this.getSignatures(), indent);
    if (this.getInputs() !== undefined) {
      str += _GenUtils.default.kvLine("Inputs", "", indent);
      for (let i = 0; i < this.getInputs().length; i++) {
        str += _GenUtils.default.kvLine(i + 1, "", indent + 1);
        str += this.getInputs()[i].toString(indent + 2);
        str += '\n';
      }
    }
    if (this.getOutputs() !== undefined) {
      str += _GenUtils.default.kvLine("Outputs", "", indent);
      for (let i = 0; i < this.getOutputs().length; i++) {
        str += _GenUtils.default.kvLine(i + 1, "", indent + 1);
        str += this.getOutputs()[i].toString(indent + 2);
        str += '\n';
      }
    }
    return str.slice(0, str.length - 1); // strip last newline
  }
}exports.default = MoneroTx;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTW9uZXJvT3V0cHV0IiwiTW9uZXJvVHgiLCJERUZBVUxUX1BBWU1FTlRfSUQiLCJjb25zdHJ1Y3RvciIsInR4IiwiT2JqZWN0IiwiYXNzaWduIiwiYmxvY2siLCJ1bmRlZmluZWQiLCJleHRyYSIsIlVpbnQ4QXJyYXkiLCJmZWUiLCJCaWdJbnQiLCJ1bmxvY2tUaW1lIiwiaW5wdXRzIiwic2xpY2UiLCJpIiwibGVuZ3RoIiwiTW9uZXJvT3V0cHV0Iiwic2V0VHgiLCJvdXRwdXRzIiwiZ2V0QmxvY2siLCJzZXRCbG9jayIsImdldEhlaWdodCIsImdldEhhc2giLCJoYXNoIiwic2V0SGFzaCIsImdldFZlcnNpb24iLCJ2ZXJzaW9uIiwic2V0VmVyc2lvbiIsImdldElzTWluZXJUeCIsImlzTWluZXJUeCIsInNldElzTWluZXJUeCIsIm1pbmVyIiwiZ2V0UGF5bWVudElkIiwicGF5bWVudElkIiwic2V0UGF5bWVudElkIiwiZ2V0RmVlIiwic2V0RmVlIiwiZ2V0UmluZ1NpemUiLCJyaW5nU2l6ZSIsInNldFJpbmdTaXplIiwiZ2V0UmVsYXkiLCJyZWxheSIsInNldFJlbGF5IiwiZ2V0SXNSZWxheWVkIiwiaXNSZWxheWVkIiwic2V0SXNSZWxheWVkIiwiZ2V0SXNDb25maXJtZWQiLCJpc0NvbmZpcm1lZCIsInNldElzQ29uZmlybWVkIiwiZ2V0SW5UeFBvb2wiLCJpblR4UG9vbCIsInNldEluVHhQb29sIiwiZ2V0TnVtQ29uZmlybWF0aW9ucyIsIm51bUNvbmZpcm1hdGlvbnMiLCJzZXROdW1Db25maXJtYXRpb25zIiwiZ2V0VW5sb2NrVGltZSIsInNldFVubG9ja1RpbWUiLCJnZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsImxhc3RSZWxheWVkVGltZXN0YW1wIiwic2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJnZXRSZWNlaXZlZFRpbWVzdGFtcCIsInJlY2VpdmVkVGltZXN0YW1wIiwic2V0UmVjZWl2ZWRUaW1lc3RhbXAiLCJnZXRJc0RvdWJsZVNwZW5kU2VlbiIsImlzRG91YmxlU3BlbmRTZWVuIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJnZXRLZXkiLCJrZXkiLCJzZXRLZXkiLCJnZXRGdWxsSGV4IiwiZnVsbEhleCIsInNldEZ1bGxIZXgiLCJnZXRQcnVuZWRIZXgiLCJwcnVuZWRIZXgiLCJzZXRQcnVuZWRIZXgiLCJnZXRQcnVuYWJsZUhleCIsInBydW5hYmxlSGV4Iiwic2V0UHJ1bmFibGVIZXgiLCJnZXRQcnVuYWJsZUhhc2giLCJwcnVuYWJsZUhhc2giLCJzZXRQcnVuYWJsZUhhc2giLCJnZXRTaXplIiwic2l6ZSIsInNldFNpemUiLCJnZXRXZWlnaHQiLCJ3ZWlnaHQiLCJzZXRXZWlnaHQiLCJnZXRJbnB1dHMiLCJzZXRJbnB1dHMiLCJnZXRPdXRwdXRzIiwic2V0T3V0cHV0cyIsImdldE91dHB1dEluZGljZXMiLCJvdXRwdXRJbmRpY2VzIiwic2V0T3V0cHV0SW5kaWNlcyIsImdldE1ldGFkYXRhIiwibWV0YWRhdGEiLCJzZXRNZXRhZGF0YSIsImdldEV4dHJhIiwic2V0RXh0cmEiLCJnZXRSY3RTaWduYXR1cmVzIiwicmN0U2lnbmF0dXJlcyIsInNldFJjdFNpZ25hdHVyZXMiLCJnZXRSY3RTaWdQcnVuYWJsZSIsInJjdFNpZ1BydW5hYmxlIiwic2V0UmN0U2lnUHJ1bmFibGUiLCJnZXRJc0tlcHRCeUJsb2NrIiwiaXNLZXB0QnlCbG9jayIsInNldElzS2VwdEJ5QmxvY2siLCJnZXRJc0ZhaWxlZCIsImlzRmFpbGVkIiwic2V0SXNGYWlsZWQiLCJnZXRMYXN0RmFpbGVkSGVpZ2h0IiwibGFzdEZhaWxlZEhlaWdodCIsInNldExhc3RGYWlsZWRIZWlnaHQiLCJnZXRMYXN0RmFpbGVkSGFzaCIsImxhc3RGYWlsZWRIYXNoIiwic2V0TGFzdEZhaWxlZEhhc2giLCJnZXRNYXhVc2VkQmxvY2tIZWlnaHQiLCJtYXhVc2VkQmxvY2tIZWlnaHQiLCJzZXRNYXhVc2VkQmxvY2tIZWlnaHQiLCJnZXRNYXhVc2VkQmxvY2tIYXNoIiwibWF4VXNlZEJsb2NrSGFzaCIsInNldE1heFVzZWRCbG9ja0hhc2giLCJnZXRTaWduYXR1cmVzIiwic2lnbmF0dXJlcyIsInNldFNpZ25hdHVyZXMiLCJjb3B5IiwidG9Kc29uIiwianNvbiIsInRvU3RyaW5nIiwiaW5wdXQiLCJwdXNoIiwib3V0cHV0IiwiQXJyYXkiLCJmcm9tIiwiYnl0ZSIsIm1lcmdlIiwiYXNzZXJ0IiwiZ2V0VHhzIiwiaW5kZXhPZiIsIkdlblV0aWxzIiwicmVjb25jaWxlIiwicmVzb2x2ZVRydWUiLCJyZXNvbHZlTWF4IiwibWVyZ2VyIiwibWVyZ2VkIiwibWVyZ2VlIiwiZ2V0S2V5SW1hZ2UiLCJnZXRIZXgiLCJnZXRTdGVhbHRoUHVibGljS2V5IiwiaW5kZW50Iiwic3RyIiwiZ2V0SW5kZW50Iiwia3ZMaW5lIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvVHgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uLy4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0IGZyb20gXCIuL01vbmVyb091dHB1dFwiO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSB0cmFuc2FjdGlvbiBvbiB0aGUgTW9uZXJvIG5ldHdvcmsuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1R4IHtcblxuICBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9QQVlNRU5UX0lEID0gXCIwMDAwMDAwMDAwMDAwMDAwXCI7XG5cbiAgYmxvY2s6IE1vbmVyb0Jsb2NrO1xuICBoYXNoOiBzdHJpbmc7XG4gIHZlcnNpb246IG51bWJlcjtcbiAgaXNNaW5lclR4OiBib29sZWFuO1xuICBwYXltZW50SWQ6IHN0cmluZztcbiAgZmVlOiBiaWdpbnQ7XG4gIHJpbmdTaXplOiBudW1iZXI7XG4gIHJlbGF5OiBib29sZWFuO1xuICBpc1JlbGF5ZWQ6IGJvb2xlYW47XG4gIGlzQ29uZmlybWVkOiBib29sZWFuO1xuICBpblR4UG9vbDogYm9vbGVhbjtcbiAgbnVtQ29uZmlybWF0aW9uczogbnVtYmVyO1xuICB1bmxvY2tUaW1lOiBiaWdpbnQ7XG4gIGxhc3RSZWxheWVkVGltZXN0YW1wOiBudW1iZXI7XG4gIHJlY2VpdmVkVGltZXN0YW1wOiBudW1iZXI7XG4gIGlzRG91YmxlU3BlbmRTZWVuOiBib29sZWFuO1xuICBrZXk6IHN0cmluZztcbiAgZnVsbEhleDogc3RyaW5nO1xuICBwcnVuZWRIZXg6IHN0cmluZztcbiAgcHJ1bmFibGVIZXg6IHN0cmluZztcbiAgcHJ1bmFibGVIYXNoOiBzdHJpbmc7XG4gIHNpemU6IG51bWJlcjtcbiAgd2VpZ2h0OiBudW1iZXI7XG4gIGlucHV0czogTW9uZXJvT3V0cHV0W107XG4gIG91dHB1dHM6IE1vbmVyb091dHB1dFtdO1xuICBvdXRwdXRJbmRpY2VzOiBudW1iZXJbXTtcbiAgbWV0YWRhdGE6IHN0cmluZztcbiAgZXh0cmE6IFVpbnQ4QXJyYXk7XG4gIHJjdFNpZ25hdHVyZXM6IGFueTtcbiAgcmN0U2lnUHJ1bmFibGU6IGFueTtcbiAgaXNLZXB0QnlCbG9jazogYm9vbGVhbjtcbiAgaXNGYWlsZWQ6IGJvb2xlYW47XG4gIGxhc3RGYWlsZWRIZWlnaHQ6IG51bWJlcjtcbiAgbGFzdEZhaWxlZEhhc2g6IHN0cmluZztcbiAgbWF4VXNlZEJsb2NrSGVpZ2h0OiBudW1iZXI7XG4gIG1heFVzZWRCbG9ja0hhc2g6IHN0cmluZztcbiAgc2lnbmF0dXJlczogc3RyaW5nW107XG4gIFxuICBjb25zdHJ1Y3Rvcih0eD86IFBhcnRpYWw8TW9uZXJvVHg+KSB7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLCB0eCk7XG4gICAgdGhpcy5ibG9jayA9IHVuZGVmaW5lZDtcblxuICAgIC8vIGRlc2VyaWFsaXplIGV4dHJhXG4gICAgaWYgKHRoaXMuZXh0cmEgIT09IHVuZGVmaW5lZCkgdGhpcy5leHRyYSA9IG5ldyBVaW50OEFycmF5KHRoaXMuZXh0cmEpO1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIGJpZ2ludHNcbiAgICBpZiAodGhpcy5mZWUgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgdGhpcy5mZWUgIT09IFwiYmlnaW50XCIpIHRoaXMuZmVlID0gQmlnSW50KHRoaXMuZmVlKTtcbiAgICBpZiAodGhpcy51bmxvY2tUaW1lICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHRoaXMudW5sb2NrVGltZSAhPT0gXCJiaWdpbnRcIikgdGhpcy51bmxvY2tUaW1lID0gQmlnSW50KHRoaXMudW5sb2NrVGltZSk7XG4gICAgXG4gICAgLy8gY29weSBpbnB1dHNcbiAgICBpZiAodGhpcy5pbnB1dHMpIHtcbiAgICAgIHRoaXMuaW5wdXRzID0gdGhpcy5pbnB1dHMuc2xpY2UoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5pbnB1dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5pbnB1dHNbaV0gPSBuZXcgTW9uZXJvT3V0cHV0KHRoaXMuaW5wdXRzW2ldKS5zZXRUeCh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY29weSBvdXRwdXRzXG4gICAgaWYgKHRoaXMub3V0cHV0cykge1xuICAgICAgdGhpcy5vdXRwdXRzID0gdGhpcy5vdXRwdXRzLnNsaWNlKCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMub3V0cHV0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLm91dHB1dHNbaV0gPSBuZXcgTW9uZXJvT3V0cHV0KHRoaXMub3V0cHV0c1tpXSkuc2V0VHgodGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7TW9uZXJvQmxvY2t9IHR4IGJsb2NrXG4gICAqL1xuICBnZXRCbG9jaygpOiBNb25lcm9CbG9jayB7XG4gICAgcmV0dXJuIHRoaXMuYmxvY2s7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge01vbmVyb0Jsb2NrfSBibG9jayAtIHR4IGJsb2NrXG4gICAqIEByZXR1cm4ge01vbmVyb1R4fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0QmxvY2soYmxvY2s6IE1vbmVyb0Jsb2NrKTogTW9uZXJvVHgge1xuICAgIHRoaXMuYmxvY2sgPSBibG9jaztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn0gdHggaGVpZ2h0XG4gICAqL1xuICBnZXRIZWlnaHQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5nZXRCbG9jaygpID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0aGlzLmdldEJsb2NrKCkuZ2V0SGVpZ2h0KCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHR4IGhhc2hcbiAgICovXG4gIGdldEhhc2goKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5oYXNoO1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhhc2ggLSB0eCBoYXNoXG4gICAqIEByZXR1cm4ge01vbmVyb1R4fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0SGFzaChoYXNoOiBzdHJpbmcpOiBNb25lcm9UeCB7XG4gICAgdGhpcy5oYXNoID0gaGFzaDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge251bWJlcn0gdHggdmVyc2lvblxuICAgKi9cbiAgZ2V0VmVyc2lvbigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnZlcnNpb247XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdmVyc2lvbiAtIHR4IHZlcnNpb25cbiAgICogQHJldHVybiB7TW9uZXJvVHh9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRWZXJzaW9uKHZlcnNpb246IG51bWJlcik6IE1vbmVyb1R4IHtcbiAgICB0aGlzLnZlcnNpb24gPSB2ZXJzaW9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgdHggaXMgYSBtaW5lciB0eCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXRJc01pbmVyVHgoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaXNNaW5lclR4O1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtib29sZWFufSBtaW5lciAtIHRydWUgaWYgdGhlIHR4IGlzIGEgbWluZXIgdHgsIGZhbHNlIG90aGVyd2lzZVxuICAgKiBAcmV0dXJuIHtNb25lcm9UeH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldElzTWluZXJUeChtaW5lcjogYm9vbGVhbik6IE1vbmVyb1R4IHtcbiAgICB0aGlzLmlzTWluZXJUeCA9IG1pbmVyO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfSB0eCBwYXltZW50IGlkXG4gICAqL1xuICBnZXRQYXltZW50SWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5wYXltZW50SWQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF5bWVudElkIC0gdHggcGF5bWVudCBpZFxuICAgKiBAcmV0dXJuIHtNb25lcm9UeH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldFBheW1lbnRJZChwYXltZW50SWQ6IHN0cmluZyk6IE1vbmVyb1R4IHtcbiAgICB0aGlzLnBheW1lbnRJZCA9IHBheW1lbnRJZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge2JpZ2ludH0gdHggZmVlXG4gICAqL1xuICBnZXRGZWUoKTogYmlnaW50IHtcbiAgICByZXR1cm4gdGhpcy5mZWU7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge2JpZ2ludH0gZmVlIC0gdHggZmVlXG4gICAqIEByZXR1cm4ge01vbmVyb1R4fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0RmVlKGZlZTogYmlnaW50KTogTW9uZXJvVHgge1xuICAgIHRoaXMuZmVlID0gZmVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfSB0eCByaW5nIHNpemVcbiAgICovXG4gIGdldFJpbmdTaXplKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMucmluZ1NpemU7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gcmluZ1NpemUgLSB0eCByaW5nIHNpemVcbiAgICogQHJldHVybiB7TW9uZXJvVHh9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRSaW5nU2l6ZShyaW5nU2l6ZTogbnVtYmVyKTogTW9uZXJvVHgge1xuICAgIHRoaXMucmluZ1NpemUgPSByaW5nU2l6ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIHR4IGlzIHNldCB0byBiZSByZWxheWVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldFJlbGF5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnJlbGF5O1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtib29sZWFufSByZWxheSAtIHRydWUgaWYgdGhlIHR4IGlzIHNldCB0byBiZSByZWxheWVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQHJldHVybiB7TW9uZXJvVHh9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRSZWxheShyZWxheTogYm9vbGVhbik6IE1vbmVyb1R4IHtcbiAgICB0aGlzLnJlbGF5ID0gcmVsYXk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSB0eCBpcyByZWxheWVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldElzUmVsYXllZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc1JlbGF5ZWQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzUmVsYXllZCAtIHRydWUgaWYgdGhlIHR4IGlzIHJlbGF5ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKiBAcmV0dXJuIHtNb25lcm9UeH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldElzUmVsYXllZChpc1JlbGF5ZWQ6IGJvb2xlYW4pOiBNb25lcm9UeCB7XG4gICAgdGhpcy5pc1JlbGF5ZWQgPSBpc1JlbGF5ZWQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSB0eCBpcyBjb25maXJtZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0SXNDb25maXJtZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaXNDb25maXJtZWQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzQ29uZmlybWVkIC0gdHJ1ZSBpZiB0aGUgdHggaXMgY29uZmlybWVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQHJldHVybiB7TW9uZXJvVHh9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRJc0NvbmZpcm1lZChpc0NvbmZpcm1lZDogYm9vbGVhbik6IE1vbmVyb1R4IHtcbiAgICB0aGlzLmlzQ29uZmlybWVkID0gaXNDb25maXJtZWQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSB0eCBpcyBpbiB0aGUgbWVtb3J5IHBvb2wsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0SW5UeFBvb2woKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaW5UeFBvb2w7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGluVHhQb29sIC0gdHJ1ZSBpZiB0aGUgdHggaXMgaW4gdGhlIG1lbW9yeSBwb29sLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQHJldHVybiB7TW9uZXJvVHh9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRJblR4UG9vbChpblR4UG9vbDogYm9vbGVhbik6IE1vbmVyb1R4IHtcbiAgICB0aGlzLmluVHhQb29sID0gaW5UeFBvb2w7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IG51bWJlciBvZiBibG9jayBjb25maXJtYXRpb25zXG4gICAqL1xuICBnZXROdW1Db25maXJtYXRpb25zKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMubnVtQ29uZmlybWF0aW9ucztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBudW1Db25maXJtYXRpb25zIC0gbnVtYmVyIG9mIGJsb2NrIGNvbmZpcm1hdGlvbnNcbiAgICogQHJldHVybiB7TW9uZXJvVHh9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXROdW1Db25maXJtYXRpb25zKG51bUNvbmZpcm1hdGlvbnM6IG51bWJlcik6IE1vbmVyb1R4IHtcbiAgICB0aGlzLm51bUNvbmZpcm1hdGlvbnMgPSBudW1Db25maXJtYXRpb25zO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBtaW5pbXVtIGhlaWdodCBvciB0aW1lc3RhbXAgZm9yIHRoZSB0cmFuc2FjdGlvbnMgdG8gdW5sb2NrLlxuICAgKiBcbiAgICogQHJldHVybiB7YmlnaW50fSB0aGUgbWluaW11bSBoZWlnaHQgb3IgdGltZXN0YW1wIGZvciB0aGUgdHJhbnNhY3RpbiB0byB1bmxvY2tcbiAgICovXG4gIGdldFVubG9ja1RpbWUoKTogYmlnaW50IHtcbiAgICByZXR1cm4gdGhpcy51bmxvY2tUaW1lO1xuICB9XG4gIFxuICBzZXRVbmxvY2tUaW1lKHVubG9ja1RpbWU6IGJpZ2ludCB8IHN0cmluZyB8IG51bWJlciB8IHVuZGVmaW5lZCk6IE1vbmVyb1R4IHtcbiAgICBpZiAodW5sb2NrVGltZSAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiB1bmxvY2tUaW1lICE9PSBcImJpZ2ludFwiKSB1bmxvY2tUaW1lID0gQmlnSW50KHVubG9ja1RpbWUpO1xuICAgIHRoaXMudW5sb2NrVGltZSA9IHVubG9ja1RpbWUgYXMgYmlnaW50IHwgdW5kZWZpbmVkO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfSB0aW1lc3RhbXAgdGhlIHR4IHdhcyBsYXN0IHJlbGF5ZWQgZnJvbSB0aGUgbm9kZVxuICAgKi9cbiAgZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5sYXN0UmVsYXllZFRpbWVzdGFtcDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsYXN0UmVsYXllZFRpbWVzdGFtcCAtIHRpbWVzdGFtcCB0aGUgdHggd2FzIGxhc3QgcmVsYXllZCBmcm9tIHRoZSBub2RlXG4gICAqIEByZXR1cm4ge01vbmVyb1R4fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAobGFzdFJlbGF5ZWRUaW1lc3RhbXA6IG51bWJlcik6IE1vbmVyb1R4IHtcbiAgICB0aGlzLmxhc3RSZWxheWVkVGltZXN0YW1wID0gbGFzdFJlbGF5ZWRUaW1lc3RhbXA7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IHRpbWVzdGFtcCB0aGUgdHggd2FzIHJlY2VpdmVkIGF0IHRoZSBub2RlXG4gICAqL1xuICBnZXRSZWNlaXZlZFRpbWVzdGFtcCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnJlY2VpdmVkVGltZXN0YW1wO1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IHJlY2VpdmVkVGltZXN0YW1wIC0gdGltZXN0YW1wIHRoZSB0eCB3YXMgcmVjZWl2ZWQgYXQgdGhlIG5vZGVcbiAgICogQHJldHVybiB7TW9uZXJvVHh9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRSZWNlaXZlZFRpbWVzdGFtcChyZWNlaXZlZFRpbWVzdGFtcDogbnVtYmVyKTogTW9uZXJvVHgge1xuICAgIHRoaXMucmVjZWl2ZWRUaW1lc3RhbXAgPSByZWNlaXZlZFRpbWVzdGFtcDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgYSBkb3VibGUgc3BlbmQgaGFzIGJlZW4gc2VlbiwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXRJc0RvdWJsZVNwZW5kU2VlbigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc0RvdWJsZVNwZW5kU2VlbjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNEb3VibGVTcGVuZFNlZW4gLSB0cnVlIGlmIGEgZG91YmxlIHNwZW5kIGhhcyBiZWVuIHNlZW4sIGZhbHNlIG90aGVyd2lzZVxuICAgKiBAcmV0dXJuIHtNb25lcm9UeH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldElzRG91YmxlU3BlbmRTZWVuKGlzRG91YmxlU3BlbmRTZWVuOiBib29sZWFuICk6IE1vbmVyb1R4IHtcbiAgICB0aGlzLmlzRG91YmxlU3BlbmRTZWVuID0gaXNEb3VibGVTcGVuZFNlZW47XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHR4IGtleVxuICAgKi9cbiAgZ2V0S2V5KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMua2V5O1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIHR4IGtleVxuICAgKiBAcmV0dXJuIHtNb25lcm9UeH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldEtleShrZXk6IHN0cmluZyk6IE1vbmVyb1R4IHtcbiAgICB0aGlzLmtleSA9IGtleTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBmdWxsIHRyYW5zYWN0aW9uIGhleC4gRnVsbCBoZXggPSBwcnVuZWQgaGV4ICsgcHJ1bmFibGUgaGV4LlxuICAgKiBcbiAgICogQHJldHVybiB7c3RyaW5nfSBmdWxsIHR4IGhleFxuICAgKi9cbiAgZ2V0RnVsbEhleCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmZ1bGxIZXg7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZnVsbEhleCAtIGZ1bGwgdHggaGV4XG4gICAqIEByZXR1cm4ge01vbmVyb1R4fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0RnVsbEhleChmdWxsSGV4OiBzdHJpbmcpOiBNb25lcm9UeCB7XG4gICAgdGhpcy5mdWxsSGV4ID0gZnVsbEhleDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBwcnVuZWQgdHJhbnNhY3Rpb24gaGV4LiBGdWxsIGhleCA9IHBydW5lZCBoZXggKyBwcnVuYWJsZSBoZXguXG4gICAqIFxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHBydW5lZCB0eCBoZXhcbiAgICovXG4gIGdldFBydW5lZEhleCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnBydW5lZEhleDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcnVuZWRIZXggLSBwcnVuZWQgdHggaGV4XG4gICAqIEByZXR1cm4ge01vbmVyb1R4fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0UHJ1bmVkSGV4KHBydW5lZEhleDogc3RyaW5nKTogTW9uZXJvVHgge1xuICAgIHRoaXMucHJ1bmVkSGV4ID0gcHJ1bmVkSGV4O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHBydW5hYmxlIHRyYW5zYWN0aW9uIGhleCB3aGljaCBpcyBoZXggdGhhdCBpcyByZW1vdmVkIGZyb20gYSBwcnVuZWRcbiAgICogdHJhbnNhY3Rpb24uIEZ1bGwgaGV4ID0gcHJ1bmVkIGhleCArIHBydW5hYmxlIGhleC5cbiAgICogXG4gICAqIEByZXR1cm4ge3N0cmluZ30gcHJ1bmFibGUgdHggaGV4XG4gICAqL1xuICBnZXRQcnVuYWJsZUhleCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnBydW5hYmxlSGV4O1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBydW5hYmxlSGV4IC0gcHJ1bmFibGUgdHggaGV4XG4gICAqIEByZXR1cm4ge01vbmVyb1R4fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0UHJ1bmFibGVIZXgocHJ1bmFibGVIZXg6IHN0cmluZyk6IE1vbmVyb1R4IHtcbiAgICB0aGlzLnBydW5hYmxlSGV4ID0gcHJ1bmFibGVIZXg7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHBydW5hYmxlIHR4IGhhc2hcbiAgICovXG4gIGdldFBydW5hYmxlSGFzaCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnBydW5hYmxlSGFzaDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcnVuYWJsZUhhc2ggLSBwcnVuYWJsZSB0eCBoYXNoXG4gICAqIEByZXR1cm4ge01vbmVyb1R4fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0UHJ1bmFibGVIYXNoKHBydW5hYmxlSGFzaDogc3RyaW5nKTogTW9uZXJvVHgge1xuICAgIHRoaXMucHJ1bmFibGVIYXNoID0gcHJ1bmFibGVIYXNoO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfSB0eCBzaXplXG4gICAqL1xuICBnZXRTaXplKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuc2l6ZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzaXplIC0gdHggc2l6ZVxuICAgKiBAcmV0dXJuIHtNb25lcm9UeH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldFNpemUoc2l6ZTogbnVtYmVyKTogTW9uZXJvVHgge1xuICAgIHRoaXMuc2l6ZSA9IHNpemU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IHR4IHdlaWdodFxuICAgKi9cbiAgZ2V0V2VpZ2h0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMud2VpZ2h0O1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IHdlaWdodCAtIHR4IHdlaWdodFxuICAgKiBAcmV0dXJuIHtNb25lcm9UeH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldFdlaWdodCh3ZWlnaHQ6IG51bWJlcik6IE1vbmVyb1R4IHtcbiAgICB0aGlzLndlaWdodCA9IHdlaWdodDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge01vbmVyb091dHB1dFtdfSB0eCBpbnB1dHNcbiAgICovXG4gIGdldElucHV0cygpOiBNb25lcm9PdXRwdXRbXSB7XG4gICAgcmV0dXJuIHRoaXMuaW5wdXRzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9PdXRwdXRbXX0gLSB0eCBpbnB1dHNcbiAgICogQHJldHVybiB7TW9uZXJvVHh9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRJbnB1dHMoaW5wdXRzOiBNb25lcm9PdXRwdXRbXSk6IE1vbmVyb1R4IHtcbiAgICB0aGlzLmlucHV0cyA9IGlucHV0cztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge01vbmVyb091dHB1dFtdfSB0eCBvdXRwdXRzXG4gICAqL1xuICBnZXRPdXRwdXRzKCk6IE1vbmVyb091dHB1dFtdIHtcbiAgICByZXR1cm4gdGhpcy5vdXRwdXRzO1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtNb25lcm9PdXRwdXRbXX0gb3V0cHV0cyAtIHR4IG91dHB1dHNcbiAgICogQHJldHVybiB7TW9uZXJvVHh9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRPdXRwdXRzKG91dHB1dHM6IE1vbmVyb091dHB1dFtdKTogTW9uZXJvVHgge1xuICAgIHRoaXMub3V0cHV0cyA9IG91dHB1dHM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtudW1iZXJbXX0gdHggb3V0cHV0IGluZGljZXNcbiAgICovXG4gIGdldE91dHB1dEluZGljZXMoKTogbnVtYmVyW10ge1xuICAgIHJldHVybiB0aGlzLm91dHB1dEluZGljZXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcltdfSBvdXRwdXRJbmRpY2VzIC0gdHggb3V0cHV0IGluZGljZXNcbiAgICogQHJldHVybiB7TW9uZXJvVHh9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRPdXRwdXRJbmRpY2VzKG91dHB1dEluZGljZXM6IG51bWJlcltdKTogTW9uZXJvVHgge1xuICAgIHRoaXMub3V0cHV0SW5kaWNlcyA9IG91dHB1dEluZGljZXM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHR4IG1ldGFkYXRhXG4gICAqL1xuICBnZXRNZXRhZGF0YSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLm1ldGFkYXRhO1xuICB9XG4gIFxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGFkYXRhIC0gdHggbWV0YWRhdGFcbiAgICogQHJldHVybiB7TW9uZXJvVHh9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRNZXRhZGF0YShtZXRhZGF0YTogc3RyaW5nKTogTW9uZXJvVHgge1xuICAgIHRoaXMubWV0YWRhdGEgPSBtZXRhZGF0YTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9IHR4IGV4dHJhXG4gICAqL1xuICBnZXRFeHRyYSgpOiBVaW50OEFycmF5IHtcbiAgICByZXR1cm4gdGhpcy5leHRyYTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gZXh0cmEgLSB0eCBleHRyYVxuICAgKiBAcmV0dXJuIHtNb25lcm9UeH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldEV4dHJhKGV4dHJhOiBVaW50OEFycmF5KTogTW9uZXJvVHgge1xuICAgIHRoaXMuZXh0cmEgPSBleHRyYTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHthbnl9IFJDVCBzaWduYXR1cmVzXG4gICAqL1xuICBnZXRSY3RTaWduYXR1cmVzKCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMucmN0U2lnbmF0dXJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gcmN0U2lnbmF0dXJlcyAtIFJDVCBzaWduYXR1cmVzXG4gICAqIEByZXR1cm4ge01vbmVyb1R4fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0UmN0U2lnbmF0dXJlcyhyY3RTaWduYXR1cmVzOiBhbnkpOiBNb25lcm9UeCB7XG4gICAgdGhpcy5yY3RTaWduYXR1cmVzID0gcmN0U2lnbmF0dXJlcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHthbnl9IHBydW5hYmxlIFJDVCBzaWduYXR1cmUgZGF0YVxuICAgKi9cbiAgZ2V0UmN0U2lnUHJ1bmFibGUoKTogb2JqZWN0IHtcbiAgICByZXR1cm4gdGhpcy5yY3RTaWdQcnVuYWJsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gcmN0U2lnUHJ1bmFibGUgLSBwcnVuYWJsZSBSQ1Qgc2lnbmF0dXJlIGRhdGFcbiAgICogQHJldHVybiB7TW9uZXJvVHh9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRSY3RTaWdQcnVuYWJsZShyY3RTaWdQcnVuYWJsZTogYW55KTogTW9uZXJvVHgge1xuICAgIHRoaXMucmN0U2lnUHJ1bmFibGUgPSByY3RTaWdQcnVuYWJsZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGtlcHQgYnkgYSBibG9jaywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXRJc0tlcHRCeUJsb2NrKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzS2VwdEJ5QmxvY2s7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtib29sZWFufSBpc0tlcHRCeUJsb2NrIC0gdHJ1ZSBpZiBrZXB0IGJ5IGEgYmxvY2ssIGZhbHNlIG90aGVyd2lzZVxuICAgKiBAcmV0dXJuIHtNb25lcm9UeH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldElzS2VwdEJ5QmxvY2soaXNLZXB0QnlCbG9jazogYm9vbGVhbik6IE1vbmVyb1R4IHtcbiAgICB0aGlzLmlzS2VwdEJ5QmxvY2sgPSBpc0tlcHRCeUJsb2NrO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIHR4IGZhaWxlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXRJc0ZhaWxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc0ZhaWxlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzRmFpbGVkIC0gdHJ1ZSBpZiB0aGUgdHggZmFpbGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICogQHJldHVybiB7TW9uZXJvVHh9IHRoaXMgdHggZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRJc0ZhaWxlZChpc0ZhaWxlZDogYm9vbGVhbik6IE1vbmVyb1R4IHtcbiAgICB0aGlzLmlzRmFpbGVkID0gaXNGYWlsZWQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfSBibG9jayBoZWlnaHQgb2YgdGhlIGxhc3QgdHggZmFpbHVyZVxuICAgKi9cbiAgZ2V0TGFzdEZhaWxlZEhlaWdodCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmxhc3RGYWlsZWRIZWlnaHQ7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IGxhc3RGYWlsZWRIZWlnaHQgLSBibG9jayBoZWlnaHQgb2YgdGhlIGxhc3QgdHggZmFpbHVyZVxuICAgKiBAcmV0dXJuIHtNb25lcm9UeH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldExhc3RGYWlsZWRIZWlnaHQobGFzdEZhaWxlZEhlaWdodDogbnVtYmVyKTogTW9uZXJvVHgge1xuICAgIHRoaXMubGFzdEZhaWxlZEhlaWdodCA9IGxhc3RGYWlsZWRIZWlnaHQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7c3RyaW5nfSBibG9jayBoYXNoIG9mIHRoZSBsYXN0IHR4IGZhaWx1cmVcbiAgICovXG4gIGdldExhc3RGYWlsZWRIYXNoKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMubGFzdEZhaWxlZEhhc2g7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxhc3RGYWlsZWRIYXNoIC0gYmxvY2sgaGFzaCBvZiB0aGUgbGFzdCB0eCBmYWlsdXJlXG4gICAqIEByZXR1cm4ge01vbmVyb1R4fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0TGFzdEZhaWxlZEhhc2gobGFzdEZhaWxlZEhhc2g6IHN0cmluZyk6IE1vbmVyb1R4IHtcbiAgICB0aGlzLmxhc3RGYWlsZWRIYXNoID0gbGFzdEZhaWxlZEhhc2g7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7bnVtYmVyfSBtYXggdXNlZCBibG9jayBoZWlnaHRcbiAgICovXG4gIGdldE1heFVzZWRCbG9ja0hlaWdodCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLm1heFVzZWRCbG9ja0hlaWdodDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4VXNlZEJsb2NrSGVpZ2h0IC0gbWF4IHVzZWQgYmxvY2sgaGVpZ2h0XG4gICAqIEByZXR1cm4ge01vbmVyb1R4fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0TWF4VXNlZEJsb2NrSGVpZ2h0KG1heFVzZWRCbG9ja0hlaWdodDogbnVtYmVyKTogTW9uZXJvVHgge1xuICAgIHRoaXMubWF4VXNlZEJsb2NrSGVpZ2h0ID0gbWF4VXNlZEJsb2NrSGVpZ2h0O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ30gbWF4IHVzZWQgYmxvY2sgaGFzaFxuICAgKi9cbiAgZ2V0TWF4VXNlZEJsb2NrSGFzaCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLm1heFVzZWRCbG9ja0hhc2g7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1heFVzZWRCbG9ja0hhc2ggLSBtYXggdXNlZCBibG9jayBoYXNoXG4gICAqIEByZXR1cm4ge01vbmVyb1R4fSB0aGlzIHR4IGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0TWF4VXNlZEJsb2NrSGFzaChtYXhVc2VkQmxvY2tIYXNoOiBzdHJpbmcpOiBNb25lcm9UeCB7XG4gICAgdGhpcy5tYXhVc2VkQmxvY2tIYXNoID0gbWF4VXNlZEJsb2NrSGFzaDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmdbXX0gdHggc2lnbmF0dXJlc1xuICAgKi9cbiAgZ2V0U2lnbmF0dXJlcygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIHRoaXMuc2lnbmF0dXJlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBzaWduYXR1cmVzIC0gdHggc2lnbmF0dXJlc1xuICAgKiBAcmV0dXJuIHtNb25lcm9UeH0gdGhpcyB0eCBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldFNpZ25hdHVyZXMoc2lnbmF0dXJlczogc3RyaW5nW10pOiBNb25lcm9UeCB7XG4gICAgdGhpcy5zaWduYXR1cmVzID0gc2lnbmF0dXJlcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtNb25lcm9UeH0gYSBjb3B5IG9mIHRoaXMgdHhcbiAgICovXG4gIGNvcHkoKTogTW9uZXJvVHgge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHgodGhpcyk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcmV0dXJuIHthbnl9IGpzb24gcmVwcmVzZW50YXRpb24gb2YgdGhpcyB0eFxuICAgKi9cbiAgdG9Kc29uKCk6IGFueSB7XG4gICAgbGV0IGpzb246IGFueSA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMpO1xuICAgIGlmICh0aGlzLmdldEZlZSgpICE9PSB1bmRlZmluZWQpIGpzb24uZmVlID0gdGhpcy5nZXRGZWUoKS50b1N0cmluZygpO1xuICAgIGlmICh0aGlzLmdldFVubG9ja1RpbWUoKSAhPT0gdW5kZWZpbmVkKSBqc29uLnVubG9ja1RpbWUgPSB0aGlzLmdldFVubG9ja1RpbWUoKS50b1N0cmluZygpO1xuICAgIGlmICh0aGlzLmdldElucHV0cygpKSB7XG4gICAgICBqc29uLmlucHV0cyA9IFtdO1xuICAgICAgZm9yIChsZXQgaW5wdXQgb2YgdGhpcy5nZXRJbnB1dHMoKSkganNvbi5pbnB1dHMucHVzaChpbnB1dC50b0pzb24oKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmdldE91dHB1dHMoKSkge1xuICAgICAganNvbi5vdXRwdXRzID0gW107XG4gICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdGhpcy5nZXRPdXRwdXRzKCkpIGpzb24ub3V0cHV0cy5wdXNoKG91dHB1dC50b0pzb24oKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmdldEV4dHJhKCkgIT09IHVuZGVmaW5lZCkganNvbi5leHRyYSA9IEFycmF5LmZyb20odGhpcy5nZXRFeHRyYSgpLCBieXRlID0+IGJ5dGUpO1xuICAgIGRlbGV0ZSBqc29uLmJsb2NrOyAgLy8gZG8gbm90IHNlcmlhbGl6ZSBwYXJlbnQgYmxvY2tcbiAgICByZXR1cm4ganNvbjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhpcyB0cmFuc2FjdGlvbiBieSBtZXJnaW5nIHRoZSBsYXRlc3QgaW5mb3JtYXRpb24gZnJvbSB0aGUgZ2l2ZW5cbiAgICogdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4fSB0eCAtIHRoZSB0cmFuc2FjdGlvbiB0byB1cGRhdGUgdGhpcyB0cmFuc2FjdGlvbiB3aXRoXG4gICAqIEByZXR1cm4ge01vbmVyb1R4fSB0aGlzIGZvciBtZXRob2QgY2hhaW5pbmdcbiAgICovXG4gIG1lcmdlKHR4OiBNb25lcm9UeCk6IE1vbmVyb1R4IHtcbiAgICBhc3NlcnQodHggaW5zdGFuY2VvZiBNb25lcm9UeCk7XG4gICAgaWYgKHRoaXMgPT09IHR4KSByZXR1cm4gdGhpcztcbiAgICBcbiAgICAvLyBtZXJnZSBibG9ja3MgaWYgdGhleSdyZSBkaWZmZXJlbnRcbiAgICBpZiAodGhpcy5nZXRCbG9jaygpICE9PSB0eC5nZXRCbG9jaygpKSB7XG4gICAgICBpZiAodGhpcy5nZXRCbG9jaygpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5zZXRCbG9jayh0eC5nZXRCbG9jaygpKTtcbiAgICAgICAgdGhpcy5nZXRCbG9jaygpLmdldFR4c1t0aGlzLmdldEJsb2NrKCkuZ2V0VHhzKCkuaW5kZXhPZih0eCldID0gdGhpczsgLy8gdXBkYXRlIGJsb2NrIHRvIHBvaW50IHRvIHRoaXMgdHhcbiAgICAgIH0gZWxzZSBpZiAodHguZ2V0QmxvY2soKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuZ2V0QmxvY2soKS5tZXJnZSh0eC5nZXRCbG9jaygpKTsgLy8gY29tZXMgYmFjayB0byBtZXJnaW5nIHR4c1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gb3RoZXJ3aXNlIG1lcmdlIHR4IGZpZWxkc1xuICAgIHRoaXMuc2V0SGFzaChHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRIYXNoKCksIHR4LmdldEhhc2goKSkpO1xuICAgIHRoaXMuc2V0VmVyc2lvbihHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRWZXJzaW9uKCksIHR4LmdldFZlcnNpb24oKSkpO1xuICAgIHRoaXMuc2V0UGF5bWVudElkKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldFBheW1lbnRJZCgpLCB0eC5nZXRQYXltZW50SWQoKSkpO1xuICAgIHRoaXMuc2V0RmVlKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldEZlZSgpLCB0eC5nZXRGZWUoKSkpO1xuICAgIHRoaXMuc2V0UmluZ1NpemUoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0UmluZ1NpemUoKSwgdHguZ2V0UmluZ1NpemUoKSkpO1xuICAgIHRoaXMuc2V0SXNDb25maXJtZWQoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0SXNDb25maXJtZWQoKSwgdHguZ2V0SXNDb25maXJtZWQoKSwge3Jlc29sdmVUcnVlOiB0cnVlfSkpOyAvLyB0eCBjYW4gYmVjb21lIGNvbmZpcm1lZFxuICAgIHRoaXMuc2V0SXNNaW5lclR4KEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldElzTWluZXJUeCgpLCB0eC5nZXRJc01pbmVyVHgoKSkpO1xuICAgIHRoaXMuc2V0UmVsYXkoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0UmVsYXkoKSwgdHguZ2V0UmVsYXkoKSwge3Jlc29sdmVUcnVlOiB0cnVlfSkpOyAgICAgICAvLyB0eCBjYW4gYmVjb21lIHJlbGF5ZWRcbiAgICB0aGlzLnNldElzUmVsYXllZChHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRJc1JlbGF5ZWQoKSwgdHguZ2V0SXNSZWxheWVkKCksIHtyZXNvbHZlVHJ1ZTogdHJ1ZX0pKTsgLy8gdHggY2FuIGJlY29tZSByZWxheWVkXG4gICAgdGhpcy5zZXRJc0RvdWJsZVNwZW5kU2VlbihHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRJc0RvdWJsZVNwZW5kU2VlbigpLCB0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbigpLCB7cmVzb2x2ZVRydWU6IHRydWV9KSk7IC8vIGRvdWJsZSBzcGVuZCBjYW4gYmVjb21lIHNlZW5cbiAgICB0aGlzLnNldEtleShHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRLZXkoKSwgdHguZ2V0S2V5KCkpKTtcbiAgICB0aGlzLnNldEZ1bGxIZXgoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0RnVsbEhleCgpLCB0eC5nZXRGdWxsSGV4KCkpKTtcbiAgICB0aGlzLnNldFBydW5lZEhleChHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRQcnVuZWRIZXgoKSwgdHguZ2V0UHJ1bmVkSGV4KCkpKTtcbiAgICB0aGlzLnNldFBydW5hYmxlSGV4KEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldFBydW5hYmxlSGV4KCksIHR4LmdldFBydW5hYmxlSGV4KCkpKTtcbiAgICB0aGlzLnNldFBydW5hYmxlSGFzaChHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRQcnVuYWJsZUhhc2goKSwgdHguZ2V0UHJ1bmFibGVIYXNoKCkpKTtcbiAgICB0aGlzLnNldFNpemUoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0U2l6ZSgpLCB0eC5nZXRTaXplKCkpKTtcbiAgICB0aGlzLnNldFdlaWdodChHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRXZWlnaHQoKSwgdHguZ2V0V2VpZ2h0KCkpKTtcbiAgICB0aGlzLnNldE91dHB1dEluZGljZXMoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0T3V0cHV0SW5kaWNlcygpLCB0eC5nZXRPdXRwdXRJbmRpY2VzKCkpKTtcbiAgICB0aGlzLnNldE1ldGFkYXRhKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldE1ldGFkYXRhKCksIHR4LmdldE1ldGFkYXRhKCkpKTtcbiAgICB0aGlzLnNldEV4dHJhKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldEV4dHJhKCksIHR4LmdldEV4dHJhKCkpKTtcbiAgICB0aGlzLnNldFJjdFNpZ25hdHVyZXMoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0UmN0U2lnbmF0dXJlcygpLCB0eC5nZXRSY3RTaWduYXR1cmVzKCkpKTtcbiAgICB0aGlzLnNldFJjdFNpZ1BydW5hYmxlKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldFJjdFNpZ1BydW5hYmxlKCksIHR4LmdldFJjdFNpZ1BydW5hYmxlKCkpKTtcbiAgICB0aGlzLnNldElzS2VwdEJ5QmxvY2soR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0SXNLZXB0QnlCbG9jaygpLCB0eC5nZXRJc0tlcHRCeUJsb2NrKCkpKTtcbiAgICB0aGlzLnNldElzRmFpbGVkKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldElzRmFpbGVkKCksIHR4LmdldElzRmFpbGVkKCksIHtyZXNvbHZlVHJ1ZTogdHJ1ZX0pKTtcbiAgICB0aGlzLnNldExhc3RGYWlsZWRIZWlnaHQoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0TGFzdEZhaWxlZEhlaWdodCgpLCB0eC5nZXRMYXN0RmFpbGVkSGVpZ2h0KCkpKTtcbiAgICB0aGlzLnNldExhc3RGYWlsZWRIYXNoKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldExhc3RGYWlsZWRIYXNoKCksIHR4LmdldExhc3RGYWlsZWRIYXNoKCkpKTtcbiAgICB0aGlzLnNldE1heFVzZWRCbG9ja0hlaWdodChHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRNYXhVc2VkQmxvY2tIZWlnaHQoKSwgdHguZ2V0TWF4VXNlZEJsb2NrSGVpZ2h0KCkpKTtcbiAgICB0aGlzLnNldE1heFVzZWRCbG9ja0hhc2goR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0TWF4VXNlZEJsb2NrSGFzaCgpLCB0eC5nZXRNYXhVc2VkQmxvY2tIYXNoKCkpKTtcbiAgICB0aGlzLnNldFNpZ25hdHVyZXMoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0U2lnbmF0dXJlcygpLCB0eC5nZXRTaWduYXR1cmVzKCkpKTtcbiAgICB0aGlzLnNldFVubG9ja1RpbWUoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0VW5sb2NrVGltZSgpLCB0eC5nZXRVbmxvY2tUaW1lKCkpKTtcbiAgICB0aGlzLnNldE51bUNvbmZpcm1hdGlvbnMoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0TnVtQ29uZmlybWF0aW9ucygpLCB0eC5nZXROdW1Db25maXJtYXRpb25zKCksIHtyZXNvbHZlTWF4OiB0cnVlfSkpOyAvLyBudW0gY29uZmlybWF0aW9ucyBjYW4gaW5jcmVhc2VcbiAgICBcbiAgICAvLyBtZXJnZSBpbnB1dHNcbiAgICBpZiAodHguZ2V0SW5wdXRzKCkpIHtcbiAgICAgIGZvciAobGV0IG1lcmdlciBvZiB0eC5nZXRJbnB1dHMoKSkge1xuICAgICAgICBsZXQgbWVyZ2VkID0gZmFsc2U7XG4gICAgICAgIG1lcmdlci5zZXRUeCh0aGlzKTtcbiAgICAgICAgaWYgKCF0aGlzLmdldElucHV0cygpKSB0aGlzLnNldElucHV0cyhbXSk7XG4gICAgICAgIGZvciAobGV0IG1lcmdlZSBvZiB0aGlzLmdldElucHV0cygpKSB7XG4gICAgICAgICAgaWYgKG1lcmdlZS5nZXRLZXlJbWFnZSgpLmdldEhleCgpID09PSBtZXJnZXIuZ2V0S2V5SW1hZ2UoKS5nZXRIZXgoKSkge1xuICAgICAgICAgICAgbWVyZ2VlLm1lcmdlKG1lcmdlcik7XG4gICAgICAgICAgICBtZXJnZWQgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghbWVyZ2VkKSB0aGlzLmdldElucHV0cygpLnB1c2gobWVyZ2VyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gbWVyZ2Ugb3V0cHV0c1xuICAgIGlmICh0eC5nZXRPdXRwdXRzKCkpIHtcbiAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5nZXRPdXRwdXRzKCkpIG91dHB1dC5zZXRUeCh0aGlzKTtcbiAgICAgIGlmICghdGhpcy5nZXRPdXRwdXRzKCkpIHRoaXMuc2V0T3V0cHV0cyh0eC5nZXRPdXRwdXRzKCkpO1xuICAgICAgZWxzZSB7XG4gICAgICAgIFxuICAgICAgICAvLyBtZXJnZSBvdXRwdXRzIGlmIGtleSBpbWFnZSBvciBzdGVhbHRoIHB1YmxpYyBrZXkgcHJlc2VudCwgb3RoZXJ3aXNlIGFwcGVuZFxuICAgICAgICBmb3IgKGxldCBtZXJnZXIgb2YgdHguZ2V0T3V0cHV0cygpKSB7XG4gICAgICAgICAgbGV0IG1lcmdlZCA9IGZhbHNlO1xuICAgICAgICAgIG1lcmdlci5zZXRUeCh0aGlzKTtcbiAgICAgICAgICBmb3IgKGxldCBtZXJnZWUgb2YgdGhpcy5nZXRPdXRwdXRzKCkpIHtcbiAgICAgICAgICAgIGlmICgobWVyZ2VyLmdldEtleUltYWdlKCkgJiYgbWVyZ2VlLmdldEtleUltYWdlKCkuZ2V0SGV4KCkgPT09IG1lcmdlci5nZXRLZXlJbWFnZSgpLmdldEhleCgpKSB8fFxuICAgICAgICAgICAgICAgIChtZXJnZXIuZ2V0U3RlYWx0aFB1YmxpY0tleSgpICYmIG1lcmdlZS5nZXRTdGVhbHRoUHVibGljS2V5KCkgPT09IG1lcmdlci5nZXRTdGVhbHRoUHVibGljS2V5KCkpKSB7XG4gICAgICAgICAgICAgbWVyZ2VlLm1lcmdlKG1lcmdlcik7XG4gICAgICAgICAgICAgbWVyZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFtZXJnZWQpIHRoaXMuZ2V0T3V0cHV0cygpLnB1c2gobWVyZ2VyKTsgLy8gYXBwZW5kIG91dHB1dFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGhhbmRsZSB1bnJlbGF5ZWQgLT4gcmVsYXllZCAtPiBjb25maXJtZWRcbiAgICBpZiAodGhpcy5nZXRJc0NvbmZpcm1lZCgpKSB7XG4gICAgICB0aGlzLnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHRoaXMuc2V0UmVjZWl2ZWRUaW1lc3RhbXAodW5kZWZpbmVkKTtcbiAgICAgIHRoaXMuc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAodW5kZWZpbmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zZXRJblR4UG9vbChHZW5VdGlscy5yZWNvbmNpbGUodGhpcy5nZXRJblR4UG9vbCgpLCB0eC5nZXRJblR4UG9vbCgpLCB7cmVzb2x2ZVRydWU6IHRydWV9KSk7IC8vIHVucmVsYXllZCAtPiB0eCBwb29sXG4gICAgICB0aGlzLnNldFJlY2VpdmVkVGltZXN0YW1wKEdlblV0aWxzLnJlY29uY2lsZSh0aGlzLmdldFJlY2VpdmVkVGltZXN0YW1wKCksIHR4LmdldFJlY2VpdmVkVGltZXN0YW1wKCksIHtyZXNvbHZlTWF4OiBmYWxzZX0pKTsgLy8gdGFrZSBlYXJsaWVzdCByZWNlaXZlIHRpbWVcbiAgICAgIHRoaXMuc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoR2VuVXRpbHMucmVjb25jaWxlKHRoaXMuZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSwgdHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAoKSwge3Jlc29sdmVNYXg6IHRydWV9KSk7ICAvLyB0YWtlIGxhdGVzdCByZWxheSB0aW1lXG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0aGlzOyAgLy8gZm9yIGNoYWluaW5nXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gW2luZGVudF0gLSBzdGFydGluZyBpbmRlbnRhdGlvblxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGlzIHR4XG4gICAqL1xuICB0b1N0cmluZyhpbmRlbnQgPSAwKTogc3RyaW5nIHtcbiAgICBsZXQgc3RyID0gXCJcIjtcbiAgICBzdHIgKz0gR2VuVXRpbHMuZ2V0SW5kZW50KGluZGVudCkgKyBcIj09PSBUWCA9PT1cXG5cIjtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiVHggaGFzaFwiLCB0aGlzLmdldEhhc2goKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiSGVpZ2h0XCIsIHRoaXMuZ2V0SGVpZ2h0KCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIlZlcnNpb25cIiwgdGhpcy5nZXRWZXJzaW9uKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIklzIG1pbmVyIHR4XCIsIHRoaXMuZ2V0SXNNaW5lclR4KCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIlBheW1lbnQgSURcIiwgdGhpcy5nZXRQYXltZW50SWQoKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiRmVlXCIsIHRoaXMuZ2V0RmVlKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIlJpbmcgc2l6ZVwiLCB0aGlzLmdldFJpbmdTaXplKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIlJlbGF5XCIsIHRoaXMuZ2V0UmVsYXkoKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiSXMgcmVsYXllZFwiLCB0aGlzLmdldElzUmVsYXllZCgpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJJcyBjb25maXJtZWRcIiwgdGhpcy5nZXRJc0NvbmZpcm1lZCgpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJJbiB0eCBwb29sXCIsIHRoaXMuZ2V0SW5UeFBvb2woKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiTnVtIGNvbmZpcm1hdGlvbnNcIiwgdGhpcy5nZXROdW1Db25maXJtYXRpb25zKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIlVubG9jayB0aW1lXCIsIHRoaXMuZ2V0VW5sb2NrVGltZSgpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJMYXN0IHJlbGF5ZWQgdGltZVwiLCB0aGlzLmdldExhc3RSZWxheWVkVGltZXN0YW1wKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIlJlY2VpdmVkIHRpbWVcIiwgdGhpcy5nZXRSZWNlaXZlZFRpbWVzdGFtcCgpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJJcyBkb3VibGUgc3BlbmRcIiwgdGhpcy5nZXRJc0RvdWJsZVNwZW5kU2VlbigpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJLZXlcIiwgdGhpcy5nZXRLZXkoKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiRnVsbCBoZXhcIiwgdGhpcy5nZXRGdWxsSGV4KCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIlBydW5lZCBoZXhcIiwgdGhpcy5nZXRQcnVuZWRIZXgoKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiUHJ1bmFibGUgaGV4XCIsIHRoaXMuZ2V0UHJ1bmFibGVIZXgoKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiUHJ1bmFibGUgaGFzaFwiLCB0aGlzLmdldFBydW5hYmxlSGFzaCgpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJTaXplXCIsIHRoaXMuZ2V0U2l6ZSgpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJXZWlnaHRcIiwgdGhpcy5nZXRXZWlnaHQoKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiT3V0cHV0IGluZGljZXNcIiwgdGhpcy5nZXRPdXRwdXRJbmRpY2VzKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIk1ldGFkYXRhXCIsIHRoaXMuZ2V0TWV0YWRhdGEoKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiRXh0cmFcIiwgdGhpcy5nZXRFeHRyYSgpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJSQ1Qgc2lnbmF0dXJlc1wiLCB0aGlzLmdldFJjdFNpZ25hdHVyZXMoKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiUkNUIHNpZyBwcnVuYWJsZVwiLCB0aGlzLmdldFJjdFNpZ1BydW5hYmxlKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIktlcHQgYnkgYmxvY2tcIiwgdGhpcy5nZXRJc0tlcHRCeUJsb2NrKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIklzIGZhaWxlZFwiLCB0aGlzLmdldElzRmFpbGVkKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIkxhc3QgZmFpbGVkIGhlaWdodFwiLCB0aGlzLmdldExhc3RGYWlsZWRIZWlnaHQoKSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiTGFzdCBmYWlsZWQgaGFzaFwiLCB0aGlzLmdldExhc3RGYWlsZWRIYXNoKCksIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIk1heCB1c2VkIGJsb2NrIGhlaWdodFwiLCB0aGlzLmdldE1heFVzZWRCbG9ja0hlaWdodCgpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJNYXggdXNlZCBibG9jayBoYXNoXCIsIHRoaXMuZ2V0TWF4VXNlZEJsb2NrSGFzaCgpLCBpbmRlbnQpO1xuICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJTaWduYXR1cmVzXCIsIHRoaXMuZ2V0U2lnbmF0dXJlcygpLCBpbmRlbnQpO1xuICAgIGlmICh0aGlzLmdldElucHV0cygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHN0ciArPSBHZW5VdGlscy5rdkxpbmUoXCJJbnB1dHNcIiwgXCJcIiwgaW5kZW50KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5nZXRJbnB1dHMoKS5sZW5ndGg7IGkrKykge1xuICAgICAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKGkgKyAxLCBcIlwiLCBpbmRlbnQgKyAxKTtcbiAgICAgICAgc3RyICs9IHRoaXMuZ2V0SW5wdXRzKClbaV0udG9TdHJpbmcoaW5kZW50ICsgMik7XG4gICAgICAgIHN0ciArPSAnXFxuJ1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5nZXRPdXRwdXRzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIk91dHB1dHNcIiwgXCJcIiwgaW5kZW50KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5nZXRPdXRwdXRzKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShpICsgMSwgXCJcIiwgaW5kZW50ICsgMSk7XG4gICAgICAgIHN0ciArPSB0aGlzLmdldE91dHB1dHMoKVtpXS50b1N0cmluZyhpbmRlbnQgKyAyKTtcbiAgICAgICAgc3RyICs9ICdcXG4nXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHIuc2xpY2UoMCwgc3RyLmxlbmd0aCAtIDEpOyAgLy8gc3RyaXAgbGFzdCBuZXdsaW5lXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBRSxhQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ2UsTUFBTUcsUUFBUSxDQUFDOztFQUU1QixPQUFnQkMsa0JBQWtCLEdBQUcsa0JBQWtCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBd0N2REMsV0FBV0EsQ0FBQ0MsRUFBc0IsRUFBRTtJQUNsQ0MsTUFBTSxDQUFDQyxNQUFNLENBQUMsSUFBSSxFQUFFRixFQUFFLENBQUM7SUFDdkIsSUFBSSxDQUFDRyxLQUFLLEdBQUdDLFNBQVM7O0lBRXRCO0lBQ0EsSUFBSSxJQUFJLENBQUNDLEtBQUssS0FBS0QsU0FBUyxFQUFFLElBQUksQ0FBQ0MsS0FBSyxHQUFHLElBQUlDLFVBQVUsQ0FBQyxJQUFJLENBQUNELEtBQUssQ0FBQzs7SUFFckU7SUFDQSxJQUFJLElBQUksQ0FBQ0UsR0FBRyxLQUFLSCxTQUFTLElBQUksT0FBTyxJQUFJLENBQUNHLEdBQUcsS0FBSyxRQUFRLEVBQUUsSUFBSSxDQUFDQSxHQUFHLEdBQUdDLE1BQU0sQ0FBQyxJQUFJLENBQUNELEdBQUcsQ0FBQztJQUN2RixJQUFJLElBQUksQ0FBQ0UsVUFBVSxLQUFLTCxTQUFTLElBQUksT0FBTyxJQUFJLENBQUNLLFVBQVUsS0FBSyxRQUFRLEVBQUUsSUFBSSxDQUFDQSxVQUFVLEdBQUdELE1BQU0sQ0FBQyxJQUFJLENBQUNDLFVBQVUsQ0FBQzs7SUFFbkg7SUFDQSxJQUFJLElBQUksQ0FBQ0MsTUFBTSxFQUFFO01BQ2YsSUFBSSxDQUFDQSxNQUFNLEdBQUcsSUFBSSxDQUFDQSxNQUFNLENB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