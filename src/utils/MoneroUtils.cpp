/**
 * Copyright (c) 2017-2019 woodser
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Parts of this file are originally copyright (c) 2014-2019, The Monero Project
 *
 * Redistribution and use in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 *
 * All rights reserved.
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of
 *    conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list
 *    of conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors may be
 *    used to endorse or promote products derived from this software without specific
 *    prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
 * THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
 * THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Parts of this file are originally copyright (c) 2012-2013 The Cryptonote developers
 */

#include "MoneroUtils.h"
#include "rpc/core_rpc_server_commands_defs.h"
#include "storages/portable_storage_template_helper.h"
#include "cryptonote_basic/cryptonote_format_utils.h"

using namespace std;
using namespace cryptonote;
using namespace MoneroUtils;

// ------------------------------- INNER HELPERS ------------------------------

// TODO: no common utility?  make common utility
bool stringToBool(string str) {
  transform(str.begin(), str.end(), str.begin(), ::tolower);
  if (string("true") == str) return true;
  if (string("false") == str) return false;
  return boost::lexical_cast<bool>(str);
}

void nodeToTransfer(const boost::property_tree::ptree& node, shared_ptr<MoneroTransfer> transfer) {

  // initialize transfer from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("accountIndex")) transfer->accountIndex = it->second.get_value<uint32_t>();
  }
}

shared_ptr<MoneroTransferRequest> nodeToTransferRequest(const boost::property_tree::ptree& node) {
  shared_ptr<MoneroTransferRequest> transferRequest = shared_ptr<MoneroTransferRequest>(new MoneroTransferRequest());
  nodeToTransfer(node, transferRequest);

  // initialize request from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("isIncoming")) transferRequest->isIncoming = stringToBool(it->second.data());
    else if (key == string("address")) transferRequest->address = it->second.data();
    else if (key == string("addresses")) throw runtime_error("addresses not implemented");
    else if (key == string("subaddressIndex")) transferRequest->subaddressIndex = it->second.get_value<uint32_t>();
    else if (key == string("subaddressIndices")) {
      vector<uint32_t> subaddressIndices;
      for (const auto& child : it->second) subaddressIndices.push_back(child.second.get_value<uint32_t>());
      transferRequest->subaddressIndices = subaddressIndices;
    }
    else if (key == string("destinations")) throw runtime_error("destinations not implemented");
    else if (key == string("hasDestinations")) transferRequest->hasDestinations = stringToBool(it->second.data());
    else if (key == string("txRequest")) throw runtime_error("txRequest not implemented");
  }

  return transferRequest;
}

shared_ptr<MoneroKeyImage> nodeToKeyImage(const boost::property_tree::ptree& node) {

  // initialize key image from node
  shared_ptr<MoneroKeyImage> keyImage = shared_ptr<MoneroKeyImage>(new MoneroKeyImage());
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("hex")) keyImage->hex = it->second.data();
    else if (key == string("signature")) keyImage->signature = it->second.data();
  }

  return keyImage;
}

void nodeToOutput(const boost::property_tree::ptree& node, shared_ptr<MoneroOutput> output) {

  // initialize output from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("keyImage")) output->keyImage = nodeToKeyImage(it->second);
    else if (key == string("amount")) output->amount = it->second.get_value<uint64_t>();
    else if (key == string("index")) output->index = it->second.get_value<uint32_t>();
    else if (key == string("ringOutputIndices")) throw runtime_error("nodeToTx() deserialize ringOutputIndices not implemented");
    else if (key == string("stealthPublicKey")) throw runtime_error("nodeToTx() deserialize stealthPublicKey not implemented");
  }
}

void nodeToOutputWallet(const boost::property_tree::ptree& node, shared_ptr<MoneroOutputWallet> outputWallet) {
  nodeToOutput(node, outputWallet);
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("accountIndex")) outputWallet->accountIndex = it->second.get_value<uint32_t>();
    else if (key == string("subaddressIndex")) outputWallet->subaddressIndex = it->second.get_value<uint32_t>();
    else if (key == string("isSpent")) outputWallet->isSpent = stringToBool(it->second.data());
    else if (key == string("isUnlocked")) outputWallet->isUnlocked = stringToBool(it->second.data());
    else if (key == string("isFrozen")) outputWallet->isFrozen = stringToBool(it->second.data());
  }
}

shared_ptr<MoneroOutputRequest> nodeToOutputRequest(const boost::property_tree::ptree& node) {
  shared_ptr<MoneroOutputRequest> outputRequest = shared_ptr<MoneroOutputRequest>(new MoneroOutputRequest());
  nodeToOutputWallet(node, outputRequest);

  // initialize request from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("subaddressIndices")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) outputRequest->subaddressIndices.push_back(it2->second.get_value<uint32_t>());
    else if (key == string("txRequest")) {} // ignored
  }

  return outputRequest;
}

void nodeToTx(const boost::property_tree::ptree& node, shared_ptr<MoneroTx> tx) {

  // initialize tx from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("id")) tx->id = it->second.data();
    else if (key == string("version")) throw runtime_error("version deserializationn not implemented");
    else if (key == string("isCoinbase")) tx->isCoinbase = stringToBool(it->second.data());
    else if (key == string("paymentId")) throw runtime_error("paymentId deserializationn not implemented");
    else if (key == string("fee")) throw runtime_error("fee deserialization not implemented");
    else if (key == string("mixin")) throw runtime_error("mixin deserialization not implemented");
    else if (key == string("doNotRelay")) tx->doNotRelay = stringToBool(it->second.data());
    else if (key == string("isRelayed")) tx->isRelayed = stringToBool(it->second.data());
    else if (key == string("isConfirmed")) tx->isConfirmed = stringToBool(it->second.data());
    else if (key == string("inTxPool")) tx->inTxPool = stringToBool(it->second.data());
    else if (key == string("numConfirmations")) throw runtime_error("numConfirmations deserialization not implemented");
    else if (key == string("unlockTime")) throw runtime_error("unlockTime deserialization not implemented");
    else if (key == string("lastRelayedTimestamp")) throw runtime_error("lastRelayedTimestamp deserialization not implemented");
    else if (key == string("receivedTimestamp")) throw runtime_error("receivedTimestamp deserializationn not implemented");
    else if (key == string("isDoubleSpendSeen")) tx->isDoubleSpendSeen = stringToBool(it->second.data());
    else if (key == string("key")) tx->key = it->second.data();
    else if (key == string("fullHex")) tx->fullHex = it->second.data();
    else if (key == string("prunedHex")) tx->prunedHex = it->second.data();
    else if (key == string("prunableHex")) tx->prunableHex = it->second.data();
    else if (key == string("prunableHash")) tx->prunableHash = it->second.data();
    else if (key == string("size")) throw runtime_error("size deserialization not implemented");
    else if (key == string("weight")) throw runtime_error("weight deserialization not implemented");
    else if (key == string("vins")) throw runtime_error("vins deserializationn not implemented");
    else if (key == string("vouts")) throw runtime_error("vouts deserializationn not implemented");
    else if (key == string("outputIndices")) throw runtime_error("outputIndices deserialization not implemented");
    else if (key == string("metadata")) throw runtime_error("metadata deserialization not implemented");
    else if (key == string("commonTxSets")) throw runtime_error("commonTxSets deserialization not implemented");
    else if (key == string("extra")) throw runtime_error("extra deserialization not implemented");
    else if (key == string("rctSignatures")) throw runtime_error("rctSignatures deserialization not implemented");
    else if (key == string("rctSigPrunable")) throw runtime_error("rctSigPrunable deserialization not implemented");
    else if (key == string("isKeptByBlock")) tx->isKeptByBlock = stringToBool(it->second.data());
    else if (key == string("isFailed")) tx->isFailed = stringToBool(it->second.data());
    else if (key == string("lastFailedHeight")) throw runtime_error("lastFailedHeight deserialization not implemented");
    else if (key == string("lastFailedId")) tx->lastFailedId = it->second.data();
    else if (key == string("maxUsedBlockHeight")) throw runtime_error("maxUsedBlockHeight deserialization not implemented");
    else if (key == string("maxUsedBlockId")) tx->maxUsedBlockId = it->second.data();
    else if (key == string("signatures")) throw runtime_error("signatures deserialization not implemented");
  }
}

// TODO: fill this out
void nodeToTxWallet(const boost::property_tree::ptree& node, shared_ptr<MoneroTxWallet> txWallet) {
  nodeToTx(node, txWallet);

  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    //if (key == string("id")) tx->id = it->second.data();
  }
}

shared_ptr<MoneroTxRequest> nodeToTxRequest(const boost::property_tree::ptree& node) {
  shared_ptr<MoneroTxRequest> txRequest = shared_ptr<MoneroTxRequest>(new MoneroTxRequest());
  nodeToTxWallet(node, txRequest);

  // initialize request from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("isOutgoing")) txRequest->isOutgoing = stringToBool(it->second.data());
    else if (key == string("isIncoming")) txRequest->isIncoming = stringToBool(it->second.data());
    else if (key == string("txIds")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) txRequest->txIds.push_back(it2->second.data());
    else if (key == string("hasPaymentId")) txRequest->hasPaymentId = stringToBool(it->second.data());
    else if (key == string("paymentIds")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) txRequest->paymentIds.push_back(it2->second.data());
    else if (key == string("height")) txRequest->height = it->second.get_value<uint64_t>();
    else if (key == string("minHeight")) txRequest->minHeight = it->second.get_value<uint64_t>();
    else if (key == string("maxHeight")) txRequest->maxHeight = it->second.get_value<uint64_t>();
    else if (key == string("includeOutputs")) txRequest->includeOutputs = stringToBool(it->second.data());
    else if (key == string("transferRequest")) txRequest->transferRequest = nodeToTransferRequest(it->second);
    else if (key == string("outputRequest")) txRequest->outputRequest = nodeToOutputRequest(it->second);
  }

  return txRequest;
}

shared_ptr<MoneroBlock> nodeToBlockRequest(const boost::property_tree::ptree& node) {
  shared_ptr<MoneroBlock> block = shared_ptr<MoneroBlock>(new MoneroBlock());
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("height")) block->height = (uint64_t) 7;  // TODO
    else if (key == string("txs")) {
      boost::property_tree::ptree txsNode = it->second;
      for (boost::property_tree::ptree::const_iterator it2 = txsNode.begin(); it2 != txsNode.end(); ++it2) {
        block->txs.push_back(nodeToTxRequest(it2->second));
      }
    }
  }
  return block;
}

shared_ptr<MoneroDestination> nodeToDestination(const boost::property_tree::ptree& node) {
  shared_ptr<MoneroDestination> destination = shared_ptr<MoneroDestination>(new MoneroDestination());
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("address")) destination->address = it->second.data();
    else if (key == string("amount")) destination->amount = it->second.get_value<uint64_t>();
  }
  return destination;
}

// ------------------------- PUBLIC STATIC UTILITIES --------------------------

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
        MTRACE("PRUNED:\n" << MoneroUtils::get_pruned_tx_json(tx));
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

shared_ptr<MoneroTxRequest> MoneroUtils::deserializeTxRequest(const string& txRequestStr) {

  // deserialize tx request string to property rooted at block
  std::istringstream iss = txRequestStr.empty() ? std::istringstream() : std::istringstream(txRequestStr);
  boost::property_tree::ptree blockNode;
  boost::property_tree::read_json(iss, blockNode);

  // convert request property tree to block
  shared_ptr<MoneroBlock> block = nodeToBlockRequest(blockNode);

  // get tx request
  shared_ptr<MoneroTxRequest> txRequest = static_pointer_cast<MoneroTxRequest>(block->txs[0]);

  // return deserialized request
  return txRequest;
}

shared_ptr<MoneroTransferRequest> MoneroUtils::deserializeTransferRequest(const string& transferRequestStr) {

  // deserialize transfer request string to property rooted at block
  std::istringstream iss = transferRequestStr.empty() ? std::istringstream() : std::istringstream(transferRequestStr);
  boost::property_tree::ptree blockNode;
  boost::property_tree::read_json(iss, blockNode);

  // convert request property tree to block
  shared_ptr<MoneroBlock> block = nodeToBlockRequest(blockNode);

  // return mpty request if no txs
  if (block->txs.empty()) return shared_ptr<MoneroTransferRequest>(new MoneroTransferRequest());

  // get tx request
  shared_ptr<MoneroTxRequest> txRequest = static_pointer_cast<MoneroTxRequest>(block->txs[0]);

  // get / create transfer request
  shared_ptr<MoneroTransferRequest> transferRequest = txRequest->transferRequest == boost::none ? shared_ptr<MoneroTransferRequest>(new MoneroTransferRequest()) : *txRequest->transferRequest;

  // transfer request references tx request but not the other way around to avoid circular loop // TODO: could add check within meetsCriterias()
  transferRequest->txRequest = txRequest;
  txRequest->transferRequest = boost::none;

  // return deserialized request
  return transferRequest;
}

shared_ptr<MoneroOutputRequest> MoneroUtils::deserializeOutputRequest(const string& outputRequestStr) {

  // deserialize output request string to property rooted at block
  std::istringstream iss = outputRequestStr.empty() ? std::istringstream() : std::istringstream(outputRequestStr);
  boost::property_tree::ptree blockNode;
  boost::property_tree::read_json(iss, blockNode);

  // convert request property tree to block
  shared_ptr<MoneroBlock> block = nodeToBlockRequest(blockNode);

  // empty request if no txs
  if (block->txs.empty()) return shared_ptr<MoneroOutputRequest>(new MoneroOutputRequest());

  // get tx request
  shared_ptr<MoneroTxRequest> txRequest = static_pointer_cast<MoneroTxRequest>(block->txs[0]);

  // get / create output request
  shared_ptr<MoneroOutputRequest> outputRequest = txRequest->outputRequest == boost::none ? shared_ptr<MoneroOutputRequest>(new MoneroOutputRequest()) : *txRequest->outputRequest;

  // output request references tx request but not the other way around to avoid circular loop // TODO: could add check within meetsCriterias()
  outputRequest->txRequest = txRequest;
  txRequest->outputRequest = boost::none;

  // return deserialized request
  return outputRequest;
}

shared_ptr<MoneroSendRequest> MoneroUtils::deserializeSendRequest(const string& sendRequestStr) {

  // deserialize send request json to property node
  std::istringstream iss = sendRequestStr.empty() ? std::istringstream() : std::istringstream(sendRequestStr);
  boost::property_tree::ptree node;
  boost::property_tree::read_json(iss, node);

  // convert request property tree to MoneroSendRequest
  shared_ptr<MoneroSendRequest> sendRequest = shared_ptr<MoneroSendRequest>(new MoneroSendRequest());
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("destinations")) {
      boost::property_tree::ptree destinationsNode = it->second;
      for (boost::property_tree::ptree::const_iterator it2 = destinationsNode.begin(); it2 != destinationsNode.end(); ++it2) {
        sendRequest->destinations.push_back(nodeToDestination(it2->second));
      }
    }
    else if (key == string("paymentId")) sendRequest->paymentId = it->second.data();
    else if (key == string("priority")) throw runtime_error("deserializeSendRequest() paymentId not implemented");
    else if (key == string("mixin")) sendRequest->mixin = it->second.get_value<uint32_t>();
    else if (key == string("ringSize")) sendRequest->ringSize = it->second.get_value<uint32_t>();
    else if (key == string("fee")) sendRequest->fee = it->second.get_value<uint64_t>();
    else if (key == string("accountIndex")) sendRequest->accountIndex = it->second.get_value<uint32_t>();
    else if (key == string("subaddressIndices")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) sendRequest->subaddressIndices.push_back(it2->second.get_value<uint32_t>());
    else if (key == string("unlockTime")) sendRequest->unlockTime = it->second.get_value<uint64_t>();
    else if (key == string("canSplit")) sendRequest->canSplit = it->second.get_value<bool>();
    else if (key == string("doNotRelay")) sendRequest->doNotRelay = it->second.get_value<bool>();
    else if (key == string("note")) sendRequest->note = it->second.data();
    else if (key == string("recipientName")) sendRequest->recipientName = it->second.data();
    else if (key == string("belowAmount")) sendRequest->belowAmount = it->second.get_value<uint64_t>();
    else if (key == string("sweepEachSubaddress")) sendRequest->sweepEachSubaddress = it->second.get_value<bool>();
    else if (key == string("keyImage")) sendRequest->keyImage = it->second.data();
  }

  return sendRequest;
}

vector<shared_ptr<MoneroKeyImage>> MoneroUtils::deserializeKeyImages(const string& keyImagesJson) {

  // deserialize json to property node
  std::istringstream iss = keyImagesJson.empty() ? std::istringstream() : std::istringstream(keyImagesJson);
  boost::property_tree::ptree node;
  boost::property_tree::read_json(iss, node);

  // convert property tree to key images
  vector<shared_ptr<MoneroKeyImage>> keyImages;
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("keyImages")) {
      for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) {
        keyImages.push_back(nodeToKeyImage(it2->second));
      }
    }
    else MWARNING("WARNING MoneroWalletJni::deserializeKeyImages() unrecognized key: " << key);
  }
  return keyImages;
}

// TODO: strip newline
string MoneroUtils::serialize(const boost::property_tree::ptree& node) {
  std::stringstream ss;
  boost::property_tree::write_json(ss, node, false);
  return ss.str();
}

boost::property_tree::ptree MoneroUtils::toPropertyTree(const vector<string> strs) {
  boost::property_tree::ptree strsNode;
  for (const auto& str : strs)  {
    boost::property_tree::ptree strNode;
    strNode.put("", str);
    strsNode.push_back(std::make_pair("", strNode));
  }
  return strsNode;
}

boost::property_tree::ptree MoneroUtils::toPropertyTree(const vector<uint32_t> nums) {
  boost::property_tree::ptree numsNode;
  for (const auto& num : nums)  {
    boost::property_tree::ptree numNode;
    numNode.put("", num);
    numsNode.push_back(std::make_pair("", numNode));
  }
  return numsNode;
}
