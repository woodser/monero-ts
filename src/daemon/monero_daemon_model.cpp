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

#include "monero_daemon_model.h"

#include "utils/gen_utils.h"
#include "utils/monero_utils.h"
#include "include_base_utils.h"
#include "common/util.h"

/**
 * Public library interface.
 */
namespace monero {

  // ----------------------- UNDECLARED PRIVATE HELPERS -----------------------

  void merge_tx(std::vector<std::shared_ptr<monero_tx>>& txs, const std::shared_ptr<monero_tx>& tx) {
    for (const std::shared_ptr<monero_tx>& aTx : txs) {
      if (aTx->m_hash.get() == tx->m_hash.get()) {
        aTx->merge(aTx, tx);
        return;
      }
    }
    txs.push_back(tx);
  }

  // ------------------------- INITIALIZE CONSTANTS ---------------------------

  const std::string monero_tx::DEFAULT_PAYMENT_ID = std::string("0000000000000000");

  // ------------------------- SERIALIZABLE STRUCT ----------------------------

  std::string serializable_struct::serialize() const {
    rapidjson::Document doc;
    doc.SetObject();
    rapidjson::Value val = to_rapidjson_val(doc.GetAllocator());
    val.Swap(doc);
    return monero_utils::serialize(doc);
  }

  // ----------------------------- MONERO VERSION -----------------------------

  rapidjson::Value monero_version::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_number != boost::none) monero_utils::add_json_member("number", m_number.get(), allocator, root, value_num);

    // set bool values
    if (m_is_release != boost::none) monero_utils::add_json_member("isRelease", m_is_release.get(), allocator, root);

    // return root
    return root;
  }

  // --------------------------- MONERO RPC VERSION ---------------------------

  rapidjson::Value monero_rpc_connection::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set std::string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_uri != boost::none) monero_utils::add_json_member("uri", m_uri.get(), allocator, root, value_str);
    if (m_username != boost::none) monero_utils::add_json_member("username", m_username.get(), allocator, root, value_str);
    if (m_password != boost::none) monero_utils::add_json_member("password", m_password.get(), allocator, root, value_str);

    // return root
    return root;
  }

  // ------------------------- MONERO BLOCK HEADER ----------------------------

  rapidjson::Value monero_block_header::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_height != boost::none) monero_utils::add_json_member("height", m_height.get(), allocator, root, value_num);
    if (m_timestamp != boost::none) monero_utils::add_json_member("timestamp", m_timestamp.get(), allocator, root, value_num);
    if (m_size != boost::none) monero_utils::add_json_member("size", m_size.get(), allocator, root, value_num);
    if (m_weight != boost::none) monero_utils::add_json_member("weight", m_weight.get(), allocator, root, value_num);
    if (m_long_term_weight != boost::none) monero_utils::add_json_member("longTermWeight", m_long_term_weight.get(), allocator, root, value_num);
    if (m_depth != boost::none) monero_utils::add_json_member("depth", m_depth.get(), allocator, root, value_num);
    if (m_difficulty != boost::none) monero_utils::add_json_member("difficulty", m_difficulty.get(), allocator, root, value_num);
    if (m_cumulative_difficulty != boost::none) monero_utils::add_json_member("cumulativeDifficulty", m_cumulative_difficulty.get(), allocator, root, value_num);
    if (m_major_version != boost::none) monero_utils::add_json_member("majorVersion", m_major_version.get(), allocator, root, value_num);
    if (m_minor_version != boost::none) monero_utils::add_json_member("minorVersion", m_minor_version.get(), allocator, root, value_num);
    if (m_nonce != boost::none) monero_utils::add_json_member("nonce", m_nonce.get(), allocator, root, value_num);
    if (m_miner_tx_hash != boost::none) monero_utils::add_json_member("minerTxHash", m_miner_tx_hash.get(), allocator, root, value_num);
    if (m_num_txs != boost::none) monero_utils::add_json_member("numTxs", m_num_txs.get(), allocator, root, value_num);
    if (m_reward != boost::none) monero_utils::add_json_member("reward", m_reward.get(), allocator, root, value_num);

    // set std::string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_hash != boost::none) monero_utils::add_json_member("hash", m_hash.get(), allocator, root, value_str);
    if (m_prev_hash != boost::none) monero_utils::add_json_member("prevHash", m_prev_hash.get(), allocator, root, value_str);
    if (m_pow_hash != boost::none) monero_utils::add_json_member("powHash", m_pow_hash.get(), allocator, root, value_str);

    // set bool values
    if (m_orphan_status != boost::none) monero_utils::add_json_member("orphanStatus", m_orphan_status.get(), allocator, root);

    // return root
    return root;
  }

  void monero_block_header::merge(const std::shared_ptr<monero_block_header>& self, const std::shared_ptr<monero_block_header>& other) {
    if (this != self.get()) throw std::runtime_error("this != self");
    if (self == other) return;
    m_hash = gen_utils::reconcile(m_hash, other->m_hash, "block header m_hash");
    m_height = gen_utils::reconcile(m_height, other->m_height, boost::none, boost::none, true, "block header m_height"); // height can increase
    m_timestamp = gen_utils::reconcile(m_timestamp, other->m_timestamp, boost::none, boost::none, true, "block header m_timestamp");  // timestamp can increase
    m_size = gen_utils::reconcile(m_size, other->m_size, "block header m_size");
    m_weight = gen_utils::reconcile(m_weight, other->m_weight, "block header m_weight ");
    m_long_term_weight = gen_utils::reconcile(m_long_term_weight, other->m_long_term_weight, "block header m_long_term_weight");
    m_depth = gen_utils::reconcile(m_depth, other->m_depth, "block header m_depth");
    m_difficulty = gen_utils::reconcile(m_difficulty, other->m_difficulty, "block header m_difficulty");
    m_cumulative_difficulty = gen_utils::reconcile(m_cumulative_difficulty, other->m_cumulative_difficulty, "block header m_cumulative_difficulty");
    m_major_version = gen_utils::reconcile(m_major_version, other->m_major_version, "block header m_major_version");
    m_minor_version = gen_utils::reconcile(m_minor_version, other->m_minor_version, "block header m_minor_version");
    m_nonce = gen_utils::reconcile(m_nonce, other->m_nonce, "block header m_nonce");
    m_miner_tx_hash = gen_utils::reconcile(m_miner_tx_hash, other->m_miner_tx_hash, "block header m_miner_tx_hash");
    m_num_txs = gen_utils::reconcile(m_num_txs, other->m_num_txs, "block header m_num_txs");
    m_orphan_status = gen_utils::reconcile(m_orphan_status, other->m_orphan_status, "block header m_orphan_status");
    m_prev_hash = gen_utils::reconcile(m_prev_hash, other->m_prev_hash, "block header m_prev_hash");
    m_reward = gen_utils::reconcile(m_reward, other->m_reward, "block header m_reward");
    m_pow_hash = gen_utils::reconcile(m_pow_hash, other->m_pow_hash, "block header m_pow_hash");
  }

  // ----------------------------- MONERO BLOCK -------------------------------

  rapidjson::Value monero_block::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // serialize root from superclass
    rapidjson::Value root = monero_block_header::to_rapidjson_val(allocator);

    // set std::string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_hex != boost::none) monero_utils::add_json_member("hex", m_hex.get(), allocator, root, value_str);

    // set sub-arrays
    if (!m_txs.empty()) root.AddMember("txs", monero_utils::to_rapidjson_val(allocator, m_txs), allocator);
    if (!m_tx_hashes.empty()) root.AddMember("txHashes", monero_utils::to_rapidjson_val(allocator, m_tx_hashes), allocator);

    // set sub-objects
    if (m_miner_tx != boost::none) root.AddMember("minerTx", m_miner_tx.get()->to_rapidjson_val(allocator), allocator);

    // return root
    return root;
  }

  void monero_block::merge(const std::shared_ptr<monero_block_header>& self, const std::shared_ptr<monero_block_header>& other) {
    merge(std::static_pointer_cast<monero_block>(self), std::static_pointer_cast<monero_block>(other));
  }

  void monero_block::merge(const std::shared_ptr<monero_block>& self, const std::shared_ptr<monero_block>& other) {
    if (this != self.get()) throw std::runtime_error("this != self");
    if (self == other) return;

    // merge header fields
    monero_block_header::merge(self, other);

    // merge reconcilable block extensions
    m_hex = gen_utils::reconcile(m_hex, other->m_hex, "block m_hex");
    m_tx_hashes = gen_utils::reconcile(m_tx_hashes, other->m_tx_hashes, "block m_tx_hahes");

    // merge miner tx
    if (m_miner_tx == boost::none) m_miner_tx = other->m_miner_tx;
    if (other->m_miner_tx != boost::none) {
      other->m_miner_tx.get()->m_block = self;
      m_miner_tx.get()->merge(m_miner_tx.get(), other->m_miner_tx.get());
    }

    // merge non-miner txs
    if (!other->m_txs.empty()) {
      for (const std::shared_ptr<monero_tx> otherTx : other->m_txs) { // NOTE: not using reference so std::shared_ptr is not deleted when block is dereferenced
        otherTx->m_block = self;
        merge_tx(self->m_txs, otherTx);
      }
    }
  }

  // ------------------------------- MONERO TX --------------------------------

  rapidjson::Value monero_tx::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_version != boost::none) monero_utils::add_json_member("version", m_version.get(), allocator, root, value_num);
    if (m_fee != boost::none) monero_utils::add_json_member("fee", m_fee.get(), allocator, root, value_num);
    if (m_ring_size != boost::none) monero_utils::add_json_member("ringSize", m_ring_size.get(), allocator, root, value_num);
    if (m_num_confirmations != boost::none) monero_utils::add_json_member("numConfirmations", m_num_confirmations.get(), allocator, root, value_num);
    if (m_unlock_height != boost::none) monero_utils::add_json_member("unlockHeight", m_unlock_height.get(), allocator, root, value_num);
    if (m_last_relayed_timestamp != boost::none) monero_utils::add_json_member("lastRelayedTimestamp", m_last_relayed_timestamp.get(), allocator, root, value_num);
    if (m_received_timestamp != boost::none) monero_utils::add_json_member("receivedTimestamp", m_received_timestamp.get(), allocator, root, value_num);
    if (m_size != boost::none) monero_utils::add_json_member("size", m_size.get(), allocator, root, value_num);
    if (m_weight != boost::none) monero_utils::add_json_member("weight", m_weight.get(), allocator, root, value_num);
    if (m_last_failed_height != boost::none) monero_utils::add_json_member("lastFailedHeight", m_last_failed_height.get(), allocator, root, value_num);
    if (m_max_used_block_height != boost::none) monero_utils::add_json_member("maxUsedBlockHeight", m_max_used_block_height.get(), allocator, root, value_num);

    // set std::string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_hash != boost::none) monero_utils::add_json_member("hash", m_hash.get(), allocator, root, value_str);
    if (m_payment_id != boost::none) monero_utils::add_json_member("paymentId", m_payment_id.get(), allocator, root, value_str);
    if (m_key != boost::none) monero_utils::add_json_member("key", m_key.get(), allocator, root, value_str);
    if (m_full_hex != boost::none) monero_utils::add_json_member("fullHex", m_full_hex.get(), allocator, root, value_str);
    if (m_pruned_hex != boost::none) monero_utils::add_json_member("prunedHex", m_pruned_hex.get(), allocator, root, value_str);
    if (m_prunable_hex != boost::none) monero_utils::add_json_member("prunableHex", m_prunable_hex.get(), allocator, root, value_str);
    if (m_prunable_hash != boost::none) monero_utils::add_json_member("prunableHash", m_prunable_hash.get(), allocator, root, value_str);
    if (m_metadata != boost::none) monero_utils::add_json_member("metadata", m_metadata.get(), allocator, root, value_str);
    if (m_common_tx_sets != boost::none) monero_utils::add_json_member("commonTxSets", m_common_tx_sets.get(), allocator, root, value_str);
    if (m_rct_signatures != boost::none) monero_utils::add_json_member("rctSignatures", m_rct_signatures.get(), allocator, root, value_str);
    if (m_rct_sig_prunable != boost::none) monero_utils::add_json_member("rctSigPrunable", m_rct_sig_prunable.get(), allocator, root, value_str);
    if (m_last_failed_hash != boost::none) monero_utils::add_json_member("lastFailedHash", m_last_failed_hash.get(), allocator, root, value_str);
    if (m_max_used_block_hash != boost::none) monero_utils::add_json_member("maxUsedBlockHash", m_max_used_block_hash.get(), allocator, root, value_str);

    // set bool values
    if (m_is_miner_tx != boost::none) monero_utils::add_json_member("isMinerTx", m_is_miner_tx.get(), allocator, root);
    if (m_relay != boost::none) monero_utils::add_json_member("relay", m_relay.get(), allocator, root);
    if (m_is_relayed != boost::none) monero_utils::add_json_member("isRelayed", m_is_relayed.get(), allocator, root);
    if (m_is_confirmed != boost::none) monero_utils::add_json_member("isConfirmed", m_is_confirmed.get(), allocator, root);
    if (m_in_tx_pool != boost::none) monero_utils::add_json_member("inTxPool", m_in_tx_pool.get(), allocator, root);
    if (m_is_double_spend_seen != boost::none) monero_utils::add_json_member("isDoubleSpendSeen", m_is_double_spend_seen.get(), allocator, root);
    if (m_is_kept_by_block != boost::none) monero_utils::add_json_member("isKeptByBlock", m_is_kept_by_block.get(), allocator, root);
    if (m_is_failed != boost::none) monero_utils::add_json_member("isFailed", m_is_failed.get(), allocator, root);

    // set sub-arrays
    if (!m_inputs.empty()) root.AddMember("inputs", monero_utils::to_rapidjson_val(allocator, m_inputs), allocator);
    if (!m_outputs.empty()) root.AddMember("outputs", monero_utils::to_rapidjson_val(allocator, m_outputs), allocator);
    if (!m_output_indices.empty()) root.AddMember("outputIndices", monero_utils::to_rapidjson_val(allocator, m_output_indices), allocator);
    if (!m_extra.empty()) root.AddMember("extra", monero_utils::to_rapidjson_val(allocator, m_extra), allocator);
    if (!m_signatures.empty()) root.AddMember("signatures", monero_utils::to_rapidjson_val(allocator, m_signatures), allocator);

    // return root
    return root;
  }

  void monero_tx::from_property_tree(const boost::property_tree::ptree& node, std::shared_ptr<monero_tx> tx) {

    // initialize tx from node
    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      std::string key = it->first;
      if (key == std::string("hash")) tx->m_hash = it->second.data();
      else if (key == std::string("version")) throw std::runtime_error("version deserialization not implemented");
      else if (key == std::string("isMinerTx")) tx->m_is_miner_tx = it->second.get_value<bool>();
      else if (key == std::string("paymentId")) tx->m_payment_id = it->second.data();
      else if (key == std::string("fee")) tx->m_fee = it->second.get_value<uint64_t>();
      else if (key == std::string("mixin")) throw std::runtime_error("mixin deserialization not implemented");
      else if (key == std::string("relay")) tx->m_relay = it->second.get_value<bool>();
      else if (key == std::string("isRelayed")) tx->m_is_relayed = it->second.get_value<bool>();
      else if (key == std::string("isConfirmed")) tx->m_is_confirmed = it->second.get_value<bool>();
      else if (key == std::string("inTxPool")) tx->m_in_tx_pool = it->second.get_value<bool>();
      else if (key == std::string("numConfirmations")) tx->m_num_confirmations = it->second.get_value<uint64_t>();
      else if (key == std::string("unlockHeight")) tx->m_unlock_height = it->second.get_value<uint64_t>();
      else if (key == std::string("lastRelayedTimestamp")) tx->m_last_relayed_timestamp = it->second.get_value<uint64_t>();
      else if (key == std::string("receivedTimestamp")) tx->m_received_timestamp = it->second.get_value<uint64_t>();
      else if (key == std::string("isDoubleSpendSeen")) tx->m_is_double_spend_seen = it->second.get_value<bool>();
      else if (key == std::string("key")) tx->m_key = it->second.data();
      else if (key == std::string("fullHex")) tx->m_full_hex = it->second.data();
      else if (key == std::string("prunedHex")) tx->m_pruned_hex = it->second.data();
      else if (key == std::string("prunableHex")) tx->m_prunable_hex = it->second.data();
      else if (key == std::string("prunableHash")) tx->m_prunable_hash = it->second.data();
      else if (key == std::string("size")) tx->m_size = it->second.get_value<uint64_t>();
      else if (key == std::string("weight")) tx->m_weight = it->second.get_value<uint64_t>();
      else if (key == std::string("inputs")) throw std::runtime_error("inputs deserialization not implemented");
      else if (key == std::string("outputs")) throw std::runtime_error("outputs deserialization not implemented");
      else if (key == std::string("outputIndices")) throw std::runtime_error("m_output_indices deserialization not implemented");
      else if (key == std::string("metadata")) tx->m_metadata = it->second.data();
      else if (key == std::string("commonTxSets")) throw std::runtime_error("commonTxSets deserialization not implemented");
      else if (key == std::string("extra")) throw std::runtime_error("extra deserialization not implemented");
      else if (key == std::string("rctSignatures")) throw std::runtime_error("rctSignatures deserialization not implemented");
      else if (key == std::string("rctSigPrunable")) throw std::runtime_error("rctSigPrunable deserialization not implemented");
      else if (key == std::string("isKeptByBlock")) tx->m_is_kept_by_block = it->second.get_value<bool>();
      else if (key == std::string("isFailed")) tx->m_is_failed = it->second.get_value<bool>();
      else if (key == std::string("lastFailedHeight")) throw std::runtime_error("lastFailedHeight deserialization not implemented");
      else if (key == std::string("lastFailedHash")) tx->m_last_failed_hash = it->second.data();
      else if (key == std::string("maxUsedBlockHeight")) throw std::runtime_error("maxUsedBlockHeight deserialization not implemented");
      else if (key == std::string("maxUsedBlockHash")) tx->m_max_used_block_hash = it->second.data();
      else if (key == std::string("signatures")) throw std::runtime_error("signatures deserialization not implemented");
    }
  }

  std::shared_ptr<monero_tx> monero_tx::copy(const std::shared_ptr<monero_tx>& src, const std::shared_ptr<monero_tx>& tgt) const {
    MTRACE("monero_tx::copy(const std::shared_ptr<monero_tx>& src, const std::shared_ptr<monero_tx>& tgt)");
    tgt->m_hash = src->m_hash;
    tgt->m_version = src->m_version;
    tgt->m_is_miner_tx = src->m_is_miner_tx;
    tgt->m_payment_id = src->m_payment_id;
    tgt->m_fee = src->m_fee;
    tgt->m_ring_size = src->m_ring_size;
    tgt->m_relay = src->m_relay;
    tgt->m_is_relayed = src->m_is_relayed;
    tgt->m_is_confirmed = src->m_is_confirmed;
    tgt->m_in_tx_pool = src->m_in_tx_pool;
    tgt->m_num_confirmations = src->m_num_confirmations;
    tgt->m_unlock_height = src->m_unlock_height;
    tgt->m_last_relayed_timestamp = src->m_last_relayed_timestamp;
    tgt->m_received_timestamp = src->m_received_timestamp;
    tgt->m_is_double_spend_seen = src->m_is_double_spend_seen;
    tgt->m_key = src->m_key;
    tgt->m_full_hex = src->m_full_hex;
    tgt->m_pruned_hex = src->m_pruned_hex;
    tgt->m_prunable_hex = src->m_prunable_hex;
    tgt->m_prunable_hash = src->m_prunable_hash;
    tgt->m_size = src->m_size;
    tgt->m_weight = src->m_weight;
    if (!src->m_inputs.empty()) {
      tgt->m_inputs = std::vector<std::shared_ptr<monero_output>>();
      for (const std::shared_ptr<monero_output>& input : src->m_inputs) {
        std::shared_ptr<monero_output> input_copy = input->copy(input, std::make_shared<monero_output>());
        input_copy->m_tx = tgt;
        tgt->m_inputs.push_back(input_copy);
      }
    }
    if (!src->m_outputs.empty()) {
      tgt->m_outputs = std::vector<std::shared_ptr<monero_output>>();
      for (const std::shared_ptr<monero_output>& output : src->m_outputs) {
        std::shared_ptr<monero_output> output_copy = output->copy(output, std::make_shared<monero_output>());
        output_copy->m_tx = tgt;
        tgt->m_outputs.push_back(output_copy);
      }
    }
    if (!src->m_output_indices.empty()) tgt->m_output_indices = std::vector<uint64_t>(src->m_output_indices);
    tgt->m_metadata = src->m_metadata;
    tgt->m_common_tx_sets = src->m_common_tx_sets;
    if (!src->m_extra.empty()) throw std::runtime_error("extra deep copy not implemented");  // TODO: implement extra
    tgt->m_rct_signatures = src->m_rct_signatures;
    tgt->m_rct_sig_prunable = src->m_rct_sig_prunable;
    tgt->m_is_kept_by_block = src->m_is_kept_by_block;
    tgt->m_is_failed = src->m_is_failed;
    tgt->m_last_failed_height = src->m_last_failed_height;
    tgt->m_last_failed_hash = src->m_last_failed_hash;
    tgt->m_max_used_block_height = src->m_max_used_block_height;
    tgt->m_max_used_block_hash = src->m_max_used_block_hash;
    if (!src->m_signatures.empty()) tgt->m_signatures = std::vector<std::string>(src->m_signatures);
    return tgt;
  }

  boost::optional<uint64_t> monero_tx::get_height() const {
    if (m_block == boost::none) return boost::none;
    return *((*m_block)->m_height);
  }

  void monero_tx::merge(const std::shared_ptr<monero_tx>& self, const std::shared_ptr<monero_tx>& other) {
    if (this != self.get()) throw std::runtime_error("this != self");
    if (self == other) return;

    // merge blocks if they're different
    if (m_block != other->m_block) {
      if (m_block == boost::none) {
        m_block = other->m_block;
        std::replace(m_block.get()->m_txs.begin(), m_block.get()->m_txs.end(), other, self); // update block to point to this tx
      } else if (other->m_block != boost::none) {
        m_block.get()->merge(m_block.get(), other->m_block.get()); // comes back to merging txs
        return;
      }
    }

    // otherwise merge tx fields
    m_hash = gen_utils::reconcile(m_hash, other->m_hash, "tx m_hash");
    m_version = gen_utils::reconcile(m_version, other->m_version, "tx m_version");
    m_payment_id = gen_utils::reconcile(m_payment_id, other->m_payment_id, "tx m_payment_id");
    m_fee = gen_utils::reconcile(m_fee, other->m_fee, "tx m_fee");
    m_ring_size = gen_utils::reconcile(m_ring_size, other->m_ring_size, "tx m_ring_size");
    m_is_confirmed = gen_utils::reconcile(m_is_confirmed, other->m_is_confirmed, boost::none, true, boost::none, "tx m_is_confirmed");  // tx can become confirmed
    m_is_miner_tx = gen_utils::reconcile(m_is_miner_tx, other->m_is_miner_tx, "tx m_is_miner_tx");
    m_relay = gen_utils::reconcile(m_relay, other->m_relay, "tx m_relay");
    m_is_relayed = gen_utils::reconcile(m_is_relayed, other->m_is_relayed, "tx m_is_relayed");
    m_is_double_spend_seen = gen_utils::reconcile(m_is_double_spend_seen, other->m_is_double_spend_seen, boost::none, true, boost::none, "tx m_is_double_spend_seen"); // double spend can become seen
    m_key = gen_utils::reconcile(m_key, other->m_key, "tx m_key");
    m_full_hex = gen_utils::reconcile(m_full_hex, other->m_full_hex, "tx m_full_hex");
    m_pruned_hex = gen_utils::reconcile(m_pruned_hex, other->m_pruned_hex, "tx m_pruned_hex");
    m_prunable_hex = gen_utils::reconcile(m_prunable_hex, other->m_prunable_hex, "tx m_prunable_hex");
    m_prunable_hash = gen_utils::reconcile(m_prunable_hash, other->m_prunable_hash, "tx m_prunable_hash");
    m_size = gen_utils::reconcile(m_size, other->m_size, "tx m_size");
    m_weight = gen_utils::reconcile(m_weight, other->m_weight, "tx m_weight");
    //m_output_indices = gen_utils::reconcile(m_output_indices, other->m_output_indices, "tx m_output_indices");  // TODO
    m_metadata = gen_utils::reconcile(m_metadata, other->m_metadata, "tx m_metadata");
    m_common_tx_sets = gen_utils::reconcile(m_common_tx_sets, other->m_common_tx_sets, "tx m_common_tx_sets");
    //m_extra = gen_utils::reconcile(m_extra, other->m_extra, "tx m_extra");  // TODO
    m_rct_signatures = gen_utils::reconcile(m_rct_signatures, other->m_rct_signatures, "tx m_rct_signatures");
    m_rct_sig_prunable = gen_utils::reconcile(m_rct_sig_prunable, other->m_rct_sig_prunable, "tx m_rct_sig_prunable");
    m_is_kept_by_block = gen_utils::reconcile(m_is_kept_by_block, other->m_is_kept_by_block, "tx m_is_kept_by_block");
    m_is_failed = gen_utils::reconcile(m_is_failed, other->m_is_failed, "tx m_is_failed");
    m_last_failed_height = gen_utils::reconcile(m_last_failed_height, other->m_last_failed_height, "tx m_last_failed_height");
    m_last_failed_hash = gen_utils::reconcile(m_last_failed_hash, other->m_last_failed_hash, "tx m_last_failed_hash");
    m_max_used_block_height = gen_utils::reconcile(m_max_used_block_height, other->m_max_used_block_height, "tx m_max_used_block_height");
    m_max_used_block_hash = gen_utils::reconcile(m_max_used_block_hash, other->m_max_used_block_hash, "tx m_max_used_block_hash");
    //m_signatures = gen_utils::reconcile(m_signatures, other->m_signatures, "tx m_signatures"); // TODO
    m_unlock_height = gen_utils::reconcile(m_unlock_height, other->m_unlock_height, "tx m_unlock_height");
    m_num_confirmations = gen_utils::reconcile(m_num_confirmations, other->m_num_confirmations, boost::none, boost::none, true, "tx m_num_confirmations"); // num confirmations can increase

    // merge inputs
    if (!other->m_inputs.empty()) {
      for (const std::shared_ptr<monero_output>& merger : other->m_inputs) {
        bool merged = false;
        merger->m_tx = self;
        for (const std::shared_ptr<monero_output>& mergee : m_inputs) {
          if ((*mergee->m_key_image)->m_hex == (*merger->m_key_image)->m_hex) {
            mergee->merge(mergee, merger);
            merged = true;
            break;
          }
        }
        if (!merged) m_inputs.push_back(merger);
      }
    }

    // merge outputs
    if (!other->m_outputs.empty()) {
      for (const std::shared_ptr<monero_output>& output : other->m_outputs) output->m_tx = self;
      if (m_outputs.empty()) m_outputs = other->m_outputs;
      else {

        // merge outputs if key image or stealth public key present, otherwise append
        for (const std::shared_ptr<monero_output>& merger : other->m_outputs) {
          bool merged = false;
          merger->m_tx = self;
          for (const std::shared_ptr<monero_output>& mergee : m_outputs) {
            if ((merger->m_key_image != boost::none && (*mergee->m_key_image)->m_hex == (*merger->m_key_image)->m_hex) ||
                (merger->m_stealth_public_key != boost::none && *mergee->m_stealth_public_key == *merger->m_stealth_public_key)) {
              mergee->merge(mergee, merger);
              merged = true;
              break;
            }
          }
          if (!merged) m_outputs.push_back(merger); // append output
        }
      }
    }

    // handle unrelayed -> relayed -> confirmed
    if (*m_is_confirmed) {
      m_in_tx_pool = false;
      m_received_timestamp = boost::none;
      m_last_relayed_timestamp = boost::none;
    } else {
      m_in_tx_pool = gen_utils::reconcile(m_in_tx_pool, other->m_in_tx_pool, boost::none, true, boost::none, "tx m_in_tx_pool"); // unrelayed -> tx pool
      m_received_timestamp = gen_utils::reconcile(m_received_timestamp, other->m_received_timestamp, boost::none, boost::none, false, "tx m_received_timestamp"); // take earliest receive time
      m_last_relayed_timestamp = gen_utils::reconcile(m_last_relayed_timestamp, other->m_last_relayed_timestamp, boost::none, boost::none, true, "tx m_last_relayed_timestamp"); // take latest relay time
    }
  }

  // --------------------------- MONERO KEY IMAGE -----------------------------

  rapidjson::Value monero_key_image::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set std::string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_hex != boost::none) monero_utils::add_json_member("hex", m_hex.get(), allocator, root, value_str);
    if (m_signature != boost::none) monero_utils::add_json_member("signature", m_signature.get(), allocator, root, value_str);

    // return root
    return root;
  }

  void monero_key_image::from_property_tree(const boost::property_tree::ptree& node, const std::shared_ptr<monero_key_image>& key_image) {

    // initialize key image from node
    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      std::string key = it->first;
      if (key == std::string("hex")) key_image->m_hex = it->second.data();
      else if (key == std::string("signature")) key_image->m_signature = it->second.data();
    }
  }

  std::vector<std::shared_ptr<monero_key_image>> monero_key_image::deserialize_key_images(const std::string& key_images_json) {

    // deserialize json to property node
    std::istringstream iss = key_images_json.empty() ? std::istringstream() : std::istringstream(key_images_json);
    boost::property_tree::ptree node;
    boost::property_tree::read_json(iss, node);

    // convert property tree to key images
    std::vector<std::shared_ptr<monero_key_image>> key_images;
    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      std::string key = it->first;
      if (key == std::string("keyImages")) {
        for (boost::property_tree::ptree::const_iterator it2 = it->second.begin(); it2 != it->second.end(); ++it2) {
          std::shared_ptr<monero_key_image> key_image = std::make_shared<monero_key_image>();
          monero_key_image::from_property_tree(it2->second, key_image);
          key_images.push_back(key_image);
        }
      }
      else MWARNING("WARNING MoneroWalletJni::deserialize_key_images() unrecognized key: " << key);
    }
    return key_images;
  }

  std::shared_ptr<monero_key_image> monero_key_image::copy(const std::shared_ptr<monero_key_image>& src, const std::shared_ptr<monero_key_image>& tgt) const {
    if (this != src.get()) throw std::runtime_error("this != src");
    tgt->m_hex = src->m_hex;
    tgt->m_signature = src->m_signature;
    return tgt;
  }

  void monero_key_image::merge(const std::shared_ptr<monero_key_image>& self, const std::shared_ptr<monero_key_image>& other) {
    MTRACE("monero_key_image::merge(self, other)");
    if (this != self.get()) throw std::runtime_error("this != self");
    if (self == other) return;
    m_hex = gen_utils::reconcile(m_hex, other->m_hex, "key image m_hex");
    m_signature = gen_utils::reconcile(m_signature, other->m_signature, "key image m_signature");
  }

  // ------------------------------ MONERO OUTPUT -----------------------------

  rapidjson::Value monero_output::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_amount != boost::none) monero_utils::add_json_member("amount", m_amount.get(), allocator, root, value_num);
    if (m_index != boost::none) monero_utils::add_json_member("index", m_index.get(), allocator, root, value_num);
    if (m_stealth_public_key != boost::none) monero_utils::add_json_member("stealthPublicKey", m_stealth_public_key.get(), allocator, root, value_num);

    // set sub-arrays
    if (!m_ring_output_indices.empty()) root.AddMember("ringOutputIndices", monero_utils::to_rapidjson_val(allocator, m_ring_output_indices), allocator);

    // set sub-objects
    if (m_key_image != boost::none) root.AddMember("keyImage", m_key_image.get()->to_rapidjson_val(allocator), allocator);

    // return root
    return root;
  }

  void monero_output::from_property_tree(const boost::property_tree::ptree& node, const std::shared_ptr<monero_output>& output) {

    // initialize output from node
    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      std::string key = it->first;
      if (key == std::string("keyImage")) {
        output->m_key_image = std::make_shared<monero_key_image>();
        monero_key_image::from_property_tree(it->second, output->m_key_image.get());
      }
      else if (key == std::string("amount")) output->m_amount = it->second.get_value<uint64_t>();
      else if (key == std::string("index")) output->m_index = it->second.get_value<uint32_t>();
      else if (key == std::string("ringOutputIndices")) throw std::runtime_error("node_to_tx() deserialize ringOutputIndices not implemented");
      else if (key == std::string("stealthPublicKey")) throw std::runtime_error("node_to_tx() deserialize stealthPublicKey not implemented");
    }
  }

  std::shared_ptr<monero_output> monero_output::copy(const std::shared_ptr<monero_output>& src, const std::shared_ptr<monero_output>& tgt) const {
    if (this != src.get()) throw std::runtime_error("this != src");
    tgt->m_tx = src->m_tx;  // reference same parent tx by default
    if (src->m_key_image != boost::none) tgt->m_key_image = src->m_key_image.get()->copy(src->m_key_image.get(), std::make_shared<monero_key_image>());
    tgt->m_amount = src->m_amount;
    tgt->m_index = src->m_index;
    if (!src->m_ring_output_indices.empty()) tgt->m_ring_output_indices = std::vector<uint64_t>(src->m_ring_output_indices);
    tgt->m_stealth_public_key = src->m_stealth_public_key;
    return tgt;
  }

  void monero_output::merge(const std::shared_ptr<monero_output>& self, const std::shared_ptr<monero_output>& other) {
    if (this != self.get()) throw std::runtime_error("this != self");
    if (self == other) return;

    // merge txs if they're different which comes back to merging outputs
    if (m_tx != other->m_tx) {
      m_tx->merge(m_tx, other->m_tx);
      return;
    }

    // otherwise merge output fields
    if (m_key_image == boost::none) m_key_image = other->m_key_image;
    else if (other->m_key_image != boost::none) m_key_image.get()->merge(m_key_image.get(), other->m_key_image.get());
    m_amount = gen_utils::reconcile(m_amount, other->m_amount, "output amount");
    m_index = gen_utils::reconcile(m_index, other->m_index, "output index");
  }
}
