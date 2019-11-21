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

#include "monero_wallet.h"

#include "utils/gen_utils.h"
#include "utils/monero_utils.h"
#include <stdio.h>
#include <iostream>

using namespace std;

/**
 * Public library interface.
 */
namespace monero {

  // ----------------------- UNDECLARED PRIVATE HELPERS -----------------------

  void merge_incoming_transfer(vector<shared_ptr<monero_incoming_transfer>>& transfers, const shared_ptr<monero_incoming_transfer>& transfer) {
    for (const shared_ptr<monero_incoming_transfer>& aTransfer : transfers) {
      if (aTransfer->m_account_index.get() == transfer->m_account_index.get() && aTransfer->m_subaddress_index.get() == transfer->m_subaddress_index.get()) {
        aTransfer->merge(aTransfer, transfer);
        return;
      }
    }
    transfers.push_back(transfer);
  }

  // ---------------------------- MONERO ACCOUNT ------------------------------

  boost::property_tree::ptree monero_account::to_property_tree() const {
    boost::property_tree::ptree node;
    if (m_index != boost::none) node.put("index", *m_index);
    if (m_primary_address != boost::none) node.put("primaryAddress", *m_primary_address);
    if (m_balance != boost::none) node.put("balance", *m_balance);
    if (m_unlocked_balance != boost::none) node.put("unlockedBalance", *m_unlocked_balance);
    if (!m_subaddresses.empty()) node.add_child("subaddresses", monero_utils::to_property_tree(m_subaddresses));
    return node;
  }

  // -------------------------- MONERO SUBADDRESS -----------------------------

  boost::property_tree::ptree monero_subaddress::to_property_tree() const {
    boost::property_tree::ptree node;
    if (m_account_index != boost::none) node.put("accountIndex", *m_account_index);
    if (m_index != boost::none) node.put("index", *m_index);
    if (m_address != boost::none) node.put("address", *m_address);
    if (m_label != boost::none) node.put("label", *m_label);
    if (m_balance != boost::none) node.put("balance", *m_balance);
    if (m_unlocked_balance != boost::none) node.put("unlockedBalance", *m_unlocked_balance);
    if (m_num_unspent_outputs != boost::none) node.put("numUnspentOutputs", *m_num_unspent_outputs);
    if (m_is_used != boost::none) node.put("isUsed", *m_is_used);
    if (m_num_blocks_to_unlock != boost::none) node.put("numBlocksToUnlock", *m_num_blocks_to_unlock);
    return node;
  }

  // --------------------------- MONERO TX WALLET -----------------------------

  shared_ptr<monero_tx_wallet> monero_tx_wallet::copy(const shared_ptr<monero_tx>& src, const shared_ptr<monero_tx>& tgt) const {
    MTRACE("monero_tx_wallet::copy(const shared_ptr<monero_tx>& src, const shared_ptr<monero_tx>& tgt)");
    return monero_tx_wallet::copy(static_pointer_cast<monero_tx_wallet>(src), static_pointer_cast<monero_tx_wallet>(tgt));
  };

  shared_ptr<monero_tx_wallet> monero_tx_wallet::copy(const shared_ptr<monero_tx_wallet>& src, const shared_ptr<monero_tx_wallet>& tgt) const {
    MTRACE("monero_tx_wallet::copy(const shared_ptr<monero_tx_wallet>& src, const shared_ptr<monero_tx_wallet>& tgt)");
    if (this != src.get()) throw runtime_error("this != src");

    // copy base class
    monero_tx::copy(static_pointer_cast<monero_tx>(src), static_pointer_cast<monero_tx>(tgt));

    // copy wallet extensions
    if (!src->m_incoming_transfers.empty()) {
      tgt->m_incoming_transfers = vector<shared_ptr<monero_incoming_transfer>>();
      for (const shared_ptr<monero_incoming_transfer>& transfer : src->m_incoming_transfers) {
        shared_ptr<monero_incoming_transfer> transferCopy = transfer->copy(transfer, make_shared<monero_incoming_transfer>());
        transferCopy->m_tx = tgt;
        tgt->m_incoming_transfers.push_back(transferCopy);
      }
    }
    if (src->m_outgoing_transfer != boost::none) {
      shared_ptr<monero_outgoing_transfer> transferCopy = src->m_outgoing_transfer.get()->copy(src->m_outgoing_transfer.get(), make_shared<monero_outgoing_transfer>());
      transferCopy->m_tx = tgt;
      tgt->m_outgoing_transfer = transferCopy;
    }
    tgt->m_note = src->m_note;

    return tgt;
  };

  boost::property_tree::ptree monero_tx_wallet::to_property_tree() const {
    boost::property_tree::ptree node = monero_tx::to_property_tree();
    if (!m_incoming_transfers.empty()) node.add_child("incomingTransfers", monero_utils::to_property_tree(m_incoming_transfers));
    if (m_outgoing_transfer != boost::none) node.add_child("outgoingTransfer", (*m_outgoing_transfer)->to_property_tree());
    if (m_note != boost::none) node.put("note", *m_note);
    if (m_is_unlocked != boost::none) node.put("isUnlocked", *m_is_unlocked);
    return node;
  }

  bool monero_tx_wallet::is_outgoing() const {
    return m_outgoing_transfer != boost::none;
  }

  bool monero_tx_wallet::is_incoming() const {
    return !m_incoming_transfers.empty();
  }

  void monero_tx_wallet::merge(const shared_ptr<monero_tx>& self, const shared_ptr<monero_tx>& other) {
    merge(static_pointer_cast<monero_tx_wallet>(self), static_pointer_cast<monero_tx_wallet>(other));
  }

  void monero_tx_wallet::merge(const shared_ptr<monero_tx_wallet>& self, const shared_ptr<monero_tx_wallet>& other) {
    if (this != self.get()) throw runtime_error("this != self");
    if (self == other) return;

    // merge base classes
    monero_tx::merge(self, other);

    // merge wallet extensions
    m_note = gen_utils::reconcile(m_note, other->m_note);

    // merge incoming transfers
    if (!other->m_incoming_transfers.empty()) {
      for (const shared_ptr<monero_incoming_transfer>& transfer : other->m_incoming_transfers) {  // NOTE: not using reference so shared_ptr is not deleted when tx is dereferenced
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
  }

  // -------------------------- MONERO TX REQUEST -----------------------------

  shared_ptr<monero_tx_query> monero_tx_query::copy(const shared_ptr<monero_tx>& src, const shared_ptr<monero_tx>& tgt) const {
    return copy(static_pointer_cast<monero_tx_query>(src), static_pointer_cast<monero_tx_query>(tgt));
  };

  shared_ptr<monero_tx_query> monero_tx_query::copy(const shared_ptr<monero_tx_wallet>& src, const shared_ptr<monero_tx_wallet>& tgt) const {
    return copy(static_pointer_cast<monero_tx_query>(src), static_pointer_cast<monero_tx_query>(tgt));
  };

  shared_ptr<monero_tx_query> monero_tx_query::copy(const shared_ptr<monero_tx_query>& src, const shared_ptr<monero_tx_query>& tgt) const {
    MTRACE("monero_tx_query::copy(const shared_ptr<monero_tx_query>& src, const shared_ptr<monero_tx_query>& tgt)");
    if (this != src.get()) throw runtime_error("this != src");

    // copy base class
    monero_tx_wallet::copy(static_pointer_cast<monero_tx>(src), static_pointer_cast<monero_tx>(tgt));

    // copy query extensions
    tgt->m_is_outgoing = src->m_is_outgoing;
    tgt->m_is_incoming = src->m_is_incoming;
    if (!src->m_tx_ids.empty()) tgt->m_tx_ids = vector<string>(src->m_tx_ids);
    tgt-> m_has_payment_id = src->m_has_payment_id;
    if (!src->m_payment_ids.empty()) tgt->m_payment_ids = vector<string>(src->m_payment_ids);
    tgt->m_height = src->m_height;
    tgt->m_min_height = src->m_min_height;
    tgt->m_max_height = src->m_max_height;
    tgt->m_include_outputs = src->m_include_outputs;
    if (src->m_transfer_query != boost::none) tgt->m_transfer_query = src->m_transfer_query.get()->copy(src->m_transfer_query.get(), make_shared<monero_transfer_query>());
    if (src->m_output_query != boost::none) tgt->m_output_query = src->m_output_query.get()->copy(src->m_output_query.get(), make_shared<monero_output_query>());
    return tgt;
  };

  boost::property_tree::ptree monero_tx_query::to_property_tree() const {
    boost::property_tree::ptree node = monero_tx_wallet::to_property_tree();
    if (m_is_outgoing != boost::none) node.put("isOutgoing", *m_is_outgoing);
    if (m_is_incoming != boost::none) node.put("isIncoming", *m_is_incoming);
    if (!m_tx_ids.empty()) node.add_child("txIds", monero_utils::to_property_tree(m_tx_ids));
    if (m_has_payment_id != boost::none) node.put("hasPaymentId", *m_has_payment_id);
    if (!m_payment_ids.empty()) node.add_child("paymentIds", monero_utils::to_property_tree(m_payment_ids));
    if (m_height != boost::none) node.put("height", *m_height);
    if (m_min_height != boost::none) node.put("minHeight", *m_min_height);
    if (m_max_height != boost::none) node.put("maxHeight", *m_max_height);
    if (m_include_outputs != boost::none) node.put("includeOutputs", *m_include_outputs);
    if (m_transfer_query != boost::none) node.add_child("transferQuery", (*m_transfer_query)->to_property_tree());
    return node;
  }

  bool monero_tx_query::meets_criteria(monero_tx_wallet* tx) const {
    if (tx == nullptr) return false;

    // filter on tx
    if (m_id != boost::none && m_id != tx->m_id) return false;
    if (m_payment_id != boost::none && m_payment_id != tx->m_payment_id) return false;
    if (m_is_confirmed != boost::none && m_is_confirmed != tx->m_is_confirmed) return false;
    if (m_in_tx_pool != boost::none && m_in_tx_pool != tx->m_in_tx_pool) return false;
    if (m_do_not_relay != boost::none && m_do_not_relay != tx->m_do_not_relay) return false;
    if (m_is_failed != boost::none && m_is_failed != tx->m_is_failed) return false;
    if (m_is_miner_tx != boost::none && m_is_miner_tx != tx->m_is_miner_tx) return false;

    // at least one transfer must meet transfer query if defined
    if (m_transfer_query != boost::none) {
      bool matchFound = false;
      if (tx->m_outgoing_transfer != boost::none && m_transfer_query.get()->meets_criteria(tx->m_outgoing_transfer.get().get())) matchFound = true;
      else if (!tx->m_incoming_transfers.empty()) {
        for (const shared_ptr<monero_incoming_transfer>& incoming_transfer : tx->m_incoming_transfers) {
          if (m_transfer_query.get()->meets_criteria(incoming_transfer.get())) {
            matchFound = true;
            break;
          }
        }
      }
      if (!matchFound) return false;
    }

    // at least one output must meet output query if defined
    if (m_output_query != boost::none && !m_output_query.get()->is_default()) {
      if (tx->m_vouts.empty()) return false;
      bool matchFound = false;
      for (const shared_ptr<monero_output>& vout : tx->m_vouts) {
        shared_ptr<monero_output_wallet> vout_wallet = static_pointer_cast<monero_output_wallet>(vout);
        if (m_output_query.get()->meets_criteria(vout_wallet.get())) {
          matchFound = true;
          break;
        }
      }
      if (!matchFound) return false;
    }

    // filter on having a payment id
    if (m_has_payment_id != boost::none) {
      if (*m_has_payment_id && tx->m_payment_id == boost::none) return false;
      if (!*m_has_payment_id && tx->m_payment_id != boost::none) return false;
    }

    // filter on incoming
    if (m_is_incoming != boost::none && m_is_incoming != tx->is_incoming()) return false;

    // filter on outgoing
    if (m_is_outgoing != boost::none && m_is_outgoing != tx->is_outgoing()) return false;

    // filter on remaining fields
    boost::optional<uint64_t> txHeight = tx->get_height();
    if (!m_tx_ids.empty() && find(m_tx_ids.begin(), m_tx_ids.end(), *tx->m_id) == m_tx_ids.end()) return false;
    if (!m_payment_ids.empty() && (tx->m_payment_id == boost::none || find(m_payment_ids.begin(), m_payment_ids.end(), *tx->m_payment_id) == m_payment_ids.end())) return false;
    if (m_height != boost::none && (txHeight == boost::none || *txHeight != *m_height)) return false;
    if (m_min_height != boost::none && (txHeight == boost::none || *txHeight < *m_min_height)) return false;
    if (m_max_height != boost::none && (txHeight == boost::none || *txHeight > *m_max_height)) return false;

    // transaction meets query criteria
    return true;
  }

  // -------------------------- MONERO DESTINATION ----------------------------

  shared_ptr<monero_destination> monero_destination::copy(const shared_ptr<monero_destination>& src, const shared_ptr<monero_destination>& tgt) const {
    MTRACE("monero_destination::copy(const shared_ptr<monero_destination>& src, const shared_ptr<monero_destination>& tgt)");
    if (this != src.get()) throw runtime_error("this != src");
    tgt->m_address = src->m_address;
    tgt->m_amount = src->m_amount;
    return tgt;
  };

  boost::property_tree::ptree monero_destination::to_property_tree() const {
    boost::property_tree::ptree node;
    if (m_address != boost::none) node.put("address", *m_address);
    if (m_amount != boost::none) node.put("amount", *m_amount);
    return node;
  }

  // ----------------------------- MONERO TX SET ------------------------------

  boost::property_tree::ptree monero_tx_set::to_property_tree() const {
    boost::property_tree::ptree node;
    if (!m_txs.empty()) node.add_child("txs", monero_utils::to_property_tree(m_txs));
    if (m_multisig_tx_hex != boost::none) node.put("multisigTxHex", *m_multisig_tx_hex);
    if (m_unsigned_tx_hex != boost::none) node.put("unsignedTxHex", *m_unsigned_tx_hex);
    if (m_signed_tx_hex != boost::none) node.put("signedTxHex", *m_signed_tx_hex);
    return node;
  }

  // ---------------------------- MONERO TRANSFER -----------------------------

  shared_ptr<monero_transfer> monero_transfer::copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const {
    MTRACE("monero_transfer::copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt)");
    tgt->m_tx = src->m_tx;  // reference parent tx by default
    tgt->m_amount = src->m_amount;
    tgt->m_account_index = src->m_account_index;
    tgt->m_num_suggested_confirmations = src->m_num_suggested_confirmations;
    return tgt;
  }

  boost::property_tree::ptree monero_transfer::to_property_tree() const {
    boost::property_tree::ptree node;
    if (m_amount != boost::none) node.put("amount", *m_amount);
    if (m_account_index != boost::none) node.put("accountIndex", *m_account_index);
    if (m_num_suggested_confirmations != boost::none) node.put("numSuggestedConfirmations", *m_num_suggested_confirmations);
    return node;
  }

  void monero_transfer::merge(const shared_ptr<monero_transfer>& self, const shared_ptr<monero_transfer>& other) {
    if (this != self.get()) throw runtime_error("this != self");
    if (self == other) return;

    // merge txs if they're different which comes back to merging transfers
    if (m_tx != other->m_tx) {
      m_tx->merge(m_tx, other->m_tx);
      return;
    }

    // otherwise merge transfer fields
    m_account_index = gen_utils::reconcile(m_account_index, other->m_account_index, "acountIndex");

    // TODO monero core: failed m_tx in pool (after testUpdateLockedDifferentAccounts()) causes non-originating saved wallets to return duplicate incoming transfers but one has amount/m_num_suggested_confirmations of 0
    if (m_amount != boost::none && other->m_amount != boost::none && *m_amount != *other->m_amount && (*m_amount == 0 || *other->m_amount == 0)) {
      m_account_index = gen_utils::reconcile(m_account_index, other->m_account_index, boost::none, boost::none, true, "acountIndex");
      m_num_suggested_confirmations = gen_utils::reconcile(m_num_suggested_confirmations, other->m_num_suggested_confirmations, boost::none, boost::none, true, "m_num_suggested_confirmations");
      MWARNING("WARNING: failed tx in pool causes non-originating wallets to return duplicate incoming transfers but with one amount/m_num_suggested_confirmations of 0");
    } else {
      m_amount = gen_utils::reconcile(m_amount, other->m_amount, "transfer amount");
      m_num_suggested_confirmations = gen_utils::reconcile(m_num_suggested_confirmations, other->m_num_suggested_confirmations, boost::none, boost::none, false, "m_num_suggested_confirmations");
    }
  }

  // ----------------------- MONERO INCOMING TRANSFER -------------------------

  shared_ptr<monero_incoming_transfer> monero_incoming_transfer::copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const {
    return copy(static_pointer_cast<monero_incoming_transfer>(src), static_pointer_cast<monero_incoming_transfer>(tgt));
  }

  shared_ptr<monero_incoming_transfer> monero_incoming_transfer::copy(const shared_ptr<monero_incoming_transfer>& src, const shared_ptr<monero_incoming_transfer>& tgt) const {
    throw runtime_error("monero_incoming_transfer::copy(inTransfer) not implemented");
  };

  boost::optional<bool> monero_incoming_transfer::is_incoming() const { return true; }

  boost::property_tree::ptree monero_incoming_transfer::to_property_tree() const {
    boost::property_tree::ptree node = monero_transfer::to_property_tree();
    if (m_subaddress_index != boost::none) node.put("subaddressIndex", *m_subaddress_index);
    if (m_address != boost::none) node.put("address", *m_address);
    return node;
  }

  void monero_incoming_transfer::merge(const shared_ptr<monero_transfer>& self, const shared_ptr<monero_transfer>& other) {
    merge(static_pointer_cast<monero_incoming_transfer>(self), static_pointer_cast<monero_incoming_transfer>(other));
  }

  void monero_incoming_transfer::merge(const shared_ptr<monero_incoming_transfer>& self, const shared_ptr<monero_incoming_transfer>& other) {
    if (self == other) return;
    monero_transfer::merge(self, other);
    m_subaddress_index = gen_utils::reconcile(m_subaddress_index, other->m_subaddress_index, "incoming transfer m_subaddress_index");
    m_address = gen_utils::reconcile(m_address, other->m_address);
  }

  // ----------------------- MONERO OUTGOING TRANSFER -------------------------

  shared_ptr<monero_outgoing_transfer> monero_outgoing_transfer::copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const {
    return copy(static_pointer_cast<monero_outgoing_transfer>(src), static_pointer_cast<monero_outgoing_transfer>(tgt));
  };

  shared_ptr<monero_outgoing_transfer> monero_outgoing_transfer::copy(const shared_ptr<monero_outgoing_transfer>& src, const shared_ptr<monero_outgoing_transfer>& tgt) const {
    throw runtime_error("monero_outgoing_transfer::copy(out_transfer) not implemented");
  };

  boost::optional<bool> monero_outgoing_transfer::is_incoming() const { return false; }

  boost::property_tree::ptree monero_outgoing_transfer::to_property_tree() const {
    boost::property_tree::ptree node = monero_transfer::to_property_tree();
    if (!m_subaddress_indices.empty()) node.add_child("subaddressIndices", monero_utils::to_property_tree(m_subaddress_indices));
    if (!m_addresses.empty()) node.add_child("addresses", monero_utils::to_property_tree(m_addresses));
    if (!m_destinations.empty()) node.add_child("destinations", monero_utils::to_property_tree(m_destinations));
    return node;
  }

  void monero_outgoing_transfer::merge(const shared_ptr<monero_transfer>& self, const shared_ptr<monero_transfer>& other) {
    merge(static_pointer_cast<monero_outgoing_transfer>(self), static_pointer_cast<monero_outgoing_transfer>(other));
  }

  void monero_outgoing_transfer::merge(const shared_ptr<monero_outgoing_transfer>& self, const shared_ptr<monero_outgoing_transfer>& other) {
    if (self == other) return;
    monero_transfer::merge(self, other);
    m_subaddress_indices = gen_utils::reconcile(m_subaddress_indices, other->m_subaddress_indices);
    m_addresses = gen_utils::reconcile(m_addresses, other->m_addresses);
    m_destinations = gen_utils::reconcile(m_destinations, other->m_destinations);
  }

  // ----------------------- MONERO TRANSFER REQUEST --------------------------

  shared_ptr<monero_transfer_query> monero_transfer_query::copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const {
    return copy(static_pointer_cast<monero_transfer_query>(src), static_pointer_cast<monero_transfer>(tgt));
  };

  shared_ptr<monero_transfer_query> monero_transfer_query::copy(const shared_ptr<monero_transfer_query>& src, const shared_ptr<monero_transfer_query>& tgt) const {
    MTRACE("monero_transfer_query::copy(const shared_ptr<monero_transfer_query>& src, const shared_ptr<monero_transfer_query>& tgt)");
    if (this != src.get()) throw runtime_error("this != src");

    // copy base class
    monero_transfer::copy(static_pointer_cast<monero_transfer>(src), static_pointer_cast<monero_transfer>(tgt));

    // copy extensions
    tgt->m_is_incoming = src->m_is_incoming;
    tgt->m_address = src->m_address;
    if (!src->m_addresses.empty()) tgt->m_addresses = vector<string>(src->m_addresses);
    tgt->m_subaddress_index = src->m_subaddress_index;
    if (!src->m_subaddress_indices.empty()) tgt->m_subaddress_indices = vector<uint32_t>(src->m_subaddress_indices);
    if (!src->m_destinations.empty()) {
      for (const shared_ptr<monero_destination>& destination : src->m_destinations) {
        tgt->m_destinations.push_back(destination->copy(destination, make_shared<monero_destination>()));
      }
    }
    tgt->m_has_destinations = src->m_has_destinations;
    tgt->m_tx_query = src->m_tx_query;
    return tgt;
  };

  boost::optional<bool> monero_transfer_query::is_incoming() const { return m_is_incoming; }

  boost::property_tree::ptree monero_transfer_query::to_property_tree() const {
    boost::property_tree::ptree node = monero_transfer::to_property_tree();
    if (is_incoming() != boost::none) node.put("isIncoming", *is_incoming());
    if (m_address != boost::none) node.put("address", *m_address);
    if (m_subaddress_index != boost::none) node.put("subaddressIndex", *m_subaddress_index);
    if (m_has_destinations != boost::none) node.put("hasDestinations", *m_has_destinations);
    if (!m_subaddress_indices.empty()) node.add_child("subaddressIndices", monero_utils::to_property_tree(m_subaddress_indices));
    if (!m_addresses.empty()) node.add_child("addresses", monero_utils::to_property_tree(m_addresses));
    if (!m_destinations.empty()) node.add_child("destinations", monero_utils::to_property_tree(m_destinations));
    return node;
  }

  bool monero_transfer_query::meets_criteria(monero_transfer* transfer) const {
    if (transfer == nullptr) throw runtime_error("transfer is null");
    if (m_tx_query != boost::none && (*m_tx_query)->m_transfer_query != boost::none) throw runtime_error("Transfer query's tx query cannot have a circular transfer query");   // TODO: could auto detect and handle this.  port to java/js

    // filter on common fields
    if (is_incoming() != boost::none && *is_incoming() != *transfer->is_incoming()) return false;
    if (is_outgoing() != boost::none && is_outgoing() != transfer->is_outgoing()) return false;
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
        for (const string& addressReq : m_addresses) {
          for (const string& address : out_transfer->m_addresses) {
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
    if (inTransfer == nullptr && out_transfer == nullptr) throw runtime_error("Transfer must be monero_incoming_transfer or monero_outgoing_transfer");

    // filter with tx query
    if (m_tx_query != boost::none && !(*m_tx_query)->meets_criteria(transfer->m_tx.get())) return false;
    return true;
  }

  // ------------------------- MONERO OUTPUT WALLET ---------------------------

  shared_ptr<monero_output_wallet> monero_output_wallet::copy(const shared_ptr<monero_output>& src, const shared_ptr<monero_output>& tgt) const {
    MTRACE("monero_output_wallet::copy(output)");
    return monero_output_wallet::copy(static_pointer_cast<monero_output_wallet>(src), static_pointer_cast<monero_output_wallet>(tgt));
  };

  shared_ptr<monero_output_wallet> monero_output_wallet::copy(const shared_ptr<monero_output_wallet>& src, const shared_ptr<monero_output_wallet>& tgt) const {
    MTRACE("monero_output_wallet::copy(output_wallet)");
    if (this != src.get()) throw runtime_error("this != src");

    // copy base class
    monero_output::copy(static_pointer_cast<monero_output>(src), static_pointer_cast<monero_output>(tgt));

    // copy extensions
    tgt->m_account_index = src->m_account_index;
    tgt->m_subaddress_index = src->m_subaddress_index;
    tgt->m_is_spent = src->m_is_spent;
    tgt->m_is_unlocked = src->m_is_unlocked;
    tgt->m_is_frozen = src->m_is_frozen;
    return tgt;
  };

  boost::property_tree::ptree monero_output_wallet::to_property_tree() const {
    boost::property_tree::ptree node = monero_output::to_property_tree();
    if (m_account_index != boost::none) node.put("accountIndex", *m_account_index);
    if (m_subaddress_index != boost::none) node.put("subaddressIndex", *m_subaddress_index);
    if (m_is_spent != boost::none) node.put("isSpent", *m_is_spent);
    if (m_is_unlocked != boost::none) node.put("isUnlocked", *m_is_unlocked);
    if (m_is_frozen != boost::none) node.put("isFrozen", *m_is_frozen);
    return node;
  }

  void monero_output_wallet::merge(const shared_ptr<monero_output>& self, const shared_ptr<monero_output>& other) {
    merge(static_pointer_cast<monero_output_wallet>(self), static_pointer_cast<monero_output_wallet>(other));
  }

  void monero_output_wallet::merge(const shared_ptr<monero_output_wallet>& self, const shared_ptr<monero_output_wallet>& other) {
    MTRACE("monero_output_wallet::merge(self, other)");
    if (this != self.get()) throw runtime_error("this != self");
    if (self == other) return;

    // merge base classes
    monero_output::merge(self, other);

    // merge output wallet extensions
    m_account_index = gen_utils::reconcile(m_account_index, other->m_account_index);
    m_subaddress_index = gen_utils::reconcile(m_subaddress_index, other->m_subaddress_index);
    m_is_spent = gen_utils::reconcile(m_is_spent, other->m_is_spent);
  }

  // ------------------------ MONERO OUTPUT REQUEST ---------------------------

  // initialize static empty output for is_default() check
  const unique_ptr<monero_output_wallet> monero_output_query::M_EMPTY_OUTPUT = unique_ptr<monero_output_wallet>(new monero_output_wallet());
  bool monero_output_query::is_default() const {
    return meets_criteria(monero_output_query::M_EMPTY_OUTPUT.get());
  }

  shared_ptr<monero_output_query> monero_output_query::copy(const shared_ptr<monero_output>& src, const shared_ptr<monero_output>& tgt) const {
    return monero_output_query::copy(static_pointer_cast<monero_output_query>(src), static_pointer_cast<monero_output_query>(tgt));
  };

  shared_ptr<monero_output_query> monero_output_query::copy(const shared_ptr<monero_output_wallet>& src, const shared_ptr<monero_output_wallet>& tgt) const {
    return monero_output_query::copy(static_pointer_cast<monero_output_query>(src), static_pointer_cast<monero_output_query>(tgt));
  };

  shared_ptr<monero_output_query> monero_output_query::copy(const shared_ptr<monero_output_query>& src, const shared_ptr<monero_output_query>& tgt) const {
    MTRACE("monero_output_query::copy(output_query)");
    if (this != src.get()) throw runtime_error("this != src");

    // copy base class
    monero_output_wallet::copy(static_pointer_cast<monero_output>(src), static_pointer_cast<monero_output>(tgt));

    // copy extensions
    if (!src->m_subaddress_indices.empty()) tgt->m_subaddress_indices = vector<uint32_t>(src->m_subaddress_indices);
    return tgt;
  };

  boost::property_tree::ptree monero_output_query::to_property_tree() const {
    boost::property_tree::ptree node = monero_output_wallet::to_property_tree();
    if (!m_subaddress_indices.empty()) node.add_child("subaddressIndices", monero_utils::to_property_tree(m_subaddress_indices));
    return node;
  }

  bool monero_output_query::meets_criteria(monero_output_wallet* output) const {

    // filter on output
    if (m_account_index != boost::none && (output->m_account_index == boost::none || *m_account_index != *output->m_account_index)) return false;
    if (m_subaddress_index != boost::none && (output->m_subaddress_index == boost::none || *m_subaddress_index != *output->m_subaddress_index)) return false;
    if (m_amount != boost::none && (output->m_amount == boost::none || *m_amount != *output->m_amount)) return false;
    if (m_is_spent != boost::none && (output->m_is_spent == boost::none || *m_is_spent != *output->m_is_spent)) return false;
    if (m_is_unlocked != boost::none && (output->m_is_unlocked == boost::none || *m_is_unlocked != *output->m_is_unlocked)) return false;

    // filter on output key image
    if (m_key_image != boost::none) {
      if (output->m_key_image == boost::none) return false;
      if ((*m_key_image)->m_hex != boost::none && ((*output->m_key_image)->m_hex == boost::none || *(*m_key_image)->m_hex != *(*output->m_key_image)->m_hex)) return false;
      if ((*m_key_image)->m_signature != boost::none && ((*output->m_key_image)->m_signature == boost::none || *(*m_key_image)->m_signature != *(*output->m_key_image)->m_signature)) return false;
    }

    // filter on extensions
    if (!m_subaddress_indices.empty() && find(m_subaddress_indices.begin(), m_subaddress_indices.end(), *output->m_subaddress_index) == m_subaddress_indices.end()) return false;

    // filter with tx query
    if (m_tx_query != boost::none && !(*m_tx_query)->meets_criteria(static_pointer_cast<monero_tx_wallet>(output->m_tx).get())) return false;

    // output meets query
    return true;
  }

  // ------------------------- MONERO SEND REQUEST ----------------------------

  monero_send_request::monero_send_request(const monero_send_request& request) {
    if (request.m_destinations.size() > 0) {
      for (const shared_ptr<monero_destination>& destination : request.m_destinations) {
        m_destinations.push_back(destination->copy(destination, make_shared<monero_destination>()));
      }
    }
    m_payment_id = request.m_payment_id;
    m_priority = request.m_priority;
    m_mixin = request.m_mixin;
    m_ring_size = request.m_ring_size;
    m_fee = request.m_fee;
    m_account_index = request.m_account_index;
    m_subaddress_indices = request.m_subaddress_indices;
    m_unlock_time = request.m_unlock_time;
    m_can_split = request.m_can_split;
    m_do_not_relay = request.m_do_not_relay;
    m_note = request.m_note;
    m_recipient_name = request.m_recipient_name;
    m_below_amount = request.m_below_amount;
    m_sweep_each_subaddress = request.m_sweep_each_subaddress;
    m_key_image = request.m_key_image;
  }

  monero_send_request monero_send_request::copy() const {
    return monero_send_request(*this);
  }

  boost::property_tree::ptree monero_send_request::to_property_tree() const {
    boost::property_tree::ptree node;
    if (!m_destinations.empty()) node.add_child("destinations", monero_utils::to_property_tree(m_destinations));
    if (m_payment_id != boost::none) node.put("paymentId", *m_payment_id);
    if (m_priority != boost::none) node.put("priority", *m_priority);
    if (m_mixin != boost::none) node.put("mixin", *m_mixin);
    if (m_ring_size != boost::none) node.put("ringSize", *m_ring_size);
    if (m_account_index != boost::none) node.put("accountIndex", *m_account_index);
    if (!m_subaddress_indices.empty()) node.add_child("subaddressIndices", monero_utils::to_property_tree(m_subaddress_indices));
    if (m_unlock_time != boost::none) node.put("unlockTime", *m_unlock_time);
    if (m_can_split != boost::none) node.put("canSplit", *m_can_split);
    if (m_do_not_relay != boost::none) node.put("doNotRelay", *m_do_not_relay);
    if (m_note != boost::none) node.put("note", *m_note);
    if (m_recipient_name != boost::none) node.put("recipientName", *m_recipient_name);
    if (m_below_amount != boost::none) node.put("belowAmount", *m_below_amount);
    if (m_sweep_each_subaddress != boost::none) node.put("sweepEachSubaddress", *m_sweep_each_subaddress);
    if (m_key_image != boost::none) node.put("keyImage", *m_key_image);
    return node;
  }

  // ---------------------- MONERO INTEGRATED ADDRESS -------------------------

  boost::property_tree::ptree monero_integrated_address::to_property_tree() const {
    boost::property_tree::ptree node;
    node.put("standardAddress", m_standard_address);
    node.put("paymentId", m_payment_id);
    node.put("integratedAddress", m_integrated_address);
    return node;
  }

  // -------------------- MONERO KEY IMAGE IMPORT RESULT ----------------------

  boost::property_tree::ptree monero_key_image_import_result::to_property_tree() const {
    boost::property_tree::ptree node;
    if (m_height != boost::none) node.put("height", *m_height);
    if (m_spent_amount != boost::none) node.put("spentAmount", *m_spent_amount);
    if (m_unspent_amount != boost::none) node.put("unspentAmount", *m_unspent_amount);
    return node;
  }

  // ----------------------------- MONERO CHECK -------------------------------

  boost::property_tree::ptree monero_check::to_property_tree() const {
    boost::property_tree::ptree node;
    node.put("isGood", m_is_good);
    return node;
  }

  // --------------------------- MONERO CHECK TX ------------------------------

  boost::property_tree::ptree monero_check_tx::to_property_tree() const {
    boost::property_tree::ptree node = monero_check::to_property_tree();;
    if (m_in_tx_pool != boost::none) node.put("inTxPool", *m_in_tx_pool);
    if (m_num_confirmations != boost::none) node.put("numConfirmations", *m_num_confirmations);
    if (m_received_amount != boost::none) node.put("receivedAmount", *m_received_amount);
    return node;
  }

  // ------------------------ MONERO CHECK RESERVE ----------------------------

  boost::property_tree::ptree monero_check_reserve::to_property_tree() const {
    boost::property_tree::ptree node = monero_check::to_property_tree();
    if (m_total_amount != boost::none) node.put("totalAmount", *m_total_amount);
    if (m_unconfirmed_spent_amount != boost::none) node.put("unconfirmedSpentAmount", *m_unconfirmed_spent_amount);
    return node;
  }

  // --------------------------- MONERO MULTISIG ------------------------------

  boost::property_tree::ptree monero_multisig_info::to_property_tree() const {
    boost::property_tree::ptree node;
    node.put("isMultisig", m_is_multisig);
    node.put("isReady", m_is_ready);
    node.put("threshold", m_threshold);
    node.put("numParticipants", m_num_participants);
    return node;
  }

  boost::property_tree::ptree monero_multisig_init_result::to_property_tree() const {
    boost::property_tree::ptree node;
    if (m_address != boost::none) node.put("address", *m_address);
    if (m_multisig_hex != boost::none) node.put("multisigHex", *m_multisig_hex);
    return node;
  }

  boost::property_tree::ptree monero_multisig_sign_result::to_property_tree() const {
    boost::property_tree::ptree node;
    if (m_signed_multisig_tx_hex != boost::none) node.put("signedMultisigTxHex", *m_signed_multisig_tx_hex);
    if (!m_tx_ids.empty()) node.add_child("txIds", monero_utils::to_property_tree(m_tx_ids));
    return node;
  }
}
