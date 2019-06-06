#include "MoneroUtils.h"
#include "rpc/core_rpc_server_commands_defs.h"
#include "storages/portable_storage_template_helper.h"
#include "cryptonote_basic/cryptonote_format_utils.h"

using namespace std;
using namespace boost;
using namespace cryptonote;
using namespace MoneroUtils;

void MoneroUtils::jsonToBinary(const std::string &json, std::string &bin) {
  epee::serialization::portable_storage ps;
  ps.load_from_json(json);
  ps.store_to_binary(bin);
}

void MoneroUtils::binaryToJson(const std::string &bin, std::string &json) {
  epee::serialization::portable_storage ps;
  ps.load_from_binary(bin);
  ps.dump_as_json(json);
}

void MoneroUtils::binaryBlocksToJson(const std::string &bin, std::string &json) {

  // load binary rpc response to struct
  cryptonote::COMMAND_RPC_GET_BLOCKS_BY_HEIGHT::response resp_struct;
  epee::serialization::load_t_from_binary(resp_struct, bin);

  // build property tree from deserialized blocks and transactions
  boost::property_tree::ptree root;
  boost::property_tree::ptree blocksNode;	// array of block strings
  boost::property_tree::ptree txsNodes;		// array of txs per block (array of array)
  for (int blockIdx = 0; blockIdx < resp_struct.blocks.size(); blockIdx++) {

    // parse and validate block
    cryptonote::block block;
    if (cryptonote::parse_and_validate_block_from_blob(resp_struct.blocks[blockIdx].block, block)) {

      // add block node to blocks node
      boost::property_tree::ptree blockNode;
      blockNode.put("", cryptonote::obj_to_json_str(block));	// TODO: no pretty print
      blocksNode.push_back(std::make_pair("", blockNode));
    } else {
      throw std::runtime_error("failed to parse block blob at index " + std::to_string(blockIdx));
    }

    // parse and validate txs
    boost::property_tree::ptree txsNode;
    for (int txIdx = 0; txIdx < resp_struct.blocks[blockIdx].txs.size(); txIdx++) {
      cryptonote::transaction tx;
      if (cryptonote::parse_and_validate_tx_from_blob(resp_struct.blocks[blockIdx].txs[txIdx], tx)) {

        // add tx node to txs node
        boost::property_tree::ptree txNode;
        //std::cout << "PRUNED:\n" << MoneroUtils::get_pruned_tx_json(tx) << "\n";
        txNode.put("", MoneroUtils::get_pruned_tx_json(tx));	// TODO: no pretty print
        txsNode.push_back(std::make_pair("", txNode));
      } else {
	      throw std::runtime_error("failed to parse tx blob at index " + std::to_string(txIdx));
      }
    }
    txsNodes.push_back(std::make_pair("", txsNode));	// array of array of transactions, one array per block
  }
  root.add_child("blocks", blocksNode);
  root.add_child("txs", txsNodes);
  root.put("status", resp_struct.status);
  root.put("untrusted", resp_struct.untrusted);	// TODO: loss of ints and bools

  // convert root to string // TODO: common utility with serial_bridge
  std::stringstream ss;
  boost::property_tree::write_json(ss, root, false/*pretty*/);
  json = ss.str();
}

//string MoneroUtils::serialize(const MoneroAccount& account) {
//  cout << "serialize(account)" << endl;
//
//  // build property tree from account
//  boost::property_tree::ptree accountNode;
//  //addNode(accountNode, string("index"), account.index);
//
//  // convert root to string
//  std::stringstream ss;
//  boost::property_tree::write_json(ss, accountNode, false);
//  return ss.str();
//}
//
//string MoneroUtils::serialize(const MoneroSubaddress& subaddress) {
//  cout << "serialize(subaddress)" << endl;
//  throw runtime_error("serialize(subaddress) not implemented");
//}
//
//string MoneroUtils::serialize(const MoneroBlock& block) {
//  throw runtime_error("serialize(block) not implemented");
//}
//
//void MoneroUtils::deserializeTx(const string& txStr, MoneroTx& tx) {
//  throw runtime_error("deserializeTx(txStr) not implemented");
//}
//
//void MoneroUtils::deserializeTxWallet(const string& txStr, MoneroTxWallet& tx) {
//  throw runtime_error("deserializeTxWallet(txStr) not implemented");
//}
//
//void MoneroUtils::deserializeTxRequest(const string& txRequestStr, MoneroTxRequest& request) {
//  throw runtime_error("deserializeTxRequest(txRequestStr) not implemented");
//}
//
//void MoneroUtils::deserializeOutput(const string& outputStr, MoneroOutput& output) {
//  throw runtime_error("deserializeOutput(outputStr) not implemented");
//}
//
//void MoneroUtils::deserializeOutputWallet(const string& outputStr, MoneroOutputWallet& output) {
//  throw runtime_error("deserializeOutputWallet(outputStr) not implemented");
//}

boost::property_tree::ptree MoneroUtils::toPropertyTree(const MoneroAccount& account) {
  cout << "toPropertyTree(account)" << endl;
  boost::property_tree::ptree accountNode;
//  if (account.index != nullptr) accountNode.put("index", *account.index);
//  if (account.primaryAddress != nullptr) accountNode.put("primaryAddress", *account.primaryAddress);
//  if (account.balance != nullptr) accountNode.put("balance", *account.balance);
//  if (account.unlockedBalance != nullptr) accountNode.put("unlockedBalance", *account.unlockedBalance);
//  if (!account.subaddresses.empty()) {
//    boost::property_tree::ptree subaddressesNode;
//    for (const auto& subaddress : account.subaddresses) {
//      subaddressesNode.push_back(std::make_pair("", toPropertyTree(subaddress)));
//    }
//    accountNode.add_child("subaddresses", subaddressesNode);
//  }
  return accountNode;
}

boost::property_tree::ptree MoneroUtils::toPropertyTree(const MoneroSubaddress& subaddress) {
  cout << "toPropertyTree(subaddress)" << endl;
  boost::property_tree::ptree subaddressNode;
//  if (subaddress.accountIndex != nullptr) subaddressNode.put("accountIndex", *subaddress.accountIndex);
//  if (subaddress.index != nullptr) subaddressNode.put("index", *subaddress.index);
//  if (subaddress.address != nullptr) subaddressNode.put("address", *subaddress.address);
//  if (subaddress.label != nullptr) subaddressNode.put("label", *subaddress.label);
//  if (subaddress.balance != nullptr) subaddressNode.put("balance", *subaddress.balance);
//  if (subaddress.unlockedBalance != nullptr) subaddressNode.put("unlockedBalance", *subaddress.unlockedBalance);
//  if (subaddress.numUnspentOutputs != nullptr) subaddressNode.put("numUnspentOutputs", *subaddress.numUnspentOutputs);
//  if (subaddress.isUsed != nullptr) subaddressNode.put("isUsed", *subaddress.isUsed);
//  if (subaddress.numBlocksToUnlock != nullptr) subaddressNode.put("numBlocksToUnlock", *subaddress.numBlocksToUnlock);
  return subaddressNode;
}

// blockToPropertyTree

boost::property_tree::ptree MoneroUtils::txToPropertyTree(const MoneroTx& tx) {
  cout << "txToPropertyTree(tx)" << endl;
  boost::property_tree::ptree txNode;
//  if (tx.block != nullptr) throw runtime_error("not implemented");  // this should be ignored since we only serialize down the tree
//  if (tx.id != nullptr) txNode.put("id", *tx.id);
//  if (tx.version != nullptr) txNode.put("version", *tx.version);
//  if (tx.isCoinbase != nullptr) txNode.put("isCoinbase", *tx.isCoinbase);
//  if (tx.paymentId != nullptr) txNode.put("paymentId", *tx.paymentId);
//  if (tx.fee != nullptr) txNode.put("fee", *tx.fee);
//  if (tx.mixin != nullptr) txNode.put("mixin", *tx.mixin);
//  if (tx.doNotRelay != nullptr) txNode.put("doNotRelay", *tx.doNotRelay);
//  if (tx.isRelayed != nullptr) txNode.put("isRelayed", *tx.isRelayed);
//  if (tx.isConfirmed != nullptr) txNode.put("isConfirmed", *tx.isConfirmed);
//  if (tx.inTxPool != nullptr) txNode.put("inTxPool", *tx.inTxPool);
//  if (tx.numConfirmations != nullptr) txNode.put("numConfirmations", *tx.numConfirmations);
//  if (tx.unlockTime != nullptr) txNode.put("unlockTime", *tx.unlockTime);
//  if (tx.lastRelayedTimestamp != nullptr) txNode.put("lastRelayedTimestamp", *tx.lastRelayedTimestamp);
//  if (tx.receivedTimestamp != nullptr) txNode.put("receivedTimestamp", *tx.receivedTimestamp);
//  if (tx.isDoubleSpend != nullptr) txNode.put("isDoubleSpend", *tx.isDoubleSpend);
//  if (tx.key != nullptr) txNode.put("key", *tx.key);
//  if (tx.fullHex != nullptr) txNode.put("fullHex", *tx.fullHex);
//  if (tx.prunedHex != nullptr) txNode.put("prunedHex", *tx.prunedHex);
//  if (tx.prunableHex != nullptr) txNode.put("prunableHex", *tx.prunableHex);
//  if (tx.prunableHash != nullptr) txNode.put("prunableHash", *tx.prunableHash);
//  if (tx.size != nullptr) txNode.put("size", *tx.size);
//  if (tx.weight != nullptr) txNode.put("weight", *tx.weight);
//  if (!tx.vins.empty()) throw runtime_error("not implemented");
//  if (!tx.vouts.empty()) throw runtime_error("not implemented");
//  if (!tx.outputIndices.empty()) throw runtime_error("not implemented");
//  if (tx.metadata != nullptr) txNode.put("metadata", *tx.metadata);
//  if (tx.commonTxSets != nullptr) throw runtime_error("not implemented");
//  if (!tx.extra.empty()) throw runtime_error("not implemented");
//  if (tx.rctSignatures != nullptr) throw runtime_error("not implemented");
//  if (tx.rctSigPrunable != nullptr) throw runtime_error("not implemented");
//  if (tx.isKeptByBlock != nullptr) txNode.put("isKeptByBlock", *tx.isKeptByBlock);
//  if (tx.isFailed != nullptr) txNode.put("isFailed", *tx.isFailed);
//  if (tx.lastFailedHeight != nullptr) txNode.put("lastFailedHeight", *tx.lastFailedHeight);
//  if (tx.lastFailedId != nullptr) txNode.put("lastFailedId", *tx.lastFailedId);
//  if (tx.maxUsedBlockHeight != nullptr) txNode.put("maxUsedBlockHeight", *tx.maxUsedBlockHeight);
//  if (tx.maxUsedBlockId != nullptr) txNode.put("maxUsedBlockId", *tx.maxUsedBlockId);
//  if (!tx.signatures.empty()) throw runtime_error("not implemented");
  return txNode;
}

boost::property_tree::ptree MoneroUtils::txWalletToPropertyTree(const MoneroTxWallet& tx) {
  cout << "txWalletToPropertyTree(tx)" << endl;
  boost::property_tree::ptree txNode = txToPropertyTree(tx);
//  if (!tx.vouts.empty()) throw runtime_error("not implemented");
//  if (!tx.incomingTransfers.empty()) throw runtime_error("not implemented");
//  if (tx.outgoingTransfer != nullptr) throw runtime_error("not implemented");
//  if (tx.numSuggestedConfirmations != nullptr) txNode.put("numSuggestedConfirmations", *tx.numSuggestedConfirmations);
//  if (tx.note != nullptr) txNode.put("note", *tx.note);
  return txNode;
}

boost::property_tree::ptree MoneroUtils::txRequestToPropertyTree(const MoneroTxRequest& tx) {
  cout << "txWalletToPropertyTree(tx)" << endl;
  boost::property_tree::ptree txNode = txWalletToPropertyTree(tx);
//  if (tx.isOutgoing != nullptr) txNode.put("isOutgoing", *tx.isOutgoing);
//  if (tx.isIncoming != nullptr) txNode.put("isIncoming", *tx.isIncoming);
//  if (!tx.txIds.empty()) throw runtime_error("not implemented");
//  if (tx.hasPaymentId != nullptr) txNode.put("hasPaymentId", *tx.hasPaymentId);
//  if (!tx.paymentIds.empty()) throw runtime_error("not implemented");
//  if (tx.minHeight != nullptr) txNode.put("minHeight", *tx.minHeight);
//  if (tx.maxHeight != nullptr) txNode.put("maxHeight", *tx.maxHeight);
//  if (tx.includeOutputs != nullptr) txNode.put("includeOutputs", *tx.includeOutputs);
//  if (tx.transferRequest != nullptr) throw runtime_error("not implemented");
  return txNode;
}
