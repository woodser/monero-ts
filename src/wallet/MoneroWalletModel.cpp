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

#include "MoneroWallet.h"

#include "utils/MoneroUtils.h"
#include <stdio.h>
#include <iostream>

using namespace std;
using namespace cryptonote; // TODO: delete?
using namespace epee; // TODO: delete?

/**
 * Public library interface.
 */
namespace monero {

  // ----------------------- UNDECLARED PRIVATE HELPERS -----------------------

  void mergeIncomingTransfer(vector<shared_ptr<MoneroIncomingTransfer>>& transfers, const shared_ptr<MoneroIncomingTransfer>& transfer) {
    for (const shared_ptr<MoneroIncomingTransfer>& aTransfer : transfers) {
      if (aTransfer->accountIndex.get() == transfer->accountIndex.get() && aTransfer->subaddressIndex.get() == transfer->subaddressIndex.get()) {
        aTransfer->merge(aTransfer, transfer);
        return;
      }
    }
    transfers.push_back(transfer);
  }

  // ---------------------------- MONERO ACCOUNT ------------------------------

  // TODO: ensure return object is not being unecessarily copied
  boost::property_tree::ptree MoneroAccount::toPropertyTree() const {
    //cout << "MoneroAccount::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node;
    if (index != boost::none) node.put("index", *index);
    if (primaryAddress != boost::none) node.put("primaryAddress", *primaryAddress);
    if (balance != boost::none) node.put("balance", *balance);
    if (unlockedBalance != boost::none) node.put("unlockedBalance", *unlockedBalance);
    if (!subaddresses.empty()) node.add_child("subaddresses", MoneroUtils::toPropertyTree(subaddresses));
    return node;
  }

  // -------------------------- MONERO SUBADDRESS -----------------------------

  boost::property_tree::ptree MoneroSubaddress::toPropertyTree() const {
    //cout << "MoneroSubaddress::toPropertyTree(node)" << endl;
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

  boost::property_tree::ptree MoneroTxWallet::toPropertyTree() const {
    boost::property_tree::ptree node = MoneroTx::toPropertyTree();
    if (!incomingTransfers.empty()) node.add_child("incomingTransfers", MoneroUtils::toPropertyTree(incomingTransfers));
    if (outgoingTransfer != boost::none) node.add_child("outgoingTransfer", (*outgoingTransfer)->toPropertyTree());
    if (note != boost::none) node.put("note", *note);
    return node;
  }

  bool MoneroTxWallet::getIsOutgoing() const {
    return outgoingTransfer != boost::none;
  }

  bool MoneroTxWallet::getIsIncoming() const {
    return !incomingTransfers.empty();
  }

  void MoneroTxWallet::merge(const shared_ptr<MoneroTx>& self, const shared_ptr<MoneroTx>& other) {
    merge(static_pointer_cast<MoneroTxWallet>(self), static_pointer_cast<MoneroTxWallet>(other));
  }

  void MoneroTxWallet::merge(const shared_ptr<MoneroTxWallet>& self, const shared_ptr<MoneroTxWallet>& other) {
    if (this != self.get()) throw runtime_error("this != self");
    if (self == other) return;

    // merge base classes
    MoneroTx::merge(self, other);

    // merge wallet extensions
    note = MoneroUtils::reconcile(note, other->note);

    // merge incoming transfers
    if (!other->incomingTransfers.empty()) {
      for (const shared_ptr<MoneroIncomingTransfer>& transfer : other->incomingTransfers) {  // NOTE: not using reference so shared_ptr is not deleted when tx is dereferenced
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

  boost::property_tree::ptree MoneroTxRequest::toPropertyTree() const {
//    cout << "MoneroTxRequest::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node = MoneroTxWallet::toPropertyTree();
    if (isOutgoing != boost::none) node.put("isOutgoing", *isOutgoing);
    if (isIncoming != boost::none) node.put("isIncoming", *isIncoming);
    if (!txIds.empty()) node.add_child("txIds", MoneroUtils::toPropertyTree(txIds));
    if (hasPaymentId != boost::none) node.put("hasPaymentId", *hasPaymentId);
    if (!paymentIds.empty()) node.add_child("paymentIds", MoneroUtils::toPropertyTree(paymentIds));
    if (height != boost::none) node.put("height", *height);
    if (minHeight != boost::none) node.put("minHeight", *minHeight);
    if (maxHeight != boost::none) node.put("maxHeight", *maxHeight);
    if (includeOutputs != boost::none) node.put("includeOutputs", *includeOutputs);
    if (transferRequest != boost::none) node.add_child("transferRequest", (*transferRequest)->toPropertyTree());
    return node;
  }

  bool MoneroTxRequest::meetsCriteria(MoneroTxWallet* tx) const {
    if (tx == nullptr) return false;

    //cout << "MoneroTxRequest::meetsCriteria()" << endl;
    //cout << "Testing tx: " << tx->serialize() << endl;
    //cout << "1" << endl;

    // filter on tx
    if (id != boost::none && id != tx->id) return false;
    if (paymentId != boost::none && paymentId != tx->paymentId) return false;
    if (isConfirmed != boost::none && isConfirmed != tx->isConfirmed) return false;
    if (inTxPool != boost::none && inTxPool != tx->inTxPool) return false;
    if (doNotRelay != boost::none && doNotRelay != tx->doNotRelay) return false;
    if (isFailed != boost::none && isFailed != tx->isFailed) return false;
    if (isCoinbase != boost::none && isCoinbase != tx->isCoinbase) return false;

    //cout << "2" << endl;

    // at least one transfer must meet transfer request if defined
    if (transferRequest != boost::none) {
      bool matchFound = false;
      if (tx->outgoingTransfer != boost::none && (*transferRequest)->meetsCriteria((*tx->outgoingTransfer).get())) matchFound = true;
      else if (!tx->incomingTransfers.empty()) {
        for (const shared_ptr<MoneroIncomingTransfer>& incomingTransfer : tx->incomingTransfers) {
          if ((*transferRequest)->meetsCriteria(incomingTransfer.get())) {
            matchFound = true;
            break;
          }
        }
      }
      if (!matchFound) return false;
    }

    //cout << "3" << endl;

    // filter on having a payment id
    if (hasPaymentId != boost::none) {
      if (*hasPaymentId && tx->paymentId == boost::none) return false;
      if (!*hasPaymentId && tx->paymentId != boost::none) return false;
    }

    //cout << "4" << endl;

    // filter on incoming
    if (isIncoming != boost::none && isIncoming != tx->getIsIncoming()) return false;

    //cout << "5" << endl;

    // filter on outgoing
    if (isOutgoing != boost::none && isOutgoing != tx->getIsOutgoing()) return false;

    //cout << "6" << endl;

    // filter on remaining fields
    boost::optional<uint64_t> txHeight = tx->getHeight();
    if (!txIds.empty() && find(txIds.begin(), txIds.end(), *tx->id) == txIds.end()) return false;
    if (!paymentIds.empty() && (tx->paymentId == boost::none || find(paymentIds.begin(), paymentIds.end(), *tx->paymentId) == paymentIds.end())) return false;
    if (height != boost::none && (txHeight == boost::none || *txHeight != *height)) return false;
    if (minHeight != boost::none && (txHeight == boost::none || *txHeight < *minHeight)) return false;
    if (maxHeight != boost::none && (txHeight == boost::none || *txHeight > *maxHeight)) return false;

    //cout << "7" << endl;

    // transaction meets request criteria
    return true;
  }

  //boost::property_tree::ptree MoneroUtils::txRequestToPropertyTree(const MoneroTxRequest& tx) {
  //  cout << "txWalletToPropertyTree(tx)" << endl;
  //  boost::property_tree::ptree txNode = txWalletToPropertyTree(tx);
  //  if (tx.isOutgoing != boost::none) txNode.put("isOutgoing", *tx.isOutgoing);
  //  if (tx.isIncoming != boost::none) txNode.put("isIncoming", *tx.isIncoming);
  //  if (!tx.txIds.empty()) throw runtime_error("not implemented");
  //  if (tx.hasPaymentId != boost::none) txNode.put("hasPaymentId", *tx.hasPaymentId);
  //  if (!tx.paymentIds.empty()) throw runtime_error("not implemented");
  //  if (tx.minHeight != boost::none) txNode.put("minHeight", *tx.minHeight);
  //  if (tx.maxHeight != boost::none) txNode.put("maxHeight", *tx.maxHeight);
  //  if (tx.includeOutputs != boost::none) txNode.put("includeOutputs", *tx.includeOutputs);
  //  if (tx.transferRequest != boost::none) throw runtime_error("not implemented");
  //  return txNode;
  //}

  // -------------------------- MONERO DESTINATION ----------------------------

  boost::property_tree::ptree MoneroDestination::toPropertyTree() const {
    //cout << "MoneroDestination::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node;
    if (address != boost::none) node.put("address", *address);
    if (amount != boost::none) node.put("amount", *amount);
    return node;
  }

  // ---------------------------- MONERO TRANSFER -----------------------------

  boost::property_tree::ptree MoneroTransfer::toPropertyTree() const {
    //cout << "MoneroTransfer::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node;
    if (amount != boost::none) node.put("amount", *amount);
    if (accountIndex != boost::none) node.put("accountIndex", *accountIndex);
    if (numSuggestedConfirmations != boost::none) node.put("numSuggestedConfirmations", *numSuggestedConfirmations);
    return node;
  }

  void MoneroTransfer::merge(const shared_ptr<MoneroTransfer>& self, const shared_ptr<MoneroTransfer>& other) {
    //cout << "MoneroTransfer::merge" << endl;
    if (this != self.get()) throw runtime_error("this != self");
    if (self == other) return;

    // merge txs if they're different which comes back to merging transfers
    if (tx != other->tx) {
      tx->merge(tx, other->tx);
      return;
    }

    // otherwise merge transfer fields
    accountIndex = MoneroUtils::reconcile(accountIndex, other->accountIndex, "acountIndex");

    // TODO monero core: failed tx in pool (after testUpdateLockedDifferentAccounts()) causes non-originating saved wallets to return duplicate incoming transfers but one has amount/numSuggestedConfirmations of 0
    if (amount != boost::none && other->amount != boost::none && *amount != *other->amount && (*amount == 0 || *other->amount == 0)) {
      accountIndex = MoneroUtils::reconcile(accountIndex, other->accountIndex, boost::none, boost::none, true, "acountIndex");
      numSuggestedConfirmations = MoneroUtils::reconcile(numSuggestedConfirmations, other->numSuggestedConfirmations, boost::none, boost::none, true, "numSuggestedConfirmations");
      cout << "WARNING: failed tx in pool causes non-originating wallets to return duplicate incoming transfers but with one amount/numSuggestedConfirmations of 0" << endl;
    } else {
      amount = MoneroUtils::reconcile(amount, other->amount, "transfer amount");
      numSuggestedConfirmations = MoneroUtils::reconcile(numSuggestedConfirmations, other->numSuggestedConfirmations, boost::none, boost::none, false, "numSuggestedConfirmations");
    }
  }

  // ----------------------- MONERO INCOMING TRANSFER -------------------------

  boost::optional<bool> MoneroIncomingTransfer::getIsIncoming() const { return true; }

  boost::property_tree::ptree MoneroIncomingTransfer::toPropertyTree() const {
    //cout << "MoneroIncomingTransfer::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node = MoneroTransfer::toPropertyTree();
    if (subaddressIndex != boost::none) node.put("subaddressIndex", *subaddressIndex);
    if (address != boost::none) node.put("address", *address);
    return node;
  }

  void MoneroIncomingTransfer::merge(const shared_ptr<MoneroTransfer>& self, const shared_ptr<MoneroTransfer>& other) {
    merge(static_pointer_cast<MoneroIncomingTransfer>(self), static_pointer_cast<MoneroIncomingTransfer>(other));
  }

  void MoneroIncomingTransfer::merge(const shared_ptr<MoneroIncomingTransfer>& self, const shared_ptr<MoneroIncomingTransfer>& other) {
    //cout << "MoneroIncomingTransfer::merge" << endl;
    if (self == other) return;
    MoneroTransfer::merge(self, other);
    subaddressIndex = MoneroUtils::reconcile(subaddressIndex, other->subaddressIndex, "incoming transfer subaddressIndex");
    address = MoneroUtils::reconcile(address, other->address);
  }

  // ----------------------- MONERO OUTGOING TRANSFER -------------------------

  boost::optional<bool> MoneroOutgoingTransfer::getIsIncoming() const { return false; }

  boost::property_tree::ptree MoneroOutgoingTransfer::toPropertyTree() const {
    //cout << "MoneroOutgoingTransfer::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node = MoneroTransfer::toPropertyTree();
    if (!subaddressIndices.empty()) node.add_child("subaddressIndices", MoneroUtils::toPropertyTree(subaddressIndices));
    if (!addresses.empty()) node.add_child("addresses", MoneroUtils::toPropertyTree(addresses));
    if (!destinations.empty()) node.add_child("destinations", MoneroUtils::toPropertyTree(destinations));
    return node;
  }

  void MoneroOutgoingTransfer::merge(const shared_ptr<MoneroTransfer>& self, const shared_ptr<MoneroTransfer>& other) {
    merge(static_pointer_cast<MoneroOutgoingTransfer>(self), static_pointer_cast<MoneroOutgoingTransfer>(other));
  }

  void MoneroOutgoingTransfer::merge(const shared_ptr<MoneroOutgoingTransfer>& self, const shared_ptr<MoneroOutgoingTransfer>& other) {
    //cout << "MoneroOutgoingTransfer::merge" << endl;
    if (self == other) return;
    MoneroTransfer::merge(self, other);
    subaddressIndices = MoneroUtils::reconcile(subaddressIndices, other->subaddressIndices);
    addresses = MoneroUtils::reconcile(addresses, other->addresses);
    destinations = MoneroUtils::reconcile(destinations, other->destinations);
  }

  // ----------------------- MONERO TRANSFER REQUEST --------------------------

  boost::optional<bool> MoneroTransferRequest::getIsIncoming() const { return isIncoming; }

  boost::property_tree::ptree MoneroTransferRequest::toPropertyTree() const {
    //cout << "MoneroTransferRequest::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node = MoneroTransfer::toPropertyTree();
    if (getIsIncoming() != boost::none) node.put("isIncoming", *getIsIncoming());
    if (address != boost::none) node.put("address", *address);
    if (subaddressIndex != boost::none) node.put("subaddressIndex", *subaddressIndex);
    if (hasDestinations != boost::none) node.put("hasDestinations", *hasDestinations);
    if (!subaddressIndices.empty()) node.add_child("subaddressIndices", MoneroUtils::toPropertyTree(subaddressIndices));
    if (!addresses.empty()) node.add_child("addresses", MoneroUtils::toPropertyTree(addresses));
    if (!destinations.empty()) node.add_child("destinations", MoneroUtils::toPropertyTree(destinations));
    return node;
  }

  bool MoneroTransferRequest::meetsCriteria(MoneroTransfer* transfer) const {
    //cout << "MoneroTransferRequest::meetsCriteria()" << endl;
    if (transfer == nullptr) throw runtime_error("transfer is null"); // TODO: port to java/js
    if (txRequest != boost::none && (*txRequest)->transferRequest != boost::none) throw runtime_error("Transfer request's tx request cannot have a circular transfer request");   // TODO: could auto detect and handl this.  port to java/js

    //cout << "1" << endl;

    // filter on common fields
    if (getIsIncoming() != boost::none && *getIsIncoming() != *transfer->getIsIncoming()) return false;
    if (getIsOutgoing() != boost::none && getIsOutgoing() != transfer->getIsOutgoing()) return false;
    if (amount != boost::none && *amount != *transfer->amount) return false;
    if (accountIndex != boost::none && *accountIndex != *transfer->accountIndex) return false;

    //cout << "2" << endl;

    // filter on incoming fields
    MoneroIncomingTransfer* inTransfer = dynamic_cast<MoneroIncomingTransfer*>(transfer);
    if (inTransfer != nullptr) {
      if (hasDestinations != boost::none) return false;
      if (address != boost::none && *address != *inTransfer->address) return false;
      if (!addresses.empty() && find(addresses.begin(), addresses.end(), *inTransfer->address) == addresses.end()) return false;
      if (subaddressIndex != boost::none && *subaddressIndex != *inTransfer->subaddressIndex) return false;
      if (!subaddressIndices.empty() && find(subaddressIndices.begin(), subaddressIndices.end(), *inTransfer->subaddressIndex) == subaddressIndices.end()) return false;
    }

    //cout << "3" << endl;

    // filter on outgoing fields
    MoneroOutgoingTransfer* outTransfer = dynamic_cast<MoneroOutgoingTransfer*>(transfer);
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

    //cout << "4" << endl;

    // validate type
    if (inTransfer == nullptr && outTransfer == nullptr) throw runtime_error("Transfer must be MoneroIncomingTransfer or MoneroOutgoingTransfer");

    // filter with tx request
    if (txRequest != boost::none && !(*txRequest)->meetsCriteria(transfer->tx.get())) return false;
    return true;
  }

  // ------------------------- MONERO OUTPUT WALLET ---------------------------

  boost::property_tree::ptree MoneroOutputWallet::toPropertyTree() const {
    //cout << "MoneroTransfer::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node = MoneroOutput::toPropertyTree();
    if (accountIndex != boost::none) node.put("accountIndex", *accountIndex);
    if (subaddressIndex != boost::none) node.put("subaddressIndex", *subaddressIndex);
    if (isSpent != boost::none) node.put("isSpent", *isSpent);
    if (isUnlocked != boost::none) node.put("isUnlocked", *isUnlocked);
    if (isFrozen != boost::none) node.put("isFrozen", *isFrozen);
    return node;
  }

  void MoneroOutputWallet::merge(const shared_ptr<MoneroOutput>& self, const shared_ptr<MoneroOutput>& other) {
    merge(static_pointer_cast<MoneroOutputWallet>(self), static_pointer_cast<MoneroOutputWallet>(other));
  }

  void MoneroOutputWallet::merge(const shared_ptr<MoneroOutputWallet>& self, const shared_ptr<MoneroOutputWallet>& other) {
    throw runtime_error("MoneroOutputWallet::merge(self, other) not implemented");
  }

  // ------------------------ MONERO OUTPUT REQUEST ---------------------------

  boost::property_tree::ptree MoneroOutputRequest::toPropertyTree() const {
    boost::property_tree::ptree node = MoneroOutputWallet::toPropertyTree();
    if (!subaddressIndices.empty()) node.add_child("subaddressIndices", MoneroUtils::toPropertyTree(subaddressIndices));
    return node;
  }

  bool MoneroOutputRequest::meetsCriteria(MoneroOutputWallet* output) const {

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
    if (txRequest != boost::none && !(*txRequest)->meetsCriteria(static_pointer_cast<MoneroTxWallet>(output->tx).get())) return false;

    // output meets request
    return true;
  }

  // ------------------------- MONERO SEND REQUEST ----------------------------

  boost::property_tree::ptree MoneroSendRequest::toPropertyTree() const {
    boost::property_tree::ptree node;
    if (!destinations.empty()) node.add_child("destinations", MoneroUtils::toPropertyTree(destinations));
    if (paymentId != boost::none) node.put("paymentId", *paymentId);
    if (priority != boost::none) node.put("priority", *priority);
    if (mixin != boost::none) node.put("mixin", *mixin);
    if (ringSize != boost::none) node.put("ringSize", *ringSize);
    if (accountIndex != boost::none) node.put("accountIndex", *accountIndex);
    if (!subaddressIndices.empty()) node.add_child("subaddressIndices", MoneroUtils::toPropertyTree(subaddressIndices));
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

  boost::property_tree::ptree MoneroIntegratedAddress::toPropertyTree() const {
    boost::property_tree::ptree node;
    node.put("standardAddress", standardAddress);
    node.put("paymentId", paymentId);
    node.put("integratedAddress", integratedAddress);
    return node;
  }

  // -------------------- MONERO KEY IMAGE IMPORT RESULT ----------------------

  boost::property_tree::ptree MoneroKeyImageImportResult::toPropertyTree() const {
    boost::property_tree::ptree node;
    if (height != boost::none) node.put("height", *height);
    if (spentAmount != boost::none) node.put("spentAmount", *spentAmount);
    if (unspentAmount != boost::none) node.put("unspentAmount", *unspentAmount);
    return node;
  }

  // ----------------------------- MONERO CHECK -------------------------------

  boost::property_tree::ptree MoneroCheck::toPropertyTree() const {
    boost::property_tree::ptree node;
    node.put("isGood", isGood);
    return node;
  }

  // --------------------------- MONERO CHECK TX ------------------------------

  boost::property_tree::ptree MoneroCheckTx::toPropertyTree() const {
    boost::property_tree::ptree node = MoneroCheck::toPropertyTree();;
    if (inTxPool != boost::none) node.put("inTxPool", *inTxPool);
    if (numConfirmations != boost::none) node.put("numConfirmations", *numConfirmations);
    if (receivedAmount != boost::none) node.put("receivedAmount", *receivedAmount);
    return node;
  }

  // ------------------------ MONERO CHECK RESERVE ----------------------------

  boost::property_tree::ptree MoneroCheckReserve::toPropertyTree() const {
    boost::property_tree::ptree node = MoneroCheck::toPropertyTree();
    if (totalAmount != boost::none) node.put("totalAmount", *totalAmount);
    if (unconfirmedSpentAmount != boost::none) node.put("unconfirmedSpentAmount", *unconfirmedSpentAmount);
    return node;
  }
}
