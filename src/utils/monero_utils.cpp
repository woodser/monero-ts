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
    if (key == string("accountIndex")) transfer->m_account_index = it->second.get_value<uint32_t>();
  }
}

shared_ptr<monero_transfer_query> node_to_transfer_query(const boost::property_tree::ptree& node) {
  shared_ptr<monero_transfer_query> m_transfer_query = make_shared<monero_transfer_query>();
  node_to_transfer(node, m_transfer_query);

  // initialize query from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("isIncoming")) m_transfer_query->m_is_incoming = it->second.get_value<bool>();
    else if (key == string("address")) m_transfer_query->m_address = it->second.data();
    else if (key == string("addresses")) throw runtime_error("addresses not implemented");
    else if (key == string("subaddressIndex")) m_transfer_query->m_subaddress_index = it->second.get_value<uint32_t>();
    else if (key == string("subaddressIndices")) {
      vector<uint32_t> m_subaddress_indices;
      for (const auto& child : it->second) m_subaddress_indices.push_back(child.second.get_value<uint32_t>());
      m_transfer_query->m_subaddress_indices = m_subaddress_indices;
    }
    else if (key == string("destinations")) throw runtime_error("destinations not implemented");
    else if (key == string("hasDestinations")) m_transfer_query->m_has_destinations = it->second.get_value<bool>();
    else if (key == string("txQuery")) throw runtime_error("txQuery not implemented");
  }

  return m_transfer_query;
}

shared_ptr<monero_key_image> node_to_key_image(const boost::property_tree::ptree& node) {

  // initialize key image from node
  shared_ptr<monero_key_image> m_key_image = make_shared<monero_key_image>();
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("hex")) m_key_image->m_hex = it->second.data();
    else if (key == string("signature")) m_key_image->m_signature = it->second.data();
  }

  return m_key_image;
}

void node_to_output(const boost::property_tree::ptree& node, shared_ptr<monero_output> output) {

  // initialize output from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("keyImage")) output->m_key_image = node_to_key_image(it->second);
    else if (key == string("amount")) output->m_amount = it->second.get_value<uint64_t>();
    else if (key == string("index")) output->m_index = it->second.get_value<uint32_t>();
    else if (key == string("ringOutputIndices")) throw runtime_error("node_to_tx() deserialize ringOutputIndices not implemented");
    else if (key == string("stealthPublicKey")) throw runtime_error("node_to_tx() deserialize stealthPublicKey not implemented");
  }
}

void node_to_output_wallet(const boost::property_tree::ptree& node, shared_ptr<monero_output_wallet> output_wallet) {
  node_to_output(node, output_wallet);
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("accountIndex")) output_wallet->m_account_index = it->second.get_value<uint32_t>();
    else if (key == string("subaddressIndex")) output_wallet->m_subaddress_index = it->second.get_value<uint32_t>();
    else if (key == string("isSpent")) output_wallet->m_is_spent = it->second.get_value<bool>();
    else if (key == string("isUnlocked")) output_wallet->m_is_unlocked = it->second.get_value<bool>();
    else if (key == string("isFrozen")) output_wallet->m_is_frozen = it->second.get_value<bool>();
  }
}

shared_ptr<monero_output_query> node_to_output_query(const boost::property_tree::ptree& node) {
  shared_ptr<monero_output_query> m_output_query = make_shared<monero_output_query>();
  node_to_output_wallet(node, m_output_query);

  // initialize query from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("subaddressIndices")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) m_output_query->m_subaddress_indices.push_back(it2->second.get_value<uint32_t>());
    else if (key == string("txQuery")) {} // ignored
  }

  return m_output_query;
}

void node_to_tx(const boost::property_tree::ptree& node, shared_ptr<monero_tx> tx) {

  // initialize tx from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("id")) tx->m_id = it->second.data();
    else if (key == string("version")) throw runtime_error("version deserializationn not implemented");
    else if (key == string("isMinerTx")) tx->m_is_miner_tx = it->second.get_value<bool>();
    else if (key == string("paymentId")) throw runtime_error("paymentId deserializationn not implemented");
    else if (key == string("fee")) tx->m_fee = it->second.get_value<uint64_t>();
    else if (key == string("mixin")) throw runtime_error("mixin deserialization not implemented");
    else if (key == string("doNotRelay")) tx->m_do_not_relay = it->second.get_value<bool>();
    else if (key == string("isRelayed")) tx->m_is_relayed = it->second.get_value<bool>();
    else if (key == string("isConfirmed")) tx->m_is_confirmed = it->second.get_value<bool>();
    else if (key == string("inTxPool")) tx->m_in_tx_pool = it->second.get_value<bool>();
    else if (key == string("numConfirmations")) tx->m_num_confirmations = it->second.get_value<uint64_t>();
    else if (key == string("unlockTime")) tx->m_unlock_time = it->second.get_value<uint64_t>();
    else if (key == string("lastRelayedTimestamp")) tx->m_last_relayed_timestamp = it->second.get_value<uint64_t>();
    else if (key == string("receivedTimestamp")) tx->m_received_timestamp = it->second.get_value<uint64_t>();
    else if (key == string("isDoubleSpendSeen")) tx->m_is_double_spend_seen = it->second.get_value<bool>();
    else if (key == string("key")) tx->m_key = it->second.data();
    else if (key == string("fullHex")) tx->m_full_hex = it->second.data();
    else if (key == string("prunedHex")) tx->m_pruned_hex = it->second.data();
    else if (key == string("prunableHex")) tx->m_prunable_hex = it->second.data();
    else if (key == string("prunableHash")) tx->m_prunable_hash = it->second.data();
    else if (key == string("size")) throw runtime_error("size deserialization not implemented");
    else if (key == string("weight")) throw runtime_error("weight deserialization not implemented");
    else if (key == string("vins")) throw runtime_error("vins deserializationn not implemented");
    else if (key == string("vouts")) throw runtime_error("vouts deserializationn not implemented");
    else if (key == string("outputIndices")) throw runtime_error("m_output_indices deserialization not implemented");
    else if (key == string("metadata")) {
        cout << "Assigning metadata" << endl;
        tx->m_metadata = it->second.data();
        cout << "DONE ASSIGNING METADATA!" << endl;
        //throw runtime_error("metadata deserialization not implemented");
    }
    else if (key == string("commonTxSets")) throw runtime_error("commonTxSets deserialization not implemented");
    else if (key == string("extra")) throw runtime_error("extra deserialization not implemented");
    else if (key == string("rctSignatures")) throw runtime_error("rctSignatures deserialization not implemented");
    else if (key == string("rctSigPrunable")) throw runtime_error("rctSigPrunable deserialization not implemented");
    else if (key == string("isKeptByBlock")) tx->m_is_kept_by_block = it->second.get_value<bool>();
    else if (key == string("isFailed")) tx->m_is_failed = it->second.get_value<bool>();
    else if (key == string("lastFailedHeight")) throw runtime_error("lastFailedHeight deserialization not implemented");
    else if (key == string("lastFailedId")) tx->m_last_failed_id = it->second.data();
    else if (key == string("maxUsedBlockHeight")) throw runtime_error("maxUsedBlockHeight deserialization not implemented");
    else if (key == string("maxUsedBlockId")) tx->m_max_used_block_id = it->second.data();
    else if (key == string("signatures")) throw runtime_error("signatures deserialization not implemented");
  }
}

// TODO: fill this out
void node_to_tx_wallet(const boost::property_tree::ptree& node, shared_ptr<monero_tx_wallet> tx_wallet) {
  node_to_tx(node, tx_wallet);

  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    //if (key == string("id")) tx->m_id = it->second.data();
    if (key == string("isUnlocked")) tx_wallet->m_is_unlocked = it->second.get_value<bool>();
    // TODO: deserialize other fields
  }
}

shared_ptr<monero_tx_query> node_to_tx_query(const boost::property_tree::ptree& node) {
  shared_ptr<monero_tx_query> tx_query = make_shared<monero_tx_query>();
  node_to_tx_wallet(node, tx_query);

  // initialize query from node
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("isOutgoing")) tx_query->m_is_outgoing = it->second.get_value<bool>();
    else if (key == string("isIncoming")) tx_query->m_is_incoming = it->second.get_value<bool>();
    else if (key == string("txIds")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) tx_query->m_tx_ids.push_back(it2->second.data());
    else if (key == string("hasPaymentId")) tx_query->m_has_payment_id = it->second.get_value<bool>();
    else if (key == string("paymentIds")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) tx_query->m_payment_ids.push_back(it2->second.data());
    else if (key == string("height")) tx_query->m_height = it->second.get_value<uint64_t>();
    else if (key == string("minHeight")) tx_query->m_min_height = it->second.get_value<uint64_t>();
    else if (key == string("maxHeight")) tx_query->m_max_height = it->second.get_value<uint64_t>();
    else if (key == string("includeOutputs")) tx_query->m_include_outputs = it->second.get_value<bool>();
    else if (key == string("transferQuery")) tx_query->m_transfer_query = node_to_transfer_query(it->second);
    else if (key == string("outputQuery")) tx_query->m_output_query = node_to_output_query(it->second);
  }

  return tx_query;
}

shared_ptr<monero_block> node_to_block_query(const boost::property_tree::ptree& node) {
  shared_ptr<monero_block> block = make_shared<monero_block>();
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("txs")) {
      boost::property_tree::ptree txs_node = it->second;
      for (boost::property_tree::ptree::const_iterator it2 = txs_node.begin(); it2 != txs_node.end(); ++it2) {
        block->m_txs.push_back(node_to_tx_query(it2->second));
      }
    }
  }
  return block;
}

shared_ptr<monero_destination> node_to_destination(const boost::property_tree::ptree& node) {
  shared_ptr<monero_destination> destination = make_shared<monero_destination>();
  for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
    string key = it->first;
    if (key == string("address")) destination->m_address = it->second.data();
    else if (key == string("amount")) destination->m_amount = it->second.get_value<uint64_t>();
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
    boost::property_tree::ptree txs_node;
    for (int txIdx = 0; txIdx < resp_struct.blocks[blockIdx].txs.size(); txIdx++) {
      cryptonote::transaction tx;
      if (cryptonote::parse_and_validate_tx_from_blob(resp_struct.blocks[blockIdx].txs[txIdx].blob, tx)) {

        // add tx node to txs node
        boost::property_tree::ptree txNode;
        MTRACE("PRUNED:\n" << monero_utils::get_pruned_tx_json(tx));
        txNode.put("", monero_utils::get_pruned_tx_json(tx));	// TODO: no pretty print
        txs_node.push_back(std::make_pair("", txNode));
      } else {
	      throw std::runtime_error("failed to parse tx blob at index " + std::to_string(txIdx));
      }
    }
    txsNodes.push_back(std::make_pair("", txs_node));	// array of array of transactions, one array per block
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

monero_tx_set monero_utils::deserialize_tx_set(const string& tx_set_str) {
  cout << "monero_utils::deserialize_tx_set(...)" << endl;
  cout << tx_set_str;

  // deserialize tx set to property
  std::istringstream iss = tx_set_str.empty() ? std::istringstream() : std::istringstream(tx_set_str);
  boost::property_tree::ptree tx_set_node;
  boost::property_tree::read_json(iss, tx_set_node);

  // initialize tx_set from property node
  monero_tx_set tx_set;
  for (boost::property_tree::ptree::const_iterator it = tx_set_node.begin(); it != tx_set_node.end(); ++it) {
    string key = it->first;
    if (key == string("unsignedTxHex")) tx_set.m_unsigned_tx_hex = it->second.data();
    else if (key == string("multisigTxHex")) tx_set.m_multisig_tx_hex = it->second.data();
    else if (key == string("txs")) {
      boost::property_tree::ptree txs_node = it->second;
      for (boost::property_tree::ptree::const_iterator it2 = txs_node.begin(); it2 != txs_node.end(); ++it2) {
        shared_ptr<monero_tx_wallet> tx_wallet = make_shared<monero_tx_wallet>();
        node_to_tx_wallet(it2->second, tx_wallet);
        tx_set.m_txs.push_back(tx_wallet);
      }
    }
    else throw runtime_error("monero_utils::deserialize_tx_set() field '" + key + "' not supported");
  }

  return tx_set;
}

shared_ptr<monero_tx_query> monero_utils::deserialize_tx_query(const string& tx_query_str) {

  // deserialize tx query string to property rooted at block
  std::istringstream iss = tx_query_str.empty() ? std::istringstream() : std::istringstream(tx_query_str);
  boost::property_tree::ptree block_node;
  boost::property_tree::read_json(iss, block_node);

  // convert query property tree to block
  shared_ptr<monero_block> block = node_to_block_query(block_node);

  // get tx query
  shared_ptr<monero_tx_query> tx_query = static_pointer_cast<monero_tx_query>(block->m_txs[0]);

  // return deserialized query
  return tx_query;
}

shared_ptr<monero_transfer_query> monero_utils::deserialize_transfer_query(const string& transfer_query_str) {

  // deserialize transfer query string to property rooted at block
  std::istringstream iss = transfer_query_str.empty() ? std::istringstream() : std::istringstream(transfer_query_str);
  boost::property_tree::ptree blockNode;
  boost::property_tree::read_json(iss, blockNode);

  // convert query property tree to block
  shared_ptr<monero_block> block = node_to_block_query(blockNode);

  // return empty query if no txs
  if (block->m_txs.empty()) return make_shared<monero_transfer_query>();

  // get tx query
  shared_ptr<monero_tx_query> tx_query = static_pointer_cast<monero_tx_query>(block->m_txs[0]);

  // get / create transfer query
  shared_ptr<monero_transfer_query> transfer_query = tx_query->m_transfer_query == boost::none ? make_shared<monero_transfer_query>() : *tx_query->m_transfer_query;

  // transfer query references tx query but not the other way around to avoid circular loop // TODO: could add check within meetsCriterias()
  transfer_query->m_tx_query = tx_query;
  tx_query->m_transfer_query = boost::none;

  // return deserialized query
  return transfer_query;
}

shared_ptr<monero_output_query> monero_utils::deserialize_output_query(const string& output_query_str) {

  // deserialize output query string to property rooted at block
  std::istringstream iss = output_query_str.empty() ? std::istringstream() : std::istringstream(output_query_str);
  boost::property_tree::ptree blockNode;
  boost::property_tree::read_json(iss, blockNode);

  // convert query property tree to block
  shared_ptr<monero_block> block = node_to_block_query(blockNode);

  // empty query if no txs
  if (block->m_txs.empty()) return make_shared<monero_output_query>();

  // get tx query
  shared_ptr<monero_tx_query> tx_query = static_pointer_cast<monero_tx_query>(block->m_txs[0]);

  // get / create output query
  shared_ptr<monero_output_query> output_query = tx_query->m_output_query == boost::none ? make_shared<monero_output_query>() : *tx_query->m_output_query;

  // output query references tx query but not the other way around to avoid circular loop // TODO: could add check within meetsCriterias(), TODO: move this temp hack to the caller
  output_query->m_tx_query = tx_query;
  tx_query->m_output_query = boost::none;

  // return deserialized query
  return output_query;
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
        send_request->m_destinations.push_back(node_to_destination(it2->second));
      }
    }
    else if (key == string("paymentId")) send_request->m_payment_id = it->second.data();
    else if (key == string("priority")) throw runtime_error("deserialize_send_request() priority not implemented");
    else if (key == string("mixin")) send_request->m_mixin = it->second.get_value<uint32_t>();
    else if (key == string("ringSize")) send_request->m_ring_size = it->second.get_value<uint32_t>();
    else if (key == string("fee")) send_request->m_fee = it->second.get_value<uint64_t>();
    else if (key == string("accountIndex")) send_request->m_account_index = it->second.get_value<uint32_t>();
    else if (key == string("subaddressIndices")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) send_request->m_subaddress_indices.push_back(it2->second.get_value<uint32_t>());
    else if (key == string("unlockTime")) send_request->m_unlock_time = it->second.get_value<uint64_t>();
    else if (key == string("canSplit")) send_request->m_can_split = it->second.get_value<bool>();
    else if (key == string("doNotRelay")) send_request->m_do_not_relay = it->second.get_value<bool>();
    else if (key == string("note")) send_request->m_note = it->second.data();
    else if (key == string("recipientName")) send_request->m_recipient_name = it->second.data();
    else if (key == string("belowAmount")) send_request->m_below_amount = it->second.get_value<uint64_t>();
    else if (key == string("sweepEachSubaddress")) send_request->m_sweep_each_subaddress = it->second.get_value<bool>();
    else if (key == string("keyImage")) send_request->m_key_image = it->second.data();
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
    if (key == string("keyImages")) {
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
  block->m_major_version = cn_block.major_version;
  block->m_minor_version = cn_block.minor_version;
  block->m_timestamp = cn_block.timestamp;
  block->m_prev_id = epee::string_tools::pod_to_hex(cn_block.prev_id);
  block->m_nonce = cn_block.nonce;
  block->m_miner_tx = monero_utils::cn_tx_to_tx(cn_block.miner_tx);
  for (const crypto::hash& tx_hash : cn_block.tx_hashes) {
    block->m_tx_ids.push_back(epee::string_tools::pod_to_hex(tx_hash));
  }
  return block;
}

shared_ptr<monero_tx> monero_utils::cn_tx_to_tx(const cryptonote::transaction& cn_tx, bool init_as_tx_wallet) {
  shared_ptr<monero_tx> tx = init_as_tx_wallet ? make_shared<monero_tx_wallet>() : make_shared<monero_tx>();
  tx->m_version = cn_tx.version;
  tx->m_unlock_time = cn_tx.unlock_time;
  tx->m_id = epee::string_tools::pod_to_hex(cn_tx.hash);
  tx->m_extra = cn_tx.extra;

  // init vins
  for (const txin_v& cnVin : cn_tx.vin) {
    if (cnVin.which() != 0 && cnVin.which() != 3) throw runtime_error("Unsupported variant type");
    if (tx->m_is_miner_tx == boost::none) tx->m_is_miner_tx = cnVin.which() == 0;
    if (cnVin.which() != 3) continue; // only process txin_to_key of variant  TODO: support other types, like 0 "gen" which is miner tx?
    shared_ptr<monero_output> vin = init_as_tx_wallet ? make_shared<monero_output_wallet>() : make_shared<monero_output>();
    vin->m_tx = tx;
    tx->m_vins.push_back(vin);
    const txin_to_key& txin = boost::get<txin_to_key>(cnVin);
    vin->m_amount = txin.amount;
    vin->m_ring_output_indices = txin.key_offsets;
    crypto::key_image cnKeyImage = txin.k_image;
    vin->m_key_image = make_shared<monero_key_image>();
    vin->m_key_image.get()->m_hex = epee::string_tools::pod_to_hex(cnKeyImage);
  }

  // init vouts
  for (const tx_out& cnVout : cn_tx.vout) {
    shared_ptr<monero_output> vout = init_as_tx_wallet ? make_shared<monero_output_wallet>() : make_shared<monero_output>();
    vout->m_tx = tx;
    tx->m_vouts.push_back(vout);
    vout->m_amount = cnVout.amount;
    const crypto::public_key& cnStealthPublicKey = boost::get<txout_to_key>(cnVout.target).key;
    vout->m_stealth_public_key = epee::string_tools::pod_to_hex(cnStealthPublicKey);
  }

  return tx;

  // TODO: finish this, cryptonote::transaction has:
//  std::vector<std::vector<crypto::signature> > m_signatures;
//  rct::rctSig m_rct_signatures;
//  mutable size_t blob_size;
}
