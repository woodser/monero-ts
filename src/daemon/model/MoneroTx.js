const assert = require("assert");
const GenUtils = require("../../utils/GenUtils");
const BigInteger = require("../../../external/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroError = require("../../utils/MoneroError");
const MoneroOutput = require("./MoneroOutput");

/**
 * Represents a transaction on the Monero network.
 */
class MoneroTx {
  
  /**
   * Construct the model.
   * 
   * @param {MoneroTx|object} state is existing state to initialize from (optional)
   */
  constructor(state) {
    
    // initialize internal state
    if (!state) state = {};
    else if (state instanceof MoneroTx) state = state.toJson();
    else if (typeof state === "object") state = Object.assign({}, state);
    else throw new MoneroError("state must be a MoneroTx or JavaScript object");
    this.state = state;
    
    // deserialize fee
    if (state.fee && !(state.fee instanceof BigInteger)) state.fee = BigInteger.parse(state.fee);
    
    // deserialize vins
    if (state.vins) {
      for (let i = 0; i < state.vins.length; i++) {
        if (!(state.vins[i] instanceof MoneroOutput)) {
          state.vins[i] = new MoneroOutput(Object.assign(state.vins[i], {tx: this}));
        }
      }
    }
    
    // deserialize vouts
    if (state.vouts) {
      for (let i = 0; i < state.vouts.length; i++) {
        if (!(state.vouts[i] instanceof MoneroOutput)) {
          state.vouts[i] = new MoneroOutput(Object.assign(state.vouts[i], {tx: this}));
        }
      }
    }
  }
  
  getBlock() {
    return this.state.block;
  }
  
  setBlock(block) {
    this.state.block = block;
    return this;
  }
  
  getHeight() {
    return this.getBlock() === undefined ? undefined : this.getBlock().getHeight();
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
  
  getNumConfirmations() {
    return this.state.numConfirmations;
  }
  
  setNumConfirmations(numConfirmations) {
    this.state.numConfirmations = numConfirmations;
    return this;
  }
  
  getUnlockTime() {
    return this.state.unlockTime;
  }
  
  setUnlockTime(unlockTime) {
    this.state.unlockTime = unlockTime;
    return this;
  }
  
  getLastRelayedTimestamp() {
    return this.state.lastRelayedTimestamp;
  }
  
  setLastRelayedTimestamp(lastRelayedTimestamp) {
    this.state.lastRelayedTimestamp = lastRelayedTimestamp;
    return this;
  }
  
  getReceivedTimestamp() {
    return this.state.receivedTimestamp;
  }
  
  setReceivedTimestamp(receivedTimestamp) {
    this.state.receivedTimestamp = receivedTimestamp;
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
  
  /**
   * Get full transaction hex.  Full hex = pruned hex + prunable hex.
   * 
   * @return {string} is full transaction hex
   */
  getFullHex() {
    return this.state.fullHex;
  }
  
  setFullHex(fullHex) {
    this.state.fullHex = fullHex;
    return this;
  }
  
  /**
   * Get pruned transaction hex.  Full hex = pruned hex + prunable hex.
   * 
   * @return {string} is pruned transaction hex
   */
  getPrunedHex() {
    return this.state.prunedHex;
  }
  
  setPrunedHex(prunedHex) {
    this.state.prunedHex = prunedHex;
    return this;
  }
  
  /**
   * Get prunable transaction hex which is hex that is removed from a pruned
   * transaction. Full hex = pruned hex + prunable hex.
   * 
   * @return {string} is the prunable transaction hex
   */
  getPrunableHex() {
    return this.state.prunableHex;
  }
  
  setPrunableHex(prunableHex) {
    this.state.prunableHex = prunableHex;
    return this;
  }
  
  getPrunableHash() {
    return this.state.prunableHash;
  }
  
  setPrunableHash(prunableHash) {
    this.state.prunableHash = prunableHash;
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
  
  getIsKeptByBlock() {
    return  this.state.isKeptByBlock;
  }
  
  setIsKeptByBlock(isKeptByBlock) {
    this.state.isKeptByBlock = isKeptByBlock;
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
  
  copy() {
    return new MoneroTx(this);
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getFee()) json.fee = this.getFee().toString();
    if (this.getVins()) {
      json.vins = [];
      for (let vin of this.getVins()) json.vins.push(vin.toJson());
    }
    if (this.getVouts()) {
      json.vouts = [];
      for (let vout of this.getVouts()) json.vouts.push(vout.toJson());
    }
    if (this.getExtra()) json.extra = this.getExtra().slice();
    delete json.block;  // do not serialize parent block
    return json;
  }
  
  /**
   * Updates this transaction by merging the latest information from the given
   * transaction.
   * 
   * @param tx is the transaction to update this transaction with
   * @return {MoneroTx} this for method chaining
   */
  merge(tx) {
    assert(tx instanceof MoneroTx);
    if (this === tx) return this;
    
    // merge blocks if they're different which comes back to merging txs
    if (this.getBlock() !== tx.getBlock()) {
      const MoneroBlock = require("./MoneroBlock");
      if (this.getBlock() === undefined) {
        this.setBlock(new MoneroBlock());
        this.getBlock().setTxs([this]);
        this.getBlock().setHeight(tx.getHeight());
      }
      if (tx.getBlock() === undefined) {
        tx.setBlock(new MoneroBlock());
        tx.getBlock().setTxs([tx]);
        tx.getBlock().setHeight(this.getHeight());
      }
      this.getBlock().merge(tx.getBlock());
      return this;
    }
    
    // otherwise merge tx fields
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
    this.setFullHex(MoneroUtils.reconcile(this.getFullHex(), tx.getFullHex()));
    this.setPrunedHex(MoneroUtils.reconcile(this.getPrunedHex(), tx.getPrunedHex()));
    this.setPrunableHex(MoneroUtils.reconcile(this.getPrunableHex(), tx.getPrunableHex()));
    this.setPrunableHash(MoneroUtils.reconcile(this.getPrunableHash(), tx.getPrunableHash()));
    this.setSize(MoneroUtils.reconcile(this.getSize(), tx.getSize()));
    this.setWeight(MoneroUtils.reconcile(this.getWeight(), tx.getWeight()));
    this.setOutputIndices(MoneroUtils.reconcile(this.getOutputIndices(), tx.getOutputIndices()));
    this.setMetadata(MoneroUtils.reconcile(this.getMetadata(), tx.getMetadata()));
    this.setCommonTxSets(MoneroUtils.reconcile(this.getCommonTxSets(), tx.getCommonTxSets()));
    this.setExtra(MoneroUtils.reconcile(this.getExtra(), tx.getExtra()));
    this.setRctSignatures(MoneroUtils.reconcile(this.getRctSignatures(), tx.getRctSignatures()));
    this.setRctSigPrunable(MoneroUtils.reconcile(this.getRctSigPrunable(), tx.getRctSigPrunable()));
    this.setIsKeptByBlock(MoneroUtils.reconcile(this.getIsKeptByBlock(), tx.getIsKeptByBlock()));
    this.setIsFailed(MoneroUtils.reconcile(this.getIsFailed(), tx.getIsFailed()));
    this.setLastFailedHeight(MoneroUtils.reconcile(this.getLastFailedHeight(), tx.getLastFailedHeight()));
    this.setLastFailedId(MoneroUtils.reconcile(this.getLastFailedId(), tx.getLastFailedId()));
    this.setMaxUsedBlockHeight(MoneroUtils.reconcile(this.getMaxUsedBlockHeight(), tx.getMaxUsedBlockHeight()));
    this.setMaxUsedBlockId(MoneroUtils.reconcile(this.getMaxUsedBlockId(), tx.getMaxUsedBlockId()));
    this.setSignatures(MoneroUtils.reconcile(this.getSignatures(), tx.getSignatures()));
    this.setUnlockTime(MoneroUtils.reconcile(this.getUnlockTime(), tx.getUnlockTime()));
    this.setNumConfirmations(MoneroUtils.reconcile(this.getNumConfirmations(), tx.getNumConfirmations(), {resolveMax: true})); // num confirmations can increase
    
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
      for (let vout of tx.getVouts()) vout.setTx(this);
      if (this.getVouts() === undefined) this.setVouts(tx.getVouts());
      else {
        
        // determine if key images present
        let numKeyImages = 0;
        for (let vout of this.getVouts()) {
          if (vout.getKeyImage()) {
            assert(vout.getKeyImage().getHex());
            numKeyImages++;
          }
        }
        for (let vout of tx.getVouts()) {
          if (vout.getKeyImage()) {
            assert(vout.getKeyImage().getHex());
            numKeyImages++;
          }
        }
        assert(numKeyImages === 0 || this.getVouts().length + tx.getVouts().length === numKeyImages, "Some vouts have a key image and some do not");
        
        // merge by key images
        if (numKeyImages > 0) {
          for (let merger of tx.getVouts()) {
            let merged = false;
            merger.setTx(this);
            if (this.getVouts() === undefined) this.setVouts([]);
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
        
        // merge by position
        else {
          assert.equal(tx.getVouts().length, this.getVouts().length);
          for (let i = 0; i < tx.getVouts().length; i++) {
            this.getVouts()[i].merge(tx.getVouts()[i]);
          }
        }
      }
    }
    
    // handle unrelayed -> relayed -> confirmed
    if (this.getIsConfirmed()) {
      this.setInTxPool(false);
      this.setReceivedTimestamp(undefined);
      this.setLastRelayedTimestamp(undefined);
    } else {
      this.setInTxPool(MoneroUtils.reconcile(this.getInTxPool(), tx.getInTxPool(), {resolveTrue: true})); // unrelayed -> tx pool
      this.setReceivedTimestamp(MoneroUtils.reconcile(this.getReceivedTimestamp(), tx.getReceivedTimestamp(), {resolveMax: false})); // take earliest receive time
      this.setLastRelayedTimestamp(MoneroUtils.reconcile(this.getLastRelayedTimestamp(), tx.getLastRelayedTimestamp(), {resolveMax: true}));  // take latest relay time
    }
    
    return this;  // for chaining
  }
  
  toString(indent = 0) {
    let str = "";
    str += GenUtils.getIndent(indent) + "=== TX ===\n";
    str += MoneroUtils.kvLine("Tx ID: ", this.getId(), indent);
    str += MoneroUtils.kvLine("Height: ", this.getHeight(), indent);
    str += MoneroUtils.kvLine("Version", this.getVersion(), indent);
    str += MoneroUtils.kvLine("Is coinbase", this.getIsCoinbase(), indent);
    str += MoneroUtils.kvLine("Payment ID", this.getPaymentId(), indent);
    str += MoneroUtils.kvLine("Fee", this.getFee(), indent);
    str += MoneroUtils.kvLine("Mixin", this.getMixin(), indent);
    str += MoneroUtils.kvLine("Do not relay", this.getDoNotRelay(), indent);
    str += MoneroUtils.kvLine("Is relayed", this.getIsRelayed(), indent);
    str += MoneroUtils.kvLine("Is confirmed", this.getIsConfirmed(), indent);
    str += MoneroUtils.kvLine("In tx pool", this.getInTxPool(), indent);
    str += MoneroUtils.kvLine("Num confirmations", this.getNumConfirmations(), indent);
    str += MoneroUtils.kvLine("Unlock time", this.getUnlockTime(), indent);
    str += MoneroUtils.kvLine("Last relayed time", this.getLastRelayedTimestamp(), indent);
    str += MoneroUtils.kvLine("Received time", this.getReceivedTimestamp(), indent);
    str += MoneroUtils.kvLine("Is double spend", this.getIsDoubleSpend(), indent);
    str += MoneroUtils.kvLine("Key", this.getKey(), indent);
    str += MoneroUtils.kvLine("Full hex", this.getFullHex(), indent);
    str += MoneroUtils.kvLine("Pruned hex", this.getPrunedHex(), indent);
    str += MoneroUtils.kvLine("Prunable hex", this.getPrunableHex(), indent);
    str += MoneroUtils.kvLine("Prunable hash", this.getPrunableHash(), indent);
    str += MoneroUtils.kvLine("Size", this.getSize(), indent);
    str += MoneroUtils.kvLine("Weight", this.getWeight(), indent);
    str += MoneroUtils.kvLine("Output indices", this.getOutputIndices(), indent);
    str += MoneroUtils.kvLine("Metadata", this.getMetadata(), indent);
    str += MoneroUtils.kvLine("Common tx sets", this.getCommonTxSets(), indent);
    str += MoneroUtils.kvLine("Extra", this.getExtra(), indent);
    str += MoneroUtils.kvLine("RCT signatures", this.getRctSignatures(), indent);
    str += MoneroUtils.kvLine("RCT sig prunable", this.getRctSigPrunable(), indent);
    str += MoneroUtils.kvLine("Kept by block", this.getIsKeptByBlock(), indent);
    str += MoneroUtils.kvLine("Is failed", this.getIsFailed(), indent);
    str += MoneroUtils.kvLine("Last failed height", this.getLastFailedHeight(), indent);
    str += MoneroUtils.kvLine("Last failed id", this.getLastFailedId(), indent);
    str += MoneroUtils.kvLine("Max used block height", this.getMaxUsedBlockHeight(), indent);
    str += MoneroUtils.kvLine("Max used block id", this.getMaxUsedBlockId(), indent);
    str += MoneroUtils.kvLine("Signatures", this.getSignatures(), indent);
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
}

// default payment id
MoneroTx.DEFAULT_PAYMENT_ID = "0000000000000000";

module.exports = MoneroTx;