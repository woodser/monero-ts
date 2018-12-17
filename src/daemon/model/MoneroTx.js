const assert = require("assert");
const MoneroDaemonModel = require("./MoneroDaemonModel");
const MoneroUtils = require("../../utils/MoneroUtils");

/**
 * Represents a transaction on the Monero network.
 * 
 * ADD: do not relay, relayed
 * NOT SURE: kept by block, last failed height, last failed id hash, max used block height, max used block id
 * TODO: ensure all fields are tested
 */
class MoneroTx extends MoneroDaemonModel {
  
  /**
   * Constructs the model.
   */
  constructor(json) {
    super();
    this.json = Object.assign({}, json);
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
  
  getPaymentId() {
    return this.json.getPaymentId;
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
  
  getInMempool() {
    return this.json.inMempool;
  }
  
  setInMempool(inMempool) {
    this.json.inMempool = inMempool;
  }
  
  getHeight() {
    return this.json.height;
  }
  
  setHeight(height) {
    this.json.height = height;
  }
  
  getNumConfirmations() {
    return this.json.numConfirmations;
  }
  
  setNumConfirmations(numConfirmations) {
    this.json.numConfirmations = numConfirmations;
  }
  
  getTimestamp() {
    return this.json.timestamp;
  }
  
  setTimestamp(timestamp) {
    this.json.timestamp = timestamp;
  }
  
  getNumEstimatedBlocksUntilConfirmed() {
    return this.json.numEstimatedBlocksUntilConfirmed;
  }
  
  setNumEstimatedBlocksUntilConfirmed(numEstimatedBlocksUntilConfirmed) {
    this.json.numEstimatedBlocksUntilConfirmed = numEstimatedBlocksUntilConfirmed;
  }
  
  getUnlockTime() {
    return this.json.unlockTime;
  }
  
  setUnlockTime(unlockTime) {
    this.json.unlockTime = unlockTime;
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
    MoneroUtils.safeSet(this, this.getIsConfirmed, this.setIsConfirmed, tx.getIsConfirmed()); // TODO: this could change and become confirmed
    MoneroUtils.safeSet(this, this.getInMempool, this.setInMempool, tx.getInMempool());       // TODO: this could change and move out of mempool
    MoneroUtils.safeSet(this, this.getHeight, this.setHeight, tx.getHeight());
    MoneroUtils.safeSet(this, this.getUnlockTime, this.setUnlockTime, tx.getUnlockTime());
    MoneroUtils.safeSet(this, this.getIsDoubleSpend, this.setIsDoubleSpend, tx.getIsDoubleSpend());
    MoneroUtils.safeSet(this, this.getKey, this.setKey, tx.getKey());
    MoneroUtils.safeSet(this, this.getHex, this.setHex, tx.getHex());
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
    if (this.json.timestamp === undefined) this.json.timestamp = tx.getTimestamp();
    else if (tx.getTimestamp() !== undefined) {
      if (!this.getIsConfirmed()) {
        this.json.timestamp = Math.min(this.json.timestamp, tx.getTimestamp()); // mempool timestamps can vary so use first timestamp
      } else {
        assert.equal(this.json.timestamp, tx.getTimestamp(), "Transaction " + tx.getId() + " timestamps should be equal but are not: " + this.json.timestamp + " vs " + tx.getTimestamp());
      }
    }
    if (this.json.numConfirmations === undefined) this.json.numConfirmations = tx.getNumConfirmations();
    else if (tx.getNumConfirmations() !== undefined) {
      this.json.numConfirmations = Math.max(this.json.numConfirmations, tx.getNumConfirmations());  // num confirmations can change, take the latest (max)
    }
    if (this.json.numEstimatedBlocksUntilConfirmed !== undefined) {
      if (tx.getNumEstimatedBlocksUntilConfirmed() === undefined) delete this.json.numEstimatedBlocksUntilConfirmed;  // uninitialize when confirmed
      else {
        assert(Math.abs(this.json.numEstimatedBlocksUntilConfirmed - tx.getNumEstimatedBlocksUntilConfirmed()) <= 1); // num estimated blocks can change, take the latest (min)
        this.json.numEstimatedBlocksUntilConfirmed = Math.min(this.json.numEstimatedBlocksUntilConfirmed, tx.getNumEstimatedBlocksUntilConfirmed());
      }
    }
  }
}

// default payment id
MoneroTx.DEFAULT_PAYMENT_ID = "0000000000000000";

module.exports = MoneroTx;