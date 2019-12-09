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

  void merge_tx(vector<shared_ptr<monero_tx>>& txs, const shared_ptr<monero_tx>& tx) {
    for (const shared_ptr<monero_tx>& aTx : txs) {
      if (aTx->m_hash.get() == tx->m_hash.get()) {
        aTx->merge(aTx, tx);
        return;
      }
    }
    txs.push_back(tx);
  }

  // ------------------------- INITIALIZE CONSTANTS ---------------------------

  const string monero_tx::DEFAULT_PAYMENT_ID = string("0000000000000000");

  // ------------------------- SERIALIZABLE STRUCT ----------------------------

  string serializable_struct::serialize() const {
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
    if (m_number != boost::none) monero_utils::addJsonMember("number", m_number.get(), allocator, root, value_num);

    // set bool values
    if (m_is_release != boost::none) monero_utils::addJsonMember("isRelease", m_is_release.get(), allocator, root);

    // return root
    return root;
  }

  // ------------------------- MONERO BLOCK HEADER ----------------------------

  rapidjson::Value monero_block_header::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_height != boost::none) monero_utils::addJsonMember("height", m_height.get(), allocator, root, value_num);
    if (m_timestamp != boost::none) monero_utils::addJsonMember("timestamp", m_timestamp.get(), allocator, root, value_num);
    if (m_size != boost::none) monero_utils::addJsonMember("size", m_size.get(), allocator, root, value_num);
    if (m_weight != boost::none) monero_utils::addJsonMember("weight", m_weight.get(), allocator, root, value_num);
    if (m_long_term_weight != boost::none) monero_utils::addJsonMember("longTermWeight", m_long_term_weight.get(), allocator, root, value_num);
    if (m_depth != boost::none) monero_utils::addJsonMember("depth", m_depth.get(), allocator, root, value_num);
    if (m_difficulty != boost::none) monero_utils::addJsonMember("difficulty", m_difficulty.get(), allocator, root, value_num);
    if (m_cumulative_difficulty != boost::none) monero_utils::addJsonMember("cumulativeDifficulty", m_cumulative_difficulty.get(), allocator, root, value_num);
    if (m_major_version != boost::none) monero_utils::addJsonMember("majorVersion", m_major_version.get(), allocator, root, value_num);
    if (m_minor_version != boost::none) monero_utils::addJsonMember("minorVersion", m_minor_version.get(), allocator, root, value_num);
    if (m_nonce != boost::none) monero_utils::addJsonMember("nonce", m_nonce.get(), allocator, root, value_num);
    if (m_miner_tx_hash != boost::none) monero_utils::addJsonMember("minerTxHash", m_miner_tx_hash.get(), allocator, root, value_num);
    if (m_num_txs != boost::none) monero_utils::addJsonMember("numTxs", m_num_txs.get(), allocator, root, value_num);
    if (m_reward != boost::none) monero_utils::addJsonMember("reward", m_reward.get(), allocator, root, value_num);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_hash != boost::none) monero_utils::addJsonMember("hash", m_hash.get(), allocator, root, value_str);
    if (m_prev_hash != boost::none) monero_utils::addJsonMember("prevHash", m_prev_hash.get(), allocator, root, value_str);
    if (m_pow_hash != boost::none) monero_utils::addJsonMember("powHash", m_pow_hash.get(), allocator, root, value_str);

    // set bool values
    if (m_orphan_status != boost::none) monero_utils::addJsonMember("orphanStatus", m_orphan_status.get(), allocator, root);

    // return root
    return root;
  }

  void monero_block_header::merge(const shared_ptr<monero_block_header>& self, const shared_ptr<monero_block_header>& other) {
    if (this != self.get()) throw runtime_error("this != self");
    if (self == other) return;
    m_hash = gen_utils::reconcile(m_hash, other->m_hash);
    m_height = gen_utils::reconcile(m_height, other->m_height, boost::none, boost::none, true, "block height"); // height can increase
    m_timestamp = gen_utils::reconcile(m_timestamp, other->m_timestamp, boost::none, boost::none, true, "block header timestamp");  // timestamp can increase
    m_size = gen_utils::reconcile(m_size, other->m_size, "block header size");
    m_weight = gen_utils::reconcile(m_weight, other->m_weight, "block header weight");
    m_long_term_weight = gen_utils::reconcile(m_long_term_weight, other->m_long_term_weight, "block header long term weight");
    m_depth = gen_utils::reconcile(m_depth, other->m_depth, "block header depth");
    m_difficulty = gen_utils::reconcile(m_difficulty, other->m_difficulty, "difficulty");
    m_cumulative_difficulty = gen_utils::reconcile(m_cumulative_difficulty, other->m_cumulative_difficulty, "m_cumulative_difficulty");
    m_major_version = gen_utils::reconcile(m_major_version, other->m_major_version, "m_major_version");
    m_minor_version = gen_utils::reconcile(m_minor_version, other->m_minor_version, "m_minor_version");
    m_nonce = gen_utils::reconcile(m_nonce, other->m_nonce, "m_nonce");
    m_miner_tx_hash = gen_utils::reconcile(m_miner_tx_hash, other->m_miner_tx_hash);
    m_num_txs = gen_utils::reconcile(m_num_txs, other->m_num_txs, "block header m_num_txs");
    m_orphan_status = gen_utils::reconcile(m_orphan_status, other->m_orphan_status);
    m_prev_hash = gen_utils::reconcile(m_prev_hash, other->m_prev_hash);
    m_reward = gen_utils::reconcile(m_reward, other->m_reward, "block header m_reward");
    m_pow_hash = gen_utils::reconcile(m_pow_hash, other->m_pow_hash);
  }

  // ----------------------------- MONERO BLOCK -------------------------------

  rapidjson::Value monero_block::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // serialize root from superclass
    rapidjson::Value root = monero_block_header::to_rapidjson_val(allocator);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_hex != boost::none) monero_utils::addJsonMember("hex", m_hex.get(), allocator, root, value_str);

    // set sub-arrays
    if (!m_txs.empty()) root.AddMember("txs", monero_utils::to_rapidjson_val(allocator, m_txs), allocator);
    if (!m_tx_hashes.empty()) root.AddMember("txIds", monero_utils::to_rapidjson_val(allocator, m_tx_hashes), allocator);

    // set sub-objects
    if (m_miner_tx != boost::none) root.AddMember("minerTx", m_miner_tx.get()->to_rapidjson_val(allocator), allocator);

    // return root
    return root;
  }

  void monero_block::merge(const shared_ptr<monero_block_header>& self, const shared_ptr<monero_block_header>& other) {
    merge(static_pointer_cast<monero_block>(self), static_pointer_cast<monero_block>(other));
  }

  void monero_block::merge(const shared_ptr<monero_block>& self, const shared_ptr<monero_block>& other) {
    if (this != self.get()) throw runtime_error("this != self");
    if (self == other) return;

    // merge header fields
    monero_block_header::merge(self, other);

    // merge reconcilable block extensions
    m_hex = gen_utils::reconcile(m_hex, other->m_hex);
    m_tx_hashes = gen_utils::reconcile(m_tx_hashes, other->m_tx_hashes);

    // merge miner tx
    if (m_miner_tx == boost::none) m_miner_tx = other->m_miner_tx;
    if (other->m_miner_tx != boost::none) {
      other->m_miner_tx.get()->m_block = self;
      m_miner_tx.get()->merge(m_miner_tx.get(), other->m_miner_tx.get());
    }

    // merge non-miner txs
    if (!other->m_txs.empty()) {
      for (const shared_ptr<monero_tx> otherTx : other->m_txs) { // NOTE: not using reference so shared_ptr is not deleted when block is dereferenced
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
    if (m_version != boost::none) monero_utils::addJsonMember("version", m_version.get(), allocator, root, value_num);
    if (m_fee != boost::none) monero_utils::addJsonMember("fee", m_fee.get(), allocator, root, value_num);
    if (m_ring_size != boost::none) monero_utils::addJsonMember("ringSize", m_ring_size.get(), allocator, root, value_num);
    if (m_num_confirmations != boost::none) monero_utils::addJsonMember("numConfirmations", m_num_confirmations.get(), allocator, root, value_num);
    if (m_unlock_time != boost::none) monero_utils::addJsonMember("unlockTime", m_unlock_time.get(), allocator, root, value_num);
    if (m_last_relayed_timestamp != boost::none) monero_utils::addJsonMember("lastRelayedTimestamp", m_last_relayed_timestamp.get(), allocator, root, value_num);
    if (m_received_timestamp != boost::none) monero_utils::addJsonMember("receivedTimestamp", m_received_timestamp.get(), allocator, root, value_num);
    if (m_size != boost::none) monero_utils::addJsonMember("size", m_size.get(), allocator, root, value_num);
    if (m_weight != boost::none) monero_utils::addJsonMember("weight", m_weight.get(), allocator, root, value_num);
    if (m_last_failed_height != boost::none) monero_utils::addJsonMember("lastFailedHeight", m_last_failed_height.get(), allocator, root, value_num);
    if (m_max_used_block_height != boost::none) monero_utils::addJsonMember("maxUsedBlockHeight", m_max_used_block_height.get(), allocator, root, value_num);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_hash != boost::none) monero_utils::addJsonMember("hash", m_hash.get(), allocator, root, value_str);
    if (m_payment_id != boost::none) monero_utils::addJsonMember("paymentId", m_payment_id.get(), allocator, root, value_str);
    if (m_key != boost::none) monero_utils::addJsonMember("key", m_key.get(), allocator, root, value_str);
    if (m_full_hex != boost::none) monero_utils::addJsonMember("fullHex", m_full_hex.get(), allocator, root, value_str);
    if (m_pruned_hex != boost::none) monero_utils::addJsonMember("prunedHex", m_pruned_hex.get(), allocator, root, value_str);
    if (m_prunable_hex != boost::none) monero_utils::addJsonMember("prunableHex", m_prunable_hex.get(), allocator, root, value_str);
    if (m_prunable_hash != boost::none) monero_utils::addJsonMember("prunableHash", m_prunable_hash.get(), allocator, root, value_str);
    if (m_metadata != boost::none) monero_utils::addJsonMember("metadata", m_metadata.get(), allocator, root, value_str);
    if (m_common_tx_sets != boost::none) monero_utils::addJsonMember("commonTxSets", m_common_tx_sets.get(), allocator, root, value_str);
    if (m_rct_signatures != boost::none) monero_utils::addJsonMember("rctSignatures", m_rct_signatures.get(), allocator, root, value_str);
    if (m_rct_sig_prunable != boost::none) monero_utils::addJsonMember("rctSigPrunable", m_rct_sig_prunable.get(), allocator, root, value_str);
    if (m_last_failed_hash != boost::none) monero_utils::addJsonMember("lastFailedHash", m_last_failed_hash.get(), allocator, root, value_str);
    if (m_max_used_block_hash != boost::none) monero_utils::addJsonMember("maxUsedBlockHash", m_max_used_block_hash.get(), allocator, root, value_str);

    // set bool values
    if (m_is_miner_tx != boost::none) monero_utils::addJsonMember("isMinerTx", m_is_miner_tx.get(), allocator, root);
    if (m_do_not_relay != boost::none) monero_utils::addJsonMember("doNotRelay", m_do_not_relay.get(), allocator, root);
    if (m_is_relayed != boost::none) monero_utils::addJsonMember("isRelayed", m_is_relayed.get(), allocator, root);
    if (m_is_confirmed != boost::none) monero_utils::addJsonMember("isConfirmed", m_is_confirmed.get(), allocator, root);
    if (m_in_tx_pool != boost::none) monero_utils::addJsonMember("inTxPool", m_in_tx_pool.get(), allocator, root);
    if (m_is_double_spend_seen != boost::none) monero_utils::addJsonMember("isDoubleSpendSeen", m_is_double_spend_seen.get(), allocator, root);
    if (m_is_kept_by_block != boost::none) monero_utils::addJsonMember("isKeptByBlock", m_is_kept_by_block.get(), allocator, root);
    if (m_is_failed != boost::none) monero_utils::addJsonMember("isFailed", m_is_failed.get(), allocator, root);

    // set sub-arrays
    if (!m_vins.empty()) root.AddMember("vins", monero_utils::to_rapidjson_val(allocator, m_vins), allocator);
    if (!m_vouts.empty()) root.AddMember("vouts", monero_utils::to_rapidjson_val(allocator, m_vouts), allocator);
    if (!m_output_indices.empty()) root.AddMember("outputIndices", monero_utils::to_rapidjson_val(allocator, m_output_indices), allocator);
    if (!m_extra.empty()) root.AddMember("extra", monero_utils::to_rapidjson_val(allocator, m_extra), allocator);
    if (!m_signatures.empty()) root.AddMember("signatures", monero_utils::to_rapidjson_val(allocator, m_signatures), allocator);

    // return root
    return root;
  }

  void monero_tx::from_property_tree(const boost::property_tree::ptree& node, shared_ptr<monero_tx> tx) {

    // initialize tx from node
    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      string key = it->first;
      if (key == string("hash")) tx->m_hash = it->second.data();
      else if (key == string("version")) throw runtime_error("version deserializationn not implemented");
      else if (key == string("isMinerTx")) tx->m_is_miner_tx = it->second.get_value<bool>();
      else if (key == string("paymentId")) tx->m_payment_id = it->second.data(); // TODO: this threw runtime_error, how is "Can get transactions by payment ids" test passing in Java?
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
      else if (key == string("metadata")) tx->m_metadata = it->second.data();
      else if (key == string("commonTxSets")) throw runtime_error("commonTxSets deserialization not implemented");
      else if (key == string("extra")) throw runtime_error("extra deserialization not implemented");
      else if (key == string("rctSignatures")) throw runtime_error("rctSignatures deserialization not implemented");
      else if (key == string("rctSigPrunable")) throw runtime_error("rctSigPrunable deserialization not implemented");
      else if (key == string("isKeptByBlock")) tx->m_is_kept_by_block = it->second.get_value<bool>();
      else if (key == string("isFailed")) tx->m_is_failed = it->second.get_value<bool>();
      else if (key == string("lastFailedHeight")) throw runtime_error("lastFailedHeight deserialization not implemented");
      else if (key == string("lastFailedHash")) tx->m_last_failed_hash = it->second.data();
      else if (key == string("maxUsedBlockHeight")) throw runtime_error("maxUsedBlockHeight deserialization not implemented");
      else if (key == string("maxUsedBlockHash")) tx->m_max_used_block_hash = it->second.data();
      else if (key == string("signatures")) throw runtime_error("signatures deserialization not implemented");
    }
  }

  shared_ptr<monero_tx> monero_tx::copy(const shared_ptr<monero_tx>& src, const shared_ptr<monero_tx>& tgt) const {
    MTRACE("monero_tx::copy(const shared_ptr<monero_tx>& src, const shared_ptr<monero_tx>& tgt)");
    tgt->m_hash = src->m_hash;
    tgt->m_version = src->m_version;
    tgt->m_is_miner_tx = src->m_is_miner_tx;
    tgt->m_payment_id = src->m_payment_id;
    tgt->m_fee = src->m_fee;
    tgt->m_ring_size = src->m_ring_size;
    tgt->m_do_not_relay = src->m_do_not_relay;
    tgt->m_is_relayed = src->m_is_relayed;
    tgt->m_is_confirmed = src->m_is_confirmed;
    tgt->m_in_tx_pool = src->m_in_tx_pool;
    tgt->m_num_confirmations = src->m_num_confirmations;
    tgt->m_unlock_time = src->m_unlock_time;
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
    if (!src->m_vins.empty()) {
      tgt->m_vins = vector<shared_ptr<monero_output>>();
      for (const shared_ptr<monero_output>& vin : src->m_vins) {
        shared_ptr<monero_output> vinCopy = vin->copy(vin, make_shared<monero_output>());
        vinCopy->m_tx = tgt;
        tgt->m_vins.push_back(vinCopy);
      }
    }
    if (!src->m_vouts.empty()) {
      tgt->m_vouts = vector<shared_ptr<monero_output>>();
      for (const shared_ptr<monero_output>& vout : src->m_vouts) {
        shared_ptr<monero_output> voutCopy = vout->copy(vout, make_shared<monero_output>());
        voutCopy->m_tx = tgt;
        tgt->m_vouts.push_back(voutCopy);
      }
    }
    if (!src->m_output_indices.empty()) tgt->m_output_indices = vector<uint32_t>(src->m_output_indices);
    tgt->m_metadata = src->m_metadata;
    tgt->m_common_tx_sets = src->m_common_tx_sets;
    if (!src->m_extra.empty()) throw runtime_error("extra deep copy not implemented");  // TODO: implement extra
    tgt->m_rct_signatures = src->m_rct_signatures;
    tgt->m_rct_sig_prunable = src->m_rct_sig_prunable;
    tgt->m_is_kept_by_block = src->m_is_kept_by_block;
    tgt->m_is_failed = src->m_is_failed;
    tgt->m_last_failed_height = src->m_last_failed_height;
    tgt->m_last_failed_hash = src->m_last_failed_hash;
    tgt->m_max_used_block_height = src->m_max_used_block_height;
    tgt->m_max_used_block_hash = src->m_max_used_block_hash;
    if (!src->m_signatures.empty()) tgt->m_signatures = vector<string>(src->m_signatures);
    return tgt;
  }

  boost::optional<uint64_t> monero_tx::get_height() const {
    if (m_block == boost::none) return boost::none;
    return *((*m_block)->m_height);
  }

  void monero_tx::merge(const shared_ptr<monero_tx>& self, const shared_ptr<monero_tx>& other) {
    if (this != self.get()) throw runtime_error("this != self");
    if (self == other) return;

    // merge blocks if they're different which comes back to merging txs
    if (m_block != other->m_block) {
      if (m_block == boost::none) {
        m_block = make_shared<monero_block>();
        m_block.get()->m_txs.push_back(self);
        m_block.get()->m_height = other->get_height();
      }
      if (other->m_block == boost::none) {
        other->m_block = make_shared<monero_block>();
        other->m_block.get()->m_txs.push_back(other);
        other->m_block.get()->m_height = self->get_height();
      }
      m_block.get()->merge(m_block.get(), other->m_block.get());
      return;
    }

    // otherwise merge tx fields
    m_hash = gen_utils::reconcile(m_hash, other->m_hash);
    m_version = gen_utils::reconcile(m_version, other->m_version);
    m_payment_id = gen_utils::reconcile(m_payment_id, other->m_payment_id);
    m_fee = gen_utils::reconcile(m_fee, other->m_fee, "tx fee");
    m_ring_size = gen_utils::reconcile(m_ring_size, other->m_ring_size, "tx m_ring_size");
    m_is_confirmed = gen_utils::reconcile(m_is_confirmed, other->m_is_confirmed);
    m_do_not_relay = gen_utils::reconcile(m_do_not_relay, other->m_do_not_relay);
    m_is_relayed = gen_utils::reconcile(m_is_relayed, other->m_is_relayed);
    m_is_double_spend_seen = gen_utils::reconcile(m_is_double_spend_seen, other->m_is_double_spend_seen);
    m_key = gen_utils::reconcile(m_key, other->m_key);
    m_full_hex = gen_utils::reconcile(m_full_hex, other->m_full_hex);
    m_pruned_hex = gen_utils::reconcile(m_pruned_hex, other->m_pruned_hex);
    m_prunable_hex = gen_utils::reconcile(m_prunable_hex, other->m_prunable_hex);
    m_prunable_hash = gen_utils::reconcile(m_prunable_hash, other->m_prunable_hash);
    m_size = gen_utils::reconcile(m_size, other->m_size, "tx size");
    m_weight = gen_utils::reconcile(m_weight, other->m_weight, "tx weight");
    //m_output_indices = gen_utils::reconcile(m_output_indices, other->m_output_indices);  // TODO
    m_metadata = gen_utils::reconcile(m_metadata, other->m_metadata);
    m_common_tx_sets = gen_utils::reconcile(m_common_tx_sets, other->m_common_tx_sets);
    //m_extra = gen_utils::reconcile(m_extra, other->m_extra);  // TODO
    m_rct_signatures = gen_utils::reconcile(m_rct_signatures, other->m_rct_signatures);
    m_rct_sig_prunable = gen_utils::reconcile(m_rct_sig_prunable, other->m_rct_sig_prunable);
    m_is_kept_by_block = gen_utils::reconcile(m_is_kept_by_block, other->m_is_kept_by_block);
    m_is_failed = gen_utils::reconcile(m_is_failed, other->m_is_failed);
    m_last_failed_height = gen_utils::reconcile(m_last_failed_height, other->m_last_failed_height, "m_last_failed_height");
    m_last_failed_hash = gen_utils::reconcile(m_last_failed_hash, other->m_last_failed_hash);
    m_max_used_block_height = gen_utils::reconcile(m_max_used_block_height, other->m_max_used_block_height, "max_used_block_height");
    m_max_used_block_hash = gen_utils::reconcile(m_max_used_block_hash, other->m_max_used_block_hash);
    //m_signatures = gen_utils::reconcile(m_signatures, other->m_signatures); // TODO
    m_unlock_time = gen_utils::reconcile(m_unlock_time, other->m_unlock_time, "m_unlock_time");
    m_num_confirmations = gen_utils::reconcile(m_num_confirmations, other->m_num_confirmations, "m_num_confirmations");

    // merge vins
    if (!other->m_vins.empty()) {
      for (const shared_ptr<monero_output>& merger : other->m_vins) {
        bool merged = false;
        merger->m_tx = self;
        for (const shared_ptr<monero_output>& mergee : m_vins) {
          if ((*mergee->m_key_image)->m_hex == (*merger->m_key_image)->m_hex) {
            mergee->merge(mergee, merger);
            merged = true;
            break;
          }
        }
        if (!merged) m_vins.push_back(merger);
      }
    }

    // merge vouts
    if (!other->m_vouts.empty()) {
      for (const shared_ptr<monero_output>& vout : other->m_vouts) vout->m_tx = self;
      if (m_vouts.empty()) m_vouts = other->m_vouts;
      else {

        // validate output indices if present
        int num_indices = 0;
        for (const shared_ptr<monero_output>& vout : this->m_vouts) if (vout->m_index != boost::none) num_indices++;
        for (const shared_ptr<monero_output>& vout : other->m_vouts) if (vout->m_index != boost::none) num_indices++;
        if (num_indices != 0 && this->m_vouts.size() + other->m_vouts.size() != num_indices) {
          throw runtime_error("Some vouts have an output index and some do not");
        }

        // merge by output indices if present
        if (num_indices > 0) {
          for (const shared_ptr<monero_output>& merger : other->m_vouts) {
            bool merged = false;
            merger->m_tx = self;
            for (const shared_ptr<monero_output>& mergee : this->m_vouts) {
              if (mergee->m_index.get() == merger->m_index.get()) {
                mergee->merge(mergee, merger);
                merged = true;
                break;
              }
            }
            if (!merged) this->m_vouts.push_back(merger);
          }
        } else {

          // determine if key images present
          int numKeyImages = 0;
          for (const shared_ptr<monero_output> vout : m_vouts) {
            if (vout->m_key_image != boost::none) {
              if ((*vout->m_key_image)->m_hex == boost::none) throw runtime_error("Key image hex cannot be null");
              numKeyImages++;
            }
          }
          for (const shared_ptr<monero_output>& vout : other->m_vouts) {
            if (vout->m_key_image != boost::none) {
              if ((*vout->m_key_image)->m_hex == boost::none) throw runtime_error("Key image hex cannot be null");
              numKeyImages++;
            }
          }
          if (numKeyImages != 0 && m_vouts.size() + other->m_vouts.size() != numKeyImages) throw runtime_error("Some vouts have a key image and some do not");

          // merge by key images
          if (numKeyImages > 0) {
            for (const shared_ptr<monero_output>& merger : other->m_vouts) {
              bool merged = false;
              merger->m_tx = self;
              for (const shared_ptr<monero_output>& mergee : m_vouts) {
                if ((*mergee->m_key_image)->m_hex == (*merger->m_key_image)->m_hex) {
                  mergee->merge(mergee, merger);
                  merged = true;
                  break;
                }
              }
              if (!merged) m_vouts.push_back(merger);
            }
          }

          // merge by position
          else {
            if (m_vouts.size() != other->m_vouts.size()) throw runtime_error("Vout sizes are different");
            for (int i = 0; i < other->m_vouts.size(); i++) {
              m_vouts.at(i)->merge(m_vouts.at(i), other->m_vouts.at(i));
            }
          }
        }
      }
    }

    // handle unrelayed -> relayed -> confirmed
    if (*m_is_confirmed) {
      m_in_tx_pool = false;
      m_received_timestamp = boost::none;
      m_last_relayed_timestamp = boost::none;
    } else {
      m_in_tx_pool = gen_utils::reconcile(m_in_tx_pool, other->m_in_tx_pool, boost::none, true, boost::none); // unrelayed -> tx pool
      m_received_timestamp = gen_utils::reconcile(m_received_timestamp, other->m_received_timestamp, boost::none, boost::none, false, "m_received_timestamp"); // take earliest receive time
      m_last_relayed_timestamp = gen_utils::reconcile(m_last_relayed_timestamp, other->m_last_relayed_timestamp, boost::none, boost::none, true, "m_last_relayed_timestamp"); // take latest relay time
    }
  }

  // --------------------------- MONERO KEY IMAGE -----------------------------

  rapidjson::Value monero_key_image::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set string values
    rapidjson::Value value_str(rapidjson::kStringType);
    if (m_hex != boost::none) monero_utils::addJsonMember("hex", m_hex.get(), allocator, root, value_str);
    if (m_signature != boost::none) monero_utils::addJsonMember("signature", m_signature.get(), allocator, root, value_str);

    // return root
    return root;
  }

  void monero_key_image::from_property_tree(const boost::property_tree::ptree& node, const shared_ptr<monero_key_image>& key_image) {

    // initialize key image from node
    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      string key = it->first;
      if (key == string("hex")) key_image->m_hex = it->second.data();
      else if (key == string("signature")) key_image->m_signature = it->second.data();
    }
  }

  vector<shared_ptr<monero_key_image>> monero_key_image::deserialize_key_images(const string& key_images_json) {

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
          shared_ptr<monero_key_image> key_image = make_shared<monero_key_image>();
          monero_key_image::from_property_tree(it2->second, key_image);
          key_images.push_back(key_image);
        }
      }
      else MWARNING("WARNING MoneroWalletJni::deserialize_key_images() unrecognized key: " << key);
    }
    return key_images;
  }

  shared_ptr<monero_key_image> monero_key_image::copy(const shared_ptr<monero_key_image>& src, const shared_ptr<monero_key_image>& tgt) const {
    if (this != src.get()) throw runtime_error("this != src");
    tgt->m_hex = src->m_hex;
    tgt->m_signature = src->m_signature;
    return tgt;
  }

  void monero_key_image::merge(const shared_ptr<monero_key_image>& self, const shared_ptr<monero_key_image>& other) {
    throw runtime_error("Not implemented");
  }

  // ------------------------------ MONERO OUTPUT -----------------------------

  rapidjson::Value monero_output::to_rapidjson_val(rapidjson::Document::AllocatorType& allocator) const {

    // create root
    rapidjson::Value root(rapidjson::kObjectType);

    // set num values
    rapidjson::Value value_num(rapidjson::kNumberType);
    if (m_amount != boost::none) monero_utils::addJsonMember("amount", m_amount.get(), allocator, root, value_num);
    if (m_index != boost::none) monero_utils::addJsonMember("index", m_index.get(), allocator, root, value_num);
    if (m_stealth_public_key != boost::none) monero_utils::addJsonMember("stealthPublicKey", m_stealth_public_key.get(), allocator, root, value_num);

    // set sub-arrays
    if (!m_ring_output_indices.empty()) root.AddMember("ringOutputIndices", monero_utils::to_rapidjson_val(allocator, m_ring_output_indices), allocator);

    // set sub-objects
    if (m_key_image != boost::none) root.AddMember("keyImage", m_key_image.get()->to_rapidjson_val(allocator), allocator);

    // return root
    return root;
  }

  void monero_output::from_property_tree(const boost::property_tree::ptree& node, const shared_ptr<monero_output>& output) {

    // initialize output from node
    for (boost::property_tree::ptree::const_iterator it = node.begin(); it != node.end(); ++it) {
      string key = it->first;
      if (key == string("keyImage")) {
        output->m_key_image = make_shared<monero_key_image>();
        monero_key_image::from_property_tree(it->second, output->m_key_image.get());
      }
      else if (key == string("amount")) output->m_amount = it->second.get_value<uint64_t>();
      else if (key == string("index")) output->m_index = it->second.get_value<uint32_t>();
      else if (key == string("ringOutputIndices")) throw runtime_error("node_to_tx() deserialize ringOutputIndices not implemented");
      else if (key == string("stealthPublicKey")) throw runtime_error("node_to_tx() deserialize stealthPublicKey not implemented");
      else cout << "WARNING: unrecognized field deserializing node to output: " << key << endl;
    }
  }

  shared_ptr<monero_output> monero_output::copy(const shared_ptr<monero_output>& src, const shared_ptr<monero_output>& tgt) const {
    if (this != src.get()) throw runtime_error("this != src");
    tgt->m_tx = src->m_tx;  // reference same parent tx by default
    if (src->m_key_image != boost::none) tgt->m_key_image = src->m_key_image.get()->copy(src->m_key_image.get(), make_shared<monero_key_image>());
    tgt->m_amount = src->m_amount;
    tgt->m_index = src->m_index;
    if (!src->m_ring_output_indices.empty()) tgt->m_ring_output_indices = vector<uint64_t>(src->m_ring_output_indices);
    tgt->m_stealth_public_key = src->m_stealth_public_key;
    return tgt;
  }

  void monero_output::merge(const shared_ptr<monero_output>& self, const shared_ptr<monero_output>& other) {
    if (this != self.get()) throw runtime_error("this != self");
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
