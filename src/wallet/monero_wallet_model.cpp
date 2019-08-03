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

  void mergeIncomingTransfer(vector<shared_ptr<monero_incoming_transfer>>& transfers, const shared_ptr<monero_incoming_transfer>& transfer) {
    for (const shared_ptr<monero_incoming_transfer>& aTransfer : transfers) {
      if (aTransfer->accountIndex.get() == transfer->accountIndex.get() && aTransfer->subaddressIndex.get() == transfer->subaddressIndex.get()) {
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
    if (primaryAddress != boost::none) node.put("primaryAddress", *primaryAddress);
    if (balance != boost::none) node.put("balance", *balance);
    if (unlockedBalance != boost::none) node.put("unlockedBalance", *unlockedBalance);
    if (!subaddresses.empty()) node.add_child("subaddresses", monero_utils::to_property_tree(subaddresses));
    return node;
  }

  // -------------------------- MONERO SUBADDRESS -----------------------------

  boost::property_tree::ptree monero_subaddress::to_property_tree() const {
    boost::property_tree::ptree node;
    if (accountIndex != boost::none) node.put("accountIndex", *accountIndex);
    if (index != boost::none) node.put("index", *index);
    if (address != boost::none) node.put("address", *address);
    if (label != boost::none) node.put("label", *label);
    if (balance != boost::none) node.put("balance", *balance);
    if (unlockedBalance != boost::none) node.put("unlockedBalance", *unlockedBalance);
    if (numUnspentOutputs != boost::none) node.put("numUnspentOutputs", *numUnspentOutputs);
    if (isUsed != boost::none) node.put("isUsed", *isUsed);
    if (numBlocksToUnlock != boost::none) node.put("numBlocksToUnlock", *numBlocksToUnlock);
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
    if (!src->incomingTransfers.empty()) {
      tgt->incomingTransfers = vector<shared_ptr<monero_incoming_transfer>>();
      for (const shared_ptr<monero_incoming_transfer>& transfer : src->incomingTransfers) {
        shared_ptr<monero_incoming_transfer> transferCopy = transfer->copy(transfer, make_shared<monero_incoming_transfer>());
        transferCopy->tx = tgt;
        tgt->incomingTransfers.push_back(transferCopy);
      }
    }
    if (src->outgoingTransfer != boost::none) {
      shared_ptr<monero_outgoing_transfer> transferCopy = src->outgoingTransfer.get()->copy(src->outgoingTransfer.get(), make_shared<monero_outgoing_transfer>());
      transferCopy->tx = tgt;
      tgt->outgoingTransfer = transferCopy;
    }
    tgt->note = src->note;

    return tgt;
  };

  boost::property_tree::ptree monero_tx_wallet::to_property_tree() const {
    boost::property_tree::ptree node = monero_tx::to_property_tree();
    if (!incomingTransfers.empty()) node.add_child("incomingTransfers", monero_utils::to_property_tree(incomingTransfers));
    if (outgoingTransfer != boost::none) node.add_child("outgoingTransfer", (*outgoingTransfer)->to_property_tree());
    if (note != boost::none) node.put("note", *note);
    return node;
  }

  bool monero_tx_wallet::getIsOutgoing() const {
    return outgoingTransfer != boost::none;
  }

  bool monero_tx_wallet::getIsIncoming() const {
    return !incomingTransfers.empty();
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
    if (!other->incomingTransfers.empty()) {
      for (const shared_ptr<monero_incoming_transfer>& transfer : other->incomingTransfers) {  // NOTE: not using reference so shared_ptr is not deleted when tx is dereferenced
        transfer->tx = self;
        mergeIncomingTransfer(self->incomingTransfers, transfer);
      }
    }

    // merge outgoing transfer
    if (other->outgoingTransfer != boost::none) {
      other->outgoingTransfer.get()->tx = self;
      if (self->outgoingTransfer == boost::none) self->outgoingTransfer = other->outgoingTransfer;
      else self->outgoingTransfer.get()->merge(self->outgoingTransfer.get(), other->outgoingTransfer.get());
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
    tgt->isOutgoing = src->isOutgoing;
    tgt->isIncoming = src->isIncoming;
    if (!src->txIds.empty()) tgt->txIds = vector<string>(src->txIds);
    tgt-> hasPaymentId = src->hasPaymentId;
    if (!src->paymentIds.empty()) tgt->paymentIds = vector<string>(src->paymentIds);
    tgt->height = src->height;
    tgt->minHeight = src->minHeight;
    tgt->maxHeight = src->maxHeight;
    tgt->includeOutputs = src->includeOutputs;
    if (src->transferRequest != boost::none) tgt->transferRequest = src->transferRequest.get()->copy(src->transferRequest.get(), make_shared<monero_transfer_request>());
    if (src->outputRequest != boost::none) tgt->outputRequest = src->outputRequest.get()->copy(src->outputRequest.get(), make_shared<monero_output_request>());
    return tgt;
  };

  boost::property_tree::ptree monero_tx_request::to_property_tree() const {
    boost::property_tree::ptree node = monero_tx_wallet::to_property_tree();
    if (isOutgoing != boost::none) node.put("isOutgoing", *isOutgoing);
    if (isIncoming != boost::none) node.put("isIncoming", *isIncoming);
    if (!txIds.empty()) node.add_child("txIds", monero_utils::to_property_tree(txIds));
    if (hasPaymentId != boost::none) node.put("hasPaymentId", *hasPaymentId);
    if (!paymentIds.empty()) node.add_child("paymentIds", monero_utils::to_property_tree(paymentIds));
    if (height != boost::none) node.put("height", *height);
    if (minHeight != boost::none) node.put("minHeight", *minHeight);
    if (maxHeight != boost::none) node.put("maxHeight", *maxHeight);
    if (includeOutputs != boost::none) node.put("includeOutputs", *includeOutputs);
    if (transferRequest != boost::none) node.add_child("transferRequest", (*transferRequest)->to_property_tree());
    return node;
  }

  bool monero_tx_request::meetsCriteria(monero_tx_wallet* tx) const {
    if (tx == nullptr) return false;

    // filter on tx
    if (id != boost::none && id != tx->id) return false;
    if (paymentId != boost::none && paymentId != tx->paymentId) return false;
    if (isConfirmed != boost::none && isConfirmed != tx->isConfirmed) return false;
    if (inTxPool != boost::none && inTxPool != tx->inTxPool) return false;
    if (doNotRelay != boost::none && doNotRelay != tx->doNotRelay) return false;
    if (isFailed != boost::none && isFailed != tx->isFailed) return false;
    if (isMinerTx != boost::none && isMinerTx != tx->isMinerTx) return false;

    // at least one transfer must meet transfer request if defined
    if (transferRequest != boost::none) {
      bool matchFound = false;
      if (tx->outgoingTransfer != boost::none && (*transferRequest)->meetsCriteria((*tx->outgoingTransfer).get())) matchFound = true;
      else if (!tx->incomingTransfers.empty()) {
        for (const shared_ptr<monero_incoming_transfer>& incomingTransfer : tx->incomingTransfers) {
          if ((*transferRequest)->meetsCriteria(incomingTransfer.get())) {
            matchFound = true;
            break;
          }
        }
      }
      if (!matchFound) return false;
    }

    // filter on having a payment id
    if (hasPaymentId != boost::none) {
      if (*hasPaymentId && tx->paymentId == boost::none) return false;
      if (!*hasPaymentId && tx->paymentId != boost::none) return false;
    }

    // filter on incoming
    if (isIncoming != boost::none && isIncoming != tx->getIsIncoming()) return false;

    // filter on outgoing
    if (isOutgoing != boost::none && isOutgoing != tx->getIsOutgoing()) return false;

    // filter on remaining fields
    boost::optional<uint64_t> txHeight = tx->get_height();
    if (!txIds.empty() && find(txIds.begin(), txIds.end(), *tx->id) == txIds.end()) return false;
    if (!paymentIds.empty() && (tx->paymentId == boost::none || find(paymentIds.begin(), paymentIds.end(), *tx->paymentId) == paymentIds.end())) return false;
    if (height != boost::none && (txHeight == boost::none || *txHeight != *height)) return false;
    if (minHeight != boost::none && (txHeight == boost::none || *txHeight < *minHeight)) return false;
    if (maxHeight != boost::none && (txHeight == boost::none || *txHeight > *maxHeight)) return false;

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
    tgt->accountIndex = src->accountIndex;
    tgt->numSuggestedConfirmations = src->numSuggestedConfirmations;
    return tgt;
  }

  boost::property_tree::ptree monero_transfer::to_property_tree() const {
    boost::property_tree::ptree node;
    if (amount != boost::none) node.put("amount", *amount);
    if (accountIndex != boost::none) node.put("accountIndex", *accountIndex);
    if (numSuggestedConfirmations != boost::none) node.put("numSuggestedConfirmations", *numSuggestedConfirmations);
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
    accountIndex = monero_utils::reconcile(accountIndex, other->accountIndex, "acountIndex");

    // TODO monero core: failed tx in pool (after testUpdateLockedDifferentAccounts()) causes non-originating saved wallets to return duplicate incoming transfers but one has amount/numSuggestedConfirmations of 0
    if (amount != boost::none && other->amount != boost::none && *amount != *other->amount && (*amount == 0 || *other->amount == 0)) {
      accountIndex = monero_utils::reconcile(accountIndex, other->accountIndex, boost::none, boost::none, true, "acountIndex");
      numSuggestedConfirmations = monero_utils::reconcile(numSuggestedConfirmations, other->numSuggestedConfirmations, boost::none, boost::none, true, "numSuggestedConfirmations");
      MWARNING("WARNING: failed tx in pool causes non-originating wallets to return duplicate incoming transfers but with one amount/numSuggestedConfirmations of 0");
    } else {
      amount = monero_utils::reconcile(amount, other->amount, "transfer amount");
      numSuggestedConfirmations = monero_utils::reconcile(numSuggestedConfirmations, other->numSuggestedConfirmations, boost::none, boost::none, false, "numSuggestedConfirmations");
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
    if (subaddressIndex != boost::none) node.put("subaddressIndex", *subaddressIndex);
    if (address != boost::none) node.put("address", *address);
    return node;
  }

  void monero_incoming_transfer::merge(const shared_ptr<monero_transfer>& self, const shared_ptr<monero_transfer>& other) {
    merge(static_pointer_cast<monero_incoming_transfer>(self), static_pointer_cast<monero_incoming_transfer>(other));
  }

  void monero_incoming_transfer::merge(const shared_ptr<monero_incoming_transfer>& self, const shared_ptr<monero_incoming_transfer>& other) {
    if (self == other) return;
    monero_transfer::merge(self, other);
    subaddressIndex = monero_utils::reconcile(subaddressIndex, other->subaddressIndex, "incoming transfer subaddressIndex");
    address = monero_utils::reconcile(address, other->address);
  }

  // ----------------------- MONERO OUTGOING TRANSFER -------------------------

  shared_ptr<monero_outgoing_transfer> monero_outgoing_transfer::copy(const shared_ptr<monero_transfer>& src, const shared_ptr<monero_transfer>& tgt) const {
    return copy(static_pointer_cast<monero_outgoing_transfer>(src), static_pointer_cast<monero_outgoing_transfer>(tgt));
  };

  shared_ptr<monero_outgoing_transfer> monero_outgoing_transfer::copy(const shared_ptr<monero_outgoing_transfer>& src, const shared_ptr<monero_outgoing_transfer>& tgt) const {
    throw runtime_error("monero_outgoing_transfer::copy(outTransfer) not implemented");
  };

  boost::optional<bool> monero_outgoing_transfer::getIsIncoming() const { return false; }

  boost::property_tree::ptree monero_outgoing_transfer::to_property_tree() const {
    boost::property_tree::ptree node = monero_transfer::to_property_tree();
    if (!subaddressIndices.empty()) node.add_child("subaddressIndices", monero_utils::to_property_tree(subaddressIndices));
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
    subaddressIndices = monero_utils::reconcile(subaddressIndices, other->subaddressIndices);
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
    tgt->isIncoming = src->isIncoming;
    tgt->address = src->address;
    if (!src->addresses.empty()) tgt->addresses = vector<string>(src->addresses);
    tgt->subaddressIndex = src->subaddressIndex;
    if (!src->subaddressIndices.empty()) tgt->subaddressIndices = vector<uint32_t>(src->subaddressIndices);
    if (!src->destinations.empty()) {
      for (const shared_ptr<monero_destination>& destination : src->destinations) {
        tgt->destinations.push_back(destination->copy(destination, make_shared<monero_destination>()));
      }
    }
    tgt->hasDestinations = src->hasDestinations;
    tgt->txRequest = src->txRequest;
    return tgt;
  };

  boost::optional<bool> monero_transfer_request::getIsIncoming() const { return isIncoming; }

  boost::property_tree::ptree monero_transfer_request::to_property_tree() const {
    boost::property_tree::ptree node = monero_transfer::to_property_tree();
    if (getIsIncoming() != boost::none) node.put("isIncoming", *getIsIncoming());
    if (address != boost::none) node.put("address", *address);
    if (subaddressIndex != boost::none) node.put("subaddressIndex", *subaddressIndex);
    if (hasDestinations != boost::none) node.put("hasDestinations", *hasDestinations);
    if (!subaddressIndices.empty()) node.add_child("subaddressIndices", monero_utils::to_property_tree(subaddressIndices));
    if (!addresses.empty()) node.add_child("addresses", monero_utils::to_property_tree(addresses));
    if (!destinations.empty()) node.add_child("destinations", monero_utils::to_property_tree(destinations));
    return node;
  }

  bool monero_transfer_request::meetsCriteria(monero_transfer* transfer) const {
    if (transfer == nullptr) throw runtime_error("transfer is null");
    if (txRequest != boost::none && (*txRequest)->transferRequest != boost::none) throw runtime_error("Transfer request's tx request cannot have a circular transfer request");   // TODO: could auto detect and handle this.  port to java/js

    // filter on common fields
    if (getIsIncoming() != boost::none && *getIsIncoming() != *transfer->getIsIncoming()) return false;
    if (getIsOutgoing() != boost::none && getIsOutgoing() != transfer->getIsOutgoing()) return false;
    if (amount != boost::none && *amount != *transfer->amount) return false;
    if (accountIndex != boost::none && *accountIndex != *transfer->accountIndex) return false;

    // filter on incoming fields
    monero_incoming_transfer* inTransfer = dynamic_cast<monero_incoming_transfer*>(transfer);
    if (inTransfer != nullptr) {
      if (hasDestinations != boost::none) return false;
      if (address != boost::none && *address != *inTransfer->address) return false;
      if (!addresses.empty() && find(addresses.begin(), addresses.end(), *inTransfer->address) == addresses.end()) return false;
      if (subaddressIndex != boost::none && *subaddressIndex != *inTransfer->subaddressIndex) return false;
      if (!subaddressIndices.empty() && find(subaddressIndices.begin(), subaddressIndices.end(), *inTransfer->subaddressIndex) == subaddressIndices.end()) return false;
    }

    // filter on outgoing fields
    monero_outgoing_transfer* outTransfer = dynamic_cast<monero_outgoing_transfer*>(transfer);
    if (outTransfer != nullptr) {

      // filter on addresses
      if (address != boost::none && (outTransfer->addresses.empty() || find(outTransfer->addresses.begin(), outTransfer->addresses.end(), *address) == outTransfer->addresses.end())) return false;   // TODO: will filter all transfers if they don't contain addresses
      if (!addresses.empty()) {
        bool intersects = false;
        for (const string& addressReq : addresses) {
          for (const string& address : outTransfer->addresses) {
            if (addressReq == address) {
              intersects = true;
              break;
            }
          }
        }
        if (!intersects) return false;  // must have overlapping addresses
      }

      // filter on subaddress indices
      if (subaddressIndex != boost::none && (outTransfer->subaddressIndices.empty() || find(outTransfer->subaddressIndices.begin(), outTransfer->subaddressIndices.end(), *subaddressIndex) == outTransfer->subaddressIndices.end())) return false;   // TODO: will filter all transfers if they don't contain subaddress indices
      if (!subaddressIndices.empty()) {
        bool intersects = false;
        for (const uint32_t& subaddressIndexReq : subaddressIndices) {
          for (const uint32_t& subaddressIndex : outTransfer->subaddressIndices) {
            if (subaddressIndexReq == subaddressIndex) {
              intersects = true;
              break;
            }
          }
        }
        if (!intersects) return false;  // must have overlapping subaddress indices
      }

      // filter on having destinations
      if (hasDestinations != boost::none) {
        if (*hasDestinations && outTransfer->destinations.empty()) return false;
        if (!*hasDestinations && !outTransfer->destinations.empty()) return false;
      }

      // filter on destinations TODO: start with test for this
      //    if (this.getDestionations() != null && this.getDestionations() != transfer.getDestionations()) return false;
    }

    // validate type
    if (inTransfer == nullptr && outTransfer == nullptr) throw runtime_error("Transfer must be monero_incoming_transfer or monero_outgoing_transfer");

    // filter with tx request
    if (txRequest != boost::none && !(*txRequest)->meetsCriteria(transfer->tx.get())) return false;
    return true;
  }

  // ------------------------- MONERO OUTPUT WALLET ---------------------------

  shared_ptr<monero_output_wallet> monero_output_wallet::copy(const shared_ptr<monero_output>& src, const shared_ptr<monero_output>& tgt) const {
    MTRACE("monero_output_wallet::copy(output)");
    return monero_output_wallet::copy(static_pointer_cast<monero_output_wallet>(src), static_pointer_cast<monero_output_wallet>(tgt));
  };

  shared_ptr<monero_output_wallet> monero_output_wallet::copy(const shared_ptr<monero_output_wallet>& src, const shared_ptr<monero_output_wallet>& tgt) const {
    MTRACE("monero_output_wallet::copy(outputWallet)");
    if (this != src.get()) throw runtime_error("this != src");

    // copy base class
    monero_output::copy(static_pointer_cast<monero_output>(src), static_pointer_cast<monero_output>(tgt));

    // copy extensions
    tgt->accountIndex = src->accountIndex;
    tgt->subaddressIndex = src->subaddressIndex;
    tgt->isSpent = src->isSpent;
    tgt->isUnlocked = src->isUnlocked;
    tgt->isFrozen = src->isFrozen;
    return tgt;
  };

  boost::property_tree::ptree monero_output_wallet::to_property_tree() const {
    boost::property_tree::ptree node = monero_output::to_property_tree();
    if (accountIndex != boost::none) node.put("accountIndex", *accountIndex);
    if (subaddressIndex != boost::none) node.put("subaddressIndex", *subaddressIndex);
    if (isSpent != boost::none) node.put("isSpent", *isSpent);
    if (isUnlocked != boost::none) node.put("isUnlocked", *isUnlocked);
    if (isFrozen != boost::none) node.put("isFrozen", *isFrozen);
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
    MTRACE("monero_output_request::copy(outputRequest)");
    if (this != src.get()) throw runtime_error("this != src");

    // copy base class
    monero_output_wallet::copy(static_pointer_cast<monero_output>(src), static_pointer_cast<monero_output>(tgt));

    // copy extensions
    if (!src->subaddressIndices.empty()) tgt->subaddressIndices = vector<uint32_t>(src->subaddressIndices);
    return tgt;
  };

  boost::property_tree::ptree monero_output_request::to_property_tree() const {
    boost::property_tree::ptree node = monero_output_wallet::to_property_tree();
    if (!subaddressIndices.empty()) node.add_child("subaddressIndices", monero_utils::to_property_tree(subaddressIndices));
    return node;
  }

  bool monero_output_request::meetsCriteria(monero_output_wallet* output) const {

    // filter on output
    if (accountIndex != boost::none && *accountIndex != *output->accountIndex) return false;
    if (subaddressIndex != boost::none && *subaddressIndex != *output->subaddressIndex) return false;
    if (amount != boost::none && *amount != *output->amount) return false;
    if (isSpent != boost::none && *isSpent != *output->isSpent) return false;
    if (isUnlocked != boost::none && *isUnlocked != *output->isUnlocked) return false;

    // filter on output key image
    if (keyImage != boost::none) {
      if (output->keyImage == boost::none) return false;
      if ((*keyImage)->hex != boost::none && ((*output->keyImage)->hex == boost::none || *(*keyImage)->hex != *(*output->keyImage)->hex)) return false;
      if ((*keyImage)->signature != boost::none && ((*output->keyImage)->signature == boost::none || *(*keyImage)->signature != *(*output->keyImage)->signature)) return false;
    }

    // filter on extensions
    if (!subaddressIndices.empty() && find(subaddressIndices.begin(), subaddressIndices.end(), *output->subaddressIndex) == subaddressIndices.end()) return false;

    // filter with tx request
    if (txRequest != boost::none && !(*txRequest)->meetsCriteria(static_pointer_cast<monero_tx_wallet>(output->tx).get())) return false;

    // output meets request
    return true;
  }

  // ------------------------- MONERO SEND REQUEST ----------------------------

  boost::property_tree::ptree monero_send_request::to_property_tree() const {
    boost::property_tree::ptree node;
    if (!destinations.empty()) node.add_child("destinations", monero_utils::to_property_tree(destinations));
    if (paymentId != boost::none) node.put("paymentId", *paymentId);
    if (priority != boost::none) node.put("priority", *priority);
    if (mixin != boost::none) node.put("mixin", *mixin);
    if (ringSize != boost::none) node.put("ringSize", *ringSize);
    if (accountIndex != boost::none) node.put("accountIndex", *accountIndex);
    if (!subaddressIndices.empty()) node.add_child("subaddressIndices", monero_utils::to_property_tree(subaddressIndices));
    if (unlockTime != boost::none) node.put("unlockTime", *unlockTime);
    if (canSplit != boost::none) node.put("canSplit", *canSplit);
    if (doNotRelay != boost::none) node.put("doNotRelay", *doNotRelay);
    if (note != boost::none) node.put("note", *note);
    if (recipientName != boost::none) node.put("recipientName", *recipientName);
    if (belowAmount != boost::none) node.put("belowAmount", *belowAmount);
    if (sweepEachSubaddress != boost::none) node.put("sweepEachSubaddress", *sweepEachSubaddress);
    if (keyImage != boost::none) node.put("keyImage", *keyImage);
    return node;
  }

  // ---------------------- MONERO INTEGRATED ADDRESS -------------------------

  boost::property_tree::ptree monero_integrated_address::to_property_tree() const {
    boost::property_tree::ptree node;
    node.put("standardAddress", standardAddress);
    node.put("paymentId", paymentId);
    node.put("integratedAddress", integratedAddress);
    return node;
  }

  // -------------------- MONERO KEY IMAGE IMPORT RESULT ----------------------

  boost::property_tree::ptree monero_key_image_import_result::to_property_tree() const {
    boost::property_tree::ptree node;
    if (height != boost::none) node.put("height", *height);
    if (spentAmount != boost::none) node.put("spentAmount", *spentAmount);
    if (unspentAmount != boost::none) node.put("unspentAmount", *unspentAmount);
    return node;
  }

  // ----------------------------- MONERO CHECK -------------------------------

  boost::property_tree::ptree monero_check::to_property_tree() const {
    boost::property_tree::ptree node;
    node.put("isGood", isGood);
    return node;
  }

  // --------------------------- MONERO CHECK TX ------------------------------

  boost::property_tree::ptree monero_check_tx::to_property_tree() const {
    boost::property_tree::ptree node = monero_check::to_property_tree();;
    if (inTxPool != boost::none) node.put("inTxPool", *inTxPool);
    if (numConfirmations != boost::none) node.put("numConfirmations", *numConfirmations);
    if (receivedAmount != boost::none) node.put("receivedAmount", *receivedAmount);
    return node;
  }

  // ------------------------ MONERO CHECK RESERVE ----------------------------

  boost::property_tree::ptree monero_check_reserve::to_property_tree() const {
    boost::property_tree::ptree node = monero_check::to_property_tree();
    if (totalAmount != boost::none) node.put("totalAmount", *totalAmount);
    if (unconfirmedSpentAmount != boost::none) node.put("unconfirmedSpentAmount", *unconfirmedSpentAmount);
    return node;
  }
}
