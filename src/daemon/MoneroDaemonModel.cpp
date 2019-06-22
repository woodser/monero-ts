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

  // ------------------------- SERIALIZABLE STRUCT ----------------------------

  string SerializableStruct::serialize() const {
    return MoneroUtils::serialize(toPropertyTree());
  }

  // ------------------------- MONERO BLOCK HEADER ----------------------------

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

  void MoneroBlockHeader::merge(const shared_ptr<MoneroBlockHeader>& self, const shared_ptr<MoneroBlockHeader>& other) {
    if (this != self.get()) throw runtime_error("this != self");
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

  // ----------------------------- MONERO BLOCK -------------------------------

  boost::property_tree::ptree MoneroBlock::toPropertyTree() const {
    //cout << "MoneroBlock::toPropertyTree(block)" << endl;
    boost::property_tree::ptree node = MoneroBlockHeader::toPropertyTree();
    if (hex != boost::none) node.put("hex", *hex);
    if (coinbaseTx != boost::none) node.add_child("coinbaseTx", (*coinbaseTx)->toPropertyTree());
    node.add_child("txs", MoneroUtils::toPropertyTree(txs));
    // TODO: handle txIds
    return node;
  }

  void MoneroBlock::merge(const shared_ptr<MoneroBlock>& self, const shared_ptr<MoneroBlock>& other) {
    if (this != self.get()) throw runtime_error("this != self");
    if (self == other) return;

    // merge header fields
    MoneroBlockHeader::merge(self, other);

    // merge coinbase tx
    if (coinbaseTx == boost::none) coinbaseTx = other->coinbaseTx;
    else if (other->coinbaseTx != boost::none) coinbaseTx.get()->merge(*coinbaseTx, *other->coinbaseTx);

    // merge non-coinbase txs
    if (txs.empty()) txs = other->txs;
    else if (!other->txs.empty()) {
      for (const shared_ptr<MoneroTx>& thatTx : other->txs) {
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
        tx->block = self;
      }
    }

    // merge other fields
    hex = MoneroUtils::reconcile(hex, other->hex);
    txIds = MoneroUtils::reconcile(txIds, other->txIds);
  }

  // ------------------------------- MONERO TX --------------------------------

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

  boost::optional<uint64_t> MoneroTx::getHeight() const {
    if (block == boost::none) return boost::none;
    return *((*block)->height);
  }

  void MoneroTx::merge(const shared_ptr<MoneroTx>& self, const shared_ptr<MoneroTx>& other) {
    if (this != self.get()) throw runtime_error("this != self");
    if (self == other) return;
    id = MoneroUtils::reconcile(id, other->id);
    version = MoneroUtils::reconcile(version, other->version);
    paymentId = MoneroUtils::reconcile(paymentId, other->paymentId);
    fee = MoneroUtils::reconcile(fee, other->fee);
    mixin = MoneroUtils::reconcile(mixin, other->mixin);
    isConfirmed = MoneroUtils::reconcile(isConfirmed, other->isConfirmed);
    doNotRelay = MoneroUtils::reconcile(doNotRelay, other->doNotRelay);
    isRelayed = MoneroUtils::reconcile(isRelayed, other->isRelayed);
    isDoubleSpend = MoneroUtils::reconcile(isDoubleSpend, other->isDoubleSpend);
    key = MoneroUtils::reconcile(key, other->key);
    fullHex = MoneroUtils::reconcile(fullHex, other->fullHex);
    prunedHex = MoneroUtils::reconcile(prunedHex, other->prunedHex);
    prunableHex = MoneroUtils::reconcile(prunableHex, other->prunableHex);
    prunableHash = MoneroUtils::reconcile(prunableHash, other->prunableHash);
    size = MoneroUtils::reconcile(size, other->size);
    weight = MoneroUtils::reconcile(weight, other->weight);
    //outputIndices = MoneroUtils::reconcile(outputIndices, other->outputIndices);  // TODO
    metadata = MoneroUtils::reconcile(metadata, other->metadata);
    commonTxSets = MoneroUtils::reconcile(commonTxSets, other->commonTxSets);
    //extra = MoneroUtils::reconcile(extra, other->extra);  // TODO
    rctSignatures = MoneroUtils::reconcile(rctSignatures, other->rctSignatures);
    rctSigPrunable = MoneroUtils::reconcile(rctSigPrunable, other->rctSigPrunable);
    isKeptByBlock = MoneroUtils::reconcile(isKeptByBlock, other->isKeptByBlock);
    isFailed = MoneroUtils::reconcile(isFailed, other->isFailed);
    lastFailedHeight = MoneroUtils::reconcile(lastFailedHeight, other->lastFailedHeight);
    lastFailedId = MoneroUtils::reconcile(lastFailedId, other->lastFailedId);
    maxUsedBlockHeight = MoneroUtils::reconcile(maxUsedBlockHeight, other->maxUsedBlockHeight);
    maxUsedBlockId = MoneroUtils::reconcile(maxUsedBlockId, other->maxUsedBlockId);
    //signatures = MoneroUtils::reconcile(signatures, other->signatures); // TODO
    unlockTime = MoneroUtils::reconcile(unlockTime, other->unlockTime);
    numConfirmations = MoneroUtils::reconcile(numConfirmations, other->numConfirmations);

    // merge vins
    if (!other->vins.empty()) {
      for (const shared_ptr<MoneroOutput>& merger : other->vins) {
        bool merged = false;
        merger->tx = self;
        for (const shared_ptr<MoneroOutput>& mergee : vins) {
          if ((*mergee->keyImage)->hex == (*merger->keyImage)->hex) {
            mergee->merge(mergee, merger);
            merged = true;
            break;
          }
        }
        if (!merged) vins.push_back(merger);
      }
    }

    // merge vouts
    if (!other->vouts.empty()) {
      for (const shared_ptr<MoneroOutput>& vout : other->vouts) vout->tx = self;
      if (vouts.empty()) vouts = other->vouts;
      else {

        // determine if key images present
        int numKeyImages = 0;
        for (const shared_ptr<MoneroOutput> vout : vouts) {
          if (vout->keyImage != boost::none) {
            if ((*vout->keyImage)->hex == boost::none) throw runtime_error("Key image hex cannot be null");
            numKeyImages++;
          }
        }
        for (const shared_ptr<MoneroOutput>& vout : other->vouts) {
          if (vout->keyImage != boost::none) {
            if ((*vout->keyImage)->hex == boost::none) throw runtime_error("Key image hex cannot be null");
            numKeyImages++;
          }
        }
        if (numKeyImages != 0 && vouts.size() + other->vouts.size() != numKeyImages) throw runtime_error("Some vouts have a key image and some do not");

        // merge by key images
        if (numKeyImages > 0) {
          for (const shared_ptr<MoneroOutput>& merger : other->vouts) {
            bool merged = false;
            for (const shared_ptr<MoneroOutput>& mergee : vouts) {
              if ((*mergee->keyImage)->hex == (*merger->keyImage)->hex) {
                mergee->merge(mergee, merger);
                merged = true;
                break;
              }
            }
            if (!merged) vouts.push_back(merger);
          }
        }

        // merge by position
        else {
          if (vouts.size() != other->vouts.size()) throw runtime_error("Vout sizes are different");
          for (int i = 0; i < other->vouts.size(); i++) {
            vouts.at(i)->merge(vouts.at(i), other->vouts.at(i));
          }
        }
      }
    }

    // handle unrelayed -> relayed -> confirmed
    if (*isConfirmed) {
      inTxPool = false;
      receivedTimestamp = boost::none;
      lastRelayedTimestamp = boost::none;
    } else {
      inTxPool = MoneroUtils::reconcile(inTxPool, other->inTxPool, boost::none, true, boost::none); // unrelayed -> tx pool
      receivedTimestamp = MoneroUtils::reconcile(receivedTimestamp, other->receivedTimestamp, boost::none, boost::none, false); // take earliest receive time
      lastRelayedTimestamp = MoneroUtils::reconcile(lastRelayedTimestamp, other->lastRelayedTimestamp, boost::none, boost::none, true); // take latest relay time
    }
  }

  // --------------------------- MONERO KEY IMAGE -----------------------------

  boost::property_tree::ptree MoneroKeyImage::toPropertyTree() const {
    //cout << "MoneroKeyImage::toPropertyTree(tx)" << endl;
    boost::property_tree::ptree node;
    if (hex != boost::none) node.put("hex", *hex);
    if (signature != boost::none) node.put("signature", *signature);
    return node;
  }

  void MoneroKeyImage::merge(const shared_ptr<MoneroKeyImage>& self, const shared_ptr<MoneroKeyImage>& other) {
    cout << "MoneroKeyImage::merge()" << endl;
    throw runtime_error("Not implemented");
  }

  // ------------------------------ MONERO OUTPUT -----------------------------

  boost::property_tree::ptree MoneroOutput::toPropertyTree() const {
    //cout << "MoneroOutput::toPropertyTree(tx)" << endl;
    boost::property_tree::ptree node;
    if (keyImage != boost::none) node.add_child("keyImage", (*keyImage)->toPropertyTree());
    if (amount != boost::none) node.put("amount", *amount);
    if (index != boost::none) node.put("index", *index);
    if (!ringOutputIndices.empty()) throw runtime_error("MoneroOutput::toPropertyTree() ringOutputIndices not implemented");
    if (stealthPublicKey != boost::none) node.put("stealthPublicKey", *stealthPublicKey);
    return node;
  }

  void MoneroOutput::merge(const shared_ptr<MoneroOutput>& self, const shared_ptr<MoneroOutput>& other) {
    cout << "MoneroOutput::merge()" << endl;
    throw runtime_error("Not implemented");
  }
}
