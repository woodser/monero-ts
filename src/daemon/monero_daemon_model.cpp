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
    if (longTermWeight != boost::none) node.put("longTermWeight", *longTermWeight);
    if (depth != boost::none) node.put("depth", *depth);
    if (difficulty != boost::none) node.put("difficulty", *difficulty);
    if (cumulativeDifficulty != boost::none) node.put("cumulativeDifficulty", *height);
    if (majorVersion != boost::none) node.put("majorVersion", *majorVersion);
    if (minorVersion != boost::none) node.put("minorVersion", *minorVersion);
    if (nonce != boost::none) node.put("nonce", *nonce);
    if (minerTxId != boost::none) node.put("minerTxId", *minerTxId);
    if (numTxs != boost::none) node.put("numTxs", *numTxs);
    if (orphanStatus != boost::none) node.put("orphanStatus", *orphanStatus);
    if (prevId != boost::none) node.put("prevId", *prevId);
    if (reward != boost::none) node.put("reward", *reward);
    if (powHash != boost::none) node.put("powHash", *powHash);
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
    longTermWeight = monero_utils::reconcile(longTermWeight, other->longTermWeight, "block header long term weight");
    depth = monero_utils::reconcile(depth, other->depth, "block header depth");
    difficulty = monero_utils::reconcile(difficulty, other->difficulty, "difficulty");
    cumulativeDifficulty = monero_utils::reconcile(cumulativeDifficulty, other->cumulativeDifficulty, "cumulativeDifficulty");
    majorVersion = monero_utils::reconcile(majorVersion, other->majorVersion, "majorVersion");
    minorVersion = monero_utils::reconcile(minorVersion, other->minorVersion, "minorVersion");
    nonce = monero_utils::reconcile(nonce, other->nonce, "nonce");
    minerTxId = monero_utils::reconcile(minerTxId, other->minerTxId);
    numTxs = monero_utils::reconcile(numTxs, other->numTxs, "block header numTxs");
    orphanStatus = monero_utils::reconcile(orphanStatus, other->orphanStatus);
    prevId = monero_utils::reconcile(prevId, other->prevId);
    reward = monero_utils::reconcile(reward, other->reward, "block header reward");
    powHash = monero_utils::reconcile(powHash, other->powHash);
  }

  // ----------------------------- MONERO BLOCK -------------------------------

  boost::property_tree::ptree monero_block::to_property_tree() const {
    boost::property_tree::ptree node = monero_block_header::to_property_tree();
    if (hex != boost::none) node.put("hex", *hex);
    if (minerTx != boost::none) node.add_child("minerTx", (*minerTx)->to_property_tree());
    if (!txs.empty()) node.add_child("txs", monero_utils::to_property_tree(txs));
    if (!txIds.empty()) node.add_child("txIds", monero_utils::to_property_tree(txIds));
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
    txIds = monero_utils::reconcile(txIds, other->txIds);

    // merge miner tx
    if (minerTx == boost::none) minerTx = other->minerTx;
    if (other->minerTx != boost::none) {
      other->minerTx.get()->block = self;
      minerTx.get()->merge(minerTx.get(), other->minerTx.get());
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
    tgt->isMinerTx = src->isMinerTx;
    tgt->paymentId = src->paymentId;
    tgt->fee = src->fee;
    tgt->mixin = src->mixin;
    tgt->doNotRelay = src->doNotRelay;
    tgt->isRelayed = src->isRelayed;
    tgt->isConfirmed = src->isConfirmed;
    tgt->inTxPool = src->inTxPool;
    tgt->numConfirmations = src->numConfirmations;
    tgt->unlockTime = src->unlockTime;
    tgt->lastRelayedTimestamp = src->lastRelayedTimestamp;
    tgt->receivedTimestamp = src->receivedTimestamp;
    tgt->isDoubleSpendSeen = src->isDoubleSpendSeen;
    tgt->key = src->key;
    tgt->fullHex = src->fullHex;
    tgt->prunedHex = src->prunedHex;
    tgt->prunableHex = src->prunableHex;
    tgt->prunableHash = src->prunableHash;
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
    if (!src->outputIndices.empty()) tgt->outputIndices = vector<uint32_t>(src->outputIndices);
    tgt->metadata = src->metadata;
    tgt->commonTxSets = src->commonTxSets;
    if (!src->extra.empty()) throw runtime_error("extra deep copy not implemented");  // TODO: implement extra
    tgt->rctSignatures = src->rctSignatures;
    tgt->rctSigPrunable = src->rctSigPrunable;
    tgt->isKeptByBlock = src->isKeptByBlock;
    tgt->isFailed = src->isFailed;
    tgt->lastFailedHeight = src->lastFailedHeight;
    tgt->lastFailedId = src->lastFailedId;
    tgt->maxUsedBlockHeight = src->maxUsedBlockHeight;
    tgt->maxUsedBlockId = src->maxUsedBlockId;
    if (!src->signatures.empty()) tgt->signatures = vector<string>(src->signatures);
    return tgt;
  }

  boost::property_tree::ptree monero_tx::to_property_tree() const {
    boost::property_tree::ptree node;
    if (id != boost::none) node.put("id", *id);
    if (version != boost::none) node.put("version", *version);
    if (isMinerTx != boost::none) node.put("isMinerTx", *isMinerTx);
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
    if (isDoubleSpendSeen != boost::none) node.put("isDoubleSpendSeen", *isDoubleSpendSeen);
    if (key != boost::none) node.put("key", *key);
    if (fullHex != boost::none) node.put("fullHex", *fullHex);
    if (prunedHex != boost::none) node.put("prunedHex", *prunedHex);
    if (prunableHex != boost::none) node.put("prunableHex", *prunableHex);
    if (prunableHash != boost::none) node.put("prunableHash", *prunableHash);
    if (size != boost::none) node.put("size", *size);
    if (weight != boost::none) node.put("weight", *weight);
    if (!vins.empty()) node.add_child("vins", monero_utils::to_property_tree(vins));
    if (!vouts.empty()) node.add_child("vouts", monero_utils::to_property_tree(vouts));
    if (!outputIndices.empty()) throw runtime_error("outputIndices not implemented");
    if (metadata != boost::none) node.put("metadata", *metadata);
    if (commonTxSets != boost::none) throw runtime_error("commonTxSets not implemented");
    if (!extra.empty()) node.add_child("extra", monero_utils::to_property_tree(extra));
    if (rctSignatures != boost::none) throw runtime_error("rctSignatures not implemented");
    if (rctSigPrunable != boost::none) throw runtime_error("rctSigPrunable not implemented");
    if (isKeptByBlock != boost::none) node.put("isKeptByBlock", *isKeptByBlock);
    if (isFailed != boost::none) node.put("isFailed", *isFailed);
    if (lastFailedHeight != boost::none) node.put("lastFailedHeight", *lastFailedHeight);
    if (lastFailedId != boost::none) node.put("lastFailedId", *lastFailedId);
    if (maxUsedBlockHeight != boost::none) node.put("maxUsedBlockHeight", *maxUsedBlockHeight);
    if (maxUsedBlockId != boost::none) node.put("maxUsedBlockId", *maxUsedBlockId);
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
    paymentId = monero_utils::reconcile(paymentId, other->paymentId);
    fee = monero_utils::reconcile(fee, other->fee, "tx fee");
    mixin = monero_utils::reconcile(mixin, other->mixin, "tx mixin");
    isConfirmed = monero_utils::reconcile(isConfirmed, other->isConfirmed);
    doNotRelay = monero_utils::reconcile(doNotRelay, other->doNotRelay);
    isRelayed = monero_utils::reconcile(isRelayed, other->isRelayed);
    isDoubleSpendSeen = monero_utils::reconcile(isDoubleSpendSeen, other->isDoubleSpendSeen);
    key = monero_utils::reconcile(key, other->key);
    fullHex = monero_utils::reconcile(fullHex, other->fullHex);
    prunedHex = monero_utils::reconcile(prunedHex, other->prunedHex);
    prunableHex = monero_utils::reconcile(prunableHex, other->prunableHex);
    prunableHash = monero_utils::reconcile(prunableHash, other->prunableHash);
    size = monero_utils::reconcile(size, other->size, "tx size");
    weight = monero_utils::reconcile(weight, other->weight, "tx weight");
    //outputIndices = monero_utils::reconcile(outputIndices, other->outputIndices);  // TODO
    metadata = monero_utils::reconcile(metadata, other->metadata);
    commonTxSets = monero_utils::reconcile(commonTxSets, other->commonTxSets);
    //extra = monero_utils::reconcile(extra, other->extra);  // TODO
    rctSignatures = monero_utils::reconcile(rctSignatures, other->rctSignatures);
    rctSigPrunable = monero_utils::reconcile(rctSigPrunable, other->rctSigPrunable);
    isKeptByBlock = monero_utils::reconcile(isKeptByBlock, other->isKeptByBlock);
    isFailed = monero_utils::reconcile(isFailed, other->isFailed);
    lastFailedHeight = monero_utils::reconcile(lastFailedHeight, other->lastFailedHeight, "lastFailedHeight");
    lastFailedId = monero_utils::reconcile(lastFailedId, other->lastFailedId);
    maxUsedBlockHeight = monero_utils::reconcile(maxUsedBlockHeight, other->maxUsedBlockHeight, "maxUsedBlockHeight");
    maxUsedBlockId = monero_utils::reconcile(maxUsedBlockId, other->maxUsedBlockId);
    //signatures = monero_utils::reconcile(signatures, other->signatures); // TODO
    unlockTime = monero_utils::reconcile(unlockTime, other->unlockTime, "unlockTime");
    numConfirmations = monero_utils::reconcile(numConfirmations, other->numConfirmations, "numConfirmations");

    // merge vins
    if (!other->vins.empty()) {
      for (const shared_ptr<monero_output>& merger : other->vins) {
        bool merged = false;
        merger->tx = self;
        for (const shared_ptr<monero_output>& mergee : vins) {
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
      for (const shared_ptr<monero_output>& vout : other->vouts) vout->tx = self;
      if (vouts.empty()) vouts = other->vouts;
      else {

        // determine if key images present
        int numKeyImages = 0;
        for (const shared_ptr<monero_output> vout : vouts) {
          if (vout->keyImage != boost::none) {
            if ((*vout->keyImage)->hex == boost::none) throw runtime_error("Key image hex cannot be null");
            numKeyImages++;
          }
        }
        for (const shared_ptr<monero_output>& vout : other->vouts) {
          if (vout->keyImage != boost::none) {
            if ((*vout->keyImage)->hex == boost::none) throw runtime_error("Key image hex cannot be null");
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
      inTxPool = monero_utils::reconcile(inTxPool, other->inTxPool, boost::none, true, boost::none); // unrelayed -> tx pool
      receivedTimestamp = monero_utils::reconcile(receivedTimestamp, other->receivedTimestamp, boost::none, boost::none, false, "receivedTimestamp"); // take earliest receive time
      lastRelayedTimestamp = monero_utils::reconcile(lastRelayedTimestamp, other->lastRelayedTimestamp, boost::none, boost::none, true, "lastRelayedTimestamp"); // take latest relay time
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
    if (src->keyImage != boost::none) tgt->keyImage = src->keyImage.get()->copy(src->keyImage.get(), make_shared<monero_key_image>());
    tgt->amount = src->amount;
    tgt->index = src->index;
    if (!src->ringOutputIndices.empty()) tgt->ringOutputIndices = vector<uint64_t>(src->ringOutputIndices);
    tgt->stealthPublicKey = src->stealthPublicKey;
    return tgt;
  }

  boost::property_tree::ptree monero_output::to_property_tree() const {
    boost::property_tree::ptree node;
    if (keyImage != boost::none) node.add_child("keyImage", (*keyImage)->to_property_tree());
    if (amount != boost::none) node.put("amount", *amount);
    if (index != boost::none) node.put("index", *index);
    if (!ringOutputIndices.empty()) node.add_child("ringOutputIndices", monero_utils::to_property_tree(ringOutputIndices));
    if (stealthPublicKey != boost::none) node.put("stealthPublicKey", *stealthPublicKey);
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
    if (keyImage == boost::none) keyImage = other->keyImage;
    else if (other->keyImage != boost::none) keyImage.get()->merge(keyImage.get(), other->keyImage.get());
    amount = monero_utils::reconcile(amount, other->amount, "output amount");
    index = monero_utils::reconcile(index, other->index, "output index");
  }
}
