#include "MoneroDaemon.h"

#include "utils/MoneroUtils.h"
#include "include_base_utils.h"
#include "common/util.h"

/**
 * Public interface for libmonero-cpp library.
 */
namespace monero {

  // ------------------------- INITIALIZE CONSTANTS ---------------------------

  const string MoneroTx::DEFAULT_PAYMENT_ID = string("0000000000000000");

  // -------------------------- MODEL SERIALIZATION ---------------------------

  string SerializableStruct::serialize() const {
    return MoneroUtils::serialize(toPropertyTree());
  }

  boost::property_tree::ptree MoneroBlockHeader::toPropertyTree() const {
    //cout << "MoneroBlockHeader::toPropertyTree(block)" << endl;
    boost::property_tree::ptree node;
    if (id != boost::none) node.put("id", *id);
    if (height != boost::none) node.put("height", *height);
    if (timestamp != boost::none) node.put("timestamp", *timestamp);
    if (size != boost::none) node.put("size", *size);
    if (weight != boost::none) node.put("weight", *weight);
    if (longTermWeight != boost::none) node.put("longTermWeight", *longTermWeight);
    if (depth != boost::none) node.put("depth", *depth);
    if (difficulty != boost::none) node.put("difficulty", *difficulty);
    if (cumulativeDifficulty != boost::none) node.put("cumulativeDifficulty", *height);
    if (majorVersion != boost::none) node.put("majorVersion", *majorVersion);
    if (minorVersion != boost::none) node.put("minorVersion", *minorVersion);
    if (nonce != boost::none) node.put("nonce", *nonce);
    if (coinbaseTxId != boost::none) node.put("coinbaseTxId", *coinbaseTxId);
    if (numTxs != boost::none) node.put("numTxs", *numTxs);
    if (orphanStatus != boost::none) node.put("orphanStatus", *orphanStatus);
    if (prevId != boost::none) node.put("prevId", *prevId);
    if (reward != boost::none) node.put("reward", *reward);
    if (powHash != boost::none) node.put("powHash", *powHash);
    return node;
  }

  boost::property_tree::ptree MoneroBlock::toPropertyTree() const {
    //cout << "MoneroBlock::toPropertyTree(block)" << endl;
    boost::property_tree::ptree node = MoneroBlockHeader::toPropertyTree();
    if (hex != boost::none) node.put("hex", *hex);
    if (coinbaseTx != boost::none) node.add_child("coinbaseTx", (*coinbaseTx)->toPropertyTree());
    node.add_child("txs", MoneroUtils::toPropertyTree(txs));
    // TODO: handle txIds
    return node;
  }

  boost::property_tree::ptree MoneroTx::toPropertyTree() const {
    //cout << "MoneroTx::txToPropertyTree(tx)" << endl;
    boost::property_tree::ptree node;
    if (id != boost::none) node.put("id", *id);
    if (version != boost::none) node.put("version", *version);
    if (isCoinbase != boost::none) node.put("isCoinbase", *isCoinbase);
    if (paymentId != boost::none) node.put("paymentId", *paymentId);
    if (fee != boost::none) node.put("fee", *fee);
    if (mixin != boost::none) node.put("mixin", *mixin);
    if (doNotRelay != boost::none) node.put("doNotRelay", *doNotRelay);
    if (isRelayed != boost::none) node.put("isRelayed", *isRelayed);
    if (isConfirmed != boost::none) node.put("isConfirmed", *isConfirmed);
    if (inTxPool != boost::none) node.put("inTxPool", *inTxPool);
    if (numConfirmations != boost::none) node.put("numConfirmations", *numConfirmations);
    if (unlockTime != boost::none) node.put("unlockTime", *unlockTime);
    if (lastRelayedTimestamp != boost::none) node.put("lastRelayedTimestamp", *lastRelayedTimestamp);
    if (receivedTimestamp != boost::none) node.put("receivedTimestamp", *receivedTimestamp);
    if (isDoubleSpend != boost::none) node.put("isDoubleSpend", *isDoubleSpend);
    if (key != boost::none) node.put("key", *key);
    if (fullHex != boost::none) node.put("fullHex", *fullHex);
    if (prunedHex != boost::none) node.put("prunedHex", *prunedHex);
    if (prunableHex != boost::none) node.put("prunableHex", *prunableHex);
    if (prunableHash != boost::none) node.put("prunableHash", *prunableHash);
    if (size != boost::none) node.put("size", *size);
    if (weight != boost::none) node.put("weight", *weight);
    if (!vins.empty()) throw runtime_error("not implemented");
    if (!vouts.empty()) throw runtime_error("not implemented");
    if (!outputIndices.empty()) throw runtime_error("not implemented");
    if (metadata != boost::none) node.put("metadata", *metadata);
    if (commonTxSets != boost::none) throw runtime_error("not implemented");
    if (!extra.empty()) throw runtime_error("not implemented");
    if (rctSignatures != boost::none) throw runtime_error("not implemented");
    if (rctSigPrunable != boost::none) throw runtime_error("not implemented");
    if (isKeptByBlock != boost::none) node.put("isKeptByBlock", *isKeptByBlock);
    if (isFailed != boost::none) node.put("isFailed", *isFailed);
    if (lastFailedHeight != boost::none) node.put("lastFailedHeight", *lastFailedHeight);
    if (lastFailedId != boost::none) node.put("lastFailedId", *lastFailedId);
    if (maxUsedBlockHeight != boost::none) node.put("maxUsedBlockHeight", *maxUsedBlockHeight);
    if (maxUsedBlockId != boost::none) node.put("maxUsedBlockId", *maxUsedBlockId);
    if (!signatures.empty()) throw runtime_error("not implemented");
    return node;
  }

  // -------------------------- MODEL IMPLEMENTATION --------------------------

  void MoneroBlockHeader::merge(const MoneroBlockHeader& header) {
    cout << "MoneroBlockHeader::merge()" << endl;
    if (this == &header) return;
    id = MoneroUtils::reconcile(id, header.id);
    height = MoneroUtils::reconcile(height, header.height, boost::none, boost::none, true); // height can increase
    timestamp = MoneroUtils::reconcile(timestamp, header.timestamp, boost::none, boost::none, true);  // timestamp can increase
    size = MoneroUtils::reconcile(size, header.size);
    weight = MoneroUtils::reconcile(weight, header.weight);
    longTermWeight = MoneroUtils::reconcile(longTermWeight, header.longTermWeight);
    depth = MoneroUtils::reconcile(depth, header.depth);
    difficulty = MoneroUtils::reconcile(difficulty, header.difficulty);
    cumulativeDifficulty = MoneroUtils::reconcile(cumulativeDifficulty, header.cumulativeDifficulty);
    majorVersion = MoneroUtils::reconcile(majorVersion, header.majorVersion);
    minorVersion = MoneroUtils::reconcile(minorVersion, header.minorVersion);
    nonce = MoneroUtils::reconcile(nonce, header.nonce);
    coinbaseTxId = MoneroUtils::reconcile(coinbaseTxId, header.coinbaseTxId);
    numTxs = MoneroUtils::reconcile(numTxs, header.numTxs);
    orphanStatus = MoneroUtils::reconcile(orphanStatus, header.orphanStatus);
    prevId = MoneroUtils::reconcile(prevId, header.prevId);
    reward = MoneroUtils::reconcile(reward, header.reward);
    powHash = MoneroUtils::reconcile(powHash, header.powHash);
  }

  void MoneroBlock::merge(const MoneroBlock& block) {
    cout << "MoneroBlock::merge()" << endl;
    if (this == &block) return;

    // merge header fields
    MoneroBlockHeader::merge(block);

    // merge coinbase tx
    if (coinbaseTx == boost::none) coinbaseTx = block.coinbaseTx;
    else if (block.coinbaseTx != boost::none) (**coinbaseTx).merge(**block.coinbaseTx);

    // merge non-coinbase txs
    if (txs.empty()) txs = block.txs;
    else if (!block.txs.empty()) {
      for (const shared_ptr<MoneroTx>& thatTx : block.txs) {
        bool found = false;
        for (const shared_ptr<MoneroTx>& thisTx : txs) {
          if (thatTx->id == thatTx->id) {
            thisTx->merge(*thatTx);
            found = true;
            break;
          }
        }
        if (!found) txs.push_back(thatTx);
      }
    }
    if (!txs.empty()) {
      for (const shared_ptr<MoneroTx>& tx : txs) {
        tx->block = shared_ptr<MoneroBlock>(this);
      }
    }

    // merge other fields
    hex = MoneroUtils::reconcile(hex, block.hex);
    //txIds = MoneroUtils::reconcile(txIds, block.txIds); // TODO: implement
    throw runtime_error("ready to reconcile txIds");
  }

  void MoneroTx::merge(const MoneroTx& tx) {
    cout << "MoneroTx::merge()" << endl;
    if (this == &tx) return;
    id = MoneroUtils::reconcile(id, tx.id);
    version = MoneroUtils::reconcile(version, tx.version);
    paymentId = MoneroUtils::reconcile(paymentId, tx.paymentId);
    fee = MoneroUtils::reconcile(fee, tx.fee);
    mixin = MoneroUtils::reconcile(mixin, tx.mixin);
    isConfirmed = MoneroUtils::reconcile(isConfirmed, tx.isConfirmed);
    doNotRelay = MoneroUtils::reconcile(doNotRelay, tx.doNotRelay);
    isRelayed = MoneroUtils::reconcile(isRelayed, tx.isRelayed);
    isDoubleSpend = MoneroUtils::reconcile(isDoubleSpend, tx.isDoubleSpend);
    key = MoneroUtils::reconcile(key, tx.key);
    fullHex = MoneroUtils::reconcile(fullHex, tx.fullHex);
    prunedHex = MoneroUtils::reconcile(prunedHex, tx.prunedHex);
    prunableHex = MoneroUtils::reconcile(prunableHex, tx.prunableHex);
    prunableHash = MoneroUtils::reconcile(prunableHash, tx.prunableHash);
    size = MoneroUtils::reconcile(size, tx.size);
    weight = MoneroUtils::reconcile(weight, tx.weight);
    //outputIndices = MoneroUtils::reconcile(outputIndices, tx.outputIndices);  // TODO
    metadata = MoneroUtils::reconcile(metadata, tx.metadata);
    commonTxSets = MoneroUtils::reconcile(commonTxSets, tx.commonTxSets);
    //extra = MoneroUtils::reconcile(extra, tx.extra);  // TODO
    rctSignatures = MoneroUtils::reconcile(rctSignatures, tx.rctSignatures);
    rctSigPrunable = MoneroUtils::reconcile(rctSigPrunable, tx.rctSigPrunable);
    isKeptByBlock = MoneroUtils::reconcile(isKeptByBlock, tx.isKeptByBlock);
    isFailed = MoneroUtils::reconcile(isFailed, tx.isFailed);
    lastFailedHeight = MoneroUtils::reconcile(lastFailedHeight, tx.lastFailedHeight);
    lastFailedId = MoneroUtils::reconcile(lastFailedId, tx.lastFailedId);
    maxUsedBlockHeight = MoneroUtils::reconcile(maxUsedBlockHeight, tx.maxUsedBlockHeight);
    maxUsedBlockId = MoneroUtils::reconcile(maxUsedBlockId, tx.maxUsedBlockId);
    //signatures = MoneroUtils::reconcile(signatures, tx.signatures); // TODO
    unlockTime = MoneroUtils::reconcile(unlockTime, tx.unlockTime);
    numConfirmations = MoneroUtils::reconcile(numConfirmations, tx.numConfirmations);

    throw runtime_error("Not implemented");
  }

  // ---------------------------- PRIVATE HELPERS -----------------------------

}
