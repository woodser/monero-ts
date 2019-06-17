#include "MoneroDaemonModel.h"

#include "utils/MoneroUtils.h"
#include "include_base_utils.h"
#include "common/util.h"

/**
 * Public library interface.
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

  void MoneroBlockHeader::merge(const shared_ptr<MoneroBlockHeader>& self, const shared_ptr<MoneroBlockHeader>& other) {
    cout << "MoneroBlockHeader::merge()" << endl;
    if (this != &*self) throw runtime_error("this != self");
    if (self == other) return;
    id = MoneroUtils::reconcile(id, other->id);
    height = MoneroUtils::reconcile(height, other->height, boost::none, boost::none, true); // height can increase
    timestamp = MoneroUtils::reconcile(timestamp, other->timestamp, boost::none, boost::none, true);  // timestamp can increase
    size = MoneroUtils::reconcile(size, other->size);
    weight = MoneroUtils::reconcile(weight, other->weight);
    longTermWeight = MoneroUtils::reconcile(longTermWeight, other->longTermWeight);
    depth = MoneroUtils::reconcile(depth, other->depth);
    difficulty = MoneroUtils::reconcile(difficulty, other->difficulty);
    cumulativeDifficulty = MoneroUtils::reconcile(cumulativeDifficulty, other->cumulativeDifficulty);
    majorVersion = MoneroUtils::reconcile(majorVersion, other->majorVersion);
    minorVersion = MoneroUtils::reconcile(minorVersion, other->minorVersion);
    nonce = MoneroUtils::reconcile(nonce, other->nonce);
    coinbaseTxId = MoneroUtils::reconcile(coinbaseTxId, other->coinbaseTxId);
    numTxs = MoneroUtils::reconcile(numTxs, other->numTxs);
    orphanStatus = MoneroUtils::reconcile(orphanStatus, other->orphanStatus);
    prevId = MoneroUtils::reconcile(prevId, other->prevId);
    reward = MoneroUtils::reconcile(reward, other->reward);
    powHash = MoneroUtils::reconcile(powHash, other->powHash);
  }

  void MoneroBlock::merge(const shared_ptr<MoneroBlock>& self, const shared_ptr<MoneroBlock>& other) {
    cout << "MoneroBlock::merge()" << endl;
    if (this != &*self) throw runtime_error("this != self");
    if (self == other) return;

    // merge header fields
    MoneroBlockHeader::merge(self, other);

    // convert other to MoneroBlock*
    MoneroBlock* otherBlock = static_cast<MoneroBlock*>(&*other);

    // merge coinbase tx
    if (coinbaseTx == boost::none) coinbaseTx = otherBlock->coinbaseTx;
    else if (otherBlock->coinbaseTx != boost::none) (**coinbaseTx).merge(*coinbaseTx, *otherBlock->coinbaseTx);

    // merge non-coinbase txs
    if (txs.empty()) txs = otherBlock->txs;
    else if (!otherBlock->txs.empty()) {
      for (const shared_ptr<MoneroTx>& thatTx : otherBlock->txs) {
        bool found = false;
        for (const shared_ptr<MoneroTx>& thisTx : txs) {
          if (thatTx->id == thisTx->id) {
            thisTx->merge(thisTx, thatTx);
            found = true;
            break;
          }
        }
        if (!found) txs.push_back(thatTx);
      }
    }
    if (!txs.empty()) {
      for (const shared_ptr<MoneroTx>& tx : txs) {
        tx->block = static_pointer_cast<MoneroBlock>(self);
      }
    }

    // merge other fields
    hex = MoneroUtils::reconcile(hex, otherBlock->hex);
    //txIds = MoneroUtils::reconcile(txIds, otherBlock->txIds); // TODO: implement
    cout << "Returning from block::merge()!" << endl;
  }

  void MoneroTx::merge(const shared_ptr<MoneroTx>& self, const shared_ptr<MoneroTx>& other) {
    cout << "MoneroTx::merge()" << endl;
//    if (this == &tx) return;
//    id = MoneroUtils::reconcile(id, tx.id);
//    version = MoneroUtils::reconcile(version, tx.version);
//    paymentId = MoneroUtils::reconcile(paymentId, tx.paymentId);
//    fee = MoneroUtils::reconcile(fee, tx.fee);
//    mixin = MoneroUtils::reconcile(mixin, tx.mixin);
//    isConfirmed = MoneroUtils::reconcile(isConfirmed, tx.isConfirmed);
//    doNotRelay = MoneroUtils::reconcile(doNotRelay, tx.doNotRelay);
//    isRelayed = MoneroUtils::reconcile(isRelayed, tx.isRelayed);
//    isDoubleSpend = MoneroUtils::reconcile(isDoubleSpend, tx.isDoubleSpend);
//    key = MoneroUtils::reconcile(key, tx.key);
//    fullHex = MoneroUtils::reconcile(fullHex, tx.fullHex);
//    prunedHex = MoneroUtils::reconcile(prunedHex, tx.prunedHex);
//    prunableHex = MoneroUtils::reconcile(prunableHex, tx.prunableHex);
//    prunableHash = MoneroUtils::reconcile(prunableHash, tx.prunableHash);
//    size = MoneroUtils::reconcile(size, tx.size);
//    weight = MoneroUtils::reconcile(weight, tx.weight);
//    //outputIndices = MoneroUtils::reconcile(outputIndices, tx.outputIndices);  // TODO
//    metadata = MoneroUtils::reconcile(metadata, tx.metadata);
//    commonTxSets = MoneroUtils::reconcile(commonTxSets, tx.commonTxSets);
//    //extra = MoneroUtils::reconcile(extra, tx.extra);  // TODO
//    rctSignatures = MoneroUtils::reconcile(rctSignatures, tx.rctSignatures);
//    rctSigPrunable = MoneroUtils::reconcile(rctSigPrunable, tx.rctSigPrunable);
//    isKeptByBlock = MoneroUtils::reconcile(isKeptByBlock, tx.isKeptByBlock);
//    isFailed = MoneroUtils::reconcile(isFailed, tx.isFailed);
//    lastFailedHeight = MoneroUtils::reconcile(lastFailedHeight, tx.lastFailedHeight);
//    lastFailedId = MoneroUtils::reconcile(lastFailedId, tx.lastFailedId);
//    maxUsedBlockHeight = MoneroUtils::reconcile(maxUsedBlockHeight, tx.maxUsedBlockHeight);
//    maxUsedBlockId = MoneroUtils::reconcile(maxUsedBlockId, tx.maxUsedBlockId);
//    //signatures = MoneroUtils::reconcile(signatures, tx.signatures); // TODO
//    unlockTime = MoneroUtils::reconcile(unlockTime, tx.unlockTime);
//    numConfirmations = MoneroUtils::reconcile(numConfirmations, tx.numConfirmations);
//
//    // merge vins
//    if (!tx.vins.empty()) {
//      for (const shared_ptr<MoneroOutput>& merger : tx.vins) {
//        bool merged = false;
//        merger->tx = shared_ptr<MoneroTx>(this); // TODO: can this cause this* to be deleted prematurely?
//        for (const shared_ptr<MoneroOutput>& mergee : vins) {
//          if ((*mergee->keyImage)->hex == (*merger->keyImage)->hex) {
//            mergee->merge(*merger);
//            merged = true;
//            break;
//          }
//        }
//        if (!merged) vins.push_back(merger);
//      }
//    }
//
//    // merge vouts
//    if (!tx.vouts.empty()) {
//      for (const shared_ptr<MoneroOutput>& vout : tx.vouts) vout->tx = shared_ptr<MoneroTx>(this);
//      if (vouts.empty()) vouts = tx.vouts;
//      else {
//
//        // determine if key images present
//        int numKeyImages = 0;
//        for (const shared_ptr<MoneroOutput> vout : vouts) {
//          if (vout->keyImage != boost::none) {
//            if ((*vout->keyImage)->hex == boost::none) throw runtime_error("Key image hex cannot be null");
//            numKeyImages++;
//          }
//        }
//        for (const shared_ptr<MoneroOutput>& vout : tx.vouts) {
//          if (vout->keyImage != boost::none) {
//            if ((*vout->keyImage)->hex == boost::none) throw runtime_error("Key image hex cannot be null");
//            numKeyImages++;
//          }
//        }
//        if (numKeyImages != 0 && vouts.size() + tx.vouts.size() != numKeyImages) throw runtime_error("Some vouts have a key image and some do not");
//
//        // merge by key images
//        if (numKeyImages > 0) {
//          for (const shared_ptr<MoneroOutput>& merger : tx.vouts) {
//            bool merged = false;
//            for (const shared_ptr<MoneroOutput>& mergee : vouts) {
//              if ((*mergee->keyImage)->hex == (*merger->keyImage)->hex) {
//                mergee->merge(*merger);
//                merged = true;
//                break;
//              }
//            }
//            if (!merged) vouts.push_back(merger);
//          }
//        }
//
//        // merge by position
//        else {
//          if (vouts.size() != tx.vouts.size()) throw runtime_error("Vout sizes are different");
//          for (int i = 0; i < tx.vouts.size(); i++) {
//            vouts.at(i)->merge(*tx.vouts.at(i));
//          }
//        }
//      }
//    }
//
//    // handle unrelayed -> relayed -> confirmed
//    if (*isConfirmed) {
//      inTxPool = false;
//      receivedTimestamp = boost::none;
//      lastRelayedTimestamp = boost::none;
//    } else {
//      inTxPool = MoneroUtils::reconcile(inTxPool, tx.inTxPool, boost::none, true, boost::none); // unrelayed -> tx pool
//      receivedTimestamp = MoneroUtils::reconcile(receivedTimestamp, tx.receivedTimestamp, boost::none, boost::none, false); // take earliest receive time
//      lastRelayedTimestamp = MoneroUtils::reconcile(lastRelayedTimestamp, tx.lastRelayedTimestamp, boost::none, boost::none, true); // take latest relay time
//    }
  }

  void MoneroKeyImage::merge(const shared_ptr<MoneroKeyImage>& self, const shared_ptr<MoneroKeyImage>& other) {
    cout << "MoneroKeyImage::merge()" << endl;
    throw runtime_error("Not implemented");
  }

  void MoneroOutput::merge(const shared_ptr<MoneroOutput>& self, const shared_ptr<MoneroOutput>& other) {
    cout << "MoneroOutput::merge()" << endl;
    throw runtime_error("Not implemented");
  }

  // ---------------------------- PRIVATE HELPERS -----------------------------

}
