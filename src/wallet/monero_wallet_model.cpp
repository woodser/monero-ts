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
      if (aTransfer->account_index.get() == transfer->account_index.get() && aTransfer->subaddress_index.get() == transfer->subaddress_index.get()) {
        aTransfer->merge(aTransfer, transfer);
        return;
      }
    }
    transfers.push_back(transfer);
  }

  // ---------------------------- MONERO ACCOUNT ------------------------------

  boost::property_tree::ptree monero_account::to_property_tree() const {
    boost::property_tree::ptree node;
    if (index != boost::none) node.put("index", *index);
    if (primary_address != boost::none) node.put("primaryAddress", *primary_address);
    if (balance != boost::none) node.put("balance", *balance);
    if (unlocked_balance != boost::none) node.put("unlockedBalance", *unlocked_balance);
    if (!subaddresses.empty()) node.add_child("subaddresses", monero_utils::to_property_tree(subaddresses));
    return node;
  }

  // -------------------------- MONERO SUBADDRESS -----------------------------

  boost::property_tree::ptree monero_subaddress::to_property_tree() const {
    boost::property_tree::ptree node;
    if (account_index != boost::none) node.put("accountIndex", *account_index);
    if (index != boost::none) node.put("index", *index);
    if (address != boost::none) node.put("address", *address);
    if (label != boost::none) node.put("label", *label);
    if (balance != boost::none) node.put("balance", *balance);
    if (unlocked_balance != boost::none) node.put("unlockedBalance", *unlocked_balance);
    if (num_unspent_outputs != boost::none) node.put("numUnspentOutputs", *num_unspent_outputs);
    if (is_used != boost::none) node.put("isUsed", *is_used);
    if (num_blocks_to_unlock != boost::none) node.put("numBlocksToUnlock", *num_blocks_to_unlock);
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
    if (!src->incoming_transfers.empty()) {
      tgt->incoming_transfers = vector<shared_ptr<monero_incoming_transfer>>();
      for (const shared_ptr<monero_incoming_transfer>& transfer : src->incoming_transfers) {
        shared_ptr<monero_incoming_transfer> transferCopy = transfer->copy(transfer, make_shared<monero_incoming_transfer>());
        transferCopy->tx = tgt;
        tgt->incoming_transfers.push_back(transferCopy);
      }
    }
    if (src->outgoing_transfer != boost::none) {
      shared_ptr<monero_outgoing_transfer> transferCopy = src->outgoing_transfer.get()->copy(src->outgoing_transfer.get(), make_shared<monero_outgoing_transfer>());
      transferCopy->tx = tgt;
      tgt->outgoing_transfer = transferCopy;
    }
    tgt->note = src->note;

    return tgt;
  };

  boost::property_tree::ptree monero_tx_wallet::to_property_tree() const {
    boost::property_tree::ptree node = monero_tx::to_property_tree();
    if (!incoming_transfers.empty()) node.add_child("incomingTransfers", monero_utils::to_property_tree(incoming_transfers));
    if (outgoing_transfer != boost::none) node.add_child("outgoingTransfer", (*outgoing_transfer)->to_property_tree());
    if (note != boost::none) node.put("note", *note);
    return node;
  }

  bool monero_tx_wallet::getIsOutgoing() const {
    return outgoing_transfer != boost::none;
  }

  bool monero_tx_wallet::getIsIncoming() const {
    return !incoming_transfers.empty();
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
    note = monero_utils::reconcile(note, other->note);

    // merge incoming transfers
    if (!other->incoming_transfers.empty()) {
      for (const shared_ptr<monero_incoming_transfer>& transfer : other->incoming_transfers) {  // NOTE: not using reference so shared_ptr is not deleted when tx is dereferenced
        transfer->tx = self;
        merge_incoming_transfer(self->incoming_transfers, transfer);
      }
    }

    // merge outgoing transfer
    if (other->outgoing_transfer != boost::none) {
      other->outgoing_transfer.get()->tx = self;
      if (self->outgoing_transfer == boost::none) self->outgoing_transfer = other->outgoing_transfer;
      else self->outgoing_transfer.get()->merge(self->outgoing_transfer.get(), other->outgoing_transfer.get());
    }
  }

  // -------------------------- MONERO TX REQUEST -----------------------------

  shared_ptr<monero_tx_request> monero_tx_request::copy(const shared_ptr<monero_tx>& src, const shared_ptr<monero_tx>& tgt) const {
    return copy(static_pointer_cast<monero_tx_request>(src), static_pointer_cast<monero_tx_request>(tgt));
  };

  shared_ptr<monero_tx_request> monero_tx_request::copy(const shared_ptr<monero_tx_wallet>& src, const shared_ptr<monero_tx_wallet>& tgt) const {
    return copy(static_pointer_cast<monero_tx_request>(src), static_pointer_cast<monero_tx_request>(tgt));
  };

  shared_ptr<monero_tx_request> monero_tx_request::copy(const shared_ptr<monero_tx_request>& src, const shared_ptr<monero_tx_request>& tgt) const {
    MTRACE("monero_tx_request::copy(const shared_ptr<monero_tx_request>& src, const shared_ptr<monero_tx_request>& tgt)");
    if (this != src.get()) throw runtime_error("this != src");

    // copy base class
    monero_tx_wallet::copy(static_pointer_cast<monero_tx>(src), static_pointer_cast<monero_tx>(tgt));

    // copy request extensions
    tgt->is_outgoing = src->is_outgoing;
    tgt->is_incoming = src->is_incoming;
    if (!src->tx_ids.empty()) tgt->tx_ids = vector<string>(src->tx_ids);
    tgt-> has_payment_id = src->has_payment_id;
    if (!src->payment_ids.empty()) tgt->payment_ids = vector<string>(src->payment_ids);
    tgt->height = src->height;
    tgt->min_height = src->min_height;
    tgt->max_height = src->max_height;
    tgt->include_outputs = src->include_outputs;
    if (src->transfer_request != boost::none) tgt->transfer_request = src->transfer_request.get()->copy(src->transfer_request.get(), make_shared<monero_transfer_request>());
    if (src->output_request != boost::none) tgt->output_request = src->output_request.get()->copy(src->output_request.get(), make_shared<monero_output_request>());
    return tgt;
  };

  boost::property_tree::ptree monero_tx_request::to_property_tree() const {
    boost::property_tree::ptree node = monero_tx_wallet::to_property_tree();
    if (is_outgoing != boost::none) node.put("isOutgoing", *is_outgoing);
    if (is_incoming != boost::none) node.put("isIncoming", *is_incoming);
    if (!tx_ids.empty()) node.add_child("txIds", monero_utils::to_property_tree(tx_ids));
    if (has_payment_id != boost::none) node.put("hasPaymentId", *has_payment_id);
    if (!payment_ids.empty()) node.add_child("paymentIds", monero_utils::to_property_tree(payment_ids));
    if (height != boost::none) node.put("height", *height);
    if (min_height != boost::none) node.put("minHeight", *min_height);
    if (max_height != boost::none) node.put("maxHeight", *max_height);
    if (include_outputs != boost::none) node.put("includeOutputs", *include_outputs);
    if (transfer_request != boost::none) node.add_child("transferRequest", (*transfer_request)->to_property_tree());
    return node;
  }

  bool monero_tx_request::meets_criteria(monero_tx_wallet* tx) const {
    if (tx == nullptr) return false;

    // filter on tx
    if (id != boost::none && id != tx->id) return false;
    if (payment_id != boost::none && payment_id != tx->payment_id) return false;
    if (is_confirmed != boost::none && is_confirmed != tx->is_confirmed) return false;
    if (in_tx_pool != boost::none && in_tx_pool != tx->in_tx_pool) return false;
    if (do_not_relay != boost::none && do_not_relay != tx->do_not_relay) return false;
    if (is_failed != boost::none && is_failed != tx->is_failed) return false;
    if (is_miner_tx != boost::none && is_miner_tx != tx->is_miner_tx) return false;

    // at least one transfer must meet transfer request if defined
    if (transfer_request != boost::none) {
      bool matchFound = false;
      if (tx->outgoing_transfer != boost::none && (*transfer_request)->meets_criteria((*tx->outgoing_transfer).get())) matchFound = true;
      else if (!tx->incoming_transfers.empty()) {
        for (const shared_ptr<monero_incoming_transfer>& incomingTransfer : tx->incoming_transfers) {
          if ((*transfer_request)->meets_criteria(incomingTransfer.get())) {
            matchFound = true;
            break;
          }
        }
      }
      if (!matchFound) return false;
    }

    // filter on having a payment id
    if (has_payment_id != boost::none) {
      if (*has_payment_id && tx->payment_id == boost::none) return false;
      if (!*has_payment_id && tx->payment_id != boost::none) return false;
    }

    // filter on incoming
    if (is_incoming != boost::none && is_incoming != tx->getIsIncoming()) return false;

    // filter on outgoing
    if (is_outgoing != boost::none && is_outgoing != tx->getIsOutgoing()) return false;

    // filter on remaining fields
    boost::optional<uint64_t> txHeight = tx->get_height();
    if (!tx_ids.empty() && find(tx_ids.begin(), tx_ids.end(), *tx->id) == tx_ids.end()) return false;
    if (!payment_ids.empty() && (tx->payment_id == boost::none || find(payment_ids.begin(), payment_ids.end(), *tx->payment_id) == payment_ids.end())) return false;
    if (height != boost::none && (txHeight == boost::none || *txHeight != *height)) return false;
    if (min_height != boost::none && (txHeight == boost::none || *txHeight < *min_height)) return false;
    if (max_height != boost::none && (txHeight == boost::none || *txHeight > *max_height)) return false;

    // transaction meets request criteria
    return true;
  }

  // -------------------------- MONERO DESTINATION ----------------------------

  shared_ptr<monero_destination> monero_destination::copy(const shared_ptr<monero_destination>& src, const shared_ptr<monero_destination>& tgt) const {
    MTRACE("monero_destination::copy(const shared_ptr<monero_destination>& src, const shared_ptr<monero_destination>& tgt)");
    if (this != src.get()) throw runtime_error("this != src");
    tgt->address = src->address;
    tgt->amount = src->amount;
    return tgt;
  };

  boost::property_tree::ptree monero_destination::to_property_tree() const {
    boost::property_tree::ptree node;
    if (address != boost::none) node.put("address", *address);
    if (amount != boost::none) node.put("amount", *amount);
    return node;
  }

  // ---------------------------- MONERO TRANSFER -----------------------------

  shared_ptr<monero_transfer> monero_transfer::copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const {
    MTRACE("monero_transfer::copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt)");
    tgt->tx = src->tx;  // reference parent tx by default
    tgt->amount = src->amount;
    tgt->account_index = src->account_index;
    tgt->num_suggested_confirmations = src->num_suggested_confirmations;
    return tgt;
  }

  boost::property_tree::ptree monero_transfer::to_property_tree() const {
    boost::property_tree::ptree node;
    if (amount != boost::none) node.put("amount", *amount);
    if (account_index != boost::none) node.put("accountIndex", *account_index);
    if (num_suggested_confirmations != boost::none) node.put("numSuggestedConfirmations", *num_suggested_confirmations);
    return node;
  }

  void monero_transfer::merge(const shared_ptr<monero_transfer>& self, const shared_ptr<monero_transfer>& other) {
    if (this != self.get()) throw runtime_error("this != self");
    if (self == other) return;

    // merge txs if they're different which comes back to merging transfers
    if (tx != other->tx) {
      tx->merge(tx, other->tx);
      return;
    }

    // otherwise merge transfer fields
    account_index = monero_utils::reconcile(account_index, other->account_index, "acountIndex");

    // TODO monero core: failed tx in pool (after testUpdateLockedDifferentAccounts()) causes non-originating saved wallets to return duplicate incoming transfers but one has amount/num_suggested_confirmations of 0
    if (amount != boost::none && other->amount != boost::none && *amount != *other->amount && (*amount == 0 || *other->amount == 0)) {
      account_index = monero_utils::reconcile(account_index, other->account_index, boost::none, boost::none, true, "acountIndex");
      num_suggested_confirmations = monero_utils::reconcile(num_suggested_confirmations, other->num_suggested_confirmations, boost::none, boost::none, true, "num_suggested_confirmations");
      MWARNING("WARNING: failed tx in pool causes non-originating wallets to return duplicate incoming transfers but with one amount/num_suggested_confirmations of 0");
    } else {
      amount = monero_utils::reconcile(amount, other->amount, "transfer amount");
      num_suggested_confirmations = monero_utils::reconcile(num_suggested_confirmations, other->num_suggested_confirmations, boost::none, boost::none, false, "num_suggested_confirmations");
    }
  }

  // ----------------------- MONERO INCOMING TRANSFER -------------------------

  shared_ptr<monero_incoming_transfer> monero_incoming_transfer::copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const {
    return copy(static_pointer_cast<monero_incoming_transfer>(src), static_pointer_cast<monero_incoming_transfer>(tgt));
  }

  shared_ptr<monero_incoming_transfer> monero_incoming_transfer::copy(const shared_ptr<monero_incoming_transfer>& src, const shared_ptr<monero_incoming_transfer>& tgt) const {



    throw runtime_error("monero_incoming_transfer::copy(inTransfer) not implemented");
  };

  boost::optional<bool> monero_incoming_transfer::getIsIncoming() const { return true; }

  boost::property_tree::ptree monero_incoming_transfer::to_property_tree() const {
    boost::property_tree::ptree node = monero_transfer::to_property_tree();
    if (subaddress_index != boost::none) node.put("subaddressIndex", *subaddress_index);
    if (address != boost::none) node.put("address", *address);
    return node;
  }

  void monero_incoming_transfer::merge(const shared_ptr<monero_transfer>& self, const shared_ptr<monero_transfer>& other) {
    merge(static_pointer_cast<monero_incoming_transfer>(self), static_pointer_cast<monero_incoming_transfer>(other));
  }

  void monero_incoming_transfer::merge(const shared_ptr<monero_incoming_transfer>& self, const shared_ptr<monero_incoming_transfer>& other) {
    if (self == other) return;
    monero_transfer::merge(self, other);
    subaddress_index = monero_utils::reconcile(subaddress_index, other->subaddress_index, "incoming transfer subaddress_index");
    address = monero_utils::reconcile(address, other->address);
  }

  // ----------------------- MONERO OUTGOING TRANSFER -------------------------

  shared_ptr<monero_outgoing_transfer> monero_outgoing_transfer::copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const {
    return copy(static_pointer_cast<monero_outgoing_transfer>(src), static_pointer_cast<monero_outgoing_transfer>(tgt));
  };

  shared_ptr<monero_outgoing_transfer> monero_outgoing_transfer::copy(const shared_ptr<monero_outgoing_transfer>& src, const shared_ptr<monero_outgoing_transfer>& tgt) const {
    throw runtime_error("monero_outgoing_transfer::copy(out_transfer) not implemented");
  };

  boost::optional<bool> monero_outgoing_transfer::getIsIncoming() const { return false; }

  boost::property_tree::ptree monero_outgoing_transfer::to_property_tree() const {
    boost::property_tree::ptree node = monero_transfer::to_property_tree();
    if (!subaddress_indices.empty()) node.add_child("subaddressIndices", monero_utils::to_property_tree(subaddress_indices));
    if (!addresses.empty()) node.add_child("addresses", monero_utils::to_property_tree(addresses));
    if (!destinations.empty()) node.add_child("destinations", monero_utils::to_property_tree(destinations));
    return node;
  }

  void monero_outgoing_transfer::merge(const shared_ptr<monero_transfer>& self, const shared_ptr<monero_transfer>& other) {
    merge(static_pointer_cast<monero_outgoing_transfer>(self), static_pointer_cast<monero_outgoing_transfer>(other));
  }

  void monero_outgoing_transfer::merge(const shared_ptr<monero_outgoing_transfer>& self, const shared_ptr<monero_outgoing_transfer>& other) {
    if (self == other) return;
    monero_transfer::merge(self, other);
    subaddress_indices = monero_utils::reconcile(subaddress_indices, other->subaddress_indices);
    addresses = monero_utils::reconcile(addresses, other->addresses);
    destinations = monero_utils::reconcile(destinations, other->destinations);
  }

  // ----------------------- MONERO TRANSFER REQUEST --------------------------

  shared_ptr<monero_transfer_request> monero_transfer_request::copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const {
    return copy(static_pointer_cast<monero_transfer_request>(src), static_pointer_cast<monero_transfer>(tgt));
  };

  shared_ptr<monero_transfer_request> monero_transfer_request::copy(const shared_ptr<monero_transfer_request>& src, const shared_ptr<monero_transfer_request>& tgt) const {
    MTRACE("monero_transfer_request::copy(const shared_ptr<monero_transfer_request>& src, const shared_ptr<monero_transfer_request>& tgt)");
    if (this != src.get()) throw runtime_error("this != src");

    // copy base class
    monero_transfer::copy(static_pointer_cast<monero_transfer>(src), static_pointer_cast<monero_transfer>(tgt));

    // copy extensions
    tgt->is_incoming = src->is_incoming;
    tgt->address = src->address;
    if (!src->addresses.empty()) tgt->addresses = vector<string>(src->addresses);
    tgt->subaddress_index = src->subaddress_index;
    if (!src->subaddress_indices.empty()) tgt->subaddress_indices = vector<uint32_t>(src->subaddress_indices);
    if (!src->destinations.empty()) {
      for (const shared_ptr<monero_destination>& destination : src->destinations) {
        tgt->destinations.push_back(destination->copy(destination, make_shared<monero_destination>()));
      }
    }
    tgt->has_destinations = src->has_destinations;
    tgt->tx_request = src->tx_request;
    return tgt;
  };

  boost::optional<bool> monero_transfer_request::getIsIncoming() const { return is_incoming; }

  boost::property_tree::ptree monero_transfer_request::to_property_tree() const {
    boost::property_tree::ptree node = monero_transfer::to_property_tree();
    if (getIsIncoming() != boost::none) node.put("isIncoming", *getIsIncoming());
    if (address != boost::none) node.put("address", *address);
    if (subaddress_index != boost::none) node.put("subaddressIndex", *subaddress_index);
    if (has_destinations != boost::none) node.put("hasDestinations", *has_destinations);
    if (!subaddress_indices.empty()) node.add_child("subaddressIndices", monero_utils::to_property_tree(subaddress_indices));
    if (!addresses.empty()) node.add_child("addresses", monero_utils::to_property_tree(addresses));
    if (!destinations.empty()) node.add_child("destinations", monero_utils::to_property_tree(destinations));
    return node;
  }

  bool monero_transfer_request::meets_criteria(monero_transfer* transfer) const {
    if (transfer == nullptr) throw runtime_error("transfer is null");
    if (tx_request != boost::none && (*tx_request)->transfer_request != boost::none) throw runtime_error("Transfer request's tx request cannot have a circular transfer request");   // TODO: could auto detect and handle this.  port to java/js

    // filter on common fields
    if (getIsIncoming() != boost::none && *getIsIncoming() != *transfer->getIsIncoming()) return false;
    if (getIsOutgoing() != boost::none && getIsOutgoing() != transfer->getIsOutgoing()) return false;
    if (amount != boost::none && *amount != *transfer->amount) return false;
    if (account_index != boost::none && *account_index != *transfer->account_index) return false;

    // filter on incoming fields
    monero_incoming_transfer* inTransfer = dynamic_cast<monero_incoming_transfer*>(transfer);
    if (inTransfer != nullptr) {
      if (has_destinations != boost::none) return false;
      if (address != boost::none && *address != *inTransfer->address) return false;
      if (!addresses.empty() && find(addresses.begin(), addresses.end(), *inTransfer->address) == addresses.end()) return false;
      if (subaddress_index != boost::none && *subaddress_index != *inTransfer->subaddress_index) return false;
      if (!subaddress_indices.empty() && find(subaddress_indices.begin(), subaddress_indices.end(), *inTransfer->subaddress_index) == subaddress_indices.end()) return false;
    }

    // filter on outgoing fields
    monero_outgoing_transfer* out_transfer = dynamic_cast<monero_outgoing_transfer*>(transfer);
    if (out_transfer != nullptr) {

      // filter on addresses
      if (address != boost::none && (out_transfer->addresses.empty() || find(out_transfer->addresses.begin(), out_transfer->addresses.end(), *address) == out_transfer->addresses.end())) return false;   // TODO: will filter all transfers if they don't contain addresses
      if (!addresses.empty()) {
        bool intersects = false;
        for (const string& addressReq : addresses) {
          for (const string& address : out_transfer->addresses) {
            if (addressReq == address) {
              intersects = true;
              break;
            }
          }
        }
        if (!intersects) return false;  // must have overlapping addresses
      }

      // filter on subaddress indices
      if (subaddress_index != boost::none && (out_transfer->subaddress_indices.empty() || find(out_transfer->subaddress_indices.begin(), out_transfer->subaddress_indices.end(), *subaddress_index) == out_transfer->subaddress_indices.end())) return false;   // TODO: will filter all transfers if they don't contain subaddress indices
      if (!subaddress_indices.empty()) {
        bool intersects = false;
        for (const uint32_t& subaddressIndexReq : subaddress_indices) {
          for (const uint32_t& subaddress_index : out_transfer->subaddress_indices) {
            if (subaddressIndexReq == subaddress_index) {
              intersects = true;
              break;
            }
          }
        }
        if (!intersects) return false;  // must have overlapping subaddress indices
      }

      // filter on having destinations
      if (has_destinations != boost::none) {
        if (*has_destinations && out_transfer->destinations.empty()) return false;
        if (!*has_destinations && !out_transfer->destinations.empty()) return false;
      }

      // filter on destinations TODO: start with test for this
      //    if (this.getDestionations() != null && this.getDestionations() != transfer.getDestionations()) return false;
    }

    // validate type
    if (inTransfer == nullptr && out_transfer == nullptr) throw runtime_error("Transfer must be monero_incoming_transfer or monero_outgoing_transfer");

    // filter with tx request
    if (tx_request != boost::none && !(*tx_request)->meets_criteria(transfer->tx.get())) return false;
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
    tgt->account_index = src->account_index;
    tgt->subaddress_index = src->subaddress_index;
    tgt->is_spent = src->is_spent;
    tgt->is_unlocked = src->is_unlocked;
    tgt->is_frozen = src->is_frozen;
    return tgt;
  };

  boost::property_tree::ptree monero_output_wallet::to_property_tree() const {
    boost::property_tree::ptree node = monero_output::to_property_tree();
    if (account_index != boost::none) node.put("accountIndex", *account_index);
    if (subaddress_index != boost::none) node.put("subaddressIndex", *subaddress_index);
    if (is_spent != boost::none) node.put("isSpent", *is_spent);
    if (is_unlocked != boost::none) node.put("isUnlocked", *is_unlocked);
    if (is_frozen != boost::none) node.put("isFrozen", *is_frozen);
    return node;
  }

  void monero_output_wallet::merge(const shared_ptr<monero_output>& self, const shared_ptr<monero_output>& other) {
    merge(static_pointer_cast<monero_output_wallet>(self), static_pointer_cast<monero_output_wallet>(other));
  }

  void monero_output_wallet::merge(const shared_ptr<monero_output_wallet>& self, const shared_ptr<monero_output_wallet>& other) {
    throw runtime_error("monero_output_wallet::merge(self, other) not implemented");
  }

  // ------------------------ MONERO OUTPUT REQUEST ---------------------------

  shared_ptr<monero_output_request> monero_output_request::copy(const shared_ptr<monero_output>& src, const shared_ptr<monero_output>& tgt) const {
    return monero_output_request::copy(static_pointer_cast<monero_output_request>(src), static_pointer_cast<monero_output_request>(tgt));
  };

  shared_ptr<monero_output_request> monero_output_request::copy(const shared_ptr<monero_output_wallet>& src, const shared_ptr<monero_output_wallet>& tgt) const {
    return monero_output_request::copy(static_pointer_cast<monero_output_request>(src), static_pointer_cast<monero_output_request>(tgt));
  };

  shared_ptr<monero_output_request> monero_output_request::copy(const shared_ptr<monero_output_request>& src, const shared_ptr<monero_output_request>& tgt) const {
    MTRACE("monero_output_request::copy(output_request)");
    if (this != src.get()) throw runtime_error("this != src");

    // copy base class
    monero_output_wallet::copy(static_pointer_cast<monero_output>(src), static_pointer_cast<monero_output>(tgt));

    // copy extensions
    if (!src->subaddress_indices.empty()) tgt->subaddress_indices = vector<uint32_t>(src->subaddress_indices);
    return tgt;
  };

  boost::property_tree::ptree monero_output_request::to_property_tree() const {
    boost::property_tree::ptree node = monero_output_wallet::to_property_tree();
    if (!subaddress_indices.empty()) node.add_child("subaddressIndices", monero_utils::to_property_tree(subaddress_indices));
    return node;
  }

  bool monero_output_request::meets_criteria(monero_output_wallet* output) const {

    // filter on output
    if (account_index != boost::none && *account_index != *output->account_index) return false;
    if (subaddress_index != boost::none && *subaddress_index != *output->subaddress_index) return false;
    if (amount != boost::none && *amount != *output->amount) return false;
    if (is_spent != boost::none && *is_spent != *output->is_spent) return false;
    if (is_unlocked != boost::none && *is_unlocked != *output->is_unlocked) return false;

    // filter on output key image
    if (key_image != boost::none) {
      if (output->key_image == boost::none) return false;
      if ((*key_image)->hex != boost::none && ((*output->key_image)->hex == boost::none || *(*key_image)->hex != *(*output->key_image)->hex)) return false;
      if ((*key_image)->signature != boost::none && ((*output->key_image)->signature == boost::none || *(*key_image)->signature != *(*output->key_image)->signature)) return false;
    }

    // filter on extensions
    if (!subaddress_indices.empty() && find(subaddress_indices.begin(), subaddress_indices.end(), *output->subaddress_index) == subaddress_indices.end()) return false;

    // filter with tx request
    if (tx_request != boost::none && !(*tx_request)->meets_criteria(static_pointer_cast<monero_tx_wallet>(output->tx).get())) return false;

    // output meets request
    return true;
  }

  // ------------------------- MONERO SEND REQUEST ----------------------------

  boost::property_tree::ptree monero_send_request::to_property_tree() const {
    boost::property_tree::ptree node;
    if (!destinations.empty()) node.add_child("destinations", monero_utils::to_property_tree(destinations));
    if (payment_id != boost::none) node.put("paymentId", *payment_id);
    if (priority != boost::none) node.put("priority", *priority);
    if (mixin != boost::none) node.put("mixin", *mixin);
    if (ring_size != boost::none) node.put("ringSize", *ring_size);
    if (account_index != boost::none) node.put("accountIndex", *account_index);
    if (!subaddress_indices.empty()) node.add_child("subaddressIndices", monero_utils::to_property_tree(subaddress_indices));
    if (unlock_time != boost::none) node.put("unlockTime", *unlock_time);
    if (can_split != boost::none) node.put("canSplit", *can_split);
    if (do_not_relay != boost::none) node.put("doNotRelay", *do_not_relay);
    if (note != boost::none) node.put("note", *note);
    if (recipient_name != boost::none) node.put("recipientName", *recipient_name);
    if (below_amount != boost::none) node.put("belowAmount", *below_amount);
    if (sweep_each_subaddress != boost::none) node.put("sweepEachSubaddress", *sweep_each_subaddress);
    if (key_image != boost::none) node.put("keyImage", *key_image);
    return node;
  }

  // ---------------------- MONERO INTEGRATED ADDRESS -------------------------

  boost::property_tree::ptree monero_integrated_address::to_property_tree() const {
    boost::property_tree::ptree node;
    node.put("standardAddress", standard_address);
    node.put("paymentId", payment_id);
    node.put("integratedAddress", integrated_address);
    return node;
  }

  // -------------------- MONERO KEY IMAGE IMPORT RESULT ----------------------

  boost::property_tree::ptree monero_key_image_import_result::to_property_tree() const {
    boost::property_tree::ptree node;
    if (height != boost::none) node.put("height", *height);
    if (spent_amount != boost::none) node.put("spentAmount", *spent_amount);
    if (unspent_amount != boost::none) node.put("unspentAmount", *unspent_amount);
    return node;
  }

  // ----------------------------- MONERO CHECK -------------------------------

  boost::property_tree::ptree monero_check::to_property_tree() const {
    boost::property_tree::ptree node;
    node.put("isGood", is_good);
    return node;
  }

  // --------------------------- MONERO CHECK TX ------------------------------

  boost::property_tree::ptree monero_check_tx::to_property_tree() const {
    boost::property_tree::ptree node = monero_check::to_property_tree();;
    if (in_tx_pool != boost::none) node.put("inTxPool", *in_tx_pool);
    if (num_confirmations != boost::none) node.put("numConfirmations", *num_confirmations);
    if (received_amount != boost::none) node.put("receivedAmount", *received_amount);
    return node;
  }

  // ------------------------ MONERO CHECK RESERVE ----------------------------

  boost::property_tree::ptree monero_check_reserve::to_property_tree() const {
    boost::property_tree::ptree node = monero_check::to_property_tree();
    if (total_amount != boost::none) node.put("totalAmount", *total_amount);
    if (unconfirmed_spent_amount != boost::none) node.put("unconfirmedSpentAmount", *unconfirmed_spent_amount);
    return node;
  }
}
