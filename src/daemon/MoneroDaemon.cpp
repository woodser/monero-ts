#include "MoneroDaemon.h"

#include "utils/MoneroUtils.h"
#include "include_base_utils.h"
#include "common/util.h"

/**
 * Public interface for libmonero-cpp library.
 */
namespace monero {

  // -------------------------- MODEL SERIALIZATION ---------------------------

  string SerializableStruct::serialize() const {
    return MoneroUtils::serialize(toPropertyTree());
  }

  boost::property_tree::ptree MoneroBlockHeader::toPropertyTree() const {
    cout << "MoneroBlockHeader::toPropertyTree(block)" << endl;
    throw runtime_error("not implemented");
  }

  boost::property_tree::ptree MoneroBlock::toPropertyTree() const {
    cout << "MoneroBlock::toPropertyTree(block)" << endl;
    boost::property_tree::ptree node;
    if (height != boost::none) node.put("height", *height);  // TODO: finish this, add txs
    cout << "We should be adding " << txs.size() << " txs" << endl;
    node.add_child("txs", MoneroUtils::toPropertyTree(txs));  // TODO: txs is vector<shared_ptr<MoneroTx>> so need to handle
    return node;
  }

  boost::property_tree::ptree MoneroTx::toPropertyTree() const {
    cout << "MoneroTx::txToPropertyTree(tx)" << endl;
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

  // ---------------------------- PRIVATE HELPERS -----------------------------

}
