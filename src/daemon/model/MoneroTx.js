const assert = require("assert");
const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroOutput = require("./MoneroOutput");

/**
 * Represents a transaction on the Monero network.
 */
class MoneroTx {
  
  /**
   * Constructs the model.
   * 
   * TODO: treat vins just like vouts for merging, copying, deserialization
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    state = Object.assign({}, state);
    this.state = state;
    
    // deserialize fee
    if (state.fee && !(state.fee instanceof BigInteger)) state.fee = BigInteger.parse(state.fee);
    
    // deserialize vouts
    if (state.vouts) {
      for (let i = 0; i < state.vouts.length; i++) {
        if (!(state.vouts[i] instanceof MoneroOutput)) {
          state.vouts[i] = new MoneroOutput(state.vouts[i]);
        }
      }
    }
  }
  
  getId() {
    return this.state.id;
  }
  
  setId(id) {
    this.state.id = id;
    return this;
  }
  
  getVersion() {
    return this.state.version;
  }
  
  setVersion(version) {
    this.state.version = version;
    return this;
  }
  
  getIsCoinbase() {
    return this.state.isCoinbase;
  }
  
  setIsCoinbase(coinbase) {
    this.state.isCoinbase = coinbase;
    return this;
  }
  
  getPaymentId() {
    return this.state.paymentId;
  }
  
  setPaymentId(paymentId) {
    this.state.paymentId = paymentId;
    return this;
  }
  
  getFee() {
    return this.state.fee;
  }
  
  setFee(fee) {
    this.state.fee = fee;
    return this;
  }
  
  getMixin() {
    return this.state.mixin;
  }
  
  setMixin(mixin) {
    this.state.mixin = mixin;
    return this;
  }
  
  getDoNotRelay() {
    return this.state.doNotRelay;
  }
  
  setDoNotRelay(doNotRelay) {
    this.state.doNotRelay = doNotRelay;
    return this;
  }
  
  getIsRelayed() {
    return this.state.isRelayed;
  }
  
  setIsRelayed(isRelayed) {
    this.state.isRelayed = isRelayed;
    return this;
  }
  
  getIsConfirmed() {
    return this.state.isConfirmed;
  }
  
  setIsConfirmed(isConfirmed) {
    this.state.isConfirmed = isConfirmed;
    return this;
  }
  
  getInTxPool() {
    return this.state.inTxPool;
  }
  
  setInTxPool(inTxPool) {
    this.state.inTxPool = inTxPool;
    return this;
  }
  
  getHeight() {
    return this.state.height;
  }
  
  setHeight(height) {
    this.state.height = height;
    return this;
  }
  
  getConfirmationCount() {
    return this.state.confirmationCount;
  }
  
  setConfirmationCount(confirmationCount) {
    this.state.confirmationCount = confirmationCount;
    return this;
  }
  
  getBlockTimestamp() {
    return this.state.blockTimestamp;
  }
  
  setBlockTimestamp(blockTimestamp) {
    this.state.blockTimestamp = blockTimestamp;
    return this;    
  }
  
  getEstimatedBlockCountUntilConfirmed() {
    return this.state.estimatedBlockCountUntilConfirmed;
  }
  
  setEstimatedBlockCountUntilConfirmed(estimatedBlockCountUntilConfirmed) {
    this.state.estimatedBlockCountUntilConfirmed = estimatedBlockCountUntilConfirmed;
    return this;
  }
  
  getUnlockTime() {
    return this.state.unlockTime;
  }
  
  setUnlockTime(unlockTime) {
    this.state.unlockTime = unlockTime;
    return this;
  }
  
  getLastRelayedTime() {
    return this.state.lastRelayedTime;
  }
  
  setLastRelayedTime(lastRelayedTime) {
    this.state.lastRelayedTime = lastRelayedTime;
    return this;
  }
  
  getReceivedTime() {
    return this.state.receivedTime;
  }
  
  setReceivedTime(receivedTime) {
    this.state.receivedTime = receivedTime;
    return this;
  }
  
  getIsDoubleSpend() {
    return this.state.isDoubleSpend;
  }
  
  setIsDoubleSpend(isDoubleSpend) {
    this.state.isDoubleSpend = isDoubleSpend;
    return this;
  }
  
  getKey() {
    return this.state.key;
  }
  
  setKey(key) {
    this.state.key = key;
    return this;
  }
  
  getHex() {
    return this.state.hex;
  }
  
  setHex(hex) {
    this.state.hex = hex;
    return this;
  }
  
  getSize() {
    return this.state.size;
  }
  
  setSize(size) {
    this.state.size = size;
    return this;
  }
  
  getWeight() {
    return this.state.weight;
  }
  
  setWeight(weight) {
    this.state.weight = weight;
    return this;
  }
  
  getVins() {
    return this.state.vins;
  }
  
  setVins(vins) {
    this.state.vins = vins;
    return this;
  }
  
  getVouts() {
    return this.state.vouts;
  }
  
  setVouts(vouts) {
    this.state.vouts = vouts;
    return this;
  }
  
  getOutputIndices() {
    return this.state.outputIndices;
  }
  
  setOutputIndices(outputIndices) {
    this.state.outputIndices = outputIndices;
    return this;
  }
  
  getMetadata() {
    return this.state.metadata;
  }
  
  setMetadata(metadata) {
    this.state.metadata = metadata;
    return this;
  }
  
  getCommonTxSets() {
    return this.state.commonTxSets;
  }
  
  setCommonTxSets(commonTxSets) {
    this.state.commonTxSets = commonTxSets;
    return this;
  }
  
  getExtra() {
    return this.state.extra;
  }
  
  setExtra(extra) {
    this.state.extra = extra;
    return this;
  }

  getRctSignatures() {
    return this.state.rctSignatures;
  }
  
  setRctSignatures(rctSignatures) {
    this.state.rctSignatures = rctSignatures;
    return this;
  }
  
  getRctSigPrunable() {
    return this.state.rctSigPrunable;
  }
  
  setRctSigPrunable(rctSigPrunable) {
    this.state.rctSigPrunable = rctSigPrunable;
    return this;
  }
  
  getKeptByBlock() {
    return  this.state.keptByBlock;
  }
  
  setKeptByBlock(keptByBlock) {
    this.state.keptByBlock = keptByBlock;
    return this;
  }
  
  getIsFailed() {
    return this.state.isFailed;
  }
  
  setIsFailed(isFailed) {
    this.state.isFailed = isFailed;
    return this;
  }
  
  getLastFailedHeight() {
    return this.state.lastFailedHeight;
  }
  
  setLastFailedHeight(lastFailedHeight) {
    this.state.lastFailedHeight = lastFailedHeight;
    return this;
  }
  
  getLastFailedId() {
    return this.state.lastFailedId;
  }
  
  setLastFailedId(lastFailedId) {
    this.state.lastFailedId = lastFailedId;
    return this;
  }
  
  getMaxUsedBlockHeight() {
    return this.state.maxUsedBlockHeight;
  }
  
  setMaxUsedBlockHeight(maxUsedBlockHeight) {
    this.state.maxUsedBlockHeight = maxUsedBlockHeight;
    return this;
  }
  
  getMaxUsedBlockId() {
    return this.state.maxUsedBlockId;
  }
  
  setMaxUsedBlockId(maxUsedBlockId) {
    this.state.maxUsedBlockId = maxUsedBlockId;
    return this;
  }
  
  getSignatures() {
    return this.state.signatures;
  }
  
  setSignatures(signatures) {
    this.state.signatures = signatures;
    return this;
  }
  
  getPrunableHash() {
    return this.state.prunableHash;
  }
  
  setPrunableHash(prunableHash) {
    this.state.prunableHash = prunableHash;
    return this;
  }
  
  getPrunableHex() {
    return this.state.prunableHex;
  }
  
  setPrunableHex(prunableHex) {
    this.state.prunableHex = prunableHex;
    return this;
  }
  
  getPrunedHex() {
    return this.state.prunedHex;
  }
  
  setPrunedHex(prunedHex) {
    this.state.prunedHex = prunedHex;
    return this;
  }
  
  copy() {
    return new MoneroTx(this.toJson());
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getFee()) json.fee = this.getFee().toString();
    if (this.getVouts()) {
      json.vouts = [];
      for (let vout of this.getVouts()) json.vouts.push(vout.toJson());
    }
    return json;
  }
  
  toString(indent = 0) {
    let str = "";
    str += MoneroUtils.kvLine("==== Tx ID: ", this.getId(), indent);
    str += MoneroUtils.kvLine("Version", this.getVersion(), indent);
    str += MoneroUtils.kvLine("Is coinbase", this.getIsCoinbase(), indent);
    str += MoneroUtils.kvLine("Payment ID", this.getPaymentId(), indent);
    str += MoneroUtils.kvLine("Fee", this.getFee(), indent);
    str += MoneroUtils.kvLine("Mixin", this.getMixin(), indent);
    str += MoneroUtils.kvLine("Do not relay", this.getDoNotRelay(), indent);
    str += MoneroUtils.kvLine("Is relayed", this.getIsRelayed(), indent);
    str += MoneroUtils.kvLine("Is confirmed", this.getIsConfirmed(), indent);
    str += MoneroUtils.kvLine("In tx pool", this.getInTxPool(), indent);
    str += MoneroUtils.kvLine("Height", this.getHeight(), indent);
    str += MoneroUtils.kvLine("Confirmation count", this.getConfirmationCount(), indent);
    str += MoneroUtils.kvLine("Block timestamp", this.getBlockTimestamp(), indent);
    str += MoneroUtils.kvLine("Estimated block count until confirmed", this.getEstimatedBlockCountUntilConfirmed(), indent);
    str += MoneroUtils.kvLine("Unlock time", this.getUnlockTime(), indent);
    str += MoneroUtils.kvLine("Last relayed time", this.getLastRelayedTime(), indent);
    str += MoneroUtils.kvLine("Received time", this.getReceivedTime(), indent);
    str += MoneroUtils.kvLine("Is double spend", this.getIsDoubleSpend(), indent);
    str += MoneroUtils.kvLine("Key", this.getKey(), indent);
    str += MoneroUtils.kvLine("Hex", this.getHex(), indent);
    str += MoneroUtils.kvLine("Size", this.getSize(), indent);
    str += MoneroUtils.kvLine("Weight", this.getWeight(), indent);
    str += MoneroUtils.kvLine("Metadata", this.getMetadata(), indent);
    str += MoneroUtils.kvLine("Common tx sets", this.getCommonTxSets(), indent);
    str += MoneroUtils.kvLine("Extra", this.getExtra(), indent);
    str += MoneroUtils.kvLine("RCT signatures", this.getRctSignatures(), indent);
    str += MoneroUtils.kvLine("RCT sig prunable", this.getRctSigPrunable(), indent);
    str += MoneroUtils.kvLine("Kept by block", this.getKeptByBlock(), indent);
    str += MoneroUtils.kvLine("Is failed", this.getIsFailed(), indent);
    str += MoneroUtils.kvLine("Last failed height", this.getLastFailedHeight(), indent);
    str += MoneroUtils.kvLine("Last failed id", this.getLastFailedId(), indent);
    str += MoneroUtils.kvLine("Max used block height", this.getMaxUsedBlockHeight(), indent);
    str += MoneroUtils.kvLine("Max used block id", this.getMaxUsedBlockId(), indent);
    str += MoneroUtils.kvLine("Signatures", this.getSignatures(), indent);
    str += MoneroUtils.kvLine("Prunable hash", this.getPrunableHash(), indent);
    str += MoneroUtils.kvLine("Prunable hex", this.getPrunableHex(), indent);
    str += MoneroUtils.kvLine("Pruned hex", this.getPrunedHex(), indent);
    if (this.getVins()) {
      str += MoneroUtils.kvLine("Vins", "", indent);
      for (let i = 0; i < this.getVins().length; i++) {
        str += MoneroUtils.kvLine(i + 1, "", indent + 1);
        str += this.getVins()[i].toString(indent + 2);
        str += '\n'
      }
    }
    if (this.getVouts()) {
      str += MoneroUtils.kvLine("Vouts", "", indent);
      for (let i = 0; i < this.getVouts().length; i++) {
        str += MoneroUtils.kvLine(i + 1, "", indent + 1);
        str += this.getVouts()[i].toString(indent + 2);
        str += '\n'
      }
    }
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
    assert(tx instanceof MoneroTx);
    if (this === tx) return;
    this.setId(MoneroUtils.reconcile(this.getId(), tx.getId()));
    this.setVersion(MoneroUtils.reconcile(this.getVersion(), tx.getVersion()));
    this.setPaymentId(MoneroUtils.reconcile(this.getPaymentId(), tx.getPaymentId()));
    this.setFee(MoneroUtils.reconcile(this.getFee(), tx.getFee()));
    this.setMixin(MoneroUtils.reconcile(this.getMixin(), tx.getMixin()));
    this.setIsConfirmed(MoneroUtils.reconcile(this.getIsConfirmed(), tx.getIsConfirmed(), {resolveTrue: true}));
    this.setDoNotRelay(MoneroUtils.reconcile(this.getDoNotRelay(), tx.getDoNotRelay(), {resolveTrue: false}));  // tx can become relayed
    this.setIsRelayed(MoneroUtils.reconcile(this.getIsRelayed(), tx.getIsRelayed(), {resolveTrue: true}));      // tx can become relayed
    this.setIsDoubleSpend(MoneroUtils.reconcile(this.getIsDoubleSpend(), tx.getIsDoubleSpend()));
    this.setKey(MoneroUtils.reconcile(this.getKey(), tx.getKey()));
    this.setHex(MoneroUtils.reconcile(this.getHex(), tx.getHex()));
    this.setSize(MoneroUtils.reconcile(this.getSize(), tx.getSize()));
    this.setWeight(MoneroUtils.reconcile(this.getWeight(), tx.getWeight()));
    this.setMetadata(MoneroUtils.reconcile(this.getMetadata(), tx.getMetadata()));
    this.setOutputIndices(MoneroUtils.reconcile(this.getOutputIndices(), tx.getOutputIndices()));
    this.setCommonTxSets(MoneroUtils.reconcile(this.getCommonTxSets(), tx.getCommonTxSets()));
    this.setExtra(MoneroUtils.reconcile(this.getExtra(), tx.getExtra()));
    this.setRctSignatures(MoneroUtils.reconcile(this.getRctSignatures(), tx.getRctSignatures()));
    this.setRctSigPrunable(MoneroUtils.reconcile(this.getRctSigPrunable(), tx.getRctSigPrunable()));
    this.setKeptByBlock(MoneroUtils.reconcile(this.getKeptByBlock(), tx.getKeptByBlock()));
    this.setIsFailed(MoneroUtils.reconcile(this.getIsFailed(), tx.getIsFailed()));
    this.setLastFailedHeight(MoneroUtils.reconcile(this.getLastFailedHeight(), tx.getLastFailedHeight()));
    this.setLastFailedId(MoneroUtils.reconcile(this.getLastFailedId(), tx.getLastFailedId()));
    this.setMaxUsedBlockHeight(MoneroUtils.reconcile(this.getMaxUsedBlockHeight(), tx.getMaxUsedBlockHeight()));
    this.setMaxUsedBlockId(MoneroUtils.reconcile(this.getMaxUsedBlockId(), tx.getMaxUsedBlockId()));
    this.setSignatures(MoneroUtils.reconcile(this.getSignatures(), tx.getSignatures()));
    this.setUnlockTime(MoneroUtils.reconcile(this.getUnlockTime(), tx.getUnlockTime()));
    this.setHeight(MoneroUtils.reconcile(this.getHeight(), tx.getHeight(), {resolveMax: true}));  // height can increase
    this.setBlockTimestamp(MoneroUtils.reconcile(this.getBlockTimestamp(), tx.getBlockTimestamp(), {resolveMax: true}));  // block timestamp can increase
    this.setConfirmationCount(MoneroUtils.reconcile(this.getConfirmationCount(), tx.getConfirmationCount(), {resolveMax: true})); // confirmation count can increase
    this.setPrunableHash(MoneroUtils.reconcile(this.getPrunableHash(), tx.getPrunableHash()));
    this.setPrunableHex(MoneroUtils.reconcile(this.getPrunableHex(), tx.getPrunableHex()));
    this.setPrunedHex(MoneroUtils.reconcile(this.getPrunedHex(), tx.getPrunedHex()));
    
    // merge vins
    if (tx.getVins()) {
      for (let merger of tx.getVins()) {
        let merged = false;
        merger.setTx(this);
        if (!this.getVins()) this.setVins([]);
        for (let mergee of this.getVins()) {
          if (mergee.getKeyImage().getHex() === merger.getKeyImage().getHex()) {
            mergee.merge(merger);
            merged = true;
            break;
          }
        }
        if (!merged) this.getVins().push(merger);
      }
    }
    
    // merge vouts
    if (tx.getVouts()) {
      for (let merger of tx.getVouts()) {
        let merged = false;
        merger.setTx(this);
        if (!this.getVouts()) this.setVouts([]);
        for (let mergee of this.getVouts()) {
          if (mergee.getKeyImage().getHex() === merger.getKeyImage().getHex()) {
            mergee.merge(merger);
            merged = true;
            break;
          }
        }
        if (!merged) this.getVouts().push(merger);
      }
    }
    
    // handle unrelayed -> relayed -> confirmed
    if (this.getIsConfirmed()) {
      this.setInTxPool(false);
      this.setReceivedTime(undefined);
      this.setLastRelayedTime(undefined);
      this.setEstimatedBlockCountUntilConfirmed(undefined);
    } else {
      this.setInTxPool(MoneroUtils.reconcile(this.getInTxPool(), tx.getInTxPool(), {resolveTrue: true})); // unrelayed -> tx pool
      this.setReceivedTime(MoneroUtils.reconcile(this.getReceivedTime(), tx.getReceivedTime(), {resolveMax: false})); // take earliest receive time
      this.setLastRelayedTime(MoneroUtils.reconcile(this.getLastRelayedTime(), tx.getLastRelayedTime(), {resolveMax: true}));  // take latest relay time
      this.setEstimatedBlockCountUntilConfirmed(MoneroUtils.reconcile(this.getEstimatedBlockCountUntilConfirmed(), tx.getEstimatedBlockCountUntilConfirmed(), {resolveMax: false})); // take min
    }
    
    return this;  // for chaining
  }
}

// default payment id
MoneroTx.DEFAULT_PAYMENT_ID = "0000000000000000";

module.exports = MoneroTx;