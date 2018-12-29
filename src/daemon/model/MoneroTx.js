const assert = require("assert");
const MoneroDaemonModel = require("./MoneroDaemonModel");
const MoneroUtils = require("../../utils/MoneroUtils");

/**
 * Represents a transaction on the Monero network.

 * TODO: ensure all fields are tested
 */
class MoneroTx extends MoneroDaemonModel {
  
  /**
   * Constructs the model.
   */
  constructor(json) {
    super();
    this.json = Object.assign({}, json);  // TODO: should use given json if given, copy function should handle duplication
  }
  
  getId() {
    return this.json.id;
  }
  
  setId(id) {
    this.json.id = id;
  }
  
  getVersion() {
    return this.json.version;
  }
  
  setVersion(version) {
    this.json.version = version;
  }
  
  getIsCoinbase() {
    return this.json.coinbase;
  }
  
  setIsCoinbase(coinbase) {
    this.json.coinbase = coinbase;
  }
  
  getPaymentId() {
    return this.json.paymentId;
  }
  
  setPaymentId(paymentId) {
    this.json.paymentId = paymentId;
  }
  
  getFee() {
    return this.json.fee;
  }
  
  setFee(fee) {
    this.json.fee = fee;
  }
  
  getMixin() {
    return this.json.mixin;
  }
  
  setMixin(mixin) {
    this.json.mixin = mixin;
  }
  
  getDoNotRelay() {
    return this.json.doNotRelay;
  }
  
  setDoNotRelay(doNotRelay) {
    this.json.doNotRelay = doNotRelay;
  }
  
  getIsRelayed() {
    return this.json.isRelayed;
  }
  
  setIsRelayed(isRelayed) {
    this.json.isRelayed = isRelayed;
  }
  
  getIsConfirmed() {
    return this.json.isConfirmed;
  }
  
  setIsConfirmed(isConfirmed) {
    this.json.isConfirmed = isConfirmed;
  }
  
  getInTxPool() {
    return this.json.inTxPool;
  }
  
  setInTxPool(inTxPool) {
    this.json.inTxPool = inTxPool;
  }
  
  getHeight() {
    return this.json.height;
  }
  
  setHeight(height) {
    this.json.height = height;
  }
  
  getConfirmationCount() {
    return this.json.numConfirmations;
  }
  
  setConfirmationCount(numConfirmations) {
    this.json.numConfirmations = numConfirmations;
  }
  
  getBlockTimestamp() {
    return this.json.blockTimestamp;
  }
  
  setBlockTimestamp(blockTimestamp) {
    this.json.blockTimestamp = blockTimestamp;
  }
  
  getEstimatedBlockCountUntilConfirmed() {
    return this.json.estimatedBlockCountUntilConfirmed;
  }
  
  setEstimatedBlockCountUntilConfirmed(estimatedBlockCountUntilConfirmed) {
    this.json.estimatedBlockCountUntilConfirmed = estimatedBlockCountUntilConfirmed;
  }
  
  getUnlockTime() {
    return this.json.unlockTime;
  }
  
  setUnlockTime(unlockTime) {
    this.json.unlockTime = unlockTime;
  }
  
  getLastRelayedTime() {
    return this.json.lastRelayedTime;
  }
  
  setLastRelayedTime(lastRelayedTime) {
    this.json.lastRelayedTime = lastRelayedTime;
  }
  
  getReceivedTime() {
    return this.json.receivedTime;
  }
  
  setReceivedTime(receivedTime) {
    this.json.receivedTime = receivedTime;
  }
  
  getIsDoubleSpend() {
    return this.json.isDoubleSpend;
  }
  
  setIsDoubleSpend(isDoubleSpend) {
    this.json.isDoubleSpend = isDoubleSpend;
  }
  
  getKey() {
    return this.json.key;
  }
  
  setKey(key) {
    this.json.key = key;
  }
  
  getHex() {
    return this.json.hex;
  }
  
  setHex(hex) {
    this.json.hex = hex;
  }
  
  getSize() {
    return this.json.size;
  }
  
  setSize(size) {
    this.json.size = size;
  }
  
  getWeight() {
    return this.json.weight;
  }
  
  setWeight(weight) {
    this.json.weight = weight;
  }
  
  getMetadata() {
    return this.json.metadata;
  }
  
  setMetadata(metadata) {
    this.json.metadata = metadata;
  }
  
  getOutputIndices() {
    return this.json.outputIndices;
  }
  
  setOutputIndices(outputIndices) {
    this.json.outputIndices = outputIndices;
  }
  
  getCommonTxSets() {
    return this.json.commonTxSets;
  }
  
  setCommonTxSets(commonTxSets) {
    this.json.commonTxSets = commonTxSets;
  }
  
  getExtra() {
    return this.json.extra;
  }
  
  setExtra(extra) {
    this.json.extra = extra;
  }
  
  getVin() {
    return this.json.vin;
  }
  
  setVin(vin) {
    this.json.vin = vin;
  }
  
  getVout() {
    return this.json.vout;
  }
  
  setVout(vout) {
    this.json.vout = vout;
  }
  
  getRctSignatures() {
    return this.json.rctSignatures;
  }
  
  setRctSignatures(rctSignatures) {
    this.json.rctSignatures = rctSignatures;
  }
  
  getRctSigPrunable() {
    return this.json.rctSigPrunable;
  }
  
  setRctSigPrunable(rctSigPrunable) {
    this.json.rctSigPrunable = rctSigPrunable;
  }
  
  getKeptByBlock() {
    return  this.json.keptByBlock;
  }
  
  setKeptByBlock(keptByBlock) {
    this.json.keptByBlock = keptByBlock;
  }
  
  getIsFailed() {
    return this.json.isFailed;
  }
  
  setIsFailed(isFailed) {
    this.json.isFailed = isFailed;
  }
  
  getLastFailedHeight() {
    return this.json.lastFailedHeight;
  }
  
  setLastFailedHeight(lastFailedHeight) {
    this.json.lastFailedHeight = lastFailedHeight;
  }
  
  getLastFailedId() {
    return this.json.lastFailedId;
  }
  
  setLastFailedId(lastFailedId) {
    this.json.lastFailedId = lastFailedId;
  }
  
  getMaxUsedBlockHeight() {
    return this.json.maxUsedBlockHeight;
  }
  
  setMaxUsedBlockHeight(maxUsedBlockHeight) {
    this.json.maxUsedBlockHeight = maxUsedBlockHeight;
  }
  
  getMaxUsedBlockId() {
    return this.json.maxUsedBlockId;
  }
  
  setMaxUsedBlockId(maxUsedBlockId) {
    this.json.maxUsedBlockId = maxUsedBlockId;
  }
  
  getSignatures() {
    return this.json.signatures;
  }
  
  setSignatures(signatures) {
    this.json.signatures = signatures;
  }
  
  copy() {
    return new MoneroTx(this.json);
  }
  
  toJson() {
    return this.json; // TODO: need to correctly serialize types
    //throw new Error("Not implemented");
  }
  
  /**
   * Merges the given transaction into this transaction.
   * 
   * @param tx is the transaction to merge into this one
   */
  merge(tx) {
    
    // no special handling needed
    // TODO: GenUtils.safeSet instead
    MoneroUtils.safeSet(this, this.getId, this.setId, tx.getId());
    MoneroUtils.safeSet(this, this.getVersion, this.setVersion, tx.getVersion());
    MoneroUtils.safeSet(this, this.getPaymentId, this.setPaymentId, tx.getPaymentId());
    MoneroUtils.safeSet(this, this.getFee, this.setFee, tx.getFee());
    MoneroUtils.safeSet(this, this.getMixin, this.setMixin, tx.getMixin());
    MoneroUtils.safeSet(this, this.getDoNotRelay, this.setDoNotRelay, tx.getDoNotRelay());
    MoneroUtils.safeSet(this, this.getIsRelayed, this.getIsConfirmed, tx.getIsRelayed());
    MoneroUtils.safeSet(this, this.getIsConfirmed, this.setIsConfirmed, tx.getIsConfirmed()); // TODO: changes when confirmed
    MoneroUtils.safeSet(this, this.getInTxPool, this.setInTxPool, tx.getInTxPool());       // TODO: changes when confirmed
    MoneroUtils.safeSet(this, this.getHeight, this.setHeight, tx.getHeight()); // TODO: changes when confirmed
    MoneroUtils.safeSet(this, this.getBlockTimestamp, this.setBlockTimestamp, tx.getBlockTimestamp());  // TODO: changes when confirmed
    MoneroUtils.safeSet(this, this.getUnlockTime, this.setUnlockTime, tx.getUnlockTime());  // TODO: shrinks as chain grows
    MoneroUtils.safeSet(this, this.getLastRelayedTime, this.setLastRelayedTime, tx.getLastRelayedTime()); // TODO: becomes undefined when confirmed?
    MoneroUtils.safeSet(this, this.getIsDoubleSpend, this.setIsDoubleSpend, tx.getIsDoubleSpend());
    MoneroUtils.safeSet(this, this.getKey, this.setKey, tx.getKey());
    MoneroUtils.safeSet(this, this.getHex, this.setHex, tx.getHex());
    MoneroUtils.safeSet(this, this.getSize, this.setSize, tx.getSize());
    MoneroUtils.safeSet(this, this.getWeight, this.setWeight, tx.getWeight());
    MoneroUtils.safeSet(this, this.getMetadata, this.setMetadata, tx.getMetadata());
    MoneroUtils.safeSet(this, this.getOutputIndices, this.setOutputIndices, tx.getOutputIndices());
    MoneroUtils.safeSet(this, this.getCommonTxSets, this.setCommonTxsSets, tx.getCommonTxSets());
    MoneroUtils.safeSet(this, this.getExtra, this.setExtra, tx.getExtra());
    MoneroUtils.safeSet(this, this.getVin, this.setVin, tx.getVin());
    MoneroUtils.safeSet(this, this.getVout, this.setVout, tx.getVout());
    MoneroUtils.safeSet(this, this.getRctSignatures, this.setRctSignatures, tx.getRctSignatures());
    MoneroUtils.safeSet(this, this.getRctSigPrunable, this.setRctSigPrunable, tx.getRctSigPrunable());
    MoneroUtils.safeSet(this, this.getKeptByBlock, this.setKeptByBlock, tx.getKeptByBlock());
    MoneroUtils.safeSet(this, this.getIsFailed, this.setIsFailed, tx.getIsFailed());
    MoneroUtils.safeSet(this, this.getLastFailedHeight, this.setLastFailedHeight, tx.getLastFailedHeight());
    MoneroUtils.safeSet(this, this.getLastFailedId, this.setLastFailedId, tx.getLastFailedId());
    MoneroUtils.safeSet(this, this.getMaxUsedBlockHeight, this.setMaxUsedBlockHeight, tx.getMaxUsedBlockHeight());
    MoneroUtils.safeSet(this, this.getMaxUsedBlockId, this.setMaxUsedBlockId, tx.getMaxUsedBlockId());
    MoneroUtils.safeSet(this, this.getSignatures, this.setSignatures, tx.getSignatures());    
    
    // needs interpretation
//    if (this.json.timestamp === undefined) this.json.timestamp = tx.getTimestamp();
//    else if (tx.getTimestamp() !== undefined) {
//      if (!this.getIsConfirmed()) {
//        this.json.timestamp = Math.min(this.json.timestamp, tx.getTimestamp()); // txpool timestamps can vary so use first timestamp
//      } else {
//        assert.equal(this.json.timestamp, tx.getTimestamp(), "Transaction " + tx.getId() + " timestamps should be equal but are not: " + this.json.timestamp + " vs " + tx.getTimestamp());
//      }
//    }
    
    if (this.json.receivedTime) this.json.receivedTime = tx.getReceivedTime();
    else if (tx.getReceivedTime() !== undefined) {
      if (!this.getIsConfirmed()) this.json.receivedTime = Math.min(this.json.receivedTime, tx.getReceivedTime()); // txpool timestamps can vary so use first timestamp
      else assert.equal(this.json.receivedTime, tx.getReceivedTime(), "Transaction " + tx.getId() + " received timestamps should be equal but are not: " + this.json.receivedTime + " vs " + tx.getReceivedTime());
    }
    if (this.json.numConfirmations === undefined) this.json.numConfirmations = tx.getConfirmationCount();
    else if (tx.getConfirmationCount() !== undefined) {
      this.json.numConfirmations = Math.max(this.json.numConfirmations, tx.getConfirmationCount());  // num confirmations can change, take the latest (max)
    }
    if (this.json.estimatedBlockCountUntilConfirmed !== undefined) {
      if (tx.getEstimatedBlockCountUntilConfirmed() === undefined) delete this.json.estimatedBlockCountUntilConfirmed;  // uninitialize when confirmed
      else {
        assert(Math.abs(this.json.estimatedBlockCountUntilConfirmed - tx.getEstimatedBlockCountUntilConfirmed()) <= 1); // num estimated blocks can change, take the latest (min)
        this.json.estimatedBlockCountUntilConfirmed = Math.min(this.json.estimatedBlockCountUntilConfirmed, tx.getEstimatedBlockCountUntilConfirmed());
      }
    }
  }
}

// default payment id
MoneroTx.DEFAULT_PAYMENT_ID = "0000000000000000";

module.exports = MoneroTx;