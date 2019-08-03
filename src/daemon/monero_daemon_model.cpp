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
      if (aTx->id.get() == tx->id.get()) {
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
    return monero_utils::serialize(to_property_tree());
  }

  // ------------------------- MONERO BLOCK HEADER ----------------------------

  boost::property_tree::ptree monero_block_header::to_property_tree() const {
    boost::property_tree::ptree node;
    if (id != boost::none) node.put("id", *id);
    if (height != boost::none) node.put("height", *height);
    if (timestamp != boost::none) node.put("timestamp", *timestamp);
    if (size != boost::none) node.put("size", *size);
    if (weight != boost::none) node.put("weight", *weight);
    if (long_term_weight != boost::none) node.put("long_term_weight", *long_term_weight);
    if (depth != boost::none) node.put("depth", *depth);
    if (difficulty != boost::none) node.put("difficulty", *difficulty);
    if (cumulative_difficulty != boost::none) node.put("cumulative_difficulty", *height);
    if (major_version != boost::none) node.put("major_version", *major_version);
    if (minor_version != boost::none) node.put("minor_version", *minor_version);
    if (nonce != boost::none) node.put("nonce", *nonce);
    if (miner_tx_id != boost::none) node.put("miner_tx_id", *miner_tx_id);
    if (num_txs != boost::none) node.put("num_txs", *num_txs);
    if (orphan_status != boost::none) node.put("orphan_status", *orphan_status);
    if (prev_id != boost::none) node.put("prev_id", *prev_id);
    if (reward != boost::none) node.put("reward", *reward);
    if (pow_hash != boost::none) node.put("pow_hash", *pow_hash);
    return node;
  }

  void monero_block_header::merge(const shared_ptr<monero_block_header>& self, const shared_ptr<monero_block_header>& other) {
    if (this != self.get()) throw runtime_error("this != self");
    if (self == other) return;
    id = monero_utils::reconcile(id, other->id);
    height = monero_utils::reconcile(height, other->height, boost::none, boost::none, true, "block height"); // height can increase
    timestamp = monero_utils::reconcile(timestamp, other->timestamp, boost::none, boost::none, true, "block header timestamp");  // timestamp can increase
    size = monero_utils::reconcile(size, other->size, "block header size");
    weight = monero_utils::reconcile(weight, other->weight, "block header weight");
    long_term_weight = monero_utils::reconcile(long_term_weight, other->long_term_weight, "block header long term weight");
    depth = monero_utils::reconcile(depth, other->depth, "block header depth");
    difficulty = monero_utils::reconcile(difficulty, other->difficulty, "difficulty");
    cumulative_difficulty = monero_utils::reconcile(cumulative_difficulty, other->cumulative_difficulty, "cumulative_difficulty");
    major_version = monero_utils::reconcile(major_version, other->major_version, "major_version");
    minor_version = monero_utils::reconcile(minor_version, other->minor_version, "minor_version");
    nonce = monero_utils::reconcile(nonce, other->nonce, "nonce");
    miner_tx_id = monero_utils::reconcile(miner_tx_id, other->miner_tx_id);
    num_txs = monero_utils::reconcile(num_txs, other->num_txs, "block header num_txs");
    orphan_status = monero_utils::reconcile(orphan_status, other->orphan_status);
    prev_id = monero_utils::reconcile(prev_id, other->prev_id);
    reward = monero_utils::reconcile(reward, other->reward, "block header reward");
    pow_hash = monero_utils::reconcile(pow_hash, other->pow_hash);
  }

  // ----------------------------- MONERO BLOCK -------------------------------

  boost::property_tree::ptree monero_block::to_property_tree() const {
    boost::property_tree::ptree node = monero_block_header::to_property_tree();
    if (hex != boost::none) node.put("hex", *hex);
    if (miner_tx != boost::none) node.add_child("miner_tx", (*miner_tx)->to_property_tree());
    if (!txs.empty()) node.add_child("txs", monero_utils::to_property_tree(txs));
    if (!tx_ids.empty()) node.add_child("tx_ids", monero_utils::to_property_tree(tx_ids));
    return node;
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
    hex = monero_utils::reconcile(hex, other->hex);
    tx_ids = monero_utils::reconcile(tx_ids, other->tx_ids);

    // merge miner tx
    if (miner_tx == boost::none) miner_tx = other->miner_tx;
    if (other->miner_tx != boost::none) {
      other->miner_tx.get()->block = self;
      miner_tx.get()->merge(miner_tx.get(), other->miner_tx.get());
    }

    // merge non-miner txs
    if (!other->txs.empty()) {
      for (const shared_ptr<monero_tx> otherTx : other->txs) { // NOTE: not using reference so shared_ptr is not deleted when block is dereferenced
        otherTx->block = self;
        merge_tx(self->txs, otherTx);
      }
    }
  }

  // ------------------------------- MONERO TX --------------------------------

  shared_ptr<monero_tx> monero_tx::copy(const shared_ptr<monero_tx>& src, const shared_ptr<monero_tx>& tgt) const {
    MTRACE("monero_tx::copy(const shared_ptr<monero_tx>& src, const shared_ptr<monero_tx>& tgt)");
    tgt->id = src->id;
    tgt->version = src->version;
    tgt->is_miner_tx = src->is_miner_tx;
    tgt->payment_id = src->payment_id;
    tgt->fee = src->fee;
    tgt->mixin = src->mixin;
    tgt->do_not_relay = src->do_not_relay;
    tgt->is_relayed = src->is_relayed;
    tgt->is_confirmed = src->is_confirmed;
    tgt->in_tx_pool = src->in_tx_pool;
    tgt->num_confirmations = src->num_confirmations;
    tgt->unlock_time = src->unlock_time;
    tgt->last_relayed_timestamp = src->last_relayed_timestamp;
    tgt->received_timestamp = src->received_timestamp;
    tgt->is_double_spend_seen = src->is_double_spend_seen;
    tgt->key = src->key;
    tgt->full_hex = src->full_hex;
    tgt->pruned_hex = src->pruned_hex;
    tgt->prunable_hex = src->prunable_hex;
    tgt->prunable_hash = src->prunable_hash;
    tgt->size = src->size;
    tgt->weight = src->weight;
    if (!src->vins.empty()) {
      tgt->vins = vector<shared_ptr<monero_output>>();
      for (const shared_ptr<monero_output>& vin : src->vins) {
        shared_ptr<monero_output> vinCopy = vin->copy(vin, make_shared<monero_output>());
        vinCopy->tx = tgt;
        tgt->vins.push_back(vinCopy);
      }
    }
    if (!src->vouts.empty()) {
      tgt->vouts = vector<shared_ptr<monero_output>>();
      for (const shared_ptr<monero_output>& vout : src->vouts) {
        shared_ptr<monero_output> voutCopy = vout->copy(vout, make_shared<monero_output>());
        voutCopy->tx = tgt;
        tgt->vouts.push_back(voutCopy);
      }
    }
    if (!src->m_output_indices.empty()) tgt->m_output_indices = vector<uint32_t>(src->m_output_indices);
    tgt->metadata = src->metadata;
    tgt->common_tx_sets = src->common_tx_sets;
    if (!src->extra.empty()) throw runtime_error("extra deep copy not implemented");  // TODO: implement extra
    tgt->rct_signatures = src->rct_signatures;
    tgt->rct_sig_prunable = src->rct_sig_prunable;
    tgt->is_kept_by_block = src->is_kept_by_block;
    tgt->is_failed = src->is_failed;
    tgt->last_failed_height = src->last_failed_height;
    tgt->last_failed_id = src->last_failed_id;
    tgt->max_used_block_height = src->max_used_block_height;
    tgt->max_used_block_id = src->max_used_block_id;
    if (!src->signatures.empty()) tgt->signatures = vector<string>(src->signatures);
    return tgt;
  }

  boost::property_tree::ptree monero_tx::to_property_tree() const {
    boost::property_tree::ptree node;
    if (id != boost::none) node.put("id", *id);
    if (version != boost::none) node.put("version", *version);
    if (is_miner_tx != boost::none) node.put("is_miner_tx", *is_miner_tx);
    if (payment_id != boost::none) node.put("payment_id", *payment_id);
    if (fee != boost::none) node.put("fee", *fee);
    if (mixin != boost::none) node.put("mixin", *mixin);
    if (do_not_relay != boost::none) node.put("do_not_relay", *do_not_relay);
    if (is_relayed != boost::none) node.put("is_relayed", *is_relayed);
    if (is_confirmed != boost::none) node.put("is_confirmed", *is_confirmed);
    if (in_tx_pool != boost::none) node.put("in_tx_pool", *in_tx_pool);
    if (num_confirmations != boost::none) node.put("num_confirmations", *num_confirmations);
    if (unlock_time != boost::none) node.put("unlock_time", *unlock_time);
    if (last_relayed_timestamp != boost::none) node.put("last_relayed_timestamp", *last_relayed_timestamp);
    if (received_timestamp != boost::none) node.put("received_timestamp", *received_timestamp);
    if (is_double_spend_seen != boost::none) node.put("is_double_spend_seen", *is_double_spend_seen);
    if (key != boost::none) node.put("key", *key);
    if (full_hex != boost::none) node.put("full_hex", *full_hex);
    if (pruned_hex != boost::none) node.put("pruned_hex", *pruned_hex);
    if (prunable_hex != boost::none) node.put("prunable_hex", *prunable_hex);
    if (prunable_hash != boost::none) node.put("prunable_hash", *prunable_hash);
    if (size != boost::none) node.put("size", *size);
    if (weight != boost::none) node.put("weight", *weight);
    if (!vins.empty()) node.add_child("vins", monero_utils::to_property_tree(vins));
    if (!vouts.empty()) node.add_child("vouts", monero_utils::to_property_tree(vouts));
    if (!m_output_indices.empty()) throw runtime_error("m_output_indices not implemented");
    if (metadata != boost::none) node.put("metadata", *metadata);
    if (common_tx_sets != boost::none) throw runtime_error("common_tx_sets not implemented");
    if (!extra.empty()) node.add_child("extra", monero_utils::to_property_tree(extra));
    if (rct_signatures != boost::none) throw runtime_error("rct_signatures not implemented");
    if (rct_sig_prunable != boost::none) throw runtime_error("rct_sig_prunable not implemented");
    if (is_kept_by_block != boost::none) node.put("is_kept_by_block", *is_kept_by_block);
    if (is_failed != boost::none) node.put("is_failed", *is_failed);
    if (last_failed_height != boost::none) node.put("last_failed_height", *last_failed_height);
    if (last_failed_id != boost::none) node.put("last_failed_id", *last_failed_id);
    if (max_used_block_height != boost::none) node.put("max_used_block_height", *max_used_block_height);
    if (max_used_block_id != boost::none) node.put("max_used_block_id", *max_used_block_id);
    if (!signatures.empty()) throw runtime_error("signatures not implemented");
    return node;
  }

  boost::optional<uint64_t> monero_tx::get_height() const {
    if (block == boost::none) return boost::none;
    return *((*block)->height);
  }

  void monero_tx::merge(const shared_ptr<monero_tx>& self, const shared_ptr<monero_tx>& other) {
    if (this != self.get()) throw runtime_error("this != self");
    if (self == other) return;

    // merge blocks if they're different which comes back to merging txs
    if (block != other->block) {
      if (block == boost::none) {
        block = make_shared<monero_block>();
        block.get()->txs.push_back(self);
        block.get()->height = other->get_height();
      }
      if (other->block == boost::none) {
        other->block = make_shared<monero_block>();
        other->block.get()->txs.push_back(other);
        other->block.get()->height = self->get_height();
      }
      block.get()->merge(block.get(), other->block.get());
      return;
    }

    // otherwise merge tx fields
    id = monero_utils::reconcile(id, other->id);
    version = monero_utils::reconcile(version, other->version);
    payment_id = monero_utils::reconcile(payment_id, other->payment_id);
    fee = monero_utils::reconcile(fee, other->fee, "tx fee");
    mixin = monero_utils::reconcile(mixin, other->mixin, "tx mixin");
    is_confirmed = monero_utils::reconcile(is_confirmed, other->is_confirmed);
    do_not_relay = monero_utils::reconcile(do_not_relay, other->do_not_relay);
    is_relayed = monero_utils::reconcile(is_relayed, other->is_relayed);
    is_double_spend_seen = monero_utils::reconcile(is_double_spend_seen, other->is_double_spend_seen);
    key = monero_utils::reconcile(key, other->key);
    full_hex = monero_utils::reconcile(full_hex, other->full_hex);
    pruned_hex = monero_utils::reconcile(pruned_hex, other->pruned_hex);
    prunable_hex = monero_utils::reconcile(prunable_hex, other->prunable_hex);
    prunable_hash = monero_utils::reconcile(prunable_hash, other->prunable_hash);
    size = monero_utils::reconcile(size, other->size, "tx size");
    weight = monero_utils::reconcile(weight, other->weight, "tx weight");
    //m_output_indices = monero_utils::reconcile(m_output_indices, other->m_output_indices);  // TODO
    metadata = monero_utils::reconcile(metadata, other->metadata);
    common_tx_sets = monero_utils::reconcile(common_tx_sets, other->common_tx_sets);
    //extra = monero_utils::reconcile(extra, other->extra);  // TODO
    rct_signatures = monero_utils::reconcile(rct_signatures, other->rct_signatures);
    rct_sig_prunable = monero_utils::reconcile(rct_sig_prunable, other->rct_sig_prunable);
    is_kept_by_block = monero_utils::reconcile(is_kept_by_block, other->is_kept_by_block);
    is_failed = monero_utils::reconcile(is_failed, other->is_failed);
    last_failed_height = monero_utils::reconcile(last_failed_height, other->last_failed_height, "last_failed_height");
    last_failed_id = monero_utils::reconcile(last_failed_id, other->last_failed_id);
    max_used_block_height = monero_utils::reconcile(max_used_block_height, other->max_used_block_height, "max_used_block_height");
    max_used_block_id = monero_utils::reconcile(max_used_block_id, other->max_used_block_id);
    //signatures = monero_utils::reconcile(signatures, other->signatures); // TODO
    unlock_time = monero_utils::reconcile(unlock_time, other->unlock_time, "unlock_time");
    num_confirmations = monero_utils::reconcile(num_confirmations, other->num_confirmations, "num_confirmations");

    // merge vins
    if (!other->vins.empty()) {
      for (const shared_ptr<monero_output>& merger : other->vins) {
        bool merged = false;
        merger->tx = self;
        for (const shared_ptr<monero_output>& mergee : vins) {
          if ((*mergee->key_image)->hex == (*merger->key_image)->hex) {
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
      for (const shared_ptr<monero_output>& vout : other->vouts) vout->tx = self;
      if (vouts.empty()) vouts = other->vouts;
      else {

        // determine if key images present
        int numKeyImages = 0;
        for (const shared_ptr<monero_output> vout : vouts) {
          if (vout->key_image != boost::none) {
            if ((*vout->key_image)->hex == boost::none) throw runtime_error("Key image hex cannot be null");
            numKeyImages++;
          }
        }
        for (const shared_ptr<monero_output>& vout : other->vouts) {
          if (vout->key_image != boost::none) {
            if ((*vout->key_image)->hex == boost::none) throw runtime_error("Key image hex cannot be null");
            numKeyImages++;
          }
        }
        if (numKeyImages != 0 && vouts.size() + other->vouts.size() != numKeyImages) throw runtime_error("Some vouts have a key image and some do not");

        // merge by key images
        if (numKeyImages > 0) {
          for (const shared_ptr<monero_output>& merger : other->vouts) {
            bool merged = false;
            merger->tx = self;
            for (const shared_ptr<monero_output>& mergee : vouts) {
              if ((*mergee->key_image)->hex == (*merger->key_image)->hex) {
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
    if (*is_confirmed) {
      in_tx_pool = false;
      received_timestamp = boost::none;
      last_relayed_timestamp = boost::none;
    } else {
      in_tx_pool = monero_utils::reconcile(in_tx_pool, other->in_tx_pool, boost::none, true, boost::none); // unrelayed -> tx pool
      received_timestamp = monero_utils::reconcile(received_timestamp, other->received_timestamp, boost::none, boost::none, false, "received_timestamp"); // take earliest receive time
      last_relayed_timestamp = monero_utils::reconcile(last_relayed_timestamp, other->last_relayed_timestamp, boost::none, boost::none, true, "last_relayed_timestamp"); // take latest relay time
    }
  }

  // --------------------------- MONERO KEY IMAGE -----------------------------

  shared_ptr<monero_key_image> monero_key_image::copy(const shared_ptr<monero_key_image>& src, const shared_ptr<monero_key_image>& tgt) const {
    if (this != src.get()) throw runtime_error("this != src");
    tgt->hex = src->hex;
    tgt->signature = src->signature;
    return tgt;
  }

  boost::property_tree::ptree monero_key_image::to_property_tree() const {
    boost::property_tree::ptree node;
    if (hex != boost::none) node.put("hex", *hex);
    if (signature != boost::none) node.put("signature", *signature);
    return node;
  }

  void monero_key_image::merge(const shared_ptr<monero_key_image>& self, const shared_ptr<monero_key_image>& other) {
    throw runtime_error("Not implemented");
  }

  // ------------------------------ MONERO OUTPUT -----------------------------

  shared_ptr<monero_output> monero_output::copy(const shared_ptr<monero_output>& src, const shared_ptr<monero_output>& tgt) const {
    if (this != src.get()) throw runtime_error("this != src");
    tgt->tx = src->tx;  // reference same parent tx by default
    if (src->key_image != boost::none) tgt->key_image = src->key_image.get()->copy(src->key_image.get(), make_shared<monero_key_image>());
    tgt->amount = src->amount;
    tgt->index = src->index;
    if (!src->ring_output_indices.empty()) tgt->ring_output_indices = vector<uint64_t>(src->ring_output_indices);
    tgt->stealth_public_key = src->stealth_public_key;
    return tgt;
  }

  boost::property_tree::ptree monero_output::to_property_tree() const {
    boost::property_tree::ptree node;
    if (key_image != boost::none) node.add_child("key_image", (*key_image)->to_property_tree());
    if (amount != boost::none) node.put("amount", *amount);
    if (index != boost::none) node.put("index", *index);
    if (!ring_output_indices.empty()) node.add_child("ring_output_indices", monero_utils::to_property_tree(ring_output_indices));
    if (stealth_public_key != boost::none) node.put("stealth_public_key", *stealth_public_key);
    return node;
  }

  void monero_output::merge(const shared_ptr<monero_output>& self, const shared_ptr<monero_output>& other) {
    if (this != self.get()) throw runtime_error("this != self");
    if (self == other) return;

    // merge txs if they're different which comes back to merging outputs
    if (tx != other->tx) {
      tx->merge(tx, other->tx);
      return;
    }

    // otherwise merge output fields
    if (key_image == boost::none) key_image = other->key_image;
    else if (other->key_image != boost::none) key_image.get()->merge(key_image.get(), other->key_image.get());
    amount = monero_utils::reconcile(amount, other->amount, "output amount");
    index = monero_utils::reconcile(index, other->index, "output index");
  }
}
