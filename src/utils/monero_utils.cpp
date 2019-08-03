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

#include "monero_utils.h"
#include "rpc/core_rpc_server_commands_defs.h"
#include "storages/portable_storage_template_helper.h"
#include "cryptonote_basic/cryptonote_format_utils.h"

using namespace std;
using namespace cryptonote;
using namespace monero_utils;

// ------------------------------- INNER HELPERS ------------------------------

void node_to_transfer(const boost::property_tree::ptree& node, shared_ptr<monero_transfer> transfer) {

  // initialize transfer from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("account_index")) transfer->account_index = it->second.get_value<uint32_t>();
  }
}

shared_ptr<monero_transfer_request> node_to_transfer_request(const boost::property_tree::ptree& node) {
  shared_ptr<monero_transfer_request> transfer_request = make_shared<monero_transfer_request>();
  node_to_transfer(node, transfer_request);

  // initialize request from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("is_incoming")) transfer_request->is_incoming = it->second.get_value<bool>();
    else if (key == string("address")) transfer_request->address = it->second.data();
    else if (key == string("addresses")) throw runtime_error("addresses not implemented");
    else if (key == string("subaddress_index")) transfer_request->subaddress_index = it->second.get_value<uint32_t>();
    else if (key == string("subaddress_indices")) {
      vector<uint32_t> subaddress_indices;
      for (const auto& child : it->second) subaddress_indices.push_back(child.second.get_value<uint32_t>());
      transfer_request->subaddress_indices = subaddress_indices;
    }
    else if (key == string("destinations")) throw runtime_error("destinations not implemented");
    else if (key == string("has_destinations")) transfer_request->has_destinations = it->second.get_value<bool>();
    else if (key == string("tx_request")) throw runtime_error("tx_request not implemented");
  }

  return transfer_request;
}

shared_ptr<monero_key_image> node_to_key_image(const boost::property_tree::ptree& node) {

  // initialize key image from node
  shared_ptr<monero_key_image> key_image = make_shared<monero_key_image>();
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("hex")) key_image->hex = it->second.data();
    else if (key == string("signature")) key_image->signature = it->second.data();
  }

  return key_image;
}

void node_to_output(const boost::property_tree::ptree& node, shared_ptr<monero_output> output) {

  // initialize output from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("key_image")) output->key_image = node_to_key_image(it->second);
    else if (key == string("amount")) output->amount = it->second.get_value<uint64_t>();
    else if (key == string("index")) output->index = it->second.get_value<uint32_t>();
    else if (key == string("ring_output_indices")) throw runtime_error("node_to_tx() deserialize ring_output_indices not implemented");
    else if (key == string("stealth_public_key")) throw runtime_error("node_to_tx() deserialize stealth_public_key not implemented");
  }
}

void node_to_output_wallet(const boost::property_tree::ptree& node, shared_ptr<monero_output_wallet> output_wallet) {
  node_to_output(node, output_wallet);
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("account_index")) output_wallet->account_index = it->second.get_value<uint32_t>();
    else if (key == string("subaddress_index")) output_wallet->subaddress_index = it->second.get_value<uint32_t>();
    else if (key == string("is_spent")) output_wallet->is_spent = it->second.get_value<bool>();
    else if (key == string("is_unlocked")) output_wallet->is_unlocked = it->second.get_value<bool>();
    else if (key == string("is_frozen")) output_wallet->is_frozen = it->second.get_value<bool>();
  }
}

shared_ptr<monero_output_request> node_to_output_request(const boost::property_tree::ptree& node) {
  shared_ptr<monero_output_request> output_request = make_shared<monero_output_request>();
  node_to_output_wallet(node, output_request);

  // initialize request from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("subaddress_indices")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) output_request->subaddress_indices.push_back(it2->second.get_value<uint32_t>());
    else if (key == string("tx_request")) {} // ignored
  }

  return output_request;
}

void node_to_tx(const boost::property_tree::ptree& node, shared_ptr<monero_tx> tx) {

  // initialize tx from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("id")) tx->id = it->second.data();
    else if (key == string("version")) throw runtime_error("version deserializationn not implemented");
    else if (key == string("is_miner_tx")) tx->is_miner_tx = it->second.get_value<bool>();
    else if (key == string("payment_id")) throw runtime_error("payment_id deserializationn not implemented");
    else if (key == string("fee")) throw runtime_error("fee deserialization not implemented");
    else if (key == string("mixin")) throw runtime_error("mixin deserialization not implemented");
    else if (key == string("do_not_relay")) tx->do_not_relay = it->second.get_value<bool>();
    else if (key == string("is_relayed")) tx->is_relayed = it->second.get_value<bool>();
    else if (key == string("is_confirmed")) tx->is_confirmed = it->second.get_value<bool>();
    else if (key == string("in_tx_pool")) tx->in_tx_pool = it->second.get_value<bool>();
    else if (key == string("num_confirmations")) throw runtime_error("num_confirmations deserialization not implemented");
    else if (key == string("unlock_time")) throw runtime_error("unlock_time deserialization not implemented");
    else if (key == string("last_relayed_timestamp")) throw runtime_error("last_relayed_timestamp deserialization not implemented");
    else if (key == string("received_timestamp")) throw runtime_error("received_timestamp deserializationn not implemented");
    else if (key == string("is_double_spend_seen")) tx->is_double_spend_seen = it->second.get_value<bool>();
    else if (key == string("key")) tx->key = it->second.data();
    else if (key == string("full_hex")) tx->full_hex = it->second.data();
    else if (key == string("pruned_hex")) tx->pruned_hex = it->second.data();
    else if (key == string("prunable_hex")) tx->prunable_hex = it->second.data();
    else if (key == string("prunable_hash")) tx->prunable_hash = it->second.data();
    else if (key == string("size")) throw runtime_error("size deserialization not implemented");
    else if (key == string("weight")) throw runtime_error("weight deserialization not implemented");
    else if (key == string("vins")) throw runtime_error("vins deserializationn not implemented");
    else if (key == string("vouts")) throw runtime_error("vouts deserializationn not implemented");
    else if (key == string("m_output_indices")) throw runtime_error("m_output_indices deserialization not implemented");
    else if (key == string("metadata")) throw runtime_error("metadata deserialization not implemented");
    else if (key == string("common_tx_sets")) throw runtime_error("common_tx_sets deserialization not implemented");
    else if (key == string("extra")) throw runtime_error("extra deserialization not implemented");
    else if (key == string("rct_signatures")) throw runtime_error("rct_signatures deserialization not implemented");
    else if (key == string("rct_sig_prunable")) throw runtime_error("rct_sig_prunable deserialization not implemented");
    else if (key == string("is_kept_by_block")) tx->is_kept_by_block = it->second.get_value<bool>();
    else if (key == string("is_failed")) tx->is_failed = it->second.get_value<bool>();
    else if (key == string("last_failed_height")) throw runtime_error("last_failed_height deserialization not implemented");
    else if (key == string("last_failed_id")) tx->last_failed_id = it->second.data();
    else if (key == string("max_used_block_height")) throw runtime_error("max_used_block_height deserialization not implemented");
    else if (key == string("max_used_block_id")) tx->max_used_block_id = it->second.data();
    else if (key == string("signatures")) throw runtime_error("signatures deserialization not implemented");
  }
}

// TODO: fill this out
void node_to_tx_wallet(const boost::property_tree::ptree& node, shared_ptr<monero_tx_wallet> tx_wallet) {
  node_to_tx(node, tx_wallet);

  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    //if (key == string("id")) tx->id = it->second.data();
  }
}

shared_ptr<monero_tx_request> nodeToTxRequest(const boost::property_tree::ptree& node) {
  shared_ptr<monero_tx_request> tx_request = make_shared<monero_tx_request>();
  node_to_tx_wallet(node, tx_request);

  // initialize request from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("is_outgoing")) tx_request->is_outgoing = it->second.get_value<bool>();
    else if (key == string("is_incoming")) tx_request->is_incoming = it->second.get_value<bool>();
    else if (key == string("tx_ids")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) tx_request->tx_ids.push_back(it2->second.data());
    else if (key == string("has_payment_id")) tx_request->has_payment_id = it->second.get_value<bool>();
    else if (key == string("payment_ids")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) tx_request->payment_ids.push_back(it2->second.data());
    else if (key == string("height")) tx_request->height = it->second.get_value<uint64_t>();
    else if (key == string("min_height")) tx_request->min_height = it->second.get_value<uint64_t>();
    else if (key == string("max_height")) tx_request->max_height = it->second.get_value<uint64_t>();
    else if (key == string("include_outputs")) tx_request->include_outputs = it->second.get_value<bool>();
    else if (key == string("transfer_request")) tx_request->transfer_request = node_to_transfer_request(it->second);
    else if (key == string("output_request")) tx_request->output_request = node_to_output_request(it->second);
  }

  return tx_request;
}

shared_ptr<monero_block> node_to_block_request(const boost::property_tree::ptree& node) {
  shared_ptr<monero_block> block = make_shared<monero_block>();
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("txs")) {
      boost::property_tree::ptree txsNode = it->second;
      for (boost::property_tree::ptree::const_iterator it2 = txsNode.begin(); it2 != txsNode.end(); ++it2) {
        block->txs.push_back(nodeToTxRequest(it2->second));
      }
    }
  }
  return block;
}

shared_ptr<monero_destination> node_to_destination(const boost::property_tree::ptree& node) {
  shared_ptr<monero_destination> destination = make_shared<monero_destination>();
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("address")) destination->address = it->second.data();
    else if (key == string("amount")) destination->amount = it->second.get_value<uint64_t>();
  }
  return destination;
}

// ------------------------- PUBLIC STATIC UTILITIES --------------------------

void monero_utils::json_to_binary(const std::string &json, std::string &bin) {
  epee::serialization::portable_storage ps;
  ps.load_from_json(json);
  ps.store_to_binary(bin);
}

void monero_utils::binary_to_json(const std::string &bin, std::string &json) {
  epee::serialization::portable_storage ps;
  ps.load_from_binary(bin);
  ps.dump_as_json(json);
}

void monero_utils::binary_blocks_to_json(const std::string &bin, std::string &json) {

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
        MTRACE("PRUNED:\n" << monero_utils::get_pruned_tx_json(tx));
        txNode.put("", monero_utils::get_pruned_tx_json(tx));	// TODO: no pretty print
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

shared_ptr<monero_tx_request> monero_utils::deserialize_tx_request(const string& txRequestStr) {

  // deserialize tx request string to property rooted at block
  std::istringstream iss = txRequestStr.empty() ? std::istringstream() : std::istringstream(txRequestStr);
  boost::property_tree::ptree blockNode;
  boost::property_tree::read_json(iss, blockNode);

  // convert request property tree to block
  shared_ptr<monero_block> block = node_to_block_request(blockNode);

  // get tx request
  shared_ptr<monero_tx_request> tx_request = static_pointer_cast<monero_tx_request>(block->txs[0]);

  // return deserialized request
  return tx_request;
}

shared_ptr<monero_transfer_request> monero_utils::deserialize_transfer_request(const string& transfer_request_str) {

  // deserialize transfer request string to property rooted at block
  std::istringstream iss = transfer_request_str.empty() ? std::istringstream() : std::istringstream(transfer_request_str);
  boost::property_tree::ptree blockNode;
  boost::property_tree::read_json(iss, blockNode);

  // convert request property tree to block
  shared_ptr<monero_block> block = node_to_block_request(blockNode);

  // return mpty request if no txs
  if (block->txs.empty()) return make_shared<monero_transfer_request>();

  // get tx request
  shared_ptr<monero_tx_request> tx_request = static_pointer_cast<monero_tx_request>(block->txs[0]);

  // get / create transfer request
  shared_ptr<monero_transfer_request> transfer_request = tx_request->transfer_request == boost::none ? make_shared<monero_transfer_request>() : *tx_request->transfer_request;

  // transfer request references tx request but not the other way around to avoid circular loop // TODO: could add check within meetsCriterias()
  transfer_request->tx_request = tx_request;
  tx_request->transfer_request = boost::none;

  // return deserialized request
  return transfer_request;
}

shared_ptr<monero_output_request> monero_utils::deserialize_output_request(const string& output_request_str) {

  // deserialize output request string to property rooted at block
  std::istringstream iss = output_request_str.empty() ? std::istringstream() : std::istringstream(output_request_str);
  boost::property_tree::ptree blockNode;
  boost::property_tree::read_json(iss, blockNode);

  // convert request property tree to block
  shared_ptr<monero_block> block = node_to_block_request(blockNode);

  // empty request if no txs
  if (block->txs.empty()) return make_shared<monero_output_request>();

  // get tx request
  shared_ptr<monero_tx_request> tx_request = static_pointer_cast<monero_tx_request>(block->txs[0]);

  // get / create output request
  shared_ptr<monero_output_request> output_request = tx_request->output_request == boost::none ? make_shared<monero_output_request>() : *tx_request->output_request;

  // output request references tx request but not the other way around to avoid circular loop // TODO: could add check within meetsCriterias()
  output_request->tx_request = tx_request;
  tx_request->output_request = boost::none;

  // return deserialized request
  return output_request;
}

shared_ptr<monero_send_request> monero_utils::deserialize_send_request(const string& send_request_str) {

  // deserialize send request json to property node
  std::istringstream iss = send_request_str.empty() ? std::istringstream() : std::istringstream(send_request_str);
  boost::property_tree::ptree node;
  boost::property_tree::read_json(iss, node);

  // convert request property tree to monero_send_request
  shared_ptr<monero_send_request> send_request = make_shared<monero_send_request>();
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("destinations")) {
      boost::property_tree::ptree destinationsNode = it->second;
      for (boost::property_tree::ptree::const_iterator it2 = destinationsNode.begin(); it2 != destinationsNode.end(); ++it2) {
        send_request->destinations.push_back(node_to_destination(it2->second));
      }
    }
    else if (key == string("payment_id")) send_request->payment_id = it->second.data();
    else if (key == string("priority")) throw runtime_error("deserialize_send_request() payment_id not implemented");
    else if (key == string("mixin")) send_request->mixin = it->second.get_value<uint32_t>();
    else if (key == string("ring_size")) send_request->ring_size = it->second.get_value<uint32_t>();
    else if (key == string("fee")) send_request->fee = it->second.get_value<uint64_t>();
    else if (key == string("account_index")) send_request->account_index = it->second.get_value<uint32_t>();
    else if (key == string("subaddress_indices")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) send_request->subaddress_indices.push_back(it2->second.get_value<uint32_t>());
    else if (key == string("unlock_time")) send_request->unlock_time = it->second.get_value<uint64_t>();
    else if (key == string("can_split")) send_request->can_split = it->second.get_value<bool>();
    else if (key == string("do_not_relay")) send_request->do_not_relay = it->second.get_value<bool>();
    else if (key == string("note")) send_request->note = it->second.data();
    else if (key == string("recipient_name")) send_request->recipient_name = it->second.data();
    else if (key == string("below_amount")) send_request->below_amount = it->second.get_value<uint64_t>();
    else if (key == string("sweep_each_subaddress")) send_request->sweep_each_subaddress = it->second.get_value<bool>();
    else if (key == string("key_image")) send_request->key_image = it->second.data();
  }

  return send_request;
}

vector<shared_ptr<monero_key_image>> monero_utils::deserialize_key_images(const string& key_images_json) {

  // deserialize json to property node
  std::istringstream iss = key_images_json.empty() ? std::istringstream() : std::istringstream(key_images_json);
  boost::property_tree::ptree node;
  boost::property_tree::read_json(iss, node);

  // convert property tree to key images
  vector<shared_ptr<monero_key_image>> key_images;
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("key_images")) {
      for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) {
        key_images.push_back(node_to_key_image(it2->second));
      }
    }
    else MWARNING("WARNING MoneroWalletJni::deserialize_key_images() unrecognized key: " << key);
  }
  return key_images;
}

string monero_utils::serialize(const boost::property_tree::ptree& node) {
  std::stringstream ss;
  boost::property_tree::write_json(ss, node, false);
  string str = ss.str();
  return str.substr(0, str.size() - 1); // strip newline
}

boost::property_tree::ptree monero_utils::to_property_tree(const vector<string>& strs) {
  boost::property_tree::ptree strsNode;
  for (const auto& str : strs)  {
    boost::property_tree::ptree strNode;
    strNode.put("", str);
    strsNode.push_back(std::make_pair("", strNode));
  }
  return strsNode;
}

boost::property_tree::ptree monero_utils::to_property_tree(const vector<uint8_t>& nums) {
  boost::property_tree::ptree numsNode;
  for (const auto& num : nums)  {
    boost::property_tree::ptree numNode;
    numNode.put("", num);
    numsNode.push_back(std::make_pair("", numNode));
  }
  return numsNode;
}

// TODO: remove these redundant implementations for different sizes?
boost::property_tree::ptree monero_utils::to_property_tree(const vector<uint32_t>& nums) {
  boost::property_tree::ptree numsNode;
  for (const auto& num : nums)  {
    boost::property_tree::ptree numNode;
    numNode.put("", num);
    numsNode.push_back(std::make_pair("", numNode));
  }
  return numsNode;
}

boost::property_tree::ptree monero_utils::to_property_tree(const vector<uint64_t>& nums) {
  boost::property_tree::ptree numsNode;
  for (const auto& num : nums)  {
    boost::property_tree::ptree numNode;
    numNode.put("", num);
    numsNode.push_back(std::make_pair("", numNode));
  }
  return numsNode;
}

shared_ptr<monero_block> monero_utils::cn_block_to_block(const cryptonote::block& cn_block) {
  cryptonote::block temp = cn_block;
  cout << cryptonote::obj_to_json_str(temp) << endl;
  shared_ptr<monero_block> block = make_shared<monero_block>();
  block->major_version = cn_block.major_version;
  block->minor_version = cn_block.minor_version;
  block->timestamp = cn_block.timestamp;
  block->prev_id = epee::string_tools::pod_to_hex(cn_block.prev_id);
  block->nonce = cn_block.nonce;
  block->miner_tx = monero_utils::cn_tx_to_tx(cn_block.miner_tx);
  for (const crypto::hash& tx_hash : cn_block.tx_hashes) {
    block->tx_ids.push_back(epee::string_tools::pod_to_hex(tx_hash));
  }
  return block;
}

shared_ptr<monero_tx> monero_utils::cn_tx_to_tx(const cryptonote::transaction& cn_tx, bool init_as_tx_wallet) {
  shared_ptr<monero_tx> tx = init_as_tx_wallet ? make_shared<monero_tx_wallet>() : make_shared<monero_tx>();
  tx->version = cn_tx.version;
  tx->unlock_time = cn_tx.unlock_time;
  tx->id = epee::string_tools::pod_to_hex(cn_tx.hash);
  tx->extra = cn_tx.extra;

  // init vins
  for (const txin_v& cnVin : cn_tx.vin) {
    if (cnVin.which() != 0 && cnVin.which() != 3) throw runtime_error("Unsupported variant type");
    if (tx->is_miner_tx == boost::none) tx->is_miner_tx = cnVin.which() == 0;
    if (cnVin.which() != 3) continue; // only process txin_to_key of variant  TODO: support other types, like 0 "gen" which is miner tx?
    shared_ptr<monero_output> vin = init_as_tx_wallet ? make_shared<monero_output_wallet>() : make_shared<monero_output>();
    vin->tx = tx;
    tx->vins.push_back(vin);
    const txin_to_key& txin = boost::get<txin_to_key>(cnVin);
    vin->amount = txin.amount;
    vin->ring_output_indices = txin.key_offsets;
    crypto::key_image cnKeyImage = txin.k_image;
    vin->key_image = make_shared<monero_key_image>();
    vin->key_image.get()->hex = epee::string_tools::pod_to_hex(cnKeyImage);
  }

  // init vouts
  for (const tx_out& cnVout : cn_tx.vout) {
    shared_ptr<monero_output> vout = init_as_tx_wallet ? make_shared<monero_output_wallet>() : make_shared<monero_output>();
    vout->tx = tx;
    tx->vouts.push_back(vout);
    vout->amount = cnVout.amount;
    const crypto::public_key& cnStealthPublicKey = boost::get<txout_to_key>(cnVout.target).key;
    vout->stealth_public_key = epee::string_tools::pod_to_hex(cnStealthPublicKey);
  }

  return tx;

  // TODO: finish this, cryptonote::transaction has:
//  std::vector<std::vector<crypto::signature> > signatures;
//  rct::rctSig rct_signatures;
//  mutable size_t blob_size;
}
