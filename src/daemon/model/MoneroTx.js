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
    this.json = json ? json : {};
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
    return this.json.isCoinbase;
  }
  
  setIsCoinbase(coinbase) {
    this.json.isCoinbase = coinbase;
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
    return this.json.confirmationCount;
  }
  
  setConfirmationCount(confirmationCount) {
    this.json.confirmationCount = confirmationCount;
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
    return new MoneroTx(Object.assign({}, this.json));  // create tx with copied json
  }
  
  toJson() {
    return this.json; // TODO: need to correctly serialize types
    //throw new Error("Not implemented");
  }
  
  /**
   * Merges the given transaction into this transaction.
   * 
   * The transaction being merged is assumed to be the most up-to-date.
   * 
   * @param tx is the transaction to merge into this one
   */
  merge(tx) {
    
    this.setId(MoneroUtils.reconcile(this.getId(), tx.getId()));
    this.setVersion(MoneroUtils.reconcile(this.getVersion(), tx.getVersion()));
    this.setPaymentId(MoneroUtils.reconcile(this.getPaymentId(), tx.getPaymentId()));
    this.setFee(MoneroUtils.reconcile(this.getFee(), tx.getFee()));
    this.setMixin(MoneroUtils.reconcile(this.getMixin(), tx.getMixin()));
    this.setDoNotRelay(MoneroUtils.reconcile(this.getDoNotRelay(), tx.getDoNotRelay()));
    this.setIsRelayed(MoneroUtils.reconcile(this.getIsRelayed(), tx.getIsRelayed()));
    this.setIsDoubleSpend(MoneroUtils.reconcile(this.getIsDoubleSpend(), tx.getIsDoubleSpend()));
    this.setKey(MoneroUtils.reconcile(this.getKey(), tx.getKey()));
    this.setHex(MoneroUtils.reconcile(this.getHex(), tx.getHex()));
    this.setSize(MoneroUtils.reconcile(this.getSize(), tx.getSize()));
    this.setWeight(MoneroUtils.reconcile(this.getWeight(), tx.getWeight()));
    this.setMetadata(MoneroUtils.reconcile(this.getMetadata(), tx.getMetadata()));
    this.setOutputIndices(MoneroUtils.reconcile(this.getOutputIndices(), tx.getOutputIndices()));
    this.setCommonTxSets(MoneroUtils.reconcile(this.getCommonTxSets(), tx.getCommonTxSets()));
    this.setExtra(MoneroUtils.reconcile(this.getExtra(), tx.getExtra()));
    this.setVin(MoneroUtils.reconcile(this.getVin(), tx.getVin()));
    this.setVout(MoneroUtils.reconcile(this.getVout(), tx.getVout()));
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
    this.setIsConfirmed(MoneroUtils.reconcile(this.getIsConfirmed(), tx.getIsConfirmed(), {resolveTrue: true}));
    this.setInTxPool(MoneroUtils.reconcile(this.getInTxPool(), tx.getInTxPool(), {resolveTrue: false}));
    this.setLastRelayedTime(MoneroUtils.reconcile(this.getLastRelayedTime(), tx.getLastRelayedTime(), {resolveDefined: false, resolveMax: true}));  // becomes undefined, else take max
    this.setHeight(MoneroUtils.reconcile(this.getHeight(), tx.getHeight(), {resolveMax: true}));  // height can increase
    this.setBlockTimestamp(MoneroUtils.reconcile(this.getBlockTimestamp(), tx.getBlockTimestamp(), {resolveMax: true}));  // block timestamp can increase
    this.setConfirmationCount(MoneroUtils.reconcile(this.getConfirmationCount(), tx.getConfirmationCount(), {resolveMax: true})); // confirmation count can increase
    
    
    
    
//    // merge height
//    if (this.getHeight() >= 0 || tx.getHeight() >= 0) {
//      let height1 = this.getHeight() >= 0 ? this.getHeight() : 0;
//      let height2 = tx.getHeight() >= 0 ? tx.getHeight() : 0;
//      this.setHeight(Math.max(height1, height2));
//    }
//    
//    // merge block timestamp
//    if (this.getBlockTimestamp() >= 0 || tx.getBlockTimestamp() >= 0) {
//      let blockTimestamp1 = this.getBlockTimestamp() >= 0 ? this.getBlockTimestamp() : 0;
//      let blockTimestamp2 = tx.getBlockTimestamp() >= 0 ? tx.getBlockTimestamp() : 0;
//      this.setBlockTimestamp(Math.max(blockTimestamp1, blockTimestamp2));
//    }
    
    // merge received time
    if (this.getReceivedTime() === undefined) this.setReceivedTime(tx.getReceivedTime());
    else if (tx.getReceivedTime() !== undefined) {
      if (!this.getIsConfirmed()) this.setReceivedTime(Math.min(this.getReceivedTime(), tx.getReceivedTime())); // txpool timestamps can vary so use first timestamp
      else assert.equal(this.getReceivedTime(), tx.getReceivedTime(), "Transaction " + tx.getId() + " received timestamps should be equal but are not: " + this.getReceivedTime() + " vs " + tx.getReceivedTime());
    }
    
    // merge estimated blocks until confirmed count
    if (this.getEstimatedBlockCountUntilConfirmed() !== undefined) {
      if (tx.getEstimatedBlockCountUntilConfirmed() === undefined) this.setEstimatedBlockCountUntilConfirmed(undefined);  // uninitialize when confirmed
      else {
        assert(Math.abs(this.getEstimatedBlockCountUntilConfirmed() - tx.getEstimatedBlockCountUntilConfirmed()) <= 1);   // estimated block count can change, take the latest (min)
        this.setEstimatedBlockCountUntilConfirmed(Math.min(this.getEstimatedBlockCountUntilConfirmed(), tx.getEstimatedBlockCountUntilConfirmed()));
      }
    }
  }
}

// default payment id
MoneroTx.DEFAULT_PAYMENT_ID = "0000000000000000";

module.exports = MoneroTx;