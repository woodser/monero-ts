/**
 * Copyright (c) woodser
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

#include "monero_wallet_model.h"

#include "utils/gen_utils.h"
#include "utils/monero_utils.h"
#include <iostream>

/**
 * Public library interface.
 */
namespace monero {

  // ----------------------- UNDECLARED PRIVATE HELPERS -----------------------

  void merge_incoming_transfer(std::vector<std::shared_ptr<monero_incoming_transfer>>& transfers, const std::shared_ptr<monero_incoming_transfer>& transfer) {
    for (const std::shared_ptr<monero_incoming_transfer>& aTransfer : transfers) {
      if (aTransfer->m_account_index.get() == transfer->m_account_index.get() && aTransfer->m_subaddress_index.get() == transfer->m_subaddress_index.get()) {
        aTransfer->merge(aTransfer, transfer);
        return;
      }
    }
    transfers.push_back(transfer);
  }

  std::shared_ptr<monero_block> node_to_block_query(const boost::property_tree::ptree& node) {
    std::shared_ptr<monero_block> block = std::make_shared<monero_block>();
    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      std::string key = it->first;
      if (key == std::string("txs")) {
        boost::property_tree::ptree txs_node = it->second;
        for (boost::property_tree::ptree::const_iterator it2 = txs_node.begin(); it2 != txs_node.end(); ++it2) {
          std::shared_ptr<monero_tx_query> tx_query = std::make_shared<monero_tx_query>();
          monero_tx_query::from_property_tree(it2->second, tx_query);
          block->m_txs.push_back(tx_query);
          tx_query->m_block = block;
        }
      }
    }
    return block;
  }

  // -------------------------- MONERO SYNC RESULT ----------------------------

  rapidjson::Value monero_sync_result::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    monero_utils::add_json_member("numBlocksFetched", m_num_blocks_fetched, allocator, root, value_num);

    // set bool values
    monero_utils::add_json_member("receivedMoney", m_received_money, allocator, root);

    // return root
    return root;
  }

  // -------------------------- MONERO ACCOUNT -----------------------------

  rapidjson::Value monero_account::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_index != boost::none) monero_utils::add_json_member("index", m_index.get(), allocator, root, value_num);
    if (m_balance != boost::none) monero_utils::add_json_member("balance", m_balance.get(), allocator, root, value_num);
    if (m_unlocked_balance != boost::none) monero_utils::add_json_member("unlockedBalance", m_unlocked_balance.get(), allocator, root, value_num);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_primary_address != boost::none) monero_utils::add_json_member("primaryAddress", m_primary_address.get(), allocator, root, value_str);
    if (m_tag != boost::none) monero_utils::add_json_member("tag", m_tag.get(), allocator, root, value_str);

    // set subaddresses
    if (!m_subaddresses.empty()) root.AddMember("subaddresses", monero_utils::to_rapidjson_val(allocator, m_subaddresses), allocator);

    // return root
    return root;
  }

  // -------------------------- MONERO SUBADDRESS -----------------------------

  rapidjson::Value monero_subaddress::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_account_index != boost::none) monero_utils::add_json_member("accountIndex", m_account_index.get(), allocator, root, value_num);
    if (m_index != boost::none) monero_utils::add_json_member("index", m_index.get(), allocator, root, value_num);
    if (m_balance != boost::none) monero_utils::add_json_member("balance", m_balance.get(), allocator, root, value_num);
    if (m_unlocked_balance != boost::none) monero_utils::add_json_member("unlockedBalance", m_unlocked_balance.get(), allocator, root, value_num);
    if (m_num_unspent_outputs != boost::none) monero_utils::add_json_member("numUnspentOutputs", m_num_unspent_outputs.get(), allocator, root, value_num);
    if (m_num_blocks_to_unlock) monero_utils::add_json_member("numBlocksToUnlock", m_num_blocks_to_unlock.get(), allocator, root, value_num);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_address != boost::none) monero_utils::add_json_member("address", m_address.get(), allocator, root, value_str);
    if (m_label != boost::none) monero_utils::add_json_member("label", m_label.get(), allocator, root, value_str);

    // set bool values
    if (m_is_used != boost::none) monero_utils::add_json_member("isUsed", m_is_used.get(), allocator, root);

    // return root
    return root;
  }

  // --------------------------- MONERO TX WALLET -----------------------------

  rapidjson::Value monero_tx_wallet::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // serialize root from superclass
    rapidjson::Value root = monero_tx::to_rapidjson_val(allocator);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_input_sum != boost::none) monero_utils::add_json_member("inputSum", m_input_sum.get(), allocator, root, value_num);
    if (m_output_sum != boost::none) monero_utils::add_json_member("outputSum", m_output_sum.get(), allocator, root, value_num);
    if (m_change_amount != boost::none) monero_utils::add_json_member("changeAmount", m_change_amount.get(), allocator, root, value_num);
    if (m_num_dummy_outputs != boost::none) monero_utils::add_json_member("numDummyOutputs", m_num_dummy_outputs.get(), allocator, root, value_num);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_note != boost::none) monero_utils::add_json_member("note", m_note.get(), allocator, root, value_str);
    if (m_change_address != boost::none) monero_utils::add_json_member("changeAddress", m_change_address.get(), allocator, root, value_str);
    if (m_extra_hex != boost::none) monero_utils::add_json_member("extraHex", m_extra_hex.get(), allocator, root, value_str);

    // set bool values
    if (m_is_incoming != boost::none) monero_utils::add_json_member("isIncoming", m_is_incoming.get(), allocator, root);
    if (m_is_outgoing != boost::none) monero_utils::add_json_member("isOutgoing", m_is_outgoing.get(), allocator, root);
    if (m_is_locked != boost::none) monero_utils::add_json_member("isLocked", m_is_locked.get(), allocator, root);

    // set sub-arrays
    if (!m_incoming_transfers.empty()) root.AddMember("incomingTransfers", monero_utils::to_rapidjson_val(allocator, m_incoming_transfers), allocator);

    // set sub-objects
    if (m_outgoing_transfer != boost::none) root.AddMember("outgoingTransfer", m_outgoing_transfer.get()->to_rapidjson_val(allocator), allocator);

    // return root
    return root;
  }

  void monero_tx_wallet::from_property_tree(const boost::property_tree::ptree& node, const std::shared_ptr<monero_tx_wallet>& tx_wallet) {
    monero_tx::from_property_tree(node, tx_wallet);

    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      std::string key = it->first;
      //if (key == std::string("hash")) tx->m_hash = it->second.data();
      if (key == std::string("isLocked")) tx_wallet->m_is_locked = it->second.get_value<bool>();
      // TODO: deserialize other fields
    }
  }

  std::shared_ptr<monero_tx_wallet> monero_tx_wallet::copy(const std::shared_ptr<monero_tx>& src, const std::shared_ptr<monero_tx>& tgt) const {
    MTRACE("monero_tx_wallet::copy(const std::shared_ptr<monero_tx>& src, const std::shared_ptr<monero_tx>& tgt)");
    return monero_tx_wallet::copy(std::static_pointer_cast<monero_tx_wallet>(src), std::static_pointer_cast<monero_tx_wallet>(tgt));
  };

  std::shared_ptr<monero_tx_wallet> monero_tx_wallet::copy(const std::shared_ptr<monero_tx_wallet>& src, const std::shared_ptr<monero_tx_wallet>& tgt) const {
    MTRACE("monero_tx_wallet::copy(const std::shared_ptr<monero_tx_wallet>& src, const std::shared_ptr<monero_tx_wallet>& tgt)");
    if (this != src.get()) throw std::runtime_error("this != src");

    // copy base class
    monero_tx::copy(std::static_pointer_cast<monero_tx>(src), std::static_pointer_cast<monero_tx>(tgt));

    // copy wallet extensions
    tgt->m_tx_set = src->m_tx_set;
    tgt->m_is_incoming = src->m_is_incoming;
    tgt->m_is_outgoing = src->m_is_outgoing;
    if (!src->m_incoming_transfers.empty()) {
      tgt->m_incoming_transfers = std::vector<std::shared_ptr<monero_incoming_transfer>>();
      for (const std::shared_ptr<monero_incoming_transfer>& transfer : src->m_incoming_transfers) {
        std::shared_ptr<monero_incoming_transfer> transfer_copy = transfer->copy(transfer, std::make_shared<monero_incoming_transfer>());
        transfer_copy->m_tx = tgt;
        tgt->m_incoming_transfers.push_back(transfer_copy);
      }
    }
    if (src->m_outgoing_transfer != boost::none) {
      std::shared_ptr<monero_outgoing_transfer> transfer_copy = src->m_outgoing_transfer.get()->copy(src->m_outgoing_transfer.get(), std::make_shared<monero_outgoing_transfer>());
      transfer_copy->m_tx = tgt;
      tgt->m_outgoing_transfer = transfer_copy;
    }
    tgt->m_note = src->m_note;
    tgt->m_is_locked = src->m_is_locked;
    tgt->m_input_sum = src->m_input_sum;
    tgt->m_output_sum = src->m_output_sum;
    tgt->m_change_address = src->m_change_address;
    tgt->m_change_amount = src->m_change_amount;
    tgt->m_num_dummy_outputs = src->m_num_dummy_outputs;
    tgt->m_extra_hex = src->m_extra_hex;

    return tgt;
  };

  void monero_tx_wallet::merge(const std::shared_ptr<monero_tx>& self, const std::shared_ptr<monero_tx>& other) {
    merge(std::static_pointer_cast<monero_tx_wallet>(self), std::static_pointer_cast<monero_tx_wallet>(other));
  }

  void monero_tx_wallet::merge(const std::shared_ptr<monero_tx_wallet>& self, const std::shared_ptr<monero_tx_wallet>& other) {
    if (this != self.get()) throw std::runtime_error("this != self");
    if (self == other) return;

    // merge base classes
    monero_tx::merge(self, other);

    // merge incoming transfers
    if (!other->m_incoming_transfers.empty()) {
      for (const std::shared_ptr<monero_incoming_transfer>& transfer : other->m_incoming_transfers) {  // NOTE: not using reference so std::shared_ptr is not deleted when tx is dereferenced
        transfer->m_tx = self;
        merge_incoming_transfer(self->m_incoming_transfers, transfer);
      }
    }

    // merge outgoing transfer
    if (other->m_outgoing_transfer != boost::none) {
      other->m_outgoing_transfer.get()->m_tx = self;
      if (self->m_outgoing_transfer == boost::none) self->m_outgoing_transfer = other->m_outgoing_transfer;
      else self->m_outgoing_transfer.get()->merge(self->m_outgoing_transfer.get(), other->m_outgoing_transfer.get());
    }

    // merge simple extensions
    m_is_incoming = gen_utils::reconcile(m_is_incoming, other->m_is_incoming, "tx wallet m_is_incoming");
    m_is_outgoing = gen_utils::reconcile(m_is_outgoing, other->m_is_outgoing, "tx wallet m_is_outgoing");
    m_note = gen_utils::reconcile(m_note, other->m_note, "tx wallet m_note");
    m_is_locked = gen_utils::reconcile(m_is_locked, other->m_is_locked, boost::none, false, boost::none, "tx wallet m_is_locked");  // tx can become unlocked
    m_input_sum = gen_utils::reconcile(m_input_sum, other->m_input_sum, "tx wallet m_input_sum");
    m_output_sum = gen_utils::reconcile(m_output_sum, other->m_output_sum, "tx wallet m_output_sum");
    m_change_address = gen_utils::reconcile(m_change_address, other->m_change_address, "tx wallet m_change_address");
    m_change_amount = gen_utils::reconcile(m_change_amount, other->m_change_amount, "tx wallet m_change_amount");
    m_num_dummy_outputs = gen_utils::reconcile(m_num_dummy_outputs, other->m_num_dummy_outputs, "tx wallet m_num_dummy_outputs");
    m_extra_hex = gen_utils::reconcile(m_extra_hex, other->m_extra_hex, "tx wallet m_extra_hex");
  }

  std::vector<std::shared_ptr<monero_transfer>> monero_tx_wallet::get_transfers() const {
    monero_transfer_query query;
    return get_transfers(query);
  }

  std::vector<std::shared_ptr<monero_transfer>> monero_tx_wallet::get_transfers(const monero_transfer_query& query) const {
    std::vector<std::shared_ptr<monero_transfer>> transfers;
    if (m_outgoing_transfer != boost::none && query.meets_criteria(m_outgoing_transfer.get().get())) transfers.push_back(m_outgoing_transfer.get());
    for (const std::shared_ptr<monero_transfer>& transfer : m_incoming_transfers) if (query.meets_criteria(transfer.get())) transfers.push_back(transfer);
    return transfers;
  }

  std::vector<std::shared_ptr<monero_transfer>> monero_tx_wallet::filter_transfers(const monero_transfer_query& query) {

    // collect outgoing transfer, erase if excluded
    std::vector<std::shared_ptr<monero_transfer>> transfers;
    if (m_outgoing_transfer != boost::none && query.meets_criteria(m_outgoing_transfer.get().get())) transfers.push_back(m_outgoing_transfer.get());
    else m_outgoing_transfer = boost::none;

    // collect incoming transfers, erase if excluded
    std::vector<std::shared_ptr<monero_incoming_transfer>>::iterator iter = m_incoming_transfers.begin();
    while (iter != m_incoming_transfers.end()) {
      if (query.meets_criteria((*iter).get())) {
        transfers.push_back(*iter);
        iter++;
      } else {
        iter = m_incoming_transfers.erase(iter);
      }
    }
    return transfers;
  }

  std::vector<std::shared_ptr<monero_output_wallet>> monero_tx_wallet::get_outputs_wallet() const {
    monero_output_query query;
    return get_outputs_wallet(query);
  }

  std::vector<std::shared_ptr<monero_output_wallet>> monero_tx_wallet::get_outputs_wallet(const monero_output_query& query) const {
    std::vector<std::shared_ptr<monero_output_wallet>> outputs;
    for (const std::shared_ptr<monero_output>& output : m_outputs) {
      std::shared_ptr<monero_output_wallet> output_wallet = std::dynamic_pointer_cast<monero_output_wallet>(output);
      if (query.meets_criteria(output_wallet.get())) outputs.push_back(output_wallet);
    }
    return outputs;
  }

  std::vector<std::shared_ptr<monero_output_wallet>> monero_tx_wallet::filter_outputs_wallet(const monero_output_query& query) {
    std::vector<std::shared_ptr<monero_output_wallet>> outputs;
    std::vector<std::shared_ptr<monero_output>>::iterator iter = m_outputs.begin();
    while (iter != m_outputs.end()) {
      std::shared_ptr<monero_output_wallet> output_wallet = std::dynamic_pointer_cast<monero_output_wallet>(*iter);
      if (query.meets_criteria(output_wallet.get())) {
        outputs.push_back(output_wallet);
        iter++;
      } else {
        iter = m_outputs.erase(iter);
      }
    }
    return outputs;
  }

  // -------------------------- MONERO TX QUERY -----------------------------

  rapidjson::Value monero_tx_query::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // serialize root from superclass
    rapidjson::Value root = monero_tx_wallet::to_rapidjson_val(allocator);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_height != boost::none) monero_utils::add_json_member("height", m_height.get(), allocator, root, value_num);
    if (m_min_height != boost::none) monero_utils::add_json_member("minHeight", m_min_height.get(), allocator, root, value_num);
    if (m_max_height != boost::none) monero_utils::add_json_member("maxHeight", m_max_height.get(), allocator, root, value_num);

    // set bool values
    if (m_is_outgoing != boost::none) monero_utils::add_json_member("isOutgoing", m_is_outgoing.get(), allocator, root);
    if (m_is_incoming != boost::none) monero_utils::add_json_member("isIncoming", m_is_incoming.get(), allocator, root);
    if (m_has_payment_id != boost::none) monero_utils::add_json_member("hasPaymentId", m_has_payment_id.get(), allocator, root);
    if (m_include_outputs != boost::none) monero_utils::add_json_member("includeOutputs", m_include_outputs.get(), allocator, root);

    // set sub-arrays
    if (!m_hashes.empty()) root.AddMember("hashes", monero_utils::to_rapidjson_val(allocator, m_hashes), allocator);
    if (!m_payment_ids.empty()) root.AddMember("paymentIds", monero_utils::to_rapidjson_val(allocator, m_payment_ids), allocator);

    // set sub-objects
    if (m_transfer_query != boost::none) root.AddMember("transferQuery", m_transfer_query.get()->to_rapidjson_val(allocator), allocator);

    // return root
    return root;
  }

  void monero_tx_query::from_property_tree(const boost::property_tree::ptree& node, const std::shared_ptr<monero_tx_query>& tx_query) {
    monero_tx_wallet::from_property_tree(node, tx_query);

    // initialize query from node
    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      std::string key = it->first;
      if (key == std::string("isOutgoing")) tx_query->m_is_outgoing = it->second.get_value<bool>();
      else if (key == std::string("isIncoming")) tx_query->m_is_incoming = it->second.get_value<bool>();
      else if (key == std::string("hashes")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) tx_query->m_hashes.push_back(it2->second.data());
      else if (key == std::string("hasPaymentId")) tx_query->m_has_payment_id = it->second.get_value<bool>();
      else if (key == std::string("paymentIds")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) tx_query->m_payment_ids.push_back(it2->second.data());
      else if (key == std::string("height")) tx_query->m_height = it->second.get_value<uint64_t>();
      else if (key == std::string("minHeight")) tx_query->m_min_height = it->second.get_value<uint64_t>();
      else if (key == std::string("maxHeight")) tx_query->m_max_height = it->second.get_value<uint64_t>();
      else if (key == std::string("includeOutputs")) tx_query->m_include_outputs = it->second.get_value<bool>();
      else if (key == std::string("transferQuery")) {
        tx_query->m_transfer_query = std::make_shared<monero_transfer_query>();
        monero_transfer_query::from_property_tree(it->second, tx_query->m_transfer_query.get());
        tx_query->m_transfer_query.get()->m_tx_query = tx_query;
      }
      else if (key == std::string("inputQuery")) {
        tx_query->m_input_query = std::make_shared<monero_output_query>();
        monero_output_query::from_property_tree(it->second, tx_query->m_input_query.get());
        tx_query->m_input_query.get()->m_tx_query = tx_query;
      }
      else if (key == std::string("outputQuery")) {
        tx_query->m_output_query = std::make_shared<monero_output_query>();
        monero_output_query::from_property_tree(it->second, tx_query->m_output_query.get());
        tx_query->m_output_query.get()->m_tx_query = tx_query;
      }
    }
  }

  std::shared_ptr<monero_tx_query> monero_tx_query::deserialize_from_block(const std::string& tx_query_json) {

    // deserialize tx query std::string to property rooted at block
    std::istringstream iss = tx_query_json.empty() ? std::istringstream() : std::istringstream(tx_query_json);
    boost::property_tree::ptree block_node;
    boost::property_tree::read_json(iss, block_node);

    // convert query property tree to block
    std::shared_ptr<monero_block> block = node_to_block_query(block_node);

    // get tx query
    std::shared_ptr<monero_tx_query> tx_query = std::static_pointer_cast<monero_tx_query>(block->m_txs[0]);

    // return deserialized query
    return tx_query;
  }

  std::shared_ptr<monero_tx_query> monero_tx_query::copy(const std::shared_ptr<monero_tx>& src, const std::shared_ptr<monero_tx>& tgt) const {
    return copy(std::static_pointer_cast<monero_tx_query>(src), std::static_pointer_cast<monero_tx_query>(tgt));
  };

  std::shared_ptr<monero_tx_query> monero_tx_query::copy(const std::shared_ptr<monero_tx_wallet>& src, const std::shared_ptr<monero_tx_wallet>& tgt) const {
    return copy(std::static_pointer_cast<monero_tx_query>(src), std::static_pointer_cast<monero_tx_query>(tgt));
  };

  std::shared_ptr<monero_tx_query> monero_tx_query::copy(const std::shared_ptr<monero_tx_query>& src, const std::shared_ptr<monero_tx_query>& tgt) const {
    MTRACE("monero_tx_query::copy(const std::shared_ptr<monero_tx_query>& src, const std::shared_ptr<monero_tx_query>& tgt)");
    if (this != src.get()) throw std::runtime_error("this != src");

    // copy base class
    monero_tx_wallet::copy(std::static_pointer_cast<monero_tx>(src), std::static_pointer_cast<monero_tx>(tgt));

    // copy query extensions
    tgt->m_is_outgoing = src->m_is_outgoing;
    tgt->m_is_incoming = src->m_is_incoming;
    if (!src->m_hashes.empty()) tgt->m_hashes = std::vector<std::string>(src->m_hashes);
    tgt-> m_has_payment_id = src->m_has_payment_id;
    if (!src->m_payment_ids.empty()) tgt->m_payment_ids = std::vector<std::string>(src->m_payment_ids);
    tgt->m_height = src->m_height;
    tgt->m_min_height = src->m_min_height;
    tgt->m_max_height = src->m_max_height;
    tgt->m_include_outputs = src->m_include_outputs;
    if (src->m_transfer_query != boost::none) {
      tgt->m_transfer_query = src->m_transfer_query.get()->copy(src->m_transfer_query.get(), std::make_shared<monero_transfer_query>());
      tgt->m_transfer_query.get()->m_tx_query = tgt;
    }
    if (src->m_input_query != boost::none) {
      tgt->m_input_query = src->m_input_query.get()->copy(src->m_input_query.get(), std::make_shared<monero_output_query>());
      tgt->m_input_query.get()->m_tx_query = tgt;
    }
    if (src->m_output_query != boost::none) {
      tgt->m_output_query = src->m_output_query.get()->copy(src->m_output_query.get(), std::make_shared<monero_output_query>());
      tgt->m_output_query.get()->m_tx_query = tgt;
    }
    return tgt;
  };

  bool monero_tx_query::meets_criteria(monero_tx_wallet* tx, bool query_children) const {
    if (tx == nullptr) throw std::runtime_error("nullptr given to monero_tx_query::meets_criteria()");

    // filter on tx
    if (m_hash != boost::none && m_hash != tx->m_hash) return false;
    if (m_payment_id != boost::none && m_payment_id != tx->m_payment_id) return false;
    if (m_is_confirmed != boost::none && m_is_confirmed != tx->m_is_confirmed) return false;
    if (m_in_tx_pool != boost::none && m_in_tx_pool != tx->m_in_tx_pool) return false;
    if (m_relay != boost::none && m_relay != tx->m_relay) return false;
    if (m_is_failed != boost::none && m_is_failed != tx->m_is_failed) return false;
    if (m_is_miner_tx != boost::none && m_is_miner_tx != tx->m_is_miner_tx) return false;
    if (m_is_locked != boost::none && m_is_locked != tx->m_is_locked) return false;

    // filter on having a payment id
    if (m_has_payment_id != boost::none) {
      if (*m_has_payment_id && tx->m_payment_id == boost::none) return false;
      if (!*m_has_payment_id && tx->m_payment_id != boost::none) return false;
    }

    // filter on incoming
    if (m_is_incoming != boost::none && m_is_incoming != tx->m_is_incoming) return false;

    // filter on outgoing
    if (m_is_outgoing != boost::none && m_is_outgoing != tx->m_is_outgoing) return false;

    // filter on remaining fields
    boost::optional<uint64_t> txHeight = tx->get_height();
    if (!m_hashes.empty() && find(m_hashes.begin(), m_hashes.end(), *tx->m_hash) == m_hashes.end()) return false;
    if (!m_payment_ids.empty() && (tx->m_payment_id == boost::none || find(m_payment_ids.begin(), m_payment_ids.end(), *tx->m_payment_id) == m_payment_ids.end())) return false;
    if (m_height != boost::none && (txHeight == boost::none || *txHeight != *m_height)) return false;
    if (m_min_height != boost::none && (txHeight == boost::none || *txHeight < *m_min_height)) return false;
    if (m_max_height != boost::none && (txHeight == boost::none || *txHeight > *m_max_height)) return false;

    // done if not querying transfers or outputs
    if (!query_children) return true;

    // at least one transfer must meet transfer query if defined
    if (m_transfer_query != boost::none) {
      bool match_found = false;
      if (tx->m_outgoing_transfer != boost::none && m_transfer_query.get()->meets_criteria(tx->m_outgoing_transfer.get().get())) match_found = true;
      else if (!tx->m_incoming_transfers.empty()) {
        for (const std::shared_ptr<monero_incoming_transfer>& incoming_transfer : tx->m_incoming_transfers) {
          if (m_transfer_query.get()->meets_criteria(incoming_transfer.get(), false)) {
            match_found = true;
            break;
          }
        }
      }
      if (!match_found) return false;
    }

    // at least one input must meet input query if defined
    if (m_input_query != boost::none) {
      if (tx->m_inputs.empty()) return false;
      bool match_found = false;
      for (const std::shared_ptr<monero_output>& input : tx->m_inputs) {
        std::shared_ptr<monero_output_wallet> vin_wallet = std::static_pointer_cast<monero_output_wallet>(input);
        if (m_input_query.get()->meets_criteria(vin_wallet.get(), false)) {
          match_found = true;
          break;
        }
      }
      if (!match_found) return false;
    }

    // at least one output must meet output query if defined
    if (m_output_query != boost::none) {
      if (tx->m_outputs.empty()) return false;
      bool match_found = false;
      for (const std::shared_ptr<monero_output>& output : tx->m_outputs) {
        std::shared_ptr<monero_output_wallet> vout_wallet = std::static_pointer_cast<monero_output_wallet>(output);
        if (m_output_query.get()->meets_criteria(vout_wallet.get(), false)) {
          match_found = true;
          break;
        }
      }
      if (!match_found) return false;
    }

    // transaction meets query criteria
    return true;
  }

  // -------------------------- MONERO DESTINATION ----------------------------

  rapidjson::Value monero_destination::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_amount != boost::none) monero_utils::add_json_member("amount", m_amount.get(), allocator, root, value_num);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_address != boost::none) monero_utils::add_json_member("address", m_address.get(), allocator, root, value_str);

    // return root
    return root;
  }

  void monero_destination::from_property_tree(const boost::property_tree::ptree& node, const std::shared_ptr<monero_destination>& destination) {
    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      std::string key = it->first;
      if (key == std::string("address")) destination->m_address = it->second.data();
      else if (key == std::string("amount")) destination->m_amount = it->second.get_value<uint64_t>();
    }
  }

  std::shared_ptr<monero_destination> monero_destination::copy(const std::shared_ptr<monero_destination>& src, const std::shared_ptr<monero_destination>& tgt) const {
    MTRACE("monero_destination::copy(const std::shared_ptr<monero_destination>& src, const std::shared_ptr<monero_destination>& tgt)");
    if (this != src.get()) throw std::runtime_error("this != src");
    tgt->m_address = src->m_address;
    tgt->m_amount = src->m_amount;
    return tgt;
  };

  // ----------------------------- MONERO TX SET ------------------------------

  rapidjson::Value monero_tx_set::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_multisig_tx_hex != boost::none) monero_utils::add_json_member("multisigTxHex", m_multisig_tx_hex.get(), allocator, root, value_str);
    if (m_unsigned_tx_hex != boost::none) monero_utils::add_json_member("unsignedTxHex", m_unsigned_tx_hex.get(), allocator, root, value_str);
    if (m_signed_tx_hex != boost::none) monero_utils::add_json_member("signedTxHex", m_signed_tx_hex.get(), allocator, root, value_str);

    // set sub-arrays
    if (!m_txs.empty()) root.AddMember("txs", monero_utils::to_rapidjson_val(allocator, m_txs), allocator);

    // return root
    return root;
  }

  monero_tx_set monero_tx_set::deserialize(const std::string& tx_set_json) {

    // deserialize tx set to property
    std::istringstream iss = tx_set_json.empty() ? std::istringstream() : std::istringstream(tx_set_json);
    boost::property_tree::ptree tx_set_node;
    boost::property_tree::read_json(iss, tx_set_node);

    // initialize tx_set from property node
    monero_tx_set tx_set;
    for (boost::property_tree::ptree::const_iterator it = tx_set_node.begin(); it != tx_set_node.end(); ++it) {
      std::string key = it->first;
      if (key == std::string("unsignedTxHex")) tx_set.m_unsigned_tx_hex = it->second.data();
      else if (key == std::string("multisigTxHex")) tx_set.m_multisig_tx_hex = it->second.data();
      else if (key == std::string("txs")) {
        boost::property_tree::ptree txs_node = it->second;
        for (boost::property_tree::ptree::const_iterator it2 = txs_node.begin(); it2 != txs_node.end(); ++it2) {
          std::shared_ptr<monero_tx_wallet> tx_wallet = std::make_shared<monero_tx_wallet>();
          monero_tx_wallet::from_property_tree(it2->second, tx_wallet);
          tx_set.m_txs.push_back(tx_wallet);
        }
      }
      else throw std::runtime_error("monero_utils::deserialize_tx_set() field '" + key + "' not supported");
    }

    return tx_set;
  }

  // ---------------------------- MONERO TRANSFER -----------------------------

  rapidjson::Value monero_transfer::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_amount != boost::none) monero_utils::add_json_member("amount", m_amount.get(), allocator, root, value_num);
    if (m_account_index != boost::none) monero_utils::add_json_member("accountIndex", m_account_index.get(), allocator, root, value_num);

    // return root
    return root;
  }

  void monero_transfer::from_property_tree(const boost::property_tree::ptree& node, const std::shared_ptr<monero_transfer>& transfer) {

    // initialize transfer from node
    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      std::string key = it->first;
      if (key == std::string("accountIndex")) transfer->m_account_index = it->second.get_value<uint32_t>();
    }
  }

  std::shared_ptr<monero_transfer> monero_transfer::copy(const std::shared_ptr<monero_transfer>& src, const std::shared_ptr<monero_transfer>& tgt) const {
    MTRACE("monero_transfer::copy(const std::shared_ptr<monero_transfer>& src, const std::shared_ptr<monero_transfer>& tgt)");
    tgt->m_tx = src->m_tx;  // reference parent tx by default
    tgt->m_amount = src->m_amount;
    tgt->m_account_index = src->m_account_index;
    return tgt;
  }

  void monero_transfer::merge(const std::shared_ptr<monero_transfer>& self, const std::shared_ptr<monero_transfer>& other) {
    if (this != self.get()) throw std::runtime_error("this != self");
    if (self == other) return;

    // merge txs if they're different which comes back to merging transfers
    if (m_tx != other->m_tx) {
      m_tx->merge(m_tx, other->m_tx);
      return;
    }

    // otherwise merge transfer fields
    m_account_index = gen_utils::reconcile(m_account_index, other->m_account_index, "transfer m_account_index");

    // TODO monero-project: failed tx in pool (after testUpdateLockedDifferentAccounts()) causes non-originating saved wallets to return duplicate incoming transfers but one has amount of 0
    if (m_amount != boost::none && other->m_amount != boost::none && *m_amount != *other->m_amount && (*m_amount == 0 || *other->m_amount == 0)) {
      std::cout << "WARNING: failed tx in pool causes non-originating wallets to return duplicate incoming transfers but with one amount/m_num_suggested_confirmations of 0, using non-zero amount" << std::endl;
      if (*m_amount == 0) m_amount = other->m_amount;
    } else {
      m_amount = gen_utils::reconcile(m_amount, other->m_amount, "transfer amount");
    }
  }

  // ----------------------- MONERO INCOMING TRANSFER -------------------------

  rapidjson::Value monero_incoming_transfer::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // serialize root from superclass
    rapidjson::Value root = monero_transfer::to_rapidjson_val(allocator);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_subaddress_index != boost::none) monero_utils::add_json_member("subaddressIndex", m_subaddress_index.get(), allocator, root, value_num);
    if (m_num_suggested_confirmations != boost::none) monero_utils::add_json_member("numSuggestedConfirmations", m_num_suggested_confirmations.get(), allocator, root, value_num);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_address != boost::none) monero_utils::add_json_member("address", m_address.get(), allocator, root, value_str);

    // return root
    return root;
  }

  std::shared_ptr<monero_incoming_transfer> monero_incoming_transfer::copy(const std::shared_ptr<monero_transfer>& src, const std::shared_ptr<monero_transfer>& tgt) const {
    return copy(std::static_pointer_cast<monero_incoming_transfer>(src), std::static_pointer_cast<monero_incoming_transfer>(tgt));
  }

  std::shared_ptr<monero_incoming_transfer> monero_incoming_transfer::copy(const std::shared_ptr<monero_incoming_transfer>& src, const std::shared_ptr<monero_incoming_transfer>& tgt) const {
    std::cout << "monero_incoming_transfer::copy()" << std::endl;
    throw std::runtime_error("monero_incoming_transfer::copy(inTransfer) not implemented");
  };

  boost::optional<bool> monero_incoming_transfer::is_incoming() const { return true; }

  void monero_incoming_transfer::merge(const std::shared_ptr<monero_transfer>& self, const std::shared_ptr<monero_transfer>& other) {
    merge(std::static_pointer_cast<monero_incoming_transfer>(self), std::static_pointer_cast<monero_incoming_transfer>(other));
  }

  void monero_incoming_transfer::merge(const std::shared_ptr<monero_incoming_transfer>& self, const std::shared_ptr<monero_incoming_transfer>& other) {
    if (self == other) return;
    monero_transfer::merge(self, other);
    m_subaddress_index = gen_utils::reconcile(m_subaddress_index, other->m_subaddress_index, "incoming transfer m_subaddress_index");
    m_address = gen_utils::reconcile(m_address, other->m_address, "incoming transfer m_address");
    m_num_suggested_confirmations = gen_utils::reconcile(m_num_suggested_confirmations, other->m_num_suggested_confirmations, boost::none, boost::none, false, "incoming transfer m_num_suggested_confirmations");
  }

  // ----------------------- MONERO OUTGOING TRANSFER -------------------------

  rapidjson::Value monero_outgoing_transfer::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // serialize root from superclass
    rapidjson::Value root = monero_transfer::to_rapidjson_val(allocator);

    // set sub-arrays
    if (!m_subaddress_indices.empty()) root.AddMember("subaddressIndices", monero_utils::to_rapidjson_val(allocator, m_subaddress_indices), allocator);
    if (!m_addresses.empty()) root.AddMember("addresses", monero_utils::to_rapidjson_val(allocator, m_addresses), allocator);
    if (!m_destinations.empty()) root.AddMember("destinations", monero_utils::to_rapidjson_val(allocator, m_destinations), allocator);

    // return root
    return root;
  }

  std::shared_ptr<monero_outgoing_transfer> monero_outgoing_transfer::copy(const std::shared_ptr<monero_transfer>& src, const std::shared_ptr<monero_transfer>& tgt) const {
    return copy(std::static_pointer_cast<monero_outgoing_transfer>(src), std::static_pointer_cast<monero_outgoing_transfer>(tgt));
  };

  std::shared_ptr<monero_outgoing_transfer> monero_outgoing_transfer::copy(const std::shared_ptr<monero_outgoing_transfer>& src, const std::shared_ptr<monero_outgoing_transfer>& tgt) const {
    std::cout << "monero_outgoing_transfer::copy()" << std::endl;
    throw std::runtime_error("monero_outgoing_transfer::copy(out_transfer) not implemented");
  };

  boost::optional<bool> monero_outgoing_transfer::is_incoming() const { return false; }

  void monero_outgoing_transfer::merge(const std::shared_ptr<monero_transfer>& self, const std::shared_ptr<monero_transfer>& other) {
    merge(std::static_pointer_cast<monero_outgoing_transfer>(self), std::static_pointer_cast<monero_outgoing_transfer>(other));
  }

  void monero_outgoing_transfer::merge(const std::shared_ptr<monero_outgoing_transfer>& self, const std::shared_ptr<monero_outgoing_transfer>& other) {
    if (self == other) return;
    monero_transfer::merge(self, other);
    m_subaddress_indices = gen_utils::reconcile(m_subaddress_indices, other->m_subaddress_indices, "outgoing transfer m_subaddress_indices");
    m_addresses = gen_utils::reconcile(m_addresses, other->m_addresses, "outgoing transfer m_addresses");

    // use destinations if available on one, otherwise check deep equality
    // TODO: java/javascript use reconcile() for deep comparison, but c++ would require specialized equality check for structs with shared pointers, so checking equality here
    if (m_destinations.empty() && !other->m_destinations.empty()) m_destinations = other->m_destinations;
    else if (!m_destinations.empty() && !other->m_destinations.empty()) {
      if (m_destinations.size() != other->m_destinations.size()) throw std::runtime_error("Destination vectors are different sizes");
      for (int i = 0; i < m_destinations.size(); i++) {
        if (m_destinations[i]->m_address.get() != other->m_destinations[i]->m_address.get() ||
            m_destinations[i]->m_amount.get() != other->m_destinations[i]->m_amount.get()) {
          throw std::runtime_error("Destination vectors are different");
        }
      }
    }
  }

  // ----------------------- MONERO TRANSFER QUERY --------------------------

  rapidjson::Value monero_transfer_query::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // serialize root from superclass
    rapidjson::Value root = monero_transfer::to_rapidjson_val(allocator);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_subaddress_index != boost::none) monero_utils::add_json_member("subaddressIndex", m_subaddress_index.get(), allocator, root, value_num);

    // set bool values
    if (m_is_incoming != boost::none) monero_utils::add_json_member("isIncoming", m_is_incoming.get(), allocator, root);
    if (m_has_destinations != boost::none) monero_utils::add_json_member("hasDestinations", m_has_destinations.get(), allocator, root);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_address != boost::none) monero_utils::add_json_member("address", m_address.get(), allocator, root, value_str);

    // set sub-arrays
    if (!m_subaddress_indices.empty()) root.AddMember("subaddressIndices", monero_utils::to_rapidjson_val(allocator, m_subaddress_indices), allocator);
    if (!m_addresses.empty()) root.AddMember("addresses", monero_utils::to_rapidjson_val(allocator, m_addresses), allocator);
    if (!m_destinations.empty()) root.AddMember("destinations", monero_utils::to_rapidjson_val(allocator, m_destinations), allocator);

    // return root
    return root;
  }

  void monero_transfer_query::from_property_tree(const boost::property_tree::ptree& node, const std::shared_ptr<monero_transfer_query>& transfer_query) {
    monero_transfer::from_property_tree(node, transfer_query);

    // initialize query from node
    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      std::string key = it->first;
      if (key == std::string("isIncoming")) transfer_query->m_is_incoming = it->second.get_value<bool>();
      else if (key == std::string("address")) transfer_query->m_address = it->second.data();
      else if (key == std::string("addresses")) throw std::runtime_error("addresses not implemented");
      else if (key == std::string("subaddressIndex")) transfer_query->m_subaddress_index = it->second.get_value<uint32_t>();
      else if (key == std::string("subaddressIndices")) {
        std::vector<uint32_t> m_subaddress_indices;
        for (const auto& child : it->second) m_subaddress_indices.push_back(child.second.get_value<uint32_t>());
        transfer_query->m_subaddress_indices = m_subaddress_indices;
      }
      else if (key == std::string("destinations")) throw std::runtime_error("destinations not implemented");
      else if (key == std::string("hasDestinations")) transfer_query->m_has_destinations = it->second.get_value<bool>();
      else if (key == std::string("txQuery")) throw std::runtime_error("txQuery not implemented");
    }
  }

  std::shared_ptr<monero_transfer_query> monero_transfer_query::deserialize_from_block(const std::string& transfer_query_json) {

    // deserialize transfer query std::string to property rooted at block
    std::istringstream iss = transfer_query_json.empty() ? std::istringstream() : std::istringstream(transfer_query_json);
    boost::property_tree::ptree blockNode;
    boost::property_tree::read_json(iss, blockNode);

    // convert query property tree to block
    std::shared_ptr<monero_block> block = node_to_block_query(blockNode);

    // return empty query if no txs
    if (block->m_txs.empty()) return std::make_shared<monero_transfer_query>();

    // get tx query
    std::shared_ptr<monero_tx_query> tx_query = std::static_pointer_cast<monero_tx_query>(block->m_txs[0]);

    // get / create transfer query
    std::shared_ptr<monero_transfer_query> transfer_query = tx_query->m_transfer_query == boost::none ? std::make_shared<monero_transfer_query>() : *tx_query->m_transfer_query;

    // set transfer query's tx query
    transfer_query->m_tx_query = tx_query;

    // return deserialized query
    return transfer_query;
  }

  std::shared_ptr<monero_transfer_query> monero_transfer_query::copy(const std::shared_ptr<monero_transfer>& src, const std::shared_ptr<monero_transfer>& tgt) const {
    return copy(std::static_pointer_cast<monero_transfer_query>(src), std::static_pointer_cast<monero_transfer>(tgt));
  };

  std::shared_ptr<monero_transfer_query> monero_transfer_query::copy(const std::shared_ptr<monero_transfer_query>& src, const std::shared_ptr<monero_transfer_query>& tgt) const {
    MTRACE("monero_transfer_query::copy(const std::shared_ptr<monero_transfer_query>& src, const std::shared_ptr<monero_transfer_query>& tgt)");
    if (this != src.get()) throw std::runtime_error("this != src");

    // copy base class
    monero_transfer::copy(std::static_pointer_cast<monero_transfer>(src), std::static_pointer_cast<monero_transfer>(tgt));

    // copy extensions
    tgt->m_is_incoming = src->m_is_incoming;
    tgt->m_address = src->m_address;
    if (!src->m_addresses.empty()) tgt->m_addresses = std::vector<std::string>(src->m_addresses);
    tgt->m_subaddress_index = src->m_subaddress_index;
    if (!src->m_subaddress_indices.empty()) tgt->m_subaddress_indices = std::vector<uint32_t>(src->m_subaddress_indices);
    if (!src->m_destinations.empty()) {
      for (const std::shared_ptr<monero_destination>& destination : src->m_destinations) {
        tgt->m_destinations.push_back(destination->copy(destination, std::make_shared<monero_destination>()));
      }
    }
    tgt->m_has_destinations = src->m_has_destinations;
    tgt->m_tx_query = src->m_tx_query;
    return tgt;
  };

  bool monero_transfer_query::meets_criteria(monero_transfer* transfer, bool query_parent) const {
    if (transfer == nullptr) throw std::runtime_error("nullptr given to monero_transfer_query::meets_criteria()");

    // filter on common fields
    if (is_incoming() != boost::none && *is_incoming() != *transfer->is_incoming()) return false;
    if (is_outgoing() != boost::none && *is_outgoing() != *transfer->is_outgoing()) return false;
    if (m_amount != boost::none && *m_amount != *transfer->m_amount) return false;
    if (m_account_index != boost::none && *m_account_index != *transfer->m_account_index) return false;

    // filter on incoming fields
    monero_incoming_transfer* inTransfer = dynamic_cast<monero_incoming_transfer*>(transfer);
    if (inTransfer != nullptr) {
      if (m_has_destinations != boost::none) return false;
      if (m_address != boost::none && *m_address != *inTransfer->m_address) return false;
      if (!m_addresses.empty() && find(m_addresses.begin(), m_addresses.end(), *inTransfer->m_address) == m_addresses.end()) return false;
      if (m_subaddress_index != boost::none && *m_subaddress_index != *inTransfer->m_subaddress_index) return false;
      if (!m_subaddress_indices.empty() && find(m_subaddress_indices.begin(), m_subaddress_indices.end(), *inTransfer->m_subaddress_index) == m_subaddress_indices.end()) return false;
    }

    // filter on outgoing fields
    monero_outgoing_transfer* out_transfer = dynamic_cast<monero_outgoing_transfer*>(transfer);
    if (out_transfer != nullptr) {

      // filter on addresses
      if (m_address != boost::none && (out_transfer->m_addresses.empty() || find(out_transfer->m_addresses.begin(), out_transfer->m_addresses.end(), *m_address) == out_transfer->m_addresses.end())) return false;   // TODO: will filter all transfers if they don't contain addresses
      if (!m_addresses.empty()) {
        bool intersects = false;
        for (const std::string& addressReq : m_addresses) {
          for (const std::string& address : out_transfer->m_addresses) {
            if (addressReq == address) {
              intersects = true;
              break;
            }
          }
        }
        if (!intersects) return false;  // must have overlapping addresses
      }

      // filter on subaddress indices
      if (m_subaddress_index != boost::none && (out_transfer->m_subaddress_indices.empty() || find(out_transfer->m_subaddress_indices.begin(), out_transfer->m_subaddress_indices.end(), *m_subaddress_index) == out_transfer->m_subaddress_indices.end())) return false;   // TODO: will filter all transfers if they don't contain subaddress indices
      if (!m_subaddress_indices.empty()) {
        bool intersects = false;
        for (const uint32_t& subaddressIndexReq : m_subaddress_indices) {
          for (const uint32_t& m_subaddress_index : out_transfer->m_subaddress_indices) {
            if (subaddressIndexReq == m_subaddress_index) {
              intersects = true;
              break;
            }
          }
        }
        if (!intersects) return false;  // must have overlapping subaddress indices
      }

      // filter on having destinations
      if (m_has_destinations != boost::none) {
        if (*m_has_destinations && out_transfer->m_destinations.empty()) return false;
        if (!*m_has_destinations && !out_transfer->m_destinations.empty()) return false;
      }

      // filter on destinations TODO: start with test for this
      //    if (this.getDestionations() != null && this.getDestionations() != transfer.getDestionations()) return false;
    }

    // validate type
    if (inTransfer == nullptr && out_transfer == nullptr) throw std::runtime_error("Transfer must be monero_incoming_transfer or monero_outgoing_transfer");

    // filter with tx query
    if (query_parent && m_tx_query != boost::none && !(*m_tx_query)->meets_criteria(transfer->m_tx.get(), false)) return false;
    return true;
  }

  boost::optional<bool> monero_transfer_query::is_incoming() const { return m_is_incoming; }

  // ------------------------- MONERO OUTPUT WALLET ---------------------------

  rapidjson::Value monero_output_wallet::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // serialize root from superclass
    rapidjson::Value root = monero_output::to_rapidjson_val(allocator);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_account_index != boost::none) monero_utils::add_json_member("accountIndex", m_account_index.get(), allocator, root, value_num);
    if (m_subaddress_index != boost::none) monero_utils::add_json_member("subaddressIndex", m_subaddress_index.get(), allocator, root, value_num);

    // set bool values
    if (m_is_spent != boost::none) monero_utils::add_json_member("isSpent", m_is_spent.get(), allocator, root);
    if (m_is_frozen != boost::none) monero_utils::add_json_member("isFrozen", m_is_frozen.get(), allocator, root);

    // return root
    return root;
  }

  void monero_output_wallet::from_property_tree(const boost::property_tree::ptree& node, const std::shared_ptr<monero_output_wallet>& output_wallet) {
    monero_output::from_property_tree(node, output_wallet);
    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      std::string key = it->first;
      if (key == std::string("accountIndex")) output_wallet->m_account_index = it->second.get_value<uint32_t>();
      else if (key == std::string("subaddressIndex")) output_wallet->m_subaddress_index = it->second.get_value<uint32_t>();
      else if (key == std::string("isSpent")) output_wallet->m_is_spent = it->second.get_value<bool>();
      else if (key == std::string("isFrozen")) output_wallet->m_is_frozen = it->second.get_value<bool>();
    }
  }

  std::shared_ptr<monero_output_wallet> monero_output_wallet::copy(const std::shared_ptr<monero_output>& src, const std::shared_ptr<monero_output>& tgt) const {
    MTRACE("monero_output_wallet::copy(output)");
    return monero_output_wallet::copy(std::static_pointer_cast<monero_output_wallet>(src), std::static_pointer_cast<monero_output_wallet>(tgt));
  };

  std::shared_ptr<monero_output_wallet> monero_output_wallet::copy(const std::shared_ptr<monero_output_wallet>& src, const std::shared_ptr<monero_output_wallet>& tgt) const {
    MTRACE("monero_output_wallet::copy(output_wallet)");
    if (this != src.get()) throw std::runtime_error("this != src");

    // copy base class
    monero_output::copy(std::static_pointer_cast<monero_output>(src), std::static_pointer_cast<monero_output>(tgt));

    // copy extensions
    tgt->m_account_index = src->m_account_index;
    tgt->m_subaddress_index = src->m_subaddress_index;
    tgt->m_is_spent = src->m_is_spent;
    tgt->m_is_frozen = src->m_is_frozen;
    return tgt;
  };

  void monero_output_wallet::merge(const std::shared_ptr<monero_output>& self, const std::shared_ptr<monero_output>& other) {
    merge(std::static_pointer_cast<monero_output_wallet>(self), std::static_pointer_cast<monero_output_wallet>(other));
  }

  void monero_output_wallet::merge(const std::shared_ptr<monero_output_wallet>& self, const std::shared_ptr<monero_output_wallet>& other) {
    MTRACE("monero_output_wallet::merge(self, other)");
    if (this != self.get()) throw std::runtime_error("this != self");
    if (self == other) return;

    // merge base classes
    monero_output::merge(self, other);

    // merge output wallet extensions
    m_account_index = gen_utils::reconcile(m_account_index, other->m_account_index, "output wallet m_account_index");
    m_subaddress_index = gen_utils::reconcile(m_subaddress_index, other->m_subaddress_index, "output wallet m_subaddress_index");
    m_is_spent = gen_utils::reconcile(m_is_spent, other->m_is_spent, "output wallet m_is_spent");
    m_is_frozen = gen_utils::reconcile(m_is_frozen, other->m_is_frozen, "output wallet m_is_frozen");
  }

  // ------------------------ MONERO OUTPUT QUERY ---------------------------

  rapidjson::Value monero_output_query::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // serialize root from superclass
    rapidjson::Value root = monero_output_wallet::to_rapidjson_val(allocator);

    // set sub-arrays
    if (!m_subaddress_indices.empty()) root.AddMember("subaddressIndices", monero_utils::to_rapidjson_val(allocator, m_subaddress_indices), allocator);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_min_amount != boost::none) monero_utils::add_json_member("minAmount", m_min_amount.get(), allocator, root, value_num);
    if (m_max_amount != boost::none) monero_utils::add_json_member("maxAmount", m_max_amount.get(), allocator, root, value_num);

    // return root
    return root;
  }

  void monero_output_query::from_property_tree(const boost::property_tree::ptree& node, const std::shared_ptr<monero_output_query>& output_query) {
    monero_output_wallet::from_property_tree(node, output_query);

    // initialize query from node
    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      std::string key = it->first;
      if (key == std::string("subaddressIndices")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) output_query->m_subaddress_indices.push_back(it2->second.get_value<uint32_t>());
      else if (key == std::string("minAmount")) output_query->m_min_amount = it->second.get_value<uint64_t>();
      else if (key == std::string("maxAmount")) output_query->m_max_amount = it->second.get_value<uint64_t>();
      else if (key == std::string("txQuery")) {} // ignored
    }
  }

  std::shared_ptr<monero_output_query> monero_output_query::deserialize_from_block(const std::string& output_query_json) {

    // deserialize output query std::string to property rooted at block
    std::istringstream iss = output_query_json.empty() ? std::istringstream() : std::istringstream(output_query_json);
    boost::property_tree::ptree blockNode;
    boost::property_tree::read_json(iss, blockNode);

    // convert query property tree to block
    std::shared_ptr<monero_block> block = node_to_block_query(blockNode);

    // empty query if no txs
    if (block->m_txs.empty()) return std::make_shared<monero_output_query>();

    // get tx query
    std::shared_ptr<monero_tx_query> tx_query = std::static_pointer_cast<monero_tx_query>(block->m_txs[0]);

    // get / create input query
    std::shared_ptr<monero_output_query> input_query = tx_query->m_input_query == boost::none ? std::make_shared<monero_output_query>() : *tx_query->m_input_query;
    input_query->m_tx_query = tx_query;

    // get / create output query
    std::shared_ptr<monero_output_query> output_query = tx_query->m_output_query == boost::none ? std::make_shared<monero_output_query>() : *tx_query->m_output_query;
    output_query->m_tx_query = tx_query;

    // return deserialized query
    return output_query;
  }

  std::shared_ptr<monero_output_query> monero_output_query::copy(const std::shared_ptr<monero_output>& src, const std::shared_ptr<monero_output>& tgt) const {
    return monero_output_query::copy(std::static_pointer_cast<monero_output_query>(src), std::static_pointer_cast<monero_output_query>(tgt));
  };

  std::shared_ptr<monero_output_query> monero_output_query::copy(const std::shared_ptr<monero_output_wallet>& src, const std::shared_ptr<monero_output_wallet>& tgt) const {
    return monero_output_query::copy(std::static_pointer_cast<monero_output_query>(src), std::static_pointer_cast<monero_output_query>(tgt));
  };

  std::shared_ptr<monero_output_query> monero_output_query::copy(const std::shared_ptr<monero_output_query>& src, const std::shared_ptr<monero_output_query>& tgt) const {
    MTRACE("monero_output_query::copy(output_query)");
    if (this != src.get()) throw std::runtime_error("this != src");

    // copy base class
    monero_output_wallet::copy(std::static_pointer_cast<monero_output>(src), std::static_pointer_cast<monero_output>(tgt));

    // copy extensions
    if (!src->m_subaddress_indices.empty()) tgt->m_subaddress_indices = std::vector<uint32_t>(src->m_subaddress_indices);
    tgt->m_min_amount = src->m_min_amount;
    tgt->m_max_amount = src->m_max_amount;
    tgt->m_tx_query = src->m_tx_query;
    return tgt;
  };

  bool monero_output_query::meets_criteria(monero_output_wallet* output, bool query_parent) const {
    if (output == nullptr) throw std::runtime_error("nullptr given to monero_output_query::meets_criteria()");

    // filter on output
    if (m_account_index != boost::none && (output->m_account_index == boost::none || *m_account_index != *output->m_account_index)) return false;
    if (m_subaddress_index != boost::none && (output->m_subaddress_index == boost::none || *m_subaddress_index != *output->m_subaddress_index)) return false;
    if (m_amount != boost::none && (output->m_amount == boost::none || *m_amount != *output->m_amount)) return false;
    if (m_is_spent != boost::none && (output->m_is_spent == boost::none || *m_is_spent != *output->m_is_spent)) return false;
    if (m_is_frozen != boost::none && (output->m_is_frozen == boost::none || *m_is_frozen != *output->m_is_frozen)) return false;

    // filter on output key image
    if (m_key_image != boost::none) {
      if (output->m_key_image == boost::none) return false;
      if ((*m_key_image)->m_hex != boost::none && ((*output->m_key_image)->m_hex == boost::none || *(*m_key_image)->m_hex != *(*output->m_key_image)->m_hex)) return false;
      if ((*m_key_image)->m_signature != boost::none && ((*output->m_key_image)->m_signature == boost::none || *(*m_key_image)->m_signature != *(*output->m_key_image)->m_signature)) return false;
    }

    // filter on extensions
    if (!m_subaddress_indices.empty() && find(m_subaddress_indices.begin(), m_subaddress_indices.end(), *output->m_subaddress_index) == m_subaddress_indices.end()) return false;
    if (m_min_amount != boost::none && (output->m_amount == boost::none || output->m_amount.get() < m_min_amount.get())) return false;
    if (m_max_amount != boost::none && (output->m_amount == boost::none || output->m_amount.get() > m_max_amount.get())) return false;

    // filter with tx query
    if (query_parent && m_tx_query != boost::none && !(*m_tx_query)->meets_criteria(std::static_pointer_cast<monero_tx_wallet>(output->m_tx).get(), false)) return false;

    // output meets query
    return true;
  }

  // --------------------------- MONERO TX CONFIG -----------------------------

  monero_tx_config::monero_tx_config(const monero_tx_config& config) {
    m_address = config.m_address;
    m_amount = config.m_amount;
    if (config.m_destinations.size() > 0) {
      for (const std::shared_ptr<monero_destination>& destination : config.m_destinations) {
        m_destinations.push_back(destination->copy(destination, std::make_shared<monero_destination>()));
      }
    }
    m_payment_id = config.m_payment_id;
    m_priority = config.m_priority;
    m_ring_size = config.m_ring_size;
    m_fee = config.m_fee;
    m_account_index = config.m_account_index;
    m_subaddress_indices = config.m_subaddress_indices;
    m_unlock_height = config.m_unlock_height;
    m_can_split = config.m_can_split;
    m_relay = config.m_relay;
    m_note = config.m_note;
    m_recipient_name = config.m_recipient_name;
    m_below_amount = config.m_below_amount;
    m_sweep_each_subaddress = config.m_sweep_each_subaddress;
    m_key_image = config.m_key_image;
  }

  monero_tx_config monero_tx_config::copy() const {
    return monero_tx_config(*this);
  }

  rapidjson::Value monero_tx_config::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_priority != boost::none) monero_utils::add_json_member("priority", m_priority.get(), allocator, root, value_num);
    if (m_ring_size != boost::none) monero_utils::add_json_member("ringSize", m_ring_size.get(), allocator, root, value_num);
    if (m_account_index != boost::none) monero_utils::add_json_member("accountIndex", m_account_index.get(), allocator, root, value_num);
    if (m_unlock_height != boost::none) monero_utils::add_json_member("unlockHeight", m_unlock_height.get(), allocator, root, value_num);
    if (m_below_amount != boost::none) monero_utils::add_json_member("belowAmount", m_below_amount.get(), allocator, root, value_num);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_payment_id != boost::none) monero_utils::add_json_member("paymentId", m_payment_id.get(), allocator, root, value_str);
    if (m_note != boost::none) monero_utils::add_json_member("note", m_note.get(), allocator, root, value_str);
    if (m_recipient_name != boost::none) monero_utils::add_json_member("recipientName", m_recipient_name.get(), allocator, root, value_str);
    if (m_key_image != boost::none) monero_utils::add_json_member("keyImage", m_key_image.get(), allocator, root, value_str);

    // set bool values
    if (m_can_split != boost::none) monero_utils::add_json_member("canSplit", m_can_split.get(), allocator, root);
    if (m_relay != boost::none) monero_utils::add_json_member("relay", m_relay.get(), allocator, root);
    if (m_sweep_each_subaddress != boost::none) monero_utils::add_json_member("sweepEachSubaddress", m_sweep_each_subaddress.get(), allocator, root);

    // set sub-arrays
    if (!m_destinations.empty()) root.AddMember("destinations", monero_utils::to_rapidjson_val(allocator, m_destinations), allocator);
    if (!m_subaddress_indices.empty()) root.AddMember("subaddressIndices", monero_utils::to_rapidjson_val(allocator, m_subaddress_indices), allocator);

    // return root
    return root;
  }

  std::shared_ptr<monero_tx_config> monero_tx_config::deserialize(const std::string& config_json) {

    // deserialize config json to property node
    std::istringstream iss = config_json.empty() ? std::istringstream() : std::istringstream(config_json);
    boost::property_tree::ptree node;
    boost::property_tree::read_json(iss, node);

    // convert config property tree to monero_tx_config
    std::shared_ptr<monero_tx_config> config = std::make_shared<monero_tx_config>();
    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      std::string key = it->first;
      if (key == std::string("destinations")) {
        boost::property_tree::ptree destinationsNode = it->second;
        for (boost::property_tree::ptree::const_iterator it2 = destinationsNode.begin(); it2 != destinationsNode.end(); ++it2) {
          std::shared_ptr<monero_destination> destination = std::make_shared<monero_destination>();
          monero_destination::from_property_tree(it2->second, destination);
          config->m_destinations.push_back(destination);
        }
      }
      else if (key == std::string("paymentId")) config->m_payment_id = it->second.data();
      else if (key == std::string("priority")) {
        uint32_t priority_num = it->second.get_value<uint32_t>();
        if (priority_num == 0) config->m_priority = monero_tx_priority::DEFAULT;
        else if (priority_num == 1) config->m_priority = monero_tx_priority::UNIMPORTANT;
        else if (priority_num == 2) config->m_priority = monero_tx_priority::NORMAL;
        else if (priority_num == 3) config->m_priority = monero_tx_priority::ELEVATED;
        else throw std::runtime_error("Invalid priority number: " + std::to_string(priority_num));
      }
      else if (key == std::string("ringSize")) config->m_ring_size = it->second.get_value<uint32_t>();
      else if (key == std::string("fee")) config->m_fee = it->second.get_value<uint64_t>();
      else if (key == std::string("accountIndex")) config->m_account_index = it->second.get_value<uint32_t>();
      else if (key == std::string("subaddressIndices")) for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) config->m_subaddress_indices.push_back(it2->second.get_value<uint32_t>());
      else if (key == std::string("unlockHeight")) config->m_unlock_height = it->second.get_value<uint64_t>();
      else if (key == std::string("canSplit")) config->m_can_split = it->second.get_value<bool>();
      else if (key == std::string("relay")) config->m_relay = it->second.get_value<bool>();
      else if (key == std::string("note")) config->m_note = it->second.data();
      else if (key == std::string("recipientName")) config->m_recipient_name = it->second.data();
      else if (key == std::string("belowAmount")) config->m_below_amount = it->second.get_value<uint64_t>();
      else if (key == std::string("sweepEachSubaddress")) config->m_sweep_each_subaddress = it->second.get_value<bool>();
      else if (key == std::string("keyImage")) config->m_key_image = it->second.data();
    }

    return config;
  }

  std::vector<std::shared_ptr<monero_destination>> monero_tx_config::get_normalized_destinations() const {
    if (m_address == boost::none && m_amount == boost::none) return m_destinations;
    else if (m_destinations.empty()) {
      std::vector<std::shared_ptr<monero_destination>> destinations;
      destinations.push_back(std::make_shared<monero_destination>(m_address, m_amount));
      return destinations;
    } else {
      if (m_destinations.size() > 1) throw std::runtime_error("Invalid tx configuration: single destination address/amount incompatible with multiple destinations");
      if (m_address != m_destinations[0]->m_address) throw std::runtime_error("Invalid tx configuration: single destination address does not match first destination address");
      if (m_amount != m_destinations[0]->m_amount) throw std::runtime_error("Invalid tx configuration: single destination amount does not match first destination amount");
      return m_destinations;
    }
  }

  // ---------------------- MONERO INTEGRATED ADDRESS -------------------------

  rapidjson::Value monero_integrated_address::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    monero_utils::add_json_member("standardAddress", m_standard_address, allocator, root, value_str);
    monero_utils::add_json_member("paymentId", m_payment_id, allocator, root, value_str);
    monero_utils::add_json_member("integratedAddress", m_integrated_address, allocator, root, value_str);

    // return root
    return root;
  }

  // -------------------- MONERO KEY IMAGE IMPORT RESULT ----------------------

  rapidjson::Value monero_key_image_import_result::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_height != boost::none) monero_utils::add_json_member("height", m_height.get(), allocator, root, value_num);
    if (m_spent_amount != boost::none) monero_utils::add_json_member("spentAmount", m_spent_amount.get(), allocator, root, value_num);
    if (m_unspent_amount != boost::none) monero_utils::add_json_member("unspentAmount", m_unspent_amount.get(), allocator, root, value_num);

    // return root
    return root;
  }

  // -------------------- MONERO MESSAGE SIGNATURE RESULT ---------------------

  rapidjson::Value monero_message_signature_result::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set bool values
    monero_utils::add_json_member("isGood", m_is_good, allocator, root);
    monero_utils::add_json_member("isOld", m_is_old, allocator, root);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    monero_utils::add_json_member("version", m_version, allocator, root, value_num);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    monero_utils::add_json_member("signatureType", m_signature_type == monero_message_signature_type::SIGN_WITH_SPEND_KEY ? std::string("spend") : std::string("view"), allocator, root, value_str);

    // return root
    return root;
  }

  // ----------------------------- MONERO CHECK -------------------------------

  rapidjson::Value monero_check::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set bool values
    monero_utils::add_json_member("isGood", m_is_good, allocator, root);

    // return root
    return root;
  }

  // --------------------------- MONERO CHECK TX ------------------------------

  rapidjson::Value monero_check_tx::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // serialize root from superclass
    rapidjson::Value root = monero_check::to_rapidjson_val(allocator);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_num_confirmations != boost::none) monero_utils::add_json_member("numConfirmations", m_num_confirmations.get(), allocator, root, value_num);
    if (m_received_amount != boost::none) monero_utils::add_json_member("receivedAmount", m_received_amount.get(), allocator, root, value_num);

    // set bool values
    if (m_in_tx_pool != boost::none) monero_utils::add_json_member("inTxPool", m_in_tx_pool.get(), allocator, root);

    // return root
    return root;
  }

  // ------------------------ MONERO CHECK RESERVE ----------------------------

  rapidjson::Value monero_check_reserve::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // serialize root from superclass
    rapidjson::Value root = monero_check::to_rapidjson_val(allocator);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_total_amount != boost::none) monero_utils::add_json_member("totalAmount", m_total_amount.get(), allocator, root, value_num);
    if (m_unconfirmed_spent_amount != boost::none) monero_utils::add_json_member("unconfirmedSpentAmount", m_unconfirmed_spent_amount.get(), allocator, root, value_num);

    // return root
    return root;
  }

  // --------------------------- MONERO MULTISIG ------------------------------

  rapidjson::Value monero_multisig_info::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    monero_utils::add_json_member("threshold", m_threshold, allocator, root, value_num);
    monero_utils::add_json_member("numParticipants", m_num_participants, allocator, root, value_num);

    // set bool values
    monero_utils::add_json_member("isMultisig", m_is_multisig, allocator, root);
    monero_utils::add_json_member("isReady", m_is_ready, allocator, root);

    // return root
    return root;
  }

  rapidjson::Value monero_multisig_init_result::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_address != boost::none) monero_utils::add_json_member("address", m_address.get(), allocator, root, value_str);
    if (m_multisig_hex != boost::none) monero_utils::add_json_member("multisigHex", m_multisig_hex.get(), allocator, root, value_str);

    // return root
    return root;
  }

  rapidjson::Value monero_multisig_sign_result::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {
    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_signed_multisig_tx_hex != boost::none) monero_utils::add_json_member("signedMultisigTxHex", m_signed_multisig_tx_hex.get(), allocator, root, value_str);

    // set sub-arrays
    if (!m_tx_hashes.empty()) root.AddMember("txHashes", monero_utils::to_rapidjson_val(allocator, m_tx_hashes), allocator);

    // return root
    return root;
  }

  // -------------------------- MONERO ADDRESS BOOK ---------------------------

  rapidjson::Value monero_address_book_entry::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_index != boost::none) monero_utils::add_json_member("index", m_index.get(), allocator, root, value_num);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_address != boost::none) monero_utils::add_json_member("address", m_address.get(), allocator, root, value_str);
    if (m_description != boost::none) monero_utils::add_json_member("description", m_description.get(), allocator, root, value_str);
    if (m_payment_id != boost::none) monero_utils::add_json_member("paymentId", m_payment_id.get(), allocator, root, value_str);

    // return root
    return root;
  }
}
